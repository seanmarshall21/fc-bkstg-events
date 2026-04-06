import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import EventSelector from '../../components/EventSelector';
import { Loader2, ShieldCheck, RefreshCw, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function ConfidentialView() {
  const { getClient, activeEventId, events, hasSites } = useAuth();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEventData = useCallback(async () => {
    if (!activeEventId) { setEventData(null); return; }
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

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view confidentiality settings.</p>
      </div>
    );
  }

  const phases = eventData?.acf?.vc_announce_phases || [];

  return (
    <div className="p-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Confidentiality</h2>
        <button onClick={fetchEventData} disabled={loading} className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="border-b border-surface-3 mb-4" />

      {events.length > 0 && (
        <div className="mb-4">
          <EventSelector />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && phases.length > 0 && (
        <div className="space-y-3">
          {phases.map((phase, i) => (
            <div key={i} className="vc-card">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-vc-600" />
                <span className="text-sm font-medium text-gray-800">{phase.vc_phase_label || `Phase ${i + 1}`}</span>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {phase.vc_phase_date && <div>Date: {phase.vc_phase_date}</div>}
                {phase.vc_phase_visibility && (
                  <div className="flex items-center gap-1">
                    {phase.vc_phase_visibility === 'visible'
                      ? <Eye className="w-3 h-3 text-emerald-500" />
                      : phase.vc_phase_visibility === 'hidden'
                        ? <EyeOff className="w-3 h-3 text-red-500" />
                        : <AlertTriangle className="w-3 h-3 text-amber-500" />
                    }
                    <span className="capitalize">{phase.vc_phase_visibility}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && phases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-base font-bold text-gray-800 mb-1">No Announce Phases</p>
          <p className="text-sm text-gray-400 text-center">
            {activeEventId
              ? 'No announce phases configured for this event.'
              : events.length > 0
                ? 'Select an event above to view its confidentiality settings.'
                : 'This site has no events configured. Add an event first.'}
          </p>
        </div>
      )}
    </div>
  );
}
