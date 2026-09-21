ALTER TABLE "outlets" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
CREATE POLICY "audit_log_platform_select" ON "audit_log" AS PERMISSIVE FOR SELECT TO "kembali_app" USING (current_setting('app.platform_admin', true) = 'true');