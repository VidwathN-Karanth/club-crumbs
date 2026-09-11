import "server-only";

import {
  COHORTS,
  COLLEGE_EMAIL_DOMAIN,
  normalizeEmail,
  type Cohort,
} from "./cohorts";

/**
 * ============================================================================
 *  THE CLUB ROSTER — this is the file a club lead edits.
 * ============================================================================
 *
 *  Everything else in Club Crumbs is derived from this list. A student's email
 *  decides which club leaderboard they compete on, which shared resources they
 *  can see, and which club the admin console shows them under. Nothing about a
 *  club is stored in the database, so editing this file is the only step
 *  needed to move someone between clubs.
 *
 *  HOW TO ADD A STUDENT
 *  --------------------
 *  Paste their full college address into the right club's list, in quotes,
 *  with a trailing comma. Case and stray spaces do not matter. Then redeploy.
 *
 *  ONE CLUB PER STUDENT
 *  --------------------
 *  A student belongs to exactly one club. The same address in two lists is a
 *  mistake, and the app refuses to start in development until it is fixed (see
 *  the guard at the bottom). To move someone between clubs, delete them from
 *  the old list and add them to the new one — do not leave them in both.
 *
 *  RULES ENFORCED FOR YOU
 *  ----------------------
 *  - An address must end in @mite.ac.in or the student cannot sign in at all.
 *  - An address missing from all three lists cannot sign in; they are shown a
 *    message telling them to ask their club lead to add it. This is
 *    deliberate — it means nobody can ever end up inside a club they were not
 *    added to.
 *  - The same address in two lists is a mistake, and the app refuses to start
 *    in development until it is fixed (see the guard at the bottom).
 *
 *  NOTE: admins (see `admin.ts`) are not club members and do not belong here.
 * ============================================================================
 */
export const COHORT_ROSTER: Record<Cohort, string[]> = {
  "Coders Club": [
    "4mt24cs130@mite.ac.in",
    "4mt24cs140@mite.ac.in",
    "4mt24cs076@mite.ac.in",
    "4mt24cs077@mite.ac.in",
  ],

  "Crypton Club": [
    "4mt24cs239@mite.ac.in",
    "4mt23cs249@mite.ac.in",
  ],

  DevStudio: [
    // e.g. '4mt24cs002@mite.ac.in',
  ],
};

/**
 * Lowercased lookup built once at module load, so a request never scans the
 * roster linearly.
 */
const EMAIL_TO_COHORT: Map<string, Cohort> = (() => {
  const map = new Map<string, Cohort>();
  const duplicates: string[] = [];

  for (const cohort of COHORTS) {
    for (const rawEmail of COHORT_ROSTER[cohort]) {
      const email = normalizeEmail(rawEmail);
      if (!email) continue;

      const existing = map.get(email);
      if (existing && existing !== cohort) {
        duplicates.push(
          `${email} is listed under both ${existing} and ${cohort}`,
        );
        continue;
      }
      map.set(email, cohort);
    }
  }

  if (duplicates.length > 0) {
    const detail = duplicates.join("; ");
    // Fail loudly in development so the mistake is fixed before it ships. In
    // production, keep serving with the first listing rather than taking the
    // whole club offline.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Roster error in src/lib/roster.ts — ${detail}`);
    }
    console.error(
      `[roster] Duplicate roster entries, using the first listing for each: ${detail}`,
    );
  }

  return map;
})();

/** Whether this address belongs to the college at all. */
export function isCollegeEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${COLLEGE_EMAIL_DOMAIN}`);
}

/** The student's club, or null if they are not on the roster. */
export function getCohortForEmail(
  email: string | null | undefined,
): Cohort | null {
  return EMAIL_TO_COHORT.get(normalizeEmail(email)) ?? null;
}

/**
 * The one question every gate asks: may this address in?
 *
 * A student needs both a college address and a place on the roster. Kept here,
 * beside the list itself, so the middleware, the API guards and the client gate
 * cannot answer it three slightly different ways.
 */
export function isOnRoster(email: string | null | undefined): boolean {
  return isCollegeEmail(email) && getCohortForEmail(email) !== null;
}

/** Every roster address for one club, lowercased. Used to scope DB queries. */
export function emailsForCohort(cohort: Cohort): string[] {
  return COHORT_ROSTER[cohort].map(normalizeEmail).filter(Boolean);
}

/** How many students each club has on the roster. For admin diagnostics. */
export function rosterCounts(): Record<Cohort, number> {
  return {
    "Coders Club": emailsForCohort("Coders Club").length,
    "Crypton Club": emailsForCohort("Crypton Club").length,
    DevStudio: emailsForCohort("DevStudio").length,
  };
}
