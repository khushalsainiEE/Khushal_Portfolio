/* ============================================================
   FILM SIDE — spiral reel, list view, project sheet.
   The spiral is pure CSS 3D (no WebGL), so YouTube thumbnails
   load straight from YouTube with no CORS trouble.
   ============================================================ */
import { FILMS, PHOTOS, SHOWREEL } from './content.js';
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';

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
  const photos = PHOTOS.map((p) => ({ title: p.label, client: 'Photography', kind: 'Still', year: '', kindOf: 'photo', vertical: true, thumb: p.src + '-sm.webp', full: p.src + '.webp', fullJpg: p.src + '.jpg' }));
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
  const cards = items.map((it, i) => {
    const el = document.createElement('button');
    el.className = 's-card';
    el.setAttribute('aria-label', `${it.title} — ${it.kind}`);
    const k = window.innerWidth < 700 ? 0.6 : 1;
    const w = Math.round((it.vertical ? 190 : 330) * k);
    const h = Math.round((it.vertical ? 300 : 200) * k);
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

  const STEP = 360 / Math.min(N, 12);   // degrees between cards
  const RAD = () => (window.innerWidth < 700 ? window.innerWidth * 0.5 : Math.min(560, Math.max(300, window.innerWidth * 0.33)));
  const DY = window.innerWidth < 700 ? 70 : 104;   // vertical rise per card
  let pos = 0, target = 0, vel = 0, last = -1;
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  let running = false, raf = 0;
  let dragMoved = 0;
  let view = 'spiral';

  function wrapOffset(o) {
    o = ((o % N) + N) % N;
    return o > N / 2 ? o - N : o;
  }

  function render() {
    raf = requestAnimationFrame(render);
    if (!running) return;
    const prev = pos;
    pos += (target - pos) * 0.085;
    vel += ((pos - prev) - vel) * 0.25;
    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;
    const R = RAD();
    spiral.style.transform = `rotateX(${(-my * 6).toFixed(2)}deg) rotateY(${(mx * 10).toFixed(2)}deg)`;
    const bend = Math.max(-18, Math.min(18, vel * 260));
    for (let i = 0; i < N; i++) {
      const o = wrapOffset(i - pos);
      const ang = o * STEP;
      const abs = Math.abs(o);
      const el = cards[i];
      const vis = abs < N / 2 - 0.5;
      const blur = Math.max(0, abs - 1.1) * 2.4;
      el.style.transform = `rotateY(${ang.toFixed(2)}deg) translateZ(${R}px) translateY(${(o * DY).toFixed(1)}px) rotateY(${(-ang * 0.35).toFixed(2)}deg) skewY(${(bend * Math.sign(o || 1) * 0.3).toFixed(2)}deg) rotateZ(${(bend * 0.15).toFixed(2)}deg)`;
      el.style.opacity = vis ? Math.max(0, 1 - Math.max(0, abs - 2.4) * 0.28).toFixed(3) : 0;
      el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px) brightness(${(1 - Math.min(0.55, abs * 0.1)).toFixed(2)})` : 'none';
      el.style.zIndex = String(100 - Math.round(abs * 10));
      el.style.pointerEvents = abs < 2.6 ? 'auto' : 'none';
    }
    const cur = ((Math.round(pos) % N) + N) % N;
    if (cur !== last) {
      last = cur;
      const it = items[cur];
      capIndex.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      capTitle.textContent = it.title;
      capMeta.textContent = [it.client, it.kind].filter(Boolean).join(' · ');
      caption.classList.remove('swap'); void caption.offsetWidth; caption.classList.add('swap');
      if (running && Sound.enabled) Sound.tick();
    }
  }

  render();

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
      media.innerHTML = `<picture><source srcset="${it.full}" type="image/webp"><img src="${it.fullJpg}" alt="${it.title}" style="max-height:100%;width:auto;height:100%;object-fit:contain"></picture>`;
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
    setView,
    closeSheet,
  };
}
