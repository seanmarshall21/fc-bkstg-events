import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import EventSelector from '../../components/EventSelector';
import {
  Loader2, RefreshCw, ShieldCheck, ShieldOff, Eye, EyeOff,
  AlertTriangle, CheckCircle2, Circle, ChevronRight, CalendarDays,
} from 'lucide-react';

// ── Status config for announce phase rows ──────────────────────
const PHASE_STATUS = {
  confidential: {
    label: 'Confidential',
    icon: EyeOff,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  teaser: {
    label: 'Teaser',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  live: {
    label: 'Live',
    icon: Eye,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
};

const STATUS_CYCLE = ['confidential', 'teaser', 'live'];

// ── Confirm sheet ──────────────────────────────────────────────
function ConfirmSheet({ phase, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-6 pb-16 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm text-gray-500 mb-1">Activate phase</p>
        <p className="text-lg font-bold text-gray-900 mb-1">{phase.label}</p>
        <p className="text-sm text-gray-500 mb-6">{phase.description}</p>
        {phase.makes_public?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-xs font-semibold text-amber-700 mb-1">Makes public:</p>
            <ul className="text-xs text-amber-600 space-y-0.5">
              {phase.makes_public.map((item, i) => (
                <li key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-vc-600 text-white text-sm font-semibold"
          >
            Activate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────
export default function ConfidentialView() {
  const { getClient, activeEventId, events, hasSites } = useAuth();

  const [eventData, setEventData]       = useState(null);
  const [phaseMeta, setPhaseMeta]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [confirmPhase, setConfirmPhase] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchEvent = useCallback(async () => {
    if (!activeEventId) { setEventData(null); setPhaseMeta(null); return; }
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(
        WP_ENDPOINTS.events.single(activeEventId),
        { context: 'edit' }
      );
      setEventData(data);
      setPhaseMeta(data.event_phase_meta || null);
    } catch (err) {
      console.error('ConfidentialView fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // ── Save helper ──────────────────────────────────────────────
  const saveField = useCallback(async (payload) => {
    const client = getClient();
    if (!client) return;
    setSaving(true);
    try {
      const { data } = await client.post(
        WP_ENDPOINTS.events.single(activeEventId),
        payload
      );
      setEventData(data);
      setPhaseMeta(data.event_phase_meta || phaseMeta);
    } catch (err) {
      console.error('ConfidentialView save error:', err);
    } finally {
      setSaving(false);
    }
  }, [getClient, activeEventId, phaseMeta]);

  // ── Phase activation ─────────────────────────────────────────
  const activatePhase = useCallback(async (phaseKey) => {
    setConfirmPhase(null);
    await saveField({ event_phase: phaseKey });
  }, [saveField]);

  // ── Master toggle ────────────────────────────────────────────
  const toggleMaster = useCallback(() => {
    const current = eventData?.acf?.vc_confidential_master;
    // Write both fields to keep vc_ep_confidential (per-post ACF) in sync with
    // vc_confidential_master (announce phases / PHP engine field)
    saveField({ acf: { vc_confidential_master: !current, vc_ep_confidential: !current } });
  }, [saveField, eventData]);

  // ── Announce phase status cycle ───────────────────────────────
  const cycleAnnounceStatus = useCallback((index) => {
    const phases = [...(eventData?.acf?.vc_announce_phases || [])];
    const current = phases[index]?.status || 'confidential';
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    phases[index] = { ...phases[index], status: STATUS_CYCLE[nextIdx] };
    saveField({ acf: { vc_announce_phases: phases } });
  }, [saveField, eventData]);

  // ── Guards ───────────────────────────────────────────────────
  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to manage confidentiality.</p>
      </div>
    );
  }

  const masterOn       = eventData?.acf?.vc_confidential_master;
  const currentKey     = phaseMeta?.key || eventData?.event_phase || 'planning';
  const currentIdx     = phaseMeta?.phase_index ?? 0;
  const allPhases      = phaseMeta?.available_phases
    ? Object.entries(phaseMeta.available_phases).map(([key, val]) => ({ key, ...val }))
    : [];
  const announcePhases = eventData?.acf?.vc_announce_phases || [];

  return (
    <>
      {confirmPhase && (
        <ConfirmSheet
          phase={confirmPhase}
          onConfirm={() => activatePhase(confirmPhase.key)}
          onCancel={() => setConfirmPhase(null)}
        />
      )}

      <div className="p-4 pb-24 animate-fade-in space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Confidentiality</h2>
          <button
            onClick={fetchEvent}
            disabled={loading || saving}
            className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || saving) ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {events.length > 0 && <EventSelector />}

        {loading && !eventData && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {!loading && !activeEventId && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm text-center">Select an event to manage confidentiality settings.</p>
          </div>
        )}

        {activeEventId && eventData && (
          <>
            {/* ── Master confidential toggle ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {masterOn
                    ? <ShieldCheck className="w-5 h-5 text-red-500" />
                    : <ShieldOff className="w-5 h-5 text-emerald-500" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {masterOn ? 'Event Confidential' : 'Event Live'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {masterOn
                        ? 'Public site shows confidential placeholders'
                        : 'Phase visibility rules are active'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleMaster}
                  disabled={saving}
                  className={`relative w-12 h-6 rounded-full transition-colors ${masterOn ? 'bg-red-500' : 'bg-emerald-500'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${masterOn ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* ── Current phase card ── */}
            {phaseMeta && (
              <div className="bg-vc-600 rounded-xl p-4 text-white">
                <p className="text-xs font-semibold text-vc-200 uppercase tracking-wider mb-1">
                  Current Phase {currentIdx + 1} of {phaseMeta.total_phases}
                </p>
                <p className="text-xl font-bold mb-1">{phaseMeta.label}</p>
                <p className="text-sm text-vc-100 mb-3">{phaseMeta.description}</p>
                {phaseMeta.changed_at && (
                  <p className="text-xs text-vc-200 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Activated {new Date(phaseMeta.changed_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                )}
                {phaseMeta.makes_public?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {phaseMeta.makes_public.map((item, i) => (
                      <span key={i} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phase timeline ── */}
            {allPhases.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Phase Timeline</p>
                  <p className="text-xs text-gray-400">Tap any phase to manually activate it</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {allPhases.map((phase, i) => {
                    const isCurrent = phase.key === currentKey;
                    const isPast    = i < currentIdx;
                    const isFuture  = i > currentIdx;
                    return (
                      <button
                        key={phase.key}
                        onClick={() => !isCurrent && setConfirmPhase(phase)}
                        disabled={isCurrent || saving}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors
                          ${isCurrent ? 'bg-vc-50' : 'hover:bg-gray-50 active:bg-gray-100'}
                          ${saving ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isCurrent
                            ? <CheckCircle2 className="w-4 h-4 text-vc-600" />
                            : isPast
                              ? <CheckCircle2 className="w-4 h-4 text-gray-300" />
                              : <Circle className="w-4 h-4 text-gray-200" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${isCurrent ? 'text-vc-700' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                              {phase.label}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-vc-100 text-vc-700 px-2 py-0.5 rounded-full font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          {phase.description && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{phase.description}</p>
                          )}
                          {phase.makes_public?.length > 0 && isCurrent && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {phase.makes_public.map((item, j) => (
                                <span key={j} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isFuture && <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Announce phases (ACF repeater) ── */}
            {announcePhases.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Announce Phases</p>
                  <p className="text-xs text-gray-400">Tap status badge to cycle: Confidential → Teaser → Live</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {announcePhases.map((phase, i) => {
                    const status = phase.status || 'confidential';
                    const cfg    = PHASE_STATUS[status] || PHASE_STATUS.confidential;
                    const Icon   = cfg.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{phase.label || `Phase ${i + 1}`}</p>
                          {phase.target_date && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <CalendarDays className="w-3 h-3" />
                              {phase.target_date}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => cycleAnnounceStatus(i)}
                          disabled={saving}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${cfg.bg} ${cfg.border} ${cfg.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty announce phases */}
            {announcePhases.length === 0 && allPhases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <p className="text-sm">No phase data found for this event.</p>
                <p className="text-xs mt-1">Configure announce phases in WP Admin → Events.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
