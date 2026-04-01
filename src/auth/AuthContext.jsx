import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VCApiClient } from '../api/client';
import { storeGet, storeSet, storeDel, SITES_KEY, ACTIVE_SITE_KEY, ACTIVE_EVENTS_KEY, PREFS_KEY } from '../hooks/useStore';
import { WP_ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext(null);

const WELCOME_KEY = 'vc_seen_welcome';

/**
 * Site shape stored in IndexedDB:
 * {
 *   id: string (uuid),
 *   url: string,
 *   name: string,
 *   username: string,
 *   appPassword: string,
 *   user: { id, name, email, roles },
 *   modules: string[] (enabled module keys),
 * }
 */

export function AuthProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Event state: { siteId: eventId } persisted map + loaded events list
  const [activeEventsMap, setActiveEventsMap] = useState({});
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Load persisted sites on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await storeGet(SITES_KEY);
        const activeId = await storeGet(ACTIVE_SITE_KEY);
        const eventsMap = await storeGet(ACTIVE_EVENTS_KEY);
        const seenWelcome = await storeGet(WELCOME_KEY);

        if (saved && saved.length) {
          setSites(saved);
          setActiveSiteId(activeId || saved[0].id);
          setHasSeenWelcome(true); // If they have sites, they've been through onboarding
        } else {
          setHasSeenWelcome(!!seenWelcome);
        }
        if (eventsMap) {
          setActiveEventsMap(eventsMap);
        }
      } catch (e) {
        console.warn('Failed to load sites:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Dismiss welcome screen (persists so it doesn't show again)
  const dismissWelcome = useCallback(async () => {
    setHasSeenWelcome(true);
    await storeSet(WELCOME_KEY, true);
  }, []);

  // Persist sites whenever they change
  const persistSites = useCallback(async (updatedSites) => {
    setSites(updatedSites);
    await storeSet(SITES_KEY, updatedSites);
  }, []);

  // Get active site object
  const activeSite = sites.find(s => s.id === activeSiteId) || null;

  // Get API client for active site
  const getClient = useCallback((site = null) => {
    const s = site || activeSite;
    if (!s) return null;
    return new VCApiClient(s.url, {
      username: s.username,
      appPassword: s.appPassword,
    });
  }, [activeSite]);

  // ── Event Management ───────────────────────────────────────

  // Fetch events for the active site
  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setEventsLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, { per_page: 50 });
      setEvents(data);

      // Auto-select first event if none selected for this site
      if (data.length > 0 && activeSiteId && !activeEventsMap[activeSiteId]) {
        const newMap = { ...activeEventsMap, [activeSiteId]: data[0].id };
        setActiveEventsMap(newMap);
        await storeSet(ACTIVE_EVENTS_KEY, newMap);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [getClient, activeSiteId, activeEventsMap]);

  // Fetch events when active site changes
  useEffect(() => {
    if (activeSiteId && sites.length > 0) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [activeSiteId, sites.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Current active event ID for the active site
  const activeEventId = activeSiteId ? (activeEventsMap[activeSiteId] || null) : null;

  // Current active event object
  const activeEvent = events.find(e => e.id === activeEventId) || null;

  // Set active event for current site
  const setActiveEvent = useCallback(async (eventId) => {
    if (!activeSiteId) return;
    const newMap = { ...activeEventsMap, [activeSiteId]: eventId };
    setActiveEventsMap(newMap);
    await storeSet(ACTIVE_EVENTS_KEY, newMap);
  }, [activeSiteId, activeEventsMap]);

  // ── Site Management ────────────────────────────────────────

  // Add a new site with credential validation
  const addSite = useCallback(async ({ url, username, appPassword, registrySlug }) => {
    setError(null);

    // Normalize URL
    let siteUrl = url.trim().replace(/\/+$/, '');
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }

    const client = new VCApiClient(siteUrl, { username, appPassword });

    try {
      // Validate credentials
      const user = await client.validateAuth();

      // Fetch site name
      const { data: siteInfo } = await client.get('');
      const siteName = siteInfo?.name || new URL(siteUrl).hostname;

      // Pull registry metadata if connected via site picker
      let registryMeta = {};
      if (registrySlug) {
        const { getRegistrySite } = await import('../config/siteRegistry');
        const reg = getRegistrySite(registrySlug);
        if (reg) {
          registryMeta = {
            registrySlug: reg.slug,
            logo: reg.logo,
            modules: reg.modules,
            category: reg.category,
            sponsorshipPath: reg.sponsorshipPath || null,
          };
        }
      }

      const newSite = {
        id: crypto.randomUUID(),
        url: siteUrl,
        name: siteName,
        username,
        appPassword,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
        },
        modules: registryMeta.modules || null,
        ...registryMeta,
      };

      const updated = [...sites, newSite];
      await persistSites(updated);

      // Auto-switch to new site if it's the first
      if (!activeSiteId) {
        setActiveSiteId(newSite.id);
        await storeSet(ACTIVE_SITE_KEY, newSite.id);
      }

      // Mark welcome as seen since they've connected a site
      if (!hasSeenWelcome) {
        setHasSeenWelcome(true);
        await storeSet(WELCOME_KEY, true);
      }

      return newSite;
    } catch (err) {
      const msg = err.status === 401 || err.status === 403
        ? 'Invalid credentials. Check your username and application password.'
        : err.code === 'network_error'
          ? 'Could not reach the site. Check the URL and make sure CORS is enabled.'
          : err.message;
      setError(msg);
      throw err;
    }
  }, [sites, activeSiteId, persistSites, hasSeenWelcome]);

  // Remove a site
  const removeSite = useCallback(async (siteId) => {
    const updated = sites.filter(s => s.id !== siteId);
    await persistSites(updated);

    if (activeSiteId === siteId) {
      const newActive = updated.length ? updated[0].id : null;
      setActiveSiteId(newActive);
      await storeSet(ACTIVE_SITE_KEY, newActive);
    }

    // Clean up events map
    const newMap = { ...activeEventsMap };
    delete newMap[siteId];
    setActiveEventsMap(newMap);
    await storeSet(ACTIVE_EVENTS_KEY, newMap);
  }, [sites, activeSiteId, persistSites, activeEventsMap]);

  // Switch active site
  const switchSite = useCallback(async (siteId) => {
    setActiveSiteId(siteId);
    await storeSet(ACTIVE_SITE_KEY, siteId);
  }, []);

  // Update site modules (visible sections)
  const updateSiteModules = useCallback(async (siteId, modules) => {
    const updated = sites.map(s =>
      s.id === siteId ? { ...s, modules } : s
    );
    await persistSites(updated);
  }, [sites, persistSites]);

  // Whether any sites are connected
  const hasSites = sites.length > 0;

  return (
    <AuthContext.Provider
      value={{
        sites,
        activeSite,
        activeSiteId,
        hasSites,
        loading,
        error,
        setError,
        getClient,
        addSite,
        removeSite,
        switchSite,
        updateSiteModules,
        hasSeenWelcome,
        dismissWelcome,
        // Event context
        events,
        eventsLoading,
        activeEventId,
        activeEvent,
        setActiveEvent,
        fetchEvents,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
