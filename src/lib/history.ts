import { parseSource } from '@/lib/parse-source';
import type { LogEntry } from '@/types';

export type HistoryField = 'ticketId' | 'descriptor';

const MAX_SUGGESTIONS = 5;

const valueFromLog = (log: LogEntry, field: HistoryField): string | undefined => {
  if (log.inputSnapshot) {
    const v = log.inputSnapshot[field];
    return v && v.trim() ? v.trim() : undefined;
  }
  const parsed = parseSource(log.branchName);
  if (!parsed) return undefined;
  const v = parsed[field];
  return v && v.trim() ? v.trim() : undefined;
};

const dedupeCaseInsensitive = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
};

/**
 * Returns recent distinct values for a given field across logs.
 * Logs are assumed pre-sorted newest-first (the store keeps them this way).
 * Excludes any value matching the user's current input (case-insensitive).
 * Prefix-filters when `query` is non-empty; otherwise returns the most recent values.
 */
export const recentValues = (
  logs: LogEntry[],
  field: HistoryField,
  query: string,
  limit: number = MAX_SUGGESTIONS
): string[] => {
  const trimmedQuery = query.trim().toLowerCase();
  const collected: string[] = [];
  for (const log of logs) {
    const v = valueFromLog(log, field);
    if (!v) continue;
    if (v.toLowerCase() === trimmedQuery) continue;
    if (trimmedQuery && !v.toLowerCase().startsWith(trimmedQuery)) continue;
    collected.push(v);
  }
  return dedupeCaseInsensitive(collected).slice(0, limit);
};
