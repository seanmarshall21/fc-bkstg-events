/**
 * VC API Endpoint Definitions
 *
 * Maps all available endpoints from both the custom vc/v1 namespace
 * and the standard wp/v2 namespace for CRUD operations.
 */

// ── Custom Read Endpoints (vc/v1) ──────────────────────────────

export const VC_ENDPOINTS = {
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
  // Partnership page (page template, not CPT)
  partnership: {
    list:   '/vc/v1/partnership',
    single: (id) => `/vc/v1/partnership/${id}`,
    schema: '/vc/v1/partnership/schema',
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
    import: '/vc/v1/import-events',
    sheetUrl: '/vc/v1/import-sheet-url',
  },
  artists: {
    list: '/wp/v2/vc_artist',
    single: (id) => `/wp/v2/vc_artist/${id}`,
    import: '/vc/v1/import-artists',
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
  pages: {
    list:   '/wp/v2/pages',
    single: (id) => `/wp/v2/pages/${id}`,
  },
  genres: {
    list: '/wp/v2/vc_genre',
    single: (id) => `/wp/v2/vc_genre/${id}`,
  },
  stages: {
    list: '/vc/v1/stages',
    single: (id) => `/vc/v1/stages/${id}`,
  },
  sponsorTiers: {
    list: '/wp/v2/vc_sponsor_tier',
    single: (id) => `/wp/v2/vc_sponsor_tier/${id}`,
  },
  afterdarks: {
    list: '/wp/v2/after-darks',
    single: (id) => `/wp/v2/after-darks/${id}`,
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

// Module icon paths — grad-desat series lives in public/icons/mod-icns/.
// Each entry has svgIcon (custom SVG) + icon (Lucide fallback key).
export const MODULES = {
  artists: {
    key: 'artists',
    label: 'Artists',
    description: 'Manage artist profiles, bios, and booking status',
    icon: 'Music',
    svgIcon: '/icons/mod-icns/module-icn-artists-grad-desat.svg',
    color: 'from-purple-900/40 to-purple-950/20',
    border: 'border-purple-700/40',
  },
  lineup: {
    key: 'lineup',
    label: 'Lineup',
    description: 'Stage assignments, set times, and billing',
    icon: 'ListMusic',
    svgIcon: '/icons/mod-icns/module-icn-lineup-grad-desat.svg',
    color: 'from-blue-900/40 to-blue-950/20',
    border: 'border-blue-700/40',
  },
  sponsors: {
    key: 'sponsors',
    label: 'Sponsors',
    description: 'Sponsor tiers, logos, and activation details',
    icon: 'Handshake',
    svgIcon: '/icons/mod-icns/module-icn-spon-grad-desat.svg',
    color: 'from-emerald-900/40 to-emerald-950/20',
    border: 'border-emerald-700/40',
  },
  events: {
    key: 'events',
    label: 'Events',
    description: 'Event properties, dates, and relationships',
    icon: 'Calendar',
    svgIcon: '/icons/mod-icns/module-icn-events-grad-desat.svg',
    color: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/40',
  },
  styles: {
    key: 'styles',
    label: 'Event Styles',
    description: 'Colors, logos, textures, and brand tokens',
    icon: 'Palette',
    svgIcon: '/icons/mod-icns/module-icn-styles-grad-desat.svg',
    color: 'from-rose-900/40 to-rose-950/20',
    border: 'border-rose-700/40',
  },
  confidential: {
    key: 'confidential',
    label: 'Confidentiality',
    description: 'Announce phases and visibility controls',
    icon: 'ShieldCheck',
    svgIcon: '/icons/mod-icns/module-icn-conf-grad-desat.svg',
    color: 'from-red-900/40 to-red-950/20',
    border: 'border-red-700/40',
  },
  genres: {
    key: 'genres',
    label: 'Genres',
    description: 'Genre taxonomy management',
    icon: 'Tags',
    svgIcon: '/icons/mod-icns/module-icn-genres-grad-desat.svg',
    color: 'from-cyan-900/40 to-cyan-950/20',
    border: 'border-cyan-700/40',
  },
  stages: {
    key: 'stages',
    label: 'Stages',
    description: 'Stage taxonomy and event assignments',
    icon: 'LayoutGrid',
    svgIcon: '/icons/mod-icns/module-icn-stages-grad-desat.svg',
    color: 'from-indigo-900/40 to-indigo-950/20',
    border: 'border-indigo-700/40',
  },
  contestants: {
    key: 'contestants',
    label: 'Contestants',
    description: 'Rodeo contestant profiles and participation',
    icon: 'Users',
    svgIcon: null, // no grad-desat version — falls back to Lucide
    color: 'from-amber-900/40 to-amber-950/20',
    border: 'border-amber-700/40',
  },
  partnership: {
    key: 'partnership',
    label: 'Partnership',
    description: 'Partnership page content, tiers, and sponsor presentation',
    icon: 'Handshake',
    color: 'from-violet-900/40 to-violet-950/20',
    border: 'border-violet-700/40',
  },
};
