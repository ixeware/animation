// The table slam. 1 June 2025, Norway Chess, round 6, Stavanger: Magnus Carlsen is winning against the world champion
// Gukesh D, runs short of time, blunders a knight (52...Ne2+??), loses the race to Gukesh's knight, resigns and bangs the
// table so hard that pieces fall to the floor; he apologizes, pats Gukesh on the back and walks out. Gukesh: "I have also
// banged a lot of tables in my career." Kasparov: "We'll buy extra-heavy tables!" A month later in Zagreb Carlsen calls
// him "presumably weaker", plays 23.b4?! ("You don't play b4, period!"), loses again (35...e4!) and this time quietly
// sets the pieces back up. Sources, and what is drawn rather than documented: SOURCES.md.
// Rules 42–45 (reference/rausis_v2.md): the slam is the first frame (pieces in the air over the table); every phrase is
// a 3D set the camera moves through (the Stavanger hall: LED walls, drapes, a lighting truss, the stage table with an
// LCD clock and an eval bar; the floor where the pieces land; a dotted map of Europe; a phone whose screen is the slam;
// a steel 1000 KG table dropping onto the Zagreb stage; Kasparov's booth with a wall screen showing the game; the
// Geneva stage); cuts go through objects and screens; the hall of the hook comes back at the end, empty, with the
// pieces still on the floor.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect, hash, smooth } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
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
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream, LIME = C.lime, PHONE = '#9FD8FF';
const GUK_C = '#FF9933', MAG_C = '#6FB2FF', ZAG_C = '#E0457B', SIN_C = '#7FE0D0';
// Norway (Gukesh White; ply 104 = 52...Ne2+??, 121 = 61.Nc4+, 123 = 62.Kf4, then Carlsen resigned) and Zagreb (Carlsen
// White; ply 45 = 23.b4, 70 = 35...e4, 98 = 49...Rxa5, then Carlsen resigned)
const N = await fetch('../engine/data/gukesh_carlsen_norway2025.json').then(r => r.json());
const Z = await fetch('../engine/data/carlsen_gukesh_zagreb2025.json').then(r => r.json());
const PH = {
  gukesh: await loadPhoto3d('../episodes/tablebang/photos/gukesh2025'),
  carlsen: await loadPhoto3d('../episodes/tablebang/photos/carlsen2025'),
};
const CREDITS = {
  gukesh: 'Photo: Frans Peeters, CC BY-SA 2.0',
  carlsen: 'Photo: Miroslav.vajdic, CC BY 4.0',
};
const MAP = await new DotMap().init();

// ---------- cast: Gukesh after the 2025 photo (slim face, black hair swept up, a dark jacket over an open shirt);
// Carlsen in a navy jacket in Stavanger and the white one in Zagreb; Kasparov grey now, with commentary headphones ----------
const BROWN = { base: '#B57A52', shade: '#9C6542', deep: '#7A4B30', blush: '#B8685A', hi: '#CC9572' };
CAST.guk = { face: [0.92, 1.06, 0.86], hair: 'swept', hairC: '#141010', brow: '#100C0A', suit: '#30394A', suitD: '#222936', shirt: 'open', ears: 1.04, skin: BROWN };
CAST.mag = { ...CAST.magnusNY };
CAST.magZ = { ...CAST.magnus };
CAST.kas = { ...CAST.kasparov, hair: 'receding', hairC: '#8E8A84', brow: '#6E6A64', headphones: '#15171C' };
const skinOf = who => ({ ...SKIN2, ...(CAST[who].skin || {}) });
// the engine's hands take the skin of the last character drawn: an invisible head sets it before a seated() hand
const useSkin = (g, who) => drawChar(g, who, { alpha: 0, noBody: true });

// ---------- shared with the Rausis and Hikaru episodes (episodes/rausis/scenes.js, episodes/hikaru/scenes.js): screen helpers, the 3D toolkit, standing people ----------
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
const MX = 5;  // Carlsen's seat in Stavanger, a little toward the clock: his fist comes down beside the board

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

// ---------- the slam: the final position (after 62.Kf4) with the captured pieces beside the board; the fist comes
// down at IMP, everything jumps, and six of White's lost pieces by the clock fly off the edge to the floor. A
// fixed-step simulation, run once; frames are kept every 2 steps and read back at any time ----------
const IMP = [8.9, 8.75], SIM_DT = 1 / 240, SIM_T = 2.4, GRAV = 25, FLY = [4, 5, 7, 8, 10, 11];
const SIM = (() => {
  const start = [...board(N, 123).map(p => ({ ...p, y: 0 })), ...capturedAt(N, 123)];
  const st = start.map((p, i) => {
    const h = j => hash(j * 7.31 + i * 1.97 + 0.5), dx = p.x - IMP[0], dz = p.z - IMP[1], d = Math.hypot(dx, dz);
    let o;
    if (p.cap && p.c === 'w' && FLY.includes(p.slot)) o = { vx: (3.4 + h(2) * 0.9 + (10.45 - p.x) * 1.5) * 0.78, vy: 8 + h(1) * 2.4, vz: (h(3) - 0.5) * 2.6, w: (h(4) < 0.5 ? -1 : 1) * (6 + h(4) * 6), top: true };
    else {
      const a = Math.atan2(dz, dx) + (h(3) - 0.5) * 0.8, sp = Math.max(0, 0.25 + 1.6 * Math.exp(-d / 2) + (h(2) - 0.5) * 0.4);
      o = { vx: Math.cos(a) * sp, vy: 6 + 5 * Math.exp(-d / 5) + 1.2 * h(1), vz: Math.sin(a) * sp, w: (h(5) - 0.5) * 4 * Math.exp(-d / 3), top: h(4) < 0.6 * Math.exp(-d / 3) };
    }
    return { x: p.x, y: p.y, z: p.z, rot: 0, rest: false, rotT: 0, ...o };
  });
  const frames = [], hits = [];
  for (let n = 0; n * SIM_DT <= SIM_T + 1e-9; n++) {
    if (n % 2 === 0) frames.push(st.map(s => [s.x, s.y, s.z, s.rot]));
    st.forEach((s, j) => {
      if (s.rest) { s.rot += (s.rotT - s.rot) * Math.min(1, SIM_DT * 16); return; }
      const px = s.x, pz = s.z;
      s.vy -= GRAV * SIM_DT; s.x += s.vx * SIM_DT; s.y += s.vy * SIM_DT; s.z += s.vz * SIM_DT; s.rot += s.w * SIM_DT;
      let sf = surf(s.x, s.z);
      if (s.y < sf - 0.2) { s.x = px; s.z = pz; s.vx *= -0.3; s.vz *= -0.3; sf = surf(s.x, s.z); }  // hit the side of a step: back off it
      if (s.y <= sf && s.vy < 0) {
        s.y = sf;
        if (sf === FLOOR_Y) hits.push({ t: n * SIM_DT, v: -s.vy, j });
        if (-s.vy > 2.2) { s.vy *= -0.3; s.vx *= 0.5; s.vz *= 0.5; s.w *= 0.5; }
        else {  // it settles: upright, or on its side
          s.rest = true; s.vy = 0;
          s.rotT = s.top || Math.abs(Math.sin(s.rot)) > 0.6 ? Math.round((s.rot - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2 : Math.round(s.rot / (2 * Math.PI)) * 2 * Math.PI;
        }
      }
    });
  }
  return { start, frames, hits };
})();
function simAt(ts) {
  const f = clamp(ts, 0, SIM_T) / SIM_DT / 2, i = Math.min(Math.floor(f), SIM.frames.length - 2), u = f - i, A = SIM.frames[i], Q = SIM.frames[i + 1];
  return SIM.start.map((p, j) => {  // in the air a piece also leans a little, straightening as it comes down
    const x = lerp(A[j][0], Q[j][0], u), y = lerp(A[j][1], Q[j][1], u), z = lerp(A[j][2], Q[j][2], u);
    return { ...p, x, y, z, rot: lerp(A[j][3], Q[j][3], u) + (hash(j * 3.7 + 1.3) - 0.5) * 1.1 * clamp((y - surf(x, z)) / 0.8, 0, 1) };
  });
}

// ---------- the LCD clock beside the board and the eval bar (both games: names and colours per game) ----------
const fmtC = s => { s = Math.max(0, s); return s >= 20 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.floor(s)}.${Math.floor(s * 10) % 10}`; };
const NOR_CLK = { names: ['GUKESH', 'CARLSEN'], cols: [GUK_C, MAG_C] }, ZAG_CLK = { names: ['CARLSEN', 'GUKESH'], cols: [MAG_C, GUK_C] };
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
function evalBar(g, v, { label = null, u = 1, cols = [GUK_C, MAG_C] } = {}) {
  const f = 0.5 + 0.3 * clamp(-v / 4.2, -1, 1), ym = lerp(-0.35, 6, 1 - f);
  ab(g, [-1.05, -0.35, 3.75], [-0.45, ym, 4.25], '#ECECEC', { amb: 0.75 });
  ab(g, [-1.05, ym, 3.75], [-0.45, 6, 4.25], '#121417', { amb: 0.7 });
  tag3(g, -0.75, 6.9, 4, label ?? (v > 0.05 ? '+' : v < -0.05 ? '−' : '') + Math.abs(v).toFixed(1), v > 1 ? cols[0] : v < -1 ? cols[1] : CREAM, u);
}

// ---------- Kasparov's extra-heavy table, delivered: a steel pedestal stencilled 1000 KG, hazard stripes round the top ----------
const STEEL = ['#8A939E', '#555D68', '#3A4149'];
const STENCIL = tex(1024, 256, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6C7580'); gr.addColorStop(1, '#474E58'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 64; i < w; i += 64) x.fillRect(i, 0, 2, h);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = sans(120, 900); x.letterSpacing = '10px'; x.fillStyle = GOLD; x.fillText('1000 KG', w / 2, h * 0.44);
  x.font = sans(40, 900); x.letterSpacing = '12px'; x.fillStyle = '#1A1D22'; x.fillText('EXTRA HEAVY', w / 2, h * 0.84);
  x.fillStyle = '#2A2F36'; for (const [px, py] of [[28, 28], [w - 28, 28], [28, h - 28], [w - 28, h - 28]]) { x.beginPath(); x.arc(px, py, 10, 0, 7); x.fill(); }
});
const HAZARD = tex(1024, 32, (x, w, h) => {
  x.fillStyle = '#16181C'; x.fillRect(0, 0, w, h); x.fillStyle = GOLD;
  for (let i = -48; i < w + 48; i += 48) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + 24, h); x.lineTo(i + 24 + h, 0); x.lineTo(i + h, 0); x.closePath(); x.fill(); }
});
function steelTable(g, { x1 = 10.6, dy = 0 } = {}) {
  const E = B.E, y0 = FLOOR_Y + dy, y1 = -0.75 + dy, e = 0.02;
  ab(g, [-0.4, y0, -0.4], [x1, y1, 8.4], STEEL[1], { spec: 0.3 });
  if (E[2] < -0.4) texQuad(g, STENCIL, [-0.4, y1, -0.4 - e], [x1, y1, -0.4 - e], [-0.4, y0, -0.4 - e]);
  if (E[2] > 8.4) texQuad(g, STENCIL, [x1, y1, 8.4 + e], [-0.4, y1, 8.4 + e], [x1, y0, 8.4 + e]);
  if (E[0] > x1) texQuad(g, STENCIL, [x1 + e, y1, -0.4], [x1 + e, y1, 8.4], [x1 + e, y0, -0.4]);
  if (E[0] < -0.4) texQuad(g, STENCIL, [-0.4 - e, y1, 8.4], [-0.4 - e, y1, -0.4], [-0.4 - e, y0, 8.4]);
  const t0 = -0.75 + dy, t1 = -0.35 + dy, X0 = -1.1, X1 = x1 + 0.7, Z0 = -1.1, Z1 = 9.1;
  ab(g, [X0, t0, Z0], [X1, t1, Z1], STEEL[0], { spec: 0.5 });
  if (E[2] < Z0) texQuad(g, HAZARD, [X0, t1, Z0 - e], [X1, t1, Z0 - e], [X0, t0, Z0 - e]);
  if (E[2] > Z1) texQuad(g, HAZARD, [X1, t1, Z1 + e], [X0, t1, Z1 + e], [X1, t0, Z1 + e]);
  if (E[0] > X1) texQuad(g, HAZARD, [X1 + e, t1, Z0], [X1 + e, t1, Z1], [X1 + e, t0, Z0]);
  if (E[0] < X0) texQuad(g, HAZARD, [X0 - e, t1, Z1], [X0 - e, t1, Z0], [X0 - e, t0, Z1]);
}
// the dust it raises when it lands: soft puffs rolling out from the foot of the pedestal
function dust(g, t, t0) {
  const lt = t - t0; if (lt < 0 || lt > 1.6) return;
  const u = lt / 1.6;
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 48; i++) {
    const h1 = hash(i * 3.1 + 0.3), h2 = hash(i * 5.7 + 1.1), h3 = hash(i * 1.3 + 2.9), per = h1 * 39.6;
    let x, z, nx = 0, nz = 0;
    if (per < 11) { x = -0.4 + per; z = -0.4; nz = -1; } else if (per < 19.8) { x = 10.6; z = -0.4 + per - 11; nx = 1; }
    else if (per < 30.8) { x = 10.6 - (per - 19.8); z = 8.4; nz = 1; } else { x = -0.4; z = 8.4 - (per - 30.8); nx = -1; }
    const out = ease.out(u) * (1.2 + h2 * 2.4), px = x + nx * out, pz = z + nz * out, py = FLOOR_Y + 0.3 + u * (0.4 + h3 * 0.8);
    if (depth(px, py, pz) < 0.8) continue;
    const p = B.project(px, py, pz), r = p.s * (0.6 + 1.6 * u), a = 0.2 * (1 - u) ** 1.5;
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, rgba('#C9C2B4', a)); gr.addColorStop(1, rgba('#C9C2B4', 0));
    g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
  }
  g.restore();
}

// ---------- the playing hall (Stavanger, then Zagreb and Geneva in other colours): a dark floor, drapes on the sides,
// an LED wall at each end (z 21 behind Black, z -13 behind White), the glowing outline of the stage carpet,
// ceiling lights, the truss and its cones ----------
function hallBg(g) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0A0D14'); gr.addColorStop(1, '#030406');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (B.E[1] < 21) for (let x = -12; x <= 20; x += 8) for (let z = -10; z <= 18; z += 8) {
    if (depth(x, 22, z) < 1) continue; const p = B.project(x, 22, z);
    if (p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) continue;
    rim(g, p.x, p.y, Math.max(8, p.s * 1.8), '#CFE2FF', 0.3); g.fillStyle = 'rgba(235,245,255,0.85)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.15), 0, 7); g.fill();
  }
}
const LEDC = { nor: '#7FB8FF', norRes: GOLD, zag: ZAG_C, zagRes: GOLD, gen: TEAL, cta: GOLD };
function ledTex(mode) {
  return once('led:' + mode, 1280, 720, (x, w, h) => {
    const base = mode.startsWith('zag') ? ZAG_C : mode === 'gen' ? TEAL : '#2A6FDB';
    const gr = x.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.7); gr.addColorStop(0, mix(base, '#000000', 0.55)); gr.addColorStop(1, mix(base, '#000000', 0.9));
    x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const vs = (top, L, R, cl, cr, date) => {
      if (top) { x.font = sans(42, 800); x.letterSpacing = '12px'; x.fillStyle = 'rgba(244,239,230,0.85)'; x.fillText(top, w / 2, h * 0.17); }
      x.font = sans(84, 900); x.letterSpacing = '6px'; x.fillStyle = cl; x.fillText(L, w * 0.27, h * 0.5); x.fillStyle = cr; x.fillText(R, w * 0.73, h * 0.5);
      x.fillStyle = 'rgba(244,239,230,0.3)'; x.fillRect(w / 2 - 3, h * 0.36, 6, h * 0.28);
      x.font = sans(38, 800); x.letterSpacing = '8px'; x.fillStyle = 'rgba(244,239,230,0.7)'; x.fillText(date, w / 2, h * 0.83);
    };
    const res = (score, sub) => {
      x.font = sans(230, 900); x.letterSpacing = '8px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 40; x.fillText(score, w / 2, h * 0.45); x.shadowBlur = 0;
      x.font = sans(46, 900); x.letterSpacing = '10px'; x.fillStyle = CREAM; x.fillText(sub, w / 2, h * 0.8);
    };
    if (mode === 'nor') vs('STAVANGER · ROUND 6', 'GUKESH', 'CARLSEN', GUK_C, MAG_C, 'JUNE 1, 2025');
    else if (mode === 'zag') vs('ZAGREB · RAPID', 'CARLSEN', 'GUKESH', MAG_C, GUK_C, 'JULY 3, 2025');
    else if (mode === 'gen') vs(null, 'GUKESH', 'SINDAROV', GUK_C, SIN_C, 'TITLE MATCH · NOV 24 – DEC 12, 2026');  // the top row would sit under the quote
    else if (mode === 'norRes') res('1 – 0', 'GUKESH WINS');
    else if (mode === 'zagRes') res('0 – 1', 'GUKESH WINS');
    else if (mode === 'cta') res('1 – 10', 'HOW WEAK IS THE CHAMPION?');
    ledGrid(x, w, h);
  });
}
// side +1: the wall behind Black (z 21, facing -z); -1: the wall behind White (z -13)
function ledWall(g, mode, side) {
  const img = ledTex(mode), col = LEDC[mode], z = side > 0 ? 21 : -13, zf = z + side * 0.3;
  ab(g, [-9.4, -1.8, Math.min(z, zf)], [17.4, 13.6, Math.max(z, zf)], '#0C0F14');
  if (side > 0) texQuad(g, img, [-9, 13.2, 20.98], [17, 13.2, 20.98], [-9, -1.4, 20.98]);
  else texQuad(g, img, [17, 13.2, -12.98], [-9, 13.2, -12.98], [17, -1.4, -12.98]);
  pool(g, B, 4, 6, z - side * 0.1, 20, col, 0.12, true);
  pool(g, B, 4, FLOOR_Y + 0.02, z - side * 4, 14, col, 0.1);
}
function hall(g, t, { led = 'nor', carpet = '#7FB8FF', mid = null, over = null, cone = 0.07 } = {}) {
  const E = B.E;
  hallBg(g);
  if (E[1] > FLOOR_Y) tiled(g, [-14, FLOOR_Y, -13], [36, 0, 0], [0, 0, 34], { color: '#0B0E12', grout: 'rgba(160,190,220,0.05)', tu: 3 });
  const drape = { color: '#150F14', grout: 'rgba(0,0,0,0.45)', tu: 1.1, tv: 40, lw: 5 };
  if (E[0] > -14) tiled(g, [-14, FLOOR_Y, 21], [0, 0, -34], [0, 24, 0], drape);
  if (E[0] < 22) tiled(g, [22, FLOOR_Y, -13], [0, 0, 34], [0, 24, 0], drape);
  if (E[2] < 21) ledWall(g, led, 1);
  if (E[2] > -13) ledWall(g, led, -1);
  pool(g, B, 4, FLOOR_Y, 4, 12, '#FFE2B8', 0.14);
  g.save(); g.strokeStyle = rgba(carpet, 0.85); g.lineWidth = 3; g.shadowColor = carpet; g.shadowBlur = 18; g.beginPath();
  const y = FLOOR_Y + 0.01; line3(g, [-3, y, -4], [13, y, -4]); line3(g, [13, y, -4], [13, y, 12]); line3(g, [13, y, 12], [-3, y, 12]); line3(g, [-3, y, 12], [-3, y, -4]);
  g.stroke(); g.restore();
  if (mid) mid(g);
  truss(g, t); cones(g, t, cone);
  if (over) over(g);
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- the stage table: White at z -1.4, Black at z 9.3 (seats wx, bx), the clock and the captured pieces on the
// right, the eval bar on the left; loose pieces (beside the board, in the air, on the floor) drawn in depth with the
// table, the clock and the board; the steel table in Zagreb ----------
const TABLE = ['#1A1D22', '#0E1013', '#121418'], CHAIR = '#1A1E24';
function tableSet(g, t, { pieces = null, loose = [], ew = 'focus', eb = 'focus', wReach = null, bReach = null, wSide = -1, bSide = 1, white = 'guk', black = 'mag', wx = 4, bx = 4,
  under = null, over = null, clock = null, press = 0, evalV = null, evalLabel = null, evalCols = [GUK_C, MAG_C], wPlayer = true, bPlayer = true, wChair = true, bChair = true,
  steel = false, steelY = 0, slab = true, behind = null, front = null, arms = null, focus = null } = {}) {
  const E = B.E;
  if (behind) behind(g);
  if (wChair && E[2] > -1.4) chair(g, B, wx, -1.9, { face: 1, color: CHAIR });
  if (bChair && E[2] < 9.3) chair(g, B, bx, 9.8, { face: -1, color: CHAIR });
  const seatW = () => wPlayer ? seated(g, B, white, ew, t, { x: wx, z: -1.4, face: 1, reach: wReach, side: wSide }) : null;
  const seatB = () => bPlayer ? seated(g, B, black, eb, t, { x: bx, z: 9.3, face: -1, reach: bReach, side: bSide }) : null;
  const wFar = E[2] > 4;  // the far player first
  let hw = null, hb = null;
  if (wFar) { hw = seatW(); hb = seatB(); } else { hb = seatB(); hw = seatW(); }
  drawLoose(g, loose.filter(p => zoneOf(p) === 'out' && !outLate(p)));
  if (steel) steelTable(g, { dy: steelY }); else table(g, B, { table: TABLE }, { x1: 10.6 });
  const barLate = E[0] < -1.5, sideLate = E[0] > 8.6;
  if (evalV !== null && !barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols });
  const side = loose.filter(p => zoneOf(p) === 'side');
  const sideDraw = () => {  // the captured pieces behind the clock, the clock, those in front of it
    const dc = depth(9.9, 0.1, 4);
    drawLoose(g, side.filter(p => depth(p.x, p.y, p.z) > dc));
    if (clock) lcdClock(g, clock, press);
    drawLoose(g, side.filter(p => depth(p.x, p.y, p.z) <= dc));
  };
  if (!sideLate) sideDraw();
  if (slab) B.drawSlab(g, SLATE);
  if (under) under(g);
  if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof: 1.4 });
  drawLoose(g, loose.filter(p => zoneOf(p) === 'brd'));
  if (sideLate) sideDraw();
  if (over) over(g);
  drawLoose(g, loose.filter(p => zoneOf(p) === 'out' && outLate(p)));
  if (evalV !== null && barLate) evalBar(g, evalV, { label: evalLabel, cols: evalCols });
  if (arms) arms(g);
  for (const [who, f] of wFar ? [[white, hw], [black, hb]] : [[black, hb], [white, hw]]) if (f) { useSkin(g, who); f(); }
  if (!wPlayer && wChair && E[2] < -1.4) chair(g, B, wx, -1.9, { face: 1, color: CHAIR });
  if (!bPlayer && bChair && E[2] > 9.3) chair(g, B, bx, 9.8, { face: -1, color: CHAIR });
  if (front) front(g);
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
function handshake(g, t, u, t0) {
  const meet = [4.5, 1.5 + (u >= 1 ? Math.sin((t - t0) * 14) * 0.08 * clamp(1 - (t - t0) / 0.9) : 0), 4.1];
  const e = ease.inOut(clamp(u));
  for (const [sh, who, sd] of [[[5.3, 1.0, -1.0], 'guk', 1], [[MX - 1.3, 1.0, 9.0], 'mag', -1]]) {
    const c = CAST[who], rest = [sh[0], 0.3, lerp(sh[2], 4.1, 0.25)];
    const hnd = [lerp(rest[0], meet[0] + sd * 0.08, e), lerp(rest[1], meet[1], e), lerp(rest[2], meet[2] - sd * 0.12, e)];
    const elbow = [lerp(sh[0], hnd[0], 0.5) + sd * 0.25, lerp(sh[1], hnd[1], 0.5) - 0.35, lerp(sh[2], hnd[2], 0.5)];
    limb(g, sh, elbow, 0.36, 0.3, c.suit, c.suitD); limb(g, elbow, hnd, 0.3, 0.22, c.suit, c.suitD);
    if (depth(...hnd) > 0.5) { const p = B.project(...hnd); hand2(g, p.x, p.y, p.s * 0.3, skinOf(who)); }
  }
}

// ---------- the interview in Zagreb: Carlsen in his white jacket before a pink backdrop, a reporter's microphone ----------
const BACKDROP = tex(1280, 1024, (x, w, h) => {
  const gr = x.createRadialGradient(w * 0.5, h * 0.45, 40, w * 0.5, h * 0.45, w * 0.75); gr.addColorStop(0, '#5A1838'); gr.addColorStop(1, '#14060E');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.strokeStyle = rgba(ZAG_C, 0.18); x.lineWidth = 26; for (let i = -h; i < w; i += 150) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + h * 0.6, 0); x.stroke(); }
  x.fillStyle = 'rgba(255,220,235,0.08)'; for (let i = 0; i < 160; i++) { x.beginPath(); x.arc(hash(i * 1.7) * w, hash(i * 2.9 + 1) * h, 2 + hash(i * 4.1) * 4, 0, 7); x.fill(); }
});
function interview(g, t, { e = 'neutral' } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#12060C'); gr.addColorStop(1, '#050204'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  texQuad(g, BACKDROP, [-6, 11, 9], [14, 11, 9], [-6, -5, 9]);
  bokeh(g, t, { n: 10, seed: 51, y0: 0.05, y1: 0.6, a: 0.14, size: [60, 160], colors: ['#FFB0D0', '#FFD9A0', ZAG_C] });
  actor(g, B, 'magZ', { x: 4, y: 3.1, z: 6, face: -1, e, t });
  limb(g, [8.5, -1.5, 4.2], [6.3, 0.55, 4.7], 0.34, 0.24, '#2A2F38');  // the reporter's sleeve, from the lower right
  cylinder(g, [6.6, 0.2, 4.6], [4.75, 2.25, 5.3], 0.09, '#16181C', { spec: 0.4 });
  ab(g, [5, 1.53, 4.92], [5.42, 1.95, 5.34], ZAG_C, { spec: 0.3 });  // the mic flag
  lathe(g, 4.68, 5.33, [[2.0, 0.12, 0.12], [2.1, 0.28, 0.28], [2.31, 0.32, 0.32], [2.52, 0.28, 0.28], [2.62, 0.1, 0.1]], '#2A2E34', { n: 20, spec: 0.5 });
  if (depth(6.3, 0.55, 4.7) > 0.5) { const p = B.project(6.3, 0.55, 4.7); hand2(g, p.x, p.y, p.s * 0.3, SKIN2); }
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- Kasparov's commentary booth: a desk with a microphone, a LIVE sign, and a wall screen behind him (9:16,
// so a whole frame of another scene fits it: the camera starts on the screen and pulls back) ----------
const CARD = tex(W, H, (x, w, h) => {
  const gr = x.createRadialGradient(w / 2, h * 0.45, 60, w / 2, h * 0.45, h * 0.7); gr.addColorStop(0, '#3A0E22'); gr.addColorStop(1, '#0A0306');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = sans(64, 800); x.letterSpacing = '14px'; x.fillStyle = 'rgba(244,239,230,0.85)'; x.fillText('ZAGREB · RAPID', w / 2, h * 0.3);
  x.font = sans(300, 900); x.letterSpacing = '10px'; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 50; x.fillText('0 – 1', w / 2, h * 0.47); x.shadowBlur = 0;
  x.font = sans(84, 900); x.letterSpacing = '10px'; x.fillStyle = GUK_C; x.fillText('GUKESH WINS', w / 2, h * 0.6);
  x.font = sans(48, 800); x.letterSpacing = '10px'; x.fillStyle = 'rgba(244,239,230,0.6)'; x.fillText('CARLSEN RESIGNS', w / 2, h * 0.67);
  ledGrid(x, w, h, 10);
});
const LIVESIGN = tex(256, 96, (x, w, h) => {
  x.fillStyle = '#120608'; x.fillRect(0, 0, w, h); x.strokeStyle = '#FF3B3B'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
  x.fillStyle = '#FF3B3B'; x.beginPath(); x.arc(58, h / 2, 14, 0, 7); x.fill();
  x.font = sans(48, 900); x.letterSpacing = '6px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('LIVE', 88, h / 2 + 2);
});
function booth(g, t, { e = 'focus', reach = null, screen = CARD } = {}) {
  const E = B.E, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0C0A10'); gr.addColorStop(1, '#040305'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (E[2] < 14) tiled(g, [-10, FLOOR_Y, 14], [26, 0, 0], [0, 20, 0], { color: '#141019', grout: 'rgba(0,0,0,0.35)', tu: 2.2 });
  quad(g, [[-10, FLOOR_Y, -6], [16, FLOOR_Y, -6], [16, FLOOR_Y, 14], [-10, FLOOR_Y, 14]], '#0A080C');
  bokeh(g, t, { n: 8, seed: 61, y0: 0.05, y1: 0.4, a: 0.12, size: [60, 140], colors: ['#FFD9A0', '#FFB0D0'] });
  texQuad(g, LIVESIGN, [0.2, 9.2, 13.95], [2.6, 9.2, 13.95], [0.2, 8.3, 13.95]);
  ab(g, [4.8, -0.6, 12.5], [10.4, 9.0, 12.9], '#0B0C0F', { spec: 0.3 });  // the screen's bezel
  texQuad(g, screen, [5, 8.8, 12.48], [10.2, 8.8, 12.48], [5, -0.4, 12.48], { under: false });
  pool(g, B, 7.6, 4.2, 12.3, 9, ZAG_C, 0.12, true);
  const hb = seated(g, B, 'kas', e, t, { x: 4, z: 9.3, face: -1, reach, side: 1 });
  ab(g, [-1.5, FLOOR_Y, 6.6], [10.5, -0.5, 8.4], '#171A20');  // the desk
  ab(g, [-1.7, -0.5, 6.4], [10.7, -0.3, 8.6], '#23272F', { spec: 0.3 });
  quad(g, [[1.2, -0.29, 7.0], [2.6, -0.29, 6.9], [2.7, -0.29, 7.9], [1.3, -0.29, 8.0]], '#D8D2C4');  // his notes
  cylinder(g, [5.6, -0.3, 8], [5.6, -0.22, 8], 0.35, '#1A1C20');  // the desk microphone: base, stem, head
  cylinder(g, [5.6, -0.22, 8], [5.1, 1.5, 8.5], 0.05, '#2A2E34');
  cylinder(g, [5.15, 1.35, 8.45], [4.95, 2.0, 8.65], 0.13, '#15171A', { spec: 0.4 });
  useSkin(g, 'kas'); hb();
  lowKey(g, { cy: H * 0.45, a: 0.3 });
}

// ---------- a dotted map of Europe on the floor of a dark room: pins on Stavanger, Zagreb, Geneva, gold arcs between.
// 1 degree of latitude = 0.5 units, a degree of longitude 0.31 (the latitude of 52°N); north is +z ----------
const EU = { lon0: -12, lon1: 32, lat0: 36, lat1: 66 };
const euXZ = (lon, lat) => [(lon - 10) * 0.31, (lat - 52) * 0.5];
const STAV = euXZ(5.73, 58.97), ZAGR = euXZ(15.98, 45.81), GENV = euXZ(6.14, 46.2);
const EUMAP = tex(Math.round((EU.lon1 - EU.lon0) * 24.8), (EU.lat1 - EU.lat0) * 40, (x, w, h) => {
  x.fillStyle = '#060C12'; x.fillRect(0, 0, w, h);
  for (let lat = EU.lat1 - 0.2; lat > EU.lat0; lat -= 0.42) for (let lon = EU.lon0 + 0.2; lon < EU.lon1; lon += 0.68) {
    const id = MAP.at(lon, lat); if (!id) continue;
    const hi = id === 578 ? '#4F86B8' : id === 191 ? ZAG_C : id === 756 ? TEAL : null;  // Norway, Croatia, Switzerland
    x.fillStyle = hi || '#1E3346'; x.beginPath(); x.arc((lon - EU.lon0) * 24.8, (EU.lat1 - lat) * 40, hi ? 6 : 5, 0, 7); x.fill();
  }
});
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
function euSet(g, lt, t, keys, { pins = [], arcs = [] } = {}) {
  rig(B, lt, keys, { t });
  const bg = g.createRadialGradient(W / 2, H * 0.45, 80, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#0B1520'); bg.addColorStop(1, '#020305');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  texQuad(g, EUMAP, [-6.82, 0, 7], [6.82, 0, 7], [-6.82, 0, -8]);
  for (const [A, Q, u] of arcs) euArc(g, A, Q, u);
  for (const [P, u, t0, col] of pins) { if (u > 0) pool(g, B, P[0], 0.02, P[1], 3, col, 0.12); mapPin(g, P, u, t, t0, col); }
  lowKey(g, { cy: H * 0.45, a: 0.35 });
}

// ---------- a phone in a hand in the dark. Its screen (PHS, 9:16 like the frame) shows first the slam, still playing,
// then a post with Kasparov's words: a plain card, no app's interface copied ----------
const PHS = makeCanvas(), phsx = PHS.getContext('2d');
const PSW = 0.36, PSH = 0.64, PC = [4, 2, 4];  // the screen's half sizes and centre; it faces -z
const POST = tex(W, H, (x, w, h) => {
  x.fillStyle = '#0E1218'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1A212B'; x.fillRect(0, 0, w, 150);
  x.fillStyle = 'rgba(234,242,246,0.75)'; x.font = sans(40, 800); x.textAlign = 'left'; x.fillText('9:41', 50, 92);
  x.fillStyle = '#3A4654'; x.beginPath(); x.arc(130, 300, 70, 0, 7); x.fill();  // no photo: a plain avatar
  x.fillStyle = '#5A6878'; x.beginPath(); x.arc(130, 280, 28, 0, 7); x.fill(); x.beginPath(); x.ellipse(130, 345, 46, 30, 0, Math.PI, 0); x.fill();
  x.fillStyle = CREAM; x.font = sans(52, 900); x.fillText('Garry Kasparov', 230, 290);
  x.fillStyle = 'rgba(234,242,246,0.6)'; x.font = sans(36, 700); x.fillText('@Kasparov63', 230, 345);
  x.fillStyle = CREAM; x.font = serif(110, 700);
  ['“We’ll buy', 'extra-heavy', 'tables!”'].forEach((s, i) => x.fillText(s, 70, 600 + i * 140));
  x.fillStyle = 'rgba(234,242,246,0.4)'; x.font = sans(34, 700); x.fillText('Jun 3, 2025', 70, 1010);
  x.fillStyle = 'rgba(234,242,246,0.15)'; x.fillRect(70, 1060, w - 140, 3);
  x.fillStyle = 'rgba(234,242,246,0.5)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.roundRect(90 + i * 240, 1100, 120, 36, 18); x.fill(); }
  x.fillStyle = 'rgba(234,242,246,0.08)'; for (let i = 0; i < 3; i++) x.fillRect(70, 1220 + i * 150, w - 140 - i * 120, 90);
});
// the screen: feed (a canvas of the frame size) until tSwipe, then the post slides up over it
function phoneScreen(feed, t, tSwipe, { mark = 0 } = {}) {
  phsx.setTransform(1, 0, 0, 1, 0, 0);
  const u = ease.inOut(clamp((t - tSwipe) / 0.3)), oy = H * (1 - u);
  if (u < 1) phsx.drawImage(feed, 0, -u * H);
  if (u > 0) phsx.drawImage(POST, 0, oy);
  if (u > 0 && mark > 0) {  // the marker runs over “extra-heavy”
    phsx.save(); phsx.globalCompositeOperation = 'screen'; phsx.fillStyle = rgba(GOLD, 0.3); phsx.fillRect(60, 645 + oy, 680 * mark, 120); phsx.restore();
    phsx.fillStyle = GOLD; phsx.fillRect(64, 760 + oy, 672 * mark, 8);
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
  const sk = SKIN2, skD = mix(sk.base, '#000000', 0.3), arm = F(0.55, -1.6, 0.9), wrist = F(0.3, -0.62, 0.12);
  limb(g, arm, wrist, 0.3, 0.2, '#2A3442');  // the sleeve, from below right
  limb(g, wrist, F(0.1, -0.28, 0.12), 0.2, 0.26, sk.base, skD);  // the palm, behind the phone
  for (const y of [0.14, -0.08, -0.3]) limb(g, F(-0.15, y, 0.08), F(-0.46, y - 0.03, 0.01), 0.075, 0.066, sk.base, skD);  // fingertips round the left edge
  obox(g, F(0, 0, 0.05), [PSW + 0.05, PSH + 0.06, 0.05], '#121418', R, { spec: 0.6 });
  texQuad(g, screen, F(-PSW, PSH, -0.002), F(PSW, PSH, -0.002), F(-PSW, -PSH, -0.002), { under: false });
  const sp = B.project(...F(0, 0, 0)); rim(g, sp.x, sp.y, sp.s * 1.8, PHONE, 0.22 * vig);
  limb(g, F(0.52, -0.52, 0.03), F(0.34, -0.14, -0.04), 0.1, 0.085, sk.base, skD);  // the thumb over the right edge
  lowKey(g, { cy: H * 0.45, a: 0.3 * vig });
}

// ---------- Zagreb, after the loss: from the final position, captured pieces standing beside the board, every piece
// goes back to its square; his own king last, set down by hand at tKing ----------
function resetPieces(plies, kEnd, t, t0, t1, tKing, lastId) {
  const end = new Map(plies[kEnd].pieces.map(p => [p.id, p])), caps = new Map(capturedAt(plies, kEnd).map(p => [p.id, p])), start = plies[0].pieces;
  const key = p => hash(p.id.charCodeAt(0) * 0.13 + +p.id.slice(1) * 0.37 + (p.c === 'w' ? 0.5 : 0));
  const order = [...start].sort((a, b) => (a.id === lastId) - (b.id === lastId) || key(a) - key(b));
  const n = order.length - 1, out = [];
  order.forEach((p, i) => {
    const last = p.id === lastId, a = last ? tKing - 0.45 : lerp(t0, t1, i / Math.max(1, n - 1)), d = last ? 0.45 : 0.32;
    const u = ease.inOut(clamp((t - a) / d)), onBoard = end.has(p.id), c0 = caps.get(p.id);
    const [x0, z0] = onBoard ? sqXZ(end.get(p.id).sq) : [c0.x, c0.z], y0 = onBoard ? 0 : -0.35, [x1, z1] = sqXZ(p.sq);
    out.push({ ...p, x: lerp(x0, x1, u), z: lerp(z0, z1, u), y: lerp(y0, 0, u) + Math.sin(Math.PI * u) * (last ? 1.2 : 0.9),
      trail: u > 0 && u < 1 ? [x0, z0] : null, trailA: Math.sin(Math.PI * u) * 0.8, side: !onBoard && u <= 0 });
  });
  return out;
}
// the path of Gukesh's knight since 54.Nxf8, as a gold line on the board up to where it is now
function knightTrail(g, k, cur) {
  const pts = []; let last = null;
  for (let j = 106; j < k; j++) { const p = N[j].pieces.find(q => q.id === 'N1'); if (p && p.sq !== last) { pts.push(sqXZ(p.sq)); last = p.sq; } }
  if (cur) pts.push([cur.x, cur.z]);
  if (pts.length < 2) return;
  g.save(); g.strokeStyle = rgba(GOLD, 0.85); g.lineWidth = 6; g.lineCap = g.lineJoin = 'round'; g.shadowColor = GOLD; g.shadowBlur = 16; g.beginPath();
  for (let i = 0; i + 1 < pts.length; i++) line3(g, [pts[i][0], 0.05, pts[i][1]], [pts[i + 1][0], 0.05, pts[i + 1][1]]);
  g.stroke(); g.restore();
}
// a quote in the brilliant type: serif lines, the source in gold under them
function quote(g, lt, lines, src, { cr = null, y = 170 } = {}) {
  const a = seg(lt, 0.15, 0.4), sc = g.createLinearGradient(0, 0, 0, y + 230);
  sc.addColorStop(0, 'rgba(6,8,12,0.78)'); sc.addColorStop(0.7, 'rgba(6,8,12,0.6)'); sc.addColorStop(1, 'rgba(6,8,12,0)');
  g.save(); g.globalAlpha = a; g.fillStyle = sc; g.fillRect(0, 0, W, y + 230); g.restore();
  g.save(); g.globalAlpha = a; g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
  lines.forEach((s, i) => g.fillText(s, W / 2, y + i * 62));
  g.font = sans(22, 800); g.letterSpacing = '5px'; g.fillStyle = GOLD; g.fillText(src, W / 2, y + 116); g.restore();
  qaRect(g, 100, y - 45, W - 200, 175, 'text', 'quote');
  if (cr) credit(g, cr, seg(lt, 0.4, 0.6) * 0.75, y + 160);
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

  // the cuts, in order (a shot runs to the next one)
  const HB = 2.2, IT = 2.7, H3 = 4.2;  // hook: the whip to the fist, the impact, the whip to the floor
  const loopA = s('loop') - 0.05, presT = w('loop', 'presumably'), bigT = w('loop', 'big'), bigA = bigT - 0.08;
  const whoA = s('who') - 0.05, champT = w('who', 'champion'), magA = w('who', 'magnus') - 0.09, oneT = w('who', 'one');
  const norA = s('norway') - 0.06, hallA = w('norway', 'magnus') - 0.04, clearT = w('norway', 'clearly'), winT = w('norway', 'winning');
  const clockA = w('norway', 'then') - 0.05, minT = w('norway', 'minute'), blA = w('norway', 'and') - 0.04, blT = w('norway', 'blunders'), knT = w('norway', 'knight');
  const raceA = s('race') - 0.04, timeT = w('race', 'time'), resA = w('race', 'magnus') - 0.08, resT = w('race', 'resigns');
  const andA = w('race', 'and') - 0.06, MT = andA + 0.7, M2A = MT + 0.5;  // the fist goes up on "and", comes down 0.7 s later
  const wkA = s('walkout') - 0.05, apoT = w('walkout', 'apologizes'), patT = w('walkout', 'pats'), gukT = w('walkout', 'gukesh'), backT = w('walkout', 'back');
  const patA = patT - 0.06, walkA = w('walkout', 'and') - 0.02;
  const tbA = s('tables') - 0.05, reactT = w('tables', 'reaction'), qA = w('tables', 2) - 0.07, bangT = w('tables', 'banged');
  const kpA = s('kasparov') - 0.05, postT = w('kasparov', 'posted'), heavyT = w('kasparov', 'extra-heavy'), tablesT = w('kasparov', -1), dropA = tablesT - 0.4;
  const zgA = s('zagreb') - 0.05, zgT = w('zagreb', 'zagreb'), zhA = w('zagreb', 'gukesh') - 0.08, losT = w('zagreb', 'losing');
  const b4A = s('b4') - 0.04, b4T = w('b4', 3), kasA = w('b4', 'kasparov') - 0.05, youT = w('b4', 'you'), periodT = w('b4', 'period');
  const tnA = s('turn') - 0.04, strT = w('turn', 'strikes'), mgT = w('turn', 'magnus'), resgT = w('turn', 'resigns'), rs2A = resgT - 0.52;
  const qtA = s('quiet') - 0.04, slamT = w('quiet', 'slam'), rsA = w('quiet', 4) - 0.04, upT = w('quiet', 'up'), lvA = w('quiet', 'and') - 0.04;
  const dmA = s('domination') - 0.05, nowQ = w('domination', 'now') - 0.04, domT = w('domination', 'domination');
  const nwA = s('now') - 0.06, gvA = w('now', 'predicts') - 0.04, loseT = w('now', 'lose');
  const ctaA = s('cta') - 0.04, rateT = w('cta', 'one'), howT = w('cta', 'how'), chT = w('cta', 'champion');

  const NORc = { led: 'nor', carpet: '#7FB8FF' }, ZAGc = { led: 'zag', carpet: ZAG_C };
  const DONE = { ...NOR_CLK, l: 131, r: 31, result: '1 – 0' }, ZDONE = { ...ZAG_CLK, l: 26.4, r: 187, result: '0 – 1' };
  const fist = (y, u = 1) => ({ x: IMP[0], z: IMP[1], y, u, hold: true });
  const clacks = (map, a, b) => SIM.hits.filter(h => h.t >= a && h.t <= b).forEach(h => cue(map(h.t), 'piece', clamp(0.15 + h.v * 0.03, 0.15, 0.55)));
  const norSet = (g, t, o = {}) => hall(g, t, { ...NORc, led: o.led || 'nor', mid: g2 => tableSet(g2, t, { bx: MX, ...o }) });
  const slamSet = (g, t, ts, o = {}) => hall(g, t, { ...NORc, led: 'norRes', mid: g2 => tableSet(g2, t, { loose: simAt(ts), bx: MX, eb: 'angry', ew: 'shock', clock: DONE, ...o }) });
  const AFTER = simAt(SIM_T);
  const afterSet = (g, t, o = {}) => hall(g, t, { ...NORc, led: 'norRes', mid: g2 => tableSet(g2, t, { loose: AFTER, bx: MX, clock: DONE, ...o }) });
  const zagSet = (g, t, o = {}) => hall(g, t, { ...ZAGc, led: o.led || 'zag', mid: g2 => tableSet(g2, t, { steel: true, white: 'magZ', black: 'guk', evalCols: [MAG_C, GUK_C], ...o }) });

  // ======================= HOOK (rule 42): the pieces already in the air over the table =======================
  // slow motion just after the slam; a whip to his fist coming down on "slammed" (the pieces jump, slowed again);
  // a whip down to the floor, where they land on "pieces"
  const S2 = 0.05 + (H3 - IT - 0.05) * 0.25;
  const simH = t => t < HB ? 0.27 + 0.05 * t : t < H3 ? (t < IT ? 0 : t - IT < 0.05 ? t - IT : 0.05 + (t - IT - 0.05) * 0.25) : S2 + (t - H3) * 0.85;
  const fistH = t => t < HB ? -0.1 : t < IT - 0.08 ? lerp(1, 4.6, ease.out(seg(t, HB, IT - 0.08, lin))) : t < IT ? lerp(4.6, -0.1, ease.in(seg(t, IT - 0.08, IT, lin)))
    : t < IT + 0.8 ? -0.1 : lerp(-0.1, 0.4, seg(t, IT + 0.8, H3));
  const hookSet = (g, t, o = {}) => slamSet(g, t, simH(t), { bReach: fist(fistH(t)), ...o });
  const hookHud = (g, lt, t) => heading(g, 'MAGNUS LOST IT', 170, 1, { size: 56 });
  shot(0, (g, lt, t) => {
    rig(B, lt, [[0, K(0.35, 0.2, 9.5, [7.4, 1.5, 7.4])], [HB, K(0.42, 0.17, 8.2, [7.6, 1.6, 7.6])]], { t, e: lin });
    hookSet(g, t, { loose: simAt(simH(t)).filter(p => !(p.cap && p.c === 'b')).map(p => ({ ...p, trail: 1 })) });
  }, { hud: hookHud });
  function hookScene2(g, t) {
    const u = t - IT;
    rig(B, t - HB, [[0, K(PI / 2 - 0.55, 0.14, 8, [8.2, 1.6, 7.8])], [H3 - HB, K(PI / 2 - 0.62, 0.1, 6.8, [8.5, 1.2, 7.8])]], { t, bump: u > 0 && u < 0.3 ? 1.4 : 0 });
    hookSet(g, t);
    if (u >= 0 && u < 0.4) { flashTint(g, '#FFFFFF', 0.45 * (1 - u / 0.4)); const p = B.project(IMP[0], 0, IMP[1]); speedLines(g, p.x, p.y, t, IT, { life: 0.4 }); }
  }
  shot(HB, (g, lt, t) => hookScene2(g, t), { trans: 'whip', hud: hookHud });
  const hookFloor = aimKeys(tt => lerp3([18.6, -2.55, 9.8], [18.0, -2.45, 9.4], seg(tt, H3, loopA, lin)), tt => lerp3([13.6, -2.4, 6.3], [14.1, -2.6, 6.5], seg(tt, H3, loopA, lin)), H3, loopA + 0.5);
  shot(H3, (g, lt, t) => {
    rig(B, lt, hookFloor, { t, e: lin, shake: 0.5 });
    hookSet(g, t);
  }, { trans: 'whip' });
  cue(0, 'murmur', 0.25); cue(0, 'whoosh_soft', 0.2); cue(0, 'scatter', 0.3);
  cue(HB - 0.08, 'whoosh_fast', 0.35); cue(IT - 0.3, 'revswell', 0.6);
  cue(IT - 0.004, 'boom', 0.85); cue(IT - BOOM_HIT, 'boom_big', 0.4); cue(IT, 'hit_punch', 0.6); cue(IT, 'scatter', 0.7); cue(IT + 0.25, 'gasp', 0.4);
  cue(H3 - 0.06, 'whoosh_soft', 0.25);
  clacks(th => H3 + (th - S2) / 0.85, S2, S2 + (loopA - H3) * 0.85);

  // ======================= LOOP: a month later he calls him "presumably weaker" (an interview in Zagreb) =======================
  shot(loopA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.05, 6, [4.1, 2.7, 6])], [len(sh), K(0.05, 0.03, 5.2, [4.05, 2.75, 6])]], { t });
    interview(g, t, { e: t >= presT ? 'smug' : 'neutral' });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < presT - 0.15) heading(g, 'A MONTH LATER', 200, seg(lt, 0, 0.15));
    else quote(g, t - presT + 0.3, ['“…as if I’m playing one of the', 'presumably weaker players.”'], 'MAGNUS CARLSEN · ZAGREB, JULY 2, 2025');
  } });
  cue(loopA - 0.06, 'whoosh_fast', 0.3); cue(presT, 'pen', 0.3);
  // BIG MISTAKE: Gukesh at the Zagreb table, the steel one by now
  shot(bigA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.12, 5.5, [4, 3, 9.3])], [len(sh), K(0.06, 0.1, 4.8, [4, 3.05, 9.3])]], { t });
    zagSet(g, t, { pieces: board(Z, 44), loose: capturedAt(Z, 44), eb: 'focus', ew: 'smug' });
  }, { trans: 'flash', hud: (g, lt, t) => stamp(g, 'BIG MISTAKE', W / 2, 330, t, bigT, { color: RED }) });
  cue(bigA, 'camera', 0.35); cue(bigT, 'stamp', 0.6); cue(bigT + 0.05, 'dun_dun', 0.35);

  // ======================= WHO: Gukesh, nineteen, world champion; Magnus, number one (the real photos) =======================
  shot(whoA, (g, lt, t) => photoShot(g, lt, PH.gukesh, { from: { x: 0.5, y: 0.35, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.37, zoom: 1.08, dolly: 0.05 }, dur: magA - whoA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Gukesh D', 'WORLD CHAMPION · 19', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.gukesh, seg(lt, 0.4, 0.6) * 0.75); } });
  shot(magA, (g, lt, t) => photoShot(g, lt, PH.carlsen, { from: { x: 0.5, y: 0.35, zoom: 1.0, dolly: 0 }, to: { x: 0.5, y: 0.37, zoom: 1.08, dolly: 0.05 }, dur: norA - magA + 0.3 }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Magnus Carlsen', 'WORLD NO. 1', { y: 200, size: 66, t0: 0.05 }); credit(g, CREDITS.carlsen, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(whoA - 0.06, 'whoosh_fast', 0.3); cue(champT, 'ting', 0.25); cue(magA - 0.06, 'whoosh_fast', 0.3); cue(oneT, 'reveal_bell', 0.35);

  // ======================= NORWAY: the pin drops on Stavanger =======================
  const STV = [STAV[0], 0, STAV[1]];
  shot(norA, (g, lt, t, sh) => euSet(g, lt, t, [[0, K(0, 1.2, 19, [0, 0, 0])], [0.55, K(0.08, 0.95, 9, STV), ease.inOut], [len(sh), K(0.1, 0.92, 8.4, STV)]],
    { pins: [[STAV, seg(t, norA + 0.1, norA + 0.45, lin), norA + 0.45, '#7FB8FF']] }),
    { trans: 'zoom', hud: (g, lt, t) => placeStamp(g, lt, 'Stavanger, Norway', 'JUNE 1, 2025', { y: 200, t0: 0.15 }) });
  cue(norA - 0.06, 'whoosh_deep', 0.35); boom(norA + 0.45, 0.5);
  // MAGNUS IS CLEARLY WINNING: 33...Nxh3, the eval bar at −4
  const m66A = clearT - 0.4, m66 = moveOf(N, 66);
  shot(hallA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.5, 0.32, 14, [3, 2.4, 4])], [len(sh), K(-0.42, 0.3, 12, [2.8, 2.4, 4])]], { t });
    const u = slide(t - m66A), moved = t >= m66A + SLIDE;
    norSet(g, t, { pieces: t < m66A ? board(N, 65) : piecesAt(N, 66, u, SLIDE_OPTS), loose: capturedAt(N, u < 1 ? 65 : 66),
      bReach: { sq: 'h3', u: seg(t, m66A - 0.4, m66A + 0.6, lin) }, eb: t >= winT ? 'smug' : 'focus',
      clock: { ...NOR_CLK, l: 1520, r: 2650 - Math.min(t, m66A + SLIDE) + hallA, run: moved ? 1 : 2 }, evalV: lerp(-3, -4.1, seg(t, m66A + SLIDE, m66A + 0.8)),
      under: g2 => moveUnder(g2, B, m66, t - m66A),
      over: g2 => { moveOver(g2, B, m66, t - m66A); tag3(g2, MX, 6.6, 9.3, 'WINNING', LIME, seg(t, winT, winT + 0.3, lin)); } });
  }, { trans: 'whip' });
  cue(hallA - 0.1, 'whoosh_fast', 0.3); cue(hallA, 'murmur', 0.25); cue(m66A + SLIDE - MOVE_HIT, 'move_capture', 0.7); boom(m66A + SLIDE, 0.5); cue(winT, 'sting', 0.35);
  // THEN HIS CLOCK DROPS UNDER A MINUTE: the LCD close up, his side running out
  shot(clockA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.4, 0.25, 4.6, [9.9, 0.2, 4])], [len(sh), K(PI / 2 + 0.46, 0.22, 3.6, [9.9, 0.2, 4])]], { t });
    norSet(g, t, { pieces: board(N, 100), loose: capturedAt(N, 100), eb: t >= minT ? 'worried' : 'focus', clock: { ...NOR_CLK, l: 140, r: 68 - 6 * (t - clockA), run: 2 } });
  }, { hud: (g, lt, t) => { if (t >= minT) badge(g, 'UNDER 1 MINUTE', W / 2, 230, { color: RED, size: 46, ...pop(t, minT) }); } });
  cue(clockA, 'clock_press', 0.45); for (let x = clockA + 0.5; x < blA - 0.1; x += 0.5) cue(x, 'clock_tick', 0.25); cue(minT, 'heartbeat', 0.45); cue(minT, 'sting', 0.3);
  // AND HE BLUNDERS A KNIGHT: 52...Ne2+?? 53.Rxe2+
  const a104 = blT - SLIDE, a105 = knT - SLIDE, m104 = { ...moveOf(N, 104), label: '52...Ne2+??' }, m105 = moveOf(N, 105), hold104 = a105 - a104 - 0.2;
  shot(blA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.25, 0.5, 11, [4.5, 1.2, 4.5])], [len(sh), K(0.18, 0.55, 9.8, [4.5, 1, 3.8])]], { t });
    const pieces = t >= a105 ? piecesAt(N, 105, slide(t - a105), SLIDE_OPTS) : t >= a104 ? piecesAt(N, 104, slide(t - a104), SLIDE_OPTS) : board(N, 103);
    const moved = t >= a104 + SLIDE, took = t >= a105 + SLIDE;
    norSet(g, t, { pieces, loose: capturedAt(N, took ? 105 : 103), eb: t >= knT ? 'shock' : 'focus',
      bReach: { sq: 'e2', u: seg(t, a104 - 0.4, a104 + 0.6, lin) }, bSide: -1, wReach: { sq: 'e2', u: seg(t, a105 - 0.4, a105 + 0.6, lin) },
      clock: { ...NOR_CLK, l: 131 - clamp(t - a104 - SLIDE, 0, a105 - a104), r: 47.4 - (Math.min(t, a104 + SLIDE) - blA) - Math.max(0, t - a105 - SLIDE), run: took ? 2 : moved ? 1 : 2 },
      evalV: lerp(-0.67, 5.7, seg(t, a104 + SLIDE, a104 + SLIDE + 0.4)),
      under: g2 => { if (moved) ledGlow(g2, B, 'e2', HI.bad, t, a104 + SLIDE); moveUnder(g2, B, m104, t - a104, { hold: hold104 }); moveUnder(g2, B, m105, t - a105); },
      over: g2 => { moveOver(g2, B, m104, t - a104, { hold: hold104 }); moveOver(g2, B, m105, t - a105); } });
  });
  cue(blA - 0.04, 'whoosh_soft', 0.25); cue(a104 + SLIDE - MOVE_HIT, 'move', 0.7); boom(a104 + SLIDE, 0.6); cue(blT + 0.15, 'error', 0.35);
  cue(a105 + SLIDE - MOVE_HIT, 'move_capture', 0.75); boom(a105 + SLIDE, 0.6); cue(knT + 0.3, 'gasp', 0.4);

  // ======================= THE RACE: Gukesh's knight runs back just in time =======================
  const RACE = [...Array(16)].map((_, i) => lerp(raceA + 0.035, timeT - 0.12, i / 15)).concat([timeT + 0.02, timeT + 0.19]);
  const m121 = { ...moveOf(N, 121), label: '61.Nc4+' };
  shot(raceA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.3, 0.85, 13, [4, 0, 4.5])], [len(sh), K(0.12, 0.95, 11, [3.2, 0, 4.2])]], { t });
    const r = runAt(N, 105, RACE, t, i => i < 16 ? 0.12 : SLIDE), knight = r.pieces.find(p => p.id === 'N1');
    norSet(g, t, { pieces: r.pieces, loose: capturedAt(N, r.u < 1 ? r.k - 1 : r.k), eb: 'worried',
      clock: { ...NOR_CLK, l: 131, r: lerp(46, 31, seg(t, raceA, timeT, lin)), run: r.k % 2 ? 2 : 1 }, evalV: 5.7,
      under: g2 => { if (t >= timeT) ledGlow(g2, B, 'c4', GOLD, t, timeT); if (r.m && r.k !== 121) moveUnder(g2, B, r.m, r.lt, { dur: r.d, hold: 0.2 }); },
      over: g2 => { knightTrail(g2, r.k, knight); if (r.m && r.k !== 121) moveOver(g2, B, r.m, r.lt, { dur: r.d, hold: 0.2, label: false }); moveOver(g2, B, m121, t - RACE[15], { dur: 0.12 }); } });
  }, { trans: 'zoom' });
  RACE.forEach((x, i) => cue(x + (i < 16 ? 0.12 : SLIDE) - MOVE_HIT, i === 15 ? 'move' : 'piece', i === 15 ? 0.8 : 0.3)); boom(timeT, 0.6);
  // MAGNUS RESIGNS
  shot(resA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.12, 5.5, [MX, 3, 9.3])], [len(sh), K(0.07, 0.1, 5, [MX, 3.05, 9.3])]], { t });
    const res = t >= resT;
    norSet(g, t, { pieces: board(N, 123), loose: capturedAt(N, 123), led: res ? 'norRes' : 'nor', eb: res ? 'sad' : 'worried', clock: res ? DONE : { ...NOR_CLK, l: 131, r: 31, run: 2 },
      over: g2 => tag3(g2, MX, 5.6, 9.3, 'RESIGNS', RED, seg(t, resT, resT + 0.3, lin)) });
  });
  cue(resA - 0.04, 'whoosh_soft', 0.2); cue(resT, 'dun_dun', 0.4);
  // ...AND: the fist goes up in silence
  const fistM = t => t < MT - 0.2 ? lerp(0.6, 3.6, ease.out(seg(t, andA, MT - 0.2, lin))) : lerp(3.6, -0.1, ease.in(seg(t, MT - 0.2, MT, lin)));
  shot(andA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.06, 9, [6.9, 2, 9])], [len(sh), K(0.24, 0.05, 8, [7, 2.1, 9])]], { t });
    slamSet(g, t, 0, { bReach: fist(fistM(t)), ew: 'neutral' });
  });
  cue(andA, 'heartbeat', 0.5); cue(andA + 0.05, 'fabric', 0.4);
  // THE SLAM (the main boom, after the silence), then down on the floor with the pieces
  const simM = t => t < M2A ? (t - MT < 0.1 ? t - MT : 0.1 + (t - MT - 0.1) * 0.35) : 0.24 + (t - M2A) * 2.2;
  shot(MT, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.35, 0.12, 9, [8.5, 1.4, 7.6])], [len(sh), K(PI / 2 - 0.3, 0.1, 8.2, [8.6, 1.3, 7.6])]], { t, bump: lt < 0.3 ? 1.4 : 0 });
    slamSet(g, t, simM(t), { bReach: fist(-0.1) });
    const p = B.project(IMP[0], 0, IMP[1]); speedLines(g, p.x, p.y, t, MT);
  }, { trans: 'flash', hud: (g, lt, t) => badge(g, 'SLAM!', W / 2, 230, { color: HI.bad, size: 64, ...pop(t, MT) }) });
  cue(MT - 0.32, 'revswell', 0.9); cue(MT - 0.004, 'boom', 0.9); cue(MT - BOOM_HIT, 'boom_big', 0.5); cue(MT, 'hit_punch', 0.7); cue(MT, 'scatter', 0.8);
  cue(MT + 0.3, 'gasp', 0.45); cue(MT + 0.5, 'murmur', 0.35);
  shot(M2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.5, 0.06, 6, [14.2, -2.5, 6.5])], [len(sh), K(PI / 2 + 0.42, 0.08, 5.4, [14.2, -2.6, 6.6])]], { t });
    slamSet(g, t, simM(t), { bReach: fist(-0.1) });
  }, { trans: 'whip' });
  cue(M2A - 0.06, 'whoosh_fast', 0.3); clacks(th => M2A + (th - 0.24) / 2.2, 0.24, 0.24 + (wkA - M2A) * 2.2);

  // ======================= HE APOLOGIZES, PATS GUKESH ON THE BACK, AND WALKS OUT =======================
  shot(wkA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-PI / 2 - 0.08, 0.25, 10.8, [4, 2.2, 4], { fov: 850 })], [len(sh), K(-PI / 2 - 0.04, 0.24, 10, [4, 2.2, 4], { fov: 850 })]], { t });
    afterSet(g, t, { eb: 'sad', ew: 'neutral', arms: g2 => handshake(g2, t, seg(t, wkA, wkA + 0.35, lin), wkA + 0.35) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= apoT) badge(g, 'SORRY', W / 2, 230, { color: CREAM, size: 46, ...pop(t, apoT) }); } });
  cue(wkA - 0.06, 'whoosh_soft', 0.25); cue(wkA + 0.35, 'fabric', 0.4);
  const PATS = [patT, gukT + 0.1, backT];
  const patLift = t => PATS.reduce((a, tp) => a + (t > tp - 0.3 && t < tp ? 0.35 * Math.sin(PI * (t - tp + 0.3) / 0.3) : 0), 0);
  shot(patA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.25, 0.22, 11, [5, 2.6, -1.6])], [len(sh), K(PI + 0.2, 0.2, 10, [5.2, 2.6, -1.6])]], { t });
    afterSet(g, t, { bPlayer: false, ew: 'neutral', behind: g2 => standing(g2, 'mag', 7.4, -1.9, { e: 'sad', t, k: 1.15, face: 1, free: 1 }),
      arms: g2 => patArm(g2, 'mag', 7.4, FLOOR_Y + 7.1 * 1.15, -1.9, 1.15, 1, [5.5, 1.5 + patLift(t), -1.5]) });
  });
  PATS.forEach(x => cue(x, 'fabric', 0.45));
  const walkZ = t => lerp(7.2, 2.6, seg(t, walkA, tbA + 0.3, lin));
  shot(walkA, (g, lt, t, sh) => {
    rig(B, lt, aimKeys(() => [17.6, 3.0, -8.5], tt => [16.3, 1.2, walkZ(tt) + 0.5], walkA, tbA + 0.5), { t, e: lin });
    afterSet(g, t, { bPlayer: false, ew: 'neutral', front: g2 => standing(g2, 'mag', 16.3, walkZ(t), { walk: 1, phase: (t - walkA) * 7, face: -1, e: 'sad', t }) });
  });
  cue(walkA, 'footsteps', 0.4);

  // ======================= GUKESH'S REACTION: "I HAVE ALSO BANGED A LOT OF TABLES" =======================
  shot(tbA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.1, 0.1, 6, [4, 3.1, -1.4])], [len(sh), K(PI - 0.06, 0.08, 5.3, [4, 3.15, -1.4])]], { t });
    afterSet(g, t, { bPlayer: false, ew: t >= reactT ? 'happy' : 'neutral' });
  }, { trans: 'whip' });
  cue(tbA - 0.06, 'whoosh_fast', 0.3);
  shot(qA, (g, lt, t) => photoShot(g, lt, PH.gukesh, { from: { x: 0.52, y: 0.35, zoom: 1.12, dolly: 0 }, to: { x: 0.54, y: 0.37, zoom: 1.22, dolly: 0.06 }, dur: kpA - qA + 0.3, dim: 0.25 }),
    { hud: (g, lt, t) => quote(g, lt, ['“I have also banged a lot', 'of tables in my career.”'], 'GUKESH D · JUNE 2025', { cr: CREDITS.gukesh }) });
  cue(qA - 0.05, 'whoosh_soft', 0.25); cue(bangT, 'thud', 0.35);

  // ======================= KASPAROV'S POST: the slam plays on a phone; a swipe, his post =======================
  shot(kpA, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); hookScene2(feedx, IT - 0.45 + (t - kpA));
    const r = seg(lt, 0.15, 1.3);
    phoneHand(g, lt, t, [[0, K(0, 0, 1.0, [4, 2, 3.998])], [1.1, K(-0.35, 0.1, 3.0, [4.1, 1.8, 4])], [1.6, K(-0.3, 0.09, 2.8, [4.1, 1.85, 4])],
      [heavyT - kpA + 0.2, K(-0.12, 0.04, 1.55, [4, 2.25, 4])], [len(sh), K(-0.1, 0.04, 1.45, [4, 2.25, 4])]],
      phoneScreen(FEED, t, postT, { mark: seg(t, heavyT - 0.1, heavyT + 0.25, lin) }), { sway: r, shake: 0.6 * r, vig: r });
  }, { kb: 0, hud: (g, lt, t) => { if (t >= postT) nameTitle(g, lt, 'Garry Kasparov', '13TH WORLD CHAMPION', { y: 200, size: 60, t0: postT - (t - lt) }); } });
  cue(kpA + 0.45, 'thud', 0.25); cue(postT - 0.05, 'swipe_card', 0.4); cue(postT + 0.1, 'notify', 0.35); cue(heavyT, 'pen', 0.35);
  // ...EXTRA-HEAVY TABLES: a steel table drops onto the Zagreb stage
  shot(dropA, (g, lt, t, sh) => {
    const u = seg(t, dropA + 0.02, tablesT, lin);
    rig(B, lt, [[0, K(-0.35, 0.18, 17, [5, 0.5, 4])], [len(sh), K(-0.3, 0.2, 15.5, [5, 0.3, 4])]], { t, bump: t > tablesT && t < tablesT + 0.35 ? 1.4 : 0 });
    zagSet(g, t, { steelY: 12 * (1 - u ** 1.6), slab: false, wPlayer: false, bPlayer: false, wChair: false, bChair: false, front: g2 => dust(g2, t, tablesT) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= tablesT) badge(g, 'EXTRA-HEAVY', W / 2, 230, { color: GOLD, size: 56, ...pop(t, tablesT) }); } });
  cue(dropA - 0.06, 'whoosh_deep', 0.35); cue(tablesT - 0.004, 'boom', 0.8); cue(tablesT - BOOM_HIT, 'boom_big', 0.45); cue(tablesT, 'thud', 0.6);

  // ======================= THEIR NEXT GAME: ZAGREB (the arc over the map) =======================
  const midSZ = [(STAV[0] + ZAGR[0]) / 2, 1.2, (STAV[1] + ZAGR[1]) / 2];
  shot(zgA, (g, lt, t, sh) => euSet(g, lt, t, [[0, K(0.1, 0.95, 10, [STAV[0], 0.5, STAV[1]])], [0.5, K(0, 0.85, 11, midSZ)], [len(sh), K(-0.05, 0.8, 9, [ZAGR[0], 0.6, ZAGR[1]])]],
    { pins: [[STAV, 1, zgA - 5, '#7FB8FF'], [ZAGR, seg(t, zgT - 0.25, zgT + 0.1, lin), zgT + 0.1, ZAG_C]], arcs: [[STAV, ZAGR, seg(t, zgA + 0.05, zgT - 0.2, lin)]] }),
    { trans: 'whip', hud: (g, lt, t) => { if (t < zgT) heading(g, 'THEIR NEXT GAME', 200, seg(lt, 0, 0.15)); else placeStamp(g, lt, 'Zagreb, Croatia', 'JULY 3, 2025', { y: 200, t0: zgT - (t - lt) }); } });
  cue(zgA - 0.06, 'whoosh_fast', 0.3); cue(zgA + 0.05, 'whoosh_soft', 0.25); boom(zgT + 0.1, 0.45);
  // GUKESH IS LOSING AGAIN
  shot(zhA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.4, 0.35, 15, [3.5, 2.2, 4])], [len(sh), K(-0.34, 0.33, 13.2, [3.4, 2.2, 4])]], { t });
    zagSet(g, t, { pieces: board(Z, 44), loose: capturedAt(Z, 44), eb: 'worried', ew: 'smug', evalV: 2.2, clock: { ...ZAG_CLK, l: 245, r: 198 - (t - zhA), run: 2 },
      over: g2 => tag3(g2, 4, 5.45, 9.3, 'LOSING', RED, seg(t, losT, losT + 0.3, lin)) });
  }, { trans: 'zoom' });
  cue(zhA - 0.06, 'whoosh_deep', 0.3); cue(losT, 'sting', 0.35);

  // ======================= THEN MAGNUS PLAYS b4; KASPAROV: "YOU DON'T PLAY b4, PERIOD!" =======================
  const a45 = b4T - SLIDE, m45 = { ...moveOf(Z, 45), label: '23.b4?!' };
  function b4Scene(g, t) {
    rig(B, t - b4A, [[0, K(-0.75, 0.42, 9.5, [2.6, 0.8, 4.2])], [2.4, K(-0.7, 0.45, 8.6, [2.4, 0.6, 4])]], { t });
    const moved = t >= a45 + SLIDE;
    zagSet(g, t, { pieces: t < a45 ? board(Z, 44) : piecesAt(Z, 45, slide(t - a45), SLIDE_OPTS), loose: capturedAt(Z, 44), ew: moved ? 'smug' : 'focus', eb: 'worried',
      wReach: { sq: 'b4', u: seg(t, a45 - 0.4, a45 + 0.6, lin) }, wSide: 1, evalV: lerp(2.2, 1.0, seg(t, a45 + SLIDE, a45 + SLIDE + 0.5)),
      clock: { ...ZAG_CLK, l: 238 - (Math.min(t, a45 + SLIDE) - b4A), r: 198 - Math.max(0, t - a45 - SLIDE), run: moved ? 2 : 1 },
      under: g2 => { moveUnder(g2, B, m45, t - a45, { hold: 3 }); if (moved) squareFrame(g2, B, 'b4', GOLD, seg(t, a45 + SLIDE, a45 + SLIDE + 0.2)); },
      over: g2 => moveOver(g2, B, m45, t - a45, { hold: 3 }) });
  }
  shot(b4A, (g, lt, t) => b4Scene(g, t), { trans: 'whip' });
  cue(b4A - 0.06, 'whoosh_fast', 0.3); cue(a45 + SLIDE - MOVE_HIT, 'move', 0.75); boom(a45 + SLIDE, 0.6); cue(b4T + 0.25, 'dun_dun', 0.3);
  // the b4 scene is on the wall screen of Kasparov's booth: the camera pulls back from it
  shot(kasA, (g, lt, t, sh) => {
    feedx.setTransform(1, 0, 0, 1, 0, 0); b4Scene(feedx, t);
    rig(B, lt, [[0, K(0, 0, 7.19, [7.6, 4.2, 12.5])], [0.25, K(0, 0, 7.19, [7.6, 4.2, 12.5])], [1.35, K(-0.2, 0.08, 9, [5.4, 2.8, 8.5]), ease.inOut], [len(sh), K(-0.16, 0.07, 8.3, [5.2, 2.9, 8.6])]], { t });
    booth(g, t, { screen: FEED, e: t >= youT ? 'angry' : 'focus',
      reach: { x: 5.3, z: 7.6, y: lerp(1.3, 0.12, seg(t, periodT - 0.18, periodT, ease.in)), u: seg(t, youT, youT + 0.3) * (1 - seg(t, periodT + 0.25, periodT + 0.7)), hold: true } });
  }, { kb: 0, hud: (g, lt, t) => { if (t >= youT - 0.15) quote(g, t - youT + 0.15, ['“You don’t play b4,', 'period!”'], 'GARRY KASPAROV · JULY 3, 2025'); } });
  cue(kasA, 'whoosh_soft', 0.2); cue(periodT, 'thud', 0.6); boom(periodT, 0.6);

  // ======================= GUKESH STRIKES BACK: 35...e4!; MAGNUS RESIGNS AGAIN =======================
  const a70 = strT - SLIDE, m70 = { ...moveOf(Z, 70), label: '35...e4!' };
  shot(tnA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.5, 0.35, 9, [4.5, 0.8, 4.5])], [len(sh), K(PI - 0.42, 0.33, 8.2, [4.5, 0.9, 4.3])]], { t });
    const moved = t >= a70 + SLIDE;
    zagSet(g, t, { pieces: t < a70 ? board(Z, 69) : piecesAt(Z, 70, slide(t - a70), SLIDE_OPTS), loose: capturedAt(Z, 69), eb: 'focus', ew: t >= mgT ? 'shock' : moved ? 'worried' : 'focus',
      bReach: { sq: 'e4', u: seg(t, a70 - 0.4, a70 + 0.6, lin) }, evalV: lerp(0.6, -1.1, seg(t, a70 + SLIDE, a70 + SLIDE + 0.5)),
      clock: { ...ZAG_CLK, l: 95 - Math.max(0, t - a70 - SLIDE), r: 160 - (Math.min(t, a70 + SLIDE) - tnA), run: moved ? 1 : 2 },
      under: g2 => { if (moved) { ledGlow(g2, B, 'e4', HI.good, t, a70 + SLIDE); spread(g2, B, 'e4', t, a70 + SLIDE, HI.good); } moveUnder(g2, B, m70, t - a70); },
      over: g2 => moveOver(g2, B, m70, t - a70) });
  }, { trans: 'whip' });
  cue(tnA - 0.06, 'whoosh_fast', 0.3); cue(a70 + SLIDE - MOVE_HIT, 'move', 0.75); boom(a70 + SLIDE, 0.7); cue(a70 + SLIDE + 0.05, 'boom_cine', 0.4);
  shot(rs2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.4, 0.25, 4.6, [9.9, 0.2, 4])], [len(sh), K(PI / 2 + 0.46, 0.22, 3.8, [9.9, 0.2, 4])]], { t });
    const res = t >= resgT;
    zagSet(g, t, { pieces: board(Z, 98), loose: capturedAt(Z, 98), led: res ? 'zagRes' : 'zag', ew: res ? 'sad' : 'worried',
      clock: res ? ZDONE : { ...ZAG_CLK, l: 26.9 - (t - rs2A), r: 187, run: 1 } });
  }, { hud: (g, lt, t) => { if (t >= resgT) badge(g, 'RESIGNS AGAIN', W / 2, 230, { color: RED, size: 46, ...pop(t, resgT) }); } });
  cue(rs2A, 'clock_press', 0.4); cue(resgT, 'dun_dun', 0.4); cue(resgT + 0.05, 'reveal_bell', 0.3);

  // ======================= NO SLAM THIS TIME: he sets the pieces back up, and leaves =======================
  shot(qtA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.15, 0.15, 8, [7.5, 0.8, 0.8])], [len(sh), K(PI / 2 - 0.1, 0.13, 7.2, [7.6, 0.8, 0.6])]], { t });
    zagSet(g, t, { pieces: board(Z, 98), loose: capturedAt(Z, 98), led: 'zagRes', ew: 'sad', eb: 'neutral', clock: ZDONE,
      wReach: { x: 6.6, z: -0.6, y: lerp(1.6, -0.05, seg(t, qtA + 0.1, slamT + 0.3)), u: 1, hold: true } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= slamT) badge(g, 'NO SLAM', W / 2, 230, { color: CREAM, size: 46, ...pop(t, slamT) }); } });
  cue(qtA - 0.06, 'whoosh_soft', 0.25); cue(slamT + 0.3, 'thud', 0.15);
  const resetScene = (g, t) => {
    rig(B, t - rsA, [[0, K(PI + 0.5, 0.78, 10.5, [3.5, 0.9, 4.0])], [2.6, K(PI + 0.38, 0.8, 9.6, [3.5, 0.9, 4.2])]], { t });
    const ps = resetPieces(Z, 98, t, rsA + 0.15, upT - 0.6, upT, 'K1'), k = ps.find(p => p.id === 'K1');
    const u = t < upT ? seg(t, upT - 0.75, upT - 0.5, lin) : 1 - seg(t, upT + 0.15, upT + 0.55, lin);
    zagSet(g, t, { pieces: ps.filter(p => !p.side), loose: ps.filter(p => p.side), led: 'zagRes', ew: { ...EXPR.neutral, look: [0, 0.8], lid: 0.3 }, clock: ZDONE,
      wReach: { x: k.x, z: k.z, y: k.y + 1.05, u, hold: true } });
  };
  shot(rsA, (g, lt, t) => resetScene(g, t), { trans: 'whip', kb: 0 });
  cue(rsA - 0.06, 'whoosh_fast', 0.25); for (let i = 0; i < 7; i++) cue(rsA + 0.2 + i * 0.13, 'piece', 0.22); cue(upT - MOVE_HIT, 'move', 0.7); cue(upT, 'reveal_bell', 0.35);
  const leaveZ = t => lerp(-3.4, -6.6, seg(t, lvA, dmA + 0.3, lin));
  shot(lvA, (g, lt, t, sh) => {
    rig(B, lt, aimKeys(() => [3.2, 3.6, -12.2], tt => [5, 1.6, leaveZ(tt) + 2], lvA, dmA + 0.5), { t, e: lin });
    zagSet(g, t, { pieces: board(Z, 0), led: 'zagRes', wPlayer: false, wChair: false, clock: ZDONE,  // his chair pushed back, out of the way
      front: g2 => { chair(g2, B, 2.2, -3.0, { face: 1, color: CHAIR }); standing(g2, 'magZ', 6.2, leaveZ(t), { walk: 1, phase: (t - lvA) * 7, face: -1, e: 'sad', t }); } });
  });
  cue(lvA, 'footsteps', 0.35);

  // ======================= KASPAROV: "NOW WE CAN QUESTION MAGNUS' DOMINATION" =======================
  shot(dmA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.2, 0.08, 9.5, [5.4, 2.8, 8.5])], [len(sh), K(-0.16, 0.07, 8.6, [5.2, 2.9, 8.6])]], { t });
    booth(g, t, { e: 'smug' });
  }, { trans: 'whip' });
  shot(nowQ, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.12, 0.05, 5.6, [4, 2.8, 9.3])], [len(sh), K(0.08, 0.04, 5, [4, 2.85, 9.3])]], { t });
    booth(g, t, { e: t >= domT ? 'triumph' : 'smug' });
  }, { trans: 'whip', hud: (g, lt, t) => quote(g, lt, ['“Now we can question', 'Magnus’ domination.”'], 'GARRY KASPAROV · JULY 3, 2025') });
  cue(dmA - 0.06, 'whoosh_fast', 0.3); cue(nowQ - 0.06, 'whoosh_soft', 0.25); cue(domT, 'boom_cine', 0.45);

  // ======================= NOW: MAGNUS PREDICTS GUKESH WILL LOSE HIS TITLE MATCH (Geneva, November 2026) =======================
  const midZG = [(ZAGR[0] + GENV[0]) / 2, 0.8, (ZAGR[1] + GENV[1]) / 2];
  shot(nwA, (g, lt, t, sh) => euSet(g, lt, t, [[0, K(0.05, 0.9, 9, [ZAGR[0], 0.5, ZAGR[1]])], [0.5, K(0, 0.85, 9.5, midZG)], [len(sh), K(-0.05, 0.82, 8.6, [GENV[0], 0.5, GENV[1]])]],
    { pins: [[ZAGR, 1, nwA - 5, ZAG_C], [GENV, seg(t, nwA + 0.4, nwA + 0.75, lin), nwA + 0.75, TEAL]], arcs: [[ZAGR, GENV, seg(t, nwA + 0.05, nwA + 0.45, lin)]] }),
    { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'Geneva', 'TITLE MATCH · NOV 2026', { y: 200, t0: 0.5 }) });
  cue(nwA - 0.06, 'whoosh_fast', 0.3); boom(nwA + 0.75, 0.45);
  shot(gvA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.15, 0.15, 7.5, [4, 2.6, 2])], [len(sh), K(PI + 0.08, 0.12, 6.4, [4, 2.8, 1.2])]], { t });
    hall(g, t, { led: 'gen', carpet: TEAL, mid: g2 => tableSet(g2, t, { pieces: board(N, 0), bPlayer: false, bChair: false, ew: t >= loseT ? 'worried' : 'focus' }) });
  }, { trans: 'zoom', hud: (g, lt, t) => quote(g, lt, ['“I think', 'Sindarov will win.”'], 'MAGNUS CARLSEN · SEP 16, 2026') });
  cue(gvA - 0.06, 'whoosh_deep', 0.3); cue(loseT, 'dun_dun', 0.35);

  // ======================= CTA: the Stavanger hall again, empty; the pieces still on the floor =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 + 0.3, 0.02, 5, [14.3, -2.75, 6.5])], [2.4, K(PI / 2 + 0.45, 0.25, 11, [9, -1, 6])], [len(sh), K(PI / 2 + 0.55, 0.42, 19, [6, 0, 5])]], { t });
    hall(g, t, { ...NORc, led: 'cta', cone: 0.05, mid: g2 => tableSet(g2, t, { loose: AFTER, bx: MX, clock: DONE, wPlayer: false, bPlayer: false }) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'RATE IT: 1 TO 10', W / 2, 230, { color: TEAL, size: 40, a: seg(t, rateT, rateT + 0.1), ...pop(t, rateT) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, howT, howT + 0.1), ...pop(t, howT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, chT, chT + 0.1) });
  } });
  cue(ctaA - 0.06, 'whoosh_fast', 0.3); cue(rateT, 'sparkle_pop', 0.3); cue(howT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: loopA, m: 'intrigue' }, { t: norA, m: 'build' }, { t: clockA, m: 'clockwork' }, { t: blA, m: 'tension' },
    { t: MT, m: 'slam' }, { t: wkA, m: 'elegy' }, { t: tbA, m: 'intrigue' }, { t: kpA, m: 'digital' }, { t: zgA, m: 'build' },
    { t: b4A, m: 'tension' }, { t: tnA, m: 'victory' }, { t: qtA, m: 'elegy' }, { t: dmA, m: 'finale' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: andA + 0.15, t1: MT - 0.01, kind: 'mute' }, { t0: MT, t1: wkA - 0.05, kind: 'boost', db: 6 },
    { t0: kpA, t1: dropA - 0.05, kind: 'lp', f: 900 },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
