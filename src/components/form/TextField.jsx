import { useState, useRef, useEffect, useId } from 'react';

/**
 * TextField
 * iOS-style text input with fluid state transitions.
 *
 * Props:
 *  - label?: string              Optional floating label
 *  - value: string
 *  - onChange: (e) => void
 *  - type?: string               default "text"
 *  - placeholder?: string
 *  - error?: string|boolean      Error message or truthy = error state
 *  - disabled?: boolean
 *  - required?: boolean
 *  - autoComplete?: string
 *  - name?: string
 *  - id?: string
 *  - className?: string          Wrapper class override
 *  - onBlur?, onFocus?           Pass-through
 */
export default function TextField({
  label,
  value = '',
  onChange,
  type = 'text',
  placeholder,
  error,
  disabled = false,
  required = false,
  autoComplete,
  name,
  id,
  className = '',
  onBlur,
  onFocus,
  ...rest
}) {
  const reactId = useId();
  const inputId = id || `tf-${reactId}`;
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(false);
  const [shake, setShake] = useState(false);
  const prevErrorRef = useRef(error);

  // Trigger shake when error transitions from falsy -> truthy
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

  // Border color by state (focus > error > default)
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
      {/* inline keyframes for shake (no global css needed) */}
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
              'absolute left-4 pointer-events-none select-none',
              'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
              isFloating
                ? 'top-1 text-[11px] font-medium'
                : 'top-1/2 -translate-y-1/2 text-[16px]',
              error
                ? 'text-red-500'
                : focused
                ? 'text-[#6b21e8]'
                : 'text-gray-500',
            ].join(' ')}
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={isFloating || !label ? placeholder : ''}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setActive(false);
            onBlur?.(e);
          }}
          onMouseDown={() => setActive(true)}
          onMouseUp={() => setActive(false)}
          onMouseLeave={() => setActive(false)}
          onTouchStart={() => setActive(true)}
          onTouchEnd={() => setActive(false)}
          className={[
            'w-full bg-transparent outline-none',
            'text-[16px] text-gray-900 placeholder-gray-400',
            'px-4 rounded-xl',
            label ? 'pt-5 pb-2' : 'py-3.5',
            disabled ? 'cursor-not-allowed' : '',
          ].join(' ')}
          {...rest}
        />
      </div>

      {typeof error === 'string' && error && (
        <p className="mt-1.5 text-[12px] text-red-500 px-1 transition-opacity duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
