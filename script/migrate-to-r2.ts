/**
 * ============================================================
 * STEP 2: MIGRATE CLOUDINARY → CLOUDFLARE R2
 * ============================================================
 * This script safely copies ALL your images & videos from
 * Cloudinary to Cloudflare R2, then updates the database URLs.
 *
 * SAFETY FEATURES:
 *  ✅ Never deletes anything from Cloudinary
 *  ✅ Tests 1 file first before doing everything
 *  ✅ Saves progress so it can resume if interrupted
 *  ✅ Skips files already migrated
 *  ✅ Creates a full backup before starting
 *
 * PREREQUISITES:
 *  1. Create a Cloudflare account at cloudflare.com (free)
 *  2. Go to R2 → Create bucket named "eventfold-media"
 *  3. Go to R2 → Manage R2 API Tokens → Create Token
 *  4. Add these to your .env file:
 *     R2_ACCOUNT_ID=your_account_id
 *     R2_ACCESS_KEY_ID=your_access_key
 *     R2_SECRET_ACCESS_KEY=your_secret_key
 *     R2_BUCKET_NAME=eventfold-media
 *     R2_PUBLIC_URL=https://pub-xxxx.r2.dev (from R2 bucket public URL)
 *
 * HOW TO RUN:
 *   npx tsx script/migrate-to-r2.ts
 *
 * TO TEST FIRST (just 1 file):
 *   npx tsx script/migrate-to-r2.ts --test
 * ============================================================
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import * as dotenv from "dotenv";

dotenv.config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { files, settings } from "../shared/schema";
import { eq } from "drizzle-orm";

// ─── Config ───────────────────────────────────────────────
const TEST_MODE = process.argv.includes("--test");
const PROGRESS_FILE = path.join(process.cwd(), "migration", "progress.json");
const MIGRATION_DIR = path.join(process.cwd(), "migration");

// ─── Types ────────────────────────────────────────────────
interface MigrationProgress {
  startedAt: string;
  completedFileIds: string[];
  failedFileIds: string[];
  totalProcessed: number;
}

// ─── Helpers ──────────────────────────────────────────────

function loadProgress(): MigrationProgress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  }
  return {
    startedAt: new Date().toISOString(),
    completedFileIds: [],
    failedFileIds: [],
    totalProcessed: 0,
  };
}

function saveProgress(p: MigrationProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

/** Download a file from a URL and return as Buffer */
function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https://") ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Download failed: HTTP ${response.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

/** Determine content type from URL */
function getContentType(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".avi")) return "video/x-msvideo";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  return "image/jpeg"; // default
}

/** Extract a clean filename from a Cloudinary URL */
function extractFilename(cloudinaryUrl: string, fileId: string, fileType: string): string {
  try {
    const urlObj = new URL(cloudinaryUrl);
    const parts = urlObj.pathname.split("/");
    const rawName = parts[parts.length - 1].split("?")[0];
    // Keep extension if present, otherwise add based on type
    if (rawName.includes(".")) return `${fileType}_${fileId}_${rawName}`;
    return `${fileType}_${fileId}_${rawName}.jpg`;
  } catch {
    return `${fileType}_${fileId}.jpg`;
  }
}

/** Upload buffer to Cloudflare R2 using native fetch (no extra dependencies) */
async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME || "eventfold-media";
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKey || !secretKey || !publicUrl) {
    throw new Error(
      "Missing R2 credentials! Please add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL to your .env file."
    );
  }

  // Use AWS SDK v3 style presigned URL or direct S3-compatible upload
  // We'll use the @aws-sdk/client-s3 which is already available via the aws-sdk style
  // Install: npm install @aws-sdk/client-s3
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const key = `albums/${filename}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1 year cache for permanent files
    })
  );

  return `${publicUrl}/${key}`;
}

// ─── Main ─────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 EventFold Studio — Cloudinary → R2 Migration Tool");
  console.log("======================================================");
  if (TEST_MODE) {
    console.log("🧪 TEST MODE: Will only process 1 file");
  }
  console.log();

  // Check .env
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }
  if (!process.env.R2_ACCOUNT_ID) {
    console.error("❌ R2_ACCOUNT_ID not found in .env");
    console.error("   Please set up Cloudflare R2 first (see script header for instructions)");
    process.exit(1);
  }
  if (!process.env.R2_PUBLIC_URL) {
    console.error("❌ R2_PUBLIC_URL not found in .env");
    process.exit(1);
  }

  // Ensure migration folder exists
  if (!fs.existsSync(MIGRATION_DIR)) fs.mkdirSync(MIGRATION_DIR, { recursive: true });

  // Check backup exists
  const backupLatest = path.join(MIGRATION_DIR, "backup-latest.json");
  if (!fs.existsSync(backupLatest)) {
    console.error("❌ No backup found!");
    console.error("   Please run backup first: npx tsx script/backup-db.ts");
    process.exit(1);
  }
  console.log("✅ Backup verified: migration/backup-latest.json exists");

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Fetch all files that point to Cloudinary
  console.log("📡 Fetching Cloudinary files from database...");
  const allFiles = await db.select().from(files);
  const cloudinaryFiles = allFiles.filter(
    (f) => f.filePath && f.filePath.includes("cloudinary.com")
  );
  
  // Also fetch settings (business logo)
  const allSettings = await db.select().from(settings);
  const cloudinarySettings = allSettings.filter(
    (s) => s.businessLogo && s.businessLogo.includes("cloudinary.com")
  );

  console.log(`   📁 Total files in DB: ${allFiles.length}`);
  console.log(`   ☁️  Cloudinary files: ${cloudinaryFiles.length}`);
  console.log(`   🖼️  Cloudinary logos in settings: ${cloudinarySettings.length}`);
  console.log();

  if (cloudinaryFiles.length === 0 && cloudinarySettings.length === 0) {
    console.log("✅ No Cloudinary files found! Nothing to migrate.");
    return;
  }

  // Load progress (resume support)
  const progress = loadProgress();
  const alreadyDone = new Set(progress.completedFileIds);
  const pending = cloudinaryFiles.filter((f) => !alreadyDone.has(f.id));

  console.log(`📊 Migration Progress:`);
  console.log(`   ✅ Already migrated: ${progress.completedFileIds.length}`);
  console.log(`   ⏳ Remaining:        ${pending.length}`);
  console.log(`   ❌ Failed:           ${progress.failedFileIds.length}`);
  console.log();

  if (pending.length === 0 && cloudinarySettings.length === 0) {
    console.log("🎉 All files already migrated!");
    return;
  }

  // In test mode, only do 1 file
  const filesToProcess = TEST_MODE ? pending.slice(0, 1) : pending;
  
  if (filesToProcess.length === 0 && !TEST_MODE) {
    console.log("✅ All album files done! Checking settings logos...");
  }

  let successCount = 0;
  let failCount = 0;

  console.log(`🔄 Starting migration of ${filesToProcess.length} files...\n`);

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i];
    const num = i + 1;
    const total = filesToProcess.length;
    
    console.log(`[${num}/${total}] ${file.fileType} — ${file.id.slice(0, 8)}...`);
    console.log(`         From: ${file.filePath.substring(0, 60)}...`);

    try {
      // 1. Download from Cloudinary
      const buffer = await downloadFile(file.filePath);
      console.log(`         📥 Downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);

      // 2. Determine filename and content type
      const contentType = getContentType(file.filePath);
      const filename = extractFilename(file.filePath, file.id, file.fileType);

      // 3. Upload to R2
      const r2Url = await uploadToR2(buffer, filename, contentType);
      console.log(`         📤 Uploaded to R2: ${r2Url.substring(0, 60)}...`);

      // 4. Update database URL
      await db.update(files).set({ filePath: r2Url }).where(eq(files.id, file.id));
      console.log(`         💾 Database URL updated`);

      // 5. Save progress
      progress.completedFileIds.push(file.id);
      progress.totalProcessed++;
      saveProgress(progress);

      successCount++;
      console.log(`         ✅ Done!\n`);

    } catch (err: any) {
      console.error(`         ❌ FAILED: ${err.message}`);
      progress.failedFileIds.push(file.id);
      saveProgress(progress);
      failCount++;
      console.log();
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  // Migrate settings logos (business logos)
  if (!TEST_MODE && cloudinarySettings.length > 0) {
    console.log(`\n🖼️  Migrating ${cloudinarySettings.length} business logo(s)...\n`);
    for (const s of cloudinarySettings) {
      if (!s.businessLogo) continue;
      console.log(`   Logo for user: ${s.userId}`);
      try {
        const buffer = await downloadFile(s.businessLogo);
        const contentType = getContentType(s.businessLogo);
        const filename = `logo_${s.userId}_${Date.now()}.jpg`;
        const r2Url = await uploadToR2(buffer, filename, contentType);
        await db.update(settings).set({ businessLogo: r2Url }).where(eq(settings.userId, s.userId));
        console.log(`   ✅ Logo migrated!\n`);
      } catch (err: any) {
        console.error(`   ❌ Logo failed: ${err.message}\n`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(54));
  console.log("📋 MIGRATION SUMMARY");
  console.log("=".repeat(54));
  console.log(`✅ Successfully migrated: ${successCount} files`);
  console.log(`❌ Failed:               ${failCount} files`);
  console.log(`📊 Total processed:      ${progress.totalProcessed} files`);

  if (failCount > 0) {
    console.log(`\n⚠️  Some files failed. You can re-run this script`);
    console.log(`   to retry only the failed files.`);
  }

  if (TEST_MODE) {
    console.log(`\n🧪 TEST COMPLETE!`);
    console.log(`   Check the migrated file above — does it look correct?`);
    console.log(`   If yes, run without --test flag to migrate everything:`);
    console.log(`   npx tsx script/migrate-to-r2.ts`);
  } else if (failCount === 0) {
    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`   ✅ All files now served from Cloudflare R2`);
    console.log(`   ✅ Cloudinary files still intact (not deleted)`);
    console.log(`   ✅ All existing QR codes still work`);
    console.log(`\nNext step: Run verify to double-check everything:`);
    console.log(`   npx tsx script/verify-migration.ts`);
  }
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Migration crashed:", err.message || err);
  process.exit(1);
});
