CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"instagram_url" text NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"instagram_page_url" text,
	"description" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"shopify_context" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"widget_id" integer NOT NULL,
	"video_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop" text NOT NULL,
	"access_token" text NOT NULL,
	"scope" text NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopify_stores_shop_unique" UNIQUE("shop")
);
--> statement-breakpoint
ALTER TABLE "widget_videos" ADD CONSTRAINT "widget_videos_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_videos" ADD CONSTRAINT "widget_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;