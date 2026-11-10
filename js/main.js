/* ============================================================
   MAIN — loader, research side, the flip, menu, sheets, terminal.
   ============================================================ */
import { PROFILE, RESEARCH, OTHER } from './content.js';
import { Sound } from './sound.js';
import { Cursor } from './cursor.js';
import { initFilm } from './film.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
   LOADER
   ============================================================ */
const loader = $('#loader');
const curtain = $('.curtain', loader);
const COLS = window.innerWidth < 700 ? 8 : 14;
curtain.style.setProperty('--cols', COLS);
for (let i = 0; i < COLS; i++) {
  const c = document.createElement('i');
  c.style.transitionDelay = `${Math.abs(i - COLS / 2) * 35}ms`;
  curtain.appendChild(c);
}
const bar = $('.loader-bar i', loader);
let progress = 0;
const setP = (p) => { progress = Math.max(progress, p); bar.style.setProperty('--p', progress); };

const waits = [
  document.fonts.ready.then(() => setP(0.35)),
  new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = PROFILE.photo + '.webp'; }).then(() => setP(0.6)),
  new Promise((res) => {
    import('./wafer.js')
      .then(({ createWafer }) => { wafer = createWafer($('#wafer'), { onReady: res }); })
      .catch(() => { document.documentElement.classList.add('no-webgl'); res(); });
  }).then(() => setP(0.9)),
  new Promise((r) => setTimeout(r, 900)),
];
const maxWait = new Promise((r) => setTimeout(r, 4000));
Promise.race([Promise.all(waits), maxWait]).then(() => {
  setP(1);
  setTimeout(() => loader.classList.add('ready'), 250);
});

function enterSite(withSound) {
  if (loader.classList.contains('out')) return;
  Sound.enable(withSound);
  Sound.setSide(side);
  if (withSound) Sound.ready();
  loader.classList.add('out');
  document.body.classList.remove('is-loading');
  setTimeout(() => { loader.classList.add('gone'); }, 1300);
  setTimeout(dropChips, 450);
  activateSide();
}
$$('[data-enter]', loader).forEach((b) => b.addEventListener('click', () => enterSite(b.dataset.enter === 'sound')));
window.addEventListener('keydown', (e) => { if (e.key === 'Enter' && loader.classList.contains('ready')) enterSite(localStorage.getItem('ks-sound') !== '0'); });

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
    s.addEventListener('pointerenter', () => Sound.hover());
    r.appendChild(s);
    chips.push(s);
  });
  heroH1.appendChild(r);
});
function dropChips() {
  chips.forEach((c, i) => {
    setTimeout(() => {
      c.classList.add('in');
      Sound.pop(i);
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
$('#wafer').addEventListener('click', (e) => { wafer && wafer.burst(e.clientX < window.innerWidth / 2 ? -1 : 1); Sound.whoosh(); });

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
    <div class="r-media" data-cursor="open">
      ${p.poster ? `<img src="${esc(p.poster)}" alt="${esc(p.title)} poster" loading="lazy">` : `<span class="r-wafer-ph"></span><span class="tag r-ph-note">poster coming soon</span>`}
    </div>
    <div class="r-body">
      <div class="r-title"><span class="num">(${String(i + 1).padStart(2, '0')})</span><h3><span class="chip">${esc(p.short)}</span></h3></div>
      <div class="r-tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <p class="r-summary">${esc(p.summary)}</p>
      <p class="r-meta">${esc(p.year)} · ${esc(p.lab)}</p>
      <button class="pill r-open" data-open="${p.id}">open project <span class="arrow">→</span></button>
    </div>
  </article>`).join('');
$$('[data-open], .r-media').forEach((el) => el.addEventListener('click', () => openResearch(el.closest('.r-item').dataset.rid)));

// other work
$('#otherItems').innerHTML = OTHER.map((o) => `
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
  film && film.setActive(side === 'film');
  $('meta[name="theme-color"]').content = side === 'film' ? '#0a0a0a' : '#f3f0e8';
  document.title = side === 'film' ? 'Khushal Saini ✲ Film' : 'Khushal Saini ✲ Research & Film';
}

let flipping = false;
function flip(to) {
  to = to || (side === 'research' ? 'film' : 'research');
  if (to === side || flipping) return;
  flipping = true;
  closeMenu(true);
  Sound.flip();
  Cursor.tag(null);
  faceR.classList.remove('is-inactive');
  faceF.classList.remove('is-inactive');
  if (reduced) {
    angle += 180; book.style.transform = `rotateY(${angle}deg)`;
    side = to; activateSide(); flipping = false; history.replaceState(null, '', to === 'film' ? '#film' : '#research');
    return;
  }
  book.classList.add('is-flipping');
  const a = angle;
  const anim = book.animate([
    { transform: `rotateY(${a}deg) scale(1)` },
    { transform: `rotateY(${a + 40}deg) scale(0.86)`, offset: 0.25 },
    { transform: `rotateY(${a + 140}deg) scale(0.86)`, offset: 0.75 },
    { transform: `rotateY(${a + 180}deg) scale(1)` },
  ], { duration: 1400, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  setTimeout(() => {
    side = to;
    document.body.classList.toggle('side-research', side === 'research');
    document.body.classList.toggle('side-film', side === 'film');
    Sound.setSide(side);
  }, 700);
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
function openResearch(id) {
  const p = RESEARCH.find((x) => x.id === id);
  if (!p) return;
  Sound.click();
  const words2 = p.title.split(' ');
  const titleHtml = words2.length > 1 ? `${esc(words2.slice(0, -1).join(' '))} <em>${esc(words2.at(-1))}</em>` : esc(p.title);
  rbody.innerHTML = `
    <div class="rs-top" style="--d:0"><span class="num">${esc(p.year)}</span>${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <h2 class="rs-title" style="--d:1">${titleHtml}</h2>
    <div class="rs-grid" style="--d:2">
      <div>
        <p class="rs-summary">${esc(p.summary)}</p>
        <p class="rs-h">Key findings</p>
        <ul class="rs-findings">${p.findings.map((f, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(f)}</li>`).join('')}</ul>
        ${p.links.length ? `<div class="rs-links">${p.links.map((l) => `<a class="pill" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      </div>
      <aside class="rs-side"><dl class="facts">
        <div><dt>Lab</dt><dd>${esc(p.lab)}</dd></div>
        <div><dt>When</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>Focus</dt><dd>${esc(p.tags.join(', '))}</dd></div>
      </dl></aside>
    </div>
    <p class="rs-h" style="--d:3">Poster</p>
    ${p.poster ? `<figure class="rs-poster" style="--d:3"><img src="${esc(p.poster)}" alt="${esc(p.title)} research poster" loading="lazy"></figure>` : `<div class="rs-empty" style="--d:3">poster goes here — add the file path in js/content.js</div>`}
    <p class="rs-h" style="--d:4">Figures</p>
    ${p.images.length ? `<div class="rs-gallery" style="--d:4">${p.images.map((s) => `<img src="${esc(s)}" alt="" loading="lazy">`).join('')}</div>` : `<div class="rs-empty" style="--d:4">figures and lab photos go here</div>`}
  `;
  rsheet.classList.add('open', 'loading');
  rsheet.setAttribute('aria-hidden', 'false');
  rbody.scrollTop = 0;
  setTimeout(() => {
    rsheet.classList.remove('loading');
    Sound.open();
    setTimeout(() => rsheet.classList.add('shown'), 150);
  }, reduced ? 0 : 750);
}
function closeResearch() {
  if (!rsheet.classList.contains('open')) return;
  Sound.close();
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
  if (e.key === '/' && !typing && loader.classList.contains('gone')) { e.preventDefault(); openTerm(); }
  if ((e.key === 'f' || e.key === 'F') && !typing && !e.metaKey && !e.ctrlKey && loader.classList.contains('gone')) flip();
});
$('#soundBtn').addEventListener('click', () => Sound.toggle());

/* ============================================================
   BOOT
   ============================================================ */
Cursor.init();
film = initFilm({ face: faceF });
book.style.transform = `rotateY(${angle}deg)`;
document.body.classList.add(side === 'film' ? 'side-film' : 'side-research');
faceR.classList.toggle('is-inactive', side !== 'research');
faceF.classList.toggle('is-inactive', side !== 'film');
