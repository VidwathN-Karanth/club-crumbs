import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseAdminConfigured =
  !!rawUrl &&
  !!rawKey &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-project-ref') &&
  !rawUrl.includes('your-supabase') &&
  !rawKey.includes('placeholder') &&
  !rawKey.includes('your-supabase') &&
  rawKey.length > 20;

if (!isSupabaseAdminConfigured) {
  console.warn(
    '⚠️ Serverless WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is using placeholders or unconfigured. Using in-memory fallback store for local development.'
  );
}

// In-memory mock tables for local development when Supabase is unconfigured
const mockTables: Record<string, any[]> = {
  coding_events: [
    {
      id: 'mock-code-1',
      cohort: 'Coders Club',
      name: 'Weekly Code Clash #1',
      competition_date: new Date().toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '20:00',
      registration_start: null,
      link: 'https://leetcode.com/contest',
      event_id: null,
      created_by: 'admin@mite.ac.in',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-code-2',
      cohort: 'Crypton Club',
      name: 'Cyber Gym CTF Sprint',
      competition_date: new Date().toISOString().split('T')[0],
      start_time: '19:00',
      end_time: '21:00',
      registration_start: null,
      link: 'https://crypton-ctf.xyz',
      event_id: null,
      created_by: 'admin@mite.ac.in',
      created_at: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: 'mock-ev-1',
      title: 'Welcome to Club Crumbs',
      description: 'Orientation session for all club members.',
      event_date: new Date().toISOString().split('T')[0],
      repeat: 'none',
      repeat_until: null,
      audience: 'Everyone',
      created_by: 'dev_mock_admin_user',
      creator_name: 'Dev Administrator',
      is_staff: true,
      created_at: new Date().toISOString(),
    },
  ],
  extension_tokens: [],
  admin_logs: [],
  access_grants: [],
};

function createMockQuery(tableName: string) {
  if (!mockTables[tableName]) {
    mockTables[tableName] = [];
  }

  const filters: ((row: any) => boolean)[] = [];
  let pendingInsert: any = null;
  let pendingUpdate: any = null;
  let isDelete = false;
  let limitCount: number | null = null;

  const execute = () => {
    const rows = mockTables[tableName];

    if (pendingInsert) {
      const items = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
      const inserted = items.map((item) => ({
        id: item.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: item.created_at || new Date().toISOString(),
        ...item,
      }));
      rows.push(...inserted);
      return Array.isArray(pendingInsert) ? inserted : inserted[0];
    }

    if (isDelete) {
      mockTables[tableName] = rows.filter((r) => !filters.every((f) => f(r)));
      const deleted = rows.filter((r) => filters.every((f) => f(r)));
      return deleted;
    }

    if (pendingUpdate) {
      const updated: any[] = [];
      rows.forEach((r) => {
        if (filters.every((f) => f(r))) {
          Object.assign(r, pendingUpdate);
          updated.push(r);
        }
      });
      return updated;
    }

    let filtered = rows.filter((r) => filters.every((f) => f(r)));
    if (limitCount != null) {
      filtered = filtered.slice(0, limitCount);
    }
    return filtered;
  };

  const builder: any = {
    then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
      try {
        const res = execute();
        return Promise.resolve({
          data: res,
          error: null,
          count: Array.isArray(res) ? res.length : 1,
        }).then(onfulfilled, onrejected);
      } catch (err) {
        return Promise.resolve({ data: null, error: err }).then(onfulfilled, onrejected);
      }
    },
    catch(onrejected?: (err: any) => any) {
      return builder.then(undefined, onrejected);
    },
    single() {
      return {
        then(onfulfilled?: (val: any) => any, onrejected?: (err: any) => any) {
          try {
            const res = execute();
            const row = Array.isArray(res) ? (res[0] ?? null) : res;
            return Promise.resolve({ data: row, error: null }).then(onfulfilled, onrejected);
          } catch (err) {
            return Promise.resolve({ data: null, error: err }).then(onfulfilled, onrejected);
          }
        },
      };
    },
    maybeSingle() {
      return builder.single();
    },
    select(_cols = '*') {
      return builder;
    },
    eq(col: string, val: any) {
      filters.push((r) => r[col] === val);
      return builder;
    },
    neq(col: string, val: any) {
      filters.push((r) => r[col] !== val);
      return builder;
    },
    in(col: string, vals: any[]) {
      filters.push((r) => Array.isArray(vals) && vals.includes(r[col]));
      return builder;
    },
    or(queryStr: string) {
      const clauses = queryStr.split(',').map((c) => c.trim());
      filters.push((r) => {
        return clauses.some((clause) => {
          const parts = clause.split('.eq.');
          if (parts.length === 2) {
            return String(r[parts[0]]) === String(parts[1]);
          }
          return true;
        });
      });
      return builder;
    },
    is(col: string, val: any) {
      filters.push((r) => r[col] === val || (val === null && r[col] == null));
      return builder;
    },
    gte(col: string, val: any) {
      filters.push((r) => r[col] >= val);
      return builder;
    },
    lte(col: string, val: any) {
      filters.push((r) => r[col] <= val);
      return builder;
    },
    lt(col: string, val: any) {
      filters.push((r) => r[col] < val);
      return builder;
    },
    order(_col: string, _opts?: any) {
      return builder;
    },
    limit(n: number) {
      limitCount = n;
      return builder;
    },
    insert(val: any) {
      pendingInsert = val;
      return builder;
    },
    update(val: any) {
      pendingUpdate = val;
      return builder;
    },
    delete() {
      isDelete = true;
      return builder;
    },
  };

  return builder;
}

const mockSupabaseAdmin: any = {
  from(tableName: string) {
    return createMockQuery(tableName);
  },
  rpc(_fn: string, _args?: any) {
    return Promise.resolve({ data: [], error: null });
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : mockSupabaseAdmin;
