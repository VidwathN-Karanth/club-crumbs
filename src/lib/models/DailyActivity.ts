import { supabaseAdmin } from '../supabaseAdmin';
import { User } from './User';
import { pointsConfig } from '../points';

export interface DailyActivityRow {
  id: number;
  userId: string;
  date: string;
  leetcodeSolvedToday: number;
  githubContributionsToday: number;
  codechefSolvedToday: number;
  pointsEarned: number;
  leetcodeEasyAccumulated: number;
  leetcodeMediumAccumulated: number;
  leetcodeHardAccumulated: number;
  codechefSolvedAccumulated: number;
  createdAt: string;
}

export interface LeaderboardUser {
  userId: string;
  name: string;
  leetcodeUsername: string | null;
  githubUsername: string | null;
  codechefUsername: string | null;
  linkedinUrl: string | null;
  totalPoints: number;
  totalLeetcodeSolved: number;
  totalGithubContributions: number;
  totalCodechefSolved: number;
}

interface DatabaseDailyActivityRow {
  id: number;
  user_id: string;
  date: string;
  leetcode_solved_today: number;
  github_contributions_today: number;
  codechef_solved_today: number;
  points_earned: number;
  leetcode_easy_accumulated: number;
  leetcode_medium_accumulated: number;
  leetcode_hard_accumulated: number;
  codechef_solved_accumulated: number;
  created_at: string;
}

/**
 * One already-summed row per student, as returned by the
 * `leaderboard_activity_totals` Postgres function.
 */
interface ActivityTotalsRow {
  user_id: string;
  points: number;
  leetcode_solved: number;
  github_contributions: number;
  codechef_solved: number;
}

/**
 * Maps database snake_case row to camelCase JS object.
 */
function mapActivityRow(row: DatabaseDailyActivityRow | null | undefined): DailyActivityRow | null {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    leetcodeSolvedToday: row.leetcode_solved_today,
    githubContributionsToday: row.github_contributions_today,
    codechefSolvedToday: row.codechef_solved_today || 0,
    pointsEarned: row.points_earned,
    leetcodeEasyAccumulated: row.leetcode_easy_accumulated || 0,
    leetcodeMediumAccumulated: row.leetcode_medium_accumulated || 0,
    leetcodeHardAccumulated: row.leetcode_hard_accumulated || 0,
    codechefSolvedAccumulated: row.codechef_solved_accumulated || 0,
    createdAt: row.created_at
  };
}

export class DailyActivity {
  /**
   * Idempotently logs a day's activity metrics and points ledger row.
   */
  static async upsert({
    userId,
    date,
    leetcodeSolvedToday,
    githubContributionsToday,
    codechefSolvedToday = 0,
    pointsEarned,
    leetcodeEasyAccumulated = 0,
    leetcodeMediumAccumulated = 0,
    leetcodeHardAccumulated = 0,
    codechefSolvedAccumulated = 0
  }: {
    userId: string;
    date: string;
    leetcodeSolvedToday: number;
    githubContributionsToday: number;
    codechefSolvedToday?: number;
    pointsEarned: number;
    leetcodeEasyAccumulated?: number;
    leetcodeMediumAccumulated?: number;
    leetcodeHardAccumulated?: number;
    codechefSolvedAccumulated?: number;
  }): Promise<DailyActivityRow | null> {
    const { data, error } = await supabaseAdmin
      .from('daily_activities')
      .upsert({
        user_id: userId,
        date,
        leetcode_solved_today: leetcodeSolvedToday,
        github_contributions_today: githubContributionsToday,
        codechef_solved_today: codechefSolvedToday,
        points_earned: pointsEarned,
        leetcode_easy_accumulated: leetcodeEasyAccumulated,
        leetcode_medium_accumulated: leetcodeMediumAccumulated,
        leetcode_hard_accumulated: leetcodeHardAccumulated,
        codechef_solved_accumulated: codechefSolvedAccumulated
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert daily activity: ${error.message}`);
    }

    return mapActivityRow(data as DatabaseDailyActivityRow);
  }

  /**
   * Computes rank list for a range (today, week, all).
   *
   * `restrictToEmails` scopes the board to one academic year. Students only
   * ever compete within their own year, so callers pass that year's roster
   * addresses; omitting it ranks everybody, which is what the CSV export and
   * cron jobs want.
   */
  static async getLeaderboard(
    range: 'today' | 'week' | 'all',
    opts: { restrictToEmails?: string[] } = {}
  ): Promise<LeaderboardUser[]> {
    // 1. Fetch the candidates and drop anyone without a linked handle.
    //
    // findLinkedUsers applies the has-a-handle test in Postgres, which is the
    // same test the filter below used to apply in Node after pulling every
    // single account in the department. The emptiness checks stay here because
    // the query can only ask for "not null", and an empty string is not null.
    //
    // The cohort filter deliberately stays in Node: it compares trimmed and
    // lowercased addresses, and an `in` clause against the raw column would be
    // case-sensitive — quietly dropping any student whose stored address is
    // capitalised differently from the roster's.
    const allUsers = await User.findLinkedUsers();

    // Scope to a cohort before any points are summed, so no other year's
    // numbers can reach the caller even by accident.
    const allowedEmails = opts.restrictToEmails
      ? new Set(opts.restrictToEmails.map((e) => e.trim().toLowerCase()))
      : null;

    const users = allUsers.filter(u => {
      if (allowedEmails && !allowedEmails.has((u.email || '').trim().toLowerCase())) {
        return false;
      }
      const hasLeetcode = u.leetcodeUsername && u.leetcodeUsername.trim() !== '';
      const hasGithub = u.githubUsername && u.githubUsername.trim() !== '';
      const hasCodechef = u.codechefUsername && u.codechefUsername.trim() !== '';
      return !!(hasLeetcode || hasGithub || hasCodechef);
    });

    // 2. Aggregate the points ledger in Postgres, not in Node.
    //
    // This used to `select('*')` the whole daily_activities table and sum it
    // here. That is one row per student per day forever — at 800 students it
    // reaches tens of megabytes on every single request. The RPC does the
    // GROUP BY server-side and hands back one row per student instead.
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (range === 'today') {
      startDate = todayStr;
      endDate = todayStr;
    } else if (range === 'week') {
      const lastWeek = new Date();
      lastWeek.setUTCDate(today.getUTCDate() - 6); // 7 days rolling (including today)
      startDate = lastWeek.toISOString().split('T')[0];
    }

    const { data: totals, error } = await supabaseAdmin.rpc('leaderboard_activity_totals', {
      p_user_ids: users.map((u) => u.id),
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      throw new Error(`Failed to fetch daily activities for leaderboard: ${error.message}`);
    }

    // 3. Initialize scoreboard map
    const leaderboardMap: { [key: string]: LeaderboardUser } = {};
    for (const user of users) {
      leaderboardMap[user.id] = {
        userId: user.id,
        name: user.name,
        leetcodeUsername: user.leetcodeUsername,
        githubUsername: user.githubUsername,
        codechefUsername: user.codechefUsername,
        linkedinUrl: user.linkedinUrl,
        totalPoints: 0,
        totalLeetcodeSolved: 0,
        totalGithubContributions: 0,
        totalCodechefSolved: 0
      };
    }

    // 4. Fold the per-student totals in
    for (const row of (totals || []) as ActivityTotalsRow[]) {
      const summary = leaderboardMap[row.user_id];
      if (!summary) continue;

      // Every range, all-time included, is the daily ledger: it only ever
      // holds solves made after linking. All-time used to multiply the
      // profile's lifetime totals, which credited years of pre-club solves.
      summary.totalPoints += Number(row.points);
      summary.totalLeetcodeSolved += Number(row.leetcode_solved);
      summary.totalGithubContributions += Number(row.github_contributions);
      summary.totalCodechefSolved += Number(row.codechef_solved);
    }

    // 4.6 Competition podiums (Coding / Gym results). Winners score even with
    // no linked coding handle, so they are added to the board if missing.
    await addEventPoints(leaderboardMap, users, { startDate, endDate, allowedEmails });

    // 5. Convert to array and sort descending by totalPoints
    const sortedLeaderboard = Object.values(leaderboardMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      const totalSolvedB = b.totalLeetcodeSolved + b.totalCodechefSolved;
      const totalSolvedA = a.totalLeetcodeSolved + a.totalCodechefSolved;
      if (totalSolvedB !== totalSolvedA) {
        return totalSolvedB - totalSolvedA;
      }
      return b.totalGithubContributions - a.totalGithubContributions;
    });

    return sortedLeaderboard;
  }

  /**
   * Fetches all daily activities for a specific user.
   */
  static async findByUserId(userId: string): Promise<DailyActivityRow[]> {
    const { data, error } = await supabaseAdmin
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to retrieve activities for user: ${error.message}`);
    }

    return (data || []).map((row: any) => mapActivityRow(row as DatabaseDailyActivityRow)).filter((a: any): a is DailyActivityRow => a !== null);
  }

  /**
   * How big the points ledger has grown.
   *
   * Read-only, and deliberately not a purge. This table gains one row per
   * student per day — about 300,000 rows a year at 800 students, which is
   * comfortably inside Supabase's free tier for several years. The trap is
   * that trimming it later is not free: getLeaderboard('all') sums the whole
   * history, so deleting old rows would quietly shrink every student's
   * all-time score with nothing to show it happened. Retention needs a
   * per-student rollup written first, which is a change of its own.
   *
   * So this reports rather than acts, and the nightly job logs it. The number
   * to watch against is Supabase's 500 MB database limit.
   */
  static async footprint(): Promise<{ rows: number }> {
    const { count, error } = await supabaseAdmin
      .from('daily_activities')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to measure the activity ledger: ${error.message}`);
    }
    return { rows: count ?? 0 };
  }
}

interface EventResult { place: number; email: string; name?: string }

/** Folds 1st/2nd/3rd place points from club competitions into the board. */
async function addEventPoints(
  board: { [key: string]: LeaderboardUser },
  users: { id: string; email: string; name: string }[],
  opts: { startDate: string | null; endDate: string | null; allowedEmails: Set<string> | null }
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('coding_events')
    .select('results, competition_date, created_at');
  // Column not migrated yet, or a blip: the rest of the board still stands.
  if (error) {
    console.warn('[leaderboard] event results skipped:', error.message);
    return;
  }

  const pointsByEmail = new Map<string, { points: number; name: string }>();
  for (const row of (data || []) as { results: EventResult[] | null; competition_date: string | null; created_at: string }[]) {
    const day = row.competition_date || row.created_at.slice(0, 10);
    if (opts.startDate && day < opts.startDate) continue;
    if (opts.endDate && day > opts.endDate) continue;
    for (const r of Array.isArray(row.results) ? row.results : []) {
      const email = (r.email || '').trim().toLowerCase();
      const pts = pointsConfig.eventPlaces[r.place] || 0;
      if (!email || !pts) continue;
      if (opts.allowedEmails && !opts.allowedEmails.has(email)) continue;
      const cur = pointsByEmail.get(email) || { points: 0, name: r.name || email.split('@')[0] };
      cur.points += pts;
      pointsByEmail.set(email, cur);
    }
  }
  if (pointsByEmail.size === 0) return;

  const idByEmail = new Map(users.map((u) => [(u.email || '').trim().toLowerCase(), u.id]));

  // Winners without a linked handle are not in `users`; find their account so
  // the row keys on the real id (self-highlighting on the member board).
  const missing = [...pointsByEmail.keys()].filter((e) => !idByEmail.has(e));
  if (missing.length > 0) {
    const { data: extra } = await supabaseAdmin.from('users').select('id, email').in('email', missing);
    for (const u of (extra || []) as { id: string; email: string }[]) {
      idByEmail.set((u.email || '').trim().toLowerCase(), u.id);
    }
  }

  for (const [email, { points, name }] of pointsByEmail) {
    const id = idByEmail.get(email) || `email:${email}`;
    board[id] ??= {
      userId: id,
      name,
      leetcodeUsername: null,
      githubUsername: null,
      codechefUsername: null,
      linkedinUrl: null,
      totalPoints: 0,
      totalLeetcodeSolved: 0,
      totalGithubContributions: 0,
      totalCodechefSolved: 0,
    };
    board[id].totalPoints += points;
  }
}
