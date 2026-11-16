// The truth: Hikaru and Magnus (The 64 Files, November 2026). The author sent a sad edit about the two of them (the
// lie detector of the Esports World Cup 2026, black-and-white cuts, "Do you think you'll ever be world champion?" —
// "No.") and said «щас с этим грустные эдиты». The hook: Magnus asked Hikaru one question on a lie detector, "Are you
// jealous of anything I've achieved?", and Hikaru said yes; it was the truth. Then the rivalry: America's youngest
// grandmaster in 2003, "then Magnus showed up", 14 : 1 in classical (the one win: Bilbao 2016), the edit-bait (he could
// beat the whole world, just not the man who owns it), five title matches against none, the draw with Gukesh in the
// last round of the Candidates 2024, fifth in 2026 at 38; the turn: in speed chess it is 5 : 5 and the sixth title is
// being played now (finals in London, February 2027). The loop: the lie detector again; the question with a number.
// v2 (the author, the same day: «добавь эту цитату с визуализацией и побольше динамики в видео на каждый момент»): after
// "He's 38" the quote from the comments — "A man will spend his whole life building a ladder to reach the sky. Just to
// find out that someone else was born with wings." — as a picture: Hikaru builds his ladder of years into the clouds,
// Magnus flies up past him; a feather from his wings lands on the blitz clock of the turn. Every beat is cut into views
// (about 32 cuts a minute), every flat scene has a camera (`view2`, `cam2`), key words get punch-ins (`kicks`); the
// spoken London line is now a plate. v3 (the author: the Gukesh part is dull, make the wings scene much better, let the
// feather fall onto the scales across the cut; then two photos to reference): the last round as a face-off, the
// handshake, the crown with confetti and the king thrown into the crowd at the Arlington stadium (2025); the wings in
// four views (the launch from the foot of the ladder past the years, the shadow, one feather); the feather lands on a
// balance standing on the blitz clock; the «I ♥ Magnus» signs and the 2019 blitz podium redrawn. Rules 28, 55, 57, 63,
// 67, 71–74 and memory/retention.md. Sources: SOURCES.md.
// The toolkit below comes from `fairplay`.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar, exprAt, hand } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, counter, score, vsLabel, plate, sans, mono, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool, gear } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, boardArrow, pieceRing, spread, moveTag } from '../../engine/js/hifx.js';
import { webcam, trophy } from '../../engine/js/witty.js';
import { shockwave, burst, dust } from '../../engine/js/fx.js';
import { confetti } from '../../engine/js/draw.js';
import { loadImage } from '../../engine/js/photo.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (rule 48): clean green against cheater red, daylight cream ----------
const GOLD = '#F5C451', RED = '#E8413A', LIME = HI.good, CREAM = '#FFF3E0', INK = '#07070C', MINT = '#7FD9A8';
const CURSE = RED, LEVY_C = '#4FC3FF', FAN_C = RED;  // the names the shared code below uses for its default colours
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#15151C', side: '#0B0B10', th: 0.45, rc: 0.35 };
const WOODT = ['#C99A68', '#8A6440', '#A87E52'];
// the game of the hook (SOURCES.md): Niemann (White) – Carlsen, Julius Baer Generation Cup, 19 Sep 2022: 1.d4 Nf6 2.c4, Black resigned
// young Fischer, April 1956 (United Press, public domain; the photo of `episodes/fischer`), for the record of 1958
const FISCHER13 = await loadImage('../episodes/fischer/photos/fischer13.jpg');
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
function camWall(g, t, t0, { step = 0.16, mood = null, from = 0 } = {}) {
  const glad = mood === 'happy';
  for (let k = from; k < 9; k++) {
    const c = CAMS9[k], x = c.getContext('2d'), rep = !glad && t >= t0 + k * step, e = glad ? { ...EXPR.happy, lid: 0.1, nod: 0.6 } : rep ? { ...EXPR.angry, look: [0, 0.2] } : { ...EXPR.focus, look: [0, 0.4] };
    x.setTransform(1, 0, 0, 1, 0, 0);
    webcam(x, 0, 0, 480, 360, OPPS[k], e, t + k * 0.9, { bg: OPP_BG[k % 6], zoom: 1.1, cy: 0.5 });
    if (rep || glad) { x.strokeStyle = glad ? '#7CFC9A' : RED; x.lineWidth = 16; x.strokeRect(8, 8, 464, 344); }
    const [cx, cy, cz] = camAt(k), hw = WALL.w / 2, hh = WALL.h / 2;
    ab(g, [cx - hw - 0.15, cy - hh - 0.15, cz], [cx + hw + 0.15, cy + hh + 0.15, cz + 0.3], '#14161B');
    texQuad(g, c, [cx - hw, cy + hh, cz - 0.02], [cx + hw, cy + hh, cz - 0.02], [cx - hw, cy - hh, cz - 0.02]);
  }
  // the REPORT flags pop on each camera
  if (!glad) for (let k = 0; k < 9; k++) { const t1 = t0 + k * step; if (t < t1) continue; const [cx, cy, cz] = camAt(k), q = B.project(cx + WALL.w * 0.28, cy - WALL.h * 0.3, cz - 0.1); if (q.z < 0.5) continue;
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
function report(g, t, t0, { flip = 0, at = null } = {}) {
  const { w, d, th } = REP, [x, z] = at || [REP.x, REP.z], u = clamp((t - t0) / 0.32), y0 = -0.35 + (1 - ease.in(u)) * 7, rot = (1 - u) * 0.5;
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
function browser(t, { away = 0, chart = 0, cursor = null, face = null } = {}) {
  const x = BROW.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#2B2D33'; x.fillRect(0, 0, 1760, 990);
  x.fillStyle = '#1C1D22'; x.fillRect(0, 0, 1760, 96);
  [['♟  PLAY', 30], ['+  NEW TAB', 400]].forEach(([s, x0], i) => {
    const act = (i === 1) === (away > 0.5);
    x.fillStyle = act ? '#2B2D33' : '#25262C'; x.beginPath(); x.roundRect(x0, 22, 340, 74, [16, 16, 0, 0]); x.fill();
    x.fillStyle = act ? '#FFFFFF' : '#8A8E98'; x.font = sans(36, 800); x.letterSpacing = '2px'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(s, x0 + 36, 60);
  });
  if (away > 0.5) {
    x.fillStyle = '#E9ECF1'; x.fillRect(0, 96, 1760, 894); x.fillStyle = '#B8BEC8'; x.font = sans(300, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', face ? 500 : 880, 560);
  } else {
    const s = 96, bx = 120, by = 140;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; x.fillRect(bx + i * s, by + j * s, s, s); }
    const r = rng(8); x.fillStyle = '#1E2026'; for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(bx + (Math.floor(r() * 8) + 0.5) * s, by + (Math.floor(r() * 8) + 0.5) * s, 30, 0, 7); x.fill(); }
    x.fillStyle = '#FFFFFF'; for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(bx + (Math.floor(r() * 8) + 0.5) * s, by + (Math.floor(r() * 8) + 0.5) * s, 30, 0, 7); x.fill(); }
    if (face) { x.fillStyle = '#3A3D45'; x.fillRect(1010, 140, 630, 190); x.fillStyle = '#FFFFFF'; x.font = sans(44, 900); x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('YOUR MOVE', 1050, 235); x.fillStyle = '#E8413A'; x.font = sans(84, 900); x.textAlign = 'right'; x.fillText('0:09', 1610, 238); }
    else { x.fillStyle = '#3A3D45'; x.fillRect(1000, 140, 640, 768); x.fillStyle = '#FFFFFF'; x.font = sans(52, 900); x.textAlign = 'left'; x.fillText('YOUR MOVE', 1050, 220);
      x.fillStyle = '#E8413A'; x.font = sans(110, 900); x.fillText('0:09', 1050, 360); }
  }
  if (face) { const L = CAMLOOK[face.who]; webcam(x, 1010, 360, 630, 560, face.who, face.e, t, { bg: L.bg, zoom: 1.0, cy: 0.5, name: L.name, nameColor: L.nameColor }); }
  if (chart > 0) {  // two bars, no figures: how well he played when he stayed, and when he clicked away
    const u = ease.out(clamp(chart));
    const bx = face ? 40 : 380, bw = face ? 940 : 1000, mid = bx + bw / 2;
    x.fillStyle = 'rgba(14,15,19,0.94)'; x.beginPath(); x.roundRect(bx, 120, bw, 700, 30); x.fill();
    x.fillStyle = '#FFFFFF'; x.font = sans(54, 900); x.letterSpacing = '4px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HOW WELL HE PLAYED', mid, 210);
    [['STAYED', 0.3, '#8A8E98', mid - 200], ['CLICKED AWAY', 0.9, '#7CFC9A', mid + 200]].forEach(([lab, v, col, cx]) => {
      const hh = 420 * v * u; x.fillStyle = col; x.fillRect(cx - 120, 700 - hh, 240, hh);
      x.fillStyle = '#FFFFFF'; x.font = sans(40, 900); x.letterSpacing = '3px'; x.fillText(lab, cx, 762);
    });
  }
  if (cursor) { const [cx, cy] = cursor; x.save(); x.translate(cx, cy); x.fillStyle = '#FFFFFF'; x.strokeStyle = '#000000'; x.lineWidth = 5; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 64); x.lineTo(16, 50); x.lineTo(28, 76); x.lineTo(38, 71); x.lineTo(26, 46); x.lineTo(46, 46); x.closePath(); x.fill(); x.stroke(); x.restore(); }
  return BROW;
}
// the profile on the monitor: the honest opponent, his rating, the refund note sliding in
const PROF = makeCanvas(1760, 990);
function profile(t, { rating = 1186, note = 0, plus = 14, mood = null } = {}) {
  const x = PROF.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#2B2D33'; x.fillRect(0, 0, 1760, 990);
  const m = mood || (note > 0.5 ? 'happy' : 'focus'), e = m === 'happy' ? { ...EXPR.happy, lid: 0.08, nod: 0.7 } : m === 'sad' ? { ...EXPR.sad, look: [0.3, 0.2] } : { ...EXPR.focus };
  webcam(x, 90, 110, 620, 700, 'opp', e, t, { bg: ['#6FA07E', '#24402E'], zoom: 1.0, cy: 0.5 });
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
// a rectangle of the monitor's picture (its 1760 x 990 pixels) logged on the film: a face shown on the screen
function monRect(g, x0, y0, x1, y1, kind, label) {
  const P = (px, py) => B.project(MON.c[0] - MON.hw + px / 1760 * 2 * MON.hw, MON.c[1] + MON.hh - py / 990 * 2 * MON.hh, MON.c[2] - 0.02);
  const a = P(x0, y0), b = P(x1, y1); if (a.z < 0.5) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); qaRect(g, a.x, a.y, b.x - a.x, b.y - a.y, kind, label); g.restore();
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
// Hans at the table with no board on it: the report lands in front of him
function hansDesk(g, t, { e = 'focus', over = null } = {}) {
  dayRoom(g, t, {});
  tableSet(g, t, { pieces: null, slab: false, over, wPlayer: false, wChair: false, bPlayer: true, black: 'hans', eb: e, tableCol: WOODT });
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}
// Hans at the board, the same frame as Magnus's: for the rumour (the buzz around him) and the scan (his hands up)
function hansAtBoard(g, t, { pieces, e = 'focus', up = 0, buzz = 0 } = {}) {
  dayRoom(g, t, {});
  const behind = up > 0 ? g2 => {
    chair(g2, B, 4, 9.8, { face: -1, color: CHAIR });
    const hp = B.project(4, 3.1, 9.3), hs = hp.s / 100 * 1.05, k = ease.out(clamp(up)), sleeve = CAST.hans.suit;
    const P = (sd, a, b) => [hp.x + lerp(a[0], b[0], k) * sd * hs, hp.y + lerp(a[1], b[1], k) * hs];
    for (const [col, lw] of [[mix(sleeve, '#8A9AAE', 0.45), 64 * hs + 7], [mix(sleeve, '#8A9AAE', 0.08), 64 * hs]]) for (const sd of [-1, 1]) {
      const S0 = P(sd, [140, 250], [140, 250]), E0 = P(sd, [175, 250], [236, 70]), W0 = P(sd, [165, 225], [214, -140]);
      g2.strokeStyle = col; g2.lineWidth = lw; g2.lineCap = 'round'; g2.lineJoin = 'round'; g2.beginPath(); g2.moveTo(...S0); g2.lineTo(...E0); g2.lineTo(...W0); g2.stroke();
    }
    seated(g2, B, 'hans', e, t, { z: 9.3, hands: false });
    useSkin(g2, 'hans'); for (const sd of [-1, 1]) { const [hx, hy] = P(sd, [160, 235], [206, -186]); hand(g2, hx, hy, 34 * hs); }
  } : null;
  tableSet(g, t, { pieces, wPlayer: false, wChair: false, bPlayer: up <= 0, bChair: up <= 0, black: 'hans', eb: e, tableCol: WOODT, behind });
  if (buzz > 0) {  // the "vibrating device": rings and zigzags round his middle, BZZZ
    const hp = B.project(4, 3.1, 9.3), hs = hp.s / 100 * 1.05, cx = hp.x, cy = hp.y + 230 * hs;
    g.save(); g.globalAlpha *= buzz; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const ph = (t * 3.2 + k / 3) % 1; g.strokeStyle = rgba(GOLD, 1 - ph); g.lineWidth = 9 * hs * 1.6;
      for (const sd of [-1, 1]) { g.beginPath(); g.arc(cx, cy, (160 + ph * 260) * hs, sd > 0 ? -0.5 : Math.PI - 0.5, sd > 0 ? 0.5 : Math.PI + 0.5); g.stroke(); } }
    g.font = sans(Math.min(84, 40 * hs), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const [dx, dy, r] of [[-1, -150, -0.25], [1, -60, 0.22]]) { g.save(); g.translate(clamp(cx + dx * Math.min(330, 175 * hs), 190, W - 190) + Math.sin(t * 60) * 4, cy + dy * hs); g.rotate(r); g.strokeStyle = '#16120E'; g.lineWidth = 12 * hs; g.strokeText('BZZZ', 0, 0); g.fillStyle = GOLD; g.fillText('BZZZ', 0, 0); g.restore(); }
    g.restore();
  }
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}
// a security wand sweeping down in front of him (u: 0..1 down the body and back up)
function wand(g, t, u, a = 1) {
  if (a <= 0) return;
  const hp = B.project(4, 3.1, 9.3), hs = hp.s / 100 * 1.05, y = hp.y + lerp(-60, 520, (1 - Math.cos(u * Math.PI * 2)) / 2) * hs, x = hp.x + 250 * hs;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(-0.12);
  g.fillStyle = '#1C1E24'; g.beginPath(); g.roundRect(-30 * hs, -26 * hs, 260 * hs, 52 * hs, 20 * hs); g.fill();
  g.fillStyle = '#3A3E48'; g.beginPath(); g.roundRect(-240 * hs, -46 * hs, 230 * hs, 92 * hs, 46 * hs); g.fill();
  g.fillStyle = rgba('#7CFC9A', 0.9); g.beginPath(); g.arc(-125 * hs, 0, 20 * hs, 0, 7); g.fill();
  const gr = g.createLinearGradient(-500 * hs, 0, 0, 0); gr.addColorStop(0, 'rgba(124,252,154,0)'); gr.addColorStop(1, 'rgba(124,252,154,0.35)'); g.fillStyle = gr; g.fillRect(-520 * hs, -8 * hs, 300 * hs, 16 * hs);
  g.restore();
}
// mini boards bursting out of the report: a hundred games
function cardsBurst(g, t, t0, x, y, { n = 30 } = {}) {
  const r = rng(77);
  for (let i = 0; i < n; i++) {
    const d0 = r() * 0.25, u = (t - t0 - d0) / 0.9, ang = -Math.PI / 2 + (r() - 0.5) * 2.6, sp = 500 + r() * 700, rot = (r() - 0.5) * 6;
    if (u <= 0 || u > 1) continue;
    const e = ease.out(u), px = x + Math.cos(ang) * sp * e, py = y + Math.sin(ang) * sp * e + 900 * u * u * 0.4, sz = lerp(40, 120 + r() * 60, e);
    g.save(); g.globalAlpha *= 1 - clamp((u - 0.75) / 0.25); g.translate(px, py); g.rotate(rot * u);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-sz / 2 + 6, -sz / 2 + 8, sz, sz); g.drawImage(MINI, -sz / 2, -sz / 2, sz, sz);
    g.fillStyle = RED; g.beginPath(); g.arc(-sz / 2 + DOT[0] * sz, -sz / 2 + DOT[1] * sz, sz * 0.07, 0, 7); g.fill();
    g.restore();
  }
}
// ---- trap 3 as a little story (the author: "я бы перелистнул на третьем этапе"): "you" at the board, smug, one
// engine move a game; behind him a detective's cork board fills with the games, each with its red dot; on "pattern"
// red strings run from every dot to him (the conspiracy-board meme, drawn our way)
const CORKBASE = tex(1200, 880, (x, w, h) => {
  x.fillStyle = '#B98A5A'; x.fillRect(0, 0, w, h);
  const r = rng(19); for (let i = 0; i < 2600; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,80,40,0.35)' : 'rgba(225,190,140,0.35)'; x.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
  x.strokeStyle = '#6E4A2E'; x.lineWidth = 34; x.strokeRect(0, 0, w, h);
});
const CORK = makeCanvas(1200, 880);
const corkAt = k => { const i = k % 10, j = Math.floor(k / 10); return [96 + i * 112 + (hash2(k, 3) - 0.5) * 40, 80 + j * 72 + (hash2(k, 7) - 0.5) * 22, (hash2(k, 5) - 0.5) * 0.45]; };
// the order the games go up in: the first by his head (the close-up sees it), the rest all over the board
const CORK1 = 86, CORKORD = [CORK1, ...[...Array(100).keys()].filter(k => k !== CORK1).sort((a, b) => hash2(a, 11) - hash2(b, 11))];
function corkTex(t, { born = [], link = 0 } = {}) {  // born: when each game goes up, in CORKORD order
  const x = CORK.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(CORKBASE, 0, 0, 1200, 880);
  const cs = 66, focus = [600, 900];
  let n = 0; while (n < born.length && t >= born[n]) n++;
  for (let r = 0; r < n; r++) {
    const k = CORKORD[r], [cx, cy, rot] = corkAt(k), sc = 1 + 0.7 * (1 - ease.out(clamp((t - born[r]) / 0.14)));  // each lands with a slap
    x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc);
    x.fillStyle = 'rgba(40,24,10,0.35)'; x.fillRect(-cs / 2 + 4, -cs / 2 + 5, cs, cs); x.fillStyle = '#FFFFFF'; x.fillRect(-cs / 2 - 4, -cs / 2 - 4, cs + 8, cs + 8);
    x.drawImage(MINI, -cs / 2, -cs / 2, cs, cs);
    x.fillStyle = RED; x.beginPath(); x.arc(-cs / 2 + DOT[0] * cs, -cs / 2 + DOT[1] * cs, 7, 0, 7); x.fill();
    x.fillStyle = k % 3 ? '#2F6FD0' : '#D8402F'; x.beginPath(); x.arc(0, -cs / 2 - 2, 7, 0, 7); x.fill();
    x.restore();
  }
  if (link > 0) {  // the strings: from every dot to him, below the board
    x.strokeStyle = 'rgba(214,40,40,0.9)'; x.lineWidth = 3;
    for (let r = 0; r < n; r++) { const k = CORKORD[r], u = clamp(link * 1.6 - hash2(k, 13) * 0.6); if (u <= 0) continue; const [cx, cy, rot] = corkAt(k), dx = -cs / 2 + DOT[0] * cs, dy = -cs / 2 + DOT[1] * cs, px = cx + dx * Math.cos(rot) - dy * Math.sin(rot), py = cy + dx * Math.sin(rot) + dy * Math.cos(rot);
      x.beginPath(); x.moveTo(px, py); x.lineTo(lerp(px, focus[0], u), lerp(py, focus[1], u)); x.stroke(); }
  }
  return CORK;
}
function youAtBoard(g, t, { pieces, e = 'focus', cork = null } = {}) {
  dayRoom(g, t, { farSky: cork || SKY_T });
  tableSet(g, t, { pieces, wPlayer: false, wChair: false, bPlayer: true, black: 'you', eb: e, tableCol: WOODT });
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}
// a small webcam in a corner of the frame, a face with a name strip: "you" through the traps, more nervous at each one,
// CLOSED lands on it at the end; Hans in the hook. q: a "?" pops beside it
function camCard(g, t, who, e, { x = 838, y = 300, w = 210, label = null, closed = Infinity, a = 1, q = 0 } = {}) {
  if (a <= 0) return;
  const h = w * 1.15, L = CAMLOOK[who] || CAMLOOK.opp;
  g.save(); g.globalAlpha *= clamp(a);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 6, y + 8, w, h);
  webcam(g, x, y, w, h - 34, who, e, t, { bg: L.bg, zoom: 1.2, cy: 0.52 });
  g.fillStyle = '#101116'; g.fillRect(x, y + h - 34, w, 34); g.font = sans(22, 900); g.letterSpacing = '4px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = L.nameColor; g.fillText(label || L.name, x + w / 2, y + h - 16);
  g.strokeStyle = '#FFD27A'; g.lineWidth = 5; g.strokeRect(x, y, w, h);
  if (q > 0) {
    const k = lerp(1.6, 1, ease.back(clamp(q)));
    g.save(); g.translate(x - 30, y + 36); g.scale(k, k); g.rotate(-0.12);
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(0, 0, 36, 0, 7); g.fill(); g.strokeStyle = '#16161E'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#16161E'; g.font = sans(50, 900); g.letterSpacing = '0px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 3);
    g.restore();
  }
  g.restore();
  if (t >= closed) stamp(g, 'CLOSED', x + w * 0.42, y + h * 0.5, t, closed, { color: RED, size: 46, rot: -0.2 });  // a touch left: the frame edge is close
}
const youCard = (g, t, e, o = {}) => camCard(g, t, 'you', e, { label: 'YOU', ...o });

// the "vibrating device" of the 2022 rumour, never shown: a pink wand drawn whole, then the block round it (it and what
// is behind it) turned into the big squares of a censor's mosaic; buzzing (the hook, the loop at the end; crossed out on
// "Chess.com's clue wasn't a vibrator")
const MOS = makeCanvas(16, 16);
function mosaic(g, x0, y0, w, h, block) {  // the rectangle as it is on the canvas now, in squares of `block` px
  const m = g.getTransform(), px = m.a * x0 + m.c * y0 + m.e, py = m.b * x0 + m.d * y0 + m.f, pw = Math.abs(m.a) * w, ph = Math.abs(m.d) * h;
  const nx = Math.max(2, Math.round(w / block)), ny = Math.max(2, Math.round(h / block));
  if (MOS.width !== nx || MOS.height !== ny) { MOS.width = nx; MOS.height = ny; }
  const c = MOS.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, nx, ny); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.drawImage(g.canvas, px, py, pw, ph, 0, 0, nx, ny);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(MOS, 0, 0, nx, ny, px, py, pw, ph); g.restore();
}
function wandShape(g, h) {  // the device itself, centred, `h` tall: a round head on a long handle, shaded
  const s = h / 260;
  g.save(); g.scale(s, s);
  const hg = g.createRadialGradient(-16, 34, 6, 0, 54, 62); hg.addColorStop(0, '#FFD3EA'); hg.addColorStop(0.45, '#FF7FC0'); hg.addColorStop(1, '#B02A72');
  g.fillStyle = hg; g.beginPath(); g.ellipse(0, -76, 54, 50, 0, 0, 7); g.fill();
  const bg = g.createLinearGradient(-26, 0, 26, 0); bg.addColorStop(0, '#9E2366'); bg.addColorStop(0.35, '#FF9BD0'); bg.addColorStop(1, '#A8286C');
  g.fillStyle = bg; g.beginPath(); g.moveTo(-20, -34); g.lineTo(20, -34); g.lineTo(26, 10); g.lineTo(-26, 10); g.closePath(); g.fill();
  g.beginPath(); g.roundRect(-26, 4, 52, 122, 24); g.fill();
  g.fillStyle = '#F4F1F6'; for (const yy of [30, 58]) { g.beginPath(); g.arc(0, yy, 9, 0, 7); g.fill(); }
  g.fillStyle = '#5A1238'; g.fillRect(-26, 86, 52, 8);
  g.restore();
}
function pixVib(g, x, y, h, t, { a = 1, buzz = 1, rot = 0.25, both = false } = {}) {  // both: the buzz on both sides (else away from the face on its left)
  if (a <= 0) return;
  const sh = buzz ? 1 : 0, cx = x + Math.sin(t * 61) * h * 0.022 * sh, cy = y + Math.cos(t * 53) * h * 0.016 * sh;
  g.save(); g.globalAlpha *= clamp(a); g.translate(cx, cy); g.rotate(rot + Math.sin(t * 47) * 0.05 * sh); wandShape(g, h); g.restore();
  // the censor's squares over it and round it: about 8 across, 13 down
  const bw = h * 0.68, bh = h * 1.06, blk = h / 12.5;
  mosaic(g, Math.round(x - bw / 2), Math.round(y - bh / 2), Math.round(bw), Math.round(bh), blk);
  if (buzz <= 0) return;
  g.save(); g.globalAlpha *= clamp(a) * buzz; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const ph = (t * 3.4 + k / 3) % 1; g.strokeStyle = rgba(GOLD, 1 - ph); g.lineWidth = Math.max(4, h * 0.035);
    for (const sd of both ? [-1, 1] : [1]) { g.beginPath(); g.arc(x, y, h * (0.36 + ph * 0.32), sd > 0 ? -0.55 : Math.PI - 0.55, sd > 0 ? 0.55 : Math.PI + 0.55); g.stroke(); } }
  g.font = sans(Math.round(h * 0.16), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const [dx, dy, r] of [[0.22, -0.64, -0.2], [0.5, 0.5, 0.22]]) { g.save(); g.translate(clamp(x + dx * h, 150, W - 150) + Math.sin(t * 60) * 3, y + dy * h); g.rotate(r);
    g.strokeStyle = '#16120E'; g.lineWidth = h * 0.05; g.strokeText('BZZZ', 0, 0); g.fillStyle = GOLD; g.fillText('BZZZ', 0, 0); g.restore(); }
  g.restore();
}

// ---- trap 2 as a police lineup, seen through the one-way glass of the observation room (every trap a little story
// with a face, rule 71): three players at your rating hold their rating on a slate, "you" in the middle as number 2;
// the "!" of their best moves pop over their heads and pile up over his; on "stand out" the light finds him, the
// other two turn to look, he steps forward
const LU = { y: 742, s: 0.9, xs: [200, 540, 880], who: ['opp4', 'you', 'opp6'], win: [30, 300, 1050, 1200] };
const LU_WALL = tex(1020, 900, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#DCDFE5'); gr.addColorStop(1, '#AEB4C0'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.font = sans(24, 800); x.textBaseline = 'middle';
  for (let k = 0; k <= 15; k++) {
    const y = 70 + k * 55, major = k % 2 === 0;
    x.strokeStyle = `rgba(36,42,54,${major ? 0.5 : 0.25})`; x.lineWidth = major ? 4 : 2; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
    if (major) { const v = 7 - k / 4, lab = v % 1 ? `${Math.floor(v)}'6"` : `${v}'`; x.fillStyle = 'rgba(36,42,54,0.7)'; x.textAlign = 'left'; x.fillText(lab, 14, y - 17); x.textAlign = 'right'; x.fillText(lab, w - 14, y - 17); }
  }
});
function lineup(g, t, { e = [], bangs = [0, 0, 0], slate = 1, spot = 0, step = 0, zoom = 1, zc = [540, 700], flash = -9 } = {}) {
  const [wx0, wy0, wx1, wy1] = LU.win;
  g.save();
  g.fillStyle = '#1B1E25'; g.fillRect(0, 0, W, H);
  g.translate(zc[0], zc[1]); g.scale(zoom, zoom); g.translate(-zc[0], -zc[1]);
  // the dark observation room round the glass
  { const gr = g.createLinearGradient(0, 0, 0, wy0); gr.addColorStop(0, '#15171D'); gr.addColorStop(1, '#262A33'); g.fillStyle = gr; g.fillRect(-200, -200, W + 400, wy0 + 200); }
  // the lineup room behind the glass
  g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
  g.drawImage(LU_WALL, wx0, wy0, wx1 - wx0, wy1 - wy0);
  LU.xs.forEach(x => { const gr = g.createRadialGradient(x, wy0, 10, x, wy0 + 120, 420); gr.addColorStop(0, 'rgba(255,250,235,0.55)'); gr.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = gr; g.fillRect(x - 420, wy0, 840, 560); });
  g.font = sans(72, 900); g.letterSpacing = '0px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(30,34,44,0.72)';
  LU.xs.forEach((x, i) => g.fillText(String(i + 1), x, 500));
  const bx = LU.xs[1], cone = () => { g.moveTo(bx - 90, wy0); g.lineTo(bx + 90, wy0); g.lineTo(bx + 250, wy1); g.lineTo(bx - 250, wy1); g.closePath(); };
  if (spot > 0) { g.fillStyle = `rgba(10,12,20,${0.55 * spot})`; g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); cone(); g.fill('evenodd'); }  // the room goes dark round him
  for (const i of [0, 2, 1]) {  // "you" last: he steps forward, a little bigger and lower
    const isY = i === 1, st = isY ? ease.out(clamp(step)) : 0, s = LU.s * (1 + 0.1 * st), x = LU.xs[i], y = LU.y + 38 * st;
    g.filter = !isY && spot > 0 ? `brightness(${(1 - 0.32 * spot).toFixed(3)}) saturate(${(1 - 0.45 * spot).toFixed(3)})` : 'none';
    drawChar(g, LU.who[i], { x, y, s, e: e[i] || EXPR.neutral, t: t + i * 1.3 });
    if (slate > 0) {  // the slate with the rating, raised to the chest
      const sy = lerp(wy1 + 140, y + 262 * s, ease.out(clamp(slate))), sw = 214 * s, sh = 112 * s;
      g.fillStyle = '#15161B'; g.beginPath(); g.roundRect(x - sw / 2, sy - sh / 2, sw, sh, 8 * s); g.fill();
      g.strokeStyle = '#E6E6E6'; g.lineWidth = 3 * s; g.beginPath(); g.roundRect(x - sw / 2 + 8 * s, sy - sh / 2 + 8 * s, sw - 16 * s, sh - 16 * s, 5 * s); g.stroke();
      g.fillStyle = '#F2F2F2'; g.font = sans(58 * s, 900); g.letterSpacing = '2px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1200', x, sy + 3 * s);
      for (const sd of [-1, 1]) hand(g, x + sd * sw * 0.47, sy + sh * 0.36, 25 * s);
    }
    g.filter = 'none';
  }
  if (spot > 0) {  // the beam from the ceiling that holds him
    g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createLinearGradient(0, wy0, 0, wy1); gr.addColorStop(0, `rgba(255,240,200,${0.42 * spot})`); gr.addColorStop(1, 'rgba(255,240,200,0.02)'); g.fillStyle = gr; g.beginPath(); cone(); g.fill(); g.restore();
  }
  if (t >= flash && t < flash + 0.3) { g.fillStyle = `rgba(255,255,255,${0.85 * (1 - (t - flash) / 0.3)})`; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); }  // the mugshot flash
  g.save(); g.globalAlpha = 0.07; g.fillStyle = '#FFFFFF'; for (const [a, b] of [[80, 240], [330, 400], [700, 760]]) { g.beginPath(); g.moveTo(wx0 + a, wy0); g.lineTo(wx0 + b, wy0); g.lineTo(wx0 + b - 260, wy1); g.lineTo(wx0 + a - 260, wy1); g.closePath(); g.fill(); } g.restore();  // the glass
  g.restore();
  g.strokeStyle = '#0C0E12'; g.lineWidth = 26; g.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.strokeStyle = '#3A3F4A'; g.lineWidth = 3; g.strokeRect(wx0 - 13, wy0 - 13, wx1 - wx0 + 26, wy1 - wy0 + 26);
  // the counter under the glass, with the intercom
  { const gr = g.createLinearGradient(0, wy1 + 13, 0, H); gr.addColorStop(0, '#30343E'); gr.addColorStop(1, '#101216'); g.fillStyle = gr; g.fillRect(-200, wy1 + 13, W + 400, H); g.fillStyle = '#4A505C'; g.fillRect(-200, wy1 + 13, W + 400, 8); }
  { const fx = 610, fy = 1700; g.save(); g.translate(fx, fy); g.rotate(-0.06);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(10, 14, 360, 230); g.fillStyle = '#C9A86A'; g.beginPath(); g.roundRect(0, -26, 120, 40, 8); g.fill(); g.fillRect(0, 0, 360, 230);
    g.fillStyle = '#B08F55'; g.fillRect(0, 0, 360, 10); g.strokeStyle = 'rgba(178,34,34,0.85)'; g.lineWidth = 6; g.strokeRect(70, 80, 220, 74);
    g.fillStyle = 'rgba(178,34,34,0.9)'; g.font = sans(40, 900); g.letterSpacing = '4px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CASE #2', 180, 119); g.restore();
    g.fillStyle = '#E8E2D6'; g.beginPath(); g.roundRect(430, 1610, 100, 120, [6, 6, 18, 18]); g.fill(); g.strokeStyle = '#E8E2D6'; g.lineWidth = 12; g.beginPath(); g.arc(532, 1665, 24, -1.3, 1.3); g.stroke(); g.fillStyle = '#5A3A22'; g.beginPath(); g.ellipse(480, 1614, 46, 10, 0, 0, 7); g.fill(); }
  { const bx = 120, by = 1680; g.fillStyle = '#17191E'; g.beginPath(); g.roundRect(bx, by, 170, 96, 12); g.fill(); g.fillStyle = '#2C3038'; for (let i = 0; i < 5; i++) g.fillRect(bx + 18, by + 18 + i * 13, 70, 5);
    g.fillStyle = '#D23B33'; g.beginPath(); g.arc(bx + 128, by + 48, 22, 0, 7); g.fill(); g.strokeStyle = '#0A0B0D'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx + 60, by); g.quadraticCurveTo(bx + 50, by - 120, bx + 120, by - 170); g.stroke(); g.fillStyle = '#0A0B0D'; g.beginPath(); g.ellipse(bx + 128, by - 178, 20, 30, 0.6, 0, 7); g.fill(); }
  g.restore();
  // the "!" of the best moves: over the glass, stacked over each head
  LU.xs.forEach((x, i) => { const isY = i === 1, st = isY ? ease.out(clamp(step)) : 0, s = LU.s * (1 + 0.1 * st), y = LU.y + 38 * st;
    for (let b = 0; b < bangs[i]; b++) { const p = zoom === 1 ? [x, y - 205 * s - b * 60] : [zc[0] + (x - zc[0]) * zoom, zc[1] + (y - 205 * s - b * 60 - zc[1]) * zoom]; bang(g, p[0], p[1], 0.95 * zoom); } });
}

// ---- trap 4's story, the edit-bait (the author, 16.11.2026: «стримснайпить тоже нельзя, поэтому готам так наебал
// стримснайпера»): GothamChess on stream catches his opponent watching it and says out loud "f6 is a very good move";
// the opponent plays it and is mated, Qg6#. The board's top five ranks as on the stream; White's first two ranks are
// drawn plausibly (the clip does not show them)
const GB = (() => {  // [file, rank, piece, colour], from White's side
  const L = [], put = (w, c) => { const [f, r] = [w.charCodeAt(0) - 97, +w[1] - 1]; L.push([f, r, w[2], c]); };
  'a8r d8q e8k f8b g8n h8r d7n a7p b7p e7p f7p g7p c6p d5p h5p'.split(' ').forEach(w => put(w, 'b'));
  'd3q g5b e5p d4p h4p a2p b2p c2p f2p g2p a1r b1n e1k f1b g1n h1r'.split(' ').forEach(w => put(w, 'w'));
  return L;
})();
const STREAM = makeCanvas(1760, 990), SB = { s: 110, x: 60, y: 55 };
function streamTex(t, { f6 = 0, mate = 0, e = 'focus' } = {}) {
  const x = STREAM.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#17181D'; x.fillRect(0, 0, 1760, 990);
  const { s, x: bx, y: by } = SB, sq = (f, r) => [bx + f * s, by + (7 - r) * s];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; x.fillRect(bx + i * s, by + j * s, s, s); }
  const hl = (f, r, col = 'rgba(246,246,105,0.6)') => { const [qx, qy] = sq(f, r); x.fillStyle = col; x.fillRect(qx, qy, s, s); };
  if (mate > 0) { hl(3, 2); hl(6, 5); } else if (f6 > 0) { hl(5, 6); hl(5, 5); }
  if (mate >= 1) hl(4, 7, 'rgba(232,65,58,0.65)');  // the mated king
  for (const [f, r, ty, c] of GB) {
    let ff = f, rr = r;
    if (c === 'b' && ty === 'p' && f === 5 && r === 6) rr = 6 - ease.inOut(clamp(f6));                                  // ...f7-f6
    if (c === 'w' && ty === 'q') { const u = ease.inOut(clamp(mate)); ff = 3 + 3 * u; rr = 2 + 3 * u; }                // Qd3-g6#
    drawPiece(x, ty, c, bx + (ff + 0.5) * s, by + (7 - rr + 0.93) * s, s * 0.86);
  }
  const L = { bg: ['#5A3F3F', '#1E1616'], name: 'GOTHAMCHESS', nameColor: '#FFD6D6' };
  webcam(x, 990, 55, 720, 640, 'levy', e, t, { bg: L.bg, zoom: 1.0, cy: 0.5, name: L.name, nameColor: L.nameColor });
  x.fillStyle = '#E8413A'; x.beginPath(); x.roundRect(1020, 82, 136, 52, 10); x.fill(); x.fillStyle = '#FFFFFF'; x.font = sans(30, 900); x.letterSpacing = '2px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('● LIVE', 1088, 109);
  return STREAM;
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
// ======================= FROM `witty2`: THE EARTH =======================
const EARTH_DISC = tex(1024, 1024, (x, w) => {
  const r = rng(12), c = w / 2, R = w * 0.47;
  x.save(); x.beginPath(); x.arc(c, c, R, 0, 7); x.clip();
  const gr = x.createRadialGradient(c - R * 0.3, c - R * 0.35, R * 0.1, c, c, R * 1.05); gr.addColorStop(0, '#55A8F4'); gr.addColorStop(0.6, '#1F63C8'); gr.addColorStop(1, '#0B2A6B');
  x.fillStyle = gr; x.fillRect(0, 0, w, w);
  const land = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([px, py], k) => (k ? x.lineTo : x.moveTo).call(x, c + px * R, c + py * R)); x.closePath(); x.fill(); };
  x.lineJoin = 'round';  // the Americas and the edge of the Old World, roughly: enough to read as home
  land([[-0.66, -0.6], [-0.42, -0.76], [-0.1, -0.72], [0.1, -0.56], [0.02, -0.4], [-0.1, -0.3], [-0.16, -0.16], [-0.26, -0.1], [-0.3, 0.0], [-0.38, -0.12], [-0.5, -0.2], [-0.62, -0.38]], '#3E9A52');
  land([[-0.26, -0.02], [-0.08, 0.02], [0.08, 0.14], [0.12, 0.3], [0.02, 0.5], [-0.06, 0.74], [-0.15, 0.62], [-0.2, 0.36], [-0.3, 0.16]], '#4BA35A');
  land([[0.5, -0.56], [0.74, -0.46], [0.84, -0.2], [0.7, 0.0], [0.76, 0.3], [0.6, 0.26], [0.48, -0.02], [0.42, -0.32]], '#58A860');
  land([[-0.5, -0.5], [-0.3, -0.56], [-0.2, -0.44], [-0.34, -0.36]], '#B9AA6A'); land([[-0.12, 0.2], [0.02, 0.24], [-0.02, 0.4], [-0.14, 0.36]], '#3A8A48'); land([[0.54, -0.3], [0.7, -0.26], [0.66, -0.1], [0.52, -0.14]], '#C2B272');
  x.strokeStyle = 'rgba(255,255,255,0.78)'; x.lineCap = 'round';  // clouds
  for (let i = 0; i < 24; i++) { const a = r() * 7, d = Math.sqrt(r()) * R * 0.9, px = c + Math.cos(a) * d, py = c + Math.sin(a) * d; x.lineWidth = 8 + r() * 22; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 40 + r() * 80, py - 20 + r() * 40, px + 90 + r() * 160, py - 10 + r() * 30); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.ellipse(c, c - R * 0.95, R * 0.4, R * 0.12, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(c, c + R * 0.96, R * 0.34, R * 0.1, 0, 0, 7); x.fill();
  const sh = x.createRadialGradient(c - R * 0.45, c - R * 0.45, R * 0.8, c - R * 0.2, c - R * 0.2, R * 1.5); sh.addColorStop(0, 'rgba(2,6,20,0)'); sh.addColorStop(1, 'rgba(2,6,20,0.8)');
  x.fillStyle = sh; x.fillRect(0, 0, w, w);
  x.restore();
});
function planet(g, img, cx, cy, R, air) {  // a disc of radius R with a thin glow of air round it
  if (R < 4000) { const h = g.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.13); h.addColorStop(0, `rgba(${air},0.55)`); h.addColorStop(1, `rgba(${air},0)`); g.fillStyle = h; g.beginPath(); g.arc(cx, cy, R * 1.13, 0, 7); g.fill(); }
  const d = R / 0.94; g.drawImage(img, cx - d, cy - d, d * 2, d * 2);
}


// ======================= THE RIVALRY: CAST AND SETS =======================
const KID = { face: [1.0, 0.97, 0.95], bodyScale: 0.8, blushAlways: 0.25, ears: 1.05 };  // the boys (from `youngest`)
const BROWN = { base: '#B07A57', shade: '#99664A', deep: '#7A4C33', blush: '#B86458', hi: '#C8936E' };
Object.assign(CAST, {
  hikaru15: { ...KID, hair: 'fringe', hairC: '#16110E', brow: '#120D0A', suit: '#3B5E8C', suitD: '#2A4568', shirt: 'tee' },
  gukesh18: { face: [0.92, 1.06, 0.86], hair: 'swept', hairC: '#141010', brow: '#100C0A', suit: '#1E2430', suitD: '#141922', shirt: 'open', ears: 1.04, skin: BROWN },
});
CAMLOOK.hikaru = { bg: ['#3C4A66', '#151B28'], name: 'HIKARU', nameColor: '#CFE0FF' };
CAMLOOK.gukesh18 = { bg: ['#6A5A8E', '#221A33'], name: 'GUKESH', nameColor: '#E6DBFF' };
const GBONG = await fetch('../engine/data/carlsen_nakamura_mci2021.json').then(r => r.json());  // 1.e4 for the loop
const GNG = await fetch('../engine/data/nakamura_gukesh_2025.json').then(r => r.json());         // a middlegame between them

// someone at the board in the daylight room, facing us (Magnus's frame in `fairplay`)
function atBoard(g, t, who, { pieces = null, e = 'focus', under = null, over = null, front = null } = {}) {
  dayRoom(g, t, {});
  tableSet(g, t, { pieces, under, over, front, wPlayer: false, wChair: false, bPlayer: true, black: who, eb: e, tableCol: WOODT });
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}
const headAt = () => { const hp = B.project(4, 3.1, 9.3); return { x: hp.x, y: hp.y, s: hp.s / 100 * 1.05 }; };

// a crown (dashed: the one he was supposed to wear)
function crown(g, x, y, s, { a = 1, rot = 0, dashed = false } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(-62, 32); g.lineTo(-72, -32); g.lineTo(-36, 2); g.lineTo(0, -48); g.lineTo(36, 2); g.lineTo(72, -32); g.lineTo(62, 32); g.closePath();
  if (dashed) { g.setLineDash([14, 10]); g.strokeStyle = 'rgba(255,214,90,0.95)'; g.lineWidth = 8; g.lineJoin = 'round'; g.stroke(); g.setLineDash([]); }
  else {
    const gr = g.createLinearGradient(0, -48, 0, 32); gr.addColorStop(0, '#FFE892'); gr.addColorStop(1, '#D3961F'); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#7E520E'; g.lineWidth = 6; g.lineJoin = 'round'; g.stroke();
    for (const [gx, gc] of [[-40, '#E8413A'], [0, '#3A8FE0'], [40, '#7CFC9A']]) { g.fillStyle = gc; g.beginPath(); g.arc(gx, 15, 9, 0, 7); g.fill(); }
  }
  g.restore();
}

// the lie detector on the table: a case, a strip of paper running under three pens; wild 0..1: how far they swing
function polygraph(g, x, y, s, t, { wild = 0.3 } = {}) {
  const pen = (tt, i) => { const amp = 5 + 26 * wild; return Math.sin(tt * (5 + i * 2.3)) * amp * 0.6 + Math.sin(tt * (11 + i * 1.7)) * amp * 0.4; };
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(0, 78, 200, 26, 0, 0, 7); g.fill();
  g.fillStyle = '#2B2F38'; g.beginPath(); g.roundRect(-190, -96, 380, 170, 18); g.fill(); g.fillStyle = '#3B414D'; g.beginPath(); g.roundRect(-190, -96, 380, 22, [18, 18, 0, 0]); g.fill();
  g.fillStyle = '#F7F3E8'; g.fillRect(-160, -62, 300, 108);
  g.strokeStyle = 'rgba(150,165,190,0.55)'; g.lineWidth = 1.5;
  for (let k = 0; k < 10; k++) { const gx = -160 + (((k * 34 - t * 110) % 340) + 340) % 340; if (gx < 140) { g.beginPath(); g.moveTo(gx, -62); g.lineTo(gx, 46); g.stroke(); } }
  [['#E8413A', -32], ['#2F6FD0', -2], ['#1E2026', 26]].forEach(([col, cy], i) => {
    g.strokeStyle = col; g.lineWidth = 3.2; g.beginPath();
    for (let px = -160; px <= 112; px += 4) { const v = pen(t * 2.2 - (112 - px) / 115, i); px === -160 ? g.moveTo(px, cy + v) : g.lineTo(px, cy + v); }
    g.stroke();
    const v = pen(t * 2.2, i); g.strokeStyle = '#A3A9B4'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(112, cy + v); g.lineTo(172, cy - 8); g.stroke();
  });
  g.fillStyle = '#E8413A'; g.beginPath(); g.arc(-160, -82, 6, 0, 7); g.fill(); g.fillStyle = '#7CFC9A'; g.beginPath(); g.arc(-140, -82, 6, 0, 7); g.fill();
  g.restore();
}
// the breathing tube across his chest and two cables down to the machine (on the film, over the seated Hikaru)
function wired(g, mx, my, ms) {
  const { x, y, s } = headAt(), cy = y + 252 * s;
  g.save(); g.lineCap = 'round';
  for (const [col, dx] of [['#C83A32', -40], ['#20232A', 10]]) { g.strokeStyle = col; g.lineWidth = 8 * s; g.beginPath(); g.moveTo(x + dx * s, cy + 8 * s); g.bezierCurveTo(x + dx * s, cy + 220 * s, mx + 40 * ms, my - 260 * ms, mx - 120 * ms, my - 96 * ms); g.stroke(); }
  g.strokeStyle = '#1A1C22'; g.lineWidth = 32 * s; g.beginPath(); g.moveTo(x - 152 * s, cy); g.quadraticCurveTo(x, cy + 20 * s, x + 152 * s, cy); g.stroke();
  g.strokeStyle = '#4C525E'; g.lineWidth = 4 * s; for (let k = -6; k <= 6; k++) { const px = x + k * 23 * s, py = cy + 10 * s * (1 - (k / 6) ** 2); g.beginPath(); g.moveTo(px, py - 13 * s); g.lineTo(px, py + 13 * s); g.stroke(); }
  g.restore();
}
// Hikaru at the board, wired to the machine (the hook, the loop, the last frame)
const POLY_W = [6.7, -0.2, 4.9];
function lieDetector(g, t, { e = 'focus', pieces = null, wild = 0.3, ...o } = {}) {
  atBoard(g, t, 'hikaru', { pieces, e, ...o });
  const q = B.project(...POLY_W), ms = q.s / 100 * 0.72;
  wired(g, q.x, q.y, ms); polygraph(g, q.x, q.y, ms, t, { wild });
}

// "In 2003, he became America's youngest grandmaster": a front page of our own
function newspaper(g, t, { x = W / 2, y = 900, s = 1, rot = 0, e = 'happy' } = {}) {
  const w = 940, h = 1240;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 16, -h / 2 + 20, w, h);
  g.fillStyle = '#F2ECDD'; g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#16161E'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '4px';
  g.font = '700 86px Cinzel'; g.fillText('THE 64 GAZETTE', 0, -h / 2 + 84);
  g.fillRect(-w / 2 + 40, -h / 2 + 140, w - 80, 5); g.fillRect(-w / 2 + 40, -h / 2 + 196, w - 80, 2);
  g.font = sans(26, 800); g.letterSpacing = '6px'; g.fillText('NEW YORK · FEBRUARY 2003', 0, -h / 2 + 170);
  g.font = sans(78, 900); g.letterSpacing = '0px'; g.fillText('15-YEAR-OLD BREAKS', 0, -h / 2 + 290); g.fillText("FISCHER'S RECORD", 0, -h / 2 + 385);
  g.font = sans(34, 700); g.fillStyle = '#3A3A44'; g.fillText("America's youngest grandmaster ever", 0, -h / 2 + 475);
  // the photo
  const px = -w / 2 + 40, py = -h / 2 + 520, pw = 520, ph = 560;
  { const gr = g.createLinearGradient(0, py, 0, py + ph); gr.addColorStop(0, '#B8C2CF'); gr.addColorStop(1, '#6E7C8E'); g.fillStyle = gr; g.fillRect(px, py, pw, ph); }
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip(); drawChar(g, 'hikaru15', { x: px + pw / 2, y: py + ph * 0.48, s: 1.05, e, t }); g.restore();
  g.strokeStyle = '#16161E'; g.lineWidth = 4; g.strokeRect(px, py, pw, ph);
  g.fillStyle = '#3A3A44'; g.font = sans(24, 700); g.letterSpacing = '2px'; g.textAlign = 'left'; g.fillText('Hikaru Nakamura, 15', px, py + ph + 30);
  g.fillStyle = '#B9B3A4'; for (let k = 0; k < 16; k++) { const lx = px + pw + 30, ly = py + 8 + k * 34; g.fillRect(lx, ly, (k % 5 === 4 ? 200 : 330), 12); }
  for (let k = 0; k < 2; k++) g.fillRect(px, py + ph + 70 + k * 34, w - 80 - (k ? 260 : 0), 12);
  g.restore();
}

// "Then Magnus showed up": the boy alone with the crown over him; the screen splits, Magnus at 13, the crown moves over
function vsKids(g, t, u, eH, eM, cu) {
  const k = ease.out(clamp(u)), split = lerp(W, W / 2, k), hx = lerp(W / 2, W * 0.27, k), mx = lerp(W * 1.3, W * 0.73, k);
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3062A8'); gr.addColorStop(1, '#0E1A33'); g.fillStyle = gr; g.fillRect(0, 0, split, H); }
  if (k > 0) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#B23238'); gr.addColorStop(1, '#2E0B0D'); g.fillStyle = gr; g.fillRect(split, 0, W - split, H); }
  g.save(); g.beginPath(); g.rect(0, 0, split, H); g.clip(); drawChar(g, 'hikaru15', { x: hx, y: 930, s: 1.3, e: eH, t }); g.restore();
  if (k > 0) { g.save(); g.beginPath(); g.rect(split, 0, W - split, H); g.clip(); drawChar(g, 'magnus14', { x: mx, y: 930, s: 1.3, e: eM, t: t + 1.3 }); g.restore(); }
  { const gr = g.createLinearGradient(0, 1420, 0, H); gr.addColorStop(0, '#15151C'); gr.addColorStop(1, '#07070B'); g.fillStyle = gr; g.fillRect(0, 1420, W, H - 1420); }
  if (k > 0) { g.fillStyle = '#F5F0E6'; g.fillRect(split - 5, 0, 10, 1420); }
  g.font = sans(46, 900); g.letterSpacing = '4px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#CFE0FF'; g.fillText('HIKARU, 15', hx, 1560);
  if (k > 0.3) { g.globalAlpha = clamp((k - 0.3) / 0.4); g.fillStyle = '#FFC9C2'; g.fillText('MAGNUS, 13', mx, 1560); g.globalAlpha = 1; }
  const c = ease.inOut(clamp(cu));
  crown(g, lerp(hx, mx, c), 520 + Math.sin(t * 2.2) * 10 - Math.sin(Math.PI * c) * 140, 1.25, { dashed: c < 0.5 });
}

// 14 : 1 — both webcams (the counters are on the screen, in the shot's hud)
function scoreSet(g, t, { eM, eH, shakeH = 0 } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1D2130'); gr.addColorStop(1, '#090A10'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  webcam(g, 40, 300, 480, 600, 'magnus', eM, t, { bg: ['#B9A27E', '#4A3A28'], name: 'MAGNUS', nameColor: '#FFE2B0', zoom: 1.05 });
  webcam(g, 560, 300, 480, 600, 'hikaru', eH, t + 1.3, { bg: CAMLOOK.hikaru.bg, name: 'HIKARU', nameColor: '#CFE0FF', zoom: 1.05, shake: shakeH });
}

// "He could beat the whole world. Just not the man who owns it": a tall picture, Magnus up on the globe, Hikaru below
const STARS = (() => { const r = rng(31), o = []; for (let i = 0; i < 180; i++) o.push([r() * W, r() * 3000, 0.8 + r() * 2.2, r() * 7]); return o; })();
function globeScene(g, t, camY, zoom, { eH, eM, fly = -9 } = {}) {
  g.fillStyle = '#081024'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, 0); g.scale(zoom, zoom); g.translate(-W / 2, -camY);
  { const gr = g.createLinearGradient(0, 0, 0, 3000); gr.addColorStop(0, '#0A1430'); gr.addColorStop(1, '#1C3566'); g.fillStyle = gr; g.fillRect(-W, 0, W * 3, 3200); }
  for (const [sx, sy, rr, ph] of STARS) { g.fillStyle = `rgba(230,238,255,${(0.5 + 0.4 * Math.sin(t * 2.5 + ph)).toFixed(3)})`; g.beginPath(); g.arc(sx, sy, rr, 0, 7); g.fill(); }
  drawChar(g, 'magnus', { x: W / 2, y: 840, s: 1.15, e: eM, t: t + 0.7 });
  crown(g, W / 2, 840 - 250, 1.1, {});
  planet(g, EARTH_DISC, W / 2, 1950, 760, '120,190,255');
  if (fly > 0) {  // the rest of the world, knocked off the globe: little pieces flying
    const r = rng(41);
    for (let i = 0; i < 26; i++) { const t0 = fly + r() * 0.8, u = (t - t0) / 0.9; if (u < 0 || u > 1) continue; const a0 = -0.5 + r() * (Math.PI + 1.0), sx = W / 2 + Math.cos(a0) * 760, sy = 1950 + Math.sin(a0) * 760, dir = a0 + (r() - 0.5) * 0.6;
      drawPiece(g, ['p', 'n', 'b', 'r', 'q'][i % 5], r() < 0.5 ? 'w' : 'b', sx + Math.cos(dir) * 600 * u, sy + Math.sin(dir) * 600 * u + 900 * u * u, 70, { rot: u * 6 * (r() - 0.5), alpha: 1 - u * u }); }
  }
  drawChar(g, 'hikaru', { x: W / 2, y: 2400, s: 1.3, e: eH, t });
  g.restore();
}

// "Magnus won five World Championship matches. Hikaru never got to play in one": two shelves; the cups pop up one by one
// from t5 (0.16 s apart)
function shelves(g, t, { t5 = Infinity, eM, eH, empty = -9 } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2A2420'); gr.addColorStop(1, '#14100D'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const shelf = y => { g.fillStyle = '#6E4A2C'; g.fillRect(300, y, 740, 26); g.fillStyle = '#4A3018'; g.fillRect(300, y + 26, 740, 12); };
  camCard(g, t, 'magnus', eM, { x: 50, y: 520, w: 220, label: 'MAGNUS' }); shelf(820);
  ['2013', '2014', '2016', '2018', '2021'].forEach((yr, i) => {
    const k = clamp((t - t5 - i * 0.16) / 0.22); if (k <= 0) return; const x = 380 + i * 145;
    g.save(); g.translate(x, 820); g.scale(ease.back(k), ease.back(k)); trophy(g, 0, 0, 0.62, {}); g.restore();
    if (k > 0.5) { g.fillStyle = '#E9D9B0'; g.font = sans(28, 800); g.letterSpacing = '1px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(yr, x, 880); }
    if (k < 1) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(x, 760, 10, x, 760, 160); gr.addColorStop(0, `rgba(255,236,170,${0.7 * (1 - k)})`); gr.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gr; g.fillRect(x - 160, 600, 320, 320); g.restore(); }
  });
  camCard(g, t, 'hikaru', eH, { x: 50, y: 1400, w: 220, label: 'HIKARU' }); shelf(1700);
  // the empty shelf: dust and a cobweb in the corner
  g.save(); g.strokeStyle = 'rgba(230,230,230,0.55)'; g.lineWidth = 2;
  const cx = 1040, cy = 1700; for (let k = 0; k < 6; k++) { const a = Math.PI + k * Math.PI / 12; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 170, cy + Math.sin(a) * 170); g.stroke(); }
  for (let r = 40; r <= 160; r += 40) { g.beginPath(); for (let k = 0; k <= 6; k++) { const a = Math.PI + k * Math.PI / 12, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; k ? g.quadraticCurveTo(cx + Math.cos(a - 0.13) * r * 0.9, cy + Math.sin(a - 0.13) * r * 0.9, px, py) : g.moveTo(px, py); } g.stroke(); }
  g.restore();
  g.fillStyle = 'rgba(210,200,185,0.5)'; for (let k = 0; k < 22; k++) { const dx = ((k * 73) % 640) + 340, dy = Math.sin(t * 0.8 + k) * 40 + 1500 - ((t * 30 + k * 37) % 300); g.beginPath(); g.arc(dx, dy, 2.2, 0, 7); g.fill(); }  // dust in the light
  if (t >= empty) { const a = clamp((t - empty) / 0.3); g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(660, 1620, 20, 660, 1620, 380); gr.addColorStop(0, `rgba(255,240,200,${0.35 * a})`); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(260, 1240, 800, 480); g.restore(); }
}

// rain on the glass, for the sad part
function rain(g, t, a = 1) {
  if (a <= 0) return;
  const r = rng(77); g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(210,225,245,0.5)'; g.lineCap = 'round';
  for (let i = 0; i < 120; i++) { const x = r() * W, sp = 900 + r() * 700, len = 40 + r() * 60, y = ((r() * H + t * sp) % (H + 200)) - 100; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - len * 0.18, y + len); g.stroke(); }
  g.restore();
}

// ======================= v2 (16.11.2026). The author: «добавь эту цитату с визуализацией и побольше динамики в видео
// на каждый момент». Every flat scene now has its own camera, key words get punch-ins, long beats are cut into views
// (wide → close → the other face), and the quote from the comments gets its picture: the ladder and the wings =======================

// the camera of the flat scenes: [x, y, z, roll] — the picture point at the frame centre, the zoom and a tilt; it never
// shows past the edge of the picture (zoom at least 1, a tilt zooms in a little more to keep the corners covered)
function view2(g, [x, y, z, r = 0]) {
  const zz = Math.max(1, z) * (1 + Math.abs(r) * 1.85), hw = W / 2 / zz, hh = H / 2 / zz;
  g.translate(W / 2, H / 2); g.rotate(r); g.scale(zz, zz); g.translate(-clamp(x, hw, W - hw), -clamp(y, hh, H - hh));
}
// a move through keys [[local time, [x, y, z, ...]], ...] on the glide curve (rule 55); works for any list of numbers
function cam2(lt, keys) {
  let i = 0; while (i + 1 < keys.length && lt >= keys[i + 1][0]) i++;
  const [ta, A] = keys[i], [tb, Bk] = keys[Math.min(i + 1, keys.length - 1)];
  const u = tb > ta ? clamp((lt - ta) / (tb - ta)) : 1, e = 0.35 * u + 0.65 * ease.inOut(u);
  return A.map((a, k) => lerp(a, Bk[k] ?? a, e));
}
// a punch-in on a word: the frame jumps in by `amt` and settles back in about `d` seconds (shot option `zoom`)
const kickAt = (t, t0, amt = 0.07, d = 0.45) => { const dt = t - t0; return dt < 0 ? 1 : 1 + amt * Math.min(1, dt / 0.04) * Math.exp(-3 * dt / d); };
const kicks = list => (lt, t) => list.reduce((z, [t0, amt, d]) => z * kickAt(t, t0, amt, d), 1);

// a two-bone limb (shoulder → elbow → hand, hip → knee → foot), the joint bent outward; returns where the end landed
function limb(g, x0, y0, x1, y1, a, b, sd, col, lw) {
  let dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); const L = (a + b) * 0.995;
  if (d > L) { const k = L / d; dx *= k; dy *= k; x1 = x0 + dx; y1 = y0 + dy; d = L; }
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * Math.max(1, d)), -1, 1)), ea = Math.atan2(dy, dx) + sd * A * (dy < 0 ? 1 : -1);
  const ex = x0 + Math.cos(ea) * a, ey = y0 + Math.sin(ea) * a;
  g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.lineTo(x1, y1); g.stroke(); g.restore();
  return [x1, y1];
}

// ---------- the quote: "A man will spend his whole life building a ladder to reach the sky. Just to find out that
// someone else was born with wings." A tall world (the ground at LG): Hikaru builds his ladder rung by rung, a year on
// each rung, from the night at the ground up through the clouds into the gold; Magnus flies up past him on wings ----------
const LG = 5600, RS = 250, RX = [400, 680], HS = 0.7;
const rungY = i => LG - 170 - i * RS;
const RUNG_YEAR = [2003, 2004, 2005, 2007, 2009, 2011, 2013, 2015, 2016, 2018, 2020, 2022, 2024, 2026];
const CLOUD_BACK = (() => { const r = rng(57), o = []; for (let i = 0; i < 22; i++) o.push([-700 + r() * 2500, 700 + r() * 2900, 0.5 + r() * 1.0]); return o; })();
const CLOUD_FRONT = (() => { const r = rng(58), o = []; for (let i = 0; i < 18; i++) o.push([-600 + r() * 2300, 2560 + r() * 280, 0.8 + r() * 0.8]); return o; })();
function cloud(g, x, y, s, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const P = [[0, 0, 120], [115, -28, 100], [-112, -18, 92], [215, 22, 80], [-205, 24, 72], [40, -80, 84], [-50, 30, 100], [120, 40, 90]];
  g.fillStyle = 'rgba(214,190,214,0.9)'; for (const [cx, cy, r] of P) { g.beginPath(); g.arc(cx, cy + 18, r, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,248,240,0.97)'; for (const [cx, cy, r] of P) { g.beginPath(); g.arc(cx, cy, r * 0.94, 0, 7); g.fill(); }
  g.restore();
}
// where Hikaru's head, hands and feet are at level p (his hands on rung p when p is whole). One step: the new rung pops
// into place above him (he builds it), the right hand takes it, the body pulls up, the left hand follows, then the feet
function climbPose(p) {
  const n = Math.floor(p + 1e-6), f = p - n, io = ease.inOut;
  return { n, f, hy: rungY(n + io(clamp((f - 0.15) / 0.7))) + 126,
    hands: [[-1, n + io(clamp((f - 0.45) / 0.45)), clamp((f - 0.45) / 0.45)], [1, n + io(clamp(f / 0.45)), clamp(f / 0.45)]],
    feet: [[-1, n - 3 + io(clamp((f - 0.2) / 0.4))], [1, n - 3 + io(clamp((f - 0.55) / 0.4))]], nu: f > 0 ? clamp(f / 0.16) : 0 };
}
function ladder(g, P) {
  const top = P.nu > 0 ? P.n + 1 : P.n, yTop = rungY(P.n + (P.nu > 0 ? ease.out(P.nu) : 0)) - 46;
  for (const x of RX) { const gr = g.createLinearGradient(x - 15, 0, x + 15, 0); gr.addColorStop(0, '#7A4E2A'); gr.addColorStop(0.5, '#C9935C'); gr.addColorStop(1, '#5E3A1E'); g.fillStyle = gr; g.fillRect(x - 15, yTop, 30, LG + 80 - yTop); }
  for (let i = 0; i <= top; i++) {
    const k = i <= P.n ? 1 : P.nu, y = rungY(i);
    g.save(); g.translate(540, y); g.scale(i <= P.n ? 1 : ease.back(k), 1);
    g.fillStyle = '#9C6A3A'; g.fillRect(-152, -12, 304, 24); g.fillStyle = 'rgba(255,226,180,0.4)'; g.fillRect(-152, -12, 304, 6);
    g.restore();
    if (i > P.n && k < 1) { g.save(); g.globalAlpha = 1 - k; g.fillStyle = '#FFF3D6'; for (let j = 0; j < 7; j++) { const a = j * 0.9, r = 30 + k * 90; g.beginPath(); g.arc(540 + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.5, 9, 0, 7); g.fill(); } g.restore(); }
    if (RUNG_YEAR[i] && k > 0.6) {  // the year on the rung: a little plate on the left rail
      g.fillStyle = '#2A1C12'; g.beginPath(); g.roundRect(RX[0] - 132, y - 22, 104, 44, 8); g.fill();
      g.fillStyle = '#F2DDB6'; g.font = sans(28, 800); g.letterSpacing = '1px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(RUNG_YEAR[i]), RX[0] - 80, y + 1);
    }
  }
}
// Hikaru on his ladder: legs behind it, the bust, the ladder, the arms over the rungs
function climber(g, t, who, p, e) {
  const P = climbPose(p), hx = 540, s = HS, bs = CAST[who].bodyScale || 1, col = CAST[who].suit, skin = skinOf(who).base;
  for (const [sd, fr] of P.feet) {
    const fx = hx + sd * 82, fy = rungY(fr) - 14;
    limb(g, hx + sd * 62 * bs * s, P.hy + (96 + 400 * bs) * s, fx, fy, 170 * s * 1.25, 170 * s * 1.25, sd, '#262B38', 64 * s);
    g.fillStyle = '#15171D'; g.beginPath(); g.ellipse(fx + sd * 12, fy + 4, 36, 18, 0, 0, 7); g.fill();
  }
  drawChar(g, who, { x: hx, y: P.hy, s, e, t });
  ladder(g, P);
  for (const [sd, hr, u] of P.hands) {
    const tx = hx + sd * 96 + Math.sin(Math.PI * u) * sd * 34, ty = rungY(hr) - 2;
    const [ex, ey] = limb(g, hx + sd * 122 * bs * s, P.hy + (96 + 128 * bs) * s, tx, ty, 205 * s, 205 * s, sd, col, 58 * s);
    hand(g, ex, ey, 30, skin);
  }
  return P;
}
// big white wings behind a bust (x, y: its head; s: its scale), beating
function wings(g, x, y, s, t, { beat = 7.5, amp = 1, spread = 1 } = {}) {
  const fl = Math.sin(t * beat), sp = clamp(spread);
  for (const sd of [-1, 1]) {
    g.save(); g.translate(x + sd * 112 * s, y + 215 * s); g.scale(sd * s, s); g.rotate(lerp(1.15, -0.12 - 0.34 * fl * amp, sp)); g.scale(lerp(0.38, 1, sp), 1);
    const feather = (x0, y0, ang, len, wd, c0, c1) => {
      g.save(); g.translate(x0, y0); g.rotate(ang);
      const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, -wd * 0.35); g.quadraticCurveTo(len * 0.55, -wd * 0.62, len, 0); g.quadraticCurveTo(len * 0.55, wd * 0.62, 0, wd * 0.35); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,132,158,0.55)'; g.lineWidth = 3; g.stroke();
      g.strokeStyle = 'rgba(150,160,182,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(4, 0); g.lineTo(len * 0.92, 0); g.stroke();
      g.restore();
    };
    const wx = 300, wy = -190;  // the wrist; the arm runs from the shoulder (0, 0) up and out to it
    for (let i = 0; i < 9; i++) { const u = i / 8; feather(wx + 26 * u, wy - 10 * u, lerp(1.0, -0.42, u), lerp(360, 560, u), 62, '#F3F6FB', '#DCE3EE'); }  // primaries
    for (let i = 0; i < 9; i++) { const u = i / 8; feather(wx * u, wy * u, lerp(1.42, 1.02, u), lerp(250, 330, u), 70, '#FFFFFF', '#E6EBF3'); }  // secondaries
    for (let i = 0; i < 8; i++) { const u = 0.08 + i / 8; feather(wx * u, wy * u, lerp(1.25, 0.75, u), 170, 82, '#FFFFFF', '#EEF2F8'); }  // coverts
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(wx * 0.45, wy * 0.75, wx + 20, wy - 8); g.stroke();
    g.strokeStyle = 'rgba(255,214,120,0.8)'; g.lineWidth = 9; g.beginPath(); g.moveTo(8, -20); g.quadraticCurveTo(wx * 0.45, wy * 0.75 - 22, wx + 30, wy - 30); g.stroke();  // the sun on the leading edge
    g.restore();
  }
}
// Magnus flying: a gold halo, the wings, the bust over a little trail of cloud
function flyer(g, t, x, y, s, e, { trail = 1, spread = 1, streak = 0 } = {}) {
  { const gr = g.createRadialGradient(x, y + 120 * s, 40 * s, x, y + 120 * s, 760 * s); gr.addColorStop(0, 'rgba(255,240,190,0.6)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(x - 800 * s, y - 680 * s, 1600 * s, 1600 * s); }
  if (streak > 0) { const gr = g.createLinearGradient(0, y + 300 * s, 0, y + 2200 * s); gr.addColorStop(0, `rgba(255,246,220,${0.7 * streak})`); gr.addColorStop(1, 'rgba(255,246,220,0)'); g.fillStyle = gr; g.fillRect(x - 150 * s, y + 300 * s, 300 * s, 1900 * s); }
  wings(g, x, y, s, t, { spread });
  drawChar(g, 'magnus', { x, y, s, e, t: t + 0.7 });
  for (let i = 0; i < 4; i++) cloud(g, x + Math.sin(i * 2.1 + t * 3) * 60 * s, y + (500 + i * 110) * s, s * (0.75 - i * 0.12), trail * (1 - i * 0.2));
  if (trail < 1) { const gr = g.createRadialGradient(x, y + 470 * s, 20 * s, x, y + 470 * s, 300 * s); gr.addColorStop(0, `rgba(255,250,232,${0.95 * (1 - trail)})`); gr.addColorStop(0.5, `rgba(255,244,214,${0.6 * (1 - trail)})`); gr.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = gr; g.fillRect(x - 300 * s, y + 170 * s, 600 * s, 600 * s); }
}
// feathers drifting down from where he passed
const FEATH = (() => { const r = rng(91), o = []; for (let i = 0; i < 18; i++) o.push([r() * 760 - 380, r() * 600 - 300, r() * 0.9, 110 + r() * 90, r() * 7, 0.7 + r() * 0.6]); return o; })();
function feathers(g, t, t0, ox, oy) {
  if (t < t0) return;
  for (const [dx, dy, d, sp, ph, sc] of FEATH) {
    const dt = t - t0 - d; if (dt < 0) continue;
    g.save(); g.translate(ox + dx + Math.sin(dt * 2.3 + ph) * 55, oy + dy + dt * sp); g.rotate(Math.sin(dt * 2.3 + ph) * 0.9); g.scale(sc, sc);
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(0, -42); g.quadraticCurveTo(17, -6, 0, 40); g.quadraticCurveTo(-17, -6, 0, -42); g.fill();
    g.strokeStyle = 'rgba(120,132,158,0.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -38); g.lineTo(0, 50); g.stroke();
    g.restore();
  }
}
// the whole world through its own camera [cx, cy, z]; mag: { x, y, s, e } Magnus with wings; feath: when feathers fall
function ladderWorld(g, t, [cx, cy, z], { p = 3, who = 'hikaru', eH = EXPR.focus, mag = null, feath = -9, featherAt = [700, 2100], glow = 0, rays = 0, shade = 0 } = {}) {
  g.fillStyle = '#151B38'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-cx, -cy);
  { const gr = g.createLinearGradient(0, 0, 0, LG); gr.addColorStop(0, '#FFE6A8'); gr.addColorStop(0.2, '#FFC07C'); gr.addColorStop(0.42, '#E2876C'); gr.addColorStop(0.6, '#6E4E88'); gr.addColorStop(0.8, '#2C3466'); gr.addColorStop(1, '#151B38'); g.fillStyle = gr; g.fillRect(-3000, -2400, 7100, LG + 2400); }
  { const gr = g.createRadialGradient(540, 600, 60, 540, 600, 1500); gr.addColorStop(0, 'rgba(255,252,230,0.95)'); gr.addColorStop(0.35, 'rgba(255,236,170,0.4)'); gr.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gr; g.fillRect(-1000, -900, 3100, 3000); }
  for (const [sx, sy, rr, ph] of STARS) { const a = 0.35 + 0.3 * Math.sin(t * 2.5 + ph); g.fillStyle = `rgba(230,238,255,${a.toFixed(3)})`; g.beginPath(); g.arc(sx * 2.6 - 900, 3500 + sy * 0.62, rr, 0, 7); g.fill(); }
  if (rays > 0) { const rx = mag ? mag.x : 540, ry = mag ? mag.y : 700; g.save(); g.globalCompositeOperation = 'screen'; g.translate(rx, ry); g.rotate(t * 0.15); for (let k = 0; k < 14; k++) { g.rotate(Math.PI / 7); g.fillStyle = `rgba(255,236,170,${0.16 * rays})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -2600); g.lineTo(90, -2600); g.closePath(); g.fill(); } g.restore(); }
  for (const [x, y, s] of CLOUD_BACK) cloud(g, x, y, s, 0.85);
  g.fillStyle = '#0A0E1C'; g.beginPath(); g.moveTo(-3000, LG + 60); g.quadraticCurveTo(540, LG - 70, 4100, LG + 60); g.lineTo(4100, LG + 3000); g.lineTo(-3000, LG + 3000); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,214,120,0.75)'; for (let k = 0; k < 40; k++) { const wx = -900 + ((k * 197) % 2900), wy = LG + 40 + ((k * 53) % 90); g.fillRect(wx, wy, 8, 10); }
  const P = climber(g, t, who, p, eH);
  if (glow > 0) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(540, P.hy - 60, 30, 540, P.hy - 60, 520); gr.addColorStop(0, `rgba(255,226,150,${0.55 * glow})`); gr.addColorStop(1, 'rgba(255,226,150,0)'); g.fillStyle = gr; g.fillRect(0, P.hy - 600, W, 1100); g.restore(); }
  if (shade > 0) { g.save(); const gr = g.createRadialGradient(560, P.hy + 40, 60, 560, P.hy + 40, 620); gr.addColorStop(0, `rgba(24,18,46,${0.5 * shade})`); gr.addColorStop(0.55, `rgba(24,18,46,${0.32 * shade})`); gr.addColorStop(1, 'rgba(24,18,46,0)'); g.fillStyle = gr; g.fillRect(-100, P.hy - 700, W + 200, 1400); g.restore(); }  // his wings' shadow on Hikaru
  if (mag) flyer(g, t, mag.x, mag.y, mag.s, mag.e, { trail: mag.trail ?? 1, spread: mag.spread ?? 1, streak: mag.streak ?? 0 });
  feathers(g, t, feath, ...featherAt);
  for (const [x, y, s] of CLOUD_FRONT) cloud(g, x + Math.sin(t * 0.3 + x) * 20, y, s, 0.96);
  g.restore();
  return P;
}

// a blitz clock: a dark wedge, two green displays, two buttons (press: -1 / 1, the one going down)
function chessClock(g, x, y, s, t, { l = '', r = '', on = 1, press = 0, fs = 96 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(0, 132, 240, 28, 0, 0, 7); g.fill();
  for (const sd of [-1, 1]) { const dn = press === sd ? 16 : 0; g.fillStyle = press === sd ? '#F5C451' : '#545A68'; g.beginPath(); g.roundRect(sd * 98 - 68, -104 + dn, 136, 44 - dn, 8); g.fill(); }
  { const gr = g.createLinearGradient(0, -70, 0, 128); gr.addColorStop(0, '#343946'); gr.addColorStop(1, '#16181E'); g.fillStyle = gr; g.beginPath(); g.moveTo(-222, 128); g.lineTo(-198, -70); g.lineTo(198, -70); g.lineTo(222, 128); g.closePath(); g.fill(); }
  for (const [sd, txt] of [[-1, l], [1, r]]) {
    const dx = sd * 98; g.fillStyle = '#0B120E'; g.beginPath(); g.roundRect(dx - 82, -36, 164, 122, 10); g.fill();
    if (on > 0 && txt) { g.save(); g.globalAlpha *= clamp(on); g.fillStyle = '#C6FF5E'; g.shadowColor = '#B8F04A'; g.shadowBlur = 22; g.font = sans(fs, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, dx, 28); g.restore(); }
  }
  g.restore();
}
// a cutting of 1958 (the record Hikaru broke): a real photo of young Fischer (United Press, 1956, public domain)
function oldClip(g, img, { x = W / 2, y = 900, s = 1, rot = 0 } = {}) {
  const w = 760, h = 900;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 14, -h / 2 + 18, w, h);
  g.fillStyle = '#E6D7B5'; g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#2B2116'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = sans(30, 800); g.letterSpacing = '6px'; g.fillText('NEW YORK · 1958', 0, -h / 2 + 50);
  g.font = sans(64, 900); g.letterSpacing = '0px'; g.fillText('FISCHER, 15,', 0, -h / 2 + 125); g.fillText('YOUNGEST GM', 0, -h / 2 + 195);
  const pw = 560, ph = 520, px = -pw / 2, py = -h / 2 + 250;
  { const sc = Math.max(pw / img.width, ph / img.height) * 1.55, sw = pw / sc, shh = ph / sc, sx = clamp(0.42 * img.width - sw / 2, 0, img.width - sw), sy = clamp(0.4 * img.height - shh / 2, 0, img.height - shh);
    g.save(); g.filter = 'sepia(0.75) contrast(1.1) brightness(0.92)'; g.drawImage(img, sx, sy, sw, shh, px, py, pw, ph); g.restore(); }
  g.strokeStyle = '#2B2116'; g.lineWidth = 4; g.strokeRect(px, py, pw, ph);
  g.fillStyle = '#5A4A36'; g.font = sans(20, 700); g.letterSpacing = '1px'; g.fillText('Photo: United Press, 1956 · public domain', 0, py + ph + 30);
  g.restore();
}

// ======================= v3 (16.11.2026). The author: «на моменте с гукешом я бы перелистнул из-за отсутствия
// динамики и интересного чего то актуального, и в моменте где крылья сделай получше эту сцену… и сделай чтоб падающее
// перо которое на весы падает было переходом с сцены с лестницей на сцену с весами», then two photos: «сделай еще
// отсылки на эти фото». So: the stadium and the king thrown into the crowd (Checkmate: USA vs India, 2025), the wings
// scene rebuilt (the launch from the foot of the ladder, the years flying past, his shadow over Hikaru, one feather), the
// feather crossing the cut onto a balance that stands on the blitz clock, and the two photos redrawn (rule 67) =======================

Object.assign(CAST, {
  hikaruSuit: { ...CAST.hikaru, suit: '#1C1F26', suitD: '#121419', shirt: 'open' },
  magnusSuit: { ...CAST.magnus, suit: '#1F242D', suitD: '#151921', shirt: 'open' },
  girl1: { ...KID, hair: 'longcurly', hairC: '#6A4A2E', brow: '#4E3626', suit: '#ECE8E0', suitD: '#D4CEC2', shirt: 'tee', female: true },
  girl2: { ...KID, hair: 'longcurly', hairC: '#C2945E', brow: '#8A6440', suit: '#F4F0E8', suitD: '#DAD4C8', shirt: 'tee', female: true },
});

// ---------- photo 1: Hikaru, in a suit with a badge, walks past two girls holding «I ♥ Magnus» signs ----------
function heart(g, x, y, s, col = '#F26A2E') {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.beginPath();
  g.moveTo(0, 26); g.bezierCurveTo(-46, -4, -34, -46, 0, -24); g.bezierCurveTo(34, -46, 46, -4, 0, 26); g.fill(); g.restore();
}
function loveSign(g, x, y, w, h, rot, two = true) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  g.fillStyle = '#FBF9F3'; g.fillRect(-w / 2, -h / 2, w, h); g.strokeStyle = '#D6CFC0'; g.lineWidth = 3; g.strokeRect(-w / 2, -h / 2, w, h);
  g.fillStyle = '#1E1A16'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = sans(Math.round(h * 0.27), 700); g.letterSpacing = '1px';
  if (two) { g.fillText('I', -w * 0.3, -h * 0.2); heart(g, w * 0.08, -h * 0.2, h / 160, '#F26A2E'); g.fillText('Magnus', 0, h * 0.24); }
  else { heart(g, 0, -h * 0.2, h / 170, '#F26A2E'); g.fillText('Magnus', 0, h * 0.24); }
  g.restore();
}
function signsMeme(g, t, { hx = 800, eH, eG = EXPR.happy } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#CFC8BA'); gr.addColorStop(0.55, '#ABA497'); gr.addColorStop(1, '#7A7468'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.fillStyle = '#E9E3D6'; g.fillRect(0, 0, W, 170); g.fillStyle = 'rgba(255,250,235,0.6)'; for (let i = 0; i < 6; i++) g.fillRect(60 + i * 180, 40, 110, 22);  // ceiling lights
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { g.fillStyle = (i + j) % 2 ? '#5E8A44' : '#D8C25A'; g.fillRect(30 + i * 74, 240 + j * 74, 74, 74); }  // the checked wall
  g.fillStyle = '#23272F'; g.fillRect(830, 250, 210, 110); g.fillStyle = '#F1F3F5'; g.font = sans(60, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.letterSpacing = '2px'; g.fillText('03:5' + (Math.floor(t * 0.5) % 10), 935, 306);
  for (let i = 0; i < 9; i++) { const x = 420 + i * 70 + Math.sin(i * 3.1) * 20, y = 560 + Math.sin(i * 1.7) * 18; g.fillStyle = ['#8E8A84', '#7A766F', '#A39E95', '#6E6A64'][i % 4]; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); g.fillRect(x - 40, y + 26, 80, 120); }  // people far behind
  g.fillStyle = '#BDB4A3'; g.fillRect(0, 1080, W, H - 1080);
  drawChar(g, 'girl1', { x: 250, y: 700, s: 1.05, e: eG, t });
  drawChar(g, 'girl2', { x: 560, y: 770, s: 0.98, e: { ...eG, look: [-0.5, 0] }, t: t + 0.6 });
  // Hikaru walks past, a little bob in his step, the green lanyard and the badge
  const bob = -Math.abs(Math.sin(t * 6.5)) * 9;
  drawChar(g, 'hikaruSuit', { x: hx, y: 560 + bob, s: 1.18, e: eH, t: t + 1.3 });
  g.strokeStyle = '#2E8B57'; g.lineWidth = 12; g.beginPath(); g.moveTo(hx - 52, 560 + bob + 175); g.lineTo(hx - 8, 560 + bob + 420); g.lineTo(hx + 30, 560 + bob + 175); g.stroke();
  g.fillStyle = '#F4F4F0'; g.fillRect(hx - 40, 560 + bob + 418, 64, 84); g.fillStyle = '#2E8B57'; g.fillRect(hx - 40, 560 + bob + 418, 64, 18);
  // the signs, in front of the girls
  loveSign(g, 250, 960, 330, 260, -0.06, true);
  loveSign(g, 585, 1015, 300, 220, 0.07, false);
  // the glass rail with its orange band across the front
  g.fillStyle = 'rgba(225,235,240,0.62)'; g.fillRect(0, 1150, W, 470); g.fillStyle = '#E8823A'; g.fillRect(0, 1150, W, 26);
  g.fillStyle = '#B9BEC4'; g.fillRect(700, 1150, 20, 560); g.fillStyle = '#9AA0A8'; g.fillRect(0, 1610, W, 16);
}

// ---------- photo 2: the podium of the World Blitz, Moscow 2019 — Hikaru with silver and his eyes shut, Magnus with the
// cup and gold ----------
function medal(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#2F7D4E'; g.lineWidth = 26; g.beginPath(); g.moveTo(-70, 0); g.lineTo(0, 210); g.lineTo(70, 0); g.stroke();
  const gr = g.createRadialGradient(-14, 220, 6, 0, 236, 58); gr.addColorStop(0, col === 'gold' ? '#FFF1B0' : '#FFFFFF'); gr.addColorStop(1, col === 'gold' ? '#C9962A' : '#9AA3AE'); g.fillStyle = gr;
  g.beginPath(); g.arc(0, 238, 52, 0, 7); g.fill(); g.strokeStyle = col === 'gold' ? '#8A6418' : '#6E7680'; g.lineWidth = 6; g.stroke();
  g.restore();
}
function bigCup(g, x, y, s) {  // the tall cup of the blitz
  g.save(); g.translate(x, y); g.scale(s, s);
  const gold = (y0, y1) => { const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, '#9A6B1C'); gr.addColorStop(0.45, '#FFE39A'); gr.addColorStop(1, '#8A5E16'); return gr; };
  g.fillStyle = '#2A2420'; g.fillRect(-55, 150, 110, 50); g.fillStyle = gold(); g.fillRect(-18, 60, 36, 95);
  g.beginPath(); g.moveTo(-70, -120); g.quadraticCurveTo(-78, 40, 0, 66); g.quadraticCurveTo(78, 40, 70, -120); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0, -120, 72, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-40, -130); g.quadraticCurveTo(0, -230, 40, -130); g.fill(); g.beginPath(); g.arc(0, -232, 16, 0, 7); g.fill();
  g.restore();
}
function podiumMeme(g, t, { eH, eM } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1C2126'); gr.addColorStop(1, '#0E1114'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.strokeStyle = '#3E6A4E'; g.lineWidth = 34; g.beginPath(); g.arc(150, 250, 230, 0, 7); g.stroke();  // the round logo of the event, cut by the frame
  g.strokeStyle = '#B9A06A'; g.lineWidth = 8; g.beginPath(); g.arc(150, 250, 190, 0, 7); g.stroke();
  g.fillStyle = 'rgba(170,180,170,0.6)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 38px Cinzel'; g.letterSpacing = '4px'; g.fillText('WORLD BLITZ · MOSCOW 2019', 600, 400);
  drawChar(g, 'hikaruSuit', { x: 300, y: 820, s: 1.3, e: eH, t });
  medal(g, 300, 820 + 210, 1.0, 'silver');
  drawChar(g, 'magnusSuit', { x: 810, y: 700, s: 1.32, e: eM, t: t + 0.7 });
  medal(g, 810, 700 + 222, 1.0, 'gold');
  bigCup(g, 560, 860 + Math.sin(t * 1.4) * 4, 1.1);
  hand(g, 590, 960, 40, skinOf('magnus').base);
  g.fillStyle = '#F2F2EE'; g.fillRect(0, 1420, W, H - 1420); g.fillStyle = '#C9CCD0'; for (let i = 0; i < 6; i++) g.fillRect(40 + i * 180, 1480, 120, 36);  // the sponsors' board
}

// ---------- the stadium (Checkmate: USA vs India, Arlington, 4 October 2025): crowd, lights, two giant screens with
// the players' faces, the stage table; the king thrown into the crowd ----------
const FANS = (() => { const r = rng(61), o = []; for (let row = 0; row < 4; row++) for (let i = 0; i < 16; i++) o.push([i * 74 - 40 + (row % 2) * 37 + r() * 20, 1460 + row * 120 + r() * 20, 0.8 + row * 0.18 + r() * 0.12, r() * 7, r() < 0.35]); return o; })();
function stadium(g, t, { lit = 0, eH, eG, cheer = 0, flash = -9 } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0A0A18'); gr.addColorStop(0.6, '#140F2A'); gr.addColorStop(1, '#05050B'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // light beams sweeping from the rig
  g.save(); g.globalCompositeOperation = 'screen';
  for (let k = 0; k < 6; k++) { const a = Math.sin(t * 0.9 + k * 1.3) * 0.5 + (k - 2.5) * 0.18, x0 = 120 + k * 170; g.save(); g.translate(x0, 0); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, 0, 1500); gr.addColorStop(0, `rgba(${k % 2 ? '120,170,255' : '255,120,200'},${0.32 + 0.25 * lit})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(150, 1500); g.lineTo(-150, 1500); g.closePath(); g.fill(); g.restore(); }
  g.restore();
  // the LED wall over the stage
  g.fillStyle = '#05060A'; g.fillRect(170, 330, 740, 190); g.strokeStyle = '#3B3F55'; g.lineWidth = 6; g.strokeRect(170, 330, 740, 190);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (lit > 0.5) { g.fillStyle = '#FF3B3B'; g.shadowColor = '#FF3B3B'; g.shadowBlur = 30; g.font = sans(92, 900); g.letterSpacing = '6px'; g.fillText('CHECKMATE', 540, 428); }
  else { g.fillStyle = '#E8E8F2'; g.font = sans(54, 900); g.letterSpacing = '5px'; g.fillText('USA  vs  INDIA', 540, 428); }
  g.restore();
  // the two giant screens: Hikaru left, Gukesh right
  for (const [x, who, e, col] of [[30, 'hikaru', eH, '#3A5FBF'], [770, 'gukesh18', eG, '#E07A2E']]) {
    g.fillStyle = '#0B0C12'; g.fillRect(x - 6, 560, 292, 372); webcam(g, x, 566, 280, 360, who, e, t + (who === 'hikaru' ? 1.3 : 0), { bg: [col, '#141824'], zoom: 1.1 });
  }
  // the stage: a glowing table with the board, two small players at it
  g.fillStyle = '#1C1C2C'; g.beginPath(); g.moveTo(300, 1180); g.lineTo(780, 1180); g.lineTo(860, 1260); g.lineTo(220, 1260); g.closePath(); g.fill();
  g.fillStyle = '#E6E6F0'; g.fillRect(220, 1260, 640, 30);
  { const gr = g.createRadialGradient(540, 1150, 20, 540, 1150, 360); gr.addColorStop(0, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(180, 900, 720, 420); }
  for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; const x0 = 440 + i * 25 - j * 6, y0 = 1186 + j * 14; g.fillRect(x0, y0, 25 + 0.75 * j, 14); }
  drawChar(g, 'hikaru', { x: 360, y: 1080, s: 0.36, e: eH, t: t + 1.3 }); drawChar(g, 'gukesh18', { x: 720, y: 1080, s: 0.36, e: eG, t });
  // the crowd: heads and shoulders, phone lights, hands up when it cheers
  for (const [x, y, s, ph, phone] of FANS) {
    const up = cheer * clamp(0.6 + 0.4 * Math.sin(t * 9 + ph)), jump = cheer * Math.abs(Math.sin(t * 7 + ph)) * 16;
    g.fillStyle = '#07070D'; g.beginPath(); g.arc(x, y - jump, 44 * s, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + 92 * s - jump, 90 * s, 60 * s, 0, 0, 7); g.fill();
    if (up > 0.05 || phone) { const hx2 = x + 50 * s, hy2 = y - jump - 60 * s - up * 120 * s; g.strokeStyle = '#07070D'; g.lineWidth = 22 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 40 * s, y + 50 * s - jump); g.lineTo(hx2, hy2); g.stroke();
      if (phone) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(hx2, hy2, 2, hx2, hy2, 40 * s); gr.addColorStop(0, 'rgba(255,255,240,0.95)'); gr.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = gr; g.fillRect(hx2 - 40 * s, hy2 - 40 * s, 80 * s, 80 * s); g.restore(); } }
  }
  if (t >= flash) { const a = clamp(1 - (t - flash) / 0.35); if (a > 0) { g.fillStyle = `rgba(255,255,255,${0.55 * a})`; g.fillRect(0, 0, W, H); } }
}
// close on the stage: Hikaru throws the king — the arm goes up, the king leaves his hand and flies over the crowd
function kingThrow(g, t, t0, { e, cheer = 1 } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120C28'); gr.addColorStop(1, '#05050B'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.save(); g.globalCompositeOperation = 'screen';
  for (let k = 0; k < 5; k++) { const a = Math.sin(t * 1.4 + k * 1.7) * 0.6, x0 = 140 + k * 200; g.save(); g.translate(x0, -40); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, 0, 1700); gr.addColorStop(0, `rgba(${k % 2 ? '255,200,120' : '160,120,255'},0.5)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(170, 1700); g.lineTo(-170, 1700); g.closePath(); g.fill(); g.restore(); }
  g.restore();
  const x = 540, y = 700, s = 1.25, u = clamp((t - t0) / 0.35);  // u: the throw
  // the arm: up and back with the king, then flung forward; the other arm rises after
  const sh = [x + 150 * s, y + 230 * s], hand1 = u < 1 ? [lerp(x + 230 * s, x + 120 * s, ease.inOut(u)), lerp(y - 40 * s, y - 330 * s, ease.out(u))] : [x + 120 * s, y - 330 * s];
  drawChar(g, 'hikaru', { x, y, s, e, t: t + 1.3 });
  limb(g, sh[0], sh[1], hand1[0], hand1[1], 230 * s, 230 * s, 1, CAST.hikaru.suit, 66 * s); hand(g, hand1[0], hand1[1], 40 * s, skinOf('hikaru').base);
  const k2 = clamp((t - t0 - 0.25) / 0.3), h2 = [lerp(x - 230 * s, x - 150 * s, ease.out(k2)), lerp(y + 380 * s, y - 300 * s, ease.out(k2))];
  if (k2 > 0) { limb(g, x - 150 * s, y + 230 * s, h2[0], h2[1], 230 * s, 230 * s, -1, CAST.hikaru.suit, 66 * s); hand(g, h2[0], h2[1], 40 * s, skinOf('hikaru').base); }
  // the king: in his hand, then over the crowd toward us, spinning, bigger as it comes
  const f = clamp((t - t0 - 0.3) / 1.0);
  if (f <= 0) drawPiece(g, 'k', 'b', hand1[0], hand1[1] - 40 * s, 130, {});
  else { const kx = lerp(hand1[0], 220, f) , ky = hand1[1] - 40 * s - Math.sin(Math.PI * f) * 380 + f * f * 1300, ks = lerp(130, 330, f);
    drawPiece(g, 'k', 'b', kx, ky, ks, { rot: f * 9 }); }
  // the crowd in front, hands up, lit from the stage behind them
  { const gr = g.createLinearGradient(0, 1380, 0, H); gr.addColorStop(0, 'rgba(255,170,120,0)'); gr.addColorStop(0.35, 'rgba(255,170,120,0.35)'); gr.addColorStop(1, 'rgba(120,90,200,0.25)'); g.fillStyle = gr; g.fillRect(0, 1380, W, H - 1380); }
  for (const [cx, cy, cs, ph, phone] of FANS) {
    const up = cheer * clamp(0.5 + 0.5 * Math.sin(t * 9 + ph)), jump = cheer * Math.abs(Math.sin(t * 7 + ph)) * 18, y0 = cy + 120;
    g.fillStyle = '#05050A'; g.beginPath(); g.arc(cx, y0 - jump, 52 * cs, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx, y0 + 108 * cs - jump, 104 * cs, 70 * cs, 0, 0, 7); g.fill();
    const hx3 = cx + 60 * cs, hy3 = y0 - jump - 80 * cs - up * 140 * cs; g.strokeStyle = '#05050A'; g.lineWidth = 26 * cs; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 46 * cs, y0 + 60 * cs - jump); g.lineTo(hx3, hy3); g.stroke();
    if (phone) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(hx3, hy3, 2, hx3, hy3, 44 * cs); gr.addColorStop(0, 'rgba(255,255,240,0.95)'); gr.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = gr; g.fillRect(hx3 - 44 * cs, hy3 - 44 * cs, 88 * cs, 88 * cs); g.restore(); }
  }
}

// ---------- the turn: a balance standing on the blitz clock (the author called the clock «весы»). Five cups a pan;
// the sixth hangs over the beam ----------
const PIV = [540, 640], BEAM = 380, CHAIN = 250;
function balance(g, t, { tilt = 0, nL = 0, nR = 0, tL = -9, tR = -9, glintL = -9, glintR = -9, clock = {}, eM, eH, six = 0, london = 0, feather = false } = {}) {
  { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#15254A'); gr.addColorStop(1, '#060A15'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  for (const [x, col] of [[175, '255,226,176'], [905, '207,224,255']]) { const gr = g.createRadialGradient(x, 0, 30, x, 300, 760); gr.addColorStop(0, `rgba(${col},0.3)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, 1200); }
  if (london > 0) {  // the skyline: a clock tower and a wheel
    g.save(); g.globalAlpha = clamp(london); g.fillStyle = '#26345E';
    g.fillRect(0, 1700, W, 220); g.fillRect(130, 1430, 70, 280); g.beginPath(); g.moveTo(120, 1430); g.lineTo(165, 1350); g.lineTo(210, 1430); g.fill(); g.fillStyle = '#F5D27A'; g.beginPath(); g.arc(165, 1480, 20, 0, 7); g.fill();
    g.strokeStyle = '#26345E'; g.lineWidth = 8; const wr = t * 0.25; g.beginPath(); g.arc(860, 1560, 150, 0, 7); g.stroke(); for (let k = 0; k < 12; k++) { const a = wr + k * Math.PI / 6; g.beginPath(); g.moveTo(860, 1560); g.lineTo(860 + Math.cos(a) * 150, 1560 + Math.sin(a) * 150); g.stroke(); }
    g.fillStyle = '#26345E'; for (const [x0, w0, h0] of [[300, 120, 160], [440, 90, 110], [560, 140, 190], [990, 90, 130]]) g.fillRect(x0, 1700 - h0, w0, h0);
    g.fillStyle = 'rgba(255,214,120,0.8)'; for (let k = 0; k < 26; k++) { const wx = 310 + (k * 37) % 420, wy = 1560 + Math.floor(k / 11) * 40; g.fillRect(wx, wy, 10, 14); }
    g.restore();
  }
  camCard(g, t, 'magnus', eM, { x: 55, y: 150, w: 240, label: 'MAGNUS' }); camCard(g, t + 1.3, 'hikaru', eH, { x: 785, y: 150, w: 240, label: 'HIKARU' });
  if (six > 0) {  // the sixth cup comes down over the beam, rays behind it
    const k = clamp(six), cy = lerp(-200, 430, ease.out(k));
    g.save(); g.globalCompositeOperation = 'screen'; g.translate(540, cy - 40); g.rotate(t * 0.4); for (let r = 0; r < 12; r++) { g.rotate(Math.PI / 6); g.fillStyle = `rgba(255,230,160,${0.13 * k})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -620); g.lineTo(40, -620); g.closePath(); g.fill(); } g.restore();
    trophy(g, 540, cy + 60, 0.75, {}); g.fillStyle = '#16161E'; g.font = sans(60, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6', 540, cy - 20);
  }
  const brass = (x0, x1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#7A5A1E'); gr.addColorStop(0.5, '#F2CF7A'); gr.addColorStop(1, '#7A5A1E'); return gr; };
  g.fillStyle = brass(526, 554); g.fillRect(526, PIV[1], 28, 1000 - PIV[1]);  // the post down to the clock
  chessClock(g, 540, 1090, 0.95, t, clock);
  const ends = [-1, 1].map(sd => [PIV[0] + sd * BEAM * Math.cos(tilt), PIV[1] + sd * BEAM * Math.sin(tilt)]);
  for (const [i, [ex, ey]] of ends.entries()) {  // chains, pans, cups
    const py = ey + CHAIN; g.strokeStyle = '#C9A55A'; g.lineWidth = 4; for (const dx of [-110, 0, 110]) { g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + dx, py); g.stroke(); }
    const n = i ? nR : nL, t0 = i ? tR : tL, gl = i ? glintR : glintL;
    for (let c = 0; c < 5; c++) { if (c >= n) continue; const k = clamp((t - t0 - c * 0.08) / 0.2); const cx = ex - 96 + c * 48;
      g.save(); g.translate(cx, py); g.scale(ease.back(k), ease.back(k)); trophy(g, 0, -2, 0.3, {}); g.restore();
      const gk = (t - gl - c * 0.1) / 0.25; if (gk > 0 && gk < 1) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(cx, py - 40, 2, cx, py - 40, 70); gr.addColorStop(0, `rgba(255,248,210,${Math.sin(Math.PI * gk)})`); gr.addColorStop(1, 'rgba(255,248,210,0)'); g.fillStyle = gr; g.fillRect(cx - 70, py - 110, 140, 140); g.restore(); } }
    g.fillStyle = brass(ex - 135, ex + 135); g.beginPath(); g.moveTo(ex - 135, py); g.lineTo(ex + 135, py); g.quadraticCurveTo(ex, py + 70, ex - 135, py); g.fill();
  }
  g.save(); g.translate(...PIV); g.rotate(tilt); g.fillStyle = brass(-BEAM, BEAM); g.beginPath(); g.roundRect(-BEAM - 14, -12, 2 * BEAM + 28, 24, 12); g.fill(); g.restore();
  g.fillStyle = brass(510, 570); g.beginPath(); g.arc(PIV[0], PIV[1], 30, 0, 7); g.fill(); g.beginPath(); g.arc(PIV[0], PIV[1] - 40, 12, 0, 7); g.fill();
  if (feather) featherAt(g, PIV[0] + 10, PIV[1] - 56, 1.1, 1.35);
}
// a single feather (x, y its middle)
function featherAt(g, x, y, s, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#FFFFFF'; g.shadowColor = 'rgba(255,255,255,0.6)'; g.shadowBlur = 14; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(26, -10, 4, 56); g.quadraticCurveTo(-24, -6, 0, -60); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(96,108,140,0.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(26, -10, 4, 56); g.quadraticCurveTo(-24, -6, 0, -60); g.stroke();
  g.strokeStyle = 'rgba(150,160,182,0.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -56); g.quadraticCurveTo(4, 0, 2, 72); g.stroke();
  g.strokeStyle = 'rgba(190,198,214,0.6)'; g.lineWidth = 1.5; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(1, k * 11); g.lineTo(k % 2 ? 16 : -14, k * 11 - 8); g.stroke(); }
  g.restore();
}

// the last round: the two faces and the clock between them, ticking
function faceOff(g, t, { eH, eG, secs = 41, t0 = 0 } = {}) {
  { const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#13213F'); gr.addColorStop(0.5, '#0B0B12'); gr.addColorStop(1, '#3A1F10'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  webcam(g, 30, 250, 500, 580, 'hikaru', eH, t + 1.3, { bg: CAMLOOK.hikaru.bg, name: 'NAKAMURA', nameColor: '#CFE0FF', zoom: 1.08, shake: 0.12 });
  webcam(g, 550, 250, 500, 580, 'gukesh18', eG, t, { bg: ['#B97A3E', '#3A2614'], name: 'GUKESH', nameColor: '#FFE2B0', zoom: 1.08 });
  g.save(); g.font = sans(110, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFFFFF'; g.shadowColor = '#E8413A'; g.shadowBlur = 30; g.fillText('VS', W / 2, 560); g.restore();
  const left = Math.max(0, secs - Math.floor((t - t0) * 2)), fmtT = s => `0:${String(s).padStart(2, '0')}`;
  chessClock(g, 540, 950, 0.85, t, { l: fmtT(left), r: '1:12', on: 1, press: 1, fs: 62 });
}
// "It was a draw": two hands meet over the board
function handshake(g, t, t0, { flat = true } = {}) {
  if (flat) { const gr = g.createRadialGradient(540, 900, 100, 540, 900, 1100); gr.addColorStop(0, '#6E4E30'); gr.addColorStop(1, '#2A1C10'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (flat) { g.save(); g.translate(540, 980); g.rotate(-0.12); const sq = 104;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; g.fillRect(-4 * sq + i * sq, -4 * sq + j * sq, sq, sq); }
  g.strokeStyle = '#15151C'; g.lineWidth = 14; g.strokeRect(-4 * sq, -4 * sq, 8 * sq, 8 * sq);
  for (const [tp, c, i, j] of [['k', 'w', 6, 7], ['r', 'w', 5, 7], ['p', 'w', 5, 6], ['p', 'w', 6, 6], ['p', 'w', 7, 5], ['k', 'b', 6, 0], ['r', 'b', 2, 0], ['p', 'b', 5, 1], ['p', 'b', 6, 1], ['p', 'b', 7, 2], ['b', 'w', 3, 4], ['n', 'b', 4, 2]])
    drawPiece(g, tp, c, -4 * sq + (i + 0.5) * sq, -4 * sq + (j + 0.8) * sq, 120, {});
  g.restore(); }
  const u = clamp((t - t0 + 0.25) / 0.35), k = ease.out(u), shake = t > t0 + 0.1 ? Math.sin((t - t0) * 22) * 14 * Math.exp(-(t - t0) * 2.2) : 0;
  const hL = [lerp(60, 470, k), lerp(1080, 900, k) + shake], hR = [lerp(1020, 610, k), lerp(720, 900, k) + shake];
  g.lineCap = 'round';
  g.strokeStyle = '#2B2E36'; g.lineWidth = 130; g.beginPath(); g.moveTo(-200, 1160); g.lineTo(hL[0] - 70, hL[1] + 20); g.stroke();
  g.strokeStyle = '#8A8F99'; g.lineWidth = 40; g.beginPath(); g.moveTo(hL[0] - 96, hL[1] + 26); g.lineTo(hL[0] - 60, hL[1] + 16); g.stroke();
  g.strokeStyle = '#3C5A8C'; g.lineWidth = 130; g.beginPath(); g.moveTo(1280, 640); g.lineTo(hR[0] + 70, hR[1] - 20); g.stroke();
  g.strokeStyle = '#F2F2EE'; g.lineWidth = 40; g.beginPath(); g.moveTo(hR[0] + 96, hR[1] - 26); g.lineTo(hR[0] + 60, hR[1] - 16); g.stroke();
  hand(g, hR[0], hR[1], 84, BROWN.base); hand(g, hL[0], hL[1], 84, skinOf('hikaru').base);
  if (t > t0) shockwave(g, 540, 900, t, t0, { r0: 30, r1: 260, life: 0.45, color: '#FFFFFF', lw: 8, squash: 1 });
}

// ======================= v4 (16.11.2026). The author: «по моему качество как то упало, раньше ты больше делал 3д сцен и
// больше деталей в энвайроменте, а щас как то слабо». Rule 68 again: the flat scenes of v2–v3 go back into 3D sets —
// the score at the table under a scoreboard, a trophy room, the newspaper on a desk, the face-off over the shoulder, the
// stadium with its stage, screens, light rig and crowd, the scales on a desk in a night studio, the two photos as sets =======================

// a webcam picture drawn into its own canvas, to hang on a screen or in a frame in the world
const SCR = {};
function camTex(key, who, e, t, { bg = ['#2A2440', '#120F1E'], name = '', nameColor = CREAM, w = 600, h = 760 } = {}) {
  const c = SCR[key] || (SCR[key] = makeCanvas(w, h)), x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
  webcam(x, 0, 0, w, h, who, e, t, { bg, name, nameColor, zoom: 1.05, cy: 0.47 });
  return c;
}
// a screen on a stand: the panel at c (half sizes hw, hh, turned ry), a post and a foot on the floor
function screen3(g, img, c, hw, hh, ry = 0, { stand = true, frame = '#0B0B10', glow = null } = {}) {
  if (stand) { const back = ry === 0 ? 1 : -1; ab(g, [c[0] - 0.22, FLOOR_Y, c[2] + back * 0.1 - 0.2], [c[0] + 0.22, c[1] - hh, c[2] + back * 0.1 + 0.2], '#17171D'); ab(g, [c[0] - 1.3, FLOOR_Y, c[2] - 0.7], [c[0] + 1.3, FLOOR_Y + 0.14, c[2] + 0.7], '#17171D'); }
  camPanel(g, img, c, hw, hh, ry, { frame, glow });
}
const trophy3 = (g, x, y, z, hgt, a = 1) => { const q = B.project(x, y, z); if (q.z > 0.5) trophy(g, q.x, q.y, hgt * q.s / 170, { a }); return q; };

// ---------- 14 : 1 at the table: Magnus across the board, Hikaru with his back to us (or the reverse), the score lit on
// a screen behind whoever faces us ----------
const SCORE_T = makeCanvas(1280, 720);
function scoreTex(m, h) {
  const x = SCORE_T.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#06070B'; x.fillRect(0, 0, 1280, 720); ledGrid(x, 1280, 720, 10);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = sans(58, 900); x.letterSpacing = '10px'; x.fillStyle = GOLD; x.fillText('CLASSICAL GAMES', 640, 96);
  x.font = sans(300, 900); x.letterSpacing = '0px'; x.shadowBlur = 40;
  x.shadowColor = RED; x.fillStyle = '#FF6A5E'; x.fillText(String(m), 330, 390);
  x.shadowColor = '#7CFC9A'; x.fillStyle = h === null ? 'rgba(124,252,154,0.22)' : '#9CFFB4'; x.fillText(h === null ? '0' : String(h), 950, 390);
  x.shadowBlur = 0; x.fillStyle = '#F4EFE6'; x.fillText(':', 640, 370);
  x.font = sans(56, 900); x.letterSpacing = '8px'; x.fillStyle = '#FFE2B0'; x.fillText('MAGNUS', 330, 620); x.fillStyle = '#CFE0FF'; x.fillText('HIKARU', 950, 620);
  return SCORE_T;
}
const PSC = piecesAt(GNG, 24);
function scoreTable(g, t, { m = 0, h = null, eM, eH, wall = 'far' } = {}) {
  dayRoom(g, t, {});
  const img = scoreTex(m, h);
  if (wall === 'far') screen3(g, img, [4, 6.7, 12.3], 3.6, 2.03, 0, { glow: '#FFD9A0' });
  else screen3(g, img, [4, 6.7, -5.4], 3.6, 2.03, Math.PI, { glow: '#CFE0FF' });
  tableSet(g, t, { pieces: PSC, white: 'hikaru', black: 'magnus', ew: eH, eb: eM, tableCol: WOODT });
  lowKey(g, { cy: H * 0.46, a: 0.04 });
}

// ---------- the trophy room: a panelled wall, two oak shelves, a portrait in a gilt frame by each; Magnus's shelf fills
// with five cups under five spotlights, Hikaru's stays empty: dust and a cobweb ----------
const CUPY = 5.0, LOWY = 1.0;
function trophyRoom(g, t, { t5 = Infinity, empty = -9, eM, eH } = {}) {
  g.fillStyle = '#140E0A'; g.fillRect(0, 0, W, H);
  if (B.E[1] > FLOOR_Y) tiled(g, [-16, FLOOR_Y, -14], [36, 0, 0], [0, 0, 23.2], { color: '#3A2618', grout: 'rgba(0,0,0,0.3)', tu: 1.1, tv: 23.2, light: g2 => pool(g2, B, 4, FLOOR_Y + 0.02, 5, 10, '#FFD9A0', 0.2) });
  tiled(g, [-16, FLOOR_Y, 9.2], [36, 0, 0], [0, 17, 0], { color: '#22352A', grout: 'rgba(0,0,0,0.28)', tu: 3, tv: 3.4 });
  ab(g, [-16, FLOOR_Y, 8.9], [20, FLOOR_Y + 1.1, 9.2], '#4A3020'); ab(g, [-16, 12.4, 8.9], [20, 13.0, 9.2], '#4A3020');
  for (const y of [CUPY, LOWY]) { ab(g, [-1.4, y - 0.3, 7.0], [11.4, y, 9.2], '#7A5232', { spec: 0.25 }); for (const bx of [-0.8, 5, 10.8]) ab(g, [bx - 0.12, y - 1.1, 8.7], [bx + 0.12, y - 0.3, 9.2], '#4A3020'); }
  camPanel(g, camTex('pM', 'magnus', eM, t, { bg: ['#B9A27E', '#4A3A28'], name: 'MAGNUS', nameColor: '#FFE2B0' }), [-3.9, CUPY + 1.5, 9.05], 1.6, 2.02, 0, { frame: '#B8913E' });
  camPanel(g, camTex('pH', 'hikaru', eH, t + 1.3, { bg: CAMLOOK.hikaru.bg, name: 'HIKARU', nameColor: '#CFE0FF' }), [-3.9, LOWY + 1.5, 9.05], 1.6, 2.02, 0, { frame: '#B8913E' });
  ['2013', '2014', '2016', '2018', '2021'].forEach((yr, i) => {
    const x = 0.5 + i * 2.4, z = 8.1, k = clamp((t - t5 - i * 0.16) / 0.22);
    spotCone(g, B, { top: [x, 12.4, 7.8], base: [x, CUPY, z], r0: 0.25, r1: 1.05, color: '#FFE7B0', a: 0.08 + 0.16 * k, dust: 6, t, seed: i + 3 });
    if (k > 0) trophy3(g, x, CUPY, z, 1.55 * ease.back(k));
    const q = B.project(x, CUPY - 0.15, 7.0); if (q.z > 0.5 && k > 0.4) plate(g, yr, q.x, q.y, { color: '#C9A055', size: clamp(q.s * 0.24, 16, 40), qa: false });
  });
  // the empty shelf: dust in the air, a cobweb in its far corner
  const cw = [11.4, LOWY + 1.9, 9.18], base = [11.4, LOWY + 0.01, 7.6];
  g.save(); g.strokeStyle = 'rgba(235,235,235,0.6)'; g.lineWidth = 1.6; g.beginPath();
  for (let k = 0; k <= 6; k++) { const u = k / 6, p = [lerp(cw[0] - 2.2, base[0], u), lerp(cw[1], base[1], u), lerp(cw[2], base[2], u)]; line3(g, [11.4, LOWY + 0.01, 9.18], p); }
  for (let r = 1; r <= 4; r++) { const f = r / 4.5; let prev = null; for (let k = 0; k <= 6; k++) { const u = k / 6, p = [lerp(11.4, lerp(cw[0] - 2.2, base[0], u), f), lerp(LOWY + 0.01, lerp(cw[1], base[1], u), f), lerp(9.18, lerp(cw[2], base[2], u), f)]; if (prev) line3(g, prev, p); prev = p; } }
  g.stroke(); g.restore();
  if (t >= empty) spotCone(g, B, { top: [5, 12.4, 7.8], base: [5, LOWY, 8.1], r0: 0.4, r1: 2.6, color: '#FFF1D6', a: 0.16 * clamp((t - empty) / 0.3), dust: 26, t, seed: 21 });
  for (let k = 0; k < 26; k++) { const x = -0.8 + (k * 0.47) % 11.6, y = LOWY + 0.4 + ((t * 0.18 + k * 0.137) % 1) * 3.2, z = 7.4 + (k % 4) * 0.4, q = B.project(x, y, z); if (q.z > 0.5) { g.fillStyle = 'rgba(230,220,200,0.5)'; g.beginPath(); g.arc(q.x, q.y, Math.max(1.2, q.s * 0.025), 0, 7); g.fill(); } }
}

// ---------- the newspaper on a desk in the day room: the paper drops onto the desk; the cutting of 1958 beside it ----------
const PAPER_T = makeCanvas(940, 1240), CLIP_T = makeCanvas(760, 900);
function deskScene(g, t, { paper = null, clip = null, kid = EXPR.happy } = {}) {
  dayRoom(g, t, {});
  ab(g, [-3.5, -0.55, -2.2], [11.5, 0, 9.6], '#B0855A', { spec: 0.15 });  // the desk
  for (const [x, z] of [[-3, -1.7], [11, -1.7], [-3, 9.1], [11, 9.1]]) ab(g, [x - 0.25, FLOOR_Y, z - 0.25], [x + 0.25, -0.55, z + 0.25], '#7A5634');
  pool(g, B, 9.2, 0.02, 6.6, 4.5, '#FFE7B8', 0.35);
  lathe(g, 9.6, 7.6, [[0, 0.7, 0.7], [0.18, 0.7, 0.7], [0.22, 0.12, 0.12]], '#2A2A30', { spec: 0.4 });  // a desk lamp: foot, arm, shade
  cylinder(g, [9.6, 0.2, 7.6], [9.0, 4.0, 7.0], 0.08, '#2A2A30'); cylinder(g, [9.0, 4.0, 7.0], [7.8, 3.6, 6.2], 0.08, '#2A2A30');
  lathe(g, 7.6, 6.0, [[2.7, 0.9, 0.9], [3.4, 0.5, 0.5], [3.7, 0.2, 0.2]], '#2F6B4E', { spec: 0.4 });
  lathe(g, -1.8, 0.6, [[0, 0.5, 0.5], [1.1, 0.55, 0.55]], '#F2EEE6', { spec: 0.3 });  // a mug
  for (const [tp, c, x, z] of [['k', 'w', 10.2, 1.0], ['q', 'b', 10.9, 1.6], ['n', 'w', 9.6, 0.4]]) { const q = B.project(x, 0, z); if (q.z > 0.5) drawPiece(g, tp, c, q.x, q.y, 1.2 * q.s, {}); }
  const lay = (img, { x, z, w, h, rot = 0, y = 0.02 }) => {  // a sheet lying on the desk, its top away from us
    const P = (u, v) => [x + Math.cos(rot) * u - Math.sin(rot) * v, y, z + Math.sin(rot) * u + Math.cos(rot) * v];
    texQuad(g, img, P(-w, h), P(w, h), P(-w, -h));
  };
  if (clip) { const x = CLIP_T.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); oldClip(x, FISCHER13, { x: 380, y: 450, s: 1, rot: 0 }); lay(CLIP_T, clip); }
  if (paper) { const x = PAPER_T.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); newspaper(x, t, { x: 470, y: 620, s: 1, rot: 0, e: kid }); shadow3(g, paper.x, 0.015, paper.z, paper.w * 1.05, paper.h * 1.05, paper.y > 0.1 ? 0.25 / (1 + paper.y) : 0.22); lay(PAPER_T, paper); }
}

// ---------- the stadium (Checkmate: USA vs India, Esports Stadium Arlington, 4 October 2025) in 3D: a dark hall, the
// stage, the LED wall, two giant screens, the light rig, the crowd between us and the stage ----------
const LEDW = makeCanvas(1600, 700);
function ledWallTex(lit, t) {
  const x = LEDW.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = '#05060A'; x.fillRect(0, 0, 1600, 700); x.textAlign = 'center'; x.textBaseline = 'middle';
  if (lit) { x.fillStyle = '#FF3B3B'; x.shadowColor = '#FF3B3B'; x.shadowBlur = 50; x.font = sans(230, 900); x.letterSpacing = '12px'; x.fillText('CHECKMATE', 800, 360); }
  else { x.fillStyle = '#E8E8F2'; x.shadowColor = '#8FA8FF'; x.shadowBlur = 30; x.font = sans(170, 900); x.letterSpacing = '14px'; x.fillText('USA  vs  INDIA', 800, 360); }
  x.shadowBlur = 0; ledGrid(x, 1600, 700, 12);
  return LEDW;
}
const FANS3 = (() => { const r = rng(64), o = []; for (let row = 0; row < 6; row++) for (let i = 0; i < 20; i++) o.push({ x: -14 + i * 1.6 + (row % 2) * 0.8 + (r() - 0.5) * 0.4, z: -7.5 - row * 1.8 + (r() - 0.5) * 0.4, rise: row * 0.55, ph: r() * 7, phone: r() < 0.3 }); return o; })();
function fans3(g, t, cheer = 0) {
  const list = FANS3.map(p => ({ p, q: B.project(p.x, FLOOR_Y + 2.7 + p.rise, p.z) })).filter(o => o.q.z > 0.7).sort((a, b) => b.q.z - a.q.z);
  for (const { p, q } of list) {
    const s = q.s, y = q.y - cheer * Math.abs(Math.sin(t * 7 + p.ph)) * 0.25 * s, up = cheer * clamp(0.55 + 0.45 * Math.sin(t * 9 + p.ph));
    g.fillStyle = '#0B0A14'; g.beginPath(); g.arc(q.x, y, 0.42 * s, 0, 7); g.fill(); g.beginPath(); g.ellipse(q.x, y + 0.98 * s, 0.86 * s, 0.62 * s, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(160,140,255,0.4)'; g.lineWidth = Math.max(1, 0.06 * s); g.beginPath(); g.arc(q.x, y, 0.42 * s, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (up > 0.05 || p.phone) {
      const hx = q.x + 0.5 * s, hy = y - (0.35 + up * 1.0) * s; g.strokeStyle = '#0B0A14'; g.lineWidth = 0.24 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(q.x + 0.45 * s, y + 0.6 * s); g.lineTo(hx, hy); g.stroke();
      if (p.phone) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(hx, hy, 1, hx, hy, 0.45 * s); gr.addColorStop(0, 'rgba(255,255,240,0.95)'); gr.addColorStop(1, 'rgba(255,255,240,0)'); g.fillStyle = gr; g.fillRect(hx - 0.45 * s, hy - 0.45 * s, 0.9 * s, 0.9 * s); g.restore(); }
    }
  }
}
const PST = piecesAt(GNG, 60);
function arena3(g, t, { lit = 0, cheer = 0, eH, eG, flash = -9, crowd = true, pieces = PST } = {}) {
  g.fillStyle = '#06060E'; g.fillRect(0, 0, W, H);
  tiled(g, [-26, FLOOR_Y, -28], [60, 0, 0], [0, 0, 52], { color: '#12121C', grout: 'rgba(120,120,200,0.08)', tu: 3, tv: 3, light: g2 => pool(g2, B, 4, FLOOR_Y + 0.02, 4, 12, '#9A8CFF', 0.22) });
  ab(g, [-12, FLOOR_Y, 20], [20, FLOOR_Y + 18, 21], '#0A0A14');  // the back of the hall
  texQuad(g, ledWallTex(lit > 0.5, t), [-7, 12.5, 18.4], [15, 12.5, 18.4], [-7, 3.0, 18.4]);
  ab(g, [-7.4, 2.6, 18.5], [15.4, 2.95, 19], '#20202C'); ab(g, [-7.4, 12.5, 18.5], [15.4, 12.9, 19], '#20202C');
  pool(g, B, 4, 7, 18, 12, lit > 0.5 ? '#FF4A4A' : '#8FA8FF', 0.22, true);
  screen3(g, camTex('aH', 'hikaru', eH, t + 1.3, { bg: ['#3A5FBF', '#141824'], name: 'NAKAMURA', nameColor: '#CFE0FF' }), [-8.5, 7.2, 12], 2.7, 3.42, 0.35, { glow: '#6F8FFF' });
  screen3(g, camTex('aG', 'gukesh18', eG, t, { bg: ['#E07A2E', '#141824'], name: 'GUKESH', nameColor: '#FFE2B0' }), [16.5, 7.2, 12], 2.7, 3.42, -0.35, { glow: '#FF9A50' });
  ab(g, [-3.5, FLOOR_Y, -4.2], [11.5, FLOOR_Y + 0.3, 12.2], '#1C1C2C');  // the stage
  for (const [a, b] of [[[-3.6, FLOOR_Y + 0.3, -4.3], [11.6, FLOOR_Y + 0.42, -4.1]], [[-3.6, FLOOR_Y + 0.3, -4.3], [-3.4, FLOOR_Y + 0.42, 12.3]], [[11.4, FLOOR_Y + 0.3, -4.3], [11.6, FLOOR_Y + 0.42, 12.3]]]) ab(g, a, b, `hsl(${(t * 60) % 360},90%,62%)`, { amb: 1 });
  for (let k = 0; k < 6; k++) spotCone(g, B, { top: [-8 + k * 4, 20, 6 + Math.sin(t * 0.7 + k) * 3], base: [4 + Math.sin(t * 0.9 + k * 1.3) * 7, FLOOR_Y, 4 + Math.cos(t * 0.8 + k) * 5], r0: 0.3, r1: 3.0, color: k % 2 ? '#8FA8FF' : '#FF8FD0', a: 0.12 + 0.1 * lit, dust: 10, t, seed: k + 7 });
  const fansBehind = B.E[2] > 2;
  if (crowd && fansBehind) fans3(g, t, cheer);
  tableSet(g, t, { pieces, white: 'gukesh18', black: 'hikaru', ew: eG, eb: eH, tableCol: ['#2C2C38', '#18181F', '#22222C'] });
  if (crowd && !fansBehind) fans3(g, t, cheer);
  if (t >= flash) { const a = clamp(1 - (t - flash) / 0.35); if (a > 0) { g.fillStyle = `rgba(255,255,255,${0.5 * a})`; g.fillRect(0, 0, W, H); } }
}
// the throw, on top of the 3D stage: Hikaru's arm goes up with the king, the king flies over us into the crowd
function throw3(g, t, t0) {
  const hp = B.project(4, 3.1, 9.3), s = hp.s / 100 * 1.05, x = hp.x, y = hp.y, u = clamp((t - t0) / 0.35);
  const sh = [x + 150 * s, y + 230 * s], h1 = [lerp(x + 230 * s, x + 120 * s, ease.inOut(u)), lerp(y - 40 * s, y - 330 * s, ease.out(u))];
  limb(g, sh[0], sh[1], h1[0], h1[1], 230 * s, 230 * s, 1, CAST.hikaru.suit, 66 * s); hand(g, h1[0], h1[1], 40 * s, skinOf('hikaru').base);
  const k2 = clamp((t - t0 - 0.25) / 0.3), h2 = [lerp(x - 230 * s, x - 150 * s, ease.out(k2)), lerp(y + 380 * s, y - 300 * s, ease.out(k2))];
  if (k2 > 0) { limb(g, x - 150 * s, y + 230 * s, h2[0], h2[1], 230 * s, 230 * s, -1, CAST.hikaru.suit, 66 * s); hand(g, h2[0], h2[1], 40 * s, skinOf('hikaru').base); }
  const f = clamp((t - t0 - 0.3) / 1.0);
  if (f <= 0) { drawPiece(g, 'k', 'b', h1[0], h1[1] - 40 * s, 300 * s, {}); return; }
  const p = [lerp(4.6, -1.2, f), lerp(6.2, 2.6, f) + Math.sin(Math.PI * f) * 1.4, lerp(9.0, -11, f)], q = B.project(...p);  // low, straight at us
  if (q.z > 0.6) drawPiece(g, 'k', 'b', q.x, q.y, 1.5 * q.s, { rot: f * 9 });
}

// ---------- the turn in 3D: a night studio, a desk, the balance standing on a blitz clock; the two of them on screens on
// the back wall; London through the window when the sixth cup comes ----------
const CLK = {}, PIVY = 6.0, BEAM3 = 3.6, CH3 = 2.4;
function digitTex(txt) { return once(`dg:${txt}`, 300, 220, (x, w, h) => { x.fillStyle = '#0B120E'; x.fillRect(0, 0, w, h); if (txt) { x.fillStyle = '#C6FF5E'; x.shadowColor = '#B8F04A'; x.shadowBlur = 24; x.font = sans(txt.length > 2 ? 110 : 170, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, w / 2, h / 2 + 6); } }); }
const LONDON_T = tex(1400, 800, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0C1430'); gr.addColorStop(1, '#2A2E5A'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 60; k++) x.fillRect((k * 197) % w, (k * 89) % (h * 0.5), 2, 2);
  x.fillStyle = '#121A38'; x.fillRect(0, 600, w, 200); x.fillRect(170, 250, 90, 360); x.beginPath(); x.moveTo(160, 250); x.lineTo(215, 150); x.lineTo(270, 250); x.fill();
  x.fillStyle = '#F5D27A'; x.beginPath(); x.arc(215, 310, 26, 0, 7); x.fill();
  x.strokeStyle = '#121A38'; x.lineWidth = 10; x.beginPath(); x.arc(1080, 450, 190, 0, 7); x.stroke(); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; x.beginPath(); x.moveTo(1080, 450); x.lineTo(1080 + Math.cos(a) * 190, 450 + Math.sin(a) * 190); x.stroke(); }
  x.fillStyle = '#121A38'; for (const [x0, w0, h0] of [[360, 150, 210], [540, 110, 150], [690, 170, 250], [1290, 110, 170]]) x.fillRect(x0, 600 - h0, w0, h0);
  x.fillStyle = 'rgba(255,214,120,0.85)'; for (let k = 0; k < 40; k++) x.fillRect(372 + (k * 41) % 480, 440 + Math.floor(k / 12) * 40, 12, 16);
  x.strokeStyle = '#F4EFE6'; x.lineWidth = 24; x.strokeRect(0, 0, w, h); x.lineWidth = 12; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
});
function studio(g, t, { eM, eH, london = 0 } = {}) {
  g.fillStyle = '#0B1020'; g.fillRect(0, 0, W, H);
  if (B.E[1] > FLOOR_Y) tiled(g, [-16, FLOOR_Y, -16], [36, 0, 0], [0, 0, 28], { color: '#1A2238', grout: 'rgba(255,255,255,0.05)', tu: 2, tv: 2, light: g2 => pool(g2, B, 4, FLOOR_Y + 0.02, 4, 9, '#9FB4FF', 0.2) });
  tiled(g, [-16, FLOOR_Y, 12], [36, 0, 0], [0, 18, 0], { color: '#141C33', grout: 'rgba(255,255,255,0.04)', tu: 4, tv: 4 });
  ab(g, [-1.6, 3.2, 11.7], [9.6, 11.4, 12], '#2A3150');
  texQuad(g, LONDON_T, [-1.3, 11.1, 11.68], [9.3, 11.1, 11.68], [-1.3, 3.5, 11.68]);
  if (london < 1) { const a = 1 - clamp(london); const p0 = B.project(-1.3, 11.1, 11.66), p1 = B.project(9.3, 3.5, 11.66); g.fillStyle = `rgba(6,10,24,${0.4 * a})`; g.fillRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y)); }
  if (london > 0) pool(g, B, 4, 7.3, 11.5, 7, '#FFD27A', 0.25 * clamp(london), true);
  tiled(g, [-3.5, FLOOR_Y + 0.02, -1.5], [15, 0, 0], [0, 0, 11], { color: '#5A2E38', grout: 'rgba(255,255,255,0.06)', tu: 15, tv: 0.9 });  // a rug
  cylinder(g, [-5.2, FLOOR_Y, 6.5], [-5.2, 5.2, 6.5], 0.1, '#2A2A30'); lathe(g, -5.2, 6.5, [[4.6, 1.0, 1.0], [5.6, 0.5, 0.5], [5.8, 0.3, 0.3]], '#E9C27A', { amb: 0.9 });  // a floor lamp
  pool(g, B, -5.2, FLOOR_Y + 0.03, 6.5, 4.5, '#FFD9A0', 0.3); pool(g, B, -4.5, 3.2, 8, 5, '#FFD9A0', 0.18, true);
  lathe(g, 13.2, 5.6, [[FLOOR_Y, 0.7, 0.7], [FLOOR_Y + 1.6, 0.9, 0.9]], '#B65A3A');  // a plant in a pot
  for (let k = 0; k < 9; k++) { const a = k * 0.7, q0 = B.project(13.2, FLOOR_Y + 1.6, 5.6), q1 = B.project(13.2 + Math.cos(a) * 1.4, FLOOR_Y + 3.6 + Math.sin(k) * 0.6, 5.6 + Math.sin(a) * 1.0); if (q0.z > 0.5 && q1.z > 0.5) { g.strokeStyle = '#3E7A46'; g.lineWidth = Math.max(3, 0.28 * q1.s); g.lineCap = 'round'; g.beginPath(); g.moveTo(q0.x, q0.y); g.quadraticCurveTo((q0.x + q1.x) / 2, q1.y - 0.5 * q1.s, q1.x, q1.y); g.stroke(); } }
  screen3(g, camTex('sM', 'magnus', eM, t, { bg: ['#B9A27E', '#4A3A28'], name: 'MAGNUS', nameColor: '#FFE2B0' }), [-3.2, 7.4, 10.6], 1.75, 2.2, 0.18, { glow: '#FFD9A0' });
  screen3(g, camTex('sH', 'hikaru', eH, t + 1.3, { bg: CAMLOOK.hikaru.bg, name: 'HIKARU', nameColor: '#CFE0FF' }), [11.2, 7.4, 10.6], 1.75, 2.2, -0.18, { glow: '#9FC0FF' });
  ab(g, [-1.5, -0.45, 1.2], [9.5, 0, 7.0], '#4A3424', { spec: 0.2 }); pool(g, B, 4, 0.02, 4, 5.5, '#FFE7B8', 0.28);  // the desk, lit from above
  for (const [x, z] of [[-1, 1.7], [9, 1.7], [-1, 6.5], [9, 6.5]]) ab(g, [x - 0.2, FLOOR_Y, z - 0.2], [x + 0.2, -0.45, z + 0.2], '#241A14');
}
function balance3(g, t, { tilt = 0, nL = 0, nR = 0, tL = -9, tR = -9, glintL = -9, glintR = -9, clock = {}, six = 0, feather = false } = {}) {
  const brass = '#D9B060', press = clock.press || 0;
  shadow3(g, 4, 0.01, 4, 2.4, 1.2, 0.3);
  ab(g, [2.3, 0, 3.4], [5.7, 1.1, 4.6], '#20242C', { spec: 0.3 });  // the clock under it
  for (const [sd, x0] of [[-1, 2.6], [1, 4.3]]) { const dn = press === sd ? 0.12 : 0; ab(g, [x0, 1.1, 3.7], [x0 + 1.1, 1.38 - dn, 4.3], press === sd ? '#F5C451' : '#545A68'); }
  if (B.E[2] < 3.4) { texQuad(g, digitTex(clock.l ?? ''), [2.5, 0.95, 3.38], [3.9, 0.95, 3.38], [2.5, 0.15, 3.38]); texQuad(g, digitTex(clock.r ?? ''), [4.1, 0.95, 3.38], [5.5, 0.95, 3.38], [4.1, 0.15, 3.38]); }
  cylinder(g, [4, 1.1, 4], [4, PIVY, 4], 0.11, brass, { spec: 0.5 });
  const ends = [-1, 1].map(sd => [4 + sd * BEAM3 * Math.cos(tilt), PIVY + 0.15 + sd * BEAM3 * Math.sin(tilt), 4]);
  for (const [i, e] of ends.entries()) {
    const py = e[1] - CH3, n = i ? nR : nL, t0 = i ? tR : tL, gl = i ? glintR : glintL;
    g.save(); g.strokeStyle = '#C9A55A'; g.lineWidth = Math.max(1.5, B.project(...e).s * 0.03); g.beginPath(); for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) line3(g, e, [e[0] + dx * 1.05, py + 0.12, 4 + dz * 1.05]); g.stroke(); g.restore();
    lathe(g, e[0], 4, [[py - 0.28, 0.35, 0.35], [py - 0.1, 0.95, 0.95], [py + 0.12, 1.15, 1.15]], brass, { spec: 0.6, n: 30 });
    for (let c = 0; c < 5; c++) { if (c >= n) continue; const k = clamp((t - t0 - c * 0.08) / 0.2); if (k <= 0) continue; const cx = e[0] - 0.72 + c * 0.36, cz = 4 + (c % 2 ? 0.25 : -0.2); const q = trophy3(g, cx, py + 0.1, cz, 0.62 * ease.back(k));
      const gk = (t - gl - c * 0.1) / 0.25; if (gk > 0 && gk < 1 && q.z > 0.5) { g.save(); g.globalCompositeOperation = 'screen'; const r = 0.9 * q.s, gr = g.createRadialGradient(q.x, q.y - 0.4 * q.s, 1, q.x, q.y - 0.4 * q.s, r); gr.addColorStop(0, `rgba(255,248,210,${Math.sin(Math.PI * gk)})`); gr.addColorStop(1, 'rgba(255,248,210,0)'); g.fillStyle = gr; g.fillRect(q.x - r, q.y - 0.4 * q.s - r, 2 * r, 2 * r); g.restore(); } }
  }
  obox(g, [4, PIVY + 0.15, 4], [BEAM3 + 0.15, 0.1, 0.1], brass, { rz: tilt }, { spec: 0.6 });
  lathe(g, 4, 4, [[PIVY - 0.05, 0.28, 0.28], [PIVY + 0.3, 0.32, 0.32], [PIVY + 0.5, 0.12, 0.12]], brass, { spec: 0.6 });
  if (six > 0) { const k = clamp(six), y = lerp(13, 7.0, ease.out(k)), q = B.project(4, y, 4);
    if (q.z > 0.5) { g.save(); g.globalCompositeOperation = 'screen'; g.translate(q.x, q.y - 0.8 * q.s); g.rotate(t * 0.4); for (let r = 0; r < 12; r++) { g.rotate(Math.PI / 6); g.fillStyle = `rgba(255,230,160,${0.12 * k})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(-0.5 * q.s, -9 * q.s); g.lineTo(0.5 * q.s, -9 * q.s); g.closePath(); g.fill(); } g.restore();
      trophy3(g, 4, y, 4, 1.8); g.fillStyle = '#16161E'; g.font = sans(Math.max(18, 0.5 * q.s), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('6', q.x, q.y - 1.2 * q.s); } }
  if (feather) { const q = B.project(4.05, PIVY + 0.62, 4); if (q.z > 0.5) featherAt(g, q.x, q.y, FEATH3 * q.s, 1.35); }
}
const FEATH3 = 0.0105;  // the feather's size against the world: drawn at FEATH3 · scale (px per unit)

// ---------- the two photos as sets ----------
// photo 1: a hall, the checked wall and the clock screen, people far behind, two girls with signs behind a glass rail,
// Hikaru walking past with his badge
const CHECK_T = tex(500, 500, (x, w, h) => { for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { x.fillStyle = (i + j) % 2 ? '#5E8A44' : '#D8C25A'; x.fillRect(i * 100, j * 100, 100, 100); } });
const CLOCK_T = makeCanvas(420, 220);
const SIGN1_T = tex(660, 520, (x, w, h) => loveSign(x, w / 2, h / 2, w - 20, h - 20, 0, true)), SIGN2_T = tex(600, 440, (x, w, h) => loveSign(x, w / 2, h / 2, w - 20, h - 20, 0, false));
function signs3(g, t, { hx = 9, eH, eG } = {}) {
  g.fillStyle = '#B8B0A2'; g.fillRect(0, 0, W, H);
  if (B.E[1] > FLOOR_Y) tiled(g, [-14, FLOOR_Y, -14], [34, 0, 0], [0, 0, 30], { color: '#C2B8A6', grout: 'rgba(0,0,0,0.08)', tu: 2.4, tv: 2.4, light: g2 => pool(g2, B, 4, FLOOR_Y + 0.02, 6, 10, '#FFF4DE', 0.25) });
  tiled(g, [-14, FLOOR_Y, 16], [34, 0, 0], [0, 16, 0], { color: '#D6CEC0', grout: 'rgba(0,0,0,0.05)', tu: 6, tv: 6 });
  ab(g, [-14, 11.5, -14], [20, 12, 16], '#E9E3D6');  // the ceiling slab edge
  texQuad(g, CHECK_T, [-6, 10.5, 15.9], [0, 10.5, 15.9], [-6, 4.5, 15.9]);
  { const x = CLOCK_T.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#23272F'; x.fillRect(0, 0, 420, 220); x.fillStyle = '#F1F3F5'; x.font = sans(130, 800); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('03:5' + (Math.floor(t * 0.5) % 10), 210, 116); }
  camPanel(g, CLOCK_T, [12, 9.2, 15.6], 2.0, 1.05, 0, { frame: '#15171C' });
  for (let i = 0; i < 9; i++) { const q = B.project(1 + i * 1.6, FLOOR_Y + 3.4, 13.5 + (i % 3)); if (q.z > 0.5) { g.fillStyle = ['#8E8A84', '#7A766F', '#A39E95', '#6E6A64'][i % 4]; g.beginPath(); g.arc(q.x, q.y, 0.45 * q.s, 0, 7); g.fill(); g.fillRect(q.x - 0.6 * q.s, q.y + 0.4 * q.s, 1.2 * q.s, 2.2 * q.s); } }
  actor(g, B, 'hikaruSuit', { x: hx, y: FLOOR_Y + 6.3 - Math.abs(Math.sin(t * 6.5)) * 0.08, z: 6, k: 1.15, e: eH, t: t + 1.3, face: -1 });
  { const hp = B.project(hx, FLOOR_Y + 6.3, 6), s = hp.s / 100 * 1.05 * 1.15; g.strokeStyle = '#2E8B57'; g.lineWidth = 12 * s; g.beginPath(); g.moveTo(hp.x - 52 * s, hp.y + 175 * s); g.lineTo(hp.x - 8 * s, hp.y + 420 * s); g.lineTo(hp.x + 30 * s, hp.y + 175 * s); g.stroke(); g.fillStyle = '#F4F4F0'; g.fillRect(hp.x - 40 * s, hp.y + 418 * s, 64 * s, 84 * s); }
  actor(g, B, 'girl1', { x: 1.6, y: FLOOR_Y + 4.3, z: 3.6, k: 1.0, e: eG, t, face: -1 });
  actor(g, B, 'girl2', { x: 4.4, y: FLOOR_Y + 4.0, z: 3.9, k: 0.95, e: { ...eG, look: [-0.5, 0] }, t: t + 0.6, face: -1 });
  texQuad(g, SIGN1_T, [-0.3, FLOOR_Y + 3.7, 3.0], [3.5, FLOOR_Y + 3.6, 3.0], [-0.3, FLOOR_Y + 0.75, 3.0]);
  texQuad(g, SIGN2_T, [2.9, FLOOR_Y + 3.4, 3.2], [6.1, FLOOR_Y + 3.5, 3.2], [2.9, FLOOR_Y + 1.15, 3.2]);
  // the glass rail in front: a frosted pane, the orange band, a steel post
  { const p = [B.project(-8, FLOOR_Y + 2.2, 2.2), B.project(16, FLOOR_Y + 2.2, 2.2), B.project(16, FLOOR_Y, 2.2), B.project(-8, FLOOR_Y, 2.2)]; if (p.every(q => q.z > 0.4)) { g.fillStyle = 'rgba(225,235,240,0.6)'; g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); g.fill(); } }
  ab(g, [-8, FLOOR_Y + 2.2, 2.1], [16, FLOOR_Y + 2.45, 2.3], '#E8823A'); ab(g, [6.2, FLOOR_Y, 2.1], [6.45, FLOOR_Y + 2.45, 2.35], '#B9BEC4', { spec: 0.6 });
}
// photo 2: the stage of the blitz podium — a backdrop with the round logo, a white board in front, the two of them
const BACKDROP_T = tex(1600, 900, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1E2328'); gr.addColorStop(1, '#101316'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#3E6A4E'; x.lineWidth = 50; x.beginPath(); x.arc(260, 300, 260, 0, 7); x.stroke(); x.strokeStyle = '#B9A06A'; x.lineWidth = 12; x.beginPath(); x.arc(260, 300, 205, 0, 7); x.stroke();
  x.fillStyle = 'rgba(175,185,175,0.75)'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '600 70px Cinzel'; x.letterSpacing = '6px'; x.fillText('WORLD RAPID & BLITZ', 600, 230); x.fillText('CHAMPIONSHIP', 600, 330); x.font = '600 60px Cinzel'; x.fillText('Moscow 2019', 600, 440);
});
const BOARD_T = tex(1600, 300, (x, w, h) => { x.fillStyle = '#F2F2EE'; x.fillRect(0, 0, w, h); x.fillStyle = '#C9CCD0'; for (let i = 0; i < 7; i++) x.fillRect(60 + i * 220, 110, 150, 70); });
function podium3(g, t, { eH, eM } = {}) {
  g.fillStyle = '#0E1114'; g.fillRect(0, 0, W, H);
  if (B.E[1] > FLOOR_Y) tiled(g, [-14, FLOOR_Y, -12], [32, 0, 0], [0, 0, 22], { color: '#1A1E22', grout: 'rgba(255,255,255,0.04)', tu: 2.5, tv: 2.5 });
  texQuad(g, BACKDROP_T, [-6, 13, 10], [14, 13, 10], [-6, 1.75, 10]);
  pool(g, B, 4, 6, 9.8, 9, '#FFF2D8', 0.18, true);
  spotCone(g, B, { top: [2, 16, 2], base: [2, FLOOR_Y, 5], r0: 0.4, r1: 3.2, color: '#FFF2D8', a: 0.12, dust: 14, t, seed: 4 });
  spotCone(g, B, { top: [6.4, 16, 2], base: [6.4, FLOOR_Y, 5], r0: 0.4, r1: 3.2, color: '#FFF2D8', a: 0.14, dust: 14, t, seed: 5 });
  const hH = actor(g, B, 'hikaruSuit', { x: 2.0, y: 4.7, z: 5, k: 1.15, e: eH, t, face: -1 });
  const hM = actor(g, B, 'magnusSuit', { x: 6.4, y: 5.25, z: 5, k: 1.18, e: eM, t: t + 0.7, face: -1 });
  if (hH) { const s = hH.s / 100 * 1.05 * 1.15; medal(g, hH.x, hH.y + 210 * s, s, 'silver'); }
  if (hM) { const s = hM.s / 100 * 1.05 * 1.18; medal(g, hM.x, hM.y + 222 * s, s, 'gold'); bigCup(g, hM.x - 230 * s, hM.y + 160 * s + Math.sin(t * 1.4) * 4 * s, 1.1 * s); hand(g, hM.x - 200 * s, hM.y + 260 * s, 40 * s, skinOf('magnus').base); }
  ab(g, [-3, FLOOR_Y, 2.4], [11, -0.2, 3.0], '#E6E6E2'); texQuad(g, BOARD_T, [-2.9, -0.4, 2.38], [10.9, -0.4, 2.38], [-2.9, FLOOR_Y + 0.3, 2.38]);
}

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
  const EX = { calm: { ...EXPR.focus }, smug: { ...EXPR.smug, lid: 0.3 }, happy: { ...EXPR.happy, lid: 0.08 }, sad: { ...EXPR.sad, look: [0, 0.5] } };

  // the cuts, in order (a shot runs to the next one); v2 cuts every beat into views, about 2 s each
  const lieT = w('hook', 7);
  const qA = s('q') - 0.06, jealT = w('q', 2);
  const yesA = s('yes') - 0.06, yesT = w('yes', 2), andT = w('yes', 3), truT = w('yes', 7);
  const prA = s('prodigy') - 0.06, amT = w('prodigy', 4), youT = w('prodigy', 5), ygT = w('prodigy', 7), fishT = w('prodigy', 10) - 0.12;
  const nxA = s('next') - 0.06, nxtT = w('next', 6), magT = w('next', 10);
  const scA = s('score') - 0.06, mgT = w('score', 3), sc14T = w('score', 7), hkT = w('score', 9), onceT = w('score', 11);
  const onA = s('once') - 0.06, y16T = w('once', 2);
  const btA = s('bait') - 0.06, worldT = w('bait', 4), bt2A = s('bait2') - 0.06, ownT = w('bait2', 5);
  const tiA = s('titles') - 0.06, fiveT = w('titles', 2), hikT = w('titles', 6), neverT = w('titles', 7);
  const cA = s('c2024') - 0.06, lastT = w('c2024', 7), mustA = s('must') - 0.06, beatT = w('must', 1), gukT = w('must', 4), faceT = gukT - 0.05;
  const drA = s('draw') - 0.06, drawT = w('draw', 3);
  const chA = s('champ') - 0.06, chmpT = w('champ', 3);
  const tsA = s('toss') - 0.06, ckT = w('toss', 4), ts2A = s('toss2') - 0.06, thT = w('toss2', 1), kingT = w('toss2', 3), crowdT = w('toss2', 6);
  const nwA = s('now') - 0.06, fifthT = w('now', 4), hesT = w('now', 5), ageT = w('now', 6);
  const ldA = s('ladder') - 0.06, lifeT = w('ladder', 6), bldT = w('ladder', 7), ladT = w('ladder', 9), skyT = w('ladder', 13);
  const wgA = s('wings') - 0.06, thatT = w('wings', 4), someT = w('wings', 5), wasT = w('wings', 7), bornT = w('wings', 8), wingT = w('wings', 10);
  const twA = s('twist') - 0.06, ffT = w('twist', 7), ff2T = w('twist', 9);
  const spA = s('speed') - 0.06, fM = w('speed', 2), fH = w('speed', 5);
  const sxA = s('six') - 0.06, sixT = w('six', 7);
  const lpA = s('loop') - 0.06, nowT = w('loop', 8), boardT = w('loop', 10);
  const ctaA = s('cta') - 0.06, manyT = w('cta', 1);

  const P0 = piecesAt(GBONG, 0), P24 = piecesAt(GNG, 34);
  // the 3D cameras: every shot dollies 25–40 % or orbits 0.3–0.6 rad (rule 55); the hook opens close on his face
  const OPEN = K(0.26, 0.08, 6.6, [4.4, 2.95, 8.9]), OPEN2 = K(0.0, 0.12, 9.9, [4.7, 2.6, 8.5]);
  const POLY = [K(-0.3, 0.36, 4.6, [6.7, 0.1, 4.9]), K(-0.36, 0.3, 3.7, [6.7, 0.05, 4.9])];
  const SIDE = [K(-0.28, 0.14, 8.8, [5.0, 2.1, 7.8]), K(-0.16, 0.12, 7.4, [5.0, 2.3, 8.0])];

  // ======================= HOOK (rules 28, 57, 72): one question on a lie detector =======================
  shot(0, (g, lt, t, sh) => {  // close on his face, pulling back to the wires and the machine
    rig(B, lt, [[0, OPEN], [len(sh), OPEN2]], { t, e: glide });
    lieDetector(g, t, { pieces: P0, e: { ...EXPR.worried, sweat: 0, look: [0.5, 0.15] }, wild: 0.25 });
  }, { kb: 0, hud: (g, lt, t) => { counter(g, '1', 'QUESTION', { y: 330, size: 190, color: GOLD }); } });
  shot(lieT - 0.05, (g, lt, t, sh) => {  // "...on a lie detector": the pens go wild
    rig(B, lt, [[0, POLY[0]], [len(sh), POLY[1]]], { t, e: glide, bump: lt < 0.3 ? 0.8 : 0 });
    lieDetector(g, t, { pieces: P0, e: { ...EXPR.worried, sweat: 1, look: [0.7, 0.4] }, wild: 0.9 });
  }, { trans: 'zoom', kb: 0 });
  shot(qA, (g, lt, t, sh) => {  // Magnus asks it
    rig(B, lt, [[0, K(0.32, 0.08, 10.4, [4, 2.9, 8.7])], [len(sh), K(0.0, 0.09, 7.0, [4, 3.0, 8.8])]], { t, e: glide });
    atBoard(g, t, 'magnus', { pieces: P0, e: t >= jealT ? { ...EXPR.smug, look: [0, 0.1], lid: 0.42 } : { ...EXPR.focus, look: [0, 0.1] } });
  }, { trans: 'whip', kb: 0, zoom: kicks([[jealT, 0.08]]), hud: (g, lt, t) => {
    speech(g, 'MAGNUS CARLSEN', "ARE YOU JEALOUS OF ANYTHING I'VE ACHIEVED?", W / 2, 330, { size: 39, tail: 0.0, scale: lerp(1.2, 1, ease.back(clamp((t - qA - 0.05) / 0.22))) });
  } });
  shot(yesA, (g, lt, t, sh) => {  // "Hikaru said yes."
    rig(B, lt, [[0, K(0.08, 0.1, 7.8, [4.4, 2.9, 8.8])], [len(sh), K(-0.06, 0.08, 5.6, [4.2, 3.0, 9.0])]], { t, e: glide });
    lieDetector(g, t, { pieces: P0, e: t >= yesT - 0.1 ? { ...EXPR.neutral, nod: 0.9, curve: 0.1, look: [0, 0.2] } : { ...EXPR.worried, sweat: 0 }, wild: 0.55 });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { if (t >= yesT) badge(g, 'YES', W / 2, 300, { color: GOLD, size: 90, ...popW(t, yesT) }); } });
  shot(andT - 0.05, (g, lt, t, sh) => {  // "And it was the truth.": the machine beside him, the pens settle; TRUTH
    rig(B, lt, [[0, SIDE[0]], [len(sh), SIDE[1]]], { t, e: glide, bump: t > truT && t < truT + 0.3 ? 1 : 0 });
    lieDetector(g, t, { pieces: P0, e: t >= truT ? { ...EXPR.sad, look: [0, 0.35] } : { ...EXPR.worried, sweat: 1, look: [0.4, 0.3] }, wild: t >= truT ? 0.04 : 0.6 });
  }, { kb: 0, zoom: kicks([[truT, 0.09]]), hud: (g, lt, t) => { if (t >= truT) stamp(g, 'TRUTH', W / 2, 330, t, truT, { color: '#159A3E', size: 116, rot: -0.1 }); } });  // on the sky, not the green board
  cue(0, 'whoosh_soft', 0.25); cue(0.05, 'heartbeat', 0.35); cue(lieT - 0.1, 'whoosh_fast', 0.3); cue(lieT, 'pen', 0.5); cue(lieT + 0.1, 'beep', 0.35); cue(lieT + 0.45, 'beep', 0.3);
  cue(qA - 0.04, 'whoosh_fast', 0.3); cue(qA + 0.05, 'sparkle_pop', 0.25); cue(jealT, 'hit', 0.25); cue(yesA - 0.04, 'whoosh_soft', 0.25);
  cue(yesT, 'heartbeat', 0.45); cue(andT - 0.05, 'whoosh_soft', 0.2); cue(truT, 'stamp', 0.6); cue(truT + 0.05, 'beep', 0.3);

  // ======================= 2003: America's youngest grandmaster, younger than Fischer =======================
  const kidE = t => t >= youT ? { ...EXPR.happy, lid: 0.1 } : { ...EXPR.happy, curve: 0.5, open: 0.1 };
  const PAPER = { x: 4.2, z: 3.6, w: 3.0, h: 3.96 };
  shot(prA, (g, lt, t, sh) => {  // the paper drops onto the desk in the day room
    rig(B, lt, [[0, K(0.2, 1.0, 15.5, [4.2, 0, 3.8])], [len(sh), K(0.05, 0.92, 11.5, [4.2, 0, 3.8])]], { t, e: glide });
    const u = ease.out(clamp(lt / 0.55));
    deskScene(g, t, { paper: { ...PAPER, y: lerp(7, 0.02, u), rot: lerp(-2.4, -0.06, u) }, kid: kidE(t) });
  }, { trans: 'whip', kb: 0 });
  shot(amT - 0.05, (g, lt, t, sh) => {  // down onto his photo: he grins on "youngest"
    rig(B, lt, [[0, K(0.05, 0.92, 10.5, [4.2, 0, 3.6])], [len(sh), K(-0.1, 0.8, 5.2, [3.1, 0, 2.5])]], { t, e: glide });
    deskScene(g, t, { paper: { ...PAPER, y: 0.02, rot: -0.06 }, kid: kidE(t) });
  }, { kb: 0, zoom: kicks([[youT, 0.07]]) });
  shot(ygT - 0.05, (g, lt, t, sh) => {  // "Younger than Bobby Fischer": his 1958 cutting on the desk; 2003 slides in over its corner
    rig(B, lt, [[0, K(0.25, 0.95, 9.5, [2.4, 0, 4.4])], [len(sh), K(0.06, 0.95, 12.5, [3.8, 0, 3.6])]], { t, e: glide });
    const u = ease.out(clamp((t - fishT + 0.25) / 0.28));
    deskScene(g, t, { clip: { x: 2.1, z: 4.6, w: 2.45, h: 2.9, rot: 0.08 }, paper: u > 0 ? { x: lerp(13, 6.1, u), z: lerp(-4, 2.3, u), y: lerp(2.5, 0.06, u), rot: lerp(0.9, 0.12, u), w: 2.4, h: 3.17 } : null, kid: { ...EXPR.triumph } });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { if (t >= fishT + 0.1) stamp(g, 'RECORD BROKEN', W / 2 + 110, 250, t, fishT + 0.1, { color: RED, size: 72, rot: -0.12 }); } });
  cue(prA, 'paper', 0.5); cue(prA + 0.5, 'thud', 0.5); cue(amT - 0.05, 'whoosh_soft', 0.2); cue(youT, 'sparkle_pop', 0.3);
  cue(ygT - 0.05, 'page_flip', 0.4); cue(fishT, 'whoosh_fast', 0.3); cue(fishT + 0.05, 'thud', 0.55); cue(fishT + 0.1, 'stamp', 0.5);

  // ======================= "He was supposed to be the next world champion. Then Magnus showed up." =======================
  const kidH = t => t >= magT + 0.25 ? { ...EXPR.worried, sweat: 1, look: [1, 0] } : { ...EXPR.happy, lid: 0.1, look: [0, -0.6] };
  shot(nxA, (g, lt, t, sh) => {  // the boy, the crown he was meant to wear above him: the camera rises from him to it
    g.save(); view2(g, cam2(lt, [[0, [540, 1000, 1.45, 0]], [len(sh), [540, 640, 1.25, 0.02]]]));
    vsKids(g, t, 0, kidH(t), { ...EXPR.smug, look: [-1, 0] }, 0); g.restore();
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { if (t >= nxtT - 0.1) badge(g, 'THE NEXT CHAMPION?', W / 2, 230, { color: GOLD, size: 54, ...popW(t, nxtT - 0.1) }); } });
  shot(magT - 0.05, (g, lt, t, sh) => {  // the screen splits, Magnus at 13 slides in, the crown flies over to him
    g.save(); view2(g, cam2(lt, [[0, [540, 900, 1.2, -0.03]], [len(sh), [540, 960, 1.0, 0]]]));
    vsKids(g, t, clamp((t - magT + 0.05) / 0.4), kidH(t), { ...EXPR.smug, look: [-1, 0] }, clamp((t - magT - 0.15) / 0.45)); g.restore();
  }, { kb: 0, zoom: kicks([[magT, 0.1]]), qaAllow: ['face cut by frame'] });
  shot(magT + 0.7, (g, lt, t, sh) => {  // the photo the author sent, as a set (rules 67, 68): the girls' signs for Magnus; Hikaru walks past
    rig(B, lt, [[0, K(0.2, 0.05, 15, [4.6, -0.2, 4.4])], [len(sh), K(0.06, 0.04, 12.5, [4.8, 0.3, 4.6])]], { t, e: glide });
    signs3(g, t, { hx: lerp(8.8, 7.2, clamp(lt / len(sh))), eH: { ...EXPR.sad, look: [-0.7, 0.5], lid: 0.35 }, eG: { ...EXPR.happy, lid: 0.05, look: [-0.6, -0.1] } });
  }, { trans: 'whip', kb: 0, qaAllow: ['face cut by frame'] });
  cue(magT + 0.66, 'whoosh_fast', 0.25); cue(magT + 0.75, 'murmur', 0.3);
  cue(nxA - 0.04, 'whoosh_fast', 0.3); cue(nxtT, 'shimmer', 0.3); cue(magT, 'boom_big', 0.5); cue(magT + 0.4, 'whoosh_soft', 0.3);

  // ======================= 14 : 1 =======================
  const m14 = t => Math.min(14, Math.floor(14.99 * clamp((t - mgT) / (sc14T + 0.1 - mgT))));
  const hikS = t => t >= sc14T ? { ...EXPR.worried, sweat: 1, look: [-0.8, 0.1] } : { ...EXPR.worried, sweat: 0, look: [-0.8, 0.1] };
  shot(scA, (g, lt, t, sh) => {  // over Hikaru's shoulder: Magnus, the score lighting up behind him
    rig(B, lt, [[0, K(0.42, 0.14, 14.5, [4, 3.6, 6.5])], [len(sh), K(0.1, 0.1, 11.5, [4, 4.0, 8])]], { t, e: glide });
    scoreTable(g, t, { m: m14(t), h: null, eM: t >= sc14T ? EX.smug : EX.calm, eH: hikS(t), wall: 'far' });
  }, { trans: 'whip', kb: 0, zoom: kicks([[sc14T, 0.08]]) });
  shot(hkT - 0.05, (g, lt, t, sh) => {  // the reverse, over Magnus's shoulder: Hikaru, and the "1" behind him
    rig(B, lt, [[0, K(Math.PI - 0.38, 0.12, 12.5, [4, 3.4, 0.8])], [len(sh), K(Math.PI - 0.12, 0.1, 10.5, [4, 3.7, -0.5])]], { t, e: glide });
    scoreTable(g, t, { m: 14, h: t >= onceT ? 1 : null, eM: EX.smug, eH: t >= onceT ? { ...EXPR.sad, look: [0, 0.3], curve: 0.1 } : { ...EXPR.worried, sweat: 1 }, wall: 'near' });
  }, { trans: 'whip', whipDir: -1, kb: 0, zoom: kicks([[onceT, 0.07]]) });
  shot(onA, (g, lt, t, sh) => {  // "Once. In 2016." — the one win, an old photograph; the camera rushes in
    rig(B, lt, [[0, K(0.32, 0.12, 9.6, [4.5, 2.85, 8.7])], [len(sh), K(-0.1, 0.08, 6.2, [4.3, 3.0, 8.9])]], { t, e: glide });
    atBoard(g, t, 'hikaru', { pieces: piecesAt(GNG, 40), e: { ...EXPR.triumph } });
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(150,110,62,0.8)'; g.fillRect(0, 0, W, H); g.restore();
  }, { trans: 'flash', kb: 0, vig: 0.7, hud: (g, lt, t) => {
    badge(g, 'BILBAO · 13 JULY 2016', W / 2, 260, { color: '#E9D9B0', size: 44, ...popW(t, onA + 0.05) });
    if (t >= y16T) stamp(g, 'THE ONLY ONE', W / 2, 1560, t, y16T, { color: GOLD, size: 84, rot: -0.1 });
  } });
  cue(scA - 0.04, 'whoosh_fast', 0.3); for (let k = 0; k < 14; k++) cue(mgT + k * (sc14T + 0.1 - mgT) / 14, 'clack', 0.2); cue(sc14T + 0.05, 'hit', 0.35);
  cue(hkT - 0.09, 'whoosh_fast', 0.25); cue(onceT, 'sparkle_pop', 0.35); cue(onA, 'camera', 0.5); cue(y16T, 'stamp', 0.45);

  // ======================= EDIT-BAIT: "Hikaru could beat the whole world. Just not the man who owns it." =======================
  shot(btA, (g, lt, t, sh) => {
    const u = glide(clamp(lt / len(sh)));
    globeScene(g, t, lerp(1440, 1560, u), lerp(1.0, 1.14, u), { eH: { ...EXPR.triumph, look: [0, -0.1] }, eM: EX.smug, fly: worldT - 0.35 });
  }, { trans: 'whip', kb: 0, zoom: kicks([[worldT, 0.08]]), hud: (g, lt, t) => { if (t >= worldT) badge(g, 'THE WHOLE WORLD', W / 2, 230, { color: GOLD, size: 56, ...popW(t, worldT) }); } });
  shot(bt2A, (g, lt, t, sh) => {  // "Just not the man...": up the globe to the man sitting on it
    const u = ease.inOut(clamp(lt / 0.7));
    globeScene(g, t, lerp(1500, 68, u), lerp(1, 0.665, u), { eH: { ...EXPR.sad, look: [0, -1] }, eM: { ...EXPR.smug, look: [0, 0.6] } });
  }, { kb: 0, qaAllow: ['face cut by frame'] });
  shot(ownT - 0.1, (g, lt, t, sh) => {  // "...who owns it.": the podium of the World Blitz 2019 (the author's photo) as a stage
    rig(B, lt, [[0, K(0.25, 0.05, 15, [4.2, 5.0, 5])], [len(sh), K(-0.08, 0.04, 10.5, [2.8, 5.0, 5])]], { t, e: glide });
    podium3(g, t, { eH: { ...EXPR.neutral, lid: 1, curve: -0.15, look: [0, 0.3] }, eM: { ...EXPR.happy, lid: 0.1, look: [-0.2, 0] } });
  }, { trans: 'whip', kb: 0, zoom: kicks([[ownT, 0.06]]), hud: (g, lt, t) => { badge(g, 'EXCEPT ONE', W / 2, 200, { color: RED, size: 56, ...popW(t, ownT) }); } });
  cue(btA - 0.04, 'whoosh_deep', 0.3); cue(worldT - 0.3, 'scatter', 0.45); cue(worldT, 'boom_move', 0.4);
  cue(bt2A, 'whoosh_soft', 0.35); cue(ownT - 0.14, 'whoosh_fast', 0.3); cue(ownT, 'boom_big', 0.55); cue(ownT + 0.1, 'camera', 0.35);

  // ======================= five title matches; none =======================
  shot(tiA, (g, lt, t, sh) => {  // along Magnus's shelf as the cups come up, one under each light
    rig(B, lt, [[0, K(-0.3, 0.06, 10.5, [-2.2, CUPY + 1.0, 8])], [len(sh), K(0.25, 0.05, 9.5, [8.4, CUPY + 0.6, 8])]], { t, e: glide });
    trophyRoom(g, t, { t5: fiveT, eM: t >= fiveT ? EX.smug : EX.calm, eH: EX.calm });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { badge(g, 'WORLD CHAMPIONSHIP MATCHES', W / 2, 230, { color: GOLD, size: 44 }); } });
  shot(hikT - 0.05, (g, lt, t, sh) => {  // down to his shelf: nothing on it, dust, a cobweb
    rig(B, lt, [[0, K(-0.25, 0.08, 10, [-2.2, LOWY + 1.2, 8])], [len(sh), K(0.18, 0.05, 9.5, [7.6, LOWY + 0.8, 8])]], { t, e: glide });
    trophyRoom(g, t, { t5: -9, empty: neverT, eM: EX.smug, eH: t >= neverT ? { ...EXPR.sad, look: [0.8, 0.3] } : EX.calm });
  }, { kb: 0, hud: (g, lt, t) => { if (t >= neverT + 0.2) stamp(g, '0', 760, 1060, t, neverT + 0.2, { color: '#F2EEE6', size: 150, rot: -0.1 }); } });
  cue(tiA - 0.04, 'whoosh_fast', 0.3); for (let k = 0; k < 5; k++) cue(fiveT + k * 0.16, 'sparkle_pop', 0.22); cue(hikT - 0.09, 'whoosh_soft', 0.25); cue(neverT + 0.2, 'dun_dun', 0.35);

  // ======================= 2024: the last round against Gukesh, the draw, his crown; 2025: the stadium (v3) =======================
  const cand = (g, t, eH) => { dayRoom(g, t, {}); tableSet(g, t, { pieces: P24, white: 'hikaru', bPlayer: false, bChair: false, ew: eH, tableCol: WOODT }); lowKey(g, { cy: H * 0.46, a: 0.04 }); };
  shot(cA, (g, lt, t, sh) => {  // "In 2024, it came down to the last round.": flying into the hall
    rig(B, lt, [[0, K(Math.PI + 0.55, 0.3, 17.5, [4, 1.8, 1.5])], [len(sh), K(Math.PI + 0.05, 0.14, 10.2, [4, 2.6, -0.6])]], { t, e: glide });
    cand(g, t, EX.calm);
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { badge(g, 'CANDIDATES 2024 · TORONTO', W / 2, 200, { color: '#16161E', size: 40, ...popW(t, cA + 0.05) }); } });
  shot(lastT - 0.05, (g, lt, t, sh) => {  // "...the last round.": over the board, turning; the clock beside it
    rig(B, lt, [[0, K(Math.PI - 0.34, 0.62, 7.6, [4, 0.6, 3.6])], [len(sh), K(Math.PI + 0.2, 0.5, 6.0, [4, 0.8, 3.0])]], { t, e: glide });
    cand(g, t, { ...EXPR.focus, sweat: 1 });
  }, { trans: 'whip', kb: 0, zoom: kicks([[lastT, 0.07]]), hud: (g, lt, t) => { counter(g, 'ROUND 14', 'THE LAST ONE', { y: 1590, size: 120, color: GOLD, at: [lastT, 0.25] }); } });
  shot(mustA, (g, lt, t, sh) => {  // "Hikaru had to beat Gukesh.": close on him, Gukesh's card, MUST WIN
    rig(B, lt, [[0, K(Math.PI + 0.2, 0.1, 7.8, [4, 2.95, -0.9])], [len(sh), K(Math.PI - 0.06, 0.08, 5.6, [4, 3.0, -1.1])]], { t, e: glide });
    cand(g, t, { ...EXPR.focus, sweat: t >= beatT ? 1 : 0 });
  }, { trans: 'whip', kb: 0, zoom: kicks([[beatT, 0.08]]), hud: (g, lt, t) => {
    if (t >= beatT) stamp(g, 'MUST WIN', W / 2, 330, t, beatT, { color: RED, size: 100, rot: -0.08 });
  } });
  const cand2 = (g, t, eH, eG) => { dayRoom(g, t, {}); tableSet(g, t, { pieces: P24, white: 'hikaru', black: 'gukesh18', ew: eH, eb: eG, tableCol: WOODT,
    clock: { names: ['NAKAMURA', 'GUKESH'], cols: ['#CFE0FF', '#FFE2B0'], l: Math.max(1, 41 - Math.floor((t - faceT) * 2)), r: 72, run: 1 } }); lowKey(g, { cy: H * 0.46, a: 0.04 }); };
  const eFH = { ...EXPR.focus, sweat: 1, look: [0.2, 0.3] }, eFG = { ...EXPR.focus, lid: 0.35, look: [-0.2, 0.3] }, fMid = faceT + (drA - 0.06 - faceT) / 2;
  shot(faceT, (g, lt, t, sh) => {  // the silence before it: over Gukesh's shoulder, Hikaru sweating; the clock running
    rig(B, lt, [[0, K(Math.PI - 0.42, 0.1, 12.5, [4, 3.0, 0.2])], [len(sh), K(Math.PI - 0.3, 0.08, 11.2, [4, 3.1, -0.4])]], { t, e: glide });
    cand2(g, t, eFH, eFG);
  }, { trans: 'whip', kb: 0, zoom: kicks([[faceT + 0.12, 0.035, 0.3], [faceT + 0.5, 0.035, 0.3]]) });
  shot(fMid, (g, lt, t, sh) => {  // the reverse: over Hikaru's shoulder, Gukesh calm
    rig(B, lt, [[0, K(0.42, 0.1, 12.5, [4, 3.0, 8.0])], [len(sh), K(0.3, 0.08, 11.2, [4, 3.1, 8.6])]], { t, e: glide });
    cand2(g, t, eFH, eFG);
  }, { kb: 0, zoom: kicks([[fMid + 0.1, 0.035, 0.3]]) });
  shot(drA, (g, lt, t, sh) => {  // "It was a...": from above the board, two hands meet over it
    rig(B, lt, [[0, K(0.0, 1.25, 10.5, [4, 0, 4])], [len(sh), K(0.12, 1.2, 9.6, [4, 0, 4])]], { t, e: glide });
    cand2(g, t, eFH, eFG); handshake(g, t, drA + 0.22, { flat: false });
  }, { trans: 'whip', kb: 0, qaAllow: ['face cut by frame'], hud: (g, lt, t) => { if (t >= drawT) stamp(g, 'DRAW', W / 2, 330, t, drawT, { color: '#3A3F48', size: 116, rot: -0.08 }); } });
  shot(drawT + 0.12, (g, lt, t, sh) => {  // "...draw.": his face; the colour drains, the camera falls back
    rig(B, lt, [[0, K(Math.PI, 0.08, 5.4, [4, 3.05, -1.2])], [len(sh), K(Math.PI - 0.1, 0.14, 8.8, [4, 2.75, -0.7])]], { t, e: glide });
    cand(g, t, { ...EXPR.sad, look: [0, 0.6], lid: 0.45 }); grey(g, clamp((t - drawT) / 0.4) * 0.8);
  }, { kb: 0, zoom: kicks([[drawT, 0.06]]), hud: (g, lt, t) => { if (t >= drawT) stamp(g, 'DRAW', W / 2, 330, t, drawT, { color: '#3A3F48', size: 116, rot: -0.08 }); } });
  shot(chA, (g, lt, t, sh) => {  // Gukesh, world champion that year: the crown comes down, confetti
    rig(B, lt, [[0, K(0.0, -0.06, 9.4, [4, 4.5, 8.8])], [len(sh), K(0.16, 0.1, 6.4, [4, 3.0, 8.9])]], { t, e: glide });
    atBoard(g, t, 'gukesh18', { pieces: P24, e: t >= chmpT ? { ...EXPR.triumph } : { ...EXPR.happy, lid: 0.1, look: [0, -0.6] } });
    const h = headAt(), cu = ease.out(clamp((t - chA - 0.1) / 0.6)); crown(g, h.x, lerp(h.y - 900, h.y - 205 * h.s, cu), h.s * 0.95, {});
    confetti(g, t, chA + 0.2, { n: 110, seed: 12 });
  }, { trans: 'whip', kb: 0, zoom: kicks([[chmpT, 0.07]]), hud: (g, lt, t) => {
    nameTitle(g, t - chA, 'GUKESH', 'WORLD CHAMPION · 2024', { y: 230 });
    if (t >= chmpT + 0.35) badge(g, 'NOV 24: DEFENDS IT IN GENEVA', W / 2, 1560, { color: '#16161E', size: 34, ...popW(t, chmpT + 0.35) });
  } });
  const stad3 = (g, t) => { const won = t >= ckT + 0.25;
    arena3(g, t, { lit: won ? 1 : 0, cheer: clamp((t - ckT - 0.2) / 0.3), flash: ckT + 0.2, eH: won ? { ...EXPR.triumph } : { ...EXPR.focus, look: [0.3, 0.5] }, eG: won ? { ...EXPR.shock, sweat: 0 } : { ...EXPR.focus, look: [-0.3, 0.5] } }); };
  shot(tsA, (g, lt, t, sh) => {  // "The next year, Hikaru...": Arlington, over the crowd toward the stage
    rig(B, lt, [[0, K(0.0, 0.22, 31, [4, 2.4, 4])], [len(sh), K(0.07, 0.12, 21, [4, 3.0, 6])]], { t, e: glide });
    stad3(g, t);
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { badge(g, 'ARLINGTON, TEXAS · OCT 2025', W / 2, 200, { color: '#16161E', size: 38, ...popW(t, tsA + 0.05) }); } });
  shot(w('toss', 3) - 0.05, (g, lt, t, sh) => {  // "...Hikaru checkmated the world champion": CHECKMATE on the wall, the screens, the hall up
    rig(B, lt, [[0, K(0.3, 0.08, 13, [4, 3.6, 8])], [len(sh), K(0.1, 0.07, 10.8, [4, 3.6, 8.6])]], { t, e: glide });
    stad3(g, t);
  }, { trans: 'whip', kb: 0, zoom: kicks([[ckT + 0.2, 0.09]]), qaAllow: ['face cut by frame'] });
  shot(w('toss', 8) - 0.05, (g, lt, t, sh) => {  // "...in a stadium.": out over the whole hall going wild
    rig(B, lt, [[0, K(-0.35, 0.22, 24, [4, 3, 5])], [len(sh), K(0.15, 0.27, 30, [4, 4, 5])]], { t, e: glide });
    stad3(g, t);
  }, { trans: 'whip', kb: 0, qaAllow: ['face cut by frame'] });
  shot(ts2A, (g, lt, t, sh) => {  // "And threw his king into the crowd."
    rig(B, lt, [[0, K(0.14, 0.06, 7.0, [4, 4.0, 8.8])], [len(sh), K(0.06, 0.1, 9.0, [4, 3.8, 8.6])]], { t, e: glide });  // in front of Gukesh: his back never covers Hikaru
    stad3(g, t); throw3(g, t, thT);
  }, { trans: 'whip', kb: 0, zoom: kicks([[kingT, 0.06]]), qaAllow: ['face cut by frame'] });
  shot(crowdT + 0.15, (g, lt, t, sh) => {  // the world champion's face, the cheering hall behind him
    rig(B, lt, [[0, K(Math.PI + 0.2, 0.05, 8.2, [4, 3.0, -1.2])], [len(sh), K(Math.PI + 0.1, 0.05, 7.2, [4, 3.1, -1.3])]], { t, e: glide });
    stad3(g, t);
  }, { kb: 0 });
  cue(cA - 0.04, 'whoosh_fast', 0.3); cue(lastT, 'hit', 0.35); cue(mustA - 0.04, 'whoosh_fast', 0.25); cue(beatT, 'stamp', 0.45);
  cue(faceT - 0.04, 'whoosh_fast', 0.25); for (let k = 0; k < 3; k++) cue(faceT + 0.12 + k * 0.38, 'heartbeat', 0.4); cue(faceT + 0.1, 'clock_tick', 0.3);
  cue(drA - 0.04, 'whoosh_soft', 0.25); cue(drA + 0.22, 'fabric', 0.45); cue(drawT, 'stamp', 0.5);
  cue(chA + 0.1, 'shimmer', 0.35); cue(chmpT, 'confetti', 0.35); cue(chmpT + 0.05, 'applause', 0.3);
  cue(tsA - 0.04, 'whoosh_deep', 0.3); cue(tsA + 0.1, 'murmur', 0.35); cue(w('toss', 3) - 0.09, 'whoosh_fast', 0.25); cue(w('toss', 8) - 0.09, 'whoosh_soft', 0.25); cue(ckT + 0.2, 'boom_big', 0.55); cue(ckT + 0.25, 'applause', 0.55);
  cue(ts2A - 0.04, 'whoosh_fast', 0.3); cue(thT + 0.3, 'whoosh_fast', 0.45); cue(kingT + 0.1, 'applause', 0.5); cue(crowdT + 0.15, 'record_scratch', 0.25);

  // ======================= the sad part: fifth this year, 38 =======================
  shot(nwA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.24, 0.1, 9.0, [4.5, 2.85, 8.7])], [len(sh), K(0.02, 0.09, 6.4, [4.2, 3.0, 9.0])]], { t, e: glide });
    atBoard(g, t, 'hikaru', { pieces: P24, e: { ...EXPR.sad, look: [0, 0.6], lid: 0.5 } });
    grey(g, 0.85); rain(g, t, 0.8);
  }, { trans: 'whip', kb: 0, vig: 0.75, hud: (g, lt, t) => { if (t >= fifthT - 0.1) counter(g, '5TH', 'CANDIDATES 2026', { y: 330, size: 170, color: '#C9CED6', at: [fifthT - 0.1, 0.25] }); } });
  shot(hesT - 0.05, (g, lt, t, sh) => {  // "He's 38": very close, he lifts his eyes for a moment and lowers them
    rig(B, lt, [[0, K(-0.12, 0.06, 4.9, [4.1, 3.05, 9.2])], [len(sh), K(-0.03, 0.05, 4.1, [4.1, 3.05, 9.25])]], { t, e: lin });
    atBoard(g, t, 'hikaru', { pieces: P24, e: { ...EXPR.sad, look: [0, lt < 0.7 ? -0.2 : 0.6], lid: 0.5 } });
    grey(g, 0.9); rain(g, t, 0.9);
  }, { kb: 0, vig: 0.8, hud: (g, lt, t) => { if (t >= ageT) counter(g, '38', 'YEARS OLD', { y: 330, size: 190, color: '#C9CED6', at: [ageT, 0.25] }); } });
  cue(nwA, 'wind_barren', 0.25); cue(fifthT, 'hit', 0.25); cue(ageT, 'clock_tick', 0.4);

  // ======================= THE QUOTE: the ladder and the wings =======================
  const hope = { ...EXPR.happy, lid: 0.05, look: [0, -1], curve: 0.35 };
  shot(ldA, (g, lt, t, sh) => {  // "A man will spend his whole life": the boy at the foot of it, the whole sky above
    const p = 3 + 2 * clamp((t - ldA - 0.15) / 1.5), hy = rungY(3) + 126;
    ladderWorld(g, t, cam2(lt, [[0, [540, hy + 60, 1.18]], [len(sh), [540, 3920, 0.42]]]), { p, who: 'hikaru15', eH: { ...EXPR.focus, look: [0, -1], brow: 0.3 } });
  }, { trans: 'fade', transDur: 0.4, kb: 0 });
  shot(bldT - 0.05, (g, lt, t, sh) => {  // "building a ladder to reach the sky": years later, near the top, through the clouds into the gold
    const p = Math.min(13, 11 + 2 * clamp((t - bldT) / 1.25)), hy = rungY(13) + 126;
    ladderWorld(g, t, cam2(lt, [[0, [540, 3250, 0.62]], [len(sh) * 0.62, [540, hy - 120, 1.1]], [len(sh), [540, hy - 70, 1.55]]]), { p, who: 'hikaru', eH: t >= skyT ? hope : { ...EXPR.focus, look: [0, -1], sweat: 1 }, glow: clamp((t - skyT + 0.2) / 0.4) });
  }, { kb: 0 });
  // the wings (v3, the author: «в моменте где крылья сделай получше эту сцену, прям поработай над ней хорошенько»)
  const HY = rungY(13) + 126;
  const fT0 = wingT + 0.3, fLand = twA + 0.75;
  const heroF = (g, t, land = { x: 556, y: 870, s: 1.76 }) => {  // one feather, drawn on the screen across the cut: it falls past his face, then onto the scales
    if (t < fT0 || t >= fLand) return;
    const ph = (t - fT0) * 2.3, damp = t < twA ? 1 : 1 - ease.inOut(clamp((t - twA) / (fLand - twA)));
    const y = t < twA ? lerp(-90, 620, (t - fT0) / (twA - fT0)) : lerp(620, land.y, ease.out(clamp((t - twA) / (fLand - twA))));
    featherAt(g, lerp(land.x, 540 + Math.sin(ph) * 80, damp), y, lerp(land.s, 2.3, damp), lerp(1.35, Math.sin(ph + 0.6) * 0.7, damp));
  };
  shot(wgA, (g, lt, t, sh) => {  // "Just to find out": at the top, in the gold, hoping
    ladderWorld(g, t, cam2(lt, [[0, [560, HY - 60, 1.3]], [len(sh), [548, HY - 30, 1.48]]]), { p: 13, who: 'hikaru', eH: hope, glow: 1, rays: 0.5 });
  }, { kb: 0 });
  shot(thatT - 0.05, (g, lt, t, sh) => {  // "...that someone else": at the foot of the ladder Magnus opens his wings and shoots up past the years
    const op = clamp((t - someT + 0.05) / 0.14), u = clamp((t - someT - 0.1) / 0.55), my = lerp(LG - 560, HY + 700, ease.in(u));
    ladderWorld(g, t, [600, Math.min(LG - 600, my + 40), 1.0], { p: 13, who: 'hikaru', eH: hope,
      mag: { x: 760, y: my, s: 0.72, e: u > 0 ? { ...EXPR.smug, look: [0, -0.8] } : { ...EXPR.smug, look: [-0.4, 0.1] }, spread: op, trail: u > 0 ? 0 : 1, streak: u > 0 ? 1 : 0 } });
    if (u > 0) speedLines(g, W / 2, H / 2, t, someT + 0.1, { life: 0.55, seed: 13, n: 40 });
  }, { trans: 'whip', kb: 0, zoom: kicks([[someT, 0.06]]) });
  shot(wasT - 0.05, (g, lt, t, sh) => {  // "...was born with": he bursts up past Hikaru and hangs over him in the sun; his shadow falls on him
    const u = clamp(lt / 0.55), my = lerp(HY + 900, HY - 950, ease.out(u)) + Math.sin(t * 2.4) * 14 * u, gust = clamp(1 - Math.abs(lt - 0.18) / 0.25);
    ladderWorld(g, t, cam2(lt, [[0, [600, HY - 180, 0.95]], [len(sh), [590, HY - 230, 0.9]]]), { p: 13, who: 'hikaru', eH: { ...EXPR.shock, look: [0.5, -1], shake: gust * 0.8 }, glow: 0.3, rays: u,
      mag: { x: lerp(830, 740, ease.out(u)), y: my, s: 0.78, e: { ...EXPR.smug, look: [-0.5, 0.6] }, trail: 0, streak: 1 - u }, shade: u, feath: wasT + 0.2, featherAt: [760, HY - 500] });
  }, { kb: 0, zoom: kicks([[wasT + 0.1, 0.07]]), qaAllow: ['captions over face', 'face cut by frame'] });
  shot(wingT + 0.15, (g, lt, t, sh) => {  // "...wings.": close, in his shadow; one feather comes down in front of his face, the camera goes down with it
    const d = sh.b - sh.a;
    ladderWorld(g, t, [550, lerp(HY - 30, HY + 190, ease.in(clamp((lt - 0.25) / Math.max(0.3, d - 0.25)))), lerp(2.1, 1.85, clamp(lt / d))], { p: 13, who: 'hikaru', eH: { ...EXPR.sad, look: [0.1, lt < 0.4 ? -1 : 0.6], lid: 0.35 }, shade: 1, glow: 0.2,
      mag: { x: 740, y: HY - 950, s: 0.78, e: EX.smug, trail: 0 } });
  }, { kb: 0, hud: (g, lt, t) => heroF(g, t), qaAllow: ['face cut by frame'] });
  cue(ldA - 0.1, 'whoosh_soft', 0.3); cue(ldA + 0.4, 'knock', 0.35); cue(ldA + 1.15, 'knock', 0.3); cue(lifeT, 'creak', 0.25);
  cue(bldT - 0.08, 'whoosh_deep', 0.3); cue(bldT + 0.1, 'knock', 0.3); cue(bldT + 0.72, 'knock', 0.3); cue(skyT, 'shimmer', 0.4);
  cue(thatT - 0.08, 'whoosh_fast', 0.25); cue(someT - 0.05, 'fabric', 0.5); cue(someT + 0.1, 'whoosh_deep', 0.6); cue(someT + 0.12, 'boom_move', 0.35);
  cue(wasT - 0.05, 'whoosh_fast', 0.5); cue(wasT + 0.1, 'boom_big', 0.35); cue(wingT, 'reveal_bell', 0.25); cue(wingT + 0.3, 'shimmer', 0.2);

  // ======================= the turn: the feather lands on the scales; five to five; the sixth (v3: the balance) =======================
  const PCAM = K(0.0, 0.06, 6.4, [4, PIVY + 0.3, 4]), WIDE = K(0.22, 0.14, 16, [4, 4.0, 4]);
  const landAt = () => { const q = B.project(4.05, PIVY + 0.62, 4); return { x: q.x, y: q.y, s: FEATH3 * q.s }; };
  shot(twA, (g, lt, t, sh) => {  // the feather goes on falling — onto the balance standing on the blitz clock
    const landed = t >= fLand, wob = landed ? 0.045 * Math.sin((t - fLand) * 14) * Math.exp(-(t - fLand) * 3) : 0;
    rig(B, lt, [[0, PCAM], [fLand - twA, PCAM], [Math.max(fLand - twA + 0.3, len(sh)), WIDE]], { t, e: glide });
    studio(g, t, { eM: EX.calm, eH: landed ? { ...EXPR.focus, look: [-0.5, 0.5], curve: 0.1 } : { ...EXPR.sad, look: [0, 0.6] } });
    balance3(g, t, { tilt: wob, clock: {}, feather: landed });
  }, { trans: 'fade', transDur: 0.3, kb: 0, hud: (g, lt, t) => { if (t < fLand) heroF(g, t, landAt()); }, qaAllow: ['face cut by frame'] });
  const tiltFF = t => t < ffT ? 0 : t < ff2T ? -0.13 * ease.out(clamp((t - ffT) / 0.25)) : -0.13 * (1 - ease.back(clamp((t - ff2T) / 0.35)));
  shot(ffT - 0.1, (g, lt, t, sh) => {  // "...five to five": five cups drop on his pan, five on Hikaru's — level
    rig(B, lt, [[0, WIDE], [len(sh), K(0.1, 0.12, 14.5, [4, 4.2, 4])]], { t, e: glide });
    studio(g, t, { eM: { ...EXPR.smug, look: [0.6, 0.6] }, eH: t >= ff2T ? { ...EXPR.smug, look: [-0.6, 0.6] } : { ...EXPR.worried, look: [-0.6, 0.6] } });
    balance3(g, t, { tilt: tiltFF(t), nL: 5, nR: 5, tL: ffT, tR: ff2T, clock: { l: '5', r: t >= ff2T ? '5' : '–' }, feather: true });
  }, { kb: 0, zoom: kicks([[ffT, 0.07], [ff2T, 0.08]]) });
  shot(spA, (g, lt, t, sh) => {  // "Speed chess.": the clock under it slapped back and forth, the beam rocking
    rig(B, lt, [[0, K(-0.42, 0.32, 7.6, [4, 1.5, 4])], [len(sh), K(0.35, 0.26, 6.9, [4, 1.7, 4])]], { t, e: glide });
    const pr = Math.floor((t - spA) / 0.11) % 2 ? 1 : -1;
    studio(g, t, { eM: { ...EXPR.focus, look: [0.6, 0.6] }, eH: { ...EXPR.focus, look: [-0.6, 0.6] } });
    balance3(g, t, { tilt: 0.1 * Math.sin((t - spA) * 28.5), nL: 5, nR: 5, clock: { l: '5', r: '5', press: pr }, feather: true });
    speedLines(g, W / 2, H * 0.55, t, spA, { life: 0.7, seed: 4 });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => { badge(g, 'SPEED CHESS CHAMPIONSHIP', W / 2, 230, { color: '#7CFC9A', size: 44, ...popW(t, spA + 0.05) }); } });
  shot(fM - 0.08, (g, lt, t, sh) => {  // "Five for Magnus.": his pan, his face on the screen behind it, the cups catching the light
    rig(B, lt, [[0, K(-0.6, 0.12, 10, [0.4, 4.6, 5])], [len(sh), K(-0.45, 0.1, 9, [0.3, 5.0, 5.5])]], { t, e: glide });
    studio(g, t, { eM: { ...EXPR.smug, look: [0.2, 0.6] }, eH: EX.calm });
    balance3(g, t, { nL: 5, nR: 5, glintL: fM, clock: { l: '5', r: '5' }, feather: true });
  }, { trans: 'whip', whipDir: 1, kb: 0 });
  shot(fH - 0.08, (g, lt, t, sh) => {  // "Five for Hikaru."
    rig(B, lt, [[0, K(0.6, 0.12, 10, [7.6, 4.6, 5])], [len(sh), K(0.45, 0.1, 9, [7.7, 5.0, 5.5])]], { t, e: glide });
    studio(g, t, { eM: EX.smug, eH: { ...EXPR.smug, look: [-0.2, 0.6], curve: 0.7 } });
    balance3(g, t, { nL: 5, nR: 5, glintR: fH, clock: { l: '5', r: '5' }, feather: true });
  }, { trans: 'whip', whipDir: -1, kb: 0 });
  shot(sxA, (g, lt, t, sh) => {  // "This month, they started playing for number six.": the sixth cup comes down over the beam; London
    rig(B, lt, [[0, K(0.0, 0.2, 18.5, [4, 6.5, 4])], [len(sh), K(0.0, 0.1, 16, [4, 7.0, 4])]], { t, e: glide });
    studio(g, t, { eM: { ...EXPR.focus, look: [0.8, -0.6] }, eH: { ...EXPR.focus, look: [-0.8, -0.6] }, london: (t - sixT) / 0.4 });
    balance3(g, t, { tilt: 0.014 * Math.sin(t * 30) * clamp((t - sxA - 0.3) / 0.3), nL: 5, nR: 5, six: (t - sxA - 0.1) / 0.8, clock: { l: '5', r: '5' }, feather: true });
  }, { trans: 'whip', kb: 0, zoom: kicks([[sixT, 0.07]]), hud: (g, lt, t) => {
    if (t >= sixT) badge(g, 'NUMBER SIX', W / 2, 1480, { color: GOLD, size: 56, ...popW(t, sixT) });
    if (t >= sixT + 0.45) badge(g, 'FINALS · LONDON · FEB 2027', W / 2, 1580, { color: '#16161E', size: 34, ...popW(t, sixT + 0.45) });
  } });
  cue(twA + 0.05, 'whoosh_soft', 0.2); cue(fLand, 'sparkle_pop', 0.3); cue(fLand + 0.02, 'creak', 0.3);
  cue(ffT, 'coins', 0.35); cue(ffT, 'hit_punch', 0.4); cue(ff2T, 'coins', 0.35); cue(ff2T, 'hit_punch', 0.45);
  cue(spA - 0.04, 'whoosh_fast', 0.3); for (let k = 0; k < 9; k++) cue(spA + k * 0.11, 'clock_press', 0.22);
  cue(fM - 0.1, 'whoosh_fast', 0.25); cue(fH - 0.1, 'whoosh_fast', 0.25);
  for (let k = 0; k < 5; k++) { cue(fM + k * 0.1, 'sparkle_pop', 0.18); cue(fH + k * 0.1, 'sparkle_pop', 0.18); }
  cue(sxA + 0.1, 'riser', 0.3); cue(sxA + 0.6, 'reveal_bell', 0.4); cue(sixT, 'shimmer', 0.3); cue(sixT + 0.45, 'success', 0.25);

  // ======================= the loop: the lie detector again; the board answers (1.e4) =======================
  shot(lpA, (g, lt, t, sh) => {  // round him, the wires, the machine
    rig(B, lt, [[0, K(-0.42, 0.12, 9.4, [4.6, 2.6, 8.4])], [len(sh), K(0.16, 0.1, 7.2, [4.5, 2.8, 8.7])]], { t, e: glide });
    lieDetector(g, t, { pieces: P0, e: { ...EXPR.smug, lid: 0.25 }, wild: 0.2 });
  }, { trans: 'whip', kb: 0 });
  shot(nowT - 0.05, (g, lt, t, sh) => {  // "Now the board gets to answer.": down over the board, 1.e4; his eyes follow the pawn
    rig(B, lt, [[0, K(0.18, 0.5, 7.4, [4.4, 0.6, 3.6])], [len(sh), K(-0.06, 0.4, 5.6, [4.4, 0.7, 3.2])]], { t, e: glide });
    const r = runTo(GBONG, 0, [boardT + 0.35], t);
    lieDetector(g, t, { pieces: r.pieces, e: { ...EXPR.focus, look: [0, 0.6], curve: 0.25 }, wild: 0.2, ...moveFx(r, SLIDE, 0.5, false) });
  }, { kb: 0, zoom: kicks([[boardT + 0.35, 0.06]]) });
  shot(ctaA, (g, lt, t, sh) => {  // back in close: the first frame again, the question with a number
    rig(B, lt, [[0, OPEN2], [Math.min(1.2, len(sh)), OPEN]], { t, e: glide });
    lieDetector(g, t, { pieces: piecesAt(GBONG, 1), e: { ...EXPR.worried, sweat: 0, look: [0.5, 0.15] }, wild: 0.25 });
  }, { kb: 0, trans: 'whip', hud: (g, lt, t) => {
    coverTitle(g, 'HOW MANY', 'YEARS?', 205);
    if (t >= manyT) { badge(g, 'COMMENT YOUR NUMBER', W / 2, 1530, { color: GOLD, size: 50, ...popW(t, manyT) }); badge(g, `FOLLOW ${CHANNEL}`, W / 2, 1640, { color: '#16161E', size: 36, ...pop(t, manyT + 0.3) }); }
  } });
  cue(lpA - 0.04, 'whoosh_fast', 0.3); cue(nowT - 0.05, 'whoosh_soft', 0.25); cue(boardT + 0.35 - MOVE_HIT, 'move', 0.6); cue(ctaA - 0.04, 'whoosh_fast', 0.3); cue(manyT, 'reveal_bell', 0.35);

  const music = [
    { t: 0, m: 'hook' }, { t: qA, m: 'tension' }, { t: prA, m: 'glory' }, { t: magT, m: 'slam' }, { t: scA, m: 'tension' },
    { t: onA, m: 'void' }, { t: btA, m: 'build' }, { t: bt2A, m: 'slam' }, { t: tiA, m: 'tension' }, { t: cA, m: 'build' },
    { t: drA, m: 'void' }, { t: tsA, m: 'victory' }, { t: nwA, m: 'elegy' }, { t: twA, m: 'glory' }, { t: sxA, m: 'victory' }, { t: lpA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: truT - 0.45, t1: truT - 0.01, kind: 'mute' },
    { t0: bt2A - 0.35, t1: bt2A - 0.01, kind: 'mute' },
    { t0: T.e('must') + 0.05, t1: drawT - 0.01, kind: 'mute' },
    { t0: someT - 0.35, t1: someT - 0.02, kind: 'mute' },
    { t0: ckT - 0.25, t1: ckT + 0.18, kind: 'mute' },
    { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  return { shots, cues, music, musicFx, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
