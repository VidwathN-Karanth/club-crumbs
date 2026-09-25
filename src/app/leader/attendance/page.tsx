'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CheckSquare, Eye, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';

import { ApiError, apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import {
  byName,
  counts,
  downloadDay,
  downloadHistory,
  isValidDateKey,
  todayKey,
  type AttendanceRecord,
  type RosterEntry,
} from '@/lib/attendance';
import { ConfirmDialog, ExportButtons, RegisterDrawer } from '@/components/attendance/AttendanceUI';
import { useSectionData } from '@/app/admin/_components/useSectionData';
import { useLeader } from '../LeaderContext';

type Mark = 'P' | 'A';

export default function LeaderAttendancePage() {
  const { cohort } = useLeader();

  const [members, setMembers] = useState<RosterEntry[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [viewing, setViewing] = useState<AttendanceRecord | null>(null);
  const [deleting, setDeleting] = useState<AttendanceRecord | 'all' | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Take-attendance state. Nothing is stored until Save succeeds.
  const [taking, setTaking] = useState(false);
  const [takeDate, setTakeDate] = useState(todayKey());
  const [base, setBase] = useState<AttendanceRecord | null>(null); // the saved version being edited
  const [sheet, setSheet] = useState<RosterEntry[]>([]);
  const [marks, setMarks] = useState<Map<string, Mark>>(new Map());
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ message: string; conflict: boolean } | null>(null);

  const load = useCallback(async (): Promise<AttendanceRecord[] | null> => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ members: RosterEntry[]; records: AttendanceRecord[] }>(
        await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}`)
      );
      setMembers(data.members || []);
      setRecords(data.records || []);
      return data.records || [];
    } catch (err) {
      setError(errorMessage(err, 'Could not load attendance.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  const loadOnMount = useCallback(async () => { await load(); }, [load]);
  useSectionData(loadOnMount);

  // Warn before closing the tab with unsaved marks.
  useEffect(() => {
    if (!taking || !dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [taking, dirty]);

  const today = todayKey();
  const todayRecord = records.find((r) => r.date === today) || null;

  /** Loads a date into the sheet: its saved register (plus anyone who joined since), or today's members unmarked. */
  const loadSheet = (date: string, from: AttendanceRecord[]) => {
    const existing = from.find((r) => r.date === date) || null;
    const people = new Map<string, RosterEntry>();
    for (const m of existing?.roster || []) people.set(m.email, m);
    for (const m of members) if (!people.has(m.email)) people.set(m.email, m);
    const next = new Map<string, Mark>();
    if (existing) for (const m of existing.roster) next.set(m.email, existing.present.includes(m.email) ? 'P' : 'A');
    setTakeDate(date);
    setBase(existing);
    setSheet([...people.values()].sort(byName));
    setMarks(next);
    setDirty(false);
    setQuery('');
    setSaveError(null);
  };

  const openTake = (date: string) => {
    setFlash('');
    loadSheet(date, records);
    setTaking(true);
  };

  const leaveTake = () => {
    if (dirty && !window.confirm('Discard the attendance you have not saved?')) return;
    setTaking(false);
    setDirty(false);
  };

  const changeDate = (date: string) => {
    if (!isValidDateKey(date) || date > today) return;
    if (dirty && !window.confirm('Switch date? The marks you have not saved will be lost.')) return;
    loadSheet(date, records);
  };

  const setMark = (email: string, mark: Mark) => {
    setMarks((prev) => new Map(prev).set(email, mark));
    setDirty(true);
    setSaveError(null);
  };
  const cycle = (email: string) => setMark(email, marks.get(email) === 'P' ? 'A' : 'P');
  const markAll = (mark: Mark, onlyUnmarked = false) => {
    setMarks((prev) => {
      const next = new Map(prev);
      for (const m of sheet) if (!onlyUnmarked || !next.has(m.email)) next.set(m.email, mark);
      return next;
    });
    setDirty(true);
    setSaveError(null);
  };
  const clearMarks = () => { setMarks(new Map()); setDirty(true); };

  const tally = useMemo(() => {
    let p = 0;
    let a = 0;
    for (const m of sheet) {
      const v = marks.get(m.email);
      if (v === 'P') p++;
      else if (v === 'A') a++;
    }
    return { present: p, absent: a, unmarked: sheet.length - p - a };
  }, [sheet, marks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sheet.filter((m) => m.name.toLowerCase().includes(q) || m.email.includes(q)) : sheet;
  }, [sheet, query]);

  const save = async () => {
    if (tally.unmarked > 0 || sheet.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const present = sheet.filter((m) => marks.get(m.email) === 'P').map((m) => m.email);
      const absent = sheet.filter((m) => marks.get(m.email) === 'A').map((m) => m.email);
      const res = await readJson<{ record: AttendanceRecord }>(await apiFetch('/api/leader/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort, date: takeDate, present, absent, expectedUpdatedAt: base?.updated_at ?? null }),
      }));
      setRecords((prev) => [res.record, ...prev.filter((r) => r.date !== res.record.date)].sort((a, b) => b.date.localeCompare(a.date)));
      setDirty(false);
      setTaking(false);
      setFlash(`Saved ${formatDate(takeDate)}: ${present.length} present, ${absent.length} absent.`);
    } catch (err) {
      setSaveError({ message: errorMessage(err, 'Could not save. Your marks are still here — try again.'), conflict: err instanceof ApiError && err.status === 409 });
    } finally {
      setSaving(false);
    }
  };

  const reloadAfterConflict = async () => {
    const fresh = await load();
    if (fresh) loadSheet(takeDate, fresh);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      // Always keep a copy before anything is removed.
      if (deleting === 'all') await downloadHistory(cohort, records, 'xlsx');
      else await downloadDay(deleting, 'xlsx');
      const qs = deleting === 'all' ? 'all=1' : `date=${deleting.date}`;
      await readJson(await apiFetch(`/api/leader/attendance?cohort=${encodeURIComponent(cohort)}&${qs}`, { method: 'DELETE' }));
      setRecords((prev) => (deleting === 'all' ? [] : prev.filter((r) => r.date !== deleting.date)));
      setFlash(deleting === 'all' ? 'All attendance cleared. A copy was downloaded.' : `Deleted ${formatDate(deleting.date)}. A copy was downloaded.`);
      setDeleting(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete. Nothing was removed.'));
      setDeleting(null);
      load();
    } finally {
      setDeleteBusy(false);
    }
  };

  /* ── Take-attendance view ─────────────────────────────────────────────── */
  if (taking) {
    return (
      <div className="space-y-5 pb-28">
        <button onClick={leaveTake} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sessions
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5" /> {base ? 'Edit attendance' : 'Take attendance'}
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Tap a member to mark them present; tap again for absent. Everyone must be marked before you can save.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">
            Date
            <input
              type="date"
              value={takeDate}
              max={today}
              onChange={(e) => changeDate(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 normal-case tracking-normal font-normal"
            />
          </label>
        </div>

        {base && (
          <p className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            Attendance for {formatDate(takeDate)} was already saved by {base.marked_by || 'a leader'} at {formatDateTime(new Date(base.updated_at))}. You are editing it.
          </p>
        )}

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${sheet.length} members by name or email`}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => markAll('P')} className="px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider cursor-pointer">All present</button>
            <button onClick={() => markAll('A')} className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-wider cursor-pointer">All absent</button>
            <button onClick={() => markAll('A', true)} disabled={tally.unmarked === 0} className="px-3 py-2 rounded-xl border border-white/15 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-30">Rest absent</button>
            <button onClick={clearMarks} disabled={marks.size === 0} className="px-3 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-30">Clear</button>
          </div>
        </div>

        <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
          {sheet.length === 0 ? (
            <p className="p-8 text-center text-xs text-white/40 font-mono">No members in this club yet. Add members first, then take attendance.</p>
          ) : visible.length === 0 ? (
            <p className="p-8 text-center text-xs text-white/40 font-mono">No member matches “{query}”.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {visible.map((m, i) => {
                const mark = marks.get(m.email);
                const tone = mark === 'P' ? 'bg-emerald-500/[0.07]' : mark === 'A' ? 'bg-rose-500/[0.06]' : '';
                return (
                  <li key={m.email} className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 transition ${tone}`}>
                    <button
                      type="button"
                      onClick={() => cycle(m.email)}
                      aria-label={`${m.name}: ${mark === 'P' ? 'present' : mark === 'A' ? 'absent' : 'not marked'}. Tap to change.`}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <span className="w-7 text-right text-[10px] font-mono text-white/30 shrink-0">{i + 1}</span>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        mark === 'P' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : mark === 'A' ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                          : 'border-white/15 text-white/20'
                      }`}>
                        {mark === 'P' ? <Check className="w-4 h-4" /> : mark === 'A' ? <X className="w-4 h-4" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold text-white truncate text-sm">{m.name}</span>
                        <span className="block text-[10px] text-white/40 truncate">{m.email}</span>
                      </span>
                    </button>
                    <div className="flex shrink-0 rounded-lg overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setMark(m.email, 'P')}
                        aria-pressed={mark === 'P'}
                        className={`px-3 py-1.5 text-[11px] font-bold cursor-pointer transition ${mark === 'P' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/50 hover:text-white'}`}
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => setMark(m.email, 'A')}
                        aria-pressed={mark === 'A'}
                        className={`px-3 py-1.5 text-[11px] font-bold cursor-pointer transition border-l border-white/10 ${mark === 'A' ? 'bg-rose-500/30 text-rose-200' : 'text-white/50 hover:text-white'}`}
                      >
                        A
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[#16181C]/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-bold">{tally.present} present</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 font-bold">{tally.absent} absent</span>
              <span className={`px-2 py-0.5 rounded border font-bold ${tally.unmarked ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-white/5 text-white/40 border-white/10'}`}>
                {tally.unmarked} not marked
              </span>
            </div>
            <div className="flex-1 min-w-0 text-[11px] font-mono">
              {saveError ? (
                <span className="text-rose-300">
                  {saveError.message}{' '}
                  {saveError.conflict && (
                    <button onClick={reloadAfterConflict} className="underline cursor-pointer text-white">Reload</button>
                  )}
                </span>
              ) : tally.unmarked > 0 && sheet.length > 0 ? (
                <span className="text-white/40">Mark the remaining {tally.unmarked} to save — or use “Rest absent”.</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={leaveTake} className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer">Cancel</button>
              <button
                onClick={save}
                disabled={saving || tally.unmarked > 0 || sheet.length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : base ? 'Save changes' : 'Save attendance'}
              </button>
            </div>
          </div>
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
          <p className="text-xs text-white/40 mt-0.5">Saved registers are kept until you delete them. Admins see them as soon as you save.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openTake(today)} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40">
            <Plus className="w-4 h-4" /> {todayRecord ? "Edit today's" : "Take today's"}
          </button>
          <button onClick={() => load()} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>
        </div>
      </div>

      {flash && (
        <p className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> {flash}
        </p>
      )}
      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      {!loading && (
        <div className={`rounded-2xl border px-4 py-3 text-xs flex items-center justify-between gap-3 ${todayRecord ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-amber-500/25 bg-amber-500/[0.06]'}`}>
          <span className={todayRecord ? 'text-emerald-300' : 'text-amber-300'}>
            {todayRecord
              ? `Today's attendance is saved — ${counts(todayRecord).present} of ${counts(todayRecord).total} present.`
              : "Today's attendance has not been taken yet."}
          </span>
          <span className="text-[10px] text-white/40 shrink-0 hidden sm:inline">Missed a day? Change the date on the take screen.</span>
        </div>
      )}

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : records.length === 0 ? (
          <p className="p-10 text-center text-xs text-white/40 font-mono">No attendance taken yet. Press “Take today&rsquo;s” when you hold a session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider">
                  <th className="p-4 font-normal">Date</th>
                  <th className="p-4 font-normal text-center">Present</th>
                  <th className="p-4 font-normal text-center">Absent</th>
                  <th className="p-4 font-normal">Last saved</th>
                  <th className="p-4 font-normal text-center">Download</th>
                  <th className="p-4 font-normal text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => {
                  const c = counts(r);
                  return (
                    <tr key={r.date} className="hover:bg-white/3 transition">
                      <td className="p-4 font-bold text-white whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="p-4 text-center"><span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">{c.present}</span></td>
                      <td className="p-4 text-center"><span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 font-bold">{c.absent}</span></td>
                      <td className="p-4 text-white/50 whitespace-nowrap">
                        <span className="block truncate max-w-[200px]">{r.marked_by || '—'}</span>
                        <span className="block text-[10px] text-white/30">{formatDateTime(new Date(r.updated_at))}</span>
                      </td>
                      <td className="p-4 text-center"><ExportButtons compact onExport={(f) => downloadDay(r, f)} /></td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewing(r)} title="View" className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openTake(r.date)} className="px-2.5 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 text-[10px] font-mono font-bold uppercase transition cursor-pointer">Edit</button>
                          <button onClick={() => setDeleting(r)} title="Delete" className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-rose-400 hover:border-rose-400 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <ExportButtons label="All dates" onExport={(f) => downloadHistory(cohort, records, f)} />
          <button onClick={() => setDeleting('all')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider cursor-pointer">
            <Trash2 className="w-4 h-4" /> Download all &amp; clear
          </button>
        </div>
      )}

      <RegisterDrawer record={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={deleting !== null}
        title={deleting === 'all' ? 'Clear all attendance' : 'Delete attendance'}
        confirmLabel="DOWNLOAD & DELETE"
        busy={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      >
        {deleting === 'all' ? (
          <>A copy of every date is downloaded as XLSX, then <span className="text-red-400 font-semibold">all {records.length} saved registers</span> for {cohort} are permanently deleted — admins lose them too. This cannot be undone.</>
        ) : deleting ? (
          <>A copy of {formatDate(deleting.date)} is downloaded as XLSX, then that register is <span className="text-red-400 font-semibold">permanently deleted</span> for you and the admins. This cannot be undone.</>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
