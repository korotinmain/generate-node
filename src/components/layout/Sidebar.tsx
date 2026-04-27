import { NavLink, useNavigate } from 'react-router-dom';
import { Clock, Cpu, LayoutGrid, Plus, SquareTerminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { OperatorMenu } from '@/components/layout/OperatorMenu';
import { Button } from '@/components/ui/Button';
import { useBranchStore } from '@/store/useBranchStore';

const ITEMS = [
  { to: '/', label: 'Generator', icon: SquareTerminal, end: true },
  { to: '/registry', label: 'Registry', icon: LayoutGrid, end: false },
  { to: '/logs', label: 'Logs', icon: Clock, end: false },
  { to: '/system', label: 'System', icon: Cpu, end: false, disabled: true },
];

export const Sidebar = () => {
  const operator = useBranchStore((s) => s.operator);
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'panel-frame flex w-[240px] shrink-0 flex-col',
        'sticky top-[72px] self-start max-h-[calc(100vh-88px)]'
      )}
    >
      <div className="flex items-center gap-3 p-4 border-b border-cyber-cyan/10">
        <OperatorMenu />
        <div className="min-w-0">
          <p className="text-[11px] uppercase-wide font-semibold text-text-primary truncate">
            {operator.handle}
          </p>
          <p className="text-[10px] uppercase-wide text-text-muted truncate">{operator.authLevel}</p>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <ul className="flex flex-col gap-1">
          {ITEMS.map(({ to, label, icon: Icon, end, disabled }) => (
            <li key={to}>
              {disabled ? (
                <span
                  aria-disabled
                  className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-[11px] uppercase-wide text-text-faded cursor-not-allowed"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ) : (
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-sm px-3 py-2 text-[11px] uppercase-wide focus-ring transition-colors',
                      isActive
                        ? 'text-cyber-cyan'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-panel'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-semibold">{label}</span>
                      {isActive ? (
                        <>
                          <motion.span
                            layoutId="sidebar-active-bg"
                            aria-hidden
                            className="absolute inset-0 -z-10 rounded-sm bg-cyber-cyan/10"
                            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                          />
                          <motion.span
                            layoutId="sidebar-active-pip"
                            aria-hidden
                            className="absolute right-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-cyber-cyan shadow-[0_0_8px_currentColor]"
                            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                          />
                        </>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-cyber-cyan/10">
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          leadingIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => navigate('/')}
        >
          Generate_Branch
        </Button>
      </div>
    </aside>
  );
};
