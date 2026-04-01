import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VCApiClient } from '../api/client';
import { storeGet, storeSet, storeDel, SITES_KEY, ACTIVE_SITE_KEY, ACTIVE_EVENTS_KEY, PREFS_KEY } from '../hooks/useStore';
import { WP_ENDPOINTS } from '../api/endpoints';
import { isSupabaseConfigured } from '../config/supabase';
import { decodeHtml } from '../utils/helpers';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as supaSignOut,
  getSession,
  onAuthStateChange,
  loadProfile,
  saveProfile,
} from './ProfileSync';

const AuthContext = createContext(null);

const WELCOME_KEY = 'vc_seen_welcome';

export function AuthProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Supabase auth state
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);
  const syncingRef = useRef(false);

  // Event state
  const [activeEventsMap, setActiveEventsMap] = useState({});
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // ── Supabase Auth ──────────────────────────────────────────
  const user = session?.user || null;

  // Listen for auth changes (login, logout, token refresh)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing session
    getSession().then((s) => setSession(s));

    const { data: { subscription } } = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Sync profile from Supabase when user signs in
  useEffect(() => {
    if (!user || syncingRef.current) return;

    (async () => {
      syncingRef.current = true;
      try {
        const profile = await loadProfile(user.id);
        if (profile && profile.sites?.length) {
          // Merge cloud sites with local — local app passwords take priority
          const localSites = await storeGet(SITES_KEY) || [];
          const merged = profile.sites.map((cloudSite) => {
            const local = localSites.find(
              (ls) => ls.registrySlug === cloudSite.registrySlug || ls.url === cloudSite.url
            );
            // If we have local app password, keep it; otherwise site needs re-auth
            return local
              ? { ...cloudSite, appPassword: local.appPassword, username: local.username }
              : { ...cloudSite, appPassword: null, username: cloudSite.username || null };
          });

          setSites(merged);
          await storeSet(SITES_KEY, merged);

          if (profile.active_site_id) {
            setActiveSiteId(profile.active_site_id);
            await storeSet(ACTIVE_SITE_KEY, profile.active_site_id);
          }
          if (profile.active_events_map) {
            setActiveEventsMap(profile.active_events_map);
            await storeSet(ACTIVE_EVENTS_KEY, profile.active_events_map);
          }
        }
      } catch (e) {
        console.warn('Profile sync failed:', e);
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [user]);

  // Push local state to Supabase whenever sites change (debounced)
  const syncTimeout = useRef(null);
  useEffect(() => {
    if (!user || syncingRef.current || sites.length === 0) return;

    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      saveProfile(user.id, {
        sites,
        activeSiteId,
        activeEventsMap,
        preferences: {},
      });
    }, 2000);

    return () => clearTimeout(syncTimeout.current);
  }, [user, sites, activeSiteId, activeEventsMap]);

  // Auth actions exposed to components
  const signIn = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const { session: s } = await signInWithEmail(email, password);
      setSession(s);
      return s;
    } catch (err) {
      setAuthError(err.message || 'Sign in failed.');
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const { user: u, session: s } = await signUpWithEmail(email, password);
      if (s) setSession(s);
      return { user: u, session: s };
    } catch (err) {
      setAuthError(err.message || 'Sign up failed.');
      throw err;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      return await signInWithGoogle();
    } catch (err) {
      setAuthError(err.message || 'Google sign in failed.');
      throw err;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await supaSignOut();
    setSession(null);
    // Keep local data — just disconnect cloud sync
  }, []);

  // ── Local bootstrap ────────────────────────────────────────
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
          setHasSeenWelcome(true);
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

  // Dismiss welcome
  const dismissWelcome = useCallback(async () => {
    setHasSeenWelcome(true);
    await storeSet(WELCOME_KEY, true);
  }, []);

  // Persist sites locally
  const persistSites = useCallback(async (updatedSites) => {
    setSites(updatedSites);
    await storeSet(SITES_KEY, updatedSites);
  }, []);

  // Active site object
  const activeSite = sites.find(s => s.id === activeSiteId) || null;

  // API client
  const getClient = useCallback((site = null) => {
    const s = site || activeSite;
    if (!s) return null;
    return new VCApiClient(s.url, {
      username: s.username,
      appPassword: s.appPassword,
    });
  }, [activeSite]);

  // ── Event Management ───────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setEventsLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, { per_page: 50 });
      setEvents(data);

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

  useEffect(() => {
    if (activeSiteId && sites.length > 0) {
      fetchEvents();
    } else {
      setEvents([]);
    }
  }, [activeSiteId, sites.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeEventId = activeSiteId ? (activeEventsMap[activeSiteId] || null) : null;
  const activeEvent = events.find(e => e.id === activeEventId) || null;

  const setActiveEvent = useCallback(async (eventId) => {
    if (!activeSiteId) return;
    const newMap = { ...activeEventsMap, [activeSiteId]: eventId };
    setActiveEventsMap(newMap);
    await storeSet(ACTIVE_EVENTS_KEY, newMap);
  }, [activeSiteId, activeEventsMap]);

  // ── Site Management ────────────────────────────────────────
  const addSite = useCallback(async ({ url, username, appPassword, registrySlug }) => {
    setError(null);

    let siteUrl = url.trim().replace(/\/+$/, '');
    if (!siteUrl.startsWith('http')) {
      siteUrl = `https://${siteUrl}`;
    }

    const client = new VCApiClient(siteUrl, { username, appPassword });

    try {
      const user = await client.validateAuth();
      const { data: siteInfo } = await client.get('');
      const siteName = decodeHtml(siteInfo?.name) || new URL(siteUrl).hostname;

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

      if (!activeSiteId) {
        setActiveSiteId(newSite.id);
        await storeSet(ACTIVE_SITE_KEY, newSite.id);
      }

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

  const removeSite = useCallback(async (siteId) => {
    const updated = sites.filter(s => s.id !== siteId);
    await persistSites(updated);

    if (activeSiteId === siteId) {
      const newActive = updated.length ? updated[0].id : null;
      setActiveSiteId(newActive);
      await storeSet(ACTIVE_SITE_KEY, newActive);
    }

    const newMap = { ...activeEventsMap };
    delete newMap[siteId];
    setActiveEventsMap(newMap);
    await storeSet(ACTIVE_EVENTS_KEY, newMap);
  }, [sites, activeSiteId, persistSites, activeEventsMap]);

  const switchSite = useCallback(async (siteId) => {
    setActiveSiteId(siteId);
    await storeSet(ACTIVE_SITE_KEY, siteId);
  }, []);

  const updateSiteModules = useCallback(async (siteId, modules) => {
    const updated = sites.map(s =>
      s.id === siteId ? { ...s, modules } : s
    );
    await persistSites(updated);
  }, [sites, persistSites]);

  const hasSites = sites.length > 0;

  return (
    <AuthContext.Provider
      value={{
        // Auth
        user,
        session,
        authError,
        setAuthError,
        signIn,
        signUp,
        signInGoogle,
        signOut: signOutUser,
        isAuthenticated: !!session,
        // Sites
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
        // Events
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
