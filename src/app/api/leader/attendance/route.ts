import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireClubManager } from '@/lib/authz';
import { memberListForCohort } from '@/lib/clubMembers';
import { isCohort, normalizeEmail } from '@/lib/cohorts';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A club's attendance for one date.
 *
 * GET  ?cohort=&date=  → members (name/email), who was present that date, and
 *                        the list of dates that already have a record.
 * PUT                  → save the present set for a (cohort, date).
 * DELETE ?cohort=&date= → delete one date. ?cohort=&all=1 → delete all dates.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');
  const date = url.searchParams.get('date');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const members = await memberListForCohort(cohort);

  let present: string[] = [];
  if (date && DATE_PATTERN.test(date)) {
    const { data } = await supabaseAdmin
      .from('attendance')
      .select('present')
      .eq('cohort', cohort)
      .eq('date', date)
      .maybeSingle();
    present = Array.isArray((data as { present?: string[] } | null)?.present)
      ? ((data as { present: string[] }).present).map(normalizeEmail)
      : [];
  }

  const { data: dateRows } = await supabaseAdmin
    .from('attendance')
    .select('date')
    .eq('cohort', cohort)
    .order('date', { ascending: false });

  return NextResponse.json({
    members,
    present,
    dates: (dateRows || []).map((r: any) => (r as { date: string }).date),
  });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  const date = (body as { date?: string }).date;
  const present = (body as { present?: unknown }).present;

  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });
  if (typeof date !== 'string' || !DATE_PATTERN.test(date)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const emails = Array.isArray(present)
    ? Array.from(new Set(present.filter((e): e is string => typeof e === 'string').map(normalizeEmail).filter(Boolean)))
    : [];

  const { error } = await supabaseAdmin
    .from('attendance')
    .upsert(
      { cohort, date, present: emails, marked_by: guard.requester.email, updated_at: new Date().toISOString() },
      { onConflict: 'cohort,date' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: emails.length });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');
  const date = url.searchParams.get('date');
  const all = url.searchParams.get('all');
  if (!isCohort(cohort)) return NextResponse.json({ error: 'A valid club is required.' }, { status: 400 });

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  let q = supabaseAdmin.from('attendance').delete().eq('cohort', cohort);
  if (all === '1') {
    // delete every date for the club
  } else {
    if (!date || !DATE_PATTERN.test(date)) return NextResponse.json({ error: 'Pick a valid date.' }, { status: 400 });
    q = q.eq('date', date);
  }
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
