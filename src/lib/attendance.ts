/**
 * Attendance vocabulary and exports, shared by the leader and admin screens
 * (and the API routes, for the types and date check).
 *
 * A record is one club on one date. `roster` is the member list as it was when
 * the register was taken, so adding or removing members later never changes
 * who was present or absent on an earlier day. Everyone in `roster` is either
 * in `present` or was marked absent — the take-attendance screen will not save
 * until every member is marked.
 */

import { csvText, xlsxBytes, XLSX_MIME, type Cell, type Sheet } from './xlsx';

export interface RosterEntry {
  email: string;
  name: string;
}

export interface AttendanceRecord {
  cohort: string;
  date: string; // YYYY-MM-DD
  present: string[];
  roster: RosterEntry[];
  taken_by: string | null;
  marked_by: string | null;
  created_at: string | null;
  updated_at: string;
}

export type ExportFormat = 'xlsx' | 'csv';

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-30 and friends). */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Today in the viewer's own timezone, as YYYY-MM-DD. */
export function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function byName(a: RosterEntry, b: RosterEntry): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.email.localeCompare(b.email);
}

export function counts(record: AttendanceRecord): { present: number; absent: number; total: number } {
  const total = record.roster.length;
  const present = record.roster.filter((m) => record.present.includes(m.email)).length;
  return { present, absent: total - present, total };
}

const statusOf = (record: AttendanceRecord, email: string) => (record.present.includes(email) ? 'Present' : 'Absent');
const savedAt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN') : '');
const slug = (s: string) => s.trim().replace(/\s+/g, '_');

/* ── Sheet builders ─────────────────────────────────────────────────────── */

const LONG_HEADER: Cell[] = ['Date', 'Club', 'Name', 'Email', 'Status'];

function longRows(records: AttendanceRecord[]): Cell[][] {
  const rows: Cell[][] = [];
  for (const r of records) {
    for (const m of [...r.roster].sort(byName)) rows.push([r.date, r.cohort, m.name, m.email, statusOf(r, m.email)]);
  }
  return rows;
}

function sessionRows(records: AttendanceRecord[]): Cell[][] {
  return [
    ['Date', 'Club', 'Present', 'Absent', 'Total', 'Attendance %', 'Taken by', 'Last saved by', 'Last saved at'],
    ...records.map((r) => {
      const c = counts(r);
      return [r.date, r.cohort, c.present, c.absent, c.total, c.total ? Math.round((c.present / c.total) * 100) : 0, r.taken_by || '', r.marked_by || '', savedAt(r.updated_at)];
    }),
  ];
}

/** Members down the side, dates across the top: the classic register. */
function registerRows(records: AttendanceRecord[]): Cell[][] {
  const dates = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const members = new Map<string, RosterEntry>();
  for (const r of dates) for (const m of r.roster) members.set(m.email, m); // latest name wins
  const header: Cell[] = ['Name', 'Email', ...dates.map((r) => r.date), 'Present', 'Absent', 'Attendance %'];
  const rows = [...members.values()].sort(byName).map((m) => {
    let p = 0;
    let a = 0;
    const marks = dates.map((r) => {
      if (!r.roster.some((x) => x.email === m.email)) return '—'; // not a member that day
      if (r.present.includes(m.email)) { p++; return 'P'; }
      a++;
      return 'A';
    });
    return [m.name, m.email, ...marks, p, a, p + a ? Math.round((p / (p + a)) * 100) : 0];
  });
  return [header, ...rows];
}

const DAY_WIDTHS = [12, 14, 28, 36, 10];

/* ── Downloads ──────────────────────────────────────────────────────────── */

function save(filename: string, data: BlobPart, mime: string) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function emit(base: string, format: ExportFormat, sheets: Sheet[], csvRows: Cell[][]) {
  if (format === 'csv') save(`${base}.csv`, csvText(csvRows), 'text/csv;charset=utf-8');
  else save(`${base}.xlsx`, (await xlsxBytes(sheets)) as BlobPart, XLSX_MIME);
}

/** One club, one date. */
export function downloadDay(record: AttendanceRecord, format: ExportFormat) {
  const rows = [LONG_HEADER, ...longRows([record])];
  return emit(`attendance-${slug(record.cohort)}-${record.date}`, format, [
    { name: 'Attendance', rows, widths: DAY_WIDTHS },
    { name: 'Summary', rows: sessionRows([record]), widths: [12, 14, 9, 9, 9, 13, 30, 30, 22] },
  ], rows);
}

/** One club, every recorded date. */
export function downloadHistory(cohort: string, records: AttendanceRecord[], format: ExportFormat) {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const long = [LONG_HEADER, ...longRows(sorted)];
  return emit(`attendance-${slug(cohort)}-all-dates`, format, [
    { name: 'Register', rows: registerRows(sorted), widths: [28, 36, ...sorted.map(() => 11), 9, 9, 13] },
    { name: 'Sessions', rows: sessionRows(sorted), widths: [12, 14, 9, 9, 9, 13, 30, 30, 22] },
    { name: 'All records', rows: long, widths: DAY_WIDTHS },
  ], long);
}

/** Every club on one date — the admin's daily roll-up. */
export function downloadClubsDay(date: string, clubs: { cohort: string; record: AttendanceRecord | null }[], format: ExportFormat) {
  const taken = clubs.map((c) => c.record).filter((r): r is AttendanceRecord => r !== null);
  const summary: Cell[][] = [
    ['Club', 'Status', 'Present', 'Absent', 'Total', 'Attendance %', 'Taken by', 'Last saved by', 'Last saved at'],
    ...clubs.map(({ cohort, record }) => {
      if (!record) return [cohort, 'Not taken', '', '', '', '', '', '', ''];
      const c = counts(record);
      return [cohort, 'Taken', c.present, c.absent, c.total, c.total ? Math.round((c.present / c.total) * 100) : 0, record.taken_by || '', record.marked_by || '', savedAt(record.updated_at)];
    }),
  ];
  const long = [LONG_HEADER, ...longRows(taken)];
  return emit(`attendance-all-clubs-${date}`, format, [
    { name: 'Summary', rows: summary, widths: [16, 11, 9, 9, 9, 13, 30, 30, 22] },
    ...taken.map((r) => ({
      name: r.cohort,
      rows: [['Name', 'Email', 'Status'], ...[...r.roster].sort(byName).map((m) => [m.name, m.email, statusOf(r, m.email)])],
      widths: [28, 36, 10],
    })),
  ], long);
}
