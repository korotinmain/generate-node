import { Bell, Network, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface OsHeaderProps {
  showSearch?: boolean;
}

export const OsHeader = ({ showSearch = false }: OsHeaderProps) => {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-6 border-b border-cyber-cyan/10 bg-bg-elevated/80 backdrop-blur-md px-6'
      )}
    >
      <span className="text-cyber-cyan text-glow-cyan font-display text-sm font-bold uppercase-wide">
        BRANCH_OS // GEN-IV
      </span>
      <div className="ml-auto flex items-center gap-1">
        {showSearch ? (
          <IconBtn label="Search">
            <Search className="h-4 w-4" />
          </IconBtn>
        ) : null}
        <IconBtn label="Network">
          <Network className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Notifications" badge>
          <Bell className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Settings">
          <Settings className="h-4 w-4" />
        </IconBtn>
      </div>
    </div>
  );
};

const IconBtn = ({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}) => (
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
