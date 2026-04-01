import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import EventSelector from './EventSelector';

// Color config per module — colored icon bg, clean card
const MODULE_COLORS = {
  artists:      { bg: 'bg-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-500' },
  lineup:       { bg: 'bg-purple-100', text: 'text-purple-600', iconBg: 'bg-purple-500' },
  sponsors:     { bg: 'bg-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-500' },
  events:       { bg: 'bg-orange-100', text: 'text-orange-600', iconBg: 'bg-orange-500' },
  styles:       { bg: 'bg-yellow-100', text: 'text-yellow-600', iconBg: 'bg-yellow-500' },
  confidential: { bg: 'bg-red-100', text: 'text-red-600', iconBg: 'bg-red-500' },
  genres:       { bg: 'bg-cyan-100', text: 'text-cyan-600', iconBg: 'bg-cyan-500' },
  stages:       { bg: 'bg-indigo-100', text: 'text-indigo-600', iconBg: 'bg-indigo-500' },
};

export default function TileGrid() {
  const navigate = useNavigate();
  const { activeSite, hasSites, sites } = useAuth();

  // Empty state — no sites connected yet
  if (!hasSites) {
    return (
      <div className="p-6 pb-8 animate-fade-in">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-2 flex items-center justify-center">
            <Icons.Globe className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No sites connected yet
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Connect your WordPress site to start managing artists, lineups, sponsors, and more.
          </p>
          <button
            onClick={() => navigate('/add-site')}
            className="vc-btn vc-btn--primary mt-6"
          >
            <Icons.Plus className="w-4 h-4" />
            Connect a Site
          </button>
        </div>

        {/* Still show the module grid as a preview — grayed out */}
        <div className="mt-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
            Available modules
          </p>
          <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none">
            {Object.values(MODULES).map((mod) => {
              const LucideIcon = Icons[mod.icon] || Icons.Folder;
              const colors = MODULE_COLORS[mod.key] || MODULE_COLORS.artists;
              return (
                <div key={mod.key} className="vc-tile">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors.bg}`}>
                    {mod.svgIcon ? (
                      <img src={mod.svgIcon} alt="" className="w-5 h-5 opacity-80" />
                    ) : (
                      <LucideIcon className={`w-5 h-5 ${colors.text}`} />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{mod.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!activeSite) return null;

  const enabledModules = activeSite.modules
    ? Object.values(MODULES).filter(m => activeSite.modules.includes(m.key))
    : Object.values(MODULES);

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Welcome header with user name */}
      <div className="mb-4 mt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          {activeSite.user?.name || activeSite.name}
        </h2>
      </div>

      {/* Event Selector */}
      <div className="mb-5">
        <EventSelector />
      </div>

      {/* Module Grid — colored icon tiles */}
      <div className="grid grid-cols-2 gap-3">
        {enabledModules.map((mod) => {
          const LucideIcon = Icons[mod.icon] || Icons.Folder;
          const colors = MODULE_COLORS[mod.key] || MODULE_COLORS.artists;

          return (
            <button
              key={mod.key}
              onClick={() => navigate(`/${mod.key}`)}
              className="vc-tile group"
            >
              {/* Colored icon circle */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors.iconBg}`}>
                {mod.svgIcon ? (
                  <img src={mod.svgIcon} alt="" className="w-5 h-5" />
                ) : (
                  <LucideIcon className="w-5 h-5 text-white" />
                )}
              </div>

              <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                {mod.label}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5 text-left leading-snug line-clamp-2">
                {mod.description}
              </span>

              {/* Arrow */}
              <img src="/icons/arrows/arrow-rt-dark.svg" alt="" className="absolute top-4 right-3 w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
