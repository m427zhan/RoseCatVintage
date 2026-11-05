/* Rosecat Lane — game loop, controls, hands, shop visits, subtitles and sound */

(function () {
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EYE = 1.65;

  /* ---------------- Renderer ---------------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    $("introStatus").textContent = "Your browser can't show the 3D street, so let's take you to our shop page instead.";
    $("btnStart").textContent = "Visit the shop page";
    $("btnStart").disabled = false;
    $("btnStart").onclick = () => (location.href = "classic.html");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  $("game").appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 120);
  camera.rotation.order = "YXZ";

  // Soft environment so gold and brass have something to reflect
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#2b2d33");
  const envPanel = (c, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  envPanel("#b08a5a", 0, 8, 0);
  envPanel("#6a7488", 8, 2, 0);
  envPanel("#8a6a4a", -8, 2, 3);
  envPanel("#3a4250", 0, 2, -8);
  const envTex = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.04).texture;

  /* ---------------- First-person hands (drawn on top of everything) ---------------- */
  const handScene = new THREE.Scene();
  handScene.environment = envTex;
  const handCam = new THREE.PerspectiveCamera(70, camera.aspect, 0.01, 5);
  const handHemi = new THREE.HemisphereLight("#c8d0e0", "#3a3028", 0.7);
  const handSun = new THREE.DirectionalLight("#ffd8a8", 0.8);
  handSun.position.set(-1, 2, 1);
  handScene.add(handHemi, handSun);

  function makeHandRig(side) {
    const h = RC.makeHand(side);
    h.root.rotation.order = "YXZ";
    handScene.add(h.root);
    h.cur = { p: new THREE.Vector3(), r: new THREE.Vector3(), c: 0.35 };
    h.tgt = { p: new THREE.Vector3(), r: new THREE.Vector3(), c: 0.35 };
    h.follow = null;   // world-space Object3D the hand reaches for
    h.pose = "rest";
    return h;
  }
  const handR = makeHandRig(1);
  const handL = makeHandRig(-1);
  handR.root.visible = handL.root.visible = false;

  function restPose(h) {
    const s = h.side;
    const halfW = 0.43 * Math.tan(THREE.MathUtils.degToRad(35)) * camera.aspect;
    const x = Math.min(0.24, halfW * 0.6);
    return { p: new THREE.Vector3(s * x, -0.29, -0.43), r: new THREE.Vector3(0.18, s * 0.18, -s * 0.25), c: 0.18 };
  }
  function setPose(h, pose) {
    h.tgt.p.copy(pose.p);
    h.tgt.r.copy(pose.r);
    h.tgt.c = pose.c;
  }
  const EXAMINE_HAND = { p: new THREE.Vector3(0.05, -0.2, -0.34), r: new THREE.Vector3(0.55, 0.25, -2.7), c: 0.45 };
  const EXAMINE_ITEM = new THREE.Vector3(0.02, -0.075, -0.42);
  const SHOULDER = new THREE.Vector3(0.2, -0.25, 0.05);

  /* ---------------- Scenes ---------------- */
  const streetScene = new THREE.Scene();
  streetScene.background = new THREE.Color("#4d5664");
  streetScene.fog = new THREE.FogExp2("#4d5664", 0.032);
  streetScene.environment = envTex;
  streetScene.add(new THREE.HemisphereLight("#8f9bb0", "#3a3028", 0.6));
  const moon = new THREE.DirectionalLight("#b8c4d8", 0.35);
  moon.position.set(-5, 20, 8);
  streetScene.add(moon);

  let street = null;
  const interiors = {};

  /* ---------------- State ---------------- */
  const S = {
    mode: "loading",          // loading | intro | street | cutscene | shop
    scene: streetScene,
    pos: new THREE.Vector3(0, 0, 4.5),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: -0.02, eyeY: EYE,
    keys: {}, pad: { f: 0, b: 0, l: 0, r: 0 },
    shop: null, interior: null, prompt: null,
    dismissed: new Set(),
    holding: null,
    bobPhase: 0, walkAmt: 0,
  };

  /* ---------------- Tweens ---------------- */
  const tweens = [];
  const tween = (d, fn) => new Promise((res) => tweens.push({ d, t: 0, fn, res }));
  const wait = (s) => tween(s, () => {});
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  function lerpAngle(a, b, k) {
    let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (d < -Math.PI) d += Math.PI * 2;
    return a + d * k;
  }
  const yawTo = (from, to) => Math.atan2(-(to.x - from.x), -(to.z - from.z));

  function fadeTo(v, dur) {
    const f = $("fade");
    f.style.transitionDuration = dur + "s";
    f.style.opacity = v;
    return new Promise((r) => setTimeout(r, dur * 1000));
  }

  /* ---------------- Sound (synthesised, no files) ---------------- */
  const Snd = {
    ctx: null, master: null, amb: null, on: true, inside: false,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = this.on ? 0.7 : 0;
      this.master.connect(ctx.destination);
      if (ctx.state === "suspended") ctx.resume();
      // looping brown noise = distant city and wind
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      this.noise = buf;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 500;
      this.amb = ctx.createGain();
      this.amb.gain.value = 0.18;
      src.connect(lp).connect(this.amb).connect(this.master);
      src.start();
      this.scheduleHooves();
      this.tick();
    },
    setOn(on) {
      this.on = on;
      if (this.master) this.master.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.1);
    },
    setInside(inside) {
      this.inside = inside;
      if (this.amb) this.amb.gain.setTargetAtTime(inside ? 0.04 : 0.18, this.ctx.currentTime, 0.5);
    },
    burst(freq, q, dur, gain, type, when) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = when || ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type || "bandpass"; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(this.master);
      src.start(t, Math.random() * 2, dur + 0.05);
    },
    tone(freq, dur, gain, when, type) {
      if (!this.ctx) return;
      const ctx = this.ctx, t = when || ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = type || "sine"; o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    bell() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [0, 0.14, 0.26, 0.45].forEach((dt, i) => {
        const g = 0.12 / (i + 1);
        [2093, 2637, 3520, 4186].forEach((f, j) => this.tone(f * (1 + i * 0.004), 1.4 - j * 0.25, g / (j + 1), t + dt));
      });
    },
    latch() { this.burst(1800, 4, 0.06, 0.5); this.burst(220, 2, 0.12, 0.4, "lowpass"); },
    step() { this.burst(this.inside ? 380 : 700, 1.2, 0.08, this.inside ? 0.35 : 0.25, "lowpass"); },
    pick() { this.burst(3000, 8, 0.05, 0.15); },
    scheduleHooves() {
      const go = () => {
        if (!this.inside && this.ctx) {
          const t = this.ctx.currentTime;
          for (let i = 0; i < 12; i++) {
            const tt = t + i * 0.28 + (i % 2) * 0.09;
            this.burst(900 + Math.random() * 200, 6, 0.05, 0.08 * Math.sin((i / 12) * Math.PI), "bandpass", tt);
          }
        }
        setTimeout(go, 14000 + Math.random() * 16000);
      };
      setTimeout(go, 6000);
    },
    tick() {
      // a shop clock ticking quietly when indoors
      setInterval(() => { if (this.inside && this.ctx) this.burst(4200, 10, 0.02, 0.06); }, 1000);
    },
  };

  /* ---------------- Subtitles (and optional spoken voice) ---------------- */
  const Sub = {
    token: 0, speaking: false, voiceOn: false, skip: null, typing: false,
    timeOfDay() {
      const h = new Date().getHours();
      return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    },
    async say(lines, speaker, voice) {
      const my = ++this.token;
      for (const raw of lines) {
        if (my !== this.token) return;
        await this.line(raw.replace("{tod}", this.timeOfDay()), speaker, voice, my);
      }
      if (my === this.token) this.hide();
    },
    line(text, speaker, voice, my) {
      return new Promise((resolve) => {
        const box = $("subtitle");
        $("subSpeaker").textContent = speaker ? speaker + ":" : "";
        box.classList.toggle("narration", !speaker);
        box.hidden = false;
        const el = $("subText");
        el.textContent = "";
        this.speaking = !!speaker;
        this.typing = true;
        if (this.voiceOn && speaker && window.speechSynthesis) {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          const v = speechSynthesis.getVoices().filter((x) => /en-GB/i.test(x.lang));
          if (v.length) u.voice = v[voice === "f" ? Math.min(1, v.length - 1) : 0];
          u.lang = "en-GB"; u.rate = 0.95; u.pitch = voice === "f" ? 1.2 : 0.85;
          speechSynthesis.speak(u);
        }
        let i = 0, done = false, holdTimer = null;
        const finish = () => {
          if (done) return;
          done = true;
          clearInterval(typer); clearTimeout(holdTimer);
          this.skip = null;
          resolve();
        };
        const startHold = () => {
          this.typing = false;
          this.speaking = false;
          el.textContent = text;
          holdTimer = setTimeout(finish, Math.max(2200, text.length * 48));
        };
        const typer = setInterval(() => {
          if (my !== this.token) { finish(); return; }
          i += 1;
          el.textContent = text.slice(0, i);
          if (i >= text.length) { clearInterval(typer); startHold(); }
        }, 26);
        this.skip = () => {
          if (this.typing) { clearInterval(typer); startHold(); }
          else finish();
        };
      });
    },
    hide() {
      $("subtitle").hidden = true;
      this.speaking = false;
    },
    stop() {
      this.token++;
      if (this.skip) this.skip = null;
      if (window.speechSynthesis) speechSynthesis.cancel();
      this.hide();
    },
  };
  $("subtitle").addEventListener("click", () => Sub.skip && Sub.skip());

  /* ---------------- Prompts ---------------- */
  function showPrompt(kind, shop) {
    S.prompt = { kind, shop };
    const d = shop.def;
    if (kind === "enter") {
      $("promptTitle").textContent = d.sign;
      $("promptSub").textContent = d.subsign;
      $("promptText").textContent = "Would you like to step inside and have a look?";
      $("promptNo").textContent = "Maybe later";
    } else {
      $("promptTitle").textContent = d.sign;
      $("promptSub").textContent = "";
      $("promptText").textContent = "Step back out onto " + RC.STREET_NAME + "?";
      $("promptNo").textContent = "Not yet";
    }
    $("prompt").hidden = false;
  }
  function hidePrompt() {
    S.prompt = null;
    $("prompt").hidden = true;
  }
  $("promptYes").addEventListener("click", () => {
    if (!S.prompt) return;
    const { kind, shop } = S.prompt;
    hidePrompt();
    if (kind === "enter") enterShop(shop); else exitShop();
  });
  $("promptNo").addEventListener("click", () => {
    if (!S.prompt) return;
    S.dismissed.add(S.prompt.kind + S.prompt.shop.def.id);
    hidePrompt();
  });

  function clearInput() {
    S.keys = {};
    S.pad = { f: 0, b: 0, l: 0, r: 0 };
    document.querySelectorAll(".pad button").forEach((b) => b.classList.remove("held"));
    S.vel.set(0, 0, 0);
  }

  /* ---------------- Entering and leaving shops ---------------- */
  async function enterShop(shop) {
    S.mode = "cutscene";
    clearInput();
    Sub.stop();
    const p0 = S.pos.clone(), y0 = S.yaw, pi0 = S.pitch;
    const stand = shop.step.clone().lerp(shop.inside, 0.15);
    const yawDoor = yawTo(stand, shop.inside);
    await tween(1.0, (k) => {
      const e = ease(k);
      S.pos.lerpVectors(p0, stand, e);
      S.yaw = lerpAngle(y0, yawDoor, e);
      S.pitch = lerp(pi0, -0.5, e);
    });
    // reach out and take hold of the door handle
    handR.follow = shop.handle;
    handR.tgt.c = 0.85;
    await wait(0.6);
    Snd.latch();
    Snd.bell();
    await tween(1.1, (k) => { shop.door.rotation.y = ease(k) * 1.45; });
    handR.follow = null;
    setPose(handR, restPose(handR));
    const p1 = S.pos.clone();
    const doorway = shop.step.clone().lerp(shop.inside, 0.45);
    fadeTo(1, 0.8);
    await tween(0.9, (k) => {
      S.pos.lerpVectors(p1, doorway, ease(k));
      S.pitch = lerp(-0.5, 0, k);
    });
    shop.door.rotation.y = 0;
    goInside(shop);
    await fadeTo(0, 0.7);
    S.mode = "shop";
    const k = shop.def.keeper;
    Sub.say(shop.def.greeting, k.name, k.look);
  }

  function goInside(shop) {
    if (!interiors[shop.def.id]) {
      interiors[shop.def.id] = RC.buildInterior(shop.def);
      interiors[shop.def.id].scene.environment = envTex;
    }
    const it = interiors[shop.def.id];
    S.shop = shop;
    S.interior = it;
    S.scene = it.scene;
    S.pos.set(it.spawn.x, 0, it.spawn.z);
    S.yaw = it.spawn.yaw;
    S.pitch = -0.05;
    S.dismissed.delete("exit" + shop.def.id);
    handHemi.color.set("#ffe2bc");
    handSun.color.set("#ffcf90");
    Snd.setInside(true);
    $("place").textContent = shop.def.sign;
    $("btnLeave").hidden = false;
  }

  async function exitShop() {
    if (S.mode !== "shop") return;
    S.mode = "cutscene";
    clearInput();
    hidePrompt();
    hideHover();
    if (S.holding) putBack(true);
    const shop = S.shop, it = S.interior;
    Sub.say([shop.def.farewell], shop.def.keeper.name, shop.def.keeper.look);
    const p0 = S.pos.clone(), y0 = S.yaw, pi0 = S.pitch;
    const stand = new THREE.Vector3(0.15, 0, it.bounds.maxZ - 0.35);
    await tween(1.1, (k) => {
      const e = ease(k);
      S.pos.lerpVectors(p0, stand, e);
      S.yaw = lerpAngle(y0, Math.PI, e);
      S.pitch = lerp(pi0, -0.45, e);
    });
    handR.follow = it.knob;
    handR.tgt.c = 0.85;
    await wait(0.6);
    Snd.latch();
    Snd.bell();
    await fadeTo(1, 0.7);
    handR.follow = null;
    setPose(handR, restPose(handR));
    // back on the pavement, looking out over the street
    S.scene = streetScene;
    S.interior = null;
    S.shop = null;
    S.pos.copy(shop.front);
    S.yaw = yawTo(shop.step, shop.front) + 0.5;
    S.pitch = 0;
    S.dismissed.add("enter" + shop.def.id);
    handHemi.color.set("#c8d0e0");
    handSun.color.set("#ffd8a8");
    Snd.setInside(false);
    $("place").textContent = RC.STREET_NAME;
    $("btnLeave").hidden = true;
    await fadeTo(0, 0.7);
    S.mode = "street";
  }
  $("btnLeave").addEventListener("click", exitShop);

  /* ---------------- Picking items up ---------------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function itemAt(clientX, clientY) {
    if (!S.interior) return null;
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(S.interior.clickables, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.info) o = o.parent;
    return o ? { item: o, dist: hits[0].distance } : null;
  }

  async function pickUp(item) {
    S.mode = "cutscene";
    clearInput();
    hideHover();
    Snd.pick();
    camera.updateMatrixWorld();
    const local = item.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse);
    const dir = local.clone().sub(SHOULDER);
    const reach = SHOULDER.clone().add(dir.setLength(Math.min(dir.length(), 0.62)));
    setPose(handR, { p: reach.clone().add(new THREE.Vector3(0, 0.02, 0.1)), r: new THREE.Vector3(-0.1, 0.1, -0.5), c: 0.1 });
    await wait(0.45);
    handR.tgt.c = 0.75;
    await wait(0.15);

    // a copy of the item travels to the hand; the original disappears from the shelf
    const box = new THREE.Box3().setFromObject(item);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const copy = item.clone();
    copy.position.copy(item.getWorldPosition(new THREE.Vector3()).sub(centre));
    const holder = new THREE.Group();
    holder.add(copy);
    const sc = 0.17 / Math.max(size.x, size.y, size.z);
    holder.scale.setScalar(sc);
    copy.scale.copy(item.scale);
    holder.position.copy(reach).add(new THREE.Vector3(0, 0.03, -0.08));
    handScene.add(holder);
    item.visible = false;
    S.holding = { item, holder, from: holder.position.clone() };

    setPose(handR, EXAMINE_HAND);
    const start = holder.position.clone();
    await tween(0.65, (k) => holder.position.lerpVectors(start, EXAMINE_ITEM, ease(k)));

    const info = item.userData.info;
    $("itemName").textContent = info.name;
    $("itemShop").textContent = S.shop.def.sign + " · " + S.shop.def.subsign;
    $("itemLink").href = S.shop.def.link;
    $("itemCard").hidden = false;
    S.mode = "shop";
    Sub.say([info.note], S.shop.def.keeper.name, S.shop.def.keeper.look);
  }

  async function putBack(instant) {
    const h = S.holding;
    if (!h) return;
    $("itemCard").hidden = true;
    if (!instant) {
      S.mode = "cutscene";
      const reachPos = h.from.clone().add(new THREE.Vector3(0.05, -0.03, 0.1));
      setPose(handR, { p: reachPos, r: new THREE.Vector3(-0.1, 0.1, -0.5), c: 0.75 });
      const start = h.holder.position.clone();
      await tween(0.5, (k) => h.holder.position.lerpVectors(start, h.from, ease(k)));
      handR.tgt.c = 0.1;
      Snd.pick();
    }
    handScene.remove(h.holder);
    h.item.visible = true;
    S.holding = null;
    setPose(handR, restPose(handR));
    if (!instant) { await wait(0.25); S.mode = "shop"; }
  }
  $("itemPut").addEventListener("click", () => putBack(false));

  /* ---------------- Hover label over items ---------------- */
  function hideHover() {
    $("hoverTag").hidden = true;
    renderer.domElement.style.cursor = "";
  }
  function updateHover(x, y) {
    if (S.mode !== "shop" || S.holding) { hideHover(); return; }
    const hit = itemAt(x, y);
    if (!hit) { hideHover(); return; }
    const tag = $("hoverTag");
    tag.textContent = hit.dist < 3.4 ? hit.item.userData.info.name : hit.item.userData.info.name + " (step closer)";
    tag.style.left = x + "px";
    tag.style.top = y + "px";
    tag.hidden = false;
    renderer.domElement.style.cursor = hit.dist < 3.4 ? "pointer" : "";
  }

  /* ---------------- Look around (drag) and click ---------------- */
  const canvas = renderer.domElement;
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) { if (e.pointerType === "mouse") updateHover(e.clientX, e.clientY); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if ((S.mode === "street" || S.mode === "shop") && !S.holding) {
      const k = e.pointerType === "touch" ? 0.005 : 0.0035;
      S.yaw -= dx * k;
      S.pitch = Math.max(-1.1, Math.min(1.1, S.pitch - dy * k));
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    const wasClick = drag.moved < 8;
    drag = null;
    if (wasClick && S.mode === "shop" && !S.holding) {
      const hit = itemAt(e.clientX, e.clientY);
      if (hit) {
        if (hit.dist < 3.4) pickUp(hit.item);
        else Sub.say(["(Step a little closer to pick that up.)"]);
      }
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => (drag = null));

  /* ---------------- Movement: on-screen arrows and keyboard ---------------- */
  document.querySelectorAll(".pad button").forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); S.pad[dir] = 1; b.classList.add("held"); };
    const off = () => { S.pad[dir] = 0; b.classList.remove("held"); };
    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointercancel", off);
    b.addEventListener("lostpointercapture", off);
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  const keyMap = { KeyW: "f", ArrowUp: "f", KeyS: "b", ArrowDown: "b", KeyA: "l", ArrowLeft: "l", KeyD: "r", ArrowRight: "r", KeyQ: "tl", KeyE: "tr" };
  window.addEventListener("keydown", (e) => {
    const tgt = e.target.closest ? e.target : document.body;
    if (tgt.closest("a, input, textarea")) return;
    if (keyMap[e.code]) { S.keys[keyMap[e.code]] = 1; e.preventDefault(); }
    if ((e.code === "Space" || e.code === "Enter") && !S.prompt && Sub.skip && !tgt.closest("button")) { Sub.skip(); e.preventDefault(); }
    if (e.code === "Escape") {
      if (S.prompt) $("promptNo").click();
      else if (S.holding) putBack(false);
      else if (!$("help").hidden) $("help").hidden = true;
    }
  });
  window.addEventListener("keyup", (e) => { if (keyMap[e.code]) S.keys[keyMap[e.code]] = 0; });
  window.addEventListener("blur", clearInput);

  function collide(p, w) {
    const b = w.bounds, R = 0.3;
    p.x = Math.max(b.minX, Math.min(b.maxX, p.x));
    p.z = Math.max(b.minZ, Math.min(b.maxZ, p.z));
    (w.obstacles || []).forEach((o) => {
      if (o.box) {
        const bb = o.box;
        if (p.x > bb.minX - R && p.x < bb.maxX + R && p.z > bb.minZ - R && p.z < bb.maxZ + R) {
          const opts = [[p.x - (bb.minX - R), "x", bb.minX - R], [(bb.maxX + R) - p.x, "x", bb.maxX + R], [p.z - (bb.minZ - R), "z", bb.minZ - R], [(bb.maxZ + R) - p.z, "z", bb.maxZ + R]];
          opts.sort((a, c) => a[0] - c[0]);
          p[opts[0][1]] = opts[0][2];
        }
      } else {
        const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), min = o.r + R;
        if (d < min && d > 0.0001) { p.x = o.x + (dx / d) * min; p.z = o.z + (dz / d) * min; }
      }
    });
  }

  function move(dt) {
    const k = S.keys, pd = S.pad;
    const fwd = (k.f || pd.f ? 1 : 0) - (k.b || pd.b ? 1 : 0);
    const str = (k.r || pd.r ? 1 : 0) - (k.l || pd.l ? 1 : 0);
    S.yaw += ((k.tl ? 1 : 0) - (k.tr ? 1 : 0)) * dt * 1.8;
    const sin = Math.sin(S.yaw), cos = Math.cos(S.yaw);
    const want = new THREE.Vector3(-sin * fwd + cos * str, 0, -cos * fwd - sin * str);
    if (want.lengthSq() > 1) want.normalize();
    want.multiplyScalar(2.8);
    S.vel.lerp(want, 1 - Math.exp(-dt * 8));
    const world = S.mode === "shop" ? S.interior : street;
    S.pos.addScaledVector(S.vel, dt);
    collide(S.pos, world);
    const speed = S.vel.length();
    S.walkAmt = lerp(S.walkAmt, Math.min(1, speed / 2.8), 1 - Math.exp(-dt * 6));
    if (speed > 0.3) {
      const before = Math.floor(S.bobPhase / Math.PI);
      S.bobPhase += dt * speed * 3.2;
      if (Math.floor(S.bobPhase / Math.PI) !== before) Snd.step();
    }
  }

  /* ---------------- Proximity checks ---------------- */
  function checkProximity() {
    if (S.mode === "street") {
      let near = null, best = 1.9;
      street.shops.forEach((sh) => {
        const d = Math.hypot(S.pos.x - sh.front.x, S.pos.z - sh.front.z);
        if (d > 2.8) S.dismissed.delete("enter" + sh.def.id);
        if (d < best) { best = d; near = sh; }
      });
      if (near && !S.dismissed.has("enter" + near.def.id)) {
        if (!S.prompt || S.prompt.shop !== near) showPrompt("enter", near);
      } else if (S.prompt) hidePrompt();
    } else if (S.mode === "shop" && !S.holding) {
      const it = S.interior;
      const atDoor = S.pos.z > it.exitZ && Math.abs(S.pos.x) < 1.6;
      if (!atDoor) S.dismissed.delete("exit" + S.shop.def.id);
      if (atDoor && !S.dismissed.has("exit" + S.shop.def.id)) {
        if (!S.prompt) showPrompt("exit", S.shop);
      } else if (S.prompt) hidePrompt();
    }
  }

  /* ---------------- Hands each frame ---------------- */
  const tmpV = new THREE.Vector3();
  function updateHands(dt, t) {
    [handR, handL].forEach((h) => {
      if (h.follow) {
        h.follow.getWorldPosition(tmpV).applyMatrix4(camera.matrixWorldInverse);
        tmpV.add(new THREE.Vector3(0.015, -0.035, 0.085));
        const dir = tmpV.clone().sub(SHOULDER);
        if (dir.length() > 0.85) dir.setLength(0.85);
        h.tgt.p.copy(SHOULDER).add(dir);
        h.tgt.r.set(0.15, 0.25, -1.2);
      } else if (!S.holding || h === handL) {
        if (!(h === handR && S.mode === "cutscene")) setPose(h, restPose(h));
      }
      const a = 1 - Math.exp(-dt * 9);
      h.cur.p.lerp(h.tgt.p, a);
      h.cur.r.lerp(h.tgt.r, a);
      h.cur.c = lerp(h.cur.c, h.tgt.c, a);
      h.root.position.copy(h.cur.p);
      if (!reduceMotion && !h.follow) {
        const ph = S.bobPhase + (h.side > 0 ? 0 : Math.PI);
        h.root.position.y += Math.sin(ph * 2) * 0.012 * S.walkAmt + Math.sin(t * 1.3 + h.side) * 0.003;
        h.root.position.x += Math.sin(ph) * 0.01 * S.walkAmt;
        h.root.position.z += Math.cos(ph) * 0.02 * S.walkAmt;
      }
      h.root.rotation.set(h.cur.r.x, h.cur.r.y, h.cur.r.z);
      h.setCurl(h.cur.c);
    });
    if (S.holding) S.holding.holder.rotation.y += dt * 0.5;
  }

  /* ---------------- Main loop ---------------- */
  let last = performance.now(), time = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.d);
      tw.fn(k);
      if (k >= 1) { tweens.splice(i, 1); tw.res(); }
    }

    if ((S.mode === "street" || S.mode === "shop") && !S.holding) move(dt);
    else { S.vel.multiplyScalar(0.8); S.walkAmt *= 0.9; }

    // raise the eye a little on the pavement (kerb height)
    const floorY = S.scene === streetScene && Math.abs(S.pos.x) > 4.1 ? 0.15 : 0;
    S.eyeY = lerp(S.eyeY, EYE + floorY, 1 - Math.exp(-dt * 10));
    const bob = reduceMotion ? 0 : Math.sin(S.bobPhase * 2) * 0.025 * S.walkAmt;
    camera.position.set(S.pos.x, S.eyeY + bob, S.pos.z);
    camera.rotation.set(S.pitch, S.yaw, 0);
    camera.updateMatrixWorld();

    if (street && S.scene === streetScene) street.update(time);
    if (S.interior) S.interior.update(time, Sub.speaking, S.pos);
    if (S.mode !== "loading" && S.mode !== "intro") {
      updateHands(dt, time);
      checkProximity();
    }

    renderer.clear();
    renderer.render(S.scene, camera);
    renderer.clearDepth();
    renderer.render(handScene, handCam);
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = handCam.aspect = w / h;
    camera.updateProjectionMatrix();
    handCam.updateProjectionMatrix();
  });

  /* ---------------- HUD buttons ---------------- */
  $("btnSound").addEventListener("click", () => {
    Snd.setOn(!Snd.on);
    $("btnSound").setAttribute("aria-pressed", Snd.on);
    $("btnSound").textContent = Snd.on ? "Sound: on" : "Sound: off";
  });
  $("btnVoice").addEventListener("click", () => {
    Sub.voiceOn = !Sub.voiceOn;
    if (!Sub.voiceOn && window.speechSynthesis) speechSynthesis.cancel();
    $("btnVoice").setAttribute("aria-pressed", Sub.voiceOn);
    $("btnVoice").textContent = Sub.voiceOn ? "Voices: on" : "Voices: off";
  });
  if (!window.speechSynthesis) $("btnVoice").hidden = true;
  $("btnHelp").addEventListener("click", () => ($("help").hidden = !$("help").hidden));
  $("helpClose").addEventListener("click", () => ($("help").hidden = true));

  /* ---------------- Start-up ---------------- */
  async function boot() {
    requestAnimationFrame(frame);
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('700 70px "Playfair Display"'),
          document.fonts.load('italic 500 28px "Playfair Display"'),
        ]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch (e) { /* fonts are optional */ }
    street = RC.buildStreet(streetScene);
    S.mode = "intro";
    $("introStatus").textContent = "The gas lamps are lit.";
    $("btnStart").disabled = false;
  }

  $("btnStart").addEventListener("click", async () => {
    if (S.mode !== "intro") return;
    Snd.init();
    $("intro").classList.add("gone");
    setTimeout(() => ($("intro").hidden = true), 900);
    $("hud").hidden = false;
    $("pad").hidden = false;
    $("crosshair").hidden = false;
    handR.root.visible = handL.root.visible = true;
    [handR, handL].forEach((h) => {
      const p = restPose(h);
      h.cur.p.copy(p.p).add(new THREE.Vector3(0, -0.3, 0));
      h.cur.r.copy(p.r);
    });
    S.mode = "street";
    await wait(1.0);
    if (S.mode !== "street") return;
    Sub.say([
      RC.STREET_NAME + ", " + RC.STREET_YEAR + ". The fog is rolling in, but the shops are still open.",
      "Drag to look about, and use the arrows to walk. Stop at any shop door to step inside.",
    ]);
  });

  // Handy for testing from the browser console
  RC.game = { S, enterShop, exitShop, pickUp, get street() { return street; } };

  boot();
})();
