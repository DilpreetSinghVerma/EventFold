import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAlbumSchema, insertFileSchema, users } from "../shared/schema";
import { ZodError } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_51", {
  // @ts-ignore - version mismatch in types
  apiVersion: "2025-02-24-preview",
});

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
  app.get("/api/settings", async (_req, res) => {
    try {
      const s = await storage.getSettings();
      res.json(s);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update Business Settings
  app.patch("/api/settings", async (req, res) => {
    try {
      await storage.updateSettings(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Stripe Billing: Buy 1 Album Credit
  app.post("/api/billing/buy-credit", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      const userId = (req.user as any).id;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: "1 Album Credit",
                description: "Allows you to create one full 3D flipbook album.",
              },
              unit_amount: 19900, // ₹199
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/dashboard?success=true`,
        cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
        metadata: { userId },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ error: "Stripe error", details: e.message });
    }
  });

  // Stripe Webhook (Simplified for demonstration - usually needs a separate non-JSON route)
  app.post("/api/billing/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await storage.addCredit(userId, 1);
        console.log(`Credits added for user ${userId}`);
      }
    }

    res.json({ received: true });
  });

  // Health check for cloud debugging
  app.get("/api/health", async (_req, res) => {
    try {
      const url = process.env.DATABASE_URL;
      const isDummy = !url || url === "dummy_url" || url === "";

      let dbStatus = "connected";
      let error = null;

      if (isDummy) {
        dbStatus = "local_only";
      } else {
        try {
          // Verify actual table access
          await storage.getAlbums().catch(e => {
            console.error("DB SELECT FAILED:", e);
            dbStatus = "disconnected";
            error = e.message;
          });
        } catch (e: any) {
          dbStatus = "disconnected";
          error = e.message;
        }
      }

      res.status(dbStatus === "disconnected" ? 500 : 200).json({
        status: dbStatus === "disconnected" ? "error" : "ok",
        database: dbStatus,
        error: error,
        isVercel: !!process.env.VERCEL,
        env: process.env.NODE_ENV
      });
    } catch (e: any) {
      console.error("System health check crashed:", e);
      res.status(500).json({
        status: "error",
        database: "disconnected",
        error: "System crash during health check",
        details: e.message
      });
    }
  });

  // Create album (Metadata only)
  app.post("/api/albums", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check if user has enough credits
      if (user.credits <= 0) {
        return res.status(403).json({
          error: "No credits remaining",
          message: "Please purchase an album credit to continue."
        });
      }

      const data = insertAlbumSchema.parse({
        ...req.body,
        userId: userId
      });

      // Deduct credit and create album
      await storage.deductCredit(userId);
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

      const files = await storage.getFilesByAlbum(req.params.id);
      // Strip password from the response for security
      const { password, ...albumSafe } = album as any;
      res.json({ ...albumSafe, files, isProtected: !!album.password, isUnlocked: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch album" });
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

  // --- Stripe Payments ---

  // Create Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const user = req.user as any;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "EventFold Pro Plan",
                description: "Unlimited Cinematic Albums & Premium Features",
              },
              unit_amount: 999, // $9.99
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.VITE_PUBLIC_VIEWER_URL || req.headers.origin}/dashboard?success=true`,
        cancel_url: `${process.env.VITE_PUBLIC_VIEWER_URL || req.headers.origin}/dashboard?canceled=true`,
        metadata: {
          userId: user.id
        },
        customer_email: user.email,
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe Webhook (Handle as raw body)
  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata.userId;
      const stripeCustomerId = session.customer;
      const subscriptionId = session.subscription;

      // Update user to PRO
      await storage.updateUser(userId, {
        plan: 'pro',
        stripeCustomerId,
        subscriptionId
      });
      console.log(`User ${userId} upgraded to PRO`);
    }

    res.json({ received: true });
  });
}
