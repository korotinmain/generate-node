import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: ({ message, variant, durationMs = 2800 }) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, durationMs }] }));
    window.setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, durationMs);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
