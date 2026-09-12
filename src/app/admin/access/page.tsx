'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, KeyRound, RefreshCw, Shield, Trash2, UserPlus, Users,
} from 'lucide-react';

import { apiFetch, errorMessage, readJson } from '@/lib/apiClient';
import { COHORTS, shortCohortLabel, type Cohort } from '@/lib/cohorts';
import { parseEmailList } from '@/lib/emails';
import { SectionHeader } from '../_components/PanelState';

type Role = 'admin' | 'leader' | 'member';

interface Grant {
  email: string;
  role: Role;
  cohort: Cohort | null;
}

interface PendingRemove {
  email: string;
  role: Role;
  cohort: Cohort | null;
}

interface AddResult { added: string[]; skipped: { email: string; reason: string }[] }

/**
 * A bulk email adder — paste one or many addresses (commas, spaces or new
 * lines) and add them in one go. Reports how many landed and why any were
 * skipped, so a bad line in a pasted block does not hide the rest.
 */
function AddEmails({ placeholder, onAdd }: { placeholder: string; onAdd: (emails: string[]) => Promise<AddResult> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AddResult | null>(null);
  const [error, setError] = useState('');

  const parsed = parseEmailList(text);

  const submit = async () => {
    if (parsed.length === 0) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await onAdd(parsed);
      setResult(res);
      // Keep only the ones that failed, so the box shows what still needs fixing.
      setText(res.skipped.map((s) => s.email).join('\n'));
    } catch (err) {
      setError(errorMessage(err, 'Could not add those.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder={`${placeholder}\nPaste many at once — commas, spaces or new lines.`}
        rows={2}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyber-blue resize-y font-mono"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono text-white/30">
          {parsed.length > 0 ? `${parsed.length} email${parsed.length === 1 ? '' : 's'} ready · ⌘/Ctrl+Enter` : ''}
        </span>
        <button
          onClick={submit}
          disabled={busy || parsed.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40"
        >
          <UserPlus className="w-4 h-4" /> {busy ? 'Adding…' : parsed.length > 1 ? `Add ${parsed.length}` : 'Add'}
        </button>
      </div>
      {error && <p className="text-[11px] font-mono text-rose-300">{error}</p>}
      {result && (
        <div className="text-[11px] font-mono space-y-1">
          {result.added.length > 0 && (
            <p className="text-emerald-400">Added {result.added.length}.</p>
          )}
          {result.skipped.length > 0 && (
            <div className="text-amber-300">
              <p>Skipped {result.skipped.length}:</p>
              <ul className="mt-0.5 space-y-0.5 text-amber-300/80">
                {result.skipped.slice(0, 8).map((s) => (
                  <li key={s.email} className="truncate">• {s.email} — {s.reason}</li>
                ))}
                {result.skipped.length > 8 && <li>• …and {result.skipped.length - 8} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminAccessPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [club, setClub] = useState<Cohort>('Coders Club');
  const [confirmRemove, setConfirmRemove] = useState<PendingRemove | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readJson<{ grants: Grant[] }>(await apiFetch('/api/access/grants'));
      setGrants(Array.isArray(data.grants) ? data.grants : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load access grants.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = async (body: object): Promise<AddResult> => {
    const res = await readJson<AddResult>(await apiFetch('/api/access/grants', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }));
    await load();
    return { added: res.added ?? [], skipped: res.skipped ?? [] };
  };

  const patch = async (body: object) => {
    setWorking(true);
    try {
      await readJson(await apiFetch('/api/access/grants', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }));
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not change that role.'));
    } finally {
      setWorking(false);
    }
  };

  const doRemove = async (target: PendingRemove) => {
    setWorking(true);
    try {
      await readJson(await apiFetch('/api/access/grants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target),
      }));
      setConfirmRemove(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, 'Could not remove that grant.'));
    } finally {
      setWorking(false);
    }
  };

  /** Admin and leader removals are harmless; a member removal purges — confirm that one. */
  const requestRemove = (target: PendingRemove) => {
    if (target.role === 'member') setConfirmRemove(target);
    else doRemove(target);
  };

  const admins = grants.filter((g) => g.role === 'admin').map((g) => g.email);
  const leaders = grants.filter((g) => g.role === 'leader' && g.cohort === club).map((g) => g.email);
  const members = grants.filter((g) => g.role === 'member' && g.cohort === club).map((g) => g.email);

  return (
    <div className="space-y-8">
      <SectionHeader
        icon={KeyRound}
        title="Access Management"
        subtitle="Who is an admin, who leads each club, and who its members are."
      >
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyber-blue text-white/70 hover:text-white transition cursor-pointer text-[10px] uppercase font-bold tracking-wider"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Reload
        </button>
      </SectionHeader>

      {error && <p className="text-xs text-rose-400 font-mono">{error}</p>}

      {/* --- Admins --- */}
      <section className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-purple" /> Admins
          <span className="text-[10px] font-mono text-white/40">({admins.length})</span>
        </h3>
        <p className="text-[11px] text-white/40 font-mono">
          Full access to every club. Admins can add admins, leaders and members.
        </p>
        <div className="space-y-2">
          {admins.map((email) => (
            <div key={email} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              <span className="text-sm text-white truncate">{email}</span>
              {admins.length <= 1 ? (
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 shrink-0">Last admin · locked</span>
              ) : (
                <button
                  onClick={() => requestRemove({ email, role: 'admin', cohort: null })}
                  disabled={working}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/60 hover:text-rose-400 transition cursor-pointer disabled:opacity-40"
                  title="Remove admin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <AddEmails placeholder="new-admin@example.com" onAdd={(emails) => post({ emails, role: 'admin' })} />
      </section>

      {/* --- Per-club leaders & members --- */}
      <section className="space-y-4">
        <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-max">
          {COHORTS.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={club === c}
              onClick={() => setClub(c)}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                club === c ? 'bg-cyber-blue text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {shortCohortLabel(c)}
            </button>
          ))}
        </div>

        {/* Leaders */}
        <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyber-blue" /> {club} · Leaders
            <span className="text-[10px] font-mono text-white/40">({leaders.length})</span>
          </h3>
          <p className="text-[11px] text-white/40 font-mono">
            Leaders manage this club&apos;s members. They cannot appoint other leaders.
          </p>
          <div className="space-y-2">
            {leaders.length === 0 && <p className="text-[11px] text-white/30 font-mono">No leaders yet.</p>}
            {leaders.map((email) => (
              <div key={email} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="text-sm text-white truncate">{email}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => patch({ email, cohort: club, to: 'member' })}
                    disabled={working}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition cursor-pointer disabled:opacity-40"
                    title="Make an ordinary member"
                  >
                    Make member
                  </button>
                  <button
                    onClick={() => requestRemove({ email, role: 'leader', cohort: club })}
                    disabled={working}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/60 hover:text-rose-400 transition cursor-pointer disabled:opacity-40"
                    title="Remove leader"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <AddEmails placeholder="lead@mite.ac.in" onAdd={(emails) => post({ emails, role: 'leader', cohort: club })} />
        </div>

        {/* Members */}
        <div className="glass-panel border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-white/50" /> {club} · Members
            <span className="text-[10px] font-mono text-white/40">({members.length})</span>
          </h3>
          <div className="space-y-2">
            {members.length === 0 && <p className="text-[11px] text-white/30 font-mono">No members yet.</p>}
            {members.map((email) => (
              <div key={email} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="text-sm text-white truncate">{email}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => patch({ email, cohort: club, to: 'leader' })}
                    disabled={working}
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 transition cursor-pointer disabled:opacity-40"
                    title="Promote to club leader"
                  >
                    Make leader
                  </button>
                  <button
                    onClick={() => requestRemove({ email, role: 'member', cohort: club })}
                    disabled={working}
                    className="p-1.5 rounded-lg border border-white/10 hover:border-rose-400 text-white/60 hover:text-rose-400 transition cursor-pointer disabled:opacity-40"
                    title="Remove member and purge data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <AddEmails placeholder="student@mite.ac.in" onAdd={(emails) => post({ emails, role: 'member', cohort: club })} />
        </div>
      </section>

      {/* Member-removal (purge) confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !working && setConfirmRemove(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              role="dialog" aria-modal="true"
              className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full relative z-10 bg-[#1E2126]"
            >
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-base font-black tracking-wider uppercase">Remove member</h3>
              </div>
              <p className="text-xs text-white/60 font-mono mt-3 leading-relaxed">
                This removes{' '}
                <span className="text-red-400 font-semibold">{confirmRemove.email}</span>{' '}
                from {confirmRemove.cohort} and <span className="text-red-400 font-semibold">permanently deletes</span>{' '}
                their workspace and activity history. This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  disabled={working}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-40"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => doRemove(confirmRemove)}
                  disabled={working}
                  className="px-4 py-2 bg-red-950/45 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-60"
                >
                  {working ? 'REMOVING…' : 'REMOVE & PURGE'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
