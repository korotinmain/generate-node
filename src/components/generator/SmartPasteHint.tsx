import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EASE_OUT_SOFT } from '@/lib/motion';
import { parseSource, type ParseSourceResult } from '@/lib/parse-source';

export interface SmartPasteHintProps {
  onImport: (parsed: ParseSourceResult) => void;
  onUnparseable: () => void;
}

/**
 * Collapsible textarea + Parse button. Lets users paste a URL or free-form
 * string without having to pick a target field first.
 */
export const SmartPasteHint = ({ onImport, onUnparseable }: SmartPasteHintProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const close = () => {
    setOpen(false);
    setText('');
  };

  const handleParse = () => {
    const result = parseSource(text);
    if (!result) {
      onUnparseable();
      return;
    }
    onImport(result);
    close();
  };

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) {
        // Focus the textarea after the open animation kicks in.
        window.setTimeout(() => textareaRef.current?.focus(), 50);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="self-start inline-flex items-center gap-1.5 text-[10px] uppercase-wide text-text-muted hover:text-cyber-cyan transition-colors focus-ring"
      >
        <ClipboardPaste className="h-3 w-3" />
        Smart paste
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
            className="overflow-hidden"
          >
            <div className="rounded-sm border border-cyber-cyan/20 bg-bg-input/60 p-3 flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    close();
                    return;
                  }
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleParse();
                  }
                }}
                placeholder="Paste a Jira / Linear / GitHub URL, branch name, or 'PROJ-123 update login'…"
                rows={2}
                spellCheck={false}
                className="w-full bg-transparent font-mono text-sm text-text-primary placeholder:text-text-faded outline-none resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase-wide text-text-faded">
                  ⌘ + Enter to parse
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleParse} disabled={!text.trim()}>
                    Parse
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
