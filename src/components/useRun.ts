import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PHASES, type Phase } from '../game';

export type RunPhase = 'idle' | Phase | 'done';
export interface RunState {
  phase: RunPhase;
  /** 0..1 progress within the phase */
  t: number;
  /** Clock (s) for continuous wobble effects */
  now: number;
}

/** Drives the molding-cycle animation with requestAnimationFrame. */
export function useRun(onDone?: () => void) {
  const [state, setState] = useState<RunState>({ phase: 'idle', t: 0, now: 0 });
  const raf = useRef(0);
  const doneRef = useRef(onDone);
  useLayoutEffect(() => {
    doneRef.current = onDone;
  });

  const stop = () => cancelAnimationFrame(raf.current);

  const start = useCallback((durations: Record<Phase, number>) => {
    stop();
    setState({ phase: PHASES[0], t: 0, now: 0 });
    const t0 = performance.now();
    const tick = (now: number) => {
      let el = now - t0;
      for (const p of PHASES) {
        if (el < durations[p]) {
          setState({ phase: p, t: el / durations[p], now: now / 1000 });
          raf.current = requestAnimationFrame(tick);
          return;
        }
        el -= durations[p];
      }
      setState({ phase: 'done', t: 1, now: now / 1000 });
      doneRef.current?.();
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  const skip = useCallback(() => {
    stop();
    setState((st) => ({ ...st, phase: 'done', t: 1 }));
    doneRef.current?.();
  }, []);

  const reset = useCallback(() => {
    stop();
    setState({ phase: 'idle', t: 0, now: 0 });
  }, []);

  useEffect(() => stop, []);

  return { ...state, start, skip, reset, running: state.phase !== 'idle' && state.phase !== 'done' };
}
