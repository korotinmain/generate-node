import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'branch-cmd-theme';

const isTheme = (value: unknown): value is Theme =>
  value === 'dark' || value === 'light';

const readInitial = (): Theme => {
  if (typeof document === 'undefined') return 'dark';
  // Prefer the value the inline boot script wrote to the <html> element so the
  // store agrees with whatever stylesheet has already been applied.
  const fromAttr = document.documentElement.dataset.theme;
  if (isTheme(fromAttr)) return fromAttr;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    /* localStorage may be unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const apply = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
};

interface ThemeStore {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readInitial(),
  setTheme: (next) => {
    apply(next);
    set({ theme: next });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));
