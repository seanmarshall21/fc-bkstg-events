import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home, Search, PlusCircle, Heart, Settings } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import SiteSwitcher from '../sites/SiteSwitcher';
import { useState } from 'react';

const NAV_ITEMS = [
  { key: '/', icon: Home, label: 'Home' },
  { key: '/search', icon: Search, label: 'Search' },
  { key: '/add-site', icon: PlusCircle, label: 'Add Site' },
  { key: '/favorites', icon: Heart, label: 'Favorites' },
  { key: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { activeSite, hasSites } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [showSiteSwitcher, setShowSiteSwitcher] = useState(false);

  // Determine which nav item is active
  const activeNav = NAV_ITEMS.find(item =>
    item.key === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.key)
  )?.key;

  // Nested page detection for back button
  const isNestedPage = !isHome && !NAV_ITEMS.some(item => item.key === location.pathname);

  return (
    <>
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-surface-3 bg-white/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          {isNestedPage && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Site selector / logo */}
          {hasSites ? (
            <button
              onClick={() => setShowSiteSwitcher(true)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-vc-950 flex items-center justify-center shadow-sm">
                <img src="/icons/icon-192.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 max-w-[180px] truncate leading-tight">
                  {activeSite?.name || 'Select Site'}
                </span>
              </div>
              <ChevronLeft className="w-3 h-3 text-gray-400 rotate-[-90deg] group-hover:text-gray-600 transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-vc-950 flex items-center justify-center shadow-sm">
                <img src="/icons/icon-192.png" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                VC Event Manager
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="vc-scroll pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation — 5 icons per Figma */}
      <nav className="shrink-0 flex items-center justify-around px-2 h-16 border-t border-surface-3 bg-white/95 backdrop-blur-sm z-50 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-vc-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-vc-700 mt-0.5" />
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
