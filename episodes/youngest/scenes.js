// The youngest grandmasters ever. Fischer's record (1958) stood 33 years; Polgár broke it (1991), then Leko, Bacrot,
// Ponomariov and Bu; Karjakin's (2002) stood 19 years; Gukesh missed it by 17 days (2019) and became world champion at
// 18; Mishra set it in Budapest (2021, 12y 4m 25d); Oro fell two months short (2026); Roman Shogdzhiev, 11, has two
// norms. Sources: SOURCES.md. A gold plaque on a pedestal holds the record and shatters each time it falls. Navy and
// warm gold, colourful from the first frame without neon (rule 28), brilliant-episode pace with fly-arounds (rule 27).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, placeStamp, stamp, sans, serif } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, pool, picture } from '../../engine/js/env.js';
import { useLookV2 } from '../../engine/js/look.js';
import { spotCone, bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { shockwave, embers, shatterImage, burst, glint } from '../../engine/js/fx.js';
import { confetti } from '../../engine/js/draw.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

// ---------- the prodigies, stylized (no exact likeness): kids get a rounder face, a smaller body and a little blush ----------
const KID = { face: [1.0, 0.97, 0.95], bodyScale: 0.8, blushAlways: 0.25, ears: 1.05 };
const BROWN = { base: '#B07A57', shade: '#99664A', deep: '#7A4C33', blush: '#B86458', hi: '#C8936E' };
CAST.leko14 = { ...KID, hair: 'swept', hairC: '#3A2A20', brow: '#2E2119', suit: '#4A5F7A', suitD: '#344660', shirt: 'tie', tie: '#7A2A2E' };
CAST.bacrot14 = { ...KID, hair: 'fringe', hairC: '#5A4030', brow: '#4A3426', suit: '#2A3A6A', suitD: '#1E2A50', shirt: 'polo' };
CAST.pono14 = { ...KID, hair: 'messy', hairC: '#8A6A48', brow: '#6E5236', suit: '#5A5A62', suitD: '#42424A', shirt: 'tie', tie: '#2A3A5A' };
CAST.bu13 = { ...KID, hair: 'fringe', hairC: '#141010', brow: '#100C0A', suit: '#C8302E', suitD: '#9A2224', shirt: 'polo', skin: { base: '#EBCDAE', shade: '#D9B392', deep: '#B88E6C' } };
CAST.karjakin12 = { ...KID, face: [1.02, 0.96, 0.98], hair: 'fringe', hairC: '#7A5A3A', brow: '#5E442C', suit: '#3A5A8A', suitD: '#2A4268', shirt: 'tee' };
CAST.gukesh12 = { ...KID, hair: 'swept', hairC: '#141010', brow: '#100C0A', suit: '#F0EEE8', suitD: '#CFCBC2', shirt: 'polo', skin: BROWN };
CAST.gukesh18 = { face: [0.92, 1.06, 0.86], hair: 'swept', hairC: '#141010', brow: '#100C0A', suit: '#1E2430', suitD: '#141922', shirt: 'open', ears: 1.04, skin: BROWN };
CAST.mishra12 = { ...KID, hair: 'fringe', hairC: '#16110E', brow: '#120D0A', suit: '#24365E', suitD: '#18264A', shirt: 'polo', skin: { ...BROWN, base: '#BC8662', hi: '#D09E78' } };
CAST.oro12 = { ...KID, hair: 'fringe', hairC: '#7A5636', brow: '#5E4228', suit: '#8CC4EE', suitD: '#6AA4D2', shirt: 'tee' };
CAST.roman11 = { ...KID, bodyScale: 0.76, blushAlways: 0.3, hair: 'fringe', hairC: '#1E1814', brow: '#16110E', suit: '#7A2A2E', suitD: '#5A1E22', shirt: 'hoodie' };

const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const GOLD = '#F2C14E', RED = '#FF5A4F', SKY = '#8CC4EE', GREEN = '#5EE06B';
const G6 = await fetch('../engine/data/carlsen_nepo_2021_g6.json').then(r => r.json());
const lin = x => x;
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
const at = k => G6[k].pieces.map(p => ({ ...p, ...xz(p.sq) }));
const PH = {};
for (const k of ['fischer1956', 'judit1990']) PH[k] = await loadPhoto3d(`../episodes/youngest/photos/${k}`);

// ---------- painted colour sets (blurred once): the navy hall of records, warm tungsten for the old days, one per country ----------
const STYLE = {
  hall: { g: ['#0A1328', '#1B2B50', '#060B18'], beams: ['#FFD58A', '#A8C8FF', '#FFD58A', '#A8C8FF', '#FFD58A'], dots: ['#FFE2A8', '#A8CCFF'], ba: 0.34 },
  retro: { g: ['#2E1A0E', '#6A3E1E', '#1E1008'], beams: ['#FFC870', '#FFE2B0', '#FFC870', '#FFE2B0'], dots: ['#FFE0A0', '#FFB870'], ba: 0.4 },
  cold: { g: ['#0A1A2C', '#1E3C5E', '#06101C'], beams: ['#BFD8FF', '#FFE6B8', '#BFD8FF', '#FFE6B8'], dots: ['#CFE2FF', '#FFE9C8'], ba: 0.36 },
  saffron: { g: ['#2A1406', '#7A3E10', '#1A0A04'], beams: ['#FFB347', '#FFE0A0', '#5ED1B0', '#FFB347'], dots: ['#FFD08A', '#9FF0D8'], ba: 0.36 },
  usa: { g: ['#0A1430', '#24305E', '#070E24'], beams: ['#FFF4E0', '#FF8A80', '#FFF4E0', '#9FC0FF'], dots: ['#FFFFFF', '#FFB0A8', '#B0CCFF'], ba: 0.3 },
  arg: { g: ['#0A2036', '#2A5A82', '#07182A'], beams: ['#BFE3FF', '#FFF6E0', '#FFD86A', '#BFE3FF'], dots: ['#DDF0FF', '#FFE9A0'], ba: 0.34 },
  night: { g: ['#0B1530', '#1A2D55', '#08101F'], beams: ['#FFE2B0', '#8FC4FF', '#FFE2B0', '#8FC4FF', '#FFE2B0'], dots: ['#FFE9C8', '#9FD0FF'], ba: 0.36 },
};
const paintBack = style => {
  const S = STYLE[style], w = 1800, h = 1500, c = makeCanvas(w, h), g = c.getContext('2d'), r = rng(style.length * 7 + 3);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, S.g[0]); bg.addColorStop(0.55, S.g[1]); bg.addColorStop(1, S.g[2]);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  S.beams.forEach((col, i) => {  // soft light beams fanning down from the rig
    const x = 180 + i * (w - 360) / (S.beams.length - 1), gr = g.createLinearGradient(x, 0, x, h * 0.9), sp = (i - (S.beams.length - 1) / 2) * 90;
    gr.addColorStop(0, rgba(col, S.ba)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x + 30, 0); g.lineTo(x + 280 + sp, h * 0.9); g.lineTo(x - 280 + sp, h * 0.9); g.fill();
  });
  for (let i = 0; i < 70; i++) {
    const col = S.dots[i % S.dots.length], x = r() * w, y = r() * h * 0.75, rad = 8 + r() * 36, gl = g.createRadialGradient(x, y, 0, x, y, rad);
    gl.addColorStop(0, rgba(col, 0.75)); gl.addColorStop(1, rgba(col, 0)); g.fillStyle = gl; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const out = makeCanvas(w, h), o = out.getContext('2d'); o.filter = 'blur(10px)'; o.drawImage(c, 0, 0); return out;
};
const BACKS = Object.fromEntries(Object.keys(STYLE).map(k => [k, paintBack(k)]));
function backdrop(g, t, style = 'hall') {
  const ox = -Math.sin(B.yaw) * 700, oy = (B.pitch - 0.3) * 520, im = BACKS[style];
  g.drawImage(im, -360 + ox, -120 + oy, W + 720, (W + 720) * im.height / im.width);
  bokeh(g, t, { n: 12, seed: style.length, y0: 0.04, y1: 0.45, a: 0.2, size: [30, 90], colors: STYLE[style].dots });
}
function gameTable(g) {
  box(g, B, [3.3, -3.2, 3.3], [4.7, -1.6, 4.7], { top: '#3A1F14', side: '#24130C', front: '#2E180F' });
  box(g, B, [-1.4, -1.6, -1.4], [9.4, -0.35, 9.4], { top: '#8A4A2E', side: '#4A2618', front: '#5E3220' });
  pool(g, B, 4, -0.33, 4, 7, '#FFF0D8', 0.24);
}
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };

// a player behind the board (far side), the camera on the near side; kids sit a little lower and smaller
const FRONT = (yaw = 0.1, push = 0) => ({ yaw, pitch: 0.3, dist: 7.4 - push, fov: 1500, cy: H * 0.46, target: [4, 2.8, 9.2] });
const nudge = (P, k) => ({ ...P, dist: P.dist - k });
// a sharp fly-around: hold A, whip to B in d seconds centred on `at` (local time), then drift on
const flyAt = (A, Bp, at, L, d = 0.28) => {
  const a0 = Math.max(0, at - d / 2), end = Math.max(L, a0 + d + 0.1);
  return a0 < 0.02 ? [[0, A], [d, Bp, ease.whip], [end, nudge(Bp, 0.3)]] : [[0, A], [a0, nudge(A, 0.15)], [a0 + d, Bp, ease.whip], [end, nudge(Bp, 0.3)]];
};
function portrait(g, lt, t, who, e, { keys, back = 'hall', pieces = at(0), kid = true, dark = 0, extra = null } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, back);
  const lift = kid ? 2.95 : 3.1, k = kid ? 0.93 : 1, hp = B.project(4, lift + 0.2, 9.4);
  rim(g, hp.x, hp.y, hp.s * 4.2, STYLE[back].beams[0], 0.45 * (1 - dark * 0.5));
  seated(g, B, who, e, t, { z: 9.4, lift, k });
  if (dark > 0) seated(g, B, who, e, t, { z: 9.4, lift, k, alpha: dark, silhouette: true, shade: 'brightness(0.05)' });  // backlit until the light finds him
  gameTable(g); B.drawSlab(g, COM);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 });
  if (extra) extra();
  spotCone(g, B, { top: [4, 18, 9.2], base: [4, 0, 9.2], r0: 0.6, r1: 4.5, a: 0.16 * (1 - dark * 0.6), t, color: '#FFF4E0' });
  lowKey(g, { cy: H * 0.4, a: 0.28 + dark * 0.3 });
}

// two-line headline for the cover frame: white over yellow, heavy outline (rule 28)
function bigText(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FFD43B', s1 = 92, s2 = 104, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#120C24';
  g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
  g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.08); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.08);
  qaRect(g, 70, y - s1 * 0.8, W - 140, s1 * 0.8 + s2 * 1.12, 'text', 'cover title');
  g.restore();
}
// a small-caps tag on a dark plate
function tag(g, text, y, a = 1, { color = '#FFFFFF', size = 28 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = '5px'; g.textAlign = 'center';
  const w = g.measureText(text).width + 50;
  g.fillStyle = 'rgba(10,8,20,0.82)'; g.beginPath(); g.roundRect(W / 2 - w / 2, y - size * 1.35, w, size * 2, 12); g.fill();
  g.fillStyle = color; g.fillText(text, W / 2, y); qaRect(g, W / 2 - w / 2, y - size * 1.35, w, size * 2, 'text', text);
  g.restore();
}
const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
// a title over a card: heavy white line, gold small caps under it
function cardTitle(g, l1, l2, { y = 300, c2 = GOLD } = {}) {
  g.save(); g.textAlign = 'center'; g.font = sans(46, 900); g.letterSpacing = '3px'; g.fillStyle = '#FFFFFF'; g.fillText(l1, W / 2, y);
  if (l2) { g.font = sans(26, 800); g.letterSpacing = '5px'; g.fillStyle = c2; g.fillText(l2, W / 2, y + 52); }
  g.restore(); qaRect(g, 70, y - 46, W - 140, l2 ? 110 : 60, 'text', l1);
}
const darkCard = (g, top, bottom) => { const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bottom); g.fillStyle = bg; g.fillRect(0, 0, W, H); };

// ---------- SET: the hall of records — the gold plaque on a marble pedestal under a spotlight, older pedestals in the dark ----------
const REC = {
  fischer: ['BOBBY FISCHER', '15 YEARS · 6 MONTHS · 1 DAY', '1958'],
  polgar: ['JUDIT POLGÁR', '15 YEARS · 4 MONTHS · 28 DAYS', '1991'],
  leko: ['PETER LEKO', '14 YEARS · 4 MONTHS · 22 DAYS', '1994'],
  bacrot: ['ÉTIENNE BACROT', '14 YEARS · 2 MONTHS', '1997'],
  pono: ['RUSLAN PONOMARIOV', '14 YEARS · 17 DAYS', '1997'],
  bu: ['BU XIANGZHI', '13 YEARS · 10 MONTHS · 13 DAYS', '1999'],
  karjakin: ['SERGEY KARJAKIN', '12 YEARS · 7 MONTHS', '2002'],
  mishra: ['ABHIMANYU MISHRA', '12 YEARS · 4 MONTHS · 25 DAYS', '2021'],
};
const TEX = new Map();
function plaqueTex(id) {
  if (TEX.has(id)) return TEX.get(id);
  const [name, age, year] = REC[id], w = 1080, h = 750, c = makeCanvas(w, h), g = c.getContext('2d'), r = rng(name.length * 13 + 1);
  g.fillStyle = '#3A2608'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#FBE3A0'); gr.addColorStop(0.42, '#DDAE48'); gr.addColorStop(0.58, '#F4D27C'); gr.addColorStop(1, '#AE7E2A');
  g.fillStyle = gr; g.fillRect(16, 16, w - 32, h - 32);
  for (let i = 0; i < 220; i++) { g.fillStyle = `rgba(255,250,230,${(0.03 + r() * 0.06).toFixed(3)})`; g.fillRect(16, 16 + r() * (h - 32), w - 32, 1 + r() * 2); }  // brushed metal
  g.strokeStyle = 'rgba(96,62,10,0.75)'; g.lineWidth = 5; g.strokeRect(50, 50, w - 100, h - 100);
  const eng = (s, y, size, font, sp) => {  // engraved: dark letters with a light lip under them, shrunk to fit
    g.font = font(size); g.letterSpacing = sp + 'px'; const k = Math.min(1, (w - 170) / g.measureText(s).width);
    g.font = font(Math.floor(size * k)); g.textAlign = 'center';
    g.fillStyle = 'rgba(255,244,210,0.6)'; g.fillText(s, w / 2, y + 3); g.fillStyle = '#4A2E06'; g.fillText(s, w / 2, y);
  };
  eng('YOUNGEST GRANDMASTER EVER', 150, 38, s => sans(s, 900), 7);
  eng(name, 345, 112, s => serif(s, 700), 2);
  g.fillStyle = 'rgba(74,46,6,0.6)'; g.fillRect(w / 2 - 70, 395, 140, 5);
  eng(age, 488, 54, s => sans(s, 900), 2);
  eng(year, 640, 86, s => serif(s, 700), 8);
  TEX.set(id, c); return c;
}
const PL = { x0: -1.8, x1: 1.8, y0: 3.45, y1: 5.95, cy: 4.7 };
const plq = (u, v, k = 1, dz = 0) => [lerp(PL.x0, PL.x1, u) * k, PL.cy + (lerp(PL.y1, PL.y0, v) - PL.cy) * k, dz];  // (u, v) on the plaque, v down
function plaque(g, id, { k = 1, dz = 0, a = 1 } = {}) {
  if (k === 1 && dz === 0) box(g, B, [PL.x0, PL.y0, 0.01], [PL.x1, PL.y1, 0.16], { top: '#8A6424', side: '#5A3E12', front: '#6A4A18' });
  picture(g, B, plaqueTex(id), plq(0, 0, k, dz), plq(1, 0, k, dz), plq(0, 1, k, dz), { tone: 'color', fx: 0.5, fy: 0.5, zoom: 1, border: '#4A3210', pad: 0.06, a });
}
const plaqueRect = () => {
  const P = [plq(0, 0), plq(1, 0), plq(0, 1), plq(1, 1)].map(p => B.project(...p)), xs = P.map(p => p.x), ys = P.map(p => p.y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
};
// cracks spreading from a point on the plaque (amt 0..1), drawn in the plaque's own plane
function cracks(g, amt, seed = 4) {
  if (amt <= 0) return;
  const r = rng(seed), P = (u, v) => B.project(...plq(u, v));
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < 9; i++) {
    const ang = i / 9 * Math.PI * 2 + r() * 0.5, L = (0.3 + r() * 0.5) * amt;
    let u = 0.56, v = 0.46; const pts = [P(u, v)];
    for (let s = 1; s <= 6; s++) { const a2 = ang + (r() - 0.5) * 0.9; u += Math.cos(a2) * L / 6 * 0.7; v += Math.sin(a2) * L / 6; pts.push(P(clamp(u), clamp(v))); }
    for (const [col, lw, dy] of [['rgba(255,246,220,0.7)', 5, 1.5], ['#2A1804', 2.6, 0]]) {
      g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach((p, j) => j ? g.lineTo(p.x, p.y + dy) : g.moveTo(p.x, p.y + dy)); g.stroke();
    }
  }
  g.restore();
}
const PED = [[-6, 8], [6, 8], [-7, 15], [7, 15], [-8, 22], [8, 22]];
let BLANK = null;  // the older plaques in the dark: gold, a frame, no words
const blankTex = () => {
  if (BLANK) return BLANK;
  const w = 540, h = 375, c = makeCanvas(w, h), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#E8C878'); gr.addColorStop(0.5, '#B8892E'); gr.addColorStop(1, '#8A6420');
  g.fillStyle = '#3A2608'; g.fillRect(0, 0, w, h); g.fillStyle = gr; g.fillRect(8, 8, w - 16, h - 16);
  g.strokeStyle = 'rgba(80,50,8,0.7)'; g.lineWidth = 4; g.strokeRect(26, 26, w - 52, h - 52);
  g.fillStyle = 'rgba(74,46,6,0.45)'; for (const [y, ww] of [[110, 300], [180, 380], [240, 220], [300, 160]]) g.fillRect(w / 2 - ww / 2, y, ww, 14);
  return BLANK = c;
};
const HV = (yaw = 0, dist = 9, pitch = 0.08, y = 4.7) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [0, y, 0] });
const SLAM = 0.5;  // the new plaque lands this long after the old one breaks
// rec: the plaque on the pedestal; with breakT, `prev` cracks, shatters at breakT and `rec` slams in from the lens
function hall(g, lt, t, keys, { rec = 'fischer', prev = null, breakT = null, crack = 0, shadow = 0, empty = false } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, 'hall');
  quad(g, [[-60, 0, -40], [60, 0, -40], [60, 0, 80], [-60, 0, 80]], '#0A0F1E');
  for (const [x, z] of [...PED].sort((p, q) => q[1] - p[1])) {  // the older records, far to near
    pool(g, B, x, 0.02, z, 2.4, '#FFE2A8', 0.2);
    box(g, B, [x - 1.0, 0, z - 0.7], [x + 1.0, 2.6, z + 0.7], { top: '#252C4C', side: '#10142C', front: '#182040' });
    picture(g, B, blankTex(), [x - 1.2, 4.3, z], [x + 1.2, 4.3, z], [x - 1.2, 2.64, z], { tone: 'color', fx: 0.5, fy: 0.5, zoom: 1, border: '#3A2608', pad: 0.04, a: 0.7 });
  }
  pool(g, B, 0, 0.02, 0, 3.4, '#FFE2A8', 0.32);
  box(g, B, [-1.4, 0, -1.0], [1.4, 3.25, 1.0], { top: '#2C3456', side: '#141A32', front: '#1C2444' });
  box(g, B, [-2.05, 3.25, -0.4], [2.05, 3.45, 0.4], { top: '#D4A64A', side: '#6A4A18', front: '#9A7028' });
  const landT = breakT === null ? null : breakT + SLAM;
  if (breakT === null) { if (!empty) plaque(g, rec); cracks(g, crack); }
  else if (t < breakT) { if (prev) { plaque(g, prev); cracks(g, seg(t, breakT - 0.3, breakT)); } }
  else {
    if (prev) { const [x, y, w, h] = plaqueRect(); shatterImage(g, plaqueTex(prev), x, y, w, h, t - breakT, { cols: 6, rows: 4, seed: 9, power: 1000, gravity: 2600, spin: 8, life: 1.0, oy: 0.46, ox: 0.56 }); }
    if (rec && t >= breakT + SLAM - 0.2) {
      const u = seg(t, landT - 0.2, landT, ease.in);
      plaque(g, rec, u < 1 ? { k: lerp(1.9, 1, u), dz: -lerp(4.5, 0, u), a: clamp(u * 3) } : {});
    }
    if (rec && t >= landT) {
      const c = B.project(0, PL.cy, 0), base = B.project(0, 3.35, 0);
      glint(g, c.x + 120, c.y - 80, t, landT + 0.05, { r: 260, life: 0.45, color: '#FFF4D0' });
      shockwave(g, base.x, base.y, t, landT, { r0: 60, r1: 620, life: 0.5, color: GOLD, lw: 12, squash: 0.3 });
      burst(g, c.x, c.y, t, landT, { n: 26, color: '#FFE2A0', speed: 900, life: 0.7, size: 5, seed: 3 });
    }
  }
  if (shadow > 0) {  // a kid's shadow climbs over the plaque
    g.save(); g.globalAlpha *= 0.72 * clamp(shadow * 2.5);
    drawChar(g, 'roman11', { x: lerp(W * 0.66, W * 0.5, ease.out(shadow)), y: lerp(H * 1.08, H * 0.74, ease.out(shadow)), s: lerp(2.6, 3.2, shadow), e: EXPR.neutral, t, silhouette: true, shade: 'brightness(0)' });
    g.restore();
  }
  spotCone(g, B, { top: [0, 18, -1], base: [0, 0, 0], r0: 0.5, r1: 3.8, a: 0.2, t, color: '#FFE9C0' });
  lowKey(g, { cy: H * 0.44, a: 0.3 });
}

// ---------- a year punches in from the lens (gold Cinzel numerals) ----------
function yearSlam(g, lt, t, year, hitT, sub, { tint = '#3A220E', ember = '#FFC870' } = {}) {
  const bg = g.createRadialGradient(W / 2, H * 0.44, 40, W / 2, H * 0.46, H * 0.8); bg.addColorStop(0, tint); bg.addColorStop(1, '#05070C');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 12, seed: +year % 50, y0: 0.05, y1: 0.9, a: 0.14, colors: [ember, '#FFE9C8'] });
  embers(g, t, { n: 36, seed: +year % 13, a: 0.45, color: ember });
  const u = seg(t, hitT - 0.16, hitT, lin), land = t >= hitT;
  if (t > hitT - 0.16) {
    const k = lerp(3.0, 1, ease.in(u)) * (land ? 1 + 0.05 * Math.exp(-(t - hitT) * 10) + 0.04 * (t - hitT) : 1);
    g.save(); g.translate(W / 2, 880); g.scale(k, k); g.globalAlpha = clamp(u * 2.5);
    g.font = serif(300, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(year, 10, 20);
    const gr = g.createLinearGradient(0, -150, 0, 150); gr.addColorStop(0, '#FFF2C8'); gr.addColorStop(1, '#C8902E'); g.fillStyle = gr; g.fillText(year, 0, 0);
    g.restore();
    if (land) qaRect(g, W / 2 - 400, 750, 800, 260, 'text', year);
  }
  if (land) shockwave(g, W / 2, 880, t, hitT, { r0: 80, r1: 720, life: 0.5, color: GOLD, lw: 12, squash: 1 });
  if (sub) tag(g, sub, 1120, seg(t, hitT + 0.12, hitT + 0.25), { color: '#FFE9B0', size: 30 });
}

// ---------- the cascade: a card per record holder, the bust lit from behind, the age punching in on the name ----------
function recCard(g, lt, t, who, id, flag, ageTxt, hitT, tint, glow) {
  const [name, , year] = REC[id];
  const bg = g.createRadialGradient(W / 2, H * 0.38, 40, W / 2, H * 0.42, H * 0.85); bg.addColorStop(0, tint); bg.addColorStop(1, '#05070C');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 10, seed: name.length, y0: 0.03, y1: 0.9, a: 0.12, colors: ['#FFD9A0', '#CFE2FF'] });
  const halo = g.createRadialGradient(W / 2, 720, 0, W / 2, 720, 640); halo.addColorStop(0, rgba(glow, 0.5)); halo.addColorStop(1, rgba(glow, 0));
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  drawChar(g, who, { x: W / 2, y: 790 - ease.out(clamp(lt / 0.6)) * 26, s: 1.5, e: EXPR.focus, t });
  const fl = g.createLinearGradient(0, 960, 0, H); fl.addColorStop(0, 'rgba(5,7,12,0)'); fl.addColorStop(0.3, 'rgba(5,7,12,0.94)'); fl.addColorStop(1, '#05070C');
  g.fillStyle = fl; g.fillRect(0, 960, W, H - 960);
  const k = lerp(1.3, 1, seg(t, hitT, hitT + 0.16, ease.out)), a = seg(t, hitT - 0.04, hitT + 0.04);
  g.save(); g.globalAlpha *= a; g.translate(W / 2, 310); g.scale(k, k); g.textAlign = 'center'; g.font = serif(76, 700);
  const s = Math.min(1, 940 / g.measureText(name).width); g.scale(s, s);
  g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = 'rgba(8,6,4,0.7)'; g.strokeText(name, 0, 0); g.fillStyle = '#FFFFFF'; g.fillText(name, 0, 0);
  g.restore(); qaRect(g, 70, 240, W - 140, 90, 'text', name);
  counter(g, ageTxt, `${year} · ${flag}`, { y: 1090, size: 120, color: GOLD, labelColor: '#FFFFFF', a });
  if (t >= hitT) shockwave(g, W / 2, 1050, t, hitT, { r0: 60, r1: 560, life: 0.45, color: GOLD, lw: 10, squash: 0.35 });
}

// ---------- the record, year by year: a falling staircase of ages ----------
const YR0 = 1955, YR1 = 2030, AG0 = 12, AG1 = 16;
const CX = yr => 150 + (yr - YR0) / (YR1 - YR0) * 820, CY = a => 500 + (AG1 - a) / (AG1 - AG0) * 600;
const STEPS = [[1958.7, 15.503], [1991.95, 15.41], [1994.08, 14.393], [1997.22, 14.167], [1997.82, 14.047], [1999.81, 13.869], [2002.61, 12.583], [2021.5, 12.402]];
function ageChart(g, lt, t, pen, { l1, l2, younger = 0, span = 0, years = null } = {}) {
  darkCard(g, '#0E1A36', '#05070C');
  bokeh(g, t, { n: 10, seed: 21, y0: 0.05, y1: 0.9, a: 0.1, colors: ['#FFD9A0', '#A8CCFF'] });
  cardTitle(g, l1, l2);
  g.save(); g.font = sans(34, 900); g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let a = AG0; a <= AG1; a++) {
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(140, CY(a) - 1, 840, 2);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(String(a), 122, CY(a));
  }
  g.textAlign = 'left'; g.font = sans(26, 900); g.letterSpacing = '4px'; g.fillStyle = GOLD; g.fillText('AGE', 66, 452);
  g.textAlign = 'center'; g.font = sans(32, 900); g.letterSpacing = '0px'; g.fillStyle = 'rgba(255,255,255,0.7)';
  for (const y of [1960, 1980, 2000, 2020]) g.fillText(String(y), CX(y), 1150);
  g.restore();
  qaRect(g, 60, 430, W - 120, 740, 'text', 'chart');
  // the step line up to the pen
  const pts = [];
  STEPS.forEach(([yr, a], i) => {
    if (yr > pen) return;
    if (i > 0) pts.push([CX(yr), CY(STEPS[i - 1][1])]);
    pts.push([CX(yr), CY(a)]);
  });
  const last = STEPS.filter(([yr]) => yr <= pen).pop();
  if (last) pts.push([CX(Math.min(pen, YR1)), CY(last[1])]);
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = 'rgba(242,193,78,0.6)'; g.shadowBlur = 16;
  g.strokeStyle = GOLD; g.lineWidth = 10; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore();
  STEPS.forEach(([yr, a]) => { if (yr <= pen) { g.fillStyle = '#FFF4D0'; g.beginPath(); g.arc(CX(yr), CY(a), 13, 0, 7); g.fill(); g.strokeStyle = GOLD; g.lineWidth = 5; g.stroke(); } });
  const label = (txt, x, y, align, yr, size = 32) => { if (pen < yr) return; g.save(); g.font = sans(size, 900); g.letterSpacing = '1px'; g.textAlign = align; g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = '#0B1530'; g.strokeText(txt, x, y); g.fillStyle = '#FFFFFF'; g.fillText(txt, x, y); g.restore(); };
  label('FISCHER 1958', CX(1958.7) - 16, CY(15.503) - 30, 'left', 1958.7);
  label('POLGÁR 1991', CX(1991.95) + 10, CY(15.41) - 30, 'center', 1991.95);
  label('LEKO · BACROT', CX(1993) - 24, CY(14.2), 'right', 1997.22, 28);
  label('PONOMARIOV · BU', CX(1993) - 24, CY(14.2) + 38, 'right', 1999.81, 28);
  label('KARJAKIN 2002', CX(2002.61) - 24, CY(12.583) + 46, 'right', 2002.61);
  label('MISHRA 2021', CX(2021.5), CY(12.402) + 50, 'center', 2021.5);
  if (younger > 0) {  // a big arrow down: younger
    g.save(); g.globalAlpha *= younger; const x = CX(2012), y0 = CY(15.3), y1 = CY(13.6);
    g.strokeStyle = RED; g.fillStyle = RED; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1 - 30); g.stroke();
    g.beginPath(); g.moveTo(x - 40, y1 - 40); g.lineTo(x + 40, y1 - 40); g.lineTo(x, y1 + 20); g.closePath(); g.fill();
    g.font = sans(36, 900); g.letterSpacing = '3px'; g.textAlign = 'left'; g.fillText('YOUNGER', x + 34, (y0 + y1) / 2); g.restore();
  }
  if (span > 0) {  // Karjakin's flat line: a bracket counting the years
    const x0 = CX(2002.61) + 8, x1 = Math.max(x0 + 2, CX(Math.min(pen, 2021.5))), y = CY(12.583) - 34;
    g.save(); g.globalAlpha *= span; g.strokeStyle = '#FFFFFF'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0, y + 14); g.lineTo(x0, y); g.lineTo(x1, y); g.lineTo(x1, y + 14); g.stroke();
    g.font = sans(48, 900); g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.fillText(`${years} YEARS`, (CX(2002.61) + CX(2021.45)) / 2 + 24, y - 22); g.restore();
  }
}

// ---------- "12y 7m 17d": the numbers heavy, the unit letters small ----------
function ymd(g, x, y, parts, { size = 120, color = '#FFFFFF', colors = null } = {}) {
  const segs = []; parts.forEach(([n, u], i) => { segs.push([String(n), size, colors?.[i] || color], [u, size * 0.42, color]); if (i < parts.length - 1) segs.push([' ', size * 0.5, color]); });
  g.save(); g.textBaseline = 'alphabetic'; let w = 0;
  for (const [s, sz] of segs) { g.font = sans(sz, 900); w += g.measureText(s).width + 4; }
  let cx = x - w / 2; g.lineJoin = 'round';
  for (const [s, sz, col] of segs) { g.font = sans(sz, 900); g.lineWidth = sz * 0.08; g.strokeStyle = 'rgba(8,6,4,0.6)'; g.strokeText(s, cx, y); g.fillStyle = col; g.fillText(s, cx, y); cx += g.measureText(s).width + 4; }
  g.restore(); qaRect(g, x - w / 2, y - size * 0.75, w, size * 0.8, 'text', 'age');
}
const rowLabel = (g, text, y, color = '#FFFFFF') => { g.save(); g.font = sans(30, 900); g.letterSpacing = '5px'; g.textAlign = 'center'; g.fillStyle = color; g.fillText(text, W / 2, y); g.restore(); qaRect(g, 120, y - 30, W - 240, 40, 'text', text); };

// Gukesh, January 2019: the days run past Karjakin's record
function missCard(g, lt, t, a, d17, missT) {
  darkCard(g, '#3A1C08', '#0A0503');
  embers(g, t, { n: 30, seed: 19, a: 0.35, color: '#FFB347' });
  cardTitle(g, 'AGE AT GRANDMASTER', 'THE RECORD VS THE BOY FROM CHENNAI');
  rowLabel(g, 'KARJAKIN · THE RECORD', 540, GOLD);
  ymd(g, W / 2, 680, [[12, 'Y'], [7, 'M'], [0, 'D']], { size: 120, color: GOLD });
  const d = Math.round(lerp(0, 17, seg(t, a + 0.25, d17, lin)));
  rowLabel(g, 'GUKESH · 2019', 830);
  ymd(g, W / 2, 970, [[12, 'Y'], [7, 'M'], [d, 'D']], { size: 120, colors: [null, null, d >= 17 ? RED : '#FFFFFF'] });
  if (t >= missT) stamp(g, 'MISSED BY 17 DAYS', W / 2, 1110, lt, missT - (t - lt), { color: RED, size: 60, rot: -0.06 });
}
// the age on the day, tile by tile (Mishra)
function ageClock(g, lt, t, yT, mT, d0, d1) {
  darkCard(g, '#0E1838', '#05070C');
  bokeh(g, t, { n: 10, seed: 33, y0: 0.05, y1: 0.9, a: 0.12, colors: ['#FFFFFF', '#FFB0A8', '#B0CCFF'] });
  cardTitle(g, 'AGE ON THE DAY', 'BUDAPEST · JUNE 30, 2021');
  const tiles = [['YEARS', 12, yT, null], ['MONTHS', 4, mT, null], ['DAYS', 25, d0, d1]];
  tiles.forEach(([lab, v, t0, t1], i) => {
    const x = 200 + i * 340, y = 740, on = t >= t0;
    const n = t1 ? Math.round(lerp(1, v, seg(t, t0, t1, lin))) : v, k = on ? lerp(1.25, 1, seg(t, t0, t0 + 0.18, ease.back)) : 1;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = on ? (i === 2 && t >= t1 ? GOLD : '#F4EEE2') : 'rgba(255,255,255,0.08)'; g.beginPath(); g.roundRect(-140, -170, 280, 300, 22); g.fill();
    g.textAlign = 'center'; g.font = sans(170, 900); g.fillStyle = on ? '#16120E' : 'rgba(255,255,255,0.25)'; g.fillText(on ? String(n) : '–', 0, 40);
    g.font = sans(26, 900); g.letterSpacing = '5px'; g.fillStyle = on ? '#5A4A30' : 'rgba(255,255,255,0.3)'; g.fillText(lab, 0, 100);
    g.restore();
  });
  qaRect(g, 50, 560, W - 100, 320, 'text', 'tiles');
}
// Mishra vs Oro: age at the title, the gap between the bars
function oroCard(g, lt, t, t0, gapT) {
  darkCard(g, '#0E2A44', '#05101C');
  bokeh(g, t, { n: 12, seed: 8, y0: 0.05, y1: 0.9, a: 0.14, colors: ['#DDF0FF', '#FFE9A0'] });
  cardTitle(g, 'AGE AT GRANDMASTER', 'THE TWO YOUNGEST EVER');
  const lo = 12.0, hi = 12.75, x0 = 90, wmax = 900;
  const rows = [['ABHIMANYU MISHRA · 2021', 12.402, GOLD, [[12, 'Y'], [4, 'M'], [25, 'D']], t0], ['FAUSTINO ORO · 2026', 12.571, SKY, [[12, 'Y'], [6, 'M'], [26, 'D']], t0 + 0.3]];
  rows.forEach(([name, v, col, parts, ta], i) => {
    if (t < ta) return;
    const u = ease.out(seg(t, ta, ta + 0.5, lin)), y = 600 + i * 260, wv = wmax * (v - lo) / (hi - lo) * u;
    g.save(); g.textAlign = 'left'; g.font = sans(32, 900); g.letterSpacing = '2px'; g.fillStyle = '#FFFFFF'; g.fillText(name, x0, y - 24); g.restore();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x0, y, wmax, 110);
    const gr = g.createLinearGradient(x0, 0, x0 + wv, 0); gr.addColorStop(0, mix(col, '#000000', 0.35)); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(x0, y, Math.max(10, wv), 110);
    g.save(); g.globalAlpha *= seg(t, ta + 0.35, ta + 0.5); ymd(g, x0 + 250, y + 82, parts, { size: 64, color: '#16120E' }); g.restore();
    qaRect(g, x0, y - 56, wmax, 42, 'text', name);
  });
  if (t >= gapT) {  // the gap: from Mishra's bar end down to Oro's
    const xa = x0 + wmax * (12.402 - lo) / (hi - lo), xb = x0 + wmax * (12.571 - lo) / (hi - lo), y = 1010, k = pop(t, gapT);
    g.save(); g.strokeStyle = RED; g.lineWidth = 5; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(xa, 600); g.lineTo(xa, y); g.stroke(); g.setLineDash([]);
    g.lineWidth = 7; g.beginPath(); g.moveTo(xa, y - 16); g.lineTo(xa, y); g.lineTo(xb, y); g.lineTo(xb, y - 16); g.stroke(); g.restore();
    badge(g, '2 MONTHS SHORT', (xa + xb) / 2 + 40, y + 70, { color: RED, size: 46, scale: k });
  }
}
// Roman's norms: two checks, one empty slot
function check(g, x, y, s, col = '#1E8E3E') {
  g.save(); g.strokeStyle = col; g.lineWidth = 16 * s; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x - 50 * s, y); g.lineTo(x - 14 * s, y + 36 * s); g.lineTo(x + 56 * s, y - 44 * s); g.stroke(); g.restore();
}
function normsCard(g, lt, t, c1, c2, q3) {
  darkCard(g, '#0B1530', '#05070C');
  bokeh(g, t, { n: 10, seed: 44, y0: 0.05, y1: 0.9, a: 0.12, colors: ['#FFE9C8', '#9FD0FF'] });
  cardTitle(g, 'THE GRANDMASTER TITLE', '3 NORMS + A 2500 RATING');
  const slots = [['NORM 1', 'JUNE 2026', 'MONGOLIA', c1], ['NORM 2', 'OCT 2026', 'SERBIA', c2], ['NORM 3', '???', '', q3]];
  slots.forEach(([lab, l2, l3, tt], i) => {
    const x = 210 + i * 330, y = 740, done = i < 2 && t >= tt, k = done ? pop(t, tt) : 1;
    g.save(); g.translate(x, y); g.scale(k, k);
    if (i < 2) { g.fillStyle = done ? '#F4EEE2' : 'rgba(255,255,255,0.08)'; g.beginPath(); g.roundRect(-140, -180, 280, 340, 22); g.fill(); }
    else { const p = t >= tt ? 0.5 + 0.5 * Math.sin((t - tt) * 9) : 0; g.strokeStyle = rgba(GOLD, 0.5 + 0.5 * p); g.lineWidth = 6; g.setLineDash([18, 12]); g.beginPath(); g.roundRect(-140, -180, 280, 340, 22); g.stroke(); g.setLineDash([]); }
    g.textAlign = 'center'; g.font = sans(30, 900); g.letterSpacing = '4px'; g.fillStyle = done ? '#16120E' : 'rgba(255,255,255,0.75)'; g.fillText(lab, 0, -120);
    if (done) check(g, 0, -10, 1.4); else if (i === 2) { g.font = sans(150, 900); g.fillStyle = GOLD; g.fillText('?', 0, 40); }
    g.font = sans(24, 900); g.letterSpacing = '2px'; g.fillStyle = done ? '#5A4A30' : 'rgba(255,255,255,0.5)'; g.fillText(l2, 0, 100); if (l3) g.fillText(l3, 0, 134);
    g.restore();
  });
  qaRect(g, 60, 550, W - 120, 360, 'text', 'norms');
  tag(g, '+29 RATING POINTS TO GO', 1110, seg(t, q3 + 0.2, q3 + 0.35), { color: '#FFE9B0', size: 30 });
}
// the deadline: calendar pages flip to February 4, 2027 (his 12th birthday)
const MONTHS = ['OCTOBER 2026', 'NOVEMBER 2026', 'DECEMBER 2026', 'JANUARY 2027', 'FEBRUARY 2027'];
function deadline(g, lt, t, t0, febT) {
  darkCard(g, '#0B1530', '#05070C');
  bokeh(g, t, { n: 10, seed: 51, y0: 0.05, y1: 0.9, a: 0.12, colors: ['#FFE9C8', '#9FD0FF'] });
  cardTitle(g, 'BEFORE HE TURNS 12', 'TO BE THE FIRST GM UNDER 12');
  const dt = (febT - t0) / (MONTHS.length - 1), f = clamp((t - t0) / dt, 0, MONTHS.length - 1), i0 = Math.floor(f);
  const flip = i0 < MONTHS.length - 1 ? clamp((f - i0 - 0.6) / 0.4) : 0, i = flip > 0.5 ? i0 + 1 : i0, sy = Math.max(0.03, Math.abs(Math.cos(flip * Math.PI)));
  const x = W / 2, y = 760, w = 560, h = 560;
  g.save(); g.translate(x, y); g.scale(1, sy); g.translate(0, -h / 2);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#F7F3EA'; g.beginPath(); g.roundRect(-w / 2, 0, w, h, 20); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#D8433A'; g.beginPath(); g.roundRect(-w / 2, 0, w, 110, [20, 20, 0, 0]); g.fill();
  g.textAlign = 'center'; g.font = sans(40, 900); g.letterSpacing = '4px'; g.fillStyle = '#FFFFFF'; g.fillText(MONTHS[i], 0, 72);
  if (i < MONTHS.length - 1) {  // a plain month grid
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) { g.fillStyle = 'rgba(30,30,40,0.12)'; g.fillRect(-w / 2 + 40 + c * 70, 150 + r * 76, 54, 56); }
  } else {
    g.font = sans(300, 900); g.letterSpacing = '0px'; g.fillStyle = '#1A1A22'; g.fillText('4', 0, 420);
    const u = seg(t, febT, febT + 0.25, ease.out); g.strokeStyle = RED; g.lineWidth = 12; g.beginPath(); g.ellipse(0, 320, 150, 170, 0, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); g.stroke();
  }
  g.restore();
  qaRect(g, x - w / 2, y - h / 2, w, h, 'text', 'calendar');
  tag(g, 'HIS 12TH BIRTHDAY', 1130, seg(t, febT + 0.15, febT + 0.3), { color: '#FFE9B0', size: 30 });
}

// ---------- the CTA: the prodigies in a row with their ages, the last spot is the viewer's ----------
const LINE = [['bobby13', '15', 'FISCHER'], ['judit', '15', 'POLGÁR'], ['karjakin12', '12', 'KARJAKIN'], ['gukesh12', '12', 'GUKESH'],
  ['mishra12', '12', 'MISHRA'], ['oro12', '12', 'ORO'], ['roman11', '11?', 'ROMAN'], ['rival', '?', 'YOU']];
const LX = i => -10.5 + i * 3 + (i === 7 ? 1.5 : 0);  // the viewer's spot stands a little apart
const LPOSE = (x, dist = 12, yaw = 0) => ({ yaw, pitch: 0.12, dist, fov: 1500, cy: H * 0.5, target: [x, 3.2, 9.4] });
function lineup(g, lt, t, keys, { youLit = null } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, 'hall');
  quad(g, [[-60, 0, -40], [60, 0, -40], [60, 0, 80], [-60, 0, 80]], '#0A0F1E');
  LINE.forEach(([who], i) => {
    const you = who === 'rival', lit = you ? (youLit !== null && t >= youLit ? 1 : 0.35) : 1;
    spotCone(g, B, { top: [LX(i), 15, 9.4], base: [LX(i), 0, 9.4], r0: 0.35, r1: 1.7, a: (you ? 0.3 : 0.14) * lit, t, dust: 8, seed: 5 + i, color: you ? '#FFE0B0' : '#E2ECF6' });
    if (you) { const hp = B.project(LX(i), 3.2, 9.6); if (hp.z > 0.6) rim(g, hp.x, hp.y, hp.s * 3.2, '#FFD58A', 0.55 * lit); }  // a warm halo so the empty spot reads
    const hp = B.project(LX(i), 3.1, 9.4); if (hp.x < -260 || hp.x > W + 260) return;  // off the frame: not drawn
    actor(g, B, who, { x: LX(i), y: who === 'judit' || who === 'bobby13' ? 3.1 : 2.95, z: 9.4, k: who === 'judit' || who === 'bobby13' ? 1 : 0.93, e: you ? 'neutral' : 'happy', t, face: -1,
      ...(you ? { silhouette: true, shade: 'brightness(0.08)' } : {}) });
  });
  box(g, B, [-16, -4, 7.6], [16, 1.3, 8.4], { top: '#2C3456', side: '#141A32', front: '#1C2444' });  // the long desk (down through the stage) hides where the busts end
  quad(g, [[-16, 1.3, 7.59], [16, 1.3, 7.59], [16, 1.22, 7.59], [-16, 1.22, 7.59]], '#D4A64A');
  lowKey(g, { cy: H * 0.45, a: 0.3 });
  LINE.forEach(([who, age, name], i) => {  // the age and the name over each head; the viewer's spot gets a big ? on the face
    const you = who === 'rival', p = B.project(LX(i), 6.0, 9.4), q = B.project(LX(i), 5.25, 9.4), f = B.project(LX(i), 2.95, 9.4);
    if (p.z < 0.6 || p.x < 110 || p.x > W - 110) return;
    g.save(); g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowOffsetY = 5;
    if (you) { g.font = serif(Math.round(f.s * 1.5), 700); g.textBaseline = 'middle'; g.fillStyle = GOLD; g.fillText('?', f.x, f.y + f.s * 0.1); }
    else {
      g.font = serif(Math.round(p.s * 1.1), 700); g.fillStyle = '#FFFFFF'; g.fillText(age, p.x, p.y);
      g.font = sans(Math.round(q.s * 0.3), 900); g.letterSpacing = '3px'; g.fillStyle = GOLD; g.fillText(name, q.x, q.y);
    }
    g.restore();
  });
}

// a real photograph in 2.5D, dropped below a dark band that carries the title (names sit at the top, above the head)
const DROP = 330;
function photoShot(g, lt, ph, { from, to, dur }) {
  g.fillStyle = '#0B0E11'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, DROP); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, DROP - 20, 0, DROP + 250); gr.addColorStop(0, '#0B0E11'); gr.addColorStop(1, 'rgba(11,14,17,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, DROP + 250);
}
function photoTitle(g, lt, name, sub, credit) {
  nameTitle(g, lt, name, sub, { y: 200, size: 66 });
  g.save(); g.globalAlpha *= seg(lt, 0.2, 0.4) * 0.75; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = C.cream;
  g.fillText(credit, W / 2, 314); g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const photo = (a, ph, view, title, o = {}) => shot(a, (g, lt, t, sh) => photoShot(g, lt, ph, { ...view, dur: len(sh) }), { trans: 'cut', noJump: true, grade: 'warm', hud: (g, lt) => photoTitle(g, lt, ...title), ...o });
  // a plaque break: the old record cracks and shatters on the word, the new one slams onto the pedestal
  const breakShot = (a, prev, rec, breakT, keys, o = {}) => {
    shot(a, (g, lt, t, sh) => hall(g, lt, t, typeof keys === 'function' ? keys(sh) : keys, { rec, prev, breakT }), { trans: 'cut', noJump: true, ...o });
    if (prev) cue(breakT, 'glass', 0.28); boom(breakT + SLAM, 0.95);
  };

  // ======================= HOOK: 33 years untouched; it falls; an 11-year-old is coming for it =======================
  const yrsT = w('hook1', 'years,'), noT = w('hook1', 'no'), bobT = w('hook1', 'Bobby'), fallT = w('hook2', 'fall.'), andT = w('hook2', 'And'), elT = w('hook2', 'eleven-year-old'), comT = w('hook2', 'is');
  shot(0, (g, lt, t) => hall(g, lt, t, [[0, HV(-0.42, 6.4, -0.02, 5.0)], [noT, HV(-0.3, 5.6, -0.02, 4.9)]], { rec: 'fischer' }),
    { noJump: true, hud: (g, lt, t) => {
      bigText(g, 'THE YOUNGEST', 'GRANDMASTERS', 250, { a: 1 - seg(t, 0.85, 1.0) });
      counter(g, '33 YEARS', 'UNBROKEN', { y: 330, size: 150, color: GOLD, labelColor: '#FFFFFF', a: seg(t, 1.0, 1.08) });
    } });
  cue(1.0 - BOOM_HIT, 'boom_move', 0.6);
  const Y0 = noT, Y1 = bobT - 0.15;
  shot(noT, (g, lt, t, sh) => hall(g, lt, t, flyAt(HV(1.05, 12.5, 0.2, 4.2), HV(0.55, 11, 0.14, 4.4), 0.14, len(sh)), { rec: 'fischer' }),
    { trans: 'cut', hud: (g, lt, t) => counter(g, String(Math.round(lerp(1958, 1991, ease.inOut(seg(t, Y0 + 0.05, Y1, lin))))), 'NO ONE COULD TOUCH IT', { y: 330, size: 160, color: '#FFFFFF', labelColor: GOLD }) });
  cue(noT - 0.08, 'whoosh_fast', 0.35); for (let i = 0; i < 2; i++) cue(Y0 + 0.15 + i * 0.3, 'clock_tick', 0.18);
  shot(bobT - 0.04, (g, lt, t, sh) => portrait(g, lt, t, 'bobby13', 'focus', { back: 'retro', pieces: at(12), kid: false, keys: flyAt(FRONT(0.85, -0.1), FRONT(0.12, 0.45), 0.14, len(sh)) }),
    { trans: 'cut', grade: 'warm', hud: (g, lt) => placeStamp(g, lt, "Bobby Fischer's record", '1958', { y: 200, t0: 0.1 }) });
  cue(bobT - 0.1, 'whoosh_fast', 0.3);
  shot(s('hook2') - 0.03, (g, lt, t, sh) => hall(g, lt, t, [[0, HV(0.08, 8.6)], [len(sh), HV(0.02, 7.6)]], { rec: null, prev: 'fischer', breakT: fallT }),
    { trans: 'cut', noJump: true });
  cue(fallT, 'glass', 0.32); boom(fallT + 0.04, 0.9);
  shot(andT - 0.05, (g, lt, t, sh) => portrait(g, lt, t, 'roman11', 'focus', { back: 'night', pieces: at(22), dark: 1 - seg(t, elT - 0.1, elT + 0.15),
    keys: flyAt(FRONT(-0.75, -0.3), FRONT(-0.08, 0.6), elT - sh.a, len(sh), 0.3) }),
    { trans: 'cut', hud: (g, lt, t) => counter(g, 'AGE 11', 'RIGHT NOW', { y: 300, size: 150, color: '#FFFFFF', labelColor: GOLD, a: seg(t, elT, elT + 0.08) }) });
  cue(elT - 0.12, 'whoosh_fast', 0.35); boom(elT + 0.02, 0.85);
  const coming = comT - 0.06;
  shot(coming, (g, lt, t, sh) => hall(g, lt, t, [[0, HV(-0.1, 8.4)], [len(sh), HV(-0.02, 7.0)]], { rec: 'mishra', shadow: seg(t, coming + 0.1, s('fis') - 0.2, lin) }),
    { trans: 'cut', noJump: true });
  cue(coming + 0.1, 'whoosh_deep', 0.35);

  // ======================= 1958: FISCHER, 15 =======================
  const f58 = s('fis'), fisT = w('fis', 'Fischer'), gmT = w('fis', 'grandmaster'), f15 = w('fis', 'fifteen,'), youT = w('fis', 'youngest');
  shot(f58 - 0.06, (g, lt, t) => yearSlam(g, lt, t, '1958', f58 + 0.04, 'THE RECORD IS SET'), { trans: 'whip', info: true, grade: 'warm' });
  boom(f58 + 0.04, 0.9);
  photo(fisT - 0.5, PH.fischer1956, { from: { x: 0.62, y: 0.38, zoom: 1.0, focus: 0.55 }, to: { x: 0.63, y: 0.34, zoom: 1.16, dolly: 0.12, sx: 0.02 } },
    ['Bobby Fischer', 'BROOKLYN · AGE 13', 'BOBBY FISCHER, 1956 · UNITED PRESS · PUBLIC DOMAIN']);
  shot(gmT - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'bobby13', exprAt([[0, 'focus'], [f15 - (t - lt), { ...EXPR.happy, nod: 0.6 }]], lt), { back: 'retro', pieces: at(12), kid: false,
    keys: flyAt(FRONT(-0.85, -0.1), FRONT(-0.12, 0.45), 0.14, len(sh)) }),
    { trans: 'cut', grade: 'warm', hud: (g, lt, t) => {
      badge(g, 'GRANDMASTER', W / 2, 380, { color: GOLD, size: 52, sub: 'PORTOROŽ · 1958', a: seg(t, gmT, gmT + 0.1), scale: pop(t, gmT) });
      counter(g, 'AGE 15', null, { y: 250, size: 140, color: '#FFFFFF', a: seg(t, f15, f15 + 0.08) });
    } });
  cue(gmT - 0.12, 'whoosh_fast', 0.3); boom(f15, 0.8);
  const setT = youT - 0.35;
  shot(setT, (g, lt, t, sh) => hall(g, lt, t, flyAt(HV(-0.55, 10.5, 0.12), HV(0.05, 8.4, 0.06), youT - sh.a - 0.3, len(sh), 0.3), { rec: 'fischer', breakT: youT - SLAM + 0.05 }),
    { trans: 'cut', noJump: true });
  boom(youT + 0.05, 0.95);

  // ======================= 1991: POLGÁR BREAKS IT =======================
  const p91 = s('pol'), judT = w('pol', 'Judit'), brkT = w('pol', 'breaks'), p15 = w('pol', 'fifteen'), p4 = w('pol', 'four');
  shot(p91 - 0.06, (g, lt, t) => yearSlam(g, lt, t, '1991', p91 + 0.04, 'THE RECORD FALLS', { tint: '#3A1E10' }), { trans: 'whip', info: true, grade: 'warm' });
  boom(p91 + 0.04, 0.9);
  photo(judT - 0.5, PH.judit1990, { from: { x: 0.42, y: 0.4, zoom: 1.0, focus: 0.5 }, to: { x: 0.43, y: 0.36, zoom: 1.14, dolly: 0.12, sx: -0.02 } },
    ['Judit Polgár', 'HUNGARY · AGE 13', 'JUDIT POLGÁR, 1990 · FOTOBURO DE BOER / NOORD-HOLLANDS ARCHIEF · CC0']);
  breakShot(brkT - 0.25, 'fischer', 'polgar', brkT, [[0, HV(0.1, 8.8)], [1.6, HV(0.03, 8.0)]]);
  shot(p15 - 0.1, (g, lt, t, sh) => portrait(g, lt, t, 'judit', exprAt([[0, 'focus'], [p4 - (t - lt), { ...EXPR.happy, curve: 0.6 }]], lt), { back: 'retro', pieces: at(20), kid: false,
    keys: flyAt(FRONT(0.85, -0.1), FRONT(0.1, 0.45), 0.14, len(sh)) }),
    { trans: 'cut', grade: 'warm', hud: (g, lt, t) => {
      counter(g, 'AGE 15', null, { y: 250, size: 140, color: '#FFFFFF', a: seg(t, p15, p15 + 0.08) });
      badge(g, 'A MONTH YOUNGER THAN FISCHER', W / 2, 370, { color: GOLD, size: 40, sub: 'DECEMBER 1991', a: seg(t, p4, p4 + 0.1), scale: pop(t, p4) });
    } });
  cue(p15 - 0.14, 'whoosh_fast', 0.3); boom(p4, 0.7);

  // ======================= THE CASCADE: LEKO, BACROT, PONOMARIOV, BU =======================
  const lekT = w('cas', 'Leko.'), ponT = w('cas', 'Ponomariov.'), buT = w('cas', 'Bu'), evT = w('cas', 'Every'), ygT = w('cas', 'younger.');
  const bacT = (lekT + ponT) / 2 + 0.05;
  const CASC = [['leko14', 'leko', 'HUNGARY', 'AGE 14', lekT, '#2E2238', '#E0604A'], ['bacrot14', 'bacrot', 'FRANCE', 'AGE 14', bacT, '#16244A', '#5A8AF0'],
    ['pono14', 'pono', 'UKRAINE', 'AGE 14', ponT, '#1E2A40', '#F2C84A'], ['bu13', 'bu', 'CHINA', 'AGE 13', buT, '#3A1416', '#F0503C']];
  CASC.forEach(([who, id, flag, age, hit, tint, glow], i) => {
    shot(hit - 0.12, (g, lt, t) => recCard(g, lt, t, who, id, flag, age, hit, tint, glow), { trans: i ? 'cut' : 'whip', info: true });  // hard cuts inside the cascade: each card is on screen ~0.5 s
    boom(hit, i === 3 ? 0.9 : 0.75);
  });
  shot(evT - 0.06, (g, lt, t) => ageChart(g, lt, t, lerp(1955, 2000, ease.inOut(seg(t, evT, ygT - 0.1, lin))), { l1: 'YOUNGEST GRANDMASTER EVER', l2: 'THE RECORD, YEAR BY YEAR', younger: seg(t, ygT, ygT + 0.15) }),
    { trans: 'whip', info: true });
  boom(ygT, 0.7);

  // ======================= 2002: KARJAKIN, 12; THE RECORD STANDS 19 YEARS =======================
  const k02 = s('kar'), sergT = w('kar', 'Sergey'), k12 = w('kar', 'twelve'), thatT = w('kar', 'That'), n19 = w('kar', 'nineteen');
  shot(k02 - 0.06, (g, lt, t) => yearSlam(g, lt, t, '2002', k02 + 0.06, 'A 12-YEAR-OLD', { tint: '#14263E', ember: '#BFD8FF' }), { trans: 'whip', info: true, grade: 'cold' });
  boom(k02 + 0.06, 0.9);
  shot(sergT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'karjakin12', 'focus', { back: 'cold', pieces: at(16), keys: flyAt(FRONT(-0.85, -0.1), FRONT(-0.1, 0.5), 0.14, len(sh)) }),
    { trans: 'cut', grade: 'cold', hud: (g, lt) => nameTitle(g, lt, 'Sergey Karjakin', 'UKRAINE · 2002', { y: 220, t0: 0.1 }) });
  cue(sergT - 0.1, 'whoosh_fast', 0.3);
  breakShot(k12 - 0.3, 'bu', 'karjakin', k12 - 0.05, [[0, HV(-0.1, 8.8)], [2, HV(-0.03, 7.9)]]);
  shot(thatT - 0.08, (g, lt, t) => {
    const pen = t < thatT + 0.1 ? 2002.7 : lerp(2002.7, 2021.45, ease.inOut(seg(t, thatT + 0.1, n19 + 0.05, lin)));
    ageChart(g, lt, t, pen, { l1: 'THE RECORD STANDS', l2: 'SERGEY KARJAKIN · 2002', span: seg(t, thatT + 0.1, thatT + 0.25), years: Math.max(0, Math.round(pen - 2002.61)) });
  }, { trans: 'whip', info: true });
  boom(n19 + 0.05, 0.8);

  // ======================= 2019: GUKESH MISSES BY 17 DAYS; WORLD CHAMPION AT 18 =======================
  const g19 = s('guk'), boyT = w('guk', 'boy'), mssT = w('guk', 'missed'), d17 = w('guk', 'seventeen'), daysT = w('guk', 'days.'), hisT = w('guk', 'His'), gukT = w('guk', 'Gukesh.');
  const g18 = w('guk', 'eighteen,'), chT = w('guk', 'champion.');
  shot(g19 - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'gukesh12', 'focus', { back: 'saffron', pieces: at(24), keys: flyAt(FRONT(0.85, -0.1), FRONT(0.12, 0.5), boyT - sh.a, len(sh)) }),
    { trans: 'whip', hud: (g, lt) => placeStamp(g, lt, 'New Delhi, India', '2019', { y: 200, t0: 0.15 }) });
  cue(boyT - 0.14, 'whoosh_fast', 0.3);
  shot(mssT - 0.08, (g, lt, t) => missCard(g, lt, t, mssT - 0.08, d17 + 0.3, daysT + 0.05), { trans: 'cut', info: true });
  for (let i = 0; i < 3; i++) cue(mssT + 0.3 + i * 0.25, 'clock_tick', 0.18); cue(daysT + 0.05, 'stamp', 0.45);
  shot(hisT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'gukesh12', exprAt([[0, 'neutral'], [0.5, 'focus']], lt), { back: 'saffron', pieces: at(24), keys: [[0, FRONT(-0.3, 0.6)], [len(sh), FRONT(-0.15, 1.05)]] }),
    { trans: 'cut', hud: (g, lt, t) => nameTitle(g, lt, 'Gukesh D', 'CHENNAI, INDIA', { y: 220, t0: gukT - (t - lt) }) });
  shot(g18 - 0.18, (g, lt, t, sh) => portrait(g, lt, t, 'gukesh18', exprAt([[0, 'focus'], [chT - (t - lt), { ...EXPR.happy, curve: 0.9 }]], lt), { back: 'saffron', pieces: at(40), kid: false,
    keys: flyAt(FRONT(0.85, -0.3), FRONT(0.08, 0.2), 0.14, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => {
      counter(g, 'AGE 18', null, { y: 235, size: 140, color: '#FFFFFF', a: seg(t, g18, g18 + 0.08) });
      badge(g, 'WORLD CHAMPION', W / 2, 355, { color: GOLD, size: 54, sub: 'SINGAPORE · DECEMBER 2024', a: seg(t, chT, chT + 0.1), scale: pop(t, chT) });
    }, post: (g, lt, t) => confetti(g, t, chT - 0.75, { n: 90, seed: 7 }) });
  cue(g18 - 0.22, 'whoosh_fast', 0.3); boom(chT, 0.95); cue(chT + 0.05, 'confetti', 0.3);

  // ======================= 2021, BUDAPEST: MISHRA, THE YOUNGEST EVER =======================
  const m21 = s('mis'), abhT = w('mis', 'Abhimanyu'), kidT = w('mis', 'kid'), m12 = w('mis', 'Twelve'), m4 = w('mis', 'four'), m25 = w('mis', 'twenty-five'), mDays = w('mis', 'days.');
  const theT = w('mis', 'The'), everT = w('mis', 'ever.');
  shot(m21 - 0.06, (g, lt, t) => yearSlam(g, lt, t, '2021', m21 + 0.06, 'BUDAPEST, HUNGARY', { tint: '#1A2448', ember: '#FFE2B0' }), { trans: 'whip', info: true });
  boom(m21 + 0.06, 0.9);
  shot(abhT - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'mishra12', exprAt([[0, 'focus'], [0.9, { ...EXPR.happy, curve: 0.5 }]], lt), { back: 'usa', pieces: at(30), keys: flyAt(FRONT(-0.85, -0.1), FRONT(-0.1, 0.5), kidT - sh.a, len(sh)) }),
    { trans: 'cut', hud: (g, lt) => nameTitle(g, lt, 'Abhimanyu Mishra', 'NEW JERSEY, USA', { y: 220, t0: 0.12 }) });
  cue(kidT - 0.14, 'whoosh_fast', 0.3);
  shot(m12 - 0.1, (g, lt, t) => ageClock(g, lt, t, m12, m4, m25, mDays), { trans: 'cut', info: true });
  boom(mDays, 0.8);
  breakShot(theT - 0.12, 'karjakin', 'mishra', theT, sh => flyAt(HV(0.06, 8.6), HV(0.62, 7.2, 0.14), everT - sh.a, len(sh), 0.3), { post: (g, lt, t) => confetti(g, t, everT - 0.75, { n: 110, seed: 11 }) });
  cue(everT - 0.12, 'whoosh_fast', 0.3); cue(everT, 'confetti', 0.35);

  // ======================= 2026: ORO, TWO MONTHS SHORT =======================
  const oroS = s('oro'), fauT = w('oro', 'Faustino'), fellT = w('oro', 'fell'), twoT = w('oro', 'two');
  shot(oroS - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'oro12', 'focus', { back: 'arg', pieces: at(18), keys: flyAt(FRONT(0.85, -0.1), FRONT(0.1, 0.5), fauT - sh.a, len(sh)) }),
    { trans: 'whip', hud: (g, lt, t) => nameTitle(g, lt, 'Faustino Oro', 'ARGENTINA · 2026', { y: 220, t0: fauT - (t - lt) }) });
  cue(fauT - 0.14, 'whoosh_fast', 0.3);
  shot(fellT - 0.08, (g, lt, t) => oroCard(g, lt, t, fellT, twoT), { trans: 'cut', info: true });
  boom(twoT, 0.8);

  // ======================= NOW: ROMAN, 11, TWO NORMS; BEFORE FEBRUARY =======================
  const rS = s('rom'), romT = w('rom', 'Roman'), r11 = w('rom', 'eleven,'), alrT = w('rom', 'already'), twoN = w('rom', 'two'), normsT = w('rom', 'norms.');
  const ifT = w('rom', 'If'), febT = w('rom', 'February,'), firstT = w('rom', 'first'), u12 = w('rom', 'twelve.'), recT = w('rom', 'record'), fallAgain = w('rom', 'fall');
  shot(rS - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'roman11', 'focus', { back: 'night', pieces: at(22), keys: flyAt(FRONT(-0.85, -0.1), FRONT(-0.1, 0.55), r11 - sh.a, len(sh)) }),
    { trans: 'whip', hud: (g, lt, t) => { nameTitle(g, lt, 'Roman Shogdzhiev', 'AGE 11 · 2026', { y: 220, t0: romT - (t - lt) }); } });
  cue(r11 - 0.14, 'whoosh_fast', 0.3); boom(r11, 0.7);
  shot(alrT - 0.08, (g, lt, t) => normsCard(g, lt, t, twoN, twoN + 0.22, normsT), { trans: 'cut', info: true });
  cue(twoN, 'sparkle_pop', 0.35); cue(twoN + 0.22, 'sparkle_pop', 0.35);
  shot(ifT - 0.08, (g, lt, t) => deadline(g, lt, t, ifT + 0.1, febT), { trans: 'cut', info: true });
  for (let i = 0; i < 2; i++) cue(ifT + 0.25 + i * 0.4, 'page_flip', 0.22); boom(febT, 0.8);
  shot(firstT - 0.3, (g, lt, t, sh) => portrait(g, lt, t, 'roman11', exprAt([[0, 'focus'], [0.6, { ...EXPR.smug, curve: 0.5 }]], lt), { back: 'night', pieces: at(22),
    keys: flyAt(FRONT(0.85, 0.0), FRONT(0.08, 0.7), 0.14, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => badge(g, 'FIRST GM UNDER 12', W / 2, 300, { color: GOLD, size: 58, sub: 'NO ONE HAS EVER DONE IT', a: seg(t, firstT, firstT + 0.1), scale: pop(t, firstT) }) });
  cue(firstT - 0.34, 'whoosh_fast', 0.3); boom(u12, 0.85);
  shot(recT - 0.1, (g, lt, t, sh) => hall(g, lt, t, [[0, HV(0.05, 9.4)], [len(sh), HV(0.0, 6.6)]], { rec: 'mishra', crack: seg(t, fallAgain - 0.05, fallAgain + 0.6, ease.out) }),
    { trans: 'cut', noJump: true });
  cue(fallAgain, 'glass', 0.22); cue(fallAgain + 0.02, 'thud', 0.3);

  // ======================= CTA: how old were you? =======================
  const ctaT = s('cta') - 0.06, oldT = w('cta', 'old'), youT2 = w('cta', 'you'), comT2 = w('cta', 'Comment');
  shot(ctaT, (g, lt, t, sh) => lineup(g, lt, t, flyAt(LPOSE(LX(1), 14), LPOSE(LX(7), 8.2), youT2 - sh.a, len(sh), 0.34), { youLit: youT2 + 0.1 }),
    { trans: 'cut', noJump: true, qaAllow: ['face cut by frame'], hud: (g, lt, t) => badge(g, 'HOW OLD WERE YOU?', W / 2, 220, { color: '#FFD43B', size: 54, sub: 'WHEN YOU LEARNED CHESS', a: seg(t, oldT, oldT + 0.1), scale: pop(t, oldT) }) });
  cue(youT2 - 0.1, 'whoosh_fast', 0.35); boom(youT2 + 0.12, 0.7);
  shot(comT2 - 0.1, (g, lt, t, sh) => lineup(g, lt, t, [[0, LPOSE(LX(7), 7.6)], [3, LPOSE(LX(7), 7.0)]], { youLit: 0 }),
    { trans: 'cut', noJump: true, hud: (g, lt, t) => {
      badge(g, 'HOW OLD WERE YOU?', W / 2, 220, { color: '#FFD43B', size: 54, sub: 'WHEN YOU LEARNED CHESS' });
      badge(g, 'COMMENT YOUR AGE', W / 2, 360, { color: GREEN, size: 48, scale: pop(t, comT2) });
      badge(g, 'FOLLOW ' + CHANNEL, W / 2, 460, { color: '#FFFFFF', size: 38, a: seg(t, comT2 + 0.5, comT2 + 0.6) });
    } });
  cue(comT2, 'notify', 0.35);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: f58 - 0.06, m: 'build' }, { t: k02 - 0.06, m: 'tension' }, { t: m21 - 0.06, m: 'hit' },
    { t: oroS - 0.06, m: 'digital' }, { t: recT - 0.1, m: 'drop' }, { t: ctaT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.3, zooms: [1, 1.12, 1.05], shift: 40 } };
}
