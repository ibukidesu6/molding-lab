import { MATERIALS } from './materials';
import { paramDef } from './params';
import type { Hint, Mission, ParamId, ParamValues, SimResult } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Full value set for a mission: adjustable params come from the player, the rest are fixed defaults. */
export function initialValues(mission: Mission): ParamValues {
  const m = MATERIALS[mission.materialId];
  return {
    meltTemp: m.tIdeal,
    injPressure: 80,
    injSpeed: 60,
    coolTime: 15,
    holdPressure: 50,
    moldTemp: m.moldIdeal,
    ...mission.start,
  };
}

/** Time the resin needs to fill the cavity (s). */
export function fillTime(speed: number) {
  return 0.6 + 90 / speed;
}

/**
 * A deliberately simple, explainable model:
 *  - flowIndex:  "push" (pressure x speed) x "runniness" (melt/mold temperature, material)
 *  - flashIndex: pressure/speed too strong for the clamp, worse when the melt is very runny
 *  - sinkIndex:  not cooled long enough, or not enough packing pressure to make up shrinkage
 */
export function simulate(mission: Mission, v: ParamValues): SimResult {
  const mat = MATERIALS[mission.materialId];
  const has = (p: ParamId) => mission.params.includes(p);

  const T = v.meltTemp;
  const P = v.injPressure;
  const V = v.injSpeed;
  const C = v.coolTime;
  const Tm = has('moldTemp') ? v.moldTemp : mat.moldIdeal;

  const tempF = Math.max(0.3, 1 + (T - mat.tIdeal) / 80);
  const moldF = 1 + (Tm - mat.moldIdeal) / 150;
  const drive = Math.pow(P / 80, 0.6) * Math.pow(V / 60, 0.5);
  const flowIndex = drive * tempF * moldF * mat.flow;
  const fillRatio = clamp(flowIndex, 0.3, 1);

  const runny = 1 + Math.max(0, T - mat.tIdeal) / 70;
  const injFlash = Math.pow(P / 115, 1.3) * Math.pow(V / 80, 0.4) * runny * mat.flashTend;
  const holdFlash = has('holdPressure') ? Math.pow(v.holdPressure / 95, 1.3) * runny * mat.flashTend : 0;
  const flashIndex = Math.max(injFlash, holdFlash);

  const packing = has('holdPressure') ? v.holdPressure : P * 0.55;
  const packNeed = mat.packNeed;
  const coolNeed =
    mat.coolBase * (1 + (T - mat.tIdeal) / 150) * (1 + (Tm - mat.moldIdeal) / 120);
  const packSink = packNeed / packing;
  const coolSink = coolNeed / C;
  const sinkIndex = Math.max(packSink, coolSink);
  const sinkCause = coolSink >= packSink ? 'cooling' : 'packing';

  const defects: SimResult['defects'] = [];
  if (flowIndex < 1) {
    defects.push('short');
  } else {
    if (flashIndex >= 1) defects.push('flash');
    if (sinkIndex >= 1) defects.push('sink');
  }
  const outcome = defects[0] ?? 'good';

  const cycleTime = fillTime(V) + 2 + C + 5;
  const good = defects.length === 0;
  const inWindow = T >= mat.tWindow[0] && T <= mat.tWindow[1];
  const stars = {
    good,
    cycle: good && cycleTime <= mission.targetCycle,
    stable: good && inWindow && flowIndex >= 1.08 && flashIndex <= 0.9 && sinkIndex <= 0.95,
  };

  const hints: Hint[] = [];
  const room = (p: ParamId, dir: 'up' | 'down') => {
    const d = paramDef(p, mat);
    return dir === 'up' ? v[p] < d.max : v[p] > d.min;
  };
  const push = (p: ParamId, dir: 'up' | 'down') => {
    if (has(p) && room(p, dir) && !hints.some((h) => h.param === p)) hints.push({ param: p, dir });
  };

  if (outcome === 'short') {
    // Suggest the lever that is furthest from a comfortable value first.
    const lacks: [ParamId, number][] = [
      ['injSpeed', 60 / V],
      ['meltTemp', (mat.tIdeal + 5) / T],
      ['injPressure', 85 / P],
      ['moldTemp', has('moldTemp') ? (mat.moldIdeal + 5) / Tm : 0],
    ];
    lacks.sort((a, b) => b[1] - a[1]).forEach(([p]) => push(p, 'up'));
  } else {
    if (defects.includes('flash')) {
      if (holdFlash > injFlash) push('holdPressure', 'down');
      if (T > mat.tWindow[1]) push('meltTemp', 'down');
      push('injPressure', 'down');
      push('injSpeed', 'down');
    }
    if (defects.includes('sink')) {
      if (sinkCause === 'cooling') {
        push('coolTime', 'up');
        if (T > mat.tWindow[1]) push('meltTemp', 'down');
      } else {
        push(has('holdPressure') ? 'holdPressure' : 'injPressure', 'up');
      }
    }
    if (good && !stars.cycle) push('coolTime', 'down');
    if (good && stars.cycle && !stars.stable) {
      if (!inWindow) push('meltTemp', T < mat.tWindow[0] ? 'up' : 'down');
      if (flowIndex < 1.08) push('injSpeed', 'up');
      if (flashIndex > 0.9) push('injPressure', 'down');
      if (sinkIndex > 0.95) push(sinkCause === 'cooling' ? 'coolTime' : has('holdPressure') ? 'holdPressure' : 'injPressure', 'up');
    }
  }

  return {
    outcome,
    defects,
    fillRatio,
    flowIndex,
    flashIndex,
    sinkIndex,
    sinkCause,
    packing,
    packNeed,
    coolTime: C,
    coolNeed,
    cycleTime,
    stars,
    hints: hints.slice(0, 2),
  };
}
