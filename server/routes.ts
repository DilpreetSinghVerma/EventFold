import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAlbumSchema, insertFileSchema } from "../shared/schema";
import { ZodError } from "zod";

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

  // Health check for cloud debugging
  app.get("/api/health", async (_req, res) => {
    try {
      await storage.getAlbums();
      res.json({ status: "ok", database: "connected", env: process.env.NODE_ENV });
    } catch (e: any) {
      console.error("Health check database failure:", e);
      res.status(500).json({
        status: "error",
        database: "disconnected",
        error: e.message || String(e),
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined
      });
    }
  });

  // Create album (Metadata only)
  app.post("/api/albums", async (req, res) => {
    try {
      const data = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(data);
      res.json(album);
    } catch (e) {
      if (e instanceof ZodError) {
        console.error("Validation error creating album:", e.errors);
        return res.status(400).json({ error: "Invalid album data provided", details: e.errors });
      }
      console.error("Server error creating album details:", {
        message: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
        raw: e
      });
      res.status(500).json({
        message: e instanceof Error ? e.message : "Internal server failure during album creation",
        details: e instanceof Error ? e.stack : String(e)
      });
    }
  });

  // Get all albums with their files
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      const albumsWithFiles = await Promise.all(
        albums.map(async (album: any) => {
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
      const files = await storage.getFilesByAlbum(req.params.id);
      res.json({ ...album, files });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch album" });
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
  app.post("/api/albums/:albumId/files", upload.array("files", 100), async (req, res) => {
    try {
      // HANDLE JSON BATCH UPLOAD (From Client-side direct Cloudinary uploads)
      if (req.body && req.body.files && Array.isArray(req.body.files)) {
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

      // FALLBACK TO MULTIPART UPLOAD (Old way, might time out on Vercel)
      const multerFiles = req.files as Express.Multer.File[];
      // ... rest of logic for binary upload remains as fallback ...
      if (!multerFiles || multerFiles.length === 0) {
        return res.status(400).json({ error: "No files provided. Send binary files or a JSON files array." });
      }

      const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      const startTime = Date.now();

      // Parallel processing with Concurrency Control (Batches of 5)
      const CONCURRENCY_LIMIT = 5;
      const uploadResults: any[] = [];

      for (let i = 0; i < multerFiles.length; i += CONCURRENCY_LIMIT) {
        const chunk = multerFiles.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}...`);

        const chunkResults = await Promise.all(
          chunk.map(async (file, indexInChunk) => {
            const globalIndex = i + indexInChunk;
            const fileType = req.body[`fileType_${globalIndex}`] || "sheet";
            let bufferToUpload = file.buffer;

            // Optional Compression (Lazy-loaded to prevent Vercel startup crashes)
            if (file.size > 5 * 1024 * 1024) {
              try {
                const sharp = (await import('sharp')).default;
                bufferToUpload = await sharp(file.buffer)
                  .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
                  .jpeg({ quality: 80, progressive: true })
                  .toBuffer();
              } catch (sharpError) {
                console.error(`Sharp compression failed for file ${globalIndex}:`, sharpError);
              }
            }

            let filePath = "";
            if (useCloudinary) {
              try {
                const cloudinaryResult = await streamUpload(bufferToUpload);
                filePath = cloudinaryResult.secure_url;
                console.log(`Uploaded asset ${globalIndex + 1}/${multerFiles.length}`);
              } catch (uploadError) {
                console.error(`Upload error for file ${globalIndex}:`, uploadError);
                throw new Error(`Cloudinary error at index ${globalIndex}`);
              }
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

      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Sync complete: ${uploadResults.length} assets in ${totalDuration}s`);
      res.json(uploadResults);
    } catch (e) {
      console.error("Upload error details:", {
        message: e instanceof Error ? e.message : "Unknown error",
        stack: e instanceof Error ? e.stack : undefined,
        raw: e
      });
      res.status(500).json({
        error: "Upload failed",
        message: e instanceof Error ? e.message : "Internal error",
        details: e instanceof Error ? e.stack : String(e)
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

}
