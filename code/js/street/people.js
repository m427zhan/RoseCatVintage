/* Shop staff: period-dressed people with sculpted faces, jointed arms and legs, idle breathing,
   blinking, head-turning toward the visitor, talking and walking.
   RC.makePerson(spec) — see config.js (staff) for the options. Built at 1.70 m and scaled to `height`. */

(function () {
  const K = RC.kit, P = RC.pbr;
  const V3 = THREE.Vector3;
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());

  /* ---------- Materials ---------- */
  const skinMat = (c) => once("skin" + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.48, sheen: 0.35, sheenColor: new THREE.Color("#ff8a70"), sheenRoughness: 0.7, clearcoat: 0.06, clearcoatRoughness: 0.5 }));
  const lipMat = (c) => once("lip" + c, () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c).lerp(new THREE.Color("#9a3a3a"), 0.45), roughness: 0.35, clearcoat: 0.4 }));
  const hairMat = (c, gloss) => once("hair" + c + gloss, () => P.mat("wool", { base: c, scale: 0.04, sheen: 0.8, sheenColor: "#ffffff", sheenRough: 0.35, roughMul: gloss ? 0.45 : 0.75 }));
  const wool = (c) => P.mat("wool", { base: c, scale: 0.15 });
  const silkCloth = (c) => P.mat("linen", { base: c, scale: 0.2, sheen: 1, sheenColor: "#ffffff", sheenRough: 0.35, roughMul: 0.55, side: THREE.DoubleSide });
  const cotton = (c) => P.mat("linen", { base: c || "#f4f1ea", scale: 0.12, side: THREE.DoubleSide });
  const leather = () => once("leather", () => new THREE.MeshPhysicalMaterial({ color: "#121010", roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 }));
  const eyeWhite = () => once("eyeWhite", () => new THREE.MeshPhysicalMaterial({ color: "#f2eee8", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 }));
  const irisMat = (c) => once("iris" + c, () => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 }));
  const dark = () => once("dark", () => new THREE.MeshBasicMaterial({ color: "#1a0a08" }));

  const ax = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  function capsuleDown(r, len, m, r2) {
    const g = new THREE.CylinderGeometry(r, r2 || r, len, 16, 1, false);
    g.translate(0, -len / 2, 0);
    const mesh = new THREE.Mesh(g, m);
    mesh.add(K.sphere(r, m, 0, 0, 0, 14, 10));
    mesh.add(K.sphere(r2 || r, m, 0, -len, 0, 14, 10));
    return mesh;
  }
  function latheS(pts, m, sx, sz, seg, phiStart, phiLen) {
    const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || 32, phiStart || 0, phiLen || Math.PI * 2);
    g.scale(sx, 1, sz);
    return new THREE.Mesh(g, m);
  }

  /* ---------- Head ---------- */
  function headGeo(sex, jaw) {
    return once("head" + sex + jaw, () => {
      const g = new THREE.SphereGeometry(0.1, 48, 36);
      const p = g.attributes.position, v = new V3();
      const bump = (n, cx, cy, cz, s) => Math.exp(-((n.x - cx) ** 2 + (n.y - cy) ** 2 + (n.z - cz) ** 2) / (s * s));
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = v.clone().normalize();
        let x = v.x, y = v.y * 1.2, z = v.z;
        if (n.y < 0) { const k = Math.pow(-n.y, 1.4); x *= 1 - (0.3 - jaw * 0.08) * k; z *= 1 - 0.12 * k; }
        if (n.y < -0.55 && n.z > 0.2) z += 0.012 * (n.z) * (-n.y - 0.55) * 2;                 // chin
        if (n.z > 0.4) z *= 0.94;                                                                 // flatter face
        if (n.z < -0.2 && n.y > -0.3) { z *= 1.07; y += 0.004; }                                  // back of skull
        x += Math.sign(n.x) * 0.006 * bump(n, Math.sign(n.x) * 0.62, 0.0, 0.7, 0.25);             // cheekbones
        [-1, 1].forEach((s) => {
          z -= 0.01 * bump(n, s * 0.33, 0.17, 0.92, 0.17);                                        // eye sockets
          z += 0.005 * bump(n, s * 0.33, 0.36, 0.86, 0.16);                                       // brow
        });
        if (n.y > 0.25 && Math.abs(n.x) > 0.6) x *= 0.97;                                         // temples
        if (sex === "m" && n.y < -0.2 && n.y > -0.75 && Math.abs(n.x) > 0.4 && n.z > 0) x *= 1.04; // squarer jaw
        p.setXYZ(i, x, y, z);
      }
      g.computeVertexNormals();
      return g;
    });
  }

  function buildHead(s) {
    const h = new THREE.Group();
    const skin = skinMat(s.skin);
    h.add(new THREE.Mesh(headGeo(s.sex, s.sex === "m" ? 1 : 0), skin));
    // nose: bridge, tip and wings
    const nose = new THREE.Group();
    nose.position.set(0, 0.0, 0.088);
    const bridge = K.sphere(0.011, skin, 0, 0.012, 0.004, 12, 10); bridge.scale.set(0.9, 2.2, 1.1); nose.add(bridge);
    nose.add(K.sphere(0.013 * (s.nose || 1), skin, 0, -0.016, 0.014, 14, 10));
    [-1, 1].forEach((k) => nose.add(K.sphere(0.008, skin, k * 0.012, -0.02, 0.006, 10, 8)));
    h.add(nose);
    // eyes with lids that blink
    const lids = [];
    [-1, 1].forEach((k) => {
      const e = new THREE.Group();
      e.position.set(k * 0.034, 0.018, 0.074);
      e.add(K.sphere(0.0125, eyeWhite(), 0, 0, 0, 16, 12));
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0062, 20), irisMat(s.eyes || "#4a3a2a"));
      iris.position.z = 0.0122;
      e.add(iris);
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0028, 16), dark());
      pupil.position.z = 0.0124;
      e.add(pupil);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0138, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), skin);
      lid.rotation.x = -0.25;
      e.add(lid);
      const lower = new THREE.Mesh(new THREE.SphereGeometry(0.0134, 16, 6, 0, Math.PI * 2, Math.PI * 0.72, Math.PI * 0.28), skin);
      e.add(lower);
      lids.push(lid);
      h.add(e);
      // brow
      const brow = K.tube([[k * 0.018, 0.038, 0.088], [k * 0.034, 0.044, 0.087], [k * 0.05, 0.04, 0.078]], s.sex === "m" ? 0.0035 : 0.0022, hairMat(s.hair), 8);
      h.add(brow);
      // ear
      const ear = K.sphere(0.02, skin, k * 0.094, 0.004, -0.008, 12, 10);
      ear.scale.set(0.35, 1.25, 0.8);
      h.add(ear);
    });
    // mouth: lips and a jaw that opens when talking
    const lip = lipMat(s.skin);
    const upper = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0045, 8, 16, Math.PI), lip);
    upper.position.set(0, -0.046, 0.083); upper.rotation.set(0.25, 0, Math.PI); upper.scale.set(1, 0.45, 0.8);
    h.add(upper);
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.04, 0.05);
    const lower = new THREE.Mesh(new THREE.TorusGeometry(0.0155, 0.0052, 8, 16, Math.PI), lip);
    lower.position.set(0, -0.009, 0.034); lower.rotation.set(-0.15, 0, Math.PI); lower.scale.set(1, 0.4, 0.8);
    jaw.add(lower);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.014, 16), dark());
    inner.position.set(0, -0.004, 0.028); inner.scale.y = 0.4;
    jaw.add(inner);
    h.add(jaw);
    if (s.sex === "f" && s.blush !== false) {
      [-1, 1].forEach((k) => {
        const b = K.sphere(0.022, once("blush" + s.skin, () => new THREE.MeshBasicMaterial({ color: "#d06a6a", transparent: true, opacity: 0.1, depthWrite: false })), k * 0.05, -0.012, 0.07, 10, 8);
        b.scale.set(1, 0.7, 0.4);
        h.add(b);
      });
    }
    addHair(h, s);
    addFacialHair(h, s);
    if (s.extras.includes("spectacles") || s.extras.includes("pince-nez")) {
      const wire = RC.pbr.lib.gold();
      [-1, 1].forEach((k) => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0013, 6, 24), wire);
        rim.position.set(k * 0.034, 0.016, 0.098);
        rim.scale.y = 0.8;
        h.add(rim);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.016, 20), RC.furn.glass());
        lens.position.copy(rim.position); lens.scale.y = 0.8;
        h.add(lens);
        if (s.extras.includes("spectacles")) h.add(K.tube([[k * 0.05, 0.018, 0.094], [k * 0.093, 0.02, 0.04], [k * 0.095, 0.0, -0.02]], 0.0012, wire, 6));
      });
      h.add(K.tube([[-0.018, 0.018, 0.1], [0, 0.024, 0.104], [0.018, 0.018, 0.1]], 0.0012, wire, 6));
    }
    if (s.extras.includes("cap")) {
      // a frilled maid's cap pinned on top
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.025, 24, 1), cotton("#ffffff"));
      cap.position.set(0, 0.115, -0.01); cap.rotation.x = -0.35;
      h.add(cap);
      const frill = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.008, 6, 24), cotton("#ffffff"));
      frill.position.copy(cap.position); frill.rotation.x = Math.PI / 2 - 0.35;
      h.add(frill);
    }
    h.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { head: h, lids, jaw };
  }

  function addHair(h, s) {
    const m = hairMat(s.hair, s.hairStyle === "slick");
    // a skull cap of hair, tipped back so the hairline sits on the forehead, not over the eyes
    const cap = (r, thetaLen, y, z, sx, sy, sz) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, thetaLen + 0.2), m);
      c.position.set(0, y, z - 0.008); c.scale.set(sx || 1, sy || 1, sz || 1);
      c.rotation.x = -0.62;
      h.add(c);
      return c;
    };
    switch (s.hairStyle) {
      case "pompadour": { // Gibson-girl: a soft roll framing the face, knot on the crown
        cap(0.106, Math.PI * 0.55, 0.012, -0.004, 1, 1.15, 1.06);
        const roll = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.034, 12, 32), m);
        roll.position.set(0, 0.095, -0.012); roll.rotation.x = Math.PI / 2 - 0.45; roll.scale.set(1.04, 1.05, 0.8);
        h.add(roll);
        h.add(K.sphere(0.042, m, 0, 0.14, -0.035, 14, 10));
        h.add(K.sphere(0.03, m, 0, 0.165, -0.05, 12, 8));
        break;
      }
      case "chignon": { // centre parting, waves over the ears, low knot at the nape
        cap(0.106, Math.PI * 0.6, 0.008, -0.004, 1.02, 1.15, 1.06);
        [-1, 1].forEach((k) => { const w = K.sphere(0.05, m, k * 0.07, 0.025, -0.01, 14, 10); w.scale.set(0.6, 0.9, 1.2); h.add(w); });
        const knot = K.sphere(0.048, m, 0, -0.03, -0.1, 14, 10);
        knot.scale.set(1.2, 0.8, 0.8);
        h.add(knot);
        break;
      }
      case "bun": {
        cap(0.106, Math.PI * 0.58, 0.01, -0.004, 1, 1.15, 1.06);
        h.add(K.sphere(0.045, m, 0, 0.135, -0.04, 14, 10));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 20), m);
        ring.position.set(0, 0.13, -0.04); ring.rotation.x = Math.PI / 2;
        h.add(ring);
        break;
      }
      case "curly": {
        cap(0.106, Math.PI * 0.6, 0.01, -0.004, 1.03, 1.16, 1.07);
        for (let i = 0; i < 40; i++) {
          const a = i * 2.39996, y = 1 - (i / 39) * 1.2, r = Math.sqrt(Math.max(0, 1 - y * y));
          if (y < -0.1 && Math.cos(a) > 0.2) continue;
          h.add(K.sphere(0.018, m, Math.sin(a) * r * 0.106, 0.015 + y * 0.12, Math.cos(a) * r * 0.1 - 0.012, 8, 6));
        }
        break;
      }
      case "bald": { // horseshoe fringe of hair
        const fr = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.018, 8, 24, Math.PI * 1.25), m);
        fr.position.set(0, 0.0, -0.01); fr.rotation.set(Math.PI / 2, 0, Math.PI * 0.375 + Math.PI / 2);
        fr.scale.set(1, 1.08, 1.2);
        h.add(fr);
        break;
      }
      default: { // "side" / "slick" / "crop": short gentleman's cut with a side parting
        cap(0.107, Math.PI * (s.hairStyle === "crop" ? 0.5 : 0.55), 0.012, -0.006, 1.0, 1.12, 1.06);
        if (s.hairStyle !== "crop") { const sw = K.sphere(0.05, m, -0.03, 0.095, 0.03, 14, 10); sw.scale.set(1.4, 0.45, 1.1); h.add(sw); }
        [-1, 1].forEach((k) => { const sb = K.sphere(0.014, m, k * 0.092, -0.01, 0.02, 8, 6); sb.scale.set(0.5, 2.2, 1); h.add(sb); });
      }
    }
  }

  function addFacialHair(h, s) {
    if (!s.facial) return;
    const m = hairMat(s.facialColour || s.hair);
    if (s.facial === "moustache" || s.facial === "handlebar" || s.facial === "beard") {
      [-1, 1].forEach((k) => {
        const pts = s.facial === "handlebar"
          ? [[k * 0.002, -0.031, 0.1], [k * 0.02, -0.036, 0.096], [k * 0.036, -0.036, 0.086], [k * 0.044, -0.026, 0.078]]
          : [[k * 0.002, -0.031, 0.1], [k * 0.018, -0.035, 0.097], [k * 0.032, -0.045, 0.087]];
        h.add(K.tube(pts, 0.0065, m, 10));
      });
    }
    if (s.facial === "beard") {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45), m);
      b.position.set(0, -0.012, 0.004); b.scale.set(0.98, 1.35, 1.06);
      h.add(b);
    }
    if (s.facial === "chops") {
      [-1, 1].forEach((k) => { const c = K.sphere(0.03, m, k * 0.082, -0.03, 0.03, 12, 10); c.scale.set(0.5, 1.4, 1); h.add(c); });
      [-1, 1].forEach((k) => h.add(K.tube([[k * 0.002, -0.031, 0.1], [k * 0.02, -0.036, 0.096], [k * 0.04, -0.04, 0.082]], 0.006, m, 8)));
    }
  }

  /* ---------- Hands and arms ---------- */
  function hand(m) {
    const g = new THREE.Group();
    g.add(K.rbox(0.028, 0.085, 0.075, 0.012, m, 0, -0.045, 0));
    for (let i = 0; i < 4; i++) {
      const f = capsuleDown(0.0085, 0.05 - Math.abs(i - 1.5) * 0.008, m);
      f.position.set(-0.002, -0.09, -0.027 + i * 0.018);
      f.rotation.z = 0.15;
      g.add(f);
    }
    const th = capsuleDown(0.01, 0.04, m);
    th.position.set(0.006, -0.03, 0.035); th.rotation.set(-0.6, 0, 0.3);
    g.add(th);
    return g;
  }

  function buildArm(side, s, sleeve, cuff, handM) {
    const sh = new THREE.Group();
    sh.position.set(side * 0.195, 1.395, 0);
    sh.rotation.order = "ZXY";
    const upper = capsuleDown(0.046, 0.28, sleeve, 0.04);
    sh.add(upper);
    if (s.sex === "f" && s.sleeves !== "fitted") {
      const puff = K.sphere(0.075, sleeve, side * 0.01, -0.09, 0, 18, 14);
      puff.scale.set(1, 1.45, 1);
      sh.add(puff);
    }
    const el = new THREE.Group();
    el.position.y = -0.29;
    sh.add(el);
    el.add(capsuleDown(0.04, 0.24, sleeve, 0.034));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.035, 16, 1, true), cuff);
    c.position.y = -0.24;
    el.add(c);
    const wr = new THREE.Group();
    wr.position.y = -0.255;
    el.add(wr);
    const hd = hand(handM);
    hd.scale.x = side;
    wr.add(hd);
    sh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { sh, el, wr };
  }

  function buildLeg(side, trouser) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09, 0.95, 0);
    hip.add(capsuleDown(0.07, 0.42, trouser, 0.055));
    const knee = new THREE.Group();
    knee.position.y = -0.45;
    hip.add(knee);
    knee.add(capsuleDown(0.054, 0.4, trouser, 0.045));
    const shoe = K.rbox(0.095, 0.07, 0.26, 0.03, leather(), 0, -0.445, 0.045);
    knee.add(shoe);
    hip.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { hip, knee };
  }

  /* ---------- Bodies ---------- */
  function gentleman(g, s, c) {
    const coat = wool(c.coat || "#1e1e24");
    const trousers = wool(c.trousers || "#2a2a2e");
    const vest = s.outfit === "whitejacket" ? cotton("#f4f2ec") : wool(c.vest || "#4a1f2b");
    const shirt = cotton("#f6f4ee");
    const b = s.build || 1;
    const legs = [buildLeg(1, trousers), buildLeg(-1, trousers)];
    legs.forEach((l) => g.add(l.hip));
    const torsoM = s.outfit === "whitejacket" ? cotton(c.coat || "#f4f2ec") : coat;
    g.add(latheS([[0, 0.86], [0.155, 0.86], [0.152, 0.98], [0.16, 1.1], [0.176, 1.24], [0.186, 1.34], [0.17, 1.41], [0.105, 1.46], [0.06, 1.5], [0, 1.5]], torsoM, 1.16 * b, 0.68 * b));
    const front = 0.68 * b;
    if (s.outfit !== "whitejacket") {
      // waistcoat and shirt in the V of the coat, lapels either side
      g.add(K.rbox(0.15, 0.32, 0.03, 0.01, vest, 0, 1.14, 0.158 * front + 0.01));
      for (let i = 0; i < 4; i++) g.add(K.sphere(0.007, RC.pbr.lib.gold(), 0, 1.02 + i * 0.065, 0.158 * front + 0.028, 8, 6));
      g.add(K.rbox(0.07, 0.11, 0.02, 0.008, shirt, 0, 1.35, 0.175 * front + 0.002));
      [-1, 1].forEach((k) => {
        const lap = K.rbox(0.07, 0.3, 0.014, 0.006, coat, k * 0.07, 1.27, 0.178 * front + 0.006);
        lap.rotation.z = k * 0.32;
        g.add(lap);
      });
      // coat skirts: frock (knee length, closed) or morning/livery (cut away at the front)
      const open = s.outfit === "morning" ? 1.9 : s.outfit === "livery" ? 1.0 : 0.35;
      const skirt = latheS([[0.158, 1.0], [0.168, 0.85], [0.19, 0.7], [0.205, 0.56]], coat, 1.18 * b, 0.74 * b, 32, open / 2, Math.PI * 2 - open);
      skirt.material = coat;
      skirt.geometry.computeVertexNormals();
      g.add(skirt);
      const inside = skirt.clone();
      inside.material = once("coatInside" + (c.coat || ""), () => { const m = wool(c.coat || "#1e1e24").clone(); m.side = THREE.BackSide; return m; });
      g.add(inside);
    } else {
      // white mess jacket: double row of buttons, apron for the patissier
      [-1, 1].forEach((k) => { for (let i = 0; i < 4; i++) g.add(K.sphere(0.008, RC.pbr.lib.gilt(), k * 0.05, 1.04 + i * 0.08, 0.17 * front, 8, 6)); });
      g.add(latheS([[0.158, 1.0], [0.162, 0.9]], torsoM, 1.16 * b, 0.7 * b, 32));
    }
    if (s.extras.includes("apron")) {
      const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * b, 0.24 * b, 0.62, 24, 1, true, -0.9, 1.8), cotton("#fbfaf6"));
      ap.position.set(0, 0.68, 0.0); ap.scale.z = 0.72;
      g.add(ap);
    }
    // collar and tie
    g.add(K.cyl(0.056, 0.058, 0.05, shirt, 0, 1.47, 0, 20));
    if (s.tie === "bow") {
      [-1, 1].forEach((k) => { const w = K.sphere(0.022, wool(c.tie || "#111111"), k * 0.022, 1.445, 0.06, 10, 8); w.scale.set(1.1, 0.6, 0.4); g.add(w); });
    } else {
      const cr = K.rbox(0.05, 0.07, 0.025, 0.01, silkCloth(c.tie || "#2a2a3a"), 0, 1.4, 0.115);
      g.add(cr);
      g.add(K.sphere(0.006, RC.pbr.lib.gold(), 0, 1.41, 0.13, 8, 6));
    }
    if (s.extras.includes("watchchain")) g.add(K.tube([[-0.07, 1.06, 0.13], [-0.03, 1.02, 0.135], [0.0, 1.04, 0.134], [0.05, 1.03, 0.13]], 0.0025, RC.pbr.lib.gold(), 12));
    if (s.outfit === "livery") {
      // gold braid aiguillette on the right shoulder and gilt buttons
      g.add(K.tube([[-0.17, 1.38, 0.05], [-0.13, 1.25, 0.12], [-0.05, 1.3, 0.13]], 0.006, RC.pbr.lib.gold(), 12));
      g.add(K.tube([[-0.17, 1.38, 0.05], [-0.12, 1.2, 0.12], [-0.03, 1.26, 0.132]], 0.006, RC.pbr.lib.gold(), 12));
    }
    return { sleeve: s.outfit === "whitejacket" ? torsoM : coat, cuff: shirt, legs, waist: 1.0 };
  }

  function lady(g, s, c) {
    const dress = c.silk ? silkCloth(c.dress || "#2a3a5a") : wool(c.dress || "#2a3a5a");
    const blouse = c.blouse ? silkCloth(c.blouse) : dress;
    const b = s.build || 1;
    // skirt: bell-shaped, fuller behind (1890s silhouette)
    const sk = new THREE.LatheGeometry([[0, 1.02], [0.125, 1.02], [0.165, 0.95], [0.195, 0.85], [0.26, 0.56], [0.345, 0.22], [0.41, 0.03], [0.4, 0.0], [0, 0]].map((p) => new THREE.Vector2(p[0], p[1])), 40);
    const pp = sk.attributes.position;
    for (let i = 0; i < pp.count; i++) {
      const y = pp.getY(i), z = pp.getZ(i);
      pp.setX(i, pp.getX(i) * b);
      pp.setZ(i, (z < 0 ? z * (1 + 0.32 * (1 - y)) : z * 0.88) * b);
      // soft vertical folds
      const a = Math.atan2(pp.getX(i), pp.getZ(i));
      const fold = 1 + Math.sin(a * 14) * 0.02 * (1 - y);
      pp.setX(i, pp.getX(i) * fold); pp.setZ(i, pp.getZ(i) * fold);
    }
    sk.computeVertexNormals();
    const skirt = new THREE.Mesh(sk, dress);
    g.add(skirt);
    g.add(latheS([[0, 0.98], [0.118, 0.98], [0.112, 1.03], [0.13, 1.13], [0.152, 1.24], [0.148, 1.32], [0.163, 1.38], [0.12, 1.43], [0.062, 1.46], [0, 1.46]], blouse, 1.12 * b, 0.74 * b));
    // belt with buckle, high collar, shoe tips peeping from the hem
    const belt = K.cyl(0.124, 0.124, 0.04, wool(c.accent || "#1a1a1a"), 0, 1.02, 0, 32);
    belt.scale.set(1.12 * b, 1, 0.76 * b);
    g.add(belt);
    g.add(K.rbox(0.04, 0.03, 0.01, 0.004, RC.pbr.lib.gold(), 0, 1.02, 0.092 * b + 0.004));
    g.add(K.cyl(0.05, 0.054, 0.09, c.collar ? cotton(c.collar) : blouse, 0, 1.49, 0, 20));
    [-1, 1].forEach((k) => g.add(K.rbox(0.07, 0.04, 0.12, 0.02, leather(), k * 0.08, 0.02, 0.3)));
    if (s.extras.includes("apron")) {
      const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.86, 24, 1, true, -0.85, 1.7), cotton("#fbfaf6"));
      ap.position.set(0, 0.6, 0.012); ap.scale.z = 0.92 * b;
      g.add(ap);
      g.add(K.rbox(0.16, 0.18, 0.012, 0.01, cotton("#fbfaf6"), 0, 1.13, 0.1 * b + 0.01));
    }
    if (s.extras.includes("lace")) {
      const j = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, 0.12, 24, 1, true, -1.2, 2.4), cotton("#f7f2e6"));
      j.position.set(0, 1.36, 0.03); j.scale.z = 0.8;
      g.add(j);
    }
    if (s.extras.includes("pearls")) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = -Math.PI * 0.85 + (i / 24) * Math.PI * 1.7; pts.push(new V3(Math.sin(a) * 0.08, 1.38 - Math.cos(a * 0.5) * 0.07, Math.cos(a) * 0.075 + 0.02)); }
      const pearl = once("pearl", () => new THREE.MeshPhysicalMaterial({ color: "#f4eee4", roughness: 0.2, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6, sheen: 0.4 }));
      pts.forEach((p) => g.add(K.sphere(0.0065, pearl, p.x, p.y, p.z, 8, 6)));
    }
    if (s.extras.includes("brooch")) g.add(K.sphere(0.012, RC.pbr.lib.gold(), 0, 1.47, 0.056, 10, 8));
    return { sleeve: blouse, cuff: c.cuff ? cotton(c.cuff) : blouse, legs: null, waist: 1.02, skirt };
  }

  /* ---------- Poses (radians): shoulder x/z, elbow x, wrist ---------- */
  const POSES = {
    side: { s: [0.04, 0.1], e: -0.15 },
    front: { s: [-0.32, -0.2], e: -1.3, w: [0, 0.5] },
    back: { s: [0.35, 0.12], e: -0.8 },
    counter: { s: [-0.55, -0.05], e: -0.75 },
    tray: { s: [-0.25, 0.25], e: -1.65, w: [0, 0] },
    present: { s: [-0.95, 0.35], e: -0.35, w: [0, -0.3] },
    hold: { s: [-0.2, 0.05], e: -1.4, w: [0, 0.2] },
  };

  /*
    spec: { sex, height, build, skin, eyes, hair, hairStyle, facial, outfit, tie, colours{}, extras[], pose: [left, right] }
  */
  RC.makePerson = function (spec) {
    const s = Object.assign({ sex: "f", height: 1.66, build: 1, skin: "#e8c4a8", hair: "#4a3020", hairStyle: "chignon", outfit: "gown", extras: [], colours: {}, pose: ["front", "front"] }, spec);
    s.extras = s.extras || [];
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const parts = s.sex === "m" ? gentleman(body, s, s.colours) : lady(body, s, s.colours);
    const handM = s.extras.includes("gloves") ? cotton("#fbfaf6") : skinMat(s.skin);
    const armL = buildArm(1, s, parts.sleeve, parts.cuff, handM);
    const armR = buildArm(-1, s, parts.sleeve, parts.cuff, handM);
    body.add(armL.sh, armR.sh);
    const neck = K.cyl(0.046, 0.05, 0.12, skinMat(s.skin), 0, 1.5, -0.005, 16);
    body.add(neck);
    const { head, lids, jaw } = buildHead(s);
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.55, 0.0);
    head.position.set(0, 0.07, 0.01);
    if (s.sex === "f") head.scale.setScalar(0.95);
    headPivot.add(head);
    body.add(headPivot);
    body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    K.autoUV(body);
    // bake the many small pieces into a few meshes per moving part
    lids.forEach((l) => (l.userData.noMerge = true));
    if (parts.skirt) parts.skirt.userData.noMerge = true;
    const joints = [armL.sh, armL.el, armL.wr, armR.sh, armR.el, armR.wr, headPivot, jaw].concat(parts.legs ? parts.legs.flatMap((l) => [l.hip, l.knee]) : []);
    joints.forEach((j) => (j.userData.joint = true));

    // things held in the hand
    if (s.holds === "tray") {
      const tray = new THREE.Group();
      tray.add(K.cyl(0.17, 0.17, 0.01, RC.pbr.lib.silver(), 0, 0, 0, 28));
      const c1 = RC.furn.coupe(); c1.position.set(0.05, 0.005, 0.03); tray.add(c1);
      const c2 = RC.furn.coupe(); c2.position.set(-0.06, 0.005, -0.02); tray.add(c2);
      tray.position.set(0.0, -0.09, 0.07);
      armL.wr.add(tray);
    } else if (s.holds === "shears") {
      const sh = new THREE.Group();
      [-1, 1].forEach((k) => { const b = K.bx(0.006, 0.12, 0.015, RC.pbr.lib.silver(), 0, -0.06, k * 0.006); b.rotation.x = k * 0.1; sh.add(b); });
      sh.position.set(0, -0.08, 0.02);
      armR.wr.add(sh);
    } else if (s.holds === "loupe") {
      const lp = new THREE.Group();
      lp.add(new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 8, 20), RC.pbr.lib.gold()));
      lp.add(K.cyl(0.004, 0.004, 0.05, RC.mats.DARKWOOD(), 0, -0.04, 0, 8));
      lp.position.set(0, -0.1, 0.04);
      armR.wr.add(lp);
    }

    K.mergeStatic(body);
    joints.forEach((j) => K.mergeStatic(j));

    const scale = s.height / (s.sex === "m" ? 1.74 : 1.68);
    root.scale.setScalar(scale);
    root.add(K.blob(0.8, 0.8, 0.5));

    const pose = { L: POSES[s.pose[0]] || POSES.side, R: POSES[s.pose[1]] || POSES.side };
    const st = { blink: 2 + Math.random() * 3, blinkT: 0, yaw: 0, pitch: 0, talk: 0, walkPh: 0, gesture: 0, seed: Math.random() * 10 };

    function applyArm(a, side, p, t, extra) {
      const sx = p.s[0] + (extra ? extra.sx : 0), sz = p.s[1] + (extra ? extra.sz : 0);
      a.sh.rotation.set(sx, 0, side * sz);
      a.el.rotation.set(p.e + (extra ? extra.e : 0), 0, 0);
      if (p.w) a.wr.rotation.set(p.w[0], side * p.w[1], 0);
    }

    const person = {
      group: root, head: headPivot, spec: s, height: s.height,
      setPose(l, r) { pose.L = POSES[l] || pose.L; pose.R = POSES[r] || pose.R; },
      // ctx: { look: world Vector3 or null, talking: bool, walking: m/s }
      update(dt, t, ctx) {
        ctx = ctx || {};
        // blinking
        st.blink -= dt;
        if (st.blink < 0) { st.blinkT = 0.14; st.blink = 2.5 + Math.random() * 4; }
        st.blinkT = Math.max(0, st.blinkT - dt);
        const lidA = st.blinkT > 0 ? 1.1 : 0;
        lids.forEach((l) => { l.rotation.x = -0.25 + lidA; });
        // breathing and a gentle weight shift
        const br = Math.sin(t * 1.5 + st.seed);
        body.scale.set(1 + br * 0.004, 1 + br * 0.002, 1 + br * 0.008);
        body.rotation.z = Math.sin(t * 0.31 + st.seed) * 0.008;
        // look at the visitor (head first, then the body follows if needed)
        let yaw = 0, pitch = 0;
        if (ctx.look) {
          const l = root.worldToLocal(ctx.look.clone());
          yaw = Math.atan2(l.x, l.z);
          pitch = Math.atan2(l.y - 1.62, Math.hypot(l.x, l.z));
          if (!ctx.walking && Math.abs(yaw) > 0.75 && ctx.turn !== false) root.rotation.y += Math.sign(yaw) * Math.min(Math.abs(yaw) - 0.7, dt * 1.6);
          yaw = Math.max(-0.95, Math.min(0.95, yaw));
          pitch = Math.max(-0.35, Math.min(0.3, pitch));
        }
        st.yaw += (yaw - st.yaw) * Math.min(1, dt * 4);
        st.pitch += (-pitch - st.pitch) * Math.min(1, dt * 4);
        headPivot.rotation.set(st.pitch + (ctx.talking ? Math.sin(t * 3.1) * 0.035 : 0), st.yaw, Math.sin(t * 0.5 + st.seed) * 0.02);
        // talking: jaw and a gesturing hand
        st.talk += ((ctx.talking ? 1 : 0) - st.talk) * Math.min(1, dt * 8);
        jaw.rotation.x = st.talk * (0.06 + 0.1 * Math.max(0, Math.sin(t * 17 + Math.sin(t * 5.3) * 2)));
        const gest = st.talk * (s.gestures === false ? 0 : 1);
        // walking: legs and arms swing
        const w = ctx.walking || 0;
        if (w > 0.05) st.walkPh += dt * w * 5.2;
        const swing = Math.sin(st.walkPh) * Math.min(1, w);
        if (parts.legs) {
          parts.legs[0].hip.rotation.x = swing * 0.45;
          parts.legs[1].hip.rotation.x = -swing * 0.45;
          parts.legs[0].knee.rotation.x = Math.max(0, -Math.cos(st.walkPh)) * 0.6 * Math.min(1, w);
          parts.legs[1].knee.rotation.x = Math.max(0, Math.cos(st.walkPh)) * 0.6 * Math.min(1, w);
        }
        if (parts.skirt) parts.skirt.rotation.y = swing * 0.05;
        body.position.y = Math.abs(Math.cos(st.walkPh)) * 0.02 * Math.min(1, w);
        const walkArm = w > 0.05 && !s.holds;
        applyArm(armL, 1, walkArm ? POSES.side : pose.L, t, walkArm ? { sx: -swing * 0.35, sz: 0, e: -0.25 } : null);
        applyArm(armR, -1, walkArm ? POSES.side : (gest > 0.3 && pose.R !== POSES.tray ? POSES.present : pose.R), t,
          walkArm ? { sx: swing * 0.35, sz: 0, e: -0.25 } : gest > 0.3 ? { sx: Math.sin(t * 2.3) * 0.12, sz: Math.sin(t * 1.7) * 0.06, e: Math.sin(t * 2.9) * 0.15 } : null);
      },
    };
    return person;
  };
})();
