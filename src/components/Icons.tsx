import type { CSSProperties } from 'react';
import type { ParamId } from '../game';

/**
 * Material Symbols (Rounded) — the M3 icon set, loaded as a subset font in index.html.
 * Adding an icon here means adding its name to the `icon_names=` list there (alphabetical).
 */
type P = { size?: number; className?: string; filled?: boolean };

function Symbol({ name, size = 24, className, filled }: P & { name: string }) {
  const style: CSSProperties = { fontSize: size, width: size, height: size, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'opsz' ${Math.min(48, Math.max(20, size))}` };
  return (
    <span className={`msr${className ? ' ' + className : ''}`} style={style} aria-hidden>
      {name}
    </span>
  );
}

const make = (name: string) => (p: P) => <Symbol name={name} {...p} />;

export const IconTemp = make('thermostat');
export const IconPressure = make('keyboard_double_arrow_right');
export const IconSpeed = make('speed');
export const IconCool = make('ac_unit');
export const IconHold = make('compress');
export const IconMoldTemp = make('heat');
export const IconEye = make('visibility');
export const IconPlay = make('play_arrow');
export const IconRetry = make('replay');
export const IconArrow = make('arrow_forward');
export const IconUp = make('arrow_upward');
export const IconDown = make('arrow_downward');
export const IconLock = make('lock');
export const IconStar = make('star');
export const IconHome = make('home');
export const IconSkip = make('skip_next');
export const IconClock = make('schedule');
export const IconMenu = make('menu');
export const IconClose = make('close');
export const IconCheck = make('check');
export const IconExpand = make('expand_more');

export const PARAM_ICONS: Record<ParamId, (p: P) => React.ReactElement> = {
  meltTemp: IconTemp,
  injPressure: IconPressure,
  injSpeed: IconSpeed,
  coolTime: IconCool,
  holdPressure: IconHold,
  moldTemp: IconMoldTemp,
};
