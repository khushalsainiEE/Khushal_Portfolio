/* ============================================================
   VHS — pick a tape off the shelf, drop it in the VCR, watch it
   on the CRT. Photo tapes open in a retro picture window.

   Motion notes
   • drag: the tape follows the pointer with a little lag (weight),
     tilts with horizontal speed and grows as it nears the VCR
   • insert: carry → line up over the slot → flap opens → tape
     flattens into the slot (ease-in) → clunk → static → picture
   • eject: the reverse, then the tape arcs home to its spot
   • TV: CRT power-on (line → full frame), power-off (frame → line → dot)
   Every transform uses the same function list (see tf) so the
   browser can interpolate between any two of them smoothly.
   ============================================================ */
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const shelf = root.querySelector('#vhsShelf');
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

  let loaded = null;        // { i, it, el }
  let busy = false;
  let powered = false;
  let visible = false;
  let thumbsReady = false;
  let paused = false;

  /* ---------- tapes ---------- */
  const tapes = items.map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tape' + (it.kindOf === 'photo' ? ' tape--still' : '') + (it.kindOf === 'reel' ? ' tape--reel' : '');
    b.style.setProperty('--tilt', (((i * 37) % 7) - 3) * 0.45 + 'deg');
    b.setAttribute('aria-label', `${it.title}, ${it.kindOf === 'photo' ? 'still photo' : it.kind}. Put it in the VCR.`);
    b.innerHTML = `
      <span class="tape-shell">
        <span class="tape-label"><img class="tape-thumb" alt="" decoding="async" draggable="false"></span>
        <span class="tape-window"><i class="reel"></i><i class="reel"></i></span>
        <span class="tape-sp">${it.kindOf === 'photo' ? 'PHOTO' : 'T-120'}</span>
      </span>
      <span class="tape-strip">${esc(it.title)}</span>
      ${it.kindOf === 'photo' ? '<span class="tape-stamp">STILL</span>' : ''}`;
    shelf.appendChild(b);
    return b;
  });

  function loadThumbs() {
    if (thumbsReady) return;
    thumbsReady = true;
    tapes.forEach((b, i) => {
      const img = b.querySelector('.tape-thumb');
      img.style.visibility = 'hidden';            // no broken-image icon if a thumbnail fails
      img.addEventListener('load', () => { if (img.naturalWidth > 120) img.style.visibility = ''; });
      setThumb(img, items[i]);
    });
  }

  /* ---------- LCD + "now playing" ---------- */
  let counterT = 0, counterStart = 0;
  function setLcd(text) { lcd.textContent = text; }
  function startCounter(prefix = '▶') {
    clearInterval(counterT);
    counterStart = performance.now();
    const tick = () => {
      const s = Math.floor((performance.now() - counterStart) / 1000);
      setLcd(`${prefix} ${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    };
    tick();
    counterT = setInterval(tick, 1000);
  }
  function stopCounter(text) { clearInterval(counterT); if (text) setLcd(text); }
  function updateNow() {
    now.classList.toggle('has-tape', !!loaded);
    nowText.innerHTML = loaded
      ? `now playing · <b>${esc(loaded.it.title)}</b> · ${esc([loaded.it.client, loaded.it.kindOf === 'photo' ? 'Still' : loaded.it.kind].filter(Boolean).join(' · '))}`
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

  /* ---------- what plays on the screen ---------- */
  function mount(it) {
    paused = false;
    if (it.kindOf === 'photo') return mountPhoto(it);
    const id = ytId(it.url);
    if (it.type === 'youtube' && id) {
      content.innerHTML = `<iframe class="${it.vertical ? 'is-vertical' : ''}" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(it.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    } else {
      content.innerHTML = `<div class="tv-ext" style="background-image:url('${esc(thumbFor(it))}')"><div><p>this tape plays on ${esc(it.platform || 'another site')}</p><a href="${esc(it.url)}" target="_blank" rel="noopener">watch on ${esc((it.platform || 'site').toLowerCase())} ↗</a></div></div>`;
    }
  }

  async function play(it) {
    powerOn();
    await snow(520);
    mount(it);
    blue.classList.add('is-hidden');
    // the picture "catches" vertical hold as it arrives
    content.animate([
      { transform: 'translateY(-7%) scaleY(1.05)', filter: 'brightness(1.9) contrast(1.3)', opacity: 0.35 },
      { transform: 'translateY(1.5%)', filter: 'brightness(1.1)', opacity: 1, offset: 0.6 },
      { transform: 'none', filter: 'none', opacity: 1 },
    ], { duration: T(460), easing: EASE_OUT });
    if (it.kindOf === 'photo') stopCounter('■ STILL');   // the window's own title bar names it
    else { startCounter(); flashOsd('PLAY ▶', it.title.toUpperCase()); }
  }

  async function blank(ms = 260) {
    clearTimeout(osdT);
    osd.classList.remove('show');
    content.innerHTML = '';
    await snow(ms);
    blue.classList.remove('is-hidden');
  }

  /* ---------- geometry ---------- */
  function makeGhost(el) {
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    const g = el.cloneNode(true);
    g.classList.remove('is-out', 'is-loaded');
    g.classList.add('tape-ghost');
    g.removeAttribute('aria-label');
    g.setAttribute('aria-hidden', 'true');
    g.tabIndex = -1;
    Object.assign(g.style, {
      left: `${r.left + r.width / 2 - w / 2}px`, top: `${r.top + r.height / 2 - h / 2}px`,
      width: `${w}px`, height: `${h}px`, transform: tf(),
    });
    g.style.setProperty('--tw', `${w}px`);
    document.body.appendChild(g);
    g._base = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w, h };
    return g;
  }
  // where the ghost must go to sit over the slot, and to vanish into it
  function slotGeo(g) {
    const s = slot.getBoundingClientRect();
    const b = g._base;
    const scale = (s.width * 0.96) / b.w;
    return {
      x: s.left + s.width / 2 - b.cx,
      pre: s.top - 8 - (b.h * scale) / 2 - b.cy,
      in: s.top + s.height / 2 - b.cy,
      s: scale,
    };
  }
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
      el.classList.add('is-out');
      if (loaded && loaded.i !== i) await eject({ fast: true });
      powerOn();
      const fromClick = !ghost;
      if (!ghost) { ghost = makeGhost(el); st = {}; Sound.pickup(); }
      const g = slotGeo(ghost);
      vcr.classList.add('is-target');

      // 1) carry it over the slot (an arc if it came from a click)
      const start = { x: 0, y: 0, r: 0, sx: 1, ...st };
      const over = { x: g.x, y: g.pre, sx: g.s };
      const carry = fromClick
        ? [{ transform: tf(start) }, { transform: tf({ x: g.x * 0.55, y: Math.min(0, g.pre) * 0.55 - 70, r: g.x > 0 ? 7 : -7, sx: (1 + g.s) / 2 + 0.08 }), offset: 0.5 }, { transform: tf(over) }]
        : [{ transform: tf(start) }, { transform: tf(over) }];
      await ghost.animate(carry, { duration: T(fromClick ? 760 : 360), easing: fromClick ? EASE_IO : EASE_OUT, fill: 'forwards' }).finished;

      // 2) flap opens, tape flattens into the slot
      vcr.classList.remove('is-target');
      vcr.classList.add('is-open');
      setLcd('LOAD');
      Sound.insert();
      await ghost.animate([
        { transform: tf(over), filter: 'brightness(1)', opacity: 1 },
        { transform: tf({ x: g.x, y: (g.pre + g.in) / 2, rx: 30, sx: g.s, sy: g.s * 0.6 }), filter: 'brightness(0.8)', opacity: 1, offset: 0.55 },
        { transform: tf({ x: g.x, y: g.in, rx: 64, sx: g.s * 0.98, sy: g.s * 0.04 }), filter: 'brightness(0.3)', opacity: 0 },
      ], { duration: T(440), easing: EASE_IN, fill: 'forwards' }).finished;
      ghost.remove();

      // 3) clunk
      vcr.classList.remove('is-open');
      vcr.classList.add('has-tape');
      rig.classList.remove('thunk'); void rig.offsetWidth; rig.classList.add('thunk');
      Sound.clunk();
      loaded = { i, it, el };
      el.classList.add('is-loaded');
      updateNow();
      await wait(T(240));
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
    stopCounter('EJECT');
    updateNow();
    blank(fast ? 200 : 300);
    vcr.classList.add('is-open');
    vcr.classList.remove('has-tape');
    const ghost = makeGhost(el);
    const g = slotGeo(ghost);
    const over = { x: g.x, y: g.pre, sx: g.s };
    await ghost.animate([
      { transform: tf({ x: g.x, y: g.in, rx: 64, sx: g.s * 0.98, sy: g.s * 0.04 }), filter: 'brightness(0.3)', opacity: 0 },
      { transform: tf({ ...over, y: g.pre - 16 }), filter: 'brightness(1)', opacity: 1, offset: 0.7 },
      { transform: tf(over), filter: 'brightness(1)', opacity: 1 },
    ], { duration: T(fast ? 360 : 520), easing: EASE_OUT, fill: 'forwards' }).finished;
    vcr.classList.remove('is-open');
    if (!fast) await wait(T(160));
    const home = ghost.animate([
      { transform: tf(over) },
      { transform: tf({ x: g.x * 0.45, y: g.pre * 0.45 - 56, r: g.x > 0 ? -6 : 6, sx: (1 + g.s) / 2 }), offset: 0.5 },
      { transform: tf() },
    ], { duration: T(fast ? 520 : 700), easing: EASE_IO, fill: 'forwards' });
    const land = () => {
      ghost.remove();
      el.classList.remove('is-out', 'is-loaded');
      el.animate([{ transform: 'translateY(-4px) rotate(var(--tilt))' }, { transform: 'rotate(var(--tilt))' }], { duration: T(320), easing: SPRING });
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
  function onDown(e, i) {
    if (e.button !== undefined && e.button !== 0) return;
    if (loaded && loaded.i === i) return;      // the empty spot: click ejects instead
    drag = { i, id: e.pointerId, sx: e.clientX, sy: e.clientY, started: false, touch: e.pointerType === 'touch' };
  }
  function startDrag(e) {
    const el = tapes[drag.i];
    const ghost = makeGhost(el);
    el.classList.add('is-out');
    el._noClick = true;
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
      c.r += (clamp(vx * 0.22, -16, 16) - c.r) * 0.18;
      // grow toward the slot size as it gets close to the VCR
      const s = slot.getBoundingClientRect();
      const dist = Math.hypot(d.tx - (s.left + s.width / 2), d.ty - s.top);
      const near = clamp(1 - dist / 420, 0, 1);
      const target = 1.08 + ((s.width * 0.96) / b.w - 1.08) * near * 0.85;
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
      // on touch, a sideways swipe scrolls the shelf; dragging up picks the tape
      if (far && (!drag.touch || Math.abs(dy) > Math.abs(dx))) startDrag(e);
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
    cancelAnimationFrame(d.raf);
    document.body.classList.remove('is-dragging-tape');
    Cursor.tag(null);
    const st = { ...d.cur };
    if (d.over && e.type !== 'pointercancel') insert(d.i, d.ghost, st);
    else { if (!loaded) setLcd('--:--'); returnHome(d.ghost, tapes[d.i], st); }
    setTimeout(() => { tapes[d.i]._noClick = false; }, 0);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);

  tapes.forEach((el, i) => {
    el.addEventListener('pointerdown', (e) => onDown(e, i));
    el.addEventListener('click', () => {
      if (el._noClick) return;
      if (loaded && loaded.i === i) { if (!busy) { busy = true; eject().finally(() => { busy = false; }); } return; }
      insert(i);
    });
    el.addEventListener('pointerenter', () => {
      if (drag && drag.started) return;
      Sound.hover();
      Cursor.tag(loaded && loaded.i === i ? 'eject' : 'drag or click');
    });
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
      if (paused || !content.innerHTML) play(loaded.it);
    } else if (act === 'big') {
      if (!loaded) return;
      pause();
      openSheet(loaded.it, screen);
    }
  }));

  function pause() {
    if (!loaded || loaded.it.kindOf === 'photo') return;
    paused = true;
    content.innerHTML = `<div class="tv-paused" style="background-image:url('${esc(thumbFor(loaded.it))}')"></div>`;
    stopCounter('❚❚ PAUSE');
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
    img.addEventListener('load', () => { dim.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`; apply(); });
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
    tapes.forEach((t, k) => t.animate([
      { opacity: 0, transform: 'translateY(26px) rotate(var(--tilt)) scale(0.96)' },
      { opacity: 1, transform: 'rotate(var(--tilt))' },
    ], { duration: T(560), delay: T(60 + k * 34), easing: EASE_OUT, fill: 'backwards' }));
    rig.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: T(640), delay: T(80), easing: EASE_OUT, fill: 'backwards' });
    setTimeout(() => {
      if (!visible) return;
      powerOn();
      if (loaded) play(loaded.it);
    }, T(480));
  }
  function hide() {
    visible = false;
    content.innerHTML = '';                 // stops any video
    blue.classList.remove('is-hidden');
    stopCounter(loaded ? 'STOP' : '--:--');
    powerOff();
    root.classList.remove('in');
    setTimeout(() => { if (!visible) root.hidden = true; }, 460);
  }
  function prepare() { root.style.transition = 'none'; root.classList.remove('in'); requestAnimationFrame(() => { root.style.transition = ''; }); }

  updateNow();
  return { show, hide, prepare, get visible() { return visible; } };
}
