import { pgTable, integer, serial } from "drizzle-orm/pg-core";
import { videosTable } from "./videos";
import { widgetsTable } from "./widgets";

export const widgetVideosTable = pgTable("widget_videos", {
  id: serial("id").primaryKey(),
  widgetId: integer("widget_id").notNull().references(() => widgetsTable.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
});

export type WidgetVideo = typeof widgetVideosTable.$inferSelect;
