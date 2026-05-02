import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MoreVertical, Flag, HelpCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useTutorial } from '../context/TutorialContext';
import { ROUTE_TUTORIAL_MAP } from '../tutorials/tutorialData';
import SiteSwitcher from '../sites/SiteSwitcher';
import { useState, useRef, useEffect } from 'react';
import { resolveSiteLogo, siteName } from '../utils/helpers';

// Bottom nav items
const NAV_ITEMS = [
  { key: '/',          icon: '/icons/VC-WebApp-Logo-Purp-lt.svg', label: 'Home' },
  { key: '/search',    icon: '/icons/search-lt.svg',              label: 'Search' },
  { key: '/add-site',  icon: '/icons/add-outline-lt.svg',         label: 'Add Site' },
  { key: '/favorites', icon: '/icons/favorite-lt.svg',            label: 'Favorites' },
  { key: '/settings',  icon: '/icons/settings-lt.svg',            label: 'Settings' },
];

// Module routes that live "inside" a site context
const MODULE_ROUTES = ['/artists', '/lineup', '/sponsors', '/events', '/styles', '/confidential', '/contestants', '/genres', '/stages'];

export default function Layout() {
  const { activeSite, activeSiteId, hasSites, user, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(activeSiteId);
  const { openTutorial } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [showSiteSwitcher, setShowSiteSwitcher] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const kebabRef = useRef(null);

  // Close kebab on outside click
  useEffect(() => {
    if (!showKebab) return;
    const handler = (e) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) setShowKebab(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showKebab]);

  // Determine which nav item is active
  const activeNav = NAV_ITEMS.find(item =>
    item.key === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.key)
  )?.key;

  // Are we inside a site context? (module page or site dashboard)
  const isInsideSite = MODULE_ROUTES.some(r => location.pathname.startsWith(r))
    || location.pathname.startsWith('/site/');

  // Nested page = not a direct nav item or home
  const isNestedPage = !isHome && !NAV_ITEMS.some(item => item.key === location.pathname);

  // Detect if current page is a detail page (has an ID param like /artists/123)
  const detailMatch = location.pathname.match(/^\/(artists|sponsors|events|lineup|contestants)\/(\d+|new)$/);
  const currentModule = detailMatch?.[1] || null;
  const currentItemId = detailMatch?.[2] || null;
  const canFavorite = currentModule && currentItemId && currentItemId !== 'new';

  // Is this the site dashboard itself?
  const isSiteDashboard = location.pathname.startsWith('/site/');
  // Is this a module list page (e.g. /artists, /sponsors)?
  const isModuleList = MODULE_ROUTES.some(r => location.pathname === r);

  // Tutorial help button — shown when the current route has a mapped tutorial
  const routeTutorial = ROUTE_TUTORIAL_MAP[location.pathname] || null;

  // Handle back button
  const handleBack = () => {
    if (isSiteDashboard) {
      navigate('/');
    } else if (isModuleList && activeSiteId) {
      navigate(`/site/${activeSiteId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/10 bg-white/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          {isNestedPage && (
            <button
              onClick={handleBack}
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
                Brand Events Hub
              </span>
            </div>
          )}
        </div>

        {/* Right side: tutorial help + kebab menu + user avatar */}
        <div className="flex items-center gap-1.5">
          {/* Tutorial help button — visible when current route has a mapped tutorial */}
          {routeTutorial && (
            <button
              onClick={() => openTutorial(routeTutorial)}
              className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-vc-600 transition-colors"
              aria-label="Help / Tutorial"
              title={`Tutorial: ${routeTutorial.title}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}

          {/* Kebab / more menu — always visible on module and site views */}
          {(isInsideSite || detailMatch) && (
            <div className="relative" ref={kebabRef}>
              <button
                onClick={() => setShowKebab(!showKebab)}
                className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showKebab && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-surface-3 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                  {canFavorite && (
                    <button
                      onClick={() => {
                        toggleFavorite(currentModule, parseInt(currentItemId), document.title);
                        setShowKebab(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-surface-1 transition-colors text-left"
                    >
                      <Flag className={`w-4 h-4 ${isFavorite(currentModule, parseInt(currentItemId)) ? 'text-vc-600 fill-vc-600' : 'text-gray-400'}`} />
                      {isFavorite(currentModule, parseInt(currentItemId)) ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                  )}
                  {activeSiteId && (
                    <button
                      onClick={() => { navigate(`/site/${activeSiteId}`); setShowKebab(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-surface-1 transition-colors text-left border-t border-surface-3"
                    >
                      Site Dashboard
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User avatar */}
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
        </div>
      </header>

      {/* Main Content — scrollable with padding for floating nav */}
      <main className="vc-scroll pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation — floating pill, 12px inset */}
      <div className="fixed bottom-3 left-3 right-3 z-50">
        <nav className="flex items-center justify-around px-2 h-16 bg-vc-950 rounded-2xl shadow-xl shadow-black/20 pb-safe">
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
      </div>

      {/* Site Switcher Modal */}
      {showSiteSwitcher && (
        <SiteSwitcher onClose={() => setShowSiteSwitcher(false)} />
      )}
    </div>
  );
}
