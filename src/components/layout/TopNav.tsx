import { NavLink } from 'react-router-dom';
import { Bell, Settings, TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useBranchStore } from '@/store/useBranchStore';

const LINKS = [
  { to: '/', label: 'Generator', end: true },
  { to: '/registry', label: 'Registry', end: false },
  { to: '/logs', label: 'Logs', end: false },
];

export const TopNav = () => {
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

        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Notifications" badge>
            <Bell className="h-4 w-4" />
          </IconButton>
          <IconButton label="Terminal">
            <TerminalSquare className="h-4 w-4" />
          </IconButton>
          <IconButton label="Settings">
            <Settings className="h-4 w-4" />
          </IconButton>
          <div className="ml-2">
            <Avatar label={operator.handle} />
          </div>
        </div>
      </div>
    </header>
  );
};

interface IconButtonProps {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}

const IconButton = ({ label, badge, children }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={cn(
      'relative inline-flex h-9 w-9 items-center justify-center rounded-sm border border-transparent text-text-secondary',
      'transition-colors hover:text-cyber-cyan hover:border-cyber-cyan/30 focus-ring'
    )}
  >
    {children}
    {badge ? (
      <span
        aria-hidden
        className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyber-magenta shadow-[0_0_6px_currentColor]"
      />
    ) : null}
  </button>
);
