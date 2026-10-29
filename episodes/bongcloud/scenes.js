// The double Bongcloud: Magnus Carlsen Invitational, 15 March 2021, last round of the prelims, Carlsen–Nakamura 1.e4 e5
// 2.Ke2 Ke7, kings back and out, a draw by repetition. The hook is the moment itself (both kings walk out, the two
// webcams over the board); then why the Bongcloud is the worst opening (no castling, the queen and the bishop blocked),
// Hikaru's 3000 with nothing but the Bongcloud, Magnus crushing Wesley So with 1.f3 2.Kf2 ("that's so humiliating"),
// the game told in full (Magnus at home, Hikaru laughing, Leko on commentary, three times, draw), Magnus's "a little bit
// of fun", Kasparov's "utmost respect to your viewers", who would punish Magnus at his own tournament, and the contrast:
// two years later the knight dance at the World Blitz cost Dubov and Nepomniachtchi zero points. Sources, and what is
// drawn rather than documented: SOURCES.md.
// Rules 42–47 (reference/rausis_v2.md): every phrase is a 3D set (the online board with the webcams, two rooms with a
// monitor, the commentary studio and its LED wall, the Samarkand hall from the Dubov episode); cuts go through the
// monitors; the board of the hook comes back at the end.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE, SKIN2 } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, spread, neon, pieceRing, boardArrow } from '../../engine/js/hifx.js';
import { webcam, ledStrip } from '../../engine/js/witty.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = HI.bad, TEAL = C.accent, CREAM = C.cream, LIME = HI.good;
const PHONE = '#9FD8FF', MAG_C = '#6FB2FF', HIK_C = '#B48CFF', SO_C = '#E9B654', DUB_C = HI.hero, NEP_C = '#E0603F';
// the double Bongcloud (Carlsen White; ply 3 = 2.Ke2, 4 = 2...Ke7, 12 = 6...Ke7), Carlsen–So (Banter Series final 2020,
// round 4.1: ply 1 = 1.f3, 3 = 2.Kf2), the knight game (World Blitz 2023, Dubov White) and the 2021 title match, game 6
// (the far boards of the Samarkand hall)
const BC = await fetch('../engine/data/carlsen_nakamura_mci2021.json').then(r => r.json());
const SO = await fetch('../engine/data/carlsen_so_banter2020.json').then(r => r.json());
const KN = await fetch('../engine/data/dubov_nepo_blitz2023.json').then(r => r.json());
const CN = await fetch('../engine/data/carlsen_nepo_2021_g6.json').then(r => r.json());
const PH = {
  so: await loadPhoto3d('../episodes/bongcloud/photos/so2023'),
  kas: await loadPhoto3d('../episodes/bongcloud/photos/kasparov2019'),
};
const CREDITS = {
  so: 'Photo: Frans Peeters, CC BY-SA 2.0',
  kas: 'Photo: Mykola Swarnyk, CC BY-SA 3.0',
};

// ---------- cast: Magnus in 2021 (short hair, no beard), Hikaru in his grey hoodie, Peter Leko and Tania Sachdev at the
// commentary desk, and for the World Blitz beat the cast of the Dubov episode (Dubov, Nepomniachtchi, the arbiter, the
// players at the far tables) ----------
const TAN = { base: '#B98260', shade: '#A06C4C', deep: '#7E5038', blush: '#B86A5C', hi: '#CE9A78' };
CAST.mag = { ...CAST.magnusNY, hair: 'magnus', beard: null };
CAST.hik = { ...CAST.hikaru };
CAST.leko = { face: [1.0, 1.0, 0.95], hair: 'swept', hairC: '#5A4232', brow: '#4A3426', suit: '#2A2F3A', suitD: '#1C2028', shirt: 'open', ears: 1.02 };
CAST.tania = { face: [0.9, 1.05, 0.82], hair: 'longcurly', hairC: '#1A1210', brow: '#1A1210', suit: '#8E2F45', suitD: '#62202F', shirt: 'tee', female: true, ears: 0.9, skin: TAN };
CAST.dub = { face: [0.88, 1.12, 0.8], hair: 'quiff', hairC: '#A07A52', brow: '#7A5A3A', suit: '#5E5A54', suitD: '#3A3734', shirt: 'tee', ears: 1.04 };
CAST.nepD = { ...CAST.nepo };
CAST.arb = { ...CAST.arbiter };
[['slick', '#2A2420', '#3A3F48', 'tee'], ['swept', '#5A4030', '#262B36', 'open'], ['messy', '#1E1A16', '#4A4440', 'open'], ['receding', '#6E665C', '#2C3038', 'tie'],
  ['fringe', '#3A2A1E', '#3E4A5A', 'tee'], ['curly', '#2A1E16', '#22262E', 'open'], ['parted', '#7A5A3A', '#4A3E36', 'tie'], ['wavy', '#14100E', '#30343C', 'open']]
  .forEach(([hair, hairC, suit, shirt], i) => { CAST['x' + i] = { face: [0.92 + (i % 3) * 0.04, 1.04 + (i % 2) * 0.05, 0.86], hair, hairC, brow: mix(hairC, '#000000', 0.2), suit, suitD: mix(suit, '#000000', 0.35), shirt, tie: '#3A2A2E', ears: 1.02, glasses: i === 3 }; });
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });
// laughing: the happy face with the mouth open, the head bouncing
const LAUGH = { ...EXPR.happy, open: 0.85, curve: 1, lid: 0.55, nod: 1, blush: 0.8 };
// the hifx rings and arrows on the board B
const pieceRingAt = (g, sq, c, u) => pieceRing(g, B, sq, c, 1, u), arrow3 = (g, a, b, al, u) => boardArrow(g, B, a, b, al, u);
// ---------- shared with the Dubov episode (episodes/dubov/scenes.js): screen helpers, the 3D toolkit, people ----------
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

// the cover: a white line over a big yellow one and the "??" mark
function coverTitle(g, l1, l2, y, { a = 1, icon = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#120C24';
  g.font = sans(70, 900); g.lineWidth = 16; g.strokeText(l1, W / 2, y); g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  g.font = sans(124, 900); const tw = g.measureText(l2).width, r = 50, gap = 26, x0 = W / 2 - (tw + gap + 2 * r) / 2 + tw / 2, y2 = y + 132;
  g.lineWidth = 20; g.strokeText(l2, x0, y2); g.fillStyle = '#FFD43B'; g.fillText(l2, x0, y2);
  g.restore();
  blunderIcon(g, x0 + tw / 2 + gap + r, y2 - 44, r, icon * a);
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

// ---------- the playing hall of the World Blitz 2023 in Samarkand (from the Dubov episode): a long dark floor with rows
// of tables, drapes at the ends, a back wall at each end with the event's banner, an LED wall behind the stage table at
// each end (z 21 behind Black, z -13 behind White), the arbiters' desk behind Black on the left ----------
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
const LEDC = { sam: TEAL, samD: GOLD, sam0: RED };
const LEDBASE = { sam: '#127A6E' };
function ledTex(mode) {
  return once('led:' + mode, 1280, 720, (x, w, h) => {
    const base = mode === 'sam0' ? '#8A1E1A' : LEDBASE[mode.slice(0, 3)] || LEDBASE.sam;
    const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7); gr.addColorStop(0, mix(base, '#000000', 0.55)); gr.addColorStop(1, mix(base, '#000000', 0.9));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (text, y, size, col, sp = 8, weight = 900, maxW = 860) => { x.letterSpacing = `${sp}px`; fitFont(x, text, size, maxW, weight); x.fillStyle = col; x.fillText(text, w / 2, y); };
    const res = (score, sub, col) => {
      x.shadowColor = col; x.shadowBlur = 40; line(score, h * 0.42, 220, col, 8); x.shadowBlur = 0;
      line(sub, h * 0.78, 50, CREAM, 10);
    };
    if (mode === 'sam') {
      line('WORLD BLITZ', h * 0.3, 130, CREAM, 10); line('CHAMPIONSHIP', h * 0.47, 60, 'rgba(244,239,230,0.8)', 18, 800);
      line('SAMARKAND', h * 0.67, 76, TEAL, 14); line('UZBEKISTAN · DECEMBER 2023', h * 0.83, 34, 'rgba(244,239,230,0.65)', 8, 800);
    }
    else if (mode === 'samD') res('½ – ½', 'A DRAW IN 42 SECONDS', GOLD);
    else if (mode === 'sam0') res('0 – 0', 'ZERO POINTS FOR BOTH', RED);
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
const BGX = [-32, -16, 16, 32], BGG = [[CN, 24], [CN, 36], [CN, 46], [CN, 52]];
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
const THEME = { sam: { led: 'sam', carpet: TEAL, banner: 'WORLD BLITZ CHAMPIONSHIP · SAMARKAND 2023', bg: true } };
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

// ---------- the "??" mark (the blunder twin of the brilliant "!!"): a red disc with two question marks, popping in ----------
function blunderIcon(g, x, y, r, a = 1) {
  if (a <= 0) return;
  const k = ease.back(clamp(a * 1.6)), al = clamp(a * 3);
  g.save(); g.globalAlpha *= al; g.translate(x, y); g.scale(k, k);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(r * 0.08, r * 0.14, r * 1.04, 0, 7); g.fill();
  g.fillStyle = '#9A1E18'; g.beginPath(); g.arc(0, 0, r * 1.06, 0, 7); g.fill();
  const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#FF6A55'); gr.addColorStop(1, '#D9302A');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 0.92, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = sans(Math.round(r * 1.05), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '0px';
  g.fillText('??', 0, r * 0.06);
  g.restore();
}
// a "??" over a world point (the king on e2)
function blunder3(g, x, y, z, u) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z); blunderIcon(g, p.x, p.y, clamp(p.s * 0.42, 34, 70), u);
}
// the bong cloud: soft grey puffs rising round a piece (u: 0..1 how far it has grown)
function bongCloud(g, x, z, t, u, { a = 0.55, seed = 3 } = {}) {
  if (u <= 0) return;
  const r = rng(seed);
  const puffs = [...Array(14)].map((_, i) => {
    const ang = r() * 6.28, rad = 0.25 + r() * 0.75, h = 0.25 + r() * 1.6, sp = 0.6 + r() * 0.8;
    const rise = (t * 0.25 * sp + r()) % 1;
    return [x + Math.cos(ang + t * 0.3) * rad * (0.6 + 0.6 * u), h + rise * 0.9, z + Math.sin(ang + t * 0.3) * rad * (0.6 + 0.6 * u), (0.32 + r() * 0.3) * (0.5 + 0.5 * u), 1 - rise];
  }).filter(q => depth(q[0], q[1], q[2]) > 0.8).sort((p, q) => depth(q[0], q[1], q[2]) - depth(p[0], p[1], p[2]));
  g.save();
  for (const [px, py, pz, pr, fade] of puffs) {
    const p = B.project(px, py, pz), R = p.s * pr, gr = g.createRadialGradient(p.x - R * 0.25, p.y - R * 0.3, R * 0.1, p.x, p.y, R);
    gr.addColorStop(0, `rgba(236,240,246,${(a * u * fade).toFixed(3)})`); gr.addColorStop(0.6, `rgba(190,198,210,${(a * 0.6 * u * fade).toFixed(3)})`); gr.addColorStop(1, 'rgba(160,170,184,0)');
    g.fillStyle = gr; g.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  }
  g.restore();
}

// ---------- webcams as screens in the world: a webcam frame drawn on its own canvas each frame, then mapped onto a
// standing panel with a dark bezel and a glow on what is under it ----------
const CAMC = { mag: makeCanvas(600, 720), hik: makeCanvas(600, 720) };
const CAMLOOK = {
  mag: { bg: ['#3F7FD8', '#14325E'], name: 'MAGNUS CARLSEN', nameColor: MAG_C, glow: '#7FB8FF' },
  hik: { bg: ['#7A5AD0', '#2A1E5A'], name: 'HIKARU NAKAMURA', nameColor: '#CDB6FF', glow: '#B89CFF' },
};
function camTex(who, e, t, { shake = 0, zoom = 1 } = {}) {
  const c = CAMC[who], x = c.getContext('2d'), L = CAMLOOK[who];
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 600, 720);
  webcam(x, 0, 0, 600, 720, who, e, t, { bg: L.bg, name: L.name, nameColor: L.nameColor, zoom: 1.05 * zoom, cy: 0.5, shake });
  return c;
}
// a panel of half width hw and half height hh centred at c, turned by yaw ry about the vertical (0: facing -z)
function camPanel(g, img, c, hw, hh, ry = 0, { glow = null, a = 1 } = {}) {
  if (a <= 0) return;
  const R = [Math.cos(ry), 0, -Math.sin(ry)], P = (u, v, d = 0) => [c[0] + R[0] * u - Math.sin(ry) * d, c[1] + v, c[2] + R[2] * u - Math.cos(ry) * d];
  const nrm = [-Math.sin(ry), 0, -Math.cos(ry)], toE = vsub(B.E, c);
  g.save(); g.globalAlpha *= a;
  if (glow) pool(g, B, c[0], -0.38, c[2] - 3.5, 7, glow, 0.16);
  obox(g, P(0, 0, -0.12), [hw + 0.14, hh + 0.14, 0.1], '#0A0C10', { ry }, { spec: 0.3 });
  if (vdot(nrm, toE) > 0) texQuad(g, img, P(-hw, hh, 0.03), P(hw, hh, 0.03), P(-hw, -hh, 0.03));
  g.restore();
}

// ---------- the online stage: the board alone in a night-blue digital space (a grid far under it, warm light on the
// board, blue rays), the two webcams standing behind Black's side, Magnus left and Hikaru right ----------
const CAMPOS = { mag: [[0.6, 4.6, 11.2], 0.16], hik: [[7.4, 4.6, 11.2], -0.16] };
function onlineStage(g, t, { pieces, under = null, over = null, cams = null, names = null, nameU = 1, camA = 1 } = {}) {
  const gr = g.createRadialGradient(W / 2, H * 0.36, 60, W / 2, H * 0.42, H * 0.85);
  gr.addColorStop(0, '#22407A'); gr.addColorStop(0.55, '#0B1530'); gr.addColorStop(1, '#03060E');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = rgba(PHONE, 0.09); g.lineWidth = 2; g.beginPath();
  for (let i = -24; i <= 32; i += 2) { line3(g, [i, -3, -24], [i, -3, 36]); line3(g, [-24, -3, i], [32, -3, i]); }
  g.stroke(); g.restore();
  spotCone(g, B, { top: [-2, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.06, dust: 18, t, seed: 4, color: '#9FC8FF' });
  spotCone(g, B, { top: [10, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.05, dust: 14, t, seed: 9, color: '#FFE2B0' });
  const camsDraw = () => {
    if (!cams || camA <= 0) return;
    for (const who of ['mag', 'hik']) {
      const [c, ry] = CAMPOS[who], o = cams[who] || {};
      camPanel(g, camTex(who, o.e || 'neutral', t, o), c, 2.5, 3.0, ry, { glow: CAMLOOK[who].glow, a: camA });
    }
  };
  if (B.E[2] < 11) camsDraw();
  pool(g, B, 4, -0.4, 4, 10, '#FFE2B8', 0.16);
  B.drawSlab(g, SLATE);
  if (under) under(g);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 });
  if (over) over(g);
  if (B.E[2] >= 11) camsDraw();
  if (names) { tag3(g, 4, 0.3, 9.0, names[1], CAMLOOK.hik.nameColor, nameU); tag3(g, 4, 0.3, -0.9, names[0], MAG_C, nameU); }
  lowKey(g, { cy: H * 0.46, a: 0.22 });
}
// a plain online board (no webcams): another game, other names at its ends
function onlineSet(g, t, { pieces, under = null, over = null, names = null, cols = [MAG_C, SO_C], nameU = 1, panel = null } = {}) {
  const gr = g.createRadialGradient(W / 2, H * 0.48, 60, W / 2, H * 0.48, H * 0.75); gr.addColorStop(0, '#10233A'); gr.addColorStop(1, '#03060B');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = rgba(PHONE, 0.08); g.lineWidth = 2; g.beginPath();
  for (let i = -24; i <= 32; i += 2) { line3(g, [i, -3, -24], [i, -3, 32]); line3(g, [-24, -3, i], [32, -3, i]); }
  g.stroke(); g.restore();
  if (panel) panel(g);
  pool(g, B, 4, -0.4, 4, 10, PHONE, 0.12);
  B.drawSlab(g, SLATE);
  if (under) under(g);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 });
  if (over) over(g);
  if (names) { tag3(g, 4, 0.3, 9.0, names[1], cols[1], nameU); tag3(g, 4, 0.3, -0.9, names[0], cols[0], nameU); }
  lowKey(g, { cy: H * 0.48, a: 0.3 });
}
// a flat LED board standing behind the far side of the online board: the rating of Hikaru's new account
function ratingTex(r, games) {
  return once(`rate:${r}:${games}`, 1024, 560, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#20184A'); gr.addColorStop(1, '#0C0A1E'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = sans(40, 800); x.letterSpacing = '10px'; x.fillStyle = 'rgba(244,239,230,0.8)'; x.fillText('NEW ACCOUNT · BONGCLOUD ONLY', w / 2, 70);
    const top = r >= 3000;
    x.font = sans(240, 900); x.letterSpacing = '6px'; x.fillStyle = top ? GOLD : CREAM; x.shadowColor = top ? GOLD : HIK_C; x.shadowBlur = top ? 50 : 24;
    x.fillText(String(r), w / 2, 290); x.shadowBlur = 0;
    x.font = sans(38, 800); x.letterSpacing = '8px'; x.fillStyle = top ? GOLD : 'rgba(244,239,230,0.6)'; x.fillText(top ? 'BLITZ RATING · 3000' : `BLITZ RATING · GAME ${games}`, w / 2, 470);
    ledGrid(x, w, h, 6);
  });
}
function ratingPanel(g, r, games) { obox(g, [4, 5.8, 12.2], [5.3, 3.0, 0.15], '#0A0C10', {}, { spec: 0.2 }); texQuad(g, ratingTex(r, games), [-1.1, 8.6, 12.0], [9.1, 8.6, 12.0], [-1.1, 3.0, 12.0]); pool(g, B, 4, -0.4, 9, 6, HIK_C, 0.16); }

// ---------- a room at night with a desk and a monitor: Magnus at home (warm, a city window) or Hikaru's stream room
// (dark violet, LED strips). The monitor's screen (16:9) holds a window as tall as it with a whole frame of another
// scene, 9:16, in the middle: the camera pushes into it, or pulls back from it ----------
const MON = { x: 4, y: 2.7, z: 3.5, hw: 1.9, hh: 1.07 };
const MONC = makeCanvas(1280, 720), monx = MONC.getContext('2d');
function monitorScreen(feed, { names = ['CARLSEN', 'NAKAMURA'], cols = [MAG_C, HIK_C], title = 'MAGNUS CARLSEN INVITATIONAL · LIVE' } = {}) {
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
// Hikaru's wall: dark acoustic tiles with a knight lit in violet
const STREAMWALL = tex(1024, 768, (x, w, h) => {
  x.fillStyle = '#120F22'; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) {
    const gr = x.createLinearGradient(i * 128, j * 128, i * 128 + 128, j * 128 + 128); gr.addColorStop(0, '#1E1A36'); gr.addColorStop(1, '#141128');
    x.fillStyle = gr; x.fillRect(i * 128 + 6, j * 128 + 6, 116, 116);
  }
  x.shadowColor = HIK_C; x.shadowBlur = 40; drawPiece(x, 'n', 'w', w / 2, h * 0.52, 420, {}); x.shadowBlur = 0;
});
const PANELK = { yaw: 0, pitch: 0, dist: 1.672, fov: 1500, cy: H * 0.5, target: [MON.x, MON.y, MON.z] };  // the 9:16 window of the screen fills the frame
function homeRoom(g, t, { screen, who = 'mag', e = 'focus', over = null } = {}) {
  const E = B.E, hik = who === 'hik', wallC = hik ? '#1A1630' : '#2A303C';
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#08090D'); gr.addColorStop(1, '#030305'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) tiled(g, [-8, FLOOR_Y, -9], [24, 0, 0], [0, 0, 19], { color: hik ? '#14111E' : '#3A2A1E', grout: 'rgba(0,0,0,0.3)', tu: hik ? 2 : 0.9, tv: 19 });
  const wall = { color: wallC, grout: 'rgba(0,0,0,0.15)', tu: 24, tv: 20 };
  if (E[2] < 10) tiled(g, [-8, FLOOR_Y, 10], [24, 0, 0], [0, 16, 0], wall);
  if (E[2] > -9) {
    tiled(g, [16, FLOOR_Y, -9], [-24, 0, 0], [0, 16, 0], wall);
    if (hik) { texQuad(g, STREAMWALL, [9, 10.5, -8.95], [-1, 10.5, -8.95], [9, 3, -8.95]); ledStrip(g, B, [16, 11.5, -8.9], [-8, 11.5, -8.9], HIK_C, t); ledStrip(g, B, [16, 1.2, -8.9], [-8, 1.2, -8.9], TEAL, t, { phase: 1 }); }
    else texQuad(g, CITY, [3, 9.5, -8.95], [-5, 9.5, -8.95], [3, 2.5, -8.95]);
  }
  if (E[0] > -8) tiled(g, [-8, FLOOR_Y, -9], [0, 0, 19], [0, 16, 0], wall);
  if (E[0] < 16) tiled(g, [16, FLOOR_Y, 10], [0, 0, -19], [0, 16, 0], wall);
  if (hik) {
    if (E[0] > -8) ledStrip(g, B, [-7.9, 11.5, -9], [-7.9, 11.5, 10], HIK_C, t, { phase: 2 });
    if (E[0] < 16) ledStrip(g, B, [15.9, 11.5, 10], [15.9, 11.5, -9], HIK_C, t, { phase: 3 });
    pool(g, B, 4, 6, -8.9, 12, HIK_C, 0.18, true);
  } else {  // a floor lamp in the corner, its warm pool on the wall
    cylinder(g, [-5.5, FLOOR_Y, 6], [-5.5, 5.4, 6], 0.08, '#2A2A2A', { n: 10 });
    lathe(g, -5.5, 6, [[5.2, 0.9, 0.9], [6.4, 0.55, 0.55]], '#D9C29A', { n: 20, amb: 0.9 });
    pool(g, B, -5.5, 5.8, 9.9, 7, '#FFC98A', 0.22, true); pool(g, B, -7.9, 5.8, 5, 7, '#FFC98A', 0.16, true);
    pool(g, B, -5.5, FLOOR_Y + 0.01, 6, 5, '#FFC98A', 0.1);
  }
  const front = E[2] > -1.4;
  chair(g, B, 4, -1.9, { face: 1, color: hik ? '#2A2240' : CHAIR });
  const monitor = () => {
    cylinder(g, [4, -0.35, 3.9], [4, 1.7, 3.9], 0.14, '#1A1C20', { n: 12 }); ab(g, [3.1, -0.35, 3.5], [4.9, -0.28, 4.3], '#1A1C20');
    ab(g, [MON.x - MON.hw - 0.12, MON.y - MON.hh - 0.12, MON.z], [MON.x + MON.hw + 0.12, MON.y + MON.hh + 0.12, MON.z + 0.22], '#0B0C0F', { spec: 0.3 });
    if (E[2] < MON.z) texQuad(g, screen, [MON.x - MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x + MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x - MON.hw, MON.y - MON.hh, MON.z - 0.01], { under: false });
    pool(g, B, MON.x, MON.y, MON.z - 0.3, 4, PHONE, 0.1, true);
  };
  const desk = () => {
    for (const [x, z] of [[-1.8, -0.4], [9.8, -0.4], [-1.8, 4.4], [9.8, 4.4]]) ab(g, [x - 0.12, FLOOR_Y, z - 0.12], [x + 0.12, -0.75, z + 0.12], '#15171B');
    ab(g, [-2, -0.75, -0.6], [10, -0.35, 4.6], hik ? '#16131F' : '#1E1A16', { spec: 0.2 });
    ab(g, [2.6, -0.35, 0.2], [5.4, -0.28, 1.0], '#16181C', { spec: 0.3 });  // the keyboard, the mouse, a mug (Hikaru: a microphone)
    ab(g, [6.2, -0.35, 0.4], [6.6, -0.25, 0.9], '#16181C', { spec: 0.4 });
    if (hik) { cylinder(g, [0.6, -0.35, 1.4], [0.6, 1.6, 1.4], 0.06, '#1A1A1E', { n: 8 }); cylinder(g, [0.6, 1.6, 1.4], [0.6, 2.6, 1.0], 0.32, '#202024', { n: 16, spec: 0.5 }); }
    else lathe(g, 8.2, 1.6, [[-0.35, 0.28, 0.28], [0.25, 0.3, 0.3]], '#B8443A', { n: 16, spec: 0.3 });
  };
  if (!front) monitor();
  const hb = seated(g, B, who, e, t, { x: 4, z: -1.4, face: 1, side: 1 });
  if (front) {
    const p = B.project(4, 3.1, -1.4); if (depth(4, 3.1, -1.4) > 0.8) rim(g, p.x, p.y, p.s * 1.6, hik ? HIK_C : PHONE, 0.16);  // the screen's light on the face
  }
  desk();
  useSkin(g, who); hb();
  if (front) monitor();
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.18 });
}

// ---------- the commentary studio: a desk with Leko and Sachdev, a glossy floor, and a big LED wall behind them (z 15)
// that shows the live broadcast (the board between the two webcams) or the event's texts ----------
const STUDIO = makeCanvas(1280, 640), stx = STUDIO.getContext('2d');
function liveTex(feed, t, { mag = 'smug', hik = 'neutral', hikShake = 0 } = {}) {
  const x = stx, w = 1280, h = 640;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none';
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#10224A'); gr.addColorStop(1, '#070C1C'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, 0, w, 56);
  x.font = sans(26, 900); x.letterSpacing = '8px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = CREAM; x.fillText('MAGNUS CARLSEN INVITATIONAL · LIVE', w / 2, 29);
  webcam(x, 40, 120, 380, 460, 'mag', mag, t, { bg: CAMLOOK.mag.bg, name: 'CARLSEN', nameColor: MAG_C, zoom: 1.05 });
  webcam(x, 860, 120, 380, 460, 'hik', hik, t, { bg: CAMLOOK.hik.bg, name: 'NAKAMURA', nameColor: CAMLOOK.hik.nameColor, zoom: 1.05, shake: hikShake });
  x.drawImage(feed, 0, 300, 1080, 1320, 455, 80, 370, 452);  // the middle of the board scene
  x.strokeStyle = 'rgba(244,239,230,0.25)'; x.lineWidth = 3; x.strokeRect(455, 80, 370, 452);
  ledGrid(x, w, h, 6);
  return STUDIO;
}
function wallTex(mode) {
  return once('wall:' + mode, 1280, 640, (x, w, h) => {
    const base = mode === 'draw' ? '#7A5A1A' : mode === 'named' ? '#2A4F9A' : '#1E3C7A';
    const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7); gr.addColorStop(0, mix(base, '#000000', 0.45)); gr.addColorStop(1, mix(base, '#000000', 0.88));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (text, y, size, col, sp = 8, weight = 900, maxW = 1100) => { x.letterSpacing = `${sp}px`; fitFont(x, text, size, maxW, weight); x.fillStyle = col; x.fillText(text, w / 2, y); };
    // a close camera sees only the middle ~460 px of the wall: every text is stacked inside it
    const MW = 440;
    if (mode === 'event') {
      line('MAGNUS', h * 0.2, 112, CREAM, 10, 900, MW); line('CARLSEN', h * 0.39, 112, CREAM, 10, 900, MW);
      line('INVITATIONAL', h * 0.57, 62, 'rgba(244,239,230,0.85)', 12, 900, MW);
      line('ONLINE · MARCH 15, 2021', h * 0.77, 34, MAG_C, 6, 800, MW);
    } else if (mode === 'named') {
      x.shadowColor = GOLD; x.shadowBlur = 40; line('MAGNUS', h * 0.16, 124, GOLD, 10, 900, MW); line('CARLSEN', h * 0.36, 124, GOLD, 10, 900, MW); x.shadowBlur = 0;
      line('INVITATIONAL', h * 0.54, 62, 'rgba(244,239,230,0.85)', 12, 900, MW);
    } else if (mode === 'qual') {
      line('LAST ROUND', h * 0.1, 34, 'rgba(244,239,230,0.85)', 10, 800, MW);
      [['CARLSEN', MAG_C], ['NAKAMURA', HIK_C]].forEach(([n, col], k) => {
        const y = 175 + k * 200;
        x.fillStyle = rgba(LIME, 0.16); x.fillRect(w / 2 - 240, y - 80, 480, 170); x.fillStyle = col; x.fillRect(w / 2 - 240, y - 80, 12, 170);
        line(n, y - 20, 72, CREAM, 6, 900, 420); line('QUALIFIED ✓', y + 50, 44, LIME, 6, 900, 420);
      });
    } else if (mode === 'draw') {
      x.shadowColor = GOLD; x.shadowBlur = 40; line('½ – ½', h * 0.4, 200, GOLD, 8, 900, MW); x.shadowBlur = 0;
      line('DRAW BY', h * 0.72, 50, CREAM, 10, 900, MW); line('REPETITION', h * 0.84, 50, CREAM, 10, 900, MW);
    }
    ledGrid(x, w, h, 6);
  });
}
const STUDIODESK = tex(1024, 192, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1A2132'); gr.addColorStop(1, '#0C1018'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = TEAL; x.fillRect(0, 0, w, 6);
  x.font = sans(46, 900); x.letterSpacing = '18px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(244,239,230,0.85)'; x.fillText('LIVE COMMENTARY', w / 2, h / 2 + 4);
});
// wall: a canvas (the live feed) or a text mode; wall2 fades in over it by wallU
function studio(g, t, { wall = 'event', wall2 = null, wallU = 0, feed = null, people = true, leko = 'happy', tania = 'happy', over = null, live = {} } = {}) {
  const E = B.E;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#060912'); gr.addColorStop(1, '#020306'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) tiled(g, [-14, FLOOR_Y, -10], [36, 0, 0], [0, 0, 26], { color: '#0A0D14', grout: 'rgba(120,160,220,0.06)', tu: 2.4 });
  // the LED wall and its frame
  const img = m => m === 'live' ? liveTex(feed, t, live) : wallTex(m);
  if (E[2] < 15) {
    ab(g, [-8.6, FLOOR_Y, 15], [16.6, 12.4, 15.4], '#090B10');
    for (const [m, a] of [[wall, 1], [wall2, wallU]]) if (m && a > 0) texQuad(g, img(m), [-8, 11.8, 14.97], [16, 11.8, 14.97], [-8, -0.2, 14.97], { a, under: a >= 1 });
    pool(g, B, 4, FLOOR_Y + 0.02, 11, 14, (wallU > 0.5 && wall2 === 'draw') || wall === 'draw' ? GOLD : MAG_C, 0.12);
  }
  // the commentators and their desk (hands hidden: their arms rest on the desk)
  const hosts = [['leko', 2.2, leko], ['tania', 6.4, tania]];
  if (people) for (const [who, x, e] of hosts) seated(g, B, who, e, t, { x, z: 9.3, face: -1, hands: false });
  ab(g, [-1.4, FLOOR_Y, 7.4], [9.8, -0.75, 8.9], '#10141C');
  ab(g, [-1.6, -0.75, 7.2], [10.0, -0.45, 9.1], '#1E2533', { spec: 0.35 });
  if (E[2] < 7.2) texQuad(g, STUDIODESK, [-1.4, -0.8, 7.38], [9.8, -0.8, 7.38], [-1.4, FLOOR_Y + 0.4, 7.38]);
  for (const x of [1.6, 5.8]) { ab(g, [x, -0.45, 7.9], [x + 1.4, -0.4, 8.6], '#15181E'); ab(g, [x, -0.4, 8.5], [x + 1.4, 0.5, 8.6], '#15181E'); }  // two laptops
  ledStrip(g, B, [-1.4, -0.78, 7.36], [9.8, -0.78, 7.36], TEAL, t);
  pool(g, B, 4.2, -0.44, 8.2, 6, '#FFE2B8', 0.14);
  spotCone(g, B, { top: [4, 16, 2], base: [4.2, 2.5, 9.3], r0: 0.3, r1: 4.2, a: 0.05, dust: 16, t, seed: 6 });
  if (over) over(g);
  lowKey(g, { cy: H * 0.44, a: 0.24 });
}

// ---------- hops and paths on the board (the knight dance in the zero beat, the king steps) ----------
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
// ======================= THE FILM =======================
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
  // the frame of another scene: its rig() would move the shot's own camera, so the camera (and its motion) is restored after
  const feed = draw => {
    const cam = { yaw: B.yaw, pitch: B.pitch, dist: B.dist, fov: B.f, target: B.T, cx: B.cx, cy: B.cy }, px = CAM.px;
    feedx.setTransform(1, 0, 0, 1, 0, 0); feedx.globalAlpha = 1; draw(feedx);
    B.setCam(cam); CAM.px = px;
    return FEED;
  };
  // a run of moves of one game, each landing at its time, sliding d before it
  const runTo = (plies, k0, lands, t, d = SLIDE) => {
    let i = -1; while (i + 1 < lands.length && t >= lands[i + 1] - d) i++;
    if (i < 0) return { k: k0, pieces: piecesAt(plies, k0), m: null, lt: 0 };
    const a = lands[i] - d, k = k0 + i + 1;
    return { k, pieces: piecesAt(plies, k, slide(t - a, d), SLIDE_OPTS), m: moveOf(plies, k), lt: t - a };
  };
  const moveFx = (r, d = SLIDE, hold = 0.5) => ({
    under: g => { if (r.m) moveUnder(g, B, r.m, r.lt, { dur: d, hold }); },
    over: g => { if (r.m) moveOver(g, B, r.m, r.lt, { dur: d, hold }); },
  });
  const halo = (pieces, ids, col, a) => pieces.map(p => ids.includes(p.id) && a > 0 ? { ...p, halo: col, haloA: a } : p);

  // the cuts, in order (a shot runs to the next one)
  const mvA = w('hook', 'move') - 0.06, kingsT = w('hook', 8) + 0.06, outT = w('hook', 10) + 0.06, sideA = kingsT + 0.42;
  const worstA = s('worst') - 0.05, bcT = w('worst', 'bongcloud'), wsT = w('worst', 'worst');
  const whyA = s('why') - 0.05, kgT = w('why', 'king'), csT = w('why', 'castle'), blkA = w('why', 'blocks') - 0.08, blkT = w('why', 'blocks'), qT = w('why', 'queen'), biT = w('why', 'bishop');
  const hikA = s('hikaru') - 0.05, newA = w('hikaru', 'new') - 0.06, onlyT = w('hikaru', 'only'), scrA = onlyT + 0.35, thrT = w('hikaru', 'three'), thoT = w('hikaru', 'thousand');
  const soA = s('so') - 0.05, crT = w('so', 'crushed'), soT = w('so', 3), verT = w('so', 'version'), phA = w('so', 8) - 0.06, thatT = w('so', "that's"), hmT = w('so', 'humiliating');
  const dateA = s('date') - 0.05, bothA = w('date', 'both') - 0.06, qualT = w('date', 'qualified');
  const playA = s('play') - 0.05, walkA = w('play', 'walks') + 0.1, kOutT = w('play', 'out') + 0.05, hikPA = w('play', 'hikaru') - 0.06, burstT = w('play', 'bursts'),
    hikFA = burstT + 0.55, copA = w('play', 'copies') - 0.2, copT = w('play', 'copies') + 0.1, himT = w('play', 'him');
  const lekoA = s('leko') - 0.05, plA = w('leko', 'please') - 0.06, plT = w('leko', 'please'), tryA = w('leko', 'try') - 0.12;
  const drawA = s('draw') - 0.05, backT = w('draw', 'back'), k2T = w('draw', 2), out2T = w('draw', 'out'), thr2T = w('draw', 'three'), drT = w('draw', 'draw'), topA = thr2T - 0.1;
  const funA = s('fun') - 0.05, justT = w('fun', 'just');
  const kasA = s('kasp') - 0.05, youA = w('kasp', 'you') - 0.06;
  const ownA = s('own') - 0.05, namA = w('own', 'at') - 0.06, mag2T = w('own', 7), invT = w('own', 'invitational');
  const zeroA = s('zero') - 0.05, shufA = w('zero', 'shuffled') - 0.06, knT = w('zero', 'knights'), dzT = w('zero', 'draw'), wbA = w('zero', 'world') - 0.06, zT = w('zero', 'zero'), zbA = w('zero', 'for') - 0.12;
  const ctaA = s('cta') - 0.05, rateT = w('cta', 'rate'), tenT = w('cta', 'ten');

  // ======================= HOOK (rule 42): the two webcams over the board, both kings walk out =======================
  // 1.e4 e5 under the names, then 2.Ke2 on "kings" and 2...Ke7 on "out", each with a BOOM
  const L1 = 0.95, L2 = 1.6, hookAt = t => runTo(BC, 0, [L1, L2, kingsT, outT], t);
  const hookCams = t => ({ mag: { e: t >= kingsT ? 'smug' : 'neutral' }, hik: { e: t >= kingsT + 0.25 ? LAUGH : t >= L2 ? 'neutral' : 'focus', shake: t >= kingsT + 0.25 ? 0.25 : 0 } });
  const hookHud = (g, lt, t) => coverTitle(g, 'MAGNUS VS HIKARU', 'BONGCLOUD', 205, { a: 1 - seg(t, mvA - 0.15, mvA + 0.05, lin) });
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 0.3, 19.5, [4, 3.4, 6.5])], [len(sh), K(0.0, 0.27, 17.5, [4, 3.4, 6.5])]], { t, e: lin });
    const r = hookAt(t);
    onlineStage(g, t, { pieces: r.pieces, cams: hookCams(t), ...moveFx(r) });
  }, { hud: hookHud });
  shot(mvA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 0.42, 11.5, [4.2, 1.2, 4.6])], [len(sh), K(-0.36, 0.38, 10.4, [4.2, 1.3, 4.6])]], { t, bump: t > kingsT && t < kingsT + 0.3 ? 1.3 : 0 });
    const r = hookAt(t), on = seg(t, kingsT, kingsT + 0.2, lin);
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1'], GOLD, on), cams: hookCams(t),
      under: g2 => { moveFx(r).under(g2); if (t >= kingsT) ledGlow(g2, B, 'e2', GOLD, t, kingsT); },
      over: g2 => { moveFx(r).over(g2); impact(g2, 'e2', t, kingsT, { flash: 0.35 }); } });
  }, { trans: 'whip' });
  shot(sideA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.25, 0.3, 11, [4, 1.3, 4.3])], [len(sh), K(PI / 2 + 0.33, 0.27, 10, [4, 1.3, 4.3])]], { t, bump: t > outT && t < outT + 0.3 ? 1.3 : 0 });
    const r = hookAt(t), on = seg(t, outT, outT + 0.2, lin);
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1', 'k1'], GOLD, Math.max(on, 0.7)), cams: hookCams(t),
      under: g2 => { moveFx(r).under(g2); ledGlow(g2, B, 'e2', GOLD, t, kingsT); if (t >= outT) ledGlow(g2, B, 'e7', GOLD, t, outT); },
      over: g2 => { moveFx(r).over(g2); impact(g2, 'e7', t, outT, { flash: 0.35 }); } });
  }, { trans: 'whip' });
  cue(0, 'whoosh_soft', 0.2); landCue(L1, false, 0.45); landCue(L2, false, 0.45);
  cue(mvA - 0.06, 'whoosh_fast', 0.3); cue(kingsT - 0.3, 'revswell', 0.55); boom(kingsT, 0.85); cue(kingsT, 'hit_punch', 0.4); landCue(kingsT, false, 0.6);
  cue(kingsT + 0.3, 'laugh', 0.3); cue(sideA - 0.06, 'whoosh_fast', 0.25); boom(outT, 0.85); landCue(outT, false, 0.6); cue(outT + 0.02, 'reveal_bell', 0.3);

  // ======================= THE BONGCLOUD: a cloud round the king on e2, "??", the worst opening =======================
  const BOUT = board(BC, 4);
  shot(worstA, (g, lt, t, sh) => {
    // the one fly-around of the opening: round the king on e2, low, from the queen's side to the king's side
    const keys = aimKeys(tt => { const a = lerp(-1.05, 0.55, ease.inOut(clamp(tt / 2.9))); return [4.5 + Math.sin(a) * 7.4, 3.3 - tt * 0.15, 1.5 - Math.cos(a) * 7.4]; },
      () => [4.5, 0.9, 1.6], 0, len(sh), { cy: H * 0.52 });
    rig(B, lt, keys, { t, e: lin, bump: t > wsT && t < wsT + 0.3 ? 1 : 0 });
    const cu = seg(t, bcT - 0.1, bcT + 0.6, lin);
    onlineStage(g, t, { pieces: halo(BOUT, ['K1'], RED, seg(t, wsT, wsT + 0.2, lin)), cams: { mag: { e: 'smug' }, hik: { e: LAUGH } },
      under: g2 => { if (t >= wsT) ledGlow(g2, B, 'e2', RED, t, wsT, { reach: 2 }); },
      over: g2 => { bongCloud(g2, 4.5, 1.5, t, cu); blunder3(g2, 4.5, 2.35, 1.5, seg(t, wsT, wsT + 0.3, lin)); } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= bcT) badge(g, 'THE BONGCLOUD', W / 2, 230, { color: TEAL, size: 60, ...pop(t, bcT) });
    if (t >= wsT) stamp(g, 'WORST OPENING', W / 2, 1530, t, wsT, { color: RED, size: 80 });
  } });
  cue(worstA - 0.06, 'whoosh_deep', 0.3); cue(bcT, 'sparkle_pop', 0.3); cue(bcT + 0.05, 'shimmer', 0.25); cue(wsT - 0.004, 'boom', 0.6); cue(wsT, 'stamp', 0.5); cue(wsT + 0.05, 'dun_dun', 0.3);

  // ======================= WHY: no castling; the queen and the bishop blocked =======================
  const ghostK = { id: 'gK', t: 'k', c: 'w', sq: 'e1', x: 4.5, y: 0, z: 0.5, alpha: 0.32 };
  const cross = (g, u) => { if (u <= 0) return; neon(g, B, [5.6, 0.1], [6.6, 0.9], RED, u, { y: 0.08, w: 1.4 }); neon(g, B, [5.6, 0.9], [6.6, 0.1], RED, u, { y: 0.08, w: 1.4 }); };
  shot(whyA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.86, 9.2, [4.6, 0, 1.25])], [len(sh), K(0.02, 0.83, 8.4, [4.8, 0, 1.25])]], { t });
    const xu = seg(t, csT + 0.1, csT + 0.3, lin);
    onlineStage(g, t, { pieces: BOUT, cams: { mag: { e: 'smug' }, hik: { e: 'happy' } },
      under: g2 => {
        if (t >= csT - 0.25) { drawLoose(g2, [ghostK]); squareFrame(g2, B, 'g1', xu > 0 ? RED : CREAM, 0.8 * seg(t, csT - 0.25, csT, lin)); }
        if (xu > 0) ledGlow(g2, B, 'g1', RED, t, csT + 0.1, { reach: 1 });
      },
      over: g2 => {
        if (t >= kgT) pieceRingAt(g2, 'e2', GOLD, seg(t, kgT, kgT + 0.35, lin));
        if (t >= csT - 0.25) { arrow3(g2, 'e1', 'g1', 0.9, seg(t, csT - 0.25, csT + 0.05, lin)); cross(g2, xu); }
      } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= csT + 0.1) badge(g, "CAN'T CASTLE", W / 2, 230, { color: RED, size: 58, ...pop(t, csT + 0.1) }); } });
  shot(blkA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.55, 0.62, 9.5, [4.4, 0.4, 1.6])], [len(sh), K(0.45, 0.66, 8.6, [4.4, 0.4, 1.7])]], { t });
    const qu = seg(t, qT, qT + 0.25, lin), bu = seg(t, biT, biT + 0.25, lin);
    onlineStage(g, t, { pieces: BOUT.map(p => p.id === 'Q1' && qu ? { ...p, halo: RED, haloA: qu } : p.id === 'B2' && bu ? { ...p, halo: RED, haloA: bu } : p), cams: { mag: { e: 'smug' }, hik: { e: 'happy' } },
      under: g2 => {
        if (t >= blkT) ledGlow(g2, B, 'e2', RED, t, blkT, { reach: 1 });
        if (qu > 0) squareFrame(g2, B, 'd1', RED, qu); if (bu > 0) squareFrame(g2, B, 'f1', RED, bu);
      },
      over: g2 => {
        // the lines the king cuts: the queen's d1–h5 diagonal and the bishop's f1–a6 diagonal, both stopped at e2
        if (qu > 0) { neon(g2, B, 'd1', 'e2', RED, qu); neon(g2, B, 'e2', 'h5', '#8A8F98', 0.6 * qu, { w: 0.6 }); }
        if (bu > 0) { neon(g2, B, 'f1', 'e2', RED, bu); neon(g2, B, 'e2', 'a6', '#8A8F98', 0.6 * bu, { w: 0.6 }); }
      } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= blkT) badge(g, 'BLOCKS', W / 2, 230, { color: RED, size: 58, ...pop(t, blkT) });
    if (t >= qT) badge(g, t >= biT ? 'QUEEN + BISHOP' : 'QUEEN', W / 2, 340, { color: CREAM, size: 44, ...pop(t, t >= biT ? biT : qT) });
  } });
  cue(whyA - 0.06, 'whoosh_fast', 0.3); cue(kgT, 'ting', 0.3); cue(csT + 0.1, 'error', 0.4); cue(csT + 0.12, 'thud', 0.35);
  cue(blkA - 0.06, 'whoosh_fast', 0.3); cue(blkT, 'hit_punch', 0.35); cue(qT, 'stamp', 0.3); cue(biT, 'stamp', 0.3);

  // ======================= HIKARU: his stream room; through his monitor, a new account that plays only the Bongcloud =======================
  // the feed: game after game, 1.e4 e5 2.Ke2, the rating on the LED board behind it climbing to 3000 on "three"
  const G0 = newA + 0.2, GL = 0.62, R0 = 2480;
  function hikFeed(g, t, { tags = true } = {}) {
    rig(B, t - newA, [[0, K(0.18, 0.5, 15, [4, 2.6, 6.5])], [5, K(0.1, 0.46, 13.4, [4, 2.8, 6.8])]], { t });
    const gi = Math.max(0, Math.floor((t - G0) / GL)), gt = t - G0 - gi * GL, done = t >= thrT - 0.3;
    const r = done ? { pieces: board(BC, 3), m: null, lt: 0 } : runTo(BC, 0, [0.12, 0.24, 0.42].map(a => G0 + gi * GL + a), t, 0.1);
    const rate = Math.round(lerp(R0, 3000, ease.inOut(seg(t, G0, thrT, lin))) / 2) * 2;
    onlineSet(g, t, { pieces: halo(r.pieces, ['K1'], GOLD, done ? 1 : gt > 0.42 ? 0.8 : 0), names: tags ? ['NAKAMURA', 'OPPONENT'] : null, cols: [HIK_C, CREAM],
      panel: g2 => ratingPanel(g2, Math.min(3000, rate), gi + 1),
      under: g2 => { if (t >= thrT) ledGlow(g2, B, 'e2', GOLD, t, thrT, { reach: 1.5 }); },
      over: g2 => { if (!done && gt > 0.42) bongCloud(g2, 4.5, 1.5, t, seg(gt, 0.42, 0.6, lin) * 0.7, { a: 0.4 }); } });
  }
  const hikScreen = t => monitorScreen(feed(g => hikFeed(g, t, { tags: false })), { names: ['NAKAMURA', 'OPPONENT'], cols: [HIK_C, CREAM], title: 'CHESS · BLITZ · NEW ACCOUNT' });
  shot(hikA, (g, lt, t, sh) => {
    const scr = hikScreen(t);
    rig(B, lt, [[0, K(PI + 0.5, 0.12, 8.2, [4, 2.8, -1.4])], [len(sh), K(PI + 0.44, 0.1, 7.2, [4, 2.9, -1.4])]], { t });
    homeRoom(g, t, { screen: scr, who: 'hik', e: 'happy' });
  }, { trans: 'whip', hud: (g, lt, t) => nameTitle(g, lt, 'Hikaru Nakamura', 'USA · GRANDMASTER · STREAMER', { y: 200, size: 58, t0: 0.05 }) });
  shot(newA, (g, lt, t, sh) => {
    const scr = hikScreen(t);
    rig(B, lt, [[0, K(0.5, 0.15, 6.8, [4.2, 2.6, 2])], [0.65, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.65 ? 1 : 0 });
    homeRoom(g, t, { screen: scr, who: 'hik', e: 'happy' });
  }, { kb: 0 });
  shot(scrA, (g, lt, t) => hikFeed(g, t, { tags: false }), { kb: 0, hud: (g, lt, t) => {
    if (t < thrT) badge(g, 'ONLY THE BONGCLOUD', W / 2, 230, { color: HIK_C, size: 52, ...pop(t, scrA + 0.05) });
    else badge(g, 'STILL 3000', W / 2, 230, { color: GOLD, size: 64, ...pop(t, thrT) });
  } });
  cue(hikA - 0.06, 'whoosh_fast', 0.3); cue(hikA + 0.1, 'notify', 0.3); cue(newA + 0.05, 'whoosh_soft', 0.3);
  for (let i = 0; G0 + i * GL + 0.42 < thrT - 0.3; i++) cue(G0 + i * GL + 0.42, i % 2 ? 'piece' : 'move', 0.35);
  cue(thrT - 0.3, 'riser', 0.35); cue(thrT, 'reveal_bell', 0.45); cue(thrT + 0.02, 'success', 0.35); cue(thoT, 'sparkle_pop', 0.3);

  // ======================= MAGNUS VS WESLEY SO: 1.f3 e5 2.Kf2, then So's own words (the photo) =======================
  const sl1 = crT + 0.08, sl2 = soT + 0.1, sl3 = verT + 0.1, soAt = t => runTo(SO, 0, [sl1, sl2, sl3], t);
  shot(soA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.35, 0.5, 12.5, [4.3, 0.8, 3.6])], [len(sh), K(-0.25, 0.46, 11.2, [4.4, 0.9, 3.4])]], { t, bump: t > sl3 && t < sl3 + 0.3 ? 1.2 : 0 });
    const r = soAt(t), on = seg(t, sl3, sl3 + 0.2, lin);
    onlineSet(g, t, { pieces: halo(r.pieces, ['K1'], GOLD, on), names: ['CARLSEN', 'SO'], cols: [MAG_C, SO_C], ...moveFx(r),
      under: g2 => { moveFx(r).under(g2); if (t >= sl3) ledGlow(g2, B, 'f2', GOLD, t, sl3); },
      over: g2 => { moveFx(r).over(g2); impact(g2, 'f2', t, sl3, { flash: 0.3 }); } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'Online blitz final', 'SEPTEMBER 2020', { y: 200, t0: 0.1, a: 1 - seg(t, sl3 - 0.15, sl3) });
    if (t >= sl3) badge(g, 'HIS OWN BONGCLOUD', W / 2, 230, { color: GOLD, size: 54, ...pop(t, sl3) });
  } });
  const soKeys = { from: { x: 0.5, y: 0.3, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.31, zoom: 1.08, dolly: 0.05 } };
  shot(phA, (g, lt, t) => photoShot(g, lt, PH.so, { ...soKeys, dur: 3.2 }), { trans: 'whip', hud: (g, lt, t) => {
    if (t < thatT - 0.05) nameTitle(g, lt, 'Wesley So', 'USA · GRANDMASTER', { y: 200, size: 66, t0: 0.05 });
    else badge(g, '“THAT\'S SO HUMILIATING”', W / 2, 230, { color: CREAM, size: 50, sub: 'WESLEY SO', ...pop(t, thatT) });
    credit(g, CREDITS.so, seg(lt, 0.4, 0.6) * 0.75);
  } });
  cue(soA - 0.06, 'whoosh_fast', 0.3); cue(soA + 0.05, 'notify', 0.25); landCue(sl1, false, 0.55); boom(sl1, 0.45); landCue(sl2, false, 0.45);
  cue(sl3 - 0.3, 'revswell', 0.5); landCue(sl3, false, 0.6); boom(sl3, 0.8); cue(sl3 + 0.02, 'sparkle_pop', 0.3);
  cue(phA - 0.06, 'whoosh_fast', 0.3); cue(phA + 0.1, 'ting', 0.25); cue(thatT, 'sting', 0.3);

  // ======================= MARCH 2021, THE MAGNUS CARLSEN INVITATIONAL: the studio wall; both already qualified =======================
  shot(dateA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.32, 0.42, 30, [4, 4.5, 11])], [len(sh), K(0.12, 0.16, 22, [4, 5.4, 13])]], { t });
    studio(g, t, { wall: 'event', leko: 'neutral', tania: 'neutral' });
  }, { trans: 'whip' });
  shot(bothA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.08, 15.5, [4.2, 6.2, 15])], [len(sh), K(0.05, 0.06, 13.6, [4.2, 6.3, 15])]], { t });
    studio(g, t, { wall: 'event', wall2: 'qual', wallU: seg(t, bothA + 0.05, bothA + 0.3, lin), leko: 'neutral', tania: 'neutral' });
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= qualT) badge(g, 'NOTHING TO PLAY FOR', W / 2, 230, { color: GOLD, size: 46, ...pop(t, qualT) }); } });
  cue(dateA - 0.06, 'whoosh_deep', 0.35); cue(dateA + 0.1, 'murmur', 0.2); cue(w('date', 'invitational'), 'reveal_bell', 0.3);
  cue(bothA - 0.04, 'whoosh_soft', 0.25); cue(bothA + 0.15, 'ting', 0.3); cue(qualT, 'success', 0.3);

  // ======================= THE GAME: Magnus at home walks his king out; Hikaru laughs and copies him =======================
  const gameAt = t => runTo(BC, 2, [kOutT, copT], t);
  function gameBoard(g, t, { tags = true } = {}) {
    rig(B, t - walkA, [[0, K(0.05, 0.62, 12.5, [4, 0.6, 4.2])], [4, K(-0.05, 0.6, 11.4, [4, 0.6, 4.2])]], { t });
    const r = gameAt(t);
    onlineSet(g, t, { pieces: halo(r.pieces, ['K1', 'k1'], GOLD, t >= copT ? 1 : t >= kOutT ? 0.6 : 0), names: tags ? ['CARLSEN', 'NAKAMURA'] : null, cols: [MAG_C, HIK_C],
      under: g2 => { moveFx(r).under(g2); if (t >= kOutT) ledGlow(g2, B, 'e2', GOLD, t, kOutT, { reach: 1 }); if (t >= copT) ledGlow(g2, B, 'e7', GOLD, t, copT, { reach: 1 }); },
      over: g2 => moveFx(r).over(g2) });
  }
  const gameScreen = t => monitorScreen(feed(g => gameBoard(g, t, { tags: false })));
  shot(playA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.55, 0.1, 7.8, [4, 2.8, -1.4])], [len(sh), K(PI + 0.5, 0.1, 7.2, [4, 2.9, -1.4])]], { t });
    homeRoom(g, t, { screen: gameScreen(t), who: 'mag', e: 'smug', over: g2 => tag3(g2, 4, 5.5, -1.4, 'MAGNUS', MAG_C, seg(t, playA + 0.05, playA + 0.3, lin)) });
  }, { trans: 'whip' });
  shot(walkA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.55, 0.16, 7, [4.3, 2.6, 2])], [0.55, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.55 ? 1 : 0 });
    homeRoom(g, t, { screen: gameScreen(t), who: 'mag', e: 'smug' });
  }, { kb: 0 });
  // the same board, now on Hikaru's monitor: the camera pulls back out of it and round to his face
  shot(hikPA, (g, lt, t, sh) => {
    rig(B, lt, [[0, PANELK], [0.12, PANELK], [len(sh), K(1.2, 0.12, 8.4, [4.3, 2.7, 0.9]), ease.inOut]], { t, shake: 0.3 });
    homeRoom(g, t, { screen: gameScreen(t), who: 'hik', e: t >= burstT ? LAUGH : 'focus' });
  }, { kb: 0 });
  shot(hikFA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.62, 0.08, 7.4, [4, 2.9, -1.4])], [len(sh), K(PI + 0.55, 0.06, 6.4, [4, 3.0, -1.4])]], { t });
    homeRoom(g, t, { screen: gameScreen(t), who: 'hik', e: LAUGH, over: g2 => tag3(g2, 4, 5.6, -1.4, 'HIKARU', HIK_C, seg(t, hikFA + 0.05, hikFA + 0.3, lin)) });
  }, { trans: 'whip' });
  shot(copA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.55, 11, [4.5, 1.2, 6.4])], [len(sh), K(0.22, 0.52, 10.2, [4.5, 1.2, 6.4])]], { t, bump: t > copT && t < copT + 0.3 ? 1.3 : 0 });
    const r = gameAt(t);
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1', 'k1'], GOLD, t >= copT ? 1 : 0.6), cams: { mag: { e: 'smug' }, hik: { e: LAUGH, shake: 0.2 } },
      under: g2 => { moveFx(r).under(g2); ledGlow(g2, B, 'e2', GOLD, t, kOutT, { reach: 1 }); if (t >= copT) ledGlow(g2, B, 'e7', GOLD, t, copT, { reach: 1.5 }); },
      over: g2 => { moveFx(r).over(g2); impact(g2, 'e7', t, copT, { flash: 0.35 }); bongCloud(g2, 4.5, 1.5, t, 0.6, { a: 0.35 }); bongCloud(g2, 4.5, 6.5, t, seg(t, copT, copT + 0.5, lin) * 0.6, { a: 0.35, seed: 8 }); } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= himT) badge(g, 'THE DOUBLE BONGCLOUD', W / 2, 230, { color: GOLD, size: 54, ...pop(t, himT) }); } });
  cue(playA - 0.06, 'whoosh_fast', 0.3); cue(walkA + 0.05, 'whoosh_soft', 0.3); landCue(kOutT, false, 0.6); boom(kOutT, 0.6);
  cue(hikPA + 0.05, 'whoosh_soft', 0.25); cue(burstT, 'laugh', 0.45); cue(hikFA - 0.06, 'whoosh_fast', 0.25);
  cue(copA - 0.06, 'whoosh_fast', 0.3); cue(copT - 0.3, 'revswell', 0.5); landCue(copT, false, 0.6); boom(copT, 0.85); cue(himT, 'reveal_bell', 0.35);

  // ======================= LEKO ON COMMENTARY: the studio, the live feed on the wall; "please don't try this at home" =======================
  const liveFeed = t => feed(g => { rig(B, 0, [[0, K(PI - 0.3, 0.55, 12.5, [4, 0.8, 4.5])], [1, K(PI - 0.3, 0.55, 12.5, [4, 0.8, 4.5])]], { t }); onlineSet(g, t, { pieces: halo(BOUT, ['K1', 'k1'], GOLD, 1) }); });
  const LIVE = { mag: 'smug', hik: LAUGH, hikShake: 0.2 };
  shot(lekoA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 0.2, 16, [4.2, 3.4, 10])], [len(sh), K(-0.3, 0.16, 13.5, [3.8, 3.4, 10])]], { t });
    studio(g, t, { wall: 'live', feed: liveFeed(t), live: LIVE, leko: t >= w('leko', 'leko') ? 'shock' : 'happy', tania: 'happy',
      over: g2 => tag3(g2, 2.2, 5.5, 9.3, 'PETER LEKO', TEAL, seg(t, lekoA + 0.2, lekoA + 0.5, lin)) });
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'On commentary', 'LIVE · MARCH 15, 2021', { y: 200, t0: 0.15 }) });
  shot(plA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.06, 7.2, [2.1, 3.2, 9.3])], [len(sh), K(-0.04, 0.05, 6.4, [2.1, 3.2, 9.3])]], { t });
    studio(g, t, { wall: 'live', feed: liveFeed(t), live: LIVE, leko: 'worried', tania: LAUGH });
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, '“PLEASE, DEFINITELY DON\'T', W / 2, 230, { color: CREAM, size: 46, ...pop(t, plT) }) });
  shot(tryA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.12, 9.6, [4.3, 3.8, 9.3])], [len(sh), K(0.06, 0.1, 8.7, [4.3, 3.8, 9.3])]], { t });
    studio(g, t, { wall: 'live', feed: liveFeed(t), live: LIVE, leko: 'worried', tania: LAUGH });
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, 'TRY THIS AT HOME”', W / 2, 230, { color: CREAM, size: 52, sub: 'PETER LEKO', ...pop(t, tryA + 0.05) }) });
  cue(lekoA - 0.06, 'whoosh_deep', 0.3); cue(lekoA + 0.1, 'murmur', 0.25); cue(w('leko', 'leko') + 0.1, 'record_scratch', 0.35);
  cue(plA - 0.06, 'whoosh_fast', 0.25); cue(plT, 'ting', 0.25); cue(tryA - 0.06, 'whoosh_fast', 0.25); cue(tryA + 0.2, 'laugh', 0.3);

  // ======================= KINGS BACK, KINGS OUT. THREE TIMES. DRAW =======================
  const DL = [backT + 0.06, backT + 0.42, k2T + 0.05, out2T + 0.05, out2T + 0.3, out2T + 0.5, out2T + 0.7, thr2T + 0.04], DD = 0.16;
  const drawAt = t => runTo(BC, 4, DL, t, DD);
  const rep = t => 1 + (t >= DL[3] ? 1 : 0) + (t >= DL[7] ? 1 : 0);
  const kTrails = (g, r, a = 0.8) => trails(g, BC, 2, r.k + 1, r.pieces, ['K1', 'k1'], [MAG_C, HIK_C], { a, lw: 7 });
  shot(drawA, (g, lt, t, sh) => {
    // a fly-around: half a turn round the board, high, while the kings shuffle
    const keys = aimKeys(tt => { const a = lerp(-0.75, 0.75, ease.inOut(clamp(tt / 2.4))); return [4 + Math.sin(a) * 11.5, 7.2, 4 - Math.cos(a) * 11.5]; }, () => [4, 0.4, 4.2], 0, len(sh));
    rig(B, lt, keys, { t, e: lin });
    const r = drawAt(t);
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1', 'k1'], GOLD, 0.8), cams: { mag: { e: 'smug' }, hik: { e: LAUGH } }, under: g2 => moveFx(r, DD, 0.25).under(g2),
      over: g2 => { kTrails(g2, r); moveFx(r, DD, 0.25).over(g2); } });
  }, { trans: 'whip', hud: (g, lt, t) => { const n = rep(t); if (n >= 2) badge(g, 'SAME POSITION ×2', W / 2, 230, { color: CREAM, size: 50, ...pop(t, DL[3]) }); } });
  shot(topA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 1.3, 13.5, [4, 0, 4])], [len(sh), K(0.18, 1.34, 12.4, [4, 0, 4])]], { t, bump: t > drT && t < drT + 0.3 ? 1 : 0 });
    const r = drawAt(t), drawn = t >= drT;
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1', 'k1'], GOLD, 1), cams: { mag: { e: drawn ? 'happy' : 'smug' }, hik: { e: LAUGH } },
      under: g2 => { moveFx(r, DD, 0.25).under(g2); if (drawn) { ledGlow(g2, B, 'e2', GOLD, t, drT); ledGlow(g2, B, 'e7', GOLD, t, drT); } },
      over: g2 => { kTrails(g2, r, 0.8 * (1 - 0.5 * seg(t, drT, drT + 0.3))); moveFx(r, DD, 0.25).over(g2); if (drawn) { tag3(g2, 4.5, 2.0, -0.6, '½', MAG_C, seg(t, drT, drT + 0.25, lin)); tag3(g2, 4.5, 2.6, 6.5, '½', HIK_C, seg(t, drT, drT + 0.25, lin)); } } });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t < drT) badge(g, rep(t) >= 3 ? 'SAME POSITION ×3' : 'SAME POSITION ×2', W / 2, 230, { color: rep(t) >= 3 ? GOLD : CREAM, size: 50, ...(rep(t) >= 3 ? pop(t, DL[7]) : {}) });
    else stamp(g, 'DRAW', W / 2, 300, t, drT, { color: GOLD, size: 110 });
  } });
  cue(drawA - 0.06, 'whoosh_deep', 0.3); DL.forEach((a, i) => landCue(a, false, i === 7 ? 0.7 : 0.5)); boom(DL[3], 0.45); boom(DL[7], 0.7);
  cue(DL[3] + 0.02, 'ting', 0.25); cue(DL[7] + 0.02, 'reveal_bell', 0.35); cue(drT - 0.004, 'boom', 0.6); cue(drT, 'stamp', 0.5); cue(drT + 0.05, 'clock_press', 0.3);

  // ======================= "I JUST WANTED TO HAVE A LITTLE BIT OF FUN" =======================
  shot(funA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.6, 0.1, 8, [4, 2.9, -1.4])], [len(sh), K(PI + 0.52, 0.08, 6.5, [4, 3.0, -1.4])]], { t, e: lin });
    homeRoom(g, t, { screen: gameScreen(copT + 1 + lt * 0.2), who: 'mag', e: t >= justT ? 'happy' : 'smug' });
  }, { trans: 'whip', noJump: false, hud: (g, lt, t) => { if (t >= justT) badge(g, '“A LITTLE BIT OF FUN”', W / 2, 230, { color: CREAM, size: 52, sub: 'MAGNUS CARLSEN', ...pop(t, justT) }); } });
  cue(funA - 0.06, 'whoosh_fast', 0.3); cue(justT, 'sparkle_pop', 0.3);

  // ======================= KASPAROV DIDN'T LAUGH (the photo) =======================
  const kasKeys = { from: { x: 0.5, y: 0.38, zoom: 1.0, dolly: 0 }, to: { x: 0.52, y: 0.38, zoom: 1.06, dolly: 0.05 } };
  const kasKeys2 = { from: { x: 0.54, y: 0.36, zoom: 1.25, dolly: 0.02 }, to: { x: 0.55, y: 0.36, zoom: 1.34, dolly: 0.07 } };
  shot(kasA, (g, lt, t) => photoShot(g, lt, PH.kas, { ...kasKeys, dur: youA - kasA + 0.3 }), { trans: 'whip', hud: (g, lt, t) => {
    nameTitle(g, lt, 'Garry Kasparov', '13TH WORLD CHAMPION', { y: 200, size: 62, t0: 0.05 }); credit(g, CREDITS.kas, seg(lt, 0.4, 0.6) * 0.75);
  } });
  shot(youA, (g, lt, t) => photoShot(g, lt, PH.kas, { ...kasKeys2, dur: ownA - youA + 0.3 }), { trans: 'zoom', hud: (g, lt, t) => {
    badge(g, '“PAY UTMOST RESPECT', W / 2, 230, { color: CREAM, size: 50, ...pop(t, youA + 0.1) });
    badge(g, 'TO YOUR VIEWERS”', W / 2, 330, { color: CREAM, size: 50, sub: 'GARRY KASPAROV', a: seg(t, w('kasp', 'respect'), w('kasp', 'respect') + 0.1), ...pop(t, w('kasp', 'respect')) });
    credit(g, CREDITS.kas, 0.75);
  } });
  cue(kasA - 0.06, 'whoosh_deep', 0.35); cue(kasA + 0.05, 'record_scratch', 0.3); cue(kasA + 0.15, 'dun_dun', 0.3); cue(youA + 0.1, 'sting', 0.3);

  // ======================= WHO WOULD PUNISH MAGNUS... AT THE MAGNUS CARLSEN INVITATIONAL? =======================
  shot(ownA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.02, 7.5, [0.6, 4.7, 11.2])], [len(sh), K(0.14, 0.02, 6.4, [0.6, 4.7, 11.2])]], { t });
    onlineStage(g, t, { pieces: board(BC, 12), cams: { mag: { e: 'smug' }, hik: { e: 'happy' } },
      over: g2 => mark(g2, '?', 3.6, 8.6, 10.6, seg(t, w('own', 'punish'), w('own', 'punish') + 0.4, lin), t, { color: GOLD, size: 1.6 }) });
  }, { trans: 'whip' });
  shot(namA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.1, 19, [4.2, 6.2, 15])], [len(sh), K(0.03, 0.05, 12.5, [4.2, 6.0, 15])]], { t });
    studio(g, t, { wall: 'event', wall2: 'named', wallU: seg(t, mag2T, mag2T + 0.25, lin), leko: 'happy', tania: 'happy' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= invT) badge(g, 'NAMED AFTER HIM', W / 2, 230, { color: GOLD, size: 56, ...pop(t, invT) }); } });
  cue(ownA - 0.06, 'whoosh_fast', 0.3); cue(w('own', 'punish'), 'gavel', 0.35); cue(namA - 0.06, 'whoosh_deep', 0.3); cue(mag2T, 'shimmer', 0.3); cue(invT, 'reveal_bell', 0.4);

  // ======================= TWO YEARS LATER: the knight dance at the World Blitz, and zero points for both =======================
  const SAM_CLK = { names: ['DUBOV', 'NEPO'], cols: [DUB_C, NEP_C] };
  const clockAt = (k, o = {}) => ({ ...SAM_CLK, l: 180 + 0.4 * Math.floor(k / 2), r: 180 + 0.4 * Math.floor((k - 1) / 2), run: k % 2 ? 2 : 1, ...o });
  const DRAWN = { ...SAM_CLK, result: '½ – ½' };
  const samSet = (g, t, tab = {}, hl = {}) => hall(g, t, { theme: 'sam', desk: {}, ...hl, mid: g2 => tableSet(g2, t, { white: 'dub', black: 'nepD', ...tab }) });
  shot(zeroA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.4, 42, [4, 2, 6], { fov: 1250 })], [len(sh), K(-0.18, 0.22, 27, [4, 3.6, 9])]], { t });
    samSet(g, t, { pieces: board(KN, 0), clock: clockAt(0, { run: 0 }), ew: 'focus', eb: 'focus' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t < w('zero', 'two') + 0.95) heading(g, 'TWO YEARS LATER', 200, seg(lt, 0, 0.15)); else placeStamp(g, lt, 'World Blitz', 'SAMARKAND · DECEMBER 2023', { y: 200, t0: w('zero', 'two') + 0.95 - zeroA }); } });
  const TD = 0.09, TA = [...Array(24)].map((_, i) => shufA + 0.1 + i * 0.058), homeT = TA[23] + TD;
  shot(shufA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 1.28, 13.5, [4, 0, 4])], [len(sh), K(0.2, 1.34, 12.2, [4, 0, 4])]], { t, bump: t > homeT && t < homeT + 0.3 ? 1 : 0 });
    const r = hopAt(KN, 0, TA, t, TD), home = seg(t, homeT, homeT + 0.25, lin);
    samSet(g, t, { pieces: halo(r.pieces, KNIGHTS, GOLD, home), clock: clockAt(r.k), wPlayer: false, bPlayer: false, wChair: false, bChair: false,
      under: g2 => { if (t >= homeT) for (const sq of ['b1', 'g1', 'b8', 'g8']) ledGlow(g2, B, sq, GOLD, t, homeT); },
      over: g2 => trails(g2, KN, 0, r.k + (r.u < 1 ? 0 : 1), r.pieces, KNIGHTS, KCOLS, { a: 0.8 * (1 - 0.6 * home) }) }, { bg: false });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t >= knT && t < dzT) badge(g, 'ONLY KNIGHTS', W / 2, 230, { color: GOLD, size: 56, ...pop(t, knT) });
    if (t >= dzT) badge(g, '½ – ½', W / 2, 230, { color: GOLD, size: 64, ...pop(t, dzT) });
  } });
  shot(wbA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.16, 30, [4, 4.4, 12])], [len(sh), K(-0.06, 0.13, 26, [4, 4.6, 13])]], { t });
    samSet(g, t, { pieces: board(KN, 24), clock: DRAWN, ew: 'smug', eb: 'smug' }, { led: 'sam', bg: true });
  }, { trans: 'whip' });
  shot(zT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.1, 10.5, [ARBX, 3.3, ARBZ])], [len(sh), K(-0.26, 0.09, 9.4, [ARBX, 3.4, ARBZ])]], { t, bump: t > zT && t < zT + 0.3 ? 1 : 0 });
    samSet(g, t, { pieces: board(KN, 24), clock: DRAWN, ew: 'smug', eb: 'smug' }, { led: 'samD', led2: 'sam0', ledU: seg(t, zT - 0.05, zT + 0.15, lin), desk: { e: 'angry', qa: true } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= zT) stamp(g, 'ZERO', W / 2, 300, t, zT, { color: RED, size: 110 }); } });
  shot(zbA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.06, 0.3, 23, [4, 2.8, 4])], [len(sh), K(-PI / 2 + 0.1, 0.28, 22, [4, 2.8, 4])]], { t });
    const u = seg(t, w('zero', 'both') - 0.05, w('zero', 'both') + 0.2, lin);
    samSet(g, t, { pieces: board(KN, 24), clock: { ...SAM_CLK, result: '0 – 0' }, ew: 'shock', eb: 'shock',
      over: g2 => { tag3(g2, 4, 5.6, -1.4, '0', RED, u); tag3(g2, 4, 5.6, 9.3, '0', RED, u); } }, { led: 'sam0' });
  }, { trans: 'whip' });
  cue(zeroA - 0.06, 'whoosh_deep', 0.35); cue(zeroA + 0.1, 'murmur', 0.25); cue(shufA - 0.06, 'whoosh_fast', 0.3);
  TA.forEach((a, i) => cue(a + TD - 0.03, 'piece', i % 2 ? 0.2 : 0.28)); cue(homeT - 0.004, 'boom', 0.5); cue(dzT, 'ting', 0.3);
  cue(wbA - 0.06, 'whoosh_fast', 0.3); cue(zT - 0.3, 'revswell', 0.5); cue(zT - 0.004, 'boom', 0.8); cue(zT, 'gavel', 0.6); cue(zT + 0.05, 'stamp', 0.45);
  cue(zbA - 0.06, 'whoosh_fast', 0.3); cue(w('zero', 'both'), 'gasp', 0.4);

  // ======================= CTA: back to the board of the hook, both kings out; fun or disrespect? =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.42, 11.5, [4.2, 1.6, 5])], [len(sh), K(0.0, 0.27, 17.5, [4, 3.4, 6.5])]], { t });
    onlineStage(g, t, { pieces: halo(board(BC, 12), ['K1', 'k1'], GOLD, 0.8), cams: { mag: { e: 'smug' }, hik: { e: 'happy' } },
      over: g2 => { bongCloud(g2, 4.5, 1.5, t, 0.5, { a: 0.3 }); bongCloud(g2, 4.5, 6.5, t, 0.5, { a: 0.3, seed: 8 }); } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'FUN OR DISRESPECT?', W / 2, 230, { color: GOLD, size: 50, ...pop(t, ctaA + 0.1) });
    badge(g, 'RATE IT 1–10', W / 2, 330, { color: TEAL, size: 46, a: seg(t, rateT, rateT + 0.1), ...pop(t, rateT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 425, { color: CREAM, size: 36, a: seg(t, tenT, tenT + 0.1) });
  } });
  cue(ctaA - 0.06, 'whoosh_fast', 0.3); cue(rateT, 'sparkle_pop', 0.3); cue(tenT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: worstA, m: 'intrigue' }, { t: hikA, m: 'digital' }, { t: soA, m: 'tension' }, { t: dateA, m: 'build' },
    { t: playA, m: 'hook' }, { t: lekoA, m: 'intrigue' }, { t: drawA, m: 'clockwork' }, { t: funA, m: 'victory' }, { t: kasA, m: 'coldwar' },
    { t: ownA, m: 'paranoia' }, { t: zeroA, m: 'build' }, { t: zT, m: 'void' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: kingsT - 0.32, t1: kingsT - 0.01, kind: 'mute' }, { t0: kingsT, t1: worstA, kind: 'boost', db: 4 },
    { t0: zT - 0.32, t1: zT - 0.01, kind: 'mute' },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
