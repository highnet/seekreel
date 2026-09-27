'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import type * as THREE from 'three';
import type { Kit } from '../../family/kit/actors';

/*
 * The family pack's cast, live. The characters are the pack's own builders
 * (family/kit/actors.js), imported rather than copied, and every pose is
 * computed from t — blinks, the turntable, each character's entrance — so
 * the scrubber can land anywhere and the picture is what a render would be.
 */
const DURATION = 6;
const FPS = 24;
const FRAMES = DURATION * FPS;
const POSTER = Math.round(3 * FPS);

/* A spring's shape without a clock: overshoot, then settle. */
const settle = (e: number) => (e <= 0 ? 0 : 1 - Math.exp(-6 * e) * Math.cos(11 * e));
const blink = (t: number, offset: number, every = 3.7) => ((t + offset) % every < 0.13 ? 0.12 : 1);

const CAST = ['cap and glasses', 'bun', 'bow', 'sprout', 'baby', 'dog'];

type World = {
  three: typeof THREE;
  kit: Kit;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cast: THREE.Group;
};

function pose(world: World, t: number) {
  const { kit, cast } = world;
  cast.traverse((node) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose?.();
  });
  cast.clear();
  const P = kit.PALETTE;
  const turn = Math.sin(t * 0.8) * 0.35;
  const build = [
    () => kit.glasses(kit.cap(kit.blob({ color: P.butter, open: blink(t, 0) }))).group,
    () => kit.hairBun(kit.blob({ color: P.rose, cheek: '#ff6f8e', open: blink(t, 1.1) })).group,
    () => kit.bow(kit.blob({ color: '#b6a4e6', happy: true, blush: 0.8 })).group,
    () => kit.sprout(kit.blob({ color: '#9fd3a0', open: blink(t, 2.2), mouth: 1 + Math.abs(Math.sin(t * 9)) }), Math.sin(t * 3) * 0.1).group,
    () => kit.pacifier(kit.curl(kit.blob({ color: P.peach, cheek: '#ff9a9a', open: blink(t, 0.6) }))).group,
    () => kit.dog({ wag: Math.sin(t * 14) * 0.5, ears: 0.35 + Math.sin(t * 7) * 0.08, open: blink(t, 2.3, 4.1) }).group,
  ];
  build.forEach((make, i) => {
    const g = make();
    const s = settle(t - 0.2 - i * 0.18);
    g.position.set((i - (build.length - 1) / 2) * 1.5, 0, 0);
    g.rotation.y = turn;
    g.scale.setScalar(Math.max(0.0001, s * (i === 4 ? 0.5 : 1)));
    cast.add(g);
  });
  world.renderer.render(world.scene, world.camera);
}

export default function FamilyCast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const [frame, setFrame] = useState(POSTER);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const t = frame / FPS;

  /* Build the renderer once, on the client, with three.js and the kit loaded on demand. */
  useEffect(() => {
    let cancelled = false;
    let onResize: (() => void) | null = null;
    (async () => {
      const three = await import('three');
      const { createKit } = await import('../../family/kit/actors.js');
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const renderer = new three.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = three.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      const scene = new three.Scene();
      const camera = new three.PerspectiveCamera(34, 16 / 9, 0.1, 100);
      camera.position.set(0, 1.25, 8.4);
      camera.lookAt(0, 0.45, 0);
      scene.add(new three.HemisphereLight('#ffe9d6', '#c9a2c9', 1.6));
      const key = new three.DirectionalLight('#ffe2c0', 2.2);
      key.position.set(5, 8, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
      scene.add(key);
      const kit = createKit(three);
      const floor = new three.Mesh(new three.CircleGeometry(12, 64), kit.toon('#f8d5de'));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      const cast = new three.Group();
      scene.add(cast);
      const resize = () => {
        const { clientWidth, clientHeight } = canvas;
        renderer.setSize(clientWidth, clientHeight, false);
      };
      resize();
      onResize = resize;
      window.addEventListener('resize', resize);
      worldRef.current = { three, kit, renderer, scene, camera, cast };
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener('resize', onResize);
      worldRef.current?.renderer.dispose();
      worldRef.current = null;
    };
  }, []);

  /* The picture is a function of the frame: redraw whenever it changes. */
  useEffect(() => {
    if (ready && worldRef.current) pose(worldRef.current, t);
  }, [ready, t]);

  /* Playing advances the frame on the grid, the same promise the renderer makes. */
  useEffect(() => {
    if (!playing) return;
    const started = performance.now() - (frame / FPS) * 1000;
    let raf = 0;
    const tick = (now: number) => {
      setFrame(Math.floor((((now - started) / 1000) % DURATION) * FPS));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `frame` is the resume point, read once when playback starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const scrub = useCallback((value: number | number[]) => {
    setPlaying(false);
    setFrame(Math.round(Array.isArray(value) ? value[0] : value));
  }, []);

  return (
    <figure className="m-0 min-w-0">
      <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-[linear-gradient(180deg,#ffe6ee,#fff6ec)] ring-1 ring-rule">
        <canvas ref={canvasRef} className="block size-full" aria-label="The family pack's cast, drawn at the chosen timestamp" />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Toggle
          pressed={playing}
          onPressedChange={setPlaying}
          aria-label={playing ? 'Pause the cast' : 'Play the cast'}
          className="grid size-11 shrink-0 place-items-center rounded-sm border border-rule bg-bg text-ink transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <Slider.Root value={frame} onValueChange={scrub} min={0} max={FRAMES - 1} step={1} largeStep={FPS} className="w-full">
          <Slider.Control className="flex w-full touch-none py-3 select-none">
            <Slider.Track className="h-1.5 w-full rounded-full bg-rule select-none">
              <Slider.Indicator className="rounded-full bg-primary select-none" />
              <Slider.Thumb
                aria-label="Timestamp"
                className="h-7 w-1.5 rounded-full bg-primary select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-primary"
              />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </div>

      <figcaption className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-muted">
        <span className="data text-ink">
          t = {t.toFixed(3)}s · frame {String(frame).padStart(3, '0')} / {FRAMES}
        </span>
        <span>{CAST.join(' · ')}</span>
      </figcaption>
    </figure>
  );
}
