/**
 * ============================================================
 * STEP 1: BACKUP DATABASE
 * ============================================================
 * Run this BEFORE doing anything else.
 * This saves a complete snapshot of all your albums, files,
 * and Cloudinary URLs to a local JSON file.
 *
 * If ANYTHING goes wrong during migration, this backup file
 * is your safety net to restore everything.
 *
 * HOW TO RUN:
 *   npx tsx script/backup-db.ts
 *
 * OUTPUT:
 *   migration/backup-[timestamp].json
 * ============================================================
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { albums, files, settings, users } from "../shared/schema";
import { asc } from "drizzle-orm";

async function main() {
  console.log("\n🔒 EventFold Studio — Database Backup Tool");
  console.log("==========================================\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not found in .env file.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("📡 Connecting to Neon database...");

  // Fetch all data
  console.log("📦 Fetching all albums...");
  const allAlbums = await db.select().from(albums).orderBy(asc(albums.createdAt));
  console.log(`   ✅ Found ${allAlbums.length} albums`);

  console.log("📦 Fetching all files...");
  const allFiles = await db.select().from(files).orderBy(asc(files.orderIndex));
  console.log(`   ✅ Found ${allFiles.length} files`);

  console.log("📦 Fetching all users...");
  const allUsers = await db.select().from(users).orderBy(asc(users.createdAt));
  console.log(`   ✅ Found ${allUsers.length} users`);

  console.log("📦 Fetching all settings...");
  const allSettings = await db.select().from(settings);
  console.log(`   ✅ Found ${allSettings.length} settings records`);

  // Count Cloudinary files
  const cloudinaryFiles = allFiles.filter(f =>
    f.filePath && f.filePath.includes("cloudinary.com")
  );
  const r2Files = allFiles.filter(f =>
    f.filePath && !f.filePath.includes("cloudinary.com")
  );

  console.log(`\n📊 Storage Analysis:`);
  console.log(`   ☁️  Cloudinary files: ${cloudinaryFiles.length}`);
  console.log(`   🌐 Other/R2 files:   ${r2Files.length}`);
  console.log(`   📁 Total files:      ${allFiles.length}`);

  // Build backup object
  const backup = {
    backupCreatedAt: new Date().toISOString(),
    backupVersion: "1.0",
    summary: {
      totalAlbums: allAlbums.length,
      totalFiles: allFiles.length,
      cloudinaryFiles: cloudinaryFiles.length,
      r2Files: r2Files.length,
      totalUsers: allUsers.length,
    },
    albums: allAlbums,
    files: allFiles,
    users: allUsers.map(u => ({
      ...u,
      // Mask sensitive fields in backup (we don't need passwords for restore)
      password: u.password ? "[HASHED]" : null,
    })),
    settings: allSettings,
  };

  // Save to migration folder
  const migrationDir = path.join(process.cwd(), "migration");
  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(migrationDir, `backup-${timestamp}.json`);

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");

  // Also save a "latest" copy for easy reference
  const latestPath = path.join(migrationDir, "backup-latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(backup, null, 2), "utf-8");

  console.log(`\n✅ BACKUP COMPLETE!`);
  console.log(`   📄 Saved to: migration/backup-${timestamp}.json`);
  console.log(`   📄 Also at:  migration/backup-latest.json`);
  console.log(`\n💡 IMPORTANT: Keep this file safe!`);
  console.log(`   If anything goes wrong during migration,`);
  console.log(`   run: npx tsx script/revert-migration.ts\n`);
}

main().catch((err) => {
  console.error("\n❌ Backup failed:", err.message || err);
  process.exit(1);
});
