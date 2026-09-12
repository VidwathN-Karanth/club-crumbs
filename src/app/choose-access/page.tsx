'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Shield, Users, GraduationCap } from 'lucide-react';

import { apiFetch } from '@/lib/apiClient';
import { CLUB_META, type Cohort } from '@/lib/cohorts';
import LayoraMark from '@/components/LayoraMark';

type Identity =
  | { kind: 'admin' }
  | { kind: 'leader'; cohort: Cohort }
  | { kind: 'member'; cohort: Cohort };

/** The cookie value form the /api/access/context route validates. */
function contextString(identity: Identity): string {
  if (identity.kind === 'admin') return 'admin';
  return `${identity.kind}:${encodeURIComponent(identity.cohort)}`;
}

function cardFor(identity: Identity) {
  if (identity.kind === 'admin') {
    return {
      icon: Shield,
      title: 'Admin Console',
      subtitle: 'Full access — every club, every student',
      accent: '#C56BF5',
    };
  }
  const accent = CLUB_META[identity.cohort].accent;
  if (identity.kind === 'leader') {
    return {
      icon: Users,
      title: `${identity.cohort} · Leader`,
      subtitle: 'Manage your club and its members',
      accent,
    };
  }
  return {
    icon: GraduationCap,
    title: `${identity.cohort} · Workspace`,
    subtitle: 'Your student dashboard',
    accent,
  };
}

export default function ChooseAccessPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  const [identities, setIdentities] = useState<Identity[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
      return;
    }
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (cancelled) return;

        const list: Identity[] = Array.isArray(data.identities) ? data.identities : [];
        // Nothing to choose: let the proxy route them from wherever they land.
        if (list.length <= 1) {
          router.replace('/dashboard');
          return;
        }
        setIdentities(list);
      } catch {
        if (!cancelled) setError('Could not load your access. Try reloading.');
      }
    })();

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

  const choose = async (identity: Identity) => {
    const value = contextString(identity);
    setBusy(value);
    setError('');
    try {
      const res = await apiFetch('/api/access/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not switch.');
      router.replace(data.redirect || '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch.');
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#16181C] text-white flex flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <LayoraMark className="w-12 h-12" glyphClassName="text-lg" />
          <h1 className="text-2xl font-bold tracking-tight">How do you want to continue?</h1>
          <p className="text-sm text-white/40">
            Your account has more than one role. Pick one — you can switch any time.
          </p>
        </div>

        {!identities ? (
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm py-10">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your roles…
          </div>
        ) : (
          <div className="space-y-3">
            {identities.map((identity, i) => {
              const card = cardFor(identity);
              const value = contextString(identity);
              const Icon = card.icon;
              const isBusy = busy === value;
              return (
                <motion.button
                  key={value}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => choose(identity)}
                  disabled={busy !== null}
                  className="group w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06] disabled:opacity-50 cursor-pointer"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${card.accent}22`, color: card.accent }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-white truncate">{card.title}</span>
                    <span className="block text-xs text-white/40 truncate">{card.subtitle}</span>
                  </span>
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-6 text-center text-xs text-rose-400">{error}</p>}
      </div>
    </main>
  );
}
