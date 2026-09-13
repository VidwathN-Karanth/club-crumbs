import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireStudent } from '@/lib/authz';
import { isTournamentClub, tournamentFor } from '@/lib/cohorts';

/**
 * The tournament cards a member can see — only for clubs that have a
 * tournaments section (Coding for Coders, Gym for Crypton). Members of other
 * clubs get an empty list (the nav item is hidden for them anyway). The cards
 * link out to an external platform; nothing is hosted here.
 */
export async function GET() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  const cohort = guard.requester.cohort;
  if (!isTournamentClub(cohort)) return NextResponse.json({ events: [], config: null });

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .select('id, name, competition_date, start_time, end_time, registration_start, link')
    .eq('cohort', cohort)
    .order('competition_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [], config: tournamentFor(cohort) });
}

export const dynamic = 'force-dynamic';
