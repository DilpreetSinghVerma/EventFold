import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAlbumSchema, insertFileSchema } from "@shared/schema";
import { ZodError } from "zod";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      console.error("Server error creating album:", e);
      res.status(500).json({
        error: "Failed to create album",
        message: e instanceof Error ? e.message : "Unknown error occurred"
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

  // Upload files (Cloudinary or Local Fallback)
  app.post("/api/albums/:albumId/files", upload.array("files", 100), async (req, res) => {
    try {
      const multerFiles = req.files as Express.Multer.File[];
      if (!multerFiles || multerFiles.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      const sharp = (await import('sharp')).default;
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

            // Optional Compression
            if (file.size > 5 * 1024 * 1024) {
              try {
                bufferToUpload = await sharp(file.buffer)
                  .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
                  .jpeg({ quality: 80, progressive: true })
                  .toBuffer();
              } catch (sharpError) {
                console.error(`Sharp error for file ${globalIndex}:`, sharpError);
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
      console.error("Upload error:", e);
      res.status(500).json({
        error: "Upload failed",
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

  return httpServer;
}
