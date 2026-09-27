import { useId } from 'react';
import type { Outcome } from '../game';
import { mix } from './color';
import { palette as P } from '../theme';

interface Props {
  outcome: Outcome;
  color: string;
  /** For short shots: how much of the part filled (0.3..1). */
  fillRatio?: number;
  size?: number;
  ghost?: boolean;
  /** Idle float animation */
  animate?: boolean;
  /** Position when nested inside another SVG */
  x?: number;
  y?: number;
  className?: string;
}

const NAVY = P.ink;

/** Flat, outlined illustration of the molded cup holder with the defect drawn on it. */
export default function ProductArt({ outcome, color, fillRatio = 0.7, size = 180, ghost = true, animate = false, x, y, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const shade = mix(color, P.outline, 0.35);
  const deep = mix(color, P.ink, 0.55);
  const top = outcome === 'short' ? 60 + (1 - fillRatio) * 70 : 60;
  const bite =
    outcome === 'short'
      ? `M20,${top + 6} L44,${top - 2} L58,${top + 10} L76,${top + 1} L92,${top + 14} L110,${top + 3} L128,${top + 12} L146,${top} L168,${top + 8} V200 H20 Z`
      : 'M0,0 H200 V200 H0 Z';

  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 200 200" className={`product-art${animate ? ' floaty' : ''} ${className}`} aria-hidden overflow="visible">
      <defs>
        <clipPath id={`c${id}`}>
          <path d={bite} />
        </clipPath>
        <clipPath id={`b${id}`}>
          <path d="M38,60 L50,146 A50,15 0 0 0 150,146 L162,60 Z" />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="170" rx="72" ry="11" fill={NAVY} opacity=".12" />

      {outcome === 'short' && ghost && (
        <g fill="none" stroke={P.error} strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round">
          <ellipse cx="100" cy="60" rx="62" ry="22" />
          <path d={`M38,60 L${38 + ((top - 60) / 86) * 12},${top}`} />
          <path d={`M162,60 L${162 - ((top - 60) / 86) * 12},${top}`} />
        </g>
      )}

      {/* Flange */}
      <ellipse cx="100" cy="153" rx="66" ry="18" fill={shade} stroke={NAVY} strokeWidth="2.5" />
      <ellipse cx="100" cy="148" rx="66" ry="18" fill={color} stroke={NAVY} strokeWidth="2.5" />

      <g clipPath={`url(#c${id})`}>
        {/* Body */}
        <path d="M38,60 L50,146 A50,15 0 0 0 150,146 L162,60 Z" fill={color} stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" />
        <g clipPath={`url(#b${id})`}>
          <rect x="122" y="40" width="60" height="130" fill={NAVY} opacity=".13" />
          <path d="M58,62 L66,150" stroke={P.surface} strokeWidth="9" strokeLinecap="round" opacity=".75" />
          <path d="M76,64 L80,150" stroke={P.surface} strokeWidth="3" strokeLinecap="round" opacity=".6" />
          {/* Grip ribs */}
          {[98, 118].map((y) => (
            <path key={y} d={`M${42 + (y - 60) * 0.14},${y} Q100,${y + 16} ${158 - (y - 60) * 0.14},${y}`} fill="none" stroke={NAVY} strokeOpacity=".25" strokeWidth="2" />
          ))}
          {outcome === 'sink' && (
            <g>
              <ellipse cx="100" cy="126" rx="30" ry="12" fill={deep} opacity=".8" />
              <ellipse cx="102" cy="129" rx="19" ry="7" fill={NAVY} opacity=".55" />
              <path d="M72,122 Q100,112 128,122" fill="none" stroke={P.surface} strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
              <path d="M76,134 Q100,142 124,134" fill="none" stroke={NAVY} strokeWidth="2" strokeLinecap="round" opacity=".5" />
            </g>
          )}
        </g>
        {/* Rim + opening */}
        <ellipse cx="100" cy="60" rx="62" ry="22" fill={mix(color, P.surface, 0.35)} stroke={NAVY} strokeWidth="2.5" />
        <ellipse cx="100" cy="62" rx="50" ry="16" fill={deep} />
        <ellipse cx="100" cy="66" rx="40" ry="10" fill={NAVY} opacity=".35" />
      </g>

      {/* Short shot: jagged, frozen edge */}
      {outcome === 'short' && (
        <>
          <path
            d={`M${38 + ((top - 60) / 86) * 12},${top + 6} L44,${top - 2} L58,${top + 10} L76,${top + 1} L92,${top + 14} L110,${top + 3} L128,${top + 12} L146,${top} L${162 - ((top - 60) / 86) * 12},${top + 6}`}
            fill="none"
            stroke={NAVY}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d={`M44,${top - 2} L58,${top + 10} L76,${top + 1} L92,${top + 14} L110,${top + 3} L128,${top + 12} L146,${top}`}
            fill="none"
            stroke={P.primaryTint}
            strokeWidth="4"
            strokeLinejoin="round"
            opacity=".9"
          />
        </>
      )}

      {/* Flash: thin film sticking out of the rim */}
      {outcome === 'flash' && (
        <g>
          <path
            d="M30,58 C24,46 40,40 50,38 L52,28 L62,35 C76,26 92,24 100,25 L106,14 L114,25 C132,25 150,30 160,37 L172,30 L170,44 C180,52 178,64 168,70 L176,80 L160,79 C148,86 128,90 100,90 L94,100 L86,89 C66,88 48,82 40,76 L26,80 L32,68 C26,64 26,62 30,58 Z"
            fill={color}
            fillOpacity=".75"
            stroke={P.error}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <ellipse cx="100" cy="60" rx="62" ry="22" fill={mix(color, P.surface, 0.35)} stroke={NAVY} strokeWidth="2.5" />
          <ellipse cx="100" cy="62" rx="50" ry="16" fill={deep} />
          <ellipse cx="100" cy="66" rx="40" ry="10" fill={NAVY} opacity=".35" />
        </g>
      )}

      {outcome === 'good' && (
        <path d="M150,30 C151,36 152,37 158,38 C152,39 151,40 150,46 C149,40 148,39 142,38 C148,37 149,36 150,30 Z" fill={P.successContainer} stroke={P.success} strokeWidth="1.8" />
      )}
    </svg>
  );
}
