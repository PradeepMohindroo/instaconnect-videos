import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, widgetsTable, widgetVideosTable, videosTable } from "@workspace/db";
import { GetEmbedWidgetParams, GetEmbedWidgetResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/embed/:widgetId", async (req, res): Promise<void> => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const raw = Array.isArray(req.params.widgetId) ? req.params.widgetId[0] : req.params.widgetId;
  const params = GetEmbedWidgetParams.safeParse({ widgetId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [widget] = await db.select().from(widgetsTable).where(eq(widgetsTable.id, params.data.widgetId));
  if (!widget || !widget.isActive) {
    res.status(404).json({ error: "Widget not found or inactive" });
    return;
  }

  const widgetVideoRows = await db
    .select({ video: videosTable })
    .from(widgetVideosTable)
    .innerJoin(videosTable, eq(widgetVideosTable.videoId, videosTable.id))
    .where(eq(widgetVideosTable.widgetId, widget.id))
    .orderBy(asc(widgetVideosTable.position));

  const maxVideos = widget.type === "product_page" ? 4 : 7;
  const videos = widgetVideoRows.slice(0, maxVideos).map((r) => ({
    id: r.video.id,
    title: r.video.title,
    videoUrl: r.video.videoUrl,
    thumbnailUrl: r.video.thumbnailUrl,
    instagramUrl: r.video.instagramUrl,
    instagramPageUrl: r.video.instagramPageUrl,
  }));

  res.json(GetEmbedWidgetResponse.parse({
    widgetId: widget.id,
    widgetType: widget.type as "product_page" | "homepage",
    videos,
  }));
});

export default router;
