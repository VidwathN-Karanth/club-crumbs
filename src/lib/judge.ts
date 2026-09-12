import 'server-only';

/**
 * The judge adapter — the ONE place Club Crumbs talks to a code-execution
 * engine. Everything else deals in canonical language keys and abstract
 * verdicts, so the engine can be swapped by changing env vars alone.
 *
 * Default engine: Judge0 CE (self-hosted or hosted). See docs/JUDGE0_SETUP.md.
 *
 *   JUDGE0_URL         base URL, e.g. http://1.2.3.4:2358
 *   JUDGE0_AUTH_TOKEN  the X-Auth-Token that instance expects (optional)
 *
 * Hidden test cases pass through here and are compared by the engine; they are
 * never returned to the browser.
 */

/** Canonical language key → Judge0 CE language id (v1.13.x). */
const JUDGE0_LANGUAGE_ID: Record<string, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13)
  python: 71, // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

export type Verdict =
  | 'accepted'
  | 'wrong_answer'
  | 'tle'
  | 're'
  | 'ce'
  | 'error';

export interface CaseInput {
  stdin: string;
  expectedOutput: string;
}

export interface CaseResult {
  verdict: Verdict;
  /** Only populated for sample cases the caller chooses to reveal. */
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  timeMs?: number | null;
}

export interface RunOptions {
  languageKey: string;
  sourceCode: string;
  cases: CaseInput[];
  cpuTimeLimitSec?: number;
  memoryLimitKb?: number;
  /** When true, stdout/stderr are returned (use only for sample cases). */
  reveal?: boolean;
}

export class JudgeNotConfiguredError extends Error {
  constructor() {
    super('The code judge is not configured. Set JUDGE0_URL in the environment.');
    this.name = 'JudgeNotConfiguredError';
  }
}

function config(): { url: string; token: string | null } {
  const url = (process.env.JUDGE0_URL || '').replace(/\/$/, '');
  if (!url) throw new JudgeNotConfiguredError();
  return { url, token: process.env.JUDGE0_AUTH_TOKEN || null };
}

function b64(s: string): string {
  return Buffer.from(s ?? '', 'utf8').toString('base64');
}

function fromB64(s: string | null | undefined): string | null {
  if (s == null) return null;
  try {
    return Buffer.from(s, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/** Judge0 status.id → our verdict. */
function verdictFromStatus(id: number): Verdict {
  if (id === 3) return 'accepted';
  if (id === 4) return 'wrong_answer';
  if (id === 5) return 'tle';
  if (id === 6) return 'ce';
  if (id >= 7 && id <= 12) return 're';
  return 'error';
}

interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  status: { id: number; description: string };
}

/**
 * Runs the source against each case and returns a verdict per case.
 *
 * Uses Judge0's synchronous batch endpoint: submissions are created with
 * `expected_output`, so the engine itself decides Accepted vs Wrong Answer.
 * Suitable for the modest case counts of a Run or a single-problem Submit.
 */
export async function runCode(opts: RunOptions): Promise<CaseResult[]> {
  const { url, token } = config();
  const languageId = JUDGE0_LANGUAGE_ID[opts.languageKey];
  if (!languageId) throw new Error(`Unsupported language: ${opts.languageKey}`);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['X-Auth-Token'] = token;

  const submissions = opts.cases.map((c) => ({
    language_id: languageId,
    source_code: b64(opts.sourceCode),
    stdin: b64(c.stdin),
    expected_output: b64(c.expectedOutput),
    cpu_time_limit: opts.cpuTimeLimitSec ?? 2,
    memory_limit: opts.memoryLimitKb ?? 128000,
  }));

  // Create the batch (wait=true asks the engine to judge before responding).
  const createRes = await fetch(
    `${url}/submissions/batch?base64_encoded=true&wait=true`,
    { method: 'POST', headers, body: JSON.stringify({ submissions }) }
  );

  if (!createRes.ok) {
    throw new Error(`Judge error (${createRes.status}): ${await createRes.text().catch(() => '')}`);
  }

  const created = (await createRes.json()) as Array<{ token?: string } & Partial<Judge0Result>>;

  // Some instances honour wait=true and return full results here; others return
  // only tokens. If we already have statuses, use them; otherwise poll once.
  let results: Judge0Result[];
  if (created.every((r) => r.status && typeof r.status.id === 'number')) {
    results = created as Judge0Result[];
  } else {
    const tokens = created.map((r) => r.token).filter(Boolean).join(',');
    results = await pollBatch(url, headers, tokens);
  }

  return results.map((r) => {
    const verdict = verdictFromStatus(r.status?.id ?? 0);
    const timeMs = r.time != null ? Math.round(parseFloat(r.time) * 1000) : null;
    if (!opts.reveal) return { verdict, timeMs };
    return {
      verdict,
      stdout: fromB64(r.stdout),
      stderr: fromB64(r.stderr),
      compileOutput: fromB64(r.compile_output),
      timeMs,
    };
  });
}

/** Poll a batch until every submission is out of the queue (id 1/2). */
async function pollBatch(
  url: string,
  headers: Record<string, string>,
  tokens: string
): Promise<Judge0Result[]> {
  const fields = 'stdout,stderr,compile_output,time,status';
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `${url}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=${fields}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Judge poll error (${res.status})`);
    const body = (await res.json()) as { submissions: Judge0Result[] };
    const subs = body.submissions || [];
    const pending = subs.some((s) => s.status && s.status.id <= 2);
    if (!pending) return subs;
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error('The judge did not finish in time. Try again.');
}
