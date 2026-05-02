import { useNavigate, useParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import EventSelector from './EventSelector';
import { useEffect } from 'react';
import { resolveSiteLogo, siteName } from '../utils/helpers';
import useUptimeStatus from '../hooks/useUptimeStatus';
import StatusBadge from './ui/StatusBadge';


export default function SiteDashboard() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const { sites, switchSite, activeSite } = useAuth();
  const { statusBySiteId } = useUptimeStatus();

  const site = sites.find(s => s.id === siteId);

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
    ? site.modules.filter(k => MODULES[k]).map(k => MODULES[k])
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight truncate">
              {siteName(site)}
            </h2>
            {(() => {
              const s = statusBySiteId[site.registrySlug];
              return s?.status ? <StatusBadge status={s.status} showLabel size="sm" /> : null;
            })()}
          </div>
        </div>
      </div>

      {/* Event Selector — hidden on Zoo Agency */}
      {activeSite?.registrySlug !== 'zoo-agency' && (
        <div className="mb-5">
          <EventSelector />
        </div>
      )}

      {/* Module Grid */}
      <div className="grid grid-cols-2 gap-3">
        {enabledModules.map((mod) => {
          const LucideIcon = Icons[mod.icon] || Icons.Folder;

          return (
            <button
              key={mod.key}
              onClick={() => navigate(`/${mod.key}`)}
              className="vc-tile group"
            >
              {/* Icon — 36×36 frameless, top-left corner */}
              <div className="absolute top-3 left-3 w-9 h-9">
                {mod.svgIcon ? (
                  <>
                    <img
                      src={mod.svgIcon}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <span style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                      <LucideIcon className="w-9 h-9 text-gray-400" />
                    </span>
                  </>
                ) : (
                  <LucideIcon className="w-9 h-9 text-gray-400" />
                )}
              </div>

              {/* Label */}
              <span
                className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors"
                style={{ lineHeight: '1rem' }}
              >
                {mod.label}
              </span>

              {/* Description */}
              <span className="text-[11px] text-gray-400 mt-0.5 text-left leading-snug line-clamp-2">
                {mod.description}
              </span>

              <img
                src="/icons/arrows/arrow-rt-dark.svg"
                alt=""
                className="absolute top-3 right-3 w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
