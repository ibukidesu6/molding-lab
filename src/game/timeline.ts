import { fillTime } from './simulate';
import type { ParamValues } from './types';

export type Phase = 'close' | 'inject' | 'hold' | 'cool' | 'open' | 'eject';
export const PHASES: Phase[] = ['close', 'inject', 'hold', 'cool', 'open', 'eject'];

/** Animation durations (ms). Real-time is compressed but proportions follow the inputs. */
export function phaseDurations(v: ParamValues): Record<Phase, number> {
  return {
    close: 800,
    inject: Math.min(3200, 500 + fillTime(v.injSpeed) * 650),
    hold: 1000,
    cool: 700 + v.coolTime * 75,
    open: 900,
    eject: 1700,
  };
}
