'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { useLeader } from '../LeaderContext';

interface Row {
  userId: string;
  name: string;
  totalPoints: number;
  totalLeetcodeSolved: number;
  totalGithubContributions: number;
  totalCodechefSolved: number;
}

const RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'week', label: 'This week' },
  { key: 'today', label: 'Today' },
] as const;

export default function LeaderLeaderboardPage() {
  const { cohort } = useLeader();
  const [range, setRange] = useState<'all' | 'week' | 'today'>('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ leaderboard: Row[] }>(
        await apiFetch(`/api/leader/leaderboard?cohort=${encodeURIComponent(cohort)}&range=${range}`)
      );
      const list = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      list.sort((a, b) => b.totalPoints - a.totalPoints);
      setRows(list);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the leaderboard.'));
    } finally {
      setLoading(false);
    }
  }, [cohort, range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Trophy className="w-5 h-5" /> {cohort} leaderboard</h1>
          <p className="text-xs text-white/40 mt-0.5">Ranked by points across LeetCode, GitHub and CodeChef.</p>
        </div>
        <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
          {RANGES.map((r) => (
            <button key={r.key} role="tab" aria-selected={range === r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                range === r.key ? 'bg-cyber-blue text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      <section className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">Loading…</p>
        ) : error ? (
          <p className="p-8 text-center text-xs text-rose-400 font-mono">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-white/40 font-mono">No ranked members yet — they need a LeetCode or CodeChef solve, or a contest podium.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40 font-bold uppercase tracking-wider">
                  <th className="p-4 font-normal w-12">#</th>
                  <th className="p-4 font-normal">Member</th>
                  <th className="p-4 font-normal text-right">Points</th>
                  <th className="p-4 font-normal text-right">LeetCode</th>
                  <th className="p-4 font-normal text-right">GitHub</th>
                  <th className="p-4 font-normal text-right">CodeChef</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r, i) => (
                  <tr key={r.userId} className="hover:bg-white/3 transition">
                    <td className="p-4 font-bold text-white/50">{i + 1}</td>
                    <td className="p-4 font-bold text-white">{r.name}</td>
                    <td className="p-4 text-right font-bold text-cyber-blue">{r.totalPoints}</td>
                    <td className="p-4 text-right text-white/70">{r.totalLeetcodeSolved}</td>
                    <td className="p-4 text-right text-white/70">{r.totalGithubContributions}</td>
                    <td className="p-4 text-right text-white/70">{r.totalCodechefSolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
