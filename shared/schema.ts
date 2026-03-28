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
  credits: integer("credits").notNull().default(1), // Starts with 1 free album
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  password: text("password"),
  isVerified: integer("is_verified").notNull().default(0), // 0: No, 1: Yes
  verificationCode: text("verification_code"),
  role: varchar("role", { length: 20 }).notNull().default('user'), // 'user', 'admin'
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const albums = pgTable("albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  theme: varchar("theme", { length: 20 }).notNull().default('royal'),
  password: text("password"), // Optional password for protected albums
  views: integer("views").notNull().default(0), // View tracker for analytics
  expiresAt: timestamp("expires_at"), // For 7-day trials or 1-year credits
  isPublicDemo: text("is_public_demo").notNull().default('false'), // 'true' or 'false'
  demoCategory: text("demo_category"), // 'Wedding', 'Pre-Wedding', 'Birthday', etc.
  category: text("category").notNull().default('Uncategorized'), // User-defined folders
  bgMusicUrl: text("bg_music_url"),
  showInPortfolio: integer("show_in_portfolio").notNull().default(0), // 0: Hide, 1: Show in Studio Gallery
  totalEngagementTime: integer("total_engagement_time").notNull().default(0), // Total seconds spent by viewers
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  albumId: varchar("album_id").notNull().references(() => albums.id, { onDelete: 'cascade' }),
  filePath: text("file_path").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(), // 'sheet', 'video', 'cover_front', 'cover_back', 'audio'
  orderIndex: integer("order_index").notNull().default(0),
  favoritesCount: integer("favorites_count").notNull().default(0),
  views: integer("views").notNull().default(0), // Slide-specific analytics
});

export const settings = pgTable("settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
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
