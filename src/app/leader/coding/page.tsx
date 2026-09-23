'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, Code2, ExternalLink, Plus, Trash2, Trophy, X } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { tournamentFor } from '@/lib/cohorts';
import { pointsConfig } from '@/lib/points';
import { useLeader } from '../LeaderContext';

interface CodingEvent {
  id: string;
  name: string;
  competition_date: string | null;
  start_time: string | null;
  end_time: string | null;
  registration_start: string | null;
  link: string;
  platform: string | null;
  results?: { place: number; email: string; name: string }[];
}

interface Member { email: string; name: string }

const PLACES = [1, 2, 3] as const;
const PLACE_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
/** How a member shows in the search box; the email in brackets is the key. */
const memberLabel = (m: Member) => `${m.name} (${m.email})`;

const EMPTY = { name: '', competition_date: '', start_time: '', end_time: '', registration_start: '', link: '' };

type Platform = 'unstop' | 'hackerrank' | 'generic';

/** Per-platform copy + host guard for the shared create modal. */
const PLATFORM_META: Record<Platform, { title: string; linkLabel: string; placeholder: string; host?: string }> = {
  unstop: { title: 'New Unstop event', linkLabel: 'Unstop link', placeholder: 'https://unstop.com/...', host: 'unstop.com' },
  hackerrank: { title: 'New HackerRank contest', linkLabel: 'HackerRank link', placeholder: 'https://www.hackerrank.com/contests/...', host: 'hackerrank.com' },
  generic: { title: 'New competition', linkLabel: 'Link', placeholder: 'https://...' },
};

export default function LeaderCodingPage() {
  const { cohort } = useLeader();
  const config = tournamentFor(cohort);
  const section = config?.section ?? 'Tournaments';
  const linkLabel = config?.linkLabel ?? 'Link';
  const linkPlaceholder = config?.linkPlaceholder ?? 'https://...';

  const [events, setEvents] = useState<CodingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [platform, setPlatform] = useState<Platform>('generic');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<CodingEvent | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [resultsFor, setResultsFor] = useState<CodingEvent | null>(null);
  // One search box per place, holding what the leader typed/picked.
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [resultsError, setResultsError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ events: CodingEvent[]; members?: Member[] }>(
        await apiFetch(`/api/coding/events?cohort=${encodeURIComponent(cohort)}`)
      );
      setEvents(Array.isArray(data.events) ? data.events : []);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load coding events.'));
    } finally {
      setLoading(false);
    }
  }, [cohort]);

  useEffect(() => { load(); }, [load]);

  const meta = platform === 'generic'
    ? { title: 'New competition', linkLabel, placeholder: linkPlaceholder, host: undefined as string | undefined }
    : PLATFORM_META[platform];

  const openCreate = (p: Platform) => { setPlatform(p); setForm(EMPTY); setFormError(''); setCreating(true); };

  const create = async () => {
    if (!form.name.trim() || !form.link.trim()) return;
    const link = form.link.trim();
    if (meta.host) {
      try {
        if (!new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`).hostname.endsWith(meta.host)) {
          setFormError(`That does not look like a ${meta.host} link.`);
          return;
        }
      } catch {
        setFormError('That does not look like a valid link.');
        return;
      }
    }
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
          link,
          platform: platform === 'generic' ? null : platform,
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

  const openResults = (ev: CodingEvent) => {
    const initial: Record<number, string> = {};
    for (const r of ev.results || []) initial[r.place] = memberLabel(r);
    setPicks(initial);
    setResultsError('');
    setResultsFor(ev);
  };

  /** Accepts a picked "Name (email)", a bare email, or an exact name. */
  const resolvePick = (text: string): Member | null => {
    const t = text.trim().toLowerCase();
    if (!t) return null;
    return members.find((m) => memberLabel(m).toLowerCase() === t || m.email === t || m.name.toLowerCase() === t) || null;
  };

  const saveResults = async () => {
    if (!resultsFor) return;
    const results: { place: number; email: string }[] = [];
    for (const place of PLACES) {
      const text = picks[place] || '';
      if (!text.trim()) continue;
      const m = resolvePick(text);
      if (!m) { setResultsError(`${PLACE_LABEL[place]} place: pick a member from the list.`); return; }
      results.push({ place, email: m.email });
    }
    setSavingResults(true);
    setResultsError('');
    try {
      const { event } = await readJson<{ event: CodingEvent }>(await apiFetch(`/api/coding/events/${resultsFor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      }));
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, results: event.results } : e)));
      setResultsFor(null);
    } catch (err) {
      setResultsError(errorMessage(err, 'Could not save the results.'));
    } finally {
      setSavingResults(false);
    }
  };

  const input = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5" /> {section} competitions
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Post competitions — members open them straight from the card, and they appear on the club calendar.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openCreate('unstop')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Unstop
          </button>
          <button
            onClick={() => openCreate('hackerrank')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> HackerRank
          </button>
          <button
            onClick={() => openCreate('generic')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Other
          </button>
        </div>
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
                <h3 className="font-bold text-white leading-snug">
                  {ev.name}
                  {ev.platform && (
                    <span className="ml-2 align-middle text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/15 text-white/60">{ev.platform}</span>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openResults(ev)} className="p-1.5 rounded-lg border border-white/10 hover:border-amber-400 text-white/50 hover:text-amber-400 transition cursor-pointer" title="Results (1st / 2nd / 3rd)">
                    <Trophy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(ev)} className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/50 hover:text-rose-400 transition cursor-pointer" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-white/50 font-mono space-y-1">
                {ev.competition_date && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(ev.competition_date)}{ev.start_time ? ` · ${ev.start_time}` : ''}{ev.end_time ? `–${ev.end_time}` : ''}</div>}
                {ev.registration_start && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Reg. opens {formatDateTime(new Date(ev.registration_start))}</div>}
              </div>
              {ev.results && ev.results.length > 0 && (
                <div className="text-[11px] font-mono space-y-0.5">
                  {ev.results.map((r) => (
                    <div key={r.place} className="flex items-center gap-1.5 text-amber-300/90">
                      <Trophy className="w-3 h-3" /> {PLACE_LABEL[r.place]} · {r.name}
                      <span className="text-white/30">+{pointsConfig.eventPlaces[r.place]}</span>
                    </div>
                  ))}
                </div>
              )}
              <a href={ev.link} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center gap-1.5 text-[11px] text-cyber-blue hover:underline truncate">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {ev.link}
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
                <h3 className="text-base font-bold text-white">{meta.title}</h3>
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
                  <label className="text-[10px] font-mono uppercase text-white/40">{meta.linkLabel}</label>
                  <input className={`${input} mt-1`} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder={meta.placeholder} />
                </div>
                {formError && <p className="text-[11px] text-rose-300 font-mono">{formError}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setCreating(false)} disabled={saving} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">CANCEL</button>
                <button onClick={create} disabled={saving || !form.name.trim() || !form.link.trim()} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">{saving ? 'CREATING…' : 'CREATE'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Results modal */}
      <AnimatePresence>
        {resultsFor && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !savingResults && setResultsFor(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} role="dialog" aria-modal="true" className="glass-panel border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 bg-[#1E2126] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Results · {resultsFor.name}</h3>
                <button onClick={() => setResultsFor(null)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] text-white/40 font-mono">Search a member by name or email. Points go straight to the leaderboard.</p>
              {/* Native datalist: a searchable dropdown with no extra code. */}
              <datalist id="club-members">
                {members.map((m) => <option key={m.email} value={memberLabel(m)} />)}
              </datalist>
              {PLACES.map((place) => (
                <div key={place}>
                  <label className="text-[10px] font-mono uppercase text-white/40">
                    {PLACE_LABEL[place]} place · +{pointsConfig.eventPlaces[place]} pts
                  </label>
                  <input
                    list="club-members"
                    className={`${input} mt-1`}
                    value={picks[place] || ''}
                    onChange={(e) => setPicks({ ...picks, [place]: e.target.value })}
                    placeholder="Search members..."
                  />
                </div>
              ))}
              {resultsError && <p className="text-[11px] text-rose-300 font-mono">{resultsError}</p>}
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => setResultsFor(null)} disabled={savingResults} className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">CANCEL</button>
                <button onClick={saveResults} disabled={savingResults} className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40">{savingResults ? 'SAVING…' : 'SAVE RESULTS'}</button>
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
