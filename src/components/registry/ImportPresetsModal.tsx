import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Upload, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import {
  detectConflicts,
  mergePresets,
  parseImport,
  type ConflictChoice,
  type MergeSummary,
} from '@/lib/presets-io';
import type { Preset } from '@/types';

export interface ImportPresetsModalProps {
  open: boolean;
  onClose: () => void;
  existing: Preset[];
  onApply: (next: Preset[], summary: MergeSummary) => void;
}

const CHOICE_LABELS: Record<ConflictChoice, string> = {
  skip: 'Skip',
  replace: 'Replace',
  duplicate: 'Duplicate',
};

const CHOICES: ConflictChoice[] = ['skip', 'replace', 'duplicate'];

export const ImportPresetsModal = ({
  open,
  onClose,
  existing,
  onApply,
}: ImportPresetsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Preset[] | null>(null);
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({});

  const reset = () => {
    setRawJson('');
    setError(null);
    setIncoming(null);
    setChoices({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const conflicts = useMemo(
    () => (incoming ? detectConflicts(existing, incoming) : new Set<string>()),
    [existing, incoming]
  );

  const preview = useMemo<MergeSummary | null>(() => {
    if (!incoming) return null;
    return mergePresets(existing, incoming, choices).summary;
  }, [existing, incoming, choices]);

  const validate = (json: string) => {
    const result = parseImport(json);
    if (!result.ok) {
      setError(result.error);
      setIncoming(null);
      setChoices({});
      return;
    }
    setError(null);
    setIncoming(result.data.presets);
    const ids = detectConflicts(existing, result.data.presets);
    const next: Record<string, ConflictChoice> = {};
    ids.forEach((id) => {
      next[id] = 'skip';
    });
    setChoices(next);
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setRawJson(text);
      validate(text);
    });
  };

  const handleTextarea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawJson(text);
    if (text.trim().length === 0) {
      setError(null);
      setIncoming(null);
      setChoices({});
      return;
    }
    validate(text);
  };

  const handleApply = () => {
    if (!incoming) return;
    const result = mergePresets(existing, incoming, choices);
    onApply(result.presets, result.summary);
    onClose();
  };

  const conflictPresets = incoming?.filter((p) => conflicts.has(p.id)) ?? [];
  const newCount = incoming ? incoming.length - conflictPresets.length : 0;

  return (
    <Modal open={open} onClose={onClose} title="Import // Presets" widthClass="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
            aria-label="Choose preset JSON file"
          />
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Upload className="h-3.5 w-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose file
          </Button>
          <span className="text-[10px] uppercase-wide text-text-secondary">
            or paste JSON below
          </span>
        </div>

        <div>
          <label
            htmlFor="import-preset-json"
            className="mb-1.5 block text-[10px] uppercase-wide font-semibold text-text-secondary"
          >
            JSON Payload
          </label>
          <div
            className={cn(
              'rounded-sm border bg-bg-input transition-colors',
              error
                ? 'border-cyber-red/70 focus-within:border-cyber-red'
                : 'border-cyber-cyan/20 focus-within:border-cyber-cyan/70 focus-within:shadow-glow-cyan'
            )}
          >
            <textarea
              id="import-preset-json"
              value={rawJson}
              onChange={handleTextarea}
              spellCheck={false}
              rows={6}
              placeholder='{"schemaVersion":1,"presets":[...]}'
              className="block w-full resize-y bg-transparent p-3 font-mono text-xs text-text-primary placeholder:text-text-faded outline-none"
            />
          </div>
          {error ? (
            <p className="mt-1.5 text-[10px] uppercase-wide text-cyber-red">{error}</p>
          ) : null}
        </div>

        {incoming ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <FileJson className="h-3.5 w-3.5 text-cyber-cyan" />
              <span className="uppercase-wide">
                {incoming.length} preset{incoming.length === 1 ? '' : 's'} detected
                {conflictPresets.length > 0 ? ` · ${conflictPresets.length} conflict${conflictPresets.length === 1 ? '' : 's'}` : ''}
              </span>
            </div>

            {conflictPresets.length > 0 ? (
              <div className="rounded-sm border border-cyber-cyan/15 bg-bg-panel/40">
                <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-cyber-cyan/10 px-3 py-2 text-[10px] uppercase-wide text-text-secondary">
                  <span>Conflicting Preset</span>
                  <span>Resolution</span>
                </div>
                <ul className="divide-y divide-cyber-cyan/10">
                  {conflictPresets.map((p) => (
                    <li
                      key={p.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-text-primary">{p.name}</p>
                        <p className="truncate text-[10px] text-text-secondary">{p.id}</p>
                      </div>
                      <div role="radiogroup" aria-label={`Resolution for ${p.name}`} className="flex gap-1">
                        {CHOICES.map((c) => {
                          const active = choices[p.id] === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() =>
                                setChoices((prev) => ({ ...prev, [p.id]: c }))
                              }
                              className={cn(
                                'h-7 rounded-sm border px-2 text-[10px] uppercase-wide font-semibold transition-colors focus-ring',
                                active
                                  ? 'border-cyber-cyan/70 bg-cyber-cyan/10 text-cyber-cyan'
                                  : 'border-cyber-cyan/15 text-text-secondary hover:border-cyber-cyan/40 hover:text-cyber-cyan'
                              )}
                            >
                              {CHOICE_LABELS[c]}
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview ? (
              <p className="text-[11px] uppercase-wide text-text-secondary">
                Will import <span className="text-cyber-cyan">{newCount} new</span>
                {' · '}
                replace <span className="text-cyber-cyan">{preview.replaced}</span>
                {' · '}
                duplicate <span className="text-cyber-cyan">{preview.duplicated}</span>
                {' · '}
                skip <span className="text-cyber-cyan">{preview.skipped}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-cyber-cyan/10 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!incoming || !!error} onClick={handleApply}>
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
};
