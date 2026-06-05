/**
 * ============================================================
 * STEP 3: VERIFY MIGRATION
 * ============================================================
 * Run this AFTER migration to verify every single file
 * URL in the database is still accessible and working.
 *
 * It checks every file URL by sending a HEAD request to
 * confirm the file actually exists at that URL.
 *
 * HOW TO RUN:
 *   npx tsx script/verify-migration.ts
 *
 * OUTPUT:
 *   migration/verify-report-[timestamp].json
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
import { albums, files, settings } from "../shared/schema";
import { asc, eq } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────

/** Check if a URL is reachable (HTTP HEAD request) */
function checkUrl(url: string): Promise<{ ok: boolean; status: number; error?: string }> {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https://") ? https : http;
    const req = protocol.request(url, { method: "HEAD", timeout: 10000 }, (res) => {
      resolve({ ok: (res.statusCode || 0) < 400, status: res.statusCode || 0 });
    });
    req.on("error", (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: "Timeout" });
    });
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("\n🔍 EventFold Studio — Migration Verification Tool");
  console.log("==================================================\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Fetch all data
  console.log("📡 Fetching all files from database...");
  const allFiles = await db.select().from(files).orderBy(asc(files.orderIndex));
  const allSettings = await db.select().from(settings);
  const allAlbums = await db.select().from(albums).orderBy(asc(albums.createdAt));
  console.log(`   ✅ Found ${allFiles.length} files and ${allSettings.length} settings\n`);

  // Categorize
  const cloudinaryFiles = allFiles.filter(f => f.filePath?.includes("cloudinary.com"));
  const r2Files = allFiles.filter(f => f.filePath && !f.filePath.includes("cloudinary.com"));
  const noUrlFiles = allFiles.filter(f => !f.filePath);

  console.log("📊 Current Storage Distribution:");
  console.log(`   ☁️  Still on Cloudinary: ${cloudinaryFiles.length} files`);
  console.log(`   🌐 On R2/Other:          ${r2Files.length} files`);
  console.log(`   ❓ No URL:               ${noUrlFiles.length} files`);
  console.log(`   📁 Total:                ${allFiles.length} files\n`);

  // Verify all R2 files are accessible
  const report: {
    checkedAt: string;
    summary: any;
    working: any[];
    broken: any[];
    cloudinary: any[];
  } = {
    checkedAt: new Date().toISOString(),
    summary: {},
    working: [],
    broken: [],
    cloudinary: [],
  };

  console.log("🔍 Checking all file URLs...\n");
  
  let workingCount = 0;
  let brokenCount = 0;
  let cloudinaryCount = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const num = i + 1;
    const total = allFiles.length;

    if (!file.filePath) {
      console.log(`[${num}/${total}] ❓ ${file.fileType} — No URL`);
      continue;
    }

    // Get album title for context
    const album = allAlbums.find(a => a.id === file.albumId);
    const albumTitle = album?.title || "Unknown Album";

    if (file.filePath.includes("cloudinary.com")) {
      cloudinaryCount++;
      report.cloudinary.push({
        fileId: file.id,
        fileType: file.fileType,
        albumId: file.albumId,
        albumTitle,
        url: file.filePath,
      });
      console.log(`[${num}/${total}] ☁️  ${file.fileType} — Still on Cloudinary`);
    } else {
      const result = await checkUrl(file.filePath);
      if (result.ok) {
        workingCount++;
        report.working.push({
          fileId: file.id,
          fileType: file.fileType,
          albumId: file.albumId,
          albumTitle,
          url: file.filePath,
          status: result.status,
        });
        console.log(`[${num}/${total}] ✅ ${file.fileType} — OK (${result.status})`);
      } else {
        brokenCount++;
        report.broken.push({
          fileId: file.id,
          fileType: file.fileType,
          albumId: file.albumId,
          albumTitle,
          url: file.filePath,
          status: result.status,
          error: result.error,
        });
        console.log(`[${num}/${total}] ❌ ${file.fileType} — BROKEN (${result.status || result.error})`);
        console.log(`          Album: "${albumTitle}"`);
        console.log(`          URL: ${file.filePath.substring(0, 70)}...`);
      }
    }

    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 100));
  }

  // Check settings logos
  console.log("\n🖼️  Checking business logos...");
  for (const s of allSettings) {
    if (!s.businessLogo) continue;
    if (s.businessLogo.includes("cloudinary.com")) {
      cloudinaryCount++;
      console.log(`   ☁️  Logo for user ${s.userId} — Still on Cloudinary`);
    } else {
      const result = await checkUrl(s.businessLogo);
      if (result.ok) {
        workingCount++;
        console.log(`   ✅ Logo for user ${s.userId} — OK`);
      } else {
        brokenCount++;
        console.log(`   ❌ Logo for user ${s.userId} — BROKEN`);
        report.broken.push({
          fileId: `logo_${s.userId}`,
          fileType: "business_logo",
          albumId: null,
          albumTitle: null,
          url: s.businessLogo,
          status: result.status,
          error: result.error,
        });
      }
    }
  }

  // Build summary
  report.summary = {
    totalChecked: allFiles.length + allSettings.filter(s => s.businessLogo).length,
    working: workingCount,
    broken: brokenCount,
    stillOnCloudinary: cloudinaryCount,
    migrationComplete: cloudinaryCount === 0 && brokenCount === 0,
  };

  // Save report
  const migrationDir = path.join(process.cwd(), "migration");
  if (!fs.existsSync(migrationDir)) fs.mkdirSync(migrationDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(migrationDir, `verify-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print final summary
  console.log("\n" + "=".repeat(52));
  console.log("📋 VERIFICATION REPORT");
  console.log("=".repeat(52));
  console.log(`✅ Working URLs:          ${workingCount}`);
  console.log(`❌ Broken URLs:           ${brokenCount}`);
  console.log(`☁️  Still on Cloudinary:  ${cloudinaryCount}`);
  console.log(`\n📄 Full report: migration/verify-report-${timestamp}.json`);

  if (brokenCount > 0) {
    console.log(`\n⚠️  ${brokenCount} BROKEN URLs found!`);
    console.log(`   These albums/files may not load for your customers.`);
    console.log(`   To fix, run: npx tsx script/revert-migration.ts`);
    console.log(`   Then investigate and re-run migration.`);
  } else if (cloudinaryCount > 0) {
    console.log(`\n⚠️  ${cloudinaryCount} files still on Cloudinary.`);
    console.log(`   Run migration again to complete: npx tsx script/migrate-to-r2.ts`);
  } else {
    console.log(`\n🎉 PERFECT! Everything is working correctly!`);
    console.log(`   All files are on R2, all URLs are accessible.`);
    console.log(`   Your customer QR codes will continue to work forever.`);
  }
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Verification failed:", err.message || err);
  process.exit(1);
});
