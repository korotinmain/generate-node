import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  GitBranch,
  History,
  LayoutGrid,
  Navigation,
  Search,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { rank } from '@/lib/fuzzy';
import { useBranchStore } from '@/store/useBranchStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useToastStore } from '@/store/useToastStore';
import { copyToClipboard } from '@/lib/clipboard';
import { ScanLine } from '@/components/ui/ScanLine';
import { BRANCH_TYPES, type BranchType } from '@/types';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type CommandGroup = 'branch-type' | 'preset' | 'recent' | 'navigate' | 'action';

interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  group: CommandGroup;
  keywords: string;
  run: () => void;
}

const GROUP_ORDER: CommandGroup[] = ['recent', 'branch-type', 'preset', 'navigate', 'action'];

const GROUP_LABEL: Record<CommandGroup, string> = {
  'branch-type': 'Branch Type',
  preset: 'Preset',
  recent: 'Recent',
  navigate: 'Navigate',
  action: 'Action',
};

const GROUP_ICON: Record<CommandGroup, ReactNode> = {
  'branch-type': <GitBranch className="h-3 w-3" />,
  preset: <LayoutGrid className="h-3 w-3" />,
  recent: <History className="h-3 w-3" />,
  navigate: <Navigation className="h-3 w-3" />,
  action: <Sparkles className="h-3 w-3" />,
};

export const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const listboxId = useId();

  const presets = useBranchStore((s) => s.presets);
  const logs = useBranchStore((s) => s.logs);
  const setType = useBranchStore((s) => s.setType);
  const setPresetId = useBranchStore((s) => s.setPresetId);
  const reuseLog = useBranchStore((s) => s.reuseLog);
  const resetInput = useBranchStore((s) => s.resetInput);
  const clearLogs = useBranchStore((s) => s.clearLogs);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const pushToast = useToastStore((s) => s.push);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<PaletteCommand[]>(() => {
    const list: PaletteCommand[] = [];

    // Branch types
    for (const t of BRANCH_TYPES) {
      list.push({
        id: `type:${t}`,
        label: `Switch to ${t}`,
        group: 'branch-type',
        keywords: `branch type ${t}`,
        run: () => {
          setType(t as BranchType);
          navigate('/');
          pushToast({ message: `Branch type → ${t}`, variant: 'info' });
        },
      });
    }

    // Presets
    for (const p of presets) {
      list.push({
        id: `preset:${p.id}`,
        label: `Apply preset: ${p.name}`,
        hint: p.formatRule,
        group: 'preset',
        keywords: `preset ${p.name} ${p.description} ${p.formatRule}`,
        run: () => {
          setPresetId(p.id);
          navigate('/');
          pushToast({ message: `Preset → ${p.name}`, variant: 'success' });
        },
      });
    }

    // Recent log entries (top 5)
    for (const log of logs.slice(0, 5)) {
      list.push({
        id: `recent:${log.id}`,
        label: `Reuse: ${log.branchName}`,
        hint: log.author,
        group: 'recent',
        keywords: `recent reuse ${log.branchName} ${log.author}`,
        run: () => {
          const ok = reuseLog(log.id);
          if (ok) {
            navigate('/');
            pushToast({ message: 'Loaded log into Generator', variant: 'success' });
          }
        },
      });
    }

    // Navigate
    list.push(
      {
        id: 'nav:generator',
        label: 'Go to Generator',
        group: 'navigate',
        keywords: 'navigate go generator home /',
        run: () => navigate('/'),
      },
      {
        id: 'nav:registry',
        label: 'Go to Registry',
        group: 'navigate',
        keywords: 'navigate go registry presets',
        run: () => navigate('/registry'),
      },
      {
        id: 'nav:logs',
        label: 'Go to Logs',
        group: 'navigate',
        keywords: 'navigate go logs history',
        run: () => navigate('/logs'),
      }
    );

    // Actions
    list.push(
      {
        id: 'action:clear-inputs',
        label: 'Clear inputs',
        group: 'action',
        keywords: 'clear reset inputs ticket descriptor',
        run: () => {
          resetInput();
          pushToast({ message: 'Inputs cleared', variant: 'info' });
        },
      },
      {
        id: 'action:copy-last',
        label: 'Copy last branch name',
        hint: logs[0]?.branchName,
        group: 'action',
        keywords: 'copy last branch clipboard',
        run: async () => {
          const last = logs[0];
          if (!last) {
            pushToast({ message: 'No logs to copy from', variant: 'error' });
            return;
          }
          const ok = await copyToClipboard(last.branchName);
          pushToast({
            message: ok ? 'Last branch copied' : 'Clipboard sync failed',
            variant: ok ? 'success' : 'error',
          });
        },
      },
      {
        id: 'action:clear-logs',
        label: 'Clear all logs',
        group: 'action',
        keywords: 'clear logs history',
        run: () => {
          clearLogs();
          pushToast({ message: 'Log buffer cleared', variant: 'info' });
        },
      },
      {
        id: 'action:toggle-theme',
        label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
        group: 'action',
        keywords: 'theme dark light toggle switch appearance',
        run: () => {
          toggleTheme();
          pushToast({
            message: `Theme → ${theme === 'dark' ? 'light' : 'dark'}`,
            variant: 'info',
          });
        },
      }
    );

    return list;
  }, [
    presets,
    logs,
    setType,
    setPresetId,
    reuseLog,
    resetInput,
    clearLogs,
    theme,
    toggleTheme,
    navigate,
    pushToast,
  ]);

  const filtered = useMemo(() => {
    const ranked = rank(commands, query, (c) => `${c.label} ${c.keywords}`);
    return ranked.map((r) => r.item);
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<CommandGroup, PaletteCommand[]>();
    for (const cmd of filtered) {
      const arr = map.get(cmd.group) ?? [];
      arr.push(cmd);
      map.set(cmd.group, arr);
    }
    const ordered: { group: CommandGroup; items: PaletteCommand[] }[] = [];
    for (const g of GROUP_ORDER) {
      const items = map.get(g);
      if (items && items.length > 0) ordered.push({ group: g, items });
    }
    return ordered;
  }, [filtered]);

  // Flatten ordered list for keyboard nav (matches render order).
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    if (open) {
      triggerElRef.current = (document.activeElement as HTMLElement) ?? null;
      setQuery('');
      setActiveIndex(0);
      // Focus next tick so the modal's animate-in doesn't steal focus.
      window.setTimeout(() => inputRef.current?.focus(), 30);
    } else if (triggerElRef.current) {
      triggerElRef.current.focus();
      triggerElRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= flat.length) setActiveIndex(Math.max(0, flat.length - 1));
  }, [flat.length, activeIndex]);

  // Scroll active item into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const runActive = () => {
    const cmd = flat[activeIndex];
    if (!cmd) return;
    cmd.run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      // Trap focus inside the palette — only the search input is tabbable.
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length === 0) return;
      setActiveIndex((i) => (i + 1) % flat.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runActive();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < flat.length) {
        e.preventDefault();
        flat[idx].run();
        onClose();
      }
    }
  };

  const activeId = flat[activeIndex] ? `${listboxId}-${flat[activeIndex].id}` : undefined;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.97, filter: 'blur(6px)' }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.97, filter: 'blur(3px)' }
            }
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-xl panel-frame corner-frame overflow-hidden shadow-panel"
          >
            <ScanLine duration={9} />
            <div className="corner-frame-bottom" aria-hidden />

            <div className="flex items-center gap-2 border-b border-cyber-cyan/15 px-4 py-3">
              <Search className="h-4 w-4 text-cyber-cyan" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search commands…"
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-transparent text-sm font-mono text-text-primary placeholder:text-text-faded outline-none"
              />
              <kbd className="hidden md:inline-flex h-6 items-center rounded-sm border border-cyber-cyan/20 px-1.5 text-[10px] uppercase-wide text-text-secondary">
                Esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {flat.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Terminal className="h-5 w-5 text-text-faded" aria-hidden />
                  <p className="text-sm text-text-secondary">No commands match "{query}"</p>
                  <p className="text-[10px] uppercase-wide text-text-muted">
                    Try a branch type, preset name, or page name.
                  </p>
                </div>
              ) : (
                <ul
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-label="Commands"
                  className="py-1"
                >
                  {grouped.map((g) => (
                    <li key={g.group} className="py-1">
                      <div className="flex items-center gap-1.5 px-4 py-1 text-[10px] uppercase-wide text-text-secondary">
                        <span className="text-cyber-cyan">{GROUP_ICON[g.group]}</span>
                        <span>{GROUP_LABEL[g.group]}</span>
                      </div>
                      <ul>
                        {g.items.map((cmd) => {
                          const flatIndex = flat.indexOf(cmd);
                          const active = flatIndex === activeIndex;
                          return (
                            <li
                              key={cmd.id}
                              id={`${listboxId}-${cmd.id}`}
                              data-cmd-index={flatIndex}
                              role="option"
                              aria-selected={active}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                cmd.run();
                                onClose();
                              }}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              className={cn(
                                'group flex cursor-pointer items-center justify-between gap-3 px-4 py-2 transition-colors',
                                active
                                  ? 'bg-cyber-cyan/10 text-cyber-cyan'
                                  : 'text-text-primary hover:bg-cyber-cyan/[0.06]'
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-mono text-[13px]">{cmd.label}</p>
                                {cmd.hint ? (
                                  <p className="truncate text-[10px] text-text-secondary">
                                    {cmd.hint}
                                  </p>
                                ) : null}
                              </div>
                              <ArrowRight
                                className={cn(
                                  'h-3 w-3 shrink-0 transition-opacity',
                                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                                )}
                                aria-hidden
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-cyber-cyan/10 px-4 py-2 text-[10px] uppercase-wide text-text-secondary">
              <span className="flex items-center gap-2">
                <kbd className="rounded-sm border border-cyber-cyan/20 px-1.5 py-0.5">↑↓</kbd>
                navigate
                <kbd className="ml-2 rounded-sm border border-cyber-cyan/20 px-1.5 py-0.5">↵</kbd>
                run
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded-sm border border-cyber-cyan/20 px-1.5 py-0.5">⌘K</kbd>
                toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
