'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ArrowRight, Loader2, KeyRound, Check } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '@/lib/testAuth';

export default function TestLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(TEST_ADMIN_EMAIL);
  const [password, setPassword] = useState(TEST_ADMIN_PASSWORD);
  const [role, setRole] = useState<'admin' | 'leader' | 'choose'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const targetRole =
        role === 'admin'
          ? 'admin'
          : role === 'leader'
          ? 'leader:Coders%20Club'
          : 'choose';

      const res = await apiFetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in with test credentials.');
      }

      // Store local test marker
      if (typeof window !== 'undefined') {
        localStorage.setItem('cc_test_user', JSON.stringify(data.user));
        localStorage.setItem('cc_test_session', TEST_ADMIN_EMAIL);
      }

      router.replace(data.redirect || '/choose-access/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#181B20]/90 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyber-blue/15 border border-cyber-blue/30 text-cyber-blue">
            <KeyRound className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Test Environment Sign-In</h3>
            <p className="text-[10px] text-white/50 font-mono">Bypass Google OAuth for Admin & Leader testing</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-bold text-emerald-400">
          TEST MODE
        </span>
      </div>

      <form onSubmit={handleLogin} className="space-y-3.5 font-mono">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">
            Email (@mite.ac.in)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-cyber-blue focus:outline-none transition"
            placeholder="testadmin@mite.ac.in"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-cyber-blue focus:outline-none transition"
            placeholder="mite@2026"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1.5">
            Initial Target Workspace
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRole('choose')}
              className={`px-2 py-1.5 rounded-lg text-[10px] border font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                role === 'choose'
                  ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              Role Chooser
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`px-2 py-1.5 rounded-lg text-[10px] border font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                role === 'admin'
                  ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" /> Admin
            </button>
            <button
              type="button"
              onClick={() => setRole('leader')}
              className={`px-2 py-1.5 rounded-lg text-[10px] border font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                role === 'leader'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" /> Leader
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-[11px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyber-blue to-cyber-purple text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
            </>
          ) : (
            <>
              Sign In as Test Admin / Leader <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="pt-2 text-center">
          <span className="text-[10px] text-white/40">
            Credentials: <code className="text-cyber-blue">testadmin@mite.ac.in</code> / <code className="text-cyber-blue">mite@2026</code>
          </span>
        </div>
      </form>
    </div>
  );
}
