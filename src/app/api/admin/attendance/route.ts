import { NextResponse } from 'next/server';
import { requireAdminCohort } from '@/lib/authz';
import { clubAttendance } from '@/lib/attendanceStore';

/**
 * One club's attendance history — read-only for admins.
 *
 * A record exists ONLY for dates a leader actually took attendance; untaken
 * days simply do not appear. Each record carries the roster as it was that
 * day, so its present/absent split never shifts when members change.
 */
export async function GET(request: Request) {
  const guard = await requireAdminCohort(request.url);
  if (!guard.ok) return guard.response;

  const { cohort } = guard.requester;
  try {
    return NextResponse.json({ cohort, ...(await clubAttendance(cohort)) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
