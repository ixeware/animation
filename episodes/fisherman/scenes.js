// The Fisherman. Stockfish, the strongest chess player on Earth, is a fish (the cod of its logo, as in the author's
// Mittens video) — and it was afraid of one man. Fischer is German for fisherman: while he was alive no big fish was
// safe (twenty wins in a row, 6–0 Taimanov, whose own country took his salary, 6–0 Larsen, Spassky applauding game 6,
// three wins against an MIT computer in 1977). Near the end he said "I hate chess. Very much." He died in January
// 2008; Stockfish's first release came out that November: the fish only dared to surface once the fisherman was gone.
// Sources and what is drawn: SOURCES.md; the scenario: SCENARIO.md.
// Rules 42-45 and 54 (edit bait): the hook frame is the fish itself; the transition to Fischer follows a fish that bites
// a pawn on his hook up through the surface (the author's TikTok reference, without its white flash: rule 52); the
// title BOBBY "THE FISHERMAN" FISCHER gets a clean frame; the "I hate chess" room is after the author's photo.
// Palette (rule 48): North Atlantic morning — turquoise water, a red boat, Reykjavik's coloured roofs and Esja; the
// halls are pale and warm; the end is winter blue.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, QA, smooth } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { badge, plate, inkText, inkWidth, nameTitle, placeStamp, stamp, counter, scoreboard, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { room, table, FLOOR_Y, texTri, pool, chair } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { bokeh, spotCone } from '../../engine/js/light.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { photo3d } from '../../engine/js/photo3d.js';
import { loadImage } from '../../engine/js/photo.js';
import { flashTint } from '../../engine/js/hifx.js';
import { rays } from '../../engine/js/draw.js';
import { shockwave, glint, burst } from '../../engine/js/fx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream, BLUE = '#2F63B8', SKY = '#5DB8F0';
const BOAT = '#C8342B', BOATD = '#8E1F1A', SOVIET = '#D2302A';
// the real games (PGN Mentor's Fischer collection): Vancouver 1971 game 1 (0-1 after 40.Re1), Denver 1971 game 6 (0-1
// after 33.Qh6), Reykjavik 1972 game 6 (1-0 after 41.Qf4, the applause), Cambridge 1977 (21.Qh6# against the program)
const GT = await fetch('../engine/data/taimanov_fischer_1971_g1.json').then(r => r.json());
const GL = await fetch('../engine/data/larsen_fischer_1971_g6.json').then(r => r.json());
const GS = await fetch('../engine/data/fischer_spassky_1972_g6.json').then(r => r.json());
const GC = await fetch('../engine/data/fischer_greenblatt_1977.json').then(r => r.json());
// the fish of the Stockfish logo (Klein Maetschke, GPLv3), cut out of its green tile for hikaru213 (photos/cut_fish.py)
const FISH = await loadImage('../episodes/hikaru213/photos/stockfish_fish.png');

// ---------- cast. Fischer as the author picked (variant E, after his portrait): wavy, tousled dark hair with a lock on the
// forehead, deep-set eyes under thick straight brows, a strong nose, a full lower lip, an angular jaw and high
// cheekbones; in a dark suit and tie (1972), in shirt sleeves on the floor of the empty room (the author's photo), and at
// the end of his life with white hair and a white beard ----------
CAST.fischerShirt = { face: [0.9, 1.07, 0.86], hair: 'tousled', hairC: '#33241A', brow: '#241912', browH: 1.35, browL: 1.08, browSet: 0.12,
  cheeks: 1.5, chin: 0.7, jawAngle: 0.8, jawLine: 1, nose: 1.22, lids: 0.2, sockets: 2.0, lipFull: 1, lip: '#9A4E46', iris: '#4E3A2A',
  ears: 1.1, blushK: 0.35, neckLift: 12, neckW: 48, suit: '#F2F0EA', suitD: '#D3CFC6', shirt: 'dress' };
CAST.fischer72 = { ...CAST.fischerShirt, suit: '#232A38', suitD: '#171C27', shirt: 'tie', tie: '#14171D' };
CAST.fischerOld = { ...CAST.fischerShirt, hairC: '#E2DED6', brow: '#CFCAC0', beard: '#ECE9E3', beardBig: true, age: 0.8, cheeks: 0.8, chin: 0,
  jawLine: 0, lids: 0.32, lipFull: 0, suit: '#E8E6E0', suitD: '#C9C5BC' };
CAST.hikaru14 = { ...CAST.hikaru, shirt: 'tee', suit: '#2E3446', suitD: '#1F2433' };  // 2014, the handicap match
CAST.taimanov = { face: [0.95, 1.06, 0.88], hair: 'receding', hairC: '#3A2E26', brow: '#2E241E', suit: '#4E545C', suitD: '#383D43', shirt: 'tie', tie: '#2A3550', ears: 1.04, age: 0.35 };
CAST.larsen = { face: [0.92, 1.1, 0.84], hair: 'swept', hairC: '#B08A5E', brow: '#8A6A44', suit: '#3A4A3E', suitD: '#29352C', shirt: 'tie', tie: '#7A2A2A', ears: 1.04, iris: '#6F8BA0' };
CAST.spassky72 = { ...CAST.spassky, suit: '#5E6670', suitD: '#434A52' };
const STARE = { ...EXPR.focus, look: [0, 0.6], lid: 0.2 };
const SMUG = { ...EXPR.smug, lid: 0.3, look: [0.2, 0.1] };
const TIRED = { ...EXPR.tired, look: [0.55, 0.15], lid: 0.42 };

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

// the Stockfish fish (the logo's cod, cut out), facing left: drawn in thin vertical strips that sway more toward the
// tail, so the body swims; len = its length in pixels
const FISHC = makeCanvas(FISH.width, Math.ceil(FISH.height * 1.3)), fishx = FISHC.getContext('2d');
function fishPhoto(g, x, y, len, t, { rot = 0, wag = 1, flip = false } = {}) {
  const iw = FISH.width, ih = FISH.height, ch = FISHC.height, n = 48;
  fishx.setTransform(1, 0, 0, 1, 0, 0); fishx.clearRect(0, 0, iw, ch);
  for (let i = 0; i < n; i++) {  // the body in strips, each shifted on the swimming wave (no shadow here: it would band)
    const u = i / n, x0 = Math.floor(u * iw), x1 = Math.floor((i + 1) / n * iw), amp = ih * 0.055 * wag * Math.pow(u, 1.7);
    fishx.drawImage(FISH, x0, 0, x1 - x0, ih, x0, (ch - ih) / 2 + Math.sin(t * 8.5 - u * 4.2) * amp, x1 - x0, ih);
  }
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(len / iw * (flip ? -1 : 1), len / iw);
  g.shadowColor = 'rgba(4,30,60,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 26;
  g.drawImage(FISHC, -iw / 2, -ch / 2);
  g.restore();
}
function smallCredit(g, text, y) {
  g.save(); g.font = sans(19, 700); g.letterSpacing = '2px'; const w = inkWidth(g, text) + 36;
  g.fillStyle = 'rgba(4,24,48,0.55)'; g.beginPath(); g.roundRect(W / 2 - w / 2, y - 18, w, 36, 18); g.fill();
  g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; inkText(g, text, W / 2, y + 1); g.restore();
}


// ======================= UNDER WATER: sunlit turquoise over sand, the sunken board, the surface overhead =======================
const UF = -0.42, SURF = 9;  // the sand (the board's slab rests on it) and the underside of the surface
const fogU = (col, d, deep = 0) => mix(col, deep ? '#0F3F6E' : '#1C78B2', clamp((d - 4) / (deep ? 18 : 30)) * 0.9);
const UWEED = (() => { const r = rng(57), a = []; for (let i = 0; i < 40; i++) { const x = -14 + r() * 36, z = -2 + r() * 34; if (x > -1.8 && x < 9.8 && z > -1.8 && z < 9.8) continue; a.push({ x, z, h: 1.4 + r() * 3.6, ph: r() * 6, c: r() < 0.5 ? '#2F8A5E' : '#45A653' }); } return a; })();
const UROCK = [{ x: 9.6, z: 8.6, r: 1.9 }, { x: -3, z: 12, r: 1.4 }, { x: 13, z: 16, r: 2.4 }, { x: -6, z: 4, r: 1.1 }, { x: 16.5, z: 6, r: 1.5 }, { x: 4, z: 20, r: 2.0 }];
const SEAWOOD = { light: '#CFE2D4', dark: '#5E8A7E', frame: '#3E5E54', side: '#2B4740', m: 0.35, th: 0.35, rc: 0.3 };
const FINAL72 = piecesAt(GS, GS.length - 1);
function surfaceSheet(g, t, shadow) {
  const q = [[-70, SURF, -40], [80, SURF, -40], [80, SURF, 110], [-70, SURF, 110]];
  if (!B.poly(g, q)) return;
  g.save(); g.clip();
  const sg = g.createLinearGradient(0, 0, 0, H * 0.45); sg.addColorStop(0, '#F0FDFF'); sg.addColorStop(1, '#9BE2F4');
  g.fillStyle = sg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3;  // ripples
  for (let z = -10; z < 90; z += 3.2) {
    g.beginPath(); let up = true;
    for (let x = -50; x <= 70; x += 4) {
      const zz = z + Math.sin(x * 0.3 + t * 1.1 + z) * 0.7;
      if (depth(x, SURF, zz) < 0.6) { up = true; continue; }
      const p = B.project(x, SURF, zz); if (up) { g.moveTo(p.x, p.y); up = false; } else g.lineTo(p.x, p.y);
    }
    g.stroke();
  }
  if (shadow && shadow.a > 0.01) {  // the hull seen from below: a long dark lozenge, pointed at the bow
    const { x, z, a = 1, len = 7.4, wid = 2.4, rot = 0 } = shadow, n = 28, pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / n * Math.PI * 2, lx = Math.cos(u) * len / 2, lz = Math.sin(u) * wid / 2 * (1 - 0.45 * Math.max(0, Math.cos(u)) ** 2);
      pts.push([x + lx * Math.cos(rot) - lz * Math.sin(rot), SURF - 0.01, z + lx * Math.sin(rot) + lz * Math.cos(rot)]);
    }
    if (B.poly(g, pts)) { g.fillStyle = `rgba(8,34,58,${(0.7 * a).toFixed(3)})`; g.shadowColor = 'rgba(8,34,58,0.6)'; g.shadowBlur = 36; g.fill(); }
  }
  g.restore();
}
function rockU(g, k, deep) {
  const d = depth(k.x, UF, k.z); if (d < 1) return;
  const p = B.project(k.x, UF, k.z), rx = k.r * p.s, ry = k.r * p.s * 0.62;
  const rg = g.createRadialGradient(p.x - rx * 0.3, p.y - ry * 0.7, rx * 0.1, p.x, p.y - ry * 0.3, rx * 1.1);
  rg.addColorStop(0, fogU('#8C9CA4', d, deep)); rg.addColorStop(1, fogU('#4E5E68', d, deep));
  g.fillStyle = rg; g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, Math.PI, 0); g.closePath(); g.fill();
}
function weedsU(g, t, deep) {
  for (const k of [...UWEED].sort((a, b) => depth(b.x, UF, b.z) - depth(a.x, UF, a.z))) {
    const d = depth(k.x, UF, k.z); if (d < 1) continue;
    const p0 = B.project(k.x, UF, k.z), sw = Math.sin(t * 1.3 + k.ph) * 0.5, p1 = B.project(k.x + sw * 0.5, UF + k.h * 0.55, k.z), p2 = B.project(k.x + sw, UF + k.h, k.z);
    g.strokeStyle = fogU(k.c, d, deep); g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.3 * p0.s);
    g.beginPath(); g.moveTo(p0.x, p0.y); g.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); g.stroke();
  }
}
function shafts(g, t, a = 1) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const x0 = -140 + i * 230 + Math.sin(t * 0.5 + i * 1.9) * 50, w0 = 70 + (i * 41) % 80;
    const lg = g.createLinearGradient(0, 0, 0, H * 0.9); lg.addColorStop(0, `rgba(225,248,255,${0.2 * a})`); lg.addColorStop(1, 'rgba(225,248,255,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x0, -10); g.lineTo(x0 + w0, -10); g.lineTo(x0 + w0 + 330, H * 0.9); g.lineTo(x0 + 250, H * 0.9); g.closePath(); g.fill();
  }
  g.restore();
}
function under(g, t, { shadow = null, deep = 0, board = true, pieces = FINAL72, focus = null } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  if (deep) { gr.addColorStop(0, '#3A9BD0'); gr.addColorStop(0.5, '#17639E'); gr.addColorStop(1, '#0B345F'); }
  else { gr.addColorStop(0, '#86E0F4'); gr.addColorStop(0.45, '#2D97CC'); gr.addColorStop(1, '#13538C'); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  surfaceSheet(g, t, shadow);
  for (let z = 48; z > -12; z -= 2) {
    const d = depth(4, UF, z + 1); if (d < 0.4) continue;
    if (B.poly(g, [[-36, UF, z], [46, UF, z], [46, UF, z + 2], [-36, UF, z + 2]])) { g.fillStyle = fogU(z % 4 === 0 ? '#E6D29A' : '#DAC68E', d, deep); g.fill(); }
  }
  for (const k of UROCK) rockU(g, k, deep);
  weedsU(g, t, deep);
  if (board) { B.drawSlab(g, { ...SEAWOOD, shadow: 0.25 }); B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof: 1.1 }); }
  shafts(g, t, deep ? 0.6 : 1);
}
// floating specks and rising bubbles around the camera; burst = [x, y, z, t0] for a cloud of bubbles
function specks(g, t, { burst = null, n = 70, cx = 4, cz = 6 } = {}) {
  const r = rng(33);
  for (let i = 0; i < n; i++) {
    const x = cx - 10 + r() * 20, z = cz - 6 + r() * 20, y = UF + ((r() * 12 + t * (0.15 + r() * 0.2)) % 12);
    if (depth(x, y, z) < 1) continue; const p = B.project(x, y, z);
    g.fillStyle = `rgba(232,246,255,${(0.25 + 0.3 * r()).toFixed(2)})`; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, 0.035 * p.s), 0, 7); g.fill();
  }
  const r2 = rng(71);
  for (let i = 0; i < 20; i++) { const x = cx - 7 + r2() * 14, z = cz - 4 + r2() * 14, sp = 0.6 + r2() * 0.8, y = UF + ((r2() * 11 + t * sp) % 11); bubble(g, x + Math.sin(t * 2 + i) * 0.08, y, z, 0.06 + r2() * 0.1); }
  if (burst) { const [bx, by, bz, t0] = burst, dt = t - t0; if (dt > 0 && dt < 1.6) { const r3 = rng(19); for (let i = 0; i < 22; i++) { const a = r3() * 6.28, v = 0.6 + r3() * 1.6; bubble(g, bx + Math.cos(a) * v * dt * 0.6, by + dt * (1.4 + r3() * 1.6) + Math.sin(a) * 0.3, bz + (r3() - 0.5) * 0.8, 0.07 + r3() * 0.13); } } }
}
function bubble(g, x, y, z, rr) {
  if (depth(x, y, z) < 1) return; const p = B.project(x, y, z), R = Math.max(3, rr * p.s);
  g.strokeStyle = 'rgba(235,250,255,0.75)'; g.lineWidth = Math.max(1.5, R * 0.14); g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.stroke();
  g.fillStyle = 'rgba(235,250,255,0.18)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(p.x - R * 0.35, p.y - R * 0.35, R * 0.22, 0, 7); g.fill();
}
// the line from the surface and the hook, with a white pawn on it as bait (Fischer's poisoned pawn)
function hookLine(g, x, z, yh, t, { a = 1, pawn = true, top = SURF, sway = 1 } = {}) {
  if (a <= 0) return;
  const hx = x + Math.sin(t * 1.3) * 0.06 * sway;
  g.save(); g.globalAlpha *= a;
  g.strokeStyle = 'rgba(244,252,255,0.8)'; g.lineWidth = 2.2; g.beginPath(); line3(g, [x, top, z], [hx, yh, z]); g.stroke();
  if (depth(hx, yh, z) > 0.6) {
    const p = B.project(hx, yh, z), k = p.s / 100;
    if (pawn) drawPiece(g, 'p', 'w', p.x - 15 * k, p.y + 70 * k, 70 * k, { rot: 0.1 + Math.sin(t * 1.7) * 0.05 });
    g.save(); g.translate(p.x, p.y); g.scale(k, k); g.lineCap = 'round';
    g.strokeStyle = '#3B444B'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 48); g.arc(-15, 48, 15, 0, Math.PI, false); g.lineTo(-30, 30); g.stroke();
    g.fillStyle = '#3B444B'; g.beginPath(); g.moveTo(-30, 28); g.lineTo(-22, 36); g.lineTo(-31, 20); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-2, 6); g.lineTo(-2, 42); g.stroke();
    g.strokeStyle = '#3B444B'; g.lineWidth = 4; g.beginPath(); g.arc(0, -5, 5, 0, 7); g.stroke();
    g.restore();
  }
  g.restore();
}
// a cartoon fish in the world (the fish he catches, the ones that flee, the Soviet school); dir 1 faces +x on screen
function star5(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function toonFish(g, x, y, z, len, t, { col = '#F0893A', belly = '#FFD9A8', dir = 1, wag = 1, star = false, rot = 0, open = 0, a = 1, scared = 0 } = {}) {
  if (depth(x, y, z) < 0.6 || a <= 0) return null;
  const p = B.project(x, y, z), L = p.s * len, sw = Math.sin(t * 9 * Math.max(0.6, wag)) * 0.28 * wag, dk = mix(col, '#000000', 0.2);
  g.save(); g.globalAlpha *= a; g.translate(p.x, p.y); g.rotate(rot); g.scale(dir * L / 200, L / 200);
  g.shadowColor = 'rgba(4,30,60,0.3)'; g.shadowBlur = 20; g.shadowOffsetY = 14;
  g.fillStyle = dk; g.save(); g.translate(-78, 0); g.rotate(sw); g.beginPath(); g.moveTo(4, 0); g.lineTo(-58, -44); g.quadraticCurveTo(-40, 0, -58, 44); g.closePath(); g.fill(); g.restore();
  const bg = g.createLinearGradient(0, -52, 0, 52); bg.addColorStop(0, dk); bg.addColorStop(0.5, col); bg.addColorStop(1, belly);
  g.fillStyle = bg; g.beginPath(); g.moveTo(100, 2); g.bezierCurveTo(92, -48, 10, -60, -82, -14); g.quadraticCurveTo(-94, 0, -82, 14); g.bezierCurveTo(10, 60, 92, 50, 100, 2); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = dk; g.beginPath(); g.moveTo(18, -48); g.quadraticCurveTo(-8, -88, -46, -40); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(24, 30); g.quadraticCurveTo(2, 58 + sw * 24, -16, 34); g.closePath(); g.fill();
  g.strokeStyle = rgba(mix(col, '#000000', 0.45), 0.55); g.lineWidth = 4; g.beginPath(); g.arc(46, 0, 30, -1.1, 1.1); g.stroke();
  const er = 13 + scared * 4;
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(70, -12, er, 0, 7); g.fill(); g.fillStyle = '#16181A'; g.beginPath(); g.arc(72 + scared * 2, -12, 7 - scared * 2, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(74, -15, 2.5, 0, 7); g.fill();
  g.strokeStyle = '#5A2A1A'; g.lineWidth = 4; g.beginPath();
  if (open > 0.05) { g.fillStyle = '#5A2320'; g.ellipse(95, 6, 7, 6 + open * 12, 0, 0, 7); g.fill(); } else { g.moveTo(98, 5); g.quadraticCurveTo(90, 11, 82, 9); g.stroke(); }
  if (star) star5(g, 8, 4, 19, '#FFD34A');
  g.restore();
  return p;
}
// a gold cup on the sand (the engine championships), rising out of the sand as u goes 0 -> 1
function trophy(g, x, z, h, u, t) {
  if (u <= 0 || depth(x, UF, z) < 0.8) return;
  const y0 = UF - (1 - ease.back(clamp(u))) * h * 1.1, s = h;
  lathe(g, x, z, [[y0, 0.36 * s, 0.36 * s], [y0 + 0.1 * s, 0.36 * s, 0.36 * s], [y0 + 0.13 * s, 0.09 * s, 0.09 * s], [y0 + 0.48 * s, 0.09 * s, 0.09 * s],
    [y0 + 0.56 * s, 0.2 * s, 0.2 * s], [y0 + 0.74 * s, 0.4 * s, 0.4 * s], [y0 + s, 0.46 * s, 0.46 * s]], GOLD, { n: 20, spec: 0.9, amb: 0.55 });
}

// ======================= ABOVE WATER: the bay of Reykjavik — Esja across it, coloured roofs on the shore =======================
const ESJA = [[-160, 0], [-130, 7], [-100, 13], [-60, 16.5], [-20, 18], [20, 18], [60, 17], [100, 15], [130, 10], [165, 4], [200, 0]];
const HOUSES = (() => { const r = rng(12), a = [], cols = ['#E2563F', '#F2C14E', '#3C8DC9', '#F4F1EA', '#5FB06A', '#C9463F', '#7A5CBF', '#F08A3A']; for (let i = 0; i < 46; i++) a.push({ x: -90 + i * 4.2 + r() * 2, w: 2.2 + r() * 1.6, h: 2 + r() * 3, c: cols[i % cols.length], roof: r() < 0.5 ? '#2E3A44' : '#B83A30' }); return a; })();
function bay(g, t, { winter = 0, sunA = 1 } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  if (winter) { gr.addColorStop(0, '#8DA4BA'); gr.addColorStop(0.5, '#C2CFDA'); gr.addColorStop(1, '#E2E8EC'); }
  else { gr.addColorStop(0, '#4FAEEB'); gr.addColorStop(0.5, '#A6DBF5'); gr.addColorStop(1, '#E6F5FB'); }
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (!winter && sunA > 0 && depth(-70, 70, 300) > 1) {
    const p = B.project(-70, 70, 300), sg = g.createRadialGradient(p.x, p.y, 8, p.x, p.y, 460);
    sg.addColorStop(0, `rgba(255,250,228,${0.98 * sunA})`); sg.addColorStop(0.07, `rgba(255,243,206,${0.85 * sunA})`); sg.addColorStop(1, 'rgba(255,243,206,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, H);
  }
  // Esja: a long flat-topped ridge, blue with distance, snow in winter
  const ez = 300, pts = ESJA.map(([x, y]) => [x, y, ez]);
  if (B.poly(g, [...pts, [200, -1, ez], [-160, -1, ez]])) {
    const eg = g.createLinearGradient(0, B.project(0, 18, ez).y, 0, B.project(0, 0, ez).y);
    eg.addColorStop(0, winter ? '#E4E9EE' : '#6F8CA6'); eg.addColorStop(1, winter ? '#A9B8C6' : '#93ACC0'); g.fillStyle = eg; g.fill();
  }
  // the town on the shore: coloured houses with dark or red roofs
  for (const hs of HOUSES) {
    const z = 150, x0 = hs.x, x1 = hs.x + hs.w;
    if (depth(x0, 0, z) < 1) continue;
    quad(g, [[x0, 0, z], [x1, 0, z], [x1, hs.h, z], [x0, hs.h, z]], mix(hs.c, winter ? '#C9D3DB' : '#A9C7DA', 0.35));
    quad(g, [[x0 - 0.2, hs.h, z], [x1 + 0.2, hs.h, z], [(x0 + x1) / 2, hs.h + 1.2, z]], mix(hs.roof, winter ? '#E8EEF2' : '#A9C7DA', winter ? 0.6 : 0.3));
  }
  // the sea: strips from the horizon in, darker and greener close by; light glints
  for (let z = 420; z > -16; z -= z > 60 ? 24 : 4) {
    const z1 = z - (z > 60 ? 24 : 4), d = depth(4, 0, (z + z1) / 2); if (d < 0.3) continue;
    const k = clamp((z - 0) / 220);
    if (B.poly(g, [[-300, 0, z1], [300, 0, z1], [300, 0, z], [-300, 0, z]])) { g.fillStyle = winter ? mix('#3E6A86', '#9FB6C6', k) : mix('#127FA6', '#7CCDE9', k); g.fill(); }
  }
  const r = rng(5);
  for (let i = 0; i < 90; i++) {
    const x = -40 + r() * 90, z = 2 + r() * 60, ph = r() * 6;
    if (depth(x, 0, z) < 1) continue; const p = B.project(x, 0, z), a = Math.max(0, Math.sin(t * 2.2 + ph)) * (winter ? 0.35 : 0.8);
    g.strokeStyle = `rgba(255,255,255,${a.toFixed(2)})`; g.lineWidth = Math.max(1.5, p.s * 0.03); g.beginPath(); g.moveTo(p.x - p.s * 0.25, p.y); g.lineTo(p.x + p.s * 0.25, p.y); g.stroke();
  }
}
// the red rowboat: a hull along x (bow at +x), white strake, a wooden thwart; drawn as convex solids
function hullV(x, z, y0, y1, hw, rot) {
  const ring = (y, k, bx) => [[-3.4, y, -hw * k], [0, y, -hw * k], [2.5, y, -hw * k * 0.72], [bx, y, 0], [2.5, y, hw * k * 0.72], [0, y, hw * k], [-3.4, y, hw * k]];
  const v = [...ring(y0, 0.62, 3.0), ...ring(y1, 1, 3.7)];
  return v.map(([a, b, c]) => { const p = rot3([a, b, c], { ry: rot }); return [x + p[0], p[1], z + p[2]]; });
}
const HULLF = [[0, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12, 13], ...[0, 1, 2, 3, 4, 5].map(i => [i, i + 1, i + 8, i + 7]), [6, 0, 7, 13]];
function boat(g, x, z, { rot = 0, rock = 0, t = 0 } = {}) {
  const r = rot + Math.sin(t * 1.4) * 0.02 * rock;
  solid(g, hullV(x, z, -0.25, 0.75, 1.25, r), HULLF, BOAT, { cols: [BOATD, '#7A4E2C', ...Array(7).fill(BOAT)], amb: 0.55 });
  solid(g, hullV(x, z, 0.75, 1.05, 1.32, r), HULLF, '#F4F1EA', { cols: ['#F4F1EA', '#8A5A34', ...Array(7).fill('#F4F1EA')], amb: 0.6 });
}
// a fishing rod from the grip to the tip, bent toward the line; the line to the end point
function rod(g, grip, tip, end, { bend = 0.4, a = 1, hands = true } = {}) {
  if (depth(...grip) < 0.6 || depth(...tip) < 0.6) return;
  const P = B.project(...grip), Q = B.project(...tip), E = depth(...end) > 0.6 ? B.project(...end) : null;
  const mx = (P.x + Q.x) / 2 + (E ? (E.x - Q.x) : 0) * 0.15 * bend, my = (P.y + Q.y) / 2 + Math.abs(Q.x - P.x) * 0.25 * bend;
  g.save(); g.globalAlpha *= a; g.lineCap = 'round';
  g.strokeStyle = '#2A1F18'; g.lineWidth = Math.max(4, P.s * 0.1); g.beginPath(); g.moveTo(P.x, P.y); g.quadraticCurveTo(mx, my, Q.x, Q.y); g.stroke();
  g.strokeStyle = '#C9A05A'; g.lineWidth = Math.max(5, P.s * 0.13); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(lerp(P.x, mx, 0.25), lerp(P.y, my, 0.25)); g.stroke();
  if (E) { g.strokeStyle = 'rgba(250,252,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Q.x, Q.y); g.quadraticCurveTo((Q.x + E.x) / 2, Math.max(Q.y, E.y) + 20, E.x, E.y); g.stroke(); }
  if (hands) { hand(g, P.x, P.y, P.s * 0.3); hand(g, lerp(P.x, mx, 0.2), lerp(P.y, my, 0.2), P.s * 0.28); }
  g.restore();
}
// water drops in the air (the splash, in slow motion when sl < 1)
function drops(g, x, y, z, t, t0, { n = 40, seed = 3, sl = 1, spread = 2.2, up = 6 } = {}) {
  const dt = (t - t0) * sl; if (dt < 0 || dt > 2.5) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, v = 0.3 + r(), px = x + Math.cos(a) * spread * v * dt, pz = z + Math.sin(a) * spread * v * dt * 0.6, py = y + (up * (0.4 + r() * 0.8)) * dt - 9.8 * dt * dt * 0.6;
    if (py < 0 || depth(px, py, pz) < 0.8) continue;
    const p = B.project(px, py, pz), R = Math.max(2, p.s * (0.05 + r() * 0.06));
    g.fillStyle = 'rgba(230,248,255,0.85)'; g.beginPath(); g.ellipse(p.x, p.y, R, R * 1.35, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(p.x - R * 0.3, p.y - R * 0.4, R * 0.3, 0, 7); g.fill();
  }
}
// drops sitting on the lens after the camera comes out of the water
function lensDrops(g, a) {
  if (a <= 0) return; const r = rng(81);
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = r() * H, R = 14 + r() * 46;
    const gr = g.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.7, 'rgba(210,240,255,0.08)'); gr.addColorStop(1, 'rgba(255,255,255,0.22)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
  }
  g.restore();
}
// the split: the air world above a wavy waterline, the water world (drawn into a buffer) below it
const WB = makeCanvas(W, H), wbx = WB.getContext('2d');
function splitWater(g, yl, t, air, water) {
  wbx.setTransform(1, 0, 0, 1, 0, 0); wbx.globalAlpha = 1; wbx.filter = 'none'; wbx.clearRect(0, 0, W, H);
  water(wbx);
  air(g);
  const wave = x => yl + Math.sin(x * 0.011 + t * 5) * 22 + Math.sin(x * 0.027 - t * 3) * 9;
  g.save(); g.beginPath(); g.moveTo(0, H + 10); for (let x = 0; x <= W; x += 18) g.lineTo(x, wave(x)); g.lineTo(W, H + 10); g.closePath(); g.clip();
  g.drawImage(WB, 0, 0); g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 7; g.beginPath(); for (let x = 0; x <= W; x += 18) x ? g.lineTo(x, wave(x)) : g.moveTo(x, wave(x)); g.stroke();
  g.strokeStyle = 'rgba(160,230,250,0.6)'; g.lineWidth = 18; g.beginPath(); for (let x = 0; x <= W; x += 18) x ? g.lineTo(x, wave(x) + 12) : g.moveTo(x, wave(x) + 12); g.stroke();
  QA.skip = true;
}

// ======================= THE HALLS, 1971-72: pale and warm; the board, the table, the players =======================
const HALL71 = { base: '#2B2722', wall: ['#E2D6BE', '#D6C9AE'], seam: '#C2B292', rail: '#A88E66', floor: ['#8A7860', '#7E6C55'], light: '#FFF4DC', lightA: 0.38, table: ['#2E6A5A', '#1E4A3E', '#245648'] };
const HALL72 = { base: '#1E1A16', wall: ['#C9B18A', '#BDA47C'], folds: true, valance: '#8E2E24', floor: ['#5A4634', '#4E3C2C'], light: '#FFE9C2', lightA: 0.42, table: ['#3C5E7E', '#27435E', '#2E4E6C'] };
const MIT77 = { base: '#1A2024', wall: ['#C7D3D6', '#BCC8CB'], seam: '#A8B6BA', floor: ['#7E8C80', '#748276'], light: '#F2FFF6', lightA: 0.35, ceilingLights: true, table: ['#B88A56', '#7A5A36', '#8E6A42'] };
const ROOM = { base: '#8E908F', wall: ['#E2E0D9', '#DCDAD3'], floor: ['#58595B', '#535456'], light: '#FFFFFF', lightA: 0.18 };
const WOOD71 = { light: '#EED9B0', dark: '#A8784A', frame: '#4A2F1B', side: '#2C1B0F', m: 0.42, th: 0.38, rc: 0.25 };
function hall(g, t, envH, { pieces, far = null, near = null, focus = null, dof = 1.2, ef = 'focus', en = 'focus', wood = WOOD71 } = {}) {
  const env = room(g, B, envH, { t });
  table(g, B, env);
  const hf = far ? seated(g, B, far, ef, t, { z: 9.3 }) : null;
  B.drawSlab(g, wood);
  if (hf) hf();
  B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof });
  if (near) { const hn = seated(g, B, near, en, t, { z: -1.4, face: 1 }); if (hn) hn(); }
  return env;
}
// the same hall seen from Black's side: White's player sits at the near edge (z -1.4) and faces the camera, so he is
// drawn before the board (rule 40: White's pieces stay on White's side)
function hallB(g, t, envH, { pieces, white, ew = 'focus', focus = null, dof = 1.2, wood = WOOD71 } = {}) {
  const env = room(g, B, envH, { t });
  table(g, B, env);
  const hw = white ? seated(g, B, white, ew, t, { z: -1.4, face: 1 }) : null;
  B.drawSlab(g, wood);
  if (hw) hw();
  B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof });
  return env;
}
// the big wall board of the match halls (and of the empty room in the photo): a dark grid, a ledge under it
function demoBoard(g, x0, x1, y0, y1, z, { pieces = null, fall = null, t = 0 } = {}) {
  quad(g, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], '#4E5254');
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5; g.beginPath();
  for (let i = 1; i < 24; i++) line3(g, [x0 + (x1 - x0) * i / 24, y0, z - 0.01], [x0 + (x1 - x0) * i / 24, y1, z - 0.01]);
  for (let j = 1; j < 10; j++) line3(g, [x0, y0 + (y1 - y0) * j / 10, z - 0.01], [x1, y0 + (y1 - y0) * j / 10, z - 0.01]);
  g.stroke(); g.restore();
  ab(g, [x0 - 0.3, y0 - 0.35, z - 0.5], [x1 + 0.3, y0 - 0.15, z], '#D9D6CE');  // the ledge
  if (pieces) {  // a position on a magnetic 8x8 in the middle of the wall board; pieces drop off it one by one (fall: [t0, gap])
    const cx = (x0 + x1) / 2, sq = (y1 - y0) * 0.1, bx0 = cx - sq * 4, by0 = y0 + (y1 - y0) * 0.1;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) quad(g, [[bx0 + i * sq, by0 + j * sq, z - 0.02], [bx0 + (i + 1) * sq, by0 + j * sq, z - 0.02], [bx0 + (i + 1) * sq, by0 + (j + 1) * sq, z - 0.02], [bx0 + i * sq, by0 + (j + 1) * sq, z - 0.02]], (i + j) % 2 ? '#B9BDBF' : '#6E7376');
    pieces.forEach((pc, k) => {
      const f = pc.sq.charCodeAt(0) - 97, rk = +pc.sq[1] - 1;
      let px = bx0 + (f + 0.5) * sq, py = by0 + (rk + 0.12) * sq, rot = 0;
      if (fall) { const tf = fall[0] + k * fall[1], dt = t - tf; if (dt > 0) { py -= 9.8 * dt * dt * 1.2; rot = dt * (k % 2 ? 4 : -4); px += (k % 3 - 1) * dt * 0.8; } if (py < FLOOR_Y + 0.1) { py = FLOOR_Y + 0.1; rot = Math.PI / 2 * (k % 2 ? 1 : -1); } }
      if (depth(px, py, z - 0.05) < 0.6) return;
      const p = B.project(px, py, z - 0.05);
      drawPiece(g, pc.t, pc.c, p.x, p.y, p.s * sq * 0.95, { rot });
    });
  }
}
function computer(g, t) {  // the MIT machine room: two cabinets with lights, a teletype with paper
  for (const [x0, x1] of [[-6.5, -3.2], [10.6, 13.9]]) {
    ab(g, [x0, FLOOR_Y, -11.9], [x1, 6.2, -9.9], '#C9CCC4', { amb: 0.6 });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const on = Math.sin(t * (3 + i) + j * 7 + x0) > 0.2, x = x0 + 0.5 + i * 0.48, y = 3.4 + j * 0.5;
      if (depth(x, y, -9.88) < 0.8) continue; const p = B.project(x, y, -9.88);
      g.fillStyle = on ? (j % 2 ? '#FF6A3D' : '#FFD34A') : '#5A5E58'; g.beginPath(); g.arc(p.x, p.y, Math.max(2, p.s * 0.09), 0, 7); g.fill();
    }
    for (const xr of [x0 + 0.9, x1 - 0.9]) { if (depth(xr, 1.2, -9.88) < 0.8) continue; const p = B.project(xr, 1.2, -9.88), R = p.s * 0.55;
      g.fillStyle = '#2A2E30'; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.fill(); g.strokeStyle = '#8A8E88'; g.lineWidth = Math.max(2, R * 0.12); g.beginPath(); g.arc(p.x, p.y, R * 0.6, t * 2, t * 2 + 4); g.stroke(); }
  }
}
// sitting on the floor against a wall (the author's photo): legs out toward +x, a paper cup in the left hand
function sitFloor(g, who, x, z, { e = 'neutral', t = 0, a = 1, alt = null, mix: m = 0, cup = true } = {}) {
  const c = CAST[who], fy = FLOOR_Y, hy = fy + 4.5;
  if (depth(x, hy, z) < 0.8 || a <= 0) return null;
  const trou = ['#A39E95', '#66625C'], sock = '#1E1E22';
  g.save(); g.globalAlpha *= a;
  footShadow(g, x + 2.4, z - 1.2, 2.6, 0.6, fy);
  // legs: from the hips (on the floor by the wall) out along the floor, the right knee raised a little
  const hipL = [x - 0.3, fy + 0.55, z - 0.4], hipR = [x + 0.5, fy + 0.55, z - 0.6];
  const kneeL = [x + 2.4, fy + 0.6, z - 2.2], ankL = [x + 4.9, fy + 0.35, z - 3.0];
  const kneeR = [x + 2.6, fy + 1.5, z - 1.0], ankR = [x + 5.6, fy + 0.35, z - 1.4];
  for (const [h, k, an] of [[hipR, kneeR, ankR], [hipL, kneeL, ankL]]) {
    limb(g, h, k, 0.62, 0.5, trou[0], trou[1]); limb(g, k, an, 0.5, 0.38, trou[0], trou[1]);
    if (depth(...an) > 0.8) { const p = B.project(an[0] + 0.25, an[1], an[2]); g.save(); g.translate(p.x, p.y); g.rotate(-0.25); g.fillStyle = sock; g.beginPath(); g.ellipse(0, 0, p.s * 0.42, p.s * 0.26, 0, 0, 7); g.fill();
      g.fillStyle = '#16120E'; g.beginPath(); g.ellipse(p.s * 0.35, -p.s * 0.05, p.s * 0.52, p.s * 0.3, -0.3, 0, 7); g.fill(); g.restore(); }
  }
  // the bust leaning back on the wall, slightly tilted; the arms down to the floor
  const p = B.project(x, hy, z), s = p.s / 100 * 1.05 * 0.86;
  g.save(); g.translate(p.x, p.y); g.rotate(-0.08); g.scale(s, s);
  g.save(); jacketClip(g);
  drawChar(g, who, { e, t });
  if (alt && m > 0) drawChar(g, alt, { e, t, alpha: m });
  g.restore();
  g.fillStyle = mix(c.suit, '#000000', 0.12);
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 120, 220); g.quadraticCurveTo(sd * 196, 380, sd * 186, 520); g.lineTo(sd * 136, 520); g.quadraticCurveTo(sd * 140, 380, sd * 100, 250); g.closePath(); g.fill(); }
  hand(g, -170, 540, 34); hand(g, 168, 548, 34);
  if (cup) { g.fillStyle = '#F4F2EE'; g.beginPath(); g.moveTo(-196, 500); g.lineTo(-146, 500); g.lineTo(-152, 572); g.lineTo(-190, 572); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 3; g.stroke(); }
  g.restore();
  g.restore();
  return p;
}
// the empty room of the photo: white walls meeting at a corner, grey carpet, the big wall board above him
function emptyRoom(g, t, { pieces = null, fall = null } = {}) {
  const env = room(g, B, ROOM, { t, lights: [] });
  demoBoard(g, -6.5, 9.5, 4.2, 11.6, 12.95, { pieces, fall, t });
  quad(g, [[12.6, 0.2, 12.95], [13.3, 0.2, 12.95], [13.3, 1.0, 12.95], [12.6, 1.0, 12.95]], '#D8D6D0');  // a wall socket and a grille
  quad(g, [[14.4, 2.2, 12.95], [15.6, 2.2, 12.95], [15.6, 3.4, 12.95], [14.4, 3.4, 12.95]], '#9A9894');
  return env;
}
// the winter harbour: a wooden pier, a lamp post, snow falling
function harbor(g, t) {
  bay(g, t, { winter: 1 });
  ab(g, [-12, 0.2, 9.5], [3.2, 0.9, 13.5], '#6E5A48', { amb: 0.6 });  // the pier deck
  for (let x = -11; x < 3; x += 2.4) ab(g, [x, -1.5, 9.4], [x + 0.4, 0.2, 9.8], '#4A3C30');
  cylinder(g, [-2, 0.9, 12.6], [-2, 7.5, 12.6], 0.12, '#2E3438');
  if (depth(-2, 7.6, 12.6) > 1) { const p = B.project(-2, 7.6, 12.6), gl = g.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.s * 2.2); gl.addColorStop(0, 'rgba(255,226,170,0.95)'); gl.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = gl; g.fillRect(p.x - p.s * 2.2, p.y - p.s * 2.2, p.s * 4.4, p.s * 4.4); }
}
function snow(g, t, { n = 140, a = 1 } = {}) {
  const r = rng(44); g.save(); g.globalAlpha *= a;
  for (let i = 0; i < n; i++) { const x = (r() * W + Math.sin(t * 0.8 + i) * 30) % W, y = (r() * H + t * (60 + r() * 90)) % H, R = 2 + r() * 5;
    g.fillStyle = `rgba(255,255,255,${(0.5 + r() * 0.5).toFixed(2)})`; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); }
  g.restore();
}
// a hand with a microphone coming in from the right edge
function mic(g, u, y, reach = 330) {
  if (u <= 0) return; const x = W + 60 - reach * ease.out(clamp(u));
  g.save(); g.translate(x, y); g.rotate(-0.12);
  g.fillStyle = '#26292C'; g.beginPath(); g.roundRect(-10, -22, 230, 44, 18); g.fill();
  g.fillStyle = '#3A3E42'; g.beginPath(); g.arc(-26, 0, 46, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-60, i * 14); g.lineTo(8, i * 14); g.stroke(); }
  g.fillStyle = SKIN2.base; g.beginPath(); g.arc(150, 6, 46, 0, 7); g.fill();
  g.fillStyle = '#2C3A4E'; g.fillRect(190, -40, 200, 96);
  g.restore();
}

// ======================= THE FILM =======================
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const bdg = (g, t, text, t0, { y = 230, color = CREAM, size = 46, sub = null } = {}) => { if (t >= t0) badge(g, text, W / 2, y, { color, size, sub, ...popIn(t, t0) }); };
  const LOGO = 'Logo: Stockfish (GPLv3) · Klein Maetschke';
  const BOATX = 4.2, BOATZ = 10;

  // ======================= HOOK: the fish itself — the strongest chess player on Earth; then a boat's shadow and a hook =======================
  const afrT = w('hook', 'afraid'), manT = w('hook', 'man');
  const fishHook = t => {
    const u = ease.out(clamp((t - 0.0) / 1.6)), v = ease.inOut(clamp((t - afrT) / 0.7));
    return { x: lerp(6.6, 4.4, u) - v * 2.6, y: 3.0 + Math.sin(t * 2.1) * 0.12 - v * 0.6, z: 5.2 + v * 1.4, rot: Math.sin(t * 1.7) * 0.04 + v * 0.18, wag: 1 + (t > afrT && t < afrT + 0.8 ? 2.2 : 0) };
  };
  const shadowAt = t => ({ x: lerp(-5, 7, ease.inOut(clamp((t - (afrT - 0.7)) / 1.8))), z: 9, a: seg(t, afrT - 0.7, afrT - 0.2) });
  const hookY = t => lerp(SURF + 1, 5.0, ease.out(clamp((t - manT + 0.25) / 0.8)));
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, 0.04, 10.2, [4.2, 3.2, 6.2])], [len(sh), K(-0.06, 0.02, 9.0, [4.2, 3.4, 6.2])]], { t, e: x => x });
    under(g, t, { shadow: shadowAt(t) });
    hookLine(g, 6.4, 7.4, hookY(t), t, { a: t > manT - 0.3 ? 1 : 0 });
    const f = fishHook(t);
    if (depth(f.x, f.y, f.z) > 1) { const p = B.project(f.x, f.y, f.z); fishPhoto(g, p.x, p.y, p.s * 4.8, t, { rot: f.rot, wag: f.wag }); }
    specks(g, t, { burst: [f.x - 1.4, f.y, f.z, afrT + 0.05] });
  });
  cue(0, 'whoosh_deep', 0.3); cue(0.1, 'reveal_bell', 0.25); cue(afrT - 0.3, 'whoosh_soft', 0.3); cue(afrT, 'heartbeat', 0.5); cue(manT, 'clack', 0.25);

  // ======================= STOCKFISH. RATED 3650: it circles over the sunken board; the shadow stays up there =======================
  const sfS = s('stockfish'), ratT = w('stockfish', 'rated');
  shot(sfS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.5, 0.12, 12, [4, 1.6, 4.4])], [len(sh), K(-0.25, 0.1, 10.5, [4, 1.7, 4.4])]], { t, e: x => x });
    under(g, t, { shadow: { x: 7, z: 9, a: 1 } });
    hookLine(g, 6.4, 7.4, 4.2, t);
    const a = (t - sfS) * 0.9 + 0.4, fx = 4 + Math.cos(a) * 3.4, fz = 4.2 + Math.sin(a) * 2.2;
    if (depth(fx, 2.3, fz) > 1) { const p = B.project(fx, 2.3, fz); fishPhoto(g, p.x, p.y, p.s * 4.6, t, { rot: -0.05, wag: 1.2 }); }
    specks(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= sfS + 0.05) plate(g, 'STOCKFISH', W / 2, 250, { color: BLUE, size: 66, ...popIn(t, sfS + 0.05) });
    if (t >= ratT) badge(g, '3650', W / 2, 372, { color: GOLD, size: 96, ...popIn(t, ratT) });
    smallCredit(g, LOGO, 470);
  } });
  cue(sfS - 0.1, 'whoosh_fast', 0.3); cue(sfS + 0.05, 'sparkle_pop', 0.3); cue(ratT, 'boom_move', 0.6);

  // ======================= 19 TITLES: cups rise out of the sand behind it =======================
  const tcS = s('tcec'), ninT = w('tcec', 'nineteen');
  const cupT = i => tcS + 0.3 + i * (ninT - tcS - 0.3) / 18;
  shot(tcS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.18, 0.05, 15, [4, 1.5, 10])], [len(sh), K(0.06, 0.04, 13.4, [4, 1.6, 10])]], { t, e: x => x });
    under(g, t, { shadow: { x: 9, z: 12, a: 0.8 }, board: false });
    for (let i = 18; i >= 0; i--) { const col = i % 7, row = Math.floor(i / 7); trophy(g, -3.8 + col * 2.1 + row * 1.05, 13 + row * 2.2, 1.6, (t - cupT(i)) / 0.35, t); }
    const fx = 4 + Math.sin(t * 0.6) * 1.2;
    if (depth(fx, 2.2, 6.5) > 1) { const p = B.project(fx, 2.2, 6.5); fishPhoto(g, p.x, p.y, p.s * 4.6, t, { rot: 0.02, wag: 1 }); }
    specks(g, t, { cz: 9 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    const n = Math.max(0, Math.min(19, Math.floor((t - cupT(0)) / ((ninT - tcS - 0.3) / 18)) + 1));
    if (t >= cupT(0)) counter(g, `${n}×`, 'TCEC CHAMPION', { y: 300, size: 150, color: GOLD, labelColor: CREAM, at: [t, cupT(0)] });
  } });
  cue(tcS - 0.1, 'whoosh_fast', 0.3); for (let i = 0; i < 19; i++) cue(cupT(i), i % 3 ? 'piece' : 'sparkle_pop', 0.18); cue(ninT, 'success', 0.35);

  // ======================= HIKARU GOT A FREE PAWN — AND STILL LOST: underwater, holding his breath =======================
  const hiS = s('hikaru'), pawnT = w('hikaru', 'pawn'), beatT = w('hikaru', 'beat');
  shot(hiS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.22, 0.04, 12.5, [3.8, 2.9, 7])], [len(sh), K(0.14, 0.03, 11.2, [3.8, 3.0, 7])]], { t, e: x => x });
    under(g, t, { shadow: { x: 4, z: 14, a: 0.7 }, board: false });
    const e = exprAt([[0, { ...EXPR.focus, look: [-0.6, 0.1] }], [pawnT + 0.4, SMUG], [beatT, { ...EXPR.shock, sweat: 0 }]], t);
    actor(g, B, 'hikaru14', { x: 5.6, y: 3.0, z: 8.6, e, t, face: -1 });
    const fp = B.project(1.2, 2.8, 6.2); if (depth(1.2, 2.8, 6.2) > 1) fishPhoto(g, fp.x, fp.y, fp.s * 4.2, t, { flip: true, wag: 1 });  // turned to face him
    const u = ease.inOut(clamp((t - pawnT + 0.2) / 0.9)), px = lerp(2.6, 4.7, u), py = 1.6 + Math.sin(u * Math.PI) * 0.8, pz = lerp(6.4, 7.6, u);
    if (t > pawnT - 0.2 && depth(px, py, pz) > 1) { const p = B.project(px, py, pz); drawPiece(g, 'p', 'b', p.x, p.y + p.s * 0.5, p.s * 1.3, { rot: Math.sin(t * 3) * 0.3 }); }
    specks(g, t, { burst: [5.4, 4.0, 8.4, beatT], cz: 8 });
    if (t > beatT) for (let i = 0; i < 5; i++) bubble(g, 5.4 + Math.sin(i * 2) * 0.3, 3.8 + (t - beatT) * (1.6 + i * 0.4), 8.4, 0.16 + i * 0.03);
  }, { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'Hikaru vs Stockfish', '2014', { y: 200, t0: 0.1 });
    if (t >= pawnT) badge(g, '+1 PAWN', W / 2, 330, { color: GOLD, size: 54, ...popIn(t, pawnT) });
    if (t >= beatT) stamp(g, 'STOCKFISH WINS', W / 2, 1540, lt, beatT - hiS + 0.05, { color: RED, size: 74 });
  } });
  cue(hiS - 0.1, 'whoosh_fast', 0.3); cue(pawnT, 'sparkle_pop', 0.3); cue(beatT, 'stamp', 0.6); cue(beatT + 0.1, 'gasp', 0.25);

  // ======================= AND STILL, IT HID: behind a rock, looking up; another fish swims to the pawn =======================
  const seS = s('secret'), hidT = w('secret', 'hid'), deadT = w('secret', 'dead');
  const nmS = s('name'), YANK = w('name', 'bobby'), BITE = YANK - 0.18;
  const bigFish = t => {  // the fish that takes the bait: in from the left, to the pawn, then yanked up
    const u = ease.inOut(clamp((t - (deadT - 0.4)) / (BITE - deadT + 0.4))), v = clamp((t - YANK) / 0.28);
    return { x: lerp(-2.5, 5.9, u), y: lerp(2.2, 3.85, u) + v * v * 9, z: 7.4, rot: -v * 1.2, open: t > BITE - 0.3 && t < BITE ? 1 : 0, wag: 1 + (t > BITE ? 2 : 0) };
  };
  shot(seS - 0.05, (g, lt, t, sh) => {
    const k1 = hidT - seS + 0.05;
    rig(B, lt, [[0, K(-0.35, 0.02, 11, [8.4, 1.6, 8.4])], [k1 + 0.6, K(-0.28, -0.12, 9.5, [7.8, 2.6, 8.2])], [len(sh), K(-0.1, -0.2, 9.6, [5.6, 3.8, 7.4])]], { t });
    under(g, t, { shadow: { x: 6, z: 7.4, a: 1 }, board: false });
    hookLine(g, 6.4, 7.4, 4.2, t);
    const u = ease.inOut(clamp((t - hidT + 0.3) / 0.8)), fx = lerp(7.2, 10.8, u), fy = lerp(2.2, 1.0, u), fz = lerp(6, 9.6, u);
    if (depth(fx, fy, fz) > 1) { const p = B.project(fx, fy, fz); fishPhoto(g, p.x, p.y, p.s * 4.4, t, { rot: lerp(0, -0.35, u), wag: 1 + u }); }
    rockU(g, { x: 10.6, z: 8.0, r: 1.6 }, 0);
    const bf = bigFish(t); toonFish(g, bf.x, bf.y, bf.z, 3.2, t, { col: '#F0893A', dir: 1, rot: bf.rot, open: bf.open, wag: bf.wag });
    specks(g, t, { cz: 8 });
  }, { trans: 'whip' });
  cue(seS - 0.1, 'whoosh_fast', 0.25); cue(hidT, 'whoosh_soft', 0.3); cue(deadT, 'heartbeat', 0.55);

  // ======================= BOBBY FISCHER: the bite, the yank, up through the surface with the fish =======================
  const SPL = YANK + 0.3, AIR = YANK + 0.58, fishT = w('name', 'fisherman'), gerT = w('name', 'german');
  shot(nmS - 0.05, (g, lt, t, sh) => {  // under water: the bite, and the camera whips up after the fish
    const ky = YANK - (nmS - 0.05);
    rig(B, lt, [[0, K(-0.1, -0.2, 9.6, [5.6, 3.8, 7.4])], [ky, K(-0.08, -0.22, 8.2, [5.9, 4.0, 7.4])], [ky + 0.3, K(-0.06, -0.85, 7.2, [5.9, 9.5, 7.4]), ease.in]], { t });
    under(g, t, { shadow: { x: 6, z: 7.4, a: 1 }, board: false });
    const bf = bigFish(t);
    hookLine(g, 6.4, 7.4, Math.min(SURF - 0.4, 4.2 + Math.max(0, bf.y - 3.85)), t, { pawn: t < BITE, sway: t < YANK ? 1 : 0 });
    toonFish(g, bf.x, bf.y, bf.z, 3.2, t, { col: '#F0893A', dir: 1, rot: bf.rot, open: bf.open, wag: bf.wag, scared: t > YANK ? 1 : 0 });
    specks(g, t, { burst: [5.9, 3.9, 7.4, YANK] });
  });
  // through the surface: the waterline sweeps down the frame
  const flyAt = t => {  // the fish in the air, in slow motion: up out of the water, over to his hands
    const sl = t < AIR + 0.9 ? 0.32 : 1, tt = (Math.min(t, AIR + 0.9) - SPL) * 0.32 + Math.max(0, t - AIR - 0.9);
    const u = clamp(tt / 0.9), hang = Math.max(0, t - AIR - 0.9);
    return { x: lerp(5.6, 7.1, u), y: 0.4 + Math.sin(u * Math.PI * 0.8) * 5.4 + u * 0.6 - Math.sin(hang * 6) * 0.1 * Math.exp(-hang), z: lerp(6.2, 8.8, u), rot: lerp(-1.2, -1.45, u) + Math.sin(t * 7) * 0.15 * u, sl };
  };
  const boatShot = (g, lt, t, { k0, k1, splash = true, hud = false }) => {
    rig(B, lt, [[0, k0], [k1.t, k1.k]], { t });
    bay(g, t);
    const e = exprAt([[0, { ...EXPR.focus, look: [0.2, 0.7], lid: 0.12 }], [AIR + 0.7, SMUG]], t);
    actor(g, B, 'fischer72', { x: BOATX - 0.4, y: 4.7, z: BOATZ + 0.2, e, t, face: -1 });
    boat(g, BOATX, BOATZ, { rock: 1, t });
    const f = flyAt(t);
    rod(g, [BOATX + 0.6, 2.6, BOATZ - 0.6], [BOATX + 3.2, 6.8, BOATZ - 1.2], [f.x, f.y + 0.6, f.z], { bend: t < AIR + 0.9 ? 0.9 : 0.3 });
    toonFish(g, f.x, f.y, f.z, 3.0, t * f.sl + (1 - f.sl) * AIR, { col: '#F0893A', dir: 1, rot: f.rot, wag: 1.6, scared: 1 });
    if (splash) drops(g, 5.4, 0.3, 6.2, t, SPL, { n: 46, sl: t < AIR + 0.9 ? 0.32 : 1, up: 7 });
  };
  shot(SPL, (g, lt, t, sh) => {
    const u = clamp((t - SPL) / (AIR - SPL)), yl = lerp(-80, H + 120, ease.inOut(u));
    splitWater(g, yl, t,
      ga => boatShot(ga, lt, t, { k0: K(-0.22, -0.12, 13, [4.6, 3.6, 9.4]), k1: { t: len(sh), k: K(-0.2, -0.1, 12.4, [4.6, 3.8, 9.4]) } }),
      gw => { rig(B, lt, [[0, K(-0.06, -0.9, 6.6, [5.6, 8.4, 7.2])], [len(sh), K(-0.06, -0.95, 5.8, [5.6, 9.0, 7.2])]], { t });
        under(gw, t, { board: false }); toonFish(gw, 5.6, 8.6, 7.2, 3.0, t, { col: '#F0893A', rot: -1.2, wag: 2, scared: 1 }); specks(gw, t, { burst: [5.6, 8.2, 7.2, SPL - 0.2] }); });
  });
  shot(AIR, (g, lt, t, sh) => {  // in the air, slow motion: the fish over the water, Fischer reels it in
    boatShot(g, lt, t, { k0: K(-0.2, -0.1, 12.4, [4.6, 3.8, 9.4]), k1: { t: len(sh), k: K(-0.12, -0.08, 10.6, [4.4, 4.2, 9.6]) } });
    lensDrops(g, 1 - clamp((t - AIR) / 1.6));
  });
  // the title: a clean frame of the fisherman, rod in hand
  shot(fishT - 0.12, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.1, -0.13, 7.4, [3.9, 4.4, 10.2], { cy: H * 0.56 })], [len(sh), K(-0.06, -0.13, 6.9, [3.9, 4.45, 10.2], { cy: H * 0.56 })]], { t, e: x => x });
    bay(g, t);
    actor(g, B, 'fischer72', { x: BOATX - 0.4, y: 4.7, z: BOATZ + 0.2, e: SMUG, t, face: -1 });
    rod(g, [BOATX + 0.4, 0.6, BOATZ - 0.7], [BOATX + 4.2, 7.6, BOATZ - 1.4], [BOATX + 6, 0, BOATZ - 3], { bend: 0.25, hands: false });
    boat(g, BOATX, BOATZ, { rock: 1, t });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    plate(g, 'BOBBY FISCHER', W / 2, 236, { color: CREAM, size: 50, ...popIn(t, fishT - 0.05) });
    plate(g, 'THE FISHERMAN', W / 2, 346, { color: GOLD, size: 78, ...popIn(t, fishT + 0.08) });
  } });
  cue(nmS - 0.1, 'whoosh_soft', 0.2); cue(BITE, 'clack', 0.35); cue(YANK - 0.3, 'revswell', 0.7); cue(YANK, 'whoosh_fast', 0.55); cue(SPL, 'boom_cine', 0.55);
  cue(SPL + 0.02, 'splat', 0.5); cue(AIR + 0.9, 'ratchet', 0.4); cue(fishT - 0.12, 'boom_big', 0.6); cue(fishT, 'reveal_bell', 0.4);

  // ======================= NO BIG FISH WAS SAFE: the hook drops among them; they scatter =======================
  const saS = s('safe'), safeT = w('safe', 'safe');
  const flee = [[1.6, 2.0, 7, '#4FA3D9', 0.2], [6.8, 3.4, 8, '#E2563F', 1.1], [3, 4.4, 10, '#F2C14E', 2.3], [6, 1.6, 6.5, '#7A5CBF', 3.1], [0.4, 3.6, 10.5, '#5FB06A', 4.0], [8.4, 2.4, 10.5, '#F0893A', 4.8]];
  shot(saS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, -0.05, 13, [4, 2.6, 8])], [len(sh), K(0.0, -0.08, 11.6, [4, 2.8, 8])]], { t, e: x => x, bump: t > safeT && t < safeT + 0.25 ? 1 : 0 });
    under(g, t, { shadow: { x: 4, z: 9, a: 1 }, board: false });
    const hy = lerp(SURF + 1, 3.0, ease.out(clamp((t - saS) / 0.6)));
    hookLine(g, 4.2, 8.4, hy, t);
    flee.forEach(([x, y, z, col, ph]) => { const u = ease.in(clamp((t - saS - 0.55 - ph * 0.12) / 1.5)), dir = x < 4.2 ? -1 : 1;
      toonFish(g, x + dir * u * 9, y + Math.sin(ph + t * 3) * 0.2, z + u * 3, 2.6, t, { col, dir, wag: 1 + u * 2.5, scared: u > 0 ? 1 : 0, rot: dir * -0.1 * u }); });
    specks(g, t, { cz: 9, burst: [4.2, 3, 8.4, saS + 0.6] });
  }, { trans: 'whip' });
  cue(saS - 0.1, 'whoosh_fast', 0.3); cue(saS + 0.35, 'whoosh_soft', 0.35); cue(safeT, 'thud', 0.4);

  // ======================= THEN THE SOVIETS: the deep, a school of big red fish with yellow stars =======================
  const stS = s('streak'), heT = w('streak', 'he'), twT = w('streak', 'twenty'), rowT = w('streak', 'row');
  const reds = (() => { const r = rng(8), a = []; for (let i = 0; i < 9; i++) a.push({ x: -2 + r() * 12, y: 1.6 + r() * 5, z: 6 + r() * 10, ph: r() * 6, len: 2.6 + r() * 1.4 }); return a; })();
  shot(stS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, -0.08, 15, [4, 3.6, 10])], [len(sh), K(0.18, -0.1, 13.5, [4, 3.8, 10])]], { t, e: x => x });
    under(g, t, { deep: 1, board: false });
    for (const f of [...reds].sort((a, b) => depth(b.x, b.y, b.z) - depth(a.x, a.y, a.z))) {
      const x = f.x + Math.sin(t * 0.5 + f.ph) * 2.2, dir = Math.cos(t * 0.5 + f.ph) > 0 ? 1 : -1;
      toonFish(g, x, f.y + Math.sin(t * 1.3 + f.ph) * 0.2, f.z, f.len, t, { col: SOVIET, belly: '#F2A28C', dir, star: true, wag: 0.8 });
    }
    specks(g, t, { cz: 10 });
  }, { trans: 'whip', hud: (g, lt, t) => { plate(g, 'USSR', W / 2, 236, { color: SOVIET, size: 70, ...popIn(t, stS + 0.05) }); bdg(g, t, 'WORLD CHAMPIONS SINCE 1948', stS + 0.35, { y: 340, color: CREAM, size: 40 }); } });
  cue(stS - 0.1, 'whoosh_deep', 0.35); cue(stS + 0.05, 'sparkle_pop', 0.3);
  // twenty in a row: black kings land in his boat one after another, the counter climbs
  const kingT = i => heT + 0.3 + i * (rowT - heT - 0.1) / 20;
  shot(heT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.2, 12.5, [4.4, 3.0, 9.8])], [len(sh), K(-0.04, 0.18, 11.4, [4.4, 3.2, 9.8])]], { t, e: x => x });
    bay(g, t);
    actor(g, B, 'fischer72', { x: BOATX - 1.4, y: 4.7, z: BOATZ + 0.4, e: SMUG, t, face: -1 });
    boat(g, BOATX, BOATZ, { rock: 1, t });
    for (let i = 0; i < 20; i++) {
      const dt = t - kingT(i); if (dt < 0) continue;
      const u = clamp(dt / 0.35), tx = BOATX + 0.2 + (i % 5) * 0.55, tz = BOATZ - 0.7 + Math.floor(i / 5) * 0.42, ty = 1.05 + (u < 1 ? (1 - u) * 6 : 0);
      if (depth(tx, ty, tz) < 1) continue; const p = B.project(tx, ty, tz);
      drawPiece(g, 'k', 'b', p.x, p.y, p.s * 1.1, { rot: u < 1 ? (1 - u) * 2 : (i % 2 ? 0.08 : -0.06) });
    }
  }, { trans: 'whip', hud: (g, lt, t) => {
    const n = Math.max(0, Math.min(20, Math.floor((t - kingT(0)) / ((rowT - heT - 0.1) / 20)) + 1));
    if (t >= kingT(0)) counter(g, String(n), n >= 20 ? 'WINS IN A ROW' : 'WINS', { y: 300, size: 160, color: CREAM, labelColor: GOLD, at: [t, kingT(0)] });
  } });
  cue(heT - 0.1, 'whoosh_fast', 0.3); for (let i = 0; i < 20; i++) cue(kingT(i) + 0.3, i % 2 ? 'piece' : 'move', 0.2); cue(rowT + 0.2, 'success', 0.4);

  // ======================= TAIMANOV 6-0; HIS SALARY TAKEN; LARSEN 6-0 =======================
  const sxS = s('sixzero'), hisT = w('sixzero', 'his'), salT = w('sixzero', 'salary'), larT = w('sixzero', 'larsen'), lar0 = w('sixzero', -1);
  const lastMoves = (G, n, t0, step) => t => { const i = clamp(Math.floor((t - t0) / step), 0, n); return piecesAt(G, G.length - 1 - n + i); };
  const tPieces = lastMoves(GT, 4, sxS + 0.2, 0.42), lPieces = lastMoves(GL, 4, larT + 0.1, 0.32);
  shot(sxS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(Math.PI + 0.32, 0.42, 15.5, [4, 1.8, 2.4])], [len(sh), K(Math.PI + 0.24, 0.4, 14.2, [4, 1.9, 2.2])]], { t, e: x => x });
    hallB(g, t, HALL71, { pieces: tPieces(t), white: 'taimanov', ew: exprAt([[0, STARE], [sxS + 1.4, { ...EXPR.worried, sweat: 0, look: [0, 0.6] }]], t) });
  }, { trans: 'whip', hud: (g, lt, t) => { placeStamp(g, lt, 'Vancouver', '1971', { y: 150, t0: 0.1 }); scoreboard(g, 'TAIMANOV', 'FISCHER', 0, 6, { y: 300, hiR: true }); } });
  cue(sxS - 0.1, 'whoosh_fast', 0.3); for (let i = 0; i < 4; i++) cue(sxS + 0.2 + (i + 1) * 0.42, 'move', 0.3); cue(sxS + 0.3, 'boom_move', 0.5);
  shot(hisT - 0.05, (g, lt, t, sh) => {  // the salary: an envelope on his desk, struck through
    rig(B, lt, [[0, K(Math.PI + 0.3, 0.6, 12, [4, 1.4, 2.0])], [len(sh), K(Math.PI + 0.26, 0.58, 11.2, [4, 1.5, 1.9])]], { t, e: x => x });
    hallB(g, t, HALL71, { pieces: tPieces(t + 9), white: 'taimanov', ew: EXPR.sad });
  }, { trans: 'whip', hud: (g, lt, t) => {
    g.save(); g.translate(W / 2, 1010); g.rotate(-0.06);
    g.fillStyle = '#EFE6CF'; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.beginPath(); g.roundRect(-330, -190, 660, 380, 18); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = '#C9B98E'; g.lineWidth = 4; g.beginPath(); g.moveTo(-330, -190); g.lineTo(0, 30); g.lineTo(330, -190); g.stroke();
    g.fillStyle = '#3A2E22'; g.font = sans(54, 900); g.textAlign = 'center'; g.fillText('SALARY', 0, 110); g.font = sans(30, 800); g.fillText('M. TAIMANOV · 1971', 0, 156);
    g.restore();
    if (t >= salT) stamp(g, 'CANCELLED', W / 2, 1020, lt, salT - hisT + 0.05, { color: RED, size: 96 });
  } });
  cue(hisT - 0.1, 'whoosh_fast', 0.3); cue(hisT + 0.1, 'paper', 0.4); cue(salT, 'stamp', 0.6);
  shot(larT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(Math.PI - 0.3, 0.42, 15.5, [4, 1.8, 2.4])], [len(sh), K(Math.PI - 0.22, 0.4, 14.2, [4, 1.9, 2.2])]], { t, e: x => x });
    hallB(g, t, { ...HALL71, wall: ['#D8DCC8', '#CDD2BC'], table: ['#7A3A2E', '#542820', '#64302A'] }, { pieces: lPieces(t), white: 'larsen', ew: exprAt([[0, STARE], [lar0, { ...EXPR.worried, sweat: 0, look: [0, 0.6] }]], t) });
  }, { trans: 'whip', hud: (g, lt, t) => { placeStamp(g, lt, 'Denver', '1971', { y: 150, t0: 0.1 }); scoreboard(g, 'LARSEN', 'FISCHER', 0, 6, { y: 300, hiR: true }); } });
  cue(larT - 0.1, 'whoosh_fast', 0.3); for (let i = 0; i < 4; i++) cue(larT + 0.1 + (i + 1) * 0.32, 'move', 0.3); cue(lar0, 'boom_move', 0.55);

  // ======================= REYKJAVIK 1972, GAME 6: Spassky stands and applauds =======================
  const spS = s('spassky'), gameT = w('spassky', 'game'), appT = w('spassky', 'applauded');
  shot(spS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(1.42, 0.2, 22, [4, 2.9, 3.95])], [len(sh), K(1.38, 0.19, 20.5, [4, 3.1, 3.95])]], { t, e: x => x });
    const env = room(g, B, HALL72, { t });
    demoBoard(g, -2, 10, 6.8, 12.4, 12.9, { pieces: FINAL72 });
    table(g, B, env);
    const stand = ease.inOut(clamp((t - gameT) / 0.6));
    const hs = seated(g, B, 'spassky72', exprAt([[0, STARE], [gameT, { ...EXPR.happy, blush: 0, curve: 0.5, open: 0 }]], t), t, { z: 9.3, lift: 3.1 + stand * 1.8 });
    const hf = seated(g, B, 'fischer72', STARE, t, { z: -1.4, face: 1 });
    B.drawSlab(g, WOOD71); if (hs) hs(); if (hf) hf();
    B.drawPieces(g, FINAL72, { focus: B.dist, dof: 1.2 });
    if (t > appT - 0.4) {  // the clapping hands in front of his chest
      const p = B.project(4, 3.1 + stand * 1.8 - 2.4, 9.0), cl = Math.abs(Math.sin((t - appT) * 14)), sc = p.s * 0.3;
      g.save(); hand(g, p.x - sc * (0.3 + cl * 0.9), p.y, sc); hand(g, p.x + sc * (0.3 + cl * 0.9), p.y, sc); g.restore();
    }
  }, { trans: 'whip', hud: (g, lt, t) => { placeStamp(g, lt, 'Reykjavik', '1972 · GAME 6', { y: 150, t0: 0.1 }); } });
  cue(spS - 0.1, 'whoosh_fast', 0.3); cue(gameT, 'fabric', 0.35); cue(appT - 0.2, 'applause', 0.6); cue(appT, 'reveal_bell', 0.3);

  // ======================= 1977, MIT: the computer; three games, three wins (21.Qh6#) =======================
  const coS = s('computer'), compT = w('computer', 'computer'), threeT = w('computer', 'three'), winsT = w('computer', 'wins');
  const cPieces = lastMoves(GC, 4, compT, 0.42);
  shot(coS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(Math.PI - 0.38, 0.34, 17, [4, 2.2, 1.6])], [len(sh), K(Math.PI - 0.28, 0.32, 15.2, [4, 2.4, 1.4])]], { t, e: x => x });
    const env = room(g, B, MIT77, { t });
    computer(g, t);
    table(g, B, env);
    const hn = seated(g, B, 'fischer72', exprAt([[0, STARE], [winsT, SMUG]], t), t, { z: -1.4, face: 1 });
    B.drawSlab(g, WOOD71); if (hn) hn();
    B.drawPieces(g, cPieces(t), { focus: B.dist, dof: 1.2 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'MIT · Cambridge', '1977', { y: 150, t0: 0.1 });
    for (let i = 0; i < 3; i++) { const t0 = threeT + 0.15 + i * 0.28; if (t >= t0) badge(g, '1–0', W / 2 - 260 + i * 260, 330, { color: GOLD, size: 64, ...popIn(t, t0) }); }
    if (t >= winsT) bdg(g, t, 'CHECKMATE', winsT, { y: 440, color: RED, size: 50 });
  } });
  cue(coS - 0.1, 'whoosh_fast', 0.3); cue(coS + 0.1, 'typewriter', 0.3); for (let i = 0; i < 4; i++) cue(compT + (i + 1) * 0.42, 'move', 0.3);
  for (let i = 0; i < 3; i++) cue(threeT + 0.15 + i * 0.28, 'sparkle_pop', 0.3); cue(winsT, 'boom_move', 0.6);

  // ======================= NEAR THE END: the empty room of the photo; he grows old against the wall =======================
  const asS = s('asked'), endT = w('asked', 'end'), askT = w('asked', 'asked');
  const htS = s('hate'), hateT = w('hate', 'hate'), veryT = w('hate', 'very');
  const age = t => ease.inOut(clamp((t - askT - 0.15) / 1.1));
  shot(asS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.1, 0.16, 15.5, [3.6, 1.9, 11.4])], [len(sh), K(-0.08, 0.14, 12.8, [3.0, 1.7, 11.4])]], { t, e: x => x });
    emptyRoom(g, t, { pieces: FINAL72 });
    sitFloor(g, 'fischerShirt', 1.2, 11.6, { e: exprAt([[0, { ...TIRED, look: [0.6, 0.1] }], [askT, { ...TIRED, look: [0.9, 0] }]], t), t, alt: 'fischerOld', mix: age(t) });
  }, { trans: 'fade', hud: (g, lt, t) => mic(g, (t - askT + 0.2) / 0.6, 980) });
  cue(asS - 0.1, 'whoosh_soft', 0.25); cue(endT, 'shimmer', 0.25); cue(askT, 'fabric', 0.3);
  shot(htS - 0.05, (g, lt, t, sh) => {  // the quote: close on the old man; the pieces drop off the wall board one by one
    rig(B, lt, [[0, K(-0.08, 0.04, 7.4, [1.3, 2.9, 11.4], { cy: H * 0.3 })], [len(sh), K(-0.06, 0.04, 6.4, [1.3, 3.0, 11.4], { cy: H * 0.3 })]], { t, e: x => x });
    emptyRoom(g, t, { pieces: FINAL72, fall: [hateT, 0.07] });
    sitFloor(g, 'fischerOld', 1.2, 11.6, { e: exprAt([[0, { ...TIRED, look: [0.7, 0.05] }], [hateT, { ...EXPR.sad, look: [0, 0.4], lid: 0.55 }], [veryT + 0.3, EXPR.blind]], t), t });
  }, { hud: (g, lt, t) => mic(g, 1 - clamp((t - veryT - 0.2) / 0.6), 1080, 300) });
  for (let i = 0; i < FINAL72.length; i++) if (i % 2 === 0) cue(hateT + i * 0.07 + 0.35, 'piece', 0.14);

  // ======================= HE DIED IN JANUARY 2008: the winter harbour, the boat empty at the pier =======================
  const diS = s('died');
  shot(diS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.14, 14, [3.6, 1.8, 9.6])], [len(sh), K(0.08, 0.12, 12.6, [3.6, 2.0, 9.6])]], { t, e: x => x });
    harbor(g, t);
    boat(g, 4, 8, { rock: 0.4, t, rot: 0.05 });
    rod(g, [3.4, 1.0, 8.4], [5.4, 4.6, 9.4], [5.4, 4.6, 9.4], { bend: 0, hands: false });
    snow(g, t);
  }, { trans: 'fade', grade: 'neutral', hud: (g, lt, t) => placeStamp(g, lt, 'Reykjavik', '17 JANUARY 2008', { y: 150, t0: 0.2 }) });
  cue(diS, 'wind', 0.35);

  // ======================= THE SAME YEAR, THE FISH DARED TO SURFACE: no shadow up there now =======================
  const suS = s('surface'), darT = w('surface', 'dared'), surfT = w('surface', 'surface');
  shot(suS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, -0.06, 10.2, [4.2, 2.6, 6.2])], [len(sh), K(0.0, -0.2, 9.4, [4.2, 3.6, 6.2])]], { t, e: x => x });
    under(g, t);
    const u = ease.inOut(clamp((t - suS) / (surfT - suS + 0.4)));
    const fx = lerp(5.0, 4.4, u), fy = lerp(-0.2, 5.6, u), fz = 6.2;
    if (depth(fx, fy, fz) > 1) { const p = B.project(fx, fy, fz); fishPhoto(g, p.x, p.y, p.s * 4.8, t, { rot: lerp(-0.5, -0.15, u), wag: 1 }); }
    specks(g, t);
  }, { trans: 'fade', hud: (g, lt, t) => { if (t >= darT) bdg(g, t, 'NOV 2008 · STOCKFISH 1.0', darT, { y: 240, color: GOLD, size: 48 }); smallCredit(g, LOGO, 1620); } });
  cue(suS, 'whoosh_deep', 0.3); cue(darT, 'reveal_bell', 0.35);

  // ======================= CTA: the hook frame again — 3650, 2785, and you? =======================
  const ctS = s('cta'), fiT = w('cta', 'fischer'), yoT = w('cta', 'yours');
  shot(ctS - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.05, -0.06, 10.2, [4.2, 2.6, 6.2])], [len(sh), K(-0.04, -0.08, 9.4, [4.2, 2.8, 6.2])]], { t, e: x => x });
    under(g, t);
    const fx = 4.6 + Math.sin(t * 0.5) * 0.4;
    if (depth(fx, 2.2, 5.2) > 1) { const p = B.project(fx, 2.2, 5.2); fishPhoto(g, p.x, p.y, p.s * 4.8, t, { rot: Math.sin(t * 1.7) * 0.04, wag: 1 }); }
    specks(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => {
    bdg(g, t, 'STOCKFISH 3650', ctS + 0.05, { y: 230, color: BLUE, size: 54 });
    bdg(g, t, 'FISCHER 2785', fiT, { y: 330, color: GOLD, size: 54 });
    bdg(g, t, 'YOU ?', yoT, { y: 430, color: CREAM, size: 60 });
    bdg(g, t, 'COMMENT YOUR RATING', yoT + 0.3, { y: 1560, color: TEAL, size: 42 });
    bdg(g, t, 'FOLLOW ' + CHANNEL, yoT + 0.7, { y: 1660, color: CREAM, size: 36 });
  } });
  cue(ctS - 0.1, 'whoosh_fast', 0.3); cue(ctS + 0.05, 'sparkle_pop', 0.3); cue(fiT, 'sparkle_pop', 0.3); cue(yoT, 'reveal_bell', 0.35); cue(yoT + 0.7, 'sparkle_pop', 0.22);

  const music = [
    { t: 0, m: 'hook' }, { t: sfS - 0.05, m: 'intrigue' }, { t: seS - 0.05, m: 'tension' }, { t: YANK, m: 'slam' }, { t: fishT - 0.12, m: 'glory' },
    { t: saS - 0.05, m: 'build' }, { t: stS - 0.05, m: 'coldwar' }, { t: sxS - 0.05, m: 'build' }, { t: spS - 0.05, m: 'victory' },
    { t: coS - 0.05, m: 'digital' }, { t: asS - 0.05, m: 'elegy' }, { t: diS - 0.05, m: 'void' }, { t: suS - 0.05, m: 'norse' },
    { t: ctS - 0.05, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: YANK - 0.3, t1: YANK - 0.01, kind: 'mute' }, { t0: YANK, t1: YANK + 1.2, kind: 'boost', db: 4 },
    { t0: fishT - 0.4, t1: fishT - 0.13, kind: 'mute' },
    { t0: htS - 0.2, t1: s('died') - 0.1, kind: 'mute' },
    { t0: ctS, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
