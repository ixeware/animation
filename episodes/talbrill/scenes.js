// The man who invented brilliants. Mikhail Tal, the Magician from Riga. Moscow 1960, game 6 of the world title match
// with Botvinnik: 21...Nf4, a knight thrown away, the hall so loud that the game went off the stage; an engine today
// finds the answer (23.a3) in under a second, Botvinnik didn't (23.Bd2), Tal won the game and the match. Bled 1965,
// the last game of the tied match with Larsen: 16.Nd5, a blunder by the engine's count, Larsen went wrong a move later
// (17...f5) and Tal won the match. Kasparov: Tal posed problems ahead of their time. Tal: there are two kinds of
// sacrifices, sound ones and mine. Sources, and what is drawn rather than documented: SOURCES.md.
// Rules 42–47 (reference/rausis_v2.md): the hook is the sacrifice itself on the theatre stage; every phrase is a 3D set
// (the Pushkin Theatre's stage and hall, a Moscow street with a poster column, the theatre front with the demonstration
// board and the crowd in the snow, a room backstage, a phone with an engine, Lake Bled and the playing hall, a book,
// two knights on pedestals); cuts go through the giant board, the curtain and the phone screen; the stage of the hook
// comes back at the end.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt, brilliantIcon, BRILL } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { table, chair, chessClock, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE, SKIN2 } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver, brilliantSquare } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, spread, boardArrow, slideStreak } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = HI.bad, TEAL = C.accent, CREAM = C.cream, LIME = HI.good, TAL_C = HI.hero, OPP_C = '#E0603F';
const cyr = (s, w = 900) => `${w} ${s}px Inter, "DejaVu Sans", sans-serif`;  // Cyrillic on the props (the Rubik here is Latin only)
const cyrSerif = s => `700 ${s}px "DejaVu Serif", serif`;
// Moscow 1960, game 6 (Botvinnik White, Tal Black; ply 42 = 21...Nf4, 43 = 22.gxf4, 44 = 22...exf4, 45 = 23.Bd2, 93 = the
// end) and Bled 1965, game 10 (Tal White; ply 31 = 16.Nd5, 32 = 16...exd5, 33 = 17.exd5, 34 = 17...f5, 73 = the end)
const G6 = await fetch('../engine/data/botvinnik_tal_1960_g6.json').then(r => r.json());
const BL = await fetch('../engine/data/tal_larsen_1965_g10.json').then(r => r.json());
const PH = {
  match: await loadPhoto3d('../episodes/talbrill/photos/match1960'),
  larsen: await loadPhoto3d('../episodes/talbrill/photos/larsen1970'),
  kasp: await loadPhoto3d('../episodes/talbrill/photos/kasparov1985'),
  tal88: await loadPhoto3d('../episodes/talbrill/photos/tal1988'),
};
const CREDITS = {
  match: 'Photo: Glavarkhiv Moskvy, CC BY 4.0',
  larsen: 'Photo: Anefo, CC0',
  kasp: 'Photo: Bart Molendijk / Anefo, CC0',
  tal88: 'Photo: Rob C. Croes / Anefo, CC0',
};

// ---------- cast: Tal young (swept black hair, a dark suit, a dark red tie), Botvinnik (receding hair, glasses), Tal in
// Bled in a lighter summer suit, Larsen (sandy hair combed back, as in the 1970 photo) ----------
CAST.tal60 = { ...CAST.tal };
CAST.bot = { ...CAST.botvinnik };
CAST.tal65 = { ...CAST.tal, suit: '#4A4640', suitD: '#34312C', tie: '#2A2E3A' };
CAST.larsen = { face: [0.94, 1.1, 0.86], hair: 'swept', hairC: '#9C7E52', brow: '#7E6442', suit: '#3C424C', suitD: '#2A2F37', shirt: 'tie', tie: '#2B3A5A', ears: 1.02 };
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });

// ---------- shared with the Rausis, Hikaru and table-bang episodes: screen helpers, the 3D toolkit ----------
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
// the cover title (rule 28): a white line over a big yellow one, thick dark outline; the brilliant sign after it
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
// with an optional glossy highlight
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
// a turned shape around a vertical axis: rings [y, rx, rz, dz] from the bottom up
function lathe(g, x, z, rings, col, { n = 36, ...o } = {}) {
  const verts = [], faces = [];
  rings.forEach(([y, rx, rz, dz = 0]) => { for (let i = 0; i < n; i++) { const a = i / n * 6.2832; verts.push([x + Math.cos(a) * rx, y, z + dz + Math.sin(a) * rz]); } });
  for (let j = 0; j + 1 < rings.length; j++) for (let i = 0; i < n; i++) { const i2 = (i + 1) % n; faces.push([j * n + i, j * n + i2, (j + 1) * n + i2, (j + 1) * n + i]); }
  faces.push([...Array(n).keys()], [...Array(n).keys()].map(i => (rings.length - 1) * n + i));
  solid(g, verts, faces, col, o);
}
// a cylinder from a to b
function cylinder(g, a, b, r, col, { n = 22, ...o } = {}) {
  const ax = vnorm(vsub(b, a)), up = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = vnorm(vcross(ax, up)), v = vcross(ax, u), verts = [];
  for (const p of [a, b]) for (let i = 0; i < n; i++) { const t = i / n * 6.2832, c = Math.cos(t) * r, s = Math.sin(t) * r; verts.push([p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s]); }
  const faces = [];
  for (let i = 0; i < n; i++) { const i2 = (i + 1) % n; faces.push([i, i2, n + i2, n + i]); }
  faces.push([...Array(n).keys()], [...Array(n).keys()].map(i => n + i));
  solid(g, verts, faces, col, o);
}
// a pyramid from a square base (centre c, half size h, at height y0) to an apex at y1: spires and church roofs
function spire(g, [x, z], h, y0, y1, col, o = {}) {
  solid(g, [[x - h, y0, z - h], [x + h, y0, z - h], [x + h, y0, z + h], [x - h, y0, z + h], [x, y1, z]], [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]], col, o);
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
// textures drawn once and kept (boards, plates, screens); cleared when too many piled up
const TX = new Map();
function once(key, w, h, draw) { if (!TX.has(key)) { if (TX.size > 300) TX.clear(); TX.set(key, tex(w, h, draw)); } return TX.get(key); }
function limb(g, a, b, wa, wb, col, colD = mix(col, '#000000', 0.4)) {
  if (depth(...a) < 0.5 || depth(...b) < 0.5) return;
  const P = B.project(...a), Q = B.project(...b), w0 = wa * P.s, w1 = wb * Q.s;
  const dx = Q.x - P.x, dy = Q.y - P.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const gr = g.createLinearGradient(P.x + nx * w0, P.y + ny * w0, P.x - nx * w0, P.y - ny * w0); gr.addColorStop(0, colD); gr.addColorStop(0.42, col); gr.addColorStop(1, colD);
  g.fillStyle = gr; g.beginPath(); g.moveTo(P.x + nx * w0, P.y + ny * w0); g.lineTo(Q.x + nx * w1, Q.y + ny * w1); g.lineTo(Q.x - nx * w1, Q.y - ny * w1); g.lineTo(P.x - nx * w0, P.y - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(Q.x, Q.y, w1, 0, 7); g.arc(P.x, P.y, w0, 0, 7); g.fill();
}
// a tag over a point in the world
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
function hand2(g, x, y, r, sk) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, sk.hi); gr.addColorStop(1, sk.base);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
// a quote in the brilliant type: serif lines (each [text, alpha] or text), the source in gold under them
function quote2(g, lt, lines, src, { y = 170, srcA = 1, cr = null } = {}) {
  const a = seg(lt, 0.15, 0.4), n = lines.length, bot = y + (n - 1) * 62 + 70, sc = g.createLinearGradient(0, 0, 0, bot + 120);
  sc.addColorStop(0, 'rgba(6,8,12,0.78)'); sc.addColorStop(0.7, 'rgba(6,8,12,0.6)'); sc.addColorStop(1, 'rgba(6,8,12,0)');
  g.save(); g.globalAlpha = a; g.fillStyle = sc; g.fillRect(0, 0, W, bot + 120); g.restore();
  g.save(); g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
  lines.forEach((l, i) => { const [s, la] = Array.isArray(l) ? l : [l, 1]; g.globalAlpha = a * la; if (la > 0) g.fillText(s, W / 2, y + i * 62); });
  g.globalAlpha = a * srcA; g.font = sans(22, 800); g.letterSpacing = '5px'; g.fillStyle = GOLD; g.fillText(src, W / 2, bot - 8); g.restore();
  qaRect(g, 100, y - 45, W - 200, bot - y + 45, 'text', 'quote');
  if (cr) credit(g, cr, seg(lt, 0.4, 0.6) * 0.75, bot + 34);
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
const board = (plies, k, drop = []) => piecesAt(plies, k).filter(p => !drop.includes(p.id));
// loose pieces: anything not standing on a square (beside the board, in the air), drawn with its own shadow
const surf = (x, z) => x > -0.35 && x < 8.35 && z > -0.35 && z < 8.35 ? 0 : x > 8.9 && x < 10.9 && z > 3.65 && z < 4.35 ? 0.8
  : x > -1.1 && x < 11.3 && z > -1.1 && z < 9.1 ? -0.35 : FLOOR_Y;
const zoneOf = p => p.x < -1.1 || p.x > 11.3 || p.z < -1.1 || p.z > 9.1 ? 'out' : p.x < 8.35 ? 'brd' : 'side';
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
    const cy = q.y - (0.45 * (1 - lie) + 0.17 * lie) * h;
    drawPiece(g, p.t, p.c, q.x - 0.45 * h * Math.sin(r), cy + 0.45 * h * Math.cos(r), h, { blur, rot: r, alpha: a });
    if (p.brill) brilliantIcon(g, q.x - h * 0.34, q.y - h * 1.04, Math.max(32, h * 0.3), p.brill);
  }
}

// ---------- the eval bar beside the board (a modern thing in an old hall: what an engine says), rising out of the table ----------
const fmtEval = v => (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1);
function evalBar(g, v, { label = null, u = 1, cols = [OPP_C, LIME], grow = 1 } = {}) {
  if (grow <= 0) return;
  const top = lerp(-0.35, 6, ease.out(clamp(grow))), f = 0.5 + 0.3 * clamp(-v / 4.2, -1, 1), ym = lerp(-0.35, top, 1 - f);
  ab(g, [-1.05, -0.35, 3.75], [-0.45, ym, 4.25], '#ECECEC', { amb: 0.75 });
  if (top > ym + 0.01) ab(g, [-1.05, ym, 3.75], [-0.45, top, 4.25], '#121417', { amb: 0.7 });
  tag3(g, -0.75, top + 0.9, 4, label ?? fmtEval(v), v > 1 ? cols[0] : v < -1 ? cols[1] : CREAM, u * clamp(grow * 2 - 1));
}

// ---------- the table: White at z -1.4, Black at z 9.3 (seats wx, bx), a wooden clock and the captured pieces on the
// right, the eval bar on the left; loose pieces drawn in depth with the table, the clock and the board ----------
const TABLE60 = ['#5A3A22', '#3A2414', '#4A2E1A'], CHAIR60 = '#3A2418';
function tableSet(g, t, { pieces = null, loose = [], ew = 'focus', eb = 'focus', wReach = null, bReach = null, wSide = -1, bSide = 1, white = 'bot', black = 'tal60', wx = 4, bx = 4,
  under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, evalCols = [OPP_C, LIME], evalGrow = 1, wPlayer = true, bPlayer = true, wChair = true, bChair = true,
  behind = null, front = null, arms = null, focus = null, tableCol = TABLE60, chairCol = CHAIR60 } = {}) {
  const E = B.E;
  if (behind) behind(g);
  if (wChair && E[2] > -1.4) chair(g, B, wx, -1.9, { face: 1, color: chairCol });
  if (bChair && E[2] < 9.3) chair(g, B, bx, 9.8, { face: -1, color: chairCol });
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
  const outL = loose.filter(p => zoneOf(p) === 'out' && outLate(p)), side = loose.filter(p => zoneOf(p) === 'side'), dc = depth(9.9, 0.2, 4);
  const lateP = new Set([...loose.filter(p => zoneOf(p) !== 'out'), ...outL].filter(p => late(p.x, p.y, p.z)));
  const clockLate = !!clock && AR.length > 0 && (late(9.9, -0.35, 4) || side.some(p => lateP.has(p) && depth(p.x, p.y, p.z) > dc));
  if (clockLate) side.forEach(p => { if (depth(p.x, p.y, p.z) <= dc) lateP.add(p); });
  const early = list => list.filter(p => !lateP.has(p));
  const lateB = pieces && AR.length ? pieces.filter(p => late(p.x, p.y || 0, p.z)) : [];
  const drawClock = () => chessClock(g, B, 9.9, -0.35, 4, { ...clock, press });
  drawLoose(g, loose.filter(p => zoneOf(p) === 'out' && !outLate(p)));
  const barLate = E[0] < -1.5, sideLate = E[0] > 8.6;
  const sideDraw = () => {  // the captured pieces behind the clock, the clock, those in front of it
    const S = early(side);
    drawLoose(g, S.filter(p => depth(p.x, p.y, p.z) > dc));
    if (clock && !clockLate) drawClock();
    drawLoose(g, S.filter(p => depth(p.x, p.y, p.z) <= dc));
  };
  const onTable = () => {
    if (evalV !== null && !barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols, grow: evalGrow });
    if (!sideLate) sideDraw();
    B.drawSlab(g, SLATE);
    if (under) under(g);
    if (pieces) B.drawPieces(g, lateB.length ? pieces.filter(p => !lateB.includes(p)) : pieces, { focus: focus ?? B.dist, dof: 1.4 });
    drawLoose(g, early(loose.filter(p => zoneOf(p) === 'brd')));
    if (sideLate) sideDraw();
  };
  const tbl = () => table(g, B, { table: tableCol }, { x1: 10.6 });
  if (below) { onTable(); hands(false); tbl(); } else { tbl(); onTable(); }
  if (over) over(g);
  drawLoose(g, early(outL));
  if (evalV !== null && barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols, grow: evalGrow });
  if (arms) arms(g);
  if (!below) {
    hands(false);
    [...lateB.map(p => [depth(p.x, p.y || 0, p.z), () => B.drawPieces(g, [p], { focus: focus ?? B.dist, dof: 1.4 })]),
      ...[...lateP].map(p => [depth(p.x, p.y, p.z), () => drawLoose(g, [p])]),
      ...(clockLate ? [[dc, drawClock]] : [])].sort((a, b) => b[0] - a[0]).forEach(([, f]) => f());
  }
  hands(true);
  if (!wPlayer && wChair && E[2] < -1.4) chair(g, B, wx, -1.9, { face: 1, color: chairCol });
  if (!bPlayer && bChair && E[2] > 9.3) chair(g, B, bx, 9.8, { face: -1, color: chairCol });
  if (front) front(g);
}
// LOOK v2 arms (stage.js): a reaching arm runs on screen from the shoulder to the hand. Its two ends, with their depths
function armOf(reach, x, z, face, side) {
  if (!reach || !(reach.u > 0)) return null;
  const [tx, tz] = reach.sq ? sqXZ(reach.sq) : [reach.x, reach.z], u = reach.hold ? clamp(reach.u) : Math.sin(Math.PI * clamp(reach.u));
  const R0 = [x - side * face * 1.3, 0.4, z + face * 1.3], T0 = [tx, reach.y ?? 0.9, tz];
  const hp = B.project(x, 3.1, z), s = hp.s / 100 * 1.05, rest = B.project(...R0), q = B.project(...T0), sdx = Math.sign(rest.x - hp.x) || 1;
  return { a: { x: hp.x + sdx * 125 * s, y: hp.y + 255 * s, d: depth(x, 3.1, z) },
    b: { x: lerp(rest.x, q.x, u), y: lerp(rest.y, q.y, u) - Math.sin(Math.PI * u) * 40, d: lerp(depth(...R0), depth(...T0), u) } };
}
// a piece standing at (x, y, z) in front of an arm: nearer to the camera than the arm wherever it falls along it
function frontOf({ a, b }, x, y, z) {
  const dx = b.x - a.x, dy = b.y - a.y, d = depth(x, y + 0.6, z);
  return [0.15, 0.6, 1.1].every(h => {
    const q = B.project(x, y + h, z), u = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1));
    return d < lerp(a.d, b.d, u) - 0.1;
  });
}
// a knight's journey in the hand: lifted off `from`, carried over to `to` (landing at a + d), set down
function carried(t, a, d, from, to, { lift = 0.9, liftT = 0.35, hi = 0.35 } = {}) {
  const [x0, z0] = sqXZ(from), [x1, z1] = sqXZ(to);
  if (t < a) { const u = ease.out(seg(t, a - liftT, a, lin)); return { x: x0, y: lift * u, z: z0, u: 0 }; }
  const u = clamp((t - a) / d), e = ease.inOut(u);
  return { x: lerp(x0, x1, e), y: lift * (1 - e) + Math.sin(Math.PI * e) * hi, z: lerp(z0, z1, e), u };
}

// ---------- a pleated curtain: the plane o + U·[0,1] + V·[0,1] (U across the folds, V up) cut into strips shaded by
// where they sit in their fold, darker toward the top; a gold fringe along the bottom edge when asked ----------
function velvet(g, o, U, V, { color = '#9A1C24', n = 48, a = 1, fringe = false, k = 1, per = 5 } = {}) {
  if (a <= 0) return;
  const P = (u, v) => [o[0] + U[0] * u + V[0] * v, o[1] + U[1] * u + V[1] * v, o[2] + U[2] * u + V[2] * v];
  g.save(); g.globalAlpha *= a; g.lineWidth = 1.2; g.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const f = 0.5 + 0.5 * Math.cos((i + 0.5) / per * Math.PI * 2);
    if (!B.poly(g, [P(i / n, 0), P((i + 1) / n, 0), P((i + 1) / n, 1), P(i / n, 1)])) continue;
    g.fillStyle = g.strokeStyle = shadeC(color, (0.42 + 0.78 * f) * k); g.fill(); g.stroke();
  }
  if (depth(...P(0.5, 1)) > 0.4 && depth(...P(0.5, 0)) > 0.4 && B.poly(g, [P(0, 0), P(1, 0), P(1, 1), P(0, 1)])) {  // darker up in the flies
    const a1 = B.project(...P(0.5, 1)), a0 = B.project(...P(0.5, 0)), gr = g.createLinearGradient(a1.x, a1.y, a0.x, a0.y);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
    g.fillStyle = gr; g.fill();
  }
  if (fringe) {
    g.strokeStyle = GOLD_T; g.lineWidth = Math.max(2, B.project(...P(0.5, 0)).s * 0.12); g.beginPath(); line3(g, P(0, 0.02), P(1, 0.02)); g.stroke();
  }
  g.restore();
}

// ---------- the Pushkin Theatre, Moscow 1960 (drawn): the stage x -7.5..20, z -12..20 with the table in the middle, red
// wings at z -12 and 20, the back wall at x 20 with the demonstration board, its banner and the score plates; the
// proscenium at x -7.5 with the main curtain; the stalls rising toward -x ----------
const ST = { x0: -7.5, x1: 20, z0: -12, z1: 20, top: 24, hy: -7.4, cy: 13.6 };
const RED_V = '#A11E27', GOLD_T = '#C9A05A', WALL_T = '#3A1418';
// the demonstration board: the position at ply k, the pieces cut out flat, as on the big boards of the time
function demoTex(plies, k, { tint = null } = {}) {
  return once(`demo:${plies === G6 ? 'g6' : 'bl'}:${k}:${tint ? tint.sq + tint.col : ''}`, 720, 720, (x, w, h) => {
    x.fillStyle = '#2A1A10'; x.fillRect(0, 0, w, h);
    const m = 44, s = (w - 2 * m) / 8;
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#EDE2C8' : '#7E5E40'; x.fillRect(m + f * s, m + (7 - r) * s, s, s); }
    x.strokeStyle = GOLD_T; x.lineWidth = 4; x.strokeRect(m - 4, m - 4, 8 * s + 8, 8 * s + 8);
    x.fillStyle = GOLD_T; x.font = sans(22, 800); x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) { x.fillText('abcdefgh'[i], m + (i + 0.5) * s, h - m / 2 + 2); x.fillText(String(i + 1), m / 2, m + (7 - i + 0.5) * s); }
    for (const p of plies[k].pieces) {
      const f = p.sq.charCodeAt(0) - 97, r = +p.sq[1] - 1;
      if (tint && p.sq === tint.sq) { x.fillStyle = rgba(tint.col, 0.65); x.fillRect(m + f * s, m + (7 - r) * s, s, s); }
      drawPiece(x, p.t, p.c, m + (f + 0.5) * s, m + (8 - r) * s - s * 0.1, s * 0.86);
    }
  });
}
const BANNER = tex(2048, 192, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8E1820'); gr.addColorStop(1, '#5E0E14'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.strokeStyle = GOLD_T; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = '#F2D48A'; x.font = cyr(84); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('МАТЧ НА ПЕРВЕНСТВО МИРА ПО ШАХМАТАМ', w / 2, h / 2 + 4);
});
const namePlate = (text, col = '#F4EAD2') => once('np:' + text, 640, 160, (x, w, h) => {
  x.fillStyle = '#20130B'; x.fillRect(0, 0, w, h); x.strokeStyle = GOLD_T; x.lineWidth = 5; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = col; x.font = cyr(text.length > 8 ? 76 : 92); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 4);
});
const scorePlate = text => once('sp:' + text, 320, 320, (x, w, h) => {
  x.fillStyle = '#14100C'; x.fillRect(0, 0, w, h); x.strokeStyle = GOLD_T; x.lineWidth = 5; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(14, 14, w - 28, h / 2 - 16);
  x.fillStyle = '#000'; x.fillRect(14, h / 2 - 2, w - 28, 4);
  if (text) { x.fillStyle = '#F4EAD2'; x.font = sans(text.length > 2 ? 150 : 190, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 10); }
});
// a plate on the wall x = X facing -x (seen from the hall, screen right is -z), centred at (y, z), flipping from img0 to
// img over u (it turns about its horizontal axis)
function wallPlateX(g, X, y, z, hw, hh, img, { img0 = null, u = 1 } = {}) {
  const k = Math.abs(Math.cos(Math.PI * clamp(u))), im = u < 0.5 && img0 ? img0 : img, h2 = hh * Math.max(0.02, img0 ? k : 1);
  texQuad(g, im, [X, y + h2, z + hw], [X, y + h2, z - hw], [X, y - h2, z + hw]);
}
function wallPlateZ(g, Z, x, y, hw, hh, img, { img0 = null, u = 1 } = {}) {  // on a wall z = Z facing -z: screen right is +x
  const k = Math.abs(Math.cos(Math.PI * clamp(u))), im = u < 0.5 && img0 ? img0 : img, h2 = hh * Math.max(0.02, img0 ? k : 1);
  texQuad(g, im, [x - hw, y + h2, Z], [x + hw, y + h2, Z], [x - hw, y - h2, Z]);
}
// the back wall: the demonstration board in the middle, the banner over it, a name plate and a score plate on each
// side (Botvinnik on the -z side, where he sits; Tal on the +z side)
function backWall(g, t, { ply = 41, score = null, scoreU = 1 } = {}) {
  const X = ST.x1 - 0.06;
  ab(g, [ST.x1, FLOOR_Y, ST.z0], [ST.x1 + 0.6, ST.top, ST.z1], WALL_T, { amb: 0.6 });
  pool(g, B, X, 6.5, 4, 17, '#FFC98A', 0.16, true);
  ab(g, [X - 0.35, 1.3, -0.95], [X, 11.75, 8.95], '#24160C');
  texQuad(g, demoTex(G6, ply), [X - 0.4, 11.4, 8.6], [X - 0.4, 11.4, -0.6], [X - 0.4, 1.6, 8.6]);
  texQuad(g, BANNER, [X - 0.1, 14.2, 15], [X - 0.1, 14.2, -7], [X - 0.1, 12.3, 15]);
  for (const [z, name, sc] of [[13.6, 'ТАЛЬ', score?.[0]], [-5.6, 'БОТВИННИК', score?.[1]]]) {
    wallPlateX(g, X - 0.1, 10.3, z, 2.9, 0.75, namePlate(name));
    wallPlateX(g, X - 0.1, 6.9, z, 1.9, 1.9, scorePlate(sc ?? ''), { img0: scorePlate(''), u: sc ? scoreU : 1 });
  }
}
function stageBox(g, t, o = {}) {
  const E = B.E;
  backWall(g, t, o);
  if (E[2] > ST.z0) velvet(g, [ST.x1, FLOOR_Y, ST.z0], [ST.x0 - ST.x1, 0, 0], [0, ST.top - FLOOR_Y, 0], { color: RED_V, n: 60, per: 5 });
  if (E[2] < ST.z1) velvet(g, [ST.x0, FLOOR_Y, ST.z1], [ST.x1 - ST.x0, 0, 0], [0, ST.top - FLOOR_Y, 0], { color: RED_V, n: 60, per: 5 });
  if (E[1] > FLOOR_Y) tiled(g, [ST.x0, FLOOR_Y, ST.z0], [ST.x1 - ST.x0, 0, 0], [0, 0, ST.z1 - ST.z0], { color: '#5E3E24', grout: 'rgba(0,0,0,0.28)', tu: 40, tv: 1.1, lw: 1.4 });
  pool(g, B, 4, FLOOR_Y + 0.02, 4, 15, '#FFD9A0', 0.2);
  if (o.dark) { g.fillStyle = `rgba(0,0,0,${o.dark})`; g.fillRect(0, 0, W, H); }
  if (o.mid) o.mid(g);
}
// the proscenium: two pillars and a header with gold trim, the valance, and the main curtain (gathered at the sides;
// drop 0..1 brings it down across the whole opening; close 0..1 draws its halves together)
function prosc(g, t, { drop = 0, close = 0 } = {}) {
  const X = ST.x0, Y1 = ST.cy, col = '#6A1C22';
  const cz = 4, h0 = 3.2;  // the curtain's centre line, the width of a gathered half
  if (drop > 0) {
    const yb = lerp(Y1, FLOOR_Y, ease.in(clamp(drop)));
    velvet(g, [X + 0.5, yb, ST.z1], [0, 0, ST.z0 - ST.z1], [0, Y1 - yb, 0], { color: RED_V, n: 90, per: 4, fringe: true });
  } else {
    const zl = lerp(ST.z1 - h0, cz, ease.inOut(clamp(close))), zr = lerp(ST.z0 + h0, cz, ease.inOut(clamp(close)));
    velvet(g, [X + 0.5, FLOOR_Y, ST.z1], [0, 0, zl - ST.z1], [0, Y1 - FLOOR_Y, 0], { color: RED_V, n: Math.round(18 + 50 * close), per: 3 });
    velvet(g, [X + 0.5, FLOOR_Y, zr], [0, 0, ST.z0 - zr], [0, Y1 - FLOOR_Y, 0], { color: RED_V, n: Math.round(18 + 50 * close), per: 3 });
  }
  ab(g, [X - 1.1, ST.hy, ST.z0 - 2.6], [X, ST.top + 4, ST.z0], col, { amb: 0.55 });
  ab(g, [X - 1.1, ST.hy, ST.z1], [X, ST.top + 4, ST.z1 + 2.6], col, { amb: 0.55 });
  ab(g, [X - 1.1, Y1 + 0.6, ST.z0], [X, ST.top + 4, ST.z1], col, { amb: 0.55 });
  velvet(g, [X - 0.05, Y1 - 1.6, ST.z1], [0, 0, ST.z0 - ST.z1], [0, 2.3, 0], { color: '#7E1018', n: 70, per: 7, fringe: true });
  if (B.E[0] < X) {  // the gold trim round the opening, seen from the hall
    g.save(); g.strokeStyle = GOLD_T; g.lineWidth = Math.max(2, B.project(X - 1.12, 4, 4).s * 0.12); g.beginPath();
    line3(g, [X - 1.12, FLOOR_Y, ST.z0 - 0.05], [X - 1.12, Y1 + 0.55, ST.z0 - 0.05]); line3(g, [X - 1.12, Y1 + 0.55, ST.z0 - 0.05], [X - 1.12, Y1 + 0.55, ST.z1 + 0.05]);
    line3(g, [X - 1.12, Y1 + 0.55, ST.z1 + 0.05], [X - 1.12, FLOOR_Y, ST.z1 + 0.05]); g.stroke(); g.restore();
  }
  // the apron: the front of the stage, dark wood, with footlights along its edge
  ab(g, [X - 0.4, ST.hy, ST.z0], [X + 0.2, FLOOR_Y, ST.z1], '#2A1A12', { amb: 0.6 });
  for (let z = ST.z0 + 1; z < ST.z1; z += 2.2) if (depth(X - 0.2, FLOOR_Y + 0.15, z) > 0.8) { const p = B.project(X - 0.2, FLOOR_Y + 0.15, z); rim(g, p.x, p.y, p.s * 0.9, '#FFD9A0', 0.55); }
}
// the house: the floor of the stalls rising toward -x, dark red walls with sconces and two balconies, a chandelier
function hallShell(g, t, { lit = 1 } = {}) {
  const E = B.E, X0 = ST.x0 - 0.4, X1 = -46, yf = x => ST.hy + (X0 - x) * 0.3;
  if (E[0] > X1) quad(g, [[X1, yf(X1) - 2, -16], [X1, 30, -16], [X1, 30, 24], [X1, yf(X1) - 2, 24]], mix('#1E0A0C', '#000', 0.2));
  if (E[2] > -16) quad(g, [[X0, ST.hy - 2, -16], [X1, yf(X1) - 2, -16], [X1, 30, -16], [X0, 30, -16]], '#2E0E12');
  if (E[2] < 24) quad(g, [[X0, ST.hy - 2, 24], [X1, yf(X1) - 2, 24], [X1, 30, 24], [X0, 30, 24]], '#2E0E12');
  quad(g, [[X0, ST.hy, -16], [X0, ST.hy, 24], [X1, yf(X1), 24], [X1, yf(X1), -16]], '#2A0C10');
  for (const y of [9, 15.5]) {  // the balconies: a box along the back and the sides, a gold rail along the front
    ab(g, [X1, y - 1.2, -16], [X1 + 6, y, 24], '#4A1418', { amb: 0.5 });
    g.save(); g.strokeStyle = rgba(GOLD_T, 0.8); g.lineWidth = 3; g.beginPath(); line3(g, [X1 + 6.05, y, -16], [X1 + 6.05, y, 24]); line3(g, [X1 + 6.05, y - 0.6, -16], [X1 + 6.05, y - 0.6, 24]); g.stroke(); g.restore();
  }
  for (let x = -12; x > X1; x -= 7) for (const z of [-15.8, 23.8]) if (depth(x, 7, z) > 1) { const p = B.project(x, 7, z); rim(g, p.x, p.y, p.s * 1.6, '#FFC98A', 0.45 * lit); g.fillStyle = 'rgba(255,240,210,0.9)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.18), 0, 7); g.fill(); }
  if (depth(-26, 21, 4) > 1) {  // the chandelier
    const p = B.project(-26, 21, 4); rim(g, p.x, p.y, p.s * 5, '#FFD9A0', 0.35 * lit);
    g.fillStyle = 'rgba(255,245,220,0.9)'; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; const q = B.project(-26 + Math.cos(a) * 2.2, 21 - (i % 2) * 0.6, 4 + Math.sin(a) * 2.2); g.beginPath(); g.arc(q.x, q.y, Math.max(1.5, q.s * 0.14), 0, 7); g.fill(); }
  }
}
// the stalls: rows of people facing the stage. From the stage, faces lit by it; from the hall, the backs of heads.
// stand 0..1 brings them to their feet (not all at once), cheer makes them bounce with their arms up
const AUD = (() => {
  const r = rng(77), out = [], SUITS = ['#1E2228', '#2A2A30', '#33302C', '#1A1E26', '#3A2E2A', '#2E3440'], HAIR = ['#1A1410', '#3A2A1E', '#5A4A3A', '#8A8580', '#2A1E16'];
  for (let row = 0; row < 9; row++) {
    const x = -10.2 - row * 3.1, y = ST.hy + (ST.x0 - 0.4 - x) * 0.3;
    for (let z = ST.z0 + 0.6; z <= ST.z1 - 0.4; z += 2.35) out.push({ x: x + (r() - 0.5) * 0.4, y, z: z + (row % 2) * 1.1 + (r() - 0.5) * 0.5, ph: r() * 6.28, sc: 0.92 + r() * 0.16,
      suit: SUITS[Math.floor(r() * SUITS.length)], hair: HAIR[Math.floor(r() * HAIR.length)], arms: r() < 0.5, lady: r() < 0.3, rise: r() });
  }
  return out;
})();
function stalls(g, t, { stand = 0, cheer = 0, lit = 1 } = {}) {
  const E = B.E;
  const L = AUD.map(p => ({ p, d: depth(p.x, p.y + 4.4, p.z) })).filter(o => o.d > 1.2).sort((a, b) => b.d - a.d);
  for (const { p, d } of L) {
    const st = clamp((stand - p.rise * 0.5) * 2), ch = cheer * st, bob = ch * Math.abs(Math.sin(t * 7 + p.ph)) * 0.45;
    const hy = p.y + 4.4 + st * 2.1 + bob, hp = B.project(p.x, hy, p.z), s = hp.s * p.sc, front = E[0] > p.x;
    if (hp.x < -s * 2 || hp.x > W + s * 2 || hp.y < -s * 3) continue;
    const fog = clamp((d - 10) / 50, 0, 0.7) + (1 - lit) * 0.4, sh = B.project(p.x, hy - 1.15, p.z);
    const suit = mix(p.suit, '#000', fog), skin = mix(front ? '#D9A784' : '#2A1A14', '#000', fog + (front ? 0.05 : 0)), hair = mix(p.hair, '#000', fog);
    if (ch > 0.2 && p.arms) {  // arms up
      g.strokeStyle = suit; g.lineCap = 'round'; g.lineWidth = s * 0.42;
      for (const sd of [-1, 1]) { const sw = Math.sin(t * 9 + p.ph + sd) * 0.25; g.beginPath(); g.moveTo(sh.x + sd * s * 1.1, sh.y); g.lineTo(sh.x + sd * s * (1.5 + sw), sh.y - s * 2.6 * ch); g.stroke();
        g.fillStyle = skin; g.beginPath(); g.arc(sh.x + sd * s * (1.5 + sw), sh.y - s * 2.6 * ch - s * 0.1, s * 0.26, 0, 7); g.fill(); }
    }
    g.fillStyle = suit; g.beginPath(); g.ellipse(sh.x, sh.y + s * 0.35, s * 1.5, s * 0.75, 0, Math.PI, 0); g.fill(); g.fillRect(sh.x - s * 1.5, sh.y + s * 0.35, s * 3, s * 2.4);
    if (front) { g.fillStyle = mix('#E8E4DA', '#000', fog + 0.1); g.beginPath(); g.moveTo(sh.x - s * 0.35, sh.y - s * 0.3); g.lineTo(sh.x + s * 0.35, sh.y - s * 0.3); g.lineTo(sh.x, sh.y + s * 0.8); g.closePath(); g.fill(); }
    g.fillStyle = front ? skin : hair; g.beginPath(); g.ellipse(hp.x, hp.y, s * 0.62, s * 0.76, 0, 0, 7); g.fill();
    g.fillStyle = hair; g.beginPath(); g.ellipse(hp.x, hp.y - s * (front ? 0.36 : 0.1), s * (p.lady ? 0.74 : 0.64), s * (front ? 0.46 : 0.7), 0, Math.PI, 0); g.fill();
    if (p.lady) { g.beginPath(); g.arc(hp.x, hp.y - s * 0.72, s * 0.3, 0, 7); g.fill(); }
    if (front && s > 5) {  // a face: the eyes, and a mouth (it opens when they shout)
      g.fillStyle = mix('#24160F', '#000', fog);
      for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(hp.x + sd * s * 0.22, hp.y + s * 0.02, s * 0.075, s * 0.095, 0, 0, 7); g.fill(); }
      if (!(ch > 0.3)) { g.strokeStyle = mix('#7A3A2A', '#000', fog); g.lineWidth = Math.max(1, s * 0.07); g.beginPath(); g.moveTo(hp.x - s * 0.15, hp.y + s * 0.38); g.quadraticCurveTo(hp.x, hp.y + s * 0.45, hp.x + s * 0.15, hp.y + s * 0.38); g.stroke(); }
    }
    if (front && ch > 0.3) { g.fillStyle = 'rgba(40,10,10,0.8)'; g.beginPath(); g.ellipse(hp.x, hp.y + s * 0.38, s * 0.16, s * 0.2 * ch, 0, 0, 7); g.fill(); }  // shouting
    if (front && fog < 0.5) { g.strokeStyle = rgba('#FFD9A0', 0.35 * lit * (1 - fog)); g.lineWidth = Math.max(1, s * 0.08); g.beginPath(); g.ellipse(hp.x, hp.y, s * 0.6, s * 0.74, 0, -1.2, 1.2); g.stroke(); }
  }
  if (cheer > 0.3) {  // press photographers' flashes in the hall
    for (let i = 0; i < 4; i++) {
      const k = Math.floor(t * 9 + i * 3.3), h1 = hash(k * 1.7 + i), p = AUD[Math.floor(h1 * AUD.length)];
      if (hash(k * 2.3 + i) > 0.35 || depth(p.x, p.y + 6.5, p.z) < 1) continue;
      const q = B.project(p.x, p.y + 6.5, p.z); rim(g, q.x, q.y, q.s * 3, '#FFFFFF', 0.8 * cheer);
    }
  }
}
// the whole theatre, drawn back to front for where the camera is (on the stage, or out in the hall)
function theatre(g, t, o = {}) {
  const E = B.E, bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1C0B0E'); bg.addColorStop(1, '#080304');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (E[0] < ST.x0 - 0.3) { stageBox(g, t, o); prosc(g, t, o); cones(g, t, o.cone ?? 0.08); hallShell(g, t, o); stalls(g, t, o); }
  else { hallShell(g, t, o); stalls(g, t, o); prosc(g, t, o); stageBox(g, t, o); cones(g, t, (o.cone ?? 0.08) * (o.dark ? 0 : 1)); }
  if (o.spot) spotCone(g, B, { top: [4, 22, 10.5], base: [4, -0.35, 8.6], r0: 0.4, r1: 4.2, a: o.spot, dust: 40, t, seed: 11, color: '#FFE8C8' });
  lowKey(g, { cy: H * 0.45, a: o.vig ?? 0.32 });
}
function cones(g, t, a) {
  if (a <= 0) return;
  spotCone(g, B, { top: [-12, 19, 4], base: [4, -0.35, 4], r0: 0.5, r1: 5.5, a, dust: 30, t, seed: 3 });
  spotCone(g, B, { top: [8, 22, -8], base: [4, -0.35, 2], r0: 0.4, r1: 3.6, a: a * 0.7, dust: 18, t, seed: 5 });
  spotCone(g, B, { top: [8, 22, 16], base: [4, -0.35, 6], r0: 0.4, r1: 3.6, a: a * 0.7, dust: 18, t, seed: 7 });
}

// ---------- a Moscow street at night in March 1960: snow, a poster column with the match bills, a street lamp, the
// Kremlin towers far off with their red stars (drawn) ----------
// a Cyrillic line fitted into a width (the bills are narrow): the size steps down until it fits
const fitFont = (x, text, maxW, size, wt = 900) => { let z = size; x.font = cyr(z, wt); while (z > 12 && x.measureText(text).width > maxW) { z -= 2; x.font = cyr(z, wt); } };
const POSTERS = tex(2048, 1024, (x, w, h) => {
  x.fillStyle = '#3A3A34'; x.fillRect(0, 0, w, h);
  const bill = (x0, w0, draw) => { x.save(); x.translate(x0, 0); x.beginPath(); x.rect(8, 30, w0 - 16, h - 60); x.clip(); draw(w0 - 16); x.restore(); };
  for (const x0 of [0, 1024]) bill(x0, 512, bw => {  // the match bill, twice round the column
    const cx = 8 + bw / 2, line = (s, y, size, col, wt = 900) => { x.fillStyle = col; fitFont(x, s, bw - 44, size, wt); x.fillText(s, cx, y); };
    x.fillStyle = '#EDE3CC'; x.fillRect(8, 30, bw, h - 60);
    x.fillStyle = '#B3202A'; x.fillRect(8, 30, bw, 200);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    line('МАТЧ НА ПЕРВЕНСТВО', 98, 50, '#F4EAD2'); line('МИРА ПО ШАХМАТАМ', 170, 50, '#F4EAD2');
    line('БОТВИННИК', 320, 84, '#1A1612'); line('—', 410, 60, '#1A1612'); line('ТАЛЬ', 520, 150, '#1A1612');
    for (let f = 0; f < 6; f++) for (let r = 0; r < 2; r++) { x.fillStyle = (f + r) % 2 ? '#1A1612' : '#EDE3CC'; x.fillRect(cx - 180 + f * 60, 640 + r * 60, 60, 60); }
    x.strokeStyle = '#1A1612'; x.lineWidth = 4; x.strokeRect(cx - 180, 640, 360, 120);
    line('МОСКВА · 1960', 850, 60, '#B3202A'); line('ТЕАТР ИМЕНИ ПУШКИНА', 925, 36, '#1A1612', 700);
  });
  for (const x0 of [512, 1536]) bill(x0, 512, bw => {  // other bills: the circus, the cinema
    const circus = x0 === 512;
    x.fillStyle = circus ? '#E9C94E' : '#3A5F8A'; x.fillRect(8, 30, bw, h - 60);
    x.fillStyle = circus ? '#9A1C24' : '#F4EAD2'; x.font = cyr(circus ? 92 : 104); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(circus ? 'ЦИРК' : 'КИНО', 8 + bw / 2, 170);
    x.fillStyle = circus ? 'rgba(154,28,36,0.85)' : 'rgba(244,234,210,0.6)';
    for (let i = 0; i < 8; i++) x.fillRect(48, 330 + i * 70, bw - 80 - (i % 3) * 60, 26);
  });
});
const KREMLIN = [[-60, 150, 1.1], [-15, 160, 1.4], [40, 150, 1.0], [95, 158, 1.2]];  // towers: x, z, size
function street(g, t, { stamp = 0 } = {}) {
  const E = B.E, sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0A1428'); sky.addColorStop(0.55, '#1E3354'); sky.addColorStop(1, '#2E4468');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // the wall and the towers, far off, dark against the sky, the stars glowing
  ab(g, [-90, FLOOR_Y, 150], [130, 9, 152], '#2A1A1E', { amb: 0.8 });
  for (let x = -90; x < 130; x += 4) ab(g, [x, 9, 150], [x + 2, 11, 152], '#2A1A1E', { amb: 0.8 });
  for (const [x, z, k] of KREMLIN) {
    ab(g, [x - 4 * k, FLOOR_Y, z - 4 * k], [x + 4 * k, 20 * k, z + 4 * k], '#3A2024', { amb: 0.75 });
    ab(g, [x - 2.8 * k, 20 * k, z - 2.8 * k], [x + 2.8 * k, 30 * k, z + 2.8 * k], '#3A2024', { amb: 0.75 });
    spire(g, [x, z], 2.6 * k, 30 * k, 46 * k, '#2E3E36', { amb: 0.8 });
    if (depth(x, 48 * k, z) > 1) { const p = B.project(x, 48 * k, z); rim(g, p.x, p.y, p.s * 7 * k, '#FF3B3B', 0.55); g.fillStyle = '#FF5A4F'; g.beginPath(); g.arc(p.x, p.y, Math.max(2, p.s * 1.2 * k), 0, 7); g.fill(); }
    if (depth(x, 14 * k, z) > 1) { const p = B.project(x, 14 * k, z); g.fillStyle = 'rgba(255,214,150,0.7)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 1.0 * k), 0, 7); g.fill(); }  // a clock face
  }
  // the snow on the street, the lamp's pool on it
  quad(g, [[-80, FLOOR_Y, -30], [90, FLOOR_Y, -30], [90, FLOOR_Y, 148], [-80, FLOOR_Y, 148]], '#8C9CB4');
  pool(g, B, 0, FLOOR_Y + 0.02, 4, 16, '#FFD9A0', 0.35);
  pool(g, B, 4, FLOOR_Y + 0.02, 6, 9, '#BFD4FF', 0.12);
  // the poster column: a base ring, the bills on 20 panels, a cornice and a dome
  const cx = 4, cz = 6, R = 2.3, y0 = FLOOR_Y + 0.9, y1 = FLOOR_Y + 9.6, N = 20, ROT = 1.05;  // turned so a match bill faces down the street
  lathe(g, cx, cz, [[FLOOR_Y, 2.7, 2.7], [y0, 2.7, 2.7], [y0, 2.4, 2.4]], '#2E3A30', { n: 28 });
  for (let i = 0; i < N; i++) {
    const a0 = i / N * 6.2832 + ROT, a1 = (i + 1) / N * 6.2832 + ROT, am = (a0 + a1) / 2, n = [Math.cos(am), 0, Math.sin(am)], c = [cx + n[0] * R, (y0 + y1) / 2, cz + n[2] * R];
    if (vdot(n, vsub(E, c)) <= 0) continue;
    texQuad(g, POSTERS, [cx + Math.cos(a0) * R, y1, cz + Math.sin(a0) * R], [cx + Math.cos(a1) * R, y1, cz + Math.sin(a1) * R], [cx + Math.cos(a0) * R, y0, cz + Math.sin(a0) * R],
      { src: [i / N * 2048, 0, 2048 / N, 1024] });
    const sh = 0.55 + 0.45 * Math.max(0, vdot(n, vnorm([-0.6, 0, -0.8])));  // the lamp lights one side
    if (B.poly(g, [[cx + Math.cos(a0) * R, y1, cz + Math.sin(a0) * R], [cx + Math.cos(a1) * R, y1, cz + Math.sin(a1) * R], [cx + Math.cos(a1) * R, y0, cz + Math.sin(a1) * R], [cx + Math.cos(a0) * R, y0, cz + Math.sin(a0) * R]])) {
      g.fillStyle = `rgba(4,8,20,${(1 - sh).toFixed(3)})`; g.fill();
    }
  }
  lathe(g, cx, cz, [[y1, 2.45, 2.45], [y1 + 0.5, 2.75, 2.75], [y1 + 0.9, 2.6, 2.6], [y1 + 2.2, 1.7, 1.7], [y1 + 2.9, 0.5, 0.5], [y1 + 3.3, 0.1, 0.1]], '#2E3A30', { n: 28, spec: 0.3 });
  lathe(g, cx, cz, [[y1 + 0.9, 2.62, 2.62], [y1 + 1.5, 2.2, 2.2], [y1 + 2.2, 1.72, 1.72]], '#E8EEF6', { n: 28 });  // snow on the dome
  // the street lamp
  cylinder(g, [-1, FLOOR_Y, 2], [-1, 9.5, 2], 0.18, '#1E2226', { n: 10 });
  cylinder(g, [-1, 9.5, 2], [0.4, 10.2, 2], 0.1, '#1E2226', { n: 8 });
  if (depth(0.6, 9.8, 2) > 0.8) { const p = B.project(0.6, 9.8, 2); rim(g, p.x, p.y, p.s * 3.2, '#FFD9A0', 0.75); g.fillStyle = '#FFF4DA'; g.beginPath(); g.arc(p.x, p.y, p.s * 0.35, 0, 7); g.fill(); }
  snow(g, t, { box: [[-16, 24], [FLOOR_Y, 16], [-8, 26]], n: 300 });
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}
// snow falling in a box of the world
function snow(g, t, { n = 260, box = [[-20, 30], [FLOOR_Y, 24], [-6, 32]], a = 1, seed = 5 } = {}) {
  const r = rng(seed), [[x0, x1], [y0, y1], [z0, z1]] = box;
  g.save(); g.fillStyle = '#F4F8FF';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0) + Math.sin(t * 0.8 + i) * 0.5, z = z0 + r() * (z1 - z0), sp = 1.4 + r() * 1.6, y = y1 - ((r() * (y1 - y0) + t * sp) % (y1 - y0));
    const d = depth(x, y, z); if (d < 0.8) continue;
    const p = B.project(x, y, z); if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
    g.globalAlpha = a * clamp(1.1 - d / 70, 0.25, 0.9); g.beginPath(); g.arc(p.x, p.y, clamp(p.s * 0.07, 1.2, 10), 0, 7); g.fill();
  }
  g.restore();
}

// ---------- the theatre's front at night: the demonstration board over the door, lamps on it, the crowd in the snow
// (the wall at z 30, facing the street; the building is drawn, not copied) ----------
const FZ = 30;
const SIGN = tex(1600, 160, (x, w, h) => {
  x.fillStyle = '#1A120C'; x.fillRect(0, 0, w, h); x.strokeStyle = GOLD_T; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = '#F2D48A'; x.font = cyr(84); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ТЕАТР ИМЕНИ ПУШКИНА', w / 2, h / 2 + 4);
});
const VS_PLATE = tex(1400, 200, (x, w, h) => {
  x.fillStyle = '#8E1820'; x.fillRect(0, 0, w, h); x.strokeStyle = GOLD_T; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = '#F4EAD2'; x.font = cyr(104); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('БОТВИННИК — ТАЛЬ', w / 2, h / 2 + 6);
});
const FANS = (() => {
  const r = rng(91), out = [], COATS = ['#2A2C30', '#3A342E', '#23272E', '#4A3E34', '#30343A', '#1C1E22'], HATS = ['#2A2420', '#4A4038', '#1A1A1C', '#5A5048'];
  for (let i = 0; i < 170; i++) out.push({ x: -20 + r() * 48, z: 4 + r() * 21, ph: r() * 6.28, sc: 0.9 + r() * 0.2, hat: Math.floor(r() * 3), coat: COATS[Math.floor(r() * COATS.length)], hatC: HATS[Math.floor(r() * HATS.length)], arms: r() < 0.5, toss: r() < 0.3 });
  return out.sort((a, b) => b.z - a.z);
})();
// a fan in a winter coat and a hat: from behind (the camera on the street) or from the front (from the theatre)
function fan(g, p, t, cheer) {
  const front = B.E[2] > p.z, bob = cheer * Math.abs(Math.sin(t * 7 + p.ph)) * 0.4, hy = FLOOR_Y + 7.1 * p.sc + bob;
  if (depth(p.x, hy, p.z) < 1) return;
  const hp = B.project(p.x, hy, p.z), s = hp.s * p.sc, ft = B.project(p.x, FLOOR_Y, p.z), sh = B.project(p.x, hy - 1.25 * p.sc, p.z);
  if (hp.x < -s * 3 || hp.x > W + s * 3) return;
  const fog = clamp((depth(p.x, hy, p.z) - 14) / 60, 0, 0.6), coat = mix(p.coat, '#0A0E16', fog), skin = mix('#D9A784', '#0A0E16', fog + 0.15);
  // the coat down to the snow, the arms up when they cheer
  g.fillStyle = coat; g.beginPath(); g.moveTo(sh.x - s * 1.5, sh.y + s * 0.4); g.quadraticCurveTo(sh.x - s * 1.55, sh.y - s * 0.25, sh.x, sh.y - s * 0.3);
  g.quadraticCurveTo(sh.x + s * 1.55, sh.y - s * 0.25, sh.x + s * 1.5, sh.y + s * 0.4); g.lineTo(ft.x + s * 1.25, ft.y - s * 0.9); g.lineTo(ft.x - s * 1.25, ft.y - s * 0.9); g.closePath(); g.fill();
  g.fillStyle = '#121418'; g.fillRect(ft.x - s * 0.9, ft.y - s * 0.95, s * 0.7, s * 0.95); g.fillRect(ft.x + s * 0.2, ft.y - s * 0.95, s * 0.7, s * 0.95);
  g.fillStyle = 'rgba(235,242,250,0.5)'; g.beginPath(); g.ellipse(sh.x, sh.y - s * 0.22, s * 1.1, s * 0.16, 0, Math.PI, 0); g.fill();  // snow on the shoulders
  if (cheer > 0.2 && p.arms) {
    g.strokeStyle = coat; g.lineCap = 'round'; g.lineWidth = s * 0.45;
    for (const sd of [-1, 1]) { const sw = Math.sin(t * 8 + p.ph + sd) * 0.3, hx = sh.x + sd * s * (1.6 + sw), hy2 = sh.y - s * 2.9 * cheer;
      g.beginPath(); g.moveTo(sh.x + sd * s * 1.1, sh.y + s * 0.1); g.lineTo(hx, hy2); g.stroke(); g.fillStyle = '#2A2420'; g.beginPath(); g.arc(hx, hy2 - s * 0.1, s * 0.26, 0, 7); g.fill(); }
  }
  // the head; the hat on it, or tossed up into the air
  g.fillStyle = front ? skin : mix('#2A1E16', '#0A0E16', fog); g.beginPath(); g.ellipse(hp.x, hp.y, s * 0.6, s * 0.74, 0, 0, 7); g.fill();
  if (front) { g.fillStyle = 'rgba(30,20,16,0.85)'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(hp.x + sd * s * 0.22, hp.y - s * 0.05, s * 0.07, 0, 7); g.fill(); }
    if (cheer > 0.2) { g.fillStyle = 'rgba(60,14,14,0.9)'; g.beginPath(); g.ellipse(hp.x, hp.y + s * 0.36, s * 0.17, s * 0.2 * cheer, 0, 0, 7); g.fill(); } }
  const up = p.toss ? cheer * (2.2 + Math.abs(Math.sin(t * 2.4 + p.ph)) * 2.2) : 0, hx = hp.x, hy3 = hp.y - s * 0.55 - up * s;
  g.fillStyle = mix(p.hatC, '#0A0E16', fog);
  if (p.hat === 0) { g.beginPath(); g.roundRect(hx - s * 0.78, hy3 - s * 0.55, s * 1.56, s * 0.7, s * 0.25); g.fill(); g.fillRect(hx - s * 0.86, hy3 - s * 0.05, s * 0.3, s * 0.55); g.fillRect(hx + s * 0.56, hy3 - s * 0.05, s * 0.3, s * 0.55); }  // a fur hat
  else if (p.hat === 1) { g.beginPath(); g.ellipse(hx, hy3 + s * 0.08, s * 1.1, s * 0.2, 0, 0, 7); g.fill(); g.beginPath(); g.roundRect(hx - s * 0.6, hy3 - s * 0.55, s * 1.2, s * 0.65, s * 0.18); g.fill(); }  // a felt hat
  else { g.beginPath(); g.ellipse(hx, hy3 - s * 0.1, s * 0.66, s * 0.42, 0, Math.PI, 0); g.fill(); }  // a cap
  g.fillStyle = 'rgba(240,246,252,0.65)'; g.beginPath(); g.ellipse(hx, hy3 - s * 0.45, s * 0.5, s * 0.1, 0, Math.PI, 0); g.fill();  // snow on the hat
}
function facade(g, t, { ply = 41, plies = G6, result = null, resultU = 1, cheer = 0, tint = null } = {}) {
  const E = B.E, sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#08101E'); sky.addColorStop(1, '#1A2840');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // the building: the wall, tall lit windows, pilasters, a cornice; the door with the sign over it
  ab(g, [-40, FLOOR_Y, FZ], [48, 26, FZ + 2], '#6A5646', { amb: 0.7 });
  pool(g, B, 4, 12, FZ - 0.05, 26, '#FFC98A', 0.22, true);
  for (const y of [1.2, 9.2, 17.2]) for (let x = -36; x <= 44; x += 5.5) {
    if (x > -6 && x < 14 && y > 0) continue;  // the board and the door
    quad(g, [[x - 1.3, y + 5, FZ - 0.04], [x + 1.3, y + 5, FZ - 0.04], [x + 1.3, y, FZ - 0.04], [x - 1.3, y, FZ - 0.04]], hash(x * 3.1 + y) < 0.7 ? '#E9B86A' : '#3A2E26');
  }
  for (const x of [-30, -19, 23, 34]) ab(g, [x - 0.9, FLOOR_Y, FZ - 0.9], [x + 0.9, 23.2, FZ], '#7A6656', { amb: 0.6 });
  ab(g, [-40, 23.2, FZ - 1.6], [48, 24.6, FZ], '#7E6A5A', { amb: 0.6 });
  ab(g, [0.5, FLOOR_Y, FZ - 0.4], [7.5, 3.2, FZ], '#1E140E');
  texQuad(g, SIGN, [-2.5, 5.1, FZ - 0.5], [10.5, 5.1, FZ - 0.5], [-2.5, 3.8, FZ - 0.5]);
  // the board: a frame, the position, the names over it, the result plate beside it; two lamps over it
  ab(g, [-3.8, 5.6, FZ - 0.7], [11.8, 20.8, FZ], '#24160C');
  texQuad(g, demoTex(plies, ply, { tint }), [-3.3, 20.3, FZ - 0.75], [11.3, 20.3, FZ - 0.75], [-3.3, 5.7, FZ - 0.75]);
  texQuad(g, VS_PLATE, [-3.5, 22.9, FZ - 0.5], [11.5, 22.9, FZ - 0.5], [-3.5, 20.9, FZ - 0.5]);
  if (result) wallPlateZ(g, FZ - 0.5, 16.5, 13, 3.6, 2.4, once('res:' + result, 480, 320, (x, w, h) => {
    x.fillStyle = '#14100C'; x.fillRect(0, 0, w, h); x.strokeStyle = GOLD; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = GOLD; x.font = sans(170, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(result, w / 2, h / 2 + 10);
  }), { img0: scorePlate(''), u: resultU });
  for (const x of [-1.5, 9.5]) {
    cylinder(g, [x, 21, FZ - 0.4], [x, 21.3, FZ - 3.2], 0.1, '#1A1A1C', { n: 8 });
    if (depth(x, 21, FZ - 3.2) > 1) { const p = B.project(x, 21, FZ - 3.2); rim(g, p.x, p.y, p.s * 2.6, '#FFE2B0', 0.7); }
  }
  pool(g, B, 4, 13, FZ - 0.8, 11, '#FFE2B0', 0.18, true);
  // the street: snow, lamps; the crowd, far to near
  quad(g, [[-60, FLOOR_Y, -40], [70, FLOOR_Y, -40], [70, FLOOR_Y, FZ], [-60, FLOOR_Y, FZ]], '#8C9CB4');
  pool(g, B, 4, FLOOR_Y + 0.02, 18, 22, '#FFD9A0', 0.25);
  for (const x of [-22, 30]) { cylinder(g, [x, FLOOR_Y, 6], [x, 10, 6], 0.18, '#1E2226', { n: 8 }); if (depth(x, 10.4, 6) > 1) { const p = B.project(x, 10.4, 6); rim(g, p.x, p.y, p.s * 3, '#FFD9A0', 0.7); } }
  const list = FANS.map(p => ({ p, d: depth(p.x, 3, p.z) })).filter(o => o.d > 1).sort((a, b) => b.d - a.d);
  for (const { p } of list) fan(g, p, t, cheer);
  snow(g, t, { box: [[-18, 28], [FLOOR_Y, 26], [-10, FZ - 1]], n: 340, seed: 8 });
  lowKey(g, { cy: H * 0.42, a: 0.3 });
}

// ---------- backstage: a small room behind the stage with brick walls, painted scenery flats, the fly ropes, a bare
// bulb swinging over the table (drawn: the sources say the game went backstage or to a back room) ----------
const FLAT = tex(512, 768, (x, w, h) => {  // a painted birch-wood flat, its back to us half the time
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6E8AA0'); gr.addColorStop(1, '#4E6A48'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const bx = 40 + i * 68 + (i % 2) * 14; x.fillStyle = '#E8E4DA'; x.fillRect(bx, 60 + (i % 3) * 30, 16, h); x.fillStyle = '#2A2A2A'; for (let j = 0; j < 9; j++) x.fillRect(bx, 120 + j * 70 + (i * 13) % 40, 16, 6); }
  x.fillStyle = 'rgba(60,90,50,0.7)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(hash(i * 3.3) * w, hash(i * 5.1) * h * 0.5 + 40, 30 + hash(i) * 30, 0, 7); x.fill(); }
  x.strokeStyle = '#8A6A44'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14);
});
const QUIET = tex(512, 160, (x, w, h) => {
  x.fillStyle = '#E8DCC0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8E1820'; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = '#8E1820'; x.font = cyr(84); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ТИШИНА', w / 2, h / 2 + 4);
});
function backstage(g, t, { mid } = {}) {
  const E = B.E, bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120C0A'); bg.addColorStop(1, '#060403'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const brick = { color: '#5A362A', grout: 'rgba(20,10,6,0.55)', tu: 1.4, tv: 0.55, lw: 2 };
  if (E[2] < 16) tiled(g, [-9, FLOOR_Y, 16], [26, 0, 0], [0, 20, 0], brick);
  if (E[2] > -8) tiled(g, [17, FLOOR_Y, -8], [-26, 0, 0], [0, 20, 0], brick);
  if (E[0] < 17) tiled(g, [17, FLOOR_Y, 16], [0, 0, -24], [0, 20, 0], brick);
  if (E[0] > -9) tiled(g, [-9, FLOOR_Y, -8], [0, 0, 24], [0, 20, 0], brick);
  if (E[1] > FLOOR_Y) tiled(g, [-9, FLOOR_Y, -8], [26, 0, 0], [0, 0, 24], { color: '#2E2016', grout: 'rgba(0,0,0,0.35)', tu: 40, tv: 1.2 });
  texQuad(g, FLAT, [16.9, 12, 13], [16.9, 12, 6.5], [16.9, FLOOR_Y, 13]);  // flats leaning on the wall
  texQuad(g, FLAT, [16.85, 12.5, 4.5], [16.85, 12.5, -2], [16.85, FLOOR_Y, 4.5]);
  texQuad(g, QUIET, [-8.95, 9.5, 2.5], [-8.95, 9.5, 7.5], [-8.95, 8, 2.5]);
  g.save(); g.strokeStyle = '#8A7A5E'; g.lineWidth = 3; g.beginPath();  // the fly ropes and their sandbags
  for (const z of [10, 10.8, 11.6, 12.4]) line3(g, [-8.4, 22, z], [-8.4, 1.2 + (z % 2), z]); g.stroke(); g.restore();
  for (const z of [10, 10.8, 11.6, 12.4]) ab(g, [-8.75, 0.2 + (z % 2), z - 0.32], [-8.05, 1.25 + (z % 2), z + 0.32], '#6A5A40', { amb: 0.5 });
  const bx = 4 + Math.sin(t * 1.6) * 0.5, bz = 4 + Math.cos(t * 1.1) * 0.25, by = 10.2;
  pool(g, B, bx, -0.33, bz, 9, '#FFD9A0', 0.22);
  if (mid) mid(g);
  g.save(); g.strokeStyle = '#1A1612'; g.lineWidth = 2; g.beginPath(); line3(g, [4, 22, 4], [bx, by + 0.4, bz]); g.stroke(); g.restore();
  if (depth(bx, by, bz) > 0.8) { const p = B.project(bx, by, bz); rim(g, p.x, p.y, p.s * 5, '#FFD9A0', 0.55); rim(g, p.x, p.y, p.s * 1.2, '#FFFFFF', 0.9); }
  lowKey(g, { cy: H * 0.42, a: 0.45 });
}

// ---------- a phone in a hand in the dark (today). Its screen (PHS, 9:16 like the frame) shows first the backstage
// scene, still playing, then an engine's analysis card: the position after 22...exf4 and its best move ----------
const PHS = makeCanvas(), phsx = PHS.getContext('2d');
const PSW = 0.36, PSH = 0.64, PC = [4, 2, 4];  // the screen's half sizes and centre; it faces -z
function engineCard(x, t, { arrow = 0, found = 0, timer = 0, plies = G6, k = 44, best = ['a2', 'a3'], move = '23.a3', ev = '+1.3', depthN = 14, time = '0.09' } = {}) {
  x.fillStyle = '#0E1216'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#161C22'; x.fillRect(0, 0, W, 150);
  x.fillStyle = 'rgba(234,242,246,0.75)'; x.font = sans(40, 800); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText('9:41', 50, 92);
  x.fillStyle = CREAM; x.font = sans(58, 900); x.fillText('ENGINE', 60, 270);
  x.fillStyle = 'rgba(234,242,246,0.55)'; x.font = sans(32, 800); x.fillText('BOTVINNIK – TAL · 1960 · GAME 6', 60, 326);
  const m = 60, s = (W - 2 * m) / 8, y0 = 380;
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#C8D2CE' : '#76857F'; x.fillRect(m + f * s, y0 + (7 - r) * s, s, s); }
  const sqc = sq => [m + (sq.charCodeAt(0) - 97 + 0.5) * s, y0 + (7 - (+sq[1] - 1) + 0.5) * s];
  if (arrow > 0) for (const sq of best) { const [cx, cy] = sqc(sq); x.fillStyle = rgba(LIME, 0.45 * arrow); x.fillRect(cx - s / 2, cy - s / 2, s, s); }
  for (const p of plies[k].pieces) { const [cx, cy] = sqc(p.sq); drawPiece(x, p.t, p.c, cx, cy + s * 0.42, s * 0.9); }
  if (arrow > 0) {
    const [ax, ay] = sqc(best[0]), [bx, by] = sqc(best[1]), u = ease.out(clamp(arrow)), ex = lerp(ax, bx, u), ey = lerp(ay, by, u), an = Math.atan2(ey - ay, ex - ax);
    x.save(); x.strokeStyle = rgba(LIME, 0.92); x.fillStyle = rgba(LIME, 0.92); x.lineWidth = 26; x.lineCap = 'round';
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex - Math.cos(an) * 34, ey - Math.sin(an) * 34); x.stroke();
    x.beginPath(); x.moveTo(ex + Math.cos(an) * 20, ey + Math.sin(an) * 20); x.lineTo(ex - Math.cos(an) * 50 - Math.sin(an) * 44, ey - Math.sin(an) * 50 + Math.cos(an) * 44);
    x.lineTo(ex - Math.cos(an) * 50 + Math.sin(an) * 44, ey - Math.sin(an) * 50 - Math.cos(an) * 44); x.closePath(); x.fill(); x.restore();
  }
  // the bar under the board, the best move in big type, depth and time
  const by2 = y0 + 8 * s + 40, frac = 0.5 + 0.3 * clamp(1.3 / 4.2, -1, 1);
  x.fillStyle = '#111'; x.fillRect(m, by2, W - 2 * m, 44); x.fillStyle = '#ECECEC'; x.fillRect(m, by2, (W - 2 * m) * frac * Math.min(1, found * 1.2 + 0.2), 44);
  x.textAlign = 'center';
  x.globalAlpha = found; x.fillStyle = LIME; x.font = mono(150, 800); x.fillText(move, W / 2 - 150, by2 + 190);
  x.fillStyle = CREAM; x.font = sans(130, 900); x.fillText(ev, W / 2 + 300, by2 + 185); x.globalAlpha = 1;
  x.fillStyle = 'rgba(234,242,246,0.7)'; x.font = mono(46, 700); x.fillText(`depth ${Math.round(lerp(1, depthN, clamp(timer)))}  ·  ${(+time * clamp(timer)).toFixed(2)} s`, W / 2, by2 + 275);
}
function phoneScreen(feed, t, tSwipe, card) {
  phsx.setTransform(1, 0, 0, 1, 0, 0);
  const u = ease.inOut(clamp((t - tSwipe) / 0.3)), oy = H * (1 - u);
  if (u < 1) phsx.drawImage(feed, 0, -u * H);
  if (u > 0) { phsx.save(); phsx.translate(0, oy); card(phsx); phsx.restore(); }
  return PHS;
}
function phoneHand(g, lt, t, keys, screen, { sway = 1, shake = 0.6, vig = 1 } = {}) {
  rig(B, lt, keys, { t, shake });
  const bg = g.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, H * 0.75); bg.addColorStop(0, '#101820'); bg.addColorStop(1, '#020304');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 12, seed: 33, y0: 0.05, y1: 0.75, a: 0.16, size: [50, 150], colors: ['#9FC2E8', '#FFD9A0', '#6FA8DC'] });
  const R = { rx: Math.sin(t * 1.1) * 0.03 * sway, ry: Math.sin(t * 0.8) * 0.04 * sway };
  const F = (x, y, z) => { const p = rot3([x, y, z], R); return [PC[0] + p[0], PC[1] + p[1], PC[2] + p[2]]; };
  const sk = SKIN2, skD = mix(sk.base, '#000000', 0.3), arm = F(0.55, -1.6, 0.9), wrist = F(0.3, -0.62, 0.12);
  limb(g, arm, wrist, 0.3, 0.2, '#2A3442');
  limb(g, wrist, F(0.1, -0.28, 0.12), 0.2, 0.26, sk.base, skD);
  for (const y of [0.14, -0.08, -0.3]) limb(g, F(-0.15, y, 0.08), F(-0.46, y - 0.03, 0.01), 0.075, 0.066, sk.base, skD);
  obox(g, F(0, 0, 0.05), [PSW + 0.05, PSH + 0.06, 0.05], '#121418', R, { spec: 0.6 });
  texQuad(g, screen, F(-PSW, PSH, -0.002), F(PSW, PSH, -0.002), F(-PSW, -PSH, -0.002), { under: false });
  const sp = B.project(...F(0, 0, 0)); rim(g, sp.x, sp.y, sp.s * 1.8, '#9FD8FF', 0.22 * vig);
  limb(g, F(0.52, -0.52, 0.03), F(0.34, -0.14, -0.04), 0.1, 0.085, sk.base, skD);
  lowKey(g, { cy: H * 0.45, a: 0.3 * vig });
}

// ---------- Lake Bled, summer 1965: the island with its church, the castle on the cliff, the Alps, evening light ----------
const RIDGE = (seed, n, x0, x1, z, h0, h1) => { const r = rng(seed), pts = []; for (let i = 0; i <= n; i++) pts.push([lerp(x0, x1, i / n), h0 + (h1 - h0) * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.55 + r() * 1.2))) * (0.7 + 0.3 * r()), z]); return pts; };
const ALPS = [RIDGE(4, 26, -420, 420, 420, 30, 120), RIDGE(9, 22, -300, 300, 260, 10, 55)];
function ridge(g, pts, col, y0 = -2) {
  const P = [...pts, [pts[pts.length - 1][0], y0, pts[0][2]], [pts[0][0], y0, pts[0][2]]];
  quad(g, P, col);
}
function islandChurch(g, mirror = 1) {
  const Y = v => v * mirror;
  lathe(g, 8, 70, [[Y(-0.2), 13, 9], [Y(1.2), 11, 8], [Y(3), 7.5, 5.5], [Y(3.6), 4, 3]], '#3C5A2E', { n: 30 });
  for (const [x, z, h] of [[-1, 66, 7], [17, 68, 6], [2, 75, 8], [14, 74, 7], [-3, 71, 6]]) lathe(g, x, z, [[Y(1), 1.8, 1.8], [Y(1 + h), 0.1, 0.1]], '#24401E', { n: 12 });
  ab(g, [3.5, Y(3.4), 67.5], [11.5, Y(8.4), 72.5], '#EDE6DA', { amb: 0.65 });
  solid(g, [[3.5, Y(8.4), 67.5], [11.5, Y(8.4), 67.5], [11.5, Y(8.4), 72.5], [3.5, Y(8.4), 72.5], [3.5, Y(11), 70], [11.5, Y(11), 70]],
    [[0, 1, 5, 4], [3, 2, 5, 4], [0, 3, 4], [1, 2, 5], [0, 1, 2, 3]], '#9A4A32', { amb: 0.6 });
  ab(g, [11.5, Y(3.4), 68.7], [14.3, Y(15.5), 71.3], '#EDE6DA', { amb: 0.65 });
  spire(g, [12.9, 70], 1.5, Y(15.5), Y(22), '#7A3A28', { amb: 0.6 });
}
function lake(g, t) {
  const E = B.E, sky = g.createLinearGradient(0, 0, 0, H * 0.62); sky.addColorStop(0, '#3E62A0'); sky.addColorStop(0.6, '#D9A27E'); sky.addColorStop(1, '#F4D2A0');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  ridge(g, ALPS[0], '#7A86A6'); ridge(g, ALPS[1], '#4E5E7A');
  ab(g, [-200, -1, 150], [200, 6, 160], '#2C3E2A', { amb: 0.8 });  // the forested shore
  // the castle on its cliff, to the left
  ab(g, [-58, -1, 110], [-34, 26, 126], '#7A7068', { amb: 0.6 }); ab(g, [-54, 26, 112], [-38, 32, 122], '#D8CCB8', { amb: 0.65 });
  ab(g, [-41, 26, 113], [-37, 37, 117], '#D8CCB8', { amb: 0.65 }); spire(g, [-39, 115], 2.4, 37, 41, '#8A3A28');
  // the water: the sky in it, the island's reflection, glints
  const wy = B.project(0, 0, 400).y, wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, '#E8C49A'); wg.addColorStop(0.25, '#6A8AA8'); wg.addColorStop(1, '#1E3248');
  if (B.poly(g, [[-500, 0, -40], [500, 0, -40], [500, 0, 600], [-500, 0, 600]])) { g.fillStyle = wg; g.fill(); }
  g.save(); g.globalAlpha = 0.28; islandChurch(g, -1); g.restore();
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 90; i++) { const x = -40 + hash(i * 1.3) * 80, z = 5 + hash(i * 2.7) * 80, l = 0.8 + hash(i) * 2.2, ph = (t * 0.5 + hash(i * 4.1)) % 1;
    if (depth(x, 0, z) < 1) continue; const p = B.project(x, 0, z), q = B.project(x + l, 0, z); g.strokeStyle = `rgba(255,236,200,${(0.5 * Math.sin(Math.PI * ph)).toFixed(3)})`; g.lineWidth = Math.max(1, p.s * 0.06);
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
  g.restore();
  islandChurch(g, 1);
  lowKey(g, { cy: H * 0.45, a: 0.25, bottom: 0.25 });
}
// the playing hall in Bled (drawn): wood panels, a big window on the lake behind Tal, the banner and the score board
// behind Larsen (the wall z 18)
const LAKEVIEW = tex(1280, 720, (x, w, h) => {
  const sky = x.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, '#7FA6D6'); sky.addColorStop(1, '#F2D2A6'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
  x.fillStyle = '#8C9AB8'; x.beginPath(); x.moveTo(0, h * 0.42); for (let i = 0; i <= 12; i++) x.lineTo(i * w / 12, h * (0.22 + 0.16 * Math.abs(Math.sin(i * 1.3)))); x.lineTo(w, h * 0.5); x.lineTo(0, h * 0.5); x.fill();
  x.fillStyle = '#3A5236'; x.fillRect(0, h * 0.48, w, h * 0.06);
  const wg = x.createLinearGradient(0, h * 0.54, 0, h); wg.addColorStop(0, '#9AB4CC'); wg.addColorStop(1, '#3E5E7E'); x.fillStyle = wg; x.fillRect(0, h * 0.54, w, h * 0.46);
  x.fillStyle = '#3C5A2E'; x.beginPath(); x.ellipse(w * 0.62, h * 0.56, 120, 26, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#F2ECE0'; x.fillRect(w * 0.6, h * 0.47, 40, 26); x.fillRect(w * 0.64, h * 0.4, 14, 34); x.fillStyle = '#8A3A28'; x.beginPath(); x.moveTo(w * 0.64 - 2, h * 0.4); x.lineTo(w * 0.64 + 7, h * 0.34); x.lineTo(w * 0.64 + 16, h * 0.4); x.fill();
});
const BLED_BANNER = tex(1600, 200, (x, w, h) => {
  x.fillStyle = '#1E3A5A'; x.fillRect(0, 0, w, h); x.strokeStyle = '#E8D9B0'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = '#F4EAD2'; x.font = sans(92, 900); x.letterSpacing = '12px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BLED · 1965', w / 2, h / 2 + 4);
});
const bledBoard = (l, r, sub) => once(`bb:${l}:${r}:${sub}`, 1024, 640, (x, w, h) => {
  x.fillStyle = '#1A2A22'; x.fillRect(0, 0, w, h); x.strokeStyle = '#C9B48A'; x.lineWidth = 10; x.strokeRect(10, 10, w - 20, h - 20);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#F4EAD2'; x.font = sans(84, 900); x.letterSpacing = '6px'; x.fillText('TAL', w * 0.27, 120); x.fillText('LARSEN', w * 0.73, 120);
  x.fillStyle = 'rgba(244,234,210,0.35)'; x.fillRect(w / 2 - 3, 70, 6, 330);
  if (sub) { x.fillStyle = GOLD; x.font = sans(58, 900); x.letterSpacing = '8px'; x.fillText(sub, w / 2, h - 62); }
});
const bledDigit = d => once('bd:' + d, 320, 300, (x, w, h) => {
  x.fillStyle = '#0E1612'; x.fillRect(0, 0, w, h); x.fillStyle = '#000'; x.fillRect(0, h / 2 - 2, w, 4);
  if (d) { x.fillStyle = '#F4EAD2'; x.font = sans(d.length > 1 ? 170 : 210, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(d, w / 2, h / 2 + 10); }
});
function bledHall(g, t, { mid, score = ['', ''], score0 = null, flipU = 1, sub = null } = {}) {
  const E = B.E, bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2A1E14'); bg.addColorStop(1, '#0E0A06'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const panel = { color: '#8A6440', grout: 'rgba(40,24,10,0.55)', tu: 3.2, tv: 4, lw: 3 };
  if (E[2] < 18) tiled(g, [-12, FLOOR_Y, 18], [32, 0, 0], [0, 20, 0], panel);
  if (E[2] > -10) tiled(g, [20, FLOOR_Y, -10], [-32, 0, 0], [0, 20, 0], panel);
  if (E[0] < 20) tiled(g, [20, FLOOR_Y, 18], [0, 0, -28], [0, 20, 0], panel);
  if (E[0] > -12) tiled(g, [-12, FLOOR_Y, -10], [0, 0, 28], [0, 20, 0], panel);
  if (E[1] > FLOOR_Y) tiled(g, [-12, FLOOR_Y, -10], [32, 0, 0], [0, 0, 28], { color: '#6A4A2C', grout: 'rgba(30,18,8,0.4)', tu: 1.6, tv: 1.6 });
  if (E[2] > -10) {  // the window on the lake behind Tal, light coming in
    texQuad(g, LAKEVIEW, [13, 13, -9.95], [-5, 13, -9.95], [13, 2.6, -9.95]);
    ab(g, [-5.6, 2, -10], [13.6, 2.6, -9.6], '#E8E0D0'); ab(g, [-5.6, 13, -10], [13.6, 13.6, -9.6], '#E8E0D0'); ab(g, [3.7, 2.6, -10], [4.3, 13, -9.7], '#E8E0D0');
    pool(g, B, 4, 7.5, -9.9, 14, '#FFF0D0', 0.18, true);
  }
  if (E[2] < 18) {  // the banner and the score board behind Larsen
    texQuad(g, BLED_BANNER, [-4, 16.6, 17.94], [12, 16.6, 17.94], [-4, 14.6, 17.94]);
    ab(g, [-1.6, 5.2, 17.6], [9.6, 13.2, 18], '#24160C');
    texQuad(g, bledBoard(...score, sub), [-1.2, 12.9, 17.55], [9.2, 12.9, 17.55], [-1.2, 5.5, 17.55]);
    for (const [x, i] of [[1.25, 0], [6.75, 1]]) wallPlateZ(g, 17.5, x, 8.75, 1.5, 1.35, bledDigit(score[i]), { img0: score0 ? bledDigit(score0[i]) : null, u: score0 && score0[i] !== score[i] ? flipU : 1 });
  }
  pool(g, B, 4, FLOOR_Y + 0.02, 4, 16, '#FFE8C0', 0.18);
  if (mid) mid(g);
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- Kasparov's book (drawn plainly, no cover copied): it opens on a desk under a green lamp, a marker runs
// over the lines ----------
const PAGE = (seed, hl) => tex(600, 860, (x, w, h) => {
  x.fillStyle = '#F2EBDA'; x.fillRect(0, 0, w, h);
  const r = rng(seed); x.fillStyle = 'rgba(40,34,28,0.55)';
  for (let i = 0; i < 26; i++) { const y = 70 + i * 29, l = i % 9 === 8 ? 0.5 : 0.86 + r() * 0.1; if (i === 12) continue; x.fillRect(56, y, (w - 112) * l, 9); }
  for (let i = 0; i < 2; i++) { x.fillStyle = (i % 2) ? '#E6DCC6' : '#DCCDB0'; }
  if (hl) { x.fillStyle = 'rgba(40,34,28,0.35)'; x.fillRect(150, 395, 300, 300); x.strokeStyle = 'rgba(40,34,28,0.6)'; x.lineWidth = 4; x.strokeRect(150, 395, 300, 300);
    for (let f = 0; f < 4; f++) for (let k = 0; k < 4; k++) if ((f + k) % 2) { x.fillStyle = 'rgba(40,34,28,0.45)'; x.fillRect(150 + f * 75, 395 + k * 75, 75, 75); } }
  x.fillStyle = 'rgba(40,34,28,0.4)'; x.font = sans(20, 700); x.textAlign = 'center'; x.fillText(String(seed), w / 2, h - 28);
});
const LPAGE = PAGE(214, true), RPAGE = PAGE(215, false);
function bookSet(g, t, { open = 1, mark = 0 } = {}) {
  const bg = g.createRadialGradient(W / 2, H * 0.5, 80, W / 2, H * 0.5, H * 0.8); bg.addColorStop(0, '#2A1E14'); bg.addColorStop(1, '#070504'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  tiled(g, [-30, 0, -20], [60, 0, 0], [0, 0, 40], { color: '#3A2414', grout: 'rgba(0,0,0,0.25)', tu: 60, tv: 3.4 });
  pool(g, B, 0, 0.01, 0, 14, '#FFD9A0', 0.3);
  // the lamp: base, stem, the green shade
  lathe(g, -9, 7, [[0, 1.6, 1.6], [0.4, 1.4, 1.4], [0.5, 0.3, 0.3]], '#B8893A', { n: 20, spec: 0.5 });
  cylinder(g, [-9, 0.5, 7], [-9, 6, 7], 0.15, '#B8893A', { n: 10, spec: 0.5 });
  lathe(g, -9, 5.4, [[5.4, 2.6, 1.3], [6.4, 2.2, 1.0], [6.6, 0.6, 0.4]], '#1E5A3A', { n: 24, spec: 0.4 });
  const th = 0.75, Z0 = -4.3, Z1 = 4.3, a = Math.PI * ease.inOut(clamp(open));  // the cover turns about the spine (x 0, y th)
  ab(g, [-0.05, -0.02, Z0 - 0.08], [6.1, 0.06, Z1 + 0.08], '#1C2A44', { amb: 0.6 });   // the back cover
  ab(g, [0, 0.06, Z0], [5.9, th, Z1], '#E8E0CE', { amb: 0.75 });                          // the right block of pages
  texQuad(g, RPAGE, [0.2, th + 0.005, Z1 - 0.1], [5.8, th + 0.005, Z1 - 0.1], [0.2, th + 0.005, Z0 + 0.1]);
  if (mark > 0) {  // the marker over three lines of the right page
    g.save(); g.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 3; i++) { const u = clamp(mark * 3 - i); if (u <= 0) continue; const z = 0.95 - i * 0.29;
      quad(g, [[0.75, th + 0.01, z + 0.12], [0.75 + 4.5 * u, th + 0.01, z + 0.12], [0.75 + 4.5 * u, th + 0.01, z - 0.12], [0.75, th + 0.01, z - 0.12]], '#F2D24E'); }
    g.restore();
  }
  if (a > Math.PI / 2) ab(g, [-5.9, 0.06, Z0], [0, th * clamp((a - Math.PI / 2) / (Math.PI / 2)), Z1], '#E8E0CE', { amb: 0.75 });  // the left block, growing as it lands
  const P = (u, z) => [u * Math.cos(a), th + u * Math.sin(a), z], n = [-Math.sin(a), Math.cos(a), 0];
  const out = vdot(n, vsub(B.E, P(3, 0))) > 0;  // the outside of the cover toward us, or the page inside it
  if (out) quad(g, [P(0, Z0 - 0.08), P(6.1, Z0 - 0.08), P(6.1, Z1 + 0.08), P(0, Z1 + 0.08)], '#22324E');
  else texQuad(g, LPAGE, P(5.8, Z1 - 0.1), P(0.2, Z1 - 0.1), P(5.8, Z0 + 0.1));
  if (out) { g.save(); g.strokeStyle = rgba(GOLD_T, 0.8); g.lineWidth = 3; g.beginPath(); line3(g, P(0.6, Z1 - 0.6), P(5.5, Z1 - 0.6)); line3(g, P(0.6, Z0 + 0.6), P(5.5, Z0 + 0.6)); g.stroke(); g.restore(); }
  lowKey(g, { cy: H * 0.5, a: 0.4 });
}

// ---------- two knights on pedestals in the dark: SOUND on solid stone, MINE balanced on a needle ----------
const plateTex = (text, col) => once('kp:' + text, 640, 200, (x, w, h) => {
  x.fillStyle = '#2A2826'; x.fillRect(0, 0, w, h); x.strokeStyle = rgba(col, 0.8); x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = col; x.font = sans(120, 900); x.letterSpacing = '14px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2 + 6);
});
function knights(g, t, { lit = [1, 1], mineU = 0, sparkle = 0 } = {}) {
  g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
  quad(g, [[-40, 0, -30], [40, 0, -30], [40, 0, 40], [-40, 0, 40]], '#0E1014');
  for (const [x, a, col] of [[-3.6, lit[0], '#FFE8C8'], [3.6, lit[1], '#BFFFF4']]) {
    if (a <= 0) continue;
    pool(g, B, x, 0.01, 0, 4.5, col, 0.35 * a);
    spotCone(g, B, { top: [x, 18, -1], base: [x, 0, 0], r0: 0.3, r1: 3.4, a: 0.22 * a, dust: 24, t, seed: x > 0 ? 13 : 17, color: col });
  }
  // SOUND: a stone block; MINE: a low base, a needle, a small cap
  ab(g, [-5.2, 0, -1.4], [-2, 3.6, 1.4], '#6A6660', { amb: 0.55 });
  texQuad(g, plateTex('SOUND', CREAM), [-5, 3.4, -1.42], [-2.2, 3.4, -1.42], [-5, 2.55, -1.42], { a: 0.4 + 0.6 * lit[0] });  // the plates sit high, clear of the captions
  ab(g, [2, 0, -1.4], [5.2, 2.5, 1.4], '#6A6660', { amb: 0.55 });
  texQuad(g, plateTex('MINE', TEAL), [2.2, 2.3, -1.42], [5.0, 2.3, -1.42], [2.2, 1.45, -1.42], { a: 0.4 + 0.6 * lit[1] });
  cylinder(g, [3.6, 2.5, 0], [3.6, 3.6, 0], 0.05, '#C9CDD2', { n: 8, spec: 0.6 });
  const wob = Math.sin(t * 2.6) * 0.16 + Math.sin(t * 6.3) * 0.04;
  for (const [x, rot, a] of [[-3.6, 0, lit[0]], [3.6, wob, lit[1]]]) {
    if (depth(x, 3.6, 0) < 1) continue;
    const p = B.project(x, 3.6, 0), h = p.s * 4.6;
    g.save(); g.globalAlpha *= 0.35 + 0.65 * a; drawPiece(g, 'n', 'w', p.x, p.y, h, { rot }); g.restore();
  }
  if (mineU > 0 && depth(3.6, 9.4, 0) > 1) {
    const p = B.project(3.6, 9.4, 0); brilliantIcon(g, p.x + Math.sin(wob) * p.s * 2, p.y, p.s * 0.95, mineU);
  }
  if (sparkle > 0) for (let i = 0; i < 16; i++) {
    const ph = (t * 0.7 + hash(i * 3.7)) % 1, an = hash(i * 1.9) * 6.283, r = 1.6 + hash(i * 5.3) * 2.2;
    const q = [3.6 + Math.cos(an) * r, 3.6 + 2.6 + Math.sin(an) * r * 0.8 + ph * 1.2, -0.4]; if (depth(...q) < 1) continue;
    const p = B.project(...q), s2 = p.s * 0.22 * Math.sin(Math.PI * ph) * sparkle;
    g.save(); g.fillStyle = '#E8FFFA'; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(p.x, p.y - s2 * 2); g.lineTo(p.x + s2 * 0.5, p.y); g.lineTo(p.x, p.y + s2 * 2); g.lineTo(p.x - s2 * 0.5, p.y); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(p.x - s2 * 2, p.y); g.lineTo(p.x, p.y + s2 * 0.5); g.lineTo(p.x + s2 * 2, p.y); g.lineTo(p.x, p.y - s2 * 0.5); g.closePath(); g.fill(); g.restore();
  }
  lowKey(g, { cy: H * 0.5, a: 0.4 });
}

// the brilliant sign cracking (u 0..1: the crack runs, the halves part and grey out)
const ICON = tex(260, 260, (x) => brilliantIcon(x, 130, 130, 100, 1));
function iconCrack(g, x, y, r, u, a = 1) {
  if (a <= 0) return;
  const k = r / 100, sep = ease.out(clamp((u - 0.35) / 0.65)) * r * 0.22, grey = clamp((u - 0.3) / 0.5);
  const crack = [[-0.05, -1.2], [0.12, -0.6], [-0.1, -0.15], [0.14, 0.3], [-0.06, 0.75], [0.08, 1.2]];
  for (const sd of [-1, 1]) {
    g.save(); g.globalAlpha *= a; g.translate(x + sd * sep, y + sep * 0.3); g.rotate(sd * sep / r * 0.5);
    g.beginPath(); g.moveTo(sd * 2 * r, -1.3 * r); for (const [cx, cy] of crack) g.lineTo(cx * r, cy * r); g.lineTo(sd * 2 * r, 1.3 * r); g.closePath(); g.clip();
    if (grey > 0) g.filter = `grayscale(${grey.toFixed(2)}) brightness(${(1 - 0.35 * grey).toFixed(2)})`;
    g.drawImage(ICON, -130 * k, -130 * k, 260 * k, 260 * k); g.restore();
  }
  if (u > 0 && u < 0.6) {  // the crack itself, running down
    g.save(); g.globalAlpha *= a * (1 - clamp((u - 0.4) / 0.2)); g.strokeStyle = '#FFFFFF'; g.lineWidth = Math.max(2, r * 0.06); g.beginPath();
    crack.slice(0, 1 + Math.round(clamp(u / 0.35) * 5)).forEach(([cx, cy], i) => i ? g.lineTo(x + cx * r, y + cy * r) : g.moveTo(x + cx * r, y + cy * r)); g.stroke(); g.restore();
  }
}
// the sign turning over into the blunder sign: a red disc with "??" (u 0..1)
function iconFlip(g, x, y, r, u, a = 1) {
  if (a <= 0) return;
  const k = Math.cos(Math.PI * clamp(u));
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(Math.max(0.02, Math.abs(k)), 1);
  if (k >= 0) g.drawImage(ICON, -130 * r / 100, -130 * r / 100, 260 * r / 100, 260 * r / 100);
  else {
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(r * 0.08, r * 0.14, r * 1.04, 0, 7); g.fill();
    g.fillStyle = '#8E1F1A'; g.beginPath(); g.arc(0, 0, r * 1.06, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#FF6A55'); gr.addColorStop(1, '#D8352A'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 0.92, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = sans(Math.round(r * 1.05), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('??', 0, r * 0.06);
  }
  g.restore();
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
// the brilliant sign on a piece standing on sq, at its top right like a review badge (a: 0..1 pops it in); it can crack
// or turn over into the blunder sign
function signOn(g, sq, a, { crack = 0, flip = 0, k = 1 } = {}) {
  if (a <= 0) return;
  const [x, z] = sqXZ(sq);
  if (depth(x, 1.3, z) < 0.8) return;
  const p = B.project(x, 1.3, z), r = Math.max(30, p.s * 0.34) * k, cx = p.x + p.s * 0.32, cy = p.y - p.s * 0.1;
  if (flip > 0) iconFlip(g, cx, cy, r, flip, clamp(a * 3));
  else if (crack > 0) iconCrack(g, cx, cy, r, crack, clamp(a * 3));
  else brilliantIcon(g, cx, cy, r, a);
}
// a short white flash and speed lines from a point of the board (the main moves)
function impact(g, sq, t, t0, { life = 0.4, flash = 0.45 } = {}) {
  const u = t - t0;
  if (u < 0 || u > life) return;
  flashTint(g, '#FFFFFF', flash * (1 - u / life));
  const [x, z] = sqXZ(sq);
  if (depth(x, 0.4, z) > 0.8) { const p = B.project(x, 0.4, z); speedLines(g, p.x, p.y, t, t0, { life }); }
}

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
  // a big landing: a reverse swell into a boom, the move's own sound, a punch, the sign's pop
  const bigHit = (t, g = 1) => { cue(t - 0.32, 'revswell', 0.85 * g); cue(t - 0.004, 'boom', 0.8 * g); cue(t - BOOM_HIT, 'boom_big', 0.45 * g); cue(t - MOVE_HIT, 'move', 0.8); cue(t, 'hit_punch', 0.5 * g); };

  // the cuts, in order (a shot runs to the next one)
  const L1 = w('hook', 'brilliant'), HB = 1.45;                                          // hook: the knight lands on "brilliant"
  const H2A = s('hook2') - 0.05, engT = w('hook2', 'engine'), H2B = w('hook2', 'sacrifices') - 0.06, dontT = w('hook2', 'dont'), workT = w('hook2', 'work');
  const WHO = s('who') - 0.05, magT = w('who', 'magician');
  const MOS = s('moscow') - 0.05, ageT = w('moscow', 'twenty-three'), botT = w('moscow', 'botvinnik'), BOTA = botT - 0.08, titleT = w('moscow', 'title');
  const OUT = s('outside') - 0.05, giantT = w('outside', 'giant');
  const G6A = s('g6') - 0.05, sixT = w('g6', 'six'), throwT = w('g6', 'throws'), NFA = throwT - 0.25, L2 = w('g6', 'away') + 0.04, GXA = L2 + 0.66;
  const CRA = s('crowd') - 0.05, wildT = w('crowd', 'wild'), DRA = w('crowd', 'moved') - 0.44, BKA = w('crowd', 'back') - 0.12;
  const E1A = s('engine1') - 0.05, eng1T = w('engine1', 'engine'), findT = w('engine1', 'finds'), ansT = w('engine1', 'answer'), underT = w('engine1', 'under');
  const BVA = s('botv') - 0.05, doesntT = w('botv', 'doesnt'), WNA = w('botv', 'tal') - 0.1, winT = w('botv', 'wins'), MTA = w('botv', 'then') - 0.06, wholeT = w('botv', 'whole'), matchT = w('botv', 'match');
  const BLA = s('bled') - 0.05, LRA = w('bled', 'against') - 0.06, TIA = w('bled', 'the') - 0.06, tiedT = w('bled', 'tied'), lastT = w('bled', 'last');
  const NDA = s('nd5') - 0.05, givesT = w('nd5', 'gives'), L3 = w('nd5', 'knight') + 0.04, againT = w('nd5', 'again'), AGA = againT - 0.08;
  const E2A = s('engine2') - 0.05, eng2T = w('engine2', 'engines'), blunT = w('engine2', 'blunder');
  const LSA = s('larsen') - 0.05, wrongT = w('larsen', 'wrong'), WMA = w('larsen', 'and') - 0.06, wins2T = w('larsen', 'wins'), match2T = w('larsen', 'match');
  const KAA = s('kasparov') - 0.05, BKK = w('kasparov', 'tal') - 0.1, posedT = w('kasparov', 'posed'), timeT = w('kasparov', 'time');
  const SDA = s('said') - 0.05, thereT = w('said', 'there');
  const MNA = s('mine') - 0.05, soundT = w('mine', 'sound'), mineT = w('mine', 'mine');
  const CTA = s('cta') - 0.06, movesT = w('cta', 'moves'), commT = w('cta', 'comment'), numT = w('cta', 'number');

  // ---------- Moscow 1960, game 6 on the stage ----------
  const TCLK = { tl: 52 * 60 + 20, tr: 37 * 60 + 40 };  // the dials: hands only, no times claimed
  const M42 = { ...moveOf(G6, 42), brill: true }, M43 = moveOf(G6, 43), M45 = { ...moveOf(G6, 45), label: '23.Bd2?' };
  const stageSet = (g, t, o = {}, th = {}) => theatre(g, t, { ...th, mid: g2 => tableSet(g2, t, { clock: TCLK, ...o }) });
  // 21...Nf4: Tal's hand carries the knight from h5 and sets it down on f4 at landT (d s in the air)
  function sacSet(g, t, landT, d, o = {}, th = {}) {
    const k = carried(t, landT - d, d, 'h5', 'f4'), landed = t >= landT, [x1, z1] = sqXZ('f4');
    const reach = landed ? { x: x1, z: z1, y: 1.05, u: 1 - seg(t, landT + 0.15, landT + 0.55, lin), hold: true }
      : { x: k.x, z: k.z, y: k.y + 1.05, u: seg(t, landT - d - 0.7, landT - d - 0.35, lin), hold: true };
    stageSet(g, t, {
      pieces: landed ? board(G6, 42) : board(G6, 41, ['n1']), loose: landed ? capturedAt(G6, 42) : [...capturedAt(G6, 41), { id: 'n1', t: 'n', c: 'b', x: k.x, y: k.y, z: k.z }],
      bReach: reach, eb: landed ? 'smug' : 'focus', ew: landed && t > landT + 0.3 ? 'worried' : 'focus',
      under: g2 => { if (landed) { brilliantSquare(g2, B, 'f4', seg(t, landT, landT + 0.2), t); ledGlow(g2, B, 'f4', BRILL, t, landT); spread(g2, B, 'f4', t, landT, BRILL); }
        moveUnder(g2, B, M42, t - landT + SLIDE, { hold: 30 }); },
      over: g2 => { moveOver(g2, B, M42, t - landT + SLIDE, { hold: 30, label: o.label ?? true }); if (landed) signOn(g2, 'f4', seg(t, landT + 0.02, landT + 0.5, lin)); },
      ...o }, th);
  }
  const hookTh = { spot: 0.22, vig: 0.22, cone: 0.1 };

  // ======================= HOOK (rule 42): the knight already in Tal's hand, on its way to f4 =======================
  const hookHud = (g, lt, t) => coverTitle(g, 'THE MAN WHO INVENTED', 'BRILLIANTS', 205, { a: 1 - seg(t, HB - 0.12, HB, lin) });
  shot(0, (g, lt, t) => {
    rig(B, lt, [[0, K(0.05, 0.4, 12, [4.9, 1.5, 5.6], { cy: H * 0.45 })], [HB, K(0.09, 0.38, 11.2, [4.9, 1.55, 5.7], { cy: H * 0.45 })]], { t, bump: t > L1 && t < L1 + 0.3 ? 1.4 : 0 });
    sacSet(g, t, L1, 0.69, { wPlayer: false, wChair: false, label: false }, hookTh);
    impact(g, 'f4', t, L1);
  }, { hud: hookHud });
  shot(HB, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.45, 0.42, 12.5, [5.2, 1.5, 4.8], { fov: 2300, cy: H * 0.45 })], [len(sh), K(0.52, 0.4, 12, [5.3, 1.55, 4.8], { fov: 2300, cy: H * 0.45 })]], { t });
    sacSet(g, t, L1, 0.69, { wPlayer: false, wChair: false, label: false }, hookTh);
  }, { trans: 'whip' });
  cue(0, 'murmur', 0.3); cue(0, 'whoosh_soft', 0.2); bigHit(L1, 0.8); cue(L1 + 0.05, 'sparkle_pop', 0.4); cue(L1 + 0.1, 'shimmer', 0.3); cue(HB - 0.08, 'whoosh_fast', 0.3);

  // ======================= HOOK 2: the engine's bar rises out of the table; the sign cracks: UNSOUND =======================
  const evalOn = { evalV: 1.3, evalLabel: '+1.3' };
  shot(H2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.62, 0.3, 15, [2.6, 2.4, 4.6])], [len(sh), K(-0.55, 0.27, 13.6, [2.8, 2.4, 4.6])]], { t });
    stageSet(g, t, { pieces: board(G6, 42), loose: capturedAt(G6, 42), eb: 'smug', ew: 'worried', ...evalOn, evalGrow: seg(t, engT, engT + 0.7, lin),
      under: g2 => brilliantSquare(g2, B, 'f4', 1, t), over: g2 => signOn(g2, 'f4', 1) }, { vig: 0.3 });
  }, { trans: 'whip' });
  shot(H2B, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.2, 0.42, 12.5, [4.9, 1.5, 4.8], { fov: 2300, cy: H * 0.45 })], [len(sh), K(-0.12, 0.42, 12, [5.0, 1.5, 4.8], { fov: 2300, cy: H * 0.45 })]], { t });
    const cr = seg(t, dontT, dontT + 0.55, lin);
    stageSet(g, t, { pieces: board(G6, 42), loose: capturedAt(G6, 42), eb: 'smug', ew: 'focus', wPlayer: false, wChair: false, ...evalOn,
      under: g2 => brilliantSquare(g2, B, 'f4', 1 - 0.7 * cr, t), over: g2 => signOn(g2, 'f4', 1, { crack: cr }) }, { vig: 0.32 });
  }, { hud: (g, lt, t) => stamp(g, 'UNSOUND', 700, 700, t, workT, { color: RED }) });
  cue(H2A - 0.06, 'whoosh_fast', 0.3); cue(engT, 'whoosh_soft', 0.3); cue(engT + 0.5, 'beep', 0.3); cue(H2B, 'heartbeat', 0.35);
  cue(dontT, 'glass', 0.4); cue(workT, 'stamp', 0.6); cue(workT + 0.05, 'dun_dun', 0.35);

  // ======================= WHO: the real photo, Botvinnik and Tal at the board in 1960 =======================
  shot(WHO, (g, lt, t) => photoShot(g, lt, PH.match, { from: { x: 0.62, y: 0.42, zoom: 1.0, dolly: 0 }, to: { x: 0.74, y: 0.36, zoom: 1.32, dolly: 0.06 }, dur: MOS - WHO + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Mikhail Tal', 'THE MAGICIAN FROM RIGA', { y: 210, size: 66, t0: 0.05 }); credit(g, CREDITS.match, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(WHO - 0.06, 'whoosh_fast', 0.3); cue(WHO + 0.05, 'camera', 0.25); cue(magT, 'shimmer', 0.4);

  // ======================= MOSCOW 1960: a street in the snow, the poster column with the match bills =======================
  shot(MOS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.32, 0.17, 19, [4, 3.2, 6])], [len(sh), K(0.24, 0.06, 8.4, [4, 2.2, 6])]], { t });
    street(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'Moscow', '1960', { y: 200, t0: 0.1 });
    if (t >= ageT) badge(g, 'AGE 23', W / 2, 320, { color: GOLD, size: 46, ...pop(t, ageT) });
  } });
  cue(MOS - 0.06, 'whoosh_deep', 0.35); cue(MOS, 'wind', 0.35); cue(ageT, 'ting', 0.3);
  // HE PLAYS BOTVINNIK FOR THE WORLD TITLE: the stage of the Pushkin Theatre, from the stalls
  shot(BOTA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-1.45, 0.12, 26, [4, 1.5, 4])], [len(sh), K(-1.49, 0.11, 22.5, [4.6, 2, 4])]], { t });
    stageSet(g, t, { pieces: board(G6, 36), loose: capturedAt(G6, 36), ew: 'focus', eb: 'focus',
      over: g2 => tag3(g2, 4, 4.9, -1.4, 'WORLD CHAMPION', GOLD, seg(t, botT, botT + 0.3, lin)) }, { ply: 36 });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= titleT) badge(g, 'WORLD TITLE MATCH', W / 2, 230, { color: CREAM, size: 44, ...pop(t, titleT) }); } });
  cue(BOTA - 0.06, 'whoosh_fast', 0.3); cue(BOTA, 'murmur', 0.3); cue(botT, 'reveal_bell', 0.3); cue(titleT, 'boom_cine', 0.35);

  // ======================= OUTSIDE: the crowd in the snow before the theatre's big board =======================
  const outKeys = aimKeys(tt => lerp3([3.5, 1.2, -5], [4.5, 8.5, -12], ease.inOut(seg(tt, OUT, G6A, lin))), tt => lerp3([4, 6, 24], [4, 12.5, 30], ease.inOut(seg(tt, OUT, G6A, lin))), OUT, G6A + 0.5);
  shot(OUT, (g, lt, t) => {
    rig(B, lt, outKeys, { t, e: lin });
    facade(g, t, { ply: 41, cheer: 0.15 });
  }, { trans: 'whip' });
  cue(OUT - 0.06, 'whoosh_deep', 0.3); cue(OUT, 'murmur', 0.45); cue(OUT, 'wind', 0.25); cue(giantT, 'reveal_bell', 0.3);

  // ======================= GAME SIX: into the big board, onto h5; Tal's hand throws the knight onto f4 =======================
  shot(G6A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.02, 0.0, 15, [6, 13, 29.2])], [len(sh), K(0.1, 0.02, 5.2, [9.4, 13.8, 29.2]), ease.in]], { t });
    facade(g, t, { ply: 41, cheer: 0.15, tint: t >= sixT + 0.2 ? { sq: 'h5', col: TEAL } : null });
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= sixT - 0.1) heading(g, 'GAME 6', 230, seg(t, sixT - 0.1, sixT + 0.1, lin), { size: 60 }); } });
  cue(G6A - 0.04, 'whoosh_soft', 0.25); cue(sixT, 'ting', 0.3); cue(NFA - 0.3, 'heartbeat', 0.45);
  const NL = { fov: 2500, cy: H * 0.47 };
  const nfKeys = [[0, K(0.6, 0.55, 14, [6.6, 1.4, 5.0], NL)], [L2 - NFA - 0.05, K(0.75, 0.55, 15, [6.0, 1.4, 4.8], NL)], [L2 - NFA + 0.25, K(0.79, 0.55, 15.4, [5.9, 1.5, 4.8], NL)], [GXA - NFA + 0.35, K(0.85, 0.55, 16, [5.7, 1.6, 4.8], NL)]];
  shot(NFA, (g, lt, t) => {
    rig(B, lt, nfKeys, { t, bump: t > L2 && t < L2 + 0.3 ? 1.6 : 0 });
    sacSet(g, t, L2, 0.55, {}, { spot: 0.16 });
    impact(g, 'f4', t, L2, { flash: 0.5 });
  }, { trans: 'zoom' });
  cue(NFA - 0.05, 'whoosh_deep', 0.35); cue(NFA + 0.05, 'fabric', 0.3); bigHit(L2); cue(L2 + 0.05, 'sparkle_pop', 0.45); cue(L2 + 0.3, 'gasp', 0.5);
  // 22.gxf4: Botvinnik takes the knight (over Tal's shoulder)
  const LG = GXA + 0.3;
  shot(GXA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.32, 0.36, 11.5, [4.6, 1.6, 2.6])], [len(sh), K(PI - 0.26, 0.34, 10.6, [4.8, 1.6, 2.4])]], { t });
    const a = LG - SLIDE, moved = t >= LG;
    stageSet(g, t, { pieces: t < a ? board(G6, 42) : piecesAt(G6, 43, slide(t - a), SLIDE_OPTS), loose: capturedAt(G6, moved ? 43 : 42), ew: moved ? 'smug' : 'focus', eb: 'smug',
      wReach: { sq: 'f4', u: seg(t, a - 0.35, a + 0.6, lin) }, wSide: -1,
      under: g2 => moveUnder(g2, B, M43, t - a), over: g2 => { moveOver(g2, B, M43, t - a); if (!moved) signOn(g2, 'f4', 1 - seg(t, a, LG, lin)); } }, { vig: 0.3 });
  }, { trans: 'whip' });
  cue(GXA - 0.06, 'whoosh_fast', 0.3); cue(LG - MOVE_HIT, 'move_capture', 0.7); boom(LG, 0.5);

  // ======================= THE HALL GOES WILD; THE CURTAIN COMES DOWN; THE GAME GOES ON BACKSTAGE =======================
  shot(CRA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.16, 0.12, 14, [-16, 1, 4])], [len(sh), K(PI / 2 + 0.1, 0.1, 12.5, [-17, 1.6, 4])]], { t });
    theatre(g, t, { ply: 43, stand: seg(t, CRA + 0.1, wildT - 0.1, lin), cheer: seg(t, wildT - 0.4, wildT, lin), vig: 0.3 });
  }, { trans: 'whip' });
  cue(CRA - 0.06, 'whoosh_fast', 0.3); cue(CRA, 'murmur', 0.5); cue(wildT - 0.4, 'applause', 0.6); cue(wildT, 'cheer', 0.6); cue(wildT + 0.2, 'camera', 0.25);
  shot(DRA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-1.5, 0.08, 21, [0.5, 3, 4])], [len(sh), K(-1.52, 0.1, 19.5, [0.5, 3.6, 4])]], { t });
    stageSet(g, t, { pieces: board(G6, 44), loose: capturedAt(G6, 44), ew: 'worried', eb: 'smug' }, { ply: 44, stand: 1, cheer: 0.6, drop: seg(t, DRA + 0.12, BKA - 0.1, lin), vig: 0.3 });
  }, { trans: 'whip' });
  cue(DRA - 0.05, 'whoosh_soft', 0.25); cue(DRA + 0.12, 'fabric', 0.5); cue(BKA - 0.12, 'thud', 0.4);
  // backstage, later in the game: Botvinnik short of time
  const BCLK = { tl: 4 * 60 + 30, tr: 21 * 60 };
  const backScene = (g, t) => {
    rig(B, t - BKA, [[0, K(0.62, 0.36, 14.5, [4, 1.6, 4])], [4.5, K(0.5, 0.3, 11.5, [4, 1.8, 4])]], { t });
    backstage(g, t, { mid: g2 => tableSet(g2, t, { pieces: board(G6, 70), loose: capturedAt(G6, 70), clock: BCLK, ew: 'worried', eb: 'focus' }) });
  };
  shot(BKA, (g, lt, t) => backScene(g, t), { trans: 'cut' });
  cue(BKA + 0.04, 'door_slam', 0.3); for (let x = BKA + 0.3; x < E1A + 0.6; x += 0.5) cue(x, 'clock_tick', 0.22);

  // ======================= TODAY: the back room on a phone; a swipe, the engine's answer in 0.09 s =======================
  const PL = { cy: H * 0.43 };
  const phKeys = [[0, K(0, 0, 1.0, [4, 2, 3.998])], [1.0, K(-0.33, 0.1, 3.0, [4.1, 1.8, 4], PL)], [1.5, K(-0.3, 0.09, 2.8, [4.1, 1.85, 4], PL)],
    [ansT - E1A + 0.2, K(-0.14, 0.05, 1.7, [4, 2.0, 4], PL)], [3.9, K(-0.1, 0.04, 1.5, [4, 1.95, 4], PL)]];
  shot(E1A, (g, lt, t) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); backScene(feedx, t);
    const r = seg(lt, 0.15, 1.2);
    phoneHand(g, lt, t, phKeys, phoneScreen(FEED, t, eng1T - 0.05, x => engineCard(x, t, { arrow: seg(t, findT, findT + 0.3, lin), timer: seg(t, findT, ansT - 0.05, lin), found: seg(t, ansT - 0.05, ansT + 0.15, lin) })),
      { sway: r, shake: 0.5 * r, vig: r });
  }, { kb: 0, hud: (g, lt, t) => {
    if (t < eng1T + 0.3) heading(g, 'TODAY', 230, seg(lt, 0.1, 0.3) * (1 - seg(t, eng1T, eng1T + 0.3)), { size: 52 });
    if (t >= underT) badge(g, 'UNDER 1 SECOND', W / 2, 230, { color: TEAL, size: 50, ...pop(t, underT) });
  } });
  cue(E1A + 0.4, 'whoosh_soft', 0.2); cue(eng1T - 0.05, 'swipe_card', 0.4); cue(findT, 'beep', 0.3); cue(ansT, 'notify', 0.4); cue(underT, 'ting', 0.35);

  // ======================= BOTVINNIK DOESN'T: 23.Bd2 on the stage; the bar falls to 0.0 =======================
  const LB = doesntT, aB = LB - SLIDE;
  shot(BVA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(3.69, 0.3, 17, [2.6, 2.2, 2.0], { fov: 2200 })], [len(sh), K(3.66, 0.29, 16, [2.7, 2.3, 1.9], { fov: 2200 })]], { t });
    const moved = t >= LB;
    stageSet(g, t, { pieces: t < aB ? board(G6, 44) : piecesAt(G6, 45, slide(t - aB), SLIDE_OPTS), loose: capturedAt(G6, 44), ew: 'focus', eb: moved ? 'smug' : 'focus',
      wReach: { sq: 'd2', u: seg(t, aB - 0.4, aB + 0.6, lin) }, wSide: 1, evalV: lerp(1.3, 0, seg(t, LB, LB + 0.45)), evalLabel: moved ? '0.0' : '+1.3',
      under: g2 => moveUnder(g2, B, M45, t - aB, { hold: 3 }), over: g2 => moveOver(g2, B, M45, t - aB, { hold: 3 }) }, { ply: 44, vig: 0.3 });
  }, { trans: 'whip' });
  cue(BVA - 0.06, 'whoosh_fast', 0.3); cue(LB - MOVE_HIT, 'move', 0.7); boom(LB, 0.5); cue(LB + 0.25, 'error', 0.35);
  // TAL WINS THE GAME: the result goes up beside the big board outside; the crowd cheers
  shot(WNA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.1, 40, [8.6, 9.8, 29])], [len(sh), K(0.09, 0.11, 37.5, [8.8, 9.5, 29])]], { t });
    facade(g, t, { ply: 93, result: '0 – 1', resultU: seg(t, winT - 0.1, winT + 0.25, lin), cheer: 0.15 + 0.85 * seg(t, winT, winT + 0.35, lin) });
  }, { trans: 'whip' });
  cue(WNA - 0.06, 'whoosh_fast', 0.3); cue(winT, 'clack', 0.4); cue(winT, 'cheer', 0.6); cue(winT + 0.1, 'applause', 0.5); cue(winT, 'boom_cine', 0.35);
  // THEN THE WHOLE MATCH: the score plates on the back wall turn to 12½ and 8½
  shot(MTA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-1.47, 0.14, 27, [7.5, 4.6, 4])], [len(sh), K(-1.5, 0.15, 25.5, [8, 5, 4])]], { t });
    const su = seg(t, wholeT, matchT + 0.1, lin);
    stageSet(g, t, { pieces: board(G6, 0), ew: 'neutral', eb: t >= matchT ? 'triumph' : 'happy', focus: depth(2.5, 0, 4) },  // the aim is the back wall: keep the board sharp
      { ply: 0, score: ['12½', '8½'], scoreU: su, stand: seg(t, matchT, matchT + 0.6, lin), cheer: seg(t, matchT + 0.2, matchT + 0.6, lin), spot: 0.2 });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= matchT + 0.15) badge(g, 'WORLD CHAMPION', W / 2, 230, { color: GOLD, size: 50, ...pop(t, matchT + 0.15) }); } });
  cue(MTA - 0.06, 'whoosh_fast', 0.3); cue(wholeT + 0.1, 'clack', 0.4); cue(matchT + 0.1, 'clack', 0.4); cue(matchT + 0.15, 'reveal_bell', 0.4); cue(matchT + 0.2, 'applause', 0.6); cue(matchT + 0.3, 'cheer', 0.4);

  // ======================= BLED 1965: the lake, Larsen, the tied score =======================
  shot(BLA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.07, 64, [8, 5, 70])], [len(sh), K(-0.06, 0.05, 50, [8, 6, 70])]], { t });
    lake(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'Bled, Yugoslavia', '1965', { y: 200, t0: 0.1 }) });
  cue(BLA - 0.06, 'whoosh_deep', 0.3); cue(BLA, 'waves', 0.3);
  shot(LRA, (g, lt, t) => photoShot(g, lt, PH.larsen, { from: { x: 0.5, y: 0.3, zoom: 1.04, dolly: 0 }, to: { x: 0.5, y: 0.3, zoom: 1.16, dolly: 0.05 }, dur: TIA - LRA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Bent Larsen', 'DENMARK', { y: 210, size: 66, t0: 0.05 }); credit(g, CREDITS.larsen, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(LRA - 0.06, 'whoosh_fast', 0.3); cue(LRA + 0.05, 'camera', 0.25);
  const BTAB = ['#7A5A3A', '#5A3E26', '#6A4A2E'], BCH = '#5A3E26';
  const bledSet = (g, t, o = {}, h = {}) => bledHall(g, t, { ...h, mid: g2 => tableSet(g2, t, { white: 'tal65', black: 'larsen', tableCol: BTAB, chairCol: BCH, clock: { tl: 41 * 60, tr: 47 * 60 }, evalCols: [LIME, OPP_C], ...o }) });
  shot(TIA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.12, 19, [4, 6.6, 12.2], { fov: 1700, cy: H * 0.58 })], [len(sh), K(0.04, 0.1, 17, [4, 6.8, 12.4], { fov: 1700, cy: H * 0.58 })]], { t });
    bledSet(g, t, { pieces: board(BL, 30), loose: capturedAt(BL, 30), eb: 'focus' }, { score: ['4½', '4½'], score0: ['4', '4'], flipU: seg(t, tiedT - 0.1, tiedT + 0.25, lin), sub: 'SEMIFINAL' });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= lastT) badge(g, 'LAST GAME', W / 2, 520, { color: RED, size: 50, ...pop(t, lastT) }); } });
  cue(TIA - 0.06, 'whoosh_fast', 0.3); cue(tiedT, 'clack', 0.45); cue(lastT, 'dun_dun', 0.4); cue(lastT + 0.4, 'heartbeat', 0.4);

  // ======================= AND TAL GIVES AWAY A KNIGHT. AGAIN: 16.Nd5 =======================
  const M31 = { ...moveOf(BL, 31), brill: true }, M32 = moveOf(BL, 32), M33 = moveOf(BL, 33), M34 = { ...moveOf(BL, 34), label: '17...f5?' };
  function nd5Set(g, t, o = {}, h = {}) {
    const d = 0.55, k = carried(t, L3 - d, d, 'c3', 'd5'), landed = t >= L3, [x1, z1] = sqXZ('d5');
    const reach = landed ? { x: x1, z: z1, y: 1.05, u: 1 - seg(t, L3 + 0.15, L3 + 0.55, lin), hold: true }
      : { x: k.x, z: k.z, y: k.y + 1.05, u: seg(t, L3 - d - 0.7, L3 - d - 0.35, lin), hold: true };
    bledSet(g, t, {
      pieces: landed ? board(BL, 31) : board(BL, 30, ['N2']), loose: landed ? capturedAt(BL, 31) : [...capturedAt(BL, 30), { id: 'N2', t: 'n', c: 'w', x: k.x, y: k.y, z: k.z }],
      wReach: reach, wSide: 1, ew: landed ? 'smug' : 'focus', eb: landed && t > L3 + 0.3 ? 'shock' : 'focus',
      under: g2 => { if (landed) { brilliantSquare(g2, B, 'd5', seg(t, L3, L3 + 0.2), t); ledGlow(g2, B, 'd5', BRILL, t, L3); spread(g2, B, 'd5', t, L3, BRILL); }
        moveUnder(g2, B, M31, t - L3 + SLIDE, { hold: 30 }); },
      over: g2 => { moveOver(g2, B, M31, t - L3 + SLIDE, { hold: 30 }); if (landed) signOn(g2, 'd5', seg(t, L3 + 0.02, L3 + 0.5, lin)); },
      ...o }, { score: ['4½', '4½'], sub: 'SEMIFINAL', ...h });
  }
  shot(NDA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.06, 0.4, 12.4, [3.3, 1.5, 3.2], { cy: H * 0.46 })], [L3 - NDA, K(PI + 0.1, 0.38, 11.2, [3.3, 1.55, 3.0], { cy: H * 0.46 })], [len(sh), K(PI + 0.12, 0.37, 10.8, [3.3, 1.6, 3.0], { cy: H * 0.46 })]],
      { t, bump: t > L3 && t < L3 + 0.3 ? 1.5 : 0 });
    nd5Set(g, t, { bPlayer: false, bChair: false, label: false });
    impact(g, 'd5', t, L3, { flash: 0.5 });
  }, { trans: 'whip' });
  cue(NDA, 'heartbeat', 0.45); cue(givesT, 'fabric', 0.3); bigHit(L3); cue(L3 + 0.05, 'sparkle_pop', 0.45); cue(L3 + 0.3, 'gasp', 0.45);
  shot(AGA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.5, 0.38, 13, [3.6, 1.6, 5.6], { fov: 2300, cy: H * 0.44 })], [len(sh), K(-0.58, 0.37, 12.5, [3.6, 1.65, 5.6], { fov: 2300, cy: H * 0.44 })]], { t });
    nd5Set(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= againT) badge(g, 'AGAIN', 790, 330, { color: GOLD, size: 64, ...pop(t, againT) }); } });
  cue(AGA - 0.06, 'whoosh_fast', 0.3); cue(againT, 'ting', 0.35);

  // ======================= THE ENGINE'S VERDICT: BLUNDER (the sign turns over) =======================
  shot(E2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(3.55, 0.32, 16, [2.0, 2.4, 3.4], { fov: 2000, cy: H * 0.45 })], [len(sh), K(3.5, 0.31, 15.2, [2.0, 2.5, 3.4], { fov: 2000, cy: H * 0.45 })]], { t });
    const fl = seg(t, blunT - 0.32, blunT, lin);
    bledSet(g, t, { pieces: board(BL, 31), loose: capturedAt(BL, 31), ew: 'smug', eb: 'focus', bPlayer: false, bChair: false, evalV: -1.5, evalLabel: '−1.5', evalGrow: seg(t, eng2T, eng2T + 0.7, lin),
      under: g2 => brilliantSquare(g2, B, 'd5', 1 - fl, t), over: g2 => signOn(g2, 'd5', 1, { flip: fl }) }, { score: ['4½', '4½'], sub: 'SEMIFINAL' });
  }, { trans: 'whip', hud: (g, lt, t) => stamp(g, 'BLUNDER', 440, 300, t, blunT, { color: RED }) });
  cue(E2A - 0.06, 'whoosh_fast', 0.3); cue(eng2T, 'whoosh_soft', 0.3); cue(eng2T + 0.5, 'beep', 0.3); cue(blunT - 0.3, 'whoosh_fast', 0.2); cue(blunT, 'stamp', 0.6); cue(blunT + 0.05, 'error', 0.35);

  // ======================= LARSEN GOES WRONG ONE MOVE LATER: 16...exd5 17.exd5 f5? =======================
  const LM = [LSA + 0.08, LSA + 0.4, wrongT + 0.06 - SLIDE];  // slide starts of plies 32, 33, 34
  shot(LSA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.5, 0.55, 15, [2.3, 1.3, 4.6], { fov: 1700 })], [len(sh), K(-0.44, 0.55, 14.4, [2.4, 1.3, 4.6], { fov: 1700 })]], { t });
    const i = t >= LM[2] ? 2 : t >= LM[1] ? 1 : t >= LM[0] ? 0 : -1, k = 32 + i, f5 = t >= LM[2] + SLIDE;
    const pieces = i < 0 ? board(BL, 31) : piecesAt(BL, k, slide(t - LM[i]), SLIDE_OPTS);
    bledSet(g, t, { pieces, loose: capturedAt(BL, i < 0 ? 31 : slide(t - LM[i]) < 1 ? k - 1 : k), ew: 'focus', eb: f5 ? 'smug' : 'focus',
      bReach: { sq: t < LM[1] ? 'd5' : 'f5', u: t < LM[1] ? seg(t, LM[0] - 0.3, LM[0] + 0.5, lin) : seg(t, LM[2] - 0.35, LM[2] + 0.6, lin) }, bSide: t < LM[1] ? -1 : 1,
      wReach: { sq: 'd5', u: seg(t, LM[1] - 0.3, LM[1] + 0.5, lin) }, wSide: 1,
      evalV: lerp(-1.5, 0.2, seg(t, LM[2] + SLIDE + 0.1, LM[2] + SLIDE + 0.6)), evalLabel: f5 && t > LM[2] + SLIDE + 0.35 ? '+0.2' : '−1.5',
      under: g2 => { moveUnder(g2, B, M32, t - LM[0], { hold: LM[1] - LM[0] - 0.1 }); moveUnder(g2, B, M33, t - LM[1], { hold: LM[2] - LM[1] - 0.1 }); moveUnder(g2, B, M34, t - LM[2], { hold: 3 }); },
      over: g2 => { moveOver(g2, B, M32, t - LM[0], { hold: LM[1] - LM[0] - 0.1, label: false }); moveOver(g2, B, M33, t - LM[1], { hold: LM[2] - LM[1] - 0.1, label: false }); moveOver(g2, B, M34, t - LM[2], { hold: 3 }); } },
      { score: ['4½', '4½'], sub: 'SEMIFINAL' });
  }, { trans: 'whip' });
  cue(LSA - 0.06, 'whoosh_fast', 0.3); cue(LM[0] + SLIDE - MOVE_HIT, 'move_capture', 0.55); cue(LM[1] + SLIDE - MOVE_HIT, 'move_capture', 0.55);
  cue(LM[2] + SLIDE - MOVE_HIT, 'move', 0.7); boom(LM[2] + SLIDE, 0.55); cue(LM[2] + SLIDE + 0.3, 'sting', 0.35);
  // AND TAL WINS THE MATCH: the score board turns to 5½ – 4½
  shot(WMA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.1, 17.5, [4, 6.8, 12.4], { fov: 1700, cy: H * 0.57 })], [len(sh), K(0.02, 0.1, 16, [3.9, 7, 12.6], { fov: 1700, cy: H * 0.57 })]], { t });
    bledSet(g, t, { pieces: board(BL, 73), loose: capturedAt(BL, 73), eb: 'sad', clock: { tl: 41 * 60, tr: 47 * 60 } },
      { score: ['5½', '4½'], score0: ['4½', '4½'], flipU: seg(t, wins2T - 0.1, wins2T + 0.25, lin), sub: t >= match2T ? 'TAL WINS' : 'SEMIFINAL' });
  }, { trans: 'whip' });
  cue(WMA - 0.06, 'whoosh_fast', 0.3); cue(wins2T, 'clack', 0.45); cue(match2T, 'reveal_bell', 0.4); cue(match2T + 0.05, 'applause', 0.5);

  // ======================= KASPAROV WROTE: the photo, then his book opens =======================
  shot(KAA, (g, lt, t) => photoShot(g, lt, PH.kasp, { from: { x: 0.47, y: 0.36, zoom: 1.04, dolly: 0 }, to: { x: 0.47, y: 0.34, zoom: 1.16, dolly: 0.05 }, dur: BKK - KAA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Garry Kasparov', '13TH WORLD CHAMPION', { y: 210, size: 62, t0: 0.05 }); credit(g, CREDITS.kasp, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(KAA - 0.06, 'whoosh_fast', 0.3); cue(KAA + 0.05, 'camera', 0.25);
  shot(BKK, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.02, 1.05, 15, [2.8, 0.6, -0.4], { cy: H * 0.6 })], [len(sh), K(0.06, 1.12, 11, [3.0, 0.7, 0.2], { cy: H * 0.6 })]], { t });
    bookSet(g, t, { open: seg(t, BKK, BKK + 0.55), mark: seg(t, posedT, timeT + 0.3, lin) });
  }, { hud: (g, lt, t) => quote2(g, t - posedT + 0.4, ['“…Tal posed problems that', 'were ahead of their time', 'in complexity.”'], 'GARRY KASPAROV · MY GREAT PREDECESSORS') });
  cue(BKK + 0.05, 'page_flip', 0.5); cue(posedT, 'pen', 0.35);

  // ======================= TAL HIMSELF ONCE SAID: TWO KINDS OF SACRIFICES. SOUND ONES... AND MINE =======================
  const TALQ = 'MIKHAIL TAL · AS QUOTED, 1973';
  shot(SDA, (g, lt, t) => photoShot(g, lt, PH.tal88, { from: { x: 0.55, y: 0.4, zoom: 1.04, dolly: 0 }, to: { x: 0.55, y: 0.38, zoom: 1.18, dolly: 0.06 }, dur: MNA - SDA + 0.3, dim: 0.15 * seg(t, thereT - 0.3, thereT) }),
    { trans: 'whip', hud: (g, lt, t) => {
      if (t < thereT - 0.15) { nameTitle(g, lt, 'Mikhail Tal', '8TH WORLD CHAMPION', { y: 210, size: 66, t0: 0.05, a: 1 - seg(t, thereT - 0.35, thereT - 0.15, lin) }); credit(g, CREDITS.tal88, seg(lt, 0.4, 0.6) * 0.75); }
      else quote2(g, t - thereT + 0.3, ['“There are two kinds', 'of sacrifices…'], TALQ, { cr: CREDITS.tal88 });
    } });
  cue(SDA - 0.06, 'whoosh_soft', 0.3); cue(SDA + 0.05, 'camera', 0.2);
  shot(MNA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.1, 22, [0, 4.6, 0], { cy: H * 0.432 })], [mineT - MNA, K(0.02, 0.1, 19, [0.6, 4.8, 0], { cy: H * 0.432 })], [len(sh), K(0.12, 0.1, 17.5, [1.9, 4.8, 0], { cy: H * 0.443 })]], { t });
    knights(g, t, { lit: [seg(t, soundT - 0.05, soundT + 0.2, lin), seg(t, mineT - 0.1, mineT + 0.15, lin)], mineU: seg(t, mineT, mineT + 0.4, lin), sparkle: seg(t, mineT, mineT + 0.5, lin) });
  }, { trans: 'zoom', hud: (g, lt, t) => quote2(g, 1, ['“There are two kinds of', 'sacrifices: sound ones…', ['and mine.”', seg(t, mineT - 0.1, mineT + 0.2, lin)]], TALQ) });
  cue(MNA - 0.06, 'whoosh_deep', 0.3); cue(soundT, 'lamp', 0.45); cue(mineT - 0.05, 'lamp', 0.45); cue(mineT, 'sparkle_pop', 0.45); cue(mineT + 0.05, 'shimmer', 0.35);

  // ======================= CTA: back on the stage of the hook; the curtain closes =======================
  shot(CTA, (g, lt, t, sh) => {
    // Botvinnik's seat stays empty here (the viewer's seat), so the fly-round passes no one's back
    rig(B, lt, [[0, K(0.45, 0.42, 12.5, [5.2, 1.5, 4.8], { fov: 2300, cy: H * 0.45 })], [0.75, K(0.4, 0.42, 12.2, [5.15, 1.5, 4.8], { fov: 2300, cy: H * 0.45 })],
      [2.5, K(-1.28, 0.16, 29.5, [3, 3.5, 4])], [len(sh), K(-1.3, 0.16, 31, [3, 3.6, 4]), ease.out]], { t });
    stageSet(g, t, { pieces: board(G6, 42), loose: capturedAt(G6, 42), ew: 'focus', eb: 'smug', wPlayer: false, under: g2 => brilliantSquare(g2, B, 'f4', 1, t), over: g2 => signOn(g2, 'f4', 1) },
      { ply: 42, close: seg(t, numT + 0.3, T.duration - 0.5), spot: 0.18, cone: 0.1 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'YOUR BRILLIANT MOVES?', W / 2, 230, { color: TEAL, size: 44, a: seg(t, movesT, movesT + 0.1), ...pop(t, movesT) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, commT, commT + 0.1), ...pop(t, commT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, numT, numT + 0.1) });
  } });
  cue(CTA - 0.06, 'whoosh_fast', 0.3); cue(CTA, 'murmur', 0.25); cue(movesT, 'sparkle_pop', 0.3); cue(commT, 'sparkle_pop', 0.3); cue(numT + 0.3, 'fabric', 0.4);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: H2A, m: 'intrigue' }, { t: MOS, m: 'coldwar' }, { t: G6A, m: 'tension' }, { t: L2, m: 'slam' }, { t: CRA, m: 'glory' },
    { t: BKA, m: 'void' }, { t: E1A, m: 'digital' }, { t: BVA, m: 'tension' }, { t: WNA, m: 'victory' }, { t: BLA, m: 'build' }, { t: NDA, m: 'tension' },
    { t: L3, m: 'slam' }, { t: E2A, m: 'void' }, { t: LSA, m: 'build' }, { t: WMA, m: 'victory' }, { t: KAA, m: 'elegy' }, { t: SDA, m: 'finale' },
    { t: CTA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: L2 - 0.5, t1: L2 - 0.01, kind: 'mute' }, { t0: L2, t1: CRA - 0.05, kind: 'boost', db: 6 },
    { t0: L3 - 0.45, t1: L3 - 0.01, kind: 'mute' }, { t0: L3, t1: E2A - 0.05, kind: 'boost', db: 5 },
    { t0: CTA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
