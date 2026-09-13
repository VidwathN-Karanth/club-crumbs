import 'server-only';

import { supabaseAdmin } from './supabaseAdmin';
import { memberEmailsForCohort } from './accessGrants';
import { normalizeEmail, type Cohort } from './cohorts';

export interface ClubMember {
  email: string;
  name: string;
}

/**
 * Every member of a club as { email, name }, sorted by name.
 *
 * The roster (emails) comes from access_grants; the display name comes from the
 * member's synced workspace when they have one, falling back to the local part
 * of the email. Used by attendance and any other "list the members" screen.
 */
export async function memberListForCohort(cohort: Cohort): Promise<ClubMember[]> {
  const emails = await memberEmailsForCohort(cohort);
  if (emails.length === 0) return [];
  const emailSet = new Set(emails);

  const nameByEmail = new Map<string, string>();
  try {
    const { data } = await supabaseAdmin
      .from('user_states')
      .select('state')
      .neq('id', 'global_settings');
    for (const row of data || []) {
      const u = (row as { state?: { user?: { email?: string; name?: string } } }).state?.user;
      const email = normalizeEmail(u?.email);
      if (email && emailSet.has(email) && u?.name) nameByEmail.set(email, u.name);
    }
  } catch {
    // Names are a nicety; the email is the identifier.
  }

  return emails
    .map((email) => ({ email, name: nameByEmail.get(email) || email.split('@')[0] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
