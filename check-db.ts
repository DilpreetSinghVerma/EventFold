import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { eq, desc } from 'drizzle-orm';
import { broadcasts } from './shared/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  
  try {
    const res = await db.select().from(broadcasts).where(eq(broadcasts.isActive, 1)).orderBy(desc(broadcasts.createdAt)).limit(1);
    console.log(res);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}

main().catch(console.error);
