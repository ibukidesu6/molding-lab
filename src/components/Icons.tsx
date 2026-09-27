import type { SVGProps } from 'react';
import type { ParamId } from '../game';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 20, ...p }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IconTemp = (p: P) => (
  <svg {...base(p)}><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" /><path d="M12 9v7" /></svg>
);
export const IconPressure = (p: P) => (
  <svg {...base(p)}><path d="M4 12h9" /><path d="m10 8 4 4-4 4" /><path d="M18 5v14" /><path d="M21 7v10" /></svg>
);
export const IconSpeed = (p: P) => (
  <svg {...base(p)}><path d="M3 8h10a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h6" /></svg>
);
export const IconCool = (p: P) => (
  <svg {...base(p)}><path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18" /><path d="m9 3.5 3 2 3-2M9 20.5l3-2 3 2" /></svg>
);
export const IconHold = (p: P) => (
  <svg {...base(p)}><path d="M4 12h6M20 12h-6" /><path d="m7 9 3 3-3 3M17 9l-3 3 3 3" /><path d="M12 5v14" /></svg>
);
export const IconMoldTemp = (p: P) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M12 6v12" /><path d="M7 3c0 1 1 1 1 2M16 3c0 1 1 1 1 2" /></svg>
);
export const IconEye = (p: P) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconPlay = (p: P) => (
  <svg {...base(p)}><path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" /></svg>
);
export const IconRetry = (p: P) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /></svg>
);
export const IconArrow = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconUp = (p: P) => (
  <svg {...base(p)}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
);
export const IconDown = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>
);
export const IconLock = (p: P) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" fill={filled ? 'currentColor' : 'none'} /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></svg>
);
export const IconSkip = (p: P) => (
  <svg {...base(p)}><path d="m5 5 8 7-8 7V5ZM15 5v14" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

export const PARAM_ICONS: Record<ParamId, (p: P) => React.ReactElement> = {
  meltTemp: IconTemp,
  injPressure: IconPressure,
  injSpeed: IconSpeed,
  coolTime: IconCool,
  holdPressure: IconHold,
  moldTemp: IconMoldTemp,
};
