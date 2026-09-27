import { useEffect, useMemo, useState } from 'react';
import { MATERIALS, MISSIONS, initialValues, phaseDurations, simulate, type Outcome, type ParamValues } from '../game';
import { useI18n } from '../i18n';
import { Logo } from './GameScreen';
import { IconArrow } from './Icons';
import LangSwitch from './LangSwitch';
import ProductArt from './ProductArt';
import Stage from './Stage';
import { useRun } from './useRun';
import { palette as P } from '../theme';

const demoMission = MISSIONS[0];
const base = initialValues(demoMission);
/** The title demo loops through a good part and each defect. */
const DEMOS: ParamValues[] = [
  { ...base, meltTemp: 225, injPressure: 90, injSpeed: 65, coolTime: 14 },
  { ...base, meltTemp: 200, injPressure: 55, injSpeed: 35, coolTime: 14 },
  { ...base, meltTemp: 245, injPressure: 140, injSpeed: 90, coolTime: 16 },
  { ...base, meltTemp: 225, injPressure: 90, injSpeed: 65, coolTime: 5 },
];

function DemoStage() {
  const { d } = useI18n();
  const [i, setI] = useState(0);
  const values = DEMOS[i];
  const result = useMemo(() => simulate(demoMission, values), [values]);
  const run = useRun();
  const { start } = run;
  useEffect(() => {
    const id = window.setTimeout(() => start(phaseDurations(values)), 500);
    return () => clearTimeout(id);
  }, [start, values]);
  useEffect(() => {
    if (run.phase !== 'done') return;
    const id = window.setTimeout(() => setI((x) => (x + 1) % DEMOS.length), 2200);
    return () => clearTimeout(id);
  }, [run.phase]);
  return (
    <>
      <span className="hero-badge">
        <i /> DEMO · {run.phase === 'done' ? d.outcomes[result.outcome].name : d.phases[run.phase === 'idle' ? 'close' : run.phase].t}
      </span>
      <Stage material={MATERIALS.PP} values={values} result={run.phase === 'idle' ? null : result} phase={run.phase} t={run.t} now={run.now} xray labels={false} />
    </>
  );
}

/** Decorative pellets, kept to the page edges so they never sit on text. */
const PELLETS = [
  { left: '1.2%', top: '12%' },
  { left: '96.5%', top: '6%' },
  { left: '0.6%', top: '58%' },
  { left: '97.5%', top: '48%' },
  { left: '2%', top: '92%' },
  { left: '96%', top: '94%' },
].map((p, i) => ({ ...p, color: [P.metalLight, P.resin, P.primaryContainer, P.metal, P.resinGlow, P.metalLight][i], delay: `${-i * 1.1}s`, scale: 0.8 + (i % 3) * 0.25 }));

function StepIcon({ k }: { k: string }) {
  if (k === '01')
    return (
      <svg className="step-icon" viewBox="0 0 72 72" aria-hidden>
        <rect x="4" y="4" width="64" height="64" rx="18" fill={P.primarySoft} stroke={P.outlineVariant} strokeWidth="2.5" />
        {[22, 36, 50].map((y, i) => (
          <g key={y}>
            <rect x="14" y={y - 3} width="44" height="6" rx="3" fill={P.surface} stroke={P.ink} strokeWidth="2" />
            <circle cy={y} r="6" fill={P.primary} stroke={P.ink} strokeWidth="2" className="knob" style={{ animationDelay: `${i * -0.7}s` }} />
          </g>
        ))}
      </svg>
    );
  if (k === '02')
    return (
      <svg className="step-icon" viewBox="0 0 72 72" aria-hidden>
        <rect x="4" y="4" width="64" height="64" rx="18" fill={P.primarySoft} stroke={P.outlineVariant} strokeWidth="2.5" />
        <path d="M18,20 H54 V52 H18 Z M28,30 H54 V42 H28 Z" fillRule="evenodd" fill={P.surface} stroke={P.primary} strokeWidth="2" strokeDasharray="4 3" />
        <path d="M18,20 H54 V52 H18 Z M28,30 H54 V42 H28 Z" fillRule="evenodd" fill={P.resin} className="fill-loop" />
        <path d="M18,20 H54 V52 H18 Z M28,30 H54 V42 H28 Z" fillRule="evenodd" fill="none" stroke={P.ink} strokeWidth="2" />
      </svg>
    );
  return (
    <svg className="step-icon" viewBox="0 0 72 72" aria-hidden>
      <rect x="4" y="4" width="64" height="64" rx="18" fill={P.primarySoft} stroke={P.outlineVariant} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="14" fill={P.surface} stroke={P.ink} strokeWidth="3" />
      <path d="M42 42l12 12" stroke={P.ink} strokeWidth="5" strokeLinecap="round" />
      <text x="32" y="39" textAnchor="middle" fontSize="20" fontWeight="900" fill={P.primary} className="q-bob">?</text>
    </svg>
  );
}

export default function TopScreen({ onStart, hasProgress }: { onStart: () => void; hasProgress: boolean }) {
  const { d } = useI18n();
  const gallery: Outcome[] = ['good', 'short', 'flash', 'sink'];
  return (
    <div className="top">
      <div className="pellet-field" aria-hidden>
        {PELLETS.map((p, i) => (
          <span key={i} className="pellet" style={{ left: p.left, top: p.top, background: p.color, animationDelay: p.delay, scale: String(p.scale) }} />
        ))}
      </div>

      <header className="topbar clear">
        <div className="brand static">
          <Logo />
          <span className="brand-name">{d.app.name}</span>
          <span className="brand-sub">{d.app.sub}</span>
        </div>
        <LangSwitch />
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{d.top.eyebrow}</span>
          <h1>
            {d.top.title1}
            <br />
            <span className="accent">
              {d.top.title2}
              <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden>
                <path className="drip" d="M4,10 C60,4 120,16 180,8 C220,4 260,12 296,8" fill="none" stroke={P.resin} strokeWidth="7" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="lead">{d.top.lead}</p>
          <div className="hero-cta">
            <button className="btn-start big" onClick={onStart}>
              {hasProgress ? d.top.continue : d.top.start}
              <IconArrow size={22} />
            </button>
            <span className="note">{d.top.note}</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-stage">
            <DemoStage />
          </div>
          <div className="hero-gallery">
            {gallery.map((o) => (
              <figure key={o} className={`hg ${o}`}>
                <ProductArt outcome={o} color={MATERIALS.PP.color} size={84} ghost={false} fillRatio={0.62} />
                <figcaption>{d.outcomes[o].name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="steps">
        {d.top.steps.map((s) => (
          <article key={s.k} className="step">
            <StepIcon k={s.k} />
            <div>
              <span className="step-k">{s.k}</span>
              <h2>{s.t}</h2>
              <p>{s.d}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
