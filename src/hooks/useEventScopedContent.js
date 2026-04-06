import { useEffect, useRef, useState } from 'react';

/**
 * useEventScopedContent
 *
 * Fetches a WP REST collection (vc_artist, vc_lineup_slot, vc_sponsor, etc.)
 * filtered to items linked to the given activeEventId via the `events`
 * relationship field.
 *
 * The WP side must expose a meta query via a custom REST arg OR a filter;
 * we pass `events_includes=<id>` which should be mapped server-side to a
 * meta_query on the `events` field. A matching filter is included at the
 * bottom of this file as reference.
 *
 * Params:
 *   apiBase        - string, WP REST base
 *   postType       - string, e.g. 'vc_artist'
 *   activeEventId  - number | null
 *   perPage        - number (default 100)
 *   extraParams    - object, merged into querystring
 *
 * Returns: { items, loading, error, refetch }
 */
export function useEventScopedContent({ apiBase, postType, activeEventId, perPage = 100, extraParams = {} }) {

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [tick, setTick]       = useState(0);
  const abortRef              = useRef(null);

  useEffect(() => {
    if (!activeEventId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      events_includes: String(activeEventId),
      per_page:        String(perPage),
      _embed:          '1',
      ...extraParams,
    });

    const url = `${apiBase}/wp/v2/${postType}?${params.toString()}`;

    fetch(url, { credentials: 'include', signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [apiBase, postType, activeEventId, perPage, tick, JSON.stringify(extraParams)]);

  const refetch = () => setTick((t) => t + 1);

  return { items, loading, error, refetch };
}

/* ---------------------------------------------------------------------------
 * SERVER-SIDE REFERENCE (drop into vc-event-properties plugin)
 *
 * add_filter( 'rest_vc_artist_query',      'vc_events_includes_filter', 10, 2 );
 * add_filter( 'rest_vc_lineup_slot_query', 'vc_events_includes_filter', 10, 2 );
 * add_filter( 'rest_vc_sponsor_query',     'vc_events_includes_filter', 10, 2 );
 *
 * function vc_events_includes_filter( $args, $request ) {
 *   $event_id = intval( $request->get_param( 'events_includes' ) );
 *   if ( ! $event_id ) return $args;
 *   $args['meta_query'] = array_merge(
 *     isset( $args['meta_query'] ) ? $args['meta_query'] : array(),
 *     array( array(
 *       'key'     => 'events',
 *       'value'   => '"' . $event_id . '"',
 *       'compare' => 'LIKE',
 *     ) )
 *   );
 *   return $args;
 * }
 * ------------------------------------------------------------------------- */
