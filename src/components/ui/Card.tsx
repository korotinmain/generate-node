import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'cyan' | 'magenta' | 'violet' | 'none';
  children: ReactNode;
}

const ACCENT_CLASS: Record<NonNullable<CardProps['accent']>, string> = {
  cyan: 'border-cyber-cyan/25 hover:border-cyber-cyan/60 hover:shadow-glow-cyan',
  magenta: 'border-cyber-magenta/25 hover:border-cyber-magenta/60 hover:shadow-glow-magenta',
  violet: 'border-cyber-violet/30 hover:border-cyber-violet/60',
  none: 'border-cyber-cyan/10 hover:border-cyber-cyan/30',
};

export const Card = ({ accent = 'none', className, children, ...rest }: CardProps) => {
  return (
    <div
      {...rest}
      className={cn(
        'panel-frame p-5 transition-[border-color,box-shadow] duration-200',
        ACCENT_CLASS[accent],
        className
      )}
    >
      {children}
    </div>
  );
};
