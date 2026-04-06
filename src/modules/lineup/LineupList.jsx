import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import DraggableList from '../../components/DraggableList';
import useDragReorder from '../../hooks/useDragReorder';
import EventSelector from '../../components/EventSelector';
import { useFavorites } from '../../hooks/useFavorites';
import { Clock, Music } from 'lucide-react';

export default function LineupList() {
  const { getClient, activeSite, activeSiteId, activeEventId, events, hasSites } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReorder, setShowReorder] = useState(false);

  const fetchLineup = useCallback(async () => {
    const client = getClient();
    if (!client) { setLoading(false); return; }
    setLoading(true);
    try {
      // Try VC endpoint first (structured by day/stage)
      if (activeEventId) {
        try {
          const { data } = await client.get(VC_ENDPOINTS.lineup.full, { event_id: activeEventId });
          // Flatten structured data into slot list
          const flat = [];
          data.forEach(day => {
            day.stages?.forEach(stage => {
              stage.slots?.forEach(slot => {
                flat.push({
                  ...slot,
                  _day: day.label,
                  _stage: stage.name,
                  title: slot.artist?.name || (slot.is_secret ? 'Secret Guest' : `Slot #${slot.id}`),
                });
              });
            });
          });
          setSlots(flat);
          return;
        } catch (vcErr) {
          console.warn('VC lineup endpoint failed, falling back to WP:', vcErr.message);
        }
      }

      // Fallback: WP REST — all lineup slots
      const params = { per_page: 200, context: 'edit' };
      const { data } = await client.get(WP_ENDPOINTS.lineupSlots.list, params);
      setSlots(data.map(s => ({
        id: s.id,
        title: s.title?.rendered || s.title?.raw || `Slot #${s.id}`,
        _stage: s.acf?.vc_ls_stage || '',
        start_time: s.acf?.vc_ls_start_time || '',
        end_time: s.acf?.vc_ls_end_time || '',
        billing: s.acf?.vc_ls_billing || '',
        artist: { name: s.title?.rendered || s.title?.raw || '' },
      })));
    } catch (err) {
      console.error('Failed to fetch lineup:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => {
    if (hasSites) fetchLineup();
    else setLoading(false);
  }, [fetchLineup, activeSite?.id, hasSites]);

  const handleReorder = useCallback(async (reorderedItems) => {
    const client = getClient();
    if (!client) return;

    try {
      // Fire all menu_order updates in parallel
      const requests = reorderedItems.map((item, newIndex) =>
        client.post(WP_ENDPOINTS.lineupSlots.single(item.id), {
          menu_order: newIndex,
        })
      );
      await Promise.all(requests);
      setSlots(reorderedItems);
      setShowReorder(false);
    } catch (err) {
      console.error('Failed to save lineup order:', err);
    }
  }, [getClient]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view lineups.</p>
      </div>
    );
  }

  if (showReorder) {
    return (
      <div className="animate-fade-in">
        {events.length > 0 && (
          <div className="px-4 pt-4 mb-0">
            <EventSelector />
          </div>
        )}
        <div className="p-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Lineup</h2>
            <button
              onClick={() => setShowReorder(false)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
          <DraggableList
            items={slots}
            keyExtractor={(item) => item.id}
            onReorder={handleReorder}
            renderItem={(item) => (
              <div className="flex items-center gap-3">
                {item.artist?.photo ? (
                  <img src={item.artist.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {item.title}
                    </span>
                    {item.billing && (
                      <span className="vc-badge vc-badge--blue text-[10px]">{item.billing}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item._stage && (
                      <span className="text-xs text-gray-400 truncate">{item._stage}</span>
                    )}
                    {item.start_time && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {item.start_time}{item.end_time ? ` – ${item.end_time}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
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

      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <button
          onClick={() => setShowReorder(true)}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Reorder
        </button>
      </div>

      <ContentList
        title="Lineup"
        items={slots}
        loading={loading}
        onRefresh={fetchLineup}
        onAdd={() => navigate('/lineup/new')}
        onSelect={(slot) => navigate(`/lineup/${slot.id}`)}
        searchKeys={['title', '_stage', (s) => s.artist?.name || '']}
        emptyMessage="No Lineup Slots Added"
        emptySubtext="There are no lineup slots yet. Add your first one."
        addLabel="Add a Lineup Slot"
        moduleKey="lineup"
        isFavorite={isFavorite}
        onToggleFavorite={(s) => toggleFavorite('lineup', s.id, s.title, { subtitle: s._stage })}
        renderItem={(slot) => (
          <div className="flex items-center gap-3">
            {slot.artist?.photo ? (
              <img src={slot.artist.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {slot.title}
                </span>
                {slot.billing && (
                  <span className="vc-badge vc-badge--blue text-[10px]">{slot.billing}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {slot._stage && (
                  <span className="text-xs text-gray-400 truncate">{slot._stage}</span>
                )}
                {slot.start_time && (
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {slot.start_time}{slot.end_time ? ` – ${slot.end_time}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
