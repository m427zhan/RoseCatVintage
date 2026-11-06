/* Geometry toolkit for the detailed interiors: rounded boxes, mouldings, panel frames, walls with
   arched openings, balustrades, soft contact shadows, and a merger that bakes thousands of static
   pieces into a handful of draw calls (with real-world-scale UVs). */

(function () {
  const V2 = THREE.Vector2, V3 = THREE.Vector3;

  /* ---------- UVs in metres (box projection, chosen per triangle) ---------- */
  function worldUV(g, scale) {
    if (g.index) g = g.toNonIndexed();
    const p = g.attributes.position, n = p.count;
    const uv = new Float32Array(n * 2);
    const a = new V3(), b = new V3(), c = new V3(), e1 = new V3(), e2 = new V3();
    for (let i = 0; i < n; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      e1.subVectors(b, a); e2.subVectors(c, a); e1.cross(e2);
      const ax = Math.abs(e1.x), ay = Math.abs(e1.y), az = Math.abs(e1.z);
      for (let k = 0; k < 3; k++) {
        const x = p.getX(i + k), y = p.getY(i + k), z = p.getZ(i + k);
        let u, v;
        if (ay >= ax && ay >= az) { u = x; v = -z; }
        else if (ax >= az) { u = e1.x > 0 ? -z : z; v = y; }
        else { u = e1.z > 0 ? x : -x; v = y; }
        uv[(i + k) * 2] = u / scale;
        uv[(i + k) * 2 + 1] = v / scale;
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }

  // Give every mesh under `root` metre-scale UVs if its material asks for them (local space)
  function autoUV(root) {
    root.traverse((o) => {
      if (o.isMesh && o.material && o.material.userData && o.material.userData.uvScale && !o.geometry.userData.uvDone) {
        o.geometry = worldUV(o.geometry.index ? o.geometry : o.geometry.clone(), o.material.userData.uvScale);
        o.geometry.userData.uvDone = true;
      }
    });
    return root;
  }

  /* ---------- Merge static meshes by material ---------- */
  function mergeStatic(root) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map();
    const victims = [];
    (function walk(o) {
      // noMerge objects stay as they are; joints (moving parts) are merged separately by the caller
      if (o !== root && (o.userData.noMerge || o.userData.joint)) return;
      if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material)) {
        const key = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : "");
        if (!buckets.has(key)) buckets.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, list: [] });
        const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
        buckets.get(key).list.push({ geo: o.geometry, m });
        victims.push(o);
      }
      o.children.slice().forEach(walk);
    })(root);
    victims.forEach((o) => o.parent && o.parent.remove(o));

    buckets.forEach((b) => {
      const parts = [];
      let total = 0;
      b.list.forEach(({ geo, m }) => {
        let g = geo.index ? geo.toNonIndexed() : geo.clone();
        g.applyMatrix4(m);
        if (m.determinant() < 0) {
          // mirrored piece: flip winding so it isn't inside out
          ["position", "normal", "uv"].forEach((k) => {
            const at = g.attributes[k];
            if (!at) return;
            const s = at.itemSize, arr = at.array;
            for (let i = 0; i < at.count; i += 3) for (let j = 0; j < s; j++) { const t = arr[(i + 1) * s + j]; arr[(i + 1) * s + j] = arr[(i + 2) * s + j]; arr[(i + 2) * s + j] = t; }
          });
        }
        if (b.mat.userData.uvScale) g = worldUV(g, b.mat.userData.uvScale);
        if (!g.attributes.normal) g.computeVertexNormals();
        parts.push(g);
        total += g.attributes.position.count;
      });
      const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
      let o3 = 0, o2 = 0;
      parts.forEach((g) => {
        pos.set(g.attributes.position.array, o3);
        nor.set(g.attributes.normal.array, o3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o2);
        o3 += g.attributes.position.count * 3;
        o2 += g.attributes.position.count * 2;
        g.dispose();
      });
      const mg = new THREE.BufferGeometry();
      mg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      mg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      mg.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      mg.computeBoundingSphere();
      const mesh = new THREE.Mesh(mg, b.mat);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.recv;
      mesh.matrixAutoUpdate = false;
      root.add(mesh);
    });
    return root;
  }

  /* ---------- Shapes ---------- */
  function mesh(geo, m, x, y, z) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x || 0, y || 0, z || 0);
    return o;
  }

  // Box centred at x,y,z
  function bx(w, h, d, m, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z); }

  // Rounded (bevelled) box centred at x,y,z — soft edges catch highlights like real joinery
  const rboxCache = {};
  function rboxGeo(w, h, d, r, seg) {
    r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    seg = seg || 2;
    const key = [w, h, d, r, seg].map((v) => v.toFixed(4)).join();
    if (rboxCache[key]) return rboxCache[key];
    const s = new THREE.Shape();
    const hw = w / 2 - r, hh = h / 2 - r;
    s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: seg || 2, curveSegments: 4 });
    g.translate(0, 0, -(d - 2 * r) / 2);
    rboxCache[key] = g;
    return g;
  }
  function rbox(w, h, d, r, m, x, y, z, seg) { return mesh(rboxGeo(w, h, d, r, seg), m, x, y, z); }

  function cyl(rt, rb, h, m, x, y, z, seg, open) {
    return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24, 1, !!open), m, x, y, z);
  }
  function sphere(r, m, x, y, z, ws, hs) { return mesh(new THREE.SphereGeometry(r, ws || 20, hs || 14), m, x, y, z); }

  // Lathe from [radius, height] pairs
  function lathe(pts, m, seg, x, y, z) {
    return mesh(new THREE.LatheGeometry(pts.map((p) => new V2(Math.max(0, p[0]), p[1])), seg || 24), m, x, y, z);
  }

  // A turned baluster / leg, height h, base at y = 0
  function turned(h, r, m, style) {
    const k = h;
    const pts = style === "vase"
      ? [[0, 0], [r * 1.15, 0], [r * 1.15, 0.06 * k], [r * 0.7, 0.1 * k], [r * 1.3, 0.3 * k], [r * 0.6, 0.62 * k], [r * 0.45, 0.75 * k], [r * 0.9, 0.82 * k], [r * 0.9, 0.88 * k], [r * 1.1, 0.92 * k], [r * 1.1, k], [0, k]]
      : [[0, 0], [r * 0.7, 0], [r, 0.08 * k], [r * 0.6, 0.15 * k], [r * 0.55, 0.85 * k], [r * 0.9, 0.9 * k], [r, 0.95 * k], [r, k], [0, k]];
    return lathe(pts, m, 10);
  }

  // Moulding: profile points [out, up] (metres) swept along X, centred, facing +Z
  function moulding(profile, length, m) {
    const s = new THREE.Shape();
    s.moveTo(0, profile[0][1]);
    profile.forEach((p) => s.lineTo(p[0], p[1]));
    s.lineTo(0, profile[profile.length - 1][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, curveSegments: 6 });
    g.translate(0, 0, -length / 2);
    g.rotateY(-Math.PI / 2);
    return new THREE.Mesh(g, m);
  }
  const PROFILES = {
    cornice: [[0, 0], [0.03, 0], [0.03, 0.03], [0.08, 0.08], [0.1, 0.12], [0.16, 0.16], [0.16, 0.2], [0.12, 0.2], [0.12, 0.22], [0, 0.22]],
    dado: [[0, 0], [0.02, 0], [0.03, 0.015], [0.03, 0.035], [0.015, 0.05], [0, 0.05]],
    skirting: [[0, 0], [0.025, 0], [0.025, 0.18], [0.015, 0.2], [0.012, 0.23], [0, 0.24]],
    picture: [[0, 0], [0.015, 0.005], [0.02, 0.02], [0.012, 0.035], [0, 0.04]],
  };

  // Picture-frame style moulded rectangle in the XY plane (mitred corners), facing +Z
  function frame(w, h, bw, depth, m, x, y, z) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + bw, -h / 2 + bw); hole.lineTo(-w / 2 + bw, h / 2 - bw); hole.lineTo(w / 2 - bw, h / 2 - bw); hole.lineTo(w / 2 - bw, -h / 2 + bw); hole.closePath();
    s.holes.push(hole);
    const bev = Math.min(depth * 0.6, bw * 0.4);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, depth - bev), bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 4 });
    return mesh(g, m, x, y, z);
  }

  // Arched frame (round-headed) in the XY plane: opening w x h (h includes the arch)
  function archShape(w, h, path) {
    const r = w / 2, sh = h - r;
    path.moveTo(-r, 0); path.lineTo(-r, sh); path.absarc(0, sh, r, Math.PI, 0, true); path.lineTo(r, 0);
    return path;
  }

  /*
    Wall panel in the XY plane (thickness along Z, front face at z = +t/2) with openings cut out.
    openings: [{ x (centre), y (bottom), w, h, arch: bool }]
  */
  function wall(w, h, t, openings, m) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
    (openings || []).forEach((o) => {
      const p = new THREE.Path();
      if (o.arch) {
        const r = o.w / 2, sh = o.h - r;
        p.moveTo(o.x - r, o.y); p.lineTo(o.x + r, o.y); p.lineTo(o.x + r, o.y + sh);
        p.absarc(o.x, o.y + sh, r, 0, Math.PI, false);
        p.lineTo(o.x - r, o.y);
      } else {
        p.moveTo(o.x - o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y + o.h); p.closePath();
      }
      s.holes.push(p);
    });
    const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 16 });
    g.translate(0, 0, -t / 2);
    return new THREE.Mesh(g, m);
  }

  // Arched architrave around an opening (sits on the wall face), facing +Z
  function archTrim(w, h, bw, depth, m) {
    const s = new THREE.Shape();
    const ro = w / 2 + bw, ri = w / 2, sh = h - ri;
    s.moveTo(-ro, 0); s.lineTo(-ro, sh); s.absarc(0, sh, ro, Math.PI, 0, true); s.lineTo(ro, 0);
    s.lineTo(ri, 0); s.lineTo(ri, sh); s.absarc(0, sh, ri, 0, Math.PI, false); s.lineTo(-ri, 0); s.closePath();
    const bev = Math.min(depth * 0.5, bw * 0.3);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, depth - bev), bevelEnabled: true, bevelSize: bev, bevelThickness: bev, bevelSegments: 2, curveSegments: 20 });
    return new THREE.Mesh(g, m);
  }

  // Tube along points
  function tube(points, r, m, seg, closed) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new V3(p[0], p[1], p[2]))), !!closed);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, seg || 24, r, 8, !!closed), m);
  }

  // C-scroll of wrought iron in the XY plane
  function scroll(r, turns, thick, m) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2 * turns;
      const rr = r * (1 - (i / 24) * 0.65);
      pts.push(new V3(Math.cos(a) * rr, Math.sin(a) * rr, 0));
    }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, thick, 5), m);
  }

  /*
    Balustrade running along +X from 0 to `len`, standing at y = 0, facing +Z.
    style: "stone" (turned balusters), "iron" (bars and scrolls, gilt rail), "brass"
  */
  function balustrade(len, h, style, mats) {
    const g = new THREE.Group();
    if (style === "stone") {
      g.add(rbox(len, 0.12, 0.26, 0.02, mats.rail, len / 2, 0.06, 0));
      g.add(rbox(len + 0.04, 0.1, 0.3, 0.03, mats.rail, len / 2, h - 0.05, 0));
      const n = Math.max(2, Math.round(len / 0.2));
      for (let i = 0; i < n; i++) {
        const b = turned(h - 0.22, 0.07, mats.post, "vase");
        b.position.set((i + 0.5) * (len / n), 0.12, 0);
        g.add(b);
      }
    } else {
      // gilded mahogany handrail on wrought-iron panels
      g.add(rbox(len, 0.07, 0.09, 0.03, mats.rail, len / 2, h - 0.035, 0));
      g.add(bx(len, 0.025, 0.025, mats.post, len / 2, h - 0.09, 0));
      g.add(bx(len, 0.03, 0.03, mats.post, len / 2, 0.06, 0));
      const n = Math.max(1, Math.round(len / 0.5));
      for (let i = 0; i < n; i++) {
        const x0 = i * (len / n), w = len / n;
        g.add(bx(0.018, h - 0.12, 0.018, mats.post, x0, (h - 0.12) / 2 + 0.06, 0));
        // lyre: two facing scrolls, a bar and a gilt rosette
        [-1, 1].forEach((s) => {
          const sc = scroll(w * 0.22, 1.2, 0.006, mats.post);
          sc.position.set(x0 + w / 2 + s * w * 0.2, h * 0.45, 0);
          sc.scale.set(s, 1.5, 1);
          g.add(sc);
        });
        g.add(bx(0.014, h - 0.2, 0.014, mats.post, x0 + w / 2, h / 2, 0));
        g.add(sphere(0.025, mats.accent || mats.rail, x0 + w / 2, h * 0.45, 0, 10, 8));
      }
      g.add(bx(0.018, h - 0.12, 0.018, mats.post, len, (h - 0.12) / 2 + 0.06, 0));
    }
    return g;
  }

  /* ---------- True bounds, counting every instance of an InstancedMesh (Box3.setFromObject doesn't) ---------- */
  function bounds(obj) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3(), tmp = new THREE.Box3(), m = new THREE.Matrix4();
    obj.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const g = o.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m);
          m.premultiply(o.matrixWorld);
          box.union(tmp.copy(g.boundingBox).applyMatrix4(m));
        }
      } else box.union(tmp.copy(g.boundingBox).applyMatrix4(o.matrixWorld));
    });
    return box;
  }

  /* ---------- Soft contact shadow (cheap ambient occlusion under furniture) ---------- */
  let blobTex = null;
  function blob(w, d, opacity) {
    if (!blobTex) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, "rgba(0,0,0,1)");
      grd.addColorStop(0.5, "rgba(0,0,0,0.55)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      blobTex = new THREE.CanvasTexture(c);
    }
    const m = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: opacity === undefined ? 0.5 : opacity, depthWrite: false, color: "#000000", polygonOffset: true, polygonOffsetFactor: -2 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
    p.rotation.x = -Math.PI / 2;
    p.position.y = 0.004;
    p.userData.noMerge = true;
    p.renderOrder = 1;
    return p;
  }

  // Darkened strip where walls meet the floor (baked-looking ambient occlusion)
  let aoTex = null;
  function aoStrip(len, hgt) {
    if (!aoTex) {
      const c = document.createElement("canvas");
      c.width = 4; c.height = 64;
      const g = c.getContext("2d");
      const grd = g.createLinearGradient(0, 64, 0, 0);
      grd.addColorStop(0, "rgba(0,0,0,0.55)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 4, 64);
      aoTex = new THREE.CanvasTexture(c);
    }
    const m = new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, color: "#000000", polygonOffset: true, polygonOffsetFactor: -2 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(len, hgt || 0.5), m);
    p.userData.noMerge = true;
    return p;
  }

  RC.kit = {
    worldUV, autoUV, mergeStatic, mesh, bx, rbox, rboxGeo, cyl, sphere, lathe, turned, moulding, PROFILES,
    frame, archShape, wall, archTrim, tube, scroll, balustrade, blob, aoStrip, bounds,
  };
})();
