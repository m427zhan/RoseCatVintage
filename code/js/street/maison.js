/* Rosecat & Co. — the jewellery house, in the manner of a Place Vendôme maison of 1899.

   Plan (metres; front door at z = +10, back wall at z = -12, floors at y = 0, 5 and 10):

     Ground floor   Display Salon (front) · Stair Hall under the great skylight · Salon de Thé (back)
     First floor    Grand Salon for clients (front) · galleries · Winter Garden under a glass vault (back)
     Second floor   Private landing · Salon Privé under a glass lantern (VIP)

   A dog-leg staircase climbs the west side of the light well to the first floor, a second one
   the east side to the second floor. Walking uses "nav": floor rectangles at a height, plus
   sloping stair rectangles; the player always stays on the layer nearest their current height. */

(function () {
  const K = RC.kit, F = RC.furn, FL = RC.flora, P = RC.pbr, L = RC.pbr.lib;
  const V3 = THREE.Vector3;

  const X = 7, ZF = 10, ZB = -12, FH = 5, CH = 4.7, T = 0.3;
  const VOID = { x0: -4.8, x1: 4.8, z0: -4.4, z1: 1.0 };
  const SUN_DIR = new V3(-0.15, -1, -0.12).normalize();     // direction the sunlight travels

  const SIDES = { s: Math.PI * 0, n: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 };
  const isX = (side) => side === "s" || side === "n";
  function wallPos(r, side, u, off) {
    if (side === "s") return [u, r.z0 + off];
    if (side === "n") return [u, r.z1 - off];
    if (side === "w") return [r.x0 + off, u];
    return [r.x1 - off, u];
  }
  const localX = (side, u, c) => (side === "s" || side === "e" ? u - c : -(u - c));
  function onWall(obj, r, side, u, y, off) {
    const [x, z] = wallPos(r, side, u, off || 0);
    obj.position.set(x, y, z);
    obj.rotation.y = SIDES[side];
    return obj;
  }
  function put(g, obj, x, y, z, ry) {
    obj.position.set(x, y, z);
    if (ry) obj.rotation.y = ry;
    g.add(obj);
    return obj;
  }

  /* ---------- Panelling ---------- */
  // Boiserie along local X (centred), face at z = 0 toward +Z, from y = 0 to h. skip = [[a, b]] local ranges
  function boiserie(len, h, o) {
    o = Object.assign({ paint: F.paint("#e9e4d6"), trim: L.gilt(), panelW: 1.2, skip: [], mirrors: false, dado: 0.92, cornice: true }, o);
    const g = new THREE.Group();
    const runs = [];
    let a = -len / 2;
    o.skip.slice().sort((p, q) => p[0] - q[0]).forEach(([s0, s1]) => { if (s0 > a + 0.05) runs.push([a, s0]); a = Math.max(a, s1); });
    if (a < len / 2 - 0.05) runs.push([a, len / 2]);
    runs.forEach(([r0, r1]) => {
      const w = r1 - r0, cx = (r0 + r1) / 2;
      const sk = K.moulding(K.PROFILES.skirting, w, o.paint); sk.position.set(cx, 0, 0); g.add(sk);
      const dr = K.moulding(K.PROFILES.dado, w, o.paint); dr.position.set(cx, o.dado - 0.025, 0); g.add(dr);
      const n = Math.max(1, Math.round(w / o.panelW)), pw = w / n;
      for (let i = 0; i < n; i++) {
        const x = r0 + pw * (i + 0.5);
        g.add(K.frame(pw - 0.22, o.dado - 0.42, 0.045, 0.025, o.paint, x, 0.22 + (o.dado - 0.42) / 2 + 0.03, 0));
        const uh = h - o.dado - 0.62;
        if (uh > 0.5) {
          if (o.mirrors && i % 2 === 1 && pw > 0.9) {
            const m = F.mirror(pw - 0.34, uh - 0.1, { crest: false });
            m.position.set(x, o.dado + 0.25 + uh / 2, 0.01);
            g.add(m);
          } else {
            g.add(K.frame(pw - 0.24, uh, 0.05, 0.03, o.paint, x, o.dado + 0.25 + uh / 2, 0));
            g.add(K.frame(pw - 0.4, uh - 0.16, 0.012, 0.012, o.trim, x, o.dado + 0.25 + uh / 2, 0.012));
            if (o.inset) g.add(K.bx(pw - 0.44, uh - 0.2, 0.01, o.inset, x, o.dado + 0.25 + uh / 2, 0.004));
          }
        }
      }
    });
    if (o.cornice) { const c = K.moulding(K.PROFILES.cornice, len, o.paint); c.position.set(0, h - 0.22, 0); g.add(c); const gt = K.bx(len, 0.018, 0.02, o.trim, 0, h - 0.2, 0.135); g.add(gt); }
    return g;
  }

  /* ---------- Room shell: floor, ceiling, walls with openings, panelling ---------- */
  function room(g, spec) {
    const r = spec.r, y = spec.y, h = spec.h || CH;
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    if (spec.floor) {
      const f = K.bx(w, 0.1, d, spec.floor, (r.x0 + r.x1) / 2, y - 0.05, (r.z0 + r.z1) / 2);
      f.receiveShadow = true;
      g.add(f);
    }
    (spec.ceil === false ? [] : spec.ceilRects || [r]).forEach((cr) => {
      const c = K.bx(cr.x1 - cr.x0, T, cr.z1 - cr.z0, spec.ceilMat || F.paint("#f1ece0", 0.85), (cr.x0 + cr.x1) / 2, y + h + T / 2, (cr.z0 + cr.z1) / 2);
      c.castShadow = c.receiveShadow = true;
      g.add(c);
    });
    Object.keys(spec.walls || {}).forEach((side) => {
      const ws = spec.walls[side];
      if (!ws) return;
      const len = isX(side) ? w : d, c = isX(side) ? (r.x0 + r.x1) / 2 : (r.z0 + r.z1) / 2;
      const opens = (ws.open || []).map((o) => ({ x: localX(side, o.u, c), y: o.y || 0, w: o.w, h: o.h, arch: o.arch }));
      const wall = K.wall(len + (ws.extend || 0), ws.h || h, T, opens, ws.mat || spec.wallMat);
      onWall(wall, r, side, c, y, -T / 2);
      wall.castShadow = wall.receiveShadow = true;
      g.add(wall);
      if (ws.panel !== false && spec.panel) {
        const skip = opens.map((o) => [o.x - o.w / 2 - 0.12, o.x + o.w / 2 + 0.12]).concat((ws.skip || []).map(([a, b]) => { const p = localX(side, a, c), q = localX(side, b, c); return [Math.min(p, q), Math.max(p, q)]; }));
        const b = boiserie(len, ws.h || h, Object.assign({ skip }, spec.panel, ws.panelOpts || {}));
        onWall(b, r, side, c, y, 0.002);
        g.add(b);
      }
      // architraves around openings
      (ws.open || []).forEach((o) => {
        if (o.trim === false) return;
        const tr = o.arch ? K.archTrim(o.w, o.h, 0.14, 0.06, spec.trimMat || spec.panel?.paint || F.paint("#ece6d8")) : K.frame(o.w + 0.28, o.h + 0.14, 0.14, 0.06, spec.trimMat || spec.panel?.paint || F.paint("#ece6d8"), 0, (o.h + 0.14) / 2 - 0.07, 0);
        onWall(tr, r, side, o.u, y + (o.y || 0), 0.0);
        g.add(tr);
      });
      // a soft shadow line where the wall meets the floor
      if (spec.floor) {
        const ao = K.aoStrip(len, 0.45);
        onWall(ao, r, side, c, y + 0.225, 0.03);
        g.add(ao);
      }
    });
  }

  /* ---------- Windows (seen from inside) ---------- */
  function windowUnit(w, h, arch, o) {
    o = Object.assign({ frame: F.paint("#f0ece2", 0.4), mount: L.gilt() }, o);
    const g = new THREE.Group();
    const glass = F.glass();
    const pane = arch ? new THREE.Mesh(new THREE.ShapeGeometry(K.archShape(w, h, new THREE.Shape()), 16), glass) : new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
    if (!arch) pane.position.y = h / 2;
    pane.position.z = -0.12;
    pane.userData.noMerge = true;
    g.add(pane);
    // glazing bars: French casement pair with transom
    const bar = (bw, bh, x, y) => g.add(K.bx(bw, bh, 0.05, o.frame, x, y, -0.12));
    bar(0.07, arch ? h - w / 2 : h, 0, (arch ? h - w / 2 : h) / 2);
    const sh = arch ? h - w / 2 : h;
    for (let i = 1; i < 4; i++) bar(w, 0.04, 0, (sh * i) / 4);
    [-1, 1].forEach((s) => bar(0.035, sh, s * w / 4, sh / 2));
    if (arch) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 4) * Math.PI;
        const b = K.bx(0.035, w / 2, 0.05, o.frame, Math.cos(a) * w / 4, sh + Math.sin(a) * w / 4, -0.12);
        b.rotation.z = a - Math.PI / 2;
        g.add(b);
      }
    }
    g.add(K.bx(0.06, 0.04, 0.04, o.mount, 0.06, sh * 0.45, -0.08));
    g.add(K.rbox(w + 0.1, 0.06, 0.3, 0.02, o.frame, 0, 0.0, -0.05));
    return g;
  }

  /* ---------- Staircase pieces ---------- */
  function flight(g, x0, x1, zB, zT, yB, yT, o) {
    o = Object.assign({ marble: L.whiteMarble(), runner: L.runner(), rod: L.brass(), soffit: F.paint("#efe9dc", 0.8) }, o);
    const n = Math.round((yT - yB) / 0.167), rise = (yT - yB) / n, run = (zT - zB) / n;
    const w = x1 - x0, xc = (x0 + x1) / 2, rw = Math.min(1.05, w - 0.4);
    for (let i = 0; i < n; i++) {
      const top = yB + (i + 1) * rise, zc = zB + (i + 0.5) * run;
      g.add(K.rbox(w, 0.05, Math.abs(run) + 0.035, 0.012, o.marble, xc, top - 0.025, zc - Math.sign(run) * 0.0175 * -1));
      g.add(K.bx(w - 0.02, rise - 0.05, 0.03, o.marble, xc, top - 0.05 - (rise - 0.05) / 2, zB + i * run + Math.sign(run) * 0.015));
      // carpet runner over tread and riser, held by a brass rod
      g.add(K.bx(rw, 0.012, Math.abs(run), o.runner, xc, top + 0.006, zc));
      g.add(K.bx(rw, rise, 0.012, o.runner, xc, top - rise / 2, zB + i * run + Math.sign(run) * 0.012));
      const rod = K.cyl(0.008, 0.008, rw + 0.08, o.rod, xc, top - 0.004 + 0.012, zB + i * run + Math.sign(run) * 0.03, 8);
      rod.rotation.z = Math.PI / 2;
      g.add(rod);
    }
    // sloping soffit underneath
    const dz = zT - zB, dy = yT - yB, len = Math.hypot(dz, dy);
    const so = K.bx(w, 0.18, len, o.soffit, xc, (yB + yT) / 2 - 0.22, (zB + zT) / 2);
    so.rotation.x = -Math.atan2(dy, dz);
    g.add(so);
    // stringers with a gilt line
    [x0, x1].forEach((x) => {
      const s = K.rbox(0.08, 0.36, len + 0.1, 0.02, o.soffit, x, (yB + yT) / 2 - 0.05, (zB + zT) / 2);
      s.rotation.x = -Math.atan2(dy, dz);
      g.add(s);
      const gl = K.bx(0.085, 0.02, len, L.gilt(), x, (yB + yT) / 2 - 0.05, (zB + zT) / 2);
      gl.rotation.x = -Math.atan2(dy, dz);
      g.add(gl);
    });
    return { n, rise, run };
  }

  // Sloping wrought-iron and mahogany handrail along x, from (zB, yB) to (zT, yT)
  function stairRail(g, x, zB, zT, yB, yT, o) {
    o = Object.assign({ iron: L.iron(), rail: L.mahogany(), gilt: L.gilt() }, o);
    const H = 0.95;
    g.add(K.tube([[x, yB + H, zB], [x, yT + H, zT]], 0.035, o.rail, 4));
    g.add(K.tube([[x, yB + 0.1, zB], [x, yT + 0.1, zT]], 0.012, o.iron, 4));
    const n = Math.max(2, Math.round(Math.abs(zT - zB) / 0.15));
    for (let i = 0; i <= n; i++) {
      const t = i / n, z = zB + (zT - zB) * t, y = yB + (yT - yB) * t;
      g.add(K.bx(0.014, H - 0.1, 0.014, o.iron, x, y + 0.1 + (H - 0.1) / 2, z));
      if (i % 3 === 1) {
        const sc = K.scroll(0.07, 1.2, 0.005, o.iron);
        sc.position.set(x, y + 0.5, z); sc.rotation.y = Math.PI / 2;
        g.add(sc);
        g.add(K.sphere(0.018, o.gilt, x, y + 0.5, z, 8, 6));
      }
    }
    // newel posts with gilt urns
    [[zB, yB], [zT, yT]].forEach(([z, y]) => {
      g.add(K.turned(H + 0.15, 0.06, o.rail, "vase").translateX(x).translateY(y).translateZ(z));
      g.add(K.lathe([[0, 0], [0.05, 0], [0.06, 0.06], [0.03, 0.12], [0, 0.16]], o.gilt, 16, x, y + H + 0.15, z));
    });
  }

  // A horizontal balustrade from (x0,z0) to (x1,z1) at height y (straight lines along x or z)
  function railRun(g, x0, z0, x1, z1, y, style) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const b = K.balustrade(len, 1.0, style || "iron", { rail: L.mahogany(), post: L.iron(), accent: L.gilt() });
    b.position.set(x0, y, z0);
    b.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    g.add(b);
  }

  // Marble column with a gilt Ionic-ish capital, from y to y + h
  function column(g, x, z, y, h, marble) {
    const m = marble || L.whiteMarble(), gilt = L.gilt();
    g.add(K.rbox(0.62, 0.3, 0.62, 0.03, m, x, y + 0.15, z));
    g.add(K.lathe([[0, 0], [0.28, 0], [0.28, 0.05], [0.24, 0.1], [0.25, 0.14], [0.22, 0.18], [0.21, 0.2], [0, 0.2]], m, 32, x, y + 0.3, z));
    const sh = K.cyl(0.19, 0.21, h - 1.0, m, x, y + 0.5 + (h - 1.0) / 2, z, 32);
    g.add(sh);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(K.cyl(0.012, 0.012, h - 1.1, gilt, x + Math.cos(a) * 0.2, y + 0.55 + (h - 1.1) / 2, z + Math.sin(a) * 0.2, 4)); }
    g.add(K.lathe([[0, 0], [0.22, 0], [0.27, 0.08], [0.3, 0.14], [0, 0.14]], gilt, 32, x, y + h - 0.5, z));
    [-1, 1].forEach((s) => { const v = K.scroll(0.09, 1.3, 0.02, gilt); v.position.set(x + s * 0.28, y + h - 0.3, z + 0.2); v.scale.x = s; g.add(v); const v2 = v.clone(); v2.position.z = z - 0.2; g.add(v2); });
    g.add(K.rbox(0.66, 0.16, 0.66, 0.02, gilt, x, y + h - 0.24, z));
    g.add(K.rbox(0.72, 0.14, 0.72, 0.02, m, x, y + h - 0.08, z));
  }

  // Ceiling rose (plaster medallion) where a chandelier hangs
  function ceilingRose(g, x, y, z, r) {
    const m = F.paint("#f4efe2", 0.7);
    const rose = K.lathe([[0, 0], [r, 0], [r * 0.95, -0.03], [r * 0.7, -0.05], [r * 0.4, -0.06], [r * 0.2, -0.09], [0, -0.1]], m, 32, x, y, z);
    g.add(rose);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.75, 0.012, 6, 40), L.gilt());
    ring.rotation.x = Math.PI / 2; ring.position.set(x, y - 0.045, z);
    g.add(ring);
  }

  // Coffered ceiling beams in a rectangle at height y (just under the ceiling)
  function coffers(g, r, y, nx, nz, m) {
    for (let i = 1; i < nx; i++) g.add(K.rbox(0.22, 0.25, r.z1 - r.z0, 0.03, m, r.x0 + ((r.x1 - r.x0) * i) / nx, y - 0.125, (r.z0 + r.z1) / 2));
    for (let k = 1; k < nz; k++) g.add(K.rbox(r.x1 - r.x0, 0.25, 0.22, 0.03, m, (r.x0 + r.x1) / 2, y - 0.125, r.z0 + ((r.z1 - r.z0) * k) / nz));
  }

  // Painted sky ceiling (Salon de Thé), a canvas of clouds in a gilt frame
  let skyCeil = null;
  function paintedSky(w, d) {
    if (!skyCeil) {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 768;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(512, 384, 50, 512, 384, 700);
      grd.addColorStop(0, "#f6efe0"); grd.addColorStop(0.45, "#c9dbe8"); grd.addColorStop(1, "#8fb0cc");
      g.fillStyle = grd; g.fillRect(0, 0, 1024, 768);
      for (let i = 0; i < 60; i++) {
        const x = P.hash(i) * 1024, y = P.hash(i + 99) * 768, r = 40 + P.hash(i + 7) * 90;
        const cg = g.createRadialGradient(x, y, 0, x, y, r);
        cg.addColorStop(0, "rgba(255,250,244,0.55)"); cg.addColorStop(1, "rgba(255,250,244,0)");
        g.fillStyle = cg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      // a few swallows
      g.strokeStyle = "rgba(60,50,60,0.6)"; g.lineWidth = 2;
      for (let i = 0; i < 7; i++) { const x = 200 + P.hash(i * 3) * 600, y = 150 + P.hash(i * 5) * 450; g.beginPath(); g.moveTo(x - 10, y); g.quadraticCurveTo(x - 4, y - 6, x, y); g.quadraticCurveTo(x + 4, y - 6, x + 10, y); g.stroke(); }
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      skyCeil = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 0.12 });
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), skyCeil);
    m.rotation.x = Math.PI / 2;
    m.userData.noMerge = true;
    return m;
  }

  /* ---------- Sky outside, light shafts, dust ---------- */
  function skyDome() {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "#5f8fc4"); grd.addColorStop(0.45, "#a9c6e0"); grd.addColorStop(0.5, "#e8e4da"); grd.addColorStop(1, "#bdb3a2");
    g.fillStyle = grd; g.fillRect(0, 0, 16, 256);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    const m = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
    m.renderOrder = -1;
    m.userData.noMerge = true;
    return m;
  }

  // A volume of hazy sunlight from a roof opening down to `bottomY`, clipped to `clip` (x0,x1,z0,z1)
  function shaft(rect, topY, bottomY, clip, strength) {
    const drop = topY - bottomY, off = SUN_DIR.clone().multiplyScalar(drop / -SUN_DIR.y);
    const c = [[rect.x0, rect.z0], [rect.x1, rect.z0], [rect.x1, rect.z1], [rect.x0, rect.z1]];
    const pos = [];
    const top = c.map(([x, z]) => new V3(x, topY, z)), bot = top.map((p) => p.clone().add(off));
    const quad = (a, b, cc, d) => { [a, b, cc, a, cc, d].forEach((p) => pos.push(p.x, p.y, p.z)); };
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(top[i], top[j], bot[j], bot[i]); }
    quad(bot[0], bot[1], bot[2], bot[3]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const planes = clip ? [new THREE.Plane(new V3(1, 0, 0), -clip.x0), new THREE.Plane(new V3(-1, 0, 0), clip.x1), new THREE.Plane(new V3(0, 0, 1), -clip.z0), new THREE.Plane(new V3(0, 0, -1), clip.z1)] : [];
    const m = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: topY }, uBot: { value: bottomY }, uTime: { value: 0 }, uStr: { value: strength || 0.05 }, uDir: { value: SUN_DIR } },
      vertexShader: [
        "varying vec3 vW;",
        "#include <clipping_planes_pars_vertex>",
        "void main() {",
        "  vec4 w = modelMatrix * vec4(position, 1.0);",
        "  vW = w.xyz;",
        "  vec4 mvPosition = viewMatrix * w;",
        "  gl_Position = projectionMatrix * mvPosition;",
        "  #include <clipping_planes_vertex>",
        "}",
      ].join("\n"),
      fragmentShader: `uniform float uTop; uniform float uBot; uniform float uTime; uniform float uStr; uniform vec3 uDir; varying vec3 vW;
        #include <clipping_planes_pars_fragment>
        void main(){
          #include <clipping_planes_fragment>
          vec3 p = vW - uDir * (vW.y / uDir.y);
          float streak = 0.55 + 0.25 * sin(p.x * 3.1 + uTime * 0.05) * sin(p.z * 2.3 - uTime * 0.04) + 0.2 * sin((p.x + p.z) * 9.0);
          float fade = smoothstep(uBot, uBot + 2.5, vW.y) * smoothstep(uTop, uTop - 1.0, vW.y);
          gl_FragColor = vec4(vec3(1.0, 0.92, 0.78) * uStr * streak * fade, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      clipping: true, clippingPlanes: planes,
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.userData.noMerge = true;
    mesh.renderOrder = 5;
    return mesh;
  }

  function dust(boxes, n) {
    const pos = new Float32Array(n * 3), seeds = [];
    for (let i = 0; i < n; i++) {
      const b = boxes[i % boxes.length];
      const y = b.y0 + Math.random() * (b.y1 - b.y0);
      const off = SUN_DIR.clone().multiplyScalar((b.top - y) / -SUN_DIR.y);
      const x = b.x0 + Math.random() * (b.x1 - b.x0) + off.x, z = b.z0 + Math.random() * (b.z1 - b.z0) + off.z;
      pos.set([x, y, z], i * 3);
      seeds.push({ x, y, z, b, s: Math.random() * 100 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const gg = c.getContext("2d"), rg = gg.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, "rgba(255,240,210,1)"); rg.addColorStop(1, "rgba(255,240,210,0)");
    gg.fillStyle = rg; gg.fillRect(0, 0, 32, 32);
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.025, map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    pts.userData.noMerge = true;
    pts.userData.seeds = seeds;
    pts.frustumCulled = false;
    return pts;
  }

  /* ---------- Glass roofs ---------- */
  // Flat skylight / laylight: iron grid of glass panes over an opening at height y
  function skylight(g, r, y, o) {
    o = Object.assign({ iron: L.whiteIron(), bars: 0.6 }, o);
    const glass = F.glass();
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), glass);
    pane.rotation.x = Math.PI / 2; pane.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    pane.userData.noMerge = true;
    g.add(pane);
    for (let x = r.x0; x <= r.x1 + 0.01; x += o.bars) { const b = K.bx(0.04, 0.08, r.z1 - r.z0, o.iron, x, y, (r.z0 + r.z1) / 2); b.castShadow = true; g.add(b); }
    for (let z = r.z0; z <= r.z1 + 0.01; z += o.bars) { const b = K.bx(r.x1 - r.x0, 0.06, 0.03, o.iron, (r.x0 + r.x1) / 2, y, z); b.castShadow = true; g.add(b); }
    // a gilt-edged coved frame around it
    const cove = L.gilt();
    [[r.x0, r.z0, r.x1, r.z0], [r.x0, r.z1, r.x1, r.z1]].forEach(([a, z, b]) => g.add(K.rbox(b - a + 0.3, 0.15, 0.15, 0.04, cove, (a + b) / 2, y - 0.08, z)));
    [[r.x0], [r.x1]].forEach(([x]) => g.add(K.rbox(0.15, 0.15, r.z1 - r.z0 + 0.3, 0.04, cove, x, y - 0.08, (r.z0 + r.z1) / 2)));
  }

  // Lantern skylight: glazed box rising above the roof (VIP salon)
  function lantern(g, r, y, h) {
    const iron = L.whiteIron(), glass = F.glass();
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, w = r.x1 - r.x0, d = r.z1 - r.z0;
    // glazed walls of the lantern
    [[w, cz - d / 2, 0], [w, cz + d / 2, 0]].forEach(([len, z]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, h), glass); p.position.set(cx, y + h / 2, z); p.userData.noMerge = true; g.add(p); });
    [[d, cx - w / 2], [d, cx + w / 2]].forEach(([len, x]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(len, h), glass); p.position.set(x, y + h / 2, cz); p.rotation.y = Math.PI / 2; p.userData.noMerge = true; g.add(p); });
    for (let x = r.x0; x <= r.x1 + 0.01; x += 0.6) [r.z0, r.z1].forEach((z) => { const b = K.bx(0.05, h, 0.05, iron, x, y + h / 2, z); b.castShadow = true; g.add(b); });
    for (let z = r.z0; z <= r.z1 + 0.01; z += 0.6) [r.x0, r.x1].forEach((x) => { const b = K.bx(0.05, h, 0.05, iron, x, y + h / 2, z); b.castShadow = true; g.add(b); });
    // pitched glass roof
    const ridge = y + h + 0.8;
    [-1, 1].forEach((s) => {
      const len = Math.hypot(d / 2, 0.8);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, len), glass);
      p.position.set(cx, y + h + 0.4, cz + s * d / 4);
      p.rotation.x = -Math.PI / 2 + s * Math.atan2(0.8, d / 2);
      p.userData.noMerge = true;
      g.add(p);
      for (let x = r.x0; x <= r.x1 + 0.01; x += 0.6) { const b = K.bx(0.05, 0.06, len, iron, x, y + h + 0.4, cz + s * d / 4); b.rotation.x = s * Math.atan2(0.8, d / 2); b.castShadow = true; g.add(b); }
    });
    g.add(K.bx(w, 0.08, 0.08, iron, cx, ridge, cz));
  }

  // Barrel-vaulted glass roof along Z over the winter garden, springing from y0 between x = ±hw
  function vault(g, hw, y0, rise, z0, z1) {
    const iron = L.whiteIron(), glass = F.glass();
    const R = (hw * hw + rise * rise) / (2 * rise), cy = y0 + rise - R, a0 = Math.asin(hw / R);
    const geo = new THREE.CylinderGeometry(R, R, z1 - z0, 48, 1, true, -a0, 2 * a0);
    geo.rotateX(Math.PI / 2);
    const shell = new THREE.Mesh(geo, glass);
    shell.position.set(0, cy, (z0 + z1) / 2);
    shell.rotation.z = 0;
    shell.userData.noMerge = true;
    // CylinderGeometry's theta 0 points at +Z before rotation; after rotateX it points at -Y... rotate to the top
    shell.geometry.rotateZ(Math.PI);
    g.add(shell);
    // arched ribs every 1.2 m and purlins
    for (let z = z0; z <= z1 + 0.01; z += 1.2) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 6, 48, 2 * a0), iron);
      rib.position.set(0, cy, z);
      rib.rotation.z = Math.PI / 2 - a0;
      rib.castShadow = true;
      g.add(rib);
    }
    for (let i = 0; i <= 12; i++) {
      const a = -a0 + (i / 12) * 2 * a0;
      const p = K.bx(0.035, 0.035, z1 - z0, iron, Math.sin(a) * R, cy + Math.cos(a) * R, (z0 + z1) / 2);
      p.castShadow = true;
      g.add(p);
    }
    return { R, cy, a0 };
  }

  /* ---------- Items in display cases ---------- */
  const sizeCache = {};
  function itemSize(kind) {
    if (!sizeCache[kind]) {
      const probe = RC.makeItem(kind);
      sizeCache[kind] = K.bounds(probe).getSize(new V3());
      probe.traverse((o) => { const i = RC.jewels.glints.indexOf(o); if (i >= 0) RC.jewels.glints.splice(i, 1); });
    }
    return sizeCache[kind];
  }

  /* ======================================================================
     Build the whole house
     ====================================================================== */
  RC.interiors = RC.interiors || {};
  RC.interiors.maison = function (def) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#c8d4e0");
    const S = new THREE.Group();          // static: merged into few draw calls at the end
    const D = new THREE.Group();          // dynamic: items, people, glass, lights
    scene.add(S, D);
    const clickables = [], obstacles = [], lights = [], flames = [], waters = [];
    const lowPower = !!RC.lowPower;

    const block = (obj, level, pad) => {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      pad = pad === undefined ? 0.04 : pad;
      obstacles.push({ box: { minX: b.min.x + pad, maxX: b.max.x - pad, minZ: b.min.z + pad, maxZ: b.max.z - pad }, y0: level, y1: level + 2.2 });
    };
    const circle = (x, z, r, level) => obstacles.push({ x, z, r, y0: level, y1: level + 2.2 });

    /* ----- materials per room ----- */
    const M = {
      marbleFloor: P.mat("marbleFloor", { scale: 1.2, envI: 1.1 }),
      checker: P.mat("checkerMarble", { scale: 1.3, envI: 1.1 }),
      oak: P.mat("chevron", { scale: 1.6 }),
      walnutFloor: P.mat("chevron", { base: "#80512c", dark: "#4a2a14", scale: 1.6 }),
      tiles: P.mat("encaustic", { scale: 0.5 }),
      plaster: F.paint("#f2ede2", 0.85),
      grisTrianon: F.paint("#dcd7ca", 0.6),
      stoneWhite: F.paint("#e6dfcf", 0.7),
      celadon: F.paint("#d3ddd0", 0.6),
      pistachio: F.paint("#c8d9b6", 0.55),
      roseDamask: P.mat("damask", { base: "#a9666f", motif: "#b2727a", scale: 0.34, sheen: 0.2, sheenColor: "#ffe6ea" }),
      limestone: P.mat("limestone", { scale: 1.2 }),
      white: F.paint("#f0ebdf", 0.45),
    };

    /* ===================== Shell ===================== */
    const R = {
      display: { x0: -X, x1: X, z0: 1, z1: ZF },
      hall: { x0: -X, x1: X, z0: VOID.z0, z1: 1 },
      bar: { x0: -X, x1: X, z0: ZB, z1: VOID.z0 - T },
      salon: { x0: -X, x1: X, z0: 1, z1: ZF },
      galW: { x0: -X, x1: VOID.x0, z0: VOID.z0, z1: 1 },
      galE: { x0: VOID.x1, x1: X, z0: VOID.z0, z1: 1 },
      garden: { x0: -X, x1: X, z0: ZB, z1: VOID.z0 },
      ante: { x0: -X, x1: X, z0: 1, z1: 3 },
      vip: { x0: -X, x1: X, z0: 3 + T, z1: ZF },
      galW2: { x0: -X, x1: VOID.x0, z0: VOID.z0, z1: 1 },
    };

    // Ground floor
    const frontOpen = [{ u: 0, w: 1.6, h: 3.3, arch: true }, { u: -3.7, w: 2.5, h: 3.5, y: 0.55, arch: true, trim: true }, { u: 3.7, w: 2.5, h: 3.5, y: 0.55, arch: true }];
    room(S, { r: R.display, y: 0, floor: M.marbleFloor, wallMat: M.grisTrianon, panel: { paint: F.paint("#e7e2d5", 0.5) }, walls: { w: {}, e: {}, n: { open: frontOpen } } });
    room(S, { r: R.hall, y: 0, floor: M.marbleFloor, wallMat: M.stoneWhite, ceilRects: [{ x0: -X, x1: VOID.x0, z0: VOID.z0, z1: 1 }, { x0: VOID.x1, x1: X, z0: VOID.z0, z1: 1 }], panel: { paint: F.paint("#ece6d8", 0.5) },
      walls: { w: { panel: false }, e: {}, s: { open: [{ u: 0, w: 5.2, h: 4.1, arch: true }] } } });
    room(S, { r: R.bar, y: 0, floor: M.checker, wallMat: M.pistachio, panel: { paint: F.paint("#d6e4c6", 0.45), panelW: 1.4 }, walls: { w: {}, e: {}, s: {}, n: { open: [{ u: 0, w: 5.2, h: 4.1, arch: true }] } } });
    // First floor
    const winsL1 = [-4.6, 0, 4.6].map((u) => ({ u, w: 1.7, h: 3.2, y: 0.4, arch: true }));
    room(S, { r: R.salon, y: FH, floor: M.oak, wallMat: M.celadon, panel: { paint: F.paint("#e9eee6", 0.5) }, walls: { w: {}, e: {}, n: { open: winsL1 } } });
    room(S, { r: R.galW, y: FH, floor: M.oak, wallMat: M.celadon, panel: { paint: F.paint("#e9eee6", 0.5) }, walls: { w: {} } });
    room(S, { r: R.galE, y: FH, floor: M.oak, ceil: false, wallMat: M.celadon, panel: { paint: F.paint("#e9eee6", 0.5) }, walls: { e: { h: CH } } });
    room(S, { r: R.garden, y: FH, floor: M.tiles, ceil: false, wallMat: M.limestone, walls: { w: {}, e: {}, s: { open: [{ u: 0, w: 3.0, h: 3.6, y: 0.4, arch: true }] } } });
    // Second floor
    const winsL2 = [-4.6, 0, 4.6].map((u) => ({ u, w: 1.5, h: 2.7, y: 0.5, arch: false }));
    room(S, { r: R.ante, y: FH * 2, floor: M.walnutFloor, wallMat: M.roseDamask, panel: { paint: F.paint("#efe8dc", 0.45), inset: M.roseDamask }, walls: { w: {}, e: {}, n: { open: [{ u: 0, w: 1.9, h: 3.1 }] } } });
    room(S, { r: R.vip, y: FH * 2, floor: M.walnutFloor, wallMat: M.roseDamask, ceilRects: [
      { x0: -X, x1: X, z0: 3 + T, z1: 4.6 }, { x0: -X, x1: X, z0: 8.4, z1: ZF }, { x0: -X, x1: -2.4, z0: 4.6, z1: 8.4 }, { x0: 2.4, x1: X, z0: 4.6, z1: 8.4 }],
    panel: { paint: F.paint("#efe8dc", 0.45), inset: M.roseDamask }, walls: { w: {}, e: {}, n: { open: winsL2 }, s: { open: [{ u: 0, w: 1.9, h: 3.1 }] } } });
    room(S, { r: R.galW2, y: FH * 2, floor: M.walnutFloor, wallMat: M.roseDamask, panel: { paint: F.paint("#efe8dc", 0.45), inset: M.roseDamask }, walls: { w: {}, s: {} } });
    // walls around the light well where no room owns them
    room(S, { r: { x0: VOID.x1, x1: X, z0: VOID.z0, z1: 1 }, y: FH * 2, wallMat: M.stoneWhite, ceil: false, panel: { paint: F.paint("#ece6d8", 0.5) }, walls: { e: {} } });
    room(S, { r: { x0: VOID.x0, x1: X, z0: VOID.z0, z1: 1 }, y: FH * 2, wallMat: M.stoneWhite, ceilRects: [{ x0: VOID.x1, x1: X, z0: VOID.z0, z1: 1 }], panel: { paint: F.paint("#ece6d8", 0.5) }, walls: { s: { open: [-2.4, 0, 2.4].map((u) => ({ u, w: 1.3, h: 2.6, y: 0.9, arch: true })) } } });

    // windows in the openings
    frontOpen.slice(1).forEach((o) => S.add(onWall(windowUnit(o.w, o.h, true), R.display, "n", o.u, o.y, -0.05)));
    winsL1.forEach((o) => S.add(onWall(windowUnit(o.w, o.h, true), R.salon, "n", o.u, FH + o.y, -0.05)));
    winsL2.forEach((o) => S.add(onWall(windowUnit(o.w, o.h, false), R.vip, "n", o.u, FH * 2 + o.y, -0.05)));
    S.add(onWall(windowUnit(3.0, 3.6, true), R.garden, "s", 0, FH + 0.4, -0.05));
    [-2.4, 0, 2.4].forEach((u) => S.add(onWall(windowUnit(1.3, 2.6, true), { x0: VOID.x0, x1: X, z0: VOID.z0, z1: 1 }, "s", u, FH * 2 + 0.9, -0.05)));
    // bright hazy daylight beyond the front windows
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshBasicMaterial({ color: "#f3ead8", fog: false }));
    haze.position.set(0, 7, ZF + 4); haze.rotation.y = Math.PI;
    haze.userData.noMerge = true;
    D.add(haze);
    const hazeB = haze.clone(); hazeB.position.set(0, 7, ZB - 3); hazeB.rotation.y = 0; hazeB.material = new THREE.MeshBasicMaterial({ color: "#e9eef2", fog: false });
    D.add(hazeB);

    // the front door (closed, seen from inside) with its brass knob
    const doorM = F.paint("#14281e", 0.35);
    const door = new THREE.Group();
    door.add(K.rbox(1.55, 2.5, 0.07, 0.01, doorM, 0, 1.25, 0));
    const dpane = new THREE.Mesh(new THREE.ShapeGeometry(K.archShape(1.5, 0.75, new THREE.Shape()), 12), F.glass());
    dpane.position.set(0, 2.55, 0); dpane.userData.noMerge = true;
    door.add(dpane);
    [-0.39, 0.39].forEach((x) => { door.add(K.bx(0.66, 1.25, 0.012, F.glass(), x, 1.55, 0.04)); door.add(K.frame(0.7, 1.3, 0.04, 0.02, L.gilt(), x, 1.55, 0.04)); door.add(K.frame(0.6, 0.6, 0.06, 0.03, doorM, x, 0.45, 0.04)); });
    door.children.forEach((c) => { if (c.material === F.glass()) c.userData.noMerge = true; });
    onWall(door, R.display, "n", 0, 0, 0.12);
    S.add(door);
    const knob = K.sphere(0.04, L.brass(), -0.62, 1.05, ZF - 0.22, 14, 10);
    D.add(knob);
    const bell = K.lathe([[0, 0], [0.06, 0], [0.05, 0.05], [0.025, 0.1], [0, 0.11]], L.brass(), 16, 0, 3.0, ZF - 0.35);
    bell.rotation.x = Math.PI;
    D.add(bell);

    /* ===================== Slab edges, columns, balustrades ===================== */
    const fascia = (x0, z0, x1, z1, y) => {
      const len = Math.hypot(x1 - x0, z1 - z0), along = Math.abs(x1 - x0) > 0.01;
      S.add(K.rbox(along ? len : 0.36, 0.55, along ? 0.36 : len, 0.04, M.white, (x0 + x1) / 2, y - 0.275 + 0.3, (z0 + z1) / 2));
      S.add(K.bx(along ? len : 0.37, 0.03, along ? 0.37 : len, L.gilt(), (x0 + x1) / 2, y - 0.2, (z0 + z1) / 2));
    };
    [FH, FH * 2].forEach((y) => {
      fascia(VOID.x0, 1, VOID.x1, 1, y);
      fascia(VOID.x0, VOID.z0, VOID.x0, 1, y);
    });
    fascia(VOID.x1, VOID.z0, VOID.x1, 1, FH);
    fascia(VOID.x0, VOID.z0, VOID.x1, VOID.z0, FH);
    fascia(-X, VOID.z0, X, VOID.z0, FH * 2);
    fascia(VOID.x1, 1, X, 1, FH * 2);
    fascia(-X, VOID.z0, X, VOID.z0, FH * 3 - 0.3);
    // columns at the corners of the light well
    [-1, 1].forEach((s) => {
      column(S, s * VOID.x1, 1, 0, CH);
      column(S, s * VOID.x1, 1, FH, CH);
      column(S, s * VOID.x1, 1, FH * 2, CH);
      column(S, s * VOID.x1, VOID.z0, FH, CH);
      circle(s * VOID.x1, 1, 0.4, 0); circle(s * VOID.x1, 1, 0.4, FH); circle(s * VOID.x1, 1, 0.4, FH * 2);
      circle(s * VOID.x1, VOID.z0, 0.4, FH);
    });
    // L0 partition walls block walking
    obstacles.push({ box: { minX: -X, maxX: -2.6, minZ: VOID.z0 - T, maxZ: VOID.z0 }, y0: 0, y1: CH });
    obstacles.push({ box: { minX: 2.6, maxX: X, minZ: VOID.z0 - T, maxZ: VOID.z0 }, y0: 0, y1: CH });
    obstacles.push({ box: { minX: -X, maxX: -0.95, minZ: 3.0, maxZ: 3.0 + T }, y0: FH * 2, y1: FH * 2 + CH });
    obstacles.push({ box: { minX: 0.95, maxX: X, minZ: 3.0, maxZ: 3.0 + T }, y0: FH * 2, y1: FH * 2 + CH });
    // thresholds under the two partition doorways
    S.add(K.bx(5.2, 0.1, T, L.whiteMarble(), 0, -0.05, VOID.z0 - T / 2));
    S.add(K.bx(1.9, 0.1, T, L.whiteMarble(), 0, FH * 2 - 0.05, 3.0 + T / 2));

    // balustrades
    railRun(S, -3.2, 1.05, 3.2, 1.05, FH);
    railRun(S, VOID.x0 - 0.05, VOID.z0, VOID.x0 - 0.05, 1, FH);
    railRun(S, VOID.x1 + 0.05, VOID.z0, VOID.x1 + 0.05, 1, FH);
    railRun(S, VOID.x0, VOID.z0 - 0.05, VOID.x1, VOID.z0 - 0.05, FH);
    railRun(S, VOID.x0, 1.05, VOID.x1, 1.05, FH * 2);
    railRun(S, 6.4, 1.05, X, 1.05, FH * 2);
    railRun(S, VOID.x0 - 0.05, VOID.z0, VOID.x0 - 0.05, 1, FH * 2);

    /* ===================== Staircases ===================== */
    const STAIRS = [
      { x0: -6.4, x1: -4.8, zB: 1.0, zT: -3.0, yB: 0, yT: 2.5 },
      { x0: -4.8, x1: -3.2, zB: -3.0, zT: 1.0, yB: 2.5, yT: FH },
      { x0: 3.2, x1: 4.8, zB: 1.0, zT: -3.0, yB: FH, yT: FH + 2.5 },
      { x0: 4.8, x1: 6.4, zB: -3.0, zT: 1.0, yB: FH + 2.5, yT: FH * 2 },
    ];
    STAIRS.forEach((s) => flight(S, s.x0, s.x1, s.zB, s.zT, s.yB, s.yT));
    const landings = [{ x0: -6.4, x1: -3.2, z0: VOID.z0, z1: -3.0, y: 2.5 }, { x0: 3.2, x1: 6.4, z0: VOID.z0, z1: -3.0, y: FH + 2.5 }];
    landings.forEach((l) => {
      S.add(K.rbox(l.x1 - l.x0, 0.06, l.z1 - l.z0, 0.015, L.whiteMarble(), (l.x0 + l.x1) / 2, l.y - 0.03, (l.z0 + l.z1) / 2));
      S.add(K.bx(l.x1 - l.x0, 0.3, l.z1 - l.z0, F.paint("#efe9dc", 0.8), (l.x0 + l.x1) / 2, l.y - 0.21, (l.z0 + l.z1) / 2));
      S.add(K.bx(l.x1 - l.x0 - 0.4, 0.012, l.z1 - l.z0 - 0.3, L.runner(), (l.x0 + l.x1) / 2, l.y + 0.006, (l.z0 + l.z1) / 2));
    });
    // closed panelling under the first flight, rails on the open sides
    const under = new THREE.Shape();
    under.moveTo(1.0, 0); under.lineTo(-3.0, 0); under.lineTo(-3.0, 2.3); under.lineTo(1.0, -0.2); under.closePath();
    const ug = new THREE.ExtrudeGeometry(under, { depth: 0.08, bevelEnabled: false });
    const um = new THREE.Mesh(ug, F.paint("#ece6d8", 0.5));
    um.rotation.y = -Math.PI / 2; um.position.set(-4.8 + 0.04, 0, 0);
    S.add(um);
    stairRail(S, -4.85, 1.0, -3.0, 0, 2.5);
    stairRail(S, -3.2, -3.0, 1.0, 2.5, FH);
    stairRail(S, -4.75, -3.0, 1.0, 2.5, FH);
    stairRail(S, 3.2, 1.0, -3.0, FH, FH + 2.5);
    stairRail(S, 4.75, 1.0, -3.0, FH, FH + 2.5);
    stairRail(S, 4.85, -3.0, 1.0, FH + 2.5, FH * 2);
    stairRail(S, 6.4, -3.0, 1.0, FH + 2.5, FH * 2);
    railRun(S, -3.2, VOID.z0, -3.2, -3.0, 2.5);
    railRun(S, 3.2, VOID.z0, 3.2, -3.0, FH + 2.5);
    railRun(S, 3.2, VOID.z0 - 0.05, 6.4, VOID.z0 - 0.05, FH + 2.5);

    /* ===================== Roofs and skylights ===================== */
    const roofY = FH * 2 + CH;
    // over the light well: a great flat laylight in an iron grid
    skylight(S, { x0: VOID.x0, x1: VOID.x1, z0: VOID.z0, z1: 1 }, roofY + 0.15, { bars: 0.8 });
    // VIP lantern
    lantern(S, { x0: -2.4, x1: 2.4, z0: 4.6, z1: 8.4 }, roofY + T, 1.2);
    // garden: glass vault
    const vaultInfo = vault(S, X, FH + CH, 2.6, ZB, VOID.z0);
    // walls closing the vault ends (the back gable has a glazed lunette)
    const gable = new THREE.Shape();
    gable.moveTo(-X, 0);
    for (let i = 0; i <= 24; i++) { const a = -vaultInfo.a0 + (i / 24) * 2 * vaultInfo.a0; gable.lineTo(Math.sin(a) * vaultInfo.R, vaultInfo.cy + Math.cos(a) * vaultInfo.R - (FH + CH)); }
    gable.lineTo(X, 0); gable.closePath();
    const lun = new THREE.Path(); lun.moveTo(1.6, 0.15); lun.absarc(0, 0.15, 1.6, 0, Math.PI, false); lun.closePath(); gable.holes.push(lun);
    const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: T, bevelEnabled: false, curveSegments: 24 }), M.limestone);
    gm.position.set(0, FH + CH, ZB - T); gm.castShadow = true; S.add(gm);
    const lunGlass = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24, 0, Math.PI), F.glass());
    lunGlass.position.set(0, FH + CH + 0.15, ZB - 0.15); lunGlass.userData.noMerge = true; D.add(lunGlass);
    for (let i = 1; i < 6; i++) { const a = (i / 6) * Math.PI; const b = K.bx(0.04, 1.6, 0.05, L.whiteIron(), Math.cos(a) * 0.8, FH + CH + Math.sin(a) * 0.8, ZB - 0.12); b.rotation.z = a - Math.PI / 2; S.add(b); }
    // main roof slab (with holes for the skylights)
    [{ x0: -X, x1: X, z0: 1, z1: 4.6 }, { x0: -X, x1: X, z0: 8.4, z1: ZF }, { x0: -X, x1: -2.4, z0: 4.6, z1: 8.4 }, { x0: 2.4, x1: X, z0: 4.6, z1: 8.4 },
      { x0: -X, x1: VOID.x0, z0: VOID.z0, z1: 1 }, { x0: VOID.x1, x1: X, z0: VOID.z0, z1: 1 }].forEach((r) => {
      const m = K.bx(r.x1 - r.x0, 0.4, r.z1 - r.z0, M.plaster, (r.x0 + r.x1) / 2, roofY + T + 0.2, (r.z0 + r.z1) / 2);
      m.castShadow = true; S.add(m);
    });
    // exterior walls high enough to shade the sun correctly
    [[-X - 0.2, ZB, ZF], [X + 0.2, ZB, ZF]].forEach(([x, z0, z1]) => { const w = K.bx(0.1, 16, z1 - z0, M.plaster, x, 8, (z0 + z1) / 2); w.castShadow = true; w.visible = true; S.add(w); });

    /* ===================== The Display Salon (ground floor, front) ===================== */
    const slots = { display: [], salon: [], vip: [] };
    const addSlots = (area, obj, maxH, scale, limit) => {
      obj.updateMatrixWorld(true);
      (obj.userData.slots || []).slice(0, limit || 99).forEach((p) => slots[area].push({ pos: obj.localToWorld(p.clone()), ry: obj.rotation.y, maxH, scale: scale || 1.5 }));
    };
    const roseCeiling = (x, y, z) => ceilingRose(S, x, y, z, 0.55);

    // wall vitrines, mirrors and consoles along both side walls
    [-1, 1].forEach((s) => {
      const side = s < 0 ? "w" : "e";
      [3.4, 6.0, 8.6].forEach((u, i) => {
        const v = F.vitrineWall(1.5, 2.75, { back: F.velvet(i === 1 ? "#1d2f45" : "#2a1b2e") });
        onWall(v, R.display, side, u, 0, 0.3);
        D.add(v);
        addSlots("display", v, 0.5, 1.5, 6);
        block(v, 0);
      });
      [4.7, 7.3].forEach((u) => {
        const c = F.consoleTable(1.0, { top: L.rougeMarble() });
        onWall(c, R.display, side, u, 0, 0.24);
        S.add(c);
        S.add(onWall(F.mirror(1.0, 1.7), R.display, side, u, 2.0, 0.03));
        const fl = FL.bouquet({ kind: u < 5 ? "peonies" : "roses", colours: u < 5 ? ["#f2b8c6", "#f8e0e6", "#e890a8"] : ["#fbf4ec", "#f2dcc8"], vase: "porcelain", size: 0.55, h: 0.32 });
        onWall(fl, R.display, side, u, 0.9, 0.24);
        D.add(fl);
      });
    });
    // centre: four table vitrines around a tower vitrine holding the star piece
    [[-2.3, 3.6], [2.3, 3.6], [-2.3, 7.0], [2.3, 7.0]].forEach(([x, z], i) => {
      const v = F.vitrineTable(1.5, 0.8, { bed: F.velvet(i % 2 ? "#203a5a" : "#3a1a2a") });
      put(D, v, x, 0, z, Math.PI / 2);
      addSlots("display", v, 0.12, 1.4, 4);
      block(v, 0);
    });
    const tower = F.vitrineTower({});
    put(D, tower, 0, 0, 5.3);
    tower.updateMatrixWorld(true);
    circle(0, 5.3, 0.55, 0);
    const towerSlot = { pos: tower.localToWorld(tower.userData.slots[0].clone()), ry: 0, maxH: 0.45, scale: 1.8, feature: true };
    // window seats: bergères and a guéridon with flowers by each display window
    [-1, 1].forEach((s) => {
      const gx = s * 5.1, gz = 8.6;
      put(S, F.gueridon({ r: 0.32 }), gx, 0, gz);
      put(D, FL.bouquet({ kind: "tulips", colours: s < 0 ? ["#f7c6d0", "#fbe7ea"] : ["#fbf6e8", "#f4e2b8"], vase: "crystal", size: 0.32, h: 0.22 }), gx, 0.75, gz);
      const b1 = put(S, F.bergere({ cover: F.velvet("#2c4a6e") }), gx - 0.75, 0, gz - 0.1, Math.PI / 2 - 0.35);
      const b2 = put(S, F.bergere({ cover: F.velvet("#2c4a6e") }), gx + 0.75, 0, gz - 0.1, -Math.PI / 2 + 0.35);
      [b1, b2].forEach((b) => block(b, 0));
      circle(gx, gz, 0.4, 0);
    });
    S.add(F.rug(2.6, 1.8, { field: "#e6d8bc", border: "#2c3e5a", accent: "#7a2e3e", flower: "#b05a6a" }).translateZ(9.0));
    // chandeliers
    [[0, 3.3], [0, 7.6]].forEach(([x, z]) => {
      const c = F.chandelier({ r: 0.75 });
      put(D, c, x, CH, z);
      roseCeiling(x, CH, z);
      flames.push(...c.userData.flames);
      const l = new THREE.PointLight("#ffd9a8", 1.1, 11, 2);
      l.position.set(x, CH + c.userData.lightY, z);
      D.add(l); lights.push(l);
    });
    coffers(S, R.display, CH, 3, 3, F.paint("#ece6d8", 0.6));

    /* ===================== Stair hall ===================== */
    // round "borne" settee with a palm on top — a grand Paris hall classic
    const borne = new THREE.Group();
    borne.add(K.cyl(1.0, 1.05, 0.3, L.giltwood(), 0, 0.15, 0, 48));
    borne.add(K.cyl(0.98, 0.98, 0.14, F.velvet("#6a1f2e"), 0, 0.37, 0, 48));
    borne.add(K.lathe([[0, 0], [0.5, 0], [0.45, 0.3], [0.32, 0.7], [0.3, 0.75], [0, 0.75]], F.velvet("#6a1f2e"), 32, 0, 0.44, 0));
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; borne.add(K.sphere(0.014, F.velvet("#6a1f2e"), Math.cos(a) * 0.42, 0.75, Math.sin(a) * 0.42, 6, 5)); }
    borne.add(K.blob(2.6, 2.6, 0.5));
    put(S, borne, 1.4, 0, -1.6);
    put(D, FL.palm({ h: 2.0, pot: "brass", fronds: 10 }), 1.4, 1.15, -1.6);
    circle(1.4, -1.6, 1.15, 0);
    put(D, FL.palm({ h: 2.4, pot: "porcelain" }), 6.2, 0, -3.7);
    circle(6.2, -3.7, 0.5, 0);
    put(S, F.mirror(2.2, 3.0), X - 0.05, 1.2, -1.7, -Math.PI / 2);
    const hallUrn = FL.bouquet({ kind: "lilies", colours: ["#fbf8f2", "#f6efe2"], vase: "urn", size: 0.9, h: 0.75 });
    const ped = K.lathe([[0, 0], [0.3, 0], [0.3, 0.08], [0.18, 0.15], [0.16, 0.9], [0.26, 1.0], [0.26, 1.06], [0, 1.06]], L.whiteMarble(), 32);
    ped.castShadow = true;
    put(S, ped, 5.9, 0, 0.1);
    put(D, hallUrn, 5.9, 1.06, 0.1);
    circle(5.9, 0.1, 0.4, 0);

    /* ===================== Salon de Thé (ground floor, back) ===================== */
    const bz = -9.5;
    const bar = F.barCounter(5.2);
    put(S, bar, 0, 0, bz);
    block(bar, 0);
    const back = F.backBar(6.4);
    onWall(back, R.bar, "s", 0, 0, 0.3);
    S.add(back);
    block(back, 0);
    put(D, F.cakeStand(), -1.6, 1.08, bz + 0.05);
    put(D, F.champagneSet(), 1.7, 1.08, bz + 0.05);
    put(D, FL.bouquet({ kind: "hydrangea", colours: ["#ffffff"], hydrangea: ["#dfe6f4", "#e8dcef", "#f1f3f8"], vase: "silver", size: 0.45, h: 0.3 }), 0.1, 1.08, bz + 0.05);
    for (let i = 0; i < 4; i++) put(S, F.barStool({ cover: F.velvet("#2f5a45") }), -1.8 + i * 1.2, 0, bz + 0.85);
    const pc = F.pastryCase(1.8);
    put(D, pc, -5.4, 0, -11.1);
    block(pc, 0);
    // banquettes along the side walls, café tables before them
    [-1, 1].forEach((s) => {
      const side = s < 0 ? "w" : "e";
      const bq = F.banquette(4.6, { cover: F.velvet(s < 0 ? "#5c1e2c" : "#2f5a45") });
      onWall(bq, R.bar, side, -7.4, 0, 0.32);
      S.add(bq);
      block(bq, 0);
      const big = F.mirror(4.0, 1.8, { crest: true });
      onWall(big, R.bar, side, -7.4, 2.45, 0.04);
      S.add(big);
      [-5.6, -8.4].forEach((z, k) => {
        const tx = s * 5.6;
        put(S, F.gueridon({ top: L.whiteMarble(), metal: L.brass(), r: 0.34 }), tx, 0, z);
        circle(tx, z, 0.42, 0);
        const ch = put(S, F.bistroChair(), tx - s * 0.75, 0, z, s * -Math.PI / 2 + Math.PI);
        circle(ch.position.x, ch.position.z, 0.28, 0);
        put(D, FL.bouquet({ kind: k ? "roses" : "tulips", colours: k ? ["#f4b6c2", "#fbe2e8"] : ["#fbf2d0", "#f6d68a"], vase: "silver", size: 0.24, h: 0.16 }), tx + s * 0.12, 0.745, z - 0.08);
        put(D, F.cupAndSaucer(), tx - s * 0.16, 0.745, z + 0.1);
        if (k === 0) put(D, F.cakeStand(), tx + s * 0.05, 0.745, z + 0.16);
        else put(D, F.teapot(), tx + s * 0.06, 0.745, z + 0.14);
      });
    });
    // two tables in the middle with cabriolet chairs
    [[-2.2, -6.3], [2.2, -6.3]].forEach(([x, z], i) => {
      put(S, F.gueridon({ top: L.whiteMarble(), metal: L.gilt(), r: 0.38 }), x, 0, z);
      put(S, F.cabriolet({ cover: F.silk("#e8c4cc", "#d4a4b0") }), x - 0.62, 0, z, Math.PI / 2);
      put(S, F.cabriolet({ cover: F.silk("#e8c4cc", "#d4a4b0") }), x + 0.62, 0, z, -Math.PI / 2);
      circle(x, z, 0.95, 0);
      put(D, FL.bouquet({ kind: "roses", colours: i ? ["#f9e6c8", "#f3c890"] : ["#fae0e6", "#f2b0c0"], vase: "crystal", size: 0.28, h: 0.2 }), x, 0.745, z);
      put(D, F.cupAndSaucer(), x - 0.18, 0.745, z + 0.12);
      put(D, F.cupAndSaucer(), x + 0.18, 0.745, z - 0.1);
    });
    const skyC = paintedSky(9, 4.6);
    skyC.position.set(0, CH - 0.02, -8.2);
    D.add(skyC);
    S.add(K.frame(9.3, 4.9, 0.18, 0.08, L.gilt(), 0, CH - 0.06, -8.2).rotateX(Math.PI / 2));
    [[-3.6, -7.0], [3.6, -7.0]].forEach(([x, z]) => {
      const c = F.chandelier({ r: 0.55, tiers: 1, arms: 6 });
      put(D, c, x, CH, z);
      flames.push(...c.userData.flames);
      const l = new THREE.PointLight("#ffd2a0", 0.9, 9, 2);
      l.position.set(x, CH + c.userData.lightY, z);
      D.add(l); lights.push(l);
    });
    [-1, 1].forEach((s) => [-5.0, -10.6].forEach((z) => S.add(onWall(F.sconce(), R.bar, s < 0 ? "w" : "e", z, 2.1, 0.02))));

    /* ===================== Grand Salon (first floor, front) ===================== */
    const y1 = FH;
    S.add(F.rug(6.0, 4.2, { field: "#ece0c8", border: "#3e5a48", accent: "#a85a68", flower: "#b8626e", leaf: "#6a8a5a" }).translateY(y1).translateZ(5.6));
    // consultation counters: vendor behind, two client chairs in front
    [-3.4, 3.4].forEach((x, i) => {
      const c = F.counter(2.2, { bed: F.velvet(i ? "#1e3a2e" : "#3a1a2a") });
      put(D, c, x, y1, 5.4);
      addSlots("salon", c, 0.12, 1.5, 6);
      block(c, y1);
      [-0.5, 0.5].forEach((dx) => { const ch = put(S, F.cabriolet({}), x + dx, y1, 6.35, Math.PI); circle(ch.position.x, ch.position.z, 0.3, y1); });
      put(D, FL.bouquet({ kind: "orchid", colours: ["#fbf6f8", "#f4dce6"], vase: "celadon", size: 0.4, h: 0.2 }), x + (i ? -0.85 : 0.85), y1 + 0.94, 5.25);
    });
    // wall vitrines on the side walls
    [-1, 1].forEach((s) => [2.6, 7.8].forEach((u) => {
      const v = F.vitrineWall(1.6, 2.8, { wood: L.walnut(), back: F.velvet("#24302a") });
      onWall(v, R.salon, s < 0 ? "w" : "e", u, y1, 0.3);
      D.add(v);
      addSlots("salon", v, 0.5, 1.5, 6);
      block(v, y1);
    }));
    [-1, 1].forEach((s) => {
      const c = F.consoleTable(1.2, { top: L.whiteMarble() });
      onWall(c, R.salon, s < 0 ? "w" : "e", 5.2, y1, 0.24);
      S.add(c);
      S.add(onWall(F.mirror(1.3, 1.9), R.salon, s < 0 ? "w" : "e", 5.2, y1 + 2.1, 0.03));
      const fl = FL.bouquet({ kind: "mixed", colours: ["#f6c8d0", "#fbf3ec", "#e8a0b4"], vase: "porcelain", size: 0.6, h: 0.34 });
      onWall(fl, R.salon, s < 0 ? "w" : "e", 5.2, y1 + 0.9, 0.24);
      D.add(fl);
    });
    // window seating: canapé, two bergères and a low table
    put(S, F.canape({ cover: F.velvet("#7a3a4a"), w: 2.0 }), 0, y1, 9.15, Math.PI);
    put(S, F.lowTable(1.1, 0.6), 0, y1, 8.15);
    put(S, F.bergere({ cover: F.silk("#e6d6b4", "#cdb58a") }), -1.55, y1, 8.1, Math.PI / 2);
    put(S, F.bergere({ cover: F.silk("#e6d6b4", "#cdb58a") }), 1.55, y1, 8.1, -Math.PI / 2);
    obstacles.push({ box: { minX: -1.95, maxX: 1.95, minZ: 7.75, maxZ: 9.6 }, y0: y1, y1: y1 + 2 });
    put(D, FL.bouquet({ kind: "roses", colours: ["#fbe7ea", "#f4c0cc"], vase: "silver", size: 0.34, h: 0.2 }), 0, y1 + 0.48, 8.15);
    put(D, F.teapot(), 0.35, y1 + 0.48, 8.2);
    put(D, F.cupAndSaucer(), -0.38, y1 + 0.48, 8.1);
    // centre table with a grand arrangement
    put(S, F.gueridon({ top: L.greenMarble(), metal: L.gilt(), r: 0.5, h: 0.78 }), 0, y1, 3.2);
    put(D, FL.bouquet({ kind: "mixed", colours: ["#f9d5dc", "#fff5ee", "#eaa1b5", "#f6dcc0"], vase: "porcelain", size: 0.85, h: 0.45 }), 0, y1 + 0.78, 3.2);
    circle(0, 3.2, 0.6, y1);
    [[-4.2, 4.3], [4.2, 4.3]].forEach(([x, z]) => {
      const c = F.chandelier({ r: 0.7 });
      put(D, c, x, y1 + CH, z);
      ceilingRose(S, x, y1 + CH, z, 0.5);
      flames.push(...c.userData.flames);
      const l = new THREE.PointLight("#ffd9a8", 1.0, 10, 2);
      l.position.set(x, y1 + CH + c.userData.lightY, z);
      D.add(l); lights.push(l);
    });
    [-4.6, 0, 4.6].forEach((u) => S.add(onWall(F.drapes(2.0, 3.4, "#5e7a64"), R.salon, "n", u, y1 + 0.1, 0.1)));
    coffers(S, R.salon, y1 + CH, 3, 2, F.paint("#eef1ea", 0.6));

    // galleries: a bench and a palm on the west, flowers on the east
    const benchW = F.banquette(2.2, { cover: F.velvet("#5e7a64"), wood: L.giltwood() });
    onWall(benchW, R.galW, "w", -1.6, y1, 0.32);
    S.add(benchW); block(benchW, y1);
    put(D, FL.palm({ h: 2.0, pot: "porcelain" }), -6.2, y1, 0.3);
    circle(-6.2, 0.3, 0.45, y1);
    const ce = F.consoleTable(1.2, { top: L.greenMarble() });
    onWall(ce, R.galE, "e", -3.6, y1, 0.24);
    S.add(ce);
    const ceF = FL.bouquet({ kind: "lilies", colours: ["#fff8f0", "#fbe8e0"], vase: "celadon", size: 0.55, h: 0.36 });
    onWall(ceF, R.galE, "e", -3.6, y1 + 0.88, 0.24);
    D.add(ceF);

    /* ===================== Winter Garden (first floor, back) ===================== */
    const fo = F.fountain({});
    put(D, fo, 0, y1, -8.4);
    waters.push(fo.userData.water);
    circle(0, -8.4, 1.35, y1);
    [[-5.6, -5.4], [5.6, -5.4], [-5.6, -11.2], [5.6, -11.2]].forEach(([x, z]) => { put(D, FL.citrus({}), x, y1, z); circle(x, z, 0.5, y1); });
    [[-6.3, -8.4], [6.3, -8.4]].forEach(([x, z]) => { put(D, FL.palm({ h: 2.8, pot: "terracotta", fronds: 13 }), x, y1, z); circle(x, z, 0.5, y1); });
    [[-1.6, -5.3], [1.6, -5.3]].forEach(([x, z]) => { put(D, FL.topiary({}), x, y1, z); circle(x, z, 0.3, y1); });
    // seating groups
    put(S, F.gardenTable({}), -3.4, y1, -10.7);
    put(S, F.peacockChair({}), -4.3, y1, -10.4, Math.PI / 2 + 0.3);
    put(S, F.peacockChair({ cushion: F.velvet("#7a9a7a") }), -2.5, y1, -10.4, -Math.PI / 2 - 0.3);
    obstacles.push({ box: { minX: -4.8, maxX: -2.0, minZ: -11.3, maxZ: -10.0 }, y0: y1, y1: y1 + 2 });
    put(D, FL.bouquet({ kind: "orchid", colours: ["#e8c8e8", "#fbeefa"], vase: "celadon", size: 0.32, h: 0.18 }), -3.4, y1 + 0.72, -10.7);
    put(D, F.teapot(), -3.2, y1 + 0.72, -10.5);
    put(S, F.gardenTable({}), 3.4, y1, -10.7);
    [-1, 0, 1].forEach((k) => { const a = Math.PI + k * 1.2; put(S, F.gardenChair({}), 3.4 + Math.sin(a) * 0.7, y1, -10.7 + Math.cos(a) * 0.7, a + Math.PI); });
    circle(3.4, -10.7, 1.0, y1);
    put(D, FL.bouquet({ kind: "roses", colours: ["#fff6f0", "#f8d4dc"], vase: "silver", size: 0.3, h: 0.2 }), 3.4, y1 + 0.72, -10.7);
    put(D, F.cakeStand(), 3.55, y1 + 0.72, -10.5);
    // garden benches facing the fountain
    [-1, 1].forEach((s) => {
      const b = new THREE.Group();
      b.add(K.rbox(1.5, 0.05, 0.45, 0.02, L.whiteIron(), 0, 0.45, 0));
      for (let i = 0; i < 8; i++) b.add(K.bx(0.015, 0.45, 0.015, L.whiteIron(), -0.7 + i * 0.2, 0.7, -0.21));
      b.add(K.tube([[-0.75, 0.95, -0.21], [0, 1.0, -0.22], [0.75, 0.95, -0.21]], 0.015, L.whiteIron(), 12));
      [-0.7, 0.7].forEach((x) => [-0.2, 0.2].forEach((z) => b.add(K.tube([[x, 0, z], [x * 0.98, 0.45, z]], 0.018, L.whiteIron(), 3))));
      b.add(K.blob(1.9, 0.9, 0.35));
      b.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      put(S, b, s * 2.7, y1, -8.4, s < 0 ? Math.PI / 2 : -Math.PI / 2);
      block(b, y1);
    });
    // the florist's stand: zinc buckets of cut flowers
    const stand = new THREE.Group();
    stand.add(K.rbox(1.6, 0.8, 0.6, 0.02, L.oak(), 0, 0.4, 0));
    stand.add(K.rbox(1.7, 0.04, 0.7, 0.01, L.oak(), 0, 0.82, 0));
    stand.add(K.blob(2, 1, 0.4));
    put(S, stand, 5.2, y1, -6.6, -Math.PI / 2);
    block(stand, y1);
    [["roses", ["#c01838", "#e02848"]], ["peonies", ["#f6c0d0", "#fbe4ea"]], ["tulips", ["#f8d040", "#fbe890"]], ["hydrangea", ["#fff"]]].forEach(([kind, cols], i) => {
      put(D, FL.bouquet({ kind, colours: cols, vase: "silver", size: 0.38, h: 0.26 }), 5.2, y1 + 0.84, -7.15 + i * 0.36);
    });
    // trellis and vines on the side walls
    [-1, 1].forEach((s) => {
      const x = s * (X - 0.05);
      for (let z = ZB + 0.6; z < VOID.z0 - 0.4; z += 0.5) S.add(K.bx(0.02, 3.6, 0.02, L.whiteIron(), x, y1 + 2.0, z));
      for (let y = 0.4; y < 4.0; y += 0.5) S.add(K.bx(0.02, 0.02, VOID.z0 - ZB - 1, L.whiteIron(), x, y1 + y, (ZB + VOID.z0) / 2));
      D.add(FL.vine([[x - s * 0.05, y1, -11.5], [x - s * 0.08, y1 + 1.5, -10.6], [x - s * 0.05, y1 + 3.0, -9.0], [x - s * 0.08, y1 + 3.8, -7.0], [x - s * 0.05, y1 + 4.4, -5.2]], { density: 30 }));
      D.add(FL.vine([[x - s * 0.05, y1, -6.0], [x - s * 0.08, y1 + 1.8, -6.8], [x - s * 0.06, y1 + 3.4, -8.2]], { density: 30 }));
    });
    [[-4.2, -5.0], [4.2, -5.0]].forEach(([x, z]) => {
      const pd = K.lathe([[0, 0], [0.2, 0], [0.2, 0.06], [0.12, 0.12], [0.1, 0.7], [0.18, 0.78], [0, 0.78]], P.mat("limestone", { scale: 0.8 }), 24);
      pd.castShadow = true;
      put(S, pd, x, y1, z);
      put(D, FL.fern({}), x, y1 + 0.78, z);
      circle(x, z, 0.35, y1);
    });

    /* ===================== Second floor: private landing and Salon Privé ===================== */
    const y2 = FH * 2;
    const desk = F.bureau(1.5, 0.75);
    put(S, desk, 2.6, y2, 2.1);
    block(desk, y2);
    put(D, FL.bouquet({ kind: "peonies", colours: ["#f4c4d0", "#fbe8ee"], vase: "crystal", size: 0.36, h: 0.24 }), 2.15, y2 + 0.77, 2.1);
    put(D, K.rbox(0.3, 0.02, 0.22, 0.005, F.velvet("#1f3a2a"), 0, 0, 0), 2.95, y2 + 0.775, 2.05);
    [-1, 1].forEach((s) => {
      const c = F.consoleTable(1.1, { top: L.whiteMarble() });
      onWall(c, R.ante, s < 0 ? "w" : "e", 2.0, y2, 0.24);
      S.add(c);
      const fl = FL.bouquet({ kind: s < 0 ? "lilies" : "hydrangea", colours: ["#fff6f0", "#fbe2e4"], hydrangea: ["#f4d4dc", "#fbe8ee", "#e8c4d4"], vase: "porcelain", size: 0.55, h: 0.34 });
      onWall(fl, R.ante, s < 0 ? "w" : "e", 2.0, y2 + 0.9, 0.24);
      D.add(fl);
    });
    const dd = F.doubleDoor(1.9, 3.1, { wood: F.paint("#efe8dc", 0.45), open: 1.35 });
    dd.position.set(0, y2, 3.0 + T);
    S.add(dd);
    // salon privé
    S.add(F.rug(7.0, 5.0, { field: "#e8d2c8", border: "#5c2632", accent: "#2f4a5a", flower: "#b05a6a" }).translateY(y2).translateZ(6.6));
    const vipTower = F.vitrineTower({ bed: F.velvet("#2a0f1c"), r: 0.45 });
    put(D, vipTower, -0.6, y2, 6.0);
    vipTower.updateMatrixWorld(true);
    circle(-0.6, 6.0, 0.6, y2);
    const vipSlot = { pos: vipTower.localToWorld(vipTower.userData.slots[0].clone()), ry: 0, maxH: 0.45, scale: 1.8, feature: true };
    const fp = F.fireplace({});
    onWall(fp, R.vip, "w", 6.6, y2, 0.15);
    S.add(fp);
    S.add(onWall(F.mirror(1.5, 1.8), R.vip, "w", 6.6, y2 + 2.25, 0.04));
    block(fp, y2);
    put(S, F.bergere({ cover: F.velvet("#7a2e3e") }), -5.4, y2, 5.3, 0.15);
    put(S, F.bergere({ cover: F.velvet("#7a2e3e") }), -5.4, y2, 7.9, Math.PI - 0.15);
    put(S, F.lowTable(1.1, 0.7, { top: L.blackMarble() }), -4.9, y2, 6.6);
    put(S, F.canape({ cover: F.velvet("#b76e79"), w: 2.0 }), -3.5, y2, 6.6, -Math.PI / 2);
    obstacles.push({ box: { minX: -6.0, maxX: -3.05, minZ: 4.9, maxZ: 8.3 }, y0: y2, y1: y2 + 2 });
    put(D, F.champagneSet(), -4.75, y2 + 0.48, 6.5);
    put(D, F.cakeStand(), -5.05, y2 + 0.48, 6.85);
    put(D, FL.bouquet({ kind: "peonies", colours: ["#fbe8ee", "#f6c8d4", "#ffffff"], vase: "crystal", size: 0.3, h: 0.2 }), -5.0, y2 + 0.48, 6.25);
    // private consultation desk
    const vd = F.bureau(1.7, 0.85, { wood: L.mahogany() });
    put(S, vd, 4.0, y2, 6.6, Math.PI / 2);
    block(vd, y2);
    put(S, F.bergere({ cover: F.velvet("#2c3a5e") }), 4.95, y2, 6.6, -Math.PI / 2);
    [6.1, 7.1].forEach((z) => put(S, F.cabriolet({ cover: F.silk("#e8ccd2", "#d6aab4") }), 3.0, y2, z, Math.PI / 2));
    obstacles.push({ box: { minX: 2.6, maxX: 5.4, minZ: 5.6, maxZ: 7.6 }, y0: y2, y1: y2 + 2 });
    put(D, FL.bouquet({ kind: "orchid", colours: ["#ffffff", "#fbeef4"], vase: "celadon", size: 0.34, h: 0.18 }), 4.2, y2 + 0.77, 7.2);
    const tray = K.rbox(0.36, 0.015, 0.26, 0.006, F.velvet("#1a2a4a"), 0, 0, 0);
    put(D, tray, 4.0, y2 + 0.775, 6.4);
    const vipDeskSlot = { pos: new V3(4.0, y2 + 0.79, 6.4), ry: Math.PI / 2, maxH: 0.2, scale: 1.4, feature: true };
    // VIP wall vitrines
    [[-1, 4.0], [1, 9.0], [-1, 9.0]].forEach(([s, u]) => {
      const v = F.vitrineWall(1.4, 2.7, { wood: L.ebony(), back: F.velvet("#2a0f1c"), shelves: 3 });
      onWall(v, R.vip, s < 0 ? "w" : "e", u, y2, 0.3);
      D.add(v);
      addSlots("vip", v, 0.5, 1.6, 4);
      block(v, y2);
    });
    const vc = F.consoleTable(1.2, { top: L.rougeMarble() });
    onWall(vc, R.vip, "e", 4.0, y2, 0.24);
    S.add(vc);
    S.add(onWall(F.mirror(1.3, 1.8), R.vip, "e", 4.0, y2 + 2.1, 0.03));
    const vcf = FL.bouquet({ kind: "mixed", colours: ["#f4c4d0", "#ffffff", "#b76e79"], vase: "silver", size: 0.6, h: 0.32 });
    onWall(vcf, R.vip, "e", 4.0, y2 + 0.9, 0.24);
    D.add(vcf);
    [-4.6, 0, 4.6].forEach((u) => S.add(onWall(F.drapes(1.8, 2.9, "#7a2e3e"), R.vip, "n", u, y2 + 0.2, 0.1)));
    const vch = F.chandelier({ r: 0.6, tiers: 2, arms: 6 });
    put(D, vch, 3.9, y2 + CH, 6.6);
    ceilingRose(S, 3.9, y2 + CH, 6.6, 0.45);
    flames.push(...vch.userData.flames);
    const vl = new THREE.PointLight("#ffd9a8", 0.8, 9, 2);
    vl.position.set(3.9, y2 + CH + vch.userData.lightY, 6.6);
    D.add(vl); lights.push(vl);
    // second-floor gallery: a bench to sit and look down the light well
    const b2 = F.canape({ cover: F.velvet("#b76e79"), w: 1.8 });
    onWall(b2, R.galW2, "w", -1.6, y2, 0.45);
    S.add(b2); block(b2, y2);
    put(D, FL.aspidistra(), -6.4, y2, 0.5);

    /* ===================== Sunlight ===================== */
    const sun = new THREE.DirectionalLight("#fff0d8", 2.5);
    const tgt = new V3(0, 6, -2);
    sun.position.copy(tgt).addScaledVector(SUN_DIR, -40);
    sun.target.position.copy(tgt);
    sun.castShadow = true;
    const sc = sun.shadow.camera;
    sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 5; sc.far = 80;
    sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    scene.add(new THREE.HemisphereLight("#e6ecf4", "#8a7458", 0.18));
    const skyD = skyDome();
    D.add(skyD);

    // shafts of light: through the great laylight (clipped to the light well) and the VIP lantern
    const shafts = [
      shaft({ x0: VOID.x0, x1: VOID.x1, z0: VOID.z0, z1: 1 }, roofY + 0.15, 0, { x0: VOID.x0, x1: VOID.x1, z0: VOID.z0, z1: 1 }, 0.022),
      shaft({ x0: -2.4, x1: 2.4, z0: 4.6, z1: 8.4 }, roofY + T, y2, { x0: -X, x1: X, z0: 3, z1: ZF }, 0.022),
    ];
    shafts.forEach((s) => D.add(s));
    const motes = dust([
      { x0: VOID.x0, x1: VOID.x1, z0: VOID.z0, z1: 1, y0: 0.5, y1: roofY, top: roofY },
      { x0: -2.4, x1: 2.4, z0: 4.6, z1: 8.4, y0: y2 + 0.3, y1: roofY, top: roofY },
      { x0: -X, x1: X, z0: ZB, z1: VOID.z0, y0: y1 + 0.3, y1: y1 + 5, top: y1 + 5 },
    ], lowPower ? 250 : 700);
    D.add(motes);

    // where does the sun fall? (used to make stones sparkle more in sunlit spots)
    const sunAt = (p) => {
      const off = (roofY - p.y) / -SUN_DIR.y;
      const qx = p.x - SUN_DIR.x * off, qz = p.z - SUN_DIR.z * off;
      if (p.y > y2 - 0.5 && qx > -2.4 && qx < 2.4 && qz > 4.6 && qz < 8.4) return 1;
      if (qx > VOID.x0 && qx < VOID.x1 && qz > VOID.z0 && qz < 1 && p.x > VOID.x0 - 0.5 && p.x < VOID.x1 + 0.5 && p.z < 1.5) return 0.8;
      if (p.y > y1 - 0.3 && p.y < y2 - 0.3 && p.z < VOID.z0) return 0.9;
      return 0.1;
    };

    /* ===================== Items ===================== */
    const byArea = { display: [], salon: [], vip: [] };
    def.items.forEach((it) => (byArea[it.area] || byArea.display).push(it));
    const place = (info, slot) => {
      const it = RC.makeItem(info.kind);
      const sz = itemSize(info.kind);
      const sc = Math.min(slot.scale, slot.maxH / Math.max(sz.y, 0.01));
      it.scale.setScalar(sc);
      it.position.copy(slot.pos);
      it.rotation.y = slot.ry + (slot.feature ? 0 : (P.hash(Math.round(slot.pos.x * 31 + slot.pos.z * 17)) - 0.5) * 0.4);
      it.userData.info = { name: info.name, note: info.note, area: info.area };
      it.traverse((o) => { if (o.isMesh) o.castShadow = false; });
      K.mergeStatic(it);
      D.add(it);
      clickables.push(it);
      return it;
    };
    ["display", "salon", "vip"].forEach((area) => {
      const list = byArea[area];
      if (!list.length) return;
      const feat = list.filter((i) => i.feature), rest = list.filter((i) => !i.feature);
      if (area === "display" && feat[0]) place(feat[0], towerSlot);
      if (area === "vip") { if (feat[0]) place(feat[0], vipSlot); if (feat[1]) place(feat[1], vipDeskSlot); }
      const pool = rest.length ? rest : list;
      // spread pieces over the case slots, but leave some breathing space, as a good jeweller does
      slots[area].forEach((s, i) => {
        if ((i % 4 === 3 && area !== "vip") || (lowPower && i % 2)) return;
        const info = pool[i % pool.length];
        const sz = itemSize(info.kind);
        if (s.maxH < 0.2 && sz.y > 0.2) {
          const alt = pool.find((p) => itemSize(p.kind).y <= 0.2);
          if (alt) place(alt, s);
          return;
        }
        place(info, s);
      });
    });

    /* ===================== Staff ===================== */
    const POSTS = {
      doorman: { p: [1.55, 0, 8.9], ry: -Math.PI / 2 - 0.4, area: "display", pose: ["back", "back"] },
      display: { p: [-3.4, 0, 1.9], ry: Math.PI / 4, area: "display", pose: ["front", "front"] },
      barman: { p: [0.4, 0, -10.5], ry: 0, area: "bar", pose: ["counter", "counter"] },
      waitress: { p: [2.9, 0, -8.0], ry: Math.PI - 0.6, area: "bar", pose: ["tray", "side"] },
      salon: { p: [-3.4, y1, 4.6], ry: 0, area: "salon", pose: ["counter", "counter"] },
      salon2: { p: [2.6, y1, 1.9], ry: Math.PI - 0.7, area: "salon", pose: ["back", "back"] },
      florist: { p: [-2.0, y1, -6.2], ry: Math.PI * 0.8, area: "garden", pose: ["front", "hold"] },
      vipHost: { p: [1.4, y2, 1.6], ry: Math.PI / 2 + 0.4, area: "ante", pose: ["front", "front"] },
      director: { p: [5.1, y2, 5.5], ry: -Math.PI / 2, area: "vip", pose: ["front", "side"] },
    };
    const staff = [];
    (def.staff || []).forEach((sd) => {
      const post = POSTS[sd.role];
      if (!post) return;
      const person = RC.makePerson(Object.assign({}, sd.look, { pose: sd.look.pose || post.pose }));
      person.group.position.set(...post.p);
      person.group.rotation.y = post.ry;
      D.add(person.group);
      person.group.traverse((o) => { if (o.isMesh) o.userData.staff = sd.role; });
      clickables.push(person.group);
      person.group.userData.staffRole = sd.role;
      circle(post.p[0], post.p[2], 0.35, post.p[1]);
      staff.push({ def: sd, person, post: { pos: new V3(...post.p), ry: post.ry }, area: post.area, level: post.p[1], greeted: false, chatIdx: 0, mode: "post" });
    });

    /* ===================== Navigation ===================== */
    const inset = 0.32;
    const nav = {
      floors: [
        { y: 0, rects: [{ x0: -X + inset, x1: X - inset, z0: ZB + inset, z1: ZF - inset }], holes: [{ x0: -6.4, x1: -4.8 + 0.02, z0: -3.0, z1: 1.0 }, { x0: -6.4, x1: -3.2, z0: VOID.z0 - 0.3, z1: -3.0 }] },
        { y: 2.5, rects: [{ x0: -6.4 + 0.3, x1: -3.2 - 0.25, z0: VOID.z0 + inset, z1: -3.0 + 0.01 }] },
        { y: FH, rects: [
          { x0: -X + inset, x1: X - inset, z0: 1.3, z1: ZF - inset },
          { x0: -4.8 + 0.25, x1: -3.2 - 0.25, z0: 0.98, z1: 1.32 }, { x0: 3.2 + 0.25, x1: 4.8 - 0.25, z0: 0.98, z1: 1.32 },
          { x0: -X + inset, x1: VOID.x0 - inset, z0: VOID.z0 - 0.4, z1: 1.32 }, { x0: VOID.x1 + inset, x1: X - inset, z0: VOID.z0 - 0.4, z1: 1.32 },
          { x0: -X + inset, x1: X - inset, z0: ZB + inset, z1: VOID.z0 - inset },
        ] },
        { y: FH + 2.5, rects: [{ x0: 3.2 + 0.25, x1: 6.4 - 0.3, z0: VOID.z0 + inset, z1: -3.0 + 0.01 }] },
        { y: FH * 2, rects: [
          { x0: -X + inset, x1: X - inset, z0: 1.3, z1: ZF - inset },
          { x0: 4.8 + 0.25, x1: 6.4 - 0.25, z0: 0.98, z1: 1.32 },
          { x0: -X + inset, x1: VOID.x0 - inset, z0: VOID.z0 + inset, z1: 1.32 },
        ] },
      ],
      stairs: STAIRS.map((s) => ({ x0: s.x0 + 0.25, x1: s.x1 - 0.25, zB: s.zB, zT: s.zT, yB: s.yB, yT: s.yT })),
    };

    const areas = [
      { id: "display", name: "The Display Salon", floor: "Ground floor", y: 0, r: R.display },
      { id: "hall", name: "The Stair Hall", floor: "Ground floor", y: 0, r: R.hall },
      { id: "bar", name: "The Salon de Thé", floor: "Ground floor", y: 0, r: R.bar },
      { id: "salon", name: "The Grand Salon", floor: "First floor", y: FH, r: R.salon },
      { id: "gallery", name: "The Gallery", floor: "First floor", y: FH, r: { x0: -X, x1: X, z0: VOID.z0, z1: 1 } },
      { id: "garden", name: "The Winter Garden", floor: "First floor", y: FH, r: R.garden },
      { id: "ante", name: "The Private Landing", floor: "Second floor", y: FH * 2, r: { x0: -X, x1: X, z0: VOID.z0, z1: 3 } },
      { id: "vip", name: "The Salon Privé", floor: "Second floor", y: FH * 2, r: R.vip },
    ];
    const areaAt = (p) => {
      for (const s of nav.stairs) if (p.x > s.x0 - 0.3 && p.x < s.x1 + 0.3 && p.z > Math.min(s.zB, s.zT) - 0.05 && p.z < Math.max(s.zB, s.zT) + 0.05 && p.y > s.yB + 0.15 && p.y < s.yT - 0.15) return { id: "stairs", name: "The Grand Staircase", floor: "" };
      if ((p.y > 2.2 && p.y < 2.8) || (p.y > FH + 2.2 && p.y < FH + 2.8)) return { id: "stairs", name: "The Grand Staircase", floor: "" };
      for (const a of areas) if (Math.abs(p.y - a.y) < 1.2 && p.x >= a.r.x0 && p.x <= a.r.x1 && p.z >= a.r.z0 && p.z <= a.r.z1) return a;
      return null;
    };

    // escorts: a member of staff offers to show you up the stairs
    const escorts = [
      {
        role: "display", trigger: { x: -5.6, z: 2.1, y: 0, r: 1.5 }, area: "salon",
        path: [[-5.6, 0, 1.7], [-5.6, 0, 1.05], [-5.6, 2.5, -3.0], [-5.6, 2.5, -3.7], [-4.0, 2.5, -3.7], [-4.0, 2.5, -3.0], [-4.0, FH, 1.0], [-4.0, FH, 2.0], [-2.6, FH, 2.6]],
      },
      {
        role: "salon2", trigger: { x: 4.0, z: 2.0, y: FH, r: 1.5 }, area: "vip",
        path: [[4.0, FH, 1.7], [4.0, FH, 1.05], [4.0, FH + 2.5, -3.0], [4.0, FH + 2.5, -3.7], [5.6, FH + 2.5, -3.7], [5.6, FH + 2.5, -3.0], [5.6, FH * 2, 1.0], [5.6, FH * 2, 1.8], [3.9, FH * 2, 1.7]],
      },
    ];

    /* ===================== Merge static geometry ===================== */
    S.traverse((o) => { if (o.isMesh && o.castShadow === false && !o.userData.noMerge) o.receiveShadow = true; });
    K.mergeStatic(S);
    D.traverse((o) => { if (o.isMesh && !o.material.transparent && o.receiveShadow === false) o.receiveShadow = true; });
    // merge the static parts of dynamic groups too (display cases etc.), leaving items and people alone
    D.children.forEach((c) => { if (!c.userData.info && !c.userData.staffRole && c.isGroup && !c.userData.noMerge) K.mergeStatic(c); });

    const tmpV = new V3();
    return {
      scene, clickables, obstacles, nav, areas, areaAt, staff, escorts, knob, sunAt, lights,
      spawn: { x: 0, y: 0, z: 8.0, yaw: 0 },
      exit: { x: 0, z: 9.35, y: 0, r: 0.8 },
      exposure: 0.72,
      envProbe: new V3(0, 2.0, 2.0),
      update(t, dt, ctx) {
        shafts.forEach((s) => { s.material.uniforms.uTime.value = t; });
        const pa = motes.geometry.attributes.position;
        motes.userData.seeds.forEach((sd, i) => {
          const y = sd.y + Math.sin(t * 0.13 + sd.s) * 0.25;
          pa.setXYZ(i, sd.x + Math.sin(t * 0.07 + sd.s * 1.3) * 0.3, y, sd.z + Math.cos(t * 0.05 + sd.s) * 0.3);
        });
        pa.needsUpdate = true;
        waters.forEach((w) => { w.material.clearcoatRoughness = 0.02 + Math.sin(t * 2) * 0.01; w.rotation.z = t * 0.05; });
        RC.jewels.twinkle(t, ctx.cam, sunAt);
      },
    };
  };
})();
