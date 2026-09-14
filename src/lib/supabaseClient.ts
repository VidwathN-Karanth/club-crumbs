import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseUrl.includes('your-supabase') &&
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseAnonKey.includes('your-supabase') &&
  supabaseAnonKey.length > 20;

// Initialize Supabase only if configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. App sync will fallback to local-only demo mode.'
  );
}
