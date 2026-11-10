/* ============================================================
   SOUND — film side only. Every effect is synthesized live with
   the Web Audio API (no audio files, nothing to license).
   The research side is deliberately silent, and there is no
   background music.
   ============================================================ */

let ctx = null;
let master = null;
let enabled = false;          // audio context running + not muted
let side = 'research';
let lastHover = 0;

const PREF_KEY = 'ks-sound';
function readPref() { try { return localStorage.getItem(PREF_KEY); } catch (e) { return null; } }
function writePref(v) { try { localStorage.setItem(PREF_KEY, v); } catch (e) {} }

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  return true;
}

const now = () => ctx.currentTime;
const live = (force) => ctx && enabled && (side === 'film' || force);

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ freq = 880, type = 'sine', a = 0.004, d = 0.12, peak = 0.2, glide = 0, delay = 0, force = false }) {
  if (!live(force)) return;
  const t = now() + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * glide), t + a + d);
  env(g, t, a, peak, d);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + a + d + 0.05);
}

let noiseBuf = null;
function noise({ a = 0.01, d = 0.3, peak = 0.2, f0 = 400, f1 = 4000, q = 0.8, delay = 0, force = false }) {
  if (!live(force)) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const t = now() + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + a + d);
  const g = ctx.createGain();
  env(g, t, a, peak, d);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random());
  src.stop(t + a + d + 0.05);
}

export const Sound = {
  get enabled() { return enabled; },
  /** true unless the visitor muted it before */
  get wanted() { return readPref() !== '0'; },

  /** must be called from a click / key handler (browser autoplay rules) */
  enable(on) {
    if (!init()) return;
    enabled = on;
    if (ctx.state === 'suspended') ctx.resume();
    master.gain.cancelScheduledValues(now());
    master.gain.setValueAtTime(master.gain.value, now());
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, now() + 0.25);
    writePref(on ? '1' : '0');
    document.documentElement.classList.toggle('sound-on', on);
  },
  toggle() { this.enable(!enabled); if (enabled) this.click(); },
  setSide(s) { side = s; },

  hover() {
    const t = performance.now();
    if (t - lastHover < 45) return;
    lastHover = t;
    tone({ freq: 2200 + Math.random() * 500, a: 0.002, d: 0.04, peak: 0.05 });
  },
  tick() { tone({ freq: 3200, type: 'square', a: 0.001, d: 0.012, peak: 0.02 }); },
  click() {
    tone({ freq: 620, type: 'triangle', a: 0.002, d: 0.08, peak: 0.16, glide: 0.5 });
    noise({ a: 0.001, d: 0.03, peak: 0.08, f0: 3000, f1: 1500, q: 1.2 });
  },
  open() {
    tone({ freq: 330, a: 0.01, d: 0.25, peak: 0.12, glide: 2 });
    noise({ a: 0.02, d: 0.25, peak: 0.05, f0: 600, f1: 5000 });
  },
  close() {
    tone({ freq: 660, a: 0.01, d: 0.22, peak: 0.12, glide: 0.5 });
    noise({ a: 0.02, d: 0.2, peak: 0.05, f0: 5000, f1: 600 });
  },
  whoosh() { noise({ a: 0.03, d: 0.35, peak: 0.12, f0: 500, f1: 3500, q: 0.7 }); },
  /** the flip into the film side */
  flip() {
    const force = true;
    noise({ a: 0.08, d: 0.55, peak: 0.22, f0: 300, f1: 6000, q: 0.6, force });
    noise({ a: 0.02, d: 0.9, peak: 0.08, f0: 8000, f1: 400, q: 0.4, delay: 0.35, force });
    tone({ freq: 110, a: 0.05, d: 0.9, peak: 0.25, glide: 0.5, delay: 0.5, force });
    tone({ freq: 880, type: 'triangle', a: 0.005, d: 0.4, peak: 0.06, glide: 1.5, delay: 0.55, force });
  },
  /** cards landing in the spiral */
  deal(i) { tone({ freq: 420 + i * 70, a: 0.003, d: 0.07, peak: 0.05, glide: 1.4 }); },
};
