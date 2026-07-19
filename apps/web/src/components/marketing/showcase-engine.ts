/* The marketing surface's motion engine.
 *
 * Ported from the standalone showcase site. Everything is opt-in per page:
 * each feature initialises only when its elements exist, so one engine
 * serves the landing, the story, the roadmap and the flat pages.
 *
 * Every listener, observer, timer and rAF registers a teardown, because
 * Next client-navigates between marketing routes and a leaked frame loop
 * would keep hold of unmounted DOM.
 *
 * Motion rules (.claude/skills/emil-design-eng): transform/opacity only,
 * strong ease-out for entries, loops pause off-screen, reduced motion
 * keeps the meaning and drops the movement.
 */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const VERT = `#version 300 es
precision highp float;
const vec2 pos[3] = vec2[3](vec2(-1.,-1.), vec2(3.,-1.), vec2(-1.,3.));
out vec2 vUv;
void main(){ vUv = pos[gl_VertexID]*.5+.5; gl_Position = vec4(pos[gl_VertexID],0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes, uTexRes, uMouse;
uniform float uTime, uScroll, uEnergy;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}
float fbm(vec2 p){
  float v=0., a=.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; }
  return v;
}

void main(){
  vec2 uv = vUv;
  float rs = uRes.x/uRes.y, ts = uTexRes.x/uTexRes.y;
  vec2 fit = (rs > ts) ? vec2(1., ts/rs) : vec2(rs/ts, 1.);
  vec2 cuv = (uv - .5) * fit;

  float z = 1.0 - 0.035 - 0.006*sin(uTime*.13) - uScroll*.06;
  cuv *= z;
  cuv += (uMouse - .5) * -0.014;

  vec2 m = (uMouse - .5) * fit;
  float d = length(cuv - m);
  cuv += normalize(cuv - m + 1e-4) * sin(28.*d - uTime*3.5) * exp(-9.*d) * 0.006 * uEnergy;
  cuv += (fbm(cuv*6. + uTime*.08) - .5) * 0.0035;

  vec2 suv = cuv + .5;
  // when the panel is wider than the photo, look at the upper part
  if (rs > ts) suv.y += (0.62 - 0.5) * (1.0 - ts/rs);
  vec3 col = texture(uTex, suv).rgb;

  vec2 sp1 = vec2(suv.x*3.2, suv.y*2.2 + uTime*.055);
  vec2 sp2 = vec2(suv.x*5.5 + 3.7, suv.y*3.6 + uTime*.09);
  float steam = fbm(sp1)*.65 + fbm(sp2)*.35;
  steam = smoothstep(.52, .95, steam);
  float band = smoothstep(.98, .45, suv.y) * smoothstep(.0, .25, suv.y);
  col += vec3(.93,.90,.82) * steam * band * .12;

  float g = hash(vUv*uRes.xy + fract(uTime)*100.) - .5;
  col += g * .045;

  float vig = smoothstep(1.25, .45, length((vUv-.5)*vec2(rs/ts>1.?1.15:1.,1.05)*1.6));
  col *= mix(.72, 1.04, vig);
  col *= 1. - uScroll*.55;

  outColor = vec4(col, 1.);
}`;

interface InkStamp {
  x: number; y: number; rot: number; size: number; seed: number; t: number;
}
interface BurstLobe { dx: number; dy: number; rr: number }
interface BurstPart {
  x: number; y: number; vx: number; vy: number; r: number; o: number;
  spin: number; ang: number; lobes: BurstLobe[];
}

export function initShowcase(): () => void {
  const root = document.querySelector<HTMLElement>(".sc-root");
  if (!root) return () => {};

  const cleanups: Array<() => void> = [];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const mqSmall = matchMedia("(max-width: 640px)");

  /** addEventListener that always registers its own removal. */
  function on<T extends EventTarget>(
    target: T,
    type: string,
    fn: EventListener,
    opts?: AddEventListenerOptions,
  ) {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  }
  /** IntersectionObserver over one target, handing back the first entry.
   *  Keeps strict index-access happy without a cast at every call site. */
  function observeFirst(target: Element, fn: (e: IntersectionObserverEntry) => void, init?: IntersectionObserverInit) {
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e) fn(e);
    }, init);
    io.observe(target);
    cleanups.push(() => io.disconnect());
    return io;
  }
  function observe(io: IntersectionObserver, els: Element[]) {
    els.forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());
  }
  function timer(id: ReturnType<typeof setTimeout>) {
    cleanups.push(() => clearTimeout(id));
    return id;
  }

  /* ---------- anchor scrolling (restored on unmount) ---------- */
  const prevScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = reduceMotion ? "auto" : "smooth";
  cleanups.push(() => {
    document.documentElement.style.scrollBehavior = prevScrollBehavior;
  });

  /* ---------- loader ---------- */
  const heroTitle = document.getElementById("heroTitle");
  const dismissLoader = () => {
    root.removeAttribute("data-loading");
    heroTitle?.classList.add("in");
  };
  if (document.readyState === "complete") timer(setTimeout(dismissLoader, 300));
  else on(window, "load", () => timer(setTimeout(dismissLoader, 300)));
  timer(setTimeout(dismissLoader, 1800)); // never hold the page hostage

  root.querySelectorAll<HTMLElement>(".hero-title .w").forEach((w, i) => {
    w.style.transitionDelay = `${180 + i * 80}ms`;
  });

  /* ---------- reveals ---------- */
  const staggerParents = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>(".reveal-line").forEach((el) => {
    if (el.parentElement) staggerParents.add(el.parentElement);
  });
  staggerParents.forEach((p) => {
    p.querySelectorAll<HTMLElement>(".reveal-line").forEach((el, i) => {
      el.style.transitionDelay = `${i * 110}ms`;
    });
  });

  const revealIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );
  observe(revealIO, [
    ...root.querySelectorAll(".reveal, .reveal-line, .dash, .footer, .reveal-line-group"),
  ]);

  /* ---------- WebGL hero panel ---------- */
  const heroCanvas = document.getElementById("heroCanvas") as HTMLCanvasElement | null;
  const gl = heroCanvas?.getContext("webgl2", { antialias: false, alpha: false }) ?? null;
  const uni: Record<string, WebGLUniformLocation | null> = {};
  let glReady = false;
  let texSize: [number, number] = [1138, 1640];

  if (heroCanvas && !gl) root.classList.add("no-webgl");
  if (heroCanvas && gl) {
    const mk = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VERT);
    const fs = mk(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      root.classList.add("no-webgl");
    } else {
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        root.classList.add("no-webgl");
      } else {
        gl.useProgram(prog);
        (["uTex", "uRes", "uTexRes", "uMouse", "uTime", "uScroll", "uEnergy"] as const).forEach(
          (n) => { uni[n] = gl.getUniformLocation(prog, n); },
        );

        const tex = gl.createTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE,
          new Uint8Array([10, 30, 24]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const img = new Image();
        img.src = heroCanvas.dataset.tex || "/showcase/hero-serve.jpg";
        img.onload = () => {
          texSize = [img.naturalWidth, img.naturalHeight];
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        };
        glReady = true;
      }
    }
  }

  let mouse: [number, number] = [0.5, 0.5];
  const mouseS: [number, number] = [0.5, 0.5];
  let energy = 0;
  on(window, "pointermove", ((e: PointerEvent) => {
    mouse = [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
    energy = Math.min(1, energy + 0.08);
  }) as EventListener);

  let heroVisible = !!heroCanvas;
  const heroSection = document.getElementById("hero");
  if (heroSection) {
    observeFirst(heroSection, (e) => { heroVisible = e.isIntersecting; }, { threshold: 0 });
  }

  const dpr = () => Math.min(devicePixelRatio, 1.5);
  function sizeHero() {
    if (!heroCanvas) return;
    heroCanvas.width = Math.round(heroCanvas.clientWidth * dpr());
    heroCanvas.height = Math.round(heroCanvas.clientHeight * dpr());
  }
  sizeHero();

  function drawHero(t: number) {
    if (!glReady || !gl || !heroCanvas) return;
    if (heroCanvas.width !== Math.round(heroCanvas.clientWidth * dpr())) sizeHero();
    gl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
    mouseS[0] = lerp(mouseS[0], mouse[0], 0.06);
    mouseS[1] = lerp(mouseS[1], mouse[1], 0.06);
    energy = lerp(energy, 0, 0.02);
    gl.uniform2f(uni.uRes ?? null, heroCanvas.width, heroCanvas.height);
    gl.uniform2f(uni.uTexRes ?? null, texSize[0], texSize[1]);
    gl.uniform2f(uni.uMouse ?? null, mouseS[0], mouseS[1]);
    gl.uniform1f(uni.uTime ?? null, t);
    gl.uniform1f(uni.uScroll ?? null, clamp(scrollY / innerHeight, 0, 1));
    gl.uniform1f(uni.uEnergy ?? null, energy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- ledger ticker ---------- */
  const tickerTrack = document.getElementById("tickerTrack");
  if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

  /* ---------- QR poster ---------- */
  const posterQr = document.getElementById("posterQr");
  if (posterQr) {
    let alive = true;
    cleanups.push(() => { alive = false; });
    fetch("/showcase/qr-join.svg")
      .then((r) => r.text())
      .then((svg) => { if (alive) posterQr.innerHTML = svg; })
      .catch(() => {});
  }

  /* ---------- HUD stamp card (story) ---------- */
  const hud = document.getElementById("hud");
  const hudGrid = document.getElementById("hudGrid");
  const hudCount = document.getElementById("hudCount");
  let hudStamps: HTMLElement[] = [];
  let hudN = 0;
  if (hudGrid) {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "hud-stamp";
      hudGrid.appendChild(s);
    }
    hudStamps = [...hudGrid.children] as HTMLElement[];
  }
  function setHud(n: number) {
    if (!hudGrid || !hud || !hudCount) return;
    n = clamp(n, 0, 10);
    if (n === hudN) return;
    hudN = n;
    hudStamps.forEach((s, i) => s.classList.toggle("on", i < n));
    hudCount.textContent = `${n} of 10`;
    hud.classList.toggle("complete", n === 10);
  }

  /* ---------- phone join demo ---------- */
  const phoneScreen = document.getElementById("phoneScreen");
  const joinPhone = document.getElementById("joinPhone");
  if (phoneScreen && joinPhone) {
    const brandRow = `<div class="ps-brand"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" stroke-width="10"/><circle cx="48" cy="48" r="12" fill="#E0684B"/></svg><span>Corner Coffee</span></div>`;
    phoneScreen.innerHTML = `
      <div class="ps ps-join">${brandRow}
        <h4>Your card at Corner Coffee</h4>
        <p>Enter your phone number to join.</p>
        <div class="ps-input"><span class="typed"></span><span class="caret"></span></div>
        <div class="ps-btn">Send code</div>
      </div>
      <div class="ps ps-code">${brandRow}
        <h4>Enter the code</h4>
        <p>We sent six digits to +60 12 345 6701.</p>
        <div class="ps-otp"><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="ps-btn">Verify</div>
      </div>
      <div class="ps ps-cardview">${brandRow}
        <h4>Welcome, Aisyah</h4>
        <div class="ps-card">
          <div class="ps-card-head"><b>Coffee Card</b><span>SS2 OUTLET</span></div>
          <div class="ps-grid">${'<span class="ps-stamp"></span>'.repeat(10)}</div>
        </div>
        <p class="ps-note">1 of 10 · the 10th coffee is free</p>
        <div class="ps-btn">Show my code</div>
      </div>`;

    const psJoin = phoneScreen.querySelector<HTMLElement>(".ps-join");
    const psCode = phoneScreen.querySelector<HTMLElement>(".ps-code");
    const psCard = phoneScreen.querySelector<HTMLElement>(".ps-cardview");
    const typedEl = psJoin?.querySelector<HTMLElement>(".typed");
    const otpEls = [...(psCode?.querySelectorAll<HTMLElement>(".ps-otp span") ?? [])];
    const firstStamp = psCard?.querySelector<HTMLElement>(".ps-stamp");

    if (psJoin && psCode && psCard && typedEl && firstStamp) {
      let demoTimers: Array<ReturnType<typeof setTimeout>> = [];
      const later = (fn: () => void, ms: number) => demoTimers.push(setTimeout(fn, ms));
      const clearDemo = () => { demoTimers.forEach(clearTimeout); demoTimers = []; };
      cleanups.push(clearDemo);

      const showScreen = (el: HTMLElement) => {
        [psJoin, psCode, psCard].forEach((s) => {
          if (s === el) { s.classList.remove("exit"); s.classList.add("active"); }
          else if (s.classList.contains("active")) { s.classList.remove("active"); s.classList.add("exit"); }
          else s.classList.remove("exit");
        });
      };
      const runDemo = () => {
        clearDemo();
        typedEl.textContent = "";
        otpEls.forEach((o) => { o.textContent = ""; });
        firstStamp.classList.remove("on", "pop");
        showScreen(psJoin);
        const number = "+60 12 345 6701";
        if (reduceMotion) {
          typedEl.textContent = number;
          later(() => {
            showScreen(psCard);
            firstStamp.classList.add("on");
            later(runDemo, 4000);
          }, 1500);
          return;
        }
        number.split("").forEach((ch, i) => later(() => { typedEl.textContent += ch; }, 500 + i * 55));
        later(() => showScreen(psCode), 2100);
        "888888".split("").forEach((d, i) => later(() => {
          const cell = otpEls[i];
          if (cell) cell.textContent = d;
        }, 2700 + i * 130));
        later(() => showScreen(psCard), 4100);
        later(() => firstStamp.classList.add("on", "pop"), 4750);
        later(runDemo, 8600);
      };
      let demoRunning = false;
      observeFirst(joinPhone, (e) => {
        if (e.isIntersecting && !demoRunning) { demoRunning = true; runDemo(); }
        else if (!e.isIntersecting && demoRunning) { demoRunning = false; clearDemo(); }
      }, { threshold: 0.35 });
    }
  }

  /* ---------- the ritual scene (story) ---------- */
  const bcGrid = document.getElementById("bcGrid");
  const ritual = document.getElementById("ritual");
  let bcStamps: HTMLElement[] = [];
  let ledgerRows: HTMLElement[] = [];
  let ritualPhotos: HTMLElement[] = [];
  let ritualRows = -1;
  let bcCount: HTMLElement | null = null;
  let ledgerTotal: HTMLElement | null = null;
  const amounts = [8.5, 4, 9, 4, 5.5, 8.5, 4, 10];
  if (bcGrid) {
    const stampSVG = `<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="#E0684B" stroke-width="11"/><circle cx="48" cy="48" r="13" fill="#E0684B"/></svg>`;
    for (let i = 0; i < 10; i++) {
      const c = document.createElement("div");
      c.className = "bc-stamp";
      c.innerHTML = stampSVG;
      bcGrid.appendChild(c);
    }
    bcStamps = [...bcGrid.children] as HTMLElement[];
    bcCount = document.getElementById("bcCount");
    ledgerRows = [...root.querySelectorAll<HTMLElement>(".ledger-row")];
    ledgerTotal = document.getElementById("ledgerTotal");
    ritualPhotos = [...root.querySelectorAll<HTMLElement>(".ritual-photo")];
  }
  function setRitual(p: number) {
    if (!bcGrid || !bcCount || !ledgerTotal) return;
    const rows = Math.floor(clamp((p - 0.05) / 0.83, 0, 1) * 8.999);
    if (rows === ritualRows) return;
    ritualRows = rows;
    ledgerRows.forEach((r, i) => {
      r.classList.toggle("done", i < rows);
      r.classList.toggle("mvis", !mqSmall.matches || (i >= rows - 3 && i <= rows));
    });
    bcStamps.forEach((s, i) => s.classList.toggle("on", i < rows + 1));
    bcCount.textContent = `${rows + 1} of 10`;
    const total = amounts.slice(0, rows).reduce((a, b) => a + b, 0);
    ledgerTotal.textContent = `RM ${total.toFixed(2)} recorded · ${rows + 1} visit${rows ? "s" : ""}`;
    const photoIdx = Math.min(3, Math.floor(rows / 2.3));
    ritualPhotos.forEach((ph, i) => ph.classList.toggle("show", i === photoIdx));
    const newest = bcStamps[rows];
    if (newest && !newest.classList.contains("pop")) {
      bcStamps.forEach((c) => c.classList.remove("pop"));
      if (rows > 0) newest.classList.add("pop");
    }
  }
  function ritualDrift(p: number) {
    if (!bcGrid || reduceMotion) return;
    const active = ritualPhotos.find((ph) => ph.classList.contains("show"));
    if (!active) return;
    active.style.transform = `scale(${1.12 - p * 0.08}) translateY(${p * -30}px)`;
  }

  /* ---------- the reward (story) ---------- */
  const reward = document.getElementById("reward");
  const rewardTitle = document.getElementById("rewardTitle");
  const inkCv = document.getElementById("rewardInk") as HTMLCanvasElement | null;
  const inkCtx = inkCv?.getContext("2d") ?? null;
  let burstParts: BurstPart[] = [];
  let burstStart = 0;
  let bursting = false;

  function burst() {
    if (reduceMotion || !inkCv) return;
    const r = inkCv.getBoundingClientRect();
    inkCv.width = r.width;
    inkCv.height = r.height;
    burstParts = [];
    const cx = r.width * 0.5;
    const cy = r.height * 0.34;
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 3 + Math.random() * 11;
      const lobes: BurstLobe[] = [];
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        lobes.push({ dx: (Math.random() - 0.5) * 1.6, dy: (Math.random() - 0.5) * 1.6, rr: 0.45 + Math.random() * 0.75 });
      }
      burstParts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * v * (1 + Math.random() * 0.8),
        vy: Math.sin(a) * v * 0.8 - 4,
        r: 3 + Math.random() * 13,
        o: 0.55 + Math.random() * 0.45,
        spin: (Math.random() - 0.5) * 0.1,
        ang: Math.random() * 7,
        lobes,
      });
    }
    burstStart = performance.now();
    bursting = true;
  }
  function drawBurst(now: number) {
    if (!bursting || !inkCtx || !inkCv) return;
    // rAF timestamps can lag performance.now() from the same frame
    const t = Math.max(0, (now - burstStart) / 1000);
    inkCtx.clearRect(0, 0, inkCv.width, inkCv.height);
    if (t > 2.6) { bursting = false; return; }
    const fade = clamp(1 - t / 2.6, 0, 1);
    const cx = inkCv.width * 0.5;
    const cy = inkCv.height * 0.34;
    inkCtx.strokeStyle = "#F6F1E3";
    inkCtx.globalAlpha = clamp(0.5 - t * 0.5, 0, 1);
    inkCtx.lineWidth = Math.max(1, 26 - t * 40);
    inkCtx.beginPath();
    inkCtx.arc(cx, cy, t * 900, 0, 7);
    inkCtx.stroke();
    inkCtx.fillStyle = "#F6F1E3";
    for (const p of burstParts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vx *= 0.984; p.vy *= 0.99; p.ang += p.spin;
      inkCtx.globalAlpha = p.o * fade * 0.85;
      for (const l of p.lobes) {
        const lx = p.x + (Math.cos(p.ang) * l.dx - Math.sin(p.ang) * l.dy) * p.r;
        const ly = p.y + (Math.sin(p.ang) * l.dx + Math.cos(p.ang) * l.dy) * p.r;
        inkCtx.beginPath();
        inkCtx.arc(lx, ly, l.rr * p.r, 0, 7);
        inkCtx.fill();
      }
    }
    inkCtx.globalAlpha = 1;
  }
  function kineticReward() {
    if (!reward || !rewardTitle) return;
    const r = reward.getBoundingClientRect();
    const p = clamp((innerHeight - r.top) / (innerHeight * 1.15), 0, 1);
    rewardTitle.style.fontVariationSettings = `'opsz' 144, 'wght' ${Math.round(lerp(300, 640, p))}`;
  }
  if (reward) {
    const redeemedStamp = document.getElementById("redeemedStamp");
    const couponMetaSpan = root.querySelector<HTMLElement>(".coupon-meta span:last-child");
    let rewardSeen = false;
    const startCountdown = () => {
      let secs = 15 * 60;
      const t = setInterval(() => {
        secs--;
        if (secs <= 0) { clearInterval(t); return; }
        if (couponMetaSpan) {
          couponMetaSpan.textContent = `Expires in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
        }
      }, 1000);
      cleanups.push(() => clearInterval(t));
    };
    observeFirst(reward, (e) => {
      if (e.isIntersecting && !rewardSeen) {
        rewardSeen = true;
        burst();
        startCountdown();
        if (redeemedStamp) timer(setTimeout(() => redeemedStamp.classList.add("stamped"), reduceMotion ? 0 : 1600));
      }
    }, { threshold: 0.4 });
  }

  /* ---------- merchant dashboard (landing) ---------- */
  const dash = document.getElementById("dash");
  if (dash) {
    let counted = false;
    observeFirst(dash, (e) => {
      if (e.isIntersecting && !counted) {
        counted = true;
        dash.classList.add("in");
        root.querySelectorAll<HTMLElement>(".tile-num").forEach((el) => {
          const target = Number(el.dataset.count ?? 0);
          const prefix = el.dataset.prefix ?? "";
          const suffix = el.dataset.suffix ?? "";
          if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
          const t0 = performance.now();
          const dur = 1200;
          const tick = (now: number) => {
            const p = clamp((now - t0) / dur, 0, 1);
            el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }
    }, { threshold: 0.3 });

    const feedPool = [
      "Hafiz · stamp 7 of 10 · RM 6.00 · SS2 outlet",
      "Chen · joined from the till poster · SS2 outlet",
      "Aina · stamp 2 of 10 · RM 11.50 · Damansara outlet",
      "Kumar · stamp 5 of 10 · RM 9.00 · SS2 outlet",
      "Mei Lin · reward confirmed · white coffee · SS2 outlet",
      "Danish · stamp 1 of 10 · RM 4.50 · Damansara outlet",
    ];
    let feedIdx = 0;
    let feedTimer: ReturnType<typeof setInterval> | null = null;
    const dashFeed = root.querySelector<HTMLElement>(".dash-feed");
    const pushFeedRow = () => {
      if (!dashFeed) return;
      const row = document.createElement("div");
      row.className = "df-row df-new";
      row.style.opacity = "1";
      row.style.transform = "none";
      row.innerHTML = `<span class="df-dot"></span>${feedPool[feedIdx % feedPool.length]}`;
      feedIdx++;
      dashFeed.insertBefore(row, dashFeed.querySelector(".df-row"));
      const rows = dashFeed.querySelectorAll(".df-row");
      rows[rows.length - 1]?.remove();
    };
    observeFirst(dash, (e) => {
      if (e.isIntersecting && !reduceMotion) {
        if (!feedTimer) feedTimer = setInterval(pushFeedRow, 2600);
      } else if (feedTimer) { clearInterval(feedTimer); feedTimer = null; }
    }, { threshold: 0.25 });
    cleanups.push(() => { if (feedTimer) clearInterval(feedTimer); });
  }

  /* ---------- roadmap stop reveals ---------- */
  const rlRows = [...root.querySelectorAll<HTMLElement>(".rl-row, .rl-stop")];
  if (rlRows.length) {
    rlRows.forEach((row, i) => { row.style.transitionDelay = `${(i % 6) * 70}ms`; });
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }
    }, { threshold: 0.25 });
    observe(io, rlRows);
  }

  /* ---------- roadmap hover previews ---------- */
  const rlTimeline = document.getElementById("rlTimeline");
  const rlPreview = document.getElementById("rlPreview");
  if (rlTimeline && rlPreview) {
    const previewCard = rlPreview.querySelector<HTMLElement>(".rl-preview-card");

    if (matchMedia("(pointer: coarse)").matches) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.querySelector(".rl-illus")?.classList.add("play");
            io.unobserve(e.target);
          }
        }
      }, { threshold: 0.5 });
      observe(io, [...rlTimeline.querySelectorAll(".rl-stop")]);
    }

    if (finePointer && previewCard) {
      let curStop: HTMLElement | null = null;
      let active = false;
      let raf = 0;
      let tx = 0, ty = 0, px = 0, py = 0;
      const OFF = 22;

      const dims = () => {
        const r = previewCard.getBoundingClientRect();
        return { w: r.width || 320, h: r.height || 236 };
      };
      const target = (cx: number, cy: number) => {
        const { w, h } = dims();
        let x = cx + OFF;
        let y = cy + OFF;
        if (x + w > innerWidth - 10) x = cx - OFF - w;   // flip left near the right edge
        if (y + h > innerHeight - 10) y = cy - OFF - h;  // flip above near the bottom
        tx = clamp(x, 10, Math.max(10, innerWidth - w - 10));
        ty = clamp(y, 10, Math.max(10, innerHeight - h - 10));
      };
      const fill = (stop: HTMLElement) => {
        const il = stop.querySelector(".rl-illus");
        if (!il) return;
        previewCard.innerHTML = "";
        const clone = il.cloneNode(true) as HTMLElement;
        clone.classList.remove("play");
        previewCard.appendChild(clone);
        rlPreview.classList.toggle("playing", !reduceMotion);
      };
      const follow = () => {
        px = lerp(px, tx, 0.2);
        py = lerp(py, ty, 0.2);
        rlPreview.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        if (active) raf = requestAnimationFrame(follow);
      };
      const show = (stop: HTMLElement, cx: number, cy: number) => {
        curStop = stop;
        fill(stop);
        if (reduceMotion) {
          const { w } = dims();
          tx = innerWidth - w - 24; ty = 100; px = tx; py = ty;
          rlPreview.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          rlPreview.classList.add("show");
          return;
        }
        target(cx, cy);
        px = tx; py = ty; // appear at the cursor, not sliding in from a corner
        rlPreview.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        rlPreview.classList.add("show");
        if (!active) { active = true; raf = requestAnimationFrame(follow); }
      };
      const hide = () => {
        active = false;
        curStop = null;
        cancelAnimationFrame(raf);
        rlPreview.classList.remove("show", "playing");
        timer(setTimeout(() => { if (!active) previewCard.innerHTML = ""; }, 260));
      };
      cleanups.push(() => cancelAnimationFrame(raf));

      on(rlTimeline, "pointermove", ((e: PointerEvent) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        const stop = (e.target as HTMLElement).closest<HTMLElement>(".rl-stop");
        if (!stop) return; // hovering the gap keeps the last preview
        if (stop !== curStop) show(stop, e.clientX, e.clientY);
        else if (!reduceMotion) target(e.clientX, e.clientY);
      }) as EventListener);
      on(rlTimeline, "pointerleave", hide as EventListener);
      on(window, "scroll", (() => { if (curStop) hide(); }) as EventListener, { passive: true });
    }
  }

  /* ---------- ink stamps on click ---------- */
  const inkCanvas = document.getElementById("inkCanvas") as HTMLCanvasElement | null;
  const ictx = inkCanvas?.getContext("2d") ?? null;
  const stamps: InkStamp[] = [];
  const cursorDot = document.getElementById("cursorDot");

  function sizeInk() {
    if (!inkCanvas) return;
    inkCanvas.width = innerWidth * devicePixelRatio;
    inkCanvas.height = innerHeight * devicePixelRatio;
    inkCanvas.style.width = `${innerWidth}px`;
    inkCanvas.style.height = `${innerHeight}px`;
  }
  sizeInk();

  function drawStamp(s: InkStamp, age: number) {
    if (!ictx) return;
    const sy = s.y - scrollY;
    if (sy < -80 || sy > innerHeight + 80) return;
    const d = devicePixelRatio;
    ictx.save();
    ictx.translate(s.x * d, sy * d);
    ictx.rotate(s.rot);
    const pop = age < 0.3 ? 1 + (0.3 - age) * 1.4 : 1;
    ictx.scale(pop * d, pop * d);
    ictx.globalAlpha = clamp(age * 6, 0, 0.82);
    ictx.strokeStyle = "#E0684B";
    ictx.fillStyle = "#E0684B";
    ictx.lineWidth = s.size * 0.18;
    ictx.beginPath();
    ictx.arc(0, 0, s.size * 0.68, s.seed, s.seed + Math.PI * 1.86);
    ictx.stroke();
    ictx.beginPath();
    ictx.arc(0, 0, s.size * 0.26, 0, 7);
    ictx.fill();
    ictx.restore();
  }
  function drawInks(now: number) {
    if (!ictx || !inkCanvas) return;
    ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    for (const s of stamps) drawStamp(s, (now - s.t) / 1000);
  }
  if (ictx) {
    on(window, "pointerdown", ((e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("a, button, input, .btn, .chip-cta, .topnav")) return;
      if (!el.closest(".sc-root")) return; // only stamp our own surface
      stamps.push({
        x: e.clientX,
        y: e.clientY + scrollY,
        rot: (Math.random() - 0.5) * 0.5,
        size: 22 + Math.random() * 10,
        seed: Math.random() * Math.PI * 2,
        t: performance.now(),
      });
      if (stamps.length > 60) stamps.shift();
      if (cursorDot) {
        cursorDot.classList.add("press");
        timer(setTimeout(() => cursorDot.classList.remove("press"), 180));
      }
    }) as EventListener);
  }

  /* ---------- cursor ---------- */
  let cx = -100, cy = -100, cxs = -100, cys = -100;
  if (finePointer && !reduceMotion && cursorDot) {
    root.classList.add("has-cursor");
    on(window, "pointermove", ((e: PointerEvent) => { cx = e.clientX; cy = e.clientY; }) as EventListener);
  }

  /* ---------- topbar theme + hide ---------- */
  const topbar = document.getElementById("topbar");
  const themedSections = [...root.querySelectorAll<HTMLElement>("[data-theme]")];
  let lastY = 0;
  function themeTopbar() {
    if (!topbar) return;
    const probe = 44;
    let theme = "dark";
    for (const sec of themedSections) {
      const r = sec.getBoundingClientRect();
      if (r.top < probe && r.bottom > probe) { theme = sec.dataset.theme ?? "dark"; break; }
    }
    topbar.classList.toggle("t-light", theme === "light");
    topbar.classList.toggle("t-coral", theme === "coral");
    topbar.classList.toggle("scrolled", scrollY > 90);
    const goingDown = scrollY > lastY + 2;
    const goingUp = scrollY < lastY - 2;
    if (scrollY > innerHeight * 0.9 && goingDown) topbar.classList.add("hide");
    else if (goingUp || scrollY <= innerHeight * 0.9) topbar.classList.remove("hide");
    lastY = scrollY;
  }

  /* ---------- parallax ---------- */
  const parallaxEls = [...root.querySelectorAll<HTMLElement>("[data-parallax]")].map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax ?? "0"),
    top: 0,
  }));
  function measureParallax() {
    for (const p of parallaxEls) {
      const r = p.el.getBoundingClientRect();
      p.top = r.top + scrollY + r.height / 2;
    }
  }
  measureParallax();
  on(window, "load", measureParallax);
  timer(setTimeout(measureParallax, 400));
  function runParallax() {
    if (reduceMotion) return;
    const mid = scrollY + innerHeight / 2;
    for (const p of parallaxEls) {
      const d = clamp((mid - p.top) * p.speed, -44, 44);
      p.el.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`;
    }
  }

  /* ---------- master frame loop ---------- */
  const joinSection = document.getElementById("visit-1");
  let frameErrLogged = false;
  let masterRaf = 0;

  function frameBody(now: number) {
    const t = now / 1000;
    if (heroVisible && !reduceMotion) drawHero(t);
    else if (heroVisible && reduceMotion && glReady) drawHero(0);

    let p = 0;
    if (ritual) {
      const rTop = ritual.offsetTop;
      const rH = ritual.offsetHeight - innerHeight;
      p = clamp((scrollY - rTop) / rH, 0, 1);
      setRitual(p);
      ritualDrift(p);
    }

    if (hudGrid && hud) {
      const showHud = scrollY > innerHeight * 0.55 && !(mqSmall.matches && p > 0 && p < 1);
      hud.classList.toggle("show", showHud);
      let n = 0;
      if (joinSection && scrollY + innerHeight * 0.5 > joinSection.offsetTop) n = 1;
      if (p > 0.05) n = 1 + Math.min(8, ritualRows);
      if (reward && scrollY + innerHeight * 0.5 > reward.offsetTop) n = 10;
      setHud(n);
    }

    themeTopbar();
    runParallax();
    kineticReward();
    drawBurst(now);
    drawInks(now);

    if (finePointer && !reduceMotion && cursorDot) {
      cxs = lerp(cxs, cx, 0.3);
      cys = lerp(cys, cy, 0.3);
      cursorDot.style.left = `${cxs}px`;
      cursorDot.style.top = `${cys}px`;
    }
  }
  function frame(now: number) {
    try { frameBody(now); } catch (err) {
      if (!frameErrLogged) { frameErrLogged = true; console.error("frame loop error:", err); }
    }
    masterRaf = requestAnimationFrame(frame);
  }
  masterRaf = requestAnimationFrame(frame);
  cleanups.push(() => cancelAnimationFrame(masterRaf));

  on(window, "resize", () => {
    sizeHero();
    sizeInk();
    measureParallax();
    if (glReady) drawHero(performance.now() / 1000);
  });

  return () => cleanups.forEach((fn) => fn());
}
