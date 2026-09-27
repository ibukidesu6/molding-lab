/** Core game types. Pure data — no UI, no i18n strings. */

export type ParamId =
  | 'meltTemp'
  | 'injPressure'
  | 'injSpeed'
  | 'coolTime'
  | 'holdPressure'
  | 'moldTemp';

export type ParamValues = Record<ParamId, number>;

export interface ParamDef {
  id: ParamId;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export type MaterialId = 'PP' | 'ABS' | 'PC';

export interface Material {
  id: MaterialId;
  /** Ideal melt temperature (°C). */
  tIdeal: number;
  /** Recommended melt temperature window (°C). */
  tWindow: [number, number];
  /** Slider range for melt temperature (°C). */
  tRange: [number, number];
  /** Ideal mold temperature (°C). */
  moldIdeal: number;
  /** Flowability multiplier (higher = flows more easily). */
  flow: number;
  /** Tendency to leak through the parting line (higher = flashes more easily). */
  flashTend: number;
  /** Packing pressure needed to avoid sink marks (MPa). */
  packNeed: number;
  /** Base cooling time needed at the thick section (s). */
  coolBase: number;
  /** Solid product color. */
  color: string;
  /** Molten color. */
  hotColor: string;
  /** 0..1 for the material card meters. */
  traits: { flow: number; heat: number; tough: number };
}

export type DefectId = 'short' | 'flash' | 'sink';
export type Outcome = 'good' | DefectId;

export type ProductId = 'cupHolder';

export interface Mission {
  id: string;
  productId: ProductId;
  materialId: MaterialId;
  /** Parameters the player can adjust in this mission. */
  params: ParamId[];
  /** Starting values (anything not listed falls back to material-aware defaults). */
  start: Partial<ParamValues>;
  /** Cycle-time goal for the second star (s). */
  targetCycle: number;
  /** Mission id unlocked on clear. */
  unlocks?: string;
}

export type SinkCause = 'cooling' | 'packing';

export interface Hint {
  param: ParamId;
  dir: 'up' | 'down';
}

export interface SimResult {
  outcome: Outcome;
  defects: DefectId[];
  /** 0.3..1 — how far the resin got. */
  fillRatio: number;
  /** >= 1 means the cavity fills. */
  flowIndex: number;
  /** >= 1 means flash. */
  flashIndex: number;
  /** >= 1 means sink. */
  sinkIndex: number;
  sinkCause: SinkCause;
  /** Packing pressure actually applied (MPa) and needed. */
  packing: number;
  packNeed: number;
  /** Cooling time used and needed (s). */
  coolTime: number;
  coolNeed: number;
  cycleTime: number;
  stars: { good: boolean; cycle: boolean; stable: boolean };
  hints: Hint[];
}
