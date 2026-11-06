/* Fine jewellery for the jewellery house: faceted diamonds and coloured stones, pearls, platinum
   and gold settings, each on its own display stand. Stones carry "glint" sprites that flash
   as you move, brightest where the sun falls through the skylights (see RC.jewels.twinkle). */

(function () {
  const K = RC.kit, P = RC.pbr, L = RC.pbr.lib;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4, Q = THREE.Quaternion;
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());
  const glints = [];

  /* ---------- Stones ---------- */
  // Round brilliant: pavilion to a point, girdle, crown and table (flat-shaded facets)
  const brilliant = () => once("brilliant", () => new THREE.LatheGeometry([[0, -0.43], [1, 0], [1, 0.03], [0.56, 0.2], [0, 0.2]].map((p) => new THREE.Vector2(p[0], p[1])), 16));
  // Pear / drop
  const pear = () => once("pear", () => { const g = new THREE.LatheGeometry([[0, -0.9], [0.55, -0.55], [0.75, -0.1], [0.5, 0.35], [0, 0.6]].map((p) => new THREE.Vector2(p[0], p[1])), 12); g.scale(1, 1, 0.55); return g; });
  // Step-cut (emerald cut): octagonal and stepped
  const stepCut = () => once("step", () => { const g = new THREE.LatheGeometry([[0, -0.35], [0.7, -0.15], [1, 0], [1, 0.04], [0.82, 0.14], [0.66, 0.2], [0, 0.2]].map((p) => new THREE.Vector2(p[0], p[1])), 8); g.rotateY(Math.PI / 8); g.scale(1, 1, 0.75); return g; });
  const pearlGeo = () => once("pearlGeo", () => new THREE.SphereGeometry(1, 8, 6));
  const cabochon = () => once("cab", () => new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1));

  const gemMat = {
    diamond: () => once("diamond", () => new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 1, roughness: 0.0, flatShading: true, envMapIntensity: 3.2, emissive: "#ffffff", emissiveIntensity: 0.08 })),
    sapphire: () => once("sapphire", () => new THREE.MeshStandardMaterial({ color: "#2140b8", metalness: 0.7, roughness: 0.0, flatShading: true, envMapIntensity: 2.4, emissive: "#0a1450", emissiveIntensity: 0.6 })),
    ruby: () => once("ruby", () => new THREE.MeshStandardMaterial({ color: "#c0122e", metalness: 0.7, roughness: 0.0, flatShading: true, envMapIntensity: 2.4, emissive: "#40020a", emissiveIntensity: 0.7 })),
    emerald: () => once("emerald", () => new THREE.MeshStandardMaterial({ color: "#109060", metalness: 0.6, roughness: 0.02, flatShading: true, envMapIntensity: 2.2, emissive: "#03301c", emissiveIntensity: 0.7 })),
    garnet: () => once("garnet", () => new THREE.MeshStandardMaterial({ color: "#7a0a1a", metalness: 0.7, roughness: 0.0, flatShading: true, envMapIntensity: 2.2, emissive: "#20020a", emissiveIntensity: 0.6 })),
    pearl: () => once("pearl", () => new THREE.MeshPhysicalMaterial({ color: "#f3ede2", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.7, iridescenceIOR: 1.5, sheen: 0.5, sheenColor: new THREE.Color("#ffe8f0") })),
    enamel: (c) => once("enamel" + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 })),
  };
  const platinum = () => L.silver();
  const gold = () => L.gold();
  const velvet = (c) => RC.furn.velvet(c);

  // Many stones of one kind at once: list of [x, y, z, size, (dir)]
  function stones(geo, mat, list, upAxis) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const m = new M4(), q = new Q(), s = new V3();
    list.forEach((st, i) => {
      const dir = st[4] || upAxis || new V3(0, 0, 1);
      q.setFromUnitVectors(new V3(0, 1, 0), dir.clone().normalize());
      s.setScalar(st[3]);
      m.compose(new V3(st[0], st[1], st[2]), q, s);
      im.setMatrixAt(i, m);
    });
    im.castShadow = false;
    return im;
  }

  /* ---------- Glints ---------- */
  let glintTex = null;
  function glint(x, y, z, size) {
    if (!glintTex) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 9);
      rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
      g.globalCompositeOperation = "lighter";
      [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4].forEach((a, i) => {
        g.save(); g.translate(64, 64); g.rotate(a);
        const lg = g.createLinearGradient(-64, 0, 64, 0);
        lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(0.5, i < 2 ? "rgba(255,255,255,1)" : "rgba(220,235,255,0.5)"); lg.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = lg; g.fillRect(-64, i < 2 ? -1 : -0.75, 128, i < 2 ? 2 : 1.5);
        g.restore();
      });
      glintTex = new THREE.CanvasTexture(c);
    }
    const m = new THREE.SpriteMaterial({ map: glintTex, color: "#ffffff", blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const sp = new THREE.Sprite(m);
    sp.position.set(x, y, z);
    sp.scale.setScalar(size);
    sp.userData.glint = { phase: Math.random() * 100, speed: 0.6 + Math.random() * 0.9, size };
    sp.raycast = () => {};
    glints.push(sp);
    return sp;
  }

  // Called every frame: sprites flash as the viewer moves; `sunAt(worldPos)` returns 0..1 sunlight
  const tmp = new V3();
  function twinkle(t, camPos, sunAt) {
    for (let i = 0; i < glints.length; i++) {
      const sp = glints[i], gd = sp.userData.glint;
      if (!sp.parent) continue;
      sp.getWorldPosition(tmp);
      const d = tmp.distanceTo(camPos);
      if (d > 9) { sp.material.opacity = 0; continue; }
      // the flash depends on where you stand (so walking past makes stones sparkle) and on time
      const v = Math.sin(camPos.x * 7.1 + camPos.z * 5.3 + camPos.y * 3 + gd.phase) * 0.5 + Math.sin(t * gd.speed * 2.2 + gd.phase * 1.7) * 0.5;
      const flash = Math.pow(Math.max(0, v), 6);
      const sun = sunAt ? sunAt(tmp) : 0;
      sp.material.opacity = Math.min(1, flash * (0.35 + sun * 1.4));
      sp.scale.setScalar(gd.size * 0.4 * (0.5 + flash * 0.9 + sun * 0.5) * Math.min(1.6, 0.6 + d * 0.25));
    }
  }

  /* ---------- Display stands ---------- */
  function neckBust(colour, h) {
    h = h || 0.36;
    const v = velvet(colour || "#141414");
    const g = new THREE.Group();
    g.add(K.lathe([[0, 0], [0.085, 0], [0.09, 0.03], [0.07, 0.06], [0.06, h * 0.45], [0.04, h * 0.7], [0.034, h * 0.92], [0.045, h * 0.97], [0, h]], v, 32));
    const sh = K.sphere(0.1, v, 0, h * 0.5, 0, 24, 16);
    sh.scale.set(1.15, 0.45, 0.6);
    g.add(sh);
    return g;
  }
  function cushion(colour, w, d) {
    const g = new THREE.Group();
    g.add(K.rbox(w || 0.12, 0.03, d || 0.12, 0.012, velvet(colour || "#2a1a3a"), 0, 0.015, 0));
    return g;
  }

  /* ---------- Pieces ---------- */
  const items = {
    // Belle Époque garland tiara: platinum scrolls, diamonds, sapphire drops, on a velvet form
    tiara() {
      const g = new THREE.Group();
      const form = K.sphere(0.09, velvet("#1b2440"), 0, 0.04, 0, 32, 20);
      form.scale.set(1, 0.8, 0.85);
      g.add(K.cyl(0.07, 0.08, 0.04, velvet("#1b2440"), 0, 0.02, 0, 24), form);
      const tiara = new THREE.Group();
      tiara.position.set(0, 0.085, 0.0);
      const R = 0.083;
      const band = new THREE.Mesh(new THREE.TorusGeometry(R, 0.0025, 6, 48, Math.PI * 1.1), platinum());
      band.rotation.set(-Math.PI / 2, 0, Math.PI * -0.05 + Math.PI);
      band.scale.set(1, 0.85, 1);
      tiara.add(band);
      const dlist = [], drops = [];
      for (let i = 0; i <= 14; i++) {
        const a = -Math.PI * 0.55 + (i / 14) * Math.PI * 1.1;
        const x = Math.sin(a) * R, z = Math.cos(a) * R * 0.85;
        const peak = Math.cos(a) * 0.04 + 0.01;
        const out = new V3(Math.sin(a), 0, Math.cos(a));
        dlist.push([x, 0.004, z, 0.0035, out]);
        // scroll rising from the band
        const sc = new THREE.Mesh(new THREE.TorusGeometry(peak * 0.38, 0.0013, 5, 16, Math.PI * 1.6), platinum());
        sc.position.set(x, peak * 0.5, z); sc.rotation.y = a; sc.rotation.z = i % 2 ? 0.4 : -0.4;
        tiara.add(sc);
        dlist.push([x, peak, z, 0.0042 + (i === 7 ? 0.004 : 0), out]);
        dlist.push([x * 0.99, peak * 0.55, z * 0.99, 0.0026, out]);
        if (i % 2 === 0 && i > 1 && i < 13) drops.push([x * 1.01, peak * 0.6, z * 1.01, 0.0075 + (i === 6 || i === 8 ? 0.002 : 0), new V3(0, -1, 0)]);
      }
      tiara.add(stones(brilliant(), gemMat.diamond(), dlist));
      tiara.add(stones(pear(), gemMat.sapphire(), drops));
      const centre = new THREE.Mesh(pear(), gemMat.sapphire());
      centre.scale.setScalar(0.013); centre.position.set(0, 0.03, R * 0.86); centre.rotation.x = Math.PI;
      tiara.add(centre);
      tiara.add(glint(0, 0.05, R * 0.88, 0.05), glint(-0.04, 0.035, R * 0.75, 0.035), glint(0.045, 0.03, R * 0.72, 0.035));
      g.add(tiara);
      return g;
    },

    // Diamond rivière: graduated collet-set stones around a velvet neck
    riviere() {
      const g = neckBust("#121212", 0.36);
      const dl = [], n = 29;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), a = -Math.PI * 0.62 + t * Math.PI * 1.24;
        const sz = 0.0045 + Math.pow(Math.cos((t - 0.5) * Math.PI), 2) * 0.0045;
        dl.push([Math.sin(a) * 0.052, 0.255 - Math.cos(a * 0.5) * 0.035, Math.cos(a) * 0.048 + 0.012, sz, new V3(Math.sin(a), 0.15, Math.cos(a))]);
      }
      g.add(stones(brilliant(), gemMat.diamond(), dl));
      dl.forEach(([x, y, z, s]) => { const c = new THREE.Mesh(new THREE.TorusGeometry(s * 0.95, 0.0009, 4, 12), platinum()); c.position.set(x, y, z); c.lookAt(x * 2, y, z * 2); g.add(c); });
      const drop = new THREE.Mesh(pear(), gemMat.diamond());
      drop.scale.setScalar(0.011); drop.position.set(0, 0.2, 0.068); drop.rotation.x = Math.PI;
      g.add(drop);
      g.add(glint(0, 0.215, 0.07, 0.05), glint(0.03, 0.23, 0.055, 0.03), glint(-0.035, 0.235, 0.05, 0.03));
      return g;
    },

    // Long pearl sautoir with a diamond-capped tassel
    sautoir() {
      const g = neckBust("#2a1218", 0.36);
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60, a = -Math.PI * 0.75 + t * Math.PI * 1.5;
        const drop = Math.pow(Math.cos((t - 0.5) * Math.PI), 2);
        pts.push([Math.sin(a) * (0.058 + drop * 0.01), 0.27 - drop * 0.14 - (1 - Math.abs(Math.cos(a))) * 0.01, Math.cos(a) * 0.05 + 0.016 + drop * 0.03, 0.0042]);
      }
      g.add(stones(pearlGeo(), gemMat.pearl(), pts));
      g.add(K.sphere(0.008, gemMat.diamond(), 0, 0.122, 0.096, 12, 8));
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.add(K.tube([[0, 0.118, 0.096], [Math.cos(a) * 0.006, 0.08, 0.098 + Math.sin(a) * 0.006]], 0.0016, gemMat.pearl(), 3)); }
      g.add(glint(0, 0.125, 0.1, 0.035));
      return g;
    },

    // Sapphire solitaire with a diamond halo, in an open ring box
    ring() {
      const g = new THREE.Group();
      const box = new THREE.MeshPhysicalMaterial({ color: "#5a0e1e", roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color("#ffd0d8") });
      g.add(K.rbox(0.07, 0.04, 0.07, 0.012, box, 0, 0.02, 0));
      g.add(K.bx(0.058, 0.004, 0.058, velvet("#f2ece2"), 0, 0.04, 0));
      const lid = new THREE.Group();
      lid.position.set(0, 0.04, -0.035);
      lid.rotation.x = -1.9;
      lid.add(K.rbox(0.07, 0.016, 0.07, 0.008, box, 0, 0.008, 0.035));
      lid.add(K.bx(0.058, 0.002, 0.058, RC.furn.silk("#f4efe4", "#e8e0d0"), 0, 0.0, 0.035));
      g.add(lid);
      g.add(K.bx(0.012, 0.018, 0.04, velvet("#f2ece2"), 0, 0.048, 0));
      const r = new THREE.Group();
      r.position.set(0, 0.058, 0);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0016, 8, 32), platinum());
      r.add(band);
      const c = new THREE.Mesh(brilliant(), gemMat.sapphire());
      c.scale.setScalar(0.0055); c.position.set(0, 0.0125, 0); c.rotation.x = 0;
      const set = new THREE.Group();
      set.add(c);
      const halo = [];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; halo.push([Math.cos(a) * 0.0068, 0.0115, Math.sin(a) * 0.0068, 0.0016, new V3(0, 1, 0)]); }
      set.add(stones(brilliant(), gemMat.diamond(), halo));
      set.rotation.x = Math.PI / 2;
      set.position.set(0, 0, 0);
      r.add(set);
      r.rotation.x = -Math.PI / 2 + 0.1;
      r.position.set(0, 0.06, 0.004);
      const holder = new THREE.Group();
      holder.add(r);
      g.add(holder);
      g.add(glint(0, 0.075, 0.016, 0.03));
      return g;
    },

    // Platinum bow brooch, pavé diamonds, on a velvet cushion
    bowbrooch() {
      const g = cushion("#1f2f3f", 0.13, 0.11);
      const b = new THREE.Group();
      b.position.set(0, 0.035, 0);
      b.rotation.x = -Math.PI / 2 + 0.25;
      const pave = [];
      [-1, 1].forEach((s) => {
        const loop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 8, 24), platinum());
        loop.position.set(s * 0.02, 0.006, 0); loop.scale.set(1.2, 0.7, 0.6);
        b.add(loop);
        for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; pave.push([s * 0.02 + Math.cos(a) * 0.0216, 0.006 + Math.sin(a) * 0.0126, 0.003, 0.0022]); }
        const tail = K.tube([[s * 0.004, -0.004, 0], [s * 0.012, -0.022, 0.002], [s * 0.016, -0.04, 0]], 0.0035, platinum(), 10);
        b.add(tail);
        for (let i = 0; i < 6; i++) pave.push([s * (0.006 + i * 0.002), -0.006 - i * 0.006, 0.0035, 0.0022]);
      });
      b.add(K.sphere(0.006, platinum(), 0, 0.004, 0.002, 10, 8));
      const k = new THREE.Mesh(brilliant(), gemMat.diamond());
      k.scale.setScalar(0.0055); k.position.set(0, 0.004, 0.006); k.rotation.x = Math.PI / 2;
      b.add(k);
      b.add(stones(brilliant(), gemMat.diamond(), pave, new V3(0, 0, 1)));
      const pd = new THREE.Mesh(pear(), gemMat.diamond());
      pd.scale.setScalar(0.007); pd.position.set(0, -0.026, 0.004); pd.rotation.z = Math.PI;
      b.add(pd);
      g.add(b);
      g.add(glint(0, 0.045, 0.01, 0.035), glint(0.02, 0.04, 0.0, 0.02));
      return g;
    },

    // Emerald and diamond pendant earrings on a gilt T-stand
    emeraldDrops() {
      const g = new THREE.Group();
      g.add(K.cyl(0.032, 0.036, 0.012, L.ebony(), 0, 0.006, 0, 24));
      g.add(K.cyl(0.0035, 0.0035, 0.13, gold(), 0, 0.075, 0, 8));
      g.add(K.bx(0.1, 0.005, 0.005, gold(), 0, 0.14, 0));
      [-0.04, 0.04].forEach((x) => {
        g.add(K.cyl(0.0008, 0.0008, 0.012, platinum(), x, 0.134, 0, 4));
        const top = new THREE.Mesh(brilliant(), gemMat.diamond());
        top.scale.setScalar(0.004); top.position.set(x, 0.126, 0.002); top.rotation.x = Math.PI / 2;
        g.add(top);
        g.add(K.cyl(0.0008, 0.0008, 0.012, platinum(), x, 0.114, 0, 4));
        const em = new THREE.Mesh(stepCut(), gemMat.emerald());
        em.scale.setScalar(0.0085); em.position.set(x, 0.098, 0.002); em.rotation.x = Math.PI / 2;
        g.add(em);
        const fr = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0012, 4, 8), gold());
        fr.position.set(x, 0.098, 0.001); fr.rotation.z = Math.PI / 8;
        g.add(fr);
        g.add(glint(x, 0.126, 0.006, 0.025));
      });
      return g;
    },

    // Diamond line bracelet on a velvet bolster
    lineBracelets() {
      const g = new THREE.Group();
      const bol = K.cyl(0.03, 0.03, 0.11, velvet("#1d1d2a"), 0, 0.03, 0, 24);
      bol.rotation.z = Math.PI / 2;
      g.add(bol);
      g.add(K.bx(0.12, 0.006, 0.04, velvet("#1d1d2a"), 0, 0.003, 0));
      const d = [];
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; d.push([0.015, 0.03 + Math.cos(a) * 0.0335, Math.sin(a) * 0.0335, 0.0026, new V3(0, Math.cos(a), Math.sin(a))]); }
      g.add(stones(brilliant(), gemMat.diamond(), d));
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.0335, 0.0018, 6, 48), platinum());
      band.position.set(0.015, 0.03, 0); band.rotation.y = Math.PI / 2;
      g.add(band);
      const r = [];
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; r.push([-0.02, 0.03 + Math.cos(a) * 0.0335, Math.sin(a) * 0.0335, 0.0035, new V3(0, Math.cos(a), Math.sin(a))]); }
      g.add(stones(brilliant(), gemMat.ruby(), r));
      const band2 = band.clone(); band2.material = gold(); band2.position.x = -0.02;
      g.add(band2);
      g.add(glint(0.015, 0.065, 0.0, 0.03), glint(-0.02, 0.064, 0.005, 0.025));
      return g;
    },

    // Gentleman's gold hunter pocket watch, case open, on a little stand
    hunter() {
      const g = new THREE.Group();
      g.add(K.rbox(0.07, 0.012, 0.05, 0.004, L.ebony(), 0, 0.006, 0));
      g.add(K.bx(0.004, 0.06, 0.004, gold(), 0, 0.04, -0.01));
      const w = new THREE.Group();
      w.position.set(0, 0.04, 0.0);
      const caseG = K.cyl(0.024, 0.024, 0.01, gold(), 0, 0, 0, 32);
      caseG.rotation.x = Math.PI / 2;
      w.add(caseG);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.021, 32), once("dial", () => new THREE.MeshPhysicalMaterial({ map: RC.tex.clockFace(), roughness: 0.2, clearcoat: 1 })));
      face.position.z = 0.0052;
      w.add(face);
      const lid = new THREE.Group();
      lid.position.set(-0.024, 0, 0.005);
      lid.rotation.y = -2.2;
      const lc = K.cyl(0.024, 0.024, 0.004, gold(), 0.024, 0, 0, 32);
      lc.rotation.x = Math.PI / 2;
      lid.add(lc);
      w.add(lid);
      w.add(K.cyl(0.004, 0.004, 0.008, gold(), 0, 0.028, 0, 10));
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0015, 6, 16), gold());
      bow.position.y = 0.036;
      w.add(bow);
      g.add(w);
      g.add(K.tube([[0, 0.075, 0], [0.02, 0.03, 0.02], [0.03, 0.014, 0.01]], 0.0012, gold(), 16));
      g.add(glint(0.01, 0.055, 0.008, 0.02));
      return g;
    },

    // Aigrette: diamond spray hair ornament with a white egret plume
    aigrette() {
      const g = new THREE.Group();
      g.add(K.cyl(0.03, 0.035, 0.03, velvet("#22102a"), 0, 0.015, 0, 24));
      g.add(K.cyl(0.004, 0.004, 0.06, platinum(), 0, 0.06, 0, 8));
      const spray = [];
      for (let i = 0; i < 7; i++) {
        const a = -0.6 + i * 0.2;
        g.add(K.tube([[0, 0.08, 0], [Math.sin(a) * 0.02, 0.1, 0.004], [Math.sin(a) * 0.035, 0.12 + Math.cos(a) * 0.01, 0.006]], 0.0012, platinum(), 6));
        spray.push([Math.sin(a) * 0.035, 0.12 + Math.cos(a) * 0.01, 0.007, 0.0032]);
        spray.push([Math.sin(a) * 0.02, 0.1, 0.005, 0.0022]);
      }
      g.add(stones(brilliant(), gemMat.diamond(), spray));
      const feather = once("feather", () => new THREE.MeshPhysicalMaterial({ color: "#f6f4ef", roughness: 0.9, sheen: 1, sheenColor: new THREE.Color("#ffffff"), transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
      for (let i = 0; i < 9; i++) {
        const a = -0.35 + i * 0.09;
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.2, 6, 1, true), feather);
        f.position.set(Math.sin(a) * 0.05, 0.19, -0.01); f.rotation.z = -a * 1.4;
        g.add(f);
      }
      const c = new THREE.Mesh(stepCut(), gemMat.ruby());
      c.scale.setScalar(0.01); c.position.set(0, 0.085, 0.006); c.rotation.x = Math.PI / 2;
      g.add(c);
      g.add(glint(0, 0.12, 0.01, 0.035));
      return g;
    },

    // Multi-strand pearl choker ("dog collar") with a diamond plaque
    choker() {
      const g = neckBust("#3a1a28", 0.34);
      const p = [];
      for (let s = 0; s < 5; s++) for (let i = 0; i < 34; i++) {
        const a = -Math.PI * 0.85 + (i / 33) * Math.PI * 1.7;
        p.push([Math.sin(a) * 0.04, 0.27 + s * 0.009, Math.cos(a) * 0.038, 0.0042]);
      }
      g.add(stones(pearlGeo(), gemMat.pearl(), p));
      g.add(K.rbox(0.024, 0.045, 0.006, 0.003, platinum(), 0, 0.288, 0.039));
      const d = [];
      for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) d.push([-0.007 + i * 0.007, 0.268 + k * 0.0075, 0.043, 0.0025]);
      g.add(stones(brilliant(), gemMat.diamond(), d, new V3(0, 0, 1)));
      g.add(glint(0, 0.29, 0.045, 0.03));
      return g;
    },

    // Enamelled pansy brooch (gold, violet enamel, diamond heart)
    pansy() {
      const g = cushion("#ece4d4", 0.1, 0.1);
      const f = new THREE.Group();
      f.position.set(0, 0.034, 0); f.rotation.x = -Math.PI / 2 + 0.2;
      const cols = ["#5a2a8a", "#5a2a8a", "#e8c040", "#6a3a9a", "#6a3a9a"];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        const pt = K.sphere(0.015, gemMat.enamel(cols[i]), Math.cos(a) * 0.014, Math.sin(a) * 0.014, 0, 14, 10);
        pt.scale.set(1, 1, 0.25);
        f.add(pt);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0012, 4, 20), gold());
        rim.position.copy(pt.position);
        f.add(rim);
      }
      const c = new THREE.Mesh(brilliant(), gemMat.diamond());
      c.scale.setScalar(0.0045); c.position.z = 0.004; c.rotation.x = Math.PI / 2;
      f.add(c);
      g.add(f);
      g.add(glint(0, 0.04, 0.006, 0.02));
      return g;
    },

    // Gold signet ring and cufflinks on a leather tray
    signet() {
      const g = new THREE.Group();
      g.add(K.rbox(0.12, 0.012, 0.08, 0.005, once("tray", () => new THREE.MeshPhysicalMaterial({ color: "#1f3a2a", roughness: 0.5, sheen: 0.4 })), 0, 0.006, 0));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0095, 0.0024, 10, 32), gold());
      ring.position.set(-0.03, 0.022, 0); ring.rotation.x = 0.2;
      g.add(ring);
      const top = K.cyl(0.0075, 0.007, 0.004, gold(), -0.03, 0.033, 0.0, 20);
      top.rotation.x = Math.PI / 2 + 0.2;
      g.add(top);
      [0.015, 0.042].forEach((x) => {
        g.add(K.cyl(0.008, 0.008, 0.003, gold(), x, 0.016, -0.01, 20));
        g.add(K.cyl(0.0015, 0.0015, 0.012, gold(), x, 0.022, -0.01, 6));
        const oval = K.cyl(0.006, 0.006, 0.003, gemMat.enamel("#0e2a5a"), x, 0.0185, -0.01, 16);
        g.add(oval);
      });
      return g;
    },

    // Lady's enamelled lapel watch with diamond bezel
    lapelwatch() {
      const g = cushion("#e8d9de", 0.1, 0.1);
      const w = new THREE.Group();
      w.position.set(0, 0.05, 0); w.rotation.x = -0.6;
      const c = K.cyl(0.016, 0.016, 0.007, gemMat.enamel("#2a4aa0"), 0, 0, 0, 32);
      c.rotation.x = Math.PI / 2;
      w.add(c);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.0125, 28), once("dial", () => new THREE.MeshPhysicalMaterial({ map: RC.tex.clockFace(), roughness: 0.2, clearcoat: 1 })));
      face.position.z = 0.0037;
      w.add(face);
      const bz = [];
      for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; bz.push([Math.cos(a) * 0.0145, Math.sin(a) * 0.0145, 0.004, 0.0016]); }
      w.add(stones(brilliant(), gemMat.diamond(), bz, new V3(0, 0, 1)));
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.003, 6, 16), gold());
      bow.position.y = 0.026; bow.scale.set(1.4, 0.7, 1);
      w.add(bow);
      g.add(w);
      g.add(glint(0.0, 0.055, 0.01, 0.02));
      return g;
    },

    // Garnet and seed-pearl necklace (the old shop favourite)
    garnets() {
      const g = neckBust("#141414", 0.34);
      const gl = [], pl = [];
      for (let i = 0; i < 21; i++) {
        const t = i / 20, a = -Math.PI * 0.6 + t * Math.PI * 1.2;
        const drop = Math.pow(Math.cos((t - 0.5) * Math.PI), 2);
        const p = [Math.sin(a) * 0.05, 0.25 - drop * 0.03, Math.cos(a) * 0.046 + 0.012];
        gl.push([p[0], p[1], p[2], 0.004 + drop * 0.003, new V3(Math.sin(a), 0.1, Math.cos(a))]);
        pl.push([p[0] * 1.02, p[1] - 0.008 - drop * 0.006, p[2] * 1.02 + 0.002, 0.0028]);
      }
      g.add(stones(brilliant(), gemMat.garnet(), gl));
      g.add(stones(pearlGeo(), gemMat.pearl(), pl));
      g.add(glint(0, 0.225, 0.062, 0.03));
      return g;
    },
  };

  RC.extraItems = Object.assign(RC.extraItems || {}, items);
  RC.jewels = { glints, twinkle, glint, gemMat, brilliant, items };
})();
