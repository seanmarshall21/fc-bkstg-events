import { useState, useRef, useEffect, useId } from 'react';

/**
 * Select
 * Native <select> under the hood, custom-styled with iOS-style pill transitions.
 * Chevron rotates when the select is open/focused.
 *
 * Props:
 *  - label?, value, onChange, placeholder, error, disabled, required, name, id
 *  - options: Array<{ value: string|number, label: string, disabled?: boolean }>
 */
export default function Select({
  label,
  value = '',
  onChange,
  placeholder = 'Select…',
  options = [],
  error,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  onBlur,
  onFocus,
  ...rest
}) {
  const reactId = useId();
  const selectId = id || `sel-${reactId}`;
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [shake, setShake] = useState(false);
  const prevErrorRef = useRef(error);

  useEffect(() => {
    if (!prevErrorRef.current && error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
    prevErrorRef.current = error;
  }, [error]);

  const hasValue = value != null && String(value).length > 0;
  const isFloating = !!label && (focused || hasValue);

  let borderClass = 'border-gray-200 hover:border-gray-300';
  if (error) borderClass = 'border-red-400 hover:border-red-500';
  if ((focused || open) && !error) borderClass = 'border-[#6b21e8] ring-2 ring-[#6b21e8]/20';
  if ((focused || open) && error) borderClass = 'border-red-500 ring-2 ring-red-400/20';
  if (disabled) borderClass = 'border-gray-200';

  const containerTransform = active && !disabled ? 'scale-[0.995]' : 'scale-100';
  const chevronRotation = open || focused ? 'rotate-180' : 'rotate-0';

  return (
    <div
      className={[
        'relative w-full',
        shake ? 'animate-[shake_0.4s_cubic-bezier(0.36,0.07,0.19,0.97)_both]' : '',
        className,
      ].join(' ')}
    >
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>

      <div
        className={[
          'relative w-full bg-white rounded-xl border transition-all',
          'duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          borderClass,
          containerTransform,
          disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {label && (
          <label
            htmlFor={selectId}
            className={[
              'absolute left-4 pointer-events-none select-none z-10',
              'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
              isFloating
                ? 'top-1 text-[11px] font-medium'
                : 'top-1/2 -translate-y-1/2 text-[16px]',
              error ? 'text-red-500' : focused ? 'text-[#6b21e8]' : 'text-gray-500',
            ].join(' ')}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); setOpen(false); setActive(false); onBlur?.(e); }}
          onMouseDown={() => { setActive(true); setOpen((o) => !o); }}
          onMouseUp={() => setActive(false)}
          onMouseLeave={() => setActive(false)}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          className={[
            'w-full bg-transparent outline-none appearance-none cursor-pointer',
            'text-[16px] text-gray-900',
            'pl-4 pr-10 rounded-xl',
            label ? 'pt-5 pb-2' : 'py-3.5',
            !hasValue ? 'text-gray-400' : '',
            disabled ? 'cursor-not-allowed' : '',
          ].join(' ')}
          {...rest}
        >
          {!hasValue && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={[
            'absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none',
            'w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
            chevronRotation,
            error ? 'text-red-500' : focused ? 'text-[#6b21e8]' : 'text-gray-400',
          ].join(' ')}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {typeof error === 'string' && error && (
        <p className="mt-1.5 text-[12px] text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}
