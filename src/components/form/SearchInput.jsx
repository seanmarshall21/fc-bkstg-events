import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * SearchInput
 * Debounced search with iOS-style transitions.
 *
 * Props:
 *  - value: string                 Controlled value (raw, not debounced)
 *  - onChange: (next) => void      Fires on every keystroke (raw)
 *  - onSearch: (query) => void     Fires 300ms after user stops typing
 *  - placeholder?: string          default "Search"
 *  - loading?: boolean             Replaces icon with spinner
 *  - expandOnFocus?: boolean       Grow container width on focus (default false)
 *  - debounceMs?: number           default 300
 *  - disabled?: boolean
 *  - className?, name?, id?
 */
export default function SearchInput({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search',
  loading = false,
  expandOnFocus = false,
  debounceMs = 300,
  disabled = false,
  className = '',
  name,
  id,
}) {
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);
  const lastSearchedRef = useRef(value);

  // Fire debounced onSearch when value changes
  useEffect(() => {
    if (!onSearch) return;
    if (value === lastSearchedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSearchedRef.current = value;
      onSearch(value);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    onChange?.('');
    // Fire immediate clear to onSearch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastSearchedRef.current = '';
    onSearch?.('');
  }, [onChange, onSearch]);

  const hasValue = value && String(value).length > 0;

  const borderClass = focused
    ? 'border-[#6b21e8] ring-2 ring-[#6b21e8]/20'
    : 'border-gray-200 hover:border-gray-300';

  const widthClass = expandOnFocus
    ? focused
      ? 'w-full'
      : 'w-64 max-w-full'
    : 'w-full';

  return (
    <div
      className={[
        'relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        widthClass,
        className,
      ].join(' ')}
    >
      <div
        className={[
          'relative bg-white rounded-xl border transition-all',
          'duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          borderClass,
          disabled ? 'bg-gray-50 opacity-60' : '',
        ].join(' ')}
      >
        {/* Left icon slot */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none">
          {loading ? (
            <svg className="w-4 h-4 animate-spin text-[#6b21e8]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className={['w-4 h-4 transition-colors duration-200', focused ? 'text-[#6b21e8]' : 'text-gray-400'].join(' ')}
            >
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        <input
          id={id}
          name={name}
          type="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={[
            'w-full bg-transparent outline-none rounded-xl',
            'text-[16px] text-gray-900 placeholder-gray-400',
            'pl-10 pr-10 py-3',
            disabled ? 'cursor-not-allowed' : '',
          ].join(' ')}
        />

        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          tabIndex={hasValue ? 0 : -1}
          aria-label="Clear search"
          className={[
            'absolute right-3 top-1/2 -translate-y-1/2',
            'w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300',
            'flex items-center justify-center',
            'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
            hasValue ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none',
          ].join(' ')}
        >
          <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5 text-white">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
