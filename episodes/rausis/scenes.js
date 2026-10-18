// The grandmaster in the bathroom: Igors Rausis, 58, the oldest player in the world's top 100, kept getting stronger
// until July 2019, when a phone was found in the toilet he had just used at the Strasbourg Open. A photo of him on the
// toilet lid with a chess program went round the world (an iPhone 4, in his own words); he signed that the phone was
// his, FIDE banned him for six years and took his GM title; a year later he turned up at a small tournament in Latvia
// as Isa Kasimi, and half the room knew him. Sources: SOURCES.md.
// v2 (rules 42, 43): 62.5 s; the hook is the photo itself from the first frame; every beat is staged in a 3D set the
// camera moves through (a tiled bathroom with three stalls, a wall of the top 100, rating pillars, the club table,
// the FIDE monitor wall, newspapers spinning down on a world map, an iPhone 4 on a turntable, the arbiters' office,
// the Baltic in dots, a badge on a lanyard, the club in Valka). Light tone: he died in 2024, no mockery.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, room, table, ENV, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { sprite, spriteBox } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { DotMap, CITY } from '../../engine/js/map.js';
import { armsUp, handsOnHead } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

// ---------- cast: Rausis after the 2011 Commons photo (thick short grey hair with a fringe, thin metal glasses, a slim
// face, a dark sweater); everyone else is a generic player ----------
CAST.rausis = { face: [0.9, 1.08, 0.82], hair: 'magnus', hairC: '#ABA9A3', brow: '#77736B', suit: '#47423E', suitD: '#34302C', shirt: 'tee', glasses: 'thin', age: 0.5, iris: '#6A5A48', ears: 1.04 };
CAST.gmA = { face: [0.98, 1.04, 0.9], hair: 'receding', hairC: '#3A302A', brow: '#2E2620', suit: '#2E3440', suitD: '#20242C', shirt: 'tie', tie: '#5A2A2A', glasses: true, ears: 1.02 };
CAST.gmB = { face: [0.95, 1.06, 0.86], hair: 'parted', hairC: '#2A201A', brow: '#221A15', suit: '#4A3A2E', suitD: '#36291F', shirt: 'tie', tie: '#2A3A4A', ears: 1.04 };
CAST.amateur = { face: [1.02, 1.0, 0.95], hair: 'messy', hairC: '#6A4A2E', brow: '#4A3420', suit: '#3E6A5A', suitD: '#2C4E42', shirt: 'polo', ears: 1.04 };

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream, PHONE = '#9FD8FF';
const PH = { rausis: await loadPhoto3d('../episodes/rausis/photos/rausis2011') };
const MAP = await new DotMap().init();
CITY['Strasbourg'] = [7.75, 48.58]; CITY['Valka'] = [26.02, 57.78]; CITY['Berlin'] = [13.4, 52.52]; CITY['Madrid'] = [-3.7, 40.42];
const CREDIT = 'Photo: Mt7 / Wikimedia Commons, CC BY-SA 3.0';

// ---------- calm rooms (rule 30) ----------
const HALL = { base: '#0E0B08', wall: ['#5A4A38', '#4C3E2F'], seam: '#2E241A', rail: '#6A5236', floor: ['#2E2318', '#261D14'], light: '#FFE6B8', lightA: 0.3, windows: true };
const CLUB = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.32, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a heading in the brilliant type: letter-spaced heavy cream with a teal underline
function heading(g, text, y, a = 1, { size = 44, color = CREAM, spacing = 5 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = `${spacing}px`; g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText(text, W / 2, y); g.shadowColor = 'transparent';
  const tw = g.measureText(text).width; g.fillStyle = TEAL; g.fillRect(W / 2 - 40, y + 18, 80, 5);
  qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 30, 'text', text); g.restore();
}

// ---------- 3D toolkit: clipped lines, tiled planes, shaded convex solids (boxes, turned shapes, cylinders),
// textured quads. Every set below is built from these, so the camera can move through it ----------
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vmid = ps => ps.reduce((m, p) => [m[0] + p[0] / ps.length, m[1] + p[1] / ps.length, m[2] + p[2] / ps.length], [0, 0, 0]);
const LIGHT = vnorm([0.35, 1, -0.55]);  // the key light: from above, a little to the right, toward the usual camera side
const shadeC = (col, k) => k <= 1 ? mix('#000000', col, clamp(k)) : mix(col, '#FFFFFF', clamp(k - 1));
// a segment in world space, clipped at the near plane, added to the current path
function line3(g, a, b, near = 0.3) {
  let A = B.toCam(...a), Q = B.toCam(...b);
  if (A[2] < near && Q[2] < near) return;
  if (A[2] < near) { const k = (near - A[2]) / (Q[2] - A[2]); A = A.map((v, i) => v + (Q[i] - v) * k); }
  else if (Q[2] < near) { const k = (near - Q[2]) / (A[2] - Q[2]); Q = Q.map((v, i) => v + (A[i] - v) * k); }
  g.moveTo(B.cx + B.f * A[0] / A[2], B.cy - B.f * A[1] / A[2]); g.lineTo(B.cx + B.f * Q[0] / Q[2], B.cy - B.f * Q[1] / Q[2]);
}
// a tiled rectangle o + U·[0,1] + V·[0,1]: one fill, light painted inside it, then the grout lines
function tiled(g, o, U, V, { color, grout = 'rgba(0,0,0,0.2)', tu = 0.7, tv = tu, lw = 1.6, light = null } = {}) {
  const P = (a, b) => [o[0] + U[0] * a + V[0] * b, o[1] + U[1] * a + V[1] * b, o[2] + U[2] * a + V[2] * b];
  if (!B.poly(g, [P(0, 0), P(1, 0), P(1, 1), P(0, 1)])) return;
  g.fillStyle = color; g.fill();
  g.save(); g.clip();
  if (light) light(g);
  const nu = Math.max(1, Math.round(Math.hypot(...U) / tu)), nv = Math.max(1, Math.round(Math.hypot(...V) / tv));
  g.strokeStyle = grout; g.lineWidth = lw; g.beginPath();
  for (let i = 1; i < nu; i++) line3(g, P(i / nu, 0), P(i / nu, 1));
  for (let j = 1; j < nv; j++) line3(g, P(0, j / nv), P(1, j / nv));
  g.stroke(); g.restore();
}
// a convex solid: the faces turned to the camera are filled (no sorting needed), shaded by the angle to the key light,
// with an optional glossy highlight (porcelain, glass, metal)
function solid(g, verts, faces, col, { amb = 0.52, cols = null, a = 1, L = LIGHT, spec = 0 } = {}) {
  if (a <= 0) return;
  const c0 = vmid(verts);
  g.save(); g.globalAlpha *= a; g.lineJoin = 'round'; g.lineWidth = 1;
  faces.forEach((f, i) => {
    const p = f.map(k => verts[k]), c = vmid(p);
    let n = vnorm(vcross(vsub(p[1], p[0]), vsub(p[2], p[0])));
    if (vdot(n, vsub(c, c0)) < 0) n = n.map(v => -v);
    const toE = vsub(B.E, c);
    if (vdot(n, toE) <= 0 || !B.poly(g, p)) return;
    let k = amb + (1 - amb) * Math.max(0, vdot(n, L));
    if (spec) { const v = vnorm(toE), h = vnorm([L[0] + v[0], L[1] + v[1], L[2] + v[2]]); k += spec * Math.max(0, vdot(n, h)) ** 30; }
    g.fillStyle = g.strokeStyle = shadeC(cols?.[i] ?? col, k); g.fill(); g.stroke();
  });
  g.restore();
}
const CORNERS = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const BOXF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];  // -z, +z, -y, +y, -x, +x
function rot3([x, y, z], { rx = 0, ry = 0, rz = 0 } = {}) {
  let c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
  return [x, y, z];
}
// a box around c with half sizes h, turned by r (about its centre, or about `pivot` when given)
function oboxV(c, [hx, hy, hz], r = {}, pivot = null) {
  const pv = pivot || c;
  return CORNERS.map(([a, b, d]) => { const p = rot3([c[0] - pv[0] + a * hx, c[1] - pv[1] + b * hy, c[2] - pv[2] + d * hz], r); return [pv[0] + p[0], pv[1] + p[1], pv[2] + p[2]]; });
}
const obox = (g, c, h, col, r = {}, o = {}) => solid(g, oboxV(c, h, r, o.pivot), BOXF, col, o);
const ab = (g, [x0, y0, z0], [x1, y1, z1], col, o = {}) => obox(g, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2], col, {}, o);
// a turned shape around a vertical axis: rings [y, rx, rz, dz] from the bottom up (convex, so the porcelain bowl)
function lathe(g, x, z, rings, col, { n = 36, ...o } = {}) {
  const verts = [], faces = [];
  rings.forEach(([y, rx, rz, dz = 0]) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; verts.push([x + Math.cos(a) * rx, y, z + dz + Math.sin(a) * rz]); } });
  for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < n; i++) { const i2 = (i + 1) % n; faces.push([j * n + i, j * n + i2, (j + 1) * n + i2, (j + 1) * n + i]); }
  faces.push([...Array(n).keys()], [...Array(n).keys()].map(i => (rings.length - 1) * n + i));
  solid(g, verts, faces, col, o);
}
// a cylinder from a to b (the toilet roll, the gavel)
function cylinder(g, a, b, r, col, { n = 22, ...o } = {}) {
  const ax = vnorm(vsub(b, a)), up = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = vnorm(vcross(ax, up)), v = vcross(ax, u), verts = [];
  for (const p of [a, b]) for (let i = 0; i < n; i++) { const t = i / n * 6.2832, c = Math.cos(t) * r, s = Math.sin(t) * r; verts.push([p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s]); }
  const faces = [];
  for (let i = 0; i < n; i++) { const i2 = (i + 1) % n; faces.push([i, i2, n + i2, n + i]); }
  faces.push([...Array(n).keys()], [...Array(n).keys()].map(i => n + i));
  solid(g, verts, faces, col, o);
}
// average colour of a texture canvas: the under-fill that hides hairlines between the mapped triangles
const AVG = new Map();
function avgColor(img) {
  if (!AVG.has(img)) {
    const d = img.getContext('2d').getImageData(0, 0, img.width, img.height).data, c = [0, 0, 0]; let n = 0;
    for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 200) continue; c[0] += d[i]; c[1] += d[i + 1]; c[2] += d[i + 2]; n++; }
    AVG.set(img, '#' + c.map(v => Math.round(v / Math.max(1, n)).toString(16).padStart(2, '0')).join(''));
  }
  return AVG.get(img);
}
// a canvas mapped onto a world quad (tl, tr, bl; the 4th corner implied), cut into a grid that is finer where the depth
// changes more, each cell two exactly mapped triangles
function texQuad(g, img, tl, tr, bl, { under = true, near = 0.4, a = 1, src = null } = {}) {
  const br = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1], tr[2] + bl[2] - tl[2]];
  const cs = [tl, tr, bl, br].map(p => depth(...p)), dmax = Math.max(...cs);
  if (dmax < near || a <= 0) return;
  g.save(); g.globalAlpha *= a;
  if (under && B.poly(g, [tl, tr, br, bl])) { g.fillStyle = avgColor(img); g.fill(); }
  const dmin = Math.max(near, Math.min(...cs)), n = clamp(Math.ceil((dmax / dmin - 1) * 6), 1, 16), pts = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const u = i / n, v = j / n, w = [0, 1, 2].map(k => tl[k] + (tr[k] - tl[k]) * u + (bl[k] - tl[k]) * v);
    pts.push(depth(...w) < near ? null : B.project(...w));
  }
  const [sx, sy, sw, sh] = src || [0, 0, img.width, img.height], iw = sw / n, ih = sh / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const A = pts[j * (n + 1) + i], Q = pts[j * (n + 1) + i + 1], R = pts[(j + 1) * (n + 1) + i], S = pts[(j + 1) * (n + 1) + i + 1];
    if (!A || !Q || !R || !S) continue;
    texTri(g, img, sx + i * iw, sy + j * ih, iw, ih, A, Q, R, false); texTri(g, img, sx + i * iw, sy + j * ih, iw, ih, S, R, Q, true);
  }
  g.restore();
}
const tex = (w, h, draw) => { const c = makeCanvas(w, h), x = c.getContext('2d'); draw(x, w, h); return c; };

// ---------- people in 3D: limbs between world points, shoes, a man seated on a toilet lid, a walker ----------
function limb(g, a, b, wa, wb, col, colD = mix(col, '#000000', 0.4)) {
  if (depth(...a) < 0.5 || depth(...b) < 0.5) return;
  const P = B.project(...a), Q = B.project(...b), w0 = wa * P.s, w1 = wb * Q.s;
  const dx = Q.x - P.x, dy = Q.y - P.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const gr = g.createLinearGradient(P.x + nx * w0, P.y + ny * w0, P.x - nx * w0, P.y - ny * w0); gr.addColorStop(0, colD); gr.addColorStop(0.42, col); gr.addColorStop(1, colD);
  g.fillStyle = gr; g.beginPath(); g.moveTo(P.x + nx * w0, P.y + ny * w0); g.lineTo(Q.x + nx * w1, Q.y + ny * w1); g.lineTo(Q.x - nx * w1, Q.y - ny * w1); g.lineTo(P.x - nx * w0, P.y - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(Q.x, Q.y, w1, 0, 7); g.arc(P.x, P.y, w0, 0, 7); g.fill();
}
// a leather shoe seen from the front: (cx, ty) the middle of the hem, s the projected scale there
function shoe(g, cx, ty, s) {
  const hw = s * 0.4, h = s * 0.3, top = ty - s * 0.06;
  const gr = g.createLinearGradient(cx - hw, 0, cx + hw, 0); gr.addColorStop(0, '#1A0F09'); gr.addColorStop(0.45, '#4A2C1A'); gr.addColorStop(1, '#1A0F09');
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - hw * 0.82, top); g.lineTo(cx + hw * 0.82, top);
  g.quadraticCurveTo(cx + hw * 1.12, top + h * 0.5, cx + hw * 1.02, top + h * 0.84); g.lineTo(cx - hw * 1.02, top + h * 0.84);
  g.quadraticCurveTo(cx - hw * 1.12, top + h * 0.5, cx - hw * 0.82, top); g.closePath(); g.fill();
  g.fillStyle = '#0C0705'; g.beginPath(); g.roundRect(cx - hw * 1.06, top + h * 0.8, hw * 2.12, h * 0.22, h * 0.08); g.fill();
  g.fillStyle = 'rgba(255,228,196,0.16)'; g.beginPath(); g.ellipse(cx - hw * 0.28, top + h * 0.5, hw * 0.34, h * 0.13, -0.1, 0, 7); g.fill();
}
function footShadow(g, x, z, r, a = 1, y = FLOOR_Y) {
  if (a <= 0.02 || depth(x, y, z) < 0.6) return;
  const p = B.project(x, y, z), w = p.s * r, gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, w);
  gr.addColorStop(0, `rgba(0,0,0,${0.5 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.fillStyle = gr; g.translate(p.x, p.y); g.scale(1, 0.32); g.translate(-p.x, -p.y); g.fillRect(p.x - w, p.y - w, w * 2, w * 2); g.restore();
}

// ---------- the tournament hall: long rows of tables, a board and an opponent at every place ----------
const WOOD = (() => {
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { g.fillStyle = (f + r) % 2 ? '#E2C89A' : '#8A5A34'; g.fillRect(f * 32, r * 32, 32, 32); }
  g.strokeStyle = '#3A2414'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248); return c;
})();
const BS = 0.9;
const layout = (rows, nb, z0, dz, seed) => {  // a mid-game on every board, a different one each time
  const out = [], r = rng(seed);
  for (const xc of rows) for (let i = 0; i < nb; i++) {
    const pcs = [];
    for (let k = 0; k < 9; k++) pcs.push({ t: 'pnbrqk'[Math.floor(r() * 5.99)] || 'p', c: r() < 0.5 ? 'w' : 'b', f: Math.floor(r() * 8), rk: Math.floor(r() * 8) });
    out.push({ xc, z: z0 + i * dz, pcs, tone: r(), turn: r() });
  }
  return { rows, items: out, z0: z0 - 0.7, z1: z0 + (nb - 1) * dz + 0.7 };
};
const BIG = layout([0.3, 4, 7.7], 15, -3.6, 1.12, 47);
function hallBoards(g, L, { lit = 1, turn = 0, marks = 0, t = 0 } = {}) {
  const items = [...L.items].sort((a, b) => B.toCam(b.xc, 0, b.z)[2] - B.toCam(a.xc, 0, a.z)[2]);
  for (const xc of [...L.rows].sort((a, b) => Math.abs(b - B.E[0]) - Math.abs(a - B.E[0])))
    box(g, B, [xc - 0.62, FLOOR_Y, L.z0], [xc + 0.62, 0, L.z1], { top: '#5A3E26', side: '#2A1A0E', front: '#3A2616' });
  for (const it of items) {
    const d = B.toCam(it.xc, 0, it.z)[2]; if (d < 0.8) continue;
    const fog = clamp(1 - (d - 8) / 26, 0.25, 1) * lit, h = BS / 2, y = 0.004;
    const P = ([x, z]) => B.project(it.xc + x, y, it.z + z);
    const tl = P([-h, h]), tr = P([h, h]), bl = P([-h, -h]), br = P([h, -h]);
    g.save(); g.globalAlpha *= fog; texTri(g, WOOD, 0, 0, 256, 256, tl, tr, bl, false); texTri(g, WOOD, 0, 0, 256, 256, br, bl, tr, true); g.restore();
    for (const pc of it.pcs) {
      const p = B.project(it.xc - h + (pc.f + 0.5) * BS / 8, 0.01, it.z - h + (pc.rk + 0.5) * BS / 8), hh = p.s * 0.2;
      if (p.z < 0.8 || hh < 2) continue;
      const bx = spriteBox(hh); g.save(); g.globalAlpha *= fog; g.drawImage(sprite(pc.t, pc.c), p.x - bx.w / 2, p.y + bx.top, bx.w, bx.h); g.restore();
    }
    // the player across the board: a dark bust; with `turn` the heads swing round, with `marks` a "!" pops over them
    const hp = B.project(it.xc + 1.05, 1.25, it.z), sp = B.project(it.xc + 1.05, 0.5, it.z);
    if (hp.z > 0.8) {
      const k = hp.s, col = mix('#2A221C', '#4A3C30', it.tone), sw = turn * (it.turn < 0.5 ? 1 : 0.7) * k * 0.09;
      g.save(); g.globalAlpha *= fog;
      g.fillStyle = col; g.beginPath(); g.ellipse(sp.x, sp.y, k * 0.42, k * 0.52, 0, Math.PI, 0); g.lineTo(sp.x + k * 0.42, sp.y + k * 0.3); g.lineTo(sp.x - k * 0.42, sp.y + k * 0.3); g.fill();
      g.fillStyle = mix(col, '#C8A27A', 0.35); g.beginPath(); g.arc(hp.x + sw, hp.y, k * 0.22, 0, 7); g.fill();
      g.fillStyle = mix(col, '#000000', 0.2); g.beginPath(); g.arc(hp.x + sw, hp.y - k * 0.06, k * 0.22, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      if (marks > 0 && it.turn < 0.5 + marks * 0.5) {
        const u = seg(marks, it.turn * 0.5, it.turn * 0.5 + 0.3, ease.back);
        g.globalAlpha = fog * clamp(u * 2); g.fillStyle = GOLD; g.font = sans(Math.max(14, k * 0.42), 900); g.textAlign = 'center';
        g.fillText('!', hp.x + sw, hp.y - k * (0.35 + 0.15 * u) + Math.sin(t * 9 + it.tone * 7) * 2);
      }
      g.restore();
    }
  }
}
// the hall seen from behind the boards, or a small club room; `who` sits at the head of the hall
function hall(g, lt, t, keys, { L = BIG, env = HALL, lit = 1, turn = 0, marks = 0, who = null, e = 'focus', face = 1, wx = 4, wz = -6.6 } = {}) {
  rig(B, lt, keys, { t });
  room(g, B, env, { t, blur: 2 });
  if (who && face > 0) {
    const hp = B.project(wx, 3.1, wz); if (hp.z > 0.8) rim(g, hp.x, hp.y, hp.s * 3.2, '#FFD9A0', 0.35);
    actor(g, B, who, { x: wx, y: 3.1, z: wz, k: 1.05, e, t, face });
    box(g, B, [wx - 2.6, FLOOR_Y, wz + 0.2], [wx + 2.6, 0.3, wz + 1.3], { top: '#4A3220', side: '#22160C', front: '#2E1E10' });
  }
  hallBoards(g, L, { lit, turn, marks, t });
  lowKey(g, { cy: H * 0.44, a: 0.24 });
}
const HIGH = (yaw, dist, pitch = 0.62) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, 0, 4] });

// ---------- a portrait behind a board (him), and a game seen from the side (him against a weaker player) ----------
const FRONT = (yaw = 0.1, dist = 7.4, pitch = 0.3) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [4, 2.8, 9.2] });
const START = 'rnbqkbnr/pppppppp/8/8/4P3/2N2N2/PPPP1PPP/R1BQKB1R'.split('/');
const POS = (() => { const out = []; START.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) { f += +ch; continue; } const sq = 'abcdefgh'[f] + (8 - r); out.push({ id: sq, t: ch.toLowerCase(), c: ch === ch.toUpperCase() ? 'w' : 'b', sq, x: f + 0.5, z: 7 - r + 0.5 }); f++; } }); return out; })();
function portrait(g, lt, t, who, e, { keys, env = CLUB, pieces = POS } = {}) {
  rig(B, lt, keys, { t });
  const E = room(g, B, env, { t, blur: 3 });
  bokeh(g, t, { n: 7, seed: 5, y0: 0.06, y1: 0.4, a: 0.16, size: [50, 110], colors: ['#FFD9A0', '#FFC27A'] });
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 3.6, E.light, 0.22);
  const hands = seated(g, B, who, e, t, { z: 9.4 });
  table(g, B, E); B.drawSlab(g, SLATE);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 });
  hands();
  lowKey(g, { cy: H * 0.4, a: 0.24 });
}
// ---------- the phone and its chess app ----------
const APP = tex(300, 560, (g, w, h) => {
  g.fillStyle = '#121A1F'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#EAF2F6'; g.font = sans(20, 800); g.textAlign = 'left'; g.fillText('14:07', 16, 28);
  g.fillStyle = '#EAF7EE'; g.font = sans(34, 900); g.fillText('+1.3', 16, 80); g.fillStyle = 'rgba(234,247,238,0.55)'; g.font = sans(20, 800); g.fillText('DEPTH 24', 120, 78);
  const q = 31, bx = 14, by = 104;
  for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? '#769656' : '#EEEED2'; g.fillRect(bx + f * q, by + k * q, q + 0.5, q + 0.5); }
  for (const p of POS) { const f = p.sq.charCodeAt(0) - 97, k = 8 - +p.sq[1], b = spriteBox(q * 1.05); g.drawImage(sprite(p.t, p.c), bx + (f + 0.5) * q - b.w / 2, by + (k + 1) * q - q * 0.1 + b.top, b.w, b.h); }
  g.fillStyle = '#F2F2F2'; g.fillRect(bx + 8 * q + 6, by, 12, 8 * q); g.fillStyle = '#2A2A2A'; g.fillRect(bx + 8 * q + 6, by, 12, 8 * q * 0.42);
  g.fillStyle = '#5FE3D0'; g.fillRect(bx + 4 * q + 2, by + 3 * q + 2, q - 4, q - 4);  // the suggested move
  g.fillStyle = 'rgba(234,247,238,0.55)'; for (let i = 0; i < 5; i++) g.fillRect(16, by + 8 * q + 26 + i * 30, w - 32 - (i % 2) * 80, 12);
});
// a phone as a thin slab; c centre, r rotation; the screen (APP) on its +y face
function phone(g, c, r, { glow = 1, len = 0.46, wid = 0.25, th = 0.045 } = {}) {
  obox(g, c, [wid, th, len], '#1A1C20', r, { spec: 0.6 });
  const P = (x, z) => { const p = rot3([x, th + 0.003, z], r); return [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; };
  const tl = P(-wid * 0.86, len * 0.8), tr = P(wid * 0.86, len * 0.8), bl = P(-wid * 0.86, -len * 0.74);
  if (vdot(vcross(vsub(tr, tl), vsub(bl, tl)), vsub(B.E, tl)) <= 0) return;  // the screen faces away
  texQuad(g, APP, tl, tr, bl, { under: true });
  if (glow > 0) { const p = B.project(...c); rim(g, p.x, p.y, p.s * 1.6, PHONE, 0.45 * glow); }
}

// ---------- the bathroom: tiled walls and floor, a row of three stalls (his in the middle), sinks and a mirror,
// a fluorescent tube; the camera can be above a stall door, inside the room, or at the entrance ----------
const WC = { tile: '#BFC8C3', floor: '#3E4846', lam: '#71837F', ceil: '#121616', light: '#E6F4FF', base: '#080B0B' };
const ST = [[-2.9, 1.7], [1.7, 6.3], [6.3, 10.9]], ZF = 2.5, ZB = 9, YT = 5.4, YB = FLOOR_Y + 0.65, RX0 = -8, RX1 = 16, RZ0 = -12, RY1 = 9.2, TZ = 7.3;
const TROUSER = ['#4E5562', '#2C3038'];
function toilet(g, x, { lid = 1 } = {}) {
  ab(g, [x - 1.15, -0.45, 8.45], [x + 1.15, 1.75, ZB], '#E6E9E5', { spec: 0.5, amb: 0.62 });  // the cistern on the wall
  ab(g, [x - 0.34, 1.75, 8.62], [x + 0.34, 1.86, 8.9], '#B9BDB9', { amb: 0.6 });                // its push button
  ab(g, [x - 0.14, -1.7, 8.2], [x + 0.14, -0.45, 8.48], '#D3D6D2', { amb: 0.6 });               // the pipe
  lathe(g, x, TZ, [[FLOOR_Y, 0.58, 0.8, 0.3], [-2.55, 0.62, 0.86, 0.18], [-1.9, 0.98, 1.32, -0.18], [-1.6, 1.05, 1.44, -0.26]], '#EDEFEB', { spec: 0.55, amb: 0.56 });
  if (lid) lathe(g, x, TZ, [[-1.6, 1.04, 1.43, -0.26], [-1.44, 1.0, 1.38, -0.28]], '#F5F5F1', { spec: 0.4, amb: 0.62 });
  cylinder(g, [x + 1.98, -0.15, 5.7], [x + 1.98, -0.15, 6.45], 0.3, '#F2F0E8', { amb: 0.6 });   // the toilet roll on the partition
}
// a stall door hinged at x0 (left), swinging out toward the room by `open` (0..1); the lock shows red (occupied) or green
function stallDoor(g, x0, x1, open, { lockRed = 0 } = {}) {
  const th = open * 1.75, w = x1 - x0;
  obox(g, [x0 + w / 2, (YB + YT) / 2, ZF], [w / 2, (YT - YB) / 2, 0.06], WC.lam, { ry: th }, { pivot: [x0, 0, ZF], amb: 0.55 });
  if (open < 0.02 && depth(x1 - 0.35, 1, ZF) > 0.5 && B.E[2] < ZF) {  // the lock, on the outside of a shut door
    quad(g, [[x1 - 0.55, 1.15, ZF - 0.07], [x1 - 0.2, 1.15, ZF - 0.07], [x1 - 0.2, 0.85, ZF - 0.07], [x1 - 0.55, 0.85, ZF - 0.07]], '#B8BDBA');
    const col = lockRed ? '#E0402F' : '#3FAE5A';
    quad(g, [[x1 - 0.5, 1.1, ZF - 0.08], [x1 - 0.25, 1.1, ZF - 0.08], [x1 - 0.25, 0.9, ZF - 0.08], [x1 - 0.5, 0.9, ZF - 0.08]], col);
    if (lockRed) { const p = B.project(x1 - 0.37, 1, ZF - 0.1); rim(g, p.x, p.y, p.s * 0.9, col, 0.5); }
  }
}
// him on the closed lid with the phone: the bust is a billboard; legs, sleeves, hands and the phone are in world space
function sitter(g, t, { e = 'focus', glow = 1, x = 4, phoneOn = 1 } = {}) {
  const hz = TZ + 0.2, hy = 1.65, k = 0.95, kneeY = -1.0, kneeZ = 5.15;
  const kp = B.project(x, kneeY + 0.2, kneeZ);
  g.save(); g.beginPath(); g.rect(0, 0, W, kp.y); g.clip();
  const fp = actor(g, B, 'rausis', { x, y: hy, z: hz, k, e, t, face: -1, follow: 0.85 });
  g.restore();
  for (const sd of [-1, 1]) {  // shins, then the thighs over them
    const hip = [x + sd * 0.62, -1.2, TZ - 0.1], knee = [x + sd * 0.74, kneeY, kneeZ], ank = [x + sd * 0.8, FLOOR_Y + 0.4, kneeZ - 0.3];
    footShadow(g, ank[0], ank[2] - 0.1, 0.75);
    const s = B.project(...ank); if (s.z > 0.5) shoe(g, s.x, s.y + s.s * 0.25, s.s * 1.05);
    limb(g, knee, ank, 0.42, 0.33, TROUSER[0], TROUSER[1]);
    limb(g, hip, knee, 0.58, 0.48, TROUSER[0], TROUSER[1]);
  }
  const suit = CAST.rausis.suit, ph = [x, -0.62, 5.0], r = { rx: -0.3, ry: 0.06 };
  for (const sd of [-1, 1]) {  // sleeves: shoulder -> elbow on the thigh -> wrist at the phone
    const sh = [x + sd * 1.45, hy - 2.05, hz - 0.35], el = [x + sd * 1.25, -1.0, 5.75], wr = [x + sd * 0.45, -0.68, 4.8];
    limb(g, sh, el, 0.4, 0.33, suit); limb(g, el, wr, 0.33, 0.27, suit);
  }
  if (phoneOn) phone(g, ph, r, { glow, len: 0.52, wid: 0.3 });
  for (const sd of [-1, 1]) { const p = B.project(x + sd * 0.4, -0.66, 4.72); if (p.z > 0.5) hand(g, p.x, p.y, 0.17 * p.s); }
  if (fp && glow > 0) rim(g, fp.x, fp.y + fp.s * 0.4, fp.s * 1.5, PHONE, 0.3 * glow);  // the screen lights his face from below
  return fp;
}
function bathroom(g, t, { doors = [0, 0, 0], lockRed = 0, sit = null, mid = null, front = null, lidPhone = 0, flicker = 0, entry = 0, glowUnder = 0 } = {}) {
  g.fillStyle = WC.base; g.fillRect(0, 0, W, H);
  const fl = 1 - flicker * (Math.sin(t * 37) > 0.6 ? 0.35 : 0) * (Math.sin(t * 5.3) > 0 ? 1 : 0);
  const lit = g2 => { pool(g2, B, 4, FLOOR_Y, 1, 11, WC.light, 0.2 * fl); pool(g2, B, 4, 4, ZB, 9, '#FFFFFF', 0.1 * fl, true); };
  quad(g, [[RX0, RY1, RZ0], [RX1, RY1, RZ0], [RX1, RY1, ZB], [RX0, RY1, ZB]], WC.ceil);
  tiled(g, [RX0, FLOOR_Y, RZ0], [RX1 - RX0, 0, 0], [0, 0, ZB - RZ0], { color: WC.floor, tu: 1.5, grout: 'rgba(0,0,0,0.32)', light: lit });
  const wall = (o, U, V, c) => tiled(g, o, U, V, { color: c, tu: 0.72, grout: 'rgba(40,50,48,0.28)', light: lit });
  wall([RX0, FLOOR_Y, ZB], [RX1 - RX0, 0, 0], [0, RY1 - FLOOR_Y, 0], WC.tile);
  wall([RX0, FLOOR_Y, RZ0], [0, 0, ZB - RZ0], [0, RY1 - FLOOR_Y, 0], mix(WC.tile, '#000000', 0.14));
  wall([RX1, FLOOR_Y, RZ0], [0, 0, ZB - RZ0], [0, RY1 - FLOOR_Y, 0], mix(WC.tile, '#000000', 0.14));
  wall([RX0, FLOOR_Y, RZ0], [RX1 - RX0, 0, 0], [0, RY1 - FLOOR_Y, 0], mix(WC.tile, '#000000', 0.08));
  // the fluorescent tube over the stalls
  ab(g, [-1.5, RY1 - 0.3, 0.2], [9.5, RY1, 1.0], '#C9D2D2', { amb: 0.7 });
  if (B.poly(g, [[-1.3, RY1 - 0.31, 0.3], [9.3, RY1 - 0.31, 0.3], [9.3, RY1 - 0.31, 0.9], [-1.3, RY1 - 0.31, 0.9]])) { g.save(); g.fillStyle = rgba('#FFFFFF', 0.95 * fl); g.shadowColor = WC.light; g.shadowBlur = 50; g.fill(); g.restore(); }
  pool(g, B, 4, RY1 - 0.5, 0.6, 7, WC.light, 0.35 * fl, true);
  // sinks and a mirror on the left wall, the way in on the front wall
  ab(g, [RX0, -0.7, -7.5], [RX0 + 2.4, -0.25, -0.5], '#D2D6D2', { amb: 0.6 });
  for (const z of [-5.6, -2.4]) lathe(g, RX0 + 1.2, z, [[-1.6, 0.35, 0.3], [-0.7, 0.95, 0.8], [-0.24, 1.0, 0.85]], '#ECEEEA', { spec: 0.5, amb: 0.6, n: 24 });
  if (B.poly(g, [[RX0 + 0.03, 4.8, -7.3], [RX0 + 0.03, 4.8, -0.7], [RX0 + 0.03, 0.6, -0.7], [RX0 + 0.03, 0.6, -7.3]])) {
    const p = B.project(RX0, 2.7, -4), gr = g.createLinearGradient(p.x - 300, p.y - 300, p.x + 300, p.y + 300);
    gr.addColorStop(0, '#5E6A6C'); gr.addColorStop(0.5, '#8E9B9C'); gr.addColorStop(1, '#4A5456'); g.fillStyle = gr; g.fill();
  }
  if (entry > 0 && B.poly(g, [[2.6, FLOOR_Y, RZ0 + 0.01], [6.6, FLOOR_Y, RZ0 + 0.01], [6.6, 5.2, RZ0 + 0.01], [2.6, 5.2, RZ0 + 0.01]])) {  // the corridor light behind the way in
    g.fillStyle = '#FFE6B8'; g.fill(); pool(g, B, 4.6, FLOOR_Y, RZ0 + 3, 5 * entry, '#FFE6B8', 0.3 * entry);
  }
  obox(g, [4.6, (FLOOR_Y + 5.2) / 2, RZ0 + 0.06], [2, (5.2 - FLOOR_Y) / 2, 0.06], '#5E6E6A', { ry: -entry * 1.5 }, { pivot: [2.6, 0, RZ0 + 0.06], amb: 0.6 });  // the entrance door
  for (let i = 0; i < 3; i++) { const [x0, x1] = ST[i]; toilet(g, (x0 + x1) / 2, {}); }
  if (lidPhone > 0) phone(g, [4.1, -1.38, TZ - 0.35], { ry: 0.5 }, { glow: lidPhone });
  if (mid) mid(g);
  if (sit) sitter(g, t, sit);
  for (const x of [-2.9, 1.7, 6.3, 10.9]) {
    ab(g, [x - 0.06, YB, ZF + 0.06], [x + 0.06, YT, ZB], WC.lam, { amb: 0.55 });
    ab(g, [x - 0.1, FLOOR_Y, ZF], [x + 0.1, YB, ZF + 0.3], '#9AA3A0', { amb: 0.6, spec: 0.4 });  // the feet
  }
  for (let i = 0; i < 3; i++) {
    const [x0, x1] = ST[i];
    ab(g, [x0, YB, ZF - 0.06], [x0 + 0.6, YT, ZF + 0.06], WC.lam, { amb: 0.55 }); ab(g, [x1 - 0.6, YB, ZF - 0.06], [x1, YT, ZF + 0.06], WC.lam, { amb: 0.55 });
    stallDoor(g, x0 + 0.6, x1 - 0.6, doors[i], { lockRed: i === 1 ? lockRed : 0 });
  }
  ab(g, [-3, YT, ZF - 0.09], [11, YT + 0.12, ZF + 0.09], '#AEB6B4', { amb: 0.6, spec: 0.5 });  // the top rail
  if (glowUnder > 0) {  // the phone's cold light leaking under his shut door
    const fl = 0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 2.3);
    quad(g, [[2.3, FLOOR_Y + 0.01, ZF], [5.7, FLOOR_Y + 0.01, ZF], [6.4, FLOOR_Y + 0.01, ZF - 2.2], [1.6, FLOOR_Y + 0.01, ZF - 2.2]], rgba(PHONE, 0.18 * glowUnder * fl));
    pool(g, B, 4, FLOOR_Y, ZF - 0.8, 3.2, PHONE, 0.5 * glowUnder * fl);
    quad(g, [[2.3, FLOOR_Y + 0.02, ZF - 0.01], [5.7, FLOOR_Y + 0.02, ZF - 0.01], [5.7, YB - 0.02, ZF - 0.01], [2.3, YB - 0.02, ZF - 0.01]], rgba(PHONE, 0.75 * glowUnder * fl));
  }
  if (front) front(g);
}

// ---------- standing and walking people. The bust's top is narrowed and cut at the hips, its sides become sleeves
// that end in hands; trousers as wide as the hips taper to the shoes. Bust units from the head centre; the bust is
// drawn at HK of the usual size so that the legs get a third of the figure; the soles are 7.1 world units down ----------
const HK = 0.82, FEET = 7.1 * 100 / 1.05 / HK;
function jacketClip(g) {
  g.beginPath(); g.moveTo(-700, -900); g.lineTo(700, -900); g.lineTo(700, 198); g.lineTo(160, 212);
  g.bezierCurveTo(156, 300, 150, 380, 148, 446); g.quadraticCurveTo(0, 470, -148, 446);
  g.bezierCurveTo(-150, 380, -156, 300, -160, 212); g.lineTo(-700, 198); g.closePath(); g.clip();
}
// one trouser leg and its shoe; lift raises the foot (the swinging leg), fwd brings it toward the camera
function leg(g, sd, { lift = 0, fwd = 0, col }) {
  const ay = FEET - 34 - lift + fwd * 16, ky = (440 + ay) / 2, k = 1 + fwd * 0.04, sx = sd * 72;
  shoe(g, sx, ay + 4, 112 * k);
  const gr = g.createLinearGradient(sd * 150, 0, 0, 0);
  gr.addColorStop(0, col[1]); gr.addColorStop(0.42, col[0]); gr.addColorStop(1, mix(col[1], '#000000', 0.25));
  g.fillStyle = gr; g.beginPath(); g.moveTo(sd * 2, 396); g.lineTo(sd * 147, 396);
  g.bezierCurveTo(sd * 148, 480, sd * (118 + 6 * k), ky, sd * 112 * k, ay);
  g.lineTo(sd * 32 * k, ay); g.bezierCurveTo(sd * 28, ky + 20, sd * 14, 520, sd * 4, 478); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4;  // the crease down the front, a fold at the knee, the hem
  g.beginPath(); g.moveTo(sd * 74, 470); g.lineTo(sx, ay - 10); g.stroke();
  g.beginPath(); g.moveTo(sd * 46, ky - 6); g.quadraticCurveTo(sd * 70, ky + 4, sd * 100, ky - 8); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(sd > 0 ? 32 * k : -112 * k, ay - 8, 80 * k, 8);
}
// a standing (or walking) person; y0 = the floor under the feet, col = the trousers
function standing(g, who, x, z, { e = 'neutral', t = 0, k = 1, walk = 0, phase = 0, y0 = FLOOR_Y, col } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8) return null;
  const c = CAST[who], p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK, bob = walk ? -Math.abs(Math.cos(phase)) * 12 : 0;
  footShadow(g, x, z, 1.3 * k, 0.8, y0);
  g.save(); g.translate(p.x, p.y); g.scale(sc, sc);
  const steps = [-1, 1].map(sd => { const ph = phase + (sd > 0 ? 0 : Math.PI); return { sd, fwd: walk * Math.sin(ph), lift: walk * Math.max(0, Math.cos(ph)) * 44 }; });
  const tc = col || [mix(c.suit, '#000000', 0.1), mix(c.suitD, '#000000', 0.35)];
  for (const L of steps.sort((a, b) => a.fwd - b.fwd)) leg(g, L.sd, { ...L, col: tc });
  g.translate(0, bob);
  g.save(); jacketClip(g);
  drawChar(g, who, { e: typeof e === 'string' ? EXPR[e] : e, t });
  g.strokeStyle = 'rgba(0,0,0,0.24)'; g.lineWidth = 5;  // the arms along the sides, the hem
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 114, 236); g.quadraticCurveTo(sd * 120, 340, sd * 112, 444); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(-150, 436); g.quadraticCurveTo(0, 460, 150, 436); g.lineTo(150, 480); g.lineTo(-150, 480); g.closePath(); g.fill();
  g.restore();
  for (const sd of [-1, 1]) {  // hands out of the sleeves, swinging against the legs when he walks
    const sw = walk * Math.sin(phase + (sd > 0 ? Math.PI : 0));
    hand(g, sd * (142 - sw * 4), 470 - sw * 10, 30);
    g.fillStyle = mix(c.suitD, '#000000', 0.2); g.beginPath(); g.roundRect(sd * 128 - 26, 430, 52, 22, 8); g.fill();  // the cuff
  }
  g.restore();
  return p;
}
// a question mark or an exclamation mark floating over a world point
function mark(g, ch, x, y, z, u, t, { color = CREAM, size = 1.1 } = {}) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), k = ease.back(clamp(u * 1.3));
  g.save(); g.globalAlpha *= clamp(u * 3); g.font = sans(Math.round(p.s * size * k), 900); g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowOffsetY = 5; g.fillText(ch, p.x, p.y - Math.sin(t * 5 + x) * p.s * 0.06); g.restore();
}

// ---------- the world top 100: a wall of a hundred frames in a dark gallery; number 50 turns round, and it is him ----------
const RATE = r => Math.round(r <= 10 ? lerp(2875, 2774, (r - 1) / 9) : r <= 50 ? lerp(2774, 2686, (r - 10) / 40) : lerp(2686, 2650, (r - 50) / 50));
const SILS = ['gmA', 'gmB', 'amateur', 'arbiter'].map(who => tex(300, 300, g => drawChar(g, who, { x: 150, y: 130, s: 0.42, e: EXPR.neutral, t: 0, silhouette: true, shade: 'brightness(0.5) saturate(0.25)' })));
const PLAQ = Array.from({ length: 100 }, (_, i) => tex(220, 270, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#34424E'); gr.addColorStop(1, '#1A232B'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.rect(10, 44, w - 20, 170); g.clip(); g.drawImage(SILS[(i * 7) % 4], -40, 30, 300, 300); g.restore();
  g.strokeStyle = 'rgba(201,160,90,0.8)'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = 'rgba(201,160,90,0.9)'; g.font = sans(24, 900); g.textAlign = 'center'; g.fillText('#' + (i + 1), w / 2, 34);
  g.fillStyle = '#EAF0F2'; g.font = sans(36, 900); g.fillText(String(RATE(i + 1)), w / 2, h - 18);
}));
const PLAQ_ME = tex(220, 270, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5A4318'); gr.addColorStop(1, '#2A1E0A'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.rect(10, 44, w - 20, 170); g.clip(); drawChar(g, 'rausis', { x: w / 2, y: 128, s: 0.36, e: { ...EXPR.smug, curve: 0.3 }, t: 0 }); g.restore();
  g.strokeStyle = GOLD; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = GOLD; g.font = sans(24, 900); g.textAlign = 'center'; g.fillText('#50 · AGE 58', w / 2, 34);
  g.fillStyle = '#FFF4D6'; g.font = sans(40, 900); g.fillText('2686', w / 2, h - 16);
});
const PW = 1.2, PHh = 1.47, PCX = c => -9.5 + c * 3.0, PRY = r => 30 - r * 3.6, PZ = 9;
function topWall(g, t, flipT) {
  g.fillStyle = '#06080B'; g.fillRect(0, 0, W, H);
  quad(g, [[-12, 34, PZ + 0.1], [19, 34, PZ + 0.1], [19, -6, PZ + 0.1], [-12, -6, PZ + 0.1]], '#0C1014');
  for (let r = 0; r < 10; r++) pool(g, B, PCX(4.5), PRY(r) + 1, PZ, 9, '#9FC2E8', 0.1, true);
  const u = ease.inOut(clamp((t - flipT) / 0.45)), ph = u * Math.PI;
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10), c = i % 10, x = PCX(c), y = PRY(r);
    if (i !== 49) { texQuad(g, PLAQ[i], [x - PW, y + PHh, PZ], [x + PW, y + PHh, PZ], [x - PW, y - PHh, PZ], { under: false }); continue; }
    const pop = Math.sin(ph) * 1.2 + u * 0.5, ux = Math.cos(ph) * PW, uz = -Math.sin(ph) * PW, z = PZ - pop;
    if (ph < Math.PI / 2) texQuad(g, PLAQ[i], [x - ux, y + PHh, z - uz], [x + ux, y + PHh, z + uz], [x - ux, y - PHh, z - uz], { under: false });
    else {
      texQuad(g, PLAQ_ME, [x + ux, y + PHh, z + uz], [x - ux, y + PHh, z - uz], [x + ux, y - PHh, z + uz], { under: false });
      if (u > 0.9) { const p = B.project(x, y, z); rim(g, p.x, p.y, p.s * 3.4, GOLD, 0.35 * (u - 0.9) * 10); }
    }
  }
  bokeh(g, t, { n: 8, seed: 12, y0: 0.05, y1: 0.95, a: 0.1, size: [40, 100], colors: ['#9FC2E8', '#FFD9A0'] });
}

// ---------- the rating climb: dark pillars rising out of a gridded floor; he stands on his and rides it up ----------
const PILS = [[-4.5, 2730, 6], [11.5, 2705, 3], [-1, 2610, 12], [9, 2640, 13], [15, 2765, 9], [-7.5, 2660, 14], [2, 2750, 17], [6.5, 2690, 20]];
const pilH = r => (r - 2400) * 0.06;
function pillar(g, x, z, r, { me = false } = {}) {
  const top = FLOOR_Y + pilH(r);
  ab(g, [x - 1.25, FLOOR_Y, z - 1.25], [x + 1.25, top, z + 1.25], me ? '#4A3A22' : '#222A32', { amb: 0.42 });
  ab(g, [x - 1.4, top, z - 1.4], [x + 1.4, top + 0.25, z + 1.4], me ? GOLD : '#3A4652', { amb: 0.55 });
  const p = B.project(x, top - 0.9, z - 1.27);
  if (p.z > 0.8 && B.E[2] < z - 1.25) {
    g.save(); g.font = sans(Math.round(p.s * 0.95), 900); g.textAlign = 'center'; g.fillStyle = me ? GOLD : 'rgba(201,210,216,0.75)';
    if (me) { g.shadowColor = GOLD; g.shadowBlur = 20; }
    g.fillText(String(Math.round(r)), p.x, p.y + p.s * 0.35); g.restore();
  }
  return top;
}
function climbSet(g, t, myR, { who = true, e = 'smug', extra = null } = {}) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0A1220'); bg.addColorStop(1, '#05070A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  tiled(g, [-40, FLOOR_Y, -30], [80, 0, 0], [0, 0, 80], { color: '#0B1118', grout: 'rgba(95,227,208,0.12)', tu: 4, lw: 2, light: g2 => pool(g2, B, 4, FLOOR_Y, 4, 22, '#5FE3D0', 0.1) });
  bokeh(g, t, { n: 10, seed: 3, y0: 0.05, y1: 0.5, a: 0.12, size: [40, 120], colors: ['#5FE3D0', '#9FC2E8'] });
  const items = PILS.map(([x, r, z]) => ({ d: depth(x, 0, z), f: () => pillar(g, x, z, r) }));
  items.push({ d: depth(4, 0, 4), f: () => { const top = pillar(g, 4, 4, myR, { me: true }); if (who) standing(g, 'rausis', 4, 4, { e, t, y0: top + 0.25, col: TROUSER }); } });
  if (extra) items.push(...extra);
  items.sort((a, b) => b.d - a.d).forEach(it => it.f());
  lowKey(g, { cy: H * 0.4, a: 0.3 });
}

// ---------- his wins: one weaker opponent after another sits down across the board, loses, and the next one comes ----------
CAST.opp1 = { face: [1.0, 1.0, 0.94], hair: 'messy', hairC: '#7A5A3A', brow: '#5A4028', suit: '#4E6A3E', suitD: '#3A5030', shirt: 'tee', ears: 1.04 };
CAST.opp2 = { face: [0.95, 1.04, 0.88], hair: 'tied', hairC: '#3A2A20', brow: '#2E2119', suit: '#7A3E4A', suitD: '#5A2C36', shirt: 'tee', ears: 0.92, female: true };
CAST.opp3 = { face: [1.02, 1.02, 0.95], hair: 'buzz', hairC: '#2A201A', brow: '#221A15', suit: '#2E4A6A', suitD: '#20364E', shirt: 'hoodie', ears: 1.06 };
const OPP = [['opp1', 2240], ['opp2', 2190], ['opp3', 2150]];
// a rating tag over a head, in the world
function tag3(g, x, y, z, text, col, u) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), k = lerp(1.35, 1, ease.out(clamp(u))), fs = Math.round(clamp(p.s * 0.6, 30, 64));
  g.save(); g.globalAlpha *= clamp(u * 2); g.translate(p.x, p.y); g.scale(k, k);
  g.font = sans(fs, 900); const tw = g.measureText(text).width + fs * 0.8;
  g.fillStyle = 'rgba(8,6,4,0.78)'; g.beginPath(); g.roundRect(-tw / 2, -fs * 0.85, tw, fs * 1.4, 10); g.fill();
  g.strokeStyle = col; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.textAlign = 'center'; g.fillText(text, 0, fs * 0.38);
  g.restore(); qaRect(g, p.x - tw / 2, p.y - fs * 0.85, tw, fs * 1.4, 'text', text);
}
const WCAMS = [[Math.PI + 0.32, 0.3, 10, [4, 2.0, 2.2]], [-0.26, 0.28, 11, [4, 2.8, 6.2]], [Math.PI - 0.32, 0.3, 10, [4, 2.0, 2.2]]];
function winsSet(g, lt, t, keys, t0, dt, { tags = true } = {}) {
  const i = clamp(Math.floor((t - t0) / dt), 0, OPP.length - 1), k = t - (t0 + i * dt), [opp, rr] = OPP[i];
  if (keys) rig(B, lt, keys, { t }); else { const [yaw, pitch, dist, target] = WCAMS[i], u = clamp(k / dt); B.setCam({ yaw: yaw + u * 0.06, pitch, dist: dist - u * 0.7, fov: 1500, cy: H * 0.5, target }); }
  const E = room(g, B, CLUB, { t, blur: 3 });
  const rise = ease.out(clamp(k / 0.2)), fall = ease.out(clamp((k - 0.5) / 0.3));
  const hb = seated(g, B, 'rausis', { ...EXPR.smug, look: [0, 0.5], curve: 0.4 }, t, { z: 9.4 });
  const hw = seated(g, B, opp, k > 0.55 ? { ...EXPR.worried, sweat: 1 } : EXPR.focus, t, { z: -1.4, face: 1, lift: lerp(0.6, 3.1, rise), alpha: clamp(rise * 3) });
  table(g, B, E); B.drawSlab(g, SLATE);
  B.drawPieces(g, POS.map(p => p.id === 'e1' ? { ...p, rot: fall * 1.5, x: p.x + fall * 0.4, y: fall * 0.05 } : p), { focus: B.dist, dof: 1.2 });
  hb(); hw();
  if (k > 0.55) { const u = clamp((k - 0.55) / 0.5), p = B.project(1.2, 0.8 + u * 1.6, 2.5); g.save(); g.globalAlpha *= 1 - u; g.font = sans(Math.round(p.s * 0.9), 900); g.textAlign = 'center'; g.fillStyle = C.lime; g.fillText('1–0', p.x, p.y); g.restore(); }
  if (tags && i === 1) tag3(g, 4, 5.6, 9.4, '2686', GOLD, clamp(k / 0.2));  // only the face turned to the camera carries its rating
  if (tags && i !== 1) tag3(g, 4, 5.6, -1.4, String(rr), RED, rise);
  lowKey(g, { cy: H * 0.42, a: 0.28 });
}

// ---------- FIDE is watching: the game on a monitor; the camera pulls back to a wall of screens and an analyst ----------
const FEED = makeCanvas(), feedx = FEED.getContext('2d');
const OFFICE = { base: '#06080B', wall: ['#1A2028', '#161B22'], seam: '#10141A', floor: ['#0E1216', '#0B0E12'], light: '#9FC2E8', lightA: 0.1 };
const SCR_CHART = tex(640, 360, (g, w, h) => {
  g.fillStyle = '#071722'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(159,216,255,0.15)'; g.lineWidth = 2;
  for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * h / 5); g.lineTo(w, i * h / 5); g.stroke(); }
  g.strokeStyle = C.lime; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = 30 + i / 40 * (w - 60), y = h - 50 - (h - 110) * ((i / 40) ** 1.5) + Math.sin(i * 1.7) * 6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.fillStyle = '#9FD8FF'; g.font = sans(28, 900); g.fillText('RATING  2013–2019', 24, 40);
});
const SCR_BELL = tex(640, 360, (g, w, h) => {  // a normal curve of results and one dot far out on the tail
  g.fillStyle = '#071722'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(159,216,255,0.25)'; g.strokeStyle = '#9FD8FF'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, h - 40);
  for (let i = 0; i <= 60; i++) { const x = 30 + i / 60 * (w - 160), z = (i / 60 - 0.45) * 5; g.lineTo(x, h - 40 - Math.exp(-z * z / 2) * (h - 120)); }
  g.lineTo(w - 130, h - 40); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = RED; g.shadowColor = RED; g.shadowBlur = 20; g.beginPath(); g.arc(w - 60, h - 70, 16, 0, 7); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#9FD8FF'; g.font = sans(28, 900); g.fillText('MOVE MATCH', 24, 40);
});
const SCR_LIST = tex(640, 360, (g, w, h) => {
  g.fillStyle = '#071722'; g.fillRect(0, 0, w, h); g.fillStyle = '#9FD8FF'; g.font = sans(28, 900); g.fillText('OPEN TOURNAMENTS', 24, 40);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(159,216,255,0.35)'; g.fillRect(24, 70 + i * 46, 360, 14); g.fillStyle = C.lime; g.font = sans(30, 900); g.fillText('1–0', 470, 86 + i * 46); }
});
const SCR_FACE = tex(640, 360, (g, w, h) => {
  g.fillStyle = '#071722'; g.fillRect(0, 0, w, h);
  const im = PH.rausis.img, s = w / im.width * 1.3; g.filter = 'grayscale(0.6) contrast(1.1) brightness(0.9)';
  g.drawImage(im, (w - im.width * s) / 2 + 40, -im.height * s * 0.18, im.width * s, im.height * s); g.filter = 'none';
  g.fillStyle = 'rgba(7,23,34,0.35)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = RED; g.lineWidth = 5; g.strokeRect(w * 0.36, h * 0.12, w * 0.32, h * 0.6);
});
const MONS = [[-1.6, 7.3, SCR_CHART], [4, 7.3, SCR_FACE], [9.6, 7.3, SCR_BELL], [-1.6, 3.7, SCR_LIST], [4, 3.7, null], [9.6, 3.7, SCR_CHART]];
function monitorRoom(g, lt, t, keys, feed) {
  rig(B, lt, keys, { t });
  room(g, B, OFFICE, { t, blur: 2 });
  const MZ = 12;
  for (const [x, y, img] of MONS) {
    ab(g, [x - 2.65, y - 1.6, MZ], [x + 2.65, y + 1.6, MZ + 0.3], '#14171B', { amb: 0.6 });
    const tl = [x - 2.45, y + 1.4, MZ - 0.02], tr = [x + 2.45, y + 1.4, MZ - 0.02], bl = [x - 2.45, y - 1.4, MZ - 0.02];
    if (img) texQuad(g, img, tl, tr, bl); else texQuad(g, feed, tl, tr, bl, { src: [0, 560, W, 610] });
    pool(g, B, x, y, MZ - 0.1, 4.2, '#9FD8FF', 0.14, true);
  }
  if (Math.floor(t * 2) % 2 === 0) { const p = B.project(1.85, 5.0, MZ - 0.05); if (p.z > 0.5) { g.fillStyle = RED; g.beginPath(); g.arc(p.x, p.y, p.s * 0.12, 0, 7); g.fill(); g.font = sans(Math.round(p.s * 0.3), 900); g.fillText('REC', p.x + p.s * 0.2, p.y + p.s * 0.1); } }
  ab(g, [-4.5, -0.9, 7.5], [12.5, -0.45, 10], '#2A2420', { amb: 0.5 });  // the desk
  ab(g, [2.6, -0.45, 8.2], [5.4, -0.32, 9.0], '#1A1C20', { amb: 0.6 });  // a keyboard
  const hs = seated(g, B, 'arbiter', 'focus', t, { x: 0.5, z: 6.2, face: 1, hands: false });
  hs();
  lowKey(g, { cy: H * 0.42, a: 0.26 });
}

// ---------- the photo goes round the world: newspapers spin down onto a dotted world map ----------
const MAPW = 2400, MAPH = 1200;
const WORLD = tex(MAPW, MAPH, (g, w, h) => {
  g.fillStyle = '#0A141E'; g.fillRect(0, 0, w, h); g.fillStyle = '#41698A';
  for (let lat = 84; lat > -58; lat -= 1.1) for (let lon = -180; lon < 180; lon += 1.1) if (MAP.at(lon, lat)) { g.beginPath(); g.arc((lon + 180) / 360 * w, (90 - lat) / 180 * h, 3.4, 0, 7); g.fill(); }
});
const MS = 0.2, mapXZ = (lon, lat) => [lon * MS, lat * MS - 8], mapPt = (lon, lat) => [lon * MS, 0, lat * MS - 8];  // the map lies on y = 0: 1 degree = 0.2 units
function worldPlane(g) {
  const [x0, z0] = mapXZ(-180, 90), [x1, z1] = mapXZ(180, -90);
  texQuad(g, WORLD, [x0, 0, z0], [x1, 0, z0], [x0, 0, z1]);
}
let PAPERS = [];  // newspaper textures, made in build() once the frozen photo exists
function newspaper(photo, masthead, headline, seed) {
  return tex(600, 800, (g, w, h) => {
    g.fillStyle = '#EDE8DC'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1A1612'; g.font = serif(70, 700); g.textAlign = 'center'; g.fillText(masthead, w / 2, 86);
    g.fillRect(30, 104, w - 60, 4); g.fillRect(30, 114, w - 60, 2);
    g.font = sans(46, 900); const words = headline.split(' '); let line = '', y = 180;
    for (const wd of words) { if (g.measureText(line + wd).width > w - 70) { g.fillText(line.trim(), w / 2, y); line = ''; y += 54; } line += wd + ' '; }
    g.fillText(line.trim(), w / 2, y);
    const py = y + 26, ph = 380, pw = ph * W / H; g.drawImage(photo, 0, 160, W, H - 520, w / 2 - pw * 0.9, py, pw * 1.8, ph);
    g.strokeStyle = '#1A1612'; g.lineWidth = 2; g.strokeRect(w / 2 - pw * 0.9, py, pw * 1.8, ph);
    const r = rng(seed); g.fillStyle = 'rgba(26,22,18,0.45)';
    for (let c = 0; c < 3; c++) for (let i = 0; i < 9 && py + ph + 30 + i * 18 < h - 20; i++) g.fillRect(36 + c * 182, py + ph + 30 + i * 18, 160 - r() * 30, 8);
  });
}
const DROPS = [['Strasbourg', 0, 0.3], ['London', 0.3, -0.4], ['Berlin', 0.55, 0.2], ['New York', 0.8, -0.25], ['Madrid', 1.05, 0.35]];
function papersSet(g, lt, t, keys, t0) {
  rig(B, lt, keys, { t });
  g.fillStyle = '#05080C'; g.fillRect(0, 0, W, H);
  worldPlane(g);
  const lit = B.project(...mapPt(10, 48));
  rim(g, lit.x, lit.y, lit.s * 30, '#9FC2E8', 0.08);
  DROPS.forEach(([city, d, rot], i) => {
    const ti = t0 + d; if (t < ti) return;
    const u = clamp((t - ti) / 0.5), e = ease.out(u), [cx, cz] = mapXZ(...CITY[city]);
    const y = lerp(16, 0.05 + i * 0.02, e), spin = rot + (1 - e) * 5.5, s = 2.3;
    const P = (a, b) => { const c = Math.cos(spin), sn = Math.sin(spin); return [cx + a * c - b * sn, y, cz + a * sn + b * c]; };
    if (u >= 1) { const sp = B.project(cx, 0, cz - 0.3); g.save(); g.globalAlpha = 0.4; g.fillStyle = '#000'; g.beginPath(); g.ellipse(sp.x, sp.y, sp.s * 2.2, sp.s * 1.2, 0, 0, 7); g.fill(); g.restore(); }
    texQuad(g, PAPERS[i % PAPERS.length], P(-s, s * 1.33), P(s, s * 1.33), P(-s, -s * 1.33));
  });
  lowKey(g, { cy: H * 0.45, a: 0.4 });
}

// ---------- "it was an iPhone 4": the phone on a turntable in a dark studio ----------
const IPH_F = tex(360, 700, (g, w, h) => {
  g.fillStyle = '#0B0C0E'; g.beginPath(); g.roundRect(0, 0, w, h, 44); g.fill();
  g.drawImage(APP, 30, 120, w - 60, (w - 60) * APP.height / APP.width);
  g.fillStyle = '#26282C'; g.beginPath(); g.roundRect(w / 2 - 34, 58, 68, 10, 5); g.fill();
  g.fillStyle = '#1A1C20'; g.beginPath(); g.arc(w / 2, 34, 6, 0, 7); g.fill();
  g.strokeStyle = '#3A3C42'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h - 52, 30, 0, 7); g.stroke(); g.beginPath(); g.roundRect(w / 2 - 10, h - 62, 20, 20, 4); g.stroke();
  const gl = g.createLinearGradient(0, 0, w, h); gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.roundRect(0, 0, w, h, 44); g.fill();
});
const IPH_B = tex(360, 700, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1C1E22'); gr.addColorStop(1, '#0C0D10'); g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, h, 44); g.fill();
  g.fillStyle = '#05060A'; g.beginPath(); g.arc(46, 46, 18, 0, 7); g.fill(); g.strokeStyle = '#4A4C52'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#C9C4B0'; g.beginPath(); g.arc(90, 46, 7, 0, 7); g.fill();
  const gl = g.createLinearGradient(0, 0, w, h); gl.addColorStop(0, 'rgba(255,255,255,0.12)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.roundRect(0, 0, w, h, 44); g.fill();
});
function iphoneSet(g, lt, t, keys, ang) {
  rig(B, lt, keys, { t });
  const bg = g.createRadialGradient(W / 2, H * 0.4, 50, W / 2, H * 0.4, H * 0.8); bg.addColorStop(0, '#16202A'); bg.addColorStop(1, '#030405'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  tiled(g, [-30, FLOOR_Y, -20], [60, 0, 0], [0, 0, 50], { color: '#080B0E', grout: 'rgba(159,216,255,0.06)', tu: 3, light: g2 => pool(g2, B, 4, FLOOR_Y, 4, 9, '#9FD8FF', 0.16) });
  spotCone(g, B, { top: [4, 16, 4], base: [4, FLOOR_Y, 4], r0: 0.6, r1: 5, color: '#DCEBFF', a: 0.16, dust: 30, t });
  lathe(g, 4, 4, [[FLOOR_Y, 2.6, 2.6], [-2.1, 2.6, 2.6], [-1.9, 2.4, 2.4]], '#1E2328', { amb: 0.5, spec: 0.4 });
  const c = [4, 0.35 + Math.sin(t * 1.3) * 0.08, 4], h = [1.02, 2.0, 0.1], R = { ry: ang, rz: 0.04 };
  obox(g, c, h, '#A9AEB4', R, { spec: 0.9, amb: 0.5 });  // the steel band
  const F = (x, y, z) => { const p = rot3([x, y, z], R); return [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; };
  const fr = [F(-1.0, 1.98, -0.105), F(1.0, 1.98, -0.105), F(-1.0, -1.98, -0.105)], bk = [F(1.0, 1.98, 0.105), F(-1.0, 1.98, 0.105), F(1.0, -1.98, 0.105)];
  const vis = q => vdot(vcross(vsub(q[1], q[0]), vsub(q[2], q[0])), vsub(B.E, q[0])) > 0;
  if (vis(fr)) { texQuad(g, IPH_F, ...fr, { under: false }); const p = B.project(...c); rim(g, p.x, p.y, p.s * 2.2, PHONE, 0.18); }
  else if (vis(bk)) texQuad(g, IPH_B, ...bk, { under: false });
  lowKey(g, { cy: H * 0.42, a: 0.35 });
}

// ---------- the arbiters' office: his statement signed on the desk, the name plate, the gavel, the wall calendar ----------
const OFF = { base: '#0A0806', wall: ['#3A3026', '#332A21'], seam: '#221A12', rail: '#5A4630', floor: ['#241B14', '#1E1610'], light: '#FFD9A0', lightA: 0.28, frames: true, sconces: true, table: ['#4A3220', '#2A1A0E', '#22160C'] };
const PAPER0 = tex(420, 594, (g, w, h) => {
  g.fillStyle = '#F2EEE2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1E1A14'; g.font = sans(34, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('STATEMENT', w / 2, 62); g.fillRect(40, 80, w - 80, 3);
  g.fillStyle = 'rgba(30,26,20,0.35)'; for (let i = 0; i < 11; i++) g.fillRect(40, 112 + i * 30, w - 80 - (i % 3) * 50, 9);
  g.fillStyle = 'rgba(30,26,20,0.55)'; g.fillRect(40, 500, 200, 2); g.font = sans(14, 800); g.letterSpacing = '3px'; g.textAlign = 'left'; g.fillText('SIGNATURE', 40, 522);
});
const PAPER = makeCanvas(420, 594), paperx = PAPER.getContext('2d');
const sigPt = k => [52 + k * 200, 488 - 18 * Math.sin(k * 26) * (0.6 + 0.4 * Math.sin(k * 7)) - k * 8];
function paperAt(u) {  // the statement with the signature written up to u
  paperx.drawImage(PAPER0, 0, 0);
  if (u > 0) { paperx.strokeStyle = '#1F3A7A'; paperx.lineWidth = 4; paperx.lineCap = 'round'; paperx.lineJoin = 'round'; paperx.beginPath();
    for (let i = 0, n = Math.floor(120 * u); i <= n; i++) { const [x, y] = sigPt(i / 120); i ? paperx.lineTo(x, y) : paperx.moveTo(x, y); } paperx.stroke(); }
  return PAPER;
}
// the paper lies on the table, top toward him; a texture point (px, py) -> world
const PAP = { x0: 2.2, x1: 5.8, z0: 8.2, z1: 3.1, y: -0.33 };
const papW = (px, py) => [lerp(PAP.x0, PAP.x1, px / 420), PAP.y, lerp(PAP.z0, PAP.z1, py / 594)];
// a pen whose tip is at a world point, held by a hand near its top
function pen(g, tip, { hand: withHand = true } = {}) {
  const top = [tip[0] + 0.7, tip[1] + 2.2, tip[2] + 0.9];
  cylinder(g, tip, top, 0.09, '#23262C', { spec: 0.6, n: 12 });
  if (withHand) { const h = B.project(lerp(tip[0], top[0], 0.4), lerp(tip[1], top[1], 0.4), lerp(tip[2], top[2], 0.4)); if (h.z > 0.5) hand(g, h.x, h.y, 0.3 * h.s); }
}
function officeSet(g, lt, t, keys, { e = 'sad', sign = 0, plate = null, gavel = null, who = 'rausis', head = null, env = OFF } = {}) {
  rig(B, lt, keys, { t });
  const E = room(g, B, env, { t, blur: 3 });
  bokeh(g, t, { n: 6, seed: 7, y0: 0.06, y1: 0.36, a: 0.14, size: [50, 110], colors: ['#FFD9A0', '#FFC27A'] });
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 3.6, E.light, 0.2);
  let hands = () => {};
  if (head) head(g); else if (who) hands = seated(g, B, who, e, t, { z: 9.4, hands: false });
  table(g, B, E);
  pool(g, B, 4, -0.3, 4, 6, '#FFE2B0', 0.2);
  if (sign !== null && sign >= 0) {
    texQuad(g, paperAt(sign), papW(0, 0), papW(420, 0), papW(0, 594));
    if (sign > 0 && sign < 1) pen(g, papW(...sigPt(sign)));
  }
  if (plate) plate(g);
  if (gavel) gavel(g);
  hands();
  lowKey(g, { cy: H * 0.42, a: 0.28 });
}
// the brass name plate: a wedge; its "GM" piece can break off (fall: 0..1+, seconds since the break)
const PLATE_GM = tex(180, 120, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#E8CA8A'); gr.addColorStop(1, '#B8954E'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2A1C10'; g.font = sans(64, 900); g.textAlign = 'center'; g.fillText('GM', w / 2, 84); });
const PLATE_NAME = tex(620, 120, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#E8CA8A'); gr.addColorStop(1, '#B8954E'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2A1C10'; g.font = sans(60, 900); g.letterSpacing = '3px'; g.textAlign = 'center'; g.fillText('IGORS RAUSIS', w / 2, 82); });
function wedge(g, x0, x1, y0, z0, { h = 1.0, d = 0.8, r = {}, pivot = null, img = null } = {}) {
  const pv = pivot || [(x0 + x1) / 2, y0, z0 + d / 2];
  const P = (x, y, z) => { const p = rot3([x - pv[0], y - pv[1], z - pv[2]], r); return [pv[0] + p[0], pv[1] + p[1], pv[2] + p[2]]; };
  const v = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z0 + d), P(x0, y0, z0 + d), P(x0, y0 + h, z0 + d * 0.72), P(x1, y0 + h, z0 + d * 0.72)];
  solid(g, v, [[0, 1, 2, 3], [0, 1, 5, 4], [3, 2, 5, 4], [0, 3, 4], [1, 2, 5]], '#6A4A2A', { amb: 0.5, cols: ['#3A2414', '#B8954E', '#4A3020', '#5A3E22', '#5A3E22'] });
  if (img && vdot(vcross(vsub(v[1], v[0]), vsub(v[4], v[0])), vsub(B.E, v[0])) < 0) {
    const k = 0.08, tl = v[4].map((a, i) => lerp(a, v[0][i], k)), tr = v[5].map((a, i) => lerp(a, v[1][i], k)), bl = v[0].map((a, i) => lerp(a, v[4][i], k));
    texQuad(g, img, tl, tr, bl);
  }
}
function namePlate(g, t, tBreak) {
  const y0 = -0.35, z0 = 0.2, xa = 1.0, xc = 2.6, xb = 7.2;
  wedge(g, xc, xb, y0, z0, { img: PLATE_NAME });
  const d = t - tBreak;
  if (d < 0) { wedge(g, xa, xc - 0.02, y0, z0, { img: PLATE_GM }); return; }
  // the GM piece slides over the front edge of the table (z = -1.1), tips forward and falls to the floor
  const slide = Math.min(1, d / 0.3) ** 2 * 1.7, tf = Math.max(0, d - 0.3), H0 = y0 - FLOOR_Y, drop = Math.min(H0, 15 * tf * tf), landed = drop >= H0 - 0.001;
  const py = y0 - drop, rx = landed ? -1.4 : -Math.min(1.4, tf * 5);
  wedge(g, xa, xc - 0.02, py, z0 - slide, { img: PLATE_GM, r: { rx, rz: landed ? 0.2 : tf * 0.5 }, pivot: [(xa + xc) / 2, py, z0 - slide] });
}
function gavelAt(g, t, tHit) {  // a judge's gavel on its block, lifted and brought down on tHit
  const bx = 7.7, bz = 3.0, by = -0.35;
  lathe(g, bx, bz, [[by, 0.95, 0.95], [by + 0.3, 0.95, 0.95], [by + 0.34, 0.85, 0.85]], '#3A2414', { amb: 0.5, spec: 0.3 });
  const up = t < tHit - 0.1 ? ease.out(clamp((t - tHit + 0.6) / 0.35)) : t < tHit ? 1 - ease.in((t - tHit + 0.1) / 0.1) : 0;
  const ang = lerp(0.05, 1.0, up) + (t >= tHit && t < tHit + 0.15 ? Math.sin((t - tHit) / 0.15 * Math.PI) * 0.1 : 0);
  const pv = [bx + 2.6, by + 0.95, bz];  // the end of the handle, in the hand
  const R = p => { const q = rot3([p[0] - pv[0], p[1] - pv[1], p[2] - pv[2]], { rz: -ang }); return [pv[0] + q[0], pv[1] + q[1], pv[2] + q[2]]; };
  cylinder(g, R([bx + 0.05, by + 0.95, bz]), R([pv[0], pv[1], pv[2]]), 0.13, '#5A3A20', { n: 12, amb: 0.5 });
  cylinder(g, R([bx, by + 0.55, bz - 0.0]), R([bx, by + 1.45, bz]), 0.36, '#4A2E18', { n: 18, amb: 0.5, spec: 0.3 });
  const hp = B.project(...R([pv[0] - 0.3, pv[1], pv[2]])); if (hp.z > 0.5) hand(g, hp.x, hp.y, 0.34 * hp.s);
}
// a wall calendar: pages tear off from July 2019 to October 2020
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const CAL = Array.from({ length: 16 }, (_, i) => { const m = (6 + i) % 12, y = 2019 + Math.floor((6 + i) / 12); return tex(300, 360, (g, w, h) => {
  g.fillStyle = '#ECE3CC'; g.fillRect(0, 0, w, h); g.fillStyle = RED; g.fillRect(0, 0, w, 84);
  g.fillStyle = '#FFFFFF'; g.font = sans(40, 900); g.textAlign = 'center'; g.letterSpacing = '6px'; g.fillText(String(y), w / 2, 58);
  g.fillStyle = '#2A2016'; g.font = sans(96, 900); g.letterSpacing = '2px'; g.fillText(MONTHS[m], w / 2, 220);
  g.fillStyle = 'rgba(42,32,22,0.3)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) g.fillRect(24 + c * 38, 256 + r * 24, 26, 12);
}); });
function calendarSet(g, lt, t, keys, t0, rate) {
  rig(B, lt, keys, { t });
  room(g, B, OFF, { t, blur: 2 });
  const cx = 4, cy = 5.2, z = 12.9, w = 3.0, h = 3.6, n = clamp(Math.floor((t - t0) / rate), 0, 15);
  const C0 = [cx - w / 2, cy + h / 2, z], C1 = [cx + w / 2, cy + h / 2, z], C2 = [cx - w / 2, cy - h / 2, z];
  texQuad(g, CAL[Math.min(15, n + 1)], C0, C1, C2);
  if (n < 15 && t >= t0) {  // the page on top lifts round its top edge and flies at the camera
    const u = ((t - t0) / rate) % 1, a = ease.in(u) * 2.6, fz = -ease.in(u) * 5;
    const P = (x, yy) => [x, cy + h / 2 - Math.cos(a) * (cy + h / 2 - yy), z - Math.sin(a) * (cy + h / 2 - yy) + fz];
    texQuad(g, CAL[n], P(cx - w / 2, cy + h / 2), P(cx + w / 2, cy + h / 2), P(cx - w / 2, cy - h / 2), { a: 1 - u * 0.3 });
  } else texQuad(g, CAL[15], C0, C1, C2);
  ab(g, [cx - w / 2 - 0.1, cy + h / 2, z - 0.1], [cx + w / 2 + 0.1, cy + h / 2 + 0.25, z], '#2A2016', { amb: 0.6 });
  lowKey(g, { cy: H * 0.4, a: 0.3 });
}

// ---------- Latvia: the Baltic as dots in 3D, a pin rising at Valka ----------
const LVX = (lon, lat) => [(lon - 25) * 1.09, (lat - 57.2) * 2];
const BALTIC = (() => { const out = []; for (let lat = 61; lat >= 52.5; lat -= 0.22) for (let lon = 13; lon <= 35; lon += 0.4) { const id = MAP.at(lon, lat); if (id) out.push([...LVX(lon, lat), id === 428]); } return out; })();
function balticSet(g, lt, t, keys, tPin) {
  rig(B, lt, keys, { t });
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0E1824'); bg.addColorStop(1, '#05080C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (const lv of [false, true]) {
    g.fillStyle = lv ? GOLD : '#34506A'; g.beginPath();
    for (const [x, z, isLv] of BALTIC) { if (isLv !== lv || depth(x, 0, z) < 0.5) continue; const p = B.project(x, 0, z), r = p.s * 0.16; g.moveTo(p.x + r, p.y); g.ellipse(p.x, p.y, r, r * 0.6, 0, 0, 7); }
    if (lv) { g.save(); g.shadowColor = GOLD; g.shadowBlur = 16; g.fill(); g.restore(); } else g.fill();
  }
  const [vx, vz] = LVX(...CITY['Valka']), u = ease.out(clamp((t - tPin) / 0.4));
  if (u > 0) {
    const a = B.project(vx, 0, vz), b = B.project(vx, 3.2 * u, vz);
    g.save(); g.strokeStyle = '#BFE0F4'; g.lineWidth = Math.max(3, a.s * 0.08); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.fillStyle = '#BFE0F4'; g.shadowColor = '#BFE0F4'; g.shadowBlur = 24; g.beginPath(); g.arc(b.x, b.y, b.s * 0.32, 0, 7); g.fill(); g.restore();
    const pr = (((t - tPin) / 0.9) % 1); g.save(); g.strokeStyle = '#BFE0F4'; g.globalAlpha = (1 - pr) * u; g.lineWidth = 3; g.beginPath(); g.ellipse(a.x, a.y, a.s * (0.4 + pr * 2.4), a.s * (0.4 + pr * 2.4) * 0.5, 0, 0, 7); g.stroke(); g.restore();
    if (u > 0.6) { g.save(); g.globalAlpha = clamp((u - 0.6) * 3); g.font = mono(30, 800); g.letterSpacing = '4px'; g.textAlign = 'center'; g.fillStyle = '#EAF2F4'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.fillText('VALKA', b.x, b.y - b.s * 0.6); g.restore(); qaRect(g, b.x - 70, b.y - b.s * 0.6 - 30, 140, 40, 'text', 'VALKA'); }
  }
  lowKey(g, { cy: H * 0.45, a: 0.35 });
}
// the sign-up sheet on the club's desk: a new name is written in
const SHEET0 = tex(420, 594, (g, w, h) => {
  g.fillStyle = '#F2EEE2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1E1A14'; g.font = sans(30, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('PLAYERS', w / 2, 56); g.fillRect(40, 72, w - 80, 3);
  const r = rng(4); g.letterSpacing = '0px';
  for (let i = 0; i < 9; i++) { const y = 112 + i * 44; g.fillStyle = 'rgba(30,26,20,0.6)'; g.font = sans(18, 800); g.textAlign = 'left'; g.fillText(`${i + 1}.`, 36, y + 6);
    g.strokeStyle = 'rgba(30,26,20,0.55)'; g.lineWidth = 3; g.beginPath(); const len = 160 + r() * 150; for (let k = 0; k <= 24; k++) { const x = 70 + k / 24 * len, yy = y + Math.sin(k * 1.7 + i) * 5; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  g.fillStyle = 'rgba(30,26,20,0.6)'; g.font = sans(18, 800); g.fillText('10.', 36, 112 + 9 * 44 + 6);
});
const SHEET = makeCanvas(420, 594), sheetx = SHEET.getContext('2d');
function sheetAt(u) {
  sheetx.drawImage(SHEET0, 0, 0);
  if (u > 0) { const y = 112 + 9 * 44; sheetx.save(); sheetx.font = 'italic 800 36px Rubik'; sheetx.fillStyle = '#1F3A7A'; const tw = sheetx.measureText('Isa Kasimi').width;
    sheetx.beginPath(); sheetx.rect(70, y - 40, tw * u + 4, 60); sheetx.clip(); sheetx.fillText('Isa Kasimi', 72, y + 10); sheetx.restore();
    if (u >= 1) { sheetx.fillStyle = rgba(GOLD, 0.35); sheetx.fillRect(64, y - 30, tw + 18, 48); } }
  return SHEET;
}
// the badge on a lanyard: IGORS RAUSIS on one side, ISA KASIMI on the other, the same face on both
function badgeTex(name, yr, col) {
  return tex(400, 560, (g, w, h) => {
    g.fillStyle = '#ECE6D8'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(0, 0, w, 86, [26, 26, 0, 0]); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = sans(34, 900); g.letterSpacing = '8px'; g.textAlign = 'center'; g.fillText(yr, w / 2, 58);
    g.save(); g.beginPath(); g.roundRect(60, 112, w - 120, 300, 14); g.fillStyle = '#C9D3D6'; g.fill(); g.clip();
    drawChar(g, 'rausis', { x: w / 2, y: 248, s: 0.62, e: EXPR.neutral, t: 0 }); g.restore();
    g.fillStyle = '#1E1A14'; g.font = sans(38, 900); g.letterSpacing = '3px'; g.fillText(name, w / 2, 470);
    g.fillStyle = '#5A6266'; g.font = sans(20, 800); g.letterSpacing = '6px'; g.fillText('PLAYER', w / 2, 512);
    g.fillStyle = '#2A2016'; g.beginPath(); g.roundRect(w / 2 - 40, 14, 80, 14, 7); g.fill();
  });
}
const BADGE_A = badgeTex('IGORS RAUSIS', '2019', '#3A5A8A'), BADGE_B = badgeTex('ISA KASIMI', '2020', TEAL);
function badgeSet(g, lt, t, keys, tFlip, tRing) {
  rig(B, lt, keys, { t });
  room(g, B, CLUB, { t, blur: 7 });
  bokeh(g, t, { n: 9, seed: 21, y0: 0.05, y1: 0.6, a: 0.18, size: [60, 140], colors: ['#FFD9A0', '#FFC27A'] });
  const u = ease.inOut(clamp((t - tFlip) / 0.5)), ph = u * Math.PI + Math.sin(t * 1.4) * 0.12 * (1 - u) + Math.sin(t * 1.1) * 0.08 * u;
  const c = [4, 3.4 + Math.sin(t * 1.7) * 0.05, 4], hw = 1.25, hh = 1.75, ux = Math.cos(ph) * hw, uz = -Math.sin(ph) * hw;
  const top = B.project(c[0], c[1] + hh + 6, c[2]), clip = B.project(c[0], c[1] + hh, c[2]);
  g.save(); g.strokeStyle = '#2A4A7A'; g.lineWidth = Math.max(6, clip.s * 0.14); g.beginPath(); g.moveTo(top.x - clip.s * 0.6, top.y); g.lineTo(clip.x, clip.y); g.lineTo(top.x + clip.s * 0.6, top.y); g.stroke(); g.restore();
  if (Math.cos(ph) >= 0) texQuad(g, BADGE_A, [c[0] - ux, c[1] + hh, c[2] - uz], [c[0] + ux, c[1] + hh, c[2] + uz], [c[0] - ux, c[1] - hh, c[2] - uz], { under: false });
  else texQuad(g, BADGE_B, [c[0] + ux, c[1] + hh, c[2] + uz], [c[0] - ux, c[1] + hh, c[2] - uz], [c[0] + ux, c[1] - hh, c[2] + uz], { under: false });
  if (t >= tRing) { const fp = B.project(c[0], c[1] + hh - 1.32, c[2]), k = ease.back(clamp((t - tRing) / 0.3)); g.save(); g.strokeStyle = GOLD; g.lineWidth = 8; g.shadowColor = GOLD; g.shadowBlur = 20; g.beginPath(); g.arc(fp.x, fp.y, fp.s * 0.95 * k, 0, 7); g.stroke(); g.restore(); }
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}
// the club in Latvia: players at small tables look up from their boards at him, one after another
CAST.club1 = { face: [0.97, 1.05, 0.88], hair: 'receding', hairC: '#C9C4BA', brow: '#8A847A', suit: '#5A4A3A', suitD: '#42362A', shirt: 'tie', tie: '#3A4A2A', glasses: true, ears: 1.04, age: 0.6 };
CAST.club2 = { face: [0.95, 1.04, 0.88], hair: 'longcurly', hairC: '#6A4A2E', brow: '#4A3420', suit: '#2F5D6A', suitD: '#21444E', shirt: 'tee', ears: 0.9, female: true };
const CLUBT = [[4, 1.2, ['club1', 'opp3']], [4, 6.0, ['opp1', 'club2']], [4, 10.6, ['gmA', 'opp2']]];
const BOARDTEX = tex(256, 256, g => { for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { g.fillStyle = (f + r) % 2 ? '#E2C89A' : '#8A5A34'; g.fillRect(f * 32, r * 32, 32, 32); } });
function clubRoom(g, lt, t, keys, tTurn) {
  rig(B, lt, keys, { t });
  room(g, B, CLUB, { t, blur: 2 });
  const items = [];
  CLUBT.forEach(([x, z, who], j) => {
    items.push({ d: depth(x, 0, z) - 0.5, f: () => {
      ab(g, [x - 2.0, -0.75, z - 1.3], [x + 2.0, -0.35, z + 1.3], '#4A3220', { amb: 0.5 });
      ab(g, [x - 0.2, FLOOR_Y, z - 0.2], [x + 0.2, -0.75, z + 0.2], '#2A1A0E', { amb: 0.5 });
      texQuad(g, BOARDTEX, [x - 0.9, -0.34, z + 0.9], [x + 0.9, -0.34, z + 0.9], [x - 0.9, -0.34, z - 0.9]);
    } });
    who.forEach((w, s) => {
      const sd = s ? 1 : -1, d = j * 0.16 + s * 0.08, u = ease.out(seg(t, tTurn + d, tTurn + d + 0.22));
      const e = u > 0.5 ? { ...EXPR.shock, sweat: 0, turn: lerp(-sd * 0.7, 0, u) } : { ...EXPR.focus, look: [-sd * 0.6, 0.8], turn: -sd * 0.7 };
      items.push({ d: depth(x + sd * 2.4, 2.4, z), f: () => { actor(g, B, w, { x: x + sd * 2.4, y: 2.3, z, k: 0.82, e, t: t + j, face: -1, follow: 0.3 }); mark(g, '!', x + sd * 2.4 + 0.5, 4.1, z, u, t, { color: GOLD }); } });
    });
  });
  items.sort((a, b) => b.d - a.d).forEach(it => it.f());
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// a real photograph in 2.5D under a dark band carrying its title
const DROP = 330, lin = x => x;
function photoShot(g, lt, ph, { from, to, dur, dim = 0, drop = DROP }) {
  g.fillStyle = '#0B0E11'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, drop); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, drop - 20, 0, drop + 250); gr.addColorStop(0, '#0B0E11'); gr.addColorStop(1, 'rgba(11,14,17,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, drop + 250);
  if (dim > 0) { g.fillStyle = `rgba(0,0,0,${dim.toFixed(3)})`; g.fillRect(0, 0, W, H); }
}
function credit(g, a = 0.75, y = 314) { g.save(); g.globalAlpha *= a; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(CREDIT, W / 2, y); g.restore(); }
const WCCAM = (pitch, dist, yaw = -0.2, ty = -0.2, tz = 6.4, tx = 4) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [tx, ty, tz] });
// a camera flash freezes the frame into a print for a moment (the photo), then the scene runs on
const SNAP = makeCanvas(), snx = SNAP.getContext('2d');
function snapshot(g, lt, t, scene, tf, { hold = 0.75, s1 = 0.76, cy = H * 0.53 } = {}) {
  if (t < tf || t > tf + hold) { scene(g, lt, t); return; }
  snx.setTransform(1, 0, 0, 1, 0, 0); scene(snx, tf - (t - lt), tf);
  g.drawImage(SNAP, 0, 0); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, H);
  const u = ease.out(clamp((t - tf) / 0.25)), s = lerp(1, s1, u);
  g.save(); g.translate(W / 2, lerp(H / 2, cy, u)); g.rotate(lerp(0, -0.035, u)); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 60; g.shadowOffsetY = 24; g.fillStyle = '#F4F1EA'; g.fillRect(-W / 2 - 34, -H / 2 - 34, W + 68, H + 150); g.shadowColor = 'transparent';
  g.drawImage(SNAP, -W / 2, -H / 2); g.restore();
  const fl = 1 - clamp((t - tf) / 0.3); if (fl > 0) { g.fillStyle = `rgba(255,255,255,${(0.95 * fl).toFixed(3)})`; g.fillRect(0, 0, W, H); }
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });

  // ======================= HOOK (rule 42): the photo itself, from the first frame, in the 3D bathroom =======================
  // the camera flies in through his open stall door; on "photo" a flash freezes the frame into a print; after it he looks up
  const photo0 = w('hook', 'photo');
  const hookScene = (g, lt, t) => {
    rig(B, lt, [[0, WCCAM(0.3, 13, 0.08, 0.6, 6.6)], [photo0 - 0.05, WCCAM(0.24, 9.0, -0.04, 0.4, 6.6), ease.out], [3.9, WCCAM(0.2, 6.2, 0.02, 1.0, 6.9)]], { t });
    const e = exprAt([[0, { ...EXPR.focus, look: [0.1, 1], lid: 0.45, brow: 0.3 }], [photo0 + 0.8, { ...EXPR.shock, sweat: 0, look: [0, 0] }]], t);
    bathroom(g, t, { doors: [0, 1, 0], sit: { e, glow: 1 } });
    lowKey(g, { cy: H * 0.46, a: 0.3 });
  };
  shot(0, (g, lt, t) => snapshot(g, lt, t, hookScene, photo0),
    { noJump: true, hud: (g, lt, t) => { heading(g, 'THE MOST EMBARRASSING', 150, 1, { size: 50, spacing: 4 }); heading(g, 'PHOTO IN CHESS', 222, 1, { size: 50, spacing: 4 }); } });
  cue(0, 'whoosh_soft', 0.25); cue(photo0, 'camera', 0.55); cue(photo0 + 0.8, 'dun_dun', 0.25);
  // the frozen frame is the photo the newspapers print
  const PRINT = makeCanvas(); hookScene(PRINT.getContext('2d'), photo0, photo0);
  PAPERS = [['NOUVELLES', 'SCANDALE AUX TOILETTES'], ['NEWS', 'GRANDMASTER CAUGHT ON THE TOILET'], ['NACHRICHTEN', 'SKANDAL AUF DER TOILETTE'], ['NEWS', 'CHESS CHEAT IN THE BATHROOM'], ['NOTICIAS', 'ESCÁNDALO EN EL BAÑO']]
    .map(([m, hl], i) => newspaper(PRINT, m, hl, i + 1));

  // ======================= THE MAN ON THAT TOILET: Igors Rausis, 58 (the real photo) =======================
  const manS = s('man'), igT = w('man', 'Igors'), andT = w('man', 'And'), t100 = w('man', '100'), plT = w('man', 'players');
  shot(manS - 0.06, (g, lt, t) => photoShot(g, lt, PH.rausis, { from: { x: 0.55, y: 0.45, zoom: 1.0, dolly: 0 }, to: { x: 0.56, y: 0.47, zoom: 1.08, dolly: 0.05 }, dur: 3.4, drop: 440 }),
    { noJump: true, hud: (g, lt, t) => { nameTitle(g, lt, 'Igors Rausis', 'GRANDMASTER · AGE 58', { y: 200, size: 66, t0: igT - (t - lt) }); credit(g, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(manS, 'whoosh_soft', 0.18);
  // ======================= ONE OF THE TOP 100: a wall of a hundred frames; number 50 turns round =======================
  shot(andT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.38, -0.04, 11.5, [PCX(9) - 3.2, PRY(0) - 1, PZ])], [0.22, K(0.36, -0.04, 11.2, [PCX(9) - 3.0, PRY(0) - 1.4, PZ])], [t100 - (andT - 0.06) - 0.02, K(0.16, 0.0, 10, [PCX(9) - 0.4, PRY(4), PZ]), ease.inOut], [len(sh), K(0.1, 0.02, 8.4, [PCX(9) - 0.2, PRY(4) - 0.2, PZ])]], { t });
    topWall(g, t, t100 + 0.02);
  }, { noJump: true, hud: (g, lt, t) => { heading(g, 'WORLD TOP 100', 200, seg(lt, 0, 0.15)); if (t >= plT) badge(g, 'THE OLDEST', W / 2, 320, { color: GOLD, size: 54, ...pop(t, plT) }); } });
  cue(andT, 'whoosh_deep', 0.35); boom(t100 + 0.25, 0.6);

  // ======================= HIS RATING KEPT CLIMBING: his pillar rises with him on top =======================
  const clS = s('climb'), nobT = w('climb', 'nobody');
  const myR = t => lerp(2500, 2686, ease.inOut(seg(t, clS + 0.05, nobT - 0.25, x => x)));
  const headY = t => FLOOR_Y + pilH(myR(t)) + 0.25 + 7.1;
  shot(clS - 0.06, (g, lt, t, sh) => {
    const t0 = t - lt, keys = [0, 0.4, 0.8, 1.2, 1.6, 2.0].map(k => [k, K(-0.55 + k * 0.14, 0.12, 15, [4, headY(t0 + k) - 2.2, 4])]);
    rig(B, lt, keys, { t, e: x => x });
    climbSet(g, t, myR(t), { e: { ...EXPR.smug, curve: 0.5 } });
  }, { noJump: true, hud: (g, lt, t) => heading(g, 'HIS RATING', 200, seg(lt, 0, 0.15)) });
  cue(clS, 'riser', 0.35);
  // ======================= NOBODY COULD EXPLAIN HOW: two grandmasters at the foot of it, looking up =======================
  shot(nobT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.16, -0.1, 18, [4, 14.8, 3])], [len(sh), K(0.08, -0.08, 16.5, [4, 15.1, 3])]], { t });
    const gm = (who, x, r, sd, d) => ({ d: depth(x, 0, 3.2), f: () => {
      const top = pillar(g, x, 3.2, r), hy = top + 0.25 + 7.1;
      standing(g, who, x, 3.2, { e: { ...EXPR.worried, sweat: 0, look: [sd * 0.3, -1], turn: sd * 0.3 }, t: t + d, y0: top + 0.25 });
      mark(g, '?', x + sd * 0.4, hy + 2.3, 3.2, seg(t, nobT + 0.1 + d, nobT + 0.35 + d), t, { size: 1.5 }); } });
    climbSet(g, t, 2686, { e: { ...EXPR.smug, curve: 0.6 }, extra: [gm('gmA', 0.0, 2600, 1, 0), gm('gmB', 8.0, 2625, -1, 0.15)] });
  }, { noJump: true });
  cue(nobT, 'dun_dun', 0.3);

  // ======================= HIS WINS: WEAKER PLAYERS, ONE AFTER ANOTHER =======================
  const wkS = s('weak'), hundT = w('weak', 'hundreds'), weakT = w('weak', 'weaker.'), fideT = w('weak', 'And'), watchT = w('weak', 'watching.');
  const w0 = wkS + 0.05, wdt = (fideT - wkS - 0.15) / 3;
  const sideKeys = null;
  shot(wkS - 0.06, (g, lt, t) => winsSet(g, lt, t, sideKeys, w0, wdt),
    { noJump: true, hud: (g, lt, t) => { if (t >= weakT) badge(g, '400+ POINTS WEAKER', W / 2, 1150, { color: RED, size: 46, ...pop(t, weakT) }); } });
  for (let i = 0; i < 3; i++) { cue(w0 + i * wdt, 'whoosh_fast', 0.25); cue(w0 + i * wdt + 0.6, 'piece', 0.7); }
  // ======================= AND FIDE STARTED WATCHING: from the screen back to a wall of monitors =======================
  shot(fideT - 0.06, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); winsSet(feedx, t - wkS + 0.06, t, sideKeys, fideT - 0.1, wdt, { tags: false });
    monitorRoom(g, lt, t, [[0, K(0, 0, 5.4, [4, 3.7, 12])], [1.5, K(-0.28, 0.12, 21, [4, 4.6, 10]), ease.inOut]], FEED);
  }, { noJump: true });
  cue(fideT, 'whoosh_deep', 0.35); cue(watchT, 'notify', 0.3);

  // ======================= JULY 2019, STRASBOURG: MID-GAME, HE GOES TO THE BATHROOM =======================
  const stS = s('stras'), inT = w('stras', 'In'), goT = w('stras', 'goes'), bathT = w('stras', 'bathroom.');
  shot(stS - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, HIGH(-0.5, 15, 0.5)], [len(sh), HIGH(-0.35, 13.5, 0.52)]], {}),
    { noJump: true, hud: (g, lt, t) => placeStamp(g, lt, 'Strasbourg', '2019', { y: 200, t0: 0.1 }) });
  shot(inT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'rausis', exprAt([[0, { ...EXPR.focus, brow: 0.25, look: [0, 0.7] }], [0.5, { ...EXPR.neutral, look: [-0.9, 0], turn: -0.3 }], [0.85, { ...EXPR.neutral, look: [0.9, 0], turn: 0.4 }]], lt),
    { keys: [[0, FRONT(-0.15, 6.8, 0.3)], [len(sh), FRONT(-0.05, 6.2, 0.3)]] }), { noJump: true });
  // he comes into the bathroom: the camera waits by the stalls, the door opens, he walks in glancing round
  const fdS = s('found');
  shot(goT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, WCCAM(0.1, 8.4, Math.PI + 0.1, 2.6, -6.2)], [len(sh), WCCAM(0.08, 7.6, Math.PI + 0.04, 2.8, -6.2)]], { t });
    const u = seg(t, goT + 0.05, fdS - 0.05, x => x), z = lerp(RZ0 + 0.6, -3.2, u), x = lerp(4.6, 4.2, u);
    const e = exprAt([[0, { ...EXPR.neutral, look: [-0.8, 0], turn: -0.25 }], [0.55, { ...EXPR.neutral, look: [0.8, 0], turn: 0.3 }], [1.05, { ...EXPR.paranoid, look: [0, 0], sweat: 0 }]], lt);
    bathroom(g, t, { entry: ease.out(seg(t, goT - 0.1, goT + 0.25)), front: g2 => standing(g2, 'rausis', x, z, { e, t, walk: 1, phase: t * 8.5, col: TROUSER }) });
    lowKey(g, { cy: H * 0.45, a: 0.3 });
  }, { noJump: true });
  cue(goT - 0.1, 'door_slam', 0.15); cue(goT + 0.1, 'footsteps', 0.35);

  // ======================= IN THAT TOILET, THEY FIND A PHONE =======================
  const theyT = w('found', 'they'), findT = w('found', 'find'), phT = w('found', 'phone.');
  shot(fdS - 0.06, (g, lt, t, sh) => {
    const t0 = t - lt;
    rig(B, lt, [[0, WCCAM(0.22, 11.5, 0.1, 0.8, 5.5)], [findT - t0, WCCAM(0.3, 8.8, 0.05, -0.4, 6)], [phT - t0, WCCAM(0.72, 3.4, 0.0, -1.3, 6.9), ease.in], [len(sh), WCCAM(0.78, 2.9, 0, -1.35, 6.95)]], { t });
    bathroom(g, t, { doors: [0, ease.out(seg(t, theyT - 0.1, theyT + 0.45)), 0], lidPhone: 0.6 + 0.4 * seg(t, phT - 0.1, phT), flicker: t < phT ? 1 : 0 });
    lowKey(g, { cy: H * 0.5, a: 0.32 });
  }, { noJump: true, hud: (g, lt, t) => { if (t >= phT) badge(g, 'PHONE FOUND', W / 2, 300, { color: RED, size: 56, ...pop(t, phT) }); } });
  cue(fdS, 'heartbeat', 0.3); cue(theyT - 0.05, 'door_slam', 0.12); cue(phT - 0.32, 'revswell', 0.9); cue(phT - 0.004, 'boom', 0.9); cue(phT - BOOM_HIT, 'boom_big', 0.45);

  // ======================= THE PHOTO GOES ROUND THE WORLD; A CHESS PROGRAM; AN iPHONE 4, IN 2019 =======================
  const poS = s('photo'), progT = w('photo', 'chess'), anT = w('photo', 'an'), fourT = w('photo', '4.'), yrT = w('photo', '2019.');
  shot(poS - 0.06, (g, lt, t, sh) => papersSet(g, lt, t, [[0, K(0.0, 1.12, 27, mapPt(-28, 46))], [len(sh), K(0.12, 1.02, 23, mapPt(-24, 45.5))]], poS + 0.15), { noJump: true });
  DROPS.forEach(([, d]) => cue(poS + 0.15 + d + 0.45, 'paper', 0.25));
  shot(progT - 0.12, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.2, 4.6, [4, 1.0, 5.6])], [len(sh), K(-0.02, 0.18, 4.1, [4, 0.95, 5.6])]], { t });
    bathroom(g, t, { doors: [0, 1, 0], sit: { e: { ...EXPR.focus, look: [0, 1], lid: 0.4, brow: 0.35 }, glow: 1.2 } });
    lowKey(g, { cy: H * 0.5, a: 0.35 });
  }, { noJump: true, hud: (g, lt, t) => badge(g, 'A CHESS PROGRAM', W / 2, 240, { color: TEAL, size: 50, ...pop(t, progT) }) });
  shot(anT - 0.06, (g, lt, t, sh) => iphoneSet(g, lt, t, [[0, K(0.32, 0.1, 6.6, [4, 0.4, 4])], [len(sh), K(-0.18, 0.08, 5.4, [4, 0.45, 4])]], (t - anT) * 1.3 - 0.5),
    { noJump: true, hud: (g, lt, t) => {
      if (t >= fourT) badge(g, 'IPHONE 4', W / 2, 250, { color: TEAL, size: 60, sub: 'RELEASED IN 2010', ...pop(t, fourT) });
      if (t >= yrT) badge(g, 'USED IN 2019', W / 2, 1110, { color: GOLD, size: 50, ...pop(t, yrT) });
    } });
  cue(fourT - 0.05, 'record_scratch', 0.35);

  // ======================= HE SIGNS; "I SIMPLY LOST MY MIND" =======================
  const sgS = s('sign'), signsT = w('sign', 'signs:'), qT = w('sign', '"I');
  shot(sgS - 0.06, (g, lt, t, sh) => officeSet(g, lt, t, [[0, K(-0.3, 0.62, 12.5, [4, 0.6, 4.6])], [len(sh), K(-0.12, 0.56, 11, [4, 0.8, 4.8])]],
    { e: { ...EXPR.sad, look: [0, 0.8] }, sign: seg(t, signsT, signsT + 1.1, x => x) }), { noJump: true });
  cue(signsT, 'pen', 0.45);
  shot(qT - 0.06, (g, lt, t, sh) => officeSet(g, lt, t, [[0, FRONT(0.1, 6.6, 0.26)], [len(sh), FRONT(0.04, 6.0, 0.26)]], {
    sign: 1, head: g2 => {
      const hp = B.project(4, 3.1, 9.4), hs = hp.s / 100 * 1.05;
      armsUp(g2, hp.x, hp.y, hs, 1, CAST.rausis.suit);
      seated(g2, B, 'rausis', { ...EXPR.sad, look: [0, 0.8] }, t, { z: 9.4, hands: false });
      handsOnHead(g2, hp.x, hp.y, hs, t, 1);
    } }), { noJump: true, hud: (g, lt, t) => heading(g, '“I SIMPLY LOST MY MIND”', 250, seg(lt, 0.05, 0.25), { size: 40, spacing: 3 }) });

  // ======================= SIX-YEAR BAN; THE GM TITLE GOES =======================
  const bnS = s('ban'), sixT = w('ban', 'Six-year'), titleT = w('ban', 'title,'), goneT = w('ban', 'gone.');
  shot(bnS - 0.06, (g, lt, t, sh) => {
    const t0 = t - lt;
    officeSet(g, lt, t, [[0, K(0.18, 0.2, 9.5, [4, 0.3, 1.4])], [titleT + 0.2 - t0, K(0.1, 0.22, 8.6, [4, 0.2, 1.2])], [titleT + 0.75 - t0, K(0.02, 0.42, 8.2, [2.4, -2.0, -0.6]), ease.inOut], [len(sh), K(0, 0.45, 7.8, [2.2, -2.3, -0.7])]],
      { e: { ...EXPR.sad, look: [0, 0.6] }, sign: null, plate: g2 => namePlate(g2, t, titleT + 0.05), gavel: g2 => gavelAt(g2, t, sixT + 0.02) });
  }, { noJump: true, hud: (g, lt, t) => { if (t >= sixT) stamp(g, 'BANNED', W / 2, 790, t, sixT, { color: RED, size: 96, rot: -0.12, sub: '6 YEARS' }); }, qaAllow: ['face cut by frame'] });
  cue(sixT, 'gavel', 0.55); cue(sixT + 0.05, 'stamp', 0.35); cue(titleT + 0.3, 'whoosh_fast', 0.2); cue(titleT + 0.05 + 0.74, 'thud', 0.45);

  // ======================= A YEAR LATER, IT GETS CRAZIER: the calendar runs to October 2020 =======================
  const teS = s('tease'), yearT = w('tease', 'year'), crT = w('tease', 'crazier.');
  const rate = (crT - 0.1 - yearT) / 15;
  shot(teS - 0.06, (g, lt, t, sh) => { const t0 = t - lt; calendarSet(g, lt, t, [[0, K(0.12, 0.02, 9.5, [4, 5.2, 12.9])], [crT - t0 - 0.1, K(0.04, 0.02, 7.2, [4, 5.2, 12.9])], [crT - t0 + 0.15, K(0, 0.02, 4.8, [4, 5.2, 12.9]), ease.out], [len(sh), K(0, 0.02, 4.5, [4, 5.2, 12.9])]], yearT, rate); },
    { noJump: true });
  for (let i = 0; i < 15; i += 2) cue(yearT + i * rate, 'page_flip', 0.12);
  cue(crT, 'whoosh_deep', 0.3);

  // ======================= LATVIA, 2020: A NEW PLAYER SIGNS UP — ISA KASIMI =======================
  const lvS = s('latvia'), lvT = w('latvia', 'Latvia.'), newT = T.w('latvia', 5).s, isaT = w('latvia', 'Isa'), kaT = w('latvia', 'Kasimi.');
  const [vx, vz] = LVX(...CITY['Valka']);
  shot(lvS - 0.06, (g, lt, t, sh) => balticSet(g, lt, t, [[0, K(0, 1.2, 30, [vx - 1, 0, vz + 2])], [1.2, K(0.3, 0.86, 12, [vx, 0.6, vz]), ease.inOut], [len(sh), K(0.36, 0.84, 11, [vx, 0.6, vz])]], lvT - 0.1),
    { noJump: true, hud: (g, lt, t) => placeStamp(g, lt, 'Latvia', '2020', { y: 200, t0: 0.1 }) });
  cue(lvS, 'whoosh_deep', 0.3); cue(lvT, 'notify', 0.25);
  shot(newT - 0.06, (g, lt, t, sh) => {
    const t0 = t - lt, u = seg(t, isaT, isaT + 0.75, x => x), tw = 166;
    officeSet(g, lt, t, [[0, K(-0.1, 1.0, 8, [4, -0.3, 3.6])], [isaT + 0.8 - t0, K(-0.04, 0.98, 7.4, [4, -0.3, 3.4])], [kaT + 0.55 - t0, K(0.05, 0.22, 9.5, [4, 2.8, 8]), ease.inOut], [len(sh), K(0.08, 0.2, 9, [4, 2.9, 8.2])]],
      { e: exprAt([[0, { ...EXPR.focus, look: [0, 1] }], [kaT + 0.4 - t0, { ...EXPR.smug, curve: 0.5, look: [0, 0] }]], lt), sign: null, env: CLUB,
        plate: g2 => { texQuad(g2, sheetAt(u), papW(0, 0), papW(420, 0), papW(0, 594)); if (u > 0 && u < 1) pen(g2, papW(72 + tw * u, 112 + 9 * 44 + 6)); } });
  }, { noJump: true, qaAllow: ['face cut by frame'] });
  cue(isaT, 'pen', 0.4);

  // ======================= NEW NAME, SAME FACE; HALF THE ROOM RECOGNIZED HIM =======================
  const fcS = s('face'), nameT = w('face', 'name.'), sameT = w('face', 'Same'), faceT = w('face', 'face.'), halfT = w('face', 'Half');
  shot(fcS - 0.06, (g, lt, t, sh) => { const t0 = t - lt; badgeSet(g, lt, t, [[0, K(-0.22, 0.04, 8.0, [4, 3.4, 4])], [sameT - t0, K(0.1, 0.04, 7.2, [4, 3.4, 4])], [faceT - t0 + 0.2, K(0.12, 0.03, 4.9, [4, 3.3, 4]), ease.out], [len(sh), K(0.14, 0.03, 4.7, [4, 3.3, 4])]], nameT - 0.3, faceT); },
    { noJump: true });
  cue(nameT - 0.3, 'whoosh_fast', 0.3); cue(faceT, 'dun_dun', 0.35);
  shot(halfT - 0.06, (g, lt, t, sh) => clubRoom(g, lt, t, [[0, K(0, 0.13, 15.5, [4, 2.4, 5])], [len(sh), K(0.06, 0.12, 13.5, [4, 2.6, 5])]], halfT + 0.05), { noJump: true });
  cue(halfT + 0.1, 'murmur', 0.35); cue(halfT + 0.25, 'gasp', 0.25);

  // ======================= HIS WORDS: "YOU CAN CHANGE YOUR NAME, BUT YOU CANNOT HIDE YOUR FACE" =======================
  const quS = s('quote');
  shot(quS - 0.06, (g, lt, t) => photoShot(g, lt, PH.rausis, { from: { x: 0.55, y: 0.45, zoom: 1.04, dolly: 0 }, to: { x: 0.56, y: 0.47, zoom: 1.14, dolly: 0.05 }, dur: 4.6, dim: 0.25, drop: 440 }),
    { noJump: true, hud: (g, lt, t) => {
      g.save(); g.globalAlpha = seg(lt, 0.15, 0.4); g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
      g.fillText('“You can change your name,', W / 2, 170); g.fillText('but you cannot hide your face.”', W / 2, 232);
      g.font = sans(22, 800); g.letterSpacing = '5px'; g.fillStyle = GOLD; g.fillText('IGORS RAUSIS · 2020', W / 2, 286); g.restore();
      qaRect(g, 100, 125, W - 200, 175, 'text', 'quote'); credit(g, seg(lt, 0.4, 0.6) * 0.75, 330);
    } });

  // ======================= CTA: his stall, locked, the phone's light under the door =======================
  const ctaT = s('cta') - 0.06, howT = w('cta', 'how'), comT = w('cta', 'Comment');
  shot(ctaT, (g, lt, t, sh) => {
    rig(B, lt, [[0, WCCAM(0.14, 14, 0.0, 1.6, 2.5)], [len(sh), WCCAM(0.12, 10.5, 0.0, 1.3, 2.5)]], { t });
    bathroom(g, t, { lockRed: 1, glowUnder: 1 });
    pool(g, B, 4, 1.8, ZF - 0.08, 7, WC.light, 0.16, true);
    lowKey(g, { cy: H * 0.55, a: 0.3 });
  }, { noJump: true, hud: (g, lt, t) => {
    badge(g, 'HOW MANY YEARS WOULD YOU BAN HIM?', W / 2, 230, { color: TEAL, size: 40, a: seg(t, howT, howT + 0.1), ...pop(t, howT) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, comT, comT + 0.1), ...pop(t, comT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, comT + 0.6, comT + 0.7) });
  } });

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'intrigue' }, { t: s('weak') - 0.06, m: 'clockwork' }, { t: s('stras') - 0.06, m: 'tension' }, { t: phT, m: 'slam' },
    { t: anT - 0.06, m: 'hook' }, { t: s('sign') - 0.06, m: 'court' }, { t: s('tease') - 0.06, m: 'void' }, { t: s('latvia') - 0.06, m: 'clockwork' },
    { t: s('quote') - 0.06, m: 'finale' }, { t: ctaT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: phT - 0.32, t1: phT - 0.01, kind: 'mute' }, { t0: phT, t1: poS - 0.1, kind: 'boost', db: 6 },
    { t0: s('sign') - 0.06, t1: s('ban') - 0.1, kind: 'lp', f: 900 },
    { t0: ctaT, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
