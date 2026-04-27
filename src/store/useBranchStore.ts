import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { parseSource } from '@/lib/parse-source';
import type {
  BranchType,
  GeneratorInput,
  LogEntry,
  LogStatus,
  Operator,
  Preset,
} from '@/types';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

interface BranchStore {
  operator: Operator;
  input: GeneratorInput;
  presets: Preset[];
  logs: LogEntry[];
  ruleViolations: number;
  generationCount: number;

  setType: (type: BranchType) => void;
  setTicketId: (ticketId: string) => void;
  setDescriptor: (descriptor: string) => void;
  setPresetId: (presetId: string | null) => void;
  resetInput: () => void;

  recordLog: (entry: {
    branchName: string;
    status: LogStatus;
    type: BranchType;
    inputSnapshot?: GeneratorInput;
  }) => LogEntry;
  clearLogs: () => void;
  reuseLog: (id: string) => boolean;

  addPreset: (preset: Omit<Preset, 'id' | 'createdAt'>) => Preset;
  updatePreset: (id: string, patch: Partial<Omit<Preset, 'id' | 'createdAt'>>) => void;
  removePreset: (id: string) => void;
  setPresets: (presets: Preset[]) => void;
  setOperator: (patch: Partial<Operator>) => void;
}

const DEFAULT_INPUT: GeneratorInput = {
  type: 'feature',
  ticketId: '',
  descriptor: '',
  presetId: null,
};

const DEFAULT_OPERATOR: Operator = {
  handle: 'OPERATOR_01',
  authLevel: 'LEVEL_3_AUTH',
};

const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'preset-web',
    name: 'Web App',
    description: 'Standard React/Vue frontend repository naming rules.',
    prefixes: ['feature/', 'bugfix/', 'hotfix/', 'chore/'],
    formatRule: '{prefix}/{ticket-id}-{short-desc}',
    accent: 'cyan',
    createdAt: new Date('2025-09-12T09:00:00Z').toISOString(),
  },
  {
    id: 'preset-mobile',
    name: 'Mobile API',
    description: 'Backend endpoints supporting iOS/Android clients.',
    prefixes: ['endpoint/', 'schema/', 'sec/'],
    formatRule: '{prefix}/v{version}-{action}',
    accent: 'magenta',
    createdAt: new Date('2025-10-02T12:30:00Z').toISOString(),
  },
  {
    id: 'preset-data',
    name: 'Data Engine',
    description: 'ETL pipelines and machine learning data models.',
    prefixes: ['model/', 'pipe/', 'data/'],
    formatRule: '{prefix}/{dataset}_{operation}',
    accent: 'violet',
    createdAt: new Date('2025-11-18T14:12:00Z').toISOString(),
  },
];

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      operator: DEFAULT_OPERATOR,
      input: DEFAULT_INPUT,
      presets: DEFAULT_PRESETS,
      logs: [],
      ruleViolations: 0,
      generationCount: 0,

      setType: (type) => set((s) => ({ input: { ...s.input, type } })),
      setTicketId: (ticketId) => set((s) => ({ input: { ...s.input, ticketId } })),
      setDescriptor: (descriptor) => set((s) => ({ input: { ...s.input, descriptor } })),
      setPresetId: (presetId) => set((s) => ({ input: { ...s.input, presetId } })),
      resetInput: () =>
        set((s) => ({
          input: { ...DEFAULT_INPUT, type: s.input.type, presetId: s.input.presetId },
        })),

      recordLog: ({ branchName, status, type, inputSnapshot }) => {
        const { operator } = get();
        const entry: LogEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          branchName,
          author: operator.handle,
          authorTag: operator.handle.slice(0, 2).toUpperCase(),
          status,
          type,
          ...(inputSnapshot ? { inputSnapshot: { ...inputSnapshot } } : {}),
        };
        set((s) => ({
          logs: [entry, ...s.logs].slice(0, 200),
          generationCount: s.generationCount + 1,
        }));
        return entry;
      },

      clearLogs: () => set({ logs: [] }),

      reuseLog: (id) => {
        const log = get().logs.find((l) => l.id === id);
        if (!log) return false;

        if (log.inputSnapshot) {
          set((s) => ({
            input: {
              ...s.input,
              type: log.inputSnapshot!.type,
              ticketId: log.inputSnapshot!.ticketId,
              descriptor: log.inputSnapshot!.descriptor,
              presetId: log.inputSnapshot!.presetId,
            },
          }));
          return true;
        }

        // Legacy entry — best-effort parse from branchName.
        const parsed = parseSource(log.branchName);
        set((s) => ({
          input: {
            ...s.input,
            type: parsed?.type ?? log.type,
            ticketId: parsed?.ticketId ?? '',
            descriptor: parsed?.descriptor ?? '',
          },
        }));
        return true;
      },

      addPreset: (preset) => {
        const created: Preset = {
          ...preset,
          id: `preset-${generateId()}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ presets: [...s.presets, created] }));
        return created;
      },

      updatePreset: (id, patch) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),

      setPresets: (presets) => set({ presets }),

      setOperator: (patch) =>
        set((s) => ({ operator: { ...s.operator, ...patch } })),
    }),
    {
      name: 'branch-cmd-store',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        operator: state.operator,
        input: state.input,
        presets: state.presets,
        logs: state.logs,
        ruleViolations: state.ruleViolations,
        generationCount: state.generationCount,
      }),
    }
  )
);
