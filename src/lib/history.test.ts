import { describe, expect, it } from 'vitest';
import { recentValues } from './history';
import type { LogEntry } from '@/types';

const log = (overrides: Partial<LogEntry>): LogEntry => ({
  id: overrides.id ?? 'l',
  timestamp: overrides.timestamp ?? new Date('2026-04-22T12:00:00Z').toISOString(),
  branchName: overrides.branchName ?? 'feature/X-1-y',
  author: 'OPERATOR_01',
  authorTag: 'OP',
  status: 'copied',
  type: 'feature',
  ...overrides,
});

describe('recentValues', () => {
  it('reads ticketId from inputSnapshot when present', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: 'PROJ-123', descriptor: 'a', presetId: null } }),
    ];
    expect(recentValues(logs, 'ticketId', '')).toEqual(['PROJ-123']);
  });

  it('falls back to parseSource(branchName) when no snapshot', () => {
    const logs = [log({ id: '1', branchName: 'feature/PROJ-99-update-modal' })];
    expect(recentValues(logs, 'ticketId', '')).toEqual(['PROJ-99']);
    expect(recentValues(logs, 'descriptor', '')).toEqual(['update-modal']);
  });

  it('dedupes case-insensitively keeping the first (most recent) form', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: 'Proj-1', descriptor: 'x', presetId: null } }),
      log({ id: '2', inputSnapshot: { type: 'feature', ticketId: 'PROJ-1', descriptor: 'x', presetId: null } }),
    ];
    expect(recentValues(logs, 'ticketId', '')).toEqual(['Proj-1']);
  });

  it('respects log order (newest-first) for recency', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: 'A-1', descriptor: '', presetId: null } }),
      log({ id: '2', inputSnapshot: { type: 'feature', ticketId: 'B-2', descriptor: '', presetId: null } }),
      log({ id: '3', inputSnapshot: { type: 'feature', ticketId: 'C-3', descriptor: '', presetId: null } }),
    ];
    expect(recentValues(logs, 'ticketId', '')).toEqual(['A-1', 'B-2', 'C-3']);
  });

  it('caps to 5 by default', () => {
    const logs = Array.from({ length: 10 }, (_, i) =>
      log({
        id: `l${i}`,
        inputSnapshot: { type: 'feature', ticketId: `T-${i}`, descriptor: '', presetId: null },
      })
    );
    expect(recentValues(logs, 'ticketId', '')).toHaveLength(5);
  });

  it('filters by case-insensitive prefix when query is non-empty', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: 'PROJ-12', descriptor: '', presetId: null } }),
      log({ id: '2', inputSnapshot: { type: 'feature', ticketId: 'OPS-3', descriptor: '', presetId: null } }),
      log({ id: '3', inputSnapshot: { type: 'feature', ticketId: 'PROJ-99', descriptor: '', presetId: null } }),
    ];
    expect(recentValues(logs, 'ticketId', 'proj')).toEqual(['PROJ-12', 'PROJ-99']);
  });

  it('excludes a suggestion that exactly matches the current input', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: 'PROJ-12', descriptor: '', presetId: null } }),
      log({ id: '2', inputSnapshot: { type: 'feature', ticketId: 'PROJ-99', descriptor: '', presetId: null } }),
    ];
    // Query "PROJ" matches both, but "PROJ-12" exact match is excluded.
    expect(recentValues(logs, 'ticketId', 'PROJ')).toEqual(['PROJ-12', 'PROJ-99']);
    expect(recentValues(logs, 'ticketId', 'proj-12')).toEqual([]);
  });

  it('skips logs whose snapshot field is empty', () => {
    const logs = [
      log({ id: '1', inputSnapshot: { type: 'feature', ticketId: '', descriptor: 'only-desc', presetId: null } }),
      log({ id: '2', inputSnapshot: { type: 'feature', ticketId: 'A-1', descriptor: '', presetId: null } }),
    ];
    expect(recentValues(logs, 'ticketId', '')).toEqual(['A-1']);
    expect(recentValues(logs, 'descriptor', '')).toEqual(['only-desc']);
  });
});
