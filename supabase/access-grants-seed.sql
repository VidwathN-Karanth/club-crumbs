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
insert into public.access_grants (email, role, cohort, granted_by) values
  ('vidwathkaranth@gmail.com', 'admin', null, 'seed'),   -- root admin (also hardcoded)
  ('shreejith@mite.ac.in',     'admin', null, 'seed'),
  ('ravinarayana@mite.ac.in',  'admin', null, 'seed'),
  ('vidhithpai@gmail.com',     'admin', null, 'seed')
on conflict (email, role, cohort) do nothing;

-- ── Coders Club members ────────────────────────────────────────────────────
insert into public.access_grants (email, role, cohort, granted_by) values
  ('4mt24cs130@mite.ac.in', 'member', 'Coders Club', 'seed'),
  ('4mt24cs140@mite.ac.in', 'member', 'Coders Club', 'seed'),
  ('4mt24cs076@mite.ac.in', 'member', 'Coders Club', 'seed'),
  ('4mt24cs077@mite.ac.in', 'member', 'Coders Club', 'seed')
on conflict (email, role, cohort) do nothing;

-- ── Crypton Club members ───────────────────────────────────────────────────
insert into public.access_grants (email, role, cohort, granted_by) values
  ('4mt24cs239@mite.ac.in', 'member', 'Crypton Club', 'seed'),
  ('4mt23cs249@mite.ac.in', 'member', 'Crypton Club', 'seed')
on conflict (email, role, cohort) do nothing;

-- ── DevStudio members ──────────────────────────────────────────────────────
-- (none yet — add through the app)

-- Verify:
--   select role, cohort, count(*) from public.access_grants group by 1, 2 order by 1, 2;
