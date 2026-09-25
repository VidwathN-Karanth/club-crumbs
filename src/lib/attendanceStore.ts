import 'server-only';

import { supabaseAdmin } from './supabaseAdmin';
import { memberListForCohort, type ClubMember } from './clubMembers';
import { normalizeEmail, type Cohort } from './cohorts';
import { byName, type AttendanceRecord, type RosterEntry } from './attendance';

const COLUMNS = 'cohort, date, present, roster, taken_by, marked_by, created_at, updated_at';

type Row = {
  cohort: string;
  date: string;
  present: unknown;
  roster: unknown;
  taken_by: string | null;
  marked_by: string | null;
  created_at: string | null;
  updated_at: string;
};

/**
 * Cleans a stored row. A record saved before roster snapshots existed has an
 * empty `roster`; for those the current member list stands in (the old
 * behaviour), so nothing in the history silently disappears.
 */
function toRecord(row: Row, currentMembers: ClubMember[]): AttendanceRecord {
  const stored = Array.isArray(row.roster)
    ? (row.roster as RosterEntry[])
        .filter((m) => m && typeof m.email === 'string')
        .map((m) => ({ email: normalizeEmail(m.email), name: String(m.name || m.email.split('@')[0]) }))
    : [];
  const roster = (stored.length ? stored : currentMembers).slice().sort(byName);
  const inRoster = new Set(roster.map((m) => m.email));
  const present = Array.isArray(row.present)
    ? [...new Set((row.present as unknown[]).filter((e): e is string => typeof e === 'string').map(normalizeEmail))].filter((e) => inRoster.has(e))
    : [];
  return {
    cohort: row.cohort,
    date: row.date,
    present,
    roster,
    taken_by: row.taken_by,
    marked_by: row.marked_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Every record of one club, newest first, plus the current member list. */
export async function clubAttendance(cohort: Cohort): Promise<{ members: ClubMember[]; records: AttendanceRecord[] }> {
  const members = await memberListForCohort(cohort);
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select(COLUMNS)
    .eq('cohort', cohort)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return { members, records: ((data || []) as Row[]).map((r) => toRecord(r, members)) };
}

/** One club's record for one date, or null. */
export async function recordFor(cohort: Cohort, date: string, members: ClubMember[]): Promise<AttendanceRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select(COLUMNS)
    .eq('cohort', cohort)
    .eq('date', date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as Row, members) : null;
}
