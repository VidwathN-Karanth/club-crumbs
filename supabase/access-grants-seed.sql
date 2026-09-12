-- ============================================================================
--  ACCESS GRANTS — one-time seed
-- ============================================================================
--
--  Mirrors the two hardcoded lists as they stood when the roster moved into the
--  database, so NOBODY currently signed in loses access the moment the app
--  starts trusting public.access_grants.
--
--    admins  ← src/lib/admin.ts   (ADMIN_EMAILS)
--    members ← src/lib/roster.ts  (COHORT_ROSTER)
--
--  Run this ONCE in the Supabase SQL editor AFTER creating the table (it is in
--  supabase/schema.sql, section 14). Safe to re-run: every insert is guarded by
--  `on conflict do nothing`, so a second run adds nothing and removes nothing.
--
--  After this seed, all further changes happen through the app — the admin
--  console's Access Management screen and the leaders' Members screen. Do not
--  keep editing code lists; they are gone.
-- ============================================================================

-- ── Admins (cohort is NULL for staff) ──────────────────────────────────────
-- No admin is hardcoded anywhere; these are the initial two, managed from the
-- console thereafter. The last remaining admin cannot be removed, so the app
-- can never be locked out.
insert into public.access_grants (email, role, cohort, granted_by) values
  ('vidwathkaranth@gmail.com', 'admin', null, 'seed'),
  ('shreejith@mite.ac.in',     'admin', null, 'seed')
on conflict (email, role, cohort) do nothing;

-- ── Leaders and members ────────────────────────────────────────────────────
-- Intentionally empty. Add all leaders and members from the app — the admin's
-- Access Management screen, or a leader's Members screen. Both accept a bulk
-- paste of addresses (commas, spaces or new lines).

-- Verify:
--   select role, cohort, count(*) from public.access_grants group by 1, 2 order by 1, 2;
