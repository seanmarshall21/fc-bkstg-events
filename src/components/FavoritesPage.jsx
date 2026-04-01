import { Star, Trash2, Music, Handshake, Calendar, ListMusic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../hooks/useFavorites';

const MODULE_ICONS = {
  artists: Music,
  sponsors: Handshake,
  events: Calendar,
  lineup: ListMusic,
};

const MODULE_COLORS = {
  artists:  'bg-blue-100 text-blue-600',
  sponsors: 'bg-emerald-100 text-emerald-600',
  events:   'bg-orange-100 text-orange-600',
  lineup:   'bg-purple-100 text-purple-600',
};

export default function FavoritesPage() {
  const { hasSites, activeSiteId } = useAuth();
  const navigate = useNavigate();
  const { favorites, loaded, removeFavorite } = useFavorites(activeSiteId);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20 animate-fade-in">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Star className="w-7 h-7 text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Favorites</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
          Connect a site to start saving favorites.
        </p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-vc-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="p-6 text-center py-20 animate-fade-in">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-2 flex items-center justify-center">
          <Star className="w-7 h-7 text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">No Favorites Yet</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
          Star artists, sponsors, and events from their detail pages for quick access here.
        </p>
      </div>
    );
  }

  // Group by module
  const grouped = {};
  favorites.forEach(fav => {
    if (!grouped[fav.module]) grouped[fav.module] = [];
    grouped[fav.module].push(fav);
  });

  const moduleLabels = {
    artists: 'Artists',
    sponsors: 'Sponsors',
    events: 'Events',
    lineup: 'Lineup',
  };

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <div className="mb-5 mt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Favorites</h2>
        <p className="text-xs text-gray-400 mt-1">{favorites.length} item{favorites.length !== 1 ? 's' : ''} saved</p>
      </div>

      {Object.entries(grouped).map(([module, items]) => {
        const Icon = MODULE_ICONS[module] || Star;
        const colorClass = MODULE_COLORS[module] || 'bg-gray-100 text-gray-600';

        return (
          <div key={module} className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 px-1">
              {moduleLabels[module] || module}
            </p>
            <div className="space-y-1.5">
              {items.map(fav => (
                <div
                  key={`${fav.module}-${fav.id}`}
                  className="flex items-center gap-3 bg-white border border-surface-3 rounded-xl p-3 shadow-sm"
                >
                  <button
                    onClick={() => navigate(`/${fav.module}/${fav.id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate block">
                        {fav.name || 'Untitled'}
                      </span>
                      {fav.meta?.subtitle && (
                        <span className="text-xs text-gray-400 truncate block mt-0.5">
                          {fav.meta.subtitle}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeFavorite(fav.module, fav.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
