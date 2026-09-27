'use client';

import { useEffect, useState } from 'react';
import { Bell, Download, Monitor, Sparkles } from 'lucide-react';

import { useStore } from '@/store/useStore';
import {
  announce, clearTodaysNotificationMarks, permissionState, requestPermission,
  type NotificationPermissionState,
} from '@/lib/notifications';

/* ────────────────────────────────────────────────────────────────
   The two per-device settings shared by every staff role — reminders
   and the interface look. Extracted so admin and leader settings render
   the exact same controls with one copy of the permission logic.
   ──────────────────────────────────────────────────────────────── */

/** The reminders card — permission handling, Allow, Test, and the on/off switch. */
export function RemindersControl() {
  const store = useStore();

  // The browser's own permission is separate from the preference: a user can
  // want reminders while the browser blocks them.
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default');

  // Read after mount, never during render: the server has no Notification API.
  useEffect(() => {
    const id = setTimeout(() => setNotifPermission(permissionState()), 0);
    return () => clearTimeout(id);
  }, []);

  const enableNotifications = async () => {
    // Inside the click on purpose — a permission request without a user gesture
    // is ignored, or silently denied, by most browsers.
    const state = await requestPermission();
    setNotifPermission(state);
    if (state === 'granted') {
      store.setNotificationsEnabled(true);
      announce({
        title: 'Reminders are on',
        body: 'This is what a Club Crumbs reminder looks like.',
        tag: 'layora-test',
      });
    }
  };

  const sendTestReminder = () => {
    clearTodaysNotificationMarks();
    announce({
      title: 'Test reminder',
      body: 'If you can see this, reminders are working on this device.',
      tag: 'layora-test-reminder',
      kind: 'event',
    });
  };

  const reminderState =
    notifPermission === 'unsupported'
      ? 'In-app only here — this browser has no system notifications'
      : notifPermission === 'denied'
        ? 'System alerts blocked — allow them in your browser settings'
        : notifPermission === 'granted'
          ? store.notificationsEnabled ? 'On, including system alerts' : 'Switched off'
          : store.notificationsEnabled
            ? 'On in the app — allow system alerts too'
            : 'Switched off';

  return (
    <div className="pt-1 border-t border-outline-variant/40">
      <div className="bg-surface-container border border-outline-variant rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-mono font-bold text-on-surface flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-primary" /> Reminders
          </span>
          <span className="text-[9px] font-mono text-outline">{reminderState}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {store.notificationsEnabled
            && notifPermission !== 'granted'
            && notifPermission !== 'unsupported'
            && notifPermission !== 'denied' && (
            <button
              onClick={enableNotifications}
              className="bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition cursor-pointer"
            >
              Allow
            </button>
          )}
          <button
            onClick={sendTestReminder}
            title="Send a test reminder now"
            className="border border-outline-variant text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:border-primary hover:text-primary transition cursor-pointer"
          >
            Test
          </button>
          <button
            onClick={() => store.setNotificationsEnabled(!store.notificationsEnabled)}
            role="switch"
            aria-checked={store.notificationsEnabled}
            aria-label="Reminders"
            className={`relative flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer border ${
              store.notificationsEnabled ? 'bg-primary border-primary' : 'bg-surface-container-high border-outline-variant'
            }`}
          >
            <span className={`h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
              store.notificationsEnabled ? 'translate-x-[1.15rem]' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      <p className="text-[9px] font-mono text-outline mt-2.5 leading-relaxed">
        One switch for every reminder Club Crumbs sends you. It covers what your club has
        scheduled today. Turn it on separately on each device you use — nothing is emailed.
      </p>
    </div>
  );
}

/** The interface panel — theme mode and time display format. */
export function InterfacePanel() {
  const store = useStore();

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-outline-variant pb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-mono font-bold tracking-wider text-primary">Interface</h3>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-mono text-outline uppercase block">Theme mode</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            { mode: 'light' as const, label: '☀️ Light Mode' },
            { mode: 'dark' as const, label: '🌙 Dark Mode' },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => store.setThemeMode(mode)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                (store.themeMode || 'dark') === mode
                  ? 'border-primary bg-primary text-white font-bold'
                  : 'border-outline-variant bg-white/2 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant pt-4 space-y-2">
        <span className="text-[10px] font-mono text-outline uppercase block">Time display format</span>
        <div className="grid grid-cols-2 gap-2">
          {([
            { is24: false, label: '12-Hour (AM/PM)' },
            { is24: true, label: '24-Hour' },
          ]).map(({ is24, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => store.setIs24HourFormat(is24)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition text-center cursor-pointer ${
                store.is24HourFormat === is24
                  ? 'border-primary bg-primary text-white font-bold'
                  : 'border-outline-variant bg-white/2 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const DESKTOP_APP_URL =
  'https://github.com/VidwathN-Karanth/Club-Crumbs-DesktopApp/releases/download/v1.0.0/Club-Crumbs-Setup-1.0.0.exe';

/** The Windows desktop app download — same card for members, leaders and admins. */
export function DesktopAppPanel() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-outline-variant pb-2">
        <Monitor className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-mono font-bold tracking-wider text-primary">Desktop App</h3>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Club Crumbs in its own window on Windows — sign in once and it opens straight to
        your workspace.
      </p>

      <a
        href={DESKTOP_APP_URL}
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary transition hover:opacity-90"
      >
        <Download className="w-3.5 h-3.5" /> Download Desktop App
      </a>
      <span className="block text-[10px] font-mono text-outline">Windows · v1.0.0</span>
    </div>
  );
}
