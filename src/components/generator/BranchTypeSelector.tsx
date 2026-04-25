import { Bug, Flame, Plus, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { BRANCH_TYPES, type BranchType } from '@/types';

const NODES: Array<{ type: BranchType; label: string; Icon: typeof Plus }> = [
  { type: 'feature', label: 'Feature', Icon: Plus },
  { type: 'bugfix', label: 'Bugfix', Icon: Bug },
  { type: 'hotfix', label: 'Hotfix', Icon: Flame },
  { type: 'release', label: 'Release', Icon: Rocket },
];

// Keep the selector in sync with the allowed branch types.
if (NODES.length !== BRANCH_TYPES.length) {
  throw new Error('BranchTypeSelector NODES is out of sync with BRANCH_TYPES');
}

export interface BranchTypeSelectorProps {
  value: BranchType;
  onChange: (type: BranchType) => void;
}

export const BranchTypeSelector = ({ value, onChange }: BranchTypeSelectorProps) => {
  const activeIndex = useMemo(
    () => Math.max(0, NODES.findIndex((n) => n.type === value)),
    [value]
  );

  // Percentage of the connector line to fill, based on the active index.
  const linePercent = (activeIndex / (NODES.length - 1)) * 100;

  return (
    <div role="radiogroup" aria-label="Branch type" className="relative px-2 sm:px-4">
      {/* Base connector */}
      <div
        aria-hidden
        className="absolute left-10 right-10 top-[34px] h-px bg-cyber-cyan/10"
      />
      {/* Animated progress fill on the connector */}
      <motion.div
        aria-hidden
        className="absolute left-10 top-[34px] h-px bg-gradient-to-r from-cyber-cyan via-cyber-cyan to-cyber-cyan/30 shadow-[0_0_8px_rgba(59,245,255,0.6)]"
        animate={{ width: `calc((100% - 80px) * ${linePercent / 100})` }}
        transition={{ duration: 0.55, ease: EASE_OUT_SOFT }}
      />

      <div className="relative grid grid-cols-4 gap-3 sm:gap-6">
        {NODES.map(({ type, label, Icon }) => {
          const isActive = value === type;
          return (
            <motion.button
              key={type}
              role="radio"
              aria-checked={isActive}
              aria-label={label}
              onClick={() => onChange(type)}
              type="button"
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
              className="group relative flex flex-col items-center gap-2 focus-ring rounded-sm"
            >
              <span
                className={cn(
                  'relative flex h-[68px] w-[68px] items-center justify-center rounded-lg border-2 transition-colors duration-300',
                  isActive
                    ? 'border-transparent text-cyber-cyan'
                    : 'border-cyber-cyan/15 text-text-secondary bg-bg-input group-hover:border-cyber-cyan/50 group-hover:text-cyber-cyan'
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="selector-active-ring"
                    aria-hidden
                    className="absolute inset-0 rounded-lg border-2 border-cyber-cyan bg-cyber-cyan/5 shadow-glow-cyan-strong"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                ) : null}
                {isActive ? (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-lg"
                    initial={{ opacity: 0.9, scale: 1 }}
                    animate={{ opacity: [0.9, 0.4, 0.9], scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                    style={{
                      boxShadow: '0 0 24px rgba(59, 245, 255, 0.28)',
                    }}
                  />
                ) : null}
                <motion.span
                  key={`${type}-${isActive}`}
                  initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="relative"
                >
                  <Icon
                    className={cn(
                      'h-7 w-7',
                      isActive && 'drop-shadow-[0_0_8px_currentColor]'
                    )}
                  />
                </motion.span>
              </span>
              <motion.span
                animate={{
                  color: isActive ? 'rgb(59 245 255)' : 'rgb(138 150 176)',
                  textShadow: isActive
                    ? '0 0 8px rgba(59, 245, 255, 0.8), 0 0 20px rgba(59, 245, 255, 0.3)'
                    : '0 0 0px rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
                className="text-[10px] uppercase-wide font-bold"
              >
                {label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
