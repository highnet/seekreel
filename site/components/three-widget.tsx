'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import type * as THREE from 'three';

/*
 * The 3D stage, running here.
 *
 * Same claim as the flat viewer above it, made where people expect it to fail:
 * this is a three.js scene whose every transform is computed from `t`, so
 * dragging the scrubber lands on exactly the frame `seekreel render` would write
 * to disk. Nothing here accumulates — there is no `rotation.y += 0.01` — which
 * is why a seek and a play produce the same picture.
 *
 * The controls are the config. Change the frame rate and the frame count under
 * the scrubber changes with it, because that is all `fps` means: how many
 * moments the film is sampled at.
 */

type Scene3D = {
  draw: (t: number, options: { wireframe: boolean }) => void;
  resize: (size: number) => void;
  dispose: () => void;
};

/*
 * Whether the visitor asked for less motion. Read as external state rather than
 * copied into a state variable by an effect: the server has no media queries,
 * and the answer can change while the page is open.
 */
const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const DURATIONS = [4, 8, 16] as const;
const RATES = [12, 24, 30] as const;

export default function ThreeWidget() {
  const holder = useRef<HTMLDivElement | null>(null);
  /* React owns the canvas element; the effect only borrows it. Creating it here
     and appending it by hand would leave React removing a node it no longer
     has, which it says so about, loudly. */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scene = useRef<Scene3D | null>(null);

  const [duration, setDuration] = useState<number>(8);
  const [fps, setFps] = useState<number>(24);
  const [wireframe, setWireframe] = useState(true);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
  const [t, setT] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const frames = Math.round(duration * fps);
  const frame = Math.min(frames - 1, Math.round(t * fps));

  /* Build the scene once, in the browser, with three loaded on demand so it is
     not in the bundle everyone downloads. */
  useEffect(() => {
    let live = true;
    let built: Scene3D | null = null;

    (async () => {
      try {
        const THREE = await import('three');
        const canvas = canvasRef.current;
        if (!live || !canvas || !holder.current) return;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x1a0f16, 1);

        const world = new THREE.Scene();
        world.fog = new THREE.Fog(0x1a0f16, 13, 26);
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

        world.add(new THREE.AmbientLight(0xffffff, 0.4));
        const key = new THREE.DirectionalLight(0xffffff, 2.3);
        key.position.set(4, 6, 3);
        world.add(key);
        const rim = new THREE.DirectionalLight(0xd946a6, 2.2);
        rim.position.set(-5, 2, -4);
        world.add(rim);

        const COUNT = 18;
        const bars: THREE.Mesh[] = [];
        const group = new THREE.Group();
        for (let i = 0; i < COUNT; i++) {
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 1, 0.42),
            new THREE.MeshStandardMaterial({
              color: i % 3 === 0 ? 0xd946a6 : 0xf7f2f5,
              roughness: 0.35,
              metalness: 0.1,
            }),
          );
          const around = (i / COUNT) * Math.PI * 2;
          bar.position.set(Math.sin(around) * 3.1, 0, Math.cos(around) * 3.1);
          bar.rotation.y = -around;
          bars.push(bar);
          group.add(bar);
        }
        world.add(group);

        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(6.4, 64),
          new THREE.MeshStandardMaterial({ color: 0x241620, roughness: 0.9 }),
        );
        floor.rotation.x = -Math.PI / 2;
        world.add(floor);

        const shell = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.5, 2),
          new THREE.MeshBasicMaterial({ color: 0xd946a6, wireframe: true, transparent: true, opacity: 0.55 }),
        );
        shell.position.y = 1.5;
        world.add(shell);

        built = {
          draw(now, options) {
            /* Every value below is arithmetic on `now`. This function is the
               whole stage: given a timestamp it produces one frame, and given
               the same timestamp twice it produces the same frame. */
            const turn = now / duration;
            const angle = turn * Math.PI * 2;
            camera.position.set(
              Math.sin(angle) * 11.5,
              4.4 + Math.sin(turn * Math.PI * 4) * 1.1,
              Math.cos(angle) * 11.5,
            );
            camera.lookAt(0, 1.1, 0);

            bars.forEach((bar, i) => {
              const phase = i / COUNT;
              const from = 0.15 + phase * 0.5;
              const rise = Math.min(1, Math.max(0, (now - from) / (duration * 0.18)));
              const eased = 1 - Math.pow(1 - rise, 4);
              const height = 0.4 + eased * (1.2 + Math.sin(phase * Math.PI * 3) * 0.9);
              bar.scale.y = height;
              bar.position.y = height / 2;
            });

            const pulse = 1 + Math.sin(now * Math.PI * 0.75) * 0.08;
            shell.scale.setScalar(pulse);
            shell.rotation.set(now * 0.3, now * 0.42, 0);
            shell.visible = options.wireframe;

            renderer.render(world, camera);
          },
          resize(size) {
            renderer.setSize(size, size, false);
            camera.aspect = 1;
            camera.updateProjectionMatrix();
          },
          dispose() {
            renderer.dispose();
            world.traverse((object) => {
              const mesh = object as THREE.Mesh;
              mesh.geometry?.dispose?.();
              const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
              if (Array.isArray(material)) material.forEach((m) => m.dispose());
              else material?.dispose?.();
            });
          },
        };

        scene.current = built;
        built.resize(holder.current.clientWidth || 520);
        setReady(true);
      } catch {
        /* No WebGL, or the chunk failed: the panel says so rather than sitting
           blank, and everything else on the page still works. */
        setFailed(true);
      }
    })();

    return () => {
      live = false;
      built?.dispose();
      scene.current = null;
    };
  }, [duration]);

  /* Keep the canvas square and crisp when the column changes width. */
  useEffect(() => {
    if (!holder.current) return;
    const element = holder.current;
    const observer = new ResizeObserver(() => scene.current?.resize(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  /* Draw whenever anything that decides the picture changes. */
  useEffect(() => {
    scene.current?.draw(t, { wireframe });
  }, [t, wireframe, ready, duration]);

  /*
   * Playback advances on the frame grid rather than continuously: the viewer
   * never shows a moment that is not a real frame, which is the point being
   * made. Reduced motion means it does not start on its own.
   */
  const running = playing && !reducedMotion;

  useEffect(() => {
    if (!running || !ready) return;
    let raf = 0;
    let started: number | null = null;
    const step = (now: number) => {
      started ??= now;
      const elapsed = (now - started) / 1000;
      const index = Math.floor(elapsed * fps) % frames;
      setT(index / fps);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, ready, fps, frames]);

  const scrub = useCallback((value: number) => {
    setPlaying(false);
    setT(value / fps);
  }, [fps]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-10">
      <div>
        <div
          ref={holder}
          className="relative aspect-square w-full overflow-hidden rounded-sm bg-stage"
          aria-hidden="true"
        >
          <canvas ref={canvasRef} className="block h-full w-full" />
          {!ready && !failed && (
            <span className="data absolute inset-0 grid place-content-center text-white/50">
              loading three.js…
            </span>
          )}
          {failed && (
            <span className="data absolute inset-0 grid place-content-center px-6 text-center text-white/60">
              This browser would not give the page a WebGL context — which is exactly the problem
              seekreel solves by rendering with software GL.
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Toggle
            pressed={running}
            onPressedChange={setPlaying}
            disabled={!ready || reducedMotion}
            aria-label={running ? 'Pause the 3D scene' : 'Play the 3D scene'}
            className="grid h-11 w-11 shrink-0 place-content-center rounded-sm bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {running ? '❚❚' : '▶'}
          </Toggle>

          <Slider.Root
            value={frame}
            min={0}
            max={Math.max(0, frames - 1)}
            step={1}
            onValueChange={(value) => scrub(Array.isArray(value) ? value[0] : value)}
            disabled={!ready}
            className="min-w-0 flex-1"
          >
            <Slider.Control className="flex h-11 w-full items-center">
              <Slider.Track className="h-1 w-full rounded-full bg-rule">
                <Slider.Indicator className="rounded-full bg-primary" />
                <Slider.Thumb className="h-5 w-5 rounded-full bg-primary outline-offset-2" />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
        </div>

        <p className="data mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1 text-muted">
          <span>
            t = <span className="text-ink">{t.toFixed(3)}s</span> · frame{' '}
            <span className="text-ink">{String(frame).padStart(String(frames).length, '0')}</span> / {frames}
          </span>
          <span>{fps}fps · 1080×1080 · webgl</span>
        </p>
      </div>

      <div className="grid content-start gap-5">
        <Choice label="Duration" value={duration} options={DURATIONS} suffix="s" onChange={(next) => { setDuration(next); setT(0); }} />
        <Choice label="Frame rate" value={fps} options={RATES} suffix="fps" onChange={setFps} />

        <div className="flex items-center justify-between gap-4 border-t border-rule pt-4">
          <span className="data text-muted">Wireframe shell</span>
          <Toggle
            pressed={wireframe}
            onPressedChange={setWireframe}
            className="data rounded-sm border border-rule px-3 py-1 transition-colors data-[pressed]:border-primary data-[pressed]:bg-primary data-[pressed]:text-white"
          >
            {wireframe ? 'on' : 'off'}
          </Toggle>
        </div>

        <div className="border-t border-rule pt-4">
          <p className="data text-muted">The config those choices describe</p>
          <pre className="data mt-3 overflow-x-auto rounded-sm border border-rule bg-surface p-4 leading-relaxed text-accent">
{`{
  "stage": "stage.html",
  "duration": ${duration},
  "fps": ${fps},
  "width": 1080,
  "height": 1080,
  "webgl": true
}`}
          </pre>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-muted">
            {frames} frames, and the one you are looking at is number {frame}. Rendering it on its own
            is <span className="data text-ink">seekreel probe {t.toFixed(2)}</span>; re-cutting a
            stretch is <span className="data text-ink">seekreel render {Math.max(0, frame - 12)} {Math.min(frames - 1, frame + 12)}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Choice<T extends number>({
  label,
  value,
  options,
  suffix,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  suffix: string;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-rule pt-4">
      <span className="data text-muted">{label}</span>
      <div role="group" aria-label={label} className="flex gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={option === value}
            className={[
              'data rounded-sm border px-3 py-1 transition-colors',
              option === value
                ? 'border-primary bg-primary text-white'
                : 'border-rule text-muted hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            {option}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
