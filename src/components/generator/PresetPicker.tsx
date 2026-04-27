import { motion } from 'framer-motion';
import { LayoutGrid, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';
import type { Preset } from '@/types';

const ACCENT_TEXT: Record<Preset['accent'], string> = {
  cyan: 'text-cyber-cyan',
  magenta: 'text-cyber-magenta',
  violet: 'text-cyber-violet',
};

const ACCENT_BORDER: Record<Preset['accent'], string> = {
  cyan: 'border-cyber-cyan/70 bg-cyber-cyan/10 shadow-glow-cyan',
  magenta: 'border-cyber-magenta/70 bg-cyber-magenta/10 shadow-glow-magenta',
  violet: 'border-cyber-violet/70 bg-cyber-violet/10',
};

export interface PresetPickerProps {
  presets: Preset[];
  value: string | null;
  onChange: (presetId: string | null) => void;
  autoLabel?: string;
}

export const PresetPicker = ({
  presets,
  value,
  onChange,
  autoLabel,
}: PresetPickerProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] uppercase-wide text-text-secondary">
        <LayoutGrid className="h-3 w-3 text-cyber-cyan" aria-hidden />
        <span className="font-semibold">Naming preset</span>
      </div>

      <div role="radiogroup" aria-label="Naming preset" className="flex flex-wrap gap-2">
        <Chip
          label={autoLabel ? `Auto · ${autoLabel}` : 'Auto'}
          icon={<Wand2 className="h-3 w-3" />}
          active={value === null}
          accent="cyan"
          onClick={() => onChange(null)}
          title="Pick a preset automatically based on the branch type"
        />

        {presets.map((p) => (
          <Chip
            key={p.id}
            label={p.name}
            active={value === p.id}
            accent={p.accent}
            onClick={() => onChange(p.id)}
            title={p.formatRule}
          />
        ))}
      </div>
    </div>
  );
};

interface ChipProps {
  label: string;
  active: boolean;
  accent: Preset['accent'];
  onClick: () => void;
  icon?: React.ReactNode;
  title?: string;
}

const Chip = ({ label, active, accent, onClick, icon, title }: ChipProps) => (
  <motion.button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    title={title}
    whileTap={{ scale: 0.96 }}
    transition={{ duration: 0.18, ease: EASE_OUT_SOFT }}
    className={cn(
      'inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-[11px] uppercase-wide font-semibold transition-colors focus-ring',
      active
        ? cn(ACCENT_BORDER[accent], ACCENT_TEXT[accent])
        : 'border-cyber-cyan/15 text-text-secondary hover:border-cyber-cyan/40 hover:text-cyber-cyan'
    )}
  >
    {icon ? <span className="shrink-0">{icon}</span> : null}
    <span className="whitespace-nowrap">{label}</span>
  </motion.button>
);
