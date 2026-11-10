/* ============================================================
   CURSOR — a blend-mode dot that eases after the mouse, swells
   over anything clickable and can carry a little label tag.
   ============================================================ */
const el = document.getElementById('cursor');
const fine = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let x = -100, y = -100, tx = -100, ty = -100;
let tagText = null;
const tagEl = el ? el.querySelector('.c-tag') : null;

export const Cursor = {
  init() {
    if (!fine || !el) return;
    document.body.classList.add('has-cursor');
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    window.addEventListener('pointerdown', () => el.classList.add('is-down'));
    window.addEventListener('pointerup', () => el.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => (el.style.opacity = '0'));
    document.addEventListener('pointerenter', () => (el.style.opacity = '1'));

    // anything interactive swells the dot; data-cursor="label" shows a tag
    document.addEventListener('pointerover', (e) => {
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

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  },
  tag(text) {
    if (!fine || !el) return;
    tagText = text;
    if (text) { tagEl.textContent = text; el.classList.add('is-tag'); el.classList.remove('is-hover'); }
    else el.classList.remove('is-tag');
  },
};
