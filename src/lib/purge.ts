import 'server-only';

import { supabaseAdmin } from './supabaseAdmin';
import { normalizeEmail } from './cohorts';

/**
 * Erases every trace of one member, addressed by email.
 *
 * Removing a member is defined as a full purge (the product decision), so this
 * deletes their synced workspace and all derived history. A member is keyed in
 * the app by their Clerk id, but the person managing them only knows an email —
 * so we resolve the id through the `users` row first.
 *
 *   users        → deleted (cascades daily_activities and certificates)
 *   user_states  → deleted (keyed by the same Clerk id; not an FK)
 *   extension_tokens → deleted
 *
 * A member who was added but never signed in has no rows at all; that is a
 * clean no-op, not an error. Returns whether anything was found.
 */
export async function purgeMemberByEmail(email: string): Promise<{ purged: boolean; userId: string | null }> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { purged: false, userId: null };

  // Resolve the Clerk id from the users row (email is unique there).
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', normalized)
    .maybeSingle();

  const userId = (userRow as { id: string } | null)?.id ?? null;

  // user_states is keyed by Clerk id. If we never resolved an id, there may
  // still be a state row whose stored email matches — but state rows are keyed
  // by id, not email, so without the id there is nothing addressable to delete.
  if (userId) {
    await supabaseAdmin.from('user_states').delete().eq('id', userId);
    await supabaseAdmin.from('extension_tokens').delete().eq('user_id', userId);
    // Deleting the users row cascades daily_activities and certificates (both
    // reference users(id) on delete cascade).
    await supabaseAdmin.from('users').delete().eq('id', userId);
  }

  return { purged: Boolean(userId), userId };
}
