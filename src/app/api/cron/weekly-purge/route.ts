import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CHAT_RETENTION_DAYS, TASK_RETENTION_DAYS } from '@/lib/limits';

/**
 * Weekly task purge. Tasks live inside each user's user_states.state blob, so
 * this trims state.tasks[] per user: anything older than TASK_RETENTION_DAYS is
 * copied to tasks_archive, then removed. One purge_runs row records the run.
 *
 * A task's age is its completedAt or createdAt. Tasks with neither date (legacy
 * rows created before the createdAt field existed) are kept — better than
 * guessing an age and deleting real data.
 *
 * ponytail: loads every user_state in one pass. Fine at the current scale; if
 * user_states grows past what one serverless invocation can handle, paginate
 * like /api/cron/daily-sync does (offset + resume).
 */

interface StoredTask {
  id?: string;
  createdAt?: string;
  completedAt?: string;
  [key: string]: unknown;
}

function isOld(task: StoredTask, cutoff: number): boolean {
  const stamp = task.completedAt || task.createdAt;
  if (!stamp) return false; // undated → keep
  const t = new Date(stamp).getTime();
  return Number.isFinite(t) && t < cutoff;
}

const CHAT_BUCKET = 'chat-images';
const CHAT_BUCKET_MARKER = `/${CHAT_BUCKET}/`;

/** The storage key of a chat image we host, or null (Drive / external URL). */
function chatImageKey(url: string | null): string | null {
  if (!url) return null;
  const at = url.indexOf(CHAT_BUCKET_MARKER);
  return at === -1 ? null : decodeURIComponent(url.slice(at + CHAT_BUCKET_MARKER.length).split('?')[0]);
}

/**
 * Chat cleanup, never touching pinned messages:
 *  1. messages removed more than CHAT_RETENTION_DAYS ago are hard-deleted
 *     (and their stored image with them);
 *  2. unpinned messages older than that lose their Supabase-hosted image.
 *     Drive-hosted images cost us nothing and are left alone.
 *
 * ponytail: 1000 rows per step per run; a backlog drains over a few weeks.
 */
async function purgeChat() {
  const cutoffIso = new Date(Date.now() - CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: removed, error: removedError } = await supabaseAdmin
    .from('club_messages')
    .select('id, image_url')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffIso)
    .limit(1000);
  if (removedError) throw removedError;

  const { data: aged, error: agedError } = await supabaseAdmin
    .from('club_messages')
    .select('id, body, image_url')
    .is('deleted_at', null)
    .is('pinned_at', null)
    .lt('created_at', cutoffIso)
    .like('image_url', `%${CHAT_BUCKET_MARKER}%`)
    .limit(1000);
  if (agedError) throw agedError;

  const keys = [...(removed ?? []), ...(aged ?? [])]
    .map((r) => chatImageKey((r as { image_url: string | null }).image_url))
    .filter((k): k is string => !!k);

  // Storage first: if it fails the rows stay, and the next run retries.
  if (keys.length) {
    const { error } = await supabaseAdmin.storage.from(CHAT_BUCKET).remove(keys);
    if (error) throw error;
  }

  const removedIds = (removed ?? []).map((r) => (r as { id: string }).id);
  if (removedIds.length) {
    const { error } = await supabaseAdmin.from('club_messages').delete().in('id', removedIds);
    if (error) throw error;
  }

  const agedRows = (aged ?? []) as { id: string; body: string }[];
  if (agedRows.length) {
    const { error } = await supabaseAdmin
      .from('club_messages')
      .update({ image_url: null })
      .in('id', agedRows.map((r) => r.id));
    if (error) throw error;
    // An image-only message would otherwise render as an empty bubble.
    const emptied = agedRows.filter((r) => !r.body.trim()).map((r) => r.id);
    if (emptied.length) {
      await supabaseAdmin
        .from('club_messages')
        .update({ body: `(image removed after ${CHAT_RETENTION_DAYS} days)` })
        .in('id', emptied);
    }
  }

  return { chatMessagesDeleted: removedIds.length, chatImagesRemoved: keys.length };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfigured: CRON_SECRET not set' }, { status: 500 });
  }
  if (request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Chat cleanup runs independently: a failure here must not block the task purge.
  let chat: Awaited<ReturnType<typeof purgeChat>> | { chatError: string };
  try {
    chat = await purgeChat();
  } catch (err) {
    console.error('weekly-purge: chat cleanup failed:', err);
    chat = { chatError: (err as { message?: string })?.message ?? String(err) };
  }

  const cutoff = Date.now() - TASK_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const { data: rows, error } = await supabaseAdmin
    .from('user_states')
    .select('id, state');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let usersTouched = 0;
  let tasksArchived = 0;
  let tasksDeleted = 0;

  for (const row of rows || []) {
    const state = (row as { state?: Record<string, unknown> }).state;
    const ownerId = (row as { id: string }).id;
    const tasks = Array.isArray(state?.tasks) ? (state!.tasks as StoredTask[]) : [];
    if (tasks.length === 0) continue;

    const old = tasks.filter((t) => isOld(t, cutoff));
    if (old.length === 0) continue;

    // Archive first, then drop — so a failed archive never loses a task.
    const { error: archiveError } = await supabaseAdmin
      .from('tasks_archive')
      .insert(old.map((task) => ({ owner_id: ownerId, task })));
    if (archiveError) {
      console.error(`weekly-purge: archive failed for ${ownerId}:`, archiveError.message);
      continue;
    }

    const kept = tasks.filter((t) => !isOld(t, cutoff));
    const { error: writeError } = await supabaseAdmin
      .from('user_states')
      .update({
        // Bump clientTimestamp so an open tab accepts this over its own copy.
        state: { ...state, tasks: kept, clientTimestamp: Date.now() },
        updated_at: new Date().toISOString(),
      })
      .eq('id', ownerId);
    if (writeError) {
      console.error(`weekly-purge: write failed for ${ownerId}:`, writeError.message);
      continue;
    }

    usersTouched += 1;
    tasksArchived += old.length;
    tasksDeleted += old.length;
  }

  await supabaseAdmin.from('purge_runs').insert({
    users_touched: usersTouched,
    tasks_archived: tasksArchived,
    tasks_deleted: tasksDeleted,
    note: `retention ${TASK_RETENTION_DAYS}d; chat ${JSON.stringify(chat)}`,
  });

  return NextResponse.json({ ok: true, usersTouched, tasksArchived, tasksDeleted, ...chat });
}

export const dynamic = 'force-dynamic';
