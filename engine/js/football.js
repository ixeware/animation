// The football format. A pitch in metres, the stands of a stadium bowl with a crowd, goals with nets that bulge, a
// ball whose panels spin, and full-body players on a small 3D skeleton (run, dribble, jump, kick, keeper, slide, sit,
// celebrate) with the cartoon heads of characters.js. Everything is projected through the chess board's camera
// (Board.setCam / project / poly), so rig(), motion blur, QA and the post grade work exactly as in the chess episodes.
// World units: metres. The pitch is centred on the origin, the goal lines at x = ±52.5, the touchlines at z = ±34, y up.
import { W, H, clamp, lerp, smooth, rgba, mix, rng, makeCanvas } from './core.js';
import { drawChar, CAST, EXPR } from './characters.js';
import { SKIN2 } from './look.js';

export const PITCH = { hx: 52.5, hz: 34, box: [16.5, 20.16], six: [5.5, 9.16], spot: 11, circle: 9.15, goalW: 7.32, goalH: 2.44, line: 0.12 };
const PI = Math.PI, TAU = PI * 2;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const v3 = { add, sub, mul, dot, nrm, lerp3 };
const depthOf = (B, p) => B.toCam(p[0], p[1], p[2])[2];

// ---------------------------------------------------------------- textures and exact triangle mapping
export function tex(w, h, draw) { const c = makeCanvas(w, h), x = c.getContext('2d'); draw(x, w, h); return c; }
// one pattern per (context, canvas): a CanvasPattern belongs to the context that made it
const PATS = new WeakMap();
function patOf(g, img) {
  let m = PATS.get(g); if (!m) PATS.set(g, m = new Map());
  let p = m.get(img); if (!p) m.set(img, p = g.createPattern(img, 'repeat'));
  return p;
}
// fill the projected triangle (a, b, c) with an image whose pixel coordinates at the corners are ta, tb, tc: the affine
// map of a triangle is exact, so a grid of them maps a texture onto a plane in perspective. The path is grown by ~0.6 px
// so that neighbouring triangles overlap and no seams show
function patTri(g, img, a, b, c, ta, tb, tc, live = null) {
  const du1 = tb[0] - ta[0], dv1 = tb[1] - ta[1], du2 = tc[0] - ta[0], dv2 = tc[1] - ta[1], det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-9) return;
  const dx1 = b.x - a.x, dy1 = b.y - a.y, dx2 = c.x - a.x, dy2 = c.y - a.y;
  const m11 = (dx1 * dv2 - dx2 * dv1) / det, m12 = (dx2 * du1 - dx1 * du2) / det;
  const m21 = (dy1 * dv2 - dy2 * dv1) / det, m22 = (dy2 * du1 - dy1 * du2) / det;
  const pat = live || patOf(g, img);
  pat.setTransform(new DOMMatrix([m11, m21, m12, m22, a.x - m11 * ta[0] - m12 * ta[1], a.y - m21 * ta[0] - m22 * ta[1]]));
  const mx = (a.x + b.x + c.x) / 3, my = (a.y + b.y + c.y) / 3, gr = p => { const dx = p.x - mx, dy = p.y - my, l = Math.hypot(dx, dy) || 1; return [p.x + dx / l * 0.6, p.y + dy / l * 0.6]; };
  g.fillStyle = pat; g.beginPath(); g.moveTo(...gr(a)); g.lineTo(...gr(b)); g.lineTo(...gr(c)); g.closePath(); g.fill();
}
// a world quad (corners p00, p10, p11, p01) textured with the image region [u0, u1] x [v0, v1] (pixels), cut into a grid
// that is finer where the depth changes more. Returns false when it is behind the camera
// live: the canvas changes every frame (a feed on a screen or through a window): a CanvasPattern is a snapshot of its
// canvas, so a live one gets a fresh pattern per call instead of the cached one
export function texQuadW(g, B, img, p00, p10, p11, p01, [u0, v0, u1, v1], { near = 0.4, max = 8, live = false } = {}) {
  const pat = live ? g.createPattern(img, 'repeat') : null;
  const ds = [p00, p10, p11, p01].map(p => depthOf(B, p));
  if (Math.min(...ds) < near) {
    if (Math.max(...ds) < near) return false;
    // partly behind the camera: split into strips and keep the ones in front
    const n = 6;
    for (let j = 0; j < n; j++) {
      const a0 = j / n, a1 = (j + 1) / n, q00 = lerp3(p00, p01, a0), q10 = lerp3(p10, p11, a0), q01 = lerp3(p00, p01, a1), q11 = lerp3(p10, p11, a1);
      if (Math.min(depthOf(B, q00), depthOf(B, q10), depthOf(B, q01), depthOf(B, q11)) < near) continue;
      texQuadW(g, B, img, q00, q10, q11, q01, [u0, lerp(v0, v1, a0), u1, lerp(v0, v1, a1)], { near, max: 3, live });
    }
    return true;
  }
  const n = clamp(Math.ceil((Math.max(...ds) / Math.min(...ds) - 1) * 4), 1, max);
  const P = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const a = lerp3(p00, p10, i / n), b = lerp3(p01, p11, i / n), q = lerp3(a, b, j / n);
    P.push({ ...B.project(q[0], q[1], q[2]), u: lerp(u0, u1, i / n), v: lerp(v0, v1, j / n) });
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = P[j * (n + 1) + i], b = P[j * (n + 1) + i + 1], c = P[(j + 1) * (n + 1) + i], d = P[(j + 1) * (n + 1) + i + 1];
    patTri(g, img, a, b, c, [a.u, a.v], [b.u, b.v], [c.u, c.v], pat);
    patTri(g, img, d, c, b, [d.u, d.v], [c.u, c.v], [b.u, b.v], pat);
  }
  return true;
}
const fillPoly = (g, B, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); return true; } return false; };

// ---------------------------------------------------------------- sky: a gradient tied to the horizon and far clouds
const horizonY = B => B.cy - B.f * Math.tan(B.pitch);
export function sky(g, B, { zen = '#2C6CB8', mid = '#6FA6DB', hor = '#D5E5EC', clouds = 1, seed = 5, t = 0, haze = 0 } = {}) {
  const hy = horizonY(B), gr = g.createLinearGradient(0, hy - 1900, 0, hy + 40);
  gr.addColorStop(0, zen); gr.addColorStop(0.62, mid); gr.addColorStop(1, hor);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (haze > 0) { g.fillStyle = rgba(hor, haze); g.fillRect(0, 0, W, H); }
  if (clouds <= 0) return;
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const az = r() * TAU + t * 0.0015, el = 0.07 + r() * 0.42, R = 2400, size = 160 + r() * 260;
    const P = [Math.cos(az) * Math.cos(el) * R, Math.sin(el) * R, Math.sin(az) * Math.cos(el) * R];
    const c = B.toCam(...P); if (c[2] < 50) continue;
    const p = B.project(...P), s = size * p.s;
    if (p.x < -s * 2 || p.x > W + s * 2 || p.y < -s || p.y > H + s) continue;
    g.save(); g.globalAlpha = clouds * (0.55 + 0.35 * r());
    const n = 5 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const ox = (r() - 0.5) * s * 1.8, oy = (r() - 0.6) * s * 0.35, rr = s * (0.32 + r() * 0.3);
      const cg = g.createRadialGradient(p.x + ox, p.y + oy - rr * 0.3, rr * 0.1, p.x + ox, p.y + oy, rr);
      cg.addColorStop(0, 'rgba(255,255,255,0.95)'); cg.addColorStop(0.7, 'rgba(240,245,250,0.75)'); cg.addColorStop(1, 'rgba(225,235,245,0)');
      g.fillStyle = cg; g.beginPath(); g.ellipse(p.x + ox, p.y + oy, rr * 1.3, rr * 0.8, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
}

// ---------------------------------------------------------------- the crowd: rows of people on concrete steps
const CLOTH = [['#F2F0EA', 30], ['#9CC9EE', 10], ['#C8352E', 9], ['#E8C23A', 7], ['#2E8B4E', 7], ['#22304E', 10], ['#7A5236', 6], ['#E58BA6', 4],
  ['#E07A2A', 4], ['#1E1E22', 7], ['#8C9096', 4], ['#5A7FC0', 2]];
const SKINS = ['#E8C3A0', '#D9A77E', '#C38B62', '#A86E48', '#8A5A3A', '#F0D2B6'];
const pick = (r, list) => { let s = list.reduce((a, [, w]) => a + w, 0) * r(); for (const [c, w] of list) { if ((s -= w) <= 0) return c; } return list[0][0]; };
export function crowdTex(w, h, { rows = 30, seed = 3, cheer = 0, step = '#9C978C', riser = '#6E6A62', flags = 6, hats = 0.06 } = {}) {
  return tex(w, h, (g) => {
    const r = rng(seed), rh = h / rows;
    for (let j = 0; j < rows; j++) {
      const y0 = j * rh;
      g.fillStyle = step; g.fillRect(0, y0, w, rh); g.fillStyle = riser; g.fillRect(0, y0 + rh * 0.78, w, rh * 0.22);
    }
    for (const ax of [0.13, 0.5, 0.87]) { g.fillStyle = '#B5B0A6'; g.fillRect(w * ax - 5, 0, 10, h); }  // aisles
    // people, back rows first (the texture's top is the back of the stand)
    for (let j = 0; j < rows; j++) {
      const base = (j + 0.82) * rh, pw = rh * 0.62;
      for (let x = r() * pw; x < w; x += pw * (0.82 + r() * 0.5)) {
        if ([0.13, 0.5, 0.87].some(ax => Math.abs(x - w * ax) < 9) || r() < 0.05) continue;
        const up = cheer > 0 && r() < 0.55 * cheer, jump = up ? rh * 0.12 : 0;
        const body = pick(r, CLOTH), skin = SKINS[Math.floor(r() * SKINS.length)], bw = pw * (0.7 + r() * 0.25), bh = rh * 0.5;
        const by = base - bh - jump;
        if (up) {  // arms up
          g.strokeStyle = body; g.lineWidth = Math.max(1.5, pw * 0.16); g.lineCap = 'round';
          for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * bw * 0.35, by + 2); g.lineTo(x + sd * bw * (0.55 + r() * 0.3), by - rh * (0.42 + r() * 0.2)); g.stroke(); }
          g.fillStyle = skin; for (const sd of [-1, 1]) { g.beginPath(); g.arc(x + sd * bw * 0.62, by - rh * 0.5, pw * 0.11, 0, TAU); g.fill(); }
        }
        g.fillStyle = body; g.beginPath(); g.roundRect(x - bw / 2, by, bw, bh + jump, pw * 0.2); g.fill();
        g.fillStyle = skin; g.beginPath(); g.arc(x, by - rh * 0.12, pw * 0.26, 0, TAU); g.fill();
        if (r() < hats) { g.fillStyle = r() < 0.6 ? '#D8C08A' : '#F2EFE6'; g.beginPath(); g.ellipse(x, by - rh * 0.26, pw * 0.55, pw * 0.16, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x, by - rh * 0.3, pw * 0.24, PI, TAU); g.fill(); }
        else { g.fillStyle = r() < 0.75 ? '#2A1E16' : '#6A4A30'; g.beginPath(); g.arc(x, by - rh * 0.16, pw * 0.26, PI * 1.05, TAU * 0.98); g.fill(); }
      }
    }
    // flags held up in the crowd: Argentina, Mexico, England
    const FL = [g2 => { g2.fillStyle = '#7FC1EC'; g2.fillRect(0, 0, 1, 1 / 3); g2.fillStyle = '#FFFFFF'; g2.fillRect(0, 1 / 3, 1, 1 / 3); g2.fillStyle = '#7FC1EC'; g2.fillRect(0, 2 / 3, 1, 1 / 3); g2.fillStyle = '#F0C040'; g2.beginPath(); g2.arc(0.5, 0.5, 0.07, 0, TAU); g2.fill(); },
      g2 => { g2.fillStyle = '#1F7A45'; g2.fillRect(0, 0, 1 / 3, 1); g2.fillStyle = '#FFFFFF'; g2.fillRect(1 / 3, 0, 1 / 3, 1); g2.fillStyle = '#C8262E'; g2.fillRect(2 / 3, 0, 1 / 3, 1); },
      g2 => { g2.fillStyle = '#FFFFFF'; g2.fillRect(0, 0, 1, 1); g2.fillStyle = '#C8262E'; g2.fillRect(0.42, 0, 0.16, 1); g2.fillRect(0, 0.4, 1, 0.2); }];
    for (let i = 0; i < flags; i++) {
      const fw = rh * (2.2 + r() * 1.6), fh = fw * 0.62, x = r() * (w - fw), y = r() * (h - fh - rh) + rh * 0.2 - (cheer ? rh * 0.25 : 0);
      g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.15 + (cheer ? 0.08 : 0)); g.scale(fw, fh); FL[i % 3](g); g.restore();
    }
  });
}

// ---------------------------------------------------------------- the bowl
// A rounded-rectangle ring around the pitch; the stands are faces swept along it by a cross-section profile of
// [offset out from the ring, height] points. Faces that look into the bowl are drawn before the pitch (seen from inside,
// the inside of the bowl never hides itself); the roof top and the outer wall are drawn after it, for shots from outside
const PROFILE = {
  wall: [[0, 0], [0, 1.25], '#A49F94'],
  low: [[0.6, 1.6], [19.5, 14.2], 'crowdLow'],
  walk: [[19.5, 14.2], [21, 14.6], '#A8A399'],
  boxes: [[21, 14.6], [22.2, 19.0], 'boxes'],
  up1: [[22.2, 19.0], [29, 24.2], 'crowdUp'],
  up2: [[29, 24.2], [47.5, 38.6], 'crowdUp'],
  back: [[47.5, 38.6], [48.4, 42.2], '#34363A'],
  under: [[48.4, 42.2], [29, 43.8], 'under'],
  edge: [[29, 43.8], [29, 45.4], 'edge'],
  top: [[29, 45.4], [50.5, 46.5], '#C9C6BE'],
  outer: [[50.5, 46.5], [50.5, 0], 'outer'],
};
const OUTER = new Set(['top', 'outer']);
export class Stadium {
  constructor({ hx = 60.5, hz = 44.5, rc = 15, n = 96, rep = 12, seed = 7, sun = nrm([0.18, 1, 0.32]), haze = '#C9D6DC' } = {}) {
    Object.assign(this, { hx, hz, rc, n, rep, sun, haze });
    const straightX = 2 * (hx - rc), straightZ = 2 * (hz - rc), arc = PI / 2 * rc, L = 2 * straightX + 2 * straightZ + 4 * arc;
    const at = s => {  // arc length -> point and outward normal on the base ring, counter-clockwise from (+hx, 0)
      s = ((s % L) + L) % L;
      const segs = [[straightZ / 2, (u) => [[hx, u], [1, 0]]], [arc, (u) => { const a = u / rc; return [[hx - rc + Math.cos(a) * rc, hz - rc + Math.sin(a) * rc], [Math.cos(a), Math.sin(a)]]; }],
        [straightX, (u) => [[hx - rc - u, hz], [0, 1]]], [arc, (u) => { const a = PI / 2 + u / rc; return [[-hx + rc + Math.cos(a) * rc, hz - rc + Math.sin(a) * rc], [Math.cos(a), Math.sin(a)]]; }],
        [straightZ, (u) => [[-hx, hz - rc - u], [-1, 0]]], [arc, (u) => { const a = PI + u / rc; return [[-hx + rc + Math.cos(a) * rc, -hz + rc + Math.sin(a) * rc], [Math.cos(a), Math.sin(a)]]; }],
        [straightX, (u) => [[-hx + rc + u, -hz], [0, -1]]], [arc, (u) => { const a = PI * 1.5 + u / rc; return [[hx - rc + Math.cos(a) * rc, -hz + rc + Math.sin(a) * rc], [Math.cos(a), Math.sin(a)]]; }],
        [straightZ / 2, (u) => [[hx, -hz + rc + u], [1, 0]]]];
      for (const [len, f] of segs) { if (s <= len) return f(s); s -= len; }
      return segs[0][1](0);
    };
    this.ring = Array.from({ length: n + 1 }, (_, i) => { const [[x, z], [nx, nz]] = at(i / n * L); return { x, z, nx, nz }; });
    this.tex = {
      crowdLow: [crowdTex(1024, 288, { rows: 26, seed: seed }), crowdTex(1024, 288, { rows: 26, seed: seed, cheer: 1 })],
      crowdUp: [crowdTex(1024, 384, { rows: 36, seed: seed + 5, step: '#8E897F', riser: '#615D56' }), crowdTex(1024, 384, { rows: 36, seed: seed + 5, cheer: 1, step: '#8E897F', riser: '#615D56' })],
      boxes: [tex(512, 64, (g, w, h) => { g.fillStyle = '#3B4048'; g.fillRect(0, 0, w, h); for (let x = 6; x < w; x += 42) { const gr = g.createLinearGradient(0, 8, 0, h - 8); gr.addColorStop(0, '#7E97AE'); gr.addColorStop(1, '#2A3442'); g.fillStyle = gr; g.fillRect(x, 10, 34, h - 22); } g.fillStyle = '#C9C4BA'; g.fillRect(0, h - 8, w, 8); })],
      under: [tex(512, 128, (g, w, h) => { g.fillStyle = '#4C4F54'; g.fillRect(0, 0, w, h); g.fillStyle = '#3A3C40'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 10, h); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 0, w, 10); })],
      edge: [tex(512, 64, (g, w, h) => { g.fillStyle = '#E9E6DE'; g.fillRect(0, 0, w, h); g.fillStyle = '#7C7E82'; for (let x = 18; x < w; x += 128) { g.fillRect(x, 14, 44, 24); g.fillStyle = '#F6F3EA'; for (let k = 0; k < 4; k++) g.fillRect(x + 4 + k * 10, 18, 7, 7); g.fillStyle = '#7C7E82'; } g.fillStyle = '#B8B4AA'; g.fillRect(0, h - 6, w, 6); })],
      outer: [tex(512, 256, (g, w, h) => { g.fillStyle = '#B9B4AA'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = '#A29D93'; g.fillRect(x, 0, 6, h); } for (let y = 40; y < h; y += 64) { g.fillStyle = '#9A958B'; g.fillRect(0, y, w, 5); } })],
    };
  }

  // faces of segment i for a profile key: corners (bottom-left, bottom-right, top-right, top-left) and the normal
  face(i, key) {
    const [[o0, y0], [o1, y1]] = PROFILE[key], a = this.ring[i], b = this.ring[i + 1];
    const P = (q, o, y) => [q.x + q.nx * o, y, q.z + q.nz * o];
    const nmid = nrm([(a.nx + b.nx) / 2, 0, (a.nz + b.nz) / 2]), dx = o1 - o0, dy = y1 - y0;
    return { pts: [P(a, o0, y0), P(b, o0, y0), P(b, o1, y1), P(a, o1, y1)], N: nrm([nmid[0] * -dy, dx, nmid[2] * -dy]) };
  }

  // the stands (everything that looks into the bowl). cheer 0..1 swaps in the arms-up crowd, flickering; shade darkens
  draw(g, B, t = 0, { cheer = 0, part = 'inner', fog = 1 } = {}) {
    const E = B.E, list = [];
    for (let i = 0; i < this.n; i++) for (const key of Object.keys(PROFILE)) {
      if (OUTER.has(key) !== (part === 'outer')) continue;
      const f = this.face(i, key), c = f.pts.reduce((a, p) => add(a, mul(p, 0.25)), [0, 0, 0]);
      if (dot(f.N, sub(E, c)) <= 0) continue;
      const d = depthOf(B, c);
      if (Math.max(...f.pts.map(p => depthOf(B, p))) < 0.4) continue;
      list.push({ i, key, f, d });
    }
    list.sort((a, b) => b.d - a.d);
    const flick = cheer > 0 ? (Math.floor(t * 7) % 2 ? 1 : 0) : 0;
    for (const { i, key, f, d } of list) {
      const spec = PROFILE[key][2], [p00, p10, p11, p01] = f.pts;
      const lit = clamp(0.62 + 0.45 * dot(f.N, this.sun)) * (key === 'up2' || key === 'back' || key === 'under' ? 0.62 : 1);
      if (this.tex[spec]) {
        const arr = this.tex[spec], img = arr[Math.min(arr.length - 1, spec.startsWith('crowd') && cheer > 0.3 ? flick : 0)];
        const k = i % this.rep, u0 = img.width * k / this.rep, u1 = img.width * (k + 1) / this.rep;
        let v0 = img.height, v1 = 0;  // the texture's top is the back row
        if (key === 'up1') { v0 = img.height; v1 = img.height * (1 - 0.2); } else if (key === 'up2') { v0 = img.height * 0.8; v1 = 0; }
        texQuadW(g, B, img, p00, p10, p11, p01, [u0, v0, u1, v1]);
      } else fillPoly(g, B, f.pts, spec);
      // light and haze: one translucent fill over the face
      const hz = clamp((d - 35) / 260) * 0.55 * fog, dark = 1 - lit;
      if (dark > 0.02 && B.poly(g, f.pts)) { g.fillStyle = `rgba(14,18,26,${(dark * 0.75).toFixed(3)})`; g.fill(); }
      if (hz > 0.01 && B.poly(g, f.pts)) { g.fillStyle = rgba(this.haze, hz); g.fill(); }
    }
  }
}

// ---------------------------------------------------------------- the city round the bowl, for shots from the air
// Dusty ground, an asphalt apron with parking, blocks of low flat-roofed houses in many colours (Mexico City), trees,
// mountains on the horizon and a haze that thickens with distance. City.draw(g, B, 'far' | 'near'): the far pass goes
// before the stadium, the near one after its outer shell (buildings between the camera and the bowl)
const ROOFS = ['#D8D2C4', '#C9C2B2', '#E6E0D2', '#B7AE9C', '#C98A6A', '#B86E52', '#E3C79A', '#A9B7BE', '#D9B3A3', '#9AA48E', '#F0E8D8', '#C4A07A'];
export class City {
  constructor({ seed = 21, R = 1500, block = 64, clear = [135, 120], haze = '#CCD6DA' } = {}) {
    const r = rng(seed); this.haze = haze; this.R = R; this.items = [];
    for (let x = -R; x < R; x += block) for (let z = -R; z < R; z += block) {
      const cx = x + block / 2, cz = z + block / 2, rr = Math.hypot(cx, cz);
      if (Math.abs(cx) < clear[0] + block * 0.3 && Math.abs(cz) < clear[1] + block * 0.3) continue;
      if (rr > R) continue;
      if (r() < 0.06) { this.items.push({ kind: 'park', x0: x + 6, z0: z + 6, x1: x + block - 6, z1: z + block - 6 }); continue; }
      const n = 2 + Math.floor(r() * 5), st = 9;  // houses along the block, streets st metres wide
      for (let k = 0; k < n; k++) {
        const w = (block - st) / n, bx0 = x + st / 2 + k * w + 0.6, bx1 = bx0 + w - 1.2, deep = (block - st) * (0.35 + r() * 0.15);
        for (const side of [0, 1]) {
          const bz0 = side ? z + block - st / 2 - deep : z + st / 2, h = 3.5 + r() * (rr < 500 ? 9 : 14) + (r() < 0.04 ? 20 : 0);
          this.items.push({ kind: 'bldg', x0: bx0, z0: bz0, x1: bx1, z1: bz0 + deep, h, roof: ROOFS[Math.floor(r() * ROOFS.length)], wall: null });
        }
      }
      if (r() < 0.5) this.items.push({ kind: 'tree', x: x + r() * block, z: z + (r() < 0.5 ? 2 : block - 2), s: 3 + r() * 3 });
    }
    for (let i = 0; i < 90; i++) { const a = r() * TAU, d = 1; this.items.push({ kind: 'tree', x: Math.cos(a) * (clear[0] + 8) * d + (r() - 0.5) * 20, z: Math.sin(a) * (clear[1] + 8) * d + (r() - 0.5) * 20, s: 4 + r() * 3 }); }
    for (const it of this.items) { it.c = it.kind === 'tree' ? [it.x, it.s, it.z] : [(it.x0 + it.x1) / 2, (it.h || 0) / 2, (it.z0 + it.z1) / 2]; if (it.kind === 'bldg') it.wall = mix(it.roof, '#5A564E', 0.35); }
    const rm = rng(seed + 9); this.ridge = Array.from({ length: 64 }, (_, i) => { const a = i / 63 * TAU; return [Math.cos(a) * 26000, 900 + rm() * 1700 + (Math.abs(Math.sin(a * 1.5 + 1)) > 0.8 ? 1200 : 0), Math.sin(a) * 26000]; });
  }
  ground(g, B) {
    const N = 14, S = this.R * 2.4 / N, x0 = -this.R * 1.2;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = x0 + i * S, b = x0 + j * S, d = depthOf(B, [a + S / 2, 0, b + S / 2]);
      fillPoly(g, B, [[a, 0, b], [a + S, 0, b], [a + S, 0, b + S], [a, 0, b + S]], mix('#B4AA92', this.haze, clamp(d / 2600) * 0.85));
    }
    // the stadium's apron: asphalt with parking bays
    const ring = (hx, hz, rc, n = 40) => Array.from({ length: n }, (_, i) => { const q = i / n * 4, side = Math.floor(q), u = q - side, cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]][side], a = (side + u) * PI / 2; return [cs[0] * (hx - rc) + Math.cos(a) * rc, 0.02, cs[1] * (hz - rc) + Math.sin(a) * rc]; });
    fillPoly(g, B, ring(185, 165, 60), '#7C7A74');
    fillPoly(g, B, ring(118, 102, 40), '#94918A');
    g.save(); g.strokeStyle = 'rgba(240,240,232,0.5)'; g.lineWidth = 1;
    for (let k = 0; k < 120; k++) { const a = k / 120 * TAU, p = B.project(Math.cos(a) * 150, 0.03, Math.sin(a) * 135), q = B.project(Math.cos(a) * 172, 0.03, Math.sin(a) * 155); if (p.z > 1 && q.z > 1) { g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); } }
    g.restore();
    // mountains on the horizon (south of the city the Ajusco range), in the haze
    const pts = this.ridge.filter(p => depthOf(B, p) > 100);
    if (pts.length > 3) { g.save(); g.globalAlpha = 0.55; const P = this.ridge.map(p => ({ ...B.project(...p), d: depthOf(B, p) })); g.fillStyle = mix('#8FA3B4', this.haze, 0.35);
      g.beginPath(); let on = false; for (const p of P) { if (p.d < 100) { on = false; continue; } on ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); on = true; } g.lineTo(W + 50, H); g.lineTo(-50, H); g.closePath(); g.fill(); g.restore(); }
  }
  draw(g, B, pass = 'far', { split = null } = {}) {
    const cut = split ?? depthOf(B, [0, 20, 0]) - 70, E = B.E;
    if (pass === 'far') this.ground(g, B);
    const list = [];
    for (const it of this.items) {
      const d = depthOf(B, it.c);
      if (d < 2 || (pass === 'far') !== (d >= cut)) continue;
      const p = B.project(...it.c); if (p.x < -400 || p.x > W + 400 || p.y < -400 || p.y > H + 400) continue;
      list.push([d, it]);
    }
    list.sort((a, b) => b[0] - a[0]);
    for (const [d, it] of list) {
      const hz = clamp(d / 2600) * 0.85;
      if (it.kind === 'tree') { const p = B.project(...it.c), r = it.s * p.s; g.fillStyle = mix('#3E6A34', this.haze, hz); g.beginPath(); g.arc(p.x, p.y, Math.max(1, r), 0, TAU); g.fill(); continue; }
      if (it.kind === 'park') { fillPoly(g, B, [[it.x0, 0.05, it.z0], [it.x1, 0.05, it.z0], [it.x1, 0.05, it.z1], [it.x0, 0.05, it.z1]], mix('#6E9254', this.haze, hz)); continue; }
      const { x0, z0, x1, z1, h } = it, wall = mix(it.wall, this.haze, hz), roof = mix(it.roof, this.haze, hz);
      if (d < 1200) {
        if (E[2] < z0) fillPoly(g, B, [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], wall);
        if (E[2] > z1) fillPoly(g, B, [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], mix(wall, '#000000', 0.08));
        if (E[0] < x0) fillPoly(g, B, [[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], mix(wall, '#000000', 0.16));
        if (E[0] > x1) fillPoly(g, B, [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], mix(wall, '#FFFFFF', 0.06));
      }
      fillPoly(g, B, [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], roof);
    }
  }
}

// a ring of advertising boards round the pitch, at `gap` metres from the lines; designs are canvases cycled along it.
// Returns depth-sorted drawables (players can stand in front of or behind them)
export function boardItems(B, designs, { gap = [5, 4], h = 0.95, w = 6 } = {}) {
  const items = [], X = PITCH.hx + gap[0], Z = PITCH.hz + gap[1];
  const runs = [[[-X, -Z], [X, -Z], [0, 0, 1]], [[X, Z], [-X, Z], [0, 0, -1]], [[-X, Z], [-X, -Z], [1, 0, 0]], [[X, -Z], [X, Z], [-1, 0, 0]]];
  let k = 0;
  for (const [[ax, az], [bx, bz], N] of runs) {
    const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / w);
    for (let i = 0; i < n; i++) {
      const p0 = [lerp(ax, bx, i / n), 0, lerp(az, bz, i / n)], p1 = [lerp(ax, bx, (i + 1) / n), 0, lerp(az, bz, (i + 1) / n)];
      const img = designs[k++ % designs.length], c = lerp3(p0, p1, 0.5);
      if (dot(N, sub(B.E, c)) <= 0) continue;  // seen from behind: the back is in the stands' shadow, skip
      // text runs left to right for someone on the pitch looking at the board (along -N, whose right is (-N.z, 0, N.x))
      const ltr = (p1[0] - p0[0]) * -N[2] + (p1[2] - p0[2]) * N[0] > 0, uv = ltr ? [0, img.height, img.width, 0] : [img.width, img.height, 0, 0];
      items.push({ d: depthOf(B, [c[0], h / 2, c[2]]), draw: g => {
        texQuadW(g, B, img, [p0[0], 0, p0[2]], [p1[0], 0, p1[2]], [p1[0], h, p1[2]], [p0[0], h, p0[2]], uv, { max: 3 });
        if (B.poly(g, [[p0[0], h, p0[2]], [p1[0], h, p1[2]], [p1[0] - N[0] * 0.25, h, p1[2] - N[2] * 0.25], [p0[0] - N[0] * 0.25, h, p0[2] - N[2] * 0.25]])) { g.fillStyle = '#2A2C30'; g.fill(); }
      } });
    }
  }
  return items;
}
export function boardDesign(text, { bg = '#F4F2EC', ink = '#1D2A44', stripe = null, font = 'Rubik', w = 600, h = 96 } = {}) {
  return tex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (stripe) { g.fillStyle = stripe; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12); }
    let fs = Math.round(h * 0.5); g.letterSpacing = '6px'; g.font = `900 ${fs}px ${font}`;
    while (g.measureText(text).width > w * 0.9 && fs > 10) { fs -= 2; g.font = `900 ${fs}px ${font}`; }
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
  });
}

// ---------------------------------------------------------------- the pitch
const GRASS = tex(512, 512, (g, w, h) => {  // fine grass, transparent: laid over the stripe colours (a 4 m tile)
  const r = rng(91);
  for (let i = 0; i < 1800; i++) {  // small, faint patches
    const x = r() * w, y = r() * h, s = 2 + r() * 6, l = r();
    g.fillStyle = l < 0.5 ? `rgba(20,44,12,${(0.04 + r() * 0.05).toFixed(3)})` : `rgba(220,236,170,${(0.03 + r() * 0.04).toFixed(3)})`;
    g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * PI, 0, TAU); g.fill();
  }
  g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {  // blades
    const x = r() * w, y = r() * h, l = 2 + r() * 4, a = -PI / 2 + (r() - 0.5) * 1.2, d = r();
    g.strokeStyle = d < 0.55 ? 'rgba(18,46,10,0.16)' : 'rgba(210,235,160,0.12)'; g.lineWidth = 0.8 + r() * 0.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
});
// blades of grass in front of a low camera: a world grid (so they do not swim as the camera moves), drawn in three
// shades as three batched strokes
function grassBlades(g, B, t, { base = '#5F9F3F', max = 7.5, cell = 0.16, wind = 1 } = {}) {
  const E = B.E, fx = B.F[0], fz = B.F[2], fl = Math.hypot(fx, fz) || 1, cx = E[0] + fx / fl * max * 0.55, cz = E[2] + fz / fl * max * 0.55;
  const half = max * 0.75, i0 = Math.floor((cx - half) / cell), i1 = Math.ceil((cx + half) / cell), j0 = Math.floor((cz - half) / cell), j1 = Math.ceil((cz + half) / cell);
  const shades = [mix(base, '#0E2A08', 0.45), mix(base, '#0E2A08', 0.2), mix(base, '#E8F2B0', 0.25)], paths = shades.map(() => new Path2D());
  let n = 0;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const h1 = Math.sin(i * 127.1 + j * 311.7) * 43758.5453, h2 = Math.sin(i * 269.5 + j * 183.3) * 43758.5453, r1 = h1 - Math.floor(h1), r2 = h2 - Math.floor(h2);
    const x = (i + r1) * cell, z = (j + r2) * cell, c = B.toCam(x, 0, z);
    if (c[2] < 0.45 || c[2] > max) continue;
    const p = B.project(x, 0, z);
    if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 40) continue;
    const hgt = 0.035 + r2 * 0.05, sway = Math.sin(t * 1.7 + x * 1.3 + z) * 0.012 * wind, q = B.project(x + sway + (r1 - 0.5) * 0.02, hgt, z + (r2 - 0.5) * 0.02);
    const P = paths[Math.floor(r1 * 2.999)]; P.moveTo(p.x, p.y); P.lineTo(q.x, q.y); n++;
  }
  if (!n) return;
  g.save(); g.lineCap = 'round';
  shades.forEach((col, k) => { g.strokeStyle = col; g.lineWidth = clamp(B.f / 380, 1.4, 4); g.stroke(paths[k]); });
  g.restore();
}
export function pitch(g, B, { stripes = 20, colors = ['#5F9F3F', '#6CAB49'], apron = [62, 46], haze = '#BFD3C0', fog = 1, wear = 0.5, lines = true, noise = true, blades = false, t = 0 } = {}) {
  const sx = PITCH.hx * 2 / stripes, nx = Math.ceil(apron[0] / sx) * 2, x0 = -nx / 2 * sx, nz = 8, dz = apron[1] * 2 / nz;
  const cells = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const xa = x0 + i * sx, za = -apron[1] + j * dz, c = [xa + sx / 2, 0, za + dz / 2];
    cells.push({ xa, za, d: depthOf(B, c), col: colors[(i + stripes) % 2] });
  }
  for (const c of cells) {
    const pts = [[c.xa, 0, c.za], [c.xa + sx, 0, c.za], [c.xa + sx, 0, c.za + dz], [c.xa, 0, c.za + dz]];
    const hz = clamp((c.d - 25) / 170) * 0.5 * fog;
    fillPoly(g, B, pts, hz > 0 ? mix(c.col, haze, hz) : c.col);
    if (noise && c.d < 55) {  // texture only near the camera: far away it would shimmer, and it costs triangles
      g.save(); g.globalAlpha = clamp(1 - (c.d - 28) / 27);
      texQuadW(g, B, GRASS, pts[0], pts[1], pts[2], pts[3], [c.xa * 128, c.za * 128, (c.xa + sx) * 128, (c.za + dz) * 128], { max: 3 });
      if (c.d < 16) { g.globalAlpha = clamp(1 - (c.d - 8) / 8); texQuadW(g, B, GRASS, pts[0], pts[1], pts[2], pts[3], [c.xa * 420, c.za * 420, (c.xa + sx) * 420, (c.za + dz) * 420], { max: 4 }); }
      g.restore();
    }
  }
  if (blades && B.E[1] < 4.5 && B.E[1] > 0.05) grassBlades(g, B, t, { base: colors[0] });
  if (wear > 0) for (const sd of [-1, 1]) {  // worn, sandy goalmouths (the 1986 pitch was famously poor)
    for (const [cx, cz, rx, rz, a] of [[sd * 49.5, 0, 3.6, 4.8, 0.45], [sd * 41.5, 0, 2.2, 2.6, 0.3], [0, 0, 2.4, 2.4, 0.25]]) {
      const pts = Array.from({ length: 18 }, (_, k) => [cx + Math.cos(k / 18 * TAU) * rx, 0, cz + Math.sin(k / 18 * TAU) * rz]);
      g.save(); g.globalAlpha = wear * a; fillPoly(g, B, pts, '#A89A62'); g.restore();
    }
  }
  if (lines) pitchLines(g, B, { haze, fog });
}
function ribbon(g, B, pts, w) {  // a polyline on the grass, w metres wide
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l * w / 2, nz = dx / l * w / 2;
    L.push([pts[i][0] + nx, 0.005, pts[i][1] + nz]); R.push([pts[i][0] - nx, 0.005, pts[i][1] - nz]);
  }
  for (let i = 0; i < pts.length - 1; i++) { if (B.poly(g, [L[i], L[i + 1], R[i + 1], R[i]])) g.fill(); }
}
export function pitchLines(g, B, { color = '#F4F6F0', alpha = 0.92, haze = '#BFD3C0', fog = 1 } = {}) {
  const { hx, hz, box, six, spot, circle, line } = PITCH;
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color;
  const seg = (a, b) => ribbon(g, B, [a, b], line), arc = (cx, cz, r, a0, a1, n = 48) => ribbon(g, B, Array.from({ length: n + 1 }, (_, k) => { const a = lerp(a0, a1, k / n); return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; }), line);
  seg([-hx, -hz], [hx, -hz]); seg([-hx, hz], [hx, hz]); seg([-hx, -hz], [-hx, hz]); seg([hx, -hz], [hx, hz]); seg([0, -hz], [0, hz]);
  arc(0, 0, circle, 0, TAU, 72);
  for (const sd of [-1, 1]) {
    const gx = sd * hx;
    for (const [d, w2] of [box, six]) { seg([gx, -w2], [gx - sd * d, -w2]); seg([gx - sd * d, -w2], [gx - sd * d, w2]); seg([gx - sd * d, w2], [gx, w2]); }
    const sp = gx - sd * spot, a = Math.acos((box[0] - spot) / circle);  // the D: the part of the circle outside the box
    arc(sp, 0, circle, sd > 0 ? PI - a : -a, sd > 0 ? PI + a : a, 24);
    for (const cz of [-hz, hz]) arc(gx, cz, 1, 0, TAU, 16);  // corner arcs (whole circles: the outer halves are off the pitch, under the boards' shadow)
    const spts = Array.from({ length: 10 }, (_, k) => [sp + Math.cos(k / 10 * TAU) * 0.11, 0.006, Math.sin(k / 10 * TAU) * 0.11]);
    if (B.poly(g, spts)) g.fill();
  }
  const cpts = Array.from({ length: 10 }, (_, k) => [Math.cos(k / 10 * TAU) * 0.13, 0.006, Math.sin(k / 10 * TAU) * 0.13]);
  if (B.poly(g, cpts)) g.fill();
  g.restore();
}

// ---------------------------------------------------------------- goals: posts, crossbar and a net that bulges
// side: -1 or +1 (the goal at x = side * 52.5). hit: {t0, y, z, k} the ball hits the back net at time t0 at (y, z)
export function goalItems(B, side, { t = 0, hit = null, net = '#F4F4F0', post = '#FBFBF8' } = {}) {
  const gx = side * PITCH.hx, hw = PITCH.goalW / 2, gh = PITCH.goalH, d0 = 2.0, d1 = 1.1, items = [];
  // the net's shape: top from the crossbar back d1 m (y 2.36), back panel down to the ground d0 m behind the line
  const bulge = (y, z) => {
    if (!hit || t < hit.t0) return 0;
    const dt = t - hit.t0, r2 = ((y - hit.y) ** 2 + (z - hit.z) ** 2) / 1.1, k = hit.k ?? 1;
    return k * 0.9 * Math.exp(-r2) * Math.exp(-dt * 2.2) * Math.sin(Math.min(dt * 9, PI / 2 + dt * 6));
  };
  const back = (u, v) => { const y = lerp(2.36, 0, v), z = lerp(-hw, hw, u), x = gx + side * lerp(d1, d0, v); return [x + side * bulge(y, z), y, z]; };
  const top = (u, v) => { const z = lerp(-hw, hw, u), x = gx + side * lerp(0, d1, v); return [x + side * bulge(2.36, z) * v, lerp(gh, 2.36, v), z]; };
  // a side panel: u from the post (front) to the back, v from the top edge down to the grass
  const sideP = (sz) => (u, v) => { const top = [gx + side * d1 * u, lerp(gh, 2.36, u)], bot = [gx + side * d0 * u, 0]; return [lerp(top[0], bot[0], v), lerp(top[1], bot[1], v), sz * hw]; };
  const mesh = (fn, nu, nv, step = 1) => g => {
    // thin cord: about 1.2 cm, never more than 1.8 px, and fainter the closer it is (a net right at the lens is a haze)
    const p0 = B.project(...fn(0.5, 0.5)), lw = clamp(p0.s * 0.006, 0.5, 1.8), al = 0.62 * clamp(1.4 - p0.s / 260, 0.45, 1);
    g.save(); g.strokeStyle = rgba(net, al); g.lineWidth = lw;
    for (let i = 0; i <= nu; i += step) { g.beginPath(); let ok = false; for (let j = 0; j <= nv; j++) { const q = fn(i / nu, j / nv); if (depthOf(B, q) < 0.3) { ok = false; continue; } const p = B.project(...q); ok ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); ok = true; } g.stroke(); }
    for (let j = 0; j <= nv; j += step) { g.beginPath(); let ok = false; for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); if (depthOf(B, q) < 0.3) { ok = false; continue; } const p = B.project(...q); ok ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); ok = true; } g.stroke(); }
    g.restore();
  };
  const c = (fn) => fn(0.5, 0.5);
  items.push({ d: depthOf(B, c(back)), draw: mesh(back, 30, 10) });
  items.push({ d: depthOf(B, c(top)), draw: mesh(top, 30, 5) });
  for (const sz of [-1, 1]) { const fn = sideP(sz); items.push({ d: depthOf(B, c(fn)), draw: mesh(fn, 5, 10) }); }
  const bar = (a, b, w) => g => {
    if (depthOf(B, a) < 0.3 || depthOf(B, b) < 0.3) return;
    const p = B.project(...a), q = B.project(...b), lw = Math.max(1.5, w * (p.s + q.s) / 2);
    g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(30,40,40,0.35)'; g.lineWidth = lw * 1.25; g.beginPath(); g.moveTo(p.x + lw * 0.12, p.y + lw * 0.1); g.lineTo(q.x + lw * 0.12, q.y + lw * 0.1); g.stroke();
    g.strokeStyle = post; g.lineWidth = lw; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = lw * 0.3; g.beginPath(); g.moveTo(p.x - lw * 0.18, p.y - lw * 0.1); g.lineTo(q.x - lw * 0.18, q.y - lw * 0.1); g.stroke();
    g.restore();
  };
  for (const sz of [-1, 1]) { const a = [gx, 0, sz * hw], b = [gx, gh, sz * hw]; items.push({ d: depthOf(B, [gx, gh / 2, sz * hw]) - 0.05, draw: bar(a, b, 0.12) }); }
  items.push({ d: depthOf(B, [gx, gh, 0]) - 0.05, draw: bar([gx, gh, -hw], [gx, gh, hw], 0.12) });
  return items;
}
// corner flags: thin poles with a flag that flutters
export function flagItems(B, t = 0, { color = '#E8C23A' } = {}) {
  const out = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * PITCH.hx, z = sz * PITCH.hz, top = [x, 1.5, z];
    out.push({ d: depthOf(B, [x, 0.8, z]), draw: g => {
      if (depthOf(B, top) < 0.4) return;
      const p = B.project(x, 0, z), q = B.project(...top), w = Math.max(1, p.s * 0.03);
      g.save(); g.strokeStyle = '#F0EEE6'; g.lineWidth = w; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      const f1 = B.project(x + 0.45 * Math.cos(t * 3 + sx), 1.38 + Math.sin(t * 7 + sz) * 0.04, z + 0.25), f2 = B.project(x, 1.2, z);
      g.fillStyle = color; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(f1.x, f1.y); g.lineTo(f2.x, f2.y); g.closePath(); g.fill(); g.restore();
    } });
  }
  return out;
}

// ---------------------------------------------------------------- the ball
// 12 dark panels at the vertices of an icosahedron (a classic ball), turned by the ball's spin
const ICO = (() => { const p = (1 + Math.sqrt(5)) / 2, v = [[-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0], [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p], [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1]]; return v.map(nrm); })();
function rotAxis(v, ax, a) {  // Rodrigues
  const c = Math.cos(a), s = Math.sin(a), d = dot(ax, v);
  return [v[0] * c + (ax[1] * v[2] - ax[2] * v[1]) * s + ax[0] * d * (1 - c), v[1] * c + (ax[2] * v[0] - ax[0] * v[2]) * s + ax[1] * d * (1 - c), v[2] * c + (ax[0] * v[1] - ax[1] * v[0]) * s + ax[2] * d * (1 - c)];
}
export const BALL_R = 0.15;  // a cartoon ball, a little bigger than the real 0.11 m so it reads in wide shots
export function ballItem(B, pos, { spin = 0, axis = [0, 0, 1], r = BALL_R, alpha = 1, glow = 0, trail = null } = {}) {
  return { get d() { return depthOf(B, pos); }, draw: g => drawBall(g, B, pos, { spin, axis, r, alpha, glow, trail }) };
}
export function drawBall(g, B, pos, { spin = 0, axis = [0, 0, 1], r = BALL_R, alpha = 1, glow = 0, trail = null } = {}) {
  if (depthOf(B, pos) < 0.3 || alpha <= 0) return;
  const p = B.project(...pos), R = r * p.s;
  if (R < 0.6) return;
  g.save(); g.globalAlpha *= alpha;
  if (trail) {  // a streak behind a fast ball: [[x,y,z], ...] older points
    for (let i = 0; i < trail.length; i++) {
      if (depthOf(B, trail[i]) < 0.3) continue;
      const q = B.project(...trail[i]); g.globalAlpha = alpha * 0.18 * (i + 1) / trail.length; g.fillStyle = '#FFFFFF';
      g.beginPath(); g.arc(q.x, q.y, r * q.s * 0.9, 0, TAU); g.fill();
    }
    g.globalAlpha = alpha;
  }
  if (glow > 0) { const gg = g.createRadialGradient(p.x, p.y, R * 0.5, p.x, p.y, R * 3.2); gg.addColorStop(0, rgba('#FFF6D8', 0.55 * glow)); gg.addColorStop(1, rgba('#FFF6D8', 0)); g.fillStyle = gg; g.beginPath(); g.arc(p.x, p.y, R * 3.2, 0, TAU); g.fill(); }
  const base = g.createRadialGradient(p.x - R * 0.35, p.y - R * 0.4, R * 0.1, p.x, p.y, R);
  base.addColorStop(0, '#FFFFFF'); base.addColorStop(0.65, '#ECEDEA'); base.addColorStop(1, '#B9BDB8');
  g.fillStyle = base; g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
  if (R > 2.2) {
    // points on the ball go to the screen through the camera's right and up axes (orthographic: the ball is small)
    const view = nrm(sub(B.E, pos)), sR = B.R, sU = B.U;
    g.save(); g.beginPath(); g.arc(p.x, p.y, R * 0.995, 0, TAU); g.clip();
    for (const c0 of ICO) {
      const c = rotAxis(c0, axis, spin), facing = dot(c, view);
      if (facing < -0.15) continue;
      const t1 = nrm(Math.abs(c[1]) < 0.9 ? [c[2], 0, -c[0]] : [1, 0, 0]), t2 = [c[1] * t1[2] - c[2] * t1[1], c[2] * t1[0] - c[0] * t1[2], c[0] * t1[1] - c[1] * t1[0]];
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * TAU, s = Math.sin(0.36), cc = Math.cos(0.36);
        const q = [c[0] * cc + (t1[0] * Math.cos(a) + t2[0] * Math.sin(a)) * s, c[1] * cc + (t1[1] * Math.cos(a) + t2[1] * Math.sin(a)) * s, c[2] * cc + (t1[2] * Math.cos(a) + t2[2] * Math.sin(a)) * s];
        const x = p.x + dot(q, sR) * R, y = p.y - dot(q, sU) * R;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.fillStyle = `rgba(30,34,40,${clamp(0.25 + facing * 0.75, 0.15, 0.92).toFixed(3)})`; g.fill();
    }
    g.restore();
  }
  const rim = g.createRadialGradient(p.x, p.y, R * 0.55, p.x, p.y, R); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(20,30,20,0.32)');
  g.fillStyle = rim; g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(p.x - R * 0.38, p.y - R * 0.42, R * 0.2, R * 0.13, -0.6, 0, TAU); g.fill();
  g.restore();
}
// a soft round shadow on the grass under a point at height y
export function groundShadow(g, B, x, z, { r = 0.5, rz = null, y = 0, a = 0.32, ang = 0 } = {}) {
  const k = 1 / (1 + y * 0.6), A = a * k * k;
  if (A < 0.01 || depthOf(B, [x, 0, z]) < 0.4) return;
  const pts = Array.from({ length: 20 }, (_, i) => { const t = i / 20 * TAU, ex = Math.cos(t) * r * (1 + y * 0.25), ez = Math.sin(t) * (rz ?? r) * (1 + y * 0.25); return [x + ex * Math.cos(ang) - ez * Math.sin(ang), 0.01, z + ex * Math.sin(ang) + ez * Math.cos(ang)]; });
  if (!B.poly(g, pts)) return;
  const p = B.project(x, 0, z), R = r * p.s * 1.25;
  const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, R));
  gr.addColorStop(0, `rgba(10,24,8,${A.toFixed(3)})`); gr.addColorStop(0.6, `rgba(10,24,8,${(A * 0.75).toFixed(3)})`); gr.addColorStop(1, 'rgba(10,24,8,0)');
  g.fillStyle = gr; g.fill();
}

// ---------------------------------------------------------------- paths
// Smooth positions on the grass through timed keys: [[t, x, z, {stop}?], ...]. Velocities come from the neighbours
// (Catmull-Rom on time, so speed is continuous across keys); a key with {stop: true} has zero velocity. at(t) gives the
// position, velocity, speed, a heading that turns smoothly into the direction of travel, the distance run and the
// running-cycle phase (one full cycle per stride, a stride that lengthens with speed)
export class Mover {
  constructor(keys, { hz = 120, stride = v => clamp(1.15 + 0.3 * v, 1.3, 3.6), face = null, turn = 9, heading0 = null } = {}) {
    this.keys = keys; const n = keys.length;
    const T = keys.map(k => k[0]), P = keys.map(k => [k[1], k[2]]);
    const M = keys.map((k, i) => {
      if (k[3]?.stop || n < 2) return [0, 0];
      if (k[3]?.v) return k[3].v;
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      if (b === a) return [0, 0];
      return [(P[b][0] - P[a][0]) / (T[b] - T[a]), (P[b][1] - P[a][1]) / (T[b] - T[a])];
    });
    this.t0 = T[0]; this.t1 = T[n - 1]; this.dt = 1 / hz;
    const pos = t => {
      if (t <= T[0]) return [...P[0]]; if (t >= T[n - 1]) return [...P[n - 1]];
      let i = 0; while (i < n - 2 && t > T[i + 1]) i++;
      const h = T[i + 1] - T[i], u = (t - T[i]) / h, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      return [0, 1].map(c => h00 * P[i][c] + h10 * h * M[i][c] + h01 * P[i + 1][c] + h11 * h * M[i + 1][c]);
    };
    const S = []; let dist = 0, phase = 0, head = heading0;
    for (let t = this.t0 - 0.5; t <= this.t1 + 0.5 + 1e-9; t += this.dt) {
      const p = pos(t), q = pos(t + this.dt), vx = (q[0] - p[0]) / this.dt, vz = (q[1] - p[1]) / this.dt, sp = Math.hypot(vx, vz);
      const want = face ? face(t, { x: p[0], z: p[1], vx, vz, sp }) : null;
      const target = want ?? (sp > 0.5 ? Math.atan2(vz, vx) : head);
      if (head == null) head = target ?? 0;
      if (target != null) { let d = target - head; d = Math.atan2(Math.sin(d), Math.cos(d)); head += d * clamp(turn * this.dt); }
      S.push({ t, x: p[0], z: p[1], vx, vz, sp, dist, phase, head });
      dist += sp * this.dt; phase += TAU * sp * this.dt / stride(sp);
    }
    this.S = S;
  }
  at(t) {
    const S = this.S, f = clamp((t - S[0].t) / this.dt, 0, S.length - 1.001), i = Math.floor(f), u = f - i, a = S[i], b = S[i + 1];
    let dh = b.head - a.head; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    return { t, x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u), vx: lerp(a.vx, b.vx, u), vz: lerp(a.vz, b.vz, u), sp: lerp(a.sp, b.sp, u),
      dist: lerp(a.dist, b.dist, u), phase: lerp(a.phase, b.phase, u), head: a.head + dh * u };
  }
  // times in [ta, tb] when the left (or right) leg is fully forward: where a dribbler touches the ball
  steps(ta, tb, { side = 'L', every = 1, offset = PI / 2 } = {}) {
    const out = []; let k = 0;
    for (let i = 1; i < this.S.length; i++) {
      const a = this.S[i - 1], b = this.S[i]; if (b.t < ta || a.t > tb) continue;
      const o = offset + (side === 'L' ? 0 : PI);
      const ma = Math.floor((a.phase - o) / TAU), mb = Math.floor((b.phase - o) / TAU);
      if (mb > ma) { if (k++ % every === 0) out.push(lerp(a.t, b.t, ((mb * TAU + o) - a.phase) / Math.max(1e-6, b.phase - a.phase))); }
    }
    return out;
  }
}

// The ball through timed segments: {t0, t1, kind: 'roll' | 'air' | 'hold' | 'fn', from, to, decay?, g?, fn?}.
// roll: along the grass, fast then slowing (exponential decay); air: a parabola under gravity g (lower g = a floatier,
// slower-looking flight); fn: a function of t (a ball at a player's foot). The spin follows the distance travelled
export class BallPath {
  constructor(segs, { r = BALL_R } = {}) {
    this.segs = [...segs].sort((a, b) => a.t0 - b.t0); this.r = r;
    this.T0 = this.segs[0].t0; this.T1 = this.segs[this.segs.length - 1].t1;
    this.spinTab = []; let ang = 0, prev = this.raw(this.T0 - 0.001);
    for (let t = this.T0 - 0.5; t <= this.T1 + 1; t += 1 / 240) {
      const p = this.raw(t), d = sub(p, prev), l = Math.hypot(d[0], d[2]) + Math.abs(d[1]) * 0.3;
      ang += l / r; this.spinTab.push([t, ang, l > 1e-5 ? nrm([d[2], 0, -d[0]]) : null]); prev = p;
    }
  }
  raw(t) {
    let s = this.segs[0];
    if (t <= s.t0) return this.posIn(s, s.t0);
    for (const q of this.segs) { if (t >= q.t0) s = q; }
    return this.posIn(s, Math.min(t, s.t1));
  }
  posIn(s, t) {
    const u = clamp((t - s.t0) / Math.max(1e-6, s.t1 - s.t0));
    if (s.kind === 'hold') return s.from.length === 3 ? [...s.from] : [s.from[0], this.r, s.from[1]];
    if (s.kind === 'fn') return s.fn(t);
    const a = s.from.length === 3 ? s.from : [s.from[0], this.r, s.from[1]], b = s.to.length === 3 ? s.to : [s.to[0], this.r, s.to[1]];
    if (s.kind === 'roll') { const k = s.decay ?? 1.6, e = (1 - Math.exp(-k * u)) / (1 - Math.exp(-k)); return lerp3(a, b, e); }
    // air: x, z linear; y a parabola under gravity
    const T = s.t1 - s.t0, gr = s.g ?? 9.81, y = lerp(a[1], b[1], u) + 0.5 * gr * T * T * u * (1 - u);
    return [lerp(a[0], b[0], u), y, lerp(a[2], b[2], u)];
  }
  at(t) {
    const p = this.raw(t), tab = this.spinTab, i = clamp(Math.round((t - (this.T0 - 0.5)) * 240), 0, tab.length - 1);
    let axis = null; for (let k = i; k >= 0 && !axis; k--) axis = tab[k][2];
    return { pos: p, spin: tab[i][1], axis: axis || [0, 0, 1] };
  }
}
// ball segments for a dribble: at each touch the ball leaves the foot and rolls to where the next touch will be
export function dribbleSegs(mover, touches, { ahead = 0.42, side = -0.1, decay = 2.2, r = BALL_R } = {}) {
  const foot = t => { const s = mover.at(t), f = [Math.cos(s.head), Math.sin(s.head)], rt = [Math.sin(s.head), -Math.cos(s.head)]; return [s.x + f[0] * ahead + rt[0] * side, r, s.z + f[1] * ahead + rt[1] * side]; };
  const segs = [];
  for (let i = 0; i < touches.length - 1; i++) segs.push({ t0: touches[i], t1: touches[i + 1], kind: 'roll', from: foot(touches[i]), to: foot(touches[i + 1]), decay });
  return { segs, foot };
}

// ---------------------------------------------------------------- kits and players
export const KITS = {
  // Argentina v England, 1986: dark blue shirts bought in Mexico City, white V-neck, silver iron-on numbers
  arg86: { shirt: '#2C55AE', shirtD: '#1C3C86', stripe: 'rgba(255,255,255,0.07)', trim: '#F4F4F2', num: '#D6DCE2', numEdge: '#5E6670', shorts: '#15171D', socks: '#22448E', band: '#EDEDE8', boots: '#141518', badge: '#9CCBEF' },
  // England: white shirts with navy trim, the pale blue shorts and socks of the third kit
  eng86: { shirt: '#F3F3EF', shirtD: '#CDD2D8', trim: '#1E2D5C', num: '#1E2D5C', numEdge: '#F3F3EF', shorts: '#86B0DE', socks: '#86B0DE', band: '#F3F3EF', boots: '#141518', badge: '#1E2D5C' },
  // England's goalkeeper: silver-grey with navy, long sleeves, gloves
  engGK86: { shirt: '#AEB5BD', shirtD: '#8A929C', trim: '#1E2D5C', num: '#1E2D5C', numEdge: '#AEB5BD', shorts: '#1E2D5C', socks: '#AEB5BD', band: '#1E2D5C', boots: '#141518', long: true, gloves: '#EEEDE6', badge: '#1E2D5C' },
  ref86: { shirt: '#18191D', shirtD: '#0E0F12', trim: '#EDEDE8', num: null, shorts: '#18191D', socks: '#18191D', band: '#EDEDE8', boots: '#111214' },
  plainWhite: { shirt: '#F2F2EE', shirtD: '#CFD3D6', trim: '#F2F2EE', num: null, shorts: '#15171D', socks: '#22448E', band: '#EDEDE8', boots: '#141518' },
};
export const POSE = {
  stand: () => ({ hip: [[0.02, 0.06], [0.02, 0.06]], knee: [0.06, 0.06], sh: [[0.1, 0.09], [0.1, 0.09]], el: [0.32, 0.32], lean: 0.02 }),
  run(phase, I = 1, dribble = 0) {
    const amp = lerp(0.6, 0.46, dribble) * I, L = [phase, phase + PI];
    return { hip: L.map(p => [amp * Math.sin(p), 0.04 + dribble * 0.07]), knee: L.map(p => 0.16 + I * lerp(1.45, 1.05, dribble) * Math.pow(Math.max(0, Math.sin(p + 1.75)), 1.5)),
      sh: L.map(p => [-0.78 * I * Math.sin(p) + 0.08, 0.14 + dribble * 0.42]), el: [lerp(1.4, 1.0, dribble), lerp(1.4, 1.0, dribble)],
      lean: (0.15 + dribble * 0.1) * I, crouch: (0.02 + 0.08 * dribble) * I };
  },
  // a jump to win a high ball; arm: 'L' or 'R' reaches up (u 0..1 over the jump)
  jump(u, { arm = 'L', h = 0.55 } = {}) {
    const rise = smooth(clamp(u / 0.45)), air = clamp((u - 0.12) / 0.78), lift = h * Math.sin(PI * air) * (u > 0.12 && u < 0.9 ? 1 : 0), A = arm === 'L' ? 0 : 1;
    const sh = [[0.5, 0.55], [0.5, 0.55]], el = [1.2, 1.2];
    sh[A] = [lerp(0.6, 3.05, rise), 0.12]; el[A] = lerp(1.1, 0.06, rise);
    return { hip: [[lerp(0.1, 0.95, rise), 0.08], [lerp(0.1, -0.15, rise), 0.08]].map((x, i) => i === A ? [lerp(0.1, -0.12, rise), 0.08] : [lerp(0.15, 0.95, rise), 0.1]),
      knee: [0, 1].map(i => i === A ? lerp(0.3, 0.55, rise) : lerp(0.4, 1.55, rise)), sh, el, lean: lerp(0.25, -0.06, rise), crouch: u < 0.12 ? 0.14 * Math.sin(PI * u / 0.12) : 0, lift, ground: lift <= 0.001, look: 0.35 * rise };
  },
  // left-footed shot: wind-up, strike at u = 0.5, follow-through
  kick(u, foot = 'L') {
    const F = foot === 'L' ? 0 : 1, P = 1 - F, back = smooth(clamp(u / 0.45)), str = smooth(clamp((u - 0.42) / 0.16)), fol = smooth(clamp((u - 0.58) / 0.42));
    const hip = [[0, 0], [0, 0]], knee = [0, 0];
    hip[F] = [lerp(lerp(0.1, -0.75, back), 0.9, str) + fol * 0.25, 0.06]; knee[F] = lerp(lerp(0.3, 1.55, back), 0.12, str) + fol * 0.25;
    hip[P] = [0.28, 0.1]; knee[P] = 0.38;
    const sh = [[0.2, 0.75], [0.2, 0.75]]; sh[F] = [lerp(0.6, -0.4, str), 0.9]; sh[P] = [lerp(-0.2, 0.7, str), 0.85];
    return { hip, knee, sh, el: [0.6, 0.6], lean: lerp(0.12, -0.08, str), crouch: 0.06 };
  },
  sit: () => ({ hip: [[1.45, 0.18], [1.35, 0.12]], knee: [0.95, 0.55], sh: [[-0.65, 0.35], [-0.5, 0.3]], el: [0.15, 0.2], lean: -0.5, pelvisY: 0.17, ground: false }),
  slide: () => ({ hip: [[1.4, 0.08], [0.45, 0.12]], knee: [0.05, 1.9], sh: [[-0.9, 0.5], [1.1, 0.55]], el: [0.1, 0.5], lean: -0.75, pelvisY: 0.24, ground: false }),
  dive: (u, sd = 1) => ({ hip: [[0.3, 0.3], [0.1, 0.25]], knee: [0.4, 0.2], sh: [[2.7, 0.3], [2.6, 0.4]], el: [0.15, 0.15], lean: lerp(0.1, 1.2, smooth(u)), pelvisY: lerp(0.95, 0.35, smooth(u)), ground: false, roll: sd * 1.2 * smooth(u) }),
  armsUp: (u = 1) => ({ sh: [[lerp(0.1, 2.8, u), 0.4], [lerp(0.1, 2.8, u), 0.4]], el: [0.3, 0.3] }),
  point: () => ({ sh: [[0.08, 0.16], [1.5, 0.02]], el: [0.25, 0.04] }),
  protest: (t = 0) => ({ sh: [[1.1 + 0.15 * Math.sin(t * 6), 0.3], [2.55, 0.35]], el: [1.2, 0.35] }),
  hold: () => ({ sh: [[1.1, 0.12], [1.1, 0.12]], el: [0.6, 0.6] }),
  trophy: () => ({ sh: [[2.95, 0.22], [2.95, 0.22]], el: [0.5, 0.5] }),
};
// blend two poses (a partial pose, like armsUp, overrides only what it has)
export function blend(a, b, w) {
  if (w <= 0) return a; if (w >= 1 && !b) return a;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const va = a[k], vb = b[k];
    if (typeof vb === 'boolean') { out[k] = w > 0.5 ? vb : va ?? vb; continue; }
    if (va === undefined) { out[k] = vb; out[k + 'W'] = w * (a[k + 'W'] ?? 1); continue; }  // e.g. pelvisY: blended in by weight
    out[k] = typeof vb === 'number' ? lerp(va, vb, w) : vb.map((x, i) => Array.isArray(x) ? x.map((y, j) => lerp(va[i][j], y, w)) : lerp(va[i], x, w));
  }
  return out;
}

// the skeleton in the world. st: {x, z, head (radians), pose}; pl: {h, build}
// Cartoon proportions as in the channel's standing figures (rule 44): a big head (a fifth of the height), a short, wide
// torso, thick limbs; the whole figure, head included, is scaled to the person's real height (k)
const SKEL = { hip: 0.93, hipW: 0.105, thigh: 0.445, shin: 0.43, ankle: 0.075, spine: 0.5, shW: 0.215, uarm: 0.285, farm: 0.265, headH: 0.4, full: 1.95 };
export const figureK = h => (h || 1.75) / SKEL.full;
export function skeleton(pl, st) {
  const k = figureK(pl.h), P = { ...POSE.stand(), ...st.pose }, th = st.head ?? 0;
  const f = [Math.cos(th), 0, Math.sin(th)], up = [0, 1, 0], r = [Math.sin(th), 0, -Math.cos(th)];
  const lean = P.lean || 0, spine = nrm(add(mul(up, Math.cos(lean)), mul(f, Math.sin(lean)))), ft = nrm(sub(mul(f, Math.cos(lean)), mul(up, Math.sin(lean))));
  const nominal = SKEL.hip * k - (P.crouch || 0) * k, py = P.pelvisY == null ? nominal : lerp(nominal, P.pelvisY, P.pelvisYW ?? 1);
  let pel = [st.x, py + (P.lift || 0), st.z];
  const legs = [-1, 1].map((sd, i) => {
    const [fl, ab] = P.hip[i], kn = P.knee[i], hipJ = add(pel, mul(r, sd * SKEL.hipW * k));
    const dir = (a) => nrm(add(mul(add(mul(up, -Math.cos(a)), mul(f, Math.sin(a))), Math.cos(ab)), mul(r, sd * Math.sin(ab))));
    const knee = add(hipJ, mul(dir(fl), SKEL.thigh * k)), ankle = add(knee, mul(dir(fl - kn), SKEL.shin * k));
    const ps = fl - kn, foot = nrm(add(mul(f, Math.cos(ps)), mul(up, Math.sin(ps) * 0.9)));
    return { hip: hipJ, knee, ankle, toe: add(add(ankle, mul(foot, 0.2 * k)), [0, -0.035 * k, 0]), heel: add(ankle, mul(foot, -0.05 * k)), sd };
  });
  if (P.ground !== false) {  // the lower foot stands on the grass
    const lo = Math.min(...legs.map(L => Math.min(L.ankle[1], L.toe[1] + 0.02 * k)));
    const dy = SKEL.ankle * k * 0.9 - lo; pel = add(pel, [0, dy, 0]);
    for (const L of legs) for (const key of ['hip', 'knee', 'ankle', 'toe', 'heel']) L[key] = add(L[key], [0, dy, 0]);
  }
  const C = add(pel, mul(spine, SKEL.spine * k));
  const arms = [-1, 1].map((sd, i) => {
    const [fl, ab] = P.sh[i], el = P.el[i], sh = add(C, mul(r, sd * SKEL.shW * k * (pl.build || 1)));
    const dir = a => nrm(add(add(mul(spine, -Math.cos(a) * Math.cos(ab)), mul(ft, Math.sin(a) * Math.cos(ab))), mul(r, sd * Math.sin(ab))));
    const elbow = add(sh, mul(dir(fl), SKEL.uarm * k)), wrist = add(elbow, mul(dir(fl + el), SKEL.farm * k));
    return { sh, elbow, wrist, hand: add(wrist, mul(dir(fl + el), 0.045 * k)), sd };
  });
  const neck = add(C, mul(spine, 0.035 * k)), look = P.look || 0;
  const hdir = nrm(add(spine, mul(ft, -0.25 * look)));
  const headC = add(neck, mul(hdir, (0.085 + SKEL.headH * 0.5) * k));
  return { k, f, r, up, spine, ft, pel, C, legs, arms, neck, headC, pose: P };
}

// a capsule between two projected points, radii in px; light from the upper left gives it a little volume
function capsule(g, p, q, r1, r2, col, shade = true) {
  const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1e-3, nx = -dy / l, ny = dx / l;
  const path = () => { g.beginPath(); g.moveTo(p.x + nx * r1, p.y + ny * r1); g.lineTo(q.x + nx * r2, q.y + ny * r2); g.arc(q.x, q.y, r2, Math.atan2(ny, nx), Math.atan2(ny, nx) + PI, true); g.lineTo(p.x - nx * r1, p.y - ny * r1); g.arc(p.x, p.y, r1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + PI, true); g.closePath(); };
  if (!shade || Math.max(r1, r2) < 3) { g.fillStyle = col; path(); g.fill(); return; }
  g.fillStyle = mix(col, '#0A0C10', 0.22); path(); g.fill();
  // the lit part: a slimmer copy nudged toward the light (0.8 r + the nudge stays inside the outline)
  const k = 0.8, m = (r1 + r2) / 2;
  g.save(); g.translate(-0.11 * m, -0.14 * m);
  g.fillStyle = col; g.beginPath();
  g.moveTo(p.x + nx * r1 * k, p.y + ny * r1 * k); g.lineTo(q.x + nx * r2 * k, q.y + ny * r2 * k);
  g.arc(q.x, q.y, r2 * k, Math.atan2(ny, nx), Math.atan2(ny, nx) + PI, true); g.lineTo(p.x - nx * r1 * k, p.y - ny * r1 * k);
  g.arc(p.x, p.y, r1 * k, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + PI, true); g.closePath(); g.fill();
  g.restore();
}
// a flat band between two projected points (no round ends): a sock turnover, an armband, a cuff
function band(g, p, q, r1, r2, col) {
  const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1e-3, nx = -dy / l, ny = dx / l;
  g.fillStyle = col; g.beginPath(); g.moveTo(p.x + nx * r1, p.y + ny * r1); g.lineTo(q.x + nx * r2, q.y + ny * r2); g.lineTo(q.x - nx * r2, q.y - ny * r2); g.lineTo(p.x - nx * r1, p.y - ny * r1); g.closePath(); g.fill();
}
function hull(pts) {  // convex hull of screen points (monotone chain)
  const P = [...pts].sort((a, b) => a.x - b.x || a.y - b.y), cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x), lo = [], hi = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
const NUMS = new Map();
function numTex(n, col, edge) {
  const key = `${n}|${col}|${edge}`;
  if (!NUMS.has(key)) NUMS.set(key, tex(200, 200, g => {
    g.font = '900 150px Rubik'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (edge) { g.strokeStyle = edge; g.lineWidth = 14; g.strokeText(String(n), 100, 108); }
    const gr = g.createLinearGradient(0, 30, 0, 180); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, col); gr.addColorStop(1, mix(col, '#555555', 0.35));
    g.fillStyle = col === '#D6DCE2' ? gr : col; g.fillText(String(n), 100, 108);
  }));
  return NUMS.get(key);
}
// map a canvas onto three projected corners (top-left, top-right, bottom-left): an affine "decal" on a body part
function decal(g, img, tl, tr, bl, a = 1) {
  g.save(); g.globalAlpha *= a; g.transform((tr.x - tl.x) / img.width, (tr.y - tl.y) / img.width, (bl.x - tl.x) / img.height, (bl.y - tl.y) / img.height, tl.x, tl.y);
  g.drawImage(img, 0, 0); g.restore();
}
// the back of a head (the cartoon rig only draws faces): hair over a skin nape, ears
function backHead(g, c, x, y, s, turn = 0) {
  const [fw, fh] = c.face, skin = (c.skin && c.skin.base) || SKIN2.base;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = mix(skin, '#000000', 0.1);
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 98 * fw + turn * 18, 10, 16, 26, 0, 0, TAU); g.fill(); }
  g.fillStyle = skin; g.beginPath(); g.ellipse(0, 6, 100 * fw, 122 * fh, 0, 0, TAU); g.fill();
  g.fillStyle = c.hairC;
  const big = c.hair === 'curly' || c.hair === 'messy' || c.hair === 'longcurly';
  g.beginPath(); g.ellipse(0, -18, (big ? 116 : 104) * fw, (big ? 122 : 112) * fh, 0, 0, TAU); g.fill();
  if (big) for (let i = 0; i < 9; i++) { const a = PI * (0.05 + i / 8 * 0.9), rr = 112 * fw; g.beginPath(); g.arc(Math.cos(a) * rr * 0.92, 40 + Math.sin(a) * 40, 26, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(-30 * fw, -70, 50 * fw, 30, -0.4, 0, TAU); g.fill();
  g.restore();
}

// draw a player. pl: {who (CAST key for the head), kit (KITS key or object), num, h (m), build, captain}
// st: {x, z, head, pose, e (expression), t, alpha, blur, shadow}. Returns the projected head (for name tags)
export function playerItems(B, pl, st) {
  const sk = skeleton(pl, st);
  // depth is read when the items are sorted, with the camera as it is then (items may be made before rig() moves it)
  return { get d() { return depthOf(B, sk.pel); }, sk, draw: g => drawSkeleton(g, B, pl, st, sk) };
}
export function drawPlayer(g, B, pl, st) { const sk = skeleton(pl, st); return drawSkeleton(g, B, pl, st, sk); }
function drawSkeleton(g, B, pl, st, sk) {
  const kit = typeof pl.kit === 'string' ? KITS[pl.kit] : pl.kit, c = CAST[pl.who] || CAST.tal, k = sk.k, b = pl.build || 1;
  if (depthOf(B, sk.pel) < 0.5) return null;
  const skin = (c.skin && c.skin.base) || SKIN2.base, skinD = mix(skin, '#000000', 0.12);
  const pr = p => B.project(p[0], p[1], p[2]), dp = p => depthOf(B, p), px = p => pr(p).s;
  const parts = [];
  // legs
  for (const L of sk.legs) {
    const d = (dp(L.hip) + dp(L.knee) + dp(L.ankle)) / 3;
    parts.push({ d, draw: () => {
      const H = pr(L.hip), K = pr(L.knee), A = pr(L.ankle), S = (H.s + K.s) / 2, s2 = (K.s + A.s) / 2;
      const kneeTop = pr(lerp3(L.knee, L.ankle, 0.12)), sockTop = pr(lerp3(L.knee, L.ankle, 0.16)), shortEnd = pr(lerp3(L.hip, L.knee, 0.4));
      capsule(g, H, K, 0.1 * k * S * b, 0.074 * k * K.s * b, skin);  // thigh
      capsule(g, K, kneeTop, 0.074 * k * K.s * b, 0.07 * k * kneeTop.s * b, skin);
      capsule(g, sockTop, A, 0.074 * k * s2 * b, 0.054 * k * A.s * b, kit.socks);  // sock over the shin pad
      if (kit.band) band(g, sockTop, pr(lerp3(L.knee, L.ankle, 0.23)), 0.077 * k * s2 * b, 0.075 * k * s2 * b, kit.band);  // the sock's turnover
      capsule(g, H, shortEnd, 0.108 * k * S * b, 0.098 * k * shortEnd.s * b, kit.shorts);  // the shorts' leg
      const T = pr(L.toe), He = pr(L.heel); capsule(g, He, T, 0.062 * k * A.s, 0.052 * k * T.s, kit.boots);  // boot
      if (T.s * k * 0.05 > 2.5) band(g, pr(lerp3(L.heel, L.toe, 0.15)), pr(lerp3(L.heel, L.toe, 0.95)), 0.012 * k * A.s, 0.012 * k * T.s, 'rgba(255,255,255,0.18)');
    } });
  }
  // shorts (the pelvis) and the shirt: convex hulls of a box round the hips and round the chest
  const box = (c0, _, hw, hd) => [-1, 1].flatMap(a => [-1, 1].map(bb => add(add(c0, mul(sk.r, a * hw)), mul(sk.ft, bb * hd))));
  const pelTop = add(sk.pel, mul(sk.spine, 0.1 * k)), pelBot = add(sk.pel, mul(sk.spine, -0.04 * k));
  parts.push({ d: dp(sk.pel) + 0.02, draw: () => {
    const pts = [...box(pelTop, 0, 0.17 * k * b, 0.1 * k), ...box(pelBot, 0, 0.17 * k * b, 0.1 * k)].map(pr);
    const hp = hull(pts); g.fillStyle = kit.shorts; g.beginPath(); hp.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.fill();
  } });
  const chest = add(sk.C, mul(sk.spine, -0.03 * k)), waist = add(sk.pel, mul(sk.spine, 0.11 * k));
  const toCam = nrm(sub(B.E, sk.C)), front = dot(sk.f, toCam);
  parts.push({ d: dp(lerp3(chest, waist, 0.5)), draw: () => {
    // the hull takes in the shoulder joints, so the sleeves grow out of the shirt instead of sitting on it like pads
    const pts = [...box(chest, 0, 0.25 * k * b, 0.14 * k), ...box(waist, 0, 0.2 * k * b, 0.125 * k), ...box(add(sk.C, mul(sk.spine, 0.03 * k)), 0, 0.15 * k * b, 0.09 * k),
      ...sk.arms.map(A => add(A.sh, mul(sk.spine, 0.035 * k)))].map(pr);
    const hp = hull(pts); if (hp.length < 3) return;
    const xs = hp.map(p => p.x), ys = hp.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    g.save(); g.beginPath(); hp.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath();
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, mix(kit.shirt, '#FFFFFF', 0.08)); gr.addColorStop(0.55, kit.shirt); gr.addColorStop(1, kit.shirtD);
    g.fillStyle = gr; g.fill(); g.clip();
    if (kit.stripe) { g.fillStyle = kit.stripe; const w = (x1 - x0); for (const fx of [0.3, 0.62]) g.fillRect(x0 + w * fx, y0, w * 0.08, y1 - y0); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x0, y1 - (y1 - y0) * 0.16, x1 - x0, (y1 - y0) * 0.16);  // the hem tucked in
    g.restore();
    if (front > 0.12) {  // V-neck and the badge
      const a = pr(add(add(sk.neck, mul(sk.r, -0.07 * k)), mul(sk.ft, 0.09 * k))), bpt = pr(add(add(sk.C, mul(sk.spine, -0.13 * k)), mul(sk.ft, 0.125 * k))), c2 = pr(add(add(sk.neck, mul(sk.r, 0.07 * k)), mul(sk.ft, 0.09 * k)));
      g.save(); g.globalAlpha *= clamp((front - 0.12) * 4); g.strokeStyle = kit.trim; g.lineWidth = Math.max(1, 0.028 * k * bpt.s); g.lineJoin = 'round';
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(bpt.x, bpt.y); g.lineTo(c2.x, c2.y); g.stroke();
      if (kit.badge) { const bd = pr(add(add(add(sk.C, mul(sk.spine, -0.14 * k)), mul(sk.r, -0.1 * k)), mul(sk.ft, 0.122 * k))); g.fillStyle = kit.badge; g.beginPath(); g.ellipse(bd.x, bd.y, Math.max(1, 0.03 * k * bd.s), Math.max(1, 0.036 * k * bd.s), 0, 0, TAU); g.fill(); }
      g.restore();
    }
    if (front < -0.15 && kit.num && pl.num != null) {  // the number on the back
      const back = (dx, dy) => pr(add(add(add(sk.C, mul(sk.spine, -dy * k)), mul(sk.r, dx * k)), mul(sk.ft, -0.122 * k)));
      // seen from behind, the camera's right is the player's right (+r), so the number's left edge is at -r
      decal(g, numTex(pl.num, kit.num, kit.numEdge), back(-0.15, 0.06), back(0.15, 0.06), back(-0.15, 0.34), clamp((-front - 0.15) * 4));
    }
  } });
  // arms
  for (const A of sk.arms) {
    const d = (dp(A.elbow) + dp(A.hand)) / 2;
    parts.push({ d, draw: () => {
      const S = pr(A.sh), E = pr(A.elbow), Wr = pr(A.wrist), Hd = pr(A.hand), sleeve = pr(lerp3(A.sh, A.elbow, 0.52)), sl0 = pr(lerp3(A.sh, A.elbow, 0.1));
      capsule(g, S, E, 0.068 * k * S.s * b, 0.058 * k * E.s * b, kit.long ? kit.shirt : skin);
      capsule(g, E, Wr, 0.058 * k * E.s * b, 0.047 * k * Wr.s * b, kit.long ? kit.shirt : skin);
      if (!kit.long) capsule(g, sl0, sleeve, 0.078 * k * S.s * b, 0.072 * k * sleeve.s * b, kit.shirt);
      else band(g, pr(lerp3(A.elbow, A.wrist, 0.82)), pr(lerp3(A.elbow, A.wrist, 0.95)), 0.05 * k * Wr.s * b, 0.05 * k * Wr.s * b, kit.trim);  // cuffs
      if (pl.captain && A.sd < 0) band(g, pr(lerp3(A.sh, A.elbow, 0.36)), pr(lerp3(A.sh, A.elbow, 0.5)), 0.092 * k * S.s * b, 0.088 * k * S.s * b, pl.captain);  // captain's armband
      g.fillStyle = kit.gloves || skin; g.beginPath(); g.arc(Hd.x, Hd.y, Math.max(1, (kit.gloves ? 0.075 : 0.058) * k * Hd.s), 0, TAU); g.fill();
      if (kit.gloves) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(Hd.x + 0.02 * k * Hd.s, Hd.y + 0.02 * k * Hd.s, Math.max(1, 0.05 * k * Hd.s), 0, TAU); g.fill(); }
    } });
  }
  // neck and head
  const hp = pr(sk.headC), hd = dp(sk.headC);
  const view = nrm(sub(B.E, sk.headC)), facing = dot(sk.f, [view[0], 0, view[2]]) / (Math.hypot(view[0], view[2]) || 1);
  const turn = clamp(dot(sk.f, B.R) * 1.1, -0.95, 0.95) * (facing > 0 ? 1 : -1);
  parts.push({ d: hd + 0.01, draw: () => { const N = pr(sk.neck), Ch = pr(add(sk.neck, mul(sk.spine, 0.12 * k))); capsule(g, N, Ch, 0.07 * k * N.s, 0.066 * k * Ch.s, skinD, false); } });
  parts.push({ d: hd, draw: () => {
    const s = SKEL.headH * k * hp.s / 250 * (pl.headScale || 1);
    if (facing > -0.3) drawChar(g, pl.who, { x: hp.x, y: hp.y, s, e: { ...(typeof st.e === 'string' ? EXPR[st.e] : st.e || EXPR.neutral), turn }, t: st.t || 0, noBody: true, tilt: (st.pose?.roll || 0) * 0.5 });
    else backHead(g, c, hp.x, hp.y, s, turn);
  } });
  parts.sort((a, b2) => b2.d - a.d);
  g.save(); if (st.alpha != null) g.globalAlpha *= st.alpha;
  if (st.blur > 0.5) g.filter = `blur(${st.blur.toFixed(1)}px)`;
  for (const p of parts) p.draw();
  g.restore();
  return { head: hp, headD: hd, sk };
}
export function playerShadow(g, B, pl, st, { a = 0.3 } = {}) {
  // the noon sun is almost overhead: a small, dark shadow right under the body, a little toward +z
  const k = figureK(pl.h), lift = st.pose?.lift || 0;
  groundShadow(g, B, st.x + 0.05, st.z + 0.12, { r: 0.36 * k, rz: 0.24 * k, y: lift, a, ang: st.head ?? 0 });
}

// draw depth-sorted drawables, far to near
export function drawSorted(g, items) {
  const list = items.map(it => [it.d, it]).sort((a, b) => b[0] - a[0]);  // one depth read per item, at draw time
  for (const [d, it] of list) if (d > 0.3) it.draw(g);
}
