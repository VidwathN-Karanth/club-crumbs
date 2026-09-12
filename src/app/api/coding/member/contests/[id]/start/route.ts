import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardMemberContest } from '@/lib/codingAuth';

/**
 * Starts (or resumes) a member's session for a contest.
 *
 * The first call stamps `ends_at = now + duration`, capped at the contest's own
 * end when it is scheduled — this is the authoritative timer every Run/Submit
 * checks. Calling again just returns the existing window, so a refresh never
 * grants more time.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardMemberContest(id);
  if (!guard.ok) return guard.response;

  const contest = guard.data;
  const userId = guard.requester.userId;

  // Already started? Return the existing window untouched.
  const { data: existing } = await supabaseAdmin
    .from('coding_sessions')
    .select('started_at, ends_at')
    .eq('contest_id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return NextResponse.json({ session: existing, serverNow: new Date().toISOString() });

  const now = Date.now();

  // A scheduled contest that has not opened, or has ended, cannot be started.
  if (contest.starts_at) {
    const startsAt = new Date(contest.starts_at).getTime();
    const windowEnd = startsAt + contest.duration_mins * 60000;
    if (now < startsAt) return NextResponse.json({ error: 'This contest has not started yet.' }, { status: 400 });
    if (now >= windowEnd) return NextResponse.json({ error: 'This contest has ended.' }, { status: 400 });
  }

  let endsAt = now + contest.duration_mins * 60000;
  if (contest.starts_at) {
    const windowEnd = new Date(contest.starts_at).getTime() + contest.duration_mins * 60000;
    endsAt = Math.min(endsAt, windowEnd);
  }

  const { data, error } = await supabaseAdmin
    .from('coding_sessions')
    .insert({ contest_id: id, user_id: userId, ends_at: new Date(endsAt).toISOString() })
    .select('started_at, ends_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data, serverNow: new Date().toISOString() });
}

export const dynamic = 'force-dynamic';
