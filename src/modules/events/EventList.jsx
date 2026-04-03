import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import ContentList from '../../components/ui/ContentList';
import { decodeHtml } from '../../utils/helpers';

export default function EventList() {
  const { getClient, activeSite, hasSites } = useAuth();
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
        title: decodeHtml(ev.title?.rendered || ev.title?.raw || 'Untitled'),
      })));
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view events.</p>
      </div>
    );
  }

  return (
    <ContentList
      title="Events"
      items={events}
      loading={loading}
      onRefresh={fetchEvents}
      onAdd={() => navigate('/events/new')}
      onSelect={(ev) => navigate(`/events/${ev.id}`)}
      searchKeys={['title']}
      emptyMessage="No Events Added"
      emptySubtext="There are no event posts yet. Add your first one."
      addLabel="Add an Event"
      renderItem={(ev) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <img src="/icons/starglobe-dark.svg" alt="" className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate block">
              {ev.title}
            </span>
            <span className="text-xs text-gray-400">
              {ev.status === 'publish' ? 'Published' : ev.status}
            </span>
          </div>
        </div>
      )}
    />
  );
}
