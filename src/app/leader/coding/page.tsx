'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Code2, ExternalLink, Plus, Trash2, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface CodingEvent {
  id: string;
  name: string;
  competition_date: string | null;
  start_time: string | null;
  end_time: string | null;
  registration_start: string | null;
  unstop_link: string;
}

const EMPTY = { name: '', competition_date: '', start_time: '', end_time: '', registration_start: '', unstop_link: '' };

export default function LeaderCodingPage() {
  const { cohort } = useLeader();

  const [events, setEvents] = useState<CodingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<CodingEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ events: CodingEvent[] }>(
        await apiFetch(`/api/coding/events?cohort=${encodeURIComponent(cohort)}`)
      );
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load coding events.'));
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name.trim() || !form.unstop_link.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      await readJson(await apiFetch('/api/coding/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohort,
          name: form.name.trim(),
          competition_date: form.competition_date || null,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          registration_start: form.registration_start ? new Date(form.registration_start).toISOString() : null,
          unstop_link: form.unstop_link.trim(),
        }),
      }));
      setCreating(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create the event.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev: CodingEvent) => {
    setConfirmDelete(null);
    try {
      await readJson(await apiFetch(`/api/coding/events/${ev.id}`, { method: 'DELETE' }));
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the event.'));
      load();
    }
  };

  const input = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5" /> Coding competitions
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Post Unstop competitions — members register straight from the card.</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setFormError(''); setCreating(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New competition
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-white/40 font-mono">Loading…</p>
      ) : error ? (
        <p className="text-xs text-rose-400 font-mono">{error}</p>
      ) : events.length === 0 ? (
        <div className="glass-panel border border-white/10 rounded-2xl p-10 text-center text-xs text-white/40 font-mono">No competitions yet. Add one.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((ev) => (
            <div key={ev.id} className="glass-panel border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-white leading-snug">{ev.name}</h3>
                <button onClick={() => setConfirmDelete(ev)} className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/50 hover:text-rose-400 transition cursor-pointer shrink-0" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[11px] text-white/50 font-mono space-y-1">
                {ev.competition_date && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(ev.competition_date)}{ev.start_time ? ` · ${ev.start_time}` : ''}{ev.end_time ? `–${ev.end_time}` : ''}</div>}
                {ev.registration_start && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Reg. opens {formatDateTime(new Date(ev.registration_start))}</div>}
              </div>
              <a href={ev.unstop_link} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center gap-1.5 text-[11px] text-cyber-blue hover:underline truncate">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {ev.unstop_link}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setCreating(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">New competition</h3>
                <button onClick={() => setCreating(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40">Name</label>
                  <input className={`${input} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CodeSprint 2026" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">Competition date</label>
                    <input type="date" className={`${input} mt-1`} value={form.competition_date} onChange={(e) => setForm({ ...form, competition_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">Registration opens</label>
                    <input type="datetime-local" className={`${input} mt-1`} value={form.registration_start} onChange={(e) => setForm({ ...form, registration_start: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">Start time</label>
                    <input type="time" className={`${input} mt-1`} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40">End time</label>
                    <input type="time" className={`${input} mt-1`} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-white/40">Unstop link</label>
                  <input className={`${input} mt-1`} value={form.unstop_link} onChange={(e) => setForm({ ...form, unstop_link: e.target.value })} placeholder="https://unstop.com/..." />
                </div>
                {formError && <p className="text-[11px] text-rose-300 font-mono">{formError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setCreating(false)} disabled={saving} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">CANCEL</button>
                <button onClick={create} disabled={saving || !form.name.trim() || !form.unstop_link.trim()} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">{saving ? 'CREATING…' : 'CREATE'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDelete(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} role="dialog" aria-modal="true" className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]">
              <h3 className="text-base font-black tracking-wider uppercase text-red-400 flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete competition</h3>
              <p className="text-xs text-white/60 font-mono mt-3">This permanently removes <span className="text-red-400 font-semibold">{confirmDelete.name}</span> and its card. This cannot be undone.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer">CANCEL</button>
                <button onClick={() => remove(confirmDelete)} className="px-4 py-2 bg-red-950/45 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold cursor-pointer">DELETE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
