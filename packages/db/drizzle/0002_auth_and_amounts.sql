CREATE TYPE "public"."session_kind" AS ENUM('customer', 'staff', 'platform');--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "platform_admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"kind" "session_kind" NOT NULL,
	"subject_id" uuid NOT NULL,
	"tenant_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "stamp_events" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "modules" jsonb DEFAULT '{"stamps":true,"scan":true,"reports":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE POLICY "staff_users_platform_all" ON "staff_users" AS PERMISSIVE FOR ALL TO "kembali_app" USING (current_setting('app.platform_admin', true) = 'true') WITH CHECK (current_setting('app.platform_admin', true) = 'true');--> statement-breakpoint
CREATE POLICY "tenants_platform_all" ON "tenants" AS PERMISSIVE FOR ALL TO "kembali_app" USING (current_setting('app.platform_admin', true) = 'true') WITH CHECK (current_setting('app.platform_admin', true) = 'true');--> statement-breakpoint
CREATE POLICY "otp_codes_tenant_isolation" ON "otp_codes" AS PERMISSIVE FOR ALL TO "kembali_app" USING (tenant_id = current_setting('app.tenant_id', true)::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "platform_admins_app_access" ON "platform_admins" AS PERMISSIVE FOR ALL TO "kembali_app" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "sessions_app_access" ON "sessions" AS PERMISSIVE FOR ALL TO "kembali_app" USING (true) WITH CHECK (true);