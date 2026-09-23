import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { Event } from '@/lib/models/Event';
import { memberListForCohort } from '@/lib/clubMembers';

/**
 * PATCH — set the podium: `{ results: [{ place: 1|2|3, email }] }`. Each winner
 * must be a member of the event's club; names are taken from the roster, not
 * the request. Points are awarded on read (see pointsConfig.eventPlaces), so
 * editing or clearing results re-scores the leaderboard automatically.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from('coding_events')
    .select('cohort')
    .eq('id', id)
    .maybeSingle();
  const cohort = (row as { cohort?: string } | null)?.cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const raw = Array.isArray((body as { results?: unknown }).results) ? (body as { results: unknown[] }).results : null;
  if (!raw) return NextResponse.json({ error: 'Send results as a list.' }, { status: 400 });

  const members = new Map((await memberListForCohort(cohort)).map((m) => [m.email, m.name]));
  const results: { place: number; email: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const place = Number((item as { place?: unknown }).place);
    const email = String((item as { email?: unknown }).email || '').trim().toLowerCase();
    if (!email) continue;
    if (![1, 2, 3].includes(place) || results.some((r) => r.place === place)) {
      return NextResponse.json({ error: 'Each place (1st, 2nd, 3rd) can be set once.' }, { status: 400 });
    }
    if (!members.has(email)) {
      return NextResponse.json({ error: `${email} is not a member of ${cohort}.` }, { status: 400 });
    }
    if (seen.has(email)) {
      return NextResponse.json({ error: 'One person cannot take two places.' }, { status: 400 });
    }
    seen.add(email);
    results.push({ place, email, name: members.get(email)! });
  }
  results.sort((a, b) => a.place - b.place);

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .update({ results })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

/**
 * DELETE — remove a tournament card and its linked calendar event. The event's
 * club is resolved from the row and re-checked, so a leader can only delete
 * their own club's cards.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: row, error: findError } = await supabaseAdmin
    .from('coding_events')
    .select('cohort, event_id')
    .eq('id', id)
    .maybeSingle();
  if (findError || !row) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const cohort = (row as { cohort: string }).cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const eventId = (row as { event_id: string | null }).event_id;
  if (eventId) {
    try { await Event.remove(eventId); } catch (err) { console.error('Calendar event cleanup failed:', err); }
  }

  const { error } = await supabaseAdmin.from('coding_events').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
