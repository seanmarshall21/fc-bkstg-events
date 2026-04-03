import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';

export default function ArtistList() {
  const { getClient, activeSite, hasSites } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view artists.</p>
      </div>
    );
  }

  return (
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
  );
}
