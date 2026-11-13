// Witty Alien vs Magnus Carlsen, round two (Chess.com, 7 November 2026, 5+0 blitz, unrated). Five weeks after his blitz
// win over Carlsen, Witty played him again and threw his own Alien Gambit at him: 6.Nxf7 Kxf7. The engine said −2; then
// Magnus slipped (17...Bg6, +0.9 for Witty); Witty missed 21.Re6 (+1.3), played 21.Re2 and found Re6 two moves later,
// too late (23...Nxd5). Twenty seconds each in the endgame, Magnus walked his pawns, made two queens, and Witty resigned
// with six seconds left. On Chess.com it is 4–1 for Magnus. Sources: SOURCES.md.
// The author's brief (rules 61–63, 65, 66): the look of his Mittens video, a bright day room by default; Witty is Gojo and
// Magnus is Sukuna (Jujutsu Kaisen) as nods in our own drawing, and only on the beats (cast.js): "Nah, I'd win", the
// second queen, "WITTY WON.", the manga page, "For Magnus", "Stand proud", the clash of the two domains. The ending is a
// fake-out: "And..." with the bubble "WITTY WON.", a slash through the middle of the frame, black, then Witty lying in a
// crater (a black-and-white page, no blood), the camera pulling slowly away, and only then the voice: "Witty lost."
// The sponsor (Chessigma, if they agree) comes only at the end: their review of this very game on the monitor.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar, exprAt } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, counter, score, vsLabel, plate, sans, mono, popIn } from '../../engine/js/hud.js';
import { loadImage } from '../../engine/js/photo.js';
import { rig, seated, CAM } from '../../engine/js/stage.js';
import { table, chair, FLOOR_Y, texTri, pool } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { lowKey, spotCone } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { HI, ledGlow, flashTint, speedLines, squareFrame, boardArrow, pieceRing, spread, moveTag } from '../../engine/js/hifx.js';
import { webcam } from '../../engine/js/witty.js';
import { shockwave } from '../../engine/js/fx.js';
import { confetti } from '../../engine/js/draw.js';
import { setupCast, UP, drawLocks, HAIR, HAIR_S, BAND, INKED } from './cast.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (rule 48): the two domains ----------
const VOID = '#4FC3FF', VOIDD = '#0B1B4A', HOLLOW = '#A86BFF', CURSE = '#E3262F', CURSED = '#3A0508', INK = '#07070C';
const GOLD = '#F5C451', RED = '#E8413A', LIME = HI.good, CREAM = '#FFF3E0', BONE = '#F4EEE4';
const LEVY_C = VOID, FAN_C = CURSE;  // the names the shared table code below uses for its default colours
// the board: Chess.com green on a black lacquer slab (the slab, its sides and the engraving stay, rule 46)
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#15151C', side: '#0B0B10', th: 0.45, rc: 0.35 };
const LACQUER = ['#1C1C26', '#0D0D14', '#15151E'], WOODT = ['#C99A68', '#8A6440', '#A87E52'];
// the real game (SOURCES.md): Witty_Alien (White) – MagnusCarlsen, 7 Nov 2026; and their first blitz game, 30 Sep 2026
const PL = await fetch('../engine/data/witty_magnus_2026-11-07.json').then(r => r.json());
const CW = await fetch('../engine/data/carlsen_witty_2026.json').then(r => r.json());
// the TV: Chessigma's public review page of this very game, one screenshot per ply (photos/tv/ply_000 = the start;
// chessigma.com/games/36fc7bb3-b70e-4781-bfe4-d91cf7cd7c65, board flipped to White, 12 Nov 2026; SOURCES.md)
const TVF = await Promise.all([...Array(108)].map((_, k) => loadImage(`../episodes/witty2/photos/tv/ply_${String(k).padStart(3, '0')}.jpg`)));
// the sponsor's own 3-second end card from their creator kit (photos/rec/closer.mp4; frames by tools/frames.py into build/rec)
const RECI = await fetch('../episodes/witty2/build/rec/index.json').then(r => r.ok ? r.json() : null).catch(() => null);
if (!RECI) throw new Error('no frames of the end card: run python3 tools/frames.py episodes/witty2');
const REC = Object.fromEntries(await Promise.all(Object.entries(RECI).map(async ([name, { n }]) =>
  [name, await Promise.all(Array.from({ length: n }, (_, k) => loadImage(`../episodes/witty2/build/rec/${name}/${String(k + 1).padStart(3, '0')}.jpg`)))])));
const recFrame = (name, sec) => REC[name][clamp(Math.floor(sec * RECI[name].fps), 0, RECI[name].n - 1)];
function adTag(g, a = 1) { plate(g, 'AD', 96, 146, { color: '#16161E', size: 26, a: a * 0.92, rot: 0 }); }

// ---------- the cast (cast.js): wit / mag in the look (Gojo, Sukuna), witN / magN as themselves. Most of the video they
// are themselves (the author: "не надо чтоб они прям во всех сценах были в этом образе"); the look shows on the beats ----------
setupCast();
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
const CLKS = [[300, 300], [300.0, 300.0], [300.0, 300.0], [298.5, 300.0], [298.5, 299.0], [297.2, 299.0], [297.2, 294.3], [296.1, 294.3], [296.1, 293.6], [295.0, 293.6], [295.0, 279.4], [293.1, 279.4], [293.1, 272.4], [292.2, 272.4], [292.2, 265.1], [291.2, 265.1], [291.2, 261.7], [290.7, 261.7], [290.7, 245.5], [290.0, 245.5], [290.0, 242.0], [276.1, 242.0], [276.1, 228.3], [269.2, 228.3], [269.2, 222.5], [259.2, 222.5], [259.2, 206.8], [257.9, 206.8], [257.9, 193.5], [244.8, 193.5], [244.8, 186.3], [223.8, 186.3], [223.8, 181.4], [175.9, 181.4], [175.9, 173.7], [149.2, 173.7], [149.2, 115.5], [147.9, 115.5], [147.9, 112.6], [119.8, 112.6], [119.8, 78.0], [82.1, 78.0], [82.1, 74.5], [80.7, 74.5], [80.7, 71.9], [67.2, 71.9], [67.2, 48.1], [43.4, 48.1], [43.4, 46.6], [43.3, 46.6], [43.3, 45.9], [43.2, 45.9], [43.2, 44.8], [40.0, 44.8], [40.0, 40.1], [29.9, 40.1], [29.9, 39.0], [29.0, 39.0], [29.0, 37.7], [27.1, 37.7], [27.1, 34.4], [26.4, 34.4], [26.4, 33.4], [25.0, 33.4], [25.0, 32.1], [23.5, 32.1], [23.5, 28.1], [23.0, 28.1], [23.0, 25.6], [21.2, 25.6], [21.2, 24.1], [20.7, 24.1], [20.7, 21.2], [19.2, 21.2], [19.2, 21.1], [18.8, 21.1], [18.8, 20.3], [18.3, 20.3], [18.3, 19.7], [17.5, 19.7], [17.5, 19.6], [14.2, 19.6], [14.2, 18.8], [13.5, 18.8], [13.5, 18.3], [12.5, 18.3], [12.5, 18.2], [11.8, 18.2], [11.8, 17.5], [11.7, 17.5], [11.7, 16.8], [11.6, 16.8], [11.6, 15.6], [11.2, 15.6], [11.2, 14.9], [10.2, 14.9], [10.2, 14.0], [9.6, 14.0], [9.6, 13.9], [9.0, 13.9], [9.0, 13.6], [8.3, 13.6], [8.3, 13.5], [7.7, 13.5], [7.7, 12.6], [7.0, 12.6], [7.0, 12.5], [6.1, 12.5]];  // [White, Black] seconds after each ply (the PGN's [%clk])

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
function endWall(g, z, dz, col) {
  const { x0, x1, top } = ROOM, wall = { color: '#F4E9D7', grout: 'rgba(0,0,0,0.03)', tu: 40, tv: 40 }, zi = (a, b) => [Math.min(z + dz * a, z + dz * b), Math.max(z + dz * a, z + dz * b)];
  if (dz < 0) tiled(g, [x0, FLOOR_Y, z], [x1 - x0, 0, 0], [0, top - FLOOR_Y, 0], wall); else tiled(g, [x1, FLOOR_Y, z], [x0 - x1, 0, 0], [0, top - FLOOR_Y, 0], wall);
  let [a, b] = zi(0, 0.12); ab(g, [x0, FLOOR_Y, a], [x1, FLOOR_Y + 0.5, b], '#E6D7BF');
  [a, b] = zi(0, 0.1); ab(g, [WIN.x0 - 0.3, WIN.y0 - 0.3, a], [WIN.x1 + 0.3, WIN.y1 + 0.3, b], '#FBF6EC');
  const zs = z + dz * 0.12;
  if (dz < 0) texQuad(g, SKY_T, [WIN.x0, WIN.y1, zs], [WIN.x1, WIN.y1, zs], [WIN.x0, WIN.y0, zs]); else texQuad(g, SKY_T, [WIN.x1, WIN.y1, zs], [WIN.x0, WIN.y1, zs], [WIN.x1, WIN.y0, zs]);
  pool(g, B, 4, 7, z + dz * 0.2, 12, '#FFF6DA', 0.26, true);
  [a, b] = zi(0, 0.7); ab(g, [WIN.x0 - 0.5, WIN.y0 - 0.55, a], [WIN.x1 + 0.5, WIN.y0 - 0.3, b], '#FFFBF2');
  curtain(g, WIN.x0 - 3.0, WIN.x0 + 0.1, z, dz, col); curtain(g, WIN.x1 - 0.1, WIN.x1 + 3.0, z, dz, col);
  [a, b] = zi(0.3, 0.48); ab(g, [WIN.x0 - 3.5, WIN.y1 + 0.72, a], [WIN.x1 + 3.5, WIN.y1 + 0.92, b], '#3A2E28');
}
// the little alien on Witty's sill (his logo): a green head with almond eyes on a small body
function alienToy(g) {
  const x = WIN.x1 - 1.5, y = WIN.y0 - 0.3, z = ROOM.z0 + 0.45;
  if (depth(x, y, z) < 1) return;
  const q = B.project(x, y, z), s = q.s;
  g.save(); g.translate(q.x, q.y);
  g.fillStyle = '#5E9A48'; g.beginPath(); g.roundRect(-0.26 * s, -0.62 * s, 0.52 * s, 0.62 * s, 0.2 * s); g.fill();
  g.fillStyle = '#8FD16A'; g.beginPath(); g.ellipse(0, -1.02 * s, 0.5 * s, 0.56 * s, 0, 0, 7); g.fill();
  g.fillStyle = '#10140E'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 0.2 * s, -1.0 * s, 0.14 * s, 0.2 * s, sd * -0.5, 0, 7); g.fill(); }
  g.restore();
}
function dayRoom(g, t, { flip = 1, cal = false } = {}) {
  const E = B.E, { x0, x1, z0, z1, top } = ROOM;
  g.fillStyle = '#F1E6D2'; g.fillRect(0, 0, W, H);
  if (E[1] > FLOOR_Y) {
    tiled(g, [x0, FLOOR_Y, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], { color: '#C99D6C', grout: 'rgba(110,70,35,0.2)', tu: 1.2, tv: z1 - z0,
      light: g2 => { pool(g2, B, 4, FLOOR_Y + 0.02, -7, 10, '#FFF2D2', 0.3); pool(g2, B, 4, FLOOR_Y + 0.02, 9.5, 9, '#FFF2D2', 0.24); } });
    tiled(g, [-5.5, FLOOR_Y + 0.02, -7.5], [19, 0, 0], [0, 0, 19.5], { color: '#7A97B8', grout: 'rgba(255,255,255,0.12)', tu: 19, tv: 1.3 });  // the rug
  }
  if (E[2] < z1) { endWall(g, z1, -1, '#B5544A'); if (cal) calendar(g, flip); }   // the far wall, behind the monitor and Magnus's seat (the calendar: only in its own shot)
  if (E[2] > z0) { endWall(g, z0, 1, '#5B7FA8'); alienToy(g); }           // the near wall, behind Witty
  const side = { color: '#EADCC6', grout: 'rgba(0,0,0,0.03)', tu: 40, tv: 40 };
  if (E[0] > x0) { tiled(g, [x0, FLOOR_Y, z0], [0, 0, z1 - z0], [0, top - FLOOR_Y, 0], side); bookcase(g); }
  if (E[0] < x1) { tiled(g, [x1, FLOOR_Y, z1], [0, 0, z0 - z1], [0, top - FLOOR_Y, 0], side); wallPrint(g); }
}

// ======================= THE DOMAINS (the anime beats) =======================
// Two skies that hold from any camera (version 5; the textured walls of the first versions read as black bars when
// only their lower edge was in frame). Looking toward Witty's end: the void, deep blue space with a white-blue core
// behind his head, slow rings, rays and stars. Looking toward Magnus's end: a blood-red sky, a black shrine with a
// glowing mouth, embers rising. Sideways the two blend.
const VOID_T = tex(1600, 1000, (x, w, h) => {  // the void as a flat picture (the domain clash uses it)
  const gr = x.createRadialGradient(w / 2, h * 0.47, 0, w / 2, h * 0.47, w * 0.62);
  gr.addColorStop(0, '#F2FBFF'); gr.addColorStop(0.05, '#9FE0FF'); gr.addColorStop(0.16, '#2E7AD8'); gr.addColorStop(0.42, '#0C1E52'); gr.addColorStop(1, '#04060F');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(170,225,255,0.13)'; x.lineWidth = 3;
  for (let r = 110; r < 900; r += 64) { x.beginPath(); x.ellipse(w / 2, h * 0.47, r, r * 0.62, 0, 0, 7); x.stroke(); }
  const r = rng(31);
  for (let i = 0; i < 1100; i++) { const sx = r() * w, sy = r() * h, s = 0.6 + r() ** 3 * 2.6; x.fillStyle = `rgba(230,245,255,${(0.35 + 0.65 * r()).toFixed(2)})`; x.beginPath(); x.arc(sx, sy, s, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(200,235,255,0.08)'; x.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const a = r() * 6.2832; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 90, h * 0.47 + Math.sin(a) * 56); x.lineTo(w / 2 + Math.cos(a) * 1000, h * 0.47 + Math.sin(a) * 620); x.stroke(); }
});
const STARS = (() => { const r = rng(31), out = []; for (let i = 0; i < 380; i++) { const a = Math.PI + r() * Math.PI, e = (r() - 0.3) * 1.7; out.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), 0.9 + r() ** 3 * 3.4, 0.35 + 0.65 * r(), r() * 6.28]); } return out; })();
const EMBERS = (() => { const r = rng(17), out = []; for (let i = 0; i < 70; i++) out.push([-26 + r() * 60, r() * 26, 13 + r() * 16, 0.7 + r() * 1.6, r() * 6.28, 2 + r() * 4]); return out; })();
function voidSky(g, t, k = 1) {
  g.fillStyle = '#03050E'; g.fillRect(0, 0, W, H);
  const c = B.toCam(4, 6.0, -70);
  if (c[2] > 1) {
    const sx = B.cx + B.f * c[0] / c[2], sy = B.cy - B.f * c[1] / c[2];
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, 1900);
    gr.addColorStop(0, rgba('#F2FBFF', k)); gr.addColorStop(0.035, rgba('#9FE0FF', k)); gr.addColorStop(0.14, rgba('#2E7AD8', 0.95 * k)); gr.addColorStop(0.4, rgba('#0C1E52', 0.9 * k)); gr.addColorStop(1, 'rgba(4,6,15,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'screen'; g.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const r = (130 + i * 120) * (1 + 0.012 * Math.sin(t * 1.3 + i)); g.strokeStyle = rgba('#AEE2FF', 0.12 * k * (1 - i / 14)); g.beginPath(); g.ellipse(sx, sy, r, r * 0.66, 0, 0, 7); g.stroke(); }
    g.lineWidth = 2; g.strokeStyle = rgba('#C8EBFF', 0.07 * k); g.beginPath();
    for (let i = 0; i < 36; i++) { const a = i / 36 * 6.2832 + t * 0.04 + Math.sin(i * 7.1) * 0.08; g.moveTo(sx + Math.cos(a) * 110, sy + Math.sin(a) * 74); g.lineTo(sx + Math.cos(a) * 2200, sy + Math.sin(a) * 1480); }
    g.stroke(); g.restore();
  }
  g.save(); g.fillStyle = '#E6F5FF';
  for (const [dx, dy, dz, s, a, ph] of STARS) {
    const p = B.toCam(4 + dx * 300, 3 + dy * 300, 4 + dz * 300); if (p[2] < 1) continue;
    g.globalAlpha = a * k * (0.7 + 0.3 * Math.sin(t * 2.2 + ph)); g.beginPath(); g.arc(B.cx + B.f * p[0] / p[2], B.cy - B.f * p[1] / p[2], s, 0, 7); g.fill();
  }
  g.restore();
}
function shrineSky(g, t, k = 1) {
  const hy = clamp(hz(), -400, H + 400);
  g.fillStyle = '#0B0307'; g.fillRect(0, 0, W, H);
  if (hy > 40) {
    const sky = g.createLinearGradient(0, hy - 1500, 0, hy); sky.addColorStop(0, '#0B0206'); sky.addColorStop(0.55, '#3A050B'); sky.addColorStop(0.88, '#A4141C'); sky.addColorStop(1, '#D8302A');
    g.fillStyle = sky; g.fillRect(0, 0, W, hy);
  }
  { const gl = g.createRadialGradient(W / 2, Math.min(hy, 0) - 80, 40, W / 2, Math.min(hy, 0) - 80, 1250); gl.addColorStop(0, rgba('#E3262F', 0.42 * k)); gl.addColorStop(1, 'rgba(227,38,47,0)'); if (hy <= 160) { g.fillStyle = gl; g.fillRect(0, 0, W, H); } }
  const p = B.toCam(4, FLOOR_Y, 34);
  if (p[2] > 2 && hy > 160) {  // from above only its base would show: left out
    const sx = B.cx + B.f * p[0] / p[2], sy = B.cy - B.f * p[1] / p[2], u = B.f / p[2];
    const sun = g.createRadialGradient(sx, sy - 9 * u, 10, sx, sy - 9 * u, 15 * u); sun.addColorStop(0, rgba('#FF6A4A', 0.75 * k)); sun.addColorStop(0.45, rgba('#E3262F', 0.35 * k)); sun.addColorStop(1, 'rgba(227,38,47,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    shrineSil(g, sx, sy, 27 * u / 940);
  }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [x, y0, z, v, ph, s] of EMBERS) {
    const y = FLOOR_Y + ((y0 + t * v) % 26), q = B.toCam(x + Math.sin(t * 0.8 + ph) * 0.8, y, z); if (q[2] < 1) continue;
    g.fillStyle = rgba('#FF8A4A', 0.6 * k * (0.5 + 0.5 * Math.sin(t * 3 + ph))); g.beginPath(); g.arc(B.cx + B.f * q[0] / q[2], B.cy - B.f * q[1] / q[2], s * B.f / q[2] / 22, 0, 7); g.fill();
  }
  g.restore();
}
function domainBack(g, t, { blue = 1, red = 1 } = {}) {
  const E = B.E, wS = clamp((B.F[2] + 0.3) / 0.6);  // 0: looking at Witty's end, 1: at Magnus's
  if (wS < 1) voidSky(g, t, blue);
  if (wS > 0) { g.save(); g.globalAlpha = wS; shrineSky(g, t, red); g.restore(); }
  if (E[1] > FLOOR_Y) tiled(g, [-40, FLOOR_Y, -30], [90, 0, 0], [0, 0, 70], { color: '#09090F', grout: 'rgba(140,160,220,0.05)', tu: 4, light: g2 => {
    pool(g2, B, 4, FLOOR_Y + 0.02, -6, 16, VOID, 0.16 * blue); pool(g2, B, 4, FLOOR_Y + 0.02, 15, 16, CURSE, 0.22 * red);
  } });
  // the two lights: a blue cone onto Witty's side, a red one onto Magnus's
  spotCone(g, B, { top: [4, 18, -6], base: [4, -0.35, 0.5], r0: 0.4, r1: 5.5, a: 0.07 * blue, dust: 14, t, seed: 4, color: '#9FDCFF' });
  spotCone(g, B, { top: [4, 18, 14], base: [4, -0.35, 7.5], r0: 0.4, r1: 5.5, a: 0.07 * red, dust: 14, t, seed: 9, color: '#FF7A70' });
}
// the players at the table. o: tableSet options (pieces, ew/eb expressions, reaches ...); glow under the heads
function domain(g, t, o = {}) {
  const { blue = 1, red = 1, dark = false, flip = 1, cal = false, ...tab } = o;
  if (dark) domainBack(g, t, { blue, red }); else dayRoom(g, t, { flip, cal });
  tableSet(g, t, { white: 'witN', black: 'magN', tableCol: dark ? LACQUER : WOODT, behind: g2 => {
    if (!dark) return;
    for (const [z, col, a] of [[-1.4, VOID, 0.5 * blue], [9.3, CURSE, 0.55 * red]]) { if (depth(4, 3.2, z) < 0.8) continue; const p = B.project(4, 3.2, z); rim(g2, p.x, p.y, p.s * 3.4, col, a); }
  }, ...tab });
  lowKey(g, { cy: H * 0.45, a: dark ? 0.12 : 0.04 });
}

// ======================= THE STREAM MONITOR =======================
// one screen on a stand at the far edge of the table (version 5; the wall panels of the first versions were small and
// the wall round them empty): the two webcams side by side, Witty's in blue and Magnus's in red, or the review
const MON = { c: [4, 3.3, 10.7], hw: 4.4, hh: 2.475 };
const CAMLOOK = { wit: { bg: ['#3A8FE0', '#0B1B4A'], name: 'WITTY_ALIEN', nameColor: '#8FD6FF' }, mag: { bg: ['#C42A30', '#3A0508'], name: 'MAGNUSCARLSEN', nameColor: '#FF9A90' } };
const SPLIT = makeCanvas(1760, 990);
function splitTex(cams, t) {
  const x = SPLIT.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 1760, 990);
  for (const [who, x0] of [['wit', 0], ['mag', 880]]) {
    const o = cams[who] || {}, L = CAMLOOK[who];
    webcam(x, x0, 0, 880, 990, o.anime ? who : who + 'N', o.e || 'focus', t, { bg: L.bg, zoom: 1.12 * (o.zoom || 1), cy: 0.47, shake: o.shake || 0 });
    x.fillStyle = 'rgba(8,8,14,0.88)'; x.fillRect(x0, 990 - 92, 880, 92);
    x.font = sans(48, 900); x.letterSpacing = '5px'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = L.nameColor; x.fillText(L.name, x0 + 442, 990 - 43);
  }
  x.fillStyle = '#0B0B10'; x.fillRect(875, 0, 10, 990);
  return SPLIT;
}
// the two halves of the screen in the world (their centres), for cameras and for stamps laid over them
const CAMPOS = { wit: [MON.c[0] - MON.hw / 2, MON.c[1], MON.c[2]], mag: [MON.c[0] + MON.hw / 2, MON.c[1], MON.c[2]] };
const OFF_T = tex(64, 36, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#16171D'); gr.addColorStop(1, '#0A0A0E'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
const TVC_ = new Map();  // the review's frames as canvases (texQuad samples a canvas), made when first needed
function tvCanvas(k) { k = clamp(k, 0, 107); if (!TVC_.has(k)) { const im = TVF[k], c = makeCanvas(im.width, im.height); c.getContext('2d').drawImage(im, 0, 0); TVC_.set(k, c); } return TVC_.get(k); }
function monitorSet(g, img) {
  const { c, hw, hh } = MON;
  ab(g, [c[0] - 0.4, FLOOR_Y, c[2] + 0.12], [c[0] + 0.4, c[1] - hh, c[2] + 0.5], '#17171D');
  ab(g, [c[0] - 2.4, FLOOR_Y, c[2] - 0.6], [c[0] + 2.4, FLOOR_Y + 0.16, c[2] + 1.2], '#17171D');
  ab(g, [c[0] - hw - 0.17, c[1] - hh - 0.17, c[2]], [c[0] + hw + 0.17, c[1] + hh + 0.17, c[2] + 0.3], '#0B0B10', { spec: 0.4 });
  if (B.E[2] < c[2]) texQuad(g, img || OFF_T, [c[0] - hw, c[1] + hh, c[2] - 0.02], [c[0] + hw, c[1] + hh, c[2] - 0.02], [c[0] - hw, c[1] - hh, c[2] - 0.02]);
}
// the online game: no players at the table; the monitor behind it shows the review at ply `tv`, or the webcams
function online(g, t, { pieces, under = null, over = null, cams = {}, clock = null, camA = 1, blue = 1, red = 1, tv = null, dark = false, flip = 1, mon = true, focus = null, dof } = {}) {
  if (dark) domainBack(g, t, { blue, red }); else dayRoom(g, t, { flip });
  if (mon && B.E[2] < MON.c[2] - 0.6) monitorSet(g, tv !== null ? tvCanvas(tv) : camA > 0 ? splitTex(cams, t) : null);
  tableSet(g, t, { pieces, under, over, clock, wPlayer: false, bPlayer: false, wChair: false, bChair: false, tableCol: dark ? LACQUER : WOODT, focus, dof });
  if (mon && img_glow(tv, camA)) pool(g, B, 4, -0.33, 8.7, 4.5, '#BFD8FF', 0.07);
  lowKey(g, { cy: H * 0.46, a: dark ? 0.16 : 0.04 });
}
const img_glow = (tv, camA) => tv !== null || camA > 0;
// ======================= "WITTY LOST." =======================
// Witty on his back in a crater of cracked ground, seen from straight above, in black and white like the manga panel
// the author sent (Gojo lying after the cut). Our own drawing: whole, no blood; his blindfold fallen beside his head,
// his king tipped over by his open hand. The page is drawn in its own pixels round the middle of his face (the body
// runs down and to the left); the camera is a look-at point (lx, ly) on the page, a zoom and a roll.
const LIE_TH = 0.95, LIE_S = 1.6;
const LIE = (() => {
  const r = rng(236), rocks = [], cracks = [], specks = [], rings = [];
  const C0 = [-420, 300];  // the middle of the crater (his chest)
  for (let i = 0; i < 64; i++) {
    const a = r() * 7, d = 620 + Math.pow(r(), 0.8) * 1500, sz = 16 + Math.pow(r(), 2.2) * 120, n = 5 + Math.floor(r() * 4), pts = [];
    for (let k = 0; k < n; k++) { const b = k / n * 6.2832 + r() * 0.5; pts.push([Math.cos(b) * sz * (0.6 + 0.5 * r()), Math.sin(b) * sz * (0.6 + 0.5 * r())]); }
    rocks.push({ x: C0[0] + Math.cos(a) * d * 1.05, y: C0[1] + Math.sin(a) * d * 1.2, pts, shade: r() < 0.5 ? '#E4E1DA' : '#C9C5BD', rot: r() * 7 });
  }
  for (let i = 0; i < 22; i++) {  // cracks running out from under him
    let a = i / 22 * 6.2832 + r() * 0.25, x = C0[0] + Math.cos(a) * 330, y = C0[1] + Math.sin(a) * 420; const pts = [[x, y]];
    for (let k = 0; k < 8; k++) { a += (r() - 0.5) * 0.7; const st = 80 + r() * 150; x += Math.cos(a) * st; y += Math.sin(a) * st * 1.15; pts.push([x, y]); if (k > 2 && r() < 0.3) pts.push(null, [x, y]); }
    cracks.push(pts);
  }
  for (let k = 0; k < 3; k++) {  // broken rings round the crater
    const R = 560 + k * 260, pts = [];
    for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.2832; pts.push(r() < 0.22 ? null : [C0[0] + Math.cos(a) * R * (1 + 0.06 * (r() - 0.5)), C0[1] + Math.sin(a) * R * 1.2 * (1 + 0.06 * (r() - 0.5))]); }
    rings.push(pts);
  }
  for (let i = 0; i < 220; i++) { const a = r() * 7, d = 300 + r() * 1900; specks.push([C0[0] + Math.cos(a) * d, C0[1] + Math.sin(a) * d * 1.2, 2 + r() * 6]); }
  return { rocks, cracks, specks, rings, C0 };
})();
function polyline(g, pts) { let pen = false; g.beginPath(); for (const p of pts) { if (!p) { pen = false; continue; } if (pen) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); pen = true; } g.stroke(); }
function lying(g, t, { z = 1, lx = 0, ly = 0, rot = 0, cx = W / 2, cy = H * 0.46 } = {}) {
  const S = LIE_S, INK = '#08080B', [cxr, cyr] = LIE.C0;
  g.save(); g.fillStyle = '#EEECE6'; g.fillRect(0, 0, W, H);
  g.translate(cx, cy); g.rotate(rot); g.scale(z, z); g.translate(-lx, -ly);
  // the crater: a darker bowl under him, hatched twice toward its middle
  const bowl = g.createRadialGradient(cxr, cyr, 120, cxr, cyr, 1150); bowl.addColorStop(0, 'rgba(40,38,36,0.42)'); bowl.addColorStop(0.5, 'rgba(70,68,64,0.2)'); bowl.addColorStop(1, 'rgba(90,88,84,0)');
  g.fillStyle = bowl; g.beginPath(); g.ellipse(cxr, cyr, 1150, 1380, 0, 0, 7); g.fill();
  g.save(); g.beginPath(); g.ellipse(cxr, cyr, 760, 920, 0, 0, 7); g.clip();
  g.strokeStyle = 'rgba(12,12,14,0.2)'; g.lineWidth = 3; g.beginPath();
  for (let i = -40; i <= 40; i++) { g.moveTo(cxr - 900 + i * 30, cyr - 1000); g.lineTo(cxr - 300 + i * 30, cyr + 1000); }
  g.stroke(); g.restore();
  g.save(); g.beginPath(); g.ellipse(cxr, cyr, 470, 580, 0, 0, 7); g.clip();  // the deepest part: the same hatching, twice as dense
  g.strokeStyle = 'rgba(12,12,14,0.22)'; g.lineWidth = 3; g.beginPath();
  for (let i = -40; i <= 40; i++) { g.moveTo(cxr - 885 + i * 30, cyr - 1000); g.lineTo(cxr - 285 + i * 30, cyr + 1000); }
  g.stroke(); g.restore();
  g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 4; g.globalAlpha = 0.75; for (const pts of LIE.rings) polyline(g, pts); g.globalAlpha = 1;
  for (const pts of LIE.cracks) { g.lineWidth = 7; polyline(g, pts.slice(0, 4)); g.lineWidth = 4; polyline(g, pts.slice(3)); }
  g.fillStyle = '#17171A'; for (const [x, y, rr] of LIE.specks) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
  for (const rk of LIE.rocks) {
    g.save(); g.translate(rk.x, rk.y); g.rotate(rk.rot);
    g.fillStyle = 'rgba(12,12,14,0.32)'; g.beginPath(); rk.pts.forEach(([x, y], k) => (k ? g.lineTo : g.moveTo).call(g, x + 8, y + 10)); g.closePath(); g.fill();
    g.fillStyle = rk.shade; g.strokeStyle = INK; g.lineWidth = 4.5; g.beginPath(); rk.pts.forEach(([x, y], k) => (k ? g.lineTo : g.moveTo).call(g, x, y)); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  // his shadow on the ground
  g.save(); g.rotate(LIE_TH); g.fillStyle = 'rgba(10,10,12,0.3)'; g.beginPath(); g.ellipse(18, 560 * S, 250 * S, 520 * S, 0, 0, 7); g.fill(); g.restore();
  // the blindfold, fallen beside his head
  g.save(); g.translate(250, -230); g.rotate(-0.5); g.fillStyle = BAND; g.strokeStyle = INK; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-150, -8); g.bezierCurveTo(-70, -54, 40, 34, 150, -18); g.lineTo(158, 30); g.bezierCurveTo(50, 84, -66, -8, -146, 42); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-140, 14); g.bezierCurveTo(-66, -28, 44, 58, 150, 4); g.stroke();
  g.restore();
  // the body: the dark jacket and trousers, white fold lines, as the page's blacks
  const limb = (x, y, a, wd, l, fill, hand) => {
    g.save(); g.translate(x * S, y * S); g.rotate(a);
    g.fillStyle = fill; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(-wd / 2 * S, 0, wd * S, l * S, wd / 2 * S); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 4; for (const f of [0.3, 0.52, 0.74]) { g.beginPath(); g.moveTo(-wd * 0.3 * S, l * f * S); g.quadraticCurveTo(0, (l * f + 16) * S, wd * 0.32 * S, (l * f - 6) * S); g.stroke(); }
    if (hand === 'hand') {  // an open hand: the palm and four fingers
      g.fillStyle = '#E9E6E0'; g.strokeStyle = INK; g.lineWidth = 5;
      for (let k = 0; k < 4; k++) { g.save(); g.translate((-22 + k * 15) * S, (l + 44) * S); g.rotate((k - 1.5) * 0.16); g.beginPath(); g.roundRect(-6.5 * S, 0, 13 * S, (30 + (k === 1 || k === 2 ? 8 : 0)) * S, 6 * S); g.fill(); g.stroke(); g.restore(); }
      g.beginPath(); g.ellipse(0, (l + 26) * S, 36 * S, 32 * S, 0, 0, 7); g.fill(); g.stroke();
      g.save(); g.translate(34 * S, (l + 18) * S); g.rotate(-0.9); g.beginPath(); g.roundRect(-7 * S, 0, 14 * S, 30 * S, 6 * S); g.fill(); g.stroke(); g.restore();
    } else { g.fillStyle = '#0C0C10'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-wd * 0.56 * S, (l - 8) * S, wd * 1.12 * S, 92 * S, 30 * S); g.fill(); g.stroke(); }
    g.restore();
  };
  g.save(); g.rotate(LIE_TH);
  limb(-66, 500, 0.1, 100, 430, '#16171D', 'shoe'); limb(66, 500, -0.07, 100, 430, '#16171D', 'shoe');
  limb(-140, 176, 0.92, 84, 290, '#1B1D26', 'hand'); limb(140, 176, -0.5, 84, 290, '#1B1D26', 'hand');
  g.fillStyle = '#14151B'; g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.roundRect(-150 * S, 128 * S, 300 * S, 400 * S, 74 * S); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 5;
  for (const [x0, y0, x1, y1] of [[-96, 250, -18, 322], [36, 300, 112, 246], [-76, 420, 66, 452], [-30, 196, 40, 214]]) { g.beginPath(); g.moveTo(x0 * S, y0 * S); g.quadraticCurveTo((x0 + x1) / 2 * S, (Math.max(y0, y1) + 30) * S, x1 * S, y1 * S); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 150 * S); g.lineTo(0, 520 * S); g.stroke();
  g.fillStyle = '#B9B6AE'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(22 * S, 214 * S, 12 * S, 0, 7); g.fill(); g.stroke();  // the button
  g.restore();
  // his king, tipped over by his open hand
  g.save(); g.filter = 'grayscale(1) contrast(1.15)'; drawPiece(g, 'k', 'w', -1010, 280, 300, { rot: -1.15 }); g.restore();
  // the head: eyes shut, the hair fallen (no body: it is drawn above)
  const face = { ...EXPR.blind, band: 0, glow: 0, curve: -0.15, mouth: 'line', brow: -0.3, browTilt: 0 };
  g.save(); g.translate(3, 5); drawChar(g, 'wit', { x: 0, y: 0, s: S * 1.045, e: face, t: 0, tilt: LIE_TH, noBody: true, silhouette: true, shade: 'brightness(0)' }); g.restore();  // the contour
  g.save(); g.filter = 'grayscale(1) contrast(1.25) brightness(0.9)'; INKED.on = true;
  drawChar(g, 'wit', { x: 0, y: 0, s: S, e: face, t: 0, tilt: LIE_TH, noBody: true }); INKED.on = false;
  g.restore();
  g.save(); g.rotate(LIE_TH); g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 4;  // scuffs: three short strokes on a cheek, two on the jaw
  for (const [x0, y0, x1, y1] of [[58, 30, 80, 20], [60, 42, 86, 31], [64, 54, 84, 46], [-72, 74, -54, 86], [-66, 62, -50, 72]]) { g.beginPath(); g.moveTo(x0 * S, y0 * S); g.lineTo(x1 * S, y1 * S); g.stroke(); }
  g.restore();
  g.restore();
}
// five standing cards on the table: every game of theirs on Chess.com (SOURCES.md), the winner's colour
const GAMES = [['DEC 28, 2024', 'BULLET', 'mag'], ['DEC 13, 2025', 'BULLET', 'mag'], ['DEC 13, 2025', 'BULLET', 'mag'], ['SEP 30, 2026', 'BLITZ', 'wit'], ['NOV 7, 2026', 'BLITZ', 'mag']];
const CARD_T = GAMES.map(([d, kind, who]) => tex(360, 520, (x, w, h) => {
  x.fillStyle = '#0E0E14'; x.fillRect(0, 0, w, h); x.fillStyle = who === 'mag' ? '#3A0508' : '#0B1B4A'; x.fillRect(10, 10, w - 20, h - 20);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = sans(30, 800); x.letterSpacing = '3px'; x.fillStyle = 'rgba(255,243,224,0.75)'; x.fillText(d, w / 2, 62); x.fillText(kind, w / 2, 108);
  x.font = sans(64, 900); x.letterSpacing = '2px'; x.fillStyle = who === 'mag' ? '#FF6A60' : '#7FD0FF'; x.fillText(who === 'mag' ? 'MAGNUS' : 'WITTY', w / 2, 300);
  x.font = sans(34, 900); x.letterSpacing = '6px'; x.fillStyle = CREAM; x.fillText('WINS', w / 2, 370);
}));
function cards(g, t, t0) {
  for (let i = 0; i < 5; i++) {
    const u = ease.out(seg(t, t0 + i * 0.16, t0 + i * 0.16 + 0.3)), x = 1.28 + i * 1.36, z = 3.6, y0 = -0.35, hh = 1.0, hw = 0.62;
    if (u <= 0) continue;
    const tilt = (1 - u) * 1.4, top = [x, y0 + 2 * hh * Math.cos(tilt), z + 2 * hh * Math.sin(tilt)];
    const R = [x - hw, top[1], top[2]], Q = [x + hw, top[1], top[2]], L = [x - hw, y0, z];
    if (depth(x, y0 + hh, z) < 0.6) continue;
    ab(g, [x - hw - 0.06, y0, z + 0.02], [x + hw + 0.06, y0 + 0.08, z + 0.3], '#0A0A10');
    texQuad(g, CARD_T[i], R, Q, L, { a: clamp(u * 2) });
    if (GAMES[i][2] === 'wit') { const p = B.project(x, y0 + hh, z); rim(g, p.x, p.y, p.s * 2.4, VOID, 0.3 * u); }
  }
}
// Hollow Purple: a blue orb and a red one meet over the knight and become one purple orb
function orb(g, x, y, r, col, a = 1) {
  if (a <= 0 || r <= 0) return;
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.22, mix(col, '#FFFFFF', 0.5)); gr.addColorStop(0.55, rgba(col, 0.7)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
}
// ======================= THE DOMAIN CLASH (the author's reference: Gojo's void against Sukuna's shrine) =======================
// our own 2.5D picture, not the anime frame: the blue starry void at the lower left with Witty (Gojo) seen from behind,
// the red sky at the upper right with a black shrine and Magnus (Sukuna) on its roof, the two meeting on a diagonal
// where blue and red streaks collide. u: the push-in (0..1); hit: time of the clash flash
const CLASH = { a: [0, H * 0.16], b: [W, H * 0.74] };  // the clash line: above it the shrine, below it the void
const clashSide = (x, y) => (CLASH.b[0] - CLASH.a[0]) * (y - CLASH.a[1]) - (CLASH.b[1] - CLASH.a[1]) * (x - CLASH.a[0]);  // < 0: the red side
function shrineSil(g, cx, by, s) {  // a black two-roofed shrine on a platform, its open hall glowing red
  g.save(); g.translate(cx, by); g.scale(s, s); g.fillStyle = '#08020A';
  g.fillRect(-470, -40, 940, 60); g.fillRect(-420, -80, 840, 50);
  for (const px of [-360, -210, 170, 320]) g.fillRect(px, -330, 40, 260);
  const hall = g.createLinearGradient(0, -330, 0, -80); hall.addColorStop(0, '#3A0408'); hall.addColorStop(1, '#FF3A2E'); g.fillStyle = hall; g.fillRect(-170, -330, 340, 250);
  g.fillStyle = '#08020A';
  for (let i = 0; i < 9; i++) { const x = -150 + i * 37; g.beginPath(); g.moveTo(x, -330); g.lineTo(x + 18, -270); g.lineTo(x + 36, -330); g.fill(); g.beginPath(); g.moveTo(x, -80); g.lineTo(x + 18, -135); g.lineTo(x + 36, -80); g.fill(); }  // teeth round the hall
  const roof = (y, hw, rise, th) => { g.beginPath(); g.moveTo(-hw, y); g.quadraticCurveTo(-hw * 0.55, y - rise * 0.15, 0, y - rise); g.quadraticCurveTo(hw * 0.55, y - rise * 0.15, hw, y);
    g.lineTo(hw - 50, y + th); g.quadraticCurveTo(hw * 0.5, y - rise * 0.08 + th, 0, y - rise + th * 1.4); g.quadraticCurveTo(-hw * 0.5, y - rise * 0.08 + th, -hw + 50, y + th); g.closePath(); g.fill(); };
  roof(-330, 560, 170, 56); g.fillRect(-300, -500, 600, 70); roof(-500, 400, 140, 50);
  g.beginPath(); g.moveTo(-330, -500); g.quadraticCurveTo(-180, -540, 0, -585); g.quadraticCurveTo(180, -540, 330, -500); g.lineTo(330, -420); g.lineTo(-330, -420); g.closePath(); g.fill();  // the roof's body under the ridge
  g.restore();
}
function gojoBack(g, x, y, s, t) {  // Witty in the look from behind: the dark jacket and its collar, the back of the white hair, the blindfold's knot and tails in the wind
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#141826'; g.beginPath(); g.moveTo(-330, 900); g.lineTo(-300, 330); g.quadraticCurveTo(-280, 190, -120, 150); g.lineTo(120, 150); g.quadraticCurveTo(280, 190, 300, 330); g.lineTo(330, 900); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(127,208,255,0.35)'; g.lineWidth = 8; g.beginPath(); g.moveTo(-300, 340); g.quadraticCurveTo(-280, 200, -120, 160); g.stroke();  // blue rim light
  g.fillStyle = '#E8B898'; g.fillRect(-44, 86, 88, 70); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 96, 5, 17, 27, 0, 0, 7); g.fill(); }
  g.fillStyle = '#1A1F33'; g.beginPath(); g.moveTo(-88, 184); g.quadraticCurveTo(-76, 124, -58, 100); g.quadraticCurveTo(0, 86, 58, 100); g.quadraticCurveTo(76, 124, 88, 184); g.closePath(); g.fill();  // the collar
  drawLocks(g, UP.map(([bx, by, tx, ty, wd, bend], i) => [bx * 1.04, by + 6, tx * 1.1 + (i % 2 ? -12 : 14), ty * 1.04 - 6, wd * 1.05, -bend]), HAIR_S, null);
  g.fillStyle = HAIR; g.beginPath(); g.ellipse(0, -14, 98, 116, 0, 0, 7); g.fill();
  drawLocks(g, UP, HAIR);
  g.fillStyle = BAND; g.beginPath(); g.moveTo(-102, -16); g.quadraticCurveTo(0, 0, 102, -16); g.lineTo(102, 40); g.quadraticCurveTo(0, 56, -102, 40); g.closePath(); g.fill();  // the blindfold round the back
  g.beginPath(); g.ellipse(0, 14, 22, 20, 0, 0, 7); g.fill();  // the knot
  for (const [k, ph] of [[1, 0], [0.8, 1.7]]) { const wv = Math.sin(t * 9 + ph) * 18; g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(110 * k, 30 + wv, 220 * k, 6 + wv * 1.6); g.lineTo(214 * k, 30 + wv * 1.6); g.quadraticCurveTo(100 * k, 50 + wv, 6, 26); g.closePath(); g.fill(); }
  g.restore();
}
function domainClash(g, t, u, hit) {
  const z = 1 + 0.07 * u, sh = Math.max(0, 1 - (t - hit) / 0.5) * (t >= hit ? 1 : 0);
  g.save(); g.translate(W / 2 + Math.sin(t * 61) * 10 * sh, H / 2 + Math.cos(t * 53) * 8 * sh); g.scale(z, z); g.translate(-W / 2, -H / 2);
  // the void: the blue texture, its bright core low and left
  g.fillStyle = '#04060F'; g.fillRect(-200, -200, W + 400, H + 400);
  g.drawImage(VOID_T, -900, 260, 2900, 1813);
  // the shrine's half: above the line
  g.save(); g.beginPath(); g.moveTo(-300, -300); g.lineTo(W + 300, -300); g.lineTo(W + 300, CLASH.b[1] + (W + 300 - CLASH.b[0]) * (CLASH.b[1] - CLASH.a[1]) / W); g.lineTo(-300, CLASH.a[1] - 300 * (CLASH.b[1] - CLASH.a[1]) / W); g.closePath(); g.clip();
  const sky = g.createLinearGradient(0, 0, 0, H * 0.8); sky.addColorStop(0, '#16020A'); sky.addColorStop(0.5, '#5A0710'); sky.addColorStop(1, '#C8202A'); g.fillStyle = sky; g.fillRect(-300, -300, W + 600, H + 600);
  const r0 = rng(21);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {  // red flame streaks blowing toward the line
    const x0 = r0() * W * 1.3, y0 = r0() * H * 0.6 - 100, L = 120 + r0() * 380, a = 2.0 + r0() * 0.4, f = 0.5 + 0.5 * Math.sin(t * (6 + r0() * 8) + i);
    g.strokeStyle = rgba(r0() < 0.3 ? '#FFB0A0' : '#FF3A2E', 0.15 + 0.35 * f); g.lineWidth = 3 + r0() * 9;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * L * 0.5 + 30, y0 + Math.sin(a) * L * 0.5, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
  drawChar(g, 'mag', { x: W * 0.7, y: 330, s: 0.52, e: { ...EXPR.smug, glow: 1 }, t });  // Magnus standing behind the ridge
  shrineSil(g, W * 0.7, 1010, 0.86);
  g.restore();
  // the clash: blue streaks from the lower left and red from the upper right meet on the line, white sparks along it
  const nx = -(CLASH.b[1] - CLASH.a[1]), ny = CLASH.b[0] - CLASH.a[0], nl = Math.hypot(nx, ny), Nx = nx / nl, Ny = ny / nl;  // the normal, pointing to the void
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  const r1 = rng(9);
  for (let i = 0; i < 90; i++) {
    const v = r1(), px = lerp(CLASH.a[0], CLASH.b[0], v), py = lerp(CLASH.a[1], CLASH.b[1], v), blue = i % 2 === 0, d = blue ? 1 : -1;
    const L = 80 + r1() * 260, jit = (r1() - 0.5) * 0.6, f = 0.5 + 0.5 * Math.sin(t * (10 + r1() * 10) + i * 1.7);
    const ex = px + (Nx * d + jit * Ny) * L, ey = py + (Ny * d - jit * Nx) * L;
    g.strokeStyle = rgba(blue ? (r1() < 0.4 ? '#FFFFFF' : '#7FD0FF') : (r1() < 0.4 ? '#FFD0C8' : '#FF4A3D'), 0.25 + 0.5 * f); g.lineWidth = 2 + r1() * 7;
    g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke();
  }
  g.shadowColor = '#FFFFFF'; g.shadowBlur = 40; g.strokeStyle = '#FFFFFF'; g.lineWidth = 10 + 6 * Math.sin(t * 30);
  g.beginPath(); for (let i = 0; i <= 24; i++) { const v = i / 24, j = (Math.sin(i * 7.3 + t * 25) * 0.5) * 26; g.lineTo(lerp(CLASH.a[0], CLASH.b[0], v) + Nx * j, lerp(CLASH.a[1], CLASH.b[1], v) + Ny * j); } g.stroke();
  g.restore();
  gojoBack(g, W * 0.3, 1060 - 30 * u, 1.05, t);  // Witty from behind, lower left, looking up at the shrine
  g.restore();
  if (t >= hit) flashTint(g, '#FFFFFF', 0.6 * (1 - seg(t, hit, hit + 0.4)));
  lowKey(g, { cy: H * 0.5, a: 0.18 });
}

// Sukuna's cuts: thin bright lines slicing across the frame, red glow, fading
function slashes(g, t, t0, { n = 3, seed = 7, life = 0.55 } = {}) {
  const u = (t - t0) / life; if (u < 0 || u > 1) return;
  const r = rng(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = -0.5 + r() * 1.0 + (i % 2 ? 0.25 : -0.25), cy = H * (0.3 + 0.4 * r()), d = W * 1.4;
    const x0 = W / 2 - Math.cos(a) * d / 2, y0 = cy - Math.sin(a) * d / 2, x1 = W / 2 + Math.cos(a) * d / 2, y1 = cy + Math.sin(a) * d / 2;
    const p = clamp(u * 4 - i * 0.35), f = 1 - clamp((u - 0.45) / 0.55);
    if (p <= 0 || f <= 0) continue;
    g.globalAlpha = f; g.shadowColor = CURSE; g.shadowBlur = 30;
    g.strokeStyle = CURSE; g.lineWidth = 16; g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, p), lerp(y0, y1, p)); g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#FFFFFF'; g.lineWidth = 5; g.stroke();
  }
  g.restore();
}

// ---------- titles for the bright room (rule 50: over a light background, an ink edge or a dark plate; the engine's
// cream titles are made for dark sets and vanish on this wall) ----------
// a name: Cinzel in cream on a flat ink plate with a hard shadow (a sticker, rule 50), the sub-line on its own plate
function titleDay(g, lt, name, sub, { y = 220, size = 80, color = VOID, t0 = 0 } = {}) {
  const u = ease.out(clamp((lt - t0) / 0.3)); if (u <= 0) return;
  g.save(); g.globalAlpha *= u; g.translate(W / 2, y + (1 - u) * 16); g.rotate(-0.014);
  g.font = `700 ${size}px Cinzel`; g.letterSpacing = '3px'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const tw = g.measureText(name).width - 3, pw = tw + size * 0.9, ph = size * 1.28;
  g.fillStyle = 'rgba(8,6,4,0.55)'; g.fillRect(-pw / 2 + 7, -ph * 0.72 + 9, pw, ph);
  g.fillStyle = '#16161E'; g.fillRect(-pw / 2, -ph * 0.72, pw, ph);
  g.fillStyle = CREAM; g.fillText(name, 1.5, size * 0.06);
  g.restore();
  qaRect(g, W / 2 - pw / 2, y - ph * 0.72, pw, ph, 'text', 'name: ' + name);
  if (sub && lt >= t0 + 0.14) plate(g, sub, W / 2, y + ph * 0.28 + 44, { color, size: 32, rot: -0.012, ...popIn(lt, t0 + 0.14) });
}
// the score: two names on ink plates over two big numbers, the label on a strip (the engine's score() has cream names)
function scoreDay(g, left, right, l, r, { y = 270, lc = CURSE, rc = VOID, label = null, a = 1, dx = 190, size = 150 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  for (const [name, v, x, c] of [[left, l, W / 2 - dx, lc], [right, r, W / 2 + dx, rc]]) {
    plate(g, name, x, y - size * 0.62, { color: '#16161E', ink: c, size: 34, rot: 0 });
    g.font = sans(size, 900); g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#14141C'; g.lineWidth = size * 0.14;
    g.strokeText(v, x, y + size * 0.42 + 6); g.strokeText(v, x, y + size * 0.42); g.fillStyle = c; g.fillText(v, x, y + size * 0.42);
  }
  g.fillStyle = '#14141C'; g.fillRect(W / 2 - 14, y + size * 0.1, 28, 8);
  g.restore();
  qaRect(g, W / 2 - dx - 110, y - size * 0.3, 2 * dx + 220, size * 0.8, 'text', 'score');
  if (label) plate(g, label, W / 2, y + size * 0.42 + 62, { color: CREAM, size: 30, rot: -0.01, a });
}
// pieces right at the lens are left out (they were smears a third of the frame wide): gone nearer than d0, whole from d1
const nearFade = (pieces, d0 = 3.4, d1 = 4.4) => pieces.map(p => { const d = depth(p.x, 0.6, p.z), a = clamp((d - d0) / (d1 - d0)); return a >= 1 ? p : { ...p, alpha: (p.alpha ?? 1) * a }; }).filter(p => (p.alpha ?? 1) > 0.02);
// the engine's eval bar as a big meter (the "bar flips" beat) or as the small one beside the board
function evalHud(g, v, { a = 1, x = 40, y = 800, w = 46, h = 400, label = true, big = false } = {}) {
  if (a <= 0) return;
  const share = clamp(0.5 + Math.atan(v / 2.6) / Math.PI, 0.04, 0.96), yy = y + h * (1 - share);
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#08080C'; g.fillRect(x + 6, y + 6, w, h);
  g.fillStyle = '#26262E'; g.fillRect(x, y, w, h); g.fillStyle = '#F4F1EA'; g.fillRect(x, yy, w, y + h - yy);
  g.fillStyle = big ? '#E8413A' : 'rgba(255,255,255,0.4)'; g.fillRect(x - 8, y + h / 2 - 2, w + 16, 4);
  if (label) {
    const fs = big ? 76 : 46, txt = (v > 0.04 ? '+' : v < -0.04 ? '−' : '') + Math.abs(v).toFixed(1), col = v > 0.04 ? LIME : v < -0.04 ? RED : CREAM;
    g.font = sans(fs, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; const tw = g.measureText(txt).width + fs * 0.65, th = fs * 1.3;
    const lx = big ? x - 6 : x + w + 14, ty = big ? y - th / 2 - 18 : clamp(yy, y + th / 2, y + h - th / 2);  // the big bar: its number over its top
    g.fillStyle = '#08080C'; g.fillRect(lx + 5, ty - th / 2 + 5, tw, th); g.fillStyle = '#16161E'; g.fillRect(lx, ty - th / 2, tw, th);
    g.fillStyle = col; g.fillText(txt, lx + fs * 0.32, ty + 2);
    qaRect(g, Math.min(x, lx), Math.min(y, ty - th / 2), Math.max(w, tw) + 14, h + (big ? th + 18 : 0), 'text', 'eval');
  }
  g.restore();
}
// a bookcase against the left wall and a framed print on the right one: what the side views of the board look onto
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

// ======================= THE FILM (version 5) =======================
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const PI = Math.PI, lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
  const landCue = (t, cap = false, g = 0.7) => cue(t - MOVE_HIT, cap ? 'move_capture' : 'move', g);
  // a run of moves of the game, each landing at its time, sliding d before it
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
  const tvOf = (r, d) => (r.m && slide(r.lt, d) < 0.6 ? r.k - 1 : r.k);
  const spaced = (a, b, n) => [...Array(n)].map((_, i) => lerp(a, b, n === 1 ? 1 : i / (n - 1)));
  const clockAt = (k, run = 0, o = {}) => ({ names: ['WITTY', 'MAGNUS'], cols: [VOID, CURSE], l: CLKS[k][0], r: CLKS[k][1], run, ...o });
  const at3 = (sq, y = 0.6) => { const [x, z] = sqXZ(sq); return [x, y, z]; };
  // Witty's face in the look: the blindfold over his eyes (band 1) or off (0), the blue glow; Magnus's: the red glow
  const WE = (base, o = {}) => ({ ...EXPR[base], band: 0, glow: 0, ...o });
  const ME = (base, o = {}) => ({ ...EXPR[base], glow: 0, ...o });
  const WILD = { ...EXPR.happy, lid: 0.02, open: 1, curve: 1, brow: -0.2, browY: -14, nod: 0.9, blush: 0.7 };  // eyes wide open (rule 51)
  const GLAD = { ...EXPR.happy, lid: 0.08, open: 0.5 };
  // the standing view of the board with the monitor behind it: plates over the window, the monitor, the board, and the
  // captions on its nearest ranks
  const ARENA = (yaw = 0.04, d = 15, o = {}) => K(yaw, 0.36, d, [4, 1.6, 6.6], { cy: 890, ...o });

  // the cuts, in order (a shot runs to the next one)
  const beatH = w('hook', 1), carlT = w('hook', 3), thenA = w('hook', 4) - 0.06, roundT = w('hook', 8);
  const nahA = s('meme') - 0.06, nahT = w('meme', 0), winT = w('meme', 1);
  const nameA = s('name') - 0.06, sepA = w('name', 2) - 0.06, beatT = w('name', 5), wildA = w('name', 9) - 0.06, wildT = w('name', 11);
  const remA = s('rematch') - 0.06, roundA = w('rematch', 3) - 0.06, round2T = w('rematch', 3), blitzT = w('rematch', 6);
  const openA = s('gambit') - 0.06, sixT = w('gambit', 3), throwA = w('gambit', 4) - 0.06, knightT = w('gambit', 7), magT = w('gambit', 9);
  const LAND = magT + 0.62;  // the knight lands in the silence after "Magnus."
  const hisA = w('gambit', 10) - 0.06, weaponT = w('gambit', 12), titleA = w('gambit', 13) - 0.06, gambT = w('gambit', 14);
  const takeA = s('take') - 0.06, takesT = w('take', 1), kingA = w('take', 3) - 0.06, kingT = w('take', 5), engA = w('take', 6) - 0.06, losingT = w('take', 11);
  const flipA = s('flip') - 0.06, slipsT = w('flip', 2), barA = w('flip', 3) - 0.06, flipsT = w('flip', 5), betterA = w('flip', 6) - 0.06, betterT = w('flip', 8);
  const m21A = s('miss') - 0.06, m21T = w('miss', 1), engMA = w('miss', 2) - 0.06, e6T = w('miss', 6), playsA = w('miss', 7) - 0.06, e2T = w('miss', 10);
  const lateA = s('late') - 0.06, re6T = w('late', 6), tooA = w('late', 7) - 0.06, tooT = w('late', 7), lateT = w('late', 8);
  const endA = s('endgame') - 0.06, twT = w('endgame', 2), pawnsA = w('endgame', 5) - 0.06, pawnsT = w('endgame', 10);
  const q1A = s('queens') - 0.06, q1T = w('queens', 1), wtA = w('queens', 2) - 0.06, wtT = w('queens', 3), q2A = w('queens', 5) - 0.06, q2T = w('queens', 6);
  const andA = s('and') - 0.06, CUT = T.e('and') + 0.1, lostT = w('resign', 0), lostW = w('resign', 1);
  const humA = s('mirror') - 0.06, humT = w('mirror', 1), butA = w('mirror', 5) - 0.06, goatT = w('mirror', 8), twiceT = w('mirror', 10);
  const scoreA = s('score') - 0.06, fourT = w('score', 4), forA = w('score', 7) - 0.06;
  const proudA = s('proud') - 0.06, strongT = w('proud', 4);
  const ctaA = s('cta') - 0.06, movesT = w('cta', 3), lastT = w('cta', 6);

  // ======================= HOOK (rules 1, 28, 42, 57): the stream, both faces big; then Magnus across the board =======================
  const VS = [K(0.0, 0.17, 13.1, [4, 3.2, 9.6]), K(0.0, 0.15, 12.5, [4, 3.25, 9.7])];  // the whole monitor stays in the frame (kb 0 on these shots)
  const start = piecesAt(PL, 0);
  const vsCams = (t, sad = 0) => ({ wit: { e: WE('smug') }, mag: { e: sad ? { ...EXPR.sad, look: [-0.5, 0.3] } : ME('focus') } });
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, VS[0]], [len(sh), VS[1]]], { t, e: lin, bump: t > carlT && t < carlT + 0.3 ? 1 : 0 });
    online(g, t, { pieces: start, cams: vsCams(t, t >= beatH + 0.15) });
  }, { kb: 0, hud: (g, lt, t) => {
    coverTitle(g, 'WITTY vs MAGNUS', 'ROUND 2', 205);
    if (t >= carlT) { const p = B.project(CAMPOS.mag[0], CAMPOS.mag[1] - 1.0, CAMPOS.mag[2]); stamp(g, 'RESIGNED', p.x, p.y, t, carlT, { color: RED, size: 74, rot: -0.14, sub: 'SEPT 30' }); }
  } });
  shot(thenA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.24, 0.05, 9.8, [4, 3.0, 9.3])], [len(sh), K(0.12, 0.04, 8.0, [4, 3.05, 9.3])]], { t, e: glide, bump: t > roundT && t < roundT + 0.3 ? 1 : 0 });
    domain(g, t, { pieces: nearFade(start), wPlayer: false, wChair: false, eb: ME('smug') });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= roundT) badge(g, 'ROUND 2', W / 2, 230, { color: GOLD, size: 76, ...pop(t, roundT) }); } });
  cue(0, 'whoosh_soft', 0.25); cue(0.05, 'shimmer', 0.3); cue(beatH, 'hit', 0.4); cue(carlT, 'stamp', 0.5);
  cue(thenA - 0.04, 'whoosh_fast', 0.3); cue(roundT - 0.004, 'boom_big', 0.55); cue(roundT + 0.02, 'reveal_bell', 0.3);

  // ======================= "NAH, I'D WIN": the blindfold comes off, blue eyes (the edit-bait) =======================
  shot(nahA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.08, 0.04, 6.8, [4, 3.25, -1.4])], [len(sh), K(PI + 0.02, 0.03, 5.3, [4, 3.3, -1.4])]], { t, e: lin, bump: t > winT && t < winT + 0.3 ? 1.4 : 0 });
    const up = ease.inOut(seg(t, winT - 0.05, winT + 0.28));
    domain(g, t, { pieces: nearFade(start), white: 'wit', dark: true, bPlayer: false, bChair: false, ew: WE('smug', { band: 1 - up, glow: up }) });
    const p = B.project(4, 3.1, -1.4);
    flashTint(g, VOID, 0.55 * (1 - seg(lt, 0.0, 0.3)));  // the turn into the look: a blue flash on the cut
    if (t >= winT) { flashTint(g, VOID, 0.45 * (1 - seg(t, winT, winT + 0.45))); shockwave(g, p.x, p.y - p.s * 0.1, t, winT, { r0: 60, r1: 700, color: '#BFEAFF', lw: 12 }); speedLines(g, p.x, p.y, t, winT, { life: 0.6 }); }
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < winT) speech(g, 'WITTY, PROBABLY', 'Nah,', W / 2, 250, { ...pop(t, nahT) });
    else speech(g, 'WITTY, PROBABLY', "Nah, I'd win.", W / 2, 250, { ...pop(t, winT) });
  } });
  cue(nahA, 'whoosh_deep', 0.3); cue(nahT, 'pluck', 0.4); cue(winT - 0.3, 'revswell', 0.5); cue(winT - 0.004, 'boom_big', 0.75); cue(winT + 0.02, 'shimmer', 0.45);

  // ======================= WITTY ALIEN; SEPTEMBER: he beat Magnus, went wild on stream =======================
  shot(nameA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.5, 0.08, 8.6, [4, 3.2, -1.4])], [len(sh), K(PI - 0.36, 0.06, 7.2, [4, 3.25, -1.4])]], { t, e: glide });
    domain(g, t, { pieces: nearFade(start), bPlayer: false, bChair: false, ew: { ...EXPR.smug, lid: 0.3 } });
  }, { trans: 'whip', hud: (g, lt, t) => titleDay(g, lt, 'Witty Alien', 'HE BEAT MAGNUS IN SEPTEMBER', { y: 215, size: 84, color: VOID, t0: 0.05 }) });
  cue(nameA - 0.04, 'whoosh_fast', 0.3); cue(nameA + 0.1, 'ting', 0.3);
  const SEPT = piecesAt(CW, CW.length - 1);
  shot(sepA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(0.34, 15.4)], [len(sh), ARENA(0.2, 14.2)]], { t, e: glide });
    online(g, t, { pieces: SEPT, cams: { wit: { e: t >= beatT ? GLAD : 'focus' }, mag: { e: t >= beatT ? 'sad' : 'focus' } } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t < beatT) plate(g, 'SEPTEMBER 30 · BLITZ 5+0', W / 2, 230, { color: CREAM, size: 40, ...pop(t, sepA + 0.1) });
    else scoreDay(g, 'MAGNUS', 'WITTY', '0', '1', { y: 232, size: 128, a: seg(t, beatT, beatT + 0.08) });
  } });
  cue(sepA - 0.04, 'whoosh_deep', 0.3); cue(sepA + 0.1, 'clock_tick', 0.2); cue(beatT, 'stamp', 0.5); cue(beatT - 0.004, 'boom', 0.5);
  shot(wildA, (g, lt, t, sh) => {
    const c = CAMPOS.wit;
    rig(B, lt, [[0, K(-0.2, 0.04, 8.2, [c[0] + 0.5, c[1] + 0.1, c[2]])], [len(sh), K(-0.1, 0.03, 6.2, [c[0] + 0.4, c[1] + 0.15, c[2]])]], { t, bump: t > wildT && t < wildT + 0.3 ? 1.2 : 0 });
    online(g, t, { pieces: nearFade(SEPT, 4.6, 5.6), cams: { wit: { e: WILD, shake: t >= wildT ? 0.9 : 0.3 }, mag: { e: 'sad' } } });
    confetti(g, t, wildT);
  }, { trans: 'zoom', hud: (g, lt, t) => {
    if (t >= wildT) badge(g, 'LIVE ON STREAM', W / 2, 230, { color: RED, size: 56, ...pop(t, wildT) });
  } });
  cue(wildA - 0.04, 'whoosh_fast', 0.3); cue(wildT, 'cheer', 0.4); cue(wildT, 'confetti', 0.35);

  // ======================= FIVE WEEKS LATER: ROUND TWO, FIVE-MINUTE BLITZ =======================
  shot(remA, (g, lt, t, sh) => {
    const cc = [(CALP.x0 + CALP.x1) / 2, (CALP.y0 + CALP.y1) / 2, ROOM.z1];
    rig(B, lt, [[0, K(0.16, 0.04, 9.2, cc, { cy: 880 })], [len(sh), K(0.06, 0.03, 7.6, cc, { cy: 880 })]], { t, e: glide });
    domain(g, t, { pieces: start, wPlayer: false, bPlayer: false, cal: true, flip: seg(t, remA + 0.2, w('rematch', 2) + 0.15) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= w('rematch', 1)) counter(g, '5', 'WEEKS LATER', { y: 300, size: 170, color: GOLD, at: [t, w('rematch', 1)] }); } });
  cue(remA + 0.2, 'page_flip', 0.45);
  // ROUND TWO. FIVE-MINUTE BLITZ: the domain clash (the author's reference scene, in our own drawing)
  shot(roundA, (g, lt, t, sh) => {
    domainClash(g, t, seg(t, roundA, openA, lin), round2T);
  }, { trans: 'zoom', flat: true, hud: (g, lt, t) => {
    if (t >= round2T) badge(g, 'DOMAIN EXPANSION', 330, 190, { color: CREAM, size: 52, ...pop(t, round2T) });
    if (t >= blitzT - 0.1) badge(g, '5 + 0 BLITZ', 250, 290, { color: GOLD, size: 52, ...pop(t, blitzT - 0.1) });
  } });
  cue(remA - 0.04, 'whoosh_deep', 0.35); cue(remA + 0.1, 'riser', 0.3); cue(round2T - 0.3, 'revswell', 0.5); cue(round2T - 0.004, 'boom_big', 0.75); cue(round2T + 0.02, 'hit_punch', 0.45);
  cue(round2T + 0.05, 'shimmer', 0.4); cue(blitzT - 0.1, 'clock_press', 0.45);

  // ======================= MOVE SIX: THE KNIGHT ON f7 (the main move: Hollow Purple, rule 32 / §8) =======================
  const OPEN = spaced(openA + 0.12, sixT - 0.02, 10);
  shot(openA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(0.06, 15.2)], [len(sh), ARENA(0.02, 14.2)]], { t, e: lin });
    const r = runTo(PL, 0, OPEN, t, 0.08), fx = moveFx(r, 0.08, 0.1);
    online(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, clock: clockAt(r.k), tv: tvOf(r, 0.08) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= sixT) counter(g, 'MOVE 6', null, { y: 300, size: 130, color: GOLD, at: [t, sixT] }); } });
  OPEN.forEach((a, i) => cue(a - 0.02, 'piece', i % 2 ? 0.16 : 0.22)); cue(sixT, 'hit', 0.5);
  const KN = at3('g5', 1.0), F7 = at3('f7', 1.0);
  shot(throwA, (g, lt, t, sh) => {
    // from above the kingside: the knight leaves the blue end of the frame for the red one
    rig(B, lt, [[0, K(-0.62, 0.62, 10.6, [5.3, 0.3, 5.3], { cy: 1000 })], [LAND - throwA, K(-0.5, 0.58, 9.2, [5.5, 0.3, 5.7], { cy: 1000 })], [len(sh), K(-0.42, 0.56, 8.6, [5.5, 0.3, 6.0], { cy: 1000 })]], { t, bump: t > LAND && t < LAND + 0.3 ? 1.6 : 0 });
    const r = runTo(PL, 10, [LAND], t, 0.32), landed = t >= LAND, dark = true;
    online(g, t, { pieces: nearFade(r.pieces), mon: false, dark, tv: null, camA: 0,
      under: g2 => { if (landed) { ledGlow(g2, B, 'f7', HOLLOW, t, LAND, { reach: 8 }); spread(g2, B, 'f7', t, LAND, HOLLOW); } else squareFrame(g2, B, 'f7', HOLLOW, 0.8 * seg(t, knightT, knightT + 0.2)); moveFx(r, 0.32, 0.6).under(g2); },
      over: g2 => {
        moveFx(r, 0.32, 0.6).over(g2);
        if (!landed) {  // the two orbs over the knight, closing in, then one purple orb riding with it
          const k = B.project(...KN), m = seg(t, knightT + 0.1, magT + 0.35, ease.inOut), rr = k.s * lerp(0.7, 1.0, m);
          if (m < 1) { orb(g2, k.x - k.s * lerp(1.3, 0, m), k.y - k.s * 0.25, rr, VOID, seg(t, knightT - 0.15, knightT + 0.1)); orb(g2, k.x + k.s * lerp(1.3, 0, m), k.y - k.s * 0.25, rr, CURSE, seg(t, knightT + 0.05, knightT + 0.3)); }
          const pa = seg(t, magT + 0.2, magT + 0.4); if (pa > 0) { const u = clamp((t - (LAND - 0.32)) / 0.32), q = B.project(lerp(KN[0], F7[0], u), 1.0, lerp(KN[2], F7[2], u)); orb(g2, q.x, q.y - q.s * 0.2, q.s * 1.3 * (1 + 0.08 * Math.sin(t * 30)), HOLLOW, pa); }
        } else { const q = B.project(...F7); speedLines(g2, q.x, q.y, t, LAND, { life: 0.7 }); shockwave(g2, q.x, q.y, t, LAND, { r0: 40, r1: 900, color: '#D8C0FF', lw: 14 }); }
      } });
    flashTint(g, HOLLOW, 0.4 * (1 - seg(lt, 0, 0.3)));
    if (landed) flashTint(g, HOLLOW, 0.55 * (1 - seg(t, LAND, LAND + 0.45)));
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= LAND + 0.05) moveTag(g, 'Nxf7!?', W / 2, 250, GOLD, 72, seg(t, LAND + 0.05, LAND + 0.15)); } });
  cue(throwA - 0.04, 'whoosh_soft', 0.3); cue(knightT, 'riser', 0.35); cue(LAND - 0.3, 'revswell', 0.6); boom(LAND, 1.0); landCue(LAND, true, 0.6);
  cue(LAND, 'hit_punch', 0.45); cue(LAND + 0.02, 'glass', 0.3); cue(LAND + 0.05, 'shimmer', 0.4);
  shot(hisA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.45, 0.06, 7.6, [4, 3.15, -1.4])], [len(sh), K(PI + 0.3, 0.05, 6.4, [4, 3.2, -1.4])]], { t, e: glide });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 11)), bPlayer: false, bChair: false, ew: { ...EXPR.smug, lid: 0.3 } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= weaponT) badge(g, 'HIS OWN WEAPON', W / 2, 230, { color: VOID, size: 60, ...pop(t, weaponT) }); } });
  shot(titleA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(0.34, 14.8)], [len(sh), ARENA(0.2, 13.8)]], { t, e: glide });
    const pcs = piecesAt(PL, 11).map(p => p.sq === 'f7' ? { ...p, halo: HOLLOW, haloA: 0.9 } : p);
    online(g, t, { pieces: pcs, tv: 11, under: g2 => ledGlow(g2, B, 'f7', HOLLOW, t, titleA, { reach: 2.5, a: 0.6 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= gambT - 0.1) titleDay(g, t - gambT + 0.1, 'The Alien Gambit', '5.Ng5 h6 6.Nxf7!?', { y: 215, size: 74, color: HOLLOW }); } });
  cue(hisA - 0.04, 'whoosh_fast', 0.3); cue(weaponT, 'sparkle_pop', 0.3); cue(titleA - 0.04, 'whoosh_fast', 0.3); cue(gambT, 'reveal_bell', 0.4);

  // ======================= MAGNUS TAKES IT. WITH HIS KING. THE ENGINE: −2 =======================
  const KXF7 = takesT + 0.12;
  shot(takeA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.18, 0.2, 10.8, [4, 2.2, 8.0])], [len(sh), K(0.08, 0.18, 9.2, [4, 2.3, 8.1])]], { t, e: glide });
    const r = runTo(PL, 11, [KXF7], t, 0.26), fx = moveFx(r, 0.26, 0.6);
    domain(g, t, { pieces: nearFade(r.pieces), under: fx.under, over: fx.over, wPlayer: false, wChair: false, eb: ME('smug'), bReach: { sq: 'f7', u: (t - KXF7 + 0.45) / 0.8 } });
  }, { trans: 'whip' });
  cue(takeA - 0.04, 'whoosh_fast', 0.3); landCue(KXF7, true, 0.75); cue(KXF7 + 0.02, 'glass', 0.35);
  shot(kingA, (g, lt, t, sh) => {
    // the king on f7 from Magnus's side, Witty behind it
    rig(B, lt, [[0, K(PI + 0.34, 0.3, 7.6, [5.3, 1.3, 4.6], { cy: 830 })], [len(sh), K(PI + 0.22, 0.28, 6.4, [5.3, 1.35, 4.6], { cy: 830 })]], { t, e: glide });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 12), 4.9, 5.3), bPlayer: false, bChair: false, ew: { ...EXPR.focus, look: [0.2, 0.5] }, under: g2 => pieceRing(g2, B, 'f7', RED, seg(t, kingT - 0.15, kingT + 0.1)) });
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= kingT) badge(g, 'THE KING TOOK IT', 420, 230, { color: RED, size: 52, ...pop(t, kingT) }); } });
  cue(kingA - 0.04, 'whoosh_soft', 0.3); cue(kingT, 'dun_dun', 0.4);
  shot(engA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(-0.3, 15.4)], [len(sh), ARENA(-0.18, 14.2)]], { t, e: glide });
    online(g, t, { pieces: piecesAt(PL, 12), cams: { wit: { e: t >= losingT ? { ...EXPR.worried, lid: 0.02 } : 'focus' }, mag: { e: ME('smug') } }, clock: clockAt(12) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, lerp(0.3, -2.0, ease.out(seg(t, engA + 0.3, losingT + 0.2))), { a: seg(lt, 0, 0.2) }); if (t >= losingT) badge(g, 'STOCKFISH: −2.0', W / 2, 230, { color: RED, size: 60, ...pop(t, losingT) }); } });
  cue(engA - 0.04, 'whoosh_fast', 0.3); cue(losingT, 'error', 0.35);

  // ======================= BUT MAGNUS SLIPS (17...Bg6): THE BAR FLIPS, WITTY IS BETTER =======================
  const BG6 = slipsT + 0.08, slipA = BG6 - 0.34, FF = spaced(flipA + 0.08, slipA - 0.06, 21), g6 = at3('g6', 0.3);
  shot(flipA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(0.06, 15.2)], [len(sh), ARENA(0.02, 14.4)]], { t, e: lin });
    const r = runTo(PL, 12, FF, t, 0.03), fx = moveFx(r, 0.03, 0.05);
    online(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, clock: clockAt(r.k), tv: tvOf(r, 0.03) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, -1.0); counter(g, 'MOVE ' + Math.min(17, 7 + Math.floor(10 * seg(t, flipA + 0.08, slipA - 0.06, lin))), null, { y: 300, size: 120, color: GOLD }); } });
  shot(slipA, (g, lt, t, sh) => {
    // 17...Bg6 from behind Black's pieces: Witty's window beyond the board
    rig(B, lt, [[0, K(PI - 0.36, 0.4, 9.0, [g6[0] - 0.5, 0.5, g6[2] - 1.0], { cy: 940 })], [len(sh), K(PI - 0.26, 0.38, 8.0, [g6[0] - 0.5, 0.5, g6[2] - 1.0], { cy: 940 })]], { t, e: lin, bump: t > BG6 && t < BG6 + 0.3 ? 1 : 0 });
    const r = runTo(PL, 33, [BG6], t, 0.3), fx = moveFx(r, 0.3, 0.8);
    online(g, t, { pieces: nearFade(r.pieces, 3.2, 4.0), mon: false, under: fx.under, over: fx.over });
    if (t >= BG6) flashTint(g, RED, 0.25 * (1 - seg(t, BG6, BG6 + 0.35)));
  }, { trans: 'cut', hud: (g, lt, t) => { evalHud(g, -1.0); if (t >= BG6) badge(g, 'MOVE 17: A SLIP', W / 2, 230, { color: RED, size: 60, ...pop(t, BG6) }); } });
  FF.forEach((a, i) => { if (i % 3 === 0) cue(a, 'piece', 0.12); }); cue(flipA, 'whoosh_fast', 0.25); cue(slipA - 0.03, 'whoosh_soft', 0.3); landCue(BG6, false, 0.6); cue(BG6, 'sting', 0.35);
  shot(barA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.22, 0.2, 12.4, [3.2, 2.8, 9.4])], [len(sh), K(-0.14, 0.18, 11.2, [3.2, 2.9, 9.5])]], { t, e: glide, bump: t > flipsT && t < flipsT + 0.3 ? 1 : 0 });
    online(g, t, { pieces: nearFade(piecesAt(PL, 34), 4, 5), cams: { wit: { e: t >= flipsT ? GLAD : 'focus' }, mag: { e: t >= flipsT ? { ...EXPR.worried, lid: 0.05 } : ME('focus') } } });
    if (t >= flipsT) flashTint(g, LIME, 0.2 * (1 - seg(t, flipsT, flipsT + 0.4)));
  }, { trans: 'zoom', hud: (g, lt, t) => {
    const v = lerp(-1.0, 0.9, ease.inOut(seg(t, flipsT - 0.15, flipsT + 0.25)));
    evalHud(g, v, { x: 56, y: 520, w: 84, h: 660, big: true });
    if (t >= flipsT) badge(g, 'THE BAR FLIPS', W / 2 + 60, 230, { color: LIME, size: 60, ...pop(t, flipsT) });
  } });
  cue(barA - 0.04, 'whoosh_soft', 0.3); cue(flipsT - 0.15, 'swipe_card', 0.4); cue(flipsT, 'reveal_bell', 0.45); cue(flipsT + 0.02, 'boom', 0.45);
  shot(betterA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.14, 0.06, 8.2, [4, 3.1, -1.4])], [len(sh), K(PI - 0.04, 0.04, 6.6, [4, 3.15, -1.4])]], { t, e: glide });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 34)), bPlayer: false, bChair: false, ew: GLAD });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= betterT) counter(g, '+0.9', 'WITTY IS BETTER', { y: 300, size: 140, color: LIME, at: [t, betterT] }); } });
  cue(betterA - 0.04, 'whoosh_fast', 0.3); cue(betterT, 'success', 0.35);

  // ======================= MOVE 21: THE ENGINE'S MOVE IS ROOK e6; HE PLAYS ROOK e2 =======================
  const M21 = spaced(m21A + 0.1, m21T + 0.15, 6);
  shot(m21A, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(-0.3, 15.2)], [len(sh), ARENA(-0.22, 14.2)]], { t, e: lin });
    const r = runTo(PL, 34, M21, t, 0.08), fx = moveFx(r, 0.08, 0.1);
    online(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, tv: tvOf(r, 0.08), clock: clockAt(r.k) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, 1.0); if (t >= m21T) counter(g, 'MOVE 21', null, { y: 300, size: 130, color: GOLD, at: [t, m21T] }); } });
  M21.forEach(a => cue(a - 0.02, 'piece', 0.16)); cue(m21T, 'hit', 0.45);
  const ghost = (g2, t, a) => {  // the engine's move as a ghost: an arrow e1–e6 and a pale rook on e6
    if (a <= 0) return;
    boardArrow(g2, B, 'e1', 'e6', 0.9 * a, seg(t, engMA + 0.25, engMA + 0.75));
    squareFrame(g2, B, 'e6', LIME, 0.9 * a);
    const [x, z] = sqXZ('e6'); if (depth(x, 0, z) > 0.8) { const q = B.project(x, 0, z); drawPiece(g2, 'r', 'w', q.x, q.y - q.s * 0.56, q.s * 1.25, { alpha: 0.45 * a * seg(t, e6T - 0.2, e6T) }); }
  };
  // the e-file from the kingside (the left wall and its bookcase behind): the ghost of rook e6, then the rook going to e2
  const EK = [K(1.0, 0.5, 12.4, [4.7, 0.2, 3.4], { cy: 940 }), K(0.9, 0.5, 11.4, [4.7, 0.2, 3.4], { cy: 940 }), K(0.84, 0.5, 10.6, [4.7, 0.2, 3.0], { cy: 940 })];
  shot(engMA, (g, lt, t, sh) => {
    rig(B, lt, [[0, EK[0]], [len(sh), EK[1]]], { t, e: lin });
    online(g, t, { pieces: nearFade(piecesAt(PL, 40)), mon: false, over: g2 => ghost(g2, t, 1) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, 1.0); if (t >= e6T) badge(g, 'ENGINE: ROOK e6  +1.3', W / 2, 230, { color: LIME, size: 52, ...pop(t, e6T) }); } });
  cue(engMA - 0.04, 'whoosh_soft', 0.3); cue(engMA + 0.3, 'pen', 0.3); cue(e6T, 'sparkle_pop', 0.35);
  const RE2 = e2T + 0.06;
  shot(playsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, EK[1]], [len(sh), EK[2]]], { t, e: lin });
    const r = runTo(PL, 40, [RE2], t, 0.26), fx = moveFx(r, 0.26, 0.8);
    online(g, t, { pieces: nearFade(r.pieces), mon: false, under: fx.under, over: g2 => { ghost(g2, t, 1 - seg(t, RE2, RE2 + 0.4)); fx.over(g2); } });
  }, { trans: 'cut', hud: (g, lt, t) => { evalHud(g, lerp(1.0, -0.2, ease.inOut(seg(t, RE2, RE2 + 0.5)))); if (t >= RE2 + 0.1) badge(g, 'HE PLAYS ROOK e2', W / 2, 230, { color: RED, size: 52, ...pop(t, RE2 + 0.1) }); } });
  landCue(RE2, false, 0.6); cue(RE2 + 0.05, 'error', 0.35);
  const LT = spaced(lateA + 0.1, w('late', 3), 3), RE6 = re6T + 0.06;
  shot(lateA, (g, lt, t, sh) => {
    // Witty's own hand puts the rook on e6: seen from Magnus's side of the table, Witty's face over the board
    rig(B, lt, [[0, K(PI + 0.2, 0.3, 10.4, [4, 2.0, 1.2])], [len(sh), K(PI + 0.08, 0.27, 9.0, [4, 2.1, 1.0])]], { t, e: glide });
    const r = runTo(PL, 41, [...LT, RE6], t, t < RE6 - 0.3 ? 0.1 : 0.26), fx = moveFx(r, r.k === 45 ? 0.26 : 0.1, r.k === 45 ? 0.8 : 0.1, r.k === 45);
    domain(g, t, { pieces: nearFade(r.pieces, 3.0, 4.0), under: fx.under, over: fx.over, bPlayer: false, bChair: false, ew: { ...EXPR.focus },
      wReach: t > RE6 - 0.55 && t < RE6 + 0.45 ? { sq: 'e6', u: (t - RE6 + 0.55) / 1.0 } : null });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, -0.1); if (t >= w('late', 0)) counter(g, 'MOVE 23', null, { y: 300, size: 120, color: GOLD, at: [t, w('late', 0)] }); } });
  LT.forEach(a => cue(a - 0.02, 'piece', 0.18)); landCue(RE6, false, 0.6); cue(RE6, 'ting', 0.3);
  const NXD5 = tooT + 0.08;
  shot(tooA, (g, lt, t, sh) => {
    const d5 = at3('d5', 0.4);  // the knight takes on d5, from the queenside (the right wall and its sideboard behind)
    rig(B, lt, [[0, K(-0.95, 0.46, 10.6, [d5[0] - 0.2, 0.3, d5[2] - 0.2], { cy: 940 })], [len(sh), K(-0.84, 0.44, 9.4, [d5[0] - 0.2, 0.3, d5[2] - 0.2], { cy: 940 })]], { t, e: lin, bump: t > NXD5 && t < NXD5 + 0.3 ? 1.2 : 0 });
    const r = runTo(PL, 45, [NXD5], t, 0.22), fx = moveFx(r, 0.22, 0.8);
    online(g, t, { pieces: nearFade(r.pieces), mon: false, under: fx.under, over: fx.over });
    slashes(g, t, NXD5, { n: 1, seed: 3, life: 0.4 });
  }, { trans: 'zoom', hud: (g, lt, t) => { evalHud(g, -0.1); if (t >= lateT) stamp(g, 'TOO LATE', W / 2 - 40, 290, t, lateT, { color: RED, size: 110 }); } });
  landCue(NXD5, true, 0.7); cue(NXD5, 'whoosh_fast', 0.35); cue(lateT, 'stamp', 0.5); cue(lateT - 0.004, 'boom', 0.45);

  // ======================= THE ENDGAME: TWENTY SECONDS EACH; MAGNUS WALKS HIS PAWNS =======================
  shot(endA, (g, lt, t, sh) => {
    // the clock, close and low; the board and the monitor behind it
    rig(B, lt, [[0, K(0.62, 0.12, 5.0, [9.5, 0.3, 3.3], { cy: 1040 })], [len(sh), K(0.5, 0.1, 4.2, [9.6, 0.3, 3.3], { cy: 1040 })]], { t, shake: 1.4 });
    const run = Math.floor((t - endA) / 0.5) % 2 ? 2 : 1, d = (t - endA) * 0.5;
    online(g, t, { pieces: piecesAt(PL, 72), mon: false, clock: { ...clockAt(72), l: 21 - (run === 1 ? d : 0) - 0.4, r: 21.2 - (run === 2 ? d : 0), run } });
    flashTint(g, RED, 0.08 * (0.5 + 0.5 * Math.sin(t * 9)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= twT) badge(g, '20 SECONDS EACH', W / 2, 230, { color: RED, size: 64, ...pop(t, twT) }); } });
  cue(endA - 0.04, 'whoosh_fast', 0.3); cue(endA + 0.05, 'heartbeat', 0.45); cue(twT, 'clock_press', 0.4); cue(twT + 0.5, 'clock_press', 0.4); cue(twT + 1.0, 'clock_press', 0.4);
  const PW = spaced(pawnsA + 0.12, q1A - 0.1, 25);  // plies 73..97
  shot(pawnsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, ARENA(0.3, 15)], [len(sh), ARENA(0.16, 13.6)]], { t, e: lin });
    const r = runTo(PL, 72, PW, t, 0.07), fx = moveFx(r, 0.07, 0.12);
    online(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, clock: clockAt(r.k), tv: tvOf(r, 0.07) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= pawnsT) badge(g, 'PAWNS MARCHING', W / 2, 230, { color: RED, size: 56, ...pop(t, pawnsT) }); } });
  PW.forEach((a, i) => cue(a - 0.02, 'piece', 0.12 + (i % 2) * 0.05));

  // ======================= A QUEEN. WITTY TAKES IT. ANOTHER QUEEN (Sukuna's cuts) =======================
  const Q1 = q1T + 0.1, KD1 = wtT + 0.06, Q2 = q2T + 0.06, PRE = [q2A + 0.1, q2A + 0.28], TAIL = spaced(Q2 + 0.5, andA - 0.1, 5);
  // the first rank from the kingside (the left wall behind): d1, then a1
  const QK = [K(-0.9, 0.48, 10.4, [3.2, 0.3, 1.5], { cy: 940 }), K(-0.8, 0.46, 9.2, [3.2, 0.3, 1.4], { cy: 940 }), K(-0.74, 0.46, 8.6, [3.2, 0.3, 1.4], { cy: 940 })];
  shot(q1A, (g, lt, t, sh) => {
    rig(B, lt, [[0, QK[0]], [len(sh), QK[1]]], { t, e: lin, bump: t > Q1 && t < Q1 + 0.3 ? 1.2 : 0 });
    const r = runTo(PL, 97, [Q1], t, 0.24), fx = moveFx(r, 0.24, 0.8);
    online(g, t, { pieces: nearFade(r.pieces), mon: false, under: g2 => { fx.under(g2); if (t >= Q1) ledGlow(g2, B, 'd1', RED, t, Q1, { reach: 3 }); }, over: fx.over });
    if (t >= Q1) flashTint(g, RED, 0.3 * (1 - seg(t, Q1, Q1 + 0.4)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= Q1) badge(g, 'A QUEEN', 300, 230, { color: RED, size: 68, ...pop(t, Q1) }); } });
  boom(Q1, 0.7); landCue(Q1, false, 0.6); cue(Q1, 'shimmer', 0.3);
  shot(wtA, (g, lt, t, sh) => {
    rig(B, lt, [[0, QK[1]], [len(sh), QK[2]]], { t, e: lin });
    const r = runTo(PL, 98, [KD1], t, 0.22), fx = moveFx(r, 0.22, 0.6);
    online(g, t, { pieces: nearFade(r.pieces), mon: false, under: fx.under, over: fx.over });
  }, { trans: 'cut', hud: (g, lt, t) => { if (t >= KD1) badge(g, 'TAKEN', 300, 230, { color: VOID, size: 64, ...pop(t, KD1) }); } });
  landCue(KD1, true, 0.7); cue(KD1, 'glass', 0.35);
  shot(q2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.44, 16.6, [3.4, 0.8, 5.0], { cy: 1230 })], [Q2 - q2A, K(0.14, 0.44, 15.6, [3.4, 0.8, 5.0], { cy: 1230 })], [len(sh), K(0.1, 0.44, 15.0, [3.4, 0.8, 5.0], { cy: 1230 })]], { t, bump: t > Q2 && t < Q2 + 0.3 ? 1.6 : 0 });
    const r = runTo(PL, 99, [...PRE, Q2, ...TAIL], t, t < Q2 - 0.3 ? 0.1 : t < Q2 + 0.4 ? 0.22 : 0.08), fx = moveFx(r, 0.1, 0.4), dark = t >= Q2 - 0.05;
    online(g, t, { pieces: r.pieces, dark, cams: { wit: { e: { ...EXPR.shock, lid: 0 } }, mag: { e: ME(t >= Q2 ? 'smug' : 'focus', { glow: t >= Q2 ? 1 : 0.3 }), anime: dark } }, clock: clockAt(r.k),
      under: g2 => { fx.under(g2); if (t >= Q2) ledGlow(g2, B, 'a1', RED, t, Q2, { reach: 8 }); }, over: fx.over });
    if (t >= Q2) { flashTint(g, CURSE, 0.45 * (1 - seg(t, Q2, Q2 + 0.45))); slashes(g, t, Q2, { n: 3, seed: 7, life: 0.6 }); }
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= Q2) badge(g, 'ANOTHER QUEEN', W / 2, 230, { color: RED, size: 68, ...pop(t, Q2) }); } });
  PRE.forEach(a => cue(a - 0.02, 'piece', 0.2)); cue(Q2 - 0.3, 'revswell', 0.55); boom(Q2, 0.95); cue(Q2, 'whoosh_fast', 0.5); cue(Q2 + 0.08, 'whoosh_fast', 0.4); cue(Q2 + 0.16, 'hit_punch', 0.4);
  TAIL.forEach(a => cue(a - 0.02, 'piece', 0.14));

  // ======================= AND... "WITTY WON." — THE CUT — WITTY LOST (version 5, the author: «типо witty won, потом
  // разрез со звуковым эффектом по центру кадра, и сначала вблизи витти лежит, потом камера отдаляется медленно, и
  // голос, witty lost...»; he is not shown cut: «мне не нужно прям показывать его разрезанным»). "And...": Witty in the
  // look, beaming, the bubble "WITTY WON.". Then a slash through the middle of the frame with its sound: the picture
  // freezes, flips to its negative for three frames and goes black, the white line thinning out. Out of the black, close
  // on his face: he lies in the crater, eyes shut; the camera, hand-held, pulls slowly away; the voice: "Witty lost." =======================
  const wonDraw = (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.1, 0.05, 7.4, [4, 3.2, -1.4])], [len(sh), K(PI + 0.03, 0.04, 5.9, [4, 3.25, -1.4])]], { t, e: lin });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 99)), white: 'wit', dark: true, bPlayer: false, bChair: false, ew: WE('triumph', { glow: 0.9, lid: 0.12 }) });
  };
  const wonB = (g, t) => bubble(g, 'WITTY WON.', W / 2, 300, { size: 88, tail: -1, a: seg(t, andA + 0.05, andA + 0.15), ...pop(t, andA + 0.05) });
  shot(andA, wonDraw, { trans: 'whip', hud: (g, lt, t) => wonB(g, t) });
  let FZ = null;  // the last frame of "WITTY WON.", bubble and all, under the slash
  const frozen = () => {
    if (FZ) return FZ;
    const c = makeCanvas(W, H), g2 = c.getContext('2d'), sh = { a: andA, b: CUT };
    wonDraw(g2, CUT - 0.001 - andA, CUT - 0.001, sh); wonB(g2, CUT - 0.001);
    CAM.px = 0; FZ = c; return c;
  };
  const SL = { a: [-60, H * 0.5 + 118], b: [W + 60, H * 0.5 - 118] };  // the slash: through the middle of the frame, rising to the right
  const slashLine = (g, u, k = 1, lw = 1) => {  // drawn from the left to u of its length
    const x1 = lerp(SL.a[0], SL.b[0], u), y1 = lerp(SL.a[1], SL.b[1], u);
    g.save(); g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
    for (const [wd, col, al] of [[150 * lw, CURSE, 0.16], [64 * lw, '#FF8A80', 0.3], [26 * lw, '#FFFFFF', 0.65], [9 * lw, '#FFFFFF', 1]]) { g.strokeStyle = rgba(col, al * k); g.lineWidth = wd; g.beginPath(); g.moveTo(...SL.a); g.lineTo(x1, y1); g.stroke(); }
    g.restore();
  };
  const T_NEG = 0.06, T_BLK = 0.17, T_IN = 0.5, T_UP = 0.95, HOLD = 1.25;  // after the cut: the negative, the black, the fade-in, the hold on his face
  const lieCam = t => {  // the zoom falls in equal ratios; his head keeps a straight path on the screen (it never leaves the frame)
    const u = ease.inOut(seg(t, CUT + HOLD, butA + 0.2)), d = seg(t, CUT + T_IN, CUT + HOLD + 0.2, lin);
    const z = Math.exp(lerp(Math.log(1.3 - 0.05 * d), Math.log(0.56), u)), cy = lerp(H * 0.42, H * 0.45, u), hx = lerp(575, 876, u), hy = lerp(745, 629, u);
    return { z, lx: (W / 2 - hx) / z, ly: (cy - hy) / z, rot: lerp(-0.07, 0, u), cx: W / 2, cy };
  };
  const DUST = (() => { const r = rng(91), d = []; for (let i = 0; i < 70; i++) d.push([r() * W, r() * H, 1.5 + r() * 4.5, 12 + r() * 40, r() * 7, 0.15 + r() * 0.4]); return d; })();
  shot(CUT, (g, lt, t) => {
    if (lt < T_BLK) {  // the slash over the frozen frame, then its negative
      const fz = frozen();
      g.save(); if (lt >= T_NEG) g.filter = 'grayscale(1) contrast(2.6) invert(1)'; g.drawImage(fz, 0, 0, W, H); g.restore();
      slashLine(g, clamp(lt / 0.05), 1, lt >= T_NEG ? 1.5 : 1);
      if (lt < 0.05) flashTint(g, '#FFFFFF', 0.25);
      return;
    }
    g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
    if (lt >= T_IN) {  // he lies there: the hand-held camera, the beam, the dust, the dark edges
      const a = seg(lt, T_IN, T_UP), hit = 1 - seg(lt, T_IN, T_IN + 0.9), c = lieCam(t);
      const sx = Math.sin(t * 2.1) * 6 + Math.sin(t * 13.7) * (2 + 9 * hit), sy = Math.cos(t * 1.7) * 5 + Math.cos(t * 11.3) * (2 + 7 * hit);
      g.save(); g.globalAlpha = a;
      g.save(); g.translate(sx, sy); lying(g, t, { ...c, rot: c.rot + Math.sin(t * 1.3) * 0.006 }); g.restore();
      g.save(); g.globalCompositeOperation = 'screen';  // a pale beam from the upper right, slowly breathing
      const bm = g.createLinearGradient(W * 0.9, 0, W * 0.35, H * 0.75); bm.addColorStop(0, `rgba(255,255,255,${(0.3 + 0.06 * Math.sin(t * 1.4)).toFixed(3)})`); bm.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = bm; g.beginPath(); g.moveTo(W * 0.62, -40); g.lineTo(W * 1.1, -40); g.lineTo(W * 0.62, H * 0.9); g.lineTo(W * 0.18, H * 0.7); g.closePath(); g.fill(); g.restore();
      g.fillStyle = '#2A2A2A';  // dust settling through the light
      for (const [x0, y0, r, v, ph, al] of DUST) { const y = (y0 + v * (t - CUT)) % H, x = x0 + Math.sin(t * 0.7 + ph) * 18; g.globalAlpha = a * al * (0.6 + 0.4 * Math.sin(t * 2 + ph)); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.globalAlpha = a;
      const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.45, H * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);  // the heavy dark edges, on top of the engine's own vignette
      g.restore();
    }
    if (lt < T_IN + 0.1) slashLine(g, 1, 1 - seg(lt, T_BLK, T_IN + 0.1), lerp(1, 0.25, seg(lt, T_BLK, T_IN)));  // the line left on the black, thinning out
  }, { trans: 'cut', grade: 'bw', vig: 0.8, kb: 0, post: (g, lt, t) => {  // after the black-and-white grade: the plates keep their colour
    if (t >= lostW + 0.25 && t < humT - 0.1) badge(g, 'RESIGNED · 6 SECONDS LEFT', W / 2, 230, { color: '#16161E', size: 44, ...pop(t, lostW + 0.25) });
    if (t >= humT - 0.1) badge(g, 'THE ALIEN CAN BEAT HUMANS', W / 2, 230, { color: VOID, size: 48, ...pop(t, humT - 0.1) });
  } });
  cue(andA - 0.04, 'whoosh_deep', 0.3); cue(andA + 0.06, 'success', 0.4); cue(CUT - 0.34, 'revswell', 0.6);
  cue(CUT - 0.03, 'slash', 1.0); cue(CUT + T_NEG, 'boom_big', 0.8); cue(CUT + T_IN + 0.1, 'heartbeat', 0.5); cue(lostW + 0.25, 'thud', 0.3); cue(humT - 0.1, 'sparkle_pop', 0.2);
  // BUT NOT THE GOAT. NOT TWICE: Magnus himself across the board, the day room back in colour
  shot(butA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.24, 0.05, 9.6, [4, 3.0, 9.3])], [len(sh), K(-0.12, 0.04, 7.8, [4, 3.05, 9.3])]], { t, e: glide, bump: t > goatT && t < goatT + 0.3 ? 1.2 : 0 });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 107)), wPlayer: false, wChair: false, eb: { ...EXPR.smug, lid: 0.3 } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= goatT - 0.05) badge(g, 'BUT NOT THE GOAT', W / 2, 230, { color: GOLD, size: 66, ...pop(t, goatT - 0.05) });
    if (t >= twiceT) badge(g, 'NOT TWICE', W / 2, 345, { color: RED, size: 56, ...pop(t, twiceT) });
  } });
  cue(butA - 0.04, 'whoosh_fast', 0.35); cue(goatT - 0.05, 'boom', 0.5); cue(goatT, 'reveal_bell', 0.35); cue(twiceT, 'stamp', 0.45);

  // ======================= 4–1 FOR MAGNUS; STAND PROUD =======================
  shot(scoreA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.2, 10.6, [4, 0.7, 3.6], { cy: 1100 })], [len(sh), K(0.0, 0.18, 9.8, [4, 0.7, 3.6], { cy: 1100 })]], { t, e: glide });
    domain(g, t, { pieces: [], wPlayer: false, bPlayer: false, wChair: false, bChair: false, over: g2 => cards(g2, t, scoreA + 0.1) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= fourT - 0.1) scoreDay(g, 'MAGNUS', 'WITTY', '4', '1', { y: 260, label: 'ALL THEIR GAMES ON CHESS.COM', a: seg(t, fourT - 0.1, fourT + 0.05) }); } });
  for (let i = 0; i < 5; i++) cue(scoreA + 0.1 + i * 0.16, 'swipe_card', 0.25); cue(fourT, 'boom', 0.45);
  shot(forA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.14, 0.05, 9, [4, 3.1, 9.3])], [len(sh), K(0.08, 0.04, 7.6, [4, 3.15, 9.3])]], { t, e: lin });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 107)), black: 'mag', dark: true, wPlayer: false, wChair: false, eb: ME('smug', { glow: 1 }) });
    flashTint(g, CURSE, 0.5 * (1 - seg(lt, 0, 0.3)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= forA + 0.12) badge(g, 'THE KING OF CURSES', W / 2, 230, { color: CURSE, size: 60, ...pop(t, forA + 0.12) }); } });
  cue(forA - 0.04, 'whoosh_fast', 0.3); cue(forA + 0.1, 'dun_dun', 0.35);
  shot(proudA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.6, 0.08, 9.6, [4, 3.2, -1.4])], [len(sh), K(PI - 0.42, 0.06, 7.8, [4, 3.25, -1.4])]], { t, e: glide });
    domain(g, t, { pieces: nearFade(piecesAt(PL, 107)), white: 'wit', dark: true, bPlayer: false, bChair: false, ew: exprAt([[proudA, WE('sad', { band: 1, look: [0, 0.5] })], [strongT - 0.1, WE('neutral', { band: 1, curve: 0.45 })]], t) });
  }, { trans: 'fade', transDur: 0.3, hud: (g, lt, t) => {
    if (t >= proudA + 0.15) badge(g, 'STAND PROUD', W / 2, 230, { color: GOLD, size: 60, ...pop(t, proudA + 0.15) });
    if (t >= strongT) badge(g, "YOU'RE STRONG", W / 2, 340, { color: CREAM, size: 48, ...pop(t, strongT) });
  } });
  cue(proudA + 0.05, 'shimmer', 0.25); cue(strongT, 'sparkle_pop', 0.25);

  // ======================= THE SPONSOR, AT THE END (rule 61): this game on Chessigma's review; free; their end card =======================
  const ad1A = s('ad1') - 0.06, gradedT = w('ad1', 6), thisT = w('ad1', 8);
  const ad2A = s('ad2') - 0.06, freeT = w('ad2', 4), unlT = w('ad2', 6), CLOSE = w('ad2', 7) - 0.05, linkT = w('ad2', 15);
  const TVC = [MON.c[0] + 0.83, MON.c[1], MON.c[2]];  // the middle of the board and the coach's panel of the page
  const TVK = [ARENA(0.0, 15), K(0.0, 0.02, 10.5, TVC, { cy: H * 0.42 })];  // 10.2 away the frame holds both whole
  shot(ad1A, (g, lt, t, sh) => {
    rig(B, lt, [[0, TVK[0]], [Math.min(1.0, len(sh)), TVK[1], ease.inOut], [len(sh), K(0.0, 0.02, 10.3, TVC, { cy: H * 0.42 })]], { t });
    const k = t < gradedT ? 11 : t < thisT ? 34 : 102;
    online(g, t, { pieces: nearFade(piecesAt(PL, k), 3.4, 4.6), tv: k });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => adTag(g) });
  shot(ad2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.02, 10.3, TVC, { cy: H * 0.42 })], [len(sh), K(0.0, 0.02, 10.1, TVC, { cy: H * 0.42 })]], { t, e: lin });
    online(g, t, { pieces: nearFade(piecesAt(PL, 102), 3.4, 4.6), tv: 102 });
  }, { trans: 'cut', kb: 0, hud: (g, lt, t) => {
    adTag(g);
    if (t >= freeT - 0.03) badge(g, 'FREE', 250, 262, { color: LIME, size: 58, ...pop(t, freeT - 0.03) });
    if (t >= unlT - 0.03) badge(g, 'UNLIMITED GAME REVIEWS', 700, 262, { color: CREAM, size: 30, ...pop(t, unlT - 0.03) });
  } });
  // their 3-second end card as it is (logo, 2M+ players, the store badges): flat, no captions over it
  shot(CLOSE, (g, lt) => { g.drawImage(recFrame('closer', lt), 0, 0, W, H); },
    { flat: true, noCaptions: true, hud: (g, lt, t) => { adTag(g); if (t >= linkT - 0.05) badge(g, 'LINK IN BIO', W / 2, 1462, { color: GOLD, size: 50, ...pop(t, linkT - 0.05) }); } });
  cue(ad1A - 0.04, 'whoosh_deep', 0.35); cue(gradedT, 'swipe_card', 0.35); cue(thisT, 'swipe_card', 0.35); cue(thisT + 0.1, 'reveal_bell', 0.3);
  cue(freeT - 0.03, 'success', 0.4); cue(unlT, 'sparkle_pop', 0.3); cue(CLOSE, 'whoosh_soft', 0.3); cue(CLOSE + 0.2, 'reveal_bell', 0.35); cue(linkT, 'sparkle_pop', 0.3);

  // ======================= CTA: back to the hook (rule 10) =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, VS[1]], [len(sh), VS[0]]], { t, e: lin });
    online(g, t, { pieces: start, cams: vsCams(t) });
  }, { trans: 'whip', kb: 0, hud: (g, lt, t) => {
    badge(g, 'HOW MANY MOVES WOULD YOU LAST?', W / 2, 220, { color: GOLD, size: 46, ...pop(t, ctaA + 0.1) });
    badge(g, 'COMMENT A NUMBER', W / 2, 322, { color: VOID, size: 48, a: seg(t, movesT, movesT + 0.1), ...pop(t, movesT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 38, a: seg(t, lastT, lastT + 0.1) });
  } });
  cue(ctaA - 0.04, 'whoosh_fast', 0.3); cue(ctaA + 0.05, 'shimmer', 0.3); cue(movesT, 'sparkle_pop', 0.3); cue(lastT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: winT, m: 'slam' }, { t: nameA, m: 'digital' }, { t: remA, m: 'tension' }, { t: round2T, m: 'slam' }, { t: openA, m: 'build' },
    { t: LAND, m: 'slam' }, { t: hisA + 0.6, m: 'glory' }, { t: takeA, m: 'intrigue' }, { t: flipA, m: 'build' }, { t: flipsT, m: 'victory' },
    { t: m21A, m: 'tension' }, { t: NXD5, m: 'drop' }, { t: endA, m: 'clockwork' }, { t: q1A, m: 'build' }, { t: Q2, m: 'slam' },
    { t: andA, m: 'victory' }, { t: CUT, m: 'void' }, { t: lostT - 0.2, m: 'elegy' }, { t: butA, m: 'hit' }, { t: scoreA, m: 'elegy' }, { t: ad1A, m: 'digital' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: winT - 0.32, t1: winT - 0.01, kind: 'mute' }, { t0: round2T - 0.3, t1: round2T - 0.01, kind: 'mute' }, { t0: round2T, t1: openA, kind: 'boost', db: 4 }, { t0: winT, t1: nameA, kind: 'boost', db: 4 },
    { t0: LAND - 0.34, t1: LAND - 0.01, kind: 'mute' }, { t0: LAND, t1: hisA + 0.6, kind: 'boost', db: 5 },
    { t0: Q2 - 0.32, t1: Q2 - 0.01, kind: 'mute' }, { t0: Q2, t1: andA, kind: 'boost', db: 4 },
    { t0: CUT - 0.06, t1: lostT - 0.2, kind: 'mute' }, { t0: lostT - 0.2, t1: butA, kind: 'lp', f: 700 },
    { t0: proudA, t1: ad1A, kind: 'lp', f: 900 }, { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
