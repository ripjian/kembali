ALTER TABLE "tenants" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "address_line" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "country" text DEFAULT 'Malaysia' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "role_permissions" jsonb DEFAULT '{}'::jsonb NOT NULL;