ALTER TABLE "product_images" RENAME COLUMN "url" TO "image_url";--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "s3_key" varchar;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD COLUMN "amount" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "location" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "contact_name" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "contact_email" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "contact_number" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "inn" varchar;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "about_products" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;