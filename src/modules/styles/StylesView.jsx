import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import EventSelector from '../../components/EventSelector';
import { Loader2, Palette, RefreshCw } from 'lucide-react';

export default function StylesView() {
  const { getClient, activeEventId, events, hasSites } = useAuth();
  const [styles, setStyles] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStyles = useCallback(async () => {
    if (!activeEventId) { setStyles(null); return; }
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.eventStyles.full(activeEventId));
      setStyles(data);
    } catch (err) {
      console.error('Failed to fetch styles:', err);
      setStyles(null);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchStyles(); }, [fetchStyles]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view event styles.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">Event Styles</h2>
        </div>
        <button onClick={fetchStyles} disabled={loading} className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="border-b border-surface-3 mb-4" />

      {events.length > 0 && (
        <div className="mb-4">
          <EventSelector />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && styles && (
        <div className="space-y-4">
          {styles.properties && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">CSS Properties</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(styles.properties).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    {val.startsWith('#') || val.startsWith('rgb') ? (
                      <div className="w-5 h-5 rounded border border-surface-3 shrink-0" style={{ backgroundColor: val }} />
                    ) : (
                      <Palette className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-gray-600 truncate">{key}</div>
                      <div className="text-gray-400 truncate">{val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {styles.logos && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Logos</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(styles.logos).map(([key, url]) => (
                  url && (
                    <div key={key} className="space-y-1">
                      <span className="text-xs text-gray-400">{key}</span>
                      <img src={url} alt={key} className="h-16 object-contain" />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {styles.textures && (
            <div className="vc-card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Textures</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(styles.textures).map(([key, url]) => (
                  url && (
                    <div key={key} className="space-y-1">
                      <span className="text-xs text-gray-400">{key}</span>
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
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-base font-bold text-gray-800 mb-1">No Style Data</p>
          <p className="text-sm text-gray-400">
            {activeEventId
              ? 'No style data available for this event.'
              : events.length > 0
                ? 'Select an event above to view its styles.'
                : 'This site has no events configured. Add an event first.'}
          </p>
        </div>
      )}
    </div>
  );
}
