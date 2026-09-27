-- One-off: give existing students a link snapshot and strip pre-link solves
-- out of the points already recorded. Run once, after the columns in
-- schema.sql exist. Safe to re-run: it only fills snapshots that are missing,
-- and the recompute is a pure function of the snapshots.

begin;

-- 1. A student linked before snapshots existed: their first synced day is the
--    snapshot. That day's accumulated counts are what they had when they joined.
with first_row as (
  select distinct on (user_id) user_id, date,
    leetcode_easy_accumulated, leetcode_medium_accumulated, leetcode_hard_accumulated,
    codechef_solved_accumulated
  from public.daily_activities
  order by user_id, date
)
update public.users u set
  leetcode_baseline_easy   = case when u.leetcode_username is not null and u.leetcode_linked_on is null then f.leetcode_easy_accumulated   else u.leetcode_baseline_easy end,
  leetcode_baseline_medium = case when u.leetcode_username is not null and u.leetcode_linked_on is null then f.leetcode_medium_accumulated else u.leetcode_baseline_medium end,
  leetcode_baseline_hard   = case when u.leetcode_username is not null and u.leetcode_linked_on is null then f.leetcode_hard_accumulated   else u.leetcode_baseline_hard end,
  leetcode_linked_on       = case when u.leetcode_username is not null and u.leetcode_linked_on is null then f.date                        else u.leetcode_linked_on end,
  codechef_baseline        = case when u.codechef_username is not null and u.codechef_linked_on is null then f.codechef_solved_accumulated else u.codechef_baseline end,
  codechef_linked_on       = case when u.codechef_username is not null and u.codechef_linked_on is null then f.date                        else u.codechef_linked_on end
from first_row f
where f.user_id = u.id;

-- 2. Linked but never synced: snapshot what the profile holds now.
update public.users set
  leetcode_baseline_easy = leetcode_easy_total,
  leetcode_baseline_medium = leetcode_medium_total,
  leetcode_baseline_hard = leetcode_hard_total,
  leetcode_linked_on = current_date
where leetcode_username is not null and leetcode_linked_on is null;

update public.users set
  codechef_baseline = codechef_solved_total,
  codechef_linked_on = current_date
where codechef_username is not null and codechef_linked_on is null;

-- 3. Re-score every ledger row the way syncLogic.ts now does. Weights mirror
--    src/lib/points.ts (LeetCode 10/20/30, CodeChef 5, GitHub 0) — change both
--    together.
with ordered as (
  select a.id, a.date, u.leetcode_linked_on lc_on, u.codechef_linked_on cc_on,
    u.leetcode_baseline_easy lb_e, u.leetcode_baseline_medium lb_m, u.leetcode_baseline_hard lb_h,
    u.codechef_baseline cb,
    a.leetcode_easy_accumulated e, a.leetcode_medium_accumulated m, a.leetcode_hard_accumulated h,
    a.codechef_solved_accumulated c,
    lag(a.date) over w pd,
    lag(a.leetcode_easy_accumulated) over w pe, lag(a.leetcode_medium_accumulated) over w pm,
    lag(a.leetcode_hard_accumulated) over w ph, lag(a.codechef_solved_accumulated) over w pc
  from public.daily_activities a
  join public.users u on u.id = a.user_id
  window w as (partition by a.user_id order by a.date)
), diffs as (
  select id,
    case when lc_on is null or date < lc_on then 0 else greatest(0, e - case when pd >= lc_on then pe else coalesce(lb_e, 0) end) end de,
    case when lc_on is null or date < lc_on then 0 else greatest(0, m - case when pd >= lc_on then pm else coalesce(lb_m, 0) end) end dm,
    case when lc_on is null or date < lc_on then 0 else greatest(0, h - case when pd >= lc_on then ph else coalesce(lb_h, 0) end) end dh,
    case when cc_on is null or date < cc_on then 0 else greatest(0, c - case when pd >= cc_on then pc else coalesce(cb, 0) end) end dc
  from ordered
)
update public.daily_activities a set
  leetcode_solved_today = d.de + d.dm + d.dh,
  codechef_solved_today = d.dc,
  points_earned = d.de * 10 + d.dm * 20 + d.dh * 30 + d.dc * 5
from diffs d
where d.id = a.id;

commit;
