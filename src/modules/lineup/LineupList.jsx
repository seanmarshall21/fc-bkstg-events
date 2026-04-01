import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { VC_ENDPOINTS } from '../../api/endpoints';
import EventSelector from '../../components/EventSelector';
import { Clock, Music, RefreshCw, Search } from 'lucide-react';

/**
 * Lineup view with day tabs and color-coded stage sections.
 * Matches the Figma design with SAT/SUN tabs and stage groupings.
 */

const STAGE_COLORS = [
  { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', border: 'border-purple-200' },
  { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200' },
  { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200' },
  { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-50', border: 'border-rose-200' },
  { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-50', border: 'border-cyan-200' },
];

export default function LineupList() {
  const { getClient, activeSite, activeEventId, hasSites } = useAuth();
  const navigate = useNavigate();
  const [lineup, setLineup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  const [search, setSearch] = useState('');

  const fetchLineup = useCallback(async () => {
    if (!activeEventId) return;
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(VC_ENDPOINTS.lineup.full, {
        event_id: activeEventId,
      });
      setLineup(data);
      setActiveDay(0);
    } catch (err) {
      console.error('Failed to fetch lineup:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient, activeEventId]);

  useEffect(() => { fetchLineup(); }, [fetchLineup]);

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view lineups.</p>
      </div>
    );
  }

  const billingLabel = (billing) => {
    const map = {
      headline: { cls: 'vc-badge--amber', label: 'Headliner' },
      'sub-head': { cls: 'vc-badge--blue', label: 'Sub-Head' },
      support: { cls: 'vc-badge--gray', label: 'Support' },
      special: { cls: 'vc-badge--green', label: 'Special' },
    };
    const b = map[billing] || null;
    return b ? <span className={`vc-badge ${b.cls} text-[10px]`}>{b.label}</span> : null;
  };

  const currentDay = lineup[activeDay] || null;

  // Filter slots by search
  const filterSlots = (slots) => {
    if (!search) return slots;
    return slots?.filter(slot =>
      (slot.artist?.name || '').toLowerCase().includes(search.toLowerCase())
    ) || [];
  };

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Event context */}
      <div className="mb-4">
        <EventSelector />
      </div>

      {!activeEventId && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Select an event to view the lineup.
        </div>
      )}

      {activeEventId && loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {activeEventId && !loading && lineup.length === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">
          No lineup data for this event.
        </div>
      )}

      {activeEventId && !loading && lineup.length > 0 && (
        <>
          {/* Day Tabs */}
          <div className="flex gap-2 mb-4">
            {lineup.map((day, i) => {
              const isActive = i === activeDay;
              // Format day label like "SAT MAR 7"
              const label = day.label || `Day ${i + 1}`;
              return (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`flex-1 py-2 px-3 rounded-xl text-center text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-vc-700 text-white shadow-md shadow-vc-700/20'
                      : 'bg-surface-2 text-gray-500 hover:bg-surface-3'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="vc-input pl-9"
              placeholder="Search artists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Refresh */}
          <div className="flex justify-end mb-3">
            <button
              onClick={fetchLineup}
              className="vc-btn vc-btn--ghost !px-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Stage Sections */}
          {currentDay?.stages?.map((stage, si) => {
            const colors = STAGE_COLORS[si % STAGE_COLORS.length];
            const filteredSlots = filterSlots(stage.slots);
            if (search && filteredSlots.length === 0) return null;

            return (
              <div key={si} className={`mb-4 rounded-2xl border ${colors.border} overflow-hidden`}>
                {/* Stage Header */}
                <div className={`${colors.bg} px-4 py-2.5 flex items-center gap-2`}>
                  <span className="text-sm font-bold text-white">{stage.name}</span>
                  <span className="text-xs text-white/70">{filteredSlots.length} sets</span>
                </div>

                {/* Slots */}
                <div className={`${colors.light}`}>
                  {filteredSlots.map((slot, slotIdx) => (
                    <button
                      key={slot.id || slotIdx}
                      onClick={() => navigate(`/lineup/${slot.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/60 transition-colors border-b border-white/50 last:border-b-0"
                    >
                      {slot.artist?.photo ? (
                        <img src={slot.artist.photo} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/60 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {slot.artist?.name || (slot.is_secret ? 'Secret Guest' : `Slot #${slot.id}`)}
                          </span>
                          {billingLabel(slot.billing)}
                          {slot.is_secret && <span className="vc-badge vc-badge--red text-[10px]">Secret</span>}
                        </div>
                        {slot.start_time && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{slot.start_time}{slot.end_time ? ` \u2013 ${slot.end_time}` : ''}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
