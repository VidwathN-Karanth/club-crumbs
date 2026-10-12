'use client';

import { useEffect, useState } from 'react';
import { SignIn } from '@clerk/nextjs';
import { COLLEGE_EMAIL_DOMAIN } from '@/lib/cohorts';
import LayoraMark from '@/components/LayoraMark';
import TestLoginForm from '@/components/TestLoginForm';
import { ShieldCheck, Globe } from 'lucide-react';
import { isTestAuthEnabledClient } from '@/lib/testAuth';
import { apiFetch } from '@/lib/apiClient';

export default function LoginPage() {
  const [isTestEnabled, setIsTestEnabled] = useState(false);
  const [authMode, setAuthMode] = useState<'test' | 'google'>('google');

  useEffect(() => {
    // 1. Initial synchronous check from build-time environment
    const clientCheck = isTestAuthEnabledClient();
    if (clientCheck) {
      setIsTestEnabled(true);
      setAuthMode('test');
    }

    // 2. Runtime check against server endpoint (active in test Docker)
    let cancelled = false;
    apiFetch('/api/test-login')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.enabled === 'boolean') {
          setIsTestEnabled(data.enabled);
          setAuthMode(data.enabled ? 'test' : 'google');
        }
      })
      .catch(() => {
        // In production/live if endpoint fails or 403s, keep test mode disabled
        if (!cancelled) {
          setIsTestEnabled(false);
          setAuthMode('google');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center relative overflow-hidden p-4">
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Layora Logo */}
        <div className="flex flex-col items-center mb-6">
          <LayoraMark className="w-14 h-14 mb-3" glyphClassName="text-2xl" />
          <h2 className="text-2xl font-bold tracking-wide text-on-surface">
            CLUB CRUMBS
          </h2>
          <p className="text-xs text-outline mt-1">MITE Tech Clubs · Unified Dashboard</p>
        </div>

        {/* Tab switch between Test Environment & Google OAuth — ONLY rendered in test docker environment */}
        {isTestEnabled && (
          <div className="w-full flex items-center p-1 rounded-xl bg-surface-container border border-outline-variant mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => setAuthMode('test')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                authMode === 'test'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Test Sign-In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('google')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                authMode === 'google'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Google OAuth
            </button>
          </div>
        )}

        {isTestEnabled && authMode === 'test' ? (
          <TestLoginForm />
        ) : (
          <>
            {/* College account requirement */}
            <div className="w-full bg-surface-container border border-outline-variant rounded-xl p-4 mb-6 relative z-10 flex items-start gap-3 shadow-lg">
              <div className="mt-0.5 p-1 rounded-lg bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <h4 className="font-semibold text-on-surface mb-0.5">Use your college Google account</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Sign in with the <span className="text-primary font-semibold">@{COLLEGE_EMAIL_DOMAIN}</span> account issued by
                  the college. Your club, leaderboard, and shared notes are all set up from it.
                </p>
              </div>
            </div>

            {/* Clerk SignIn Widget Wrapper */}
            <div className="w-full relative">
              <div className="relative z-10">
                <SignIn
                  routing="hash"
                  fallbackRedirectUrl="/"
                  signUpFallbackRedirectUrl="/"
                />
              </div>
            </div>
          </>
        )}

        <p className="mt-6 text-[11px] text-outline text-center max-w-xs leading-relaxed">
          Signed in but can&rsquo;t get through? Your email may not be on your club roster yet — ask your club lead to add it.
        </p>

        <footer className="mt-6 text-center text-xs text-outline space-y-1.5 z-10">
          <div>© {new Date().getFullYear()} Vidwath N Karanth. All rights reserved.</div>
          <div className="flex items-center justify-center gap-3">
            <a href="/privacy" className="text-primary hover:text-on-surface transition hover:underline">Privacy Policy</a>
            <span className="text-outline-variant">•</span>
            <a href="/terms" className="text-primary hover:text-on-surface transition hover:underline">Terms & Conditions</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
