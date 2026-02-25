import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

export let db: any = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== "dummy_url") {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    console.log("Database connection initialized successfully");
  } catch (err) {
    console.error("CRITICAL: Database initialization failed:", err);
  }
} else {
  console.warn("WARNING: DATABASE_URL is missing. Running in memory-only mode (Non-persistent).");
}
