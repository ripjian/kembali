CREATE TYPE "public"."point_event_source" AS ENUM('transaction', 'adjustment', 'redemption');--> statement-breakpoint
CREATE TYPE "public"."redemption_state" AS ENUM('reserved', 'redeemed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "point_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"source" "point_event_source" NOT NULL,
	"reason" text,
	"staff_id" uuid,
	"stamp_event_id" uuid,
	"redemption_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "point_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reward_item_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"state" "redemption_state" DEFAULT 'reserved' NOT NULL,
	"points_cost" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by_staff_id" uuid,
	"outlet_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redemptions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "redemptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reward_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"points_cost" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reward_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "points_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "points_per_rm" double precision DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_staff_id_staff_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_stamp_event_id_stamp_events_id_fk" FOREIGN KEY ("stamp_event_id") REFERENCES "public"."stamp_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_redemption_id_redemptions_id_fk" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_item_id_reward_items_id_fk" FOREIGN KEY ("reward_item_id") REFERENCES "public"."reward_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_redeemed_by_staff_id_staff_users_id_fk" FOREIGN KEY ("redeemed_by_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_items" ADD CONSTRAINT "reward_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "point_events_customer_idx" ON "point_events" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "redemptions_customer_idx" ON "redemptions" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "reward_items_tenant_idx" ON "reward_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE POLICY "point_events_tenant_select" ON "point_events" AS PERMISSIVE FOR SELECT TO "kembali_app" USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "point_events_tenant_insert" ON "point_events" AS PERMISSIVE FOR INSERT TO "kembali_app" WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "redemptions_tenant_isolation" ON "redemptions" AS PERMISSIVE FOR ALL TO "kembali_app" USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "reward_items_tenant_isolation" ON "reward_items" AS PERMISSIVE FOR ALL TO "kembali_app" USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);