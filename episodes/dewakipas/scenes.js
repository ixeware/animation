// Dewa Kipas: GothamChess vs the "Fan God" (March 2021). On 2 March Levy Rozman lost a 10-minute game on stream to the
// Chess.com account Dewa_Kipas ("Fan God" in Indonesian): 800 points in 11 days, 10 seconds a move, over 90 % accuracy.
// He reported it and Chess.com closed it for breaking its fair-play rules. Behind it was Dadang Subur, an amateur from
// Indonesia, who denies cheating; his son's post went viral, Levy got messages up to death threats and locked his
// accounts, and father and son condemned the harassment. On 22 March Deddy Corbuzier hosted a match in his Jakarta
// studio: IM Irene Sukandar won 3–0, Chess.com put the performance at 1127, and 1.25 million watched at once on YouTube.
// Sources, and what is drawn rather than documented: SOURCES.md.
// Rules 42–48 (reference/rausis_v2.md): every phrase is a 3D set (the online board between two webcams, Levy's room by
// day, Dadang's living room under a ceiling fan, the Jakarta studio, the city at sunset); the hook board returns at the
// end. Rule 48: this video's own palette, Jakarta at sunset (coral, gold, teal, cream on plum), daylight rooms and a
// Chess.com-green board on walnut instead of the night blue of the Magnus series.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, capColor } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, neon, boardArrow } from '../../engine/js/hifx.js';
import { webcam, ledStrip } from '../../engine/js/witty.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (STYLE_BIBLE rule 48): Jakarta at sunset ----------
const PLUM = '#2B1B3D', CORAL = '#FF7A5C', SUN = '#FFC857', TEAL = '#2EC4B6', CREAM = '#FFF3E0';
const GOLD = SUN, RED = '#E8413A', LIME = HI.good, LEVY_C = '#6CB8FF', FAN_C = CORAL, IRENE_C = TEAL;
// the board: Chess.com green on a walnut slab; the rounded slab, its sides and the engraving stay (rule 46)
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#5A3A22', side: '#2A190D', th: 0.45, rc: 0.35 };
Object.assign(capColor, { coral: '#FF8A6B', teal: '#3FE0CF' });  // the caption colours of this palette
// the real games (SOURCES.md): Levy's game against Dewa_Kipas on 2 March 2021 (Chess.com archive; Levy White, lost on
// time after 35...Qh1+) and the three match games of 22 March with Irene Sukandar (she had White in games 1 and 3)
const LV = await fetch('../engine/data/levy_dewakipas_2021.json').then(r => r.json());
const M = await Promise.all([1, 2, 3].map(n => fetch(`../engine/data/sukandar_subur_2021_g${n}.json`).then(r => r.json())));
const LVEND = 70;  // 35...Qh1+, the last move: Levy's flag fell in the lost position
// at the studio table Dadang sits on the near side; in games 1 and 3 Irene had White, so the board turns round for them
const rsq = sq => String.fromCharCode(201 - sq.charCodeAt(0)) + (9 - +sq[1]);
const turned = pcs => pcs.map(p => ({ ...p, sq: rsq(p.sq), ...(p.x != null ? { x: 8 - p.x, z: 8 - p.z } : {}), ...(p.trail ? { trail: [8 - p.trail[0], 8 - p.trail[1]] } : {}) }));
const matchBoard = (n, k) => n === 2 ? board(M[1], k) : turned(board(M[n - 1], k));
const PH = { levy: await loadPhoto3d('../episodes/levy/photos/levy_closeup'), irene: await loadPhoto3d('../episodes/dewakipas/photos/irene_2013') };
const CREDITS = { levy: 'Photo: Piaras Ó Mídheach / Collision via Sportsfile, CC BY 2.0', irene: 'Photo: Kristianus Liem (2013), CC BY-SA 3.0' };

// ---------- cast: Levy (the engine's lookalike), Dadang Subur and his son at home, Deddy Corbuzier (bald, in black),
// IM Irene Sukandar; all cartoon versions ----------
const TAN = { base: '#C99474', shade: '#B07B5C', deep: '#8A5C42', blush: '#C87A6A', hi: '#DDAE8E' };
const TAN2 = { base: '#D7A684', shade: '#C08C6A', deep: '#9A6A4E', blush: '#D88A7C', hi: '#E9C2A4' };
CAST.lev = { ...CAST.levy };
CAST.dad = { face: [1.0, 1.0, 0.92], hair: 'parted', hairC: '#17120F', brow: '#17120F', suit: '#B5562E', suitD: '#86391C', shirt: 'open', ears: 1.03, beard: '#2A211C', beardStyle: 'goatee', skin: TAN };
CAST.son = { face: [0.9, 1.08, 0.82], hair: 'fringe', hairC: '#120E0C', brow: '#120E0C', suit: '#2E8C7A', suitD: '#1F6658', shirt: 'tee', ears: 1.02, skin: TAN };
CAST.ded = { face: [1.0, 1.04, 0.92], hair: 'buzz', hairC: '#C99A7C', brow: '#2A201A', suit: '#141418', suitD: '#0A0A0D', shirt: 'tee', ears: 1.04, beard: '#2A211C', beardStyle: 'goatee', skin: TAN2 };
CAST.ire = { face: [0.92, 1.05, 0.84], hair: 'longcurly', hairC: '#16100D', brow: '#16100D', suit: '#C8323A', suitD: '#8E1F26', shirt: 'tee', female: true, ears: 0.9, skin: TAN2 };
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a plum scrim at the top of the frame: titles stay readable over bright daylight sets
function scrim(g, a = 1) { if (a <= 0) return; const gr = g.createLinearGradient(0, 0, 0, 460); gr.addColorStop(0, `rgba(30,16,41,${(0.78 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(30,16,41,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 460); }
// a heading in the brilliant type: letter-spaced heavy cream with a coral underline
function heading(g, text, y, a = 1, { size = 44, color = CREAM, spacing = 5 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = `${spacing}px`; g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText(text, W / 2, y); g.shadowColor = 'transparent';
  const tw = g.measureText(text).width; g.fillStyle = CORAL; g.fillRect(W / 2 - 40, y + 18, 80, 5);
  qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 30, 'text', text); g.restore();
}
// the cover: a white line over a big coral one
function coverTitle(g, l1, l2, y, { a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#2B1020';
  g.font = sans(66, 900); g.lineWidth = 16; g.strokeText(l1, W / 2, y); g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  g.font = sans(124, 900); const y2 = y + 132;
  g.lineWidth = 20; g.strokeText(l2, W / 2, y2); g.fillStyle = '#FFB347'; g.fillText(l2, W / 2, y2);
  g.restore();
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
  g.fillStyle = '#1E1029'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, drop); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, drop - 20, 0, drop + 250); gr.addColorStop(0, '#1E1029'); gr.addColorStop(1, 'rgba(30,16,41,0)');
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
const TABLE = ['#C99A68', '#8A6440', '#A87E52'], CHAIR = '#8E2A30';
function tableSet(g, t, { pieces = null, loose = [], ew = 'focus', eb = 'focus', wReach = null, bReach = null, wSide = -1, bSide = 1, white = 'dad', black = 'ire', wx = 4, bx = 4,
  under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, evalCols = [LEVY_C, FAN_C], wPlayer = true, bPlayer = true, wChair = true, bChair = true,
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
    if (slab) B.drawSlab(g, mark === undefined ? GREEN : { ...GREEN, mark });  // mark: null leaves the sides of the far boards bare
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
// a forearm raised on the free side, holding a phone in front of the chest (in the standing figure's own coordinates)
function heldPhone(g, who, x, z, sd, lit = 1, { k = 1, y0 = FLOOR_Y } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8) return;
  const c = CAST[who], sk = skinOf(who), p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK;
  g.save(); g.translate(p.x, p.y); g.scale(sc, sc);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = c.suit; g.lineWidth = 56;  // the sleeve: down to the elbow, up to the chest
  g.beginPath(); g.moveTo(sd * 116, 250); g.lineTo(sd * 134, 398); g.lineTo(sd * 52, 356); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 4; g.stroke();
  g.save(); g.translate(sd * 14, 292); g.rotate(-sd * 0.14);
  g.fillStyle = '#15161A'; g.beginPath(); g.roundRect(-46, -84, 92, 168, 14); g.fill();
  g.fillStyle = `rgba(191,244,255,${(0.5 + 0.4 * lit).toFixed(2)})`; g.beginPath(); g.roundRect(-38, -74, 76, 148, 9); g.fill();
  g.fillStyle = 'rgba(30,60,80,0.35)'; for (let j = 0; j < 4; j++) g.fillRect(-28, -54 + j * 22, j === 3 ? 34 : 56, 9);
  g.restore();
  hand2(g, sd * 40, 362, 30, sk);
  g.restore();
}
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

// a short white flash and speed lines from a point of the board (the main moves)
function impact(g, sq, t, t0, { life = 0.4, flash = 0.45 } = {}) {
  const u = t - t0;
  if (u < 0 || u > life) return;
  flashTint(g, '#FFFFFF', flash * (1 - u / life));
  const [x, z] = sqXZ(sq);
  if (depth(x, 0.4, z) > 0.8) { const p = B.project(x, 0.4, z); speedLines(g, p.x, p.y, t, t0, { life }); }
}
const FEED = makeCanvas(), feedx = FEED.getContext('2d');  // the frame of another scene, shown on a screen
// text shrunk to fit a width
function fitFont(x, text, size, maxW, weight = 900) { let s = size; x.font = sans(s, weight); while (s > 12 && x.measureText(text).width > maxW) { s -= 2; x.font = sans(s, weight); } return s; }

// ======================= THE SETS (this video's palette, rule 48) =======================
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const hz = () => B.cy - B.f * Math.tan(B.pitch);  // the horizon on screen
// the sun: a disc far behind the scene, with its glow (moves with the camera like the rest of the world)
function sun(g, p3, r, { a = 1, col = '#FFD27A' } = {}) {
  if (depth(...p3) < 2) return;
  const p = B.project(...p3), R = p.s * r;
  rim(g, p.x, p.y, R * 5, '#FF9A5A', 0.35 * a); rim(g, p.x, p.y, R * 2.2, col, 0.6 * a);
  const gr = g.createRadialGradient(p.x, p.y - R * 0.3, R * 0.1, p.x, p.y, R); gr.addColorStop(0, '#FFF6D8'); gr.addColorStop(1, col);
  g.save(); g.globalAlpha *= a; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.fill(); g.restore();
}
// a sunset sky in screen space, its bands tied to the horizon
function sunsetSky(g, { warm = 1 } = {}) {
  const y = hz(), gr = g.createLinearGradient(0, y - 1500, 0, y + 260);
  gr.addColorStop(0, '#24163A'); gr.addColorStop(0.45, '#6A2A58'); gr.addColorStop(0.72, mix('#C2445A', '#E2615A', warm)); gr.addColorStop(0.9, '#FF9E5E'); gr.addColorStop(1, '#FFC978');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

// ---------- the electric fan: the "Fan God" (a desk fan in a webcam, a ceiling fan at Dadang's home) ----------
// a desk fan seen from the front: blades turned by ang, a blur disc when it spins fast, the cage, a halo when god
function fan2d(x, cx, cy, r, ang, { blur = 0, god = 0, t = 0 } = {}) {
  if (god > 0) {  // the god: rays turning slowly behind it and a gold halo over the cage
    x.save(); x.translate(cx, cy); x.rotate(t * 0.4); x.globalAlpha = 0.35 * god;
    for (let i = 0; i < 12; i++) { x.rotate(Math.PI / 6); const gr = x.createLinearGradient(0, 0, 0, -r * 2.4); gr.addColorStop(0, 'rgba(255,214,120,0.9)'); gr.addColorStop(1, 'rgba(255,214,120,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(-r * 0.12, 0); x.lineTo(r * 0.12, 0); x.lineTo(r * 0.32, -r * 2.4); x.lineTo(-r * 0.32, -r * 2.4); x.closePath(); x.fill(); }
    x.restore();
  }
  x.save(); x.translate(cx, cy);
  x.fillStyle = '#D9E0E5'; x.fillRect(-r * 0.09, r * 0.85, r * 0.18, r * 0.95);  // the neck and the base
  const bg = x.createLinearGradient(0, r * 1.7, 0, r * 2.0); bg.addColorStop(0, '#EEF2F5'); bg.addColorStop(1, '#AEB8C0');
  x.fillStyle = bg; x.beginPath(); x.ellipse(0, r * 1.84, r * 0.66, r * 0.17, 0, 0, 7); x.fill();
  x.fillStyle = '#C3CCD3'; x.beginPath(); x.ellipse(0, r * 0.12, r * 0.34, r * 0.3, 0, 0, 7); x.fill();  // the motor behind
  for (let i = 0; i < 3; i++) {
    x.save(); x.rotate(ang + i * 2.0944);
    const gr = x.createLinearGradient(-r * 0.3, 0, r * 0.3, 0); gr.addColorStop(0, '#4FC9D9'); gr.addColorStop(1, '#9AE8F0');
    x.fillStyle = gr; x.globalAlpha = 1 - 0.55 * blur; x.beginPath(); x.ellipse(r * 0.05, -r * 0.48, r * 0.27, r * 0.45, 0.3, 0, 7); x.fill(); x.restore();
  }
  if (blur > 0) { x.fillStyle = `rgba(150,230,240,${(0.4 * blur).toFixed(3)})`; x.beginPath(); x.arc(0, 0, r * 0.92, 0, 7); x.fill(); }
  x.fillStyle = '#F7F9FA'; x.beginPath(); x.arc(0, 0, r * 0.17, 0, 7); x.fill(); x.fillStyle = '#8E9AA3'; x.beginPath(); x.arc(0, 0, r * 0.07, 0, 7); x.fill();
  x.strokeStyle = 'rgba(244,247,250,0.9)'; x.lineWidth = r * 0.035; x.beginPath(); x.arc(0, 0, r * 0.97, 0, 7); x.stroke();
  x.lineWidth = r * 0.014; x.beginPath(); x.arc(0, 0, r * 0.62, 0, 7); x.stroke();
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22); x.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97); x.stroke(); }
  if (god > 0) {
    x.globalAlpha = god; x.strokeStyle = '#FFD45A'; x.shadowColor = '#FFC857'; x.shadowBlur = 30; x.lineWidth = r * 0.09;
    x.beginPath(); x.ellipse(0, -r * 1.28, r * 0.62, r * 0.17, 0, 0, 7); x.stroke(); x.shadowBlur = 0;
  }
  x.restore();
}
const CAMC = { lev: makeCanvas(600, 720), fan: makeCanvas(600, 720) };
const CAMLOOK = {
  lev: { bg: ['#9FD3FF', '#3E7FC0'], name: 'GOTHAMCHESS', nameColor: LEVY_C, glow: '#9FD3FF' },
  fan: { bg: ['#FFB27A', '#8A2E58'], name: 'DEWA_KIPAS', nameColor: '#FFB59A', glow: '#FFB27A' },
};
// Levy's webcam (the cartoon), or the Fan God's: a fan instead of a face. spin: turns a second; closed greys it out
function camTex(who, e, t, { shake = 0, zoom = 1, spin = 6, god = 1, closed = 0 } = {}) {
  const c = CAMC[who], x = c.getContext('2d'), L = CAMLOOK[who];
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 600, 720); x.filter = 'none';
  if (who === 'lev') { webcam(x, 0, 0, 600, 720, 'lev', e, t, { bg: L.bg, name: L.name, nameColor: L.nameColor, zoom: 1.05 * zoom, cy: 0.5, shake }); return c; }
  x.save(); x.beginPath(); x.roundRect(0, 0, 600, 720, 14); x.clip();
  const gr = x.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, L.bg[0]); gr.addColorStop(1, L.bg[1]); x.fillStyle = gr; x.fillRect(0, 0, 600, 720);
  if (closed > 0) x.filter = `grayscale(${closed})`;
  const sx = Math.sin(t * 47) * shake * 8;
  fan2d(x, 300 + sx, 300, 175 * zoom, t * spin, { blur: clamp((spin - 5) / 10), god: god * (1 - closed), t });
  x.filter = 'none';
  if (closed > 0) { x.fillStyle = `rgba(16,14,20,${(0.55 * closed).toFixed(3)})`; x.fillRect(0, 0, 600, 720); }
  x.restore();
  x.save(); x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 4; x.beginPath(); x.roundRect(0, 0, 600, 720, 14); x.stroke();
  x.fillStyle = 'rgba(10,8,14,0.85)'; x.fillRect(0, 676, 600, 44);
  x.fillStyle = '#E8413A'; x.fillRect(150, 686, 34, 12); x.fillStyle = '#FFFFFF'; x.fillRect(150, 698, 34, 12);  // the flag of Indonesia
  x.font = sans(26, 900); x.letterSpacing = '3px'; x.textAlign = 'left'; x.fillStyle = L.nameColor; x.fillText(L.name, 198, 707);
  x.restore();
  return c;
}
// a panel of half width hw and half height hh centred at c, turned by yaw ry about the vertical (0: facing -z)
function camPanel(g, img, c, hw, hh, ry = 0, { glow = null, a = 1, frame = '#1A1020' } = {}) {
  if (a <= 0) return;
  const R = [Math.cos(ry), 0, -Math.sin(ry)], P = (u, v, d = 0) => [c[0] + R[0] * u - Math.sin(ry) * d, c[1] + v, c[2] + R[2] * u - Math.cos(ry) * d];
  const nrm = [-Math.sin(ry), 0, -Math.cos(ry)], toE = vsub(B.E, c);
  g.save(); g.globalAlpha *= a;
  if (glow) pool(g, B, c[0], -0.38, c[2] - 3.5, 7, glow, 0.16);
  obox(g, P(0, 0, -0.12), [hw + 0.14, hh + 0.14, 0.1], frame, { ry }, { spec: 0.3 });
  if (vdot(nrm, toE) > 0) texQuad(g, img, P(-hw, hh, 0.03), P(hw, hh, 0.03), P(-hw, -hh, 0.03));
  g.restore();
}

// ---------- the account card, the rating graph, the move timer, the accuracy gauge: flat LED panels ----------
function cardTex({ rating = '2200', closed = 0, q = false } = {}) {
  return once(`card:${rating}:${closed > 0.5}:${q}`, 1024, 560, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3A2148'); gr.addColorStop(1, '#1E1029'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,243,224,0.06)'; x.beginPath(); x.roundRect(36, 36, w - 72, h - 72, 26); x.fill();
    const av = tex(300, 300, (a, aw, ah) => { const g2 = a.createLinearGradient(0, 0, 0, ah); g2.addColorStop(0, '#FFB27A'); g2.addColorStop(1, '#8A2E58'); a.fillStyle = g2; a.fillRect(0, 0, aw, ah); fan2d(a, 150, 120, 78, 0.4, { god: 1, t: 0.3 }); });
    x.save(); x.beginPath(); x.roundRect(80, 90, 300, 300, 22); x.clip(); x.drawImage(av, 80, 90); x.restore();
    x.textAlign = 'left'; x.textBaseline = 'middle';
    x.font = sans(84, 900); x.letterSpacing = '2px'; x.fillStyle = CREAM; x.fillText('Dewa_Kipas', 420, 150);
    x.fillStyle = '#E8413A'; x.fillRect(424, 222, 54, 18); x.fillStyle = '#FFFFFF'; x.fillRect(424, 240, 54, 18);
    x.font = sans(38, 800); x.letterSpacing = '6px'; x.fillStyle = 'rgba(255,243,224,0.75)'; x.fillText('INDONESIA', 498, 242);
    x.font = sans(40, 800); x.letterSpacing = '6px'; x.fillStyle = 'rgba(255,243,224,0.6)'; x.fillText('RATING', 424, 336);
    x.font = sans(110, 900); x.letterSpacing = '4px'; x.fillStyle = q ? GOLD : CREAM; x.shadowColor = q ? GOLD : 'transparent'; x.shadowBlur = q ? 30 : 0; x.fillText(rating, 660, 336); x.shadowBlur = 0;
    x.font = sans(34, 800); x.letterSpacing = '6px'; x.fillStyle = 'rgba(255,243,224,0.5)'; x.fillText('10 MIN · ONLINE', 424, 440);
    if (closed > 0.5) {
      x.fillStyle = 'rgba(16,12,20,0.6)'; x.fillRect(0, 0, w, h);
      x.save(); x.translate(w / 2, h / 2); x.rotate(-0.16); x.fillStyle = '#C8231F'; x.fillRect(-w * 0.62, -66, w * 1.24, 132);
      x.font = sans(84, 900); x.letterSpacing = '10px'; x.textAlign = 'center'; x.fillStyle = '#FFFFFF'; x.fillText('ACCOUNT CLOSED', 0, 4); x.restore();
    }
    ledGrid(x, w, h, 6);
  });
}
// the rating graph: +800 in 11 days, the line drawn up to u
function graphTex(u) {
  const k = Math.round(clamp(u) * 40);
  return once('graph:' + k, 1024, 640, (x, w, h) => {
    x.fillStyle = '#1E1029'; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = sans(40, 900); x.letterSpacing = '8px'; x.fillStyle = 'rgba(255,243,224,0.8)'; x.fillText('DEWA_KIPAS · RATING', w / 2, 60);
    const X0 = 110, X1 = 930, Y0 = 540, Y1 = 150;
    x.strokeStyle = 'rgba(255,243,224,0.12)'; x.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(X0, lerp(Y0, Y1, i / 4)); x.lineTo(X1, lerp(Y0, Y1, i / 4)); x.stroke(); }
    x.font = sans(26, 800); x.letterSpacing = '2px'; x.fillStyle = 'rgba(255,243,224,0.5)';
    for (let d = 1; d <= 11; d++) x.fillText(String(d), lerp(X0, X1, (d - 1) / 10), 580);
    const r = rng(11), pts = [...Array(45)].map((_, i) => { const v = i / 44; return [lerp(X0, X1, v), lerp(Y0 - 10, Y1 + 10, v ** 0.9) + (i && i < 44 ? (r() - 0.5) * 40 : 0)]; });
    const n = Math.max(1, Math.round(k / 40 * 44));
    const fill = x.createLinearGradient(0, Y1, 0, Y0); fill.addColorStop(0, rgba(CORAL, 0.45)); fill.addColorStop(1, rgba(CORAL, 0));
    x.fillStyle = fill; x.beginPath(); x.moveTo(pts[0][0], Y0); for (let i = 0; i <= n; i++) x.lineTo(...pts[i]); x.lineTo(pts[n][0], Y0); x.closePath(); x.fill();
    x.strokeStyle = CORAL; x.lineWidth = 9; x.lineJoin = 'round'; x.shadowColor = CORAL; x.shadowBlur = 20; x.beginPath(); for (let i = 0; i <= n; i++) x[i ? 'lineTo' : 'moveTo'](...pts[i]); x.stroke(); x.shadowBlur = 0;
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(...pts[n], 12, 0, 7); x.fill();
    if (k >= 40) { x.font = sans(110, 900); x.letterSpacing = '4px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 30; x.textAlign = 'left'; x.fillText('+800', X0 + 30, 220); x.shadowBlur = 0; }
    ledGrid(x, w, h, 6);
  });
}
// the move timer: a ring that fills over ten seconds (the count goes on past ten)
function timerTex(sec) {
  const s = Math.min(15, Math.floor(sec * 2) / 2);
  return once('timer:' + s, 512, 512, (x, w, h) => {
    x.fillStyle = '#1E1029'; x.fillRect(0, 0, w, h);
    const done = s >= 10, col = done ? CORAL : GOLD;
    x.lineWidth = 34; x.strokeStyle = 'rgba(255,243,224,0.12)'; x.beginPath(); x.arc(w / 2, h / 2 + 20, 170, 0, 7); x.stroke();
    x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 24; x.lineCap = 'round'; x.beginPath(); x.arc(w / 2, h / 2 + 20, 170, -Math.PI / 2, -Math.PI / 2 + 6.2832 * Math.min(1, s / 10)); x.stroke(); x.shadowBlur = 0;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = mono(150, 800); x.fillStyle = CREAM; x.fillText(String(Math.floor(s)), w / 2, h / 2 + 26);
    x.font = sans(36, 900); x.letterSpacing = '8px'; x.fillStyle = 'rgba(255,243,224,0.7)'; x.fillText('SECONDS', w / 2, 54);
    ledGrid(x, w, h, 6);
  });
}
// the accuracy gauge: a half dial, the needle to v (0..1)
function gaugeTex(v) {
  const k = Math.round(clamp(v) * 50);
  return once('gauge:' + k, 1024, 640, (x, w, h) => {
    x.fillStyle = '#1E1029'; x.fillRect(0, 0, w, h);
    const cx = w / 2, cy = 420, R = 300;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = sans(40, 900); x.letterSpacing = '10px'; x.fillStyle = 'rgba(255,243,224,0.8)'; x.fillText('ACCURACY', cx, 60);
    for (let i = 0; i < 50; i++) { const a = Math.PI + i / 50 * Math.PI, on = i < k; x.strokeStyle = on ? (i >= 45 ? CORAL : i >= 30 ? GOLD : TEAL) : 'rgba(255,243,224,0.1)'; x.lineWidth = 18; x.beginPath(); x.arc(cx, cy, R, a + 0.01, a + Math.PI / 50 - 0.01); x.stroke(); }
    const a = Math.PI + k / 50 * Math.PI;
    x.strokeStyle = CREAM; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * (R - 50), cy + Math.sin(a) * (R - 50)); x.stroke();
    x.fillStyle = CREAM; x.beginPath(); x.arc(cx, cy, 22, 0, 7); x.fill();
    x.font = sans(120, 900); x.letterSpacing = '4px'; x.fillStyle = k >= 45 ? CORAL : CREAM; x.shadowColor = CORAL; x.shadowBlur = k >= 45 ? 30 : 0;
    x.fillText(k >= 45 ? '90%+' : `${k * 2}%`, cx, cy + 128); x.shadowBlur = 0;  // below the pivot: the needle never crosses it
    ledGrid(x, w, h, 6);
  });
}
const flatPanel = (g, img, c, hw, hh, glow = CORAL) => { obox(g, c, [hw + 0.2, hh + 0.2, 0.15], '#140A1C', {}, { spec: 0.2 }); texQuad(g, img, [c[0] - hw, c[1] + hh, c[2] - 0.17], [c[0] + hw, c[1] + hh, c[2] - 0.17], [c[0] - hw, c[1] - hh, c[2] - 0.17]); pool(g, B, c[0], -0.4, c[2] - 3, 6, glow, 0.14); };

// ---------- the online stage: the board alone in a warm sunset space (a sun far behind, a gold grid below), Levy's
// webcam left and the Fan God's right behind Black's side; panel draws a flat LED panel there instead ----------
const CAMPOS = { lev: [[0.6, 4.6, 11.2], 0.16], fan: [[7.4, 4.6, 11.2], -0.16] };
function onlineStage(g, t, { pieces, under = null, over = null, cams = null, names = null, nameU = 1, camA = 1, panel = null } = {}) {
  sunsetSky(g);
  sun(g, [4, 3, 90], 7);
  g.save(); g.strokeStyle = rgba(GOLD, 0.16); g.lineWidth = 2; g.beginPath();
  for (let i = -24; i <= 32; i += 2) { line3(g, [i, -3, -24], [i, -3, 60]); }
  for (let i = -24; i <= 60; i += 2) line3(g, [-24, -3, i], [32, -3, i]);
  g.stroke(); g.restore();
  spotCone(g, B, { top: [-2, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.06, dust: 18, t, seed: 4, color: '#FFE2B0' });
  spotCone(g, B, { top: [10, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.05, dust: 14, t, seed: 9, color: '#9FF0E6' });
  const back = () => {
    if (panel) panel(g);
    if (!cams || camA <= 0) return;
    for (const who of ['lev', 'fan']) {
      const [c, ry] = CAMPOS[who], o = cams[who] || {};
      camPanel(g, camTex(who, o.e || 'neutral', t, o), c, 2.5, 3.0, ry, { glow: CAMLOOK[who].glow, a: camA });
    }
  };
  if (B.E[2] < 11) back();
  pool(g, B, 4, -0.4, 4, 10, '#FFD9A8', 0.2);
  B.drawSlab(g, GREEN);
  if (under) under(g);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 });
  if (over) over(g);
  if (B.E[2] >= 11) back();
  if (names) { tag3(g, 4, 0.3, 9.0, names[1], FAN_C, nameU); tag3(g, 4, 0.3, -0.9, names[0], LEVY_C, nameU); }
  lowKey(g, { cy: H * 0.46, a: 0.16 });
}

// ---------- rooms by day: Levy's stream room (warm white walls, a big window on New York, a ring light, books and a
// plant) and Dadang's living room in Indonesia (mint walls, ceramic tiles, a window on palms and a ceiling fan).
// The person sits at z -1.4 facing +z; the monitor (or the laptop) faces him ----------
const MON = { x: 4, y: 2.7, z: 3.5, hw: 1.9, hh: 1.07 };
const MONC = makeCanvas(1280, 720), monx = MONC.getContext('2d');
// the monitor: a page with a whole 9:16 frame of another scene in the middle (the camera pushes into it)
function monitorScreen(feed, { title = 'CHESS.COM · LIVE · 10 MIN', left = null } = {}) {
  const x = monx, w = 1280, h = 720;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  x.fillStyle = '#2B2A27'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1F1E1B'; x.fillRect(0, 0, w, 44);
  x.font = sans(22, 800); x.letterSpacing = '4px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(255,243,224,0.6)'; x.fillText(title, 24, 23);
  for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(255,243,224,0.06)'; x.fillRect(880, 80 + i * 64, 360, 46); x.fillStyle = 'rgba(255,243,224,0.22)'; x.fillRect(900, 96 + i * 64, 70 + (i * 37) % 60, 14); x.fillRect(1060, 96 + i * 64, 60 + (i * 53) % 70, 14); }
  if (left) left(x); else { x.fillStyle = 'rgba(255,243,224,0.06)'; x.fillRect(40, 80, 360, 560); }
  x.drawImage(feed, 437.5, 0, 405, 720);
  return MONC;
}
// the window on New York by day
const NYC = tex(1024, 768, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6EC0F0'); gr.addColorStop(1, '#D8F1FF'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const r = rng(5);
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 18; i++) {
    const bw = 40 + r() * 70, bh = (layer ? 160 : 260) + r() * (layer ? 260 : 380), bx = r() * w, c = layer ? '#8FA7BE' : '#B7C9D9';
    x.fillStyle = c; x.fillRect(bx, h - bh, bw, bh); x.fillStyle = mix(c, '#FFFFFF', 0.35); x.fillRect(bx, h - bh, bw * 0.3, bh);
    x.fillStyle = 'rgba(40,60,90,0.25)'; for (let yy = h - bh + 12; yy < h - 6; yy += 18) x.fillRect(bx + 4, yy, bw - 8, 3);
  }
  x.strokeStyle = '#F4F1EA'; x.lineWidth = 22; x.strokeRect(0, 0, w, h); x.lineWidth = 12; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
});
// the window on the tropics: a bright sky, palms, the red tile roof next door
const TROPIC = tex(1024, 768, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4FB8EE'); gr.addColorStop(1, '#E6F8FF'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.85)'; for (const [cx, cy, s] of [[220, 150, 1], [700, 110, 0.8]]) { x.beginPath(); x.ellipse(cx, cy, 120 * s, 40 * s, 0, 0, 7); x.ellipse(cx + 60 * s, cy - 24 * s, 70 * s, 40 * s, 0, 0, 7); x.fill(); }
  x.fillStyle = '#C0562E'; x.beginPath(); x.moveTo(0, h * 0.78); x.lineTo(w * 0.45, h * 0.6); x.lineTo(w * 0.62, h * 0.78); x.closePath(); x.fill();
  x.fillStyle = '#E9D9BC'; x.fillRect(0, h * 0.78, w, h * 0.22);
  const palm = (bx, by, s) => {
    x.strokeStyle = '#6B4A2A'; x.lineWidth = 16 * s; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + 30 * s, by - 200 * s, bx + 10 * s, by - 380 * s); x.stroke();
    x.fillStyle = '#2F8A4A'; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5; x.save(); x.translate(bx + 10 * s, by - 380 * s); x.rotate(a); x.beginPath(); x.ellipse(0, -90 * s, 22 * s, 100 * s, 0, 0, 7); x.fill(); x.restore(); }
  };
  palm(800, h, 1.1); palm(140, h, 0.9);
  x.strokeStyle = '#F7F2E8'; x.lineWidth = 22; x.strokeRect(0, 0, w, h); x.lineWidth = 12; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
});
// the screen's light on a face, a sun patch on the floor
function room(g, { wall, floor, tile, win, winC, base }) {
  const E = B.E;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) tiled(g, [-8, FLOOR_Y, -9], [24, 0, 0], [0, 0, 19], { color: floor, grout: 'rgba(60,40,20,0.22)', tu: tile, tv: tile < 1.5 ? 19 : tile });
  const wl = { color: wall, grout: 'rgba(0,0,0,0.05)', tu: 24, tv: 20 };
  if (E[2] < 10) tiled(g, [-8, FLOOR_Y, 10], [24, 0, 0], [0, 16, 0], wl);
  if (E[2] > -9) { tiled(g, [16, FLOOR_Y, -9], [-24, 0, 0], [0, 16, 0], wl); texQuad(g, win, [winC + 4.5, 10.5, -8.95], [winC - 4.5, 10.5, -8.95], [winC + 4.5, 3.2, -8.95]); }
  if (E[0] > -8) tiled(g, [-8, FLOOR_Y, -9], [0, 0, 19], [0, 16, 0], { ...wl, color: mix(wall, '#000000', 0.06) });
  if (E[0] < 16) tiled(g, [16, FLOOR_Y, 10], [0, 0, -19], [0, 16, 0], { ...wl, color: mix(wall, '#000000', 0.06) });
  // daylight: the window's glow on the wall round it and its patch on the floor
  pool(g, B, winC, 6.8, -8.9, 9, '#FFF4D6', 0.3, true);
  pool(g, B, winC + 1, FLOOR_Y + 0.02, -4.5, 7, '#FFE6B0', 0.22);
}
function ringLight(g, c, r, t) {
  cylinder(g, [c[0], FLOOR_Y, c[2]], [c[0], c[1] - r, c[2]], 0.07, '#2A2A2E', { n: 8 });
  if (depth(...c) < 0.8) return;
  g.save(); g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(3, B.project(...c).s * 0.22); g.shadowColor = '#FFF6E0'; g.shadowBlur = 30; g.beginPath();
  for (let i = 0; i < 32; i++) { const a = i / 32 * 6.2832, b2 = (i + 1) / 32 * 6.2832; line3(g, [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]], [c[0] + Math.cos(b2) * r, c[1] + Math.sin(b2) * r, c[2]]); }
  g.stroke(); g.restore();
  const p = B.project(...c); rim(g, p.x, p.y, p.s * r * 2.4, '#FFF6E0', 0.18);
}
function plant(g, x, z, s = 1) {
  lathe(g, x, z, [[FLOOR_Y, 0.55 * s, 0.55 * s], [FLOOR_Y + 1.6 * s, 0.75 * s, 0.75 * s]], '#C8643A', { n: 18 });
  for (const [dx, dy, dz, r] of [[0, 2.6, 0, 1.1], [-0.6, 2.1, 0.2, 0.8], [0.6, 2.2, -0.1, 0.85], [0.1, 3.3, 0.1, 0.75]]) {
    if (depth(x + dx * s, FLOOR_Y + dy * s, z + dz * s) < 0.8) continue;
    const p = B.project(x + dx * s, FLOOR_Y + dy * s, z + dz * s), R = p.s * r * s, gr = g.createRadialGradient(p.x - R * 0.3, p.y - R * 0.4, R * 0.1, p.x, p.y, R);
    gr.addColorStop(0, '#6FC46A'); gr.addColorStop(1, '#2C7A3E'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.fill();
  }
}
function shelf(g, x0, x1, y, z) {
  ab(g, [x0, y - 0.15, z - 0.9], [x1, y, z], '#A8784C');
  const r = rng(Math.round(x0 * 10 + y)), cols = ['#C8323A', '#2EC4B6', '#FFC857', '#4A5A8A', '#E9E2D2', '#7A4A8A'];
  for (let x = x0 + 0.2; x < x1 - 0.4;) { const bw = 0.25 + r() * 0.2, bh = 0.9 + r() * 0.6; ab(g, [x, y, z - 0.75], [x + bw, y + bh, z - 0.1], cols[Math.floor(r() * cols.length)]); x += bw + 0.04; }
}
const PANELK = { yaw: 0, pitch: 0, dist: 1.672, fov: 1500, cy: H * 0.5, target: [MON.x, MON.y, MON.z] };  // the 9:16 window of the screen fills the frame
// Levy's room. side: the account tiles beside him (u 0..1 visible, lock 0..1 the padlocks snapped)
function levyRoom(g, t, { screen, e = 'focus', over = null, tiles = null } = {}) {
  const E = B.E;
  room(g, { wall: '#EFE4D3', floor: '#B98556', tile: 0.9, win: NYC, winC: 2, base: '#DDEBF5' });
  if (E[0] < 15.9) shelf(g, 12.5, 15.9, 5.5, 2); if (E[0] < 15.9) shelf(g, 12.5, 15.9, 8.2, 2);
  plant(g, -6, -7);
  ringLight(g, [9.2, 5.4, 2.8], 1.3, t);
  const front = E[2] > -1.4;
  chair(g, B, 4, -1.9, { face: 1, color: '#3A3A44' });
  const monitor = () => {
    cylinder(g, [4, -0.35, 3.9], [4, 1.7, 3.9], 0.14, '#2A2A30', { n: 12 }); ab(g, [3.1, -0.35, 3.5], [4.9, -0.28, 4.3], '#2A2A30');
    ab(g, [MON.x - MON.hw - 0.12, MON.y - MON.hh - 0.12, MON.z], [MON.x + MON.hw + 0.12, MON.y + MON.hh + 0.12, MON.z + 0.22], '#18181C', { spec: 0.3 });
    if (E[2] < MON.z) texQuad(g, screen, [MON.x - MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x + MON.hw, MON.y + MON.hh, MON.z - 0.01], [MON.x - MON.hw, MON.y - MON.hh, MON.z - 0.01], { under: false });
    cylinder(g, [1.2, -0.35, 1.6], [1.2, 1.5, 1.6], 0.05, '#222', { n: 8 }); cylinder(g, [1.2, 1.5, 1.6], [1.2, 2.4, 1.3], 0.3, '#2A2A30', { n: 14, spec: 0.5 });  // the microphone
  };
  const desk = () => {
    for (const [x, z] of [[-1.8, -0.4], [9.8, -0.4], [-1.8, 4.4], [9.8, 4.4]]) ab(g, [x - 0.12, FLOOR_Y, z - 0.12], [x + 0.12, -0.75, z + 0.12], '#E9E4DA');
    ab(g, [-2, -0.75, -0.6], [10, -0.35, 4.6], '#F4F0E8', { spec: 0.2 });
    ab(g, [2.6, -0.35, 0.2], [5.4, -0.28, 1.0], '#2A2A30', { spec: 0.3 }); ab(g, [6.2, -0.35, 0.4], [6.6, -0.25, 0.9], '#2A2A30', { spec: 0.4 });
    lathe(g, 8.2, 1.6, [[-0.35, 0.28, 0.28], [0.25, 0.3, 0.3]], CORAL, { n: 16, spec: 0.3 });
  };
  if (!front) monitor();
  const hb = seated(g, B, 'lev', e, t, { x: 4, z: -1.4, face: 1, side: 1 });
  if (front) { const p = B.project(4, 3.1, -1.4); if (depth(4, 3.1, -1.4) > 0.8) rim(g, p.x, p.y, p.s * 1.6, '#FFE6C0', 0.14); }
  desk();
  useSkin(g, 'lev'); hb();
  if (front) monitor();
  if (tiles) accountTiles(g, t, tiles);
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.1 });
}
// three account icons floating by Levy (a chat bubble, a camera, a play button), padlocks snapping onto them
function accountTiles(g, t, { u = 1, lock = 0 }) {
  const P = [[7.0, 6.3, 0.3], [7.3, 3.9, 0.5], [7.0, 1.5, 0.3]];
  P.forEach((c, i) => {
    const a = clamp(u * 3 - i * 0.6); if (a <= 0 || depth(...c) < 0.8) return;
    const p = B.project(...c), s = p.s * 0.95 * ease.back(clamp(a * 1.4)), lk = clamp(lock * 3 - i * 0.7);
    g.save(); g.globalAlpha *= clamp(a * 2); g.translate(p.x, p.y);
    g.fillStyle = lk > 0.5 ? '#5A5560' : [LEVY_C, CORAL, TEAL][i]; g.beginPath(); g.roundRect(-s, -s, 2 * s, 2 * s, s * 0.35); g.fill();
    g.fillStyle = '#FFFFFF'; g.strokeStyle = '#FFFFFF'; g.lineWidth = s * 0.12;
    if (i === 0) { g.beginPath(); g.roundRect(-s * 0.55, -s * 0.45, s * 1.1, s * 0.75, s * 0.2); g.fill(); g.beginPath(); g.moveTo(-s * 0.3, s * 0.25); g.lineTo(-s * 0.45, s * 0.6); g.lineTo(0, s * 0.28); g.fill(); }
    else if (i === 1) { g.beginPath(); g.roundRect(-s * 0.55, -s * 0.4, s * 1.1, s * 0.8, s * 0.25); g.stroke(); g.beginPath(); g.arc(0, 0, s * 0.22, 0, 7); g.stroke(); }
    else { g.beginPath(); g.moveTo(-s * 0.25, -s * 0.4); g.lineTo(s * 0.45, 0); g.lineTo(-s * 0.25, s * 0.4); g.closePath(); g.fill(); }
    if (lk > 0) {  // the padlock drops in and its shackle snaps shut
      const dy = (1 - ease.out(clamp(lk * 1.5))) * -s * 1.5, sh = (1 - clamp(lk * 2 - 1)) * s * 0.25;
      g.translate(s * 0.75, s * 0.7 + dy);
      g.strokeStyle = '#E8B33A'; g.lineWidth = s * 0.16; g.beginPath(); g.arc(0, -s * 0.38 - sh, s * 0.3, Math.PI, 0); g.lineTo(s * 0.3, -s * 0.2 - sh); g.moveTo(-s * 0.3, -s * 0.38 - sh); g.lineTo(-s * 0.3, -s * 0.2); g.stroke();
      const gr = g.createLinearGradient(0, -s * 0.3, 0, s * 0.45); gr.addColorStop(0, '#FFD65A'); gr.addColorStop(1, '#C88A1A');
      g.fillStyle = gr; g.beginPath(); g.roundRect(-s * 0.5, -s * 0.3, s, s * 0.75, s * 0.14); g.fill();
      g.fillStyle = '#5A3A08'; g.beginPath(); g.arc(0, 0, s * 0.1, 0, 7); g.fill(); g.fillRect(-s * 0.04, 0, s * 0.08, s * 0.2);
    }
    g.restore();
  });
}
// message bubbles flying in at Levy's head from every side; every third red with a warning sign (no real words)
function storm(g, t, t0, { n = 26, red = 0, target = [4, 3.4, -1.4] } = {}) {
  // laid out on the screen round his head (its size sets the scale): they fly in from the sides and stop beside the
  // face, never over it
  if (depth(...target) < 0.8) return;
  const r = rng(21), c = B.project(...target), S = c.s, L = [];
  for (let i = 0; i < n; i++) {
    const sd = i % 2 ? 1 : -1, st = t0 + i * 0.06 + r() * 0.2, dur = 1.1 + r() * 0.5;
    const to = [sd * (1.75 + r() * 1.15), -1.4 + r() * 2.7], from = [to[0] + sd * (4 + r() * 3), to[1] + (r() - 0.5) * 4], sz = 0.4 + r() * 0.16;
    const u = (t - st) / dur; if (u <= 0) continue;
    const e = ease.out(Math.min(1, u));
    L.push([i, c.x + lerp(from[0], to[0], e) * S, c.y + lerp(from[1], to[1], e) * S, sz * S, i % 3 === 0 && red > 0]);
  }
  L.forEach(([i, x, y, s, bad]) => {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 3 + i) * 0.08);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.roundRect(-s * 1.1 + s * 0.08, -s * 0.6 + s * 0.1, s * 2.2, s * 1.2, s * 0.3); g.fill();
    g.fillStyle = bad ? '#D9302A' : '#FFFFFF'; g.beginPath(); g.roundRect(-s * 1.1, -s * 0.6, s * 2.2, s * 1.2, s * 0.3); g.fill();
    g.beginPath(); g.moveTo(-s * 0.6, s * 0.55); g.lineTo(-s * 0.85, s * 0.95); g.lineTo(-s * 0.2, s * 0.55); g.fill();
    if (bad) { g.fillStyle = '#FFFFFF'; g.font = sans(Math.round(s * 1.0), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⚠', 0, s * 0.04); }
    else { g.fillStyle = 'rgba(40,30,50,0.35)'; for (let j = 0; j < 3; j++) g.fillRect(-s * 0.8, -s * 0.32 + j * s * 0.26, s * (1.6 - (j === 2 ? 0.6 : 0)), s * 0.12); }
    g.restore();
  });
}

// the ceiling fan: a rod from the ceiling, a hub, four wooden blades turning; a blur disc when it spins fast
function ceilingFan(g, [x, y, z], ang, { spin = 0 } = {}) {
  cylinder(g, [x, y + 0.2, z], [x, y + 3.2, z], 0.08, '#E9E4DA', { n: 8 });
  const blades = [0, 1, 2, 3].map(i => { const a = ang + i * Math.PI / 2, c = [x + Math.cos(a) * 1.9, y, z + Math.sin(a) * 1.9]; return [depth(...c), () => obox(g, c, [1.45, 0.05, 0.36], '#9A6A3E', { ry: -a }, { spec: 0.2 })]; });
  blades.sort((a, b) => b[0] - a[0]);
  const blur = clamp((spin - 4) / 10);
  g.save(); g.globalAlpha *= 1 - 0.7 * blur; blades.forEach(([, f]) => f()); g.restore();
  if (blur > 0) {
    g.save(); g.fillStyle = `rgba(154,106,62,${(0.35 * blur).toFixed(3)})`; g.beginPath();
    for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.2832, p = B.project(x + Math.cos(a) * 3.3, y, z + Math.sin(a) * 3.3); g[i ? 'lineTo' : 'moveTo'](p.x, p.y); }
    g.fill(); g.restore();
  }
  lathe(g, x, z, [[y - 0.35, 0.3, 0.3], [y + 0.1, 0.5, 0.5], [y + 0.25, 0.25, 0.25]], '#F2EEE6', { n: 18, spec: 0.4 });
}
// the laptop on the low table: its lid faces the sitter (-z)
function laptop(g, c, img) {
  ab(g, [c[0] - 1.2, c[1], c[2] - 0.8], [c[0] + 1.2, c[1] + 0.08, c[2] + 0.6], '#C9CDD2', { spec: 0.4 });
  const tl = [c[0] - 1.2, c[1] + 1.6, c[2] + 0.75], tr = [c[0] + 1.2, c[1] + 1.6, c[2] + 0.75], bl = [c[0] - 1.2, c[1] + 0.08, c[2] + 0.6];
  if (B.E[2] < c[2] + 0.6) texQuad(g, img, tl, tr, bl);
  else quad(g, [tl, tr, [tr[0], bl[1], bl[2]], bl], '#B9BEC4');
}
const LAPTOP = tex(640, 400, (x, w, h) => { x.fillStyle = '#2B2A27'; x.fillRect(0, 0, w, h); const s = 40; for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { x.fillStyle = (r + f) % 2 ? GREEN.dark : GREEN.light; x.fillRect(160 + f * s, 40 + r * s, s, s); } });
// Dadang's living room: him at the laptop on a low table, the ceiling fan over him, his son (son: true) standing right
function dadangHome(g, t, { e = 'neutral', son = false, sonE = 'neutral', fanSpin = 3, over = null, phone = 0 } = {}) {
  const E = B.E;
  room(g, { wall: '#86D2BF', floor: '#EADBC2', tile: 2, win: TROPIC, winC: 6, base: '#FFF0D6' });
  if (E[2] > -9) {  // a framed picture and a wall clock
    ab(g, [-5.2, 5.2, -8.95], [-1.8, 8.2, -8.8], '#7A4A2A'); ab(g, [-4.9, 5.5, -8.97], [-2.1, 7.9, -8.79], '#E9C9A0');
    lathe(g, -3.5, -8.85, [[9.2, 0, 0], [9.21, 0.7, 0.7]], '#FFFFFF', { n: 20 });
  }
  if (E[2] > -9 && E[0] < 15) { ab(g, [-8, FLOOR_Y, -9], [16, FLOOR_Y + 1.6, -8.85], '#5DB8A4'); }
  plant(g, 13.5, -6.5, 1.2);
  ceilingFan(g, [4, 12.6, 0.5], t * fanSpin, { spin: fanSpin });
  const front = E[2] > -1.4;
  const tbl = () => { ab(g, [-0.5, FLOOR_Y, 0.6], [8.5, -0.9, 4.2], '#8A5A34', { spec: 0.15 }); ab(g, [-0.7, -0.9, 0.4], [8.7, -0.6, 4.4], '#A56E40', { spec: 0.25 }); laptop(g, [4, -0.6, 1.8], LAPTOP); lathe(g, 7.2, 2.6, [[-0.6, 0.3, 0.3], [0.1, 0.34, 0.34]], '#F2EEE6', { n: 14, spec: 0.3 }); };
  if (!front) tbl();
  const hb = seated(g, B, 'dad', e, t, { x: 4, z: -1.4, face: 1, side: 1, hands: false });
  if (son) standing(g, 'son', 10.2, -0.4, { e: sonE, t, face: 1, free: phone > 0 ? 1 : null });
  if (son && phone > 0) heldPhone(g, 'son', 10.2, -0.4, 1, phone);  // the phone in his raised hand, its screen lit
  if (front) tbl();
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.1 });
}
// a big phone in the air: the son's post on its screen
function postTex(u, hearts) {
  const k = Math.round(clamp(u) * 4);
  return once(`post:${k}:${hearts}`, 600, 1100, (x, w, h) => {
    x.fillStyle = '#FAF6EF'; x.fillRect(0, 0, w, h);
    x.fillStyle = TEAL; x.fillRect(0, 0, w, 110);
    x.fillStyle = '#FFFFFF'; x.font = sans(40, 900); x.letterSpacing = '4px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('POST', w / 2, 62);
    x.fillStyle = '#C9D5D2'; x.beginPath(); x.arc(90, 200, 50, 0, 7); x.fill(); x.fillStyle = '#9AAAA6'; x.beginPath(); x.arc(90, 186, 20, 0, 7); x.fill(); x.beginPath(); x.ellipse(90, 232, 32, 20, 0, Math.PI, 0); x.fill();
    x.textAlign = 'left'; x.fillStyle = '#2B2530'; x.font = sans(36, 900); x.letterSpacing = '1px'; x.fillText('His son', 165, 186); x.fillStyle = '#8A8590'; x.font = sans(26, 700); x.fillText('Indonesia · March 2021', 165, 226);
    x.fillStyle = '#2B2530'; x.font = sans(52, 900); x.letterSpacing = '0px';
    const lines = ['My father is', 'a strong player.', 'His account', 'was blocked', 'unfairly.'];
    lines.forEach((l, i) => { if (i < [0, 2, 2, 5, 5][k]) x.fillText(l, 50, 350 + i * 76); });
    x.fillStyle = 'rgba(43,37,48,0.1)'; x.fillRect(40, 780, w - 80, 3);
    x.font = sans(48, 900); x.fillStyle = hearts ? '#E8413A' : '#B8B0BA'; x.fillText('♥', 60, 860); x.fillStyle = hearts ? TEAL : '#B8B0BA'; x.fillText('↗', 250, 860); x.fillStyle = '#B8B0BA'; x.fillText('💬', 420, 860);
  });
}
function bigPhone(g, c, img, { ry = 0, rx = 0, s = 1 } = {}) {
  const hw = 1.6 * s, hh = 2.95 * s;
  obox(g, c, [hw + 0.18 * s, hh + 0.22 * s, 0.14 * s], '#15161A', { ry, rx }, { spec: 0.5 });
  const R = rot3([1, 0, 0], { ry, rx }), U = rot3([0, 1, 0], { ry, rx }), N = rot3([0, 0, -1], { ry, rx });
  const P = (u, v) => [c[0] + R[0] * u + U[0] * v + N[0] * 0.16 * s, c[1] + R[1] * u + U[1] * v + N[1] * 0.16 * s, c[2] + R[2] * u + U[2] * v + N[2] * 0.16 * s];
  if (vdot(N, vsub(B.E, c)) > 0) texQuad(g, img, P(-hw, hh), P(hw, hh), P(-hw, -hh));
}
// hearts and share arrows bursting out of a point (the post going viral)
function burst(g, c, t, t0, { n = 30, seed = 4 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const st = t0 + r() * 0.8, u = (t - st) / 1.3; if (u <= 0 || u >= 1) { r(); r(); r(); continue; }
    const a = r() * 6.2832, el = (r() - 0.5) * 2, sp = 5 + r() * 6;
    const p3 = [c[0] + Math.cos(a) * sp * ease.out(u), c[1] + el * sp * 0.6 * ease.out(u) + u * 1.5, c[2] + Math.sin(a) * sp * 0.5 * ease.out(u) - 1];
    if (depth(...p3) < 0.8) continue;
    const p = B.project(...p3);
    g.save(); g.globalAlpha *= 1 - u; g.font = sans(Math.round(p.s * 0.9), 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = i % 3 ? '#FF5A6A' : TEAL; g.fillText(i % 3 ? '♥' : '↗', p.x, p.y); g.restore();
  }
}

// ---------- the Jakarta studio by day: white walls with red slats, a glossy light floor, a round red rug, softboxes,
// an LED wall behind Black's side (z 15) and a wall with an ON AIR sign behind White's (z -10); the match table in the
// middle (Dadang White at z -1.4, Irene Black at z 9.3), Deddy standing on the left ----------
function jktWallTex(mode) {
  return once('jw:' + mode, 1280, 640, (x, w, h) => {
    const base = mode === 'score3' || mode === 'perf' ? '#7A1E22' : '#8A1E2A';
    const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7); gr.addColorStop(0, mix(base, '#FFFFFF', 0.08)); gr.addColorStop(1, mix(base, '#000000', 0.55));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const line = (text, y, size, col, sp = 8, weight = 900, maxW = 440) => { x.letterSpacing = `${sp}px`; fitFont(x, text, size, maxW, weight); x.fillStyle = col; x.fillText(text, w / 2, y); };
    if (mode === 'event') {
      line('DEWA KIPAS', h * 0.13, 92, '#FFB59A', 8); line('VS', h * 0.28, 64, CREAM, 10); line('IRENE', h * 0.43, 92, '#9FF3E8', 10);
      line('JAKARTA · MARCH 22, 2021', h * 0.58, 30, GOLD, 6, 800);
    } else if (mode.startsWith('score')) {
      const n = +mode.slice(5);
      line('IRENE', h * 0.1, 50, '#9FF3E8', 10); x.shadowColor = GOLD; x.shadowBlur = n >= 3 ? 40 : 0; line(`${n} – 0`, h * 0.33, 180, n >= 3 ? GOLD : CREAM, 8); x.shadowBlur = 0;
      line('DEWA KIPAS', h * 0.56, 44, '#FFB59A', 8);
    } else if (mode === 'perf') {
      line('PERFORMANCE', h * 0.1, 50, CREAM, 10); x.shadowColor = CORAL; x.shadowBlur = 40; line('1127', h * 0.34, 190, '#FFB59A', 8); x.shadowBlur = 0;
      line('BY CHESS.COM', h * 0.57, 40, GOLD, 8, 800);
    } else if (mode === 'blank') {  // the studio's idle loop: a big knight, no words
      x.globalAlpha = 0.5; drawPiece(x, 'n', 'w', w / 2, h * 0.36, 380, {}); x.globalAlpha = 1;
    }
    ledGrid(x, w, h, 6);
  });
}
const STUDIOSIGN = tex(512, 160, (x, w, h) => { x.fillStyle = '#2A0E10'; x.fillRect(0, 0, w, h); x.font = sans(84, 900); x.letterSpacing = '10px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#FF4A3A'; x.shadowColor = '#FF4A3A'; x.shadowBlur = 30; x.fillText('ON AIR', w / 2, h / 2 + 4); });
function softbox(g, x, z, face) {
  cylinder(g, [x, FLOOR_Y, z], [x, 7, z], 0.08, '#2A2A30', { n: 8 });
  ab(g, [x - 1.3, 7, z - 0.25], [x + 1.3, 10, z + 0.25], '#F7F4EE', { amb: 0.95 });
  if (depth(x, 8.5, z) > 0.8) { const p = B.project(x, 8.5, z); rim(g, p.x, p.y, p.s * 4, '#FFF8EA', 0.25); }
}
function jktStudio(g, t, { wall = 'event', wall2 = null, wallU = 0, ded = false, dedE = 'happy', tab = {}, over = null } = {}) {
  const E = B.E;
  g.fillStyle = '#F4EFE8'; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) {
    tiled(g, [-16, FLOOR_Y, -10], [40, 0, 0], [0, 0, 25.4], { color: '#DCD6CE', grout: 'rgba(80,60,50,0.08)', tu: 3 });
    g.save(); g.fillStyle = '#C8323A'; g.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.2832, p = B.project(4 + Math.cos(a) * 9, FLOOR_Y + 0.01, 4 + Math.sin(a) * 8); g[i ? 'lineTo' : 'moveTo'](p.x, p.y); } g.fill(); g.restore();
    pool(g, B, 4, FLOOR_Y + 0.02, 4, 10, '#FFFFFF', 0.12);
  }
  const wl = { color: '#F2EEE8', grout: 'rgba(200,50,58,0.5)', tu: 2.2, tv: 30, lw: 6 };
  if (E[2] < 15.4) {
    tiled(g, [-16, FLOOR_Y, 15.4], [40, 0, 0], [0, 18, 0], wl);
    ab(g, [-8.6, FLOOR_Y, 15], [16.6, 12.4, 15.4], '#1A1214');
    for (const [m, a] of [[wall, 1], [wall2, wallU]]) if (m && a > 0) texQuad(g, jktWallTex(m), [-8, 11.8, 14.97], [16, 11.8, 14.97], [-8, -0.2, 14.97], { a, under: a >= 1 });
    pool(g, B, 4, FLOOR_Y + 0.02, 11, 12, '#FF6A5A', 0.12);
  }
  if (E[2] > -10) { tiled(g, [24, FLOOR_Y, -10], [-40, 0, 0], [0, 18, 0], wl); texQuad(g, STUDIOSIGN, [6, 12, -9.97], [2, 12, -9.97], [6, 10.75, -9.97]); }
  if (E[0] > -16) tiled(g, [-16, FLOOR_Y, -10], [0, 0, 25.4], [0, 18, 0], wl);
  if (E[0] < 24) tiled(g, [24, FLOOR_Y, 15.4], [0, 0, -25.4], [0, 18, 0], wl);
  for (const [x, z] of [[-9, 12], [17, 12], [-9, -5], [17, -5]]) if (depth(x, 5, z) > 1) softbox(g, x, z);
  const dd = () => { if (ded) standing(g, 'ded', -3.6, 3.2, { e: dedE, t, face: -1 }); };
  if (E[2] > 3.2) dd();
  tableSet(g, t, { white: 'dad', black: 'ire', tableCol: ['#C99A68', '#8A6440', '#A87E52'], ...tab });
  if (E[2] <= 3.2) dd();
  spotCone(g, B, { top: [4, 17, 4], base: [4, -0.35, 4], r0: 0.4, r1: 5, a: 0.05, dust: 12, t, seed: 6, color: '#FFF6E0' });
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.1 });
}

// ---------- Jakarta at sunset: blocks of towers round the National Monument (the obelisk with the gold flame), a
// billboard over the city with the live viewer counter ----------
const MONAS = [24, 56];  // the National Monument, to the right of the billboard
const CITYB = (() => {
  const r = rng(31), L = [];
  for (let gx = -6; gx <= 7; gx++) for (let gz = 0; gz <= 11; gz++) {
    const x = gx * 9 + (r() - 0.5) * 3, z = 12 + gz * 9 + (r() - 0.5) * 3;
    if ((Math.abs(x - MONAS[0]) < 11 && Math.abs(z - MONAS[1]) < 11) || (Math.abs(x - 4) < 11 && z < 40)) { r(); r(); r(); continue; }  // the square round the monument, the boulevard
    const hw = 1.6 + r() * 2, hd = 1.6 + r() * 2, h = 4 + r() ** 2 * (gz > 6 ? 36 : 22);
    L.push({ x, z, hw, hd, h, col: ['#3A2346', '#45284E', '#2E1C3C', '#523056'][Math.floor(r() * 4)], seed: Math.floor(r() * 1000) });
  }
  return L;
})();
function building(g, b) {
  ab(g, [b.x - b.hw, FLOOR_Y, b.z - b.hd], [b.x + b.hw, FLOOR_Y + b.h, b.z + b.hd], b.col, { amb: 0.6, L: vnorm([-0.6, 0.5, 0.6]) });
  if (B.E[2] > b.z - b.hd) return;
  const r = rng(b.seed), z = b.z - b.hd - 0.02;  // lit windows on the face toward the camera
  g.save();
  for (let y = FLOOR_Y + 1.2; y < FLOOR_Y + b.h - 0.8; y += 1.4) for (let x = b.x - b.hw + 0.5; x < b.x + b.hw - 0.4; x += 1.0) {
    if (r() > 0.45) continue;
    if (depth(x, y, z) < 1) continue;
    const p = B.project(x, y, z), s = p.s * 0.32; if (s < 0.6) continue;
    g.fillStyle = r() < 0.6 ? 'rgba(255,214,140,0.9)' : 'rgba(255,240,210,0.75)'; g.fillRect(p.x - s, p.y - s * 1.3, s * 2, s * 2.6);
  }
  g.restore();
}
function monas(g) {
  const [X, Z] = MONAS;
  ab(g, [X - 5, FLOOR_Y, Z - 5], [X + 5, FLOOR_Y + 2, Z + 5], '#D9CBB5', { amb: 0.6, L: vnorm([-0.6, 0.5, 0.6]) });
  lathe(g, X, Z, [[FLOOR_Y + 2, 2.2, 2.2], [FLOOR_Y + 4, 1.5, 1.5], [FLOOR_Y + 29, 0.8, 0.8], [FLOOR_Y + 30, 1.4, 1.4], [FLOOR_Y + 31, 0.9, 0.9]], '#F2E8D8', { n: 4, amb: 0.65, L: vnorm([-0.6, 0.5, 0.6]) });
  lathe(g, X, Z, [[FLOOR_Y + 31, 0.6, 0.6], [FLOOR_Y + 32.2, 0.95, 0.95], [FLOOR_Y + 33.4, 0.6, 0.6], [FLOOR_Y + 34.4, 0.05, 0.05]], '#FFC437', { n: 14, spec: 1, amb: 0.75 });
  if (depth(X, FLOOR_Y + 32.5, Z) > 1) { const p = B.project(X, FLOOR_Y + 32.5, Z); rim(g, p.x, p.y, p.s * 4, GOLD, 0.55); }
}
function counterTex(mode, v) {
  const k = mode === 'count' ? Math.round(v / 1000) : 0;
  return once(`cnt:${mode}:${k}`, 1280, 640, (x, w, h) => {
    x.fillStyle = '#160C1E'; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (mode === 'count' || mode === 'roll') {
      x.fillStyle = '#E8413A'; x.beginPath(); x.roundRect(w / 2 - 110, 50, 220, 74, 14); x.fill(); x.font = sans(48, 900); x.letterSpacing = '8px'; x.fillStyle = '#FFFFFF'; x.fillText('LIVE', w / 2 + 4, 90);
      const txt = mode === 'roll' ? '???,???' : Math.round(v).toLocaleString('en-US'), top = v >= 1250000;
      x.font = mono(190, 800); x.letterSpacing = '0px'; x.fillStyle = top ? GOLD : CREAM; x.shadowColor = top ? GOLD : CORAL; x.shadowBlur = 40; fitFont(x, txt, 190, 1160, 900); x.fillText(txt, w / 2, 330); x.shadowBlur = 0;
      x.font = sans(52, 900); x.letterSpacing = '14px'; x.fillStyle = 'rgba(255,243,224,0.8)'; x.fillText('WATCHING NOW', w / 2, 530);
    } else if (mode === 'bars') {
      x.font = sans(44, 900); x.letterSpacing = '8px'; x.fillStyle = 'rgba(255,243,224,0.85)'; x.fillText('PEAK LIVE VIEWERS', w / 2, 70);
      const by = 560, hmax = 380;
      for (const [cx, hh, col, l1, l2] of [[360, hmax / 10, 'rgba(255,243,224,0.5)', 'OLD RECORDS', '~1/10'], [880, hmax, GOLD, 'THIS MATCH', '1.25M']]) {
        x.fillStyle = col; x.fillRect(cx - 110, by - hh, 220, hh);
        x.font = sans(40, 900); x.letterSpacing = '4px'; x.fillStyle = col; x.fillText(l2, cx, by - hh - 40);
        x.font = sans(32, 800); x.fillStyle = 'rgba(255,243,224,0.7)'; x.fillText(l1, cx, by + 40);
      }
    }
    ledGrid(x, w, h, 6);
  });
}
const BILL = { c: [4, 16, 34], hw: 8, hh: 4 };
function skyline(g, t, { mode = 'roll', v = 0, mode2 = null, u2 = 0, fire = null } = {}) {
  sunsetSky(g);
  sun(g, [4, 10, 260], 22);
  if (B.E[1] > FLOOR_Y) {
    tiled(g, [-70, FLOOR_Y, -10], [140, 0, 0], [0, 0, 140], { color: '#1E1230', grout: 'rgba(255,200,140,0.06)', tu: 9 });
    g.save(); g.strokeStyle = 'rgba(255,200,120,0.45)'; g.lineWidth = 3; g.shadowColor = '#FFC878'; g.shadowBlur = 10; g.beginPath();  // the streets: lines of light
    for (let i = -6; i <= 7; i++) line3(g, [i * 9 + 4.5, FLOOR_Y + 0.02, 6], [i * 9 + 4.5, FLOOR_Y + 0.02, 120]);
    for (let j = 0; j <= 11; j++) line3(g, [-60, FLOOR_Y + 0.02, 16.5 + j * 9], [70, FLOOR_Y + 0.02, 16.5 + j * 9]);
    g.stroke(); g.restore();
  }
  const items = CITYB.filter(b => depth(b.x, FLOOR_Y + b.h / 2, b.z) > 2).map(b => [depth(b.x, FLOOR_Y + b.h / 2, b.z), () => building(g, b)]);
  items.push([depth(MONAS[0], FLOOR_Y + 12, MONAS[1]), () => monas(g)]);
  items.push([depth(...BILL.c) - 0.5, () => {
    const { c, hw, hh } = BILL;
    cylinder(g, [c[0] - hw * 0.6, FLOOR_Y, c[2] + 0.4], [c[0] - hw * 0.6, c[1] - hh, c[2] + 0.4], 0.35, '#1A1020', { n: 10 });
    cylinder(g, [c[0] + hw * 0.6, FLOOR_Y, c[2] + 0.4], [c[0] + hw * 0.6, c[1] - hh, c[2] + 0.4], 0.35, '#1A1020', { n: 10 });
    obox(g, [c[0], c[1], c[2] + 0.3], [hw + 0.3, hh + 0.3, 0.25], '#120A18', {}, { spec: 0.2 });
    for (const [m, a] of [[mode, 1], [mode2, u2]]) if (m && a > 0) texQuad(g, counterTex(m, v), [c[0] - hw, c[1] + hh, c[2] - 0.01], [c[0] + hw, c[1] + hh, c[2] - 0.01], [c[0] - hw, c[1] - hh, c[2] - 0.01], { a, under: a >= 1 });
    if (depth(...c) > 1) { const p = B.project(...c); rim(g, p.x, p.y, p.s * hw * 1.4, CORAL, 0.25); }
  }]);
  items.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
  if (fire) fire(g);
  lowKey(g, { cy: H * 0.46, a: 0.14 });
}
// fireworks over the city (the record): bursts of sparks at fixed points, each from its own time
function fireworks(g, t, t0, { n = 6, seed = 8 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const c = [4 + (r() - 0.5) * 40, 26 + r() * 14, 40 + r() * 30], st = t0 + i * 0.22, col = [GOLD, CORAL, TEAL, '#FFFFFF'][i % 4], u = (t - st) / 1.4;
    if (u <= 0 || u >= 1 || depth(...c) < 2) continue;
    const p = B.project(...c), R = p.s * 7 * ease.out(u);
    g.save(); g.globalAlpha *= (1 - u) ** 1.5; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12;
    for (let j = 0; j < 24; j++) { const a = j / 24 * 6.2832; g.beginPath(); g.arc(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R + u * u * p.s * 2, Math.max(2, p.s * 0.18), 0, 7); g.fill(); }
    g.restore(); rim(g, p.x, p.y, R * 1.2, col, 0.25 * (1 - u));
  }
}


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
  const turnedRun = r => ({ ...r, pieces: turned(r.pieces), m: r.m && { ...r.m, from: rsq(r.m.from), to: rsq(r.m.to) } });
  const halo = (pieces, ids, col, a) => pieces.map(p => ids.includes(p.id) && a > 0 ? { ...p, halo: col, haloA: a } : p);
  const kingOf = (pieces, c) => pieces.find(p => p.t === 'k' && p.c === c);

  // the cuts, in order (a shot runs to the next one)
  const lostT = w('hook', 'lost'), fanA = w('hook', 'fan') - 0.12, mateT = lostT + 0.08;
  const recA = s('record') - 0.05, mostT = w('record', 'most-watched');
  const nameA = s('name') - 0.05, accA = w('name', 'account') - 0.06, indA = w('name', 'indonesian') - 0.06, kipT = w('name', 'kipas'), fanNT = w('name', 'fan'), godNT = w('name', 'god');
  const susA = s('sus') - 0.05, hunT = w('sus', 'hundred'), elvT = w('sus', 'eleven'), daysT = w('sus', 'days'), tenA = w('sus', 'ten') - 0.06, obvT = w('sus', 'obvious'),
    ovA = w('sus', 'over') - 0.06, ninT = w('sus', 'ninety'), accT = w('sus', 'accuracy');
  const repA = s('report') - 0.05, repT = w('report', 'reported'), hrsA = w('report', 'hours') - 0.06, closedT = w('report', 'closed'), fpT = w('report', 'fair-play');
  const whoA = s('who') - 0.05, dadT = w('who', 'dadang'), denA = w('who', 'he') - 0.06, denT = w('who', 'denies');
  const sonA = s('son') - 0.05, postA = w('son', 'my') - 0.06, strT = w('son', 'strong'), unfT = w('son', 'unfair'), virA = w('son', 'went') - 0.25, virT = w('son', 'viral');
  const stormA = s('storm') - 0.05, deathT = w('storm', 'death');
  const lockA = s('lock') - 0.05, lockT = w('lock', 'locked'), condA = w('lock', 'dadang') - 0.06, condT = w('lock', 'condemned');
  const twistA = s('twist') - 0.05, dedT = w('twist', 'deddy'), fan2A = w('twist', 'fan') - 0.12, ireA = w('twist', 'international') - 0.06, ireT = w('twist', 'irene');
  const matchA = s('match') - 0.05, wonA = w('match', 'irene') - 0.06, allT = w('match', 'all'), thr3T = w('match', 5), perfA = w('match', 'his') - 0.06, prfT = w('match', 'performance'), elT = w('match', 'eleven');
  const peakA = s('peak') - 0.05, milT = w('peak', 'million'), tenxA = w('peak', 'ten') - 0.06, timesT = w('peak', 'times');
  const levyA = s('levy') - 0.05, peopleA = w('levy', 'people') - 0.06, caughtT = w('levy', 'caught');
  const ctaA = s('cta') - 0.05, realT = w('cta', 'real'), comT = w('cta', 'comment'), numT = w('cta', 'number');

  // ======================= HOOK (rule 42): Levy's webcam and the Fan God's (a desk fan) over the board; mate =======================
  const hookAt = t => runTo(LV, LVEND - 2, [0.32, mateT], t);
  const hookCams = (t, o = {}) => ({ lev: { e: t >= mateT + 0.1 ? 'shock' : 'focus', shake: t >= mateT + 0.1 && t < mateT + 0.6 ? 0.3 : 0 }, fan: { spin: 7, ...o } });
  const kSq = r => kingOf(r.pieces, 'w')?.sq || 'h3';
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 0.3, 19.5, [4, 3.4, 6.5])], [len(sh), K(0.0, 0.26, 16.8, [4, 3.4, 6.6])]], { t, e: lin, bump: t > mateT && t < mateT + 0.3 ? 1.3 : 0 });
    const r = hookAt(t), mated = t >= mateT;
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1'], RED, seg(t, mateT, mateT + 0.2, lin)), cams: hookCams(t),
      under: g2 => { moveFx(r).under(g2); if (mated) ledGlow(g2, B, kSq(r), RED, t, mateT, { reach: 1.2 }); },
      over: g2 => { moveFx(r).over(g2); impact(g2, kSq(r), t, mateT, { flash: 0.35 }); } });
  }, { hud: (g, lt, t) => {
    coverTitle(g, 'GOTHAMCHESS LOST TO', 'THE FAN GOD', 205, { a: 1 - seg(t, fanA - 0.15, fanA + 0.05, lin) });
    // the result under the title, not on the board's side over the engraving
    if (t >= mateT + 0.1) badge(g, '0 – 1', W / 2, 470, { color: RED, size: 60, ...pop(t, mateT + 0.1) });
  } });
  shot(fanA, (g, lt, t, sh) => {
    const [c] = CAMPOS.fan;
    rig(B, lt, [[0, K(-0.3, 0.06, 10.5, [c[0] - 0.4, c[1], c[2]])], [len(sh), K(-0.2, 0.04, 8.2, [c[0] - 0.2, c[1] + 0.1, c[2]])]], { t });
    onlineStage(g, t, { pieces: [], cams: hookCams(t, { spin: lerp(7, 18, seg(t, fanA, recA, lin)) }) });
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, 'THE FAN GOD', W / 2, 230, { color: CORAL, size: 64, ...pop(t, fanA + 0.08) }) });
  cue(0, 'whoosh_soft', 0.2); cue(0.05, 'whirr', 0.25); landCue(0.32, false, 0.45);
  cue(mateT - 0.3, 'revswell', 0.55); boom(mateT, 0.9); cue(mateT, 'hit_punch', 0.4); landCue(mateT, true, 0.6); cue(mateT + 0.15, 'gasp', 0.3);
  cue(fanA - 0.06, 'whoosh_fast', 0.3); cue(fanA + 0.05, 'whirr', 0.4); cue(fanA + 0.1, 'shimmer', 0.3);

  // ======================= THREE WEEKS LATER: the city at sunset, the counter rolling =======================
  shot(recA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.08, 0.02, 52, [4, 14, 34])], [len(sh), K(0.0, 0.08, 34, [4, 16, 34])]], { t, e: lin });
    skyline(g, t, { mode: 'roll', fire: g2 => fireworks(g2, t, mostT - 0.2) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < mostT - 0.05) heading(g, 'THREE WEEKS LATER', 200, seg(lt, 0, 0.15));
    else { badge(g, 'MOST-WATCHED', W / 2, 230, { color: GOLD, size: 64, ...pop(t, mostT) }); badge(g, 'CHESS STREAM EVER', W / 2, 335, { color: CREAM, size: 50, ...pop(t, mostT + 0.15) }); }
  } });
  cue(recA - 0.06, 'whoosh_deep', 0.35); cue(recA + 0.1, 'murmur', 0.25); cue(mostT - 0.3, 'riser', 0.35); cue(mostT, 'reveal_bell', 0.4); cue(mostT + 0.1, 'cheer', 0.3);

  // ======================= MARCH 2021: Levy's stream by day; the account on his screen =======================
  const cardAt = (t, o = {}) => ({ pieces: board(LV, LVEND), panel: g2 => flatPanel(g2, cardTex(o), [4, 5.8, 12.2], 4.0, 2.2) });
  const cardFeed = (g, t, o = {}) => { rig(B, 0, [[0, K(0.04, 0.1, 15.5, [4, 4.6, 10])], [1, K(0.04, 0.1, 15.5, [4, 4.6, 10])]], { t }); onlineStage(g, t, cardAt(t, o)); };
  const hookFeed = (g, t) => { rig(B, 0, [[0, K(0, 0.27, 17, [4, 3.4, 6.6])], [1, K(0, 0.27, 17, [4, 3.4, 6.6])]], { t }); onlineStage(g, t, { pieces: board(LV, LVEND - 2), cams: { lev: { e: 'focus' }, fan: { spin: 7 } } }); };
  shot(nameA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.56, 0.26, 8.8, [4, 3.0, -1.4])], [len(sh), K(PI + 0.5, 0.24, 7.6, [4, 3.1, -1.4])]], { t });
    levyRoom(g, t, { screen: monitorScreen(feed(g2 => hookFeed(g2, t))), e: 'focus', over: g2 => tag3(g2, 4, 5.6, -1.4, 'LEVY · GOTHAMCHESS', LEVY_C, seg(t, nameA + 0.3, nameA + 0.6, lin)) });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'On stream', 'MARCH 2, 2021 · 12,000 WATCHING', { y: 200, t0: 0.1 }); } });
  shot(accA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.62, 0.32, 6.8, [4.2, 2.6, 2.4])], [0.6, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.6 ? 1 : 0 });
    levyRoom(g, t, { screen: monitorScreen(feed(g2 => cardFeed(g2, t, { rating: '+800' }))), e: 'focus' });
  }, { kb: 0 });
  shot(indA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.04, 0.1, 15.5, [4, 4.6, 10])], [len(sh), K(0.1, 0.08, 12.5, [4, 5.2, 11])]], { t });
    onlineStage(g, t, cardAt(t, { rating: '+800' }));
  }, { kb: 0, hud: (g, lt, t) => {
    if (t >= fanNT) badge(g, 'KIPAS = FAN', W / 2, 230, { color: CORAL, size: 56, ...pop(t, fanNT) });
    if (t >= godNT) badge(g, 'DEWA = GOD', W / 2, 335, { color: GOLD, size: 56, ...pop(t, godNT) });
  } });
  cue(nameA - 0.06, 'whoosh_fast', 0.3); cue(nameA + 0.1, 'notify', 0.3); cue(accA + 0.05, 'whoosh_soft', 0.3); cue(kipT, 'ting', 0.3);
  cue(fanNT, 'sparkle_pop', 0.3); cue(godNT, 'shimmer', 0.35);

  // ======================= +800 IN 11 DAYS; TEN SECONDS A MOVE; 90 % ACCURACY =======================
  const panelSet = (img, hh = 2.5, o = {}) => ({ pieces: board(LV, LVEND), panel: g2 => flatPanel(g2, img, [4, 5.8, 12.2], 4.0, hh), ...o });
  shot(susA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.22, 0.16, 18, [4, 4.6, 10])], [len(sh), K(0.08, 0.1, 13.5, [4, 5.4, 11])]], { t });
    onlineStage(g, t, panelSet(graphTex(seg(t, susA + 0.1, daysT + 0.1, lin))));
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= hunT) badge(g, '+800 POINTS', W / 2, 230, { color: GOLD, size: 60, ...pop(t, hunT) });
    if (t >= elvT) badge(g, 'IN 11 DAYS', W / 2, 335, { color: CREAM, size: 50, ...pop(t, elvT) });
  } });
  // an obvious recapture from the game itself, 23.hxg4 Bxe5 24.dxe5 fxg4: Dewa_Kipas took 11.4 s over it (the clock
  // times of the Chess.com archive)
  const RC = moveOf(LV, 48), RCSEC = 11.4, rcAt = t => runTo(LV, 47, [obvT + 0.12], t);
  shot(tenA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.1, 0.46, 13.4, [5.0, 3.0, 6.6])], [len(sh), K(-0.02, 0.43, 12.2, [5.0, 3.1, 6.8])]], { t, bump: t > obvT + 0.12 && t < obvT + 0.4 ? 1.2 : 0 });
    const r = rcAt(t), sec = RCSEC * seg(t, tenA + 0.1, obvT + 0.1, lin);
    onlineStage(g, t, { pieces: r.pieces, panel: g2 => flatPanel(g2, timerTex(sec), [4.4, 4.5, 12.2], 2.2, 2.2, GOLD),
      under: g2 => { moveFx(r).under(g2); if (t < obvT + 0.1) squareFrame(g2, B, RC.to, GOLD, 0.8); },
      over: g2 => { moveFx(r).over(g2); if (t < obvT + 0.1) boardArrow(g2, B, RC.from, RC.to, 0.85, seg(t, tenA + 0.2, tenA + 0.5, lin)); } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, '10 SECONDS A MOVE', W / 2, 230, { color: GOLD, size: 54, ...pop(t, tenA + 0.1) });
    if (t >= obvT) badge(g, 'EVEN THE OBVIOUS ONES', W / 2, 335, { color: CORAL, size: 46, ...pop(t, obvT) });
  } });
  shot(ovA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.12, 16, [4, 5.2, 10.5])], [len(sh), K(-0.03, 0.08, 13, [4, 5.6, 11])]], { t });
    onlineStage(g, t, panelSet(gaugeTex(0.92 * seg(t, ovA + 0.1, accT, lin))));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= accT) badge(g, 'IN ALMOST EVERY WIN', W / 2, 230, { color: CORAL, size: 50, ...pop(t, accT) }); } });
  cue(susA - 0.06, 'whoosh_fast', 0.3); cue(susA + 0.1, 'riser', 0.3); cue(hunT, 'kaching', 0.35); cue(elvT, 'ting', 0.3);
  cue(tenA - 0.06, 'whoosh_fast', 0.3); for (let i = 1; i <= 11; i++) cue(lerp(tenA + 0.1, obvT + 0.1, i / RCSEC), 'tick', 0.22);
  landCue(obvT + 0.12, true, 0.6); boom(obvT + 0.12, 0.5); cue(ovA - 0.06, 'whoosh_fast', 0.3); cue(ninT, 'alarm', 0.3); cue(accT, 'sting', 0.35);

  // ======================= LEVY REPORTED IT; HOURS LATER THE ACCOUNT CLOSED =======================
  const reportLeft = (pressed) => x => {
    x.fillStyle = 'rgba(255,243,224,0.06)'; x.fillRect(40, 80, 360, 560);
    x.fillStyle = pressed ? '#8E1A16' : '#E8413A'; x.beginPath(); x.roundRect(70, 520, 300, 90, 16); x.fill();
    x.font = sans(40, 900); x.letterSpacing = '6px'; x.textAlign = 'center'; x.fillStyle = '#FFFFFF'; x.fillText(pressed ? 'REPORTED ✓' : 'REPORT', 220, 567);
    x.font = sans(26, 800); x.letterSpacing = '3px'; x.fillStyle = 'rgba(255,243,224,0.7)'; x.fillText('DEWA_KIPAS', 220, 470);
  };
  const repP = repT + 0.24, repScreen = t => monitorScreen(feed(g2 => hookFeed(g2, t)), { left: reportLeft(t >= repP) });
  shot(repA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.66, 0.26, 9.2, [4, 3.0, -1.4])], [len(sh), K(PI + 0.6, 0.25, 8.4, [4, 3.0, -1.4])]], { t });
    levyRoom(g, t, { screen: repScreen(t), e: 'angry' });
  }, { trans: 'whip' });
  // his screen, as he sees it: the REPORT button goes down
  shot(repT + 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0, 0.03, 4.8, [MON.x - 0.6, MON.y, MON.z])], [len(sh), K(-0.04, 0.03, 4.0, [MON.x - 1.3, MON.y - 0.15, MON.z])]], { t, bump: t > repP && t < repP + 0.25 ? 0.8 : 0 });
    levyRoom(g, t, { screen: repScreen(t), e: 'angry' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= repP) badge(g, 'REPORTED', W / 2, 230, { color: LEVY_C, size: 60, ...pop(t, repP) }); } });
  shot(hrsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.08, 0.12, 17, [4, 5.0, 10])], [len(sh), K(0.02, 0.08, 13.5, [4, 5.5, 11])]], { t, bump: t > closedT && t < closedT + 0.3 ? 1.2 : 0 });
    onlineStage(g, t, cardAt(t, { rating: '+800', closed: t >= closedT ? 1 : 0 }));
    if (t >= closedT) flashTint(g, RED, 0.3 * (1 - seg(t, closedT, closedT + 0.4, lin)));
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < closedT) heading(g, 'HOURS LATER', 200, seg(lt, 0, 0.15));
    if (t >= fpT) badge(g, 'FAIR-PLAY RULES', W / 2, 230, { color: CORAL, size: 56, ...pop(t, fpT) });
  } });
  cue(repA - 0.06, 'whoosh_fast', 0.3); cue(repT + 0.1, 'whoosh_soft', 0.25); cue(repP - 0.02, 'beep', 0.35); cue(hrsA - 0.06, 'whoosh_deep', 0.3); cue(hrsA + 0.1, 'clock', 0.3);
  cue(closedT - 0.004, 'boom', 0.6); cue(closedT, 'stamp', 0.5); cue(closedT + 0.05, 'dun_dun', 0.3); cue(fpT, 'error', 0.3);

  // ======================= DADANG SUBUR at home: from the real "kipas" (the ceiling fan) down to him =======================
  shot(whoA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.3, -0.85, 6, [4, 12.4, 0.5])], [0.85, K(PI + 0.42, 0.1, 9.5, [4, 3.6, -1.4]), ease.inOut], [len(sh), K(PI + 0.38, 0.1, 8.4, [4, 3.4, -1.4])]], { t, e: lin });
    dadangHome(g, t, { e: 'neutral', fanSpin: 4 });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g, seg(t, dadT - 0.2, dadT)); if (t >= dadT) nameTitle(g, t - dadT, 'Dadang Subur', 'INDONESIA · AMATEUR PLAYER', { y: 200, size: 60 }); } });
  shot(denA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.22, 0.06, 6.6, [4, 3.1, -1.4])], [len(sh), K(PI + 0.16, 0.05, 5.8, [4, 3.2, -1.4])]], { t });
    dadangHome(g, t, { e: t >= denT ? 'worried' : 'neutral', fanSpin: 4 });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= denT) badge(g, 'HE DENIES CHEATING', W / 2, 230, { color: GOLD, size: 52, ...pop(t, denT) }); } });
  cue(whoA - 0.06, 'whoosh_deep', 0.35); cue(whoA + 0.05, 'whirr', 0.45); cue(dadT, 'ting', 0.3); cue(denA - 0.06, 'whoosh_fast', 0.25); cue(denT, 'thud', 0.3);

  // ======================= HIS SON'S POST, AND IT WENT VIRAL =======================
  const postSet = (g, t, { u = 1, hearts = false, many = 0 } = {}) => {
    sunsetSky(g); sun(g, [4, 3, 90], 7);
    g.save(); g.strokeStyle = rgba(GOLD, 0.16); g.lineWidth = 2; g.beginPath();
    for (let i = -24; i <= 32; i += 2) line3(g, [i, -3, -24], [i, -3, 60]); for (let i = -24; i <= 60; i += 2) line3(g, [-24, -3, i], [32, -3, i]);
    g.stroke(); g.restore();
    if (many > 0) {  // copies of the post spreading out behind it
      const r = rng(9), L = [...Array(14)].map(() => { const a = r() * 6.2832, d = 5 + r() * 7; return [4 + Math.cos(a) * d * many, 5 + Math.sin(a) * d * 0.8 * many, 9 + r() * 6, (r() - 0.5) * 0.6]; })
        .sort((p, q) => depth(q[0], q[1], q[2]) - depth(p[0], p[1], p[2]));
      for (const [x, y, z, ry] of L) if (depth(x, y, z) > 1) bigPhone(g, [x, y, z], postTex(1, true), { ry, s: 0.45 });
    }
    bigPhone(g, [4, 5, 6], postTex(u, hearts), { ry: Math.sin(t * 0.8) * 0.12 });
    pool(g, B, 4, -3, 6, 7, CORAL, 0.15);
    lowKey(g, { cy: H * 0.46, a: 0.16 });
  };
  shot(sonA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.1, 0.08, 10.5, [9.6, 4.6, -0.4])], [len(sh), K(PI + 0.04, 0.07, 9.2, [9.8, 4.8, -0.4])]], { t });
    dadangHome(g, t, { e: 'neutral', son: true, sonE: 'focus', phone: 1, fanSpin: 4, over: g2 => tag3(g2, 10.2, 8.7, -0.4, 'HIS SON', TEAL, seg(t, sonA + 0.15, sonA + 0.45, lin)) });
  }, { trans: 'whip' });
  shot(postA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.05, 11.5, [4, 5, 6])], [len(sh), K(0.06, 0.03, 9.6, [4, 5, 6])]], { t });
    postSet(g, t, { u: t >= unfT ? 1 : t >= strT ? 0.5 : 0.25 });
  }, { trans: 'whip' });
  shot(virA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.04, 0.03, 9.6, [4, 5, 6])], [len(sh), K(-0.1, 0.06, 20, [4, 5, 8])]], { t });
    postSet(g, t, { hearts: t >= virT, many: ease.out(seg(t, virT - 0.1, virT + 0.8, lin)) });
    burst(g, [4, 5, 6], t, virT - 0.05);
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= virT) stamp(g, 'VIRAL', W / 2, 1530, t, virT, { color: CORAL, size: 100 }); } });
  cue(sonA - 0.06, 'whoosh_fast', 0.3); cue(sonA + 0.1, 'notify', 0.3); cue(postA - 0.06, 'whoosh_soft', 0.3); cue(postA + 0.05, 'typewriter', 0.2);
  cue(virT - 0.3, 'revswell', 0.4); cue(virT, 'sparkle_pop', 0.35); cue(virT + 0.05, 'confetti', 0.3); cue(virT + 0.1, 'notify', 0.25);

  // ======================= THE STORM: messages fly at Levy, some of them threats =======================
  shot(stormA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.74, 0.26, 9.8, [4, 3.0, -1.4])], [len(sh), K(PI + 0.62, 0.24, 8.4, [4, 3.0, -1.4])]], { t, shake: t >= deathT ? 1.5 : 1 });
    levyRoom(g, t, { screen: monitorScreen(feed(g2 => hookFeed(g2, t))), e: t >= deathT ? 'shock' : 'worried', over: g2 => storm(g2, t, stormA + 0.05, { red: t >= deathT - 0.1 ? 1 : 0 }) });
    if (t >= deathT) flashTint(g, RED, 0.22 * (1 - seg(t, deathT, deathT + 0.5, lin)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= deathT) badge(g, 'DEATH THREATS', W / 2, 230, { color: RED, size: 60, ...pop(t, deathT) }); } });
  cue(stormA - 0.06, 'whoosh_deep', 0.35); for (let i = 0; i < 8; i++) cue(stormA + 0.2 + i * 0.22, 'notify', 0.18); cue(deathT - 0.004, 'boom', 0.55); cue(deathT, 'heartbeat', 0.35);

  // ======================= HE LOCKED HIS ACCOUNTS; DADANG AND HIS SON CONDEMNED THE HARASSMENT =======================
  shot(lockA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.74, 0.27, 10.5, [5.2, 3.6, -0.8])], [len(sh), K(PI + 0.66, 0.26, 9.4, [5.2, 3.6, -0.8])]], { t });
    levyRoom(g, t, { screen: monitorScreen(feed(g2 => hookFeed(g2, t))), e: 'tired', tiles: { u: seg(t, lockA, lockA + 0.4, lin), lock: seg(t, lockT - 0.15, lockT + 0.7, lin) } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= lockT) badge(g, 'ACCOUNTS LOCKED', W / 2, 230, { color: GOLD, size: 56, ...pop(t, lockT) }); } });
  shot(condA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.42, 0.1, 13.5, [6.8, 3.8, -1])], [len(sh), K(PI + 0.36, 0.09, 12, [6.8, 3.9, -1])]], { t });
    dadangHome(g, t, { e: 'worried', son: true, sonE: 'worried', fanSpin: 2.5 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= condT) { badge(g, 'THEY CONDEMNED', W / 2, 230, { color: CREAM, size: 52, ...pop(t, condT) }); badge(g, 'THE HARASSMENT', W / 2, 335, { color: RED, size: 52, ...pop(t, condT + 0.15) }); }
  } });
  cue(lockA - 0.06, 'whoosh_fast', 0.3); for (let i = 0; i < 3; i++) cue(lockT - 0.1 + i * 0.23, 'ratchet', 0.3); cue(lockT + 0.5, 'thud', 0.3);
  cue(condA - 0.06, 'whoosh_deep', 0.3); cue(condT, 'sting', 0.3);

  // ======================= THE TWIST: Deddy Corbuzier's studio in Jakarta, the Fan God against Irene Sukandar =======================
  const JK = (o = {}) => ({ pieces: matchBoard(1, 0), clock: { names: ['KIPAS', 'IRENE'], cols: [FAN_C, IRENE_C], l: 600, r: 600, run: 0 }, ew: 'focus', eb: 'happy', ...o });
  shot(twistA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 0.2, 21, [2.2, 4.6, 7])], [len(sh), K(-0.34, 0.18, 19.2, [1.4, 4.6, 6.6])]], { t });
    jktStudio(g, t, { wall: 'event', ded: true, dedE: 'happy', tab: JK() });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g, seg(t, dedT - 0.2, dedT)); if (t >= dedT) nameTitle(g, t - dedT, 'Deddy Corbuzier', 'TV STAR · JAKARTA', { y: 200, size: 58 }); } });
  shot(fan2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.32, 0.1, 9.4, [4, 3.1, -1.4])], [len(sh), K(PI - 0.26, 0.08, 8.2, [4, 3.2, -1.4])]], { t });
    jktStudio(g, t, { tab: JK({ ew: 'focus' }), over: g2 => tag3(g2, 4, 5.7, -1.4, 'THE FAN GOD', FAN_C, seg(t, fan2A + 0.1, fan2A + 0.4, lin)) });
  }, { trans: 'whip' });
  // the real Irene Sukandar (a photo of 2013, Asian Indoor Games), then the match table
  const ireKeys = { from: { x: 0.5, y: 0.36, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.35, zoom: 1.08, dolly: 0.06 } };
  shot(ireA, (g, lt, t) => photoShot(g, lt, PH.irene, { ...ireKeys, dur: matchA - ireA + 0.3, drop: 150 }), { trans: 'whip', hud: (g, lt, t) => {
    if (t >= ireT - 0.05) nameTitle(g, t - ireT + 0.05, 'Irene Sukandar', 'INTERNATIONAL MASTER', { y: 200, size: 60 });
    credit(g, CREDITS.irene, seg(lt, 0.3, 0.5) * 0.75);
  } });
  cue(twistA - 0.06, 'whoosh_deep', 0.35); cue(twistA + 0.1, 'murmur', 0.3); cue(dedT, 'reveal_bell', 0.3); cue(fan2A - 0.06, 'whoosh_fast', 0.3); cue(fan2A + 0.05, 'whirr', 0.3);
  cue(ireA - 0.06, 'whoosh_fast', 0.3); cue(ireT, 'sparkle_pop', 0.3);

  // ======================= THREE GAMES, IRENE WON ALL THREE; PERFORMANCE 1127 =======================
  // game 1 fast, up to the blunder: 18...Qc8 and 19.Bxd6 takes the bishop (Irene White, the board turned round)
  const FAST = [...Array(8)].map((_, i) => matchA + 0.12 + i * Math.min(0.1, (wonA - matchA - 0.3) / 7)), fastAt = t => turnedRun(runTo(M[0], 29, FAST, t, 0.08));
  const score = t => t >= thr3T ? 3 : t >= allT ? 2 : 1;
  shot(matchA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 1.2, 14.6, [4, 0, 4.7])], [len(sh), K(0.3, 1.26, 13.2, [4, 0, 4.5])]], { t });
    const r = fastAt(t);
    jktStudio(g, t, { tab: JK({ pieces: r.pieces, clock: { names: ['KIPAS', 'IRENE'], cols: [FAN_C, IRENE_C], l: 300 - lt * 40, r: 340 - lt * 20, run: r.k % 2 ? 1 : 2 }, ew: 'worried', eb: 'focus', wPlayer: false, under: g2 => moveFx(r, 0.08, 0.1).under(g2) }) });
  }, { trans: 'whip' });
  shot(wonA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.32, 0.12, 21, [4, 5.4, 9])], [len(sh), K(0.22, 0.1, 18.5, [4, 5.6, 9.5])]], { t });
    const n = score(t), at = n === 3 ? thr3T : n === 2 ? allT : wonA;
    jktStudio(g, t, { wall: 'score' + Math.max(1, n - 1), wall2: 'score' + n, wallU: n > 1 ? seg(t, at - 0.05, at + 0.15, lin) : 1, tab: JK({ pieces: matchBoard(n, M[n - 1].length - 1), ew: 'worried', eb: 'happy' }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= thr3T) stamp(g, '3 – 0', W / 2, 1530, t, thr3T, { color: GOLD, size: 110 }); } });
  shot(perfA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.05, 16, [4, 6.0, 15])], [len(sh), K(0.02, 0.04, 13.2, [4, 6.1, 15])]], { t });
    jktStudio(g, t, { wall: 'score3', wall2: 'perf', wallU: seg(t, prfT - 0.1, prfT + 0.15, lin), tab: JK({ pieces: matchBoard(3, M[2].length - 1), ew: 'worried', eb: 'happy', bPlayer: false, bChair: false }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= elT) badge(g, 'ELO 1127', W / 2, 230, { color: CORAL, size: 64, ...pop(t, elT) }); } });
  cue(matchA - 0.06, 'whoosh_fast', 0.3); FAST.forEach((a, i) => cue(a - 0.02, 'piece', i % 2 ? 0.18 : 0.24));
  cue(wonA - 0.06, 'whoosh_fast', 0.3); cue(wonA + 0.15, 'ting', 0.3); cue(allT, 'ting', 0.3); cue(thr3T - 0.004, 'boom', 0.6); cue(thr3T, 'stamp', 0.45); cue(thr3T + 0.05, 'success', 0.3);
  cue(perfA - 0.06, 'whoosh_deep', 0.3); cue(prfT, 'reveal_bell', 0.3); cue(elT, 'record_scratch', 0.35);

  // ======================= 1.25 MILLION LIVE: the city, the counter, fireworks; ten times the old record =======================
  const cnt = t => lerp(4000, 1250000, ease.out(seg(t, peakA + 0.1, milT + 0.15, lin)));
  shot(peakA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, -0.02, 46, [4, 14, 34])], [len(sh), K(0.02, 0.06, 28, [4, 16, 34])]], { t, e: lin });
    skyline(g, t, { mode: 'count', v: cnt(t), fire: g2 => fireworks(g2, t, milT, { n: 9, seed: 12 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= milT) badge(g, '1.25 MILLION LIVE', W / 2, 230, { color: GOLD, size: 60, ...pop(t, milT) }); } });
  shot(tenxA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.04, 22, BILL.c)], [len(sh), K(-0.04, 0.03, 18.5, BILL.c)]], { t });
    skyline(g, t, { mode: 'count', v: 1250000, mode2: 'bars', u2: seg(t, tenxA + 0.05, tenxA + 0.3, lin), fire: g2 => fireworks(g2, t, tenxA, { n: 6, seed: 15 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= timesT) badge(g, '10× THE OLD RECORD', W / 2, 230, { color: GOLD, size: 56, ...pop(t, timesT) }); } });
  cue(peakA - 0.06, 'whoosh_deep', 0.35); cue(peakA + 0.1, 'riser', 0.35); cue(milT, 'cheer', 0.45); cue(milT + 0.02, 'boom', 0.5); cue(milT + 0.1, 'confetti', 0.35);
  cue(tenxA - 0.06, 'whoosh_fast', 0.3); cue(timesT, 'reveal_bell', 0.35); cue(timesT + 0.2, 'applause', 0.3);

  // ======================= LEVY'S VERDICT (the photo) =======================
  const lvKeys = { from: { x: 0.5, y: 0.36, zoom: 1.0, dolly: 0 }, to: { x: 0.51, y: 0.36, zoom: 1.06, dolly: 0.05 } };
  const lvKeys2 = { from: { x: 0.5, y: 0.38, zoom: 1.1, dolly: 0.02 }, to: { x: 0.5, y: 0.38, zoom: 1.16, dolly: 0.05 } };
  shot(levyA, (g, lt, t) => photoShot(g, lt, PH.levy, { ...lvKeys, dur: peopleA - levyA + 0.3 }), { trans: 'whip', hud: (g, lt, t) => {
    nameTitle(g, lt, 'Levy Rozman', 'GOTHAMCHESS', { y: 200, size: 62, t0: 0.05 }); credit(g, CREDITS.levy, seg(lt, 0.4, 0.6) * 0.75);
  } });
  shot(peopleA, (g, lt, t) => photoShot(g, lt, PH.levy, { ...lvKeys2, dur: ctaA - peopleA + 0.3 }), { trans: 'zoom', hud: (g, lt, t) => {
    badge(g, '“PEOPLE WHO PLAY UNFAIRLY', W / 2, 200, { color: CREAM, size: 38, ...pop(t, peopleA + 0.1) });
    badge(g, 'WILL BE CAUGHT”', W / 2, 350, { color: LEVY_C, size: 50, a: seg(t, caughtT - 0.3, caughtT - 0.2), ...pop(t, caughtT - 0.3) });
  } });
  cue(levyA - 0.06, 'whoosh_deep', 0.3); cue(levyA + 0.1, 'ting', 0.25); cue(caughtT, 'gavel', 0.4);

  // ======================= CTA: back to the hook board; the Fan God's real rating? =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.03, 0.28, 18.4, [4.1, 3.55, 7.0])], [len(sh), K(0.0, 0.26, 17.5, [4, 3.6, 6.8])]], { t });
    onlineStage(g, t, { pieces: board(LV, LVEND), cams: { lev: { e: 'smug' }, fan: { spin: 9 } },
      under: g2 => ledGlow(g2, B, 'h3', RED, t, ctaA - 2, { reach: 1 }),
      over: g2 => tag3(g2, 7.4, 1.0, 10.6, 'RATING: ????', GOLD, seg(t, realT, realT + 0.3, lin)) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'HIS REAL RATING?', W / 2, 230, { color: GOLD, size: 54, ...pop(t, ctaA + 0.1) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: TEAL, size: 46, a: seg(t, comT, comT + 0.1), ...pop(t, comT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 425, { color: CREAM, size: 36, a: seg(t, numT, numT + 0.1) });
  } });
  cue(ctaA - 0.06, 'whoosh_fast', 0.3); cue(ctaA + 0.05, 'whirr', 0.3); cue(realT, 'ting', 0.3); cue(comT, 'sparkle_pop', 0.3); cue(numT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: recA, m: 'glory' }, { t: nameA, m: 'intrigue' }, { t: susA, m: 'digital' }, { t: repA, m: 'tension' },
    { t: whoA, m: 'exile' }, { t: sonA, m: 'build' }, { t: stormA, m: 'paranoia' }, { t: lockA, m: 'void' }, { t: twistA, m: 'build' },
    { t: matchA, m: 'clockwork' }, { t: wonA, m: 'victory' }, { t: peakA, m: 'finale' }, { t: levyA, m: 'elegy' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: mateT - 0.32, t1: mateT - 0.01, kind: 'mute' }, { t0: mateT, t1: recA, kind: 'boost', db: 4 },
    { t0: closedT - 0.3, t1: closedT - 0.01, kind: 'mute' }, { t0: deathT - 0.3, t1: deathT - 0.01, kind: 'mute' },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
