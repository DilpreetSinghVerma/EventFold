import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function syncDb() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('DATABASE_URL missing');
        return;
    }

    const sql = neon(url);
    console.log('Regenerating settings table to allow private branding...');
    
    try {
        // Drop old global settings table if it still exists with the old schema
        await sql(`DROP TABLE IF EXISTS settings;`);
        
        // Recreate it with user_id as the primary key
        await sql(`
            CREATE TABLE settings (
                user_id text PRIMARY KEY,
                business_name text NOT NULL DEFAULT 'EventFold Studio',
                business_logo text,
                contact_whatsapp text,
                admin_password text NOT NULL DEFAULT 'admin123'
            );
        `);
        console.log('✓ Settings table successfully updated to per-user mode.');
    } catch (err) {
        console.error('Failed to sync database:', err);
    }
}

syncDb();
