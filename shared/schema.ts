import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  plan: varchar("plan", { length: 20 }).notNull().default('free'), // 'free', 'pro'
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const albums = pgTable("albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  theme: varchar("theme", { length: 20 }).notNull().default('royal'),
  password: text("password"), // Optional password for protected albums
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  albumId: varchar("album_id").notNull().references(() => albums.id, { onDelete: 'cascade' }),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // 'cover_front', 'cover_back', 'sheet'
  orderIndex: integer("order_index").notNull().default(0),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull().default("EventFold Studio"),
  businessLogo: text("business_logo"),
  contactWhatsApp: text("contact_whatsapp"),
  adminPassword: text("admin_password").notNull().default("admin123"),
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
