import { describe, expect, it } from 'vitest';
import { buildBranchName, sanitizeSegment, sanitizeTicketId } from './branch';

describe('sanitizeSegment', () => {
  it('lowercases and normalizes spaces to dashes', () => {
    expect(sanitizeSegment('Update Login MODAL')).toBe('update-login-modal');
  });

  it('collapses repeated separators', () => {
    expect(sanitizeSegment('hello---world')).toBe('hello-world');
    expect(sanitizeSegment('a__b__c')).toBe('a-b-c');
  });

  it('trims leading and trailing separators', () => {
    expect(sanitizeSegment('/-hello-/')).toBe('hello');
  });

  it('strips non-git-safe characters', () => {
    expect(sanitizeSegment('hello@world!#$')).toBe('hello-world');
  });
});

describe('sanitizeTicketId', () => {
  it('uppercases and keeps hyphens', () => {
    expect(sanitizeTicketId('proj-123')).toBe('PROJ-123');
  });

  it('strips invalid characters', () => {
    expect(sanitizeTicketId('proj_123!')).toBe('PROJ123');
  });
});

describe('buildBranchName', () => {
  it('produces a canonical feature branch', () => {
    const r = buildBranchName({
      type: 'feature',
      ticketId: 'proj-123',
      descriptor: 'Update Login Modal',
    });
    expect(r.branchName).toBe('feature/PROJ-123-update-login-modal');
    expect(r.command).toBe('git checkout -b feature/PROJ-123-update-login-modal');
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('flags missing descriptor', () => {
    const r = buildBranchName({ type: 'bugfix', ticketId: 'PROJ-1', descriptor: '' });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('DESCRIPTOR required');
  });

  it('flags missing ticket when format requires it', () => {
    const r = buildBranchName({ type: 'hotfix', ticketId: '', descriptor: 'patch-flow' });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('TICKET_ID required');
  });

  it('respects a custom format rule (version/action)', () => {
    const r = buildBranchName({
      type: 'feature',
      ticketId: '',
      descriptor: '2.1',
      formatRule: '{prefix}/v{version}-{action}',
    });
    expect(r.branchName).toBe('feature/v2.1-2.1');
    expect(r.isValid).toBe(true);
  });

  it('respects a dataset/operation format rule', () => {
    const r = buildBranchName({
      type: 'feature',
      ticketId: '',
      descriptor: 'users-backfill-emails',
      formatRule: '{prefix}/{dataset}_{operation}',
    });
    expect(r.branchName).toBe('feature/users_backfill-emails');
    expect(r.isValid).toBe(true);
  });

  it('cleans up empty ticket segments in format', () => {
    // If a rule has {ticket-id}- but no ticket is provided, it shouldn't leave dashes.
    const r = buildBranchName({
      type: 'feature',
      ticketId: 'PROJ-9',
      descriptor: 'login',
      formatRule: '{prefix}/{ticket-id}-{short-desc}',
    });
    expect(r.branchName).toBe('feature/PROJ-9-login');
  });
});
