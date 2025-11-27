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

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Create album
  app.post("/api/albums", async (req, res) => {
    try {
      const data = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(data);
      res.json(album);
    } catch (e) {
      if (e instanceof ZodError) {
        res.status(400).json({ error: "Invalid request", details: e.errors });
      } else {
        res.status(500).json({ error: "Failed to create album" });
      }
    }
  });

  // Get all albums
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      res.json(albums);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch albums" });
    }
  });

  // Get single album with files
  app.get("/api/albums/:id", async (req, res) => {
    try {
      const album = await storage.getAlbum(req.params.id);
      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }
      const files = await storage.getFilesByAlbum(req.params.id);
      res.json({ ...album, files });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch album" });
    }
  });

  // Delete album
  app.delete("/api/albums/:id", async (req, res) => {
    try {
      const files = await storage.getFilesByAlbum(req.params.id);
      for (const file of files) {
        const filePath = path.join(uploadDir, path.basename(file.filePath));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await storage.deleteFilesByAlbum(req.params.id);
      await storage.deleteAlbum(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete album" });
    }
  });

  // Upload files
  app.post("/api/albums/:albumId/files", upload.array("files", 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const files = [];
      let orderIndex = 0;

      for (const file of req.files as Express.Multer.File[]) {
        const fileType = req.body[`fileType_${orderIndex}`] || "sheet";
        const filePath = path.join("uploads", file.filename);

        const dbFile = await storage.createFile({
          albumId: req.params.albumId,
          filePath,
          fileType,
          orderIndex,
        });
        files.push(dbFile);
        orderIndex++;
      }

      res.json(files);
    } catch (e) {
      res.status(500).json({ error: "Failed to upload files" });
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
