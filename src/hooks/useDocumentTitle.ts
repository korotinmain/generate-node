import { useEffect } from 'react';

const DEFAULT_SUFFIX = 'GENERATE_NODE';

/**
 * Sets `document.title` to `${title} — ${DEFAULT_SUFFIX}` while the component
 * is mounted, restoring the previous title on unmount. Pass `null` to keep the
 * existing title (e.g., the homepage already matches the document title).
 */
export const useDocumentTitle = (title: string | null) => {
  useEffect(() => {
    if (title === null) return;
    const previous = document.title;
    document.title = `${title} — ${DEFAULT_SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
