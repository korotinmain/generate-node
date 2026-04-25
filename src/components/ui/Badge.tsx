import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { LogStatus } from '@/types';

type Tone = 'cyan' | 'magenta' | 'violet' | 'red' | 'amber' | 'neutral';

const TONE_CLASS: Record<Tone, string> = {
  cyan: 'text-cyber-cyan border-cyber-cyan/50 bg-cyber-cyan/10',
  magenta: 'text-cyber-magenta border-cyber-magenta/50 bg-cyber-magenta/10',
  violet: 'text-cyber-violet border-cyber-violet/50 bg-cyber-violet/10',
  red: 'text-cyber-red border-cyber-red/50 bg-cyber-red/10',
  amber: 'text-cyber-amber border-cyber-amber/50 bg-cyber-amber/10',
  neutral: 'text-text-secondary border-cyber-cyan/15 bg-bg-panel',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}

export const Badge = ({ tone = 'neutral', dot = false, className, children, ...rest }: BadgeProps) => {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase-wide leading-none',
        TONE_CLASS[tone],
        className
      )}
    >
      {dot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'cyan' && 'bg-cyber-cyan shadow-[0_0_6px_currentColor]',
            tone === 'magenta' && 'bg-cyber-magenta shadow-[0_0_6px_currentColor]',
            tone === 'red' && 'bg-cyber-red shadow-[0_0_6px_currentColor]',
            tone === 'amber' && 'bg-cyber-amber shadow-[0_0_6px_currentColor]',
            tone === 'violet' && 'bg-cyber-violet shadow-[0_0_6px_currentColor]',
            tone === 'neutral' && 'bg-text-secondary'
          )}
        />
      ) : null}
      {children}
    </span>
  );
};

export const STATUS_TONE: Record<LogStatus, Tone> = {
  committed: 'cyan',
  copied: 'magenta',
  terminated: 'red',
};
