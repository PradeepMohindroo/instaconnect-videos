import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, videosTable } from "@workspace/db";
import {
  ListVideosQueryParams,
  ListVideosResponse,
  CreateVideoBody,
  GetVideoParams,
  GetVideoResponse,
  UpdateVideoParams,
  UpdateVideoBody,
  UpdateVideoResponse,
  DeleteVideoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/videos", async (req, res): Promise<void> => {
  const query = ListVideosQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { page, limit } = query.data;
  const offset = (page - 1) * limit;

  const [videos, totalResult] = await Promise.all([
    db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(limit).offset(offset),
    db.select({ value: count() }).from(videosTable),
  ]);

  res.json(ListVideosResponse.parse({
    videos,
    total: totalResult[0]?.value ?? 0,
    page,
    limit,
  }));
});

router.post("/videos", async (req, res): Promise<void> => {
  const parsed = CreateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [video] = await db.insert(videosTable).values({
    title: parsed.data.title,
    instagramUrl: parsed.data.instagramUrl,
    videoUrl: parsed.data.videoUrl ?? null,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    instagramPageUrl: parsed.data.instagramPageUrl ?? null,
    description: parsed.data.description ?? null,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(GetVideoResponse.parse(video));
});

router.get("/videos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetVideoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [video] = await db.select().from(videosTable).where(eq(videosTable.id, params.data.id));
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.json(GetVideoResponse.parse(video));
});

router.put("/videos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateVideoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.instagramUrl !== undefined) updateData.instagramUrl = parsed.data.instagramUrl;
  if (parsed.data.videoUrl !== undefined) updateData.videoUrl = parsed.data.videoUrl;
  if (parsed.data.thumbnailUrl !== undefined) updateData.thumbnailUrl = parsed.data.thumbnailUrl;
  if (parsed.data.instagramPageUrl !== undefined) updateData.instagramPageUrl = parsed.data.instagramPageUrl;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

  const [video] = await db.update(videosTable).set(updateData).where(eq(videosTable.id, params.data.id)).returning();
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.json(UpdateVideoResponse.parse(video));
});

router.delete("/videos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteVideoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [video] = await db.delete(videosTable).where(eq(videosTable.id, params.data.id)).returning();
  if (!video) {
    res.status(404).json({ error: "Video not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
