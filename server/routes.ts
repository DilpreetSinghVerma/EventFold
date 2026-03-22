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
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp: timestamp,
          folder: "flipbook_albums",
        },
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
        amount: 9900, // ₹99 in paise
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
      const amount = isYearly ? 399900 : 49900; // ₹3999 or ₹499 in paise

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
          await storage.updateUser(userId, {
            plan: plan === 'yearly' ? 'pro' : 'pro', // Map to your pro plan
            razorpayCustomerId: payment.customer_id
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

      // Check if user has enough credits (Bypass for admins)
      if (!isAdmin && user.credits <= 0) {
        return res.status(403).json({
          error: "No credits remaining",
          message: "Please purchase an album credit to continue."
        });
      }

      // Calculate Expiration Date
      let expiresAt: Date | null = null;
      // Admins and Pro users have no expiration
      if (!isAdmin && user.plan !== 'pro') {
        const existingAlbums = await storage.getAlbumsByUser(userId);
        const days = existingAlbums.length === 0 ? 7 : 365;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const data = insertAlbumSchema.parse({
        ...req.body,
        userId: userId,
        expiresAt: expiresAt
      });

      // Deduct credit only if NOT Admin
      if (!isAdmin) {
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

      // Check if user is the owner (if authenticated)
      const isOwner = req.isAuthenticated() && (req.user as any).id === album.userId;

      // If there's a password and user hasn't unlocked it yet (and isn't the owner)
      const albumSessionKey = `unlocked_${album.id}`;
      const isUnlocked = (req.session as any)?.[albumSessionKey] || isOwner;

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
      
      // Force columns to exist in the users table
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER NOT NULL DEFAULT 0`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT`);
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`);

      
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

  // Admin: Get all albums across platform
  app.get("/api/admin/albums", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const a = await storage.getAllAlbums();
      res.json(a);
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
      res.json(u);
    } catch (e) {
      res.status(500).json({ error: "Failed to update user role" });
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

  // (Legacy Stripe Methods removed - now using /api/billing routes)
}
