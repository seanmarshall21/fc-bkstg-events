import { Globe, Check, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SiteSwitcher({ onClose }) {
  const { sites, activeSiteId, switchSite, removeSite } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = async (siteId) => {
    await switchSite(siteId);
    onClose();
    navigate('/');
  };

  const handleRemove = async (e, siteId) => {
    e.stopPropagation();
    if (confirm('Remove this site? You can re-add it later.')) {
      await removeSite(siteId);
      if (sites.length <= 1) {
        onClose();
      }
    }
  };

  const handleAddNew = () => {
    onClose();
    navigate('/add-site');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-surface-dark-1 rounded-2xl border border-surface-dark-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-dark-3">
          <h3 className="text-sm font-semibold text-gray-200">Your Sites</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-dark-3 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Site list */}
        <div className="max-h-[50vh] overflow-y-auto">
          {sites.map(site => (
            <button
              key={site.id}
              onClick={() => handleSwitch(site.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-surface-dark-2 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-vc-700/30 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-vc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {site.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {new URL(site.url).hostname}
                </div>
              </div>
              {site.id === activeSiteId ? (
                <Check className="w-4 h-4 text-vc-400 shrink-0" />
              ) : (
                <button
                  onClick={(e) => handleRemove(e, site.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Add Site */}
        <button
          onClick={handleAddNew}
          className="w-full flex items-center gap-3 p-4 border-t border-surface-dark-3 hover:bg-surface-dark-2 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-surface-dark-3 flex items-center justify-center">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm text-gray-400">Add another site</span>
        </button>
      </div>
    </div>
  );
}
