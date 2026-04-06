import { useState, useRef, useEffect, useId } from 'react';

/**
 * TextArea
 * Same styling language as TextField. Auto-resizes height to fit content.
 *
 * Props:
 *  - label?, value, onChange, placeholder, error, disabled, required, name, id
 *  - minHeight?: number   default 88
 *  - maxHeight?: number   default 320
 *  - rows?: number        initial rows fallback
 */
export default function TextArea({
  label,
  value = '',
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  minHeight = 88,
  maxHeight = 320,
  rows = 3,
  onBlur,
  onFocus,
  ...rest
}) {
  const reactId = useId();
  const inputId = id || `ta-${reactId}`;
  const taRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(false);
  const [shake, setShake] = useState(false);
  const prevErrorRef = useRef(error);

  // Auto-resize on content change
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, minHeight, maxHeight]);

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
  if (focused && !error) borderClass = 'border-[#6b21e8] ring-2 ring-[#6b21e8]/20';
  if (focused && error) borderClass = 'border-red-500 ring-2 ring-red-400/20';
  if (disabled) borderClass = 'border-gray-200';

  const containerTransform = active && !disabled ? 'scale-[0.995]' : 'scale-100';

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
            htmlFor={inputId}
            className={[
              'absolute left-4 pointer-events-none select-none z-10',
              'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
              isFloating
                ? 'top-1 text-[11px] font-medium'
                : 'top-3.5 text-[16px]',
              error ? 'text-red-500' : focused ? 'text-[#6b21e8]' : 'text-gray-500',
            ].join(' ')}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={taRef}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={isFloating || !label ? placeholder : ''}
          disabled={disabled}
          required={required}
          rows={rows}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); setActive(false); onBlur?.(e); }}
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          onMouseLeave={() => setActive(false)}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          style={{ minHeight, maxHeight, resize: 'none' }}
          className={[
            'w-full bg-transparent outline-none block',
            'text-[16px] text-gray-900 placeholder-gray-400 leading-relaxed',
            'px-4 rounded-xl',
            label ? 'pt-6 pb-3' : 'py-3',
            disabled ? 'cursor-not-allowed' : '',
          ].join(' ')}
          {...rest}
        />
      </div>

      {typeof error === 'string' && error && (
        <p className="mt-1.5 text-[12px] text-red-500 px-1">{error}</p>
      )}
    </div>
  );
}
