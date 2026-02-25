import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

export let db: any = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== "dummy_url") {
  try {
    // Use the optimized Neon HTTP driver for Serverless environments
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    console.log("Neon HTTP Database initialized");
  } catch (err) {
    console.error("CRITICAL: Database initialization failed:", err);
  }
} else {
  console.warn("WARNING: DATABASE_URL is missing. Running in memory-only mode.");
}
