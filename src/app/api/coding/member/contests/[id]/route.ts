import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardMemberContest } from '@/lib/codingAuth';

/**
 * A member's view of one contest: its problems (titles/points/languages, no
 * test data) and this member's session, if they have started. Timing is
 * reported from the server clock so the UI never has to trust the browser's.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardMemberContest(id);
  if (!guard.ok) return guard.response;

  const { data: problems, error } = await supabaseAdmin
    .from('coding_problems')
    .select('id, position, title, points, languages')
    .eq('contest_id', id)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: session } = await supabaseAdmin
    .from('coding_sessions')
    .select('started_at, ends_at')
    .eq('contest_id', id)
    .eq('user_id', guard.requester.userId)
    .maybeSingle();

  return NextResponse.json({
    contest: guard.data,
    problems: problems || [],
    session: session || null,
    serverNow: new Date().toISOString(),
  });
}

export const dynamic = 'force-dynamic';
