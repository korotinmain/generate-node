import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { OsHeader } from './OsHeader';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Two layouts:
 *  - Generator (/) — centered stage with top-nav (matches "Cyber-Terminal Branch Gen" mock).
 *  - Registry / Logs / others — side-nav "OS" shell with sidebar (matches HUD mocks).
 */
export const AppShell = ({ children }: AppShellProps) => {
  const { pathname } = useLocation();
  const isGenerator = pathname === '/';

  if (isGenerator) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <OsHeader showSearch={pathname.startsWith('/registry')} />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-6 px-6 py-6">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};
