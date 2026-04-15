/**
 * useSchema — fetches and caches ACF schema for a given post type.
 *
 * Usage:
 *   const { schema, loading, error, refresh } = useSchema('vc_artist');
 *
 * Schema shape (from /wp-json/vc/v1/schema/{post_type}):
 *   {
 *     post_type: 'vc_artist',
 *     label: 'Artist',
 *     groups: [{ key, title, fields: [...] }],
 *     generated: '2026-04-05T...'
 *   }
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Module-level cache — persists across component mounts within a session
const schemaCache = new Map();
const inflight = new Map();

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function useSchema(postType, options = {}) {
  const {
    apiBase = '/wp-json/vc/v1',
    nonce = (typeof window !== 'undefined' && window.vcEmConfig?.nonce) || null,
    ttl = DEFAULT_TTL,
    enabled = true,
    skip = false,        // alias: skip=true === enabled=false
    username = null,
    appPassword = null,
  } = options;

  const isEnabled = enabled && !skip;

  const [schema, setSchema] = useState(() => {
    const cached = schemaCache.get(postType);
    if (cached && Date.now() - cached.fetchedAt < ttl) return cached.data;
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSchema = useCallback(async ({ force = false } = {}) => {
    if (!postType || !isEnabled) return;

    const cached = schemaCache.get(postType);
    if (!force && cached && Date.now() - cached.fetchedAt < ttl) {
      setSchema(cached.data);
      return cached.data;
    }

    // De-dupe concurrent fetches for same post type
    if (inflight.has(postType)) {
      try {
        const data = await inflight.get(postType);
        if (mountedRef.current) setSchema(data);
        return data;
      } catch (err) {
        if (mountedRef.current) setError(err);
        throw err;
      }
    }

    // Guard: never fire a schema fetch against the relative base without credentials.
    // This prevents a timing race where activeSite exists but credentials haven't
    // loaded yet, which would fire an unauthenticated request.
    const isRelativeBase = !apiBase || apiBase.startsWith('/');
    if (isRelativeBase && !username && !appPassword && !nonce) {
      return;
    }

    setLoading(true);
    setError(null);

    const url = `${apiBase}/schema/${encodeURIComponent(postType)}${force ? '?refresh=1' : ''}`;
    const headers = { 'Content-Type': 'application/json' };
    if (nonce) headers['X-WP-Nonce'] = nonce;
    if (username && appPassword) {
      headers['Authorization'] = 'Basic ' + btoa(`${username}:${appPassword}`);
    }

    // NOTE: No `credentials: 'include'` — we use Basic Auth headers, not cookies.
    // credentials:include on cross-origin requests requires the server to return
    // Access-Control-Allow-Credentials:true, which WP doesn't set by default,
    // causing iOS Safari to silently drop the response.
    const promise = fetch(url, {
      method: 'GET',
      headers,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Schema fetch failed (${res.status}): ${body}`);
      }
      return res.json();
    });

    inflight.set(postType, promise);

    try {
      const data = await promise;
      schemaCache.set(postType, { data, fetchedAt: Date.now() });
      if (mountedRef.current) {
        setSchema(data);
        setLoading(false);
      }
      return data;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
      }
      throw err;
    } finally {
      inflight.delete(postType);
    }
  // username + appPassword included — stale closure would send wrong auth header
  }, [postType, apiBase, nonce, ttl, isEnabled, username, appPassword]);

  useEffect(() => {
    if (!schema && isEnabled) {
      fetchSchema().catch(() => {});
    }
  }, [postType, isEnabled, fetchSchema, schema]);

  const refresh = useCallback(() => fetchSchema({ force: true }), [fetchSchema]);

  // Derived conveniences — WP plugin returns 'groups', not 'field_groups'
  // useMemo ensures stable array ref across renders — prevents fetchArtist from
  // re-creating every render and resetting form state via its useEffect dependency.
  const fields = useMemo(() => flattenSchemaFields(schema), [schema]);
  const restBase = schema?.rest_base || postType;

  return { schema, fields, restBase, loading, error, refresh };
}

/**
 * Flatten all fields across groups into a single flat array.
 * Useful when you want to render all fields in one form without section headers.
 */
export function flattenSchemaFields(schema) {
  if (!schema?.groups) return [];
  return schema.groups.reduce(
    (acc, group) => acc.concat(group.fields || []),
    []
  );
}

/**
 * Find a field by its `name` (slug) anywhere in the schema, including
 * nested sub_fields inside groups/repeaters.
 */
export function findFieldByName(schema, name) {
  if (!schema?.groups) return null;
  const walk = (fields) => {
    for (const f of fields) {
      if (f.name === name) return f;
      if (f.sub_fields?.length) {
        const nested = walk(f.sub_fields);
        if (nested) return nested;
      }
    }
    return null;
  };
  for (const g of schema.groups) {
    const found = walk(g.fields || []);
    if (found) return found;
  }
  return null;
}

/**
 * Manually clear the in-memory schema cache (e.g., after a logout or auth switch).
 */
export function clearSchemaCache(postType) {
  if (postType) {
    schemaCache.delete(postType);
  } else {
    schemaCache.clear();
  }
}

/**
 * Build a default values object from a flat array of schema fields.
 * Used to initialise form state for new records.
 */
export function buildDefaultValues(fields) {
  const defaults = {};
  for (const field of fields) {
    switch (field.type) {
      case 'number':
      case 'range':
        defaults[field.name] = field.default_value ?? 0;
        break;
      case 'true_false':
        defaults[field.name] = field.default_value ?? false;
        break;
      case 'checkbox':
        defaults[field.name] = [];
        break;
      case 'repeater':
        defaults[field.name] = [];
        break;
      case 'group':
        defaults[field.name] = {};
        break;
      case 'image':
      case 'file':
        defaults[field.name] = null;
        break;
      default:
        defaults[field.name] = field.default_value ?? '';
    }
  }
  return defaults;
}

/**
 * Extract form values from a WP ACF response object using schema field definitions.
 * Falls back to field default when the ACF key is absent.
 */
export function extractValues(fields, acf) {
  const values = {};
  for (const field of fields) {
    values[field.name] = field.name in acf
      ? acf[field.name]
      : (field.default_value ?? '');
  }
  return values;
}

/**
 * Build an ACF-compatible payload from form values, filtered to only
 * keys that exist in the schema. Safe to POST directly as the `acf` property.
 *
 * Normalizes post_object and taxonomy values to IDs — ACF's update_callback
 * expects integer IDs, not full post/term objects.
 */
export function buildAcfPayload(fields, values) {
  const payload = {};
  for (const field of fields) {
    if (!(field.name in values)) continue;
    let val = values[field.name];

    if (field.type === 'post_object' || field.type === 'relationship') {
      // Extract post ID(s) from object(s)
      if (Array.isArray(val)) {
        val = val.map(v => (v && typeof v === 'object') ? (v.ID || v.id) : v).filter(Boolean);
      } else if (val && typeof val === 'object') {
        val = val.ID || val.id || null;
      }
    }

    if (field.type === 'taxonomy') {
      // Extract term ID(s) from object(s)
      if (Array.isArray(val)) {
        val = val.map(v => (v && typeof v === 'object') ? v.id : v).filter(Boolean);
      } else if (val && typeof val === 'object') {
        val = val.id || null;
      }
    }

    payload[field.name] = val;
  }
  return payload;
}

export default useSchema;
