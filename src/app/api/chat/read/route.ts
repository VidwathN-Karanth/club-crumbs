import { NextResponse } from 'next/server';
import { requireStudent } from '@/lib/authz';
import { ChatMessage } from '@/lib/models/ChatMessage';

/**
 * Mark the member's own club chat as read, up to now.
 *
 * Called when the panel opens (or reaches the bottom of the feed). Cohort and
 * user both come from the session, so this only ever touches the caller's own
 * marker for their own club.
 */
export async function POST() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  try {
    await ChatMessage.markRead(guard.requester.cohort, guard.requester.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat/read] mark failed:', err);
    return NextResponse.json({ error: 'Could not update read status.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
