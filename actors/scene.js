/*
 * The boilerplate every actors scene shares: read `t`, build a renderer with
 * toon-friendly lights, and hand back the kit plus Motion's easing helpers.
 *
 *   const { THREE, kit, scene, camera, t, springAt, finish } = await setupScene();
 *   ...build the frame for time t...
 *   finish();
 *
 * Motion (the `motion` package, Framer Motion's engine) is loaded by the page
 * as a classic script and read from `window.Motion`. Its spring is sampled at
 * an elapsed time rather than run on a clock, so a pose is a pure function of t.
 */
import * as THREE from "./vendor/three.module.js";
import { createKit } from "./actors.js";

export async function setupScene({ fov = 38, fog = [22, 48], sky = "#ffe8c4", shadows = true } = {}) {
  const t = parseFloat(new URLSearchParams(location.search).get("t") || "0");
  const W = innerWidth, H = innerHeight;
  const M = window.Motion;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100vw;height:100vh;display:block";
  document.body.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.Fog(new THREE.Color(sky), fog[0], fog[1]);
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 200);

  scene.add(new THREE.HemisphereLight("#ffe9d6", "#c9a2c9", 1.6));
  const key = new THREE.DirectionalLight("#ffe2c0", 2.2);
  key.position.set(5, 8, 6);
  key.castShadow = shadows;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 });
  key.shadow.radius = 4;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  scene.add(key);

  const kit = createKit(THREE);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const span = (a, b, x = t) => clamp01((x - a) / (b - a));
  function springAt(sec, from = 0, to = 1, opts = {}) {
    if (sec <= 0) return from;
    return M.spring({ keyframes: [from, to], stiffness: 260, damping: 14, ...opts }).next(sec * 1000).value;
  }
  /* blink every few seconds, each actor on its own offset */
  const blink = (offset = 0, every = 3.7) => ((t + offset) % every) < 0.13 ? 0.12 : 1;
  /* a hop: height and squash for a character moving over [a, b] in `hops` hops */
  function hop(a, b, hops = 3, height = 0.5) {
    const u = span(a, b);
    if (u <= 0 || u >= 1) return { u, y: 0, squash: 0 };
    const phase = (u * hops) % 1;
    return { u, y: Math.abs(Math.sin(Math.PI * u * hops)) * height, squash: -0.12 * Math.sin(Math.PI * phase) };
  }

  const toScreen = (v) => {
    camera.updateMatrixWorld(true);
    const p = v.clone().project(camera);
    return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H];
  };

  const pending = [];
  function finish() {
    renderer.render(scene, camera);
    return Promise.all(pending).then(() => document.documentElement.setAttribute("data-seekreel-ready", "1"));
  }

  return {
    THREE, kit, scene, camera, renderer, t, W, H,
    span, clamp01, springAt, blink, hop, toScreen, pending, finish,
    mix: M.mix, mixColor: M.mixColor, easeInOut: M.easeInOut, easeOut: M.easeOut, easeIn: M.easeIn,
  };
}
