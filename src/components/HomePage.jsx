import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Globe, Flag } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { resolveSiteLogo, siteName } from '../utils/helpers';

export default function HomePage() {
  const navigate = useNavigate();
  const { sites, hasSites, activeSiteId } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);

  // Empty state — no sites connected
  if (!hasSites) {
    return (
      <div className="p-6 pb-8 animate-fade-in">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-vc-50 flex items-center justify-center">
            <img src="/icons/VC-WebApp-Logo-Purp-dark.svg" alt="" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Sites
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
            Manage your festival content across all your brands, in one place.
          </p>
          <button
            onClick={() => navigate('/add-site')}
            className="vc-btn vc-btn--primary mt-6"
          >
            <Plus className="w-4 h-4" />
            Add a Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* FC Logo hero */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="w-28 h-28 mb-4">
          <img
            src="/icons/fc-logo-illo.png"
            alt=""
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to simpler logo
              e.target.src = '/icons/VC-WebApp-Logo-Purp-dark.svg';
              e.target.className = 'w-16 h-16 object-contain mx-auto mt-4';
            }}
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Your Sites
        </h2>
        <p className="text-sm text-gray-500 mt-1 text-center max-w-[280px] leading-relaxed">
          Manage your festival content across all your brands, in one place.
        </p>
      </div>

      {/* Site list */}
      <div className="flex flex-col gap-2">
        {sites.map((site) => {
          const logo = resolveSiteLogo(site);
          const name = siteName(site);

          return (
            <button
              key={site.id}
              onClick={() => navigate(`/site/${site.id}`)}
              className="vc-card flex items-center gap-3 hover:border-vc-300 transition-colors text-left group w-full"
            >
              <div className="w-14 h-14 rounded-full bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <Globe className="w-5 h-5 text-vc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {name}
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">
                  {(() => { try { return new URL(site.url).hostname; } catch { return site.url; } })()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Flag
                  className="w-4 h-4 text-vc-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite('sites', site.id, name, { subtitle: site.url });
                  }}
                />
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Add another site */}
      <button
        onClick={() => navigate('/add-site')}
        className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-surface-4 text-sm text-gray-400 hover:text-vc-600 hover:border-vc-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add another site
      </button>

      {/* QA version stamp — remove before final release */}
      <p className="mt-6 text-center text-[10px] text-gray-300 tracking-wide">v1.9.5</p>
    </div>
  );
}
