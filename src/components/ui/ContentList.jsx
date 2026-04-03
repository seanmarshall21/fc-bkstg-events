import { useState } from 'react';
import { Search, Plus, RefreshCw, ChevronRight, SlidersHorizontal } from 'lucide-react';

/**
 * Reusable content list shell.
 * Handles search, empty state, loading, and item rendering.
 * Matches Figma: search bar with filter + add icons, dashed Add CTA.
 */
export default function ContentList({
  title,
  count,
  items = [],
  loading = false,
  searchable = true,
  onRefresh,
  onAdd,
  onSelect,
  renderItem,
  searchKeys = ['title'],
  emptyMessage = 'No items found',
  emptySubtext = '',
  addLabel = 'Add New',
  moduleIcon,
}) {
  const [search, setSearch] = useState('');

  // Client-side filter
  const filtered = search
    ? items.filter(item =>
        searchKeys.some(key => {
          const val = typeof key === 'function' ? key(item) : item[key];
          return val && val.toLowerCase().includes(search.toLowerCase());
        })
      )
    : items;

  const displayCount = count ?? items.length;

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Search bar row: input + filter icon + add icon */}
      {searchable && (
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full bg-white border border-surface-3 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-vc-500 focus:ring-2 focus:ring-vc-500/20 transition-colors"
              placeholder={`Search ${title}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="w-10 h-10 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {onAdd && (
            <button
              onClick={onAdd}
              className="w-10 h-10 rounded-xl border border-surface-3 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Title row with icon + count + refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {moduleIcon && (
            <img src={moduleIcon} alt="" className="w-8 h-8" />
          )}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className="text-base text-gray-400 font-medium">
            {search ? filtered.length : displayCount}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="border-b border-surface-3 mb-3" />

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-3" />
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && !search && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-base font-bold text-gray-800 mb-1">
            No {title} Added
          </p>
          <p className="text-sm text-gray-400 mb-5">
            {emptySubtext || `There are no ${title.toLowerCase()} posts yet. Add your first one.`}
          </p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="w-full max-w-sm border-2 border-dashed border-surface-4 rounded-2xl py-4 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{addLabel}</span>
            </button>
          )}
        </div>
      )}

      {/* No search matches */}
      {!loading && filtered.length === 0 && search && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p className="text-sm">No matches found</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {filtered.map((item, i) => (
          <button
            key={item.id || i}
            onClick={() => onSelect?.(item)}
            className="w-full vc-card flex items-center gap-3 hover:border-vc-300 transition-colors text-left group"
          >
            <div className="flex-1 min-w-0">
              {renderItem(item)}
            </div>
            {onSelect && (
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Add CTA at bottom of list (when items exist) */}
      {!loading && filtered.length > 0 && onAdd && (
        <button
          onClick={onAdd}
          className="w-full mt-3 border-2 border-dashed border-surface-4 rounded-2xl py-4 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{addLabel}</span>
        </button>
      )}
    </div>
  );
}
