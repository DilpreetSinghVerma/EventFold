import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get consistent directory info even in packaged apps
const getFilename = () => typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta?.url || `file://${process.cwd()}/server/static.ts`);
const getDirname = () => typeof __dirname !== 'undefined' ? __dirname : path.dirname(getFilename());

export function serveStatic(app: Express) {
  // We prioritize the path set by Electron's main process, otherwise fallback to current directory
  const baseDir = process.env.APP_PATH || process.cwd();
  
  // Possible locations for the static files in different build environments
  const possiblePaths = [
    path.join(baseDir, "dist", "public"),
    path.join(baseDir, "public"),
    path.join(baseDir, "server", "public"),
    // In Electron with ASAR, the files are often inside the asar archive
    path.join(baseDir, "app.asar", "dist", "public"),
    // Or in the unpacked directory next to it
    path.join(baseDir, "app.asar.unpacked", "dist", "public"),
    // Fallback for development
    path.join(getDirname(), "..", "dist", "public")
  ];

  let distPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
      distPath = p;
      break;
    }
  }

  if (!distPath) {
    console.error(`CRITICAL ERROR: Could not find static directory in ANY of these locations:\n${possiblePaths.join('\n')}`);
    // Last ditch effort: try the parent of the current file
    distPath = path.resolve(getDirname(), "..", "dist", "public");
  }

  console.log(`[static] Serving production assets from: ${distPath}`);
  app.use(express.static(distPath, {
    index: false,
    immutable: true,
    maxAge: '1y'
  }));

  // Handle SPA routing
  app.get("*", (req, res, next) => {
    // API routes should never fall through to index.html
    if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
      return next();
    }

    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`<h1>Static Assets Missing</h1><p>Expected index.html at: ${indexPath}</p>`);
    }
  });
}
