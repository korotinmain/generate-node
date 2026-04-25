import type { BranchType, Preset } from '@/types';

const SANITIZE_TRAILING = /^[-_/\s]+|[-_/\s]+$/g;

/**
 * Git-safe branch names: lowercase ascii, hyphens for separators, no consecutive
 * slashes or dots, no control chars. Matches the subset of `git check-ref-format`
 * that's practical to validate client-side.
 */
export const sanitizeSegment = (raw: string): string => {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed
    .replace(/_+/g, '-')
    .replace(/[^a-z0-9./-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(SANITIZE_TRAILING, '');
};

export const sanitizeTicketId = (raw: string): string => {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]+/g, '').replace(/-{2,}/g, '-');
};

export interface BuildBranchOptions {
  type: BranchType;
  ticketId: string;
  descriptor: string;
  formatRule?: string;
}

export interface BuildBranchResult {
  branchName: string;
  command: string;
  isValid: boolean;
  errors: string[];
}

const TOKEN = /\{([a-z0-9-]+)\}/gi;

const resolveToken = (token: string, ctx: Record<string, string>): string => {
  return ctx[token] ?? `{${token}}`;
};

/**
 * Format rule tokens supported:
 *   {prefix}     – branch type (feature, bugfix, ...)
 *   {ticket-id}  – sanitized ticket id
 *   {short-desc} – sanitized descriptor
 *   {descriptor} – alias for short-desc
 *   {version}    – descriptor treated as version (digits/dots) for release preset
 *   {action}     – descriptor used as action verb
 *   {dataset}    – first hyphen-separated token of descriptor
 *   {operation}  – second+ token of descriptor
 */
export const buildBranchName = ({
  type,
  ticketId,
  descriptor,
  formatRule = '{prefix}/{ticket-id}-{short-desc}',
}: BuildBranchOptions): BuildBranchResult => {
  const errors: string[] = [];

  const sanitizedTicket = sanitizeTicketId(ticketId);
  const sanitizedDesc = sanitizeSegment(descriptor);

  if (!descriptor.trim()) errors.push('DESCRIPTOR required');
  else if (sanitizedDesc.length < 2) errors.push('DESCRIPTOR too short');

  if (formatRule.includes('{ticket-id}') && !sanitizedTicket) {
    errors.push('TICKET_ID required');
  }

  const descTokens = sanitizedDesc.split('-').filter(Boolean);

  const ctx: Record<string, string> = {
    prefix: type,
    'ticket-id': sanitizedTicket,
    'short-desc': sanitizedDesc,
    descriptor: sanitizedDesc,
    version: sanitizedDesc.replace(/[^0-9.]/g, '') || 'x',
    action: sanitizedDesc,
    dataset: descTokens[0] ?? '',
    operation: descTokens.slice(1).join('-') || descTokens[0] || '',
  };

  let branchName = formatRule.replace(TOKEN, (_, key) => resolveToken(key, ctx));

  // Collapse empty {ticket-id}- fragments (when ticket absent but rule has it)
  branchName = branchName
    .replace(/\/-+/g, '/')
    .replace(/-+\//g, '/')
    .replace(/\/+/g, '/')
    .replace(/-{2,}/g, '-')
    .replace(SANITIZE_TRAILING, '');

  const isValid = errors.length === 0 && branchName.length > 0;
  const command = `git checkout -b ${branchName}`;

  return { branchName, command, isValid, errors };
};

export const presetForType = (presets: Preset[], type: BranchType): Preset | undefined => {
  const prefix = `${type}/`;
  return presets.find((p) => p.prefixes.includes(prefix));
};
