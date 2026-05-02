# CLAUDE.md — Zoo Agency · EMH Event Property Listings

> **Session context for AI assistants.** Read this first before any Zoo Agency WordPress work.
> Last updated: 2026-04-24 (session 6)

---

## File Versioning Convention

**Reference/doc files** (`.md`, specs, layer stacks, build frameworks):
- Version in the **filename**: `vc-listings-layer-stack-v2.md`
- First line of file: version number (`# v2.0`)
- Second line of file: date and timestamp (`# 2026-04-23 02:15 PDT`)
- Keep prior version around briefly, then delete once the new one is confirmed good

**Deployed asset files** (`.js`, `.css`, `.php` — anything consumed by WPCode, a `<script>` tag, or a PHP include):
- **Filename stays stable** — never version the filename (changing it breaks references)
- Version lives in the **file header comment**, lines 1–2 of the block:
  ```
  v3.2.0
  2026-04-23 02:15 PDT
  ```
- Changelog entries go in the header block beneath the timestamp

---

## Sean's Build Philosophy (read before proposing any implementation)

**No shortcodes. No hardcoded markup.** Sean strongly prefers visually editable, native Oxygen elements over PHP-rendered HTML or shortcode outputs. When something breaks, he needs to be able to fix it in the Oxygen builder — not hunt through a PHP string.

**Default to native Oxygen elements.** Use Code Blocks only when Oxygen's dynamic data picker genuinely cannot resolve the field (nested ACF groups, taxonomy term arrays, formatted output). For everything else — structure, flat ACF fields, images, simple text — use native elements.

**Hybrid is the right pattern for the card repeater:** native Oxygen divs for card structure, Code Blocks only for the fields that genuinely require PHP. The actual short list is: tag chips, genre chips, nth year, and the video iframe. Everything else — images, logos, text, social links, date (built with Oxygen dynamic data + conditional visibility), meta labels/values — is native Oxygen.

**Minimum Code Block list for cards:**
1. Tag chips — WP_Term[] → pill HTML
2. Genre chips — WP_Term[] → pill HTML
3. Nth year — `vc_nth_year()` calculation
4. Video iframe — Vimeo embed with `data-src` (lazy-loaded by JS on hover)
5. Contact mailto href — combines `zoo_contact_emails` (options page) + `vc_ep_title` (per-post)

---

## Card Video — Hover Autoplay Behavior

**No player UI.** No play button. On card hover the video starts automatically and covers the image. On mouseout the video remains loaded but hidden.

**Vimeo field format:** Store only the numeric Vimeo ID in `video → vimeo_id` — e.g. `1085752382`. The ACF field is a Text type with `https://vimeo.com/` as a Prepend (cosmetic UI only — stored value is just the number). The Code Block uses the ID directly to construct the embed URL. Access via `get_field('video')['vimeo_id']` — `video` is a top-level group, NOT nested inside `vc_ep_media`.

**Correct embed URL pattern:**
```
https://player.vimeo.com/video/{ID}?background=1&autoplay=1&muted=1&loop=1&autopause=0
```
`background=1` is the critical parameter — it disables all Vimeo UI and locks the player into silent background-video mode.

**Lazy loading:** The iframe renders with `data-src` (not `src`). `vc-listings.js` sets `src` from `data-src` on the first `mouseenter` of the card. Idle cards never load the Vimeo iframe. No `vc_vimeo_id()` call needed — `vimeo_id` is already the numeric ID.

**CSS:** The iframe is `position:absolute; inset:0; width:100%; height:100%; opacity:0; transition:opacity 0.4s; pointer-events:none;` inside a `position:relative; overflow:hidden` container. Parent card `:hover` brings opacity to 1.

**JS version:** v3.2.0 — `initHoverVideo()` added to `vc-listings.js` (WPCode #3607).

---

## Project Overview

**Client:** Zoo Agency (aka EMH — the class prefix used in Oxygen)
**Site:** WordPress on DreamHost (PHP-FPM/FastCGI — NOT WP Engine)
**Builder:** Oxygen Builder (Reusable Parts, native elements, Code Blocks)
**Plugin stack:** vc-event-properties, vc-creative-toolkit, ACF Pro, WPCode

This is a filterable event property listings system. A custom CPT (`vc_event_property`) powers cards that display Zoo Agency's festival portfolio. The listing page uses a PHP/JS/CSS stack injected via WPCode — not a page builder template.

---

## WordPress Environment

- **Host:** DreamHost, PHP-FPM/FastCGI
- **PHP config:** `.user.ini` (NOT `.htaccess` php_value — those don't work on DreamHost)
  - `max_input_vars = 5000` — already set
  - `memory_limit = 512M` — needs to be added (sitemap OOM issue with 300+ posts)
- **Child theme:** active; helper functions go in `functions.php`
- **WPCode:** used for all PHP and JS snippet deployment (preferred over direct file edits)

---

## Plugin: vc-event-properties

**CPT:** `vc_event_property`
**Taxonomies (registered via plugin or ACF):**
- `vc_event_tag` — Event Tags (flat, used for tag chips)
- `vc_event_genre` — Event Genres (flat, used for genre chips)

**Naming conventions:**
- PHP prefix: `vc_` (all functions, classes, CPTs, field names)
- CSS class prefix: `vc_` with BEM underscores
- ACF field prefix: `vc_ep_` for most fields; `brand`, `year` are flat (no prefix)
- REST namespace: `vc/v1`

---

## ACF Field Structure — `vc_event_property`

All field paths verified against ACF JSON export (2026-04-23, Sean's working version).

```
FLAT (top-level, not in group)
  brand                     get_field('brand')                            select value
  year                      get_field('year')                             number
  vc_ep_event_icon          get_field('vc_ep_event_icon')                 image array
  vc_ep_title               get_field('vc_ep_title')                      text
  vc_ep_sub_title           get_field('vc_ep_sub_title')                  text  ← was vc_ep_season (recreated 2026-04-27)
  vc_ep_confidential        get_field('vc_ep_confidential')               true_false
  vc_ep_private_visibility  get_field('vc_ep_private_visibility')         true_false
  capacity_label            get_field('capacity_label')                   text (default "Capacity")
  capacity_amount           get_field('capacity_amount')                  text (e.g. "12,000 attendees")
  genre_label               get_field('genre_label')                      text (default "Genre")
  genre_selection           get_field('genre_selection')                  taxonomy → WP_Term[]
  custom_data_item_tf       get_field('custom_data_item_tf')              true_false
  event_tag_labels          get_field('event_tag_labels')                 taxonomy → WP_Term[]  ← was 'tags' (recreated 2026-04-27)
  contact_emails            get_field('contact_emails')                   text (comma-separated, per-post)

DATES TAB — get_field('vc_ep_dates') → group
  ['start_date']            Ymd string: "20260420"
  ['end_date']              Ymd string (or empty)

TBD — get_field('tbd') → group  ← SEPARATE top-level group, NOT inside vc_ep_dates
  ['enabled']               bool
  ['text']                  string (default "TBD")

DETAILS TAB — vc_ep_details group REMOVED (2026-04-28). Fields are now FLAT top-level:
  city                      get_field('city')                             text
  state                     get_field('state')                            text (e.g. "CA")
  vc_ep_event_venue         get_field('vc_ep_event_venue')                select (choices: Waterfront Park, Petco Park, Gallagher Square, Big Mtn Ranch, Majestic Valley Arena, Bozeman MT)
  established               get_field('established')                      number (e.g. 2015)

CUSTOM DATA — get_field('custom_data_item') → group  ← top-level, not nested
  ['custom_data_label']     text
  ['custom_data_text']      text

MEDIA TAB — get_field('vc_ep_media') → group
  ['logo_horizontal']       image array → ['url']
  ['logo_vertical']         image array → ['url']
  ['event_image']           image array → ['url']   ← card image

VIDEO — get_field('video') → group  ← SEPARATE top-level group, NOT inside vc_ep_media
  ['vimeo_id']              text — numeric Vimeo ID only (e.g. "1085752382") — ACF Prepend shows https://vimeo.com/ in UI only
  ['mp4_url']               URL string

MORE IMAGES — get_field('more_images') → repeater  ← top-level, NOT inside vc_ep_media
  ['image']                 image array → ['url']

MORE VIDEOS — get_field('more_videos') → repeater  ← top-level, NOT inside vc_ep_media
  ['vimeo_url']             URL string
  ['mp4_url']               URL string
  ['other']                 URL string

LINKS TAB (restructured 2026-04-28):
WEBSITE — get_field('vc_ep_website') → group
  ['vc_ep_website_label']   text (e.g. "Official Site")
  ['vc_ep_website_url']     URL string

SOCIAL — get_field('vc_ep_social') → group  ← replaces all individual social link subfields
  ['vc_ep_social_label']    text (e.g. "Instagram", "Facebook", "Spotify")
  ['vc_ep_social_url']      URL string
  NOTE: individual keys ['website'], ['instagram'], ['facebook'], ['spotify'], ['twitter'], ['tiktok'], ['soundcloud'] NO LONGER EXIST
```

**CRITICAL ACF NOTES:**
- `event_tag_labels` and `genre_selection` are **top-level taxonomy fields** (NOT inside a group).
- Both have `save_terms: 0` and `load_terms: 0` — bypasses `wp_set_object_terms()`. Data stored as serialized post meta only. **Do not change this.**
- `event_tag_labels` and `genre_selection` return `WP_Term[]` objects — NOT readable via Oxygen dynamic data picker. Must use Code Blocks with `vc_render_chips()`.
- `event_tag_labels` was recreated from scratch (2026-04-27) — old `tags` field had stale ACF Local JSON definition in `acf-json/` folder that prevented saves. Do NOT rename this field — recreate instead if issues arise.
- `video` is a **top-level group** (`get_field('video')`), NOT nested inside `vc_ep_media`. Any code reading `$media['video']` is wrong.
- `tbd` is a **top-level group** (`get_field('tbd')`), NOT nested inside `vc_ep_dates`.
- `capacity_label` and `capacity_amount` are **flat top-level fields** — old path `$details['capacity']['capacity']` no longer exists.
- `contact_emails` is a **per-post field** (still in the group). Zoo Agency options page field is `zoo_contact_emails` (accessed via `get_field('zoo_contact_emails', 'option')`). Both exist — per-post overrides if populated, options page is the fallback.
- **`vc_ep_details` group REMOVED (2026-04-28)** — `city`, `state`, `established` are now flat top-level fields. `venue` is now `vc_ep_event_venue` (select). Any code reading `get_field('vc_ep_details')` is stale.
- **`vc_ep_website` group (2026-04-28)** — `get_field('vc_ep_website')` returns `['vc_ep_website_label', 'vc_ep_website_url']`. Old `$social['website']` path is gone.
- **`vc_ep_social` group (2026-04-28)** — `get_field('vc_ep_social')` returns `['vc_ep_social_label', 'vc_ep_social_url']`. All individual subfields (instagram, facebook, spotify, twitter, tiktok, soundcloud) removed from ACF. Any code reading those keys is stale.

---

## ACF Options Page — Zoo Agency

**Built (2026-04-22), updated slug confirmed 2026-04-23:**
- Options page title: **Zoo Admin** — menu slug: `zoo-admin`
- Registered via ACF Pro → Options Pages (not WPCode #3598 — that snippet is off)
- ACF field group: "Zoo Agency Settings" — post ID 3599
- Field: `zoo_contact_emails` — Text, comma-separated email addresses
- Access in PHP: `get_field('zoo_contact_emails', 'option')` — slug-agnostic
- Used by CTA mailto shortcode (`crssd_mailto`) and card contact link

**Zoo Event Styles field group** (imported 2026-04-23):
- Group key: `group_zoo_event_styles` — separate from `group_vc_event_property_fields`
- Must be assigned to `zoo-admin` options page in ACF location rule after import
- Outputs `--zoo-*` CSS custom properties via WPCode PHP snippet (see below)
- Completely separate namespace from `--vc-*` listing variables

---

## CTA Mailto Shortcode

```php
function crssd_build_mailto_href( $atts ) {
    $atts = shortcode_atts([
        'email_field'    => 'zoo_contact_emails',   // ACF options page field
        'title_field'    => 'vc_ep_title',
        'subject_suffix' => 'Partnerships',
    ], $atts );

    $post_id    = get_the_ID();
    $raw_emails = get_field( $atts['email_field'], 'option' ) ?: '';
    $emails     = preg_replace( '/\s*,\s*/', ',', trim( $raw_emails ) );
    $title      = get_field( $atts['title_field'], $post_id ) ?: get_the_title( $post_id );
    $subject    = rawurlencode( $title . ' ' . $atts['subject_suffix'] );

    return 'mailto:' . $emails . '?subject=' . $subject;
}
add_shortcode( 'crssd_mailto', 'crssd_build_mailto_href' );
```

Subject line is dynamic per card (uses `vc_ep_title` of the post). Emails pulled from options page once, not per-post.

---

## Oxygen Template — Post 815 (Reusable Part)

This is the main listings template. 274 nodes total. Lives at: **Oxygen → Reusable Parts → post ID 815**.

**Top-level structure:**
```
[1]  Section
[2]    Div (#77)
[3-4]   Code Blocks: SEARCH CSS, Internal CSS
[5]     .vc_listings_controls        ← filter/search/view toggle bar
[27]  .vc_listings_repeater          ← Oxygen Easy Posts element
[28]    .vc_listings_repeater_item   ← per-post wrapper (has data-* attrs)
[29]      .vc_listings_repeater_view_tile   ← grid card
[151]     .vc_listings_repeater_view_list   ← list row
[274]   Code Block: VC Modal
```

**Key class notes:**
- **Intentional typo** across all chip/data-item classes: `vc_listigs_` (missing second `n`). This is in the Oxygen DOM and WPCode snippets. **Do not "fix" it** — changing it would break both the PHP injection and CSS.
  - Affected: `.vc_listigs_row_tag`, `.vc_listigs_chip_tag`, `.vc_listigs_chip_tag_large`, `.vc_listigs_grid_data-cont`, `.vc_listigs_grid_data-item`

**Chip containers (injection targets for WPCode #3589):**
- Tags: `.vc_listigs_row_tag` — nodes 55 (grid), 177 (list)
- Genre chips: `.vc_listigs_chip_tag_large` — nodes 98–104 (grid), 220–226 (list); script targets their **parent** element and replaces innerHTML

**JavaScript filter data attributes on `.emh_listings_parent`:**
```
data-brand    → brand field value
data-venue    → vc_ep_event_venue (flat select field — was vc_ep_details → venue)
data-year     → year field value
data-is-past  → "1" if start_date < today, else "0"
```
These are set by WPCode #3589 (emh-listings-data-attrs.php), not Oxygen custom attributes.

---

## Files in This Workspace

| File | Purpose | Status |
|---|---|---|
| `vc-listings.js` (v3.2.0) | WPCode #3607 · JS · Footer | Production |
| `vc-listings.css` (v1.7.0) | WPCode #3750 · CSS · Site Wide Header | Production |
| `emh-listings-data-attrs.php` | WPCode #3589 · PHP · wp_footer priority 99 | Production |
| `diagnostic-acf-fields.php` | WPCode diagnostic · admin_notices | **DELETE — temp only** |
| `vc-listings-build-framework.md` | Full build reference, field map, PHP helpers, both repeater versions | Reference |
| `vc-listings-layer-stack.md` | Full 274-node Oxygen DOM tree for post 815 | Reference |
| `vc-listings-oxygen-reference.md` | Oxygen selector/class reference | Reference |

---

## WPCode Snippets

| ID | Name | Type | Hook | Status |
|---|---|---|---|---|
| #3607 | VC Event Property Listings Controller — v3.2.0 (vc-listings.js) | JavaScript | Footer | Active |
| #3867 | **MAIN CSS / vc-listings.css — v2.0.4 (vc-listings.css) | CSS Snippet | Site Wide Header | Active — **v2.0.5 content** (title lags) |
| #3608 | VC Event Property Listing Style — v1.2.0 (vc-listings.css, EMH classes) | CSS Snippet | Site Wide Header | **DEACTIVATE** — superseded by #3750 |
| #3589 | emh-listings-data-attrs.php | PHP | Run Everywhere (guarded) | Active |
| #3597 | EMH — Remove Duplicate Taxonomy Metaboxes | PHP | Admin Only | Active |
| #3601 | EMH — PHP Memory Limit | PHP | Run Everywhere | Active |
| #3602 | VC Event Property Listing Style — v1.1.0 (old VC classes) | CSS Snippet | Site Wide Header | **DEACTIVATE** |
| #3535 | Old EMH CSS — v3.0.0 | CSS Snippet | — | Off — leave off |
| #3598 | Zoo Agency — ACF Options Page | PHP | Admin Only | Off — replaced by Zoo Admin options page |

**WPCode #3589 guards** (top of wp_footer callback — do not remove):
```php
if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) return;
```
This prevents the `get_posts(-1)` query from running on every admin/AJAX request, which was interfering with ACF saves.

---

## JavaScript — vc-listings.js v3.2.0

**Selectors (EMH class prefix in JS, not vc_):**
```js
SEL.repeater    = '.emh_listings_repeater'
SEL.item        = '.emh_listings_parent'
SEL.toggleGrid  = '.emh_cntrl_togl_grid'
SEL.toggleList  = '.emh_cntrl_togl_list'
SEL.filterBrand = '.emh_cntrl_fltr_brand select'
SEL.filterVenue = '.emh_cntrl_fltr_venue select'
SEL.filterYear  = '.emh_cntrl_fltr_year select'
SEL.filterPast  = '.emh_cntrl_fltr_past input[type="checkbox"]'
SEL.searchWrap  = '.emh_cntrl_srch_wrap'
SEL.searchToggle= '.emh_cntrl_srch_toggle'
SEL.searchInput = '.emh_cntrl_srch_input'
SEL.searchClear = '.emh_cntrl_srch_clear'
```

**Global callback:** `window.emhListings_refresh()` — called by WPCode #3589 after injecting data attributes and chips to rebuild dropdowns and re-apply active filters.

**View classes on repeater:** `emh_listings_view_grid` / `emh_listings_view_list`

**Requires:** GSAP + Flip plugin (loaded before this script in footer)

---

## PHP Helpers (functions.php)

These must exist in the child theme's `functions.php`:

```php
vc_ordinal(int $n): string          // 1 → "1st", 11 → "11th"
vc_nth_year($established): string   // established 2015, now 2026 → "11th Year"
vc_vimeo_id(string $url): string    // extract numeric ID from any Vimeo URL
vc_format_date(start, end, tbd, tbd_text): array  // Ymd → display parts
vc_render_chips(array $terms, string $css_class): string  // WP_Term[] → chip HTML
emh_extract_term_names($field_value): array  // safe taxonomy extraction (all return formats)
```

`emh_extract_term_names()` lives in WPCode #3589 (not functions.php) because it's used only by that snippet.

---

## CSS — vc-listings.css

**Token summary:**
```css
--vc-bg:              #ececec
--vc-card-bg:         rgba(252,252,252,0.5)
--vc-card-border:     #000000
--vc-text-primary:    #282828
--vc-text-muted:      #979797
--vc-display-font:    'Acumin Variable Concept' (Adobe Fonts)
--vc-ui-font:         'Inter' (Google Fonts)
--vc-card-radius:     12px
--vc-pill-radius:     99px
```

CSS is **complete and deployed** via WPCode #3750 (CSS Snippet, Site Wide Header, Active — v1.7.0). Tokens confirmed resolving on `/event-properties-grid/`. 22 sections written: tokens, wrapper, controls, year group, repeater grid/list modes, tile view, list view, modal, responsive, search widget, TBD dates, nth year, controls section split, view show/hide, ZFC chips (§21), ZFC bar outer wrapper (§22). Local file: 1269 lines.

---

## Known Issues / Pending Work

### Active
- **WPCode #3589 capacity reads** — Still reads `$details['capacity']['capacity']` and `$details['capacity']['label']`. Must update to `get_field('capacity_label')` and `get_field('capacity_amount')` (flat top-level fields).
- **WPCode #3589 video reads** — Any code reading `$media['video']` must change to `get_field('video')['vimeo_id']` (video is top-level, not inside vc_ep_media; field is now `vimeo_id` not `vimeo_url`).
- **WPCode #3589 tbd reads** — If reading `$dates['tbd']`, change to `get_field('tbd')` (top-level group, not inside vc_ep_dates).
- **WPCode #3589 details reads** — Must update any `get_field('vc_ep_details')` reads to flat `get_field('city')`, `get_field('state')`, `get_field('established')`, `get_field('vc_ep_event_venue')`.
- **WPCode #3589 social reads** — Must update any `$social['website']` / `$social['instagram']` etc. to `get_field('vc_ep_website')['vc_ep_website_url']` and `get_field('vc_ep_social')['vc_ep_social_url']`.
- **class-vc-admin-importer.php** — Rewritten for 2026-04-28 ACF structure. Needs to be uploaded to server at `wp-content/plugins/vc-event-properties/includes/admin/` via WP File Manager PRO.
- **Card build** — Tile + list panels not yet built in Oxygen. Two-panel tab approach confirmed (see View Toggle Architecture section). PHP Code Block outputs both loops.
- **WPCode #3608 + #3602** — Both old CSS snippets still active. Deactivate both once #3750 confirmed stable on frontend.
- **Template 3753 — not yet assigned to a page** — ZFC controls UI built and saved (nodes 568/569/575, `zfc_bar_wrap` class confirmed). Needs a test page with Oxygen location rule pointing to post 3753 for frontend render verification.
- **ACF Local JSON (`acf-json/`)** — Old JSON files in child theme for `vc_ep_season` and `tags` fields still exist. These stale definitions override the database. Do not rename those old fields — create new ones instead (as done with `vc_ep_sub_title` and `event_tag_labels`). Investigate cleaning out `acf-json/` in a future session.

### Resolved (session 7 — 2026-04-28)
- **ACF field restructure** — `vc_ep_details` group removed; city/state/established now flat. Venue now `vc_ep_event_venue` (select). Social links consolidated into `vc_ep_website` and `vc_ep_social` groups. All sync files updated: `class-vc-admin-importer.php`, `ImportEvents.jsx`, `vc-events-sheet-guide.html`, `VC-CSV-Field-Guide.html`, both CLAUDE.md files.
- **CSV column set** — Reduced from 21 to 17 columns: removed instagram/facebook/spotify/twitter/tiktok/soundcloud, renamed `website`→`website_url`, added `social_label`+`social_url`.

### Resolved (session 6 — 2026-04-24)
- **WPCode #3750 CSS at v1.7.0** — Sections 21 (ZFC chips) and 22 (ZFC bar outer wrapper) added. Deployed, 39597 chars confirmed in CodeMirror.
- **Template 3753 node 568 class format** — Was `classes: []` (empty array), fixed to `classes: {"0":"zfc_bar_wrap"}`. WP admin save regenerated shortcodes correctly.
- **Oxygen class format discovery** — `classes` must be `{"0":"name"}` (object with numeric keys). Array format `["name"]` compiles to `{}` in shortcodes. Critical for any future JSON surgery.
- **Oxygen `save_post` hook discovery** — Oxygen recompiles `ct_builder_json` → `ct_builder_shortcodes` server-side on every WP admin "Update" click. No need to trigger the Oxygen builder's internal Angular save. Updating `ct_builder_json` via WP admin Update is sufficient to regenerate shortcodes.

### Resolved (session 2)
- **CSS class mismatch** — `.vc_listings_repeater--grid/--list` corrected to `.emh_listings_view_grid/list` in WPCode #3602. Deployed.
- **vc-listings.js v3.1.0** — `initHoverVideo()` added and deployed to WPCode #3531. Confirmed live on `/event-properties-grid/` (inlined in page source, `emhListings_refresh` is `function` in global scope).

### Resolved (prior sessions)
- **memory_limit** — WP File Manager and WPCode File Editor (PRO) don't allow `.user.ini` access for this admin user. Resolved via WPCode #3601: `@ini_set('memory_limit', '512M')` running on all requests. Remove if `memory_limit = 512M` is ever set directly in `.user.ini` via SSH/FTP.
- **Zoo Agency Options Page** — built via WPCode #3598 + ACF field group (post ID 3599). See ACF Options Page section above.
- **Duplicate taxonomy metaboxes** — `event-tag` and `event-genre` native WP metaboxes showed alongside ACF fields on `vc_event_property` edit screen. ACF Pro 6.x removed the "Meta Box → Hidden" Presentation tab option for Taxonomy fields. Fixed via WPCode #3597: `remove_meta_box()` on `add_meta_boxes` hook, priority 99, admin_only.
- **ACF taxonomy fields not saving** — `tags` and `genre_selection` were inside groups causing conflict between serialized meta and `wp_set_object_terms()`. Fixed by moving to top-level AND setting `save_terms: 0`, `load_terms: 0`.
- **WPCode #3589 running on admin** — was set to "Run Everywhere" without `is_admin()` guard. Fixed.
- **`contact_emails` per-post field not saving** — removed; replaced with Zoo Agency options page pattern (see above). Root cause: manually-set ACF field key (`field_vc_ep_contacts`) had no matching `acf-field` post record in `wp_posts`.

### ACF Save Failure Root Cause (for future reference)
If an ACF field silently fails to save (data appears in POST at `acf/save_post` priority 1 but `val=[]` and `ref=[]` at priority 20), the cause is ACF's field definition lookup failing. ACF looks up field keys in `wp_posts` as `acf-field` post type. Manually-set field keys (not auto-generated by ACF UI) may have no corresponding record. Fix: delete and re-create the field in ACF UI to generate a proper auto-keyed `acf-field` record.

---

## Diagnostic Snippet — DELETE WHEN DONE

`diagnostic-acf-fields.php` in this workspace is a temporary WPCode snippet. Remove it from WPCode as soon as the contact_emails issue is confirmed resolved. It hooks into `admin_notices`, `acf/save_post`, and `save_post` — leaving it active degrades admin UX.

---

## Oxygen Builder — Critical Implementation Notes

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
