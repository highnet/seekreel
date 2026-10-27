/*
 * The big-sister film: the cast and the props the family pack did not have.
 *
 *   const c = createCast(world);
 *   land.add(c.bigSister({ happy: true }).group);
 *
 * Like kit/actors.js, every builder is a pure function of its options: the
 * sets compute the pose for their moment and pass the numbers in.
 */

/* two pinks for the sisters (the little one lighter), the grown-ups around them */
export const COLORS = {
  big: "#f49ab0",
  little: "#ffd0dc",
  mom: "#c9b2ec",
  dad: "#ffd27a",
  grandma: "#ffe0c8",
};
/* a 1-year-old and a newborn next to grown-ups (an adult blob is ~1.2 tall) */
export const SIZE = { big: 0.62, little: 0.42, grandma: 0.92 };

export function createCast(world) {
  const { THREE, kit } = world;
  const { toon, add, PALETTE } = kit;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------------------
  // the family
  // ---------------------------------------------------------------------------
  const scaled = (b, s) => { b.group.scale.setScalar(s); return b; };

  /* the big sister (one year old), with a bow */
  function bigSister(o = {}) {
    return scaled(kit.bow(kit.blob({ color: COLORS.big, cheek: "#ff6f8e", ...o }), PALETTE.pink), SIZE.big);
  }

  /* the little sister (a newborn): a curl and, unless it fell out, her pacifier */
  function littleSister({ paci = true, ...o } = {}) {
    let b = kit.curl(kit.blob({ color: COLORS.little, cheek: "#ff9fb4", ...o }), "#9a6a4c");
    if (paci) b = kit.pacifier(b, "#c48ad6");
    return scaled(b, SIZE.little);
  }

  /* Mom; belly 0..1 is the baby on the way, kick a little wobble from inside */
  function mom({ belly = 0, kick = 0, ...o } = {}) {
    const b = kit.hairBun(kit.blob({ color: COLORS.mom, cheek: "#ff8fb0", ...o }), "#5a3828", PALETTE.pink);
    if (belly > 0) {
      const bump = add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 16), toon("#d8c6f4")), b.group);
      const k = belly * (1 + kick * 0.1);
      bump.scale.set(k, k * (1 - kick * 0.04), k);
      bump.position.set(0, 0.22 * b.body.scale.y / 1.12, 0.37 + 0.04 * belly + kick * 0.02);
      const h = kit.heart(0.055 * (1 + kick * 0.6), PALETTE.pink);
      h.position.set(0, 0.04, 0.33); bump.add(h);
    }
    return b;
  }

  function dad(o = {}) {
    return kit.glasses(kit.cap(kit.blob({ color: COLORS.dad, ...o })));
  }

  /* Grandma: silver bun, glasses, a little shorter */
  function grandma(o = {}) {
    return scaled(kit.glasses(kit.hairBun(kit.blob({ color: COLORS.grandma, cheek: "#ff9a9a", ...o }), "#d8d0d6", "#9a7fd6"), "#7a5a6e"), SIZE.grandma);
  }

  // ---------------------------------------------------------------------------
  // props
  // ---------------------------------------------------------------------------
  /* A pram, long side along x, handle at -x. The baby sits at seat(). */
  function pram({ color = PALETTE.rose, trim = PALETTE.cream } = {}) {
    const g = new THREE.Group();
    const tub = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 6, 18), toon(color)), g);
    tub.rotation.z = Math.PI / 2; tub.scale.set(0.85, 1, 0.95); tub.position.y = 0.6;
    const rim = add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 30), toon(trim)), g);
    rim.rotation.x = Math.PI / 2; rim.scale.set(1.75, 1, 1); rim.position.y = 0.8;
    const hood = add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 10, 0, Math.PI, 0, Math.PI / 2), toon(PALETTE.pink, { side: THREE.DoubleSide })), g);
    hood.rotation.set(0, -Math.PI / 2, 0); hood.position.set(-0.32, 0.78, 0); hood.scale.set(1, 0.9, 1);
    for (const x of [-0.42, 0.42]) for (const z of [-0.26, 0.26]) {
      const w = add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), toon("#6b4a6e")), g);
      w.rotation.x = Math.PI / 2; w.position.set(x, 0.13, z);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), toon(trim)), w);
    }
    const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 6), toon("#d8c7d6")), g);
    bar.position.set(-0.72, 0.9, 0); bar.rotation.z = 0.7;
    const grip = add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), toon(PALETTE.plum)), g);
    grip.position.set(-0.96, 1.18, 0); grip.rotation.x = Math.PI / 2;
    return { group: g, seat: new THREE.Vector3(0.05, 0.64, 0.02), top: 1.2 };
  }

  /* A loose pacifier, for when it falls out */
  function pacifier({ color = "#c48ad6" } = {}) {
    const g = new THREE.Group();
    const shield = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.035, 20), toon("#ffffff")), g);
    shield.rotation.x = Math.PI / 2; shield.scale.set(1.25, 1, 0.8);
    const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 8, 18), toon(color)), g);
    ring.position.set(0, -0.02, 0.05);
    const nub = add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon("#fff1c4")), g);
    nub.position.z = -0.05; nub.scale.z = 1.4;
    g.scale.setScalar(SIZE.little * 1.6);
    return g;
  }

  /* A toy box whose lid swings open on a hinge at the back; open 0..1 */
  function toyBox({ open = 0, color = "#9fd0f0", band = PALETTE.butter } = {}) {
    const g = new THREE.Group();
    add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.6), toon(color)), g).position.y = 0.275;
    add(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.62), toon(band)), g).position.y = 0.35;
    const h = kit.heart(0.08, PALETTE.pink); h.position.set(0, 0.2, 0.31); g.add(h);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.55, -0.3); hinge.rotation.x = -open * 1.9; g.add(hinge);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 0.64), toon("#fbc4d3")), hinge).position.set(0, 0.04, 0.32);
    return g;
  }

  /* A rattle: a handle and a striped ball */
  function rattle() {
    const g = new THREE.Group();
    const handle = add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 8), toon(PALETTE.butter)), g);
    handle.position.y = 0.16;
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), toon("#9fd0f0")), g);
    head.position.y = 0.4;
    const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 20), toon(PALETTE.pink)), g);
    band.position.y = 0.4; band.rotation.x = Math.PI / 2;
    const knob = add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(PALETTE.pink)), g);
    knob.position.y = 0.0;
    return g;
  }

  function ball({ color = PALETTE.butter, stripe = PALETTE.pink } = {}) {
    const g = new THREE.Group();
    add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), toon(color)), g).position.y = 0.16;
    const s = add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 24), toon(stripe)), g);
    s.position.y = 0.16; s.rotation.y = Math.PI / 2;
    return g;
  }

  /* A butterfly; flap 0..1 folds the wings */
  function butterfly({ flap = 0, color = "#b6a4e6", spot = PALETTE.butter } = {}) {
    const g = new THREE.Group();
    const body = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), toon(PALETTE.plum)), g, false);
    body.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.rotation.z = side * (0.25 + flap * 1.1);
      g.add(hinge);
      const up = add(new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), toon(color, { side: THREE.DoubleSide })), hinge, false);
      up.rotation.x = -Math.PI / 2; up.position.set(side * 0.12, 0, -0.03); up.scale.set(1, 1.2, 1);
      const low = add(new THREE.Mesh(new THREE.CircleGeometry(0.08, 14), toon(spot, { side: THREE.DoubleSide })), hinge, false);
      low.rotation.x = -Math.PI / 2; low.position.set(side * 0.08, 0.002, 0.09);
    }
    return g;
  }

  /* A music note, for the lullaby */
  function note({ color = PALETTE.pink, size = 0.3 } = {}) {
    const g = new THREE.Group();
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), toon(color)), g, false);
    head.scale.set(1.25, 0.9, 0.6); head.rotation.z = 0.4;
    const stem = add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.035), toon(color)), g, false);
    stem.position.set(0.12, 0.25, 0);
    const flag = add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.035), toon(color)), g, false);
    flag.position.set(0.2, 0.46, 0); flag.rotation.z = -0.6;
    g.scale.setScalar(size);
    return g;
  }

  /* A soft quilt draped over a little one; `open` 0..1 unfolds it */
  function quilt({ open = 1, color = "#ffc2d1", stripe = PALETTE.cream } = {}) {
    const g = new THREE.Group();
    const k = Math.max(0.001, open);
    const dome = add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 26, 12, 0, TAU, 0, Math.PI / 2), toon(color)), g);
    dome.scale.set(k, 0.62, 0.95);
    for (let i = -1; i <= 1; i++) {
      const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 6, 30, Math.PI), toon(stripe)), g, false);
      band.rotation.y = Math.PI / 2; band.position.x = i * 0.22 * k;
      band.scale.set(0.95 * Math.sqrt(1 - (i * 0.44) ** 2), 0.62 * Math.sqrt(1 - (i * 0.44) ** 2), 1);
    }
    return g;
  }

  function basket({ color = "#d9a066", cloth = "#f39aa9" } = {}) {
    const g = new THREE.Group();
    const b = add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.27, 0.3, 14), toon(color)), g);
    b.position.y = 0.15; b.scale.z = 0.75;
    const c = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), toon(cloth)), g);
    c.position.y = 0.31; c.rotation.y = 0.3;
    const h = add(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 20, Math.PI), toon("#b47e4a")), g);
    h.position.y = 0.3;
    return g;
  }

  /* A little bed on the floor: mattress, pillow, low frame */
  function bed({ frame = "#f3c6d3", sheet = PALETTE.cream } = {}) {
    const g = new THREE.Group();
    add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 1.05), toon(frame)), g).position.y = 0.08;
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.95), toon(sheet)), g).position.y = 0.2;
    const head = add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 0.1), toon(frame)), g);
    head.position.set(0, 0.35, -0.53);
    const pillow = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), toon("#fff")), g);
    pillow.scale.set(1.5, 0.3, 0.7); pillow.position.set(0, 0.3, -0.3);
    return { group: g, top: 0.25 };
  }

  /*
   * The nursery: a floor, two walls, a window, a rug, a shelf and a doorway on
   * the left wall. `night` 0..1 darkens the window and lights the lamp.
   * Returns { group, door } — door is where the grown-ups peek in.
   */
  function nursery({ night = 0 } = {}) {
    const g = new THREE.Group();
    const wallC = new THREE.Color("#fbe1e8").lerp(new THREE.Color("#8b78b8"), night * 0.55);
    const floorC = new THREE.Color("#f0d2b0").lerp(new THREE.Color("#8d7898"), night * 0.5);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), toon(wallC)); back.position.set(0, 3, -2.6); back.receiveShadow = true; g.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), toon(wallC.clone().multiplyScalar(0.94)));
    left.rotation.y = Math.PI / 2; left.position.set(-4.2, 3, 1.9); left.receiveShadow = true; g.add(left);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), toon(floorC)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 2.4); floor.receiveShadow = true; g.add(floor);
    for (let i = 0; i < 12; i++) {
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 10), new THREE.MeshBasicMaterial({ color: floorC.clone().multiplyScalar(0.85) }));
      seam.rotation.x = -Math.PI / 2; seam.position.set(-4 + i * 0.75, 0.002, 2.4); g.add(seam);
    }
    const skirting = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 0.05), toon(PALETTE.cream)); skirting.position.set(0, 0.08, -2.57); g.add(skirting);
    /* a wallpaper of tiny hearts */
    for (let i = 0; i < 26; i++) {
      const h = kit.heart(0.07, night > 0.5 ? "#c6b2e6" : "#f6b9c8");
      h.position.set(-5.5 + (i % 13) * 0.9 + (i > 12 ? 0.45 : 0), 2.3 + (i > 12 ? 0.9 : 0), -2.58); h.scale.z = 0.02; g.add(h);
    }
    /* the window: day sky or night sky, a moon, a few stars */
    const win = new THREE.Group(); win.position.set(1.9, 2.0, -2.55); g.add(win);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.08), toon(PALETTE.cream)), win, false);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color("#bfe0f5").lerp(new THREE.Color("#262a62"), night) }));
    glass.position.z = 0.05; win.add(glass);
    if (night > 0.5) {
      const moon = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), new THREE.MeshBasicMaterial({ color: "#fff6d8" }));
      moon.position.set(0.38, 0.28, 0.06); win.add(moon);
      const bite = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ color: "#262a62" }));
      bite.position.set(0.47, 0.34, 0.061); win.add(bite);
      [[-0.5, 0.35], [-0.2, 0.1], [-0.55, -0.3], [0.1, -0.35], [0.55, -0.2], [-0.05, 0.45]].forEach(([x, y], i) => {
        const s = kit.star(0.035 + (i % 2) * 0.02, "#fff1c4"); s.position.set(x, y, 0.07); s.scale.z = 0.1; win.add(s);
      });
    } else {
      const c = kit.cloud({ seed: 9 }); c.scale.setScalar(0.12); c.position.set(-0.2, 0.15, 0.08); win.add(c);
    }
    for (const x of [-0.95, 0.95]) {
      const curtain = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.75, 0.06), toon("#f39aa9")), win, false);
      curtain.position.set(x, -0.05, 0.1);
    }
    add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.04), toon(PALETTE.cream)), win, false).position.z = 0.07;
    add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.04), toon(PALETTE.cream)), win, false).position.z = 0.07;
    /* a round rug */
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 40), toon(night > 0.5 ? "#b9a3d9" : "#c9e3c2")); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, 0.8); rug.receiveShadow = true; g.add(rug);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 1.68, 40), toon(PALETTE.cream)); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.012, 0.8); g.add(ring);
    /* a shelf with a few things */
    const shelf = new THREE.Group(); shelf.position.set(-2.1, 1.7, -2.45); g.add(shelf);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), toon("#e8b78f")), shelf);
    const b1 = ball({ color: "#9fd0f0" }); b1.scale.setScalar(0.7); b1.position.set(-0.4, 0.04, 0); shelf.add(b1);
    const st = kit.star(0.13); st.position.set(0.05, 0.2, 0); shelf.add(st);
    const fl = kit.flower(PALETTE.rose); fl.position.set(0.45, 0.04, 0); shelf.add(fl);
    /* the doorway on the left wall */
    const door = new THREE.Group(); door.position.set(-4.18, 0, 0.2); door.rotation.y = Math.PI / 2; g.add(door);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.04), toon(night > 0.5 ? "#3a2c55" : "#e9c39f")), door, false).position.y = 1.15;
    for (const x of [-0.8, 0.8]) add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.08), toon(PALETTE.cream)), door, false).position.set(x, 1.2, 0.02);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.08), toon(PALETTE.cream)), door, false).position.set(0, 2.4, 0.02);
    /* the night light: a little glowing mushroom by the bed */
    const lamp = new THREE.Group(); lamp.position.set(1.9, 0, -1.6); g.add(lamp);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 10), toon(PALETTE.cream)), lamp).position.y = 0.15;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: night > 0.5 ? "#ffe39a" : "#ffb3c4" }));
    cap.position.y = 0.3; lamp.add(cap);
    return { group: g, door: new THREE.Vector3(-4.0, 0, 0.2), lamp: new THREE.Vector3(1.9, 0.5, -1.6) };
  }

  /* Day or night light for a set; night 0..1 */
  /* fill > 0 trades key light for sky light, for softer shadows */
  function light(night = 0, { key = [5, 8, 6], fill = 0 } = {}) {
    const { hemi, key: k } = world.lights;
    hemi.color.set(new THREE.Color("#ffe9d6").lerp(new THREE.Color("#b9b2ff"), night));
    hemi.groundColor.set(new THREE.Color("#c9a2c9").lerp(new THREE.Color("#4a3a6e"), night));
    hemi.intensity = 1.6 - night * 0.55 + fill;
    k.color.set(new THREE.Color("#ffe2c0").lerp(new THREE.Color("#c4ccff"), night));
    k.intensity = 2.2 - night * 1.3 - fill * 0.6;
    k.position.set(...key);
  }

  return { bigSister, littleSister, mom, dad, grandma, pram, toyBox, pacifier, rattle, ball, butterfly, note, quilt, basket, bed, nursery, light };
}

/* the angle that turns a blob (which faces +z) toward a point */
export const faceTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz);
