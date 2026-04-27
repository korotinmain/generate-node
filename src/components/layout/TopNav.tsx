import { NavLink } from 'react-router-dom';
import { TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useBranchStore } from '@/store/useBranchStore';

const LINKS = [
  { to: '/', label: 'Generator', end: true },
  { to: '/registry', label: 'Registry', end: false },
  { to: '/logs', label: 'Logs', end: false },
];

export interface TopNavProps {
  onOpenPalette: () => void;
}

export const TopNav = ({ onOpenPalette }: TopNavProps) => {
  const operator = useBranchStore((s) => s.operator);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-cyber-cyan/10 bg-bg-elevated/80 backdrop-blur-md'
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-6">
        <NavLink to="/" className="flex items-center gap-2 focus-ring rounded-sm">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className="relative inline-flex h-2 w-2 rounded-full bg-cyber-cyan shadow-[0_0_10px_currentColor]"
          />
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            animate={{ opacity: 1, letterSpacing: '0.18em' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-cyber-cyan text-glow-cyan font-display text-sm font-bold uppercase-wide"
          >
            BRANCH_CMD
          </motion.span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'relative px-3 py-1.5 text-[11px] font-semibold uppercase-wide focus-ring rounded-sm transition-colors',
                  isActive
                    ? 'text-cyber-cyan text-glow-cyan'
                    : 'text-text-secondary hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <motion.span
                      layoutId="topnav-underline"
                      aria-hidden
                      className="pointer-events-none absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-cyber-cyan shadow-[0_0_8px_currentColor]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <PaletteButton onClick={onOpenPalette} />
          <Avatar label={operator.handle} />
        </div>
      </div>
    </header>
  );
};

interface PaletteButtonProps {
  onClick: () => void;
}

const PaletteButton = ({ onClick }: PaletteButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Open command palette"
    title="Command palette · ⌘K"
    className={cn(
      'inline-flex h-9 items-center gap-1.5 rounded-sm border border-cyber-cyan/15 bg-bg-input/60 px-2.5 text-text-secondary',
      'transition-colors hover:text-cyber-cyan hover:border-cyber-cyan/40 focus-ring'
    )}
  >
    <TerminalSquare className="h-4 w-4" aria-hidden />
    <kbd className="hidden md:inline-flex items-center font-mono text-[10px] uppercase-wide text-text-muted">
      ⌘K
    </kbd>
  </button>
);
