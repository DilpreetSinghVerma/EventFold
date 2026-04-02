import { eq, asc, lte, and, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAlbumSchema, insertFileSchema, users } from "../shared/schema";
import { ZodError } from "zod";
import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

let _stripe: Stripe | null = null;
const getStripe = () => {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      // Use standard API version to avoid preview-only crashes
      // @ts-ignore
      apiVersion: "2024-12-18.acacia",
    });
  }
  return _stripe;
};

const stripe = new Proxy({}, {
  get: (_target, prop) => {
    return (getStripe() as any)[prop];
  }
}) as Stripe;

// Use /tmp for uploads on Vercel, as the rest of the filesystem is read-only
const uploadDir = path.join(process.platform === 'win32' ? process.cwd() : '/tmp', "uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.error("Warning: Could not create upload directory:", e);
  }
}

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
// (You will need to add these to Vercel/Replit Environment Variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for Multer (Vercel has no writable disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase to 50MB for raw panoramic sheets
});

// Helper to upload buffer to Cloudinary
const streamUpload = (buffer: Buffer) => {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "flipbook_albums" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

export function registerRoutes(
  httpServer: Server,
  app: Express
) {
  // Get Cloudinary signature for client-side upload
  app.get("/api/cloudinary-signature", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      const params: any = {
        timestamp: timestamp,
        folder: "flipbook_albums",
      };

      // Support eager transformations for video compression if requested
      // Note: resource_type is NOT part of the signature, it's part of the URL.
      if (req.query.eager) {
        params.eager = req.query.eager;
      }

      const signature = cloudinary.utils.api_sign_request(
        params,
        process.env.CLOUDINARY_API_SECRET!
      );
      
      res.json({
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        folder: "flipbook_albums"
      });
    } catch (e) {
      res.status(500).json({ error: "Failed to generate Cloudinary signature" });
    }
  });

  // Get Business Settings
  app.get("/api/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const s = await storage.getSettings((req.user as any).id);
      res.json(s);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update Business Settings
  app.patch("/api/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      await storage.updateSettings((req.user as any).id, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Upload Business Logo
  app.post("/api/settings/logo", upload.single("logo"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "No logo file uploaded" });

      const streamUpload = (buffer: Buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "eventfold_brand",
              resource_type: "image",
              quality: "auto",
              fetch_format: "auto"
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });
      };

      const result: any = await streamUpload(req.file.buffer);
      const logoUrl = result.secure_url;
      const userId = (req.user as any).id;

      await storage.updateSettings(userId, { businessLogo: logoUrl });
      res.json({ logoUrl });
    } catch (e: any) {
      console.error("Logo upload failed:", e);
      res.status(500).json({ error: "Failed to upload logo", details: e.message });
    }
  });

  // Razorpay Billing: Buy 1 Album Credit (One-time)
  app.post("/api/billing/buy-credit", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;

      const options = {
        amount: 4900, // ₹49 in paise
        currency: "INR",
        receipt: `rct_${Date.now()}_${userId}`.slice(0, 40),
        notes: { userId, type: 'credit' }
      };

      const order = await razorpay.orders.create(options);
      res.json({ orderId: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });
    } catch (e: any) {
      console.error("Razorpay Order Error:", e);
      // Razorpay errors often contain details in a nested error object
      const errorMsg = e.description || e.error?.description || e.message || "Razorpay error";
      res.status(500).json({ error: errorMsg, details: e.error || e });
    }
  });

  // Razorpay Billing: Monthly & Yearly Subscriptions (using Orders for simplicity for now)
  app.post("/api/billing/subscribe/:plan", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const { plan } = req.params; // 'monthly' or 'yearly'

      const isYearly = plan === 'yearly';
      const amount = isYearly ? 89900 : 19900; // ₹899 or ₹199 in paise

      const options = {
        amount,
        currency: "INR",
        receipt: `rct_${Date.now()}_${user.id}`.slice(0, 40),
        notes: { userId: user.id, type: 'subscription', plan }
      };

      const order = await razorpay.orders.create(options);
      res.json({ orderId: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });
    } catch (e: any) {
      console.error("Razorpay Subscription Order Error:", e);
      const errorMsg = e.description || e.error?.description || e.message || "Razorpay error";
      res.status(500).json({ error: errorMsg, details: e.error || e });
    }
  });

  // Stripe Billing Portal Session (Keep as is or remove)
  app.post("/api/billing/portal", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;

      if (!user.stripeCustomerId) {
        return res.status(400).json({ error: "No active subscription or customer record found." });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/settings`,
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ error: "Stripe Portal error", details: e.message });
    }
  });

  // Razorpay Webhook
  app.post("/api/billing/webhook", async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_secret";
    const signature = req.headers["x-razorpay-signature"];

    try {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        return res.status(400).json({ status: "invalid signature" });
      }

      const event = req.body;
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const { userId, type, plan } = payment.notes;

        if (type === 'credit') {
          await storage.addCredit(userId, 1);
          console.log(`Credits added for user ${userId} via Razorpay`);
        } else if (type === 'subscription') {
          const isYearly = plan === 'yearly' || plan === 'elite';
          const planType = isYearly ? 'elite' : 'pro';
          
          const startedAt = new Date();
          const expiresAt = new Date();
          if (isYearly) {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }

          await storage.updateUser(userId, {
            plan: planType,
            razorpayCustomerId: payment.customer_id,
            subscriptionStartedAt: startedAt,
            subscriptionExpiresAt: expiresAt
          });

          // Make all user's albums permanent upon subscription
          const userAlbums = await storage.getAlbumsByUser(userId);
          const { db } = await import("./db");
          const { albums } = await import("../shared/schema");
          if (db) {
            await db.update(albums)
              .set({ expiresAt: null })
              .where(eq(albums.userId, userId));
          }

          console.log(`User ${userId} upgraded to ${plan} via Razorpay. Albums made permanent.`);
        }
      }

      res.json({ status: "ok" });
    } catch (err: any) {
      console.error("Webhook Error:", err);
      res.status(500).json({ error: "Webhook failed" });
    }
  });

  // Health check for cloud debugging
  app.get("/api/health", async (_req, res) => {
    try {
      const dbUrl = (process.env.DATABASE_URL || "").trim();
      const isMissing = !dbUrl || dbUrl === "" || dbUrl === "dummy_url";
      const isDummy = isMissing || dbUrl.includes("your-database-url");

      // Sanitized Diagnostic Data
      const envStatus = {
        DATABASE_URL_PRESENT: !!process.env.DATABASE_URL,
        DATABASE_URL_LENGTH: dbUrl.length,
        DATABASE_URL_START: dbUrl ? (dbUrl.substring(0, 10) + "****") : "EMPTY",
        DATABASE_URL_HAS_QUOTES: dbUrl.startsWith('"') || dbUrl.endsWith('"') || dbUrl.startsWith("'"),
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_DETECTED: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV || "unknown",
        DB_URL_CONTAINS_POSTGRES: dbUrl.toLowerCase().includes("postgres")
      };

      let dbStatus = "unknown";
      let error = null;

      if (isMissing) {
        dbStatus = "local_only";
      } else {
        try {
          // Verify connectivity with a 5s timeout
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection timeout (5s)")), 5000));
          await Promise.race([
            storage.getAlbums(),
            timeoutPromise
          ]);
          dbStatus = "connected";
        } catch (e: any) {
          console.error("DB_HEALTH_CHECK_FAILURE:", e);
          dbStatus = "disconnected";
          error = e.message || String(e);
        }
      }

      res.status(200).json({
        status: dbStatus === "connected" ? "ok" : "warning",
        database: dbStatus,
        error: error,
        env: envStatus,
        vercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || "local",
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("System health check crashed:", e);
      res.status(500).json({ status: "error", message: e.message });
    }
  });


  // Create album (Metadata only)
  app.post("/api/albums", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      const isAdmin = user.email ? adminEmails.includes(user.email) : false;
      

      const isSubscribed = user.plan !== 'free' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

      // Check if user has enough credits (Bypass for admins and active subscribers)
      if (!isAdmin && !isSubscribed && (user.credits || 0) <= 0) {
        return res.status(403).json({
          error: "No credits remaining",
          message: "Please purchase an album credit or subscribe to a plan to continue."
        });
      }

      // 7-Day Trial Logic for Free first album
      const userAlbums = await storage.getAlbumsByUser(userId);
      const isFirstFreeAlbum = user.plan === 'free' && userAlbums.length === 0;
      
      let expiresAt: Date | null = null;
      if (isFirstFreeAlbum) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
      }

      const data = insertAlbumSchema.parse({
        ...req.body,
        userId: userId,
        expiresAt: expiresAt
      });

      // Deduct credit only if NOT Admin and NOT Subscribed
      if (!isAdmin && !isSubscribed) {
        await storage.deductCredit(userId);
      }
      const album = await storage.createAlbum(data);
      res.json(album);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: "Invalid album data provided", details: e.errors });
      }
      console.error("Album creation failed:", e);
      res.status(500).json({
        message: "Album record creation failed",
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });

  // Upgrade trial album to lifetime using 1 credit
  app.post("/api/albums/:id/lifetime", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;
      const album = await storage.getAlbum(req.params.id);
      
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      if (!album.expiresAt) return res.status(400).json({ error: "Album already has lifetime hosting" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isSubscribed = user.plan !== 'free' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

      // Deduct credit ONLY IF not subscribed
      if (!isSubscribed) {
        if (user.credits <= 0) {
          return res.status(403).json({ error: "No credits remaining to upgrade this album" });
        }
        await storage.deductCredit(userId);
      }

      await storage.updateAlbum(album.id, { expiresAt: null });


      res.json({ success: true, message: "Album upgraded to Lifetime Hosting" });
    } catch (e) {
      res.status(500).json({ error: "Upgrade failed" });
    }
  });

  // Get all albums with their files
  app.get("/api/albums", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

      const userAlbums = await storage.getAlbumsByUser((req.user as any).id);

      const albumsWithFiles = await Promise.all(
        userAlbums.map(async (album: any) => {
          const files = await storage.getFilesByAlbum(album.id);
          return { ...album, files };
        })
      );
      res.json(albumsWithFiles);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch albums" });
    }
  });

  // Get single album with files
  app.get("/api/albums/:id", async (req, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ error: "Album not found" });

      // Expiry Check for Trial Albums
      const isAdminUser = req.isAuthenticated() && ((req.user as any).role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes((req.user as any).email));
      const isOwner = req.isAuthenticated() && (req.user as any).id === album.userId;
      
      const now = new Date();
      if (album.expiresAt && new Date(album.expiresAt) < now && !isOwner && !isAdminUser) {
        return res.status(403).json({ 
          error: "Trial Expired", 
          message: "This trial album has expired. Please contact the photographer or studio to renew the link." 
        });
      }

      // If there's a password and user hasn't unlocked it yet (and isn't the owner)
      const albumSessionKey = `unlocked_${album.id}`;
      const isUnlocked = (req.session as any)?.[albumSessionKey] || isOwner || isAdminUser;

      if (album.password && !isUnlocked) {
        // Return limited metadata if locked
        return res.json({
          id: album.id,
          title: album.title,
          isProtected: true,
          theme: album.theme
        });
      }

      // Increment view count for public viewers
      if (!isOwner) {
        await storage.incrementAlbumViews(album.id);
      }

      const files = await storage.getFilesByAlbum(req.params.id);
      
      // Fetch branding but only return if user is a paid customer (Subscribed or had credits)
      // Logic: If user was able to create this album, they are either an owner or viewer.
      // We check the plan of the album OWNER.
      const owner = await storage.getUser(album.userId!);
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      const isAdmin = owner?.email ? adminEmails.includes(owner.email) : false;
      const isOwnerSubscribed = owner && owner.plan !== 'free' && owner.subscriptionExpiresAt && new Date(owner.subscriptionExpiresAt) > new Date();
      // If owner is not a subscriber and was a free user when they created this (unlikely balance check), 
      // we only return branding if it's explicitly allowed. 
      // For now, let's keep it simple: subscribers & credit buyers get branding.
      // A free user has 1 credit by default. Let's say branding is for ELITE (paid).
      
      const branding = await storage.getSettings(album.userId!);
      
      // Strip password from the response for security
      const { password, ...albumSafe } = album as any;
      res.json({ ...albumSafe, files, branding, isProtected: !!album.password, isUnlocked: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch album" });
    }
  });
  
  // Get all public demo albums (No auth needed)
  app.get("/api/public-demos", async (_req, res) => {
    try {
      const demos = await storage.getPublicDemos();
      const demosWithFiles = await Promise.all(
        demos.map(async (demo: any) => {
          const files = await storage.getFilesByAlbum(demo.id);
          const branding = await storage.getSettings(demo.userId!);
          return { ...demo, files, branding };
        })
      );
      res.json(demosWithFiles);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch public demos" });
    }
  });

  // Admin: Mark album as public demo
  app.patch("/api/albums/:id/demo-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"]; // Add user emails here
      if (!adminEmails.includes((req.user as any).email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const { isPublicDemo, demoCategory } = req.body;
      const album = await storage.updateAlbum(req.params.id, { 
        isPublicDemo: isPublicDemo ? 'true' : 'false',
        demoCategory 
      });
      res.json(album);
    } catch (e) {
      res.status(500).json({ error: "Failed to update demo status" });
    }
  });

  // Admin: Sync Database Schema (Runs drizzle-kit push)
  app.post("/api/admin/db-sync", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (!adminEmails.includes((req.user as any).email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      console.log("ADMIN: Starting Direct SQL Database Sync...");
      
      // Force columns to exist in the albums table
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_public_demo TEXT NOT NULL DEFAULT 'false'`);
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS demo_category TEXT`);
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS bg_music_url TEXT`);
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Uncategorized'`);
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS total_engagement_time INTEGER NOT NULL DEFAULT 0`);
      await db.execute(sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS show_in_portfolio INTEGER NOT NULL DEFAULT 0`);
      
      // Force columns to exist in the users table
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER NOT NULL DEFAULT 0`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`);
      
      // Force columns to exist in the files table
      await db.execute(sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0`);
      await db.execute(sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0`);

      
      console.log("DB Sync Success: Columns added/verified via SQL.");
      res.json({ success: true, message: "Database columns verified/added successfully." });
    } catch (e: any) {
      console.error("Direct DB Sync Error:", e);
      res.status(500).json({ error: "Sync failed", details: e.message });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const u = await storage.getUsers();
      res.json(u);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin: Delete user
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Add credits to user
  app.post("/api/admin/users/:id/credits", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const { amount } = req.body;
      const u = await storage.addCredit(req.params.id, amount || 1);
      res.json(u);
    } catch (e) {
      res.status(500).json({ error: "Failed to add credits" });
    }
  });

  // Album: Toggle Portfolio Visibility
  app.patch("/api/albums/:id/portfolio-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const { showInPortfolio } = req.body;
      const album = await storage.updateAlbum(req.params.id, { 
        showInPortfolio: showInPortfolio ? 1 : 0
      });
      res.json(album);
    } catch (e) {
      res.status(500).json({ error: "Failed to update portfolio visibility" });
    }
  });

  // Admin: Get all albums across platform (with cover thumbnails)
  app.get("/api/admin/albums", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const a = await storage.getAllAlbums();
      // Attach cover thumbnail for each album
      const albumsWithCovers = await Promise.all(
        a.map(async (album) => {
          const files = await storage.getFilesByAlbum(album.id);
          const coverFile = files.find(f => f.fileType === 'cover_front');
          return { ...album, coverUrl: coverFile?.filePath || null, fileCount: files.filter(f => f.fileType === 'sheet').length };
        })
      );
      res.json(albumsWithCovers);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch all albums" });
    }
  });

  // Admin: Change user role
  app.patch("/api/admin/users/:id/role", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const { role, plan } = req.body;
      let subscriptionExpiresAt = undefined;
      let subscriptionStartedAt = undefined;
      
      if (plan === 'pro' || plan === 'elite') {
        const d = new Date();
        subscriptionStartedAt = d;
        
        if (plan === 'pro') {
          const exp = new Date();
          exp.setDate(exp.getDate() + 30);
          subscriptionExpiresAt = exp;
        } else {
          const exp = new Date();
          exp.setFullYear(exp.getFullYear() + 1);
          subscriptionExpiresAt = exp;
        }
      } else if (plan === 'free') {
        subscriptionExpiresAt = null;
        subscriptionStartedAt = null;
      }

      const u = await storage.updateUser(req.params.id, { role, plan, subscriptionStartedAt, subscriptionExpiresAt });
      
      // If upgraded to paid plan, make all existing albums permanent
      if (plan === 'pro' || plan === 'elite') {
        const userAlbums = await storage.getAlbumsByUser(req.params.id);
        const { db } = await import("./db");
        const { albums } = await import("../shared/schema");
        if (db) {
          await db.update(albums)
            .set({ expiresAt: null })
            .where(eq(albums.userId, req.params.id));
        }
        console.log(`Admin upgraded user ${req.params.id} to ${plan}. All albums made permanent.`);
      }

      res.json(u);
    } catch (e) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Admin: Dispatch Expiry Reminders (7-day window check)
  app.post("/api/admin/dispatch-reminders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "High-level clearing required" });
      }

      const allUsers = await storage.getUsers();
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 8);
      const sixDaysFromNow = new Date();
      sixDaysFromNow.setDate(now.getDate() + 6);

      let sentCount = 0;
      const { sendSubscriptionReminder } = await import("./lib/email");

      for (const u of allUsers) {
        if (u.subscriptionExpiresAt && u.plan !== 'free') {
          const expiry = new Date(u.subscriptionExpiresAt);
          if (expiry > sixDaysFromNow && expiry < sevenDaysFromNow) {
            await sendSubscriptionReminder(u.email, 7, u.plan);
            sentCount++;
          }
        }
      }

      res.json({ success: true, count: sentCount });
    } catch (e) {
      console.error("Reminder dispatch failed:", e);
      res.status(500).json({ error: "Failed to dispatch reminders" });
    }
  });


  // Update album metadata
  app.patch("/api/albums/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updatedAlbum = await storage.updateAlbum(req.params.id, req.body);
      res.json(updatedAlbum);
    } catch (e) {
      res.status(500).json({ error: "Failed to update album" });
    }
  });

  // Track Slide View (Analytics)
  app.post("/api/files/:id/view", async (req, res) => {
    try {
      await storage.incrementFileViews(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to track view" });
    }
  });

  // Track Album Engagement (Timer)
  app.post("/api/albums/:id/engage", async (req, res) => {
    try {
      const { seconds } = req.body;
      if (typeof seconds !== 'number') return res.status(400).json({ error: "Invalid duration" });
      await storage.incrementEngagementTime(req.params.id, seconds);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to track duration" });
    }
  });

  // Re-arrange album sheets
  app.patch("/api/albums/:id/files/order", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { fileOrders } = req.body; // Array of { id: string, orderIndex: number }
      if (!Array.isArray(fileOrders)) return res.status(400).json({ error: "Invalid order data" });

      await Promise.all(
        fileOrders.map((f: any) => storage.updateFile(f.id, { orderIndex: f.orderIndex }))
      );

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update sheet order" });
    }
  });


  // Unlock protected album
  app.post("/api/albums/:id/unlock", async (req, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ error: "Album not found" });

      if (!album.password || req.body.password === album.password) {
        (req.session as any)[`unlocked_${album.id}`] = true;
        return res.json({ success: true });
      }

      res.status(401).json({ error: "Incorrect password" });
    } catch (e) {
      res.status(500).json({ error: "Unlock failed" });
    }
  });

  // Delete album (Clean up database)
  app.delete("/api/albums/:id", async (req, res) => {
    try {
      // NOTE: In a real app, you would also delete images from Cloudinary here
      await storage.deleteFilesByAlbum(req.params.id);
      await storage.deleteAlbum(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete album" });
    }
  });

  // Upload files (Supports both Direct Binary Upload & Meta-only Metadata)
  // We move multer INSIDE to allow JSON requests to pass through without being blocked
  app.post("/api/albums/:albumId/files", (req, res, next) => {
    // If it's a JSON batch from the client uploader, skip Multer
    if (req.headers["content-type"]?.includes("application/json")) {
      return next();
    }
    // Otherwise, use Multer for binary fallback
    upload.array("files", 100)(req, res, next);
  }, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      // HANDLE JSON BATCH UPLOAD (From Client-side direct Cloudinary uploads)
      if (req.body && req.body.files && Array.isArray(req.body.files)) {
        console.log(`Syncing ${req.body.files.length} remote assets from client for album ${req.params.albumId}`);
        const results = await Promise.all(
          req.body.files.map(async (f: any) => {
            return await storage.createFile({
              albumId: req.params.albumId,
              filePath: f.filePath,
              fileType: f.fileType || "sheet",
              orderIndex: f.orderIndex ?? 0,
            });
          })
        );
        return res.json(results);
      }

      // FALLBACK TO MULTIPART BINARY UPLOAD 
      const multerFiles = req.files as Express.Multer.File[];
      if (!multerFiles || multerFiles.length === 0) {
        return res.status(400).json({ error: "Sync Error: No data received. Use application/json for batch sync or multipart for direct upload." });
      }

      console.log(`Processing direct binary upload: ${multerFiles.length} files`);
      const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      const startTime = Date.now();

      // Parallel processing with Concurrency Control (Batches of 5)
      const CONCURRENCY_LIMIT = 5;
      const uploadResults: any[] = [];

      for (let i = 0; i < multerFiles.length; i += CONCURRENCY_LIMIT) {
        const chunk = multerFiles.slice(i, i + CONCURRENCY_LIMIT);
        const chunkResults = await Promise.all(
          chunk.map(async (file, indexInChunk) => {
            const globalIndex = i + indexInChunk;
            const fileType = req.body[`fileType_${globalIndex}`] || "sheet";
            let bufferToUpload = file.buffer;

            // Optional Compression logic (Safe import for serverless)
            if (file.size > 5 * 1024 * 1024) {
              try {
                const sharp = (await import('sharp')).default;
                bufferToUpload = await sharp(file.buffer)
                  .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
                  .jpeg({ quality: 80 })
                  .toBuffer();
              } catch (se) { /* skip compression */ }
            }

            let filePath = "";
            if (useCloudinary) {
              const cloudinaryResult = await streamUpload(bufferToUpload);
              filePath = cloudinaryResult.secure_url;
            } else {
              const filename = `${req.params.albumId}_${Date.now()}_${globalIndex}${path.extname(file.originalname)}`;
              const localPath = path.join(uploadDir, filename);
              fs.writeFileSync(localPath, file.buffer);
              filePath = `/uploads/${filename}`;
            }

            return await storage.createFile({
              albumId: req.params.albumId,
              filePath,
              fileType,
              orderIndex: globalIndex,
            });
          })
        );
        uploadResults.push(...chunkResults);
      }

      res.json(uploadResults);
    } catch (e) {
      console.error("Critical upload failure:", e);
      res.status(500).json({
        error: "Server synchronization failed",
        message: e instanceof Error ? e.message : "Internal error"
      });
    }
  });


  // Serve uploaded files
  app.get("/uploads/:filename", (req, res) => {
    const filePath = path.join(uploadDir, path.basename(req.params.filename));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.sendFile(filePath);
  });

  // Admin: Get Cloudinary Storage Usage
  app.get("/api/admin/cloud-usage", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      // Call Cloudinary Admin API for usage stats
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ error: "Cloudinary credentials not configured" });
      }

      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      const usageRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
        {
          headers: { Authorization: `Basic ${auth}` }
        }
      );

      if (!usageRes.ok) {
        const errText = await usageRes.text();
        console.error("Cloudinary API error:", errText);
        return res.status(500).json({ error: "Failed to fetch Cloudinary usage", details: errText });
      }

      const usage = await usageRes.json();

      // Count platform assets (albums + files in DB)
      const allAlbums = await storage.getAllAlbums();
      let totalFiles = 0;
      for (const album of allAlbums) {
        const files = await storage.getFilesByAlbum(album.id);
        totalFiles += files.length;
      }

      res.json({
        cloudinary: {
          plan: usage.plan,
          last_updated: usage.last_updated,
          storage: {
            used_bytes: usage.storage?.usage || 0,
            limit_bytes: usage.storage?.credits_usage !== undefined ? usage.storage.credits_usage : null,
            used_percent: usage.storage?.used_percent || 0,
          },
          bandwidth: {
            used_bytes: usage.bandwidth?.usage || 0,
            limit_bytes: usage.bandwidth?.limit || 0,
            used_percent: usage.bandwidth?.used_percent || 0,
          },
          transformations: {
            used: usage.transformations?.usage || 0,
            limit: usage.transformations?.limit || 0,
            used_percent: usage.transformations?.used_percent || 0,
          },
          objects: {
            used: usage.objects?.usage || 0,
            limit: usage.objects?.limit || 0,
            used_percent: usage.objects?.used_percent || 0,
          },
          resources: usage.resources || 0,
          derived_resources: usage.derived_resources || 0,
        },
        platform: {
          total_albums: allAlbums.length,
          total_files: totalFiles,
        }
      });
    } catch (e: any) {
      console.error("Cloud usage fetch failed:", e);
      res.status(500).json({ error: "Failed to fetch cloud usage", details: e.message });
    }
  });

  // Public: Submit album rating (Feedback Collector)
  app.post("/api/albums/:id/rate", async (req, res) => {
    try {
      const { rating } = req.body;
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be 1-5" });
      }
      const album = await storage.getAlbum(req.params.id);
      if (!album) return res.status(404).json({ error: "Album not found" });

      const currentTotal = album.totalRatings || 0;
      const currentAvg = album.avgRating || 0;
      // avgRating is stored as 0-50 (multiply by 10 for precision)
      const ratingScaled = rating * 10;
      const newTotal = currentTotal + 1;
      const newAvg = Math.round((currentAvg * currentTotal + ratingScaled) / newTotal);

      await storage.updateAlbum(req.params.id, { avgRating: newAvg, totalRatings: newTotal });
      res.json({ success: true, avgRating: newAvg / 10, totalRatings: newTotal });
    } catch (e) {
      res.status(500).json({ error: "Failed to submit rating" });
    }
  });

  // Admin: Storage Cleanup Scanner (find orphan files in Cloudinary)
  app.get("/api/admin/storage-cleanup", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ error: "Cloudinary credentials not configured" });
      }

      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

      // Fetch all Cloudinary resources (images + videos)
      let allCloudResources: any[] = [];
      let nextCursor: string | undefined;

      // Paginate through all resources
      for (let page = 0; page < 10; page++) {
        const params = new URLSearchParams({ max_results: '500' });
        if (nextCursor) params.append('next_cursor', nextCursor);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params}`,
          { headers: { Authorization: `Basic ${auth}` } }
        );

        if (!cloudRes.ok) break;
        const data = await cloudRes.json();
        allCloudResources.push(...(data.resources || []));
        nextCursor = data.next_cursor;
        if (!nextCursor) break;
      }

      // Also fetch video resources
      nextCursor = undefined;
      for (let page = 0; page < 5; page++) {
        const params = new URLSearchParams({ max_results: '500', resource_type: 'video' });
        if (nextCursor) params.append('next_cursor', nextCursor);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/video?${params}`,
          { headers: { Authorization: `Basic ${auth}` } }
        );

        if (!cloudRes.ok) break;
        const data = await cloudRes.json();
        allCloudResources.push(...(data.resources || []));
        nextCursor = data.next_cursor;
        if (!nextCursor) break;
      }

      // Get all file paths from database
      const allAlbums = await storage.getAllAlbums();
      const allDbPaths = new Set<string>();
      for (const album of allAlbums) {
        const files = await storage.getFilesByAlbum(album.id);
        for (const f of files) {
          // Extract the public_id or base URL from stored path
          allDbPaths.add(f.filePath);
        }
      }

      // Find orphans (in Cloudinary but not in any album)
      const orphans = allCloudResources.filter(r => {
        const secureUrl = r.secure_url;
        // Check if any DB path contains this resource's public_id
        let found = false;
        allDbPaths.forEach(dbPath => {
          if (dbPath.includes(r.public_id) || secureUrl === dbPath) {
            found = true;
          }
        });
        return !found;
      });

      const orphanSize = orphans.reduce((acc: number, r: any) => acc + (r.bytes || 0), 0);

      res.json({
        total_cloud_resources: allCloudResources.length,
        total_db_files: allDbPaths.size,
        orphan_count: orphans.length,
        orphan_size_bytes: orphanSize,
        orphans: orphans.slice(0, 50).map(r => ({
          public_id: r.public_id,
          url: r.secure_url,
          format: r.format,
          bytes: r.bytes,
          created_at: r.created_at,
          resource_type: r.resource_type,
        })),
      });
    } catch (e: any) {
      console.error("Storage cleanup scan failed:", e);
      res.status(500).json({ error: "Cleanup scan failed", details: e.message });
    }
  });

  // Admin: Delete orphan file from Cloudinary
  app.delete("/api/admin/storage-cleanup/:publicId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      const publicId = decodeURIComponent(req.params.publicId);

      const delRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?public_ids=${encodeURIComponent(publicId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Basic ${auth}` }
        }
      );

      if (!delRes.ok) {
        return res.status(500).json({ error: "Failed to delete from Cloudinary" });
      }

      res.json({ success: true, deleted: publicId });
    } catch (e: any) {
      res.status(500).json({ error: "Delete failed", details: e.message });
    }
  });

  // (Legacy Stripe Methods removed - now using /api/billing routes)
}
