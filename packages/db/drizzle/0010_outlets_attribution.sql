ALTER TABLE "outlets" ADD COLUMN "address_line" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "postcode" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "outlets" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "point_events" ADD COLUMN "outlet_id" uuid;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_outlet_id_outlets_id_fk" FOREIGN KEY ("outlet_id") REFERENCES "public"."outlets"("id") ON DELETE no action ON UPDATE no action;