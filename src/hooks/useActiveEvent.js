import { useCallback, useEffect, useState } from 'react';

/**
 * useActiveEvent
 *
 * Per-site active event state + planning-mode toggle, persisted to
 * localStorage so the user's last selection sticks across sessions.
 *
 * Storage keys (universal, site-scoped):
 *   vc:{siteKey}:activeEventId       -> number
 *   vc:{siteKey}:planningMode        -> 'true' | 'false'
 *
 * Returns:
 *   activeEventId, setActiveEventId
 *   planningMode,  setPlanningMode, togglePlanningMode
 *   clearActiveEvent()      -> removes the stored id
 */
export function useActiveEvent(siteKey) {

  const eventKey    = `vc:${siteKey}:activeEventId`;
  const planningKey = `vc:${siteKey}:planningMode`;

  const [activeEventId, setActiveEventIdState] = useState(() => {
    try {
      const raw = localStorage.getItem(eventKey);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  });

  const [planningMode, setPlanningModeState] = useState(() => {
    try {
      return localStorage.getItem(planningKey) === 'true';
    } catch {
      return false;
    }
  });

  // Persist active event id.
  useEffect(() => {
    try {
      if (activeEventId == null) {
        localStorage.removeItem(eventKey);
      } else {
        localStorage.setItem(eventKey, String(activeEventId));
      }
    } catch { /* ignore quota errors */ }
  }, [activeEventId, eventKey]);

  // Persist planning mode.
  useEffect(() => {
    try {
      localStorage.setItem(planningKey, planningMode ? 'true' : 'false');
    } catch { /* ignore quota errors */ }
  }, [planningMode, planningKey]);

  // When planning mode flips, clear the active event id so EventSelector
  // picks a fresh default from the new scope.
  const setPlanningMode = useCallback((next) => {
    setPlanningModeState(next);
    setActiveEventIdState(null);
  }, []);

  const togglePlanningMode = useCallback(() => {
    setPlanningMode(!planningMode);
  }, [planningMode, setPlanningMode]);

  const setActiveEventId = useCallback((id) => {
    setActiveEventIdState(id == null ? null : parseInt(id, 10));
  }, []);

  const clearActiveEvent = useCallback(() => {
    setActiveEventIdState(null);
  }, []);

  return {
    activeEventId,
    setActiveEventId,
    clearActiveEvent,
    planningMode,
    setPlanningMode,
    togglePlanningMode,
  };
}
