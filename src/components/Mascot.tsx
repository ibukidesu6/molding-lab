import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { READY_CLIPS, resolveClip, type Clip, type Line } from '../game';
import { fmt, useI18n } from '../i18n';
import type { Dict } from '../i18n/locales/ja';

export interface Talk {
  /** Changes on every new utterance so the bubble restarts. */
  id: number;
  lines: Line[];
}

interface Props {
  talk: Talk | null;
  /** Slid out of view (e.g. while molding). */
  hidden: boolean;
  /** The "see why" button is only offered on the result screen. */
  canWhy: boolean;
  onWhy: () => void;
  onDone: () => void;
}

const SRC = (clip: Clip, ext: 'webm' | 'mp4') => `${import.meta.env.BASE_URL}mascot/${clip}.${ext}`;
const TYPE_MS = 55;
const LINGER_MS = 1500;
const LINGER_REDUCED_MS = 3500;
const START_TIMEOUT_MS = 2500;

const motionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const subscribeMotion = (cb: () => void) => {
  motionQuery?.addEventListener('change', cb);
  return () => motionQuery?.removeEventListener('change', cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribeMotion, () => !!motionQuery?.matches, () => false);

function lineText(d: Dict, line: Line): string {
  const c = d.coach;
  switch (line.id) {
    case 'defect':
      return fmt(c.defect, { defect: line.defect ? d.outcomes[line.defect].name : '' });
    case 'hint':
      return line.hint ? fmt(c.hint, { param: d.params[line.hint.param].name, dir: c[line.hint.dir] }) : c.noHint;
    default:
      return c[line.id];
  }
}

/** Teacher cat in the stage corner: plays a motion clip and speaks through a bubble. */
export default function Mascot({ talk, hidden, canWhy, onWhy, onDone }: Props) {
  const reduced = useReducedMotion();
  const vids = useRef<Partial<Record<Clip, HTMLVideoElement | null>>>({});
  const [active, setActive] = useState<Clip | null>(null);

  /**
   * Plays a clip once; resolves when it ends. The still image stays up until the video
   * really starts, and if it never does (not loaded, reduced motion, blocked) the line
   * goes on without it.
   */
  const play = useCallback(
    (want: Clip) =>
      new Promise<void>((resolve) => {
        const clip = resolveClip(want);
        const v = vids.current[clip];
        if (!v || reduced) return resolve();
        for (const other of Object.values(vids.current)) if (other && other !== v) other.pause();
        let started = false;
        const onPlaying = () => {
          started = true;
          setActive(clip);
        };
        const end = () => {
          clearTimeout(guard);
          v.removeEventListener('playing', onPlaying);
          v.removeEventListener('ended', end);
          setActive((a) => (a === clip ? null : a));
          resolve();
        };
        const guard = window.setTimeout(() => {
          if (started) return;
          v.pause();
          end();
        }, START_TIMEOUT_MS);
        v.addEventListener('playing', onPlaying);
        v.addEventListener('ended', end);
        v.muted = true;
        v.currentTime = 0;
        v.play().catch(end);
      }),
    [reduced],
  );

  const pauseAll = useCallback(() => {
    for (const v of Object.values(vids.current)) v?.pause();
  }, []);

  useEffect(() => {
    if (hidden) pauseAll();
  }, [hidden, pauseAll]);

  const speaking = !!talk && !hidden;

  return (
    <div className={`mascot${hidden ? ' is-hidden' : ''}${active && !hidden ? ' is-playing' : ''}${reduced ? ' is-still' : ''}`}>
      {speaking && (
        <Speech
          key={talk.id}
          lines={talk.lines}
          play={play}
          reduced={reduced}
          canWhy={canWhy}
          onWhy={onWhy}
          onClose={() => {
            pauseAll();
            setActive(null);
            onDone();
          }}
        />
      )}
      <div className="mascot-body" aria-hidden>
        <img className="mascot-idle" src={`${import.meta.env.BASE_URL}mascot/idle.png`} alt="" draggable={false} />
        {!reduced &&
          READY_CLIPS.map((c) => (
            <video
              key={c}
              ref={(el) => {
                vids.current[c] = el;
              }}
              className={active === c ? 'on' : ''}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
            >
              {/* Safari: HEVC with alpha (in .mp4). It is labelled QuickTime on purpose: Chrome can play plain HEVC
                  but drops the alpha, and it does not claim QuickTime, so it skips this and uses VP9 alpha. */}
              <source src={SRC(c, 'mp4')} type='video/quicktime; codecs="hvc1"' />
              <source src={SRC(c, 'webm')} type="video/webm" />
            </video>
          ))}
      </div>
    </div>
  );
}

interface SpeechProps {
  lines: Line[];
  play: (c: Clip) => Promise<void>;
  reduced: boolean;
  canWhy: boolean;
  onWhy: () => void;
  onClose: () => void;
}

function Speech({ lines, onClose, ...rest }: SpeechProps) {
  const [idx, setIdx] = useState(0);
  const next = () => (idx + 1 < lines.length ? setIdx(idx + 1) : onClose());
  return <Bubble key={idx} line={lines[idx]} last={idx === lines.length - 1} onNext={next} {...rest} />;
}

interface BubbleProps extends Omit<SpeechProps, 'lines' | 'onClose'> {
  line: Line;
  last: boolean;
  onNext: () => void;
}

function Bubble({ line, last, play, reduced, canWhy, onWhy, onNext }: BubbleProps) {
  const { d } = useI18n();
  const text = lineText(d, line);
  const chars = Array.from(text);
  const [typed, setTyped] = useState(0);
  const [spoken, setSpoken] = useState(false);
  const full = reduced || typed >= chars.length;
  const nextRef = useRef(onNext);
  useEffect(() => {
    nextRef.current = onNext;
  });

  // Motion clip for this line.
  useEffect(() => {
    let live = true;
    play(line.clip).then(() => live && setSpoken(true));
    return () => {
      live = false;
    };
  }, [line.clip, play]);

  // Letters appear one by one while the cat talks.
  useEffect(() => {
    if (full) return;
    const id = window.setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearInterval(id);
  }, [full]);

  // Stay a moment after the clip ends, then move on.
  useEffect(() => {
    if (!spoken || !full) return;
    const id = window.setTimeout(() => nextRef.current(), reduced ? LINGER_REDUCED_MS : LINGER_MS);
    return () => clearTimeout(id);
  }, [spoken, full, reduced]);

  const showWhy = line.action === 'why' && canWhy;

  return (
    <div className={`mascot-bubble tone-${line.tone}`}>
      <button className="mascot-say" onClick={() => (full ? onNext() : setTyped(chars.length))} aria-label={`${d.coach.name}: ${text}`}>
        <span className="mascot-text" aria-hidden>
          {full ? text : chars.slice(0, typed).join('')}
          {/* Invisible remainder keeps the bubble size stable while typing. */}
          {!full && <span className="mascot-ghost">{chars.slice(typed).join('')}</span>}
        </span>
        {!last && full && <span className="mascot-more" aria-hidden />}
      </button>
      {showWhy && full && (
        <button className="mascot-why" onClick={onWhy}>
          {d.ui.why}
        </button>
      )}
      <span className="visually-hidden" role="status">
        {text}
      </span>
    </div>
  );
}
