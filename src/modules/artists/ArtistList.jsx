import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';

export default function ArtistList() {
  const { getClient, activeSite } = useAuth();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArtists = useCallback(async () => {
    const client = getClient();
    if (!client) return;
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
    fetchArtists();
  }, [fetchArtists, activeSite?.id]);

  const statusBadge = (status) => {
    const map = {
      confirmed: { class: 'vc-badge--green', label: 'Confirmed' },
      pending: { class: 'vc-badge--amber', label: 'Pending' },
      cancelled: { class: 'vc-badge--red', label: 'Cancelled' },
      available: { class: 'vc-badge--blue', label: 'Available' },
      booked: { class: 'vc-badge--green', label: 'Booked' },
      unavailable: { class: 'vc-badge--gray', label: 'Unavailable' },
    };
    const s = map[status] || { class: 'vc-badge--gray', label: status || 'Unknown' };
    return <span className={`vc-badge ${s.class}`}>{s.label}</span>;
  };

  return (
    <ContentList
      title="Artists"
      items={artists}
      loading={loading}
      onRefresh={fetchArtists}
      onSelect={(artist) => navigate(`/artists/${artist.id}`)}
      searchKeys={['name', (a) => a.genres?.map(g => g.name).join(' ')]}
      emptyMessage="No artists found on this site"
      renderItem={(artist) => (
        <div className="flex items-center gap-3">
          {artist.photo?.thumbnail ? (
            <img
              src={artist.photo.thumbnail}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-dark-3 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-200 truncate">
                {artist.name}
              </span>
              {statusBadge(artist.booking_status)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {artist.genres?.slice(0, 3).map(g => (
                <span key={g.slug} className="text-xs text-gray-500">
                  {g.name}
                </span>
              ))}
              {artist.origin && (
                <span className="text-xs text-gray-600">
                  · {artist.origin}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    />
  );
}
