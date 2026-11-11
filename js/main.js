/* ============================================================
   MAIN — research side, the flip, menu, sheets, terminal.
   ============================================================ */
import { PROFILE, RESEARCH, PROJECTS, EXPERIENCE } from './content.js';
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';
import { initFilm } from './film.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// <picture> with webp + jpg fallback; path is given without extension
const pic = (path, alt, attrs = '') => `<picture><source srcset="${path}.webp" type="image/webp"><img src="${path}.jpg" alt="${String(alt).replace(/"/g, '&quot;')}" loading="lazy" ${attrs}></picture>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let side = location.hash === '#film' ? 'film' : 'research';
let angle = side === 'film' ? 180 : 0;
let wafer = null;
let film = null;

const book = $('#book');
const faceR = $('#research');
const faceF = $('#film');
const scroller = $('#researchScroll');

/* ============================================================
   START — no loading screen: the research side opens directly.
   The wafer fades in once three.js arrives; chips drop once the
   fonts are ready (capped so a slow font never holds the page).
   ============================================================ */
import('./wafer.js')
  .then(({ createWafer }) => { wafer = createWafer($('#wafer')); activateSide(); })
  .catch(() => document.documentElement.classList.add('no-webgl'));

let chipsDropped = false;
let fontsReady = false;
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => {
  fontsReady = true;
  if (side === 'research') dropChips();
});

// sound needs a click before the browser allows it; the film side
// switches it on with the first click there (unless muted before)
function wakeSound(e) {
  if (e.target && e.target.closest && e.target.closest('#soundBtn')) return;   // the button handles itself
  if (side === 'film' && !Sound.enabled && Sound.wanted) Sound.enable(true);
}
window.addEventListener('pointerdown', wakeSound);
window.addEventListener('keydown', wakeSound);

/* ============================================================
   RESEARCH — render content
   ============================================================ */
// hero chips: mixed type, ToyFight-style
const chipRows = [
  [
    { t: PROFILE.first, cls: 'chip--lilac f-serif-i', r: -2 },
    { t: PROFILE.last, cls: 'chip--box f-pixel', r: 1.5 },
    { t: 'EE @ ASU', cls: 'chip--yellow f-mono small', r: -4 },
  ],
  [
    { t: 'Semiconductors', cls: 'f-sans', r: 0.8 },
    { t: '&amp;', cls: 'chip--pink f-serif', r: 6 },
    { t: 'Film', cls: 'chip--silicon f-pixel', r: -2.5 },
  ],
];
const heroH1 = $('.hero-chips');
const chips = [];
chipRows.forEach((row) => {
  const r = document.createElement('span');
  r.className = 'row';
  row.forEach((c) => {
    const s = document.createElement('span');
    s.className = `chip ${c.cls}`;
    s.innerHTML = c.t;
    s.style.setProperty('--r', c.r + 'deg');
    s.style.setProperty('--r0', (c.r * -4) + 'deg');
    s.dataset.depth = (0.4 + Math.random() * 0.9).toFixed(2);
    r.appendChild(s);
    chips.push(s);
  });
  heroH1.appendChild(r);
});
function dropChips() {
  if (chipsDropped || !fontsReady) return;
  chipsDropped = true;
  chips.forEach((c, i) => {
    setTimeout(() => {
      c.classList.add('in');
      c.addEventListener('animationend', () => { c.classList.remove('in'); c.classList.add('settled'); }, { once: true });
    }, reduced ? 0 : 120 * i);
  });
}
// chips drift with the mouse (parallax)
window.addEventListener('pointermove', (e) => {
  if (side !== 'research') return;
  const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
  chips.forEach((c) => {
    const d = +c.dataset.depth;
    c.style.setProperty('--mx', (nx * 26 * d).toFixed(1) + 'px');
    c.style.setProperty('--my', (ny * 18 * d).toFixed(1) + 'px');
  });
}, { passive: true });

// click / tap the wafer to spin it
$('#wafer').addEventListener('click', (e) => { wafer && wafer.burst(e.clientX < window.innerWidth / 2 ? -1 : 1); });

// statement: [[chip]] syntax, words light up as you scroll
const st = $('#statementText');
const chipColors = ['chip--mint', 'chip--yellow', 'chip--lilac', 'chip--pink'];
let ci = 0;
st.innerHTML = PROFILE.statement.split(/(\[\[.*?\]\])/).map((seg) => {
  if (seg.startsWith('[[')) return `<span class="w"><span class="chip ${chipColors[ci++ % chipColors.length]}">${esc(seg.slice(2, -2))}</span></span>`;
  return seg.split(/(\s+)/).map((w) => (w.trim() ? `<span class="w">${esc(w)}</span>` : w)).join('');
}).join('');
const words = $$('.w', st);

// about
$('#bio').innerHTML = PROFILE.bio.map((p) => `<p>${esc(p)}</p>`).join('');
$('#facts').innerHTML = PROFILE.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');

// research rows
$('#researchItems').innerHTML = RESEARCH.map((p, i) => `
  <article class="r-item reveal" data-rid="${p.id}">
    <figure class="r-media" data-cursor="open">
      ${p.cover ? pic(p.cover, p.coverCaption || p.title) : '<span class="r-wafer-ph"></span>'}
      ${p.coverCaption ? `<figcaption class="tag r-ph-note">${esc(p.coverCaption)}</figcaption>` : ''}
    </figure>
    <div class="r-body">
      <div class="r-title"><span class="num">(${String(i + 1).padStart(2, '0')})</span><h3><span class="chip">${esc(p.short)}</span></h3></div>
      <div class="r-tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <p class="r-question">${esc(p.question)}</p>
      ${p.stats ? `<dl class="r-stats">${p.stats.map((st) => `<div><dt>${esc(st.label)}</dt><dd>${esc(st.value)}</dd></div>`).join('')}</dl>` : ''}
      <p class="r-meta">${esc(p.year)} · ${esc(p.lab)}${p.sponsor ? ' · ' + esc(p.sponsor) : ''}</p>
      <button class="pill r-open" data-open="${p.id}">read the research <span class="arrow">→</span></button>
    </div>
  </article>`).join('');
$$('#researchItems [data-open], #researchItems .r-media').forEach((el) => el.addEventListener('click', () => openResearch(el.closest('.r-item').dataset.rid)));

// project cards
$('#projectItems').innerHTML = PROJECTS.map((p) => `
  <article class="p-card reveal" data-pid="${p.id}">
    <div class="p-top"><span class="mono-sm">${esc(p.year)}</span><span class="mono-sm">${esc(p.event)}</span></div>
    <h3 class="p-title">${esc(p.title)}</h3>
    <p class="p-sub">${esc(p.subtitle)}</p>
    <p class="p-role">${esc(p.role)}</p>
    <div class="r-tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <button class="pill r-open" data-popen="${p.id}">details <span class="arrow">→</span></button>
  </article>`).join('');
$$('[data-popen]').forEach((el) => el.addEventListener('click', () => openProject(el.dataset.popen)));

// experience
$('#otherItems').innerHTML = EXPERIENCE.map((o) => `
  <li class="reveal"><span class="w-org">${esc(o.org)}</span><span class="w-role">${esc(o.role)}</span><span class="w-note">${esc(o.note)}</span><span class="w-year">${esc(o.year)}</span></li>`).join('');

// contact + menu foot
const mail = $('#mailLink');
mail.href = 'mailto:' + PROFILE.email; mail.textContent = PROFILE.email;
const mm = $('#menuMail'); mm.href = 'mailto:' + PROFILE.email; mm.textContent = PROFILE.email;
$('#socials').innerHTML = PROFILE.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label} ↗</a>`).join('');
$('#menuSocials').innerHTML = PROFILE.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}">${s.short}</a>`).join('');
$('#yr').textContent = new Date().getFullYear();

/* ============================================================
   RESEARCH — smooth scroll + reveals
   ============================================================ */
const smooth = (() => {
  let target = 0, current = 0, active = false;
  const max = () => scroller.scrollHeight - scroller.clientHeight;
  if (!reduced && window.matchMedia('(pointer: fine)').matches) {
    scroller.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      if (!active) { target = current = scroller.scrollTop; }
      target = Math.max(0, Math.min(max(), target + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
      active = true;
    }, { passive: false });
  }
  function tick() {
    requestAnimationFrame(tick);
    if (!active) return;
    current += (target - current) * 0.1;
    if (Math.abs(target - current) < 0.4) { current = target; active = false; }
    scroller.scrollTop = current;
  }
  tick();
  return {
    to(y) {
      if (reduced) { scroller.scrollTop = y; return; }
      target = Math.max(0, Math.min(max(), y)); current = scroller.scrollTop; active = true;
    },
  };
})();

const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { root: scroller, threshold: 0.15 });
$$('.reveal, .about-photo', scroller).forEach((el) => io.observe(el));

const hero = $('.hero');
const statement = $('.statement');
const navPills = $$('.hud-center--research .pill');
const sections = navPills.map((p) => document.getElementById(p.dataset.goto));
// top bar: transparent over the hero, solid once you scroll; slides away while
// scrolling down and comes back as soon as you scroll up
let lastY = 0;
scroller.addEventListener('scroll', () => {
  const yy = scroller.scrollTop;
  document.body.classList.toggle('hud-solid', yy > 40);
  if (Math.abs(yy - lastY) > 6) {
    const away = yy > lastY && yy > window.innerHeight * 0.6 && !menu.classList.contains('open');
    document.body.classList.toggle('hud-away', away);
    lastY = yy;
  }
}, { passive: true });

scroller.addEventListener('scroll', () => {
  const y = scroller.scrollTop;
  const h = hero.offsetHeight;
  wafer && wafer.setScroll(y / h);
  wafer && wafer.setActive(side === 'research' && y < h * 1.05);
  // statement words
  const r = statement.getBoundingClientRect();
  const p = (window.innerHeight * 0.85 - r.top) / (r.height * 0.9);
  const n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
  // active nav pill
  let cur = -1;
  sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = i; });
  navPills.forEach((pl, i) => pl.classList.toggle('is-active', i === cur));
}, { passive: true });

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 70;
  smooth.to(id === 'top' ? 0 : top);
}
$$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); Sound.click(); goTo(a.dataset.goto); }));
$('.logo').addEventListener('click', (e) => {
  e.preventDefault(); Sound.click();
  if (side === 'film') flip('research'); else goTo('top');
});

/* ============================================================
   THE FLIP
   ============================================================ */
function activateSide() {
  document.body.classList.toggle('side-research', side === 'research');
  document.body.classList.toggle('side-film', side === 'film');
  faceR.classList.toggle('is-inactive', side !== 'research');
  faceF.classList.toggle('is-inactive', side !== 'film');
  faceR.inert = side !== 'research';
  faceF.inert = side !== 'film';
  wafer && wafer.setActive(side === 'research' && scroller.scrollTop < hero.offsetHeight);
  Sound.setSide(side);
  if (side === 'research') dropChips();
  $('meta[name="theme-color"]').content = side === 'film' ? '#0a0a0a' : '#f3f0e8';
  document.title = side === 'film' ? 'Khushal Saini ✲ Film' : 'Khushal Saini ✲ Research & Film';
}

let flipping = false;
function flip(to) {
  to = to || (side === 'research' ? 'film' : 'research');
  if (to === side || flipping) return;
  flipping = true;
  closeMenu(true);
  Cursor.tag(null);
  if (to === 'film') {
    // this click is the visitor's gesture, so audio is allowed to start here
    if (Sound.wanted && !Sound.enabled) Sound.enable(true);
    Sound.setSide('film');
    Sound.flip();
    film.prepare();          // cards gathered and hidden while the page turns
  } else {
    Sound.setSide('research');
    film.leave();
  }
  faceR.classList.remove('is-inactive');
  faceF.classList.remove('is-inactive');
  if (reduced) {
    angle += 180; book.style.transform = `rotateY(${angle}deg)`;
    side = to; activateSide(); if (to === 'film') film.enter(); flipping = false;
    history.replaceState(null, '', to === 'film' ? '#film' : '#research');
    return;
  }
  book.classList.add('is-flipping');
  const a = angle;
  const anim = book.animate([
    { transform: `rotateY(${a}deg) scale(1)` },
    { transform: `rotateY(${a + 40}deg) scale(0.86)`, offset: 0.25 },
    { transform: `rotateY(${a + 140}deg) scale(0.86)`, offset: 0.75 },
    { transform: `rotateY(${a + 180}deg) scale(1)` },
  ], { duration: 1300, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  setTimeout(() => {
    side = to;
    document.body.classList.toggle('side-research', side === 'research');
    document.body.classList.toggle('side-film', side === 'film');
  }, 650);
  // start dealing the cards as the film face settles, so the motion is continuous
  if (to === 'film') setTimeout(() => film.enter(), 1050);
  anim.onfinish = () => {
    angle = a + 180;
    book.style.transform = `rotateY(${angle}deg)`;
    book.classList.remove('is-flipping');
    activateSide();
    flipping = false;
    history.replaceState(null, '', to === 'film' ? '#film' : '#research');
  };
}
$('#flipBtn').addEventListener('click', () => flip());
$$('[data-flip]').forEach((b) => b.addEventListener('click', () => flip('film')));
window.addEventListener('hashchange', () => { if (location.hash === '#film') flip('film'); else if (location.hash === '#research') flip('research'); });

/* ============================================================
   MENU
   ============================================================ */
const menu = $('#menu');
const menuBtn = $('#menuBtn');
$$('.menu-links a').forEach((a, li) => {
  const word = a.textContent.trim();
  a.style.setProperty('--li', li);
  a.querySelector('span').innerHTML = [...word].map((ch, i) => `<span class="ch" style="--ci:${i}"><b>${ch}</b><b aria-hidden="true">${ch}</b></span>`).join('');
  a.setAttribute('aria-label', word);
  a.addEventListener('pointerenter', () => Sound.hover());
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const dest = a.dataset.menu;
    Sound.click();
    if (dest === 'film') { closeMenu(); setTimeout(() => flip('film'), 350); return; }
    if (side === 'film') { closeMenu(); setTimeout(() => { flip('research'); setTimeout(() => goTo(dest === 'research' ? 'research-list' : dest), 1450); }, 350); return; }
    closeMenu();
    goTo(dest === 'research' ? 'research-list' : dest);
  });
});
function openMenu() {
  document.body.classList.remove('hud-away');
  menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false'); menuBtn.setAttribute('aria-expanded', 'true');
  $$('.menu-links a').forEach((a) => a.classList.toggle('is-current', a.dataset.menu === side));
  Sound.open();
}
function closeMenu(silent) {
  if (!menu.classList.contains('open')) return;
  menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); menuBtn.setAttribute('aria-expanded', 'false');
  if (!silent) Sound.close();
}
menuBtn.addEventListener('click', openMenu);
$$('[data-close-menu]').forEach((b) => b.addEventListener('click', () => closeMenu()));

/* ============================================================
   RESEARCH PROJECT SHEET (with "LOADING PLS WAIT")
   ============================================================ */
const rsheet = $('#rsheet');
const rbody = $('#rsheetBody');
function showSheet() {
  rsheet.classList.add('open');
  rsheet.setAttribute('aria-hidden', 'false');
  rbody.scrollTop = 0;
  requestAnimationFrame(() => setTimeout(() => rsheet.classList.add('shown'), 120));
}

function openResearch(id) {
  const p = RESEARCH.find((x) => x.id === id);
  if (!p) return;
  let d = 0;
  const D = () => `style="--d:${d++}"`;
  const sec = (x) => `
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">${esc(x.h)}</h3>
      <div class="rs-sec-grid${x.fig ? '' : ' no-fig'}">
        <ul class="rs-points">${x.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${x.fig ? `<figure class="rs-fig">${pic(x.fig, x.figCaption)}<figcaption>${esc(x.figCaption)}</figcaption></figure>` : ''}
      </div>
      ${x.fig2 ? `<figure class="rs-fig rs-fig--wide">${pic(x.fig2, x.fig2Caption)}<figcaption>${esc(x.fig2Caption)}</figcaption></figure>` : ''}
    </section>`;
  rbody.innerHTML = `
    <div class="rs-top" ${D()}><span class="num">${esc(p.year)}</span>${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <h2 class="rs-title rs-title--long" ${D()}>${esc(p.title)}</h2>
    <div class="rs-intro" ${D()}>
      <div>
        <p class="rs-q-label mono-sm">Research question</p>
        <p class="rs-question">${esc(p.question)}</p>
        <p class="rs-summary">${esc(p.summary)}</p>
      </div>
      <figure class="rs-cover">${pic(p.cover, p.coverCaption)}<figcaption>${esc(p.coverCaption)}</figcaption></figure>
    </div>
    <dl class="rs-stats" ${D()}>${p.stats.map((st) => `<div><dt>${esc(st.label)}</dt><dd>${esc(st.value)}</dd><p>${esc(st.note)}</p></div>`).join('')}</dl>
    <dl class="facts rs-meta" ${D()}>
      <div><dt>Group</dt><dd>${esc(p.lab)}</dd></div>
      <div><dt>Mentor</dt><dd>${esc(p.mentor)}</dd></div>
      <div><dt>Sponsor</dt><dd>${esc(p.sponsor)}</dd></div>
    </dl>
    ${p.sections.map(sec).join('')}
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">Proposed fabrication</h3>
      <ol class="rs-steps">${p.fabrication.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
      <p class="rs-note">${esc(p.fabricationNote)}</p>
    </section>
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">Benchmark</h3>
      <div class="rs-table-wrap"><table class="rs-table">
        <thead><tr>${p.benchmark.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${p.benchmark.rows.map((r, i) => `<tr${i === p.benchmark.rows.length - 1 ? ' class="is-me"' : ''}>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="rs-note">${esc(p.benchmark.note)}</p>
    </section>
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">Next</h3>
      <p class="rs-summary">${esc(p.next)}</p>
    </section>
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">Poster</h3>
      <a class="rs-poster" href="${esc(p.pdf)}" target="_blank" rel="noopener" aria-label="Open the full poster PDF">${pic(p.poster, p.title + ' research poster')}</a>
      <div class="rs-links"><a class="pill" href="${esc(p.pdf)}" target="_blank" rel="noopener">open poster PDF ↗</a>${p.expo ? `<a class="pill pill--line" href="${esc(p.expo.url)}" target="_blank" rel="noopener">${esc(p.expo.label)} ↗</a>` : ''}</div>
      <p class="rs-note">${esc(p.thanks)}</p>
    </section>
  `;
  showSheet();
}

function openProject(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  let d = 0;
  const D = () => `style="--d:${d++}"`;
  rbody.innerHTML = `
    <div class="rs-top" ${D()}><span class="num">${esc(p.year)}</span><span class="tag">${esc(p.event)}</span></div>
    <h2 class="rs-title" ${D()}>${esc(p.title)}</h2>
    <p class="rs-question" ${D()}>${esc(p.subtitle)}</p>
    <dl class="facts rs-meta" ${D()}>
      <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
      <div><dt>Event</dt><dd>${esc(p.event)}</dd></div>
      <div><dt>Built with</dt><dd>${esc(p.tags.join(' · '))}</dd></div>
    </dl>
    <section class="rs-sec" ${D()}>
      <h3 class="rs-h">What I did</h3>
      <ul class="rs-points">${p.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>
    ${p.images.length ? `<section class="rs-sec" ${D()}><h3 class="rs-h">Photos</h3><div class="rs-gallery">${p.images.map((s) => pic(s, p.title)).join('')}</div></section>` : ''}
  `;
  showSheet();
}
function closeResearch() {
  if (!rsheet.classList.contains('open')) return;
  rsheet.classList.remove('shown', 'open');
  rsheet.setAttribute('aria-hidden', 'true');
}
$$('[data-close-rsheet]').forEach((b) => b.addEventListener('click', closeResearch));

/* ============================================================
   TERMINAL  ( press / )
   ============================================================ */
const term = $('#term');
const tIn = $('#termInput');
const tLog = $('#termLog');
const HELP = 'commands: research · film · about · contact · spin · sound on|off · bw · invert · reset · close';
function tPrint(s) { tLog.textContent += s + '\n'; tLog.scrollTop = tLog.scrollHeight; }
function openTerm() { term.classList.add('open'); term.setAttribute('aria-hidden', 'false'); tLog.textContent = ''; tPrint(HELP); setTimeout(() => tIn.focus(), 50); Sound.open(); }
function closeTerm() { term.classList.remove('open'); term.setAttribute('aria-hidden', 'true'); tIn.blur(); }
tIn.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const cmd = tIn.value.trim().toLowerCase();
  tIn.value = '';
  tPrint('> ' + cmd);
  Sound.tick();
  const run = {
    help: () => tPrint(HELP),
    research: () => { closeTerm(); flip('research'); },
    film: () => { closeTerm(); flip('film'); },
    about: () => { closeTerm(); if (side === 'film') { flip('research'); setTimeout(() => goTo('about'), 1450); } else goTo('about'); },
    contact: () => { closeTerm(); if (side === 'film') { flip('research'); setTimeout(() => goTo('contact'), 1450); } else goTo('contact'); },
    spin: () => { if (side === 'research') { wafer && wafer.burst(1); tPrint('wheee'); } else tPrint('the wafer lives on the research side'); },
    'sound on': () => { Sound.enable(true); tPrint('sound on'); },
    'sound off': () => { Sound.enable(false); tPrint('sound off'); },
    bw: () => { document.documentElement.classList.remove('fx-invert'); document.documentElement.classList.add('fx-bw'); },
    invert: () => { document.documentElement.classList.remove('fx-bw'); document.documentElement.classList.add('fx-invert'); },
    reset: () => document.documentElement.classList.remove('fx-bw', 'fx-invert'),
    close: closeTerm,
  }[cmd];
  run ? run() : tPrint(`unknown: "${cmd}" — type help`);
});
term.addEventListener('click', (e) => { if (e.target === term) closeTerm(); });

/* ============================================================
   GLOBAL KEYS + SOUND BUTTON
   ============================================================ */
window.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if (e.key === 'Escape') { closeTerm(); closeMenu(); closeResearch(); }
  if (e.key === '/' && !typing) { e.preventDefault(); openTerm(); }
  if ((e.key === 'f' || e.key === 'F') && !typing && !e.metaKey && !e.ctrlKey) flip();
});
$('#soundBtn').addEventListener('click', () => Sound.toggle());

/* ============================================================
   BOOT
   ============================================================ */
Cursor.init();
film = initFilm({ face: faceF });
book.style.transform = `rotateY(${angle}deg)`;
activateSide();
if (side === 'film') film.enter();
