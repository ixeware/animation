// Witty Alien vs Magnus Carlsen, round two (Chess.com, 7 November 2026, 5+0 blitz, unrated). Five weeks after his blitz
// win over Carlsen, Witty played him again and threw his own Alien Gambit at him: 6.Nxf7 Kxf7. The engine said −2; then
// Magnus slipped (17...Bg6, +0.9 for Witty); Witty missed 21.Re6 (+1.3), played 21.Re2 and found Re6 two moves later,
// too late (23...Nxd5). Twenty seconds each in the endgame, Magnus walked his pawns, made two queens, and Witty resigned
// with six seconds left. On Chess.com it is 4–1 for Magnus. Sources: SOURCES.md.
// The author's brief (rules 61, 62): Witty is Gojo and Magnus is Sukuna (Jujutsu Kaisen), as nods in our own style only:
// white hair standing up and a black band over Witty's eyes, blue light and blue eyes; two marks under each of Magnus's
// eyes, red eyes, red light. The set is a "domain" (this video's palette, rule 48): the board on a black lacquer table
// between a blue starry void behind Witty and a red shrine behind Magnus. Memes as plates: "WITTY, PROBABLY:" over a
// manga bubble "NAH, I'D WIN.", and a bubble "WITTY WON." crossed out. No sponsor in this one (rule 61).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { badge, nameTitle, placeStamp, stamp, counter, score, vsLabel, sans, mono, popIn } from '../../engine/js/hud.js';
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

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

const B = new Board();
// ---------- the palette of this video (rule 48): the two domains ----------
const VOID = '#4FC3FF', VOIDD = '#0B1B4A', HOLLOW = '#A86BFF', CURSE = '#E3262F', CURSED = '#3A0508', INK = '#07070C';
const GOLD = '#F5C451', RED = '#E8413A', LIME = HI.good, CREAM = '#FFF3E0', BONE = '#F4EEE4';
const LEVY_C = VOID, FAN_C = CURSE;  // the names the shared table code below uses for its default colours
// the board: Chess.com green on a black lacquer slab (the slab, its sides and the engraving stay, rule 46)
const GREEN = { light: '#EEEED2', dark: '#769656', frame: '#15151C', side: '#0B0B10', th: 0.45, rc: 0.35 };
const LACQUER = ['#1C1C26', '#0D0D14', '#15151E'];
// the real game (SOURCES.md): Witty_Alien (White) – MagnusCarlsen, 7 Nov 2026; and their first blitz game, 30 Sep 2026
const PL = await fetch('../engine/data/witty_magnus_2026-11-07.json').then(r => r.json());
const CW = await fetch('../engine/data/carlsen_witty_2026.json').then(r => r.json());

// ---------- the cast: Witty with Gojo's white hair standing up and his black band, Magnus with Sukuna's marks ----------
// hairFx 'back' / 'front' (head units: the face is 100·fw wide and 125·fh tall from its centre)
function gojoHair(g, phase, { fw }) {
  const w = 100 * fw, h = 125 * 1.07;
  if (phase === 'back') { g.fillStyle = '#DCE4EE'; g.beginPath(); g.ellipse(0, -46, w * 1.1, h * 0.9, 0, 0, 7); g.fill(); return; }
  const n = 9, a0 = Math.PI + 0.42, a1 = 2 * Math.PI - 0.42, p = new Path2D(), tips = [];
  const at = (a, rx, ry) => [Math.cos(a) * rx, Math.sin(a) * ry - 18];
  p.moveTo(...at(a0, w * 1.04, h));
  for (let i = 0; i < n; i++) {
    const am = lerp(a0, a1, (i + 0.5) / n), ae = lerp(a0, a1, (i + 1) / n), k = 1.5 + 0.16 * Math.sin(i * 2.3 + 1);
    const tip = at(am + 0.06 * Math.sin(i * 1.7), w * 1.04 * k * 0.9, h * k); tips.push(tip);
    p.lineTo(...tip); p.lineTo(...at(ae, w * 1.04, h));
  }
  // down the temple, then the hairline across the forehead (the hair is pushed up by the band)
  p.lineTo(w * 0.86, -h * 0.42); p.quadraticCurveTo(w * 0.5, -h * 0.58, w * 0.22, -h * 0.5); p.lineTo(w * 0.08, -h * 0.62);
  p.lineTo(-w * 0.1, -h * 0.5); p.quadraticCurveTo(-w * 0.5, -h * 0.6, -w * 0.86, -h * 0.42); p.closePath();
  g.fillStyle = '#F3F6FA'; g.fill(p);
  g.save(); g.clip(p);
  const gr = g.createLinearGradient(0, -h * 1.7, 0, -h * 0.4); gr.addColorStop(0, 'rgba(160,190,230,0)'); gr.addColorStop(1, 'rgba(120,150,200,0.35)');
  g.fillStyle = gr; g.fillRect(-w * 2, -h * 2, w * 4, h * 2);
  g.strokeStyle = 'rgba(150,175,215,0.7)'; g.lineWidth = 4; g.lineCap = 'round';
  for (const [x, y] of tips) { g.beginPath(); g.moveTo(x * 0.3, -h * 0.66); g.quadraticCurveTo(x * 0.62, (y - h * 0.6) * 0.5, x * 0.86, y * 0.9); g.stroke(); }
  g.restore();
}
// faceFx: 'eyes' (before the eyes are drawn), 'mouth' (after the mouth), 'top' (over the hair)
function gojoFace(g, phase, { e }) {
  if (phase === 'eyes' && e.glow > 0) halo(g, e.glow, VOID);
  if (phase === 'top' && (e.band ?? 0) > 0) {  // the black band over the eyes; pushed up (band 0) it is gone in the hair
    const b = e.band, dy = (1 - b) * -96;
    g.save(); g.globalAlpha *= clamp(b * 3); g.translate(0, dy);
    g.fillStyle = '#121218'; g.beginPath(); g.moveTo(-100, -64); g.quadraticCurveTo(0, -78, 100, -64); g.lineTo(100, 30); g.quadraticCurveTo(0, 18, -100, 30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 3; for (const y of [-40, -6]) { g.beginPath(); g.moveTo(-96, y); g.quadraticCurveTo(0, y - 12, 96, y); g.stroke(); }
    g.restore();
  }
}
function sukunaFace(g, phase, { e }) {
  if (phase === 'eyes' && e.glow > 0) halo(g, e.glow, CURSE);
  if (phase === 'mouth') {  // two marks under each eye and one on each cheekbone
    g.save(); g.strokeStyle = '#1A0E14'; g.lineCap = 'round';
    for (const sd of [-1, 1]) {
      g.lineWidth = 6.5; g.beginPath(); g.moveTo(sd * 20, 21); g.quadraticCurveTo(sd * 40, 26, sd * 60, 17); g.stroke();
      g.lineWidth = 5.5; g.beginPath(); g.moveTo(sd * 24, 33); g.quadraticCurveTo(sd * 42, 37, sd * 57, 30); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(sd * 70, 4); g.lineTo(sd * 76, 30); g.stroke();
    }
    g.restore();
  }
}
// the glow behind both eyes (drawn before them)
function halo(g, a, col) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (const sd of [-1, 1]) { const gr = g.createRadialGradient(sd * 38, -2, 4, sd * 38, -2, 70); gr.addColorStop(0, rgba(col, 0.95 * a)); gr.addColorStop(0.4, rgba(col, 0.45 * a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(sd * 38 - 70, -72, 140, 140); }
  g.restore();
}
CAST.wit = { face: [0.92, 1.07, 0.84], hair: 'messy', hairC: '#EEF2F8', brow: '#DCE3EC', suit: '#1A1D2B', suitD: '#10121C', shirt: 'hoodie', ears: 1.02, iris: '#59C8FF', hairFx: gojoHair, faceFx: gojoFace };
CAST.mag = { ...CAST.magnus, iris: '#C8283A', faceFx: sukunaFace };
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
// a small dark plate with a light word (WITTY, PROBABLY:)
function caption(g, text, x, y, { a = 1, size = 40, color = CREAM } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = '4px'; const tw = g.measureText(text).width + size * 1.1;
  g.fillStyle = '#08080C'; g.fillRect(x - tw / 2 + 6, y - size * 0.95 + 6, tw, size * 1.6); g.fillStyle = '#16161E'; g.fillRect(x - tw / 2, y - size * 0.95, tw, size * 1.6);
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + 2, y - size * 0.15);
  g.restore(); qaRect(g, x - tw / 2, y - size * 0.95, tw, size * 1.6, 'text', text);
}
// the engine's bar beside the board, as on Chess.com: White's share from the bottom (Witty is White)
function evalHud(g, v, { a = 1, x = 40, y = 470, w = 46, h = 700, label = true } = {}) {
  if (a <= 0) return;
  const share = clamp(0.5 + Math.atan(v / 2.6) / Math.PI, 0.04, 0.96), yy = y + h * (1 - share);
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#08080C'; g.fillRect(x + 6, y + 6, w, h);
  g.fillStyle = '#26262E'; g.fillRect(x, y, w, h); g.fillStyle = '#F4F1EA'; g.fillRect(x, yy, w, y + h - yy);
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x - 8, y + h / 2 - 2, w + 16, 4);
  if (label) {
    const txt = (v > 0.04 ? '+' : v < -0.04 ? '−' : '') + Math.abs(v).toFixed(1), col = v > 0.04 ? LIME : v < -0.04 ? RED : CREAM;
    g.font = sans(46, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; const tw = g.measureText(txt).width + 30, ty = clamp(yy, y + 30, y + h - 30);
    g.fillStyle = '#08080C'; g.fillRect(x + w + 14 + 5, ty - 30 + 5, tw, 60); g.fillStyle = '#16161E'; g.fillRect(x + w + 14, ty - 30, tw, 60);
    g.fillStyle = col; g.fillText(txt, x + w + 29, ty + 2);
    qaRect(g, x, y, w + 14 + tw, h, 'text', 'eval');
  }
  g.restore();
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
const TABLE = ['#C99A68', '#8A6440', '#A87E52'], CHAIR = '#24242E';
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

// ======================= THE DOMAIN (this video's set) =======================
// the board on a black lacquer table (x 0..8, z 0..8); Witty (White) at z −1.4, Magnus (Black) at z 9.3. Behind
// Witty, at z −26, a blue starry void; behind Magnus, at z 34, a red sky over a black shrine; side walls blend the two
const DOM = { x0: -36, x1: 44, z0: -26, z1: 34, top: 46 };
const VOID_T = tex(1600, 1000, (x, w, h) => {
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
const SHRINE_T = tex(1600, 1000, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#120208'); gr.addColorStop(0.55, '#4A060E'); gr.addColorStop(0.82, '#C01822'); gr.addColorStop(0.9, '#5A0810'); gr.addColorStop(1, '#160205');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const mg = x.createRadialGradient(w / 2, h * 0.36, 10, w / 2, h * 0.36, 260); mg.addColorStop(0, 'rgba(255,90,80,0.55)'); mg.addColorStop(1, 'rgba(255,40,40,0)');
  x.fillStyle = mg; x.fillRect(0, 0, w, h);
  x.fillStyle = '#0A0204';  // the shrine: a platform, pillars, two curved roofs, a ridge ornament; the open hall glows
  x.fillRect(330, 830, 940, 70); x.fillRect(380, 800, 840, 40);
  for (const px of [455, 610, 960, 1115]) x.fillRect(px, 590, 36, 220);
  x.fillStyle = '#5A0A10'; x.fillRect(660, 610, 280, 190);
  const hg = x.createLinearGradient(0, 610, 0, 800); hg.addColorStop(0, 'rgba(255,70,60,0.0)'); hg.addColorStop(1, 'rgba(255,70,60,0.55)'); x.fillStyle = hg; x.fillRect(660, 610, 280, 190);
  x.fillStyle = '#0A0204';
  const roof = (cx, y, hw, rise, th) => { x.beginPath(); x.moveTo(cx - hw, y); x.quadraticCurveTo(cx - hw * 0.55, y - rise * 0.15, cx, y - rise); x.quadraticCurveTo(cx + hw * 0.55, y - rise * 0.15, cx + hw, y);
    x.lineTo(cx + hw - 40, y + th); x.quadraticCurveTo(cx + hw * 0.5, y - rise * 0.08 + th, cx, y - rise + th * 1.4); x.quadraticCurveTo(cx - hw * 0.5, y - rise * 0.08 + th, cx - hw + 40, y + th); x.closePath(); x.fill(); };
  roof(800, 610, 520, 150, 46); x.fillRect(560, 470, 480, 60); roof(800, 470, 360, 120, 40);
  x.fillRect(790, 300, 20, 60); x.beginPath(); x.arc(800, 296, 16, 0, 7); x.fill();
  x.strokeStyle = 'rgba(255,90,90,0.18)'; x.lineWidth = 3; const r = rng(8);
  for (let i = 0; i < 9; i++) { const sx = r() * w, sy = r() * h * 0.5; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + 220 + r() * 200, sy + 90 + r() * 80); x.stroke(); }
});
const SIDE_T = tex(1200, 600, (x, w, h) => {
  const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0C1E52'); gr.addColorStop(0.45, '#08070F'); gr.addColorStop(0.55, '#0E0509'); gr.addColorStop(1, '#4A060E');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  const vg = x.createLinearGradient(0, 0, 0, h); vg.addColorStop(0, 'rgba(0,0,0,0.6)'); vg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = vg; x.fillRect(0, 0, w, h);
  const r = rng(12); for (let i = 0; i < 260; i++) { const sx = r() * w * 0.42, sy = r() * h; x.fillStyle = `rgba(220,240,255,${(0.25 + 0.6 * r()).toFixed(2)})`; x.fillRect(sx, sy, 2, 2); }
});
function domainBack(g, t, { blue = 1, red = 1 } = {}) {
  const E = B.E, { x0, x1, z0, z1, top } = DOM;
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  if (E[2] < z1) texQuad(g, SHRINE_T, [x0, top, z1], [x1, top, z1], [x0, FLOOR_Y, z1], { a: red });
  if (E[2] > z0) texQuad(g, VOID_T, [x1, top, z0], [x0, top, z0], [x1, FLOOR_Y, z0], { a: blue });
  if (E[0] > x0) texQuad(g, SIDE_T, [x0, top, z0], [x0, top, z1], [x0, FLOOR_Y, z0]);
  if (E[0] < x1) texQuad(g, SIDE_T, [x1, top, z0], [x1, top, z1], [x1, FLOOR_Y, z0]);
  if (E[1] > FLOOR_Y) tiled(g, [x0, FLOOR_Y, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], { color: '#09090F', grout: 'rgba(140,160,220,0.06)', tu: 4, light: g2 => {
    pool(g2, B, 4, FLOOR_Y + 0.02, -6, 16, VOID, 0.16 * blue); pool(g2, B, 4, FLOOR_Y + 0.02, 15, 16, CURSE, 0.2 * red);
  } });
  // the two lights: a blue cone onto Witty's side, a red one onto Magnus's
  spotCone(g, B, { top: [4, 18, -6], base: [4, -0.35, 0.5], r0: 0.4, r1: 5.5, a: 0.08 * blue, dust: 16, t, seed: 4, color: '#9FDCFF' });
  spotCone(g, B, { top: [4, 18, 14], base: [4, -0.35, 7.5], r0: 0.4, r1: 5.5, a: 0.08 * red, dust: 16, t, seed: 9, color: '#FF7A70' });
}
// the players at the table. o: tableSet options (pieces, ew/eb expressions, reaches ...); glow under the heads
function domain(g, t, o = {}) {
  const { blue = 1, red = 1, ...tab } = o;
  domainBack(g, t, { blue, red });
  tableSet(g, t, { white: 'wit', black: 'mag', tableCol: LACQUER, behind: g2 => {
    for (const [z, col, a] of [[-1.4, VOID, 0.5 * blue], [9.3, CURSE, 0.55 * red]]) { if (depth(4, 3.2, z) < 0.8) continue; const p = B.project(4, 3.2, z); rim(g2, p.x, p.y, p.s * 3.4, col, a); }
  }, ...tab });
  lowKey(g, { cy: H * 0.45, a: 0.12 });
}
// the webcams on stands behind the board (the online game): Witty's in blue, Magnus's in red
const CAMC = { wit: makeCanvas(600, 720), mag: makeCanvas(600, 720) };
const CAMLOOK = { wit: { bg: ['#3A8FE0', '#0B1B4A'], name: 'WITTY_ALIEN', nameColor: VOID, glow: '#7FD0FF' }, mag: { bg: ['#C42A30', '#3A0508'], name: 'MAGNUSCARLSEN', nameColor: '#FF8A80', glow: '#FF6A60' } };
function camTex(who, e, t, { shake = 0, zoom = 1 } = {}) {
  const c = CAMC[who], x = c.getContext('2d'), L = CAMLOOK[who];
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 600, 720);
  webcam(x, 0, 0, 600, 720, who, e, t, { bg: L.bg, name: L.name, nameColor: L.nameColor, zoom: 1.05 * zoom, cy: 0.52, shake });
  return c;
}
const CAMPOS = { wit: [[1.2, 4.6, 11.4], 0.16], mag: [[6.8, 4.6, 11.4], -0.16] };
// the online game: no players at the table, their webcams behind it, the clock beside the board
function online(g, t, { pieces, under = null, over = null, cams = {}, clock = null, camA = 1, blue = 1, red = 1 } = {}) {
  domainBack(g, t, { blue, red });
  const back = () => { if (camA <= 0) return; for (const who of ['wit', 'mag']) { const [c, ry2] = CAMPOS[who], o = cams[who] || {}; camPanel(g, camTex(who, o.e || 'focus', t, o), c, 2.5, 3.0, ry2, { glow: CAMLOOK[who].glow, a: camA, frame: '#101018' }); } };
  if (B.E[2] < 11.4) back();
  tableSet(g, t, { pieces, under, over, clock, wPlayer: false, bPlayer: false, wChair: false, bChair: false, tableCol: LACQUER });
  if (B.E[2] >= 11.4) back();
  lowKey(g, { cy: H * 0.46, a: 0.16 });
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
  const PI = Math.PI, lin = x => x;
  const landCue = (t, cap = false, g = 0.7) => cue(t - MOVE_HIT, cap ? 'move_capture' : 'move', g);
  // a run of moves of the game, each landing at its time, sliding d before it
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
  const spaced = (a, b, n) => [...Array(n)].map((_, i) => lerp(a, b, n === 1 ? 1 : i / (n - 1)));
  const clockAt = (k, run = 0, o = {}) => ({ names: ['WITTY', 'MAGNUS'], cols: [VOID, CURSE], l: CLKS[k][0], r: CLKS[k][1], run, ...o });
  const at3 = (sq, y = 0.6) => { const [x, z] = sqXZ(sq); return [x, y, z]; };
  // Witty's face: the band over his eyes (1) or pushed up (0), the blue glow; Magnus's: the red glow
  const WE = (base, o = {}) => ({ ...EXPR[base], band: 0, glow: 0, ...o });
  const ME = (base, o = {}) => ({ ...EXPR[base], glow: 0, ...o });

  // the cuts, in order (a shot runs to the next one)
  const thenA = w('hook', 4) - 0.06, roundT = w('hook', 8);
  const nahT = w('meme', 0), winT = w('meme', 1);
  const nameA = s('name') - 0.06, sepA = w('name', 2) - 0.06, beatT = w('name', 5), wildA = w('name', 9) - 0.06, wildT = w('name', 11);
  const remA = s('rematch') - 0.06, roundA = w('rematch', 3) - 0.06, round2T = w('rematch', 3), blitzA = w('rematch', 5) - 0.06, blitzT = w('rematch', 6);
  const openA = s('gambit') - 0.06, sixT = w('gambit', 3), throwA = w('gambit', 4) - 0.06, knightT = w('gambit', 7), magT = w('gambit', 9);
  const LAND = magT + 0.62;  // the knight lands in the silence after "Magnus."
  const hisA = w('gambit', 10) - 0.06, weaponT = w('gambit', 12), titleA = w('gambit', 13) - 0.06, alienT = w('gambit', 14);
  const takeA = s('take') - 0.06, takesT = w('take', 1), kingA = w('take', 3) - 0.06, kingT = w('take', 5), engA = w('take', 6) - 0.06, losingT = w('take', 11);
  const flipA = s('flip') - 0.06, slipsT = w('flip', 2), barA = w('flip', 3) - 0.06, flipsT = w('flip', 5), betterA = w('flip', 6) - 0.06, betterT = w('flip', 8);
  const m21A = s('miss') - 0.06, m21T = w('miss', 1), engMA = w('miss', 2) - 0.06, e6T = w('miss', 6), playsA = w('miss', 7) - 0.06, e2T = w('miss', 10);
  const lateA = s('late') - 0.06, re6T = w('late', 6), tooA = w('late', 7) - 0.06, tooT = w('late', 7), lateT = w('late', 8);
  const endA = s('endgame') - 0.06, twT = w('endgame', 2), pawnsA = w('endgame', 5) - 0.06, pawnsT = w('endgame', 10);
  const q1A = s('queens') - 0.06, q1T = w('queens', 1), wtA = w('queens', 2) - 0.06, wtT = w('queens', 3), q2A = w('queens', 5) - 0.06, q2T = w('queens', 6);
  const resA = s('resign') - 0.06, resT = w('resign', 1), sixA = w('resign', 2) - 0.06, sixRT = w('resign', 3);
  const scoreA = s('score') - 0.06, fourT = w('score', 4), forA = w('score', 7) - 0.06;
  const proudA = s('proud') - 0.06, strongT = w('proud', 4);
  const ctaA = s('cta') - 0.06, movesT = w('cta', 3), lastT = w('cta', 6);

  // ======================= HOOK (rules 1, 28, 42): the domain, Witty vs Magnus; "round two" =======================
  const VS = [K(0.0, 0.1, 16.8, [4, 4.0, 11.4]), K(0.0, 0.08, 15.4, [4, 4.1, 11.4])];
  const start = piecesAt(PL, 0);
  const vsCams = (t, o = {}) => ({ wit: { e: WE('smug', { band: 1 }) }, mag: { e: ME('smug', { glow: 0.7 }) }, ...o });
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, VS[0]], [len(sh), VS[1]]], { t, e: lin });
    online(g, t, { pieces: start, cams: vsCams(t), clock: clockAt(0) });
  }, { hud: (g, lt, t) => coverTitle(g, 'WITTY vs MAGNUS', 'ROUND 2', 205) });
  shot(thenA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.05, 10, [4, 3.1, 9.3])], [len(sh), K(0.12, 0.04, 8.2, [4, 3.15, 9.3])]], { t, bump: t > roundT && t < roundT + 0.3 ? 1 : 0 });
    domain(g, t, { pieces: start, ew: WE('focus', { band: 1 }), eb: ME('smug', { glow: seg(t, roundT - 0.2, roundT + 0.2) }) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= roundT) badge(g, 'ROUND 2', W / 2, 230, { color: GOLD, size: 72, ...pop(t, roundT) }); } });
  cue(0, 'whoosh_soft', 0.25); cue(0.05, 'shimmer', 0.3); cue(w('hook', 1), 'hit', 0.4);
  cue(thenA - 0.04, 'whoosh_fast', 0.3); cue(roundT - 0.004, 'boom_big', 0.55); cue(roundT + 0.02, 'reveal_bell', 0.3);

  // ======================= "NAH, I'D WIN": the band goes up, blue eyes (the edit-bait) =======================
  shot(nahT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.08, 0.04, 6.6, [4, 3.0, -1.4])], [len(sh), K(PI + 0.02, 0.03, 5.0, [4, 3.05, -1.4])]], { t, e: lin, bump: t > winT && t < winT + 0.3 ? 1.4 : 0 });
    const up = ease.inOut(seg(t, winT - 0.05, winT + 0.28));
    domain(g, t, { pieces: start, ew: WE('smug', { band: 1 - up, glow: up }), eb: ME('focus'), red: 0.6 + 0.4 * (1 - up) });
    const p = B.project(4, 3.1, -1.4);
    if (t >= winT) { flashTint(g, VOID, 0.45 * (1 - seg(t, winT, winT + 0.45))); shockwave(g, p.x, p.y - p.s * 0.1, t, winT, { r0: 60, r1: 700, color: '#BFEAFF', lw: 12 }); speedLines(g, p.x, p.y, t, winT, { life: 0.6 }); }
  }, { trans: 'whip', hud: (g, lt, t) => {
    caption(g, 'WITTY, PROBABLY:', W / 2, 250, { a: seg(t, nahT - 0.05, nahT + 0.1), size: 38 });
    if (t < winT) bubble(g, 'NAH,', W / 2, 430, { size: 76, tail: 1, ...pop(t, nahT) });
    else bubble(g, "NAH, I'D WIN.", W / 2, 430, { size: 76, tail: 1, ...pop(t, winT) });
  } });
  cue(nahT - 0.06, 'whoosh_deep', 0.3); cue(nahT, 'pluck', 0.4); cue(winT - 0.3, 'revswell', 0.5); cue(winT - 0.004, 'boom_big', 0.75); cue(winT + 0.02, 'shimmer', 0.45);

  // ======================= WITTY ALIEN; SEPTEMBER: he beat Magnus, went wild on stream =======================
  shot(nameA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.55, 0.08, 8.6, [4, 3.2, -1.4])], [len(sh), K(PI - 0.42, 0.06, 7.4, [4, 3.25, -1.4])]], { t, e: lin });
    domain(g, t, { pieces: start, ew: WE('triumph', { glow: 0.5 }), eb: ME('focus') });
  }, { trans: 'whip', hud: (g, lt, t) => nameTitle(g, lt, 'Witty Alien', 'HE BEAT MAGNUS IN SEPTEMBER', { y: 220, size: 74, subColor: VOID, t0: 0.05 }) });
  cue(nameA - 0.04, 'whoosh_fast', 0.3); cue(nameA + 0.1, 'ting', 0.3);
  const SEPT = piecesAt(CW, CW.length - 1);
  shot(sepA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.3, 19.5, [4, 3.0, 6.6])], [len(sh), K(0.02, 0.27, 16.8, [4, 3.1, 6.8])]], { t, e: lin });
    online(g, t, { pieces: SEPT, cams: { wit: { e: t >= beatT ? 'triumph' : 'focus' }, mag: { e: t >= beatT ? 'sad' : 'focus' } }, clock: { names: ['MAGNUS', 'WITTY'], cols: [CURSE, VOID], l: 252, r: 141, run: 0 } });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'Chess.com · 5+0 blitz', 'SEPT 30, 2026', { y: 200, t0: 0.1 }); if (t >= beatT) stamp(g, 'MAGNUS RESIGNS', W / 2, 1540, t, beatT, { color: RED, size: 84 }); } });
  cue(sepA - 0.04, 'whoosh_deep', 0.3); cue(sepA + 0.1, 'clock_tick', 0.2); cue(beatT, 'stamp', 0.5); cue(beatT - 0.004, 'boom', 0.5);
  shot(wildA, (g, lt, t, sh) => {
    const [c] = CAMPOS.wit;
    rig(B, lt, [[0, K(-0.28, 0.05, 10.5, [c[0] + 0.3, c[1], c[2]])], [len(sh), K(-0.14, 0.03, 7.2, [c[0] + 0.25, c[1] + 0.1, c[2]])]], { t, bump: t > wildT && t < wildT + 0.3 ? 1.2 : 0 });
    online(g, t, { pieces: SEPT, cams: { wit: { e: WE('triumph', { open: 1, nod: 0.8 }), shake: t >= wildT ? 0.9 : 0.2 }, mag: { e: 'sad' } } });
    confetti(g, t, wildT);
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= wildT) badge(g, 'LIVE ON STREAM', W / 2, 230, { color: RED, size: 52, ...pop(t, wildT) }); } });
  cue(wildA - 0.04, 'whoosh_fast', 0.3); cue(wildT, 'cheer', 0.4); cue(wildT, 'confetti', 0.35);

  // ======================= FIVE WEEKS LATER: ROUND TWO, FIVE-MINUTE BLITZ =======================
  shot(remA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI / 2 - 0.2, 0.95, 24, [4, 0, 4])], [len(sh), K(PI / 2 - 0.35, 0.5, 18, [4, 1.2, 4])]], { t, e: ease.out });
    domain(g, t, { pieces: start, wPlayer: false, bPlayer: false });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); placeStamp(g, lt, 'Chess.com · round two', 'NOV 7, 2026', { y: 200, t0: 0.1 }); } });
  shot(roundA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.05, 14.5, [4, 4.6, 11.4])], [len(sh), K(0.0, 0.04, 12.6, [4, 4.6, 11.4])]], { t, bump: t > round2T && t < round2T + 0.3 ? 1 : 0 });
    online(g, t, { pieces: start, cams: { wit: { e: WE('smug', { band: 1 }) }, mag: { e: ME('smug', { glow: 0.8 }) } }, clock: clockAt(0) });
  }, { trans: 'zoom', hud: (g, lt, t) => vsLabel(g, lt, round2T - roundA, W / 2, 1530) });
  shot(blitzA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.2, 6.4, [9.9, 0.25, 3.1])], [len(sh), K(-0.2, 0.17, 5.2, [9.9, 0.2, 3.1])]], { t });
    online(g, t, { pieces: start, clock: clockAt(0), camA: 0 });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= blitzT - 0.1) badge(g, '5 + 0 BLITZ', W / 2, 230, { color: GOLD, size: 64, ...pop(t, blitzT - 0.1) }); } });
  cue(remA - 0.04, 'whoosh_deep', 0.35); cue(remA + 0.1, 'riser', 0.3); cue(round2T - 0.004, 'boom_big', 0.6); cue(round2T + 0.02, 'hit_punch', 0.35);
  cue(blitzA - 0.04, 'whoosh_fast', 0.3); cue(blitzT - 0.1, 'clock_press', 0.5); cue(blitzT + 0.2, 'clock_tick', 0.3);

  // ======================= MOVE SIX: THE KNIGHT ON f7 (the main move: Hollow Purple, rule 32 / §8) =======================
  const OPEN = spaced(openA + 0.12, sixT - 0.02, 10);
  shot(openA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.62, 15, [4, 0, 3.8])], [len(sh), K(0.04, 0.68, 13.5, [4, 0, 3.9])]], { t, e: lin });
    const r = runTo(PL, 0, OPEN, t, 0.08), fx = moveFx(r, 0.08, 0.1);
    online(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, camA: 0, clock: clockAt(r.k) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= sixT) counter(g, 'MOVE 6', null, { y: 330, size: 130, color: GOLD, at: [t, sixT] }); } });
  OPEN.forEach((a, i) => cue(a - 0.02, 'piece', i % 2 ? 0.16 : 0.22)); cue(sixT, 'hit', 0.5);
  const KN = at3('g5', 1.0), F7 = at3('f7', 1.0);
  shot(throwA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 0.3, 9.2, [5.6, 0.6, 5.4])], [LAND - throwA, K(-0.3, 0.27, 7.6, [5.7, 0.6, 5.8])], [len(sh), K(-0.22, 0.25, 7.0, [5.6, 0.6, 6.2])]], { t, bump: t > LAND && t < LAND + 0.3 ? 1.6 : 0 });
    const r = runTo(PL, 10, [LAND], t, 0.32), landed = t >= LAND;
    online(g, t, { pieces: r.pieces, camA: 0, red: 1, blue: 1,
      under: g2 => { if (landed) { ledGlow(g2, B, 'f7', HOLLOW, t, LAND, { reach: 8 }); spread(g2, B, 'f7', t, LAND, HOLLOW); } else squareFrame(g2, B, 'f7', HOLLOW, 0.8 * seg(t, knightT, knightT + 0.2)); moveFx(r, 0.32, 0.6).under(g2); },
      over: g2 => {
        moveFx(r, 0.32, 0.6).over(g2);
        if (!landed) {  // the two orbs over the knight, closing in, then one purple orb riding with it
          const k = B.project(...KN), m = seg(t, knightT + 0.1, magT + 0.35, ease.inOut), rr = k.s * lerp(0.6, 0.9, m);
          if (m < 1) { orb(g2, k.x - k.s * lerp(1.1, 0, m), k.y - k.s * 0.25, rr, VOID, seg(t, knightT - 0.15, knightT + 0.1)); orb(g2, k.x + k.s * lerp(1.1, 0, m), k.y - k.s * 0.25, rr, CURSE, seg(t, knightT + 0.05, knightT + 0.3)); }
          const pa = seg(t, magT + 0.2, magT + 0.4); if (pa > 0) { const u = clamp((t - (LAND - 0.32)) / 0.32), q = B.project(lerp(KN[0], F7[0], u), 1.0, lerp(KN[2], F7[2], u)); orb(g2, q.x, q.y - q.s * 0.2, q.s * 1.15 * (1 + 0.08 * Math.sin(t * 30)), HOLLOW, pa); }
        } else { const q = B.project(...F7); speedLines(g2, q.x, q.y, t, LAND, { life: 0.7 }); shockwave(g2, q.x, q.y, t, LAND, { r0: 40, r1: 900, color: '#D8C0FF', lw: 14 }); }
      } });
    if (landed) flashTint(g, HOLLOW, 0.55 * (1 - seg(t, LAND, LAND + 0.45)));
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= LAND + 0.05) moveTag(g, 'Nxf7!?', W / 2, 330, GOLD, 64, seg(t, LAND + 0.05, LAND + 0.15)); } });
  cue(throwA - 0.04, 'whoosh_soft', 0.3); cue(knightT, 'riser', 0.35); cue(LAND - 0.3, 'revswell', 0.6); boom(LAND, 1.0); landCue(LAND, true, 0.6);
  cue(LAND, 'hit_punch', 0.45); cue(LAND + 0.02, 'glass', 0.3); cue(LAND + 0.05, 'shimmer', 0.4);
  shot(hisA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.45, 0.06, 7.4, [4, 3.1, -1.4])], [len(sh), K(PI + 0.32, 0.05, 6.4, [4, 3.15, -1.4])]], { t, e: lin });
    domain(g, t, { pieces: piecesAt(PL, 11), ew: WE('smug', { glow: 0.8 }), eb: ME('focus') });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= weaponT) badge(g, 'HIS OWN WEAPON', W / 2, 230, { color: VOID, size: 56, ...pop(t, weaponT) }); } });
  shot(titleA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.55, 0.55, 12.5, [5.4, 0.4, 5.6])], [len(sh), K(0.32, 0.6, 11.2, [5.4, 0.4, 5.8])]], { t, e: lin });
    const pcs = piecesAt(PL, 11).map(p => p.sq === 'f7' ? { ...p, halo: HOLLOW, haloA: 0.9 } : p);
    online(g, t, { pieces: pcs, camA: 0, under: g2 => ledGlow(g2, B, 'f7', HOLLOW, t, titleA, { reach: 2.5, a: 0.6 }) });
  }, { trans: 'whip', hud: (g, lt, t) => { scrim(g); if (t >= alienT - 0.1) nameTitle(g, t - alienT + 0.1, 'The Alien Gambit', '…5.Ng5 h6 6.Nxf7!?', { y: 200, size: 70, subColor: HOLLOW }); } });
  cue(hisA - 0.04, 'whoosh_fast', 0.3); cue(weaponT, 'sparkle_pop', 0.3); cue(titleA - 0.04, 'whoosh_fast', 0.3); cue(alienT, 'reveal_bell', 0.4);

  // ======================= MAGNUS TAKES IT. WITH HIS KING. THE ENGINE: −2 =======================
  const KXF7 = takesT + 0.12;
  shot(takeA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.16, 0.2, 10.8, [4, 2.2, 8.0])], [len(sh), K(0.08, 0.18, 9.4, [4, 2.3, 8.1])]], { t, e: lin });
    const r = runTo(PL, 11, [KXF7], t, 0.26), fx = moveFx(r, 0.26, 0.6);
    domain(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, wPlayer: false, wChair: false, eb: ME('smug', { glow: 0.6 }), bReach: { sq: 'f7', u: (t - KXF7 + 0.45) / 0.8 } });
  }, { trans: 'whip' });
  cue(takeA - 0.04, 'whoosh_fast', 0.3); landCue(KXF7, true, 0.75); cue(KXF7 + 0.02, 'glass', 0.35);
  shot(kingA, (g, lt, t, sh) => {
    const f7 = at3('f7', 0.6);
    rig(B, lt, [[0, K(PI + 0.35, 0.5, 6.4, f7)], [len(sh), K(PI + 0.2, 0.46, 5.2, f7)]], { t, e: lin });
    online(g, t, { pieces: piecesAt(PL, 12), camA: 0, under: g2 => pieceRing(g2, B, 'f7', RED, seg(t, kingT - 0.15, kingT + 0.1)) });
  }, { trans: 'zoom', hud: (g, lt, t) => { if (t >= kingT) badge(g, 'THE KING TOOK IT', W / 2, 230, { color: RED, size: 56, ...pop(t, kingT) }); } });
  cue(kingA - 0.04, 'whoosh_soft', 0.3); cue(kingT, 'dun_dun', 0.4);
  shot(engA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.06, 0.34, 18, [4, 2.6, 6.4])], [len(sh), K(0.02, 0.3, 16, [4, 2.8, 6.6])]], { t, e: lin });
    online(g, t, { pieces: piecesAt(PL, 12), cams: { wit: { e: t >= losingT ? WE('worried') : WE('focus') }, mag: { e: ME('smug', { glow: 0.5 }) } }, clock: clockAt(12) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, lerp(0.3, -2.0, ease.out(seg(t, engA + 0.3, losingT + 0.2))), { a: seg(lt, 0, 0.2) }); if (t >= losingT) badge(g, 'STOCKFISH: −2.0', W / 2, 230, { color: RED, size: 56, ...pop(t, losingT) }); } });
  cue(engA - 0.04, 'whoosh_fast', 0.3); cue(losingT, 'error', 0.35);

  // ======================= BUT MAGNUS SLIPS (17...Bg6): THE BAR FLIPS, WITTY IS BETTER =======================
  const FF = spaced(flipA + 0.08, slipsT - 0.3, 21), BG6 = slipsT + 0.08;
  shot(flipA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.08, 0.66, 14, [4, 0, 4.2])], [len(sh), K(-0.02, 0.7, 12.6, [4, 0, 4.4])]], { t, e: lin });
    const r = t < BG6 - 0.3 ? runTo(PL, 12, FF, t, 0.03) : runTo(PL, 33, [BG6], t, 0.3), fx = moveFx(r, r.k === 34 ? 0.3 : 0.03, r.k === 34 ? 0.8 : 0.05);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: fx.over, clock: clockAt(r.k) });
    if (r.k === 34 && t >= BG6) flashTint(g, RED, 0.25 * (1 - seg(t, BG6, BG6 + 0.35)));
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, -1.0); if (t >= BG6) badge(g, 'MOVE 17: A SLIP', W / 2, 230, { color: RED, size: 52, ...pop(t, BG6) }); } });
  FF.forEach((a, i) => { if (i % 3 === 0) cue(a, 'piece', 0.12); }); cue(flipA, 'whoosh_fast', 0.25); landCue(BG6, false, 0.6); cue(BG6, 'sting', 0.35);
  shot(barA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.4, 16, [4, 1.6, 5.0])], [len(sh), K(0.04, 0.36, 14, [4, 1.8, 5.2])]], { t, e: lin, bump: t > flipsT && t < flipsT + 0.3 ? 1 : 0 });
    online(g, t, { pieces: piecesAt(PL, 34), camA: 0.9, cams: { wit: { e: t >= flipsT ? WE('happy', { glow: 0.6 }) : WE('focus') }, mag: { e: ME('focus') } }, clock: clockAt(34) });
    if (t >= flipsT) flashTint(g, LIME, 0.22 * (1 - seg(t, flipsT, flipsT + 0.4)));
  }, { trans: 'zoom', hud: (g, lt, t) => { const v = lerp(-1.0, 0.9, ease.inOut(seg(t, flipsT - 0.15, flipsT + 0.25))); evalHud(g, v); if (t >= flipsT) counter(g, '+0.9', 'FOR WITTY', { y: 330, size: 150, color: LIME, at: [t, flipsT] }); } });
  cue(barA - 0.04, 'whoosh_soft', 0.3); cue(flipsT - 0.15, 'swipe_card', 0.4); cue(flipsT, 'reveal_bell', 0.45); cue(flipsT + 0.02, 'boom', 0.45);
  shot(betterA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.12, 0.06, 8.2, [4, 3.0, -1.4])], [len(sh), K(PI - 0.04, 0.04, 6.6, [4, 3.05, -1.4])]], { t, e: lin });
    domain(g, t, { pieces: piecesAt(PL, 34), ew: WE('happy', { glow: 0.9 }), eb: ME('worried'), red: 0.7 });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= betterT) badge(g, 'WITTY IS BETTER', W / 2, 230, { color: LIME, size: 60, ...pop(t, betterT) }); } });
  cue(betterA - 0.04, 'whoosh_fast', 0.3); cue(betterT, 'success', 0.35);

  // ======================= MOVE 21: THE ENGINE'S MOVE IS ROOK e6; HE PLAYS ROOK e2 =======================
  const M21 = spaced(m21A + 0.1, m21T + 0.15, 6);
  const EK = [K(-0.28, 0.6, 11.5, [4.0, 0.2, 3.6]), K(-0.2, 0.64, 10.4, [4.0, 0.2, 3.8])];
  shot(m21A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.7, 14.5, [4, 0, 4.2])], [len(sh), K(-0.1, 0.66, 13, [4, 0, 4])]], { t, e: lin });
    const r = runTo(PL, 34, M21, t, 0.08), fx = moveFx(r, 0.08, 0.1);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: fx.over });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, 1.0); if (t >= m21T) counter(g, 'MOVE 21', null, { y: 330, size: 130, color: GOLD, at: [t, m21T] }); } });
  M21.forEach((a, i) => cue(a - 0.02, 'piece', 0.16)); cue(m21T, 'hit', 0.45);
  const ghost = (g2, t, a) => {  // the engine's move as a ghost: an arrow e1–e6 and a pale rook on e6
    if (a <= 0) return;
    boardArrow(g2, B, 'e1', 'e6', 0.9 * a, seg(t, engMA + 0.25, engMA + 0.75));
    squareFrame(g2, B, 'e6', LIME, 0.9 * a);
    const [x, z] = sqXZ('e6'); if (depth(x, 0, z) > 0.8) { const q = B.project(x, 0, z); drawPiece(g2, 'r', 'w', q.x, q.y - q.s * 0.56, q.s * 1.25, { alpha: 0.45 * a * seg(t, e6T - 0.2, e6T) }); }
  };
  shot(engMA, (g, lt, t, sh) => {
    rig(B, lt, [[0, EK[0]], [len(sh), EK[1]]], { t, e: lin });
    online(g, t, { pieces: piecesAt(PL, 40), camA: 0, over: g2 => ghost(g2, t, 1) });
  }, { trans: 'whip', hud: (g, lt, t) => { evalHud(g, 1.0); if (t >= e6T) badge(g, 'ENGINE: ROOK e6  +1.3', W / 2, 230, { color: LIME, size: 50, ...pop(t, e6T) }); } });
  cue(engMA - 0.04, 'whoosh_soft', 0.3); cue(engMA + 0.3, 'pen', 0.3); cue(e6T, 'sparkle_pop', 0.35);
  const RE2 = e2T + 0.06;
  shot(playsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, EK[1]], [len(sh), K(-0.14, 0.66, 9.6, [4.0, 0.2, 3.6])]], { t, e: lin });
    const r = runTo(PL, 40, [RE2], t, 0.26), fx = moveFx(r, 0.26, 0.8);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: g2 => { ghost(g2, t, 1 - seg(t, RE2, RE2 + 0.4)); fx.over(g2); } });
  }, { trans: 'cut', hud: (g, lt, t) => evalHud(g, lerp(1.0, -0.2, ease.inOut(seg(t, RE2, RE2 + 0.5)))) });
  landCue(RE2, false, 0.6); cue(RE2 + 0.05, 'error', 0.35);
  const LT = spaced(lateA + 0.1, w('late', 3), 3), RE6 = re6T + 0.06;
  shot(lateA, (g, lt, t, sh) => {
    // Witty's own hand puts the rook on e6: seen from Magnus's side of the table, Witty's face over the board
    rig(B, lt, [[0, K(PI + 0.18, 0.3, 10.4, [4, 2.0, 1.2])], [len(sh), K(PI + 0.08, 0.27, 9.0, [4, 2.1, 1.0])]], { t, e: lin });
    const r = runTo(PL, 41, [...LT, RE6], t, t < RE6 - 0.3 ? 0.1 : 0.26), fx = moveFx(r, r.k === 45 ? 0.26 : 0.1, r.k === 45 ? 0.8 : 0.1);
    domain(g, t, { pieces: r.pieces, under: fx.under, over: fx.over, bPlayer: false, bChair: false, ew: WE('focus', { glow: 0.5 * seg(t, RE6, RE6 + 0.3) }),
      wReach: t > RE6 - 0.55 && t < RE6 + 0.45 ? { sq: 'e6', u: (t - RE6 + 0.55) / 1.0 } : null });
  }, { trans: 'whip', hud: (g, lt, t) => evalHud(g, -0.1) });
  LT.forEach(a => cue(a - 0.02, 'piece', 0.18)); landCue(RE6, false, 0.6); cue(RE6, 'ting', 0.3);
  const NXD5 = tooT + 0.08;
  shot(tooA, (g, lt, t, sh) => {
    const d5 = at3('d5', 0.4);
    rig(B, lt, [[0, K(0.1, 0.5, 8, d5)], [len(sh), K(0.02, 0.46, 6.8, d5)]], { t, e: lin, bump: t > NXD5 && t < NXD5 + 0.3 ? 1.2 : 0 });
    const r = runTo(PL, 45, [NXD5], t, 0.22), fx = moveFx(r, 0.22, 0.8);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: fx.over });
    slashes(g, t, NXD5, { n: 1, seed: 3, life: 0.4 });
  }, { trans: 'zoom', hud: (g, lt, t) => { evalHud(g, -0.1); if (t >= lateT) stamp(g, 'TOO LATE', W / 2, 330, t, lateT, { color: RED, size: 110 }); } });
  landCue(NXD5, true, 0.7); cue(NXD5, 'whoosh_fast', 0.35); cue(lateT, 'stamp', 0.5); cue(lateT - 0.004, 'boom', 0.45);

  // ======================= THE ENDGAME: TWENTY SECONDS EACH; MAGNUS WALKS HIS PAWNS =======================
  shot(endA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.18, 4.8, [9.9, 0.2, 3.1])], [len(sh), K(-0.2, 0.15, 3.9, [9.9, 0.15, 3.1])]], { t, shake: 1.4 });
    const run = Math.floor((t - endA) / 0.5) % 2 ? 2 : 1, d = (t - endA) * 0.5;
    online(g, t, { pieces: piecesAt(PL, 72), camA: 0, clock: { ...clockAt(72), l: 21 - (run === 1 ? d : 0) - 0.4, r: 21.2 - (run === 2 ? d : 0), run } });
    flashTint(g, RED, 0.08 * (0.5 + 0.5 * Math.sin(t * 9)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= twT) badge(g, '20 SECONDS EACH', W / 2, 230, { color: RED, size: 60, ...pop(t, twT) }); } });
  cue(endA - 0.04, 'whoosh_fast', 0.3); cue(endA + 0.05, 'heartbeat', 0.45); cue(twT, 'clock_press', 0.4); cue(twT + 0.5, 'clock_press', 0.4); cue(twT + 1.0, 'clock_press', 0.4);
  const PW = spaced(pawnsA + 0.12, q1A - 0.1, 25);  // plies 73..97
  shot(pawnsA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.02, 1.08, 14.5, [4, 0, 4])], [len(sh), K(0.14, 0.98, 12.8, [4, 0, 3.8])]], { t, e: lin });
    const r = runTo(PL, 72, PW, t, 0.07), fx = moveFx(r, 0.07, 0.12);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: fx.over, clock: clockAt(r.k) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= pawnsT) badge(g, 'PAWNS MARCHING', W / 2, 230, { color: RED, size: 52, ...pop(t, pawnsT) }); } });
  PW.forEach((a, i) => cue(a - 0.02, 'piece', 0.12 + (i % 2) * 0.05));

  // ======================= A QUEEN. WITTY TAKES IT. ANOTHER QUEEN (Sukuna's cuts) =======================
  const Q1 = q1T + 0.1, KD1 = wtT + 0.06, Q2 = q2T + 0.06, PRE = [q2A + 0.1, q2A + 0.28], TAIL = spaced(Q2 + 0.5, resA - 0.1, 5);
  const QK = [K(-0.25, 0.42, 9, [3.6, 0.3, 1.6]), K(-0.15, 0.4, 7.8, [3.6, 0.3, 1.6])];
  shot(q1A, (g, lt, t, sh) => {
    rig(B, lt, [[0, QK[0]], [len(sh), QK[1]]], { t, e: lin, bump: t > Q1 && t < Q1 + 0.3 ? 1.2 : 0 });
    const r = runTo(PL, 97, [Q1], t, 0.24), fx = moveFx(r, 0.24, 0.8);
    online(g, t, { pieces: r.pieces, camA: 0, under: g2 => { fx.under(g2); if (t >= Q1) ledGlow(g2, B, 'd1', RED, t, Q1, { reach: 3 }); }, over: fx.over, clock: clockAt(r.k) });
    if (t >= Q1) flashTint(g, RED, 0.3 * (1 - seg(t, Q1, Q1 + 0.4)));
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= Q1) badge(g, 'A QUEEN', W / 2, 230, { color: RED, size: 64, ...pop(t, Q1) }); } });
  boom(Q1, 0.7); landCue(Q1, false, 0.6); cue(Q1, 'shimmer', 0.3);
  shot(wtA, (g, lt, t, sh) => {
    rig(B, lt, [[0, QK[1]], [len(sh), K(-0.05, 0.42, 7.2, [3.6, 0.3, 1.4])]], { t, e: lin });
    const r = runTo(PL, 98, [KD1], t, 0.22), fx = moveFx(r, 0.22, 0.6);
    online(g, t, { pieces: r.pieces, camA: 0, under: fx.under, over: fx.over, clock: clockAt(r.k) });
  }, { trans: 'cut', hud: (g, lt, t) => { if (t >= KD1) badge(g, 'TAKEN', W / 2, 230, { color: VOID, size: 60, ...pop(t, KD1) }); } });
  landCue(KD1, true, 0.7); cue(KD1, 'glass', 0.35);
  shot(q2A, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.4, 14.5, [4, 1.0, 3.4])], [Q2 - q2A, K(0.06, 0.38, 13.2, [4, 1.0, 3.2])], [len(sh), K(0.03, 0.34, 15, [4, 1.6, 4.2])]], { t, bump: t > Q2 && t < Q2 + 0.3 ? 1.6 : 0 });
    const r = runTo(PL, 99, [...PRE, Q2, ...TAIL], t, t < Q2 - 0.3 ? 0.1 : t < Q2 + 0.4 ? 0.22 : 0.08), fx = moveFx(r, 0.1, 0.4);
    online(g, t, { pieces: r.pieces, camA: 0.9, cams: { wit: { e: WE('shock') }, mag: { e: ME(t >= Q2 ? 'smug' : 'focus', { glow: t >= Q2 ? 1 : 0.3 }) } }, clock: clockAt(r.k),
      under: g2 => { fx.under(g2); if (t >= Q2) ledGlow(g2, B, 'a1', RED, t, Q2, { reach: 8 }); }, over: fx.over });
    if (t >= Q2) { flashTint(g, CURSE, 0.45 * (1 - seg(t, Q2, Q2 + 0.45))); slashes(g, t, Q2, { n: 3, seed: 7, life: 0.6 }); }
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= Q2) badge(g, 'ANOTHER QUEEN', W / 2, 230, { color: RED, size: 64, ...pop(t, Q2) }); } });
  PRE.forEach(a => cue(a - 0.02, 'piece', 0.2)); cue(Q2 - 0.3, 'revswell', 0.55); boom(Q2, 0.95); cue(Q2, 'whoosh_fast', 0.5); cue(Q2 + 0.08, 'whoosh_fast', 0.4); cue(Q2 + 0.16, 'hit_punch', 0.4);
  TAIL.forEach(a => cue(a - 0.02, 'piece', 0.14));

  // ======================= WITTY RESIGNS ("WITTY WON." struck out), SIX SECONDS LEFT =======================
  const KING = sqXZ('a4');
  shot(resA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.32, 0.22, 9.4, [3.0, 1.6, 1.0])], [len(sh), K(PI - 0.24, 0.2, 8.4, [3.0, 1.7, 1.0])]], { t, e: lin });
    const fall = ease.inOut(seg(t, resT + 0.1, resT + 0.5)), pcs = piecesAt(PL, 107).filter(p => !(p.t === 'k' && p.c === 'w'));
    domain(g, t, { pieces: pcs, loose: [{ t: 'k', c: 'w', x: KING[0], y: 0, z: KING[1], rot: fall * 1.45 }], ew: WE('sad', { band: seg(t, resT + 0.3, resT + 0.9) }), eb: ME('neutral', { glow: 0.4 }), blue: 0.6 });
  }, { trans: 'whip', hud: (g, lt, t) => bubble(g, 'WITTY WON.', W / 2, 360, { size: 80, tail: -1, cross: seg(t, resT + 0.62, resT + 0.86), a: seg(t, resA + 0.05, resA + 0.15) }) });
  cue(resA - 0.04, 'whoosh_deep', 0.3); cue(resT + 0.45, 'thud', 0.5); cue(resT + 0.62, 'whoosh_fast', 0.45); cue(resT + 0.66, 'hit_punch', 0.35);
  shot(sixA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.3, 0.2, 6.4, [9.9, 0.25, 3.1])], [len(sh), K(-0.22, 0.17, 5.4, [9.9, 0.2, 3.1])]], { t });
    online(g, t, { pieces: piecesAt(PL, 107), camA: 0, clock: t >= sixRT + 0.7 ? { ...clockAt(107), result: '0 – 1' } : clockAt(107) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= sixRT) badge(g, '6 SECONDS LEFT', W / 2, 230, { color: RED, size: 60, ...pop(t, sixRT) }); } });
  cue(sixA - 0.04, 'whoosh_fast', 0.3); cue(sixRT, 'tick', 0.4); cue(sixRT + 0.7, 'gavel', 0.4);

  // ======================= 4–1 FOR MAGNUS; STAND PROUD =======================
  shot(scoreA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.0, 0.16, 11.6, [4, 0.9, 3.6])], [len(sh), K(0.0, 0.14, 10.4, [4, 0.9, 3.6])]], { t, e: lin });
    domain(g, t, { pieces: [], wPlayer: false, bPlayer: false, wChair: false, bChair: false, over: g2 => cards(g2, t, scoreA + 0.1) });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= fourT - 0.1) score(g, 'MAGNUS', 'WITTY', '4', '1', { y: 270, lc: CURSE, rc: VOID, label: 'ALL THEIR GAMES ON CHESS.COM', a: seg(t, fourT - 0.1, fourT + 0.05) }); } });
  for (let i = 0; i < 5; i++) cue(scoreA + 0.1 + i * 0.16, 'swipe_card', 0.25); cue(fourT, 'boom', 0.45);
  shot(forA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.14, 0.05, 9, [4, 3.1, 9.3])], [len(sh), K(0.08, 0.04, 7.6, [4, 3.15, 9.3])]], { t, e: lin });
    domain(g, t, { pieces: piecesAt(PL, 107), ew: WE('sad'), eb: ME('smug', { glow: 1 }), blue: 0.6 });
  }, { trans: 'whip' });
  cue(forA - 0.04, 'whoosh_fast', 0.3); cue(forA + 0.1, 'dun_dun', 0.35);
  shot(proudA, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.75, 0.1, 10.5, [4, 3.0, -1.4])], [len(sh), K(PI - 0.6, 0.08, 8.6, [4, 3.05, -1.4])]], { t, e: lin });
    domain(g, t, { pieces: piecesAt(PL, 107), ew: WE('sad', { band: 1 }), eb: ME('neutral', { glow: 0.3 }), blue: 0.8 });
  }, { trans: 'fade', transDur: 0.3, hud: (g, lt, t) => { if (t >= strongT) badge(g, 'STAND PROUD', W / 2, 230, { color: GOLD, size: 56, ...pop(t, strongT) }); } });
  cue(proudA + 0.05, 'shimmer', 0.25);

  // ======================= CTA: back to the hook (rule 10) =======================
  shot(ctaA, (g, lt, t, sh) => {
    rig(B, lt, [[0, VS[1]], [len(sh), VS[0]]], { t, e: lin });
    online(g, t, { pieces: start, cams: vsCams(t), clock: clockAt(0) });
  }, { trans: 'whip', hud: (g, lt, t) => {
    badge(g, 'HOW MANY MOVES WOULD YOU LAST?', W / 2, 230, { color: GOLD, size: 44, ...pop(t, ctaA + 0.1) });
    badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: VOID, size: 46, a: seg(t, movesT, movesT + 0.1), ...pop(t, movesT) });
    badge(g, 'FOLLOW ' + CHANNEL, W / 2, 425, { color: CREAM, size: 36, a: seg(t, lastT, lastT + 0.1) });
  } });
  cue(ctaA - 0.04, 'whoosh_fast', 0.3); cue(ctaA + 0.05, 'shimmer', 0.3); cue(movesT, 'sparkle_pop', 0.3); cue(lastT, 'sparkle_pop', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'hook' }, { t: winT, m: 'slam' }, { t: nameA, m: 'digital' }, { t: remA, m: 'tension' }, { t: openA, m: 'build' },
    { t: LAND, m: 'slam' }, { t: hisA + 0.6, m: 'glory' }, { t: takeA, m: 'intrigue' }, { t: flipA, m: 'build' }, { t: flipsT, m: 'victory' },
    { t: m21A, m: 'tension' }, { t: NXD5, m: 'drop' }, { t: endA, m: 'clockwork' }, { t: q1A, m: 'build' }, { t: Q2, m: 'slam' },
    { t: resA, m: 'void' }, { t: scoreA, m: 'elegy' }, { t: ctaA, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: winT - 0.32, t1: winT - 0.01, kind: 'mute' }, { t0: winT, t1: nameA, kind: 'boost', db: 4 },
    { t0: LAND - 0.34, t1: LAND - 0.01, kind: 'mute' }, { t0: LAND, t1: hisA + 0.6, kind: 'boost', db: 5 },
    { t0: Q2 - 0.32, t1: Q2 - 0.01, kind: 'mute' }, { t0: Q2, t1: resA, kind: 'boost', db: 4 },
    { t0: proudA, t1: ctaA, kind: 'lp', f: 900 }, { t0: ctaA, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
