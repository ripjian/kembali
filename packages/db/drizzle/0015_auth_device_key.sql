ALTER TABLE "auth_attempts" ADD COLUMN "device_hash" text;--> statement-breakpoint
CREATE INDEX "auth_attempts_device_idx" ON "auth_attempts" USING btree ("kind","device_hash","created_at");