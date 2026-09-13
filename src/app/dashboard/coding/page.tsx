'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Code2, ExternalLink } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/dateFormat';

interface CodingEvent {
  id: string;
  name: string;
  competition_date: string | null;
  start_time: string | null;
  end_time: string | null;
  registration_start: string | null;
  link: string;
}

interface TournamentConfig { section: string; actionLabel: string }

export default function MemberCodingPage() {
  const [events, setEvents] = useState<CodingEvent[]>([]);
  const [config, setConfig] = useState<TournamentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson<{ events: CodingEvent[]; config: TournamentConfig | null }>(await apiFetch('/api/coding/member/events'));
        if (!cancelled) { setEvents(Array.isArray(data.events) ? data.events : []); setConfig(data.config); }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Could not load competitions.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const section = config?.section ?? 'Coding';
  const actionLabel = config?.actionLabel ?? 'Open';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" /> {section}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">Competitions from your club — open them straight from the card.</p>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-400">{error}</p>
      ) : events.length === 0 ? (
        <div className="glass-card border border-outline-variant rounded-2xl p-10 text-center">
          <Code2 className="w-8 h-8 text-on-surface-variant/40 mx-auto" />
          <p className="mt-3 text-sm text-on-surface-variant">No competitions right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const regOpen = !ev.registration_start || Date.now() >= new Date(ev.registration_start).getTime();
            return (
              <div key={ev.id} className="glass-card border border-outline-variant rounded-2xl p-5 flex flex-col gap-3">
                <h3 className="font-bold text-on-surface leading-snug">{ev.name}</h3>
                <div className="text-[11px] text-on-surface-variant font-mono space-y-1">
                  {ev.competition_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(ev.competition_date)}
                      {ev.start_time ? ` · ${ev.start_time}` : ''}{ev.end_time ? `–${ev.end_time}` : ''}
                    </div>
                  )}
                  {ev.registration_start && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Registration opens {formatDateTime(new Date(ev.registration_start))}
                    </div>
                  )}
                </div>
                <a
                  href={ev.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition"
                >
                  {regOpen ? actionLabel : 'View details'} <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
