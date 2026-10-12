import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  TEST_ADMIN_EMAIL,
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_NAME,
  TEST_SESSION_COOKIE,
  TEST_USER_COOKIE,
  isTestAuthEnabledServer,
} from '@/lib/testAuth';

export async function GET() {
  return NextResponse.json({
    enabled: isTestAuthEnabledServer(),
  });
}

export async function POST(request: Request) {
  if (!isTestAuthEnabledServer()) {
    return NextResponse.json(
      { error: 'Test authentication is not enabled on this environment.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const preferredRole = String(body.role || '').trim(); // e.g. 'admin', 'leader:Coders%20Club', or 'choose'

    if (email !== TEST_ADMIN_EMAIL.toLowerCase() || password !== TEST_ADMIN_PASSWORD) {
      return NextResponse.json(
        {
          error: 'Invalid test credentials. Use testadmin@mite.ac.in and mite@2026',
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();

    // 1. Set the secure HTTP-only session cookie used by middleware and authz
    cookieStore.set(TEST_SESSION_COOKIE, TEST_ADMIN_EMAIL, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Allow both HTTP (localhost/docker) and HTTPS
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // 2. Set client-readable cookie so front-end components recognize the test user
    cookieStore.set(
      TEST_USER_COOKIE,
      JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        name: TEST_ADMIN_NAME,
        role: preferredRole || 'admin',
      }),
      {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    // 3. Set the active context cookie if a specific role was chosen, or default to admin
    let redirectUrl = '/choose-access/';
    if (preferredRole === 'admin') {
      cookieStore.set('cc_ctx', 'admin', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      redirectUrl = '/admin/';
    } else if (preferredRole.startsWith('leader')) {
      const cohortName = preferredRole.includes(':')
        ? decodeURIComponent(preferredRole.slice(preferredRole.indexOf(':') + 1))
        : 'Coders Club';
      cookieStore.set('cc_ctx', `leader:${encodeURIComponent(cohortName)}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      redirectUrl = '/leader/';
    } else {
      // Default to /choose-access/ so the tester can pick admin or any club leader
      redirectUrl = '/choose-access/';
    }

    return NextResponse.json({
      success: true,
      redirect: redirectUrl,
      user: {
        email: TEST_ADMIN_EMAIL,
        name: TEST_ADMIN_NAME,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Test login error:', msg);
    return NextResponse.json({ error: 'Internal test login error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
