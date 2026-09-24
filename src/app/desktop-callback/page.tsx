'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSignIn } from '@clerk/nextjs';

/**
 * Loaded inside the desktop app with ?ticket=… from the clubcrumbs:// link.
 * Redeems the one-time ticket (Clerk 7's signIn.ticket + finalize) and goes to
 * the dashboard. Never logs the ticket.
 */
export default function DesktopCallbackPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || !signIn || started.current) return;
    started.current = true;

    const ticket = new URLSearchParams(window.location.search).get('ticket');
    // Drop the ticket from the address bar and history straight away.
    window.history.replaceState(null, '', '/desktop-callback');

    if (isSignedIn) { router.replace('/dashboard'); return; }

    (async () => {
      if (!ticket) { setError('This sign-in link is missing its ticket.'); return; }
      const { error: ticketError } = await signIn.ticket({ ticket });
      if (ticketError || signIn.status !== 'complete') {
        setError('This sign-in link has expired or was already used.');
        return;
      }
      const { error: finalizeError } = await signIn.finalize({
        navigate: () => router.replace('/dashboard'),
      });
      if (finalizeError) setError('Could not start your session. Please try again.');
    })();
  }, [isLoaded, isSignedIn, signIn, router]);

  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-container border border-outline-variant rounded-xl p-5 text-center text-sm shadow-lg">
        {error ? (
          <>
            <p className="text-red-400 mb-3">{error}</p>
            <a href="/desktop-auth" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Try again
            </a>
          </>
        ) : (
          <p className="text-on-surface-variant">Signing you in…</p>
        )}
      </div>
    </main>
  );
}
