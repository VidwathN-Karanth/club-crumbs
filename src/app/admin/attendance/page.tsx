'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckSquare, Download, Eye, RefreshCw, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { useAdmin } from '../AdminContext';
import { PanelEmpty, PanelError, PanelLoading, SectionHeader } from '../_components/PanelState';
import { useSectionData } from '../_components/useSectionData';

interface Member { email: string; name: string }
interface Record { date: string; present: string[]; marked_by: string | null; updated_at: string | null }

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

export default function AdminAttendancePage() {
  const { selectedCohort } = useAdmin();

  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDate, setOpenDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setOpenDate(null);
    try {
      const data = await readJson<{ members: Member[]; records: Record[] }>(
        await apiFetch(`/api/admin/attendance?cohort=${encodeURIComponent(selectedCohort)}`)
      );
      setMembers(data.members || []);
      setRecords(data.records || []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load attendance.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCohort]);

  useSectionData(load);

  const total = members.length;
  const presentSetFor = (date: string) =>
    new Set((records.find((r) => r.date === date)?.present || []).map((e) => e.toLowerCase()));

  const csvForDate = (date: string) => {
    const present = presentSetFor(date);
    const header = ['Date', 'Name', 'Email', 'Present'].join(',');
    const rows = members.map((m) => [date, m.name, m.email, present.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
    return [header, ...rows].join('\n');
  };
  const downloadDate = (date: string) =>
    download(`attendance-${selectedCohort.replace(/\s+/g, '_')}-${date}.csv`, csvForDate(date));

  const downloadAll = () => {
    const header = ['Date', 'Name', 'Email', 'Present'].join(',');
    const rows: string[] = [];
    for (const rec of records) {
      const present = new Set((rec.present || []).map((e) => e.toLowerCase()));
      for (const m of members) rows.push([rec.date, m.name, m.email, present.has(m.email) ? 'Yes' : 'No'].map(cell).join(','));
    }
    download(`attendance-${selectedCohort.replace(/\s+/g, '_')}-ALL.csv`, [header, ...rows].join('\n'));
  };

  const openRecord = openDate ? presentSetFor(openDate) : null;
  const sortedMembers = useMemo(() => [...members].sort((a, b) => a.name.localeCompare(b.name)), [members]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CheckSquare}
        title="Attendance"
        subtitle={`Sessions the ${selectedCohort} leaders recorded. Only days attendance was taken appear.`}
      >
        {records.length > 0 && (
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyber-blue text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
          >
            <Download className="w-3 h-3" /> Export all
          </button>
        )}
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyber-blue text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
        </button>
      </SectionHeader>

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
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
                  <th className="p-4 font-normal text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => {
                  const present = (r.present || []).length;
                  return (
                    <tr key={r.date} className="hover:bg-white/3 transition">
                      <td className="p-4 font-bold text-white">{formatDate(r.date)}</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">{present}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-bold">{Math.max(0, total - present)}</span>
                      </td>
                      <td className="p-4 text-white/60 truncate max-w-[180px]">{r.marked_by || '—'}</td>
                      <td className="p-4 text-white/50">{r.updated_at ? formatDateTime(new Date(r.updated_at)) : '—'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setOpenDate(r.date)} title="View" className="p-1.5 rounded-lg border border-white/10 hover:border-cyber-blue text-white/60 hover:text-cyber-blue transition cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => downloadDate(r.date)} title="Download CSV" className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition cursor-pointer">
                            <Download className="w-3.5 h-3.5" />
                          </button>
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

      {/* Drill-in: who was present/absent on a date */}
      <AnimatePresence>
        {openDate && openRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenDate(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-screen bg-[#1A1D22]/95 border-l border-white/10 flex flex-col z-10 shadow-2xl">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">{formatDate(openDate)}</h3>
                  <p className="text-[10px] text-white/40 font-mono">{openRecord.size} present · {Math.max(0, total - openRecord.size)} absent</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadDate(openDate)} title="Download CSV" className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition cursor-pointer"><Download className="w-4 h-4" /></button>
                  <button onClick={() => setOpenDate(null)} aria-label="Close" className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {sortedMembers.map((m) => {
                  const here = openRecord.has(m.email);
                  return (
                    <div key={m.email} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{m.name}</div>
                        <div className="text-[10px] text-white/40 truncate">{m.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${here ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                        {here ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
