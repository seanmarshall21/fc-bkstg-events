import React from 'react';
import useServiceWorkerUpdate from '../hooks/useServiceWorkerUpdate';

/**
 * UpdateToast
 *
 * Bottom-anchored toast notifying the user a new PWA version is ready.
 * - Sits above the bottom nav (z-40) and below modals (which should be z-50+).
 * - Tailwind core utilities only.
 * - Inline keyframes for slide-up so no tailwind.config changes are needed.
 */
export default function UpdateToast() {
  const { hasUpdate, applyUpdate, dismissUpdate } = useServiceWorkerUpdate();

  if (!hasUpdate) return null;

  return (
    <>
      <style>{`
        @keyframes vc-toast-slide-up {
          from { transform: translate(-50%, 120%); opacity: 0; }
          to   { transform: translate(-50%, 0);     opacity: 1; }
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        className="fixed left-1/2 bottom-20 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/5"
        style={{
          animation: 'vc-toast-slide-up 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b21e8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 4 21 10 15 10" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">New version available</p>
            <p className="truncate text-xs text-gray-500">Reload to get the latest updates.</p>
          </div>

          <button
            type="button"
            onClick={applyUpdate}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: '#6b21e8' }}
          >
            Update
          </button>

          <button
            type="button"
            onClick={dismissUpdate}
            aria-label="Dismiss update notification"
            className="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
