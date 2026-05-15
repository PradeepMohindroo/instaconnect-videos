import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

export async function verifyShopifySessionToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // /embed/:widgetId is public — served to storefronts without a session
  if (/^\/embed\/[^/]+/.test(req.path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env["SHOPIFY_API_SECRET"];
  if (!secret) {
    req.log.error("SHOPIFY_API_SECRET not configured — cannot validate session token");
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  try {
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretBytes, {
      algorithms: ["HS256"],
    });

    // Attach the shop domain for use in downstream handlers
    const dest = payload["dest"];
    if (typeof dest === "string") {
      (req as Request & { shopDomain?: string }).shopDomain = dest.replace(/^https?:\/\//, "");
    }

    next();
  } catch (err) {
    req.log.warn({ err }, "Shopify session token validation failed");
    res.status(401).json({ error: "Invalid or expired session token" });
  }
}
