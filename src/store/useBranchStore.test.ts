import { beforeEach, describe, expect, it } from 'vitest';
import { useBranchStore } from './useBranchStore';
import type { LogEntry } from '@/types';

const baseLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'log-1',
  timestamp: new Date('2026-04-22T12:00:00Z').toISOString(),
  branchName: 'feature/PROJ-123-update-login',
  author: 'OPERATOR_01',
  authorTag: 'OP',
  status: 'copied',
  type: 'feature',
  ...overrides,
});

describe('useBranchStore.reuseLog', () => {
  beforeEach(() => {
    useBranchStore.setState({
      input: { type: 'feature', ticketId: '', descriptor: '', presetId: null },
      logs: [],
    });
  });

  it('fills input from inputSnapshot when present', () => {
    const log = baseLog({
      inputSnapshot: {
        type: 'hotfix',
        ticketId: 'OPS-7',
        descriptor: 'patch-auth',
        presetId: 'preset-mobile',
      },
    });
    useBranchStore.setState({ logs: [log] });

    const ok = useBranchStore.getState().reuseLog(log.id);
    expect(ok).toBe(true);

    const input = useBranchStore.getState().input;
    expect(input.type).toBe('hotfix');
    expect(input.ticketId).toBe('OPS-7');
    expect(input.descriptor).toBe('patch-auth');
    expect(input.presetId).toBe('preset-mobile');
  });

  it('falls back to parseSource when no snapshot exists (legacy entry)', () => {
    const log = baseLog({ branchName: 'feature/PROJ-123-update-login-modal' });
    useBranchStore.setState({ logs: [log] });

    const ok = useBranchStore.getState().reuseLog(log.id);
    expect(ok).toBe(true);

    const input = useBranchStore.getState().input;
    expect(input.type).toBe('feature');
    expect(input.ticketId).toBe('PROJ-123');
    expect(input.descriptor).toBe('update-login-modal');
  });

  it('falls back gracefully when branch name is unparseable', () => {
    const log = baseLog({ branchName: 'something-unstructured', type: 'bugfix' });
    useBranchStore.setState({ logs: [log] });

    const ok = useBranchStore.getState().reuseLog(log.id);
    expect(ok).toBe(true);

    const input = useBranchStore.getState().input;
    expect(input.type).toBe('bugfix'); // falls back to log.type
    expect(input.ticketId).toBe('');
    expect(input.descriptor).toBe('');
  });

  it('returns false when the log id is unknown', () => {
    expect(useBranchStore.getState().reuseLog('nope')).toBe(false);
  });
});

describe('useBranchStore.recordLog', () => {
  beforeEach(() => {
    useBranchStore.setState({ logs: [], generationCount: 0 });
  });

  it('persists inputSnapshot when provided', () => {
    const entry = useBranchStore.getState().recordLog({
      branchName: 'feature/X-1',
      status: 'copied',
      type: 'feature',
      inputSnapshot: { type: 'feature', ticketId: 'X-1', descriptor: 'go', presetId: null },
    });
    expect(entry.inputSnapshot).toEqual({
      type: 'feature',
      ticketId: 'X-1',
      descriptor: 'go',
      presetId: null,
    });
  });

  it('omits inputSnapshot when not provided', () => {
    const entry = useBranchStore.getState().recordLog({
      branchName: 'feature/X-1',
      status: 'copied',
      type: 'feature',
    });
    expect(entry.inputSnapshot).toBeUndefined();
  });
});
