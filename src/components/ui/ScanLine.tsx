import { cn } from '@/lib/cn';

export interface ScanLineProps {
  className?: string;
  /** Duration in seconds for one full pass. Default 6s. */
  duration?: number;
  tone?: 'cyan' | 'magenta';
}

const TONE_GRADIENT: Record<NonNullable<ScanLineProps['tone']>, string> = {
  cyan:
    'bg-[linear-gradient(180deg,transparent_0%,rgba(59,245,255,0.12)_45%,rgba(59,245,255,0.26)_50%,rgba(59,245,255,0.12)_55%,transparent_100%)]',
  magenta:
    'bg-[linear-gradient(180deg,transparent_0%,rgba(255,58,214,0.12)_45%,rgba(255,58,214,0.26)_50%,rgba(255,58,214,0.12)_55%,transparent_100%)]',
};

/**
 * Subtle CRT-style scan line that slides top-to-bottom across its container.
 * Anchor the parent with `relative overflow-hidden`.
 * Disabled automatically via CSS when the user prefers reduced motion.
 */
export const ScanLine = ({ className, duration = 6, tone = 'cyan' }: ScanLineProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 -top-1/4 h-1/2',
        'motion-reduce:hidden',
        TONE_GRADIENT[tone],
        className
      )}
      style={{
        animation: `scan ${duration}s linear infinite`,
        mixBlendMode: 'screen',
      }}
    />
  );
};
