import type { DefectId, Hint, Outcome, SimResult } from './types';

/**
 * Teacher cat: decides *what* the mascot says and which motion clip plays.
 * UI-independent — the component only renders these lines.
 */

/** Motion clips. Files live in public/mascot/<clip>.webm (+ .mp4 for Safari). */
export type Clip = 'cheer' | 'no' | 'idea' | 'think' | 'yay' | 'again';

/** Clips that have been exported. Add 'think' / 'again' once their files exist. */
export const READY_CLIPS: readonly Clip[] = ['cheer', 'no', 'idea', 'yay'];

/** Until a clip is exported, a similar one stands in. */
const STAND_IN: Record<Clip, Clip> = { cheer: 'cheer', no: 'no', idea: 'idea', yay: 'yay', think: 'idea', again: 'cheer' };

export function resolveClip(c: Clip): Clip {
  return READY_CLIPS.includes(c) ? c : STAND_IN[c];
}

export type LineId = 'welcome' | 'good' | 'defect' | 'hint' | 'noHint' | 'think' | 'again';
export type Tone = 'neutral' | 'good' | 'bad';

export interface Line {
  id: LineId;
  clip: Clip;
  tone: Tone;
  defect?: DefectId;
  hint?: Hint;
  /** Shows a "see why" button in the bubble. */
  action?: 'why';
}

/** How many times in a row the same defect came out. */
export interface Streak {
  outcome: Outcome | null;
  count: number;
}

export const NO_STREAK: Streak = { outcome: null, count: 0 };

export function nextStreak(prev: Streak, outcome: Outcome): Streak {
  return { outcome, count: prev.outcome === outcome ? prev.count + 1 : 1 };
}

export const welcomeLines = (): Line[] => [{ id: 'welcome', clip: 'cheer', tone: 'neutral' }];

export const retryLines = (): Line[] => [{ id: 'again', clip: 'again', tone: 'neutral' }];

/** At most two bubbles per result: react, then point to the next move. */
export function resultLines(r: SimResult, streak: Streak): Line[] {
  if (r.outcome === 'good') return [{ id: 'good', clip: 'yay', tone: 'good' }];
  const defect = r.outcome;
  const first: Line = { id: 'defect', clip: 'no', tone: 'bad', defect };
  if (streak.count >= 2) return [first, { id: 'think', clip: 'think', tone: 'bad', action: 'why' }];
  const hint = r.hints[0];
  return [first, hint ? { id: 'hint', clip: 'idea', tone: 'neutral', hint } : { id: 'noHint', clip: 'idea', tone: 'neutral', action: 'why' }];
}
