import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { Calendar } from 'lucide-react';

export default function EventList() {
  const { getClient, activeSite } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, {
        per_page: 50,
        context: 'edit',
      });
      setEvents(data.map(ev => ({
        ...ev,
        title: ev.title?.rendered || ev.title?.raw || 'Untitled',
      })));
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);

  return (
    <ContentList
      title="Events"
      items={events}
      loading={loading}
      onRefresh={fetchEvents}
      onSelect={(ev) => navigate(`/events/${ev.id}`)}
      searchKeys={['title']}
      emptyMessage="No events found"
      renderItem={(ev) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-900/30 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-200 truncate block">
              {ev.title}
            </span>
            <span className="text-xs text-gray-500">
              {ev.status === 'publish' ? 'Published' : ev.status}
            </span>
          </div>
        </div>
      )}
    />
  );
}
