import { memo, useEffect, useState } from 'react';
import { MATERIALS, MATERIAL_ORDER, MISSIONS, isUnlocked, unlockedMaterials, type Mission, type Outcome, type Progress } from '../game';
import { fmt, useI18n } from '../i18n';
import { IconCheck, IconClose, IconExpand, IconLock, IconStar } from './Icons';
import ProductArt from './ProductArt';

interface Props {
  open: boolean;
  onClose: () => void;
  mission: Mission;
  progress: Progress;
  onSelect: (id: string) => void;
  disabled: boolean;
  mascot: boolean;
  onToggleMascot: () => void;
}

const NOTEBOOK: Outcome[] = ['good', 'short', 'flash', 'sink'];

/** Slide-in drawer: mission, material, goals. Notebook + materials live behind "More details". */
function MissionDrawer({ open, onClose, mission, progress, onSelect, disabled, mascot, onToggleMascot }: Props) {
  const { d } = useI18n();
  const [details, setDetails] = useState(false);
  const mat = MATERIALS[mission.materialId];
  const text = d.missions[mission.id as keyof typeof d.missions];
  const best = progress.missions[mission.id] ?? 0;
  const mats = unlockedMaterials(progress);
  const index = MISSIONS.indexOf(mission);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-backdrop${open ? ' open' : ''}`} onClick={onClose} aria-hidden />
      <aside className={`drawer${open ? ' open' : ''}`} aria-label={d.ui.mission} aria-hidden={!open} inert={!open}>
        <header className="drawer-head">
          <span className="kicker">
            {d.ui.mission} {String(index + 1).padStart(2, '0')}
          </span>
          <button className="icon-btn" onClick={onClose} aria-label={d.ui.close}>
            <IconClose />
          </button>
        </header>

        <nav className="mission-tabs" aria-label={d.ui.missionSelect}>
          {MISSIONS.map((m, i) => {
            const unlocked = isUnlocked(progress, m.id);
            return (
              <button
                key={m.id}
                className={`mtab${m.id === mission.id ? ' active' : ''}`}
                disabled={!unlocked || disabled}
                onClick={() => onSelect(m.id)}
                aria-current={m.id === mission.id}
              >
                <span className="mtab-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="mtab-label">{unlocked ? d.missions[m.id as keyof typeof d.missions].title : d.ui.lockedShort}</span>
                {!unlocked && <IconLock size={20} />}
              </button>
            );
          })}
        </nav>

        <p className="mission-brief">{text.brief}</p>

        <div className="mission-product">
          <ProductArt outcome="good" color={mat.color} size={84} />
          <dl>
            <dt>{d.ui.material}</dt>
            <dd>
              <span className="mat-chip">{mat.id}</span>
              <span className="mat-name">{d.materials[mat.id].name}</span>
            </dd>
            <dd className="mat-tag">{d.materials[mat.id].tag}</dd>
          </dl>
        </div>

        <div className="goals">
          <span className="goals-label">{d.ui.goal}</span>
          {(['good', 'cycle', 'stable'] as const).map((k, i) => (
            <div key={k} className={`goal${best > i ? ' done' : ''}`}>
              <IconStar size={20} filled={best > i} />
              <span>{k === 'cycle' ? fmt(d.stars.cycle, { n: mission.targetCycle }) : d.stars[k]}</span>
            </div>
          ))}
        </div>

        <label className="switch-row">
          <span>{d.coach.show}</span>
          <input type="checkbox" role="switch" checked={mascot} onChange={onToggleMascot} />
          <span className="switch" aria-hidden>
            <span className="switch-handle">{mascot && <IconCheck size={16} />}</span>
          </span>
        </label>

        <button className="details-toggle" onClick={() => setDetails((x) => !x)} aria-expanded={details}>
          <span>{details ? d.ui.hideDetails : d.ui.details}</span>
          <span className="count">
            {d.ui.notebook} {progress.seen.length}/{NOTEBOOK.length}
          </span>
          <IconExpand className={`chev${details ? ' up' : ''}`} />
        </button>

        {details && (
          <div className="details">
            <section>
              <h3>{d.ui.notebook}</h3>
              <div className="notebook">
                {NOTEBOOK.map((o) => {
                  const found = progress.seen.includes(o);
                  return (
                    <div key={o} className={`nb-card ${o}${found ? '' : ' unfound'}`}>
                      <ProductArt outcome={o} color={mat.color} size={56} ghost={false} fillRatio={0.62} />
                      <span>{found ? d.outcomes[o].name : d.ui.unknown}</span>
                      {found && <small>{d.outcomes[o].headline}</small>}
                    </div>
                  );
                })}
              </div>
            </section>
            <section>
              <h3>{d.ui.materials}</h3>
              <div className="mat-cards">
                {MATERIAL_ORDER.map((id) => {
                  const m = MATERIALS[id];
                  const unlocked = mats.has(id);
                  const t = d.materials[id];
                  return (
                    <div key={id} className={`mat-card${unlocked ? '' : ' locked'}${id === mat.id ? ' current' : ''}`}>
                      <div className="mat-swatch" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.hotColor})` }}>
                        {id}
                      </div>
                      <div className="mat-body">
                        <strong>{unlocked ? `${t.name} · ${t.tag}` : d.ui.locked}</strong>
                        {unlocked && <p>{t.desc}</p>}
                      </div>
                      {!unlocked && <IconLock size={20} />}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </aside>
    </>
  );
}

export default memo(MissionDrawer);
