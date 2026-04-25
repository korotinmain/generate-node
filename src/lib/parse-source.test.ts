import { describe, expect, it } from 'vitest';
import { hasImportConflict, isMultiFieldParse, parseSource } from './parse-source';

describe('parseSource', () => {
  it('extracts ticket from a Jira URL', () => {
    const r = parseSource('https://acme.atlassian.net/browse/PROJ-123');
    expect(r).toEqual({ ticketId: 'PROJ-123', source: 'jira' });
  });

  it('extracts ticket and descriptor from a Linear URL', () => {
    const r = parseSource('https://linear.app/acme/issue/TEAM-42/login-modal-redesign');
    expect(r).toEqual({
      ticketId: 'TEAM-42',
      descriptor: 'login-modal-redesign',
      source: 'linear',
    });
  });

  it('ignores Linear URL query and fragment in the descriptor slug', () => {
    const r = parseSource('https://linear.app/acme/issue/TEAM-42/login-modal?from=email#x');
    expect(r?.descriptor).toBe('login-modal');
  });

  it('extracts issue number from a GitHub issue URL', () => {
    const r = parseSource('https://github.com/org/repo/issues/77');
    expect(r).toEqual({ ticketId: '77', source: 'github' });
  });

  it('extracts issue number from a GitHub pull URL', () => {
    const r = parseSource('https://github.com/org/repo/pull/12');
    expect(r).toEqual({ ticketId: '12', source: 'github' });
  });

  it('reverse-parses a full branch name', () => {
    const r = parseSource('feature/PROJ-123-update-login-modal');
    expect(r).toEqual({
      type: 'feature',
      ticketId: 'PROJ-123',
      descriptor: 'update-login-modal',
      source: 'branch-name',
    });
  });

  it('reverse-parses a branch name with no descriptor', () => {
    const r = parseSource('hotfix/PROJ-9');
    expect(r).toEqual({
      type: 'hotfix',
      ticketId: 'PROJ-9',
      descriptor: undefined,
      source: 'branch-name',
    });
  });

  it('parses a bracketed [TICKET] descriptor', () => {
    const r = parseSource('[PROJ-123] Update login modal');
    expect(r).toEqual({
      ticketId: 'PROJ-123',
      descriptor: 'Update login modal',
      source: 'bracketed',
    });
  });

  it('parses plain TICKET-123 descriptor', () => {
    const r = parseSource('PROJ-123 Update login modal');
    expect(r).toEqual({
      ticketId: 'PROJ-123',
      descriptor: 'Update login modal',
      source: 'plain',
    });
  });

  it('parses TICKET-123: descriptor with colon separator', () => {
    const r = parseSource('PROJ-123: Update login modal');
    expect(r?.ticketId).toBe('PROJ-123');
    expect(r?.descriptor).toBe('Update login modal');
  });

  it('parses a bare ticket id alone', () => {
    const r = parseSource('proj-9');
    expect(r).toEqual({ ticketId: 'PROJ-9', source: 'plain' });
  });

  it('returns null for empty string', () => {
    expect(parseSource('')).toBeNull();
    expect(parseSource('   ')).toBeNull();
  });

  it('returns null for unparseable text', () => {
    expect(parseSource('hello world')).toBeNull();
    expect(parseSource('https://example.com/anything')).toBeNull();
  });
});

describe('isMultiFieldParse', () => {
  it('is false for null', () => {
    expect(isMultiFieldParse(null)).toBe(false);
  });

  it('is false when only ticket is extracted', () => {
    expect(isMultiFieldParse({ ticketId: 'PROJ-1', source: 'jira' })).toBe(false);
  });

  it('is true when ticket and descriptor are extracted', () => {
    expect(
      isMultiFieldParse({ ticketId: 'PROJ-1', descriptor: 'x', source: 'plain' })
    ).toBe(true);
  });

  it('is true when type, ticket, and descriptor are extracted', () => {
    expect(
      isMultiFieldParse({
        type: 'feature',
        ticketId: 'PROJ-1',
        descriptor: 'x',
        source: 'branch-name',
      })
    ).toBe(true);
  });
});

describe('hasImportConflict', () => {
  const parsed = { ticketId: 'NEW-1', descriptor: 'new', source: 'plain' as const };

  it('is false when both current fields are empty', () => {
    expect(hasImportConflict(parsed, { ticketId: '', descriptor: '' })).toBe(false);
  });

  it('is true when one existing field differs from incoming, even if the other is empty', () => {
    expect(hasImportConflict(parsed, { ticketId: 'OLD-1', descriptor: '' })).toBe(true);
  });

  it('is false when incoming matches current values', () => {
    expect(
      hasImportConflict(parsed, { ticketId: 'NEW-1', descriptor: 'new' })
    ).toBe(false);
  });

  it('is true when both current fields are non-empty and different', () => {
    expect(
      hasImportConflict(parsed, { ticketId: 'OLD-1', descriptor: 'old' })
    ).toBe(true);
  });

  it('is false when parsed has no ticket or descriptor', () => {
    expect(
      hasImportConflict(
        { source: 'jira' },
        { ticketId: 'OLD-1', descriptor: 'old' }
      )
    ).toBe(false);
  });
});
