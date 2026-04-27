import { AnimatePresence, motion } from 'framer-motion';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { EASE_OUT_SOFT } from '@/lib/motion';
import type { BranchType } from '@/types';

// Theme-aware visuals: state classes here resolve through CSS variables, so
// the active-glow looks like neon bloom in dark mode and ink-pressed depth
// in light mode without any per-theme branching in the component.

export interface BranchPreviewProps {
  type: BranchType;
  ticketId: string;
  descriptor: string;
  branchName: string;
  isValid: boolean;
  errors: string[];
  onExecute: () => void;
}

/**
 * Syntax-highlighted git checkout preview with smooth segment morphing.
 * Splits `feature/PROJ-123-update-login-modal` into three meaningful segments:
 *   - prefix (cyan)          — feature
 *   - ticket (magenta)       — PROJ-123
 *   - descriptor (off-white) — update-login-modal
 */
export const BranchPreview = ({
  type,
  ticketId,
  descriptor,
  branchName,
  isValid,
  errors,
  onExecute,
}: BranchPreviewProps) => {
  const segments = splitBranchForDisplay(branchName, type);

  return (
    <div
      className={cn(
        'relative rounded-sm border bg-bg-preview p-4 pl-5',
        'transition-[box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isValid
          ? 'border-cyber-magenta/40 shadow-glow-magenta'
          : 'border-cyber-cyan/15 shadow-none'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <code
          aria-label="Generated git command"
          className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-sm leading-6"
        >
          <span className="text-text-secondary">git checkout -b </span>
          <AnimatePresence mode="wait" initial={false}>
            {isValid ? (
              <motion.span
                key="valid"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE_OUT_SOFT }}
                className="inline"
              >
                <AnimatedSegment key={`prefix-${segments.prefix}`} className="text-cyber-cyan">
                  {segments.prefix}
                </AnimatedSegment>
                <span className="text-text-secondary">/</span>
                {segments.ticket ? (
                  <>
                    <AnimatedSegment
                      key={`ticket-${segments.ticket}`}
                      className="text-cyber-magenta"
                    >
                      {segments.ticket}
                    </AnimatedSegment>
                    {segments.descriptor ? <span className="text-text-secondary">-</span> : null}
                  </>
                ) : null}
                {segments.descriptor ? (
                  <AnimatedSegment
                    key={`desc-${segments.descriptor}`}
                    className="text-text-primary"
                  >
                    {segments.descriptor}
                  </AnimatedSegment>
                ) : null}
              </motion.span>
            ) : (
              <motion.span
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="text-text-faded italic"
              >
                {buildPlaceholder(type, ticketId, descriptor)}
              </motion.span>
            )}
          </AnimatePresence>
          <span
            aria-hidden
            className="ml-1 inline-block h-4 w-[7px] translate-y-[2px] bg-cyber-cyan animate-blink"
          />
        </code>
        <Button
          variant="primary"
          onClick={onExecute}
          disabled={!isValid}
          leadingIcon={<Copy className="h-3.5 w-3.5" />}
          className={cn(isValid && 'animate-pulse-glow')}
        >
          Execute_Copy
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {errors.length > 0 ? (
          <motion.ul
            key="errors"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1 overflow-hidden text-[10px] uppercase-wide text-cyber-red"
          >
            {errors.map((err) => (
              <li key={err}>» {err}</li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const AnimatedSegment = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.span
    initial={{ opacity: 0, y: 3, filter: 'blur(3px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ duration: 0.24, ease: EASE_OUT_SOFT }}
    className={cn('inline-block', className)}
  >
    {children}
  </motion.span>
);

interface DisplaySegments {
  prefix: string;
  ticket: string;
  descriptor: string;
}

const splitBranchForDisplay = (branchName: string, type: BranchType): DisplaySegments => {
  if (!branchName) return { prefix: type, ticket: '', descriptor: '' };

  const slashIdx = branchName.indexOf('/');
  if (slashIdx === -1) {
    return { prefix: branchName, ticket: '', descriptor: '' };
  }
  const prefix = branchName.slice(0, slashIdx);
  const rest = branchName.slice(slashIdx + 1);
  const ticketMatch = rest.match(/^([A-Z][A-Z0-9]*-\d+)(?:-)?(.*)$/);
  if (ticketMatch) {
    return { prefix, ticket: ticketMatch[1], descriptor: ticketMatch[2] ?? '' };
  }
  return { prefix, ticket: '', descriptor: rest };
};

const buildPlaceholder = (type: BranchType, ticketId: string, descriptor: string): string => {
  const parts = [type];
  const tail: string[] = [];
  if (ticketId.trim()) tail.push(ticketId.trim().toUpperCase());
  if (descriptor.trim()) tail.push(descriptor.trim().toLowerCase());
  if (tail.length === 0) return `${parts[0]}/<ticket-id>-<descriptor>`;
  return `${parts[0]}/${tail.join('-')}`;
};
