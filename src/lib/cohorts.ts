/**
 * Club vocabulary shared by the browser and the server.
 *
 * This file deliberately holds NO email addresses — it is safe to import from
 * client components. The roster itself lives in `roster.ts`, which is
 * server-only so that student email addresses never reach the JS bundle.
 *
 * NOTE ON NAMING: the internal identifiers still read `cohort` / `Cohort` for
 * historical reasons (Club Crumbs grew out of a year-cohort app). A "cohort"
 * here means one of the three clubs below — nothing to do with academic year.
 */

/** The three clubs a student can belong to. Exactly one club per student. */
export const COHORTS = ['Coders Club', 'Crypton Club', 'DevStudio'] as const;

export type Cohort = (typeof COHORTS)[number];

/** Only college Google accounts may sign in. */
export const COLLEGE_EMAIL_DOMAIN = 'mite.ac.in';

/**
 * Shared-resource tag meaning "every club should see this" — general
 * handbooks, cross-club announcements, and the like.
 */
export const SHARED_RESOURCE_TAG = 'Others';

/** Every tag a shared resource may carry: one per club, plus the shared shelf. */
export const RESOURCE_TAGS = [...COHORTS, SHARED_RESOURCE_TAG] as const;

export type ResourceTag = Cohort | typeof SHARED_RESOURCE_TAG;

/**
 * Presentation-only metadata for each club — a one-line blurb and an accent
 * colour. Used by the landing page and the dashboard club badge. Safe for the
 * browser; contains no roster data.
 *
 * The blurbs are sensible placeholders — a club lead can reword them freely.
 */
export const CLUB_META: Record<Cohort, { tagline: string; blurb: string; accent: string }> = {
  'Coders Club': {
    tagline: 'Competitive programming & DSA',
    blurb: 'Daily problem solving, contest prep and a leaderboard that rewards the grind — LeetCode and CodeChef streaks made visible.',
    accent: '#2E95FF',
  },
  'Crypton Club': {
    tagline: 'Cybersecurity & CTF',
    blurb: 'Capture-the-flag practice, security reading groups and write-ups, for the people who like to break things to understand them.',
    accent: '#C56BF5',
  },
  DevStudio: {
    tagline: 'Building & shipping projects',
    blurb: 'Ship real things — web, apps and open source. Track GitHub contributions and turn side projects into a portfolio.',
    accent: '#E0A93B',
  },
};

export function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

export function isCohort(value: unknown): value is Cohort {
  return typeof value === 'string' && (COHORTS as readonly string[]).includes(value);
}

/**
 * Coerces a stored tag value into a tag we still recognise.
 *
 * Resources uploaded before the move to clubs carry free-form tags, including
 * the retired year labels ('2nd Year', etc.). Folding anything unrecognised
 * into the shared shelf keeps those uploads visible instead of orphaning them
 * behind a tag no student can ever match.
 */
export function resolveResourceTag(year: unknown): ResourceTag {
  return isCohort(year) ? year : SHARED_RESOURCE_TAG;
}

/** Whether a student in `cohort` is allowed to see a resource tagged `year`. */
export function cohortCanSeeResource(cohort: Cohort, year: unknown): boolean {
  const tag = resolveResourceTag(year);
  return tag === cohort || tag === SHARED_RESOURCE_TAG;
}

/**
 * A document name reduced to the form two uploads are compared on.
 *
 * Case and stray spacing are not a meaningful difference between two documents
 * in a shared library — "Unit 1 Notes", "unit 1 notes" and "Unit  1  Notes"
 * are one title as far as a student scanning the list is concerned, so they
 * are treated as one here.
 */
export function normalizeResourceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Whether two resource tags ever appear in the same list.
 *
 * Two clubs never see each other, so Coders Club and Crypton Club may each hold
 * their own "Unit 1 Notes" without confusing anyone. The shared shelf is
 * different: it shows up in every club's library, so it collides with all of
 * them.
 */
export function resourceTagsOverlap(a: unknown, b: unknown): boolean {
  const left = resolveResourceTag(a);
  const right = resolveResourceTag(b);
  return left === right || left === SHARED_RESOURCE_TAG || right === SHARED_RESOURCE_TAG;
}

/**
 * The existing resource that would make `name` ambiguous, if there is one.
 *
 * Only counts a clash where the two would be visible together — see
 * `resourceTagsOverlap`. Returns the offender rather than a boolean so the
 * caller can say who already holds the name.
 */
export function findResourceNameClash<T extends { name: string; year?: unknown }>(
  resources: readonly T[],
  name: string,
  year: unknown
): T | undefined {
  const wanted = normalizeResourceName(name);
  if (!wanted) return undefined;

  return resources.find(
    (r) => normalizeResourceName(r.name) === wanted && resourceTagsOverlap(r.year, year)
  );
}

/** "Coders Club" → "Coders", for tight spaces like table headers and chips. */
export function shortCohortLabel(cohort: Cohort): string {
  return cohort.replace(/\s+Club$/, '');
}
