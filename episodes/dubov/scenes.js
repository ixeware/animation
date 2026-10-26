// They call him the new Tal: Daniil Dubov. The hook is the knight dance itself (World Blitz, Samarkand 2023, against
// Nepomniachtchi: only knights, every piece back home after twelve moves, a draw in 42 seconds) with the open question
// "why did he play this at a World Championship?", paid off later: a protest against the organizers, zero points for
// both, a zero that cost him a tie with Magnus for first. On the way: why "the new Tal" (Batumi 2019, 21.Rh7+ and the
// king hunt g8–a3), the World Rapid title ahead of Magnus (2018), the checkmate that knocked Magnus out (Airthings 2020),
// Magnus's second in Dubai 2021 against Nepomniachtchi and the "betrayal" at home. The twist at the end: eleven days
// later, online, the knight dance again, and Dubov won that tournament. Sources, and what is drawn rather than
// documented: SOURCES.md.
// Rules 42–47 (reference/rausis_v2.md): every phrase is a 3D set (the Samarkand hall with its rows of tables and the
// arbiters' desk, Batumi, St Petersburg and Dubai in other colours, a map, an online board, a room with a monitor);
// cuts go through the monitor screen; the hall of the hook comes back at the end.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt, brilliantIcon } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE, SKIN2 } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { DotMap } from '../../engine/js/map.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, spread } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = HI.bad, TEAL = C.accent, CREAM = C.cream, LIME = HI.good;
const PHONE = '#9FD8FF', DUB_C = HI.hero, NEP_C = '#E0603F', MAG_C = '#6FB2FF', SV_C = '#E9B654', RAP_C = '#B08AF0';
// the knight game (Dubov White here, as ChessBase lists it; ply 24 = every piece home), Batumi 2019 (Dubov White; ply 41
// = 21.Rh7+, 43 = 22.Rxf7, 77 = 39.Qa2#), Airthings 2020 (quarterfinal game 3, Dubov White; ply 75 = 38.Qf4+, 77 =
// 39.Qxf5#), and the 2021 title match, game 6 (the far boards and Dubai)
const KN = await fetch('../engine/data/dubov_nepo_blitz2023.json').then(r => r.json());
const SV = await fetch('../engine/data/dubov_svane_2019.json').then(r => r.json());
const AM = await fetch('../engine/data/dubov_carlsen_airthings2020.json').then(r => r.json());
const CN = await fetch('../engine/data/carlsen_nepo_2021_g6.json').then(r => r.json());
const PH = {
  dubov: await loadPhoto3d('../episodes/dubov/photos/dubov2019'),
  nepo: await loadPhoto3d('../episodes/dubov/photos/nepo2024'),
  tal: await loadPhoto3d('../episodes/dubov/photos/tal1988'),
};
const CREDITS = {
  dubov: 'Photo: Stefan64, CC BY-SA 4.0',
  nepo: 'Photo: Frans Peeters, CC BY-SA 2.0',
  tal: 'Photo: Rob C. Croes / Anefo, CC0',
};
const MAP = await new DotMap().init();

// ---------- cast: Dubov (light brown hair up, a slim face, a grey jacket over a tee), Nepomniachtchi (as in the jeans
// episode), Svane, Magnus, the arbiter, and the players at the far tables ----------
CAST.dub = { face: [0.88, 1.12, 0.8], hair: 'quiff', hairC: '#A07A52', brow: '#7A5A3A', suit: '#5E5A54', suitD: '#3A3734', shirt: 'tee', ears: 1.04 };
CAST.nepD = { ...CAST.nepo };
CAST.svane = { face: [0.94, 1.1, 0.86], hair: 'swept', hairC: '#C2A070', brow: '#9A7C52', suit: '#2B3442', suitD: '#1D2430', shirt: 'open', ears: 1.02 };
CAST.mag = { ...CAST.magnusNY, hair: 'magnus', beard: null };  // short hair, no beard in 2021: not to be taken for Nepomniachtchi
CAST.arb = { ...CAST.arbiter };
[['slick', '#2A2420', '#3A3F48', 'tee'], ['swept', '#5A4030', '#262B36', 'open'], ['messy', '#1E1A16', '#4A4440', 'open'], ['receding', '#6E665C', '#2C3038', 'tie'],
  ['fringe', '#3A2A1E', '#3E4A5A', 'tee'], ['curly', '#2A1E16', '#22262E', 'open'], ['parted', '#7A5A3A', '#4A3E36', 'tie'], ['wavy', '#14100E', '#30343C', 'open']]
  .forEach(([hair, hairC, suit, shirt], i) => { CAST['x' + i] = { face: [0.92 + (i % 3) * 0.04, 1.04 + (i % 2) * 0.05, 0.86], hair, hairC, brow: mix(hairC, '#000000', 0.2), suit, suitD: mix(suit, '#000000', 0.35), shirt, tie: '#3A2A2E', ears: 1.02, glasses: i === 3 }; });
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });
// ---------- shared with the table-bang and Tal episodes (episodes/tablebang/scenes.js, episodes/talbrill/scenes.js): screen helpers, the 3D toolkit, people ----------
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

function coverTitle(g, l1, l2, y, { a = 1, icon = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#120C24';
  g.font = sans(70, 900); g.lineWidth = 16; g.strokeText(l1, W / 2, y); g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  g.font = sans(124, 900); const tw = g.measureText(l2).width, r = 50, gap = 26, x0 = W / 2 - (tw + gap + 2 * r) / 2 + tw / 2, y2 = y + 132;
  g.lineWidth = 20; g.strokeText(l2, x0, y2); g.fillStyle = '#FFD43B'; g.fillText(l2, x0, y2);
  g.restore();
  brilliantIcon(g, x0 + tw / 2 + gap + r, y2 - 44, r, icon * a);
  qaRect(g, 60, y - 60, W - 120, 210, 'text', 'cover title');
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

// ---------- people in 3D: limbs between world points, shoes, a walker ----------
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
// a question mark or an exclamation mark floating over a world point
function mark(g, ch, x, y, z, u, t, { color = CREAM, size = 1.1 } = {}) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), k = ease.back(clamp(u * 1.3));
  g.save(); g.globalAlpha *= clamp(u * 3); g.font = sans(Math.round(p.s * size * k), 900); g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowOffsetY = 5; g.fillText(ch, p.x, p.y - Math.sin(t * 5 + x) * p.s * 0.06); g.restore();
}
// a rating tag over a head, in the world
function tag3(g, x, y, z, text, col, u) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), k = lerp(1.35, 1, ease.out(clamp(u))), fs = Math.round(clamp(p.s * 0.6, 30, 64));
  g.font = sans(fs, 900); const tw = g.measureText(text).width + fs * 0.8;
  if (p.x < -tw / 2 || p.x > W + tw / 2) return;  // the anchor is off screen: no tag
  p.x = clamp(p.x, tw * k / 2 + 24, W - tw * k / 2 - 24);  // a tag at the edge slides into the frame
  g.save(); g.globalAlpha *= clamp(u * 2); g.translate(p.x, p.y); g.scale(k, k);
  g.font = sans(fs, 900);
  g.fillStyle = 'rgba(8,6,4,0.78)'; g.beginPath(); g.roundRect(-tw / 2, -fs * 0.85, tw, fs * 1.4, 10); g.fill();
  g.strokeStyle = col; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.textAlign = 'center'; g.fillText(text, 0, fs * 0.38);
  g.restore(); qaRect(g, p.x - tw / 2, p.y - fs * 0.85, tw, fs * 1.4, 'text', text);
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
function credit(g, text, a = 0.75, y = 314) { g.save(); g.globalAlpha *= a; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(text, W / 2, y); g.restore(); }
// a hand in a given skin (the engine's hand() takes the skin of the last character drawn)
function hand2(g, x, y, r, sk) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, sk.hi); gr.addColorStop(1, sk.base);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
// textures drawn once and kept (LED screens, the clock display); cleared when too many piled up
const TX = new Map();
function once(key, w, h, draw) { if (!TX.has(key)) { if (TX.size > 400) TX.clear(); TX.set(key, tex(w, h, draw)); } return TX.get(key); }
const ledGrid = (x, w, h, step = 8) => { x.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < w; i += step) x.fillRect(i, 0, 2, h); for (let j = 0; j < h; j += step) x.fillRect(0, j, w, 2); };

// ---------- the stage: a lighting truss over the table and its light cones (as in the Hikaru arena) ----------
function truss(g, t) {
  const Y0 = 16.3, Y1 = 16.7, C1 = '#1C2026';
  ab(g, [-4, Y0, -6.2], [12, Y1, -5.8], C1); ab(g, [-4, Y0, 13.8], [12, Y1, 14.2], C1);
  ab(g, [-4.2, Y0, -6], [-3.8, Y1, 14], C1); ab(g, [11.8, Y0, -6], [12.2, Y1, 14], C1);
  for (const [x, z] of [[-3, -5.5], [11, -5.5], [11, 13.5], [-3, 13.5]]) cylinder(g, [x, Y0, z], [x, Y0 - 0.8, z], 0.32, '#23272E', { n: 12 });
}
function cones(g, t, a) {
  if (a <= 0) return;
  spotCone(g, B, { top: [-3, 15.5, -5.5], base: [4, -0.35, -1.4], r0: 0.3, r1: 3.2, a, dust: 26, t, seed: 3 });
  spotCone(g, B, { top: [11, 15.5, 13.5], base: [4, -0.35, 9.3], r0: 0.3, r1: 3.2, a, dust: 26, t, seed: 5 });
  spotCone(g, B, { top: [11, 15.5, -5.5], base: [4, -0.35, 4], r0: 0.3, r1: 4.2, a: a * 0.8, dust: 20, t, seed: 7 });
}

// ---------- the games on the board. Captured pieces stand on the table beside the board, by the clock, in the order
// they were taken: White's losses on Black's side (z from 5.55), Black's on White's side (z from 0.1) ----------
function capOrder(plies) {
  if (!plies.cap) {
    const cap = new Map();
    for (let k = 1; k < plies.length; k++) { const cur = new Set(plies[k].pieces.map(p => p.id)); for (const p of plies[k - 1].pieces) if (!cur.has(p.id) && !cap.has(p.id)) cap.set(p.id, { k, p }); }
    plies.cap = cap;
  }
  return plies.cap;
}
function capturedAt(plies, k) {
  const n = { w: 0, b: 0 }, out = [];
  for (const [, { k: kc, p }] of [...capOrder(plies)].sort((a, b) => a[1].k - b[1].k)) {
    if (kc > k) continue;
    const i = n[p.c]++;
    out.push({ ...p, x: 9.25 + (i % 3) * 0.6, y: -0.35, z: (p.c === 'b' ? 0.1 : 5.55) + Math.floor(i / 3) * 0.62, slot: i, cap: true });
  }
  return out;
}
// the board of a game at ply k, with or without some pieces
const board = (plies, k, drop = []) => piecesAt(plies, k).filter(p => !drop.includes(p.id));

// ---------- loose pieces: anything not standing on a square (beside the board, in the air, on the floor), drawn with
// its own shadow on whatever is under it and tipped over by rot (on its side at ±π/2) ----------
const surf = (x, z) => x > -0.35 && x < 8.35 && z > -0.35 && z < 8.35 ? 0 : x > 9 && x < 10.8 && z > 3.1 && z < 4.9 ? 0.55
  : x > -1.1 && x < 11.3 && z > -1.1 && z < 9.1 ? -0.35 : FLOOR_Y;
const zoneOf = p => p.x < -1.1 || p.x > 11.3 || p.z < -1.1 || p.z > 9.1 ? 'out' : p.x < 8.35 ? 'brd' : 'side';
// off the table and on the camera's side of it: drawn after the table
const outLate = p => (p.x > 11.3 && B.E[0] > 11.3) || (p.x < -1.1 && B.E[0] < -1.1) || (p.z > 9.1 && B.E[2] > 9.1) || (p.z < -1.1 && B.E[2] < -1.1);
function drawLoose(g, list) {
  const L = list.map(p => ({ p, d: depth(p.x, p.y, p.z) })).filter(o => o.d > 0.6).sort((a, b) => b.d - a.d);
  for (const { p, d } of L) {
    const q = B.project(p.x, p.y, p.z), h = q.s * 1.25, r = p.rot || 0, lie = Math.abs(Math.sin(r)), s0 = surf(p.x, p.z), a = p.alpha ?? 1;
    if (depth(p.x, s0, p.z) > 0.6) {
      const sp = B.project(p.x, s0, p.z), sw = sp.s * 1.25 * (0.3 + 0.25 * lie);
      g.save(); g.globalAlpha *= a * 0.38 / (1 + Math.max(0, p.y - s0) * 1.6); g.fillStyle = '#000'; g.beginPath(); g.ellipse(sp.x, sp.y, sw, sw * 0.27, 0, 0, 7); g.fill(); g.restore();
    }
    const dz = d - B.dist, blur = clamp((dz < 0 ? -dz - 1.2 : (dz - 2.5) * 0.35) * 1.4, 0, 12);
    const cy = q.y - (0.45 * (1 - lie) + 0.17 * lie) * h;  // the piece's middle: half its height up, or its radius when it lies
    drawPiece(g, p.t, p.c, q.x - 0.45 * h * Math.sin(r), cy + 0.45 * h * Math.cos(r), h, { blur, rot: r, alpha: a });
    const air = p.trail ? clamp((p.y - s0) / 0.6, 0, 1) * p.trail : 0;
    if (air > 0.02) {  // the jump: three short strokes under a piece in the air
      g.save(); g.strokeStyle = '#FFFFFF'; g.lineCap = 'round'; g.lineWidth = Math.max(2, h * 0.035); g.globalAlpha *= 0.5 * air * a;
      if (blur > 0.5) g.filter = `blur(${blur.toFixed(1)}px)`;
      for (const [dx, l] of [[-0.22, 0.14], [0, 0.22], [0.22, 0.16]]) { g.beginPath(); g.moveTo(q.x + dx * h, q.y + 0.2 * h); g.lineTo(q.x + dx * h, q.y + (0.2 + l) * h); g.stroke(); }
      g.restore();
    }
  }
}
// a run of moves with its own slide length per move (playRun with dur): the pieces at t and the move under way
function runAt(plies, k0, at, t, durOf) {
  let i = -1; while (i + 1 < at.length && t >= at[i + 1]) i++;
  const k = k0 + i + 1, lt = i >= 0 ? t - at[i] : 0, d = i >= 0 ? durOf(i) : SLIDE, u = i >= 0 ? slide(lt, d) : 1;
  return { k, u, i, lt, d, pieces: i < 0 ? piecesAt(plies, k0) : piecesAt(plies, k, u, SLIDE_OPTS), m: i < 0 ? null : moveOf(plies, k) };
}
// ---------- the LCD clock beside the board and the eval bar (both games: names and colours per game) ----------
const fmtC = s => { s = Math.max(0, s); return s >= 20 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.floor(s)}.${Math.floor(s * 10) % 10}`; };
function lcdTex({ names, cols, l = 600, r = 600, run = 0, result = null }) {
  return once(`lcd:${names}:${result || ''}:${fmtC(l)}:${fmtC(r)}:${run}`, 480, 240, (x, w, h) => {
    x.fillStyle = '#070908'; x.fillRect(0, 0, w, h); x.fillStyle = '#0E1512'; x.fillRect(12, 12, w - 24, h - 24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = sans(24, 800); x.letterSpacing = '4px'; x.fillStyle = cols[0]; x.fillText(names[0], w * 0.25, 46); x.fillStyle = cols[1]; x.fillText(names[1], w * 0.75, 46);
    if (result) { x.font = sans(84, 900); x.letterSpacing = '4px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 20; x.fillText(result, w / 2, 150); return; }
    x.fillStyle = 'rgba(244,239,230,0.2)'; x.fillRect(w / 2 - 2, 30, 4, h - 60);
    x.font = mono(70, 800); x.letterSpacing = '0px'; x.shadowBlur = 16;
    for (const [s, side, fx] of [[l, 1, 0.25], [r, 2, 0.75]]) {  // under a minute the digits turn red
      x.shadowColor = x.fillStyle = s < 60 ? (run === side ? '#FF5A4F' : '#B0605A') : (run === side ? '#E9FFF0' : '#8FA89A');
      x.fillText(fmtC(s), w * fx, 145);
    }
  });
}
function lcdClock(g, st, press = 0) {
  ab(g, [9.0, -0.35, 3.1], [10.8, 0.55, 4.9], '#15181C', { amb: 0.6 });
  for (const [z0, z1, p] of [[3.25, 3.85, st.run === 2 ? 0 : 1], [4.15, 4.75, st.run === 1 ? 0 : 1]]) ab(g, [9.6, 0.55, z0], [10.2, 0.55 + 0.06 + p * 0.1 * (1 - press), z1], '#2A2F36', { amb: 0.6 });
  const img = lcdTex(st), m = 0.12, e = 0.02, E = B.E;
  if (E[2] < 3.1) texQuad(g, img, [9 + m, 0.55 - m, 3.1 - e], [10.8 - m, 0.55 - m, 3.1 - e], [9 + m, -0.35 + m, 3.1 - e]);
  if (E[2] > 4.9) texQuad(g, img, [10.8 - m, 0.55 - m, 4.9 + e], [9 + m, 0.55 - m, 4.9 + e], [10.8 - m, -0.35 + m, 4.9 + e]);
  if (E[0] > 10.8) texQuad(g, img, [10.8 + e, 0.55 - m, 3.1 + m], [10.8 + e, 0.55 - m, 4.9 - m], [10.8 + e, -0.35 + m, 3.1 + m]);
  pool(g, B, 9.9, 0.1, 4, 2.2, '#BFFFD8', 0.1, true);
}

// ---------- the stage table: White at z -1.4, Black at z 9.3 (seats wx, bx), the clock and the captured pieces on the
// right, the eval bar on the left; loose pieces (beside the board, in the air, on the floor) drawn in depth with the
// table, the clock and the board ----------
const TABLE = ['#1A1D22', '#0E1013', '#121418'], CHAIR = '#1A1E24';
function tableSet(g, t, { pieces = null, loose = [], ew = 'focus', eb = 'focus', wReach = null, bReach = null, wSide = -1, bSide = 1, white = 'dub', black = 'nepD', wx = 4, bx = 4,
  under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, evalCols = [DUB_C, NEP_C], wPlayer = true, bPlayer = true, wChair = true, bChair = true,
  slab = true, mark, behind = null, front = null, arms = null, focus = null, tableCol = TABLE } = {}) {
  const E = B.E;
  if (behind) behind(g);
  if (wChair && E[2] > -1.4) chair(g, B, wx, -1.9, { face: 1, color: CHAIR });
  if (bChair && E[2] < 9.3) chair(g, B, bx, 9.8, { face: -1, color: CHAIR });
  // the players, the far one first: the busts now; the hands later, and a player seen from behind (hands and all) last
  const seats = [[wPlayer, white, ew, wx, -1.4, 1, wReach, wSide], [bPlayer, black, eb, bx, 9.3, -1, bReach, bSide]].filter(s => s[0]);
  if (E[2] <= 4) seats.reverse();
  const P = seats.map(([, who, e, x, z, face, reach, side]) => ({ who, back: (E[2] - z) * face < 0, arm: armOf(reach, x, z, face, side),
    f: seated(g, B, who, e, t, { x, z, face, reach, side }) }));
  const hands = back => P.forEach(p => { if (p.back === back) { useSkin(g, p.who); p.f(); } });
  // a camera under the table top sees its underside: what stands on the table goes first and the table over it
  const below = E[1] < -0.35;
  // what is nearer to the camera than a reaching arm (of a player seen from the front) is drawn after the arm
  const AR = below ? [] : P.filter(p => !p.back && p.arm).map(p => p.arm);
  const late = (x, y, z) => AR.some(A => frontOf(A, x, y, z));
  const outL = loose.filter(p => zoneOf(p) === 'out' && outLate(p)), side = loose.filter(p => zoneOf(p) === 'side'), dc = depth(9.9, 0.1, 4);
  const lateP = new Set([...loose.filter(p => zoneOf(p) !== 'out'), ...outL].filter(p => late(p.x, p.y, p.z)));
  // the clock goes late with anything late behind it, and takes along whatever is in front of it
  const clockLate = !!clock && AR.length > 0 && (late(9.9, -0.35, 4) || side.some(p => lateP.has(p) && depth(p.x, p.y, p.z) > dc));
  if (clockLate) side.forEach(p => { if (depth(p.x, p.y, p.z) <= dc) lateP.add(p); });
  const early = list => list.filter(p => !lateP.has(p));
  const lateB = pieces && AR.length ? pieces.filter(p => late(p.x, p.y || 0, p.z)) : [];
  drawLoose(g, loose.filter(p => zoneOf(p) === 'out' && !outLate(p)));
  const barLate = E[0] < -1.5, sideLate = E[0] > 8.6;
  const sideDraw = () => {  // the captured pieces behind the clock, the clock, those in front of it
    const S = early(side);
    drawLoose(g, S.filter(p => depth(p.x, p.y, p.z) > dc));
    if (clock && !clockLate) lcdClock(g, clock, press);
    drawLoose(g, S.filter(p => depth(p.x, p.y, p.z) <= dc));
  };
  const onTable = () => {
    if (evalV !== null && !barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols });
    if (!sideLate) sideDraw();
    if (slab) B.drawSlab(g, mark === undefined ? SLATE : { ...SLATE, mark });  // mark: null leaves the sides of the far boards bare
    if (under) under(g);
    if (pieces) B.drawPieces(g, lateB.length ? pieces.filter(p => !lateB.includes(p)) : pieces, { focus: focus ?? B.dist, dof: 1.4 });
    drawLoose(g, early(loose.filter(p => zoneOf(p) === 'brd')));
    if (sideLate) sideDraw();
  };
  const tbl = () => table(g, B, { table: tableCol }, { x1: 10.6 });
  if (below) { onTable(); hands(false); tbl(); } else { tbl(); onTable(); }
  if (over) over(g);
  drawLoose(g, early(outL));
  if (evalV !== null && barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols });
  if (arms) arms(g);
  if (!below) {
    hands(false);
    // the late pass, far to near: the pieces and the clock in front of the arms
    [...lateB.map(p => [depth(p.x, p.y || 0, p.z), () => B.drawPieces(g, [p], { focus: focus ?? B.dist, dof: 1.4 })]),
      ...[...lateP].map(p => [depth(p.x, p.y, p.z), () => drawLoose(g, [p])]),
      ...(clockLate ? [[dc, () => lcdClock(g, clock, press)]] : [])].sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
  }
  hands(true);
  if (!wPlayer && wChair && E[2] < -1.4) chair(g, B, wx, -1.9, { face: 1, color: CHAIR });
  if (!bPlayer && bChair && E[2] > 9.3) chair(g, B, bx, 9.8, { face: -1, color: CHAIR });
  if (front) front(g);
}
// LOOK v2 arms (stage.js, seated and arm): a reaching arm runs on screen from the shoulder, drawn with the bust at its
// depth, to the hand, which rises from the table edge in front of the shoulder and goes to the target. Its two ends on
// screen, with their depths
function armOf(reach, x, z, face, side) {
  if (!reach || !(reach.u > 0)) return null;
  const [tx, tz] = reach.sq ? sqXZ(reach.sq) : [reach.x, reach.z], u = reach.hold ? clamp(reach.u) : Math.sin(Math.PI * clamp(reach.u));
  const R0 = [x - side * face * 1.3, 0.4, z + face * 1.3], T0 = [tx, reach.y ?? 0.9, tz];
  const hp = B.project(x, 3.1, z), s = hp.s / 100 * 1.05, rest = B.project(...R0), q = B.project(...T0), sdx = Math.sign(rest.x - hp.x) || 1;
  return { a: { x: hp.x + sdx * 125 * s, y: hp.y + 255 * s, d: depth(x, 3.1, z) },
    b: { x: lerp(rest.x, q.x, u), y: lerp(rest.y, q.y, u) - Math.sin(Math.PI * u) * 40, d: lerp(depth(...R0), depth(...T0), u) } };
}
// a piece standing at (x, y, z) in front of an arm: nearer to the camera than the arm wherever its foot, middle and top
// fall along the arm on screen (a piece under the hand stays under it)
function frontOf({ a, b }, x, y, z) {
  const dx = b.x - a.x, dy = b.y - a.y, d = depth(x, y + 0.6, z);
  return [0.15, 0.6, 1.1].every(h => {
    const q = B.project(x, y + h, z), u = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1));
    return d < lerp(a.d, b.d, u) - 0.1;
  });
}

// ---------- people on their feet (the Rausis walker): the bust over trousers and shoes; walk swings the legs and
// the hands, face is the way he faces (+z or -z), free leaves one hand out (that arm is drawn by the caller) ----------
function standing(g, who, x, z, { e = 'neutral', t = 0, k = 1, walk = 0, phase = 0, y0 = FLOOR_Y, face = 1, free = null } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8) return null;
  const c = CAST[who], sk = skinOf(who), p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK, bob = walk ? -Math.abs(Math.cos(phase)) * 12 : 0;
  const ex = typeof e === 'string' ? EXPR[e] : e, dx = x - B.E[0], dz = z - B.E[2];
  const ee = { ...ex, turn: clamp((ex.turn || 0) - face * dx / (Math.hypot(dx, dz) || 1) * 0.85, -1, 1) };
  footShadow(g, x, z, 1.3 * k, 0.8, y0);
  g.save(); g.translate(p.x, p.y); g.scale(sc, sc);
  const steps = [-1, 1].map(sd => { const ph = phase + (sd > 0 ? 0 : Math.PI); return { sd, fwd: walk * Math.sin(ph), lift: walk * Math.max(0, Math.cos(ph)) * 44 }; });
  const tc = [mix(c.suit, '#000000', 0.1), mix(c.suitD, '#000000', 0.35)];
  for (const L of steps.sort((a, b) => a.fwd - b.fwd)) leg(g, L.sd, { ...L, col: tc });
  g.translate(0, bob);
  g.save(); jacketClip(g); drawChar(g, who, { e: ee, t });
  g.strokeStyle = 'rgba(0,0,0,0.24)'; g.lineWidth = 5;  // the arms along the sides, the hem
  for (const sd of [-1, 1]) { if (sd === free) continue; g.beginPath(); g.moveTo(sd * 114, 236); g.quadraticCurveTo(sd * 120, 340, sd * 112, 444); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(-150, 436); g.quadraticCurveTo(0, 460, 150, 436); g.lineTo(150, 480); g.lineTo(-150, 480); g.closePath(); g.fill();
  g.restore();
  for (const sd of [-1, 1]) {  // hands out of the sleeves, swinging against the legs when he walks
    if (sd === free) continue;
    const sw = walk * Math.sin(phase + (sd > 0 ? Math.PI : 0));
    hand2(g, sd * (142 - sw * 4), 470 - sw * 10, 30, sk);
    g.fillStyle = mix(c.suitD, '#000000', 0.2); g.beginPath(); g.roundRect(sd * 128 - 26, 430, 52, 22, 8); g.fill();  // the cuff
  }
  g.restore();
  return p;
}
// the free arm of a standing man reaching to a world point hp (the pat on the back): shoulder, elbow, hand
function patArm(g, who, x, hy, z, k, sd, hp) {
  if (depth(x, hy, z) < 0.8) return;
  const c = CAST[who], u = k / 100 * 1.05 * HK, R = B.R, U = B.U;
  const sh = [0, 1, 2].map(i => [x, hy, z][i] + R[i] * sd * 128 * u - U[i] * 238 * u);
  const el = [0, 1, 2].map(i => (sh[i] + hp[i]) / 2 + R[i] * sd * 0.3 + (i === 1 ? -0.6 : 0));
  limb(g, sh, el, 0.42, 0.34, c.suit, c.suitD); limb(g, el, hp, 0.34, 0.26, c.suit, c.suitD);
  if (depth(...hp) > 0.5) { const p = B.project(...hp); hand2(g, p.x, p.y, p.s * 0.28, skinOf(who)); }
}
// two forearms over the board and the hands clasped: the handshake (u: 0 apart .. 1 joined), shaking while joined
function handshake(g, t, u, t0, white = 'dub', black = 'nepD') {
  const meet = [4.5, 1.5 + (u >= 1 ? Math.sin((t - t0) * 14) * 0.08 * clamp(1 - (t - t0) / 0.9) : 0), 4.1];
  const e = ease.inOut(clamp(u));
  for (const [sh, who, sd] of [[[5.3, 1.0, -1.0], white, 1], [[2.7, 1.0, 9.0], black, -1]]) {
    const c = CAST[who], rest = [sh[0], 0.3, lerp(sh[2], 4.1, 0.25)];
    const hnd = [lerp(rest[0], meet[0] + sd * 0.08, e), lerp(rest[1], meet[1], e), lerp(rest[2], meet[2] - sd * 0.12, e)];
    const elbow = [lerp(sh[0], hnd[0], 0.5) + sd * 0.25, lerp(sh[1], hnd[1], 0.5) - 0.35, lerp(sh[2], hnd[2], 0.5)];
    limb(g, sh, elbow, 0.36, 0.3, c.suit, c.suitD); limb(g, elbow, hnd, 0.3, 0.22, c.suit, c.suitD);
    if (depth(...hnd) > 0.5) { const p = B.project(...hnd); hand2(g, p.x, p.y, p.s * 0.3, skinOf(who)); }
  }
}
// a map pin: a thin stem and a glossy head; drop 0..1 brings it down from the sky, then a ring spreads round its foot
function mapPin(g, [x, z], u, t, t0, col = RED) {
  if (u <= 0) return;
  const y = (1 - ease.out(u)) * 9, b = clamp(u * 3);
  if (u >= 1) for (let i = 0; i < 2; i++) {
    const r = ((t - t0 + i * 0.6) % 1.2) / 1.2;
    B.ring(g, x, z, 0.3 + r * 2.4, col, (1 - r) * 0.8, 3);
  }
  footShadow(g, x, z, 0.5, b * 0.8, 0.01);
  g.save(); g.globalAlpha *= b;
  cylinder(g, [x, y, z], [x, y + 1.5, z], 0.05, '#C9CDD2', { n: 8, spec: 0.6 });
  lathe(g, x, z, [[y + 1.3, 0.04, 0.04], [y + 1.42, 0.24, 0.24], [y + 1.62, 0.34, 0.34], [y + 1.84, 0.26, 0.26], [y + 1.95, 0.08, 0.08]], col, { n: 18, spec: 0.8 });
  g.restore();
  const p = B.project(x, y + 1.62, z); rim(g, p.x, p.y, p.s * 1.4, col, 0.35 * b);
}
// a dotted arc from A to B rising off the map, drawn up to u, a light running at its head
const arcP = (A, Q, u, h = 3) => [lerp(A[0], Q[0], u), Math.sin(Math.PI * u) * h, lerp(A[1], Q[1], u)];
function euArc(g, A, Q, u) {
  if (u <= 0) return;
  g.save(); g.fillStyle = rgba(GOLD, 0.9);
  for (let i = 0; i <= 40; i++) {
    const v = i / 40; if (v > u) break;
    const q = arcP(A, Q, v); if (depth(...q) < 0.5) continue;
    const p = B.project(...q); g.beginPath(); g.arc(p.x, p.y, Math.max(2, p.s * 0.06), 0, 7); g.fill();
  }
  g.restore();
  const q = arcP(A, Q, u);
  if (u < 1 && depth(...q) > 0.5) { const p = B.project(...q); rim(g, p.x, p.y, p.s * 1.2, GOLD, 0.6); g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(p.x, p.y, Math.max(3, p.s * 0.12), 0, 7); g.fill(); }
}
// a knight's journey in the hand: lifted off `from`, carried over to `to` (landing at a + d), set down
function carried(t, a, d, from, to, { lift = 0.9, liftT = 0.35, hi = 0.35 } = {}) {
  const [x0, z0] = sqXZ(from), [x1, z1] = sqXZ(to);
  if (t < a) { const u = ease.out(seg(t, a - liftT, a, lin)); return { x: x0, y: lift * u, z: z0, u: 0 }; }
  const u = clamp((t - a) / d), e = ease.inOut(u);
  return { x: lerp(x0, x1, e), y: lift * (1 - e) + Math.sin(Math.PI * e) * hi, z: lerp(z0, z1, e), u };
}
// a short white flash and speed lines from a point of the board (the main moves)
function impact(g, sq, t, t0, { life = 0.4, flash = 0.45 } = {}) {
  const u = t - t0;
  if (u < 0 || u > life) return;
  flashTint(g, '#FFFFFF', flash * (1 - u / life));
  const [x, z] = sqXZ(sq);
  if (depth(x, 0.4, z) > 0.8) { const p = B.project(x, 0.4, z); speedLines(g, p.x, p.y, t, t0, { life }); }
}
// ======================= THE FILM =======================
const FEED = makeCanvas(), feedx = FEED.getContext('2d');  // the frame of another scene, shown on a screen
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
// rig keys for a camera at E(t) aimed at A(t), sampled every dt from t0 (times local to t0); rig them with e: x => x
function aimKeys(Ef, Af, t0, t1, { dt = 0.1, fov = 1500, cy = H * 0.5, yaw0 = null } = {}) {
  const keys = []; let prev = yaw0;
  for (let t = t0; t < t1 + dt; t += dt) {
    const A = Af(t), d = vsub(Ef(t), A), dist = Math.hypot(...d);
    let yaw = Math.atan2(d[0], -d[2]);
    if (prev !== null) yaw = prev + Math.atan2(Math.sin(yaw - prev), Math.cos(yaw - prev));
    prev = yaw;
    keys.push([t - t0, { yaw, pitch: Math.asin(d[1] / dist), dist, fov, cy, target: A }]);
  }
  return keys;
}

// ---------- the playing hall (Samarkand, then Batumi, St Petersburg and Dubai in other colours): a long dark floor
// with rows of tables, drapes at the ends, a back wall at each end with the event's banner, an LED wall behind the stage
// table at each end (z 21 behind Black, z -13 behind White), the arbiters' desk behind Black on the left ----------
// a set drawn shifted by (dx, dz): every projection goes through B.E, so moving the eye the other way moves the set
function atOffset(dx, dz, fn) { const E0 = B.E; B.E = [E0[0] - dx, E0[1], E0[2] - dz]; try { fn(); } finally { B.E = E0; } }
function hallBg(g) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0A0D14'); gr.addColorStop(1, '#030406');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (B.E[1] < 21) for (let x = -44; x <= 52; x += 8) for (let z = -10; z <= 18; z += 8) {
    if (depth(x, 22, z) < 1) continue; const p = B.project(x, 22, z);
    if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
    rim(g, p.x, p.y, Math.max(8, p.s * 1.8), '#CFE2FF', 0.3); g.fillStyle = 'rgba(235,245,255,0.85)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.15), 0, 7); g.fill();
  }
}
// text shrunk to fit a width
function fitFont(x, text, size, maxW, weight = 900) { let s = size; x.font = sans(s, weight); while (s > 12 && x.measureText(text).width > maxW) { s -= 2; x.font = sans(s, weight); } return s; }
const LEDC = { sam: TEAL, samR: TEAL, samD: GOLD, sam0: RED, stand: TEAL, standT: GOLD, bat: SV_C, dub: MAG_C, rap: RAP_C, rapM: RAP_C, cta: GOLD };
const LEDBASE = { sam: '#127A6E', bat: '#8A6A2A', dub: '#2A6FDB', rap: '#5A3A9A' };
function ledTex(mode) {
  return once('led:' + mode, 1280, 720, (x, w, h) => {
    const base = mode === 'sam0' ? '#8A1E1A' : LEDBASE[mode.slice(0, 3)] || LEDBASE.sam;
    const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7); gr.addColorStop(0, mix(base, '#000000', 0.55)); gr.addColorStop(1, mix(base, '#000000', 0.9));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (text, y, size, col, sp = 8, weight = 900, maxW = 860) => { x.letterSpacing = `${sp}px`; fitFont(x, text, size, maxW, weight); x.fillStyle = col; x.fillText(text, w / 2, y); };
    // the two names one over the other (Nepomniachtchi is long), the event over them, the date under
    const vs = (top, L, R, cl, cr, date) => {
      line(top, h * 0.15, 40, 'rgba(244,239,230,0.85)', 10, 800);
      line(L, h * 0.38, 104, cl, 6); line('VS', h * 0.52, 36, 'rgba(244,239,230,0.55)', 10, 800); line(R, h * 0.66, 104, cr, 6);
      line(date, h * 0.86, 36, 'rgba(244,239,230,0.7)', 8, 800);
    };
    const res = (score, sub, col) => {
      x.shadowColor = col; x.shadowBlur = 40; line(score, h * 0.42, 220, col, 8); x.shadowBlur = 0;
      line(sub, h * 0.78, 50, CREAM, 10);
    };
    // a standings table: [rank, name, points, highlight colour or null]
    const table = (title, rows, sub = null) => {
      line(title, h * 0.13, 38, 'rgba(244,239,230,0.85)', 10, 800);
      const rh = rows.length > 3 ? 86 : 130, y0 = rows.length > 3 ? 160 : 230, fs = rows.length > 3 ? 54 : 76;
      rows.forEach(([rk, name, pts, hi], i) => {
        const y = y0 + i * rh;
        if (hi) { x.fillStyle = rgba(hi, 0.22); x.fillRect(200, y - rh * 0.42, 880, rh * 0.84); x.fillStyle = hi; x.fillRect(200, y - rh * 0.42, 10, rh * 0.84); }
        x.letterSpacing = '4px'; x.font = sans(fs, 900);
        x.textAlign = 'left'; x.fillStyle = 'rgba(244,239,230,0.55)'; x.fillText(rk, 240, y);
        x.fillStyle = hi || CREAM; x.fillText(name, 320, y);
        x.textAlign = 'right'; x.fillStyle = hi || 'rgba(244,239,230,0.85)'; x.fillText(pts, 1050, y);
      });
      x.textAlign = 'center';
      if (sub) line(sub, h * 0.9, 40, GOLD, 10);
    };
    if (mode === 'sam') {
      line('WORLD BLITZ', h * 0.3, 130, CREAM, 10); line('CHAMPIONSHIP', h * 0.47, 60, 'rgba(244,239,230,0.8)', 18, 800);
      line('SAMARKAND', h * 0.67, 76, TEAL, 14); line('UZBEKISTAN · DECEMBER 2023', h * 0.83, 34, 'rgba(244,239,230,0.65)', 8, 800);
    }
    else if (mode === 'samR') vs('WORLD BLITZ · ROUND 11', 'DUBOV', 'NEPOMNIACHTCHI', DUB_C, NEP_C, 'DECEMBER 29, 2023');
    else if (mode === 'samD') res('½ – ½', 'DRAW IN 42 SECONDS', GOLD);
    else if (mode === 'sam0') res('0 – 0', 'ZERO POINTS FOR BOTH', RED);
    else if (mode === 'stand') table('WORLD BLITZ 2023 · FINAL', [['1', 'CARLSEN', '16', MAG_C], ['2', 'DUBOV', '15½', null], ['3', 'ARTEMIEV', '15', null]]);
    else if (mode === 'standT') table('WITHOUT THE ZERO', [['1', 'CARLSEN', '16', MAG_C], ['1', 'DUBOV', '16', GOLD], ['3', 'ARTEMIEV', '15', null]], 'TIED FOR FIRST');
    else if (mode === 'bat') vs('EUROPEAN TEAM CHAMPIONSHIP', 'DUBOV', 'SVANE', DUB_C, SV_C, 'BATUMI · OCTOBER 31, 2019');
    else if (mode === 'dub') vs('WORLD CHAMPIONSHIP MATCH', 'CARLSEN', 'NEPOMNIACHTCHI', MAG_C, NEP_C, 'DUBAI · 2021');
    else if (mode.startsWith('rap')) table('WORLD RAPID 2018 · FINAL', [['1', 'DUBOV', '11', GOLD], ['2', 'MAMEDYAROV', '10½', null], ['3', 'NAKAMURA', '10½', null], ['4', 'ARTEMIEV', '10½', null],
      ['5', 'CARLSEN', '10½', mode === 'rapM' ? MAG_C : null]]);
    else if (mode === 'cta') res('1 – 10', 'NEW TAL OR TROLL?', GOLD);
    ledGrid(x, w, h);
  });
}
// side +1: the wall behind Black (z 21, facing -z); -1: the wall behind White (z -13); mode2 fades in over mode by u
function ledWall(g, mode, side, mode2 = null, u = 0) {
  const z = side > 0 ? 21 : -13, zf = z + side * 0.3, col = LEDC[u > 0.5 && mode2 ? mode2 : mode];
  ab(g, [-9.4, -1.8, Math.min(z, zf)], [17.4, 13.6, Math.max(z, zf)], '#0C0F14');
  for (const [m, a] of [[mode, 1], [mode2, u]]) {
    if (!m || a <= 0) continue;
    const img = ledTex(m);
    if (side > 0) texQuad(g, img, [-9, 13.2, 20.98], [17, 13.2, 20.98], [-9, -1.4, 20.98], { a, under: a >= 1 });
    else texQuad(g, img, [17, 13.2, -12.98], [-9, 13.2, -12.98], [17, -1.4, -12.98], { a, under: a >= 1 });
  }
  pool(g, B, 4, 6, z - side * 0.1, 20, col, 0.12, true);
  pool(g, B, 4, FLOOR_Y + 0.02, z - side * 4, 14, col, 0.1);
}
function bannerTex(text) {
  return once('banner:' + text, 4096, 96, (x, w, h) => {
    x.fillStyle = '#0D1016'; x.fillRect(0, 0, w, h); x.fillStyle = rgba(TEAL, 0.6); x.fillRect(0, 4, w, 3); x.fillRect(0, h - 7, w, 3);
    x.font = sans(54, 900); x.letterSpacing = '22px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(244,239,230,0.8)'; x.fillText(text, w / 2, h / 2 + 2);
  });
}
// the far tables: other games of the round, the players unnamed (their positions borrowed from the other games here)
const BGX = [-32, -16, 16, 32], BGG = [[SV, 24], [AM, 36], [CN, 46], [SV, 52]];
function bgTable(g, t, dx, i) {
  const [G, k] = BGG[i];
  atOffset(dx, 0, () => {
    pool(g, B, 4, FLOOR_Y + 0.01, 4, 9, '#FFE2B8', 0.08);
    tableSet(g, t, { pieces: board(G, k), white: 'x' + 2 * i, black: 'x' + (2 * i + 1), ew: 'focus', eb: i % 2 ? 'worried' : 'focus', mark: null,
      clock: { names: ['', ''], cols: [CREAM, CREAM], l: 140 - 17 * i - (i % 2 ? 0 : t), r: 120 - 9 * i - (i % 2 ? t : 0), run: i % 2 ? 2 : 1 } });
  });
}
// the arbiters' desk: a long table with two plates on its front (ORGANIZERS, CHIEF ARBITER), the chief arbiter behind it
const DESKF = tex(1024, 256, (x, w, h) => {
  x.fillStyle = '#14171C'; x.fillRect(0, 0, w, h); x.fillStyle = rgba(TEAL, 0.5); x.fillRect(0, 0, w, 6);
  for (const [u, s] of [[0.27, 'ORGANIZERS'], [0.73, 'CHIEF ARBITER']]) {
    x.fillStyle = '#E9E4D8'; x.fillRect(u * w - 170, 70, 340, 76); x.fillStyle = '#14171C'; x.font = sans(38, 900); x.letterSpacing = '4px';
    x.textAlign = 'center'; x.textBaseline = 'middle'; fitFont(x, s, 38, 310); x.fillText(s, u * w, 110);
  }
});
const ARBX = -6.7, ARBZ = 17.4;
function arbDesk(g, t, { e = 'neutral', arb = true, glow = 0 } = {}) {
  const front = B.E[2] < 15;
  const man = () => { if (arb) standing(g, 'arb', ARBX, ARBZ, { e, t, face: -1 }); };
  if (front) man();
  ab(g, [-14, FLOOR_Y, 15], [-4, -0.7, 17], '#14171C');
  ab(g, [-14.2, -0.7, 14.8], [-3.8, -0.5, 17.2], '#22262E', { spec: 0.3 });
  if (front) texQuad(g, DESKF, [-14, -0.75, 14.97], [-4, -0.75, 14.97], [-14, FLOOR_Y + 0.2, 14.97]);
  ab(g, [-8.6, -0.5, 15.6], [-7.2, -0.45, 16.6], '#1A1C20');  // a laptop
  ab(g, [-8.6, -0.45, 16.5], [-7.2, 0.5, 16.6], '#1A1C20');
  if (glow > 0 && depth(-11.3, -1.2, 15) > 0.8) { const p = B.project(-11.3, -1.2, 15); rim(g, p.x, p.y, p.s * 3.2, RED, 0.6 * glow); }
  if (!front) man();
}
const THEME = {
  sam: { led: 'sam', carpet: TEAL, banner: 'WORLD BLITZ CHAMPIONSHIP · SAMARKAND 2023', bg: true },
  bat: { led: 'bat', carpet: GOLD, banner: 'EUROPEAN TEAM CHAMPIONSHIP · BATUMI 2019', bg: true },
  dub: { led: 'dub', carpet: MAG_C, banner: 'WORLD CHAMPIONSHIP MATCH · DUBAI 2021', bg: false },
  rap: { led: 'rap', carpet: RAP_C, banner: 'WORLD RAPID CHAMPIONSHIP · ST PETERSBURG 2018', bg: true },
};
// the far players and the arbiter are extras: drawn through a canvas of their own, which the layout check does not read
// (a far player cut by the frame edge is a hall, not a mistake); the zero shot checks the arbiter, its subject
const XL = makeCanvas(), xlx = XL.getContext('2d');
function layered(g, fn) { xlx.setTransform(1, 0, 0, 1, 0, 0); xlx.clearRect(0, 0, W, H); fn(xlx); g.drawImage(XL, 0, 0); }
function hall(g, t, { theme = 'sam', led = null, led2 = null, ledU = 0, mid = null, over = null, cone = 0.07, bg = true, desk = null } = {}) {
  const E = B.E, th = THEME[theme], L = led || th.led;
  hallBg(g);
  if (E[1] > FLOOR_Y) tiled(g, [-46, FLOOR_Y, -13.4], [100, 0, 0], [0, 0, 34.8], { color: '#0B0E12', grout: 'rgba(160,190,220,0.05)', tu: 3 });
  const drape = { color: '#150F14', grout: 'rgba(0,0,0,0.45)', tu: 1.1, tv: 40, lw: 5 }, wall = { color: '#0C0E13', grout: 'rgba(0,0,0,0.3)', tu: 4, tv: 30 };
  if (E[0] > -46) tiled(g, [-46, FLOOR_Y, 21.4], [0, 0, -34.8], [0, 24, 0], drape);
  if (E[0] < 54) tiled(g, [54, FLOOR_Y, -13.4], [0, 0, 34.8], [0, 24, 0], drape);
  if (E[2] < 21.4) { tiled(g, [-46, FLOOR_Y, 21.4], [100, 0, 0], [0, 24, 0], wall); texQuad(g, bannerTex(th.banner), [-26, 16.6, 21.38], [34, 16.6, 21.38], [-26, 15.2, 21.38]); }
  if (E[2] > -13.4) { tiled(g, [54, FLOOR_Y, -13.4], [-100, 0, 0], [0, 24, 0], wall); texQuad(g, bannerTex(th.banner), [34, 16.6, -13.38], [-26, 16.6, -13.38], [34, 15.2, -13.38]); }
  if (E[2] < 21) ledWall(g, L, 1, led2, ledU);
  if (E[2] > -13) ledWall(g, L, -1, led2, ledU);
  pool(g, B, 4, FLOOR_Y, 4, 12, '#FFE2B8', 0.14);
  g.save(); g.strokeStyle = rgba(th.carpet, 0.85); g.lineWidth = 3; g.shadowColor = th.carpet; g.shadowBlur = 18; g.beginPath();
  const y = FLOOR_Y + 0.01; line3(g, [-3, y, -4], [13, y, -4]); line3(g, [13, y, -4], [13, y, 12]); line3(g, [13, y, 12], [-3, y, 12]); line3(g, [-3, y, 12], [-3, y, -4]);
  g.stroke(); g.restore();
  // the tables and the desk, far to near; a far table off the frame is skipped
  const items = [];
  if (mid) items.push([depth(4.5, 0, 4), () => mid(g)]);
  if (th.bg && bg) BGX.forEach((dx, i) => {
    const d = depth(4.5 + dx, 0, 4); if (d < 2) return;
    const p = B.project(4.5 + dx, 0, 4), r = p.s * 9;
    if (p.x + r < 0 || p.x - r > W) return;
    items.push([d, () => layered(g, x => bgTable(x, t, dx, i))]);
  });
  if (desk) items.push([depth(-9, 0, 16), () => desk.qa ? arbDesk(g, t, desk) : layered(g, x => arbDesk(x, t, desk))]);
  items.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
  truss(g, t); cones(g, t, cone);
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- a dotted map from the Gulf to Moscow on the floor of a dark room: pins on Dubai, Moscow, Samarkand, gold
// arcs between. 1 degree of latitude = 0.5 units, a degree of longitude 0.36; north is +z ----------
const AS = { lon0: 26, lon1: 78, lat0: 18, lat1: 62 };
const asXZ = (lon, lat) => [(lon - 50) * 0.36, (lat - 40) * 0.5];
const DXB = asXZ(55.27, 25.2), MOW = asXZ(37.62, 55.75), SKD = asXZ(66.96, 39.65);
const ASMAP = tex(Math.round((AS.lon1 - AS.lon0) * 28.8), (AS.lat1 - AS.lat0) * 40, (x, w, h) => {
  x.fillStyle = '#060C12'; x.fillRect(0, 0, w, h);
  for (let lat = AS.lat1 - 0.2; lat > AS.lat0; lat -= 0.42) for (let lon = AS.lon0 + 0.2; lon < AS.lon1; lon += 0.585) {
    const id = MAP.at(lon, lat); if (!id) continue;
    const hi = id === 643 ? '#C24A3E' : id === 784 ? MAG_C : id === 860 ? TEAL : null;  // Russia, the UAE, Uzbekistan
    x.fillStyle = hi || '#1E3346'; x.beginPath(); x.arc((lon - AS.lon0) * 28.8, (AS.lat1 - lat) * 40, hi ? 6 : 5, 0, 7); x.fill();
  }
});
function mapSet(g, lt, t, keys, { pins = [], arcs = [] } = {}) {
  rig(B, lt, keys, { t });
  const bg = g.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#0B1520'); bg.addColorStop(1, '#020305');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  texQuad(g, ASMAP, [-8.64, 0, 11], [10.08, 0, 11], [-8.64, 0, -11]);
  for (const [A, Q, u] of arcs) euArc(g, A, Q, u);
  for (const [P, u, t0, col] of pins) { if (u > 0) pool(g, B, P[0], 0.02, P[1], 3, col, 0.12); mapPin(g, P, u, t, t0, col); }
  lowKey(g, { cy: H * 0.45, a: 0.35 });
}

// ---------- an online game: the board alone in a dark digital space, a grid under it, the players' names at its ends ----------
function onlineSet(g, t, { pieces, under = null, over = null, names = null, cols = [DUB_C, MAG_C], nameU = 1 } = {}) {
  const gr = g.createRadialGradient(W / 2, H * 0.48, 60, W / 2, H * 0.48, H * 0.75); gr.addColorStop(0, '#10233A'); gr.addColorStop(1, '#03060B');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = rgba(PHONE, 0.08); g.lineWidth = 2; g.beginPath();
  for (let i = -24; i <= 32; i += 2) { line3(g, [i, -3, -24], [i, -3, 32]); line3(g, [-24, -3, i], [32, -3, i]); }
  g.stroke(); g.restore();
  pool(g, B, 4, -0.4, 4, 10, PHONE, 0.12);
  B.drawSlab(g, SLATE);
  if (under) under(g);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 });
  if (over) over(g);
  if (names) { tag3(g, 4, 0.3, 9.0, names[1], cols[1], nameU); tag3(g, 4, 0.3, -0.9, names[0], cols[0], nameU); }
  lowKey(g, { cy: H * 0.48, a: 0.3 });
}

// ---------- a room at night with a desk and a monitor (Dubov at home; Magnus's second in a hotel room in Dubai). The
// monitor's screen (16:9) holds a window as tall as it with a whole frame of another scene, 9:16, in the middle: the
// camera pushes into it, or pulls back from it ----------
const MON = { x: 4, y: 2.7, z: 3.5, hw: 1.9, hh: 1.07 };
const MONC = makeCanvas(1280, 720), monx = MONC.getContext('2d');
function monitorScreen(feed, { names = ['DUBOV', 'NEPO'], cols = [DUB_C, NEP_C], title = 'ONLINE · BLITZ' } = {}) {
  const x = monx, w = 1280, h = 720;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  x.fillStyle = '#0E1218'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#161C25'; x.fillRect(0, 0, w, 44);
  x.font = sans(22, 800); x.letterSpacing = '4px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(234,242,246,0.6)'; x.fillText(title, 24, 23);
  const card = (y, name, col) => {
    x.fillStyle = '#1A212B'; x.beginPath(); x.roundRect(40, y, 360, 100, 12); x.fill(); x.fillStyle = col; x.fillRect(40, y + 12, 8, 76);
    x.fillStyle = '#3A4654'; x.beginPath(); x.arc(100, y + 50, 26, 0, 7); x.fill();
    x.font = sans(34, 900); x.letterSpacing = '3px'; x.fillStyle = CREAM; x.fillText(name, 142, y + 52);
  };
  card(110, names[1], cols[1]); card(510, names[0], cols[0]);
  for (let i = 0; i < 10; i++) {
    x.fillStyle = 'rgba(234,242,246,0.06)'; x.fillRect(880, 80 + i * 58, 360, 42);
    x.fillStyle = 'rgba(234,242,246,0.22)'; x.fillRect(900, 94 + i * 58, 70 + (i * 37) % 60, 14); x.fillRect(1060, 94 + i * 58, 60 + (i * 53) % 70, 14);
  }
  x.drawImage(feed, 437.5, 0, 405, 720);
  return MONC;
}
const CITY = tex(1024, 768, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060A14'); gr.addColorStop(1, '#16203A'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 26; i++) {
    const bw = 30 + r() * 60, bh = 120 + r() * 420, bx = r() * w; x.fillStyle = '#05070D'; x.fillRect(bx, h - bh, bw, bh);
    for (let yy = h - bh + 10; yy < h - 8; yy += 16) for (let xx = bx + 6; xx < bx + bw - 6; xx += 12) if (r() < 0.32) { x.fillStyle = r() < 0.5 ? 'rgba(255,214,150,0.75)' : 'rgba(170,210,255,0.6)'; x.fillRect(xx, yy, 5, 7); }
  }
  x.strokeStyle = '#2A2F38'; x.lineWidth = 14; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
});
const PANELK = { yaw: 0, pitch: 0, dist: 1.672, fov: 1500, cy: H * 0.5, target: [MON.x, MON.y, MON.z] };  // the 9:16 window of the screen fills the frame
function room(g, t, { screen, e = 'focus', reach = null, hotel = false, over = null } = {}) {
  const E = B.E, wallC = hotel ? '#3E352C' : '#2A303C';
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#08090D'); gr.addColorStop(1, '#030305'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) tiled(g, [-8, FLOOR_Y, -9], [24, 0, 0], [0, 0, 19], { color: hotel ? '#4A3A2E' : '#3A2A1E', grout: 'rgba(0,0,0,0.3)', tu: 0.9, tv: 19 });
  const wall = { color: wallC, grout: 'rgba(0,0,0,0.15)', tu: 24, tv: 20 };
  if (E[2] < 10) tiled(g, [-8, FLOOR_Y, 10], [24, 0, 0], [0, 16, 0], wall);
  if (E[2] > -9) { tiled(g, [16, FLOOR_Y, -9], [-24, 0, 0], [0, 16, 0], wall); texQuad(g, CITY, [3, 9.5, -8.95], [-5, 9.5, -8.95], [3, 2.5, -8.95]); }
  if (E[0] > -8) tiled(g, [-8, FLOOR_Y, -9], [0, 0, 19], [0, 16, 0], wall);
  if (E[0] < 16) tiled(g, [16, FLOOR_Y, 10], [0, 0, -19], [0, 16, 0], wall);
  // a floor lamp in the corner, its warm pool on the wall
  cylinder(g, [-5.5, FLOOR_Y, 6], [-5.5, 5.4, 6], 0.08, '#2A2A2A', { n: 10 });
  lathe(g, -5.5, 6, [[5.2, 0.9, 0.9], [6.4, 0.55, 0.55]], '#D9C29A', { n: 20, amb: 0.9 });
  pool(g, B, -5.5, 5.8, 9.9, 7, '#FFC98A', 0.22, true); pool(g, B, -7.9, 5.8, 5, 7, '#FFC98A', 0.16, true);
  pool(g, B, -5.5, FLOOR_Y + 0.01, 6, 5, '#FFC98A', 0.1);
  const front = E[2] > -1.4;
  chair(g, B, 4, -1.9, { face: 1, color: CHAIR });
  const monitor = () => {
    cylinder(g, [4, -0.35, 3.9], [4, 1.7, 3.9], 0.14, '#1A1C20', { n: 12 }); ab(g, [3.1, -0.35, 3.5], [4.9, -0.28, 4.3], '#1A1C20');
    ab(g, [MON.x - MON.hw - 0.12, MON.y - MON.hh - 0.12, MON.z], [MON.x + MON.hw + 0.12, MON.y + MON.hh + 0.12, MON.z + 0.22], '#0B0C0F', { spec: 0.3 });
    if (E[2] < MON.z) texQuad(g, screen, [MON.x - MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x + MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x - MON.hw, MON.y - MON.hh, MON.z - 0.01], { under: false });
    pool(g, B, MON.x, MON.y, MON.z - 0.3, 4, PHONE, 0.1, true);
  };
  const desk = () => {
    for (const [x, z] of [[-1.8, -0.4], [9.8, -0.4], [-1.8, 4.4], [9.8, 4.4]]) ab(g, [x - 0.12, FLOOR_Y, z - 0.12], [x + 0.12, -0.75, z + 0.12], '#15171B');
    ab(g, [-2, -0.75, -0.6], [10, -0.35, 4.6], hotel ? '#3A2C22' : '#1E1A16', { spec: 0.2 });
    ab(g, [2.6, -0.35, 0.2], [5.4, -0.28, 1.0], '#16181C', { spec: 0.3 });  // the keyboard, the mouse, a mug
    ab(g, [6.2, -0.35, 0.4], [6.6, -0.25, 0.9], '#16181C', { spec: 0.4 });
    lathe(g, 8.2, 1.6, [[-0.35, 0.28, 0.28], [0.25, 0.3, 0.3]], hotel ? '#E8E2D6' : '#B8443A', { n: 16, spec: 0.3 });
  };
  if (!front) monitor();
  const hb = seated(g, B, 'dub', e, t, { x: 4, z: -1.4, face: 1, reach, side: 1 });
  if (front) {
    const p = B.project(4, 3.1, -1.4); if (depth(4, 3.1, -1.4) > 0.8) rim(g, p.x, p.y, p.s * 1.6, PHONE, 0.16);  // the screen's light on his face
  }
  desk();
  useSkin(g, 'dub'); hb();
  if (front) monitor();
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.18 });
}

// ---------- knight hops: a run of moves at times `at`, each d long, the piece in the air on its arc; the paths of the
// knights (and the hunted king) drawn on the board up to where they are now ----------
const HOP = { arc: 1.1, e: ease.inOut, trail: false };
function hopAt(plies, k0, at, t, d, opts = HOP) {
  let i = -1; while (i + 1 < at.length && t >= at[i + 1]) i++;
  const k = k0 + i + 1, lt = i >= 0 ? t - at[i] : 0, u = i >= 0 ? clamp(lt / d) : 1;
  return { k, u, i, lt, pieces: i < 0 ? piecesAt(plies, k0) : piecesAt(plies, k, u, opts), m: i < 0 ? null : moveOf(plies, k) };
}
function trails(g, plies, k0, k, pieces, ids, cols, { lw = 6, a = 0.85 } = {}) {
  ids.forEach((id, j) => {
    const pts = []; let last = null;
    for (let i = k0; i < k; i++) { const p = plies[i].pieces.find(q => q.id === id); if (p && p.sq !== last) { pts.push(sqXZ(p.sq)); last = p.sq; } }
    const cur = pieces.find(p => p.id === id); if (cur) pts.push([cur.x, cur.z]);
    if (pts.length < 2) return;
    g.save(); g.strokeStyle = rgba(cols[j], a); g.lineWidth = lw; g.lineCap = g.lineJoin = 'round'; g.shadowColor = cols[j]; g.shadowBlur = 14; g.beginPath();
    for (let i = 0; i + 1 < pts.length; i++) line3(g, [pts[i][0], 0.05, pts[i][1]], [pts[i + 1][0], 0.05, pts[i + 1][1]]);
    g.stroke(); g.restore();
  });
}
const KNIGHTS = ['N1', 'N2', 'n1', 'n2'], KCOLS = [DUB_C, DUB_C, GOLD, GOLD];

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const PI = Math.PI;
  const landCue = (t, cap = false, g = 0.7) => cue(t - MOVE_HIT, cap ? 'move_capture' : 'move', g);

  // the cuts, in order (a shot runs to the next one)
  const H2 = 1.45, whyA = s('why') - 0.05, thisT = w('why', 'this'), wcA = w('why', 'world') - 0.06;
  const whoA = s('who') - 0.05, likeA = w('who', 'like') - 0.06, thrA = w('who', 'he') - 0.06, pcT = w('who', 'pieces'), kgT = w('who', 'king');
  const rookA = s('rook') - 0.05, rookT = w('rook', 'rook');
  const huntA = s('hunt') - 0.05, entT = w('hunt', 'entire');
  const rapA = s('rapid') - 0.05, titT = w('rapid', 'title'), magT = w('rapid', 'magnus');
  const mateA = s('mate') - 0.05, m1T = w('mate', 'magnus'), outT = w('mate', 'out'), cmT = w('mate', 'checkmate');
  const teamA = s('team') - 0.05, helpA = w('team', 'helped') - 0.06, defA = w('team', 'defend') - 0.06, agA = w('team', 'against') - 0.06, rusT = w('team', 'russian'), ianA = w('team', 'ian') - 0.06;
  const betA = s('betray') - 0.05, accT = w('betray', 'accused'), btT = w('betray', 'betrayal');
  const blzA = s('blitz') - 0.05, wbA = w('blitz', 'world') - 0.06, oppA = w('blitz', 'his') - 0.06, nepT = w('blitz', 'nepomniachtchi');
  const dncA = s('dance') - 0.05, knT = w('dance', 'knights'), twA = w('dance', 'twelve') - 0.06, homeT = w('dance', 'home'), drT = w('dance', 'draw'), drawA = drT - 0.3, ftT = w('dance', 'forty-two');
  const proA = s('protest') - 0.05, prT = w('protest', 'protest'), orgT = w('protest', 'organizers');
  const zeroA = s('zero') - 0.05, zT = w('zero', 'zero'), bothA = w('zero', 'for') - 0.06;
  const costA = s('cost') - 0.05, tiedT = w('cost', 'tied');
  const agnA = s('again') - 0.05, onT = w('again', 'online'), danA = w('again', 'they') - 0.06, FA = danA + 0.65, againT = w('again', 'again'), wonA = w('again', 'and') - 0.06, wonT = w('again', 'won');
  const ctaA = s('cta') - 0.05, rateT = w('cta', 'rate'), tenT = w('cta', 'ten');

  const SAM_CLK = { names: ['DUBOV', 'NEPO'], cols: [DUB_C, NEP_C] };
  const clockAt = (k, o = {}) => ({ ...SAM_CLK, l: 180 + 0.4 * Math.floor(k / 2), r: 180 + 0.4 * Math.floor((k - 1) / 2), run: k % 2 ? 2 : 1, ...o });
  const samSet = (g, t, tab = {}, hl = {}) => hall(g, t, { theme: 'sam', desk: {}, ...hl, mid: g2 => tableSet(g2, t, { white: 'dub', black: 'nepD', ...tab }) });
  const batSet = (g, t, tab = {}, hl = {}) => hall(g, t, { theme: 'bat', ...hl, mid: g2 => tableSet(g2, t, { white: 'dub', black: 'svane', ...tab }) });
  const halos = (pieces, ids, col, a) => pieces.map(p => ids.includes(p.id) ? { ...p, halo: col, haloA: a } : p);

  // ======================= HOOK (rule 42): the knight dance at full speed in the Samarkand hall =======================
  // 24 hops, every piece home on "this"; a whip to the side, then high over the board, then the crane out over the hall
  const D1 = 0.16, HSP = (thisT - D1 - 0.15) / 23, HA = [...Array(24)].map((_, i) => 0.15 + i * HSP);
  const hookBoard = (g, t, tab = {}, hl = {}) => {
    const r = hopAt(KN, 0, HA, t, D1), home = seg(t, thisT, thisT + 0.25, lin);
    samSet(g, t, { pieces: halos(r.pieces, KNIGHTS, GOLD, home), clock: clockAt(r.k), ...tab,
      under: g2 => { if (t >= thisT) for (const sq of ['b1', 'g1', 'b8', 'g8']) ledGlow(g2, B, sq, GOLD, t, thisT); },
      over: g2 => trails(g2, KN, 0, r.k + (r.u < 1 ? 0 : 1), r.pieces, KNIGHTS, KCOLS, { a: 0.7 * (1 - home) }) }, hl);
  };
  const hookHud = (g, lt, t) => coverTitle(g, 'THEY CALL HIM', 'THE NEW TAL', 205, { a: 1 - seg(t, whyA - 0.1, whyA + 0.1, lin) });
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.32, 0.3, 11.5, [4, 1.7, 3.0])], [len(sh), K(PI - 0.38, 0.28, 10.6, [4, 1.7, 3.0])]], { t, e: lin });
    hookBoard(g, t, { bPlayer: false, bChair: false, ew: 'smug' });
  }, { hud: hookHud });
  shot(H2, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.62, 0.32, 11.5, [4, 1.6, 5.2])], [len(sh), K(0.55, 0.3, 10.6, [4, 1.6, 5.2])]], { t, e: lin });
    hookBoard(g, t, { ew: 'smug', eb: 'smug' });
  }, { trans: 'whip', hud: hookHud });
  shot(whyA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 1.05, 12.5, [4, 0, 4])], [len(sh), K(0.12, 1.15, 11.2, [4, 0, 4])]], { t, e: lin, bump: t > thisT && t < thisT + 0.3 ? 1.2 : 0 });
    hookBoard(g, t, { wPlayer: false, bPlayer: false, wChair: false, bChair: false }, { over: g2 => impact(g2, 'e4', t, thisT, { flash: 0.3 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { hookHud(g, lt, t); if (t >= thisT) badge(g, 'THIS?!', W / 2, 330, { color: GOLD, size: 64, ...pop(t, thisT) }); } });
  shot(wcA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.15, 0.6, 16, [4, 0.5, 4])], [len(sh), K(0.32, 0.3, 44, [4, 3, 6], { fov: 1200 })]], { t });
    samSet(g, t, { pieces: halos(board(KN, 24), KNIGHTS, GOLD, 1 - seg(t, wcA, wcA + 0.6)), clock: clockAt(24) });
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'World Blitz', 'SAMARKAND · 2023', { y: 200, t0: 0.15 }) });
  cue(0, 'murmur', 0.2); cue(0, 'whoosh_soft', 0.2);
  HA.forEach(a => cue(a + D1 - 0.03, 'piece', 0.32));
  cue(H2 - 0.08, 'whoosh_fast', 0.3); cue(whyA - 0.08, 'whoosh_fast', 0.3);
  cue(thisT - 0.3, 'revswell', 0.6); cue(thisT - 0.004, 'boom', 0.8); cue(thisT, 'hit_punch', 0.45); cue(thisT + 0.05, 'reveal_bell', 0.35);
  cue(wcA - 0.04, 'whoosh_deep', 0.35); cue(wcA + 0.2, 'murmur', 0.25);

  // ======================= WHO: Dubov, Tal (the real photos) =======================
  const photoKeys = { from: { x: 0.5, y: 0.35, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.37, zoom: 1.08, dolly: 0.05 } };
  shot(whoA, (g, lt, t) => photoShot(g, lt, PH.dubov, { ...photoKeys, dur: likeA - whoA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Daniil Dubov', 'RUSSIA · GRANDMASTER', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.dubov, seg(lt, 0.4, 0.6) * 0.75); } });
  shot(likeA, (g, lt, t) => photoShot(g, lt, PH.tal, { ...photoKeys, dur: thrA - likeA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Mikhail Tal', '8TH WORLD CHAMPION', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.tal, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(whoA - 0.06, 'whoosh_fast', 0.3); cue(whoA + 0.1, 'ting', 0.25); cue(likeA - 0.06, 'whoosh_fast', 0.3); cue(likeA + 0.1, 'reveal_bell', 0.3);

  // ======================= BATUMI 2019: 20.Nd5 (a knight thrown in), 20...Nxd5 =======================
  const l39 = pcT + 0.06, l40 = kgT + 0.12, a39 = l39 - SLIDE, a40 = l40 - SLIDE;
  const m39 = { ...moveOf(SV, 39), label: '20.Nd5!' }, m40 = moveOf(SV, 40);
  const svAt = (t, list) => { let cur = null; for (const e of list) if (t >= e[1]) cur = e; return cur ? { k: cur[0], pieces: piecesAt(SV, cur[0], slide(t - cur[1]), SLIDE_OPTS) } : { k: list[0][0] - 1, pieces: board(SV, list[0][0] - 1) }; };
  shot(thrA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.75, 0.36, 12, [4.2, 1.4, 5])], [len(sh), K(0.68, 0.38, 11, [4.3, 1.3, 5])]], { t });
    const r = svAt(t, [[39, a39], [40, a40]]), brill = t >= l39 && t < a40 + 0.1 ? seg(t, l39, l39 + 0.2) : 0;
    batSet(g, t, { pieces: r.pieces.map(p => p.id === 'N2' && brill ? { ...p, brill } : p), loose: capturedAt(SV, t >= l40 ? 40 : 38),
      wReach: { sq: 'd5', u: seg(t, a39 - 0.4, a39 + 0.6, lin) }, bReach: { sq: 'd5', u: seg(t, a40 - 0.4, a40 + 0.6, lin) }, bSide: -1,
      ew: t >= l39 ? 'smug' : 'focus', eb: t >= l39 ? 'worried' : 'focus',
      under: g2 => { if (t >= l39) ledGlow(g2, B, 'd5', GOLD, t, l39); moveUnder(g2, B, m39, t - a39, { hold: a40 - a39 - 0.2 }); moveUnder(g2, B, m40, t - a40); },
      over: g2 => { moveOver(g2, B, m39, t - a39, { hold: a40 - a39 - 0.2 }); moveOver(g2, B, m40, t - a40); } });
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'Batumi', 'OCTOBER 2019', { y: 200, t0: 0.1 }) });
  cue(thrA - 0.06, 'whoosh_fast', 0.3); cue(thrA, 'murmur', 0.2);
  landCue(l39); boom(l39, 0.65); cue(l39 + 0.02, 'sparkle_pop', 0.3); landCue(l40, true); boom(l40, 0.5);

  // ======================= THE ROOK: 21.Rh7+ Kg8 22.Rxf7! Rxf7 =======================
  const a41 = rookA + 0.12, a42 = rookA + 0.55, l43 = rookT + 0.06, a43 = l43 - SLIDE, l44 = l43 + 0.36, a44 = l44 - SLIDE;
  const m41 = moveOf(SV, 41), m42 = moveOf(SV, 42), m43 = { ...moveOf(SV, 43), label: '22.Rxf7!!' }, m44 = moveOf(SV, 44);
  shot(rookA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.62, 0.42, 9.6, [6.2, 0.8, 5.5])], [len(sh), K(0.56, 0.46, 8.8, [6.3, 0.7, 5.6])]], { t, bump: t > l43 && t < l43 + 0.3 ? 1.4 : 0 });
    const r = svAt(t, [[41, a41], [42, a42], [43, a43], [44, a44]]), brill = t >= l43 && t < a44 + 0.15 ? seg(t, l43, l43 + 0.2) : 0;
    batSet(g, t, { pieces: r.pieces.map(p => p.id === 'R1' && brill ? { ...p, brill } : p), loose: capturedAt(SV, t >= l44 ? 44 : t >= l43 ? 43 : 40),
      wReach: t < a42 ? { sq: 'h7', u: seg(t, a41 - 0.4, a41 + 0.6, lin) } : { sq: 'f7', u: seg(t, a43 - 0.4, a43 + 0.6, lin) }, wSide: 1,
      bReach: t < a43 ? { sq: 'g8', u: seg(t, a42 - 0.4, a42 + 0.6, lin) } : { sq: 'f7', u: seg(t, a44 - 0.4, a44 + 0.6, lin) },
      ew: 'focus', eb: t >= l43 ? 'shock' : 'worried',
      under: g2 => {
        if (t >= l43) { ledGlow(g2, B, 'f7', GOLD, t, l43); spread(g2, B, 'f7', t, l43, GOLD); }
        for (const [m, a] of [[m41, a41], [m42, a42], [m43, a43], [m44, a44]]) moveUnder(g2, B, m, t - a, { hold: 0.25 });
      },
      over: g2 => { for (const [m, a] of [[m41, a41], [m42, a42], [m43, a43], [m44, a44]]) moveOver(g2, B, m, t - a, { hold: 0.25, label: m === m43 }); } },
      { over: g2 => impact(g2, 'f7', t, l43) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= l43) badge(g, 'ROOK SAC', 250, 250, { color: GOLD, size: 56, ...pop(t, l43) }); } });
  cue(rookA - 0.06, 'whoosh_fast', 0.3); landCue(a41 + SLIDE); boom(a41 + SLIDE, 0.45); landCue(a42 + SLIDE, false, 0.5);
  cue(l43 - 0.3, 'revswell', 0.8); cue(l43 - 0.004, 'boom', 0.85); cue(l43 - BOOM_HIT, 'boom_big', 0.4); landCue(l43, true, 0.8); cue(l43, 'hit_punch', 0.5); cue(l43 + 0.25, 'gasp', 0.35);
  landCue(l44, true, 0.55);

  // ======================= THE HUNT: 23.Qxg6+ ... 39.Qa2#, the king driven from g8 to a3 =======================
  const HD = 0.06, HU = [...Array(33)].map((_, i) => lerp(huntA + 0.22, huntA + 2.5 - HD, i / 32)), mateL = HU[32] + HD;
  shot(huntA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.15, 1.38, 14.5, [4.2, 0, 4.2])], [len(sh), K(0.32, 1.32, 13, [3.6, 0, 4.0])]], { t, bump: t > mateL && t < mateL + 0.3 ? 1.2 : 0 });
    const r = hopAt(SV, 44, HU, t, HD, { arc: 0.35, e: ease.inOut, trail: false }), mated = t >= mateL;
    batSet(g, t, { pieces: r.pieces, loose: capturedAt(SV, r.u < 1 ? r.k - 1 : r.k), wPlayer: false, bPlayer: false, wChair: false, bChair: false,
      under: g2 => { if (mated) { ledGlow(g2, B, 'a3', RED, t, mateL); spread(g2, B, 'a3', t, mateL, RED); } },
      over: g2 => trails(g2, SV, 42, r.k + (r.u < 1 ? 0 : 1), r.pieces, ['k1'], [GOLD], { lw: 8, a: 0.9 }) }, { bg: false });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t >= entT && t < mateL) badge(g, 'g8 → a3', W / 2, 230, { color: GOLD, size: 56, ...pop(t, entT) });
    if (t >= mateL) stamp(g, 'CHECKMATE', W / 2, 300, t, mateL, { color: RED, size: 90 });
  } });
  cue(huntA - 0.06, 'whoosh_deep', 0.3); HU.forEach((a, i) => cue(a + HD - 0.03, 'piece', i % 2 ? 0.2 : 0.3));
  cue(mateL - 0.004, 'boom', 0.75); cue(mateL, 'stamp', 0.55); cue(mateL + 0.05, 'dun_dun', 0.3);

  // ======================= WORLD RAPID 2018: the standings on the LED wall, Dubov first, Magnus fifth =======================
  shot(rapA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.3, 26, [4, 5, 14])], [len(sh), K(0.05, 0.28, 24, [4, 5, 14])]], { t });
    hall(g, t, { theme: 'rap', led: 'rap', led2: 'rapM', ledU: seg(t, magT - 0.1, magT + 0.15, lin),
      mid: g2 => tableSet(g2, t, { white: 'x2', black: 'dub', wPlayer: false, wChair: false, pieces: board(CN, 30), eb: t >= titT ? 'triumph' : 'smug',
        clock: { names: ['', 'DUBOV'], cols: [CREAM, DUB_C], l: 41, r: 77, run: 1 } }) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'St Petersburg', 'DECEMBER 2018', { y: 200, t0: 0.1, a: 1 - seg(t, titT - 0.15, titT) });
    if (t >= titT) badge(g, 'WORLD RAPID CHAMPION', W / 2, 230, { color: GOLD, size: 46, ...pop(t, titT) });
  } });
  cue(rapA - 0.06, 'whoosh_fast', 0.3); cue(rapA, 'murmur', 0.2); cue(titT, 'reveal_bell', 0.4); cue(titT + 0.05, 'applause', 0.3); cue(magT, 'ting', 0.3);

  // ======================= AIRTHINGS 2020, ONLINE: 38.Qf4+ Kf6 39.Qxf5#, Magnus out =======================
  const l75 = m1T + 0.1, l76 = outT + 0.12, l77 = cmT + 0.12, a75 = l75 - SLIDE, a76 = l76 - SLIDE, a77 = l77 - SLIDE, PB = l77 + 0.25;
  const m75 = moveOf(AM, 75), m76 = moveOf(AM, 76), m77 = { ...moveOf(AM, 77), label: '39.Qxf5#' };
  const amAt = t => t >= a77 ? piecesAt(AM, 77, slide(t - a77), SLIDE_OPTS) : t >= a76 ? piecesAt(AM, 76, slide(t - a76), SLIDE_OPTS) : t >= a75 ? piecesAt(AM, 75, slide(t - a75), SLIDE_OPTS) : board(AM, 74);
  function mateScene(g, t, { tags = true } = {}) {
    rig(B, t - mateA, [[0, K(0.0, 0.92, 12.5, [4.6, 0, 4.6])], [3.4, K(0.12, 0.98, 11.2, [5.2, 0, 4.8])]], { t, bump: t > l77 && t < l77 + 0.3 ? 1.2 : 0 });
    const mated = t >= l77;
    onlineSet(g, t, { pieces: amAt(t), names: tags ? ['DUBOV', 'CARLSEN'] : null, cols: [DUB_C, MAG_C],
      under: g2 => {
        if (mated) { ledGlow(g2, B, 'f5', RED, t, l77); spread(g2, B, 'f5', t, l77, RED); }
        for (const [m, a] of [[m75, a75], [m76, a76], [m77, a77]]) moveUnder(g2, B, m, t - a, { hold: 0.3 });
      },
      over: g2 => { for (const [m, a] of [[m75, a75], [m76, a76], [m77, a77]]) moveOver(g2, B, m, t - a, { hold: m === m77 ? 3 : 0.3 }); if (tags) impact(g2, 'f5', t, l77); } });
  }
  shot(mateA, (g, lt, t) => mateScene(g, t), { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'Airthings Masters', 'ONLINE · DECEMBER 2020', { y: 200, t0: 0.1, a: 1 - seg(t, outT - 0.15, outT) });
    if (t >= outT && t < l77) badge(g, 'KNOCKED OUT', W / 2, 230, { color: RED, size: 52, ...pop(t, outT) });
    if (t >= l77) stamp(g, 'CHECKMATE', W / 2, 300, t, l77, { color: RED, size: 90 });
  } });
  // ...he played it from home: the camera pulls back out of his monitor
  shot(PB, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); mateScene(feedx, t, { tags: false });
    rig(B, lt, [[0, PANELK], [0.15, PANELK], [len(sh), K(1.3, 0.15, 8.5, [4.4, 2.6, 1.2]), ease.inOut]], { t, shake: 0.3 });
    room(g, t, { screen: monitorScreen(FEED, { names: ['DUBOV', 'CARLSEN'], cols: [DUB_C, MAG_C], title: 'AIRTHINGS MASTERS · ONLINE' }), e: 'triumph' });
  }, { kb: 0 });
  cue(mateA - 0.06, 'whoosh_fast', 0.3); cue(mateA + 0.05, 'notify', 0.3);
  landCue(l75); boom(l75, 0.5); landCue(l76, false, 0.5); cue(l77 - 0.3, 'revswell', 0.6); landCue(l77, true, 0.8); boom(l77, 0.8); cue(l77 + 0.02, 'stamp', 0.5);
  cue(PB + 0.1, 'whoosh_soft', 0.25);

  // ======================= 2021: MAGNUS'S SECOND IN DUBAI, AGAINST NEPOMNIACHTCHI =======================
  const dubSet = (g, t, tab = {}, hl = {}) => hall(g, t, { theme: 'dub', ...hl, mid: g2 => tableSet(g2, t, { white: 'mag', black: 'nepD', pieces: board(CN, 52), loose: capturedAt(CN, 52), ...tab }) });
  const dubYaw = t => lerp(PI + 0.55, 2 * PI - 0.55, ease.inOut(seg(t, agA + 0.1, rusT - 0.05, lin)));
  function dubaiScene(g, t, { tags = true } = {}) {
    // pulled back mid-swing, so both faces stay in the frame as the camera passes the side of the table
    const sw = seg(t, agA + 0.1, rusT - 0.05, lin);
    const k = K(dubYaw(t), 0.2, 12.5 - 0.6 * seg(t, helpA, ianA, lin) + 5 * Math.sin(PI * ease.inOut(sw)), [4, 2.5, 4]);
    rig(B, 0, [[0, k], [1, k]], { t });
    dubSet(g, t, { ew: t >= rusT ? 'smug' : 'focus', eb: 'focus' }, { over: g2 => {
      if (!tags) return;
      tag3(g2, 4, 5.7, -1.4, 'WORLD CHAMPION', MAG_C, seg(t, defA + 0.6, defA + 0.9, lin) * (1 - seg(t, agA + 0.3, agA + 0.5, lin)));
      tag3(g2, 4, 5.7, 9.3, 'RUSSIA', RED, seg(t, rusT, rusT + 0.3, lin));
    } });
  }
  shot(teamA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.32, 0.3, 30, [4, 3, 4])], [len(sh), K(0.4, 0.26, 25, [4, 3, 4])]], { t });
    dubSet(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'Dubai', '2021 · WORLD TITLE MATCH', { y: 200, t0: 0.1 }) });
  const dubScreen = t => { feedx.setTransform(1, 0, 0, 1, 0, 0); dubaiScene(feedx, t); return monitorScreen(FEED, { names: ['CARLSEN', 'NEPO'], cols: [MAG_C, NEP_C], title: 'DUBAI · GAME 6 · LIVE' }); };
  shot(helpA, (g, lt, t, sh) => {
    const scr = dubScreen(t);
    rig(B, lt, [[0, K(PI + 0.55, 0.1, 7.6, [4, 2.8, -1.4])], [len(sh), K(PI + 0.5, 0.1, 7, [4, 2.8, -1.4])]], { t });
    room(g, t, { screen: scr, hotel: true, e: 'focus', over: g2 => tag3(g2, 4, 5.4, -1.4, 'TEAM MAGNUS', MAG_C, seg(t, helpA + 0.1, helpA + 0.4, lin)) });
  }, { trans: 'whip' });
  shot(defA, (g, lt, t, sh) => {
    const scr = dubScreen(t);
    rig(B, lt, [[0, K(0.55, 0.16, 7, [4.3, 2.6, 2])], [0.6, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.6 ? 1 : 0 });
    room(g, t, { screen: scr, hotel: true, e: 'focus' });
  }, { kb: 0 });
  shot(agA, (g, lt, t) => dubaiScene(g, t), { kb: 0 });
  shot(ianA, (g, lt, t) => photoShot(g, lt, PH.nepo, { ...photoKeys, dur: betA - ianA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Ian Nepomniachtchi', 'RUSSIA · CHALLENGER', { y: 200, size: 58, t0: 0.05 }); credit(g, CREDITS.nepo, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(teamA - 0.06, 'whoosh_deep', 0.35); cue(teamA + 0.1, 'murmur', 0.2); cue(helpA - 0.06, 'whoosh_fast', 0.3); cue(helpA + 0.15, 'notify', 0.3);
  cue(defA, 'whoosh_soft', 0.3); cue(agA + 0.1, 'whoosh_soft', 0.25); cue(rusT, 'sting', 0.3); cue(ianA - 0.06, 'whoosh_fast', 0.3);

  // ======================= BACK HOME: "BETRAYAL?" (the map: Dubai → Moscow), TWO YEARS LATER: Samarkand =======================
  const mid = (A, Q, y = 0.8) => [(A[0] + Q[0]) / 2, y, (A[1] + Q[1]) / 2];
  shot(betA, (g, lt, t, sh) => mapSet(g, lt, t, [[0, K(0.05, 0.95, 12, [DXB[0], 0.5, DXB[1]])], [0.7, K(0, 0.88, 15, mid(DXB, MOW))], [len(sh), K(-0.05, 0.85, 11, [MOW[0], 0.6, MOW[1]])]],
    { pins: [[DXB, 1, betA - 5, MAG_C], [MOW, seg(t, accT - 0.3, accT + 0.05, lin), accT + 0.05, RED]], arcs: [[DXB, MOW, seg(t, betA + 0.1, accT - 0.25, lin)]] }),
    { trans: 'whip', hud: (g, lt, t) => {
      if (t < btT) heading(g, 'BACK HOME', 200, seg(lt, 0, 0.15));
      else stamp(g, 'BETRAYAL?', W / 2, 300, t, btT, { color: RED, size: 96 });
    } });
  shot(blzA, (g, lt, t, sh) => mapSet(g, lt, t, [[0, K(-0.05, 0.85, 11, [MOW[0], 0.6, MOW[1]])], [0.5, K(0, 0.85, 14, mid(MOW, SKD))], [len(sh), K(0.05, 0.85, 10, [SKD[0], 0.6, SKD[1]])]],
    { pins: [[DXB, 1, betA - 5, MAG_C], [MOW, 1, accT + 0.05, RED], [SKD, seg(t, blzA + 0.65, blzA + 0.95, lin), blzA + 0.95, TEAL]], arcs: [[MOW, SKD, seg(t, blzA + 0.05, blzA + 0.7, lin)]] }),
    { hud: (g, lt, t) => { if (lt < 0.75) heading(g, 'TWO YEARS LATER', 200, seg(lt, 0, 0.15)); else placeStamp(g, lt, 'Samarkand', 'DECEMBER 2023', { y: 200, t0: 0.75 }); } });
  cue(betA - 0.06, 'whoosh_fast', 0.3); cue(betA + 0.1, 'whoosh_soft', 0.25); boom(accT + 0.05, 0.45); cue(btT, 'stamp', 0.6); cue(btT + 0.05, 'dun_dun', 0.35);
  cue(blzA + 0.05, 'whoosh_soft', 0.25); boom(blzA + 0.95, 0.45);

  // ======================= WORLD BLITZ: the round on the LED wall; his opponent, Nepomniachtchi =======================
  shot(wbA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.4, 42, [4, 2, 6], { fov: 1250 })], [len(sh), K(-0.18, 0.2, 26, [4, 4, 10])]], { t });
    samSet(g, t, { pieces: board(KN, 0), clock: clockAt(0, { run: 0 }), ew: 'focus', eb: 'focus' }, { led: 'samR' });
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, 'WORLD BLITZ', W / 2, 230, { color: TEAL, size: 52, ...pop(t, wbA + 0.1) }) });
  shot(oppA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.35, 0.2, 12.5, [4, 2.6, 6.4])], [len(sh), K(-PI / 2 + 0.42, 0.18, 11.2, [4, 2.7, 6.8])]], { t });
    samSet(g, t, { pieces: board(KN, 0), clock: clockAt(0, { run: 0 }), ew: 'smug', eb: t >= nepT ? 'smug' : 'focus',
      over: g2 => tag3(g2, 4, 5.6, 9.3, 'NEPOMNIACHTCHI', NEP_C, seg(t, nepT, nepT + 0.3, lin)) }, { led: 'samR' });
  }, { trans: 'whip' });
  cue(wbA - 0.06, 'whoosh_deep', 0.35); cue(wbA + 0.1, 'murmur', 0.25); cue(oppA - 0.06, 'whoosh_fast', 0.3); cue(nepT, 'sting', 0.3);

  // ======================= THE DANCE: only knights; twelve moves later every piece is home; a draw in 42 seconds =======================
  const DA = [dncA + 0.12, dncA + 0.6];
  shot(dncA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.7, 0.4, 14, [4, 1.5, 3.5])], [len(sh), K(PI + 0.62, 0.42, 13, [4, 1.4, 3.6])]], { t });
    const r = hopAt(KN, 0, DA, t, 0.3);
    samSet(g, t, { pieces: r.pieces, clock: clockAt(r.k), ew: 'smug', eb: 'smug',
      wReach: { sq: 'f3', u: seg(t, DA[0] - 0.3, DA[0] + 0.6, lin) }, wSide: 1, bReach: { sq: 'f6', u: seg(t, DA[1] - 0.3, DA[1] + 0.6, lin) },
      under: g2 => { if (r.m) moveUnder(g2, B, r.m, r.lt, { dur: 0.3, hold: 0.3 }); }, over: g2 => { if (r.m) moveOver(g2, B, r.m, r.lt, { dur: 0.3, hold: 0.3 }); } }, { led: 'samR' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= knT) badge(g, 'ONLY KNIGHTS', W / 2, 230, { color: GOLD, size: 56, ...pop(t, knT) }); } });
  DA.forEach(a => landCue(a + 0.3, false, 0.6));
  const TD = 0.09, TA = [...Array(22)].map((_, i) => twA + 0.1 + i * 0.093), lastL = TA[21] + TD;
  shot(twA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 1.28, 13.5, [4, 0, 4])], [len(sh), K(0.2, 1.34, 12.2, [4, 0, 4])]], { t, bump: t > homeT && t < homeT + 0.3 ? 1 : 0 });
    const r = hopAt(KN, 2, TA, t, TD), home = seg(t, homeT, homeT + 0.25, lin);
    samSet(g, t, { pieces: halos(r.pieces, KNIGHTS, GOLD, home), clock: clockAt(r.k), wPlayer: false, bPlayer: false, wChair: false, bChair: false,
      under: g2 => { if (t >= homeT) for (const sq of ['b1', 'g1', 'b8', 'g8']) ledGlow(g2, B, sq, GOLD, t, homeT); },
      over: g2 => trails(g2, KN, 0, r.k + (r.u < 1 ? 0 : 1), r.pieces, KNIGHTS, KCOLS, { a: 0.8 * (1 - 0.6 * home) }) }, { led: 'samR', bg: false });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    const k = 2 + TA.filter(a => t >= a + TD).length;
    if (t < homeT) badge(g, `MOVE ${Math.ceil(k / 2)}`, W / 2, 230, { color: CREAM, size: 52 });
    else badge(g, 'BACK HOME', W / 2, 230, { color: GOLD, size: 60, ...pop(t, homeT) });
  } });
  cue(twA - 0.06, 'whoosh_deep', 0.3); TA.forEach((a, i) => cue(a + TD - 0.03, 'piece', i % 2 ? 0.22 : 0.3));
  cue(homeT - 0.004, 'boom', 0.7); cue(homeT + 0.02, 'reveal_bell', 0.4);
  // 13.Nf3, the handshake, ½–½ on the clock and on the wall
  const a25 = drawA + 0.02, l25 = a25 + 0.28, HS = l25 + 0.15;
  shot(drawA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.32, 0.2, 10.5, [7.6, 1.2, 4])], [len(sh), K(PI / 2 + 0.4, 0.18, 9.6, [7.6, 1.3, 4])]], { t });
    const r = hopAt(KN, 24, [a25], t, 0.28), drawn = t >= HS + 0.4;
    samSet(g, t, { pieces: r.pieces, ew: drawn ? 'smug' : 'focus', eb: drawn ? 'smug' : 'focus',
      wReach: t < HS ? { sq: 'f3', u: seg(t, a25 - 0.3, a25 + 0.55, lin) } : null, wSide: 1,
      clock: drawn ? { ...SAM_CLK, result: '½ – ½' } : clockAt(25), arms: g2 => { if (t >= HS) handshake(g2, t, seg(t, HS, HS + 0.35, lin), HS + 0.35); } },
      { led: 'samR', led2: 'samD', ledU: seg(t, HS + 0.3, HS + 0.6, lin) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= ftT) badge(g, '42 SECONDS', W / 2, 230, { color: GOLD, size: 60, ...pop(t, ftT) }); } });
  cue(drawA - 0.06, 'whoosh_fast', 0.3); landCue(l25, false, 0.6); cue(HS + 0.3, 'fabric', 0.4); cue(HS + 0.45, 'clock_press', 0.4); cue(ftT, 'ting', 0.35); cue(ftT + 0.1, 'murmur', 0.35);

  // ======================= A PROTEST: from the table to the organizers' desk =======================
  const DRAWN = { ...SAM_CLK, result: '½ – ½' };
  shot(proA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.45, 0.34, 15.5, [4, 2.2, 4.5])], [orgT - proA - 0.1, K(0.2, 0.2, 21, [-7.5, 1.2, 14.5]), ease.inOut], [len(sh), K(0.18, 0.19, 19.5, [-8, 1.2, 15])]], { t });
    samSet(g, t, { pieces: board(KN, 25), clock: DRAWN, ew: 'smug', eb: 'smug' }, { led: 'samD', bg: false, desk: { e: 'focus', glow: seg(t, orgT, orgT + 0.2, lin) } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= prT) badge(g, 'PROTEST', W / 2, 230, { color: RED, size: 60, ...pop(t, prT) });
    if (t >= orgT) badge(g, 'AGAINST THE ORGANIZERS', W / 2, 330, { color: CREAM, size: 38, ...pop(t, orgT) });
  } });
  cue(proA - 0.06, 'whoosh_fast', 0.3); cue(prT, 'stamp', 0.45); cue(orgT, 'sting', 0.35);

  // ======================= ZERO POINTS. FOR BOTH. =======================
  shot(zeroA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.1, 10.5, [ARBX, 3.3, ARBZ])], [len(sh), K(-0.26, 0.09, 9.2, [ARBX, 3.4, ARBZ])]], { t, bump: t > zT && t < zT + 0.3 ? 1 : 0 });
    samSet(g, t, { pieces: board(KN, 25), clock: DRAWN, ew: 'smug', eb: 'smug' }, { led: 'samD', led2: 'sam0', ledU: seg(t, zT - 0.05, zT + 0.15, lin), desk: { e: t >= zT ? 'angry' : 'focus', qa: true } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= zT) stamp(g, 'ZERO', W / 2, 300, t, zT, { color: RED, size: 110 }); } });
  shot(bothA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.06, 0.3, 23, [4, 2.8, 4])], [len(sh), K(-PI / 2 + 0.1, 0.28, 22, [4, 2.8, 4])]], { t });
    const u = seg(t, bothA + 0.1, bothA + 0.35, lin);
    samSet(g, t, { pieces: board(KN, 25), clock: { ...SAM_CLK, result: '0 – 0' }, ew: 'shock', eb: 'shock',
      over: g2 => { tag3(g2, 4, 5.6, -1.4, '0', RED, u); tag3(g2, 4, 5.6, 9.3, '0', RED, u); } }, { led: 'sam0' });
  }, { trans: 'whip' });
  cue(zeroA - 0.06, 'whoosh_fast', 0.3); cue(zT - 0.004, 'boom', 0.75); cue(zT, 'gavel', 0.6); cue(zT + 0.05, 'stamp', 0.45);
  cue(bothA - 0.06, 'whoosh_fast', 0.3); cue(bothA + 0.15, 'gasp', 0.4);

  // ======================= WHAT IT COST: the final standings; without the zero, tied with Magnus =======================
  shot(costA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.13, 26, [4, 4.6, 14])], [len(sh), K(-0.02, 0.11, 23, [4, 4.6, 14])]], { t });
    samSet(g, t, { pieces: board(KN, 0), wPlayer: false, bPlayer: false, clock: { ...SAM_CLK, result: '0 – 0' } },
      { led: 'stand', led2: 'standT', ledU: seg(t, tiedT - 0.1, tiedT + 0.2, lin), cone: 0.05 });
  }, { trans: 'whip' });
  cue(costA - 0.06, 'whoosh_deep', 0.3); cue(tiedT, 'reveal_bell', 0.4); cue(tiedT + 0.05, 'shimmer', 0.3);

  // ======================= ELEVEN DAYS LATER, ONLINE: THE KNIGHT DANCE AGAIN, AND DUBOV WON THE TOURNAMENT =======================
  const OA = [...Array(8)].map((_, i) => danA + 0.15 + i * 0.22);
  function onlineDance(g, t, { tags = true } = {}) {
    rig(B, t - danA, [[0, K(0.0, 1.0, 12.5, [4, 0, 4])], [2.4, K(0.12, 1.05, 11.4, [4, 0, 4])]], { t });
    const r = hopAt(KN, 0, OA, t, 0.18);
    onlineSet(g, t, { pieces: r.pieces, names: tags ? ['DUBOV', 'NEPO'] : null, cols: [DUB_C, NEP_C],
      over: g2 => trails(g2, KN, 0, r.k + (r.u < 1 ? 0 : 1), r.pieces, KNIGHTS, KCOLS, { a: 0.75 }) });
  }
  const onScreen = t => { feedx.setTransform(1, 0, 0, 1, 0, 0); onlineDance(feedx, t, { tags: false }); return monitorScreen(FEED, { names: ['DUBOV', 'NEPO'], cols: [DUB_C, NEP_C], title: 'TITLED TUESDAY · ONLINE' }); };
  shot(agnA, (g, lt, t, sh) => {
    const scr = onScreen(t);
    rig(B, lt, [[0, K(PI + 0.55, 0.12, 7.8, [4, 2.7, -1.4])], [len(sh), K(PI + 0.48, 0.1, 6.9, [4, 2.8, -1.4])]], { t });
    room(g, t, { screen: scr, e: 'smug' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t < onT) heading(g, 'ELEVEN DAYS LATER', 200, seg(lt, 0, 0.15)); else placeStamp(g, lt, 'Online', 'JANUARY 9, 2024', { y: 200, t0: onT - (t - lt) }); } });
  shot(danA, (g, lt, t, sh) => {
    const scr = onScreen(t);
    rig(B, lt, [[0, K(0.5, 0.15, 6.8, [4.2, 2.6, 2])], [0.6, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.6 ? 1 : 0 });
    room(g, t, { screen: scr, e: 'smug' });
  }, { kb: 0 });
  shot(FA, (g, lt, t) => onlineDance(g, t), { kb: 0, hud: (g, lt, t) => { if (t >= againT) badge(g, 'AGAIN', W / 2, 230, { color: GOLD, size: 64, ...pop(t, againT) }); } });
  shot(wonA, (g, lt, t, sh) => {
    const scr = onScreen(t);
    rig(B, lt, [[0, K(PI + 0.72, 0.06, 6.4, [4, 2.9, -1.4])], [len(sh), K(PI + 0.66, 0.05, 5.6, [4, 3, -1.4])]], { t });
    room(g, t, { screen: scr, e: t >= wonT ? 'triumph' : 'smug' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= wonT) badge(g, '1ST PLACE', W / 2, 230, { color: GOLD, size: 60, sub: 'TITLED TUESDAY · JAN 9, 2024', ...pop(t, wonT) }); } });
  cue(agnA - 0.06, 'whoosh_fast', 0.3); cue(onT, 'notify', 0.35); cue(danA, 'whoosh_soft', 0.3);
  OA.forEach(a => cue(a + 0.15, 'piece', 0.3)); cue(againT, 'sting', 0.35); cue(wonA - 0.06, 'whoosh_fast', 0.3);
  cue(wonT, 'reveal_bell', 0.45); cue(wonT + 0.05, 'success', 0.35);

  // ======================= CTA: the Samarkand hall again, empty; the knights still dancing on their own =======================
  const CA = [...Array(12)].map((_, i) => ctaA + 0.3 + i * 0.45);
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.4, 0.34, 12, [4, 1.5, 4])], [len(sh), K(PI - 1.0, 0.42, 34, [4, 4, 4])]], { t });
    const r = hopAt(KN, 0, CA, t, 0.3);
    samSet(g, t, { pieces: r.pieces, wPlayer: false, bPlayer: false, clock: clockAt(r.k),
      over: g2 => trails(g2, KN, 0, r.k + (r.u < 1 ? 0 : 1), r.pieces, KNIGHTS, KCOLS, { a: 0.6 }) }, { led: 'cta', cone: 0.05 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'NEW TAL OR TROLL?', W / 2, 230, { color: GOLD, size: 46, ...pop(t, ctaA + 0.1) });
    badge(g, 'RATE HIM 1–10', W / 2, 330, { color: TEAL, size: 40, a: seg(t, rateT, rateT + 0.1), ...pop(t, rateT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, tenT, tenT + 0.1) });
  } });
  cue(ctaA - 0.06, 'whoosh_fast', 0.3); CA.forEach(a => cue(a + 0.3, 'piece', 0.18)); cue(rateT, 'sparkle_pop', 0.3); cue(tenT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: whoA, m: 'intrigue' }, { t: rookA, m: 'tension' }, { t: l43, m: 'slam' }, { t: huntA, m: 'build' }, { t: rapA, m: 'victory' },
    { t: mateA, m: 'digital' }, { t: teamA, m: 'coldwar' }, { t: betA, m: 'paranoia' }, { t: blzA, m: 'build' }, { t: dncA, m: 'clockwork' },
    { t: proA, m: 'tension' }, { t: zeroA, m: 'void' }, { t: costA, m: 'elegy' }, { t: agnA, m: 'digital' }, { t: wonA, m: 'victory' }, { t: ctaA, m: 'hook' },
    { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: l43 - 0.45, t1: l43 - 0.01, kind: 'mute' }, { t0: l43, t1: huntA - 0.05, kind: 'boost', db: 6 },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
