import { useEffect, useMemo, useRef, useState, type ClipboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BranchTypeSelector } from '@/components/generator/BranchTypeSelector';
import { BranchPreview } from '@/components/generator/BranchPreview';
import { PresetPicker } from '@/components/generator/PresetPicker';
import { SmartPasteHint } from '@/components/generator/SmartPasteHint';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { Button } from '@/components/ui/Button';
import { ScanLine } from '@/components/ui/ScanLine';
import { GENERATOR_EXECUTE_EVENT } from '@/hooks/useGlobalShortcuts';
import { buildBranchName, presetForType } from '@/lib/branch';
import { copyToClipboard } from '@/lib/clipboard';
import { recentValues } from '@/lib/history';
import { EASE_OUT_SOFT, fadeInUp, stagger } from '@/lib/motion';
import {
  hasImportConflict,
  parseSource,
  SOURCE_LABEL,
  type ParseSourceResult,
} from '@/lib/parse-source';
import { useBranchStore } from '@/store/useBranchStore';
import { useToastStore } from '@/store/useToastStore';

export const GeneratorPage = () => {
  const { input, presets } = useBranchStore();
  const logs = useBranchStore((s) => s.logs);
  const setType = useBranchStore((s) => s.setType);
  const setTicketId = useBranchStore((s) => s.setTicketId);
  const setDescriptor = useBranchStore((s) => s.setDescriptor);
  const setPresetId = useBranchStore((s) => s.setPresetId);
  const recordLog = useBranchStore((s) => s.recordLog);
  const pushToast = useToastStore((s) => s.push);

  const [pendingImport, setPendingImport] = useState<ParseSourceResult | null>(null);

  const autoPreset = useMemo(
    () => presetForType(presets, input.type),
    [presets, input.type]
  );
  const explicitPreset = useMemo(
    () => (input.presetId ? presets.find((p) => p.id === input.presetId) : undefined),
    [presets, input.presetId]
  );
  const activePreset = explicitPreset ?? autoPreset;

  const result = useMemo(
    () =>
      buildBranchName({
        type: input.type,
        ticketId: input.ticketId,
        descriptor: input.descriptor,
        formatRule: activePreset?.formatRule,
      }),
    [input.type, input.ticketId, input.descriptor, activePreset?.formatRule]
  );

  const ticketSuggestions = useMemo(
    () => recentValues(logs, 'ticketId', input.ticketId),
    [logs, input.ticketId]
  );
  const descriptorSuggestions = useMemo(
    () => recentValues(logs, 'descriptor', input.descriptor),
    [logs, input.descriptor]
  );

  const ticketRef = useRef<HTMLInputElement>(null);

  const handleExecute = async () => {
    if (!result.isValid) return;
    const ok = await copyToClipboard(result.command);
    recordLog({
      branchName: result.branchName,
      status: ok ? 'copied' : 'terminated',
      type: input.type,
      inputSnapshot: { ...input },
    });
    pushToast({
      message: ok ? 'Branch compiled » Clipboard synced' : 'Clipboard sync failed',
      variant: ok ? 'success' : 'error',
    });
  };

  const applyImport = (parsed: ParseSourceResult) => {
    if (parsed.type) setType(parsed.type);
    if (parsed.ticketId) setTicketId(parsed.ticketId);
    if (parsed.descriptor) setDescriptor(parsed.descriptor);
    pushToast({
      message: `Imported from ${SOURCE_LABEL[parsed.source]}`,
      variant: 'success',
    });
  };

  const requestImport = (parsed: ParseSourceResult) => {
    if (hasImportConflict(parsed, input)) {
      setPendingImport(parsed);
    } else {
      applyImport(parsed);
    }
  };

  const handleInputPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const parsed = parseSource(text);
    // Intercept any successful parse — URLs and branch names need transformation,
    // and plain matches end up in the right field anyway. parseSource returning
    // null is the only case where we fall through to native paste.
    if (parsed) {
      e.preventDefault();
      requestImport(parsed);
    }
  };

  // ⌘+Enter is owned by the global shortcuts hook, which dispatches a
  // page-scoped event. Re-bind whenever the closure-captured input changes.
  useEffect(() => {
    const handler = () => {
      void handleExecute();
    };
    window.addEventListener(GENERATOR_EXECUTE_EVENT, handler);
    return () => window.removeEventListener(GENERATOR_EXECUTE_EVENT, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.isValid, result.command, result.branchName, input.type, input.ticketId, input.descriptor]);

  useEffect(() => {
    ticketRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <motion.section
        variants={stagger(0.08, 0.08)}
        initial="hidden"
        animate="show"
        className="panel-frame corner-frame relative w-full max-w-[880px] overflow-hidden p-6 sm:p-10"
      >
        <ScanLine duration={7} />
        <div className="corner-frame-bottom" aria-hidden />

        <motion.header
          variants={fadeInUp}
          className="flex flex-col items-center gap-3 text-center mb-10"
        >
          <motion.h1
            initial={{ letterSpacing: '0.3em', opacity: 0 }}
            animate={{ letterSpacing: '0.12em', opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_SOFT, delay: 0.1 }}
            className="text-cyber-cyan text-glow-cyan font-display text-[44px] sm:text-5xl font-bold tracking-[0.12em]"
          >
            GENERATE_NODE
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-text-secondary text-sm"
          >
            Initialize branch parameters for deployment.
          </motion.p>
        </motion.header>

        <motion.div variants={fadeInUp} className="mb-6">
          <BranchTypeSelector value={input.type} onChange={setType} />
        </motion.div>

        <motion.div variants={fadeInUp} className="mb-6">
          <PresetPicker
            presets={presets}
            value={input.presetId}
            onChange={setPresetId}
            autoLabel={autoPreset?.name}
          />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-[minmax(160px,1fr)_2fr] gap-4 mb-3"
        >
          <Autocomplete
            ref={ticketRef}
            label="Ticket_ID"
            placeholder="e.g. PROJ-123"
            value={input.ticketId}
            onChange={setTicketId}
            suggestions={ticketSuggestions}
            onPaste={handleInputPaste}
            autoCapitalize="characters"
          />
          <Autocomplete
            label="Descriptor"
            placeholder="e.g. update-login-modal"
            value={input.descriptor}
            onChange={setDescriptor}
            suggestions={descriptorSuggestions}
            onPaste={handleInputPaste}
            onKeyDownExtra={(e) => {
              // Plain Enter only — the global keydown handler owns ⌘/Ctrl + Enter,
              // so skipping here prevents a double-fire when the descriptor has focus.
              if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                void handleExecute();
              }
            }}
          />
        </motion.div>

        <motion.div variants={fadeInUp} className="mb-6">
          <SmartPasteHint
            onImport={requestImport}
            onUnparseable={() =>
              pushToast({
                message: 'Nothing recognizable in that input',
                variant: 'error',
              })
            }
          />
        </motion.div>

        <AnimatePresence initial={false}>
          {pendingImport ? (
            <motion.div
              key="conflict-banner"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
              className="overflow-hidden"
              role="alertdialog"
              aria-label="Confirm import"
            >
              <div className="rounded-sm border border-cyber-amber/40 bg-cyber-amber/5 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-text-secondary">
                  »{' '}
                  <span className="text-cyber-amber">
                    Replace current input
                  </span>{' '}
                  with values from{' '}
                  <span className="text-cyber-cyan">
                    {SOURCE_LABEL[pendingImport.source]}
                  </span>
                  ?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingImport(null)}
                  >
                    Keep current
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      applyImport(pendingImport);
                      setPendingImport(null);
                    }}
                  >
                    Replace
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {activePreset ? (
          <motion.p
            key={activePreset.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
            className="mb-3 text-[10px] uppercase-wide text-text-muted"
          >
            » Rule applied: <span className="text-cyber-cyan">{activePreset.name}</span>{' '}
            · <span className="font-mono text-text-secondary">{activePreset.formatRule}</span>
          </motion.p>
        ) : null}

        <motion.div variants={fadeInUp}>
          <BranchPreview
            type={input.type}
            ticketId={input.ticketId}
            descriptor={input.descriptor}
            branchName={result.branchName}
            isValid={result.isValid}
            errors={result.errors}
            onExecute={handleExecute}
          />
        </motion.div>

        <motion.p
          variants={fadeInUp}
          className="mt-4 text-right text-[10px] uppercase-wide text-text-faded"
        >
          ⌘ + Enter to execute
        </motion.p>
      </motion.section>
    </div>
  );
};
