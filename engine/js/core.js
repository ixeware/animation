// Core helpers shared by every module: math, easing, timing, colors, seeded randomness.
export const W = 1080, H = 1920, FPS = 30;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
// a CSS cubic-bezier(x1, y1, x2, y2) as an easing function of progress 0..1 (Newton steps, bisection if they stall)
export function bezier(x1, y1, x2, y2) {
  const f = (t, a, b) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
  const df = (t, a, b) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const d = df(t, x1, x2), e = f(t, x1, x2) - x; if (Math.abs(e) < 1e-6) return f(t, y1, y2); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) { const e = f(t, x1, x2) - x; if (Math.abs(e) < 1e-6) break; if (e > 0) hi = t; else lo = t; t = (lo + hi) / 2; }
    return f(t, y1, y2);
  };
}
export const ease = {
  // Emil Kowalski's strong curves (emilkowalski/skills, MIT): ui for anything entering or leaving, move for on-screen travel
  ui: bezier(0.23, 1, 0.32, 1),
  move: bezier(0.77, 0, 0.175, 1),
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  expo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // quintic in-out: nearly all the travel happens in the middle third (camera fly-arounds, whips)
  whip: t => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
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
  // muted film palette for on-screen graphics (no neon)
  lime: '#A8C66C', red: '#E0603F', blue: '#7AA6D6', gold: '#E9B654', amber: '#D9902F',
  teal: '#5FA8A0', cream: '#F2E8D6', white: '#F2F2F2', ink: '#16120E',
  accent: '#1BADA6',  // the teal of `brilliant`: label strips and key badges (STYLE_BIBLE rule 33)
};
// karaoke caption colours stay bright for legibility
export const capColor = { lime: '#B8E65A', red: '#FF6B4F', blue: '#6CB8FF', gold: '#F5C451' };

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
// keys: [[t, value, ease?], ...]; a key's own ease (3rd element) shapes the segment that ends at it
export function track(keys, t, e = smooth) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1, e1] = keys[i + 1];
    if (t <= t1) {
      const u = (e1 || e)(inv(t0, t1, t));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
}

// ---------- supersampling (render.mjs --scale 2, the page's ?ss=2): every canvas of the engine gets a backing store SS
// times larger and its 2D context a base scale of SS, so all drawing code keeps working in 1080 × 1920 units and the
// frame comes out SS times sharper (SS = 2: 2160 × 3840). The canvas reports its size in those units too. What the
// canvas API measures in device pixels whatever the transform — blur and shadow sizes, the source rectangle of
// drawImage, getImageData and putImageData — is scaled here, in one place ----------
export const SS = Math.max(1, Math.min(4, Math.round(+new URLSearchParams(globalThis.location?.search || '').get('ss') || 1)));
const SCALED = new WeakSet(), RAW = {};
export function sizeCanvas(c, w, h) {
  if (SS === 1) { c.width = w; c.height = h; return c; }
  SCALED.add(c);
  const base = () => { if (c.__g2d) RAW.setTransform.call(c.__g2d, SS, 0, 0, SS, 0, 0); };  // a resize resets the context
  Object.defineProperty(c, 'width', { configurable: true, get: () => RAW.w.get.call(c) / SS, set: v => { RAW.w.set.call(c, Math.round(v * SS)); base(); } });
  Object.defineProperty(c, 'height', { configurable: true, get: () => RAW.h.get.call(c) / SS, set: v => { RAW.h.set.call(c, Math.round(v * SS)); base(); } });
  c.width = w; c.height = h;
  return c;
}
export function makeCanvas(w = W, h = H) { return sizeCanvas(document.createElement('canvas'), w, h); }
if (SS > 1) {
  const CP = HTMLCanvasElement.prototype, XP = CanvasRenderingContext2D.prototype, on = g => SCALED.has(g.canvas);
  RAW.w = Object.getOwnPropertyDescriptor(CP, 'width'); RAW.h = Object.getOwnPropertyDescriptor(CP, 'height');
  for (const k of ['setTransform', 'resetTransform', 'getTransform', 'drawImage', 'getImageData', 'putImageData']) RAW[k] = XP[k];
  const getContext = CP.getContext;
  CP.getContext = function (type, ...rest) {
    const g = getContext.call(this, type, ...rest);
    if (g && type === '2d' && SCALED.has(this) && this.__g2d !== g) { this.__g2d = g; RAW.setTransform.call(g, SS, 0, 0, SS, 0, 0); }
    return g;
  };
  XP.setTransform = function (a, b, c, d, e, f) {
    if (!on(this)) return RAW.setTransform.apply(this, arguments);
    if (a && typeof a === 'object') ({ a, b, c, d, e, f } = a);
    if (a === undefined) return RAW.setTransform.call(this, SS, 0, 0, SS, 0, 0);
    return RAW.setTransform.call(this, a * SS, b * SS, c * SS, d * SS, e * SS, f * SS);
  };
  XP.resetTransform = function () { return on(this) ? RAW.setTransform.call(this, SS, 0, 0, SS, 0, 0) : RAW.resetTransform.call(this); };
  XP.getTransform = function () { const m = RAW.getTransform.call(this); return on(this) ? new DOMMatrix([m.a / SS, m.b / SS, m.c / SS, m.d / SS, m.e / SS, m.f / SS]) : m; };
  // a supersampled canvas as a source: its pixels are SS times finer than the units the caller counts in
  XP.drawImage = function (img, ...a) {
    if (!(img instanceof HTMLCanvasElement && SCALED.has(img))) return RAW.drawImage.call(this, img, ...a);
    if (a.length === 2) return RAW.drawImage.call(this, img, a[0], a[1], img.width, img.height);
    if (a.length === 4) return RAW.drawImage.call(this, img, ...a);
    return RAW.drawImage.call(this, img, a[0] * SS, a[1] * SS, a[2] * SS, a[3] * SS, a[4], a[5], a[6], a[7]);
  };
  // pixel data in the caller's units: read through a plain canvas of that size, written back through one
  const plain = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  XP.getImageData = function (sx, sy, sw, sh, ...rest) {
    if (!on(this)) return RAW.getImageData.call(this, sx, sy, sw, sh, ...rest);
    const g = plain(sw, sh).getContext('2d'); RAW.drawImage.call(g, this.canvas, sx * SS, sy * SS, sw * SS, sh * SS, 0, 0, sw, sh);
    return RAW.getImageData.call(g, 0, 0, sw, sh, ...rest);
  };
  XP.putImageData = function (im, dx, dy, ...rest) {
    if (!on(this)) return RAW.putImageData.call(this, im, dx, dy, ...rest);
    const c = plain(im.width, im.height); RAW.putImageData.call(c.getContext('2d'), im, 0, 0);
    this.save(); RAW.setTransform.call(this, SS, 0, 0, SS, 0, 0); this.globalAlpha = 1; this.globalCompositeOperation = 'source-over'; this.filter = 'none'; this.shadowColor = 'transparent';
    this.imageSmoothingEnabled = false; this.clearRect(dx, dy, im.width, im.height); RAW.drawImage.call(this, c, dx, dy, im.width, im.height); this.restore();
  };
  // lengths the canvas takes in device pixels: filter blurs and drop shadows, shadow blur and offsets
  const px = (v, k) => typeof v !== 'string' || v === 'none' ? v : v
    .replace(/blur\(\s*([\d.]+)px\s*\)/g, (m, n) => `blur(${+(n * k).toFixed(3)}px)`)
    .replace(/drop-shadow\(([^)]*)\)/g, (m, body) => 'drop-shadow(' + body.replace(/(-?[\d.]+)px/g, (mm, n) => `${+(n * k).toFixed(3)}px`) + ')');
  const fd = Object.getOwnPropertyDescriptor(XP, 'filter');
  Object.defineProperty(XP, 'filter', { configurable: true, enumerable: true, get() { const v = fd.get.call(this); return on(this) ? px(v, 1 / SS) : v; }, set(v) { fd.set.call(this, on(this) ? px(v, SS) : v); } });
  for (const p of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) {
    const d = Object.getOwnPropertyDescriptor(XP, p);
    Object.defineProperty(XP, p, { configurable: true, enumerable: true, get() { const v = d.get.call(this); return on(this) ? v / SS : v; }, set(v) { d.set.call(this, on(this) ? v * SS : v); } });
  }
}

// QA mode (render.mjs --qa): drawing helpers log screen rectangles of faces, on-screen text and captions here,
// so overlaps (text over a face, text under the captions, text cut by the frame) can be found automatically.
export const QA = { on: false, items: [] };
export function qaRect(g, x, y, w, h, kind, label = '') {
  if (!QA.on || g.globalAlpha < 0.35 || !(g.canvas?.id === 'c' || g.canvas?.dataset?.qa)) return;  // only the film layer and the screen
  const m = g.getTransform(), pts = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  QA.items.push({ kind, label: String(label).slice(0, 40), x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), screen: g.canvas?.id === 'c' });
}
