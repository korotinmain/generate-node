import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScanLine } from '@/components/ui/ScanLine';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export const Modal = ({
  open,
  title,
  onClose,
  children,
  widthClass = 'max-w-lg',
}: ModalProps) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <div className="fixed inset-0 z-[60] overflow-y-auto pointer-events-none">
              <div className="flex min-h-screen items-center justify-center p-6">
                <Dialog.Content
                  forceMount
                  asChild
                  aria-describedby={undefined}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.97, filter: 'blur(3px)' }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'pointer-events-auto relative w-full panel-frame corner-frame p-6 overflow-hidden shadow-panel',
                      widthClass
                    )}
                  >
                    <ScanLine duration={9} />
                    <div className="corner-frame-bottom" aria-hidden />
                    <div className="flex items-center justify-between mb-5">
                      <Dialog.Title className="text-sm uppercase-wide font-semibold text-cyber-cyan text-glow-cyan">
                        {title}
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button
                          type="button"
                          aria-label="Close"
                          className="text-text-secondary hover:text-cyber-cyan transition-colors focus-ring rounded-sm p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                    {children}
                  </motion.div>
                </Dialog.Content>
              </div>
            </div>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
};
