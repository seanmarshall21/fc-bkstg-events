import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import EventSelector from '../../components/EventSelector';
import { useFavorites } from '../../hooks/useFavorites';

/**
 * After Dark post list.
 *
 * Fetches from /wp/v2/after-darks (CRSSD-specific CPT).
 * Filters client-side by vc_ad_event when an activeEventId is set.
 *
 * Prerequisite: the after-darks CPT must have Show in REST API enabled
 * in ACF → Post Types → after-darks → Advanced settings.
 */
export default function AfterDarkList() {
  const { getClient, activeEventId, events, hasSites, activeSiteId } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAfterDarks = useCallback(async () => {
    const client = getClient();
    if (!client) { setLoading(false); return; }
    setLoading(true);

    try {
      let rawData;
      try {
        const { data } = await client.get(WP_ENDPOINTS.afterdarks.list, {
          per_page: 100,
          context: 'edit',
          orderby: 'meta_value',
          meta_key: 'ad_date',
          order: 'asc',
        });
        rawData = data;
      } catch (fetchErr) {
        // 404 means the after-darks CPT doesn't exist or REST isn't enabled on this site
        const status = fetchErr?.response?.status || fetchErr?.status;
        if (status === 404) {
          console.warn('[AfterDarkList] after-darks CPT not found or REST not enabled on this site.');
          setItems([]);
          return;
        }
        throw fetchErr;
      }
      const data = rawData;

      const mapped = data.map((post) => {
        const acf = post.acf || {};

        // Resolve headliner display names from repeater
        const headliners = (acf.ad_headliners || []).map((row) => {
          const name = row.ad_hl_artist?.post_title || '';
          const b2b  = row.ad_hl_b2b_artist?.post_title || '';
          const isB2B = !!row.ad_hl_is_b2b && b2b;
          const label = row.ad_hl_b2b_label || 'B2B';
          return isB2B ? `${name} ${label} ${b2b}` : name;
        }).filter(Boolean);

        return {
          id: post.id,
          name: post.title?.rendered || post.title?.raw || `After Dark #${post.id}`,
          date: acf.ad_date || '',
          venue: acf.ad_venue?.post_title || '',
          headliners,
          // Post object field returns { ID, post_title, ... } for filtering
          _eventId: acf.vc_ad_event?.ID || acf.vc_ad_event?.id || null,
        };
      });

      // Filter by active event if one is selected
      const filtered = activeEventId
        ? mapped.filter((ad) => ad._eventId && String(ad._eventId) === String(activeEventId))
        : mapped;

      setItems(filtered);
    } catch (err) {
      console.error('Failed to fetch after darks:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => {
    if (hasSites) fetchAfterDarks();
    else setLoading(false);
  }, [fetchAfterDarks, hasSites]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // ACF date picker returns YYYYMMDD
    if (/^\d{8}$/.test(dateStr)) {
      const y = dateStr.slice(0, 4);
      const m = dateStr.slice(4, 6);
      const d = dateStr.slice(6, 8);
      const dt = new Date(`${y}-${m}-${d}T12:00:00`);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  };

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view After Darks.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {events.length > 0 && (
        <div className="px-4 pt-4 mb-0">
          <EventSelector />
        </div>
      )}

      <ContentList
        title="After Darks"
        items={items}
        loading={loading}
        onRefresh={fetchAfterDarks}
        onAdd={() => navigate('/afterdarks/new')}
        onSelect={(ad) => navigate(`/afterdarks/${ad.id}`)}
        searchKeys={['name', 'venue', (ad) => ad.headliners.join(' ')]}
        emptyMessage="No After Dark Shows"
        emptySubtext="No After Dark posts found for this event."
        addLabel="Add After Dark"
        moduleKey="afterdarks"
        isFavorite={isFavorite}
        onToggleFavorite={(ad) => toggleFavorite('afterdarks', ad.id, ad.name, { subtitle: ad.date })}
        renderItem={(ad) => (
          <div className="flex items-center gap-3">
            {/* Date chip */}
            <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex flex-col items-center justify-center shrink-0">
              {ad.date ? (
                <>
                  <span className="text-[10px] font-bold text-violet-500 uppercase leading-none">
                    {formatDate(ad.date).split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold text-violet-700 leading-tight">
                    {formatDate(ad.date).split(' ')[1]?.replace(',', '')}
                  </span>
                </>
              ) : (
                <span className="text-xs text-violet-300">TBD</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate block">
                {ad.name}
              </span>
              <span className="text-xs text-gray-400 mt-0.5 truncate block">
                {[ad.venue, ad.headliners.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
