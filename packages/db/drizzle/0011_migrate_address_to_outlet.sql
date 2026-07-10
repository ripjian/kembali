-- Outlets become the attribution + billing unit (Decision Log 2026-07-11).
-- Copy each tenant's deprecated address into its FIRST outlet (by created_at)
-- where that outlet has no address yet. Non-destructive: tenants.address_*
-- columns are left in place (deprecated), so nothing is lost.

UPDATE outlets o
SET
  address_line = t.address_line,
  city = t.city,
  state = t.state,
  country = coalesce(t.country, 'Malaysia')
FROM tenants t
WHERE o.tenant_id = t.id
  AND o.id = (
    SELECT o2.id FROM outlets o2
    WHERE o2.tenant_id = t.id
    ORDER BY o2.created_at ASC, o2.id ASC
    LIMIT 1
  )
  AND o.address_line IS NULL
  AND (t.address_line IS NOT NULL OR t.city IS NOT NULL OR t.state IS NOT NULL);
