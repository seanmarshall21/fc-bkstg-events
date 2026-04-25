<?php
/**
 * emh-listings-data-attrs.php
 * v.01.06
 * 2026-04-24
 * WPCode #3589 · PHP Snippet · Auto Insert · All Pages · Priority 99
 *
 * v.01.06 — Reverted from ID-based to index-based card matching.
 *   v.01.05's [data-eid] approach required Oxygen node 4196 to compile,
 *   which requires the Oxygen builder UI (ct_sign_sha256). That node never
 *   appeared in the DOM so #3589 was silently broken (no data attrs set).
 *
 *   Index-based works because WPCode #3746 applies posts_orderby to ALL
 *   WP_Query instances — including this get_posts() call — so PHP and DOM
 *   are in identical SQL-ordered sequence. $data[0] maps to card[0], etc.
 *
 *   Changes vs v.01.05:
 *   - $data[] = [...] (indexed, not keyed by post ID)
 *   - usort removed (WPCode #3746 handles order for both queries)
 *   - JS: index-based cards.forEach(card, i) lookup
 *   - Removed [data-eid] span lookup entirely
 *
 * Runs at wp_footer after vc-listings.js has initialised.
 * For each .emh_listings_parent card:
 *   1. Sets data-brand / data-venue / data-year / data-is-past / data-start-date
 *   2. Injects tag chips into .vc_listigs_row_tag containers
 *   3. Injects genre chips into .vc_listigs_chip_tag_large parent containers
 *   4. Calls window.emhListings_refresh() to rebuild dropdowns + refilter
 *
 * NOTE: "vc_listigs_" (missing second n) is intentional — matches Oxygen DOM.
 *
 * ── ACF field locations ───────────────────────────────────────────────────
 *   tags   → top-level field, field name 'tags',            type: taxonomy
 *   genres → top-level field, field name 'genre_selection', type: taxonomy
 * ─────────────────────────────────────────────────────────────────────────
 */

add_action( 'wp_footer', function () {

    // Never run on admin, AJAX, or REST API requests
    if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) return;

    if ( ! function_exists( 'get_field' ) ) return;

    $today = intval( date( 'Ymd' ) );

    // get_posts() picks up WPCode #3746's posts_orderby filter automatically —
    // same SQL order as Oxygen's Easy Posts repeater. Index alignment guaranteed.
    $posts = get_posts( [
        'post_type'      => 'vc_event_property',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'ID',   // overridden by #3746 filter at query level
        'order'          => 'ASC',
    ] );

    if ( empty( $posts ) ) return;

    $data = [];

    foreach ( $posts as $p ) {
        $pid = $p->ID;

        // ── Core filter attributes ────────────────────────────────────────
        $brand   = get_field( 'brand', $pid ) ?: '';
        $year    = get_field( 'year', $pid ) ?: '';
        $details = get_field( 'vc_ep_details', $pid ) ?: [];
        $venue   = isset( $details['venue'] ) ? $details['venue'] : '';
        $dates   = get_field( 'vc_ep_dates', $pid ) ?: [];
        $start   = isset( $dates['start_date'] ) ? intval( $dates['start_date'] ) : 0;
        $is_past = ( $start > 0 && $start < $today ) ? '1' : '0';

        // ── Tags — top-level taxonomy field ──────────────────────────────
        $tag_terms = get_field( 'tags', $pid ) ?: [];
        $tags = emh_extract_term_names( $tag_terms );

        // ── Genres — top-level taxonomy field ────────────────────────────
        $genre_terms = get_field( 'genre_selection', $pid ) ?: [];
        $genres = emh_extract_term_names( $genre_terms );

        // Indexed — JS maps data[i] to cards[i] (same SQL order from #3746)
        $data[] = [
            'brand'     => (string) $brand,
            'venue'     => (string) $venue,
            'year'      => (string) $year,
            'isPast'    => $is_past,
            'startDate' => $start > 0 ? (string) $start : '',
            'tags'      => $tags,
            'genres'    => $genres,
        ];
    }

    if ( empty( $data ) ) return;

    ?>
    <script id="emh-listings-data">
    (function () {

      // data is a 0-indexed array; cards querySelectorAll returns DOM order
      // Both are ordered by WPCode #3746's posts_orderby SQL filter — indexes align.
      var data  = <?php echo wp_json_encode( array_values( $data ) ); ?>;
      var cards = document.querySelectorAll('.emh_listings_parent');

      /**
       * Build chip HTML string from an array of label strings.
       * chipClass — CSS class on each chip div
       */
      function buildChips(labels, chipClass) {
        if (!labels || !labels.length) return '';
        return labels.map(function(label) {
          return '<div class="' + chipClass + '">'
            + String(label)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            + '</div>';
        }).join('');
      }

      /**
       * Genre containers: find unique parent elements of .vc_listigs_chip_tag_large
       * children (one per view: tile + list). Replace innerHTML with dynamic chips.
       * Note: class uses intentional typo "listigs" (missing second n) — matches DOM.
       */
      function injectGenreChips(card, labels) {
        var seen    = [];
        var parents = [];
        card.querySelectorAll('.vc_listigs_chip_tag_large').forEach(function(chip) {
          var parent = chip.parentElement;
          if (parent && seen.indexOf(parent) < 0) {
            seen.push(parent);
            parents.push(parent);
          }
        });
        var html = buildChips(labels, 'vc_listigs_chip_tag_large');
        parents.forEach(function(el) { el.innerHTML = html; });
      }

      // Index-based matching: card[i] → data[i]
      // Works because WPCode #3746 applies the same posts_orderby to both
      // the Oxygen Easy Posts repeater query and this get_posts() call.
      cards.forEach(function(card, i) {
        if (!data[i]) return;
        var d = data[i];

        // 1. Filter data attributes
        card.dataset.brand     = d.brand     || '';
        card.dataset.venue     = d.venue     || '';
        card.dataset.year      = d.year      || '';
        card.dataset.isPast    = d.isPast    || '0';
        card.dataset.startDate = d.startDate || '';

        // 2. Tag chips — .vc_listigs_row_tag exists once per view (tile + list)
        //    Note: "listigs" is intentional typo matching the Oxygen DOM
        card.querySelectorAll('.vc_listigs_row_tag').forEach(function(container) {
          container.innerHTML = buildChips(d.tags, 'vc_listigs_chip_tag');
        });

        // 3. Genre chips — find parent containers from the static placeholder chips
        injectGenreChips(card, d.genres);
      });

      // Re-run filter population now that data attributes are set
      if (typeof window.emhListings_refresh === 'function') {
        window.emhListings_refresh();
      }

    })();
    </script>
    <?php

}, 99 );

/**
 * emh_extract_term_names()
 * Safely extracts term name strings from a taxonomy field value.
 * Handles: WP_Term objects, associative arrays with 'name' key,
 *          plain strings, and comma-delimited strings.
 *
 * @param  mixed $field_value  Raw value from get_field()
 * @return string[]            Flat array of term name strings
 */
function emh_extract_term_names( $field_value ) {
    if ( empty( $field_value ) ) return [];

    // Wrap single item in array for uniform handling
    if ( ! is_array( $field_value ) ) {
        $field_value = [ $field_value ];
    }

    $names = [];

    foreach ( $field_value as $item ) {
        if ( $item instanceof WP_Term ) {
            // Standard ACF taxonomy field return (return_format: object)
            $names[] = $item->name;
        } elseif ( is_array( $item ) && isset( $item['name'] ) ) {
            // ACF returns array format for taxonomy terms in some configs
            $names[] = $item['name'];
        } elseif ( is_int( $item ) || ( is_string( $item ) && ctype_digit( $item ) ) ) {
            // return_format: id — fetch the term
            $term = get_term( intval( $item ) );
            if ( $term && ! is_wp_error( $term ) ) {
                $names[] = $term->name;
            }
        } elseif ( is_string( $item ) && strpos( $item, ',' ) !== false ) {
            // Comma-delimited fallback
            foreach ( array_map( 'trim', explode( ',', $item ) ) as $v ) {
                if ( $v !== '' ) $names[] = $v;
            }
        } elseif ( is_string( $item ) && $item !== '' ) {
            $names[] = $item;
        }
    }

    return array_values( $names );
}
