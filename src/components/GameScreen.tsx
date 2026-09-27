import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MATERIALS,
  MISSIONS,
  NO_STREAK,
  PHASES,
  getMission,
  initialValues,
  isUnlocked,
  nextStreak,
  phaseDurations,
  resultLines,
  retryLines,
  saveProgress,
  simulate,
  welcomeLines,
  type Line,
  type ParamId,
  type ParamValues,
  type Progress,
  type SimResult,
} from '../game';
import { useI18n } from '../i18n';
import { IconArrow, IconCheck, IconEye, IconHome, IconMenu, IconSkip } from './Icons';
import LangSwitch from './LangSwitch';
import Mascot, { type Talk } from './Mascot';
import MissionDrawer from './MissionPanel';
import ParamPanel from './ParamPanel';
import { CauseSide, ResultSide } from './ResultPanel';
import Stage from './Stage';
import { useRun } from './useRun';
import { palette as P } from '../theme';

interface Props {
  progress: Progress;
  setProgress: (p: Progress) => void;
  onHome: () => void;
}

/** setup → (running) → result → cause → setup … */
type View = 'setup' | 'result' | 'cause';

export default function GameScreen({ progress, setProgress, onHome }: Props) {
  const { d } = useI18n();
  const [missionId, setMissionId] = useState(() => {
    const open = Object.keys(progress.missions);
    return open[open.length - 1];
  });
  const mission = getMission(missionId);
  const material = MATERIALS[mission.materialId];
  const [values, setValues] = useState<ParamValues>(() => initialValues(mission));
  const [runValues, setRunValues] = useState<ParamValues>(values);
  const [result, setResult] = useState<SimResult | null>(null);
  const [view, setView] = useState<View>('setup');
  const [xray, setXray] = useState(false);
  const [coach, setCoach] = useState(true);
  const [xrayTouched, setXrayTouched] = useState(false);
  const [touched, setTouched] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [highlight, setHighlight] = useState<ParamId | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastHints, setLastHints] = useState<SimResult['hints']>([]);
  const [talk, setTalk] = useState<Talk | null>(() =>
    (progress.missions[missionId] ?? 0) === 0 ? { id: 0, lines: welcomeLines() } : null,
  );
  const talkId = useRef(0);
  const greeted = useRef(new Set([missionId]));
  const streak = useRef(NO_STREAK);
  const say = useCallback((lines: Line[]) => setTalk({ id: ++talkId.current, lines }), []);
  const resultRef = useRef<SimResult | null>(null);
  const replayRef = useRef(false);
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const onDone = useCallback(() => {
    if (replayRef.current) return;
    const r = resultRef.current;
    if (!r) return;
    const p = progressRef.current;
    const stars = [r.stars.good, r.stars.cycle, r.stars.stable].filter(Boolean).length;
    const missions = { ...p.missions, [mission.id]: Math.max(p.missions[mission.id] ?? 0, stars) };
    let unlocked = false;
    if (r.stars.good && mission.unlocks && !(mission.unlocks in missions)) {
      missions[mission.unlocks] = 0;
      unlocked = true;
    }
    const seen = p.seen.includes(r.outcome) ? p.seen : [...p.seen, r.outcome];
    const next = { ...p, missions, seen };
    setProgress(next);
    saveProgress(next);
    setLastHints(r.hints);
    setView('result');
    streak.current = nextStreak(streak.current, r.outcome);
    say(resultLines(r, streak.current));
    if (unlocked) setToast(d.ui.unlockedToast);
  }, [mission, setProgress, d, say]);

  const run = useRun(onDone);
  const running = run.running && view === 'setup';
  const mode = running ? 'running' : view;

  const start = useCallback(() => {
    const r = simulate(mission, values);
    resultRef.current = r;
    replayRef.current = false;
    setResult(r);
    setRunValues(values);
    setCoach(false);
    if (!xrayTouched) setXray(true);
    setLastHints([]);
    setDrawer(false);
    setTalk(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    run.start(phaseDurations(values));
  }, [mission, values, run, xrayTouched]);

  const showCause = () => {
    setView('cause');
    setTalk(null); // the replay zooms into the mold; the cat steps aside
    replayRef.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    run.start(phaseDurations(runValues));
  };

  const replay = () => {
    replayRef.current = true;
    run.start(phaseDurations(runValues));
  };

  const retry = () => {
    run.reset();
    setView('setup');
    say(retryLines());
  };

  const selectMission = (id: string) => {
    const m = getMission(id);
    setMissionId(id);
    setValues(initialValues(m));
    setResult(null);
    setLastHints([]);
    setView('setup');
    setDrawer(false);
    run.reset();
    streak.current = NO_STREAK;
    if ((progress.missions[id] ?? 0) === 0 && !greeted.current.has(id)) {
      greeted.current.add(id);
      say(welcomeLines());
    } else setTalk(null);
  };

  const toggleMascot = () => {
    const next = { ...progress, mascot: !progress.mascot };
    setProgress(next);
    saveProgress(next);
  };

  const onChange = useCallback((id: ParamId, v: number) => {
    setTouched(true);
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const onHint = (p: ParamId) => {
    retry();
    setHighlight(p);
    window.setTimeout(() => document.getElementById(`param-${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    window.setTimeout(() => setHighlight(null), 1800);
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(id);
  }, [toast]);

  const phaseIndex = run.phase === 'idle' ? -1 : run.phase === 'done' ? PHASES.length : PHASES.indexOf(run.phase);
  const inCycle = phaseIndex >= 0 && phaseIndex < PHASES.length;
  const shownResult = run.phase === 'idle' ? null : result;
  const stageValues = run.phase === 'idle' ? values : runValues;
  const nextId = mission.unlocks;
  const canNext = !!nextId && isUnlocked(progress, nextId);
  const index = MISSIONS.indexOf(mission);
  const prev = MISSIONS[index - 1];
  const fresh = (progress.missions[mission.id] ?? 0) === 0 && prev ? mission.params.filter((p) => !prev.params.includes(p)) : [];
  const missionText = d.missions[mission.id as keyof typeof d.missions];

  return (
    <div className={`game mode-${mode}`}>
      <header className="topbar">
        <button className="icon-btn nav-btn" onClick={() => setDrawer(true)} disabled={running} aria-expanded={drawer} aria-label={d.ui.missionTab} title={d.ui.missionTab}>
          <IconMenu />
        </button>
        <button className="brand" onClick={onHome} aria-label={d.ui.home}>
          <Logo />
          <span className="brand-name">{d.app.name}</span>
        </button>
        <div className="topbar-right">
          <LangSwitch />
          <button className="icon-btn" onClick={onHome} aria-label={d.ui.home} title={d.ui.home}>
            <IconHome />
          </button>
        </div>
      </header>

      <main className="play">
        <div className="stage-col">
          <section className={`stage${progress.mascot ? ' has-mascot' : ''}`}>
            <div className="stage-hud">
              {mode === 'setup' && (
                <button className="hud-chip mission-chip" onClick={() => setDrawer(true)}>
                  <span className="hud-num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="hud-text">{missionText.title}</span>
                </button>
              )}
              {mode !== 'setup' && inCycle && (
                <div className="hud-chip" aria-live="polite">
                  <span className="hud-num">{String(phaseIndex + 1).padStart(2, '0')}</span>
                  <strong>{d.phases[PHASES[phaseIndex]].t}</strong>
                  <span className="hud-text sub">{d.phases[PHASES[phaseIndex]].d}</span>
                </div>
              )}
              {mode !== 'setup' && !inCycle && result && (
                <div className={`hud-chip ${result.outcome === 'good' ? 'good' : 'bad'}`}>
                  <strong>{d.outcomes[result.outcome].name}</strong>
                </div>
              )}
              <button
                className={`xray-btn${xray || mode === 'cause' ? ' on' : ''}${coach && !xray && mode === 'setup' ? ' coach' : ''}`}
                onClick={() => {
                  setXray((x) => !x);
                  setXrayTouched(true);
                  setCoach(false);
                }}
                disabled={mode === 'cause'}
                aria-pressed={xray || mode === 'cause'}
              >
                {xray || mode === 'cause' ? <IconCheck size={18} /> : <IconEye size={18} />}
                <span>{d.ui.xray}</span>
              </button>
            </div>

            <div className="stage-canvas">
              <Stage
                material={material}
                values={stageValues}
                result={shownResult}
                phase={run.phase}
                t={run.t}
                now={run.now}
                xray={xray || mode === 'cause'}
              />
            </div>

            {progress.mascot && (
              <Mascot talk={talk} hidden={mode === 'running' || mode === 'cause'} canWhy={mode === 'result'} onWhy={showCause} onDone={() => setTalk(null)} />
            )}

            <div className="stage-foot">
              {mode === 'setup' ? (
                <ol className="todo">
                  <li className={touched ? 'done' : 'now'}>
                    <span className="step-dot">1</span>
                    <span>{d.ui.todo1}</span>
                  </li>
                  <li className="todo-arrow" aria-hidden>
                    <IconArrow size={18} />
                  </li>
                  <li className={touched ? 'now' : ''}>
                    <span className="step-dot">2</span>
                    <span>{d.ui.todo2}</span>
                  </li>
                </ol>
              ) : (
                <>
                  <ol className="timeline">
                    {PHASES.map((p, i) => (
                      <li key={p} className={i < phaseIndex ? 'past' : i === phaseIndex ? 'now' : ''}>
                        <span className="tl-bar">
                          <i style={{ width: i < phaseIndex ? '100%' : i === phaseIndex ? `${run.t * 100}%` : '0%' }} />
                        </span>
                        <span className="tl-name">{d.phases[p].t}</span>
                      </li>
                    ))}
                  </ol>
                  {run.running && (
                    <button className="skip-btn" onClick={run.skip}>
                      <IconSkip size={18} />
                      <span>{d.ui.skip}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        <div className="side" aria-hidden={mode === 'running'} inert={mode === 'running'}>
          <div className="side-inner" key={mode === 'running' ? 'setup' : mode}>
            {(mode === 'setup' || mode === 'running') && (
              <ParamPanel
                mission={mission}
                material={material}
                values={values}
                onChange={onChange}
                hints={lastHints}
                highlight={highlight}
                seen={progress.seen}
                fresh={fresh}
                onStart={start}
              />
            )}
            {mode === 'result' && result && (
              <ResultSide
                result={result}
                material={material}
                mission={mission}
                canNext={canNext}
                onWhy={showCause}
                onRetry={retry}
                onNext={() => nextId && selectMission(nextId)}
              />
            )}
            {mode === 'cause' && result && <CauseSide result={result} material={material} onRetry={retry} onReplay={replay} onHint={onHint} />}
          </div>
        </div>
      </main>

      <MissionDrawer open={drawer} onClose={() => setDrawer(false)} mission={mission} progress={progress} onSelect={selectMission} disabled={running} mascot={progress.mascot} onToggleMascot={toggleMascot} />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-new">{d.ui.newUnlock}</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="5" width="12" height="22" rx="4" fill={P.primaryContainer} stroke={P.primary} strokeWidth="2.5" />
      <rect x="18" y="5" width="12" height="22" rx="4" fill={P.primaryContainer} stroke={P.primary} strokeWidth="2.5" />
      <path d="M8 16h7v-5h4v10h-4v-5" fill={P.resin} stroke={P.primary} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
