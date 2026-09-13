import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireStudent } from '@/lib/authz';
import { CODING_COHORT } from '@/lib/cohorts';

/**
 * The coding competition cards a member can see — only for the Coding club.
 * A member of any other club gets an empty list (the nav item is hidden for
 * them anyway). The cards link out to Unstop; nothing is hosted here.
 */
export async function GET() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  if (guard.requester.cohort !== CODING_COHORT) {
    return NextResponse.json({ events: [] });
  }

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .select('id, name, competition_date, start_time, end_time, registration_start, unstop_link')
    .eq('cohort', CODING_COHORT)
    .order('competition_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}

export const dynamic = 'force-dynamic';
