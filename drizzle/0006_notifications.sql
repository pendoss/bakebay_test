CREATE TYPE "public"."notification_kind" AS ENUM (
    'chat_message',
    'chat_offer',
    'chat_finalized',
    'customer_accept',
    'seller_order_paid_reminder',
    'ingredient_low',
    'ingredient_out',
    'refund_requested',
    'refund_approved'
);
--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM ('info', 'success', 'warning', 'error');
--> statement-breakpoint
CREATE TABLE "notifications" (
    "notification_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "recipient_user_id" integer NOT NULL REFERENCES "users"("user_id"),
    "kind" "notification_kind" NOT NULL,
    "severity" "notification_severity" NOT NULL DEFAULT 'info',
    "title_md" text NOT NULL,
    "body_md" text NOT NULL DEFAULT '',
    "actions" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "delivered_at" timestamp,
    "read_at" timestamp,
    "email_sent_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" ("recipient_user_id", "notification_id" DESC);
--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" ("recipient_user_id") WHERE "read_at" IS NULL;
