/* ============================================================
   FILM SIDE — the VHS view (tapes, VCR, CRT) and the large-player sheet.
   ============================================================ */
import { FILMS, PHOTOS } from './content.js';
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';
import { initPulse } from './pulse.js';
import { initVhs } from './vhs.js';

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
  // interleave photos among films so the stack feels mixed
  const out = [];
  films.forEach((f, i) => { out.push(f); if (i % 3 === 2 && photos.length) out.push(photos.shift()); });
  return out.concat(photos);
}

export function initFilm({ face }) {
  const items = buildItems();
  let vhs = null;

  function prepare() { vhs && vhs.prepare(); }
  function enter() { vhs.show(); }
  function leave() { vhs.hide(); }          // stop the TV straight away

  // heartbeat on the empty grid
  const pulse = initPulse(face.querySelector('#filmPulse'), face);

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

  /* ---------- VHS view ---------- */
  const vhsRoot = face.querySelector('#vhs');
  vhs = initVhs({
    root: vhsRoot,
    items,
    setThumb, ytId, openSheet,
    thumbFor: (it) => thumbSources(it)[0] || '',
  });
  // the heartbeat works on the empty floor of the VHS view too
  vhsRoot.addEventListener('click', (e) => {
    if (e.target !== vhsRoot) return;
    const r = face.getBoundingClientRect();
    pulse.beat(e.clientX - r.left, e.clientY - r.top);
    Sound.beat();
  });

  return { prepare, enter, leave, closeSheet };
}
