import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import SiteSwitcher from '../sites/SiteSwitcher';
import { useState } from 'react';
import { resolveSiteLogo, siteName } from '../utils/helpers';

// Bottom nav items — custom icons from /public/icons/
// Light variants (white fill) for the dark nav bar
const NAV_ITEMS = [
  { key: '/',          icon: '/icons/VC-WebApp-Logo-Purp-lt.svg', label: 'Home' },
  { key: '/search',    icon: '/icons/search-lt.svg',              label: 'Search' },
  { key: '/add-site',  icon: '/icons/add-outline-lt.svg',         label: 'Add Site' },
  { key: '/favorites', icon: '/icons/favorite-lt.svg',            label: 'Favorites' },
  { key: '/settings',  icon: '/icons/settings-lt.svg',            label: 'Settings' },
];

export default function Layout() {
  const { activeSite, hasSites, user, isAuthenticated } = useAuth();
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
    <div className="flex flex-col h-full min-h-0">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/10 bg-white/80 backdrop-blur-sm z-50">
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
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-surface-2 flex items-center justify-center shadow-sm">
                {activeSite && resolveSiteLogo(activeSite) ? (
                  <img src={resolveSiteLogo(activeSite)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src="/icons/VC-WebApp-Logo-Purp-lt.svg" alt="" className="w-6 h-6" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 max-w-[180px] truncate leading-tight">
                  {activeSite ? siteName(activeSite) : 'Select Site'}
                </span>
              </div>
              <ChevronLeft className="w-3 h-3 text-gray-400 rotate-[-90deg] group-hover:text-gray-600 transition-colors" />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <img src="/icons/VC-WebApp-Logo-Purp-lt.svg" alt="" className="w-8 h-8" />
              <span className="text-sm font-semibold text-gray-900">
                FC Event Manager
              </span>
            </div>
          )}
        </div>

        {/* User initials / login link */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold tracking-wide shadow-sm"
          >
            {(user?.user_metadata?.full_name || user?.email || '')
              .split(/[\s@]/)
              .filter(Boolean)
              .slice(0, 2)
              .map(s => s[0]?.toUpperCase())
              .join('')
              || '?'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-medium text-vc-600 hover:text-vc-500 px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          >
            Sign in
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="vc-scroll pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation — dark bar with custom icons */}
      <nav className="shrink-0 flex items-center justify-around px-1 h-16 bg-vc-950 z-50 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = activeNav === item.key;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/10'
                  : 'opacity-50 hover:opacity-75 active:opacity-90'
              }`}
            >
              <div className="relative">
                <img
                  src={item.icon}
                  alt=""
                  className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-vc-400" />
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-white/80'
              }`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Site Switcher Modal */}
      {showSiteSwitcher && (
        <SiteSwitcher onClose={() => setShowSiteSwitcher(false)} />
      )}
    </div>
  );
}
