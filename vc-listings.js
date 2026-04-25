/**
 * v3.7.0
 * 2026-04-24 PDT
 *
 * vc-listings.js
 * Zoo Agency · EMH Event Property Listings Controller
 *
 * Changelog:
 * v3.7.0 — 2026-04-24 — ZFC redesign: compact flyout drawer system.
 *                        Replaces horizontal chip bar with a toggle button that
 *                        slides a drawer open (GSAP width animation). Each filter
 *                        dimension has a flyout trigger (LABEL ↓) that opens a
 *                        floating panel below, overlaying the card grid. Panel
 *                        items are multi-select (OR within group, AND between).
 *                        Active trigger state: grey filled bg when selections exist.
 *                        Drawer overflow: hidden during animation, visible when open
 *                        so panels can escape the drawer bounds. Toggle button
 *                        gains .has-active when any filter is selected.
 * v3.6.0 — 2026-04-24 — ZFC multi-select chip filter bar (replaced in v3.7.0).
 * v3.5.0 — 2026-04-24 — Search changed to version from crssd.com site.
 * v3.4.0 — 2026-04-23 — GSAP Flip enter/exit on filter/search/sort ops.
 * v3.3.0 — 2026-04-23 — CLS.grid/list updated to 'grid-view'/'list-view'.
 * v3.2.0 — 2026-04-23 — Search selectors renamed emh_cntrl_srch_* → emh_search_*
 * v3.1.0 — initHoverVideo() added (lazy Vimeo background video)
 *
 * Filter data attributes (set by WPCode #3589):
 *   data-brand      → ACF: brand
 *   data-venue      → ACF: venue (taxonomy)
 *   data-year       → ACF: year
 *   data-is-past    → "1" if start_date < today
 *   data-start-date → Ymd integer string (e.g. "20260420")
 *
 * ZFC HTML structure (Oxygen Code Block node 569):
 *   .zfc_wrap
 *     button.zfc_toggle                    ← always visible, slides drawer
 *     .zfc_drawer                          ← GSAP animates width 0 → auto
 *       .zfc_drawer_inner                  ← flex row of filter items
 *         .zfc_flyout[data-zfc-filter]     ← one per filter dimension
 *           button.zfc_flyout_trigger      ← LABEL ↓
 *             .zfc_label
 *             .zfc_count                   ← injected by JS when active: (n)
 *             .zfc_chevron
 *           .zfc_flyout_panel              ← absolute, overlays grid
 *             button.zfc_option            ← one per value (JS-populated)
 *         button.zfc_past                  ← Past Events pill toggle
 *
 * Requires: GSAP + Flip plugin (global, loaded before this script)
 * Deployment: WPCode #3748 → JavaScript → Footer, after GSAP CDN
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
    sortDate:    '.emh_cntrl_sort_date',
    zfcWrap:     '.zfc_wrap',
  };

  // ─── Class names ─────────────────────────────────────────────────────────────
  var CLS = {
    grid:      'grid-view',
    list:      'list-view',
    active:    'emh_active',
    flipping:  'emh_listings_flipping',
    isActive:  'is-active',
    isOpen:    'is-open',
    hasActive: 'has-active',
  };

  // ─── State ───────────────────────────────────────────────────────────────────
  var state = {
    view:      'grid',
    brand:     '',
    venue:     '',
    year:      '',
    past:      false,
    query:     '',
    sortOrder: 'asc',
  };

  // ─── ZFC state ───────────────────────────────────────────────────────────────
  var zfcActive      = false;
  var zfcDrawerOpen  = false;
  var zfcNaturalWidth = 0;
  var zfcState = {
    brand: [],
    venue: [],
    year:  [],
    past:  false,
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
        return;
      } catch (e) {
        repeater.classList.remove(CLS.flipping);
      }
    }

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

    var saved = 'grid';
    try { saved = localStorage.getItem('emh_listings_view') || 'grid'; } catch (e) {}
    if (repeater) setView(saved, repeater, false);
    if (btnGrid) btnGrid.classList.toggle(CLS.active, saved === 'grid');
    if (btnList) btnList.classList.toggle(CLS.active, saved === 'list');

    if (btnGrid) btnGrid.addEventListener('click', function () { activate('grid'); });
    if (btnList) btnList.addEventListener('click', function () { activate('list'); });
  }

  // ─── Legacy dropdown filters ──────────────────────────────────────────────────

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
      } catch (e) {}
    }

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

    if (selBrand) selBrand.addEventListener('change', function () { state.brand = selBrand.value;  applyFilters(true); });
    if (selVenue) selVenue.addEventListener('change', function () { state.venue = selVenue.value;  applyFilters(true); });
    if (selYear)  selYear.addEventListener('change',  function () { state.year  = selYear.value;   applyFilters(true); });
    if (chkPast)  chkPast.addEventListener('change',  function () { state.past  = chkPast.checked; applyFilters(true); });
  }

  // ─── ZFC (Zoo Filter Controls) — flyout drawer ───────────────────────────────
  // Toggle button slides drawer open via GSAP width animation.
  // Each filter dimension has a flyout panel (absolute, overlays card grid).
  // Multi-select within group = OR logic. Multiple groups = AND logic.
  // state.query (search) shared with legacy filter path.

  // Returns true if any ZFC filter is active
  function zfcHasActive() {
    return zfcState.brand.length > 0 ||
           zfcState.venue.length > 0 ||
           zfcState.year.length  > 0 ||
           zfcState.past;
  }

  // Sync toggle button .has-active class
  function syncToggleState(toggleBtn) {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle(CLS.hasActive, zfcHasActive());
  }

  // Update trigger label and filled-state for one flyout group
  function updateTriggerState(flyout, filterKey) {
    var trigger = flyout.querySelector('.zfc_flyout_trigger');
    if (!trigger) return;

    var arr = zfcState[filterKey] || [];
    var hasActive = arr.length > 0;

    trigger.classList.toggle(CLS.isActive, hasActive);

    // Count badge: (n) appended after label when selections exist
    var count = trigger.querySelector('.zfc_count');
    if (hasActive) {
      if (!count) {
        count = document.createElement('span');
        count.className = 'zfc_count';
        var chevron = trigger.querySelector('.zfc_chevron');
        trigger.insertBefore(count, chevron || null);
      }
      count.textContent = '(' + arr.length + ')';
    } else if (count) {
      count.parentNode.removeChild(count);
    }
  }

  // Build / rebuild option buttons inside each flyout panel from card data attrs
  function buildZFCOptions(items) {
    var wrap = document.querySelector(SEL.zfcWrap);
    if (!wrap) return;

    wrap.querySelectorAll('.zfc_flyout[data-zfc-filter]').forEach(function (flyout) {
      var filterKey = flyout.getAttribute('data-zfc-filter');
      var panel     = flyout.querySelector('.zfc_flyout_panel');
      if (!panel) return;

      // Collect unique non-empty values from card data attrs
      var values = [];
      items.forEach(function (el) {
        var val = (el.dataset[filterKey] || '').trim();
        if (val && values.indexOf(val) < 0) values.push(val);
      });
      values.sort();

      var selected = zfcState[filterKey] || [];

      // Rebuild option buttons
      panel.innerHTML = '';
      values.forEach(function (val) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zfc_option';
        btn.setAttribute('data-value', val);
        var isSelected = selected.indexOf(val) >= 0;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.textContent = val;
        if (isSelected) btn.classList.add(CLS.isActive);
        panel.appendChild(btn);
      });

      updateTriggerState(flyout, filterKey);
    });

    // Re-measure drawer natural width after options rebuild (values may have changed)
    var drawer = wrap.querySelector('.zfc_drawer');
    if (drawer && zfcDrawerOpen) {
      // Drawer is open — re-measure isn't critical, leave current width
    } else if (drawer && !zfcDrawerOpen) {
      // Re-measure for next open
      zfcNaturalWidth = measureDrawer(drawer);
    }
  }

  // Measure drawer's natural width without disrupting layout
  function measureDrawer(drawer) {
    var prev = { width: drawer.style.width, overflow: drawer.style.overflow, visibility: drawer.style.visibility };
    drawer.style.width      = 'auto';
    drawer.style.overflow   = 'visible';
    drawer.style.visibility = 'hidden';
    var w = drawer.scrollWidth;
    drawer.style.width      = prev.width;
    drawer.style.overflow   = prev.overflow;
    drawer.style.visibility = prev.visibility;
    return w;
  }

  // Close all open flyout panels
  function closeAllPanels() {
    document.querySelectorAll('.zfc_flyout_panel.' + CLS.isOpen).forEach(function (panel) {
      var flyout = panel.closest('.zfc_flyout');
      panel.classList.remove(CLS.isOpen);
      if (flyout) {
        var trigger = flyout.querySelector('.zfc_flyout_trigger');
        if (trigger) trigger.classList.remove(CLS.isOpen);
      }
    });
  }

  // Open one flyout panel (closes others first)
  function openFlyoutPanel(panel, flyout) {
    closeAllPanels();
    panel.classList.add(CLS.isOpen);
    var trigger = flyout.querySelector('.zfc_flyout_trigger');
    if (trigger) trigger.classList.add(CLS.isOpen);
    if (window.gsap) {
      gsap.fromTo(panel,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }

  function matchesZFCFilters(el, q) {
    var brand  = (el.dataset.brand  || '').trim();
    var venue  = (el.dataset.venue  || '').trim();
    var year   = (el.dataset.year   || '').trim();
    var isPast = el.dataset.isPast === '1';

    if (zfcState.brand.length && zfcState.brand.indexOf(brand) < 0) return false;
    if (zfcState.venue.length && zfcState.venue.indexOf(venue) < 0) return false;
    if (zfcState.year.length  && zfcState.year.indexOf(year)   < 0) return false;
    if (!zfcState.past && isPast)                                    return false;

    if (q) {
      var haystack = [brand, venue, year,
        (el.querySelector('.emh_listings_title') || {}).textContent || ''
      ].join(' ').toLowerCase();
      if (haystack.indexOf(q) < 0) return false;
    }

    return true;
  }

  function applyZFCFilters(animate) {
    var items = Array.from(document.querySelectorAll(SEL.item));
    var q     = state.query.toLowerCase();

    var Flip = window.Flip ||
               (window.gsap && window.gsap.plugins && window.gsap.plugins.flip);

    if (animate !== false && Flip && window.gsap) {
      try {
        var flipState = Flip.getState(items);
        items.forEach(function (el) {
          el.style.display = matchesZFCFilters(el, q) ? '' : 'none';
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
      } catch (e) {}
    }

    items.forEach(function (el) {
      el.style.display = matchesZFCFilters(el, q) ? '' : 'none';
    });
  }

  function applyActiveFilters(animate) {
    if (zfcActive) {
      applyZFCFilters(animate);
    } else {
      applyFilters(animate);
    }
  }

  function initZFC() {
    var wrap = document.querySelector(SEL.zfcWrap);
    if (!wrap) return;

    zfcActive = true;

    var toggleBtn = wrap.querySelector('.zfc_toggle');
    var drawer    = wrap.querySelector('.zfc_drawer');

    // ── Drawer toggle (GSAP width slide) ──────────────────────────────────
    if (toggleBtn && drawer && window.gsap) {
      // Measure natural width before collapsing
      zfcNaturalWidth = measureDrawer(drawer);

      // Start collapsed
      gsap.set(drawer, { width: 0, overflow: 'hidden' });

      toggleBtn.addEventListener('click', function () {
        zfcDrawerOpen = !zfcDrawerOpen;
        toggleBtn.classList.toggle(CLS.isOpen, zfcDrawerOpen);
        toggleBtn.setAttribute('aria-expanded', zfcDrawerOpen ? 'true' : 'false');

        if (zfcDrawerOpen) {
          // Re-measure in case options changed since last close
          var w = measureDrawer(drawer) || zfcNaturalWidth;
          gsap.to(drawer, {
            width: w,
            duration: 0.35,
            ease: 'power2.out',
            onComplete: function () {
              // Must be visible so flyout panels can escape drawer bounds
              gsap.set(drawer, { overflow: 'visible' });
            },
          });
        } else {
          closeAllPanels();
          gsap.set(drawer, { overflow: 'hidden' }); // clip before animating closed
          gsap.to(drawer, { width: 0, duration: 0.28, ease: 'power2.in' });
        }
      });
    }

    // ── Flyout trigger clicks ──────────────────────────────────────────────
    wrap.querySelectorAll('.zfc_flyout[data-zfc-filter]').forEach(function (flyout) {
      var trigger = flyout.querySelector('.zfc_flyout_trigger');
      var panel   = flyout.querySelector('.zfc_flyout_panel');
      if (!trigger || !panel) return;

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (panel.classList.contains(CLS.isOpen)) {
          closeAllPanels();
        } else {
          openFlyoutPanel(panel, flyout);
        }
      });

      // Delegated option click on panel
      panel.addEventListener('click', function (e) {
        var opt = e.target.closest('.zfc_option');
        if (!opt) return;

        var filterKey = flyout.getAttribute('data-zfc-filter');
        var val       = opt.getAttribute('data-value');
        var arr       = zfcState[filterKey];
        if (!arr) return;

        var idx = arr.indexOf(val);
        if (idx >= 0) {
          arr.splice(idx, 1);
          opt.classList.remove(CLS.isActive);
          opt.setAttribute('aria-pressed', 'false');
        } else {
          arr.push(val);
          opt.classList.add(CLS.isActive);
          opt.setAttribute('aria-pressed', 'true');
        }

        updateTriggerState(flyout, filterKey);
        syncToggleState(toggleBtn);
        applyZFCFilters(true);
      });
    });

    // ── Past Events pill ───────────────────────────────────────────────────
    var pastBtn = wrap.querySelector('.zfc_past');
    if (pastBtn) {
      pastBtn.addEventListener('click', function () {
        zfcState.past = !zfcState.past;
        pastBtn.classList.toggle(CLS.isActive, zfcState.past);
        pastBtn.setAttribute('aria-pressed', zfcState.past ? 'true' : 'false');
        syncToggleState(toggleBtn);
        applyZFCFilters(true);
      });
    }

    // ── Click outside closes open panels ──────────────────────────────────
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.zfc_flyout')) {
        closeAllPanels();
      }
    });
  }

  // ─── Search (GSAP animated) ───────────────────────────────────────────────────
  function initSearch() {
    var wrap     = document.querySelector(SEL.searchWrap);
    var toggle   = document.querySelector(SEL.searchToggle);
    var input    = document.querySelector(SEL.searchInput);
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
      applyActiveFilters(true);
      if (clearBtn) {
        gsap.to(clearBtn, {
          opacity:       state.query ? 1 : 0,
          pointerEvents: state.query ? 'auto' : 'none',
          duration: 0.18,
        });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        input.value = '';
        state.query = '';
        applyActiveFilters(true);
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

  // ─── Date sort ───────────────────────────────────────────────────────────────
  function sortCards(animate) {
    var repeater = document.querySelector(SEL.repeater);
    if (!repeater) return;

    var cards = Array.from(document.querySelectorAll(SEL.item));
    if (cards.length < 2) return;

    var Flip = window.Flip ||
               (window.gsap && window.gsap.plugins && window.gsap.plugins.flip);

    var flipState = (animate !== false && Flip && window.gsap)
      ? (function () { try { return Flip.getState(cards); } catch (e) { return null; } })()
      : null;

    cards.sort(function (a, b) {
      var da = parseInt(a.dataset.startDate, 10) || 0;
      var db = parseInt(b.dataset.startDate, 10) || 0;
      if (da === 0 && db === 0) return 0;
      if (da === 0) return 1;
      if (db === 0) return -1;
      return state.sortOrder === 'desc' ? db - da : da - db;
    });

    cards.forEach(function (card) { repeater.appendChild(card); });

    if (flipState && Flip && window.gsap) {
      try {
        Flip.from(flipState, {
          duration: 0.45,
          ease:     'power2.inOut',
          stagger:  { each: 0.025, from: 'start' },
          absolute: true,
        });
      } catch (e) {}
    }
  }

  function initSortToggle() {
    var btn = document.querySelector(SEL.sortDate);
    if (!btn) return;

    function updateBtn() {
      btn.classList.toggle(CLS.active, state.sortOrder === 'desc');
      btn.setAttribute('aria-pressed', state.sortOrder === 'desc' ? 'true' : 'false');
      btn.title = state.sortOrder === 'asc' ? 'Sort: newest first' : 'Sort: oldest first';
    }

    btn.addEventListener('click', function () {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      updateBtn();
      sortCards(true);
    });

    updateBtn();
  }

  // ─── Hover video (lazy Vimeo) ─────────────────────────────────────────────────
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

    initZFC(); // must run before initFilters so zfcActive is set

    populateFilters(items);
    if (zfcActive) buildZFCOptions(items);

    initFilters();
    initViewToggle();
    initSearch();
    initSortToggle();
    initHoverVideo();
    applyActiveFilters(false);
  }

  // Exposed for WPCode #3589 — called after data-attrs and chips are injected.
  window.emhListings_refresh = function () {
    var items = Array.from(document.querySelectorAll(SEL.item));
    populateFilters(items);
    if (zfcActive) buildZFCOptions(items);
    applyActiveFilters(false);
    sortCards(true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
