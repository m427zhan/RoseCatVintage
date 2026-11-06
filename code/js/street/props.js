/* Materials, shop items, shopkeepers and the player's first-person hands.
   Everything is built from simple shapes, so no 3D model files are needed.
   Item origins sit at their base (y = 0) so they can be placed on shelves. */

(function () {
  const V2 = THREE.Vector2;
  const matCache = {};

  // mat(color, { r: roughness, m: metalness, e: emissive, ei, o: opacity, w: wireframe, side, map })
  function mat(color, o) {
    o = o || {};
    const key = color + JSON.stringify(o, (k, v) => (k === "map" ? v.uuid : v));
    if (matCache[key]) return matCache[key];
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.r !== undefined ? o.r : 0.75,
      metalness: o.m || 0,
      emissive: o.e || "#000000",
      emissiveIntensity: o.ei !== undefined ? o.ei : 1,
      transparent: o.o !== undefined && o.o < 1,
      opacity: o.o !== undefined ? o.o : 1,
      wireframe: !!o.w,
      side: o.side || THREE.FrontSide,
      map: o.map || null,
      depthWrite: !(o.o !== undefined && o.o < 1),
    });
    matCache[key] = m;
    return m;
  }

  const GOLD = () => mat("#d9b15a", { m: 0.9, r: 0.28 });
  const SILVER = () => mat("#d6d7dc", { m: 0.9, r: 0.22 });
  const BRASS = () => mat("#b8933f", { m: 0.8, r: 0.35 });
  const GLASS = () => mat("#cfe6ee", { o: 0.22, r: 0.05, m: 0.1 });
  const DARKWOOD = () => mat("#4a2e1c", { r: 0.6 });

  function mesh(geo, m, x, y, z) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x || 0, y || 0, z || 0);
    return o;
  }
  function lathe(pts, m, seg) {
    return new THREE.Mesh(new THREE.LatheGeometry(pts.map((p) => new V2(p[0], p[1])), seg || 28), m);
  }
  function box(w, h, d, m, x, y, z) {
    return mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);
  }
  function cyl(rt, rb, h, m, x, y, z, seg) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m, x, y + h / 2, z);
  }
  function sphere(r, m, x, y, z) {
    return mesh(new THREE.SphereGeometry(r, 16, 12), m, x, y, z);
  }
  function cushion(color, w, d) {
    return box(w || 0.12, 0.025, d || 0.12, mat(color, { r: 1 }), 0, 0, 0);
  }

  /* ---------------- Shop items ---------------- */
  const items = {
    // Fine jewellery
    bust() {
      const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.09, 0], [0.1, 0.04], [0.075, 0.16], [0.04, 0.24], [0.032, 0.32], [0.045, 0.34], [0, 0.34]], mat("#141414", { r: 1 })));
      const n = mesh(new THREE.TorusGeometry(0.048, 0.006, 8, 32), mat("#f4efe6", { r: 0.25, m: 0.2 }), 0, 0.24, 0.018);
      n.rotation.x = Math.PI / 2 - 0.5;
      g.add(n);
      g.add(sphere(0.014, mat("#8a1020", { r: 0.1, m: 0.2, e: "#300008" }), 0, 0.205, 0.062));
      return g;
    },
    ringbox() {
      const g = new THREE.Group();
      const red = mat("#6d1020", { r: 1 });
      g.add(box(0.07, 0.045, 0.07, red, 0, 0, 0));
      const lid = box(0.07, 0.012, 0.07, red, 0, 0, 0);
      lid.position.set(0, 0.06, -0.04); lid.rotation.x = -1.2;
      g.add(lid);
      const ring = mesh(new THREE.TorusGeometry(0.016, 0.004, 8, 24), GOLD(), 0, 0.062, 0);
      g.add(ring);
      g.add(sphere(0.006, mat("#bfe8ff", { r: 0.05, m: 0.3, e: "#20303a" }), 0, 0.08, 0));
      return g;
    },
    watch() {
      const g = new THREE.Group();
      g.add(cushion("#1d2a4a", 0.12, 0.1));
      const w = new THREE.Group();
      w.position.set(0, 0.058, 0);
      w.rotation.x = -0.35;
      const caseM = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 28), GOLD());
      caseM.rotation.x = Math.PI / 2;
      const face = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.013, 28), mat("#f3ecd8", { r: 0.4 }), 0, 0, 0.001);
      face.rotation.x = Math.PI / 2;
      w.add(caseM, face);
      w.add(mesh(new THREE.TorusGeometry(0.008, 0.002, 6, 12), GOLD(), 0, 0.037, 0));
      w.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8), GOLD(), 0, 0.031, 0));
      g.add(w);
      return g;
    },
    brooch() {
      const g = new THREE.Group();
      g.add(cushion("#2a1a3a", 0.11, 0.11));
      const c = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 28), mat("#e7c3ad", { r: 0.5 }), 0, 0.03, 0);
      c.scale.set(1, 1, 1.3);
      g.add(c);
      const rim = mesh(new THREE.TorusGeometry(0.03, 0.003, 6, 32), GOLD(), 0, 0.034, 0);
      rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.3, 1);
      g.add(rim);
      g.add(sphere(0.008, mat("#fff8ee", { r: 0.5 }), 0, 0.036, 0.004));
      return g;
    },
    earrings() {
      const g = new THREE.Group();
      g.add(cyl(0.03, 0.035, 0.012, DARKWOOD(), 0, 0, 0));
      g.add(cyl(0.004, 0.004, 0.14, GOLD(), 0, 0.012, 0));
      g.add(box(0.1, 0.006, 0.006, GOLD(), 0, 0.15, 0));
      [-0.04, 0.04].forEach((x) => {
        g.add(cyl(0.001, 0.001, 0.03, GOLD(), x, 0.12, 0, 4));
        g.add(sphere(0.009, mat("#2f8a5a", { r: 0.1, m: 0.3, e: "#06200f" }), x, 0.115, 0));
      });
      return g;
    },

    // Charms
    locket() {
      const g = new THREE.Group();
      g.add(cushion("#4a1a3a", 0.12, 0.12));
      const s = new THREE.Shape();
      s.moveTo(0, -0.03);
      s.bezierCurveTo(0.035, -0.005, 0.03, 0.03, 0, 0.015);
      s.bezierCurveTo(-0.03, 0.03, -0.035, -0.005, 0, -0.03);
      const h = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2 }), GOLD(), 0, 0.05, 0);
      g.add(h);
      const ch = mesh(new THREE.TorusGeometry(0.04, 0.0015, 4, 40), GOLD(), 0, 0.027, 0);
      ch.rotation.x = Math.PI / 2;
      g.add(ch);
      return g;
    },
    horseshoe() {
      const g = new THREE.Group();
      g.add(cyl(0.03, 0.035, 0.01, DARKWOOD(), 0, 0, 0));
      const t = mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 24, Math.PI * 1.45), SILVER(), 0, 0.055, 0);
      t.rotation.z = -Math.PI * 0.225 + Math.PI;
      g.add(t);
      g.add(cyl(0.003, 0.003, 0.02, SILVER(), 0, 0.01, 0, 4));
      return g;
    },
    key() {
      const g = new THREE.Group();
      g.add(cushion("#3a2a1a", 0.16, 0.08));
      const k = new THREE.Group();
      const shaft = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 8), BRASS());
      shaft.rotation.z = Math.PI / 2;
      k.add(shaft);
      const bow = mesh(new THREE.TorusGeometry(0.015, 0.004, 6, 20), BRASS(), -0.064, 0, 0);
      k.add(bow);
      k.add(mesh(new THREE.BoxGeometry(0.008, 0.018, 0.004), BRASS(), 0.042, -0.009, 0));
      k.add(mesh(new THREE.BoxGeometry(0.006, 0.012, 0.004), BRASS(), 0.03, -0.006, 0));
      k.rotation.x = -Math.PI / 2;
      k.position.y = 0.03;
      g.add(k);
      return g;
    },
    bracelet() {
      const g = new THREE.Group();
      g.add(cushion("#203a3a", 0.13, 0.13));
      const b = mesh(new THREE.TorusGeometry(0.042, 0.003, 6, 40), GOLD(), 0, 0.03, 0);
      b.rotation.x = Math.PI / 2;
      g.add(b);
      const cols = ["#d9b15a", "#c0c0c8", "#8a1020", "#2f8a5a", "#3a5aa0", "#d9b15a", "#e8d0d8"];
      cols.forEach((c, i) => {
        const a = (i / cols.length) * Math.PI * 2;
        const charm = mesh(i % 2 ? new THREE.OctahedronGeometry(0.008) : new THREE.SphereGeometry(0.007, 10, 8),
          mat(c, { m: 0.6, r: 0.3 }), Math.cos(a) * 0.05, 0.03, Math.sin(a) * 0.05);
        g.add(charm);
      });
      return g;
    },
    jar() {
      const g = new THREE.Group();
      const cols = ["#d9b15a", "#c0c0c8", "#8a1020", "#2f8a5a", "#3a5aa0", "#e8d0d8"];
      for (let i = 0; i < 14; i++) {
        g.add(sphere(0.014, mat(cols[i % cols.length], { m: 0.6, r: 0.3 }),
          Math.cos(i * 2.4) * 0.03, 0.02 + (i % 5) * 0.018, Math.sin(i * 2.4) * 0.03));
      }
      g.add(cyl(0.06, 0.06, 0.16, GLASS(), 0, 0, 0, 24));
      g.add(cyl(0.064, 0.064, 0.02, BRASS(), 0, 0.16, 0, 24));
      return g;
    },

    // Home decor
    lamp() {
      const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.09, 0], [0.09, 0.02], [0.03, 0.05], [0.02, 0.1], [0.015, 0.32], [0, 0.32]], BRASS()));
      const shade = lathe([[0.16, 0.26], [0.07, 0.48], [0.068, 0.48], [0.158, 0.26]],
        mat("#f0d8a8", { e: "#ffb050", ei: 0.9, side: THREE.DoubleSide, r: 0.9 }));
      g.add(shade);
      g.add(sphere(0.03, mat("#fff2cc", { e: "#ffd080", ei: 2 }), 0, 0.34, 0));
      return g;
    },
    vase() {
      const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.06, 0], [0.065, 0.01], [0.11, 0.1], [0.12, 0.17], [0.08, 0.27], [0.045, 0.32], [0.06, 0.36], [0.055, 0.365], [0.04, 0.33], [0, 0.32]],
        mat("#2f5d8a", { r: 0.15, m: 0.1 })));
      const band = mesh(new THREE.TorusGeometry(0.117, 0.006, 6, 40), GOLD(), 0, 0.17, 0);
      band.rotation.x = Math.PI / 2;
      g.add(band);
      return g;
    },
    clock() {
      const g = new THREE.Group();
      const w = mat("#5a3420", { r: 0.45 });
      g.add(box(0.28, 0.03, 0.13, w, 0, 0, 0));
      g.add(box(0.24, 0.22, 0.11, w, 0, 0.03, 0));
      const arch = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.11, 24, 1, false, -Math.PI / 2, Math.PI), w, 0, 0.25, 0);
      arch.rotation.x = Math.PI / 2;
      arch.rotation.z = Math.PI / 2;
      g.add(arch);
      const face = mesh(new THREE.CircleGeometry(0.075, 32), mat("#ffffff", { map: RC.tex.clockFace(), r: 0.5 }), 0, 0.2, 0.056);
      g.add(face);
      const rim = mesh(new THREE.TorusGeometry(0.077, 0.006, 6, 32), BRASS(), 0, 0.2, 0.056);
      g.add(rim);
      return g;
    },
    mirror() {
      const g = new THREE.Group();
      const f = new THREE.Group();
      f.add(box(0.42, 0.56, 0.035, GOLD(), 0, 0, 0));
      f.add(box(0.34, 0.48, 0.01, mat("#c9d2d6", { m: 1, r: 0.04 }), 0, 0.04, 0.02));
      f.add(sphere(0.03, GOLD(), 0, 0.58, 0));
      f.rotation.x = -0.12;
      f.position.z = 0.04;
      g.add(f);
      return g;
    },
    candlestick() {
      const g = new THREE.Group();
      [-0.06, 0.06].forEach((x) => {
        const c = lathe([[0, 0], [0.045, 0], [0.04, 0.02], [0.012, 0.05], [0.02, 0.1], [0.01, 0.16], [0.022, 0.2], [0.018, 0.21], [0, 0.21]], BRASS());
        c.position.x = x;
        g.add(c);
        g.add(cyl(0.011, 0.011, 0.1, mat("#f4eee0", { r: 0.8 }), x, 0.21, 0));
        g.add(sphere(0.008, mat("#ffcc66", { e: "#ffaa33", ei: 2 }), x, 0.325, 0));
      });
      return g;
    },

    // Clothing
    dressform() {
      const g = new THREE.Group();
      g.add(cyl(0.18, 0.2, 0.03, DARKWOOD(), 0, 0, 0));
      g.add(lathe([[0, 0.03], [0.34, 0.05], [0.3, 0.3], [0.22, 0.72], [0.14, 0.95], [0.155, 1.12], [0.175, 1.28], [0.08, 1.4], [0.045, 1.44], [0, 1.45]],
        mat("#7a3b4a", { r: 0.9 })));
      g.add(cyl(0.025, 0.025, 0.08, DARKWOOD(), 0, 1.44, 0));
      g.add(sphere(0.035, DARKWOOD(), 0, 1.55, 0));
      const lace = mesh(new THREE.TorusGeometry(0.155, 0.012, 6, 32), mat("#f1e8da", { r: 1 }), 0, 1.12, 0);
      lace.rotation.x = Math.PI / 2;
      g.add(lace);
      return g;
    },
    bolt() {
      const g = new THREE.Group();
      const b = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.62, 20), mat("#5a6a3a", { r: 1 }), 0, 0.07, 0);
      b.rotation.z = Math.PI / 2;
      g.add(b);
      const end = mat("#c9b48a", { r: 0.9 });
      [-0.315, 0.315].forEach((x) => {
        const e = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12), end, x, 0.07, 0);
        e.rotation.z = Math.PI / 2;
        g.add(e);
      });
      return g;
    },
    coat() {
      const g = new THREE.Group();
      g.add(cyl(0.18, 0.2, 0.03, DARKWOOD(), 0, 0, 0));
      g.add(cyl(0.02, 0.02, 1.7, DARKWOOD(), 0, 0, 0));
      g.add(lathe([[0, 0.55], [0.26, 0.55], [0.24, 0.9], [0.2, 1.3], [0.23, 1.5], [0.12, 1.58], [0, 1.6]], mat("#2a2f3a", { r: 0.95 })));
      [-0.06, 0.06].forEach((x) => [0.95, 1.1, 1.25].forEach((y) => g.add(sphere(0.012, BRASS(), x, y, 0.21))));
      g.add(sphere(0.035, DARKWOOD(), 0, 1.72, 0));
      return g;
    },
    folded() {
      const g = new THREE.Group();
      ["#f4f0e6", "#c9d6e8", "#f4f0e6"].forEach((c, i) => {
        const b = box(0.3, 0.05, 0.24, mat(c, { r: 1 }), 0, i * 0.05, 0);
        b.rotation.y = (i - 1) * 0.06;
        g.add(b);
      });
      return g;
    },

    // Accessories
    tophat() {
      const g = new THREE.Group();
      const silk = mat("#151515", { r: 0.35, m: 0.1 });
      g.add(cyl(0.16, 0.16, 0.01, silk, 0, 0, 0, 32));
      g.add(cyl(0.1, 0.095, 0.17, silk, 0, 0.01, 0, 32));
      g.add(cyl(0.097, 0.097, 0.03, mat("#2a2a2a", { r: 0.7 }), 0, 0.012, 0, 32));
      return g;
    },
    boater() {
      const g = new THREE.Group();
      const straw = mat("#d8c08a", { r: 0.9 });
      g.add(cyl(0.17, 0.17, 0.01, straw, 0, 0, 0, 32));
      g.add(cyl(0.1, 0.1, 0.07, straw, 0, 0.01, 0, 32));
      g.add(cyl(0.102, 0.102, 0.025, mat("#1f2c4d", { r: 0.8 }), 0, 0.012, 0, 32));
      return g;
    },
    gloves() {
      const g = new THREE.Group();
      const kid = mat("#6a4430", { r: 0.6 });
      [-0.055, 0.055].forEach((x, i) => {
        const h = new THREE.Group();
        h.add(box(0.075, 0.015, 0.1, kid, 0, 0, 0));
        for (let f = 0; f < 4; f++) h.add(box(0.014, 0.012, 0.07 - Math.abs(f - 1.5) * 0.012, kid, -0.027 + f * 0.018, 0, -0.08));
        h.add(box(0.07, 0.016, 0.07, kid, 0, 0, 0.08));
        h.rotation.y = (i ? -1 : 1) * 0.15;
        h.position.set(x, 0, 0.02);
        g.add(h);
      });
      return g;
    },
    umbrella() {
      const g = new THREE.Group();
      g.add(cyl(0.006, 0.006, 0.9, DARKWOOD(), 0, 0, 0, 8));
      const canopy = lathe([[0.36, 0.62], [0.25, 0.74], [0.1, 0.81], [0, 0.83]], mat("#f3ece0", { r: 0.95, side: THREE.DoubleSide }), 10);
      g.add(canopy);
      const trim = mesh(new THREE.TorusGeometry(0.36, 0.008, 4, 10), mat("#e7d8c8", { r: 1 }), 0, 0.62, 0);
      trim.rotation.x = Math.PI / 2;
      g.add(trim);
      g.add(sphere(0.02, mat("#f2ead8", { r: 0.4 }), 0, 0.92, 0));
      g.add(cyl(0.12, 0.14, 0.015, DARKWOOD(), 0, 0, 0));
      return g;
    },
    handbag() {
      const g = new THREE.Group();
      g.add(box(0.2, 0.14, 0.07, mat("#5a1f4a", { r: 0.5, m: 0.2 }), 0, 0, 0));
      g.add(box(0.2, 0.012, 0.072, GOLD(), 0, 0.14, 0));
      const h = mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 24, Math.PI), GOLD(), 0, 0.15, 0);
      g.add(h);
      return g;
    },

    // Curiosities
    globe() {
      const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.1, 0], [0.09, 0.02], [0.02, 0.05], [0.018, 0.14], [0, 0.14]], DARKWOOD()));
      const tilt = new THREE.Group();
      tilt.position.y = 0.29;
      tilt.rotation.z = 0.41;
      tilt.add(sphere(0.14, mat("#3e6a6a", { r: 0.5 })));
      const land = mat("#c9b27a", { r: 0.6 });
      [[0.6, 0.3], [2.2, -0.2], [3.9, 0.5], [5.0, -0.6]].forEach(([a, b]) => {
        const l = sphere(0.05, land, Math.cos(a) * 0.1 * Math.cos(b), Math.sin(b) * 0.1, Math.sin(a) * 0.1 * Math.cos(b));
        l.scale.set(1, 0.6, 1);
        tilt.add(l);
      });
      const mer = mesh(new THREE.TorusGeometry(0.155, 0.006, 6, 40), BRASS());
      tilt.add(mer);
      g.add(tilt);
      return g;
    },
    gramophone() {
      const g = new THREE.Group();
      g.add(box(0.28, 0.12, 0.28, mat("#5a3420", { r: 0.45 }), 0, 0, 0));
      g.add(cyl(0.11, 0.11, 0.008, mat("#111111", { r: 0.3 }), 0, 0.12, 0, 32));
      g.add(cyl(0.008, 0.008, 0.12, BRASS(), 0.1, 0.12, -0.1, 8));
      const horn = lathe([[0.012, 0], [0.02, 0.12], [0.05, 0.24], [0.13, 0.32], [0.2, 0.35]], mat("#c99a40", { m: 0.75, r: 0.3, side: THREE.DoubleSide }), 24);
      horn.position.set(0.1, 0.24, -0.1);
      horn.rotation.x = 0.9;
      g.add(horn);
      return g;
    },
    books() {
      const g = new THREE.Group();
      const cols = ["#5a1f1f", "#1f3a2a", "#2a2a4a", "#6a4a1a"];
      let y = 0;
      cols.forEach((c, i) => {
        const h = 0.035 + (i % 2) * 0.015;
        const b = box(0.22 - i * 0.015, h, 0.16 - i * 0.008, mat(c, { r: 0.8 }), 0, y, 0);
        b.rotation.y = (i % 2 ? 1 : -1) * 0.12 * i;
        g.add(b);
        y += h;
      });
      return g;
    },
    telescope() {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const leg = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6), DARKWOOD(), Math.cos(a) * 0.08, 0.24, Math.sin(a) * 0.08);
        leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
        g.add(leg);
      }
      const tube = new THREE.Group();
      tube.position.y = 0.5;
      tube.rotation.z = 0.35;
      const t1 = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 20), BRASS());
      t1.rotation.z = Math.PI / 2;
      tube.add(t1);
      const t2 = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 20), BRASS(), -0.28, 0, 0);
      t2.rotation.z = Math.PI / 2;
      tube.add(t2);
      g.add(tube);
      return g;
    },
    birdcage() {
      const g = new THREE.Group();
      g.add(cyl(0.13, 0.14, 0.03, GOLD(), 0, 0, 0, 24));
      g.add(cyl(0.12, 0.12, 0.3, mat("#d9b15a", { m: 0.8, r: 0.3, w: true }), 0, 0.03, 0, 16));
      const dome = mesh(new THREE.SphereGeometry(0.12, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat("#d9b15a", { m: 0.8, r: 0.3, w: true }), 0, 0.33, 0);
      g.add(dome);
      const ring = mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16), GOLD(), 0, 0.48, 0);
      g.add(ring);
      return g;
    },
  };

  function makeItem(kind) {
    const make = items[kind] || (RC.extraItems && RC.extraItems[kind]) || items.books;
    const g = make();
    g.userData.kind = kind;
    return g;
  }

  /* ---------------- Shopkeepers ---------------- */
  // Returns { group, head, mouth }. Stands about 1.72 m tall, facing +Z.
  function makeKeeper(k) {
    const g = new THREE.Group();
    const skin = mat("#e8c6a8", { r: 0.7 });
    const hair = mat(k.hair || "#3a2a1e", { r: 0.9 });
    const white = mat("#f3eee4", { r: 0.8 });

    if (k.look === "f") {
      const dress = mat(k.dress || "#3b5a7a", { r: 0.9 });
      g.add(lathe([[0, 0], [0.38, 0], [0.33, 0.25], [0.24, 0.7], [0.17, 0.98], [0.14, 1.05], [0, 1.05]], dress));
      g.add(lathe([[0, 1.0], [0.15, 1.0], [0.13, 1.08], [0.15, 1.25], [0.17, 1.36], [0.06, 1.45], [0, 1.45]], mat(k.blouse || "#f1e8da", { r: 0.9 })));
      if (k.apron) g.add(box(0.32, 0.6, 0.02, white, 0, 0.42, 0.2));
      [-1, 1].forEach((s) => {
        const sh = sphere(0.075, mat(k.blouse || "#f1e8da", { r: 0.9 }), s * 0.17, 1.34, 0);
        sh.scale.set(1, 1.15, 1);
        g.add(sh);
        const arm = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.42, 10), dress, s * 0.2, 1.14, 0.1);
        arm.rotation.x = -0.6;
        g.add(arm);
        g.add(sphere(0.035, skin, s * 0.2, 0.98, 0.24));
      });
      g.add(cyl(0.045, 0.05, 0.1, white, 0, 1.42, 0, 14));
    } else {
      const coat = mat(k.coat || "#22222a", { r: 0.9 });
      const trousers = mat("#2a2a2a", { r: 0.9 });
      [-0.08, 0.08].forEach((x) => g.add(cyl(0.06, 0.06, 0.88, trousers, x, 0, 0, 10)));
      g.add(lathe([[0, 0.8], [0.19, 0.8], [0.18, 0.95], [0.17, 1.2], [0.2, 1.38], [0.08, 1.46], [0, 1.46]], coat));
      g.add(box(0.2, 0.42, 0.04, mat(k.vest || "#5b1f2b", { r: 0.8 }), 0, 0.94, 0.16));
      g.add(box(0.07, 0.16, 0.045, white, 0, 1.28, 0.165));
      g.add(box(0.06, 0.06, 0.05, mat("#1a1a1a", { r: 0.7 }), 0, 1.33, 0.17));
      [1.04, 1.12, 1.2].forEach((y) => g.add(sphere(0.01, mat("#d9b15a", { m: 0.8, r: 0.3 }), 0, y, 0.185)));
      if (k.tape) {
        const tape = mesh(new THREE.TorusGeometry(0.16, 0.008, 4, 24, Math.PI), mat("#e0c860", { r: 0.8 }), 0, 1.42, 0.02);
        tape.rotation.set(Math.PI / 2 + 0.25, 0, 0);
        g.add(tape);
      }
      [-1, 1].forEach((s) => {
        const arm = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.46, 10), coat, s * 0.22, 1.14, 0.1);
        arm.rotation.x = -0.6;
        g.add(arm);
        g.add(sphere(0.038, skin, s * 0.22, 0.97, 0.25));
      });
      g.add(cyl(0.045, 0.05, 0.1, white, 0, 1.42, 0, 14));
    }

    const head = new THREE.Group();
    head.position.y = 1.6;
    const face = sphere(0.105, skin, 0, 0, 0);
    face.scale.set(0.95, 1.12, 1);
    head.add(face);
    const cap = mesh(new THREE.SphereGeometry(0.112, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.012, -0.008);
    head.add(cap);
    if (k.look === "f") {
      head.add(sphere(0.06, hair, 0, 0.1, -0.06));
      const s1 = sphere(0.05, hair, -0.085, 0.03, -0.01);
      const s2 = sphere(0.05, hair, 0.085, 0.03, -0.01);
      head.add(s1, s2);
    } else {
      head.add(sphere(0.05, hair, -0.09, -0.01, -0.03), sphere(0.05, hair, 0.09, -0.01, -0.03));
    }
    const eye = mat("#1a1410", { r: 0.3 });
    head.add(sphere(0.012, eye, -0.035, 0.02, 0.095), sphere(0.012, eye, 0.035, 0.02, 0.095));
    head.add(sphere(0.016, skin, 0, -0.005, 0.105));
    const mouth = mesh(new THREE.BoxGeometry(0.035, 0.008, 0.01), mat("#7a3a3a", { r: 0.6 }), 0, -0.05, 0.097);
    head.add(mouth);
    if (k.moustache) {
      [-1, 1].forEach((s) => {
        const m = mesh(new THREE.CapsuleGeometry(0.01, 0.035, 3, 8), hair, s * 0.022, -0.03, 0.1);
        m.rotation.z = s * 1.2;
        head.add(m);
      });
    }
    if (k.spectacles) {
      const wire = mat("#c9a24a", { m: 0.8, r: 0.3 });
      [-1, 1].forEach((s) => head.add(mesh(new THREE.TorusGeometry(0.022, 0.003, 6, 20), wire, s * 0.035, 0.02, 0.105)));
      head.add(mesh(new THREE.BoxGeometry(0.02, 0.003, 0.003), wire, 0, 0.025, 0.107));
    }
    g.add(head);
    return { group: g, head, mouth };
  }

  /* ---------------- First-person hands ---------------- */
  // Each hand's origin is the wrist; fingers point along -Z, back of the hand up.
  function makeHand(s) {
    const root = new THREE.Group();
    const glove = mat("#7a4e32", { r: 0.55 });
    const palm = mesh(new THREE.BoxGeometry(0.082, 0.028, 0.09), glove, 0, 0, -0.045);
    root.add(palm);
    const knuckle = mesh(new THREE.CapsuleGeometry(0.013, 0.058, 3, 8), glove, 0, 0.002, -0.088);
    knuckle.rotation.z = Math.PI / 2;
    root.add(knuckle);

    function segment(r, L) {
      const geo = new THREE.CapsuleGeometry(r, L, 3, 8);
      geo.rotateX(Math.PI / 2);
      geo.translate(0, 0, -(L / 2 + r));
      return new THREE.Mesh(geo, glove);
    }

    const fingers = [];
    const xs = [-0.03, -0.01, 0.01, 0.03];        // index -> little finger
    const lens = [0.042, 0.047, 0.044, 0.034];
    xs.forEach((x, i) => {
      const k1 = new THREE.Group();
      k1.position.set(x * s, 0, -0.09);
      const L1 = lens[i] * 0.55, L2 = lens[i] * 0.45;
      k1.add(segment(0.0095, L1));
      const k2 = new THREE.Group();
      k2.position.z = -(L1 + 0.014);
      k2.add(segment(0.009, L2));
      k1.add(k2);
      root.add(k1);
      fingers.push([k1, k2]);
    });

    const t1 = new THREE.Group();
    t1.position.set(-0.038 * s, -0.006, -0.025);
    t1.rotation.set(0, 0.75 * s, -0.35 * s);
    t1.add(segment(0.011, 0.025));
    const t2 = new THREE.Group();
    t2.position.z = -0.042;
    t2.add(segment(0.01, 0.02));
    t1.add(t2);
    root.add(t1);

    const cuffGeo = new THREE.CylinderGeometry(0.044, 0.05, 0.06, 16, 1, true);
    cuffGeo.rotateX(Math.PI / 2);
    root.add(mesh(cuffGeo, mat("#7a4e32", { r: 0.55, side: THREE.DoubleSide }), 0, 0, 0.025));
    const shirt = new THREE.CylinderGeometry(0.052, 0.052, 0.035, 16);
    shirt.rotateX(Math.PI / 2);
    root.add(mesh(shirt, mat("#f1ece2", { r: 0.8 }), 0, 0, 0.065));
    const sleeve = new THREE.CylinderGeometry(0.058, 0.07, 0.55, 16);
    sleeve.rotateX(Math.PI / 2);
    root.add(mesh(sleeve, mat("#2e2a28", { r: 0.95 }), 0, 0, 0.36));
    [0.12, 0.15].forEach((z) => root.add(sphere(0.008, mat("#b8933f", { m: 0.8, r: 0.35 }), 0.05 * s, 0.03, z)));

    return {
      root, fingers, thumb: [t1, t2], side: s,
      setCurl(c) {
        fingers.forEach(([a, b], i) => {
          a.rotation.x = -c * (1.35 + i * 0.05);
          b.rotation.x = -c * 1.5;
        });
        t2.rotation.x = -c * 0.9;
        t1.rotation.x = -c * 0.5;
      },
    };
  }

  RC.mat = mat;
  RC.mats = { GOLD, SILVER, BRASS, GLASS, DARKWOOD };
  RC.shapes = { mesh, box, cyl, sphere, lathe };
  RC.makeItem = makeItem;
  RC.itemKinds = Object.keys(items);
  RC.makeKeeper = makeKeeper;
  RC.makeHand = makeHand;
})();
