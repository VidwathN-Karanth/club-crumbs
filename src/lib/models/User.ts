import { supabaseAdmin } from '../supabaseAdmin';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  leetcodeUsername: string | null;
  githubUsername: string | null;
  codechefUsername: string | null;
  linkedinUrl: string | null;
  leetcodeEasyTotal: number;
  leetcodeMediumTotal: number;
  leetcodeHardTotal: number;
  codechefSolvedTotal: number;
  /** Solve counts at the moment each handle was linked; only solves above these score. */
  leetcodeBaseline: { Easy: number; Medium: number; Hard: number };
  leetcodeLinkedOn: string | null;
  codechefBaseline: number;
  codechefLinkedOn: string | null;
  resumeUrl: string | null;
  resumeName: string | null;
  resumeUploadedAt: string | null;
  createdAt: string;
}

interface DatabaseUserRow {
  id: string;
  name: string;
  email: string;
  leetcode_username: string | null;
  github_username: string | null;
  codechef_username: string | null;
  linkedin_url: string | null;
  leetcode_easy_total: number;
  leetcode_medium_total: number;
  leetcode_hard_total: number;
  codechef_solved_total: number;
  leetcode_baseline_easy: number | null;
  leetcode_baseline_medium: number | null;
  leetcode_baseline_hard: number | null;
  leetcode_linked_on: string | null;
  codechef_baseline: number | null;
  codechef_linked_on: string | null;
  resume_url: string | null;
  resume_name: string | null;
  resume_uploaded_at: string | null;
  created_at: string;
}

/**
 * Maps database snake_case row to camelCase JS object.
 */
function mapUserRow(row: DatabaseUserRow | null | undefined): UserRow | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    leetcodeUsername: row.leetcode_username,
    githubUsername: row.github_username,
    codechefUsername: row.codechef_username,
    linkedinUrl: row.linkedin_url,
    leetcodeEasyTotal: row.leetcode_easy_total || 0,
    leetcodeMediumTotal: row.leetcode_medium_total || 0,
    leetcodeHardTotal: row.leetcode_hard_total || 0,
    codechefSolvedTotal: row.codechef_solved_total || 0,
    leetcodeBaseline: {
      Easy: row.leetcode_baseline_easy || 0,
      Medium: row.leetcode_baseline_medium || 0,
      Hard: row.leetcode_baseline_hard || 0,
    },
    leetcodeLinkedOn: row.leetcode_linked_on ?? null,
    codechefBaseline: row.codechef_baseline || 0,
    codechefLinkedOn: row.codechef_linked_on ?? null,
    resumeUrl: row.resume_url ?? null,
    resumeName: row.resume_name ?? null,
    resumeUploadedAt: row.resume_uploaded_at ?? null,
    createdAt: row.created_at
  };
}

export class User {
  /**
   * Creates a user profile in Supabase.
   */
  static async create({ 
    id, 
    name, 
    email, 
    leetcodeUsername = null, 
    githubUsername = null,
    codechefUsername = null,
    linkedinUrl = null,
    leetcodeEasyTotal = 0,
    leetcodeMediumTotal = 0,
    leetcodeHardTotal = 0,
    codechefSolvedTotal = 0
  }: { 
    id?: string; 
    name: string; 
    email: string; 
    leetcodeUsername?: string | null; 
    githubUsername?: string | null; 
    codechefUsername?: string | null;
    linkedinUrl?: string | null;
    leetcodeEasyTotal?: number;
    leetcodeMediumTotal?: number;
    leetcodeHardTotal?: number;
    codechefSolvedTotal?: number;
  }): Promise<UserRow | null> {
    const userId = id || `usr_${Math.random().toString(36).substring(2, 11)}`;
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        name,
        email,
        leetcode_username: leetcodeUsername,
        github_username: githubUsername,
        codechef_username: codechefUsername,
        linkedin_url: linkedinUrl,
        leetcode_easy_total: leetcodeEasyTotal,
        leetcode_medium_total: leetcodeMediumTotal,
        leetcode_hard_total: leetcodeHardTotal,
        codechef_solved_total: codechefSolvedTotal
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return mapUserRow(data as DatabaseUserRow);
  }

  /**
   * Finds a user profile by ID.
   */
  static async findById(id: string): Promise<UserRow | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No user found
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }

    return mapUserRow(data as DatabaseUserRow);
  }

  /**
   * Updates user linking credentials and solved totals.
   */
  static async update(
    id: string, 
    updates: { 
      name?: string; 
      email?: string; 
      leetcodeUsername?: string | null; 
      githubUsername?: string | null;
      codechefUsername?: string | null;
      linkedinUrl?: string | null;
      leetcodeEasyTotal?: number;
      leetcodeMediumTotal?: number;
      leetcodeHardTotal?: number;
      codechefSolvedTotal?: number;
      leetcodeBaseline?: { Easy: number; Medium: number; Hard: number } | null;
      leetcodeLinkedOn?: string | null;
      codechefBaseline?: number | null;
      codechefLinkedOn?: string | null;
      resumeUrl?: string | null;
      resumeName?: string | null;
      resumeUploadedAt?: string | null;
    }
  ): Promise<UserRow | null> {
    const dbUpdates: {
      name?: string;
      email?: string;
      leetcode_username?: string | null;
      github_username?: string | null;
      codechef_username?: string | null;
      linkedin_url?: string | null;
      leetcode_easy_total?: number;
      leetcode_medium_total?: number;
      leetcode_hard_total?: number;
      codechef_solved_total?: number;
      leetcode_baseline_easy?: number | null;
      leetcode_baseline_medium?: number | null;
      leetcode_baseline_hard?: number | null;
      leetcode_linked_on?: string | null;
      codechef_baseline?: number | null;
      codechef_linked_on?: string | null;
      resume_url?: string | null;
      resume_name?: string | null;
      resume_uploaded_at?: string | null;
    } = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.leetcodeUsername !== undefined) dbUpdates.leetcode_username = updates.leetcodeUsername;
    if (updates.githubUsername !== undefined) dbUpdates.github_username = updates.githubUsername;
    if (updates.codechefUsername !== undefined) dbUpdates.codechef_username = updates.codechefUsername;
    if (updates.linkedinUrl !== undefined) dbUpdates.linkedin_url = updates.linkedinUrl;
    if (updates.leetcodeEasyTotal !== undefined) dbUpdates.leetcode_easy_total = updates.leetcodeEasyTotal;
    if (updates.leetcodeMediumTotal !== undefined) dbUpdates.leetcode_medium_total = updates.leetcodeMediumTotal;
    if (updates.leetcodeHardTotal !== undefined) dbUpdates.leetcode_hard_total = updates.leetcodeHardTotal;
    if (updates.codechefSolvedTotal !== undefined) dbUpdates.codechef_solved_total = updates.codechefSolvedTotal;
    if (updates.leetcodeBaseline !== undefined) {
      dbUpdates.leetcode_baseline_easy = updates.leetcodeBaseline?.Easy ?? null;
      dbUpdates.leetcode_baseline_medium = updates.leetcodeBaseline?.Medium ?? null;
      dbUpdates.leetcode_baseline_hard = updates.leetcodeBaseline?.Hard ?? null;
    }
    if (updates.leetcodeLinkedOn !== undefined) dbUpdates.leetcode_linked_on = updates.leetcodeLinkedOn;
    if (updates.codechefBaseline !== undefined) dbUpdates.codechef_baseline = updates.codechefBaseline;
    if (updates.codechefLinkedOn !== undefined) dbUpdates.codechef_linked_on = updates.codechefLinkedOn;
    if (updates.resumeUrl !== undefined) dbUpdates.resume_url = updates.resumeUrl;
    if (updates.resumeName !== undefined) dbUpdates.resume_name = updates.resumeName;
    if (updates.resumeUploadedAt !== undefined) dbUpdates.resume_uploaded_at = updates.resumeUploadedAt;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return mapUserRow(data as DatabaseUserRow);
  }

  /**
   * Finds all users with at least one profile linked.
   */
  static async findLinkedUsers(
    opts: { offset?: number; limit?: number } = {}
  ): Promise<UserRow[]> {
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .or('leetcode_username.not.is.null,github_username.not.is.null,codechef_username.not.is.null')
      // The explicit order is what makes slicing safe. Postgres gives no
      // ordering guarantee without it, so between two calls the same student
      // could land in two slices — or, far worse, in none, losing a day of
      // their points with nothing logged to say so.
      .order('id', { ascending: true });

    // No limit means the whole list, exactly as this behaved before slicing
    // existed. The nightly job asks for pages; everything else still asks for
    // all of them.
    if (opts.limit !== undefined) {
      const from = opts.offset ?? 0;
      query = query.range(from, from + opts.limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve linked users: ${error.message}`);
    }

    return (data || []).map((row: any) => mapUserRow(row as DatabaseUserRow)).filter((u: any): u is UserRow => u !== null);
  }

  /**
   * Finds all users in the system.
   */
  static async findAll(): Promise<UserRow[]> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) {
      throw new Error(`Failed to retrieve all users: ${error.message}`);
    }

    return (data || []).map((row: any) => mapUserRow(row as DatabaseUserRow)).filter((u: any): u is UserRow => u !== null);
  }
}
