import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const albums = pgTable("albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  date: text("date").notNull(),
  theme: varchar("theme", { length: 20 }).notNull().default('royal'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  albumId: varchar("album_id").notNull().references(() => albums.id, { onDelete: 'cascade' }),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // 'cover_front', 'cover_back', 'sheet'
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
});

export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
