import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { memberListForCohort } from '@/lib/clubMembers';
import { isCohort } from '@/lib/cohorts';

/**
 * Every attendance record for a club, plus the member list — enough for the
 * client to build one combined CSV of all dates before a "clear all" delete.
 */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const members = await memberListForCohort(cohort);
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('date, present')
    .eq('cohort', cohort)
    .order('date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ members, records: data || [] });
}

export const dynamic = 'force-dynamic';
