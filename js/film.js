/* ============================================================
   FILM SIDE — spiral reel, list view, project sheet.
   The spiral is pure CSS 3D (no WebGL), so YouTube thumbnails
   load straight from YouTube with no CORS trouble.
   ============================================================ */
import { FILMS, PHOTOS, SHOWREEL } from './content.js';
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';
import { initPulse } from './pulse.js';

export function ytId(url) {
  const m = String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function thumbSources(item) {
  if (item.thumb) return [item.thumb];
  const id = ytId(item.url);
  if (!id) return [];
  const base = `https://i.ytimg.com/vi/${id}/`;
  return item.vertical
    ? [base + 'oar2.jpg', base + 'hq720.jpg', base + 'hqdefault.jpg']
    : [base + 'maxresdefault.jpg', base + 'hq720.jpg', base + 'hqdefault.jpg'];
}

// load the first thumbnail that really exists (YouTube serves a 120×90 grey stub for missing ones)
function setThumb(img, item) {
  const list = thumbSources(item);
  let i = 0;
  const next = () => {
    if (i >= list.length) return;
    img.src = list[i++];
  };
  img.addEventListener('load', () => { if (img.naturalWidth <= 120 && i < list.length) next(); });
  img.addEventListener('error', next);
  next();
}

function buildItems() {
  const films = FILMS.map((f, i) => ({ ...f, kindOf: 'film', idx: i }));
  const photos = PHOTOS.map((p) => ({ title: p.label, client: 'Photography', kind: 'Still', year: '', kindOf: 'photo', vertical: true, thumb: p.src + '-md.webp', full: p.src + '.webp', fullJpg: p.src + '.jpg' }));
  // interleave photos among films so the spiral feels mixed
  const out = [];
  films.forEach((f, i) => { out.push(f); if (i % 3 === 2 && photos.length) out.push(photos.shift()); });
  return out.concat(photos);
}

export function initFilm({ face }) {
  const items = buildItems();
  const wrap = face.querySelector('#spiralWrap');
  const spiral = face.querySelector('#spiral');
  const listEl = face.querySelector('#filmList');
  const listUl = face.querySelector('#filmListItems');
  const preview = face.querySelector('#listPreview');
  const capIndex = face.querySelector('#fcIndex');
  const capTitle = face.querySelector('#fcTitle');
  const capMeta = face.querySelector('#fcMeta');
  const caption = face.querySelector('.film-caption');

  /* ---------- spiral ---------- */
  const N = items.length;
  const PERSP = 1400;
  const RAD = () => (window.innerWidth < 700 ? window.innerWidth * 0.5 : Math.min(560, Math.max(300, window.innerWidth * 0.33)));
  const MAG = PERSP / (PERSP - RAD());   // how much the old layout magnified the front card
  const cards = items.map((it, i) => {
    const el = document.createElement('button');
    el.className = 's-card';
    el.setAttribute('aria-label', `${it.title} — ${it.kind}`);
    // cards are built at the size they appear on screen (the spiral is pushed back by its
    // radius so the front card sits at depth 0): text and photos render 1:1, never upscaled
    const k = (window.innerWidth < 700 ? 0.58 : 0.84) * MAG;
    const w = Math.round((it.vertical ? 190 : 302) * k);
    const h = Math.round((it.vertical ? 300 : 187) * k);
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', h + 'px');
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    setThumb(img, it);
    el.appendChild(img);
    if (it.kindOf === 'photo') { const b = document.createElement('span'); b.className = 's-badge'; b.textContent = 'still'; el.appendChild(b); }
    el.addEventListener('pointerenter', () => { el.classList.add('is-hover'); Sound.hover(); Cursor.tag(it.kindOf === 'photo' ? 'view' : (it.type === 'external' ? 'open ↗' : 'play')); });
    el.addEventListener('pointerleave', () => { el.classList.remove('is-hover'); Cursor.tag(null); });
    el.addEventListener('click', (e) => {
      if (dragMoved > 6) return;
      openSheet(it, el);
    });
    spiral.appendChild(el);
    return el;
  });

  // spacing tuned so neighbouring cards sit just apart (about −10 to +60 px on laptop/desktop screens)
  const STEP = 40;                                           // degrees between cards
  const DY = (window.innerWidth < 700 ? 100 : 158) * MAG;   // vertical rise per card
  let pos = 0, target = 0, vel = 0, last = -1;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let running = false, raf = 0;
  let dragMoved = 0;
  let view = 'spiral';
  // intro: cards unfold from a tight stack into the spiral, centre card first
  let introStart = -1;
  const INTRO_MS = 1500;
  const easeOut = (x) => 1 - Math.pow(1 - x, 4);
  const easeIO = (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
  // cache last written values so we only touch the DOM when something changed
  const cache = cards.map(() => ({ t: '', o: '', f: '', z: '', p: '' }));
  const put = (el, c, key, prop, val) => { if (c[key] !== val) { c[key] = val; el.style[prop] = val; } };

  function wrapOffset(o) {
    o = ((o % N) + N) % N;
    return o > N / 2 ? o - N : o;
  }

  function render(now) {
    raf = requestAnimationFrame(render);
    if (!running) return;
    const prev = pos;
    pos += (target - pos) * 0.085;
    vel += ((pos - prev) - vel) * 0.25;
    mx += (tmx - mx) * 0.06;
    my += (tmy - my) * 0.06;

    const it = introStart < 0 ? 1 : Math.min(1, ((now || performance.now()) - introStart) / INTRO_MS);
    const E = easeIO(it);
    const R = RAD();
    // each card carries the whole chain itself (push back, tilt, place on the helix). The spiral
    // container is flat, so cards are painted in depth order and never cut through each other.
    const base = `translateZ(${(-R).toFixed(1)}px) rotateX(${(-my * 6).toFixed(2)}deg) rotateY(${(mx * 10 + (1 - E) * -24).toFixed(2)}deg) `;
    const bend = Math.max(-18, Math.min(18, vel * 260)) * E;
    const spin = (1 - E) * -1.6;           // the whole helix swings into place

    for (let i = 0; i < N; i++) {
      const o = wrapOffset(i - pos - spin);
      const abs = Math.abs(o);
      // each card starts a touch later the further it is from the centre
      const local = Math.max(0, Math.min(1, (it * INTRO_MS - Math.min(abs, 4) * 90) / (INTRO_MS - 360)));
      const e = easeOut(local);
      const ang = o * STEP * e;
      const vis = abs < N / 2 - 0.5;
      const el = cards[i], c = cache[i];
      const tr = base + `rotateY(${ang.toFixed(2)}deg) translateZ(${(R * (0.25 + 0.75 * e)).toFixed(1)}px) translateY(${(o * DY * e).toFixed(1)}px) rotateY(${(-ang * 0.35).toFixed(2)}deg) skewY(${(bend * Math.sign(o || 1) * 0.3).toFixed(2)}deg) rotateZ(${(bend * 0.15 + (1 - e) * o * 4).toFixed(2)}deg) scale(${(0.72 + 0.28 * e).toFixed(3)})`;
      put(el, c, 't', 'transform', tr);
      const op = vis ? Math.max(0, 1 - Math.max(0, abs - 2.4) * 0.28) * e : 0;
      put(el, c, 'o', 'opacity', op.toFixed(2));
      // blur stepped in 0.5px increments: far cheaper than a new filter every frame
      const blur = Math.round(Math.max(0, abs - 1.1) * 2.4 * e * 2) / 2;
      put(el, c, 'f', 'filter', blur > 0 ? `blur(${blur}px) brightness(${(1 - Math.min(0.5, Math.round(abs) * 0.1)).toFixed(1)})` : 'none');
      // paint order follows real depth on the cylinder; the focused card always wins
      const depth = Math.cos((ang + mx * 10) * Math.PI / 180) * (0.25 + 0.75 * e);
      put(el, c, 'z', 'zIndex', String(Math.round(1000 + depth * 500 - abs)));
      put(el, c, 'p', 'pointerEvents', abs < 2.6 && it >= 1 ? 'auto' : 'none');
    }
    const cur = ((Math.round(pos) % N) + N) % N;
    if (cur !== last) {
      last = cur;
      const item = items[cur];
      capIndex.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      capTitle.textContent = item.title;
      capMeta.textContent = [item.client, item.kind].filter(Boolean).join(' · ');
      caption.classList.remove('swap'); void caption.offsetWidth; caption.classList.add('swap');
      if (it >= 1) Sound.tick();
    }
  }

  function prepare() {
    running = false;
    introStart = -1;
    wrap.style.transition = 'none';
    wrap.style.opacity = '0';
    caption.style.opacity = '0';
  }
  function enter() {
    if (view === 'list') { running = true; return; }
    target = pos = Math.round(target);
    introStart = performance.now();
    running = true;
    wrap.style.transition = 'opacity .35s ease';
    wrap.style.opacity = '1';
    caption.style.transition = 'opacity .6s ease .9s';
    caption.style.opacity = '';
    // a soft "deal" as the nearest cards land
    [0, 1, 2, 3, 4].forEach((k) => setTimeout(() => Sound.deal(k), 380 + k * 110));
  }
  function leave() { setTimeout(() => { running = false; }, 1300); }

  requestAnimationFrame(render);

  // heartbeat on the empty grid (never on a card, never after a drag)
  const pulse = initPulse(face.querySelector('#filmPulse'), face);
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('.s-card') || dragMoved > 6) return;
    const r = face.getBoundingClientRect();
    pulse.beat(e.clientX - r.left, e.clientY - r.top);
    Sound.beat();
  });

  // wheel / trackpad
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    target += d * 0.0032;
  }, { passive: false });
  // drag / touch
  let dragX = null, dragStart = 0;
  wrap.addEventListener('pointerdown', (e) => { dragX = e.clientY + e.clientX; dragStart = target; dragMoved = 0; });
  window.addEventListener('pointermove', (e) => {
    tmx = (e.clientX / window.innerWidth) * 2 - 1;
    tmy = (e.clientY / window.innerHeight) * 2 - 1;
    if (dragX === null) return;
    const d = (e.clientY + e.clientX) - dragX;
    dragMoved = Math.abs(d);
    target = dragStart - d * 0.006;
  }, { passive: true });
  window.addEventListener('pointerup', () => { dragX = null; setTimeout(() => (dragMoved = 0), 0); target = Math.round(target); });
  // snap gently to nearest card when idle
  let snapT = 0;
  wrap.addEventListener('wheel', () => { clearTimeout(snapT); snapT = setTimeout(() => (target = Math.round(target)), 220); }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (!running || document.querySelector('.fsheet.open, .menu.open, .term.open')) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { target = Math.round(target) + 1; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { target = Math.round(target) - 1; }
    if (e.key === 'Enter' && view === 'spiral') { const i = ((Math.round(pos) % N) + N) % N; openSheet(items[i], cards[i]); }
  });

  /* ---------- list view ---------- */
  items.forEach((it, i) => {
    const li = document.createElement('li');
    li.style.setProperty('--i', i);
    const b = document.createElement('button');
    b.innerHTML = `<span class="row-in">${it.title} <sup>${it.kindOf === 'photo' ? 'still' : it.kind.toLowerCase()}</sup></span>`;
    b.addEventListener('pointerenter', () => {
      listUl.classList.add('has-hover');
      b.classList.add('is-hover');
      const img = preview.querySelector('img');
      img.removeAttribute('src');
      setThumb(img, it);
      preview.classList.toggle('vertical', !!it.vertical);
      preview.classList.add('on');
      Sound.hover();
    });
    b.addEventListener('pointerleave', () => { listUl.classList.remove('has-hover'); b.classList.remove('is-hover'); preview.classList.remove('on'); });
    b.addEventListener('click', () => openSheet(it, b));
    li.appendChild(b);
    listUl.appendChild(li);
  });
  // floating preview follows the cursor with lag + tilt
  let px = 0, py = 0, ptx = 0, pty = 0;
  listEl.addEventListener('pointermove', (e) => { ptx = e.clientX; pty = e.clientY; });
  (function loopPrev() {
    requestAnimationFrame(loopPrev);
    if (view !== 'list') return;
    const vx = ptx - px;
    px += vx * 0.12; py += (pty - py) * 0.12;
    const w = preview.offsetWidth, h = preview.offsetHeight;
    preview.style.translate = `${px - w / 2}px ${py - h / 2}px`;
    preview.style.rotate = `${Math.max(-12, Math.min(12, vx * 0.08))}deg`;
  })();

  function setView(v) {
    if (v === view) return;
    view = v;
    document.querySelectorAll('.view-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.view === v));
    face.classList.toggle('view-list', v === 'list');
    if (v === 'list') {
      wrap.style.transition = 'opacity .5s'; wrap.style.opacity = '0'; wrap.style.pointerEvents = 'none';
      listEl.hidden = false; listEl.classList.remove('in'); void listEl.offsetWidth; listEl.classList.add('in');
      Sound.enabled && Sound.whoosh();
    } else {
      listEl.hidden = true; preview.classList.remove('on');
      wrap.style.opacity = '1'; wrap.style.pointerEvents = '';
      Sound.enabled && Sound.whoosh();
    }
  }
  document.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', () => { Sound.click(); setView(b.dataset.view); }));

  /* ---------- project sheet ---------- */
  const sheet = document.getElementById('fsheet');
  const panel = sheet.querySelector('.fsheet-panel');
  const media = document.getElementById('fsheetMedia');
  const info = document.getElementById('fsheetInfo');
  let openFrom = null;

  function lines(text) {
    // split a paragraph into roughly even lines for the reveal
    const words = text.split(' ');
    const out = []; let cur = '';
    words.forEach((w) => { if ((cur + ' ' + w).length > 42) { out.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w; });
    if (cur) out.push(cur);
    return out.map((l, i) => `<span class="line"><span style="--i:${i + 2}">${l}</span></span>`).join('');
  }

  function openSheet(it, fromEl) {
    Sound.open();
    openFrom = fromEl;
    const id = ytId(it.url);
    media.className = 'fsheet-media' + (it.vertical ? ' vertical' : '');
    if (it.kindOf === 'photo') {
      media.classList.add('photo');
      media.innerHTML = `
        <div class="fit-toggle" role="group" aria-label="Photo size">
          <button class="is-on" data-fit="original" aria-pressed="true">original</button>
          <button data-fit="full" aria-pressed="false">full width</button>
        </div>
        <picture><source srcset="${it.full}" type="image/webp"><img src="${it.fullJpg}" alt="${it.title}"></picture>`;
      media.querySelectorAll('[data-fit]').forEach((b) => b.addEventListener('click', () => {
        const full = b.dataset.fit === 'full';
        media.classList.toggle('full', full);
        media.querySelectorAll('[data-fit]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
        Sound.click();
        if (!full) panel.scrollTo({ top: 0, behavior: 'smooth' });
      }));
    } else if (it.type === 'youtube' && id) {
      media.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${it.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    } else {
      const th = thumbSources(it)[0] || '';
      media.innerHTML = `<div class="poster" style="background-image:url('${th}')"></div><div class="ext"><p style="font-size:14px;opacity:.7">This one lives on ${it.platform || 'another site'}</p><a class="pill pill--light" href="${it.url}" target="_blank" rel="noopener">watch on ${(it.platform || 'site').toLowerCase()} ↗</a></div>`;
    }
    const watch = it.kindOf === 'photo' ? '' : (it.type === 'youtube' ? `<a class="pill" href="${it.url}" target="_blank" rel="noopener">watch on youtube <b class="dot"></b></a>` : '');
    info.innerHTML = `
      <div><h2><span class="line"><span style="--i:0">${it.title}</span></span></h2>
        <div class="meta"><span class="line"><span style="--i:1">${[it.client, it.kind, it.year].filter(Boolean).map((m) => `<span>${m}</span>`).join(' ')}</span></span></div></div>
      <div><p>${lines(it.blurb || (it.kindOf === 'photo' ? 'Event photography, shot on location.' : ''))}</p>${watch}</div>`;

    // FLIP: grow the panel out of the card that was clicked
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    const r = fromEl.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const sx = r.width / pr.width, sy = r.height / pr.height;
    panel.animate([
      { transform: `translate(${r.left - pr.left}px, ${r.top - pr.top}px) scale(${sx}, ${sy})`, borderRadius: '40px', opacity: 0.6 },
      { transform: 'none', borderRadius: '16px', opacity: 1 },
    ], { duration: 850, easing: 'cubic-bezier(0.76,0,0.24,1)' });
    panel.scrollTop = 0;
    requestAnimationFrame(() => sheet.classList.add('shown'));
    Cursor.tag(null);
  }

  function closeSheet() {
    if (!sheet.classList.contains('open')) return;
    Sound.close();
    const anim = panel.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(30px) scale(.96)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(0.76,0,0.24,1)' });
    sheet.classList.remove('shown');
    anim.onfinish = () => { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); media.innerHTML = ''; };
  }
  sheet.querySelectorAll('[data-close-fsheet]').forEach((b) => b.addEventListener('click', closeSheet));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- showreel badge ---------- */
  const badge = document.getElementById('reelBadge');
  const reelItem = { ...SHOWREEL, client: 'Khushal Saini', kind: 'Showreel', kindOf: 'film', vertical: false, blurb: 'Two-ish minutes of the best bits — events, people, motion and rhythm.' };
  const rt = badge.querySelector('.reel-thumb');
  const rid = ytId(SHOWREEL.url);
  if (rid) rt.style.backgroundImage = `url(https://i.ytimg.com/vi/${rid}/hqdefault.jpg)`;
  badge.addEventListener('click', () => openSheet(reelItem, rt));

  return {
    setActive(v) { running = v; if (v) { target = Math.round(target); } },
    prepare, enter, leave,
    setView,
    closeSheet,
  };
}
