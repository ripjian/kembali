/* Kembali showcase · shared engine for all pages.
   Vanilla, no dependencies. Every feature initialises only when its
   elements exist on the current page. */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const mqSmall = matchMedia('(max-width: 640px)');

/* ============================== loader ============================== */
const heroTitle = document.getElementById('heroTitle');
const dismissLoader = () => {
  document.body.removeAttribute('data-loading');
  if (heroTitle) heroTitle.classList.add('in');
};
if (document.readyState === 'complete') setTimeout(dismissLoader, 300);
else addEventListener('load', () => setTimeout(dismissLoader, 300));
setTimeout(dismissLoader, 1800); // never hold the page hostage

document.querySelectorAll('.hero-title .w').forEach((w, i) => {
  w.style.transitionDelay = `${180 + i * 80}ms`;
});

/* ============================== reveals ============================== */
const staggerParents = new Set();
document.querySelectorAll('.reveal-line').forEach((el) => staggerParents.add(el.parentElement));
staggerParents.forEach((p) => {
  [...p.querySelectorAll('.reveal-line')].forEach((el, i) => {
    el.style.transitionDelay = `${i * 110}ms`;
  });
});

const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
  }
}, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal, .reveal-line, .dash, .footer, .reveal-line-group')
  .forEach((el) => revealIO.observe(el));

/* ============================== WebGL panel ============================== */
const heroCanvas = document.getElementById('heroCanvas');
const gl = heroCanvas ? heroCanvas.getContext('webgl2', { antialias: false, alpha: false }) : null;

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

let glReady = false, uni = {}, texSize = [1138, 1640];
function initGL() {
  if (!heroCanvas) return;
  if (!gl) { document.body.classList.add('no-webgl'); return; }
  const mk = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = mk(gl.VERTEX_SHADER, VERT), fs = mk(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.body.classList.add('no-webgl'); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.body.classList.add('no-webgl'); return; }
  gl.useProgram(prog);
  ['uTex','uRes','uTexRes','uMouse','uTime','uScroll','uEnergy'].forEach(n => uni[n] = gl.getUniformLocation(prog, n));

  const tex = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 30, 24]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const img = new Image();
  img.src = heroCanvas.dataset.tex || 'assets/hero-pull.jpg';
  img.onload = () => {
    texSize = [img.naturalWidth, img.naturalHeight];
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  };
  glReady = true;
}
initGL();

let mouse = [.5, .5], mouseS = [.5, .5], energy = 0;
addEventListener('pointermove', (e) => {
  mouse = [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
  energy = Math.min(1, energy + 0.08);
});

let heroVisible = !!heroCanvas;
const heroSection = document.getElementById('hero');
if (heroSection) {
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 })
    .observe(heroSection);
}

function sizeHero() {
  if (!heroCanvas) return;
  const dpr = Math.min(devicePixelRatio, 1.5);
  heroCanvas.width = Math.round(heroCanvas.clientWidth * dpr);
  heroCanvas.height = Math.round(heroCanvas.clientHeight * dpr);
}
sizeHero();

function drawHero(t) {
  if (!glReady) return;
  if (heroCanvas.width !== Math.round(heroCanvas.clientWidth * Math.min(devicePixelRatio, 1.5))) sizeHero();
  gl.viewport(0, 0, heroCanvas.width, heroCanvas.height);
  mouseS[0] = lerp(mouseS[0], mouse[0], .06);
  mouseS[1] = lerp(mouseS[1], mouse[1], .06);
  energy = lerp(energy, 0, .02);
  gl.uniform2f(uni.uRes, heroCanvas.width, heroCanvas.height);
  gl.uniform2f(uni.uTexRes, texSize[0], texSize[1]);
  gl.uniform2f(uni.uMouse, mouseS[0], mouseS[1]);
  gl.uniform1f(uni.uTime, t);
  gl.uniform1f(uni.uScroll, clamp(scrollY / innerHeight, 0, 1));
  gl.uniform1f(uni.uEnergy, energy);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ============================== ticker loop ============================== */
const tickerTrack = document.getElementById('tickerTrack');
if (tickerTrack) tickerTrack.innerHTML += tickerTrack.innerHTML;

/* ============================== QR inject ============================== */
const posterQr = document.getElementById('posterQr');
if (posterQr) {
  fetch('assets/qr-join.svg').then(r => r.text()).then(svg => { posterQr.innerHTML = svg; }).catch(() => {});
}

/* ============================== HUD card (story page) ============================== */
const hud = document.getElementById('hud');
const hudGrid = document.getElementById('hudGrid');
const hudCount = document.getElementById('hudCount');
let hudStamps = [], hudN = 0;
if (hudGrid) {
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'hud-stamp';
    hudGrid.appendChild(s);
  }
  hudStamps = [...hudGrid.children];
}
function setHud(n) {
  if (!hudGrid) return;
  n = clamp(n, 0, 10);
  if (n === hudN) return;
  hudN = n;
  hudStamps.forEach((s, i) => s.classList.toggle('on', i < n));
  hudCount.textContent = `${n} of 10`;
  hud.classList.toggle('complete', n === 10);
}

/* ============================== phone demo ============================== */
const phoneScreen = document.getElementById('phoneScreen');
const joinPhone = document.getElementById('joinPhone');
if (phoneScreen) {
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

  const psJoin = phoneScreen.querySelector('.ps-join');
  const psCode = phoneScreen.querySelector('.ps-code');
  const psCard = phoneScreen.querySelector('.ps-cardview');
  const typedEl = psJoin.querySelector('.typed');
  const otpEls = [...psCode.querySelectorAll('.ps-otp span')];
  const firstStamp = psCard.querySelector('.ps-stamp');

  let demoTimers = [];
  const later = (fn, ms) => demoTimers.push(setTimeout(fn, ms));
  const clearDemo = () => { demoTimers.forEach(clearTimeout); demoTimers = []; };

  const showScreen = (el) => {
    [psJoin, psCode, psCard].forEach(s => {
      if (s === el) { s.classList.remove('exit'); s.classList.add('active'); }
      else if (s.classList.contains('active')) { s.classList.remove('active'); s.classList.add('exit'); }
      else s.classList.remove('exit');
    });
  };
  const runDemo = () => {
    clearDemo();
    typedEl.textContent = '';
    otpEls.forEach(o => o.textContent = '');
    firstStamp.classList.remove('on', 'pop');
    showScreen(psJoin);
    const number = '+60 12 345 6701';
    if (reduceMotion) {
      typedEl.textContent = number;
      later(() => { showScreen(psCard); firstStamp.classList.add('on'); later(runDemo, 4000); }, 1500);
      return;
    }
    number.split('').forEach((ch, i) => later(() => typedEl.textContent += ch, 500 + i * 55));
    later(() => showScreen(psCode), 2100);
    '888888'.split('').forEach((d, i) => later(() => otpEls[i].textContent = d, 2700 + i * 130));
    later(() => showScreen(psCard), 4100);
    later(() => firstStamp.classList.add('on', 'pop'), 4750);
    later(runDemo, 8600);
  };
  let demoRunning = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !demoRunning) { demoRunning = true; runDemo(); }
    else if (!e.isIntersecting && demoRunning) { demoRunning = false; clearDemo(); }
  }, { threshold: 0.35 }).observe(joinPhone);
}

/* ============================== ritual scene (story page) ============================== */
const bcGrid = document.getElementById('bcGrid');
const ritual = document.getElementById('ritual');
let bcStamps = [], ledgerRows = [], ritualPhotos = [], ritualRows = -1;
let bcCount, ledgerTotal;
const amounts = [8.5, 4, 9, 4, 5.5, 8.5, 4, 10];
if (bcGrid) {
  const stampSVG = `<svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="#E0684B" stroke-width="11"/><circle cx="48" cy="48" r="13" fill="#E0684B"/></svg>`;
  for (let i = 0; i < 10; i++) {
    const c = document.createElement('div');
    c.className = 'bc-stamp';
    c.innerHTML = stampSVG;
    bcGrid.appendChild(c);
  }
  bcStamps = [...bcGrid.children];
  bcCount = document.getElementById('bcCount');
  ledgerRows = [...document.querySelectorAll('.ledger-row')];
  ledgerTotal = document.getElementById('ledgerTotal');
  ritualPhotos = [...document.querySelectorAll('.ritual-photo')];
}
function setRitual(p) {
  if (!bcGrid) return;
  const rows = Math.floor(clamp((p - .05) / .83, 0, 1) * 8.999);
  if (rows === ritualRows) return;
  ritualRows = rows;
  ledgerRows.forEach((r, i) => {
    r.classList.toggle('done', i < rows);
    r.classList.toggle('mvis', !mqSmall.matches || (i >= rows - 3 && i <= rows));
  });
  bcStamps.forEach((s, i) => s.classList.toggle('on', i < rows + 1));
  bcCount.textContent = `${rows + 1} of 10`;
  const total = amounts.slice(0, rows).reduce((a, b) => a + b, 0);
  ledgerTotal.textContent = `RM ${total.toFixed(2)} recorded · ${rows + 1} visit${rows ? 's' : ''}`;
  const photoIdx = Math.min(3, Math.floor(rows / 2.3));
  ritualPhotos.forEach((ph, i) => ph.classList.toggle('show', i === photoIdx));
  const newest = bcStamps[rows];
  if (newest && !newest.classList.contains('pop')) {
    bcStamps.forEach(c => c.classList.remove('pop'));
    if (rows > 0) newest.classList.add('pop');
  }
}
function ritualDrift(p) {
  if (!bcGrid || reduceMotion) return;
  const active = ritualPhotos.find(ph => ph.classList.contains('show'));
  if (!active) return;
  active.style.transform = `scale(${1.12 - p * .08}) translateY(${p * -30}px)`;
}

/* ============================== reward (story page) ============================== */
const reward = document.getElementById('reward');
const rewardTitle = document.getElementById('rewardTitle');
const inkCv = document.getElementById('rewardInk');
const inkCtx = inkCv ? inkCv.getContext('2d') : null;
let burstParts = [], burstStart = 0, bursting = false;

function burst() {
  if (reduceMotion || !inkCv) return;
  const r = inkCv.getBoundingClientRect();
  inkCv.width = r.width; inkCv.height = r.height;
  burstParts = [];
  const cx = r.width * .5, cy = r.height * .34;
  for (let i = 0; i < 46; i++) {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 11;
    const lobes = [];
    const n = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      lobes.push({ dx: (Math.random() - .5) * 1.6, dy: (Math.random() - .5) * 1.6, rr: .45 + Math.random() * .75 });
    }
    burstParts.push({
      x: cx, y: cy,
      vx: Math.cos(a) * v * (1 + Math.random() * .8),
      vy: Math.sin(a) * v * .8 - 4,
      r: 3 + Math.random() * 13,
      o: .55 + Math.random() * .45,
      spin: (Math.random() - .5) * .1,
      ang: Math.random() * 7,
      lobes,
    });
  }
  burstStart = performance.now(); bursting = true;
}
function drawBurst(now) {
  if (!bursting || !inkCtx) return;
  // rAF timestamps can lag performance.now() from the same frame
  const t = Math.max(0, (now - burstStart) / 1000);
  inkCtx.clearRect(0, 0, inkCv.width, inkCv.height);
  if (t > 2.6) { bursting = false; return; }
  const fade = clamp(1 - t / 2.6, 0, 1);
  const cx = inkCv.width * .5, cy = inkCv.height * .34;
  inkCtx.strokeStyle = '#F6F1E3';
  inkCtx.globalAlpha = clamp(.5 - t * .5, 0, 1);
  inkCtx.lineWidth = Math.max(1, 26 - t * 40);
  inkCtx.beginPath(); inkCtx.arc(cx, cy, t * 900, 0, 7); inkCtx.stroke();
  inkCtx.fillStyle = '#F6F1E3';
  for (const p of burstParts) {
    p.x += p.vx; p.y += p.vy; p.vy += .14; p.vx *= .984; p.vy *= .99; p.ang += p.spin;
    inkCtx.globalAlpha = p.o * fade * .85;
    for (const l of p.lobes) {
      const lx = p.x + (Math.cos(p.ang) * l.dx - Math.sin(p.ang) * l.dy) * p.r;
      const ly = p.y + (Math.sin(p.ang) * l.dx + Math.cos(p.ang) * l.dy) * p.r;
      inkCtx.beginPath(); inkCtx.arc(lx, ly, l.rr * p.r, 0, 7); inkCtx.fill();
    }
  }
  inkCtx.globalAlpha = 1;
}
function kineticReward() {
  if (!reward || !rewardTitle) return;
  const r = reward.getBoundingClientRect();
  const p = clamp((innerHeight - r.top) / (innerHeight * 1.15), 0, 1);
  const w = Math.round(lerp(300, 640, p));
  rewardTitle.style.fontVariationSettings = `'opsz' 144, 'wght' ${w}`;
}
if (reward) {
  const redeemedStamp = document.getElementById('redeemedStamp');
  const couponMetaSpan = document.querySelector('.coupon-meta span:last-child');
  let rewardSeen = false;
  const startCountdown = () => {
    let secs = 15 * 60;
    const t = setInterval(() => {
      secs--;
      if (secs <= 0) { clearInterval(t); return; }
      couponMetaSpan.textContent = `Expires in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    }, 1000);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !rewardSeen) {
      rewardSeen = true; burst(); startCountdown();
      if (redeemedStamp) setTimeout(() => redeemedStamp.classList.add('stamped'), reduceMotion ? 0 : 1600);
    }
  }, { threshold: 0.4 }).observe(reward);
}

/* ============================== dash counters + live feed ============================== */
const dash = document.getElementById('dash');
if (dash) {
  let counted = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !counted) {
      counted = true;
      dash.classList.add('in');
      document.querySelectorAll('.tile-num').forEach((el) => {
        const target = +el.dataset.count;
        const prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
        const t0 = performance.now(), dur = 1200;
        (function tick(now) {
          const p = clamp((now - t0) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }
  }, { threshold: 0.3 }).observe(dash);

  const feedPool = [
    'Hafiz · stamp 7 of 10 · RM 6.00 · SS2 outlet',
    'Chen · joined from the till poster · SS2 outlet',
    'Aina · stamp 2 of 10 · RM 11.50 · Damansara outlet',
    'Kumar · stamp 5 of 10 · RM 9.00 · SS2 outlet',
    'Mei Lin · reward confirmed · white coffee · SS2 outlet',
    'Danish · stamp 1 of 10 · RM 4.50 · Damansara outlet',
  ];
  let feedIdx = 0, feedTimer = null;
  const dashFeed = document.querySelector('.dash-feed');
  const pushFeedRow = () => {
    const row = document.createElement('div');
    row.className = 'df-row df-new';
    row.style.opacity = 1; row.style.transform = 'none';
    row.innerHTML = '<span class="df-dot"></span>' + feedPool[feedIdx % feedPool.length];
    feedIdx++;
    dashFeed.insertBefore(row, dashFeed.querySelector('.df-row'));
    const rows = dashFeed.querySelectorAll('.df-row');
    if (rows.length > 4) rows[rows.length - 1].remove();
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !reduceMotion) {
      if (!feedTimer) feedTimer = setInterval(pushFeedRow, 2600);
    } else { clearInterval(feedTimer); feedTimer = null; }
  }, { threshold: 0.25 }).observe(dash);
}

/* ============================== roadmap ledger rows ============================== */
const rlRows = [...document.querySelectorAll('.rl-row')];
if (rlRows.length) {
  rlRows.forEach((row, i) => { row.style.transitionDelay = `${(i % 6) * 70}ms`; });
  const rlIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); rlIO.unobserve(e.target); }
    }
  }, { threshold: 0.3 });
  rlRows.forEach((el) => rlIO.observe(el));
}

/* ============================== ink stamps on click ============================== */
const inkCanvas = document.getElementById('inkCanvas');
const ictx = inkCanvas ? inkCanvas.getContext('2d') : null;
const stamps = [];
function sizeInk() {
  if (!inkCanvas) return;
  inkCanvas.width = innerWidth * devicePixelRatio;
  inkCanvas.height = innerHeight * devicePixelRatio;
  inkCanvas.style.width = innerWidth + 'px';
  inkCanvas.style.height = innerHeight + 'px';
}
sizeInk();

function drawStamp(s, age) {
  const sy = s.y - scrollY;
  if (sy < -80 || sy > innerHeight + 80) return;
  const d = devicePixelRatio;
  ictx.save();
  ictx.translate(s.x * d, sy * d);
  ictx.rotate(s.rot);
  const pop = age < .3 ? 1 + (0.3 - age) * 1.4 : 1;
  ictx.scale(pop * d, pop * d);
  ictx.globalAlpha = clamp(age * 6, 0, 0.82);
  ictx.strokeStyle = '#E0684B';
  ictx.fillStyle = '#E0684B';
  ictx.lineWidth = s.size * .18;
  ictx.beginPath();
  ictx.arc(0, 0, s.size * .68, s.seed, s.seed + Math.PI * 1.86);
  ictx.stroke();
  ictx.beginPath();
  ictx.arc(0, 0, s.size * .26, 0, 7);
  ictx.fill();
  ictx.restore();
}
function drawInks(now) {
  if (!ictx) return;
  ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
  for (const s of stamps) drawStamp(s, (now - s.t) / 1000);
}
addEventListener('pointerdown', (e) => {
  if (!ictx) return;
  if (e.target.closest('a, button, .btn, .chip-cta, .topnav')) return;
  stamps.push({
    x: e.clientX, y: e.clientY + scrollY,
    rot: (Math.random() - .5) * .5,
    size: 22 + Math.random() * 10,
    seed: Math.random() * Math.PI * 2,
    t: performance.now(),
  });
  if (stamps.length > 60) stamps.shift();
  if (cursorDot) {
    cursorDot.classList.add('press');
    setTimeout(() => cursorDot.classList.remove('press'), 180);
  }
});

/* ============================== cursor ============================== */
const cursorDot = document.getElementById('cursorDot');
let cx = -100, cy = -100, cxs = -100, cys = -100;
if (finePointer && !reduceMotion && cursorDot) {
  document.body.classList.add('has-cursor');
  addEventListener('pointermove', (e) => { cx = e.clientX; cy = e.clientY; });
}

/* ============================== topbar theme + hide ============================== */
const topbar = document.getElementById('topbar');
const themedSections = [...document.querySelectorAll('[data-theme]')];
let lastY = 0;
function themeTopbar() {
  if (!topbar) return;
  const probe = 44;
  let theme = 'dark';
  for (const sec of themedSections) {
    const r = sec.getBoundingClientRect();
    if (r.top < probe && r.bottom > probe) { theme = sec.dataset.theme; break; }
  }
  topbar.classList.toggle('t-light', theme === 'light');
  topbar.classList.toggle('t-coral', theme === 'coral');
  topbar.classList.toggle('scrolled', scrollY > 90);
  const goingDown = scrollY > lastY + 2;
  const goingUp = scrollY < lastY - 2;
  if (scrollY > innerHeight * .9 && goingDown) topbar.classList.add('hide');
  else if (goingUp || scrollY <= innerHeight * .9) topbar.classList.remove('hide');
  lastY = scrollY;
}

/* ============================== parallax ============================== */
const parallaxEls = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
  el, speed: parseFloat(el.dataset.parallax), top: 0,
}));
function measureParallax() {
  for (const p of parallaxEls) {
    const r = p.el.getBoundingClientRect();
    p.top = r.top + scrollY + r.height / 2;
  }
}
addEventListener('load', measureParallax);
setTimeout(measureParallax, 400);
function runParallax() {
  if (reduceMotion) return;
  const mid = scrollY + innerHeight / 2;
  for (const p of parallaxEls) {
    const d = clamp((mid - p.top) * p.speed, -44, 44);
    p.el.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`;
  }
}

/* ============================== master rAF ============================== */
const joinSection = document.getElementById('visit-1');

let frameErrLogged = false;
function frame(now) {
  try { frameBody(now); } catch (err) {
    if (!frameErrLogged) { frameErrLogged = true; console.error('frame loop error:', err); }
  }
  requestAnimationFrame(frame);
}
function frameBody(now) {
  const t = now / 1000;
  if (heroVisible && !reduceMotion) drawHero(t);
  else if (heroVisible && reduceMotion && glReady) drawHero(0);

  let p = 0;
  if (ritual) {
    const rTop = ritual.offsetTop, rH = ritual.offsetHeight - innerHeight;
    p = clamp((scrollY - rTop) / rH, 0, 1);
    setRitual(p);
    ritualDrift(p);
  }

  if (hudGrid) {
    const showHud = scrollY > innerHeight * .55 && !(mqSmall.matches && p > 0 && p < 1);
    hud.classList.toggle('show', showHud);
    let n = 0;
    if (joinSection && scrollY + innerHeight * .5 > joinSection.offsetTop) n = 1;
    if (p > .05) n = 1 + Math.min(8, ritualRows);
    if (reward && scrollY + innerHeight * .5 > reward.offsetTop) n = 10;
    setHud(n);
  }

  themeTopbar();
  runParallax();
  kineticReward();
  drawBurst(now);
  drawInks(now);

  if (finePointer && !reduceMotion && cursorDot) {
    cxs = lerp(cxs, cx, .3); cys = lerp(cys, cy, .3);
    cursorDot.style.left = cxs + 'px';
    cursorDot.style.top = cys + 'px';
  }
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  sizeHero(); sizeInk(); measureParallax();
  if (glReady) drawHero(performance.now() / 1000);
});
