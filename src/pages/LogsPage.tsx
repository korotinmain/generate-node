import { Activity, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LogsTable } from '@/components/logs/LogsTable';
import { useBranchStore } from '@/store/useBranchStore';
import { useToastStore } from '@/store/useToastStore';
import { fadeInUp, stagger } from '@/lib/motion';

export const LogsPage = () => {
  const logs = useBranchStore((s) => s.logs);
  const clearLogs = useBranchStore((s) => s.clearLogs);
  const pushToast = useToastStore((s) => s.push);
  const [query, setQuery] = useState('');

  return (
    <motion.div
      variants={stagger(0.04, 0.07)}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
    >
      <motion.header
        variants={fadeInUp}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <motion.span
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-cyber-cyan/10 text-cyber-cyan"
            >
              <Activity className="h-4 w-4" />
            </motion.span>
            <h1 className="font-display text-xl font-bold tracking-[0.1em] text-cyber-cyan text-glow-cyan uppercase-wide">
              Generation Logs
            </h1>
          </div>
          <p className="mt-1 text-[11px] uppercase-wide text-text-muted">
            // Historical record of all branch compilations
          </p>
        </div>

        <motion.div variants={fadeInUp} className="flex items-center gap-2">
          <label className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter queries..."
              aria-label="Filter logs"
              className="h-10 w-[260px] rounded-sm border border-cyber-cyan/20 bg-bg-input pl-9 pr-3 font-mono text-[12px] text-text-primary placeholder:text-text-muted transition-[border-color,box-shadow] focus:border-cyber-cyan/60 focus:outline-none focus:shadow-glow-cyan"
            />
          </label>
          {logs.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Trash2 className="h-3 w-3" />}
              onClick={() => {
                clearLogs();
                pushToast({ message: 'Log buffer cleared', variant: 'info' });
              }}
            >
              Clear
            </Button>
          ) : null}
        </motion.div>
      </motion.header>

      <motion.div variants={fadeInUp}>
        <LogsTable logs={logs} query={query} />
      </motion.div>
    </motion.div>
  );
};
