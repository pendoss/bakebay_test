CREATE
EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
    ON products USING GIN (lower (product_name) gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_short_desc_trgm_idx
    ON products USING GIN (lower (short_desc) gin_trgm_ops);
