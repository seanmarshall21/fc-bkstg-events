/**
 * v3.4.0
 * 2026-04-23 PDT
 *
 * vc-listings.js
 * Zoo Agency · EMH Event Property Listings Controller
 *
 * Changelog:
 * v3.4.0 — 2026-04-23 — GSAP Flip enter/exit on all filter/search/sort ops.
 *                        onLeave: fade+scale down (0.3s). onEnter: grow+fade in (0.4s).
 *                        Remaining items slide to new positions via Flip position track.
 *                        matchesFilters() extracted as shared helper. applyFilters()
 *                        takes optional animate param (false on init/refresh).
 * v3.3.0 — 2026-04-23 — CLS.grid/list updated to 'grid-view'/'list-view' to match
 *                        CSS v1.4.0 single-markup architecture.
 * v3.2.0 — 2026-04-23 — Search selectors renamed emh_cntrl_srch_* → emh_search_*
 * v3.1.0 — initHoverVideo() added (lazy Vimeo background video)
 *
 * Handles: grid/list toggle (GSAP Flip), brand/venue/year/past-events
 *          filtering + dropdown population, animated search widget,
 *          hover-triggered lazy Vimeo background video.
 *
 * View toggle: JS adds 'grid-view' or 'list-view' to .emh_listings_repeater.
 *   CSS descendant selectors drive all layout differences — single markup per card.
 *   GSAP Flip animates card positions between grid and list layouts.
 *
 * Filter data attributes (set by WPCode #3589):
 *   data-brand    → ACF: brand
 *   data-venue    → ACF: vc_ep_details → venue
 *   data-year     → ACF: year
 *   data-is-past  → "1" if start_date < today
 *
 * Video:
 *   .emh_listings_video_wrap  → container (position:absolute, inset:0)
 *   iframe[data-src]          → Vimeo embed, src blank until first mouseenter
 *   CSS transitions opacity 0→1 on .emh_listings_parent:hover iframe
 *
 * Requires: GSAP + Flip plugin (global, loaded before this script)
 * Deployment: WPCode #3607 → JavaScript → Footer, after GSAP CDN
 */

(function () {
  'use strict';

  // ─── Selectors ───────────────────────────────────────────────────────────────
  var SEL = {
    repeater:    '.emh_listings_repeater',
    item:        '.emh_listings_parent',
    toggleGrid:  '.emh_cntrl_togl_grid',
    toggleList:  '.emh_cntrl_togl_list',
    filterBrand: '.emh_cntrl_fltr_brand select',
    filterVenue: '.emh_cntrl_fltr_venue select',
    filterYear:  '.emh_cntrl_fltr_year select',
    filterPast:  '.emh_cntrl_fltr_past input[type="checkbox"]',
    searchWrap:  '.emh_search_wrapper',
    searchToggle:'.emh_search_toggle',
    searchInput: '#vc-search',
    searchClear: '.emh_search_clear',
  };

  // ─── Class names ─────────────────────────────────────────────────────────────
  var CLS = {
    grid:     'grid-view',   // toggled on .emh_listings_repeater — matches CSS v1.4.0
    list:     'list-view',   // toggled on .emh_listings_repeater — matches CSS v1.4.0
    active:   'emh_active',
    flipping: 'emh_listings_flipping',
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  var state = {
    view:  'grid',
    brand: '',
    venue: '',
    year:  '',
    past:  false,
    query: '',
  };

  // ─── View toggle ─────────────────────────────────────────────────────────────
  function setView(v, repeater, animate) {
    state.view = v;

    var Flip = window.Flip ||
               (window.gsap && window.gsap.plugins && window.gsap.plugins.flip);

    if (animate && Flip && window.gsap) {
      try {
        var items = gsap.utils.toArray(SEL.item, repeater);
        var flipState = Flip.getState(items);
        repeater.classList.add(CLS.flipping);
        repeater.classList.remove(CLS.grid, CLS.list);
        repeater.classList.add(v === 'grid' ? CLS.grid : CLS.list);
        Flip.from(flipState, {
          duration:  0.5,
          ease:      'power2.inOut',
          stagger:   { each: 0.03, from: 'start' },
          absolute:  true,
          onComplete: function () {
            repeater.classList.remove(CLS.flipping);
          },
        });
        return; // Flip succeeded — skip plain swap
      } catch (e) {
        // Flip.getState threw — fall through to plain swap
        repeater.classList.remove(CLS.flipping);
      }
    }

    // Plain swap (fallback or no-animate)
    repeater.classList.remove(CLS.grid, CLS.list);
    repeater.classList.add(v === 'grid' ? CLS.grid : CLS.list);
  }

  function initViewToggle() {
    var repeater = document.querySelector(SEL.repeater);
    var btnGrid  = document.querySelector(SEL.toggleGrid);
    var btnList  = document.querySelector(SEL.toggleList);

    function activate(v) {
      if (!repeater) return;
      setView(v, repeater, true);
      if (btnGrid) btnGrid.classList.toggle(CLS.active, v === 'grid');
      if (btnList) btnList.classList.toggle(CLS.active, v === 'list');
      try { localStorage.setItem('emh_listings_view', v); } catch (e) {}
    }

    // Restore saved preference
    var saved = 'grid';
    try { saved = localStorage.getItem('emh_listings_view') || 'grid'; } catch (e) {}
    if (repeater) setView(saved, repeater, false);
    if (btnGrid) btnGrid.classList.toggle(CLS.active, saved === 'grid');
    if (btnList) btnList.classList.toggle(CLS.active, saved === 'list');

    if (btnGrid) btnGrid.addEventListener('click', function () { activate('grid'); });
    if (btnList) btnList.addEventListener('click', function () { activate('list'); });
  }

  // ─── Filters ─────────────────────────────────────────────────────────────────

  // Single source of truth for filter logic — used by applyFilters and populateFilters
  function matchesFilters(el, q) {
    var brand  = (el.dataset.brand  || '').trim();
    var venue  = (el.dataset.venue  || '').trim();
    var year   = (el.dataset.year   || '').trim();
    var isPast = el.dataset.isPast === '1';

    if (state.brand && brand.toLowerCase() !== state.brand.toLowerCase()) return false;
    if (state.venue && venue.toLowerCase() !== state.venue.toLowerCase()) return false;
    if (state.year  && year !== state.year)                               return false;
    if (!state.past && isPast)                                            return false;

    if (q) {
      var haystack = [brand, venue, year,
        (el.querySelector('.emh_listings_title') || {}).textContent || ''
      ].join(' ').toLowerCase();
      if (haystack.indexOf(q) < 0) return false;
    }

    return true;
  }

  // animate=false skips Flip (used on init and after PHP data-attr injection)
  function applyFilters(animate) {
    var items = Array.from(document.querySelectorAll(SEL.item));
    var q     = state.query.toLowerCase();

    var Flip = window.Flip ||
               (window.gsap && window.gsap.plugins && window.gsap.plugins.flip);

    if (animate !== false && Flip && window.gsap) {
      try {
        var flipState = Flip.getState(items);

        items.forEach(function (el) {
          el.style.display = matchesFilters(el, q) ? '' : 'none';
        });

        Flip.from(flipState, {
          duration: 0.4,
          ease:     'power2.inOut',
          scale:    true,
          absolute: true,
          onEnter: function (elements) {
            gsap.fromTo(elements,
              { opacity: 0, scale: 0.8 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
          },
          onLeave: function (elements) {
            gsap.to(elements,
              { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power2.in' }
            );
          },
        });
        return;
      } catch (e) {
        // Flip unavailable or threw — fall through
      }
    }

    // Plain fallback (no GSAP)
    items.forEach(function (el) {
      el.style.display = matchesFilters(el, q) ? '' : 'none';
    });
  }

  function populateFilters(items) {
    var brands = [];
    var venues = [];
    var years  = [];

    items.forEach(function (el) {
      var b  = (el.dataset.brand || '').trim();
      var ve = (el.dataset.venue || '').trim();
      var y  = (el.dataset.year  || '').trim();
      if (b  && brands.indexOf(b)  < 0) brands.push(b);
      if (ve && venues.indexOf(ve) < 0) venues.push(ve);
      if (y  && years.indexOf(y)   < 0) years.push(y);
    });

    brands.sort(); venues.sort(); years.sort();

    buildSelect(SEL.filterBrand, brands, 'All Brands');
    buildSelect(SEL.filterVenue, venues, 'All Venues');
    buildSelect(SEL.filterYear,  years,  'All Years');
  }

  function buildSelect(selector, values, placeholder) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = '<option value="">' + placeholder + '</option>';
    values.forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      el.appendChild(opt);
    });
  }

  function initFilters() {
    var selBrand = document.querySelector(SEL.filterBrand);
    var selVenue = document.querySelector(SEL.filterVenue);
    var selYear  = document.querySelector(SEL.filterYear);
    var chkPast  = document.querySelector(SEL.filterPast);

    if (selBrand) selBrand.addEventListener('change', function () { state.brand = selBrand.value;   applyFilters(true); });
    if (selVenue) selVenue.addEventListener('change', function () { state.venue = selVenue.value;   applyFilters(true); });
    if (selYear)  selYear.addEventListener('change',  function () { state.year  = selYear.value;    applyFilters(true); });
    if (chkPast)  chkPast.addEventListener('change',  function () { state.past  = chkPast.checked;  applyFilters(true); });
  }

  // ─── Search (GSAP animated) ───────────────────────────────────────────────────
  function initSearch() {
    var wrap    = document.querySelector(SEL.searchWrap);
    var toggle  = document.querySelector(SEL.searchToggle);
    var input   = document.querySelector(SEL.searchInput);
    var clearBtn = document.querySelector(SEL.searchClear);

    if (!wrap || !toggle || !input) return;

    var isOpen = false;

    gsap.set(wrap,  { width: 32, overflow: 'hidden' });
    if (clearBtn) gsap.set(clearBtn, { opacity: 0, pointerEvents: 'none' });

    function openSearch() {
      if (isOpen) return;
      isOpen = true;
      wrap.classList.add('emh_active');
      gsap.to(wrap, { width: 280, duration: 0.32, ease: 'power2.out',
        onComplete: function () { input.focus(); } });
    }

    function closeSearch() {
      if (!isOpen || (input && input.value)) return;
      isOpen = false;
      wrap.classList.remove('emh_active');
      gsap.to(wrap, { width: 32, duration: 0.28, ease: 'power2.in' });
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      isOpen ? closeSearch() : openSearch();
    });

    input.addEventListener('input', function () {
      state.query = input.value.trim();
      applyFilters(true);
      if (clearBtn) {
        gsap.to(clearBtn, {
          opacity:      state.query ? 1 : 0,
          pointerEvents: state.query ? 'auto' : 'none',
          duration: 0.18,
        });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        input.value  = '';
        state.query  = '';
        applyFilters(true);
        gsap.to(clearBtn, { opacity: 0, pointerEvents: 'none', duration: 0.18 });
        input.focus();
      });
    }

    document.addEventListener('click', function (e) {
      if (wrap && !wrap.contains(e.target)) closeSearch();
    });

    input.addEventListener('blur', function () {
      setTimeout(function () {
        if (!wrap.contains(document.activeElement)) closeSearch();
      }, 100);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen && !input.value) closeSearch();
    });
  }

  // ─── Hover video (lazy Vimeo) ─────────────────────────────────────────────────
  // iframes render with data-src instead of src. On first mouseenter the src is
  // set — Vimeo loads and autoplays in background mode (no UI, muted, looped).
  // Subsequent hovers need no action; the iframe is already live.
  function initHoverVideo() {
    var items = document.querySelectorAll(SEL.item);
    items.forEach(function (card) {
      var iframe = card.querySelector('iframe[data-src]');
      if (!iframe) return;
      var loaded = false;
      card.addEventListener('mouseenter', function () {
        if (loaded) return;
        loaded = true;
        iframe.src = iframe.getAttribute('data-src');
      });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    var items = Array.from(document.querySelectorAll(SEL.item));
    populateFilters(items);
    initFilters();
    initViewToggle();
    initSearch();
    initHoverVideo();
    applyFilters(false); // no animation on first paint
  }

  // Expose refresh for external callers (WPCode #3589 calls this after injecting
  // data-attrs and chips — skip animation since items haven't moved yet)
  window.emhListings_refresh = function () {
    var items = Array.from(document.querySelectorAll(SEL.item));
    populateFilters(items);
    applyFilters(false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
