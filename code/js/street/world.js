/* Builds Rosecat Lane (street + shopfronts) and each shop interior.
   Facade local space: width along X, front face at z = 0, street side is +Z. */

(function () {
  const { mat } = RC;
  const { GOLD, BRASS, DARKWOOD } = RC.mats;

  // Centre-positioned helpers
  function bx(w, h, d, m, x, y, z) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    return o;
  }
  function pl(w, h, m, x, y, z) {
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    o.position.set(x, y, z);
    return o;
  }
  function cy(r1, r2, h, m, x, y, z, seg) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 16), m);
    o.position.set(x, y, z);
    return o;
  }

  const STONE = () => mat("#d8cfbe", { r: 0.9 });
  const PAINT = () => mat("#ece6d8", { r: 0.7 });
  const IRON = () => mat("#1b1b1e", { r: 0.5, m: 0.4 });
  const DARK_GLASS = () => mat("#1d2532", { r: 0.12, m: 0.6 });
  const LIT_GLASS = () => mat("#b8864a", { e: "#e8a050", ei: 0.55, r: 0.3 });

  function wallMat(type, w, h) {
    if (type === "stucco") return mat("#ffffff", { map: RC.tex.stucco(w / 3, h / 3), r: 0.95 });
    if (type === "yellow") return mat("#ffffff", { map: RC.tex.yellowBrick(w / 2.4, h / 2.4), r: 0.95 });
    return mat("#ffffff", { map: RC.tex.brick(w / 2.4, h / 2.4), r: 0.95 });
  }

  function stripes(c1, c2) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const g = c.getContext("2d");
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * 32, 0, 32, 64); }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ---------- Sash window with sill and decorative head ---------- */
  function sashWindow(g, x, y, w, h, head, lit) {
    g.add(pl(w, h, lit ? LIT_GLASS() : DARK_GLASS(), x, y + h / 2, 0.02));
    const p = PAINT();
    g.add(bx(w + 0.14, 0.09, 0.1, p, x, y + h, 0.04));
    g.add(bx(w + 0.14, 0.09, 0.1, p, x, y, 0.04));
    g.add(bx(0.08, h, 0.1, p, x - w / 2, y + h / 2, 0.04));
    g.add(bx(0.08, h, 0.1, p, x + w / 2, y + h / 2, 0.04));
    g.add(bx(w, 0.05, 0.07, p, x, y + h / 2, 0.04));
    g.add(bx(0.035, h, 0.05, p, x, y + h / 2, 0.035));
    g.add(bx(w + 0.32, 0.1, 0.26, STONE(), x, y - 0.1, 0.12));
    const s = STONE();
    if (head === "pediment") {
      g.add(bx(w + 0.4, 0.12, 0.2, s, x, y + h + 0.12, 0.08));
      const sh = new THREE.Shape();
      sh.moveTo(-(w / 2 + 0.25), 0); sh.lineTo(w / 2 + 0.25, 0); sh.lineTo(0, 0.38); sh.closePath();
      const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false }), s);
      ped.position.set(x, y + h + 0.18, 0);
      g.add(ped);
    } else if (head === "arched") {
      const sh = new THREE.Shape();
      sh.absarc(0, 0, w / 2 + 0.2, 0, Math.PI, false);
      sh.lineTo(-w / 2 + 0.02, 0);
      sh.absarc(0, 0, w / 2 - 0.02, Math.PI, 0, true);
      sh.closePath();
      const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false, curveSegments: 16 }), s);
      arch.position.set(x, y + h, 0);
      g.add(arch);
      const fan = new THREE.Mesh(new THREE.CircleGeometry(w / 2 - 0.02, 16, 0, Math.PI), lit ? LIT_GLASS() : DARK_GLASS());
      fan.position.set(x, y + h, 0.02);
      g.add(fan);
      g.add(bx(0.14, 0.24, 0.18, s, x, y + h + w / 2 + 0.05, 0.08));
    } else {
      g.add(bx(w + 0.3, 0.2, 0.14, s, x, y + h + 0.12, 0.06));
      g.add(bx(0.16, 0.26, 0.17, s, x, y + h + 0.12, 0.08));
    }
  }

  /* ---------- Upper storeys, cornice, chimneys ---------- */
  function upperFloors(g, W, H, wall, head, seed, bay, frontColor) {
    const base = 4.3;
    g.add(bx(W, H - base, 0.5, wallMat(wall, W, H - base), 0, base + (H - base) / 2, -0.25));
    const floors = H > 11.8 ? 3 : 2;
    const fh = (H - base - 1.2) / floors;
    for (let f = 0; f < floors; f++) {
      const y = base + 0.55 + f * fh;
      g.add(bx(W, 0.14, 0.12, STONE(), 0, y - 0.35, 0.04));
      const n = W >= 7 ? 3 : W >= 3.5 ? 2 : W >= 2 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0 : -W / 2 + (W / n) * (i + 0.5);
        const h = Math.min(1.9, fh - 0.85) * (f === 0 ? 1 : 0.9);
        const lit = ((seed * 7 + f * 3 + i * 5) % 7) < 2;
        if (bay && f === 0 && i === 1) {
          const bm = mat(frontColor, { r: 0.7 });
          g.add(bx(2.4, h + 0.9, 0.8, bm, 0, y + h / 2 + 0.1, 0.4));
          g.add(bx(2.6, 0.18, 1.0, STONE(), 0, y + h + 0.62, 0.45));
          g.add(bx(2.6, 0.18, 1.0, STONE(), 0, y - 0.38, 0.45));
          const bayG = new THREE.Group();
          bayG.position.z = 0.8;
          sashWindow(bayG, 0, y, 1.5, h, "plain", true);
          g.add(bayG);
          continue;
        }
        sashWindow(g, x, y, 1.05, h, head, lit);
      }
    }
    // Cornice with dentils, then parapet
    const cy0 = H - 0.5;
    g.add(bx(W + 0.1, 0.3, 0.6, STONE(), 0, cy0, 0.1));
    for (let x = -W / 2 + 0.15; x < W / 2; x += 0.3) g.add(bx(0.12, 0.12, 0.12, STONE(), x, cy0 - 0.21, 0.2));
    g.add(bx(W, 0.55, 0.35, wallMat(wall, W, 0.55), 0, H - 0.08, -0.15));
    g.add(bx(W + 0.1, 0.1, 0.42, STONE(), 0, H + 0.22, -0.15));
    if (W < 2) return;
    // Chimney stack and pots
    const cx = (seed % 2 ? 1 : -1) * (W / 2 - 1.1);
    g.add(bx(1.3, 1.7, 0.6, wallMat("brick", 1.3, 1.7), cx, H + 0.9, -1.8));
    g.add(bx(1.45, 0.12, 0.72, STONE(), cx, H + 1.78, -1.8));
    const pot = mat("#9a5a3a", { r: 0.9 });
    [-0.4, 0, 0.4].forEach((o) => g.add(cy(0.11, 0.14, 0.55, pot, cx + o, H + 2.1, -1.8, 10)));
  }

  /* ---------- A shop front ---------- */
  function buildShop(def, W, H, seed) {
    if (def.facade && RC.facades && RC.facades[def.facade]) return RC.facades[def.facade](def, W, H, seed);
    const g = new THREE.Group();
    const front = mat(def.front, { r: 0.45 });
    const frontDark = mat(RC.tex.shade(def.front, -0.06), { r: 0.5 });
    const trim = mat(def.trim, { m: 0.75, r: 0.3 });
    const half = W / 2;

    // Ground-floor wall behind the shopfront, with a gap for the door
    const gw = mat(RC.tex.shade(def.front, -0.1), { r: 0.6 });
    g.add(bx(half - 0.7, 4.3, 0.4, gw, -(half + 0.7) / 2, 2.15, -0.8));
    g.add(bx(half - 0.7, 4.3, 0.4, gw, (half + 0.7) / 2, 2.15, -0.8));
    g.add(bx(1.4, 1.2, 0.4, gw, 0, 3.7, -0.8));

    // Display windows
    const wx = half / 2 + 0.3, ww = half - 1.3;
    const back = mat(def.wallpaper, { e: def.wallpaper, ei: 0.5, r: 0.9 });
    const velvet = mat(RC.tex.shade(def.wallpaper, -0.12), { r: 1 });
    const glass = mat("#dfeef2", { o: 0.12, r: 0.05, m: 0.2 });
    const winItems = def.items.map((it) => it.kind);
    [-1, 1].forEach((side, wi) => {
      const x = side * wx;
      g.add(bx(ww + 0.2, 0.75, 0.3, frontDark, x, 0.375, 0.05));
      g.add(bx(ww + 0.1, 0.06, 0.4, trim, x, 0.76, 0.06));
      g.add(pl(ww, 2.4, glass, x, 1.95, 0.06));
      g.add(bx(ww, 0.08, 0.08, front, x, 2.65, 0.07));
      for (let m = 1; m < 3; m++) g.add(bx(0.04, 0.45, 0.06, front, x - ww / 2 + (ww / 3) * m, 2.9, 0.07));
      g.add(bx(0.06, 1.9, 0.06, front, x, 1.7, 0.07));
      // display box
      g.add(bx(ww, 0.05, 0.62, velvet, x, 0.76, -0.27));
      g.add(pl(ww, 2.4, back, x, 1.95, -0.58));
      g.add(bx(ww, 0.05, 0.62, back, x, 3.12, -0.27));
      [-1, 1].forEach((s) => {
        const sp = pl(0.62, 2.4, back, x + s * ww / 2, 1.95, -0.27);
        sp.rotation.y = -s * Math.PI / 2;
        g.add(sp);
      });
      // a few items from this shop in each window
      const picks = [winItems[(wi * 2) % winItems.length], winItems[(wi * 2 + 1) % winItems.length], winItems[(wi * 2 + 2) % winItems.length]];
      picks.forEach((kind, k) => {
        const it = RC.makeItem(kind);
        const size = new THREE.Box3().setFromObject(it).getSize(new THREE.Vector3());
        const big = size.y > 0.8;
        const sc = big ? Math.min(1, 1.5 / size.y) : Math.min(2.2, 0.45 / Math.max(size.y, size.x, 0.05));
        it.scale.setScalar(sc);
        const ix = x + (k - 1) * (ww / 3.2);
        if (!big) {
          g.add(cy(0.14, 0.16, 0.32 + (k % 2) * 0.2, velvet, ix, 0.78 + (0.32 + (k % 2) * 0.2) / 2, -0.3, 20));
          it.position.set(ix, 0.78 + 0.32 + (k % 2) * 0.2, -0.3);
        } else {
          it.position.set(ix, 0.79, -0.3);
        }
        it.rotation.y = (k - 1) * -0.35;
        g.add(it);
      });
    });

    // Pilasters with gilded consoles
    [-(half - 0.18), -0.85, 0.85, half - 0.18].forEach((x) => {
      g.add(bx(0.34, 3.3, 0.3, front, x, 1.65, 0.1));
      g.add(bx(0.4, 0.12, 0.34, frontDark, x, 0.06, 0.1));
      g.add(bx(0.42, 0.4, 0.42, frontDark, x, 3.08, 0.16));
      g.add(bx(0.44, 0.05, 0.44, trim, x, 2.86, 0.16));
      g.add(bx(0.06, 2.6, 0.04, trim, x, 1.8, 0.27));
    });

    // Fascia with gilded sign, cornice above
    g.add(bx(W - 0.1, 0.78, 0.14, front, 0, 3.72, 0.22));
    const signM = new THREE.MeshStandardMaterial({ map: RC.tex.sign(def.sign, def.subsign, def.front, def.trim), roughness: 0.5 });
    g.add(pl(W - 0.9, 0.62, signM, 0, 3.72, 0.296));
    g.add(bx(W + 0.1, 0.08, 0.5, trim, 0, 3.3, 0.18));
    g.add(bx(W + 0.2, 0.22, 0.7, frontDark, 0, 4.2, 0.16));
    g.add(bx(W + 0.25, 0.06, 0.74, trim, 0, 4.08, 0.16));

    // Recessed entrance: tiled step, reveals, fanlight
    g.add(bx(1.5, 0.06, 0.8, mat("#d8d2c4", { r: 0.5 }), 0, 0.03, -0.25));
    g.add(bx(0.6, 0.02, 0.4, mat("#7a2a2a", { r: 0.6 }), 0, 0.065, -0.25));
    [-0.72, 0.72].forEach((x) => g.add(bx(0.06, 3.1, 0.7, frontDark, x, 1.55, -0.27)));
    g.add(bx(1.5, 0.08, 0.7, frontDark, 0, 3.1, -0.27));
    g.add(pl(1.3, 0.32, LIT_GLASS(), 0, 2.9, -0.59));
    g.add(bx(1.4, 0.06, 0.08, front, 0, 2.72, -0.58));

    // Warm glow seen through the open door
    g.add(pl(1.4, 2.7, mat("#d9a060", { e: "#e8a050", ei: 0.6 }), 0, 1.35, -1.05));
    [-0.7, 0.7].forEach((x) => {
      const r = pl(0.45, 2.7, mat(RC.tex.shade(def.wallpaper, 0.05), { e: def.wallpaper, ei: 0.4 }), x, 1.35, -0.82);
      r.rotation.y = -Math.sign(x) * Math.PI / 2;
      g.add(r);
    });

    // Door on a hinge pivot
    const pivot = new THREE.Group();
    pivot.position.set(-0.6, 0, -0.6);
    const doorM = mat(RC.tex.shade(def.front, -0.04), { r: 0.45 });
    const door = new THREE.Group();
    door.add(bx(1.2, 2.68, 0.06, doorM, 0.6, 1.34, 0));
    door.add(pl(0.86, 1.0, LIT_GLASS(), 0.6, 1.85, 0.032));
    [0.6].forEach((x) => {
      door.add(bx(0.95, 0.05, 0.02, trim, x, 2.37, 0.035));
      door.add(bx(0.95, 0.05, 0.02, trim, x, 1.33, 0.035));
      door.add(bx(0.38, 0.75, 0.03, frontDark, x - 0.24, 0.6, 0.035));
      door.add(bx(0.38, 0.75, 0.03, frontDark, x + 0.24, 0.6, 0.035));
    });
    door.add(bx(0.08, 0.2, 0.015, BRASS(), 1.05, 1.0, 0.035));
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), BRASS());
    handle.position.set(1.05, 1.0, 0.08);
    door.add(handle);
    door.add(cy(0.012, 0.012, 0.05, BRASS(), 1.05, 1.0, 0.055).rotateX(Math.PI / 2));
    door.add(bx(0.18, 0.04, 0.015, BRASS(), 0.6, 1.15, 0.035));
    pivot.add(door);
    g.add(pivot);

    // Awning or a hanging bracket sign
    if (def.awning) {
      const t = stripes(def.awning, "#efe6d4");
      t.repeat.set(W / 2, 1);
      const am = new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide });
      const aw = pl(W - 0.5, 1.7, am, 0, 3.0, 0.95);
      aw.rotation.x = -1.2;
      g.add(aw);
      const vt = stripes(def.awning, "#efe6d4");
      vt.repeat.set(W / 2, 1);
      g.add(pl(W - 0.5, 0.25, new THREE.MeshStandardMaterial({ map: vt, roughness: 1, side: THREE.DoubleSide }), 0, 2.6, 1.72));
      [-1, 1].forEach((s) => {
        const arm = bx(0.03, 0.03, 1.7, IRON(), s * (half - 0.3), 2.95, 0.9);
        arm.rotation.x = -0.36;
        g.add(arm);
      });
    } else {
      const hx = half - 0.6;
      g.add(bx(0.05, 0.05, 1.5, IRON(), hx, 5.45, 0.75));
      const brace = bx(0.03, 0.03, 1.1, IRON(), hx, 5.15, 0.5);
      brace.rotation.x = 0.5;
      g.add(brace);
      const board = new THREE.Group();
      board.position.set(hx, 4.86, 0.95);
      const st = RC.tex.plate(def.sign.replace("ROSECAT ", "").replace("THE ", ""), def.front, def.trim, 512, 256);
      const bm = new THREE.MeshStandardMaterial({ map: st, roughness: 0.6 });
      board.add(bx(0.06, 0.62, 1.1, front, 0, 0, 0));
      const f1 = pl(1.0, 0.54, bm, 0.035, 0, 0); f1.rotation.y = Math.PI / 2;
      const f2 = pl(1.0, 0.54, bm, -0.035, 0, 0); f2.rotation.y = -Math.PI / 2;
      board.add(f1, f2);
      [-0.4, 0.4].forEach((z) => board.add(cy(0.006, 0.006, 0.42, IRON(), 0, 0.5, z, 4)));
      g.add(board);
      g.userData.swing = board;
    }

    // Shop light: makes the window and pavement glow
    const light = new THREE.PointLight("#ffc27a", 1.3, 9, 2);
    light.position.set(0, 2.6, 0.6);
    g.add(light);

    upperFloors(g, W, H, def.wall, def.upper === "bay" ? "plain" : def.upper, seed, def.upper === "bay", def.front);

    return { group: g, door: pivot, handle };
  }

  /* ---------- Plain terraced building (no shop) ---------- */
  function buildPlain(W, H, wall, seed, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    g.add(bx(W, 4.3, 0.5, wallMat(wall, W, 4.3), 0, 2.15, -0.25));
    g.add(bx(W, 0.5, 0.3, STONE(), 0, 0.25, 0.05));
    if (!opts.noGroundWindows) {
      const n = Math.max(1, Math.floor(W / 3));
      for (let i = 0; i < n; i++) {
        const x = -W / 2 + (W / n) * (i + 0.5);
        sashWindow(g, x, 1.1, 1.0, 1.9, "plain", (seed + i) % 3 === 0);
      }
    }
    upperFloors(g, W, H, wall, opts.head || "plain", seed);
    return g;
  }

  /* ---------- Gas lamp ---------- */
  function gasLamp(withLight) {
    const g = new THREE.Group();
    const iron = IRON();
    g.add(cy(0.16, 0.2, 0.45, iron, 0, 0.225, 0, 12));
    g.add(cy(0.06, 0.08, 2.9, iron, 0, 1.9, 0, 12));
    g.add(bx(0.6, 0.04, 0.04, iron, 0, 3.05, 0));
    g.add(cy(0.12, 0.07, 0.15, iron, 0, 3.4, 0, 4).rotateY(Math.PI / 4));
    const lantern = cy(0.2, 0.13, 0.5, mat("#ffe0a0", { e: "#ffc060", ei: 1.6, o: 0.9 }), 0, 3.72, 0, 4);
    lantern.rotation.y = Math.PI / 4;
    g.add(lantern);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4), iron);
    cap.position.y = 4.12; cap.rotation.y = Math.PI / 4;
    g.add(cap);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), iron).translateY(4.3));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: RC.tex.glow("rgba(255,200,120,0.9)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.set(2.2, 2.2, 1);
    glow.position.y = 3.72;
    g.add(glow);
    if (withLight) {
      const l = new THREE.PointLight("#ffbf70", 1.1, 11, 2);
      l.position.y = 3.6;
      g.add(l);
    }
    g.userData.lantern = lantern;
    return g;
  }

  function pillarBox() {
    const g = new THREE.Group();
    const red = mat("#a8161a", { r: 0.45 });
    g.add(cy(0.24, 0.26, 1.2, red, 0, 0.6, 0, 20));
    g.add(cy(0.29, 0.29, 0.1, red, 0, 1.25, 0, 20));
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), red);
    top.position.y = 1.3; top.scale.y = 0.5;
    g.add(top);
    g.add(bx(0.22, 0.03, 0.05, mat("#111", {}), 0, 1.05, 0.24));
    g.add(bx(0.16, 0.06, 0.02, mat("#d9b15a", { m: 0.8, r: 0.3 }), 0, 0.85, 0.255));
    return g;
  }

  function flowerBarrow() {
    const g = new THREE.Group();
    const w = mat("#6a4a2a", { r: 0.8 });
    g.add(bx(1.6, 0.4, 0.9, w, 0, 0.75, 0));
    [-0.55, 0.55].forEach((z) => {
      const wh = cy(0.4, 0.4, 0.05, mat("#3a2a1a", { r: 0.7 }), -0.4, 0.4, z, 16);
      wh.rotation.x = Math.PI / 2;
      g.add(wh);
    });
    g.add(bx(0.05, 0.05, 1.1, w, 1.1, 0.9, 0.3).rotateY(0));
    g.add(bx(0.7, 0.05, 0.05, w, 1.15, 0.85, 0.35));
    g.add(bx(0.7, 0.05, 0.05, w, 1.15, 0.85, -0.35));
    const cols = ["#c2185b", "#f4f0e6", "#e8b33a", "#8e2a4a", "#f2a7b8", "#6a3a8a"];
    for (let i = 0; i < 40; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(cols[i % cols.length], { r: 0.9 }));
      f.position.set(-0.7 + (i % 8) * 0.2, 1.0 + ((i * 7) % 5) * 0.03, -0.35 + Math.floor(i / 8) * 0.18);
      g.add(f);
    }
    for (let i = 0; i < 10; i++) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat("#3a5a2a", { r: 1 })).translateX(-0.7 + i * 0.16).translateY(0.97).translateZ(0.38));
    return g;
  }

  /* ---------- The street ---------- */
  RC.buildStreet = function (scene) {
    const Z0 = 7, Z1 = -27, LEN = Z0 - Z1, ZC = (Z0 + Z1) / 2;
    const out = { shops: [], lanterns: [], swings: [], clock: null };

    const road = pl(8, LEN, mat("#ffffff", { map: RC.tex.cobbles(8 / 1.4, LEN / 1.4), r: 0.85 }), 0, 0, ZC);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
    [-1, 1].forEach((s) => {
      scene.add(bx(3, 0.15, LEN, mat("#ffffff", { map: RC.tex.flags(3 / 1.6, LEN / 1.6), r: 0.9 }), s * 5.5, 0.075, ZC));
      scene.add(bx(0.22, 0.17, LEN, STONE(), s * 4.1, 0.085, ZC));
      scene.add(bx(0.4, 0.02, LEN, mat("#1c1a18", { r: 0.2, m: 0.3 }), s * 3.8, 0.005, ZC));
    });

    // Terraces down both sides
    const SHOP_W = 8;
    const heights = [11.5, 12.6, 11.0];
    [-1, 1].forEach((s) => {
      const sideName = s < 0 ? "left" : "right";
      const rot = s < 0 ? Math.PI / 2 : -Math.PI / 2;
      const place = (obj, zc) => {
        obj.position.set(s * 7, 0, zc);
        obj.rotation.y = rot;
        scene.add(obj);
      };
      place(buildPlain(4, 12, s < 0 ? "yellow" : "brick", 3 + s, {}), 5);
      for (let slot = 0; slot < 3; slot++) {
        const zc = -1 - slot * 9;
        const def = RC.SHOPS.find((d) => d.side === sideName && d.slot === slot);
        if (!def) { place(buildPlain(SHOP_W, heights[slot], "brick", slot), zc); continue; }
        const H = heights[(slot + (s > 0 ? 1 : 0)) % 3];
        const shop = buildShop(def, SHOP_W, H, slot * 3 + (s > 0 ? 1 : 0));
        place(shop.group, zc);
        if (shop.group.userData.swing) out.swings.push(shop.group.userData.swing);
        shop.group.updateMatrixWorld(true);
        const toWorld = (x, y, z) => shop.group.localToWorld(new THREE.Vector3(x, y, z));
        out.shops.push({
          def, door: shop.door, handle: shop.handle,
          front: toWorld(0, 0, 1.6), step: toWorld(0, 0, 0.55), inside: toWorld(0, 0, -1.4),
          group: shop.group,
        });
        if (slot < 2) place(buildPlain(1, H + 0.6, "brick", slot + 9, { noGroundWindows: true }), zc - 4.5);
      }
      place(buildPlain(4, 11.8, s < 0 ? "stucco" : "yellow", 5 - s, { head: "pediment" }), -25);
    });

    // Closing building at the far end, with a clock and the Rosecat name
    const end = buildPlain(14, 13.5, "stucco", 4, { head: "arched", noGroundWindows: true });
    end.position.set(0, 0, -27);
    scene.add(end);
    const arch = bx(3.2, 3.6, 0.2, mat("#ffcf8a", { e: "#ffb45c", ei: 0.6 }), 0, 1.8, -26.9);
    scene.add(arch);
    [-1.75, 1.75].forEach((x) => scene.add(bx(0.4, 4.2, 0.4, STONE(), x, 2.1, -26.7)));
    scene.add(bx(4.2, 0.5, 0.45, STONE(), 0, 4.2, -26.7));
    const endSign = new THREE.MeshStandardMaterial({ map: RC.tex.sign("ROSECAT VINTAGE", "Est. on " + RC.STREET_NAME + " · Purveyors of Fine Old Things", "#2a1a1e", "#d9b15a"), roughness: 0.5 });
    scene.add(pl(7, 1.1, endSign, 0, 5.2, -26.68));
    [-5, -3, 3, 5].forEach((x) => sashWindow(end, x, 1.1, 1.0, 1.9, "plain", Math.abs(x) === 3));
    // clock
    const clock = new THREE.Group();
    clock.position.set(0, 14.6, -27);
    clock.add(bx(2.6, 2.8, 0.6, STONE(), 0, 0, -0.1));
    const tri = new THREE.Shape();
    tri.moveTo(-1.5, 0); tri.lineTo(1.5, 0); tri.lineTo(0, 0.8); tri.closePath();
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.6, bevelEnabled: false }), STONE());
    ped.position.set(0, 1.4, -0.4);
    clock.add(ped);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.95, 40), new THREE.MeshStandardMaterial({ map: RC.tex.clockFace(), emissive: "#fff0c8", emissiveIntensity: 0.35, emissiveMap: RC.tex.clockFace() }));
    face.position.z = 0.21;
    clock.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.06, 8, 40), GOLD());
    rim.position.z = 0.22;
    clock.add(rim);
    const mkHand = (len, w) => {
      const h = new THREE.Group();
      h.add(bx(w, len, 0.02, mat("#111111", {}), 0, len / 2 - 0.08, 0));
      h.position.z = 0.24;
      clock.add(h);
      return h;
    };
    out.clock = { hour: mkHand(0.5, 0.07), minute: mkHand(0.78, 0.045) };
    scene.add(clock);

    // Start-of-lane building behind the player, with the street name plate
    const startB = buildPlain(14, 12, "yellow", 6, { head: "pediment" });
    startB.position.set(0, 0, 7);
    startB.rotation.y = Math.PI;
    scene.add(startB);
    const nameplate = new THREE.MeshStandardMaterial({ map: RC.tex.plate(RC.STREET_NAME.toUpperCase() + ", W.", "#f4efe4", "#1a1a1a", 512, 128), roughness: 0.6 });
    [-1, 1].forEach((s) => {
      const p = pl(1.6, 0.4, nameplate, s * 6.95, 3.2, 3.6);
      p.rotation.y = -s * Math.PI / 2;
      scene.add(p);
    });

    // Lamps along the kerb (every other one casts real light)
    [4.2, -5.5, -14.5, -23].forEach((z, i) => {
      [-1, 1].forEach((s) => {
        const lamp = gasLamp((i + (s > 0 ? 1 : 0)) % 2 === 0);
        lamp.position.set(s * 4.55, 0.15, z);
        scene.add(lamp);
        out.lanterns.push(lamp.userData.lantern);
      });
    });
    const pb = pillarBox();
    pb.position.set(4.7, 0.15, -4.4);
    scene.add(pb);
    const barrow = flowerBarrow();
    barrow.position.set(-2.6, 0, -22.5);
    barrow.rotation.y = 0.4;
    scene.add(barrow);

    // Obstacles the player can't walk through (x, z, radius)
    out.obstacles = [{ x: 4.7, z: -4.4, r: 0.45 }, { x: -2.6, z: -22.5, r: 1.1 }];
    [4.2, -5.5, -14.5, -23].forEach((z) => [-1, 1].forEach((s) => out.obstacles.push({ x: s * 4.55, z, r: 0.3 })));
    out.bounds = { minX: -6.45, maxX: 6.45, minZ: -26.2, maxZ: 6.3 };

    out.update = function (t) {
      out.lanterns.forEach((l, i) => { l.material.emissiveIntensity = 1.5 + Math.sin(t * 9 + i * 3.1) * 0.08 + Math.sin(t * 23 + i) * 0.05; });
      out.swings.forEach((b, i) => { b.rotation.x = Math.sin(t * 0.9 + i) * 0.05; });
      const d = new Date();
      const m = d.getMinutes() + d.getSeconds() / 60;
      const h = (d.getHours() % 12) + m / 60;
      out.clock.minute.rotation.z = -(m / 60) * Math.PI * 2;
      out.clock.hour.rotation.z = -(h / 12) * Math.PI * 2;
    };
    return out;
  };

  /* ---------- Shop interiors ---------- */
  RC.buildInterior = function (def) {
    if (def.interior && RC.interiors && RC.interiors[def.interior]) return RC.interiors[def.interior](def);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#120c08");
    scene.fog = new THREE.Fog("#1a120c", 10, 22);
    const X = 5, Z = 6, H = 4.2;
    const clickables = [];
    const obstacles = [];

    scene.add(new THREE.HemisphereLight("#ffe6c4", "#3a2a1c", 0.55));

    const floor = pl(X * 2, Z * 2, mat("#ffffff", { map: RC.tex.wood("#6a4428", X * 2 / 1.6, Z * 2 / 3.2), r: 0.6 }), 0, 0, 0);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const rugB = pl(4.4, 6.4, mat(RC.tex.shade(def.trim, -0.25), { r: 1 }), 0, 0.005, 0.6);
    rugB.rotation.x = -Math.PI / 2;
    scene.add(rugB);
    const rug = pl(4.2, 6.2, mat(RC.tex.shade(def.wallpaper, -0.05), { r: 1 }), 0, 0.008, 0.6);
    rug.rotation.x = -Math.PI / 2;
    scene.add(rug);
    const ceil = pl(X * 2, Z * 2, mat("#e8dcc4", { r: 0.9 }), 0, H, 0);
    ceil.rotation.x = Math.PI / 2;
    scene.add(ceil);

    const wp = (w) => mat("#ffffff", { map: RC.tex.wallpaper(def.wallpaper, w / 1.2, (H - 1) / 1.2), r: 0.9 });
    const wain = mat("#4a2e1c", { r: 0.55 });
    const walls = [
      { w: X * 2, x: 0, z: -Z, ry: 0 },
      { w: X * 2, x: 0, z: Z, ry: Math.PI },
      { w: Z * 2, x: -X, z: 0, ry: Math.PI / 2 },
      { w: Z * 2, x: X, z: 0, ry: -Math.PI / 2 },
    ];
    walls.forEach((w) => {
      const g = new THREE.Group();
      g.position.set(w.x, 0, w.z);
      g.rotation.y = w.ry;
      g.add(pl(w.w, H - 1, wp(w.w), 0, 1 + (H - 1) / 2, 0));
      g.add(bx(w.w, 1.0, 0.06, wain, 0, 0.5, 0.03));
      g.add(bx(w.w, 0.06, 0.1, mat(def.trim, { m: 0.6, r: 0.35 }), 0, 1.02, 0.05));
      g.add(bx(w.w, 0.18, 0.16, mat("#e8dcc4", { r: 0.9 }), 0, H - 0.09, 0.08));
      g.add(bx(w.w, 0.04, 0.06, wain, 0, H - 0.6, 0.03));
      scene.add(g);
    });

    // Front wall: door and windows looking out on the foggy street
    const fogGlass = mat("#8a9aac", { e: "#4a5a6c", ei: 0.9, r: 0.2 });
    const doorM = mat(RC.tex.shade(def.front, -0.04), { r: 0.45 });
    scene.add(bx(1.3, 2.75, 0.08, doorM, 0, 1.375, Z - 0.05));
    scene.add(pl(0.86, 1.0, fogGlass, 0, 1.85, Z - 0.1).rotateY(Math.PI));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), BRASS());
    knob.position.set(-0.45, 1.0, Z - 0.13);
    scene.add(knob);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), BRASS());
    bell.position.set(0, 2.95, Z - 0.25);
    bell.scale.y = 1.3;
    scene.add(bell);
    scene.add(bx(0.02, 0.2, 0.02, IRON(), 0, 3.12, Z - 0.25));
    [-3, 3].forEach((x) => {
      scene.add(pl(2.4, 2.2, fogGlass, x, 2.0, Z - 0.03).rotateY(Math.PI));
      scene.add(bx(2.6, 0.1, 0.3, wain, x, 0.85, Z - 0.15));
      scene.add(bx(0.06, 2.2, 0.08, doorM, x, 2.0, Z - 0.06));
      scene.add(bx(2.4, 0.06, 0.08, doorM, x, 2.5, Z - 0.06));
    });

    // Gas pendants
    [[0, -0.8], [0, 3.0]].forEach(([x, z]) => {
      scene.add(cy(0.008, 0.008, 0.7, BRASS(), x, H - 0.35, z, 4));
      scene.add(cy(0.12, 0.05, 0.08, BRASS(), x, H - 0.72, z, 12));
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat("#fff0d0", { e: "#ffc070", ei: 1.6, o: 0.95 })).translateX(x).translateY(H - 0.9).translateZ(z));
      const l = new THREE.PointLight("#ffd29a", 1.15, 13, 1.6);
      l.position.set(x, H - 1.0, z);
      scene.add(l);
    });
    [-X + 0.12, X - 0.12].forEach((x) => [-3, 1].forEach((z) => {
      const sc = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mat("#fff0d0", { e: "#ffc070", ei: 1.3 }));
      sc.position.set(x, 2.4, z);
      scene.add(sc);
      scene.add(bx(0.05, 0.25, 0.05, BRASS(), x, 2.22, z));
    }));

    // Sort the shop's items into small (shelves/counter) and tall (floor-standing)
    const kinds = def.items.map((it) => {
      const probe = RC.makeItem(it.kind);
      const size = new THREE.Box3().setFromObject(probe).getSize(new THREE.Vector3());
      return { ...it, tall: size.y > 0.8, size };
    });
    const small = kinds.filter((k) => !k.tall);
    const tall = kinds.filter((k) => k.tall);

    function placeItem(info, x, y, z, ry, maxH) {
      const it = RC.makeItem(info.kind);
      const s = info.size;
      const sc = info.tall ? 1 : Math.min(2.4, Math.max(1, (maxH || 0.35) / Math.max(s.y, s.x * 0.8, 0.04)));
      it.scale.setScalar(sc);
      it.position.set(x, y, z);
      it.rotation.y = ry || 0;
      it.userData.info = { name: info.name, note: info.note };
      scene.add(it);
      clickables.push(it);
      return it;
    }

    // Counter with the shopkeeper behind it
    const cz = -2.6;
    scene.add(bx(6, 0.9, 0.7, wain, 0, 0.45, cz));
    scene.add(bx(6.15, 0.06, 0.82, mat("#2e1a10", { r: 0.35 }), 0, 0.93, cz));
    for (let i = 0; i < 6; i++) scene.add(bx(0.8, 0.55, 0.02, mat("#5a3a24", { r: 0.5 }), -2.5 + i, 0.47, cz + 0.36));
    scene.add(bx(1.5, 0.28, 0.55, mat("#cfe6ee", { o: 0.2, r: 0.05 }), 1.8, 1.1, cz));
    const ledger = bx(0.4, 0.04, 0.3, mat("#5a1f1f", { r: 0.8 }), -1.9, 0.98, cz);
    ledger.rotation.y = 0.2;
    scene.add(ledger);
    const bellDesk = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), BRASS());
    bellDesk.position.set(-1.2, 0.96, cz + 0.2);
    scene.add(bellDesk);
    const counterPicks = small.length ? small : kinds;
    [-0.6, 0.6, 1.8].forEach((x, i) => {
      const info = counterPicks[i % counterPicks.length];
      placeItem(info, x, 0.96, cz + 0.05, -0.2 + i * 0.2, 0.3);
    });
    obstacles.push({ box: { minX: -3.2, maxX: 3.2, minZ: cz - 0.5, maxZ: cz + 0.6 } });

    const keeper = RC.makeKeeper(def.keeper);
    keeper.group.position.set(0.1, 0, cz - 0.75);
    scene.add(keeper.group);

    // Back-wall shelving
    const sh = mat("#3a2414", { r: 0.55 });
    scene.add(bx(8.4, 3.1, 0.06, sh, 0, 1.55, -Z + 0.05));
    [-4.15, 4.15, -1.4, 1.4].forEach((x) => scene.add(bx(0.1, 3.1, 0.5, sh, x, 1.55, -Z + 0.27)));
    [1.05, 1.75, 2.45, 3.1].forEach((y) => scene.add(bx(8.4, 0.05, 0.5, sh, 0, y, -Z + 0.27)));
    scene.add(bx(8.6, 0.2, 0.6, sh, 0, 3.2, -Z + 0.3));
    const shelfPool = small.length ? small : kinds;
    let n = 0;
    [1.08, 1.78, 2.48].forEach((y) => {
      [-3.3, -2.3, -0.7, 0.7, 2.3, 3.3].forEach((x) => {
        placeItem(shelfPool[n++ % shelfPool.length], x, y, -Z + 0.3, 0, 0.42);
      });
    });

    // Side display cabinets
    [-1, 1].forEach((s) => {
      const x = s * (X - 0.35);
      scene.add(bx(0.6, 0.85, 4.6, sh, x, 0.425, -0.2));
      scene.add(bx(0.62, 0.04, 4.6, mat("#2e1a10", { r: 0.35 }), x, 0.87, -0.2));
      scene.add(bx(0.06, 1.6, 4.6, sh, x + s * 0.27, 1.65, -0.2));
      scene.add(bx(0.55, 0.04, 4.6, sh, x, 1.6, -0.2));
      scene.add(bx(0.55, 0.04, 4.6, sh, x, 2.4, -0.2));
      [-1.9, -0.6, 0.7, 2.0].forEach((z, i) => {
        placeItem(shelfPool[(n++) % shelfPool.length], x, 0.89, z, -s * Math.PI / 2, 0.38);
        if (i % 2 === 0) placeItem(shelfPool[(n++) % shelfPool.length], x, 1.62, z + 0.3, -s * Math.PI / 2, 0.36);
      });
      obstacles.push({ box: { minX: s < 0 ? -X : x - 0.4, maxX: s < 0 ? x + 0.4 : X, minZ: -2.6, maxZ: 2.2 } });
    });

    // Centre display table, and tall items standing on the floor
    const table = new THREE.Group();
    table.position.set(0, 0, 1.0);
    table.add(cy(0.75, 0.75, 0.05, mat("#3a2414", { r: 0.4 }), 0, 0.8, 0, 32));
    table.add(cy(0.08, 0.12, 0.78, mat("#3a2414", { r: 0.5 }), 0, 0.39, 0, 12));
    table.add(cy(0.4, 0.45, 0.05, mat("#3a2414", { r: 0.5 }), 0, 0.03, 0, 20));
    table.add(cy(0.78, 0.82, 0.3, mat(RC.tex.shade(def.wallpaper, -0.1), { r: 1, side: THREE.DoubleSide }), 0, 0.69, 0, 32).translateY(0));
    scene.add(table);
    const tablePicks = small.length ? small : kinds;
    [[-0.35, 0.2], [0.35, 0.15], [0, -0.35]].forEach(([dx, dz], i) => {
      placeItem(tablePicks[(i + 1) % tablePicks.length], dx, 0.845, 1.0 + dz, i - 1, 0.32);
    });
    obstacles.push({ x: 0, z: 1.0, r: 1.05 });

    const floorSpots = [[-2.9, 3.4], [2.9, 3.4], [-2.6, -1.2], [2.6, -1.2]];
    tall.forEach((info, i) => {
      const [x, z] = floorSpots[i % floorSpots.length];
      placeItem(info, x, 0, z, x < 0 ? 0.6 : -0.6);
      obstacles.push({ x, z, r: 0.55 });
    });
    if (!tall.length) {
      // a pot plant in each front corner keeps the room from feeling empty
      [[-3.6, 4.6], [3.6, 4.6]].forEach(([x, z]) => {
        scene.add(cy(0.25, 0.2, 0.5, mat("#8a4a2a", { r: 0.8 }), x, 0.25, z));
        for (let i = 0; i < 9; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), mat("#2f5a2a", { r: 0.9 }));
          leaf.position.set(x + Math.cos(i * 2.1) * 0.18, 0.75 + (i % 3) * 0.15, z + Math.sin(i * 2.1) * 0.18);
          leaf.scale.set(0.8, 1.4, 0.8);
          scene.add(leaf);
        }
        obstacles.push({ x, z, r: 0.45 });
      });
    }

    return {
      scene, keeper, clickables, obstacles, knob,
      spawn: { x: 0, z: 4.3, yaw: 0 },
      exitZ: 5.0,
      bounds: { minX: -X + 0.4, maxX: X - 0.4, minZ: -Z + 0.6, maxZ: 5.45 },
      update(t, speaking, camPos) {
        // shopkeeper turns to look at the visitor and "talks" while subtitles play
        const kg = keeper.group;
        const dx = camPos.x - kg.position.x, dz = camPos.z - kg.position.z;
        const target = Math.atan2(dx, dz);
        keeper.head.rotation.y += (Math.max(-0.9, Math.min(0.9, target)) - keeper.head.rotation.y) * 0.08;
        keeper.head.rotation.x = -0.12 + Math.sin(t * 0.7) * 0.02;
        kg.position.y = Math.sin(t * 1.6) * 0.004;
        keeper.mouth.scale.y = speaking ? 1 + Math.abs(Math.sin(t * 14)) * 2.5 : 1;
      },
    };
  };
})();
