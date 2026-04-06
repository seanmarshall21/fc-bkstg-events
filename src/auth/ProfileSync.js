/**
 * ProfileSync — syncs user sites to Supabase for cross-device access.
 *
 * Table schema (create in Supabase SQL editor):
 *
 * CREATE TABLE user_sites (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   sites JSONB NOT NULL DEFAULT '[]',
 *   active_site_id TEXT,
 *   active_events_map JSONB NOT NULL DEFAULT '{}',
 *   preferences JSONB NOT NULL DEFAULT '{}',
 *   updated_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(user_id)
 * );
 *
 * -- Enable RLS
 * ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;
 *
 * -- Users can only read/write their own row
 * CREATE POLICY "Users manage own data" ON user_sites
 *   FOR ALL USING (auth.uid() = user_id)
 *   WITH CHECK (auth.uid() = user_id);
 */

import { supabase, isSupabaseConfigured } from '../config/supabase';

// ── Read profile from Supabase ────────────────────────────────
export async function loadProfile(userId) {
  if (!isSupabaseConfigured() || !userId) return null;

  const { data, error } = await supabase
    .from('user_sites')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (new user)
    console.warn('Failed to load profile:', error);
  }

  return data || null;
}

// ── Save profile to Supabase ──────────────────────────────────
export async function saveProfile(userId, { sites, activeSiteId, activeEventsMap, preferences }) {
  if (!isSupabaseConfigured() || !userId) return;

  // Include credentials in cloud sync — RLS ensures only the user
  // can read their own row. This allows sign-out → sign-in to fully
  // restore all connected sites without re-entering app passwords.
  const safeSites = sites.map(({ ...site }) => site);

  const payload = {
    user_id: userId,
    sites: safeSites,
    active_site_id: activeSiteId,
    active_events_map: activeEventsMap || {},
    preferences: preferences || {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_sites')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.warn('Failed to save profile:', error);
  }
}

// ── Auth helpers ──────────────────────────────────────────────

export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured()) throw new Error('Auth not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email, password) {
  if (!isSupabaseConfigured()) throw new Error('Auth not configured');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) throw new Error('Auth not configured');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}
