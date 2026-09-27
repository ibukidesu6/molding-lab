import type { Material, MaterialId } from './types';

export const MATERIALS: Record<MaterialId, Material> = {
  PP: {
    id: 'PP',
    tIdeal: 220,
    tWindow: [205, 245],
    tRange: [180, 260],
    moldIdeal: 40,
    flow: 1.15,
    flashTend: 1.1,
    packNeed: 38,
    coolBase: 12,
    color: '#e8ecef',
    hotColor: '#f07a2e',
    traits: { flow: 0.9, heat: 0.35, tough: 0.5 },
  },
  ABS: {
    id: 'ABS',
    tIdeal: 240,
    tWindow: [225, 260],
    tRange: [200, 280],
    moldIdeal: 60,
    flow: 0.95,
    flashTend: 0.95,
    packNeed: 45,
    coolBase: 13,
    color: '#f0e6cf',
    hotColor: '#f07a2e',
    traits: { flow: 0.6, heat: 0.55, tough: 0.7 },
  },
  PC: {
    id: 'PC',
    tIdeal: 300,
    tWindow: [285, 315],
    tRange: [260, 330],
    moldIdeal: 90,
    flow: 0.78,
    flashTend: 0.85,
    packNeed: 55,
    coolBase: 14,
    color: '#cfe7f7',
    hotColor: '#f07a2e',
    traits: { flow: 0.35, heat: 0.95, tough: 0.9 },
  },
};

export const MATERIAL_ORDER: MaterialId[] = ['PP', 'ABS', 'PC'];
