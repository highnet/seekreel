/*
 * The family pack's three sets, each a pure function of its own local time
 * (seconds since the set began). A scene plays one; the sample movie plays
 * all three in a row by passing `t - start`.
 *
 * Each builder fills the world, points the camera, and returns the actors so
 * the React layer can hang speech bubbles over them (world.above(actor)).
 */
import { mix, mixColor, easeInOut, easeOut, span, springAt, blink, hop, rng } from "./timing.js";

/* ---------------------------------------------------------------------------
 * The picnic (12s): the Blobs on an island; the dog steals a fry at 4.6s and
 * takes a victory lap while the baby watches.
 * ------------------------------------------------------------------------- */
export const PICNIC_LENGTH = 12;
export function picnic(world, s, { camera = true } = {}) {
  const { THREE, kit, scene } = world;
  const STEAL = 4.6;
  scene.add(kit.sea({ ripple: (s * 0.22) % 1 }));
  const land = kit.island(); scene.add(land);
  const palm = kit.palm({ sway: Math.sin(s * 1.3) * 0.04 }); palm.position.set(-3.2, 0, -1.7); land.add(palm);
  const home = kit.building({ built: 3 }); home.position.set(1.8, 0, -2.6); home.rotation.y = -0.3; land.add(home);
  const blanket = kit.blanket(); blanket.position.set(-0.4, 0, 1.4); land.add(blanket);
  const box = kit.fryBox({ fries: s < STEAL ? 5 : 4 }); box.position.set(-0.4, 0, 1.4); land.add(box);
  const melon = kit.melonHalf(); melon.position.set(0.9, 0, 2.2); land.add(melon);

  const shock = span(STEAL, STEAL + 0.3, s) * (1 - span(6.6, 7, s));
  const me = kit.glasses(kit.cap(kit.blob({ color: kit.PALETTE.butter, open: blink(0, 3.7, s), eyes: 1 + 0.6 * shock, squash: Math.sin(s * 2.6) * 0.02 })));
  me.group.position.set(-1.7, 0, 1.3); me.group.rotation.y = 0.3; land.add(me.group);
  const laughing = s > 5 && s < 7.5;
  const her = kit.hairBun(kit.blob({ color: kit.PALETTE.rose, cheek: "#ff6f8e", open: blink(1.1, 3.7, s), happy: laughing,
    mouth: laughing ? 2.3 : 1, squash: laughing ? -Math.abs(Math.sin(s * 18)) * 0.1 : Math.sin(s * 2.6 + 1.3) * 0.02 }));
  her.group.position.set(0.7, 0, 1.3); her.group.rotation.y = -0.3; land.add(her.group);
  const baby = kit.pacifier(kit.curl(kit.blob({ color: kit.PALETTE.peach, cheek: "#ff9a9a", open: blink(0.6, 3.7, s), eyes: 1 + 0.4 * shock })));
  baby.group.scale.setScalar(0.5); baby.group.position.set(-0.4, 0, 2.15); land.add(baby.group);

  /* the dog: in from the right, the grab, a victory lap */
  const run = hop(3.4, STEAL, 4, 0.3, s), lap = span(STEAL + 0.2, 9, s);
  let dx, dz, face;
  if (s < STEAL) { dx = mix(3.8, 0.2, easeInOut(run.u)); dz = mix(2.6, 1.95, easeInOut(run.u)); face = -Math.PI / 2; }
  else { const a = lap * Math.PI * 2; dx = Math.sin(a) * 2.9 + 0.2 * (1 - lap); dz = Math.cos(a) * 2.2 - 0.25; face = a + Math.PI / 2; }
  const dog = kit.dog({ wag: Math.sin(s * 14) * 0.5, ears: 0.35 + (run.y > 0 ? 0.3 : 0), open: blink(2.3, 4.1, s) });
  dog.group.position.set(dx, run.y + (s > STEAL && s < 9 ? Math.abs(Math.sin(s * 12)) * 0.12 : 0), dz);
  dog.group.rotation.y = face;
  dog.group.visible = s > 3.3;
  land.add(dog.group);
  if (s >= STEAL - 0.25 && s < 9.2) {
    const f = kit.fry();
    dog.group.updateMatrixWorld(true);
    const mouth = dog.mouth.clone().applyMatrix4(dog.group.matrixWorld);
    if (s < STEAL) f.position.lerpVectors(new THREE.Vector3(-0.4, 0.45, 1.4), mouth, easeOut(span(STEAL - 0.25, STEAL, s)));
    else { f.position.copy(mouth); f.rotation.set(Math.PI / 2, face + Math.PI / 2, 0); }
    scene.add(f);
  }
  for (let i = 0; i < 4; i++) {
    const e = s - 5.3 - i * 0.25;
    if (e <= 0 || e > 2.4) continue;
    const h = kit.heart(0.14 * springAt(e, 0, 1, { stiffness: 360, damping: 10 }) + 0.0001, i % 2 ? "#ffcf4a" : kit.PALETTE.pink);
    h.position.set(0.7 + (i - 1.5) * 0.3, 1.5 + e * 0.8, 1.3);
    scene.add(h);
  }
  for (let c = 0; c < 4; c++) {
    const cl = kit.cloud({ seed: 5 + c });
    cl.position.set(-16 + c * 10 + s * 0.15, 7 + (c % 2) * 2, -16 - c * 2);
    scene.add(cl);
  }
  if (camera) {
    const push = easeInOut(span(0, PICNIC_LENGTH, s));
    world.camera.position.set(mix(0.4, -0.3, push), mix(3.3, 2.3, push), mix(9.6, 7.4, push));
    world.camera.lookAt(-0.3, 0.6, 1.0);
  }
  return { me, her, baby, dog };
}

/* ---------------------------------------------------------------------------
 * The getaway (10s): a plane crosses the sea, then a beach where one blob
 * slowly turns into a lobster.
 * ------------------------------------------------------------------------- */
export const GETAWAY_LENGTH = 10;
export function getaway(world, s) {
  const { THREE, kit, scene } = world;
  scene.add(kit.sea({ ripple: (s * 0.22) % 1 }));
  const BEACH = new THREE.Vector3(16, 0, -6);
  const beach = kit.beach(); beach.position.copy(BEACH); scene.add(beach);

  const burn = span(6, 8.5, s);
  const me = kit.glasses(kit.cap(kit.blob({ color: mixColor(kit.PALETTE.butter, "#ff7f66")(burn), open: blink(0, 3.7, s), eyes: 1 + 0.5 * burn })));
  me.group.position.set(-0.95, 0, 0.9); me.group.rotation.y = 0.25; beach.add(me.group);
  const her = kit.hairBun(kit.blob({ color: kit.PALETTE.rose, cheek: "#ff6f8e", open: blink(1.1, 3.7, s), happy: burn > 0.5, mouth: burn > 0.5 ? 2.2 : 1 }));
  her.group.position.set(0.95, 0, 0.9); her.group.rotation.y = -0.25; beach.add(her.group);
  const baby = kit.curl(kit.blob({ color: kit.PALETTE.peach, cheek: "#ff9a9a", mouth: 1 + Math.abs(Math.sin(s * 20)) * 0.8 }));
  baby.group.scale.setScalar(0.5); baby.group.position.set(0, 0, 1.6); beach.add(baby.group);
  const slice = kit.melonSlice(); slice.position.set(0.42, 0.5, 0.35); slice.rotation.set(0.2, -0.4, -0.5 + Math.sin(s * 3) * 0.1); baby.group.add(slice);

  const from = new THREE.Vector3(-8, 3.4, 4), to = BEACH.clone().add(new THREE.Vector3(0, 3.2, 0));
  const u = easeInOut(span(0, 4.2, s));
  const at = (k) => new THREE.Vector3().lerpVectors(from, to, k).add(new THREE.Vector3(0, Math.sin(k * Math.PI) * 1.2, 0));
  const pos = at(u);
  const plane = { group: kit.plane(), top: 0.5 };
  plane.group.position.copy(pos);
  plane.group.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
  plane.group.rotation.z = Math.sin(s * 3) * 0.05;
  plane.group.visible = s < 4.3;
  scene.add(plane.group);
  for (let i = 1; i <= 10 && s < 4.3; i++) {
    const k = u - i * 0.035;
    if (k <= 0) break;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22 * (1 - i / 12), 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 * (1 - i / 11) }));
    puff.position.copy(at(k));
    scene.add(puff);
  }
  for (let c = 0; c < 4; c++) {
    const cl = kit.cloud({ seed: 5 + c });
    cl.position.set(-12 + c * 9 + s * 0.2, 7 + (c % 2) * 2, -14 - c * 2);
    scene.add(cl);
  }
  if (s < 4.3) {
    const side = new THREE.Vector3(to.z - from.z, 0, -(to.x - from.x)).normalize();
    world.camera.position.copy(pos).add(side.multiplyScalar(-6.5)).add(new THREE.Vector3(0, 1.0, 0));
    world.camera.lookAt(pos.clone().add(new THREE.Vector3(0, -0.4, 0)));
  } else {
    const k = easeOut(span(4.3, GETAWAY_LENGTH, s));
    world.camera.position.set(BEACH.x + mix(0.4, 0.2, k), mix(2.6, 2.0, k), BEACH.z + mix(8.2, 6.6, k));
    world.camera.lookAt(BEACH.x, 0.9, BEACH.z + 0.4);
  }
  return { me, her, baby, plane };
}

/* ---------------------------------------------------------------------------
 * The gallery (10s): a pink museum wall, a slow pan, and the family waiting
 * at an empty frame. Async: it loads its pictures and the plaque font first.
 *   art: [{ src?, title, line }] — src is an image URL; without one a
 *   placeholder painting is generated from the index.
 * ------------------------------------------------------------------------- */
export const GALLERY_LENGTH = 10;
export const SAMPLE_ART = [
  { src: "photos/sunset.svg", title: "Sunset, With Blobs", line: "the first photo" },
  { title: "Untitled No. 1", line: "oil on toast" },
  { src: "photos/picnic.svg", title: "The Picnic", line: "fries on canvas" },
  { title: "Bossa Nova", line: "sound, framed" },
  { src: "photos/beach.svg", title: "Wish You Were Here", line: "sun, sea, sleep" },
  { title: "Soft Hours", line: "pink on pink" },
  { title: "Still Life", line: "with dog" },
  { title: "Morning", line: "coffee, mostly" },
];
export async function gallery(world, s, { art = SAMPLE_ART, base = "../", comingSoon = ["Coming Soon", "a new masterpiece"] } = {}) {
  const { THREE, kit, scene } = world;
  scene.fog = null;
  await document.fonts.load('700 48px "Bricolage"');
  const loader = new THREE.TextureLoader();
  const load = (src) => new Promise((res) => loader.load(base + src, res, undefined, () => res(null)));
  const textures = await Promise.all(art.map((a, i) => (a.src ? load(a.src) : kit.placeholderArt(i + 1))));
  const pieces = art.map((a, i) => ({ texture: textures[i], title: a.title, line: a.line, x: Math.floor(i / 2) * 1.75, y: i % 2 ? 1.0 : 2.55 }));
  const last = Math.floor((art.length - 1) / 2) * 1.75 + 1.75;
  pieces.push({ title: comingSoon[0], line: comingSoon[1], x: last, y: 1.95, h: 0.95, beat: 1 + Math.sin(s * 5) * 0.06 * span(6, 6.5, s) });
  const wall = kit.gallery({ pieces, font: '"Bricolage"' });
  scene.add(wall);

  let me = null, her = null, baby = null;
  const come = springAt(s - 6.6, 0, 1, { stiffness: 300, damping: 12 });
  if (come > 0.001) {
    me = kit.glasses(kit.cap(kit.blob({ color: kit.PALETTE.butter, happy: s > 7.4, blush: 0.9 })));
    her = kit.hairBun(kit.blob({ color: kit.PALETTE.rose, cheek: "#ff6f8e", happy: s > 7.4, blush: 1 }));
    baby = kit.pacifier(kit.curl(kit.blob({ color: kit.PALETTE.peach, cheek: "#ff9a9a", open: blink(0.6, 3.7, s) })));
    [[me, last - 0.7, 0.95, 0.62, 0.15], [her, last + 0.7, 0.95, 0.62, -0.15], [baby, last, 1.12, 0.36, 0]].forEach(([b, x, z, sc, ry]) => {
      b.group.position.set(x, 0, z); b.group.rotation.y = ry; b.group.scale.setScalar(sc * come); wall.add(b.group);
    });
  }
  const walk = easeInOut(span(0.5, 5.3, s));
  const push = easeInOut(span(4.4, 7.4, s));
  const cx = mix(0, last, walk);
  world.camera.position.set(cx, mix(1.75, 1.35, push), mix(4.6, 6.3, push));
  world.camera.lookAt(cx, mix(1.75, 1.3, push), 0);
  return { me, her, baby };
}

/* A little random, reused by stages that scatter things. */
export { rng };
