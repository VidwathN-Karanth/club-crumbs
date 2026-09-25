// Self-check for the attendance exports (src/lib/attendance.ts + src/lib/xlsx.ts).
//
//   node scripts/attendance-selfcheck.mjs
//
// Compiles the two modules, generates every export from sample data (with
// awkward names: formula-looking, XML-special, non-ASCII, control chars), and
// asserts on the contents. If Python + openpyxl are installed, each .xlsx is
// also opened by an independent reader to prove Excel-compatible structure.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'att-check-'));
execFileSync(process.execPath, [
  join(root, 'node_modules/typescript/bin/tsc'),
  '--outDir', out, '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck', '--esModuleInterop',
  join(root, 'src/lib/attendance.ts'), join(root, 'src/lib/xlsx.ts'),
], { stdio: 'inherit' });
process.env.NODE_PATH = join(root, 'node_modules');
createRequire(import.meta.url)('node:module').Module._initPaths();
const req = createRequire(join(out, 'x.js'));
const att = req('./attendance.js');

// Capture downloads instead of touching a DOM.
const files = [];
globalThis.URL.createObjectURL = (blob) => { files.push({ blob }); return 'blob:x'; };
globalThis.URL.revokeObjectURL = () => {};
globalThis.document = {
  createElement: () => ({ click() {}, remove() {}, set download(n) { files[files.length - 1].name = n; } }),
  body: { appendChild() {} },
};
const take = async () => { const f = files.pop(); return { name: f.name, bytes: Buffer.from(await f.blob.arrayBuffer()) }; };

// ── dates ──
assert.equal(att.isValidDateKey('2026-09-25'), true);
assert.equal(att.isValidDateKey('2026-02-30'), false);
assert.equal(att.isValidDateKey('2026-13-01'), false);
assert.equal(att.isValidDateKey('26-09-25'), false);
assert.equal(att.isValidDateKey(null), false);

// ── sample data ──
const roster = [
  { email: 'b@mite.ac.in', name: '=HYPERLINK("x")' },
  { email: 'a@mite.ac.in', name: 'Ánanya <&> "Rao"' },
  { email: 'c@mite.ac.in', name: 'Ctrl\u0007Char' },
];
const rec = (date, present, r = roster) => ({
  cohort: 'Coders Club', date, present, roster: r, taken_by: 'lead@mite.ac.in', marked_by: 'lead@mite.ac.in',
  created_at: '2026-09-25T10:00:00Z', updated_at: '2026-09-25T10:00:00Z',
});
const d1 = rec('2026-09-24', ['a@mite.ac.in']);
const d2 = rec('2026-09-25', ['a@mite.ac.in', 'b@mite.ac.in', 'c@mite.ac.in'], [...roster, { email: 'd@mite.ac.in', name: 'Late Joiner' }]);

assert.deepEqual(att.counts(d1), { present: 1, absent: 2, total: 3 });
assert.deepEqual(att.counts(d2), { present: 3, absent: 1, total: 4 });

// ── CSV ──
await att.downloadDay(d1, 'csv');
let f = await take();
assert.equal(f.name, 'attendance-Coders_Club-2026-09-24.csv');
let csv = f.bytes.toString('utf8');
assert.ok(csv.startsWith('﻿Date,Club,Name,Email,Status\r\n'), 'BOM + header');
assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`), 'formula neutralised and quoted');
assert.equal(csv.trim().split('\r\n').length, 4, 'header + 3 members');
assert.ok(csv.includes('"Ánanya <&> ""Rao""",a@mite.ac.in,Present'), 'quotes escaped');

// ── XLSX: one of each export ──
const xlsxFiles = [];
const keep = async () => { const x = await take(); assert.ok(x.name.endsWith('.xlsx')); assert.equal(x.bytes.subarray(0, 2).toString(), 'PK'); const p = join(out, x.name); writeFileSync(p, x.bytes); xlsxFiles.push(p); };
await att.downloadDay(d1, 'xlsx'); await keep();
await att.downloadHistory('Coders Club', [d2, d1], 'xlsx'); await keep();
await att.downloadClubsDay('2026-09-25', [
  { cohort: 'Coders Club', record: d2 }, { cohort: 'Crypton Club', record: null }, { cohort: 'DevStudio', record: null },
], 'xlsx'); await keep();

// History CSV: long format, oldest date first, late joiner only on the day they were a member.
await att.downloadHistory('Coders Club', [d2, d1], 'csv');
csv = (await take()).bytes.toString('utf8');
const lines = csv.trim().split('\r\n');
assert.equal(lines.length, 1 + 3 + 4);
assert.ok(lines[1].startsWith('2026-09-24'));
assert.equal(lines.filter((l) => l.includes('d@mite.ac.in')).length, 1);

// Independent reader, if available.
const py = `
import sys, openpyxl
day, hist, clubs = sys.argv[1:4]
wb = openpyxl.load_workbook(day)
assert wb.sheetnames == ['Attendance', 'Summary'], wb.sheetnames
rows = list(wb['Attendance'].values)
assert rows[0] == ('Date','Club','Name','Email','Status'), rows[0]
assert len(rows) == 4
names = [r[2] for r in rows[1:]]
assert '=HYPERLINK("x")' in names and 'Ánanya <&> "Rao"' in names and 'CtrlChar' in names, names
assert wb['Attendance'].freeze_panes == 'A2'
wb = openpyxl.load_workbook(hist)
assert wb.sheetnames == ['Register', 'Sessions', 'All records'], wb.sheetnames
reg = list(wb['Register'].values)
assert reg[0][:4] == ('Name','Email','2026-09-24','2026-09-25'), reg[0]
late = [r for r in reg if r[1] == 'd@mite.ac.in'][0]
assert late[2:] == ('—','A',0,1,0), late
ananya = [r for r in reg if r[1] == 'a@mite.ac.in'][0]
assert ananya[2:] == ('P','P',2,0,100), ananya
wb = openpyxl.load_workbook(clubs)
assert wb.sheetnames == ['Summary', 'Coders Club'], wb.sheetnames
summ = list(wb['Summary'].values)
assert summ[1][:5] == ('Coders Club','Taken',3,1,4), summ[1]
assert summ[2][:2] == ('Crypton Club','Not taken'), summ[2]
print('openpyxl: all 3 workbooks open and match')
`;
try {
  console.log(execFileSync('python', ['-c', py, ...xlsxFiles], { encoding: 'utf8' }).trim());
} catch (e) {
  if (e.code === 'ENOENT' || /No module named/.test(String(e.stderr))) console.log('(skipped openpyxl check: python/openpyxl not installed)');
  else { console.error(e.stdout, e.stderr); process.exitCode = 1; }
}

rmSync(out, { recursive: true, force: true });
if (!process.exitCode) console.log('attendance self-check passed');
