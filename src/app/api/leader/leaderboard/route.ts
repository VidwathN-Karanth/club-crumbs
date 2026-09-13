import { NextResponse } from 'next/server';
import { DailyActivity } from '@/lib/models/DailyActivity';
import { requireClubManager } from '@/lib/authz';
import { emailsForCohort } from '@/lib/roster';
import { isCohort } from '@/lib/cohorts';

const VALID_RANGES = ['today', 'week', 'all'] as const;
type Range = (typeof VALID_RANGES)[number];

/** The leaderboard for the leader's own club, scoped to its members. */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const range = new URL(request.url).searchParams.get('range') || 'all';
  if (!(VALID_RANGES as readonly string[]).includes(range)) {
    return NextResponse.json({ error: `Invalid range. Valid options: ${VALID_RANGES.join(', ')}.` }, { status: 400 });
  }

  try {
    const leaderboard = await DailyActivity.getLeaderboard(range as Range, {
      restrictToEmails: await emailsForCohort(cohort),
    });
    return NextResponse.json({ cohort, range, leaderboard });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Leader leaderboard failed for ${cohort}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
