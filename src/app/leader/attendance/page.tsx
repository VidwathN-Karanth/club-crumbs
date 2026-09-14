'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckSquare, Download, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface Member { email: string; name: string }
interface Record { date: string; present: string[] }

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function LeaderAttendancePage() {
  const { cohort } = useLeader();

  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  // Take-attendance panel: only opened deliberately. Nothing is recorded until
  // it is saved — cancelling leaves the day with no attendance at all.
  const [taking, setTaking] = useState(false);
  const [takeDate, setTakeDate] = useState(todayLocal());
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const slug = cohort.replace(/\s+/g, '_');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ members: Member[]; records: Record[] }>(
        await apiFetch(`/api/leader/attendance/all?cohort=${encodeURIComponent(cohort)}`)
      );
      setMembers(data.members || []);
      setRecords((data.records || []).map((r) => ({ date: r.date, present: r.present || [] })));
    } catch (err) {
      setError(errorMessage(err, 'Could not load attendance.'));
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => { load(); }, [load]);

  const presentForDate = (date: string) =>
    new Set((records.find((r) => r.date === date)?.present || []).map((e) => e.toLowerCase()));

  const openTake = (date: string) => {
    setTakeDate(date);
    setPresent(presentForDate(date)); // prefill if editing an existing session
    setNote('');
    setTaking(true);
  };

  const changeTakeDate = (date: string) => {
    setTakeDate(date);
    setPresent(presentForDate(date));
  };

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
        body: JSON.stringify({ cohort, date: takeDate, present: [...present] }),
      }));
      setTaking(false);
      load();
    } catch (err) {
      setNote(errorMessage(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  };

  const csvForDate = (date: string) => {
    const set = presentForDate(date);
    const header = ['Date', 'Name', 'Email', 'Present'].join(',');
    const rows = members.map((m) => [date, m.name, m.email, set.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
    return [header, ...rows].join('\n');
  };

  const deleteDate = async (date: string) => {
    download(`attendance-${slug}-${date}.csv`, csvForDate(date)); // download before delete
    try {
      await readJson(await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&date=${date}`, { method: 'DELETE' }));
      setRecords((prev) => prev.filter((r) => r.date !== date));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete.'));
      load();
    }
  };

  const clearAll = async () => {
    setConfirmClear(false);
    const header = ['Date', 'Name', 'Email', 'Present'].join(',');
    const rows: string[] = [];
    for (const rec of records) {
      const set = new Set((rec.present || []).map((e) => e.toLowerCase()));
      for (const m of members) rows.push([rec.date, m.name, m.email, set.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
    }
    download(`attendance-${slug}-ALL.csv`, [header, ...rows].join('\n'));
    try {
      await readJson(await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&all=1`, { method: 'DELETE' }));
      setRecords([]);
    } catch (err) {
      setError(errorMessage(err, 'Could not clear attendance.'));
      load();
    }
  };

  /* ── Take-attendance view ─────────────────────────────────────────────── */
  if (taking) {
    return (
      <div className="space-y-6">
        <button onClick={() => setTaking(false)} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Back — nothing is saved until you press Save
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5" /> Take attendance</h1>
            <p className="text-xs text-white/40 mt-0.5">Tick who is present, then save.</p>
          </div>
          <input type="date" value={takeDate} onChange={(e) => changeTakeDate(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
        </div>

        <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-[11px] font-mono text-white/50">
            {members.length} members · {present.size} present
          </div>
          {members.length === 0 ? (
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

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving || members.length === 0} className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40">
            {saving ? 'Saving…' : 'Save attendance'}
          </button>
          <button onClick={() => setTaking(false)} className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer">Cancel</button>
          {note && <span className="text-[11px] font-mono text-rose-300">{note}</span>}
        </div>
      </div>
    );
  }

  /* ── Sessions list ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><CheckSquare className="w-5 h-5" /> Attendance</h1>
          <p className="text-xs text-white/40 mt-0.5">Recorded sessions. Attendance is only taken when you take it — there is no daily default.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openTake(todayLocal())} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">
            <Plus className="w-4 h-4" /> Take attendance
          </button>
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : records.length === 0 ? (
          <p className="p-10 text-center text-xs text-white/40 font-mono">No attendance taken yet. Press “Take attendance” when you hold a session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider">
                  <th className="p-4 font-normal">Date</th>
                  <th className="p-4 font-normal text-center">Present</th>
                  <th className="p-4 font-normal text-center">Absent</th>
                  <th className="p-4 font-normal text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => {
                  const p = (r.present || []).length;
                  return (
                    <tr key={r.date} className="hover:bg-white/3 transition">
                      <td className="p-4 font-bold text-white">{formatDate(r.date)}</td>
                      <td className="p-4 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">{p}</span></td>
                      <td className="p-4 text-center"><span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-bold">{Math.max(0, members.length - p)}</span></td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openTake(r.date)} className="px-2.5 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-[10px] font-mono font-bold uppercase transition cursor-pointer">Edit</button>
                          <button onClick={() => download(`attendance-${slug}-${r.date}.csv`, csvForDate(r.date))} title="Download CSV" className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition cursor-pointer"><Download className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteDate(r.date)} title="Download & delete" className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {records.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider cursor-pointer">
            <Trash2 className="w-4 h-4" /> Download all &amp; clear
          </button>
        </div>
      )}

      {confirmClear && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setConfirmClear(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div role="dialog" aria-modal="true" className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]">
            <h3 className="text-base font-black tracking-wider uppercase text-red-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Clear all attendance</h3>
            <p className="text-xs text-white/60 font-mono mt-3 leading-relaxed">
              This downloads every session as one CSV, then <span className="text-red-400 font-semibold">permanently deletes</span> all stored attendance for {cohort}. This cannot be undone.
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
