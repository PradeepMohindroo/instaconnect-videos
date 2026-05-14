# Shoppable Video App

## Overview

A Shopify-embeddable shoppable video app. Merchants upload Instagram videos through an admin dashboard and embed them as video strips on their Shopify product pages and homepage.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (Tailwind CSS, shadcn/ui, wouter routing)

## Artifacts

- **Admin Dashboard** (`artifacts/admin`) — React + Vite app at `/` (port 5000). Manages videos and widgets.
- **API Server** (`artifacts/api-server`) — Express 5 backend at `/api` (port 8080).

## Key Routes

### Admin Pages
- `/` — Dashboard overview (stats + recent videos)
- `/videos` — Video library (list, add, delete)
- `/videos/new` — Add new Instagram video
- `/widgets` — Widget manager
- `/widgets/new` — Create a widget
- `/widgets/:id` — Edit widget + assign videos
- `/embed-guide` — Shopify embed instructions

### API Endpoints
- `GET /api/stats` — Dashboard summary
- `GET/POST /api/videos` — Video CRUD
- `GET/PUT/DELETE /api/videos/:id`
- `GET/POST /api/widgets` — Widget CRUD
- `GET/PUT/DELETE /api/widgets/:id`
- `PUT /api/widgets/:id/videos` — Assign videos to widget
- `GET /api/embed/:widgetId` — **Public endpoint for Shopify embeds** (CORS open)
- `GET /api/shopify/auth?shop=` — Start Shopify OAuth (redirect)
- `GET /api/shopify/callback` — OAuth callback, stores access token
- `GET /api/shopify/connection` — Connection status
- `GET /api/shopify/themes` — List store themes
- `POST /api/shopify/themes/:themeId/install` — Install Liquid snippet in theme
- `DELETE /api/shopify/disconnect` — Remove stored token

## Database Schema

- `videos` — title, instagram_url, video_url, thumbnail_url, instagram_page_url, description, tags[]
- `widgets` — name, type (product_page|homepage), shopify_context, is_active
- `widget_videos` — join table (widget_id, video_id, position)
- `shopify_stores` — shop, access_token, scope, installed_at, updated_at

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Shopify Embed

Merchants embed widgets by fetching `/api/embed/:widgetId` from their Liquid templates. The endpoint returns CORS-open JSON with video data. Widget types:
- `product_page` — returns up to 4 videos (for under the Buy Now button)
- `homepage` — returns up to 7 videos (for homepage section)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
