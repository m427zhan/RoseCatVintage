/* Furniture, fittings and table-top things for the detailed interiors.
   Every builder returns a THREE.Group standing on the floor at y = 0 with its front facing +Z.
   Display cases also return `slots`: local positions where shop items can be placed. */

(function () {
  const K = RC.kit, P = RC.pbr, L = RC.pbr.lib;
  const { bx, rbox, cyl, sphere, lathe, turned, frame, tube } = K;
  const V3 = THREE.Vector3;

  /* ---------- Shared special materials ---------- */
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());

  // Clear glass: draws only its reflections (additive), so whatever is behind stays crisp
  const glass = () => once("glass", () => new THREE.MeshPhysicalMaterial({
    color: "#000000", roughness: 0.02, metalness: 0, ior: 1.5, envMapIntensity: 1.6, specularIntensity: 0.35,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  // A faint green body tint seen on glass edges and thick panes
  const glassTint = () => once("glassTint", () => new THREE.MeshStandardMaterial({ color: "#cfe3dc", transparent: true, opacity: 0.06, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
  // Cut crystal (chandelier drops, decanters): faceted, mirror-bright
  const crystal = () => once("crystal", () => new THREE.MeshStandardMaterial({ color: "#eef3f8", metalness: 1, roughness: 0.03, flatShading: true, envMapIntensity: 2.2, emissive: "#ffffff", emissiveIntensity: 0.05 }));
  const flame = () => once("flame", () => new THREE.MeshBasicMaterial({ color: "#fff1cc" }));
  const candle = () => once("candle", () => new THREE.MeshStandardMaterial({ color: "#f4efe2", roughness: 0.5, emissive: "#ffe3b0", emissiveIntensity: 0.15 }));
  const porcelain = () => once("porcelain", () => new THREE.MeshPhysicalMaterial({ color: "#f7f5f0", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }));
  const velvet = (c) => P.mat("velvet", { base: c, sheen: 1, sheenColor: "#ffffff", sheenRough: 0.5, scale: 0.5 });
  const paint = (c, r) => P.mat("paint", { base: c, rough: r === undefined ? 0.55 : r, scale: 2 });
  const silk = (a, b) => P.mat("stripeSilk", { a, b, scale: 0.3, sheen: 0.4, sheenColor: "#fff8e8" });

  const shadowAll = (g) => { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };

  /* ---------- Display cases ---------- */

  // Tall wall vitrine: cupboard base, glass case with mirrored back and glass shelves, gilt mounts
  function vitrineWall(w, h, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt(), back: velvet("#2a1b2e"), shelves: 3 }, o);
    const g = new THREE.Group(), slots = [];
    const d = 0.55, baseH = 0.9, top = h - 0.25;
    g.add(rbox(w, baseH, d, 0.02, o.wood, 0, baseH / 2, 0));
    // drawer fronts with gilt pulls
    const nd = Math.max(1, Math.round(w / 0.7));
    for (let i = 0; i < nd; i++) {
      const x = -w / 2 + (w / nd) * (i + 0.5);
      g.add(frame(w / nd - 0.08, baseH - 0.2, 0.035, 0.02, o.mount, x, baseH / 2, d / 2));
      g.add(sphere(0.018, o.mount, x, baseH * 0.62, d / 2 + 0.03, 10, 8));
    }
    g.add(rbox(w + 0.04, 0.05, d + 0.04, 0.015, o.wood, 0, baseH + 0.025, 0));
    // case: back, sides, top
    const ch = top - baseH - 0.05;
    g.add(bx(w - 0.04, ch, 0.02, o.back, 0, baseH + 0.05 + ch / 2, -d / 2 + 0.02));
    [-1, 1].forEach((s) => {
      g.add(rbox(0.05, ch, 0.05, 0.01, o.wood, s * (w / 2 - 0.025), baseH + 0.05 + ch / 2, d / 2 - 0.03));
      g.add(rbox(0.05, ch, 0.05, 0.01, o.wood, s * (w / 2 - 0.025), baseH + 0.05 + ch / 2, -d / 2 + 0.03));
      const side = bx(d - 0.08, ch, 0.006, glass(), s * (w / 2 - 0.02), baseH + 0.05 + ch / 2, 0);
      side.rotation.y = Math.PI / 2;
      side.userData.noMerge = true;
      g.add(side);
      g.add(bx(0.012, ch * 0.9, 0.012, o.mount, s * (w / 2 - 0.025), baseH + 0.05 + ch / 2, d / 2 - 0.0));
    });
    const front = bx(w - 0.1, ch, 0.006, glass(), 0, baseH + 0.05 + ch / 2, d / 2 - 0.03);
    front.userData.noMerge = true;
    g.add(front);
    // cornice
    g.add(rbox(w + 0.06, 0.12, d + 0.06, 0.03, o.wood, 0, top + 0.06, 0));
    g.add(bx(w + 0.08, 0.025, d + 0.08, o.mount, 0, top + 0.005, 0));
    g.add(rbox(w + 0.12, 0.06, d + 0.1, 0.025, o.wood, 0, top + 0.15, 0));
    // gilt garland ornament on the frieze
    for (let i = 0; i < 5; i++) g.add(sphere(0.02, o.mount, -w / 2 + 0.2 + (w - 0.4) * (i / 4), top + 0.06, d / 2 + 0.035, 10, 8));
    // glass shelves; items sit on them
    for (let i = 0; i < o.shelves; i++) {
      const y = baseH + 0.05 + (ch / (o.shelves)) * i + (i === 0 ? 0 : 0.0);
      if (i > 0) {
        const sh = bx(w - 0.1, 0.012, d - 0.12, glassTint(), 0, y, -0.01);
        sh.userData.noMerge = true;
        g.add(sh);
        g.add(bx(w - 0.1, 0.012, 0.008, o.mount, 0, y, (d - 0.12) / 2));
      }
      const n = Math.max(2, Math.floor(w / 0.38));
      for (let k = 0; k < n; k++) slots.push(new V3(-w / 2 + 0.1 + (w - 0.2) * ((k + 0.5) / n), y + 0.008, -0.03));
    }
    // a little hidden light strip makes the case glow from within
    const strip = bx(w - 0.12, 0.015, 0.03, once("strip", () => new THREE.MeshBasicMaterial({ color: "#fff4dc" })), 0, top - 0.02, d / 2 - 0.08);
    g.add(strip);
    shadowAll(g);
    [front].forEach((m) => { m.castShadow = false; });
    g.userData.slots = slots;
    return g;
  }

  // Table vitrine: shallow glazed box with velvet bed on fluted legs (items lie on the velvet)
  function vitrineTable(w, d, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt(), bed: velvet("#203a5a") }, o);
    const g = new THREE.Group(), slots = [];
    const legH = 0.7;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = turned(legH, 0.04, o.wood, "leg");
      leg.position.set(sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
      g.add(leg);
      g.add(cyl(0.032, 0.026, 0.05, o.mount, sx * (w / 2 - 0.06), 0.025, sz * (d / 2 - 0.06), 12));
    });
    g.add(rbox(w, 0.14, d, 0.015, o.wood, 0, legH + 0.07, 0));
    g.add(bx(w + 0.01, 0.018, d + 0.01, o.mount, 0, legH + 0.01, 0));
    // stretcher with gilt finial
    g.add(bx(w - 0.12, 0.03, 0.04, o.wood, 0, 0.18, 0));
    g.add(sphere(0.03, o.mount, 0, 0.21, 0, 10, 8));
    const bedY = legH + 0.15;
    g.add(bx(w - 0.06, 0.02, d - 0.06, o.bed, 0, bedY, 0));
    // gilt frame + glass
    const gh = 0.22;
    [-1, 1].forEach((s) => {
      g.add(bx(w, 0.022, 0.022, o.mount, 0, bedY + gh, s * (d / 2 - 0.011)));
      g.add(bx(0.022, 0.022, d, o.mount, s * (w / 2 - 0.011), bedY + gh, 0));
      g.add(bx(0.022, gh, 0.022, o.mount, s * (w / 2 - 0.011), bedY + gh / 2, d / 2 - 0.011));
      g.add(bx(0.022, gh, 0.022, o.mount, s * (w / 2 - 0.011), bedY + gh / 2, -d / 2 + 0.011));
    });
    const panes = [
      [w - 0.02, 0.005, d - 0.02, 0, bedY + gh, 0],
      [w - 0.02, gh, 0.005, 0, bedY + gh / 2, d / 2 - 0.011],
      [w - 0.02, gh, 0.005, 0, bedY + gh / 2, -d / 2 + 0.011],
      [0.005, gh, d - 0.02, w / 2 - 0.011, bedY + gh / 2, 0],
      [0.005, gh, d - 0.02, -w / 2 + 0.011, bedY + gh / 2, 0],
    ];
    panes.forEach(([a, b, c, x, y, z]) => { const p = bx(a, b, c, glass(), x, y, z); p.userData.noMerge = true; g.add(p); });
    const nx = Math.max(2, Math.round(w / 0.32)), nz = Math.max(1, Math.round(d / 0.32));
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) slots.push(new V3(-w / 2 + (w / nx) * (i + 0.5), bedY + 0.01, -d / 2 + (d / nz) * (k + 0.5)));
    shadowAll(g);
    g.children.forEach((c) => { if (c.material === glass()) c.castShadow = false; });
    g.userData.slots = slots;
    g.userData.footprint = [w, d];
    return g;
  }

  // Round tower vitrine on a pedestal: the star piece of a room goes in here
  function vitrineTower(o) {
    o = Object.assign({ wood: L.ebony(), mount: L.gilt(), bed: velvet("#3a0f1c"), r: 0.42, h: 1.95 }, o);
    const g = new THREE.Group();
    const r = o.r;
    g.add(lathe([[0, 0], [r + 0.08, 0], [r + 0.08, 0.06], [r + 0.02, 0.1], [r - 0.04, 0.16], [r - 0.06, 0.8], [r, 0.86], [r + 0.04, 0.92], [0, 0.92]], o.wood, 32));
    g.add(lathe([[r + 0.085, 0.055], [r + 0.09, 0.065], [r + 0.085, 0.075]], o.mount, 32));
    g.add(cyl(r + 0.045, r + 0.045, 0.03, o.mount, 0, 0.935, 0, 32));
    g.add(cyl(r - 0.02, r - 0.02, 0.02, o.bed, 0, 0.96, 0, 32));
    // little stepped velvet plinth
    g.add(cyl(0.14, 0.16, 0.18, o.bed, 0, 1.06, 0, 24));
    const gh = o.h - 1.25;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, gh, 32, 1, true), glass());
    c.position.y = 0.95 + gh / 2;
    c.userData.noMerge = true;
    g.add(c);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.add(cyl(0.01, 0.01, gh, o.mount, Math.cos(a) * r, 0.95 + gh / 2, Math.sin(a) * r, 6));
    }
    const top = 0.95 + gh;
    g.add(lathe([[0, 0], [r + 0.05, 0], [r + 0.05, 0.05], [r * 0.8, 0.12], [r * 0.3, 0.22], [0.04, 0.3], [0, 0.3]], o.wood, 32, 0, top, 0));
    g.add(lathe([[r + 0.055, 0.0], [r + 0.06, 0.025], [r + 0.055, 0.05]], o.mount, 32, 0, top, 0));
    g.add(sphere(0.045, o.mount, 0, top + 0.33, 0, 14, 10));
    g.add(K.cyl(r - 0.03, r - 0.03, 0.01, once("strip", () => new THREE.MeshBasicMaterial({ color: "#fff4dc" })), 0, top - 0.01, 0, 24));
    shadowAll(g);
    c.castShadow = false;
    g.userData.slots = [new V3(0, 1.15, 0)];
    return g;
  }

  // Consultation counter (vendor behind, client in front): glass-topped display drawer, marble top band
  function counter(w, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt(), bed: velvet("#1e3a2e"), top: L.blackMarble() }, o);
    const g = new THREE.Group(), slots = [];
    const d = 0.7, h = 0.92;
    g.add(rbox(w, h - 0.06, d - 0.1, 0.02, o.wood, 0, (h - 0.06) / 2, -0.05));
    g.add(rbox(w + 0.04, 0.08, 0.2, 0.01, o.wood, 0, 0.04, -0.05));
    // front panels with gilt mouldings
    const np = Math.max(1, Math.round(w / 0.8));
    for (let i = 0; i < np; i++) {
      const x = -w / 2 + (w / np) * (i + 0.5);
      g.add(frame(w / np - 0.12, h - 0.35, 0.03, 0.02, o.mount, x, (h - 0.06) / 2 - 0.02, d / 2 - 0.1));
      g.add(sphere(0.022, o.mount, x, (h - 0.06) / 2 - 0.02, d / 2 - 0.08, 10, 8));
    }
    // top: marble band at the back, glazed tray at the front
    g.add(rbox(w + 0.06, 0.04, 0.26, 0.015, o.top, 0, h - 0.02, -d / 2 + 0.13));
    g.add(bx(w - 0.02, 0.012, d - 0.3, o.bed, 0, h - 0.08, 0.13));
    [-1, 1].forEach((s) => g.add(bx(0.03, 0.08, d - 0.28, o.mount, s * (w / 2 + 0.015), h - 0.04, 0.13)));
    g.add(bx(w + 0.06, 0.08, 0.03, o.mount, 0, h - 0.04, d / 2 - 0.015));
    const pane = bx(w, 0.006, d - 0.28, glass(), 0, h - 0.003, 0.13);
    pane.userData.noMerge = true;
    g.add(pane);
    const n = Math.max(2, Math.round(w / 0.34));
    for (let i = 0; i < n; i++) slots.push(new V3(-w / 2 + (w / n) * (i + 0.5), h - 0.073, 0.13));
    shadowAll(g);
    pane.castShadow = false;
    g.userData.slots = slots;
    return g;
  }

  /* ---------- Seating ---------- */

  // Louis XVI bergère: fluted legs, upholstered back and seat, padded arms
  function bergere(o) {
    o = Object.assign({ frame: L.giltwood(), cover: velvet("#2c4a6e"), w: 0.7, d: 0.66 }, o);
    const g = new THREE.Group();
    const w = o.w, d = o.d;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      const leg = turned(0.38, 0.032, o.frame, "leg");
      leg.position.set(sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05));
      g.add(leg);
    });
    g.add(rbox(w, 0.09, d, 0.02, o.frame, 0, 0.42, 0));
    g.add(rbox(w - 0.06, 0.12, d - 0.08, 0.05, o.cover, 0, 0.52, 0.02));
    // back
    const back = new THREE.Group();
    back.position.set(0, 0.46, -d / 2 + 0.05);
    back.rotation.x = -0.12;
    back.add(rbox(w - 0.02, 0.6, 0.07, 0.03, o.frame, 0, 0.32, -0.02));
    back.add(rbox(w - 0.12, 0.5, 0.08, 0.04, o.cover, 0, 0.32, 0.02));
    back.add(rbox(0.16, 0.05, 0.04, 0.015, o.frame, 0, 0.66, -0.01));
    back.add(sphere(0.03, o.frame, 0, 0.69, 0, 10, 8));
    g.add(back);
    // arms
    [-1, 1].forEach((s) => {
      g.add(rbox(0.07, 0.05, d - 0.1, 0.02, o.frame, s * (w / 2 - 0.035), 0.68, -0.02));
      g.add(rbox(0.06, 0.035, d - 0.24, 0.015, o.cover, s * (w / 2 - 0.035), 0.715, -0.04));
      g.add(rbox(0.06, 0.2, 0.32, 0.02, o.cover, s * (w / 2 - 0.04), 0.58, -0.08));
      const sup = turned(0.2, 0.025, o.frame, "vase");
      sup.position.set(s * (w / 2 - 0.035), 0.46, d / 2 - 0.08);
      g.add(sup);
    });
    shadowAll(g);
    g.add(K.blob(w + 0.3, d + 0.3, 0.45));
    return g;
  }

  // Medallion-back side chair (cabriolet): lighter, for consultation counters and tea tables
  function cabriolet(o) {
    o = Object.assign({ frame: paint("#e8e1d0", 0.45), mount: L.gilt(), cover: silk("#d9c9a3", "#b8a27a") }, o);
    const g = new THREE.Group();
    const w = 0.5, d = 0.48;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      const leg = turned(0.42, 0.024, o.frame, "leg");
      leg.position.set(sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.04));
      g.add(leg);
    });
    g.add(rbox(w, 0.06, d, 0.015, o.frame, 0, 0.45, 0));
    g.add(bx(w + 0.005, 0.01, d + 0.005, o.mount, 0, 0.43, 0));
    g.add(rbox(w - 0.04, 0.08, d - 0.04, 0.035, o.cover, 0, 0.51, 0.01));
    const back = new THREE.Group();
    back.position.set(0, 0.48, -d / 2 + 0.03);
    back.rotation.x = -0.14;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 32), o.frame);
    ring.position.y = 0.33; ring.scale.set(1, 1.18, 1);
    back.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.006, 6, 32), o.mount);
    ring2.position.set(0, 0.33, 0.018); ring2.scale.set(1, 1.18, 1);
    back.add(ring2);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 28), o.cover);
    pad.rotation.x = Math.PI / 2; pad.position.y = 0.33; pad.scale.set(1, 1, 1.18);
    back.add(pad);
    [-1, 1].forEach((s) => back.add(bx(0.03, 0.16, 0.03, o.frame, s * 0.15, 0.08, 0)));
    g.add(back);
    shadowAll(g);
    g.add(K.blob(0.75, 0.75, 0.4));
    return g;
  }

  // Louis XVI canapé (sofa)
  function canape(o) {
    o = Object.assign({ frame: L.giltwood(), cover: velvet("#7a2e3e"), w: 1.9, d: 0.75 }, o);
    const g = new THREE.Group();
    const { w, d } = o;
    const legsX = [-w / 2 + 0.06, -w / 6, w / 6, w / 2 - 0.06];
    legsX.forEach((x) => [1, -1].forEach((sz) => {
      if (Math.abs(x) < w / 2 - 0.1 && sz < 0) return;
      const leg = turned(0.36, 0.032, o.frame, "leg");
      leg.position.set(x, 0, sz * (d / 2 - 0.05));
      g.add(leg);
    }));
    g.add(rbox(w, 0.1, d, 0.025, o.frame, 0, 0.41, 0));
    // three seat cushions
    for (let i = 0; i < 3; i++) g.add(rbox((w - 0.2) / 3 - 0.01, 0.13, d - 0.12, 0.05, o.cover, -w / 2 + 0.1 + ((w - 0.2) / 3) * (i + 0.5), 0.52, 0.04));
    const back = new THREE.Group();
    back.position.set(0, 0.45, -d / 2 + 0.06);
    back.rotation.x = -0.12;
    back.add(rbox(w - 0.02, 0.56, 0.08, 0.03, o.frame, 0, 0.3, -0.02));
    back.add(rbox(w - 0.14, 0.46, 0.1, 0.05, o.cover, 0, 0.3, 0.03));
    // gilt crest with carved ribbon
    back.add(rbox(0.4, 0.06, 0.05, 0.02, o.frame, 0, 0.6, -0.01));
    back.add(sphere(0.04, o.frame, 0, 0.64, 0, 12, 8));
    // tufting buttons
    for (let i = 0; i < 7; i++) for (let k = 0; k < 2; k++) back.add(sphere(0.012, o.cover, -w / 2 + 0.25 + (w - 0.5) * (i / 6) + (k ? 0.08 : 0), 0.22 + k * 0.16, 0.085, 6, 5));
    g.add(back);
    [-1, 1].forEach((s) => {
      g.add(rbox(0.08, 0.05, d - 0.1, 0.02, o.frame, s * (w / 2 - 0.04), 0.66, -0.02));
      g.add(rbox(0.1, 0.22, d - 0.2, 0.04, o.cover, s * (w / 2 - 0.06), 0.56, -0.04));
      const sup = turned(0.2, 0.026, o.frame, "vase");
      sup.position.set(s * (w / 2 - 0.04), 0.46, d / 2 - 0.08);
      g.add(sup);
      // bolster cushion
      const bol = cyl(0.08, 0.08, d - 0.3, o.cover, s * (w / 2 - 0.2), 0.66, 0, 16);
      bol.rotation.x = Math.PI / 2;
      g.add(bol);
    });
    shadowAll(g);
    g.add(K.blob(w + 0.4, d + 0.4, 0.45));
    return g;
  }

  // Bentwood café chair (Thonet No. 14) with a cane seat
  function bistroChair(o) {
    o = Object.assign({ wood: L.walnut() }, o);
    const g = new THREE.Group();
    const m = o.wood, r = 0.012;
    const seatY = 0.46;
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.016, 8, 32), m);
    seat.rotation.x = Math.PI / 2; seat.position.y = seatY;
    g.add(seat);
    g.add(cyl(0.19, 0.19, 0.01, once("cane", () => P.mat("linen", { base: "#c9a46a", scale: 0.15, rough: 0.8 })), 0, seatY + 0.004, 0, 28));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.01, 6, 28), m);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.18;
    g.add(ring);
    [[-1, 1], [1, 1]].forEach(([sx]) => {
      g.add(tube([[sx * 0.17, 0, 0.17], [sx * 0.16, 0.25, 0.14], [sx * 0.14, seatY, 0.12]], r + 0.004, m, 8));
    });
    // back legs sweep up into the back hoop
    [-1, 1].forEach((sx) => g.add(tube([[sx * 0.16, 0, -0.2], [sx * 0.15, 0.3, -0.16], [sx * 0.15, seatY, -0.14], [sx * 0.16, 0.7, -0.2], [sx * 0.13, 0.9, -0.24], [sx * 0.05, 0.96, -0.26], [0, 0.965, -0.26]], r + 0.003, m, 24)));
    g.add(tube([[-0.13, 0.5, -0.17], [-0.12, 0.7, -0.21], [-0.07, 0.82, -0.23], [0, 0.84, -0.235], [0.07, 0.82, -0.23], [0.12, 0.7, -0.21], [0.13, 0.5, -0.17]], r, m, 24));
    shadowAll(g);
    g.add(K.blob(0.6, 0.6, 0.35));
    return g;
  }

  // Brass bar stool with a buttoned velvet seat
  function barStool(o) {
    o = Object.assign({ metal: L.brass(), cover: velvet("#2f5a45") }, o);
    const g = new THREE.Group();
    g.add(cyl(0.2, 0.22, 0.03, o.metal, 0, 0.015, 0, 28));
    g.add(lathe([[0, 0], [0.05, 0], [0.03, 0.08], [0.028, 0.7], [0.06, 0.74], [0, 0.74]], o.metal, 16));
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.01, 8, 28), o.metal);
    fr.rotation.x = Math.PI / 2; fr.position.y = 0.3;
    g.add(fr);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; g.add(tube([[0, 0.3, 0], [Math.cos(a) * 0.17, 0.3, Math.sin(a) * 0.17]], 0.008, o.metal, 2)); }
    g.add(rbox(0.38, 0.1, 0.38, 0.05, o.cover, 0, 0.79, 0, 3));
    g.add(sphere(0.012, o.cover, 0, 0.84, 0, 6, 5));
    shadowAll(g);
    g.add(K.blob(0.6, 0.6, 0.4));
    return g;
  }

  // Velvet banquette with a buttoned back, mahogany capping (runs along X, against a wall at -Z)
  function banquette(len, o) {
    o = Object.assign({ wood: L.mahogany(), cover: velvet("#5c1e2c"), mount: L.brass() }, o);
    const g = new THREE.Group();
    g.add(rbox(len, 0.3, 0.6, 0.02, o.wood, 0, 0.15, 0));
    g.add(rbox(len - 0.02, 0.14, 0.58, 0.05, o.cover, 0, 0.36, 0.01));
    g.add(rbox(len - 0.02, 0.6, 0.16, 0.06, o.cover, 0, 0.72, -0.24));
    g.add(rbox(len + 0.04, 0.06, 0.2, 0.02, o.wood, 0, 1.05, -0.26));
    const n = Math.round(len / 0.18);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
      if (k === 1 && i === n - 1) continue;
      g.add(sphere(0.013, o.cover, -len / 2 + (len / n) * (i + 0.5) + (k === 1 ? len / n / 2 : 0), 0.55 + k * 0.14, -0.16, 6, 5));
    }
    shadowAll(g);
    g.add(K.blob(len + 0.3, 0.9, 0.45));
    return g;
  }

  /* ---------- Tables ---------- */

  // Café guéridon: marble top, gilt-bronze tripod
  function gueridon(o) {
    o = Object.assign({ top: L.whiteMarble(), metal: L.gilt(), r: 0.36, h: 0.74 }, o);
    const g = new THREE.Group();
    g.add(cyl(o.r, o.r, 0.03, o.top, 0, o.h - 0.015, 0, 36));
    const edge = new THREE.Mesh(new THREE.TorusGeometry(o.r, 0.012, 8, 40), o.metal);
    edge.rotation.x = Math.PI / 2; edge.position.y = o.h - 0.015;
    g.add(edge);
    g.add(lathe([[0, 0], [0.04, 0], [0.03, 0.1], [0.022, 0.3], [0.035, 0.45], [0.02, o.h - 0.1], [0.08, o.h - 0.04], [0, o.h - 0.03]], o.metal, 16));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      g.add(tube([[0, 0.12, 0], [Math.cos(a) * 0.12, 0.06, Math.sin(a) * 0.12], [Math.cos(a) * 0.24, 0.015, Math.sin(a) * 0.24], [Math.cos(a) * 0.28, 0.03, Math.sin(a) * 0.28]], 0.016, o.metal, 12));
    }
    shadowAll(g);
    g.add(K.blob(o.r * 2.4, o.r * 2.4, 0.4));
    return g;
  }

  // Gilt console table against a wall, marble top
  function consoleTable(w, o) {
    o = Object.assign({ frame: L.giltwood(), top: L.rougeMarble(), d: 0.45, h: 0.88 }, o);
    const g = new THREE.Group();
    const { d, h } = o;
    g.add(rbox(w + 0.04, 0.04, d + 0.03, 0.015, o.top, 0, h - 0.02, 0));
    g.add(rbox(w - 0.04, 0.12, d - 0.04, 0.02, o.frame, 0, h - 0.1, -0.01));
    for (let i = 0; i < 9; i++) g.add(sphere(0.012, o.frame, -w / 2 + 0.1 + (w - 0.2) * (i / 8), h - 0.1, d / 2 - 0.02, 8, 6));
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      const leg = turned(h - 0.16, 0.032, o.frame, "leg");
      leg.position.set(sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
      g.add(leg);
    });
    g.add(rbox(w - 0.1, 0.03, d - 0.1, 0.01, o.frame, 0, 0.16, -0.01));
    g.add(lathe([[0, 0], [0.06, 0], [0.04, 0.08], [0.06, 0.14], [0, 0.18]], o.frame, 16, 0, 0.175, -0.01));
    shadowAll(g);
    g.add(K.blob(w + 0.3, d + 0.3, 0.4));
    return g;
  }

  // Low table (VIP salon), mahogany with gilt mounts and a marble top
  function lowTable(w, d, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt(), top: L.greenMarble() }, o);
    const g = new THREE.Group();
    g.add(rbox(w, 0.035, d, 0.012, o.top, 0, 0.46, 0));
    g.add(rbox(w - 0.06, 0.08, d - 0.06, 0.015, o.wood, 0, 0.4, 0));
    g.add(bx(w - 0.05, 0.012, d - 0.05, o.mount, 0, 0.36, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = turned(0.36, 0.03, o.wood, "leg");
      leg.position.set(sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
      g.add(leg);
      g.add(cyl(0.028, 0.022, 0.05, o.mount, sx * (w / 2 - 0.06), 0.025, sz * (d / 2 - 0.06), 10));
    });
    g.add(rbox(w - 0.14, 0.02, d - 0.14, 0.008, o.wood, 0, 0.12, 0));
    shadowAll(g);
    g.add(K.blob(w + 0.4, d + 0.4, 0.4));
    return g;
  }

  // Bureau plat (writing table) for private consultations
  function bureau(w, d, o) {
    o = Object.assign({ wood: L.ebony(), mount: L.gilt(), leather: P.mat("velvet", { base: "#1f3a2a", scale: 0.6, rough: 0.6 }) }, o);
    const g = new THREE.Group();
    const h = 0.76;
    g.add(rbox(w, 0.04, d, 0.012, o.wood, 0, h - 0.02, 0));
    g.add(bx(w - 0.16, 0.004, d - 0.16, o.leather, 0, h + 0.001, 0));
    g.add(frame(w - 0.12, d - 0.12, 0.012, 0.004, o.mount, 0, h, 0).rotateX(-Math.PI / 2));
    g.add(rbox(w - 0.06, 0.14, d - 0.06, 0.012, o.wood, 0, h - 0.1, 0));
    [-1, 0, 1].forEach((i) => {
      g.add(frame(w / 3 - 0.1, 0.09, 0.012, 0.01, o.mount, i * (w / 3), h - 0.1, d / 2 - 0.03));
      g.add(sphere(0.012, o.mount, i * (w / 3), h - 0.1, d / 2 - 0.015, 8, 6));
    });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = turned(h - 0.17, 0.03, o.wood, "leg");
      leg.position.set(sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
      g.add(leg);
      g.add(cyl(0.035, 0.035, 0.06, o.mount, sx * (w / 2 - 0.06), h - 0.2, sz * (d / 2 - 0.06), 10));
      g.add(cyl(0.026, 0.02, 0.05, o.mount, sx * (w / 2 - 0.06), 0.025, sz * (d / 2 - 0.06), 10));
    });
    shadowAll(g);
    g.add(K.blob(w + 0.4, d + 0.4, 0.4));
    return g;
  }

  /* ---------- Bar ---------- */

  // Bar counter running along X: panelled mahogany front, marble top, brass foot rail
  function barCounter(len, o) {
    o = Object.assign({ wood: L.mahogany(), top: L.rougeMarble(), metal: L.brass(), mount: L.gilt() }, o);
    const g = new THREE.Group();
    const h = 1.08, d = 0.65;
    g.add(rbox(len, h - 0.06, d - 0.06, 0.02, o.wood, 0, (h - 0.06) / 2, 0));
    const np = Math.round(len / 0.7);
    for (let i = 0; i < np; i++) {
      const x = -len / 2 + (len / np) * (i + 0.5);
      g.add(frame(len / np - 0.14, h - 0.4, 0.035, 0.025, o.wood, x, h / 2 - 0.05, d / 2 - 0.03));
      g.add(frame(len / np - 0.24, h - 0.5, 0.012, 0.012, o.mount, x, h / 2 - 0.05, d / 2 - 0.01));
    }
    g.add(rbox(len + 0.1, 0.05, d + 0.12, 0.02, o.top, 0, h - 0.025, 0.03));
    // brass foot rail on brackets
    const rail = cyl(0.025, 0.025, len - 0.1, o.metal, 0, 0.2, d / 2 + 0.16, 16);
    rail.rotation.z = Math.PI / 2;
    g.add(rail);
    for (let i = 0; i <= 4; i++) {
      const x = -len / 2 + 0.1 + (len - 0.2) * (i / 4);
      g.add(tube([[x, 0.2, d / 2 + 0.16], [x, 0.2, d / 2 + 0.06], [x, 0.26, d / 2 - 0.03]], 0.012, o.metal, 6));
    }
    g.add(rbox(len + 0.04, 0.12, 0.08, 0.02, o.wood, 0, 0.06, d / 2 - 0.02));
    shadowAll(g);
    g.add(K.blob(len + 0.5, d + 0.8, 0.45));
    return g;
  }

  // Bottle of the given colour (wine, liqueur, champagne)
  function bottle(colour, h, kind) {
    const g = new THREE.Group();
    const gm = once("bottle" + colour, () => new THREE.MeshPhysicalMaterial({ color: colour, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.5 }));
    const r = h * 0.12;
    if (kind === "decanter") {
      g.add(lathe([[0, 0], [r * 1.3, 0], [r * 1.45, h * 0.25], [r * 0.6, h * 0.55], [r * 0.4, h * 0.7], [r * 0.5, h * 0.72], [0, h * 0.72]], crystal(), 10));
      g.add(sphere(r * 0.5, crystal(), 0, h * 0.8, 0, 8, 6));
    } else {
      g.add(lathe([[0, 0], [r, 0], [r, h * 0.6], [r * 0.45, h * 0.78], [r * 0.35, h * 0.95], [r * 0.4, h], [0, h]], gm, 16));
      g.add(cyl(r * 1.002, r * 1.002, h * 0.22, once("label", () => new THREE.MeshStandardMaterial({ color: "#efe6cf", roughness: 0.7 })), 0, h * 0.32, 0, 16, true));
      if (kind === "champagne") g.add(lathe([[r * 0.48, h * 0.75], [r * 0.38, h * 0.95], [r * 0.42, h * 1.01], [0, h * 1.01]], L.gold(), 12));
    }
    return g;
  }

  // Back bar: cupboard, tall mirror in a carved frame, glass shelves of bottles, clock
  function backBar(len, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt(), top: L.rougeMarble() }, o);
    const g = new THREE.Group();
    g.add(rbox(len, 0.95, 0.5, 0.02, o.wood, 0, 0.475, 0));
    g.add(rbox(len + 0.04, 0.04, 0.54, 0.015, o.top, 0, 0.97, 0));
    const nd = Math.round(len / 0.6);
    for (let i = 0; i < nd; i++) g.add(frame(len / nd - 0.08, 0.7, 0.03, 0.02, o.wood, -len / 2 + (len / nd) * (i + 0.5), 0.48, 0.25));
    g.add(bx(len - 0.1, 1.7, 0.03, L.mirror(), 0, 1.95, -0.2));
    g.add(frame(len, 1.85, 0.1, 0.06, o.wood, 0, 1.95, -0.2));
    g.add(frame(len - 0.14, 1.72, 0.015, 0.02, o.mount, 0, 1.95, -0.16));
    g.add(rbox(len + 0.2, 0.2, 0.4, 0.04, o.wood, 0, 2.95, -0.1));
    g.add(bx(len + 0.22, 0.03, 0.42, o.mount, 0, 2.86, -0.1));
    // glass shelves of bottles
    const cols = ["#1f3a24", "#5a2a0c", "#2a2018", "#8a5a18", "#1a2a3a", "#4a0e18", "#d8c88a"];
    [1.35, 1.8].forEach((y, si) => {
      const sh = bx(len - 0.2, 0.012, 0.22, glassTint(), 0, y, -0.08);
      sh.userData.noMerge = true;
      g.add(sh);
      g.add(bx(len - 0.2, 0.014, 0.01, o.mount, 0, y, 0.03));
      for (let x = -len / 2 + 0.2; x < len / 2 - 0.15; x += 0.13) {
        const b = bottle(cols[Math.floor(P.hash(Math.round(x * 100) + si * 31) * cols.length)], 0.26 + P.hash(Math.round(x * 50) + si) * 0.08, P.hash(Math.round(x * 70) + si * 3) > 0.85 ? "decanter" : "wine");
        b.position.set(x, y + 0.006, -0.08);
        g.add(b);
      }
    });
    // gilt bracket clock in the middle of the top
    const clock = new THREE.Group();
    clock.position.set(0, 3.05, -0.05);
    clock.add(rbox(0.36, 0.4, 0.14, 0.03, o.wood, 0, 0.2, 0));
    clock.add(cyl(0.12, 0.12, 0.02, once("dial", () => new THREE.MeshStandardMaterial({ map: RC.tex.clockFace(), roughness: 0.4 })), 0, 0.22, 0.07, 32).rotateX(Math.PI / 2));
    const bez = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.012, 8, 32), o.mount);
    bez.position.set(0, 0.22, 0.08);
    clock.add(bez);
    clock.add(sphere(0.04, o.mount, 0, 0.44, 0, 10, 8));
    g.add(clock);
    shadowAll(g);
    return g;
  }

  // Tall glazed pâtisserie case with tiers of cakes and macarons
  function pastryCase(w, o) {
    o = Object.assign({ wood: L.mahogany(), mount: L.gilt() }, o);
    const g = new THREE.Group();
    const h = 1.6, d = 0.6;
    g.add(rbox(w, 0.85, d, 0.02, o.wood, 0, 0.425, 0));
    g.add(frame(w - 0.1, 0.6, 0.03, 0.02, o.mount, 0, 0.45, d / 2));
    g.add(rbox(w + 0.04, 0.04, d + 0.04, 0.015, L.whiteMarble(), 0, 0.87, 0));
    const gh = h - 0.9;
    [-1, 1].forEach((s) => { g.add(bx(0.03, gh, 0.03, o.mount, s * (w / 2 - 0.015), 0.89 + gh / 2, d / 2 - 0.015)); g.add(bx(0.03, gh, 0.03, o.mount, s * (w / 2 - 0.015), 0.89 + gh / 2, -d / 2 + 0.015)); });
    g.add(rbox(w + 0.04, 0.06, d + 0.04, 0.02, o.wood, 0, 0.89 + gh + 0.03, 0));
    [[w, gh, 0.006, 0, 0.89 + gh / 2, d / 2 - 0.015], [0.006, gh, d, w / 2 - 0.015, 0.89 + gh / 2, 0], [0.006, gh, d, -w / 2 + 0.015, 0.89 + gh / 2, 0], [w, gh, 0.006, 0, 0.89 + gh / 2, -d / 2 + 0.015]].forEach(([a, b, c, x, y, z]) => {
      const p = bx(a, b, c, glass(), x, y, z); p.userData.noMerge = true; g.add(p);
    });
    const sh = bx(w - 0.06, 0.01, d - 0.08, glassTint(), 0, 1.22, 0);
    sh.userData.noMerge = true;
    g.add(sh);
    // cakes on the marble, macaron pyramids on the shelf
    for (let i = 0; i < 3; i++) {
      const c = cake(["#f2c9cf", "#5a3222", "#f6efe0"][i]);
      c.position.set(-w / 2 + (w / 3) * (i + 0.5), 0.89, 0.02);
      g.add(c);
    }
    for (let i = 0; i < 4; i++) {
      const m = macaronTower(["#f4b6c2", "#bfe0b8", "#f3e3a8", "#d7c0ec"][i], 4);
      m.position.set(-w / 2 + (w / 4) * (i + 0.5), 1.225, 0);
      g.add(m);
    }
    shadowAll(g);
    return g;
  }

  /* ---------- Table-top things ---------- */

  function cake(icing) {
    const g = new THREE.Group();
    const ic = once("icing" + icing, () => new THREE.MeshPhysicalMaterial({ color: icing, roughness: 0.35, clearcoat: 0.4, sheen: 0.5, sheenColor: "#ffffff" }));
    g.add(cyl(0.13, 0.13, 0.012, porcelain(), 0, 0.006, 0, 28));
    g.add(cyl(0.1, 0.1, 0.07, ic, 0, 0.047, 0, 28));
    g.add(cyl(0.075, 0.075, 0.05, ic, 0, 0.107, 0, 24));
    const piping = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 28), once("cream", () => new THREE.MeshStandardMaterial({ color: "#fbf6ec", roughness: 0.5 })));
    piping.rotation.x = Math.PI / 2; piping.position.y = 0.082;
    g.add(piping);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; g.add(sphere(0.012, once("berry", () => new THREE.MeshPhysicalMaterial({ color: "#a0101e", roughness: 0.2, clearcoat: 1 })), Math.cos(a) * 0.055, 0.137, Math.sin(a) * 0.055, 8, 6)); }
    return g;
  }

  // One macaron: two domed shells with a filling
  const macGeo = () => once("macgeo", () => new THREE.SphereGeometry(0.018, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1));
  function macaron(colour) {
    const g = new THREE.Group();
    const m = once("mac" + colour, () => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.8 }));
    const top = new THREE.Mesh(macGeo(), m); top.position.y = 0.012;
    const bot = new THREE.Mesh(macGeo(), m); bot.rotation.x = Math.PI; bot.position.y = 0.008;
    g.add(top, bot, cyl(0.016, 0.016, 0.006, once("filling", () => new THREE.MeshStandardMaterial({ color: "#f6ecd8", roughness: 0.6 })), 0, 0.01, 0, 12));
    return g;
  }
  function macaronTower(colour, rows) {
    const g = new THREE.Group();
    g.add(cyl(0.11, 0.11, 0.01, porcelain(), 0, 0.005, 0, 24));
    for (let r = 0; r < rows; r++) {
      const ring = 0.08 - r * 0.02, n = Math.max(1, Math.round(ring * 2 * Math.PI / 0.04));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r;
        const m = macaron(colour);
        m.position.set(Math.cos(a) * ring, 0.01 + r * 0.022, Math.sin(a) * ring);
        g.add(m);
      }
    }
    return g;
  }

  // Three-tier porcelain cake stand with macarons and petits fours
  function cakeStand() {
    const g = new THREE.Group();
    const silver = L.silver();
    g.add(cyl(0.005, 0.005, 0.38, silver, 0, 0.19, 0, 8));
    g.add(sphere(0.015, silver, 0, 0.385, 0, 10, 8));
    const cols = ["#f4b6c2", "#bfe0b8", "#f3e3a8", "#d7c0ec", "#f7d4b0"];
    [0.12, 0.09, 0.065].forEach((r, i) => {
      const y = 0.02 + i * 0.13;
      g.add(lathe([[0, 0], [r, 0.004], [r + 0.008, 0.016], [r - 0.005, 0.012], [0, 0.008]], porcelain(), 28, 0, y, 0));
      const n = Math.max(3, Math.round(r * 50));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const m = macaron(cols[(k + i) % cols.length]);
        m.position.set(Math.cos(a) * (r - 0.03), y + 0.012, Math.sin(a) * (r - 0.03));
        g.add(m);
      }
    });
    return g;
  }

  function cupAndSaucer() {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.065, 0.004], [0.07, 0.014], [0, 0.01]], porcelain(), 24));
    g.add(lathe([[0, 0.012], [0.025, 0.012], [0.042, 0.03], [0.048, 0.062], [0.045, 0.062], [0.04, 0.032], [0, 0.026]], porcelain(), 24));
    g.add(cyl(0.04, 0.04, 0.002, once("tea", () => new THREE.MeshPhysicalMaterial({ color: "#6a3010", roughness: 0.05, clearcoat: 1 })), 0, 0.05, 0, 20));
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12, Math.PI * 1.3), porcelain());
    h.position.set(0.05, 0.04, 0); h.rotation.z = -Math.PI * 0.65;
    g.add(h);
    const gilt = new THREE.Mesh(new THREE.TorusGeometry(0.0475, 0.0015, 4, 32), L.gold());
    gilt.rotation.x = Math.PI / 2; gilt.position.y = 0.062;
    g.add(gilt);
    return g;
  }

  function teapot() {
    const g = new THREE.Group();
    const s = L.silver();
    g.add(lathe([[0, 0], [0.05, 0], [0.075, 0.04], [0.075, 0.08], [0.05, 0.12], [0.03, 0.125], [0.035, 0.135], [0, 0.15]], s, 24));
    g.add(sphere(0.012, s, 0, 0.155, 0, 8, 6));
    g.add(tube([[0.06, 0.05, 0], [0.11, 0.08, 0], [0.13, 0.13, 0]], 0.01, s, 10));
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 16, Math.PI), s);
    h.position.set(-0.08, 0.08, 0); h.rotation.z = Math.PI / 2;
    g.add(h);
    return g;
  }

  // Champagne coupe (glass) with wine in it
  function coupe() {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.035, 0], [0.004, 0.006], [0.004, 0.09], [0.05, 0.11], [0.055, 0.125], [0.05, 0.125], [0, 0.098]], crystal(), 16));
    g.add(lathe([[0, 0.098], [0.045, 0.112], [0, 0.112]], once("wine", () => new THREE.MeshPhysicalMaterial({ color: "#e8c870", roughness: 0.05, transparent: true, opacity: 0.75, clearcoat: 1 })), 16));
    return g;
  }

  // Silver champagne bucket with a bottle and two coupes on a small tray
  function champagneSet() {
    const g = new THREE.Group();
    g.add(cyl(0.2, 0.2, 0.01, L.silver(), 0, 0.005, 0, 32));
    const bucket = lathe([[0, 0], [0.07, 0], [0.08, 0.02], [0.09, 0.2], [0.1, 0.21], [0, 0.21]], L.silver(), 24);
    bucket.position.x = -0.05;
    g.add(bucket);
    const b = bottle("#1e3a22", 0.32, "champagne");
    b.position.set(-0.05, 0.08, 0); b.rotation.z = 0.25;
    g.add(b);
    [[0.1, 0.06], [0.12, -0.08]].forEach(([x, z]) => { const c = coupe(); c.position.set(x, 0.01, z); g.add(c); });
    return g;
  }

  /* ---------- Lighting fixtures ---------- */

  // Crystal chandelier: gilt frame, candle bulbs, swags and drops of cut crystal (instanced)
  function chandelier(o) {
    o = Object.assign({ r: 0.7, arms: 8, tiers: 2, drop: 1.0, metal: L.gilt() }, o);
    const g = new THREE.Group();
    const m = o.metal;
    // chain from ceiling
    for (let i = 0; i < 6; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), m);
      link.position.y = -i * 0.05; link.rotation.y = (i % 2) * Math.PI / 2;
      g.add(link);
    }
    g.add(lathe([[0, 0], [0.12, 0], [0.13, 0.02], [0.03, 0.06], [0, 0.06]], m, 24, 0, -0.06, 0));
    const top = -0.3;
    g.add(lathe([[0, 0], [0.04, 0], [0.06, -0.15], [0.04, -0.3], [0.09, -0.45], [0.16, -0.55], [0.1, -0.62], [0.03, -0.66], [0.05, -0.8], [0, -0.85]], m, 20, 0, top, 0));
    const lights = [];
    const crystals = [];
    for (let t = 0; t < o.tiers; t++) {
      const R = o.r * (1 - t * 0.38), y = top - 0.62 + t * 0.32, n = Math.round(o.arms * (1 - t * 0.35));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.4;
        const c = Math.cos(a), s = Math.sin(a);
        g.add(tube([[c * 0.05, y, s * 0.05], [c * R * 0.4, y - 0.12, s * R * 0.4], [c * R * 0.85, y - 0.05, s * R * 0.85], [c * R, y + 0.08, s * R]], 0.011, m, 12));
        g.add(lathe([[0, 0], [0.045, 0], [0.05, 0.015], [0.02, 0.02], [0, 0.02]], m, 14, c * R, y + 0.08, s * R));
        g.add(cyl(0.013, 0.013, 0.1, candle(), c * R, y + 0.15, s * R, 10));
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), flame());
        f.scale.y = 1.8; f.position.set(c * R, y + 0.225, s * R);
        g.add(f);
        lights.push(f);
        // drops hanging below the bobeche
        crystals.push([c * R, y + 0.055, s * R, 1.1]);
        crystals.push([c * R, y + 0.01, s * R, 0.8]);
        // swag to the next arm
        const a2 = ((i + 1) / n) * Math.PI * 2 + t * 0.4;
        for (let k = 1; k < 6; k++) {
          const u = k / 6, aa = a + (a2 - a) * u;
          crystals.push([Math.cos(aa) * R * 0.97, y + 0.05 - Math.sin(u * Math.PI) * 0.12, Math.sin(aa) * R * 0.97, 0.45]);
        }
      }
    }
    // cascade of drops beneath
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, rr = 0.12 + (i % 2) * 0.06;
      for (let k = 0; k < 3; k++) crystals.push([Math.cos(a) * rr, top - 0.82 - k * 0.05 - (i % 2) * 0.04, Math.sin(a) * rr, 0.55 + k * 0.15]);
    }
    crystals.push([0, top - 1.0, 0, 2.2]);
    const geo = new THREE.OctahedronGeometry(0.018, 0);
    geo.scale(0.75, 1.6, 0.75);
    const inst = new THREE.InstancedMesh(geo, crystal(), crystals.length);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new V3();
    crystals.forEach(([x, y, z, s], i) => { S.setScalar(s); Q.setFromAxisAngle(new V3(0, 1, 0), i * 0.7); M.compose(new V3(x, y, z), Q, S); inst.setMatrixAt(i, M); });
    inst.userData.noMerge = true;
    g.add(inst);
    g.userData.flames = lights;
    g.userData.lightY = top - 0.55;
    return g;
  }

  // Wall sconce: gilt backplate, two candle arms
  function sconce(o) {
    o = Object.assign({ metal: L.gilt() }, o);
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.06, 0], [0.07, 0.04], [0.05, 0.2], [0.02, 0.28], [0, 0.3]], o.metal, 12).rotateX(Math.PI / 2));
    [-1, 1].forEach((s) => {
      g.add(tube([[0, 0.1, 0.04], [s * 0.1, 0.05, 0.12], [s * 0.16, 0.12, 0.15]], 0.009, o.metal, 10));
      g.add(cyl(0.035, 0.03, 0.02, o.metal, s * 0.16, 0.13, 0.15, 12));
      g.add(cyl(0.011, 0.011, 0.09, candle(), s * 0.16, 0.185, 0.15, 8));
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), flame());
      f.scale.y = 1.8; f.position.set(s * 0.16, 0.25, 0.15);
      g.add(f);
    });
    return g;
  }

  // Gilt-framed mirror (a wall panel), in the XY plane, facing +Z
  function mirror(w, h, o) {
    o = Object.assign({ frame: L.giltwood(), crest: true }, o);
    const g = new THREE.Group();
    g.add(bx(w - 0.1, h - 0.1, 0.01, L.mirror(), 0, 0, 0.005));
    g.add(frame(w, h, 0.08, 0.05, o.frame, 0, 0, 0));
    g.add(frame(w - 0.14, h - 0.14, 0.012, 0.015, o.frame, 0, 0, 0.012));
    if (o.crest) {
      g.add(rbox(w * 0.36, 0.12, 0.05, 0.03, o.frame, 0, h / 2 + 0.05, 0.02));
      g.add(sphere(0.05, o.frame, 0, h / 2 + 0.14, 0.03, 12, 8));
      [-1, 1].forEach((s) => g.add(K.scroll(0.07, 1, 0.012, o.frame).translateX(s * w * 0.14).translateY(h / 2 + 0.1).translateZ(0.03)));
    }
    return g;
  }

  // Marble chimneypiece with a gilt mantel clock and candelabra
  function fireplace(o) {
    o = Object.assign({ marble: L.whiteMarble(), metal: L.gilt(), w: 1.7, h: 1.15 }, o);
    const g = new THREE.Group();
    const { w, h } = o;
    [-1, 1].forEach((s) => {
      g.add(rbox(0.22, h - 0.1, 0.3, 0.02, o.marble, s * (w / 2 - 0.11), (h - 0.1) / 2, 0));
      g.add(rbox(0.12, 0.5, 0.06, 0.02, o.marble, s * (w / 2 - 0.11), h * 0.55, 0.16));
    });
    g.add(rbox(w - 0.3, 0.26, 0.3, 0.02, o.marble, 0, h - 0.23, 0));
    g.add(rbox(w + 0.12, 0.06, 0.42, 0.02, o.marble, 0, h - 0.03, 0.04));
    g.add(bx(w - 0.44, h - 0.36, 0.02, once("soot", () => new THREE.MeshStandardMaterial({ color: "#0d0b0a", roughness: 0.95 })), 0, (h - 0.36) / 2, -0.12));
    g.add(rbox(w + 0.3, 0.04, 0.6, 0.01, L.blackMarble(), 0, 0.02, 0.12));
    // brass fender and a glowing coal grate
    g.add(bx(w - 0.4, 0.06, 0.02, o.metal, 0, 0.09, 0.3));
    const coal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.2), once("coal", () => new THREE.MeshStandardMaterial({ color: "#2a1008", emissive: "#ff5a18", emissiveIntensity: 0.8, roughness: 0.9 })));
    coal.position.set(0, 0.2, -0.05);
    g.add(coal);
    g.add(bx(0.7, 0.3, 0.02, o.metal, 0, 0.25, 0.06));
    // mantel garniture
    const clock = new THREE.Group();
    clock.position.set(0, h, 0.05);
    clock.add(rbox(0.32, 0.36, 0.14, 0.04, o.metal, 0, 0.18, 0));
    clock.add(cyl(0.085, 0.085, 0.01, once("dial", () => new THREE.MeshStandardMaterial({ map: RC.tex.clockFace(), roughness: 0.4 })), 0, 0.2, 0.072, 28).rotateX(Math.PI / 2));
    clock.add(sphere(0.05, o.metal, 0, 0.42, 0, 12, 10));
    g.add(clock);
    [-1, 1].forEach((s) => {
      const c = new THREE.Group();
      c.position.set(s * (w / 2 - 0.15), h, 0.05);
      c.add(lathe([[0, 0], [0.06, 0], [0.03, 0.05], [0.015, 0.3], [0.03, 0.32], [0, 0.33]], o.metal, 12));
      [-1, 0, 1].forEach((k) => {
        c.add(tube([[0, 0.28, 0], [k * 0.07, 0.3, 0], [k * 0.09, 0.36, 0]], 0.006, o.metal, 6));
        c.add(cyl(0.008, 0.008, 0.08, candle(), k * 0.09, 0.4, 0, 8));
      });
      g.add(c);
    });
    shadowAll(g);
    coal.castShadow = false;
    const glow = new THREE.PointLight("#ff8a40", 0.5, 3, 2);
    glow.position.set(0, 0.35, 0.4);
    g.add(glow);
    return g;
  }

  /* ---------- Soft furnishings ---------- */

  // Pair of velvet curtains gathered to the sides of a window, with a gilt pelmet (XY plane, facing +Z)
  function drapes(w, h, colour, o) {
    o = Object.assign({ metal: L.gilt() }, o);
    const g = new THREE.Group();
    const m = P.mat("velvet", { base: colour, sheen: 1, sheenColor: "#ffffff", side: THREE.DoubleSide, scale: 0.6 });
    [-1, 1].forEach((s) => {
      const pw = w * 0.3;
      const geo = new THREE.PlaneGeometry(pw, h, 40, 12);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i);
        const t = (y + h / 2) / h;                  // 0 bottom .. 1 top
        const gather = 1 - 0.45 * Math.exp(-Math.pow((t - 0.38) / 0.12, 2)); // tie-back pinch
        p.setX(i, x * gather);
        p.setZ(i, Math.sin((x / pw) * Math.PI * 9) * 0.035 * (0.6 + 0.4 * (1 - gather)) + 0.04);
      }
      geo.computeVertexNormals();
      const c = new THREE.Mesh(geo, m);
      c.position.set(s * (w / 2 - pw / 2 + 0.05), h / 2, 0);
      g.add(c);
      const tb = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16), o.metal);
      tb.position.set(s * (w / 2 - pw / 2 + 0.05), h * 0.38, 0.08);
      g.add(tb);
      g.add(lathe([[0, 0], [0.025, 0.02], [0.03, 0.1], [0, 0.14]], o.metal, 10, s * (w / 2 - pw / 2 + 0.05), h * 0.38 - 0.2, 0.09));
    });
    // swagged pelmet
    g.add(rbox(w + 0.2, 0.18, 0.12, 0.03, o.metal, 0, h + 0.05, 0.06));
    const sw = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.5, 0.06, 32, 1, true, Math.PI * 0.75, Math.PI * 0.5), m);
    sw.rotation.x = Math.PI / 2; sw.scale.set(1, 1, 0.5); sw.position.set(0, h + w * 0.5 * 0.71 - 0.25, 0.1);
    g.add(sw);
    g.traverse((x) => { if (x.isMesh) x.castShadow = true; });
    return g;
  }

  // Aubusson / Savonnerie carpet, flat on the floor
  const rugTex = {};
  function rug(w, d, pal) {
    pal = Object.assign({ field: "#d9c8a8", border: "#5c2632", accent: "#2f4a5a", flower: "#b05a6a", leaf: "#5a7a4a" }, pal);
    const key = JSON.stringify(pal) + w.toFixed(1) + d.toFixed(1);
    if (!rugTex[key]) {
      const c = document.createElement("canvas");
      const W = 1024, H = Math.round(1024 * d / w);
      c.width = W; c.height = H;
      const g = c.getContext("2d");
      const rnd = (n) => P.hash(n);
      g.fillStyle = pal.field; g.fillRect(0, 0, W, H);
      const b = W * 0.08;
      g.fillStyle = pal.border; g.fillRect(0, 0, W, H);
      g.fillStyle = pal.field; g.fillRect(b, b, W - 2 * b, H - 2 * b);
      g.strokeStyle = pal.accent; g.lineWidth = 6; g.strokeRect(b * 0.35, b * 0.35, W - b * 0.7, H - b * 0.7);
      g.strokeRect(b + 10, b + 10, W - 2 * b - 20, H - 2 * b - 20);
      const flower = (x, y, r, col) => {
        g.fillStyle = col;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, r * 0.3, a, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = pal.field; g.beginPath(); g.arc(x, y, r * 0.25, 0, Math.PI * 2); g.fill();
      };
      const leaf = (x, y, a, s) => { g.fillStyle = pal.leaf; g.beginPath(); g.ellipse(x, y, s, s * 0.35, a, 0, Math.PI * 2); g.fill(); };
      // border garland
      for (let i = 0; i < 40; i++) {
        const t = i / 40, per = 2 * (W + H);
        let p = t * per, x, y;
        if (p < W) { x = p; y = b / 2; } else if (p < W + H) { x = W - b / 2; y = p - W; } else if (p < 2 * W + H) { x = 2 * W + H - p; y = H - b / 2; } else { x = b / 2; y = per - p; }
        leaf(x + 14, y + 6, rnd(i) * 3, 14);
        flower(x, y, 14, i % 2 ? pal.flower : "#e8d6b8");
      }
      // central medallion
      g.save(); g.translate(W / 2, H / 2);
      g.fillStyle = pal.accent; g.beginPath(); g.ellipse(0, 0, W * 0.22, H * 0.2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = pal.field; g.beginPath(); g.ellipse(0, 0, W * 0.2, H * 0.18, 0, 0, Math.PI * 2); g.fill();
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; leaf(Math.cos(a) * W * 0.13, Math.sin(a) * H * 0.12, a, 22); flower(Math.cos(a + 0.2) * W * 0.15, Math.sin(a + 0.2) * H * 0.14, 16, i % 3 ? pal.flower : "#e6cfa6"); }
      flower(0, 0, 40, pal.flower);
      g.restore();
      // corner sprays and scattered posies
      [[b * 2, b * 2], [W - b * 2, b * 2], [b * 2, H - b * 2], [W - b * 2, H - b * 2]].forEach(([x, y], i) => { for (let k = 0; k < 5; k++) { leaf(x + Math.cos(k) * 30, y + Math.sin(k) * 30, k, 18); } flower(x, y, 20, pal.flower); });
      for (let i = 0; i < 26; i++) flower(b * 1.5 + rnd(i * 7) * (W - b * 3), b * 1.5 + rnd(i * 13) * (H - b * 3), 8, i % 2 ? pal.flower : pal.accent);
      // wool texture
      const img = g.getImageData(0, 0, W, H), dd = img.data;
      for (let i = 0; i < dd.length; i += 4) { const n = (rnd(i) - 0.5) * 18; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; }
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
      rugTex[key] = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.95, sheen: 0.6, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.6 });
    }
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), rugTex[key]);
    r.position.y = 0.006;
    r.receiveShadow = true;
    r.userData.noMerge = true;
    return r;
  }

  /* ---------- Winter-garden furniture ---------- */

  // White-painted wrought-iron garden chair
  function gardenChair(o) {
    o = Object.assign({ iron: L.whiteIron(), cushion: velvet("#7a9a7a") }, o);
    const g = new THREE.Group(), m = o.iron, r = 0.011;
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.014, 6, 28), m);
    seat.rotation.x = Math.PI / 2; seat.position.y = 0.45;
    g.add(seat);
    g.add(cyl(0.2, 0.2, 0.05, o.cushion, 0, 0.48, 0, 24));
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => g.add(tube([[sx * 0.2, 0, sz * 0.2], [sx * 0.15, 0.25, sz * 0.15], [sx * 0.15, 0.45, sz * 0.15]], r, m, 8)));
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + 0.35 + (i / 4) * (Math.PI - 0.7);
      g.add(tube([[Math.cos(a) * 0.19, 0.46, -Math.abs(Math.sin(a)) * 0.19 * 1], [Math.cos(a) * 0.22, 0.75, -Math.abs(Math.sin(a)) * 0.24], [Math.cos(a) * 0.24, 0.92, -Math.abs(Math.sin(a)) * 0.25]], r * 0.8, m, 8));
    }
    const back = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 6, 24, Math.PI - 0.6), m);
    back.position.y = 0.92; back.rotation.set(Math.PI / 2, 0, Math.PI + 0.3);
    g.add(back);
    [-1, 1].forEach((s) => { const sc = K.scroll(0.05, 1.3, 0.006, m); sc.position.set(s * 0.1, 0.25, 0.15); g.add(sc); });
    shadowAll(g);
    g.add(K.blob(0.65, 0.65, 0.35));
    return g;
  }

  // Wicker peacock armchair (very fashionable in 1899)
  function peacockChair(o) {
    o = Object.assign({ cane: P.mat("wicker", { base: "#b08a52", scale: 0.15, side: THREE.DoubleSide }), cushion: velvet("#b76e79") }, o);
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.3, 0], [0.24, 0.1], [0.12, 0.3], [0.25, 0.42], [0, 0.42]], o.cane, 24));
    g.add(cyl(0.3, 0.28, 0.08, o.cane, 0, 0.46, 0, 28));
    g.add(cyl(0.27, 0.27, 0.08, o.cushion, 0, 0.53, 0.02, 28));
    // the great fan-shaped back, open toward the front (+Z)
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.29, 0.95, 32, 1, true, Math.PI * 0.42, Math.PI * 1.16), o.cane);
    fan.position.set(0, 0.95, -0.02); fan.scale.set(1, 1, 0.62);
    g.add(fan);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.028, 8, 40, Math.PI * 1.16), o.cane);
    rim.position.set(0, 1.425, -0.02); rim.rotation.set(Math.PI / 2, 0, Math.PI / 2 - Math.PI * 1.58); rim.scale.set(1, 0.62, 1);
    g.add(rim);
    // woven roundels in the back
    for (let i = 0; i < 5; i++) { const a = Math.PI * (0.65 + i * 0.175); const r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 6, 16), o.cane); r.position.set(Math.sin(a) * 0.5, 1.2, Math.cos(a) * 0.5 * 0.62 - 0.02); r.lookAt(0, 1.2, -0.02); g.add(r); }
    shadowAll(g);
    g.add(K.blob(0.9, 0.8, 0.4));
    return g;
  }

  function gardenTable(o) {
    o = Object.assign({ iron: L.whiteIron(), top: L.whiteMarble() }, o);
    const g = gueridon({ top: o.top, metal: o.iron, r: 0.4, h: 0.72 });
    return g;
  }

  // Stone fountain: round basin, tiered bowls, animated water surface
  function fountain(o) {
    o = Object.assign({ stone: P.mat("limestone", { scale: 1.2 }), r: 1.1 }, o);
    const g = new THREE.Group();
    const R = o.r;
    g.add(lathe([[R - 0.15, 0], [R + 0.08, 0], [R + 0.1, 0.06], [R + 0.05, 0.1], [R + 0.08, 0.42], [R + 0.12, 0.46], [R + 0.08, 0.5], [R - 0.1, 0.5], [R - 0.12, 0.08], [0, 0.08]], o.stone, 48));
    const water = new THREE.Mesh(new THREE.CircleGeometry(R - 0.1, 48), once("water", () => new THREE.MeshPhysicalMaterial({ color: "#1a3a3a", roughness: 0.02, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.85, envMapIntensity: 1.6 })));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.4;
    water.userData.noMerge = true;
    g.add(water);
    g.add(lathe([[0, 0], [0.18, 0], [0.12, 0.1], [0.08, 0.6], [0.14, 0.75], [0.6, 0.85], [0.62, 0.9], [0.55, 0.92], [0.1, 0.88], [0.08, 1.2], [0.3, 1.3], [0.32, 1.34], [0.06, 1.34], [0.05, 1.6], [0.08, 1.65], [0, 1.7]], o.stone, 32, 0, 0.08, 0));
    // water sheets spilling from the bowls
    const sheetM = once("sheet", () => new THREE.MeshStandardMaterial({ color: "#d8eef0", transparent: true, opacity: 0.07, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
    [[0.6, 0.92, 0.5], [0.31, 1.34, 0.42]].forEach(([r, y, h]) => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.04, r + 0.12, h, 32, 1, true), sheetM);
      s.position.y = y + 0.08 - h / 2;
      s.userData.noMerge = true;
      g.add(s);
    });
    shadowAll(g);
    water.castShadow = false;
    g.userData.water = water;
    return g;
  }

  // Versailles planter box (square, painted, with finials)
  function planterBox(s, o) {
    o = Object.assign({ wood: paint("#e9e6dd", 0.5), iron: L.iron(), soil: once("soil", () => new THREE.MeshStandardMaterial({ color: "#2a1d14", roughness: 1 })) }, o);
    const g = new THREE.Group();
    g.add(rbox(s, s * 0.9, s, 0.02, o.wood, 0, s * 0.45 + 0.06, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(a) * s * 0.7, z = Math.sin(a) * s * 0.7;
      g.add(bx(0.06, s * 0.9 + 0.08, 0.06, o.wood, x, s * 0.45 + 0.04, z));
      g.add(sphere(0.045, o.wood, x, s * 0.9 + 0.13, z, 10, 8));
      g.add(cyl(0.035, 0.03, 0.06, o.wood, x, 0.03, z, 8));
    }
    [-1, 1].forEach((sd) => g.add(bx(s + 0.02, 0.02, 0.01, o.iron, 0, s * 0.3, sd * (s / 2 + 0.005))));
    g.add(bx(s - 0.04, 0.02, s - 0.04, o.soil, 0, s * 0.9 + 0.05, 0));
    shadowAll(g);
    g.add(K.blob(s + 0.5, s + 0.5, 0.45));
    return g;
  }

  // Interior door leaf pair (open), with glazed panels
  function doubleDoor(w, h, o) {
    o = Object.assign({ wood: paint("#e8e2d2", 0.45), mount: L.gilt(), open: 1.3 }, o);
    const g = new THREE.Group();
    [-1, 1].forEach((s) => {
      const pivot = new THREE.Group();
      pivot.position.set(s * w / 2, 0, 0);
      const leaf = new THREE.Group();
      leaf.position.x = -s * w / 4;
      leaf.add(rbox(w / 2 - 0.01, h, 0.05, 0.01, o.wood, 0, h / 2, 0));
      leaf.add(frame(w / 2 - 0.16, h * 0.55, 0.03, 0.02, o.mount, 0, h * 0.62, 0.025));
      leaf.add(frame(w / 2 - 0.16, h * 0.22, 0.03, 0.02, o.mount, 0, h * 0.18, 0.025));
      const pane = bx(w / 2 - 0.22, h * 0.5, 0.006, glass(), 0, h * 0.62, 0.03);
      pane.userData.noMerge = true;
      leaf.add(pane);
      leaf.add(cyl(0.012, 0.012, 0.14, o.mount, -s * (w / 4 - 0.06), h * 0.48, 0.05, 8));
      pivot.add(leaf);
      pivot.rotation.y = s * o.open;
      g.add(pivot);
    });
    shadowAll(g);
    return g;
  }

  RC.furn = {
    glass, glassTint, crystal, porcelain, velvet, paint, silk, flame, candle,
    vitrineWall, vitrineTable, vitrineTower, counter,
    bergere, cabriolet, canape, bistroChair, barStool, banquette,
    gueridon, consoleTable, lowTable, bureau,
    barCounter, backBar, pastryCase, bottle, cake, macaron, macaronTower, cakeStand, cupAndSaucer, teapot, coupe, champagneSet,
    chandelier, sconce, mirror, fireplace, drapes, rug,
    gardenChair, peacockChair, gardenTable, fountain, planterBox, doubleDoor,
  };
})();
