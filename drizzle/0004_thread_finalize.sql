ALTER TYPE "public"."customization_thread_status"
    ADD VALUE IF NOT EXISTS 'awaiting_seller_finalize' BEFORE 'agreed';
