import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Globe, Settings, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import SiteSwitcher from '../sites/SiteSwitcher';
import { useState } from 'react';

export default function Layout() {
  const { activeSite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [showSiteSwitcher, setShowSiteSwitcher] = useState(false);

  return (
    <>
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-surface-dark-3 bg-surface-dark-0/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-dark-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Site selector */}
          <button
            onClick={() => setShowSiteSwitcher(true)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-dark-2 transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-vc-700 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-200 max-w-[160px] truncate">
              {activeSite?.name || 'Select Site'}
            </span>
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500 rotate-[-90deg]" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-surface-dark-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="vc-scroll">
        <Outlet />
      </main>

      {/* Site Switcher Modal */}
      {showSiteSwitcher && (
        <SiteSwitcher onClose={() => setShowSiteSwitcher(false)} />
      )}
    </>
  );
}
