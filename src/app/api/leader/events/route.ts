import { NextResponse } from 'next/server';
import { Event } from '@/lib/models/Event';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { REPEAT_RULES, isDateKey, isRepeatRule } from '@/lib/recurrence';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A leader's events for their own club.
 *
 * Posts land with audience = the leader's club, so every member of that club
 * sees them in their existing calendar (no member-side change needed). GET
 * returns the club's staff events (plus department-wide ones, read-only here).
 */
export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json({ cohort, events: await Event.findForStaff(cohort) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const { title, description, eventDate, repeat, repeatUntil } = body as {
    title?: string; description?: string; eventDate?: string; repeat?: string; repeatUntil?: string;
  };

  if (typeof title !== 'string' || !title.trim()) return NextResponse.json({ error: 'Give the event a title.' }, { status: 400 });
  if (typeof eventDate !== 'string' || !DATE_PATTERN.test(eventDate)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });

  const rule = repeat == null ? 'none' : repeat;
  if (!isRepeatRule(rule)) return NextResponse.json({ error: `Invalid repeat. Expected: ${REPEAT_RULES.join(', ')}.` }, { status: 400 });
  if (repeatUntil != null && repeatUntil !== '' && !isDateKey(repeatUntil)) return NextResponse.json({ error: 'Pick a valid repeat end date.' }, { status: 400 });
  if (isDateKey(repeatUntil) && repeatUntil < eventDate) return NextResponse.json({ error: 'The repeat cannot end before it starts.' }, { status: 400 });

  try {
    const event = await Event.create({
      title: title.trim().slice(0, 120),
      description: typeof description === 'string' ? description.trim().slice(0, 500) || null : null,
      eventDate,
      repeat: rule,
      repeatUntil: isDateKey(repeatUntil) ? repeatUntil : null,
      audience: cohort, // the leader's club — every member of it will see this
      createdBy: guard.requester.userId,
      creatorName: guard.requester.name,
      isStaff: true,
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE ?id= — a leader may remove only events posted to their own club. */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing event id.' }, { status: 400 });

  const event = await Event.findById(id);
  if (!event || !isCohort(event.audience)) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const guard = await requireClubManager(event.audience);
  if (!guard.ok) return guard.response;

  await Event.remove(id);
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
