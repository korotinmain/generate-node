import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="flex flex-col gap-1.5">
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
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 bg-transparent px-3 text-sm font-mono text-text-primary placeholder:text-text-faded',
              'outline-none',
              className
            )}
            spellCheck={false}
            autoComplete="off"
            {...rest}
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
      </div>
    );
  }
);

Input.displayName = 'Input';
