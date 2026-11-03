// GothamChess, the Grandmaster Hunter (November 2026). A viral TikTok (@infernojae) called Levy Rozman a hunter of
// grandmasters; under it he wrote "It's gonna be 50% soon". We counted his Chess.com games ourselves: 34,374 games, 503
// distinct grandmaster accounts beaten (28.8 % of the 1,747 GM accounts there), Hikaru 17 times, Fabiano Caruana mated
// with 7 seconds on the clock on 12 March 2026, a blitz peak of 3014 that night. And still he is an International
// Master: the GM title is won over the board in classical chess (three norms and a 2500 FIDE rating); his best was 2421.
// He quit competitive chess in 2022 for the stress and came back in 2024 for the title. Sources: SOURCES.md.
// Rules 42–48 (reference/rausis_v2.md): every phrase is a 3D set (the trophy gallery with a black king mounted on a
// shield for every grandmaster he beat, the online board between two webcams, a night mountain whose ridge is his
// rating, a classical tournament hall by day, Levy's room); the hook gallery returns at the end. Rule 48: this video's
// own palette, a hunter's lodge (pine green, walnut, brass and ember on cream) instead of the sunset of Dewa Kipas.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, capColor } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, counter, sans, mono, serif, popIn } from '../../engine/js/hud.js';
import { rig, seated, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { loadImage } from '../../engine/js/photo.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, boardArrow } from '../../engine/js/hifx.js';
import { webcam } from '../../engine/js/witty.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (STYLE_BIBLE rule 48): the hunter's lodge ----------
const PINE = '#2D5E48', PINE2 = '#0B1F17', WALNUT = '#5A3A22', BRASS = '#E2B04A', CREAM = '#FFF3E0', EMBER = '#FF8A3D';
const GOLD = '#F5C451', RED = '#E8413A', LIME = HI.good, LEVY_C = '#6CB8FF', FAB_C = '#FF8A6B', TEAL = '#3FCFB0';
const CORAL = EMBER, FAN_C = FAB_C;  // the names the shared helpers below use
// the board: Chess.com green on a walnut slab; the rounded slab, its sides and the engraving stay (rule 46)
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#5A3A22', side: '#2A190D', th: 0.45, rc: 0.35 };
Object.assign(capColor, { ember: '#FF9A55' });
// the real game (SOURCES.md): Fabiano Caruana – GothamChess, Chess.com, 12 March 2026, 3+0; Levy (Black) mated with
// 63...Rh6# (ply 126), 8.0 s on his clock before the move and 6.9 s after it
const CG = await fetch('../engine/data/caruana_gothamchess_2026.json').then(r => r.json());
const CGEND = CG.length - 1;
// the clocks after each ply of the last moves (the game's [%clk] tags): White's after White's moves, Black's after Black's
const CLK = { 106: 14.9, 107: 17.7, 108: 14.2, 109: 17.6, 110: 13.5, 111: 17.2, 112: 13.0, 113: 17.1, 114: 11.8, 115: 16.2, 116: 10.5, 117: 15.6,
  118: 9.7, 119: 15.2, 120: 9.1, 121: 14.5, 122: 8.5, 123: 13.8, 124: 8.0, 125: 13.7, 126: 6.9 };
// Levy had Black: the board turns round so that his pieces are on the near side
const rsq = sq => String.fromCharCode(201 - sq.charCodeAt(0)) + (9 - +sq[1]);
const turned = pcs => pcs.map(p => ({ ...p, sq: rsq(p.sq), ...(p.x != null ? { x: 8 - p.x, z: 8 - p.z } : {}), ...(p.trail ? { trail: [8 - p.trail[0], 8 - p.trail[1]] } : {}) }));
const PH = { levy: await loadPhoto3d('../episodes/levy/photos/levy_closeup') };
const CREDITS = { levy: 'Photo: Piaras Ó Mídheach / Collision via Sportsfile, CC BY 2.0' };
const COMMENT = await loadImage('../episodes/gmhunter/photos/levy_comment.jpg');  // the screenshot of his comment (from the author)

// ---------- cast: Levy (the engine's lookalike) and Levy in 2033, Fabiano Caruana, Hikaru, a classical opponent and
// players at the other tables; all cartoon versions ----------
CAST.lev = { ...CAST.levy };
CAST.old = { ...CAST.levy, hairC: '#CFCAC2', brow: '#BDB7AE', beard: '#C9C3BA', age: 0.7 };
CAST.fab = { face: [0.95, 1.08, 0.86], hair: 'swept', hairC: '#2A1F18', brow: '#2A1F18', suit: '#2C3E64', suitD: '#1E2B48', shirt: 'tee', ears: 1.02 };
CAST.hik = { ...CAST.hikaru };
CAST.opp = { face: [0.97, 1.04, 0.9], hair: 'receding', hairC: '#5A4A3A', brow: '#4A3C2E', suit: '#3A4A5A', suitD: '#2A3644', shirt: 'tie', tie: '#7A2A2A', beard: '#5A4A3A', beardStyle: 'full', glasses: true, ears: 1.02 };
CAST.pa = { face: [0.95, 1.05, 0.88], hair: 'swept', hairC: '#3A2A20', brow: '#2E2119', suit: '#5A3A5A', suitD: '#422A42', shirt: 'tie', tie: '#2A3A5A', ears: 1.02 };
CAST.pb = { face: [0.94, 1.04, 0.86], hair: 'longcurly', hairC: '#6E4A2E', brow: '#4E3420', suit: '#2F6A5A', suitD: '#214A40', shirt: 'tee', female: true, ears: 0.9 };
CAST.pc = { face: [0.98, 1.06, 0.9], hair: 'buzz', hairC: '#16110E', brow: '#120D0A', suit: '#7A4A2A', suitD: '#5A3620', shirt: 'tee', ears: 1.03 };
CAST.pd = { face: [0.96, 1.04, 0.9], hair: 'receding', hairC: '#9A958C', brow: '#77726A', suit: '#2A2A30', suitD: '#1C1C22', shirt: 'tie', tie: '#8E1E22', glasses: true, ears: 1.02 };
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a pine scrim at the top of the frame: titles stay readable over bright daylight sets
function scrim(g, a = 1) { if (a <= 0) return; const gr = g.createLinearGradient(0, 0, 0, 460); gr.addColorStop(0, `rgba(9,28,21,${(0.78 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(9,28,21,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 460); }
// a heading in the brilliant type: letter-spaced heavy cream with an ember underline
function heading(g, text, y, a = 1, { size = 44, color = CREAM, spacing = 5 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = `${spacing}px`; g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText(text, W / 2, y); g.shadowColor = 'transparent';
  const tw = g.measureText(text).width; g.fillStyle = CORAL; g.fillRect(W / 2 - 40, y + 18, 80, 5);
  qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 30, 'text', text); g.restore();
}
// the cover: a white line over a big gold one
function coverTitle(g, l1, l2, y, { a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#0B1F17';
  g.font = sans(66, 900); g.lineWidth = 16; g.strokeText(l1, W / 2, y); g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  g.font = sans(124, 900); const y2 = y + 132;
  g.lineWidth = 20; g.strokeText(l2, W / 2, y2); g.fillStyle = '#F5C451'; g.fillText(l2, W / 2, y2);
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
  g.fillStyle = '#0B1F17'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, drop); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, drop - 20, 0, drop + 250); gr.addColorStop(0, '#0B1F17'); gr.addColorStop(1, 'rgba(9,28,21,0)');
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
function camPanel(g, img, c, hw, hh, ry = 0, { glow = null, a = 1, frame = '#10201A' } = {}) {
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
const flatPanel = (g, img, c, hw, hh, glow = CORAL) => { obox(g, c, [hw + 0.2, hh + 0.2, 0.15], '#0E2018', {}, { spec: 0.2 }); texQuad(g, img, [c[0] - hw, c[1] + hh, c[2] - 0.17], [c[0] + hw, c[1] + hh, c[2] - 0.17], [c[0] - hw, c[1] - hh, c[2] - 0.17]); pool(g, B, c[0], -0.4, c[2] - 3, 6, glow, 0.14); };
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

// ======================= THIS VIDEO'S SETS: the hunter's lodge =======================
// a canvas drawn again only when its key changes (the big LED panels: one canvas each, not hundreds of cached ones)
function memo(w, h) { const c = makeCanvas(w, h), x = c.getContext('2d'); let key = null; return (k, draw) => { if (k !== key) { key = k; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.shadowBlur = 0; x.letterSpacing = '0px'; x.clearRect(0, 0, w, h); draw(x, w, h); AVG.delete(c); } return c; }; }
const fmtN = n => Math.round(n).toLocaleString('en-US');
// his comment (the screenshot the author sent), with a gold underline running under "50% soon"
const COMMENT_C = tex(1080, 360, x => x.drawImage(COMMENT, 0, 0, 1080, 360));
function commentTex(u) {
  const k = Math.round(clamp(u) * 16);
  return once('cm:' + k, 1080, 360, (x) => {
    x.drawImage(COMMENT_C, 0, 0);
    if (k > 0) { x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 16; x.beginPath(); x.roundRect(424, 158, 204 * k / 16, 8, 4); x.fill(); }
  });
}

// ---------- the trophy gallery: a long hall of pine boards over a walnut wainscot, a crimson runner, brass sconces;
// 504 shields on the two walls (6 rows, 42 columns); a black king is mounted on the shield of every grandmaster he beat,
// in the order he first beat them (column by column away from the door). The LED scoreboard hangs on the end wall ----------
const GAL = { xl: -1, xr: 9, z0: -18, z1: 64, top: 14 };
const ROWS = 6, COLS = 42, SW = 0.58, SHH = 0.76, NGM = 503, NALL = 1747;
const SLOTS = [];
for (let j = 0; j < COLS; j++) for (const sd of [-1, 1]) for (let i = 0; i < ROWS; i++) SLOTS.push({ j, sd, i, x: sd < 0 ? GAL.xl : GAL.xr, y: 0.9 + i * 2.0, z: 1.2 + j * 1.45 });
const SHIELD = (() => {
  const P = [[-1, 1], [-0.35, 0.94], [0.35, 0.94], [1, 1]];
  for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI / 2; P.push([Math.cos(a), -0.1 - 0.9 * Math.sin(a)]); }
  for (let k = 7; k >= 0; k--) { const a = k / 8 * Math.PI / 2; P.push([-Math.cos(a), -0.1 - 0.9 * Math.sin(a)]); }
  return P;
})();
const SP = (s, u, v, d) => [s.x - s.sd * d, s.y + v * SHH, s.z + u * SW];
// n kings mounted, lit of them glowing; fall: the time the kings start dropping off the walls (near ones first)
function trophyWall(g, t, { n = NGM, lit = n, fall = null } = {}) {
  const E = B.E, list = [];
  for (let k = 0; k < SLOTS.length; k++) {
    const s = SLOTS[k];
    if ((s.x - E[0]) * s.sd <= 0.1) continue;  // a wall is seen from inside the hall only
    const d = depth(s.x, s.y, s.z); if (d < 0.9) continue;
    list.push([d, k, s]);
  }
  list.sort((a, b) => b[0] - a[0]);
  for (const [, k, s] of list) {
    const c = B.project(...SP(s, 0, 0, 0)); if (c.x < -300 || c.x > W + 300 || c.y < -300 || c.y > H + 300) continue;
    const has = k < n, on = has && k < lit, lw = Math.max(1, c.s * 0.05);
    if (B.poly(g, SHIELD.map(([u, v]) => SP(s, u, v, 0.05)))) {
      g.fillStyle = on ? '#7A4E2A' : '#4A2F1A'; g.fill(); g.strokeStyle = on ? BRASS : '#2A1A0E'; g.lineWidth = lw; g.stroke();
    }
    if (B.poly(g, [SP(s, -0.5, -0.44, 0.07), SP(s, 0.5, -0.44, 0.07), SP(s, 0.5, -0.64, 0.07), SP(s, -0.5, -0.64, 0.07)])) { g.fillStyle = on ? BRASS : '#6A5636'; g.fill(); }
    if (!has) continue;
    let base = SP(s, 0, -0.36, 0.32), rot = 0;
    if (fall != null) {
      const ts = fall + s.j * 0.022 + ((k * 37) % 11) * 0.02, u = t - ts;
      if (u > 0) {
        const y = base[1] - 21 * u * u, out = Math.min(u * 2.2, 2.0);
        if (y <= FLOOR_Y + 0.05) { base = [s.x - s.sd * (0.32 + out), FLOOR_Y + 0.05, base[2]]; rot = -s.sd * 1.5; }
        else { base = [s.x - s.sd * (0.32 + out), y, base[2]]; rot = -s.sd * Math.min(1.5, u * 6); }
      }
    }
    if (depth(...base) < 0.9) continue;
    const p = B.project(...base);
    drawPiece(g, 'k', 'b', p.x, p.y, p.s * 1.05, { glow: on && fall == null ? GOLD : null, rot });
  }
}
// the LED scoreboard on the end wall: every GM account as a dot ('grid'), the game counter ('games'), the pace ('pace')
const SCORE = memo(1280, 800);
function scoreTex(mode, v = 0, { label = '', year = '' } = {}) {
  return SCORE(`${mode}:${Math.round(v * 10)}:${label}:${year}`, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#163626'); gr.addColorStop(1, '#0A1A12'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (mode === 'grid') {
      x.font = sans(38, 900); x.letterSpacing = '8px'; x.fillStyle = 'rgba(255,243,224,0.85)'; x.fillText('EVERY GM ON CHESS.COM · 1,747', w / 2, 66);
      const cols = 50, x0 = 90, y0 = 120, cw = (w - 180) / cols, ch = 14.4, n = Math.round(v);
      x.fillStyle = 'rgba(255,243,224,0.14)';
      for (let k = n; k < NALL; k++) { x.beginPath(); x.arc(x0 + (k % cols + 0.5) * cw, y0 + (Math.floor(k / cols) + 0.5) * ch, 4.5, 0, 7); x.fill(); }
      x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 10;
      for (let k = 0; k < n; k++) { x.beginPath(); x.arc(x0 + (k % cols + 0.5) * cw, y0 + (Math.floor(k / cols) + 0.5) * ch, 6, 0, 7); x.fill(); }
      x.shadowBlur = 0;
      if (label) { x.font = sans(84, 900); x.letterSpacing = '4px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 24; x.fillText(label, w / 2, 718); x.shadowBlur = 0; }
    } else if (mode === 'games') {
      x.font = mono(22, 700); x.fillStyle = 'rgba(255,243,224,0.10)'; x.textAlign = 'left';
      const r = rng(5), off = (v * 0.37) % 40;
      for (let i = 0; i < 22; i++) for (let c = 0; c < 3; c++) { const y = 20 + i * 40 - off; x.fillText(`${r() > 0.4 ? '1-0' : '0-1'}  ${r() > 0.5 ? 'BLITZ ' : 'BULLET'}  #${Math.floor(r() * 90000 + 10000)}`, 60 + c * 410, y); }
      x.textAlign = 'center'; x.font = sans(40, 900); x.letterSpacing = '10px'; x.fillStyle = 'rgba(255,243,224,0.85)'; x.fillText('HIS CHESS.COM GAMES', w / 2, 210);
      x.font = mono(250, 800); x.letterSpacing = '0px'; x.fillStyle = CREAM; x.shadowColor = GOLD; x.shadowBlur = 30; x.fillText(fmtN(v), w / 2, 420); x.shadowBlur = 0;
      if (label) { x.font = sans(64, 900); x.letterSpacing = '6px'; x.fillStyle = GOLD; x.fillText(label, w / 2, 640); }
    } else {  // pace: the share of all GMs beaten, crawling toward the 50 % line, and the year
      x.font = sans(38, 900); x.letterSpacing = '8px'; x.fillStyle = 'rgba(255,243,224,0.85)'; x.fillText('SHARE OF ALL GMs BEATEN', w / 2, 80);
      const X0 = 110, X1 = 1170, Y = 260, BH = 96, xv = lerp(X0, X1, v / 100), x50 = lerp(X0, X1, 0.5);
      x.fillStyle = 'rgba(255,243,224,0.1)'; x.beginPath(); x.roundRect(X0, Y - BH / 2, X1 - X0, BH, 18); x.fill();
      const bg = x.createLinearGradient(X0, 0, xv, 0); bg.addColorStop(0, '#B8862A'); bg.addColorStop(1, GOLD);
      x.fillStyle = bg; x.shadowColor = GOLD; x.shadowBlur = 24; x.beginPath(); x.roundRect(X0, Y - BH / 2, Math.max(20, xv - X0), BH, 18); x.fill(); x.shadowBlur = 0;
      x.strokeStyle = LIME; x.lineWidth = 8; x.setLineDash([18, 12]); x.beginPath(); x.moveTo(x50, Y - 110); x.lineTo(x50, Y + 110); x.stroke(); x.setLineDash([]);
      x.font = sans(44, 900); x.letterSpacing = '4px'; x.fillStyle = LIME; x.fillText('50%', x50, Y + 150);
      x.font = sans(60, 900); x.fillStyle = '#1A1206'; x.textAlign = 'right'; x.fillText(`${(v).toFixed(1)}%`, Math.max(X0 + 230, xv - 22), Y + 4); x.textAlign = 'center';
      if (year) { x.font = mono(210, 800); x.letterSpacing = '0px'; x.fillStyle = CREAM; x.shadowColor = LIME; x.shadowBlur = year === '2033' ? 40 : 0; x.fillText(year, w / 2, 580); x.shadowBlur = 0; }
      if (label) { x.font = sans(44, 900); x.letterSpacing = '8px'; x.fillStyle = GOLD; x.fillText(label, w / 2, 730); }
    }
    ledGrid(x, w, h, 6);
  });
}
const PANEL = { c: [4, 6.6, 63.7], hw: 4.2, hh: 2.625 };
function scorePanel(g, img) {
  const { c, hw, hh } = PANEL;
  obox(g, c, [hw + 0.32, hh + 0.32, 0.2], '#8A6424', {}, { spec: 0.5 });
  texQuad(g, img, [c[0] - hw, c[1] + hh, c[2] - 0.22], [c[0] + hw, c[1] + hh, c[2] - 0.22], [c[0] - hw, c[1] - hh, c[2] - 0.22]);
  pool(g, B, c[0], FLOOR_Y + 0.02, c[2] - 4, 7, GOLD, 0.16);
}
// a brass sconce on a wall: its bulb and the warm light it throws on the boards
const SCONCES = []; for (let z = 4; z < 62; z += 8) for (const sd of [-1, 1]) SCONCES.push([sd < 0 ? GAL.xl + 0.15 : GAL.xr - 0.15, 12.6, z]);
function gallery(g, t, { n = NGM, lit = n, fall = null, panel = null, levy = null, extra = null, front = null, warm = 1, beams = 1 } = {}) {
  const E = B.E;
  g.fillStyle = PINE2; g.fillRect(0, 0, W, H);
  const wallLight = sx => g2 => {  // the sconces' glow painted on a wall
    for (const s of SCONCES) { if (Math.sign(s[0] - 4) !== sx || depth(...s) < 0.8) continue; const p = B.project(...s); rim(g2, p.x, p.y + p.s * 2.5, p.s * 6, '#FFC27A', 0.32 * warm); }
  };
  if (E[1] < GAL.top) tiled(g, [GAL.xl, GAL.top, GAL.z0], [GAL.xr - GAL.xl, 0, 0], [0, 0, GAL.z1 - GAL.z0], { color: '#13291F', grout: 'rgba(0,0,0,0.45)', tu: 20, tv: 2.9, lw: 5 });
  for (const [x, sd] of [[GAL.xl, -1], [GAL.xr, 1]]) {
    if ((x - E[0]) * sd <= 0) continue;
    const L = [GAL.z0, GAL.z1];
    tiled(g, [x, FLOOR_Y + 3, L[0]], [0, 0, L[1] - L[0]], [0, GAL.top - FLOOR_Y - 3, 0], { color: mix('#1C3C2E', PINE, warm), grout: 'rgba(0,0,0,0.22)', tu: 0.9, tv: 30, light: wallLight(sd) });
    tiled(g, [x, FLOOR_Y, L[0]], [0, 0, L[1] - L[0]], [0, 3, 0], { color: mix('#3A2616', WALNUT, warm), grout: 'rgba(0,0,0,0.3)', tu: 2.9, tv: 3 });
    g.save(); g.strokeStyle = BRASS; g.lineWidth = 3; g.beginPath(); line3(g, [x, FLOOR_Y + 3, L[0]], [x, FLOOR_Y + 3, L[1]]); g.stroke(); g.restore();
  }
  if (E[2] < GAL.z1) {
    tiled(g, [GAL.xl, FLOOR_Y, GAL.z1], [GAL.xr - GAL.xl, 0, 0], [0, GAL.top - FLOOR_Y, 0], { color: mix('#1C3C2E', PINE, warm), grout: 'rgba(0,0,0,0.22)', tu: 0.9, tv: 30 });
    scorePanel(g, panel || scoreTex('grid', NGM, { label: '503 BEATEN' }));
  }
  if (E[1] > FLOOR_Y) {
    tiled(g, [GAL.xl, FLOOR_Y, GAL.z0], [GAL.xr - GAL.xl, 0, 0], [0, 0, GAL.z1 - GAL.z0], { color: mix('#3A2414', '#6A4426', warm), grout: 'rgba(0,0,0,0.28)', tu: 1.25, tv: 82 });
    quad(g, [[2.5, FLOOR_Y + 0.01, GAL.z0], [5.5, FLOOR_Y + 0.01, GAL.z0], [5.5, FLOOR_Y + 0.01, 61], [2.5, FLOOR_Y + 0.01, 61]], mix('#4A1216', '#8E2228', warm));
    g.save(); g.strokeStyle = rgba(BRASS, 0.8); g.lineWidth = 2; g.beginPath();
    line3(g, [2.7, FLOOR_Y + 0.02, GAL.z0], [2.7, FLOOR_Y + 0.02, 61]); line3(g, [5.3, FLOOR_Y + 0.02, GAL.z0], [5.3, FLOOR_Y + 0.02, 61]); g.stroke(); g.restore();
    for (let z = 6; z < 62; z += 12) pool(g, B, 4, FLOOR_Y + 0.02, z, 4.5, '#FFD9A0', 0.16 * warm);
  }
  for (const s of SCONCES) {
    if ((s[0] - E[0]) * Math.sign(s[0] - 4) <= 0 || depth(...s) < 0.8) continue;
    const p = B.project(...s); g.fillStyle = BRASS; g.beginPath(); g.arc(p.x, p.y + p.s * 0.3, p.s * 0.22, 0, 7); g.fill();
    rim(g, p.x, p.y, p.s * 1.1, '#FFE3B0', 0.7 * warm); g.fillStyle = '#FFF4DA'; g.beginPath(); g.arc(p.x, p.y, p.s * 0.16, 0, 7); g.fill();
  }
  trophyWall(g, t, { n, lit, fall });
  if (beams > 0) for (const z of [10, 30]) spotCone(g, B, { top: [4, GAL.top, z], base: [4, FLOOR_Y, z + 4], r0: 0.6, r1: 3.6, a: 0.07 * beams * warm, dust: 16, t, seed: z, color: '#FFE2B0' });
  if (extra) extra(g);
  if (levy) standing(g, levy.who || 'lev', levy.x ?? 4, levy.z ?? 4, { e: levy.e || 'smug', t, k: levy.k || 1, face: -1, walk: levy.walk || 0, phase: levy.phase || 0 });
  if (front) front(g);
  if (warm < 1) { g.fillStyle = `rgba(6,16,24,${(0.42 * (1 - warm)).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  lowKey(g, { cy: H * 0.45, a: 0.22 });
}

// ---------- the Hikaru plaque: a cartoon portrait in a walnut frame hanging in the hall, 17 tally marks cut under it ----------
const HKC = makeCanvas(600, 1000), hkx = HKC.getContext('2d');
function hikaruTex(t, u) {
  const x = hkx; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  x.fillStyle = '#2A1A0E'; x.fillRect(0, 0, 600, 1000);
  webcam(x, 30, 30, 540, 580, 'hik', 'worried', t, { bg: ['#9FC2E8', '#3A5E86'], name: 'HIKARU', nameColor: LEVY_C, zoom: 1.08, cy: 0.52 });
  x.fillStyle = '#E9D9B8'; x.beginPath(); x.roundRect(30, 640, 540, 330, 14); x.fill();
  const n = Math.floor(clamp(u) * 17 + 1e-6);
  x.strokeStyle = '#3A2414'; x.lineCap = 'round'; x.lineWidth = 12;
  for (let i = 0; i < n; i++) {
    const grp = Math.floor(i / 5), j = i % 5, gx = 70 + (grp % 2) * 250, gy = 690 + Math.floor(grp / 2) * 140;
    x.beginPath();
    if (j < 4) { x.moveTo(gx + j * 40, gy); x.lineTo(gx + j * 40 + 4, gy + 100); } else { x.moveTo(gx - 16, gy + 90); x.lineTo(gx + 156, gy + 8); }
    x.stroke();
  }
  x.font = sans(80, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = n >= 17 ? '#B8261E' : 'rgba(58,36,20,0.25)'; x.fillText('×17', 440, 900);
  return HKC;
}
function hikaruPlaque(g, t, u, c = [4, 5.2, 12]) {
  const hw = 2.4, hh = 4.0;
  for (const sx of [-1, 1]) { g.save(); g.strokeStyle = '#9A8A6A'; g.lineWidth = 3; g.beginPath(); line3(g, [c[0] + sx * 1.8, c[1] + hh + 0.3, c[2]], [c[0] + sx * 2.4, GAL.top, c[2]]); g.stroke(); g.restore(); }
  obox(g, c, [hw + 0.3, hh + 0.3, 0.18], WALNUT, {}, { spec: 0.3 });
  texQuad(g, hikaruTex(t, u), [c[0] - hw, c[1] + hh, c[2] - 0.2], [c[0] + hw, c[1] + hh, c[2] - 0.2], [c[0] - hw, c[1] - hh, c[2] - 0.2]);
  pool(g, B, c[0], FLOOR_Y + 0.02, c[2] - 2, 5, '#FFD9A0', 0.2);
}

// ---------- the rating tube: a glass column on a walnut base filling with gold up to his best FIDE rating, a red laser
// ring at 2500 ----------
const TUBE = { x: 4, z: 30, y0: -1.6 }, ry = r => TUBE.y0 + (r - 2000) / 50;
function ratingTube(g, t, { v = 2000, laser = 1 } = {}) {
  const { x, z, y0 } = TUBE;
  ab(g, [x - 1.6, FLOOR_Y, z - 1.6], [x + 1.6, y0, z + 1.6], WALNUT, { spec: 0.3 });
  cylinder(g, [x, y0, z], [x, ry(Math.max(2005, v)), z], 0.92, GOLD, { n: 26, spec: 0.7 });
  if (laser > 0 && depth(x, ry(2500), z) > 1) {  // the ring of light at 2500
    g.save(); g.globalAlpha *= laser; g.strokeStyle = RED; g.shadowColor = RED; g.shadowBlur = 24; g.lineWidth = 7; g.beginPath();
    for (let i = 0; i < 40; i++) { const a = i / 40 * 6.2832, b2 = (i + 1) / 40 * 6.2832; line3(g, [x + Math.cos(a) * 1.9, ry(2500), z + Math.sin(a) * 1.9], [x + Math.cos(b2) * 1.9, ry(2500), z + Math.sin(b2) * 1.9]); }
    g.stroke(); g.restore();
  }
  cylinder(g, [x, y0, z], [x, ry(2620), z], 1.08, '#CFEFF5', { n: 26, a: 0.2, spec: 0.9 });
  g.save(); g.strokeStyle = rgba(CREAM, 0.5); g.lineWidth = 2; g.beginPath();
  for (let r = 2000; r <= 2600; r += 100) line3(g, [x - 1.12, ry(r), z - 0.2], [x - 1.5, ry(r), z - 0.2]);
  g.stroke(); g.restore();
  pool(g, B, x, FLOOR_Y + 0.02, z, 4, GOLD, 0.2);
}

// ---------- the phone with the viral video; the comment sheet slides up (u) and shows his comment ----------
const APP = memo(600, 1100);
const SHEET = 470;  // the sheet's top when up, in texture pixels
function appTex(u) {
  const k = Math.round(clamp(u) * 24);
  return APP('app:' + k, (x, w, h) => {
    x.fillStyle = '#0E0E10'; x.fillRect(0, 0, w, h);
    const s = 52, bx = 92, by = 170;  // the video: a board with a mounted black king glowing
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { x.fillStyle = (r + f) % 2 ? GREEN.dark : GREEN.light; x.fillRect(bx + f * s, by + r * s, s, s); }
    const kg = x.createRadialGradient(300, 380, 10, 300, 380, 220); kg.addColorStop(0, 'rgba(245,196,81,0.55)'); kg.addColorStop(1, 'rgba(245,196,81,0)'); x.fillStyle = kg; x.fillRect(0, 150, w, 460);
    drawPiece(x, 'k', 'b', 300, 470, 260, { glow: GOLD });
    x.fillStyle = 'rgba(255,255,255,0.9)'; x.font = sans(60, 900); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('♥', 540, 680); x.fillText('💬', 540, 800); x.fillText('↗', 540, 915);
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(30, 1060, w - 60, 5); x.fillStyle = '#FFFFFF'; x.fillRect(30, 1060, (w - 60) * 0.62, 5);
    if (k > 0) {
      const top = lerp(h + 10, SHEET, ease.out(k / 24));
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1F1F1F'; x.beginPath(); x.roundRect(0, top, w, h - top + 40, 26); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = sans(28, 800); x.fillText('Comments', w / 2, top + 36);
      x.drawImage(COMMENT_C, 0, top + 70, 600, 200);
      x.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(60, top + 330 + i * 110, 30, 0, 7); x.fill(); x.fillRect(110, top + 312 + i * 110, 300 - i * 50, 16); x.fillRect(110, top + 342 + i * 110, 380 - i * 40, 14); }
    }
  });
}
// the phone in the air; when the sheet is up, his comment is drawn again over it from the full-size screenshot
function phone3(g, c, u, hl, { ry: yaw = 0, rx = 0, s = 1 } = {}) {
  const hw = 1.6 * s, hh = 2.95 * s;
  obox(g, c, [hw + 0.18 * s, hh + 0.22 * s, 0.14 * s], '#15161A', { ry: yaw, rx }, { spec: 0.5 });
  const R = rot3([1, 0, 0], { ry: yaw, rx }), U = rot3([0, 1, 0], { ry: yaw, rx }), N = rot3([0, 0, -1], { ry: yaw, rx });
  const P = (a, b, d = 0.16) => [c[0] + R[0] * a + U[0] * b + N[0] * d * s, c[1] + R[1] * a + U[1] * b + N[1] * d * s, c[2] + R[2] * a + U[2] * b + N[2] * d * s];
  if (vdot(N, vsub(B.E, c)) <= 0) return;
  texQuad(g, appTex(u), P(-hw, hh), P(hw, hh), P(-hw, -hh));
  if (u >= 1) { const v1 = hh - (SHEET + 70) / 1100 * 2 * hh; texQuad(g, commentTex(hl), P(-hw, v1, 0.17), P(hw, v1, 0.17), P(-hw, v1 - 2 * hw / 3, 0.17), { under: false }); }
}

// ---------- the online stage at night: the board in a dark pine space under a brass grid, Caruana's webcam and Levy's
// behind the far side, the clock beside the board ----------
const CAMC = { fab: makeCanvas(600, 720), lev: makeCanvas(600, 720) };
const CAMLOOK = {
  fab: { bg: ['#FFC9A8', '#8A3A2A'], name: 'FABIANOCARUANA', nameColor: '#FFB59A', glow: '#FFB27A' },
  lev: { bg: ['#9FD3FF', '#3E7FC0'], name: 'GOTHAMCHESS', nameColor: LEVY_C, glow: '#9FD3FF' },
};
function camTex(who, e, t, { shake = 0, zoom = 1 } = {}) {
  const c = CAMC[who], x = c.getContext('2d'), L = CAMLOOK[who];
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 600, 720);
  webcam(x, 0, 0, 600, 720, who, e, t, { bg: L.bg, name: L.name, nameColor: L.nameColor, zoom: 1.05 * zoom, cy: 0.5, shake });
  return c;
}
const CAMPOS = { fab: [[0.6, 4.6, 11.2], 0.16], lev: [[7.4, 4.6, 11.2], -0.16] };
const STARS = (() => { const r = rng(17); return [...Array(140)].map(() => { const a = r() * 6.2832, e = r() * 1.2 + 0.05; return [4 + Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, 4 + Math.sin(a) * Math.cos(e) * 300, 0.5 + r() * 1.5]; }); })();
function nightSky(g, { glow = '#1F4A38' } = {}) {
  const y = hz(), gr = g.createLinearGradient(0, y - 1500, 0, y + 200);
  gr.addColorStop(0, '#050E0B'); gr.addColorStop(0.6, '#0C2219'); gr.addColorStop(1, glow);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,243,224,0.8)';
  for (const [x, yy, z, r] of STARS) { if (depth(x, yy, z) < 1) continue; const p = B.project(x, yy, z); if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill(); }
}
function onlineStage(g, t, { pieces, under = null, over = null, cams = null, clock = null, camA = 1 } = {}) {
  nightSky(g);
  g.save(); g.strokeStyle = rgba(BRASS, 0.18); g.lineWidth = 2; g.beginPath();
  for (let i = -24; i <= 32; i += 2) line3(g, [i, -3, -24], [i, -3, 60]);
  for (let i = -24; i <= 60; i += 2) line3(g, [-24, -3, i], [32, -3, i]);
  g.stroke(); g.restore();
  spotCone(g, B, { top: [-2, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.07, dust: 18, t, seed: 4, color: '#FFE2B0' });
  spotCone(g, B, { top: [10, 16, 2], base: [4, -0.35, 4], r0: 0.3, r1: 5, a: 0.05, dust: 14, t, seed: 9, color: '#9FF0E6' });
  const back = () => {
    if (!cams || camA <= 0) return;
    for (const who of ['fab', 'lev']) { const [c, ry2] = CAMPOS[who], o = cams[who] || {}; camPanel(g, camTex(who, o.e || 'neutral', t, o), c, 2.5, 3.0, ry2, { glow: CAMLOOK[who].glow, a: camA, frame: '#10201A' }); }
  };
  if (B.E[2] < 11) back();
  pool(g, B, 4, -0.4, 4, 10, '#FFD9A8', 0.2);
  const clockFirst = clock && depth(9.9, 0.1, 4) > depth(4, 0, 4);
  if (clockFirst) lcdClock(g, clock);
  B.drawSlab(g, GREEN);
  if (under) under(g);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 });
  if (over) over(g);
  if (clock && !clockFirst) lcdClock(g, clock);
  if (B.E[2] >= 11) back();
  lowKey(g, { cy: H * 0.46, a: 0.2 });
}

// ---------- the night mountain: its ridge is a rating line climbing to the peak, 3014; a flag on the summit ----------
const PEAK = { x: 4, y: 22, z: 34 };
const RIDGE = (() => {
  const r = rng(23), P = [];
  for (let x = -64; x <= 74; x += 2) {
    let y;
    if (x < PEAK.x) { const u = (x + 64) / (PEAK.x + 64); y = -3 + 25 * u ** 1.7 + (x > PEAK.x - 3 ? 0 : (r() - 0.5) * 3.2 * u); }
    else y = PEAK.y - (x - PEAK.x) * 0.42 + (x === PEAK.x ? 0 : (r() - 0.5) * 2.4);
    P.push([x, Math.max(-3, y)]);
  }
  return P;
})();
const ridgeY = x => { for (let i = 0; i + 1 < RIDGE.length; i++) { const [a, ya] = RIDGE[i], [b, yb] = RIDGE[i + 1]; if (x >= a && x <= b) return lerp(ya, yb, (x - a) / (b - a)); } return -3; };
const MLIGHT = vnorm([-0.55, 0.7, -0.45]);
const FLAG = tex(512, 300, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#FFD877'); gr.addColorStop(1, '#D99A2B'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.font = sans(170, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#1A1206'; x.fillText('3014', w / 2, h / 2 + 10);
});
// the near face as a low-poly height field: rows from the crest (z PEAK.z) down toward the camera; every vertex a
// little jittered, so the facets catch the moonlight differently
const HFIELD = (() => {
  const r = rng(29), rows = [];
  for (let j = 0; j <= 12; j++) {
    const z = PEAK.z - j * 2.6;
    rows.push(RIDGE.map(([x, hr]) => {
      const f = clamp(1 - (PEAK.z - z) / (5 + (hr + 3) * 0.8)), jx = j ? (r() - 0.5) * 0.8 : (r(), 0), jy = j && f > 0 && f < 1 ? (r() - 0.5) * 1.6 : (r(), 0);
      return [x + jx, -3 + (hr + 3) * f ** 1.2 + jy * f, z];
    }));
  }
  const tris = [];
  for (let j = 0; j + 1 < rows.length; j++) for (let i = 0; i + 1 < RIDGE.length; i++) {
    const a = rows[j][i], b = rows[j][i + 1], c = rows[j + 1][i], d = rows[j + 1][i + 1];
    for (const T of [[a, b, c], [b, d, c]]) {
      if (Math.max(...T.map(p => p[1])) <= -2.9) continue;
      let n = vnorm(vcross(vsub(T[1], T[0]), vsub(T[2], T[0]))); if (n[1] < 0) n = n.map(v => -v);
      const k = 0.38 + 0.62 * Math.max(0, vdot(n, MLIGHT)), hgt = vmid(T)[1];
      const base = hgt > 14 ? mix('#4A7A70', '#E4F0EE', clamp((hgt - 14) / 5)) : mix('#1E3E36', '#3E6A5E', clamp((hgt + 3) / 17));
      tris.push({ T, col: shadeC(base, k), c: vmid(T) });
    }
  }
  return tris;
})();
function mountain(g, t, { line = 1, flag = 1, levy = true, e = 'triumph' } = {}) {
  nightSky(g, { glow: '#28553F' });
  const mp = [40, 46, 240];  // the moon
  if (depth(...mp) > 2) { const p = B.project(...mp), R = p.s * 7; rim(g, p.x, p.y, R * 5, '#BFE8D8', 0.25); g.fillStyle = '#F4F1E6'; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.fill(); }
  for (const [z, k, col] of [[120, 0.75, '#1B3A33'], [80, 0.88, '#16302A']]) {  // the far ranges
    const pts = RIDGE.map(([x, y]) => [x * 1.6 - 20 + z * 0.1, -3 + (y + 3) * k, z]);
    if (B.poly(g, [[pts[0][0], -3, z], ...pts, [pts[pts.length - 1][0], -3, z]])) { g.fillStyle = col; g.fill(); }
  }
  quad(g, [[-200, -3, -40], [200, -3, -40], [200, -3, 70], [-200, -3, 70]], '#0D2019');  // the valley floor
  g.lineWidth = 1;
  HFIELD.map(f => [depth(...f.c), f]).filter(([d]) => d > 0.5).sort((a, b) => b[0] - a[0]).forEach(([, f]) => { if (B.poly(g, f.T)) { g.fillStyle = g.strokeStyle = f.col; g.fill(); g.stroke(); } });
  if (line > 0) {  // the gold rating line along the crest, drawn up to the summit
    const n = Math.max(2, Math.round(clamp(line) * (RIDGE.findIndex(p => p[0] === PEAK.x) + 1)));
    g.save(); g.strokeStyle = GOLD; g.shadowColor = GOLD; g.shadowBlur = 20; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath();
    for (let i = 0; i + 1 < n; i++) line3(g, [RIDGE[i][0], RIDGE[i][1] + 0.15, PEAK.z - 0.05], [RIDGE[i + 1][0], RIDGE[i + 1][1] + 0.15, PEAK.z - 0.05]);
    g.stroke(); g.restore();
  }
  if (flag > 0) {  // the flag runs up its pole, flying to the left of it
    const px = PEAK.x - 0.4, py = ridgeY(px), top = py + 6, fy = lerp(py + 1.8, top, ease.out(clamp(flag)));
    cylinder(g, [px, py - 0.2, PEAK.z - 0.3], [px, top + 0.2, PEAK.z - 0.3], 0.07, '#D8D2C4', { n: 8 });
    const wv = Math.sin(t * 5) * 0.2;
    texQuad(g, FLAG, [px - 3.2, fy + wv, PEAK.z - 0.3 + wv], [px - 0.06, fy, PEAK.z - 0.3], [px - 3.2, fy - 1.85 + wv, PEAK.z - 0.3 + wv]);
  }
  if (levy) standing(g, 'lev', PEAK.x + 1.0, PEAK.z - 0.35, { e, t, k: 0.55, y0: ridgeY(PEAK.x + 1.0) - 0.15, face: -1 });
  lowKey(g, { cy: H * 0.42, a: 0.22 });
}

// ---------- the classical tournament hall by day: tall windows, green banners, parquet, rows of tables; Levy (Black)
// at the main table facing the camera, his opponent's back to it; the GM diploma on the back wall ----------
const HALL = { xl: -16, xr: 24, zf: -16, zb: 24, top: 18 };
const WINDOW = tex(512, 1024, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#CFEAFF'); gr.addColorStop(1, '#FFF6E2'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.ellipse(150, 260, 120, 40, 0, 0, 7); x.fill();
  x.strokeStyle = '#F2EBDD'; x.lineWidth = 22; x.strokeRect(0, 0, w, h); x.lineWidth = 12; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); for (let i = 1; i < 4; i++) { x.moveTo(0, h * i / 4); x.lineTo(w, h * i / 4); } x.stroke();
});
const BANNER = tex(256, 768, (x, w, h) => {
  x.fillStyle = '#1F5240'; x.fillRect(0, 0, w, h); x.fillStyle = BRASS; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 60, w, 10);
  drawPiece(x, 'k', 'w', w / 2, 470, 300); x.font = sans(40, 900); x.textAlign = 'center'; x.fillStyle = GOLD; x.letterSpacing = '6px'; x.fillText('CLASSICAL', w / 2, 600);
});
const BOARDTOP = tex(256, 256, (x, w, h) => { for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { x.fillStyle = (r + f) % 2 ? GREEN.dark : GREEN.light; x.fillRect(f * 32, r * 32, 32, 32); } });
function diplomaTex(seals, rate) {
  const k = Math.round(clamp(seals, 0, 3) * 4), q = Math.round(clamp(rate) * 8);
  return once(`dip:${k}:${q}`, 900, 1200, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#FBF1D8'); gr.addColorStop(1, '#E6D2A6'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#A8823A'; x.lineWidth = 10; x.strokeRect(36, 36, w - 72, h - 72); x.lineWidth = 3; x.strokeRect(58, 58, w - 116, h - 116);
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#5A3A1A';
    x.font = sans(34, 800); x.letterSpacing = '10px'; x.fillText('THE TITLE OF', w / 2, 170);
    x.font = serif(104, 700); x.letterSpacing = '2px'; x.fillStyle = '#3A2410'; x.fillText('Grandmaster', w / 2, 290);
    x.fillStyle = '#A8823A'; x.fillRect(w / 2 - 120, 352, 240, 5);
    x.font = sans(30, 800); x.letterSpacing = '6px'; x.fillStyle = '#5A3A1A'; x.fillText('OVER THE BOARD · CLASSICAL', w / 2, 420);
    for (let i = 0; i < 3; i++) {  // the three norms: wax seals stamped in turn
      const cx = 210 + i * 240, cy = 640, on = clamp(k / 4 - i);
      x.setLineDash([12, 10]); x.strokeStyle = 'rgba(90,58,26,0.5)'; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, 92, 0, 7); x.stroke(); x.setLineDash([]);
      if (on > 0) {
        const sg = x.createRadialGradient(cx - 25, cy - 30, 10, cx, cy, 96); sg.addColorStop(0, '#E0473C'); sg.addColorStop(1, '#8E1A16');
        x.save(); x.globalAlpha = on; x.fillStyle = sg; x.beginPath(); for (let a = 0; a < 24; a++) { const r = a % 2 ? 90 : 98, an = a / 24 * 6.2832; x.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } x.closePath(); x.fill();
        x.font = sans(34, 900); x.letterSpacing = '3px'; x.fillStyle = '#FFE1C8'; x.fillText('NORM', cx, cy - 16); x.font = sans(52, 900); x.fillText(String(i + 1), cx, cy + 30); x.restore();
      }
      x.font = sans(26, 800); x.letterSpacing = '4px'; x.fillStyle = '#5A3A1A'; x.fillText('2600+ PERF.', cx, cy + 140);
    }
    x.globalAlpha = 0.35 + 0.65 * (q / 8);
    x.font = sans(40, 900); x.letterSpacing = '6px'; x.fillStyle = '#3A2410'; x.fillText('FIDE RATING', w / 2, 900);
    x.font = mono(150, 800); x.letterSpacing = '0px'; x.fillStyle = q >= 8 ? '#B8261E' : '#5A3A1A'; x.fillText('2500', w / 2, 1010);
    x.globalAlpha = 1;
  });
}
const DIP = { c: [4, 8.6, 23.85], hw: 3.0, hh: 4.0 };
function hallRoom(g, t, { seals = 0, rate = 0, warm = 1 } = {}) {
  const E = B.E;
  g.fillStyle = '#E8E2D4'; g.fillRect(0, 0, W, H);
  const wl = { color: '#EDE6D6', grout: 'rgba(0,0,0,0.05)', tu: 40, tv: 40 };
  if (E[1] < HALL.top) tiled(g, [HALL.xl, HALL.top, HALL.zf], [HALL.xr - HALL.xl, 0, 0], [0, 0, HALL.zb - HALL.zf], { color: '#F4EFE4', grout: 'rgba(0,0,0,0.06)', tu: 4, tv: 4 });
  if (E[1] > FLOOR_Y) tiled(g, [HALL.xl, FLOOR_Y, HALL.zf], [HALL.xr - HALL.xl, 0, 0], [0, 0, HALL.zb - HALL.zf], { color: '#B9844E', grout: 'rgba(80,46,20,0.22)', tu: 1.3, tv: 1.3 });
  if (E[2] < HALL.zb) {
    tiled(g, [HALL.xl, FLOOR_Y, HALL.zb], [HALL.xr - HALL.xl, 0, 0], [0, HALL.top - FLOOR_Y, 0], wl);
    for (const wx of [-9.5, 17.5]) { texQuad(g, WINDOW, [wx - 3, 14.5, HALL.zb - 0.05], [wx + 3, 14.5, HALL.zb - 0.05], [wx - 3, 0.5, HALL.zb - 0.05]); pool(g, B, wx, 7, HALL.zb - 0.1, 9, '#FFF4D6', 0.3, true); }
    for (const bx of [-3.2, 11.2]) texQuad(g, BANNER, [bx - 1.3, 14, HALL.zb - 0.06], [bx + 1.3, 14, HALL.zb - 0.06], [bx - 1.3, 6.2, HALL.zb - 0.06]);
    const { c, hw, hh } = DIP;
    obox(g, c, [hw + 0.35, hh + 0.35, 0.12], '#7A5426', {}, { spec: 0.4 });
    texQuad(g, diplomaTex(seals, rate), [c[0] - hw, c[1] + hh, c[2] - 0.14], [c[0] + hw, c[1] + hh, c[2] - 0.14], [c[0] - hw, c[1] - hh, c[2] - 0.14]);
  }
  if (E[0] > HALL.xl) tiled(g, [HALL.xl, FLOOR_Y, HALL.zf], [0, 0, HALL.zb - HALL.zf], [0, HALL.top - FLOOR_Y, 0], { ...wl, color: '#E2DACA' });
  if (E[0] < HALL.xr) tiled(g, [HALL.xr, FLOOR_Y, HALL.zb], [0, 0, HALL.zf - HALL.zb], [0, HALL.top - FLOOR_Y, 0], { ...wl, color: '#E2DACA' });
  for (const wx of [-9.5, 17.5]) { pool(g, B, wx - 1, FLOOR_Y + 0.02, 14, 7, '#FFE9B8', 0.3 * warm); spotCone(g, B, { top: [wx, 13, HALL.zb - 0.5], base: [wx - 2.5, FLOOR_Y, 12], r0: 2.2, r1: 4.5, a: 0.07 * warm, dust: 14, t, seed: wx > 0 ? 3 : 7, color: '#FFF1D0' }); }
}
// a table further back: a box with a board on top, a few pieces, two players
const FAR = [{ dx: -12, dz: 12, w: 'pa', b: 'pb', k: 0 }, { dx: 14, dz: 12, w: 'pc', b: 'pd', k: 0 }];
function farTable(g, t, { dx, dz, w: pw, b: pb, k }) {
  const cx = 4 + dx, cz = 4 + dz, list = [];
  list.push([depth(cx, 3.1, cz + 5.3), () => seated(g, B, pb, 'focus', t, { x: cx, z: cz + 5.3, face: -1, hands: false })]);
  list.push([depth(cx, 0, cz), () => {
    ab(g, [cx - 4.6, FLOOR_Y, cz - 3.4], [cx + 4.6, -0.75, cz + 3.4], '#6A4A30');
    ab(g, [cx - 5, -0.75, cz - 3.8], [cx + 5, -0.35, cz + 3.8], TABLE[0], { spec: 0.2 });
    ab(g, [cx - 2.4, -0.35, cz - 2.4], [cx + 2.4, -0.05, cz + 2.4], GREEN.frame);
    texQuad(g, BOARDTOP, [cx - 2.2, -0.04, cz + 2.2], [cx + 2.2, -0.04, cz + 2.2], [cx - 2.2, -0.04, cz - 2.2], { under: true });
    B.drawPieces(g, CG[k].pieces.map(p => { const [x, z] = sqXZ(p.sq); return { ...p, x: cx - 2.2 + x * 0.55, z: cz - 2.2 + z * 0.55, y: -0.04, scale: 0.55 }; }), { dof: 0 });
  }]);
  list.push([depth(cx, 3.1, cz - 5.3), () => seated(g, B, pw, 'focus', t, { x: cx, z: cz - 5.3, face: 1, hands: false })]);
  list.sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
}
function tournamentHall(g, t, { tab = {}, seals = 0, rate = 0, grey = 0, walker = null, far = true } = {}) {
  hallRoom(g, t, { seals, rate, warm: 1 - grey });
  if (far) FAR.map(f => [depth(4 + f.dx, 0, 4 + f.dz), f]).sort((a, b) => b[0] - a[0]).forEach(([, f]) => farTable(g, t, f));
  tableSet(g, t, { pieces: board(CG, 0), white: 'opp', black: 'lev', ew: 'focus', eb: 'focus', wPlayer: true,
    clock: { names: ['OPP', 'LEVY'], cols: [CREAM, LEVY_C], l: 5400, r: 5400, run: 2 }, behind: walker, ...tab });
  if (grey > 0) { g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${(0.85 * grey).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore(); g.fillStyle = `rgba(10,18,24,${(0.25 * grey).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  lowKey(g, { cy: H * 0.45, a: 0.14 });
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
  const KW = (yaw, pitch, dist, target) => K(yaw, pitch, dist, target, { fov: 1100 });  // the gallery: a wider lens
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
  const andA = w('hook', 'and') - 0.06, notT = w('hook', 'not'), oneT = w('hook', 'one');
  const photoA = s('name') - 0.06, huntA = w('name', 'the') - 0.06, huntT = w('name', 'hunter');
  const claimA = s('claim') - 0.06, thirdT = w('claim', 'third'), viralA = w('claim', 'then') - 0.06, viralT = w('claim', 'viral'), wroteT = w('claim', 'wrote');
  const fiftyA = s('fifty') - 0.06, fiftyT = w('fifty', 'fifty'), soonT = w('fifty', 'soon');
  const countA = s('count') - 0.06, countedT = w('count', 'counted'), t34 = w('count', 'thirty-four'), gamesT = w('count', 'games');
  const gmA = w('count', 'five') - 0.06, gmsT = w('count', 'grandmasters');
  const hikA = s('hikaru') - 0.06, sevT = w('hikaru', 'seventeen');
  const marchA = s('caruana') - 0.06, fabA = w('caruana', 'fabiano') - 0.06, fabT = w('caruana', 'caruana'), sevenA = w('caruana', 'seven') - 0.06,
    rookT = w('caruana', 'rook'), rookA = rookT - 0.08, mateT = w('caruana', 'checkmate') - 0.04;
  const peakA = s('peak') - 0.06, peaksT = w('peak', 'peaks'), sumA = w('peak', 'three') - 0.06, p14T = w('peak', 'fourteen');
  const whyA = s('why') - 0.06, gmQT = w('why', 'grandmaster'), noneA = w('why', 'because') - 0.06, noneT = w('why', 'none'), countsT = w('why', 'counts');
  const rulesA = s('rules') - 0.06, boardT = w('rules', 'board'), classA = w('rules', 'in') - 0.06, classT = w('rules', 'classical'),
    normsA = w('rules', 'three') - 0.06, normsT = w('rules', 'norms'), r2500T = w('rules', '2500');
  const bestA = s('best') - 0.06, r2421T = w('best', '2421'), winsA = w('best', 4) - 0.06, winsT = w('best', 'wins'), onlineA = w('best', 'online') - 0.06,
    onlineT = w('best', 'online'), blitzT = w('best', 'blitz');
  const quitA0 = s('comeback') - 0.06, stressA = w('comeback', 'the') - 0.06, quitT = w('comeback', 'quit'), quitA = quitT - 0.06,
    backA = w('comeback', 7) - 0.06, seatA = w('comeback', 'he') - 0.06, titleA = w('comeback', 'for') - 0.06, titleT = w('comeback', 'title');
  const paceA = s('pace') - 0.06, fifty2T = w('pace', 'fifty'), yearsA = w('pace', 'at') - 0.06, y2033T = w('pace', '2033'), oldA = y2033T - 0.06;
  const ctaA = s('cta') - 0.06, comT = w('cta', 'comment'), numT = w('cta', 'number');
  const LZ = 6;  // Levy's place in the gallery

  // ======================= HOOK (rules 1, 28, 42): Levy among 503 mounted kings; "not even one" =======================
  const HOOKK = [KW(0.0, 0.02, 15.5, [4, 3.0, LZ]), KW(0.0, 0.03, 13.6, [4, 3.0, LZ])];
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, HOOKK[0]], [len(sh), HOOKK[1]]], { t, e: lin });
    gallery(g, t, { levy: { z: LZ, e: 'smug' } });
  }, { hud: (g, lt, t) => coverTitle(g, 'HE BEAT', '503 GMs', 205) });
  shot(andA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.32, 0.1, 9.5, [4, 3.4, LZ])], [len(sh), KW(0.24, 0.08, 8.2, [4, 3.5, LZ])]], { t, bump: t > notT && t < notT + 0.3 ? 1 : 0 });
    gallery(g, t, { levy: { z: LZ, e: t >= notT + 0.1 ? 'worried' : 'smug' }, front: g2 => tag3(g2, 4, 6.0, LZ, 'TITLE: IM', RED, seg(t, oneT - 0.1, oneT + 0.2, lin)) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= notT) stamp(g, 'NOT A GM', W / 2, 1530, t, notT, { color: RED, size: 100 }); } });
  cue(0, 'whoosh_soft', 0.2); cue(0.05, 'shimmer', 0.3); cue(0.6, 'reveal_bell', 0.3); cue(andA - 0.06, 'whoosh_fast', 0.3);
  cue(notT - 0.004, 'boom', 0.55); cue(notT, 'stamp', 0.5); cue(notT + 0.05, 'record_scratch', 0.3);

  // ======================= THE REAL LEVY; "THE GRANDMASTER HUNTER" from below =======================
  const lvKeys = { from: { x: 0.5, y: 0.36, zoom: 1.0, dolly: 0 }, to: { x: 0.51, y: 0.36, zoom: 1.07, dolly: 0.05 } };
  shot(photoA, (g, lt, t) => photoShot(g, lt, PH.levy, { ...lvKeys, dur: huntA - photoA + 0.3 }), { trans: 'whip', hud: (g, lt, t) => {
    nameTitle(g, lt, 'Levy Rozman', 'INTERNATIONAL MASTER · GOTHAMCHESS', { y: 200, size: 62, t0: 0.05 }); credit(g, CREDITS.levy, seg(lt, 0.4, 0.6) * 0.75);
  } });
  shot(huntA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(-0.34, -0.3, 10, [4, 4.6, LZ])], [len(sh), KW(-0.2, -0.36, 8.6, [4, 4.9, LZ])]], { t, bump: t > huntT && t < huntT + 0.3 ? 1.3 : 0 });
    gallery(g, t, { levy: { z: LZ, e: 'smug' } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= huntT - 0.05) coverTitle(g, 'THE GRANDMASTER', 'HUNTER', 205, { a: seg(t, huntT - 0.05, huntT + 0.08) }); } });
  cue(photoA - 0.06, 'whoosh_deep', 0.3); cue(photoA + 0.1, 'camera', 0.3); cue(huntA - 0.06, 'whoosh_fast', 0.3); cue(huntA + 0.1, 'riser', 0.3);
  cue(huntT - 0.004, 'boom_big', 0.6); cue(huntT + 0.02, 'shimmer', 0.3);

  // ======================= "NEARLY A THIRD": down the hall to the scoreboard =======================
  const THIRD = Math.round(NALL / 3);
  shot(claimA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0, 0.03, 26, [4, 5.4, 34])], [len(sh), K(0, 0.0, 13.2, PANEL.c)]], { t, e: ease.out });
    const v = THIRD * seg(t, claimA + 0.25, thirdT + 0.1, lin);
    gallery(g, t, { panel: scoreTex('grid', v, { label: t >= thirdT ? '≈ 1/3' : '' }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= thirdT) badge(g, 'THE CLAIM: ~1/3 OF ALL GMs', W / 2, 230, { color: GOLD, size: 46, ...pop(t, thirdT) }); } });
  // the viral video on a phone in the hall; the comments slide up
  const PHC = [4, 5.2, 20];
  shot(viralA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.26, 0.05, 13, PHC)], [len(sh), K(0.08, 0.02, 10.6, PHC)]], { t });
    gallery(g, t, { beams: 0.5, extra: g2 => phone3(g2, PHC, seg(t, wroteT - 0.1, wroteT + 0.35, lin), 0, { ry: Math.sin(t * 0.8) * 0.1 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= viralT) badge(g, 'A VIRAL VIDEO', W / 2, 230, { color: LEVY_C, size: 52, ...pop(t, viralT) }); } });
  cue(claimA - 0.06, 'whoosh_deep', 0.35); cue(claimA + 0.2, 'riser', 0.25); cue(thirdT, 'reveal_bell', 0.35);
  cue(viralA - 0.06, 'whoosh_fast', 0.3); cue(viralT, 'notify', 0.3); cue(wroteT - 0.1, 'swipe_card', 0.35);

  // ======================= HIS COMMENT: the real screenshot, "50% soon" underlined =======================
  const CARD = [3.38, PHC[1] + 0.054 - 0.311, PHC[2] - 0.17];  // the avatar and the words of his comment
  shot(fiftyA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.04, 0.02, 9.5, PHC)], [0.5, K(0, 0, 3.6, CARD), ease.inOut], [len(sh), K(0, 0, 3.2, CARD)]], { t });
    gallery(g, t, { beams: 0.4, extra: g2 => phone3(g2, PHC, 1, seg(t, fiftyT, soonT + 0.15, lin), { ry: 0 }) });
  }, { trans: 'zoom', hud: (g, lt, t) => heading(g, 'HIS REPLY', 230, seg(lt, 0.45, 0.65)) });
  cue(fiftyA + 0.05, 'whoosh_soft', 0.3); cue(fiftyT, 'pen', 0.3); cue(soonT, 'sparkle_pop', 0.3); cue(soonT + 0.15, 'laugh', 0.18);

  // ======================= WE COUNTED: 34,374 games; 503 grandmasters, the hall lighting up =======================
  shot(countA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.04, 17, PANEL.c)], [len(sh), K(-0.04, 0.02, 13.6, PANEL.c)]], { t });
    const v = 34374 * ease.out(seg(t, t34 - 0.1, gamesT + 0.1, lin));
    gallery(g, t, { panel: scoreTex('games', v, { label: t >= gamesT ? 'GAMES' : '' }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= countedT) badge(g, 'WE COUNTED', W / 2, 230, { color: LIME, size: 56, ...pop(t, countedT) }); } });
  const litAt = t => Math.round(NGM * seg(t, gmA + 0.1, gmsT + 0.05, lin));
  shot(gmA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.0, 0.1, 15, [4, 4, 12])], [len(sh), KW(0.0, 0.06, 11, [4, 4.6, 22])]], { t, e: lin });
    const lit = litAt(t);
    gallery(g, t, { lit, panel: scoreTex('grid', lit, { label: t >= gmsT ? '503 BEATEN' : '' }) });
  }, { trans: 'whip', hud: (g, lt, t) => counter(g, fmtN(litAt(t)), 'GRANDMASTERS BEATEN', { y: 330, size: 150, color: GOLD, at: [lt, 0.05] }) });
  cue(countA - 0.06, 'whoosh_fast', 0.3); cue(countedT, 'pen', 0.3); cue(t34 - 0.1, 'typewriter', 0.25); cue(gamesT + 0.1, 'kaching', 0.35);
  cue(gmA - 0.06, 'whoosh_deep', 0.35); cue(gmA + 0.1, 'riser', 0.35); for (let i = 0; i < 8; i++) cue(lerp(gmA + 0.15, gmsT, i / 8), 'ting', 0.12 + i * 0.015);
  cue(gmsT - 0.004, 'boom_big', 0.6); cue(gmsT + 0.05, 'applause', 0.3);

  // ======================= HIKARU, 17 TIMES: his plaque in the hall =======================
  const HKP = [4, 5.2, 12];
  shot(hikA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.3, 0.04, 11.5, [4, 3.6, 12])], [len(sh), KW(0.12, 0.02, 10.4, [4, 3.7, 12])]], { t });
    gallery(g, t, { beams: 0.6, extra: g2 => hikaruPlaque(g2, t, seg(t, sevT, sevT + 0.7, lin), HKP) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= sevT) badge(g, 'BEATEN 17 TIMES', W / 2, 230, { color: GOLD, size: 56, ...pop(t, sevT + 0.1) }); } });
  cue(hikA - 0.06, 'whoosh_fast', 0.3); cue(hikA + 0.08, 'reveal_bell', 0.3); for (let i = 0; i < 17; i++) cue(sevT + i * 0.7 / 17, 'pen', 0.12);
  cue(sevT + 0.75, 'sting', 0.3);

  // ======================= CARUANA, MARCH 2026: the online board at night; 7 seconds; Rh6# =======================
  const PL1 = [...Array(13)].map((_, i) => marchA + 0.25 + i * 0.1);  // plies 110..122, fast
  const LANDS = [...PL1, fabA + 0.6, sevenA + 0.3, sevenA + 0.75, mateT];  // then 123 (off screen), 124, 125, and 126 Rh6#
  const MSLIDE = 0.55;  // the mate: a slow slide
  const gameAt = t => turnedRun(t >= rookA ? runTo(CG, 125, [mateT], t, MSLIDE) : runTo(CG, 109, LANDS.slice(0, -1), t, 0.08));
  const clocks = t => {
    let i = -1; while (i + 1 < LANDS.length && t >= LANDS[i + 1]) i++;
    const k = 110 + i;  // the last ply played
    if (k >= 126) return { names: ['FABI', 'LEVY'], cols: [FAB_C, LEVY_C], l: CLK[125], r: CLK[126], run: 0 };
    const ta = i >= 0 ? LANDS[i] : marchA, u = clamp((t - ta) / (LANDS[i + 1] - ta)), mv = k + 1, runV = lerp(CLK[mv - 2], CLK[mv], u);
    const wT = mv % 2 ? runV : CLK[k % 2 ? k : k - 1], bT = mv % 2 ? CLK[k % 2 ? k - 1 : k] : runV;
    return { names: ['FABI', 'LEVY'], cols: [FAB_C, LEVY_C], l: wT, r: bT, run: mv % 2 ? 1 : 2 };
  };
  const cams = (t, o = {}) => ({ fab: { e: t >= mateT + 0.1 ? 'shock' : 'focus', shake: t >= mateT + 0.1 && t < mateT + 0.6 ? 0.3 : 0 }, lev: { e: t >= mateT + 0.1 ? 'triumph' : 'focus' }, ...o });
  const stage = (g, t, o = {}) => { const r = gameAt(t); onlineStage(g, t, { pieces: r.pieces, cams: cams(t), clock: clocks(t), under: moveFx(r, 0.08, 0.1).under, ...o }); return r; };
  shot(marchA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.08, 0.3, 20, [4, 3.2, 6.4])], [len(sh), K(0.02, 0.27, 17.5, [4, 3.3, 6.6])]], { t, e: lin });
    stage(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'Chess.com · 3+0 blitz', 'MARCH 12, 2026', { y: 200, t0: 0.1 }); } });
  shot(fabA, (g, lt, t, sh) => {
    const [c] = CAMPOS.fab;
    rig(B, lt, [[0, K(-0.3, 0.06, 10.5, [c[0] + 0.3, c[1], c[2]])], [len(sh), K(-0.2, 0.04, 8.6, [c[0] + 0.2, c[1] + 0.1, c[2]])]], { t });
    stage(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= fabT - 0.4) nameTitle(g, t - fabT + 0.4, 'Fabiano Caruana', 'GRANDMASTER · 3242 BLITZ', { y: 200, size: 60 }); } });
  shot(sevenA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.2, 0.14, 4.3, [9.9, 0.1, 3.1])], [len(sh), K(-0.1, 0.1, 3.3, [9.9, 0.1, 3.1])]], { t, shake: 1.6 });
    stage(g, t);
    flashTint(g, RED, 0.1 * (0.5 + 0.5 * Math.sin(t * 9)));
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, 'SECONDS LEFT', W / 2, 230, { color: RED, size: 56, ...pop(t, sevenA + 0.08) }) });
  const KS = r => kingOf(r.pieces, 'w')?.sq || rsq('h4');
  shot(rookA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.44, 13.2, [4, 0.4, 4.2])], [len(sh), K(0.04, 0.4, 11.4, [4, 0.4, 4.0])]], { t, bump: t > mateT && t < mateT + 0.3 ? 1.3 : 0 });
    const r = gameAt(t), mated = t >= mateT;
    onlineStage(g, t, { pieces: halo(r.pieces, ['K1'], RED, seg(t, mateT, mateT + 0.2, lin)), cams: cams(t), clock: clocks(t),
      under: g2 => { moveFx(r, MSLIDE, 0.4).under(g2); if (mated) ledGlow(g2, B, KS(r), RED, t, mateT, { reach: 1.2 }); else squareFrame(g2, B, rsq('h6'), LIME, 0.8 * seg(t, rookT, rookT + 0.2, lin)); },
      over: g2 => { moveFx(r, MSLIDE, 0.4).over(g2); if (t < mateT - MSLIDE) boardArrow(g2, B, rsq('b6'), rsq('h6'), 0.85, seg(t, rookT, rookT + 0.3, lin)); impact(g2, KS(r), t, mateT, { flash: 0.4 }); } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= mateT + 0.1) badge(g, '0 – 1', W / 2, 230, { color: LIME, size: 64, ...pop(t, mateT + 0.1) }); } });
  cue(marchA - 0.06, 'whoosh_deep', 0.3); cue(marchA + 0.1, 'clock_tick', 0.2); PL1.forEach((a, i) => cue(a - 0.02, 'piece', i % 2 ? 0.16 : 0.22));
  cue(fabA - 0.06, 'whoosh_fast', 0.3); cue(fabT, 'ting', 0.3);
  cue(sevenA - 0.06, 'whoosh_fast', 0.3); cue(sevenA + 0.05, 'heartbeat', 0.45); cue(sevenA + 0.3, 'clock_press', 0.45); cue(sevenA + 0.75, 'clock_press', 0.45);
  cue(rookA - 0.04, 'whoosh_soft', 0.25); cue(rookT, 'tick', 0.3); cue(mateT - 0.3, 'revswell', 0.55); boom(mateT, 0.95); landCue(mateT, false, 0.6);
  cue(mateT, 'hit_punch', 0.4); cue(mateT + 0.12, 'gasp', 0.3);

  // ======================= THAT NIGHT: the rating mountain, the flag at 3014 =======================
  shot(peakA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, -0.02, 56, [4, 9, 34])], [len(sh), K(-0.06, 0.03, 36, [4, 12.5, 34])]], { t, e: lin });
    mountain(g, t, { line: seg(t, peakA + 0.1, peaksT + 0.1, lin), flag: 0, levy: true, e: 'focus' });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'That night', 'BLITZ RATING', { y: 200, t0: 0.1 }); } });
  const peakV = t => Math.round(lerp(2950, 3014, ease.out(seg(t, sumA + 0.1, p14T + 0.1, lin))));
  shot(sumA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.02, 15, [3.6, 24.2, 34])], [len(sh), K(-0.18, 0.05, 12.4, [3.6, 24.4, 34])]], { t });
    mountain(g, t, { line: 1, flag: seg(t, sumA + 0.05, sumA + 0.9, lin), e: 'triumph' });
  }, { trans: 'whip', hud: (g, lt, t) => counter(g, String(peakV(t)), 'ALL-TIME HIGH · BLITZ', { y: 330, size: 150, color: GOLD, at: [lt, 0.05] }) });
  cue(peakA - 0.06, 'whoosh_deep', 0.35); cue(peakA + 0.1, 'riser', 0.3); cue(peaksT, 'shimmer', 0.35);
  cue(sumA - 0.06, 'whoosh_fast', 0.3); cue(sumA + 0.1, 'fabric', 0.35); cue(p14T, 'reveal_bell', 0.4); cue(p14T + 0.02, 'boom_big', 0.45); cue(p14T + 0.1, 'cheer', 0.3);

  // ======================= SO WHY ISN'T HE A GM? NONE OF IT COUNTS: the kings fall =======================
  shot(whyA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(-0.22, 0.06, 12.5, [4, 3.2, LZ])], [len(sh), KW(-0.14, 0.05, 10.8, [4, 3.4, LZ])]], { t });
    gallery(g, t, { warm: 0.45, beams: 0.5, levy: { z: LZ, e: 'focus' }, front: g2 => mark(g2, '?', 4, 6.4, LZ, seg(t, gmQT - 0.1, gmQT + 0.2, lin), t, { color: GOLD, size: 1.6 }) });
  }, { trans: 'whip', hud: (g, lt, t) => heading(g, 'WHY ISN\'T HE A GM?', 230, seg(lt, 0.15, 0.35)) });
  const roll = t => Math.round(NGM * (1 - seg(t, noneT, countsT + 0.15, lin)));
  shot(noneA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.0, 0.1, 16, [4, 4, 12])], [len(sh), KW(0.0, 0.07, 13.5, [4, 3.6, 10])]], { t, shake: t > noneT ? 1.8 : 1 });
    gallery(g, t, { warm: 0.4, fall: noneT - 0.02, levy: { z: LZ, e: t >= noneT + 0.2 ? 'shock' : 'worried' } });
    if (t >= noneT) flashTint(g, RED, 0.18 * (1 - seg(t, noneT, noneT + 0.6, lin)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= noneT) counter(g, String(roll(t)), 'COUNT TOWARD THE GM TITLE', { y: 330, size: 150, color: RED, at: [t, noneT] }); } });
  cue(whyA - 0.06, 'whoosh_deep', 0.3); cue(gmQT, 'ting', 0.25); cue(noneA - 0.06, 'whoosh_fast', 0.25);
  cue(noneT - 0.004, 'boom_cine', 0.6); for (let i = 0; i < 7; i++) cue(noneT + 0.25 + i * 0.09, 'thud', 0.2); cue(countsT, 'dun_dun', 0.35);

  // ======================= THE RULES: a classical hall by day; 90 minutes; three norms and 2500 =======================
  shot(rulesA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.46, 0.14, 26, [4, 4.0, 9])], [len(sh), K(0.38, 0.12, 21.5, [4, 3.8, 9])]], { t, e: lin });
    tournamentHall(g, t, { tab: { eb: 'focus' } });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g, 0.5); if (t >= boardT) badge(g, 'OVER THE BOARD', W / 2, 230, { color: LIME, size: 58, ...pop(t, boardT) }); } });
  shot(classA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.28, 0.2, 6.2, [9.9, 0.25, 3.1])], [len(sh), K(-0.2, 0.17, 5.2, [9.9, 0.2, 3.1])]], { t });
    tournamentHall(g, t, { tab: { eb: 'focus', wPlayer: false } });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g, 0.5); if (t >= classT) badge(g, 'CLASSICAL · 90 MINUTES', W / 2, 230, { color: GOLD, size: 50, ...pop(t, classT) }); } });
  const DK = [DIP.c[0], DIP.c[1] - 1.4, DIP.c[2]];
  shot(normsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.02, 13, DK)], [len(sh), K(0.02, 0.0, 10.6, DK)]], { t });
    tournamentHall(g, t, { seals: 3 * seg(t, normsT - 0.12, normsT + 0.5, lin), rate: seg(t, r2500T - 0.1, r2500T + 0.15, lin), far: false });
  }, { trans: 'whip' });
  cue(rulesA - 0.06, 'whoosh_deep', 0.3); cue(rulesA + 0.1, 'murmur', 0.2); cue(boardT, 'piece', 0.4); cue(classA - 0.06, 'whoosh_fast', 0.25); cue(classT, 'clock_press', 0.4);
  cue(normsA - 0.06, 'whoosh_fast', 0.3); for (let i = 0; i < 3; i++) cue(normsT - 0.12 + i * 0.2 + 0.12, 'stamp', 0.4); cue(r2500T, 'reveal_bell', 0.35);

  // ======================= HIS BEST: 2421, 79 short; his wins: online blitz and bullet =======================
  const tubeV = t => lerp(2000, 2421, ease.out(seg(t, bestA + 0.1, r2421T + 0.15, lin)));
  shot(bestA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.18, 0.04, 16, [4, 4.6, TUBE.z])], [len(sh), K(0.08, 0.03, 13.4, [4, 5.0, TUBE.z])]], { t });
    gallery(g, t, { warm: 0.8, beams: 0.5, extra: g2 => {
      ratingTube(g2, t, { v: tubeV(t), laser: seg(t, bestA + 0.2, bestA + 0.5, lin) });
      tag3(g2, 6.9, ry(2500), TUBE.z, '2500 · GM', RED, seg(t, bestA + 0.3, bestA + 0.6, lin));
      tag3(g2, 1.1, ry(tubeV(t)), TUBE.z, String(Math.round(tubeV(t))), GOLD, seg(t, bestA + 0.2, bestA + 0.5, lin));
    } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'HIS BEST FIDE RATING', W / 2, 230, { color: GOLD, size: 46, ...pop(t, bestA + 0.1) });
    if (t >= r2421T + 0.6) badge(g, '79 POINTS SHORT', W / 2, 335, { color: RED, size: 52, ...pop(t, r2421T + 0.6) });
  } });
  const bulletFeed = (g2, t) => { rig(B, 0, [[0, K(0, 0.3, 17, [4, 2.0, 5])], [1, K(0, 0.3, 17, [4, 2.0, 5])]], { t }); onlineStage(g2, t, { pieces: board(CG, 40 + Math.floor((t - winsA) * 7) % 70), cams: null }); };
  const roomScreen = t => monitorScreen(feed(g2 => bulletFeed(g2, t)), { title: 'CHESS.COM · LIVE · 1 MIN BULLET' });
  shot(winsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.56, 0.26, 9.2, [4, 3.0, -1.4])], [len(sh), K(PI + 0.48, 0.24, 8.0, [4, 3.1, -1.4])]], { t });
    levyRoom(g, t, { screen: roomScreen(t), e: 'focus' });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); if (t >= winsT) badge(g, '503 GMs BEATEN?', W / 2, 230, { color: GOLD, size: 54, ...pop(t, winsT) }); } });
  shot(onlineA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.62, 0.32, 6.8, [4.2, 2.6, 2.4])], [0.55, PANELK, ease.inOut], [len(sh), PANELK]], { t, shake: lt < 0.55 ? 1 : 0 });
    levyRoom(g, t, { screen: roomScreen(t), e: 'focus' });
  }, { kb: 0, hud: (g, lt, t) => {
    badge(g, 'ONLINE', W / 2, 230, { color: LEVY_C, size: 60, ...pop(t, onlineT) });
    if (t >= blitzT) badge(g, 'BLITZ · BULLET', W / 2, 335, { color: CREAM, size: 52, ...pop(t, blitzT) });
  } });
  cue(bestA - 0.06, 'whoosh_deep', 0.3); cue(bestA + 0.1, 'riser', 0.25); cue(r2421T + 0.1, 'glass', 0.35); cue(r2421T + 0.6, 'error', 0.3);
  cue(winsA - 0.06, 'whoosh_fast', 0.3); cue(winsT, 'ting', 0.25); cue(onlineA, 'whoosh_soft', 0.3); for (let i = 0; i < 6; i++) cue(onlineT + i * 0.22, 'piece', 0.18); cue(blitzT, 'beep', 0.25);

  // ======================= 2022: THE STRESS, HE QUIT; 2024: BACK, FOR THE TITLE =======================
  const greyHall = (g, t, o = {}) => tournamentHall(g, t, { grey: 1, ...o });
  shot(quitA0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.38, 0.12, 15.5, [4, 3.4, 9.3])], [len(sh), K(0.32, 0.1, 13.5, [4, 3.4, 9.3])]], { t });
    greyHall(g, t, { tab: { eb: 'tired' } });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'He retired', '2022', { y: 200, t0: 0.1 }); } });
  shot(stressA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.06, 8, [4, 3.4, 9.3])], [len(sh), K(0.03, 0.05, 6.8, [4, 3.45, 9.3])]], { t, shake: 2 });
    greyHall(g, t, { tab: { eb: 'worried', wPlayer: false } });
    flashTint(g, RED, 0.12 * (0.5 + 0.5 * Math.sin(t * 7)));
  }, { trans: 'whip', hud: (g, lt, t) => badge(g, 'THE STRESS', W / 2, 230, { color: RED, size: 58, ...pop(t, stressA + 0.25) }) });
  const walkX = (t, a, b, x0, x1) => lerp(x0, x1, seg(t, a, b, lin));
  shot(quitA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.22, 0.12, 18.5, [6, 3.0, 9])], [len(sh), K(0.18, 0.11, 17.5, [6.6, 3.0, 9])]], { t });
    greyHall(g, t, { far: false, tab: { bPlayer: false }, walker: g2 => standing(g2, 'lev', walkX(t, quitA, backA + 0.2, 5.4, 11.5), 11.6, { e: 'tired', t, walk: 1, phase: t * 7, face: 1 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= quitT) badge(g, 'HE QUIT COMPETING', W / 2, 230, { color: RED, size: 54, ...pop(t, quitT) }); } });
  shot(backA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.46, 0.12, 18.5, [6, 3.0, 9])], [len(sh), K(-0.4, 0.11, 16.5, [5.4, 3.1, 9])]], { t });
    tournamentHall(g, t, { tab: { bPlayer: false }, walker: g2 => standing(g2, 'lev', walkX(t, backA, seatA, 12, 5.2), 11.6, { e: 'focus', t, walk: 1, phase: t * 7, face: 1 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'He came back', '2024', { y: 200, t0: 0.1 }); } });
  shot(seatA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.1, 12, [4, 3.6, 9.3])], [len(sh), K(0.08, 0.08, 10, [4, 3.7, 9.3])]], { t });
    tournamentHall(g, t, { tab: { eb: 'focus' } });
  }, { trans: 'whip' });
  shot(titleA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.04, -0.02, 9.5, [4, 4.6, 9.3])], [len(sh), K(0.02, -0.04, 7.6, [4, 4.9, 9.3])]], { t, e: lin });
    tournamentHall(g, t, { tab: { eb: 'focus', wPlayer: false }, far: false });
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= titleT) badge(g, 'FOR THE GM TITLE', W / 2, 230, { color: GOLD, size: 58, ...pop(t, titleT) }); } });
  cue(quitA0 - 0.06, 'whoosh_deep', 0.3); cue(quitA0 + 0.1, 'clock_tick', 0.2); cue(stressA - 0.06, 'whoosh_fast', 0.25); cue(stressA + 0.1, 'heartbeat', 0.45);
  cue(quitA - 0.06, 'whoosh_fast', 0.25); cue(quitT, 'door_slam', 0.35); cue(quitT + 0.1, 'footsteps', 0.3);
  cue(backA - 0.06, 'whoosh_deep', 0.3); cue(backA + 0.1, 'footsteps', 0.3); cue(seatA - 0.06, 'whoosh_fast', 0.25); cue(seatA + 0.1, 'piece', 0.3);
  cue(titleA, 'riser', 0.3); cue(titleT, 'reveal_bell', 0.4); cue(titleT + 0.02, 'boom_big', 0.4);

  // ======================= 50 % SOON? AT THIS YEAR'S PACE: 2033 =======================
  const PK = [PANEL.c[0], PANEL.c[1] - 1.6, PANEL.c[2]];  // the panel high in the frame, clear of the captions
  const paceV = t => lerp(28.8, 50, seg(t, yearsA + 0.15, y2033T, lin)), yearOf = t => String(2026 + Math.round(7 * seg(t, yearsA + 0.15, y2033T, lin)));
  shot(paceA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.1, 0.03, 15, PK)], [len(sh), K(-0.04, 0.02, 13.2, PK)]], { t });
    gallery(g, t, { panel: scoreTex('pace', 28.8, { year: '2026', label: 'NOW' }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= fifty2T) badge(g, '50% SOON?', W / 2, 230, { color: GOLD, size: 60, ...pop(t, fifty2T) }); } });
  shot(yearsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.02, 13.0, PK)], [len(sh), K(0.02, 0.02, 12.4, PK)]], { t });
    gallery(g, t, { panel: scoreTex('pace', paceV(t), { year: yearOf(t), label: 'AT THIS YEAR\'S PACE' }) });
  }, { trans: 'whip' });
  shot(oldA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.2, 0.06, 9.8, [4, 3.6, 55])], [len(sh), KW(0.14, 0.05, 8.6, [4, 3.7, 55])]], { t });
    gallery(g, t, { panel: scoreTex('pace', 50, { year: '2033', label: '50% · FINALLY' }), levy: { who: 'old', z: 55, e: 'happy' }, front: g2 => tag3(g2, 4, 6.6, 55, 'LEVY, 2033', LIME, seg(t, oldA + 0.2, oldA + 0.5, lin)) });
  }, { trans: 'whip', hud: (g, lt, t) => stamp(g, '2033', W / 2, 1530, t, y2033T + 0.05, { color: LIME, size: 110 }) });
  cue(paceA - 0.06, 'whoosh_fast', 0.3); cue(fifty2T, 'ting', 0.3); cue(yearsA - 0.06, 'whoosh_soft', 0.25);
  for (let i = 1; i <= 7; i++) cue(lerp(yearsA + 0.15, y2033T, i / 7) - 0.02, 'page_flip', 0.25);
  cue(oldA - 0.06, 'whoosh_fast', 0.3); cue(y2033T + 0.05, 'stamp', 0.45); cue(y2033T + 0.2, 'laugh', 0.25);

  // ======================= CTA: back to the hook (rule 10) =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, KW(0.1, 0.03, 13.2, [4, 3.0, LZ])], [len(sh), HOOKK[0]]], { t });
    gallery(g, t, { levy: { z: LZ, e: 'smug' } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'HOW MANY GMs HAVE YOU BEATEN?', W / 2, 230, { color: GOLD, size: 46, ...pop(t, ctaA + 0.1) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: TEAL, size: 46, a: seg(t, comT, comT + 0.1), ...pop(t, comT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 425, { color: CREAM, size: 36, a: seg(t, numT, numT + 0.1) });
  } });
  cue(ctaA - 0.06, 'whoosh_fast', 0.3); cue(ctaA + 0.05, 'shimmer', 0.3); cue(comT, 'sparkle_pop', 0.3); cue(numT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: huntA, m: 'norse' }, { t: claimA, m: 'intrigue' }, { t: countA, m: 'build' }, { t: gmA, m: 'victory' },
    { t: hikA, m: 'glory' }, { t: marchA, m: 'tension' }, { t: peakA, m: 'finale' }, { t: whyA, m: 'void' }, { t: noneA, m: 'drop' },
    { t: rulesA, m: 'court' }, { t: bestA, m: 'elegy' }, { t: winsA, m: 'digital' }, { t: quitA0, m: 'exile' }, { t: backA, m: 'build' },
    { t: titleA, m: 'glory' }, { t: paceA, m: 'clockwork' }, { t: oldA, m: 'victory' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: notT - 0.3, t1: notT - 0.01, kind: 'mute' },
    { t0: mateT - 0.32, t1: mateT - 0.01, kind: 'mute' }, { t0: mateT, t1: peakA, kind: 'boost', db: 4 },
    { t0: noneT - 0.3, t1: noneT - 0.01, kind: 'mute' },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
