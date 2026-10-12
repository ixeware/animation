// Core helpers shared by every module: math, easing, timing, colors, seeded randomness.
export const W = 1080, H = 1920, FPS = 30;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
export const ease = {
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  expo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
// progress of t through [a, b] with easing (default smooth)
export const seg = (t, a, b, e = smooth) => e(inv(a, b, t));
// fade in over [a, a+fi], hold, fade out over [b-fo, b]
export const env = (t, a, b, fi = 0.25, fo = 0.25) =>
  Math.min(fi > 0 ? inv(a, a + fi, t) : t >= a ? 1 : 0, fo > 0 ? 1 - inv(b - fo, b, t) : t <= b ? 1 : 0);
// decaying pulse after time a (1 -> 0 over d seconds)
export const pulse = (t, a, d = 0.4) => (t < a ? 0 : Math.exp(-((t - a) / d) * 3) * (t - a < d * 3 ? 1 : 0));

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
}
export const hash = (n) => { const r = rng(Math.floor(n * 9301 + 49297)); r(); return r(); };
// smooth value noise for camera drift
export function noise1(x, seed = 1) {
  const i = Math.floor(x), f = x - i;
  const a = hash(i * 13.1 + seed * 71.7), b = hash((i + 1) * 13.1 + seed * 71.7);
  return lerp(a, b, smooth(f)) * 2 - 1;
}

export const C = {
  bg: '#0E1216', bgDeep: '#05090D', sq1: '#1E2427', sq2: '#2C3438',
  lime: '#B8E65A', red: '#FF6B4F', blue: '#6CB8FF', gold: '#F5C451', amber: '#E8A23A',
  teal: '#2FD3B5', cream: '#F3EBDD', white: '#F2F2F2',
};
export const capColor = { lime: C.lime, red: C.red, blue: C.blue, gold: C.gold };

export function rgba(hex, a = 1) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export function mix(h1, h2, t) {
  const p = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const a = p(h1), b = p(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

// keyframe track: [[t, value], ...] -> value at t (numbers or arrays), eased between keys
export function track(keys, t, e = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const u = e(inv(t0, t1, t));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

export function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
