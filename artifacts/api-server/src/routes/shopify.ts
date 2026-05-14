import express, { Router, type IRouter } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, shopifyStoresTable } from "@workspace/db";
import {
  GetShopifyConnectionResponse,
  ListShopifyThemesResponse,
  InstallShopifyThemeParams,
  InstallShopifyThemeResponse,
  DisconnectShopifyResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// In-memory nonce store (single-instance custom app)
const nonceStore = new Map<string, string>();

function getApiKey(): string {
  const key = process.env["SHOPIFY_API_KEY"];
  if (!key) throw new Error("SHOPIFY_API_KEY is not configured");
  return key;
}

function getApiSecret(): string {
  const secret = process.env["SHOPIFY_API_SECRET"];
  if (!secret) throw new Error("SHOPIFY_API_SECRET is not configured");
  return secret;
}

function getAppUrl(): string {
  if (process.env["APP_URL"]) return process.env["APP_URL"];
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) return `https://${domains.split(",")[0]}`;
  return `http://localhost:${process.env["PORT"] ?? "8080"}`;
}

function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function validateHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k] ?? ""}`)
    .join("&");
  const expected = createHmac("sha256", secret).update(message).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hmac, "hex"));
  } catch {
    return false;
  }
}

// GET /shopify/auth?shop=mystore.myshopify.com — start OAuth (redirects to Shopify)
router.get("/shopify/auth", (req, res): void => {
  const shop = typeof req.query["shop"] === "string" ? req.query["shop"] : "";
  if (!shop || !isValidShopDomain(shop)) {
    res.status(400).send("Invalid or missing shop parameter");
    return;
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    res.status(500).send("App is not configured with Shopify credentials");
    return;
  }

  const nonce = randomBytes(16).toString("hex");
  nonceStore.set(shop, nonce);

  const appUrl = getAppUrl();
  const redirectUri = encodeURIComponent(`${appUrl}/api/shopify/callback`);
  const scopes = "read_themes,write_themes";
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${nonce}`;

  res.redirect(authUrl);
});

// GET /shopify/callback — OAuth callback from Shopify
router.get("/shopify/callback", async (req, res): Promise<void> => {
  const query = req.query as Record<string, string>;
  const { code, shop, state } = query;

  if (!shop || !isValidShopDomain(shop)) {
    res.status(400).send("Invalid shop");
    return;
  }

  const expectedNonce = nonceStore.get(shop);
  if (!expectedNonce || expectedNonce !== state) {
    res.status(400).send("Invalid state — please restart the OAuth flow");
    return;
  }
  nonceStore.delete(shop);

  let secret: string;
  try {
    secret = getApiSecret();
  } catch {
    res.status(500).send("App is not configured with Shopify credentials");
    return;
  }

  if (!validateHmac(query, secret)) {
    res.status(400).send("HMAC validation failed");
    return;
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: getApiKey(), client_secret: secret, code }),
  });

  if (!tokenRes.ok) {
    req.log.error({ status: tokenRes.status, shop }, "Failed to exchange code for access token");
    res.status(500).send("Failed to obtain access token from Shopify");
    return;
  }

  const tokenData = (await tokenRes.json()) as { access_token: string; scope: string };

  await db
    .insert(shopifyStoresTable)
    .values({ shop, accessToken: tokenData.access_token, scope: tokenData.scope })
    .onConflictDoUpdate({
      target: shopifyStoresTable.shop,
      set: {
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        updatedAt: new Date(),
      },
    });

  // Register app/uninstalled webhook so we can clean up when the merchant removes the app
  const appUrl = getAppUrl();
  const webhookRes = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": tokenData.access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook: {
        topic: "app/uninstalled",
        address: `${appUrl}/api/shopify/webhooks/uninstalled`,
        format: "json",
      },
    }),
  });

  if (!webhookRes.ok) {
    // Non-fatal — log but don't block the OAuth completion
    req.log.warn({ status: webhookRes.status, shop }, "Failed to register app/uninstalled webhook");
  } else {
    req.log.info({ shop }, "Registered app/uninstalled webhook");
  }

  req.log.info({ shop }, "Shopify store connected successfully");
  res.redirect(`${appUrl}/shopify?connected=true`);
});

// GET /shopify/connection
router.get("/shopify/connection", async (req, res): Promise<void> => {
  const stores = await db.select().from(shopifyStoresTable).limit(1);
  const store = stores[0];

  res.json(
    GetShopifyConnectionResponse.parse({
      connected: !!store,
      shop: store?.shop ?? null,
      installedAt: store?.installedAt?.toISOString() ?? null,
    }),
  );
});

// GET /shopify/themes
router.get("/shopify/themes", async (req, res): Promise<void> => {
  const stores = await db.select().from(shopifyStoresTable).limit(1);
  const store = stores[0];
  if (!store) {
    res.status(400).json({ error: "No Shopify store connected" });
    return;
  }

  const themesRes = await fetch(
    `https://${store.shop}/admin/api/2024-01/themes.json`,
    { headers: { "X-Shopify-Access-Token": store.accessToken } },
  );

  if (!themesRes.ok) {
    req.log.error({ status: themesRes.status, shop: store.shop }, "Failed to fetch themes");
    res.status(502).json({ error: "Failed to fetch themes from Shopify" });
    return;
  }

  const data = (await themesRes.json()) as {
    themes: Array<{ id: number; name: string; role: string; previewable: boolean }>;
  };

  res.json(ListShopifyThemesResponse.parse({ themes: data.themes }));
});

// POST /shopify/themes/:themeId/install
router.post("/shopify/themes/:themeId/install", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params["themeId"]) ? req.params["themeId"][0] : req.params["themeId"];
  const params = InstallShopifyThemeParams.safeParse({ themeId: parseInt(raw ?? "", 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid themeId" });
    return;
  }

  const stores = await db.select().from(shopifyStoresTable).limit(1);
  const store = stores[0];
  if (!store) {
    res.status(400).json({ error: "No Shopify store connected" });
    return;
  }

  const snippetContent = buildLiquidSnippet(getAppUrl());

  const assetRes = await fetch(
    `https://${store.shop}/admin/api/2024-01/themes/${params.data.themeId}/assets.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": store.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asset: {
          key: "snippets/shoppable-videos.liquid",
          value: snippetContent,
        },
      }),
    },
  );

  if (!assetRes.ok) {
    req.log.error({ status: assetRes.status, shop: store.shop, themeId: params.data.themeId }, "Failed to upload snippet");
    res.status(502).json({ error: "Failed to install snippet in theme" });
    return;
  }

  req.log.info({ shop: store.shop, themeId: params.data.themeId }, "Shoppable video snippet installed");
  res.json(
    InstallShopifyThemeResponse.parse({
      success: true,
      message: "Snippet installed successfully",
      snippetKey: "snippets/shoppable-videos.liquid",
    }),
  );
});

// POST /shopify/webhooks/uninstalled — called by Shopify when merchant removes the app
// Uses express.raw() at route level so we can validate the HMAC over the raw body bytes
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

// DELETE /shopify/disconnect
router.delete("/shopify/disconnect", async (req, res): Promise<void> => {
  await db.delete(shopifyStoresTable);
  req.log.info("Shopify store disconnected");
  res.json(DisconnectShopifyResponse.parse({ success: true }));
});

function buildLiquidSnippet(appUrl: string): string {
  return `{% comment %}
  Shoppable Videos Widget by Shoppable
  Usage: {% render 'shoppable-videos', widget_id: YOUR_WIDGET_ID %}
  Example (product page): {% render 'shoppable-videos', widget_id: 1 %}
  Example (homepage):     {% render 'shoppable-videos', widget_id: 2 %}
{% endcomment %}
<div id="shv-{{ widget_id }}" class="shv-widget"></div>
<script>
(function() {
  var id = '{{ widget_id }}';
  var el = document.getElementById('shv-' + id);
  if (!el) return;
  fetch('${appUrl}/api/embed/' + id)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.videos || !d.videos.length) return;
      var html = '<div class="shv-row">';
      d.videos.forEach(function(v) {
        var href = v.instagramPageUrl || v.instagramUrl || '#';
        html += '<a href="' + href + '" target="_blank" rel="noopener" class="shv-item">';
        if (v.thumbnailUrl) {
          html += '<img src="' + v.thumbnailUrl + '" alt="' + (v.title || '') + '" loading="lazy">';
        }
        html += '</a>';
      });
      html += '</div>';
      el.innerHTML = html;
    })
    .catch(function(e) { console.warn('[Shoppable Videos]', e); });
})();
</script>
<style>
.shv-widget{width:100%;overflow:hidden}
.shv-row{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.shv-item{display:block;flex-shrink:0;width:110px;height:195px;border-radius:8px;overflow:hidden;text-decoration:none}
.shv-item img{width:100%;height:100%;object-fit:cover;display:block}
</style>`;
}

export default router;
