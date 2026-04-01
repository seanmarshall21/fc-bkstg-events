import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Globe, Pencil, X, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { resolveSiteLogo, siteName } from '../utils/helpers';

export default function HomePage() {
  const navigate = useNavigate();
  const { sites, hasSites, removeSite } = useAuth();
  const [editing, setEditing] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const handleRemove = async (siteId) => {
    const site = sites.find(s => s.id === siteId);
    if (confirmId === siteId) {
      await removeSite(siteId);
      setConfirmId(null);
      if (sites.length <= 1) setEditing(false);
    } else {
      setConfirmId(siteId);
    }
  };

  // Empty state — no sites connected
  if (!hasSites) {
    return (
      <div className="p-6 pb-8 animate-fade-in">
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-surface-2 flex items-center justify-center">
            <img src="/icons/icon-192.png" alt="" className="w-14 h-14 object-contain" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No sites connected
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
            Add a site to start managing events, artists, sponsors, and more.
          </p>
          <button
            onClick={() => navigate('/add-site')}
            className="vc-btn vc-btn--primary mt-6"
          >
            <Plus className="w-4 h-4" />
            Add a Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Your Sites
        </h2>
        <button
          onClick={() => { setEditing(!editing); setConfirmId(null); }}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            editing
              ? 'bg-vc-100 text-vc-700'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {editing ? (
            <>
              <X className="w-3.5 h-3.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Site list */}
      <div className="flex flex-col gap-3">
        {sites.map((site) => {
          const logo = resolveSiteLogo(site);
          const name = siteName(site);
          const isConfirming = confirmId === site.id;

          return (
            <div key={site.id} className="relative">
              <button
                onClick={() => !editing ? navigate(`/site/${site.id}`) : null}
                className={`vc-tile flex-row items-center gap-4 group w-full ${
                  editing ? 'pointer-events-none opacity-90' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Globe className="w-5 h-5 text-vc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {name}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {(() => { try { return new URL(site.url).hostname; } catch { return site.url; } })()}
                  </div>
                </div>
                {!editing && (
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                )}
              </button>

              {/* Edit mode: remove button */}
              {editing && (
                <button
                  onClick={() => handleRemove(site.id)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all pointer-events-auto ${
                    isConfirming
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isConfirming ? 'Confirm' : 'Remove'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add another site */}
      <button
        onClick={() => navigate('/add-site')}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-vc-600 hover:border-vc-300 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add another site
      </button>
    </div>
  );
}
