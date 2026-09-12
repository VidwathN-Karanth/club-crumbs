import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardContest } from '@/lib/codingAuth';

/** POST — add a problem to a contest (appended at the end). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await guardContest(id);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const title = String(body.title || '').trim() || 'Untitled problem';

  const { count } = await supabaseAdmin
    .from('coding_problems')
    .select('id', { count: 'exact', head: true })
    .eq('contest_id', id);

  const { data, error } = await supabaseAdmin
    .from('coding_problems')
    .insert({ contest_id: id, title, position: count ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ problem: data });
}

export const dynamic = 'force-dynamic';
