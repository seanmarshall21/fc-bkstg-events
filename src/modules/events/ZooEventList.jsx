import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import { decodeHtml } from '../../utils/helpers';
import { Plus, Search, SlidersHorizontal, Loader2, ChevronRight, MoreVertical } from 'lucide-react';

/**
 * ZooEventList — Zoo Agency-specific event list.
 *
 * Differences from the generic EventList:
 *  - Reads ACF fields: vc_ep_event_icon, vc_ep_title, vc_ep_sub_title, vc_ep_confidential
 *  - Groups events by year (derived from vc_ep_dates.start_date, return_format m/d/Y)
 *  - Per-row Confidential toggle with live WP PATCH
 *  - Year-group header with bulk Confidential toggle
 *
 * ACF sub-field names (short, no vc_ep_ prefix):
 *  vc_ep_dates   → start_date, end_date, tbd.enabled, tbd.text
 *  vc_ep_details → city, state, venue, established, capacity, tags, contacts[].email
 *  vc_ep_media   → logo_horizontal, logo_vertical, images[].image, videos.vimeo_url, videos.mp4_url
 *  vc_ep_social  → website, instagram, facebook, spotify, twitter, tiktok, soundcloud, other
 *  Flat fields   → year (number), brand (select), event_image (image)
 */

// ── Helpers ────────────────────────────────────────────────────

function getEventYear(ev) {
  const dateStr = ev.acf?.vc_ep_dates?.start_date;
  if (!dateStr) return 'TBD';
  // ACF return_format is m/d/Y (e.g. "04/20/2026") — year is last 4 chars
  if (dateStr.includes('/')) return dateStr.slice(-4);
  // Ymd fallback (e.g. "20260420")
  if (dateStr.length >= 4) return dateStr.slice(0, 4);
  return 'TBD';
}

function getEventTitle(ev) {
  return ev.acf?.vc_ep_title || decodeHtml(ev.title?.rendered || ev.title?.raw || 'Untitled');
}

function getEventSeason(ev) {
  return ev.acf?.vc_ep_sub_title || '';
}

function getEventIcon(ev) {
  const icon = ev.acf?.vc_ep_event_icon;
  if (!icon) return null;
  if (typeof icon === 'string') return icon;
  return icon?.sizes?.thumbnail || icon?.url || icon?.source_url || null;
}

function groupByYear(events) {
  const groups = {};
  for (const ev of events) {
    const year = getEventYear(ev);
    if (!groups[year]) groups[year] = [];
    groups[year].push(ev);
  }
  // Sort each group by start_date ascending
  // m/d/Y format sorts correctly after converting to Date
  for (const year of Object.keys(groups)) {
    groups[year].sort((a, b) => {
      const da = a.acf?.vc_ep_dates?.start_date || '';
      const db = b.acf?.vc_ep_dates?.start_date || '';
      return new Date(da) - new Date(db);
    });
  }
  // Return sorted years (numeric ascending, TBD last)
  const years = Object.keys(groups).sort((a, b) => {
    if (a === 'TBD') return 1;
    if (b === 'TBD') return -1;
    return Number(a) - Number(b);
  });
  return years.map(year => ({ year, events: groups[year] }));
}

// ── Confidence toggle pill ─────────────────────────────────────

function ConfidentialToggle({ value, onChange, disabled, size = 'md' }) {
  const isOn = Boolean(value);
  const sizeCls = size === 'sm'
    ? 'w-8 h-[18px]'
    : 'w-10 h-[22px]';
  const thumbSm = size === 'sm'
    ? 'w-[14px] h-[14px] top-[2px]'
    : 'w-[18px] h-[18px] top-[2px]';
  const thumbOff = size === 'sm' ? 'left-[2px]' : 'left-[2px]';
  const thumbOn  = size === 'sm' ? 'left-[20px]' : 'left-[20px]';

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); if (!disabled) onChange(!isOn); }}
      disabled={disabled}
      className={`relative rounded-full transition-colors shrink-0 ${sizeCls} ${
        isOn ? 'bg-[#0f331f]' : 'bg-red-400'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute rounded-full bg-white shadow transition-transform ${thumbSm} ${isOn ? thumbOn : thumbOff}`} />
    </button>
  );
}

// ── Year group header ──────────────────────────────────────────

function YearGroupHeader({ year, events, onBulkToggle, bulkSaving }) {
  const allOn  = events.every(ev => ev.acf?.vc_ep_confidential);
  const anyOn  = events.some(ev => ev.acf?.vc_ep_confidential);
  // Mixed state = not all equal: show as OFF
  const bulkValue = allOn;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#f5f5f5] border-b border-gray-200 sticky top-0 z-10">
      <span className="text-[13px] font-bold text-[#282828] tracking-wide">{year}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#979797] font-medium">Visibility</span>
        <ConfidentialToggle
          value={bulkValue}
          onChange={() => onBulkToggle(year, !bulkValue)}
          disabled={bulkSaving}
          size="sm"
        />
        <button
          type="button"
          className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Event row ──────────────────────────────────────────────────

function EventRow({ ev, onNavigate, onToggleConfidential, toggling }) {
  const title      = getEventTitle(ev);
  const season     = getEventSeason(ev);
  const iconUrl    = getEventIcon(ev);
  const isConfidential = Boolean(ev.acf?.vc_ep_confidential);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors active:bg-gray-100"
      onClick={() => onNavigate(ev.id)}
    >
      {/* Event icon */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </div>

      {/* Title + season */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#282828] truncate">{title}</p>
        {season ? (
          <p className="text-[12px] text-[#979797] truncate">{season}</p>
        ) : (
          <p className="text-[12px] text-[#c0c0c0] truncate">{ev.status}</p>
        )}
      </div>

      {/* Confidential toggle + chevron */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-[#979797] font-medium">Visibility</span>
          {toggling ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <ConfidentialToggle
              value={isConfidential}
              onChange={(val) => onToggleConfidential(ev.id, val)}
            />
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function ZooEventList() {
  const { getClient, activeSite } = useAuth();
  const navigate = useNavigate();

  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [toggling,    setToggling]    = useState({}); // { [eventId]: true }
  const [bulkSaving,  setBulkSaving]  = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, {
        per_page: 100,
        context: 'edit',
      });
      setEvents(data);
    } catch (err) {
      console.error('[ZooEventList] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);

  // ── Toggle single event confidential ──────────────────────
  const handleToggleConfidential = useCallback(async (eventId, value) => {
    const client = getClient();
    if (!client) return;

    // Optimistic update — keep both fields in sync
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, acf: { ...ev.acf, vc_ep_confidential: value, vc_confidential_master: value } }
        : ev
    ));
    setToggling(prev => ({ ...prev, [eventId]: true }));

    try {
      await client.post(WP_ENDPOINTS.events.single(eventId), {
        acf: { vc_ep_confidential: value, vc_confidential_master: value },
      });
    } catch (err) {
      console.error('[ZooEventList] toggle failed:', err);
      // Revert on error
      setEvents(prev => prev.map(ev =>
        ev.id === eventId
          ? { ...ev, acf: { ...ev.acf, vc_ep_confidential: !value, vc_confidential_master: !value } }
          : ev
      ));
    } finally {
      setToggling(prev => { const n = { ...prev }; delete n[eventId]; return n; });
    }
  }, [getClient]);

  // ── Bulk toggle all events in a year ──────────────────────
  const handleBulkToggle = useCallback(async (year, value) => {
    const client = getClient();
    if (!client) return;

    const yearEvents = events.filter(ev => getEventYear(ev) === year);
    if (!yearEvents.length) return;

    // Optimistic update — keep both fields in sync
    setEvents(prev => prev.map(ev =>
      getEventYear(ev) === year
        ? { ...ev, acf: { ...ev.acf, vc_ep_confidential: value, vc_confidential_master: value } }
        : ev
    ));
    setBulkSaving(true);

    try {
      await Promise.all(yearEvents.map(ev =>
        client.post(WP_ENDPOINTS.events.single(ev.id), {
          acf: { vc_ep_confidential: value, vc_confidential_master: value },
        })
      ));
    } catch (err) {
      console.error('[ZooEventList] bulk toggle failed:', err);
      await fetchEvents(); // revert by re-fetching
    } finally {
      setBulkSaving(false);
    }
  }, [getClient, events, fetchEvents]);

  // ── Filter by search ───────────────────────────────────────
  const filtered = search.trim()
    ? events.filter(ev => {
        const q = search.toLowerCase();
        return (
          getEventTitle(ev).toLowerCase().includes(q) ||
          getEventSeason(ev).toLowerCase().includes(q)
        );
      })
    : events;

  const grouped = groupByYear(filtered);

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex-1 flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-[14px] text-[#282828] outline-none placeholder:text-gray-400"
            style={{ fontSize: '16px' }}
            placeholder="Search Events"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          title="Filter"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          title="Add Event"
          onClick={() => navigate('/events/new')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Module header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <img src="/icons/starglobe-dark.svg" alt="" className="w-4 h-4" />
          </div>
          <span className="text-[16px] font-bold text-[#282828]">Events</span>
        </div>
        <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-[14px] font-medium text-gray-500 mb-1">No Events Found</p>
            <p className="text-[13px] text-gray-400">
              {search ? 'Try a different search term.' : 'No event posts exist yet.'}
            </p>
          </div>
        ) : (
          grouped.map(({ year, events: yearEvents }) => (
            <div key={year}>
              <YearGroupHeader
                year={year}
                events={yearEvents}
                onBulkToggle={handleBulkToggle}
                bulkSaving={bulkSaving}
              />
              {yearEvents.map(ev => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  onNavigate={(id) => navigate(`/events/${id}`)}
                  onToggleConfidential={handleToggleConfidential}
                  toggling={Boolean(toggling[ev.id])}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
