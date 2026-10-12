import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TEST_SESSION_COOKIE, TEST_USER_COOKIE } from '@/lib/testAuth';

async function performLogout(request: Request) {
  const cookieStore = await cookies();

  // Clear all test cookies and active context
  cookieStore.delete(TEST_SESSION_COOKIE);
  cookieStore.delete(TEST_USER_COOKIE);
  cookieStore.delete('cc_ctx');

  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    return NextResponse.redirect(new URL('/login/', request.url));
  }

  return NextResponse.json({ success: true, redirect: '/login/' });
}

export async function POST(request: Request) {
  return performLogout(request);
}

export async function GET(request: Request) {
  return performLogout(request);
}

export const dynamic = 'force-dynamic';
