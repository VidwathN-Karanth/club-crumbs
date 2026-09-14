import { NextResponse } from 'next/server';
import { requireStudent } from '@/lib/authz';
import { ChatMessage } from '@/lib/models/ChatMessage';

/**
 * A member's club chat feed.
 *
 * The cohort comes from the session (requireStudent), NEVER from a query
 * parameter, so a member can only ever read their own club — the URL alone
 * grants nothing.
 *
 * Query:
 *   ?after=<ISO>  only messages newer than this (what the client polls with)
 *   ?limit=<n>    cap the batch (clamped in the model)
 *
 * Posting lives in the leader/admin (club-manager) routes, added in a later
 * phase — this endpoint is read-only.
 */
export async function GET(request: Request) {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const after = url.searchParams.get('after');
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const messages = await ChatMessage.listForCohort(guard.requester.cohort, { after, limit });
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[chat/messages] read failed:', err);
    return NextResponse.json({ error: 'Could not load the chat.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
