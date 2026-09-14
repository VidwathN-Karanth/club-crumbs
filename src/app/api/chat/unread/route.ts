import { NextResponse } from 'next/server';
import { requireStudent } from '@/lib/authz';
import { ChatMessage } from '@/lib/models/ChatMessage';

/**
 * The unread-message count for the member's own club, driving the chat badge.
 *
 * Cohort is from the session (requireStudent), so nobody can ask for another
 * club's count. This is the endpoint the launcher polls while the panel is
 * closed.
 */
export async function GET() {
  const guard = await requireStudent();
  if (!guard.ok) return guard.response;

  try {
    const count = await ChatMessage.unreadCount(guard.requester.cohort, guard.requester.userId);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('[chat/unread] count failed:', err);
    return NextResponse.json({ error: 'Could not load the unread count.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
