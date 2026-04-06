import { useNavigate, useParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import EventSelector from './EventSelector';
import { useEffect } from 'react';
import { resolveSiteLogo, siteName } from '../utils/helpers';

const MODULE_COLORS = {
  artists:      { bg: 'bg-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-500' },
  lineup:       { bg: 'bg-purple-100', text: 'text-purple-600', iconBg: 'bg-purple-500' },
  sponsors:     { bg: 'bg-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-500' },
  events:       { bg: 'bg-orange-100', text: 'text-orange-600', iconBg: 'bg-orange-500' },
  styles:       { bg: 'bg-yellow-100', text: 'text-yellow-600', iconBg: 'bg-yellow-500' },
  confidential: { bg: 'bg-red-100', text: 'text-red-600', iconBg: 'bg-red-500' },
  genres:       { bg: 'bg-cyan-100', text: 'text-cyan-600', iconBg: 'bg-cyan-500' },
  stages:       { bg: 'bg-indigo-100', text: 'text-indigo-600', iconBg: 'bg-indigo-500' },
  contestants:  { bg: 'bg-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-500' },
};

export default function SiteDashboard() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { sites, switchSite, activeSite } = useAuth();

  const site = sites.find(s => s.id === siteId);

  // Auto-switch active site context when viewing a site dashboard
  useEffect(() => {
    if (site && activeSite?.id !== site.id) {
      switchSite(site.id);
    }
  }, [site, activeSite?.id, switchSite]);

  if (!site) {
    return (
      <div className="p-6 text-center py-16">
        <p className="text-sm text-gray-500">Site not found.</p>
        <button onClick={() => navigate('/')} className="vc-btn vc-btn--primary mt-4">
          Go Home
        </button>
      </div>
    );
  }

  const enabledModules = site.modules
    ? Object.values(MODULES).filter(m => site.modules.includes(m.key))
    : Object.values(MODULES);

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Site header */}
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="w-10 h-10 rounded-xl bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
          {resolveSiteLogo(site) ? (
            <img src={resolveSiteLogo(site)} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icons.Globe className="w-5 h-5 text-vc-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight truncate">
          {siteName(site)}
        </h2>
      </div>

      {/* Event Selector */}
      <div className="mb-5">
        <EventSelector />
      </div>

      {/* Module Grid */}
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
              <img src="/icons/arrows/arrow-rt-dark.svg" alt="" className="absolute top-4 right-3 w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
