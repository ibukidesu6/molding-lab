import { memo } from 'react';
import type { Material, ParamValues, SimResult } from '../game';
import { useI18n } from '../i18n';
import { clamp01, easeInOut, easeOut, mix } from './color';
import ProductArt from './ProductArt';
import { palette as P } from '../theme';
import type { RunPhase } from './useRun';

/*
 * Side view of an injection molding machine with a see-through mold,
 * drawn in a flat, outlined "toy" style. The cavity is a cross-section of a
 * cup-shaped part: sprue → thick base → two side walls → rim at the parting line.
 * After ejection the part drops onto a conveyor and rolls to inspection.
 */

const CY = 240; // machine centre line
const PX = 640; // parting line x
const OPEN_DX = 150; // how far the moving half travels
const CUP = { x0: 520, x1: PX, y0: 150, y1: 330, base: 28, wall: 14 };
const CORE = { x0: CUP.x0 + CUP.base, y0: CUP.y0 + CUP.wall, y1: CUP.y1 - CUP.wall };
const BASE_CX = CUP.x0 + CUP.base / 2;
const WALL_TOP_CY = CUP.y0 + CUP.wall / 2;
const BASE_LEN = CY - CUP.y0; // 90
const WALL_LEN = PX - BASE_CX; // 106
const SPRUE_LEN = CUP.x0 - 470; // 50
const BRANCH_LEN = BASE_LEN + WALL_LEN;

const PIN_DX = 22; // ejector push
const DROP_DY = 175; // mold → conveyor
const SLIDE_DX = 214; // along the conveyor
const BELT_Y = CUP.y1 + DROP_DY; // 505

const NAVY = P.ink;
const INK2 = P.metalDark;
const STEEL = P.metal;
const STEEL_2 = P.metalMid;
const BODY = P.surfaceHigh;
const BODY_D = P.metalMid;
const HOPPER = P.metalLight;
const ICE = P.primaryTint;

const CAVITY_PATH =
  `M${CUP.x0},${CUP.y0} H${CUP.x1} V${CUP.y1} H${CUP.x0} Z ` +
  `M${CORE.x0},${CORE.y0} H${PX} V${CORE.y1} H${CORE.x0} Z`;
const SPRUE_PATH = `M470,236 L${CUP.x0},233 L${CUP.x0},247 L470,244 Z`;
const FIXED_PATH = `M470,90 H${PX} V${CUP.y0} H${CUP.x0} V${CUP.y1} H${PX} V390 H470 Z`;
const MOVING_PATH = `M${PX},90 H${PX + 170} V390 H${PX} V${CORE.y1} H${CORE.x0} V${CORE.y0} H${PX} Z`;

interface Props {
  material: Material;
  values: ParamValues;
  result: SimResult | null;
  phase: RunPhase;
  t: number;
  /** Clock (s) for wobble effects */
  now?: number;
  xray: boolean;
  labels?: boolean;
  markers?: boolean;
}

const easeIn = (x: number) => x * x * x;
const easeOutBack = (x: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function derive(phase: RunPhase, t: number, r: SimResult | null, now: number) {
  const fillRatio = r?.fillRatio ?? 1;
  const totalTarget = SPRUE_LEN + fillRatio * BRANCH_LEN;
  const flash = !!r?.defects.includes('flash');
  const sink = !!r?.defects.includes('sink');
  const short = r?.outcome === 'short';

  const s = {
    open: 1,
    progress: 0,
    heat: 1,
    screw: 0,
    spin: 0,
    flashAmt: 0,
    sinkAmt: 0,
    pressure: 0,
    gap: 0,
    shake: 0,
    frost: 0, // bluish tint while cooling
    frontIce: 0, // short shot: the front freezes
    wobble: 1, // flow-front wobble amplitude
    push: 0, // ejector 0..1
    fx: 0,
    fy: 0,
    rot: 0,
    squash: 0,
    flying: false,
    landed: false,
    morph: 0, // cross-section → finished cup
    cam: 0, // 0 = whole machine, 1 = zoomed on the mold
  };

  const landedState = () => {
    s.open = 1;
    s.progress = totalTarget;
    s.heat = 0;
    s.flashAmt = flash ? 1 : 0;
    s.sinkAmt = sink ? 1 : 0;
    s.frontIce = short ? 1 : 0;
  };

  switch (phase) {
    case 'idle':
      break;
    case 'close':
      s.open = 1 - easeIn(t);
      s.cam = easeInOut(win(t, 0.55, 1));
      if (t > 0.86) s.shake = Math.sin(t * 140) * 5 * (1 - win(t, 0.86, 1));
      break;
    case 'inject': {
      s.open = 0;
      s.cam = 1;
      const k = short ? easeOut(t) : Math.pow(t, 0.85);
      s.progress = k * totalTarget;
      s.screw = k * 0.8 * (totalTarget / (SPRUE_LEN + BRANCH_LEN));
      s.pressure = 0.35 + 0.65 * t;
      if (short) {
        s.frontIce = win(t, 0.55, 0.95);
        s.wobble = 1 - s.frontIce;
        s.heat = 1 - 0.3 * t;
      }
      break;
    }
    case 'hold':
      s.open = 0;
      s.cam = 1;
      s.progress = totalTarget;
      s.screw = 0.8 + 0.08 * t;
      s.pressure = 0.7;
      s.heat = short ? 0.6 : 1 - 0.1 * t;
      s.frontIce = short ? 1 : 0;
      s.wobble = short ? 0 : 0.4;
      if (flash) {
        s.flashAmt = easeOut(win(t, 0.05, 0.7));
        s.gap = 5 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + 2;
        s.shake = t < 0.6 ? Math.sin(now * 60) * 2.2 : 0;
      }
      break;
    case 'cool':
      s.open = 0;
      s.cam = 1 - easeInOut(win(t, 0.8, 1));
      s.progress = totalTarget;
      s.screw = 0.88 * (1 - easeInOut(t));
      s.spin = t;
      s.heat = (short ? 0.6 : 0.9) * (1 - easeInOut(t));
      s.frost = Math.sin(Math.PI * t) * 0.6;
      s.frontIce = short ? 1 : 0;
      s.wobble = 0;
      s.flashAmt = flash ? 1 : 0;
      s.sinkAmt = sink ? easeInOut(win(t, 0.25, 0.85)) : 0;
      s.gap = flash ? 2 * (1 - t) : 0;
      if (sink && t > 0.6 && t < 0.75) s.shake = Math.sin(now * 70) * 1.5;
      break;
    case 'open':
      landedState();
      s.open = easeOutBack(t);
      break;
    case 'eject': {
      landedState();
      s.push = easeOut(win(t, 0, 0.16));
      const fall = win(t, 0.16, 0.44);
      const bounce = win(t, 0.44, 0.62);
      const slide = win(t, 0.64, 1);
      s.flying = t > 0.16;
      s.fy = DROP_DY * fall * fall - 220 * fall * (1 - fall) - (fall >= 1 ? 30 * Math.sin(Math.PI * bounce) : 0);
      s.rot = fall < 1 ? -14 * Math.sin(Math.PI * fall) : 3 * Math.sin(Math.PI * 2 * bounce) * (1 - bounce);
      s.squash = fall >= 1 ? Math.sin(Math.PI * win(t, 0.44, 0.52)) * 0.16 : 0;
      s.fx = SLIDE_DX * easeInOut(slide);
      s.landed = fall >= 1;
      s.morph = win(t, 0.9, 1);
      break;
    }
    case 'done':
      if (r) {
        landedState();
        s.push = 1;
        s.fy = DROP_DY;
        s.fx = SLIDE_DX;
        s.landed = true;
        s.morph = 1;
      }
      break;
  }
  return { ...s, short, flash, sink, fillRatio };
}

function StageSvg({ material, values, result, phase, t, now = 0, xray, labels = true, markers = true }: Props) {
  const { d } = useI18n();
  const s = derive(phase, t, result, now);
  const hasResin = s.progress > 0;
  const tempLevel = clamp01((values.meltTemp - material.tRange[0]) / (material.tRange[1] - material.tRange[0]));
  const heaterColor = mix(P.metal, P.resin, 0.15 + tempLevel * 0.85);
  const solid = rgbToHex(mix(material.color, P.outline, 0.22));
  let resinColor = mix(solid, material.hotColor, s.heat);
  if (s.frost > 0) resinColor = mix(resinColor.startsWith('rgb') ? rgbToHex(resinColor) : resinColor, ICE, s.frost * 0.5);
  const frontColor = s.frontIce > 0 ? mix(material.hotColor, ICE, s.frontIce) : resinColor;
  const moveDx = s.open * OPEN_DX + s.gap;
  const productDx = moveDx - s.push * PIN_DX + s.fx;
  const injecting = phase === 'inject';
  const done = phase === 'done';
  const cooling = phase === 'cool';
  const showResin = xray || s.open > 0.02;
  const screwDx = s.screw * 62;
  const outOfMold = s.open > 0.02;

  const sprueFill = Math.min(s.progress, SPRUE_LEN);
  const branch = Math.max(0, s.progress - SPRUE_LEN);
  const baseLen = Math.min(branch, BASE_LEN);
  const wallLen = Math.max(0, branch - BASE_LEN);
  const frontX = wallLen > 0 ? BASE_CX + wallLen : BASE_CX;
  const frontDy = wallLen > 0 ? CY - WALL_TOP_CY : baseLen;

  const pointAt = (dist: number, sign: 1 | -1): [number, number] =>
    dist <= BASE_LEN ? [BASE_CX, CY - sign * dist] : [BASE_CX + dist - BASE_LEN, CY - sign * (CY - WALL_TOP_CY)];

  const branchSvg = (sign: 1 | -1) => {
    const y = (dy: number) => CY - sign * dy;
    return (
      <g key={sign}>
        {baseLen > 0 && (
          <line x1={BASE_CX} y1={CY} x2={BASE_CX} y2={y(baseLen)} stroke={resinColor} strokeWidth={CUP.base} strokeLinecap="round" />
        )}
        {wallLen > 0 && (
          <line x1={BASE_CX} y1={y(CY - WALL_TOP_CY)} x2={BASE_CX + wallLen} y2={y(CY - WALL_TOP_CY)} stroke={resinColor} strokeWidth={CUP.wall + 2} strokeLinecap="round" />
        )}
      </g>
    );
  };

  // Gooey flow-front blobs ("nyuru")
  const blobs = (sign: 1 | -1) => {
    if (!(injecting || phase === 'hold') || branch <= 0 || branch >= BRANCH_LEN - 1) return null;
    const onWall = wallLen > 0;
    const r0 = (onWall ? CUP.wall : CUP.base) / 2 + 3;
    const w = s.wobble;
    const out: React.ReactElement[] = [];
    for (let i = 0; i < 3; i++) {
      const back = i * 9;
      const [bx, by] = pointAt(Math.max(0, branch - back), sign);
      const rr = r0 * (1 - i * 0.18) + w * 3 * Math.sin(now * 13 + i * 1.7 + sign);
      const jx = onWall ? w * 2 * Math.sin(now * 9 + i) : 0;
      const jy = onWall ? 0 : w * 2 * Math.sin(now * 9 + i);
      out.push(<circle key={i} cx={bx + jx} cy={by + jy} r={Math.max(2, rr)} fill={i === 0 ? frontColor : resinColor} />);
    }
    return out;
  };

  const bubbles = (sign: 1 | -1) =>
    s.heat > 0.45 && !s.flying
      ? [18, 48, 76, 108, 140, 172].map((dist, i) => {
          if (dist > branch - 8) return null;
          const [bx, by] = pointAt(dist, sign);
          return <circle key={i} className="bubble" style={{ animationDelay: `${(i * 0.23 + (sign > 0 ? 0 : 0.4)) % 1}s` }} cx={bx + (dist <= BASE_LEN ? (i % 2 ? -5 : 5) : 0)} cy={by} r={i % 2 ? 2.2 : 3} fill={P.surface} />;
        })
      : null;

  // Product transform (drop onto conveyor + squash on landing)
  const pcx = (CUP.x0 + PX) / 2;
  const productTransform =
    `translate(${productDx},${s.fy}) ` +
    `rotate(${s.rot} ${pcx} ${CY}) ` +
    `translate(${pcx},${CUP.y1}) scale(${1 + s.squash * 0.6},${1 - s.squash}) translate(${-pcx},${-CUP.y1})`;

  const towerColor = done && result ? (result.outcome === 'good' ? 'g' : 'r') : phase === 'idle' ? '' : 'y';

  // Flash droplets squirting from the parting line
  const drops =
    s.flash && phase === 'hold'
      ? [0, 1, 2].flatMap((i) => {
          const tt = win(t, 0.08 + i * 0.1, 0.7 + i * 0.1);
          if (tt <= 0 || tt >= 1) return [];
          const x = PX + s.gap + 6 + (18 + i * 16) * tt;
          const up = CUP.y0 - (40 + i * 18) * tt + 70 * tt * tt;
          const dn = CUP.y1 + (40 + i * 18) * tt - 20 * tt * tt;
          return [
            <circle key={`u${i}`} cx={x} cy={up} r={4 - i} fill={resinColor} stroke={NAVY} strokeWidth="1.5" opacity={1 - tt * 0.6} />,
            <circle key={`d${i}`} cx={x} cy={dn} r={4 - i} fill={resinColor} stroke={NAVY} strokeWidth="1.5" opacity={1 - tt * 0.6} />,
          ];
        })
      : null;

  const cam = viewBox(s.cam);
  const sfx: { key: string; x: number; y: number; text: string; color: string; rot?: number } | null = (() => {
    if (phase === 'close' && t > 0.8) return { key: 'close', x: PX + 10, y: 118, text: d.sfx.close, color: NAVY, rot: -6 };
    if (injecting && s.short && t > 0.82) return { key: 'short', x: frontX + 26, y: CY - frontDy - 30, text: d.sfx.short, color: P.error, rot: -4 };
    if (injecting && t > 0.05 && t < 0.55) return { key: 'inject', x: 360, y: 184, text: d.sfx.inject, color: P.resin, rot: -8 };
    if (phase === 'hold' && s.short) return { key: 'short', x: frontX + 26, y: CY - frontDy - 30, text: d.sfx.short, color: P.error, rot: -4 };
    if (phase === 'hold' && s.flash && t > 0.1) return { key: 'flash', x: PX + 40, y: CUP.y0 - 44, text: d.sfx.flash, color: P.error, rot: 6 };
    if (cooling && s.sink && t > 0.6) return { key: 'sink', x: 380, y: 330, text: d.sfx.sink, color: P.error, rot: -5 };
    if (cooling && t > 0.05 && t < 0.6) return { key: 'cool', x: 560, y: 118, text: d.sfx.cool, color: P.primary, rot: -4 };
    if (phase === 'open' && t < 0.8) return { key: 'open', x: PX + 110, y: 150, text: d.sfx.open, color: NAVY, rot: 5 };
    if (phase === 'eject' && t > 0.12 && t < 0.6) return { key: 'eject', x: PX + 70, y: 140, text: d.sfx.eject, color: P.primary, rot: -8 };
    return null;
  })();

  return (
    <svg className="stage-svg" viewBox={viewBoxString(cam)} role="img" aria-label={d.parts.mold}>
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="rgba(44,48,60,.08)" />
        </pattern>
        <filter id="goo" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="barrelMelt" x1="0" x2="1">
          <stop offset="0" stopColor={INK2} />
          <stop offset=".5" stopColor={material.hotColor} stopOpacity=".35" />
          <stop offset="1" stopColor={material.hotColor} stopOpacity=".85" />
        </linearGradient>
        <radialGradient id="frontGlow">
          <stop offset="0" stopColor={P.surface} />
          <stop offset=".45" stopColor={P.resinGlow} stopOpacity=".95" />
          <stop offset="1" stopColor={P.resin} stopOpacity="0" />
        </radialGradient>
        <clipPath id="cavityClip">
          <path d={CAVITY_PATH} clipRule="evenodd" />
          <path d={SPRUE_PATH} />
        </clipPath>
        <clipPath id="fixedClip">
          <path d={FIXED_PATH} />
        </clipPath>
        <clipPath id="movingClip">
          <path d={MOVING_PATH} />
        </clipPath>
      </defs>

      <rect x="0" y="40" width="1120" height="520" fill="url(#dots)" />
      {/* Floor */}
      <ellipse cx="560" cy="548" rx="540" ry="14" fill="rgba(44,48,60,.07)" />

      <g transform={`translate(${s.shake},0)`}>
        {/* Tie bars */}
        {[96, 376].map((y) => (
          <rect key={y} x="440" y={y - 5} width="570" height="10" rx="5" fill={P.metalLight} stroke={NAVY} strokeWidth="2" />
        ))}

        {/* Machine bed + legs */}
        <rect x="30" y="404" width="1066" height="28" rx="12" fill={INK2} stroke={NAVY} strokeWidth="3" />
        {[70, 420, 700, 1040].map((x) => (
          <rect key={x} x={x} y="430" width="26" height="110" rx="6" fill={INK2} stroke={NAVY} strokeWidth="3" />
        ))}

        {/* Injection unit */}
        <g>
          <rect x="30" y="178" width="96" height="124" rx="20" fill={BODY} stroke={NAVY} strokeWidth="3" />
          <rect x="40" y="186" width="18" height="108" rx="9" fill="rgba(255,255,255,.28)" />
          <circle cx="80" cy="222" r="19" fill={P.surface} stroke={NAVY} strokeWidth="3" />
          <path d={describeArc(80, 222, 13, -120, 120)} stroke={P.metalLight} strokeWidth="4" fill="none" />
          <path d={describeArc(80, 222, 13, 60, 120)} stroke={P.outline} strokeWidth="4" fill="none" />
          <line
            x1="80"
            y1="222"
            x2={80 + 12 * Math.sin(((-120 + 240 * s.pressure) * Math.PI) / 180)}
            y2={222 - 12 * Math.cos(((-120 + 240 * s.pressure) * Math.PI) / 180)}
            stroke={NAVY}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="62" y="258" width="36" height="12" rx="6" fill={BODY_D} />
          <circle cx="68" cy="264" r="3" fill={phase === 'idle' || done ? P.successContainer : P.primaryTint} />
          <circle cx="80" cy="264" r="3" fill={P.successContainer} />
          <circle cx="92" cy="264" r="3" fill={P.successContainer} />
          <rect x="62" y="300" width="36" height="106" fill={INK2} stroke={NAVY} strokeWidth="3" />
        </g>

        {/* Hopper */}
        <g>
          <path d="M146,66 H242 L210,164 H178 Z" fill={HOPPER} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
          <path d="M156,74 H232 L204,156 H184 Z" fill={P.surface} />
          <path d="M150,66 H238" stroke={P.surface} strokeOpacity=".6" strokeWidth="4" strokeLinecap="round" />
          <g className={phase === 'idle' || done ? 'jiggle' : ''}>
            {Array.from({ length: 22 }).map((_, i) => {
              const cx = 168 + ((i * 29) % 54);
              const cy = 100 + Math.floor(i / 5) * 12 + ((i * 7) % 4);
              const inside = cx > 162 + (cy - 74) * 0.34 && cx < 226 - (cy - 74) * 0.34;
              return inside ? <ellipse key={i} cx={cx} cy={cy} rx="5.5" ry="4" fill={material.color} stroke={NAVY} strokeWidth="1.5" /> : null;
            })}
          </g>
          <rect x="182" y="162" width="24" height="48" fill={P.metalLight} stroke={NAVY} strokeWidth="3" />
          {cooling &&
            [0, 1, 2].map((i) => (
              <ellipse key={i} className="drop" style={{ animationDelay: `${i * 0.28}s` }} cx="194" cy="176" rx="5" ry="3.8" fill={material.color} stroke={NAVY} strokeWidth="1.5" />
            ))}
        </g>

        {/* Heat waves above the barrel */}
        <g opacity={0.25 + tempLevel * 0.75} stroke={P.resin} strokeWidth="3" fill="none" strokeLinecap="round">
          {[250, 300, 350].map((x, i) => (
            <path key={x} className="heatwave" style={{ animationDelay: `${i * 0.35}s` }} d={`M${x},196 q6,-8 0,-16 q-6,-8 0,-16`} />
          ))}
        </g>

        {/* Barrel */}
        <g>
          <rect x="118" y="206" width="308" height="68" rx="16" fill={P.metalLight} stroke={NAVY} strokeWidth="3" />
          <rect x="132" y="222" width="282" height="36" rx="10" fill="url(#barrelMelt)" stroke={NAVY} strokeWidth="2" />
          <g transform={`translate(${screwDx},0)`}>
            <rect x="124" y="236" width="212" height="8" rx="4" fill={P.metalLight} stroke={NAVY} strokeWidth="1.5" />
            {Array.from({ length: 13 }).map((_, i) => {
              const x = 140 + i * 15 - ((s.spin * 90) % 15);
              return x < 330 ? <path key={i} d={`M${x},226 L${x + 8},254`} stroke={P.metalLight} strokeWidth="4" strokeLinecap="round" /> : null;
            })}
            <path d="M336,226 L354,240 L336,254 Z" fill={P.metalLight} stroke={NAVY} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
          <g filter="url(#goo)">
            <rect x={356 + screwDx} y="227" width={Math.max(0, 56 - screwDx)} height="26" rx="8" fill={material.hotColor} />
            {injecting &&
              [0, 1, 2].map((i) => {
                const px = 360 + ((now * 160 + i * 40) % 100);
                return <circle key={i} cx={Math.max(360 + screwDx, px)} cy={240} r={7} fill={material.hotColor} />;
              })}
          </g>
          {[166, 226, 286, 346].map((x) => (
            <rect key={x} x={x} y="200" width="30" height="80" rx="8" fill={heaterColor} stroke={NAVY} strokeWidth="2.5" style={{ filter: tempLevel > 0.5 ? 'url(#glow)' : undefined }} className="heater" />
          ))}
          {/* Nozzle */}
          <path d="M424,220 L456,232 L472,236 L472,244 L456,248 L424,260 Z" fill={P.metalLight} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
          {(injecting || phase === 'hold') && <rect x="430" y="237" width="42" height="6" rx="3" fill={material.hotColor} className="pulse" />}
        </g>

        {/* Fixed platen */}
        <rect x="438" y="66" width="34" height="340" rx="10" fill={INK2} stroke={NAVY} strokeWidth="3" />

        {/* Moving half, core, platen */}
        <g transform={`translate(${moveDx},0)`}>
          <rect x={PX + 170} y="66" width="34" height="340" rx="10" fill={INK2} stroke={NAVY} strokeWidth="3" />
          <path d={MOVING_PATH} className="plate" fill={xray ? P.glass : STEEL_2} stroke={xray ? P.primary : NAVY} strokeWidth="3" strokeLinejoin="round" />
          {!xray && <path d={`M${PX + 12},102 V378`} stroke="rgba(255,255,255,.45)" strokeWidth="6" strokeLinecap="round" />}
          {xray && (
            <g clipPath="url(#movingClip)" fill={P.surface} opacity=".55">
              <path d={`M${PX + 40},390 l30,0 l70,-300 l-30,0 Z`} />
              <path d={`M${PX + 88},390 l10,0 l70,-300 l-10,0 Z`} />
            </g>
          )}
          {[
            [700, 150],
            [700, 330],
            [592, 205],
            [592, 275],
            [765, 240],
          ].map(([cx, cy]) => (
            <Channel key={`${cx}${cy}`} cx={cx} cy={cy} on={cooling} />
          ))}
          {[205, 275].map((py) => (
            <rect key={py} x={CORE.x0 + 6 - s.push * PIN_DX} y={py - 3.5} width={PX + 170 - CORE.x0 - 6} height="7" rx="3.5" fill={P.surface} stroke={NAVY} strokeWidth="1.5" opacity={xray || s.push > 0 ? 1 : 0} />
          ))}
        </g>

        {/* Empty cavity (x-ray) */}
        {xray && (
          <g>
            <path
              d={outOfMold ? `M${CUP.x0},${CUP.y0} H${PX} V${CUP.y1} H${CUP.x0} Z` : CAVITY_PATH}
              fillRule="evenodd"
              fill={P.surface}
              stroke={P.primary}
              strokeWidth="1.8"
              strokeDasharray="5 4"
            />
            <path d={SPRUE_PATH} fill={P.surface} stroke={P.primary} strokeWidth="1.8" />
          </g>
        )}

        {/* Resin / product */}
        {hasResin && (
          <g transform={productTransform} opacity={showResin ? 1 - s.morph : 0}>
            <g clipPath="url(#cavityClip)">
              <g filter="url(#goo)">
                {!outOfMold && <line x1="462" y1={CY} x2={466 + sprueFill} y2={CY} stroke={resinColor} strokeWidth="16" />}
                {branchSvg(1)}
                {branchSvg(-1)}
                {blobs(1)}
                {blobs(-1)}
              </g>
              {(injecting || (phase === 'hold' && s.short)) && branch > 0 && branch < BRANCH_LEN - 1 &&
                [1, -1].map((sg) => {
                  const [fx, fy] = pointAt(branch, sg as 1 | -1);
                  return <circle key={sg} cx={fx} cy={fy} r={16 + 3 * s.wobble * Math.sin(now * 12)} fill={s.frontIce > 0.5 ? P.primaryContainer : 'url(#frontGlow)'} opacity={0.95} />;
                })}
              {bubbles(1)}
              {bubbles(-1)}
              {injecting && (
                <g className="flowlines" stroke="rgba(255,255,255,.85)" strokeWidth="2.5" fill="none" strokeDasharray="3 9" strokeLinecap="round">
                  <path d={`M${BASE_CX},${CY} V${CY - Math.min(baseLen, CY - WALL_TOP_CY)}${wallLen > 0 ? ` H${BASE_CX + wallLen}` : ''}`} />
                  <path d={`M${BASE_CX},${CY} V${CY + Math.min(baseLen, CY - WALL_TOP_CY)}${wallLen > 0 ? ` H${BASE_CX + wallLen}` : ''}`} />
                </g>
              )}
              {s.sinkAmt > 0 && (
                <path d={`M${CORE.x0 + 1},184 Q${CORE.x0 - 18 * s.sinkAmt},${CY} ${CORE.x0 + 1},296 Z`} fill={outOfMold || xray ? P.surface : 'transparent'} stroke={s.sinkAmt > 0.3 ? P.error : 'none'} strokeWidth="2" />
              )}
              {s.frontIce > 0.3 && s.progress > SPRUE_LEN && (
                <g stroke={P.surface} strokeWidth="2" strokeLinecap="round" opacity={s.frontIce}>
                  {[1, -1].map((sg) => {
                    const fy = CY - sg * frontDy;
                    return <path key={sg} d={`M${frontX - 5},${fy - 5} l10,10 M${frontX + 5},${fy - 5} l-10,10 M${frontX},${fy - 7} v14`} />;
                  })}
                </g>
              )}
            </g>
            {/* Outline once the part is out of the mold */}
            {(outOfMold || s.heat < 0.55) && !s.short && s.progress >= SPRUE_LEN + BRANCH_LEN - 1 && (
              <path d={CAVITY_PATH} fillRule="evenodd" fill="none" stroke={NAVY} strokeWidth="3" opacity={outOfMold ? 1 : clamp01((0.55 - s.heat) * 4)} />
            )}
            {/* Flash: thin film squeezed out along the parting line */}
            {s.flashAmt > 0 && (
              <g fill={resinColor} stroke={NAVY} strokeWidth="1.5" strokeLinejoin="round">
                {[
                  [CUP.y0, -1],
                  [CUP.y1, 1],
                ].map(([y, sg]) => (
                  <path
                    key={y}
                    d={`M${PX - 4},${y} L${PX + 4},${y} L${PX + 6},${y + sg * 38 * s.flashAmt} L${PX + 1},${y + sg * 46 * s.flashAmt} L${PX - 2},${y + sg * 60 * s.flashAmt} L${PX - 5},${y + sg * 42 * s.flashAmt} Z`}
                  />
                ))}
              </g>
            )}
          </g>
        )}

        {/* Flash droplets */}
        {drops && <g transform={`translate(${productDx - moveDx},0)`}>{drops}</g>}

        {/* Fixed half (hides the cavity unless x-ray) */}
        <g>
          <path d={FIXED_PATH} className="plate" fill={xray ? P.glass : STEEL} stroke={xray ? P.primary : NAVY} strokeWidth="3" strokeLinejoin="round" />
          {!xray && !outOfMold && <path d={CAVITY_PATH} fillRule="evenodd" fill={STEEL} />}
          {!xray && !outOfMold && <rect x={CORE.x0} y={CORE.y0} width={PX - CORE.x0} height={CORE.y1 - CORE.y0} fill={STEEL} />}
          {!xray && <path d="M484,102 V378" stroke="rgba(255,255,255,.5)" strokeWidth="6" strokeLinecap="round" />}
          {xray && (
            <g clipPath="url(#fixedClip)" fill={P.surface} opacity=".6">
              <path d="M478,390 l34,0 l80,-300 l-34,0 Z" />
              <path d="M530,390 l10,0 l80,-300 l-10,0 Z" />
            </g>
          )}
          {[
            [500, 130],
            [500, 350],
            [592, 116],
            [592, 364],
            [492, 196],
            [492, 284],
          ].map(([cx, cy]) => (
            <Channel key={`${cx}${cy}`} cx={cx} cy={cy} on={cooling} />
          ))}
        </g>

        {/* Parting-line glow for flash */}
        {s.gap > 0.5 && <rect x={PX} y="90" width={s.gap} height="300" fill={P.resin} className="pulse" />}

        {/* Steam while cooling */}
        {cooling &&
          [492, 530, 570, 610, 700, 760].map((x, i) => (
            <circle key={x} className="steam" style={{ animationDelay: `${(i * 0.17) % 0.8}s` }} cx={x + (x > 640 ? moveDx : 0)} cy="84" r={10 + (i % 3) * 3} fill={P.surface} stroke={P.outlineVariant} strokeWidth="2" />
          ))}

        {/* Clamp unit + signal tower */}
        <g>
          <rect x={PX + 204 + moveDx} y="222" width={Math.max(0, 1004 - (PX + 204 + moveDx))} height="36" rx="8" fill={P.metalLight} stroke={NAVY} strokeWidth="3" />
          <rect x="996" y="168" width="100" height="144" rx="20" fill={BODY} stroke={NAVY} strokeWidth="3" />
          <rect x="1006" y="176" width="18" height="128" rx="9" fill="rgba(255,255,255,.28)" />
          <rect x="1036" y="300" width="26" height="106" fill={INK2} stroke={NAVY} strokeWidth="3" />
          <rect x="1044" y="150" width="10" height="20" fill={INK2} />
          {(
            [
              ['r', P.error],
              ['y', P.primary],
              ['g', P.success],
            ] as const
          ).map(([k, c], i) => {
            const on = towerColor === k;
            return (
              <rect
                key={k}
                x="1034"
                y={84 + i * 22}
                width="30"
                height="22"
                rx={i === 0 ? 8 : 2}
                fill={on ? c : P.metalLight}
                stroke={NAVY}
                strokeWidth="2.5"
                className={on && done && k === 'r' ? 'blink' : undefined}
                style={{ filter: on ? 'url(#glow)' : undefined }}
              />
            );
          })}
        </g>

        {/* Conveyor */}
        <g>
          <rect x="560" y={BELT_Y} width="536" height="22" rx="11" fill={INK2} stroke={NAVY} strokeWidth="3" />
          <line x1="575" x2="1080" y1={BELT_Y + 6} y2={BELT_Y + 6} stroke={P.outline} strokeWidth="3" strokeDasharray="10 12" className={phase === 'eject' && t > 0.6 ? 'belt-move' : ''} />
          {[578, 1078].map((x) => (
            <circle key={x} cx={x} cy={BELT_Y + 11} r="8" fill={P.metalLight} stroke={NAVY} strokeWidth="2.5" />
          ))}
        </g>

        {/* The finished part pops out of its cross-section */}
        {s.morph > 0 && result && (
          <g>
            <g className="burst" transform={`translate(922,${BELT_Y - 70})`}>
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 70} y1={Math.sin(a) * 70} x2={Math.cos(a) * 98} y2={Math.sin(a) * 98} stroke={result.outcome === 'good' ? P.success : P.outline} strokeWidth="5" strokeLinecap="round" />;
              })}
            </g>
            <g className="cup-pop">
              <ProductArt x={922 - 120} y={BELT_Y + 4 - 240 * 0.85} size={240} outcome={result.outcome} color={material.color} fillRatio={result.fillRatio} />
            </g>
            {markers && done && result.outcome === 'good' &&
              [
                [806, 360, 1.1],
                [1036, 380, 0.9],
                [1030, 470, 1.2],
                [812, 468, 0.8],
              ].map(([x, y, k], i) => <Sparkle key={i} x={x} y={y} k={k} delay={0.3 + i * 0.15} />)}
          </g>
        )}

        {/* Eject burst */}
        {phase === 'eject' && t > 0.1 && t < 0.45 && (
          <g className="burst" transform={`translate(${PX + moveDx - PIN_DX - 40},${CY})`}>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 52} y2={Math.sin(a) * 52} stroke={P.primary} strokeWidth="4" strokeLinecap="round" />;
            })}
          </g>
        )}

        {/* Part labels: only a few, placed in empty space */}
        {labels && phase === 'idle' && (
          <g className="labels">
            <Label x={100} y={118} text={d.parts.hopper} />
            <Label x={272} y={304} text={d.parts.barrel} />
            <Label x={PX + moveDx / 2} y={80} text={d.parts.mold} />
          </g>
        )}
      </g>

      {sfx && <Sfx key={sfx.key} {...fitSfx(sfx.x, sfx.y, sfx.text, cam)} text={sfx.text} color={sfx.color} rot={sfx.rot} />}
    </svg>
  );
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Camera: whole machine ↔ close-up on the mold (same aspect ratio). */
function viewBox(k: number): Rect {
  const W = 1120;
  const H = 520;
  const zw = 700;
  const zh = (zw * H) / W;
  const x = 0 + (300 - 0) * k;
  const y = 40 + (240 - zh / 2 - 40) * k;
  const w = W + (zw - W) * k;
  const h = H + (zh - H) * k;
  return { x, y, w, h };
}

const viewBoxString = (r: Rect) => `${r.x} ${r.y} ${r.w} ${r.h}`;

/** Largest .sfx font size (phones, see index.css) — used so the sound word always fits the frame. */
const SFX_EM = 70;
/** Pop-in animation overshoots to ~1.15× before settling. */
const SFX_OVERSHOOT = 1.15;

/**
 * Keeps a sound word inside the current camera frame. Positions are authored for the
 * whole-machine view; when the camera zooms (or the word is long, e.g. in English)
 * it would otherwise be cut off at the edge.
 */
function fitSfx(x: number, y: number, text: string, cam: Rect) {
  let em = 0;
  for (const ch of text) em += /[\u3000-\u9fff\uff00-\uffef…]/.test(ch) ? 1 : 0.9;
  const half = (em * SFX_EM * SFX_OVERSHOOT) / 2 + 10;
  const up = SFX_EM * 1.3 * SFX_OVERSHOOT + 10; // display font ascent + white outline + rotation
  const down = SFX_EM * 0.3 + 10;
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));
  return { x: clamp(x, cam.x + half, cam.x + cam.w - half), y: clamp(y, cam.y + up, cam.y + cam.h - down) };
}

function Channel({ cx, cy, on }: { cx: number; cy: number; on: boolean }) {
  return (
    <g>
      {on && <circle cx={cx} cy={cy} r="9" className="ripple" fill="none" stroke={P.water} strokeWidth="2" />}
      <circle cx={cx} cy={cy} r="9" fill={on ? P.water : P.metalLight} stroke={NAVY} strokeWidth="2.5" className={on ? 'channel-on' : undefined} />
    </g>
  );
}

function Sparkle({ x, y, k, delay }: { x: number; y: number; k: number; delay: number }) {
  return (
    <path
      className="sparkle"
      style={{ animationDelay: `${delay}s` }}
      transform={`translate(${x},${y}) scale(${k})`}
      d="M0,-14 C2,-4 4,-2 14,0 C4,2 2,4 0,14 C-2,4 -4,2 -14,0 C-4,-2 -2,-4 0,-14 Z"
      fill={P.successContainer}
      stroke={P.success}
      strokeWidth="2"
    />
  );
}

function Label({ x, y, text, color = NAVY }: { x: number; y: number; text: string; color?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} className="svg-label">
      {text}
    </text>
  );
}

function Sfx({ x, y, text, color, rot = 0 }: { x: number; y: number; text: string; color: string; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <text className="sfx" textAnchor="middle" fill={color}>
        {text}
      </text>
    </g>
  );
}

function describeArc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
}

function rgbToHex(rgb: string) {
  const m = rgb.match(/\d+/g) ?? ['0', '0', '0'];
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

export default memo(StageSvg);
