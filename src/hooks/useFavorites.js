/**
 * Favorites hook — localStorage-backed favorites system.
 *
 * Favorites are stored per-site as an array of { module, id, name, meta }.
 * This keeps favorites scoped to each WordPress site.
 */

import { useState, useEffect, useCallback } from 'react';
import { storeGet, storeSet } from './useStore';

const FAVORITES_KEY = 'vc_favorites';

export function useFavorites(siteId) {
  const [favorites, setFavorites] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    if (!siteId) return;
    (async () => {
      const all = (await storeGet(FAVORITES_KEY)) || {};
      setFavorites(all[siteId] || []);
      setLoaded(true);
    })();
  }, [siteId]);

  // Persist helper
  const persist = useCallback(async (updated) => {
    if (!siteId) return;
    const all = (await storeGet(FAVORITES_KEY)) || {};
    all[siteId] = updated;
    await storeSet(FAVORITES_KEY, all);
    setFavorites(updated);
  }, [siteId]);

  const isFavorite = useCallback((module, id) => {
    return favorites.some(f => f.module === module && f.id === id);
  }, [favorites]);

  const toggleFavorite = useCallback(async (module, id, name, meta = {}) => {
    const exists = favorites.some(f => f.module === module && f.id === id);
    const updated = exists
      ? favorites.filter(f => !(f.module === module && f.id === id))
      : [...favorites, { module, id, name, meta, addedAt: Date.now() }];
    await persist(updated);
    return !exists; // returns true if added, false if removed
  }, [favorites, persist]);

  const removeFavorite = useCallback(async (module, id) => {
    const updated = favorites.filter(f => !(f.module === module && f.id === id));
    await persist(updated);
  }, [favorites, persist]);

  const clearFavorites = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return {
    favorites,
    loaded,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
