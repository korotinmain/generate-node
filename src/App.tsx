import { AnimatePresence } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition } from '@/components/ui/PageTransition';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { RegistryPage } from '@/pages/RegistryPage';
import { LogsPage } from '@/pages/LogsPage';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location.pathname} pathKey={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<GeneratorPage />} />
          <Route path="/registry" element={<RegistryPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

export const App = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
      <ToastViewport />
    </BrowserRouter>
  );
};
