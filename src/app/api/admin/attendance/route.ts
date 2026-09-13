import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdminCohort } from '@/lib/authz';
import { memberListForCohort } from '@/lib/clubMembers';

/**
 * The attendance a club's leaders have recorded — read-only for admins.
 *
 * A record exists ONLY for dates a leader actually took attendance; there is no
 * per-day default, so untaken days simply do not appear (nobody is implicitly
 * absent). Returns the member list plus every recorded date with who was
 * present, newest first, so the admin console can list dates and drill in.
 */
export async function GET(request: Request) {
  const guard = await requireAdminCohort(request.url);
  if (!guard.ok) return guard.response;

  const { cohort } = guard.requester;

  const members = await memberListForCohort(cohort);
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('date, present, marked_by, updated_at')
    .eq('cohort', cohort)
    .order('date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cohort, members, records: data || [] });
}

export const dynamic = 'force-dynamic';
