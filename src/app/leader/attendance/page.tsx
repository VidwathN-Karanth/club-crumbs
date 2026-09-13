'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckSquare, Download, RefreshCw, Trash2 } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { useLeader } from '../LeaderContext';

interface Member { email: string; name: string }

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** RFC-4180-ish CSV cell: quote and escape when needed. */
function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LeaderAttendancePage() {
  const { cohort } = useLeader();

  const [date, setDate] = useState(todayLocal());
  const [members, setMembers] = useState<Member[]>([]);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setNote('');
    try {
      const data = await readJson<{ members: Member[]; present: string[]; dates: string[] }>(
        await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&date=${date}`)
      );
      setMembers(data.members || []);
      setPresent(new Set((data.present || []).map((e) => e.toLowerCase())));
      setDates(data.dates || []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load attendance.'));
    } finally {
      setLoading(false);
    }
  }, [cohort, date]);

  useEffect(() => { load(); }, [load]);

  const toggle = (email: string) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email); else next.add(email);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setNote('');
    try {
      await readJson(await apiFetch('/api/leader/attendance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort, date, present: [...present] }),
      }));
      setNote('Saved.');
      setDates((d) => (d.includes(date) ? d : [date, ...d]));
    } catch (err) {
      setNote(errorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  const csvForDate = useMemo(() => () => {
    const header = ['Date', 'Name', 'Email', 'Present'].join(',');
    const rows = members.map((m) => [date, m.name, m.email, present.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
    return [header, ...rows].join('\n');
  }, [members, present, date]);

  const downloadDate = () => download(`attendance-${cohort.replace(/\s+/g, '_')}-${date}.csv`, csvForDate());

  const deleteDate = async () => {
    // Download first, then delete — never lose the record.
    download(`attendance-${cohort.replace(/\s+/g, '_')}-${date}.csv`, csvForDate());
    try {
      await readJson(await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&date=${date}`, { method: 'DELETE' }));
      setPresent(new Set());
      setDates((d) => d.filter((x) => x !== date));
      setNote('Downloaded and deleted this date.');
    } catch (err) {
      setError(errorMessage(err, 'Could not delete.'));
    }
  };

  const clearAll = async () => {
    setConfirmClear(false);
    try {
      // Pull every date, build one combined CSV, download, then delete all.
      const data = await readJson<{ members: Member[]; records: { date: string; present: string[] }[] }>(
        await apiFetch(`/api/leader/attendance/all?cohort=${encodeURIComponent(cohort)}`)
      );
      const header = ['Date', 'Name', 'Email', 'Present'].join(',');
      const rows: string[] = [];
      for (const rec of data.records) {
        const presentSet = new Set((rec.present || []).map((e) => e.toLowerCase()));
        for (const m of data.members) {
          rows.push([rec.date, m.name, m.email, presentSet.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
        }
      }
      download(`attendance-${cohort.replace(/\s+/g, '_')}-ALL.csv`, [header, ...rows].join('\n'));

      await readJson(await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&all=1`, { method: 'DELETE' }));
      setDates([]);
      setPresent(new Set());
      setNote('Downloaded everything and cleared all attendance.');
    } catch (err) {
      setError(errorMessage(err, 'Could not clear attendance.'));
    }
  };

  const presentCount = present.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5" /> Attendance</h1>
          <p className="text-xs text-white/40 mt-0.5">Tick who is present, save, and download as CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-[11px] font-mono text-white/50">
          <span>{members.length} members · {presentCount} present</span>
          {note && <span className="text-emerald-400">{note}</span>}
        </div>
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">No members in this club yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {members.map((m) => (
              <li key={m.email}>
                <label className="flex items-center gap-3 p-3.5 hover:bg-white/3 transition cursor-pointer">
                  <input type="checkbox" checked={present.has(m.email)} onChange={() => toggle(m.email)} className="w-4 h-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-bold text-white truncate">{m.name}</span>
                    <span className="block text-[10px] text-white/40 truncate">{m.email}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving || members.length === 0} className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40">
          {saving ? 'Saving…' : 'Save attendance'}
        </button>
        <button onClick={downloadDate} disabled={members.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:bg-white/5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40">
          <Download className="w-4 h-4" /> Download CSV
        </button>
        <button onClick={deleteDate} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold uppercase tracking-wider cursor-pointer">
          <Download className="w-4 h-4" /> Download &amp; delete this date
        </button>
        <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider cursor-pointer ml-auto">
          <Trash2 className="w-4 h-4" /> Download all &amp; clear
        </button>
      </div>

      {dates.length > 0 && (
        <p className="text-[10px] font-mono text-white/30">Recorded dates: {dates.join(' · ')}</p>
      )}

      {confirmClear && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setConfirmClear(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]">
            <h3 className="text-base font-black tracking-wider uppercase text-red-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Clear all attendance</h3>
            <p className="text-xs text-white/60 font-mono mt-3 leading-relaxed">
              This downloads <span className="text-white">every date</span> as one CSV, then <span className="text-red-400 font-semibold">permanently deletes</span> all stored attendance for {cohort}. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmClear(false)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
              <button onClick={clearAll} className="px-4 py-2 bg-red-950/45 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold cursor-pointer">DOWNLOAD &amp; CLEAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
