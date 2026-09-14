import { NextResponse } from 'next/server';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { ChatMessage } from '@/lib/models/ChatMessage';
import { pingChatChannel } from '@/lib/chatRealtime';

/** Longest message body accepted. */
const MAX_BODY = 4000;
/** Rate limit: at most this many posts per sender per rolling window. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

/**
 * The club-manager view of a chat feed — the same route admins AND leaders use,
 * exactly like /api/coding/events.
 *
 * The cohort is explicit (a query param on GET, in the body on POST) and every
 * request is checked with requireClubManager: an admin may manage any club, a
 * leader only the club(s) they lead. A leader can never reach another club's
 * chat by changing the parameter.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const after = url.searchParams.get('after');
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;

  try {
    const messages = await ChatMessage.listForCohort(cohort, { after, limit });
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[chat/manage] read failed:', err);
    return NextResponse.json({ error: 'Could not load the chat.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  const text = String((body as { body?: string }).body ?? '').trim();
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: `A message may be at most ${MAX_BODY} characters.` }, { status: 400 });
  }

  // An image lives at a URL produced by /api/chat/upload (our own storage). We
  // accept only an https URL; a message may be text, an image, or both, but not
  // empty.
  const rawImage = (body as { imageUrl?: string }).imageUrl;
  let imageUrl: string | null = null;
  if (typeof rawImage === 'string' && rawImage.trim()) {
    try {
      const u = new URL(rawImage.trim());
      if (u.protocol !== 'https:') throw new Error('not https');
      imageUrl = u.toString();
    } catch {
      return NextResponse.json({ error: 'That image link is not valid.' }, { status: 400 });
    }
  }

  if (!text && !imageUrl) {
    return NextResponse.json({ error: 'A message cannot be empty.' }, { status: 400 });
  }

  // Which badge the message wears. An account acting as admin posts as admin;
  // a leader (or an admin acting in a leader context) posts as leader.
  const ctxRole = guard.requester.activeContext?.role;
  const senderRole = ctxRole === 'leader' ? 'leader' : guard.requester.isAdmin ? 'admin' : 'leader';

  try {
    // Rate limit in the DB — serverless has no shared memory to count against.
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const recent = await ChatMessage.recentCountBySender(guard.requester.userId, since);
    if (recent >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "You're sending messages too quickly. Wait a moment and try again." },
        { status: 429 }
      );
    }

    const message = await ChatMessage.create({
      cohort,
      senderId: guard.requester.userId,
      senderName: guard.requester.name,
      senderRole,
      body: text,
      imageUrl,
    });
    await pingChatChannel(cohort);
    return NextResponse.json({ message });
  } catch (err) {
    console.error('[chat/manage] create failed:', err);
    return NextResponse.json({ error: 'Could not send the message.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
