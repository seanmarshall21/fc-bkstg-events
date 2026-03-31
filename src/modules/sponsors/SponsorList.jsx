import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';

export default function SponsorList() {
  const { getClient, activeSite } = useAuth();
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, { per_page: 50 });
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [getClient, selectedEvent]);

  const fetchSponsors = useCallback(async () => {
    if (!selectedEvent) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.sponsors.list, {
        event_id: selectedEvent,
      });
      // Flatten tiers into sponsor list
      const flat = [];
      data.forEach(tier => {
        tier.sponsors?.forEach(s => {
          flat.push({ ...s, _tier: tier.tier_label, _tierSlug: tier.tier });
        });
      });
      setSponsors(flat);
    } catch (err) {
      console.error('Failed to fetch sponsors:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, selectedEvent]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);
  useEffect(() => { fetchSponsors(); }, [fetchSponsors]);

  const tierBadge = (tier) => {
    const map = {
      platinum: 'vc-badge--amber',
      gold: 'vc-badge--amber',
      silver: 'vc-badge--gray',
      bronze: 'vc-badge--gray',
      presenting: 'vc-badge--green',
    };
    return <span className={`vc-badge ${map[tier] || 'vc-badge--blue'}`}>{tier}</span>;
  };

  return (
    <div className="p-4 pb-8">
      {events.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5">Event</label>
          <select
            className="vc-input"
            value={selectedEvent || ''}
            onChange={e => setSelectedEvent(Number(e.target.value))}
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title?.rendered || ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <ContentList
        title="Sponsors"
        items={sponsors}
        loading={loading}
        onRefresh={fetchSponsors}
        onSelect={(s) => navigate(`/sponsors/${s.id}`)}
        searchKeys={['name', '_tier']}
        emptyMessage="No sponsors for this event"
        renderItem={(sponsor) => (
          <div className="flex items-center gap-3">
            {sponsor.logo ? (
              <img src={sponsor.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white p-1 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-surface-dark-3 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200 truncate">{sponsor.name}</span>
                {tierBadge(sponsor._tier)}
              </div>
              {sponsor.url && (
                <span className="text-xs text-gray-500 truncate block mt-0.5">{sponsor.url}</span>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
