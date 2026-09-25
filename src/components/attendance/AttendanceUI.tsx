'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Download, X } from 'lucide-react';

import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { byName, counts, type AttendanceRecord, type ExportFormat } from '@/lib/attendance';

/** "XLSX | CSV" download pair. Reports failures inline instead of failing silently. */
export function ExportButtons({
  onExport,
  label,
  compact = false,
}: {
  onExport: (format: ExportFormat) => Promise<void> | void;
  label?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    setFailed(false);
    try {
      await onExport(format);
    } catch (err) {
      console.error('Attendance export failed:', err);
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const btn = compact
    ? 'px-2 py-1 text-[10px]'
    : 'px-3 py-2 text-[10px]';

  return (
    <span className="inline-flex items-center gap-1.5">
      {label && <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold mr-0.5">{label}</span>}
      {(['xlsx', 'csv'] as const).map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => run(f)}
          disabled={busy !== null}
          title={`Download ${f.toUpperCase()}`}
          className={`${btn} flex items-center gap-1 rounded-lg border border-white/10 hover:border-white/30 text-white/70 hover:text-white font-mono font-bold uppercase transition cursor-pointer disabled:opacity-40`}
        >
          <Download className="w-3 h-3" /> {busy === f ? '…' : f}
        </button>
      ))}
      {failed && <span className="text-[10px] text-rose-400 font-mono">Download failed</span>}
    </span>
  );
}

/** Slide-over listing who was present and absent on one register. */
export function RegisterDrawer({
  record,
  onClose,
}: {
  record: AttendanceRecord | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {record && <DrawerBody record={record} onClose={onClose} />}
    </AnimatePresence>
  );
}

function DrawerBody({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const [tab, setTab] = useState<'all' | 'present' | 'absent'>('all');
  const c = counts(record);
  const present = new Set(record.present);
  const list = [...record.roster]
    .sort(byName)
    .filter((m) => tab === 'all' || (tab === 'present') === present.has(m.email));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-screen bg-[#1A1D22]/95 border-l border-white/10 flex flex-col z-10 shadow-2xl"
      >
        <div className="p-5 border-b border-white/10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{record.cohort}</p>
              <h3 className="text-sm font-black text-white">{formatDate(record.date)}</h3>
              <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                Saved by {record.marked_by || '—'} · {formatDateTime(new Date(record.updated_at))}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {([
              ['all', `All ${c.total}`],
              ['present', `Present ${c.present}`],
              ['absent', `Absent ${c.absent}`],
            ] as const).map(([key, text]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition cursor-pointer ${
                  tab === key ? 'bg-white/10 border-white/25 text-white' : 'border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {list.length === 0 ? (
            <p className="p-8 text-center text-xs text-white/40 font-mono">Nobody here.</p>
          ) : (
            list.map((m) => {
              const here = present.has(m.email);
              return (
                <div key={m.email} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{m.name}</div>
                    <div className="text-[10px] text-white/40 truncate">{m.email}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 border ${
                    here ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                  }`}>
                    {here ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

/** Blocking confirmation for anything destructive. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={busy ? undefined : onCancel} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]">
        <h3 className="text-base font-black tracking-wider uppercase text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {title}
        </h3>
        <div className="text-xs text-white/60 font-mono mt-3 leading-relaxed">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">
            CANCEL
          </button>
          <button onClick={onConfirm} disabled={busy} className="px-4 py-2 bg-red-950/45 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">
            {busy ? 'WORKING…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
