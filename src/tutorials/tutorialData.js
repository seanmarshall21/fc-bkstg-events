// Central registry for all tutorial metadata and dynamic imports.
// Both TutorialsPage and TutorialContext import from here.

export const TUTORIAL_IMPORTS = {
  '01-login':        () => import('./01-login.html?raw'),
  '02-add-site':     () => import('./02-add-site.html?raw'),
  '03-modules':      () => import('./03-modules.html?raw'),
  '04-visibility':   () => import('./04-visibility.html?raw'),
  '05-publishing':   () => import('./05-publishing.html?raw'),
  '06-add-event':    () => import('./06-add-event.html?raw'),
  '07-artists':      () => import('./07-artists.html?raw'),
  '08-photos':       () => import('./08-photos.html?raw'),
  '09-taxonomies':   () => import('./09-taxonomies.html?raw'),
  '10-csv-import':   () => import('./10-csv-import.html?raw'),
  '11-event-phases': () => import('./11-event-phases.html?raw'),
};

export const TUTORIAL_META = {
  '01-login':        { id: '01-login',        title: 'Logging In',                     desc: 'Create an account and sign in for the first time.',              icon: '🔐' },
  '02-add-site':     { id: '02-add-site',      title: 'Adding a Site',                  desc: 'Connect a WordPress site using an Application Password.',        icon: '🔗' },
  '03-modules':      { id: '03-modules',       title: 'Home Screen & Modules',          desc: 'Understand the dashboard and toggle module visibility.',         icon: '🏠' },
  '04-visibility':   { id: '04-visibility',    title: 'Visibility & Confidential Mode', desc: 'Hide sensitive internal fields from view with one toggle.',      icon: '👁' },
  '05-publishing':   { id: '05-publishing',    title: 'Publishing Items',               desc: 'Draft vs. Published status and how to go live.',                 icon: '🟢' },
  '06-add-event':    { id: '06-add-event',     title: 'Adding Events',                  desc: 'Create a new event property and set it as active.',              icon: '📅' },
  '07-artists':      { id: '07-artists',       title: 'Adding & Editing Artists',       desc: 'Fields, genres, social links, and internal notes.',             icon: '🎤' },
  '08-photos':       { id: '08-photos',        title: 'Photo Uploads',                  desc: 'Upload photos directly to WordPress from the app.',             icon: '🖼' },
  '09-taxonomies':   { id: '09-taxonomies',    title: 'Tags & Taxonomies',              desc: 'Manage genres and stages used across all content.',             icon: '🏷' },
  '10-csv-import':   { id: '10-csv-import',    title: 'CSV Import',                     desc: 'Bulk-import artists from a spreadsheet.',                       icon: '📥' },
  '11-event-phases': { id: '11-event-phases',  title: 'Event Phases',                   desc: 'Advance an event through its lifecycle from Planning to Archived.', icon: '📶' },
};

// Maps route pathnames to their contextual tutorial.
// Layout reads this to render the ? help button.
// TutorialContext reads this for first-visit prompts.
export const ROUTE_TUTORIAL_MAP = {
  '/':               TUTORIAL_META['03-modules'],
  '/artists':        TUTORIAL_META['07-artists'],
  '/artists/import': TUTORIAL_META['10-csv-import'],
  '/events':         TUTORIAL_META['06-add-event'],
  '/events/import':  TUTORIAL_META['10-csv-import'],
  '/lineup':         TUTORIAL_META['05-publishing'],
  '/genres':         TUTORIAL_META['09-taxonomies'],
  '/stages':         TUTORIAL_META['09-taxonomies'],
  '/settings':       TUTORIAL_META['02-add-site'],
};

// Ordered list for TutorialsPage generic list
export const GENERIC_TUTORIALS = Object.values(TUTORIAL_META);
