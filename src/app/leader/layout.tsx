'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, useUser } from '@clerk/nextjs';
import { BookMarked, CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Clock, Code2, FilePenLine, LayoutDashboard, LogOut, Menu, Moon, Rocket, Settings, Sun, Timer, Trophy, Users, X } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { apiFetch } from '@/lib/apiClient';
import { formatShortDate } from '@/lib/dateFormat';
import { isCohort, type Cohort, CLUB_META, tournamentFor } from '@/lib/cohorts';
import LayoraMark from '@/components/LayoraMark';
import SwitchRoleButton from '@/components/SwitchRoleButton';
import NotificationAgent from '@/components/NotificationAgent';
import NotificationCenter from '@/components/NotificationCenter';
import ExtensionNudge from '@/components/ExtensionNudge';
import NotificationNudge from '@/components/NotificationNudge';
import ZenMode from '@/components/ZenMode';
import LeaderChatLauncher from '@/components/chat/LeaderChatLauncher';
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
  { name: 'Attendance', path: '/leader/attendance', icon: CheckSquare },
  { name: 'Quick Launch', path: '/leader/quick-launch', icon: Rocket },
  { name: 'Courses', path: '/leader/courses', icon: BookMarked },
  { name: 'Reports', path: '/leader/reports', icon: FilePenLine },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [zenOpen, setZenOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const is24HourFormat = useStore((s) => s.is24HourFormat);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24HourFormat }));
      setDateStr(formatShortDate(d));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [is24HourFormat]);

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

  // The tournaments section (Coding for Coders, Gym for Crypton) only shows for
  // clubs that have one.
  const tournament = tournamentFor(cohort);
  const menu = [
    ...MENU,
    ...(tournament ? [{ name: tournament.section, path: '/leader/coding', icon: Code2 }] : []),
    { name: 'Settings', path: '/leader/settings', icon: Settings },
  ];

  return (
    <LeaderProvider value={{ cohort, leaderName, leaderEmail }}>
      <div className="min-h-screen bg-cyber-dark text-white flex relative overflow-hidden font-mono">
        {/* --- MOBILE SIDEBAR DRAWER (left) --- */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-[240px] bg-cyber-dark/95 border-r border-white/10 z-50 flex flex-col justify-between p-3.5 md:hidden"
              >
                <div className="space-y-4 overflow-y-auto scrollbar-none">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="font-mono font-bold text-sm" style={{ color: accent }}>{cohort} Lead</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-white/50" aria-label="Close the menu">
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                  <nav className="space-y-0.5">
                    {menu.map((item) => {
                      const isActive = normalise(item.path) === current;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 py-1.5 pl-2 pr-3 rounded-lg text-xs font-mono transition border ${
                            isActive
                              ? 'bg-white/10 text-white font-bold border-white/10'
                              : 'text-white/60 hover:bg-white/5 hover:text-white border-transparent'
                          }`}
                        >
                          <Icon className="w-4 h-4" strokeWidth={1.5} />
                          {item.name.toUpperCase()}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2.5 bg-white/5 p-2 rounded-lg border border-white/10">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0" style={{ backgroundColor: `${accent}22`, color: accent }}>
                      {(leaderName || 'L').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-semibold truncate text-white">{leaderName}</div>
                      <div className="text-[8px] font-mono text-white/40 truncate">{leaderEmail}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center justify-center gap-2 border border-red-500/20 bg-red-950/15 hover:bg-red-950/25 text-red-400 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} /> {signingOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* --- SIDEBAR (collapsible) --- */}
        <motion.aside
          animate={{ width: sidebarOpen ? 240 : 76 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`hidden md:flex flex-col justify-between py-4 border-r border-white/10 bg-black/20 backdrop-blur-md shrink-0 h-screen sticky top-0 z-30 overflow-hidden ${
            sidebarOpen ? 'px-4' : 'px-2'
          }`}
        >
          <div className="space-y-6">
            {/* Logo row with the collapse/expand arrow beside it. */}
            <div className={sidebarOpen ? 'flex items-center justify-between' : 'flex flex-col items-center gap-2'}>
              {sidebarOpen ? (
                <span className="flex items-center gap-2 text-sm font-bold text-white min-w-0">
                  <LayoraMark className="h-6 w-6 shrink-0" glyphClassName="text-xs" />
                  <span className="truncate">CLUB CRUMBS</span>
                  <span className="text-[9px] font-mono uppercase tracking-widest shrink-0" style={{ color: accent }}>Lead</span>
                </span>
              ) : (
                <LayoraMark className="h-7 w-7" glyphClassName="text-sm" />
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Collapse the sidebar' : 'Expand the sidebar'}
                title={sidebarOpen ? 'Collapse the sidebar' : 'Expand the sidebar'}
                className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 text-white/50 hover:text-white transition cursor-pointer shrink-0"
              >
                {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> : <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </button>
            </div>

            {sidebarOpen ? (
              <div
                className="rounded-xl border p-3"
                style={{ borderColor: `${accent}44`, backgroundColor: `${accent}12` }}
              >
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">Your club</div>
                <div className="mt-1 text-sm font-bold" style={{ color: accent }}>{cohort}</div>
              </div>
            ) : (
              <div
                className="w-11 h-11 mx-auto rounded-xl border flex items-center justify-center font-black text-sm"
                title={cohort}
                style={{ borderColor: `${accent}44`, backgroundColor: `${accent}18`, color: accent }}
              >
                {cohort.charAt(0)}
              </div>
            )}

            <nav className="space-y-1">
              {menu.map((item) => {
                const isActive = normalise(item.path) === current;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    title={sidebarOpen ? undefined : item.name}
                    aria-label={item.name}
                    className={`flex items-center rounded-xl text-xs font-mono transition border cursor-pointer ${
                      sidebarOpen ? 'w-full gap-3 py-2.5 pl-2 pr-3' : 'w-11 h-11 mx-auto justify-center'
                    } ${
                      isActive
                        ? 'bg-white/10 text-white font-bold border-white/15'
                        : 'text-white/60 hover:bg-white/5 hover:text-white border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    {sidebarOpen && item.name.toUpperCase()}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className={`flex items-center bg-white/5 rounded-xl border border-white/10 ${sidebarOpen ? 'gap-2.5 p-2.5' : 'justify-center p-1.5'}`}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0" style={{ backgroundColor: `${accent}22`, color: accent }}>
                {(leaderName || 'L').charAt(0).toUpperCase()}
              </span>
              {sidebarOpen && (
                <div className="truncate min-w-0">
                  <div className="text-xs font-mono font-semibold truncate text-white">{leaderName}</div>
                  <div className="text-[9px] font-mono text-white/40 truncate">{leaderEmail}</div>
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title={sidebarOpen ? undefined : 'Sign out'}
              aria-label="Sign out"
              className={`flex items-center justify-center gap-2 border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 rounded-xl text-xs font-mono transition cursor-pointer disabled:opacity-50 ${
                sidebarOpen ? 'w-full py-2' : 'w-11 h-11 mx-auto'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {sidebarOpen && (signingOut ? 'Signing out…' : 'Sign out')}
            </button>
          </div>
        </motion.aside>

        {/* --- MAIN --- */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="relative h-14 border-b border-white/10 bg-black/20 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-20">
            <div className="flex items-center gap-2 font-mono text-xs text-white/40">
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open the menu"
                className="md:hidden p-2 -ml-2 rounded-lg text-primary hover:bg-white/5 transition"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <LayoraMark className="h-5 w-5 md:hidden" glyphClassName="text-[10px]" />
              <span className="hidden md:inline">Console:</span>
              <span className="font-bold uppercase" style={{ color: accent }}>{cohort}</span>
              <span className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
                <CalendarDays className="w-3.5 h-3.5 text-white/30" />
                <span className="text-white/60 font-semibold tracking-wide">{dateStr}</span>
              </span>
            </div>

            {/* Live clock + light/dark switch, matching the member dashboard. */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-2.5 border border-white/10 bg-white/5 px-4 py-1.5 rounded-full font-mono">
              <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-white font-bold font-mono text-lg min-w-[100px] text-center leading-none">{timeStr || '00:00:00'}</span>
              <div className="h-4 w-[1px] bg-white/15 ml-1.5 mr-0.5 shrink-0" />
              <button
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer outline-none border border-white/10 shrink-0 ml-1.5 ${themeMode === 'light' ? 'bg-zinc-300' : 'bg-zinc-800'}`}
                title={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                aria-label={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-200 ${themeMode === 'light' ? 'translate-x-0.5 bg-white text-amber-500' : 'translate-x-4 bg-zinc-950 text-white'}`}>
                  {themeMode === 'light'
                    ? <Sun className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={2.5} />
                    : <Moon className="w-2.5 h-2.5 fill-white text-white" strokeWidth={2.5} />}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Compact light/dark toggle for mobile, where the centre pill is hidden. */}
              <button
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition cursor-pointer"
                aria-label={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {themeMode === 'light' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
              </button>
              <button
                onClick={() => setZenOpen(true)}
                title="Zen mode — a fullscreen Pomodoro session"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-primary hover:text-primary text-white/70 transition cursor-pointer"
              >
                <Timer className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Zen</span>
              </button>
              <SwitchRoleButton />
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }}>
                <Users className="w-3 h-3" /> Club lead
              </span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 z-10 flex flex-col justify-between">
            <div className="flex-1 space-y-6">{children}</div>
            <footer className="mt-12 pt-4 border-t border-white/5 text-center font-mono text-[9px] text-white/30">
              © {new Date().getFullYear()} Club Crumbs · {cohort} lead console
            </footer>
          </div>
        </main>

        <NotificationAgent />
        <NotificationCenter />
        <ExtensionNudge />
        <NotificationNudge />
        <ZenMode open={zenOpen} onClose={() => setZenOpen(false)} />
        <LeaderChatLauncher />
      </div>
    </LeaderProvider>
  );
}
