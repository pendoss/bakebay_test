CREATE TYPE "public"."order_status" AS ENUM('ordering', 'processing', 'payed', 'processed', 'in_progress', 'delivering', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('ok', 'low', 'out');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'admin', 'seller');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dietary_constrains" (
	"id" integer GENERATED BY DEFAULT AS IDENTITY (sequence name "dietary_constrains_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"product_id" integer
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_item_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_order_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer,
	"product_id" integer,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_order_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" timestamp NOT NULL,
	"order_status" "order_status" DEFAULT 'ordering',
	"user_id" integer,
	"total_price" integer,
	"address" text NOT NULL,
	"payment_method" text NOT NULL,
	"created_at" integer,
	"updated_at" integer
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"image_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_images_image_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer,
	"url" varchar NOT NULL,
	"name" varchar,
	"is_main" boolean DEFAULT false,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "product_ingredients" (
	"ingredient_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_ingredients_ingredient_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer,
	"name" varchar NOT NULL,
	"stock" real DEFAULT 0,
	"unit" varchar NOT NULL,
	"alert" integer DEFAULT 0,
	"status" "stock_status" DEFAULT 'out'
);
--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_product_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"seller_id" integer,
	"product_name" varchar NOT NULL,
	"price" real NOT NULL,
	"cost" real,
	"short_desc" text NOT NULL,
	"long_desc" text NOT NULL,
	"category" varchar NOT NULL,
	"storage_conditions" varchar NOT NULL,
	"stock" integer,
	"category_id" integer,
	"sku" varchar,
	"weight" integer,
	"size" varchar,
	"shelf_life" integer,
	"track_inventory" boolean DEFAULT true,
	"low_stock_alert" boolean DEFAULT false,
	"status" varchar DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"seller_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sellers_seller_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"seller_name" varchar NOT NULL,
	"seller_rating" real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"phone_number" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(255),
	"postal_code" varchar(255),
	"country" varchar(255),
	"user_role" "role" DEFAULT 'customer',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "dietary_constrains" ADD CONSTRAINT "dietary_constrains_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_sellers_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("seller_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;