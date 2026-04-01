import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for user auth and profile sync.
 *
 * Set these env vars in Netlify (Site settings → Environment variables):
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
