-- Points & rewards guards (ROADMAP §4 Phase 2, SECURITY.md rule 3).
--
-- point_events is an immutable ledger like stamp_events: UPDATE/DELETE are
-- blocked for everyone (owner included), and the app role never gets those
-- grants. customers.points_balance is a projection maintained ONLY by the
-- trigger below — direct writes to the column are rejected, so the balance
-- always equals Σ point_events.delta by construction.

CREATE TRIGGER point_events_append_only
  BEFORE UPDATE OR DELETE ON "point_events"
  FOR EACH STATEMENT EXECUTE FUNCTION kembali_block_mutation();
--> statement-breakpoint

-- Every ledger insert moves the projection. SECURITY DEFINER: the app role
-- may not touch the column itself (see the guard below) — only this
-- owner-run trigger path may.
CREATE FUNCTION kembali_apply_point_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE customers
    SET points_balance = points_balance + NEW.delta
    WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER point_events_project_balance
  AFTER INSERT ON "point_events"
  FOR EACH ROW EXECUTE FUNCTION kembali_apply_point_event();
--> statement-breakpoint

-- Reject any points_balance change that did not come through the ledger
-- trigger above. pg_trigger_depth() is 1 for a direct UPDATE arriving at
-- this BEFORE trigger; the nested UPDATE issued by
-- kembali_apply_point_event runs at depth 2.
CREATE FUNCTION kembali_guard_points_balance() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.points_balance IS DISTINCT FROM OLD.points_balance
     AND pg_trigger_depth() < 2 THEN
    RAISE EXCEPTION 'points_balance is a read-only projection: insert a point_events row instead'
      USING ERRCODE = 'raise_exception';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER customers_points_balance_guard
  BEFORE UPDATE ON "customers"
  FOR EACH ROW EXECUTE FUNCTION kembali_guard_points_balance();
--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE ON "reward_items", "redemptions" TO "kembali_app";
--> statement-breakpoint
GRANT SELECT, INSERT ON "point_events" TO "kembali_app";
