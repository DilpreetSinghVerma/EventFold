import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  console.log("Adding last_active_at to users table...");
  try {
    await sql`ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp;`;
    console.log("Added last_active_at successfully.");
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log("last_active_at already exists.");
    } else {
      console.error("Failed to add last_active_at:", e.message);
    }
  }

  console.log("Creating broadcasts table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "broadcasts" (
        "id" serial PRIMARY KEY NOT NULL,
        "message" text NOT NULL,
        "type" text DEFAULT 'info' NOT NULL,
        "is_active" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now()
    );
  `;
  console.log("Done.");
}

main().catch(console.error);
