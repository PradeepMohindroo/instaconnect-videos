import { Router, type IRouter } from "express";
import { eq, count, desc } from "drizzle-orm";
import { db, videosTable, widgetsTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [
    totalVideosResult,
    totalWidgetsResult,
    productPageWidgetsResult,
    homepageWidgetsResult,
    activeWidgetsResult,
    recentVideos,
  ] = await Promise.all([
    db.select({ value: count() }).from(videosTable),
    db.select({ value: count() }).from(widgetsTable),
    db.select({ value: count() }).from(widgetsTable).where(eq(widgetsTable.type, "product_page")),
    db.select({ value: count() }).from(widgetsTable).where(eq(widgetsTable.type, "homepage")),
    db.select({ value: count() }).from(widgetsTable).where(eq(widgetsTable.isActive, true)),
    db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(5),
  ]);

  res.json(GetStatsResponse.parse({
    totalVideos: totalVideosResult[0]?.value ?? 0,
    totalWidgets: totalWidgetsResult[0]?.value ?? 0,
    productPageWidgets: productPageWidgetsResult[0]?.value ?? 0,
    homepageWidgets: homepageWidgetsResult[0]?.value ?? 0,
    activeWidgets: activeWidgetsResult[0]?.value ?? 0,
    recentVideos,
  }));
});

export default router;
