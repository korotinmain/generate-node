import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const GENERATOR_EXECUTE_EVENT = 'generator:execute';

export interface GlobalShortcutsOptions {
  openPalette: () => void;
  paletteOpen: boolean;
}

/**
 * Global keybinds:
 *   ⌘/Ctrl+K    → open command palette (always)
 *   ⌘/Ctrl+Enter → fire `generator:execute` (only on `/` and only when palette is closed)
 *
 * Page-level handlers subscribe to `GENERATOR_EXECUTE_EVENT` to act.
 */
export const useGlobalShortcuts = ({ openPalette, paletteOpen }: GlobalShortcutsOptions) => {
  const location = useLocation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
        return;
      }

      if (e.key === 'Enter') {
        if (paletteOpen) return; // palette owns Enter while open
        if (location.pathname !== '/') return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(GENERATOR_EXECUTE_EVENT));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openPalette, paletteOpen, location.pathname]);
};
