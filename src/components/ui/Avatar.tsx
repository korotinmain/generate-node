import { cn } from '@/lib/cn';

export interface AvatarProps {
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

const initials = (label: string): string => {
  const parts = label.trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
};

export const Avatar = ({ label, size = 'md', className }: AvatarProps) => {
  return (
    <div
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-gradient-to-br from-cyber-cyan/20 to-cyber-magenta/20 text-text-primary',
        'ring-1 ring-cyber-cyan/40 font-semibold font-mono',
        SIZE[size],
        className
      )}
    >
      {initials(label)}
    </div>
  );
};
