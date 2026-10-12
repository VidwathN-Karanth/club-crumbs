/**
 * Helper to detect if a test session is currently active in the client or server.
 */

export const TEST_ADMIN_EMAIL = 'testadmin@mite.ac.in';
export const TEST_ADMIN_PASSWORD = 'mite@2026';
export const TEST_ADMIN_NAME = 'Test Administrator';

export const TEST_SESSION_COOKIE = 'cc_test_session';
export const TEST_USER_COOKIE = 'cc_test_user';

export function isTestSessionClient(): boolean {
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
