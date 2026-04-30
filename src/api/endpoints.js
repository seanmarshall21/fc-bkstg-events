/**
 * VC API Endpoint Definitions
 *
 * Maps all available endpoints from both the custom vc/v1 namespace
 * and the standard wp/v2 namespace for CRUD operations.
 */

// ── Custom Read Endpoints (vc/v1) ──────────────────────────────

export const VC_ENDPOINTS = {
  // CSV Import + Google Sheet sync
  importer: {
    sheetUrl: '/vc/v1/import-sheet-url',   // GET + POST — stores URL in WP option
    import:   '/vc/v1/import-events',       // POST — accepts { rows: [] }
  },
  // Artists
  artists: {
    list: '/vc/v1/artists',
    single: (id) => `/vc/v1/artists/${id}`,
  },
  genres: {
    list: '/vc/v1/genres',
  },
  // Lineup
  lineup: {
    full: '/vc/v1/lineup',
    days: '/vc/v1/lineup/days',
    stages: '/vc/v1/lineup/stages',
  },
  // Contestants (reuses vc_artist CPT — rodeo-specific alias)
  contestants: {
    list: '/vc/v1/artists',
    single: (id) => `/vc/v1/artists/${id}`,
  },
  // Sponsors
  sponsors: {
    list: '/vc/v1/sponsors',
    single: (id) => `/vc/v1/sponsors/${id}`,
    tiers: '/vc/v1/sponsor-tiers',
  },
  // Event Styles
  eventStyles: {
    full: (id) => `/vc/v1/event-styles/${id}`,
    properties: (id) => `/vc/v1/event-styles/${id}/properties`,
    logos: (id) => `/vc/v1/event-styles/${id}/logos`,
    textures: (id) => `/vc/v1/event-styles/${id}/textures`,
  },
};

// ── WP REST CRUD Endpoints (wp/v2) ─────────────────────────────

export const WP_ENDPOINTS = {
  events: {
    list: '/wp/v2/vc_event_property',
    single: (id) => `/wp/v2/vc_event_property/${id}`,
  },
  artists: {
    list: '/wp/v2/vc_artist',
    single: (id) => `/wp/v2/vc_artist/${id}`,
  },
  // Contestants (alias for vc_artist — rodeo sites)
  contestants: {
    list: '/wp/v2/vc_artist',
    single: (id) => `/wp/v2/vc_artist/${id}`,
  },
  lineupSlots: {
    list: '/wp/v2/vc_lineup_slot',
    single: (id) => `/wp/v2/vc_lineup_slot/${id}`,
  },
  sponsors: {
    list: '/wp/v2/vc_sponsor',
    single: (id) => `/wp/v2/vc_sponsor/${id}`,
  },
  genres: {
    list: '/wp/v2/genre',
    single: (id) => `/wp/v2/genre/${id}`,
  },
  stages: {
    list: '/wp/v2/stage',
    single: (id) => `/wp/v2/stage/${id}`,
  },
  sponsorTiers: {
    list: '/wp/v2/sponsor-tier',
    single: (id) => `/wp/v2/sponsor-tier/${id}`,
  },
  media: {
    list: '/wp/v2/media',
    single: (id) => `/wp/v2/media/${id}`,
  },
  users: {
    me: '/wp/v2/users/me',
  },
};

// ── Module Config ──────────────────────────────────────────────
// Defines all available content modules for the tile grid.
// Each module maps to a route, icon, and description.

export const MODULES = {
  artists: {
    key: 'artists',
    label: 'Artists',
    description: 'Manage artist profiles, bios, and booking status',
    icon: 'Music',
    svgIcon: '/icons/aster-lt.svg',
    color: 'from-purple-900/40 to-purple-950/20',
    border: 'border-purple-700/40',
  },
  lineup: {
    key: 'lineup',
    label: 'Lineup',
    description: 'Stage assignments, set times, and billing',
    icon: 'ListMusic',
    svgIcon: '/icons/sound-lt.svg',
    color: 'from-blue-900/40 to-blue-950/20',
    border: 'border-blue-700/40',
  },
  sponsors: {
    key: 'sponsors',
    label: 'Sponsors',
    description: 'Sponsor tiers, logos, and activation details',
    icon: 'Handshake',
    color: 'from-emerald-900/40 to-emerald-950/20',
    border: 'border-emerald-700/40',
  },
  events: {
    key: 'events',
    label: 'Events',
    description: 'Event properties, dates, and relationships',
    icon: 'Calendar',
    svgIcon: '/icons/starglobe-lt.svg',
    color: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/40',
  },
  styles: {
    key: 'styles',
    label: 'Event Styles',
    description: 'Colors, logos, textures, and brand tokens',
    icon: 'Palette',
    svgIcon: '/icons/sun-lt.svg',
    color: 'from-rose-900/40 to-rose-950/20',
    border: 'border-rose-700/40',
  },
  confidential: {
    key: 'confidential',
    label: 'Confidentiality',
    description: 'Announce phases and visibility controls',
    icon: 'ShieldCheck',
    color: 'from-red-900/40 to-red-950/20',
    border: 'border-red-700/40',
  },
  genres: {
    key: 'genres',
    label: 'Genres',
    description: 'Genre taxonomy management',
    icon: 'Tags',
    color: 'from-cyan-900/40 to-cyan-950/20',
    border: 'border-cyan-700/40',
  },
  stages: {
    key: 'stages',
    label: 'Stages',
    description: 'Stage taxonomy and event assignments',
    icon: 'LayoutGrid',
    color: 'from-indigo-900/40 to-indigo-950/20',
    border: 'border-indigo-700/40',
  },
  contestants: {
    key: 'contestants',
    label: 'Contestants',
    description: 'Rodeo contestant profiles and participation',
    icon: 'Users',
    color: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/40',
  },
};
