import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Globe } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { sites, hasSites } = useAuth();

  // Empty state — no sites connected
  if (!hasSites) {
    return (
      <div className="p-6 pb-8 animate-fade-in">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-2 flex items-center justify-center">
            <img src="/icons/icon-192.png" alt="" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No sites connected
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Add a site to start managing events, artists, sponsors, and more.
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
      {/* Header */}
      <div className="mb-5 mt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Your Sites
        </h2>
      </div>

      {/* Site list */}
      <div className="flex flex-col gap-3">
        {sites.map((site) => (
          <button
            key={site.id}
            onClick={() => navigate(`/site/${site.id}`)}
            className="vc-tile flex-row items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
              {site.logo ? (
                <img src={site.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Globe className="w-5 h-5 text-vc-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {site.name}
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5">
                {(() => { try { return new URL(site.url).hostname; } catch { return site.url; } })()}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>

      {/* Add another site */}
      <button
        onClick={() => navigate('/add-site')}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-vc-600 hover:border-vc-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add another site
      </button>
    </div>
  );
}
