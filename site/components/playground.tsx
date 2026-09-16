'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import type * as THREE from 'three';

/*
 * The playground: the whole tool, running on the page.
 *
 * Every control here is a key in seekreel.config.json, and the config printed
 * beside them is the one your choices describe — change the frame rate and the
 * frame count under the scrubber changes, because that is all fps means. Pick a
 * ratio and the frame gets a shape while the picture stays the size it was,
 * which is what a ratio does to a render.
 *
 * The three stages are genuinely three techniques, not three pictures of them:
 * the DOM one is written imperatively against a ref the way a plain stage is,
 * the React one is a component tree taking t as a prop, and the three.js one is
 * a WebGL scene. All three are pure functions of the timestamp, which is the
 * only rule any of this has.
 */

type StageKind = 'dom' | 'react' | 'three';
type AudioEngine = 'strudel' | 'cues' | 'none';

type Scene3D = {
  draw: (t: number, duration: number) => void;
  resize: (size: number) => void;
  dispose: () => void;
};

const STAGES: { id: StageKind; label: string; file: string; note: string }[] = [
  { id: 'dom', label: 'DOM', file: 'stage.html', note: 'no library at all — properties set from t' },
  { id: 'react', label: 'React', file: 'stage.jsx', note: 'a component tree, t as a prop, flushSync on commit' },
  { id: 'three', label: 'three.js', file: 'stage.html', note: 'one render call per frame, software GL' },
];

const RATIOS = [
  { id: '1:1', w: 1, h: 1 },
  { id: '4:5', w: 4, h: 5 },
  { id: '9:16', w: 9, h: 16 },
] as const;

const DURATIONS = [4, 8, 16] as const;
const RATES = [12, 24, 30] as const;

const FORMATS: { id: string; label: string; ext: string }[] = [
  { id: 'mp4', label: 'mp4', ext: 'mp4' },
  { id: 'webm', label: 'webm', ext: 'webm' },
  { id: 'mov', label: 'mov', ext: 'mov' },
  { id: 'gif', label: 'gif', ext: 'gif' },
];

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const outQuart = (x: number) => 1 - Math.pow(1 - x, 4);
/** The one timing primitive every stage in this project uses. */
const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

const BARS = 14;

export default function Playground() {
  const [stage, setStage] = useState<StageKind>('three');
  const [duration, setDuration] = useState<number>(8);
  const [fps, setFps] = useState<number>(24);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(RATIOS[0]);
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [audio, setAudio] = useState<AudioEngine>('strudel');
  const [formats, setFormats] = useState<string[]>(['mp4', 'gif']);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);

  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );
  const running = playing && !reducedMotion;

  const frames = Math.round(duration * fps);
  const frame = Math.min(frames - 1, Math.round(t * fps));

  /*
   * Playback advances on the frame grid rather than continuously: the viewer
   * never shows a moment that is not a real frame, which is the point being
   * made.
   */
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let started: number | null = null;
    const step = (now: number) => {
      started ??= now;
      const index = Math.floor(((now - started) / 1000) * fps) % frames;
      setT(index / fps);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [running, fps, frames]);

  const scrub = useCallback(
    (value: number) => {
      setPlaying(false);
      setT(value / fps);
    },
    [fps],
  );

  const toggleFormat = (id: string) =>
    setFormats((current) =>
      current.includes(id) ? current.filter((f) => f !== id) || [] : [...current, id],
    );

  const webgl = stage === 'three';
  const file = STAGES.find((s) => s.id === stage)!.file;

  /* The variants those choices describe, and the files they would write. */
  const variants = [
    ...(ratio.id === '1:1' ? [] : [{ name: ratio.id.replace(':', 'x'), detail: `"ratio": "${ratio.id}"` }]),
    ...formats
      .filter((f) => f !== 'mp4')
      .map((f) => ({ name: f, detail: `"format": "${f}"` })),
  ];
  const deliverables = [
    `reel.mp4`,
    ...variants.map((v) => `reel-${v.name}.${FORMATS.find((f) => f.id === v.name)?.ext ?? 'mp4'}`),
    'reel-poster.png',
  ];

  const config = [
    '{',
    '  "stage": ' + JSON.stringify(file) + ',',
    `  "duration": ${duration},`,
    `  "fps": ${fps},`,
    '  "width": 1080,',
    '  "height": 1080,',
    `  "poster": ${(duration * 0.75).toFixed(1)},`,
    ...(webgl ? ['  "webgl": true,'] : []),
    ...(audio === 'none'
      ? []
      : audio === 'strudel'
        ? ['  "audio": { "engine": "strudel", "pattern": "music.strudel.js", "cps": 0.5 },']
        : ['  "audio": { "engine": "cues", "cues": "cues.json" },']),
    '  "variants": [',
    '    { "name": "" }' + (variants.length ? ',' : ''),
    ...variants.map(
      (v, i) =>
        `    { "name": ${JSON.stringify(v.name)}, ${v.detail}${
          v.name === ratio.id.replace(':', 'x') && fit === 'cover' ? ', "fit": "cover"' : ''
        } }` + (i === variants.length - 1 ? '' : ','),
    ),
    '  ]',
    '}',
  ].join('\n');

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
      {/* The frame, and the controls that move it. */}
      <div className="min-w-0">
        <Frame ratio={ratio} fit={fit}>
          {stage === 'three' ? (
            <ThreeStage t={t} duration={duration} />
          ) : stage === 'react' ? (
            <ReactStage t={t} duration={duration} />
          ) : (
            <DomStage t={t} duration={duration} />
          )}
        </Frame>

        <div className="mt-4 flex items-center gap-4">
          <Toggle
            pressed={running}
            onPressedChange={setPlaying}
            disabled={reducedMotion}
            aria-label={running ? 'Pause the preview' : 'Play the preview'}
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

        {ratio.id !== '1:1' && (
          <p className="data mt-2 text-muted">
            {fit === 'cover'
              ? `the 1080×1080 render fills ${ratio.id} and what hangs over is cut`
              : `the 1080×1080 render is kept whole and ${ratio.id} is padded with background`}
          </p>
        )}

        <p className="data mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1 text-muted">
          <span>
            t = <span className="text-ink">{t.toFixed(3)}s</span> · frame{' '}
            <span className="text-ink">{String(frame).padStart(String(frames).length, '0')}</span> /{' '}
            {frames}
          </span>
          <span>
            {fps}fps · 1080×1080 → {ratio.id}
            {webgl ? ' · webgl' : ''}
          </span>
        </p>

        <p className="mt-5 max-w-[52ch] leading-relaxed text-muted">
          {STAGES.find((s) => s.id === stage)!.note}. Rendering this exact moment on its own is{' '}
          <span className="data text-ink">seekreel probe {t.toFixed(2)}</span>; re-cutting the shot
          around it is{' '}
          <span className="data text-ink">
            seekreel render {Math.max(0, frame - 12)} {Math.min(frames - 1, frame + 12)}
          </span>
          .
        </p>
      </div>

      {/* Every control is a config key. */}
      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        <Choice
          label="Stage"
          value={stage}
          options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
          onChange={setStage}
        />
        <Choice
          label="Duration"
          value={duration}
          options={DURATIONS.map((d) => ({ value: d, label: `${d}s` }))}
          onChange={(next) => {
            setDuration(next);
            setT(0);
          }}
        />
        <Choice
          label="Frame rate"
          value={fps}
          options={RATES.map((r) => ({ value: r, label: `${r}fps` }))}
          onChange={setFps}
        />
        <Choice
          label="Ratio"
          value={ratio.id}
          options={RATIOS.map((r) => ({ value: r.id, label: r.id }))}
          onChange={(id) => setRatio(RATIOS.find((r) => r.id === id)!)}
        />
        <Choice
          label="Fit"
          value={fit}
          options={[
            { value: 'contain' as const, label: 'contain' },
            { value: 'cover' as const, label: 'cover' },
          ]}
          onChange={setFit}
        />
        <Choice
          label="Sound"
          value={audio}
          options={[
            { value: 'strudel' as const, label: 'strudel' },
            { value: 'cues' as const, label: 'cues' },
            { value: 'none' as const, label: 'silent' },
          ]}
          onChange={setAudio}
        />

        <div className="flex items-center justify-between gap-4 border-t border-rule pt-4">
          <span className="data text-muted">Also write</span>
          <div role="group" aria-label="Extra formats" className="flex flex-wrap gap-1.5">
            {FORMATS.filter((f) => f.id !== 'mp4').map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => toggleFormat(format.id)}
                aria-pressed={formats.includes(format.id)}
                className={[
                  'data rounded-sm border px-3 py-1 transition-colors',
                  formats.includes(format.id)
                    ? 'border-primary bg-primary text-white'
                    : 'border-rule text-muted hover:border-ink hover:text-ink',
                ].join(' ')}
              >
                {format.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-rule pt-4">
          <p className="data text-muted">seekreel.config.json</p>
          <pre className="data mt-3 max-w-full overflow-x-auto rounded-sm border border-rule bg-surface p-4 leading-relaxed text-accent">
            {config}
          </pre>
        </div>

        <div className="border-t border-rule pt-4">
          <p className="data text-muted">
            <span className="text-ink">seekreel build</span> writes {deliverables.length} file
            {deliverables.length === 1 ? '' : 's'}, all from the same {frames} frames
          </p>
          <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
            {deliverables.map((name) => (
              <li key={name} className="data rounded-sm border border-rule px-2.5 py-1 text-muted">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * The output frame.
 *
 * A ratio does not shrink the picture: the render keeps its size and the canvas
 * changes shape around it, padded with the background colour — or cropped, when
 * `fit` is cover. This box does the same thing to the preview so the two words
 * mean something before you spend twenty minutes finding out.
 */
function Frame({
  ratio,
  fit,
  children,
}: {
  ratio: (typeof RATIOS)[number];
  fit: 'contain' | 'cover';
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-sm border border-rule bg-bg"
      style={{ aspectRatio: `${ratio.w} / ${ratio.h}` }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={
          fit === 'cover'
            ? { width: 'max(100%, calc(100cqh))', aspectRatio: '1 / 1', minWidth: '100%', minHeight: '100%' }
            : { width: 'min(100%, 1000px)', aspectRatio: '1 / 1', maxHeight: '100%' }
        }
      >
        <div className="relative h-full w-full overflow-hidden bg-stage">{children}</div>
      </div>
    </div>
  );
}

/**
 * A plain stage: no library, properties written straight onto elements from the
 * timestamp. This is what `examples/linkedin-promo` does for forty-eight
 * seconds.
 */
function DomStage({ t, duration }: { t: number; duration: number }) {
  const holder = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = holder.current;
    if (!root) return;
    const bars = root.querySelectorAll<HTMLElement>('[data-bar]');
    bars.forEach((bar, i) => {
      const phase = i / bars.length;
      const rise = outQuart(span(t, 0.2 + phase * 0.5, 0.2 + phase * 0.5 + duration * 0.25));
      bar.style.height = `${8 + rise * 62}%`;
      bar.style.opacity = String(0.35 + rise * 0.65);
    });
    const card = root.querySelector<HTMLElement>('[data-card]');
    if (card) {
      const arrive = outQuart(span(t, 0.1, 1.1));
      card.style.opacity = String(arrive);
      card.style.transform = `translateY(${(1 - arrive) * 18}px)`;
    }
    const sweep = root.querySelector<HTMLElement>('[data-sweep]');
    if (sweep) sweep.style.transform = `scaleX(${(t / duration).toFixed(4)})`;
  }, [t, duration]);

  return (
    <div ref={holder} className="relative h-full w-full">
      <div data-card className="absolute left-[8%] top-[12%] max-w-[70%]">
        <p className="wide text-[clamp(1.2rem,4.4cqw,2.6rem)] font-extrabold leading-[0.95] text-white">
          One frame
          <br />
          per seek.
        </p>
        <p className="data mt-3 text-white/60">properties set from t, no library</p>
      </div>
      <div className="absolute inset-x-[8%] bottom-[14%] flex h-[42%] items-end gap-[1.6%]">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            data-bar
            className="flex-1 rounded-t-[2px]"
            style={{ background: i % 3 === 0 ? 'var(--color-primary-lit)' : 'rgba(255,255,255,0.75)' }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
        <div data-sweep className="h-full origin-left bg-primary" />
      </div>
    </div>
  );
}

/**
 * A React stage: the tree is a pure function of its props, which is the whole
 * requirement. In a real project this is where `flushSync` matters — React has
 * to commit before the frame is marked ready.
 */
function ReactStage({ t, duration }: { t: number; duration: number }) {
  const rows = ['probe', 'render', 'encode', 'build'];
  const title = outQuart(span(t, 0.1, 1.0));
  return (
    <div className="relative h-full w-full p-[7%]">
      <p
        className="wide text-[clamp(1.2rem,4.2cqw,2.4rem)] font-extrabold leading-[0.95] text-white"
        style={{ opacity: title, transform: `translateY(${(1 - title) * 16}px)` }}
      >
        React renders
        <br />
        frames too.
      </p>
      <div className="absolute inset-x-[7%] bottom-[10%] grid grid-cols-1 gap-[3%]">
        {rows.map((row, i) => {
          const at = 0.5 + i * 0.35;
          const enter = outQuart(span(t, at, at + 0.7));
          const fill = span(t, at + 0.1, at + duration * 0.35);
          return (
            <div
              key={row}
              className="grid grid-cols-[28%_1fr_14%] items-center gap-[3%] border-t border-white/15 pt-[2%]"
              style={{ opacity: enter, transform: `translateY(${(1 - enter) * 12}px)` }}
            >
              <span className="data text-white">{row}</span>
              <span className="h-[6px] bg-white/15">
                <span className="block h-full origin-left bg-primary" style={{ transform: `scaleX(${fill})` }} />
              </span>
              <span className="data text-right text-white/60">{Math.round(fill * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A three.js stage: WebGL, and every transform computed from `t`. */
function ThreeStage({ t, duration }: { t: number; duration: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const holder = useRef<HTMLDivElement | null>(null);
  const scene = useRef<Scene3D | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

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

        const bars: THREE.Mesh[] = [];
        const group = new THREE.Group();
        for (let i = 0; i < 18; i++) {
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 1, 0.42),
            new THREE.MeshStandardMaterial({
              color: i % 3 === 0 ? 0xd946a6 : 0xf7f2f5,
              roughness: 0.35,
              metalness: 0.1,
            }),
          );
          const around = (i / 18) * Math.PI * 2;
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
          new THREE.MeshBasicMaterial({
            color: 0xd946a6,
            wireframe: true,
            transparent: true,
            opacity: 0.55,
          }),
        );
        shell.position.y = 1.5;
        world.add(shell);

        built = {
          draw(now, length) {
            const turn = now / length;
            const angle = turn * Math.PI * 2;
            camera.position.set(
              Math.sin(angle) * 11.5,
              4.4 + Math.sin(turn * Math.PI * 4) * 1.1,
              Math.cos(angle) * 11.5,
            );
            camera.lookAt(0, 1.1, 0);

            bars.forEach((bar, i) => {
              const phase = i / bars.length;
              const rise = outQuart(clamp01((now - (0.15 + phase * 0.5)) / (length * 0.18)));
              const height = 0.4 + rise * (1.2 + Math.sin(phase * Math.PI * 3) * 0.9);
              bar.scale.y = height;
              bar.position.y = height / 2;
            });

            shell.scale.setScalar(1 + Math.sin(now * Math.PI * 0.75) * 0.08);
            shell.rotation.set(now * 0.3, now * 0.42, 0);
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
        /* No WebGL, or the chunk failed. The panel says so rather than sitting
           blank, and every other control still works. */
        setFailed(true);
      }
    })();

    return () => {
      live = false;
      built?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    if (!holder.current) return;
    const element = holder.current;
    const observer = new ResizeObserver(() => scene.current?.resize(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    scene.current?.draw(t, duration);
  }, [t, duration, ready]);

  return (
    <div ref={holder} className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {!ready && !failed && (
        <span className="data absolute inset-0 grid place-content-center text-white/50">
          loading three.js…
        </span>
      )}
      {failed && (
        <span className="data absolute inset-0 grid place-content-center px-6 text-center text-white/60">
          This browser would not give the page a WebGL context — which is the problem seekreel
          solves by rendering with software GL.
        </span>
      )}
    </div>
  );
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule pt-4">
      <span className="data text-muted">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={option.value === value}
            className={[
              'data rounded-sm border px-3 py-1 transition-colors',
              option.value === value
                ? 'border-primary bg-primary text-white'
                : 'border-rule text-muted hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
