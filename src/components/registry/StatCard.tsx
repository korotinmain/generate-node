import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useCountUp } from '@/hooks/useCountUp';

export interface StatCardProps {
  label: string;
  value: number;
  footer: string;
  accent: 'cyan' | 'magenta' | 'violet';
  icon: ReactNode;
}

const ACCENT_CLASS: Record<StatCardProps['accent'], string> = {
  cyan: 'border-l-cyber-cyan text-cyber-cyan',
  magenta: 'border-l-cyber-magenta text-cyber-magenta',
  violet: 'border-l-cyber-violet text-cyber-violet',
};

const SHINE_ACCENT: Record<StatCardProps['accent'], string> = {
  cyan: 'from-cyber-cyan/0 via-cyber-cyan/15 to-cyber-cyan/0',
  magenta: 'from-cyber-magenta/0 via-cyber-magenta/15 to-cyber-magenta/0',
  violet: 'from-cyber-violet/0 via-cyber-violet/20 to-cyber-violet/0',
};

export const StatCard = ({ label, value, footer, accent, icon }: StatCardProps) => {
  const animated = useCountUp(value, { durationMs: 1100 });
  const display = Math.round(animated);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'panel-frame group relative p-4 pl-5 border-l-2 overflow-hidden',
        ACCENT_CLASS[accent]
      )}
    >
      {/* Diagonal shine on hover */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-y-4 -left-1/3 w-1/2 rotate-[18deg] opacity-0 blur-[2px]',
          'transition-[opacity,transform] duration-700 ease-out',
          'group-hover:opacity-100 group-hover:translate-x-[260%]',
          'bg-gradient-to-r',
          SHINE_ACCENT[accent]
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase-wide font-semibold text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold font-mono text-text-primary tabular-nums">
            {formatNumber(display)}
          </p>
        </div>
        <span className={cn('opacity-70 transition-transform duration-300 group-hover:scale-110', ACCENT_CLASS[accent])}>
          {icon}
        </span>
      </div>
      <p className="relative mt-3 text-[10px] uppercase-wide text-text-muted">{footer}</p>
    </motion.div>
  );
};
