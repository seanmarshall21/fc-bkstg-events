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

crssd.com · crssdfest.com · propernye.com · underthebigskyfest.com · wildhorsesfest.com · rodeosd.com · ledpresents.com · outriderspresent.com · majesticvalleyarena.com · zooagency.com
