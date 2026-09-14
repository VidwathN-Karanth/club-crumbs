import type { Cohort } from './cohorts';
import type { Grant, Identity } from './accessGrants';

/**
 * Checks if local development authentication bypass is active.
 * Controlled via NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local
 */
export function isDevAuthBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';
}

export const MOCK_DEV_EMAIL = 'admin@mite.ac.in';
export const MOCK_DEV_NAME = 'Dev Administrator';
export const MOCK_DEV_USER_ID = 'dev_mock_admin_user';

export const MOCK_DEV_GRANTS: Grant[] = [
  { email: MOCK_DEV_EMAIL, role: 'admin', cohort: null },
  { email: MOCK_DEV_EMAIL, role: 'leader', cohort: 'Coders Club' },
  { email: MOCK_DEV_EMAIL, role: 'leader', cohort: 'Crypton Club' },
  { email: MOCK_DEV_EMAIL, role: 'leader', cohort: 'DevStudio' },
  { email: MOCK_DEV_EMAIL, role: 'member', cohort: 'DevStudio' },
];

export const MOCK_DEV_IDENTITIES: Identity[] = [
  { kind: 'admin' },
  { kind: 'leader', cohort: 'Coders Club' },
  { kind: 'leader', cohort: 'Crypton Club' },
  { kind: 'leader', cohort: 'DevStudio' },
  { kind: 'member', cohort: 'DevStudio' },
];

export const MOCK_DEV_LED_COHORTS: Cohort[] = [
  'Coders Club',
  'Crypton Club',
  'DevStudio',
];

export const MOCK_DEV_COHORT: Cohort = 'DevStudio';
