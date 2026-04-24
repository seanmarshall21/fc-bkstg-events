# CLAUDE.md — Zoo Agency · EMH Event Property Listings

> **Session context for AI assistants.** Read this first before any Zoo Agency WordPress work.
> Last updated: 2026-04-23 (session 5)

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

**Vimeo field format:** Store a clean standard URL in `video → vimeo_url` — e.g. `https://vimeo.com/1085752382`. Do NOT paste Vimeo's embed generator output (it includes tracking noise and is missing `background=1`). The Code Block constructs the proper embed URL. Access via `get_field('video')['vimeo_url']` — `video` is a top-level group, NOT nested inside `vc_ep_media`.

**Correct embed URL pattern:**
```
https://player.vimeo.com/video/{ID}?background=1&autoplay=1&muted=1&loop=1&autopause=0
```
`background=1` is the critical parameter — it disables all Vimeo UI and locks the player into silent background-video mode.

**Lazy loading:** The iframe renders with `data-src` (not `src`). `vc-listings.js` sets `src` from `data-src` on the first `mouseenter` of the card. Idle cards never load the Vimeo iframe. The `vc_vimeo_id()` helper in `functions.php` extracts the numeric ID from any Vimeo URL format.

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
  vc_ep_season              get_field('vc_ep_season')                     text
  vc_ep_confidential        get_field('vc_ep_confidential')               true_false
  vc_ep_private_visibility  get_field('vc_ep_private_visibility')         true_false
  capacity_label            get_field('capacity_label')                   text (default "Capacity")
  capacity_amount           get_field('capacity_amount')                  text (e.g. "12,000 attendees")
  genre_label               get_field('genre_label')                      text (default "Genre")
  genre_selection           get_field('genre_selection')                  taxonomy → WP_Term[]
  custom_data_item_tf       get_field('custom_data_item_tf')              true_false
  tags                      get_field('tags')                             taxonomy → WP_Term[]
  contact_emails            get_field('contact_emails')                   text (comma-separated, per-post)

DATES TAB — get_field('vc_ep_dates') → group
  ['start_date']            Ymd string: "20260420"
  ['end_date']              Ymd string (or empty)

TBD — get_field('tbd') → group  ← SEPARATE top-level group, NOT inside vc_ep_dates
  ['enabled']               bool
  ['text']                  string (default "TBD")

DETAILS TAB — get_field('vc_ep_details') → group
  ['city']                  text
  ['state']                 text (e.g. "CA")
  ['venue']                 text
  ['established']           number (e.g. 2015)

CUSTOM DATA — get_field('custom_data_item') → group  ← top-level, not nested
  ['custom_data_label']     text
  ['custom_data_text']      text

MEDIA TAB — get_field('vc_ep_media') → group
  ['logo_horizontal']       image array → ['url']
  ['logo_vertical']         image array → ['url']
  ['event_image']           image array → ['url']   ← card image

VIDEO — get_field('video') → group  ← SEPARATE top-level group, NOT inside vc_ep_media
  ['vimeo_url']             URL string
  ['mp4_url']               URL string

MORE IMAGES — get_field('more_images') → repeater  ← top-level, NOT inside vc_ep_media
  ['image']                 image array → ['url']

MORE VIDEOS — get_field('more_videos') → repeater  ← top-level, NOT inside vc_ep_media
  ['vimeo_url']             URL string
  ['mp4_url']               URL string
  ['other']                 URL string

LINKS TAB — get_field('vc_ep_social') → group
  ['website'], ['instagram'], ['facebook']
  ['spotify'], ['twitter'], ['tiktok'], ['soundcloud'], ['other']
```

**CRITICAL ACF NOTES:**
- `tags` and `genre_selection` are **top-level taxonomy fields** (NOT inside a group).
- Both have `save_terms: 0` and `load_terms: 0` — bypasses `wp_set_object_terms()`. Data stored as serialized post meta only. **Do not change this.**
- `tags` and `genre_selection` return `WP_Term[]` objects — NOT readable via Oxygen dynamic data picker. Must use Code Blocks with `vc_render_chips()`.
- `video` is a **top-level group** (`get_field('video')`), NOT nested inside `vc_ep_media`. Any code reading `$media['video']` is wrong.
- `tbd` is a **top-level group** (`get_field('tbd')`), NOT nested inside `vc_ep_dates`.
- `capacity_label` and `capacity_amount` are **flat top-level fields** — old path `$details['capacity']['capacity']` no longer exists.
- `contact_emails` is a **per-post field** (still in the group). Zoo Agency options page field is `zoo_contact_emails` (accessed via `get_field('zoo_contact_emails', 'option')`). Both exist — per-post overrides if populated, options page is the fallback.
- `vc_ep_details` group now contains ONLY: city, state, venue, established. Capacity, genre label, and custom data all moved to flat top-level fields.

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
data-venue    → vc_ep_details → venue
data-year     → year field value
data-is-past  → "1" if start_date < today, else "0"
```
These are set by WPCode #3589 (emh-listings-data-attrs.php), not Oxygen custom attributes.

---

## Files in This Workspace

| File | Purpose | Status |
|---|---|---|
| `vc-listings.js` (v3.2.0) | WPCode #3607 · JS · Footer | Production |
| `vc-listings.css` (v1.2.0) | WPCode #3608 · CSS · Site Wide Header | Production |
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
| #3608 | VC Event Property Listing Style — v1.2.0 (vc-listings.css, EMH classes) | CSS Snippet | Site Wide Header | Active |
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

CSS is **complete and deployed** via WPCode #3602 (CSS Snippet, Site Wide Header, Active). Tokens confirmed resolving on `/event-properties-grid/`. 14 sections written: tokens, wrapper, controls, year group, repeater grid/list modes, tile view, list view, modal, responsive, search widget, TBD dates, nth year, controls section split, view show/hide.

---

## Known Issues / Pending Work

### Active
- **WPCode #3589 capacity reads** — Still reads `$details['capacity']['capacity']` and `$details['capacity']['label']`. Must update to `get_field('capacity_label')` and `get_field('capacity_amount')` (flat top-level fields).
- **WPCode #3589 video reads** — Any code reading `$media['video']['vimeo_url']` must change to `get_field('video')['vimeo_url']` (video is top-level, not inside vc_ep_media).
- **WPCode #3589 tbd reads** — If reading `$dates['tbd']`, change to `get_field('tbd')` (top-level group, not inside vc_ep_dates).
- **Card build** — Tile + list panels not yet built in Oxygen. Two-panel tab approach confirmed (see View Toggle Architecture section). PHP Code Block outputs both loops.
- **WPCode #3602** — Old VC CSS snippet, still active. Deactivate once #3608 confirmed stable.

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
