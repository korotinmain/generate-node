import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScanLine } from '@/components/ui/ScanLine';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export const Modal = ({ open, title, onClose, children, widthClass = 'max-w-lg' }: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            aria-hidden
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative flex min-h-screen items-center justify-center p-6 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, scale: 0.97, filter: 'blur(3px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'relative w-full panel-frame corner-frame p-6 overflow-hidden pointer-events-auto',
                'shadow-panel',
                widthClass
              )}
            >
              <ScanLine duration={9} />
              <div className="corner-frame-bottom" aria-hidden />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm uppercase-wide font-semibold text-cyber-cyan text-glow-cyan">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="text-text-secondary hover:text-cyber-cyan transition-colors focus-ring rounded-sm p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
