import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-transparent border-cyber-cyan/60 text-cyber-cyan hover:bg-cyber-cyan/10 hover:border-cyber-cyan hover:shadow-glow-cyan hover:-translate-y-[1px]',
  secondary:
    'bg-bg-panel/60 border-cyber-cyan/20 text-text-primary hover:border-cyber-cyan/50 hover:text-cyber-cyan hover:-translate-y-[1px]',
  ghost:
    'bg-transparent border-transparent text-text-secondary hover:text-cyber-cyan hover:border-cyber-cyan/30',
  danger:
    'bg-transparent border-cyber-red/50 text-cyber-red hover:bg-cyber-red/10 hover:shadow-glow-red hover:-translate-y-[1px]',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-11 px-5 text-xs',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', leadingIcon, trailingIcon, className, children, type, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        {...rest}
        className={cn(
          'group/btn inline-flex items-center justify-center gap-2 rounded-sm border font-mono uppercase-wide font-semibold',
          'transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'active:translate-y-0 active:scale-[0.97]',
          'disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0',
          'focus-ring',
          VARIANT_CLASS[variant],
          SIZE_CLASS[size],
          className
        )}
      >
        {leadingIcon ? (
          <span className="inline-flex shrink-0 transition-transform duration-200 group-hover/btn:-translate-x-[1px]">
            {leadingIcon}
          </span>
        ) : null}
        <span className="whitespace-nowrap">{children}</span>
        {trailingIcon ? (
          <span className="inline-flex shrink-0 transition-transform duration-200 group-hover/btn:translate-x-[1px]">
            {trailingIcon}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
