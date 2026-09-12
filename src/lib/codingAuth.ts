import 'server-only';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';
import { requireClubManager, requireStudent, type Requester } from './authz';
import { isCohort, type Cohort } from './cohorts';

/**
 * Authoring guards for the Coding feature.
 *
 * A contest belongs to a club, and only an admin or a leader of THAT club may
 * author it. Rather than trust a cohort from the request, these resolve the
 * club from the row itself and then defer to requireClubManager — so a leader
 * of one club can never edit another club's contest by guessing an id.
 */

type Ok<T> = { ok: true; requester: Requester & { cohort: Cohort }; data: T };
type Err = { ok: false; response: NextResponse };

function notFound(what: string): Err {
  return { ok: false, response: NextResponse.json({ error: `${what} not found.` }, { status: 404 }) };
}

export interface ContestRow {
  id: string;
  cohort: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  duration_mins: number;
  status: string;
  created_by: string | null;
  created_at: string;
}

/** Guards a contest by id; returns the row and the manager on success. */
export async function guardContest(contestId: string): Promise<Ok<ContestRow> | Err> {
  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .select('*')
    .eq('id', contestId)
    .maybeSingle();
  if (error || !data) return notFound('Contest');

  const cohort = (data as ContestRow).cohort;
  if (!isCohort(cohort)) return notFound('Contest');

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return { ok: false, response: guard.response };
  return { ok: true, requester: guard.requester, data: data as ContestRow };
}

export interface ProblemRow {
  id: string;
  contest_id: string;
  position: number;
  title: string;
  statement_md: string;
  image_urls: string[];
  languages: string[];
  time_limit_ms: number;
  memory_limit_kb: number;
  points: number;
}

/** Guards a problem by id via its parent contest's club. */
export async function guardProblem(
  problemId: string
): Promise<(Ok<ProblemRow> & { contest: ContestRow }) | Err> {
  const { data, error } = await supabaseAdmin
    .from('coding_problems')
    .select('*')
    .eq('id', problemId)
    .maybeSingle();
  if (error || !data) return notFound('Problem');

  const contestGuard = await guardContest((data as ProblemRow).contest_id);
  if (!contestGuard.ok) return contestGuard;

  return {
    ok: true,
    requester: contestGuard.requester,
    data: data as ProblemRow,
    contest: contestGuard.data,
  };
}

/* ── Member (solver) guards ────────────────────────────────────────────────
   A member may only see a PUBLISHED contest in their OWN club. The club comes
   from the session, so a member cannot reach another club's contest by id. */

type MemberOk<T> = { ok: true; requester: Requester & { cohort: Cohort }; data: T };

/** Guards a published contest for a member of its club. */
export async function guardMemberContest(contestId: string): Promise<MemberOk<ContestRow> | Err> {
  const guard = await requireStudent();
  if (!guard.ok) return { ok: false, response: guard.response };

  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .select('*')
    .eq('id', contestId)
    .eq('status', 'published')
    .maybeSingle();
  if (error || !data) return notFound('Contest');

  const contest = data as ContestRow;
  if (contest.cohort !== guard.requester.cohort) return notFound('Contest');
  return { ok: true, requester: guard.requester, data: contest };
}

/** Guards a problem for a member, via its published parent contest. */
export async function guardMemberProblem(
  problemId: string
): Promise<(MemberOk<ProblemRow> & { contest: ContestRow }) | Err> {
  const { data, error } = await supabaseAdmin
    .from('coding_problems')
    .select('*')
    .eq('id', problemId)
    .maybeSingle();
  if (error || !data) return notFound('Problem');

  const contestGuard = await guardMemberContest((data as ProblemRow).contest_id);
  if (!contestGuard.ok) return contestGuard;

  return { ok: true, requester: contestGuard.requester, data: data as ProblemRow, contest: contestGuard.data };
}
