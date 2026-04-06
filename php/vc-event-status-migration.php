<?php
/**
 * VC Event Status Migration
 *
 * Plugin: vc-event-properties
 * Purpose: Register the `event_status` ACF field on the vc_event_property CPT,
 *          expose it in REST API responses, and back-fill existing events.
 *
 * Universal naming: vc_ prefix for all functions, hooks, and field keys.
 *
 * Author: Vivo Creative
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/* ---------------------------------------------------------------------------
 * 1. ACF FIELD REGISTRATION
 * ------------------------------------------------------------------------- */

add_action( 'acf/init', 'vc_register_event_status_field' );
function vc_register_event_status_field() {

    if ( ! function_exists( 'acf_add_local_field_group' ) ) {
        return;
    }

    acf_add_local_field_group( array(
        'key'      => 'group_vc_event_status',
        'title'    => 'Event Status',
        'fields'   => array(
            array(
                'key'           => 'field_vc_event_status',
                'label'         => 'Event Status',
                'name'          => 'event_status',
                'type'          => 'select',
                'instructions'  => 'Controls visibility in the event manager app. Upcoming = planning mode. Active = current/in-progress. Archived = historical, read-only.',
                'required'      => 1,
                'choices'       => array(
                    'upcoming' => 'Upcoming (Planning)',
                    'active'   => 'Active (Current)',
                    'archived' => 'Archived (Historical)',
                ),
                'default_value' => 'upcoming',
                'return_format' => 'value',
                'ui'            => 1,
                'allow_null'    => 0,
                'multiple'      => 0,
            ),
        ),
        'location' => array(
            array(
                array(
                    'param'    => 'post_type',
                    'operator' => '==',
                    'value'    => 'vc_event_property',
                ),
            ),
        ),
        'menu_order' => 0,
        'position'   => 'side',
        'style'      => 'default',
        'active'     => true,
    ) );
}

/* ---------------------------------------------------------------------------
 * 2. REST API EXPOSURE
 * ------------------------------------------------------------------------- */

add_action( 'rest_api_init', 'vc_register_event_status_rest_field' );
function vc_register_event_status_rest_field() {

    register_rest_field( 'vc_event_property', 'event_status', array(
        'get_callback'    => 'vc_get_event_status_rest',
        'update_callback' => 'vc_update_event_status_rest',
        'schema'          => array(
            'description' => 'Lifecycle status of the event.',
            'type'        => 'string',
            'enum'        => array( 'upcoming', 'active', 'archived' ),
            'context'     => array( 'view', 'edit' ),
        ),
    ) );
}

function vc_get_event_status_rest( $object ) {
    $status = get_field( 'event_status', $object['id'] );
    return $status ? $status : 'upcoming';
}

function vc_update_event_status_rest( $value, $object ) {

    if ( ! in_array( $value, array( 'upcoming', 'active', 'archived' ), true ) ) {
        return new WP_Error(
            'vc_invalid_event_status',
            'Status must be upcoming, active, or archived.',
            array( 'status' => 400 )
        );
    }

    return update_field( 'event_status', $value, $object->ID );
}

/* ---------------------------------------------------------------------------
 * 3. BACK-FILL MIGRATION (run once)
 *
 * Heuristic based on event_start_date / event_end_date ACF fields:
 *   end_date   < today - 14d  => archived
 *   start_date <= today <= end_date + 14d => active
 *   start_date > today        => upcoming
 *
 * Runs via admin action: /wp-admin/admin.php?page=vc-event-migrate
 * Or via WP-CLI: wp vc migrate-event-status
 * ------------------------------------------------------------------------- */

add_action( 'admin_menu', 'vc_register_event_migration_page' );
function vc_register_event_migration_page() {
    add_submenu_page(
        'edit.php?post_type=vc_event_property',
        'Migrate Event Status',
        'Migrate Status',
        'manage_options',
        'vc-event-migrate',
        'vc_render_event_migration_page'
    );
}

function vc_render_event_migration_page() {

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Permission denied.' );
    }

    $results = null;
    if ( isset( $_POST['vc_run_migration'] ) && check_admin_referer( 'vc_event_migrate' ) ) {
        $results = vc_run_event_status_migration();
    }

    echo '<div class="wrap"><h1>VC Event Status Migration</h1>';
    echo '<p>Back-fills <code>event_status</code> on every <code>vc_event_property</code> post based on start/end dates.</p>';

    if ( $results ) {
        echo '<div class="notice notice-success"><p>Migration complete.</p><ul>';
        echo '<li>Upcoming: ' . intval( $results['upcoming'] ) . '</li>';
        echo '<li>Active: ' . intval( $results['active'] ) . '</li>';
        echo '<li>Archived: ' . intval( $results['archived'] ) . '</li>';
        echo '<li>Skipped (no dates): ' . intval( $results['skipped'] ) . '</li>';
        echo '</ul></div>';
    }

    echo '<form method="post">';
    wp_nonce_field( 'vc_event_migrate' );
    echo '<button class="button button-primary" name="vc_run_migration" value="1">Run Migration</button>';
    echo '</form></div>';
}

function vc_run_event_status_migration() {

    $counts = array( 'upcoming' => 0, 'active' => 0, 'archived' => 0, 'skipped' => 0 );

    $events = get_posts( array(
        'post_type'      => 'vc_event_property',
        'post_status'    => array( 'publish', 'draft' ),
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ) );

    $today     = strtotime( 'today' );
    $grace     = 14 * DAY_IN_SECONDS;

    foreach ( $events as $event_id ) {

        $start = get_field( 'event_start_date', $event_id );
        $end   = get_field( 'event_end_date', $event_id );

        if ( ! $start || ! $end ) {
            $counts['skipped']++;
            continue;
        }

        $start_ts = is_numeric( $start ) ? intval( $start ) : strtotime( $start );
        $end_ts   = is_numeric( $end )   ? intval( $end )   : strtotime( $end );

        if ( $end_ts < ( $today - $grace ) ) {
            $status = 'archived';
        } elseif ( $start_ts <= $today && $today <= ( $end_ts + $grace ) ) {
            $status = 'active';
        } elseif ( $start_ts > $today ) {
            $status = 'upcoming';
        } else {
            $status = 'archived';
        }

        update_field( 'event_status', $status, $event_id );
        $counts[ $status ]++;
    }

    return $counts;
}

/* ---------------------------------------------------------------------------
 * 4. WP-CLI COMMAND (optional)
 * ------------------------------------------------------------------------- */

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    WP_CLI::add_command( 'vc migrate-event-status', function() {
        $r = vc_run_event_status_migration();
        WP_CLI::success( sprintf(
            'Upcoming: %d  Active: %d  Archived: %d  Skipped: %d',
            $r['upcoming'], $r['active'], $r['archived'], $r['skipped']
        ) );
    } );
}

/* ---------------------------------------------------------------------------
 * 5. REST FILTER: allow ?event_status= query on the CPT collection endpoint
 * ------------------------------------------------------------------------- */

add_filter( 'rest_vc_event_property_query', 'vc_filter_events_by_status', 10, 2 );
function vc_filter_events_by_status( $args, $request ) {

    $status = $request->get_param( 'event_status' );
    if ( ! $status ) {
        return $args;
    }

    $statuses = array_filter( array_map( 'sanitize_key', (array) explode( ',', $status ) ) );

    $args['meta_query'] = array_merge(
        isset( $args['meta_query'] ) ? $args['meta_query'] : array(),
        array( array(
            'key'     => 'event_status',
            'value'   => $statuses,
            'compare' => 'IN',
        ) )
    );

    return $args;
}
