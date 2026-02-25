import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // In Vercel, the dist output is usually at project root/dist/public
  // or relative to the bundled server file.
  let distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    // Try relative to this file (useful for different build structures)
    distPath = path.resolve(__dirname, "..", "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    // Try the server/public fallback
    distPath = path.resolve(process.cwd(), "server", "public");
  }

  if (!fs.existsSync(distPath)) {
    console.warn(`CRITICAL: Static directory not found. Frontend will not load correctly.`);
    return;
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // Fall through to index.html for SPA routing
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Front-end build not found. Please run build script.");
    }
  });
}
