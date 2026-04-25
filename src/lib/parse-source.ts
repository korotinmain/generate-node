import { BRANCH_TYPES, type BranchType } from '@/types';

export type ParseSourceKind =
  | 'jira'
  | 'linear'
  | 'github'
  | 'branch-name'
  | 'bracketed'
  | 'plain';

export interface ParseSourceResult {
  ticketId?: string;
  descriptor?: string;
  type?: BranchType;
  source: ParseSourceKind;
}

const TICKET = '[A-Z][A-Z0-9]+-\\d+';

const JIRA_URL = new RegExp(`atlassian\\.net/browse/(${TICKET})`, 'i');
const LINEAR_URL = new RegExp(
  `linear\\.app/[^/]+/issue/(${TICKET})/([^/?#\\s]+)`,
  'i'
);
const GITHUB_URL = /github\.com\/[^/]+\/[^/]+\/(?:issues|pull)\/(\d+)/i;
const BRANCH_PREFIX = new RegExp(`^(${BRANCH_TYPES.join('|')})/(.+)$`, 'i');
const BRANCH_TICKET_TAIL = new RegExp(`^(${TICKET})(?:[-/](.*))?$`, 'i');
const BRACKETED = new RegExp(`^\\[(${TICKET})\\]\\s*(.*)$`, 'i');
const PLAIN_WITH_DESC = new RegExp(`^(${TICKET})[\\s:]+(.+)$`, 'i');
const PLAIN_TICKET_ONLY = new RegExp(`^(${TICKET})$`, 'i');

const fieldCount = (r: ParseSourceResult): number =>
  (r.ticketId ? 1 : 0) + (r.descriptor ? 1 : 0) + (r.type ? 1 : 0);

/**
 * Parses free-form text into a partial GeneratorInput. Returns null when
 * nothing recognizable is found. The branch builder and store sanitizers
 * normalize the values further on commit, so this function preserves
 * casing/spacing where possible — the goal is to identify the right slots.
 */
export const parseSource = (raw: string): ParseSourceResult | null => {
  const input = raw.trim();
  if (!input) return null;

  const jira = input.match(JIRA_URL);
  if (jira) return { ticketId: jira[1].toUpperCase(), source: 'jira' };

  const linear = input.match(LINEAR_URL);
  if (linear) {
    return {
      ticketId: linear[1].toUpperCase(),
      descriptor: decodeURIComponent(linear[2]),
      source: 'linear',
    };
  }

  const gh = input.match(GITHUB_URL);
  if (gh) return { ticketId: gh[1], source: 'github' };

  const branch = input.match(BRANCH_PREFIX);
  if (branch) {
    const type = branch[1].toLowerCase() as BranchType;
    const tail = branch[2];
    const ticketTail = tail.match(BRANCH_TICKET_TAIL);
    if (ticketTail) {
      return {
        type,
        ticketId: ticketTail[1].toUpperCase(),
        descriptor: ticketTail[2] || undefined,
        source: 'branch-name',
      };
    }
    return { type, descriptor: tail, source: 'branch-name' };
  }

  const bracketed = input.match(BRACKETED);
  if (bracketed) {
    return {
      ticketId: bracketed[1].toUpperCase(),
      descriptor: bracketed[2].trim() || undefined,
      source: 'bracketed',
    };
  }

  const plainWithDesc = input.match(PLAIN_WITH_DESC);
  if (plainWithDesc) {
    return {
      ticketId: plainWithDesc[1].toUpperCase(),
      descriptor: plainWithDesc[2].trim(),
      source: 'plain',
    };
  }

  const ticketOnly = input.match(PLAIN_TICKET_ONLY);
  if (ticketOnly) {
    return { ticketId: ticketOnly[1].toUpperCase(), source: 'plain' };
  }

  return null;
};

/** True when the parse extracted at least two slots (i.e. paste should auto-split). */
export const isMultiFieldParse = (r: ParseSourceResult | null): boolean =>
  r !== null && fieldCount(r) >= 2;

/**
 * True when applying `parsed` would replace a non-empty existing value with a
 * different one. Used to gate the conflict prompt — empties always fill silently.
 */
export const hasImportConflict = (
  parsed: ParseSourceResult,
  current: { ticketId: string; descriptor: string }
): boolean => {
  const overwrites = (incoming: string | undefined, existing: string): boolean =>
    Boolean(incoming && existing.trim() && incoming.trim() !== existing.trim());
  return (
    overwrites(parsed.ticketId, current.ticketId) ||
    overwrites(parsed.descriptor, current.descriptor)
  );
};

export const SOURCE_LABEL: Record<ParseSourceKind, string> = {
  jira: 'Jira',
  linear: 'Linear',
  github: 'GitHub',
  'branch-name': 'branch name',
  bracketed: 'bracketed text',
  plain: 'text',
};
