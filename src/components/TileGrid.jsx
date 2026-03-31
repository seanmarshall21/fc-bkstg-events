import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { MODULES } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';

export default function TileGrid() {
  const navigate = useNavigate();
  const { activeSite } = useAuth();

  if (!activeSite) return null;

  // Filter to enabled modules (null = all enabled)
  const enabledModules = activeSite.modules
    ? Object.values(MODULES).filter(m => activeSite.modules.includes(m.key))
    : Object.values(MODULES);

  return (
    <div className="p-4 pb-8">
      {/* Site header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100">
          {activeSite.name}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {enabledModules.length} sections available
        </p>
      </div>

      {/* Tile Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {enabledModules.map((mod) => {
          const Icon = Icons[mod.icon] || Icons.Folder;

          return (
            <button
              key={mod.key}
              onClick={() => navigate(`/${mod.key}`)}
              className={`vc-tile bg-gradient-to-br ${mod.color} ${mod.border}`}
            >
              <Icon className="w-8 h-8 text-gray-400 mb-3 opacity-60" />
              <span className="text-sm font-medium text-gray-200">
                {mod.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 text-left leading-tight">
                {mod.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
