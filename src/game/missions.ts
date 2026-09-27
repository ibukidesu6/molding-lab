import type { Mission } from './types';

/** Add a stage by appending here (+ its strings in each locale). */
export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    productId: 'cupHolder',
    materialId: 'PP',
    params: ['meltTemp', 'injPressure', 'injSpeed', 'coolTime'],
    start: { meltTemp: 200, injPressure: 50, injSpeed: 30, coolTime: 8 },
    targetCycle: 24,
    unlocks: 'm2',
  },
  {
    id: 'm2',
    productId: 'cupHolder',
    materialId: 'ABS',
    params: ['meltTemp', 'injPressure', 'injSpeed', 'holdPressure', 'coolTime'],
    start: { meltTemp: 230, injPressure: 90, injSpeed: 60, holdPressure: 25, coolTime: 12 },
    targetCycle: 26,
    unlocks: 'm3',
  },
  {
    id: 'm3',
    productId: 'cupHolder',
    materialId: 'PC',
    params: ['meltTemp', 'injPressure', 'injSpeed', 'holdPressure', 'moldTemp', 'coolTime'],
    start: { meltTemp: 280, injPressure: 100, injSpeed: 60, holdPressure: 50, moldTemp: 50, coolTime: 15 },
    targetCycle: 30,
  },
];

export function getMission(id: string): Mission {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}
