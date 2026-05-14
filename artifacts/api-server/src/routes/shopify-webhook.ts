import express, { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, shopifyStoresTable } from "@workspace/db";

const router: IRouter = Router();

function getApiSecret(): string {
  const secret = process.env["SHOPIFY_API_SECRET"];
  if (!secret) throw new Error("SHOPIFY_API_SECRET is not configured");
  return secret;
}

// POST /shopify/webhooks/uninstalled — called by Shopify when merchant removes the app
//
// This router is mounted in app.ts BEFORE express.json() so that express.raw()
// here intercepts the body stream first. body-parser sets req._body = true after
// reading — if express.json() ran first, express.raw() would see that flag and
// skip, leaving req.body as a parsed object instead of the Buffer we need for
// HMAC validation.
router.post(
  "/shopify/webhooks/uninstalled",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const rawBody: Buffer = req.body as Buffer;
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];

    if (!hmacHeader || typeof hmacHeader !== "string") {
      req.log.warn("Webhook received without HMAC header");
      res.status(401).send("Missing HMAC");
      return;
    }

    let secret: string;
    try {
      secret = getApiSecret();
    } catch {
      req.log.error("SHOPIFY_API_SECRET not configured — cannot validate webhook");
      res.status(500).send("Server misconfigured");
      return;
    }

    // Shopify signs the raw body with HMAC-SHA256 and base64-encodes the result
    const expectedHmac = createHmac("sha256", secret).update(rawBody).digest("base64");
    const valid = (() => {
      try {
        return timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(hmacHeader));
      } catch {
        return false;
      }
    })();

    if (!valid) {
      req.log.warn("Webhook HMAC validation failed — ignoring");
      res.status(401).send("HMAC mismatch");
      return;
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as { domain?: string };
    const shop = payload.domain;

    if (!shop) {
      req.log.warn("app/uninstalled webhook missing domain field");
      res.status(400).send("Missing domain");
      return;
    }

    await db.delete(shopifyStoresTable).where(eq(shopifyStoresTable.shop, shop));
    req.log.info({ shop }, "app/uninstalled webhook received — store removed");

    res.sendStatus(200);
  },
);

export default router;
