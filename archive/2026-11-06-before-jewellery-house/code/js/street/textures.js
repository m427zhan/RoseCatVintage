/* Procedural canvas textures: cobbles, flagstones, brick, wood, wallpaper, signs */

(function () {
  const cache = {};

  // Older browsers lack roundRect; a plain rectangle is fine there
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  }

  // Small seeded random so textures look the same on every visit
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return [c, c.getContext("2d")];
  }

  function toTexture(c, repeatX, repeatY) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.anisotropy = 4;
    return t;
  }

  function shade(hex, amt) {
    const c = new THREE.Color(hex);
    c.offsetHSL(0, 0, amt);
    return "#" + c.getHexString();
  }

  function cobbles() {
    const [c, g] = canvas(512, 512);
    const r = rng(7);
    g.fillStyle = "#26231f"; g.fillRect(0, 0, 512, 512);
    const rows = 12, rh = 512 / rows;
    for (let y = 0; y < rows; y++) {
      let x = (y % 2) * -20;
      while (x < 512) {
        const w = 34 + r() * 22;
        const v = 70 + r() * 40;
        g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
        g.beginPath();
        g.roundRect(x + 2, y * rh + 2, w - 4, rh - 4, 9);
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.07)";
        g.beginPath();
        g.roundRect(x + 6, y * rh + 4, w - 14, rh / 3, 6);
        g.fill();
        x += w;
      }
    }
    return c;
  }

  function flags() {
    const [c, g] = canvas(512, 512);
    const r = rng(11);
    g.fillStyle = "#3f3d39"; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        const v = 105 + r() * 30;
        g.fillStyle = `rgb(${v},${v - 2},${v - 8})`;
        g.fillRect(x * 171 + (y % 2) * 40 + 3, y * 128 + 3, 165, 122);
      }
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.12})`;
      g.fillRect(r() * 512, r() * 512, 3, 3);
    }
    return c;
  }

  function brick(base, mortar) {
    const [c, g] = canvas(256, 256);
    const r = rng(base.length * 31);
    g.fillStyle = mortar; g.fillRect(0, 0, 256, 256);
    const bh = 16, bw = 48;
    for (let y = 0; y < 256 / bh; y++) {
      for (let x = -1; x < 256 / bw + 1; x++) {
        const off = (y % 2) * (bw / 2);
        g.fillStyle = shade(base, (r() - 0.5) * 0.12);
        g.fillRect(x * bw + off + 1.5, y * bh + 1.5, bw - 3, bh - 3);
      }
    }
    return c;
  }

  function stucco(base) {
    const [c, g] = canvas(256, 256);
    const r = rng(3);
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    // rusticated joints, like a painted Regency/Victorian render
    g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
    return c;
  }

  function wood(base) {
    const [c, g] = canvas(256, 512);
    const r = rng(base.length * 13);
    g.fillStyle = base; g.fillRect(0, 0, 256, 512);
    const planks = 6, pw = 256 / planks;
    for (let p = 0; p < planks; p++) {
      g.fillStyle = shade(base, (r() - 0.5) * 0.1);
      g.fillRect(p * pw + 1, 0, pw - 2, 512);
      for (let i = 0; i < 18; i++) {
        g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`;
        g.beginPath();
        const x = p * pw + r() * pw;
        g.moveTo(x, 0);
        g.bezierCurveTo(x + 4, 170, x - 4, 340, x, 512);
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(p * pw, r() * 512, pw, 2);
    }
    return c;
  }

  function wallpaper(base) {
    const [c, g] = canvas(256, 256);
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    const light = shade(base, 0.08);
    // vertical stripes + damask lozenges
    g.fillStyle = shade(base, -0.03);
    for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 6, 256);
    g.fillStyle = light;
    const motif = (cx, cy) => {
      g.beginPath();
      g.ellipse(cx, cy, 14, 24, 0, 0, Math.PI * 2); g.fill();
      g.beginPath();
      g.ellipse(cx, cy - 30, 5, 8, 0, 0, Math.PI * 2); g.fill();
      g.beginPath();
      g.ellipse(cx, cy + 30, 5, 8, 0, 0, Math.PI * 2); g.fill();
      g.beginPath();
      g.ellipse(cx - 20, cy, 8, 4, 0, 0, Math.PI * 2);
      g.ellipse(cx + 20, cy, 8, 4, 0, 0, Math.PI * 2); g.fill();
    };
    motif(32, 64); motif(160, 64); motif(96, 192); motif(224, 192);
    return c;
  }

  // Gilded shop fascia sign
  function sign(main, sub, bg, gold) {
    const [c, g] = canvas(1024, 160);
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 160);
    g.strokeStyle = gold; g.lineWidth = 4;
    g.strokeRect(10, 10, 1004, 140);
    g.lineWidth = 1.5;
    g.strokeRect(20, 20, 984, 120);
    const grad = g.createLinearGradient(0, 30, 0, 110);
    grad.addColorStop(0, "#fff3c4");
    grad.addColorStop(0.45, gold);
    grad.addColorStop(1, shade(gold, -0.22));
    g.textAlign = "center"; g.textBaseline = "middle";
    let size = 70;
    g.font = `700 ${size}px "Playfair Display", Georgia, serif`;
    while (g.measureText(main).width > 900 && size > 30) {
      size -= 4;
      g.font = `700 ${size}px "Playfair Display", Georgia, serif`;
    }
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillText(main, 515, 69);
    g.fillStyle = grad;
    g.fillText(main, 512, 66);
    g.font = `italic 500 28px "Playfair Display", Georgia, serif`;
    g.fillStyle = gold;
    g.fillText(sub, 512, 122);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }

  // Simple sign with one line of text (street name plates, small signs)
  function plate(text, bg, fg, w, h) {
    const [c, g] = canvas(w || 512, h || 128);
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    let size = Math.floor(c.height * 0.5);
    g.font = `700 ${size}px "Playfair Display", Georgia, serif`;
    while (g.measureText(text).width > c.width - 50 && size > 12) {
      size -= 2;
      g.font = `700 ${size}px "Playfair Display", Georgia, serif`;
    }
    g.fillText(text, c.width / 2, c.height / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }

  // Clock face (roman numerals)
  function clockFace() {
    const [c, g] = canvas(256, 256);
    g.fillStyle = "#f2ead6"; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 6; g.stroke();
    const nums = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    g.fillStyle = "#1a1a1a"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `600 22px "Playfair Display", Georgia, serif`;
    nums.forEach((n, i) => {
      const a = (i / 12) * Math.PI * 2;
      g.fillText(n, 128 + Math.sin(a) * 98, 128 - Math.cos(a) * 98);
    });
    return new THREE.CanvasTexture(c);
  }

  // Soft radial glow for lamps and lit windows
  function glow(color) {
    const [c, g] = canvas(128, 128);
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function get(key, make, rx, ry) {
    if (!cache[key]) cache[key] = make();
    const t = toTexture(cache[key], rx, ry);
    return t;
  }

  RC.tex = {
    cobbles: (rx, ry) => get("cobbles", cobbles, rx, ry),
    flags: (rx, ry) => get("flags", flags, rx, ry),
    brick: (rx, ry) => get("brick", () => brick("#8a3b2a", "#9b8f80"), rx, ry),
    yellowBrick: (rx, ry) => get("ybrick", () => brick("#b59a68", "#8f8776"), rx, ry),
    stucco: (rx, ry) => get("stucco", () => stucco("#d9cfbd"), rx, ry),
    wood: (base, rx, ry) => get("wood" + base, () => wood(base), rx, ry),
    wallpaper: (base, rx, ry) => get("wp" + base, () => wallpaper(base), rx, ry),
    sign, plate, clockFace, glow, shade,
  };
})();
