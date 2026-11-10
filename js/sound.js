/* ============================================================
   SOUND — every sound on the site is synthesized live with the
   Web Audio API. No audio files = nothing to license, ~0 KB load.
   ============================================================ */

let ctx = null;
let master = null;
let ambientBus = null;
let enabled = false;
let ambient = null;
let currentSide = 'research';
let lastHover = 0;

function init() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  ambientBus = ctx.createGain();
  ambientBus.gain.value = 0.0;
  ambientBus.connect(master);
}

function now() { return ctx.currentTime; }

function env(gainNode, t, a, peak, d) {
  const g = gainNode.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(peak, t + a);
  g.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ freq = 880, type = 'sine', a = 0.004, d = 0.12, peak = 0.2, glide = 0, detune = 0, delay = 0 }) {
  if (!ctx || !enabled) return;
  const t = now() + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detune;
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * glide), t + a + d);
  env(g, t, a, peak, d);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + a + d + 0.05);
}

let noiseBuf = null;
function noise({ a = 0.01, d = 0.3, peak = 0.2, f0 = 400, f1 = 4000, q = 0.8, type = 'bandpass', delay = 0 }) {
  if (!ctx || !enabled) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const t = now() + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(f0, t);
  filt.frequency.exponentialRampToValueAtTime(f1, t + a + d);
  const g = ctx.createGain();
  env(g, t, a, peak, d);
  src.connect(filt).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + a + d + 0.05);
}

/* ---------- ambient beds ----------
   research: a slow, glassy arpeggio over a soft drone (lab / circuit)
   film:     a warm detuned pad with a gentle tape-like wobble        */
function startAmbient(side) {
  stopAmbient();
  if (!ctx) return;
  const nodes = [];
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ambientBus);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = side === 'film' ? 900 : 1600;
  lp.Q.value = 0.5;
  lp.connect(out);

  const chord = side === 'film' ? [98.0, 146.83, 196.0, 233.08] : [110.0, 164.81, 220.0, 277.18];
  chord.forEach((f, i) => {
    [-7, 7].forEach((det) => {
      const o = ctx.createOscillator();
      o.type = side === 'film' ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      o.detune.value = det + i * 2;
      const g = ctx.createGain();
      g.gain.value = side === 'film' ? 0.018 : 0.03;
      o.connect(g).connect(lp);
      o.start();
      nodes.push(o);
    });
  });
  // slow filter breathing
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = side === 'film' ? 300 : 500;
  lfo.connect(lfoG).connect(lp.frequency);
  lfo.start();
  nodes.push(lfo);

  out.gain.linearRampToValueAtTime(1, now() + 2.5);

  let arpTimer = null;
  if (side === 'research') {
    const scale = [440, 554.37, 659.25, 830.61, 880, 1108.73];
    let step = 0;
    arpTimer = setInterval(() => {
      if (!enabled || document.hidden) return;
      const f = scale[(step * 3 + (step >> 2)) % scale.length];
      tone({ freq: f, type: 'sine', a: 0.01, d: 1.6, peak: 0.018 });
      step++;
    }, 1400);
  }
  ambient = { nodes, out, arpTimer };
}

function stopAmbient() {
  if (!ambient || !ctx) return;
  const a = ambient;
  ambient = null;
  clearInterval(a.arpTimer);
  a.out.gain.cancelScheduledValues(now());
  a.out.gain.setValueAtTime(a.out.gain.value, now());
  a.out.gain.linearRampToValueAtTime(0, now() + 0.8);
  setTimeout(() => a.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }), 1000);
}

/* ---------- public API ---------- */
export const Sound = {
  get enabled() { return enabled; },

  enable(on) {
    init();
    if (!ctx) return;
    enabled = on;
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(now());
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, now() + 0.4);
    ambientBus.gain.linearRampToValueAtTime(on ? 0.55 : 0, now() + 0.6);
    if (on && !ambient) startAmbient(currentSide);
    try { localStorage.setItem('ks-sound', on ? '1' : '0'); } catch (e) {}
    document.documentElement.classList.toggle('sound-on', on);
  },

  toggle() { this.enable(!enabled); if (enabled) this.click(); },

  setSide(side) {
    currentSide = side;
    if (enabled) startAmbient(side);
  },

  hover() {
    const t = performance.now();
    if (t - lastHover < 45) return;
    lastHover = t;
    tone({ freq: 2200 + Math.random() * 500, type: 'sine', a: 0.002, d: 0.04, peak: 0.05 });
  },
  tick() { tone({ freq: 3200, type: 'square', a: 0.001, d: 0.012, peak: 0.02 }); },
  click() {
    tone({ freq: 620, type: 'triangle', a: 0.002, d: 0.08, peak: 0.16, glide: 0.5 });
    noise({ a: 0.001, d: 0.03, peak: 0.08, f0: 3000, f1: 1500, q: 1.2 });
  },
  open() {
    tone({ freq: 330, type: 'sine', a: 0.01, d: 0.25, peak: 0.12, glide: 2 });
    noise({ a: 0.02, d: 0.25, peak: 0.05, f0: 600, f1: 5000 });
  },
  close() {
    tone({ freq: 660, type: 'sine', a: 0.01, d: 0.22, peak: 0.12, glide: 0.5 });
    noise({ a: 0.02, d: 0.2, peak: 0.05, f0: 5000, f1: 600 });
  },
  // the big one: page flip between research and film
  flip() {
    noise({ a: 0.08, d: 0.55, peak: 0.22, f0: 300, f1: 6000, q: 0.6 });
    noise({ a: 0.02, d: 0.9, peak: 0.08, f0: 8000, f1: 400, q: 0.4, delay: 0.35 });
    tone({ freq: 110, type: 'sine', a: 0.05, d: 0.9, peak: 0.25, glide: 0.5, delay: 0.5 });
    tone({ freq: 880, type: 'triangle', a: 0.005, d: 0.4, peak: 0.06, glide: 1.5, delay: 0.55 });
  },
  // chips dropping in on the hero / loader
  pop(i = 0) { tone({ freq: 500 + i * 120, type: 'sine', a: 0.003, d: 0.09, peak: 0.1, glide: 1.6 }); },
  // loader finishing — a little rising chord
  ready() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, type: 'triangle', a: 0.005, d: 0.5, peak: 0.07, delay: i * 0.06 }));
  },
  whoosh() { noise({ a: 0.03, d: 0.35, peak: 0.12, f0: 500, f1: 3500, q: 0.7 }); },
};

document.addEventListener('visibilitychange', () => {
  if (!ctx || !enabled) return;
  master.gain.linearRampToValueAtTime(document.hidden ? 0 : 0.9, now() + 0.3);
});
