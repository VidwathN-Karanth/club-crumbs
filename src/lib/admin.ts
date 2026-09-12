import 'server-only';

/**
 * The one permanent admin.
 *
 * Admins now live in the database (public.access_grants) and are managed at
 * runtime from the console — no admin address is hardcoded any more, with this
 * single exception. The root admin is always treated as an admin regardless of
 * the table, and every demote/revoke path refuses to touch it, so a botched
 * migration or a database outage can never leave the app with no way in. It is
 * the master key, and nothing else.
 *
 * Server-only so the address is never bundled into the browser. The client only
 * ever needs to know whether *it* is an admin, which /api/me answers; every
 * admin route re-checks server-side through requireAdmin() in authz.ts.
 */
export const ROOT_ADMIN = 'vidwathkaranth@gmail.com';

export function isRootAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ROOT_ADMIN;
}
