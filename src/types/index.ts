export type BranchType = 'feature' | 'bugfix' | 'hotfix' | 'release';

export const BRANCH_TYPES: readonly BranchType[] = [
  'feature',
  'bugfix',
  'hotfix',
  'release',
] as const;

export type LogStatus = 'committed' | 'copied' | 'terminated';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO
  branchName: string;
  author: string;
  authorTag: string; // short 2-char tag, e.g. "OP"
  status: LogStatus;
  type: BranchType;
  inputSnapshot?: GeneratorInput;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  prefixes: string[];
  formatRule: string; // e.g. "{prefix}/{ticket-id}-{short-desc}"
  accent: 'cyan' | 'magenta' | 'violet';
  createdAt: string;
}

export interface GeneratorInput {
  type: BranchType;
  ticketId: string;
  descriptor: string;
  presetId: string | null;
}

export interface Operator {
  handle: string;
  authLevel: string;
  avatarUrl?: string;
}
