/**
 * Shared utilities for the FC Event Manager app.
 */

import { SITE_REGISTRY } from '../config/siteRegistry';

// ── HTML Entity Decoding ─────────────────────────────────────

const ENTITY_MAP = {
  '&amp;':   '&',
  '&lt;':    '<',
  '&gt;':    '>',
  '&quot;':  '"',
  '&#039;':  "'",
  '&#39;':   "'",
  '&apos;':  "'",
  '&#038;':  '&',
  '&ndash;': '–',
  '&mdash;': '—',
  '&times;': '×',
  '&hellip;':'…',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&rdquo;': '\u201D',
  '&ldquo;': '\u201C',
  '&nbsp;':  ' ',
};

const ENTITY_RE = /&(?:#(?:0*(\d{1,5})|x([0-9a-fA-F]{1,4}))|[a-z]+);/gi;

/**
 * Decode common HTML entities + numeric character references.
 * Falls back to input string if nothing matches.
 */
export function decodeHtml(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(ENTITY_RE, (match, dec, hex) => {
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return ENTITY_MAP[match] || match;
  });
}

// ── Site Logo Resolution ─────────────────────────────────────

/**
 * Resolve a site's logo with fallback through the registry.
 * Priority: site.logo → registry match by slug → registry match by domain
 */
export function resolveSiteLogo(site) {
  if (site.logo) return site.logo;

  // Try by registrySlug
  if (site.registrySlug) {
    const reg = SITE_REGISTRY.find(r => r.slug === site.registrySlug);
    if (reg?.logo) return reg.logo;
  }

  // Try by domain match
  try {
    const hostname = new URL(site.url).hostname.replace(/^www\./, '');
    const reg = SITE_REGISTRY.find(r => r.domain === hostname);
    if (reg?.logo) return reg.logo;
  } catch { /* ignore */ }

  return null;
}

// ── Site Display Name ────────────────────────────────────────

/**
 * Get a clean display name for a site (decoded HTML entities).
 */
export function siteName(site) {
  return decodeHtml(site.name);
}
