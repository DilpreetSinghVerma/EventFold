import { db } from "../db";
import { albums, users, settings } from "../../shared/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { sendAlbumNearExpiryEmail, sendAlbumExpiredEmail } from "./email";
import { sendWhatsAppNotification } from "./whatsapp";

export async function checkAndSendAlbumExpiryNotifications() {
  if (!db) {
    console.log('[NOTIFICATIONS] Database connection not available for expiry checks');
    return;
  }

  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));

  console.log(`[NOTIFICATIONS] Running free trial album expiry check...`);

  try {
    // 1. Near Expiration check (expires in <= 24 hours, still in future, nearExpiryNotificationSent = 0)
    const nearExpiryAlbums = await db.select({
      album: albums,
      user: users,
      setting: settings,
    })
    .from(albums)
    .innerJoin(users, eq(albums.userId, users.id))
    .leftJoin(settings, eq(users.id, settings.userId))
    .where(
      and(
        isNotNull(albums.expiresAt),
        lte(albums.expiresAt, oneDayFromNow),
        eq(albums.nearExpiryNotificationSent, 0)
      )
    );

    for (const record of nearExpiryAlbums) {
      const { album, user, setting } = record;
      
      const msLeft = new Date(album.expiresAt!).getTime() - now.getTime();
      const hoursLeft = Math.max(0, Math.round(msLeft / (1000 * 60 * 60)));

      // If the album already expired, let the expired block handle it
      if (msLeft <= 0) {
        continue;
      }

      console.log(`[NOTIFICATIONS] Album "${album.title}" by ${user.email} expires in ${hoursLeft} hours. Sending alert...`);

      // 1. Email Alert
      await sendAlbumNearExpiryEmail(user.email, album.title, hoursLeft);

      // 2. WhatsApp Alert
      const phone = setting?.contactWhatsApp || album.customContactWhatsApp;
      if (phone) {
        const message = `Hello! Action Required: Your free trial album "${album.title}" is expiring in ${hoursLeft} hours. Upgrade to permanent hosting now to keep it active for your clients! https://www.eventfoldstudio.com/dashboard`;
        await sendWhatsAppNotification(phone, message, album.title);
      } else {
        console.log(`[NOTIFICATIONS] No WhatsApp contact configured for user ${user.email}`);
      }

      // 3. Mark sent
      await db.update(albums)
        .set({ nearExpiryNotificationSent: 1 })
        .where(eq(albums.id, album.id));
    }

    // 2. Already Expired check (expiresAt <= now, expiryNotificationSent = 0)
    const expiredAlbums = await db.select({
      album: albums,
      user: users,
      setting: settings,
    })
    .from(albums)
    .innerJoin(users, eq(albums.userId, users.id))
    .leftJoin(settings, eq(users.id, settings.userId))
    .where(
      and(
        isNotNull(albums.expiresAt),
        lte(albums.expiresAt, now),
        eq(albums.expiryNotificationSent, 0)
      )
    );

    for (const record of expiredAlbums) {
      const { album, user, setting } = record;

      console.log(`[NOTIFICATIONS] Album "${album.title}" by ${user.email} has expired. Sending alert...`);

      // 1. Email Alert
      await sendAlbumExpiredEmail(user.email, album.title);

      // 2. WhatsApp Alert
      const phone = setting?.contactWhatsApp || album.customContactWhatsApp;
      if (phone) {
        const message = `Notice: Your free trial album "${album.title}" has expired and client access is paused. Upgrade to permanent hosting now to restore it instantly! https://www.eventfoldstudio.com/dashboard`;
        await sendWhatsAppNotification(phone, message, album.title);
      } else {
        console.log(`[NOTIFICATIONS] No WhatsApp contact configured for user ${user.email}`);
      }

      // 3. Mark sent
      await db.update(albums)
        .set({ expiryNotificationSent: 1 })
        .where(eq(albums.id, album.id));
    }

  } catch (err) {
    console.error('[NOTIFICATIONS] Error running background notifications:', err);
  }
}
