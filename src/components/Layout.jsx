import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home, Music, ListMusic, Settings, Globe } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import SiteSwitcher from '../sites/SiteSwitcher';
import { useState } from 'react';

const NAV_ITEMS = [
  { key: '/', icon: Home, label: 'Home' },
  { key: '/artists', icon: Music, label: 'Artists' },
  { key: '/lineup', icon: ListMusic, label: 'Lineup' },
  { key: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { activeSite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [showSiteSwitcher, setShowSiteSwitcher] = useState(false);

  // Determine which nav item is active (match prefix for nested routes)
  const activeNav = NAV_ITEMS.find(item =>
    item.key === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.key)
  )?.key;

  // Check if we're on a detail/nested page (not a top-level nav item)
  const isNestedPage = !isHome && !NAV_ITEMS.some(item => item.key === location.pathname);

  return (
    <>
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 h-13 border-b border-surface-dark-3 bg-surface-dark-0/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          {isNestedPage && (
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
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-dark-2 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface-dark-2 border border-surface-dark-3 flex items-center justify-center">
              <img src="/icons/icon-192.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-200 max-w-[180px] truncate leading-tight">
                {activeSite?.name || 'Select Site'}
              </span>
            </div>
            <ChevronLeft className="w-3 h-3 text-gray-600 rotate-[-90deg] group-hover:text-gray-400 transition-colors" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/add-site')}
            className="p-2 rounded-lg hover:bg-surface-dark-2 text-gray-500 hover:text-gray-300 transition-colors"
            title="Add site"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="vc-scroll pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 flex items-center justify-around px-2 h-16 border-t border-surface-dark-3 bg-surface-dark-0/95 backdrop-blur-sm z-50 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-vc-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-vc-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Site Switcher Modal */}
      {showSiteSwitcher && (
        <SiteSwitcher onClose={() => setShowSiteSwitcher(false)} />
      )}
    </>
  );
}
