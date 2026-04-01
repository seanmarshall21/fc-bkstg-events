/**
 * Site Registry — master catalog of all managed brands.
 *
 * Each entry defines the site's WP REST base URL, logo asset,
 * available modules, and any special flags. The app uses this
 * to populate the site-picker and scope module visibility.
 *
 * Logos live in /public/logos/{slug}.png — square, ≥192px.
 * Module keys must match MODULES in src/api/endpoints.js.
 */

// ── Module Presets ────────────────────────────────────────────
// Reusable module sets to keep config DRY

const FESTIVAL_MODULES = [
  'artists',
  'lineup',
  'sponsors',
  'events',
  'styles',
  'confidential',
  'genres',
  'stages',
];

const PRESENTER_MODULES = [
  'artists',
  'events',
  'styles',
  'genres',
];

const RODEO_MODULES = [
  'contestants', // unique to rodeo
  'sponsors',
  'events',
  'styles',
  'confidential',
];

const AGENCY_MODULES = [
  'artists',
  'events',
  'genres',
];

// ── Site Categories ───────────────────────────────────────────

export const SITE_CATEGORIES = {
  festivals: 'Festivals',
  presenters: 'Presenters',
  venues: 'Venues',
  agency: 'Agency',
};

// ── Registry ──────────────────────────────────────────────────

export const SITE_REGISTRY = [
  // ── Festivals ─────────────────────────────────────────────
  {
    slug: 'crssd-fest',
    name: 'CRSSD Fest',
    domain: 'crssdfest.com',
    url: 'https://crssdfest.com',
    logo: '/logos/crssd-fest.png',
    category: 'festivals',
    modules: FESTIVAL_MODULES,
    sponsorshipPath: '/sponsorships',
  },
  {
    slug: 'proper-nye',
    name: 'Proper NYE',
    domain: 'propernye.com',
    url: 'https://propernye.com',
    logo: '/logos/proper-nye.png',
    category: 'festivals',
    modules: FESTIVAL_MODULES,
    sponsorshipPath: '/sponsorships',
  },
  {
    slug: 'under-the-big-sky',
    name: 'Under the Big Sky',
    domain: 'underthebigskyfest.com',
    url: 'https://underthebigskyfest.com',
    logo: '/logos/utbs.png',
    category: 'festivals',
    modules: FESTIVAL_MODULES,
    sponsorshipPath: '/sponsorships',
  },
  {
    slug: 'wild-horses',
    name: 'Wild Horses',
    domain: 'wildhorsesfest.com',
    url: 'https://wildhorsesfest.com',
    logo: '/logos/wild-horses.png',
    category: 'festivals',
    modules: FESTIVAL_MODULES,
    sponsorshipPath: '/sponsorships',
  },
  {
    slug: 'san-diego-rodeo',
    name: 'San Diego Rodeo',
    domain: 'rodeosd.com',
    url: 'https://rodeosd.com',
    logo: '/logos/sd-rodeo.png',
    category: 'festivals',
    modules: RODEO_MODULES,
    sponsorshipPath: '/sponsorships',
  },

  // ── Presenters ────────────────────────────────────────────
  {
    slug: 'crssd',
    name: 'CRSSD',
    domain: 'crssd.com',
    url: 'https://crssd.com',
    logo: '/logos/crssd.png',
    category: 'presenters',
    modules: PRESENTER_MODULES,
  },
  {
    slug: 'outriders-present',
    name: 'Outriders Present',
    domain: 'outriderspresent.com',
    url: 'https://outriderspresent.com',
    logo: '/logos/outriders-present.png',
    category: 'presenters',
    modules: PRESENTER_MODULES,
  },
  {
    slug: 'led-presents',
    name: 'LED Presents',
    domain: 'ledpresents.com',
    url: 'https://ledpresents.com',
    logo: '/logos/led-presents.png',
    category: 'presenters',
    modules: PRESENTER_MODULES,
  },

  // ── Venues ────────────────────────────────────────────────
  {
    slug: 'majestic-valley-arena',
    name: 'Majestic Valley Arena',
    domain: 'majesticmt.com',
    url: 'https://majesticmt.com',
    logo: '/logos/majestic-valley-arena.png',
    category: 'venues',
    modules: PRESENTER_MODULES,
    disabled: true, // not set up yet
  },

  // ── Agency ────────────────────────────────────────────────
  {
    slug: 'zoo-agency',
    name: 'Zoo Agency',
    domain: 'zooagency.com',
    url: 'https://zooagency.com',
    logo: '/logos/zoo-agency.png',
    category: 'agency',
    modules: AGENCY_MODULES,
  },
];

// ── Helpers ───────────────────────────────────────────────────

/** Find a registry entry by slug */
export const getRegistrySite = (slug) =>
  SITE_REGISTRY.find((s) => s.slug === slug) || null;

/** Get all enabled sites (excludes disabled) */
export const getEnabledSites = () =>
  SITE_REGISTRY.filter((s) => !s.disabled);

/** Group sites by category */
export const getSitesByCategory = () => {
  const grouped = {};
  for (const site of getEnabledSites()) {
    const cat = site.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(site);
  }
  return grouped;
};
