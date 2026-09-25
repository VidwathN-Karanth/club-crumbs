'use client';

import { useCallback, useState } from 'react';
import { CalendarDays, Check, CheckSquare, Clock, Eye, RefreshCw } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime, formatLongDate } from '@/lib/dateFormat';
import {
  counts,
  downloadClubsDay,
  downloadDay,
  downloadHistory,
  isValidDateKey,
  todayKey,
  type AttendanceRecord,
} from '@/lib/attendance';
import { ExportButtons, RegisterDrawer } from '@/components/attendance/AttendanceUI';
import { useAdmin } from '../AdminContext';
import { PanelEmpty, PanelError, PanelLoading, SectionHeader } from '../_components/PanelState';
import { useSectionData } from '../_components/useSectionData';

interface ClubDay { cohort: string; memberCount: number; record: AttendanceRecord | null }

export default function AdminAttendancePage() {
  const { selectedCohort } = useAdmin();
  const [viewing, setViewing] = useState<AttendanceRecord | null>(null);

  /* ── Daily overview: all clubs, one date ─────────────────────────────── */
  const [day, setDay] = useState(todayKey());
  const [clubs, setClubs] = useState<ClubDay[]>([]);
  const [dayLoading, setDayLoading] = useState(true);
  const [dayError, setDayError] = useState('');

  const loadDay = useCallback(async (date: string) => {
    setDayLoading(true);
    setDayError('');
    try {
      const data = await readJson<{ clubs: ClubDay[] }>(await apiFetch(`/api/admin/attendance/day?date=${date}`));
      setClubs(data.clubs || []);
    } catch (err) {
      setDayError(errorMessage(err, 'Could not load the daily overview.'));
    } finally {
      setDayLoading(false);
    }
  }, []);

  const loadSelectedDay = useCallback(() => loadDay(day), [day, loadDay]);
  useSectionData(loadSelectedDay);

  /* ── One club's full history ─────────────────────────────────────────── */
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ records: AttendanceRecord[] }>(
        await apiFetch(`/api/admin/attendance?cohort=${encodeURIComponent(selectedCohort)}`)
      );
      setRecords(data.records || []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load attendance.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCohort]);

  useSectionData(load);

  const reloadAll = () => { loadDay(day); load(); };
  const takenCount = clubs.filter((c) => c.record).length;

  return (
    <div className="space-y-6">
      <SectionHeader icon={CheckSquare} title="Attendance" subtitle="Registers the club leaders have saved. Only days attendance was taken appear.">
        <button
          onClick={reloadAll}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyber-blue text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
        >
          <RefreshCw className={`w-3 h-3 ${dayLoading || loading ? 'animate-spin' : ''}`} /> Reload
        </button>
      </SectionHeader>

      {/* Daily overview */}
      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2"><CalendarDays className="w-4 h-4" /> All clubs · {formatLongDate(day)}</h2>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">
              {dayLoading ? 'Checking…' : `${takenCount} of ${clubs.length} clubs have taken attendance.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={day}
              max={todayKey()}
              onChange={(e) => isValidDateKey(e.target.value) && setDay(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
            />
            {day !== todayKey() && (
              <button onClick={() => setDay(todayKey())} className="px-3 py-1.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer">Today</button>
            )}
            {takenCount > 0 && <ExportButtons label="Day" onExport={(f) => downloadClubsDay(day, clubs, f)} />}
          </div>
        </div>

        {dayLoading ? (
          <PanelLoading message="Loading the day…" />
        ) : dayError ? (
          <PanelError message={dayError} onRetry={() => loadDay(day)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {clubs.map(({ cohort, memberCount, record }) => {
              const c = record ? counts(record) : null;
              const pct = c && c.total ? Math.round((c.present / c.total) * 100) : 0;
              return (
                <div key={cohort} className="bg-[#16181C] p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{cohort}</h3>
                    {record ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"><Check className="w-3 h-3" /> Taken</span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/25"><Clock className="w-3 h-3" /> Not taken</span>
                    )}
                  </div>

                  {record && c ? (
                    <>
                      <div className="flex items-end gap-4">
                        <div><div className="text-2xl font-black text-emerald-400 leading-none">{c.present}</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-1">Present</div></div>
                        <div><div className="text-2xl font-black text-rose-300 leading-none">{c.absent}</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-1">Absent</div></div>
                        <div className="ml-auto text-right"><div className="text-sm font-bold text-white/80 leading-none">{pct}%</div><div className="text-[9px] uppercase tracking-wider text-white/40 mt-1">of {c.total}</div></div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-emerald-500/60" style={{ width: `${pct}%` }} /></div>
                      <p className="text-[10px] text-white/40 font-mono truncate" title={record.marked_by || ''}>
                        {record.marked_by || '—'} · {formatDateTime(new Date(record.updated_at))}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => setViewing(record)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:border-cyber-blue text-white/60 hover:text-cyber-blue text-[10px] font-bold uppercase transition cursor-pointer">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <ExportButtons compact onExport={(f) => downloadDay(record, f)} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-white/40">
                      {memberCount === 0 ? 'No members in this club yet.' : `${memberCount} members — waiting for a leader to save the register.`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* One club's history */}
      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-white">{selectedCohort} · every session</h2>
            <p className="text-[10px] text-white/40 font-mono mt-0.5">Switch club from the selector at the top of the console.</p>
          </div>
          {records.length > 0 && <ExportButtons label="All dates" onExport={(f) => downloadHistory(selectedCohort, records, f)} />}
        </div>
        {loading ? (
          <PanelLoading message="Loading attendance…" />
        ) : error ? (
          <PanelError message={error} onRetry={load} />
        ) : records.length === 0 ? (
          <PanelEmpty>No attendance has been taken for {selectedCohort} yet.</PanelEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider">
                  <th className="p-4 font-normal">Date</th>
                  <th className="p-4 font-normal text-center">Present</th>
                  <th className="p-4 font-normal text-center">Absent</th>
                  <th className="p-4 font-normal">Recorded by</th>
                  <th className="p-4 font-normal">Updated</th>
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
                      <td className="p-4 text-white/60 truncate max-w-[180px]">{r.marked_by || '—'}</td>
                      <td className="p-4 text-white/50 whitespace-nowrap">{formatDateTime(new Date(r.updated_at))}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewing(r)} title="View" className="p-1.5 rounded-lg border border-white/10 hover:border-cyber-blue text-white/60 hover:text-cyber-blue transition cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <ExportButtons compact onExport={(f) => downloadDay(r, f)} />
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

      <RegisterDrawer record={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
