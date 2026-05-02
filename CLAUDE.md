# FC Events Backstage — VC Event Manager PWA

Live: https://fcevents.netlify.app  
Managed by: Sean Marshall (Vivo Creative)  
Brands: CRSSD, Proper NYE, UTBS, Wild Horses, SD Rodeo, LED, Outriders

---

## Build & Deploy Workflow

**Source repo:** `vc-event-manager` (this repo — commit src/ changes here)  
**Deploy repo:** `seanmarshall21/fc-bkstg-events` → Netlify auto-deploys from `main`

### Standard workflow (src/ changes only)

```bash
# 1. Make changes in vc-event-manager/src/
# 2. Commit to vc-event-manager:
cd ~/Documents/GitHub/vc-event-manager
git add src/<changed-files>
git commit -m "feat: description"
git push

# 3. Sync changed src/ files to deploy repo:
cp ~/Documents/GitHub/vc-event-manager/src/<file> ~/Documents/GitHub/fc-bkstg-events/src/<file>

# 4. Commit and push deploy repo (Netlify builds automatically):
cd ~/Documents/GitHub/fc-bkstg-events
git add src/<changed-files>
git commit -m "feat: description"
git push
```

Netlify runs `npm run build` from fc-bkstg-events and serves from `build/` (gitignored). **Do NOT commit build artifacts** to fc-bkstg-events — Netlify handles the build.

### ⚠️ RETIRED: old static bundle workflow
~~`cp -r vc-event-manager/build/. fc-bkstg-events/`~~ — This committed built bundles to the repo root and served them statically. **Do not use.** Netlify now builds from source via `netlify.toml`. Any feature not committed to `src/` will be lost on the next deploy.

**Stale lock cleanup** (run if git errors on index.lock or HEAD.lock):
```bash
rm ~/Documents/GitHub/vc-event-manager/.git/index.lock 2>/dev/null
rm ~/Documents/GitHub/vc-event-manager/.git/HEAD.lock 2>/dev/null
rm ~/Documents/GitHub/fc-bkstg-events/.git/index.lock 2>/dev/null
rm ~/Documents/GitHub/fc-bkstg-events/.git/HEAD.lock 2>/dev/null
```

**PWA cache:** After a deploy, clear site data or delete + re-add the home screen icon to pick up new bundles.

---

## Stack

- React + Vite + Tailwind CSS
- Supabase — Tier 1 auth (hub login) + `connected_sites` table (per-site WP credentials)
- WordPress REST API via `vc-event-properties` plugin — Tier 2 per-site content CRUD
- PWA — installable on iOS/Android/desktop via Add to Home Screen
- Netlify — auto-deploys from `main` branch of `seanmarshall21/fc-bkstg-events`

---

## Module Structure

```
src/
  modules/
    artists/        ArtistList.jsx, ArtistDetail.jsx, ImportArtists.jsx
    lineup/         LineupList.jsx, LineupDetail.jsx
    sponsors/       SponsorList.jsx, SponsorDetail.jsx
    events/         EventList.jsx, EventDetail.jsx, ImportEvents.jsx
                    ZooEventList.jsx, ZooEventDetail.jsx
    afterdarks/     AfterDarkList.jsx, AfterDarkDetail.jsx  ← CRSSD-specific
    confidential/   ConfidentialView.jsx
    contestants/    ContestantList.jsx, ContestantDetail.jsx  ← rodeo-specific
    genres/         GenreList.jsx
    stages/         StageList.jsx
    styles/         StylesView.jsx
  components/
    ui/             FieldEditor.jsx, SchemaFields.jsx, ContentList.jsx
    DraggableList.jsx, EventSelector.jsx, UpdateToast.jsx
    ArchiveEventDialog.jsx, PhotoUpload.jsx
    HomePage.jsx, SiteDashboard.jsx, SettingsPage.jsx
    SearchPage.jsx, FavoritesPage.jsx, TutorialsPage.jsx, Layout.jsx
  hooks/            useSchema, useActiveEvent, useEventScopedContent,
                    useDragReorder, useServiceWorkerUpdate, useFavorites, useStore
  services/         connectedSitesService, mediaUploadService
  auth/             AuthContext.jsx, ProfileSync.js, LoginPage.jsx, WelcomePage.jsx
  api/              endpoints.js (WP_ENDPOINTS, VC_ENDPOINTS, MODULES)
  config/           siteRegistry.js, supabase.js
  utils/            helpers.js
  context/          TutorialContext.jsx
supabase/
  migrations/       SQL schema
```

---

## Schema-Driven Pattern (Critical)

ACF fields are **not hardcoded** in React. `FieldEditor` fetches schema from:

```
GET /wp-json/vc/v1/schema/{post_type}
```

and renders fields dynamically. Adding a field in ACF on any site → it appears in the app automatically. **Never hardcode field definitions in React components.**

`SchemaFields.jsx` handles all field type rendering via `FIELD_MAP`. `useSchema` hook manages fetch + caching.

**Tab field handling:** ACF `tab` type fields are UI-only (no data). `FieldEditor` intercepts them via `groupFieldsByTabs()` and renders an interactive sticky tab bar. Tabs have a sticky bar that docks below the top nav and auto-scrolls to top on tab switch. `SchemaFields.jsx` also has `tab: TabField` as a safety net.

---

## Two-Tier Auth

| Tier | System | Purpose |
|---|---|---|
| 1 | Supabase | Master hub login, required for app access |
| 2 | WP App Passwords | Per-site credentials, stored in Supabase `connected_sites` table |

- Sign out wipes all local state (IndexedDB via `useStore`)
- Sign in hydrates connected sites from Supabase (`ProfileSync.js`)
- `AuthContext` exposes `getClient()` (WP REST client for active site) and `activeSite`
- `activeSite.registrySlug` drives per-brand component branching (e.g. `'zoo-agency'` → `ZooEventDetail`)
- `activeSite.modules` — ordered array of module keys for this site; controls tile order + visibility in dashboard

---

## Module Config (`MODULES` in endpoints.js)

Each module entry: `{ key, label, description, icon, svgIcon?, color, border }`.

Module order on the dashboard is driven entirely by `activeSite.modules` array order (saved via `updateSiteModules` in settings). `SiteDashboard` maps that array to module configs — do NOT use `Object.values(MODULES)` for display order.

**Adding a module:** add entry to `MODULES`, add route in `App.jsx`, add color in `SiteDashboard.MODULE_COLORS`.

---

## Event Phase System

`vc_event_property` carries an `event_phase` ACF field cycling through:

```
planning → save-the-date → lineup-phase-1 → presale → onsale →
lineup-phase-2 → set-times-live → event-day → post-event → archived
```

Phase fields (`event_phase`, `event_phase_changed_at`, `event_phase_log`) are registered programmatically in `VC_Event_Phases::register_phase_fields()` in the plugin. They appear in the app under an "Event Phase" tab in EventDetail. Phase transitions fire via `POST /vc/v1/event/{id}/phase`.

- `EventSelector` scopes all list views to the active event
- Planning mode toggle surfaces upcoming events
- Archive action sets phase to `archived` and drafts unique items

---

## Companion Repo — WP Plugin

https://github.com/seanmarshall21/vc-event-properties  
Current version: **2.6.4**

CPTs: `vc_event_property`, `vc_artist`, `vc_lineup_slot`, `vc_sponsor`

**ACF field groups** (all 8 are programmatically registered via `acf_add_local_field_group()` on `acf/init` at priority 1):
- `group_event_property`, `group_event_property_fields` — core event fields
- `group_artist` — artist fields
- `group_lineup_slot` — lineup slot fields
- `group_sponsor` — sponsor fields
- `group_event_styles` — brand token fields
- `group_confidential_items` — per-item phase assignment
- `group_confidential_phases` — announce phase definitions (5 per-section statuses per phase)

No manual ACF sync needed on any site — plugin push automatically overrides DB versions.

**Plugin deploy method — manual ZIP upload (Git Updater broken on DreamHost):**

Git Updater is installed on all sites but DreamHost blocks outbound PHP API calls to `api.github.com`, so auto-updates don't work. Deploy manually:

1. Go to `github.com/seanmarshall21/vc-event-properties` → Code → Download ZIP
2. Unzip locally — go inside `vc-event-properties-main/` and ZIP the inner `vc-event-properties/` folder
3. WP Admin → Plugins → Add New → Upload Plugin → upload that inner ZIP → Replace current
4. Settings → Permalinks → Save Changes (always flush after plugin update)

**After updating — always flush permalinks** (Settings → Permalinks → Save Changes). Required to register the `event-manager` CPT slug and clear any stale rewrite rules.

REST endpoints:
- `GET /wp-json/vc/v1/schema/{post_type}` — field definitions
- `POST /wp-json/vc/v1/archive-event/{id}` — archive action
- `POST /wp-json/vc/v1/event/{id}/phase` — set phase
- `GET /wp-json/vc/v1/lineup?event_id=` — full lineup grouped by day/stage
- `?events_includes={id}` — event scoping query param on list endpoints (see bug note below)

**`events_includes` bug — fixed in v2.6.4:** `VC_Helper_Rest_Query_Filters` previously used `'events'` as a hardcoded field name for all CPTs. Actual field names are per-CPT:
- `vc_artist` → `vc_artist_events` (relationship array — use `LIKE` compare)
- `vc_lineup_slot` → `vc_ls_event` (post_object single integer — use `= NUMERIC`)
- `vc_sponsor` → `vc_sponsor_events` (relationship array — use `LIKE` compare)

`LineupList.jsx` also filters client-side as a belt-and-suspenders fallback (does NOT pass `events_includes` to the API — comment explains why).

Schema endpoint response shape uses `groups` key (not `field_groups`).  
`TAXONOMY_REST_MAP = { post_tag: 'tags', category: 'categories' }` — WP REST uses different slugs for built-in taxonomies.

**Event property CPT permalink slug:** `event-manager` (NOT `events` — avoids collision with existing `/events` pages on brand sites). Archive disabled (`has_archive: false`).

---

## After Darks Module (CRSSD-specific)

- CPT slug: `after-darks` (created via ACF Post Types on CRSSD, not in plugin)
- REST endpoint: `/wp/v2/after-darks`
- ACF field group: imported via `crssd-after-darks-acf-import.json` (in output folders)
- Requires **Show in REST API** enabled on the `after-darks` CPT in ACF → Post Types → Advanced
- Links to event via `vc_ad_event` Post Object field (set via the ACF import JSON)
- `AfterDarkList` filters client-side by `acf.vc_ad_event.ID === activeEventId`
- Schema: fetched from `/vc/v1/schema/after-darks`
- **404 handling:** `AfterDarkList` catches 404 gracefully and sets empty items (CPT not present or REST not enabled on this site). `AfterDarkDetail` only shows confidentiality fields on non-CRSSD sites because `group_confidential_items` ACF location rule includes `after-darks` — admin action required to enable REST per site.
- **Blank detail root cause:** `group_confidential_items` ACF location rule matches `after-darks` regardless of whether the CPT is registered. If main after-dark field group isn't loaded (REST not enabled), only confidentiality fields render. Fix: enable REST on the CPT in ACF → Post Types → after-darks → Advanced.

---

## Features

### Tutorials Page
- Route: `/tutorials`
- `TutorialsPage.jsx` renders 11 tutorial HTML files from `public/tutorials/`
- Accessible from Settings → Tutorials & Support
- `TutorialContext.jsx` tracks completion state

### CSV Import
- Artists: `ImportArtists.jsx` → `/artists/import` → `POST /vc/v1/import-artists`
- Events: `ImportEvents.jsx` → `/events/import` → `POST /vc/v1/import-events`
- Sheet URL stored at `GET /vc/v1/import-sheet-url`

### Drag Reorder
- `DraggableList.jsx` — long-press to activate drag, used in artists, sponsors, settings
- `useDragReorder` hook manages drag state
- Persists via `menu_order` field on WP posts

### PWA / Service Worker
- `useServiceWorkerUpdate` hook detects new SW versions and shows `UpdateToast`
- iOS Safari auto-zooms inputs with `font-size < 16px` — all inputs use `16px` minimum
- Viewport meta locks zoom at `1.0` to prevent layout breaks on form focus
- **Service worker caches aggressively** — clear site data or delete/re-add home screen icon to test production updates

---

## Pitfalls & Conventions

- **Do not run multiple Cowork sessions against this repo simultaneously** — causes `.git/index.lock` conflicts
- **Cowork `index.lock` issue:** Cowork sandbox can't delete `.git/index.lock` files on mounted volumes (permission error even as same user). `git add` stages correctly but leaves a stale lock. Fix from Mac Terminal: `rm ~/Documents/GitHub/<repo>/.git/index.lock` then commit + push normally.
- Push via Terminal directly; avoid GitHub Desktop worktrees
- `vc_` prefix on all CPTs, ACF field keys, and utility classes — universal namespace across brands
- Sean is an advanced developer — production-ready code only, skip fundamentals
- Module order on dashboard is from `site.modules` array, not from MODULES object key order
- After Darks CPT must have REST enabled per site — it's not in the plugin, it's site-specific
- **Sponsor photo save:** `handleLogoChange` must store media ID integer (not URL string) in state — `buildAcfPayload` only extracts ID from objects/integers, not URL strings. ACF image fields reject strings.
- **ACF image field payloads:** Always pass integer media ID to ACF image fields via REST. Passing a URL string silently fails (field appears saved but data is empty on reload).
- **SiteDashboard WIP (as of 2026-05-02):** In-progress refactor references `useUptimeStatus` hook and `StatusBadge` component — neither exists yet. Do not commit `SiteDashboard.jsx` or `endpoints.js` icon path updates until those deps are built.

---

## Related Sites (All Run Same Pattern)

### Recompile Trigger (save_post hook)
Oxygen recompiles `ct_builder_json` → `ct_builder_shortcodes` **server-side on every WP admin "Update" click**. You do NOT need to trigger the Oxygen builder's internal Angular save. The workflow for JSON surgery is:
1. Read `ct_builder_json` post meta
2. Parse, modify, re-stringify
3. Set via `document.querySelector('#ct_builder_json').value = JSON.stringify(json)`
4. Click the WP admin "Update" button

Shortcodes will regenerate automatically via `save_post`. The Oxygen builder's `savePage()` AJAX call is irrelevant for this workflow.

### Class Format (critical)
Oxygen stores classes as a **plain object with numeric keys**, not a JS array:
```js
// CORRECT — compiles to class="zfc_bar_wrap" in shortcodes
node.options.classes = {"0": "zfc_bar_wrap"};

// WRONG — compiles to classes:{} (empty) in shortcodes
node.options.classes = ["zfc_bar_wrap"];
```
This applies to any programmatic modification of Oxygen JSON. Always use `{"0":"class1","1":"class2"}` format.

### nicename vs classes
`nicename` is the builder display label only (visible in Oxygen sidebar). It has no effect on rendered HTML. `classes` is what becomes the HTML class attribute. Both can differ.

---

## ZFC Filter System (Zero Filter Chips)

**Template:** Post 3753 — "VC Listings Repeater — New Controls UI"
**Status:** Built and saved. Not yet assigned to a page for frontend verification.

### Architecture
Replaces the old dropdown filter bar with a horizontal chip multi-select bar. Each filter dimension has a group of chips; clicking a chip toggles it, clicking again deselects. Multiple chips within a group = OR logic. Multiple groups = AND logic (item must match at least one chip per active group).

### Template 3753 Node Structure
```
[568]  .zfc_bar_wrap         — outer div: sticky, full-width, flex row
[569]    Code Block           — ZFC markup (Brand / Venue / Year / Past chips)
[575]    .zfc_bar_actions     — right cluster: search toggle + grid/list toggle
```

Node 568 and 575 are native Oxygen divs. Node 569 is a PHP Code Block.

### ZFC HTML Structure (output of Code Block node 569)
```html
<div class="zfc_wrap">
  <div class="zfc_group" data-zfc-filter="brand">
    <span class="zfc_label">Brand</span>
    <div class="zfc_chips"><!-- populated by JS: buildZFCOptions() --></div>
  </div>
  <div class="zfc_group" data-zfc-filter="venue">...</div>
  <div class="zfc_group" data-zfc-filter="year">...</div>
  <div class="zfc_group" data-zfc-filter="past">
    <span class="zfc_label">Past</span>
    <div class="zfc_chips">
      <button class="zfc_chip" data-zfc-value="1">Past Events</button>
    </div>
  </div>
</div>
```

### ZFC JavaScript (vc-listings.js — functions)
```js
buildZFCOptions()      // reads data-brand/venue/year from .emh_listings_parent items,
                       // deduplicates, injects .zfc_chip buttons into each .zfc_group
matchesZFCFilters(item)// checks item data-attrs against zfcState; returns bool
initZFC()              // attaches click handlers to chips, sets zfcActive flag,
                       // calls applyFilters() on change
```

**State object:** `zfcState` — `{ brand: Set, venue: Set, year: Set, past: Set }` — each Set holds currently active filter values. Empty Set = no filter for that dimension.

**`zfcActive` flag:** Set to `true` once `initZFC()` attaches. Prevents double-init.

**`window.emhListings_refresh()`** — called by WPCode #3589 after chip injection — also rebuilds ZFC options.

### ZFC CSS Classes
```
.zfc_bar_wrap        outer sticky container (§22 of vc-listings.css)
.zfc_bar_actions     right action cluster (search + view toggle)
.zfc_wrap            inner flex row of filter groups
.zfc_group           one filter dimension (has data-zfc-filter attr)
.zfc_label           group label text
.zfc_chips           chip row within a group
.zfc_chip            individual chip button
.zfc_chip.is-active  selected state
```

### Data Attributes on Chip Groups
```
data-zfc-filter="brand"   matches data-brand on .emh_listings_parent
data-zfc-filter="venue"   matches data-venue
data-zfc-filter="year"    matches data-year
data-zfc-filter="past"    matches data-is-past
```

---

## View Toggle Architecture

**Two-panel tab approach** — same pattern used on underthebigskyfest.com/after-parties/. Two complete PHP-rendered panels (tile and list), JS toggle shows one and hides the other. No GSAP Flip for the toggle — hard CSS swap.

```
.emh_listings_panel--tile   (default visible)
.emh_listings_panel--list   (hidden by default)
```

Toggle buttons add `is-active` to the target panel and remove it from the other. Filters apply data attributes and hide/show `.emh_listings_parent` items in whichever panel is active.

**Why not GSAP Flip for the toggle:** Flip animates positional changes on shared elements. Two separate full renders with different markup have no shared elements to animate between — it's the wrong tool. Flip is still used for filter animations (items entering/leaving when filters change).

**PHP Code Block structure in Oxygen:**
- One Code Block outputs both panels — tile loop first, list loop second
- Each loop iterates the same `WP_Query` result
- Native Oxygen elements handle outer structure (section, controls bar, year headers)

---

## Quick Reference: What Goes Where

| Thing | Goes in |
|---|---|
| Helper functions (`vc_ordinal`, etc.) | Child theme `functions.php` |
| CTA mailto shortcode | Child theme `functions.php` or WPCode PHP snippet |
| Listings JS | WPCode #3607 (JavaScript, footer) |
| Data attrs + chip injection | WPCode #3589 (PHP, All Pages, priority 99) |
| `acf_add_options_page()` | WPCode PHP snippet or functions.php |
| CSS | WPCode or child theme style.css |
| Repeater markup | Oxygen Code Block inside post 815 |

---

---

# CLAUDE.md — FC Events Hub (fc-bkstg-events / vc-event-manager)

> **Session context for AI assistants.** Read this section for React PWA work.
> Last updated: 2026-05-02 (session 11)

---

## Project Overview

**Repo:** `fc-bkstg-events` (deploy/source mirror of `vc-event-manager`)
**App:** FC Events Hub — React + Vite PWA. Connects to any registered WP site via Application Passwords. Manages event content (artists, lineup, sponsors, styles, partnership pages) across multiple festival brands.
**Deploy:** Netlify auto-deploys from main. Build output copied from `vc-event-manager/dist` → `fc-bkstg-events`.
**Auth:** Two-tier — Supabase for app login, WP Application Passwords for site connections.

---

## App Architecture

### Key Files

| File | Purpose |
|---|---|
| `src/api/endpoints.js` | All API endpoint definitions (`VC_ENDPOINTS`, `WP_ENDPOINTS`, `MODULES`) |
| `src/api/client.js` | `VCApiClient` — Basic Auth via `btoa(user:appPassword)`, `get/post/put/del` |
| `src/auth/AuthContext.jsx` | Auth context — `getClient()`, `hasSites`, `activeSite` |
| `src/hooks/useSchema.js` | Schema fetch hook — exports `buildAcfPayload`, `flattenSchemaFields`, `extractValues`, `buildDefaultValues`, `clearSchemaCache` |
| `src/config/siteRegistry.js` | Per-brand site config — `modules` array drives dashboard tile visibility |
| `src/App.jsx` | Router — all module routes live here |

### Module Pattern

Each content module is a folder under `src/modules/[module]/`:
- `[Module]List.jsx` — index/picker view
- `[Module]Editor.jsx` — edit view (schema-driven where applicable)

The dashboard tile only appears if the module key is in `activeSite.modules` in `siteRegistry.js`.

### `MODULES` config (`endpoints.js`)

Currently defined modules: `artists`, `lineup`, `sponsors`, `events`, `styles`, `confidential`, `genres`, `stages`, `contestants`, `partnership`.

---

## Partnership Module (Session 11)

### New files

| File | Purpose |
|---|---|
| `src/modules/partnership/PartnershipList.jsx` | Discovery: 0 pages = setup instructions, 1 = auto-redirect to editor, 2+ = picker |
| `src/modules/partnership/PartnershipEditor.jsx` | Schema-driven tabbed ACF editor for partnership pages |

### Endpoints

```js
// VC_ENDPOINTS.partnership
list:   '/vc/v1/partnership'
single: (id) => `/vc/v1/partnership/${id}`
schema: '/vc/v1/partnership/schema'

// WP_ENDPOINTS.pages (for writes)
single: (id) => `/wp/v2/pages/${id}`
```

### App.jsx routes — ADD MANUALLY

```jsx
import PartnershipList   from './modules/partnership/PartnershipList';
import PartnershipEditor from './modules/partnership/PartnershipEditor';

<Route path="/partnership"     element={<PartnershipList />} />
<Route path="/partnership/:id" element={<PartnershipEditor />} />
```

### siteRegistry.js — ADD `'partnership'` to modules arrays

Add `'partnership'` to the `modules` array for each site that has a partnership page installed.

### Editor architecture

- Fetches schema + values in parallel: `Promise.all([client.get(schema), client.get(single(id))])`
- `extractSections(fields)` splits flat ACF field array on `type === 'tab'` entries
- Tab fields are filtered out before `buildAcfPayload` (no data, just section markers)
- `buildAcfPayload` + `flattenSchemaFields` imported from `../../hooks/useSchema`
- Two-level nav: group pills (main + styles groups) → tab underline pills within each group
- Repeater/group fields: v1 shows informational placeholder — data preserved in state, not overwritten
- `color_picker` → renders `<input type="color">` + hex display
- Save: `POST /wp/v2/pages/${id}` with `{ acf: buildAcfPayload(...) }`

---

## `useSchema` Hook

`src/hooks/useSchema.js` — note: `useSchema()` builds URL as `${apiBase}/schema/${postType}` and does NOT work for partnership (different URL shape). For partnership, fetch schema directly with `client.get(VC_ENDPOINTS.partnership.schema)` then use the exported utilities:

```js
import { buildAcfPayload, flattenSchemaFields } from '../../hooks/useSchema';
```

`buildAcfPayload(fields, values)` — normalizes image→ID, gallery→ID[], repeater→normalized rows before sending to REST.
`flattenSchemaFields(groups)` — flattens schema groups into a single field array (preserves tab fields).

---

## `VCApiClient`

`src/api/client.js`:
- Auth: `Authorization: Basic ${btoa(username + ':' + appPassword)}`
- Methods: `client.get(endpoint)`, `client.post(endpoint, body)`, `client.put(endpoint, body)`, `client.del(endpoint)`
- WP REST accepts POST for updates to pages (`wp/v2/pages/{id}`)

---

## Known QA Issues (2026-05-02)

From Sean's QA session on Proper NYE. These need code fixes:

- [ ] **Lineup not showing** — probably wrong event filter or endpoint
- [ ] **After Dark fields not rendering** — missing ACF field mapping or CPT support
- [ ] **Sponsor logo (dark bg) appearing above form** — CSS/layout issue in editor
- [ ] **Sponsor photos not saving** — likely PHP upload limit (same issue as Zoo Agency, fix: `.user.ini` `upload_max_filesize`)
- [ ] **Favorites broken** — unknown; needs investigation
- [ ] **No back-to-module navigation** — missing nav UI pattern in editor views

---

## Pending App Work

- [ ] Add partnership routes to `App.jsx` (manual, snippet above)
- [ ] Add `'partnership'` to `siteRegistry.js` modules for applicable sites
- [ ] Fix QA issues listed above
- [ ] Build + deploy: `npm run build` in `vc-event-manager`, copy `dist/` → `fc-bkstg-events`, commit, push (Netlify auto-deploys)

---

## Session Log

### Session 11 — 2026-05-02

- Built `PartnershipList.jsx` and `PartnershipEditor.jsx`
- Added `partnership` entries to `VC_ENDPOINTS`, `WP_ENDPOINTS.pages`, `MODULES` in `endpoints.js`
- Created `fc-partnership-site/php/vc-partnership-endpoint.php` (WPCode-ready REST endpoint)
- Created `fc-partnership-site/MANUAL-STEPS.md` (8-section human-action guide)
- Ingested QA notes; documented known bugs above
- Updated partnership spec from `vc_spon_` → `vc_part_` naming throughout
