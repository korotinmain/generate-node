export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy path.
    }
  }

  // Legacy fallback for non-secure contexts (e.g. file://, http://).
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const ok = document.execCommand('copy');
    return ok;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};
