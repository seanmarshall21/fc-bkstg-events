import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS, WP_ENDPOINTS } from '../../api/endpoints';
import { Loader2, Palette, RefreshCw } from 'lucide-react';

export default function StylesView() {
  const { getClient, activeSite } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [styles, setStyles] = useState(null);
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

  const fetchStyles = useCallback(async () => {
    if (!selectedEvent) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.eventStyles.full(selectedEvent));
      setStyles(data);
    } catch (err) {
      console.error('Failed to fetch styles:', err);
      setStyles(null);
    } finally {
      setLoading(false);
    }
  }, [getClient, selectedEvent]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);
  useEffect(() => { fetchStyles(); }, [fetchStyles]);

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">Event Styles</h2>
        <button onClick={fetchStyles} disabled={loading} className="vc-btn vc-btn--secondary !px-2.5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

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

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {!loading && styles && (
        <div className="space-y-4">
          {/* Color Properties */}
          {styles.properties && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">CSS Properties</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(styles.properties).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    {val.startsWith('#') || val.startsWith('rgb') ? (
                      <div
                        className="w-5 h-5 rounded border border-surface-dark-4 shrink-0"
                        style={{ backgroundColor: val }}
                      />
                    ) : (
                      <Palette className="w-4 h-4 text-gray-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-gray-400 truncate">{key}</div>
                      <div className="text-gray-600 truncate">{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logos */}
          {styles.logos && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Logos</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(styles.logos).map(([key, url]) => (
                  url && (
                    <div key={key} className="space-y-1">
                      <span className="text-xs text-gray-500">{key}</span>
                      <img src={url} alt={key} className="h-16 object-contain" />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Textures */}
          {styles.textures && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Textures</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(styles.textures).map(([key, url]) => (
                  url && (
                    <div key={key} className="space-y-1">
                      <span className="text-xs text-gray-500">{key}</span>
                      <img src={url} alt={key} className="h-20 object-cover rounded-lg" />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !styles && (
        <div className="text-center py-20 text-gray-500 text-sm">
          No style data available for this event
        </div>
      )}
    </div>
  );
}
