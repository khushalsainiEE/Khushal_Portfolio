/* ============================================================
   VHS — pull a tape from the stack, drop it in the VCR, watch it
   on the CRT. Photo tapes open in a retro picture window.

   Motion notes
   • hover: the tape slides out of the stack like pulling it from a
     shelf (neighbours shift a touch), and a preview springs out
     to its right
   • drag: the copy follows the pointer with a little lag (weight),
     tilts with horizontal speed and grows toward the slot's size
   • insert: carry → line up exactly over the slot → flap opens →
     tape slides in (ease-in) → clunk → static → picture
     The video starts loading muted the moment the tape is dropped,
     hidden behind the screen, and is unmuted from 0:00 on reveal.
   • eject: the reverse, then the tape arcs back to its place
   • TV: CRT power-on (line → full frame), power-off (frame → line → dot)
   Every transform uses the same function list (see tf) so the
   browser can interpolate between any two of them smoothly.
   ============================================================ */
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const T = (ms) => (reduced ? 1 : ms);
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN = 'cubic-bezier(0.55, 0, 0.75, 0.2)';
const EASE_IO = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SPRING = 'cubic-bezier(0.34, 1.45, 0.64, 1)';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const tf = ({ x = 0, y = 0, rx = 0, r = 0, sx = 1, sy = sx } = {}) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) perspective(600px) rotateX(${rx.toFixed(2)}deg) rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;

export function initVhs({ root, items, setThumb, ytId, openSheet, thumbFor }) {
  const stack = root.querySelector('#vhsShelf');
  const peek = root.querySelector('#vhsPeek');
  const peekImg = peek.querySelector('img');
  const peekTitle = peek.querySelector('.peek-cap b');
  const peekMeta = peek.querySelector('.peek-cap span');
  const rig = root.querySelector('#vhsRig');
  const tv = root.querySelector('#tv');
  const vcr = root.querySelector('#vcr');
  const slot = root.querySelector('#vcrSlot');
  const lcd = root.querySelector('#vcrText');
  const screen = root.querySelector('#tvScreen');
  const picture = root.querySelector('#tvPicture');
  const blue = root.querySelector('#tvBlue');
  const content = root.querySelector('#tvContent');
  const staticCv = root.querySelector('#tvStatic');
  const osd = root.querySelector('#tvOsd');
  const osdTl = root.querySelector('#osdTl');
  const osdBl = root.querySelector('#osdBl');
  const now = root.querySelector('#vhsNow');
  const nowText = root.querySelector('#vhsNowText');
  const playBtn = root.querySelector('.vcr-btn[data-vhs="play"]');

  let loaded = null;        // { i, it, el }
  let busy = false;
  let powered = false;
  let visible = false;
  let paused = false;

  /* ---------- the stack ---------- */
  const metaOf = (it) => [it.client, it.kindOf === 'photo' ? 'Still' : it.kind, it.year].filter(Boolean).join(' · ');
  const BANDS = ['#b8402e', '#2f62a8', '#d29a2c', '#3a7f55', '#6a4c93', '#2a8a8a'];
  const tapes = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'spine' + (it.kindOf === 'photo' ? ' spine--still' : '');
    // a stack is never perfectly square: tiny, fixed offsets per tape
    b.style.setProperty('--jx', `${((i * 29) % 9) - 4}px`);
    b.style.setProperty('--jr', `${(((i * 17) % 5) - 2) * 0.15}deg`);
    b.style.setProperty('--lt', `${(((i * 7) % 5) - 2) * 0.35}deg`);
    b.style.setProperty('--lx', `${((i * 11) % 5) - 2}px`);
    b.setAttribute('aria-label', `${it.title}, ${it.kindOf === 'photo' ? 'still photo' : it.kind}. Put it in the VCR.`);
    b.innerHTML = `
      <span class="spine-shell"></span>
      <span class="spine-tab"></span>
      <span class="spine-well"></span>
      <span class="spine-label" style="--band:${BANDS[i % BANDS.length]}">
        <i class="spine-band">${String(i + 1).padStart(2, '0')}</i>
        <span class="spine-title">${esc(it.title)}</span>
        ${it.kindOf === 'photo' ? '<i class="spine-stamp">STILL</i>' : ''}
      </span>
      <span class="spine-logo">VHS</span>`;
    stack.insertBefore(b, peek);
    return b;
  });

  // resolve each item's best thumbnail once, so the preview pops instantly
  const thumbUrl = new Map();
  let thumbsReady = false;
  function loadThumbs() {
    if (thumbsReady) return;
    thumbsReady = true;
    items.forEach((it) => {
      const im = new Image();
      im.decoding = 'async';
      im.addEventListener('load', () => { if (im.naturalWidth > 120) thumbUrl.set(it, im.currentSrc || im.src); });
      setThumb(im, it);
    });
  }

  /* ---------- pull-out + preview ---------- */
  let pulled = -1, peekT = 0;
  function pull(i) {
    if (pulled === i) return;
    clearPull(false);
    pulled = i;
    const el = tapes[i], it = items[i];
    el.classList.add('is-pulled');
    tapes[i - 1]?.classList.add('is-nudged', 'up');
    tapes[i + 1]?.classList.add('is-nudged', 'down');
    if (!fine) return;
    clearTimeout(peekT);
    const wasOn = peek.classList.contains('on');
    peek.style.top = `${el.offsetTop + el.offsetHeight / 2}px`;
    peek.classList.toggle('vertical', !!it.vertical);
    const src = thumbUrl.get(it);
    const setImg = () => {
      if (src) peekImg.src = src; else { peekImg.removeAttribute('src'); setThumb(peekImg, it); }
      peekImg.classList.remove('swap');
    };
    if (wasOn) { peekImg.classList.add('swap'); setTimeout(setImg, 90); } else setImg();
    peekTitle.textContent = it.title;
    peekMeta.textContent = metaOf(it);
    // a beat after the tape slides out, the picture jumps out of it
    peekT = setTimeout(() => peek.classList.add('on'), wasOn ? 0 : T(90));
  }
  function clearPull(hidePeek = true) {
    if (pulled >= 0) {
      tapes[pulled].classList.remove('is-pulled');
      tapes[pulled - 1]?.classList.remove('is-nudged', 'up');
      tapes[pulled + 1]?.classList.remove('is-nudged', 'down');
    }
    pulled = -1;
    if (hidePeek) { clearTimeout(peekT); peek.classList.remove('on'); }
  }
  stack.addEventListener('pointerleave', () => { if (!drag) clearPull(); });

  /* ---------- LCD + "now playing" ---------- */
  // the tape counter follows the YouTube player itself: its real time and state
  // (state: 1 playing, 2 paused, 3 buffering, 0 ended — the player's own codes)
  const clock = { t: 0, at: 0, state: -1, on: false };
  let clockT = 0;
  const fmt = (sec) => {
    const x = Math.max(0, Math.floor(sec));
    return `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
  };
  function setLcd(text) { lcd.textContent = text; }
  const clockNow = () => clock.t + (clock.state === 1 ? (performance.now() - clock.at) / 1000 : 0);
  function renderClock() {
    if (!clock.on) return;
    setLcd(clock.state === 0 ? '■ END' : `${clock.state === 2 ? '❚❚' : '▶'} ${fmt(clockNow())}`);
  }
  function syncPlayBtn() {
    const playing = clock.on && (clock.state === 1 || clock.state === 3);
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.title = playing ? 'Pause' : 'Play';
  }
  function startClock() {
    // until the player reports in, assume it's playing from 0:00
    Object.assign(clock, { t: 0, at: performance.now(), state: 1, on: true });
    clearInterval(clockT);
    clockT = setInterval(renderClock, 250);
    renderClock(); syncPlayBtn();
  }
  function stopClock(text) { clock.on = false; clearInterval(clockT); if (text) setLcd(text); syncPlayBtn(); }
  function updateNow() {
    now.classList.toggle('has-tape', !!loaded);
    nowText.innerHTML = loaded
      ? `now playing · <b>${esc(loaded.it.title)}</b> · ${esc(metaOf(loaded.it))}`
      : 'drag a tape into the VCR, or click one';
  }

  /* ---------- TV power ---------- */
  function powerOn() {
    if (powered) return;
    powered = true;
    screen.classList.add('on');
    tv.classList.add('is-on');
    Sound.tvOn();
    picture.animate([
      { transform: 'scale(0.02, 0.006)', filter: 'brightness(6)', opacity: 1 },
      { transform: 'scale(1, 0.006)', filter: 'brightness(5)', offset: 0.22 },
      { transform: 'scale(1, 1.04)', filter: 'brightness(1.6)', offset: 0.62 },
      { transform: 'scale(1, 1)', filter: 'brightness(1)' },
    ], { duration: T(620), easing: EASE_OUT });
  }
  function powerOff() {
    if (!powered) return;
    powered = false;
    Sound.tvOff();
    tv.classList.remove('is-on');
    const a = picture.animate([
      { transform: 'scale(1, 1)', filter: 'brightness(1)', opacity: 1 },
      { transform: 'scale(1, 0.006)', filter: 'brightness(4)', offset: 0.45 },
      { transform: 'scale(0.02, 0.006)', filter: 'brightness(6)', opacity: 1, offset: 0.8 },
      { transform: 'scale(0, 0)', filter: 'brightness(6)', opacity: 0 },
    ], { duration: T(460), easing: EASE_IN });
    a.onfinish = () => { if (!powered) screen.classList.remove('on'); };
  }

  /* ---------- static ---------- */
  const sctx = staticCv.getContext('2d');
  const simg = sctx.createImageData(staticCv.width, staticCv.height);
  let staticRaf = 0, staticFrame = 0;
  function drawStatic() {
    staticRaf = requestAnimationFrame(drawStatic);
    if (staticFrame++ % 2) return;                 // ~30 fps is plenty for snow
    const d = simg.data;
    const roll = (performance.now() / 6) % staticCv.height;
    for (let y = 0; y < staticCv.height; y++) {
      const band = Math.abs(y - roll) < 5 ? 60 : 0; // a bright rolling bar
      for (let x = 0; x < staticCv.width; x++) {
        const v = (Math.random() * 200 + band) | 0;
        const k = (y * staticCv.width + x) * 4;
        d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
      }
    }
    sctx.putImageData(simg, 0, 0);
  }
  async function snow(ms) {
    staticCv.classList.add('on');
    if (!staticRaf) drawStatic();
    Sound.hiss(ms / 1000);
    await wait(T(ms));
    staticCv.classList.remove('on');
    cancelAnimationFrame(staticRaf); staticRaf = 0;
  }

  /* ---------- OSD ---------- */
  let osdT = 0;
  function flashOsd(tl, bl) {
    osdTl.textContent = tl;
    osdBl.textContent = bl;
    osd.classList.add('show');
    clearTimeout(osdT);
    osdT = setTimeout(() => osd.classList.remove('show'), 2600);
  }

  /* ---------- YouTube: load early (muted), reveal with sound ---------- */
  let yt = null;   // { frame, it, ready, revealed }
  window.addEventListener('message', (e) => {
    if (!yt || e.source !== yt.frame.contentWindow) return;
    let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!yt.ready) { yt.ready = true; if (yt.revealed) unmuteFromStart(); }
    if (!yt.revealed || !d || !d.info || !clock.on) return;   // while loading, the LCD keeps saying LOAD
    if (typeof d.info.currentTime === 'number') { clock.t = d.info.currentTime; clock.at = performance.now(); }
    if (typeof d.info.playerState === 'number') { clock.state = d.info.playerState; syncPlayBtn(); }
    renderClock();
  });
  function togglePlay() {
    if (!yt || !clock.on || !loaded) return;
    const title = loaded.it.title.toUpperCase();
    if (clock.state === 1 || clock.state === 3) {
      Object.assign(clock, { t: clockNow(), at: performance.now(), state: 2 });
      ytSend('pauseVideo');
      flashOsd('PAUSE ❚❚', title);
    } else {
      if (clock.state === 0) { ytSend('seekTo', [0, true]); clock.t = 0; }
      Object.assign(clock, { at: performance.now(), state: 1 });
      ytSend('playVideo');
      flashOsd('PLAY ▶', title);
    }
    syncPlayBtn(); renderClock();
  }
  function ytSend(func, args = []) {
    try { yt.frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {}
  }
  function unmuteFromStart() {
    ytSend('seekTo', [0, true]);
    ytSend('unMute');
    ytSend('setVolume', [100]);
    ytSend('playVideo');
  }
  function preload(it) {
    if (it.kindOf === 'photo') { const im = new Image(); im.src = it.full; return; }
    const id = ytId(it.url);
    if (!(it.type === 'youtube' && id)) return;
    if (yt && yt.it === it && content.contains(yt.frame)) return;
    content.classList.add('is-preload');
    content.innerHTML = `<iframe class="${it.vertical ? 'is-vertical' : ''}" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(location.origin)}" title="${esc(it.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    const frame = content.querySelector('iframe');
    yt = { frame, it, ready: false, revealed: false };
    // say hello so the player starts talking back (and we know it's ready)
    frame.addEventListener('load', () => {
      const hello = () => { try { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {} };
      hello(); setTimeout(hello, 400); setTimeout(hello, 1200);
    });
  }

  /* ---------- what plays on the screen ---------- */
  function mount(it) {
    paused = false;
    if (it.kindOf === 'photo') { yt = null; return mountPhoto(it); }
    const id = ytId(it.url);
    if (it.type === 'youtube' && id) {
      preload(it);                     // no-op if it's already loading
      yt.revealed = true;
      if (yt.ready) unmuteFromStart();
      else setTimeout(() => { if (yt && yt.it === it) unmuteFromStart(); }, 2500);
    } else {
      yt = null;
      content.innerHTML = `<div class="tv-ext" style="background-image:url('${esc(thumbFor(it))}')"><div><p>this tape plays on ${esc(it.platform || 'another site')}</p><a href="${esc(it.url)}" target="_blank" rel="noopener">watch on ${esc((it.platform || 'site').toLowerCase())} ↗</a></div></div>`;
    }
  }

  async function play(it) {
    powerOn();
    preload(it);
    await snow(480);
    mount(it);
    content.classList.remove('is-preload');
    blue.classList.add('is-hidden');
    // the picture "catches" vertical hold as it arrives
    content.animate([
      { transform: 'translateY(-7%) scaleY(1.05)', filter: 'brightness(1.9) contrast(1.3)', opacity: 0.35 },
      { transform: 'translateY(1.5%)', filter: 'brightness(1.1)', opacity: 1, offset: 0.6 },
      { transform: 'none', filter: 'none', opacity: 1 },
    ], { duration: T(460), easing: EASE_OUT });
    if (it.kindOf === 'photo') stopClock('■ STILL');   // the window's own title bar names it
    else if (yt) { startClock(); flashOsd('PLAY ▶', it.title.toUpperCase()); }
    else stopClock('↗ LINK');                          // plays on another site
  }

  async function blank(ms = 260) {
    clearTimeout(osdT);
    osd.classList.remove('show');
    content.innerHTML = '';
    content.classList.remove('is-preload');
    yt = null;
    await snow(ms);
    blue.classList.remove('is-hidden');
  }

  /* ---------- geometry ---------- */
  function makeGhost(el) {
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const g = el.cloneNode(true);
    g.classList.remove('is-out', 'is-loaded', 'is-pulled', 'is-nudged', 'up', 'down');
    g.classList.add('spine-ghost');
    g.removeAttribute('aria-label');
    g.setAttribute('aria-hidden', 'true');
    g.tabIndex = -1;
    Object.assign(g.style, {
      left: `${r.left + r.width / 2 - w / 2}px`, top: `${r.top + r.height / 2 - h / 2}px`,
      width: `${w}px`, height: `${h}px`, transform: tf(),
    });
    g.style.setProperty('--sh', `${h}px`);
    g.style.setProperty('--sw', `${w}px`);
    document.body.appendChild(g);
    g._base = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w, h };
    return g;
  }
  // the spine lines up exactly over the slot, then slides into it
  function slotGeo(g) {
    const s = slot.getBoundingClientRect();
    const b = g._base;
    return { x: s.left + s.width / 2 - b.cx, y: s.top + s.height / 2 - b.cy, s: (s.width * 0.97) / b.w };
  }
  const intoSlot = (g) => ({ x: g.x, y: g.y + 2, rx: 0, sx: g.s * 0.86, sy: g.s * 0.62 });
  function inZone(x, y) {
    const r = rig.getBoundingClientRect();
    const pad = 28;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom - 40 + pad;
  }

  /* ---------- insert ---------- */
  async function insert(i, ghost = null, st = null) {
    if (busy) { ghost && returnHome(ghost, tapes[i], st); return; }
    busy = true;
    const el = tapes[i], it = items[i];
    try {
      clearPull();
      el.classList.add('is-out');
      if (loaded && loaded.i !== i) await eject({ fast: true });
      powerOn();
      preload(it);                                   // start loading now, while the tape travels
      const fromClick = !ghost;
      if (!ghost) { ghost = makeGhost(el); st = {}; Sound.pickup(); }
      const g = slotGeo(ghost);
      vcr.classList.add('is-target');

      // 1) carry it to the slot (an arc if it came from a click)
      const start = { x: 0, y: 0, r: 0, sx: 1, ...st };
      const over = { x: g.x, y: g.y - 4, sx: g.s };
      const carry = fromClick
        ? [{ transform: tf(start) }, { transform: tf({ x: g.x * 0.55, y: g.y * 0.55 - 80, r: g.x > 0 ? 5 : -5, sx: (1 + g.s) / 2 + 0.06 }), offset: 0.5 }, { transform: tf(over) }]
        : [{ transform: tf(start) }, { transform: tf(over) }];
      await ghost.animate(carry, { duration: T(fromClick ? 760 : 380), easing: fromClick ? EASE_IO : EASE_OUT, fill: 'forwards' }).finished;

      // 2) flap opens, tape slides in
      vcr.classList.remove('is-target');
      vcr.classList.add('is-open');
      setLcd('LOAD');
      Sound.insert();
      await ghost.animate([
        { transform: tf(over), filter: 'brightness(1)', opacity: 1 },
        { transform: tf({ ...over, y: g.y }), filter: 'brightness(0.9)', opacity: 1, offset: 0.25 },
        { transform: tf(intoSlot(g)), filter: 'brightness(0.25)', opacity: 0 },
      ], { duration: T(420), easing: EASE_IN, fill: 'forwards' }).finished;
      ghost.remove();

      // 3) clunk
      vcr.classList.remove('is-open');
      vcr.classList.add('has-tape');
      rig.classList.remove('thunk'); void rig.offsetWidth; rig.classList.add('thunk');
      Sound.clunk();
      loaded = { i, it, el };
      el.classList.add('is-loaded');
      updateNow();
      await wait(T(200));
      await play(it);
    } finally {
      busy = false;
    }
  }

  /* ---------- eject ---------- */
  async function eject({ fast = false } = {}) {
    if (!loaded) return;
    const { el } = loaded;
    loaded = null;
    Sound.eject();
    stopClock('EJECT');
    updateNow();
    blank(fast ? 200 : 300);
    vcr.classList.add('is-open');
    vcr.classList.remove('has-tape');
    const ghost = makeGhost(el);
    const g = slotGeo(ghost);
    const over = { x: g.x, y: g.y - 4, sx: g.s };
    await ghost.animate([
      { transform: tf(intoSlot(g)), filter: 'brightness(0.25)', opacity: 0 },
      { transform: tf({ ...over, y: g.y - 22 }), filter: 'brightness(1)', opacity: 1, offset: 0.7 },
      { transform: tf({ ...over, y: g.y - 16 }), filter: 'brightness(1)', opacity: 1 },
    ], { duration: T(fast ? 360 : 520), easing: EASE_OUT, fill: 'forwards' }).finished;
    vcr.classList.remove('is-open');
    if (!fast) await wait(T(140));
    const home = ghost.animate([
      { transform: tf({ ...over, y: g.y - 16 }) },
      { transform: tf({ x: g.x * 0.45, y: g.y * 0.45 - 64, r: g.x > 0 ? -4 : 4, sx: (1 + g.s) / 2 }), offset: 0.5 },
      { transform: tf() },
    ], { duration: T(fast ? 520 : 700), easing: EASE_IO, fill: 'forwards' });
    const land = () => {
      ghost.remove();
      el.classList.remove('is-out', 'is-loaded');
      el.animate([{ transform: 'translateX(-10px)' }, { transform: 'translateX(0)' }], { duration: T(360), easing: SPRING });
    };
    if (fast) home.finished.then(land); else { await home.finished; land(); }
    setLcd('STOP');
  }

  function returnHome(ghost, el, st) {
    Cursor.tag(null);
    vcr.classList.remove('is-target');
    ghost.animate([{ transform: tf(st) }, { transform: tf() }], { duration: T(520), easing: SPRING, fill: 'forwards' })
      .finished.then(() => { ghost.remove(); el.classList.remove('is-out'); });
  }

  /* ---------- drag ---------- */
  let drag = null;
  let swallowClickUntil = 0;
  // a drop ends with a click on whatever is underneath; never let that click reach anything
  window.addEventListener('click', (e) => {
    if (performance.now() < swallowClickUntil) { e.stopImmediatePropagation(); e.preventDefault(); }
  }, true);

  function onDown(e, i) {
    if (e.button !== undefined && e.button !== 0) return;
    if (loaded && loaded.i === i) return;      // the empty spot: click ejects instead
    drag = { i, id: e.pointerId, sx: e.clientX, sy: e.clientY, started: false, touch: e.pointerType === 'touch' };
  }
  function startDrag(e) {
    const el = tapes[drag.i];
    clearPull();
    const ghost = makeGhost(el);
    el.classList.add('is-out');
    Object.assign(drag, {
      started: true, ghost,
      ox: e.clientX - ghost._base.cx, oy: e.clientY - ghost._base.cy,
      tx: e.clientX, ty: e.clientY,
      cur: { x: 0, y: 0, r: 0, sx: 1 }, over: false,
    });
    document.body.classList.add('is-dragging-tape');
    Sound.pickup();
    Cursor.tag('drop it in the VCR');
    const loop = () => {
      if (!drag || !drag.started) return;
      const d = drag, c = d.cur, b = d.ghost._base;
      const gx = d.tx - d.ox - b.cx, gy = d.ty - d.oy - b.cy;
      const vx = gx - c.x;
      c.x += vx * 0.38;
      c.y += (gy - c.y) * 0.38;
      c.r += (clamp(vx * 0.18, -12, 12) - c.r) * 0.18;
      // grow toward the slot's width as it gets close to the VCR
      const s = slot.getBoundingClientRect();
      const dist = Math.hypot(d.tx - (s.left + s.width / 2), d.ty - (s.top + s.height / 2));
      const near = clamp(1 - dist / 460, 0, 1);
      const target = 1.06 + ((s.width * 0.97) / b.w - 1.06) * near * 0.9;
      c.sx += (target - c.sx) * 0.2;
      d.ghost.style.transform = tf({ x: c.x, y: c.y, r: c.r, sx: c.sx });
      d.raf = requestAnimationFrame(loop);
    };
    drag.raf = requestAnimationFrame(loop);
  }
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.started) {
      const far = Math.hypot(dx, dy) > 7;
      // on touch, an up/down swipe scrolls the page; a sideways pull picks the tape
      if (far && (!drag.touch || Math.abs(dx) > Math.abs(dy))) startDrag(e);
      else if (far && drag.touch) drag = null;
      return;
    }
    drag.tx = e.clientX; drag.ty = e.clientY;
    const over = inZone(e.clientX, e.clientY);
    if (over !== drag.over) {
      drag.over = over;
      vcr.classList.toggle('is-target', over);
      if (!loaded) setLcd(over ? 'INSERT' : '--:--');
      if (over) Sound.key();
    }
  }, { passive: true });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.started) return;
    swallowClickUntil = performance.now() + 350;
    cancelAnimationFrame(d.raf);
    document.body.classList.remove('is-dragging-tape');
    Cursor.tag(null);
    const st = { ...d.cur };
    if (d.over && e.type !== 'pointercancel') insert(d.i, d.ghost, st);
    else { if (!loaded) setLcd('--:--'); returnHome(d.ghost, tapes[d.i], st); }
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  tapes.forEach((el, i) => {
    el.addEventListener('pointerdown', (e) => onDown(e, i));
    el.addEventListener('click', () => {
      if (loaded && loaded.i === i) { if (!busy) { busy = true; eject().finally(() => { busy = false; }); } return; }
      if (!fine) root.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });   // phones: bring the TV into view
      insert(i);
    });
    el.addEventListener('pointerenter', (e) => {
      if (drag && drag.started) return;
      Sound.hover();
      if (e.pointerType === 'mouse' || e.pointerType === 'pen') pull(i);
      Cursor.tag(loaded && loaded.i === i ? 'eject' : 'drag or click');
    });
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) pull(i); });
    el.addEventListener('blur', () => { if (pulled === i) clearPull(); });
    el.addEventListener('pointerleave', () => { if (!drag) Cursor.tag(null); });
  });

  /* ---------- buttons ---------- */
  root.querySelectorAll('[data-vhs]').forEach((b) => b.addEventListener('click', () => {
    const act = b.dataset.vhs;
    Sound.key();
    if (act === 'eject') {
      if (busy || !loaded) { if (!loaded) setLcd('NO TAPE'); return; }
      busy = true; eject().finally(() => { busy = false; });
    } else if (act === 'play') {
      if (!loaded) { setLcd('NO TAPE'); setTimeout(() => !loaded && setLcd('--:--'), 1200); return; }
      if (paused || !content.innerHTML) { play(loaded.it); return; }
      if (loaded.it.kindOf === 'photo') { setLcd('■ STILL'); return; }
      togglePlay();
    } else if (act === 'big') {
      if (!loaded) return;
      pause();
      openSheet(loaded.it, screen);
    }
  }));

  function pause() {
    if (!loaded || loaded.it.kindOf === 'photo') return;
    paused = true;
    yt = null;
    content.classList.remove('is-preload');
    content.innerHTML = `<div class="tv-paused" style="background-image:url('${esc(thumbFor(loaded.it))}')"></div>`;
    stopClock('❚❚ PAUSE');
    flashOsd('PAUSE ❚❚', 'press ▶ to play here');
  }

  /* ---------- photo window ---------- */
  function mountPhoto(it) {
    const file = it.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.jpg';
    content.innerHTML = `
      <div class="pw" role="group" aria-label="${esc(it.title)} photo viewer">
        <div class="pw-bar">
          <i class="pw-ico" aria-hidden="true"></i><span class="pw-title">${file}</span>
          <span class="pw-ctrls">
            <button class="pw-b" data-pw="out" aria-label="Zoom out">−</button>
            <button class="pw-b" data-pw="in" aria-label="Zoom in">+</button>
            <button class="pw-b" data-pw="close" aria-label="Close and eject">×</button>
          </span>
        </div>
        <div class="pw-tools">
          <button class="pw-t" data-pw="out">zoom −</button>
          <button class="pw-t" data-pw="in">zoom +</button>
          <button class="pw-t" data-pw="fit">fit</button>
          <span class="pw-zoom">100%</span>
        </div>
        <div class="pw-view"><picture><source srcset="${esc(it.full)}" type="image/webp"><img src="${esc(it.fullJpg)}" alt="${esc(it.title)}" draggable="false"></picture></div>
        <div class="pw-status"><span class="pw-dim">loading…</span><span>${esc(it.client || 'Photography')} · still</span></div>
      </div>`;
    const pw = content.querySelector('.pw');
    const view = pw.querySelector('.pw-view');
    const img = view.querySelector('img');
    const zEl = pw.querySelector('.pw-zoom');
    const dim = pw.querySelector('.pw-dim');
    const LEVELS = [1, 1.5, 2, 3, 4];
    let z = 1, px = 0, py = 0;

    // the photo is fitted inside the view (object-fit: contain); pan limits use the fitted size
    const bounds = () => {
      const vw = view.clientWidth, vh = view.clientHeight;
      const nw = img.naturalWidth || vw, nh = img.naturalHeight || vh;
      const f = Math.min(vw / nw, vh / nh);
      return { mx: Math.max(0, (nw * f * z - vw) / 2), my: Math.max(0, (nh * f * z - vh) / 2) };
    };
    const apply = () => {
      const { mx, my } = bounds();
      px = clamp(px, -mx, mx); py = clamp(py, -my, my);
      img.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
      zEl.textContent = `${Math.round(z * 100)}%`;
      view.classList.toggle('can-pan', z > 1);
    };
    const zoom = (dir) => {
      const k = LEVELS.indexOf(z);
      z = dir === 'fit' ? 1 : LEVELS[clamp((k < 0 ? 0 : k) + (dir === 'in' ? 1 : -1), 0, LEVELS.length - 1)];
      if (z === 1) { px = 0; py = 0; }
      apply();
      Sound.key();
    };
    const ready = () => { dim.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`; apply(); };
    if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready);
    pw.querySelectorAll('[data-pw]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const a = b.dataset.pw;
      if (a === 'close') {
        pw.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.2)', opacity: 0 }], { duration: T(260), easing: 'steps(5, end)', fill: 'forwards' });
        if (!busy && loaded) { busy = true; setTimeout(() => eject().finally(() => { busy = false; }), T(220)); }
      } else zoom(a);
    }));
    view.addEventListener('dblclick', () => { z = z > 1 ? 1 : 2; if (z === 1) { px = 0; py = 0; } apply(); });
    view.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 'in' : 'out'); }, { passive: false });
    let pan = null;
    view.addEventListener('pointerdown', (e) => {
      if (z <= 1) return;
      pan = { id: e.pointerId, x: e.clientX - px, y: e.clientY - py };
      view.setPointerCapture(e.pointerId);
      view.classList.add('panning');
    });
    view.addEventListener('pointermove', (e) => { if (!pan || e.pointerId !== pan.id) return; px = e.clientX - pan.x; py = e.clientY - pan.y; apply(); });
    const stopPan = () => { pan = null; view.classList.remove('panning'); };
    view.addEventListener('pointerup', stopPan);
    view.addEventListener('pointercancel', stopPan);
    // the window pops open in a few stepped frames, like an old OS
    pw.animate([{ transform: 'scale(0.25)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], { duration: T(320), easing: 'steps(6, end)' });
  }

  window.addEventListener('keydown', (e) => {
    if (!visible || document.querySelector('.fsheet.open, .menu.open, .term.open')) return;
    if (e.key === 'Escape' && loaded && !busy) { busy = true; eject().finally(() => { busy = false; }); }
    if (e.key === ' ' && yt && clock.on && !/^(BUTTON|INPUT|TEXTAREA|A)$/.test(document.activeElement.tagName)) { e.preventDefault(); togglePlay(); }
    const pw = content.querySelector('.pw');
    if (pw && (e.key === '+' || e.key === '=')) pw.querySelector('[data-pw="in"]').click();
    if (pw && (e.key === '-' || e.key === '_')) pw.querySelector('[data-pw="out"]').click();
  });

  /* ---------- show / hide with the view ---------- */
  function show() {
    root.hidden = false;
    visible = true;
    loadThumbs();
    root.classList.remove('in'); void root.offsetWidth; root.classList.add('in');
    // tapes slide in from the left, one after another, like being stacked
    tapes.forEach((t, k) => t.animate([
      { opacity: 0, transform: 'translateX(-40px)' },
      { opacity: 1, transform: 'translateX(0)' },
    ], { duration: T(560), delay: T(40 + k * 32), easing: EASE_OUT, fill: 'backwards' }));
    rig.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: T(640), delay: T(80), easing: EASE_OUT, fill: 'backwards' });
    setTimeout(() => {
      if (!visible) return;
      powerOn();
      if (loaded) play(loaded.it);
    }, T(480));
  }
  function hide() {
    visible = false;
    clearPull();
    content.innerHTML = '';                 // stops any video
    content.classList.remove('is-preload');
    yt = null;
    blue.classList.remove('is-hidden');
    stopClock(loaded ? 'STOP' : '--:--');
    powerOff();
    root.classList.remove('in');
    setTimeout(() => { if (!visible) root.hidden = true; }, 460);
  }
  function prepare() { root.style.transition = 'none'; root.classList.remove('in'); requestAnimationFrame(() => { root.style.transition = ''; }); }

  updateNow();
  return { show, hide, prepare, get visible() { return visible; } };
}
