import { describe, expect, it } from 'vitest';
import type { Preset } from '@/types';
import {
  detectConflicts,
  exportFileName,
  exportPresets,
  exportPresetsBlob,
  mergePresets,
  parseImport,
  PRESETS_SCHEMA_VERSION,
} from './presets-io';

const presetA: Preset = {
  id: 'preset-a',
  name: 'Alpha',
  description: 'first',
  prefixes: ['feature/'],
  formatRule: '{prefix}/{ticket-id}',
  accent: 'cyan',
  createdAt: '2025-09-12T09:00:00.000Z',
};

const presetB: Preset = {
  id: 'preset-b',
  name: 'Bravo',
  description: 'second',
  prefixes: ['bugfix/'],
  formatRule: '{prefix}/{short-desc}',
  accent: 'magenta',
  createdAt: '2025-10-02T12:30:00.000Z',
};

describe('exportPresets', () => {
  it('builds a versioned payload with timestamp and presets', () => {
    const out = exportPresets([presetA, presetB]);
    expect(out.schemaVersion).toBe(PRESETS_SCHEMA_VERSION);
    expect(out.presets).toEqual([presetA, presetB]);
    expect(typeof out.exportedAt).toBe('string');
    expect(Number.isNaN(Date.parse(out.exportedAt))).toBe(false);
  });

  it('produces a JSON blob round-trippable through parseImport', () => {
    const blob = exportPresetsBlob([presetA]);
    expect(blob.type).toBe('application/json');
  });

  it('formats filename as presets-YYYY-MM-DD.json', () => {
    expect(exportFileName(new Date('2026-04-25T12:00:00Z'))).toMatch(/^presets-2026-04-\d{2}\.json$/);
  });
});

describe('parseImport', () => {
  it('accepts a valid export payload', () => {
    const json = JSON.stringify(exportPresets([presetA]));
    const res = parseImport(json);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.presets).toHaveLength(1);
      expect(res.data.presets[0].id).toBe('preset-a');
    }
  });

  it('rejects non-JSON input', () => {
    const res = parseImport('not-json{');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not valid JSON/i);
  });

  it('rejects payload with the wrong shape', () => {
    const res = parseImport(JSON.stringify(['just', 'an', 'array']));
    expect(res.ok).toBe(false);
  });

  it('rejects unknown schemaVersion', () => {
    const res = parseImport(
      JSON.stringify({ schemaVersion: 2, exportedAt: '2026-01-01T00:00:00Z', presets: [] })
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/schemaVersion 2/);
  });

  it('rejects a preset missing required fields', () => {
    const broken = {
      schemaVersion: PRESETS_SCHEMA_VERSION,
      exportedAt: '2026-01-01T00:00:00Z',
      presets: [{ id: 'x', name: 'X' }],
    };
    const res = parseImport(JSON.stringify(broken));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/index 0/);
  });

  it('rejects an invalid accent value', () => {
    const broken = {
      schemaVersion: PRESETS_SCHEMA_VERSION,
      exportedAt: '2026-01-01T00:00:00Z',
      presets: [{ ...presetA, accent: 'red' }],
    };
    const res = parseImport(JSON.stringify(broken));
    expect(res.ok).toBe(false);
  });

  it('round-trips export → import preserving preset content', () => {
    const json = JSON.stringify(exportPresets([presetA, presetB]));
    const res = parseImport(json);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.presets).toEqual([presetA, presetB]);
    }
  });
});

describe('detectConflicts', () => {
  it('returns the set of incoming ids already present', () => {
    const conflicts = detectConflicts([presetA], [presetA, presetB]);
    expect(conflicts.has('preset-a')).toBe(true);
    expect(conflicts.has('preset-b')).toBe(false);
  });
});

describe('mergePresets', () => {
  it('appends non-conflicting presets', () => {
    const r = mergePresets([presetA], [presetB], {});
    expect(r.presets).toHaveLength(2);
    expect(r.summary).toEqual({ added: 1, replaced: 0, skipped: 0, duplicated: 0 });
  });

  it('skips conflicts when chosen', () => {
    const updated = { ...presetA, name: 'Alpha-v2' };
    const r = mergePresets([presetA], [updated], { 'preset-a': 'skip' });
    expect(r.presets).toEqual([presetA]);
    expect(r.summary.skipped).toBe(1);
  });

  it('replaces conflicts when chosen', () => {
    const updated = { ...presetA, name: 'Alpha-v2' };
    const r = mergePresets([presetA], [updated], { 'preset-a': 'replace' });
    expect(r.presets).toHaveLength(1);
    expect(r.presets[0].name).toBe('Alpha-v2');
    expect(r.summary.replaced).toBe(1);
  });

  it('duplicates with a fresh id and -imported suffix', () => {
    const r = mergePresets([presetA], [presetA], { 'preset-a': 'duplicate' });
    expect(r.presets).toHaveLength(2);
    expect(r.presets[0]).toEqual(presetA);
    expect(r.presets[1].id).not.toBe('preset-a');
    expect(r.presets[1].name).toBe('Alpha-imported');
    expect(r.summary.duplicated).toBe(1);
  });

  it('handles a mix of strategies in one pass', () => {
    const updatedA = { ...presetA, name: 'Alpha-v2' };
    const r = mergePresets([presetA], [updatedA, presetB], {
      'preset-a': 'replace',
    });
    expect(r.presets).toHaveLength(2);
    expect(r.presets.find((p) => p.id === 'preset-a')?.name).toBe('Alpha-v2');
    expect(r.summary).toEqual({ added: 1, replaced: 1, skipped: 0, duplicated: 0 });
  });

  it('round-trip with replace-all yields equivalent set', () => {
    const json = JSON.stringify(exportPresets([presetA, presetB]));
    const res = parseImport(json);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const choices: Record<string, 'replace'> = {
      'preset-a': 'replace',
      'preset-b': 'replace',
    };
    const r = mergePresets([presetA, presetB], res.data.presets, choices);
    expect(r.presets).toEqual([presetA, presetB]);
  });
});
