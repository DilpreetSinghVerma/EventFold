import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile, mkdir } from "fs/promises";
import "dotenv/config";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
  "zustand",
  "sharp"
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DATABASE_URL": JSON.stringify(process.env.DATABASE_URL),
      "process.env.CLOUDINARY_CLOUD_NAME": JSON.stringify(process.env.CLOUDINARY_CLOUD_NAME),
      "process.env.CLOUDINARY_API_KEY": JSON.stringify(process.env.CLOUDINARY_API_KEY),
      "process.env.CLOUDINARY_API_SECRET": JSON.stringify(process.env.CLOUDINARY_API_SECRET),
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Copy to api/ so Vercel uses pre-bundled server (avoids @vercel/node "No exports found")
  await mkdir("api", { recursive: true });
  await copyFile("dist/index.cjs", "api/index.js");

  // CRITICAL: Force append module.exports for Vercel compatibility
  // Vercel's @vercel/node expects the Express app to be module.exports,
  // but esbuild's CJS format often uses exports.default.
  const { appendFile } = await import("fs/promises");
  await appendFile("api/index.js", "\nmodule.exports = exports.default || module.exports;\n");

  console.log("api/index.js updated from build with Vercel compatibility hack");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
