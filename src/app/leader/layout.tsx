'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { CalendarDays, Code2, LayoutDashboard, LogOut, Settings, Trophy, Users } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiClient';
import { isCohort, type Cohort, CLUB_META, CODING_COHORT } from '@/lib/cohorts';
import LayoraMark from '@/components/LayoraMark';
import SwitchRoleButton from '@/components/SwitchRoleButton';
import NotificationAgent from '@/components/NotificationAgent';
import NotificationCenter from '@/components/NotificationCenter';
import { LeaderProvider } from './LeaderContext';

/* ────────────────────────────────────────────────────────────────
   The club leader's console — a deliberately narrow cousin of the admin
   console. Same visual language, but one club only (no year/club switcher) and
   only the sections a leader is trusted with: an overview and the members list.
   The club is fixed by the active-context cookie and resolved here once.
   ──────────────────────────────────────────────────────────────── */

const MENU = [
  { name: 'Overview', path: '/leader', icon: LayoutDashboard },
  { name: 'Members', path: '/leader/members', icon: Users },
  { name: 'Events', path: '/leader/events', icon: CalendarDays },
  { name: 'Leaderboard', path: '/leader/leaderboard', icon: Trophy },
];

const normalise = (path: string) => path.replace(/\/$/, '') || '/leader';

/** Pull the club out of an active-context string like `leader:Crypton%20Club`. */
function leaderCohortFromContext(active: string | null): Cohort | null {
  if (!active) return null;
  const idx = active.indexOf(':');
  if (idx === -1 || active.slice(0, idx) !== 'leader') return null;
  const cohort = decodeURIComponent(active.slice(idx + 1));
  return isCohort(cohort) ? cohort : null;
}

export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { isLoaded: isAuthLoaded, isSignedIn, signOut } = useAuth();

  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const leaderName = user?.fullName || user?.firstName || 'Club Lead';
  const leaderEmail = user?.primaryEmailAddress?.emailAddress || '';
  const current = normalise(pathname);

  const checkedRef = useRef(false);
  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) return;
    if (!isSignedIn) {
      router.replace('/login');
      return;
    }
    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/me');
        const data = await res.json();
        if (cancelled) return;

        const led: Cohort[] = Array.isArray(data.ledCohorts) ? data.ledCohorts.filter(isCohort) : [];
        if (led.length === 0) {
          // Not a leader at all — send them wherever they belong.
          router.replace('/dashboard');
          return;
        }

        // The active club comes from the chosen context; a single-club leader
        // resolves to it automatically. Anything ambiguous → pick on /choose-access.
        const fromCtx = leaderCohortFromContext(data.activeContext);
        const resolved = fromCtx ?? (led.length === 1 ? led[0] : null);
        if (!resolved) {
          router.replace('/choose-access');
          return;
        }
        setCohort(resolved);
      } catch {
        // Undecided is not denied; leave the loader up rather than eject a real lead.
      }
    })();

    return () => { cancelled = true; };
  }, [isUserLoaded, isAuthLoaded, isSignedIn, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      useStore.getState().logout();
      await signOut();
      router.replace('/login');
    } catch {
      setSigningOut(false);
    }
  };

  if (!cohort) {
    return (
      <main className="min-h-screen bg-[#16181C] text-white flex flex-col items-center justify-center gap-4">
        <LayoraMark className="w-12 h-12" glyphClassName="text-lg" />
        <p className="text-xs font-mono text-white/40">Opening your club…</p>
      </main>
    );
  }

  const accent = CLUB_META[cohort].accent;

  // The Coding section (Unstop competition cards) is only for the Coding club.
  const menu = [
    ...MENU,
    ...(cohort === CODING_COHORT ? [{ name: 'Coding', path: '/leader/coding', icon: Code2 }] : []),
    { name: 'Settings', path: '/leader/settings', icon: Settings },
  ];

  return (
    <LeaderProvider value={{ cohort, leaderName, leaderEmail }}>
      <div className="min-h-screen bg-cyber-dark text-white flex relative overflow-hidden font-mono">
        {/* --- SIDEBAR --- */}
        <aside className="hidden md:flex flex-col justify-between py-4 px-4 border-r border-white/10 bg-black/20 backdrop-blur-md shrink-0 w-[240px] h-screen sticky top-0 z-30">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <LayoraMark className="h-6 w-6" glyphClassName="text-xs" /> CLUB CRUMBS
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: accent }}>Lead</span>
            </div>

            <div
              className="rounded-xl border p-3"
              style={{ borderColor: `${accent}44`, backgroundColor: `${accent}12` }}
            >
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">Your club</div>
              <div className="mt-1 text-sm font-bold" style={{ color: accent }}>{cohort}</div>
            </div>

            <nav className="space-y-1">
              {menu.map((item) => {
                const isActive = normalise(item.path) === current;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 py-2.5 pl-2 pr-3 rounded-xl text-xs font-mono transition border cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-bold border-white/15'
                        : 'text-white/60 hover:bg-white/5 hover:text-white border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    {item.name.toUpperCase()}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2.5 bg-white/5 rounded-xl border border-white/10 p-2.5">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0" style={{ backgroundColor: `${accent}22`, color: accent }}>
                {(leaderName || 'L').charAt(0).toUpperCase()}
              </span>
              <div className="truncate min-w-0">
                <div className="text-xs font-mono font-semibold truncate text-white">{leaderName}</div>
                <div className="text-[9px] font-mono text-white/40 truncate">{leaderEmail}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-2 border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded-xl text-xs font-mono py-2 transition cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        {/* --- MAIN --- */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 font-mono text-xs text-white/40">
              <LayoraMark className="h-5 w-5 md:hidden" glyphClassName="text-[10px]" />
              <span className="hidden md:inline">Console:</span>
              <span className="font-bold uppercase" style={{ color: accent }}>{cohort}</span>
            </div>
            <div className="flex items-center gap-3">
              <SwitchRoleButton />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }}>
                <Users className="w-3 h-3" /> Club lead
              </span>
            </div>
          </header>

          {/* Mobile nav */}
          <nav className="md:hidden flex gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
            {menu.map((item) => {
              const isActive = normalise(item.path) === current;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-mono font-bold uppercase transition cursor-pointer border ${
                    isActive ? 'bg-white/10 text-white border-white/15' : 'text-white/50 border-transparent'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10 flex flex-col justify-between">
            <div className="flex-1 space-y-6">{children}</div>
            <footer className="mt-12 pt-4 border-t border-white/5 text-center font-mono text-[9px] text-white/30">
              © {new Date().getFullYear()} Club Crumbs · {cohort} lead console
            </footer>
          </div>
        </main>

        <NotificationAgent />
        <NotificationCenter />
      </div>
    </LeaderProvider>
  );
}
