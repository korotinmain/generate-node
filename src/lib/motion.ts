import type { Variants } from 'framer-motion';

export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_SHARP = [0.16, 1, 0.3, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT_SOFT },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT_SOFT } },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.06): Variants => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren,
      ease: EASE_OUT_SOFT,
    },
  },
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_OUT_SOFT },
  },
};

export const listRow: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: EASE_OUT_SOFT },
  },
};
