# VC Listings — Oxygen Builder Rebuild Reference
Zoo Agency Event Properties · vc_event_property CPT

---

## Overview

The listings system has four distinct layers:
1. **HTML structure** — divs, classes, data attributes (built in Oxygen)
2. **CSS** — `vc-listings.css` (loaded via child theme or WPCode)
3. **JS** — `vc-listings.js` + `vc-video-hover.js` (loaded via WPCode, footer)
4. **GSAP** — loaded from CDN in `<head>` before the JS

None of the JS or CSS is hardcoded to specific content — it reads everything
from `data-*` attributes on each item. Oxygen's job is to output the correct
HTML structure with the correct classes and data attributes populated from ACF.

---

## External Scripts — Load Order Matters

Add to `<head>` (child theme `wp_enqueue_scripts` or WPCode — Before `</head>`):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Flip.min.js"></script>
```

Add before `</body>` (WPCode — After `</body>` or child theme footer):
```html
<script src="/path/to/js/vc-listings.js"></script>
<script src="/path/to/js/vc-video-hover.js"></script>
```

GSAP MUST be in `<head>`. The two vc- scripts MUST be in footer AFTER GSAP.

---

## Stylesheet

One file: `vc-listings.css`  
Load via child theme `wp_enqueue_scripts` or WPCode before `</head>`.  
Do NOT put in Oxygen's stylesheet editor — keep it external and versioned.

---

## Complete HTML Structure with Oxygen Element Types

### 1. Controls Bar

**Oxygen element:** Code Block (or Div + nested elements)  
**Recommended:** Single PHP Code Block — the selects are JS-populated so
they don't need Oxygen dynamic data.

```html
<div class="vc_listings_controls">

  <!-- Sort group -->
  <div class="vc_listings_controls_group">
    <button class="vc_listings_sort_name" data-sort-dir="">A–Z</button>
    <button class="vc_listings_sort_date" data-sort-dir="">Date</button>
  </div>

  <!-- Filter group -->
  <div class="vc_listings_controls_group">
    <select class="vc_listings_filter_brand"></select>
    <select class="vc_listings_filter_location"></select>
    <select class="vc_listings_filter_year"></select>
  </div>

  <!-- Past events toggle -->
  <label>
    <input type="checkbox" class="vc_listings_filter_past" />
    Show Past
  </label>

  <!-- Spacer pushes right-side controls to far right -->
  <div class="vc_listings_controls_spacer"></div>

  <!-- Search -->
  <input type="text" class="vc_listings_search" placeholder="Search events..." />

  <!-- View toggles -->
  <button class="vc_listings_toggle_grid" title="Grid view">
    <svg viewBox="0 0 16 16">
      <rect x="1" y="1" width="6" height="6" rx="1"/>
      <rect x="9" y="1" width="6" height="6" rx="1"/>
      <rect x="1" y="9" width="6" height="6" rx="1"/>
      <rect x="9" y="9" width="6" height="6" rx="1"/>
    </svg>
  </button>
  <button class="vc_listings_toggle_list" title="List view">
    <svg viewBox="0 0 16 16">
      <rect x="1" y="1"   width="14" height="3" rx="1"/>
      <rect x="1" y="6.5" width="14" height="3" rx="1"/>
      <rect x="1" y="12"  width="14" height="3" rx="1"/>
    </svg>
  </button>

</div>
```

The three `<select>` elements are left empty — JS auto-populates their
options by reading unique values from the item data attributes on init.

---

### 2. Repeater

**Oxygen element:** Easy Posts OR PHP Code Block  
**Recommended for full control:** PHP Code Block with a WP_Query.

The repeater wrapper class is what JS and CSS target for grid/list layout:

```html
<div class="vc_listings_repeater">
  <!-- items go here, one per post -->
</div>
```

JS adds/removes these modifier classes on view toggle:
- `vc_listings_repeater--grid` (grid layout active)
- `vc_listings_repeater--list` (list layout active)

CSS uses these modifiers to switch between grid columns and stacked rows.

---

### 3. Each Item — Data Attributes

**Oxygen element:** Each iteration of Easy Posts / Repeater, or PHP loop  
**Critical:** Every `data-listing-item-*` attribute must be populated.
JS reads ONLY from these attributes — it never touches ACF directly.

```html
<div class="vc_listings_repeater_item"
  data-listing-item-title="[ACF: vc_ep_title]"
  data-listing-item-brand="[ACF: brand — select field]"
  data-listing-item-location="[ACF: vc_ep_details → city, state]"
  data-listing-item-date="[ACF: vc_ep_dates → start_date — format YYYY-MM-DD]"
  data-listing-item-year="[ACF: year — flat number field]"
  data-listing-item-vimeo="[ACF: vc_ep_media → videos → vimeo_url — ID only]"
  data-listing-item-image="[ACF: vc_ep_media → images[0] → image → url]"
>
```

**ACF field path for each attribute (based on exported field group):**

> **Note on sub-field naming:** Sub-fields inside Groups use short names (no `vc_ep_` prefix).
> Only top-level fields (`vc_ep_title`, `vc_ep_dates`, `vc_ep_media`, etc.) use the full prefix.

| data attribute | ACF path | Notes |
|---|---|---|
| `data-listing-item-title` | `get_field('vc_ep_title')` | Display title |
| `data-listing-item-brand` | `get_field('brand')` | Flat select: FNGRS CRSSD, Outriders Present, LED, MVA |
| `data-listing-item-location` | `get_field('vc_ep_details')['city']` + `['state']` | "City, ST" |
| `data-listing-item-date` | `get_field('vc_ep_dates')['start_date']` | ACF returns m/d/Y — reformat to YYYY-MM-DD |
| `data-listing-item-year` | `get_field('year')` | Flat number field — or derive from start_date |
| `data-listing-item-vimeo` | `get_field('vc_ep_media')['videos']['vimeo_url']` | videos is a Group (single set), extract numeric ID |
| `data-listing-item-image` | `get_field('vc_ep_media')['images'][0]['image']['url']` | images is a Repeater, sub-field name is `image` |

**PHP for data attributes inside a WP loop:**
```php
<?php
$ep_title   = get_field('vc_ep_title') ?: get_the_title();
$ep_brand   = get_field('brand') ?: '';         // flat select field
$ep_year    = get_field('year') ?: '';           // flat number field
$ep_dates   = get_field('vc_ep_dates') ?: [];
$ep_details = get_field('vc_ep_details') ?: [];
$ep_media   = get_field('vc_ep_media') ?: [];

// Date: ACF return_format is m/d/Y (e.g. "04/20/2026") → reformat to YYYY-MM-DD
// Sub-field name is 'start_date' (no vc_ep_ prefix)
$raw_date   = $ep_dates['start_date'] ?? '';
if ($raw_date) {
    $dt         = DateTime::createFromFormat('m/d/Y', $raw_date);
    $start_date = $dt ? $dt->format('Y-m-d') : '';
    $year       = $ep_year ?: ($dt ? $dt->format('Y') : '');
} else {
    $start_date = '';
    $year       = $ep_year ?: '';
}

// Location — sub-field names are 'city' and 'state' (no vc_ep_ prefix)
$city       = $ep_details['city'] ?? '';
$state_abbr = $ep_details['state'] ?? '';
$location   = $state_abbr ? "$city, $state_abbr" : $city;

// Vimeo ID — videos is a GROUP (not repeater), single set of URLs
// Sub-field name is 'vimeo_url'
$videos    = $ep_media['videos'] ?? [];
$vimeo_url = $videos['vimeo_url'] ?? '';
$vimeo_id  = preg_replace('/[^0-9]/', '', basename(rtrim($vimeo_url, '/')));

// First image URL — images is a Repeater, sub-field name is 'image'
$images  = $ep_media['images'] ?? [];
$img_url = $images[0]['image']['url'] ?? '';

// Fallback: flat event_image field (top-level, outside media group)
if (!$img_url) {
    $flat_img = get_field('event_image');
    $img_url  = is_array($flat_img) ? ($flat_img['url'] ?? '') : ($flat_img ?: '');
}
?>
<div class="vc_listings_repeater_item"
  data-listing-item-title="<?php echo esc_attr($ep_title); ?>"
  data-listing-item-brand="<?php echo esc_attr($ep_brand); ?>"
  data-listing-item-location="<?php echo esc_attr($location); ?>"
  data-listing-item-date="<?php echo esc_attr($start_date); ?>"
  data-listing-item-year="<?php echo esc_attr($year); ?>"
  data-listing-item-vimeo="<?php echo esc_attr($vimeo_id); ?>"
  data-listing-item-image="<?php echo esc_url($img_url); ?>"
>
```

---

### 4. Inside Each Item — Tile View

**Oxygen element:** Div with class `vc_listings_repeater_view_tile`  
Shown when grid view is active. Hidden by JS when list view is active.

```html
<div class="vc_listings_repeater_view_tile">

  <div class="vc_listings_item_image">
    <!-- Oxygen Image element or PHP img tag -->
    <img src="[ACF image url]" alt="[event title]" loading="lazy" />
  </div>

  <div class="vc_listings_item_content">
    <h3 class="vc_listings_item_title">[ACF: vc_ep_title]</h3>
    <div class="vc_listings_item_meta">
      <span>[brand]</span>
      <span>[city]</span>
      <span>[formatted date]</span>
    </div>
  </div>

</div>
```

---

### 5. Inside Each Item — List View

**Oxygen element:** Div with class `vc_listings_repeater_view_list`  
Same content as tile view. JS shows this when list view is active,
hides `.vc_listings_repeater_view_tile`.

```html
<div class="vc_listings_repeater_view_list">

  <div class="vc_listings_item_image">
    <img src="[ACF image url]" alt="[event title]" loading="lazy" />
  </div>

  <div class="vc_listings_item_content">
    <h3 class="vc_listings_item_title">[ACF: vc_ep_title]</h3>
    <div class="vc_listings_item_meta">
      <span>[brand]</span>
      <span>[city]</span>
      <span>[formatted date]</span>
    </div>
  </div>

</div>
```

Note: Both views exist inside every item simultaneously. JS toggles display.
In Oxygen, build both as separate Div children inside the item wrapper.

---

### 6. Modal

**Oxygen element:** Single Code Block placed ONCE on the page (outside the repeater).  
JS populates `.vc_listings_modal_body` dynamically when a card is clicked.
You do not need to add content here — leave the body empty.

```html
<div class="vc_listings_modal" aria-hidden="true">
  <div class="vc_listings_modal_inner">
    <button class="vc_listings_modal_close" aria-label="Close">&times;</button>
    <div class="vc_listings_modal_body">
      <!-- JS injects: video iframe OR image + title + meta -->
    </div>
  </div>
</div>
```

JS-injected classes inside modal body (style these in vc-listings.css):
- `.vc_listings_modal_media` — wraps video or image
- `.vc_listings_modal_video` — iframe (when Vimeo ID present)
- `.vc_listings_modal_image` — img (when no Vimeo ID)
- `.vc_listings_modal_info` — text content wrapper
- `.vc_listings_modal_title` — h2
- `.vc_listings_modal_meta` — spans for brand / location / date
- `.vc_listings_modal_brand`
- `.vc_listings_modal_location`
- `.vc_listings_modal_date`

---

## JS-Managed State Classes (reference for CSS)

| Class | Applied to | When |
|---|---|---|
| `vc_listings_repeater--grid` | `.vc_listings_repeater` | Grid view active |
| `vc_listings_repeater--list` | `.vc_listings_repeater` | List view active |
| `vc_active` | `.vc_listings_toggle_grid/list` | That view is current |
| `vc_active` | `.vc_listings_sort_name/date` | That sort is active |
| `vc_listings_modal--open` | `.vc_listings_modal` | Modal is open |
| `vc_modal_open` | `<body>` | Modal is open (use to suppress scroll) |

---

## Full Class Inventory

```
.vc_listings_controls               Controls bar wrapper
.vc_listings_controls_group         Groups related controls (flex row)
.vc_listings_controls_spacer        Flex spacer (push right)
.vc_listings_sort_name              A-Z sort button
.vc_listings_sort_date              Date sort button
.vc_listings_filter_brand           Brand select
.vc_listings_filter_location        Location select
.vc_listings_filter_year            Year select
.vc_listings_filter_past            Past events checkbox
.vc_listings_search                 Search text input
.vc_listings_toggle_grid            Grid view button
.vc_listings_toggle_list            List view button

.vc_listings_repeater               Item grid/list container
.vc_listings_repeater--grid         Modifier: grid layout
.vc_listings_repeater--list         Modifier: list layout
.vc_listings_repeater_item          Single event card/row

.vc_listings_repeater_view_tile     Tile/card inner markup
.vc_listings_repeater_view_list     List row inner markup
.vc_listings_item_image             Image wrapper
.vc_listings_item_content           Text content wrapper
.vc_listings_item_title             h3 event name
.vc_listings_item_meta              Brand / location / date spans

.vc_listings_modal                  Modal overlay
.vc_listings_modal--open            Modifier: modal is visible
.vc_listings_modal_inner            Modal box
.vc_listings_modal_close            × close button
.vc_listings_modal_body             JS-populated content area
.vc_listings_modal_media            Video or image wrapper (JS-injected)
.vc_listings_modal_video            Vimeo iframe (JS-injected)
.vc_listings_modal_image            Image (JS-injected)
.vc_listings_modal_info             Text block (JS-injected)
.vc_listings_modal_title            h2 (JS-injected)
.vc_listings_modal_meta             Meta spans wrapper (JS-injected)
.vc_listings_modal_brand            Brand span (JS-injected)
.vc_listings_modal_location         Location span (JS-injected)
.vc_listings_modal_date             Date span (JS-injected)

.vc_active                          Active state on sort/view buttons
.vc_modal_open                      On <body> when modal open
```

---

## JS Bug Fix Required Before Using in Production

In `vc-listings.js`, the A-Z sort passes `"name"` as the field key but the
data attribute is `data-listing-item-title`. Change two occurrences:

```js
// In bindEvents() — line ~290:
btn.addEventListener("click", () => toggleSort("title"))  // was "name"

// In updateSortUI() — line ~175 (two checks):
btn.classList.toggle("vc_active", state.sortField === "title")  // was "name"
btn.setAttribute("data-sort-dir", state.sortField === "title" ? state.sortOrder : "")  // was "name"
```
