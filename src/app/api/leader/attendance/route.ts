import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { memberListForCohort } from '@/lib/clubMembers';
import { isCohort, normalizeEmail } from '@/lib/cohorts';
import { byName, isValidDateKey, type RosterEntry } from '@/lib/attendance';
import { clubAttendance, recordFor } from '@/lib/attendanceStore';

/**
 * A club's attendance register (leaders of that club, and admins).
 *
 * GET    ?cohort=               → current members + every record, newest first.
 * PUT    { cohort, date, present, absent, expectedUpdatedAt }
 *                               → save one date. Every member shown must be
 *                                 marked, and the save is refused (409) if
 *                                 someone else saved that date in the meantime.
 * DELETE ?cohort=&date=         → delete one date.  ?cohort=&all=1 → every date.
 */

export async function GET(request: Request) {
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json(await clubAttendance(cohort));
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

function emailList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((e) => typeof e !== 'string')) return null;
  return [...new Set((value as string[]).map(normalizeEmail).filter(Boolean))];
}

/** Latest date a register may be taken for: tomorrow in UTC, which covers every timezone's "today". */
function latestAllowedDate(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const conflict = (who: string | null, when: string) =>
  NextResponse.json(
    {
      error: `${who || 'Another leader'} saved attendance for this date at ${new Date(when).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}. Reload to see their version before saving again.`,
      reason: 'conflict',
    },
    { status: 409 }
  );

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cohort?: string;
    date?: string;
    present?: unknown;
    absent?: unknown;
    expectedUpdatedAt?: string | null;
  };
  const { cohort, date } = body;

  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });
  if (!isValidDateKey(date)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });
  if (date > latestAllowedDate()) return NextResponse.json({ error: 'Attendance cannot be taken for a future date.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const present = emailList(body.present);
  const absent = emailList(body.absent);
  if (!present || !absent) return NextResponse.json({ error: 'Malformed attendance list.' }, { status: 400 });
  if (present.some((e) => absent.includes(e))) {
    return NextResponse.json({ error: 'A member cannot be both present and absent.' }, { status: 400 });
  }
  if (present.length + absent.length === 0) {
    return NextResponse.json({ error: 'Mark at least one member before saving.' }, { status: 400 });
  }

  try {
    const members = await memberListForCohort(cohort);
    const existing = await recordFor(cohort, date, members);

    // Who may appear on this date: today's members, plus anyone already on the
    // saved register (so editing an old date keeps people who have since left).
    const known = new Map<string, RosterEntry>();
    for (const m of existing?.roster || []) known.set(m.email, m);
    for (const m of members) known.set(m.email, m);

    const unknown = [...present, ...absent].filter((e) => !known.has(e));
    if (unknown.length) {
      return NextResponse.json(
        { error: `Not a member of ${cohort}: ${unknown.slice(0, 3).join(', ')}${unknown.length > 3 ? '…' : ''}. Reload and try again.` },
        { status: 400 }
      );
    }

    const roster = [...present, ...absent].map((e) => known.get(e)!).sort(byName);
    const me = guard.requester.email;
    const now = new Date().toISOString();
    const expected = body.expectedUpdatedAt ?? null;

    if (!existing) {
      if (expected) {
        return NextResponse.json({ error: 'This date was deleted by someone else while you were editing. Reload to start again.', reason: 'conflict' }, { status: 409 });
      }
      const { error } = await supabaseAdmin.from('attendance').insert({
        cohort, date, present, roster, taken_by: me, marked_by: me, created_at: now, updated_at: now,
      });
      if (error) {
        if (error.code === '23505') {
          const winner = await recordFor(cohort, date, members);
          return conflict(winner?.marked_by ?? null, winner?.updated_at ?? now);
        }
        throw new Error(error.message);
      }
    } else {
      if (!expected || new Date(expected).getTime() !== new Date(existing.updated_at).getTime()) {
        return conflict(existing.marked_by, existing.updated_at);
      }
      // Conditional on the version we checked, so a save racing ours cannot be overwritten.
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({ present, roster, marked_by: me, updated_at: now })
        .eq('cohort', cohort)
        .eq('date', date)
        .eq('updated_at', existing.updated_at)
        .select('date');
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        const winner = await recordFor(cohort, date, members);
        return conflict(winner?.marked_by ?? null, winner?.updated_at ?? now);
      }
    }

    const saved = await recordFor(cohort, date, members);
    return NextResponse.json({ success: true, record: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Attendance save failed:', message);
    return NextResponse.json({ error: `Could not save attendance: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');
  const date = url.searchParams.get('date');
  const all = url.searchParams.get('all') === '1';
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });
  if (!all && !isValidDateKey(date)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  let q = supabaseAdmin.from('attendance').delete().eq('cohort', cohort);
  if (!all) q = q.eq('date', date as string);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
