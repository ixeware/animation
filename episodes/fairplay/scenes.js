// Chess.com will catch you anyway (The 64 Files, November 2026). The hook: Magnus Carlsen resigned after one move against
// Hans Niemann (Julius Baer Generation Cup, online, 19 September 2022). Chess.com's report of 4 October 2022 said Niemann
// likely cheated in more than 100 online games; one clue was that he played much better when he toggled to another
// screen. Then four traps: leaving the board; finding the best move more often than players at your rating; one engine
// move a game adding up over a hundred games; your opponents' reports (1.4 million in October 2026, 281,992 accounts
// closed, 96.7 % of them automatically). The twist: the points a cheater took come back (69.6 million in October).
// The loop: Magnus resigned after one move; Chess.com never resigns. Sources: SOURCES.md.
// Built on every retention rule we have (memory/retention.md): Magnus in the hook and the first frame bright with a big
// title; the edit-bait before 12 s with a music cut; a counter of traps (1 of 4 ... 4 of 4) as the open loop; a meme beat
// in the middle (the Fair Play team bursting through a door, "FBI, open up"); a counter or a stamp in nearly every shot;
// silence before the twist; the last frame like the first; the question answered with a number. Two sets: Magnus's
// streaming room in daylight (the Mittens look, rule 63) and a giant chessboard floor for the traps, both in 3D.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar, exprAt, hand } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, counter, score, vsLabel, plate, sans, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool, gear } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, boardArrow, pieceRing, spread, moveTag } from '../../engine/js/hifx.js';
import { webcam } from '../../engine/js/witty.js';
import { shockwave, burst, dust } from '../../engine/js/fx.js';
import { confetti } from '../../engine/js/draw.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (rule 48): clean green against cheater red, daylight cream ----------
const GOLD = '#F5C451', RED = '#E8413A', LIME = HI.good, CREAM = '#FFF3E0', INK = '#07070C', MINT = '#7FD9A8';
const CURSE = RED, LEVY_C = '#4FC3FF', FAN_C = RED;  // the names the shared code below uses for its default colours
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#15151C', side: '#0B0B10', th: 0.45, rc: 0.35 };
const WOODT = ['#C99A68', '#8A6440', '#A87E52'];
// the game of the hook (SOURCES.md): Niemann (White) – Carlsen, Julius Baer Generation Cup, 19 Sep 2022: 1.d4 Nf6 2.c4, Black resigned
const NC = await fetch('../engine/data/niemann_carlsen_2022-09-19.json').then(r => r.json());

// ---------- the cast: Magnus from the engine; Hans Niemann (light wavy hair swept back, dark top), "you" (a player in
// a dark hoodie) and the honest opponents added here ----------
Object.assign(CAST, {
  hans: { face: [0.9, 1.1, 0.82], hair: 'wavy', hairC: '#D8B56C', brow: '#A9844C', suit: '#1F232B', suitD: '#14171E', shirt: 'tee', ears: 1.02 },
  you: { face: [0.95, 1.05, 0.88], hair: 'messy', hairC: '#2C2219', brow: '#221A15', suit: '#2A2D36', suitD: '#1C1E25', shirt: 'hoodie', ears: 1.02 },
  opp: { face: [0.98, 1.0, 0.92], hair: 'fringe', hairC: '#8A5A34', brow: '#6E4428', suit: '#3F7A5A', suitD: '#2E5C43', shirt: 'tee', ears: 1.04 },
  opp2: { face: [0.95, 1.05, 0.86], hair: 'longcurly', hairC: '#3A2A20', brow: '#2E2119', suit: '#C9643E', suitD: '#9E4A2C', shirt: 'tee', ears: 0.9, female: true },
  opp3: { face: [0.97, 1.03, 0.9], hair: 'buzz', hairC: '#1E1612', brow: '#16100C', suit: '#3D5A8C', suitD: '#2B426A', shirt: 'hoodie', ears: 1.04 },
  opp4: { face: [0.93, 1.07, 0.86], hair: 'swept', hairC: '#C9A070', brow: '#9E7A50', suit: '#7A4E8E', suitD: '#5A3A6A', shirt: 'polo', ears: 1.0, glasses: true },
  opp5: { face: [0.96, 1.04, 0.9], hair: 'tied', hairC: '#6E3A22', brow: '#4E2A18', suit: '#2F7F7A', suitD: '#225E5A', shirt: 'tee', ears: 0.9, female: true },
  opp6: { face: [1.0, 1.0, 0.94], hair: 'receding', hairC: '#8E8A84', brow: '#6E6A64', suit: '#5A5A62', suitD: '#404048', shirt: 'polo', ears: 1.04, beard: '#8E8A84' },
});


const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// an ink scrim at the top of the frame: titles stay readable over the bright domains
function scrim(g, a = 1) { if (a <= 0) return; const gr = g.createLinearGradient(0, 0, 0, 470); gr.addColorStop(0, `rgba(5,5,10,${(0.8 * a).toFixed(3)})`); gr.addColorStop(1, 'rgba(5,5,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 470); }
// the cover: a white line over a big one, blue (him) or gold
function coverTitle(g, l1, l2, y, { a = 1, c2 = GOLD } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#05050A';
  g.font = sans(70, 900); g.lineWidth = 16; g.strokeText(l1, W / 2, y); g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  g.font = sans(136, 900); const y2 = y + 138;
  g.lineWidth = 22; g.strokeText(l2, W / 2, y2); g.fillStyle = c2; g.fillText(l2, W / 2, y2);
  g.restore();
  qaRect(g, 60, y - 64, W - 120, 226, 'text', 'cover title');
}
// a manga speech bubble (white oval, black ink); cross 0..1 strikes it out with a slash, like the panel the author sent
function bubble(g, text, x, y, { a = 1, size = 70, cross = 0, tail = -1, scale = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(scale, scale);
  g.font = sans(size, 900); g.letterSpacing = '1px';
  const tw = g.measureText(text).width, rx = tw / 2 + size * 0.75, ry = size * 1.0;
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#08080C'; g.lineWidth = 8; g.lineJoin = 'round';
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7);
  if (tail) { g.moveTo(tail * rx * 0.32, ry * 0.86); g.lineTo(tail * rx * 0.62, ry * 1.7); g.lineTo(tail * rx * 0.06, ry * 0.96); }
  g.fill(); g.stroke(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, 0, rx - 4, ry - 4, 0, 0, 7); g.fill();
  g.fillStyle = '#08080C'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, size * 0.06);
  if (cross > 0) {  // the slash: a hard black line from lower left to upper right, drawn in
    const u = ease.out(clamp(cross)), x0 = -rx * 1.08, y0 = ry * 0.95, x1 = rx * 1.08, y1 = -ry * 0.95;
    g.strokeStyle = '#08080C'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, u), lerp(y0, y1, u)); g.stroke();
    g.strokeStyle = CURSE; g.lineWidth = 8; g.stroke();
  }
  g.restore();
  qaRect(g, x - rx * scale, y - ry * scale, 2 * rx * scale, 2 * ry * scale, 'text', text);
}
// a speech bubble as in the Mittens video: a white rounded box with a hard shadow, the speaker's name in small green
// capitals over the line, a tail under it
function speech(g, name, text, x, y, { a = 1, size = 66, scale = 1, tail = -0.22 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(scale, scale);
  g.font = sans(size, 900); const tw = g.measureText(text).width, bw = Math.max(tw + size * 1.2, 420), bh = size * 2.2, r = 26, L = -bw / 2 + size * 0.6;
  g.fillStyle = 'rgba(10,10,16,0.35)'; g.beginPath(); g.roundRect(-bw / 2 + 8, -bh / 2 + 10, bw, bh, r); g.fill();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, r); g.fill();
  g.beginPath(); g.moveTo(tail * bw - 28, bh / 2 - 2); g.lineTo(tail * bw - 4, bh / 2 + 44); g.lineTo(tail * bw + 26, bh / 2 - 2); g.closePath(); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = sans(Math.round(size * 0.34), 800); g.letterSpacing = '3px'; g.fillStyle = '#2E9E6A'; g.fillText(name, L, -bh / 2 + size * 0.55);
  g.font = sans(size, 900); g.letterSpacing = '0px'; g.fillStyle = '#16161E'; g.fillText(text, L, size * 0.22);
  g.restore();
  qaRect(g, x - bw / 2 * scale, y - bh / 2 * scale, bw * scale, bh * scale, 'text', text);
}
// a small dark plate with a light word (WITTY, PROBABLY:)
function caption(g, text, x, y, { a = 1, size = 40, color = CREAM } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = '4px'; const tw = g.measureText(text).width + size * 1.1;
  g.fillStyle = '#08080C'; g.fillRect(x - tw / 2 + 6, y - size * 0.95 + 6, tw, size * 1.6); g.fillStyle = '#16161E'; g.fillRect(x - tw / 2, y - size * 0.95, tw, size * 1.6);
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + 2, y - size * 0.15);
  g.restore(); qaRect(g, x - tw / 2, y - size * 0.95, tw, size * 1.6, 'text', text);
}

// ======================= SHARED TOOLKIT (from episodes/gmhunter: 3D solids, textured quads, the stage table, the clock) =======================
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
    const dz = d - B.dist, blur = clamp((dz < 0 ? -dz - 1.2 : (dz - 2.5) * 0.35) * 0.5, 0, 12);
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
const TABLE = ['#C99A68', '#8A6440', '#A87E52'], CHAIR = '#24242E';
function tableSet(g, t, { pieces = null, loose = [], ew = 'focus', eb = 'focus', wReach = null, bReach = null, wSide = -1, bSide = 1, white = 'dad', black = 'ire', wx = 4, bx = 4,
  under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, evalCols = [LEVY_C, FAN_C], wPlayer = true, bPlayer = true, wChair = true, bChair = true,
  slab = true, mark, behind = null, front = null, arms = null, focus = null, dof = 0.5, tableCol = TABLE } = {}) {
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
    if (pieces) B.drawPieces(g, lateB.length ? pieces.filter(p => !lateB.includes(p)) : pieces, { focus: focus ?? B.dist, dof });
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
    [...lateB.map(p => [depth(p.x, p.y || 0, p.z), () => B.drawPieces(g, [p], { focus: focus ?? B.dist, dof })]),
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


// ======================= THE DAY ROOM (rule 63: the Mittens look) =======================
// Witty's streaming room, version 5: cream walls, a wood floor, and in each end wall a big window on blue sky, clouds
// and green hills between pleated curtains (blue behind Witty's seat, red behind Magnus's: the two sides of the video).
// On the far edge of the table stands the stream monitor: the two webcams side by side, or Chessigma's review of the
// game. A wall calendar by the far window (September 30 → November 7); a little green alien on Witty's window sill.
const ROOM = { x0: -10, x1: 18, z0: -12, z1: 13.6, top: 16 };
const WIN = { x0: -2.6, x1: 10.6, y0: 2.0, y1: 11.6 };  // both windows
const SKY_T = tex(1200, 880, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3F9FE6'); gr.addColorStop(0.75, '#BFE7FF'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.96)';
  for (const [cx, cy, s] of [[210, 190, 1.05], [700, 130, 0.85], [1010, 330, 0.75], [470, 380, 0.62], [900, 560, 0.5]]) { x.beginPath(); x.ellipse(cx, cy, 110 * s, 38 * s, 0, 0, 7); x.ellipse(cx + 55 * s, cy - 22 * s, 66 * s, 38 * s, 0, 0, 7); x.ellipse(cx - 50 * s, cy - 10 * s, 50 * s, 30 * s, 0, 0, 7); x.fill(); }
  const r = rng(5);
  for (const [col, y0, amp] of [['#86CC62', h * 0.72, 46], ['#57AA4C', h * 0.81, 40], ['#3E8E3C', h * 0.9, 30]]) {
    x.fillStyle = col; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= 16; i++) { const xx = i * w / 16; x.quadraticCurveTo(xx - w / 32, y0 - amp * (0.6 + 0.6 * r()), xx, y0 - amp * 0.3 * r()); }
    x.lineTo(w, h); x.closePath(); x.fill();
  }
  x.strokeStyle = '#FBF6EC'; x.lineWidth = 30; x.strokeRect(0, 0, w, h); x.lineWidth = 16; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h * 0.46); x.lineTo(w, h * 0.46); x.stroke();
});
// a wall calendar page: red header with the month, the days, one day ringed in red
function calTex(month, first, days, ring) {
  return tex(420, 540, (x, w, h) => {
    x.fillStyle = '#FFFDF8'; x.fillRect(0, 0, w, h); x.fillStyle = '#D6403A'; x.fillRect(0, 0, w, 120);
    x.fillStyle = '#FFFFFF'; x.font = sans(46, 900); x.letterSpacing = '3px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(month, w / 2, 52);
    x.font = sans(24, 800); x.letterSpacing = '6px'; x.fillText('2026', w / 2, 96);
    x.font = sans(28, 800); x.letterSpacing = '0px';
    for (let d = 1; d <= days; d++) { const k = d - 1 + first, cx = 36 + (k % 7) * 58, cy = 168 + Math.floor(k / 7) * 66;
      x.fillStyle = d === ring ? '#1E1E24' : '#4A4A52'; x.fillText(String(d), cx, cy);
      if (d === ring) { x.strokeStyle = '#D6403A'; x.lineWidth = 6; x.beginPath(); x.ellipse(cx, cy, 30, 26, 0, 0, 7); x.stroke(); } }
  });
}
const CAL_SEP = calTex('SEPTEMBER', 2, 30, 30), CAL_NOV = calTex('NOVEMBER', 0, 30, 7);
const CALP = { x0: 13.9, x1: 17.1, y0: 4.0, y1: 8.2 };  // right of the far window, out of the usual frames (rule 52: a word whole or not at all)
// the calendar on the back wall; flip 0..1 tears September up and away, November underneath
function calendar(g, flip = 1) {
  const { x0, x1, y0, y1 } = CALP, z = ROOM.z1 - 0.04;
  ab(g, [x0 - 0.1, y1 - 0.05, z - 0.06], [x1 + 0.1, y1 + 0.25, z], '#2A2A30');
  texQuad(g, CAL_NOV, [x0, y1, z - 0.02], [x1, y1, z - 0.02], [x0, y0, z - 0.02]);
  if (flip < 1) { const u = ease.inOut(clamp(flip)), yb = lerp(y0, y1 + 1.6, u), zb = z - 0.05 - Math.sin(u * Math.PI) * 1.4;
    texQuad(g, CAL_SEP, [x0, y1, z - 0.05], [x1, y1, z - 0.05], [x0, yb, zb], { a: 1 - clamp((u - 0.85) / 0.15) }); }
}
// a curtain: pleats hanging from the rod, lit and shaded in turn; dz points into the room
function curtain(g, x0, x1, z, dz, col) {
  const n = 7, y0 = 0.7, y1 = WIN.y1 + 0.75, w = (x1 - x0) / n, dk = mix(col, '#000000', 0.24), lt = mix(col, '#FFFFFF', 0.1);
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * w, xb = xa + w, za = z + dz * (i % 2 ? 0.36 : 0.12), zb = z + dz * (i % 2 ? 0.12 : 0.36);
    quad(g, [[xa, y1, za], [xb, y1, zb], [xb, y0, zb], [xa, y0, za]], i % 2 ? dk : lt);
  }
}
// an end wall with its window: the wall, the skirting, the frame and the sky, a sill, a rod and two curtains
function endWall(g, z, dz, col, sky = SKY_T, lightC = '#FFF6DA') {
  const { x0, x1, top } = ROOM, wall = { color: '#F4E9D7', grout: 'rgba(0,0,0,0.03)', tu: 40, tv: 40 }, zi = (a, b) => [Math.min(z + dz * a, z + dz * b), Math.max(z + dz * a, z + dz * b)];
  if (dz < 0) tiled(g, [x0, FLOOR_Y, z], [x1 - x0, 0, 0], [0, top - FLOOR_Y, 0], wall); else tiled(g, [x1, FLOOR_Y, z], [x0 - x1, 0, 0], [0, top - FLOOR_Y, 0], wall);
  let [a, b] = zi(0, 0.12); ab(g, [x0, FLOOR_Y, a], [x1, FLOOR_Y + 0.5, b], '#E6D7BF');
  [a, b] = zi(0, 0.1); ab(g, [WIN.x0 - 0.3, WIN.y0 - 0.3, a], [WIN.x1 + 0.3, WIN.y1 + 0.3, b], '#FBF6EC');
  const zs = z + dz * 0.12;
  if (dz < 0) texQuad(g, sky, [WIN.x0, WIN.y1, zs], [WIN.x1, WIN.y1, zs], [WIN.x0, WIN.y0, zs]); else texQuad(g, sky, [WIN.x1, WIN.y1, zs], [WIN.x0, WIN.y1, zs], [WIN.x1, WIN.y0, zs]);
  pool(g, B, 4, 7, z + dz * 0.2, 12, lightC, 0.26, true);
  [a, b] = zi(0, 0.7); ab(g, [WIN.x0 - 0.5, WIN.y0 - 0.55, a], [WIN.x1 + 0.5, WIN.y0 - 0.3, b], '#FFFBF2');
  curtain(g, WIN.x0 - 3.0, WIN.x0 + 0.1, z, dz, col); curtain(g, WIN.x1 - 0.1, WIN.x1 + 3.0, z, dz, col);
  [a, b] = zi(0.3, 0.48); ab(g, [WIN.x0 - 3.5, WIN.y1 + 0.72, a], [WIN.x1 + 3.5, WIN.y1 + 0.92, b], '#3A2E28');
}
function dayRoom(g, t, { flip = 1, cal = false, farSky = SKY_T } = {}) {
  const E = B.E, { x0, x1, z0, z1, top } = ROOM;
  g.fillStyle = '#F1E6D2'; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) {
    tiled(g, [x0, FLOOR_Y, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], { color: '#C99D6C', grout: 'rgba(110,70,35,0.2)', tu: 1.2, tv: z1 - z0,
      light: g2 => { pool(g2, B, 4, FLOOR_Y + 0.02, -7, 10, '#FFF2D2', 0.3); pool(g2, B, 4, FLOOR_Y + 0.02, 9.5, 9, '#FFF2D2', 0.24); } });
    tiled(g, [-5.5, FLOOR_Y + 0.02, -7.5], [19, 0, 0], [0, 0, 19.5], { color: '#7A97B8', grout: 'rgba(255,255,255,0.12)', tu: 19, tv: 1.3 });  // the rug
  }
  if (E[2] < z1) { endWall(g, z1, -1, '#4E8F5C', farSky); if (cal) calendar(g, flip); }   // the far wall, behind the monitor
  if (E[2] > z0) { endWall(g, z0, 1, '#5B7FA8'); }  // the near wall
  const side = { color: '#EADCC6', grout: 'rgba(0,0,0,0.03)', tu: 40, tv: 40 };
  if (E[0] > x0) { tiled(g, [x0, FLOOR_Y, z0], [0, 0, z1 - z0], [0, top - FLOOR_Y, 0], side); bookcase(g); }
  if (E[0] < x1) { tiled(g, [x1, FLOOR_Y, z1], [0, 0, z0 - z1], [0, top - FLOOR_Y, 0], side); wallPrint(g); }
}


// ======================= THE STREAM MONITOR =======================
// one screen on a stand at the far edge of the table (version 5; the wall panels of the first versions were small and
// the wall round them empty): the two webcams side by side, Witty's in blue and Magnus's in red, or the review
const MON = { c: [4, 3.3, 10.7], hw: 4.4, hh: 2.475 };
const CAMLOOK = { hans: { bg: ['#4C6A86', '#1A2633'], name: 'HANS NIEMANN', nameColor: '#CFE6FF' }, magnus: { bg: ['#B9A27E', '#4A3A28'], name: 'MAGNUS CARLSEN', nameColor: '#FFE2B0' },
  you: { bg: ['#4A4E5E', '#1E2028'], name: 'YOU', nameColor: '#FFD27A' }, opp: { bg: ['#6FA07E', '#24402E'], name: 'YOUR OPPONENT', nameColor: '#CFF5DA' } };
const SPLIT = makeCanvas(1760, 990);
function splitTex(cams, t) {
  // cams: { left: { who, e, off, zoom, shake }, right: {...} }; an "off" camera is a dark frame with its name
  const x = SPLIT.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1760, 990);
  [['left', 0], ['right', 880]].forEach(([side, x0], k) => {
    const o = cams[side] || {}, L = CAMLOOK[o.look || o.who] || CAMLOOK.opp;
    if (o.off >= 1) { x.fillStyle = '#0D0E12'; x.fillRect(x0, 0, 880, 990); x.font = sans(40, 800); x.letterSpacing = '6px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#5A5E68'; x.fillText('CAMERA OFF', x0 + 440, 470); }
    else {
      x.save(); x.beginPath(); x.rect(x0, 0, 880, 990); x.clip();
      if (o.dx) { const gr = x.createLinearGradient(x0, 0, x0, 990); gr.addColorStop(0, L.bg[0]); gr.addColorStop(1, L.bg[1]); x.fillStyle = gr; x.fillRect(x0, 0, 880, 990); x.translate(o.dx, 0); }
      webcam(x, x0, 0, 880, 990, o.who, o.e || 'focus', t + k * 1.37, { bg: L.bg, zoom: 1.12 * (o.zoom || 1), cy: 0.47, shake: o.shake || 0 });  // the offset: they would blink together
      x.restore();
      if (o.off > 0) { x.fillStyle = `rgba(13,14,18,${o.off})`; x.fillRect(x0, 0, 880, 990); }
    }
    x.fillStyle = 'rgba(8,8,14,0.88)'; x.fillRect(x0, 990 - 92, 880, 92);
    x.font = sans(48, 900); x.letterSpacing = '5px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = L.nameColor; x.fillText(L.name, x0 + 442, 990 - 43);
  });
  x.fillStyle = '#0B0B10'; x.fillRect(875, 0, 10, 990);
  return SPLIT;
}
// the two halves of the screen in the world (their centres), for cameras and for stamps laid over them
const CAMPOS = { left: [MON.c[0] - MON.hw / 2, MON.c[1], MON.c[2]], right: [MON.c[0] + MON.hw / 2, MON.c[1], MON.c[2]] };
const OFF_T = tex(64, 36, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#16171D'); gr.addColorStop(1, '#0A0A0E'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
function monitorSet(g, img) {
  const { c, hw, hh } = MON;
  ab(g, [c[0] - 0.4, FLOOR_Y, c[2] + 0.12], [c[0] + 0.4, c[1] - hh, c[2] + 0.5], '#17171D');
  ab(g, [c[0] - 2.4, FLOOR_Y, c[2] - 0.6], [c[0] + 2.4, FLOOR_Y + 0.16, c[2] + 1.2], '#17171D');
  ab(g, [c[0] - hw - 0.17, c[1] - hh - 0.17, c[2]], [c[0] + hw + 0.17, c[1] + hh + 0.17, c[2] + 0.3], '#0B0B10', { spec: 0.4 });
  if (B.E[2] < c[2]) texQuad(g, img || OFF_T, [c[0] - hw, c[1] + hh, c[2] - 0.02], [c[0] + hw, c[1] + hh, c[2] - 0.02], [c[0] - hw, c[1] - hh, c[2] - 0.02]);
}
// the online game: no players at the table; the monitor behind it shows the two webcams, or a picture of our own (screen)
function online(g, t, { pieces, under = null, over = null, cams = {}, clock = null, screen = null, flip = 1, mon = true, focus = null, dof, dim = 0, slab = true, farSky = SKY_T } = {}) {
  dayRoom(g, t, { flip, farSky });
  if (mon && B.E[2] < MON.c[2] - 0.6) monitorSet(g, screen || splitTex(cams, t));
  tableSet(g, t, { pieces, under, over, clock, wPlayer: false, bPlayer: false, wChair: false, bChair: false, tableCol: WOODT, focus, dof, slab });
  if (mon) pool(g, B, 4, -0.33, 8.7, 4.5, '#BFD8FF', 0.07);
  lowKey(g, { cy: H * 0.46, a: 0.04 + dim });
}

const nearFade = (pieces, d0 = 3.9, w = 0.3) => pieces.map(p => { const a = clamp((depth(p.x, 0.6, p.z) - d0) / w); return a >= 1 ? p : { ...p, alpha: (p.alpha ?? 1) * a }; }).filter(p => (p.alpha ?? 1) > 0.02);
const BOOKS = (() => { const r = rng(77), out = []; for (let sh = 0; sh < 4; sh++) { let z = 0.15; while (z < 6.6) { const wd = 0.22 + r() * 0.3, hh = 1.1 + r() * 0.5, lean = r() < 0.12; out.push([sh, z, wd, hh, ['#B8553F', '#C9A24B', '#5E87A8', '#6E9A6A', '#8B6FA0', '#DDD6C6', '#C07A45', '#3F5873'][Math.floor(r() * 8)], lean]); z += wd + (r() < 0.1 ? 0.5 : 0.03); } } return out; })();
function bookcase(g) {
  const x = ROOM.x0, z0 = 5.6, z1 = 12.6, y0 = FLOOR_Y;
  if (B.E[0] < x + 1.4) return;
  ab(g, [x, y0, z0 - 0.2], [x + 1.3, y0 + 8.9, z1 + 0.2], '#8A6440');
  ab(g, [x + 1.24, y0 + 0.3, z0], [x + 1.3, y0 + 8.7, z1], '#5E4226');  // the dark inside
  for (let sh = 0; sh < 4; sh++) {
    const ys = y0 + 0.3 + sh * 2.1;
    for (const [s2, z, wd, hh, col] of BOOKS) { if (s2 !== sh) continue; quad(g, [[x + 1.32, ys + hh, z0 + z], [x + 1.32, ys + hh, z0 + z + wd], [x + 1.32, ys, z0 + z + wd], [x + 1.32, ys, z0 + z]], col); }
    ab(g, [x, ys - 0.12, z0 - 0.1], [x + 1.4, ys, z1 + 0.1], '#A87E52');
  }
}
function wallPrint(g) {  // against the right wall, by the far corner: a sideboard with a cup and a plant, a framed knight over it
  const x = ROOM.x1, z0 = 6.4, z1 = 12.4, top = FLOOR_Y + 3.3;
  if (B.E[0] > x - 2) return;
  ab(g, [x - 0.14, 2.3, 7.7], [x, 6.3, 11.1], '#2A2A30');
  texQuad(g, PRINT_T, [x - 0.16, 6.1, 10.9], [x - 0.16, 6.1, 7.9], [x - 0.16, 2.5, 10.9]);
  ab(g, [x - 1.5, FLOOR_Y, z0], [x, top, z1], '#A87E52');
  ab(g, [x - 1.56, FLOOR_Y + 0.5, z0 + 0.2], [x - 1.5, top - 0.3, (z0 + z1) / 2 - 0.1], '#8A6440'); ab(g, [x - 1.56, FLOOR_Y + 0.5, (z0 + z1) / 2 + 0.1], [x - 1.5, top - 0.3, z1 - 0.2], '#8A6440');  // two doors
  ab(g, [x - 1.6, top, z0 - 0.1], [x, top + 0.14, z1 + 0.1], '#C99A68');
  // a gold cup
  lathe(g, x - 0.75, 7.4, [[top + 0.14, 0.34, 0.34], [top + 0.26, 0.34, 0.34], [top + 0.3, 0.1, 0.1], [top + 0.62, 0.1, 0.1], [top + 0.7, 0.3, 0.3], [top + 1.25, 0.46, 0.46]], '#E2B044', { n: 18, spec: 0.5 });
  // a plant in a pot
  lathe(g, x - 0.8, 11.5, [[top + 0.14, 0.3, 0.3], [top + 0.66, 0.4, 0.4]], '#D9D2C4', { n: 14 });
  if (depth(x - 0.8, top + 1.2, 11.5) > 1) { const q = B.project(x - 0.8, top + 0.66, 11.5), u = q.s; g.save(); g.translate(q.x, q.y); for (const [a, l, c] of [[-0.9, 1.3, '#4E9A4A'], [-0.4, 1.7, '#5FAE56'], [0.05, 1.9, '#4E9A4A'], [0.5, 1.6, '#6DBB62'], [0.95, 1.2, '#4E9A4A']]) { g.save(); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(0.26 * u, -l * u * 0.5, 0, -l * u); g.quadraticCurveTo(-0.26 * u, -l * u * 0.5, 0, 0); g.fill(); g.restore(); } g.restore(); }
}
const PRINT_T = tex(360, 460, (x, w, h) => {
  x.fillStyle = '#F6EFE2'; x.fillRect(0, 0, w, h); x.fillStyle = '#2E6FB8'; x.fillRect(22, 22, w - 44, h - 44);
  drawPiece(x, 'n', 'w', w / 2, h * 0.84, 300);
});



// ======================= SMALL HELPERS OF THIS VIDEO =======================
const fmt = n => Math.round(n).toLocaleString('en-US');
const tick = (t, t0, d, N, e = ease.out) => N * e(clamp((t - t0) / d));
const hash2 = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
// a plate laid over a point of the world (projected), for labels that belong to a thing in the scene
function plate3(g, text, p, o = {}) { const q = B.project(...p); if (q.z < 0.4) return; plate(g, text, q.x, q.y, o); }
// a soft shadow on a horizontal surface at height y: an ellipse of radii rx, rz round (x, z)
function shadow3(g, x, y, z, rx, rz, a = 0.22) {
  const pts = [...Array(18)].map((_, i) => { const u = i / 18 * 6.2832; return [x + Math.cos(u) * rx, y, z + Math.sin(u) * rz]; });
  if (B.poly(g, pts)) { g.fillStyle = `rgba(20,24,18,${a})`; g.fill(); }
}

// ======================= THE GIANT CHESSBOARD FLOOR (the four traps) =======================
// An open-air studio: a pale sky and a chessboard floor of big green and cream squares running to the horizon, fading
// into the haze. The traps, the crowd of players, the hundred games, the wall of webcams, the door of the Fair Play team
// and the jar of refunded points all stand on it.
const AR = { n: 30, s: 3.2 };
function arena(g, t, { dim = 0 } = {}) {
  const hy = hz();
  const gr = g.createLinearGradient(0, hy - 1400, 0, hy + 4);
  gr.addColorStop(0, '#7FC0EA'); gr.addColorStop(0.7, '#CFEAF6'); gr.addColorStop(1, '#F2FAF4');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (hy < H) { g.fillStyle = '#E3EEDC'; g.fillRect(0, Math.max(0, hy), W, H); }
  const half = AR.n * AR.s / 2, E = B.E;
  for (let i = 0; i < AR.n; i++) for (let j = 0; j < AR.n; j++) {
    const x0 = -half + i * AR.s, z0 = -half + j * AR.s + 10, x1 = x0 + AR.s, z1 = z0 + AR.s;
    const d = Math.hypot((x0 + x1) / 2 - E[0], (z0 + z1) / 2 - E[2]), haze = clamp((d - 30) / 70);
    const col = mix((i + j) % 2 ? '#EEEED2' : '#769656', '#E3EEDC', haze * 0.9);
    quad(g, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], col);
  }
  // a haze band on the horizon and a pool of light in the middle of the floor
  if (hy > -40 && hy < H + 40) { const hb = g.createLinearGradient(0, hy - 60, 0, hy + 90); hb.addColorStop(0, 'rgba(242,250,244,0)'); hb.addColorStop(0.45, 'rgba(242,250,244,0.9)'); hb.addColorStop(1, 'rgba(242,250,244,0)'); g.fillStyle = hb; g.fillRect(0, hy - 60, W, 150); }
  pool(g, B, 0, 0.01, 10, 16, '#FFFFFF', 0.1);
  if (dim > 0) { g.fillStyle = `rgba(10,14,12,${dim})`; g.fillRect(0, 0, W, H); }
}

// ---------- a bear trap on the floor at (x, z): a base plate, two springs, two toothed jaws that snap up and shut ----------
// u: 0 open (the jaws lie flat, a ring of teeth) .. 1 shut (both jaws upright, teeth locked)
const STEEL = '#9BA3AD', STEEL_D = '#5E656E';
function trap(g, x, z, u, { r = 2.1, a = 1 } = {}) {
  g.save(); g.globalAlpha *= a;
  shadow3(g, x, 0.01, z, r * 1.25, r * 0.9, 0.2);
  ab(g, [x - r - 0.9, 0, z - 0.16], [x + r + 0.9, 0.14, z + 0.16], STEEL_D, { amb: 0.6 });  // the spring bar
  for (const sd of [-1, 1]) cylinder(g, [x + sd * (r + 0.55), 0.16, z - 0.34], [x + sd * (r + 0.55), 0.16, z + 0.34], 0.2, '#6E757E', { n: 10 });
  cylinder(g, [x, 0, z], [x, 0.16, z], 0.62, '#4E545C', { n: 18, amb: 0.6 });  // the plate
  const th = clamp(u) * Math.PI / 2 * 0.98;
  // the far jaw first
  const jaws = [-1, 1].map(s => ({ s, d: depth(x, 0.16 + r * 0.5 * Math.sin(th), z + s * r * 0.5 * Math.cos(th)) })).sort((p, q) => q.d - p.d);
  for (const { s } of jaws) {
    const P = phi => [x + r * Math.cos(phi), 0.16 + r * Math.sin(phi) * Math.sin(th), z + s * r * Math.sin(phi) * Math.cos(th)];
    const pts = [...Array(25)].map((_, i) => B.project(...P(i / 24 * Math.PI)));
    if (pts.some(p => p.z < 0.4)) continue;
    const near = depth(...P(Math.PI / 2)) < depth(x, 0.16, z);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // the teeth: spikes from the jaw toward its hinge
    g.fillStyle = near ? '#C9D0D8' : '#9AA2AB';
    for (let k = 1; k < 10; k++) {
      const ph = k / 10 * Math.PI, base = P(ph), tip = [x + r * 0.62 * Math.cos(ph), 0.16 + r * 0.62 * Math.sin(ph) * Math.sin(th), z + s * r * 0.62 * Math.sin(ph) * Math.cos(th)];
      const a1 = B.project(...P(ph - 0.09)), a2 = B.project(...P(ph + 0.09)), tp = B.project(...tip);
      g.beginPath(); g.moveTo(a1.x, a1.y); g.lineTo(tp.x, tp.y); g.lineTo(a2.x, a2.y); g.closePath(); g.fill();
    }
    g.strokeStyle = near ? '#2C3036' : '#25282D'; g.lineWidth = Math.max(4, 0.4 * pts[12].s);
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.strokeStyle = near ? '#C2C9D1' : STEEL; g.lineWidth = Math.max(3, 0.27 * pts[12].s);
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
  }
  g.restore();
}
const TRAPS = [[0, 5], [0, 10.5], [0, 16], [0, 21.5]];
const snapU = (t, t0) => t < t0 ? 0 : Math.min(1, ease.back(clamp((t - t0) / 0.13)));
// the row of four trap icons on the screen: the traps sprung so far are shut and red
function trapRow(g, n, t, t0, { y = 405, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < 4; i++) {
    const x = W / 2 + (i - 1.5) * 118, shut = i < n, now = i === n - 1, k = now ? 1 + 0.35 * Math.max(0, 1 - (t - t0) / 0.25) : 1;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = shut ? RED : 'rgba(18,20,24,0.78)'; g.beginPath(); g.roundRect(-48, -48, 96, 96, 22); g.fill();
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 7; g.lineCap = 'round';
    if (shut) { g.beginPath(); g.arc(0, 8, 26, Math.PI, 0); g.stroke(); for (let j = -2; j <= 2; j++) { g.beginPath(); g.moveTo(j * 10, -18); g.lineTo(j * 10, 4); g.stroke(); } }
    else { g.beginPath(); g.arc(0, 0, 28, 0, 7); g.stroke(); for (let j = 0; j < 8; j++) { const q = j / 8 * 6.283; g.beginPath(); g.moveTo(Math.cos(q) * 28, Math.sin(q) * 28); g.lineTo(Math.cos(q) * 16, Math.sin(q) * 16); g.stroke(); } }
    g.restore();
  }
  g.restore();
  qaRect(g, W / 2 - 240, y - 50, 480, 100, 'text', 'traps');
}

// ---------- the crowd of players at your rating: pawns on the floor; now and then one finds the best move (a green !) ----------
const CROWD = (() => { const r = rng(12), out = []; for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) out.push({ x: (i - 4) * 2.5 + (r() - 0.5) * 0.7, z: 8 + j * 2.7 + (r() - 0.5) * 0.7, c: r() < 0.5 ? 'w' : 'b', ph: r() * 9, you: i === 4 && j === 1 }); return out; })();
const YOU_P = CROWD.find(p => p.you);
function bang(g, x, y, s, col = LIME, a = 1) {  // a found-the-best-move marker: a green disc with a white "!"
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#FFFFFF'; g.font = sans(36, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 0, 2);
  g.restore();
}
function crowd(g, t, { you = 0, dim = 0, rate = 1 } = {}) {
  const list = CROWD.map(p => ({ p, q: B.project(p.x, 0, p.z) })).filter(o => o.q.z > 0.6).sort((a, b) => b.q.z - a.q.z);
  if (you > 0) spotCone(g, B, { top: [YOU_P.x, 16, YOU_P.z], base: [YOU_P.x, 0, YOU_P.z], r0: 0.4, r1: 2.0, color: '#FFF4D2', a: 0.3 * you, dust: 30, t });
  for (const { p, q } of list) {
    const h = 2.4 * q.s, isYou = p.you && you > 0, a = isYou ? 1 : 1 - dim;
    shadow3(g, p.x, 0.01, p.z, 0.7, 0.55, 0.18 * a);
    drawPiece(g, 'p', isYou ? 'b' : p.c, q.x, q.y, h, { alpha: a, glow: isYou ? '#7CFC9A' : null });
    // the "!" pops: rarely over everyone, every half second over "you"
    const slot = Math.floor((t + p.ph) * 2.2), on = isYou ? ((t * 2.6) % 1) < 0.62 : hash2(slot, Math.round(p.ph * 100)) < 0.07 * rate;
    if (on) bang(g, q.x, q.y - h * 1.05, clamp(q.s * 0.055, 0.35, 0.85), LIME, a);
  }
}

// ---------- not even Magnus: Magnus beside an engine (a server tower with green lights) ----------
// Magnus on a big screen on a stand (a bust needs something in front of it; a screen holds him), beside the engine
const MAGTV = makeCanvas(880, 990);
function magScreen(g, t, x, z, e) {
  const c = MAGTV.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
  webcam(c, 0, 0, 880, 990, 'magnus', e, t, { bg: ['#B9A27E', '#4A3A28'], zoom: 1.08, cy: 0.47 });
  c.fillStyle = 'rgba(8,8,14,0.88)'; c.fillRect(0, 990 - 92, 880, 92); c.font = sans(48, 900); c.letterSpacing = '5px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFE2B0'; c.fillText('MAGNUS CARLSEN', 442, 990 - 43);
  const hw = 2.3, hh = 2.6, cy = 4.6;
  shadow3(g, x, 0.01, z, 1.6, 1.0, 0.2);
  ab(g, [x - 0.25, 0, z + 0.1], [x + 0.25, cy - hh, z + 0.5], '#17171D'); ab(g, [x - 1.3, 0, z - 0.4], [x + 1.3, 0.14, z + 0.9], '#17171D');
  ab(g, [x - hw - 0.15, cy - hh - 0.15, z], [x + hw + 0.15, cy + hh + 0.15, z + 0.3], '#0B0B10', { spec: 0.4 });
  texQuad(g, MAGTV, [x - hw, cy + hh, z - 0.02], [x + hw, cy + hh, z - 0.02], [x - hw, cy - hh, z - 0.02]);
  const a = B.project(x - 1.1, cy + 2.0, z), b = B.project(x + 1.1, cy - 0.2, z); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, 'face', 'magnus'); g.restore();
}
function engineTower(g, t, x, z, { a = 1 } = {}) {
  g.save(); g.globalAlpha *= a;
  shadow3(g, x, 0.01, z, 2.0, 1.4, 0.22);
  ab(g, [x - 1.4, 0, z - 1.0], [x + 1.4, 6.2, z + 1.0], '#22262E', { spec: 0.3 });
  for (let r = 0; r < 9; r++) for (let c = 0; c < 4; c++) {
    const y = 0.6 + r * 0.6, xx = x - 1.0 + c * 0.66, on = hash2(Math.floor(t * 6) + r, c) < 0.55;
    ab(g, [xx - 0.16, y, z - 1.03], [xx + 0.16, y + 0.2, z - 1.0], on ? '#7CFC9A' : '#2E5E44', { amb: 1 });
  }
  g.restore();
}

// ---------- a hundred games: little boards on the floor, each with one red dot on the same square ----------
const MINI = tex(256, 256, (x, w, h) => {
  x.fillStyle = '#15151C'; x.fillRect(0, 0, w, h);
  const s = (w - 16) / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; x.fillRect(8 + i * s, 8 + j * s, s, s); }
  const r = rng(3); x.fillStyle = 'rgba(30,30,36,0.85)'; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc(8 + (Math.floor(r() * 8) + 0.5) * s, 8 + (Math.floor(r() * 8) + 0.5) * s, s * 0.28, 0, 7); x.fill(); }
});
const GAMES = { n: 10, s: 2.0, gap: 0.55, z0: 8 };
const gamePos = k => { const i = k % 10, j = Math.floor(k / 10), step = GAMES.s + GAMES.gap; return [(i - 4.5) * step, GAMES.z0 + j * step]; };
const DOT = [5.5 / 8, 1.5 / 8];  // the red square of every game, from the board's left and far edges
function games(g, t, { lit = 0, link = 0, glow = 0, only = -1 } = {}) {
  const half = GAMES.s / 2, order = [...Array(100).keys()].sort((a, b) => depth(...[gamePos(b)[0], 0, gamePos(b)[1]]) - depth(...[gamePos(a)[0], 0, gamePos(a)[1]]));
  for (const k of order) { const [cx, cz] = gamePos(k); shadow3(g, cx, 0.005, cz, half * 1.1, half * 1.1, 0.12); texQuad(g, MINI, [cx - half, 0.04, cz + half], [cx + half, 0.04, cz + half], [cx - half, 0.04, cz - half]); }
  const dotAt = k => { const [cx, cz] = gamePos(k); return [cx - half + DOT[0] * GAMES.s, 0.06, cz + half - DOT[1] * GAMES.s]; };
  if (link > 0) {  // the pattern: the dots joined row by row and column by column
    g.save(); g.strokeStyle = rgba(RED, 0.85); g.lineCap = 'round';
    for (let j = 0; j < 10; j++) for (let i = 0; i < 9; i++) {
      const u = clamp(link * 12 - (i + j) * 0.55); if (u <= 0) continue;
      for (const [a, b] of [[j * 10 + i, j * 10 + i + 1], [i * 10 + j, (i + 1) * 10 + j]]) { const A = dotAt(a), Q = dotAt(b), M = A.map((v, n) => v + (Q[n] - v) * u); const qa = B.project(...A); g.lineWidth = Math.max(2, qa.s * 0.07); g.beginPath(); line3(g, A, M); g.stroke(); }
    }
    g.restore();
  }
  for (let k = 0; k < 100; k++) {
    if (only >= 0 ? k !== only || lit <= 0 : k >= lit * 100) continue;
    const q = B.project(...dotAt(k)); if (q.z < 0.4) continue;
    const r = Math.max(3, q.s * 0.17) * (1 + glow * 0.3);
    g.fillStyle = rgba(RED, 0.35); g.beginPath(); g.arc(q.x, q.y, r * 2.2, 0, 7); g.fill();
    g.fillStyle = RED; g.beginPath(); g.arc(q.x, q.y, r, 0, 7); g.fill();
  }
}

// ---------- your opponents: a wall of webcams; one by one they press REPORT ----------
const OPPS = ['opp', 'opp2', 'opp3', 'opp4', 'opp5', 'opp6', 'opp3', 'opp', 'opp2'];
const OPP_BG = [['#6FA07E', '#24402E'], ['#C98E6A', '#4A2A1C'], ['#6A8EC9', '#1C2A4A'], ['#A07AC0', '#3A2450'], ['#5FB0A8', '#1E403C'], ['#9A9AA2', '#33333A']];
const CAMS9 = OPPS.map(() => makeCanvas(480, 360));
const WALL = { z: 22, w: 7.2, h: 5.4, gap: 0.5, y0: 1.2 };
const camAt = k => { const i = k % 3, j = Math.floor(k / 3); return [(i - 1) * (WALL.w + WALL.gap), WALL.y0 + (2 - j) * (WALL.h + WALL.gap) + WALL.h / 2, WALL.z]; };
function camWall(g, t, t0, { step = 0.16 } = {}) {
  for (let k = 0; k < 9; k++) {
    const c = CAMS9[k], x = c.getContext('2d'), rep = t >= t0 + k * step, e = rep ? { ...EXPR.angry, look: [0, 0.2] } : { ...EXPR.focus, look: [0, 0.4] };
    x.setTransform(1, 0, 0, 1, 0, 0);
    webcam(x, 0, 0, 480, 360, OPPS[k], e, t + k * 0.9, { bg: OPP_BG[k % 6], zoom: 1.1, cy: 0.5 });
    if (rep) { x.strokeStyle = RED; x.lineWidth = 16; x.strokeRect(8, 8, 464, 344); }
    const [cx, cy, cz] = camAt(k), hw = WALL.w / 2, hh = WALL.h / 2;
    ab(g, [cx - hw - 0.15, cy - hh - 0.15, cz], [cx + hw + 0.15, cy + hh + 0.15, cz + 0.3], '#14161B');
    texQuad(g, c, [cx - hw, cy + hh, cz - 0.02], [cx + hw, cy + hh, cz - 0.02], [cx - hw, cy - hh, cz - 0.02]);
  }
  // the REPORT flags pop on each camera
  for (let k = 0; k < 9; k++) { const t1 = t0 + k * step; if (t < t1) continue; const [cx, cy, cz] = camAt(k), q = B.project(cx + WALL.w * 0.28, cy - WALL.h * 0.3, cz - 0.1); if (q.z < 0.5) continue;
    plate(g, 'REPORT', q.x, q.y, { color: RED, size: Math.max(14, q.s * 0.55), scale: lerp(1.5, 1, ease.back(clamp((t - t1) / 0.2))), rot: -0.05, qa: false }); }
}
// paper planes (the reports) flying from the wall to the counter at the top of the screen
function reportsFly(g, t, t0, { n = 26, to = [W / 2, 330] } = {}) {
  const r = rng(9);
  for (let i = 0; i < n; i++) {
    const t1 = t0 + i * 0.09 + r() * 0.05, u = (t - t1) / 0.7, sx = 80 + r() * (W - 160), sy = 700 + r() * 500;
    if (u < 0 || u > 1) continue;
    const e = ease.inOut(u), x = lerp(sx, to[0], e) + Math.sin(u * 7 + i) * 30, y = lerp(sy, to[1], e) - Math.sin(u * Math.PI) * 160, s = lerp(1.1, 0.4, e);
    g.save(); g.translate(x, y); g.rotate(-0.6 + Math.sin(u * 6 + i) * 0.3); g.scale(s, s);
    g.fillStyle = '#FFFFFF'; g.strokeStyle = '#2A2D33'; g.lineWidth = 3; g.beginPath(); g.moveTo(-34, 6); g.lineTo(36, -2); g.lineTo(-20, 22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#DDE3EA'; g.beginPath(); g.moveTo(-34, 6); g.lineTo(36, -2); g.lineTo(-8, -18); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
}

// ---------- the Fair Play team ("FBI, open up"): a door on the floor bursts, pawns in vests storm out; behind, a wall
// of accounts that get CLOSED stamps in a wave ----------
const ACC_T = [0, 1, 2, 3, 4, 5].map(k => tex(300, 200, (x, w, h) => {
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = ['#3D5A8C', '#C9643E', '#3F7A5A', '#7A4E8E', '#2F7F7A', '#5A5A62'][k]; x.fillRect(0, 0, w, 54);
  x.fillStyle = '#E8E2D6'; x.beginPath(); x.arc(64, 118, 40, 0, 7); x.fill(); x.fillStyle = ['#2A211C', '#8A5A34', '#1E1612', '#C9A070', '#6E3A22', '#8E8A84'][k]; x.beginPath(); x.arc(64, 106, 26, Math.PI, 0); x.fill();
  x.fillStyle = '#C9CED6'; x.fillRect(122, 92, 140, 16); x.fillRect(122, 122, 100, 12); x.fillRect(122, 146, 120, 12);
  x.strokeStyle = '#2A2D33'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
}));
const ACC = { cols: 9, rows: 5, w: 3.0, h: 2.0, gap: 0.35, z: 26, y0: 0.8 };
const accAt = k => { const i = k % ACC.cols, j = Math.floor(k / ACC.cols), sx = ACC.w + ACC.gap, sy = ACC.h + ACC.gap; return [(i - (ACC.cols - 1) / 2) * sx, ACC.y0 + (ACC.rows - 1 - j) * sy + ACC.h / 2, ACC.z]; };
function accounts(g, t, t0, { wave = 1.1 } = {}) {
  const N = ACC.cols * ACC.rows;
  for (let k = 0; k < N; k++) { const [cx, cy, cz] = accAt(k), hw = ACC.w / 2, hh = ACC.h / 2; texQuad(g, ACC_T[(k * 7) % 6], [cx - hw, cy + hh, cz], [cx + hw, cy + hh, cz], [cx - hw, cy - hh, cz]); }
  for (let k = 0; k < N; k++) {
    const [cx, cy, cz] = accAt(k), t1 = t0 + (k % ACC.cols) / ACC.cols * wave + Math.floor(k / ACC.cols) * 0.04; if (t < t1) continue;
    const q = B.project(cx, cy, cz - 0.05); if (q.z < 0.5) continue;
    const u = clamp((t - t1) / 0.14), s = lerp(2, 1, ease.out(u));
    g.save(); g.translate(q.x, q.y); g.rotate(-0.2); g.scale(s, s); g.globalAlpha *= clamp(u * 1.6) * 0.92;
    const fs = Math.max(10, q.s * 0.5); g.font = sans(fs, 900); g.letterSpacing = '2px'; const w = g.measureText('CLOSED').width + fs * 0.6, hh = fs * 1.25;
    g.strokeStyle = RED; g.lineWidth = Math.max(2, fs * 0.12); g.beginPath(); g.roundRect(-w / 2, -hh / 2, w, hh, fs * 0.15); g.stroke();
    g.fillStyle = RED; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CLOSED', 0, 1);
    g.restore();
  }
}
const DOOR = { x: 0, z: 12, w: 3.4, h: 6.4 };
function door(g, t, t0) {
  const { x, z, w, h } = DOOR, fall = t < t0 ? 0 : ease.in(clamp((t - t0) / 0.32)), shake = t < t0 && t > t0 - 0.5 ? Math.sin(t * 90) * 0.04 * (1 - (t0 - t) / 0.5) : 0;
  shadow3(g, x, 0.01, z, w * 0.8, 1.0, 0.2);
  ab(g, [x - w / 2 - 0.4, 0, z - 0.3], [x - w / 2, h + 0.4, z + 0.3], '#6E4A2E');
  ab(g, [x + w / 2, 0, z - 0.3], [x + w / 2 + 0.4, h + 0.4, z + 0.3], '#6E4A2E');
  ab(g, [x - w / 2 - 0.4, h, z - 0.3], [x + w / 2 + 0.4, h + 0.4, z + 0.3], '#6E4A2E');
  // the panel: hinged at its foot, it falls flat toward the camera
  const ang = -fall * Math.PI / 2 * 0.97;
  obox(g, [x + shake, h / 2, z], [w / 2, h / 2, 0.14], '#B5834F', { rx: ang }, { pivot: [x, 0, z - 0.14] });
  if (fall < 0.6) { const kn = B.project(x + w * 0.32, h * 0.48, z - 0.2 - Math.sin(-ang) * h * 0.48); if (kn.z > 0.5) { g.fillStyle = '#E2B04A'; g.beginPath(); g.arc(kn.x, kn.y, Math.max(3, kn.s * 0.16), 0, 7); g.fill(); } }
}
// the agents: dark pawns in yellow vests running out of the door toward the camera
const AGENTS = [[0, 0], [-1.8, 0.5], [1.8, 0.5], [-3.4, 1.2], [3.4, 1.2]];
function agents(g, t, t0, { stop = 5.5 } = {}) {
  if (t < t0) return;
  const list = AGENTS.map(([dx, lag], i) => { const u = clamp((t - t0 - lag * 0.18) / 1.1), zz = lerp(DOOR.z + 0.5, DOOR.z - stop + lag * 1.2, ease.out(u)), bob = Math.abs(Math.sin((t - t0) * 14 + i)) * 0.25 * (1 - u); return { x: DOOR.x + dx * ease.out(u), z: zz, y: bob, u }; })
    .filter(a => a.u > 0).map(a => ({ ...a, q: B.project(a.x, a.y, a.z) })).filter(a => a.q.z > 0.6).sort((a, b) => b.q.z - a.q.z);
  for (const a of list) {
    const h = 3.0 * a.q.s;
    shadow3(g, a.x, 0.01, a.z, 0.8, 0.6, 0.22);
    drawPiece(g, 'p', 'b', a.q.x, a.q.y, h);
    const vy = a.q.y - h * 0.36, vw = h * 0.42;
    g.fillStyle = '#F2C230'; g.beginPath(); g.roundRect(a.q.x - vw / 2, vy - h * 0.08, vw, h * 0.16, h * 0.03); g.fill();
    g.fillStyle = '#16161E'; g.font = sans(Math.max(8, h * 0.075), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FAIR PLAY', a.q.x, vy + 1);
  }
}

// ---------- the refunded points: a glass jar on the floor filling with gold "+1" coins ----------
const JAR = { x: 0, z: 12, r: 3.4, h: 7.4 };
function jar(g, t, level, t0) {
  const { x, z, r, h } = JAR, rings = [[0, r, r], [h * 0.82, r, r], [h * 0.92, r * 0.78, r * 0.78], [h, r * 0.8, r * 0.8]];
  shadow3(g, x, 0.01, z, r * 1.25, r * 1.0, 0.24);
  const lv = clamp(level) * h * 0.8;
  if (lv > 0.05) {
    cylinder(g, [x, 0.05, z], [x, lv, z], r * 0.94, '#E9B654', { n: 30, amb: 0.7 });
    const top = [...Array(30)].map((_, i) => { const u = i / 30 * 6.283; return [x + Math.cos(u) * r * 0.94, lv + 0.01, z + Math.sin(u) * r * 0.94]; });
    if (B.poly(g, top)) { g.fillStyle = '#F7D774'; g.fill(); }
    // the coins on the surface
    const rr = rng(4); g.fillStyle = '#C9922E';
    for (let i = 0; i < 26; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * r * 0.85, q = B.project(x + Math.cos(a) * d, lv + 0.05, z + Math.sin(a) * d); if (q.z < 0.5) continue; g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.36, q.s * 0.14, 0, 0, 7); g.fill(); }
  }
  lathe(g, x, z, rings, '#DDF2FF', { n: 36, a: 0.22, amb: 0.9, spec: 0.6 });
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(2, B.project(x, h, z).s * 0.09);
  for (const [yy, rr] of [[h, r * 0.8], [0.05, r]]) { const ring = [...Array(36)].map((_, i) => { const u = i / 36 * 6.283; return [x + Math.cos(u) * rr, yy, z + Math.sin(u) * rr]; }); if (B.poly(g, ring)) g.stroke(); }
  for (const sd of [-1, 1]) { const R = [B.E[2] - z, 0, x - B.E[0]], L = Math.hypot(R[0], R[2]) || 1, ox = sd * r * R[0] / L, oz = sd * r * R[2] / L; g.beginPath(); line3(g, [x + ox, 0.05, z + oz], [x + ox, h * 0.82, z + oz]); g.stroke(); }
  g.restore();
  // a highlight down the glass
  const p0 = B.project(x - r * 0.62, h * 0.75, z - r * 0.78), p1 = B.project(x - r * 0.62, h * 0.12, z - r * 0.78);
  if (p0.z > 0.5) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(3, p0.s * 0.22); g.lineCap = 'round'; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); }
}
function coinsFall(g, t, t0, t1) {  // "+1" coins falling into the mouth of the jar
  const r = rng(21);
  for (let i = 0; i < 60; i++) {
    const s0 = t0 + r() * (t1 - t0), u = (t - s0) / 0.6, dx = (r() - 0.5) * JAR.r * 1.2, dz = (r() - 0.5) * JAR.r * 0.8;
    if (u < 0 || u > 1) continue;
    const y = lerp(JAR.h + 9, JAR.h * 0.4, ease.in(u)), q = B.project(JAR.x + dx, y, JAR.z + dz); if (q.z < 0.5) continue;
    const s = Math.max(8, q.s * 0.55);
    g.save(); g.translate(q.x, q.y); g.rotate(Math.sin(u * 9 + i) * 0.4);
    g.fillStyle = '#F5C451'; g.strokeStyle = '#9A6A1A'; g.lineWidth = s * 0.12; g.beginPath(); g.arc(0, 0, s, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#7A4E12'; g.font = sans(s * 0.95, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+1', 0, s * 0.05);
    g.restore();
  }
}

// ======================= THE ROOM'S SCREENS AND WINDOW =======================
// the report of 4 October 2022: a stack of 72 pages on the table (the cover is ours: what it is, about whom, when)
const REPORT_T = tex(620, 800, (x, w, h) => {
  x.fillStyle = '#FBF8F1'; x.fillRect(0, 0, w, h); x.fillStyle = '#5D8C3E'; x.fillRect(0, 0, w, 150);
  x.fillStyle = '#FFFFFF'; x.font = sans(50, 900); x.letterSpacing = '6px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('FAIR PLAY', w / 2, 58); x.fillText('REPORT', w / 2, 112);
  x.fillStyle = '#1E2026'; x.font = sans(64, 900); x.letterSpacing = '2px'; x.fillText('HANS', w / 2, 300); x.fillText('NIEMANN', w / 2, 372);
  x.fillStyle = '#5A5E68'; x.font = sans(34, 800); x.letterSpacing = '6px'; x.fillText('OCTOBER 2022', w / 2, 452);
  x.fillStyle = '#C9CED6'; for (let i = 0; i < 6; i++) x.fillRect(90, 520 + i * 34, i % 3 === 2 ? 300 : 440, 12);
  x.fillStyle = '#1E2026'; x.font = sans(40, 900); x.fillText('72 PAGES', w / 2, 748);
});
const PAGE_T = tex(620, 800, (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#C9CED6'; for (let i = 0; i < 18; i++) x.fillRect(70, 70 + i * 38, i % 4 === 3 ? 280 : 480, 12); x.strokeStyle = '#7A8A96'; x.lineWidth = 3; x.beginPath(); x.moveTo(90, 760); for (let i = 0; i < 9; i++) x.lineTo(90 + i * 55, 720 - Math.sin(i * 1.3) * 30 - i * 6); x.stroke(); });
const REP = { x: 4, z: 2.6, w: 3.1, d: 4.0, th: 0.62 };
function report(g, t, t0, { flip = 0 } = {}) {
  const { x, z, w, d, th } = REP, u = clamp((t - t0) / 0.32), y0 = -0.35 + (1 - ease.in(u)) * 7, rot = (1 - u) * 0.5;
  if (u > 0) shadow3(g, x, -0.34, z, w * 0.62 * (0.6 + 0.4 * u), d * 0.6 * (0.6 + 0.4 * u), 0.25 * u);
  const P = (px, py, pz) => { const c = Math.cos(rot), s = Math.sin(rot), dx = px - x, dz = pz - z; return [x + dx * c - dz * s, py, z + dx * s + dz * c]; };
  ab(g, P(x - w / 2, y0, z - d / 2), P(x + w / 2, y0 + th, z + d / 2), '#F4F1EA', { amb: 0.75 });
  const yt = y0 + th + 0.01;
  texQuad(g, REPORT_T, P(x - w / 2, yt, z + d / 2), P(x + w / 2, yt, z + d / 2), P(x - w / 2, yt, z - d / 2));
  // pages lifting from the spine (the left edge) and turning over
  if (flip > 0) for (let k = 0; k < 3; k++) {
    const v = clamp(flip * 3 - k); if (v <= 0 || v >= 1) continue;
    const a = v * Math.PI, ex = x - w / 2 + Math.cos(a) * w, ey = yt + 0.02 + Math.sin(a) * w;
    texQuad(g, PAGE_T, [x - w / 2, yt + 0.02, z + d / 2], [ex, ey, z + d / 2], [x - w / 2, yt + 0.02, z - d / 2]);
  }
}
// the browser on the monitor: a game, a tab bar; the cursor clicks to another tab; then the toggling chart
const BROW = makeCanvas(1760, 990);
function browser(t, { away = 0, chart = 0, cursor = null } = {}) {
  const x = BROW.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#2B2D33'; x.fillRect(0, 0, 1760, 990);
  x.fillStyle = '#1C1D22'; x.fillRect(0, 0, 1760, 96);
  [['♟  PLAY', 30], ['+  NEW TAB', 400]].forEach(([s, x0], i) => {
    const act = (i === 1) === (away > 0.5);
    x.fillStyle = act ? '#2B2D33' : '#25262C'; x.beginPath(); x.roundRect(x0, 22, 340, 74, [16, 16, 0, 0]); x.fill();
    x.fillStyle = act ? '#FFFFFF' : '#8A8E98'; x.font = sans(36, 800); x.letterSpacing = '2px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(s, x0 + 36, 60);
  });
  if (away > 0.5) {
    x.fillStyle = '#E9ECF1'; x.fillRect(0, 96, 1760, 894); x.fillStyle = '#B8BEC8'; x.font = sans(300, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 880, 560);
  } else {
    const s = 96, bx = 120, by = 140;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; x.fillRect(bx + i * s, by + j * s, s, s); }
    const r = rng(8); x.fillStyle = '#1E2026'; for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(bx + (Math.floor(r() * 8) + 0.5) * s, by + (Math.floor(r() * 8) + 0.5) * s, 30, 0, 7); x.fill(); }
    x.fillStyle = '#FFFFFF'; for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(bx + (Math.floor(r() * 8) + 0.5) * s, by + (Math.floor(r() * 8) + 0.5) * s, 30, 0, 7); x.fill(); }
    x.fillStyle = '#3A3D45'; x.fillRect(1000, 140, 640, 768); x.fillStyle = '#FFFFFF'; x.font = sans(52, 900); x.textAlign = 'left'; x.fillText('YOUR MOVE', 1050, 220);
    x.fillStyle = '#E8413A'; x.font = sans(110, 900); x.fillText('0:09', 1050, 360);
  }
  if (chart > 0) {  // two bars, no figures: how well he played when he stayed, and when he clicked away
    const u = ease.out(clamp(chart));
    x.fillStyle = 'rgba(14,15,19,0.94)'; x.beginPath(); x.roundRect(380, 120, 1000, 700, 30); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = sans(54, 900); x.letterSpacing = '4px'; x.textAlign = 'center'; x.fillText('HOW WELL HE PLAYED', 880, 210);
    [['STAYED', 0.3, '#8A8E98', 690], ['CLICKED AWAY', 0.9, '#7CFC9A', 1070]].forEach(([lab, v, col, cx]) => {
      const hh = 420 * v * u; x.fillStyle = col; x.fillRect(cx - 120, 700 - hh, 240, hh);
      x.fillStyle = '#FFFFFF'; x.font = sans(40, 900); x.letterSpacing = '3px'; x.fillText(lab, cx, 762);
    });
  }
  if (cursor) { const [cx, cy] = cursor; x.save(); x.translate(cx, cy); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#000000'; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 64); x.lineTo(16, 50); x.lineTo(28, 76); x.lineTo(38, 71); x.lineTo(26, 46); x.lineTo(46, 46); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  return BROW;
}
// the profile on the monitor: the honest opponent, his rating, the refund note sliding in
const PROF = makeCanvas(1760, 990);
function profile(t, { rating = 1186, note = 0, plus = 14 } = {}) {
  const x = PROF.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#2B2D33'; x.fillRect(0, 0, 1760, 990);
  webcam(x, 90, 110, 620, 700, 'opp', note > 0.5 ? { ...EXPR.happy, lid: 0.08 } : { ...EXPR.focus }, t, { bg: ['#6FA07E', '#24402E'], zoom: 1.0, cy: 0.5 });
  x.fillStyle = '#FFFFFF'; x.font = sans(60, 900); x.letterSpacing = '3px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('YOU', 790, 200);
  x.fillStyle = '#8A8E98'; x.font = sans(40, 800); x.letterSpacing = '6px'; x.fillText('RATING', 790, 320);
  x.fillStyle = note > 0.5 ? '#7CFC9A' : '#FFFFFF'; x.font = sans(230, 900); x.letterSpacing = '0px'; x.fillText(String(Math.round(rating)), 780, 470);
  if (note > 0) {
    const u = ease.back(clamp(note)), nx = lerp(1800, 760, u);
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(nx, 640, 900, 220, 28); x.fill();
    x.fillStyle = '#5D8C3E'; x.beginPath(); x.roundRect(nx, 640, 30, 220, [28, 0, 0, 28]); x.fill();
    x.fillStyle = '#1E2026'; x.font = sans(48, 900); x.letterSpacing = '2px'; x.fillText('FAIR PLAY REFUND', nx + 70, 712);
    x.fillStyle = '#3D9A4A'; x.font = sans(84, 900); x.fillText(`+${plus} POINTS`, nx + 70, 800);
  }
  return PROF;
}
// the eye in the far window: the sky darkens and a huge eye opens outside (u: 0 shut .. 1 open); the window's frame stays
const EYE = makeCanvas(1200, 880);
function eyeTex(u, t, look = 0) {
  const x = EYE.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  const w = 1200, h = 880, gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, mix('#3F9FE6', '#0E1424', clamp(u * 1.4))); gr.addColorStop(1, mix('#BFE7FF', '#1C1430', clamp(u * 1.4)));
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  if (u > 0) {
    const cx = w / 2, cy = h * 0.48, rx = 470, ry = 250 * clamp(u), lx = look * 60;
    x.save(); x.beginPath(); x.ellipse(cx, cy, rx, Math.max(1, ry), 0, 0, 7); x.clip();
    x.fillStyle = '#F4F1EA'; x.fillRect(0, 0, w, h);
    const ir = x.createRadialGradient(cx + lx, cy, 20, cx + lx, cy, 210); ir.addColorStop(0, '#C6F59A'); ir.addColorStop(0.55, '#5D9C3E'); ir.addColorStop(1, '#2A4A1C');
    x.fillStyle = ir; x.beginPath(); x.arc(cx + lx, cy, 210, 0, 7); x.fill();
    // the pupil: a pawn
    x.fillStyle = '#0A0C0A'; x.save(); x.translate(cx + lx, cy + 10);
    x.beginPath(); x.arc(0, -70, 38, 0, 7); x.fill(); x.beginPath(); x.moveTo(-26, -40); x.quadraticCurveTo(-20, 10, -58, 70); x.lineTo(58, 70); x.quadraticCurveTo(20, 10, 26, -40); x.closePath(); x.fill(); x.fillRect(-70, 62, 140, 24);
    x.restore();
    x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.arc(cx + lx - 70, cy - 80, 26, 0, 7); x.fill();
    x.restore();
    x.strokeStyle = '#0A0C10'; x.lineWidth = 18; x.beginPath(); x.ellipse(cx, cy, rx, Math.max(1, ry), 0, 0, 7); x.stroke();
    const glow = x.createRadialGradient(cx, cy, rx * 0.6, cx, cy, rx * 1.3); glow.addColorStop(0, 'rgba(124,252,154,0)'); glow.addColorStop(1, `rgba(124,252,154,${0.25 * u})`); x.fillStyle = glow; x.fillRect(0, 0, w, h);
  }
  x.strokeStyle = '#FBF6EC'; x.lineWidth = 30; x.strokeRect(0, 0, w, h); x.lineWidth = 16; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h * 0.46); x.lineTo(w, h * 0.46); x.stroke();
  return EYE;
}

// the faces in the webcams of the monitor, logged on the film for the layout check and for the watermark (guard.js)
function monFaces(g, cams) {
  for (const side of ['left', 'right']) {
    const o = cams[side]; if (!o || o.off >= 1) continue;
    const c = CAMPOS[side], a = B.project(c[0] - 0.95 + (o.dx || 0) * 0.005, c[1] + 1.25, c[2] - 0.05), b = B.project(c[0] + 0.95 + (o.dx || 0) * 0.005, c[1] - 0.45, c[2] - 0.05);
    if (a.z < 0.5) continue;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, 'face', o.who); g.restore();
  }
}
// the whole room with the monitor, the cameras on it, and its faces logged
function room(g, t, o = {}) { online(g, t, o); if (!o.screen && o.cams && o.mon !== false) monFaces(g, o.cams); }
// Magnus at the board in the daylight room, facing us (the author on the Mittens video, 15.11.2026: «с самого первого
// кадра красивый кадр и сразу все понятно»): one big face, the window and the sky behind him, the board in front
function magAtBoard(g, t, { pieces, e = 'focus', under = null, over = null } = {}) {
  dayRoom(g, t, {});
  tableSet(g, t, { pieces, under, over, wPlayer: false, wChair: false, bPlayer: true, black: 'magnus', eb: e, tableCol: WOODT });
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}
// his camera goes off: the picture squeezes to a line and goes black (off: 0..1)
function camOff(g, off) {
  if (off <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const u = ease.in(clamp(off * 1.25)), lh = lerp(H, 3, u);
  g.fillStyle = '#08090C'; g.fillRect(0, 0, W, H / 2 - lh / 2); g.fillRect(0, H / 2 + lh / 2, W, H / 2 - lh / 2 + 1);
  if (off < 1) { g.fillStyle = `rgba(255,255,255,${0.6 * u * (1 - off)})`; g.fillRect(0, H / 2 - lh / 2, W, lh); }
  if (off >= 0.8) { g.fillStyle = `rgba(8,9,12,${clamp((off - 0.8) / 0.2)})`; g.fillRect(0, 0, W, H); }
  g.restore();
}
// grey for a flashback: the frame keeps its light, loses its colour
function grey(g, a = 1) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'saturation'; g.globalAlpha = a; g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); g.restore(); }

// ======================= THE FILM =======================
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
  const popW = (t, t0) => ({ scale: lerp(1.2, 1, ease.back(clamp((t - t0) / 0.25))) });
  const runTo = (plies, k0, lands, t, d = SLIDE) => {
    let i = -1; while (i + 1 < lands.length && t >= lands[i + 1] - d) i++;
    if (i < 0) return { k: k0, pieces: piecesAt(plies, k0), m: null, lt: 0 };
    const a = lands[i] - d, k = k0 + i + 1;
    return { k, pieces: piecesAt(plies, k, slide(t - a, d), SLIDE_OPTS), m: moveOf(plies, k), lt: t - a };
  };
  const moveFx = (r, d = SLIDE, hold = 0.5, label = true) => ({
    under: g => { if (r.m) moveUnder(g, B, r.m, r.lt, { dur: d, hold }); },
    over: g => { if (r.m) moveOver(g, B, r.m, r.lt, { dur: d, hold, label }); },
  });
  const EX = { calm: { ...EXPR.focus }, cold: { ...EXPR.focus, lid: 0.42, curve: 0.25 }, think: { ...EXPR.focus, look: [0.6, 0.5] }, sly: { ...EXPR.paranoid, look: [-1, 0.2], sweat: 0 },
    down: { ...EXPR.focus, look: [0, 0.75], lid: 0.35 }, shock: { ...EXPR.shock, lid: 0 }, happy: { ...EXPR.happy, lid: 0.08 }, smug: { ...EXPR.smug, lid: 0.3 }, sweat: { ...EXPR.focus, sweat: 1, look: [0, 0.5] } };

  // the cuts, in order (a shot runs to the next one)
  const carlT = w('hook', 1), resT = w('hook', 2), aftA = w('hook', 3) - 0.06, moveT = w('hook', 5);
  const repA = s('report') - 0.06, slamT = w('report', 0) + 0.1, hisA = w('report', 3) - 0.06, oppT = w('report', 4), likA = w('report', 5) - 0.06, chT = w('report', 6), hunT = w('report', 10);
  const clueA = s('clue') - 0.06, betT = w('clue', 4), clickT = w('clue', 7);
  const baitA = s('bait') - 0.06, cantT = w('bait', 2), leaveT = w('bait', 5), canA = w('bait', 6) - 0.06, canT = w('bait', 6);
  const t1A = s('trap1') - 0.06, oneT = w('trap1', 2), threeT = w('trap1', 5);
  const twoA = s('two') - 0.06, twoT = w('two', 0), playT = w('two', 5), bestT = w('two', 11), notA = w('two', 13) - 0.06, magT = w('two', 15), engT = w('two', 19);
  const standA = s('stand') - 0.06, moreT = w('stand', 2), outT = w('stand', 6);
  const thrA = s('three') - 0.06, thrT = w('three', 0), engMT = w('three', 2), overA = w('three', 6) - 0.06, hundT = w('three', 8), patT = w('three', 12);
  const fourA = s('four') - 0.06, fourT = w('four', 0), oppsT = w('four', 1), milT = w('four', 7);
  const closA = T.e('four') + 0.08, numT = w('closed', 1), clT = w('closed', 3), pctA = w('closed', 4) - 0.06, pctT = w('closed', 4), algT = w('closed', 7);
  const BURST = s('closed') - 0.02;  // the door gives way on "Almost", after the pause with "FAIR PLAY! OPEN UP!"
  const twA = s('twist') - 0.06, ptsT = w('twist', 2), cheT = w('twist', 4), givT = w('twist', 9), backT = w('twist', 11);
  const refA = s('refund') - 0.06, milRT = w('refund', 1), monthT = w('refund', 5);
  const nevA = s('never') - 0.06, nev2A = w('never', 5) - 0.06, neverT = w('never', 6);
  const stayA = s('stay') - 0.06, stayT = w('stay', 5);
  const ctaA = s('cta') - 0.06, manyT = w('cta', 1);

  // ======================= HOOK (rules 1, 28, 42, 57): the online game, both faces; Magnus plays one move and resigns =======================
  const ROOMK = [K(0.0, 0.17, 13.1, [4, 3.2, 9.6]), K(0.0, 0.15, 12.4, [4, 3.25, 9.7])];
  const hookCams = (eM, off = 0) => ({ left: { who: 'hans', e: EX.calm }, right: { who: 'magnus', e: eM, off } });
  const LANDS = [0.42, carlT + 0.12];
  // the first frame (rule 28, the Mittens frame): Magnus at the board, "1 MOVE" over his head
  const MAGB = [K(0.0, 0.1, 8.6, [4, 2.95, 8.7]), K(0.0, 0.09, 7.9, [4, 3.0, 8.8])], MAGC = [K(0.04, 0.08, 7.4, [4, 3.05, 9.0]), K(0.02, 0.07, 6.3, [4, 3.1, 9.1])];
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, MAGB[0]], [len(sh), MAGB[1]]], { t, e: lin, bump: t > resT && t < resT + 0.3 ? 1 : 0 });
    const r = runTo(NC, 0, LANDS, t);
    magAtBoard(g, t, { pieces: r.pieces, e: t >= resT ? EX.cold : EX.think, ...moveFx(r, SLIDE, 0.5, false) });
  }, { kb: 0, hud: (g, lt, t) => {
    counter(g, '1', 'MOVE', { y: 330, size: 190, color: GOLD });
    if (t >= resT) stamp(g, 'RESIGNED', W / 2, 1540, t, resT, { color: RED, size: 76, rot: -0.12 });
  } });
  // closer; on "move." his camera goes off
  shot(aftA, (g, lt, t, sh) => {
    rig(B, lt, [[0, MAGC[0]], [len(sh), MAGC[1]]], { t, e: glide });
    magAtBoard(g, t, { pieces: piecesAt(NC, 2), e: EX.cold });
    camOff(g, clamp((t - moveT - 0.05) / 0.3));
  }, { kb: 0, qaAllow: ['text over face'], hud: (g, lt, t) => {  // the face under the badge is already under black
    if (t < moveT + 0.2) stamp(g, 'RESIGNED', W / 2, 1540, t, aftA - 1, { color: RED, size: 76, rot: -0.12 });
    if (t >= moveT + 0.37) badge(g, 'CAMERA OFF', W / 2, H / 2, { color: '#2A2D33', size: 56, ...pop(t, moveT + 0.37) });
  } });
  cue(0, 'whoosh_soft', 0.25); cue(LANDS[0] - MOVE_HIT, 'move', 0.6); cue(LANDS[1] - MOVE_HIT, 'move', 0.6); cue(resT, 'stamp', 0.55); cue(resT, 'hit', 0.35);
  cue(aftA, 'whoosh_fast', 0.25); cue(moveT + 0.05, 'tvoff', 0.7);

  // ======================= "CHESS.COM LATER SAID...": the report lands on the table =======================
  const REPK = [K(0.42, 0.92, 11.5, [4, -0.1, 2.8]), K(0.32, 0.98, 10.0, [4, -0.1, 2.7])];
  const repCams = { left: { who: 'hans', e: EX.calm }, right: { who: 'magnus', e: EX.cold, off: 1 } };
  shot(repA, (g, lt, t, sh) => {
    rig(B, lt, [[0, REPK[0]], [len(sh), REPK[1]]], { t, e: glide, bump: t > slamT + 0.3 && t < slamT + 0.6 ? 1.2 : 0 });
    room(g, t, { pieces: null, slab: false, mon: false, cams: repCams, over: g2 => report(g2, t, slamT) });
    if (t > slamT + 0.32) { const q = B.project(REP.x, -0.3, REP.z); dust(g, q.x, q.y, t, slamT + 0.32, { n: 12, color: '#E8DCC6', spread: 260 }); }
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= slamT + 0.36) badge(g, '72 PAGES', W / 2, 240, { color: GOLD, size: 60, ...pop(t, slamT + 0.36) }); } });
  const COVK = [K(0.12, 1.05, 7.4, [4, -0.1, 2.7]), K(0.06, 1.12, 6.2, [4, -0.1, 2.7])];
  shot(hisA, (g, lt, t, sh) => {
    rig(B, lt, [[0, COVK[0]], [len(sh), COVK[1]]], { t, e: glide });
    room(g, t, { pieces: null, slab: false, mon: false, cams: repCams, over: g2 => report(g2, t, -9, { flip: (t - hisA) / 1.1 }) });
  }, { kb: 0.02, hud: (g, lt, t) => { if (t >= oppT - 0.1) nameTitle(g, t - oppT + 0.1, 'HANS NIEMANN', 'HIS OPPONENT', { y: 250 }); } });
  shot(likA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 1.12, 6.4, [4, -0.1, 2.7])], [len(sh), K(-0.05, 1.02, 8.4, [4, -0.1, 2.8])]], { t, e: glide, bump: t > chT && t < chT + 0.3 ? 1 : 0 });
    room(g, t, { pieces: null, slab: false, mon: false, cams: repCams, over: g2 => report(g2, t, -9) });
  }, { kb: 0, hud: (g, lt, t) => {
    if (t < hunT - 0.08) nameTitle(g, t - oppT + 0.1, 'HANS NIEMANN', 'HIS OPPONENT', { y: 250 });
    if (t >= chT) { const q = B.project(REP.x, -0.35 + REP.th, REP.z - 0.55); stamp(g, 'LIKELY CHEATED', q.x, q.y, t, chT, { color: RED, size: 58, rot: -0.12, sub: 'CHESS.COM REPORT' }); }
    if (t >= hunT) counter(g, '100+', 'ONLINE GAMES', { y: 330, size: 170, color: GOLD, at: [hunT, 0.22] });
  } });
  cue(repA - 0.04, 'whoosh_fast', 0.3); cue(slamT + 0.3, 'thud', 0.9); cue(slamT + 0.3, 'boom_move', 0.5); cue(slamT + 0.38, 'sparkle_pop', 0.3);
  cue(hisA + 0.05, 'page_flip', 0.5); cue(hisA + 0.45, 'page_flip', 0.45); cue(chT, 'stamp', 0.6); cue(hunT, 'hit', 0.4);

  // ======================= "ONE CLUE": the tab he clicked away to =======================
  const MONK = [K(0.0, 0.07, 11.4, [4, 3.3, 10.6]), K(0.0, 0.06, 9.6, [4, 3.3, 10.6])];
  shot(clueA, (g, lt, t, sh) => {
    rig(B, lt, [[0, MONK[0]], [len(sh), MONK[1]]], { t, e: glide });
    const cu = clamp((t - (clickT - 0.55)) / 0.5), cur = t > clickT - 0.6 ? [lerp(1260, 560, ease.inOut(cu)), lerp(760, 58, ease.inOut(cu))] : null;
    room(g, t, { pieces: piecesAt(NC, 2), screen: browser(t, { away: t >= clickT ? 1 : 0, chart: (t - betT) / 0.55, cursor: cur }) });
  }, { kb: 0, noJump: false, hud: (g, lt, t) => {
    badge(g, 'ONE CLUE', W / 2, 240, { color: GOLD, size: 62, ...pop(t, clueA + 0.08) });
  } });
  cue(clueA - 0.04, 'whoosh_soft', 0.3); cue(betT, 'riser', 0.25); cue(clickT, 'swipe_card', 0.5);

  // ======================= EDIT-BAIT: "Your opponent can't see you leave. Chess.com can." =======================
  // you leave your own camera; your opponent keeps looking at the board. Music out. Then the eye in the window
  const youCams = (t, dx = 0, eY = EX.sly) => ({ left: { who: 'you', look: 'you', e: eY, dx }, right: { who: 'opp', look: 'opp', e: EX.down } });
  shot(baitA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.08, 9.0, [4, 3.3, 10.6])], [len(sh), K(0.0, 0.07, 8.2, [4, 3.3, 10.6])]], { t, e: glide });
    const dx = -760 * ease.in(clamp((t - (leaveT - 0.15)) / 0.32));
    room(g, t, { pieces: piecesAt(NC, 2), cams: youCams(t, dx) });
  }, { kb: 0, qaAllow: ['face cut by frame'], hud: (g, lt, t) => { if (t >= cantT) badge(g, "THEY CAN'T SEE YOU", W / 2, 240, { color: '#16161E', size: 56, ...popW(t, cantT) }); } });
  shot(canA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, -0.04, 18.5, [4, 7.0, 13.4])], [len(sh), K(0.0, -0.05, 15.8, [4, 7.0, 13.4])]], { t, e: glide, bump: t > canT && t < canT + 0.45 ? 1.3 : 0 });
    const u = ease.out(clamp((t - canT) / 0.35));
    room(g, t, { pieces: piecesAt(NC, 2), mon: false, farSky: eyeTex(u, t, Math.sin((t - canT) * 3) * 0.5), dim: 0.25 * u });
    g.save(); g.fillStyle = `rgba(6,10,16,${0.35 * u})`; g.fillRect(0, 0, W, H); g.restore();
  }, { trans: 'whip', vig: 0.65, hud: (g, lt, t) => { if (t >= canT + 0.08) badge(g, 'CHESS.COM CAN.', W / 2, 240, { color: '#7CFC9A', size: 64, ...popW(t, canT + 0.08) }); } });
  cue(baitA - 0.04, 'whoosh_soft', 0.25); cue(leaveT - 0.1, 'whoosh_fast', 0.35); cue(canT, 'boom_big', 0.6); cue(canT + 0.05, 'heartbeat', 0.5); cue(canT + 0.4, 'dun_dun', 0.35);

  // ======================= TRAP 1 OF 4: the row of traps on the giant board; the first one snaps =======================
  shot(t1A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.62, 0.36, 15, [0, 0.8, 10])], [len(sh), K(-0.48, 0.32, 13, [0, 0.8, 9.5])]], { t, e: glide, bump: t > oneT && t < oneT + 0.3 ? 1 : 0 });
    arena(g, t);
    TRAPS.map((p, i) => ({ p, i, d: depth(p[0], 0, p[1]) })).sort((a, b) => b.d - a.d).forEach(({ p, i }) => trap(g, p[0], p[1], i === 0 ? snapU(t, oneT) : 0));
    if (t > oneT) { const q = B.project(TRAPS[0][0], 0.4, TRAPS[0][1]); shockwave(g, q.x, q.y, t, oneT, { r1: 260, color: '#FFFFFF', lw: 8 }); }
    if (t > threeT) TRAPS.slice(1).forEach(([x, z], i) => { const q = B.project(x, 0.8, z); burst(g, q.x, q.y, t, threeT + i * 0.12, { n: 8, color: '#FFF6C8', speed: 300, life: 0.4, size: 4, gravity: 300 }); });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t >= oneT) { badge(g, 'TRAP 1', W / 2, 240, { color: RED, size: 64, ...pop(t, oneT) }); trapRow(g, 1, t, oneT); }
  } });
  cue(t1A - 0.1, 'whoosh_deep', 0.35); cue(oneT, 'hit_punch', 0.8); cue(oneT, 'stamp', 0.4); cue(threeT, 'shimmer', 0.35);

  // ======================= TRAP 2: players at your rating; not even Magnus plays like an engine; you stand out =======================
  shot(twoA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 0.55, 30, [0, 0, 15])], [len(sh), K(-0.06, 0.45, 25, [0, 0, 14])]], { t, e: glide });
    arena(g, t); crowd(g, t);
  }, { trans: 'whip', noJump: false, hud: (g, lt, t) => {
    if (t < twoT + 1.1) { badge(g, 'TRAP 2', W / 2, 240, { color: RED, size: 64, ...pop(t, twoT) }); trapRow(g, 2, t, twoT); }
    else badge(g, 'PLAYERS AT YOUR RATING', W / 2, 240, { color: '#16161E', size: 50, ...popW(t, twoT + 1.1) });
  } });
  shot(notA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.1, 17, [0, 3.6, 12])], [len(sh), K(0.06, 0.09, 15.5, [0, 3.6, 12])]], { t, e: glide });
    arena(g, t); engineTower(g, t, 4.2, 13); magScreen(g, t, -3.9, 13, t >= engT ? EX.smug : EX.think);
  }, { kb: 0, hud: (g, lt, t) => {
    badge(g, 'NOT EVEN MAGNUS', W / 2, 240, { color: GOLD, size: 58, ...popW(t, magT) });
    if (t >= engT) plate3(g, 'ENGINE', [3.6, 6.9, 12.6], { color: '#7CFC9A', size: 42, ...pop(t, engT) });
  } });
  shot(standA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.08, 0.4, 19, [YOU_P.x, 1, YOU_P.z])], [len(sh), K(0.02, 0.3, 11.5, [YOU_P.x, 1.2, YOU_P.z])]], { t, e: glide });
    arena(g, t); crowd(g, t, { you: clamp((t - moreT + 0.2) / 0.3), dim: 0.65 * clamp((t - outT + 0.1) / 0.3), rate: 0.25 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= moreT) plate3(g, 'YOU', [YOU_P.x, 4.4, YOU_P.z], { color: GOLD, size: 40, ...pop(t, moreT) });
    if (t >= outT) stamp(g, 'STANDS OUT', W / 2, 380, t, outT, { color: RED, size: 74, rot: -0.1 });
  } });
  cue(twoA - 0.08, 'whoosh_fast', 0.3); cue(twoT, 'hit_punch', 0.7); cue(twoT, 'stamp', 0.35); cue(bestT, 'sparkle_pop', 0.3);
  cue(notA - 0.04, 'whoosh_soft', 0.3); cue(magT, 'hit', 0.35); cue(engT, 'error', 0.3);
  cue(standA - 0.05, 'whoosh_fast', 0.3); cue(moreT, 'riser', 0.3); cue(outT, 'stamp', 0.6);

  // ======================= TRAP 3: one engine move per game; a hundred games make a pattern =======================
  shot(thrA, (g, lt, t, sh) => {
    const [cx, cz] = gamePos(44);
    rig(B, lt, [[0, K(0.1, 1.28, 4.6, [cx, 0, cz])], [len(sh), K(0.04, 1.36, 3.7, [cx, 0, cz])]], { t, e: glide });
    arena(g, t); games(g, t, { lit: t >= engMT ? 1 : 0, only: 44 });
    if (t >= engMT) { const q = B.project(cx - 1 + DOT[0] * 2, 0.06, cz + 1 - DOT[1] * 2); shockwave(g, q.x, q.y, t, engMT, { r1: 200, color: RED, lw: 7 }); }
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < thrT + 1.0) { badge(g, 'TRAP 3', W / 2, 240, { color: RED, size: 64, ...pop(t, thrT) }); trapRow(g, 3, t, thrT); }
    else counter(g, '1', 'ENGINE MOVE PER GAME', { y: 330, size: 170, color: RED, at: [thrT + 1.0, 0.22] });
  } });
  shot(overA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 1.2, 26, [0, 0, 19.5])], [len(sh), K(0.0, 1.38, 40, [0, 0, 19.5])]], { t, e: glide });
    arena(g, t); games(g, t, { lit: clamp((t - overA) / 1.3), link: clamp((t - patT + 0.1) / 0.5), glow: t >= patT ? 1 : 0 });
  }, { kb: 0, hud: (g, lt, t) => {
    counter(g, String(Math.min(100, Math.max(1, Math.round(clamp((t - overA) / 1.3) * 100)))), 'GAMES', { y: 330, size: 170, color: GOLD });
    if (t >= patT) stamp(g, 'PATTERN', W / 2, 860, t, patT, { color: RED, size: 110, rot: -0.12 });
  } });
  cue(thrA - 0.08, 'whoosh_fast', 0.3); cue(thrT, 'hit_punch', 0.7); cue(thrT, 'stamp', 0.35); cue(engMT, 'error', 0.35);
  cue(overA - 0.04, 'whoosh_deep', 0.3); cue(overA + 0.1, 'riser', 0.35); cue(patT, 'stamp', 0.7); cue(patT, 'boom_move', 0.5);

  // ======================= TRAP 4: your opponents' reports =======================
  shot(fourA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.07, 38, [0, 9.5, 22])], [len(sh), K(0.03, 0.06, 33, [0, 9.6, 22])]], { t, e: glide });
    arena(g, t); camWall(g, t, oppsT + 0.2);
    for (let k = 0; k < 9; k++) { const [cx, cy, cz] = camAt(k), a = B.project(cx - 1.4, cy + 1.6, cz), b = B.project(cx + 1.4, cy - 1.0, cz); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, 'face', OPPS[k]); }
  }, { trans: 'whip', qaAllow: ['text over face'], hud: (g, lt, t) => {
    if (t < fourT + 1.0) { badge(g, 'TRAP 4', W / 2, 240, { color: RED, size: 64, ...pop(t, fourT) }); trapRow(g, 4, t, fourT); }
    else badge(g, 'YOUR OPPONENTS', W / 2, 240, { color: '#16161E', size: 58, ...popW(t, fourT + 1.0) });
  } });
  shot(milT - 0.35, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.22, -0.02, 25, [0, 12.4, 22])], [len(sh), K(-0.28, -0.03, 22, [0, 12.5, 22])]], { t, e: glide });
    arena(g, t); camWall(g, t, oppsT + 0.2);
    for (let k = 0; k < 9; k++) { const [cx, cy, cz] = camAt(k), a = B.project(cx - 1.4, cy + 1.6, cz), b = B.project(cx + 1.4, cy - 1.0, cz); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, 'face', OPPS[k]); }
    reportsFly(g, t, milT - 0.4);
  }, { kb: 0, qaAllow: ['text over face', 'face cut by frame'], hud: (g, lt, t) => {
    counter(g, fmt(tick(t, milT - 0.3, 1.0, 1415111)), 'REPORTS · OCTOBER 2026', { y: 330, size: 150, color: '#FFFFFF' });
  } });
  cue(fourA - 0.08, 'whoosh_fast', 0.3); cue(fourT, 'hit_punch', 0.7); cue(fourT, 'stamp', 0.35);
  for (let k = 0; k < 9; k++) cue(oppsT + 0.2 + k * 0.16, 'swipe_card', 0.14);
  cue(milT - 0.3, 'riser', 0.3); cue(milT + 0.7, 'hit', 0.4);

  // ======================= "FAIR PLAY! OPEN UP!": the door bursts; the accounts get CLOSED; 97 % by the algorithm =======================
  const DK = [K(0.0, 0.12, 19, [0, 3.8, 13.5])], DK2 = K(0.02, 0.1, 15.5, [0, 4.0, 14.5]);
  shot(closA, (g, lt, t, sh) => {
    rig(B, lt, [[0, DK[0]], [BURST - closA, DK[0]], [len(sh), DK2, ease.out]], { t, bump: t > BURST && t < BURST + 0.45 ? 1.4 : 0 });
    arena(g, t); accounts(g, t, clT - 0.15); door(g, t, BURST); agents(g, t, BURST + 0.12);
    if (t > BURST + 0.3) { const q = B.project(0, 0.2, DOOR.z - DOOR.h * 0.6); dust(g, q.x, q.y, t, BURST + 0.3, { n: 14, color: '#E8E0D0', spread: 360 }); }
  }, { kb: 0, hud: (g, lt, t) => {
    if (t < BURST) { const q = B.project(0, DOOR.h + 1.4, DOOR.z); bubble(g, 'FAIR PLAY! OPEN UP!', q.x, q.y, { size: 56, scale: lerp(1.25, 1, ease.back(clamp((t - closA) / 0.2))) }); }
    if (t >= numT) counter(g, fmt(tick(t, numT, 1.1, 281992)), 'ACCOUNTS CLOSED · OCTOBER', { y: 330, size: 150, color: '#FFFFFF' });
  } });
  shot(pctA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.18, 0.12, 15, [0, 4.6, 22])], [len(sh), K(0.1, 0.1, 13, [0, 4.8, 22])]], { t, e: glide });
    arena(g, t); accounts(g, t, -9);
    // the algorithm: big gears turning in front of the wall; the agents only stand and watch
    [[-3.2, 6.2, 1.6, 2.6, 14, '#5D8C3E'], [1.4, 5.0, 1.3, 2.0, 11, '#7CFC9A'], [4.6, 7.4, 1.2, 1.5, 9, '#4E7A3A']].forEach(([gx, gy, gz, r, n, col], i) =>
      gear(g, B, gx, gy, ACC.z - 2 - gz, r, { teeth: n, angle: (i % 2 ? -1 : 1) * (t - pctA) * (1.6 + i * 0.3), color: col, hub: '#1E2A18' }));
    agents(g, t, -9);
  }, { trans: 'whip', noJump: false, hud: (g, lt, t) => {
    counter(g, '97%', 'AUTOMATICALLY', { y: 330, size: 170, color: '#7CFC9A', at: [pctT, 0.22] });
    if (t >= algT) badge(g, 'BY THE ALGORITHM', W / 2, 500, { color: '#16161E', size: 50, ...popW(t, algT) });
  } });
  cue(closA, 'footsteps', 0.4); cue(BURST - 0.02, 'door_slam', 0.9); cue(BURST, 'boom_big', 0.65); cue(clT - 0.15, 'stamp', 0.45);
  for (let k = 1; k < 5; k++) cue(clT - 0.15 + k * 0.22, 'stamp', 0.25);
  cue(pctA - 0.04, 'whoosh_fast', 0.3); cue(pctT, 'hit', 0.4); cue(algT, 'clock_tick', 0.4);

  // ======================= TWIST (silence first): the points a cheater took from you come back =======================
  const quiet = T.e('closed') + 0.05;
  shot(twA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.07, 11.2, [4, 3.3, 10.6])], [len(sh), K(0.0, 0.06, 9.4, [4, 3.3, 10.6])]], { t, e: glide });
    const down = tick(t, cheT, 0.5, 14), up = tick(t, givT + 0.1, 0.7, 14);
    room(g, t, { pieces: piecesAt(NC, 2), screen: profile(t, { rating: 1200 - down + up, note: (t - givT + 0.05) / 0.35 }) });
    { const a = B.project(MON.c[0] - MON.hw + 0.25, MON.c[1] + 1.95, MON.c[2]), b = B.project(MON.c[0] - MON.hw + 2.7, MON.c[1] + 0.2, MON.c[2]); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, 'face', 'opp'); }
  }, { kb: 0, noJump: false, hud: (g, lt, t) => {
    if (t >= cheT && t < givT) badge(g, '-14 TO A CHEATER', W / 2, 240, { color: RED, size: 54, ...popW(t, cheT) });
    if (t >= givT) badge(g, 'GIVEN BACK', W / 2, 240, { color: '#7CFC9A', size: 60, ...popW(t, givT) });
  } });
  cue(cheT, 'error', 0.35); cue(givT, 'notify', 0.6); cue(givT + 0.3, 'coins', 0.45); cue(backT, 'success', 0.4);

  // ======================= 69 million points, in one month: the jar =======================
  shot(refA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.32, 0.26, 24, [0, 4, 12])], [len(sh), K(0.16, 0.22, 18.5, [0, 4.6, 12])]], { t, e: glide });
    arena(g, t); jar(g, t, lerp(0.15, 0.95, ease.out(clamp((t - refA) / (nevA - refA)))), refA); coinsFall(g, t, refA, nevA);
  }, { trans: 'whip', noJump: false, hud: (g, lt, t) => {
    counter(g, fmt(tick(t, refA + 0.05, 1.5, 69617149)), 'POINTS GIVEN BACK · OCTOBER', { y: 330, size: 140, color: GOLD });
  } });
  cue(refA - 0.06, 'whoosh_deep', 0.3); cue(refA + 0.1, 'coins', 0.55); cue(milRT, 'cash', 0.45); cue(monthT, 'coins', 0.35);

  // ======================= THE LOOP: Magnus resigned after one move; Chess.com never resigns =======================
  shot(nevA, (g, lt, t, sh) => {
    rig(B, lt, [[0, MAGC[0]], [len(sh), MAGC[1]]], { t, e: glide });
    magAtBoard(g, t, { pieces: piecesAt(NC, 2), e: EX.cold });
    grey(g, 0.85); camOff(g, clamp((t - w('never', 4) - 0.05) / 0.3));
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < w('never', 4) + 0.2) stamp(g, 'RESIGNED', W / 2, 1540, t, nevA - 1, { color: '#B9B9B9', size: 76, rot: -0.12 });
  } });
  shot(nev2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, -0.05, 16.5, [4, 7.0, 13.4])], [len(sh), K(0.0, -0.05, 14.8, [4, 7.0, 13.4])]], { t, e: glide, bump: t > neverT && t < neverT + 0.4 ? 1.2 : 0 });
    room(g, t, { pieces: piecesAt(NC, 2), mon: false, farSky: eyeTex(1, t, Math.sin(t * 2) * 0.6), dim: 0.25 });
    g.save(); g.fillStyle = 'rgba(6,10,16,0.35)'; g.fillRect(0, 0, W, H); g.restore();
  }, { trans: 'whip', vig: 0.65, hud: (g, lt, t) => { if (t >= neverT) stamp(g, 'NEVER RESIGNS', W / 2, 330, t, neverT, { color: '#7CFC9A', size: 84, rot: -0.1 }); } });
  cue(nevA - 0.04, 'record_scratch', 0.35); cue(w('never', 4) + 0.05, 'tvoff', 0.5); cue(nev2A - 0.04, 'whoosh_fast', 0.3); cue(neverT, 'boom_big', 0.55); cue(neverT, 'stamp', 0.5);

  // ======================= "SO NEXT TIME YOU'RE LOSING, STAY ON THE BOARD" =======================
  shot(stayA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.08, 8.6, [4, 3.3, 10.6])], [len(sh), K(0.0, 0.07, 8.0, [4, 3.3, 10.6])]], { t, e: glide });
    room(g, t, { pieces: piecesAt(NC, 2), cams: youCams(t, -760 * (1 - ease.out(clamp((t - stayA) / 0.35))), t >= stayT ? EX.sweat : EX.sly) });
  }, { kb: 0, qaAllow: ['face cut by frame'], hud: (g, lt, t) => { if (t >= stayT) badge(g, 'STAY ON THE BOARD', W / 2, 240, { color: '#7CFC9A', size: 58, ...popW(t, stayT) }); } });
  cue(stayA - 0.04, 'whoosh_soft', 0.3); cue(stayT, 'sparkle_pop', 0.35);

  // ======================= CTA (rules 10, 26, 39): the first frame again, the question with a number =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, MAGB[1]], [len(sh), MAGB[0]]], { t, e: lin });
    magAtBoard(g, t, { pieces: piecesAt(NC, 0), e: EX.smug });
  }, { kb: 0, trans: 'whip', hud: (g, lt, t) => {
    coverTitle(g, 'HOW MANY', 'POINTS?', 205);
    if (t >= manyT) { badge(g, 'COMMENT YOUR NUMBER', W / 2, 1530, { color: GOLD, size: 50, ...popW(t, manyT) }); badge(g, `FOLLOW ${CHANNEL}`, W / 2, 1640, { color: '#16161E', size: 36, ...pop(t, manyT + 0.3) }); }
  } });
  cue(ctaA - 0.04, 'whoosh_fast', 0.3); cue(manyT, 'reveal_bell', 0.35);

  const music = [
    { t: 0, m: 'hook' }, { t: repA, m: 'intrigue' }, { t: baitA, m: 'tension' }, { t: canT, m: 'slam' }, { t: t1A, m: 'clockwork' },
    { t: fourA, m: 'build' }, { t: BURST, m: 'slam' }, { t: twA, m: 'void' }, { t: givT, m: 'victory' }, { t: nevA, m: 'tension' }, { t: neverT, m: 'slam' },
    { t: stayA, m: 'digital' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: T.e('bait') - 1.35, t1: canT - 0.01, kind: 'mute' }, { t0: canT, t1: t1A, kind: 'boost', db: 4 },
    { t0: BURST - 0.32, t1: BURST - 0.01, kind: 'mute' }, { t0: BURST, t1: pctA, kind: 'boost', db: 3 },
    { t0: quiet, t1: givT - 0.02, kind: 'mute' },
    { t0: neverT - 0.3, t1: neverT - 0.01, kind: 'mute' },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  return { shots, cues, music, musicFx, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
