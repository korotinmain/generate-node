import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { useBranchStore } from '@/store/useBranchStore';
import { useToastStore } from '@/store/useToastStore';

export interface OperatorMenuProps {
  className?: string;
}

export const OperatorMenu = ({ className }: OperatorMenuProps) => {
  const operator = useBranchStore((s) => s.operator);
  const setOperator = useBranchStore((s) => s.setOperator);
  const pushToast = useToastStore((s) => s.push);

  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState(operator.handle);

  const onOpen = () => {
    setHandle(operator.handle);
    setOpen(true);
  };

  const trimmed = handle.trim();
  const isValid = trimmed.length > 0;
  const isDirty = trimmed !== operator.handle;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || !isDirty) return;
    setOperator({ handle: trimmed });
    pushToast({ message: `Operator → ${trimmed}`, variant: 'success' });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Operator profile · ${operator.handle}`}
        title={`${operator.handle} — click to rename`}
        className={cn(
          'group relative inline-flex shrink-0 rounded-full focus-ring transition-transform',
          'hover:scale-[1.06]',
          className
        )}
      >
        <Avatar label={operator.handle} />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-cyber-cyan/0 transition-[box-shadow,ring-color] group-hover:ring-cyber-cyan/60 group-hover:shadow-glow-cyan"
        />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Rename Operator"
        widthClass="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Handle"
            placeholder="e.g. denys.korotin"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            hint="Stamped on new log entries"
            error={isValid ? null : 'Required'}
            autoFocus
            required
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!isValid || !isDirty}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
