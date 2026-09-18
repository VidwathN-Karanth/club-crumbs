import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TASK_RETENTION_DAYS } from '@/lib/limits';

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

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'Server misconfigured: CRON_SECRET not set' }, { status: 500 });
  }
  if (request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    note: `retention ${TASK_RETENTION_DAYS}d`,
  });

  return NextResponse.json({ ok: true, usersTouched, tasksArchived, tasksDeleted });
}

export const dynamic = 'force-dynamic';
