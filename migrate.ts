import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  console.log("Creating broadcasts table...");
  await sql`DROP TABLE IF EXISTS "broadcasts";`;
  await sql`
    CREATE TABLE "broadcasts" (
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
