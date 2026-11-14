// Guard: the channel's moving watermark over the whole film (STYLE_BIBLE rule 70).
// The TikTok note and the handle, with a line under them for whoever meets the video somewhere else. It is see-through,
// keeps to the middle of the frame, where a crop cannot reach it, and never stays put: every few seconds it jumps to
// another height, side, tilt, size and shape (on a cut when one is near) and drifts in between, so no fixed patch covers
// it and no mask made for one video fits the next (the jumps are seeded by the episode's name). A second, smaller handle
// crawls across the whole frame all the time. Both lie under the captions and under the film grain.
// The mark keeps off the faces: for every stretch of a shot it takes the planned height, or, when that would lie across
// somebody's eyes and mouth there, the nearest height that does not (the shot is drawn at three moments to see its faces).
import { makeCanvas, rng, clamp, lerp } from './core.js';

const DEF = {
  handle: '@the64files',
  line: "IF YOU SEE THIS ON YOUTUBE, IT'S STOLEN",  // '' leaves the handle alone
  alpha: 0.34,         // opacity of the mark
  size: 46,            // font size of the handle; the line is `lineSize`
  lineSize: 27,
  every: 3,            // seconds between jumps, give or take a quarter
  crawler: 0.22,       // opacity of the smaller handle that crawls across the frame; 0 switches it off
  // heights the mark may sit at: under the titles, above the captions, and one row right under them
  rows: [430, 590, 750, 910, 1085, 1442],
  x: [70, 960],        // it keeps between these: clear of the buttons that TikTok and Shorts put on the right
};
const INK = '#06080C', CYAN = '#25F4EE', RED = '#FE2C55';

// the TikTok note: a stem, a flag and an open bowl, in a box 100 wide and 116 high
function noteStrokes(g) {
  g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 80); g.stroke();
  g.beginPath(); g.arc(100, 0, 36, Math.PI, Math.PI / 2, true); g.stroke();
  g.beginPath(); g.arc(37, 80, 27, 0, Math.PI * 1.5 + 0.38); g.stroke();
}
function note(g, x, y, h) {
  const s = h / 116, d = 4.5;
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'butt'; g.lineJoin = 'round';
  g.lineWidth = 18;
  // a dark edge all round, the cut ends included: the three layers in ink, shifted round a ring
  g.strokeStyle = INK;
  for (let k = 0; k < 12; k++) for (const o of [-d, 0, d]) { g.save(); g.translate(o + Math.cos(k * Math.PI / 6) * 5, o + Math.sin(k * Math.PI / 6) * 5); noteStrokes(g); g.restore(); }
  g.strokeStyle = CYAN; g.save(); g.translate(-d, -d); noteStrokes(g); g.restore();
  g.strokeStyle = RED; g.save(); g.translate(d, d); noteStrokes(g); g.restore();
  g.strokeStyle = '#FFFFFF'; noteStrokes(g);
  g.restore();
}

// one mark as a picture of its own: the note and the handle, the lines centred under them
function stamp(handle, lines, hs, ls) {
  const font = s => `800 ${s}px Rubik`, m = makeCanvas(8, 8).getContext('2d');
  const width = (text, s, sp) => { m.font = font(s); m.letterSpacing = `${sp}px`; return m.measureText(text).width; };
  const nh = hs * 1.14, nw = nh * 100 / 116, gap = hs * 0.24, sp = ls * 0.07, pad = Math.ceil(hs * 0.3), lh = ls * 1.32;
  const row = nw + gap + width(handle, hs, 0), lw = lines.map(l => width(l, ls, sp));
  const w = Math.ceil(Math.max(row, ...lw) + pad * 2), h = Math.ceil(nh + (lines.length ? ls * 0.42 + lh * lines.length : 0) + pad * 2);
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const text = (t, x, y, s, spacing) => {
    g.font = font(s); g.letterSpacing = `${spacing}px`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.strokeStyle = INK; g.lineWidth = Math.max(4, s * 0.16); g.strokeText(t, x, y);
    g.fillStyle = '#FFFFFF'; g.fillText(t, x, y);
  };
  const x0 = (w - row) / 2;
  note(g, x0, pad, nh);
  text(handle, x0 + nw + gap, pad + nh * 0.9, hs, 0);
  lines.forEach((l, i) => text(l, (w - lw[i]) / 2, pad + nh + ls * 0.42 + lh * (i + 0.76), ls, sp));
  return c;
}

const seedOf = v => typeof v === 'number' ? v : [...String(v)].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7) >>> 0;
// a long line in two rows for the compact mark: at its comma, or at the space nearest the middle
function halves(line) {
  const k = line.indexOf(', ');
  if (k > 0) return [line.slice(0, k + 1), line.slice(k + 2)];
  const sp = [...line].map((ch, i) => ch === ' ' ? i : -1).filter(i => i > 0).sort((a, b) => Math.abs(a - line.length / 2) - Math.abs(b - line.length / 2))[0];
  return sp === undefined ? [line] : [line.slice(0, sp), line.slice(sp + 1)];
}

// when the mark jumps and where it sits in between
export function guardPlan(shots, duration, o) {
  const r = rng(seedOf(o.seed) + 17), cuts = shots.map(s => s.a).filter(a => a > 0.05), segs = [];
  for (let i = 0; i < 6; i++) r();
  let a = 0, row = -1;
  while (a < duration - 0.05) {
    let b = a + o.every * (0.78 + 0.5 * r()), cut = false;
    const near = cuts.filter(c => c > a + 1.1 && Math.abs(c - b) < 0.8).sort((x, y) => Math.abs(x - b) - Math.abs(y - b))[0];
    if (near !== undefined) { b = near; cut = true; }  // a jump on a cut is the least distracting one
    if (b > duration - 1.1) { b = duration; cut = true; }
    let n = 0;
    for (let i = 0; i < 12; i++) { n = Math.floor(r() * o.rows.length); if (n !== row && (Math.abs(n - row) > 1 || row < 0 || o.rows.length < 4)) break; }
    row = n;
    segs.push({ i: segs.length, a, b, hardIn: segs.length ? segs[segs.length - 1].hardOut : true, hardOut: cut, y: o.rows[n], compact: r() < 0.5,
      side: r() * 2 - 1, tilt: (r() * 2 - 1) * 0.12, k: 0.95 + r() * 0.15, vx: (r() * 2 - 1) * 16, vy: (r() * 2 - 1) * 8, spin: (r() * 2 - 1) * 0.008 });
    a = b;
  }
  return segs;
}

// shots: the film's shots ({i, a, b}); options as in DEF plus seed (the episode's name); faces(shot, times): the face
// rectangles of a shot at those moments (main.js draws it on a spare canvas). Returns draw(ctx, t, shot)
export function makeGuard(shots, duration, opts = {}, faces = null) {
  const o = { ...DEF, ...opts }, segs = guardPlan(shots, duration, o), r = rng(seedOf(o.seed) + 5);
  const lines = o.line ? [o.line] : [], p1 = r() * 6.283, p2 = r() * 6.283, [xl, xr] = o.x, F = 0.12, rowOf = new Map();
  let T = null;
  const low = y => y > 1300 ? 0.3 : 1;  // the row under the captions is narrow: the mark lies almost level there
  const place = (s, y, dt) => {
    const tex = s.compact ? T.compact : T.wide, half = tex.width * s.k / 2, lo = xl + half, hi = xr - half;
    return { tex, x: (lo < hi ? lerp(lo, hi, (s.side + 1) / 2) : (xl + xr) / 2) + s.vx * dt, y: y + low(y) * s.vy * dt, rot: low(y) * s.tilt + s.spin * dt };
  };
  // the height of the mark in this stretch of this shot
  function row(s, shot) {
    const key = s.i + ':' + shot.i;
    if (rowOf.has(key)) return rowOf.get(key);
    const a = Math.max(s.a, shot.a), b = Math.min(s.b, shot.b);
    let y = s.y;
    if (faces && b - a > 0.15) {
      // what must stay clear of a face: from the brows to the chin, with room for the camera's push-in
      const keep = faces(shot, [a + 0.05, (a + b) / 2, b - 0.05]).filter(f => f.w >= 80)
        .map(f => ({ x0: f.x + f.w * 0.08 - 30, y0: f.y + f.h * 0.3 - 24, x1: f.x + f.w * 0.92 + 30, y1: f.y + f.h * 0.9 + 24 }));
      const hit = yy => {
        const p = place(s, yy, 0), c = Math.abs(Math.cos(p.rot)), sn = Math.abs(Math.sin(p.rot)), w = p.tex.width * s.k / 2, h = p.tex.height * s.k / 2;
        const hw = w * c + h * sn + 30, hh = w * sn + h * c + 14;
        return keep.reduce((sum, f) => sum + Math.max(0, Math.min(p.x + hw, f.x1) - Math.max(p.x - hw, f.x0)) * Math.max(0, Math.min(yy + hh, f.y1) - Math.max(yy - hh, f.y0)), 0);
      };
      if (keep.length && hit(y) > 0) {
        const free = o.rows.filter(yy => hit(yy) === 0).sort((p, q) => Math.abs(p - s.y) - Math.abs(q - s.y));
        y = free.length ? free[0] : o.rows.slice().sort((p, q) => hit(p) - hit(q))[0];
      }
    }
    rowOf.set(key, y);
    return y;
  }
  const active = (s, t) => t > (s.hardIn ? s.a - 1e-6 : s.a - F) && t < (s.hardOut ? s.b : s.b + F);
  function guard(ctx, t, shot) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = 'transparent';
    const put = (tex, x, y, rot, k, alpha) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
      ctx.drawImage(tex, -tex.width / 2, -tex.height / 2, tex.width, tex.height); ctx.restore();
    };
    if (o.crawler > 0) {
      const cx = (xl + xr) / 2 + ((xr - xl) / 2 - T.small.width / 2) * Math.sin(t * 6.283 / 53 + p1), cy = 880 + 560 * Math.sin(t * 6.283 / 37 + p2);
      put(T.small, cx, cy, 0.07 * Math.sin(t / 5 + p1), 1, o.crawler);
    }
    for (const s of segs) {
      if (!active(s, t)) continue;
      const fi = s.hardIn ? 1 : clamp((t - (s.a - F)) / (2 * F)), fo = s.hardOut ? 1 : 1 - clamp((t - (s.b - F)) / (2 * F));
      const p = place(s, row(s, shot), t - (s.a + s.b) / 2);
      put(p.tex, p.x, p.y, p.rot, s.k, o.alpha * Math.min(fi, fo));
    }
    ctx.restore();
  }
  // before the frame's own drawing: settle where the mark sits in this shot (looking at the shot's faces draws the shot)
  guard.prepare = (t, shot) => {
    T = T || { wide: stamp(o.handle, lines, o.size, o.lineSize), compact: stamp(o.handle, o.line ? halves(o.line) : [], o.size * 1.08, o.lineSize * 1.12),
      small: stamp(o.handle, [], o.size * 0.8, 0) };
    for (const s of segs) if (active(s, t)) row(s, shot);
  };
  return guard;
}
