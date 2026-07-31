ALTER TABLE "sessions" ADD COLUMN "last_used_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "rotated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "previous_token_hash" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "previous_valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "token_confirmed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "sessions_previous_token_idx" ON "sessions" USING btree ("previous_token_hash");