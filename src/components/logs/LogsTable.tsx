import { AlertTriangle, Copy, GitBranch, RotateCcw, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge, STATUS_TONE } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { formatTimestamp } from '@/lib/format';
import type { LogEntry, LogStatus } from '@/types';

export interface LogsTableProps {
  logs: LogEntry[];
  query: string;
  onReuse?: (id: string) => void;
}

const STATUS_ICON: Record<LogStatus, LucideIcon> = {
  committed: GitBranch,
  copied: Copy,
  terminated: AlertTriangle,
};

const BRANCH_COLOR: Record<LogStatus, string> = {
  committed: 'text-cyber-cyan',
  copied: 'text-cyber-magenta',
  terminated: 'text-text-muted',
};

export const LogsTable = ({ logs, query, onReuse }: LogsTableProps) => {
  const filtered = query
    ? logs.filter(
        (l) =>
          l.branchName.toLowerCase().includes(query.toLowerCase()) ||
          l.author.toLowerCase().includes(query.toLowerCase()) ||
          l.status.includes(query.toLowerCase())
      )
    : logs;

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel-frame flex flex-col items-center gap-2 p-10 text-center"
      >
        <p className="text-sm text-text-secondary">
          {query ? `No logs match "${query}"` : 'No branch generations recorded yet.'}
        </p>
        <p className="text-[11px] text-text-muted uppercase-wide">
          Generate a branch to populate the history.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT_SOFT }}
      className="panel-frame overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-cyber-cyan/10 text-[10px] uppercase-wide text-text-secondary">
              <Th className="w-[200px]">Timestamp</Th>
              <Th>Branch_Name</Th>
              <Th className="w-[180px]">Author</Th>
              <Th className="w-[140px] text-right pr-3">Status</Th>
              <Th className="w-[60px] text-right pr-5" aria-label="Actions">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial>
              {filtered.map((log, i) => {
                const StatusIcon = STATUS_ICON[log.status];
                return (
                  <motion.tr
                    key={log.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{
                      duration: 0.32,
                      ease: EASE_OUT_SOFT,
                      delay: Math.min(i * 0.035, 0.4),
                    }}
                    onClick={onReuse ? () => onReuse(log.id) : undefined}
                    className={cn(
                      'border-b border-cyber-cyan/5 last:border-b-0 transition-colors',
                      onReuse
                        ? 'cursor-pointer hover:bg-cyber-cyan/[0.06] focus-within:bg-cyber-cyan/[0.06]'
                        : 'hover:bg-cyber-cyan/[0.04]'
                    )}
                  >
                    <Td className="text-text-secondary font-mono text-[12px]">
                      {formatTimestamp(log.timestamp)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 font-mono text-[13px]',
                          BRANCH_COLOR[log.status]
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                        {log.branchName}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-sm bg-bg-input px-1 text-[10px] font-bold text-text-primary">
                          {log.authorTag}
                        </span>
                        <span className="font-mono text-[12px] text-text-primary">{log.author}</span>
                      </span>
                    </Td>
                    <Td className="text-right pr-3">
                      <Badge tone={STATUS_TONE[log.status]} dot>
                        {log.status}
                      </Badge>
                    </Td>
                    <Td className="text-right pr-5">
                      {onReuse ? (
                        <button
                          type="button"
                          aria-label={`Reuse ${log.branchName}`}
                          title="Reuse in Generator"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReuse(log.id);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-cyber-cyan/20 text-text-secondary transition-colors hover:border-cyber-cyan/60 hover:text-cyber-cyan focus-ring"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </Td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const Th = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn('px-5 py-3 font-semibold', className)}>{children}</th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn('px-5 py-3 align-middle', className)}>{children}</td>
);
