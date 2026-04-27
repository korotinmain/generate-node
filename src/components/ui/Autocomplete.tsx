import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onCommit?: (committed: string) => void;
  suggestions: string[];
  placeholder?: string;
  hint?: string;
  error?: string | null;
  showOnFocus?: number; // how many suggestions to show on focus when input is empty (default 3)
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
  onKeyDownExtra?: (e: KeyboardEvent<HTMLInputElement>) => void;
  autoCapitalize?: string;
}

export const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      label,
      value,
      onChange,
      onCommit,
      suggestions,
      placeholder,
      hint,
      error,
      showOnFocus = 3,
      onPaste,
      onKeyDownExtra,
      autoCapitalize,
    },
    forwardedRef
  ) => {
    const autoId = useId();
    const inputId = `${autoId}-input`;
    const listboxId = `${autoId}-listbox`;
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const reduceMotion = useReducedMotion();

    const visible = value.trim().length > 0 ? suggestions : suggestions.slice(0, showOnFocus);
    const hasItems = visible.length > 0;

    useEffect(() => {
      if (activeIndex >= visible.length) setActiveIndex(visible.length - 1);
    }, [visible.length, activeIndex]);

    const commit = useCallback(
      (next: string) => {
        onChange(next);
        onCommit?.(next);
        setOpen(false);
        setActiveIndex(-1);
      },
      [onChange, onCommit]
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
      setOpen(true);
      setActiveIndex(-1);
    };

    const handleFocus = (_e: FocusEvent<HTMLInputElement>) => {
      if (visible.length > 0) setOpen(true);
    };

    const handleBlur = () => {
      // Delay so a click on a list item still registers.
      window.setTimeout(() => setOpen(false), 120);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        if (!hasItems) return;
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (i + 1) % visible.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        if (!hasItems) return;
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (i <= 0 ? visible.length - 1 : i - 1));
        return;
      }
      if (e.key === 'Enter') {
        if (open && activeIndex >= 0 && visible[activeIndex]) {
          e.preventDefault();
          commit(visible[activeIndex]);
          return;
        }
      }
      if (e.key === 'Tab') {
        if (open && activeIndex >= 0 && visible[activeIndex]) {
          // Commit but let Tab continue to move focus.
          commit(visible[activeIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setActiveIndex(-1);
          return;
        }
      }
      onKeyDownExtra?.(e);
    };

    const activeId = activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;
    const showList = open && hasItems;

    return (
      <div className="relative flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-[10px] uppercase-wide text-text-secondary font-semibold"
        >
          {label}
        </label>
        <div
          className={cn(
            'relative rounded-sm border bg-bg-input transition-colors',
            error
              ? 'border-cyber-red/70 focus-within:border-cyber-red'
              : 'border-cyber-cyan/20 focus-within:border-cyber-cyan/70 focus-within:shadow-glow-cyan'
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPaste={onPaste}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize={autoCapitalize}
            role="combobox"
            aria-controls={listboxId}
            aria-expanded={showList}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            className="w-full h-11 bg-transparent px-3 text-sm font-mono text-text-primary placeholder:text-text-faded outline-none"
          />
        </div>
        {(error || hint) && (
          <p
            className={cn(
              'text-[10px] uppercase-wide',
              error ? 'text-cyber-red' : 'text-text-muted'
            )}
          >
            {error ?? hint}
          </p>
        )}
        <AnimatePresence>
          {showList ? (
            <motion.ul
              id={listboxId}
              role="listbox"
              aria-label={`${label} suggestions`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-sm border border-cyber-cyan/30 bg-bg-panel/95 shadow-panel backdrop-blur-sm"
            >
              {visible.map((s, i) => {
                const active = i === activeIndex;
                return (
                  <li
                    key={`${s}-${i}`}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => {
                      // Prevent input blur before click registers.
                      e.preventDefault();
                    }}
                    onClick={() => commit(s)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'cursor-pointer px-3 py-2 font-mono text-[12px] transition-colors',
                      active
                        ? 'bg-cyber-cyan/10 text-cyber-cyan'
                        : 'text-text-primary hover:bg-cyber-cyan/[0.06]'
                    )}
                  >
                    {s}
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Autocomplete.displayName = 'Autocomplete';
