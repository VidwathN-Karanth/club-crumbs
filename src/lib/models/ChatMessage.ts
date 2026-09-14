import 'server-only';

import { supabaseAdmin } from '../supabaseAdmin';
import type { Cohort } from '../cohorts';

/**
 * Club chat — the shared, per-club message feed.
 *
 * This is SHARED club data, so it lives in its own tables (see
 * supabase/chat.sql), NOT in the per-user synced state blob (user_states).
 * Everything here goes through the service-role client; the caller has already
 * been authorised by a route guard (requireStudent / requireClubManager), so
 * these methods trust the `cohort`/`userId` they are handed and never re-derive
 * permission.
 */

/** A message as the client consumes it. A deleted message is a tombstone: its
 *  body and image are blanked, `deleted` is true. */
export interface ChatMessageRow {
  id: string;
  cohort: Cohort;
  senderId: string;
  senderName: string;
  senderRole: string;
  body: string;
  imageUrl: string | null;
  edited: boolean;
  deleted: boolean;
  createdAt: string;
}

interface DatabaseChatMessageRow {
  id: string;
  cohort: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  image_url: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** The most a single feed read ever returns. */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function mapRow(row: DatabaseChatMessageRow): ChatMessageRow {
  const deleted = row.deleted_at !== null;
  return {
    id: row.id,
    cohort: row.cohort as Cohort,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    // A tombstone carries no content — never leak the text of a removed message.
    body: deleted ? '' : row.body,
    imageUrl: deleted ? null : row.image_url,
    edited: row.edited_at !== null,
    deleted,
    createdAt: row.created_at,
  };
}

function clampLimit(raw: number | null | undefined): number {
  if (!raw || !Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(raw), MAX_LIMIT);
}

export const ChatMessage = {
  /**
   * A club's feed in chronological order (oldest → newest), ready to render.
   *
   * With no `after`, returns the most recent `limit` messages (the tail of the
   * feed). With `after` (an ISO timestamp), returns everything newer than it —
   * this is what the client polls with, passing the last message it has seen.
   */
  async listForCohort(
    cohort: Cohort,
    opts: { after?: string | null; limit?: number } = {}
  ): Promise<ChatMessageRow[]> {
    const limit = clampLimit(opts.limit);

    if (opts.after) {
      // Newer-than-cursor: ascending is already the display order.
      const { data, error } = await supabaseAdmin
        .from('club_messages')
        .select('*')
        .eq('cohort', cohort)
        .gt('created_at', opts.after)
        .order('created_at', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return (data as DatabaseChatMessageRow[]).map(mapRow);
    }

    // Initial load: take the newest `limit`, then flip to chronological order.
    const { data, error } = await supabaseAdmin
      .from('club_messages')
      .select('*')
      .eq('cohort', cohort)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as DatabaseChatMessageRow[]).map(mapRow).reverse();
  },

  /**
   * How many messages in this club the user has not yet read — messages created
   * after their last-read marker, not counting their own posts. No marker row
   * (never opened the chat) counts every message.
   */
  async unreadCount(cohort: Cohort, userId: string): Promise<number> {
    const lastRead = await this.lastReadAt(cohort, userId);

    let q = supabaseAdmin
      .from('club_messages')
      .select('id', { count: 'exact', head: true })
      .eq('cohort', cohort)
      .is('deleted_at', null)
      .neq('sender_id', userId);
    if (lastRead) q = q.gt('created_at', lastRead);

    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  },

  /** The user's last-read timestamp for a club, or null if they never opened it. */
  async lastReadAt(cohort: Cohort, userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('club_message_reads')
      .select('last_read_at')
      .eq('cohort', cohort)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as { last_read_at: string } | null)?.last_read_at ?? null;
  },

  /** Mark this club read for the user, up to now. Upserts the single marker row. */
  async markRead(cohort: Cohort, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('club_message_reads')
      .upsert(
        { user_id: userId, cohort, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,cohort' }
      );
    if (error) throw error;
  },

  /**
   * How many messages this sender has posted since `sinceIso`, across all clubs.
   *
   * Serverless has no shared memory, so rate limiting is enforced in the DB: the
   * POST route refuses a manager who has posted too many in the last minute.
   */
  async recentCountBySender(senderId: string, sinceIso: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('club_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', senderId)
      .gt('created_at', sinceIso);
    if (error) throw error;
    return count ?? 0;
  },

  /* ── Writes (club managers only; the route proves who may call in) ─────── */

  /** Post a new message to a club's feed. Returns the created row. */
  async create(input: {
    cohort: Cohort;
    senderId: string;
    senderName: string;
    senderRole: string;
    body: string;
    imageUrl?: string | null;
  }): Promise<ChatMessageRow> {
    const { data, error } = await supabaseAdmin
      .from('club_messages')
      .insert({
        cohort: input.cohort,
        sender_id: input.senderId,
        sender_name: input.senderName,
        sender_role: input.senderRole,
        body: input.body,
        image_url: input.imageUrl ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data as DatabaseChatMessageRow);
  },

  /** One message by id, or null. Used to check ownership/cohort before a write. */
  async findById(id: string): Promise<ChatMessageRow | null> {
    const { data, error } = await supabaseAdmin
      .from('club_messages')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data as DatabaseChatMessageRow) : null;
  },

  /** Edit a message's text and stamp edited_at. Returns the updated row. */
  async updateBody(id: string, body: string): Promise<ChatMessageRow> {
    const { data, error } = await supabaseAdmin
      .from('club_messages')
      .update({ body, edited_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data as DatabaseChatMessageRow);
  },

  /** Soft-delete a message (row retained for audit; content blanked on read). */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('club_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
