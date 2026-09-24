'use client';

import { useEffect, useState } from 'react';
import { SignIn, useAuth } from '@clerk/nextjs';
import LayoraMark from '@/components/LayoraMark';

/**
 * Sign-in bridge for the desktop app (opened in the student's normal browser).
 *
 * Google blocks OAuth inside Electron, so the app sends people here instead.
 * Signed out → the usual Google sign-in. Signed in → mint a one-time ticket and
 * hand it back to the app through the clubcrumbs:// link. The roster is checked
 * by the token route; this page only relays.
 */
export default function DesktopAuthPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/desktop-auth/token', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ticket) {
          setError(data.error || 'Could not sign in to the desktop app.');
          return;
        }
        const url = `clubcrumbs://auth?ticket=${encodeURIComponent(data.ticket)}`;
        setLink(url);
        window.location.href = url;
      } catch {
        if (!cancelled) setError('Network error. Check your connection and try again.');
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center relative overflow-hidden p-4">
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <LayoraMark className="w-14 h-14 mb-3" glyphClassName="text-2xl" />
          <h2 className="text-2xl font-bold tracking-wide text-on-surface">CLUB CRUMBS</h2>
          <p className="text-xs text-outline mt-1">Sign in to the desktop app</p>
        </div>

        {isLoaded && !isSignedIn && (
          <SignIn routing="hash" forceRedirectUrl="/desktop-auth" signUpForceRedirectUrl="/desktop-auth" />
        )}

        {isSignedIn && (
          <div className="w-full bg-surface-container border border-outline-variant rounded-xl p-5 text-center text-sm shadow-lg">
            {error ? (
              <>
                <p className="text-red-400 mb-3">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </>
            ) : link ? (
              <>
                <p className="mb-4 text-on-surface-variant">You&rsquo;re signed in. You can return to the app.</p>
                <a
                  href={link}
                  className="inline-block bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-xs font-bold"
                >
                  Open Club Crumbs
                </a>
                <p className="mt-3 text-[11px] text-outline">The link works once and expires in a minute.</p>
              </>
            ) : (
              <p className="text-on-surface-variant">Preparing your sign-in…</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
