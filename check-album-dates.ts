import 'dotenv/config';
import { db } from './server/db';
import { albums } from './shared/schema';

async function checkDates() {
  try {
    const allAlbums = await db.select().from(albums);
    console.log("Details for albums with expiry dates:");
    allAlbums
      .filter(a => a.expiresAt !== null)
      .forEach(a => {
        const created = a.createdAt ? new Date(a.createdAt).toISOString() : 'N/A';
        const expires = new Date(a.expiresAt!).toISOString();
        const diffMs = new Date(a.expiresAt!).getTime() - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        console.log(`Album ID: ${a.id.substring(0, 8)}... | Title: "${a.title}" | Created: ${created} | Expires: ${expires} | Trial Length: ${diffDays} days`);
      });
  } catch (err: any) {
    console.error("Failed:", err);
  }
}

checkDates();
