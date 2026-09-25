import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { memberListForCohort } from '@/lib/clubMembers';
import { COHORTS } from '@/lib/cohorts';
import { isValidDateKey } from '@/lib/attendance';
import { recordFor } from '@/lib/attendanceStore';

/**
 * Every club's register for one date — the admin's daily overview.
 *
 * GET ?date=YYYY-MM-DD → one entry per club, in a fixed order, with the
 * club's current member count and its record (null if not taken yet).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const date = new URL(request.url).searchParams.get('date');
  if (!isValidDateKey(date)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });

  try {
    const clubs = await Promise.all(
      COHORTS.map(async (cohort) => {
        const members = await memberListForCohort(cohort);
        return { cohort, memberCount: members.length, record: await recordFor(cohort, date, members) };
      })
    );
    return NextResponse.json({ date, clubs });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
