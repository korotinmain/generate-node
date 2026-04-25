export const formatTimestamp = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
};

export const formatNumber = (n: number): string => n.toLocaleString('en-US');
