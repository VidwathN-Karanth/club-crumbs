import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { guardProblem } from '@/lib/codingAuth';
import { isLanguageKey } from '@/lib/languages';

/**
 * One problem, for authoring.
 *
 * GET    → the problem plus its test cases (author view — includes hidden ones).
 * PATCH  → edit statement, languages, limits, points, images.
 * DELETE → remove it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardProblem(pid);
  if (!guard.ok) return guard.response;

  const { data: testcases, error } = await supabaseAdmin
    .from('coding_testcases')
    .select('*')
    .eq('problem_id', pid)
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ problem: guard.data, testcases: testcases || [] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardProblem(pid);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.title === 'string') patch.title = body.title.trim() || 'Untitled problem';
  if (typeof body.statement_md === 'string') patch.statement_md = body.statement_md;
  if (Array.isArray(body.image_urls)) patch.image_urls = body.image_urls.filter((u: unknown) => typeof u === 'string');
  if (Array.isArray(body.languages)) patch.languages = body.languages.filter(isLanguageKey);
  if ('time_limit_ms' in body) patch.time_limit_ms = Math.max(500, Math.min(15000, Number(body.time_limit_ms) || 2000));
  if ('memory_limit_kb' in body) patch.memory_limit_kb = Math.max(16000, Math.min(512000, Number(body.memory_limit_kb) || 128000));
  if ('points' in body) patch.points = Math.max(0, Number(body.points) || 0);

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('coding_problems')
    .update(patch)
    .eq('id', pid)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ problem: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const guard = await guardProblem(pid);
  if (!guard.ok) return guard.response;

  const { error } = await supabaseAdmin.from('coding_problems').delete().eq('id', pid);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';
