/* ============================================================
   CURSOR
   • Research side: the normal system cursor (simple, zero lag).
   • Film side: a white dot that sits exactly on the pointer —
     moved on every pointer event, no easing — which swells over
     clickable things and can carry a small label tag.
   ============================================================ */
const el = document.getElementById('cursor');
const tagEl = el ? el.querySelector('.c-tag') : null;
const fine = window.matchMedia('(pointer: fine)').matches;
const onFilm = () => document.body.classList.contains('side-film');

export const Cursor = {
  init() {
    if (!fine || !el) return;
    document.body.classList.add('has-cursor');   // CSS hides the system cursor on the film side only

    const move = (e) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', (e) => { move(e); el.classList.add('is-down'); });
    window.addEventListener('pointerup', () => el.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => el.classList.add('is-out'));
    document.documentElement.addEventListener('pointerenter', () => el.classList.remove('is-out'));

    document.addEventListener('pointerover', (e) => {
      if (!onFilm()) return;
      const t = e.target.closest('a, button, [data-cursor], input');
      if (!t) return;
      if (t.dataset.cursor && t.dataset.cursor !== 'top') this.tag(t.dataset.cursor);
      else if (!t.classList.contains('s-card')) el.classList.add('is-hover');
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('a, button, [data-cursor], input');
      if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      el.classList.remove('is-hover');
      if (t.dataset.cursor) this.tag(null);
    });
  },
  tag(text) {
    if (!fine || !el) return;
    if (text && onFilm()) { tagEl.textContent = text; el.classList.add('is-tag'); el.classList.remove('is-hover'); }
    else el.classList.remove('is-tag', 'is-hover');
  },
};
