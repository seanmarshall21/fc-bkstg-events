import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import DraggableList from '../../components/DraggableList';
import useDragReorder from '../../hooks/useDragReorder';
import { useFavorites } from '../../hooks/useFavorites';

export default function ArtistList() {
  const { getClient, activeSite, activeSiteId, hasSites } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReorder, setShowReorder] = useState(false);

  const fetchArtists = useCallback(async () => {
    const client = getClient();
    if (!client) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.artists.list, {
        per_page: 200,
      });
      setArtists(data);
    } catch (err) {
      console.error('Failed to fetch artists:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    if (hasSites) fetchArtists();
    else setLoading(false);
  }, [fetchArtists, activeSite?.id, hasSites]);

  const statusBadge = (status) => {
    const map = {
      confirmed: { cls: 'vc-badge--green', label: 'Confirmed' },
      pending: { cls: 'vc-badge--amber', label: 'Pending' },
      hold: { cls: 'vc-badge--gray', label: 'Hold' },
      cancelled: { cls: 'vc-badge--red', label: 'Cancelled' },
      available: { cls: 'vc-badge--blue', label: 'Available' },
      booked: { cls: 'vc-badge--green', label: 'Booked' },
      unavailable: { cls: 'vc-badge--gray', label: 'Unavailable' },
    };
    const s = map[status] || { cls: 'vc-badge--gray', label: status || 'Unknown' };
    return <span className={`vc-badge ${s.cls}`}>{s.label}</span>;
  };

  const handleReorder = useCallback(async (reorderedItems) => {
    const client = getClient();
    if (!client) return;

    try {
      // Fire all menu_order updates in parallel
      const requests = reorderedItems.map((item, newIndex) =>
        client.post(WP_ENDPOINTS.artists.single(item.id), {
          menu_order: newIndex,
        })
      );
      await Promise.all(requests);
      setArtists(reorderedItems);
      setShowReorder(false);
    } catch (err) {
      console.error('Failed to save artist order:', err);
    }
  }, [getClient]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view artists.</p>
      </div>
    );
  }

  if (showReorder) {
    return (
      <div className="p-4 pb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Artists</h2>
          <button
            onClick={() => setShowReorder(false)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
        <DraggableList
          items={artists}
          keyExtractor={(item) => item.id}
          onReorder={handleReorder}
          renderItem={(item) => (
            <div className="flex items-center gap-3">
              {item.photo?.thumbnail ? (
                <img
                  src={item.photo.thumbnail}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-surface-3"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-surface-2 shrink-0 flex items-center justify-center border-2 border-surface-3">
                  <span className="text-sm font-semibold text-gray-400">
                    {item.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </span>
                  {statusBadge(item.booking_status)}
                </div>
                {(item.origin || item.genres?.length > 0) && (
                  <span className="text-xs text-gray-400 mt-0.5 block truncate">
                    {item.origin || item.genres?.slice(0, 2).map(g => g.name).join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div />
        <button
          onClick={() => setShowReorder(true)}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Reorder
        </button>
      </div>
      <ContentList
        title="Artists"
        count={artists.length}
        items={artists}
        loading={loading}
        onRefresh={fetchArtists}
        onAdd={() => navigate('/artists/new')}
        onSelect={(artist) => navigate(`/artists/${artist.id}`)}
        searchKeys={['name', (a) => a.genres?.map(g => g.name).join(' ')]}
        emptyMessage="No Artists Added"
        emptySubtext="There are no artists posts yet. Add your first one."
        addLabel="Add an Artist"
        moduleKey="artists"
        isFavorite={isFavorite}
        onToggleFavorite={(artist) => toggleFavorite('artists', artist.id, artist.name, { subtitle: artist.origin })}
        renderItem={(artist) => (
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            {artist.photo?.thumbnail ? (
              <img
                src={artist.photo.thumbnail}
                alt=""
                className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-surface-3"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-surface-2 shrink-0 flex items-center justify-center border-2 border-surface-3">
                <span className="text-sm font-semibold text-gray-400">
                  {artist.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {artist.name}
                </span>
                {statusBadge(artist.booking_status)}
              </div>
              {/* Subtitle: stage or origin */}
              {(artist.origin || artist.genres?.length > 0) && (
                <span className="text-xs text-gray-400 mt-0.5 block truncate">
                  {artist.origin || artist.genres?.slice(0, 2).map(g => g.name).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
