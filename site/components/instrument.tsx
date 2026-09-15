'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import Stage, { DURATION, FPS, FRAME_COUNT, frameAt, timecode } from './stage';

/*
 * The viewer. It holds a timestamp and nothing else: the picture is Stage(t),
 * the readout is t, the scrubber is t. Playing means advancing t on a frame
 * grid — the viewer never shows a moment that is not a real frame, which is
 * the same promise the renderer makes.
 */
/** The frame the viewer opens on — mid-render, where the film says the most. */
const POSTER = Math.round(5.2 * FPS);

/*
 * Read the reduced-motion preference as an external store rather than setting
 * state from an effect: the server has no media query, so the first paint
 * matches the server snapshot and the preference is applied on hydration
 * without a second render pass.
 */
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
}

export default function Instrument() {
  const [frame, setFrame] = useState(POSTER);
  const [wantsPlayback, setWantsPlayback] = useState(true);
  const reducedMotion = useReducedMotion();
  const playing = wantsPlayback && !reducedMotion;
  const raf = useRef<number | null>(null);
  const started = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    started.current = performance.now() - (frame / FPS) * 1000;
    const tick = (now: number) => {
      const elapsed = ((now - started.current) / 1000) % DURATION;
      setFrame(Math.floor(elapsed * FPS));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // `frame` is the resume point, read once when playback starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const scrub = useCallback((value: number | number[]) => {
    setWantsPlayback(false);
    setFrame(Math.round(Array.isArray(value) ? value[0] : value));
  }, []);

  const t = frame / FPS;

  return (
    <figure className="m-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-stage shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/25">
        <Stage t={t} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Toggle
          pressed={playing}
          onPressedChange={setWantsPlayback}
          aria-label={playing ? 'Pause the film' : 'Play the film'}
          className="grid size-11 shrink-0 place-items-center rounded-sm border border-white/70 bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {playing ? (
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" />
              <rect x="9" y="2" width="4" height="12" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true" fill="currentColor">
              <path d="M4 2l10 6-10 6z" />
            </svg>
          )}
        </Toggle>

        <Slider.Root
          value={frame}
          onValueChange={scrub}
          min={0}
          max={FRAME_COUNT - 1}
          step={1}
          largeStep={FPS}
          className="w-full"
        >
          <Slider.Control className="flex w-full touch-none py-3 select-none">
            <Slider.Track className="h-1.5 w-full rounded-full bg-white/40 select-none">
              <Slider.Indicator className="rounded-full bg-white select-none" />
              <Slider.Thumb
                aria-label="Timestamp"
                className="h-7 w-1.5 rounded-full bg-white select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-white"
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>

      <figcaption className="data mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-white">
        <span>
          t = {t.toFixed(3)}s · frame {String(frameAt(t)).padStart(3, '0')} / {FRAME_COUNT}
        </span>
        <span className="text-white/90">{timecode(t)} · {FPS}fps · 1080×1080</span>
      </figcaption>
    </figure>
  );
}
