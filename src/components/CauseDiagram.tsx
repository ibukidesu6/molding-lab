import type { Material, SimResult } from '../game';
import { useI18n } from '../i18n';
import { palette as P } from '../theme';

/** Small animated diagram that connects the result to its cause. */
export default function CauseDiagram({ result, material }: { result: SimResult; material: Material }) {
  const { d } = useI18n();
  const key = `${result.outcome}-${result.flowIndex.toFixed(3)}-${result.flashIndex.toFixed(3)}`;

  if (result.outcome === 'short') {
    const w = 250 * result.fillRatio;
    return (
      <svg key={key} viewBox="0 0 300 120" className="diagram">
        <defs>
          <linearGradient id="cd-short" x1="0" x2="1">
            <stop offset="0" stopColor={P.resin} />
            <stop offset=".7" stopColor={P.resinGlow} />
            <stop offset="1" stopColor={P.primaryTint} />
          </linearGradient>
        </defs>
        <text x="25" y="30" className="dg-small">{d.parts.gate}</text>
        <rect x="25" y="44" width="250" height="26" rx="13" fill={P.surface} stroke={P.error} strokeWidth="1.6" strokeDasharray="5 4" />
        <rect x="25" y="44" width={w} height="26" rx="13" fill="url(#cd-short)" className="grow-x" />
        <g transform={`translate(${25 + w - 13},57)`} className="fade-in-late">
          <circle r="11" fill={P.surface} stroke={P.primary} strokeWidth="1.6" />
          <path d="M0 -6V6M-5.2 -3 5.2 3M5.2 -3-5.2 3" stroke={P.primary} strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <text x={25 + w} y="94" textAnchor="middle" className="dg-strong fade-in-late">
          {d.diagram.reach} {Math.round(result.fillRatio * 100)}%
        </text>
        <text x="275" y="94" textAnchor="end" className="dg-bad">{d.diagram.need} 100%</text>
        <text x={25 + w} y="112" textAnchor="middle" className="dg-small fade-in-late">{d.diagram.frozen}</text>
      </svg>
    );
  }

  if (result.outcome === 'flash') {
    const scale = 180 / 1.5;
    const push = Math.min(1.5, result.flashIndex) * scale;
    const clampX = 95 + scale;
    return (
      <svg key={key} viewBox="0 0 300 120" className="diagram">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={P.errorContainer} />
            <line x1="0" y1="0" x2="0" y2="6" stroke={P.error} strokeWidth="3" />
          </pattern>
        </defs>
        <text x="85" y="42" textAnchor="end" className="dg-label">{d.diagram.push}</text>
        <rect x="95" y="28" width={push} height="20" rx="4" fill={P.secondary} className="grow-x" />
        <rect x={clampX} y="28" width={Math.max(0, push - scale)} height="20" fill="url(#hatch)" className="fade-in-late" />
        <text x="85" y="82" textAnchor="end" className="dg-label">{d.diagram.clamp}</text>
        <rect x="95" y="68" width={scale} height="20" rx="4" fill={P.surfaceHighest} />
        <line x1={clampX} x2={clampX} y1="18" y2="98" stroke={P.onSurface} strokeWidth="1.6" strokeDasharray="4 3" />
        <text x={clampX} y="114" textAnchor="middle" className="dg-small">{d.diagram.parting}</text>
      </svg>
    );
  }

  if (result.outcome === 'sink') {
    const cooling = result.sinkCause === 'cooling';
    const have = cooling ? result.coolTime : result.packing;
    const need = cooling ? result.coolNeed : result.packNeed;
    const unit = cooling ? 's' : 'MPa';
    const ratio = Math.min(1, have / need);
    return (
      <svg key={key} viewBox="0 0 300 120" className="diagram">
        <rect x="22" y="22" width="70" height="44" rx="4" fill={P.resin} />
        <text x="57" y="84" textAnchor="middle" className="dg-small">{d.diagram.before}</text>
        <path d="M104 44h26m-7-6 7 6-7 6" stroke={P.outline} strokeWidth="1.8" fill="none" />
        <path d="M142,22 Q177,42 212,22 V66 H142 Z" fill={material.color} stroke={P.outline} className="sink-dent" />
        <path d="M177 14v12m-4-4 4 4 4-4" stroke={P.error} strokeWidth="1.8" fill="none" className="fade-in-late" />
        <text x="177" y="84" textAnchor="middle" className="dg-small">{d.diagram.after}</text>
        <text x="228" y="48" className="dg-bad">{d.diagram.shrink}</text>
        <text x="22" y="106" className="dg-label">{cooling ? d.diagram.cool : d.diagram.pack}</text>
        <rect x="92" y="96" width="140" height="12" rx="6" fill={P.surfaceHigh} />
        <rect x="92" y="96" width={140 * ratio} height="12" rx="6" fill={P.primary} className="grow-x" />
        <text x="240" y="106" className="dg-small">
          {Math.round(have)}/{Math.round(need)}
          {unit}
        </text>
      </svg>
    );
  }

  const rows: [string, number][] = [
    [d.meters.flow, Math.min(1, result.flowIndex / 1.5)],
    [d.meters.flash, Math.min(1, result.flashIndex)],
    [d.meters.sink, Math.min(1, result.sinkIndex)],
  ];
  return (
    <svg key={key} viewBox="0 0 300 120" className="diagram">
      {rows.map(([label, v], i) => (
        <g key={label} transform={`translate(0,${20 + i * 34})`}>
          <text x="0" y="14" className="dg-label">{label}</text>
          <rect x="110" y="4" width="150" height="12" rx="6" fill={P.surfaceHigh} />
          <rect x="110" y="4" width={150 * v} height="12" rx="6" fill={P.success} className="grow-x" />
          <path d="M272 10l5 5 9-10" stroke={P.success} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
