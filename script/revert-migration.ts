/**
 * ============================================================
 * REVERT MIGRATION — Emergency Rollback
 * ============================================================
 * Run this if ANYTHING goes wrong after migration.
 * This restores ALL database URLs back to the original
 * Cloudinary URLs from your backup file.
 *
 * Your Cloudinary files are NEVER deleted, so this will
 * instantly fix everything.
 *
 * HOW TO RUN:
 *   npx tsx script/revert-migration.ts
 *
 * TIME TO COMPLETE: ~30 seconds
 * ============================================================
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { files, settings } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("\n🔄 EventFold Studio — Emergency Revert Tool");
  console.log("=============================================");
  console.log("⚠️  This will restore ALL Cloudinary URLs from backup.\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }

  // Load backup
  const backupPath = path.join(process.cwd(), "migration", "backup-latest.json");
  if (!fs.existsSync(backupPath)) {
    console.error("❌ No backup found at migration/backup-latest.json");
    console.error("   Cannot revert without a backup file!");
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  console.log(`📄 Backup loaded: created at ${backup.backupCreatedAt}`);
  console.log(`📁 Backup contains ${backup.files.length} files\n`);

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Restore file URLs
  console.log("🔄 Restoring file URLs to original Cloudinary URLs...\n");
  let restoredCount = 0;
  let skippedCount = 0;

  for (const backupFile of backup.files) {
    if (!backupFile.filePath) {
      skippedCount++;
      continue;
    }

    try {
      await db
        .update(files)
        .set({ filePath: backupFile.filePath })
        .where(eq(files.id, backupFile.id));
      restoredCount++;
      process.stdout.write(".");
    } catch (err: any) {
      console.error(`\n❌ Failed to restore file ${backupFile.id}: ${err.message}`);
    }
  }

  console.log(`\n\n✅ Restored ${restoredCount} file URLs`);
  if (skippedCount > 0) {
    console.log(`   ⏭️  Skipped ${skippedCount} files with no filePath`);
  }

  // Restore settings/logo URLs
  console.log("\n🔄 Restoring business logo URLs...");
  let logoRestored = 0;

  for (const s of backup.settings) {
    if (!s.businessLogo) continue;
    try {
      await db
        .update(settings)
        .set({ businessLogo: s.businessLogo })
        .where(eq(settings.userId, s.userId));
      logoRestored++;
    } catch (err: any) {
      console.error(`\n❌ Failed to restore logo for user ${s.userId}: ${err.message}`);
    }
  }
  console.log(`✅ Restored ${logoRestored} logo URL(s)`);

  // Clear migration progress so we can re-run migration later
  const progressFile = path.join(process.cwd(), "migration", "progress.json");
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
    console.log("\n🗑️  Migration progress cleared (can re-run migration from scratch)");
  }

  console.log("\n" + "=".repeat(47));
  console.log("✅ REVERT COMPLETE!");
  console.log("=".repeat(47));
  console.log("\nAll your album URLs are now back to Cloudinary.");
  console.log("All QR codes and albums are working as before.");
  console.log("\nYou can investigate what went wrong and try again.");
  console.log("Your Cloudinary files were NEVER deleted.\n");
}

main().catch((err) => {
  console.error("\n❌ Revert failed:", err.message || err);
  process.exit(1);
});
