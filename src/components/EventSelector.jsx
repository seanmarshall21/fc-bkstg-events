import { ChevronDown, Calendar, Loader2, Wrench } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useState, useRef, useEffect } from 'react';

const PHASE_LABELS = {
  'planning':        'Planning',
  'save-the-date':   'Save the Date',
  'lineup-phase-1':  'Lineup Ph.1',
  'presale':         'Presale',
  'onsale':          'On Sale',
  'lineup-phase-2':  'Lineup Ph.2',
  'set-times-live':  'Set Times',
  'event-day':       'Event Day',
  'post-event':      'Post Event',
  'archived':        'Archived',
};

const PHASE_ORDER = Object.keys(PHASE_LABELS);

function phaseBadgeClass(phase) {
  const idx = PHASE_ORDER.indexOf(phase);
  if (idx <= 1) return 'bg-gray-100 text-gray-500';
  if (idx <= 4) return 'bg-purple-100 text-purple-700';
  if (idx <= 6) return 'bg-blue-100 text-blue-700';
  if (idx === 7) return 'bg-green-100 text-green-700';
  if (idx === 8) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-200 text-gray-400';
}

/**
 * EventSelector — Dropdown for the active event on a site dashboard.
 * Reads from AuthContext: events, eventsLoading, activeEventId, activeEvent, setActiveEvent.
 * Planning mode toggle filters to planning-phase events only.
 */
export default function EventSelector() {
  const { events, eventsLoading, activeEventId, activeEvent, setActiveEvent } = useAuth();
  const [open, setOpen] = useState(false);
  const [planningMode, setPlanningMode] = useState(false);
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

  if (!events || events.length === 0) return null;

  // Filter by planning mode
  const visibleEvents = planningMode
    ? events.filter(ev => (ev.event_phase || ev.acf?.event_phase) === 'planning')
    : events.filter(ev => (ev.event_phase || ev.acf?.event_phase) !== 'archived');

  const displayEvents = visibleEvents.length > 0 ? visibleEvents : events;

  const currentPhase = activeEvent?.event_phase || activeEvent?.acf?.event_phase || null;
  const eventTitle = activeEvent
    ? (activeEvent.title?.rendered || activeEvent.title)
    : 'Select Event';

  // Single event with no dropdown needed
  if (displayEvents.length === 1 && !planningMode) {
    const ev = displayEvents[0];
    const phase = ev.event_phase || ev.acf?.event_phase;
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-1 border border-surface-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 leading-none">Active Event</div>
          <div className="text-sm font-medium text-gray-800 truncate">
            {ev.title?.rendered || ev.title}
          </div>
        </div>
        {phase && (
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${phaseBadgeClass(phase)}`}>
            {PHASE_LABELS[phase] || phase}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Planning mode toggle */}
      <button
        onClick={() => setPlanningMode(m => !m)}
        title={planningMode ? 'Viewing planning events — click to switch to active' : 'Switch to planning mode'}
        className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
          planningMode
            ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300'
            : 'bg-surface-1 text-gray-400 border border-surface-3 hover:text-gray-600'
        }`}
      >
        <Wrench className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      <div ref={ref} className="relative flex-1">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-1 border border-surface-3 hover:border-vc-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs text-gray-400 leading-none">
              {planningMode ? 'Planning Event' : 'Active Event'}
            </div>
            <div className="text-sm font-medium text-gray-800 truncate">{eventTitle}</div>
          </div>
          {currentPhase && (
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${phaseBadgeClass(currentPhase)}`}>
              {PHASE_LABELS[currentPhase] || currentPhase}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-surface-3 rounded-xl overflow-hidden shadow-xl shadow-black/10">
            {displayEvents.map((ev) => {
              const title = ev.title?.rendered || ev.title;
              const isActive = ev.id === activeEventId;
              const phase = ev.event_phase || ev.acf?.event_phase;

              return (
                <button
                  key={ev.id}
                  onClick={() => { setActiveEvent(ev.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-vc-50 text-vc-700' : 'hover:bg-surface-1 text-gray-700'
                  }`}
                >
                  <Calendar className={`w-4 h-4 shrink-0 ${isActive ? 'text-vc-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium truncate flex-1">{title}</span>
                  {phase && (
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full shrink-0 ${phaseBadgeClass(phase)}`}>
                      {PHASE_LABELS[phase] || phase}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-vc-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
