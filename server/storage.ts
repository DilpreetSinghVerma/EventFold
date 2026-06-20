import crypto from "crypto";
import { type InsertAlbum, type Album, type InsertFile, type File, type User, type InsertUser, type Referral, type InsertReferral, type KioskLead, type PromoCode, type Exhibition, albums, files, settings, users, referrals, kioskLeads, promoCodes, promoRedemptions, exhibitions } from "../shared/schema";
import { db } from "./db";
import { eq, asc, lte, and, isNotNull, sql } from "drizzle-orm";

export interface IStorage {
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbums(): Promise<Album[]>;
  getAlbumsByUser(userId: string): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | undefined>;
  deleteAlbum(id: string): Promise<void>;

  createFile(file: InsertFile): Promise<File>;
  getFilesByAlbum(albumId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;
  deleteFilesByAlbum(albumId: string): Promise<void>;
  updateFile(id: string, data: Partial<File>): Promise<File>;
  incrementFileViews(id: string): Promise<void>;
  incrementEngagementTime(albumId: string, seconds: number): Promise<void>;

  getSettings(userId: string): Promise<any>;
  updateSettings(userId: string, data: any): Promise<void>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deductCredit(userId: string): Promise<User>;
  addCredit(userId: string, amount: number): Promise<User>;
  getUsers(): Promise<User[]>;
  getAllAlbums(): Promise<Album[]>;
  deleteUser(userId: string): Promise<void>;
  incrementAlbumViews(id: string): Promise<void>;
  cleanupExpiredAlbums(): Promise<void>;
  getPublicDemos(): Promise<Album[]>;
  updateAlbum(id: string, data: Partial<Album>): Promise<Album>;

  getUserByReferralCode(code: string): Promise<User | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral>;
  getReferralByReferee(refereeId: string): Promise<Referral | undefined>;

  createExhibition(name: string, prefix: string): Promise<any>;
  getExhibitions(): Promise<any[]>;
  getExhibition(id: string): Promise<any | undefined>;
  createKioskLead(data: { exhibitionId: string; name: string; email: string }): Promise<KioskLead>;
  getKioskLeads(exhibitionId: string): Promise<KioskLead[]>;
  deleteKioskLead(id: string): Promise<void>;
  createPromoCode(code: string, expiresAt?: Date | null, credits?: number, maxUses?: number, type?: string, discountPercentage?: number | null, affiliateName?: string | null): Promise<PromoCode>;
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  deletePromoCode(id: string): Promise<void>;
  updatePromoMaxUses(id: string, maxUses: number): Promise<void>;
  hasUserRedeemedPromo(promoId: string, userId: string): Promise<boolean>;
  getPromoRedemptionsWithDetails(): Promise<any[]>;
  markPromoCodeUsed(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    if (!db) throw new Error("Database connection not established. Check your DATABASE_URL.");
    const [album] = await db.insert(albums).values(insertAlbum).returning();
    return album;
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums).orderBy(asc(albums.createdAt));
  }

  async getAlbumsByUser(userId: string): Promise<Album[]> {
    return await db.select().from(albums).where(eq(albums.userId, userId)).orderBy(asc(albums.createdAt));
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async deleteAlbum(id: string): Promise<void> {
    await db.delete(albums).where(eq(albums.id, id));
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async getFilesByAlbum(albumId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.albumId, albumId))
      .orderBy(asc(files.orderIndex));
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async deleteFilesByAlbum(albumId: string): Promise<void> {
    await db.delete(files).where(eq(files.albumId, albumId));
  }

  async getSettings(userId: string): Promise<any> {
    if (!db) return { businessName: "EventFold Studio", businessLogo: null, contactWhatsApp: null, adminPassword: "admin123" };
    const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
    return row || { businessName: "EventFold Studio", businessLogo: null, contactWhatsApp: null, adminPassword: "admin123" };
  }

  async updateSettings(userId: string, data: any): Promise<void> {
    if (!db) return;
    await db.insert(settings)
      .values({ ...data, userId })
      .onConflictDoUpdate({
        target: settings.userId,
        set: data
      });
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!db) return;
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) return;
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (!db) return;
    const [row] = await db.select().from(users).where(eq(users.googleId, googleId));
    return row;
  }



  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.insert(users).values(insertUser).returning();
    return row;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!row) throw new Error("User not found");
    return row;
  }

  async deductCredit(userId: string): Promise<User> {
    if (!db) throw new Error("DB not connected");
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    if (user.credits <= 0) throw new Error("No credits left. Please purchase an album credit.");

    const [updated] = await db.update(users)
      .set({ credits: user.credits - 1 })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async addCredit(userId: string, amount: number): Promise<User> {
    if (!db) throw new Error("DB not connected");
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const [updated] = await db.update(users)
      .set({ credits: user.credits + amount })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async incrementAlbumViews(id: string): Promise<void> {
    if (!db) return;
    const album = await this.getAlbum(id);
    if (!album) return;
    
    const newViews = (album.views || 0) + 1;
    await db.update(albums)
      .set({ views: newViews })
      .where(eq(albums.id, id));

    // Check view milestones to trigger congratulations email
    const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    if (milestones.includes(newViews) && album.userId) {
      this.getUser(album.userId).then((user) => {
        if (user?.email) {
          import("./lib/email").then(({ sendAlbumMilestoneEmail }) => {
            sendAlbumMilestoneEmail(user.email, album.title, newViews).catch(err => {
              console.error("Failed to send album milestone email in background:", err);
            });
          }).catch(err => {
            console.error("Failed to dynamically import email library for milestone check:", err);
          });
        }
      }).catch(err => {
        console.error("Failed to fetch user for milestone email:", err);
      });
    }
  }

  async cleanupExpiredAlbums(): Promise<void> {
    if (!db) return;
    const now = new Date();
    const gracePeriodThreshold = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    // Delete albums where expiresAt was more than 30 days ago
    await db.delete(albums).where(
      and(
        isNotNull(albums.expiresAt),
        lte(albums.expiresAt, gracePeriodThreshold)
      )
    );
  }

  async getPublicDemos(): Promise<Album[]> {
    if (!db) return [];
    return await db.select().from(albums).where(eq(albums.isPublicDemo, 'true')).orderBy(asc(albums.createdAt));
  }

  async updateAlbum(id: string, data: Partial<Album>): Promise<Album> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.update(albums).set(data).where(eq(albums.id, id)).returning();
    if (!row) throw new Error("Album not found");
    return row;
  }

  async updateFile(id: string, data: Partial<File>): Promise<File> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.update(files).set(data).where(eq(files.id, id)).returning();
    if (!row) throw new Error("File not found");
    return row;
  }

  async incrementFileViews(id: string): Promise<void> {
    if (!db) return;
    const file = await this.getFile(id);
    if (!file) return;
    await db.update(files)
      .set({ views: (file.views || 0) + 1 })
      .where(eq(files.id, id));
  }

  async incrementEngagementTime(albumId: string, seconds: number): Promise<void> {
    if (!db) return;
    const album = await this.getAlbum(albumId);
    if (!album) return;
    await db.update(albums)
      .set({ totalEngagementTime: (album.totalEngagementTime || 0) + seconds })
      .where(eq(albums.id, albumId));
  }

  async getUsers(): Promise<User[]> {
    if (!db) return [];
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getAllAlbums(): Promise<Album[]> {
    if (!db) return [];
    return await db.select().from(albums).orderBy(asc(albums.createdAt));
  }

  async deleteUser(userId: string): Promise<void> {
    if (!db) return;
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.select().from(users).where(eq(users.referralCode, code));
    return row;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    if (!db) throw new Error("DB not connected");
    return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(asc(referrals.createdAt));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.insert(referrals).values(insertReferral).returning();
    return row;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.update(referrals).set(data).where(eq(referrals.id, id)).returning();
    if (!row) throw new Error("Referral not found");
    return row;
  }

  async getReferralByReferee(refereeId: string): Promise<Referral | undefined> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.select().from(referrals).where(eq(referrals.refereeId, refereeId));
    return row;
  }

  async createExhibition(name: string, prefix: string): Promise<any> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.insert(exhibitions).values({ name, prefix }).returning();
    return row;
  }

  async getExhibitions(): Promise<any[]> {
    if (!db) return [];
    return await db.select().from(exhibitions).orderBy(asc(exhibitions.createdAt));
  }

  async getExhibition(id: string): Promise<any | undefined> {
    if (!db) return undefined;
    const [row] = await db.select().from(exhibitions).where(eq(exhibitions.id, id));
    return row;
  }

  async createKioskLead(data: { exhibitionId: string; name: string; email: string }): Promise<KioskLead> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.insert(kioskLeads).values(data).returning();
    return row;
  }

  async getKioskLeads(exhibitionId: string): Promise<KioskLead[]> {
    if (!db) throw new Error("Database connection not established. Check your DATABASE_URL.");
    return await db.select().from(kioskLeads).where(eq(kioskLeads.exhibitionId, exhibitionId)).orderBy(asc(kioskLeads.createdAt));
  }

  async deleteKioskLead(id: string): Promise<void> {
    if (!db) throw new Error("Database connection not established. Check your DATABASE_URL.");
    await db.delete(kioskLeads).where(eq(kioskLeads.id, id));
  }

  async createPromoCode(code: string, expiresAt?: Date | null, credits: number = 1, maxUses: number = 1, type: string = 'credits', discountPercentage: number | null = null, affiliateName: string | null = null): Promise<PromoCode> {
    if (!db) throw new Error("DB not connected");
    const [row] = await db.insert(promoCodes).values({ code, expiresAt, credits, maxUses, currentUses: 0, type, discountPercentage, affiliateName }).returning();
    return row;
  }

  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    if (!db) return undefined;
    const [row] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
    return row;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    if (!db) return [];
    return await db.select().from(promoCodes).orderBy(promoCodes.createdAt);
  }

  async deletePromoCode(id: string): Promise<void> {
    if (!db) throw new Error("DB not connected");
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async updatePromoMaxUses(id: string, maxUses: number): Promise<void> {
    if (!db) throw new Error("DB not connected");
    await db.update(promoCodes).set({ maxUses }).where(eq(promoCodes.id, id));
  }

  async hasUserRedeemedPromo(promoId: string, userId: string): Promise<boolean> {
    if (!db) return false;
    const [row] = await db.select().from(promoRedemptions).where(and(
      eq(promoRedemptions.promoCodeId, promoId),
      eq(promoRedemptions.userId, userId)
    ));
    return !!row;
  }

  async getPromoRedemptionsWithDetails(): Promise<any[]> {
    if (!db) return [];
    const results = await db.select({
      id: promoRedemptions.id,
      redeemedAt: promoRedemptions.redeemedAt,
      promoCode: promoCodes.code,
      credits: promoCodes.credits,
      type: promoCodes.type,
      discountPercentage: promoCodes.discountPercentage,
      affiliateName: promoCodes.affiliateName,
      userName: users.name,
      userEmail: users.email,
    })
    .from(promoRedemptions)
    .innerJoin(promoCodes, eq(promoRedemptions.promoCodeId, promoCodes.id))
    .innerJoin(users, eq(promoRedemptions.userId, users.id))
    .orderBy(desc(promoRedemptions.redeemedAt));
    
    return results;
  }

  async markPromoCodeUsed(id: string, userId: string): Promise<void> {
    if (!db) return;
    
    // Record the redemption
    await db.insert(promoRedemptions).values({ promoCodeId: id, userId }).onConflictDoNothing();

    // Increment currentUses
    await db.update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(eq(promoCodes.id, id));
    
    // Check if it reached max uses, and mark isUsed if so
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (promo && promo.currentUses >= promo.maxUses) {
      await db.update(promoCodes)
        .set({ isUsed: 1, usedById: userId, usedAt: new Date() })
        .where(eq(promoCodes.id, id));
    }
  }
}

export class MemStorage implements IStorage {
  private albums: Map<string, Album>;
  private files: Map<string, File>;
  private users: Map<string, User>;
  private settings: Map<string, any>;
  private referrals: Map<string, Referral>;
  private kioskLeads: Map<string, KioskLead>;
  private promoCodes: Map<string, PromoCode>;
  private albumIdCounter: number;
  private fileIdCounter: number;
  private userIdCounter: number;
  private referralIdCounter: number;

  constructor() {
    this.albums = new Map();
    this.files = new Map();
    this.users = new Map();
    this.settings = new Map();
    this.referrals = new Map();
    this.kioskLeads = new Map();
    this.promoCodes = new Map();
    this.albumIdCounter = 1;
    this.fileIdCounter = 1;
    this.userIdCounter = 1;
    this.referralIdCounter = 1;
  }

  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const id = crypto.randomUUID();
    const album: Album = {
      ...insertAlbum,
      id,
      userId: insertAlbum.userId || null,
      theme: insertAlbum.theme || 'royal',
      password: insertAlbum.password || null,
      views: 0,
      expiresAt: insertAlbum.expiresAt || null,
      isPublicDemo: insertAlbum.isPublicDemo || 'false',
      demoCategory: insertAlbum.demoCategory || null,
      category: insertAlbum.category || 'Uncategorized',
      bgMusicUrl: insertAlbum.bgMusicUrl || null,
      totalEngagementTime: 0,
      avgRating: 0,
      totalRatings: 0,
      showInPortfolio: insertAlbum.showInPortfolio ?? 0,
      customBusinessName: insertAlbum.customBusinessName || null,
      customBusinessLogo: insertAlbum.customBusinessLogo || null,
      customContactWhatsApp: insertAlbum.customContactWhatsApp || null,
      isLabAlbum: insertAlbum.isLabAlbum || 0,
      expiryNotificationSent: 0,
      createdAt: new Date(),
    };
    this.albums.set(id, album);
    return album;
  }

  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbumsByUser(userId: string): Promise<Album[]> {
    return Array.from(this.albums.values()).filter(a => a.userId === userId);
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async deleteAlbum(id: string): Promise<void> {
    this.albums.delete(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = crypto.randomUUID();
    const file: File = {
      ...insertFile,
      id,
      orderIndex: insertFile.orderIndex ?? 0,
      favoritesCount: insertFile.favoritesCount ?? 0,
      views: 0,
    };
    this.files.set(id, file);
    return file;
  }

  async getFilesByAlbum(albumId: string): Promise<File[]> {
    return Array.from(this.files.values())
      .filter((file) => file.albumId === albumId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
  }

  async deleteFilesByAlbum(albumId: string): Promise<void> {
    const filesToDelete = Array.from(this.files.values()).filter(
      (file) => file.albumId === albumId
    );
    for (const file of filesToDelete) {
      this.files.delete(file.id);
    }
  }

  async getSettings(userId: string): Promise<any> {
    return this.settings.get(userId) || { businessName: "EventFold Studio", businessLogo: null, contactWhatsApp: null, adminPassword: "admin123" };
  }

  async updateSettings(userId: string, data: any): Promise<void> {
    const existing = this.settings.get(userId) || {};
    this.settings.set(userId, { ...existing, ...data, userId });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.googleId === googleId);
  }



  async createUser(insertUser: InsertUser): Promise<User> {
    const id = String(this.userIdCounter++);
    const user: User = {
      ...insertUser,
      id,
      name: insertUser.name || null,
      email: insertUser.email,
      avatar: insertUser.avatar || null,
      googleId: insertUser.googleId || null,
      stripeCustomerId: insertUser.stripeCustomerId || null,
      subscriptionId: insertUser.subscriptionId || null,
      razorpayCustomerId: insertUser.razorpayCustomerId || null,
      razorpaySubscriptionId: insertUser.razorpaySubscriptionId || null,
      password: insertUser.password || null,
      isVerified: insertUser.isVerified || 0,
      verificationCode: insertUser.verificationCode || null,
      plan: insertUser.plan || 'free',
      credits: insertUser.credits ?? 1,
      role: insertUser.role || (insertUser.email === 'dilpreetsinghverma@gmail.com' ? 'admin' : 'user'),
      subscriptionStartedAt: insertUser.subscriptionStartedAt || null,
      subscriptionExpiresAt: insertUser.subscriptionExpiresAt || null,
      lastActiveAt: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async deductCredit(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    if (user.credits <= 0) throw new Error("No credits left");
    const updated = { ...user, credits: user.credits - 1 };
    this.users.set(userId, updated);
    return updated;
  }

  async addCredit(userId: string, amount: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, credits: user.credits + amount };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async incrementAlbumViews(id: string): Promise<void> {
    const album = this.albums.get(id);
    if (album) {
      this.albums.set(id, { ...album, views: (album.views || 0) + 1 });
    }
  }

  async cleanupExpiredAlbums(): Promise<void> {
    const now = new Date();
    const gracePeriodThreshold = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    const entries = Array.from(this.albums.entries());
    for (const [id, album] of entries) {
      if (album.expiresAt && album.expiresAt <= gracePeriodThreshold) {
        this.albums.delete(id);
        // Also delete associated files
        const filesToDelete = Array.from(this.files.values()).filter(f => f.albumId === id);
        for (const file of filesToDelete) {
          this.files.delete(file.id);
        }
      }
    }
  }

  async getPublicDemos(): Promise<Album[]> {
    return Array.from(this.albums.values()).filter(a => a.isPublicDemo === 'true');
  }

  async updateAlbum(id: string, data: Partial<Album>): Promise<Album> {
    const album = this.albums.get(id);
    if (!album) throw new Error("Album not found");
    const updated = { ...album, ...data };
    this.albums.set(id, updated);
    return updated;
  }

  async updateFile(id: string, data: Partial<File>): Promise<File> {
    const file = this.files.get(id);
    if (!file) throw new Error("File not found");
    const updated = { ...file, ...data };
    this.files.set(id, updated);
    return updated;
  }

  async incrementFileViews(id: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      this.files.set(id, { ...file, views: (file.views || 0) + 1 });
    }
  }

  async incrementEngagementTime(albumId: string, seconds: number): Promise<void> {
    const album = this.albums.get(albumId);
    if (album) {
      this.albums.set(albumId, { ...album, totalEngagementTime: (album.totalEngagementTime || 0) + seconds });
    }
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.referralCode === code);
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = crypto.randomUUID();
    const referral: Referral = {
      id,
      referrerId: insertReferral.referrerId,
      refereeId: insertReferral.refereeId,
      status: insertReferral.status || 'joined',
      createdAt: new Date(),
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral> {
    const referral = this.referrals.get(id);
    if (!referral) throw new Error("Referral not found");
    const updated = { ...referral, ...data };
    this.referrals.set(id, updated);
    return updated;
  }

  async getReferralByReferee(refereeId: string): Promise<Referral | undefined> {
    return Array.from(this.referrals.values()).find(r => r.refereeId === refereeId);
  }

  private exhibitions = new Map<string, any>();

  async createExhibition(name: string, prefix: string): Promise<any> {
    const id = crypto.randomUUID();
    const ex = { id, name, prefix, createdAt: new Date() };
    this.exhibitions.set(id, ex);
    return ex;
  }

  async getExhibitions(): Promise<any[]> {
    return Array.from(this.exhibitions.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getExhibition(id: string): Promise<any | undefined> {
    return this.exhibitions.get(id);
  }

  async createKioskLead(data: { exhibitionId: string; name: string; email: string }): Promise<KioskLead> {
    const id = crypto.randomUUID();
    const lead: KioskLead = { id, ...data, createdAt: new Date() };
    this.kioskLeads.set(id, lead);
    return lead;
  }

  async getKioskLeads(exhibitionId: string): Promise<KioskLead[]> {
    return Array.from(this.kioskLeads.values()).filter(l => l.exhibitionId === exhibitionId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async deleteKioskLead(id: string): Promise<void> {
    this.kioskLeads.delete(id);
  }

  async createPromoCode(code: string, expiresAt?: Date | null, credits: number = 1, maxUses: number = 1, type: string = 'credits', discountPercentage: number | null = null, affiliateName: string | null = null): Promise<PromoCode> {
    const id = crypto.randomUUID();
    const promo: PromoCode = { id, code, isUsed: 0, usedById: null, createdAt: new Date(), usedAt: null, expiresAt: expiresAt || null, credits, maxUses, currentUses: 0, type, discountPercentage, affiliateName };
    this.promoCodes.set(id, promo);
    return promo;
  }

  async hasUserRedeemedPromo(promoId: string, userId: string): Promise<boolean> {
    return false; // MemStorage dummy
  }
  async getPromoRedemptionsWithDetails(): Promise<any[]> {
    return [];
  }

  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    return Array.from(this.promoCodes.values()).find(p => p.code === code);
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return Array.from(this.promoCodes.values());
  }

  async deletePromoCode(id: string): Promise<void> {
    this.promoCodes.delete(id);
  }

  async updatePromoMaxUses(id: string, maxUses: number): Promise<void> {
    const promo = this.promoCodes.get(id);
    if (promo) this.promoCodes.set(id, { ...promo, maxUses });
  }

  async markPromoCodeUsed(id: string, userId: string): Promise<void> {
    const promo = this.promoCodes.get(id);
    if (promo) {
      this.promoCodes.set(id, { ...promo, isUsed: 1, usedById: userId, usedAt: new Date() });
    }
  }
}

let _storage: IStorage | null = null;

function getStorage(): IStorage {
  if (_storage) return _storage;

  const url = process.env.DATABASE_URL;
  if (url && url !== "dummy_url") {
    console.log("STORAGE: Initializing DatabaseStorage (DATABASE_URL detected)");
    _storage = new DatabaseStorage();
    
  } else {
    console.log("STORAGE: Initializing MemStorage (DATABASE_URL missing or empty)");
    _storage = new MemStorage();
  }
  return _storage;
}

export const storage = new Proxy({}, {
  get: (_target, prop) => {
    return (getStorage() as any)[prop];
  }
}) as IStorage;


