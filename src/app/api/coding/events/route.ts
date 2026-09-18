import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { isCohort, isTournamentClub, tournamentFor } from '@/lib/cohorts';
import { Event } from '@/lib/models/Event';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A club's tournament cards — the leader's list (Coding for Coders, Gym for
 * Crypton). Only clubs with a tournaments config have this; both require a
 * manager (admin, or a leader of that club).
 */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isTournamentClub(cohort)) {
    return NextResponse.json({ error: 'This club has no tournaments section.' }, { status: 400 });
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
  return NextResponse.json({ events: data || [], config: tournamentFor(cohort) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort) || !isTournamentClub(cohort)) {
    return NextResponse.json({ error: 'This club has no tournaments section.' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const config = tournamentFor(cohort)!;
  const name = String((body as { name?: string }).name || '').trim();
  const link = String((body as { link?: string }).link || '').trim();
  const competitionDate = (body as { competition_date?: string }).competition_date || null;
  const startTime = (body as { start_time?: string }).start_time || null;
  const endTime = (body as { end_time?: string }).end_time || null;
  const registrationStart = (body as { registration_start?: string }).registration_start || null;

  // Optional platform tag — Unstop / HackerRank buttons preset it and we hold
  // the link to that host so an Unstop card can't quietly point elsewhere.
  const rawPlatform = String((body as { platform?: string }).platform || '').toLowerCase();
  const platform = rawPlatform === 'unstop' || rawPlatform === 'hackerrank' ? rawPlatform : null;
  const PLATFORM_HOST: Record<string, string> = { unstop: 'unstop.com', hackerrank: 'hackerrank.com' };

  if (!name) return NextResponse.json({ error: 'A name is required.' }, { status: 400 });
  if (!link) return NextResponse.json({ error: `A ${config.linkLabel} is required.` }, { status: 400 });
  try {
    const u = new URL(link);
    if (u.protocol !== 'https:') throw new Error('not https');
    if (platform && !u.hostname.endsWith(PLATFORM_HOST[platform])) {
      return NextResponse.json({ error: `That does not look like a ${PLATFORM_HOST[platform]} link.` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: `The ${config.linkLabel} must be a valid https:// URL.` }, { status: 400 });
  }

  // Put it on the club's calendar so members and the leader see it on the day.
  let eventId: string | null = null;
  if (competitionDate && DATE_PATTERN.test(competitionDate)) {
    try {
      const calendarEvent = await Event.create({
        title: `${config.section}: ${name}`,
        description: `${startTime ? startTime + ' · ' : ''}${link}`.slice(0, 500),
        eventDate: competitionDate,
        repeat: 'none',
        repeatUntil: null,
        audience: cohort,
        createdBy: guard.requester.userId,
        creatorName: guard.requester.name,
        isStaff: true,
      });
      eventId = calendarEvent.id;
    } catch (err) {
      console.error('Tournament calendar event failed:', err);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .insert({
      cohort,
      name,
      competition_date: competitionDate,
      start_time: startTime,
      end_time: endTime,
      registration_start: registrationStart,
      link,
      platform,
      event_id: eventId,
      created_by: guard.requester.email,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}

export const dynamic = 'force-dynamic';
