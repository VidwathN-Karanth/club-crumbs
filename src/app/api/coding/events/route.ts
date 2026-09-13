import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { CODING_COHORT, isCohort } from '@/lib/cohorts';

/**
 * Coding competition cards for the club — the leader's list.
 *
 * Only the Coding club (CODING_COHORT) has this section. GET lists its cards;
 * POST creates one. Both require a manager (admin, or a leader of that club).
 */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort) || cohort !== CODING_COHORT) {
    return NextResponse.json({ error: 'Coding is not enabled for this club.' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .select('*')
    .eq('cohort', cohort)
    .order('competition_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort) || cohort !== CODING_COHORT) {
    return NextResponse.json({ error: 'Coding is not enabled for this club.' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const name = String((body as { name?: string }).name || '').trim();
  const unstopLink = String((body as { unstop_link?: string }).unstop_link || '').trim();

  if (!name) return NextResponse.json({ error: 'A name is required.' }, { status: 400 });
  if (!unstopLink) return NextResponse.json({ error: 'An Unstop link is required.' }, { status: 400 });
  try {
    const u = new URL(unstopLink);
    if (u.protocol !== 'https:') throw new Error('not https');
  } catch {
    return NextResponse.json({ error: 'The Unstop link must be a valid https:// URL.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .insert({
      cohort,
      name,
      competition_date: (body as { competition_date?: string }).competition_date || null,
      start_time: (body as { start_time?: string }).start_time || null,
      end_time: (body as { end_time?: string }).end_time || null,
      registration_start: (body as { registration_start?: string }).registration_start || null,
      unstop_link: unstopLink,
      created_by: guard.requester.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export const dynamic = 'force-dynamic';
