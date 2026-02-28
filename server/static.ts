import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Workaround for Vercel/Node ESM vs CJS
const getFilename = () => typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta?.url || `file://${process.cwd()}/server/static.ts`);
const getDirname = () => typeof __dirname !== 'undefined' ? __dirname : path.dirname(getFilename());

export function serveStatic(app: Express) {
  // In Vercel, the dist output is usually at project root/dist/public
  // or relative to the bundled server file.
  let distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    // Try relative to this file (useful for different build structures)
    distPath = path.resolve(getDirname(), "..", "dist", "public");
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

  // Fall through to index.html for SPA routing, but EXCLUDE /api routes
  // This ensures that if /api/health isn't matched by Express routes, 
  // it doesn't return the SPA's index.html
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Front-end build not found. Please run build script.");
    }
  });
}
