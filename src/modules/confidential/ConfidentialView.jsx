import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import EventSelector from '../../components/EventSelector';
import { Loader2, ShieldCheck, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function ConfidentialView() {
  const { getClient, activeEventId } = useAuth();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEventData = useCallback(async () => {
    if (!activeEventId) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.single(activeEventId), { context: 'edit' });
      setEventData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchEventData(); }, [fetchEventData]);

  const phases = eventData?.acf?.vc_announce_phases || [];

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">Confidentiality</h2>
        <button onClick={fetchEventData} disabled={loading} className="vc-btn vc-btn--secondary !px-2.5">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Event context */}
      <div className="mb-4">
        <EventSelector />
      </div>

      {!activeEventId && (
        <div className="text-center py-20 text-gray-500 text-sm">
          Select an event to view confidentiality settings.
        </div>
      )}

      {activeEventId && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {activeEventId && !loading && phases.length > 0 && (
        <div className="space-y-3">
          {phases.map((phase, i) => (
            <div key={i} className="vc-card">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-vc-400" />
                <span className="text-sm font-medium text-gray-200">{phase.vc_phase_label || `Phase ${i + 1}`}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {phase.vc_phase_date && <div>Date: {phase.vc_phase_date}</div>}
                {phase.vc_phase_visibility && (
                  <div className="flex items-center gap-1">
                    {phase.vc_phase_visibility === 'visible'
                      ? <Eye className="w-3 h-3 text-emerald-400" />
                      : phase.vc_phase_visibility === 'hidden'
                        ? <EyeOff className="w-3 h-3 text-red-400" />
                        : <AlertTriangle className="w-3 h-3 text-amber-400" />
                    }
                    <span className="capitalize">{phase.vc_phase_visibility}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeEventId && !loading && phases.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-sm">
          No announce phases configured for this event.
          <br />
          <span className="text-xs text-gray-600">Set these up in WP Admin → Event → Announce Phases</span>
        </div>
      )}
    </div>
  );
}
