import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopifyStoresTable = pgTable("shopify_stores", {
  id: serial("id").primaryKey(),
  shop: text("shop").notNull().unique(),
  accessToken: text("access_token").notNull(),
  scope: text("scope").notNull(),
  installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShopifyStoreSchema = createInsertSchema(shopifyStoresTable).omit({ id: true, installedAt: true, updatedAt: true });
export type InsertShopifyStore = z.infer<typeof insertShopifyStoreSchema>;
export type ShopifyStore = typeof shopifyStoresTable.$inferSelect;
