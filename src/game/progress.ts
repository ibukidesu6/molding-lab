import { MISSIONS } from './missions';
import type { MaterialId, Outcome } from './types';

export interface Progress {
  /** missionId -> best star count (0..3). Presence means unlocked. */
  missions: Record<string, number>;
  /** Outcomes the player has seen at least once (the "defect notebook"). */
  seen: Outcome[];
  /** Show the teacher cat (can be turned off from the mission drawer). */
  mascot: boolean;
}

const KEY = 'molding-lab/progress/v1';

export const INITIAL_PROGRESS: Progress = { missions: { [MISSIONS[0].id]: 0 }, seen: [], mascot: true };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...INITIAL_PROGRESS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable — play without saving */
  }
  return INITIAL_PROGRESS;
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function isUnlocked(p: Progress, missionId: string) {
  return missionId in p.missions;
}

export function unlockedMaterials(p: Progress): Set<MaterialId> {
  return new Set(MISSIONS.filter((m) => isUnlocked(p, m.id)).map((m) => m.materialId));
}
