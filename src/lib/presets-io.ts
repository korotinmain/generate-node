import type { Preset } from '@/types';

export const PRESETS_SCHEMA_VERSION = 1;

const ACCENT_VALUES: ReadonlyArray<Preset['accent']> = ['cyan', 'magenta', 'violet'];

export interface PresetsExport {
  schemaVersion: number;
  exportedAt: string;
  presets: Preset[];
}

export type ConflictChoice = 'skip' | 'replace' | 'duplicate';

export type ParseResult =
  | { ok: true; data: PresetsExport }
  | { ok: false; error: string };

export interface MergeSummary {
  added: number;
  replaced: number;
  skipped: number;
  duplicated: number;
}

export interface MergeResult {
  presets: Preset[];
  summary: MergeSummary;
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isNonEmptyString = (v: unknown): v is string => isString(v) && v.trim().length > 0;

const isPreset = (v: unknown): v is Preset => {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  if (!isNonEmptyString(p.id)) return false;
  if (!isNonEmptyString(p.name)) return false;
  if (!isString(p.description)) return false;
  if (!Array.isArray(p.prefixes) || !p.prefixes.every(isString)) return false;
  if (!isString(p.formatRule)) return false;
  if (!isString(p.accent) || !ACCENT_VALUES.includes(p.accent as Preset['accent'])) return false;
  if (!isString(p.createdAt)) return false;
  return true;
};

export const exportPresets = (presets: Preset[]): PresetsExport => ({
  schemaVersion: PRESETS_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  presets,
});

export const exportPresetsBlob = (presets: Preset[]): Blob => {
  const payload = exportPresets(presets);
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
};

export const exportFileName = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `presets-${yyyy}-${mm}-${dd}.json`;
};

export const parseImport = (json: string): ParseResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Expected a JSON object at the top level.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.schemaVersion !== 'number') {
    return { ok: false, error: 'Missing or invalid "schemaVersion".' };
  }
  if (obj.schemaVersion !== PRESETS_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported schemaVersion ${obj.schemaVersion}. Expected ${PRESETS_SCHEMA_VERSION}.`,
    };
  }

  if (!Array.isArray(obj.presets)) {
    return { ok: false, error: 'Field "presets" must be an array.' };
  }

  for (let i = 0; i < obj.presets.length; i += 1) {
    if (!isPreset(obj.presets[i])) {
      return { ok: false, error: `Preset at index ${i} is missing required fields or has invalid values.` };
    }
  }

  const exportedAt = isString(obj.exportedAt) ? obj.exportedAt : new Date(0).toISOString();

  return {
    ok: true,
    data: {
      schemaVersion: obj.schemaVersion,
      exportedAt,
      presets: obj.presets as Preset[],
    },
  };
};

const generateImportId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `preset-${crypto.randomUUID()}`;
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const detectConflicts = (existing: Preset[], incoming: Preset[]): Set<string> => {
  const ids = new Set(existing.map((p) => p.id));
  const conflicts = new Set<string>();
  for (const inc of incoming) {
    if (ids.has(inc.id)) conflicts.add(inc.id);
  }
  return conflicts;
};

export const mergePresets = (
  existing: Preset[],
  incoming: Preset[],
  choices: Record<string, ConflictChoice>
): MergeResult => {
  const summary: MergeSummary = { added: 0, replaced: 0, skipped: 0, duplicated: 0 };
  const existingById = new Map(existing.map((p) => [p.id, p]));
  const next = [...existing];

  for (const inc of incoming) {
    const conflict = existingById.has(inc.id);
    if (!conflict) {
      next.push(inc);
      summary.added += 1;
      continue;
    }
    const choice: ConflictChoice = choices[inc.id] ?? 'skip';
    if (choice === 'skip') {
      summary.skipped += 1;
      continue;
    }
    if (choice === 'replace') {
      const idx = next.findIndex((p) => p.id === inc.id);
      if (idx >= 0) next[idx] = inc;
      summary.replaced += 1;
      continue;
    }
    // duplicate
    const renamed: Preset = {
      ...inc,
      id: generateImportId(),
      name: `${inc.name}-imported`,
    };
    next.push(renamed);
    summary.duplicated += 1;
  }

  return { presets: next, summary };
};
