import { db } from "./db";
import { albums, files, type InsertAlbum, type Album, type InsertFile, type File } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Album operations
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbums(): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | undefined>;
  deleteAlbum(id: string): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByAlbum(albumId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteFilesByAlbum(albumId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Albums
  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const [album] = await db.insert(albums).values(insertAlbum).returning();
    return album;
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums).orderBy(albums.createdAt);
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async deleteAlbum(id: string): Promise<void> {
    await db.delete(albums).where(eq(albums.id, id));
  }

  // Files
  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db.insert(files).values(insertFile).returning();
    return file;
  }

  async getFilesByAlbum(albumId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.albumId, albumId)).orderBy(files.orderIndex);
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async deleteFilesByAlbum(albumId: string): Promise<void> {
    await db.delete(files).where(eq(files.albumId, albumId));
  }
}

export const storage = new DatabaseStorage();
