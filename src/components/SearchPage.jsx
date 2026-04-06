import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Music, ListMusic, Handshake, Calendar, Palette, ShieldCheck, Tags, LayoutGrid, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MODULES } from '../api/endpoints';

const ICON_MAP = { Music, ListMusic, Handshake, Calendar, Palette, ShieldCheck, Tags, LayoutGrid };

const SEARCH_MODULES = {
  artists:  { endpoint: '/wp/v2/vc_artist',        route: '/artists',  label: 'Artists' },
  lineup:   { endpoint: '/wp/v2/vc_lineup_slot',    route: '/lineup',   label: 'Lineup' },
  sponsors: { endpoint: '/wp/v2/vc_sponsor',        route: '/sponsors', label: 'Sponsors' },
  events:   { endpoint: '/wp/v2/vc_event_property', route: '/events',   label: 'Events' },
};

export default function SearchPage() {
  const navigate = useNavigate();
  const { hasSites, getClient, activeEventId } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q) => {
    if (!q.trim() || !hasSites) return;
    const client = getClient();
    if (!client) return;

    setSearching(true);
    try {
      const promises = Object.entries(SEARCH_MODULES).map(async ([key, mod]) => {
        try {
          const params = { search: q.trim(), per_page: 5 };
          if (key !== 'events' && activeEventId) {
            // Filter by active event where applicable
          }
          const { data } = await client.get(mod.endpoint, params);
          return data.map(item => ({
            id: item.id,
            title: item.title?.rendered || item.title || `#${item.id}`,
            module: key,
            route: `${mod.route}/${item.id}`,
          }));
        } catch {
          return [];
        }
      });

      const batches = await Promise.all(promises);
      setResults(batches.flat());
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [hasSites, getClient, activeEventId]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20 animate-fade-in">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Search className="w-7 h-7 text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Search</h2>
        <p className="text-sm text-gray-500 mt-2">Connect a site to search across your content.</p>
      </div>
    );
  }

  // Group results by module
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.module]) acc[r.module] = [];
    acc[r.module].push(r);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Search input */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists, lineup, sponsors..."
          autoFocus
          className="vc-input pl-10 w-full"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vc-600 animate-spin" />
        )}
      </div>

      {/* Quick module links when no query */}
      {!query.trim() && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Browse by module</p>
          <div className="space-y-1">
            {Object.values(MODULES).map((mod) => {
              const Icon = ICON_MAP[mod.icon] || Search;
              return (
                <button
                  key={mod.key}
                  onClick={() => navigate(`/${mod.key}`)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-1 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search results */}
      {query.trim() && !searching && results.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-12">
          No results for "{query}"
        </p>
      )}

      {Object.entries(grouped).map(([moduleKey, items]) => {
        const mod = MODULES[moduleKey];
        const Icon = ICON_MAP[mod?.icon] || Search;
        return (
          <div key={moduleKey} className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                {mod?.label || moduleKey}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={`${moduleKey}-${item.id}`}
                  onClick={() => navigate(item.route)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-1 transition-colors text-left"
                >
                  <span className="text-sm text-gray-800">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
