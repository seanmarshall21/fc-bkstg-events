import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { WP_ENDPOINTS } from '../../api/endpoints';
import { decodeHtml } from '../../utils/helpers';
import { Search, Plus, RefreshCw, Globe, Eye, EyeOff, ChevronRight, Lock } from 'lucide-react';
import ZooEventList from './ZooEventList';

// ── Date helpers ───────────────────────────────────────────────────────────────

/**
 * Extract a 4-digit year from ACF date strings.
 * Handles: "m/d/Y" (04/15/2026), "Ymd" (20260415), "Y-m-d" (2026-04-15)
 */
function extractYear(dateStr) {
  if (!dateStr) return null;
  const mdY = dateStr.match(/^\d{1,2}\/\d{1,2}\/(\d{4})$/);
  if (mdY) return mdY[1];
  if (/^\d{8}$/.test(dateStr)) return dateStr.slice(0, 4);
  const isoY = dateStr.match(/^(\d{4})-\d{2}-\d{2}/);
  if (isoY) return isoY[1];
  return null;
}

/**
 * Group a flat events array into ordered year buckets, newest first.
 * Events without a parseable date land in a null bucket rendered last.
 */
function groupByYear(events) {
  const buckets = {};
  for (const ev of events) {
    const dateStr = ev.acf?.vc_ep_dates?.start_date || null;
    const year = extractYear(dateStr);
    const key = year ?? '__none';
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(ev);
  }
  const sorted = Object.keys(buckets).sort((a, b) => {
    if (a === '__none') return 1;
    if (b === '__none') return -1;
    return b - a; // newest year first
  });
  return sorted.map(year => ({ year, events: buckets[year] }));
}

// ── Icon helper ────────────────────────────────────────────────────────────────

function EventIcon({ icon, size = 44 }) {
  const url = icon?.sizes?.thumbnail || icon?.url;
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-surface-2 flex items-center justify-center border border-surface-3"
      style={{ width: size, height: size }}
    >
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : <Globe className="w-4 h-4 text-gray-300" />
      }
    </div>
  );
}

// ── Event row ──────────────────────────────────────────────────────────────────

function EventRow({ ev, onSelect, onToggleVisibility, toggling }) {
  const displayTitle = ev.acf?.vc_ep_title || ev.title || 'Untitled';
  const season       = ev.acf?.vc_ep_season || '';
  const icon         = ev.acf?.vc_ep_event_icon || null;
  const confidential = !!ev.acf?.vc_ep_confidential;
  const privateVis   = !!ev.acf?.vc_ep_private_visibility;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-surface-1 active:bg-surface-2 transition-colors cursor-pointer group"
      onClick={() => onSelect(ev)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(ev)}
    >
      {/* Event icon */}
      <EventIcon icon={icon} size={44} />

      {/* Title + season */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate">{displayTitle}</span>
          {confidential && (
            <Lock className="w-3 h-3 text-amber-500 shrink-0" title="Confidential" />
          )}
        </div>
        {season && (
          <span className="text-xs text-gray-400 truncate block mt-0.5">{season}</span>
        )}
        {!season && (
          <span className={`text-xs truncate block mt-0.5 ${ev.status === 'publish' ? 'text-emerald-600' : 'text-gray-400'}`}>
            {ev.status === 'publish' ? 'Published' : ev.status || 'Draft'}
          </span>
        )}
      </div>

      {/* Visibility toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggleVisibility(ev); }}
        disabled={toggling === ev.id}
        className={`p-2 rounded-lg transition-colors shrink-0 ${
          toggling === ev.id
            ? 'opacity-40 cursor-not-allowed'
            : confidential
              ? 'text-amber-500 hover:bg-amber-50'
              : 'text-gray-300 hover:text-gray-500 hover:bg-surface-2'
        }`}
        title={confidential ? 'Confidential — tap to make visible' : 'Visible — tap to mark confidential'}
      >
        {confidential
          ? <EyeOff className="w-4 h-4" />
          : <Eye className="w-4 h-4" />
        }
      </button>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 -ml-1" />
    </div>
  );
}

// ── Year section header ────────────────────────────────────────────────────────

function YearHeader({ year }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-2">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {year === '__none' ? 'Undated' : year}
      </span>
      <div className="flex-1 h-px bg-surface-3" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EventList() {
  const { getClient, activeSite, hasSites } = useAuth();
  const navigate = useNavigate();

  if (activeSite?.registrySlug === 'zoo-agency') return <ZooEventList />;

  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [toggling, setToggling] = useState(null); // ev.id currently being toggled

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    const client = getClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.get(WP_ENDPOINTS.events.list, {
        per_page: 100,
        context: 'edit',
        _fields: 'id,title,status,acf,link',
      });
      setEvents(data.map(ev => ({
        ...ev,
        title: decodeHtml(ev.title?.rendered || ev.title?.raw || 'Untitled'),
      })));
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => { fetchEvents(); }, [fetchEvents, activeSite?.id]);

  // ── Visibility toggle ──────────────────────────────────────────────────────

  const handleToggleVisibility = useCallback(async (ev) => {
    const client = getClient();
    if (!client || toggling === ev.id) return;

    const newConfidential = !ev.acf?.vc_ep_confidential;

    // Optimistic update
    setEvents(prev => prev.map(e =>
      e.id === ev.id
        ? { ...e, acf: { ...e.acf, vc_ep_confidential: newConfidential } }
        : e
    ));
    setToggling(ev.id);

    try {
      await client.post(WP_ENDPOINTS.events.single(ev.id), {
        acf: { vc_ep_confidential: newConfidential },
      });
    } catch (err) {
      console.error('Visibility toggle failed:', err);
      // Revert on failure
      setEvents(prev => prev.map(e =>
        e.id === ev.id
          ? { ...e, acf: { ...e.acf, vc_ep_confidential: !newConfidential } }
          : e
      ));
    } finally {
      setToggling(null);
    }
  }, [getClient, toggling]);

  // ── Filter + group ─────────────────────────────────────────────────────────

  const filtered = search
    ? events.filter(ev => {
        const q = search.toLowerCase();
        const title = (ev.acf?.vc_ep_title || ev.title || '').toLowerCase();
        const season = (ev.acf?.vc_ep_season || '').toLowerCase();
        return title.includes(q) || season.includes(q);
      })
    : events;

  const groups = groupByYear(filtered);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!hasSites) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-sm text-gray-400">Connect a site to view events.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col pb-28 animate-fade-in">

      {/* ── Search bar ────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="w-full bg-white border border-surface-3 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-vc-500 focus:ring-2 focus:ring-vc-500/20 transition-colors"
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="w-10 h-10 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => navigate('/events/new')}
          className="w-10 h-10 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
          title="Add event"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Header row ────────────────────────────────────────── */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900">Events</h2>
          <span className="text-base text-gray-400 font-medium">{filtered.length}</span>
        </div>
      </div>

      <div className="mx-4 border-b border-surface-3 mb-1" />

      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-3" />
          <span className="text-sm">Loading events…</span>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {!loading && filtered.length === 0 && !search && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-gray-400">
          <p className="text-base font-bold text-gray-800 mb-1">No Events Added</p>
          <p className="text-sm text-gray-400 mb-5">No event posts yet. Add your first one.</p>
          <button
            onClick={() => navigate('/events/new')}
            className="w-full max-w-sm border-2 border-dashed border-surface-4 rounded-2xl py-4 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add an Event</span>
          </button>
        </div>
      )}

      {/* ── No search matches ─────────────────────────────────── */}
      {!loading && filtered.length === 0 && search && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <p className="text-sm">No matches for "{search}"</p>
        </div>
      )}

      {/* ── Grouped event list ────────────────────────────────── */}
      {groups.map(({ year, events: yearEvents }) => (
        <div key={year}>
          <YearHeader year={year} />
          <div className="divide-y divide-surface-2">
            {yearEvents.map(ev => (
              <EventRow
                key={ev.id}
                ev={ev}
                onSelect={ev => navigate(`/events/${ev.id}`)}
                onToggleVisibility={handleToggleVisibility}
                toggling={toggling}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Add CTA at bottom when list has items ─────────────── */}
      {!loading && filtered.length > 0 && (
        <button
          onClick={() => navigate('/events/new')}
          className="mx-4 mt-4 border-2 border-dashed border-surface-4 rounded-2xl py-4 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add an Event</span>
        </button>
      )}
    </div>
  );
}
