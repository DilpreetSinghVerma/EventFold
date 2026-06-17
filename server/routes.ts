import { eq, asc, desc, lte, and, isNotNull, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAlbumSchema, insertFileSchema, users, albums, files, broadcasts, referrals } from "../shared/schema";
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

// ☁️ Smart Cloudinary Manager — Auto-rotates between multiple free accounts
// Silently switches accounts when one hits quota limit (>80% usage)
// ☁️ Smart Cloudinary Manager — Auto-rotates between multiple free accounts
// Silently switches accounts when one hits quota limit (>80% usage)
import { cloudinaryManager } from "./lib/cloudinary-manager";
import { generatePresignedUrl, uploadBufferToR2, listR2BucketStats } from "./lib/s3-client";

// Use memory storage for Multer (Vercel has no writable disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // Increase to 50MB for raw panoramic sheets
});

// Helper to upload buffer — uses CloudinaryManager for auto account rotation
const streamUpload = (buffer: Buffer, options: any = {}) => {
  return cloudinaryManager.uploadBuffer(buffer, {
    folder: "flipbook_albums",
    resource_type: "auto",
    ...options,
  });
};

export function registerRoutes(
  httpServer: Server,
  app: Express
) {
  // Get Cloudinary signature for client-side upload (Legacy/Fallback)
  // CloudinaryManager automatically picks the best available account
  app.get("/api/cloudinary-signature", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const timestamp = Math.round(new Date().getTime() / 1000);

      const params: any = {
        timestamp,
        folder: "flipbook_albums",
      };

      if (req.query.eager) {
        params.eager = req.query.eager;
      }

      // Auto-selects best available account
      const signatureData = await cloudinaryManager.getSignature(params);
      res.json(signatureData);
    } catch (e) {
      res.status(500).json({ error: "Failed to generate Cloudinary signature" });
    }
  });

  // Get S3 Presigned URL for direct browser-to-R2 uploads
  app.post("/api/s3-presigned-url", express.json(), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      const { folder = "albums", contentType } = req.body;
      if (!contentType) return res.status(400).json({ error: "Content type is required" });

      const presignedData = await generatePresignedUrl(folder, contentType);
      res.json(presignedData);
    } catch (e: any) {
      console.error("Failed to generate presigned URL:", e);
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  });

  // Admin: View all Cloudinary account usage at a glance
  app.get("/api/admin/cloudinary-status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      if (user.role !== 'admin' && user.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const report = await cloudinaryManager.getStatusReport();
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: "Failed to fetch Cloudinary status", details: e.message });
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

  // Get Referral Stats and History
  app.get("/api/referrals/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const referralsList = await storage.getReferralsByReferrer(userId);
      
      const totalReferred = referralsList.length;
      const pendingCount = referralsList.filter(r => r.status === 'joined').length;
      const verifiedCount = referralsList.filter(r => r.status === 'verified').length;
      const completedCount = referralsList.filter(r => r.status === 'completed').length;
      const rewardedCount = referralsList.filter(r => r.status === 'rewarded').length;

      const nextRewardProgress = completedCount % 2; 
      const totalCreditsEarned = Math.floor(rewardedCount / 2);

      const resolvedReferrals = await Promise.all(referralsList.map(async (r) => {
        const refereeUser = await storage.getUser(r.refereeId);
        return {
          id: r.id,
          email: refereeUser ? refereeUser.email : 'Unknown',
          name: refereeUser ? (refereeUser.name || refereeUser.email.split('@')[0]) : 'User Joined',
          status: r.status,
          createdAt: r.createdAt
        };
      }));

      res.json({
        success: true,
        referralCode: user.referralCode || '',
        totalReferred,
        pendingCount,
        verifiedCount,
        completedCount,
        rewardedCount,
        nextRewardProgress,
        totalCreditsEarned,
        referrals: resolvedReferrals
      });
    } catch (e: any) {
      console.error("Failed to fetch referral stats:", e);
      res.status(500).json({ error: "Failed to fetch referral statistics" });
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

  // Upload Business Logo — uses Cloudflare R2
  app.post("/api/settings/logo", upload.single("logo"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "No logo file uploaded" });

      const logoUrl = await uploadBufferToR2(
        req.file.buffer,
        "eventfold_brand",
        req.file.mimetype
      );
      const userId = (req.user as any).id;

      await storage.updateSettings(userId, { businessLogo: logoUrl });
      res.json({ logoUrl });
    } catch (e: any) {
      console.error("Logo upload failed:", e);
      res.status(500).json({ error: "Failed to upload logo", details: e.message });
    }
  });

  // Upload custom client logo for a specific album (Lab Owners)
  app.post("/api/albums/:id/client-logo", upload.single("logo"), async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "No logo file uploaded" });

      const albumId = req.params.id;
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes((req.user as any).email || "");

      const album = await storage.getAlbum(albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== userId && !isAdmin) return res.status(403).json({ error: "Forbidden" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isLabPlan = ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(user.plan) || isAdmin;
      if (!isLabPlan) {
        return res.status(403).json({ error: "Lab Owner plan required to set custom album branding" });
      }

      // 1. Upload logo buffer to R2 first (non-transactional)
      const logoUrl = await uploadBufferToR2(
        req.file.buffer,
        "eventfold_brand",
        req.file.mimetype
      );

      let creditDeducted = false;

      // Closure of loophole: Deduct credit and upgrade the album if it is a personal album and user is a Lab owner
      if (album.isLabAlbum !== 1 && !isAdmin) {
        // Try to deduct credit atomically
        const [updatedUser] = await db.update(users)
          .set({ credits: sql`${users.credits} - 1` })
          .where(and(eq(users.id, userId), gt(users.credits, 0)))
          .returning();

        if (!updatedUser) {
          return res.status(403).json({ error: "No credits remaining to upgrade this album to a Lab album" });
        }
        creditDeducted = true;
      }

      // Try to upgrade album atomically
      let updatedAlbum;
      if (creditDeducted) {
        const [row] = await db.update(albums)
          .set({ customBusinessLogo: logoUrl, isLabAlbum: 1 })
          .where(and(eq(albums.id, albumId), eq(albums.isLabAlbum, 0)))
          .returning();
        
        updatedAlbum = row;

        if (!updatedAlbum) {
          // Revert/refund credit because concurrent request already upgraded it
          await db.update(users)
            .set({ credits: sql`${users.credits} + 1` })
            .where(eq(users.id, userId));
          
          // Since it's already upgraded, we can update it now without charging credit
          const [row2] = await db.update(albums)
            .set({ customBusinessLogo: logoUrl })
            .where(eq(albums.id, albumId))
            .returning();
          updatedAlbum = row2;
        }
      } else {
        // Regular update (already upgraded or admin)
        const [row] = await db.update(albums)
          .set({ customBusinessLogo: logoUrl, isLabAlbum: 1 })
          .where(eq(albums.id, albumId))
          .returning();
        updatedAlbum = row;
      }

      res.json({ logoUrl, album: updatedAlbum });
    } catch (e: any) {
      console.error("Client logo upload failed:", e);
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
      const { plan } = req.params;

      let amount = 19900; // default Pro Monthly (₹199)
      if (plan === 'yearly') {
        amount = 89900; // Elite Yearly (₹899)
      } else if (plan === 'lab_monthly') {
        amount = 96000; // Lab Monthly (₹960 - 20% discount from ₹1200)
      } else if (plan === 'lab_half_yearly') {
        amount = 480000; // Lab Half-Yearly (₹4800 - 20% discount from ₹6000)
      } else if (plan === 'lab_yearly') {
        amount = 960000; // Lab Yearly (₹9600 - 20% discount from ₹12000)
      }

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

      // Instantly return 200 OK to Razorpay to prevent timeouts and duplicate webhook retries
      res.json({ status: "ok" });

      // Run database updates and subscription provisioning asynchronously in the background
      (async () => {
        if (event.event === "payment.captured") {
          const payment = event.payload.payment.entity;
          const { userId, type, plan } = payment.notes;

          if (type === 'credit') {
            await storage.addCredit(userId, 1);
            console.log(`[WEBHOOK] Credits added for user ${userId} via Razorpay`);
          } else if (type === 'subscription') {
            let planType = plan; // e.g. 'pro', 'elite', 'lab_monthly', 'lab_half_yearly', 'lab_yearly'
            const isYearly = plan === 'yearly' || plan === 'elite';
            if (isYearly) {
              planType = 'elite';
            } else if (plan === 'monthly') {
              planType = 'pro';
            }
            
            const startedAt = new Date();
            const expiresAt = new Date();
            let creditsToAdd = 0;

            if (planType === 'elite' || planType === 'lab_yearly') {
              expiresAt.setFullYear(expiresAt.getFullYear() + 1);
              if (planType === 'lab_yearly') creditsToAdd = 600;
            } else if (planType === 'lab_half_yearly') {
              expiresAt.setDate(expiresAt.setDate() + 180);
              creditsToAdd = 300;
            } else if (planType === 'lab_monthly') {
              expiresAt.setDate(expiresAt.setDate() + 30);
              creditsToAdd = 50;
            } else { // pro
              expiresAt.setDate(expiresAt.setDate() + 30);
            }

            const userToUpdate: any = {
              plan: planType,
              razorpayCustomerId: payment.customer_id,
              subscriptionStartedAt: startedAt,
              subscriptionExpiresAt: expiresAt
            };

            if (creditsToAdd > 0) {
              const currentUser = await storage.getUser(userId);
              userToUpdate.credits = (currentUser?.credits || 0) + creditsToAdd;
            }

            await storage.updateUser(userId, userToUpdate);

            // Make all user's albums permanent upon subscription
            const userAlbums = await storage.getAlbumsByUser(userId);
            const { db } = await import("./db");
            const { albums } = await import("../shared/schema");
            if (db) {
              await db.update(albums)
                .set({ expiresAt: null })
                .where(eq(albums.userId, userId));
            }

            console.log(`[WEBHOOK] User ${userId} upgraded to ${plan} via Razorpay. Albums made permanent.`);
          }
        }
      })().catch(err => {
        console.error("[WEBHOOK] Background execution failed:", err);
      });

    } catch (err: any) {
      console.error("Webhook Signature Verification Error:", err);
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

      // Studio name is required before any album can be created.
      // Validated: must be 4+ chars and contain at least 2 real letters.
      // Prevents bypassing with ".", "xyz", "123", or other junk inputs.
      if (!isAdmin) {
        const studioSettings = await storage.getSettings(userId);
        const rawName = studioSettings?.businessName?.trim() ?? '';
        const letterCount = (rawName.match(/[a-zA-Z]/g) || []).length;
        const hasStudioName =
          rawName !== '' &&
          rawName !== 'EventFold Studio' &&
          rawName.length >= 4 &&
          letterCount >= 2;
        if (!hasStudioName) {
          return res.status(403).json({
            error: "Studio name required",
            message: "Please set a valid studio name (at least 4 characters with real letters) before creating an album.",
            code: "STUDIO_NAME_REQUIRED"
          });
        }
      }

      const isLabPlan = ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(user.plan || '') || isAdmin;
      const isCreatingLabAlbum = req.body.isLabAlbum === 1;

      if (isCreatingLabAlbum && !isLabPlan && !isAdmin) {
        return res.status(403).json({ error: "Lab subscription required to create Lab albums" });
      }

      // Check daily album creation limit (Max 3 per day, bypass for admins and Lab albums)
      if (!isAdmin && !isCreatingLabAlbum) {
        const userAlbums = await storage.getAlbumsByUser(userId);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const albumsCreatedToday = userAlbums.filter(album => {
          const createdDate = new Date(album.createdAt);
          return createdDate >= startOfToday;
        });

        if (albumsCreatedToday.length >= 3) {
          return res.status(429).json({
            error: "Daily limit reached",
            message: "To prevent abuse, you can only create up to 3 albums per day. Please try again tomorrow."
          });
        }
      }

      // Check if user has enough credits:
      // - Free/unsubscribed users: must have credits
      // - Lab album creation: must have credits (Lab plans are credit-capped)
      // - Admin/Pro/Elite/Personal creations: unlimited (bypass credit check)
      const needsCredits = !isAdmin && (user.plan === 'free' || isCreatingLabAlbum);
      if (needsCredits && (user.credits || 0) <= 0) {
        return res.status(403).json({
          error: "No credits remaining",
          message: isCreatingLabAlbum
            ? "Your Lab subscription has run out of credits. Please renew or purchase extra credits to continue."
            : "Please purchase an album credit or subscribe to a plan to continue."
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
        expiresAt: expiresAt,
        isLabAlbum: isCreatingLabAlbum ? 1 : 0
      });

      // Deduct credit if required (for Free/unsubscribed users or Lab Owners)
      if (needsCredits) {
        await storage.deductCredit(userId);
      }
      const album = await storage.createAlbum(data);

      // Referral System Trigger: Check if this is the referee's first album creation
      let referralCreditGranted = false;
      try {
        const refereeReferral = await storage.getReferralByReferee(userId);
        if (refereeReferral && ['joined', 'verified'].includes(refereeReferral.status)) {
          // Update status to 'completed' since they've now created their first album!
          await storage.updateReferral(refereeReferral.id, { status: 'completed' });
          await storage.addCredit(userId, 1);
          referralCreditGranted = true;

          const referrerId = refereeReferral.referrerId;
          // Concurrency-safe atomic check
          const completedReferrals = await db.select().from(referrals)
            .where(and(eq(referrals.referrerId, referrerId), eq(referrals.status, 'completed')))
            .limit(2);

          if (completedReferrals.length === 2) {
            // Atomic update matching only these specific rows to avoid double-claiming
            const updatedRows = await db.update(referrals)
              .set({ status: 'rewarded' })
              .where(and(
                inArray(referrals.id, [completedReferrals[0].id, completedReferrals[1].id]),
                eq(referrals.status, 'completed')
              ))
              .returning();

            // Reward the referrer ONLY if exactly 2 rows were successfully set to 'rewarded' by this thread
            if (updatedRows.length === 2) {
              await storage.addCredit(referrerId, 1);
              
              // Send congratulatory email to the referrer
              const referrerUser = await storage.getUser(referrerId);
              if (referrerUser && referrerUser.email) {
                import("./lib/email").then(({ sendReferralRewardEmail }) => {
                  sendReferralRewardEmail(referrerUser.email, referrerUser.name || referrerUser.email).catch(err => {
                    console.error("Failed to send referral reward email:", err);
                  });
                }).catch(err => {
                  console.error("Failed to dynamically import email library for referral reward:", err);
                });
              }
            }
          }
        }
      } catch (refErr) {
        console.error("Failed to process referral triggers:", refErr);
      }
      
      // Send Album Published confirmation email in the background
      import("./lib/email").then(({ sendAlbumPublishedEmail }) => {
        sendAlbumPublishedEmail(user.email, album.title, album.id).catch(err => {
          console.error("Failed to send album published email in background:", err);
        });
      }).catch(err => {
        console.error("Failed to dynamically import email library for creation alert:", err);
      });

      res.json({
        ...album,
        referralCreditGranted
      });
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
      const albumId = req.params.id;

      const album = await storage.getAlbum(albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      if (!album.expiresAt) return res.status(400).json({ error: "Album already has lifetime hosting" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const isSubscribed = user.plan !== 'free' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date();

      let creditDeducted = false;

      // Deduct credit ONLY IF not subscribed
      if (!isSubscribed) {
        // Try to deduct credit atomically
        const [updatedUser] = await db.update(users)
          .set({ credits: sql`${users.credits} - 1` })
          .where(and(eq(users.id, userId), gt(users.credits, 0)))
          .returning();

        if (!updatedUser) {
          return res.status(403).json({ error: "No credits remaining to upgrade this album" });
        }
        creditDeducted = true;
      }

      // Try to atomically upgrade the album (only if it has not already been upgraded by a concurrent request)
      const [updatedAlbum] = await db.update(albums)
        .set({ expiresAt: null })
        .where(and(eq(albums.id, albumId), eq(albums.userId, userId), isNotNull(albums.expiresAt)))
        .returning();

      if (!updatedAlbum) {
        if (creditDeducted) {
          // Refund the credit
          await db.update(users)
            .set({ credits: sql`${users.credits} + 1` })
            .where(eq(users.id, userId));
        }
        return res.status(400).json({ error: "Album already has lifetime hosting" });
      }

      res.json({ success: true, message: "Album upgraded to Lifetime Hosting" });
    } catch (e) {
      console.error("Upgrade to lifetime failed:", e);
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
      
      // Override branding with album-specific custom values if configured (by Lab Owners)
      const brandingCopy = { ...branding };
      if (album.customBusinessName) {
        brandingCopy.businessName = album.customBusinessName;
      }
      if (album.customBusinessLogo) {
        brandingCopy.businessLogo = album.customBusinessLogo;
      }
      if (album.customContactWhatsApp) {
        brandingCopy.contactWhatsApp = album.customContactWhatsApp;
      }
      
      // Strip password from the response for security
      const { password, ...albumSafe } = album as any;
      res.json({ ...albumSafe, files, branding: brandingCopy, isProtected: !!album.password, isUnlocked: true });
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
      
      if (['pro', 'elite', 'lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(plan)) {
        const d = new Date();
        subscriptionStartedAt = d;
        
        const exp = new Date();
        if (plan === 'pro' || plan === 'lab_monthly') {
          exp.setDate(exp.getDate() + 30);
        } else if (plan === 'lab_half_yearly') {
          exp.setDate(exp.getDate() + 180);
        } else if (plan === 'lab_unlimited') {
          exp.setFullYear(exp.getFullYear() + 10);
        } else { // elite, lab_yearly
          exp.setFullYear(exp.getFullYear() + 1);
        }
        subscriptionExpiresAt = exp;
      } else if (plan === 'free') {
        subscriptionExpiresAt = null;
        subscriptionStartedAt = null;
      }

      const u = await storage.updateUser(req.params.id, { role, plan, subscriptionStartedAt, subscriptionExpiresAt });
      
      // If upgraded to paid plan, make all existing albums permanent
      if (['pro', 'elite', 'lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(plan)) {
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

  // Admin: Broadcast Email to cohorts or custom lists of leads
  app.post("/api/admin/broadcast-email", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const adminUser = req.user as any;
      if (adminUser.role !== 'admin' && adminUser.email !== 'dilpreetsinghverma@gmail.com') {
        return res.status(403).json({ error: "High-level clearing required" });
      }

      const { subject, message, target, customEmails } = req.body;
      if (!subject || !message || !target) {
        return res.status(400).json({ error: "Subject, message, and target cohort are required." });
      }

      let emailsToNotify: string[] = [];

      if (target === 'custom') {
        if (!Array.isArray(customEmails)) {
          return res.status(400).json({ error: "customEmails array is required when target is custom." });
        }
        emailsToNotify = customEmails
          .map(e => e.trim().toLowerCase())
          .filter(e => e.includes('@') && e.length > 3);
      } else {
        const allUsers = await storage.getUsers();
        if (target === 'all') {
          emailsToNotify = allUsers.map(u => u.email);
        } else if (target === 'free') {
          emailsToNotify = allUsers.filter(u => u.plan === 'free').map(u => u.email);
        } else if (target === 'photographers') {
          emailsToNotify = allUsers.filter(u => ['pro', 'elite'].includes(u.plan)).map(u => u.email);
        } else if (target === 'labs') {
          emailsToNotify = allUsers.filter(u => ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(u.plan)).map(u => u.email);
        }
      }

      // De-duplicate emails
      emailsToNotify = Array.from(new Set(emailsToNotify));

      if (emailsToNotify.length === 0) {
        return res.json({ success: true, count: 0, message: "No recipients match the target cohort." });
      }

      console.log(`[BROADCAST] Starting email broadcast of "${subject}" to ${emailsToNotify.length} targets.`);
      const { sendPromotionalEmail } = await import("./lib/email");

      // Execute dispatch in background (non-blocking)
      (async () => {
        for (let i = 0; i < emailsToNotify.length; i++) {
          const email = emailsToNotify[i];
          try {
            await sendPromotionalEmail(email, subject, message);
            // Throttle 500ms to be safe with SMTP servers
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error(`[BROADCAST] Failed to send to ${email}:`, err);
          }
        }
        console.log(`[BROADCAST] Completed email broadcast of "${subject}" to ${emailsToNotify.length} targets.`);
      })().catch(err => {
        console.error("[BROADCAST] Background error in queue loop:", err);
      });

      res.json({ success: true, count: emailsToNotify.length, message: `Broadcast started in the background to ${emailsToNotify.length} recipients.` });
    } catch (e) {
      console.error("Broadcast failed:", e);
      res.status(500).json({ error: "Failed to start email broadcast" });
    }
  });


  // Update album metadata
  app.patch("/api/albums/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const albumId = req.params.id;
      const userId = (req.user as any).id;
      const isAdmin = (req.user as any).role === 'admin' || ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"].includes((req.user as any).email);

      const album = await storage.getAlbum(albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });
      if (album.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Loophole closure & upgrade handler: If upgrading a personal album to a Lab Album (by setting branding or setting isLabAlbum: 1), deduct 1 credit.
      const isSettingBranding = 
        req.body.customBusinessName !== undefined || 
        req.body.customBusinessLogo !== undefined || 
        req.body.customContactWhatsApp !== undefined;
      
      const isUpgradingToLab = req.body.isLabAlbum === 1 && album.isLabAlbum !== 1;

      let creditDeducted = false;

      if ((isSettingBranding || isUpgradingToLab) && album.isLabAlbum !== 1 && !isAdmin) {
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isLabPlan = ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(user.plan);
        if (!isLabPlan) {
          return res.status(403).json({ 
            error: "Lab subscription required", 
            message: "To upgrade to a Lab album or apply custom branding, you need a Lab subscription." 
          });
        }

        // Try to deduct credit atomically
        const [updatedUser] = await db.update(users)
          .set({ credits: sql`${users.credits} - 1` })
          .where(and(eq(users.id, userId), gt(users.credits, 0)))
          .returning();

        if (!updatedUser) {
          return res.status(403).json({ 
            error: "No credits remaining", 
            message: "You need 1 credit to upgrade this personal album to a Lab album." 
          });
        }
        creditDeducted = true;
      }

      let updatedAlbum;
      if (creditDeducted) {
        // Try to upgrade atomically (only if it was not already upgraded)
        const [row] = await db.update(albums)
          .set({ ...req.body, isLabAlbum: 1 })
          .where(and(eq(albums.id, albumId), eq(albums.isLabAlbum, 0)))
          .returning();
        
        updatedAlbum = row;

        if (!updatedAlbum) {
          // Refund credit because concurrent request already upgraded it
          await db.update(users)
            .set({ credits: sql`${users.credits} + 1` })
            .where(eq(users.id, userId));

          // Run the regular update since isLabAlbum is already 1
          const [row2] = await db.update(albums)
            .set(req.body)
            .where(eq(albums.id, albumId))
            .returning();
          updatedAlbum = row2;
        }
      } else {
        // Regular update (already upgraded, or not setting branding, or admin)
        const [row] = await db.update(albums)
          .set(req.body)
          .where(eq(albums.id, albumId))
          .returning();
        updatedAlbum = row;
      }

      res.json(updatedAlbum);
    } catch (e) {
      console.error("Failed to update album:", e);
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

  // Delete sheet/file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const file = await storage.getFile(req.params.id);
      if (!file) return res.status(404).json({ error: "File not found" });

      const album = await storage.getAlbum(file.albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });

      if (album.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteFile(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Update file metadata (e.g. change cover image url)
  app.patch("/api/files/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const file = await storage.getFile(req.params.id);
      if (!file) return res.status(404).json({ error: "File not found" });

      const album = await storage.getAlbum(file.albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });

      if (album.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await storage.updateFile(req.params.id, req.body);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update file" });
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

  // Admin: Get Cloudflare R2 Storage Usage
  app.get("/api/admin/cloud-usage", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      // Query R2 bucket for real storage stats
      const r2Stats = await listR2BucketStats();

      // Count platform assets (albums + files in DB)
      const allAlbums = await storage.getAllAlbums();
      let totalFiles = 0;
      let r2Files = 0;
      let cloudinaryFiles = 0;
      for (const album of allAlbums) {
        const files = await storage.getFilesByAlbum(album.id);
        totalFiles += files.length;
        for (const f of files) {
          if (f.filePath?.includes('r2.dev') || f.filePath?.includes('r2.cloudflarestorage')) {
            r2Files++;
          } else if (f.filePath?.includes('cloudinary')) {
            cloudinaryFiles++;
          }
        }
      }

      const FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
      const usedPercent = (r2Stats.totalSize / FREE_TIER_BYTES) * 100;
      const avgAlbumSize = allAlbums.length > 0 ? r2Stats.totalSize / allAlbums.length : 300 * 1024 * 1024;
      const estimatedAlbumsRemaining = Math.max(0, Math.floor((FREE_TIER_BYTES - r2Stats.totalSize) / avgAlbumSize));

      res.json({
        provider: 'cloudflare_r2',
        bucket: process.env.R2_BUCKET_NAME || 'eventfold-media',
        storage: {
          used_bytes: r2Stats.totalSize,
          free_tier_bytes: FREE_TIER_BYTES,
          used_percent: Math.min(usedPercent, 100),
          cost_per_gb: 0.015,
        },
        bandwidth: {
          egress_cost: 0,
          note: 'Cloudflare R2 has ZERO egress fees',
        },
        objects: {
          total: r2Stats.totalObjects,
          folders: r2Stats.folderStats,
        },
        platform: {
          total_albums: allAlbums.length,
          total_files: totalFiles,
          r2_files: r2Files,
          cloudinary_legacy_files: cloudinaryFiles,
          estimated_albums_remaining: estimatedAlbumsRemaining,
        },
        timestamp: new Date().toISOString(),
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

      // Get ALL file paths from database (albums, settings, avatars)
      const allAlbums = await storage.getAllAlbums();
      const allDbPaths = new Set<string>();

      // 1. Album files (sheets, covers, videos, audio)
      for (const album of allAlbums) {
        const files = await storage.getFilesByAlbum(album.id);
        for (const f of files) {
          allDbPaths.add(f.filePath);
        }
        // Also protect background music URLs
        if (album.bgMusicUrl) allDbPaths.add(album.bgMusicUrl);
      }

      // 2. Business logos from settings (DO NOT delete these!)
      const allUsers = await storage.getUsers();
      for (const u of allUsers) {
        try {
          const s = await storage.getSettings(u.id);
          if (s?.businessLogo && s.businessLogo.includes('cloudinary')) {
            allDbPaths.add(s.businessLogo);
          }
        } catch (e) {}

        // 3. User avatars (Google profile pics are external, but custom ones could be Cloudinary)
        if (u.avatar && u.avatar.includes('cloudinary')) {
          allDbPaths.add(u.avatar);
        }
      }

      // Find orphans (in Cloudinary but NOT referenced ANYWHERE in the platform)
      const orphans = allCloudResources.filter(r => {
        const secureUrl = r.secure_url;
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

  // Admin: Export Users to CSV
  app.get("/api/admin/export-users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const allUsers = await storage.getUsers();
      
      const { filter } = req.query;
      let targetUsers = allUsers;
      let filename = "eventfold_users.csv";

      if (filter === 'studio') {
        targetUsers = allUsers.filter(u => ['pro', 'elite'].includes(u.plan || ''));
        filename = "eventfold_studio_users.csv";
      } else if (filter === 'labs') {
        targetUsers = allUsers.filter(u => ['lab_monthly', 'lab_half_yearly', 'lab_yearly', 'lab_unlimited'].includes(u.plan || ''));
        filename = "eventfold_labs_users.csv";
      } else if (filter === 'free') {
        targetUsers = allUsers.filter(u => (u.plan || 'free') === 'free');
        filename = "eventfold_free_users.csv";
      }

      const csvHeader = "ID,Name,Email,Plan,Credits,Role,Verified,Joined Date\n";
      const csvRows = targetUsers.map(u => {
        const name = `"${(u.name || "").replace(/"/g, '""')}"`;
        const email = `"${(u.email || "").replace(/"/g, '""')}"`;
        const plan = u.plan || 'free';
        const joined = u.createdAt ? new Date(u.createdAt).toISOString() : '';
        return `${u.id},${name},${email},${plan},${u.credits},${u.role},${u.isVerified ? 'Yes' : 'No'},${joined}`;
      }).join('\n');

      const csvData = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (e: any) {
      console.error("CSV Export failed:", e);
      res.status(500).json({ error: "Export failed", details: e.message });
    }
  });

  // Client: Get Active Broadcast
  app.get("/api/broadcasts/active", async (req, res) => {
    try {
      const activeBroadcasts = await db.select().from(broadcasts).where(eq(broadcasts.isActive, 1)).orderBy(desc(broadcasts.createdAt)).limit(1);
      if (activeBroadcasts.length > 0) {
        res.json({ success: true, broadcast: activeBroadcasts[0] });
      } else {
        res.json({ success: true, broadcast: null });
      }
    } catch (e: any) {
      console.error("Failed to fetch broadcast:", e);
      res.status(500).json({ error: "Fetch failed", details: e.message });
    }
  });

  // Admin: Manage Broadcasts
  app.post("/api/admin/broadcasts", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const { message, type, isActive } = req.body;

      // Always deactivate all other broadcasts first
      await db.update(broadcasts).set({ isActive: 0 });

      if (isActive && message) {
        // Create new broadcast
        await db.insert(broadcasts).values({ message, type: type || 'info', isActive: 1 });
      }

      res.json({ success: true });
    } catch (e: any) {
      console.error("Broadcast update failed:", e);
      res.status(500).json({ error: "Update failed", details: e.message });
    }
  });

  // Admin: Analytics Dashboard Data
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      // Calculate the date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch users and albums from the last 30 days
      const recentUsers = await db.select({ createdAt: users.createdAt }).from(users);
      const recentAlbums = await db.select({ createdAt: albums.createdAt }).from(albums);

      // Initialize map for the last 30 days
      const chartDataMap = new Map<string, { date: string; signups: number; albums: number }>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        chartDataMap.set(dateStr, { date: dateStr, signups: 0, albums: 0 });
      }

      // Group users
      recentUsers.forEach(u => {
        if (!u.createdAt) return;
        const dateStr = new Date(u.createdAt).toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
          chartDataMap.get(dateStr)!.signups += 1;
        }
      });

      // Group albums
      recentAlbums.forEach(a => {
        if (!a.createdAt) return;
        const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
          chartDataMap.get(dateStr)!.albums += 1;
        }
      });

      const chartData = Array.from(chartDataMap.values());

      // Get some top line stats
      const totalUsers = recentUsers.length;
      const totalAlbums = recentAlbums.length;

      // Get referral program metrics
      const totalReferralsList = await db.select().from(referrals);
      const referralStats = {
        total: totalReferralsList.length,
        joined: totalReferralsList.filter(r => r.status === 'joined').length,
        verified: totalReferralsList.filter(r => r.status === 'verified').length,
        completed: totalReferralsList.filter(r => r.status === 'completed').length,
        rewarded: totalReferralsList.filter(r => r.status === 'rewarded').length,
      };

      res.json({
        success: true,
        chartData,
        stats: {
          totalUsers,
          totalAlbums,
          referralStats,
        }
      });

    } catch (e: any) {
      console.error("Analytics fetch failed:", e);
      res.status(500).json({ error: "Analytics fetch failed", details: e.message });
    }
  });

  // Cron: Trigger album expiry notifications and cleanup
  app.get("/api/cron/check-notifications", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    
    // Allow execution if CRON_SECRET is not configured (for easy testing/local dev)
    // or if it matches the Vercel Cron header / secret query param
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.query.secret;
    
    if (cronSecret && token !== cronSecret) {
      return res.status(401).json({ error: "Unauthorized cron trigger" });
    }

    console.log("[CRON] Expiry notification and cleanup cron trigger initiated.");
    try {
      const { checkAndSendAlbumExpiryNotifications } = await import("./lib/notifications");
      await checkAndSendAlbumExpiryNotifications();
      await storage.cleanupExpiredAlbums();
      res.json({ success: true, message: "Notifications and cleanup successfully processed." });
    } catch (err: any) {
      console.error("[CRON] Cron execution failed:", err);
      res.status(500).json({ error: "Cron execution failed", details: err.message });
    }
  });

  // --- Kiosk & Promo Code Endpoints ---

  app.post("/api/admin/exhibitions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const { name, prefix } = req.body;
      if (!name || !prefix) return res.status(400).json({ error: "Name and prefix required" });

      const exhibition = await storage.createExhibition(name, prefix);
      res.json({ success: true, exhibition });
    } catch (e: any) {
      console.error("Failed to create exhibition:", e);
      res.status(500).json({ error: "Failed to create exhibition" });
    }
  });

  app.get("/api/admin/exhibitions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const exhibitions = await storage.getExhibitions();
      res.json({ success: true, exhibitions });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to fetch exhibitions" });
    }
  });

  app.get("/api/admin/exhibitions/:id", async (req, res) => {
    try {
      const exhibition = await storage.getExhibition(req.params.id);
      if (!exhibition) return res.status(404).json({ error: "Exhibition not found" });
      res.json({ success: true, exhibition });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to fetch exhibition" });
    }
  });

  app.get("/api/admin/exhibitions/:id/leads", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }
      const leads = await storage.getKioskLeads(req.params.id);
      res.json({ success: true, leads });
    } catch (e: any) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.post("/api/admin/leads", async (req, res) => {
    try {
      const { exhibitionId, name, email } = req.body;
      if (!exhibitionId || !name || !email) return res.status(400).json({ error: "Exhibition ID, name, and email required" });

      const lead = await storage.createKioskLead({ exhibitionId, name, email });
      res.json({ success: true, lead });
    } catch (e: any) {
      console.error("Failed to capture lead:", e);
      res.status(500).json({ error: "Failed to capture lead" });
    }
  });

  app.delete("/api/admin/leads/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      await storage.deleteKioskLead(req.params.id);
      res.json({ success: true, message: "Lead deleted successfully" });
    } catch (e: any) {
      console.error("Failed to delete lead:", e);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  app.post("/api/admin/exhibitions/:id/promo/send", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Admin privilege required" });
      }

      const exhibition = await storage.getExhibition(req.params.id);
      if (!exhibition) return res.status(404).json({ error: "Exhibition not found" });

      const leads = await storage.getKioskLeads(req.params.id);
      let sentCount = 0;

      // Import the mass mailer
      const { sendPromotionalEmail } = await import("./lib/email");

      for (const lead of leads) {
        // Generate a unique 8 character promo code using exhibition prefix
        const code = `${exhibition.prefix.toUpperCase()}-` + crypto.randomBytes(4).toString("hex").toUpperCase();
        await storage.createPromoCode(code);

        const emailHtml = `
          <h2 style="color: white; font-size: 24px;">Thank you for visiting EventFold Studio!</h2>
          <p>It was great meeting you at the exhibition. As promised, here is your exclusive promo code to get <strong>1 FREE Album Credit</strong>.</p>
          <div style="background: #1e1e2e; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8b5cf6;">${code}</span>
          </div>
          <p>Sign up at <a href="https://eventfoldstudio.com" style="color: #8b5cf6;">eventfoldstudio.com</a>, head to your Dashboard, and redeem this code instantly.</p>
        `;

        await sendPromotionalEmail(lead.email, "Your Free EventFold Studio Credit! 🎁", emailHtml);
        sentCount++;
        
        // 1.5 second delay to avoid spam/rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      res.json({ success: true, message: `Sent ${sentCount} promo codes successfully.` });
    } catch (e: any) {
      console.error("Failed to send promos:", e);
      res.status(500).json({ error: "Failed to send promo codes" });
    }
  });

  app.post("/api/billing/redeem-promo", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;
      const { code } = req.body;

      if (!code) return res.status(400).json({ error: "Promo code is required" });

      const promo = await storage.getPromoCode(code.trim().toUpperCase());
      if (!promo) {
        return res.status(404).json({ error: "Invalid promo code" });
      }

      if (promo.isUsed === 1 || promo.currentUses >= promo.maxUses) {
        return res.status(400).json({ error: "This promo code has reached its maximum number of uses" });
      }

      const hasRedeemed = await storage.hasUserRedeemedPromo(promo.id, userId);
      if (hasRedeemed) {
        return res.status(400).json({ error: "You have already redeemed this promo code" });
      }

      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return res.status(400).json({ error: "This promo code has expired" });
      }

      // Mark used and add credit
      const creditsToAdd = promo.credits || 1;
      await storage.markPromoCodeUsed(promo.id, userId);
      await storage.addCredit(userId, creditsToAdd);

      res.json({ success: true, message: `${creditsToAdd} Free Album Credit${creditsToAdd > 1 ? 's' : ''} added to your account!` });
    } catch (e: any) {
      console.error("Failed to redeem promo:", e);
      res.status(500).json({ error: "Failed to redeem promo code" });
    }
  });

  app.get("/api/admin/promo/redemptions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const redemptions = await storage.getPromoRedemptionsWithDetails();
      res.json(redemptions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch redemptions" });
    }
  });

  app.post("/api/admin/promo/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const user = req.user as any;
      const adminEmails = ["admin@eventfold.com", "dilpreetsinghverma@gmail.com"];
      if (user.role !== 'admin' && !adminEmails.includes(user.email)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const { prefix, count, expiresAt, credits, isGlobal, maxUses } = req.body;
      const numCodes = parseInt(count) || 1;
      const creds = parseInt(credits) || 1;
      const mUses = parseInt(maxUses) || 1;
      const prefixStr = (prefix || "PROMO").toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      let expiryDate: Date | null = null;
      if (expiresAt) {
        expiryDate = new Date(expiresAt);
      }

      const generatedCodes: string[] = [];
      
      if (isGlobal && prefixStr) {
        // Global mode: exactly one code matching the prefix, with maxUses
        await storage.createPromoCode(prefixStr, expiryDate, creds, mUses);
        generatedCodes.push(prefixStr);
      } else {
        // Bulk random mode
        for (let i = 0; i < numCodes; i++) {
          const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
          const codeString = prefixStr ? `${prefixStr}-${randomPart}` : randomPart;
          await storage.createPromoCode(codeString, expiryDate, creds, 1);
          generatedCodes.push(codeString);
        }
      }

      res.json({ success: true, codes: generatedCodes });
    } catch (e: any) {
      console.error("Failed to generate promo codes:", e);
      res.status(500).json({ error: "Failed to generate promo codes" });
    }
  });


}
