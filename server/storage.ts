import crypto from "crypto";
import { type InsertAlbum, type Album, type InsertFile, type File, type User, type InsertUser, albums, files, settings, users } from "../shared/schema";
import { db } from "./db";
import { eq, asc, lte, and, isNotNull } from "drizzle-orm";

export interface IStorage {
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbums(): Promise<Album[]>;
  getAlbumsByUser(userId: string): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | undefined>;
  deleteAlbum(id: string): Promise<void>;

  createFile(file: InsertFile): Promise<File>;
  getFilesByAlbum(albumId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteFilesByAlbum(albumId: string): Promise<void>;

  getSettings(userId: string): Promise<any>;
  updateSettings(userId: string, data: any): Promise<void>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deductCredit(userId: string): Promise<User>;
  addCredit(userId: string, amount: number): Promise<User>;
  incrementAlbumViews(id: string): Promise<void>;
  cleanupExpiredAlbums(): Promise<void>;
  getPublicDemos(): Promise<Album[]>;
  updateAlbum(id: string, data: Partial<Album>): Promise<Album>;
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
    const isSoftwareMode = process.env.LOCAL_SOFTWARE_MODE === "true" && !process.env.VERCEL;
    if (id === 'local_studio_admin' && isSoftwareMode) {
        return {
            id: 'local_studio_admin',
            googleId: null,
            email: 'studio@local',
            name: 'Studio Master',
            avatar: null,
            plan: 'software_pro',
            credits: 9999,
            stripeCustomerId: null,
            subscriptionId: null,
            razorpayCustomerId: null,
            razorpaySubscriptionId: null,
            password: null,
            isVerified: 1,
            verificationCode: null,
            createdAt: new Date()
        };
    }
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
    await db.update(albums)
      .set({ views: (album.views || 0) + 1 })
      .where(eq(albums.id, id));
  }

  async cleanupExpiredAlbums(): Promise<void> {
    if (!db) return;
    const now = new Date();
    // Delete albums where expiresAt is in the past
    await db.delete(albums).where(
      and(
        isNotNull(albums.expiresAt),
        lte(albums.expiresAt, now)
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
}

export class MemStorage implements IStorage {
  private albums: Map<string, Album>;
  private files: Map<string, File>;
  private users: Map<string, User>;
  private settings: Map<string, any>;
  private albumIdCounter: number;
  private fileIdCounter: number;
  private userIdCounter: number;

  constructor() {
    this.albums = new Map();
    this.files = new Map();
    this.users = new Map();
    this.settings = new Map();
    this.albumIdCounter = 1;
    this.fileIdCounter = 1;
    this.userIdCounter = 1;
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
    const isSoftwareMode = process.env.LOCAL_SOFTWARE_MODE === "true" && !process.env.VERCEL;
    if (id === 'local_studio_admin' && isSoftwareMode) {
        return {
            id: 'local_studio_admin',
            googleId: null,
            email: 'studio@local',
            name: 'Studio Master',
            avatar: null,
            plan: 'software_pro',
            credits: 9999,
            stripeCustomerId: null,
            subscriptionId: null,
            razorpayCustomerId: null,
            razorpaySubscriptionId: null,
            password: null,
            isVerified: 1,
            verificationCode: null,
            createdAt: new Date()
        };
    }
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
    const entries = Array.from(this.albums.entries());
    for (const [id, album] of entries) {
      if (album.expiresAt && album.expiresAt <= now) {
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
}

let _storage: IStorage | null = null;

function getStorage(): IStorage {
  if (_storage) return _storage;

  const url = process.env.DATABASE_URL;
  if (url && url !== "dummy_url") {
    console.log("STORAGE: Initializing DatabaseStorage (DATABASE_URL detected)");
    _storage = new DatabaseStorage();
    
    // Auto-provision local admin if in software mode (and not on Vercel)
    const isSoftwareMode = process.env.LOCAL_SOFTWARE_MODE === "true" && !process.env.VERCEL;
    if (isSoftwareMode) {
        (async () => {
            try {
                const existing = await _storage!.getUser('local_studio_admin');
                if (!existing) {
                    await db.insert(users).values({
                        id: 'local_studio_admin',
                        email: 'studio@local',
                        name: 'Studio Master',
                        plan: 'software_pro',
                        credits: 9999,
                        password: null,
                        isVerified: 1
                    });
                    console.log("STORAGE: Provisioned 'local_studio_admin' user.");
                }
            } catch (e) {
                console.warn("STORAGE: Failed to auto-provision local admin (probably DB not ready yet/schema mismatch).", e);
            }
        })();
    }
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
