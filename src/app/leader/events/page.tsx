'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate } from '@/lib/dateFormat';
import { useLeader } from '../LeaderContext';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  audience: string;
  creatorName: string | null;
}

export default function LeaderEventsPage() {
  const { cohort } = useLeader();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ events: EventRow[] }>(
        await apiFetch(`/api/leader/events?cohort=${encodeURIComponent(cohort)}`)
      );
      const list = Array.isArray(data.events) ? data.events : [];
      list.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
      setEvents(list);
    } catch (err) {
      setError(errorMessage(err, 'Could not load events.'));
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    setFormError('');
    try {
      await readJson(await apiFetch('/api/leader/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohort, title: title.trim(), description: description.trim(), eventDate: date }),
      }));
      setCreating(false); setTitle(''); setDescription(''); setDate('');
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create the event.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev: EventRow) => {
    try {
      await readJson(await apiFetch(`/api/leader/events?id=${encodeURIComponent(ev.id)}`, { method: 'DELETE' }));
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
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><CalendarDays className="w-5 h-5" /> {cohort} events</h1>
          <p className="text-xs text-white/40 mt-0.5">Post events every member of your club will see on their calendar.</p>
        </div>
        <button onClick={() => { setTitle(''); setDescription(''); setDate(''); setFormError(''); setCreating(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer">
          <Plus className="w-4 h-4" /> New event
        </button>
      </div>

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-xs text-rose-400 font-mono">{error}</p>
        ) : events.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">No events yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {events.map((ev) => {
              const isOwn = ev.audience === cohort;
              return (
                <li key={ev.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{ev.title}</span>
                      {!isOwn && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-white/5 text-white/50 border border-white/10 shrink-0">Dept</span>}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">{formatDate(ev.eventDate)}{ev.description ? ` · ${ev.description}` : ''}</div>
                  </div>
                  {isOwn && (
                    <button onClick={() => remove(ev)} className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/50 hover:text-rose-400 transition cursor-pointer shrink-0" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setCreating(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">New event</h3>
                <button onClick={() => setCreating(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-white/40">Title</label>
                <input className={`${input} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Club meetup" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-white/40">Date</label>
                <input type="date" className={`${input} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-white/40">Details (optional)</label>
                <textarea className={`${input} mt-1 resize-y`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {formError && <p className="text-[11px] text-rose-300 font-mono">{formError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setCreating(false)} disabled={saving} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">CANCEL</button>
                <button onClick={create} disabled={saving || !title.trim() || !date} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">{saving ? 'POSTING…' : 'POST'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
