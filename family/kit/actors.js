/*
 * seekreel actors — a small cast of low-poly characters, props and sets.
 *
 *   import * as THREE from "./vendor/three.module.js";
 *   import { createKit } from "./actors.js";
 *   const kit = createKit(THREE);
 *   scene.add(kit.blob({ color: "#ffd27a" }).group);
 *
 * Every builder is a pure function of its options: nothing here reads a clock,
 * calls Math.random or keeps state between calls. A stage computes the pose
 * for its timestamp (a hop height, a blink, a squash) and passes the numbers
 * in, which is what keeps a seekreel frame the same picture on every render.
 *
 * Everything uses toon shading with three soft steps, so the cast reads as
 * drawn rather than rendered. Sizes are in world units; a standing blob is
 * about 1.2 tall.
 */

export const PALETTE = {
  butter: "#ffd27a",
  rose: "#f7a3b4",
  blush: "#ff8fa3",
  peach: "#ffe0c8",
  caramel: "#e2a96c",
  plum: "#2b1a2e",
  cream: "#fff6ee",
  sand: "#f6d8a8",
  grass: "#a8d8a0",
  leaf: "#7fc38b",
  sea: "#a8c4ee",
  navy: "#27304f",
  brown: "#7a4e33",
  gold: "#d8b25a",
  pink: "#e0607e",
  sky: "#4f8fe0",
};

export function createKit(THREE) {
  const TAU = Math.PI * 2;

  /* toon shading: three soft steps */
  const steps = new Uint8Array([90, 170, 255]);
  const gradient = new THREE.DataTexture(steps, 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });

  function add(mesh, parent, shadow = true) {
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /* A seeded random, for layouts that must land in the same place every frame. */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // ---------------------------------------------------------------------------
  // shapes
  // ---------------------------------------------------------------------------
  let heartGeo = null;
  function heart(size = 0.2, color = PALETTE.pink, opacity = 1) {
    if (!heartGeo) {
      const s = new THREE.Shape();
      s.moveTo(0, -1);
      s.bezierCurveTo(-0.6, -0.5, -1.0, -0.1, -1.0, 0.35);
      s.bezierCurveTo(-1.0, 0.8, -0.6, 1.0, -0.33, 1.0);
      s.bezierCurveTo(-0.12, 1.0, 0, 0.85, 0, 0.7);
      s.bezierCurveTo(0, 0.85, 0.12, 1.0, 0.33, 1.0);
      s.bezierCurveTo(0.6, 1.0, 1.0, 0.8, 1.0, 0.35);
      s.bezierCurveTo(1.0, -0.1, 0.6, -0.5, 0, -1);
      heartGeo = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 10 });
      heartGeo.center();
    }
    const m = new THREE.Mesh(heartGeo, toon(color, { transparent: opacity < 1, opacity }));
    m.scale.setScalar(size);
    return m;
  }

  function star(size = 0.3, color = "#ffcf4a") {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.45 : 1, a = (i / 10) * TAU + Math.PI / 2;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 });
    geo.center();
    const m = new THREE.Mesh(geo, toon(color));
    m.scale.setScalar(size);
    return m;
  }

  // ---------------------------------------------------------------------------
  // characters
  // ---------------------------------------------------------------------------
  /*
   * The blob: a squashy body with a face.
   *   squash  0 = rest, positive = squat, negative = stretch
   *   open    eyelids, 1 = open, ~0.1 = blink
   *   eyes    eye size, 1 = normal, 1.7 = surprised
   *   happy   true draws ^ ^ eyes
   *   mouth   1 = small smile, 2+ = open (talking, laughing, chewing)
   *   blush   0.35 = a hint, 1 = beetroot
   * Returns { group, body, face, top, sxz } — accessories attach to body or face.
   */
  function blob({
    color = PALETTE.butter, cheek = PALETTE.blush, squash = 0, open = 1, eyes = 1,
    happy = false, mouth = 1, blush = 0.35, tilt = 0,
  } = {}) {
    const group = new THREE.Group();
    group.rotation.z = tilt;
    const sy = Math.max(0.6, 1 - squash);
    const sxz = 1 / Math.sqrt(sy);
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 22), toon(color)), group);
    body.scale.set(sxz, 1.12 * sy, sxz);
    body.position.y = 0.55 * 1.12 * sy;

    const face = new THREE.Group();
    face.position.y = body.position.y + 0.08 * sy;
    group.add(face);
    const ink = toon(PALETTE.plum);
    for (const side of [-1, 1]) {
      if (happy) {
        const arc = add(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 6, 12, Math.PI), ink), face, false);
        arc.position.set(side * 0.19 * sxz, 0.06, 0.5 * sxz);
      } else {
        const eye = add(new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), ink), face, false);
        eye.position.set(side * 0.19 * sxz, 0.05, 0.5 * sxz);
        eye.scale.set(eyes, 1.25 * open * eyes, 0.6);
        if (open > 0.5) {
          const glint = add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })), face, false);
          glint.position.set(side * 0.19 * sxz + 0.02, 0.1, 0.54 * sxz);
        }
      }
      const b = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), toon(cheek, { transparent: true, opacity: 0.85 })), face, false);
      b.position.set(side * 0.3 * sxz, -0.07, 0.43 * sxz);
      b.scale.set(1.2 * (0.6 + blush * 0.6), 0.6 * (0.6 + blush * 0.6), 0.5);
    }
    const m = add(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 6, 14, Math.PI), ink), face, false);
    m.rotation.z = Math.PI;
    m.position.set(0, -0.08, 0.53 * sxz);
    m.scale.set(1, mouth, 1);

    return { group, body, face, sxz, top: body.position.y * 2 };
  }

  /* accessories — each takes the object blob() returned */
  function cap(b, color = PALETTE.navy) {
    const mat = toon(color);
    const shell = add(new THREE.Mesh(new THREE.SphereGeometry(0.575, 28, 10, 0, TAU, 0, 1.05), mat), b.body);
    shell.rotation.x = -0.18;
    const brim = add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 24, 1, false, -Math.PI / 2, Math.PI), toon("#1c2340")), b.body);
    brim.position.set(0, 0.33, 0.44);
    brim.rotation.x = -0.12;
    const button = add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat), b.body);
    button.position.y = 0.575;
    return b;
  }

  function glasses(b, color = "#1d1b22") {
    const frame = toon(color);
    for (const side of [-1, 1]) {
      const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 26), frame), b.face, false);
      ring.position.set(side * 0.19 * b.sxz, 0.05, 0.535 * b.sxz);
      const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.3), frame), b.face, false);
      arm.position.set(side * 0.29 * b.sxz, 0.07, 0.4 * b.sxz);
      arm.rotation.y = side * 0.5;
    }
    const bridge = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), frame), b.face, false);
    bridge.position.set(0, 0.08, 0.56 * b.sxz);
    return b;
  }

  function hairBun(b, color = PALETTE.brown, tie = PALETTE.pink) {
    const hair = toon(color);
    const shell = add(new THREE.Mesh(new THREE.SphereGeometry(0.58, 28, 12, 0, TAU, 0, 1.2), hair), b.body);
    shell.rotation.x = -0.55;
    const bun = add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), hair), b.body);
    bun.position.set(0, 0.5, -0.3);
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 16), toon(tie)), b.body);
    band.position.set(0, 0.42, -0.24);
    band.rotation.x = 1.0;
    return b;
  }

  function bow(b, color = PALETTE.pink) {
    const g = new THREE.Group();
    g.position.set(0.22, b.top - 0.06, 0.1);
    g.rotation.z = -0.35;
    b.group.add(g);
    for (const side of [-1, 1]) {
      const wing = add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 10), toon(color)), g);
      wing.rotation.z = side * Math.PI / 2;
      wing.position.x = side * 0.1;
    }
    add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon("#c94466")), g);
    return b;
  }

  function sprout(b, sway = 0) {
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 6), toon("#5e9e5b")), b.group);
    stem.position.set(0, b.top + 0.07, 0);
    for (const side of [-1, 1]) {
      const leaf = add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), toon(PALETTE.leaf)), b.group);
      leaf.scale.set(1.5, 0.45, 0.8);
      leaf.position.set(side * 0.1, b.top + 0.17, 0);
      leaf.rotation.z = side * -0.5 + sway;
    }
    return b;
  }

  /* for a baby-sized blob (scale its group to ~0.5) */
  function curl(b, color = "#8a5a3c") {
    const c = add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 16, Math.PI * 1.5), toon(color)), b.body);
    c.position.set(0.02, 0.6, 0.05);
    c.rotation.set(0, Math.PI / 2, 0.4);
    return b;
  }

  function pacifier(b, color = "#9a7fd6") {
    const g = new THREE.Group();
    g.position.set(0, -0.09, 0.55 * b.sxz);
    b.face.add(g);
    const shield = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 20), toon("#ffffff")), g, false);
    shield.rotation.x = Math.PI / 2;
    shield.scale.set(1.25, 1, 0.8);
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 18), toon(color)), g, false);
    ring.position.set(0, -0.02, 0.05);
    return b;
  }

  function medal(b, { ribbons = ["#6fa8e8", PALETTE.pink] } = {}) {
    const g = new THREE.Group();
    g.position.set(0, 0.36, 0.58);
    b.group.add(g);
    const disk = add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), toon("#ffcf4a")), g);
    disk.rotation.x = Math.PI / 2;
    const s = star(0.07, "#fff1c4"); s.position.z = 0.03; g.add(s);
    [-1, 1].forEach((side, i) => {
      const rib = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.02), toon(ribbons[i])), g);
      rib.position.set(side * 0.06, 0.14, -0.02);
      rib.rotation.z = side * -0.35;
    });
    return g;
  }

  /* The dog: floppy ears, a wagging tail (pass `wag` and `ears` in radians). */
  function dog({ color = PALETTE.caramel, ear = "#b97a45", wag = 0, ears = 0.35, open = 1 } = {}) {
    const group = new THREE.Group();
    const body = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), toon(color)), group);
    body.scale.set(0.95, 0.8, 1.25);
    body.position.y = 0.26;
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), toon("#e8b57c")), group);
    head.position.set(0, 0.52, 0.26);
    const snout = add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), toon("#fbe3c4")), head);
    snout.scale.set(1.2, 0.8, 1); snout.position.set(0, -0.06, 0.2);
    const nose = add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), toon(PALETTE.plum)), head, false);
    nose.position.set(0, -0.02, 0.3);
    for (const side of [-1, 1]) {
      const e = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), toon(ear)), head);
      e.scale.set(0.6, 1.3, 0.5);
      e.position.set(side * 0.21, -0.02, -0.02);
      e.rotation.z = side * ears;
      const eye = add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), toon(PALETTE.plum)), head, false);
      eye.position.set(side * 0.09, 0.06, 0.2);
      eye.scale.set(1, 1.2 * open, 0.6);
    }
    const tail = add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 8), toon(ear)), group);
    tail.position.set(0, 0.42, -0.36);
    tail.rotation.set(-0.7, 0, wag);
    return { group, top: 0.8, mouth: new THREE.Vector3(0, 0.4, 0.55) };
  }

  // ---------------------------------------------------------------------------
  // props
  // ---------------------------------------------------------------------------
  const fryMat = toon("#ffd36b");
  function fry() {
    return new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.05), fryMat);
  }

  function fryBox({ fries = 5, seed = 3 } = {}) {
    const group = new THREE.Group();
    const box = add(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.36, 4, 1), toon("#e8574f")), group);
    box.rotation.y = Math.PI / 4; box.position.y = 0.2;
    const h = heart(0.07, "#fff1e2");
    h.position.set(0, 0.2, 0.2); h.rotation.x = -0.18; group.add(h);
    const r = rng(seed);
    for (let i = 0; i < 5; i++) {
      const f = add(fry(), group);
      f.position.set((r() - 0.5) * 0.2, 0.44, (r() - 0.5) * 0.14);
      f.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
      f.visible = i < fries;
    }
    return group;
  }

  function melonSlice(size = 1) {
    const g = new THREE.Group();
    const tri = new THREE.Shape([new THREE.Vector2(-0.22, 0), new THREE.Vector2(0.22, 0), new THREE.Vector2(0, 0.34)]);
    const flesh = add(new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.08, bevelEnabled: false }), toon("#f06a6a")), g);
    flesh.position.z = -0.04;
    const rind = add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.1), toon("#4f9a5a")), g);
    rind.position.y = -0.03;
    g.scale.setScalar(size);
    return g;
  }

  function melonHalf({ seed = 31 } = {}) {
    const g = new THREE.Group();
    const rind = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), toon("#4f9a5a")), g);
    rind.position.y = 0.3;
    const face = add(new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), toon("#f06a6a")), g);
    face.rotation.x = -Math.PI / 2; face.position.y = 0.305;
    const r = rng(seed);
    for (let i = 0; i < 7; i++) {
      const s = add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), toon(PALETTE.plum)), g, false);
      const a = r() * TAU, d = 0.06 + r() * 0.16;
      s.position.set(Math.cos(a) * d, 0.31, Math.sin(a) * d);
      s.scale.set(1, 0.4, 1.6);
    }
    return g;
  }

  function takeaway({ seed = 21 } = {}) {
    const g = new THREE.Group();
    const bowl = add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.22, 20), toon(PALETTE.cream)), g);
    bowl.position.y = 0.11;
    const band = add(new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.24, 0.06, 20), toon("#e8574f")), g);
    band.position.y = 0.15;
    const rice = add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 8, 0, TAU, 0, Math.PI / 2), toon("#ffffff")), g);
    rice.position.y = 0.2; rice.scale.y = 0.45;
    const r = rng(seed);
    for (let i = 0; i < 5; i++) {
      const c = add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), toon("#c98a4b")), g);
      c.position.set((r() - 0.5) * 0.25, 0.3, (r() - 0.5) * 0.25);
      c.rotation.y = r() * 3;
    }
    for (const x of [-0.03, 0.03]) {
      const stick = add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), toon("#d9b48a")), g);
      stick.position.set(0.12 + x, 0.36, 0);
      stick.rotation.z = -0.6;
    }
    return g;
  }

  function blanket({ width = 2.8, depth = 1.7, base = "#fff1e2", stripe = "#f39aa9", stripes = 4 } = {}) {
    const g = new THREE.Group();
    const b = add(new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), toon(base)), g, false);
    b.position.y = 0.03;
    const gap = width / stripes;
    for (let i = 0; i < stripes; i++) {
      const s = add(new THREE.Mesh(new THREE.BoxGeometry(gap * 0.35, 0.045, depth), toon(stripe)), g, false);
      s.position.set(-width / 2 + gap * (i + 0.3), 0.035, 0);
    }
    return g;
  }

  /* lid: 0 = closed, 1 = flown off */
  function giftBox({ color = PALETTE.rose, ribbon = "#ffe3a3", lid = 0 } = {}) {
    const g = new THREE.Group();
    const box = add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), toon(color)), g);
    box.position.y = 0.3;
    const rib = add(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.14), toon(ribbon)), g);
    rib.position.y = 0.3;
    const top = add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.9), toon("#fbc4d3")), g);
    top.position.set(lid * 0.9, 0.68 + lid * 0.9, 0);
    top.rotation.z = -lid * 1.2;
    return g;
  }

  function podium({ color = PALETTE.cream, band = "#ffcf4a" } = {}) {
    const g = new THREE.Group();
    const top = add(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.9, 20), toon(color)), g);
    top.position.y = 0.45;
    const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.805, 0.805, 0.16, 20), toon(band)), g);
    b.position.y = 0.6;
    return g;
  }

  function bench({ color = "#ec9fb4", legs = "#a8704c" } = {}) {
    const g = new THREE.Group();
    const seat = add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.7), toon(color)), g);
    seat.position.y = 0.42;
    const back = add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.1), toon(color)), g);
    back.position.set(0, 0.8, -0.32);
    for (const x of [-1, 1]) {
      const leg = add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.6), toon(legs)), g);
      leg.position.set(x * 1.0, 0.21, 0);
    }
    return g;
  }

  function flower(color = PALETTE.rose) {
    const g = new THREE.Group();
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), toon("#5e9e5b")), g, false);
    stem.position.y = 0.15;
    const head = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), toon(color)), g);
    head.position.y = 0.34; head.scale.set(1.2, 0.7, 1.2);
    const mid = add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), toon("#ffcf4a")), g, false);
    mid.position.y = 0.4;
    return g;
  }

  function cloud({ seed = 5, color = "#fff6ee" } = {}) {
    const g = new THREE.Group();
    const r = rng(seed);
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.8 + r() * 0.5, 14, 10), toon(color));
      puff.position.set(i * 0.9 - 1.3, r() * 0.35, r() * 0.4);
      g.add(puff);
    }
    return g;
  }

  /* A little plane, nose along +z. `faces` fill the windows. */
  function plane({ body = PALETTE.cream, wings = PALETTE.rose, fin = PALETTE.pink, faces = [PALETTE.butter, PALETTE.rose, PALETTE.peach] } = {}) {
    const g = new THREE.Group();
    const hull = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.7, 6, 18), toon(body)), g);
    hull.rotation.x = Math.PI / 2;
    const wing = add(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 0.55), toon(wings)), g);
    wing.position.set(0, -0.05, 0.1);
    const f = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.42), toon(fin)), g);
    f.position.set(0, 0.42, -0.95);
    const tail = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.3), toon(wings)), g);
    tail.position.set(0, 0.1, -0.95);
    faces.forEach((c, i) => {
      for (const side of [-1, 1]) {
        const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), toon(c)), g, false);
        w.rotation.z = Math.PI / 2;
        w.position.set(side * 0.34, 0.1, 0.45 - i * 0.35);
      }
    });
    return g;
  }

  // ---------------------------------------------------------------------------
  // sets
  // ---------------------------------------------------------------------------
  function sea({ color = PALETTE.sea, ripple = 0 } = {}) {
    const g = new THREE.Group();
    const water = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshBasicMaterial({ color }));
    water.rotation.x = -Math.PI / 2; water.position.y = -0.85;
    g.add(water);
    /* ripple: 0..1, how far the rings have travelled — drive it from time */
    for (let i = 0; i < 3; i++) {
      const phase = (ripple + i / 3) % 1;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(5.6 + phase * 5, 5.75 + phase * 5, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 * (1 - phase) }),
      );
      ring.rotation.x = -Math.PI / 2; ring.position.y = -0.83;
      g.add(ring);
    }
    return g;
  }

  function island({ radius = 5, sand = PALETTE.sand, grass = PALETTE.grass } = {}) {
    const g = new THREE.Group();
    add(new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.08, radius * 0.92, 1.2, 14), toon(sand)), g).position.y = -0.62;
    if (grass) add(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.98, radius, 0.16, 14), toon(grass)), g).position.y = -0.06;
    return g;
  }

  function palm({ sway = 0 } = {}) {
    const g = new THREE.Group();
    const trunk = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.7, 8), toon("#c99468")), g);
    trunk.position.set(0.2 + sway * 2, 1.35, 0);
    trunk.rotation.z = -0.12 - sway;
    trunk.receiveShadow = false;
    for (let i = 0; i < 3; i++) {
      const coco = add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), toon("#8a5a3c")), g);
      coco.position.set(0.32 + sway * 5 + (i - 1) * 0.16, 2.55, 0.12 + (i % 2) * 0.1);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const leaf = add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), toon(i % 2 ? PALETTE.leaf : "#95d19b")), g);
      leaf.scale.set(1.6, 0.22, 0.55);
      leaf.position.set(0.3 + sway * 5 + Math.cos(a) * 0.7, 2.73, Math.sin(a) * 0.7);
      leaf.rotation.y = -a;
      leaf.rotation.z = -0.35;
    }
    return g;
  }

  function cottage({ walls = PALETTE.cream, roof = "#e8746f", glass = "#bfe0f5" } = {}) {
    const g = new THREE.Group();
    add(new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.4, 1.7), toon(walls)), g).position.y = 0.7;
    const r = add(new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.0, 4), toon(roof)), g);
    r.position.y = 1.9; r.rotation.y = Math.PI / 4;
    add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.8, 0.06), toon("#a0664a")), g).position.set(0, 0.4, 0.86);
    for (const x of [-0.62, 0.62]) add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.06), toon(glass)), g).position.set(x, 0.85, 0.86);
    return g;
  }

  /* A city block: `floors` storeys; `built` 0..floors raises them one at a time. */
  function building({ floors = 3, built = floors, facade = "#f6d86b", ground = "#f2c94c", glass = "#b8d4ec" } = {}) {
    const g = new THREE.Group();
    const FLOOR = 0.78;
    for (let f = 0; f < floors; f++) {
      const k = Math.min(1, Math.max(0, built - f));
      if (k <= 0) continue;
      const storey = new THREE.Group();
      storey.position.y = f * FLOOR + (1 - k) * 1.2;
      storey.scale.setScalar(Math.max(0.0001, k));
      g.add(storey);
      add(new THREE.Mesh(new THREE.BoxGeometry(2.3, FLOOR, 1.6), toon(f === 0 ? ground : facade)), storey).position.y = FLOOR / 2;
      for (let w = 0; w < 4; w++) {
        if (f === 0 && w === 1) continue;
        const win = add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.05), toon(glass)), storey);
        win.position.set(-0.8 + w * 0.53, FLOOR / 2 + 0.04, 0.81);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.1), toon("#fff1e2")), win, false).position.set(0, -0.22, 0.02);
      }
      if (f === 0) {
        add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.06), toon("#8a5a3c")), storey).position.set(-0.27, 0.31, 0.82);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.34), toon("#4f9a5a")), storey).position.set(0.8, 0.74, 0.92);
      }
    }
    if (built >= floors) add(new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.14, 1.75), toon("#fff1e2")), g).position.y = floors * FLOOR + 0.07;
    return g;
  }

  let stripeTex = null;
  function umbrella({ tilt = 0, colors = [PALETTE.sky, "#ffffff"] } = {}) {
    if (!stripeTex) {
      const c = document.createElement("canvas"); c.width = 256; c.height = 4;
      const x = c.getContext("2d");
      for (let i = 0; i < 8; i++) { x.fillStyle = colors[i % 2]; x.fillRect(i * 32, 0, 32, 4); }
      stripeTex = new THREE.CanvasTexture(c); stripeTex.colorSpace = THREE.SRGBColorSpace;
    }
    const g = new THREE.Group(); g.rotation.z = tilt;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), toon(PALETTE.cream)), g).position.y = 0.75;
    const top = add(new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.38, 16, 1, true), toon("#ffffff", { map: stripeTex, side: THREE.DoubleSide })), g);
    top.position.y = 1.55;
    return g;
  }

  /* A sandy beach island with umbrellas, loungers, mountains and a town behind. */
  function beach({ seed = 12 } = {}) {
    const g = island({ radius: 4.3, grass: null });
    [[-1.6, -0.4, 0.05], [1.5, -0.5, -0.06], [-3.0, 0.5, 0.03], [3.0, 0.7, -0.04], [0.0, -1.9, 0.02], [-1.9, -2.3, 0], [2.1, -2.4, 0]]
      .forEach(([x, z, t]) => { const u = umbrella({ tilt: t }); u.position.set(x, 0, z); g.add(u); });
    for (const [x, z] of [[-1.6, 0.3], [1.5, 0.2], [0.0, -1.2]]) {
      add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 1.0), toon(PALETTE.sky)), g).position.set(x, 0.12, z);
    }
    const r = rng(seed);
    for (let i = 0; i < 5; i++) {
      const m = add(new THREE.Mesh(new THREE.ConeGeometry(2.4 + r() * 1.4, 2.8 + r() * 1.8, 7), toon(i % 2 ? "#8dbf8a" : "#79aa7c")), g);
      m.position.set(-8 + i * 4 + r(), 1.2, -7.5 - r() * 2);
    }
    for (let i = 0; i < 14; i++) {
      const h = add(new THREE.Mesh(new THREE.BoxGeometry(0.4 + r() * 0.3, 0.4 + r() * 0.5, 0.4), toon(i % 3 ? "#fff1e2" : "#f6d86b")), g);
      h.position.set(-6 + i * 0.9, 0.2, -5.6 - r() * 0.8);
    }
    return g;
  }

  /*
   * A gallery wall. `pieces` is a list of { texture?, title, line, x, y, h }:
   * a texture hangs in a gold frame, no texture hangs an empty frame with a
   * heart ("coming soon"). Plaques are drawn with `font` (load it first).
   */
  function gallery({ pieces = [], wall = "#f8d5de", floor = "#e9cfae", font = "system-ui", length = 30 } = {}) {
    const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.PlaneGeometry(length, 7), toon(wall));
    w.position.set(length / 2 - 10, 3.5, 0); g.add(w);
    const skirting = new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, 0.04), toon(PALETTE.cream));
    skirting.position.set(length / 2 - 10, 0.07, 0.02); g.add(skirting);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(length, 12), toon(floor));
    f.rotation.x = -Math.PI / 2; f.position.set(length / 2 - 10, 0, 5); g.add(f);
    for (let i = 0; i < 16; i++) {
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(length, 0.015), new THREE.MeshBasicMaterial({ color: 0xd6b894 }));
      seam.rotation.x = -Math.PI / 2; seam.position.set(length / 2 - 10, 0.002, 0.4 + i * 0.7); g.add(seam);
    }
    for (const p of pieces) {
      const h = p.h ?? 0.9;
      const aspect = p.texture ? p.texture.image.width / p.texture.image.height : 0.8;
      const pw = h * aspect;
      const piece = new THREE.Group(); piece.position.set(p.x ?? 0, p.y ?? 1.8, 0); g.add(piece);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.26, h + 0.26, 0.06), toon(PALETTE.gold));
      frame.position.z = 0.03; piece.add(frame);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.14, h + 0.14), toon("#fffdf8"));
      mat.position.z = 0.061; piece.add(mat);
      if (p.texture) {
        p.texture.colorSpace = THREE.SRGBColorSpace;
        const art = new THREE.Mesh(new THREE.PlaneGeometry(pw, h), new THREE.MeshBasicMaterial({ map: p.texture }));
        art.position.z = 0.062; piece.add(art);
      } else {
        const blank = new THREE.Mesh(new THREE.PlaneGeometry(pw, h), toon("#ffe6ee"));
        blank.position.z = 0.062; piece.add(blank);
        const hh = heart(0.2 * (p.beat ?? 1), PALETTE.pink);
        hh.position.z = 0.12; piece.add(hh);
      }
      if (p.title) {
        const c = document.createElement("canvas"); c.width = 768; c.height = 232;
        const x = c.getContext("2d");
        x.fillStyle = "#fffdf8"; x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = "#3a1f3d"; x.font = `750 62px ${font}`; x.fillText(p.title, 54, 98);
        x.fillStyle = "#6b4a6e"; x.font = `520 42px ${font}`; x.fillText(p.line || "", 54, 180);
        const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.26), new THREE.MeshBasicMaterial({ map: tex }));
        plaque.position.set(0, -h / 2 - 0.3, 0.01); piece.add(plaque);
      }
    }
    return g;
  }

  /* Placeholder art for a gallery, painted from a seed: soft shapes on a wash. */
  function placeholderArt(seed = 1, { width = 600, height = 750 } = {}) {
    const r = rng(seed);
    const c = document.createElement("canvas"); c.width = width; c.height = height;
    const x = c.getContext("2d");
    const hues = [PALETTE.rose, PALETTE.butter, PALETTE.sea, PALETTE.leaf, PALETTE.pink, PALETTE.peach, "#b6a4e6"];
    const pick = () => hues[Math.floor(r() * hues.length)];
    const bg = x.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, pick()); bg.addColorStop(1, pick());
    x.fillStyle = bg; x.fillRect(0, 0, width, height);
    for (let i = 0; i < 5; i++) {
      x.fillStyle = pick(); x.globalAlpha = 0.85;
      x.beginPath();
      x.arc(r() * width, r() * height, 60 + r() * 160, 0, TAU);
      x.fill();
    }
    x.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  return {
    THREE, PALETTE, toon, add, rng,
    heart, star,
    blob, cap, glasses, hairBun, bow, sprout, curl, pacifier, medal, dog,
    fry, fryBox, melonSlice, melonHalf, takeaway, blanket, giftBox, podium, bench, flower, cloud, plane,
    sea, island, palm, cottage, building, umbrella, beach, gallery, placeholderArt,
  };
}
