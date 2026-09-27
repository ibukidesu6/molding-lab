import type { Material, ParamDef, ParamId } from './types';

export const PARAM_ORDER: ParamId[] = [
  'meltTemp',
  'injPressure',
  'injSpeed',
  'holdPressure',
  'moldTemp',
  'coolTime',
];

const BASE: Record<ParamId, ParamDef> = {
  meltTemp: { id: 'meltTemp', unit: '°C', min: 180, max: 260, step: 5 },
  injPressure: { id: 'injPressure', unit: 'MPa', min: 30, max: 150, step: 5 },
  injSpeed: { id: 'injSpeed', unit: '%', min: 10, max: 100, step: 5 },
  coolTime: { id: 'coolTime', unit: 's', min: 3, max: 30, step: 1 },
  holdPressure: { id: 'holdPressure', unit: 'MPa', min: 10, max: 110, step: 5 },
  moldTemp: { id: 'moldTemp', unit: '°C', min: 20, max: 130, step: 5 },
};

/** Parameter definition, with ranges adapted to the material where relevant. */
export function paramDef(id: ParamId, material: Material): ParamDef {
  if (id === 'meltTemp') {
    return { ...BASE.meltTemp, min: material.tRange[0], max: material.tRange[1] };
  }
  return BASE[id];
}
