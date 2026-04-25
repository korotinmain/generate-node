import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { Preset } from '@/types';

export interface NewPresetModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (preset: Omit<Preset, 'id' | 'createdAt'>) => void;
}

const ACCENTS: Array<{ key: Preset['accent']; bg: string }> = [
  { key: 'cyan', bg: 'bg-cyber-cyan' },
  { key: 'magenta', bg: 'bg-cyber-magenta' },
  { key: 'violet', bg: 'bg-cyber-violet' },
];

const DEFAULT_FORMAT = '{prefix}/{ticket-id}-{short-desc}';

export const NewPresetModal = ({ open, onClose, onCreate }: NewPresetModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prefixes, setPrefixes] = useState('feature/, bugfix/, chore/');
  const [formatRule, setFormatRule] = useState(DEFAULT_FORMAT);
  const [accent, setAccent] = useState<Preset['accent']>('cyan');

  const reset = () => {
    setName('');
    setDescription('');
    setPrefixes('feature/, bugfix/, chore/');
    setFormatRule(DEFAULT_FORMAT);
    setAccent('cyan');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedPrefixes = prefixes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!name.trim() || parsedPrefixes.length === 0) return;
    onCreate({
      name: name.trim(),
      description: description.trim() || 'Custom naming rules.',
      prefixes: parsedPrefixes,
      formatRule: formatRule.trim() || DEFAULT_FORMAT,
      accent,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Register // New Preset"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Module Name"
          placeholder="e.g. Infra Ops"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Description"
          placeholder="One-line module description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Prefixes (comma-separated)"
          placeholder="feature/, bugfix/"
          value={prefixes}
          onChange={(e) => setPrefixes(e.target.value)}
        />
        <Input
          label="Format Rule"
          placeholder={DEFAULT_FORMAT}
          value={formatRule}
          onChange={(e) => setFormatRule(e.target.value)}
          hint="Tokens: {prefix} {ticket-id} {short-desc} {version} {action}"
        />

        <div>
          <p className="mb-2 text-[10px] uppercase-wide font-semibold text-text-secondary">
            Accent
          </p>
          <div className="flex gap-2">
            {ACCENTS.map(({ key, bg }) => (
              <button
                key={key}
                type="button"
                aria-label={`Accent ${key}`}
                aria-pressed={accent === key}
                onClick={() => setAccent(key)}
                className={cn(
                  'h-7 w-7 rounded-sm border transition-[box-shadow,border-color]',
                  bg,
                  accent === key
                    ? 'border-white/90 shadow-[0_0_0_2px_rgba(255,255,255,0.15)]'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-cyber-cyan/10 pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            Register
          </Button>
        </div>
      </form>
    </Modal>
  );
};
