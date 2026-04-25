import { Code2, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { Preset } from '@/types';

export interface PresetCardProps {
  preset: Preset;
  onDelete?: (id: string) => void;
}

const ACCENT_DOT: Record<Preset['accent'], string> = {
  cyan: 'bg-cyber-cyan',
  magenta: 'bg-cyber-magenta',
  violet: 'bg-cyber-violet',
};

export const PresetCard = ({ preset, onDelete }: PresetCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
    <Card accent={preset.accent} className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]',
              ACCENT_DOT[preset.accent]
            )}
          />
          <h3 className="text-sm font-semibold text-text-primary">{preset.name}</h3>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label={`${preset.name} actions`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => window.setTimeout(() => setMenuOpen(false), 120)}
            className="text-text-secondary hover:text-cyber-cyan focus-ring rounded-sm p-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && onDelete ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 z-10 min-w-[140px] panel-frame p-1"
            >
              <button
                type="button"
                role="menuitem"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onDelete(preset.id);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[11px] uppercase-wide text-cyber-red hover:bg-cyber-red/10"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <p className="text-xs leading-relaxed text-text-secondary">{preset.description}</p>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] uppercase-wide font-semibold text-cyber-cyan">Prefixes</p>
        <ul className="flex flex-wrap gap-2">
          {preset.prefixes.map((prefix) => (
            <li
              key={prefix}
              className="rounded-sm border border-cyber-cyan/15 bg-bg-panel px-2 py-1 text-[11px] font-mono text-text-primary"
            >
              {prefix}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] uppercase-wide font-semibold text-cyber-magenta">Format Rule</p>
        <div className="flex items-start gap-2 rounded-sm border border-cyber-magenta/25 bg-bg-panel px-3 py-2.5">
          <Code2 className="mt-0.5 h-3.5 w-3.5 text-cyber-magenta shrink-0" />
          <code className="break-all text-[11px] font-mono text-text-primary">
            {preset.formatRule}
          </code>
        </div>
      </section>
    </Card>
    </motion.div>
  );
};
