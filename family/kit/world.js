/*
 * The 3D half of a family-pack frame: a renderer, a camera, toon-friendly
 * lights and the actors kit. It does not touch the page — the React half
 * mounts the canvas (see <World> in react.js) — so a stage can build the whole
 * world, project anchors for speech bubbles, and only then render React.
 *
 *   const world = createWorld();
 *   world.scene.add(world.kit.blob().group);
 *   world.camera.position.set(0, 2, 7); world.camera.lookAt(0, 0.6, 0);
 */
import * as THREE from "../vendor/three.module.js";
import { createKit } from "./actors.js";

export function createWorld({ fov = 38, fog = [22, 48], fogColor = "#ffe8c4", shadows = true, width = innerWidth, height = innerHeight } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "world-canvas";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  if (fog) scene.fog = new THREE.Fog(new THREE.Color(fogColor), fog[0], fog[1]);
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);

  const hemi = new THREE.HemisphereLight("#ffe9d6", "#c9a2c9", 1.6);
  scene.add(hemi);
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

  /* world position → pixel position on the page, for bubbles and labels */
  const toScreen = (v) => {
    camera.updateMatrixWorld(true);
    const p = v.clone().project(camera);
    return [(p.x * 0.5 + 0.5) * width, (-p.y * 0.5 + 0.5) * height];
  };
  /* the point just above an actor's head, on screen */
  const above = (actor, lift = 0.25) => {
    actor.group.updateMatrixWorld(true);
    return toScreen(new THREE.Vector3(0, (actor.top ?? 1.2) + lift, 0).applyMatrix4(actor.group.matrixWorld));
  };

  return { THREE, kit, scene, camera, renderer, canvas, lights: { hemi, key }, toScreen, above, width, height };
}
