// He has seen your position before (sponsored: Chessigma Supercoach). The hook is Magnus Carlsen's memory test (chess24,
// 30 April 2021): he names famous games from single positions, and the one that stumps him is from Harry Potter. Then
// the man who built that kind of memory by copying a woodpecker: Sweden, 2010, Hans Tikkanen is twenty-five and not a
// grandmaster. His plan: over a thousand puzzles, solve them all, then the same ones again in half the time, and again,
// until the whole set takes a day. Three GM norms in seven weeks, and in Finnish his name is said to mean "little
// woodpecker": the Woodpecker Method. The sponsor's block: Chessigma on a phone, the site's Woodpecker page (photos/)
// and the author's own screen recordings of the app (photos/rec/, turned into frames by tools/frames.py). Sources and
// what is drawn: SOURCES.md.
// Rules 42-45 and 53-56: the payoff is the first frame (Magnus in the hall of his memory, a famous position already
// named); every phrase is a 3D set (the gold hall, a birch wood in the Swedish summer, his study, a wall of 1,128
// puzzle cards, the table in the wood with the phone); the method is one accelerating take. Palette (rule 48): the
// hall's gold, birch white and leaf green under a summer sky, the woodpecker's teal and red (the colours of Chessigma's
// own woodpecker), Chessigma's black and yellow in the sponsor's block.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash } from '../../engine/js/core.js';
import { Board, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { plate, inkText, inkWidth, counter, sans, popIn } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { room, table, box, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2 } from '../../engine/js/look.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { loadImage } from '../../engine/js/photo.js';
import { HI, flashTint, boardArrow, squareFrame } from '../../engine/js/hifx.js';
import { confetti, rays } from '../../engine/js/draw.js';
import { drawPiece } from '../../engine/js/pieces.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', CREAM = C.cream, INK = C.ink;
const LEAFG = '#8FD35A', SWE_BLUE = '#1F6FB5', SWE_YEL = '#FFCD00';
// the woodpecker's colours, read off Chessigma's woodpecker icon (photos/chessigma_woodpecker.png)
const BIRDC = { body: '#12A39B', dark: '#0B7C78', light: '#49C9BC', crest: '#E8492A', crestD: '#BE3520', beak: '#F0612C', beakD: '#C9471C', eye: '#F3EBD6', leg: '#B9793F' };
// Chessigma's site: near-black pages, yellow buttons
const SIG = { bg: '#171717', card: '#232323', yel: '#FBBF24' };
// the puzzle on his board: the smothered mate every puzzle book teaches (1.Qg8+ Rxg8 2.Nf7#), a set position. The data
// file keeps Black's rook on d8, where 1.Qxd8 mates at once; here it stands on f8, so the queen sacrifice is the only way
const PZ = (await fetch('../engine/data/tal_queen.json').then(r => r.json())).map((p, k) => ({ ...p, from: k === 2 ? 'f8' : p.from,
  pieces: p.pieces.map(q => q.id === 'r1' && k < 2 ? { ...q, sq: 'f8' } : q) }));
const IMG = Object.fromEntries(await Promise.all(['chessigma_woodpecker.jpg', 'chessigma_memory.jpg', 'chessigma_stores.jpg', 'chessigma_logo.png']
  .map(async f => [f.replace('chessigma_', '').replace('.', '_'), await loadImage(`../episodes/woodpecker/photos/${f}`)])));
// the famous positions on the cards of the hook, our own choice of three (SOURCES.md): Fischer's 17...Be6 of 1956, Tal's
// 21...Nf4 against Botvinnik in 1960, the Polish Immortal a move before the pawn mates
const [GOC, BT, PI] = await Promise.all(['game_of_century', 'botvinnik_tal_1960_g6', 'polish_immortal'].map(f => fetch(`../engine/data/${f}.json`).then(r => r.json())));
// the author's screen recordings of the Chessigma app, as frames (tools/frames.py puts them in build/rec; build/ is not in git)
const RECI = await fetch('../episodes/woodpecker/build/rec/index.json').then(r => r.ok ? r.json() : null).catch(() => null);
if (!RECI) throw new Error('no frames of the screen recordings: run python3 tools/frames.py episodes/woodpecker');
const REC = Object.fromEntries(await Promise.all(Object.entries(RECI).map(async ([name, { n }]) =>
  [name, await Promise.all(Array.from({ length: n }, (_, k) => loadImage(`../episodes/woodpecker/build/rec/${name}/${String(k + 1).padStart(3, '0')}.jpg`)))])));
const recFrame = (name, sec) => REC[name][clamp(Math.floor(sec * RECI[name].fps), 0, RECI[name].n - 1)];

// ---------- cast: Hans Tikkanen at twenty-five. His look here is ours, not a likeness (SOURCES.md): a red knitted hat
// and a teal hoodie, the woodpecker's own colours ----------
const HAT = '#E04A2C', HAT_D = '#B8361F';
function hansHat(g, phase, { fw, fh = 1 }) {
  const w = 100 * fw, h = 125 * fh;
  if (phase === 'back') { g.fillStyle = '#8A6A48'; g.beginPath(); g.ellipse(0, -34, w + 9, 92, 0, 0, 7); g.fill(); return; }
  // hair at the temples under the hat
  g.fillStyle = '#8A6A48';
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * (w + 5), -18); g.quadraticCurveTo(sd * (w + 9), -60, sd * (w - 8), -80); g.lineTo(sd * (w - 22), -74); g.quadraticCurveTo(sd * (w - 10), -50, sd * (w - 7), -22); g.closePath(); g.fill(); }
  // the dome
  const dome = new Path2D(); dome.moveTo(-w - 9, -90); dome.bezierCurveTo(-w - 12, -h - 60, w + 12, -h - 60, w + 9, -90); dome.closePath();
  const dg = g.createLinearGradient(-w, -h - 50, w, -80); dg.addColorStop(0, mix(HAT, '#FFFFFF', 0.14)); dg.addColorStop(0.55, HAT); dg.addColorStop(1, HAT_D);
  g.fillStyle = dg; g.fill(dome);
  g.save(); g.clip(dome); g.strokeStyle = 'rgba(90,20,8,0.2)'; g.lineWidth = 3;  // the knit: ribs running up to the crown
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 17, -84); g.quadraticCurveTo(i * 15, -h - 10, i * 5, -h - 52); g.stroke(); }
  g.restore();
  // the folded cuff
  const cuff = new Path2D(); cuff.moveTo(-w - 13, -76); cuff.quadraticCurveTo(0, -90, w + 13, -76); cuff.lineTo(w + 11, -118); cuff.quadraticCurveTo(0, -134, -w - 11, -118); cuff.closePath();
  g.fillStyle = 'rgba(40,10,4,0.28)'; g.save(); g.translate(0, 6); g.fill(cuff); g.restore();
  g.fillStyle = HAT_D; g.fill(cuff);
  g.save(); g.clip(cuff); g.strokeStyle = 'rgba(255,190,160,0.2)'; g.lineWidth = 5;
  for (let x = -w - 10; x <= w + 12; x += 13) { g.beginPath(); g.moveTo(x, -70); g.lineTo(x + 2, -136); g.stroke(); }
  g.restore();
  // the bobble
  const bg = g.createRadialGradient(-7, -h - 68, 3, 0, -h - 60, 27); bg.addColorStop(0, mix(HAT, '#FFFFFF', 0.3)); bg.addColorStop(1, HAT);
  g.fillStyle = bg; g.beginPath(); g.arc(0, -h - 60, 25, 0, 7); g.fill();
}
CAST.hans = { face: [0.94, 1.07, 0.84], hair: 'custom', hairFx: hansHat, hairC: '#8A6A48', brow: '#6B5138', suit: '#1F8E8B', suitD: '#146562', shirt: 'hoodie', ears: 1.03, iris: '#6F8BA0' };
// his looks: at the bird (it works on his right, screen left), down at the board, up at us
const AT_BIRD = { ...EXPR.focus, brow: 0.3, lid: 0.1, look: [-0.95, -0.3], curve: 0.05 };
const AT_BOARD = { ...EXPR.focus, look: [0.25, 0.85], lid: 0.2 };
const GRIN = { ...EXPR.happy, look: [0, 0], lid: 0.12, blush: 0.4 };
const SMUG = { ...EXPR.smug, look: [0, 0], lid: 0.3 };
const SEES = { ...EXPR.neutral, brow: -0.2, browY: -8, lid: 0.02, look: [0.25, 0.8], curve: 0.35 };

// ---------- shared with the Hikaru episodes (episodes/hikaru213/scenes.js): screen helpers, the 3D toolkit, people ----------
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

// ---------- people in 3D: shoes, the shade under a figure ----------
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
// textures drawn once and kept (LED screens, the clock display); cleared when too many piled up
const TX = new Map();
function once(key, w, h, draw) { if (!TX.has(key)) { if (TX.size > 400) TX.clear(); TX.set(key, tex(w, h, draw)); } return TX.get(key); }

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

// ---------- timing helpers: a hit lands on a rendered frame; a train of hits; the pose that runs into each hit ----------
const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
const fr = x => Math.round(x * 30) / 30;
const train = (a, b, step = 1 / 6) => { const out = []; for (let x = a; x < b - 1e-6; x += step) out.push(fr(x)); return out; };
function strikeAt(t, hits, up = 0.09, down = 0.085) {
  let v = 0;
  for (const h of hits) { const d = t - h; if (d > -up && d <= 1e-6) v = Math.max(v, ease.in(clamp(1 + d / up))); else if (d > 0 && d < down) v = Math.max(v, 1 - d / down); }
  return v;
}

// ======================= THE WOODPECKER, after Chessigma's own (a teal egg of a bird, a red crest swept back, an orange
// beak, a big cream eye). Drawn facing +x in its own units (about 105 from the feet to the crest); the origin is where
// the feet grip. Poses: 'cling' — upright on a trunk in front of it, the tail propped on the bark; 'stand' — on
// something level; 'fly' — the origin is the body, the wing beats. peck 0..1 throws the head forward =======================
const POSE = {
  cling: { b: [-36, -30], lean: -0.16, h0: [-62, -86], h1: [-41, -82], neck: [-40, -58], tail: [[-50, -8], [-24, -2], [-1, 44], [-10, 46]],
    legs: [[[-19, -11], [0, -2], [2, -9]], [[-18, -3], [0, 7], [2, 13]]] },
  stand: { b: [-4, -42], lean: 0.2, h0: [8, -94], h1: [22, -84], neck: [1, -70], tail: [[-22, -32], [-8, -12], [-54, 0], [-58, -11]],
    legs: [[[-8, -9], [-4, 0], [7, 0]], [[1, -8], [5, 0], [16, 0]]] },
  fly: { b: [0, 0], lean: 0.95, h0: [38, -30], h1: [46, -26], neck: [24, -18], tail: [[-20, 0], [-10, 20], [-58, 30], [-62, 15]], legs: [] },
};
function birdBody(g, { pose = 'cling', peck = 0, look = [0.5, 0.1], blink = 0, flap = 0, reach = 0 } = {}) {  // reach: the neck stretches that far on the strike
  const P = POSE[pose], [bx, by] = P.b, hx = lerp(P.h0[0], P.h1[0] + reach, peck), hy = lerp(P.h0[1], P.h1[1], peck);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // tail: stiff dark feathers
  g.fillStyle = BIRDC.dark; g.beginPath(); P.tail.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo((P.tail[0][0] + P.tail[1][0]) / 2, (P.tail[0][1] + P.tail[1][1]) / 2); g.lineTo((P.tail[2][0] + P.tail[3][0]) / 2, (P.tail[2][1] + P.tail[3][1]) / 2); g.stroke();
  // legs and toes
  g.strokeStyle = BIRDC.leg; g.lineWidth = 4.6;
  for (const [a, b, c] of P.legs) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
  // body: an egg, lit from the upper left
  g.save(); g.translate(bx, by); g.rotate(P.lean);
  const bg = g.createRadialGradient(-9, -16, 3, 0, 0, 42); bg.addColorStop(0, BIRDC.light); bg.addColorStop(0.5, BIRDC.body); bg.addColorStop(1, BIRDC.dark);
  g.fillStyle = bg; g.beginPath(); g.ellipse(0, 0, 25, 37, 0, 0, 7); g.fill();
  g.save(); g.clip(); g.fillStyle = 'rgba(232,246,236,0.3)'; g.beginPath(); g.ellipse(15, 8, 13, 28, 0, 0, 7); g.fill(); g.restore();  // the pale belly
  // wing: folded on the side, or beating
  g.save(); g.translate(-4, -20);
  if (pose === 'fly') { g.rotate(-1.75 + flap * 2.1); g.scale(1.55, 1.55); } else g.rotate(-flap * 1.2);
  g.fillStyle = BIRDC.dark; g.beginPath(); g.moveTo(2, -6); g.bezierCurveTo(18, 8, 8, 40, -8, 56); g.bezierCurveTo(-18, 34, -16, 6, 2, -6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,225,214,0.4)'; g.lineWidth = 2.4;
  for (const k of [0.35, 0.62]) { g.beginPath(); g.moveTo(lerp(2, -8, k) + 9 * (1 - k), lerp(-6, 56, k)); g.lineTo(lerp(2, -8, k) - 8 * (1 - k * 0.5), lerp(-6, 56, k) + 6); g.stroke(); }
  g.restore();
  g.restore();
  // neck
  g.strokeStyle = BIRDC.body; g.lineWidth = 27; g.beginPath(); g.moveTo(P.neck[0], P.neck[1]); g.lineTo(hx, hy); g.stroke();
  // head: the crest and the beak under it
  g.save(); g.translate(hx, hy); g.rotate(lerp(-0.14, 0.06, peck));
  g.save(); g.rotate(0.28 * peck);
  const cg = g.createLinearGradient(-40, -36, 0, 0); cg.addColorStop(0, BIRDC.crest); cg.addColorStop(1, BIRDC.crestD);
  g.fillStyle = cg; g.beginPath(); g.moveTo(12, -18); g.quadraticCurveTo(-6, -42, -38, -38); g.quadraticCurveTo(-25, -31, -22, -25);
  g.quadraticCurveTo(-37, -26, -46, -15); g.quadraticCurveTo(-31, -15, -26, -9); g.quadraticCurveTo(-37, -5, -41, 6); g.quadraticCurveTo(-22, 3, -12, -10); g.closePath(); g.fill();
  g.restore();
  g.fillStyle = BIRDC.beak; g.beginPath(); g.moveTo(15, -10); g.lineTo(44, 3); g.lineTo(14, 12); g.closePath(); g.fill();
  g.fillStyle = BIRDC.beakD; g.beginPath(); g.moveTo(15, 3); g.lineTo(44, 3); g.lineTo(14, 12); g.closePath(); g.fill();
  const hg = g.createRadialGradient(-7, -9, 3, 0, 0, 25); hg.addColorStop(0, BIRDC.light); hg.addColorStop(0.55, BIRDC.body); hg.addColorStop(1, BIRDC.dark);
  g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill();
  if (blink > 0.5) { g.strokeStyle = BIRDC.dark; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, -3); g.quadraticCurveTo(8, 2, 17, -3); g.stroke(); }
  else {
    g.fillStyle = BIRDC.eye; g.beginPath(); g.arc(8, -4, 9.2, 0, 7); g.fill();
    g.fillStyle = '#17120F'; g.beginPath(); g.arc(8 + look[0] * 3.2, -4 + look[1] * 3.2, 4.9, 0, 7); g.fill();
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(6.4 + look[0] * 3.2, -6 + look[1] * 3.2, 1.6, 0, 7); g.fill();
  }
  g.restore();
}
// the bird at a world point (its feet; for 'fly' its body), `size` its standing height in world units; dir -1 faces -x;
// rot leans it forward about the origin. Returns the projection and its scale (pixels per bird unit)
function bird(g, x, y, z, size, t, { dir = 1, rot = 0, a = 1, ...o } = {}) {
  if (depth(x, y, z) < 0.8 || a <= 0) return null;
  const p = B.project(x, y, z), s = p.s * size / 105, bt = (t * 1.0 + x) % 2.6;
  g.save(); g.globalAlpha *= a; g.translate(p.x, p.y); g.rotate(rot * dir); g.scale(s * dir, s);
  birdBody(g, { blink: bt < 0.11 ? 1 : 0, ...o }); g.restore();
  return { x: p.x, y: p.y, s };
}
// chips of wood flying from a point on the screen after each hit (sc: pixels per bird unit; away: +1 right, -1 left)
function chips(g, x, y, sc, t, hits, away = 1, { n = 5, col = '#E9CFA0' } = {}) {
  for (const h of hits) {
    const dt = t - h; if (dt < 0 || dt > 0.5) continue;
    const r = rng(Math.round(h * 977) + 3);
    for (let i = 0; i < n; i++) {
      const vx = away * (50 + r() * 150), vy = -(40 + r() * 190), w = 3 + r() * 5, sp = (r() - 0.5) * 30;
      const cx = x + (vx * dt) * sc, cy = y + (vy * dt + 420 * dt * dt) * sc;
      g.save(); g.globalAlpha *= 1 - dt / 0.5; g.translate(cx, cy); g.rotate(sp * dt); g.fillStyle = i % 2 ? col : mix(col, '#8A5E36', 0.45);
      g.fillRect(-w * sc / 2, -w * sc * 0.3, w * sc, w * sc * 0.6); g.restore();
    }
  }
}

// ======================= THE WOOD: birches in the Swedish summer under a blue sky; a wooden table with the board; the
// hero birch behind its far corner, where the woodpecker works =======================
const SKYC = ['#4BA9EA', '#A2DAF7', '#E3F6F2'], HAZE = '#CDEBD9';
const fogW = (col, d, k = 1) => mix(col, HAZE, clamp((d - 12) / 70) * 0.82 * k);
const WOODT = { table: ['#D8AC72', '#8C6239', '#B5814C'] };
const WOODB = { light: '#EAD7AE', dark: '#A8733F', frame: '#6E4526', side: '#2C1B0F', m: 0.42, th: 0.4, rc: 0.3 };
const LEAVES = ['#86CC4A', '#6DBA3E', '#A0DA60', '#58A738'];
// bark for the near trunks: white with grey sides, dark lenticels and the black scars of old branches
const BARK = tex(240, 2400, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#BCC6C4'); gr.addColorStop(0.2, '#F1F0E8'); gr.addColorStop(0.5, '#FCFBF6'); gr.addColorStop(0.8, '#E2E5DF'); gr.addColorStop(1, '#A7B3B4');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const r = rng(5);
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(160,150,135,${0.1 + r() * 0.14})`; x.fillRect(0, r() * h, w, 3 + r() * 7); }  // peeling bands
  for (let i = 0; i < 230; i++) { const y = r() * h, cx = r() * w, l = 12 + r() * 46; x.fillStyle = `rgba(48,44,40,${0.3 + r() * 0.5})`; x.beginPath(); x.ellipse(cx, y, l / 2, 1.8 + r() * 2.6, 0, 0, 7); x.fill(); }
  for (let i = 0; i < 13; i++) {
    const y = 80 + r() * (h - 160), cx = 40 + r() * (w - 80), s = 20 + r() * 22;
    x.fillStyle = '#2B2724'; x.beginPath(); x.moveTo(cx - s * 1.6, y); x.quadraticCurveTo(cx, y - s * 1.3, cx + s * 1.6, y); x.quadraticCurveTo(cx, y + s * 0.55, cx - s * 1.6, y); x.fill();
    x.fillStyle = 'rgba(43,39,36,0.5)'; x.beginPath(); x.moveTo(cx - s * 0.5, y + s * 0.2); x.lineTo(cx + s * 0.5, y + s * 0.2); x.lineTo(cx, y + s * 2.2); x.fill();
  }
});
// the far wood: seeded trunks with crowns; a few nearer ones frame the table
const TREES = (() => {
  const r = rng(77), a = [];
  const crown = (h, n = 12, k = 1) => { const c = []; for (let i = 0; i < n; i++) c.push({ dx: (r() - 0.5) * 8, dz: (r() - 0.5) * 3, y: 9 + r() * (h - 7), r: (1.5 + r() * 1.8) * k, c: Math.floor(r() * 4) }); return c; };
  for (let i = 0; i < 44; i++) { const z = 16 + r() * 62, x = -52 + r() * 112, h = 20 + r() * 12; a.push({ x, z, r: 0.42 + r() * 0.36, s: r() * 100, h, crown: crown(h) }); }
  for (const [x, z, rr] of [[-9.5, 13.5, 0.62], [-14.5, 7.5, 0.7], [13.4, 12.5, 0.66], [18.5, 6, 0.72], [10.2, 19, 0.6], [-5.2, 21, 0.58], [5.4, 24, 0.55]]) a.push({ x, z, r: rr, s: r() * 100, h: 27, crown: crown(27, 22, 0.8), near: true });
  return a;
})();
const HERO = { x: -0.75, z: 10.7, r: 0.95, h: 30, s: 13 };
const HERO_CROWN = (() => { const r = rng(31), a = []; for (let i = 0; i < 34; i++) a.push([-8 + r() * 17, 12.6 + r() * 9, 1.0 + r() * 1.3, Math.floor(r() * 4), r() * 2]); return a; })();
// hanging twigs of the hero birch: [x, top, length, seed]
const TWIGS = [[-3.6, 8.9, 3.2, 1], [-2.2, 9.6, 4.3, 2], [1.4, 9.8, 3.0, 3], [2.7, 9.4, 3.9, 4], [4.4, 10.2, 3.3, 5], [5.9, 9.7, 4.4, 6], [7.6, 10.4, 3.4, 7], [-5.2, 9.9, 3.8, 8]];
const FARW = (() => { const r = rng(9), a = []; for (let x = -460; x <= 460; x += 6) a.push([x, 15 + r() * 11 + (r() < 0.2 ? 7 : 0)]); return a; })();
const MEADOW = (() => { const r = rng(41), a = []; for (let i = 0; i < 120; i++) a.push({ x: -22 + r() * 52, z: -6 + r() * 44, k: r(), f: r() < 0.42 ? (r() < 0.5 ? 1 : 2) : 0, ph: r() * 6 }); return a; })();
function ridgeW(g, pts, z, col) {
  if (depth(0, 0, z) < 4) return;
  g.fillStyle = col; g.beginPath();
  const q0 = B.project(pts[0][0], FLOOR_Y, z); g.moveTo(q0.x, q0.y);
  for (const [x, h] of pts) { const p = B.project(x, FLOOR_Y + h, z); g.lineTo(p.x, p.y); }
  const q1 = B.project(pts[pts.length - 1][0], FLOOR_Y, z); g.lineTo(q1.x, q1.y); g.closePath(); g.fill();
}
function leafBlob(g, x, y, z, r, ci, t, seed) {
  const d = depth(x, y, z); if (d < 2) return;
  const p = B.project(x + Math.sin(t * 0.7 + seed) * 0.12, y, z), R = r * p.s, c = fogW(LEAVES[ci], d);
  if (p.x < -R || p.x > W + R || p.y < -R || p.y > H + R) return;
  g.fillStyle = mix(c, '#1E4A1A', 0.22); g.beginPath(); g.ellipse(p.x + R * 0.06, p.y + R * 0.1, R, R * 0.8, 0, 0, 7); g.fill();
  g.fillStyle = c; g.beginPath(); g.ellipse(p.x - R * 0.05, p.y - R * 0.06, R * 0.9, R * 0.7, 0, 0, 7); g.fill();
  g.fillStyle = mix(c, '#F4FFC8', 0.3); g.beginPath(); g.ellipse(p.x - R * 0.3, p.y - R * 0.3, R * 0.5, R * 0.34, -0.3, 0, 7); g.fill();
}
// a trunk: a strip across the line of sight. Far ones are flat with a few dark marks, near ones wear the bark texture
function trunk(g, tr, textured) {
  const d = depth(tr.x, 2, tr.z); if (d < 1.5) return;
  const rx = B.R[0] * tr.r, rz = B.R[2] * tr.r, top = tr.h, k = 0.55;
  if (textured) {
    for (let y0 = FLOOR_Y, i = 0; y0 < Math.min(top, 21); y0 += 12, i++) {
      const fl = (i + Math.round(tr.s)) % 2 ? -1 : 1;
      texQuad(g, BARK, [tr.x - rx * fl, y0 + 12, tr.z - rz * fl], [tr.x + rx * fl, y0 + 12, tr.z + rz * fl], [tr.x - rx * fl, y0, tr.z - rz * fl], { under: true });
    }
    return;
  }
  if (!B.poly(g, [[tr.x - rx, FLOOR_Y, tr.z - rz], [tr.x + rx, FLOOR_Y, tr.z + rz], [tr.x + rx * k, top, tr.z + rz * k], [tr.x - rx * k, top, tr.z - rz * k]])) return;
  const a = B.project(tr.x - rx, 2, tr.z - rz), b = B.project(tr.x + rx, 2, tr.z + rz);
  const gr = g.createLinearGradient(a.x, 0, b.x, 0); gr.addColorStop(0, fogW('#C2CBC8', d)); gr.addColorStop(0.35, fogW('#F7F6F0', d)); gr.addColorStop(1, fogW('#B4BEBF', d));
  g.fillStyle = gr; g.fill();
  g.fillStyle = fogW('#3A3632', d, 0.9);
  for (let i = 0; i < 9; i++) {
    const y = FLOOR_Y + 0.6 + hash(tr.s + i * 1.7) * 15, p = B.project(tr.x + (hash(tr.s * 3 + i) - 0.5) * tr.r, y, tr.z);
    if (p.y < -20 || p.y > H + 20) continue;
    g.beginPath(); g.ellipse(p.x, p.y, p.s * tr.r * (0.3 + hash(i + tr.s) * 0.45), Math.max(1, p.s * (0.05 + hash(i * 2 + tr.s) * 0.07)), 0, 0, 7); g.fill();
  }
}
function wood(g, t, { hero = true } = {}) {
  const E = B.E, fw = [-Math.sin(B.yaw), 0, Math.cos(B.yaw)];
  const hz = B.project(E[0] + fw[0] * 1e5, FLOOR_Y, E[2] + fw[2] * 1e5).y;
  const sk = g.createLinearGradient(0, hz - 1500, 0, hz); sk.addColorStop(0, SKYC[0]); sk.addColorStop(0.6, SKYC[1]); sk.addColorStop(1, SKYC[2]);
  g.fillStyle = sk; g.fillRect(0, 0, W, H);
  // the sun's glow high on the left
  { const sx = W * 0.2 - B.yaw * 500, sy = hz - 1150, R = 900, sg = g.createRadialGradient(sx, sy, 0, sx, sy, R);
    sg.addColorStop(0, 'rgba(255,250,224,0.85)'); sg.addColorStop(0.25, 'rgba(255,246,210,0.3)'); sg.addColorStop(1, 'rgba(255,244,200,0)'); g.fillStyle = sg; g.fillRect(sx - R, sy - R, R * 2, R * 2); }
  ridgeW(g, FARW, 190, '#A9D6C4'); ridgeW(g, FARW.map(([x, h]) => [x * 0.8 + 30, h * 0.92]), 120, '#8FCBA2');
  // the meadow
  const gg = g.createLinearGradient(0, hz, 0, Math.max(hz + 400, H)); gg.addColorStop(0, '#B4DFA0'); gg.addColorStop(0.25, '#8CCB5C'); gg.addColorStop(1, '#63AC3E');
  g.fillStyle = gg; g.fillRect(0, hz, W, H - hz);
  // pools of sunlight and the shade of the trees on the grass
  const rs = rng(23);
  for (let i = 0; i < 16; i++) { const x = -26 + rs() * 60, z = 2 + rs() * 46; pool(g, B, x, FLOOR_Y, z, 2.6 + rs() * 3.4, '#FFF7B8', 0.2 + rs() * 0.14); }
  const items = [];
  for (const tr of TREES) items.push([depth(tr.x, 2, tr.z), 0, tr]);
  for (const m of MEADOW) items.push([depth(m.x, FLOOR_Y, m.z), 1, m]);
  if (hero) items.push([depth(HERO.x, 2, HERO.z), 2, HERO]);
  items.sort((a, b) => b[0] - a[0]);
  g.save(); g.lineCap = 'round';
  for (const [d, kind, o] of items) {
    if (d < 1.2) continue;
    if (kind === 1) {  // a tuft of grass, with a flower in some
      const p = B.project(o.x, FLOOR_Y, o.z), s = p.s; if (p.x < -60 || p.x > W + 60 || p.y > H + 40) continue;
      const sw = Math.sin(t * 1.6 + o.ph) * 0.14;
      g.strokeStyle = fogW(o.k < 0.5 ? '#4E9A34' : '#79BE48', d); g.lineWidth = Math.max(1, s * 0.035); g.beginPath();
      for (let k = -2; k <= 2; k++) { g.moveTo(p.x + k * s * 0.07, p.y); g.quadraticCurveTo(p.x + k * s * 0.1 + sw * s * 0.3, p.y - s * 0.24, p.x + k * s * 0.17 + sw * s * 0.7, p.y - s * (0.4 + 0.07 * (2 - Math.abs(k)))); }
      g.stroke();
      if (o.f) { const fx = p.x + sw * s * 0.5, fy = p.y - s * 0.52; g.fillStyle = fogW(o.f === 1 ? '#FFFFFF' : '#FFE14A', d, 0.6); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(fx + Math.cos(k * 1.257) * s * 0.07, fy + Math.sin(k * 1.257) * s * 0.07, Math.max(1, s * 0.055), 0, 7); g.fill(); }
        g.fillStyle = fogW(o.f === 1 ? '#FFC93A' : '#3F7FD0', d, 0.6); g.beginPath(); g.arc(fx, fy, Math.max(1, s * 0.05), 0, 7); g.fill(); }
      continue;
    }
    // the shade under a tree, its trunk, its crown
    const sp = B.project(o.x, FLOOR_Y, o.z), sr = sp.s * (o.r * 3.2 + 1.4);
    if (d > 2.5 && sp.y < H + sr) { const sg = g.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sr); sg.addColorStop(0, 'rgba(24,70,30,0.42)'); sg.addColorStop(1, 'rgba(24,70,30,0)');
      g.save(); g.translate(sp.x, sp.y); g.scale(1, 0.3); g.translate(-sp.x, -sp.y); g.fillStyle = sg; g.fillRect(sp.x - sr, sp.y - sr, sr * 2, sr * 2); g.restore(); }
    trunk(g, o, kind === 2 || (o.near && d < 26));
    if (kind === 2) { for (const [dx, y, r, c, dz] of HERO_CROWN) leafBlob(g, o.x + dx, y, o.z + 0.4 + dz, r, c, t, dx); }
    else for (const c of o.crown) leafBlob(g, o.x + c.dx, c.y, o.z + c.dz, c.r, c.c, t, o.s + c.dx);
  }
  g.restore();
  if (hero) twigs(g, t);
  return hz;
}
// the hero birch's hanging twigs: thin dark threads with small leaves, swaying
function twigs(g, t) {
  for (const [x, top, len, sd] of TWIGS) {
    const z = HERO.z - 0.5 + (sd % 3) * 0.5; if (depth(x, top, z) < 1.5) continue;
    const n = Math.round(len / 0.34), pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push(B.project(x + Math.sin(t * 1.1 + sd * 1.9 + u * 2.2) * 0.22 * u, top - u * len, z)); }
    g.strokeStyle = '#4A3A2A'; g.lineWidth = Math.max(1, pts[0].s * 0.022); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    pts.forEach((p, i) => { if (!i) return; const sdn = i % 2 ? 1 : -1, r = p.s * 0.17;
      g.fillStyle = LEAVES[(i + sd) % 4]; g.beginPath(); g.ellipse(p.x + sdn * r * 0.9, p.y + r * 0.3, r, r * 0.55, sdn * 0.7, 0, 7); g.fill(); });
  }
}
// where the bird grips the hero birch: the edge of the trunk as the camera sees it, on the table's side
const HANS = { x: 4.25, z: 9.3 }, PERCH_Y = 3.72, BIRD_SIZE = 2.15, KN_Y = 1.3, KN_H = 1.5;
const perch = (y = PERCH_Y) => [HERO.x + B.R[0] * HERO.r * 0.97, y, HERO.z + B.R[2] * HERO.r * 0.97 - 0.02];
// the bird on its birch: the hollow it has cut, the bird, the chips. o: {hits, look, peck (override), y, a}
function birdOnTrunk(g, t, { hits = [], look = [0.5, 0.1], y = PERCH_Y, peck = null, a = 1, size = BIRD_SIZE, hole = true } = {}) {
  const [x, , z] = perch(y); if (depth(x, y, z) < 0.8) return null;
  const v = peck ?? strikeAt(t, hits), p = B.project(x, y, z), s = p.s * size / 105;
  const hx = p.x - 9 * s, hy = p.y - 80 * s;  // where the beak lands
  if (hole) { g.fillStyle = '#E8C99A'; g.beginPath(); g.ellipse(hx, hy, 12 * s, 17 * s, 0, 0, 7); g.fill(); g.fillStyle = '#4A3222'; g.beginPath(); g.ellipse(hx - 1.5 * s, hy, 8 * s, 12.5 * s, 0, 0, 7); g.fill(); }
  bird(g, x, y, z, size, t, { dir: -1, pose: 'cling', peck: v, rot: -0.1 * (1 - v), look, a });
  chips(g, hx + 6 * s, hy, s, t, hits, 1);
  return { x: p.x, y: p.y, s, hx, hy };
}
// the table in the wood: Hans at the board, the bird on its birch. hans: {e, hits, dy, tilt}: with hits he jabs a white
// knight, snout first, into the same birch right under the bird, in his right fist (screen left)
function forest(g, t, { pieces = null, hans = null, brd = null, under = null, over = null, focus = null, dof = 0.5, extra = null, hero = true, onTrunk = null, board = true, tbl = {} } = {}) {
  wood(g, t, { hero });
  if (onTrunk) onTrunk(g);
  let hb = null, kn = null;
  if (hans && hans.hits) {  // the dent his knight has made in the bark
    const v = strikeAt(t, hans.hits), [ex, , ez] = perch(KN_Y), d0 = B.project(ex - 0.02, KN_Y + KN_H * 0.56, ez);
    g.fillStyle = '#E8C99A'; g.beginPath(); g.ellipse(d0.x, d0.y, d0.s * 0.1, d0.s * 0.13, 0, 0, 7); g.fill(); g.fillStyle = '#6A4A30'; g.beginPath(); g.ellipse(d0.x - d0.s * 0.01, d0.y, d0.s * 0.06, d0.s * 0.09, 0, 0, 7); g.fill();
    kn = { v, x: ex + KN_H * 0.31 + 0.5 * (1 - v), y: KN_Y, z: ez - 0.25, d0 };
  }
  if (brd) birdOnTrunk(g, t, brd);
  if (hans) {
    const reach = kn ? { x: kn.x, z: kn.z, y: kn.y + 0.12, u: 1, hold: true } : hans.reach || null;
    hb = seated(g, B, 'hans', hans.e || 'neutral', t, { x: HANS.x, z: HANS.z, lift: 3.1 + (hans.dy || 0) - (kn ? 0.07 * kn.v : 0), tilt: (hans.tilt || 0) - (kn ? 0.03 * kn.v : 0), reach, side: -1, alpha: hans.a ?? 1 });
  }
  table(g, B, WOODT, tbl);
  if (extra) extra(g, 'table');
  if (board) B.drawSlab(g, WOODB);
  if (under) under(g);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof });
  if (over) over(g);
  if (kn) { const p = B.project(kn.x, kn.y, kn.z); drawPiece(g, 'n', 'w', p.x, p.y + p.s * 0.06, p.s * KN_H); }
  if (hb) hb();
  if (extra) extra(g, 'top');
}

// ======================= HIS STUDY: a bright Swedish room — pale walls, birch furniture, a window onto the birches, a
// flag on the wall, a shelf of books =======================
const STUDY = { base: '#E7DFCD', wall: ['#F5EFE0', '#F0E9D8'], seam: '#E6DDC8', rail: '#FFFDF6', floor: ['#D8B27E', '#CFA873'], light: '#FFF3DA', lightA: 0.3,
  table: ['#E3C08C', '#A67C4C', '#C89E67'] };
const fogS = (col, x, y, z) => mix(col, STUDY.base, clamp((depth(x, y, z) - 9) / 26) * 0.85);
// the view out of the window: the same birches under the same sky
const VIEW = tex(900, 1150, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h * 0.7); gr.addColorStop(0, SKYC[0]); gr.addColorStop(1, '#D4EFF8'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [cx, cy, s] of [[170, 150, 1], [640, 250, 0.7]]) for (const [dx, dy, r] of [[0, 0, 60], [56, -24, 52], [112, 4, 44], [-50, 12, 40]]) { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, r * s, 0, 7); x.fill(); }
  x.fillStyle = '#9FD3A8'; x.beginPath(); x.moveTo(0, 640); for (let i = 0; i <= 18; i++) x.lineTo(i * 50, 600 + Math.sin(i * 1.9) * 26); x.lineTo(w, h); x.lineTo(0, h); x.fill();
  x.fillStyle = '#86C860'; x.fillRect(0, 800, w, h - 800);
  const r = rng(8);
  for (const [tx, tw] of [[110, 54], [330, 40], [520, 62], [700, 44], [830, 50]]) {
    const tg = x.createLinearGradient(tx, 0, tx + tw, 0); tg.addColorStop(0, '#C9D1CE'); tg.addColorStop(0.4, '#FBFAF4'); tg.addColorStop(1, '#B9C3C2'); x.fillStyle = tg; x.fillRect(tx, 180, tw, 900);
    x.fillStyle = '#34302C'; for (let i = 0; i < 16; i++) { x.beginPath(); x.ellipse(tx + r() * tw, 200 + r() * 860, 6 + r() * 14, 2 + r() * 3, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 9; i++) { x.fillStyle = LEAVES[i % 4]; x.beginPath(); x.ellipse(tx + tw / 2 + (r() - 0.5) * 230, 60 + r() * 330, 60 + r() * 50, 46 + r() * 36, 0, 0, 7); x.fill(); }
  }
});
const WIN = { x0: 7.4, x1: 12.6, y0: 1.0, y1: 9.6, z: 12.96 };
function studyWindow(g) {
  const { x0, x1, y0, y1, z } = WIN, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2 + 0.6, FR = '#FBF8F1', f = 0.2;
  const p = B.project(xm, ym, z); if (depth(xm, ym, z) > 0.8) rim(g, p.x, p.y, p.s * 7.5, '#FFF4D8', 0.3);
  texQuad(g, VIEW, [x0, y1, z], [x1, y1, z], [x0, y0, z]);
  ab(g, [x0 - f, y1, z - 0.14], [x1 + f, y1 + f * 1.4, z], FR, { amb: 0.82 });
  ab(g, [x0 - f, y0, z - 0.14], [x0, y1, z], FR, { amb: 0.82 });
  ab(g, [x1, y0, z - 0.14], [x1 + f, y1, z], FR, { amb: 0.82 });
  ab(g, [xm - 0.07, y0, z - 0.09], [xm + 0.07, y1, z], FR, { amb: 0.82 });
  ab(g, [x0, ym - 0.07, z - 0.09], [x1, ym + 0.07, z], FR, { amb: 0.82 });
  ab(g, [x0 - 0.5, y0 - 0.3, z - 0.62], [x1 + 0.5, y0, z], FR, { amb: 0.78 });
  for (const [c0, c1] of [[x0 - 1.9, x0 - 0.12], [x1 + 0.12, x1 + 1.9]])  // linen curtains in the flag's blue
    for (let i = 0, x = c0; x < c1 - 1e-6; x += 0.376, i++) {
      const xb = Math.min(c1, x + 0.39), k = 0.5 + 0.5 * Math.sin(i * 1.9);
      quad(g, [[x, y1 + 1.05, z - 0.32], [xb, y1 + 1.05, z - 0.32], [xb, FLOOR_Y + 0.35, z - 0.32], [x, FLOOR_Y + 0.35, z - 0.32]], fogS(mix('#3F78B4', '#6FA2D2', k), x, 3, z));
    }
  ab(g, [x0 - 2.2, y1 + 1.0, z - 0.42], [x1 + 2.2, y1 + 1.18, z - 0.26], '#C9A46E', { amb: 0.7 });
  pool(g, B, xm, FLOOR_Y, z - 4.5, 5.5, '#FFF3D6', 0.26);
}
// the Swedish flag, pinned to the wall: blue, a yellow cross set toward the hoist
const FLAG = tex(320, 200, (x, w, h) => { x.fillStyle = '#1B62A8'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFCD00'; x.fillRect(100, 0, 40, h); x.fillRect(0, 80, w, 40); });
const SHELF = { x0: -5.8, x1: 4.4, y: 6.0, z0: 12.0 };
// a framed print right of the shelf's books: a knight in ink
const PRINT = tex(300, 380, (x, w, h) => { x.fillStyle = '#F7F1E4'; x.fillRect(0, 0, w, h); x.fillStyle = '#E3D7BF'; x.fillRect(34, 34, w - 68, h - 68); drawPiece(x, 'n', 'k', w / 2, h * 0.74, 190); });
function studyWall(g, t) {
  studyWindow(g);
  texQuad(g, FLAG, [0.3, 4.1, 12.93], [2.86, 4.1, 12.93], [0.3, 2.5, 12.93]);
  ab(g, [-4.9, 1.6, 12.86], [-2.5, 4.7, 12.97], '#B98B55', { amb: 0.75 });
  texQuad(g, PRINT, [-4.76, 4.56, 12.85], [-2.64, 4.56, 12.85], [-4.76, 1.74, 12.85]);
  // the shelf: a birch board on two brackets, a row of books at its left end
  const { x0, x1, y, z0 } = SHELF;
  for (const bx of [x0 + 1.2, x1 - 1.2]) ab(g, [bx - 0.08, y - 0.9, 12.3], [bx + 0.08, y, 12.96], '#B99560', { amb: 0.7 });
  ab(g, [x0, y, z0], [x1, y + 0.2, 12.96], '#E3C08C', { amb: 0.72 });
  const cols = ['#2F6FA8', '#C9463A', '#E0B13E', '#3F8C63', '#6A5ACD', '#D97A3A'];
  let bx = x0 + 0.25; cols.forEach((c, i) => { const w = 0.3 + (i % 3) * 0.08, h = 1.5 + (i % 2) * 0.35; ab(g, [bx, y + 0.2, 12.2], [bx + w, y + 0.2 + h, 12.9], c, { amb: 0.66 }); bx += w + 0.03; });
}
// the desk things: a pile of books by the board, a mug
function deskThings(g) {
  const bk = [['#3F8C63', 0.34], ['#C9463A', 0.3], ['#2F6FA8', 0.36]]; let y = -0.35;
  bk.forEach(([c, h], i) => { obox(g, [-2.1 + i * 0.07, y + h / 2, 6.6], [0.95, h / 2, 1.25], c, { ry: 0.12 * (i - 1) }, { amb: 0.64 }); obox(g, [-2.1 + i * 0.07 + 0.02, y + h / 2, 6.6], [0.9, h / 2 - 0.05, 1.27], '#F3EEE2', { ry: 0.12 * (i - 1) }, { amb: 0.8 }); obox(g, [-2.1 + i * 0.07, y + h - 0.03, 6.6], [0.95, 0.03, 1.25], c, { ry: 0.12 * (i - 1) }, { amb: 0.7 }); y += h; });
  lathe(g, 9.9, 6.4, [[-0.35, 0.36, 0.36], [0.45, 0.4, 0.4]], '#F4F1EA', { n: 20, amb: 0.7 });
  lathe(g, 9.9, 6.4, [[0.38, 0.33, 0.33], [0.44, 0.33, 0.33]], '#5A3A22', { n: 20, amb: 0.8 });
}
// the place for the title on his chest: an empty dashed ring with GM in it, while he is not a grandmaster
function medal(g, t, { ghost = 1, x = 4, z = 9.3, lift = 3.1 } = {}) {
  if (ghost <= 0 || depth(x, lift, z) < 0.8) return;
  const p = B.project(x, lift, z), s = p.s * 1.05 / 100, bob = Math.sin(t * 1.7 + 4 * 1.7 + p.x * 0.01) * 4 * s;
  const cx = p.x + 78 * s, cy = p.y + 262 * s + bob, r = 44 * s;
  g.save(); g.globalAlpha *= ghost; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(2, 5 * s); g.setLineDash([12 * s, 9 * s]); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); g.setLineDash([]);
  g.font = sans(Math.round(34 * s), 900); g.fillStyle = 'rgba(255,255,255,0.85)'; inkText(g, 'GM', cx, cy); g.restore();
}
// the study with Hans at his board. o.hans: {e, reach, dy, tilt}; o.md: see medal()
function study(g, t, { pieces = null, hans = {}, under = null, over = null, focus = null, dof = 0.5, md = null, extra = null } = {}) {
  room(g, B, STUDY, { t });
  studyWall(g, t);
  const hb = hans ? seated(g, B, 'hans', hans.e || 'neutral', t, { x: 4, z: 9.3, lift: 3.1 + (hans.dy || 0), tilt: hans.tilt || 0, reach: hans.reach || null, side: hans.side ?? 1, alpha: hans.a ?? 1 }) : null;
  if (hans && md && B.E[2] < 9.3) medal(g, t, md);
  table(g, B, STUDY, { x0: -3.0, x1: 10.6 });
  box(g, B, [-3.7, -0.75, -14], [11.3, -0.35, -1.1], { top: STUDY.table[0], side: STUDY.table[2], front: STUDY.table[2] });  // the desk runs on toward the viewer: no front edge under a high camera
  deskThings(g);
  if (extra) extra(g, 'table');
  B.drawSlab(g, WOODB);
  if (under) under(g);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof });
  if (over) over(g);
  if (hb) hb();
  if (extra) extra(g, 'top');
}
// the puzzle played out: 1.Qg8+ Rxg8 2.Nf7#, each move `mv` seconds with `gap` between, from t0
function solve(t, t0, mv = SLIDE, gap = 0.12) {
  if (t < t0) return { pieces: piecesAt(PZ, 0), k: 0, lt: 0, done: false };
  const step = mv + gap, k = Math.min(3, Math.floor((t - t0) / step) + 1), lt = t - t0 - (k - 1) * step;
  return { pieces: piecesAt(PZ, k, clamp(lt / mv), SLIDE_OPTS), k, lt, mv, done: k === 3 && lt >= mv, mate: t0 + 2 * step + mv };
}
const solveUnder = (g, S, hold = 1.3) => { if (S.k > 0) moveUnder(g, B, moveOf(PZ, S.k), S.lt, { dur: S.mv, hold }); };
const solveOver = (g, S, hold = 1.3, label = true) => { if (S.k > 0) moveOver(g, B, moveOf(PZ, S.k), S.lt, { dur: S.mv, hold, label }); };

// ======================= THE WALL: 1,128 puzzle cards, 24 across and 47 down, floor to ceiling =======================
const WG = { cols: 24, rows: 47, p: 0.36, z: 12.9, x0: 4 - 12 * 0.36, top: FLOOR_Y + 0.2 + 47 * 0.36 }, CELL = 48;
// one card: a little board with a few men on it; state 1 adds the green tick of a solved one, 2 turns it gold
function cardCell(x, px, py, sz, seed, state, k = 1) {
  const r = rng(seed * 7 + 11), m = sz * (0.5 - 0.44 * k), cw = sz - 2 * m;
  x.fillStyle = 'rgba(60,40,20,0.28)'; x.fillRect(px + m + sz * 0.03, py + m + sz * 0.05, cw, cw);
  x.fillStyle = state === 2 ? '#FFE38F' : state === 1 ? '#E3F3D0' : '#FBF7EC'; x.fillRect(px + m, py + m, cw, cw);
  const bs = cw * 0.72, bx = px + m + (cw - bs) / 2, by = py + m + cw * 0.09, q = bs / 4;
  const [lt, dk] = state === 2 ? ['#FBD25A', '#DCA02A'] : state === 1 ? ['#D6E6BE', '#8FB36A'] : ['#EAD9B5', '#B58A5A'];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? dk : lt; x.fillRect(bx + i * q, by + j * q, q + 0.5, q + 0.5); }
  for (let n = 0; n < 4; n++) { const i = Math.floor(r() * 4), j = Math.floor(r() * 4); x.fillStyle = n % 2 ? '#2A2623' : '#FFFFFF'; x.beginPath(); x.arc(bx + (i + 0.5) * q, by + (j + 0.5) * q, q * 0.3, 0, 7); x.fill(); }
  if (state) {
    const cx = px + sz - m - cw * 0.2, cy = py + sz - m - cw * 0.2, rr = cw * 0.17;
    x.fillStyle = state === 2 ? '#B9780E' : '#3E9A3A'; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill();
    x.strokeStyle = '#FFFFFF'; x.lineWidth = cw * 0.055; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx - rr * 0.45, cy); x.lineTo(cx - rr * 0.1, cy + rr * 0.38); x.lineTo(cx + rr * 0.5, cy - rr * 0.35); x.stroke();
  }
}
const WALLT = [0, 1, 2].map(st => tex(WG.cols * CELL, WG.rows * CELL, (x, w, h) => { x.fillStyle = '#C8A46C'; x.fillRect(0, 0, w, h); for (let r = 0; r < WG.rows; r++) for (let c = 0; c < WG.cols; c++) cardCell(x, c * CELL, r * CELL, CELL, r * WG.cols + c, st); }));
// the wall behind the cards: plaster, a skirting board, the floor in front
function wallRoom(g) {
  const z = WG.z;
  g.fillStyle = STUDY.wall[0]; g.fillRect(0, 0, W, H);
  for (let i = 0, x = -44; x < 52; x += 2, i++) quad(g, [[x, FLOOR_Y, z], [x + 2, FLOOR_Y, z], [x + 2, FLOOR_Y, -30], [x, FLOOR_Y, -30]], STUDY.floor[i % 2]);
  quad(g, [[-44, FLOOR_Y, z - 0.04], [52, FLOOR_Y, z - 0.04], [52, FLOOR_Y + 0.5, z - 0.04], [-44, FLOOR_Y + 0.5, z - 0.04]], '#FFFDF6');
  pool(g, B, 4, FLOOR_Y, z - 4, 9, '#FFF3D6', 0.22);
}
// n cards solved, in reading order; gold 0..1 turns the whole wall gold; state(c, r) for the cards of a close view
function cardWall(g, t, { n = 0, gold = 0, glow = 1, state = null } = {}) {
  const { cols, rows, p, z, x0, top } = WG, x1 = x0 + cols * p, y0 = top - rows * p;
  wallRoom(g);
  quad(g, [[x0 - 0.3, top + 0.3, z - 0.02], [x1 + 0.3, top + 0.3, z - 0.02], [x1 + 0.3, y0 - 0.3, z - 0.02], [x0 - 0.3, y0 - 0.3, z - 0.02]], '#A9814C');
  quad(g, [[x0 - 0.12, top + 0.12, z - 0.03], [x1 + 0.12, top + 0.12, z - 0.03], [x1 + 0.12, y0 - 0.12, z - 0.03], [x0 - 0.12, y0 - 0.12, z - 0.03]], '#C8A46C');
  const px = B.project(4, B.T[1], z).s * p;
  if (px > 64 && Math.abs(B.yaw) < 0.03 && Math.abs(B.pitch) < 0.03) {  // close and square on: every card drawn sharp
    const a = B.project(x0, top, z - 0.05);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const X = a.x + c * px, Y = a.y + r * px; if (X > W || Y > H || X < -px || Y < -px) continue;
      const st = state ? state(c, r) : [r * cols + c < n ? 1 : 0, 1];
      cardCell(g, X, Y, px, r * cols + c, st[0], st[1] ?? 1);
    }
    return;
  }
  texQuad(g, WALLT[0], [x0, top, z - 0.05], [x1, top, z - 0.05], [x0, y0, z - 0.05], { under: false });
  const full = Math.min(rows, Math.floor(n / cols)), rem = full >= rows ? 0 : Math.floor(n) % cols;
  if (full > 0) texQuad(g, WALLT[1], [x0, top, z - 0.06], [x1, top, z - 0.06], [x0, top - full * p, z - 0.06], { under: false, src: [0, 0, cols * CELL, full * CELL] });
  if (rem > 0) texQuad(g, WALLT[1], [x0, top - full * p, z - 0.06], [x0 + rem * p, top - full * p, z - 0.06], [x0, top - (full + 1) * p, z - 0.06], { under: false, src: [0, full * CELL, rem * CELL, CELL] });
  if (gold > 0) texQuad(g, WALLT[2], [x0, top, z - 0.07], [x1, top, z - 0.07], [x0, y0, z - 0.07], { under: false, a: gold });
  if (glow > 0 && n > 0 && n < cols * rows) {  // the row being solved lights up, brightest at the card in hand
    const yy = top - (full + 0.5) * p, a = B.project(x0, yy, z - 0.08), b = B.project(x1, yy, z - 0.08), c = B.project(x0 + (rem + 0.5) * p, yy, z - 0.08), R = c.s * 1.3;
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.45 * glow; g.fillStyle = '#FFF6C8'; g.fillRect(a.x, a.y - a.s * p * 0.7, b.x - a.x, a.s * p * 1.4);
    const rg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.globalAlpha = glow; g.fillStyle = rg; g.fillRect(c.x - R, c.y - R, R * 2, R * 2); g.restore();
  }
}
// the one card the camera starts on: the puzzle on his board, drawn sharp over its place on the wall
const HEROC = [11, 21];
const cardXY = (c, r) => [WG.x0 + (c + 0.5) * WG.p, WG.top - (r + 0.5) * WG.p];
function heroCard(g, a = 1) {
  const [x, y] = cardXY(...HEROC), q = B.project(x, y, WG.z - 0.09), sz = q.s * WG.p * 0.9;
  if (a <= 0 || sz < 10) return;
  g.save(); g.globalAlpha *= a; g.translate(q.x - sz / 2, q.y - sz / 2);
  g.fillStyle = 'rgba(60,40,20,0.3)'; g.fillRect(sz * 0.03, sz * 0.05, sz, sz); g.fillStyle = '#FBF7EC'; g.fillRect(0, 0, sz, sz);
  const bs = sz * 0.78, bx = (sz - bs) / 2, by = sz * 0.07, sq = bs / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#B58A5A' : '#EAD9B5'; g.fillRect(bx + i * sq, by + j * sq, sq + 0.6, sq + 0.6); }
  for (const pc of PZ[0].pieces) { const f = pc.sq.charCodeAt(0) - 97, rk = +pc.sq[1] - 1; drawPiece(g, pc.t, pc.c, bx + (f + 0.5) * sq, by + (8 - rk) * sq - sq * 0.06, sq * 0.98); }
  if (sz > 120) { g.fillStyle = '#6A5A46'; g.font = sans(sz * 0.062, 800); g.letterSpacing = `${(sz * 0.008).toFixed(1)}px`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('WHITE TO MOVE', bx, sz * 0.955); }
  g.restore();
}

// ======================= THE SPONSOR: Chessigma on a phone, on the table in the wood. The screen shows their own
// product as it is: the site's Woodpecker page and its Board Memory page (photos/chessigma_woodpecker.jpg and
// chessigma_memory.jpg, taken from chessigma.com on 11 Nov 2026), a round of Board Memory as it runs there and the
// author's screen recordings of the app (photos/rec/); the woodpecker clings to the phone's edge and points with its beak =======================
const PH = { c: [4, 2.22, 4.2], w: 2.4, h: 2.4 * 1600 / 780, tilt: 0.08 };
const SCREEN = makeCanvas(780, 1600), scx = SCREEN.getContext('2d');
// what the screen shows. An item is {page: scroll}, the site's Woodpecker page scrolled by that many of its pixels,
// {still: name}, another screen of the site as one picture, or {rec: name, sec}, a frame of one of the recordings.
// `to` slides in from the right over `from` (slide 0..1).
// hi: {x0, y0, x1, y1, a} a frame in screen pixels; tap: {x, y, u} a ring spreading from a touch
function screenTex({ from = null, to = { page: 0 }, slide = 1, hi = null, tap = null } = {}) {
  const x = scx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 780, 1600);
  x.save(); x.beginPath(); x.roundRect(0, 0, 780, 1600, 64); x.clip();
  x.fillStyle = SIG.bg; x.fillRect(0, 0, 780, 1600);
  const item = (it, dx) => {
    if (it.rec) { x.drawImage(recFrame(it.rec, it.sec), dx, 0, 780, 1600); return; }
    if (it.still) { x.drawImage(IMG[it.still], dx, 0, 780, 1600); return; }
    const img = IMG.woodpecker_jpg, k = img.width / 780;  // the page was captured at twice the screen's pixels
    x.drawImage(img, 0, clamp(it.page, 0, img.height / k - 1600) * k, img.width, 1600 * k, dx, 0, 780, 1600);
  };
  const e = from ? ease.inOut(clamp(slide)) : 1;
  if (e < 1) item(from, -780 * e);
  item(to, 780 * (1 - e));
  if (hi && hi.a > 0) { x.save(); x.globalAlpha = hi.a; x.strokeStyle = SIG.yel; x.lineWidth = 9; x.shadowColor = SIG.yel; x.shadowBlur = 26; x.beginPath(); x.roundRect(hi.x0, hi.y0, hi.x1 - hi.x0, hi.y1 - hi.y0, 26); x.stroke(); x.restore(); }
  if (tap && tap.u > 0 && tap.u < 1) {
    x.save(); x.globalAlpha = 1 - tap.u; x.strokeStyle = '#FFFFFF'; x.lineWidth = 10; x.beginPath(); x.arc(tap.x, tap.y, 30 + 130 * ease.out(tap.u), 0, 7); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(tap.x, tap.y, 46 * (1 - tap.u), 0, 7); x.fill(); x.restore();
  }
  x.restore();
}
// a point of the screen in the world: u, v in screen pixels (0..780, 0..1600), d out of the glass toward the camera
const phR = { rx: PH.tilt };
const phPt = (u, v, d = 0.075) => { const p = rot3([(u / 780 - 0.5) * PH.w, (0.5 - v / 1600) * PH.h, -d], phR); return [PH.c[0] + p[0], PH.c[1] + p[1], PH.c[2] + p[2]]; };
function phone(g, t, scr = {}) {
  screenTex(scr);
  footShadow(g, PH.c[0], PH.c[2] - 0.15, 2.2, 0.7, -0.35);
  obox(g, PH.c, [PH.w / 2 + 0.085, PH.h / 2 + 0.085, 0.07], '#0B0C0E', phR, { amb: 0.85 });
  texQuad(g, SCREEN, phPt(0, 0), phPt(780, 0), phPt(0, 1600), { under: false });
}
// the bird on the phone's left edge at the height of screen row v, facing the glass; reach stretches its neck to a
// point `reach` screen pixels inside the edge
const PBIRD = 1.2;
function phoneBird(g, t, v, { hits = [], reach = 0, look = [0.6, 0.1], a = 1, hop = 0 } = {}) {
  const [x, y, z] = phPt(-26, v + 78 / 105 * PBIRD / PH.h * 1600, 0.12), pk = strikeAt(t, hits);
  const b = bird(g, x, y + hop, z, PBIRD, t, { dir: 1, pose: 'cling', peck: pk, rot: -0.1 * (1 - pk), look, a, reach: reach / 780 * PH.w / (PBIRD / 105) });
  return b;
}
// the sponsor's plate (rule 50, flat): Chessigma's own header logo — the rook and CHESSIGMA — white on its near-black,
// SUPERCOACH on its yellow
function sigPlate(g, y, { a = 1, scale = 1, dy = 0, blur = 0, x = W / 2, chip = true, lh = 50 } = {}) {
  if (a <= 0) return;
  const L = IMG.logo_png, lw = lh * L.width / L.height;
  g.save(); g.globalAlpha *= a; g.translate(x, y + dy); g.rotate(-0.018); g.scale(scale, scale);
  if (blur > 0.3) g.filter = `blur(${blur.toFixed(1)}px)`;
  g.font = sans(lh * 0.6, 900); g.letterSpacing = '2px';
  const cw = chip ? inkWidth(g, 'SUPERCOACH') + lh * 0.7 : 0, gap = chip ? lh * 0.4 : 0, w = lw + gap + cw + lh * 0.9, hp = lh * 1.7, x0 = -w / 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.roundRect(x0, -hp / 2 + Math.max(4, lh * 0.15), w, hp, 5); g.fill();
  g.fillStyle = SIG.bg; g.beginPath(); g.roundRect(x0, -hp / 2, w, hp, 5); g.fill();
  qaRect(g, x0, -hp / 2, w, hp, 'text', 'CHESSIGMA SUPERCOACH');
  g.drawImage(L, x0 + lh * 0.45, -lh / 2, lw, lh);
  if (chip) { const cx = x0 + lh * 0.45 + lw + gap; g.fillStyle = SIG.yel; g.beginPath(); g.roundRect(cx, -lh * 0.5, cw, lh, 6); g.fill(); g.fillStyle = '#171717'; inkText(g, 'SUPERCOACH', cx + cw / 2, 0); }
  g.restore();
}
function adTag(g, a = 1) { plate(g, 'AD', 96, 146, { color: SIG.bg, size: 26, a: a * 0.92, rot: 0 }); }

// ---------- things on the table in the wood: a thousand printed puzzles, the book ----------
const DIAG = tex(300, 300, (x, w, h) => {
  x.fillStyle = '#FBF7EC'; x.fillRect(0, 0, w, h); const bs = 236, bx = 32, by = 24, sq = bs / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#B58A5A' : '#EAD9B5'; x.fillRect(bx + i * sq, by + j * sq, sq + 0.5, sq + 0.5); }
  for (const pc of PZ[0].pieces) { const f = pc.sq.charCodeAt(0) - 97, rk = +pc.sq[1] - 1; drawPiece(x, pc.t, pc.c, bx + (f + 0.5) * sq, by + (8 - rk) * sq - 2, sq * 0.98); }
  x.fillStyle = '#6A5A46'; x.font = sans(17, 800); x.letterSpacing = '2px'; x.fillText('WHITE TO MOVE', bx, 284);
});
const STACK = { x: 0.9, z: 4.3, hx: 1.05, hz: 1.4, n: 44, h: 2.9 };
// the pile: sheets a little out of true; from t0 they lift off the top one after another and blow away to the left
function paperStack(g, t, t0 = 1e9) {
  const { x, z, hx, hz, n, h } = STACK, th = h / n, r = rng(19), out = [];
  for (let i = 0; i < n; i++) {
    const dx = (r() - 0.5) * 0.12, dz = (r() - 0.5) * 0.12, ry = (r() - 0.5) * 0.09, ti = t0 + (n - 1 - i) * 0.014, dt = t - ti, vx = -(7 + r() * 9), vy = 2.5 + r() * 6, vz = (r() - 0.5) * 5, sp = (r() - 0.5) * 9;
    const y = -0.35 + (i + 0.5) * th;
    if (dt <= 0) out.push({ c: [x + dx, y, z + dz], rot: { ry }, i });
    else if (dt < 1.4) out.push({ c: [x + dx + vx * dt, y + vy * dt - 7 * dt * dt, z + dz + vz * dt], rot: { ry: ry + sp * dt, rz: sp * 0.5 * dt, rx: sp * 0.3 * dt }, i, fly: true });
  }
  out.sort((a, b) => (a.fly ? 1 : 0) - (b.fly ? 1 : 0) || a.i - b.i);
  for (const s of out) {
    if (depth(...s.c) < 1) continue;
    obox(g, s.c, [hx, Math.max(0.012, th * 0.46), hz], s.i % 2 ? '#F7F3E8' : '#ECE6D6', s.rot, { amb: 0.74 });
    if (s.fly || s.i === n - 1) {  // the printed side
      const P = (a, b) => { const p = rot3([a * hx * 0.86, th * 0.5, b * hz * 0.86], s.rot); return [s.c[0] + p[0], s.c[1] + p[1], s.c[2] + p[2]]; };
      texQuad(g, DIAG, P(-1, 1), P(1, 1), P(-1, -1), { under: false });
    }
  }
}
// the book: our own plain cover with the true title and its two authors (not the publisher's cover; SOURCES.md)
const COVER = tex(440, 600, (x, w, h) => {
  x.fillStyle = '#2C7A4C'; x.fillRect(0, 0, w, h); x.fillStyle = '#226140'; x.fillRect(0, 0, 30, h);
  x.fillStyle = '#F4EFE0'; x.textAlign = 'center'; x.font = sans(26, 800); x.letterSpacing = '5px'; x.fillText('THE', w / 2 + 12, 76);
  x.font = sans(45, 900); x.letterSpacing = '1px'; x.fillText('WOODPECKER', w / 2 + 12, 130); x.fillText('METHOD', w / 2 + 12, 182);
  x.save(); x.translate(w / 2 - 6, 468); x.scale(2.2, 2.2); birdBody(x, { pose: 'stand', look: [0.6, 0] }); x.restore();
  x.fillStyle = '#F4EFE0'; x.font = sans(21, 800); x.letterSpacing = '2px'; x.fillText('AXEL SMITH · HANS TIKKANEN', w / 2 + 12, 556);
});
function book(g, { c = [0.6, 1.25, 7.9], a = 1 } = {}) {
  if (a <= 0 || depth(...c) < 1) return;
  const R = { rx: 0.1, ry: -0.24 }, hw = 1.17, hh = 1.6, hd = 0.19;
  footShadow(g, c[0], c[2] - 0.2, 1.7, 0.6 * a, -0.35);
  const P = (u, v, d) => { const p = rot3([u * hw, v * hh, d], R); return [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; };
  obox(g, P(0, 0, hd), [hw, hh, 0.02], '#256842', R, { amb: 0.8, a });
  obox(g, c, [hw - 0.04, hh - 0.05, hd - 0.02], '#F3EEE2', R, { amb: 0.8, a });
  obox(g, P(-1, 0, 0), [0.03, hh, hd], '#226140', R, { amb: 0.8, a });
  obox(g, P(0, 0, -hd), [hw, hh, 0.02], '#2C7A4C', R, { amb: 0.85, a });
  texQuad(g, COVER, P(-1, 1, -hd - 0.025), P(1, 1, -hd - 0.025), P(-1, -1, -hd - 0.025), { under: false, a });
}
// GM norm plaques nailed to the hero birch: a gold plate each, facing the camera; u pops it on
const PLAQ = [1, 2, 3].map(n => tex(420, 150, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#FFE49A'); gr.addColorStop(0.5, '#F2C14E'); gr.addColorStop(1, '#D9A53A');
  x.fillStyle = '#8A5E12'; x.beginPath(); x.roundRect(0, 0, w, h, 16); x.fill(); x.fillStyle = gr; x.beginPath(); x.roundRect(7, 7, w - 14, h - 14, 11); x.fill();
  x.fillStyle = '#4A320A'; x.font = sans(54, 900); x.letterSpacing = '1px'; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText('GM NORM', 26, h / 2 + 4);
  x.fillStyle = '#4A320A'; x.beginPath(); x.arc(w - 60, h / 2, 40, 0, 7); x.fill(); x.fillStyle = '#FFE49A'; x.textAlign = 'center'; x.font = sans(58, 900); x.fillText(String(n), w - 60, h / 2 + 5);
}));
function plaques(g, t, ys, at) {
  const fx = -Math.sin(B.yaw), fz = Math.cos(B.yaw), cx = HERO.x - B.R[0] * 0.06 - fx * 0.06, cz = HERO.z - B.R[2] * 0.06 - fz * 0.06, hw = 0.8, hh = hw * 150 / 420;
  ys.forEach((y, i) => {
    const u = clamp((t - at[i]) / 0.16); if (u <= 0) return;
    const k = ease.back(u), a = [cx - B.R[0] * hw * k, y + hh * k, cz - B.R[2] * hw * k], b = [cx + B.R[0] * hw * k, y + hh * k, cz + B.R[2] * hw * k], c = [cx - B.R[0] * hw * k, y - hh * k, cz - B.R[2] * hw * k];
    texQuad(g, PLAQ[i], a, b, c, { under: false, a: clamp(u * 3) });
  });
}

// ======================= MAGNUS: the hall of his memory. Dark, a board under a lamp; the positions he is shown hang in
// the air. The back wall is cards floor to ceiling, every position he has ever seen: unlit until the line that says so,
// then gold from behind his head outward =======================
const HALLT = '#6A4728';
const NIGHT = ['#131933', '#1A2142', '#20284E'];  // the hall unlit: its air, the two tones of its floor
const PUZZLED = { ...EXPR.worried, sweat: 0, brow: -0.55, browTilt: 0.5, lid: 0.06, look: [0, -0.7], curve: -0.25 };
const LAUGH = { ...EXPR.happy, look: [0, -0.3], lid: 0.2 };
const KNOW = { ...EXPR.smug, lid: 0.22, look: [0, 0], curve: 0.55 };
const CARDZ = 10.4;
// lit 0..1: the wall of cards takes light, from behind his head outward
function memoryHall(g, t, lit = 0) {
  const { cols, rows, p, z, x0, top } = WG, w = cols * p, y0 = top - rows * p;
  g.fillStyle = NIGHT[0]; g.fillRect(0, 0, W, H);
  for (let i = 0, x = -44; x < 52; x += 2, i++) quad(g, [[x, FLOOR_Y, z], [x + 2, FLOOR_Y, z], [x + 2, FLOOR_Y, -30], [x, FLOOR_Y, -30]], NIGHT[1 + i % 2]);
  const wall = img => { for (const k of [-2, -1, 0, 1, 2]) texQuad(g, img, [x0 + k * w, top, z], [x0 + (k + 1) * w, top, z], [x0 + k * w, y0, z]); };
  const hp = B.project(4, 3.3, z), R = 40 + 1400 * Math.pow(clamp(lit), 0.8);
  if (lit < 1) {  // the cards in the dark
    wall(WALLT[0]);
    quad(g, [[x0 - 2 * w, top, z - 0.01], [x0 + 3 * w, top, z - 0.01], [x0 + 3 * w, y0, z - 0.01], [x0 - 2 * w, y0, z - 0.01]], rgba(NIGHT[0], 0.87));
  }
  if (lit > 0) {
    g.save(); if (lit < 1) { g.beginPath(); g.arc(hp.x, hp.y, R, 0, 7); g.clip(); } wall(WALLT[2]); g.restore();
    if (lit < 1) { g.save(); g.globalCompositeOperation = 'screen'; g.strokeStyle = rgba('#FFF6C8', 0.9 * (1 - lit)); g.lineWidth = 54; g.beginPath(); g.arc(hp.x, hp.y, R, 0, 7); g.stroke(); g.restore(); }
  }
  quad(g, [[-44, FLOOR_Y, z - 0.04], [52, FLOOR_Y, z - 0.04], [52, FLOOR_Y + 0.4, z - 0.04], [-44, FLOOR_Y + 0.4, z - 0.04]], mix('#0D1226', '#8A5E2A', clamp(lit * 2)));
  pool(g, B, 4, 4.2, z - 0.1, 7.5, mix('#5468C8', '#FFF6C8', clamp(lit * 2)), 0.24 + 0.36 * lit, true);  // the lamp over his board, on the wall behind him
  pool(g, B, 4, FLOOR_Y, 6, 9, '#FFF3D6', 0.12 + 0.1 * lit);
}
// a card hung in the air: a real position (pieces), or the one that stumped him — a question mark that turns over
// (flip 0..1) to a wizard's hat. u pops it in; named gives it a gold edge, and a tick in the corner (tick 0..1)
function gameCard(g, { pieces = null, x, y, z = CARDZ, size = 1.55, u = 1, tilt = 0, named = 0, tick = 1, mystery = false, flip = 0 }) {
  if (u <= 0 || depth(x, y, z) < 1) return;
  const q = B.project(x, y, z), sz = q.s * size * ease.back(clamp(u * 1.2)), turn = Math.cos(Math.PI * clamp(flip)), back = turn < 0;
  g.save(); g.globalAlpha *= clamp(u * 4); g.translate(q.x, q.y); g.rotate(tilt); g.scale(Math.max(0.03, Math.abs(turn)), 1); g.translate(-sz / 2, -sz / 2);
  g.fillStyle = 'rgba(4,6,16,0.45)'; g.fillRect(sz * 0.03, sz * 0.05, sz, sz);
  if (named > 0) { g.fillStyle = GOLD; g.fillRect(-sz * 0.035, -sz * 0.035, sz * 1.07, sz * 1.07); }
  const bs = sz * 0.84, bx = (sz - bs) / 2, by = sz * 0.08, sq = bs / 8;
  if (mystery && back) {  // the other side: a wizard's hat among stars
    g.fillStyle = '#3C2466'; g.fillRect(0, 0, sz, sz);
    g.fillStyle = '#17102B'; g.beginPath(); g.moveTo(sz * 0.56, sz * 0.14); g.quadraticCurveTo(sz * 0.44, sz * 0.4, sz * 0.27, sz * 0.7); g.lineTo(sz * 0.75, sz * 0.7); g.quadraticCurveTo(sz * 0.62, sz * 0.44, sz * 0.56, sz * 0.14); g.fill();
    g.beginPath(); g.ellipse(sz * 0.5, sz * 0.71, sz * 0.36, sz * 0.075, 0, 0, 7); g.fill();
    g.fillStyle = GOLD; g.fillRect(sz * 0.3, sz * 0.61, sz * 0.42, sz * 0.045);
    for (const [sx, sy, r] of [[0.2, 0.25, 0.05], [0.8, 0.3, 0.04], [0.74, 0.88, 0.035], [0.16, 0.86, 0.045], [0.46, 0.5, 0.03]]) {
      g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = sz * r * (i % 2 ? 0.4 : 1); g.lineTo(sz * sx + Math.cos(a) * rr, sz * sy + Math.sin(a) * rr); } g.closePath(); g.fill();
    }
  } else {
    g.fillStyle = '#FBF7EC'; g.fillRect(0, 0, sz, sz);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? (mystery ? '#9A948A' : '#B58A5A') : (mystery ? '#D8D3C8' : '#EAD9B5'); g.fillRect(bx + i * sq, by + j * sq, sq + 0.6, sq + 0.6); }
    if (pieces) for (const pc of pieces) { const f = pc.sq.charCodeAt(0) - 97, rk = +pc.sq[1] - 1; drawPiece(g, pc.t, pc.c, bx + (f + 0.5) * sq, by + (8 - rk) * sq - sq * 0.06, sq * 0.98); }
    if (mystery) { g.font = sans(sz * 0.62, 900); g.fillStyle = RED; g.strokeStyle = '#FBF7EC'; g.lineWidth = sz * 0.05; g.lineJoin = 'round'; inkText(g, '?', sz / 2, sz * 0.5, { stroke: true }); }
    else if (named > 0 && tick > 0) {  // named: a tick in the corner
      const cx = sz * 0.93, cy = sz * 0.93, rr = sz * 0.1; g.globalAlpha *= clamp(tick);
      g.fillStyle = '#B9780E'; g.beginPath(); g.arc(cx, cy, rr * 1.12, 0, 7); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill();
      g.strokeStyle = '#3A2606'; g.lineWidth = rr * 0.34; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(cx - rr * 0.48, cy); g.lineTo(cx - rr * 0.1, cy + rr * 0.4); g.lineTo(cx + rr * 0.52, cy - rr * 0.38); g.stroke();
    }
  }
  g.restore();
}
// the hall with Magnus at his board. cards: gameCard options; lit lights the wall behind him and throws rays. The
// cameras here are long lenses from far down the table (rule 22: no wall of huge squares under a low camera), so the
// table runs on toward the viewer
function hall(g, t, { e = 'neutral', cards = [], pieces = null, lit = 0, focus = null, dof = 0.5, tilt = 0 } = {}) {
  memoryHall(g, t, lit);
  if (lit > 0 && depth(4, 3.1, 9.3) > 1) { const hp = B.project(4, 3.3, 9.3); g.save(); g.globalCompositeOperation = 'screen'; rays(g, hp.x, hp.y, t, { n: 18, color: '#FFF1B0', a: 0.26 * lit, len: 1700 }); g.restore(); }
  for (const c of cards) gameCard(g, c);
  const mb = seated(g, B, 'magnus', e, t, { x: 4, z: 9.3, tilt, hands: false });
  ab(g, [-3.5, -0.75, -22], [11.5, -0.35, 9.1], HALLT, { amb: 0.82 });
  B.drawSlab(g, WOODB);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist - 2.3, dof });
  mb();
}

// a knock written in the air where it lands: TOK on a small tilted plate, for a quarter of a second after each hit
function toks(g, x, y, t, hits, col, { size = 34 } = {}) {
  hits.forEach((h, i) => {
    const dt = t - h; if (dt < 0 || dt > 0.3) return;
    const sd = i % 2 ? 1 : -1;
    plate(g, 'TOK', x + sd * 26, y - 30 - dt * 150 - (i % 3) * 16, { color: col, size, a: clamp((0.3 - dt) / 0.1), scale: lerp(1.25, 1, clamp(dt / 0.08)), rot: sd * 0.12, qa: false });
  });
}
// the bird in the air from one world point to another (an arc), then standing where it lands
function birdFly(g, t, t0, dur, from, to, size, { dir = 1, land = {}, lift = 1.1 } = {}) {
  const u = clamp((t - t0) / dur);
  if (u >= 1) return bird(g, to[0], to[1], to[2], size, t, { dir, pose: 'stand', ...land });
  const e = ease.inOut(u), p = [0, 1, 2].map(k => lerp(from[k], to[k], e)); p[1] += Math.sin(Math.PI * e) * lift + 0.45 * size * (1 - e);
  return bird(g, p[0], p[1], p[2], size, t, { dir: to[0] >= from[0] ? 1 : -1, pose: 'fly', flap: 0.5 + 0.5 * Math.sin(t * 46), look: [0.6, 0.2] });
}
const comma = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ======================= THE FILM =======================
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'village', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const bdg = (g, t, text, t0, { y = 230, x = W / 2, color = CREAM, size = 46, sub = null, ink = null, until = 1e9 } = {}) => { if (t >= t0 && t < until) plate(g, text, x, y, { color, size, sub, ink, rot: -0.018, ...popIn(t, t0) }); };
  const knocks = (hits, gain = 0.42) => hits.forEach((h, i) => cue(h - 0.012, 'knock', gain * (0.85 + 0.15 * ((i * 7) % 3) / 2)));
  const taps = (hits, gain = 0.3) => hits.forEach(h => cue(h - 0.01, 'piece', gain));
  // the board in the wood holds the puzzle solved (in the close shots the queen of the first position would stand big at
  // the bottom of the frame: rule 22); his study has it as it is set
  const p0 = piecesAt(PZ, 0), pF = piecesAt(PZ, 3);
  // Magnus's board, a prop: the far ranks of the same puzzle, solved. The men that the long lens would bring up big at
  // the bottom of the frame (White's first two ranks; rules 22 and 47) and the a-pawn, cut by its edge, are not set
  const pM = piecesAt(PZ, 3).filter(p => +p.sq[1] > 2 && p.sq !== 'a7');
  // the bird's place on his shoulder: its feet on the slope between neck and arm, in front of him so the hoodie is under them
  const SHOULDER = [HANS.x - 1.02, 1.2, HANS.z - 0.3], SBIRD = 1.25;

  // ---------- the sponsor's phone on a table in the wood: three times in the film (start, middle, end), so one function
  // builds each. prog: what the screen shows from when, [[start, t => item]]; boxes: frames on the screen, [[x0, y0, x1,
  // y1, from, to]] in screen pixels; pecks: the bird's pecks, [[time, screen row, reach in screen pixels]]; rings:
  // touches drawn without the bird, [[time, x, y]]; fly: {t0, dur, from}, the bird arrives from a point of the wood ----------
  const adHud = (g, lt, t) => adTag(g, 1);
  const edgeAt = (v, d = 0.12) => phPt(-26, v + 290, d);
  const PHC = [3.55, 2.2, 4.2], PHK = [K(0.08, 0.02, 6.3, PHC), K(0.02, 0.015, 5.9, PHC)];
  const PHN = [K(-0.03, 0.01, 5.65, [3.36, 2.4, 4.2]), K(0.02, 0.01, 5.5, [3.36, 2.4, 4.2])];  // nearer: the upper half of the screen is the subject
  const phoneSeg = ({ prog, boxes = [], pecks = [], rings = [], rest = 560, fly = null }) => {
    const birdV = t => { let v = rest; for (const [pt, row] of pecks) v = lerp(v, row, seg(t, pt - 0.22, pt - 0.06)); return v; };
    const screenAt = t => {
      let i = 0; prog.forEach(([a], k) => { if (t >= a) i = k; });
      const o = { to: prog[i][1](t), from: i ? prog[i - 1][1](t) : null, slide: i ? (t - prog[i][0]) / 0.26 : 1, hi: null, tap: null };
      for (const [x0, y0, x1, y1, a, b] of boxes) { const k = seg(t, a, a + 0.12) * (1 - seg(t, b - 0.12, b)); if (k > 0) o.hi = { x0, y0, x1, y1, a: k }; }
      for (const [pt, row, rc] of pecks) if (t >= pt && t < pt + 0.45) o.tap = { x: rc + 26, y: row, u: (t - pt) / 0.45 };
      for (const [pt, x, y] of rings) if (t >= pt && t < pt + 0.45) o.tap = { x, y, u: (t - pt) / 0.45 };
      return o;
    };
    return (g, t) => forest(g, t, { hans: null, board: false, brd: null, onTrunk: g2 => birdOnTrunk(g2, t, { a: 0 }), focus: 6, extra: (g2, ph) => {
      if (ph !== 'top') return;
      phone(g2, t, screenAt(t));
      if (fly && t < fly.t0 + fly.dur) { birdFly(g2, t, fly.t0, fly.dur, fly.from, edgeAt(rest), PBIRD, { land: { pose: 'cling', look: [0.7, 0] }, lift: 0.8 }); return; }
      let rc = 118; for (const [pt, , r] of pecks) if (t >= pt - 0.3) rc = r;
      phoneBird(g2, t, birdV(t), { hits: pecks.map(p => p[0]), reach: rc, look: [0.7, 0.05] });
    } });
  };

  // ======================= HOOK (rule 42, the edit bait): Magnus Carlsen in the hall of his memory. A famous position
  // hangs over his head, he names it, it goes to its place, the next one comes. The three games on the cards are our
  // own choice (SOURCES.md); the fourth card waits with its question mark from the first frame =======================
  const BIGC = [4, 6.05, 3.14], SMALLC = 1.3, SLOTS = [[1.75, 5.3], [6.25, 5.3], [1.75, 3.3], [6.25, 3.3]], FLY = 0.26;
  const CARDS = [{ pieces: GOC[34].pieces, label: 'FISCHER · 1956', pop: -1, named: 0.45, away: 0.95 }, { pieces: BT[42].pieces, label: 'TAL · 1960', pop: 1.0, named: 1.5, away: 2.0 },
    { pieces: PI[43].pieces, label: 'POLISH IMMORTAL', pop: 2.05, named: 2.55, away: 3.05 }];
  // a card between its place over his head (k 0) and its slot (k 1)
  const place = (k, i) => ({ x: lerp(BIGC[0], SLOTS[i][0], k), y: lerp(BIGC[1], SLOTS[i][1], k), size: lerp(BIGC[2], SMALLC, k), tilt: lerp(-0.025, (i % 2 ? 1 : -1) * 0.05, k) });
  const cardsAt = t => CARDS.map((c, i) => { const k = ease.inOut(clamp((t - c.away) / FLY)); return { pieces: c.pieces, ...place(k, i), u: (t - c.pop) / 0.2, named: t >= c.named ? 1 : 0, tick: k }; });
  const TELE = { fov: 3000 };
  const up = l => ({ ...EXPR.smug, lid: 0.14, look: l, curve: 0.5 });
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, -0.05, 19.2, [4, 3.25, 9.3], TELE)], [len(sh), K(-0.04, -0.05, 17.8, [4, 3.25, 9.3], TELE)]], { t, e: lin });
    hall(g, t, { e: exprAt([[0, up([0, -0.8])], [0.5, up([0.25, -0.3])], [1.05, up([0, -0.8])], [1.55, up([-0.25, -0.3])], [2.1, up([0, -0.8])], [2.6, up([0.2, -0.3])], [3.2, KNOW]], t),
      cards: [...cardsAt(t), { ...place(1, 3), mystery: true, tilt: 0.05 + 0.03 * Math.sin(t * 5) }], pieces: pM });
  }, { grade: 'gold', hud: (g, lt, t) => {
    plate(g, 'MAGNUS NAMES THE GAME', W / 2, 170, { color: CREAM, size: 54, rot: -0.02 });
    plate(g, 'FROM ONE POSITION', W / 2, 258, { color: GOLD, size: 54, rot: -0.02 });
    CARDS.forEach(c => {  // the name, stamped across the card while it hangs over him
      if (t < c.named || t >= c.away) return;
      const q = B.project(BIGC[0], BIGC[1] - BIGC[2] * 0.2, CARDZ);
      plate(g, c.label + ' ✓', q.x, q.y, { color: GOLD, size: 48, rot: -0.035, ...popIn(t, c.named) });
    });
  } });
  cue(0, 'whoosh_deep', 0.25);
  CARDS.forEach(c => { if (c.pop > 0) cue(c.pop, 'page_flip', 0.35); cue(c.named, 'stamp', 0.45); cue(c.named + 0.04, 'sparkle_pop', 0.25); cue(c.away, 'whoosh_soft', 0.2); });
  // IN ONE TEST, ONLY ONE POSITION STUMPED HIM. IT WAS FROM HARRY POTTER: the fourth card comes up; it turns over
  const potS = s('potter') - 0.05, onlyT = w('potter', 'only'), stumpT = w('potter', 'stumped'), harryT = w('potter', 'harry');
  const UP4 = potS + 0.08, FLIP = fr(harryT - 0.1);
  const card4 = t => ({ ...place(1 - ease.inOut(clamp((t - UP4) / 0.3)), 3), mystery: true, flip: (t - FLIP) / 0.26 });
  const namedCards = CARDS.map((c, i) => ({ pieces: c.pieces, ...place(1, i), named: 1 }));
  shot(potS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, -0.05, 18.4, [4, 3.3, 9.3], TELE)], [len(sh), K(0.0, -0.05, 17.0, [4, 3.35, 9.3], TELE)]], { t, e: glide });
    hall(g, t, { e: exprAt([[0, up([0.8, 0.1])], [0.35, up([0, -0.8])], [stumpT - 0.3, PUZZLED], [FLIP + 0.2, LAUGH]], t), cards: [...namedCards, card4(t)], pieces: pM,
      tilt: 0.05 * seg(t, stumpT - 0.3, stumpT) * (1 - seg(t, FLIP, FLIP + 0.3)) });
  }, { grade: 'gold', hud: (g, lt, t) => {
    bdg(g, t, 'ONLY ONE STUMPED HIM', onlyT, { y: 190, color: RED, size: 52, until: FLIP + 0.13 });
    bdg(g, t, 'IT WAS FROM HARRY POTTER', FLIP + 0.13, { y: 190, color: '#6A3FB8', ink: '#FFE08A', size: 50 });
  } });
  cue(UP4, 'whoosh_soft', 0.3); cue(onlyT, 'sparkle_pop', 0.25); cue(stumpT, 'record_scratch', 0.35); cue(FLIP, 'page_flip', 0.4); cue(FLIP + 0.13, 'shimmer', 0.4); cue(FLIP + 0.3, 'laugh', 0.2);
  // HE ISN'T CALCULATING. HE HAS SEEN YOUR POSITION BEFORE: from below; on "seen" the wall behind him takes light, every
  // card on it gold
  const seenS = s('seen') - 0.06, surT = w('seen', 'surprise'), libT = w('seen', 'library'), SEEN = fr(w('seen', 'seen'));
  shot(seenS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.28, -0.04, 21, [4, 3.0, 9.3], TELE)], [len(sh), K(0.04, -0.04, 15.6, [4, 2.95, 9.3], TELE)]], { t, e: glide, bump: t > SEEN && t < SEEN + 0.3 ? 1 : 0 });
    hall(g, t, { e: exprAt([[0, { ...EXPR.focus, look: [0, 0.1], lid: 0.2 }], [SEEN - 0.15, KNOW]], t), cards: [...namedCards, { ...place(1, 3), mystery: true, flip: 1, tilt: 0.05 }], pieces: pM,
      lit: seg(t, SEEN, SEEN + 0.36, lin) });
    if (t >= SEEN) flashTint(g, '#FFE9B8', 0.35 * (1 - seg(t, SEEN, SEEN + 0.3)));
  }, { grade: 'gold', hud: (g, lt, t) => {
    bdg(g, t, 'YOU CAN SURPRISE A HUMAN', surT, { y: 170, color: CREAM, size: 46, until: SEEN });
    bdg(g, t, 'BUT NOT A LIBRARY', libT - 0.03, { y: 258, color: GOLD, size: 54, until: SEEN });
    if (t >= SEEN) { plate(g, 'HE HAS SEEN', W / 2, 150, { color: INK, ink: CREAM, size: 62, rot: -0.02, ...popIn(t, SEEN) }); if (t >= SEEN + 0.14) plate(g, 'YOUR POSITION BEFORE', W / 2, 248, { color: GOLD, size: 50, rot: -0.02, ...popIn(t, SEEN + 0.14) }); }
  } });
  cue(seenS - 0.05, 'whoosh_deep', 0.35); cue(surT, 'sparkle_pop', 0.25); cue(libT - 0.03, 'thud', 0.4); cue(SEEN - 0.32, 'revswell', 0.8); cue(SEEN - 0.004, 'boom', 0.85); cue(SEEN, 'reveal_bell', 0.5);

  // ======================= AND ONE MAN BUILT THAT KIND OF MEMORY BY COPYING A WOODPECKER: a man in a red hat jabs a
  // knight into a birch in time with the woodpecker working right above his fist =======================
  const brS = s('bridge') - 0.06, manT = w('bridge', 'man'), copyT = w('bridge', 'copying'), wpT = w('bridge', 'woodpecker'), GAG = fr(T.e('bridge') + 0.02);
  const both = [...train(brS + 0.08, brS + 0.75), ...train(brS + 1.05, brS + 1.72), ...train(brS + 2.05, brS + 2.72), ...train(brS + 3.0, GAG - 0.12)];
  const birdH = [...both, fr(GAG + 0.1), fr(GAG + 0.25)], hansH = [...both, fr(GAG + 0.43), fr(GAG + 0.58)];
  const manHud = (g, lt, t) => {
    bdg(g, t, 'SWEDEN · 2010', manT - 0.05, { y: 170, color: SWE_BLUE, ink: SWE_YEL, size: 44 });  // his name waits for its reveal
    bdg(g, t, 'HE COPIED A WOODPECKER', copyT, { y: 258, color: BIRDC.body, ink: '#FFFFFF', size: 52 });
  };
  shot(brS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.02, 0.03, 9.0, [2.75, 2.5, 9.9])], [len(sh), K(-0.02, 0.03, 8.3, [2.75, 2.58, 9.9])]], { t, e: lin });
    forest(g, t, { pieces: pF, hans: { e: AT_BIRD, hits: hansH, tilt: -0.05 }, brd: { hits: birdH, look: [0.6, 0.1] }, focus: 8.5 });
  }, { trans: 'whip', hud: manHud });
  knocks(birdH.filter(h => h < GAG)); taps(hansH.filter(h => h < GAG));
  cue(brS - 0.11, 'whoosh_fast', 0.3); cue(manT - 0.05, 'sparkle_pop', 0.25); cue(copyT, 'reveal_bell', 0.3);
  // wider, from the side: the board with the puzzle on it, the two of them at work
  const sideS = copyT + 0.3;
  shot(sideS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.62, 0.3, 14.5, [3.2, 1.7, 7.6])], [len(sh), K(-0.44, 0.25, 12.2, [3.2, 1.9, 7.9])]], { t, e: glide });
    forest(g, t, { pieces: pF, hans: { e: exprAt([[0, AT_BOARD], [wpT, AT_BIRD]], t), hits: hansH }, brd: { hits: birdH }, focus: 11 });
  }, { hud: manHud });
  cue(sideS - 0.05, 'whoosh_fast', 0.25);
  // the beat after the line: the bird knocks twice, he answers twice
  shot(GAG, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.04, 0.02, 8.3, [2.8, 2.6, 9.9])], [len(sh), K(0.0, 0.02, 7.9, [2.8, 2.62, 9.9])]], { t, e: lin });
    const bl = t < GAG + 0.36 ? [0.6, 0.1] : [-0.9, 0.1];
    forest(g, t, { pieces: pF, hans: { e: exprAt([[0, AT_BIRD], [GAG + 0.34, { ...AT_BIRD, look: [-0.8, 0.35] }]], t), hits: hansH, tilt: -0.05 }, brd: { hits: birdH, look: bl }, focus: 7.5 });
  }, { hud: (g, lt, t) => {
    const bp = B.project(...perch()), hp = B.project(...perch(KN_Y));
    toks(g, bp.x + 300, bp.y - 440, t, birdH.filter(h => h >= GAG), CREAM);
    toks(g, hp.x + 330, hp.y - 110, t, hansH.filter(h => h >= GAG), GOLD);
  } });
  knocks(birdH.filter(h => h >= GAG), 0.85); taps(hansH.filter(h => h >= GAG), 0.8);

  // ======================= THE SPONSOR, THE FIRST TIME. YOU CAN TEST YOURS ON CHESSIGMA, TODAY'S SPONSOR. PAWNS FLASH,
  // THEN VANISH. TAP WHERE THEY STOOD: the woodpecker flies to a phone on a table in the wood. On its screen, Chessigma's
  // own Board Memory page and a round of the game as it runs on the site (photos/chessigma_memory.jpg, photos/rec/memory.mp4) =======================
  const earlyS = s('early') - 0.05, testT = w('early', 'test'), sig0T = w('early', 'chessigma'), sponT = w('early', 'sponsor'), pawnsT = w('early', 'pawns'), vanT = w('early', 'vanish'), repT = w('early', 'game'), moreT = w('early', 'more');
  const PLAY = fr(sponT + 0.22), gameS = PLAY + 0.2;
  // the recorded round (level 8, eight pawns): in the recording they go out at 2.356 s and are tapped back one by one
  const MEM = { gone: 2.356, taps: [2.818, 3.149, 3.458, 3.8, 4.158, 4.492, 4.803, 5.113], sq: [[4, 2], [7, 2], [4, 3], [6, 3], [3, 5], [7, 5], [4, 6], [6, 6]] };
  const memT = x => vanT + x - MEM.gone;  // the recording's pawns go out on the word "vanish"
  const earlyPh = phoneSeg({
    prog: [[earlyS, t => ({ still: 'memory_jpg' })], [gameS, t => ({ rec: 'memory', sec: MEM.gone + t - vanT })]],
    boxes: [[60, 180, 720, 430, testT + 0.15, sponT - 0.1], [28, 911, 752, 1077, sponT - 0.1, gameS]],
    pecks: [[PLAY, 994, 124], [fr(PLAY + 0.16), 994, 124]],
    rings: MEM.taps.map((x, i) => [memT(x), 24 + (MEM.sq[i][0] + 0.5) * 91.5, 272 + (MEM.sq[i][1] + 0.5) * 91.5]),
    fly: { t0: earlyS + 0.02, dur: 0.5, from: perch() },
  });
  const earlyHud = (g, lt, t) => {
    adHud(g, lt, t); if (t >= sig0T) sigPlate(g, 150, { chip: false, ...(t < sig0T + 0.4 ? popIn(t, sig0T) : {}) });
    bdg(g, t, 'TEST YOUR OWN MEMORY', testT, { y: 262, color: CREAM, size: 42, until: sponT - 0.03 });
    bdg(g, t, "TODAY'S SPONSOR", sponT - 0.03, { y: 262, color: GOLD, size: 42, until: pawnsT - 0.03 });
    bdg(g, t, 'PAWNS FLASH', pawnsT - 0.03, { y: 262, color: CREAM, size: 44, until: vanT - 0.03 });
    bdg(g, t, 'THEN VANISH', vanT - 0.03, { y: 262, color: RED, size: 44, until: repT - 0.03 });
    bdg(g, t, 'GAME REPORTS: FREE', repT - 0.03, { y: 262, color: LEAFG, size: 46, until: moreT - 0.03 });  // the hint; the end explains
    bdg(g, t, 'MORE AT THE END', moreT - 0.03, { y: 262, color: GOLD, size: 46 });
  };
  shot(earlyS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.24, 0.05, 7.6, [3.6, 2.1, 4.2])], [0.7, PHK[0]], [len(sh), PHK[1]]], { t, e: glide });
    earlyPh(g, t);
  }, { trans: 'whip', hud: earlyHud, info: true });
  shot(gameS - 0.02, (g, lt, t, sh) => {
    rig(B, lt, [[0, PHN[0]], [len(sh), PHN[1]]], { t, e: lin });
    earlyPh(g, t);
  }, { hud: earlyHud, info: true });
  cue(earlyS - 0.11, 'whoosh_fast', 0.3); cue(earlyS + 0.05, 'fabric', 0.3); cue(sig0T, 'reveal_bell', 0.35); knocks([PLAY, fr(PLAY + 0.16)], 0.5); cue(PLAY, 'sparkle_pop', 0.25);
  cue(gameS, 'swipe_card', 0.35); cue(pawnsT - 0.03, 'shimmer', 0.3); cue(vanT, 'whoosh_soft', 0.4); cue(repT - 0.03, 'success', 0.3); cue(moreT - 0.03, 'sparkle_pop', 0.3);
  MEM.taps.forEach(x => { if (memT(x) < s('plan') - 0.12) cue(memT(x), 'piece', 0.35); });

  // ======================= HIS PLAN SOUNDS TOO SIMPLE: his study; twenty-five, the place for the title on his chest is empty =======================
  const planS = s('plan') - 0.05, tooT = w('plan', 'too'), overT = w('plan', 'over'), thouT = w('plan', 'thousand'), solveT = T.w('plan', 9).s, thenT = T.w('plan', 12).s,
    sameT = w('plan', 'same'), againT = w('plan', 'again'), halfT = w('plan', 'half');
  shot(planS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.2, 11.6, [4, 1.5, 9.3])], [len(sh), K(-0.14, 0.16, 9.4, [4, 1.3, 9.3])]], { t, e: glide });
    study(g, t, { pieces: p0, hans: { e: exprAt([[0, { ...SMUG, look: [0.2, 0.6] }], [tooT - 0.1, SMUG]], t) }, md: { ghost: 1 }, focus: 8 });
  }, { grade: 'warm', trans: 'whip', hud: (g, lt, t) => {
    bdg(g, t, 'NOT A GRANDMASTER', planS + 0.1, { y: 108, color: RED, size: 48, sub: 'SWEDEN · 2010 · AGE 25', until: tooT - 0.05 });
    bdg(g, t, 'HIS PLAN: TOO SIMPLE?', tooT - 0.05, { y: 108, color: GOLD, size: 48 });
  } });
  cue(planS - 0.11, 'whoosh_fast', 0.3); cue(planS + 0.1, 'thud', 0.3); cue(tooT - 0.05, 'sparkle_pop', 0.3);
  // OVER A THOUSAND PUZZLES: from one card on the wall back to all 1,128 of them; SOLVE THEM ALL: the first pass
  const wallS = overT - 0.08, [hcx, hcy] = cardXY(...HEROC), WIDE = [4, 5.5, WG.z], pullA = 0.3, pullD = 1.25;
  const pullKeys = (() => { const k = [[0, K(0, 0, 0.62, [hcx, hcy - 0.06, WG.z])], [pullA, K(0, 0, 0.66, [hcx, hcy - 0.06, WG.z])]];
    for (let i = 1; i <= 14; i++) { const u = i / 14, e = ease.inOut(u); k.push([pullA + pullD * u, K(0, 0, 0.66 * Math.pow(16.4 / 0.66, e), [lerp(hcx, WIDE[0], e), lerp(hcy - 0.06, WIDE[1], e), WG.z]), lin]); }
    return k; })();
  const pass1 = [solveT + 0.02, thenT - 0.1];  // the first pass: every card, once
  const littleHans = (g, t, e) => standing(g, 'hans', 6.9, WG.z - 1.5, { e, t, k: 0.5, fx: 0, fz: -1, col: ['#2B3442', '#1C2330'] });
  shot(wallS, (g, lt, t, sh) => {
    rig(B, lt, [...pullKeys, [len(sh), K(0, 0, 16.0, WIDE)]], { t, e: lin, shake: 0 });
    cardWall(g, t, { n: 1128 * seg(t, pass1[0], pass1[1], lin) });
    heroCard(g, 1 - seg(lt, pullA + pullD * 0.75, pullA + pullD));
    littleHans(g, t, { ...EXPR.neutral, look: [-0.5, -0.9], brow: -0.3 });
  }, { grade: 'warm', trans: 'zoom', mbStep: 4, mbMax: 30, hud: (g, lt, t) => {
    const u = ease.out(seg(t, thouT - 0.1, thouT + 0.7, lin));
    if (t >= thouT - 0.1) counter(g, comma(1000 * u) + (u >= 1 ? '+' : ''), 'PUZZLES', { y: 330, size: 150, color: u >= 1 ? GOLD : CREAM, labelColor: BIRDC.body, at: [t, thouT - 0.1] });
    bdg(g, t, 'SOLVE THEM ALL', solveT, { y: 470, color: CREAM, size: 44 });
  } });
  cue(wallS - 0.05, 'whoosh_deep', 0.4); cue(thouT - 0.1, 'riser', 0.3); cue(thouT + 0.7, 'reveal_bell', 0.4); cue(solveT, 'drum', 0.4); cue(solveT + 0.4, 'drum', 0.35); cue(pass1[1], 'success', 0.35);
  // THEN SOLVE THE SAME ONES AGAIN, IN HALF THE TIME: close on the cards; the ticks go, and come back twice as fast
  const closeS = thenT - 0.06, wipeT = sameT - 0.12, redoT = againT - 0.05;
  const closeState = t => (c, r) => {
    const d = (r - 14) * 0.045 + c * 0.006;
    if (t >= redoT + d * 0.5) return [1, 1 + 0.14 * (1 - clamp((t - redoT - d * 0.5) / 0.14))];
    if (t >= wipeT + d) return [0, 1 - 0.1 * (1 - clamp((t - wipeT - d) / 0.12))];
    return [1, 1];
  };
  shot(closeS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0, 0, 4.9, [3.4, 7.6, WG.z])], [len(sh), K(0, 0, 3.9, [4.6, 6.7, WG.z])]], { t, e: glide, shake: 0 });
    cardWall(g, t, { state: closeState(t) });
  }, { grade: 'warm', hud: (g, lt, t) => {
    bdg(g, t, 'THE SAME PUZZLES', sameT, { y: 215, color: CREAM, size: 48 });
    bdg(g, t, 'AGAIN', againT, { y: 304, color: BIRDC.body, ink: '#FFFFFF', size: 46, until: halfT });
    bdg(g, t, 'IN HALF THE TIME', halfT, { y: 304, color: GOLD, size: 46 });
    if (t >= halfT) {  // the two passes as bars: the second half as long
      const u = ease.out(seg(t, halfT + 0.05, halfT + 0.4, lin)), x0 = 300, w0 = 540;
      [['1ST', w0, CREAM, 1], ['2ND', w0 / 2, GOLD, u]].forEach(([lab, ww, col, k], i) => { const y = 386 + i * 64; g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x0, y + 6, ww * k, 42); g.fillStyle = col; g.fillRect(x0, y, ww * k, 42); plate(g, lab, x0 - 66, y + 21, { color: INK, size: 26, rot: 0 }); });
    }
  } });
  cue(closeS - 0.05, 'whoosh_fast', 0.3); cue(wipeT, 'page_flip', 0.4); cue(redoT, 'drum', 0.45); cue(sameT, 'sparkle_pop', 0.25); cue(halfT, 'reveal_bell', 0.35);

  // ======================= FOUR WEEKS. THEN TWO. THEN ONE. THEN DAYS — ONE SINGLE DAY: one take of the wall, each pass faster =======================
  const cyS = s('cycles') - 0.05, fourT = w('cycles', 'four'), twoT = w('cycles', 'two'), oneT = T.w('cycles', 5).s, daysT = w('cycles', 'days'), untilT = w('cycles', 'until'),
    dayLT = T.w('cycles', 15).s, SLAM = fr(dayLT + 0.02);
  const CY = [[fourT, 0.72, '4', 'WEEKS'], [twoT, 0.5, '2', 'WEEKS'], [oneT, 0.38, '1', 'WEEK'], [daysT, 0.3, '4', 'DAYS'], [daysT + 0.42, 0.24, '2', 'DAYS'], [SLAM - 0.3, 0.3, '1', 'DAY']];
  const cyAt = t => { let i = -1; CY.forEach(([a], k) => { if (t >= a - 0.02) i = k; }); return i; };
  shot(cyS, (g, lt, t, sh) => {
    const z = t >= SLAM ? 1 - 0.05 * Math.exp(-(t - SLAM) * 7) : 1;
    rig(B, lt, [[0, K(0.13, 0.02, 17.2, WIDE)], [SLAM - cyS, K(-0.08, -0.01, 15.4, WIDE), lin], [len(sh), K(-0.1, -0.01, 16.2 * z, WIDE)]], { t, e: lin, shake: 0, bump: t >= SLAM && t < SLAM + 0.3 ? 1 : 0 });
    const i = cyAt(t), n = i < 0 ? 1128 : 1128 * clamp((t - CY[i][0]) / CY[i][1]);
    cardWall(g, t, { n, gold: seg(t, SLAM - 0.04, SLAM + 0.08) });
    if (t > CY[4][0] + CY[4][1] && t < SLAM - 0.3) {  // the held breath before the last pass: a sheen runs down the wall
      const u = ((t - CY[4][0] - CY[4][1]) / 0.75) % 1, a = B.project(WG.x0, WG.top, WG.z), b = B.project(WG.x0 + 24 * WG.p, WG.top - 47 * WG.p, WG.z), y = lerp(a.y - 200, b.y + 200, u);
      const sg = g.createLinearGradient(0, y - 170, 0, y + 170); sg.addColorStop(0, 'rgba(255,250,220,0)'); sg.addColorStop(0.5, 'rgba(255,250,220,0.5)'); sg.addColorStop(1, 'rgba(255,250,220,0)');
      g.save(); g.beginPath(); g.rect(a.x, a.y, b.x - a.x, b.y - a.y); g.clip(); g.globalCompositeOperation = 'screen'; g.fillStyle = sg; g.transform(1, -0.18, 0, 1, 0, 0); g.fillRect(-200, y - 170 + 100, W + 400, 340); g.restore();
    }
    littleHans(g, t, t >= SLAM ? { ...EXPR.happy, look: [0, 0], lid: 0.08 } : { ...EXPR.neutral, look: [-0.5, -0.9], brow: -0.3 });
    if (t >= SLAM) flashTint(g, '#FFE9B8', 0.5 * (1 - seg(t, SLAM, SLAM + 0.3)));
  }, { grade: 'warm', hud: (g, lt, t) => {
    const i = cyAt(t); if (i < 0) return;
    const last = i === CY.length - 1;
    plate(g, 'CYCLE ' + (i + 1), W / 2, 150, { color: last ? GOLD : CREAM, size: 36, rot: -0.018 });
    counter(g, CY[i][2], CY[i][3], { y: 370, size: last ? 210 : 170, color: last ? GOLD : CREAM, labelColor: last ? CREAM : BIRDC.body, at: [t, CY[i][0]] });
    if (t >= SLAM) confetti(g, t, SLAM, { n: 110, seed: 8 });
  } });
  cue(cyS - 0.05, 'whoosh_fast', 0.3);
  CY.forEach(([a, d], i) => { cue(a, 'drum', 0.3 + i * 0.05); if (d > 0.45) cue(a + 0.38, 'drum', 0.3); if (i < 5) cue(a + d, 'tick', 0.3); if (i) cue(a - 0.02, 'page_flip', 0.2); });
  cue(untilT, 'riser', 0.5); cue(SLAM - 0.32, 'revswell', 0.8); cue(SLAM - 0.004, 'boom', 0.85); cue(SLAM, 'reveal_bell', 0.5); cue(SLAM + 0.1, 'confetti', 0.4);

  // ======================= BY THEN HE ISN'T CALCULATING ANYMORE: arrows come and go over the board; then none =======================
  const whyS = s('why') - 0.05, isntT = w('why', 'isnt'), calcT = w('why', 'calculating'), he2T = T.w('why', 6).s, seesT = w('why', 'sees');
  const GUESS = [['d5', 'd8'], ['h6', 'g4'], ['d5', 'f7'], ['h6', 'f5'], ['d5', 'a8'], ['d5', 'e5']];
  const HIGH = { cy: H * 0.5 - 200 };  // the whole board from above (rule 22), lifted in the frame so the caption sits under it
  shot(whyS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.35, 0.5, 15.5, [5.3, 0.6, 5.2], HIGH)], [len(sh), K(-0.27, 0.47, 14.6, [5.2, 0.7, 5.3], HIGH)]], { t, e: glide });
    const out = 1 - seg(t, isntT - 0.05, isntT + 0.12);
    study(g, t, { pieces: p0, hans: { e: exprAt([[0, { ...EXPR.focus, look: [0.3, 0.8], brow: 0.7 }], [isntT, AT_BOARD]], t) }, focus: 9,
      under: g2 => GUESS.forEach(([a, b], i) => { const a0 = whyS + 0.04 + i * 0.13; boardArrow(g2, B, a, b, 0.9 * out * seg(t, a0, a0 + 0.06) * (1 - seg(t, a0 + 0.4, a0 + 0.52)), seg(t, a0, a0 + 0.12)); }) });
  }, { grade: 'warm', hud: (g, lt, t) => {
    const u = seg(t, calcT + 0.05, calcT + 0.28, lin);
    const P = plate(g, 'CALCULATING...', W / 2, 118, { color: CREAM, size: 48, rot: -0.018 });
    if (u > 0 && P) { g.save(); g.translate(W / 2, 118); g.rotate(-0.018); g.strokeStyle = RED; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(-P.w / 2 - 14, 4); g.lineTo(-P.w / 2 - 14 + (P.w + 28) * u, -4); g.stroke(); g.restore(); }
  } });
  cue(whyS - 0.05, 'whoosh_deep', 0.3); GUESS.forEach((_, i) => cue(whyS + 0.04 + i * 0.13, 'tick', 0.25)); cue(calcT + 0.05, 'swipe_card', 0.4);
  // HE JUST SEES IT: the whole mate at once
  const seeS = he2T - 0.08, GO = fr(seesT - 0.02), SEE = { mv: 0.15, gap: 0.05 }, mateT = GO + 2 * (SEE.mv + SEE.gap) + SEE.mv;
  shot(seeS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.48, 11.6, [5.75, 0.7, 5.6], HIGH)], [len(sh), K(-0.22, 0.44, 10.6, [5.85, 0.8, 5.9], HIGH)]], { t, e: glide, bump: t > mateT && t < mateT + 0.25 ? 1 : 0 });
    const S = solve(t, GO, SEE.mv, SEE.gap), pre = seg(t, seeS + 0.1, seeS + 0.3) * (t < GO ? 1 : 0);
    study(g, t, { pieces: S.pieces, hans: { e: exprAt([[0, SEES], [mateT, GRIN]], t) }, focus: 7.5,
      under: g2 => { squareFrame(g2, B, 'g8', GOLD, pre, { fill: 0.3 }); squareFrame(g2, B, 'f7', GOLD, pre, { fill: 0.3 }); boardArrow(g2, B, 'd5', 'g8', pre, 1); boardArrow(g2, B, 'h6', 'f7', pre, 1);
        solveUnder(g2, S); if (S.done) squareFrame(g2, B, 'h8', HI.bad, 1, { fill: 0.5 }); },
      over: g2 => solveOver(g2, S) });
    if (t >= mateT) flashTint(g, '#FFE9B8', 0.35 * (1 - seg(t, mateT, mateT + 0.25)));
  }, { grade: 'warm', hud: (g, lt, t) => { bdg(g, t, 'HE JUST SEES IT', seesT, { x: 660, y: 112, color: BIRDC.body, ink: '#FFFFFF', size: 52 }); } });
  cue(seeS + 0.1, 'shimmer', 0.3);
  for (let k = 0; k < 3; k++) cue(GO + k * (SEE.mv + SEE.gap) + SEE.mv - MOVE_HIT, k === 1 ? 'move_capture' : 'move', 0.5);
  boom(mateT, 0.7); cue(seesT, 'reveal_bell', 0.4);

  // ======================= THE SPONSOR, THE SECOND TIME. CHESSIGMA'S SUPERCOACH RUNS THIS METHOD FOR YOU. IT TIMES EVERY
  // CYCLE, AND ONLY LETS YOU MOVE ON WHEN YOU'RE FASTER AND CLEANER: the phone again. The site's Woodpecker page (the sets
  // by level, its own line "Pass faster and cleaner each time") and the author's recording of a puzzle of the set, with
  // its timer =======================
  const midS = s('mid') - 0.05, sigT = w('mid', 'chessigmas'), runsT = w('mid', 'runs'), youT = w('mid', 'you'), timesT = w('mid', 'times'), onT = w('mid', 'on'), fasterT = w('mid', 'faster'), cleanT = w('mid', 'cleaner');
  const TAP = fr(youT + 0.12), solveS = TAP + 0.22, gateS = onT - 0.12;
  const midPh = phoneSeg({
    prog: [[midS, t => ({ page: 0 })],
      [runsT - 0.12, t => ({ page: 400 - 110 * (1 - ease.out(seg(t, runsT - 0.12, runsT + 0.4, lin))) })],
      [solveS, t => ({ rec: 'solve', sec: 0.2 + Math.max(0, t - (solveS + 0.26)) })],  // the recording opens on a loading screen (0.2 s), then runs 2.3 s
      [gateS, t => ({ page: 0 })]],  // back to the top of the site's page, for its own line: "Pass faster and cleaner each time"
    boxes: [[30, 166, 694, 306, runsT + 0.3, TAP - 0.04], [72, 792, 292, 912, TAP - 0.04, solveS], [606, 92, 774, 184, timesT + 0.05, gateS - 0.04], [26, 282, 754, 384, fasterT - 0.22, s('result') - 0.13]],
    pecks: [[TAP, 852, 118], [fr(TAP + 0.16), 852, 118], [fr(fasterT - 0.02), 333, 70], [fr(cleanT - 0.02), 333, 70]],
  });
  const midHud = (g, lt, t) => {
    adHud(g, lt, t); if (t >= sigT) sigPlate(g, 150, t < sigT + 0.4 ? popIn(t, sigT) : {});
    bdg(g, t, 'IT RUNS THE METHOD FOR YOU', runsT, { y: 262, color: CREAM, size: 38, until: timesT - 0.03 });
    bdg(g, t, 'EVERY CYCLE TIMED', timesT - 0.03, { y: 262, color: CREAM, size: 40, until: fasterT - 0.1 });  // the gate, in our own plates
    bdg(g, t, 'FASTER ✓', fasterT, { x: 370, y: 262, color: LEAFG, size: 42 });
    bdg(g, t, 'CLEANER ✓', cleanT, { x: 700, y: 262, color: LEAFG, size: 42 });
  };
  shot(midS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.04, 7.0, [3.6, 2.15, 4.2])], [0.6, PHK[0]], [len(sh), PHK[1]]], { t, e: glide });
    midPh(g, t);
  }, { trans: 'whip', hud: midHud, info: true });
  shot(solveS - 0.02, (g, lt, t, sh) => {
    rig(B, lt, [[0, PHN[0]], [len(sh), PHN[1]]], { t, e: lin });
    midPh(g, t);
  }, { hud: midHud, info: true });
  cue(midS - 0.11, 'whoosh_fast', 0.3); cue(sigT, 'reveal_bell', 0.4); cue(runsT - 0.12, 'swipe_card', 0.35); knocks([TAP, fr(TAP + 0.16), fr(fasterT - 0.02), fr(cleanT - 0.02)], 0.5); cue(TAP, 'sparkle_pop', 0.22);
  cue(solveS, 'notify', 0.3); cue(timesT, 'clock_press', 0.35); for (let x = timesT + 0.45; x < gateS - 0.1; x += 0.5) cue(x, 'clock_tick', 0.2);
  cue(gateS, 'swipe_card', 0.35); cue(fasterT, 'success', 0.3); cue(cleanT, 'success', 0.35);

  // ======================= AS FOR THE MAN IN THE RED HAT: him, close =======================
  const resS = s('result') - 0.05, n3T = w('result', 'three'), n7T = w('result', 'seven'), andT = w('result', 'and'), hisT = w('result', 'his'), hansT = w('result', 'hans'),
    finT = w('result', 'finnish'), litT = w('result', 'little');
  shot(resS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.26, 0.03, 8.6, [HANS.x + 0.35, 3.05, 9.3])], [len(sh), K(-0.14, 0.03, 7.5, [HANS.x + 0.3, 3.1, 9.3])]], { t, e: glide });
    forest(g, t, { pieces: pF, hans: { e: exprAt([[0, { ...SMUG, look: [0.3, 0.5] }], [resS + 0.55, { ...SMUG, look: [0, 0], curve: 0.7 }]], t) }, brd: null, onTrunk: g2 => birdOnTrunk(g2, t, { a: 0 }), focus: 7.5 });  // the bird would stand half out of the frame's left edge: not drawn here
  }, { trans: 'whip', hud: (g, lt, t) => { bdg(g, t, 'THE MAN IN THE RED HAT', w('result', 'man') - 0.05, { y: 215, color: HAT, ink: '#FFFFFF', size: 48 }); } });
  cue(resS - 0.11, 'whoosh_fast', 0.3); cue(w('result', 'man') - 0.05, 'sparkle_pop', 0.3);
  // THREE GRANDMASTER NORMS IN SEVEN WEEKS: the bird nails three gold plates up the birch
  const plqS = n3T - 0.14, PLY = [3.2, 4.4, 5.6], plT = [fr(n3T + 0.04), fr(n3T + 0.38), fr(n3T + 0.72)];
  const normH = plT.flatMap(x => [x, fr(x + 0.14)]);
  const hopY = t => PLY[0] - 1.64 + 1.2 * (seg(t, plT[1] - 0.15, plT[1] - 0.03) + seg(t, plT[2] - 0.15, plT[2] - 0.03));
  shot(plqS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.16, 0.04, 7.6, [0.6, 3.3, 10.4])], [1.2, K(0.1, 0.04, 7.0, [0.6, 3.75, 10.4])], [len(sh), K(0.04, 0.03, 6.6, [0.6, 3.9, 10.4])]], { t, e: glide });
    forest(g, t, { pieces: pF, hans: { e: GRIN }, brd: { hits: normH, y: hopY(t), hole: false, look: [0.6, 0.1] }, onTrunk: g2 => plaques(g2, t, PLY, plT), focus: 7 });
  }, { hud: (g, lt, t) => {
    const n = plT.filter(x => t >= x).length;
    if (n) counter(g, String(n), n > 1 ? 'GM NORMS' : 'GM NORM', { x: 760, y: 290, size: 160, color: GOLD, labelColor: CREAM, at: [t, plT[n - 1]] });
    bdg(g, t, 'IN 7 WEEKS', n7T, { x: 760, y: 424, color: BIRDC.body, ink: '#FFFFFF', size: 46 });
  } });
  cue(plqS - 0.05, 'whoosh_fast', 0.3); knocks(normH, 0.55); plT.forEach(x => cue(x, 'sparkle_pop', 0.3)); cue(n7T, 'reveal_bell', 0.35);
  // AND HIS NAME? HANS TIKKANEN: the bird lands on his shoulder and leans to his ear
  const teaS = andT - 0.06;
  shot(teaS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.22, 0.0, 9.6, [HANS.x - 0.5, 2.75, 9.3])], [len(sh), K(0.08, -0.01, 7.6, [HANS.x - 0.45, 2.8, 9.3])]], { t, e: glide });
    const whisper = seg(t, hansT - 0.3, hansT - 0.1);
    forest(g, t, { pieces: pF, hans: { e: exprAt([[0, SMUG], [andT + 0.4, { ...EXPR.neutral, look: [-0.95, 0.2], brow: -0.25, browY: -6 }], [hansT + 0.35, { ...SMUG, look: [0, 0], curve: 0.75 }]], t), tilt: -0.04 * whisper }, focus: 7.5,
      onTrunk: g2 => birdOnTrunk(g2, t, { a: 0 }),
      over: g2 => birdFly(g2, t, andT + 0.06, 0.36, perch(), SHOULDER, SBIRD, { land: { rot: 0.32 * whisper, peck: 0.5 * whisper, look: whisper > 0.5 ? [0.8, -0.2] : [0.5, 0.1] } }) });
  }, { hud: (g, lt, t) => {
    bdg(g, t, 'AND HIS NAME?', hisT - 0.1, { y: 215, color: GOLD, size: 52, until: hansT });
    bdg(g, t, 'HANS TIKKANEN', hansT, { y: 215, color: '#1C2330', size: 56 });
  } });
  cue(teaS - 0.05, 'whoosh_fast', 0.3); cue(andT + 0.06, 'fabric', 0.3); cue(hisT - 0.1, 'sparkle_pop', 0.3); cue(hansT, 'reveal_bell', 0.3);
  // IN FINNISH, IT MEANS LITTLE WOODPECKER: the two of them, the bird on his shoulder
  const namS = finT - 0.14;
  shot(namS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.07, 0.02, 11.6, [2.6, 3.55, 9.9], { cy: H * 0.46 })], [len(sh), K(-0.03, 0.02, 10.0, [2.6, 3.6, 9.9], { cy: H * 0.46 })]], { t, e: glide });
    forest(g, t, { pieces: pF, hans: { e: exprAt([[0, { ...SMUG, look: [0, 0] }], [litT + 0.25, GRIN]], t) }, brd: null, onTrunk: g2 => birdOnTrunk(g2, t, { a: 0 }), focus: 10,
      over: g2 => bird(g2, ...SHOULDER, SBIRD, t, { dir: 1, pose: 'stand', look: t > litT + 0.4 ? [0.2, 0] : [0.7, -0.1] }) });
  }, { hud: (g, lt, t) => {
    bdg(g, t, 'IN FINNISH', namS + 0.05, { y: 112, color: CREAM, size: 34, until: litT });
    bdg(g, t, 'TIKKANEN', namS + 0.2, { y: 210, color: CREAM, size: 66 });
    bdg(g, t, '= LITTLE WOODPECKER', litT, { y: 300, color: BIRDC.body, ink: '#FFFFFF', size: 46 });
  } });
  cue(namS - 0.05, 'whoosh_fast', 0.3); cue(namS + 0.05, 'sparkle_pop', 0.3); cue(litT, 'reveal_bell', 0.4); cue(litT + 0.1, 'knock', 0.3);
  // THAT'S WHY IT'S CALLED THE WOODPECKER METHOD: the book on the table
  const metS = s('method') - 0.05, wmT = w('method', 'woodpecker'), bookT = metS + 0.15;
  shot(metS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.1, 12.4, [3.0, 2.3, 8.8])], [len(sh), K(-0.1, 0.06, 10.2, [3.0, 2.45, 8.9])]], { t, e: glide });
    const drop = ease.out(seg(t, bookT, bookT + 0.22, lin));
    forest(g, t, { pieces: pF, hans: { e: GRIN }, brd: null, onTrunk: g2 => birdOnTrunk(g2, t, { a: 0 }), focus: 10,
      over: g2 => { book(g2, { c: [0.75, 1.25 + (1 - drop) * 6, 7.9], a: clamp((t - bookT) * 8) }); bird(g2, ...SHOULDER, SBIRD, t, { dir: 1, pose: 'stand', look: [0.2, 0] }); } });
  }, { hud: (g, lt, t) => { bdg(g, t, 'THE WOODPECKER METHOD', wmT, { y: 215, color: BIRDC.body, ink: '#FFFFFF', size: 44, sub: 'AXEL SMITH & HANS TIKKANEN · 2018' }); } });
  cue(metS - 0.05, 'whoosh_fast', 0.3); cue(bookT + 0.2, 'thud', 0.4); cue(wmT, 'reveal_bell', 0.4);

  // ======================= THE SPONSOR, THE THIRD TIME. TODAY YOU DON'T NEED A THOUSAND PRINTED PUZZLES: the pile blows off
  // the table, the phone stays. THE SETS ARE IN CHESSIGMA =======================
  const a1S = s('ad1') - 0.05, dontT = w('ad1', 'dont'), setsT = w('ad1', 'sets'), sig2T = w('ad1', 'chessigma');
  const a3S = s('ad3') - 0.04, coachT = w('ad3', 'coach'), ownT = w('ad3', 'own'), buildsT = w('ad3', 'builds'), plan3T = w('ad3', 'plan'), ctaS = s('cta') - 0.05;
  const freeS = s('free') - 0.05, freeT = w('free', 'free'), unlT = w('free', 'unlimited'), gradT = w('free', 'graded'), accT = w('free', 'accuracy'), bestT = T.w('free', 15).s, appT = w('free', 'app'), linkT = w('free', 'link');
  const BLOW = fr(dontT + 0.02), stackTop = [STACK.x + 0.2, -0.35 + STACK.h, STACK.z - 0.2], peckS = [fr(BLOW - 0.3), fr(BLOW - 0.14), BLOW], trainS = setsT - 0.14;
  shot(a1S, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.24, 0.2, 12.2, [2.5, 1.9, 4.2])], [len(sh), K(-0.06, 0.14, 10.4, [2.9, 2.0, 4.2])]], { t, e: glide });
    forest(g, t, { hans: null, board: false, focus: 10, extra: (g2, ph) => {
      if (ph !== 'top') return;
      paperStack(g2, t, BLOW); phone(g2, t, { to: { page: 0 } });
      const v = strikeAt(t, peckS), drop = seg(t, BLOW, BLOW + 0.3);
      if (t < BLOW + 0.1) bird(g2, stackTop[0], stackTop[1] - drop * 2.6, stackTop[2], PBIRD * 1.25, t, { dir: 1, pose: 'stand', rot: 0.5 + 0.55 * v, peck: v, look: [0.5, 0.7] });
      else birdFly(g2, t, BLOW + 0.1, 0.45, [stackTop[0], stackTop[1] - 0.8, stackTop[2]], edgeAt(560), PBIRD, { land: { pose: 'cling', look: [0.7, 0] }, lift: 0.8 });
    } });
  }, { trans: 'whip', hud: (g, lt, t) => { adHud(g, lt, t); bdg(g, t, '1,128 PRINTED PUZZLES', a1S + 0.2, { y: 215, color: CREAM, size: 46, until: BLOW }); if (t >= BLOW) plate(g, 'NOT NEEDED', W / 2, 215, { color: RED, size: 50, rot: -0.018, ...popIn(t, BLOW) }); } });
  cue(a1S - 0.11, 'whoosh_fast', 0.3); knocks(peckS, 0.5); cue(BLOW, 'paper', 0.6); cue(BLOW + 0.05, 'whoosh_soft', 0.5); cue(BLOW + 0.25, 'page_flip', 0.4); cue(BLOW + 0.1, 'fabric', 0.3);
  // ITS COACH READS YOUR OWN GAMES AND BUILDS YOUR TRAINING PLAN EVERY MORNING: the author's own recordings of the app.
  // The Train tab with its trainers and the row of his set; the coach asked about his games and its answer; the day's
  // plan on the home screen. AND THE BEST PART IS FREE: UNLIMITED GAME REPORTS ... ON THE APP STORE AND GOOGLE PLAY. LINK
  // IN BIO: the site's own sheet with the two store badges and its line about the free review (photos/chessigma_stores.jpg)
  const endPh = phoneSeg({
    prog: [[a1S, t => ({ page: 0 })],
      [trainS, t => ({ rec: 'train', sec: 0.8 + t - trainS })],
      [a3S, t => ({ rec: 'think', sec: t - a3S - 0.05 })],
      [ownT + 0.1, t => ({ rec: 'answer', sec: Math.min(2.45, t - (ownT + 0.1)) })],  // its last frames are the next screen loading
      [buildsT - 0.2, t => ({ rec: 'home', sec: t - (buildsT - 0.2) })],
      [freeS, t => ({ still: 'stores_jpg' })]],
    boxes: [[16, 96, 764, 292, a3S + 0.3, ownT], [22, 362, 758, 546, buildsT - 0.02, plan3T - 0.04], [22, 566, 758, 1156, plan3T - 0.04, freeS - 0.05],
      [40, 456, 680, 780, unlT - 0.1, appT - 0.25], [22, 1448, 758, 1584, appT - 0.25, ctaS]],
    pecks: [[fr(trainS + 0.6), 380, 90], [fr(a3S + 0.1), 250, 70], [fr(buildsT), 455, 60], [fr(plan3T), 640, 80], [fr(freeT), 620, 110], [fr(appT), 1300, 100], [fr(appT + 0.17), 1300, 100]],
  });
  const endHud = (g, lt, t) => {
    adHud(g, lt, t); if (t >= sig2T - 0.25) sigPlate(g, 150, t < sig2T + 0.15 ? popIn(t, sig2T - 0.25) : {});
    bdg(g, t, 'THE SETS ARE IN THE APP', setsT, { y: 262, color: CREAM, size: 40, until: coachT - 0.07 });
    bdg(g, t, 'THE COACH READS YOUR GAMES', coachT - 0.05, { y: 262, color: CREAM, size: 38, until: buildsT - 0.05 });
    bdg(g, t, 'A NEW PLAN EVERY MORNING', buildsT, { y: 262, color: GOLD, size: 40, until: freeS });
    // the free reports, the point of the whole block: the word FREE stays, what is in a report goes by under it
    bdg(g, t, 'FREE', freeT - 0.03, { x: 250, y: 262, color: LEAFG, size: 58, until: linkT - 0.05 });
    bdg(g, t, 'UNLIMITED GAME REPORTS', unlT - 0.03, { x: 690, y: 262, color: CREAM, size: 30, until: gradT - 0.03 });
    bdg(g, t, 'EVERY MOVE GRADED', gradT - 0.03, { x: 690, y: 262, color: CREAM, size: 34, until: accT - 0.03 });
    bdg(g, t, 'YOUR ACCURACY', accT - 0.03, { x: 690, y: 262, color: CREAM, size: 38, until: bestT - 0.03 });
    bdg(g, t, 'THE BEST MOVE', bestT - 0.03, { x: 690, y: 262, color: CREAM, size: 38, until: appT - 0.1 });
    bdg(g, t, 'APP STORE · GOOGLE PLAY', appT - 0.1, { x: 690, y: 262, color: GOLD, size: 30, until: linkT - 0.05 });
    bdg(g, t, 'LINK IN BIO', linkT - 0.05, { y: 262, color: GOLD, size: 56 });
  };
  shot(trainS, (g, lt, t, sh) => {
    rig(B, lt, [[0, PHK[0]], [len(sh), PHK[1]]], { t, e: lin });
    endPh(g, t);
  }, { hud: endHud, info: true });
  shot(a3S, (g, lt, t, sh) => {
    rig(B, lt, [[0, PHN[0]], [len(sh), PHN[1]]], { t, e: lin });
    endPh(g, t);
  }, { hud: endHud, info: true });
  shot(buildsT - 0.22, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.07, 0.015, 5.75, PHC)], [len(sh), K(0.0, 0.015, 5.5, PHC)]], { t, e: lin });
    endPh(g, t);
  }, { hud: endHud, info: true });
  shot(freeS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.02, 6.4, PHC)], [len(sh), K(0.03, 0.015, 5.8, PHC)]], { t, e: glide });
    endPh(g, t);
  }, { hud: endHud, info: true });
  cue(trainS, 'swipe_card', 0.35); cue(sig2T - 0.25, 'reveal_bell', 0.4); cue(a3S, 'swipe_card', 0.4); cue(ownT + 0.1, 'swipe_card', 0.35); cue(buildsT - 0.2, 'swipe_card', 0.35);
  cue(buildsT, 'reveal_bell', 0.3); cue(freeS, 'swipe_card', 0.4); cue(freeT - 0.03, 'success', 0.45); cue(freeT, 'reveal_bell', 0.45);
  [gradT, accT, bestT].forEach(x => cue(x - 0.03, 'sparkle_pop', 0.28)); cue(appT - 0.1, 'notify', 0.3); cue(linkT - 0.05, 'reveal_bell', 0.4);
  { const pk = [fr(trainS + 0.6), fr(a3S + 0.1), fr(buildsT), fr(plan3T), fr(freeT), fr(appT), fr(appT + 0.17)]; knocks(pk, 0.5); pk.forEach(x => cue(x, 'sparkle_pop', 0.22)); }

  // ======================= CTA: the two of them at the birch again; how many puzzles did you solve today? =======================
  const howT = w('cta', 'how'), slvT = w('cta', 'solve'), todayT = w('cta', 'today'), STOP = fr(todayT + 0.25);
  const ctaH = train(ctaS + 0.1, STOP - 0.05).filter((_, i) => i % 5 !== 4);
  shot(ctaS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.03, 0.03, 10.8, [2.75, 2.95, 9.9])], [len(sh), K(-0.03, 0.03, 9.6, [2.75, 3.0, 9.9])]], { t, e: glide });
    const at = t >= STOP + 0.1;
    forest(g, t, { pieces: pF, hans: { e: at ? GRIN : AT_BIRD, hits: ctaH, tilt: at ? 0 : -0.05 }, brd: { hits: ctaH, look: at ? [-0.6, 0] : [0.6, 0.1] }, focus: 9.5 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    adHud(g, lt, t); sigPlate(g, 150, { lh: 40 });
    bdg(g, t, 'HOW MANY PUZZLES TODAY?', howT, { y: 256, color: GOLD, size: 48 });
    bdg(g, t, 'COMMENT YOUR NUMBER', slvT, { y: 342, color: BIRDC.body, ink: '#FFFFFF', size: 40 });
    bdg(g, t, 'FOLLOW ' + CHANNEL, slvT + 0.5, { y: 420, color: CREAM, size: 36 });  // rule 29: a readable plate
  } });
  cue(ctaS - 0.06, 'whoosh_fast', 0.3); knocks(ctaH, 0.34); taps(ctaH, 0.22); cue(howT, 'sparkle_pop', 0.3); cue(slvT, 'sparkle_pop', 0.3); cue(slvT + 0.5, 'sparkle_pop', 0.22);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'intrigue' }, { t: SEEN - 0.004, m: 'slam' }, { t: brS, m: 'hook' }, { t: earlyS, m: 'digital' }, { t: planS, m: 'intrigue' }, { t: wallS, m: 'tension' }, { t: cyS, m: 'build' },
    { t: SLAM - 0.004, m: 'slam' }, { t: whyS, m: 'void' }, { t: midS, m: 'digital' }, { t: resS, m: 'victory' }, { t: metS, m: 'glory' }, { t: a1S, m: 'digital' }, { t: ctaS, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: SEEN - 0.3, t1: SEEN - 0.01, kind: 'mute' }, { t0: SEEN, t1: SEEN + 1.2, kind: 'boost', db: 4 },
    { t0: GAG - 0.03, t1: earlyS - 0.03, kind: 'mute' },  // the knocks answer each other in silence
    { t0: SLAM - 0.3, t1: SLAM - 0.01, kind: 'mute' }, { t0: SLAM, t1: SLAM + 1.0, kind: 'boost', db: 4 },
    { t0: ctaS, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
