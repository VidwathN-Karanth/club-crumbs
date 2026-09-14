'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { COLLEGE_EMAIL_DOMAIN } from '@/lib/cohorts';
import { isDevAuthBypass } from '@/lib/devAuth';
import LayoraMark from '@/components/LayoraMark';
import { Shield, Users, LayoutDashboard, Shuffle } from 'lucide-react';

export default function LoginPage() {
  const isBypass = isDevAuthBypass();

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

        {/* Dev Auth Bypass Banner */}
        {isBypass && (
          <div className="w-full bg-purple-950/40 border border-purple-500/40 rounded-xl p-4 mb-6 relative z-10 shadow-lg">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm mb-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Dev Auth Bypass Active</span>
            </div>
            <p className="text-xs text-purple-200/70 mb-3 leading-relaxed">
              Login is bypassed for local development. Jump straight into any authorized surface:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/admin"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-100 font-medium transition"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Console
              </Link>
              <Link
                href="/leader"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/30 text-sky-100 font-medium transition"
              >
                <Users className="w-3.5 h-3.5" />
                Leader Console
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/30 text-emerald-100 font-medium transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                href="/choose-access"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Choose Role
              </Link>
            </div>
          </div>
        )}

        {/* College account requirement */}
        {!isBypass && (
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
        )}

        {/* Clerk SignIn Widget Wrapper */}
        <div className="w-full relative">
          <div className="relative z-10">
            {/*
              Google-only sign-in.

              Clerk still has email/password enabled on the instance, so it
              renders an identifier field, a password field and a sign-up link
              alongside the Google button. Those are hidden by the
              "Google-only sign-in" rules in globals.css — Clerk's injected
              styles beat the `appearance` prop's utility classes, so the
              override has to be important CSS.
            */}
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/"
              signUpFallbackRedirectUrl="/"
            />
          </div>
        </div>

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
