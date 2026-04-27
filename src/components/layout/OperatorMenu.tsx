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
  const [authLevel, setAuthLevel] = useState(operator.authLevel);

  const onOpen = () => {
    setHandle(operator.handle);
    setAuthLevel(operator.authLevel);
    setOpen(true);
  };

  const trimmedHandle = handle.trim();
  const trimmedAuth = authLevel.trim();
  const isValid = trimmedHandle.length > 0;
  const isDirty =
    trimmedHandle !== operator.handle || trimmedAuth !== operator.authLevel;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || !isDirty) return;
    setOperator({
      handle: trimmedHandle,
      authLevel: trimmedAuth || operator.authLevel,
    });
    pushToast({ message: `Operator → ${trimmedHandle}`, variant: 'success' });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Operator profile · ${operator.handle}`}
        title={`${operator.handle} — click to edit`}
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
        title="Operator // Profile"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Handle"
            placeholder="e.g. denys.korotin"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            hint="Author tag stamped on new log entries"
            error={isValid ? null : 'Handle cannot be empty'}
            autoFocus
            required
          />
          <Input
            label="Auth Level"
            placeholder="e.g. LEVEL_3_AUTH"
            value={authLevel}
            onChange={(e) => setAuthLevel(e.target.value)}
            hint="Decorative — shown next to the handle in the sidebar"
          />

          <div className="mt-2 flex items-center justify-end gap-2 border-t border-cyber-cyan/10 pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!isValid || !isDirty}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
