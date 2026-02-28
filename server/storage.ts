import crypto from "crypto";
import { type InsertAlbum, type Album, type InsertFile, type File, albums, files, settings } from "../shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbums(): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | undefined>;
  deleteAlbum(id: string): Promise<void>;

  createFile(file: InsertFile): Promise<File>;
  getFilesByAlbum(albumId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteFilesByAlbum(albumId: string): Promise<void>;

  getSettings(): Promise<any>;
  updateSettings(data: any): Promise<void>;
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

  async getSettings(): Promise<any> {
    if (!db) return { businessName: "EventFold Studio" };
    const [row] = await db.select().from(settings).where(eq(settings.id, 1));
    return row || { businessName: "EventFold Studio" };
  }

  async updateSettings(data: any): Promise<void> {
    if (!db) return;
    await db.insert(settings)
      .values({ ...data, id: 1 })
      .onConflictDoUpdate({
        target: settings.id,
        set: data
      });
  }
}

export class MemStorage implements IStorage {
  private albums: Map<string, Album>;
  private files: Map<string, File>;
  private settings: any;
  private albumIdCounter: number;
  private fileIdCounter: number;

  constructor() {
    this.albums = new Map();
    this.files = new Map();
    this.settings = { id: 1, businessName: "EventFold Studio", adminPassword: "admin123" };
    this.albumIdCounter = 1;
    this.fileIdCounter = 1;
  }

  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const id = crypto.randomUUID();
    const album: Album = {
      ...insertAlbum,
      id,
      theme: insertAlbum.theme ?? 'modern',
      createdAt: new Date(),
    };
    this.albums.set(id, album);
    return album;
  }

  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
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

  async getSettings(): Promise<any> {
    return this.settings;
  }

  async updateSettings(data: any): Promise<void> {
    this.settings = { ...this.settings, ...data, id: 1 };
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
