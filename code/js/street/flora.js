/* Fresh flowers and plants: rose, peony, hydrangea, lily, tulip and orchid arrangements in vases,
   kentia palms, Boston ferns, citrus trees in Versailles boxes, clipped box balls and climbing vines.
   Petals and leaves are real curved geometry, drawn with instancing so a room can hold hundreds. */

(function () {
  const K = RC.kit, P = RC.pbr, L = RC.pbr.lib;
  const V3 = THREE.Vector3, M4 = THREE.Matrix4, Q = THREE.Quaternion;
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());
  const UP = new V3(0, 1, 0);

  /* ---------- Geometry helpers ---------- */
  function mergeGeo(parts) {
    let n = 0;
    const gs = parts.map(([g, m]) => { const c = (g.index ? g.toNonIndexed() : g.clone()); if (m) c.applyMatrix4(m); n += c.attributes.position.count; return c; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    gs.forEach((g) => {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return out;
  }

  // A petal or leaf: length along +Y, width along X, cupped toward +Z, curling as it goes
  function blade(len, wid, cup, curl, segL, segW, shapePow) {
    const g = new THREE.PlaneGeometry(1, 1, segW || 4, segL || 5);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5, t = p.getY(i) + 0.5;           // 0..1 across, 0..1 along
      const width = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), shapePow || 0.7) * wid;
      const x = (u - 0.5) * width;
      const z0 = cup * Math.pow((u - 0.5) * 2, 2) * wid * 0.5;
      const a = curl * t;                                       // bend along the length
      const y = Math.sin(a) !== 0 ? (Math.sin(a) / (curl || 1)) * len : t * len;
      const zc = curl ? ((1 - Math.cos(a)) / curl) * len : 0;
      p.setXYZ(i, x, curl ? y : t * len, z0 + zc);
    }
    g.computeVertexNormals();
    return g;
  }

  const m4 = (pos, quat, s) => new M4().compose(pos, quat, new V3(s, s, s));
  const qLook = (dir) => new Q().setFromUnitVectors(UP, dir.clone().normalize());

  /* ---------- Flower heads (each opens upward along +Y; origin at the base of the head) ---------- */
  function rosette(n, len0, len1, wid, tilt0, tilt1, cup, curl, centre) {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const a = i * 2.39996;
      const len = len0 + (len1 - len0) * k;
      const b = blade(len, wid * (0.7 + 0.5 * k), cup, curl * (0.3 + k), 4, 4);
      const tilt = tilt0 + (tilt1 - tilt0) * Math.pow(k, 1.2);
      const m = new M4().makeRotationY(a).multiply(new M4().makeTranslation(0, 0, len0 * 0.12 * k)).multiply(new M4().makeRotationX(tilt));
      parts.push([b, m]);
    }
    if (centre) parts.push([new THREE.SphereGeometry(centre, 8, 6).scale(1, 1.3, 1).translate(0, centre, 0), null]);
    return mergeGeo(parts);
  }
  const heads = {
    rose: () => once("rose", () => rosette(16, 0.018, 0.034, 0.03, 0.12, 1.15, -1.6, 0.9, 0.01)),
    peony: () => once("peony", () => rosette(30, 0.025, 0.045, 0.04, 0.2, 1.35, -1.2, 0.6, 0.016)),
    tulip: () => once("tulip", () => rosette(6, 0.05, 0.052, 0.035, 0.22, 0.32, -1.3, -0.4)),
    lily: () => once("lily", () => {
      const parts = [];
      for (let i = 0; i < 6; i++) parts.push([blade(0.08, 0.026, -0.8, 1.8, 6, 3), new M4().makeRotationY(i * Math.PI / 3 + (i % 2) * 0.2).multiply(new M4().makeRotationX(0.55))]);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, s = new THREE.CylinderGeometry(0.0012, 0.0012, 0.06, 4).translate(0, 0.03, 0);
        parts.push([s, new M4().makeRotationY(a).multiply(new M4().makeRotationX(0.3))]);
      }
      return mergeGeo(parts);
    }),
    orchid: () => once("orchid", () => {
      const parts = [];
      for (let i = 0; i < 5; i++) parts.push([blade(0.035, 0.03, 0.4, 0.3, 3, 3, 0.5), new M4().makeRotationY(i * (Math.PI * 2 / 5)).multiply(new M4().makeRotationX(1.35))]);
      parts.push([new THREE.SphereGeometry(0.008, 8, 6).scale(1, 0.8, 1.4).translate(0, 0.006, 0.01), null]);
      return mergeGeo(parts);
    }),
    hydrangea: () => once("hydrangea", () => {
      const parts = [], floret = mergeGeo([0, 1, 2, 3].map((i) => [blade(0.017, 0.016, 0.3, 0, 1, 2, 0.5), new M4().makeRotationY(i * Math.PI / 2).multiply(new M4().makeRotationX(1.3))]));
      for (let i = 0; i < 80; i++) {
        const y = 1 - (i / 79) * 1.4, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996;
        const dir = new V3(Math.cos(a) * r, y, Math.sin(a) * r);
        parts.push([floret, m4(dir.clone().multiplyScalar(0.05).add(new V3(0, 0.04, 0)), qLook(dir), 1)]);
      }
      return mergeGeo(parts);
    }),
    filler: () => once("filler", () => {
      const parts = [];
      for (let i = 0; i < 14; i++) {
        const a = i * 2.39996, r = 0.025 * Math.sqrt(i / 14);
        parts.push([new THREE.SphereGeometry(0.004, 5, 4), new M4().makeTranslation(Math.cos(a) * r, 0.01 + (i % 3) * 0.006, Math.sin(a) * r)]);
      }
      return mergeGeo(parts);
    }),
  };
  const leafGeo = () => once("leaf", () => blade(0.07, 0.035, 0.7, 0.8, 5, 3));
  const stemGeo = () => once("stem", () => new THREE.CylinderGeometry(0.0025, 0.003, 1, 5).translate(0, 0.5, 0));

  const petalMat = () => once("petalMat", () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.55, sheen: 0.7, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.5, side: THREE.DoubleSide }));
  const leafMat = () => once("leafMat", () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.45, side: THREE.DoubleSide }));
  const stemMat = () => once("stemMat", () => new THREE.MeshStandardMaterial({ color: "#4a6a32", roughness: 0.6 }));

  function instanced(geo, mat, list, colours) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const c = new THREE.Color();
    list.forEach((m, i) => {
      im.setMatrixAt(i, m);
      if (colours) im.setColorAt(i, c.set(colours[i % colours.length]).offsetHSL(0, 0, (P.hash(i * 17) - 0.5) * 0.06));
    });
    im.castShadow = true;
    im.receiveShadow = true;
    im.userData.noMerge = true;
    return im;
  }

  /* ---------- Vases ---------- */
  function vase(kind, h) {
    const g = new THREE.Group();
    let mouth = 0.06, mat, pts;
    if (kind === "crystal") {
      mat = RC.furn.crystal();
      pts = [[0, 0], [0.06, 0], [0.065, 0.02], [0.05, 0.05], [0.06, h * 0.4], [0.075, h * 0.85], [0.085, h], [0.08, h], [0, h * 0.9]];
      mouth = 0.08;
      // water line
      g.add(K.cyl(0.062, 0.058, 0.004, once("vaseWater", () => new THREE.MeshPhysicalMaterial({ color: "#cfe8e4", roughness: 0, transparent: true, opacity: 0.3 })), 0, h * 0.55, 0, 16));
    } else if (kind === "silver") {
      mat = L.silver();
      pts = [[0, 0], [0.07, 0], [0.07, 0.02], [0.03, 0.05], [0.025, 0.09], [0.09, h * 0.45], [0.1, h * 0.75], [0.08, h * 0.92], [0.1, h], [0.095, h], [0, h * 0.9]];
      mouth = 0.09;
    } else if (kind === "urn") {
      mat = P.mat("limestone", { scale: 0.8 });
      pts = [[0, 0], [0.16, 0], [0.16, 0.05], [0.08, 0.1], [0.07, 0.25], [0.2, h * 0.55], [0.26, h * 0.85], [0.3, h], [0.27, h], [0, h * 0.9]];
      mouth = 0.26;
    } else if (kind === "celadon") {
      mat = once("celadon", () => new THREE.MeshPhysicalMaterial({ color: "#a8c4b0", roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }));
      pts = [[0, 0], [0.06, 0], [0.07, 0.02], [0.1, h * 0.3], [0.11, h * 0.5], [0.07, h * 0.82], [0.05, h * 0.9], [0.065, h], [0.06, h], [0, h * 0.95]];
      mouth = 0.06;
    } else { // Sèvres-style porcelain urn, bleu céleste with gilding
      mat = once("sevres", () => new THREE.MeshPhysicalMaterial({ color: "#7fb2cf", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04 }));
      pts = [[0, 0], [0.06, 0], [0.06, 0.03], [0.03, 0.06], [0.03, 0.1], [0.09, h * 0.4], [0.1, h * 0.65], [0.06, h * 0.85], [0.08, h], [0.075, h], [0, h * 0.95]];
      mouth = 0.075;
      [0.03, h * 0.65, h].forEach((y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(y > h - 0.01 ? 0.08 : y < 0.05 ? 0.061 : 0.1, 0.004, 6, 32), L.gold()); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
    }
    const v = K.lathe(pts, mat, kind === "crystal" ? 12 : 32);
    g.add(v);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { group: g, mouth, h };
  }

  /*
    bouquet({ kind, colours, vase, size, h })
      kind: roses | peonies | hydrangea | lilies | tulips | mixed | orchid
      colours: list of petal colours; vase: crystal | silver | porcelain | celadon | urn
  */
  function bouquet(o) {
    o = Object.assign({ kind: "roses", colours: ["#e8a0b0", "#f6e6e0"], vase: "crystal", size: 0.45, h: 0.28 }, o);
    const g = new THREE.Group();
    const vs = vase(o.vase, o.h);
    g.add(vs.group);
    const S = o.size;
    const base = new V3(0, vs.h, 0);
    const centre = new V3(0, vs.h + S * 0.12, 0);

    if (o.kind === "orchid") {
      // phalaenopsis: a few arching sprays
      const flowers = [], stems = [], leaves = [];
      for (let s = 0; s < 3; s++) {
        const a = s * 2.1;
        let p = base.clone();
        const dir = new V3(Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25).normalize();
        for (let k = 0; k < 9; k++) {
          const t = k / 8;
          const step = dir.clone().multiplyScalar(S * 0.12);
          step.y -= t * t * S * 0.12;
          const q = p.clone().add(step);
          const d = q.clone().sub(p);
          stems.push(new M4().compose(p.clone(), qLook(d), new V3(1, d.length(), 1)));
          p = q;
          if (k > 3) flowers.push(m4(p.clone().add(new V3(0, -0.01, 0)), qLook(new V3(Math.cos(a), 0.3, Math.sin(a))), 1.3 - t * 0.4));
        }
      }
      for (let i = 0; i < 5; i++) leaves.push(m4(base.clone().add(new V3(0, -0.02, 0)), qLook(new V3(Math.cos(i * 1.3), 0.25, Math.sin(i * 1.3))), 2.4));
      g.add(instanced(heads.orchid(), petalMat(), flowers, o.colours));
      g.add(instanced(stemGeo(), stemMat(), stems));
      g.add(instanced(leafGeo(), leafMat(), leaves, ["#2f5a2a", "#3a6a30"]));
      return g;
    }

    const plan = {
      roses: [["rose", 19, 1]],
      peonies: [["peony", 11, 1], ["filler", 6, 1]],
      hydrangea: [["hydrangea", 7, 1]],
      lilies: [["lily", 9, 1.1], ["filler", 5, 1]],
      tulips: [["tulip", 15, 1]],
      mixed: [["peony", 5, 1], ["rose", 9, 1], ["hydrangea", 3, 0.85], ["filler", 8, 1]],
    }[o.kind] || [["rose", 19, 1]];

    // big arrangements get more flowers rather than giant ones
    const grow = Math.max(1, Math.pow(S / 0.45, 1.6));
    plan.forEach((p) => { p[1] = Math.round(p[1] * grow); });
    const headScale = Math.pow(S / 0.45, 0.45), leafScale = Math.pow(S / 0.45, 0.4);
    const heads_ = {}, stems = [], leaves = [];
    let total = plan.reduce((s, p) => s + p[1], 0), idx = 0;
    plan.forEach(([kind, n, sc]) => {
      heads_[kind] = [];
      for (let i = 0; i < n; i++, idx++) {
        // spread over a dome, slightly flattened, a little random
        const t = (idx + 0.5) / total;
        const y = 1 - t * (o.kind === "lilies" ? 1.4 : 1.25);
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const a = idx * 2.39996 + P.hash(idx) * 0.3;
        const dir = new V3(Math.cos(a) * r, y * 0.9, Math.sin(a) * r).normalize();
        const pos = centre.clone().add(dir.clone().multiplyScalar(S * (0.36 + P.hash(idx * 3) * 0.08)));
        const look = dir.clone().lerp(UP, 0.25).normalize();
        heads_[kind].push(m4(pos, qLook(look), sc * (0.9 + P.hash(idx * 7) * 0.25) * headScale));
        const d = pos.clone().sub(base.clone().add(new V3(0, -o.h * 0.6, 0)));
        stems.push(new M4().compose(base.clone().add(new V3(0, -o.h * 0.6, 0)), qLook(d), new V3(1, d.length() * 0.98, 1)));
      }
    });
    for (let i = 0; i < Math.round(total * 0.9); i++) {
      const a = i * 2.39996, y = 0.15 + P.hash(i * 5) * 0.35;
      const dir = new V3(Math.cos(a), y - 0.2, Math.sin(a)).normalize();
      leaves.push(m4(centre.clone().add(dir.clone().multiplyScalar(S * 0.3)).add(new V3(0, -S * 0.12, 0)), qLook(dir), leafScale * (0.8 + P.hash(i) * 0.4)));
    }
    const colourFor = { filler: ["#f8f6f0"], hydrangea: o.hydrangea || ["#c8d4ee", "#d8c8e8", "#e8eef6"] };
    Object.keys(heads_).forEach((kind) => g.add(instanced(heads[kind](), petalMat(), heads_[kind], colourFor[kind] || o.colours)));
    const noShadow = () => g.children.forEach((c) => { if (c.isInstancedMesh) c.castShadow = false; });
    g.add(instanced(leafGeo(), leafMat(), leaves, ["#2e5226", "#3b6630", "#28461f"]));
    g.add(instanced(stemGeo(), stemMat(), stems));
    noShadow();
    return g;
  }

  /* ---------- Plants ---------- */

  // One arching frond (palm or fern), rising along +X then drooping; merged into one geometry
  function frondGeo(len, n, leafLen, leafW, droop, key) {
    return once("frond" + key, () => {
      const parts = [];
      const pt = (t) => new V3(len * t, len * (0.55 * t - droop * t * t), 0);
      for (let i = 0; i < 12; i++) {
        const a = pt(i / 12), b = pt((i + 1) / 12), d = b.clone().sub(a);
        parts.push([new THREE.CylinderGeometry(0.004 * (1 - i / 14), 0.005 * (1 - i / 14), 1, 4).translate(0, 0.5, 0), new M4().compose(a, qLook(d), new V3(1, d.length(), 1))]);
      }
      for (let i = 2; i < n; i++) {
        const t = i / n, p = pt(t), tan = pt(Math.min(1, t + 0.01)).sub(p).normalize();
        const l = leafLen * Math.sin(Math.PI * (0.15 + t * 0.85)) ;
        [-1, 1].forEach((s) => {
          const side = new V3(0, 0, s).add(tan.clone().multiplyScalar(0.7)).add(new V3(0, -0.35, 0)).normalize();
          parts.push([blade(l, leafW, 0.9, 0.5, 3, 2, 0.6), new M4().compose(p, qLook(side), new V3(1, 1, 1))]);
        });
      }
      return mergeGeo(parts);
    });
  }

  function pot(kind, r, h) {
    if (kind === "brass") return K.lathe([[0, 0], [r * 0.7, 0], [r * 0.75, 0.04], [r, h * 0.5], [r * 1.05, h * 0.95], [r * 1.1, h], [r * 1.0, h], [0, h * 0.9]], L.brass(), 32);
    if (kind === "terracotta") return K.lathe([[0, 0], [r * 0.75, 0], [r, h * 0.9], [r * 1.08, h * 0.92], [r * 1.08, h], [r * 0.98, h], [0, h * 0.9]], once("terra", () => P.mat("paint", { base: "#a65a3c", rough: 0.85, scale: 0.5 })), 28);
    // Chinese export porcelain jardinière
    return K.lathe([[0, 0], [r * 0.7, 0], [r * 0.72, 0.03], [r * 1.05, h * 0.35], [r * 1.08, h * 0.7], [r * 0.95, h * 0.95], [r * 1.0, h], [r * 0.95, h], [0, h * 0.9]], once("jardMat", () => new THREE.MeshPhysicalMaterial({ color: "#e9eef2", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 })), 32);
  }

  // Kentia palm in a jardinière
  function palm(o) {
    o = Object.assign({ h: 2.2, pot: "porcelain", fronds: 11 }, o);
    const g = new THREE.Group();
    const pr = 0.28, ph = 0.42;
    const p = pot(o.pot, pr, ph);
    p.castShadow = p.receiveShadow = true;
    g.add(p);
    g.add(K.cyl(pr * 0.95, pr * 0.95, 0.02, once("soil", () => new THREE.MeshStandardMaterial({ color: "#2a1d14", roughness: 1 })), 0, ph - 0.03, 0, 24));
    const geo = frondGeo(o.h * 0.65, 30, 0.32, 0.035, 0.6, "palm");
    const list = [];
    for (let i = 0; i < o.fronds; i++) {
      const a = i * 2.39996;
      const elev = 0.35 + (i % 3) * 0.28;
      const m = new M4().makeTranslation(0, ph + 0.1 + (i % 4) * 0.12, 0)
        .multiply(new M4().makeRotationY(a))
        .multiply(new M4().makeRotationZ(elev))
        .multiply(new M4().makeScale(0.75 + P.hash(i) * 0.4, 0.75 + P.hash(i) * 0.4, 0.75 + P.hash(i) * 0.4));
      list.push(m);
    }
    g.add(instanced(geo, leafMat(), list, ["#2c5a28", "#36662e", "#2a4e22"]));
    // stems out of the pot
    for (let i = 0; i < 5; i++) g.add(K.tube([[0, ph - 0.05, 0], [Math.cos(i) * 0.04, ph + 0.4 + i * 0.05, Math.sin(i) * 0.04]], 0.012, stemMat(), 4));
    g.add(K.blob(0.9, 0.9, 0.45));
    return g;
  }

  // Boston fern spilling over an urn
  function fern(o) {
    o = Object.assign({ pot: "terracotta", r: 0.18 }, o);
    const g = new THREE.Group();
    const p = pot(o.pot, o.r, o.r * 1.4);
    p.castShadow = p.receiveShadow = true;
    g.add(p);
    const geo = frondGeo(0.55, 26, 0.06, 0.016, 1.1, "fern");
    const list = [];
    for (let i = 0; i < 34; i++) {
      const a = i * 2.39996, elev = 0.4 + P.hash(i) * 0.9;
      list.push(new M4().makeTranslation(0, o.r * 1.4, 0).multiply(new M4().makeRotationY(a)).multiply(new M4().makeRotationZ(elev)).multiply(new M4().makeScale(0.7 + P.hash(i * 3) * 0.5, 0.7 + P.hash(i * 3) * 0.5, 0.7 + P.hash(i * 3) * 0.5)));
    }
    g.add(instanced(geo, leafMat(), list, ["#4a7a30", "#5a8a38", "#3e6a28"]));
    return g;
  }

  // Leafy canopy (citrus tree or clipped box ball): leaves scattered over an ellipsoid
  function canopy(rx, ry, n, leafScale, colours, cy) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const dir = new V3(Math.cos(a) * r, y, Math.sin(a) * r);
      const depth = 0.82 + P.hash(i * 11) * 0.2;
      const pos = new V3(dir.x * rx * depth, cy + dir.y * ry * depth, dir.z * rx * depth);
      const look = dir.clone().add(new V3(P.hash(i) - 0.5, P.hash(i + 1) - 0.3, P.hash(i + 2) - 0.5).multiplyScalar(0.9)).normalize();
      list.push(m4(pos, qLook(look), leafScale * (0.8 + P.hash(i * 5) * 0.4)));
    }
    return instanced(leafGeo(), leafMat(), list, colours);
  }

  // Orange tree in a Versailles box (as at the Orangerie)
  function citrus(o) {
    o = Object.assign({ box: 0.55 }, o);
    const g = RC.furn.planterBox(o.box);
    const top = o.box * 0.9 + 0.06;
    const bark = once("bark", () => P.mat("wood", { base: "#5a4a3a", dark: "#3a2e24", scale: 0.4 }));
    g.add(K.tube([[0, top, 0], [0.03, top + 0.5, 0.02], [0, top + 0.95, 0]], 0.04, bark, 8));
    g.add(canopy(0.55, 0.5, 520, 0.85, ["#2a4e1e", "#355e24", "#24441a"], top + 1.25));
    const fruitM = once("orange", () => new THREE.MeshPhysicalMaterial({ color: "#e8801c", roughness: 0.5, clearcoat: 0.3 }));
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39996, y = (P.hash(i) - 0.5) * 0.7, r = Math.sqrt(1 - y * y);
      g.add(K.sphere(0.035, fruitM, Math.cos(a) * r * 0.5, top + 1.25 + y * 0.45, Math.sin(a) * r * 0.5, 10, 8));
    }
    g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    return g;
  }

  // Clipped box ball on a stem, in a terracotta pot
  function topiary(o) {
    o = Object.assign({ r: 0.32 }, o);
    const g = new THREE.Group();
    const p = pot("terracotta", 0.22, 0.32);
    p.castShadow = true;
    g.add(p);
    g.add(K.cyl(0.015, 0.02, 0.5, once("bark", () => P.mat("wood", { base: "#5a4a3a", dark: "#3a2e24", scale: 0.4 })), 0, 0.55, 0, 8));
    g.add(K.sphere(o.r * 0.85, once("boxInner", () => new THREE.MeshStandardMaterial({ color: "#1e3a16", roughness: 0.9 })), 0, 0.8 + o.r, 0, 16, 12));
    g.add(canopy(o.r, o.r, 700, 0.38, ["#2a5020", "#33602a", "#264a1c"], 0.8 + o.r));
    g.add(K.blob(0.7, 0.7, 0.4));
    return g;
  }

  // Climbing vine along a list of points (on columns, iron arches)
  function vine(points, o) {
    o = Object.assign({ density: 26 }, o);
    const g = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new V3(p[0], p[1], p[2])));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.008, 5), stemMat()));
    const list = [], len = curve.getLength(), n = Math.round(len * o.density);
    for (let i = 0; i < n; i++) {
      const t = i / n, p = curve.getPointAt(t);
      const d = new V3(P.hash(i) - 0.5, P.hash(i + 9) - 0.2, P.hash(i + 4) - 0.5).normalize();
      list.push(m4(p, qLook(d), 0.55 + P.hash(i * 3) * 0.4));
    }
    g.add(instanced(leafGeo(), leafMat(), list, ["#2e5a26", "#3e6e2e", "#26481e"]));
    return g;
  }

  // Aspidistra (the Victorian parlour plant) in a jardinière
  function aspidistra() {
    const g = new THREE.Group();
    const p = pot("porcelain", 0.17, 0.26);
    p.castShadow = true;
    g.add(p);
    const geo = once("aspLeaf", () => blade(0.55, 0.1, 0.8, 0.9, 8, 3));
    const list = [];
    for (let i = 0; i < 14; i++) list.push(new M4().makeTranslation(0, 0.24, 0).multiply(new M4().makeRotationY(i * 2.39996)).multiply(new M4().makeRotationX(0.15 + P.hash(i) * 0.5)));
    g.add(instanced(geo, leafMat(), list, ["#1e4a22", "#28562a"]));
    return g;
  }

  RC.flora = { bouquet, palm, fern, citrus, topiary, vine, aspidistra, vase };
})();
