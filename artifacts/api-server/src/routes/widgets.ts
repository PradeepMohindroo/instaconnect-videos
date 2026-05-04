import { Router, type IRouter } from "express";
import { eq, desc, count, asc } from "drizzle-orm";
import { db, widgetsTable, widgetVideosTable, videosTable } from "@workspace/db";
import {
  ListWidgetsResponse,
  CreateWidgetBody,
  GetWidgetParams,
  GetWidgetResponse,
  UpdateWidgetParams,
  UpdateWidgetBody,
  UpdateWidgetResponse,
  DeleteWidgetParams,
  SetWidgetVideosParams,
  SetWidgetVideosBody,
  SetWidgetVideosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/widgets", async (_req, res): Promise<void> => {
  const [widgets, totalResult] = await Promise.all([
    db.select().from(widgetsTable).orderBy(desc(widgetsTable.createdAt)),
    db.select({ value: count() }).from(widgetsTable),
  ]);

  res.json(ListWidgetsResponse.parse({
    widgets,
    total: totalResult[0]?.value ?? 0,
  }));
});

router.post("/widgets", async (req, res): Promise<void> => {
  const parsed = CreateWidgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [widget] = await db.insert(widgetsTable).values({
    name: parsed.data.name,
    type: parsed.data.type,
    shopifyContext: parsed.data.shopifyContext ?? null,
    isActive: parsed.data.isActive ?? true,
  }).returning();

  res.status(201).json(GetWidgetResponse.parse({ ...widget, videos: [] }));
});

router.get("/widgets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetWidgetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [widget] = await db.select().from(widgetsTable).where(eq(widgetsTable.id, params.data.id));
  if (!widget) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  const widgetVideoRows = await db
    .select({ video: videosTable })
    .from(widgetVideosTable)
    .innerJoin(videosTable, eq(widgetVideosTable.videoId, videosTable.id))
    .where(eq(widgetVideosTable.widgetId, widget.id))
    .orderBy(asc(widgetVideosTable.position));

  const videos = widgetVideoRows.map((r) => r.video);

  res.json(GetWidgetResponse.parse({ ...widget, videos }));
});

router.put("/widgets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateWidgetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWidgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.shopifyContext !== undefined) updateData.shopifyContext = parsed.data.shopifyContext;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [widget] = await db.update(widgetsTable).set(updateData).where(eq(widgetsTable.id, params.data.id)).returning();
  if (!widget) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  const widgetVideoRows = await db
    .select({ video: videosTable })
    .from(widgetVideosTable)
    .innerJoin(videosTable, eq(widgetVideosTable.videoId, videosTable.id))
    .where(eq(widgetVideosTable.widgetId, widget.id))
    .orderBy(asc(widgetVideosTable.position));

  const videos = widgetVideoRows.map((r) => r.video);

  res.json(UpdateWidgetResponse.parse({ ...widget, videos }));
});

router.delete("/widgets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteWidgetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [widget] = await db.delete(widgetsTable).where(eq(widgetsTable.id, params.data.id)).returning();
  if (!widget) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  res.sendStatus(204);
});

router.put("/widgets/:id/videos", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SetWidgetVideosParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SetWidgetVideosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [widget] = await db.select().from(widgetsTable).where(eq(widgetsTable.id, params.data.id));
  if (!widget) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  await db.delete(widgetVideosTable).where(eq(widgetVideosTable.widgetId, widget.id));

  if (parsed.data.videoIds.length > 0) {
    await db.insert(widgetVideosTable).values(
      parsed.data.videoIds.map((videoId, position) => ({
        widgetId: widget.id,
        videoId,
        position,
      }))
    );
  }

  const widgetVideoRows = await db
    .select({ video: videosTable })
    .from(widgetVideosTable)
    .innerJoin(videosTable, eq(widgetVideosTable.videoId, videosTable.id))
    .where(eq(widgetVideosTable.widgetId, widget.id))
    .orderBy(asc(widgetVideosTable.position));

  const videos = widgetVideoRows.map((r) => r.video);

  res.json(SetWidgetVideosResponse.parse({ ...widget, videos }));
});

export default router;
