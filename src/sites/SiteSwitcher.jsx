import { Globe, Check, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { resolveSiteLogo, siteName } from '../utils/helpers';

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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet panel */}
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl animate-slide-up flex flex-col" style={{ maxHeight: 'calc(100dvh - 120px)' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 pb-3">
          <h3 className="text-lg font-bold text-gray-900">Switch Site</h3>
          <button
            onClick={handleAddNew}
            className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-surface-3 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Site list — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex flex-col gap-1.5">
            {sites.map(site => {
              const isActive = site.id === activeSiteId;
              return (
                <button
                  key={site.id}
                  onClick={() => handleSwitch(site.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                    isActive
                      ? 'bg-vc-900 text-white'
                      : 'hover:bg-surface-1'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20' : 'bg-surface-2'
                  }`}>
                    {resolveSiteLogo(site) ? (
                      <img src={resolveSiteLogo(site)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Globe className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-vc-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {siteName(site)}
                    </div>
                    <div className={`text-xs truncate ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                      {(() => { try { return new URL(site.url).hostname; } catch { return site.url; } })()}
                    </div>
                  </div>
                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleRemove(e, site.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Site footer */}
        <button
          onClick={handleAddNew}
          className="shrink-0 w-full flex items-center justify-center gap-2 p-4 border-t border-surface-3 hover:bg-surface-1 transition-colors text-sm text-gray-400 hover:text-gray-600"
        >
          <Plus className="w-4 h-4" />
          Add another site
        </button>
      </div>
    </div>
  );
}
