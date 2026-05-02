import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MODULES } from '../api/endpoints';
import { Check, Globe, Trash2, LogOut, LogIn, GripVertical, BookOpen, PlayCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { resolveSiteLogo, siteName } from '../utils/helpers';
import DraggableList from './DraggableList';

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

  // Ordered list of all module keys — enabled ones first in saved order, then disabled ones appended
  const allModuleKeys = Object.keys(MODULES);
  const savedOrder = activeSite.modules || allModuleKeys;
  // Merge: saved order first, then any keys not yet in savedOrder
  const orderedModules = [
    ...savedOrder.filter(k => allModuleKeys.includes(k)),
    ...allModuleKeys.filter(k => !savedOrder.includes(k)),
  ].map(k => MODULES[k]).filter(Boolean);

  const enabledSet = new Set(savedOrder);

  const toggleModule = async (key) => {
    const current = savedOrder;
    const updated = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    if (updated.length === 0) return;
    await updateSiteModules(activeSiteId, updated);
  };

  const enableAll = async () => {
    await updateSiteModules(activeSiteId, null);
  };

  const handleReorder = async (newItems) => {
    // Preserve only the enabled keys in new order, disabled keys are excluded
    const newOrder = newItems.map(m => m.key).filter(k => enabledSet.has(k));
    await updateSiteModules(activeSiteId, newOrder);
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
          <div className="w-10 h-10 rounded-xl bg-vc-100 overflow-hidden flex items-center justify-center">
            {resolveSiteLogo(activeSite) ? (
              <img src={resolveSiteLogo(activeSite)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Globe className="w-5 h-5 text-vc-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">{siteName(activeSite)}</div>
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

      {/* Tutorials & Support */}
      <button
        onClick={() => navigate('/tutorials')}
        className="w-full flex items-center gap-3 vc-card mb-3 text-left hover:border-vc-300 hover:bg-vc-50 active:scale-[0.99] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-vc-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-vc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800">Tutorials & Support</div>
          <div className="text-xs text-gray-400 mt-0.5">Interactive walkthroughs for all features</div>
        </div>
        <span className="text-gray-300 text-sm">→</span>
      </button>

      {/* Watch tutorial videos */}
      <a
        href="/tutorials/video-tutorials.html"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3 vc-card mb-6 text-left hover:border-vc-300 hover:bg-vc-50 active:scale-[0.99] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-vc-100 flex items-center justify-center shrink-0">
          <PlayCircle className="w-5 h-5 text-vc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800">Watch Tutorials</div>
          <div className="text-xs text-gray-400 mt-0.5">Video walkthroughs for every feature</div>
        </div>
        <span className="text-gray-300 text-sm">↗</span>
      </a>

      {/* Section Visibility + Order */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Visible Sections</h3>
          <button onClick={enableAll} className="text-xs text-vc-600 hover:text-vc-500">
            Show All
          </button>
        </div>
        <DraggableList
          items={orderedModules}
          keyExtractor={m => m.key}
          onReorder={handleReorder}
          renderItem={(mod) => {
            const Icon = Icons[mod.icon] || Icons.Folder;
            const enabled = enabledSet.has(mod.key);
            return (
              <button
                onClick={() => toggleModule(mod.key)}
                className={`w-full flex items-center gap-3 text-left transition-opacity ${
                  enabled ? 'opacity-100' : 'opacity-35'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-700">{mod.label}</span>
                {enabled && <Check className="w-4 h-4 text-vc-600 shrink-0" />}
              </button>
            );
          }}
        />
        <p className="text-xs text-gray-400 mt-2">
          Tap to show/hide · Long-press to reorder.
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
