import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    // Fallback for some local environments
    const localDist = path.resolve(process.cwd(), "server", "public");
    if (!fs.existsSync(localDist)) {
      console.warn(`Static directory not found at ${distPath} or ${localDist}`);
      return;
    }
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
