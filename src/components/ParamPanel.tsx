import { memo, useMemo } from 'react';
import {
  PARAM_ORDER,
  paramDef,
  simulate,
  type Hint,
  type Material,
  type Mission,
  type Outcome,
  type ParamId,
  type ParamValues,
} from '../game';
import { useI18n } from '../i18n';
import { IconDown, IconPlay, IconUp, PARAM_ICONS } from './Icons';

interface Props {
  mission: Mission;
  material: Material;
  values: ParamValues;
  onChange: (id: ParamId, v: number) => void;
  hints: Hint[];
  highlight: ParamId | null;
  seen: Outcome[];
  /** Params introduced by this mission (shown with a NEW badge until cleared). */
  fresh: ParamId[];
  onStart: () => void;
}

/** Only the conditions the player can change right now + the one big Start button. */
function ParamPanel({ mission, material, values, onChange, hints, highlight, seen, fresh, onStart }: Props) {
  const { d } = useI18n();
  const live = useMemo(() => simulate(mission, values), [mission, values]);
  const params = PARAM_ORDER.filter((p) => mission.params.includes(p));

  const meters = (
    [
      { id: 'flow', unlock: 'short', value: live.flowIndex, good: live.flowIndex >= 1 },
      { id: 'flash', unlock: 'flash', value: live.flashIndex, good: live.flashIndex < 1 },
      { id: 'sink', unlock: 'sink', value: live.sinkIndex, good: live.sinkIndex < 1 },
    ] as const
  ).filter((m) => seen.includes(m.unlock));

  return (
    <section className="params" aria-label={d.ui.conditions}>
      <header className="side-head">
        <span className="step-dot">1</span>
        <h2>{d.ui.todo1}</h2>
      </header>

      <div className="sliders">
        {params.map((id) => {
          const def = paramDef(id, material);
          const Icon = PARAM_ICONS[id];
          const text = d.params[id];
          const hint = hints.find((h) => h.param === id);
          const pct = ((values[id] - def.min) / (def.max - def.min)) * 100;
          return (
            <div key={id} className={`slider${hint ? ' hinted' : ''}${highlight === id ? ' flash-hl' : ''}${fresh.includes(id) ? ' fresh' : ''}`} id={`param-${id}`}>
              <div className="slider-top">
                <span className="slider-icon">
                  <Icon size={24} />
                </span>
                <label className="slider-name" htmlFor={`in-${id}`}>
                  {text.name}
                  {fresh.includes(id) && <span className="new-tag">{d.ui.newParam}</span>}
                </label>
                {hint && (
                  <span className={`hint-badge ${hint.dir}`} title={d.ui.hintLabel}>
                    {hint.dir === 'up' ? <IconUp size={18} /> : <IconDown size={18} />}
                  </span>
                )}
                <output className="slider-value" htmlFor={`in-${id}`}>
                  {values[id]}
                  <small>{def.unit}</small>
                </output>
              </div>
              <input
                id={`in-${id}`}
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={values[id]}
                onChange={(e) => onChange(id, Number(e.target.value))}
                style={{ '--pct': `${pct}%` } as React.CSSProperties}
              />
              <div className="slider-ends">
                <span>{text.down}</span>
                <span>{text.up}</span>
              </div>
            </div>
          );
        })}
      </div>

      {meters.length > 0 && (
        <div className="meters">
          {meters.map((m) => (
            <div key={m.id} className="meter">
              <span className="meter-name">{d.meters[m.id]}</span>
              <span className="meter-track">
                <span className={`meter-fill ${m.good ? 'ok' : 'ng'}`} style={{ width: `${Math.min(100, (m.value / 1.5) * 100)}%` }} />
                <span className="meter-mark" style={{ left: `${100 / 1.5}%` }} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="start-wrap">
        <span className="step-dot">2</span>
        <button className="btn-start" onClick={onStart}>
          <IconPlay size={24} />
          <span>{d.ui.start}</span>
        </button>
      </div>
    </section>
  );
}

export default memo(ParamPanel);
