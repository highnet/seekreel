/*
 * The big-sister film: the four sets, each a pure function of its own local
 * time s (seconds since the set began), like kit/sets.js.
 *
 *   secret   28s  the nursery, before: Mom's belly, a hello, a kick
 *   home     40s  Mom and Dad bring the baby home; her big sister meets her
 *   share    36s  the nursery: a rattle, a lost pacifier, a big sister
 *   picnic   36s  Grandma's picnic: shade, a butterfly, melon
 *   lullaby  44s  the nursery at night: a quilt, a song, a cuddle
 *
 * Each returns the actors so the stage can hang speech bubbles over them.
 */
import { mix, easeInOut, easeOut, span, springAt, blink, track, shot } from "../kit/timing.js";
import { createCast, faceTo } from "./cast.js";

export const LENGTH = { secret: 28, home: 40, share: 36, picnic: 36, lullaby: 44 };

// ---------------------------------------------------------------------------
// shared bits
// ---------------------------------------------------------------------------
function camera(world, keys, s) {
  const c = shot(keys, s);
  world.camera.position.set(...c.p);
  world.camera.lookAt(...c.l);
}

/* a little burst of hearts rising from a point, starting at `at` */
function hearts(world, s, at, [x, y, z], { n = 4, spread = 0.28, size = 0.11 } = {}) {
  const { kit, scene } = world;
  for (let i = 0; i < n; i++) {
    const e = s - at - i * 0.22;
    if (e <= 0 || e > 2.6) continue;
    const k = springAt(e, 0, 1, { stiffness: 360, damping: 10 }) * (1 - easeOut(span(2.0, 2.6, e)));
    const h = kit.heart(size * k + 0.0001, i % 2 ? "#ffcf4a" : kit.PALETTE.pink);
    h.position.set(x + (i - (n - 1) / 2) * spread + Math.sin(e * 3 + i) * 0.06, y + e * 0.6, z);
    h.rotation.y = Math.sin(e * 2 + i) * 0.4;
    scene.add(h);
  }
}

function clouds(world, s, { y = 7, z = -16 } = {}) {
  for (let c = 0; c < 4; c++) {
    const cl = world.kit.cloud({ seed: 5 + c });
    cl.position.set(-16 + c * 10 + s * 0.15, y + (c % 2) * 2, z - c * 2);
    world.scene.add(cl);
  }
}

/* a thing flying in an arc from a to b, u 0..1 */
const arc = (THREE, a, b, u, height = 0.6) =>
  new THREE.Vector3().lerpVectors(a, b, u).add(new THREE.Vector3(0, Math.sin(Math.PI * u) * height, 0));

/* talk: the mouth flaps while a bubble is up */
const talk = (s, a, b, rest = 1, open = 1.2) => (s >= a && s <= b ? rest + Math.abs(Math.sin(s * 15)) * open : rest);

/* where a point on an actor sits in the world */
function worldPoint(world, obj, x, y, z) {
  world.scene.updateMatrixWorld(true);
  return obj.localToWorld(new world.THREE.Vector3(x, y, z));
}

function place(b, p, ry = 0, parent) {
  b.group.position.set(p.x, p.y ?? 0, p.z);
  b.group.rotation.y = ry;
  parent.add(b.group);
  return b;
}

// ---------------------------------------------------------------------------
// 0. secret (28s): the nursery before the baby; the big sister meets the bump
// ---------------------------------------------------------------------------
export function secret(world, s) {
  const { THREE, kit, scene } = world;
  const c = createCast(world);
  scene.fog = null;
  c.light(0, { key: [4, 8, 7] });
  const room = c.nursery({ night: 0 });
  scene.add(room.group);
  /* the little bed is ready and waiting, a gift on it */
  const bed = c.bed(); bed.group.position.set(1.9, 0, -1.0); bed.group.rotation.y = -0.3; scene.add(bed.group);
  const gift = kit.giftBox({ color: "#ffd0dc" }); gift.scale.setScalar(0.4); gift.position.set(1.9, 0.25, -0.9); scene.add(gift);

  /* Mom, expecting, turned toward where her big girl will stand */
  const MOM = new THREE.Vector3(-0.35, 0, 0.55), RY = 0.4;
  const fwd = new THREE.Vector3(Math.sin(RY), 0, Math.cos(RY));
  const kickAt = (a) => (s > a ? Math.sin((s - a) * 26) * Math.exp(-(s - a) * 4) : 0);
  const kick = kickAt(17) + 0.6 * kickAt(25.4);
  const momB = c.mom({
    belly: 1.05, kick,
    open: blink(1.4, 3.9, s), happy: (s > 12 && s < 14) || s > 18.4,
    mouth: talk(s, 5.2, 7.2, talk(s, 10.8, 14, s > 18.4 ? 1.5 : 1)), blush: s > 18 ? 0.9 : 0.5,
  });
  place(momB, MOM, RY, scene);

  /* the big sister: plays with her ball, comes over, listens, gets kicked, loves it */
  /* she stands at Mom's side, so the camera sees the bump */
  const BELLY = MOM.clone().addScaledVector(fwd, 0.62);
  const SPOT = new THREE.Vector3(MOM.x + 1.0, 0, MOM.z + 0.75);
  const inward = BELLY.clone().sub(SPOT).setY(0).normalize();
  const go = track([{ t: 5.6, p: [-1.75, 1.5] }, { t: 8.8, p: [SPOT.x, SPOT.z], hops: 5, hh: 0.25 }], s);
  const listen = span(13.2, 13.8, s) * (1 - span(17, 17.25, s));
  const hug = span(24, 24.6, s) * (1 - span(27.2, 28, s));
  const jump = s > 17 && s < 17.7 ? Math.sin(Math.PI * span(17, 17.7, s)) * 0.35 : 0;
  const back = span(17, 17.5, s) * (1 - span(19.5, 20.5, s)) * 0.3;
  const bounce = s > 19.2 && s < 22 ? Math.abs(Math.sin((s - 19.2) * Math.PI * 2)) * 0.12 : 0;
  const play = s < 5.6 ? Math.abs(Math.sin(s * 3)) * 0.06 : 0;
  const sis = c.bigSister({
    open: listen > 0.5 ? 0.12 : blink(0.9, 3.4, s),
    eyes: 1 + 0.5 * span(11, 11.5, s) * (1 - span(13, 13.4, s)) + 0.7 * span(17, 17.2, s) * (1 - span(18.4, 18.9, s)),
    happy: (s > 18.9 && s < 23.6) || hug > 0.5 || (listen > 0.5 && s > 15),
    mouth: talk(s, 14.4, 16.6, talk(s, 17.3, 19, s > 18.9 ? 1.6 : 1)),
    blush: mix(0.4, 1, span(18.6, 19.6, s)),
    squash: go.squash - play,
  });
  const toward = 0.2 * (listen + hug) - back;
  place(sis, { x: go.x + inward.x * toward, y: go.y + jump + bounce + play, z: go.z + inward.z * toward }, go.moving ? go.dir : s < 5.6 ? 0.6 : Math.atan2(inward.x, inward.z), scene);
  sis.group.rotation.x = 0.35 * (listen + hug);

  /* her ball, nudged about while she plays */
  const ball = c.ball();
  ball.position.set(-1.3 + Math.sin(s * 1.6) * 0.15 * (s < 6 ? 1 : 0), 0, 1.65);
  ball.rotation.z = -Math.sin(s * 1.6) * 0.9 * (s < 6 ? 1 : 0);
  scene.add(ball);

  /* Dad pops in at the door after the kick */
  const dGo = track([{ t: 18.6, p: [-3.9, 0.25] }, { t: 21, p: [-1.6, 0.05], hops: 4, hh: 0.14 }], s);
  let dad = null;
  if (s > 18.6) {
    const dadB = c.dad({ happy: s > 21.2, blush: 0.9, mouth: talk(s, 21.2, 23.2), squash: dGo.squash });
    place(dadB, { x: dGo.x, y: dGo.y, z: dGo.z }, dGo.moving ? dGo.dir : 0.75, scene);
    dad = dadB;
  }

  hearts(world, s, 17.05, [BELLY.x, 0.5, BELLY.z], { n: 2, size: 0.08 });
  hearts(world, s, 19.6, [0.1, 1.1, 1.0]);
  hearts(world, s, 24.8, [BELLY.x + 0.3, 0.95, BELLY.z], { n: 3, size: 0.09 });

  camera(world, [
    { t: 0, p: [-0.6, 2.4, 7.0], l: [-0.6, 0.6, 0.8] },
    { t: 5, p: [-0.6, 2.4, 7.0], l: [-0.6, 0.6, 0.8] },
    { t: 9.5, p: [0.1, 1.6, 5.0], l: [0.05, 0.55, 0.85] },
    { t: 13, p: [0.1, 1.6, 5.0], l: [0.05, 0.55, 0.85] },
    { t: 16.6, p: [0.2, 1.25, 3.9], l: [0.1, 0.5, 0.9] },
    { t: 18.4, p: [-0.5, 2.0, 6.3], l: [-0.7, 0.6, 0.6] },
    { t: 23.4, p: [-0.5, 2.0, 6.3], l: [-0.7, 0.6, 0.6] },
    { t: 28, p: [0.1, 1.45, 4.5], l: [0.05, 0.55, 0.85] },
  ], s);
  return { sis, mom: momB, dad };
}

// ---------------------------------------------------------------------------
// 1. home (40s): the cottage, the pram, the first look
// ---------------------------------------------------------------------------
export function home(world, s, { camera: cam = true } = {}) {
  const { THREE, kit, scene } = world;
  const c = createCast(world);
  c.light(0);
  scene.add(kit.sea({ ripple: (s * 0.22) % 1 }));
  scene.add(kit.island());
  const cottage = kit.cottage(); cottage.position.set(0, 0, -1.8); scene.add(cottage);
  const palm = kit.palm({ sway: Math.sin(s * 1.3) * 0.04 }); palm.position.set(-3.3, 0, -1.6); scene.add(palm);
  [[-1.4, -0.7, "#f7a3b4"], [-1.1, -0.55, "#ffcf4a"], [1.2, -0.6, "#b6a4e6"], [1.55, -0.75, "#f7a3b4"], [2.6, 0.4, "#ffcf4a"], [-2.6, 0.9, "#b6a4e6"], [3.0, 1.6, "#f7a3b4"]]
    .forEach(([x, z, col]) => { const f = kit.flower(col); f.position.set(x, 0, z); scene.add(f); });
  clouds(world, s);

  /* Mom pushes the pram in from the left, Dad beside her */
  const walk = track([{ t: 5.5, p: [-5.0, 2.05] }, { t: 13.5, p: [-1.85, 2.05], hops: 9, hh: 0.1 }], s);
  const arrived = s > 13.5;
  const momB = c.mom({ open: blink(1.4, 3.9, s), happy: s > 26, mouth: s > 26 ? 1.6 : 1, squash: walk.squash });
  place(momB, { x: walk.x, y: walk.y, z: walk.z }, arrived ? 0.5 : Math.PI / 2, scene);
  const pram = c.pram();
  pram.group.position.set(walk.x + 1.55, 0, walk.z);
  scene.add(pram.group);
  const dadWalk = track([{ t: 5.8, p: [-5.4, 1.0] }, { t: 13.8, p: [-2.6, 1.0], hops: 9, hh: 0.1 }], s);
  const dadB = c.dad({ open: blink(0.3, 4.3, s), happy: s > 26.5, blush: s > 26.5 ? 0.9 : 0.35, squash: dadWalk.squash });
  place(dadB, { x: dadWalk.x, y: dadWalk.y, z: dadWalk.z }, s > 13.8 ? 0.6 : Math.PI / 2, scene);
  momB.group.visible = dadB.group.visible = pram.group.visible = s >= 5.5;

  /* the baby asleep in the pram, then awake */
  const wake = span(24, 25.2, s);
  const baby = c.littleSister({
    open: wake < 1 ? mix(0.1, 1, wake) : blink(0.4, 3.1, s),
    happy: s > 28.5 && s < 32, eyes: 1.1,
    blush: mix(0.4, 0.9, span(28, 29, s)),
    squash: s > 26 ? Math.sin(s * 3) * 0.03 : 0,
  });
  baby.group.position.copy(pram.seat);
  pram.group.add(baby.group);

  /* the big sister: waits by the door, hops to the pram, peeks, falls in love */
  const go = track([{ t: 14.5, p: [0.35, -0.15] }, { t: 18.8, p: [0.62, 2.05], hops: 5, hh: 0.3 }], s);
  const peek = span(19, 19.6, s) * (1 - span(32, 33, s));
  const kiss = span(33, 33.7, s) * (1 - span(35.2, 36, s));
  const waiting = s > 1 && s < 13 ? Math.abs(Math.sin(s * 4.2)) * 0.07 : 0;
  const sis = c.bigSister({
    open: blink(0.9, 3.4, s),
    eyes: 1 + 0.6 * span(19.4, 20.2, s) * (1 - span(25.5, 26.5, s)),
    happy: s > 26.5 && kiss < 0.5,
    mouth: s > 26.5 ? talk(s, 27.6, 29.4, 1.6, 0.9) : 1,
    blush: mix(0.35, 1, span(26.5, 28, s)),
    squash: go.squash - 0.16 * peek + (waiting > 0 ? -waiting : 0),
  });
  const facing = s < 6 ? 0 : s < 14.5 ? -0.9 : go.moving ? go.dir : -Math.PI / 2 + 0.55;
  place(sis, { x: go.x - 0.12 * kiss, y: go.y + waiting, z: go.z }, facing, scene);
  sis.group.rotation.x = 0.28 * kiss;

  /* Grandma by the door, watching */
  const gm = c.grandma({ open: blink(2.1, 4.1, s), happy: s > 8 && s < 12 || s > 26, mouth: talk(s, 6.6, 8.6, s > 26 ? 1.5 : 1) });
  const gStep = track([{ t: 15.5, p: [1.45, -0.3] }, { t: 17.5, p: [1.35, 0.95], hops: 3, hh: 0.12 }], s);
  place(gm, { x: gStep.x, y: gStep.y, z: gStep.z }, s < 6 ? 0 : -0.75, scene);

  hearts(world, s, 27, [-0.1, 1.05, 2.1]);
  hearts(world, s, 34.2, [0.2, 1.0, 2.1], { n: 3, size: 0.13 });
  if (s > 28) hearts(world, s, 29.5, [-2.1, 1.6, 1.6], { n: 3, size: 0.08 });

  if (cam) camera(world, [
    { t: 0, p: [0.5, 3.2, 9.5], l: [0, 0.7, 0] },
    { t: 5.5, p: [0.5, 3.2, 9.5], l: [0, 0.7, 0] },
    { t: 12, p: [-1.2, 3.0, 9.8], l: [-1.4, 0.6, 1.2] },
    { t: 15, p: [-0.6, 2.6, 8.2], l: [-0.6, 0.6, 1.4] },
    { t: 19.5, p: [0.1, 1.6, 5.0], l: [0.05, 0.75, 1.95] },
    { t: 31, p: [0.0, 1.35, 4.2], l: [0.05, 0.75, 2.0] },
    { t: 38, p: [-0.5, 2.5, 8.0], l: [-0.7, 0.8, 1.3] },
  ], s);
  return { sis, baby, mom: momB, dad: dadB, grandma: gm, pram };
}

// ---------------------------------------------------------------------------
// 2. share (36s): the nursery by day
// ---------------------------------------------------------------------------
export function share(world, s) {
  const { THREE, kit, scene } = world;
  const c = createCast(world);
  scene.fog = null;
  c.light(0, { key: [4, 8, 7] });
  const room = c.nursery({ night: 0 });
  scene.add(room.group);

  const BABY = new THREE.Vector3(0.7, 0, 1.0);
  const POP = 19.6, BACK = 27.6;
  const crying = s > POP + 0.6 && s < BACK;
  const hasPaci = s < POP || s >= BACK;
  const baby = c.littleSister({
    paci: hasPaci,
    open: crying ? 0.12 : blink(0.4, 3.3, s),
    happy: (s > 16 && s < POP) || s > BACK + 0.4,
    mouth: crying ? 2.0 + Math.abs(Math.sin(s * 9)) * 0.8 : s > 16 && s < POP ? 2.2 : talk(s, 31, 32.5),
    blush: crying ? 1 : 0.5,
    eyes: s > POP && s < POP + 0.6 ? 1.6 : 1,
    squash: crying ? Math.sin(s * 22) * 0.05 : s > 16 && s < POP ? -Math.abs(Math.sin(s * 14)) * 0.08 : 0,
  });
  place(baby, BABY, -0.25, scene);

  /* the toy box, its lid, and the toys that fly out */
  const BOX = new THREE.Vector3(-2.25, 0, -0.45);
  const box = c.toyBox({ open: springAt(s - 9.6, 0, 1, { stiffness: 240, damping: 13 }) });
  box.scale.setScalar(0.7); box.position.copy(BOX); box.rotation.y = 0.35; scene.add(box);
  const out = (u, to, h) => arc(THREE, new THREE.Vector3(BOX.x, 0.45, BOX.z), to, easeOut(u), h);
  const fly = span(9.7, 10.5, s);

  /* the rattle: out of the box, then pushed over to the baby */
  const RAT_LAND = new THREE.Vector3(-1.35, 0.13, 0.45), RAT_END = new THREE.Vector3(0.28, 0.13, 1.05);
  const push = easeInOut(span(12.5, 15.5, s));
  const rattle = c.rattle();
  if (s < 9.7) rattle.visible = false;
  else if (fly < 1) { rattle.position.copy(out(fly, RAT_LAND, 0.9)); rattle.rotation.z = fly * 6; }
  else { rattle.position.lerpVectors(RAT_LAND, RAT_END, push); rattle.rotation.set(0, push * 0.6, Math.PI / 2); }
  scene.add(rattle);
  const ball = c.ball();
  const roll = easeOut(span(10.6, 12.6, s));
  if (s < 9.75) ball.visible = false;
  else ball.position.copy(fly < 1 ? out(span(9.75, 10.6, s), new THREE.Vector3(-2.9, 0, 0.5), 0.8) : new THREE.Vector3(mix(-2.9, -3.3, roll), 0, mix(0.5, 1.4, roll)));
  ball.rotation.x = roll * 5;
  scene.add(ball);
  const star = kit.star(0.13);
  if (s >= 9.8) { const u = span(9.8, 10.7, s); star.position.copy(u < 1 ? out(u, new THREE.Vector3(-1.9, 0.06, 1.2), 1.1) : new THREE.Vector3(-1.9, 0.06, 1.2)); star.rotation.set(u < 1 ? u * 8 : -Math.PI / 2, 0, 0.3); scene.add(star); }

  /* the big sister's path: to the box, behind the rattle, around to the pacifier, back */
  const go = track([
    { t: 5.6, p: [-0.75, 1.25] },
    { t: 8.8, p: [-1.85, 0.3], hops: 4, hh: 0.25 },
    { t: 11.6, p: [-1.85, 0.3] },
    { t: 12.2, p: [-1.8, 0.47], hops: 1, hh: 0.15 },
    { t: 15.5, p: [-0.17, 1.07] },
    { t: 22.2, p: [-0.17, 1.07] },
    { t: 23.6, p: [0.75, 1.85], hops: 3, hh: 0.25 },
    { t: 24.4, p: [1.55, 2.2], hops: 2, hh: 0.2 },
    { t: 25.2, p: [1.55, 2.2] },
    { t: 26.8, p: [1.32, 1.14], hops: 3, hh: 0.18 },
  ], s);
  const nudge = span(9.1, 9.4, s) * (1 - span(9.5, 9.9, s)) + span(27, 27.3, s) * (1 - span(27.7, 28.1, s)) + span(24.4, 24.6, s) * (1 - span(24.8, 25, s));
  const proud = s > 28.4 && s < 29.6 ? Math.abs(Math.sin((s - 28.4) * Math.PI * 2)) * 0.18 : 0;
  const sis = c.bigSister({
    open: blink(0.9, 3.4, s),
    happy: (s > 16 && s < 20) || s > 28,
    eyes: s > POP && s < 22 ? 1.5 : 1,
    mouth: talk(s, 11.3, 12.8, talk(s, 15.6, 17.2, talk(s, 27.9, 29.4, s > 28 ? 1.5 : 1))),
    blush: s > 28 ? 0.9 : 0.4,
    squash: go.squash - proud * 0.6,
  });
  let ry;
  if (go.moving) ry = go.dir;
  else if (s < 8.8) ry = faceTo(-0.75, 1.25, BABY.x, BABY.z);
  else if (s < 12) ry = faceTo(-1.85, 0.3, BOX.x, BOX.z);
  else if (s < 24.4) ry = faceTo(go.x, go.z, BABY.x, BABY.z);
  else if (s < 25.2) ry = Math.PI;
  else ry = faceTo(go.x, go.z, BABY.x, BABY.z);
  place(sis, { x: go.x, y: go.y + proud, z: go.z }, ry, scene);
  sis.group.rotation.x = 0.35 * nudge;

  /* the pacifier: pops out, lands, rides on the big sister's head, goes back */
  if (s >= POP && s < BACK + 0.6) {
    const p = c.pacifier();
    const FLOOR = new THREE.Vector3(1.55, 0.04, 1.78);
    const face = worldPoint(world, baby.face, 0, -0.09, 0.6);
    const head = worldPoint(world, sis.group, 0, sis.top + 0.06, 0);
    if (s < POP + 0.8) { const u = span(POP, POP + 0.8, s); p.position.copy(arc(THREE, face, FLOOR, u, 0.7)); p.rotation.set(u * 9, u * 3, 0); }
    else if (s < 24.6) { p.position.copy(FLOOR); p.rotation.set(-Math.PI / 2, 0, 0.4); }
    else if (s < 25.1) { p.position.copy(arc(THREE, FLOOR, head, span(24.6, 25.1, s), 0.4)); p.rotation.set(-Math.PI / 2 * (1 - span(24.6, 25.1, s)), 0, 0); }
    else if (s < 27.2) { p.position.copy(head); p.rotation.set(0, 0, Math.sin(s * 9) * 0.25); }
    else if (s < BACK) { p.position.copy(arc(THREE, head, face, easeInOut(span(27.2, BACK, s)), 0.3)); p.rotation.y = faceTo(0, 0, 0, 1) - 0.25; }
    else p.visible = false;
    scene.add(p);
  }

  /* tears while she cries */
  if (crying) for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
    const ph = (s * 1.4 + k * 0.5 + (side > 0 ? 0.25 : 0)) % 1;
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), kit.toon("#8fc4f0"));
    d.scale.set(1, 1.4, 1);
    d.position.copy(worldPoint(world, baby.face, side * 0.3, 0.02 - ph * 0.5, 0.48));
    d.position.x += side * ph * 0.06;
    scene.add(d);
  }

  hearts(world, s, 17, [0.5, 0.8, 1.1], { n: 3, size: 0.09 });
  hearts(world, s, 28.6, [0.9, 0.85, 1.3]);

  camera(world, [
    { t: 0, p: [0.2, 2.6, 7.6], l: [-0.4, 0.6, 0.5] },
    { t: 5.5, p: [0.2, 2.6, 7.6], l: [-0.4, 0.6, 0.5] },
    { t: 8.5, p: [-1.2, 1.9, 5.4], l: [-1.7, 0.4, -0.1] },
    { t: 11.2, p: [-1.2, 1.9, 5.4], l: [-1.7, 0.4, -0.1] },
    { t: 14.5, p: [0.0, 1.7, 5.6], l: [0.0, 0.45, 0.9] },
    { t: 19, p: [0.6, 1.6, 5.2], l: [0.8, 0.45, 1.3] },
    { t: 26, p: [0.8, 1.7, 5.6], l: [1.0, 0.45, 1.4] },
    { t: 30, p: [0.9, 1.3, 4.6], l: [0.95, 0.5, 1.25] },
    { t: 36, p: [0.85, 1.15, 4.0], l: [0.95, 0.5, 1.25] },
  ], s);
  return { sis, baby };
}

// ---------------------------------------------------------------------------
// 3. picnic (36s): Grandma, an umbrella, a butterfly, melon
// ---------------------------------------------------------------------------
export function picnic(world, s) {
  const { THREE, kit, scene } = world;
  const c = createCast(world);
  c.light(0, { key: [2, 10, 3], fill: 0.8 });
  scene.add(kit.sea({ ripple: (s * 0.22) % 1 }));
  scene.add(kit.island());
  const palm = kit.palm({ sway: Math.sin(s * 1.3) * 0.04 }); palm.position.set(-3.2, 0, -1.7); scene.add(palm);
  const home = kit.cottage(); home.position.set(2.3, 0, -2.5); home.rotation.y = -0.35; scene.add(home);
  [[-2.4, -0.4, "#f7a3b4"], [-1.6, -1.2, "#ffcf4a"], [2.9, 0.6, "#b6a4e6"], [3.3, 1.5, "#f7a3b4"], [-3.3, 1.3, "#ffcf4a"], [0.4, -1.0, "#b6a4e6"]]
    .forEach(([x, z, col]) => { const f = kit.flower(col); f.position.set(x, 0, z); scene.add(f); });
  const blanket = kit.blanket(); blanket.position.set(0, 0, 1.25); scene.add(blanket);
  clouds(world, s);

  const BABY = new THREE.Vector3(0.15, 0.05, 1.3);
  const shaded = s > 12.2;
  const startled = span(15.1, 15.4, s) * (1 - span(16.6, 17.2, s));
  const giggle = s > 18 && s < 22.2;
  const gift = s > 26 && s < 30;
  const baby = c.littleSister({
    open: s > 6.5 && !shaded ? 0.42 : blink(0.4, 3.2, s),
    happy: giggle || gift || s > 30.2,
    eyes: 1 + 0.7 * startled,
    mouth: giggle ? 2.2 + Math.abs(Math.sin(s * 16)) * 0.5 : 1,
    blush: s > 6.5 && !shaded ? 1 : 0.5,
    squash: giggle ? -Math.abs(Math.sin(s * 15)) * 0.08 : 0,
  });
  place(baby, BABY, -0.1 + startled * 0.1, scene);
  baby.group.rotation.x = -0.2 * startled;

  /* Grandma arrives with the basket on her head */
  const gWalk = track([{ t: 0, p: [4.3, 1.7] }, { t: 4.2, p: [1.4, 1.05], hops: 7, hh: 0.14 }, { t: 22.2, p: [1.4, 1.05] }, { t: 23, p: [1.5, 1.45], hops: 1, hh: 0.12 }], s);
  const gm = c.grandma({
    open: blink(2.1, 4.1, s), happy: (s > 4.4 && s < 5.2) || s > 29.6 || (s > 18 && s < 22),
    mouth: talk(s, 5.2, 7.6, talk(s, 27.2, 29.8)), blush: s > 27 ? 0.9 : 0.4, squash: gWalk.squash,
  });
  place(gm, { x: gWalk.x, y: gWalk.y, z: gWalk.z }, gWalk.moving && s < 5 ? gWalk.dir : faceTo(gWalk.x, gWalk.z, -0.2, 1.6), scene);
  const basket = c.basket();
  const BASKET = new THREE.Vector3(0.95, 0.05, 0.55);
  if (s < 4.6) basket.position.copy(worldPoint(world, gm.group, 0, gm.top, 0));
  else basket.position.copy(arc(THREE, worldPoint(world, gm.group, 0, gm.top, 0), BASKET, span(4.6, 5.2, s), 0.5));
  basket.rotation.y = 0.4;
  scene.add(basket);
  const melon = kit.melonHalf(); melon.position.set(1.0, 0.05, 1.65); melon.scale.setScalar(0.8); scene.add(melon);

  /* the umbrella the big sister pushes over to make shade */
  const U0 = new THREE.Vector3(-2.0, 0, 1.9), U1 = new THREE.Vector3(0.58, 0, 1.75);
  const uPush = easeInOut(span(9.2, 12.3, s));
  const um = kit.umbrella({ tilt: Math.sin(s * 6) * 0.03 * (uPush > 0 && uPush < 1 ? 1 : 0) });
  um.scale.setScalar(0.75);
  um.position.lerpVectors(U0, U1, uPush);
  scene.add(um);

  /* the big sister: to the umbrella, pushing it, aside, a hop for the butterfly */
  const go = track([
    { t: 6.8, p: [-0.75, 1.3, 0.05] },
    { t: 8.6, p: [-2.45, 1.92], hops: 4, hh: 0.28 },
    { t: 9.2, p: [-2.45, 1.92] },
    { t: 12.3, p: [0.13, 1.77] },
    { t: 13.4, p: [-0.42, 1.5, 0.05], hops: 2, hh: 0.2 },
  ], s);
  const leap = s > 16.3 && s < 17.1 ? Math.sin(Math.PI * span(16.3, 17.1, s)) * 0.4 : 0;
  const nudge = span(24.6, 24.85, s) * (1 - span(25, 25.4, s));
  const sis = c.bigSister({
    open: blink(0.9, 3.4, s),
    happy: (s > 12.4 && s < 14) || (s > 18 && s < 22.5) || s > 25.6,
    eyes: s > 6.8 && s < 7.6 ? 1.4 : 1,
    mouth: talk(s, 16.2, 18.2, talk(s, 13.6, 14.4, s > 25.6 ? 1.5 : 1)),
    blush: s > 25.6 ? 0.9 : 0.4,
    squash: go.squash + (s > 16.1 && s < 16.3 ? 0.12 : 0),
  });
  let ry;
  if (go.moving && s < 9.2) ry = go.dir;
  else if (s < 9.2) ry = faceTo(go.x, go.z, BABY.x, BABY.z);
  else if (s < 12.3) ry = Math.PI / 2;
  else ry = faceTo(go.x, go.z, BABY.x, BABY.z + 0.3);
  place(sis, { x: go.x, y: go.y + leap, z: go.z }, ry, scene);
  sis.group.rotation.x = 0.3 * nudge;

  /* the butterfly: in from the left, a hello to the baby, onto the big sister's bow, away */
  if (s > 13.6 && s < 25) {
    const bow = worldPoint(world, sis.group, 0.22, sis.top - 0.02, 0.1);
    const near = new THREE.Vector3(BABY.x + 0.05, 0.78, BABY.z + 0.4);
    let p;
    if (s < 15.2) { const u = easeOut(span(13.6, 15.2, s)); p = new THREE.Vector3(mix(-3.2, near.x, u), mix(2.2, near.y, u) + Math.sin(s * 7) * 0.12, mix(0.6, near.z, u)); }
    else if (s < 16.6) p = near.clone().add(new THREE.Vector3(Math.sin(s * 5) * 0.12, Math.sin(s * 8) * 0.06, 0));
    else if (s < 17.3) p = arc(THREE, near, bow, easeInOut(span(16.6, 17.3, s)), 0.25);
    else if (s < 22.4) p = bow.clone().add(new THREE.Vector3(0, 0.05, 0));
    else { const u = easeIn2(span(22.4, 25, s)); p = bow.clone().add(new THREE.Vector3(u * 3.5, u * 2.5 + Math.sin(s * 7) * 0.1, -u * 1.0)); }
    const fly = s < 17.3 || s > 22.4;
    const bf = c.butterfly({ flap: fly ? (Math.sin(s * 30) * 0.5 + 0.5) : (Math.sin(s * 4) * 0.5 + 0.5) * 0.6 });
    bf.position.copy(p);
    bf.rotation.set(-0.25, fly ? 0.6 + Math.sin(s * 2) * 0.4 : 0.3, 0);
    scene.add(bf);
  }

  /* melon: a slice for the big sister, which she gives to the baby; another for the big sister */
  const SL0 = new THREE.Vector3(1.0, 0.3, 1.65);
  const LILI_SPOT = new THREE.Vector3(-0.22, 0.05, 1.92), BABY_SPOT = new THREE.Vector3(0.05, 0.05, 1.68);
  if (s > 23.4) {
    const a = kit.melonSlice(0.75);
    if (s < 24.2) a.position.copy(arc(THREE, SL0, LILI_SPOT, span(23.4, 24.2, s), 0.6));
    else if (s < 26) a.position.lerpVectors(LILI_SPOT, BABY_SPOT, easeInOut(span(24.8, 25.8, s)));
    else a.position.copy(BABY_SPOT);
    a.rotation.y = -0.2;
    scene.add(a);
  }
  if (s > 27) {
    const b = kit.melonSlice(0.75);
    b.position.copy(arc(THREE, SL0, new THREE.Vector3(-0.5, 0.05, 1.95), span(27, 27.8, s), 0.6));
    b.rotation.y = 0.3;
    scene.add(b);
  }

  hearts(world, s, 19, [-0.1, 0.9, 1.5], { n: 3, size: 0.08 });
  hearts(world, s, 30.3, [1.4, 1.4, 1.1]);
  hearts(world, s, 31.2, [-0.1, 0.95, 1.5], { n: 3, size: 0.1 });

  camera(world, [
    { t: 0, p: [1.6, 2.6, 8.6], l: [0.8, 0.6, 1.1] },
    { t: 4.5, p: [1.2, 2.5, 8.0], l: [0.6, 0.6, 1.2] },
    { t: 7.6, p: [-0.9, 2.3, 7.4], l: [-1.0, 0.5, 1.4] },
    { t: 12.5, p: [-0.1, 2.2, 6.6], l: [0.0, 0.55, 1.5] },
    { t: 15, p: [0.0, 1.55, 5.0], l: [0.0, 0.6, 1.5] },
    { t: 22, p: [0.1, 1.55, 5.2], l: [0.1, 0.55, 1.5] },
    { t: 25, p: [0.4, 1.9, 5.8], l: [0.4, 0.5, 1.5] },
    { t: 30, p: [0.5, 2.0, 6.2], l: [0.4, 0.6, 1.4] },
    { t: 36, p: [0.4, 4.2, 10.5], l: [0.3, 0.6, 1.0] },
  ], s);
  return { sis, baby, grandma: gm };
}
const easeIn2 = (u) => u * u;

// ---------------------------------------------------------------------------
// 4. lullaby (44s): the nursery at night, the film's ending
// ---------------------------------------------------------------------------
export function lullaby(world, s) {
  const { THREE, kit, scene } = world;
  const c = createCast(world);
  scene.fog = null;
  c.light(1, { key: [3, 8, 6] });
  const room = c.nursery({ night: 1 });
  scene.add(room.group);
  const glow = new THREE.PointLight("#ffcf8a", 3.2, 7, 1.4); glow.position.copy(room.lamp); scene.add(glow);
  const bed = c.bed(); bed.group.position.set(0.4, 0, 0.6); scene.add(bed.group);

  const BABY = new THREE.Vector3(0.68, 0.25, 0.68);
  const fussy = s < 6.5;
  const sleepy = span(18, 24, s);
  const baby = c.littleSister({
    open: fussy ? (Math.sin(s * 3) > 0.3 ? 0.12 : 1) : sleepy > 0 ? mix(1, 0.08, easeInOut(sleepy)) : blink(0.4, 3.2, s),
    mouth: fussy ? 1.5 + Math.sin(s * 7) * 0.6 : 1,
    blush: fussy ? 0.9 : 0.5,
    squash: fussy ? Math.sin(s * 9) * 0.05 : sleepy >= 1 ? Math.sin(s * 1.6) * 0.025 : 0,
  });
  place(baby, BABY, -0.15, scene);

  /* the quilt: folded on the rug, pushed over, spread over the baby, then both */
  const Q0 = new THREE.Vector3(-1.8, 0, 0.95);
  const qPush = easeInOut(span(9.2, 11.4, s)), qHop = span(11.4, 12.2, s), both = easeInOut(span(29.2, 30.8, s));
  const quilt = c.quilt();
  const mid = new THREE.Vector3(mix(Q0.x, -0.6, qPush), 0, mix(Q0.z, 1.05, qPush));
  const onBaby = new THREE.Vector3(mix(BABY.x, 0.38, both), BABY.y, mix(BABY.z, 0.7, both));
  if (qHop <= 0) { quilt.position.copy(mid); quilt.scale.set(0.42, 0.32, 0.42); }
  else {
    quilt.position.copy(arc(THREE, mid, onBaby, easeOut(qHop), 0.5));
    const k = springAt(s - 11.6, 0, 1, { stiffness: 260, damping: 13 });
    quilt.scale.set(mix(0.42, mix(0.78, 1.45, both), k), mix(0.32, mix(0.75, 0.9, both), k), mix(0.42, mix(0.78, 0.95, both), k));
  }
  scene.add(quilt);

  /* the big sister: watches, fetches the quilt, sings, yawns, climbs into bed */
  const go = track([
    { t: 6, p: [-1.0, 1.55] },
    { t: 8.8, p: [-2.25, 1.1], hops: 3, hh: 0.25 },
    { t: 9.2, p: [-2.25, 1.1] },
    { t: 11.4, p: [-1.05, 1.2] },
    { t: 12.4, p: [-0.45, 1.35], hops: 2, hh: 0.2 },
    { t: 27.2, p: [-0.45, 1.35] },
    { t: 28.3, p: [0.08, 0.72, 0.25], hops: 1, hh: 0.5 },
  ], s);
  const singing = s > 13.4 && s < 25.4;
  const yawn = span(25.4, 25.9, s) * (1 - span(26.6, 27.1, s));
  const asleep = span(28.6, 29.6, s);
  const sis = c.bigSister({
    open: asleep > 0 ? mix(1, 0.08, asleep) : yawn > 0.1 ? 0.15 : blink(0.9, 3.4, s),
    happy: singing && Math.sin(s * 1.1) > 0,
    mouth: singing ? 1.6 + Math.sin(s * 6) * 0.6 : yawn > 0 ? 1 + yawn * 2.4 : 1,
    blush: singing ? 0.8 : 0.5,
    squash: go.squash + (asleep >= 1 ? Math.sin(s * 1.6 + 1) * 0.025 : 0) - yawn * 0.1,
  });
  let ry;
  if (go.moving && s < 9.2) ry = go.dir;
  else if (s < 9.2) ry = faceTo(go.x, go.z, BABY.x, BABY.z);
  else if (s < 11.4) ry = Math.PI / 2 - 0.2;
  else if (s < 27.2) ry = faceTo(go.x, go.z, BABY.x, BABY.z) * 0.7;
  else ry = 0.25;
  place(sis, { x: go.x, y: go.y, z: go.z }, ry, scene);
  sis.group.rotation.z = singing ? Math.sin(s * 2.2) * 0.12 : -0.2 * asleep;

  /* the song: notes drift up from the big sister while she sings */
  const NOTE_C = [kit.PALETTE.pink, "#ffcf4a", "#c9b2ec"];
  for (let k = 0; k < 15; k++) {
    const born = 13.8 + k * 0.78, e = s - born;
    if (e <= 0 || e > 3.4 || born > 25) continue;
    const n = c.note({ color: NOTE_C[k % 3], size: 0.28 * springAt(e, 0, 1, { stiffness: 300, damping: 12 }) * (1 - easeOut(span(2.7, 3.4, e))) + 0.0001 });
    n.position.set(go.x + 0.1 + e * 0.32 + Math.sin(e * 2.4 + k) * 0.15, 0.85 + e * 0.42, go.z - 0.2 - e * 0.15);
    n.rotation.z = Math.sin(e * 3 + k) * 0.3;
    scene.add(n);
  }
  /* the night light's stars, turning slowly on the back wall */
  const proj = springAt(s - 13.4, 0, 1, { stiffness: 120, damping: 14 });
  if (proj > 0.001) for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + s * 0.06, r = 1.4 + (i % 3) * 0.7;
    const st = kit.star((0.06 + (i % 2) * 0.035) * proj, i % 3 ? "#fff1c4" : "#ffd6e2");
    st.position.set(-0.6 + Math.cos(a) * r * 1.5, 3.0 + Math.sin(a) * r * 0.55, -2.52);
    st.scale.z = 0.02 * proj;
    scene.add(st);
  }

  /* Mom and Dad peek in at the door */
  let parents = {};
  const peekIn = springAt(s - 30, 0, 1, { stiffness: 140, damping: 15 }) * (1 - easeInOut(span(36, 37.6, s)));
  if (peekIn > 0.002) {
    const momB = c.mom({ happy: true, blush: 0.8, mouth: talk(s, 32.6, 35.2, 1.4, 0.6) });
    place(momB, { x: mix(-5, -3.72, peekIn), z: -0.1 }, Math.PI / 2 - 0.25, scene);
    momB.group.rotation.z = -0.2 * peekIn;
    const dadB = c.dad({ happy: true, blush: 0.9 });
    place(dadB, { x: mix(-5.2, -3.95, peekIn), z: 0.62 }, Math.PI / 2 - 0.35, scene);
    dadB.group.rotation.z = -0.12 * peekIn;
    hearts(world, s, 32, [-3.4, 1.6, 0.3], { n: 3, size: 0.09 });
    parents = { mom: momB, dad: dadB };
  }

  hearts(world, s, 30.5, [0.4, 0.95, 0.8], { n: 3, size: 0.08 });

  camera(world, [
    { t: 0, p: [0.6, 2.4, 7.4], l: [0.1, 0.6, 0.6] },
    { t: 6, p: [-0.3, 2.3, 7.2], l: [-0.6, 0.5, 0.8] },
    { t: 12.5, p: [0.2, 2.0, 6.2], l: [0.0, 0.5, 0.8] },
    { t: 14.5, p: [0.2, 1.6, 5.2], l: [0.1, 0.65, 0.9] },
    { t: 25, p: [0.3, 1.35, 4.5], l: [0.2, 0.65, 0.85] },
    { t: 29.5, p: [-0.8, 2.2, 7.6], l: [-1.4, 0.9, 0.4] },
    { t: 35.6, p: [-0.8, 2.2, 7.6], l: [-1.4, 0.9, 0.4] },
    { t: 38, p: [0.38, 1.45, 4.4], l: [0.38, 0.55, 0.7] },
    { t: 44, p: [0.38, 2.5, 3.5], l: [0.38, 0.4, 0.7] },
  ], s);
  return { sis, baby, ...parents };
}
