'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

/**
 * "Switch role" — visible only to an account that holds more than one identity
 * (e.g. an admin who also leads a club, or a leader of two clubs). It sends
 * them back to /choose-access, where picking rewrites the active-context cookie.
 *
 * A single-role account never sees it, so the control is silent for the people
 * it does not concern.
 */
export default function SwitchRoleButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [multi, setMulti] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (!cancelled) setMulti(Array.isArray(data.identities) && data.identities.length > 1);
      } catch {
        // Not knowing is a fine reason to simply not show the control.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!multi) return null;

  return (
    <button
      onClick={() => router.push('/choose-access')}
      title="Switch role"
      className={`flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/60 transition hover:text-white hover:border-white/30 cursor-pointer ${className}`}
    >
      <Repeat className="h-3 w-3" /> Switch role
    </button>
  );
}
