import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const url = process.env.DATABASE_URL;
    console.log("Testing with URL:", url ? url.substring(0, 20) + "..." : "MISSING");
    if (!url) return;

    try {
        const sql = neon(url);
        const db = drizzle(sql);
        console.log("Attempting query...");
        const res = await sql`SELECT 1 as test`;
        console.log("SUCCESS:", res);
    } catch (err: any) {
        console.error("ERROR connection failed:", err.message);
        console.error("FULL ERROR:", err);
    }
}
test();
