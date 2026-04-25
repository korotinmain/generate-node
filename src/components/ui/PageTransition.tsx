import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE_OUT_SOFT } from '@/lib/motion';

export interface PageTransitionProps {
  children: ReactNode;
  pathKey: string;
}

/**
 * Wrap each route's root element so that navigating in/out fades and slides
 * smoothly. Parent should nest inside AnimatePresence with mode="wait".
 */
export const PageTransition = ({ children, pathKey }: PageTransitionProps) => {
  return (
    <motion.div
      key={pathKey}
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: EASE_OUT_SOFT }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
};
