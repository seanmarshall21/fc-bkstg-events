import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MODULES } from '../api/endpoints';
import { Check, Globe, Trash2, LogOut, LogIn } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    activeSite,
    activeSiteId,
    hasSites,
    updateSiteModules,
    removeSite,
    user,
    isAuthenticated,
    signOut,
  } = useAuth();

  if (!hasSites || !activeSite) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to access settings.</p>
      </div>
    );
  }

  const enabledModules = activeSite.modules || Object.keys(MODULES);

  const toggleModule = async (key) => {
    const current = activeSite.modules || Object.keys(MODULES);
    const updated = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
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
    <div className="p-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      </div>

      {/* Current Site Info */}
      <div className="vc-card mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vc-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-vc-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">{activeSite.name}</div>
            <div className="text-xs text-gray-400">{new URL(activeSite.url).hostname}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-3 text-xs text-gray-400">
          Logged in as <span className="text-gray-700">{activeSite.user?.name}</span>
          {activeSite.user?.roles?.length > 0 && (
            <span> &middot; {activeSite.user.roles.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Section Visibility */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Visible Sections</h3>
          <button onClick={enableAll} className="text-xs text-vc-600 hover:text-vc-500">
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
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  enabled
                    ? 'bg-white border border-surface-3 shadow-sm'
                    : 'bg-transparent border border-transparent opacity-40'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700">{mod.label}</span>
                {enabled && <Check className="w-4 h-4 text-vc-600" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Toggle sections to customize your dashboard.
        </p>
      </div>

      {/* Account */}
      <div className="border-t border-surface-3 pt-6 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Account</h3>
        {isAuthenticated ? (
          <div className="vc-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                {(user?.user_metadata?.full_name || user?.email || '')
                  .split(/[\s@]/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(s => s[0]?.toUpperCase())
                  .join('') || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {user?.user_metadata?.full_name || 'User'}
                </div>
                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="vc-btn vc-btn--ghost w-full mt-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="vc-btn vc-btn--secondary w-full"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Sync Across Devices
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="border-t border-surface-3 pt-6">
        <h3 className="text-sm font-medium text-red-500 mb-3">Danger Zone</h3>
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
