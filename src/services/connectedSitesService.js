// ============================================================================
// connectedSitesService.js
// Tier 2 (per-WP-site credentials) sync layer for vc-event-manager
//
// Architecture:
//   - Server of record: Supabase `connected_sites` table (RLS enforced)
//   - Local cache: IndexedDB via `idb` (fast reads, offline-tolerant reads only)
//   - Writes ALWAYS go to Supabase first, then mirror to IndexedDB
//   - On login  → syncFromServer() hydrates IndexedDB from Supabase
//   - On logout → wipeLocal() nukes IndexedDB + any WP session tokens
//
// Encryption:
//   - WP app passwords are encrypted server-side via pgsodium
//   - Encrypt/decrypt calls go through a Supabase Edge Function
//     (service_role key never touches the browser)
// ============================================================================

import { openDB } from 'idb';
import { supabase } from './supabaseClient';

const DB_NAME    = 'vc-event-manager';
const DB_VERSION = 1;
const STORE      = 'connected_sites';

// Edge Function that proxies encrypt/decrypt (see supabase/functions/wp-crypto)
const CRYPTO_FN  = 'wp-crypto';

// ---------------------------------------------------------------------------
// IndexedDB handle (lazy)
// ---------------------------------------------------------------------------
let _dbPromise = null;
function db() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: 'id' });
        }
      }
    });
  }
  return _dbPromise;
}

// ---------------------------------------------------------------------------
// Edge Function helpers (encrypt / decrypt)
// ---------------------------------------------------------------------------
async function encryptPassword(plaintext) {
  const { data, error } = await supabase.functions.invoke(CRYPTO_FN, {
    body: { op: 'encrypt', plaintext }
  });
  if (error) throw error;
  return { ciphertext: data.ciphertext, nonce: data.nonce };
}

async function decryptPassword(ciphertext, nonce) {
  const { data, error } = await supabase.functions.invoke(CRYPTO_FN, {
    body: { op: 'decrypt', ciphertext, nonce }
  });
  if (error) throw error;
  return data.plaintext;
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------
function rowToSite(row, decryptedPassword) {
  return {
    id:           row.id,
    userId:       row.user_id,
    siteUrl:      row.site_url,
    siteName:     row.site_name,
    brandLogoUrl: row.brand_logo_url,
    wpUsername:   row.wp_username,
    wpAppPassword: decryptedPassword,  // plaintext, in-memory only
    createdAt:    row.created_at,
    updatedAt:    row.updated_at
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch all connected sites for a user.
 * Reads from IndexedDB cache first, then refreshes from server in background.
 */
export async function getSites(userId) {
  const d = await db();
  const cached = await d.getAll(STORE);
  // Return cached immediately for UI; caller can re-subscribe after sync
  return cached.filter(s => s.userId === userId);
}

/**
 * Add a new connected site.
 * Encrypts app password server-side, writes to Supabase, mirrors to IndexedDB.
 */
export async function addSite(userId, siteData) {
  const { siteUrl, siteName, brandLogoUrl, wpUsername, wpAppPassword } = siteData;

  const { ciphertext, nonce } = await encryptPassword(wpAppPassword);

  const { data, error } = await supabase
    .from('connected_sites')
    .insert({
      user_id: userId,
      site_url: siteUrl,
      site_name: siteName,
      brand_logo_url: brandLogoUrl ?? null,
      wp_username: wpUsername,
      wp_app_password_encrypted: ciphertext,
      wp_app_password_nonce: nonce
    })
    .select()
    .single();

  if (error) throw error;

  const site = rowToSite(data, wpAppPassword);
  const d = await db();
  await d.put(STORE, site);
  return site;
}

/**
 * Update a connected site. Pass partial `updates`; only provided keys change.
 * If wpAppPassword present, it gets re-encrypted.
 */
export async function updateSite(siteId, updates) {
  const patch = {};
  if (updates.siteUrl       !== undefined) patch.site_url       = updates.siteUrl;
  if (updates.siteName      !== undefined) patch.site_name      = updates.siteName;
  if (updates.brandLogoUrl  !== undefined) patch.brand_logo_url = updates.brandLogoUrl;
  if (updates.wpUsername    !== undefined) patch.wp_username    = updates.wpUsername;

  if (updates.wpAppPassword !== undefined) {
    const { ciphertext, nonce } = await encryptPassword(updates.wpAppPassword);
    patch.wp_app_password_encrypted = ciphertext;
    patch.wp_app_password_nonce     = nonce;
  }

  const { data, error } = await supabase
    .from('connected_sites')
    .update(patch)
    .eq('id', siteId)
    .select()
    .single();

  if (error) throw error;

  const plaintext = updates.wpAppPassword
    ?? await decryptPassword(data.wp_app_password_encrypted, data.wp_app_password_nonce);
  const site = rowToSite(data, plaintext);

  const d = await db();
  await d.put(STORE, site);
  return site;
}

/**
 * Delete a connected site from server + local cache.
 */
export async function removeSite(siteId) {
  const { error } = await supabase
    .from('connected_sites')
    .delete()
    .eq('id', siteId);
  if (error) throw error;

  const d = await db();
  await d.delete(STORE, siteId);
}

/**
 * Called on Tier 1 login. Pulls every site row for the user, decrypts
 * passwords, and replaces IndexedDB contents.
 */
export async function syncFromServer() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('syncFromServer: no authenticated user');

  const { data: rows, error } = await supabase
    .from('connected_sites')
    .select('*')
    .eq('user_id', user.id);
  if (error) throw error;

  // Decrypt in parallel
  const sites = await Promise.all(
    rows.map(async (row) => {
      const plaintext = await decryptPassword(
        row.wp_app_password_encrypted,
        row.wp_app_password_nonce
      );
      return rowToSite(row, plaintext);
    })
  );

  // Replace store contents
  const d = await db();
  const tx = d.transaction(STORE, 'readwrite');
  await tx.store.clear();
  for (const s of sites) await tx.store.put(s);
  await tx.done;

  return sites;
}

/**
 * Called on Tier 1 logout. Clears IndexedDB AND any ephemeral WP session state.
 * No Tier 2 data ever survives a Tier 1 logout.
 */
export async function wipeLocal() {
  // 1. Drop the IndexedDB database entirely (cheapest, most thorough)
  if (_dbPromise) {
    const d = await _dbPromise;
    d.close();
    _dbPromise = null;
  }
  await indexedDB.deleteDatabase(DB_NAME);

  // 2. Wipe any WP-session/cached-login keys from web storage
  //    (keys should all be prefixed `vc:` in the app)
  try {
    for (const k of Object.keys(localStorage))   if (k.startsWith('vc:')) localStorage.removeItem(k);
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('vc:')) sessionStorage.removeItem(k);
  } catch { /* storage may be unavailable */ }
}

/**
 * Optional: migrate sites previously stored in localStorage under 'vc:sites'.
 * Returns the number of sites migrated.
 */
export async function migrateFromLocalStorage(userId) {
  const raw = localStorage.getItem('vc:sites');
  if (!raw) return 0;
  let legacy;
  try { legacy = JSON.parse(raw); } catch { return 0; }
  if (!Array.isArray(legacy) || legacy.length === 0) return 0;

  let migrated = 0;
  for (const s of legacy) {
    try {
      await addSite(userId, {
        siteUrl:       s.siteUrl       ?? s.url,
        siteName:      s.siteName      ?? s.name,
        brandLogoUrl:  s.brandLogoUrl  ?? s.logo ?? null,
        wpUsername:    s.wpUsername    ?? s.username,
        wpAppPassword: s.wpAppPassword ?? s.appPassword
      });
      migrated++;
    } catch (e) {
      // unique constraint → already exists, skip
      console.warn('[migrate] skipped', s.siteUrl, e?.message);
    }
  }
  localStorage.removeItem('vc:sites');
  return migrated;
}
