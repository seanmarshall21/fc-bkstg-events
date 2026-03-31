import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import EventSelector from './EventSelector';

export default function TileGrid() {
  const navigate = useNavigate();
  const { activeSite } = useAuth();

  if (!activeSite) return null;

  const enabledModules = activeSite.modules
    ? Object.values(MODULES).filter(m => activeSite.modules.includes(m.key))
    : Object.values(MODULES);

  return (
    <div className="p-4 pb-8">
      {/* Welcome header */}
      <div className="mb-4 mt-2">
        <h2 className="text-xl font-bold text-gray-100 tracking-tight">
          {activeSite.name}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {enabledModules.length} modules available
        </p>
      </div>

      {/* Event Selector */}
      <div className="mb-5">
        <EventSelector />
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-2 gap-3">
        {enabledModules.map((mod) => {
          const Icon = Icons[mod.icon] || Icons.Folder;

          return (
            <button
              key={mod.key}
              onClick={() => navigate(`/${mod.key}`)}
              className={`vc-tile group bg-gradient-to-br ${mod.color} ${mod.border}`}
            >
              {/* Icon container */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${mod.iconBg || 'bg-white/5'} transition-colors group-hover:bg-white/10`}>
                <Icon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              </div>

              <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                {mod.label}
              </span>
              <span className="text-[11px] text-gray-500 mt-0.5 text-left leading-snug line-clamp-2">
                {mod.description}
              </span>

              {/* Arrow indicator */}
              <Icons.ChevronRight className="absolute top-4 right-3 w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
