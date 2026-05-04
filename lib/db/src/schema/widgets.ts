import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const widgetsTable = pgTable("widgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'product_page' | 'homepage'
  shopifyContext: text("shopify_context"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWidgetSchema = createInsertSchema(widgetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = typeof widgetsTable.$inferSelect;
