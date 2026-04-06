import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { useFavorites } from '../../hooks/useFavorites';

/**
 * Contestants list — reuses vc_artist CPT with rodeo-specific labeling.
 * San Diego Rodeo's "contestants" maps to the same vc_artist post type.
 */
export default function ContestantList() {
  const { getClient, activeSite, hasSites, activeSiteId } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);
  const navigate = useNavigate();
  const [contestants, setContestants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContestants = useCallback(async () => {
    const client = getClient();
    if (!client) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.contestants.list, {
        per_page: 200,
      });
      setContestants(data);
    } catch (err) {
      console.error('Failed to fetch contestants:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    if (hasSites) fetchContestants();
    else setLoading(false);
  }, [fetchContestants, activeSite?.id, hasSites]);

  const statusBadge = (status) => {
    const map = {
      confirmed: { cls: 'vc-badge--green', label: 'Confirmed' },
      pending:   { cls: 'vc-badge--amber', label: 'Pending' },
      hold:      { cls: 'vc-badge--gray', label: 'Hold' },
      cancelled: { cls: 'vc-badge--red', label: 'Cancelled' },
      available: { cls: 'vc-badge--blue', label: 'Available' },
      registered:{ cls: 'vc-badge--green', label: 'Registered' },
      withdrawn: { cls: 'vc-badge--gray', label: 'Withdrawn' },
    };
    const s = map[status] || { cls: 'vc-badge--gray', label: status || 'Unknown' };
    return <span className={`vc-badge ${s.cls}`}>{s.label}</span>;
  };

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view contestants.</p>
      </div>
    );
  }

  return (
    <ContentList
      title="Contestants"
      count={contestants.length}
      items={contestants}
      loading={loading}
      onRefresh={fetchContestants}
      onAdd={() => navigate('/contestants/new')}
      onSelect={(c) => navigate(`/contestants/${c.id}`)}
      searchKeys={['name', (c) => c.origin || '']}
      emptyMessage="No Contestants Added"
      emptySubtext="There are no contestant posts yet. Add your first one."
      addLabel="Add a Contestant"
      moduleKey="contestants"
      isFavorite={isFavorite}
      onToggleFavorite={(c) => toggleFavorite('contestants', c.id, c.name, { subtitle: c.origin })}
      renderItem={(contestant) => (
        <div className="flex items-center gap-3">
          {contestant.photo?.thumbnail ? (
            <img
              src={contestant.photo.thumbnail}
              alt=""
              className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-surface-3"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-amber-50 shrink-0 flex items-center justify-center border-2 border-surface-3">
              <span className="text-sm font-semibold text-amber-500">
                {contestant.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">
                {contestant.name}
              </span>
              {statusBadge(contestant.booking_status)}
            </div>
            {contestant.origin && (
              <span className="text-xs text-gray-400 mt-0.5 block">
                {contestant.origin}
              </span>
            )}
          </div>
        </div>
      )}
    />
  );
}
