import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

// Use a lazy getter for the database to prevent cold-start timeouts
let _db: any = null;

export const getDb = () => {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url || url === "dummy_url") {
    console.warn("DATABASE_URL is missing. Database operations will fail with a connection error.");
    return null;
  }

  try {
    const sql = neon(url);
    _db = drizzle(sql, { schema });
    return _db;
  } catch (err) {
    console.error("Failed to connect to Neon:", err);
    return null;
  }
};

// Also export db for compatibility, but initialized lazily
export const db = new Proxy({}, {
  get: (_target, prop) => {
    const database = getDb();
    if (!database) {
      throw new Error("DATABASE_URL is missing or database is not connected. Use MemStorage for local testing or add DATABASE_URL to your environment.");
    }
    return database[prop];
  }
}) as any;
