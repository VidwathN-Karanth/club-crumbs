/**
 * Helper to detect if a test environment is enabled and active.
 *
 * In live/production sites (e.g. Vercel deployment), test authentication is completely disabled:
 * - Username & password inputs are hidden
 * - Role selection buttons are hidden
 * - Test login API endpoint is blocked (403 Forbidden)
 * - Middleware bypass is disabled
 *
 * It is ONLY active when explicitly enabled via NEXT_PUBLIC_ENABLE_TEST_AUTH or ENABLE_TEST_DOCKER
 * inside the test docker environment.
 */

export const TEST_ADMIN_EMAIL = 'testadmin@mite.ac.in';
export const TEST_ADMIN_PASSWORD = 'mite@2026';
export const TEST_ADMIN_NAME = 'Test Administrator';

export const TEST_SESSION_COOKIE = 'cc_test_session';
export const TEST_USER_COOKIE = 'cc_test_user';

export function isTestAuthEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === 'true';
}

export function isTestAuthEnabledServer(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === 'true' ||
    process.env.ENABLE_TEST_DOCKER === 'true' ||
    process.env.ENABLE_TEST_AUTH === 'true'
  );
}

export function isTestSessionClient(): boolean {
  if (!isTestAuthEnabledClient()) return false;
  if (typeof window === 'undefined') return false;
  try {
    const hasCookie =
      document.cookie.includes(`${TEST_SESSION_COOKIE}=${TEST_ADMIN_EMAIL}`) ||
      document.cookie.includes(`${TEST_USER_COOKIE}=`);
    const hasStorage =
      localStorage.getItem('cc_test_user') !== null ||
      localStorage.getItem('cc_test_session') === TEST_ADMIN_EMAIL;
    return hasCookie || hasStorage;
  } catch {
    return false;
  }
}

