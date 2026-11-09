// 2.13 seconds (sponsored: Chessnut Move). Baku, 9 August 2023, FIDE World Cup round 4 game 1: Keymer has thirty
// seconds, Carlsen thirty-two minutes; Hikaru Nakamura walks over from the next table, looks down at the board and
// grimaces, and the internet timed it: 2.13 seconds. What he saw (37.Nd6! hits b7 and f7, 38.Nxb7, Carlsen resigned on
// move 58), how a grandmaster's brain does it (the five-second recall test and scrambled positions: patterns, about
// fifty thousand; a board in his head). The feats come first, right after the clip ("that's not even the scary part"):
// blindfold against Carlsen, Barcelona 2026 (26...Bxe3!!, a draw), the first 3500 blitz on Chess.com, 34 wins in a row,
// "not human" (a captcha on his facecam fails), "he IS the engine" (Stockfish is a fish; his own eval bar). The sponsor,
// the Chessnut Move, whose pieces drive themselves, stands only on our own table, never in front of the real players.
// Sources and what is drawn: SOURCES.md.
// Rules 42-45 (reference/rausis_v2.md): the payoff is the first frame (the grimace and the stopwatch at 2.13); every
// phrase is a 3D set (the Baku stage, a living room whose TV plays the clip, the board in his head, a wall of patterns,
// the Barcelona stage, a streaming room, two rating towers); cuts go through screens and objects. Palette (rule 48):
// Baku navy and tournament blue, mind teal on black, Chessnut white and graphite in a warm room, stream violet.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash, smooth } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt, brilliantIcon, slabRing } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { badge, plate, inkText, inkWidth, nameTitle, placeStamp, stamp, counter, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { room, table, FLOOR_Y, texTri, pool, chair } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver, playRun, brilliantSquare } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { loadImage } from '../../engine/js/photo.js';
import { HI, ledGlow, flashTint, speedLines, boardArrow, pieceRing, squareFrame, spread } from '../../engine/js/hifx.js';
import { confetti, rays, speedlines } from '../../engine/js/draw.js';
import { shockwave, glint } from '../../engine/js/fx.js';
import { GAMER, ledStrip } from '../../engine/js/witty.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream;
const NAVY = '#14244A', BLUE = '#2F63B8', AMBER = '#FFB547', MIND = '#5FE3D0', VIOLET = '#8E6CFF';
// Keymer-Carlsen, Baku 2023 (ply 73 = 37.Nd6, 75 = 38.Nxb7, 76 = 38...Rb1: the position Hikaru saw; 116 = 58...Kd5, 1-0)
const G = await fetch('../engine/data/keymer_carlsen_2023.json').then(r => r.json());
const MEME = 76, LAST = G.length - 1;
// the fish of the Stockfish logo (Klein Maetschke, GPLv3), cut out of its green tile and turned level: photos/cut_fish.py
const FISH = await loadImage('../episodes/hikaru213/photos/stockfish_fish.png');

// ---------- cast: Keymer (black shirt, dark blond hair swept back), Carlsen at 32 (white T-shirt, clean-shaven), Hikaru
// in Baku (a dark blue shirt, black trousers); blindfolded Carlsen and Hikaru for Barcelona ----------
CAST.keymer = { face: [0.9, 1.08, 0.82], hair: 'swept', hairC: '#9A7350', brow: '#7A5A3C', suit: '#18191D', suitD: '#0D0E11', shirt: 'tee', ears: 1.04, iris: '#6F8BA0' };
CAST.carlsen = { ...CAST.magnus14, suit: '#F1F1EC', suitD: '#CFD3D2', shirt: 'tee' };
CAST.hikB = { ...CAST.hikaru, shirt: 'tee', suit: '#23324E', suitD: '#18233A' };
CAST.magBlind = { ...CAST.magnus, suit: '#23262E', suitD: '#16181E', shirt: 'open', blindfold: '#121316' };
CAST.hikBlind = { ...CAST.hikaru, blindfold: '#121316' };
// the grimace of the clip: the brows knitted, the teeth bared in a wince, the eyes open and fixed on the board
const GRIMACE = { brow: -0.4, browY: -4, lid: 0.3, look: [0, 0.8], mouth: 'grimace', curve: -0.35, open: 0.4 };
const DOWN = { ...EXPR.focus, look: [0, 0.9], lid: 0.18 };
const THINK = { ...EXPR.focus, brow: 0.35, browY: 2, lid: 0.1, look: [0.55, -0.55], browTilt: 0.3, curve: -0.1 };
const KNOW = { ...EXPR.smug, lid: 0.2, look: [0, 0], curve: 0.5 };  // the end: he looks up at us
const KEYMER_E = { ...EXPR.worried, look: [0, 0.75], lid: 0.22, sweat: 0 };
const CARL_E = { ...EXPR.focus, look: [0, 0.7], lid: 0.22 };

// ---------- shared with the Hikaru episode (episodes/hikaru/scenes.js): screen helpers, the 3D toolkit, people ----------
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a heading: heavy letter-spaced capitals with a hard shadow, centred by their ink (y is the baseline, as before)
function heading(g, text, y, a = 1, { size = 44, color = CREAM, spacing = 5 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = `${spacing}px`; g.fillStyle = color;
  g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = Math.max(3, Math.round(size * 0.09));
  inkText(g, text, W / 2, y - size * 0.35); g.shadowColor = 'transparent';
  const tw = inkWidth(g, text); qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 10, 'text', text); g.restore();
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
// a label over a point in the world (a name, a clock, a rating): the flat plate of the HUD, sized by the distance;
// a label at the edge slides into the frame, and it stays below a HUD element above it (minY)
function tag3(g, x, y, z, text, col, u, { minY = -1e9 } = {}) {
  if (u <= 0 || depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), k = lerp(1.25, 1, ease.out(clamp(u))), fs = Math.round(clamp(p.s * 0.6, 30, 64));
  g.save(); g.font = sans(fs, 900); g.letterSpacing = `${fs <= 34 ? 4 : fs <= 46 ? 2 : 1}px`; const tw = inkWidth(g, text) + fs * 0.95; g.restore();
  if (p.x < -tw / 2 || p.x > W + tw / 2) return;  // the anchor is off screen: no label
  plate(g, text, clamp(p.x, tw * k / 2 + 24, W - tw * k / 2 - 24), Math.max(p.y, minY), { color: col, size: fs, a: clamp(u * 2), scale: k, rot: -0.02 });
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

// ---------- a standing (or walking) person (the Rausis walker), facing (fx, fz) in the floor plane: the head turns
// toward where he faces as seen from the camera ----------
function standing(g, who, x, z, { e = 'neutral', t = 0, k = 1, walk = 0, phase = 0, y0 = FLOOR_Y, col, fx = 1, fz = 0, a = 1 } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8 || a <= 0) return null;
  const c = CAST[who], p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK, bob = walk ? -Math.abs(Math.cos(phase)) * 12 : 0;
  const ex = typeof e === 'string' ? EXPR[e] : e, dx = x - B.E[0], dz = z - B.E[2], l = Math.hypot(dx, dz) || 1;
  const ee = { ...ex, turn: clamp((ex.turn || 0) + (fx * dz - fz * dx) / l * 0.85, -1, 1) };
  g.save(); g.globalAlpha *= a;
  footShadow(g, x, z, 1.3 * k, 0.8, y0);
  g.translate(p.x, p.y); g.scale(sc, sc);
  const steps = [-1, 1].map(sd => { const ph = phase + (sd > 0 ? 0 : Math.PI); return { sd, fwd: walk * Math.sin(ph), lift: walk * Math.max(0, Math.cos(ph)) * 44 }; });
  const tc = col || [mix(c.suit, '#000000', 0.1), mix(c.suitD, '#000000', 0.35)];
  for (const L of steps.sort((u, v) => u.fwd - v.fwd)) leg(g, L.sd, { ...L, col: tc });
  g.translate(0, bob);
  g.save(); jacketClip(g);
  drawChar(g, who, { e: ee, t });
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
// a forearm in bust units: a tapered band with a soft side shade
function arm2(g, [x0, y0], [x1, y1], w0, w1, col, colD) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const gr = g.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0); gr.addColorStop(0, colD); gr.addColorStop(0.45, col); gr.addColorStop(1, colD);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x0 + nx * w0, y0 + ny * w0); g.lineTo(x1 + nx * w1, y1 + ny * w1); g.lineTo(x1 - nx * w1, y1 - ny * w1); g.lineTo(x0 - nx * w0, y0 - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.fill();
}
// the players' hands at their faces, in the bust's own units (drawn after the table, so the elbows rest on it):
// Keymer holds his head in both hands, Carlsen sits with a fist at his mouth
function faceHands(g, who, z, mode, { x = 4, lift = 3.1, face = 1, sd = 1, a = 1 } = {}) {
  if (depth(x, lift, z) < 0.8 || a <= 0) return;
  if ((B.E[2] - z) * face < 0) return;  // seen from behind: seated() draws the back
  const c = CAST[who], sk = SKIN2, p = B.project(x, lift, z), s = p.s * 1.05 / 100;
  const dx = x - B.E[0], dz = z - B.E[2], tx = clamp(-face * dx / (Math.hypot(dx, dz) || 1) * 0.85, -1, 1) * 26 * c.face[0];
  g.save(); g.globalAlpha *= a; g.translate(p.x, p.y); g.scale(s, s);
  if (mode === 'cheeks') for (const d of [-1, 1]) {
    arm2(g, [d * 190 + tx * 0.3, 340], [d * 104 + tx, 118], 46, 34, c.suit, mix(c.suit, '#000000', 0.5));
    hand2(g, d * 98 + tx, 80, 36, sk);
  }
  if (mode === 'fist') {
    arm2(g, [sd * 170 + tx * 0.3, 345], [sd * 40 + tx, 140], 40, 32, sk.base, sk.shade);
    hand2(g, sd * 26 + tx, 108, 40, sk);
    g.strokeStyle = rgba(sk.deep, 0.6); g.lineWidth = 4;  // the knuckles
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(sd * 26 + tx + i * 16, 84, 9, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  }
  g.restore();
}

// ======================= BAKU: the stage of round 4 (after the broadcast frame) =======================
// a dark blue wall behind, the blue tournament table with a wooden board, a digital clock, water bottles and
// scoresheets; Keymer (White, left of the side camera) and Carlsen (right); the table where Hikaru played is behind
const WOOD = { light: '#E4C89C', dark: '#9C6B40', frame: '#4A2F1B', side: '#2C1B0F', m: 0.42, th: 0.38, rc: 0.25 };
const BTABLE = { table: [BLUE, '#1D3E78', '#244E96'] };
const WALLX = -7.6, HIKX = -2.6, HIKZ = 4;
const fmtT = s => s >= 20 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.floor(s)}.${Math.floor(s * 10) % 10}`;
function lcdTex({ l, r }) {
  return once(`lcd:${l.toFixed(1)}:${r}`, 480, 240, (x, w, h) => {
    x.fillStyle = '#070908'; x.fillRect(0, 0, w, h); x.fillStyle = '#0E1512'; x.fillRect(12, 12, w - 24, h - 24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = sans(26, 800); x.letterSpacing = '4px'; x.fillStyle = '#CFE0FF'; x.fillText('KEYMER', w * 0.25, 46); x.fillText('CARLSEN', w * 0.75, 46);
    x.fillStyle = 'rgba(244,239,230,0.2)'; x.fillRect(w / 2 - 2, 30, 4, h - 60);
    x.font = mono(78, 800); x.letterSpacing = '0px'; x.shadowBlur = 16;
    x.shadowColor = x.fillStyle = l < 60 ? '#FF6A55' : '#E9FFF0'; x.fillText(fmtT(l), w * 0.25, 148);
    x.shadowColor = x.fillStyle = '#8FA89A'; x.fillText(fmtT(r), w * 0.75, 148);
  });
}
function lcdClock(g, st) {
  ab(g, [9.0, -0.35, 3.1], [10.8, 0.55, 4.9], '#15181C', { amb: 0.6 });
  for (const [z0, z1, up] of [[3.25, 3.85, 0], [4.15, 4.75, 1]]) ab(g, [9.6, 0.55, z0], [10.2, 0.61 + up * 0.1, z1], '#2A2F36', { amb: 0.6 });
  const img = lcdTex(st), m = 0.12, e = 0.02, E = B.E;
  if (E[0] > 10.8) texQuad(g, img, [10.8 + e, 0.55 - m, 3.1 + m], [10.8 + e, 0.55 - m, 4.9 - m], [10.8 + e, -0.35 + m, 3.1 + m]);
  else if (E[2] < 3.1) texQuad(g, img, [9 + m, 0.55 - m, 3.1 - e], [10.8 - m, 0.55 - m, 3.1 - e], [9 + m, -0.35 + m, 3.1 - e]);
  else if (E[2] > 4.9) texQuad(g, img, [10.8 - m, 0.55 - m, 4.9 + e], [9 + m, 0.55 - m, 4.9 + e], [10.8 - m, -0.35 + m, 4.9 + e]);
  pool(g, B, 10.4, 0.1, 4, 2.2, '#BFFFD8', 0.08, true);
}
// a scoresheet: a sheet of paper on the table with ruled lines and a pen
const SHEET = tex(300, 420, (x, w, h) => {
  x.fillStyle = '#F2F0EA'; x.fillRect(0, 0, w, h); x.fillStyle = '#2F63B8'; x.fillRect(0, 0, w, 34);
  x.strokeStyle = 'rgba(40,60,90,0.35)'; x.lineWidth = 2;
  for (let y = 60; y < h - 10; y += 22) { x.beginPath(); x.moveTo(14, y); x.lineTo(w - 14, y); x.stroke(); }
  x.beginPath(); x.moveTo(w / 2, 50); x.lineTo(w / 2, h - 12); x.stroke();
  x.fillStyle = 'rgba(30,40,70,0.65)'; x.font = '18px serif';
  ['d4 Nf6', 'c4 e6', 'Nc3 d5', 'cxd5 exd5', 'Bg5 Be7', 'e3 h6', 'Bh4 O-O', 'Bd3 b6'].forEach((s, i) => x.fillText(s, 20, 78 + i * 22));
});
function sheets(g) {
  for (const z0 of [-0.95, 7.85]) {
    texQuad(g, SHEET, [8.6, -0.34, z0], [8.6, -0.34, z0 + 1.1], [9.75, -0.34, z0], { under: false });
    cylinder(g, [9.2, -0.3, z0 + 0.15], [9.35, -0.3, z0 + 0.95], 0.05, '#1A1C20', { n: 8 });
  }
}
function bottle(g, x, z) {
  cylinder(g, [x, -0.35, z], [x, 1.25, z], 0.27, '#A9D2EE', { a: 0.7, spec: 0.8, amb: 0.7 });
  cylinder(g, [x, 1.25, z], [x, 1.42, z], 0.16, '#C9E4F5', { a: 0.75, amb: 0.7 });
  cylinder(g, [x, 1.42, z], [x, 1.62, z], 0.14, BLUE, { amb: 0.7 });
  cylinder(g, [x, 0.25, z], [x, 0.7, z], 0.275, '#2F63B8', { a: 0.85, amb: 0.65 });
}
// the broadcast screen on the left of the wall: four live boards
const BOARDS = tex(1024, 576, (x, w, h) => {
  x.fillStyle = '#0A1430'; x.fillRect(0, 0, w, h);
  const names = [['KEYMER', 'CARLSEN'], ['NAKAMURA', 'PRAGGNANANDHAA'], ['GUKESH', 'ERIGAISI'], ['CARUANA', 'GRANDELIUS']];
  names.forEach(([a, b], i) => {
    const ox = 40 + (i % 2) * 500, oy = 34 + Math.floor(i / 2) * 270, s = 26;
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#E4C89C' : '#9C6B40'; x.fillRect(ox + f * s, oy + r * s, s, s); }
    x.fillStyle = '#CFE0FF'; x.font = sans(26, 800); x.letterSpacing = '2px'; x.fillText(a, ox + 230, oy + 60); x.fillText(b, ox + 230, oy + 150);
    x.fillStyle = '#7FA6E8'; x.font = sans(20, 700); x.fillText('ROUND 4', ox + 230, oy + 196);
  });
  ledGrid(x, w, h, 6);
});
function bakuBg(g, t, { cone = 0.14 } = {}) {
  g.fillStyle = '#060A14'; g.fillRect(0, 0, W, H);
  tiled(g, [WALLX, FLOOR_Y, -40], [60, 0, 0], [0, 0, 80], { color: '#0F1728', grout: 'rgba(255,255,255,0.025)', tu: 4, tv: 4 });
  tiled(g, [WALLX, FLOOR_Y, -40], [0, 0, 80], [0, 26, 0], { color: NAVY, grout: 'rgba(0,0,0,0.3)', tu: 4, tv: 26, lw: 3,
    light: g2 => { const p = B.project(WALLX, 4, 4), r = p.s * 16, gr = g2.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, 'rgba(120,160,240,0.48)'); gr.addColorStop(1, 'rgba(110,150,235,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, H); } });
  // the screen with the live boards, on the left of the wall (low z = the left of the side camera)
  ab(g, [WALLX, 2.6, -15.4], [WALLX + 0.3, 9.6, -3.2], '#05070C', { amb: 0.7 });
  texQuad(g, BOARDS, [WALLX + 0.32, 9.4, -15.2], [WALLX + 0.32, 9.4, -3.4], [WALLX + 0.32, 2.8, -15.2]);
  // the next table, where Hikaru played Praggnanandhaa: a blue box, a little board, an empty chair (his)
  ab(g, [-6.9, -0.75, -12], [-3.9, -0.35, -8.6], BLUE, { amb: 0.55 });
  ab(g, [-6.6, FLOOR_Y, -11.7], [-4.2, -0.75, -8.9], '#1D3E78', { amb: 0.55 });
  for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) { if (B.poly(g, [[-6.5 + f * 0.55, -0.34, -11.1 + r * 0.55], [-5.95 + f * 0.55, -0.34, -11.1 + r * 0.55], [-5.95 + f * 0.55, -0.34, -10.55 + r * 0.55], [-6.5 + f * 0.55, -0.34, -10.55 + r * 0.55]])) { g.fillStyle = (f + r) % 2 ? '#E4C89C' : '#9C6B40'; g.fill(); } }
  chair(g, B, -5.4, -7.7, { face: -1, color: '#1A2440' });
  spotCone(g, B, { top: [4, 16, 4], base: [4, -0.3, 4], r0: 0.6, r1: 7, color: '#E6EEFF', a: cone, t, dust: 30 });
}
const hikFig = (g, t, { x = HIKX, z = HIKZ, e = DOWN, walk = 0, phase = 0, fx = 1, fz = 0, k = 1.08, a = 1 } = {}) =>
  standing(g, 'hikB', x, z, { e, t, k, walk, phase, fx, fz, a, col: ['#17181C', '#0C0D10'] });
// the whole stage. hik: Hikaru's pose (null: not there); under/over: board effects; pieces default to the meme position
function baku(g, t, { pieces = null, hik = null, ek = KEYMER_E, ec = CARL_E, clock = null, under = null, over = null, focus = null, cone = 0.14, players = true, hands = true, dof = 1.4 } = {}) {
  bakuBg(g, t, { cone });
  const hx = hik ? hik.x ?? HIKX : 0, hikFirst = hik && B.E[0] > hx;
  if (hikFirst) hikFig(g, t, hik);
  const kb = players ? seated(g, B, 'keymer', ek, t, { z: -1.4, face: 1, hands: false }) : null;
  const cb = players ? seated(g, B, 'carlsen', ec, t, { z: 9.3, face: -1, hands: false }) : null;
  table(g, B, BTABLE, { x1: 10.6 });
  sheets(g);
  const st = clock || { l: 30.6 - t, r: 1929 }, clockLate = B.E[0] > 11;
  if (!clockLate) lcdClock(g, st);
  B.drawSlab(g, WOOD);
  if (under) under(g);
  B.drawPieces(g, pieces || piecesAt(G, MEME), { focus: focus ?? B.dist, dof });
  if (over) over(g);
  if (clockLate) lcdClock(g, st);
  const bl = [[10.3, -0.55], [10.3, 8.55]].sort((p, q) => depth(q[0], 0.5, q[1]) - depth(p[0], 0.5, p[1]));
  for (const [x, z] of bl) bottle(g, x, z);
  if (players && hands) { faceHands(g, 'keymer', -1.4, 'cheeks', { face: 1 }); faceHands(g, 'carlsen', 9.3, 'fist', { face: -1, sd: -1 }); }
  if (kb) kb(); if (cb) cb();
  if (hik && !hikFirst) hikFig(g, t, hik);
}
// where Hikaru is at story time t: at the next table until 2.3 s, then the walk round to the middle of the table
const WALK0 = 2.3, WALK1 = 4.45;
function hikPose(t) {
  const e = exprAt([[0, { ...EXPR.neutral, look: [0.5, 0.35] }], [WALK1 - 0.2, DOWN], [6.4, GRIMACE]], t);
  if (t >= WALK1) return { x: HIKX, z: HIKZ, e, fx: 1, fz: 0 };
  const u = seg(t, WALK0, WALK1, x => x), v = ease.out(u);
  return { x: lerp(-5.4, HIKX, ease.out(clamp(u * 1.6))), z: lerp(-7.0, HIKZ, v), walk: u < 0.92 ? 1 : (1 - u) / 0.08, phase: t * 8.5,
    e, fx: lerp(0.25, 1, seg(u, 0.8, 1)), fz: lerp(1, 0, seg(u, 0.8, 1)) };
}

// ======================= OUR TABLE: a sunny living room, a window onto a garden, a TV on the wall, the Chessnut Move on the table =======================
const HOME = { base: '#EADFCB', wall: ['#F3E5C9', '#EFDFC1'], seam: '#E6D5B6', rail: '#FFFDF6', floor: ['#C99863', '#C1905C'], light: '#FFF1D4', lightA: 0.3,
  table: ['#C9996A', '#80593A', '#A67749'] };
const fogH = (col, x, y, z) => mix(col, HOME.base, clamp((depth(x, y, z) - 9) / 26) * 0.85);  // the room's haze, as env.js fogs its walls
const FEED = makeCanvas(), feedx = FEED.getContext('2d');  // the frame of another scene, shown on a screen
const FEED_SRC = [0, (H - 608) / 2, W, 608];
const TVQ = { tl: [-1.5, 7.375, 12.5], tr: [4.5, 7.375, 12.5], bl: [-1.5, 4.0, 12.5] }, TVC = [1.5, 5.69, 12.5];
// the view out of the window: a summer sky with clouds, a tree, a hedge and a white fence over the lawn
const VIEW = tex(900, 1150, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h * 0.7); gr.addColorStop(0, '#62AEE6'); gr.addColorStop(1, '#CBE9F8'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.96)';
  for (const [cx, cy, s] of [[150, 180, 1], [650, 110, 0.8], [470, 400, 0.62], [70, 540, 0.5]])
    for (const [dx, dy, r] of [[0, 0, 62], [58, -26, 54], [114, 4, 46], [-52, 12, 40]]) { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, r * s, 0, 7); x.fill(); }
  x.fillStyle = '#A9D0A0'; x.beginPath(); x.moveTo(0, 700); x.quadraticCurveTo(300, 600, 560, 690); x.quadraticCurveTo(760, 640, 900, 690); x.lineTo(900, h); x.lineTo(0, h); x.fill();  // far hills
  x.fillStyle = '#7A5638'; x.fillRect(700, 470, 34, 420);  // a tree on the right
  for (const [cx, cy, r, c] of [[716, 420, 170, '#3F7F3C'], [630, 480, 118, '#4E9447'], [806, 486, 118, '#4E9447'], [706, 318, 110, '#5DA052']]) { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
  x.fillStyle = '#5DA052'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(i * 115 - 20, 800 + Math.sin(i * 2.1) * 18, 90, 0, 7); x.fill(); }  // the hedge
  x.fillStyle = '#4C8C45'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(i * 115 + 30, 846 + Math.cos(i * 1.7) * 14, 70, 0, 7); x.fill(); }
  x.fillStyle = '#86C46E'; x.fillRect(0, 900, w, h - 900);  // the lawn
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 930, w, 16); x.fillRect(0, 990, w, 16);  // the fence: two rails and pointed pickets
  for (let px = 10; px < w; px += 58) { x.beginPath(); x.moveTo(px, 1060); x.lineTo(px, 900); x.lineTo(px + 18, 880); x.lineTo(px + 36, 900); x.lineTo(px + 36, 1060); x.fill(); }
  x.fillStyle = 'rgba(0,0,0,0.08)'; for (let px = 10; px < w; px += 58) x.fillRect(px + 28, 900, 8, 160);
});
const WIN = { x0: 6.8, x1: 12.4, y0: 0.9, y1: 9.4, z: 12.96 };
function homeWindow(g) {
  const { x0, x1, y0, y1, z } = WIN, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2 + 0.6, FR = '#FBF8F1', f = 0.2;
  const p = B.project(xm, ym, z); if (depth(xm, ym, z) > 0.8) rim(g, p.x, p.y, p.s * 7.5, '#FFF4D8', 0.32);  // the daylight round it
  texQuad(g, VIEW, [x0, y1, z], [x1, y1, z], [x0, y0, z]);
  ab(g, [x0 - f, y1, z - 0.14], [x1 + f, y1 + f * 1.4, z], FR, { amb: 0.82 });   // the white frame
  ab(g, [x0 - f, y0, z - 0.14], [x0, y1, z], FR, { amb: 0.82 });
  ab(g, [x1, y0, z - 0.14], [x1 + f, y1, z], FR, { amb: 0.82 });
  ab(g, [xm - 0.07, y0, z - 0.09], [xm + 0.07, y1, z], FR, { amb: 0.82 });    // the cross bars
  ab(g, [x0, ym - 0.07, z - 0.09], [x1, ym + 0.07, z], FR, { amb: 0.82 });
  ab(g, [x0 - 0.5, y0 - 0.3, z - 0.62], [x1 + 0.5, y0, z], FR, { amb: 0.78 });  // the sill
  for (const [c0, c1] of [[x0 - 2.0, x0 - 0.12], [x1 + 0.12, x1 + 2.0]])  // the curtains: soft sage folds
    for (let i = 0, x = c0; x < c1 - 1e-6; x += 0.376, i++) {
      const xb = Math.min(c1, x + 0.39), k = 0.5 + 0.5 * Math.sin(i * 1.9);
      quad(g, [[x, y1 + 1.05, z - 0.32], [xb, y1 + 1.05, z - 0.32], [xb, FLOOR_Y + 0.35, z - 0.32], [x, FLOOR_Y + 0.35, z - 0.32]], fogH(mix('#7F9F88', '#AECAB3', k), x, 3, z));
    }
  ab(g, [x0 - 2.3, y1 + 1.0, z - 0.42], [x1 + 2.3, y1 + 1.18, z - 0.26], '#B8956C', { amb: 0.7 });  // the rod
  pool(g, B, xm, FLOOR_Y, z - 4.5, 5.5, '#FFF3D6', 0.26);  // sunlight on the floor
}
// a framed print left of the TV: a knight in ink on a cream mat
const PRINT = tex(300, 380, (x, w, h) => {
  x.fillStyle = '#F7F1E4'; x.fillRect(0, 0, w, h); x.fillStyle = '#E3D7BF'; x.fillRect(34, 34, w - 68, h - 68);
  drawPiece(x, 'n', 'k', w / 2, h * 0.74, 190);
});
function tvSet(g, feed = 0) {
  homeWindow(g);
  ab(g, [-6.6, 4.3, 12.86], [-3.8, 7.9, 12.97], '#3B2E22', { amb: 0.7 });
  texQuad(g, PRINT, [-6.45, 7.75, 12.85], [-3.95, 7.75, 12.85], [-6.45, 4.45, 12.85]);
  ab(g, [-1.75, 3.78, 12.55], [4.75, 7.6, 12.95], '#15171A', { amb: 0.7 });
  if (feed > 0) {
    texQuad(g, FEED, TVQ.tl, TVQ.tr, TVQ.bl, { src: FEED_SRC, a: feed });
    const p = B.project(1.5, 5.7, 12.4); rim(g, p.x, p.y, p.s * 5, '#9FC2FF', 0.1 * feed);
  } else if (B.poly(g, [TVQ.tl, TVQ.tr, [4.5, 4.0, 12.5], TVQ.bl])) { g.fillStyle = '#1C1F23'; g.fill(); }
  // a white console under it with an oak top, a floor lamp right of the window, a plant on the left
  ab(g, [-2.5, FLOOR_Y, 11.4], [5.5, -1.0, 12.9], '#ECE5D8', { amb: 0.62 });
  ab(g, [-2.6, -1.02, 11.32], [5.6, -0.9, 12.92], '#C9996A', { amb: 0.62 });
  cylinder(g, [15.2, FLOOR_Y, 10.8], [15.2, 5.6, 10.8], 0.1, '#3A3430', { n: 10 });
  lathe(g, 15.2, 10.8, [[5.2, 1.0, 1.0], [6.6, 0.7, 0.7], [7.4, 0.45, 0.45]], '#FFF6E6', { amb: 0.9 });
  lathe(g, -5.2, 10.6, [[FLOOR_Y, 0.7, 0.7], [-1.6, 0.85, 0.85], [-1.4, 0.8, 0.8]], '#D9C7AE', { amb: 0.65 });
  for (let i = 0; i < 14; i++) {  // the plant: long leaves fanning out of the pot
    const a = i / 14 * 6.28, r = 0.5 + (i % 3) * 0.25, q = B.project(-5.2 + Math.cos(a) * r, -0.9 + (i % 4) * 0.55, 10.6 + Math.sin(a) * r * 0.7);
    if (depth(-5.2, 0, 10.6) > 0.8) { g.fillStyle = i % 2 ? '#4E9447' : '#3F7F3C'; g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.62, q.s * 0.2, a * 0.6 - 0.4, 0, 7); g.fill(); }
  }
}
// the Chessnut Move as Chessnut shows it (chessnutech.com: model CM100, 632 × 520 × 22 mm, 55 mm squares; SOURCES.md):
// a matte charcoal wooden frame, wide at the sides (96 mm = 1.75 squares: the pieces not in play park there, two rows a
// side, as in Chessnut's own footage) and narrow at the ends (40 mm); a white field with black squares and the coordinates
// in its border; the logo — the knight of the site's header as the C of CHESSNUT — printed on each side field, facing out;
// on the front edge the strip of buttons with two blue lights and the logo
const NUT = { light: '#F3F3EF', dark: '#232427', frame: '#2A2C2F', side: '#141517', mx: 96 / 55, mz: 40 / 55, th: 0.38, rc: 0.42, rim: 0.28, shadow: 0.5, mark: null };
const NUT_BW = 0.18;  // the white border round the squares
const ICON = await loadImage('../episodes/hikaru213/photos/chessnut_icon.png');  // the official knight (Icon_store_512.png), cut out
await document.fonts.load('600 100px Montserrat');  // the site's brand font: HESSNUT after the knight
const ICON_T = new Map();
function iconTinted(col) {
  if (!ICON_T.has(col)) ICON_T.set(col, tex(ICON.width, ICON.height, (x, w, h) => { x.drawImage(ICON, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, w, h); }));
  return ICON_T.get(col);
}
// the logo: the knight is the C, HESSNUT follows; x is its left end, y the baseline, cap the height of the capitals.
// Returns its width (draw: false only measures)
function nutLogo(g, x, y, cap, col, { word = 'HESSNUT', draw = true } = {}) {
  const ic = iconTinted(col), ih = cap * 1.42, iw = ih * ic.width / ic.height;
  g.save(); g.font = `600 ${(cap / 0.7).toFixed(1)}px Montserrat`; g.letterSpacing = `${(cap * 0.05).toFixed(1)}px`;
  const w = iw * 0.94 + g.measureText(word).width;
  if (draw) { g.drawImage(ic, x, y - ih * 0.9, iw, ih); g.fillStyle = col; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillText(word, x + iw * 0.94, y); }
  g.restore();
  return w;
}
let LOGO_F = 0.8;  // the share of the side texture's length the logo itself takes
const LOGO_SIDE = tex(1200, 240, (x, w, h) => { const lw = nutLogo(x, 0, 186, 118, '#80848A', { draw: false }); LOGO_F = lw / w; nutLogo(x, (w - lw) / 2, 186, 118, '#80848A'); });
// QA (rule 52): the sponsor's logo is either whole in the frame or out of it, and never under the captions. A logo big
// enough to read and at least partly in the frame is logged as text, so --qa reports it cut by the edge or under captions
function qaLogo(g, corners, label, minPx = 60) {
  if (corners.some(p => depth(...p) < 0.4)) return;
  const P = corners.map(p => B.project(...p)), xs = P.map(p => p.x), ys = P.map(p => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (Math.max(x1 - x0, y1 - y0) < minPx || x1 < 0 || x0 > W || y1 < 0 || y0 > H) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); qaRect(g, x0, y0, x1 - x0, y1 - y0, 'text', label); g.restore();
}
// the coordinates printed in the white border: files along the near edge, ranks along the left one
const FILES = tex(1600, 36, (x, w, h) => { x.font = sans(26, 700); x.fillStyle = '#9C9FA3'; x.textAlign = 'center'; x.textBaseline = 'middle'; 'abcdefgh'.split('').forEach((c, i) => x.fillText(c, (i + 0.5) * w / 8, h / 2 + 1)); });
const RANKS = tex(36, 1600, (x, w, h) => { x.font = sans(26, 700); x.fillStyle = '#9C9FA3'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 0; i < 8; i++) x.fillText(String(8 - i), w / 2, (i + 0.5) * h / 8 + 1); });
// the strip on the front edge: buttons and icons in grey, two blue lights, the logo in the middle
const PANEL = tex(1440, 80, (x, w, h) => {
  x.fillStyle = '#1C1D20'; x.beginPath(); x.roundRect(4, 6, w - 8, h - 12, 22); x.fill();
  x.strokeStyle = '#3A3D42'; x.lineWidth = 3; x.stroke();
  x.strokeStyle = '#8D9196'; x.fillStyle = '#8D9196'; x.lineWidth = 4;
  for (const cx of [130, 250, 1190, 1310]) { x.beginPath(); x.roundRect(cx - 22, 18, 44, 44, 9); x.stroke(); }
  x.beginPath(); x.arc(130, 40, 9, 0, 7); x.stroke(); x.fillRect(244, 30, 12, 20);
  x.font = sans(30, 800); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', 1310, 42); x.beginPath(); x.moveTo(1180, 30); x.lineTo(1200, 40); x.lineTo(1180, 50); x.stroke();
  const lw = nutLogo(x, 0, 52, 26, '#A9ADB2', { draw: false }); nutLogo(x, (w - lw) / 2, 52, 26, '#A9ADB2');
});
const nutGlow = (g, x, y, r, a) => { g.save(); g.globalAlpha *= a; g.fillStyle = '#4FB2FF'; g.shadowColor = '#4FB2FF'; g.shadowBlur = r * 5; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); };
function nutBoard(g, t, { leds = 1, logo = 1 } = {}) {
  const { mx, mz, th } = NUT, E = B.E;
  B.drawSlab(g, NUT);
  if (E[1] <= 0) return;
  // the raised rim: a fine line just inside the edge, all the way round
  g.save(); g.strokeStyle = 'rgba(122,128,136,0.32)'; g.lineWidth = clamp(B.project(4, 0, 4).s * 0.012, 1, 3); g.lineJoin = 'round';
  B.poly(g, slabRing(mx - 0.16, mz - 0.16, NUT.rc - 0.12).map(p => [p.x, 0.002, p.z])); g.stroke(); g.restore();
  // the white border round the squares
  const bw = NUT_BW;
  for (const [x0, z0, x1, z1] of [[-bw, -bw, 8 + bw, 0], [-bw, 8, 8 + bw, 8 + bw], [-bw, 0, 0, 8], [8, 0, 8 + bw, 8]]) { B.quad(g, x0, z0, x1, z1, 0.001); g.fillStyle = NUT.light; g.fill(); }
  texQuad(g, FILES, [0, 0.003, 0], [8, 0.003, 0], [0, 0.003, -bw], { under: false });
  texQuad(g, RANKS, [-bw, 0.003, 8], [0, 0.003, 8], [-bw, 0.003, 0], { under: false });
  // the logo on both side fields, each turned to be read from its own side
  if (logo > 0) {
    const L = 2.8, hh = L * 0.1, xr = 8 + bw + (mx - bw) / 2, xl = -(bw + (mx - bw) / 2);
    texQuad(g, LOGO_SIDE, [xr - hh, 0.004, 4 - L / 2], [xr - hh, 0.004, 4 + L / 2], [xr + hh, 0.004, 4 - L / 2], { under: false, a: logo });
    texQuad(g, LOGO_SIDE, [xl + hh, 0.004, 4 + L / 2], [xl + hh, 0.004, 4 - L / 2], [xl - hh, 0.004, 4 + L / 2], { under: false, a: logo });
    const lz = L * LOGO_F / 2, lx = hh * 0.7;
    for (const [xc, side] of [[xr, 'right'], [xl, 'left']]) qaLogo(g, [[xc - lx, 0, 4 - lz], [xc + lx, 0, 4 - lz], [xc - lx, 0, 4 + lz], [xc + lx, 0, 4 + lz]], `Chessnut logo, ${side} field`);
  }
  // the strip on the front edge, seen when the camera is in front of it
  if (E[2] < -mz - 0.05) {
    const z = -mz - 0.004, y0 = -th * 0.22, y1 = -th * 0.78;
    texQuad(g, PANEL, [2.0, y0, z], [6.0, y0, z], [2.0, y1, z], { under: false, a: logo });
    qaLogo(g, [[3.7, y0, z], [4.3, y0, z], [3.7, y1, z], [4.3, y1, z]], 'Chessnut logo, front edge', 50);
    if (leds > 0) [[3.2, 0], [3.42, 1.7]].forEach(([x, ph]) => { const p = B.project(x, (y0 + y1) / 2, z - 0.002); nutGlow(g, p.x, p.y, Math.max(1.5, p.s * 0.03), leds * (0.75 + 0.25 * Math.sin(t * 2.4 + ph))); });
  }
}
// the Chessnut set: black pieces true black, every piece on its copper robot base (pieces.js, skin 'nut')
const nutPieces = ps => ps.map(p => ({ ...p, c: p.c === 'b' ? 'k' : p.c, skin: 'nut' }));
// pieces drive themselves: from one list to another in straight lines (they roll on wheels), a little out of step;
// a piece missing from `to` drives to park(p, i) and fades (fade) or stays there; one missing from `from` starts there
function drive(from, to, t, t0, dur, { stagger = 0.35, park = null, seed = 7, fade = true } = {}) {
  const A = new Map(from.map(p => [p.id, p])), out = [];
  to.forEach((p, i) => {
    const q0 = A.get(p.id); A.delete(p.id);
    const q = q0 || (park ? { ...p, ...park(p, i) } : p);
    const d0 = t0 + hash(i * 0.37 + seed) * stagger, u = ease.inOut(clamp((t - d0) / dur));
    const moving = u > 0 && u < 1 && (q.x !== p.x || q.z !== p.z);
    out.push({ ...p, x: lerp(q.x, p.x, u), z: lerp(q.z, p.z, u), y: 0, alpha: !q0 && !park ? u : 1, ...(moving ? { trail: [q.x, q.z], trailA: Math.sin(Math.PI * u) * 0.7 } : { trail: null }) });
  });
  [...A.values()].forEach((q, i) => {
    const d0 = t0 + hash(i * 0.37 + seed + 50) * stagger, u = ease.inOut(clamp((t - d0) / dur)), P = park ? park(q, i) : q;
    out.push({ ...q, x: lerp(q.x, P.x, u), z: lerp(q.z, P.z, u), alpha: fade ? 1 - u : 1, trail: null });
  });
  return out;
}
// the side fields of the board hold the pieces that are not in play, two rows a side, as in Chessnut's own footage:
// white on the right, black on the left, pawns in the outer row, the other pieces in the inner one, each level with the
// file it started on — so a piece always parks in the same spot
const SLOT = new Map(G[0].pieces.map(p => {
  const f = p.sq.charCodeAt(0) - 97, pawn = p.t === 'p', white = p.c === 'w';
  return [p.id, { x: white ? (pawn ? 9.33 : 8.6) : (pawn ? -1.33 : -0.6), z: 0.5 + f }];
}));
const PARK = p => SLOT.get(p.id) || { x: p.c === 'w' ? 8.6 : -0.6, z: 0.5 };
const parked = ply => { const on = new Set(G[ply].pieces.map(p => p.id)); return G[0].pieces.filter(p => !on.has(p.id)); };
const withParked = (ply, k = 0) => [...piecesAt(G, ply), ...parked(ply).map((p, i) => ({ ...p, ...PARK(p, i + k) }))];
function home(g, t, { pieces = null, under = null, over = null, focus = null, feed = 0, leds = 1, logo = 1, extra = null, dof = 0.7 } = {}) {
  room(g, B, HOME, { t });
  tvSet(g, feed);
  table(g, B, HOME, { x0: -2.3, x1: 11.8 });  // wide enough for the board (x -1.75..9.75), the diagram and the tablet
  if (extra) extra(g, 'table');
  nutBoard(g, t, { leds, logo });
  if (under) under(g);
  if (pieces) B.drawPieces(g, nutPieces(pieces), { focus: focus ?? B.dist, dof });
  if (over) over(g);
  if (extra) extra(g, 'top');
}

// the tablet on a stand at the right of the board: an online game; the opponent's move arrives on it
const TAB = makeCanvas(600, 820), tabx = TAB.getContext('2d');
function tabletTex(t, tMove) {
  const x = tabx, w = 600, h = 820;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#16181C'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#23262C'; x.fillRect(0, 0, w, 96); x.font = sans(30, 800); x.letterSpacing = '2px'; x.fillStyle = '#E9ECEF'; x.textAlign = 'left';
  x.fillText('ONLINE · 10 MIN', 28, 60);
  x.font = sans(28, 800); x.fillStyle = '#C9CDD2'; x.fillText('OPPONENT  1850', 28, 150);
  const s = 66, ox = (w - s * 8) / 2, oy = 190, ps = piecesAt(G, t >= tMove ? 2 : 1);
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#ECEBE6' : '#5C6168'; x.fillRect(ox + f * s, oy + (7 - r) * s, s, s); }
  if (t >= tMove) { x.fillStyle = rgba(GOLD, 0.55); for (const sq of ['g8', 'f6']) { const [fx, fz] = sqXZ(sq); x.fillRect(ox + (fx - 0.5) * s, oy + (7.5 - fz) * s, s, s); } }
  for (const p of ps) { const [fx, fz] = sqXZ(p.sq); drawPiece(x, p.t, p.c === 'b' ? 'k' : 'w', ox + fx * s, oy + (8 - fz + 0.5) * s - s * 0.06, s * 0.92); }
  x.font = sans(28, 800); x.fillStyle = '#C9CDD2'; x.fillText('YOU', 28, oy + s * 8 + 50);
  if (t >= tMove) { x.textAlign = 'center'; x.font = sans(34, 900); x.fillStyle = GOLD; x.fillText('1...Nf6', w / 2, h - 40); }
  return TAB;
}
function tablet(g, t, tMove) {
  const c = [11.2, 1.75, 5.2], R = { ry: -0.55, rx: 0.22 }, hw = 1.3, hh = 1.78;
  obox(g, c, [hw + 0.08, hh + 0.08, 0.07], '#0E0F11', R);
  const F = (u, v) => { const p = rot3([u, v, -0.075], R); return [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; };
  texQuad(g, tabletTex(t, tMove), F(-hw, hh), F(hw, hh), F(-hw, -hh));
  ab(g, [10.6, -0.35, 5.3], [11.8, -0.25, 6.2], '#1A1C20', { amb: 0.6 });
}
// a 2D diagram of the position Hikaru saw (the "puzzle" the phone photographs)
const DIAG = tex(720, 720, (x, w) => {
  const s = w / 8; x.fillStyle = '#F4F1EA'; x.fillRect(0, 0, w, w);
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#F4F1EA' : '#9AA3AB'; x.fillRect(f * s, (7 - r) * s, s, s); }
  for (const p of G[MEME].pieces) { const [fx, fz] = sqXZ(p.sq); drawPiece(x, p.t, p.c === 'b' ? 'k' : 'w', fx * s, (8 - fz + 0.5) * s - s * 0.05, s * 0.9); }
  x.strokeStyle = '#2A2E33'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, w - 6);
});
// the x-ray of one piece: the robot is its copper base (Chessnut ships spare bases; its own art shows the base lit up),
// and in it a motor, a battery, wheels and a sensor (the manufacturer's list). h: the drawn height of the piece, whose
// base is the bottom 18 % of it and 59 % of its height wide (pieces.js, base2)
function xray(g, P, h, t, t0) {
  const u = seg(t, t0 - 0.35, t0 - 0.05);
  if (u <= 0) return;
  const cx = P.x, by = P.y;
  g.save(); g.globalAlpha *= u; g.lineJoin = 'round';
  g.fillStyle = rgba('#0B1A1F', 0.55); g.beginPath(); g.roundRect(cx - h * 0.3, by - h * 0.19, h * 0.6, h * 0.19, h * 0.025); g.fill();  // the base turns to glass
  g.strokeStyle = MIND; g.fillStyle = rgba(MIND, 0.18); g.lineWidth = Math.max(2, h * 0.007); g.shadowColor = MIND; g.shadowBlur = 12;
  g.beginPath(); g.roundRect(cx - h * 0.3, by - h * 0.19, h * 0.6, h * 0.19, h * 0.025); g.stroke();
  g.beginPath(); g.roundRect(cx + h * 0.02, by - h * 0.16, h * 0.2, h * 0.075, h * 0.012); g.fill(); g.stroke();  // battery
  g.beginPath(); g.rect(cx + h * 0.22, by - h * 0.134, h * 0.014, h * 0.024); g.fill(); g.stroke();
  const mx = cx - h * 0.11, my = by - h * 0.112, mr = h * 0.045;
  g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill(); g.stroke();                                                  // motor
  for (let i = 0; i < 6; i++) { const a = t * 7 + i * 1.047; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a) * mr * 0.85, my + Math.sin(a) * mr * 0.85); g.stroke(); }
  for (const sd of [-1, 1]) {                                                                                    // wheels
    const wx = cx + sd * h * 0.2, wy = by - h * 0.036;
    g.beginPath(); g.arc(wx, wy, h * 0.03, 0, 7); g.fill(); g.stroke();
    const a = t * 9; g.beginPath(); g.moveTo(wx - Math.cos(a) * h * 0.024, wy - Math.sin(a) * h * 0.024); g.lineTo(wx + Math.cos(a) * h * 0.024, wy + Math.sin(a) * h * 0.024); g.stroke();
  }
  g.beginPath(); g.roundRect(cx - h * 0.075, by - h * 0.034, h * 0.15, h * 0.018, 2); g.fill(); g.stroke();      // sensor
  g.restore();
  return [['MOTOR', [mx, my]], ['BATTERY', [cx + h * 0.12, by - h * 0.122]], ['WHEELS', [cx + h * 0.2, by - h * 0.036]], ['SENSOR', [cx - h * 0.04, by - h * 0.025]]];
}
// a part named on the x-ray: a cream leader line from the part to a flat plate
function callout(g, text, [px, py], [lx, ly], u, col = CREAM) {
  if (u <= 0) return;
  const v = ease.out(clamp(u * 1.5)), ex = lerp(px, lx, v), ey = lerp(py, ly, v);
  g.save(); g.globalAlpha *= clamp(u * 2); g.lineCap = 'round';
  for (const [c, lw] of [['rgba(8,6,4,0.5)', 8], [col, 4]]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke(); }
  g.fillStyle = col; g.beginPath(); g.arc(px, py, 8, 0, 7); g.fill();
  g.restore();
  g.save(); g.font = sans(40, 900); g.letterSpacing = '2px'; const w = inkWidth(g, text) + 38; g.restore();
  plate(g, text, lx + (lx < px ? -w / 2 : w / 2), ly, { color: col, size: 40, a: clamp(u * 2), rot: 0, scale: lerp(0.94, 1, v) });
}

// ======================= THE BOARD IN HIS HEAD: a glass board in the dark, ghost pieces that play on their own =======================
function mindBg(g, t, { a = 1 } = {}) {
  const gr = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, H * 0.75); gr.addColorStop(0, '#0C2230'); gr.addColorStop(1, '#020507');
  g.save(); g.globalAlpha *= a; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  bokeh(g, t, { n: 16, seed: 21, y0: 0.05, y1: 0.95, colors: [MIND, '#2C8C9C', '#9FF3E3'], size: [30, 120], a: 0.12 * a, drift: 16 });
}
function glassBoard(g, t, { a = 1 } = {}) {
  if (B.E[1] <= 0) return;
  g.save(); g.globalAlpha *= a;
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { B.quad(g, f, r, f + 1, r + 1); g.fillStyle = (f + r) % 2 ? 'rgba(95,227,208,0.10)' : 'rgba(95,227,208,0.26)'; g.fill(); }
  g.strokeStyle = rgba(MIND, 0.65); g.lineWidth = 2; g.shadowColor = MIND; g.shadowBlur = 12; g.beginPath();
  for (let i = 0; i <= 8; i++) { line3(g, [i, 0, 0], [i, 0, 8]); line3(g, [0, 0, i], [8, 0, i]); }
  g.stroke(); g.lineWidth = 5; g.beginPath(); B.quad(g, -0.15, -0.15, 8.15, 8.15); g.stroke();
  g.restore();
}
const ghosts = (ps, extra = {}) => ps.map(p => ({ ...p, c: p.c === 'b' ? 'k' : p.c, alpha: (p.alpha ?? 1) * 0.82, glow: MIND, ...extra }));
function mindSet(g, t, { pieces = [], under = null, over = null, a = 1, focus = null } = {}) {
  mindBg(g, t, { a });
  glassBoard(g, t, { a });
  if (under) under(g);
  B.drawPieces(g, ghosts(pieces), { focus: focus ?? B.dist, dof: 1.2 });
  if (over) over(g);
}

// ======================= A WALL OF PATTERNS: thousands of little positions, each a cluster of a few pieces =======================
const CHUNKS = tex(2048, 2048, (x, w) => {
  const n = 16, s = w / n, R = rng(77), kinds = 'pnbrqk';
  x.fillStyle = '#071318'; x.fillRect(0, 0, w, w);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const ox = i * s + 6, oy = j * s + 6, q = (s - 12) / 4;
    for (let f = 0; f < 4; f++) for (let r = 0; r < 4; r++) { x.fillStyle = (f + r) % 2 ? '#1B3A40' : '#0F262C'; x.fillRect(ox + f * q, oy + r * q, q, q); }
    const m = 3 + Math.floor(R() * 4), used = new Set();
    for (let k = 0; k < m; k++) {
      const f = Math.floor(R() * 4), r = Math.floor(R() * 4); if (used.has(f * 4 + r)) continue; used.add(f * 4 + r);
      drawPiece(x, kinds[Math.floor(R() * (k ? 5 : 6))], R() < 0.5 ? 'w' : 'k', ox + (f + 0.5) * q, oy + (r + 1) * q - 2, q * 0.92);
    }
    x.strokeStyle = rgba(MIND, 0.5); x.lineWidth = 3; x.strokeRect(ox - 2, oy - 2, s - 8, s - 8);
  }
});
function patternWall(g, t) {
  mindBg(g, t);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x0 = 4 + i * 14 - 7, y0 = 4 + j * 14 + 7, flip = (i + j) % 2 !== 0;
    texQuad(g, CHUNKS, [flip ? x0 + 14 : x0, y0, 12], [flip ? x0 : x0 + 14, y0, 12], [flip ? x0 + 14 : x0, y0 - 14, 12]);
  }
}

// ======================= THE STREAMING ROOM: a desk, a monitor with his rating, Hikaru from behind =======================
const MON = makeCanvas(1280, 720), monx = MON.getContext('2d');
function monitorTex(t, { rating = 3342, gold = 0, tiles = 0, tT = 0, head = true } = {}) {  // head: the header words (off in close-ups, where the frame cuts them)
  const x = monx, w = 1280, h = 720;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#0D0B16'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#17142A'; x.fillRect(0, 0, w, 84); x.font = sans(36, 800); x.letterSpacing = '4px'; x.textAlign = 'left'; x.fillStyle = '#CFC8F2';
  if (head) { x.fillText('BLITZ RATING', 40, 56); x.textAlign = 'right'; x.fillStyle = '#FF4A6A'; x.fillText('● LIVE', w - 40, 56); }
  if (tiles > 0) {  // the win tiles: a row of green W squares appearing one by one
    const cols = 9, s = 108, ox = (w - cols * (s + 14)) / 2 + 7, oy = 120;
    for (let i = 0; i < Math.min(34, tiles); i++) {
      const c = i % cols, r = Math.floor(i / cols), k = ease.back(clamp((tiles - i) * 1.2));
      x.save(); x.translate(ox + c * (s + 14) + s / 2, oy + r * (s + 14) + s / 2); x.scale(k, k);
      x.fillStyle = '#3FBF5F'; x.beginPath(); x.roundRect(-s / 2, -s / 2, s, s, 12); x.fill();
      x.fillStyle = '#F4FFF6'; x.font = sans(64, 900); x.letterSpacing = '0px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('W', 0, 4); x.restore();
    }
    x.textBaseline = 'alphabetic';
    return MON;
  }
  // the rating curve from 3342 (15 September) upward, and the number
  x.strokeStyle = rgba(gold > 0 ? GOLD : '#8E6CFF', 0.9); x.lineWidth = 8; x.lineJoin = 'round'; x.beginPath();
  const n = 40, f = clamp((rating - 3342) / (3500 - 3342));
  for (let i = 0; i <= n; i++) { const u = i / n * Math.max(0.02, f), y = 640 - u * 380 - Math.sin(i * 1.7) * 14 * (1 - u); i ? x.lineTo(80 + i / n * 1120 * Math.max(0.05, f), y) : x.moveTo(80, y); }
  x.stroke();
  x.textAlign = 'center'; x.font = sans(220, 900); x.letterSpacing = '0px';
  x.fillStyle = gold > 0 ? GOLD : '#F4F2EE'; x.shadowColor = gold > 0 ? GOLD : 'transparent'; x.shadowBlur = 40 * gold;
  x.fillText(String(Math.round(rating)), w / 2, 400); x.shadowBlur = 0;
  if (gold > 0) { x.font = sans(48, 900); x.letterSpacing = '8px'; x.fillStyle = GOLD; x.globalAlpha = gold; x.fillText('NEW RECORD', w / 2, 480); x.globalAlpha = 1; }
  return MON;
}
const MONQ = { tl: [0.55, 4.35, 5.98], tr: [7.45, 4.35, 5.98], bl: [0.55, 0.45, 5.98] };
function stream(g, t, screen, { glow = 0 } = {}) {
  room(g, B, GAMER, { t });
  table(g, B, { table: ['#1A1726', '#0E0C16', '#141120'] }, { x1: 8.4 });
  ab(g, [0.4, 0.3, 6.0], [7.6, 4.5, 6.35], '#07060C', { amb: 0.7 });
  ab(g, [3.6, -0.35, 6.2], [4.4, 0.3, 6.6], '#100E18', { amb: 0.6 });
  texQuad(g, screen, MONQ.tl, MONQ.tr, MONQ.bl);
  const p = B.project(4, 2.4, 5.9); rim(g, p.x, p.y, p.s * 6, glow > 0 ? GOLD : VIOLET, 0.16 + glow * 0.2);
  ab(g, [2.2, -0.35, 2.4], [5.8, -0.25, 3.6], '#1C1A26', { amb: 0.6 });  // the keyboard
  ab(g, [6.4, -0.35, 2.6], [7.2, -0.22, 3.6], '#1C1A26', { amb: 0.6 });  // the mouse pad and mouse
  const back = seated(g, B, 'hikaru', 'focus', t, { z: -1.4, face: 1, hands: false });
  back();
}

// ======================= TWO RATING TOWERS: 3500 against 3400, from a 3000 floor =======================
function towers(g, t, { hik = 1, mag = 1, gap = 0 } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0B0A14'); gr.addColorStop(1, '#030306'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  tiled(g, [-20, 0, -20], [48, 0, 0], [0, 0, 48], { color: '#0C0B14', grout: 'rgba(142,108,255,0.14)', tu: 2, tv: 2 });
  const hH = 12 * hik, mH = 12 * (400 / 500) * mag;  // 3000 + 500 vs 3000 + 400
  const cols = [[0.0, 2.4, hH, GOLD, 'HIKARU', '3500', hik], [5.6, 8.0, mH, '#7D8AA0', 'MAGNUS', '3400', mag]];
  for (const [x0, x1, h, col, name, num, u] of cols.sort((a, b) => depth((b[0] + b[1]) / 2, 0, 4) - depth((a[0] + a[1]) / 2, 0, 4))) {
    if (h <= 0.01) continue;
    ab(g, [x0, 0, 3], [x1, h, 5], col, { amb: 0.55, spec: 0.3 });
    tag3(g, (x0 + x1) / 2, h + 1.3, 4, num, col === GOLD ? GOLD : CREAM, clamp(u * 1.2 - 0.2));
    tag3(g, (x0 + x1) / 2, -1.4, 2.6, name, col === GOLD ? GOLD : CREAM, clamp(u * 3));
  }
  if (gap > 0) {  // the step between the tops: a dashed line from the higher one, a red bracket over the lower one
    g.save(); g.globalAlpha *= gap; g.strokeStyle = rgba(GOLD, 0.7); g.lineWidth = 4; g.setLineDash([14, 12]); g.beginPath(); line3(g, [2.4, hH, 4], [8.0, hH, 4]); g.stroke(); g.setLineDash([]);
    g.strokeStyle = RED; g.lineWidth = 7; g.beginPath(); line3(g, [8.6, mH, 4], [8.6, hH, 4]); line3(g, [8.2, hH, 4], [9.0, hH, 4]); line3(g, [8.2, mH, 4], [9.0, mH, 4]); g.stroke(); g.restore();
  }
}

// ======================= BARCELONA, JANUARY 2026: the blindfold game on a stage (a dark table, no board) =======================
function barcelona(g, t, { em = 'blind', eh = 'blind' } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2A1640'); gr.addColorStop(1, '#0B0612'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  tiled(g, [-14, FLOOR_Y, 16], [36, 0, 0], [0, 22, 0], { color: '#36205A', grout: 'rgba(0,0,0,0.3)', tu: 3, tv: 22, lw: 4,
    light: g2 => { const p = B.project(4, 5, 16), r = p.s * 14, q = g2.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); q.addColorStop(0, 'rgba(200,140,255,0.42)'); q.addColorStop(1, 'rgba(190,120,255,0)'); g2.fillStyle = q; g2.fillRect(0, 0, W, H); } });
  tiled(g, [-14, FLOOR_Y, -16], [36, 0, 0], [0, 0, 32], { color: '#0E0818', grout: 'rgba(255,255,255,0.03)', tu: 4, tv: 4 });
  spotCone(g, B, { top: [4, 16, 4], base: [4, -0.3, 4], r0: 0.6, r1: 7, color: '#EBD9FF', a: 0.2, t, dust: 30 });
  pool(g, B, 4, -0.34, 4, 6, '#EBD9FF', 0.16);
  const mb = seated(g, B, 'magBlind', em, t, { z: -1.4, face: 1, hands: false });
  const hb = seated(g, B, 'hikBlind', eh, t, { z: 9.3, face: -1, hands: false });
  table(g, B, { table: ['#2E2838', '#16131C', '#201C28'] }, { x1: 8.4 });
  mb(); hb();
}

// ---------- HUD pieces: the stopwatch, the AD tag ----------
// a number in the counter's type (a dark extrusion under the face) with every digit in a cell of the same width,
// so a running time stays put; y is the baseline
function clockNum(g, txt, cx, y, size, color) {
  g.save(); g.font = sans(size, 900); g.letterSpacing = '0px'; g.textAlign = 'center'; g.lineJoin = 'round';
  const dw = Math.max(...'0123456789'.split('').map(d => g.measureText(d).width)), pw = g.measureText('.').width * 1.15;
  const cells = [...txt].map(ch => ch === '.' ? pw : dw), total = cells.reduce((s, c) => s + c, 0), ext = Math.max(3, Math.round(size * 0.055));
  const pass = (dy, fill) => { let x = cx - total / 2; [...txt].forEach((ch, i) => { const c = x + cells[i] / 2; g.strokeText(ch, c, y + dy); g.fillStyle = fill; g.fillText(ch, c, y + dy); x += cells[i]; }); };
  g.lineWidth = size * 0.085; g.strokeStyle = 'rgba(16,11,7,0.9)';
  for (let i = ext; i >= 1; i--) pass(i, 'rgba(16,11,7,0.9)');
  pass(0, color);
  g.restore();
  qaRect(g, cx - total / 2, y - size * 0.72, total, size * 0.74, 'text', txt);
}
// the stopwatch of the meme as a big counter: the time in cream while it runs, gold when it stops; SECONDS on a gold tag
function stopwatch(g, v, { y = 330, done = false, a = 1, scale = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(scale, scale); g.translate(-W / 2, -y);
  clockNum(g, Math.min(v, 2.13).toFixed(2), W / 2, y, 196, done ? GOLD : CREAM);
  plate(g, 'SECONDS', W / 2, y + 58, { color: GOLD, size: 32, rot: 0 });
  g.restore();
}
const NUTC = '#1A1C20';  // the graphite of the Chessnut frame: the AD chip and the name plate
function adTag(g, a = 1) { plate(g, 'AD', 96, 146, { color: NUTC, size: 26, a: a * 0.92, rot: 0 }); }
// the sponsor's name on a flat graphite plate (rule 50): its logo — the official knight as the C, HESSNUT — and MOVE
function nutPlate(g, y, { a = 1, scale = 1, dy = 0, blur = 0, cap = 40 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y + dy); g.rotate(-0.018); g.scale(scale, scale);
  if (blur > 0.3) g.filter = `blur(${blur.toFixed(1)}px)`;
  g.font = `600 ${(cap / 0.7).toFixed(1)}px Montserrat`; g.letterSpacing = `${(cap * 0.05).toFixed(1)}px`;
  const lw = nutLogo(g, 0, 0, cap, '#FFFFFF', { draw: false }), gap = cap * 0.5, mw = g.measureText('MOVE').width - cap * 0.05;
  const w = lw + gap + mw + cap * 1.3, hp = cap * 2.1, x0 = -w / 2, lx = x0 + cap * 0.65, base = cap / 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.roundRect(x0, -hp / 2 + Math.max(4, cap * 0.18), w, hp, 5); g.fill();
  g.fillStyle = NUTC; g.beginPath(); g.roundRect(x0, -hp / 2, w, hp, 5); g.fill();
  qaRect(g, x0, -hp / 2, w, hp, 'text', 'CHESSNUT MOVE');
  nutLogo(g, lx, base, cap, '#FFFFFF');
  g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('MOVE', lx + lw + gap, base);
  g.restore();
}
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// the white share of an engine bar (the lichess win-chance curve), for his eval bar in "he IS the engine"
const evalFrac = ev => 0.5 + (2 / (1 + Math.exp(-0.368 * ev)) - 1) / 2;

// ======================= v3: HIKARU'S FACECAM — the stream room seen from his monitor (the camera is the webcam) =======================
// The wall behind him: acoustic tiles with a neon knight, LED strips along the top and the bottom; violet as in the
// stream shots, teal when he becomes the engine, red for a moment when the captcha fails.
const HIK_C = '#B48CFF';
const wallTex = glow => tex(1024, 660, (x, w, h) => {
  x.fillStyle = '#141026'; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
    const gr = x.createLinearGradient(i * 128, j * 132, i * 128 + 128, j * 132 + 132); gr.addColorStop(0, '#2A2350'); gr.addColorStop(1, '#1A1533');
    x.fillStyle = gr; x.fillRect(i * 128 + 6, j * 132 + 6, 116, 120);
  }
  x.shadowColor = glow; x.shadowBlur = 60; drawPiece(x, 'n', 'w', w * 0.79, h * 0.62, 330, {}); drawPiece(x, 'n', 'w', w * 0.79, h * 0.62, 330, {}); x.shadowBlur = 0;
});
const WALL_V = wallTex(HIK_C), WALL_T = wallTex(MIND);
const WALLQ = { tl: [11, 10.4, -11.95], tr: [-3, 10.4, -11.95], bl: [11, 1.4, -11.95] };
function facecam(g, t, { e = 'focus', power = 0, red = 0, behind = null } = {}) {
  room(g, B, GAMER, { t });
  texQuad(g, WALL_V, WALLQ.tl, WALLQ.tr, WALLQ.bl);
  if (power > 0) texQuad(g, WALL_T, WALLQ.tl, WALLQ.tr, WALLQ.bl, { a: power });
  const led = red > 0 ? mix(HIK_C, '#FF4A3D', red) : mix(HIK_C, MIND, power);
  ledStrip(g, B, [16, 10.7, -11.9], [-8, 10.7, -11.9], led, t);
  ledStrip(g, B, [16, 0.9, -11.9], [-8, 0.9, -11.9], power > 0 ? mix(TEAL, MIND, power) : TEAL, t, { phase: 1 });
  pool(g, B, 4, 5.4, -11.9, 9, led, 0.16 + 0.3 * power + 0.2 * red, true);
  if (behind) behind(g);
  chair(g, B, 4, -1.9, { face: 1, color: '#2A2240' });
  seated(g, B, 'hikaru', e, t, { z: -1.4, face: 1, hands: false });
  table(g, B, { table: ['#2A2540', '#141120', '#1C1830'] }, { x1: 8.4 });
  ab(g, [2.2, -0.35, 0.2], [5.8, -0.25, 1.3], '#1C1A26', { amb: 0.6 });  // the keyboard, in front of him
  ab(g, [6.4, -0.35, 0.3], [7.2, -0.22, 1.3], '#1C1A26', { amb: 0.6 });  // the mouse
  // the monitor's cool light on him (it is where the camera is)
  const p = B.project(4, 3.1, -1.4); rim(g, p.x, p.y, p.s * 3.2, red > 0 ? mix('#DDEBFF', '#FF4A3D', red) : mix('#DDEBFF', MIND, power), 0.12 + 0.18 * power + 0.2 * red);
}
// where his eyes are on screen (characters.js draws them at ±38, -2 in head units)
function eyesAt(x = 4, y = 3.1, z = -1.4) { const p = B.project(x, y, z), s = p.s / 100 * 1.05; return [[p.x - 38 * s, p.y - 2 * s], [p.x + 38 * s, p.y - 2 * s], s]; }

// ======================= THE CAPTCHA: a white card on his stream, a cursor, a click, and it fails =======================
const CARD = { y: 220, w: 820, h: 290, bar: 72 };
function cursorAt(g, x, y, k = 1) {
  g.save(); g.translate(x, y); g.scale(1.7 * k, 1.7 * k);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 46); g.lineTo(11, 35.5); g.lineTo(19.5, 54); g.lineTo(28, 50); g.lineTo(19.5, 32); g.lineTo(34, 32); g.closePath();
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = '#FFFFFF'; g.fill();
  g.shadowColor = 'transparent'; g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = '#111317'; g.stroke(); g.restore();
}
function captcha(g, t, { t0, tClick, tFail }) {
  if (t < t0) return;
  const u = ease.out(clamp((t - t0) / 0.28)), f = t >= tFail ? ease.out(clamp((t - tFail) / 0.18)) : 0;
  const shake = t >= tFail ? Math.sin((t - tFail) * 62) * 22 * Math.exp(-(t - tFail) * 5) : 0;
  const cw = CARD.w, ch = CARD.h + CARD.bar * f, cx = W / 2 + shake, top = CARD.y + (1 - u) * 18, L = cx - cw / 2;
  g.save(); g.globalAlpha *= u; g.translate(cx, top + ch / 2); g.scale(lerp(0.94, 1, u), lerp(0.94, 1, u)); g.translate(-cx, -(top + ch / 2));
  g.shadowColor = 'rgba(6,4,14,0.45)'; g.shadowBlur = 34; g.shadowOffsetY = 14; g.fillStyle = '#FFFFFF';
  g.beginPath(); g.roundRect(L, top, cw, ch, 26); g.fill(); g.shadowColor = 'transparent';
  qaRect(g, L, top, cw, ch, 'text', 'captcha');
  g.save(); g.beginPath(); g.roundRect(L, top, cw, ch, 26); g.clip();
  g.textBaseline = 'middle'; g.textAlign = 'center'; g.font = sans(36, 900); g.letterSpacing = '5px'; g.fillStyle = '#4B5563';
  inkText(g, 'VERIFY YOU ARE HUMAN', cx, top + 62);
  g.fillStyle = '#E8EAEE'; g.fillRect(L + 40, top + 104, cw - 80, 3);
  // the checkbox and its label
  const bx = L + 84, by = top + 190, bs = 104;
  if (t >= tFail) {
    g.fillStyle = '#E5484D'; g.beginPath(); g.roundRect(bx - bs / 2, by - bs / 2, bs, bs, 14); g.fill();
    const k = ease.back(clamp((t - tFail) / 0.22)) * 30; g.strokeStyle = '#FFFFFF'; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx - k, by - k); g.lineTo(bx + k, by + k); g.moveTo(bx + k, by - k); g.lineTo(bx - k, by + k); g.stroke();
  } else {
    g.fillStyle = '#FFFFFF'; g.strokeStyle = '#A3AAB4'; g.lineWidth = 6; g.beginPath(); g.roundRect(bx - bs / 2, by - bs / 2, bs, bs, 14); g.fill(); g.stroke();
    if (t >= tClick) {  // the spinner
      const a0 = (t - tClick) * 11; g.strokeStyle = '#3B82F6'; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.arc(bx, by, 30, a0, a0 + 4.2); g.stroke();
    }
  }
  g.textAlign = 'left'; g.font = sans(60, 800); g.letterSpacing = '0px'; g.fillStyle = '#1F2328'; g.fillText("I'm not a robot", bx + bs / 2 + 40, by + 4);
  if (f > 0) {  // the red bar slides out under the card
    g.fillStyle = '#E5484D'; g.fillRect(L, top + CARD.h, cw, CARD.bar * f + 2);
    g.globalAlpha *= f; g.textAlign = 'center'; g.font = sans(40, 900); g.letterSpacing = '5px'; g.fillStyle = '#FFFFFF';
    inkText(g, 'VERIFICATION FAILED', cx, top + CARD.h + CARD.bar / 2 + 2);
  }
  g.restore(); g.restore();
  // the cursor: in from the lower right, onto the box, a click
  const m = ease.inOut(clamp((t - t0 - 0.15) / (tClick - 0.1 - t0 - 0.15)));
  const px = lerp(W * 0.86, bx + 6, m) + shake * 0.6, py = lerp(1010, by + 4, m), press = t >= tClick && t < tClick + 0.12 ? 0.86 : 1;
  if (t >= tClick && t < tClick + 0.4) { const r = seg(t, tClick, tClick + 0.4, ease.out); g.save(); g.globalAlpha *= 1 - r; g.strokeStyle = '#3B82F6'; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 20 + r * 70, 0, 7); g.stroke(); g.restore(); }
  cursorAt(g, px, py, press);
}

// ======================= THE SEA: Stockfish, a fish (as the author's Mittens video has it) =======================
// a deep blue with light from the surface; a sand floor that fades into the blue, swaying weed, bubbles, specks
const fogSea = (col, d) => mix(col, '#185E96', clamp((d - 6) / 34) * 0.92);
const WEED = (() => { const r = rng(57), a = []; for (let i = 0; i < 26; i++) a.push({ x: -14 + r() * 36, z: 2 + r() * 34, h: 1.6 + r() * 3.4, ph: r() * 6, c: r() < 0.5 ? '#2F8A5E' : '#3E9C4E' }); return a; })();
const ROCKS = (() => { const r = rng(91), a = []; for (let i = 0; i < 9; i++) a.push({ x: -10 + r() * 28, z: 4 + r() * 30, r: 0.6 + r() * 1.4 }); return a; })();
const SEAY = -6;
function sea(g, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#62C9EC'); gr.addColorStop(0.42, '#2384C0'); gr.addColorStop(1, '#0E3F73');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // the floor, in strips that fog into the water with distance
  for (let z = 44; z > -6; z -= 2) {
    const d = depth(4, SEAY, z + 1); if (d < 0.5) continue;
    if (B.poly(g, [[-30, SEAY, z], [40, SEAY, z], [40, SEAY, z + 2], [-30, SEAY, z + 2]])) { g.fillStyle = fogSea(z % 4 === 0 ? '#D8C48E' : '#CFBA82', d); g.fill(); }
  }
  for (const k of ROCKS) { const d = depth(k.x, SEAY, k.z); if (d < 1) continue; const p = B.project(k.x, SEAY, k.z); g.fillStyle = fogSea('#5D6F7A', d); g.beginPath(); g.ellipse(p.x, p.y, k.r * p.s, k.r * p.s * 0.45, 0, Math.PI, 0); g.fill(); }
  for (const k of [...WEED].sort((a, b) => depth(b.x, SEAY, b.z) - depth(a.x, SEAY, a.z))) {
    const d = depth(k.x, SEAY, k.z); if (d < 1) continue;
    const p0 = B.project(k.x, SEAY, k.z), sw = Math.sin(t * 1.3 + k.ph) * 0.5, p1 = B.project(k.x + sw * 0.5, SEAY + k.h * 0.55, k.z), p2 = B.project(k.x + sw, SEAY + k.h, k.z);
    g.strokeStyle = fogSea(k.c, d); g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.28 * p0.s);
    g.beginPath(); g.moveTo(p0.x, p0.y); g.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); g.stroke();
  }
  // light shafts from the surface
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const x0 = -140 + i * 230 + Math.sin(t * 0.5 + i * 1.9) * 50, w0 = 70 + (i * 41) % 80;
    const lg = g.createLinearGradient(0, 0, 0, H * 0.85); lg.addColorStop(0, 'rgba(225,248,255,0.19)'); lg.addColorStop(1, 'rgba(225,248,255,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x0, -10); g.lineTo(x0 + w0, -10); g.lineTo(x0 + w0 + 330, H * 0.85); g.lineTo(x0 + 250, H * 0.85); g.closePath(); g.fill();
  }
  g.restore();
}
// specks and bubbles in the water around the camera (3D points: they slide past as the camera drifts)
function seaSpecks(g, t, { burst = null } = {}) {
  const r = rng(33);
  for (let i = 0; i < 70; i++) {
    const x = -8 + r() * 24, z = -1 + r() * 26, y = SEAY + ((r() * 14 + t * (0.15 + r() * 0.2)) % 14);
    if (depth(x, y, z) < 1) continue; const p = B.project(x, y, z);
    g.fillStyle = `rgba(230,245,255,${(0.25 + 0.3 * r()).toFixed(2)})`; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, 0.035 * p.s), 0, 7); g.fill();
  }
  const bub = (x, y, z, rr) => { if (depth(x, y, z) < 1) return; const p = B.project(x, y, z), R = Math.max(3, rr * p.s);
    g.strokeStyle = 'rgba(235,250,255,0.75)'; g.lineWidth = Math.max(1.5, R * 0.14); g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.stroke();
    g.fillStyle = 'rgba(235,250,255,0.18)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(p.x - R * 0.35, p.y - R * 0.35, R * 0.22, 0, 7); g.fill(); };
  const r2 = rng(71);
  for (let i = 0; i < 22; i++) { const x = -5 + r2() * 18, z = 1 + r2() * 16, sp = 0.6 + r2() * 0.8, y = SEAY + ((r2() * 13 + t * sp) % 13); bub(x + Math.sin(t * 2 + i) * 0.08, y, z, 0.06 + r2() * 0.1); }
  if (burst) { const [bx, by, bz, t0] = burst, dt = t - t0; if (dt > 0 && dt < 1.4) { const r3 = rng(19); for (let i = 0; i < 18; i++) { const a = r3() * 6.28, v = 0.6 + r3() * 1.6; bub(bx + Math.cos(a) * v * dt * 0.6 + 0.6 * r3(), by + dt * (1.2 + r3() * 1.4) + Math.sin(a) * 0.3, bz + (r3() - 0.5) * 0.8, 0.07 + r3() * 0.12); } } }
}
// the Stockfish fish (the logo's cod, cut out), facing left: drawn in thin vertical strips that sway more toward the
// tail, so the body swims; len = its length in pixels
const FISHC = makeCanvas(FISH.width, Math.ceil(FISH.height * 1.3)), fishx = FISHC.getContext('2d');
function fishPhoto(g, x, y, len, t, { rot = 0, wag = 1 } = {}) {
  const iw = FISH.width, ih = FISH.height, ch = FISHC.height, n = 48;
  fishx.setTransform(1, 0, 0, 1, 0, 0); fishx.clearRect(0, 0, iw, ch);
  for (let i = 0; i < n; i++) {  // the body in strips, each shifted on the swimming wave (no shadow here: it would band)
    const u = i / n, x0 = Math.floor(u * iw), x1 = Math.floor((i + 1) / n * iw), amp = ih * 0.055 * wag * Math.pow(u, 1.7);
    fishx.drawImage(FISH, x0, 0, x1 - x0, ih, x0, (ch - ih) / 2 + Math.sin(t * 8.5 - u * 4.2) * amp, x1 - x0, ih);
  }
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(len / iw, len / iw);
  g.shadowColor = 'rgba(4,30,60,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 26;
  g.drawImage(FISHC, -iw / 2, -ch / 2);
  g.restore();
}
function smallCredit(g, text, y) {
  g.save(); g.font = sans(19, 700); g.letterSpacing = '2px'; const w = inkWidth(g, text) + 36;
  g.fillStyle = 'rgba(4,24,48,0.55)'; g.beginPath(); g.roundRect(W / 2 - w / 2, y - 18, w, 36, 18); g.fill();
  g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; inkText(g, text, W / 2, y + 1); g.restore();
}

// ======================= HE IS THE ENGINE: his own evaluation bar on the stream overlay, rays behind him =======================
function hudEval(g, t, { f = 1, ev = 2.53, x = 52, y0 = 360, h = 860, w = 70 } = {}) {
  if (f <= 0) return;
  const u = ease.out(clamp(f / 0.35)), wf = lerp(0.5, evalFrac(ev), ease.inOut(clamp((f - 0.25) / 0.75)));
  g.save(); g.globalAlpha *= u; g.translate(-(1 - u) * 120, 0);
  g.shadowColor = MIND; g.shadowBlur = 40 * u; g.fillStyle = '#2A2D33'; g.beginPath(); g.roundRect(x, y0, w, h, 10); g.fill(); g.shadowBlur = 0;
  g.save(); g.beginPath(); g.roundRect(x, y0, w, h, 10); g.clip();
  g.fillStyle = '#F4F3EE'; g.fillRect(x, y0 + h * (1 - wf), w, h * wf + 2);
  g.restore();
  g.strokeStyle = rgba(MIND, 0.9); g.lineWidth = 5; g.beginPath(); g.roundRect(x, y0, w, h, 10); g.stroke();
  g.fillStyle = '#2A2D33'; g.font = sans(26, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '0px';
  inkText(g, ev.toFixed(1), x + w / 2, y0 + h - 30);
  g.restore();
}
function powerBehind(g, t, t0, x, y, pw) {  // rays from behind his head
  if (t < t0) return;
  g.save(); g.globalCompositeOperation = 'screen'; rays(g, x, y, t, { n: 16, color: MIND, a: 0.24 * pw, len: 1800 }); g.restore();
}
function powerFront(g, t, t0, x, y) {  // speed lines, two rings
  if (t < t0) return;
  const d = t - t0;
  if (d < 0.7) { g.save(); g.globalCompositeOperation = 'screen'; speedlines(g, x, y, t, { a: 0.5 * (1 - d / 0.7), n: 40, r0: 430, color: '#E6FFFB' }); g.restore(); }
  shockwave(g, x, y, t, t0, { r0: 60, r1: 950, life: 0.6, color: MIND, lw: 16, squash: 1 });
  shockwave(g, x, y, t, t0 + 0.12, { r0: 40, r1: 650, life: 0.55, color: '#E6FFFB', lw: 8, squash: 1 });
}
// "that's not even the scary part": the edges of the frame close in
function dread(g, u) {
  if (u <= 0) return;
  const gr = g.createRadialGradient(W / 2, H * 0.38, H * lerp(0.5, 0.14, u), W / 2, H * 0.38, H * 0.6);
  gr.addColorStop(0, 'rgba(14,2,6,0)'); gr.addColorStop(1, `rgba(14,2,6,${(0.93 * u).toFixed(3)})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
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
  const bdg = (g, t, text, t0, { y = 230, color = CREAM, size = 46, sub = null } = {}) => { if (t >= t0) badge(g, text, W / 2, y, { color, size, sub, ...popIn(t, t0) }); };
  const meme = piecesAt(G, MEME), memeP = withParked(MEME);
  const HOMEG = 'village', SKY = '#5DB8F0';  // the grade of the sunny room; Hikaru's colour on labels

  // ======================= HOOK (rule 42): the payoff first — Hikaru's grimace over the board, the stopwatch at 2.13 =======================
  const clkS = s('clocks'), carlT = w('clocks', 'thirty-two');
  const hookHud = (g, lt, t) => { heading(g, 'HE KNEW IN', 150, 1, { size: 44, spacing: 6 }); stopwatch(g, 2.13, { y: 340, done: true }); };
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.093, -0.211, 8.83, [-2.6, 3.0, 4.0])], [len(sh), K(PI / 2 - 0.12, -0.215, 8.1, [-2.6, 3.05, 4.0])]], { t, e: x => x });
    baku(g, t, { hik: { x: HIKX, z: HIKZ, e: GRIMACE }, clock: { l: 24.0, r: 1929 }, focus: 8, dof: 0.5, players: false });
  }, { hud: hookHud, grade: 'neutral' });
  cue(0, 'whoosh_deep', 0.3); cue(0, 'murmur', 0.22); cue(0.05, 'reveal_bell', 0.3);

  // ======================= THE CLOCKS: the wide broadcast angle; 0:30 against 32:09; Hikaru gets up at the next table =======================
  const tagsOver = (g, t) => {
    tag3(g, 4, 6.6, -1.4, 'KEYMER 0:30', RED, seg(t, clkS + 1.4, clkS + 1.7, x => x));
    tag3(g, 4, 6.6, 9.3, 'MAGNUS 32:09', CREAM, seg(t, carlT, carlT + 0.3, x => x));
  };
  shot(w('clocks', 'magnus') - 0.12, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.05, 0.12, 24, [2, 1.8, 3.95])], [len(sh), K(PI / 2 + 0.03, 0.115, 22.6, [1.6, 1.9, 3.9])]], { t, e: x => x });
    baku(g, t, { hik: hikPose(t), over: null });
    tagsOver(g, t);
  }, { hud: (g, lt, t) => placeStamp(g, lt, 'Baku', 'WORLD CUP 2023', { y: 200, t0: 0.15 }) });
  cue(w('clocks', 'magnus') - 0.16, 'whoosh_fast', 0.3); cue(clkS + 1.45, 'sparkle_pop', 0.25); cue(carlT, 'sparkle_pop', 0.25);
  for (let x = 1.6; x < 6.4; x += 1) cue(x, 'clock_tick', 0.16);
  cue(WALK0 - 0.1, 'fabric', 0.3); cue(WALK0 + 0.1, 'footsteps', 0.35);

  // ======================= HIKARU WALKED BY: he arrives between the players; the stopwatch starts =======================
  const tmS = s('timed'), hikT = w('timed', 'hikaru'), walkT = w('timed', 'walked'), netT = w('timed', 'internet'), t213 = w('timed', '213');
  const swHud = y => (g, lt, t) => { if (t >= walkT - 0.01) stopwatch(g, t - (walkT - 0.01), { y, done: t >= t213, scale: t >= t213 ? 1 + 0.12 * (1 - seg(t, t213, t213 + 0.25)) : 1 }); };
  shot(tmS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.06, 0.2, 15.5, [-1.4, 3.0, 3.4])], [len(sh), K(PI / 2 + 0.04, 0.18, 14, [-1.6, 3.2, 3.6])]], { t, e: x => x });
    baku(g, t, { hik: hikPose(t) });
    tag3(g, hikPose(t).x, 6.9, hikPose(t).z, 'HIKARU', SKY, seg(t, hikT, hikT + 0.3, x => x) * (1 - seg(t, walkT + 0.6, walkT + 0.9)));
  }, { hud: swHud(330) });
  cue(hikT, 'sparkle_pop', 0.25); cue(walkT, 'clock_press', 0.5);
  // ======================= THE INTERNET TIMED IT: a slow push in on him looking down =======================
  shot(netT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.147, -0.194, 9.07, [-2.6, 3.0, 4.0])], [len(sh), K(PI / 2 + 0.12, -0.2, 7.3, [-2.6, 3.25, 4.0])]], { t, e: x => x });
    baku(g, t, { hik: hikPose(t), focus: 8, dof: 0.5 });
  }, { hud: swHud(330) });
  for (let x = walkT + 0.5; x < t213 - 0.1; x += 0.5) cue(x, 'clock_tick', 0.22);
  // ======================= 2.13: the grimace, from below; the stopwatch stops =======================
  const seeT = w('timed', 'see'), magT = w('timed', 'magnus'), losT = w('timed', 'losing');
  shot(t213, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.1, -0.16, 7.2, [-2.6, 4.25, 4.05])], [len(sh), K(PI / 2 - 0.14, -0.18, 6.4, [-2.6, 4.3, 4.05])]], { t, e: x => x, bump: lt < 0.25 ? 1 : 0 });
    baku(g, t, { hik: hikPose(t), focus: 6.5, players: false });
    if (lt < 0.2) flashTint(g, '#FFE9B8', 0.4 * (1 - lt / 0.2));
  }, { hud: swHud(330) });
  cue(t213 - 0.32, 'revswell', 0.8); cue(t213 - 0.004, 'boom', 0.8); cue(t213, 'reveal_bell', 0.45); cue(t213 + 0.05, 'gasp', 0.25);
  // ======================= TO SEE MAGNUS WAS LOSING: Carlsen, fist at his mouth =======================
  shot(seeT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.3, 0.08, 7.6, [4, 3.0, 9.3])], [len(sh), K(PI / 2 - 0.26, 0.07, 6.6, [4, 3.05, 9.3])]], { t, e: x => x });
    baku(g, t, { hik: hikPose(t), focus: 6.8 });
    tag3(g, 4, 5.35, 9.3, 'LOSING', RED, seg(t, losT, losT + 0.25, x => x), { minY: 500 });
  }, { trans: 'whip', hud: swHud(330) });
  cue(seeT - 0.16, 'whoosh_fast', 0.3); cue(losT, 'sting', 0.4);

  // ======================= THE CLIP ON A TV: we pull back from it into a living room; our board sets up the position =======================
  const sawS = s('saw'), whatT = w('saw', 'what'), kniT = w('saw', 'knight'), hitT = w('saw', 'hitting'), twoT = w('saw', 'two'), pawT = w('saw', 'pawns');
  const oneT = w('saw', 'one'), fellT = w('saw', 'fell'), twT = w('saw', 'twenty'), resT = w('saw', 'resigned');
  const tvA = T.e('timed') + 0.03;  // just after the phrase ends
  const feedBaku = t => {  // the broadcast angle of the clip, drawn into the TV's frame
    B.setCam(K(PI / 2 + 0.05, 0.1, 23.5, [2, 2.6, 3.95])); feedx.setTransform(1, 0, 0, 1, 0, 0);
    baku(feedx, t, { hik: hikPose(t) });
  };
  const SET0 = 10.75, SET1 = 11.8, REW0 = whatT + 0.45;
  const homeTV = t => t < SET0 ? withParked(0) : t < REW0 ? drive(withParked(0), memeP, t, SET0, 0.55, { stagger: 0.45, park: PARK, fade: false }) : null;
  shot(tvA, (g, lt, t, sh) => {
    feedBaku(t);
    rig(B, lt, [[0, K(0, 0.02, 8.65, TVC)], [1.1, K(-0.11, 0.34, 16, [3.45, 2.2, 7.5]), ease.inOut], [len(sh), K(-0.19, 0.42, 15, [3.25, 1.2, 6.5])]], { t });
    const ps = t < REW0 ? homeTV(t) : drive(memeP, withParked(72), t, REW0, 0.35, { stagger: 0.1, park: PARK, fade: false });
    home(g, t, { pieces: ps, feed: 1 });
  }, { trans: 'zoom', grade: HOMEG, hud: (g, lt, t) => { if (t >= REW0) plate(g, '◀◀  REWIND', W / 2, 240, { color: CREAM, size: 46, ...popIn(t, REW0), a: 1 - seg(t, REW0 + 0.45, REW0 + 0.6) }); } });
  cue(tvA, 'whoosh_deep', 0.35); cue(SET0, 'whirr', 0.4); for (let i = 0; i < 6; i++) cue(SET0 + 0.08 + i * 0.12, 'piece_slide', 0.18); cue(REW0, 'whirr', 0.35); cue(REW0, 'whoosh_soft', 0.25);

  // ======================= A KNIGHT HITTING TWO PAWNS AT ONCE: 37.Nd6! =======================
  const NDA = kniT - SLIDE;
  shot(kniT - 0.2, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.25, 0.9, 11.2, [3.75, 0, 4.5])], [len(sh), K(-0.17, 0.92, 10.45, [3.75, 0, 4.7])]], { t });
    const ps = t < NDA ? withParked(72) : [...piecesAt(G, 73, slide(t - NDA), SLIDE_OPTS), ...parked(73).map((p, i) => ({ ...p, ...PARK(p, i) }))];
    const m = moveOf(G, 73);
    home(g, t, { pieces: ps,
      under: g2 => { moveUnder(g2, B, m, t - NDA); if (t >= kniT) squareFrame(g2, B, 'd6', HI.gold, seg(t, kniT, kniT + 0.2), { fill: 0.3, lw: 5 }); },
      over: g2 => {
        moveOver(g2, B, m, t - NDA, { label: false });
        boardArrow(g2, B, 'd6', 'b7', 0.95, seg(t, hitT, hitT + 0.25)); boardArrow(g2, B, 'd6', 'f7', 0.95, seg(t, twoT, twoT + 0.25));
        if (t >= pawT) { pieceRing(g2, B, 'b7', HI.bad, 1, seg(t, pawT, pawT + 0.25)); pieceRing(g2, B, 'f7', HI.bad, 1, seg(t, pawT + 0.08, pawT + 0.33)); }
      } });
  }, { grade: HOMEG, hud: (g, lt, t) => bdg(g, t, '37.Nd6!', kniT, { color: GOLD }) });
  boom(kniT, 0.6); cue(kniT - MOVE_HIT, 'move', 0.6); cue(hitT, 'whoosh_soft', 0.15); cue(twoT, 'whoosh_soft', 0.15); cue(pawT, 'sparkle_pop', 0.3);
  // ======================= ONE FELL: 37...g6 38.Nxb7 =======================
  const runAt = [oneT - 0.3, fellT - SLIDE];
  shot(oneT - 0.36, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.2, 0.55, 6.0, [2.0, 0.5, 6.4])], [len(sh), K(-0.13, 0.53, 5.28, [2.0, 0.55, 6.5])]], { t });
    const run = playRun(G, 73, runAt, t, piecesAt);
    home(g, t, { pieces: [...run.pieces, ...parked(73).map((p, i) => ({ ...p, ...PARK(p, i) }))], dof: 0.45,
      under: g2 => { run.active.forEach(a => moveUnder(g2, B, a.m, a.lt, { hold: a.hold })); if (t >= fellT) spread(g2, B, 'b7', t, fellT, HI.bad); },
      over: g2 => run.active.forEach(a => moveOver(g2, B, a.m, a.lt, { hold: a.hold, label: a.label })) });
    if (t >= fellT && t < fellT + 0.4) flashTint(g, HI.bad, 0.25 * (1 - seg(t, fellT, fellT + 0.4)));
  }, { trans: 'whip', grade: HOMEG });
  cue(oneT - 0.42, 'whoosh_fast', 0.3); cue(runAt[0] + SLIDE - MOVE_HIT, 'move', 0.5); cue(fellT - 0.004, 'hit', 0.6); boom(fellT, 0.6); cue(fellT, 'move_capture', 0.5);
  // ======================= TWENTY MOVES LATER, MAGNUS RESIGNED: fast forward to move 58; the black king falls =======================
  const FF0 = twT, FF1 = resT - 0.2;
  const ffK = t => Math.min(LAST, 75 + Math.floor(clamp((t - FF0) / (FF1 - FF0)) * (LAST - 75)));
  shot(twT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 1.2, 12.15, [4, 0, 4.45])], [len(sh), K(-0.08, 1.15, 11.16, [4, 0, 4.45])]], { t });
    const k = ffK(t), tip = seg(t, resT, resT + 0.35, ease.in);
    const ps = [...piecesAt(G, k), ...parked(k).map((p, i) => ({ ...p, ...PARK(p, i) }))].map(p => p.id === 'k1' ? { ...p, rot: -1.45 * tip, y: -0.05 * tip } : p);
    home(g, t, { pieces: ps, under: g2 => { if (t >= resT) squareFrame(g2, B, ps.find(p => p.id === 'k1') ? G[LAST].pieces.find(p => p.id === 'k1').sq : 'd5', HI.bad, seg(t, resT, resT + 0.2)); } });
  }, { grade: HOMEG, hud: (g, lt, t) => {
    const mv = Math.ceil(ffK(t) / 2);
    if (t < resT) badge(g, `MOVE ${mv}`, W / 2, 230, { color: CREAM, size: 46 }); else bdg(g, t, '1–0', resT, { color: HI.bad, size: 60, sub: 'MAGNUS RESIGNS' });
  } });
  cue(twT - 0.1, 'whoosh_soft', 0.25); cue(FF0, 'whirr', 0.35); for (let x = FF0; x < FF1; x += 0.12) cue(x, 'piece', 0.12); cue(resT + 0.3, 'thud', 0.5); cue(resT, 'sting', 0.35);

  // ======================= AND THAT'S NOT EVEN THE SCARY PART: back in Baku, low over the pieces; Hikaru lifts his eyes to us,
  // the camera creeps in and the frame closes round him (the open loop that carries us into the feats) =======================
  const sqS = s('scary'), sqNotT = w('scary', 'not'), sqT = w('scary', 'scary');
  shot(sqS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.1, -0.2, 9.0, [-2.6, 3.1, 4.0])], [len(sh), K(PI / 2 - 0.05, -0.14, 7.0, [-2.6, 3.4, 4.0]), ease.in]], { t });
    baku(g, t, { hik: { x: HIKX, z: HIKZ, e: exprAt([[0, DOWN], [sqNotT - 0.05, KNOW]], t) }, clock: { l: 24.0, r: 1929 }, focus: 8, dof: 0.5, players: false });
    dread(g, seg(t, sqT - 0.12, sqT + 0.3));
  }, { trans: 'whip', roll: (lt, t) => -0.055 * seg(t, sqT - 0.15, sqT + 0.35, ease.out) });
  cue(sqS - 0.11, 'whoosh_fast', 0.3); cue(sqS + 0.05, 'heartbeat', 0.35); cue(sqT - 0.004, 'boom', 0.5); cue(sqT, 'sting', 0.3);

  // ======================= HOW DID HE KNOW? Back in Baku: Hikaru, a question mark =======================
  const howS = s('how'), howT = w('how', 'how'), showT = w('how', 'show'), gmT = w('how', 'grandmaster'), fiveT = w('how', 'five'), rebT = w('how', 'rebuilds'), itT = w('how', -1);
  shot(howS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.3, -0.17, 8.6, [-2.6, 3.2, 4.1])], [len(sh), K(PI / 2 + 0.26, -0.17, 7.8, [-2.6, 3.3, 4.1])]], { t });
    baku(g, t, { hik: { x: HIKX, z: HIKZ, e: THINK }, focus: 7.5, dof: 0.5 });
    mark(g, '?', -2.6, 6.6, 5.4, seg(t, howT, howT + 0.25, x => x), t, { color: GOLD, size: 1.3 });
  }, { trans: 'whip' });
  cue(howS - 0.11, 'whoosh_fast', 0.3); cue(howT, 'sparkle_pop', 0.3);
  // ======================= SHOW A GRANDMASTER A REAL POSITION FOR FIVE SECONDS: our board from above, a countdown =======================
  const ring5 = (g, t) => {
    if (t < fiveT) return;
    const u = clamp((t - fiveT) / 0.75), cx = W / 2, cy = 360, r = 92;
    g.save(); g.globalAlpha *= seg(t, fiveT, fiveT + 0.12); g.lineWidth = 16; g.lineCap = 'round';
    g.strokeStyle = 'rgba(16,11,7,0.55)'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = GOLD; g.beginPath(); g.arc(cx, cy, r, -PI / 2, -PI / 2 + 2 * PI * (1 - u)); g.stroke();
    g.font = sans(104, 900); g.fillStyle = CREAM; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 6; inkText(g, String(Math.max(1, 5 - Math.floor(u * 5))), cx, cy);
    g.shadowColor = 'transparent'; plate(g, 'SECONDS', cx, cy + r + 52, { color: GOLD, size: 30, rot: 0 }); g.restore();
    qaRect(g, cx - r - 10, cy - r - 10, 2 * r + 20, 2 * r + 20, 'text', '5');
  };
  shot(showT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 1.32, 15.54, [5, 0, 3.65])], [len(sh), K(-0.1, 1.3, 14.28, [5, 0, 3.65])]], { t });
    home(g, t, { pieces: memeP });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { bdg(g, t, 'GRANDMASTER', gmT, { y: 200, color: GOLD, size: 42 }); if (t >= fiveT) ring5(g, t); } });
  cue(showT - 0.12, 'whoosh_fast', 0.3); for (let i = 0; i < 4; i++) cue(fiveT + i * 0.19, 'clock_tick', 0.3);
  // ======================= AND HE REBUILDS IT: the pieces drive off in a ring and come back to their squares =======================
  const OFF0 = fiveT + 0.78, ON0 = rebT - 0.06;
  const ringOf = ps => ps.map(p => ({ ...p, ...PARK(p) }));  // off the squares: every piece drives to its spot on the side fields
  shot(OFF0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.1, 1.3, 14.28, [5, 0, 3.65])], [len(sh), K(-0.25, 1.2, 15.12, [5, 0, 3.75])]], { t });
    const ps = t < ON0 ? drive(meme, ringOf(meme), t, OFF0, 0.35, { stagger: 0.12 }) : drive(ringOf(meme), meme, t, ON0, 0.4, { stagger: 0.25 });
    home(g, t, { pieces: [...ps, ...parked(MEME).map((p, i) => ({ ...p, ...PARK(p, i) }))],
      under: g2 => { if (t >= itT) meme.forEach(p => squareFrame(g2, B, p.sq, HI.good, 0.8 * seg(t, itT, itT + 0.2) * (1 - seg(t, itT + 0.6, itT + 0.9)))); } });
  }, { grade: HOMEG, hud: (g, lt, t) => bdg(g, t, '✓ REBUILT', itT, { color: HI.good }) });
  cue(OFF0, 'whirr', 0.35); cue(ON0, 'whirr', 0.35); cue(itT, 'success', 0.35);
  // ======================= SCRAMBLE THE PIECES: they drive to random squares =======================
  const scS = s('scramble'), barT = w('scramble', 'barely'), begT = w('scramble', 'beginner');
  const SQ = 'abcdefgh'.split('').flatMap(f => [1, 2, 3, 4, 5, 6, 7, 8].map(r => f + r));
  const R = rng(213), pick = [...SQ].sort(() => R() - 0.5);
  const scrambled = meme.map((p, i) => ({ ...p, sq: pick[i], ...(([x, z]) => ({ x, z }))(sqXZ(pick[i])) }));
  shot(scS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.25, 1.2, 15.12, [5, 0, 3.75])], [len(sh), K(-0.5, 0.95, 14.07, [5.6, 0, 3.75])]], { t });
    home(g, t, { pieces: [...drive(meme, scrambled, t, scS + 0.08, 0.45, { stagger: 0.3 }), ...parked(MEME).map((p, i) => ({ ...p, ...PARK(p, i) }))] });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => bdg(g, t, 'SCRAMBLED', scS + 0.5, { y: 200, color: RED, size: 54 }) });
  cue(scS - 0.1, 'whoosh_fast', 0.3); cue(scS + 0.08, 'whirr', 0.4); cue(scS + 0.1, 'record_scratch', 0.2);
  // ======================= BARELY BETTER THAN A BEGINNER: two bars beside the board =======================
  shot(barT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.75, 0.32, 15, [8.6, 1.6, 4.4])], [len(sh), K(-0.68, 0.3, 14, [8.8, 1.7, 4.4])]], { t });
    const u1 = seg(t, barT, barT + 0.5, ease.out), u2 = seg(t, begT, begT + 0.5, ease.out);
    home(g, t, { pieces: [...scrambled, ...parked(MEME).map(p => ({ ...p, ...PARK(p) }))], extra: (g2, ph) => {
      if (ph !== 'top') return;
      if (u1 > 0) { ab(g2, [10.4, -0.35, 1.4], [11.4, -0.35 + 3.4 * u1, 2.4], GOLD, { amb: 0.6, spec: 0.2 }); tag3(g2, 10.9, -0.35 + 3.4 * u1 + 0.9, 1.9, 'GM', GOLD, u1); }
      if (u2 > 0) { ab(g2, [10.4, -0.35, 5.6], [11.4, -0.35 + 3.0 * u2, 6.6], '#8A96A8', { amb: 0.6, spec: 0.2 }); tag3(g2, 10.9, -0.35 + 3.0 * u2 + 0.9, 6.1, 'BEGINNER', CREAM, u2); }
    } });
  }, { grade: HOMEG, hud: (g, lt, t) => badge(g, 'SCRAMBLED', W / 2, 200, { color: RED, size: 54 }) });
  cue(barT, 'notify', 0.25); cue(begT, 'notify', 0.25);

  // ======================= HE SEES PATTERNS, NOT PIECES: chunks of squares light up; the pieces fade =======================
  const ptS = s('patterns'), patT = w('patterns', 'patterns'), notT = w('patterns', 'not'), aboutT = w('patterns', 'about'), fiftyT = w('patterns', 'fifty');
  const CHUNK = [[['f8', 'f7', 'g6'], GOLD], [['c7', 'b7', 'c6'], MIND], [['c5', 'b1'], RED], [['d4', 'e3', 'f2', 'g2', 'g5'], VIOLET]];
  shot(ptS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 1.05, 12.6, [4, 0, 4.65])], [len(sh), K(0.2, 1.0, 11.6, [4, 0, 4.65])]], { t });
    const fadeU = seg(t, notT, notT + 0.4);
    home(g, t, { pieces: [...meme, ...parked(MEME).map(p => ({ ...p, ...PARK(p) }))].map(p => ({ ...p, alpha: 1 - 0.85 * fadeU })),
      under: g2 => CHUNK.forEach(([sqs, col], i) => { const u = seg(t, patT + i * 0.18, patT + i * 0.18 + 0.15); if (u > 0) sqs.forEach(q => squareFrame(g2, B, q, col, u, { fill: 0.22 + 0.3 * fadeU, lw: 5 })); }) });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { bdg(g, t, 'PATTERNS', patT, { color: MIND }); } });
  cue(ptS - 0.11, 'whoosh_fast', 0.3); CHUNK.forEach((_, i) => cue(patT + i * 0.18, 'sparkle_pop', 0.22)); cue(notT, 'whoosh_soft', 0.25);
  // ======================= ABOUT FIFTY THOUSAND: we pull back from one pattern to a wall of them =======================
  const skS = s('skill'), sk1T = skS + 0.25, sk2T = w('skill', 3), boardT = w('skill', 'board'), headT = w('skill', 'head'), whereT = w('skill', 'where'), combT = w('skill', 'combinations');
  shot(aboutT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0, 0, 2.6, [4.3, 3.6, 12])], [1.4, K(0.08, 0.04, 30, [4, 4, 12]), ease.inOut], [len(sh), K(0.1, 0.05, 34, [4, 4, 12])]], { t });
    patternWall(g, t);
  }, { trans: 'zoom', grade: 'night', hud: (g, lt, t) => {
    const n = Math.round(50000 * ease.out(seg(t, fiftyT - 0.1, fiftyT + 0.9)) / 50) * 50;
    if (t >= fiftyT - 0.1) counter(g, n.toLocaleString('en-US'), 'PATTERNS IN MEMORY', { y: 330, size: 150, color: CREAM, labelColor: MIND });
    bdg(g, t, 'SKILL 1', sk1T, { y: 560, color: MIND, size: 52 });
  } });
  cue(aboutT - 0.06, 'whoosh_deep', 0.35); cue(fiftyT, 'shimmer', 0.35); cue(sk1T, 'reveal_bell', 0.35);
  // ======================= SKILL TWO: A BOARD IN HIS HEAD — back to Hikaru, into his forehead =======================
  shot(sk2T - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.06, 0.05, 7.6, [-2.6, 4.3, 4])], [len(sh), K(PI / 2 + 0.01, 0.03, 2.2, [-2.6, 4.75, 4]), ease.in]], { t });
    baku(g, t, { hik: { x: HIKX, z: HIKZ, e: DOWN }, focus: 5 });
    const u = seg(lt, len(sh) - 0.9, len(sh) - 0.35); if (u > 0) { const p = B.project(-2.6, 4.9, 4); rim(g, p.x, p.y, p.s * 3 * u + 10, MIND, 0.6 * u); }
  }, { trans: 'whip', hud: (g, lt, t) => bdg(g, t, 'SKILL 2', sk2T, { color: MIND, size: 52 }) });
  cue(sk2T - 0.12, 'whoosh_fast', 0.3); cue(sk2T + 0.05, 'reveal_bell', 0.35); cue(headT - 0.6, 'riser', 0.3);
  // ======================= THE BOARD IN HIS HEAD: ghost pieces play the rest of the combination on their own =======================
  const mindAt = [w('skill', 'play') - 0.1, w('skill', 'play') + 0.35, combT, combT + 0.45, combT + 0.9];
  const likeS = s('like'), mA = headT - 0.04, lA = likeS - 0.05;
  const mindKeys = [[0, K(0.65, 0.62, 11.875, [3.75, 0.3, 3.75])], [lA + 0.4 - mA, K(-0.05, 0.5, 10.45, [3.75, 0.4, 3.75])], [s('ad1') - mA, K(-0.3, 0.44, 9.0, [3.55, 0.3, 3.65])]];
  shot(mA, (g, lt, t, sh) => {
    rig(B, t - mA, mindKeys, { t, e: x => x });
    const run = playRun(G, MEME, mindAt, t, piecesAt);
    mindSet(g, t, { pieces: run.pieces,
      under: g2 => run.active.forEach(a => moveUnder(g2, B, a.m, a.lt, { hold: a.hold })),
      over: g2 => run.active.forEach(a => moveOver(g2, B, a.m, a.lt, { hold: a.hold, label: a.label })) });
  }, { trans: 'zoom', grade: 'night', kb: 0 });
  cue(headT - 0.04, 'whoosh_deep', 0.4); cue(headT, 'shimmer', 0.3); mindAt.forEach(x => cue(x + SLIDE - MOVE_HIT, 'move', 0.4));

  // ======================= JUST LIKE THIS BOARD: a match dissolve — the same camera path and the same position, the glass board
  // in his head turns into the Chessnut on our table; then two pieces drive themselves (41...Ke8 42.Nb4) =======================
  const thisT = w('like', 'this'), bd2T = w('like', 'board'), KE8 = thisT - 0.1, NB4 = bd2T - 0.05;
  const likePieces = t => t < NB4 ? drive(piecesAt(G, 81), piecesAt(G, 82), t, KE8, 0.55) : drive(piecesAt(G, 82), piecesAt(G, 83), t, NB4, 0.6);
  shot(lA, (g, lt, t, sh) => {
    rig(B, t - mA, mindKeys, { t, e: x => x });
    home(g, t, { pieces: [...likePieces(t), ...parked(83).map((p, i) => ({ ...p, ...PARK(p, i) }))], dof: 0.5 });
  }, { trans: 'fade', transDur: 0.45, grade: HOMEG, kb: 0 });
  cue(lA, 'shimmer', 0.25); cue(KE8, 'whirr', 0.4); cue(KE8 + 0.45, 'piece', 0.3); cue(NB4, 'whirr', 0.4); cue(NB4 + 0.5, 'piece', 0.3);

  // ======================= BLINDFOLD AGAINST MAGNUS: Barcelona, January 2026 =======================
  const blS = s('blind'), pawnT = w('blind', 'pawn'), saw2T = w('blind', 'saw'), bishT = w('blind', 'bishop'), sacT = w('blind', 'sacrifice'), drawT = w('blind', 'draw');
  shot(blS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.08, 0.14, 22, [4, 2.2, 4])], [len(sh), K(PI / 2 + 0.04, 0.12, 19.5, [4, 2.3, 4])]], { t });
    barcelona(g, t);
    tag3(g, 4, 5.6, -1.4, 'MAGNUS', CREAM, seg(t, blS + 0.5, blS + 0.8, x => x)); tag3(g, 4, 5.6, 9.3, 'HIKARU', SKY, seg(t, blS + 0.7, blS + 1.0, x => x));
  }, { trans: 'whip', grade: 'night', hud: (g, lt, t) => placeStamp(g, lt, 'Barcelona', 'BLINDFOLD · JAN 2026', { y: 200, t0: 0.15 }) });
  cue(blS - 0.11, 'whoosh_fast', 0.3); cue(blS, 'murmur', 0.2);
  shot(pawnT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.32, 0.06, 7, [4, 3.0, 9.3])], [len(sh), K(PI / 2 - 0.28, 0.05, 6.3, [4, 3.05, 9.3])]], { t });
    barcelona(g, t);
    tag3(g, 4, 5.3, 9.3, '−1 PAWN', RED, seg(t, pawnT, pawnT + 0.25, x => x));
  }, { grade: 'night' });
  cue(pawnT, 'sting', 0.3);
  // ======================= HE SAW A BISHOP SACRIFICE: the board in his head over the dark stage =======================
  const BX = [{ id: 'b1', t: 'b', c: 'b', sq: 'e3' }];
  shot(saw2T - 0.08, (g, lt, t, sh) => {
    B.setCam(K(PI / 2 - 0.3, 0.06, 6.6, [4, 3.0, 9.3])); feedx.setTransform(1, 0, 0, 1, 0, 0); barcelona(feedx, t);
    g.drawImage(FEED, 0, 0); g.fillStyle = 'rgba(2,6,8,0.72)'; g.fillRect(0, 0, W, H);
    rig(B, lt, [[0, K(-0.35, 0.72, 12.5, [4, 0, 4])], [len(sh), K(-0.2, 0.68, 11.4, [4, 0, 4])]], { t });
    const v = seg(t, bishT - 0.3, bishT, ease.in), ps = BX.map(p => ({ ...p, ...(([x, z]) => ({ x, z }))(sqXZ('e3')), y: (1 - v) * 4, brill: t >= sacT ? seg(t, sacT, sacT + 0.2) : 0 }));
    glassBoard(g, t);
    if (t >= sacT) brilliantSquare(g, B, 'e3', seg(t, sacT, sacT + 0.2), t);
    if (t >= bishT) spread(g, B, 'e3', t, bishT, MIND);
    B.drawPieces(g, ghosts(ps), { focus: B.dist, dof: 1 });
  }, { trans: 'zoom', grade: 'night', hud: (g, lt, t) => { bdg(g, t, '26...Bxe3!!', sacT, { color: MIND }); bdg(g, t, '½–½', drawT, { y: 340, color: GOLD, size: 60, sub: 'A FORCED DRAW' }); } });
  cue(saw2T - 0.08, 'whoosh_deep', 0.35); cue(bishT - 0.004, 'hit', 0.5); boom(bishT, 0.7); cue(sacT, 'shimmer', 0.4); cue(drawT, 'ting', 0.35);

  // ======================= THE FIRST EVER TO HIT 3500: the streaming room; the rating climbs =======================
  const rcS = s('record'), firstT = w('record', 'first'), t3500 = w('record', '3500'), blitzT = w('record', 'blitz');
  const ratingAt = t => t < t3500 ? lerp(3342, 3499, ease.inOut(seg(t, rcS, t3500))) : 3500;
  shot(rcS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.16, 12.5, [4.4, 2.3, 5.9])], [len(sh), K(0.26, 0.12, 10.4, [4.4, 2.4, 5.9])]], { t, e: x => x });
    stream(g, t, monitorTex(t, { rating: ratingAt(t) }));
  }, { trans: 'whip', grade: 'stream', hud: (g, lt, t) => placeStamp(g, lt, 'Blitz rating', 'OCTOBER 2026', { y: 200, t0: 0.15 }) });
  cue(rcS - 0.11, 'whoosh_fast', 0.3); cue(rcS + 0.2, 'typewriter', 0.18);
  shot(t3500 - 0.16, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.03, 0.02, 5.8, [4, 2.4, 5.98])], [len(sh), K(0, 0.02, 5.2, [4, 2.4, 5.98])]], { t, e: x => x, bump: t > t3500 && t < t3500 + 0.3 ? 1 : 0 });
    stream(g, t, monitorTex(t, { rating: ratingAt(t), gold: seg(t, t3500, t3500 + 0.3), head: false }), { glow: seg(t, t3500, t3500 + 0.3) });
    if (t >= t3500) confetti(g, t, t3500, { n: 110, seed: 35 });
  }, { grade: 'stream', hud: (g, lt, t) => { bdg(g, t, 'FIRST EVER', t3500 + 0.1, { y: 220, color: GOLD, size: 54 }); bdg(g, t, 'CHESS.COM BLITZ', blitzT, { y: 330, color: CREAM, size: 38 }); } });
  cue(t3500 - 0.004, 'boom', 0.75); cue(t3500, 'confetti', 0.45); cue(t3500 + 0.05, 'success', 0.4); cue(t3500 + 0.2, 'applause', 0.3);
  // ======================= 34 STRAIGHT WINS IN ONE DAY: the win tiles fill the screen =======================
  const stS = s('streak'), n34T = w('streak', '34'), winsT = w('streak', 'wins'), dayT = w('streak', 'day'), mag2T = w('streak', 'magnus'), hunT = w('streak', 'hundred'), behT = w('streak', 'behind');
  shot(stS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.1, 11, [4.4, 2.4, 5.98])], [len(sh), K(0.26, 0.08, 10, [4.4, 2.4, 5.98])]], { t, e: x => x });
    stream(g, t, monitorTex(t, { tiles: Math.max(0, (t - n34T) / (dayT - n34T) * 34) }));
  }, { trans: 'whip', grade: 'stream', hud: (g, lt, t) => { if (t >= n34T) counter(g, String(Math.min(34, Math.max(1, Math.ceil((t - n34T) / (dayT - n34T) * 34)))), 'WINS IN A ROW', { y: 330, size: 150, color: '#7DF29A', labelColor: '#3FBF5F' }); bdg(g, t, 'IN ONE DAY', dayT, { y: 520, color: CREAM, size: 42 }); } });
  cue(stS - 0.11, 'whoosh_fast', 0.3); for (let i = 0; i < 8; i++) cue(n34T + i * (dayT - n34T) / 8, 'tick', 0.25); cue(dayT, 'success', 0.35);
  // ======================= MAGNUS? A HUNDRED POINTS BEHIND: two rating towers =======================
  shot(mag2T - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.22, 27, [4.4, 5.6, 4])], [len(sh), K(0.18, 0.2, 24.5, [4.4, 5.8, 4])]], { t, e: x => x });
    towers(g, t, { hik: 1, mag: seg(t, mag2T, mag2T + 0.6, ease.out), gap: seg(t, hunT, hunT + 0.25) });
  }, { trans: 'whip', grade: 'stream', hud: (g, lt, t) => {
    bdg(g, t, 'CHESS.COM BLITZ · OCT 2026', mag2T + 0.05, { y: 1500, color: CREAM, size: 32 });  // rule 40: the gap of the record's day, not of today; under the names, clear of the stamp
    if (t >= hunT) stamp(g, '−100', W / 2, 330, t, hunT, { color: RED, size: 110, sub: 'POINTS BEHIND' });
  } });
  cue(mag2T - 0.14, 'whoosh_fast', 0.3); cue(mag2T + 0.1, 'whoosh_soft', 0.25); cue(hunT, 'stamp', 0.45);

  // ======================= HIKARU NAKAMURA IS NOT HUMAN: his facecam (the camera sits on his monitor); a captcha pops up on the
  // stream, the cursor ticks "I'm not a robot" on "not", and on "human" it fails =======================
  const huS = s('human'), notHT = w('human', 'not'), humT = w('human', 'human');
  shot(huS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.13, 0.05, 9.7, [4, 3.0, -1.4])], [len(sh), K(PI + 0.07, 0.04, 8.7, [4, 3.05, -1.4])]], { t, e: x => x, bump: t > humT && t < humT + 0.25 ? 1 : 0 });
    const red = seg(t, humT, humT + 0.12) * (1 - 0.6 * seg(t, humT + 0.5, humT + 1.2));
    facecam(g, t, { e: exprAt([[0, { ...EXPR.focus, look: [0.1, -0.15], lid: 0.2 }], [humT + 0.25, KNOW]], t), red });
    if (t >= humT && t < humT + 0.35) flashTint(g, '#FF4A3D', 0.2 * (1 - (t - humT) / 0.35));
  }, { trans: 'whip', hud: (g, lt, t) => captcha(g, t, { t0: huS + 0.1, tClick: notHT, tFail: humT }) });
  cue(huS - 0.11, 'whoosh_fast', 0.3); cue(huS + 0.1, 'notify', 0.3); cue(notHT, 'clack', 0.55); cue(humT, 'error', 0.55); cue(humT + 0.02, 'buzz', 0.25);

  // ======================= HE DOESN'T NEED STOCKFISH: the sea. Stockfish is a fish — the cod of its logo, as in the author's
  // Mittens video; on its name the plate is struck out and the fish darts off in a burst of bubbles =======================
  const enS = s('engine'), sfT = w('engine', 'stockfish'), he2T = w('engine', 4), isT = w('engine', 'is'), engT = w('engine', -1);
  const FISH0 = enS - 0.05, DART = sfT + 0.3, FZ = 7.5;
  const fishAt = t => {
    const u = ease.out(clamp((t - FISH0) / 0.8)), v = ease.in(clamp((t - DART) / 0.5));
    return { x: lerp(11, 4.6, u) - v * 15, y: 0.3 + Math.sin(t * 2.2) * 0.1 + v * 2.6, rot: Math.sin(t * 1.8) * 0.04 - v * 0.4, wag: 1 + 2.5 * v + (t > sfT && t < DART ? 1.5 : 0) };
  };
  shot(enS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.03, 9.6, [4.4, 0.3, FZ])], [len(sh), K(-0.05, 0.02, 8.3, [4.2, 0.35, FZ])]], { t, e: x => x });
    sea(g, t);
    const f = fishAt(t);
    if (depth(f.x, f.y, FZ) > 1) { const p = B.project(f.x, f.y, FZ); fishPhoto(g, p.x, p.y, p.s * 4.9, t, { rot: f.rot, wag: f.wag }); }
    const d = fishAt(DART); seaSpecks(g, t, { burst: [d.x + 1, d.y, FZ, DART] });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t < enS + 0.1) return;
    const st = plate(g, 'STOCKFISH', W / 2, 250, { color: BLUE, size: 66, ...popIn(t, enS + 0.1) });
    smallCredit(g, 'Logo: Stockfish (GPLv3) · Klein Maetschke', 342);
    if (st && t >= sfT + 0.06) {  // struck out on its name
      const u = seg(t, sfT + 0.06, sfT + 0.24, ease.out);
      g.save(); g.translate(W / 2, 250); g.rotate(-0.07); g.strokeStyle = '#FF4A3D'; g.lineWidth = 15; g.lineCap = 'round';
      g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.beginPath(); g.moveTo(-st.w / 2 - 16, 0); g.lineTo(-st.w / 2 - 16 + (st.w + 32) * u, 0); g.stroke(); g.restore();
    }
  } });
  cue(enS - 0.08, 'whoosh_deep', 0.3); cue(enS + 0.1, 'sparkle_pop', 0.22); cue(sfT + 0.06, 'scribble', 0.5); cue(DART, 'whoosh_fast', 0.35); cue(DART + 0.05, 'poof', 0.25);

  // ======================= HE IS THE ENGINE: back on his facecam, lower and closer; on "IS" his eyes flash, the room turns teal
  // and his own evaluation bar climbs to the engine's verdict on the position he saw (+2.53, SOURCES.md) =======================
  shot(he2T - 0.04, (g, lt, t, sh) => {
    const k1 = isT - (he2T - 0.04);
    rig(B, lt, [[0, K(PI - 0.1, -0.07, 7.9, [4, 2.95, -1.4], { cy: H * 0.46 })], [k1, K(PI - 0.09, -0.07, 7.7, [4, 2.96, -1.4], { cy: H * 0.46 })],
      [len(sh), K(PI - 0.03, -0.1, 6.9, [4, 3.0, -1.4], { cy: H * 0.46 }), ease.out]], { t, e: x => x, bump: t > isT && t < isT + 0.3 ? 1 : 0 });
    const pw = seg(t, isT, isT + 0.25), [e1, e2, es] = eyesAt(), cx = (e1[0] + e2[0]) / 2, cy = e1[1];
    facecam(g, t, { e: KNOW, power: pw, behind: g2 => powerBehind(g2, t, isT, cx, cy, pw) });
    powerFront(g, t, isT, cx, cy);
    glint(g, e1[0], e1[1], t, isT, { r: 90 * es, life: 0.55, color: MIND }); glint(g, e2[0], e2[1], t, isT + 0.03, { r: 90 * es, life: 0.55, color: MIND });
    if (t >= isT && t < isT + 0.3) flashTint(g, MIND, 0.28 * (1 - (t - isT) / 0.3));
  }, { trans: 'whip', hud: (g, lt, t) => { hudEval(g, t, { f: seg(t, isT + 0.02, isT + 0.9, x => x) }); bdg(g, t, '+2.53', engT, { y: 250, color: '#F4F3EE', size: 66 }); } });
  cue(he2T - 0.1, 'whoosh_fast', 0.3); cue(isT - 0.3, 'revswell', 0.5); cue(isT - 0.004, 'boom_big', 0.65); cue(isT, 'shimmer', 0.3); cue(engT, 'sparkle_pop', 0.28);

  // ======================= AD (Chessnut Move): pieces that move on their own =======================
  const a1S = s('ad1'), moveT = w('ad1', 'move'), nutT = w('ad1', 'chessnut');
  const p0 = withParked(0), adPlies = [moveT - 0.12, moveT + 0.45, nutT + 0.1];  // 1.d4 Nf6 2.c4 drive themselves
  const adPieces = t => {
    let i = -1; while (i + 1 < adPlies.length && t >= adPlies[i + 1]) i++;
    if (i < 0) return p0;
    return drive(withParked(i), withParked(i + 1), t, adPlies[i], 0.45, { stagger: 0 });
  };
  const adHud = (g, lt, t) => adTag(g, 1);
  shot(a1S - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.12, 0.32, 8.8, [4, 0.5, 2.7])], [len(sh), K(-0.04, 0.34, 8.3, [4, 0.5, 2.8])]], { t });
    home(g, t, { pieces: adPieces(t), focus: 6.5 });
  }, { trans: 'whip', grade: HOMEG, hud: adHud });
  cue(a1S - 0.11, 'whoosh_fast', 0.3); adPlies.forEach(x => { cue(x, 'whirr', 0.3); cue(x + 0.35, 'piece', 0.3); });
  shot(nutT - 0.45, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.45, 0.55, 17.64, [4, 0, 3.1])], [len(sh), K(-0.15, 0.42, 16.17, [4, 0, 2.9])]], { t, e: x => x });
    home(g, t, { pieces: adPieces(t) });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { adHud(g, lt, t); if (t >= nutT) nutPlate(g, 214, popIn(t, nutT)); } });
  cue(nutT - 0.5, 'whoosh_fast', 0.3); cue(nutT, 'reveal_bell', 0.4);
  // ======================= EACH PIECE HAS ITS OWN MOTOR: the x-ray of the knight on g1 =======================
  const a2S = s('ad2'), motT = w('ad2', 'motor'), snapT = w('ad2', 'snap'), photoT = w('ad2', 'photo'), setsT = w('ad2', 'sets');
  // the labels sit under the base, clear of the knight and above the captions: [side, delay, row]
  const LB = [[-1, 0.0, 0], [1, 0.12, 0], [1, 0.24, 1], [-1, 0.36, 1]];
  shot(a2S - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.15, 0.3, 4.7, [6.5, 0.42, 0.1], { cy: H * 0.44 })], [len(sh), K(-0.1, 0.28, 4.0, [6.5, 0.42, 0.1], { cy: H * 0.44 })]], { t });
    const ps = withParked(3).map(p => p.id === 'N1' ? { ...p, sharp: true } : p);
    home(g, t, { pieces: ps, focus: 4.2 });
    const P = B.project(6.5, 0, 0.5), h = P.s * 1.25;
    const pts = xray(g, P, h, t, motT);
    if (pts) pts.forEach(([name, pt], i) => { const [sd, dt, row] = LB[i]; callout(g, name, pt, [W / 2 + sd * 230, 1000 + row * 110], seg(t, motT + dt, motT + dt + 0.25)); });
  }, { trans: 'whip', grade: HOMEG, hud: adHud });
  cue(a2S - 0.11, 'whoosh_fast', 0.3); cue(motT - 0.35, 'shimmer', 0.3); LB.forEach(([, dt]) => cue(motT + dt, 'sparkle_pop', 0.22));
  // ======================= SNAP A PHOTO OF ANY POSITION: a phone over a diagram on the table =======================
  const BOOK = [11.2, 2.4];  // on the table right of the board (its side field ends at x 9.75)
  const bookOnTable = (g2, ph) => { if (ph !== 'table') return;
    ab(g2, [BOOK[0] - 1.0, -0.35, BOOK[1] - 1.0], [BOOK[0] + 1.0, -0.25, BOOK[1] + 1.0], '#EDE6D8', { amb: 0.7 });
    texQuad(g2, DIAG, [BOOK[0] - 0.85, -0.245, BOOK[1] + 0.85], [BOOK[0] + 0.85, -0.245, BOOK[1] + 0.85], [BOOK[0] - 0.85, -0.245, BOOK[1] - 0.85], { under: false }); };
  const SHUT = photoT + 0.2;
  shot(snapT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0, 1.45, 7.2, [BOOK[0] - 0.5, -0.25, BOOK[1]])], [len(sh), K(0.05, 1.45, 6.6, [BOOK[0] - 0.5, -0.25, BOOK[1]])]], { t });
    home(g, t, { pieces: withParked(3), extra: bookOnTable });
    // the phone in a hand, its screen the camera's view of the diagram
    const ph = { x: W / 2, y: 800, w: 420, h: 780 }, u = ease.out(seg(t, snapT - 0.08, snapT + 0.25));
    g.save(); g.translate(ph.x + (1 - u) * 500, ph.y + (1 - u) * 300); g.rotate(-0.05);
    g.fillStyle = '#0A0B0D'; g.beginPath(); g.roundRect(-ph.w / 2 - 18, -ph.h / 2 - 18, ph.w + 36, ph.h + 36, 58); g.fill();
    g.save(); g.beginPath(); g.roundRect(-ph.w / 2, -ph.h / 2, ph.w, ph.h, 44); g.clip();
    g.fillStyle = '#EDE6D8'; g.fillRect(-ph.w / 2, -ph.h / 2, ph.w, ph.h); g.drawImage(DIAG, -ph.w / 2 + 20, -ph.w / 2 + 20, ph.w - 40, ph.w - 40);
    g.strokeStyle = t >= SHUT ? HI.good : GOLD; g.lineWidth = 7;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = sx * (ph.w / 2 - 34), cy = sy * (ph.w / 2 - 34); g.beginPath(); g.moveTo(cx, cy - sy * 60); g.lineTo(cx, cy); g.lineTo(cx - sx * 60, cy); g.stroke(); }
    g.fillStyle = '#F4F2EE'; g.beginPath(); g.arc(0, ph.h / 2 - 90, 44, 0, 7); g.fill(); g.strokeStyle = '#0A0B0D'; g.lineWidth = 6; g.beginPath(); g.arc(0, ph.h / 2 - 90, 34, 0, 7); g.stroke();
    if (t >= SHUT) { g.fillStyle = `rgba(255,255,255,${(1 - seg(t, SHUT, SHUT + 0.3)).toFixed(3)})`; g.fillRect(-ph.w / 2, -ph.h / 2, ph.w, ph.h); }
    g.restore(); g.restore();
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { adHud(g, lt, t); bdg(g, t, '✓ POSITION FOUND', SHUT + 0.15, { y: 240, color: HI.good, size: 42 }); } });
  cue(snapT - 0.14, 'whoosh_fast', 0.3); cue(SHUT, 'camera', 0.6); cue(SHUT + 0.15, 'success', 0.3);
  // ======================= AND IT SETS ITSELF UP: the pieces drive into that position =======================
  const SU0 = setsT - 0.1;
  shot(setsT - 0.42, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.55, 0.85, 14, [5, 0, 4])], [len(sh), K(-0.35, 0.8, 12.8, [5, 0, 4])]], { t, e: x => x });
    home(g, t, { pieces: drive(withParked(3), memeP, t, SU0, 0.6, { stagger: 0.45, park: PARK, fade: false }), extra: bookOnTable });
  }, { grade: HOMEG, hud: adHud });
  cue(SU0, 'whirr', 0.45); for (let i = 0; i < 8; i++) cue(SU0 + 0.05 + i * 0.1, 'piece_slide', 0.15);
  // ======================= PLAY CHESS.COM OR LICHESS ON A REAL BOARD: the opponent's move arrives =======================
  const a3S = s('ad3'), liT = w('ad3', 'lichess'), realT = w('ad3', 'real'), afterT = w('ad3', 'after'), n32T = w('ad3', '32'), driveT = w('ad3', 'drive'), homeT = w('ad3', 'home');
  const OPP = realT - 0.35;
  shot(a3S - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.28, 0.5, 13.6, [7.0, 1.0, 4.4])], [len(sh), K(-0.36, 0.46, 12.6, [6.8, 1.0, 4.4])]], { t });
    home(g, t, { pieces: drive(withParked(1), withParked(2), t, realT - 0.12, 0.45), extra: (g2, ph) => { if (ph === 'top') tablet(g2, t, OPP); } });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { adHud(g, lt, t); bdg(g, t, 'CHESS.COM · LICHESS', a3S + 0.15, { y: 220, color: CREAM, size: 40 }); } });
  cue(a3S - 0.11, 'whoosh_fast', 0.3); cue(OPP, 'notify', 0.35); cue(realT - 0.12, 'whirr', 0.4); cue(realT + 0.28, 'piece', 0.3);
  // ======================= AFTER THE GAME, ALL 32 PIECES DRIVE HOME =======================
  const H0 = n32T - 0.05;
  shot(afterT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 1.0, 15.5, [5.7, 0, 4])], [len(sh), K(-0.1, 0.92, 14.2, [5.1, 0, 4])]], { t, e: x => x });
    home(g, t, { pieces: drive(withParked(LAST), p0.filter(p => G[0].pieces.some(q => q.id === p.id)), t, H0, 0.9, { stagger: 0.55, park: null }) });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { adHud(g, lt, t); if (t >= n32T) counter(g, '32', 'PIECES DRIVE HOME', { y: 330, size: 150, color: CREAM, labelColor: GOLD, at: [t, n32T] }); } });
  cue(afterT - 0.11, 'whoosh_fast', 0.3); cue(H0, 'whirr', 0.5); for (let i = 0; i < 10; i++) cue(H0 + 0.1 + i * 0.13, 'piece_slide', 0.14); cue(homeT + 0.1, 'success', 0.35);
  // ======================= LINK IN BIO: the board, set, the name on its edge =======================
  const bioS = s('bio');
  shot(bioS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.3, 10, [4, 0.4, 2.85], { cy: H * 0.42 })], [len(sh), K(-0.04, 0.27, 9.2, [4, 0.4, 2.65], { cy: H * 0.42 })]], { t });
    home(g, t, { pieces: p0, focus: 8 });
  }, { trans: 'whip', grade: HOMEG, hud: (g, lt, t) => { adHud(g, lt, t); nutPlate(g, 204); bdg(g, t, 'LINK IN BIO', bioS + 0.1, { y: 318, color: GOLD, size: 54 }); } });
  cue(bioS - 0.11, 'whoosh_fast', 0.3); cue(bioS + 0.1, 'reveal_bell', 0.35);

  // ======================= CTA: Baku again — the grimace and the stopwatch; how many seconds did you need? =======================
  const ctaS = s('cta') - 0.05, two2T = w('cta', 'two'), how2T = w('cta', 'how'), needT = w('cta', 'need');
  shot(ctaS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.093, -0.2, 9.6, [-2.6, 2.9, 4.0], { cy: H * 0.59 })], [len(sh), K(PI / 2 - 0.12, -0.2, 8.9, [-2.6, 2.95, 4.0], { cy: H * 0.59 })]], { t, e: x => x });
    baku(g, t, { hik: { x: HIKX, z: HIKZ, e: exprAt([[0, GRIMACE], [how2T - 0.15, KNOW]], t) }, clock: { l: 24.0, r: 1929 }, focus: 8.6, dof: 0.5, players: false });
  }, { trans: 'whip', hud: (g, lt, t) => {
    stopwatch(g, 2.13, { y: 250, done: true });
    bdg(g, t, 'HOW MANY SECONDS?', how2T, { y: 420, color: GOLD, size: 50 });
    bdg(g, t, 'COMMENT YOUR TIME', needT, { y: 508, color: TEAL, size: 42 });
    bdg(g, t, 'FOLLOW ' + CHANNEL, needT + 0.5, { y: 600, color: CREAM, size: 36 });  // rule 29: a readable plate, as in gmhunter
  } });
  cue(ctaS - 0.06, 'whoosh_fast', 0.3); cue(two2T, 'clock_press', 0.4); cue(how2T, 'sparkle_pop', 0.3); cue(needT, 'sparkle_pop', 0.3); cue(needT + 0.5, 'sparkle_pop', 0.22);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: 1.43, m: 'tension' }, { t: t213, m: 'slam' }, { t: tvA, m: 'intrigue' }, { t: sqS - 0.05, m: 'tension' },
    { t: blS - 0.06, m: 'glory' }, { t: rcS - 0.05, m: 'build' }, { t: stS - 0.05, m: 'victory' }, { t: huS - 0.05, m: 'digital' },
    { t: enS - 0.06, m: 'void' }, { t: isT - 0.004, m: 'slam' }, { t: howS - 0.05, m: 'clockwork' }, { t: sk2T - 0.06, m: 'void' },
    { t: a1S - 0.06, m: 'digital' }, { t: ctaS, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: t213 - 0.32, t1: t213 - 0.01, kind: 'mute' }, { t0: t213, t1: seeT, kind: 'boost', db: 5 },
    { t0: humT - 0.28, t1: humT - 0.01, kind: 'mute' },
    { t0: isT - 0.3, t1: isT - 0.01, kind: 'mute' }, { t0: isT, t1: isT + 1.2, kind: 'boost', db: 3 },
    { t0: ctaS, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
