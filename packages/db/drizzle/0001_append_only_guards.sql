-- Append-only guards + app-role grants (CLAUDE.md / ROADMAP §4-5).
--
-- stamp_events and audit_log are immutable ledgers: block UPDATE/DELETE for
-- everyone (including the table owner) via statement-level triggers, and
-- additionally never grant those privileges to the app role.

CREATE FUNCTION kembali_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'raise_exception';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER stamp_events_append_only
  BEFORE UPDATE OR DELETE ON "stamp_events"
  FOR EACH STATEMENT EXECUTE FUNCTION kembali_block_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION kembali_block_mutation();
--> statement-breakpoint

-- Runtime privileges for the app role. RLS policies further scope every
-- statement to the current tenant; production login users are members of
-- kembali_app (NOLOGIN group role).
GRANT USAGE ON SCHEMA public TO "kembali_app";
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "tenants", "outlets", "staff_users", "customers", "programs", "cards",
  "rewards", "referrals", "wallet_passes", "device_registrations", "messages"
TO "kembali_app";
--> statement-breakpoint
GRANT SELECT, INSERT ON "stamp_events", "audit_log" TO "kembali_app";
