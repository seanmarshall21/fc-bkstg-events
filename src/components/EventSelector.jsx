import { ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useState, useRef, useEffect } from 'react';

/**
 * Dropdown selector for the active event property.
 * Persisted per-site via AuthContext.
 */
export default function EventSelector() {
  const { events, eventsLoading, activeEventId, activeEvent, setActiveEvent } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  if (eventsLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-1 border border-surface-3">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-400">Loading events...</span>
      </div>
    );
  }

  if (events.length === 0) return null;

  // Single event — show it but no dropdown
  if (events.length === 1) {
    const ev = events[0];
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-1 border border-surface-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-orange-600" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-400 leading-none">Active Event</div>
          <div className="text-sm font-medium text-gray-800 truncate">
            {ev.title?.rendered || ev.title}
          </div>
        </div>
      </div>
    );
  }

  // Multiple events — dropdown
  const eventTitle = activeEvent
    ? (activeEvent.title?.rendered || activeEvent.title)
    : 'Select Event';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-1 border border-surface-3 hover:border-vc-400 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs text-gray-400 leading-none">Active Event</div>
          <div className="text-sm font-medium text-gray-800 truncate">
            {eventTitle}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-surface-3 rounded-xl overflow-hidden shadow-xl shadow-black/10">
          {events.map((ev) => {
            const title = ev.title?.rendered || ev.title;
            const isActive = ev.id === activeEventId;

            return (
              <button
                key={ev.id}
                onClick={() => {
                  setActiveEvent(ev.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'bg-vc-50 text-vc-700'
                    : 'hover:bg-surface-1 text-gray-700'
                }`}
              >
                <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-vc-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium truncate">{title}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-vc-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
