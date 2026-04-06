import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * useServiceWorkerUpdate
 *
 * Registers the app's service worker and exposes update state.
 * - hasUpdate: true when a new SW is installed and waiting
 * - applyUpdate(): tells the waiting SW to skipWaiting, then reloads once it activates
 * - dismissUpdate(): hides the toast until the next update is detected
 *
 * Assumes the SW file is served at /sw.js (Netlify default). Override via scriptURL.
 */
export default function useServiceWorkerUpdate(scriptURL = '/sw.js') {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const waitingWorkerRef = useRef(null);
  const registrationRef = useRef(null);
  const reloadingRef = useRef(false);

  // Promote a waiting worker into state
  const promoteWaiting = useCallback((worker) => {
    if (!worker) return;
    waitingWorkerRef.current = worker;
    setHasUpdate(true);
    setDismissed(false);
  }, []);

  // Watch an installing worker and promote when it reaches "installed"
  const trackInstalling = useCallback(
    (worker) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          promoteWaiting(worker);
        }
      });
    },
    [promoteWaiting]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register(scriptURL)
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;

        // Already a waiting worker (e.g. tab opened while update pending)
        if (registration.waiting && navigator.serviceWorker.controller) {
          promoteWaiting(registration.waiting);
        }

        // A new worker is being installed right now
        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        // Future updates
        registration.addEventListener('updatefound', () => {
          trackInstalling(registration.installing);
        });
      })
      .catch((err) => {
        // Fail silently in prod; log in dev
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[SW] registration failed:', err);
        }
      });

    // When the new SW takes control, reload once
    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Periodically check for updates while tab is open (every 60 min)
    const checkInterval = setInterval(() => {
      registrationRef.current?.update?.().catch(() => {});
    }, 60 * 60 * 1000);

    // Also check on tab visibility
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        registrationRef.current?.update?.().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', onVisibility);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [scriptURL, promoteWaiting, trackInstalling]);

  const applyUpdate = useCallback(() => {
    const worker = waitingWorkerRef.current || registrationRef.current?.waiting;
    if (!worker) {
      // Fallback: force a reload if we somehow lost the reference
      window.location.reload();
      return;
    }
    // Ask the new SW to activate. controllerchange listener will reload.
    worker.postMessage({ type: 'SKIP_WAITING' });
    // Some SW builds use skipWaiting() in message handler; this covers both.
  }, []);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    hasUpdate: hasUpdate && !dismissed,
    applyUpdate,
    dismissUpdate,
  };
}
