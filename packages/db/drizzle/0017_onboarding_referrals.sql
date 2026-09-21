ALTER TYPE "public"."point_event_source" ADD VALUE 'referral';--> statement-breakpoint
ALTER TYPE "public"."referral_state" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "grant_source" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "qualified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referrer_reward" jsonb;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "referee_reward" jsonb;--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "referral_settings" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_referral_code_uq" ON "customers" USING btree ("tenant_id","referral_code") WHERE referral_code is not null;--> statement-breakpoint
CREATE INDEX "referrals_referee_idx" ON "referrals" USING btree ("referee_customer_id");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_customer_id","created_at");