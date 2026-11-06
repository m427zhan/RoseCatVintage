/* Street front for the jewellery house: black-lacquer and gilt arched shopfront on a granite plinth,
   dressed limestone above with a wrought-iron balcony, carved window heads, and a slate mansard roof.
   Same contract as buildShop() in world.js: front face at z = 0, street side +Z, returns
   { group, door (hinge pivot), handle }. */

(function () {
  const K = RC.kit, F = RC.furn, P = RC.pbr, L = RC.pbr.lib;

  RC.facades = RC.facades || {};
  RC.facades.maison = function (def, W, H) {
    const g = new THREE.Group();
    const half = W / 2;
    const lacquer = new THREE.MeshPhysicalMaterial({ color: "#0c0d0e", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
    const gilt = L.gilt(), gold = L.gold();
    const stone = P.mat("limestone", { scale: 1.2 });
    const granite = L.blackMarble();
    const iron = L.iron();
    const GF = 4.6;

    /* ---------- Ground floor: three arched bays ---------- */
    g.add(K.rbox(W + 0.1, 0.5, 0.5, 0.03, granite, 0, 0.25, 0.05));
    // solid lacquered front with three arched openings
    const bays = [{ x: -2.45, w: 2.1, y: 0.75, h: 3.3 }, { x: 0, w: 1.45, y: 0, h: 3.35 }, { x: 2.45, w: 2.1, y: 0.75, h: 3.3 }];
    const front = K.wall(W, GF, 0.3, bays.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h, arch: true })), lacquer);
    front.position.z = -0.1;
    g.add(front);
    bays.forEach((b) => {
      const tr = K.archTrim(b.w, b.h, 0.1, 0.05, gilt);
      tr.position.set(b.x, b.y, 0.05);
      g.add(tr);
      // keystone
      g.add(K.rbox(0.22, 0.32, 0.12, 0.02, gilt, b.x, b.y + b.h + 0.06, 0.08));
    });
    // pilasters with gilt capitals
    [-half + 0.2, -1.22, 1.22, half - 0.2].forEach((x) => {
      g.add(K.rbox(0.34, GF - 0.9, 0.16, 0.02, lacquer, x, 0.45 + (GF - 0.9) / 2, 0.1));
      g.add(K.bx(0.04, GF - 1.3, 0.02, gilt, x, 0.65 + (GF - 1.3) / 2, 0.19));
      g.add(K.rbox(0.44, 0.22, 0.24, 0.03, gilt, x, GF - 0.42, 0.12));
      g.add(K.rbox(0.42, 0.1, 0.22, 0.02, gilt, x, 0.52, 0.12));
    });
    // fascia with the name in gilt letters, and a gilt cornice
    const signM = new THREE.MeshStandardMaterial({ map: RC.tex.sign(def.sign, def.subsign, "#0c0d0e", "#e0bd6a"), roughness: 0.35, metalness: 0.2 });
    g.add(K.rbox(W - 0.4, 0.7, 0.12, 0.02, lacquer, 0, GF - 0.05, 0.12));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(W - 1.0, 0.56), signM);
    sign.position.set(0, GF - 0.05, 0.185);
    g.add(sign);
    g.add(K.rbox(W + 0.2, 0.08, 0.36, 0.02, gilt, 0, GF + 0.33, 0.14));
    g.add(K.rbox(W + 0.3, 0.18, 0.5, 0.04, stone, 0, GF + 0.46, 0.1));

    // display windows: glass, velvet backdrops, jewels on stands, lit from within
    const glass = F.glass();
    const backM = new THREE.MeshStandardMaterial({ color: "#2a1520", roughness: 0.9, emissive: "#3a1a24", emissiveIntensity: 0.6 });
    const bedM = F.velvet("#1c1a2a");
    const picks = def.items.filter((i) => i.kind).map((i) => i.kind);
    [bays[0], bays[2]].forEach((b, wi) => {
      const pane = new THREE.Mesh(new THREE.ShapeGeometry(K.archShape(b.w, b.h, new THREE.Shape()), 16), glass);
      pane.position.set(b.x, b.y, 0.02);
      g.add(pane);
      g.add(K.bx(b.w, 0.06, 0.8, bedM, b.x, b.y + 0.03, -0.42));
      const back = new THREE.Mesh(new THREE.ShapeGeometry(K.archShape(b.w, b.h, new THREE.Shape()), 16), backM);
      back.position.set(b.x, b.y, -0.8);
      g.add(back);
      [-1, 1].forEach((sd) => g.add(K.bx(0.04, b.h, 0.56, backM, b.x + sd * (b.w / 2 - 0.02), b.y + b.h / 2, -0.52)));
      // stepped velvet plinths with pieces from the shop
      [-0.55, 0, 0.55].forEach((dx, k) => {
        const ph = [0.35, 0.6, 0.35][k];
        g.add(K.rbox(0.42, ph, 0.38, 0.03, bedM, b.x + dx, b.y + 0.06 + ph / 2, -0.4));
        const it = RC.makeItem(picks[(wi * 3 + k) % picks.length] || "brooch");
        const sz = K.bounds(it).getSize(new THREE.Vector3());
        it.scale.setScalar(Math.min(2.4, 0.4 / Math.max(sz.y, sz.x, 0.05)));
        it.position.set(b.x + dx, b.y + 0.06 + ph, -0.4);
        g.add(it);
      });
      const l = new THREE.PointLight("#fff0d0", 0.9, 3.5, 2);
      l.position.set(b.x, b.y + b.h - 0.3, -0.3);
      g.add(l);
    });

    // recessed entrance: marble step and mosaic, reveals, fanlight
    g.add(K.bx(1.5, 0.06, 0.8, L.whiteMarble(), 0, 0.03, -0.25));
    g.add(K.bx(1.0, 0.012, 0.5, gilt, 0, 0.066, -0.25));
    [-0.72, 0.72].forEach((x) => g.add(K.bx(0.06, 3.0, 0.7, lacquer, x, 1.5, -0.27)));
    g.add(K.bx(1.45, 0.06, 0.7, lacquer, 0, 2.72, -0.27));
    const fan = new THREE.Mesh(new THREE.ShapeGeometry(K.archShape(1.45, 0.725, new THREE.Shape()), 16), new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffc070", emissiveIntensity: 0.9 }));
    fan.position.set(0, 2.62, -0.58);
    g.add(fan);
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.7), new THREE.MeshStandardMaterial({ color: "#e8c08a", emissive: "#ffc27a", emissiveIntensity: 0.55 })).translateY(1.35).translateZ(-1.05));

    // the door on its hinge, glazed, with a brass handle
    const pivot = new THREE.Group();
    pivot.position.set(-0.6, 0, -0.6);
    const door = new THREE.Group();
    door.add(K.rbox(1.2, 2.66, 0.06, 0.01, lacquer, 0.6, 1.33, 0));
    door.add(new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.3), new THREE.MeshStandardMaterial({ color: "#d9a868", emissive: "#e8a050", emissiveIntensity: 0.5 })).translateX(0.6).translateY(1.75).translateZ(0.032));
    door.add(K.frame(0.9, 1.36, 0.04, 0.02, gilt, 0.6, 1.75, 0.035));
    door.add(K.frame(0.8, 0.6, 0.05, 0.02, gilt, 0.6, 0.5, 0.035));
    door.add(K.bx(0.85, 0.07, 0.01, gilt, 0.6, 1.0, 0.04));
    const handle = K.sphere(0.035, L.brass(), 1.05, 1.0, 0.08, 16, 12);
    door.add(handle);
    door.add(K.cyl(0.012, 0.012, 0.05, L.brass(), 1.05, 1.0, 0.055, 8).rotateX(Math.PI / 2));
    pivot.add(door);
    g.add(pivot);

    // bronze lanterns either side of the door
    [-1.22, 1.22].forEach((x) => {
      const ln = new THREE.Group();
      ln.position.set(x, 2.6, 0.32);
      ln.add(K.bx(0.04, 0.04, 0.25, gold, 0, 0.35, -0.12));
      ln.add(K.cyl(0.11, 0.08, 0.32, new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffc060", emissiveIntensity: 1.5, transparent: true, opacity: 0.92 }), 0, 0.12, 0, 6));
      ln.add(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.18, 6), gold).translateY(0.36));
      ln.add(K.sphere(0.03, gold, 0, 0.47, 0, 8, 6));
      g.add(ln);
    });

    /* ---------- Upper floors: dressed limestone ---------- */
    const upH = H - GF - 0.6;
    g.add(K.bx(W, upH, 0.5, stone, 0, GF + 0.55 + upH / 2, -0.25));
    const floors = 2, fh = (upH - 2.2) / floors;
    for (let f = 0; f < floors; f++) {
      const y = GF + 0.9 + f * fh;
      // string course
      g.add(K.rbox(W + 0.06, 0.14, 0.14, 0.02, stone, 0, y - 0.32, 0.05));
      [-2.6, 0, 2.6].forEach((x) => {
        const ww = 1.25, wh = fh - 1.0;
        g.add(new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshStandardMaterial({ color: (f + Math.round(x)) % 2 ? "#b88850" : "#1d2532", emissive: (f + Math.round(x)) % 2 ? "#e8a050" : "#000000", emissiveIntensity: 0.45, roughness: 0.15, metalness: 0.5 })).translateX(x).translateY(y + wh / 2).translateZ(0.02));
        g.add(K.frame(ww + 0.3, wh + 0.2, 0.15, 0.08, stone, x, y + wh / 2, 0.02));
        // glazing bars
        g.add(K.bx(0.05, wh, 0.04, F.paint("#ece6d8", 0.5), x, y + wh / 2, 0.04));
        for (let i = 1; i < 4; i++) g.add(K.bx(ww, 0.035, 0.04, F.paint("#ece6d8", 0.5), x, y + (wh * i) / 4, 0.04));
        // carved head: segmental pediment on the first floor, cornice on the second
        if (f === 0) {
          const sh = new THREE.Shape();
          sh.moveTo(-ww / 2 - 0.3, 0); sh.quadraticCurveTo(0, 0.6, ww / 2 + 0.3, 0); sh.lineTo(ww / 2 + 0.3, -0.12); sh.quadraticCurveTo(0, 0.42, -ww / 2 - 0.3, -0.12); sh.closePath();
          const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false, curveSegments: 12 }), stone);
          ped.position.set(x, y + wh + 0.32, -0.02);
          g.add(ped);
          g.add(K.rbox(ww + 0.5, 0.14, 0.24, 0.02, stone, x, y + wh + 0.2, 0.08));
          g.add(K.sphere(0.12, stone, x, y + wh + 0.4, 0.12, 12, 8));
        } else {
          g.add(K.rbox(ww + 0.4, 0.16, 0.22, 0.02, stone, x, y + wh + 0.18, 0.08));
        }
        // consoles under the sill
        [-ww / 2, ww / 2].forEach((dx) => g.add(K.rbox(0.12, 0.26, 0.2, 0.02, stone, x + dx, y - 0.2, 0.1)));
        if (f === 1) {
          // little iron railing (garde-corps)
          for (let i = 0; i <= 8; i++) g.add(K.bx(0.015, 0.6, 0.015, iron, x - ww / 2 + (ww * i) / 8, y + 0.3, 0.12));
          g.add(K.bx(ww + 0.05, 0.03, 0.04, iron, x, y + 0.6, 0.12));
        }
      });
      if (f === 0) {
        // continuous stone balcony on carved brackets, with a wrought-iron railing
        g.add(K.rbox(W - 0.3, 0.16, 0.95, 0.03, stone, 0, y - 0.12, 0.45));
        for (let i = 0; i < 6; i++) g.add(K.rbox(0.18, 0.4, 0.6, 0.03, stone, -W / 2 + 0.6 + (i * (W - 1.2)) / 5, y - 0.4, 0.3));
        const rail = K.balustrade(W - 0.4, 1.0, "iron", { rail: iron, post: iron, accent: gilt });
        rail.position.set(-W / 2 + 0.2, y - 0.04, 0.88);
        g.add(rail);
      }
    }
    // main cornice with modillions
    const cy = H - 0.55;
    g.add(K.rbox(W + 0.2, 0.3, 0.7, 0.04, stone, 0, cy, 0.1));
    for (let x = -W / 2 + 0.2; x < W / 2; x += 0.4) g.add(K.rbox(0.12, 0.16, 0.3, 0.02, stone, x, cy - 0.22, 0.25));
    g.add(K.rbox(W + 0.1, 0.12, 0.6, 0.03, stone, 0, cy + 0.2, 0.05));

    /* ---------- Mansard roof with dormers ---------- */
    const slate = P.mat("slate", { scale: 0.8 });
    const roofH = 2.4;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(W, roofH, 0.2), slate);
    roof.position.set(0, H + roofH / 2 - 0.15, -0.55);
    roof.rotation.x = -0.32;
    g.add(roof);
    g.add(K.bx(W, 0.3, 2.2, slate, 0, H + roofH - 0.05, -1.6));
    [-2.6, 0, 2.6].forEach((x) => {
      const dm = new THREE.Group();
      dm.position.set(x, H + 0.25, -0.2);
      dm.add(K.bx(0.95, 1.3, 0.8, stone, 0, 0.65, -0.3));
      dm.add(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshStandardMaterial({ color: "#1d2532", roughness: 0.15, metalness: 0.5 })).translateY(0.6).translateZ(0.11));
      dm.add(K.frame(0.8, 1.0, 0.1, 0.06, stone, 0, 0.6, 0.1));
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.85, 16, 1, false, -Math.PI / 2, Math.PI), slate);
      top.rotation.x = Math.PI / 2; top.position.set(0, 1.3, -0.3); top.scale.set(1, 1, 0.5);
      dm.add(top);
      g.add(dm);
    });
    // chimney stack
    g.add(K.bx(1.2, 2.2, 0.6, P.mat("limestone", { scale: 1.2 }), half - 1.2, H + 2.4, -1.8));
    [-0.35, 0, 0.35].forEach((o) => g.add(K.cyl(0.1, 0.13, 0.5, new THREE.MeshStandardMaterial({ color: "#8a4a32", roughness: 0.9 }), half - 1.2 + o, H + 3.7, -1.8, 10)));

    // street light from the shop windows
    const light = new THREE.PointLight("#ffc890", 1.4, 9, 2);
    light.position.set(0, 2.4, 0.9);
    g.add(light);

    K.autoUV(g);
    return { group: g, door: pivot, handle };
  };
})();
