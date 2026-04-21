CREATE TYPE "public"."refund_state" AS ENUM ('none', 'requested', 'approved', 'rejected');
--> statement-breakpoint
ALTER TABLE "seller_orders"
    ADD COLUMN "refund_state" "refund_state" NOT NULL DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE "seller_orders"
    ADD COLUMN "refund_reason" text;
