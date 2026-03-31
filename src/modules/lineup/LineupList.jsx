import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import EventSelector from '../../components/EventSelector';
import { Clock, Music } from 'lucide-react';

export default function LineupList() {
  const { getClient, activeSite, activeEventId } = useAuth();
  const navigate = useNavigate();
  const [lineup, setLineup] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLineup = useCallback(async () => {
    if (!activeEventId) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.lineup.full, {
        event_id: activeEventId,
      });
      setLineup(data);
    } catch (err) {
      console.error('Failed to fetch lineup:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchLineup(); }, [fetchLineup]);

  // Flatten lineup into slot items for the list
  const slots = [];
  lineup.forEach(day => {
    day.stages?.forEach(stage => {
      stage.slots?.forEach(slot => {
        slots.push({
          ...slot,
          _day: day.label,
          _stage: stage.name,
          _dayDate: day.date,
          title: slot.artist?.name || (slot.is_secret ? 'Secret Guest' : `Slot #${slot.id}`),
        });
      });
    });
  });

  const billingBadge = (billing) => {
    const map = {
      headline: 'vc-badge--amber',
      support: 'vc-badge--blue',
      special: 'vc-badge--green',
    };
    return billing
      ? <span className={`vc-badge ${map[billing] || 'vc-badge--gray'}`}>{billing}</span>
      : null;
  };

  return (
    <div className="p-4 pb-8">
      {/* Event context */}
      <div className="mb-4">
        <EventSelector />
      </div>

      {!activeEventId && (
        <div className="text-center py-20 text-gray-500 text-sm">
          Select an event to view the lineup.
        </div>
      )}

      {activeEventId && (
        <ContentList
          title="Lineup"
          items={slots}
          loading={loading}
          onRefresh={fetchLineup}
          onSelect={(slot) => navigate(`/lineup/${slot.id}`)}
          searchKeys={['title', '_stage', '_day']}
          emptyMessage="No lineup data for this event"
          renderItem={(slot) => (
            <div className="flex items-center gap-3">
              {slot.artist?.photo ? (
                <img src={slot.artist.photo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-surface-dark-3 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {slot.title}
                  </span>
                  {billingBadge(slot.billing)}
                  {slot.is_secret && <span className="vc-badge vc-badge--red">Secret</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{slot._day}</span>
                  <span>·</span>
                  <span>{slot._stage}</span>
                  {slot.start_time && (
                    <>
                      <span>·</span>
                      <Clock className="w-3 h-3 inline" />
                      <span>{slot.start_time}{slot.end_time ? ` – ${slot.end_time}` : ''}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
