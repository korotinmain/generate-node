import { useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  durationMs?: number;
  startOnMount?: boolean;
}

const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animate from 0 to `target` using requestAnimationFrame.
 * Respects `prefers-reduced-motion` by snapping straight to the target.
 */
export const useCountUp = (target: number, { durationMs = 900, startOnMount = true }: UseCountUpOptions = {}): number => {
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const targetRef = useRef(target);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }
    startValueRef.current = value;
    targetRef.current = target;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / durationMs, 1);
      const eased = easeOutExpo(progress);
      const next = startValueRef.current + (targetRef.current - startValueRef.current) * eased;
      setValue(progress === 1 ? targetRef.current : next);
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(step);
      }
    };

    frameRef.current = window.requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
    // We intentionally ignore `value` to prevent tweening restarts on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
};
