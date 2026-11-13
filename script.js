/* THE WRONG NAME — edit the creator's name here */
const CREATOR_NAME = "Amir";

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = ms => new Promise(r => setTimeout(r, reduced ? ms * 0.6 : ms));
const reflow = el => void el.offsetWidth;

/* ---------- Falling green leaves (canvas) ---------- */
const cv = $('#leaves'), cx = cv.getContext('2d');
const leaf = new Path2D('M0,-1 C.75,-.55 .8,.35 0,1 C-.8,.35 -.75,-.55 0,-1Z');
let W, H, DPR, leaves = [], last = 0, running = true;
function mkLeaf(top) {
  const h = 85 + Math.random() * 70;               // green hues only
  const l = 20 + Math.random() * 24;
  return { x: Math.random() * W, y: top ? -40 - Math.random() * 60 : Math.random() * H,
    s: 9 + Math.random() * 17, vy: (0.3 + Math.random() * 0.8) * (reduced ? .45 : 1),
    sw: 0.4 + Math.random() * 1.1, ph: Math.random() * 6.28, fs: 0.6 + Math.random() * 1.2,
    r: Math.random() * 6.28, rs: (Math.random() - .5) * .02 * (reduced ? .3 : 1),
    a: 0.35 + Math.random() * 0.5, c: `hsl(${h} ${45 + Math.random() * 25}% ${l}%)`,
    v: `hsl(${h} 50% ${l + 18}%)`, drift: 0.1 + Math.random() * 0.25 };
}
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const n = reduced ? 14 : Math.min(46, Math.max(18, Math.round(W / 34)));
  leaves = Array.from({ length: n }, () => mkLeaf(false));
}
function frame(t) {
  if (!running) return;
  const dt = Math.min((t - last) / 16.7 || 1, 3); last = t; const sec = t / 1000;
  cx.clearRect(0, 0, W, H);
  for (const p of leaves) {
    p.y += p.vy * dt; p.r += p.rs * dt;
    p.x += (Math.sin(sec * 0.5 + p.ph) * p.sw * 0.5 + p.drift) * dt;
    if (p.y > H + 40 || p.x > W + 40) Object.assign(p, mkLeaf(true));
    const flip = reduced ? 1 : Math.cos(sec * p.fs + p.ph);
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r + Math.sin(sec * .7 + p.ph) * .5);
    cx.scale(p.s * .55 * (.25 + Math.abs(flip) * .75), p.s); cx.globalAlpha = p.a;
    cx.fillStyle = p.c; cx.fill(leaf);
    cx.strokeStyle = p.v; cx.lineWidth = .07; cx.beginPath(); cx.moveTo(0, -.9); cx.lineTo(0, .9); cx.stroke();
    cx.restore();
  }
  requestAnimationFrame(frame);
}
addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(frame); });
resize(); requestAnimationFrame(frame);

/* ---------- Ambient sound (generated, starts only after a click) ---------- */
let ac, master, soundOn = false;
const soundBtn = $('#sound');
function initAudio() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
  [[110, 'triangle', .3], [164.8, 'sine', .18], [220.4, 'sine', .1], [329.6, 'sine', .04]].forEach(([f, ty, g]) => {
    const o = ac.createOscillator(), n = ac.createGain(); o.type = ty; o.frequency.value = f; n.gain.value = g;
    o.connect(n); n.connect(lp); o.start();
  });
  const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .07; lg.gain.value = 220;
  lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  lp.connect(master); master.connect(ac.destination);
}
function setSound(v) {
  try { if (!ac) initAudio(); ac.resume(); master.gain.setTargetAtTime(v ? .2 : 0, ac.currentTime, .9); } catch (e) { v = false; }
  soundOn = v; soundBtn.textContent = v ? 'sound on' : 'sound off'; soundBtn.setAttribute('aria-pressed', v);
}
function chime() {
  if (!soundOn) return;
  const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 880;
  g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.08, ac.currentTime + .05);
  g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + 2.2); o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + 2.3);
}
soundBtn.onclick = () => setSound(!soundOn);

/* ---------- Helpers ---------- */
function el(tag, cls, parent, text) {
  const e = document.createElement(tag); e.className = cls || ''; if (text) e.textContent = text;
  if (parent) parent.appendChild(e); return e;
}
async function say(parent, text, cls = '', hold = 2200) {
  const e = el('p', 'line ' + cls, parent, text); reflow(e); e.classList.add('show'); await wait(hold); return e;
}
async function type(e, text, speed = 45) {
  e.classList.add('typing', 'show');
  for (const ch of text) { e.textContent += ch; await wait(speed + (/[,.?…]/.test(ch) ? speed * 5 : 0)); }
  e.classList.remove('typing');
}
function button(parent, label, cls, fn) {
  const b = el('button', 'btn ' + (cls || ''), parent, label); b.type = 'button';
  reflow(b); b.classList.add('show'); b.addEventListener('click', () => { b.disabled = true; fn(b); }, { once: true });
  return b;
}
const N = 7, prog = $('#progress');
for (let i = 0; i < N; i++) el('i', '', prog);
function setProgress(n) { [...prog.children].forEach((d, i) => d.classList.toggle('on', i < n)); }

let cur = null;
async function go(n) {
  if (cur) { cur.classList.remove('on'); await wait(1500); }
  cur = $('#s' + n); const box = $('.box', cur); box.innerHTML = ''; box.classList.remove('fade');
  cur.classList.add('on'); setProgress(n); await wait(600); await scenes[n](box);
}

/* ---------- Scene 1: the wrong name ---------- */
async function s1(b) {
  const h = el('h1', 'name', b), f = el('p', 'fix', b);
  h.setAttribute('aria-label', 'ilham');
  await wait(2500);
  [...'ilham'].forEach((c, i) => { const s = el('span', '', h, c); s.style.transitionDelay = i * .18 + 's'; });
  h.classList.add('show'); reflow(h); [...h.children].forEach(s => s.classList.add('in'));
  await wait(3700);                                   // ~2s fully visible
  [...h.children].forEach((s, i) => { s.style.transitionDelay = i * .12 + 's'; s.classList.add('out'); });
  await wait(1500); h.remove();
  await type(f, 'bs7 kayn ghalta, ilhem mashi ilham', 75);
  f.innerHTML = 'bs7 kayn ghalta, ilhem mashi <s>ilham</s>';
  await wait(3000); f.classList.remove('show'); await wait(1500); f.remove();
  const n = el('h1', 'name', b, 'ilhem'); reflow(n); n.classList.add('show', 'sweep');
  await wait(4600); go(2);
}

/* ---------- Scene 2: the first message ---------- */
async function s2(b) {
  for (const t of ['Well... now that we\u2019ve got the name right.', 'Maybe it\u2019s time to tell you why you\u2019re here.', 'Some things are easier to create than to say.']) {
    await type(el('p', 'line', b), t, 48); await wait(1200);
  }
  button(b, 'Discover', '', () => go(3));
}

/* ---------- Scene 3: something about you ---------- */
async function s3(b) {
  for (const t of ['I had something to say.', 'But I never really knew how.', 'So I thought I\u2019d leave it here.']) await say(b, t, '', 2600);
  await wait(900); await say(b, 'Some people become a thought you never quite finish.', 'big', 4200);
  await wait(1200); go(4);
}

/* ---------- Scene 4: the constellation ---------- */
const STARS = [
  { x: 22, y: 60, k: 'A thought', t: 'Funny how someone can become part of your ordinary days without even trying.' },
  { x: 50, y: 34, k: 'A moment', t: 'Maybe the smallest conversations leave the longest echoes.' },
  { x: 78, y: 56, k: 'A question', t: 'Have you ever wondered if someone remembers the little things about you?' }];
async function s4(b) {
  b.innerHTML = `<div class="sky"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${STARS.map(s => s.x + ',' + s.y).join(' ')}"/></svg></div>
  <div class="ov" role="dialog" aria-modal="true"><div class="card"><small></small><p></p><button class="btn show" type="button">Close</button></div></div><div class="cta"></div>`;
  const sky = $('.sky', b), ov = $('.ov', b), cta = $('.cta', b), seen = new Set();
  for (let i = 0; i < 80; i++) { const d = el('span', 'dot', sky); d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * 4}s;opacity:${.3 + Math.random() * .6}`; }
  const line = $('polyline', sky), L = 400; line.style.cssText = `stroke-dasharray:${L};stroke-dashoffset:${L};transition:stroke-dashoffset 4s ease`; reflow(line); line.style.strokeDashoffset = 0;
  const close = () => { ov.classList.remove('on'); last && last.focus(); if (seen.size === 3 && !cta.children.length) setTimeout(() => button(cta, 'Continue', '', () => go(5)), 900); };
  let last;
  STARS.forEach((s, i) => {
    const st = el('button', 'star', sky); st.type = 'button'; st.style.cssText = `left:${s.x}%;top:${s.y}%`; st.setAttribute('aria-label', s.k);
    st.onclick = () => { last = st; seen.add(i); st.classList.add('seen'); chime(); $('small', ov).textContent = s.k; $('p', ov).textContent = s.t; ov.classList.add('on'); $('.btn', ov).focus(); };
  });
  $('.btn', ov).onclick = close;
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && ov.classList.contains('on')) close(); });
  await wait(1500); el('p', 'line small hint', b, 'touch a star').classList.add('show');
}

/* ---------- Scene 5: the unsent message ---------- */
async function s5(b) {
  const t = el('div', 'term', b);
  await type(el('p', '', t), '> A message was never sent.', 40); await wait(700);
  await type(el('p', '', t), '> Would you like to read it?', 40); await wait(600);
  const row = el('div', 'row', t);
  button(row, 'OPEN MESSAGE', '', async () => {
    row.remove(); const m = el('p', 'msg', t);
    await type(m, 'There\u2019s something strangely beautiful about the way certain people make ordinary moments feel different.', 38); await wait(1400);
    await type(el('p', 'msg', t), 'I don\u2019t know if you ever noticed. Maybe that\u2019s the point.', 42); await wait(1600);
    button(el('div', 'row', t), 'Continue', '', () => go(6));
  });
  button(row, 'NOT NOW', 'ghost', () => go(6));
}

/* ---------- Scene 6: the question ---------- */
async function s6(b) {
  await say(b, 'Before you leave, there\u2019s one thing I\u2019ve always wondered...', '', 3200);
  await say(b, 'What if the person who left this message is someone you already know?', 'big', 2400);
  const box = el('div', 'choices', b), resp = el('p', 'line resp', b);
  const R = { 'Maybe I do.': 'Then perhaps you\u2019ve already felt it \u2014 that quiet sense of recognition before the name arrives.',
    'I have no idea.': 'That\u2019s alright. Not knowing is its own kind of quiet.',
    'I think I know.': 'Hold on to that thought. Keep it just a little longer.' };
  Object.keys(R).forEach(k => button(box, k, '', async () => {
    box.querySelectorAll('button').forEach(x => { x.disabled = true; x.style.opacity = x.textContent === k ? 1 : .25; });
    resp.textContent = R[k]; reflow(resp); resp.classList.add('show'); await wait(4200);
    await say(b, 'Perhaps knowing who wrote it isn\u2019t as important as knowing why.', 'big', 2600);
    button(b, 'Continue', '', () => go(7));
  }));
  box.querySelectorAll('button').forEach(x => x.addEventListener('click', e => e.stopPropagation()));
}

/* ---------- Scene 7: the final reveal ---------- */
async function s7(b) {
  document.body.classList.add('dark'); await wait(3500);
  await say(b, 'Somewhere, between hello and goodbye...', '', 3400);
  await say(b, 'there was something I never quite managed to explain.', '', 4200);
  await wait(2200);
  await say(b, 'Maybe this was never meant to be an answer.', '', 3400);
  await say(b, 'Maybe it was just meant to make you wonder.', '', 4600);
  await wait(1500);
  await say(b, 'Made by someone who wanted to leave a little something behind.', '', 3400);
  await say(b, '\u2014 ' + CREATOR_NAME, 'sig', 4200);
  await wait(1200); await say(b, 'Goodnight, Ilhem.', 'big', 3000);
  await say(b, 'END OF TRANSMISSION \u00b7 001', 'label', 5000);
  b.classList.add('fade'); const star = el('div', 'endstar', document.body); reflow(star); star.classList.add('on');
  await wait(6500);
  const r = button(document.body, 'Replay', 'replay', () => {
    r.remove(); star.classList.remove('on'); document.body.classList.remove('dark'); setTimeout(() => star.remove(), 1500); go(1);
  });
}
const scenes = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7 };

/* ---------- Start (audio only after a click) ---------- */
function begin(sound) {
  setSound(sound); document.body.classList.add('lit');
  const g = $('#gate'); g.classList.remove('on'); cur = g; go(1);
}
$('#beginSound').onclick = () => begin(true);
$('#beginSilent').onclick = () => begin(false);

/* ---------- Custom cursor (desktop only) ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const c = $('#cursor'); let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('on'); });
  document.addEventListener('mouseleave', () => c.classList.remove('on'));
  document.addEventListener('mouseover', e => c.classList.toggle('big', !!e.target.closest('button')));
  (function loop() { x += (tx - x) * .18; y += (ty - y) * .18; c.style.transform = `translate(${x}px,${y}px)`; requestAnimationFrame(loop); })();
}
