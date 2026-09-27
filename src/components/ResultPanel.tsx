import type { Material, Mission, ParamId, SimResult } from '../game';
import { fmt, useI18n } from '../i18n';
import CauseDiagram from './CauseDiagram';
import { IconArrow, IconClock, IconDown, IconEye, IconRetry, IconStar, IconUp, PARAM_ICONS } from './Icons';
import ProductArt from './ProductArt';
import { palette as P } from '../theme';

const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
  const dist = 80 + (i % 4) * 24;
  return {
    dx: Math.cos(a) * dist,
    dy: Math.sin(a) * dist - 30,
    r: (i % 2 ? 1 : -1) * (180 + i * 20),
    color: [P.primary, P.primaryTint, P.resin, P.success, P.primaryContainer][i % 5],
  };
});

interface ResultProps {
  result: SimResult;
  material: Material;
  mission: Mission;
  canNext: boolean;
  onWhy: () => void;
  onRetry: () => void;
  onNext: () => void;
}

/** Result state: the finished part, big, plus one clear next step. */
export function ResultSide({ result, material, mission, canNext, onWhy, onRetry, onNext }: ResultProps) {
  const { d } = useI18n();
  const o = d.outcomes[result.outcome];
  const good = result.outcome === 'good';
  const starKeys = ['good', 'cycle', 'stable'] as const;
  const allStars = starKeys.every((k) => result.stars[k]);

  return (
    <section className={`side-card result ${result.outcome}`} aria-live="polite">
      <div className="result-hero">
        <ProductArt outcome={result.outcome} color={material.color} fillRatio={result.fillRatio} size={190} />
        {good && (
          <div className="confetti" aria-hidden>
            {CONFETTI.map((c, i) => (
              <i key={i} style={{ background: c.color, '--dx': `${c.dx}px`, '--dy': `${c.dy}px`, '--r': `${c.r}deg` } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>

      <span className={`verdict-tag ${result.outcome}`}>{o.en}</span>
      <h2 className="verdict-name">{o.name}</h2>
      <p className="verdict-headline">{o.headline}</p>

      <ul className="star-list" aria-label={d.ui.starsTitle}>
        {starKeys.map((k) => (
          <li key={k} className={result.stars[k] ? 'on' : ''}>
            <IconStar size={20} filled={result.stars[k]} />
            <span>{k === 'cycle' ? fmt(d.stars.cycle, { n: mission.targetCycle }) : d.stars[k]}</span>
          </li>
        ))}
      </ul>
      <p className="cycle">
        <IconClock size={18} />
        <span>{d.ui.cycle}</span>
        <strong>
          {result.cycleTime.toFixed(1)}
          {d.ui.seconds}
        </strong>
      </p>

      <div className="side-actions">
        {good && canNext && (
          <button className="btn-main" onClick={onNext}>
            <span>{d.ui.next}</span>
            <IconArrow size={20} />
          </button>
        )}
        {!good && (
          <button className="btn-main" onClick={onWhy}>
            <IconEye size={20} />
            <span>{d.ui.why}</span>
          </button>
        )}
        {good && !canNext && !allStars && (
          <button className="btn-main" onClick={onRetry}>
            <IconStar size={20} />
            <span>{d.ui.moreStars}</span>
          </button>
        )}
        <div className="side-sub">
          {good && (
            <button className="btn-text" onClick={onWhy}>
              {d.ui.whyGood}
            </button>
          )}
          {(!good || canNext || allStars) && (
            <button className="btn-text" onClick={onRetry}>
              <IconRetry size={18} /> {d.ui.retryShort}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface CauseProps {
  result: SimResult;
  material: Material;
  onRetry: () => void;
  onReplay: () => void;
  onHint: (p: ParamId) => void;
}

/** Cause state: diagram + one-line reason + which slider to move, then retry. */
export function CauseSide({ result, material, onRetry, onReplay, onHint }: CauseProps) {
  const { d } = useI18n();
  const o = d.outcomes[result.outcome];
  return (
    <section className={`side-card cause ${result.outcome}`}>
      <span className="kicker">{d.ui.cause}</span>
      <h2 className="cause-title">{o.headline}</h2>
      <div className="cause-diagram">
        <CauseDiagram result={result} material={material} />
      </div>
      <p className="cause-text">
        {o.cause}
        {result.outcome === 'sink' && <> {d.sinkCause[result.sinkCause]}</>}
      </p>

      {result.hints.length > 0 && (
        <div className="hints">
          <span className="hints-label">{d.ui.hintLabel}</span>
          {result.hints.map((h) => {
            const Icon = PARAM_ICONS[h.param];
            return (
              <button key={h.param} className={`hint-chip ${h.dir}`} onClick={() => onHint(h.param)}>
                <Icon size={18} />
                <span>{d.params[h.param].name}</span>
                {h.dir === 'up' ? <IconUp size={18} /> : <IconDown size={18} />}
              </button>
            );
          })}
        </div>
      )}

      <div className="side-actions">
        <button className="btn-main" onClick={onRetry}>
          <IconRetry size={20} />
          <span>{d.ui.retryShort}</span>
        </button>
        <div className="side-sub">
          <button className="btn-text" onClick={onReplay}>
            <IconEye size={18} /> {d.ui.replay}
          </button>
        </div>
      </div>
    </section>
  );
}
