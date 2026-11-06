/* Procedural "PBR" surfaces: colour, roughness and bump (normal) maps painted on canvases,
   so marble, parquet, velvet, silk and gilt catch the light like the real thing, with no image files.
   Each material carries userData.uvScale = metres per texture tile; RC.kit.worldUV() projects
   UVs in metres, so nothing looks stretched whatever the size of the object. */

(function () {
  const setCache = {};
  const matCache = {};

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const hash = (n) => { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff; };

  // Tileable value noise: the lattice wraps every `p` cells (p must be a whole number ≤ 512)
  function noiseFn(seed) {
    const r = rng(seed), N = 512, v = new Float32Array(N * N);
    for (let i = 0; i < v.length; i++) v[i] = r();
    return (x, y, p) => {
      x *= p; y *= p;
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
      const x0 = ((xi % p) + p) % p, x1 = (x0 + 1) % p, y0 = ((yi % p) + p) % p, y1 = (y0 + 1) % p;
      const a = v[y0 * N + x0], b = v[y0 * N + x1], c = v[y1 * N + x0], d = v[y1 * N + x1];
      return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    };
  }
  function fbm(n, x, y, p, oct) {
    let s = 0, a = 0.5, t = 0;
    for (let o = 0; o < oct; o++) { s += a * n(x, y, p); t += a; a *= 0.5; p *= 2; }
    return s / t;
  }
  const N1 = noiseFn(1), N2 = noiseFn(2), N3 = noiseFn(3);

  // Colours as sRGB triples 0..1 (parsed by hand so colour management can't convert them)
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function put(px, c, k) { k = k === undefined ? 1 : k; px.r = c[0] * k; px.g = c[1] * k; px.b = c[2] * k; }

  function canvasTex(data, w, h, srgb) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").putImageData(new ImageData(data, w, h), 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // paint(w, h, fn, bump): fn(u, v, px) sets px.r/g/b (sRGB 0..1), px.rough (0..1) and px.h (height 0..1)
  function paint(w, h, fn, bump) {
    const n = w * h;
    const col = new Uint8ClampedArray(n * 4), rough = new Uint8ClampedArray(n * 4), H = new Float32Array(n);
    const px = {};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        px.r = px.g = px.b = 0.5; px.rough = 0.5; px.h = 0.5;
        fn(x / w, y / h, px);
        const i = y * w + x, j = i * 4;
        col[j] = px.r * 255; col[j + 1] = px.g * 255; col[j + 2] = px.b * 255; col[j + 3] = 255;
        rough[j] = rough[j + 1] = rough[j + 2] = px.rough * 255; rough[j + 3] = 255;
        H[i] = px.h;
      }
    }
    const nor = new Uint8ClampedArray(n * 4);
    const b = bump === undefined ? 2 : bump;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const l = H[y * w + (x - 1 + w) % w], r = H[y * w + (x + 1) % w];
        const up = H[((y - 1 + h) % h) * w + x], dn = H[((y + 1) % h) * w + x];
        let nx = (l - r) * b * w / 256, ny = (dn - up) * b * h / 256, nz = 1;
        const len = Math.hypot(nx, ny, nz);
        const j = (y * w + x) * 4;
        nor[j] = (nx / len * 0.5 + 0.5) * 255; nor[j + 1] = (ny / len * 0.5 + 0.5) * 255; nor[j + 2] = (nz / len * 0.5 + 0.5) * 255; nor[j + 3] = 255;
      }
    }
    return { map: canvasTex(col, w, h, true), roughnessMap: canvasTex(rough, w, h), normalMap: canvasTex(nor, w, h) };
  }

  // Draw something with the 2D canvas API and read it back as a 0..1 mask (alpha channel)
  function mask(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    draw(g, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const m = new Float32Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] / 255;
    return (u, v) => m[Math.min(h - 1, (v * h) | 0) * w + Math.min(w - 1, (u * w) | 0)];
  }

  /* ---------------- Recipes ---------------- */

  // Veined marble value at u,v (0 = ground, 1 = vein)
  function veins(u, v, o) {
    const t = fbm(N1, u + o.seed * 0.137, v, 4, 6);
    const w = Math.sin((u * o.fx + v * o.fy + t * o.turb) * Math.PI * 2);
    const main = Math.pow(1 - Math.abs(w), o.sharp);
    const t2 = fbm(N2, u, v + o.seed * 0.29, 8, 5);
    const fine = Math.pow(1 - Math.abs(Math.sin((u * 3 - v * 2 + t2 * 3) * Math.PI * 2)), o.sharp * 3);
    return Math.min(1, main + fine * 0.5);
  }
  function marbleColour(u, v, o) {
    const cloud = fbm(N3, u + o.seed * 0.31, v, 4, 5);
    const ground = mix(rgb(o.base), rgb(o.base2 || o.base), smooth(0.35, 0.7, cloud));
    return mix(ground, rgb(o.vein), veins(u, v, o) * o.amt);
  }

  const recipes = {
    // Polished marble slab, no joints (counter tops, fireplaces, table tops). ~0.8 m per tile
    marble(o) {
      o = Object.assign({ base: "#ece8e1", base2: "#dcd8d0", vein: "#7c7f86", amt: 0.75, fx: 2, fy: 1, turb: 4, sharp: 9, seed: 1 }, o);
      return paint(512, 512, (u, v, px) => {
        put(px, marbleColour(u, v, o));
        px.rough = 0.07 + N2(u, v, 32) * 0.06;
        px.h = 0.5;
      }, 0.5);
    },

    // Paris salon floor: white Carrara squares with black cabochons at the corners (1.2 m tile)
    marbleFloor() {
      const white = { base: "#ebe7df", base2: "#ddd8cf", vein: "#8c8e94", amt: 0.6, fx: 2, fy: 1, turb: 4, sharp: 10 };
      const black = { base: "#121213", base2: "#1c1b1c", vein: "#9a968f", amt: 0.8, fx: 1, fy: 2, turb: 5, sharp: 26 };
      return paint(1024, 1024, (u, v, px) => {
        const qx = Math.floor(u * 2), qy = Math.floor(v * 2);
        const lu = u * 2 - qx, lv = v * 2 - qy;
        const du = Math.min(lu, 1 - lu), dv = Math.min(lv, 1 - lv);
        const cab = du + dv;
        if (cab < 0.15) {
          put(px, marbleColour(u, v, Object.assign({ seed: 9 }, black)));
          px.rough = 0.06; px.h = 0.5;
        } else {
          put(px, marbleColour(lu * 0.5 + qx * 0.5, lv * 0.5, Object.assign({ seed: qx * 3 + qy * 5 + 1 }, white)));
          px.rough = 0.08 + N2(u, v, 64) * 0.05; px.h = 0.5;
        }
        if (Math.abs(cab - 0.15) < 0.004 || (cab >= 0.15 && Math.min(du, dv) < 0.0025)) {
          put(px, [0.55, 0.53, 0.5]); px.rough = 0.8; px.h = 0.3;
        }
      }, 1.2);
    },

    // Black & white marble laid on the diagonal (0.9 m tile = 2 x 2 squares)
    checkerMarble() {
      const white = { base: "#efece6", base2: "#e2ddd4", vein: "#a0a0a4", amt: 0.5, fx: 2, fy: 1, turb: 4, sharp: 12 };
      const black = { base: "#131313", base2: "#1e1d1c", vein: "#8c877e", amt: 0.6, fx: 1, fy: 2, turb: 5, sharp: 28 };
      return paint(512, 512, (u, v, px) => {
        const a = (u + v) * 2, b = (u - v + 1) * 2;
        const ia = Math.floor(a), ib = Math.floor(b);
        const fa = a - ia, fb = b - ib;
        const isW = (ia + ib) % 2 === 0;
        put(px, marbleColour(u, v, Object.assign({ seed: isW ? 3 : 8 }, isW ? white : black)));
        px.rough = 0.07 + N2(u, v, 32) * 0.05; px.h = 0.5;
        if (Math.min(fa, 1 - fa, fb, 1 - fb) < 0.008) { put(px, [0.5, 0.48, 0.45]); px.rough = 0.8; px.h = 0.3; }
      }, 1.2);
    },

    // Point de Hongrie (chevron) oak parquet, waxed (1 m tile)
    chevron(o) {
      o = Object.assign({ base: "#a87745", dark: "#6e4524" }, o);
      return paint(1024, 1024, (u, v, px) => {
        const c = Math.floor(u * 4), lx = u * 4 - c, s = c % 2 ? -1 : 1;
        const t = v * 8 + s * (s > 0 ? lx : 1 - lx) * 2;
        const k = Math.floor(t), ft = t - k;
        const id = c * 37 + (((k % 16) + 16) % 16) * 11;
        const tone = hash(id) * 0.5 + hash(id + 7) * 0.3;
        const grainCoord = ft + fbm(N1, u, v, 16, 3) * 0.6;
        const grain = 0.5 + 0.5 * Math.sin(grainCoord * Math.PI * 2 * (5 + hash(id + 3) * 4) + hash(id) * 6);
        const fleck = Math.pow(N3(u, v, 256), 6);
        let col = mix(rgb(o.base), rgb(o.dark), tone * 0.55 + grain * 0.18 + fleck * 0.4);
        put(px, col);
        px.rough = 0.32 + grain * 0.12 + N2(u, v, 64) * 0.08;
        px.h = 0.5 + grain * 0.03;
        if (ft < 0.025 || lx < 0.01 || lx > 0.99) { put(px, mix(col, [0.12, 0.08, 0.05], 0.7)); px.rough = 0.8; px.h = 0.2; }
      }, 1.5);
    },

    // Straight-grained timber for furniture and panelling (1 m tile)
    wood(o) {
      o = Object.assign({ base: "#5a2a18", dark: "#2e130a", figure: 1 }, o);
      return paint(512, 512, (u, v, px) => {
        const w = fbm(N1, u, v, 4, 5);
        const ring = 0.5 + 0.5 * Math.sin((u * 24 + w * 5 * o.figure) * Math.PI * 2);
        const pore = Math.pow(N3(u, v * 0.25, 256), 4);
        const flame = fbm(N2, u, v, 8, 4);
        put(px, mix(rgb(o.base), rgb(o.dark), ring * 0.45 + pore * 0.3 + (flame - 0.5) * 0.5 * o.figure));
        px.rough = 0.22 + ring * 0.1 + pore * 0.2;
        px.h = 0.5 + ring * 0.05 - pore * 0.1;
      }, 1);
    },

    // Painted plaster / boiserie paint (2 m tile)
    paint(o) {
      o = Object.assign({ base: "#d8d3c6", var: 0.04, rough: 0.7 }, o);
      return paint(256, 256, (u, v, px) => {
        const n = fbm(N1, u, v, 4, 5);
        put(px, rgb(o.base), 1 + (n - 0.5) * o.var * 2);
        px.rough = o.rough + (N2(u, v, 64) - 0.5) * 0.1;
        px.h = 0.5 + N3(u, v, 128) * 0.15;
      }, 0.6);
    },

    // Crushed velvet (0.5 m tile) — paired with a sheen material
    velvet(o) {
      o = Object.assign({ base: "#6a1f2e" }, o);
      return paint(256, 256, (u, v, px) => {
        const n = fbm(N1, u, v, 8, 4);
        put(px, rgb(o.base), 0.85 + n * 0.3);
        px.rough = 0.85 + n * 0.1;
        px.h = 0.5 + N3(u, v, 128) * 0.3;
      }, 0.8);
    },

    // Silk damask wall covering: satin motif on a matt ground (0.6 m tile)
    damask(o) {
      o = Object.assign({ base: "#b76e79", motif: "#c98a93" }, o);
      const m = mask(256, 256, (g, w, h) => {
        g.fillStyle = "#000";
        const medallion = (cx, cy, s) => {
          g.save(); g.translate(cx, cy); g.scale(s, s);
          for (const side of [-1, 1]) {
            g.save(); g.scale(side, 1);
            g.beginPath();
            g.moveTo(0, -60);
            g.bezierCurveTo(20, -50, 34, -30, 22, -10);
            g.bezierCurveTo(40, -6, 46, 14, 30, 22);
            g.bezierCurveTo(26, 40, 10, 50, 0, 62);
            g.lineTo(0, -60);
            g.fill();
            g.beginPath(); g.ellipse(36, -36, 6, 12, 0.6, 0, Math.PI * 2); g.fill();
            g.beginPath(); g.ellipse(40, 40, 5, 10, -0.6, 0, Math.PI * 2); g.fill();
            g.restore();
          }
          g.globalCompositeOperation = "destination-out";
          g.beginPath(); g.ellipse(0, 4, 9, 18, 0, 0, Math.PI * 2); g.fill();
          g.globalCompositeOperation = "source-over";
          g.restore();
        };
        medallion(64, 64, 0.85); medallion(192, 192, 0.85);
        medallion(192, 64 - 128, 0.85); medallion(64, 192 + 128, 0.85);
        medallion(192, 64 + 128, 0.85); medallion(64, 192 - 128, 0.85);
        medallion(-64, 192, 0.85); medallion(320, 64, 0.85);
      });
      return paint(512, 512, (u, v, px) => {
        const k = m(u, v);
        const weave = (Math.sin(u * 512 * Math.PI) * Math.sin(v * 512 * Math.PI)) * 0.5 + 0.5;
        put(px, mix(rgb(o.base), rgb(o.motif), k), 0.95 + weave * 0.05);
        px.rough = 0.75 - k * 0.42;
        px.h = 0.5 + k * 0.1 + weave * 0.05;
      }, 0.8);
    },

    // Striped Louis XVI upholstery silk (0.25 m tile)
    stripeSilk(o) {
      o = Object.assign({ a: "#d9c9a3", b: "#b8a27a" }, o);
      return paint(256, 256, (u, v, px) => {
        const band = Math.floor(u * 8) % 2;
        const pin = Math.abs(((u * 8) % 1) - 0.5) > 0.45;
        put(px, pin ? mix(rgb(o.a), rgb(o.b), 0.5) : band ? rgb(o.b) : rgb(o.a));
        px.rough = band ? 0.35 : 0.6;
        px.h = 0.5 + (pin ? -0.1 : 0) + Math.sin(v * 256 * Math.PI) * 0.03;
      }, 0.5);
    },

    // Cement / encaustic floor tiles for the winter garden (0.4 m tile = 2 x 2 tiles)
    encaustic() {
      const cream = rgb("#e6dcc4"), terra = rgb("#a4553a"), sage = rgb("#7d8c6a"), ink = rgb("#2b2a26");
      return paint(512, 512, (u, v, px) => {
        const lu = (u * 2) % 1, lv = (v * 2) % 1;
        const x = lu - 0.5, y = lv - 0.5;
        const r = Math.hypot(x, y), a = Math.atan2(y, x);
        let col = cream;
        const petal = 0.32 + 0.1 * Math.cos(a * 4);
        if (r < petal) col = terra;
        if (r < 0.12) col = cream;
        if (r < 0.06) col = ink;
        const corner = Math.min(Math.hypot(lu, lv), Math.hypot(1 - lu, lv), Math.hypot(lu, 1 - lv), Math.hypot(1 - lu, 1 - lv));
        if (corner < 0.2) col = sage;
        if (Math.abs(r - 0.42) < 0.012) col = ink;
        const wear = fbm(N1, u, v, 8, 4);
        put(px, mix(col, [0.8, 0.77, 0.7], (wear - 0.5) * 0.25));
        px.rough = 0.55 + wear * 0.2;
        px.h = 0.5;
        if (Math.min(lu, 1 - lu, lv, 1 - lv) < 0.006) { put(px, [0.6, 0.57, 0.5]); px.rough = 0.9; px.h = 0.3; }
      }, 1);
    },

    // Dressed limestone (Paris "pierre de taille"): 3 courses per 1.2 m tile
    limestone() {
      return paint(512, 512, (u, v, px) => {
        const row = Math.floor(v * 3), lv = v * 3 - row;
        const off = row % 2 ? 0.5 : 0;
        const bu = (u * 2 + off) % 1;
        const id = row * 7 + Math.floor(u * 2 + off);
        const n = fbm(N1, u, v, 8, 5), sp = Math.pow(N3(u, v, 256), 8);
        put(px, mix(rgb("#ddd3bd"), rgb("#c4b79c"), hash(id) * 0.4 + n * 0.4 + sp));
        px.rough = 0.88; px.h = 0.5 + n * 0.1 - sp * 0.3;
        if (lv < 0.012 || bu < 0.006) { put(px, rgb("#b3a68c")); px.h = 0.25; }
      }, 2);
    },

    // Fish-scale slate for the mansard roof (0.6 m tile)
    slate() {
      return paint(256, 256, (u, v, px) => {
        const row = Math.floor(v * 6), lv = v * 6 - row, off = row % 2 ? 0.5 : 0;
        const lu = (u * 4 + off) % 1;
        const edge = Math.hypot((lu - 0.5) * 1.1, lv - 0.15) > 0.62;
        const id = row * 13 + Math.floor(u * 4 + off);
        put(px, mix(rgb("#3c4248"), rgb("#2a2e33"), hash(id) * 0.6 + fbm(N2, u, v, 8, 3) * 0.3));
        px.rough = 0.6; px.h = edge ? 0.3 : 0.5 + lv * 0.2;
      }, 1.5);
    },

    // Woollen stair runner: deep red with a gold key border (u across 0..1, v along; 1.2 m tile)
    runner() {
      return paint(256, 256, (u, v, px) => {
        const d = Math.min(u, 1 - u);
        let col = rgb("#6e1420");
        if (d < 0.1) col = rgb("#3a0c12");
        if (d > 0.03 && d < 0.06) col = rgb("#c49a4a");
        if (d > 0.1 && d < 0.4 && Math.abs(((v * 12 + d * 3) % 1) - 0.5) < 0.04) col = rgb("#7e1c28");
        const n = N1(u, v, 128);
        put(px, col, 0.9 + n * 0.2);
        px.rough = 0.95; px.h = 0.5 + n * 0.3;
      }, 1);
    },

    // Roughness-only smudges for polished metal and glass (white colour map)
    smudge(o) {
      o = Object.assign({ lo: 0.12, hi: 0.4 }, o);
      return paint(256, 256, (u, v, px) => {
        const n = fbm(N1, u, v, 4, 5), f = Math.pow(N2(u, v, 32), 3);
        put(px, [1, 1, 1], 0.92 + n * 0.08);
        px.rough = o.lo + (o.hi - o.lo) * (n * 0.6 + f * 0.6);
        px.h = 0.5 + N3(u, v, 64) * 0.05;
      }, 0.3);
    },

    // Woven rattan / wicker (0.15 m tile)
    wicker(o) {
      o = Object.assign({ base: "#b8925a" }, o);
      return paint(256, 256, (u, v, px) => {
        const a = Math.sin((u + v) * 16 * Math.PI * 2), b = Math.sin((u - v) * 16 * Math.PI * 2);
        const over = ((Math.floor((u + v) * 16) + Math.floor((u - v + 1) * 16)) % 2) ? a : b;
        const strand = Math.abs(over);
        const gap = strand < 0.15;
        put(px, rgb(o.base), gap ? 0.35 : 0.8 + strand * 0.3 + (N1(u, v, 64) - 0.5) * 0.15);
        px.rough = gap ? 0.95 : 0.55;
        px.h = gap ? 0.1 : 0.4 + strand * 0.5;
      }, 2);
    },

    // Woven linen (table cloths, aprons, shirts) (0.2 m tile)
    linen(o) {
      o = Object.assign({ base: "#f2eee6" }, o);
      return paint(256, 256, (u, v, px) => {
        const w = Math.sin(u * 128 * Math.PI * 2) * Math.sin(v * 128 * Math.PI * 2);
        const n = N1(u, v, 64);
        put(px, rgb(o.base), 0.93 + n * 0.07 + w * 0.02);
        px.rough = 0.85; px.h = 0.5 + w * 0.25;
      }, 1);
    },

    // Fine wool suiting (coats, trousers) (0.2 m tile)
    wool(o) {
      o = Object.assign({ base: "#26262c" }, o);
      return paint(256, 256, (u, v, px) => {
        const tw = Math.sin((u + v) * 96 * Math.PI * 2) * 0.5 + 0.5;
        const n = N1(u, v, 128);
        put(px, rgb(o.base), 0.9 + tw * 0.12 + (n - 0.5) * 0.1);
        px.rough = 0.88; px.h = 0.5 + tw * 0.2;
      }, 1);
    },
  };

  function texSet(name, opts) {
    const key = name + JSON.stringify(opts || {});
    if (!setCache[key]) setCache[key] = recipes[name](opts);
    return setCache[key];
  }

  /*
    RC.pbr.mat(name, opts)
      name: a recipe above
      opts: recipe options + { scale (metres per tile), color, rough, metal, clearcoat, sheen, sheenColor,
             physical, envI (env map intensity), normal (strength), transparent... }
  */
  function pmat(name, o) {
    o = o || {};
    const key = name + JSON.stringify(o);
    if (matCache[key]) return matCache[key];
    const recipeOpts = {};
    ["base", "base2", "dark", "vein", "amt", "fx", "fy", "turb", "sharp", "seed", "figure", "var", "motif", "a", "b", "lo", "hi"].forEach((k) => { if (o[k] !== undefined) recipeOpts[k] = o[k]; });
    if (name === "paint" && o.rough !== undefined) recipeOpts.rough = o.rough;
    const set = texSet(name, recipeOpts);
    const physical = o.physical || o.clearcoat || o.sheen;
    const M = physical ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const m = new M({
      color: o.color || "#ffffff",
      map: o.noMap ? null : set.map,
      roughnessMap: set.roughnessMap,
      roughness: o.roughMul !== undefined ? o.roughMul : 1,
      normalMap: set.normalMap,
      normalScale: new THREE.Vector2(o.normal !== undefined ? o.normal : 1, o.normal !== undefined ? o.normal : 1),
      metalness: o.metal || 0,
      envMapIntensity: o.envI !== undefined ? o.envI : 1,
      side: o.side || THREE.FrontSide,
    });
    if (o.clearcoat) { m.clearcoat = o.clearcoat; m.clearcoatRoughness = o.ccRough !== undefined ? o.ccRough : 0.08; }
    if (o.sheen) { m.sheen = o.sheen; m.sheenColor = new THREE.Color(o.sheenColor || "#ffffff"); m.sheenRoughness = o.sheenRough || 0.45; }
    m.userData.uvScale = o.scale || 1;
    matCache[key] = m;
    return m;
  }

  // Ready-made materials used across the shops
  const lib = {
    gold: () => pmat("smudge", { color: "#e3b86a", metal: 1, lo: 0.14, hi: 0.32, scale: 0.4 }),
    gilt: () => pmat("smudge", { color: "#d9ad5c", metal: 1, lo: 0.25, hi: 0.5, scale: 0.6 }),
    brass: () => pmat("smudge", { color: "#c9a25a", metal: 1, lo: 0.2, hi: 0.45, scale: 0.5 }),
    silver: () => pmat("smudge", { color: "#e4e4e8", metal: 1, lo: 0.08, hi: 0.25, scale: 0.4 }),
    iron: () => pmat("smudge", { color: "#26282a", metal: 0.6, lo: 0.4, hi: 0.7, scale: 0.6 }),
    whiteIron: () => pmat("paint", { base: "#e9e6dd", rough: 0.45, scale: 1 }),
    mirror: () => pmat("smudge", { color: "#b4b2aa", metal: 1, lo: 0.0, hi: 0.05, scale: 1.5, envI: 1.0, normal: 0.001 }),
    mahogany: () => pmat("wood", { base: "#5c2414", dark: "#2c0e06", clearcoat: 0.6, ccRough: 0.15, scale: 1.2 }),
    walnut: () => pmat("wood", { base: "#6a4a30", dark: "#3a2414", clearcoat: 0.5, ccRough: 0.18, scale: 1.2 }),
    ebony: () => pmat("wood", { base: "#1c1612", dark: "#0a0806", figure: 0.4, clearcoat: 1, ccRough: 0.05, scale: 1.2 }),
    oak: () => pmat("wood", { base: "#9a6c3c", dark: "#5e3e1e", scale: 1.2 }),
    giltwood: () => pmat("smudge", { color: "#c99f52", metal: 0.85, lo: 0.3, hi: 0.55, scale: 0.6 }),
    whiteMarble: () => pmat("marble", { scale: 0.9 }),
    blackMarble: () => pmat("marble", { base: "#141414", base2: "#1f1e1d", vein: "#a19c94", amt: 0.8, sharp: 24, seed: 4, scale: 0.9 }),
    greenMarble: () => pmat("marble", { base: "#1f3a2e", base2: "#2c4d3c", vein: "#c9d6c8", amt: 0.6, sharp: 18, seed: 6, scale: 0.9 }),
    rougeMarble: () => pmat("marble", { base: "#7a2a24", base2: "#8e3a30", vein: "#e6d6c6", amt: 0.55, sharp: 14, seed: 7, scale: 0.9 }),
    linen: () => pmat("linen", { scale: 0.25 }),
    runner: () => pmat("runner", { scale: 1.2 }),
  };

  RC.pbr = { mat: pmat, lib, rgb, hash, noise: N1, fbm };
})();
