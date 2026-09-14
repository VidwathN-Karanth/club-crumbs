'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Check, X } from 'lucide-react';

import { permissionState, requestPermission, announce } from '@/lib/notifications';

const DISMISS_KEY = 'cc-notif-nudge-dismissed';

/**
 * A gentle pop that asks the signed-in user to turn on browser notifications
 * (the same option that lives in Settings). It appears once, only when the
 * browser supports notifications and the user has not decided yet, and it can
 * always be dismissed. Enabling confirms with a short message and a test ping.
 */
export default function NotificationNudge() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'granted' | 'denied' | null>(null);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    if (permissionState() !== 'default') return; // supported + not yet decided only

    // Let the page settle before popping.
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  const enable = async () => {
    setBusy(true);
    const state = await requestPermission();
    setBusy(false);
    try { window.localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    if (state === 'granted') {
      setResult('granted');
      // A real notification, both as a confirmation and to prove it works.
      announce({ title: 'Notifications are on', body: "You'll get your reminders right here.", tag: 'cc-notif-enabled', kind: 'event' });
      setTimeout(() => setShow(false), 3200);
    } else {
      setResult('denied');
      setTimeout(() => setShow(false), 5000);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="complementary"
          aria-label="Turn on notifications"
          className="fixed bottom-4 right-4 z-[60] w-[min(20rem,calc(100vw-2rem))] glass-card rounded-2xl border border-outline-variant shadow-xl p-4"
        >
          {!result && (
            <button onClick={dismiss} aria-label="Dismiss" className="absolute right-2.5 top-2.5 rounded-lg p-1 text-outline hover:bg-white/5 hover:text-on-surface transition cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {result === 'granted' ? (
            <div className="flex items-center gap-2.5 pr-2">
              <Check className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-on-surface">You&apos;re all set</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Reminders will show up here.</p>
              </div>
            </div>
          ) : result === 'denied' ? (
            <div className="pr-2">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications are blocked</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Your browser blocked them. You can re-enable notifications for this site from the browser&apos;s site settings, then turn them on again from Settings.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pr-6">
                <BellRing className="h-4 w-4 shrink-0 text-primary" />
                <h4 className="font-mono text-xs font-bold tracking-wider text-primary">Turn on notifications</h4>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-on-surface-variant">
                Get reminders for events, deadlines and club updates right here. You can change this anytime in Settings.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={enable}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-primary text-white text-xs font-bold py-2 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {busy ? 'Enabling…' : 'Enable notifications'}
                </button>
                <button onClick={dismiss} className="rounded-lg border border-outline-variant text-on-surface-variant text-xs font-bold py-2 px-3 hover:bg-white/5 transition cursor-pointer">
                  Not now
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
