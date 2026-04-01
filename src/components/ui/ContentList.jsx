import { useState } from 'react';
import { Search, Plus, RefreshCw, ChevronRight } from 'lucide-react';

/**
 * Reusable content list shell.
 * Handles search, empty state, loading, and item rendering.
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
  addLabel = 'Add New',
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

  return (
    <div className="p-4 pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {count ?? items.length} total{search ? `, ${filtered.length} shown` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="vc-btn vc-btn--ghost !px-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="vc-btn vc-btn--primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {searchable && items.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="vc-input pl-9"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-3" />
          <span className="text-sm">Loading...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-sm">{search ? 'No matches found' : emptyMessage}</p>
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
    </div>
  );
}
