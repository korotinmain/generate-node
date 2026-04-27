import { TerminalSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface OsHeaderProps {
  onOpenPalette: () => void;
}

export const OsHeader = ({ onOpenPalette }: OsHeaderProps) => {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-6 border-b border-cyber-cyan/10 bg-bg-elevated/80 backdrop-blur-md px-6'
      )}
    >
      <span className="text-cyber-cyan text-glow-cyan font-display text-sm font-bold uppercase-wide">
        BRANCH_OS // GEN-IV
      </span>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onOpenPalette}
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
      </div>
    </div>
  );
};
