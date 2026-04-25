import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/useToastStore';
import { cn } from '@/lib/cn';

const ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: 'border-cyber-cyan/60 text-cyber-cyan shadow-glow-cyan',
  error: 'border-cyber-red/60 text-cyber-red shadow-glow-red',
  info: 'border-cyber-magenta/60 text-cyber-magenta shadow-glow-magenta',
};

export const ToastViewport = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-[320px] pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICON[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-sm border bg-bg-panel/95 px-4 py-3 backdrop-blur-sm',
                VARIANT_CLASS[toast.variant]
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-[11px] uppercase-wide font-semibold leading-snug text-text-primary">
                {toast.message}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
