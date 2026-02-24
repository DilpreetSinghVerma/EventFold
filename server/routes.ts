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
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max for free tier
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
      res.status(500).json({ error: "Failed to create album" });
    }
  });

  // Get all albums with their files
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      const albumsWithFiles = await Promise.all(
        albums.map(async (album) => {
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

  // Upload files directly to Cloudinary
  app.post("/api/albums/:albumId/files", upload.array("files", 15), async (req, res) => {
    try {
      const multerFiles = req.files as Express.Multer.File[];
      if (!multerFiles || multerFiles.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const results = [];
      for (let i = 0; i < multerFiles.length; i++) {
        const file = multerFiles[i];
        const fileType = req.body[`fileType_${i}`] || "sheet";

        // Stream directly to Cloudinary
        const cloudinaryResult = await streamUpload(file.buffer);

        const dbFile = await storage.createFile({
          albumId: req.params.albumId,
          filePath: cloudinaryResult.secure_url, // Store the permanent URL
          fileType,
          orderIndex: i,
        });
        results.push(dbFile);
      }

      res.json(results);
    } catch (e) {
      console.error("Upload error:", e);
      res.status(500).json({ error: "Cloud upload failed. Check environment variables." });
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
