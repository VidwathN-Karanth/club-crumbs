import { NextResponse } from 'next/server';
import { requireClubManager } from '@/lib/authz';
import { isCohort } from '@/lib/cohorts';
import { ChatMessage } from '@/lib/models/ChatMessage';
import { pingChatChannel } from '@/lib/chatRealtime';

const MAX_BODY = 4000;

/**
 * Whether this requester may modify this message.
 *
 * A manager may only touch a message in a club they manage (checked by
 * requireClubManager on the passed cohort) AND that message must actually
 * belong to that club. Beyond that: the author may edit/delete their own, and
 * an admin may moderate anyone's. A leader cannot edit another leader's post.
 */
async function loadModifiable(
  id: string,
  cohort: string,
  userId: string,
  isAdmin: boolean
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const message = await ChatMessage.findById(id);
  if (!message || message.deleted) {
    return { ok: false, response: NextResponse.json({ error: 'Message not found.' }, { status: 404 }) };
  }
  if (message.cohort !== cohort) {
    // The id belongs to a different club than the one this manager proved rights to.
    return { ok: false, response: NextResponse.json({ error: 'Message not found.' }, { status: 404 }) };
  }
  if (!isAdmin && message.senderId !== userId) {
    return { ok: false, response: NextResponse.json({ error: 'You can only edit your own messages.' }, { status: 403 }) };
  }
  return { ok: true };
}

/** Edit a message's text (author, or an admin moderating), or pin/unpin it (any manager of the club). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const cohort = (body as { cohort?: string }).cohort;
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  // Pin / unpin: any manager of this club may pin any live message in it —
  // pinning is curation, not authorship, so it is not limited to the author.
  const pinned = (body as { pinned?: unknown }).pinned;
  if (typeof pinned === 'boolean') {
    try {
      const target = await ChatMessage.findById(id);
      if (!target || target.deleted || target.cohort !== cohort) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }
      const message = await ChatMessage.setPinned(id, pinned);
      await pingChatChannel(cohort);
      return NextResponse.json({ message });
    } catch (err) {
      console.error('[chat/manage] pin failed:', err);
      return NextResponse.json({ error: 'Could not update the pin.' }, { status: 500 });
    }
  }

  const text = String((body as { body?: string }).body ?? '').trim();
  if (!text) return NextResponse.json({ error: 'A message cannot be empty.' }, { status: 400 });
  if (text.length > MAX_BODY) {
    return NextResponse.json({ error: `A message may be at most ${MAX_BODY} characters.` }, { status: 400 });
  }

  try {
    const check = await loadModifiable(id, cohort, guard.requester.userId, guard.requester.isAdmin);
    if (!check.ok) return check.response;
    const message = await ChatMessage.updateBody(id, text);
    await pingChatChannel(cohort);
    return NextResponse.json({ message });
  } catch (err) {
    console.error('[chat/manage] edit failed:', err);
    return NextResponse.json({ error: 'Could not edit the message.' }, { status: 500 });
  }
}

/** Soft-delete a message (author, or an admin moderating). Cohort via query. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cohort = new URL(request.url).searchParams.get('cohort');
  if (!isCohort(cohort)) {
    return NextResponse.json({ error: 'Missing or invalid "cohort".' }, { status: 400 });
  }

  const guard = await requireClubManager(cohort);
  if (!guard.ok) return guard.response;

  try {
    const check = await loadModifiable(id, cohort, guard.requester.userId, guard.requester.isAdmin);
    if (!check.ok) return check.response;
    await ChatMessage.softDelete(id);
    await pingChatChannel(cohort);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat/manage] delete failed:', err);
    return NextResponse.json({ error: 'Could not delete the message.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
