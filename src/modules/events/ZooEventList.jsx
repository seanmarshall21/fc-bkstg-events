import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import { decodeHtml } from '../../utils/helpers';
import { Plus, Search, Loader2, ChevronRight, MoreVertical } from 'lucide-react';

/**
 * ZooEventList — Zoo Agency-specific event list.
 *
 * Differences from the generic EventList:
 *  - Reads ACF fields: vc_ep_event_icon, vc_ep_title, vc_ep_sub_title,
 *    vc_ep_confidential, vc_ep_private_visibility, vc_ep_event_venue
 *  - Groups events by year (derived from vc_ep_dates.start_date)
 *  - Sort within each year group: Start Date, Venue, Confidential, Private
 *  - Title shows WP post title (includes year/season designation)
 *  - Per-row Confidential toggle with live WP PATCH
 *  - Year-group header with bulk Confidential toggle
 */

// ── Sort options ───────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'date',         label: 'Start Date' },
  { key: 'venue',        label: 'Venue'      },
  { key: 'confidential', label: 'Confidential' },
  { key: 'private',      label: 'Private'    },
];

// ── Helpers ────────────────────────────────────────────────────

function getEventYear(ev) {
  const dateStr = ev.acf?.vc_ep_dates?.start_date;
  if (!dateStr) return 'TBD';
  if (dateStr.includes('/')) return dateStr.slice(-4);    // m/d/Y → last 4
  if (dateStr.length >= 4)   return dateStr.slice(0, 4);  // Ymd → first 4
  return 'TBD';
}

// Use WP post title (includes year/season) — vc_ep_title as fallback
function getEventTitle(ev) {
  return decodeHtml(ev.title?.rendered || ev.title?.raw || ev.acf?.vc_ep_title || 'Untitled');
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

function getEventVenue(ev) {
  return ev.acf?.vc_ep_event_venue || '';
}

function getStartDateMs(ev) {
  const raw = ev.acf?.vc_ep_dates?.start_date || '';
  if (!raw) return Infinity;
  return new Date(raw).getTime() || Infinity;
}

// Sorts events within each year group based on the chosen dimension.
// Year groups themselves always appear newest → oldest.
function sortEvents(events, sortBy) {
  const sorted = [...events];
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => getStartDateMs(a) - getStartDateMs(b));
    case 'venue':
      return sorted.sort((a, b) => {
        const va = getEventVenue(a).toLowerCase();
        const vb = getEventVenue(b).toLowerCase();
        if (!va && !vb) return getStartDateMs(a) - getStartDateMs(b);
        if (!va) return 1;
        if (!vb) return -1;
        return va.localeCompare(vb);
      });
    case 'confidential':
      return sorted.sort((a, b) => {
        const ca = Boolean(a.acf?.vc_ep_confidential) ? 0 : 1;
        const cb = Boolean(b.acf?.vc_ep_confidential) ? 0 : 1;
        return ca - cb || getStartDateMs(a) - getStartDateMs(b);
      });
    case 'private':
      return sorted.sort((a, b) => {
        const pa = Boolean(a.acf?.vc_ep_private_visibility) ? 0 : 1;
        const pb = Boolean(b.acf?.vc_ep_private_visibility) ? 0 : 1;
        return pa - pb || getStartDateMs(a) - getStartDateMs(b);
      });
    default:
      return sorted;
  }
}

function groupByYear(events, sortBy) {
  const groups = {};
  for (const ev of events) {
    const year = getEventYear(ev);
    if (!groups[year]) groups[year] = [];
    groups[year].push(ev);
  }
  // Sort within each group
  for (const year of Object.keys(groups)) {
    groups[year] = sortEvents(groups[year], sortBy);
  }
  // Year groups: newest first (descending), TBD last
  const years = Object.keys(groups).sort((a, b) => {
    if (a === 'TBD') return 1;
    if (b === 'TBD') return -1;
    return Number(b) - Number(a); // descending
  });
  return years.map(year => ({ year, events: groups[year] }));
}

// ── Confidence toggle pill ─────────────────────────────────────

function ConfidentialToggle({ value, onChange, disabled, size = 'md' }) {
  const isOn = Boolean(value);
  const sizeCls  = size === 'sm' ? 'w-8 h-[18px]'   : 'w-10 h-[22px]';
  const thumbSm  = size === 'sm' ? 'w-[14px] h-[14px] top-[2px]' : 'w-[18px] h-[18px] top-[2px]';
  const thumbOff = size === 'sm' ? 'left-[2px]'  : 'left-[2px]';
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
  const allOn    = events.every(ev => ev.acf?.vc_ep_confidential);
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

function EventRow({ ev, sortBy, onNavigate, onToggleConfidential, toggling }) {
  const title           = getEventTitle(ev);
  const season          = getEventSeason(ev);
  const iconUrl         = getEventIcon(ev);
  const isConfidential  = Boolean(ev.acf?.vc_ep_confidential);
  const isPrivate       = Boolean(ev.acf?.vc_ep_private_visibility);
  const venue           = getEventVenue(ev);

  // Sub-row: show context relevant to current sort
  let subLabel = '';
  if (sortBy === 'venue' && venue) {
    subLabel = venue;
  } else if (sortBy === 'confidential') {
    subLabel = isConfidential ? 'Confidential' : 'Visible';
  } else if (sortBy === 'private') {
    subLabel = isPrivate ? 'Private' : 'Public';
  } else {
    subLabel = season || ev.status || '';
  }

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

      {/* Title + context sub-label */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#282828] truncate">{title}</p>
        <p className={`text-[12px] truncate ${subLabel ? 'text-[#979797]' : 'text-[#c0c0c0]'}`}>
          {subLabel || '—'}
        </p>
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

// ── Sort bar ───────────────────────────────────────────────────

function SortBar({ sortBy, onChange }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
      <span className="text-[11px] text-[#979797] font-medium shrink-0 mr-0.5">Sort:</span>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
            sortBy === opt.key
              ? 'bg-[#282828] text-white'
              : 'bg-[#f0f0f0] text-[#555] hover:bg-[#e4e4e4]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function ZooEventList() {
  const { getClient, activeSite } = useAuth();
  const navigate = useNavigate();

  const [events,     setEvents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sortBy,     setSortBy]     = useState('date');
  const [toggling,   setToggling]   = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

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
      await fetchEvents();
    } finally {
      setBulkSaving(false);
    }
  }, [getClient, events, fetchEvents]);

  // ── Filter + group ─────────────────────────────────────────
  const filtered = search.trim()
    ? events.filter(ev => {
        const q = search.toLowerCase();
        return (
          getEventTitle(ev).toLowerCase().includes(q) ||
          getEventSeason(ev).toLowerCase().includes(q) ||
          getEventVenue(ev).toLowerCase().includes(q)
        );
      })
    : events;

  const grouped = groupByYear(filtered, sortBy);

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
          title="Add Event"
          onClick={() => navigate('/events/new')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Sort bar */}
      <SortBar sortBy={sortBy} onChange={setSortBy} />

      {/* Module header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <img src="/icons/starglobe-dark.svg" alt="" className="w-4 h-4" />
          </div>
          <span className="text-[16px] font-bold text-[#282828]">Events</span>
          <span className="text-[13px] text-[#979797]">({filtered.length})</span>
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
                  sortBy={sortBy}
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
