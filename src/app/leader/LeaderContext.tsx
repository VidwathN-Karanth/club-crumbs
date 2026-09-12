'use client';

import { createContext, useContext } from 'react';
import type { Cohort } from '@/lib/cohorts';

/**
 * What every leader screen shares: which club this leader is running.
 *
 * Unlike the admin console, there is no club switcher here — a leader sees
 * exactly one club, fixed server-side by the active-context cookie and resolved
 * once in the layout. A leader of two clubs picks which one on /choose-access;
 * switching clubs means switching role there, not a control inside the console.
 */
interface LeaderContextValue {
  cohort: Cohort;
  leaderName: string;
  leaderEmail: string;
}

const LeaderContext = createContext<LeaderContextValue | null>(null);

export function useLeader(): LeaderContextValue {
  const value = useContext(LeaderContext);
  if (!value) throw new Error('useLeader must be used inside the leader layout.');
  return value;
}

export function LeaderProvider({
  value,
  children,
}: {
  value: LeaderContextValue;
  children: React.ReactNode;
}) {
  return <LeaderContext.Provider value={value}>{children}</LeaderContext.Provider>;
}
