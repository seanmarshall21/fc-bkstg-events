<?php
/**
 * VC Archive Event Endpoint
 *
 * Plugin: vc-event-properties
 * Route:  POST /wp-json/vc/v1/archive-event/<event_id>
 *         POST /wp-json/vc/v1/archive-event/<event_id>/preview
 *         POST /wp-json/vc/v1/restore-event/<event_id>
 *
 * Logic:
 *   - Finds every post (vc_artist, vc_lineup_slot, vc_sponsor) that has this
 *     event in its `events` relationship field.
 *   - An item is "unique to this event" if its events[] array contains ONLY
 *     the event being archived.
 *   - Unique items get set to `draft`.
 *   - Multi-event items stay `publish`.
 *   - The event itself flips to event_status = 'archived'.
 *
 * Restore: flips event_status back to 'upcoming'. Does NOT auto-republish
 * drafted items — user does that manually.
 *
 * Universal naming: vc_ prefix, `events` is the relationship field name on
 * all scoped content types. Adjust VC_SCOPED_POST_TYPES if your CPTs differ.
 *
 * Author: Vivo Creative
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'VC_SCOPED_POST_TYPES', array( 'vc_artist', 'vc_lineup_slot', 'vc_sponsor' ) );
define( 'VC_EVENT_RELATIONSHIP_FIELD', 'events' );

/* ---------------------------------------------------------------------------
 * REGISTER ROUTES
 * ------------------------------------------------------------------------- */

add_action( 'rest_api_init', 'vc_register_archive_routes' );
function vc_register_archive_routes() {

    register_rest_route( 'vc/v1', '/archive-event/(?P<event_id>\d+)', array(
        'methods'             => 'POST',
        'callback'            => 'vc_archive_event_handler',
        'permission_callback' => 'vc_archive_permission_check',
        'args'                => array(
            'event_id' => array( 'validate_callback' => 'is_numeric' ),
        ),
    ) );

    register_rest_route( 'vc/v1', '/archive-event/(?P<event_id>\d+)/preview', array(
        'methods'             => 'POST',
        'callback'            => 'vc_archive_event_preview',
        'permission_callback' => 'vc_archive_permission_check',
        'args'                => array(
            'event_id' => array( 'validate_callback' => 'is_numeric' ),
        ),
    ) );

    register_rest_route( 'vc/v1', '/restore-event/(?P<event_id>\d+)', array(
        'methods'             => 'POST',
        'callback'            => 'vc_restore_event_handler',
        'permission_callback' => 'vc_archive_permission_check',
        'args'                => array(
            'event_id' => array( 'validate_callback' => 'is_numeric' ),
        ),
    ) );
}

function vc_archive_permission_check() {
    return current_user_can( 'edit_posts' );
}

/* ---------------------------------------------------------------------------
 * CORE: classify items linked to an event
 *
 * Returns:
 * array(
 *   'unique'    => [ [ id, type, title ], ... ] -> get drafted
 *   'shared'    => [ [ id, type, title, other_events ], ... ] -> stay published
 * )
 * ------------------------------------------------------------------------- */

function vc_classify_items_for_event( $event_id ) {

    $event_id = intval( $event_id );
    $result   = array( 'unique' => array(), 'shared' => array() );

    $posts = get_posts( array(
        'post_type'      => VC_SCOPED_POST_TYPES,
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_query'     => array(
            array(
                'key'     => VC_EVENT_RELATIONSHIP_FIELD,
                'value'   => '"' . $event_id . '"',
                'compare' => 'LIKE',
            ),
        ),
    ) );

    foreach ( $posts as $post ) {

        $linked_events = get_field( VC_EVENT_RELATIONSHIP_FIELD, $post->ID, false );
        $linked_events = is_array( $linked_events ) ? array_map( 'intval', $linked_events ) : array();
        $linked_events = array_values( array_unique( array_filter( $linked_events ) ) );

        if ( ! in_array( $event_id, $linked_events, true ) ) {
            continue;
        }

        $other_events = array_values( array_diff( $linked_events, array( $event_id ) ) );

        $entry = array(
            'id'    => $post->ID,
            'type'  => $post->post_type,
            'title' => get_the_title( $post->ID ),
        );

        if ( empty( $other_events ) ) {
            $result['unique'][] = $entry;
        } else {
            $entry['other_events'] = array_map( function( $eid ) {
                return array(
                    'id'    => $eid,
                    'title' => get_the_title( $eid ),
                );
            }, $other_events );
            $result['shared'][] = $entry;
        }
    }

    return $result;
}

/* ---------------------------------------------------------------------------
 * PREVIEW: what would happen if we archived?
 * ------------------------------------------------------------------------- */

function vc_archive_event_preview( WP_REST_Request $req ) {

    $event_id = intval( $req['event_id'] );

    if ( get_post_type( $event_id ) !== 'vc_event_property' ) {
        return new WP_Error( 'vc_not_event', 'Not a vc_event_property post.', array( 'status' => 404 ) );
    }

    $classified = vc_classify_items_for_event( $event_id );

    return rest_ensure_response( array(
        'event_id'       => $event_id,
        'event_title'    => get_the_title( $event_id ),
        'draft_count'    => count( $classified['unique'] ),
        'keep_count'     => count( $classified['shared'] ),
        'will_be_drafted' => $classified['unique'],
        'will_stay_published' => $classified['shared'],
    ) );
}

/* ---------------------------------------------------------------------------
 * ARCHIVE: execute the status changes
 * ------------------------------------------------------------------------- */

function vc_archive_event_handler( WP_REST_Request $req ) {

    $event_id = intval( $req['event_id'] );

    if ( get_post_type( $event_id ) !== 'vc_event_property' ) {
        return new WP_Error( 'vc_not_event', 'Not a vc_event_property post.', array( 'status' => 404 ) );
    }

    $classified = vc_classify_items_for_event( $event_id );
    $drafted    = array();

    foreach ( $classified['unique'] as $item ) {
        $updated = wp_update_post( array(
            'ID'          => $item['id'],
            'post_status' => 'draft',
        ), true );

        if ( ! is_wp_error( $updated ) ) {
            update_post_meta( $item['id'], '_vc_drafted_by_archive', $event_id );
            update_post_meta( $item['id'], '_vc_drafted_at', current_time( 'mysql' ) );
            $drafted[] = $item;
        }
    }

    update_field( 'event_status', 'archived', $event_id );
    update_post_meta( $event_id, '_vc_archived_at', current_time( 'mysql' ) );
    update_post_meta( $event_id, '_vc_archived_by', get_current_user_id() );

    return rest_ensure_response( array(
        'success'            => true,
        'event_id'           => $event_id,
        'event_title'        => get_the_title( $event_id ),
        'drafted'            => $drafted,
        'drafted_count'      => count( $drafted ),
        'kept_published'     => $classified['shared'],
        'kept_count'         => count( $classified['shared'] ),
        'archived_timestamp' => current_time( 'mysql' ),
    ) );
}

/* ---------------------------------------------------------------------------
 * RESTORE: flip event back to upcoming. Does NOT republish drafted items.
 * ------------------------------------------------------------------------- */

function vc_restore_event_handler( WP_REST_Request $req ) {

    $event_id = intval( $req['event_id'] );

    if ( get_post_type( $event_id ) !== 'vc_event_property' ) {
        return new WP_Error( 'vc_not_event', 'Not a vc_event_property post.', array( 'status' => 404 ) );
    }

    update_field( 'event_status', 'upcoming', $event_id );
    delete_post_meta( $event_id, '_vc_archived_at' );
    delete_post_meta( $event_id, '_vc_archived_by' );

    // Find items we previously drafted from this event (for user reference).
    $previously_drafted = get_posts( array(
        'post_type'      => VC_SCOPED_POST_TYPES,
        'post_status'    => 'draft',
        'posts_per_page' => -1,
        'meta_query'     => array(
            array(
                'key'   => '_vc_drafted_by_archive',
                'value' => $event_id,
            ),
        ),
        'fields'         => 'ids',
    ) );

    return rest_ensure_response( array(
        'success'                 => true,
        'event_id'                => $event_id,
        'event_title'             => get_the_title( $event_id ),
        'new_status'              => 'upcoming',
        'drafted_items_awaiting'  => array_map( function( $id ) {
            return array(
                'id'    => $id,
                'type'  => get_post_type( $id ),
                'title' => get_the_title( $id ),
            );
        }, $previously_drafted ),
        'note' => 'Drafted items were NOT auto-republished. Review and republish manually.',
    ) );
}
