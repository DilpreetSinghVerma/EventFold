import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema";

// Use a lazy getter for the database to prevent cold-start timeouts
let _db: any = null;

export const getDb = () => {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url || url === "dummy_url") {
    throw new Error("DATABASE_URL is missing");
  }

  try {
    const sql = neon(url);
    _db = drizzle(sql, { schema });
    return _db;
  } catch (err) {
    console.error("Failed to connect to Neon:", err);
    throw err;
  }
};

// Also export db for compatibility, but initialized lazily
export const db = new Proxy({}, {
  get: (_target, prop) => {
    const database = getDb();
    return database[prop];
  }
}) as any;
