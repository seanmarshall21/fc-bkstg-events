import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MODULES } from '../api/endpoints';
import { ChevronLeft, Check, Globe, Trash2, LogOut } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    activeSite,
    activeSiteId,
    sites,
    updateSiteModules,
    removeSite,
  } = useAuth();

  if (!activeSite) return null;

  // Current enabled modules (null = all)
  const enabledModules = activeSite.modules || Object.keys(MODULES);

  const toggleModule = async (key) => {
    const current = activeSite.modules || Object.keys(MODULES);
    const updated = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    // Don't allow zero modules
    if (updated.length === 0) return;
    await updateSiteModules(activeSiteId, updated);
  };

  const enableAll = async () => {
    await updateSiteModules(activeSiteId, null);
  };

  const handleRemoveSite = async () => {
    if (confirm(`Remove "${activeSite.name}" from the app? You can re-add it later.`)) {
      await removeSite(activeSiteId);
      navigate('/');
    }
  };

  return (
    <div className="p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-dark-2 text-gray-400"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
      </div>

      {/* Current Site Info */}
      <div className="vc-card mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-vc-700/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-vc-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-200">{activeSite.name}</div>
            <div className="text-xs text-gray-500">{new URL(activeSite.url).hostname}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-dark-3 text-xs text-gray-500">
          Logged in as <span className="text-gray-300">{activeSite.user?.name}</span>
          {activeSite.user?.roles?.length > 0 && (
            <span> · {activeSite.user.roles.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Section Visibility */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Visible Sections</h3>
          <button onClick={enableAll} className="text-xs text-vc-400 hover:text-vc-300">
            Show All
          </button>
        </div>
        <div className="space-y-1">
          {Object.values(MODULES).map((mod) => {
            const Icon = Icons[mod.icon] || Icons.Folder;
            const enabled = enabledModules.includes(mod.key);
            return (
              <button
                key={mod.key}
                onClick={() => toggleModule(mod.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  enabled
                    ? 'bg-surface-dark-1 border border-surface-dark-3'
                    : 'bg-transparent border border-transparent opacity-50'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-300">{mod.label}</span>
                {enabled && <Check className="w-4 h-4 text-vc-400" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Toggle sections to customize your dashboard. Hidden sections are still accessible — they just won't appear on the home screen.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-surface-dark-3 pt-6">
        <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
        <button
          onClick={handleRemoveSite}
          className="vc-btn vc-btn--danger w-full"
        >
          <Trash2 className="w-4 h-4" />
          Remove This Site
        </button>
      </div>
    </div>
  );
}
