import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireStudent } from '@/lib/authz';

/**
 * The published contests a member can see — the cards on the Coding screen.
 *
 * Scoped to the student's own club (from the session, never the URL) and to
 * published contests only. Each card carries a time-derived status so the UI
 * can label it upcoming / live / ended without its own clock being trusted.
 */
export async function GET() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  const { data, error } = await supabaseAdmin
    .from('coding_contests')
    .select('id, title, description, starts_at, duration_mins, coding_problems(count)')
    .eq('cohort', guard.requester.cohort)
    .eq('status', 'published')
    .order('starts_at', { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const contests = (data || []).map((c: Record<string, unknown>) => {
    const startsAt = c.starts_at ? new Date(c.starts_at as string).getTime() : null;
    const endsAt = startsAt ? startsAt + (c.duration_mins as number) * 60000 : null;
    let status: 'open' | 'upcoming' | 'live' | 'ended' = 'open';
    if (startsAt !== null && endsAt !== null) {
      status = now < startsAt ? 'upcoming' : now < endsAt ? 'live' : 'ended';
    }
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      starts_at: c.starts_at,
      duration_mins: c.duration_mins,
      problemCount: Array.isArray(c.coding_problems) ? (c.coding_problems[0] as { count?: number })?.count ?? 0 : 0,
      status,
    };
  });

  return NextResponse.json({ contests, serverNow: new Date(now).toISOString() });
}

export const dynamic = 'force-dynamic';
