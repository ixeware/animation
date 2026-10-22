// The king toss. 4 October 2025, "Checkmate: USA vs India" in an esports stadium in Arlington, Texas: Hikaru Nakamura
// mates the reigning world champion Gukesh D in the bullet decider (55...Kf8?? 56.Qd8#) and throws Gukesh's king into
// the crowd. FIDE's CEO calls it "rather distasteful"; Levy Rozman says the winner was meant to throw the king; Hikaru
// says he was always going to. Three weeks later in Saint Louis Gukesh beats him (46...Qxf2), shakes hands and puts
// every piece back. Sources, and what is drawn rather than documented: SOURCES.md.
// Rules 42–45 (reference/rausis_v2.md): the payoff is the first frame (the king in the air over the stands); every
// phrase is a 3D set the camera moves through (the arena: stands full of fans, an LED wall, a jumbotron, a lighting
// truss, the stage table with an LCD clock; a dotted map of the US; a phone in the dark whose screen is the next scene;
// a VHS rewind; the Saint Louis club; a wall of phones); cuts go through objects and screens; the arena of the hook
// comes back at the end, empty, with the king lying on a seat.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash, smooth } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, sans, serif, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, room, table, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE, SKIN2 } from '../../engine/js/look.js';
import { bokeh, lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver, playRun } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { DotMap } from '../../engine/js/map.js';
import { HI, ledGlow, flashTint, speedLines, boardArrow, pieceRing, squareFrame, moveTag, spread, ticks } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream, LIME = C.lime, PHONE = '#9FD8FF';
const USA = '#22335E', USA_D = '#16223F', IND = '#D9822B', IND_D = '#B0651C';
// the decisive bullet game in Arlington (ply 111 = 56.Qd8#) and the first rapid game in Saint Louis (ply 92 = 46...Qxf2)
const G = await fetch('../engine/data/nakamura_gukesh_2025.json').then(r => r.json());
const G2 = await fetch('../engine/data/nakamura_gukesh_stl2025.json').then(r => r.json());
const PH = {
  hikaru: await loadPhoto3d('../episodes/hikaru/photos/hikaru2026'),
  gukesh: await loadPhoto3d('../episodes/hikaru/photos/gukesh2025'),
  levy: await loadPhoto3d('../episodes/hikaru/photos/levy_closeup'),
};
const CREDITS = {
  hikaru: 'Photo: Kelly Centrelli / Charlotte Chess Center, CC BY 4.0',
  gukesh: 'Photo: Frans Peeters, CC BY-SA 2.0',
  levy: 'Photo: Piaras Ó Mídheach / Sportsfile, CC BY 2.0',
};
const MAP = await new DotMap().init();

// ---------- cast: Hikaru in a navy USA shirt (in Saint Louis his usual grey hoodie), Gukesh after the 2025 photo
// (slim face, black hair swept up, a saffron INDIA shirt; in Saint Louis a dark jacket over an open shirt); the fans
// are generic people of both teams ----------
const BROWN = { base: '#B57A52', shade: '#9C6542', deep: '#7A4B30', blush: '#B8685A', hi: '#CC9572' };
const BROWN2 = { base: '#A06A45', shade: '#8A5A38', deep: '#6A4028', blush: '#A85A4E', hi: '#BC8460' };
CAST.hik = { ...CAST.hikaru, shirt: 'tee', suit: USA, suitD: USA_D };
CAST.guk = { face: [0.92, 1.06, 0.86], hair: 'swept', hairC: '#141010', brow: '#100C0A', suit: IND, suitD: IND_D, shirt: 'tee', ears: 1.04, skin: BROWN };
CAST.gukSTL = { ...CAST.guk, suit: '#30394A', suitD: '#222936', shirt: 'open' };
const FAN = o => ({ face: [0.96, 1.04, 0.9], brow: '#2A201A', ears: 1.02, shirt: 'tee', hairC: '#2A201A', ...o });
CAST.f1 = FAN({ hair: 'buzz', suit: '#B22234', suitD: '#8A1A28' });
CAST.f2 = FAN({ hair: 'tied', hairC: '#C9A070', brow: '#9C7E58', suit: '#F2F0EA', suitD: '#CFCBC2', female: true, ears: 0.9 });
CAST.f3 = FAN({ hair: 'messy', hairC: '#4A3424', suit: USA, suitD: USA_D, shirt: 'hoodie' });
CAST.f4 = FAN({ hair: 'swept', hairC: '#16110E', brow: '#120D0A', suit: '#FF9933', suitD: '#D97A1E', skin: BROWN });
CAST.f5 = FAN({ hair: 'curly', hairC: '#16110E', brow: '#120D0A', suit: '#138808', suitD: '#0E6A06', female: true, ears: 0.9, skin: BROWN2 });
CAST.f6 = FAN({ hair: 'receding', hairC: '#8E8A84', brow: '#6E6A64', suit: '#1F4E8C', suitD: '#163A6A', glasses: true });
CAST.f7 = FAN({ hair: 'longcurly', hairC: '#1E1612', brow: '#16100C', suit: '#2E5A9A', suitD: '#21447A', female: true, ears: 0.9, skin: BROWN2 });
CAST.f8 = FAN({ hair: 'parted', hairC: '#C9A070', brow: '#9C7E58', suit: '#B22234', suitD: '#8A1A28' });
const FANS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });

// ---------- the Saint Louis club (a calm room, rule 30) ----------
const CLUB = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.32, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };

// ---------- shared with the Rausis episode (episodes/rausis/scenes.js): screen helpers, the 3D toolkit, standing people ----------
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
  g.save(); g.globalAlpha *= clamp(u * 2); g.translate(p.x, p.y); g.scale(k, k);
  g.font = sans(fs, 900); const tw = g.measureText(text).width + fs * 0.8;
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

// ---------- the crowd: every fan is a cached bust sprite (seated, cheering with both arms up, or catching the king),
// drawn as a billboard on its seat; a few hold up a phone that films the stage ----------
const SHADES = [null, 'brightness(0.62) saturate(0.7)', 'brightness(0.4) saturate(0.6)'];
const SPR = new Map();
function fanSprite(who, pose, shade) {
  const key = `${who}:${pose}:${shade}`;
  if (!SPR.has(key)) SPR.set(key, tex(300, 340, (x, w, h) => {
    if (SHADES[shade]) x.filter = SHADES[shade];
    x.translate(150, 130); x.scale(0.42, 0.42);
    const c = CAST[who], sk = skinOf(who);
    if (pose) {  // arms up: upper arms in the shirt, bare forearms; catching, the hands meet over the head
      x.lineCap = 'round';
      for (const sd of [-1, 1]) {
        const el = [sd * 250, 60], hd = pose === 2 ? [sd * 105, -250] : [sd * 230, -200];
        x.strokeStyle = c.suitD; x.lineWidth = 70; x.beginPath(); x.moveTo(sd * 140, 250); x.lineTo(...el); x.stroke();
        x.strokeStyle = sk.base; x.lineWidth = 46; x.beginPath(); x.moveTo(...el); x.lineTo(...hd); x.stroke();
      }
    }
    drawChar(x, who, { e: EXPR[pose ? 'triumph' : 'neutral'] });
    if (pose === 1) for (const sd of [-1, 1]) hand2(x, sd * 230, -210, 34, sk);
    x.setTransform(1, 0, 0, 1, 0, 0); x.filter = 'none';
    x.globalCompositeOperation = 'destination-out';  // the bust fades out at the bottom, behind the row in front
    const gr = x.createLinearGradient(0, 290, 0, 340); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = gr; x.fillRect(0, 290, w, 50);
  }));
  return SPR.get(key);
}
const FK = 0.82 * 1.05 / 100;  // a bust unit in world units (the busts are drawn at HK, as the standing figures)
function fanAt(g, spr, x, y, z, bob = 0) {
  if (depth(x, y, z) < 1) return null;
  const p = B.project(x, y, z), f = p.s * FK / 0.42, X = p.x - 150 * f, Y = p.y - 130 * f + bob * p.s;
  if (X > W || X + 300 * f < 0 || Y > H || Y + 340 * f < 0 || f < 0.01) return null;
  g.drawImage(spr, X, Y, 300 * f, 340 * f);
  return { ...p, f, y: p.y + bob * p.s };
}
// a phone held up beside the head, filming: a lit screen, now and then a flash
function phoneUp(g, p, sd, t, k, sk) {
  const s = p.s, x = p.x + sd * 1.0 * s, y = p.y - 1.35 * s, w = 0.36 * s, h = 0.62 * s;
  g.save(); g.lineCap = 'round'; g.strokeStyle = sk.base; g.lineWidth = 0.3 * s;
  g.beginPath(); g.moveTo(p.x + sd * 1.0 * s, p.y + 1.7 * s); g.lineTo(x + sd * 0.05 * s, y + h * 0.45); g.stroke();
  g.fillStyle = '#0A0C10'; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, w * 0.18); g.fill();
  const fl = hash(k + Math.floor(t * 6)) < 0.06;
  g.fillStyle = fl ? '#FFFFFF' : '#BFDFFF'; g.beginPath(); g.roundRect(x - w * 0.4, y - h * 0.43, w * 0.8, h * 0.86, w * 0.1); g.fill();
  g.restore();
  rim(g, x, y, s * (fl ? 2.4 : 0.9), fl ? '#FFFFFF' : PHONE, fl ? 0.6 : 0.3);
}

// ---------- the stands: three banks of ten rows around the stage (to its right the throw lands, to its left and
// behind Gukesh), stepped risers, seat backs, a lip in front of every row and an LED ribbon along the front ----------
const AF = -7.5, ROWS = 10, RSTEP = 3, SEAT = 2.6;  // AF: the arena floor; the stage top is FLOOR_Y
const STANDS = [
  { o: [18, 0, 0], d: [1, 0, 0], a: [0, 0, 1], s0: -12, s1: 20 },
  { o: [-10, 0, 0], d: [-1, 0, 0], a: [0, 0, 1], s0: -12, s1: 20 },
  { o: [0, 0, 22], d: [0, 0, 1], a: [1, 0, 0], s0: -8, s1: 16 },
];
const rowFloor = r => AF + 1.4 + 1.8 * r;
const SPt = (st, dd, ss, y) => [st.o[0] + st.d[0] * dd + st.a[0] * ss, y, st.o[2] + st.d[2] * dd + st.a[2] * ss];
function sbox(g, st, d0, d1, s0, s1, y0, y1, col, o = {}) {
  const p = SPt(st, d0, s0, y0), q = SPt(st, d1, s1, y1);
  ab(g, [Math.min(p[0], q[0]), y0, Math.min(p[2], q[2])], [Math.max(p[0], q[0]), y1, Math.max(p[2], q[2])], col, o);
}
// every seat; about half to three quarters taken (fuller low down); the catcher's block is full
const SEATS = STANDS.map((st, si) => [...Array(ROWS)].map((_, r) => {
  const n = Math.floor((st.s1 - st.s0) / SEAT), out = [];
  for (let i = 0; i < n; i++) {
    const ss = st.s0 + SEAT * (i + 0.5), k = si * 1000 + r * 50 + i, catcher = si === 0 && r === 2 && i === 5;
    const occ = (si === 0 && r >= 1 && r <= 3 && i >= 4 && i <= 6) || hash(k) < lerp(0.75, 0.4, r / 9);
    out.push({ ss, k, occ, catcher, c: SPt(st, 1.5 + RSTEP * r, ss, rowFloor(r)), who: catcher ? 'f3' : FANS[Math.floor(hash(k + 0.37) * 8)], ph: hash(k + 0.5) * 6.28, phone: !catcher && hash(k + 0.71) < 0.15 });
  }
  return out;
}));
const CATCH = SEATS[0][2][5];
function fan(g, s, r, t, { cheer = 0, land = null, tLand = 1e9, phones = true, wave = 22 }) {
  const fl = rowFloor(r), dl = land ? Math.hypot(s.c[0] - land[0], s.c[2] - land[2]) : 1e9;
  const near = t > tLand && dl < 9 + (t - tLand) * wave;  // the cheer spreads from where the king came down
  const up = near || hash(s.k + 0.91) < cheer, catching = s.catcher && t >= tLand;
  const hy = fl + (up ? 5.3 : 4.4), bob = up ? -Math.abs(Math.sin(t * 7 + s.ph)) * 0.35 : Math.sin(t * 1.3 + s.ph) * 0.04;
  const p = fanAt(g, fanSprite(s.who, catching ? 2 : up ? 1 : 0, r < 3 ? 0 : r < 7 ? 1 : 2), s.c[0], hy, s.c[2], bob);
  if (!p) return;
  if (catching) {  // the king held high in both hands
    const h = 150 * FK * p.s, hx = 105 * FK * p.s, hy2 = p.y - 250 * FK * p.s;
    drawPiece(g, 'k', 'b', p.x, hy2 + h * 0.42, h, { glow: GOLD, rot: Math.sin(t * 6) * 0.08 });
    for (const sd of [-1, 1]) hand2(g, p.x + sd * hx * 0.62, hy2 + h * 0.05, 30 * FK * p.s, skinOf(s.who));
  }
  if (s.phone && phones && !up && r < 7) phoneUp(g, p, hash(s.k + 0.2) < 0.5 ? -1 : 1, t, s.k, skinOf(s.who));
}
function standRow(g, si, r, t, o) {
  const st = STANDS[si], d0 = RSTEP * r, fl = rowFloor(r);
  sbox(g, st, d0, d0 + RSTEP, st.s0, st.s1, AF, fl, '#141820', { amb: 0.7 });
  const camD = (B.E[0] - st.o[0]) * st.d[0] + (B.E[2] - st.o[2]) * st.d[2], behind = camD > d0 + 2;
  const list = SEATS[si][r].map(s => ({ s, z: depth(s.c[0], fl + 3, s.c[2]) })).filter(e => e.z > 0.6).sort((a, b) => b.z - a.z);
  for (const { s } of list) {
    const back = () => sbox(g, st, d0 + 2.3, d0 + 2.75, s.ss - 1.05, s.ss + 1.05, fl + 1.3, fl + 3.5, '#1B2230', { amb: 0.6 });
    if (!behind) back();
    if (s.occ && o.fans !== false) fan(g, s, r, t, o);
    else sbox(g, st, d0 + 1.0, d0 + 2.3, s.ss - 0.95, s.ss + 0.95, fl + 1.1, fl + 1.45, '#1E2636', { amb: 0.6 });
    if (s.catcher && o.fans === false && o.kingSeat) {  // after the show: the king lies on that seat
      const q = [s.c[0] - 0.2, fl + 1.75, s.c[2]];
      if (depth(...q) > 1) { const p = B.project(...q), h = p.s * 1.25; rim(g, p.x, p.y, h, GOLD, 0.3 * o.kingSeat); drawPiece(g, 'k', 'b', p.x - h * 0.42, p.y, h, { rot: -Math.PI / 2, glow: GOLD }); }
    }
    if (behind) back();
  }
  sbox(g, st, d0, d0 + 0.35, st.s0, st.s1, fl, fl + 1.4, '#0F1218', { amb: 0.7 });
}
// an LED ribbon along the front of a stand, its text scrolling: the strip repeats every RIBP[mode] pixels and is one
// ribbon longer than that, so a window slid along it by the repeat length wraps without a jump
const RIBP = {};
function ribbonTex(mode) {
  const parts = mode === 'cta' ? [['1 – 10', GOLD], ['★', CREAM], ['HOW DISRESPECTFUL?', CREAM], ['★', RED]] : [['USA', '#7FB8FF'], ['VS', CREAM], ['INDIA', '#FF9933'], ['★', GOLD]];
  const font = x => { x.font = sans(84, 900); x.letterSpacing = '6px'; x.textBaseline = 'middle'; };
  if (!RIBP[mode]) { const m = makeCanvas(8, 8).getContext('2d'); font(m); RIBP[mode] = parts.reduce((a, [s]) => a + m.measureText(s).width + 60, 0); }
  return once('rib:' + mode, Math.ceil(RIBP[mode]) + 3300, 140, (x, w, h) => {
    x.fillStyle = '#05070B'; x.fillRect(0, 0, w, h); font(x);
    let cx = 0; while (cx < w) for (const [s, c] of parts) { x.fillStyle = c; x.fillText(s, cx, h / 2 + 4); cx += x.measureText(s).width + 60; }
    ledGrid(x, w, h, 7);
  });
}
const RIB = [
  { tl: [17.96, AF + 1.4, 20], tr: [17.96, AF + 1.4, -12], bl: [17.96, AF, 20], len: 32 },
  { tl: [-9.96, AF + 1.4, -12], tr: [-9.96, AF + 1.4, 20], bl: [-9.96, AF, -12], len: 32 },
  { tl: [-8, AF + 1.4, 21.96], tr: [16, AF + 1.4, 21.96], bl: [-8, AF, 21.96], len: 24 },
];
function ribbon(g, si, t, mode) {
  const st = STANDS[si], camD = (B.E[0] - st.o[0]) * st.d[0] + (B.E[2] - st.o[2]) * st.d[2];
  if (camD > -0.1) return;  // seen from inside the stand: its back
  const R = RIB[si], img = ribbonTex(mode), sw = R.len * 100, off = (t * 160) % RIBP[mode];
  texQuad(g, img, R.tl, R.tr, R.bl, { src: [off, 0, sw, 140] });
}
function stands(g, t, list, o) {
  const rows = [];
  for (const si of list) {
    const st = STANDS[si], camD = (B.E[0] - st.o[0]) * st.d[0] + (B.E[2] - st.o[2]) * st.d[2];
    const sd = Math.hypot(...vsub(B.E, SPt(st, 15, (st.s0 + st.s1) / 2, 2)));
    for (let r = 0; r < ROWS; r++) rows.push({ si, r, sd, d: Math.hypot(camD - (RSTEP * r + 1.5), B.E[1] - rowFloor(r) - 2) });
  }
  rows.sort((a, b) => b.sd - a.sd || b.d - a.d);
  for (const { si, r } of rows) { standRow(g, si, r, t, o); if (r === 0 && o.ribbon !== false) ribbon(g, si, t, o.rib || 'vs'); }
}

// ---------- the LED wall at the end of the arena, the jumbotron over the stage, the stage itself, the truss ----------
const LEDQ = { tl: [22, 21.75, -16], tr: [-14, 21.75, -16], bl: [22, 1.5, -16] };
function ledTex(mode, n = 4) {
  return once(`led:${mode}:${n}`, 1280, 720, (x, w, h) => {
    x.fillStyle = '#05070B'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle';
    const big = (s, y, col, size, glow = col) => { x.font = sans(size, 900); x.letterSpacing = '8px'; x.shadowColor = glow; x.shadowBlur = 40; x.fillStyle = col; x.fillText(s, w / 2, y); x.shadowBlur = 0; };
    if (mode === 'vs' || mode === 'live') {
      const L = x.createLinearGradient(0, 0, w / 2, 0); L.addColorStop(0, '#0E1A3A'); L.addColorStop(1, '#2A4A8E');
      const Rg = x.createLinearGradient(w / 2, 0, w, 0); Rg.addColorStop(0, '#E8892B'); Rg.addColorStop(1, '#8E4A12');
      x.fillStyle = L; x.fillRect(0, 0, w / 2, h); x.fillStyle = Rg; x.fillRect(w / 2, 0, w / 2, h);
      x.font = sans(mode === 'vs' ? 170 : 104, 900); x.letterSpacing = '6px'; x.fillStyle = CREAM;
      x.fillText(mode === 'vs' ? 'USA' : 'NAKAMURA', w * 0.25, h * 0.52); x.fillText(mode === 'vs' ? 'INDIA' : 'GUKESH', w * 0.75, h * 0.52);
      x.fillStyle = '#05070B'; x.beginPath(); x.arc(w / 2, h * 0.52, 92, 0, 7); x.fill(); x.strokeStyle = GOLD; x.lineWidth = 8; x.stroke();
      x.font = sans(70, 900); x.letterSpacing = '2px'; x.fillStyle = GOLD; x.fillText('VS', w / 2, h * 0.53);
      x.font = sans(40, 800); x.letterSpacing = '10px'; x.fillStyle = 'rgba(244,239,230,0.85)';
      x.fillText(mode === 'vs' ? 'CHECKMATE · ARLINGTON' : 'LAST MATCH', w / 2, h * 0.14);
      if (mode === 'live') { x.fillStyle = RED; x.beginPath(); x.arc(w / 2 - 150, h * 0.86, 14, 0, 7); x.fill(); x.textAlign = 'left'; x.fillStyle = CREAM; x.fillText('LIVE', w / 2 - 120, h * 0.865); x.textAlign = 'center'; }
    } else if (mode === 'mate') {
      const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.6); gr.addColorStop(0, '#3A0A0A'); gr.addColorStop(1, '#0A0303');
      x.fillStyle = gr; x.fillRect(0, 0, w, h); big('CHECKMATE', h * 0.47, '#FF5A4F', 176);
      x.font = sans(44, 800); x.letterSpacing = '12px'; x.fillStyle = CREAM; x.fillText('NAKAMURA WINS', w / 2, h * 0.75);
    } else if (mode === 'score') {
      x.font = sans(120, 900); x.letterSpacing = '6px'; x.fillStyle = '#7FB8FF'; x.fillText('USA', w * 0.2, h * 0.5); x.fillStyle = '#FF9933'; x.fillText('INDIA', w * 0.8, h * 0.5);
      big(`${n} – 0`, h * 0.52, CREAM, 230, '#7FB8FF');
    } else if (mode === 'cta') {
      big('1 – 10', h * 0.45, GOLD, 250);
      x.font = sans(52, 900); x.letterSpacing = '12px'; x.fillStyle = CREAM; x.fillText('HOW DISRESPECTFUL?', w / 2, h * 0.8);
    }
    ledGrid(x, w, h);
  });
}
function ledWall(g, t, mode, on, n) {
  if (B.E[2] < -15.5) return;
  ab(g, [-14.4, AF, -16.6], [22.4, 22.2, -16.05], '#0C0F14', { amb: 0.6 });
  texQuad(g, ledTex(mode, n), LEDQ.tl, LEDQ.tr, LEDQ.bl);
  if (mode === 'vs') for (const [k, x0, x1] of [[0, 22, 4], [1, 4, -14]]) {  // each half lights up when it is named
    const a = (1 - on[k]) * 0.82; if (a <= 0.01) continue;
    if (B.poly(g, [[x0, 21.75, -15.98], [x1, 21.75, -15.98], [x1, 1.5, -15.98], [x0, 1.5, -15.98]])) { g.fillStyle = `rgba(3,4,6,${a.toFixed(3)})`; g.fill(); }
  }
  const col = mode === 'mate' ? '#FF5A4F' : mode === 'cta' ? GOLD : '#7FB8FF';
  pool(g, B, 4, 11, -15.9, 26, col, 0.12, true);
  pool(g, B, 4, AF + 0.05, -12, 16, col, 0.1);
}
function jumboTex(n) {
  return once('jb:' + n, 960, 620, (x, w, h) => {
    x.fillStyle = '#06080C'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#22335E'; x.fillRect(0, 0, w / 2, 150); x.fillStyle = '#D9822B'; x.fillRect(w / 2, 0, w / 2, 150);
    x.font = sans(92, 900); x.letterSpacing = '6px'; x.fillStyle = CREAM; x.fillText('USA', w / 4, 80); x.fillText('INDIA', w * 0.75, 80);
    x.font = sans(300, 900); x.letterSpacing = '4px'; x.shadowColor = '#7FB8FF'; x.shadowBlur = 40; x.fillStyle = CREAM; x.fillText(`${n} – 0`, w / 2, 395); x.shadowBlur = 0;
    ledGrid(x, w, h);
  });
}
function jumbotron(g, n) {
  for (const x of [1.6, 6.4]) { g.strokeStyle = '#2A3038'; g.lineWidth = 2; g.beginPath(); line3(g, [x, 23, 4], [x, 34, 4]); g.stroke(); }
  ab(g, [1, 19, 1], [7, 23, 7], '#0C0F14', { amb: 0.6 });
  const img = jumboTex(n), m = 0.18, e = 0.02, E = B.E;
  if (E[2] < 1) texQuad(g, img, [1 + m, 23 - m, 1 - e], [7 - m, 23 - m, 1 - e], [1 + m, 19 + m, 1 - e]);
  if (E[2] > 7) texQuad(g, img, [7 - m, 23 - m, 7 + e], [1 + m, 23 - m, 7 + e], [7 - m, 19 + m, 7 + e]);
  if (E[0] > 7) texQuad(g, img, [7 + e, 23 - m, 1 + m], [7 + e, 23 - m, 7 - m], [7 + e, 19 + m, 1 + m]);
  if (E[0] < 1) texQuad(g, img, [1 - e, 23 - m, 7 - m], [1 - e, 23 - m, 1 + m], [1 - e, 19 + m, 7 - m]);
  pool(g, B, 4, 19, 4, 7, '#7FB8FF', 0.12, true);
}
function stage(g, t) {
  ab(g, [-6, AF, -10], [14, FLOOR_Y, 18], '#11151B', { amb: 0.62 });
  if (B.E[1] > FLOOR_Y) tiled(g, [-6, FLOOR_Y + 0.005, -10], [20, 0, 0], [0, 0, 28], { color: '#14181E', grout: 'rgba(160,190,220,0.06)', tu: 2.5 });
  pool(g, B, 4, FLOOR_Y, 4, 12, '#FFE2B8', 0.14);
  g.save(); g.strokeStyle = rgba('#7FB8FF', 0.85); g.lineWidth = 3; g.shadowColor = '#7FB8FF'; g.shadowBlur = 18; g.beginPath();
  const y = FLOOR_Y + 0.01; line3(g, [-5.7, y, -9.7], [13.7, y, -9.7]); line3(g, [13.7, y, -9.7], [13.7, y, 17.7]); line3(g, [13.7, y, 17.7], [-5.7, y, 17.7]); line3(g, [-5.7, y, 17.7], [-5.7, y, -9.7]);
  g.stroke(); g.restore();
}
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
function arenaBg(g, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0A0E16'); gr.addColorStop(1, '#030406');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (B.E[1] <= 30) for (let x = -40; x <= 60; x += 12) for (let z = -28; z <= 56; z += 12) {
    if (depth(x, 32, z) < 1) continue; const p = B.project(x, 32, z);
    if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
    rim(g, p.x, p.y, Math.max(8, p.s * 1.8), '#CFE2FF', 0.3); g.fillStyle = 'rgba(235,245,255,0.85)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.15), 0, 7); g.fill();
  }
  quad(g, [[-70, AF, -40], [80, AF, -40], [80, AF, 80], [-70, AF, 80]], '#07090C');
}
// the whole arena; mid: the stage set (table, players), over: whatever flies over the crowd
function arena(g, t, { led = 'vs', ledOn = [1, 1], score = 4, jb = 4, mid = null, over = null, cone = 0.07, fans = true, cheer = 0, land = null, tLand = 1e9, phones = true, rib = 'vs', ribbon = true, kingSeat = 0 } = {}) {
  const E = B.E, o = { cheer, land, tLand, phones, rib, ribbon, fans, kingSeat };
  arenaBg(g, t);
  ledWall(g, t, led, ledOn, score);
  const near = [E[0] > 14, E[0] < -6, E[2] > 18];
  stands(g, t, [0, 1, 2].filter(i => !near[i]), o);
  stage(g, t);
  if (mid) mid(g);
  truss(g, t); jumbotron(g, jb); cones(g, t, cone);
  stands(g, t, [0, 1, 2].filter(i => near[i]), o);
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- Hikaru on his feet: the throw. One arm (sd: -1 = his right, on the left as we face him) runs through a
// pose track: hanging, the king raised, wound back over the head, the release, the follow-through, down again ----------
const THROW = [[0, [168, 350], [142, 470]], [0.3, [240, 170], [215, -40]], [0.5, [215, 60], [150, -170]], [0.62, [280, 30], [340, -190]], [0.8, [230, 250], [90, 330]], [1, [200, 330], [150, 440]]];
function throwPose(a) {
  a = clamp(a); let i = 0; while (i < THROW.length - 2 && a > THROW[i + 1][0]) i++;
  const [a0, e0, h0] = THROW[i], [a1, e1, h1] = THROW[i + 1], u = smooth(clamp((a - a0) / (a1 - a0)));
  return { el: [lerp(e0[0], e1[0], u), lerp(e0[1], e1[1], u)], hd: [lerp(h0[0], h1[0], u), lerp(h0[1], h1[1], u)] };
}
function throwArm(g, c, sk, sd, a, { king = false } = {}) {
  const { el, hd } = throwPose(a), S = [sd * 150, 225], E = [sd * el[0], el[1]], Hh = [sd * hd[0], hd[1]];
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = sk.base; g.lineWidth = 50; g.beginPath(); g.moveTo(...S); g.lineTo(...E); g.lineTo(...Hh); g.stroke();
  const M = [lerp(S[0], E[0], 0.55), lerp(S[1], E[1], 0.55)];
  g.strokeStyle = c.suitD; g.lineWidth = 66; g.beginPath(); g.moveTo(...S); g.lineTo(...M); g.stroke();
  if (king) drawPiece(g, 'k', 'b', Hh[0], Hh[1] + 40, 130, { rot: sd * 0.3, glow: GOLD });
  hand2(g, Hh[0], Hh[1], 32, sk);
}
// the throwing hand in world space (head at x, hy, z): where the king leaves him
function handWorld(x, hy, z, sd, a, k = 1) {
  const { hd } = throwPose(a), u = k / 100 * 1.05 * HK;
  return [0, 1, 2].map(i => [x, hy, z][i] + B.R[i] * sd * hd[0] * u - B.U[i] * hd[1] * u);
}
function standing(g, who, x, z, { e = 'neutral', t = 0, k = 1, y0 = FLOOR_Y, col, arm = null, king = false, sd = -1, face = 1, shirt = null } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8) return null;
  const c = CAST[who], sk = skinOf(who), p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK;
  const ex = typeof e === 'string' ? EXPR[e] : e, dx = x - B.E[0], dz = z - B.E[2];
  const ee = { ...ex, turn: clamp((ex.turn || 0) - face * dx / (Math.hypot(dx, dz) || 1) * 0.85, -1, 1) };
  footShadow(g, x, z, 1.3 * k, 0.8, y0);
  g.save(); g.translate(p.x, p.y); g.scale(sc, sc);
  const tc = col || [mix(c.suit, '#000000', 0.1), mix(c.suitD, '#000000', 0.35)];
  for (const s of [-1, 1]) leg(g, s, { col: tc });
  const behind = arm !== null && arm > 0.38 && arm < 0.58;  // wound back: the arm is behind the head
  if (behind) throwArm(g, c, sk, sd, arm, { king });
  g.save(); jacketClip(g); drawChar(g, who, { e: ee, t });
  if (shirt) { g.font = sans(46, 900); g.letterSpacing = '5px'; g.textAlign = 'center'; g.fillStyle = shirt[1]; g.globalAlpha *= 0.92; g.fillText(shirt[0], 0, 318); g.globalAlpha /= 0.92; }
  g.strokeStyle = 'rgba(0,0,0,0.24)'; g.lineWidth = 5;
  for (const s of [-1, 1]) { if (arm !== null && s === sd) continue; g.beginPath(); g.moveTo(s * 114, 236); g.quadraticCurveTo(s * 120, 340, s * 112, 444); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(-150, 436); g.quadraticCurveTo(0, 460, 150, 436); g.lineTo(150, 480); g.lineTo(-150, 480); g.closePath(); g.fill();
  g.restore();
  for (const s of [-1, 1]) {
    if (arm !== null && s === sd) continue;
    if (c.shirt === 'tee') { g.strokeStyle = sk.base; g.lineWidth = 44; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * 126, 330); g.lineTo(s * 142, 462); g.stroke(); }
    hand2(g, s * 142, 470, 30, sk);
  }
  if (arm !== null && !behind) throwArm(g, c, sk, sd, arm, { king });
  g.restore(); return p;
}

// ---------- the king in flight: from Hikaru's hand in an arc into the stands on the right, spinning, a gold trail ----------
const REL = [7.53, 5.54, -2.6], LAND = [CATCH.c[0], rowFloor(2) + 6.5, CATCH.c[2]];
const kingAt = (f, rel = REL) => [lerp(rel[0], LAND[0], f), lerp(rel[1], LAND[1], f) + 4 * 8.5 * f * (1 - f), lerp(rel[2], LAND[2], f)];
function flyingKing(g, f, { rel = REL, scale = 1 } = {}) {
  if (f <= 0 || f >= 1) return;
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const f0 = f - (i + 1) * 0.018, f1 = f - i * 0.018; if (f0 < 0) break;
    const a = kingAt(f0, rel), b = kingAt(f1, rel); if (depth(...a) < 0.8 || depth(...b) < 0.8) continue;
    const P = B.project(...a), Q = B.project(...b), fade = 1 - i / 14;
    g.strokeStyle = rgba(GOLD, 0.5 * fade); g.lineWidth = Math.max(1, Q.s * 0.22 * fade); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(Q.x, Q.y); g.stroke();
  }
  g.restore();
  const k = kingAt(f, rel); if (depth(...k) < 0.8) return;
  const p = B.project(...k), h = p.s * 1.12 * scale;
  rim(g, p.x, p.y, h * 1.3, GOLD, 0.35);
  g.save(); g.translate(p.x, p.y); g.rotate(f * Math.PI * 4); drawPiece(g, 'k', 'b', 0, h * 0.5, h, { glow: GOLD }); g.restore();
}

// ---------- the stage table: the two players, the board, a digital clock on the right, an eval bar on the left ----------
function jersey(g, x, lift, z, text, color) {
  if (depth(x, lift, z) < 0.8) return;
  const p = B.project(x, lift, z), s = p.s * 1.05 / 100;
  g.save(); g.font = sans(Math.round(44 * s), 900); g.letterSpacing = `${(5 * s).toFixed(1)}px`; g.textAlign = 'center'; g.fillStyle = color; g.globalAlpha *= 0.92;
  g.fillText(text, p.x, p.y + 292 * s); g.restore();
}
const fmtT = s => s >= 20 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.floor(s)}.${Math.floor(s * 10) % 10}`;
function lcdTex({ l = 600, r = 600, draw = false, run = 0 }) {
  const key = draw ? 'lcd:draw' : `lcd:${l.toFixed(1)}:${r.toFixed(1)}:${run}`;
  return once(key, 480, 240, (x, w, h) => {
    x.fillStyle = '#070908'; x.fillRect(0, 0, w, h); x.fillStyle = '#0E1512'; x.fillRect(12, 12, w - 24, h - 24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = sans(24, 800); x.letterSpacing = '4px'; x.fillStyle = '#7FB8FF'; x.fillText('NAKAMURA', w * 0.25, 46); x.fillStyle = '#FF9933'; x.fillText('GUKESH', w * 0.75, 46);
    x.fillStyle = 'rgba(244,239,230,0.2)'; x.fillRect(w / 2 - 2, 30, 4, h - 60);
    if (draw) { x.font = sans(84, 900); x.letterSpacing = '4px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 20; x.fillText('½ – ½', w / 2, 150); }
    else {
      x.font = mono(70, 800); x.letterSpacing = '0px'; x.shadowBlur = 16;
      x.shadowColor = x.fillStyle = run === 1 ? '#E9FFF0' : '#8FA89A'; x.fillText(fmtT(l), w * 0.25, 145);
      x.shadowColor = x.fillStyle = run === 2 ? '#E9FFF0' : '#8FA89A'; x.fillText(fmtT(r), w * 0.75, 145);
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
function evalBar(g, v, { label = null, u = 1 } = {}) {
  const f = 0.5 + 0.3 * clamp(-v / 4.2, -1, 1), ym = lerp(-0.35, 6, 1 - f);
  ab(g, [-1.05, -0.35, 3.75], [-0.45, ym, 4.25], '#ECECEC', { amb: 0.75 });
  ab(g, [-1.05, ym, 3.75], [-0.45, 6, 4.25], '#121417', { amb: 0.7 });
  tag3(g, -0.75, 6.9, 4, label ?? (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1), v < -1 ? IND : v > 1 ? '#7FB8FF' : CREAM, u);
}
function tableSet(g, t, { pieces = null, eh = 'focus', eg = 'focus', hReach = null, gReach = null, under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, focus = null, hik = 'hik', guk = 'guk', jerseys = true, hStand = null, hSide = 1, gSide = 1, players = true } = {}) {
  const standFirst = hStand && B.E[2] > -2.6;
  if (standFirst) hStand(g);
  const hb = hStand || !players ? () => {} : seated(g, B, hik, eh, t, { z: -1.4, face: 1, reach: hReach, side: hSide });
  if (players && jerseys && !hStand && B.E[2] > -1.4) jersey(g, 4, 3.1, -1.4, 'USA', CREAM);
  const gb = players ? seated(g, B, guk, eg, t, { z: 9.3, face: -1, reach: gReach, side: gSide }) : () => {};
  if (players && jerseys && B.E[2] < 9.3) jersey(g, 4, 3.1, 9.3, 'INDIA', USA_D);
  table(g, B, { table: ['#1A1D22', '#0E1013', '#121418'] }, { x1: 10.6 });
  const clockLate = B.E[0] > 11, barLate = B.E[0] < -1.5;
  if (clock && !clockLate) lcdClock(g, clock, press);
  if (evalV !== null && !barLate) evalBar(g, evalV, { label: evalLabel });
  B.drawSlab(g, SLATE);
  if (under) under(g);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof: 1.4 });
  if (over) over(g);
  if (clock && clockLate) lcdClock(g, clock, press);
  if (evalV !== null && barLate) evalBar(g, evalV, { label: evalLabel });
  useSkin(g, hik); hb(); useSkin(g, guk); gb();
  if (hStand && !standFirst) hStand(g);
}
// the board of a game at ply k, with or without some pieces
const board = (plies, k, drop = []) => piecesAt(plies, k).filter(p => !drop.includes(p.id));

// ---------- a dotted map of the USA on the floor of a dark room: the pin drops in Arlington; later a flight arc to
// Saint Louis. 1 degree of latitude = 0.5 units, a degree of longitude 0.8 of that (the latitude of Kansas) ----------
const US = { lon0: -126, lon1: -65, lat0: 23.5, lat1: 50.5, k: 0.5, kx: 0.8 };
const usXZ = (lon, lat) => [(lon + 95.5) * US.k * US.kx, (lat - 37) * US.k];
const ARL = usXZ(-97.11, 32.74), STL = usXZ(-90.2, 38.63);
const USMAP = tex(Math.round((US.lon1 - US.lon0) * 32), Math.round((US.lat1 - US.lat0) * 40), (x, w, h) => {
  x.fillStyle = '#060C12'; x.fillRect(0, 0, w, h);
  for (let lat = US.lat1 - 0.2; lat > US.lat0; lat -= 0.42) for (let lon = US.lon0 + 0.2; lon < US.lon1; lon += 0.525) {
    const id = MAP.at(lon, lat); if (!id) continue;
    x.fillStyle = id === 840 ? '#4F86B8' : '#1E3346';
    x.beginPath(); x.arc((lon - US.lon0) * 32, (US.lat1 - lat) * 40, id === 840 ? 6 : 5, 0, 7); x.fill();
  }
});
function usPlane(g) {
  const [x0, z1] = usXZ(US.lon0, US.lat1), [x1, z0] = usXZ(US.lon1, US.lat0);
  texQuad(g, USMAP, [x0, 0, z1], [x1, 0, z1], [x0, 0, z0]);
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
// Arlington → Saint Louis: a dotted arc rising off the map, drawn up to u, a light running at its head
const arcPt = (u, h = 4) => [lerp(ARL[0], STL[0], u), Math.sin(Math.PI * u) * h, lerp(ARL[1], STL[1], u)];
function flightArc(g, u) {
  if (u <= 0) return;
  g.save();
  for (let i = 0; i <= 40; i++) {
    const v = i / 40; if (v > u) break;
    if (depth(...arcPt(v)) < 0.5) continue;
    const p = B.project(...arcPt(v)); g.fillStyle = rgba(GOLD, 0.9); g.beginPath(); g.arc(p.x, p.y, Math.max(2, p.s * 0.06), 0, 7); g.fill();
  }
  g.restore();
  if (u < 1 && depth(...arcPt(u)) > 0.5) { const p = B.project(...arcPt(u)); rim(g, p.x, p.y, p.s * 1.2, GOLD, 0.6); g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(p.x, p.y, Math.max(3, p.s * 0.12), 0, 7); g.fill(); }
}
function usSet(g, lt, t, keys, { pinA = 0, tA = 0, arc = 0, pinB = 0, tB = 0 } = {}) {
  rig(B, lt, keys, { t });
  const bg = g.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#0B1520'); bg.addColorStop(1, '#020305');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  usPlane(g);
  pool(g, B, ARL[0], 0.02, ARL[1], 5, '#9FC2E8', 0.1);
  mapPin(g, ARL, pinA, t, tA, RED);
  flightArc(g, arc);
  mapPin(g, STL, pinB, t, tB, GOLD);
  lowKey(g, { cy: H * 0.45, a: 0.35 });
}

// ---------- a phone in a hand in the dark. Its screen (PHS, 9:16 like the frame) shows first the scene before the
// cut, still playing, then a post with Sutovsky's words: a plain card, no app's interface copied ----------
const PHS = makeCanvas(), phsx = PHS.getContext('2d');
const PSW = 0.36, PSH = 0.64, PC = [4, 2, 4];  // the screen's half sizes and centre; it faces -z
const POST = tex(W, H, (x, w, h) => {
  x.fillStyle = '#0E1218'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1A212B'; x.fillRect(0, 0, w, 150);
  x.fillStyle = 'rgba(234,242,246,0.75)'; x.font = sans(40, 800); x.textAlign = 'left'; x.fillText('9:41', 50, 92);
  x.fillStyle = '#3A4654'; x.beginPath(); x.arc(130, 300, 70, 0, 7); x.fill();  // no photo: a plain avatar
  x.fillStyle = '#5A6878'; x.beginPath(); x.arc(130, 280, 28, 0, 7); x.fill(); x.beginPath(); x.ellipse(130, 345, 46, 30, 0, Math.PI, 0); x.fill();
  x.fillStyle = CREAM; x.font = sans(52, 900); x.fillText('Emil Sutovsky', 230, 290);
  x.fillStyle = 'rgba(234,242,246,0.6)'; x.font = sans(36, 700); x.fillText('FIDE CEO', 230, 345);
  x.fillStyle = CREAM; x.font = serif(64, 700);
  ['“Rather distasteful', 'if you ask me. I', 'understand this entire', 'match was about show,', 'but there should be', 'some red lines IMO.”'].forEach((s, i) => x.fillText(s, 70, 520 + i * 86));
  x.fillStyle = 'rgba(234,242,246,0.4)'; x.font = sans(34, 700); x.fillText('Oct 2025', 70, 1110);
  x.fillStyle = 'rgba(234,242,246,0.15)'; x.fillRect(70, 1160, w - 140, 3);
  x.fillStyle = 'rgba(234,242,246,0.5)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.roundRect(90 + i * 240, 1200, 120, 36, 18); x.fill(); }
  x.fillStyle = 'rgba(234,242,246,0.08)'; for (let i = 0; i < 3; i++) x.fillRect(70, 1320 + i * 150, w - 140 - i * 120, 90);
});
// the screen: feed (a canvas of the frame size) until tSwipe, then the post slides up over it
function phoneScreen(feed, t, tSwipe, { mark = 0 } = {}) {
  phsx.setTransform(1, 0, 0, 1, 0, 0);
  const u = ease.inOut(clamp((t - tSwipe) / 0.3)), oy = H * (1 - u);
  if (u < 1) phsx.drawImage(feed, 0, -u * H);
  if (u > 0) phsx.drawImage(POST, 0, oy);
  if (u > 0 && mark > 0) {  // the marker runs over the first words: “Rather distasteful
    phsx.save(); phsx.globalCompositeOperation = 'screen'; phsx.fillStyle = rgba(GOLD, 0.3); phsx.fillRect(60, 462 + oy, 580 * mark, 76); phsx.restore();
    phsx.fillStyle = GOLD; phsx.fillRect(64, 536 + oy, 572 * mark, 8);
  }
  return PHS;
}
function phoneHand(g, lt, t, keys, screen, { sway = 1, shake = 0.6, vig = 1 } = {}) {
  rig(B, lt, keys, { t, shake });
  const bg = g.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, H * 0.75); bg.addColorStop(0, '#101820'); bg.addColorStop(1, '#020304');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 12, seed: 33, y0: 0.05, y1: 0.75, a: 0.16, size: [50, 150], colors: ['#9FC2E8', '#FFD9A0', '#6FA8DC'] });
  const R = { rx: Math.sin(t * 1.1) * 0.03 * sway, ry: Math.sin(t * 0.8) * 0.04 * sway };
  const F = (x, y, z) => { const p = rot3([x, y, z], R); return [PC[0] + p[0], PC[1] + p[1], PC[2] + p[2]]; };
  const sk = skinOf('f2'), skD = mix(sk.base, '#000000', 0.3), arm = F(0.55, -1.6, 0.9), wrist = F(0.3, -0.62, 0.12);
  limb(g, arm, wrist, 0.3, 0.2, '#2A3442');  // the sleeve, from below right
  limb(g, wrist, F(0.1, -0.28, 0.12), 0.2, 0.26, sk.base, skD);  // the palm, behind the phone
  for (const y of [0.14, -0.08, -0.3]) limb(g, F(-0.15, y, 0.08), F(-0.46, y - 0.03, 0.01), 0.075, 0.066, sk.base, skD);  // fingertips round the left edge
  obox(g, F(0, 0, 0.05), [PSW + 0.05, PSH + 0.06, 0.05], '#121418', R, { spec: 0.6 });
  texQuad(g, screen, F(-PSW, PSH, -0.002), F(PSW, PSH, -0.002), F(-PSW, -PSH, -0.002), { under: false });
  const sp = B.project(...F(0, 0, 0)); rim(g, sp.x, sp.y, sp.s * 1.8, PHONE, 0.22 * vig);
  limb(g, F(0.52, -0.52, 0.03), F(0.34, -0.14, -0.04), 0.1, 0.085, sk.base, skD);  // the thumb over the right edge
  lowKey(g, { cy: H * 0.45, a: 0.3 * vig });
}

// ---------- VHS: the frame of another scene with tracking tears, colour ghosts, scanlines, noise and the OSD ----------
const VH = makeCanvas(), vhx = VH.getContext('2d');
function vhs(g, src, t, { osd = '◀◀ REW', date = 'OCT 04 2025', tear = 1 } = {}) {
  vhx.setTransform(1, 0, 0, 1, 0, 0); vhx.drawImage(src, 0, 0);
  const band = ((t * 1.7) % 1.4 - 0.2) * H;
  for (let y = 0; y < H; y += 16) {
    const inBand = Math.abs(y - band) < 70, off = (hash(Math.floor(t * 30) * 7 + y) - 0.5) * 8 + (inBand ? 60 * tear * Math.sin(y * 0.3) : 0);
    g.drawImage(VH, 0, y, W, 16, off, y, W, 16);
  }
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12; g.drawImage(VH, 7, 0); g.drawImage(VH, -7, 2); g.restore();
  g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
  g.save(); g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 260; i++) { const y = band + (hash(i + t * 13) - 0.5) * 140, x = hash(i * 3.1 + t * 7) * W; g.fillRect(x, y, 2 + hash(i + 0.5) * 30, 2); }
  g.restore();
  g.save(); g.font = mono(64, 800); g.letterSpacing = '4px'; g.textAlign = 'left'; g.fillStyle = '#F4F4F4'; g.shadowColor = 'rgba(0,0,0,0.85)'; g.shadowOffsetX = 4; g.shadowOffsetY = 4;
  if (osd && Math.floor(t * 2.5) % 2 === 0) { g.fillText(osd, 80, 360); qaRect(g, 80, 300, 320, 75, 'text', 'osd'); }
  if (date) { g.font = mono(48, 800); g.fillText(date, 80, 1700); qaRect(g, 80, 1655, 420, 60, 'text', 'date'); }
  g.restore();
}

// ---------- a wall of phones in the dark: the headlines about the reset (real ones, quoted as cards: outlet and
// headline, no logos) and clips of it ----------
const HEADS = [
  ['DT NEXT', 'Gukesh takes calm revenge on Nakamura'],
  ['ORISSA POST', 'Gukesh silences Nakamura with calm gesture, takes classy revenge'],
  ['ETV BHARAT', 'Internet reacts to D Gukesh’s composed move avenging Hikaru Nakamura’s antics'],
];
function wrapText(x, text, maxW, x0, y0, lh) {
  const words = text.split(' '); let line = '', y = y0;
  for (const wd of words) { if (x.measureText(line + wd).width > maxW && line) { x.fillText(line.trim(), x0, y); line = ''; y += lh; } line += wd + ' '; }
  x.fillText(line.trim(), x0, y); return y;
}
const headTex = ([outlet, head], i) => tex(360, 640, (x, w, h) => {
  x.fillStyle = '#F2EFE8'; x.fillRect(0, 0, w, h);
  x.fillStyle = ['#8E1E22', '#1F4E8C', '#2E6A3A'][i % 3]; x.fillRect(0, 0, w, 74);
  x.fillStyle = '#FFFFFF'; x.font = sans(30, 900); x.letterSpacing = '3px'; x.textAlign = 'left'; x.fillText(outlet, 24, 50);
  x.letterSpacing = '0px'; x.fillStyle = '#16120E'; x.font = serif(34, 700); const y = wrapText(x, head, w - 48, 24, 128, 42);
  x.fillStyle = '#2A2F36'; x.fillRect(24, y + 34, w - 48, 200);  // the photo slot: the board after the reset
  const q = 22, bx = (w - q * 8) / 2, by = y + 46;
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#8FA3AE' : '#D4DDE0'; x.fillRect(bx + f * q, by + r * q, q, q); }
  x.fillStyle = 'rgba(22,18,14,0.35)'; for (let k = 0; k < 4; k++) x.fillRect(24, y + 270 + k * 26, w - 48 - (k % 2) * 60, 10);
});
const CLIPT = tex(360, 640, (x, w, h) => {  // a clip: the starting position on a dark screen, a play button
  x.fillStyle = '#0C0F14'; x.fillRect(0, 0, w, h);
  const q = 36, bx = (w - q * 8) / 2, by = 150;
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { x.fillStyle = (f + r) % 2 ? '#4A5A66' : '#9AAAB4'; x.fillRect(bx + f * q, by + r * q, q, q); }
  for (const [r, c] of [[0, 'b'], [1, 'b'], [6, 'w'], [7, 'w']]) for (let f = 0; f < 8; f++) { x.fillStyle = c === 'w' ? '#F4F1EA' : '#16120E'; x.beginPath(); x.arc(bx + (f + 0.5) * q, by + (r + 0.5) * q, q * 0.3, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(w / 2, by + q * 4, 48, 0, 7); x.fill();
  x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(w / 2 - 14, by + q * 4 - 22); x.lineTo(w / 2 + 24, by + q * 4); x.lineTo(w / 2 - 14, by + q * 4 + 22); x.closePath(); x.fill();
  x.fillStyle = 'rgba(234,242,246,0.35)'; for (let k = 0; k < 3; k++) x.fillRect(24, 470 + k * 30, w - 48 - k * 50, 12);
  x.fillStyle = '#FF5A4F'; x.beginPath(); x.arc(40, 590, 12, 0, 7); x.fill(); x.fillStyle = 'rgba(234,242,246,0.6)'; x.fillRect(62, 582, 80, 14);
});
const HEADT = HEADS.map(headTex);
// the wall: 4 columns × 4 rows of phones around (4, 4, 6), a little tilted, each lit by its screen
const WALL = [...Array(16)].map((_, i) => {
  const c = i % 4, r = Math.floor(i / 4), k = hash(i * 1.7 + 3);
  return { x: 4 + (c - 1.5) * 2.0 + (k - 0.5) * 0.3, y: 4.8 - (r - 1.5) * 3.3 + (hash(i + 9.1) - 0.5) * 0.4, z: 6 + (hash(i * 2.3) - 0.5) * 1.6, ry: (k - 0.5) * 0.3, rz: (hash(i + 4.4) - 0.5) * 0.12, img: i === 5 ? HEADT[0] : i === 10 ? HEADT[1] : i === 3 ? HEADT[2] : i === 12 ? HEADT[2] : i % 3 === 0 ? HEADT[(i / 3) % 3 | 0] : CLIPT };
});
function phoneWall(g, lt, t, keys, { notes = [], live = null, vig = 1 } = {}) {
  rig(B, lt, keys, { t, shake: vig });
  const bg = g.createRadialGradient(W / 2, H * 0.45, 60, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#0E1620'); bg.addColorStop(1, '#020304');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const list = WALL.map((p, i) => ({ p, i, d: depth(p.x, p.y, p.z) })).filter(e => e.d > 0.4).sort((a, b) => b.d - a.d);
  for (const { p, i } of list) {
    const lv = live && live.i === i, k = lv ? live.k : 1;  // the live phone starts square to the lens and settles into the wall
    const R = { ry: (p.ry + Math.sin(t * 0.7 + i) * 0.03) * k, rz: p.rz * k }, c = [p.x, p.y + Math.sin(t * 0.9 + i * 1.3) * 0.06 * k, p.z];
    const F = (x, y, z) => { const q = rot3([x, y, z], R); return [c[0] + q[0], c[1] + q[1], c[2] + q[2]]; };
    obox(g, c, [0.86, 1.52, 0.05], '#121418', R, { spec: 0.6 });
    texQuad(g, lv ? live.img : p.img, F(-0.8, 1.42, -0.06), F(0.8, 1.42, -0.06), F(-0.8, -1.42, -0.06), { under: true });
    const sp = B.project(...c); rim(g, sp.x, sp.y, sp.s * 2.2, '#BFDFFF', 0.12 * k);
    const n = notes.find(nn => nn.i === i);  // a notification banner drops in on top of this screen
    if (n && t >= n.t) {
      const u = ease.out(clamp((t - n.t) / 0.25)), q = B.project(...F(0, 1.42 - 0.26 * u, -0.08));
      g.save(); g.globalAlpha *= u; const bw = q.s * 1.5, bh = q.s * 0.36;
      g.fillStyle = 'rgba(30,36,44,0.92)'; g.beginPath(); g.roundRect(q.x - bw / 2, q.y - bh / 2, bw, bh, bh * 0.3); g.fill();
      g.fillStyle = RED; g.beginPath(); g.arc(q.x - bw / 2 + bh * 0.5, q.y, bh * 0.22, 0, 7); g.fill();
      g.fillStyle = 'rgba(234,242,246,0.7)'; g.fillRect(q.x - bw / 2 + bh, q.y - bh * 0.12, bw * 0.55, bh * 0.1); g.fillRect(q.x - bw / 2 + bh, q.y + bh * 0.08, bw * 0.38, bh * 0.08);
      g.restore();
    }
  }
  lowKey(g, { cy: H * 0.45, a: 0.3 * vig });
}

// ---------- the Saint Louis club: a quiet room, the same table, Hikaru in his grey hoodie, Gukesh in a dark jacket ----------
function clubSet(g, t, { pieces = null, eh = 'focus', eg = 'focus', hReach = null, gReach = null, under = null, over = null, focus = null, blur = 3, hik = 'hikaru', guk = 'gukSTL', clock = null, arms = null, hSide = 1, gSide = 1 } = {}) {
  room(g, B, CLUB, { t, blur });
  bokeh(g, t, { n: 8, seed: 41, y0: 0.05, y1: 0.45, a: 0.12, size: [60, 140], colors: ['#FFD9A0', '#FFC27A'] });
  const hb = seated(g, B, hik, eh, t, { z: -1.4, face: 1, reach: hReach, side: hSide });
  const gb = seated(g, B, guk, eg, t, { z: 9.3, face: -1, reach: gReach, side: gSide });
  table(g, B, CLUB, { x1: 10.2 });
  if (clock) lcdClock(g, clock);
  B.drawSlab(g, SLATE);
  if (under) under(g);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof: 1.4 });
  if (over) over(g);
  if (arms) arms(g);
  useSkin(g, hik); hb(); useSkin(g, guk); gb();
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}
// two forearms over the board and the hands clasped: the handshake (u: 0 apart .. 1 joined), shaking while joined
function handshake(g, t, u, t0) {
  const meet = [4, 1.5 + (u >= 1 ? Math.sin((t - t0) * 14) * 0.08 * clamp(1 - (t - t0) / 0.9) : 0), 4.1];
  const e = ease.inOut(clamp(u));
  for (const [sh, col, sk, sd] of [[[2.7, 1.0, -1.0], '#3A3D46', skinOf('hikaru'), -1], [[5.3, 1.0, 9.0], '#30394A', skinOf('gukSTL'), 1]]) {
    const rest = [sh[0], 0.3, lerp(sh[2], 4.1, 0.25)], hnd = [lerp(rest[0], meet[0] + sd * 0.08, e), lerp(rest[1], meet[1], e), lerp(rest[2], meet[2] + sd * 0.12, e)];
    const elbow = [lerp(sh[0], hnd[0], 0.5) + sd * 0.25, lerp(sh[1], hnd[1], 0.5) - 0.35, lerp(sh[2], hnd[2], 0.5)];
    limb(g, sh, elbow, 0.36, 0.3, col); limb(g, elbow, hnd, 0.3, 0.22, col);
    if (depth(...hnd) > 0.5) { const p = B.project(...hnd); hand2(g, p.x, p.y, p.s * 0.3, sk); }
  }
}
// the reset: from the final position, captured pieces lying beside the board, every piece flies back to its square;
// the black king goes last, set down by hand at tKing
const STL_END = 92;
function resetPieces(t, t0, t1, tKing) {
  const end = new Map(G2[STL_END].pieces.map(p => [p.id, p])), start = G2[0].pieces;
  const capW = start.filter(p => !end.has(p.id) && p.c === 'w'), capB = start.filter(p => !end.has(p.id) && p.c === 'b');
  const from = p => { if (end.has(p.id)) return sqXZ(end.get(p.id).sq); const L = p.c === 'w' ? capW : capB, i = L.indexOf(p); return [p.c === 'w' ? -0.75 : 8.75, 1 + i * 0.75]; };
  const key = p => hash(p.id.charCodeAt(0) * 0.13 + +p.id.slice(1) * 0.37 + (p.c === 'w' ? 0.5 : 0));
  const order = [...start].sort((a, b) => (a.id === 'k1') - (b.id === 'k1') || key(a) - key(b));
  const n = order.length - 1, out = [];
  order.forEach((p, i) => {
    const king = p.id === 'k1', a = king ? tKing - 0.45 : lerp(t0, t1, i / Math.max(1, n - 1)), d = king ? 0.45 : 0.32;
    const u = ease.inOut(clamp((t - a) / d)), [x0, z0] = from(p), [x1, z1] = sqXZ(p.sq);
    const lying = end.has(p.id) && p.id === 'K1' && u <= 0;  // the white king still lies where he resigned
    out.push({ ...p, x: lerp(x0, x1, u), z: lerp(z0, z1, u), y: Math.sin(Math.PI * u) * (king ? 1.2 : 0.9), rot: lying ? -1.35 : 0, trail: u > 0 && u < 1 ? [x0, z0] : null, trailA: Math.sin(Math.PI * u) * 0.8 });
  });
  return out;
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
// a dotted gold arc through the air (the plan: from the table into the stands), drawn up to u
function dotArc(g, P, u, n = 48) {
  g.save(); g.fillStyle = rgba(GOLD, 0.9);
  for (let i = 0; i <= n; i++) { const v = i / n; if (v > u) break; const q = P(v); if (depth(...q) < 0.8) continue; const p = B.project(...q); g.beginPath(); g.arc(p.x, p.y, Math.max(2.5, p.s * 0.09), 0, 7); g.fill(); }
  g.restore();
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
  const mated = board(G, 111, ['k1']);  // after 56.Qd8#, the black king already in Hikaru's hand
  const hikStand = (g, t, arm, king = false) => standing(g, 'hik', 6, -2.6, { e: 'triumph', t, arm, king, shirt: ['USA', CREAM] });

  // ======================= HOOK (rule 42): the king already in the air over the stands =======================
  // slow motion over the crowd, then a whip into real time: the king comes down into a fan's hands on "crowd"
  const crowdT = w('hook', 'crowd'), HB = 1.95;
  const fHook = t => t < HB ? lerp(0.4, 0.5, t / HB) : Math.min(1, 0.5 + 0.5 * ((t - HB) / (crowdT - HB)) ** 1.6);
  const tw = t => t < HB ? t * 0.2 : 0.39 + (t - HB);
  const hookArena = (g, t) => arena(g, tw(t), { led: 'mate', jb: 5, score: 5, cheer: 0.25, land: LAND, tLand: tw(crowdT),
    mid: g2 => tableSet(g2, t, { pieces: mated, eg: 'shock', hStand: g3 => hikStand(g3, t, lerp(0.8, 0.85, clamp(t / 4))) }),
    over: g2 => flyingKing(g2, fHook(t)) });
  const hookHud = (g, lt, t) => { heading(g, 'THE MOST DISRESPECTFUL', 150, 1, { size: 50, spacing: 4 }); heading(g, 'CHECKMATE EVER?', 222, 1, { size: 50, spacing: 4 }); };
  const tgtA = f => lerp3([5, 3, 3.4], kingAt(f), 0.4);
  shot(0, (g, lt, t) => {
    rig(B, lt, [[0, K(1.26, 0.5, 17.4, tgtA(0.4), { cy: H * 0.48 })], [HB, K(1.31, 0.49, 16.4, tgtA(0.5), { cy: H * 0.48 })]], { t, e: x => x });
    hookArena(g, t);
  }, { hud: hookHud });
  const CATCH_HEAD = [CATCH.c[0], 4.1, CATCH.c[2]];
  const EB = t => lerp3(lerp3([12.5, 16.5, -4.5], [14, 11, -2.5], seg(t, HB, 3.25)), [17.5, 4.9, 0.4], seg(t, 3.25, 4.1));
  const AB = t => lerp3(kingAt(fHook(t)), CATCH_HEAD, seg(t, 3.2, 3.7));
  shot(HB, (g, lt, t, sh) => {
    rig(B, lt, aimKeys(EB, AB, HB, sh.b + 0.4, { cy: H * 0.42 }), { t, e: x => x, shake: 0.5 });
    hookArena(g, t);
  }, { trans: 'whip', hud: hookHud });
  cue(0, 'murmur', 0.3); cue(0, 'whoosh_soft', 0.2); boom(w('hook', 'checkmated'), 0.5);
  cue(HB - 0.1, 'whoosh_fast', 0.4); cue(crowdT - 0.02, 'thud', 0.4); cue(crowdT, 'applause', 0.6); cue(crowdT, 'cheer', 0.5);

  // ======================= LOOP: Saint Louis, three weeks later; Gukesh sets a king down on e8 =======================
  const loopS = s('loop'), ansT = w('loop', 'answered');
  const startPos = board(G2, 0, ['k1']);
  shot(loopS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.35, 0.3, 7, [4.5, 1, 7.2])], [len(sh), K(0.15, 0.26, 5.6, [4.5, 0.8, 7.4])]], { t });
    const v = seg(t, loopS, ansT, ease.inOut), k = [lerp(5.4, 4.5, v), lerp(1.7, 0, v) + Math.sin(PI * v) * 0.4, lerp(7.9, 7.5, v)];
    const u = 1 - seg(t, ansT + 0.25, ansT + 0.7);
    clubSet(g, t, { pieces: [...startPos, { id: 'k1', t: 'k', c: 'b', sq: 'e8', x: k[0], y: k[1], z: k[2] }], eg: { ...EXPR.neutral, look: [0, 0.8], lid: 0.3 },
      gReach: { x: k[0], z: k[2], y: k[1] + 1.05, u, hold: true } });
  });
  cue(loopS - 0.06, 'whoosh_soft', 0.3); cue(ansT - MOVE_HIT, 'move', 0.8); boom(ansT, 0.45);

  // ======================= WHO: Hikaru Nakamura, world number two (the real photo) =======================
  const whoS = s('who'), hikT = w('who', 'hikaru');
  shot(whoS - 0.06, (g, lt, t) => photoShot(g, lt, PH.hikaru, { from: { x: 0.55, y: 0.3, zoom: 1.0, dolly: 0 }, to: { x: 0.55, y: 0.32, zoom: 1.08, dolly: 0.05 }, dur: 3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Hikaru Nakamura', 'WORLD NO. 2', { y: 200, size: 66, t0: hikT - (t - lt) }); credit(g, CREDITS.hikaru, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(whoS - 0.12, 'whoosh_fast', 0.3); cue(w('who', 'two'), 'ting', 0.25);

  // ======================= OCTOBER 2025: the pin drops on Arlington, Texas =======================
  const stS = s('stage'), octT = w('stage', 'october');
  shot(stS - 0.06, (g, lt, t, sh) => usSet(g, lt, t, [[0, K(0, 1.25, 30, [0, 0, 0])], [1.2, K(0.1, 0.9, 9, [ARL[0], 0, ARL[1]]), ease.inOut], [len(sh), K(0.14, 0.86, 8.2, [ARL[0], 0.3, ARL[1]])]],
    { pinA: seg(t, octT + 0.1, octT + 0.45, x => x), tA: octT + 0.45 }),
    { trans: 'zoom', hud: (g, lt, t) => placeStamp(g, lt, 'Arlington, Texas', 'OCT 2025', { y: 200, t0: 0.15 }) });
  cue(stS - 0.06, 'whoosh_deep', 0.35); boom(octT + 0.45, 0.5);

  // ======================= A STADIUM: from over the roof down to the stage; the LED wall lights USA, then INDIA =======================
  const stadT = w('stage', 'stadium'), usaT = w('stage', 'usa'), indT = w('stage', 'india'), andT = w('stage', 'and');
  shot(stadT - 0.16, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI, 1.3, 44, [4, 0, 2], { fov: 1100 })], [1.0, K(PI + 0.25, 0.42, 32, [4, 3, 1], { fov: 1100 }), ease.inOut], [len(sh), K(PI + 0.32, 0.36, 28, [4, 3.5, 0], { fov: 1100 })]], { t });
    arena(g, t, { led: 'vs', ledOn: [seg(t, usaT, usaT + 0.15), seg(t, indT, indT + 0.15)], jb: 0, cheer: 0.08, mid: g2 => tableSet(g2, t, { pieces: board(G, 0) }) });
  });
  cue(stadT - 0.16, 'whoosh_deep', 0.3); cue(stadT, 'murmur', 0.4); boom(usaT, 0.45); boom(indT, 0.45);

  // ======================= RESIGNING IS BANNED: his hand tips his king; the king springs back up =======================
  const resgT = w('stage', 'resigning'), banT = w('stage', 'banned');
  const p101 = board(G, 101);
  shot(andT - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.6, 0.3, 6.4, [6.4, 2.3, 1.0])], [len(sh), K(PI / 2 + 0.5, 0.28, 5.7, [6.5, 2.3, 1.1])]], { t });
    const tip = seg(t, resgT, resgT + 0.3, ease.in) * (1 - seg(t, banT + 0.12, banT + 0.42, ease.back));
    const hu = seg(t, andT, resgT, ease.out) * (1 - seg(t, banT + 0.5, banT + 0.9));
    const pieces = p101.map(p => p.id === 'K1' ? { ...p, rot: -1.35 * tip } : p);
    arena(g, t, { led: 'vs', jb: 0, mid: g2 => tableSet(g2, t, { pieces, hReach: { sq: 'h2', y: lerp(1.45, 0.9, tip), u: hu, hold: true }, hSide: -1 }) });
  }, { trans: 'whip', hud: (g, lt, t) => stamp(g, 'BANNED', W / 2, 330, t, banT, { sub: 'NO RESIGNING' }) });
  cue(andT - 0.1, 'whoosh_fast', 0.3); cue(resgT + 0.28, 'thud', 0.5); cue(banT, 'stamp', 0.7); cue(banT + 0.02, 'error', 0.35); cue(banT + 0.3, 'piece', 0.6);

  // ======================= USA WINS FOUR STRAIGHT: the jumbotron counts up =======================
  const skS = s('stakes'), fourT = w('stakes', 'four'), lastT = w('stakes', 'last');
  const scoreT = [skS + 0.16, skS + 0.36, skS + 0.56, fourT], nAt = t => scoreT.filter(x => t >= x).length;
  shot(skS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.25, -0.62, 15, [4, 21, 2])], [len(sh), K(0.15, -0.55, 12.5, [4, 21, 2.5])]], { t });
    arena(g, t, { led: 'score', score: nAt(t), jb: nAt(t), cheer: 0.15 + 0.35 * seg(t, fourT, fourT + 0.3), mid: g2 => tableSet(g2, t, {}) });
  });
  cue(skS - 0.04, 'whoosh_soft', 0.25); scoreT.forEach(x => cue(x, 'tick', 0.5)); cue(fourT, 'applause', 0.5);

  // ======================= LAST MATCH: HIKARU VS GUKESH (from the side, the crowd behind them) =======================
  const vsHT = w('stakes', 'hikaru'), gukT = w('stakes', 'gukesh'), theT = w('stakes', 'the'), chT = w('stakes', 'champion');
  shot(lastT - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.14, 0.32, 23, [4, 3, 4])], [len(sh), K(PI / 2 + 0.07, 0.3, 20.5, [4, 3.2, 4])]], { t });
    arena(g, t, { led: 'live', jb: 4, cheer: 0.1, mid: g2 => tableSet(g2, t, { pieces: board(G, 80) }),
      over: g2 => { tag3(g2, 4, 6.4, -1.4, 'HIKARU', '#7FB8FF', seg(t, vsHT, vsHT + 0.3, x => x)); tag3(g2, 4, 6.4, 9.3, 'GUKESH', '#FF9933', seg(t, gukT, gukT + 0.3, x => x)); } });
  }, { trans: 'whip' });
  cue(lastT - 0.1, 'whoosh_fast', 0.3); cue(vsHT, 'sparkle_pop', 0.3); cue(gukT, 'sparkle_pop', 0.3);
  // ======================= THE WORLD CHAMPION (the real photo) =======================
  shot(theT - 0.1, (g, lt, t) => photoShot(g, lt, PH.gukesh, { from: { x: 0.5, y: 0.35, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.37, zoom: 1.08, dolly: 0.05 }, dur: 2 }),
    { trans: 'flash', hud: (g, lt, t) => { nameTitle(g, lt, 'Gukesh D', 'WORLD CHAMPION', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.gukesh, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(theT - 0.1, 'camera', 0.35); cue(chT, 'reveal_bell', 0.4);

  // ======================= TEN MINUTES, DRAW. FIVE MINUTES, DRAW. THEN BULLET: the LCD clock =======================
  const fmS = s('format'), d1T = w('format', 2), fiveT = w('format', 'five'), d2T = w('format', 5), thenT = w('format', 'then'), bulT = w('format', 'bullet');
  const fmtBadge = (text, t0, color = CREAM) => (g, lt, t) => badge(g, text, W / 2, 230, { color, size: 46, a: seg(t, t0, t0 + 0.1), ...pop(t, t0) });
  shot(fmS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.3, 0.25, 4.5, [9.9, 0.2, 4])], [len(sh), K(PI / 2 + 0.22, 0.22, 3.9, [9.9, 0.2, 4])]], { t });
    arena(g, t, { led: 'live', jb: 4, mid: g2 => tableSet(g2, t, { pieces: board(G, 20), clock: t >= d1T ? { draw: true } : { l: 600 - (t - fmS) * 20, r: 596, run: 1 } }) });
  }, { hud: fmtBadge('10 MIN', fmS) });
  cue(fmS - 0.06, 'clock_press', 0.5); cue(d1T, 'ting', 0.35);
  shot(fiveT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.45, 0.3, 7.5, [9.9, 0.3, 4])], [len(sh), K(-0.38, 0.28, 6.6, [9.9, 0.3, 4])]], { t });
    arena(g, t, { led: 'live', jb: 4, mid: g2 => tableSet(g2, t, { pieces: board(G, 40), clock: t >= d2T ? { draw: true } : { l: 300 - (t - fiveT) * 20, r: 297, run: 1 } }) });
  }, { hud: fmtBadge('5 MIN', fiveT) });
  cue(fiveT - 0.06, 'clock_press', 0.5); cue(d2T, 'ting', 0.35);
  shot(thenT - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.6, 0.3, 5, [9.9, 0.2, 4])], [len(sh), K(PI / 2 + 0.5, 0.26, 3.4, [9.9, 0.25, 4]), ease.out]], { t });
    const k = Math.max(0, Math.floor((t - bulT) / 0.18)), run = t < bulT ? 1 : k % 2 ? 2 : 1, press = t < bulT ? 0 : 1 - seg((t - bulT) % 0.18, 0, 0.08);
    arena(g, t, { led: 'live', jb: 4, mid: g2 => tableSet(g2, t, { pieces: board(G, 60), clock: { l: 60 - Math.max(0, t - bulT) * 3, r: 59 - Math.max(0, t - bulT) * 3, run }, press }) });
  }, { hud: fmtBadge('BULLET', bulT, RED) });
  cue(thenT - 0.04, 'whoosh_soft', 0.25); boom(bulT, 0.7); for (let i = 0; i < 4; i++) cue(bulT + i * 0.18, 'clock_press', 0.4);

  // ======================= GUKESH IS WINNING: the eval bar drops to −4.2 =======================
  const wnS = s('winning'), winT = w('winning', 'winning'), heT = w('winning', 'he'), drawT = w('winning', 'draw');
  shot(wnS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.5, 0.32, 12, [0.95, 2.6, 4.57])], [len(sh), K(-0.42, 0.3, 10.5, [1.0, 2.7, 4.5])]], { t });
    arena(g, t, { led: 'live', jb: 4, mid: g2 => tableSet(g2, t, { pieces: board(G, 101), eg: 'smug', evalV: lerp(0, -4.2, seg(t, wnS + 0.1, winT + 0.1, ease.out)) }) });
  }, { trans: 'whip' });
  cue(wnS - 0.12, 'whoosh_fast', 0.3); cue(winT, 'sting', 0.35);
  // ======================= HE CAN REPEAT MOVES FOR A DRAW: the real moves, then the repetition as arrows =======================
  const runAt = [heT + 0.02, heT + 0.27, heT + 0.52, heT + 0.77];
  const arrows = [['c2', 'f5', drawT - 0.46], ['h3', 'h2', drawT - 0.16], ['f5', 'c2', drawT + 0.14]];
  shot(heT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.55, 11.5, [4, 1.2, 4.4])], [len(sh), K(0.22, 0.58, 10.5, [4, 1.2, 4.5])]], { t });
    const run = playRun(G, 105, runAt, t, piecesAt);
    arena(g, t, { led: 'live', jb: 4, mid: g2 => tableSet(g2, t, { pieces: run.pieces, evalV: lerp(-4.2, 0, seg(t, heT, heT + 0.8)),
      under: g3 => run.active.forEach(a => moveUnder(g3, B, a.m, a.lt, { hold: a.hold })),
      over: g3 => { run.active.forEach(a => moveOver(g3, B, a.m, a.lt, { hold: a.hold, label: a.label })); arrows.forEach(([f, to, t0]) => boardArrow(g3, B, f, to, 0.95, seg(t, t0, t0 + 0.25))); } }) });
  }, { hud: (g, lt, t) => { if (t >= drawT) badge(g, 'REPEAT = DRAW', W / 2, 230, { color: GOLD, size: 46, ...pop(t, drawT) }); } });
  runAt.forEach(x => cue(x + SLIDE - MOVE_HIT, 'move', 0.55)); arrows.forEach(([, , t0]) => cue(t0, 'whoosh_soft', 0.15)); cue(drawT, 'ting', 0.3);

  // ======================= INSTEAD, HE WALKS INTO MATE IN ONE: 55...Kf8?? 56.Qd8# =======================
  const blS = s('blunder'), walkT = w('blunder', 'walks'), mateT = w('blunder', 'mate'), MT = 31.6;
  const kfA = walkT - 0.1, mtA = MT - SLIDE;
  const blPieces = t => t >= mtA ? piecesAt(G, 111, slide(t - mtA), SLIDE_OPTS) : t >= kfA ? piecesAt(G, 110, slide(t - kfA), SLIDE_OPTS) : piecesAt(G, 109);
  const m110 = moveOf(G, 110), m111 = moveOf(G, 111);
  shot(blS - 0.06, (g, lt, t, sh) => {
    const t0 = t - lt, mt = t >= MT;
    rig(B, lt, [[0, K(0.18, 0.5, 11.5, [4.5, 1, 6])], [MT - t0, K(0.1, 0.45, 9.6, [4.2, 1, 6.6])], [len(sh), K(0.06, 0.42, 9, [4, 1.1, 6.8])]], { t, bump: t > MT && t < MT + 0.3 ? 1 : 0 });
    arena(g, t, { led: mt ? 'mate' : 'live', jb: mt ? 5 : 4, cheer: mt ? 0.45 : 0, mid: g2 => tableSet(g2, t, {
      pieces: blPieces(t), eg: mt ? 'shock' : 'focus', eh: 'focus', hSide: -1,
      gReach: { sq: 'f8', u: seg(t, kfA - 0.26, kfA + 0.74, x => x) }, hReach: { sq: 'd8', u: seg(t, MT - 0.6, MT + 0.6, x => x) },
      evalV: t < kfA + 0.3 ? 0 : 4.2 * seg(t, kfA + 0.3, kfA + 0.6), evalLabel: t < kfA + 0.3 ? null : 'M1',
      under: g3 => {
        moveUnder(g3, B, m110, t - kfA);
        if (t >= mateT && !mt) squareFrame(g3, B, 'd8', HI.bad, seg(t, mateT, mateT + 0.2));
        if (mt) { ledGlow(g3, B, 'd8', HI.bad, t, MT); spread(g3, B, 'd8', t, MT, HI.bad); moveUnder(g3, B, m111, t - mtA); }
      },
      over: g3 => {
        moveOver(g3, B, m110, t - kfA);
        if (t >= mateT && !mt) boardArrow(g3, B, 'f6', 'd8', 0.9, seg(t, mateT, mateT + 0.3));
        if (mt) { moveOver(g3, B, m111, t - mtA); B.laser(g3, 'd8', 'f8', HI.bad, seg(t, MT, MT + 0.1), 0.6, seg(t, MT, MT + 0.15)); pieceRing(g3, B, 'f8', HI.bad, 1, seg(t, MT, MT + 0.3)); }
      } }) });
    if (mt) { flashTint(g, HI.bad, 0.35 * (1 - seg(t, MT, MT + 0.5))); const p = B.project(3.5, 0.6, 7.5); speedLines(g, p.x, p.y, t, MT); }
  }, { hud: (g, lt, t) => { if (t >= MT) badge(g, 'CHECKMATE', W / 2, 230, { color: HI.bad, size: 60, ...pop(t, MT) }); } });
  cue(blS - 0.06, 'whoosh_soft', 0.25); cue(kfA + SLIDE - MOVE_HIT, 'move', 0.7); cue(mateT, 'heartbeat', 0.4);
  cue(MT - 0.32, 'revswell', 0.9); cue(MT - 0.004, 'boom', 0.9); cue(MT - BOOM_HIT, 'boom_big', 0.45); cue(MT + 0.3, 'gasp', 0.4);

  // ======================= HIKARU GRABS THE KING: off the board, in front of Gukesh =======================
  const thS = s('throw'), grabT = w('throw', 'grabs'), kingT = w('throw', 'king'), throwsT = w('throw', 'throws'), landT = w('throw', 'crowd');
  shot(thS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.35, 0.2, 6.5, [5, 1.8, 8], { cy: H * 0.4 })], [len(sh), K(PI / 2 - 0.3, 0.24, 6, [5, 2, 8], { cy: H * 0.4 })]], { t });
    const ky = lerp(0, 1.6, seg(t, grabT + 0.05, grabT + 0.3, ease.out)), u = seg(t, thS - 0.05, grabT, ease.out);
    const pieces = board(G, 111).map(p => p.id === 'k1' ? { ...p, y: ky } : p);
    arena(g, t, { led: 'mate', jb: 5, cheer: 0.5, mid: g2 => tableSet(g2, t, { pieces, eg: 'shock', hReach: { x: 5.5, z: 7.5, y: ky + 1.0, u, hold: true }, hSide: -1,
      under: g3 => ledGlow(g3, B, 'd8', HI.bad, t, MT) }) });
  });
  cue(grabT - 0.03, 'fabric', 0.5); cue(grabT + 0.1, 'gasp', 0.45);
  // ======================= ...AND THE KING HIGH OVER HIS HEAD (low, across the board; the CHECKMATE wall behind him) =======================
  const raiseA = kingT - 0.19, throwA = throwsT - 0.1;
  shot(raiseA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.2, -0.1, 9, [6, 3, -2.6])], [len(sh), K(PI + 0.3, -0.08, 8.2, [6.2, 3.3, -2.6])]], { t });
    arena(g, t, { led: 'mate', jb: 5, cheer: 0.6, mid: g2 => tableSet(g2, t, { pieces: mated, eg: 'shock', hStand: g3 => hikStand(g3, t, lerp(0.15, 0.3, seg(t, raiseA, raiseA + 0.3)), true) }) });
  });
  cue(raiseA, 'whoosh_soft', 0.3); cue(raiseA + 0.1, 'cheer', 0.35);
  // ======================= THROWS IT INTO THE CROWD: wind-up, release, the arc, the catch =======================
  const REL_T = throwA + 0.3;
  const armAt = tt => tt < throwA + 0.15 ? lerp(0.3, 0.5, seg(tt, throwA, throwA + 0.15, x => x)) : tt < REL_T ? lerp(0.5, 0.62, seg(tt, throwA + 0.15, REL_T, x => x))
    : tt < REL_T + 0.3 ? lerp(0.62, 0.8, seg(tt, REL_T, REL_T + 0.3, x => x)) : lerp(0.8, 1, seg(tt, REL_T + 0.3, REL_T + 0.8));
  const TK = [[0, K(PI + 0.42, 0.12, 11, [6.5, 4.2, -2])], [0.3, K(PI + 0.45, 0.12, 10.5, [6.8, 4.6, -2])]];
  B.setCam(TK[1][1]); const relW = handWorld(6, FLOOR_Y + 7.1, -2.6, -1, 0.62), E1 = [...B.E];
  const fThrow = tt => clamp((tt - REL_T) / (landT - REL_T));
  const CUT_T = REL_T + 0.22;
  const TB = aimKeys(tt => lerp3([13, 13, -3.5], [17.5, 4.9, 0.4], seg(tt, CUT_T, landT + 0.2, ease.inOut)),
    tt => lerp3(kingAt(fThrow(tt), relW), CATCH_HEAD, seg(tt, landT - 0.1, landT + 0.3)), CUT_T, landT + 3, { dt: 0.05, cy: H * 0.42 });
  function throwScene(g, tt) {
    if (tt < CUT_T) rig(B, tt - throwA, TK, { t: tt }); else rig(B, tt - CUT_T, TB, { t: tt, e: x => x, shake: 0.5 });
    const a = armAt(tt);
    arena(g, tt, { led: 'mate', jb: 5, cheer: 0.5, land: LAND, tLand: landT, mid: g2 => tableSet(g2, tt, { pieces: mated, eg: 'shock', hStand: g3 => hikStand(g3, tt, a, a < 0.62) }),
      over: g2 => flyingKing(g2, fThrow(tt), { rel: relW }) });
  }
  shot(throwA, (g, lt, t) => throwScene(g, t));
  shot(CUT_T, (g, lt, t) => throwScene(g, t), { trans: 'whip', kb: 0 });
  cue(throwA, 'whoosh_soft', 0.3); cue(REL_T, 'whoosh_fast', 0.5); cue(REL_T + 0.2, 'gasp', 0.4);
  cue(landT, 'applause', 0.7); cue(landT, 'cheer', 0.6); cue(landT + 0.15, 'laugh', 0.3);

  // ======================= FIDE'S CEO: the clip is playing on a phone in the dark; a swipe, his post =======================
  const bkS = s('backlash'), ceoT = w('backlash', 'ceo'), ratherT = w('backlash', 'rather'), bkA = bkS - 0.06;
  shot(bkA, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); throwScene(feedx, t);
    const r = seg(lt, 0.15, 1.3);
    phoneHand(g, lt, t, [[0, K(0, 0, 1.0, [4, 2, 3.998])], [1.1, K(-0.35, 0.1, 3.0, [4.1, 1.8, 4])], [1.6, K(-0.3, 0.09, 2.8, [4.1, 1.85, 4])],
      [ratherT - bkA + 0.5, K(-0.12, 0.04, 1.55, [4, 2.25, 4])], [len(sh), K(-0.1, 0.04, 1.45, [4, 2.25, 4])]],
      phoneScreen(FEED, t, ceoT, { mark: seg(t, ratherT, ratherT + 0.5, x => x) }), { sway: r, shake: 0.6 * r, vig: r });
  }, { kb: 0, hud: (g, lt, t) => { if (t >= ceoT) nameTitle(g, lt, 'Emil Sutovsky', 'FIDE CEO', { y: 200, size: 60, t0: ceoT - (t - lt) }); } });
  cue(ceoT - 0.05, 'swipe_card', 0.4); cue(ceoT + 0.1, 'notify', 0.35); cue(ratherT, 'pen', 0.35);

  // ======================= BUT IT WAS PLANNED: VHS rewind of the throw, paused =======================
  const twS = s('twist'), planT = w('twist', 'planned'), gothT = w('twist', 'gothamchess'), rwA = twS - 0.06;
  shot(rwA, (g, lt, t) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); throwScene(feedx, Math.max(REL_T - 0.08, landT + 0.7 - (t - rwA) * 1.57));
    vhs(g, FEED, t, { osd: t >= planT ? '❚❚ PAUSE' : '◀◀ REW' });
  }, { hud: (g, lt, t) => stamp(g, 'PLANNED', W / 2, 520, t, planT, { color: GOLD }) });
  cue(rwA, 'record_scratch', 0.5); cue(planT, 'stamp', 0.6); cue(planT + 0.05, 'dun_dun', 0.35);
  // ======================= GOTHAMCHESS (the real photo) =======================
  shot(gothT - 0.06, (g, lt, t) => photoShot(g, lt, PH.levy, { from: { x: 0.5, y: 0.4, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.42, zoom: 1.08, dolly: 0.05 }, dur: 1.5 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Levy Rozman', 'GOTHAMCHESS', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.levy, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(gothT - 0.12, 'whoosh_fast', 0.3);
  // ======================= THE WINNER WAS SUPPOSED TO THROW THE KING: the plan drawn over the arena =======================
  const planA = w('twist', 'the') - 0.05, winrT = w('twist', 'winner'), supT = w('twist', 'supposed'), tkT = w('twist', 'king');
  const planP = v => [lerp(4, LAND[0], v), lerp(1.4, LAND[1], v) + Math.sin(PI * v) * 9, lerp(4, LAND[2], v)];
  shot(planA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.25, 0.55, 30, [14, 1.5, 3])], [len(sh), K(-PI / 2 + 0.3, 0.52, 27, [14.5, 2, 3])]], { t });
    const u = seg(t, supT, tkT + 0.1, x => x);
    arena(g, t, { led: 'vs', jb: 0, cheer: 0.1, mid: g2 => tableSet(g2, t, { pieces: board(G, 0) }),
      over: g2 => {
        tag3(g2, 4, 8.5, 4, 'WINNER', GOLD, seg(t, winrT, winrT + 0.3, x => x)); dotArc(g2, planP, u);
        const q = planP(u); if (u > 0 && depth(...q) > 1) { const p = B.project(...q), h = p.s * 1.4; g2.save(); g2.globalAlpha *= 0.75; rim(g2, p.x, p.y, h, GOLD, 0.35); drawPiece(g2, 'k', 'b', p.x, p.y + h * 0.5, h, { glow: GOLD }); g2.restore(); }
      } });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    g.save(); g.globalAlpha = seg(lt, 0.15, 0.4); g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
    g.fillText('“…supposed to toss the king', W / 2, 170); g.fillText('to the fans.”', W / 2, 232);
    g.font = sans(22, 800); g.letterSpacing = '5px'; g.fillStyle = GOLD; g.fillText('LEVY ROZMAN · GOTHAMCHESS', W / 2, 286); g.restore();
    qaRect(g, 100, 125, W - 200, 175, 'text', 'quote');
  } });
  cue(planA, 'whoosh_deep', 0.3); cue(winrT, 'sparkle_pop', 0.3); cue(supT, 'whoosh_soft', 0.25); cue(tkT + 0.1, 'cheer', 0.3);

  // ======================= HIKARU: "IF I WON, I WAS ALWAYS GONNA THROW THE KING" (the photo again) =======================
  const quS = s('quote');
  shot(quS - 0.05, (g, lt, t) => photoShot(g, lt, PH.hikaru, { from: { x: 0.52, y: 0.35, zoom: 1.12, dolly: 0 }, to: { x: 0.54, y: 0.37, zoom: 1.22, dolly: 0.06 }, dur: 3.9, dim: 0.25 }),
    { hud: (g, lt, t) => {
      g.save(); g.globalAlpha = seg(lt, 0.15, 0.4); g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
      g.fillText('“If I won, I was always', W / 2, 170); g.fillText('gonna throw the king.”', W / 2, 232);
      g.font = sans(22, 800); g.letterSpacing = '5px'; g.fillStyle = GOLD; g.fillText('HIKARU NAKAMURA · 2025', W / 2, 286); g.restore();
      qaRect(g, 100, 125, W - 200, 175, 'text', 'quote'); credit(g, CREDITS.hikaru, seg(lt, 0.4, 0.6) * 0.75, 330);
    } });
  cue(quS - 0.05, 'whoosh_soft', 0.25); cue(w('quote', 'throw'), 'dun_dun', 0.25);

  // ======================= THREE WEEKS LATER, SAINT LOUIS: the arc over the map =======================
  const rvS = s('revenge'), stlT = w('revenge', 'saint'), sameT = w('revenge', 'same'), thisT = w('revenge', 'this'), gwT = w('revenge', 'wins');
  const midAS = [(ARL[0] + STL[0]) / 2, 0, (ARL[1] + STL[1]) / 2];
  shot(rvS - 0.06, (g, lt, t, sh) => usSet(g, lt, t, [[0, K(0.1, 0.95, 10, [ARL[0], 0.5, ARL[1]])], [1.0, K(0.0, 0.85, 11, [midAS[0], 1.2, midAS[2]])], [len(sh), K(-0.05, 0.8, 9, [STL[0], 0.6, STL[1]])]],
    { pinA: 1, tA: 0, arc: seg(t, rvS + 0.05, stlT - 0.05, x => x), pinB: seg(t, stlT - 0.05, stlT + 0.3, x => x), tB: stlT + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { if (t < stlT) heading(g, '3 WEEKS LATER', 200, seg(lt, 0, 0.15)); else placeStamp(g, lt, 'Saint Louis', 'OCT 27, 2025', { y: 200, t0: stlT - (t - lt) }); } });
  cue(rvS - 0.12, 'whoosh_fast', 0.3); cue(rvS + 0.05, 'whoosh_soft', 0.25); boom(stlT + 0.3, 0.45);
  // ======================= SAME TWO PLAYERS: the club, both of them from the side =======================
  shot(sameT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 - 0.1, 0.3, 11.5, [4, 2.4, 4], { fov: 850 })], [len(sh), K(-PI / 2 - 0.05, 0.28, 10.8, [4, 2.4, 4], { fov: 850 })]], { t });
    clubSet(g, t, { pieces: board(G2, 80), eh: 'focus', eg: 'focus' });
  }, { trans: 'zoom' });
  cue(sameT - 0.08, 'whoosh_deep', 0.3);
  // ======================= THIS TIME GUKESH WINS: 46...Qxf2, Hikaru's king goes over =======================
  const qA = gwT - 0.36, m92 = moveOf(G2, 92);
  shot(thisT - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.42, 8.5, [5, 0.8, 3.5])], [len(sh), K(0.24, 0.4, 7.6, [5.2, 0.8, 3])]], { t });
    const top = seg(t, gwT + 0.1, gwT + 0.35, ease.in);
    const pieces = (t < qA ? piecesAt(G2, 91) : piecesAt(G2, 92, slide(t - qA), SLIDE_OPTS)).map(p => p.id === 'K1' ? { ...p, rot: -1.35 * top } : p);
    clubSet(g, t, { pieces, eg: 'focus', eh: t > gwT ? 'sad' : 'worried', gReach: { sq: 'f2', u: seg(t, qA - 0.45, qA + 0.95, x => x) },
      under: g2 => moveUnder(g2, B, m92, t - qA), over: g2 => moveOver(g2, B, m92, t - qA) });
  }, { hud: (g, lt, t) => { if (t >= gwT) badge(g, 'GUKESH WINS', W / 2, 230, { color: '#FF9933', size: 50, ...pop(t, gwT) }); } });
  cue(qA + SLIDE - MOVE_HIT, 'move_capture', 0.8); boom(qA + SLIDE, 0.6); cue(gwT + 0.33, 'thud', 0.4);

  // ======================= NO THROW: a handshake over the board =======================
  const rsS = s('reset'), thrT = w('reset', 'throw'), no2T = w('reset', 2), heT2 = w('reset', 'he'), backT = w('reset', 'back');
  const endPos = board(G2, 92).map(p => p.id === 'K1' ? { ...p, rot: -1.35 } : p);
  shot(rsS - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.08, 0.25, 10.8, [4, 2.2, 4], { fov: 850 })], [len(sh), K(PI / 2 + 0.04, 0.24, 10, [4, 2.2, 4], { fov: 850 })]], { t });
    clubSet(g, t, { pieces: endPos, eg: 'neutral', eh: 'sad', arms: g2 => handshake(g2, t, seg(t, rsS - 0.05, rsS + 0.3, x => x), rsS + 0.3) });
  }, { hud: (g, lt, t) => { if (t >= thrT) badge(g, 'NO THROW', W / 2, 230, { color: CREAM, size: 46, ...pop(t, thrT) }); } });
  cue(rsS - 0.06, 'whoosh_soft', 0.25); cue(rsS + 0.3, 'fabric', 0.4);
  // ======================= NO CELEBRATION: his face, calm =======================
  shot(no2T - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.15, 0.12, 6, [4, 3.1, 9.3])], [len(sh), K(0.1, 0.1, 5.2, [4, 3.15, 9.3])]], { t });
    clubSet(g, t, { pieces: endPos, eg: { ...EXPR.neutral, look: [0, 0.7], lid: 0.3 } });
  }, { hud: (g, lt, t) => { if (t >= no2T) badge(g, 'NO CELEBRATION', W / 2, 230, { color: CREAM, size: 46, ...pop(t, no2T) }); } });
  cue(no2T - 0.06, 'whoosh_soft', 0.2);
  // ======================= HE JUST PUTS EVERY PIECE BACK: the black king last, set down by hand on e8 =======================
  const rsA = heT2 - 0.08;
  const resetScene = (g, t) => {
    rig(B, t - rsA, [[0, K(PI + 0.25, 0.75, 10, [4, 0, 4])], [2.6, K(PI + 0.12, 0.8, 9, [4, 0, 4.2])], [4.6, K(PI + 0.08, 0.82, 8.6, [4, 0, 4.3])]], { t });
    const ps = resetPieces(t, rsA + 0.15, backT - 0.6, backT), k = ps.find(p => p.id === 'k1');
    const u = t < backT ? seg(t, backT - 0.75, backT - 0.5, x => x) : 1 - seg(t, backT + 0.15, backT + 0.55, x => x);
    clubSet(g, t, { pieces: ps, eg: { ...EXPR.neutral, look: [0, 0.8], lid: 0.3 }, eh: 'tired', gReach: { x: k.x, z: k.z, y: k.y + 1.05, u, hold: true } });
  };
  shot(rsA, (g, lt, t) => resetScene(g, t), { trans: 'whip', kb: 0 });
  cue(rsA - 0.06, 'whoosh_fast', 0.25); for (let i = 0; i < 7; i++) cue(rsA + 0.2 + i * 0.13, 'piece', 0.22); cue(backT - MOVE_HIT, 'move', 0.7); cue(backT, 'reveal_bell', 0.4);

  // ======================= THE INTERNET CALLED IT REVENGE: that clip is one phone of a wall of them =======================
  const inS = s('internet'), revT = w('internet', 'revenge'), LIVE = 6, WP = WALL[LIVE];
  shot(inS - 0.04, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); resetScene(feedx, t);
    const k = seg(lt, 0.2, 1.4);
    phoneWall(g, lt, t, [[0, K(0, 0, 2.222, [WP.x, WP.y, WP.z - 0.06])], [1.6, K(0.15, 0.05, 14, [4, 4.8, 6])], [len(sh), K(0.18, 0.05, 13, [4, 4.8, 6])]],
      { notes: [{ i: 5, t: inS + 0.3 }, { i: 10, t: inS + 0.6 }, { i: 3, t: inS + 0.9 }], live: { i: LIVE, img: FEED, k }, vig: k });
  }, { kb: 0, hud: (g, lt, t) => stamp(g, 'REVENGE', W / 2, 700, t, revT, { color: GOLD }) });
  [0.3, 0.6, 0.9].forEach(x => cue(inS + x, 'notify', 0.3)); cue(revT, 'stamp', 0.6); cue(revT, 'boom_cine', 0.45);

  // ======================= CTA: the arena again, empty; the king still lies on that seat =======================
  const ctaS = s('cta') - 0.06, oneT = w('cta', 'one'), howT = w('cta', 'how'), thr3T = w('cta', 'throw');
  const SK = [CATCH.c[0] - 0.2, CATCH.c[1] + 1.75, CATCH.c[2]];
  shot(ctaS, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.3, 0.35, 4, [SK[0], SK[1] + 0.2, SK[2]])], [3.5, K(-PI / 2 + 0.5, 0.5, 16, [SK[0], SK[1] + 1.5, SK[2]])], [len(sh), K(-PI / 2 + 0.6, 0.55, 22, [SK[0] - 2, SK[1] + 3, SK[2]])]], { t });
    arena(g, t, { led: 'cta', rib: 'cta', fans: false, kingSeat: 1, jb: 5, cone: 0.05, mid: g2 => tableSet(g2, t, { pieces: board(G, 0), players: false }) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'RATE IT: 1 TO 10', W / 2, 230, { color: TEAL, size: 40, a: seg(t, oneT, oneT + 0.1), ...pop(t, oneT) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, howT, howT + 0.1), ...pop(t, howT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, thr3T, thr3T + 0.1) });
  } });
  cue(ctaS - 0.06, 'whoosh_fast', 0.3); cue(oneT, 'sparkle_pop', 0.3); cue(howT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: loopS - 0.06, m: 'intrigue' }, { t: stS - 0.06, m: 'build' }, { t: skS - 0.04, m: 'victory' },
    { t: fmS - 0.06, m: 'clockwork' }, { t: wnS - 0.06, m: 'tension' }, { t: MT, m: 'slam' }, { t: bkA, m: 'digital' },
    { t: rwA, m: 'intrigue' }, { t: rvS - 0.06, m: 'build' }, { t: rsS - 0.06, m: 'elegy' }, { t: inS - 0.04, m: 'finale' },
    { t: ctaS, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: MT - 0.32, t1: MT - 0.01, kind: 'mute' }, { t0: MT, t1: thS - 0.1, kind: 'boost', db: 6 },
    { t0: bkA, t1: rwA - 0.05, kind: 'lp', f: 900 },
    { t0: ctaS, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
