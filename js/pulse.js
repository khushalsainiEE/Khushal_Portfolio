/* ============================================================
   PULSE — click the empty grid on the film side and a heartbeat
   ripples outward: a "lub" ring, then a softer "dub" ring.
   Dots sit on the grid's own intersections, almost invisible at
   rest; as a ring passes they swell, brighten and nudge outward,
   then settle back. Drawn on one canvas, only while a beat is live.
   ============================================================ */
const GRID = 48;          // must match .film-grid background-size
const OFFSET = -2;        // .film-grid is inset by -2px
const SPEED = 600;        // ring speed, px per second
const BAND = 90;          // ring thickness, px
const LIFE = 1.5;         // seconds a ring lives

export function initPulse(canvas, face) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let dots = [];
  const rings = [];
  let raf = 0;

  function layout() {
    const r = face.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dots = [];
    const cx = W / 2, cy = H / 2, maxD = Math.hypot(cx, cy);
    for (let y = OFFSET; y <= H + GRID; y += GRID) {
      for (let x = OFFSET; x <= W + GRID; x += GRID) {
        // same soft vignette as the grid lines, so edges fade out
        const v = 1 - Math.min(1, Math.max(0, (Math.hypot(x - cx, y - cy) / maxD - 0.3) / 0.55));
        if (v > 0.02) dots.push({ x: x + 0.5, y: y + 0.5, v });
      }
    }
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].t0 > (LIFE + rings[i].delay) * 1000) rings.splice(i, 1);
    if (!rings.length) { raf = 0; return; }

    for (const d of dots) {
      let I = 0, push = 0, ux = 0, uy = 0;
      for (const r of rings) {
        const t = (now - r.t0) / 1000 - r.delay;
        if (t < 0) continue;
        const dx = d.x - r.x, dy = d.y - r.y;
        const dist = Math.hypot(dx, dy) || 1;
        const front = t * SPEED;
        const k = Math.exp(-((dist - front) ** 2) / (2 * (BAND / 2) ** 2));   // gaussian ring
        const fade = Math.pow(1 - t / LIFE, 1.6);
        const near = Math.max(0, 1 - dist / 1100);                            // weaker far away
        const s = k * fade * near * r.power;
        if (s > I) { I = s; ux = dx / dist; uy = dy / dist; }
        push += s;
      }
      if (I < 0.01) continue;
      const off = Math.min(push, 1.2) * 9;
      const rad = 0.9 + I * 4.2;
      ctx.globalAlpha = Math.min(1, (0.12 + I * 1.1) * (0.35 + 0.65 * d.v));
      ctx.fillStyle = '#fafafa';
      ctx.beginPath();
      ctx.arc(d.x + ux * off, d.y + uy * off, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // a small flash where you clicked
    for (const r of rings) {
      const t = (now - r.t0) / 1000 - r.delay;
      if (t < 0 || t > 0.35) continue;
      ctx.globalAlpha = (1 - t / 0.35) * 0.5 * r.power;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 4 + t * 40, 0, Math.PI * 2);
      ctx.strokeStyle = '#fafafa';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  new ResizeObserver(layout).observe(face);
  layout();

  return {
    /** x, y in face coordinates */
    beat(x, y) {
      const t0 = performance.now();
      rings.push({ x, y, t0, delay: 0, power: 1 });       // lub
      rings.push({ x, y, t0, delay: 0.24, power: 0.6 });  // dub
      if (rings.length > 12) rings.splice(0, rings.length - 12);
      if (!raf) raf = requestAnimationFrame(draw);
    },
  };
}
