CREATE TYPE "public"."customer_order_derived_status" AS ENUM('negotiating', 'awaiting_payment', 'partially_paid', 'in_fulfillment', 'partially_delivered', 'delivered', 'cancelled', 'partially_cancelled');--> statement-breakpoint
CREATE TYPE "public"."customization_message_author" AS ENUM('customer', 'seller');--> statement-breakpoint
CREATE TYPE "public"."customization_thread_status" AS ENUM('open', 'agreed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."product_option_group_kind" AS ENUM('size', 'color', 'flavor', 'custom');--> statement-breakpoint
CREATE TYPE "public"."reservation_state" AS ENUM('reserved', 'consumed', 'released');--> statement-breakpoint
CREATE TYPE "public"."seller_order_status" AS ENUM('draft', 'pending_seller_review', 'negotiating', 'awaiting_customer_approval', 'confirmed', 'paid', 'preparing_blocked', 'preparing', 'ready_to_ship', 'delivering', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."seller_order_stock_check" AS ENUM('ok', 'low', 'missing', 'unknown');--> statement-breakpoint
CREATE TABLE "customer_orders"
(
    "customer_order_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customer_orders_customer_order_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "user_id"           integer                                               NOT NULL,
    "derived_status"    "customer_order_derived_status" DEFAULT 'negotiating' NOT NULL,
    "address"           text                                                  NOT NULL,
    "payment_method"    text                            DEFAULT 'card'        NOT NULL,
    "total_estimated"   integer,
    "created_at"        timestamp                       DEFAULT now()         NOT NULL,
    "updated_at"        timestamp                       DEFAULT now()         NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customization_final_specs"
(
    "customization_final_spec_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customization_final_specs_customization_final_spec_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "thread_id"                   integer                 NOT NULL,
    "offer_id"                    integer                 NOT NULL,
    "spec_snapshot"               jsonb                   NOT NULL,
    "price_delta"                 real      DEFAULT 0     NOT NULL,
    "agreed_at"                   timestamp DEFAULT now() NOT NULL,
    "label"                       varchar(255)
);
--> statement-breakpoint
CREATE TABLE "customization_messages"
(
    "customization_message_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customization_messages_customization_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "thread_id"                integer                        NOT NULL,
    "author"                   "customization_message_author" NOT NULL,
    "body"                     text      DEFAULT ''           NOT NULL,
    "attachment_urls"          jsonb     DEFAULT '[]'::jsonb NOT NULL,
    "created_at"               timestamp DEFAULT now()        NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customization_offers"
(
    "customization_offer_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customization_offers_customization_offer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "thread_id"              integer                 NOT NULL,
    "version"                integer                 NOT NULL,
    "price_delta"            real      DEFAULT 0     NOT NULL,
    "spec_snapshot"          jsonb                   NOT NULL,
    "superseded_by_offer_id" integer,
    "created_at"             timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customization_threads"
(
    "customization_thread_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "customization_threads_customization_thread_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "status"                  "customization_thread_status" DEFAULT 'open' NOT NULL,
    "agreed_offer_id"         integer,
    "created_at"              timestamp                     DEFAULT now()  NOT NULL,
    "updated_at"              timestamp                     DEFAULT now()  NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option_groups"
(
    "product_option_group_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_option_groups_product_option_group_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "product_id"              integer                                      NOT NULL,
    "name"                    varchar(255)                                 NOT NULL,
    "kind"                    "product_option_group_kind" DEFAULT 'custom' NOT NULL,
    "is_required"             integer                     DEFAULT 0        NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_option_values"
(
    "product_option_value_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_option_values_product_option_value_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "group_id"                integer        NOT NULL,
    "label"                   varchar(255)   NOT NULL,
    "price_delta"             real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_order_item_option_selections"
(
    "selection_id"         integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_order_item_option_selections_selection_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "seller_order_item_id" integer NOT NULL,
    "option_value_id"      integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews"
(
    "review_id"    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reviews_review_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "product_id"   integer   NOT NULL,
    "user_id"      integer   NOT NULL,
    "seller_id"    integer   NOT NULL,
    "rating"       integer   NOT NULL,
    "comment"      text      NOT NULL,
    "seller_reply" text,
    "reply_date"   timestamp,
    "created_at"   timestamp NOT NULL,
    "updated_at"   timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_ingredient_library"
(
    "seller_ingredient_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_ingredient_library_seller_ingredient_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "seller_id"            integer        NOT NULL,
    "name"                 varchar(255)   NOT NULL,
    "unit"                 varchar(32)    NOT NULL,
    "default_amount"       real DEFAULT 0 NOT NULL,
    "price_delta"          real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_order_ingredient_reservations"
(
    "reservation_id"  integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_order_ingredient_reservations_reservation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "seller_order_id" integer                                NOT NULL,
    "ingredient_ref"  jsonb                                  NOT NULL,
    "name"            varchar(255)                           NOT NULL,
    "unit"            varchar(32)                            NOT NULL,
    "amount"          real                                   NOT NULL,
    "state"           "reservation_state" DEFAULT 'reserved' NOT NULL,
    "created_at"      timestamp           DEFAULT now()      NOT NULL,
    "updated_at"      timestamp           DEFAULT now()      NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_order_items"
(
    "seller_order_item_id"    integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_order_items_seller_order_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "seller_order_id"         integer        NOT NULL,
    "product_id"              integer        NOT NULL,
    "quantity"                integer        NOT NULL,
    "unit_price"              real           NOT NULL,
    "customization_delta"     real DEFAULT 0 NOT NULL,
    "customization_thread_id" integer
);
--> statement-breakpoint
CREATE TABLE "seller_orders"
(
    "seller_order_id"          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_orders_seller_order_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
    "customer_order_id"        integer                                                    NOT NULL,
    "seller_id"                integer                                                    NOT NULL,
    "status"                   "seller_order_status"      DEFAULT 'pending_seller_review' NOT NULL,
    "subtotal"                 integer                    DEFAULT 0                       NOT NULL,
    "customization_delta"      integer                    DEFAULT 0                       NOT NULL,
    "shipping"                 integer                    DEFAULT 0                       NOT NULL,
    "commission_rate_snapshot" real                       DEFAULT 0.1                     NOT NULL,
    "commission_amount"        integer                    DEFAULT 0                       NOT NULL,
    "total"                    integer                    DEFAULT 0                       NOT NULL,
    "stock_check"              "seller_order_stock_check" DEFAULT 'unknown'               NOT NULL,
    "cancel_reason"            text,
    "paid_at"                  timestamp,
    "created_at"               timestamp                  DEFAULT now()                   NOT NULL,
    "updated_at"               timestamp                  DEFAULT now()                   NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sellers"
    ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "sellers"
    ALTER COLUMN "location" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "sellers"
    ALTER COLUMN "contact_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "sellers"
    ALTER COLUMN "contact_email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "sellers"
    ALTER COLUMN "contact_number" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "product_ingredients"
    ADD COLUMN "purchase_qty" real DEFAULT 1;--> statement-breakpoint
ALTER TABLE "product_ingredients"
    ADD COLUMN "purchase_price" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_ingredients"
    ADD COLUMN "is_optional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products"
    ADD COLUMN "is_customizable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers"
    ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "sellers"
    ADD COLUMN "commission_rate" real DEFAULT 0.1 NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_orders"
    ADD CONSTRAINT "customer_orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customization_final_specs"
    ADD CONSTRAINT "customization_final_specs_thread_id_customization_threads_customization_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customization_threads" ("customization_thread_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customization_final_specs"
    ADD CONSTRAINT "customization_final_specs_offer_id_customization_offers_customization_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."customization_offers" ("customization_offer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customization_messages"
    ADD CONSTRAINT "customization_messages_thread_id_customization_threads_customization_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customization_threads" ("customization_thread_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customization_offers"
    ADD CONSTRAINT "customization_offers_thread_id_customization_threads_customization_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."customization_threads" ("customization_thread_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_groups"
    ADD CONSTRAINT "product_option_groups_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values"
    ADD CONSTRAINT "product_option_values_group_id_product_option_groups_product_option_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_option_groups" ("product_option_group_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_item_option_selections"
    ADD CONSTRAINT "seller_order_item_option_selections_seller_order_item_id_seller_order_items_seller_order_item_id_fk" FOREIGN KEY ("seller_order_item_id") REFERENCES "public"."seller_order_items" ("seller_order_item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_item_option_selections"
    ADD CONSTRAINT "seller_order_item_option_selections_option_value_id_product_option_values_product_option_value_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values" ("product_option_value_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_seller_id_sellers_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers" ("seller_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_ingredient_library"
    ADD CONSTRAINT "seller_ingredient_library_seller_id_sellers_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers" ("seller_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_ingredient_reservations"
    ADD CONSTRAINT "seller_order_ingredient_reservations_seller_order_id_seller_orders_seller_order_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_orders" ("seller_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_items"
    ADD CONSTRAINT "seller_order_items_seller_order_id_seller_orders_seller_order_id_fk" FOREIGN KEY ("seller_order_id") REFERENCES "public"."seller_orders" ("seller_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_items"
    ADD CONSTRAINT "seller_order_items_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products" ("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_order_items"
    ADD CONSTRAINT "seller_order_items_customization_thread_id_customization_threads_customization_thread_id_fk" FOREIGN KEY ("customization_thread_id") REFERENCES "public"."customization_threads" ("customization_thread_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders"
    ADD CONSTRAINT "seller_orders_customer_order_id_customer_orders_customer_order_id_fk" FOREIGN KEY ("customer_order_id") REFERENCES "public"."customer_orders" ("customer_order_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_orders"
    ADD CONSTRAINT "seller_orders_seller_id_sellers_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers" ("seller_id") ON DELETE no action ON UPDATE no action;