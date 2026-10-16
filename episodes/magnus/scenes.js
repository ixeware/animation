// How strong is Magnus Carlsen, really? Ten opponents with his back to the boards (CBS 60 Minutes, 2012), every country's
// flag, capital and population at five (per his coach), grandmaster at 13 and a draw with world No. 1 Kasparov (rapid,
// 2004), the 136-move game of 2021 (tablebase draw for 15 moves, then 130...Qe6?), 2882 vs Hikaru's 2816, 14-1 in classical,
// world No. 1 since 2011, IQ never said, No. 1 at Fantasy Premier League (December 2019). Sources: SOURCES.md.
// Colourful from the first frame (style rule 28), brilliant-episode pace with sharp fly-arounds (rule 27).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, placeStamp, sans, mono, serif } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, pool } from '../../engine/js/env.js';
import { useLookV2 } from '../../engine/js/look.js';
import { spotCone, bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT, SLIDE_OPTS } from '../../engine/js/movefx.js';
import { DotMap } from '../../engine/js/map.js';
import { webcam } from '../../engine/js/witty.js';
import { shockwave, embers } from '../../engine/js/fx.js';
import { confetti } from '../../engine/js/draw.js';

useLookV2();
CAST.magnusCPU = { ...CAST.magnus, iris: '#3FE0C5' };  // "like a computer": engine-teal eyes
CAST.magnus5 = { ...CAST.magnus14, face: [1.0, 0.95, 0.98], hairC: '#B98E5A', brow: '#9A7448', suit: '#3E7CC8', suitD: '#2C5E9E', shirt: 'tee', bodyScale: 0.62, blushAlways: 0.35 };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const GOLD = '#F2C14E', RED = '#FF5A4F', TEAL = '#3FE0C5', BLUE = '#5AA9FF';
const G6 = await fetch('../engine/data/carlsen_nepo_2021_g6.json').then(r => r.json());
const MAP = await new DotMap().init();
const lin = x => x;
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
const at = k => G6[k].pieces.map(p => ({ ...p, ...xz(p.sq) }));
const START = at(0);

// ---------- painted colour sets (blurred once): a neon stage, a warm hall, Dubai teal and gold, a floodlit stadium ----------
const STYLE = {
  stage: { g: ['#1B0E44', '#33187A', '#0D0824'], beams: ['#FF4FD8', '#3FD8FF', '#8A6CFF', '#FF4FD8', '#3FD8FF'], dots: ['#FF7AE6', '#7AE8FF', '#FFE38A'] },
  warm: { g: ['#3A1A0C', '#8A461E', '#26120A'], beams: ['#FFC060', '#FF8A3F', '#FFD9A0', '#FF8A3F'], dots: ['#FFE0A0', '#FFB060'] },
  dubai: { g: ['#04262C', '#0E5E6A', '#03181C'], beams: ['#46F0D2', '#F2C46A', '#46F0D2', '#F2C46A'], dots: ['#9FFFF0', '#FFE6A8'] },
  pitch: { g: ['#06142A', '#103262', '#0A1A30'], beams: ['#FFFFFF', '#DDEBFF', '#FFFFFF'], dots: ['#FFFFFF', '#FFE9A0'] },
};
const paintBack = style => {
  const S = STYLE[style], w = 1800, h = 1500, c = makeCanvas(w, h), g = c.getContext('2d'), r = rng(style.length * 7 + 3);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, S.g[0]); bg.addColorStop(0.55, S.g[1]); bg.addColorStop(1, S.g[2]);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (style === 'pitch') {  // floodlights, a stand of coloured dots, the green
    g.fillStyle = '#0C2244'; g.fillRect(0, 520, w, 470);
    for (let y = 540; y < 980; y += 22) for (let x = (y / 22) % 2 * 11; x < w; x += 22) { g.fillStyle = ['#E8423A', '#F2F2F2', '#3A7BE8', '#F2C14E', '#2C3E66'][Math.floor(r() * 5)]; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
    for (const x of [150, 900, 1650]) { const gl = g.createRadialGradient(x, 200, 0, x, 200, 260); gl.addColorStop(0, 'rgba(255,255,255,1)'); gl.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = gl; g.fillRect(x - 260, -60, 520, 520); }
    const gr = g.createLinearGradient(0, 990, 0, h); gr.addColorStop(0, '#36B04F'); gr.addColorStop(1, '#1D7A33'); g.fillStyle = gr; g.fillRect(0, 990, w, h - 990);
    for (let i = 0; i < 9; i += 2) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(i * 200, 990, 200, h - 990); }
  } else {
    S.beams.forEach((col, i) => {  // soft light beams fanning down from the rig
      const x = 180 + i * (w - 360) / (S.beams.length - 1), gr = g.createLinearGradient(x, 0, x, h * 0.9), sp = (i - (S.beams.length - 1) / 2) * 90;
      gr.addColorStop(0, rgba(col, 0.6)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x + 30, 0); g.lineTo(x + 280 + sp, h * 0.9); g.lineTo(x - 280 + sp, h * 0.9); g.fill();
    });
    for (let i = 0; i < 70; i++) {
      const col = S.dots[i % S.dots.length], x = r() * w, y = r() * h * 0.75, rad = 8 + r() * 36, gl = g.createRadialGradient(x, y, 0, x, y, rad);
      gl.addColorStop(0, rgba(col, 0.75)); gl.addColorStop(1, rgba(col, 0)); g.fillStyle = gl; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
  const out = makeCanvas(w, h), o = out.getContext('2d'); o.filter = 'blur(10px)'; o.drawImage(c, 0, 0); return out;
};
const BACKS = Object.fromEntries(Object.keys(STYLE).map(k => [k, paintBack(k)]));
function backdrop(g, t, style = 'stage') {
  const ox = -Math.sin(B.yaw) * 700, oy = (B.pitch - 0.3) * 520, im = BACKS[style];
  g.drawImage(im, -360 + ox, -120 + oy, W + 720, (W + 720) * im.height / im.width);
  bokeh(g, t, { n: 12, seed: style.length, y0: 0.04, y1: 0.45, a: 0.2, size: [30, 90], colors: STYLE[style].dots });
}
function gameTable(g) {
  box(g, B, [3.3, -3.2, 3.3], [4.7, -1.6, 4.7], { top: '#3A1F14', side: '#24130C', front: '#2E180F' });
  box(g, B, [-1.4, -1.6, -1.4], [9.4, -0.35, 9.4], { top: '#8A4A2E', side: '#4A2618', front: '#5E3220' });
  pool(g, B, 4, -0.33, 4, 7, '#FFF0D8', 0.24);
}
// a coloured rim light behind a head (screen space), in the set's first beam colour
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

// a player behind the board (far side), the camera on the near side
const FRONT = (yaw = 0.1, push = 0) => ({ yaw, pitch: 0.3, dist: 7.4 - push, fov: 1500, cy: H * 0.46, target: [4, 2.9, 9.2] });
const nudge = (P, k) => ({ ...P, dist: P.dist - k });
// a sharp fly-around: hold A, whip to B in d seconds centred on `at` (local time), then drift on
const flyAt = (A, Bp, at, L, d = 0.28) => {
  const a0 = Math.max(0, at - d / 2), end = Math.max(L, a0 + d + 0.1);
  return a0 < 0.02 ? [[0, A], [d, Bp, ease.whip], [end, nudge(Bp, 0.3)]] : [[0, A], [a0, nudge(A, 0.15)], [a0 + d, Bp, ease.whip], [end, nudge(Bp, 0.3)]];
};
function portrait(g, lt, t, who, e, { keys, back = 'stage', pieces = START, extra = null, glow = null, under = null } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, back);
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 4.2, STYLE[back].beams[0], 0.45);
  const hands = seated(g, B, who, e, t, { z: 9.4, eyeGlow: glow });
  gameTable(g); B.drawSlab(g, COM); if (under) under();
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 }); hands();
  if (extra) extra();
  spotCone(g, B, { top: [4, 18, 9.2], base: [4, 0, 9.2], r0: 0.6, r1: 4.5, a: 0.16, t, color: '#FFF4E0' });
  lowKey(g, { cy: H * 0.4, a: 0.28 });
}
// both players at the board, seen from the side: `far` behind the black pieces, `near` behind the white pieces
const OTS = (yaw = 0.3, dist = 11.5, pitch = 0.3) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.45, target: [4, 2.5, 7] });  // over the near player's shoulder
function twoShot(g, lt, t, far, near, eF, eN, { keys, back = 'warm', pieces = START } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, back);
  const hf = seated(g, B, far, eF, t, { z: 9.4 }), hn = seated(g, B, near, eN, t, { z: -1.4, face: 1 });
  gameTable(g); B.drawSlab(g, COM); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.4 }); hf(); hn();
  spotCone(g, B, { top: [4, 18, 4], base: [4, 0, 4], r0: 0.7, r1: 5.5, a: 0.14, t, color: '#FFF4E0' });
  lowKey(g, { cy: H * 0.42, a: 0.28 });
}
const headAt = (z = 9.4, lift = 3.1) => { const p = B.project(4, lift, z); return { x: p.x, y: p.y, s: p.s * 1.05 / 100 }; };

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
function checkBadge(g, text, x, y, color, scale = 1) {
  g.save(); g.translate(x, y); g.rotate(-0.018); g.scale(scale, scale);
  g.font = sans(50, 900); const tw = g.measureText(text).width, w = tw + 150, h = 78;
  g.shadowColor = 'rgba(60,20,0,0.45)'; g.shadowOffsetY = 7; g.fillStyle = color; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 10); g.fill(); g.shadowColor = 'transparent';
  qaRect(g, -w / 2, -h / 2, w, h, 'text', text);
  g.fillStyle = '#16120E'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, -w / 2 + 34, 3);
  g.strokeStyle = '#1E8E3E'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(w / 2 - 92, 2); g.lineTo(w / 2 - 70, 22); g.lineTo(w / 2 - 34, -20); g.stroke();
  g.restore();
}

// ---------- SET: the simul — Magnus faces us, ten boards in an arc behind his back, an opponent at each ----------
const CROWD = ['rival', 'ivan', 'goran', 'ehsan', 'susan', 'sofia', 'brother', 'dealer', 'daughter', 'operator'];
const SIM = Array.from({ length: 10 }, (_, i) => { const a = (-63 + i * 14) * Math.PI / 180, R = 6.2; return { x: Math.sin(a) * R, z: Math.cos(a) * R, a, R, who: CROWD[i], pos: at(16 + i * 9), col: i % 2 ? '#3FD8FF' : '#FF4FD8' }; });
const SPR = new Map();
function sprite(who, e = 'focus') {
  const key = who + '|' + e;
  if (!SPR.has(key)) { const c = makeCanvas(520, 720), g = c.getContext('2d'); drawChar(g, who, { x: 260, y: 260, s: 1, e: EXPR[e], t: 0 }); SPR.set(key, c); }
  return SPR.get(key);
}
function billboard(g, spr, x, y, z, k = 1, { blur = 0 } = {}) {
  if (B.toCam(x, y, z)[2] < 0.8) return;
  const p = B.project(x, y, z), s = p.s * k / 100 * 1.05;
  g.save(); if (blur > 0.6) g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(spr, p.x - 260 * s, p.y - 260 * s, 520 * s, 720 * s); g.restore();
}
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
function miniBoard(g, x, z, pos, { s = 2.0, h = 1.0 } = {}) {
  box(g, B, [x - s / 2, 0, z - s / 2], [x + s / 2, h, z + s / 2], { top: '#5A4232', side: '#2A1E16', front: '#3A2A1E' });
  const bs = s * 0.8, x0 = x - bs / 2, z0 = z - bs / 2, q = bs / 8, y = h + 0.01;
  quad(g, [[x0, y, z0], [x0 + bs, y, z0], [x0 + bs, y, z0 + bs], [x0, y, z0 + bs]], COM.light);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) quad(g, [[x0 + i * q, y, z0 + j * q], [x0 + (i + 1) * q, y, z0 + j * q], [x0 + (i + 1) * q, y, z0 + (j + 1) * q], [x0 + i * q, y, z0 + (j + 1) * q]], COM.dark);
  B.drawPieces(g, pos.map(p => ({ ...p, x: x0 + p.x * q, z: z0 + p.z * q, y, scale: q })), { dof: 0 });
}
function simul(g, lt, t, keys, { e = 'smug', close = false, glow = null, lit = 10, litT = null } = {}) {
  rig(B, lt, keys, { t });
  backdrop(g, t, 'stage');
  quad(g, [[-40, 0, -30], [40, 0, -30], [40, 0, 40], [-40, 0, 40]], '#1C1240');
  const mz = B.toCam(0, 2.5, 0)[2], items = [];
  SIM.forEach((T, i) => {
    if (i >= lit) return;
    pool(g, B, T.x, 0.02, T.z, 2.4, T.col, litT !== null ? 0.25 + 0.5 * Math.exp(-Math.max(0, t - litT[i]) * 4) * (t >= litT[i]) : 0.3);
    const ox = T.x * (T.R + 1.6) / T.R, oz = T.z * (T.R + 1.6) / T.R, d = B.toCam(T.x, 1, T.z)[2];
    items.push({ d, f: () => miniBoard(g, T.x, T.z, T.pos) });
    items.push({ d: B.toCam(ox, 2.2, oz)[2], f: () => billboard(g, sprite(T.who), ox, 2.2, oz, 0.4, { blur: close ? clamp((B.toCam(ox, 2.2, oz)[2] - mz) * 0.6, 0, 5) : 0 }) });
  });
  items.push({ d: mz, f: () => {
    const p = B.project(0, 2.7, 0); rim(g, p.x, p.y, p.s * 2.4, '#FF4FD8', 0.5);
    actor(g, B, 'magnus', { x: 0, y: 2.5, z: 0, k: 0.5, e, t, face: -1, follow: 0.3, eyeGlow: glow });
  } });
  items.sort((a, b) => b.d - a.d).forEach(it => it.f());
  box(g, B, [-2.4, 0, -1.7], [2.4, 1.25, -1.0], { top: '#2A1A5A', side: '#140C30', front: '#1E1446' });  // his desk: the bust ends behind it
  quad(g, [[-2.4, 1.26, -1.7], [2.4, 1.26, -1.7], [2.4, 1.26, -1.62], [-2.4, 1.26, -1.62]], '#FF4FD8');
  spotCone(g, B, { top: [0, 14, 0], base: [0, 0, 0], r0: 0.4, r1: 2.6, a: 0.22, t, color: '#FFF4E0' });
  lowKey(g, { cy: H * 0.45, a: 0.22 });
}

// ---------- the world lighting up from Norway, country by country (dot map, a colour per country) ----------
const PAL = ['#FF5A5F', '#FFB13B', '#FFE14D', '#5EE06B', '#38D1FF', '#7A7CFF', '#E66BFF', '#FF7EB8', '#3FE0C5'];
function world(g, lt, t, t0, t1) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0E1440'); bg.addColorStop(1, '#22105A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 14, seed: 77, y0: 0.02, y1: 0.95, a: 0.18, colors: ['#7A7CFF', '#E66BFF', '#38D1FF'] });
  const u = ease.inOut(seg(t, t0, t1, lin)), R = lerp(4, 190, seg(t, t0 + 0.1, t1 - 0.1, lin));
  MAP.view({ lon: lerp(11, 12, u), lat: lerp(58, 18, u), zoom: lerp(11, 3.4, u), cy: H * 0.47 });
  MAP.draw(g, { spacing: 13, base: '#34406A', color: (id, lon, lat) => Math.hypot((lon - 10.75) * Math.cos(lat * 0.0175), lat - 59.9) < R ? PAL[(Math.abs(id) * 7919 + 3) % PAL.length] : null });
}

// ---------- flags (simple, exact designs only): stripes, Nordic crosses, discs ----------
const stripes = (cols, vertical, w = null) => (g, x, y, W0, H0) => {
  const tot = (w || cols.map(() => 1)).reduce((a, b) => a + b, 0); let o = 0;
  cols.forEach((c, i) => { const k = (w ? w[i] : 1) / tot; g.fillStyle = c; vertical ? g.fillRect(x + o * W0, y, k * W0 + 0.6, H0) : g.fillRect(x, y + o * H0, W0, k * H0 + 0.6); o += k; });
};
const nordic = (bg, outer, inner, [L, Hh, cx, cw, iw]) => (g, x, y, w, h) => {  // L x Hh units, cross centre column cx, outer width cw, inner iw
  const u = w / L, v = h / Hh;
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = outer; g.fillRect(x + (cx - cw / 2) * u, y, cw * u, h); g.fillRect(x, y + (Hh / 2 - cw / 2) * v, w, cw * v);
  if (inner) { g.fillStyle = inner; g.fillRect(x + (cx - iw / 2) * u, y, iw * u, h); g.fillRect(x, y + (Hh / 2 - iw / 2) * v, w, iw * v); }
};
const disc = (bg, col, cx = 0.5, r = 0.3) => (g, x, y, w, h) => { g.fillStyle = bg; g.fillRect(x, y, w, h); g.fillStyle = col; g.beginPath(); g.arc(x + cx * w, y + h / 2, r * h, 0, 7); g.fill(); };
const star = (g, cx, cy, R, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * 0.382 : R; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill(); };
const FLAGS = {
  NO: nordic('#BA0C2F', '#FFFFFF', '#00205B', [22, 16, 8, 4, 2]), SE: nordic('#006AA7', '#FECC00', null, [16, 10, 6, 2, 0]), DK: nordic('#C8102E', '#FFFFFF', null, [37, 28, 14, 4, 0]),
  FI: nordic('#FFFFFF', '#002F6C', null, [18, 11, 6.5, 3, 0]), IS: nordic('#02529C', '#FFFFFF', '#DC1E35', [25, 18, 9, 4, 2]),
  JP: disc('#FFFFFF', '#BC002D', 0.5, 0.3), BD: disc('#006A4E', '#F42A41', 0.45, 0.333), PW: disc('#4AADD6', '#FFDE00', 0.45, 0.3),
  FR: stripes(['#002654', '#FFFFFF', '#ED2939'], true), IT: stripes(['#009246', '#FFFFFF', '#CE2B37'], true), IE: stripes(['#169B62', '#FFFFFF', '#FF883E'], true),
  BE: stripes(['#000000', '#FAE042', '#ED2939'], true), DE: stripes(['#000000', '#DD0000', '#FFCE00'], false), NL: stripes(['#AE1C28', '#FFFFFF', '#21468B'], false),
  RU: stripes(['#FFFFFF', '#0039A6', '#D52B1E'], false), AT: stripes(['#ED2939', '#FFFFFF', '#ED2939'], false), HU: stripes(['#CE2939', '#FFFFFF', '#477050'], false),
  BG: stripes(['#FFFFFF', '#00966E', '#D62612'], false), EE: stripes(['#0072CE', '#000000', '#FFFFFF'], false), LT: stripes(['#FDB913', '#006A44', '#C1272D'], false),
  LV: stripes(['#9E3039', '#FFFFFF', '#9E3039'], false, [2, 1, 2]), RO: stripes(['#002B7F', '#FCD116', '#CE1126'], true), PE: stripes(['#D91023', '#FFFFFF', '#D91023'], true),
  NG: stripes(['#008751', '#FFFFFF', '#008751'], true), CI: stripes(['#F77F00', '#FFFFFF', '#009E60'], true), ML: stripes(['#14B53A', '#FCD116', '#CE1126'], true),
  GN: stripes(['#CE1126', '#FCD116', '#009460'], true), UA: stripes(['#0057B7', '#FFD700'], false), PL: stripes(['#FFFFFF', '#DC143C'], false), ID: stripes(['#FF0000', '#FFFFFF'], false),
  TH: stripes(['#A51931', '#F4F5F8', '#2D2A4A', '#F4F5F8', '#A51931'], false, [1, 1, 2, 1, 1]), CO: stripes(['#FCD116', '#003893', '#CE1126'], false, [2, 1, 1]),
  GA: stripes(['#009E60', '#FCD116', '#3A75C4'], false), SL: stripes(['#1EB53A', '#FFFFFF', '#0072C6'], false), MU: stripes(['#EA2839', '#1A206D', '#FFD500', '#00A551'], false),
  AM: stripes(['#D90012', '#0033A0', '#F2A800'], false), YE: stripes(['#CE1126', '#FFFFFF', '#000000'], false), BO: stripes(['#D52B1E', '#F9E300', '#007934'], false),
  GM: stripes(['#CE1126', '#FFFFFF', '#0C1C8C', '#FFFFFF', '#3A7728'], false, [6, 1, 4, 1, 6]),
  CH: (g, x, y, w, h) => { const s = Math.min(w, h), x0 = x + (w - s) / 2; g.fillStyle = '#DA291C'; g.fillRect(x0, y, s, h); g.fillStyle = '#FFFFFF'; const u = s / 32; g.fillRect(x0 + 13 * u, y + (h - s) / 2 + 6 * u, 6 * u, 20 * u); g.fillRect(x0 + 6 * u, y + (h - s) / 2 + 13 * u, 20 * u, 6 * u); },
  CZ: (g, x, y, w, h) => { stripes(['#FFFFFF', '#D7141A'], false)(g, x, y, w, h); g.fillStyle = '#11457E'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w / 2, y + h / 2); g.lineTo(x, y + h); g.fill(); },
  JM: (g, x, y, w, h) => { g.fillStyle = '#FED100'; g.fillRect(x, y, w, h); const c = [x + w / 2, y + h / 2];
    for (const [col, p] of [['#009B3A', [[x, y], [x + w, y]]], ['#009B3A', [[x, y + h], [x + w, y + h]]], ['#000000', [[x, y], [x, y + h]]], ['#000000', [[x + w, y], [x + w, y + h]]]]) { g.fillStyle = col; g.beginPath(); g.moveTo(...p[0]); g.lineTo(...p[1]); g.lineTo(...c); g.fill(); }
    g.strokeStyle = '#FED100'; g.lineWidth = h * 0.16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke(); },
  GR: (g, x, y, w, h) => { const s = h / 9; for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#0D5EAF'; g.fillRect(x, y + i * s, w, s + 0.6); } g.fillStyle = '#0D5EAF'; g.fillRect(x, y, 5 * s, 5 * s); g.fillStyle = '#FFFFFF'; g.fillRect(x + 2 * s, y, s, 5 * s); g.fillRect(x, y + 2 * s, 5 * s, s); },
  VN: (g, x, y, w, h) => { g.fillStyle = '#DA251D'; g.fillRect(x, y, w, h); star(g, x + w / 2, y + h / 2, h * 0.3, '#FFFF00'); },
  IL: (g, x, y, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(x, y, w, h); g.fillStyle = '#0038B8'; g.fillRect(x, y + h * 0.1, w, h * 0.15); g.fillRect(x, y + h * 0.75, w, h * 0.15);
    g.strokeStyle = '#0038B8'; g.lineWidth = h * 0.04; const cx = x + w / 2, cy = y + h / 2, r = h * 0.2;
    for (const k of [0, 1]) { g.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + k * Math.PI + i * 2 * Math.PI / 3; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke(); } },
  BW: (g, x, y, w, h) => { stripes(['#75AADB', '#FFFFFF', '#000000', '#FFFFFF', '#75AADB'], false, [9, 1, 4, 1, 9])(g, x, y, w, h); },
  BJ: (g, x, y, w, h) => { g.fillStyle = '#FCD116'; g.fillRect(x, y, w, h / 2); g.fillStyle = '#E8112D'; g.fillRect(x, y + h / 2, w, h / 2); g.fillStyle = '#008751'; g.fillRect(x, y, w * 0.4, h); },
  MG: (g, x, y, w, h) => { g.fillStyle = '#FC3D32'; g.fillRect(x, y, w, h / 2); g.fillStyle = '#007E3A'; g.fillRect(x, y + h / 2, w, h / 2); g.fillStyle = '#FFFFFF'; g.fillRect(x, y, w / 3, h); },
  LA: (g, x, y, w, h) => { stripes(['#CE1126', '#002868', '#CE1126'], false, [1, 2, 1])(g, x, y, w, h); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * 0.2, 0, 7); g.fill(); },
};
const FLAG_ORDER = Object.keys(FLAGS);  // 49 flags: a 7 x 7 wall
function flagWall(g, lt, t, t0, { checks = [], kidE = 'happy' } = {}) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#FFB43B'); bg.addColorStop(1, '#FF6A3D'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const fw = 136, fh = 90, gx = 16, gy = 26, x0 = (W - (7 * fw + 6 * gx)) / 2, y0 = 40;
  [...FLAG_ORDER, ...FLAG_ORDER.slice(0, 63)].slice(0, 7 * 11).forEach((k, i) => {
    const c = i % 7, r = Math.floor(i / 7), ti = t0 + (r * 7 + ((c * 3) % 7)) * 0.018, u = ease.back(clamp((t - ti) / 0.2));
    if (u <= 0) return;
    const x = x0 + c * (fw + gx), y = y0 + r * (fh + gy);
    g.save(); g.translate(x + fw / 2, y + fh / 2); g.scale(1, u); g.rotate((((i * 37) % 9) - 4) * 0.008);
    g.shadowColor = 'rgba(80,20,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6; g.fillStyle = '#FFFFFF'; g.fillRect(-fw / 2 - 4, -fh / 2 - 4, fw + 8, fh + 8); g.shadowColor = 'transparent';
    FLAGS[k](g, -fw / 2, -fh / 2, fw, fh);
    g.restore();
  });
  // little Magnus (five) in front of the wall, and the three things he knew
  drawChar(g, 'magnus5', { x: W / 2, y: 900, s: 1.35, e: EXPR[kidE] || kidE, t });
  const dg = g.createLinearGradient(0, 1170, 0, H); dg.addColorStop(0, '#B5652E'); dg.addColorStop(0.08, '#8A4A22'); dg.addColorStop(1, '#5A2E14');  // his desk
  g.fillStyle = dg; g.fillRect(0, 1170, W, H - 1170); g.fillStyle = '#D07A3A'; g.fillRect(0, 1170, W, 14);
  checks.forEach(([text, tc], i) => { if (t >= tc) checkBadge(g, text, W / 2, 200 + i * 110, ['#FFFFFF', '#FFE14D', '#B8F5A0'][i], pop(t, tc)); });
}

// ---------- engine look: glowing eyes, scan lines and an evaluation bar ----------
function evalBar(g, x, y, h, v, { label = '0.00', a = 1 } = {}) {  // v: -1..1 (white advantage up)
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#1A1A1A'; g.fillRect(x, y, 46, h); const wh = h * (0.5 + 0.5 * clamp(v, -1, 1));
  g.fillStyle = '#F2F2F2'; g.fillRect(x, y + h - wh, 46, wh);
  g.font = mono(26, 800); g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.fillText(label, x + 23, y - 16);
  qaRect(g, x - 20, y - 46, 86, 46, 'text', 'eval');
  g.restore();
}
function scan(g, t, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a * 0.18; g.fillStyle = TEAL; for (let y = (t * 120) % 8; y < H; y += 8) g.fillRect(0, y, W, 2); g.restore();
}

// ---------- the 2021 marathon: fast forward through the endgame, a counter of moves ----------
function stepPieces(k0, k1, t0, dt, t) {  // one ply every dt seconds from t0, each sliding in a short hop
  const f = (t - t0) / dt; if (f < 0) return { pieces: at(k0), k: k0 };
  const i = Math.min(k1 - k0, Math.floor(f) + 1), u = i >= k1 - k0 && f >= k1 - k0 ? 1 : clamp((f - Math.floor(f)) / 0.6);
  return { pieces: piecesAt(G6, k0 + i, u, SLIDE_OPTS), k: k0 + i };
}

// ---------- bar chart (records), a VS score, a year strip, a phone leaderboard, a sea of players ----------
function bars(g, lt, t, title, sub, rows, { lo, hi }) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1A1050'); bg.addColorStop(1, '#0A0628'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 12, seed: 5, y0: 0.05, y1: 0.9, a: 0.16, colors: ['#FF4FD8', '#3FD8FF', '#FFE38A'] });
  g.textAlign = 'center'; g.font = sans(44, 900); g.letterSpacing = '3px'; g.fillStyle = '#FFFFFF'; g.fillText(title, W / 2, 420); g.letterSpacing = '0px';
  g.font = sans(26, 800); g.fillStyle = GOLD; g.letterSpacing = '5px'; g.fillText(sub, W / 2, 472); g.letterSpacing = '0px';
  qaRect(g, 70, 372, W - 140, 120, 'text', title);
  rows.forEach(([name, val, col, t0, note], i) => {
    if (t < t0) return;
    const u = ease.out(seg(t, t0, t0 + 0.55, lin)), v = lerp(lo, val, u), y = 680 + i * 250, x0 = 90, wmax = W - 180, wv = wmax * clamp((v - lo) / (hi - lo));
    g.textAlign = 'left'; g.font = sans(36, 900); g.fillStyle = '#FFFFFF'; g.fillText(name, x0, y - 24);
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x0, y, wmax, 110);
    const gr = g.createLinearGradient(x0, 0, x0 + wv, 0); gr.addColorStop(0, mix(col, '#000000', 0.35)); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(x0, y, Math.max(10, wv), 110);
    g.font = sans(64, 900); g.fillStyle = '#16120E'; const txt = String(Math.round(v));
    if (wv > 260) { g.textAlign = 'right'; g.fillText(txt, x0 + wv - 24, y + 80); } else { g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.fillText(txt, x0 + wv + 20, y + 80); }
    if (note) { g.textAlign = 'left'; g.font = sans(22, 800); g.letterSpacing = '3px'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillText(note, x0, y + 150); g.letterSpacing = '0px'; }
    qaRect(g, x0, y - 60, wmax, 220, 'text', name);
  });
}
function vsScore(g, lt, t, l, r, { title = 'CLASSICAL WINS', note = 'HEAD TO HEAD · THROUGH 2025', lE = 'smug', rE = 'neutral' } = {}) {
  const bg = g.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, '#5A1EA8'); bg.addColorStop(0.5, '#180C40'); bg.addColorStop(1, '#0E5A9A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.textAlign = 'center'; g.font = sans(44, 900); g.letterSpacing = '5px'; g.fillStyle = '#FFFFFF'; g.fillText(title, W / 2, 230); g.letterSpacing = '0px';
  g.font = sans(22, 800); g.letterSpacing = '4px'; g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText(note, W / 2, 276); g.letterSpacing = '0px';
  qaRect(g, 120, 190, W - 240, 100, 'text', 'vs title');
  webcam(g, 60, 340, 450, 520, 'magnus', lE, t, { bg: ['#7A3AD8', '#2A1060'], name: 'MAGNUS', zoom: 1.0, cy: 0.5 });
  webcam(g, 570, 340, 450, 520, 'hikaru', rE, t, { bg: ['#2A7AD8', '#0E2A60'], name: 'HIKARU', zoom: 1.0, cy: 0.5 });
  for (const [x, v, col, k] of [[285, l.v, GOLD, l.k], [795, r.v, '#9FC8FF', r.k]]) {
    g.save(); g.translate(x, 1080); g.scale(k, k); g.textAlign = 'center'; g.font = sans(210, 900); g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#0A0620';
    g.strokeText(String(v), 0, 0); g.fillStyle = col; g.fillText(String(v), 0, 0); g.restore();
  }
  qaRect(g, 160, 920, 760, 170, 'text', 'score');
  g.font = sans(80, 900); g.fillStyle = 'rgba(255,255,255,0.5)'; g.textAlign = 'center'; g.fillText('–', W / 2, 1040);
}
function yearStrip(g, lt, t, t0, dt, cT) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3A1400'); bg.addColorStop(0.5, '#7A3A00'); bg.addColorStop(1, '#2A0E00'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  embers(g, t, { n: 50, seed: 4, a: 0.5, color: '#FFD98A' });
  g.textAlign = 'center'; g.font = sans(40, 900); g.letterSpacing = '5px'; g.fillStyle = '#FFFFFF'; g.fillText('WORLD NO. 1 · EVERY FIDE LIST', W / 2, 250); g.letterSpacing = '0px';
  qaRect(g, 90, 210, W - 180, 56, 'text', 'strip title');
  for (let i = 0; i < 16; i++) {  // 2011 .. 2026
    const c = i % 4, r = Math.floor(i / 4), x = 150 + c * 260, y = 380 + r * 170, on = t >= t0 + i * dt, k = on ? lerp(1.25, 1, seg(t, t0 + i * dt, t0 + i * dt + 0.15, ease.back)) : 1;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = on ? GOLD : 'rgba(255,255,255,0.1)'; g.beginPath(); g.roundRect(-115, -60, 230, 120, 16); g.fill();
    g.font = sans(54, 900); g.fillStyle = on ? '#2A1600' : 'rgba(255,255,255,0.35)'; g.fillText(String(2011 + i), 0, 18);
    g.restore();
  }
  qaRect(g, 30, 310, W - 60, 660, 'text', 'years');
  if (t >= cT) counter(g, '15 YEARS', 'STRAIGHT · SINCE JULY 2011', { y: 1130, size: 140, color: '#FFFFFF', labelColor: GOLD, a: seg(t, cT, cT + 0.1) });
}
function phoneBoard(g, lt, t) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2FAE4E'); bg.addColorStop(1, '#14682C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, i * 340, W, 170); }
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H / 2, 260, 0, 7); g.stroke();
  const u = ease.out(clamp(lt / 0.3));
  g.save(); g.translate(W / 2, 700 + (1 - u) * 120); g.globalAlpha *= u;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = '#111318'; g.beginPath(); g.roundRect(-330, -560, 660, 1100, 60); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#F6F7F9'; g.beginPath(); g.roundRect(-300, -520, 600, 1020, 40); g.fill();
  g.fillStyle = '#37003C'; g.beginPath(); g.roundRect(-300, -520, 600, 170, [40, 40, 0, 0]); g.fill();
  g.fillStyle = '#FFFFFF'; g.textAlign = 'left'; g.font = sans(30, 900); g.fillText('FANTASY FOOTBALL', -260, -450); g.font = sans(22, 800); g.fillStyle = '#05F0FF'; g.fillText('OVERALL RANKING · DEC 2019', -260, -400);
  qaRect(g, -260, -480, 520, 100, 'text', 'app head');
  const rows = [['1', 'Kjell Ankedal', 'MAGNUS CARLSEN', true], ['2', '·······', '·······', false], ['3', '·······', '·······', false], ['4', '·······', '·······', false], ['5', '·······', '·······', false]];
  rows.forEach(([n, team, man, me], i) => {
    const y = -280 + i * 140, a = seg(lt, 0.2 + i * 0.08, 0.35 + i * 0.08);
    g.globalAlpha = u * a; g.fillStyle = me ? '#FFE14D' : '#FFFFFF'; g.beginPath(); g.roundRect(-280, y - 50, 560, 120, 18); g.fill();
    g.fillStyle = '#37003C'; g.font = sans(52, 900); g.textAlign = 'center'; g.fillText(n, -220, y + 30);
    g.textAlign = 'left'; g.font = sans(32, 900); g.fillText(team, -160, y + 4); g.font = sans(22, 800); g.fillStyle = me ? '#6A4A00' : '#9AA0AA'; g.fillText(man, -160, y + 40);
  });
  g.globalAlpha = u; qaRect(g, -280, -330, 560, 680, 'text', 'rows');
  g.restore();
}
function playerSea(g, lt, t, cT) {
  const bg = g.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.45, H); bg.addColorStop(0, '#24106A'); bg.addColorStop(1, '#06031A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const z = lerp(9, 1, ease.inOut(seg(lt, 0, 1.4, lin))), r = rng(9), cx = W / 2, cy = 760;
  for (let i = 0; i < 2600; i++) {  // the field zooms out around the one gold dot
    const x = cx + (r() - 0.5) * 2600 / z * 3, y = cy + (r() - 0.5) * 2600 / z * 3, col = PAL[i % PAL.length];
    if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
    g.fillStyle = rgba(col, 0.75); g.beginPath(); g.arc(x, y, Math.max(1.5, 7 / Math.sqrt(z) * 1.6), 0, 7); g.fill();
  }
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
  g.strokeStyle = GOLD; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 40 + 8 * Math.sin(t * 6), 0, 7); g.stroke();
  g.font = sans(30, 900); g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.letterSpacing = '4px'; g.fillText('MAGNUS', cx, cy - 70); g.letterSpacing = '0px';
  qaRect(g, cx - 90, cy - 104, 180, 44, 'text', 'magnus dot');
  if (t >= cT) counter(g, '7,000,000+', 'PLAYERS', { y: 400, size: 150, color: '#FFFFFF', labelColor: GOLD, a: seg(t, cT, cT + 0.1) });
}
// result plate (rapid, Reykjavík 2004)
function plate(g, a, l1, l2, { y = 1560 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(10,8,24,0.86)'; g.beginPath(); g.roundRect(110, y - 170, W - 220, 230, 24); g.fill();
  g.textAlign = 'center'; g.font = sans(26, 800); g.letterSpacing = '6px'; g.fillStyle = GOLD; g.fillText(l1, W / 2, y - 100);
  g.letterSpacing = '0px'; g.font = sans(54, 900); g.fillStyle = '#FFFFFF'; g.fillText(l2, W / 2, y - 18);
  qaRect(g, 110, y - 170, W - 220, 230, 'text', 'plate');
  g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);

  // ======================= HOOK: ten boards behind his back =======================
  const tenT = w('hook1', 'ten'), backT = w('hook1', 'back'), boardT = w('hook1', 'board.'), scaryT = w('hook2', 'scariest');
  const CLOSE = (yaw = 0, dist = 4.6, y = 2.75) => ({ yaw, pitch: 0.1, dist, fov: 1500, cy: H * 0.5, target: [0, y, 0] });
  const WIDE = (yaw = 0, pitch = 0.6, dist = 17) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.52, target: [0, 1.0, 3.4] });
  shot(0, (g, lt, t) => simul(g, lt, t, [[0, CLOSE(0.12, 5.2)], [1.6, CLOSE(0.02, 4.4)]], { close: true }),
    { noJump: true, grade: 'stream', hud: (g, lt) => bigText(g, '10 GAMES AT ONCE', 'WITHOUT LOOKING', 250, { a: 1 - seg(lt, 1.15, 1.35) }) });
  const wideT = tenT - 0.12, LITT = SIM.map((_, i) => tenT + 0.05 + i * 0.09);
  shot(wideT, (g, lt, t) => simul(g, lt, t, [[0, WIDE(0.0, 0.95, 21)], [0.5, WIDE(0.05, 0.62, 17), ease.whip], [2, WIDE(0.1, 0.55, 16)]], { litT: LITT }),
    { noJump: true, grade: 'stream', hud: (g, lt, t) => { const n = SIM.filter((_, i) => t >= LITT[i]).length; counter(g, String(n), 'OPPONENTS', { y: 330, size: 170, color: '#FFFFFF', labelColor: '#FF4FD8', a: seg(t, tenT, tenT + 0.08) }); } });
  LITT.forEach((tt, i) => i % 3 === 0 && cue(tt, 'piece', 0.25)); boom(LITT[9] + 0.05, 0.75);
  shot(w('hook1', 'with') - 0.1, (g, lt, t, sh) => simul(g, lt, t, flyAt(CLOSE(-0.85, 6.4, 2.4), CLOSE(0.55, 6.0, 2.4), backT - sh.a + 0.05, len(sh), 0.32), { close: true }),
    { grade: 'stream', hud: (g, lt, t) => placeStamp(g, lt, 'CBS · 60 Minutes', '2012', { y: 200, t0: 0.15 }) });
  cue(backT - 0.12, 'whoosh_fast', 0.4); boom(boardT, 0.9);
  shot(s('hook2') - 0.08, (g, lt, t, sh) => simul(g, lt, t, [[0, CLOSE(0.2, 3.8, 2.85)], [scaryT - sh.a, CLOSE(0.05, 2.6, 2.95), ease.whip], [len(sh), CLOSE(0.0, 2.3, 2.95)]], { close: true, e: { ...EXPR.smug, curve: 0.9 }, glow: null }),
    { noJump: true, grade: 'stream', post: (g, lt, t) => { const a = 0.35 * seg(t, scaryT, scaryT + 0.2); if (a > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(255,60,90,${a})`; g.fillRect(0, 0, W, H); g.restore(); } } });
  cue(scaryT - 0.1, 'whoosh_fast', 0.35); cue(scaryT, 'dun_dun', 0.5);

  // ======================= AGE 5: every country =======================
  const fiveT = w('kid1', 'five,'), flagT = w('kid1', 'flag,'), capT = w('kid1', 'capital,'), popT = w('kid1', 'population.');
  const mapT = s('kid1') - 0.1;
  shot(mapT, (g, lt, t) => world(g, lt, t, mapT + 0.1, flagT - 0.1), { trans: 'whip', info: true, grade: 'neutral', hud: (g, lt, t) => {
    counter(g, 'AGE 5', 'EVERY COUNTRY ON EARTH', { y: 330, size: 150, color: '#FFFFFF', labelColor: '#5EE06B', a: seg(t, fiveT - 0.05, fiveT + 0.05) });
  } });
  cue(mapT - 0.1, 'whoosh_fast', 0.35); cue(fiveT, 'sparkle_pop', 0.4);
  const wallT = flagT - 0.08;
  shot(wallT, (g, lt, t) => flagWall(g, lt, t, wallT, { checks: [['FLAG', flagT], ['CAPITAL', capT], ['POPULATION', popT]] }), { trans: 'cut', info: true, grade: 'neutral',
    hud: (g, lt, t) => tag(g, 'ACCORDING TO HIS FIRST COACH', 560, seg(t, popT + 0.12, popT + 0.24), { size: 24 }) });
  for (const tc of [flagT, capT, popT]) cue(tc, 'sparkle_pop', 0.4);

  // ======================= 13: grandmaster, and a draw with Kasparov =======================
  const gmT = w('kid2', 'grandmaster,'), drewT = w('kid2', 'drew'), garryT = w('kid2', 'Garry'), no1T = w('kid2', 'world');
  shot(s('kid2') - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'magnus14', exprAt([[0, 'focus'], [gmT - (t - lt), { ...EXPR.happy, nod: 0.6 }]], lt), { back: 'warm', keys: flyAt(FRONT(0.85, -0.1), FRONT(0.12, 0.45), 0.14, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => { counter(g, 'AGE 13', null, { y: 250, size: 140, color: '#FFFFFF', a: seg(t, s('kid2'), s('kid2') + 0.1) }); badge(g, 'GRANDMASTER', W / 2, 360, { color: GOLD, size: 52, sub: 'APRIL 2004', a: seg(t, gmT, gmT + 0.1), scale: pop(t, gmT) }); } });
  cue(s('kid2') - 0.06, 'whoosh_fast', 0.3); boom(gmT);
  const kT = w('kid2', 'and') - 0.08;
  shot(kT, (g, lt, t, sh) => twoShot(g, lt, t, 'kasparov', 'magnus14', 'focus', 'focus', { back: 'warm', pieces: at(30), keys: flyAt(OTS(-0.7, 12.5), OTS(0.32, 11.2), 0.14, len(sh), 0.3) }),
    { trans: 'cut', hud: (g, lt, t) => plate(g, seg(t, drewT, drewT + 0.12), 'REYKJAVIK · MARCH 2004 · RAPID', 'CARLSEN  ½–½  KASPAROV') });
  cue(kT, 'whoosh_fast', 0.3); boom(drewT, 0.8);
  shot(no1T - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: Math.PI - 0.25, pitch: 0.3, dist: 6.9, fov: 1500, cy: H * 0.46, target: [4, 2.9, -1.2] }], [len(sh), { yaw: Math.PI - 0.15, pitch: 0.3, dist: 6.4, fov: 1500, cy: H * 0.46, target: [4, 2.9, -1.2] }]], { t });
    backdrop(g, t, 'warm'); const hp = B.project(4, 3.3, -1.4); rim(g, hp.x, hp.y, hp.s * 4.2, '#FFC060', 0.45);
    const h = seated(g, B, 'kasparov', exprAt([[0, 'focus'], [0.5, { ...EXPR.shock, open: 0.3 }]], lt), t, { z: -1.4, face: 1 });
    gameTable(g); B.drawSlab(g, COM); B.drawPieces(g, at(30), { focus: B.dist, dof: 1.6 }); h(); lowKey(g, { cy: H * 0.4, a: 0.28 });
  }, { trans: 'cut', hud: (g, lt, t) => badge(g, 'WORLD NO. 1', W / 2, 300, { color: RED, size: 54, sub: 'GARRY KASPAROV, 2004', a: seg(t, no1T, no1T + 0.1), scale: pop(t, no1T) }) });
  cue(no1T, 'stamp', 0.45);

  // ======================= ENDGAMES LIKE A COMPUTER: the 136-move game of 2021 =======================
  const cpuT = w('end1', 'computer.'), y21T = w('end2', '2021,'), drawT = w('end2', 'draw'), fifT = w('end2', 'fifteen'), pushT = s('end3') - 0.05, wonT = w('end3', 'won');
  const n136T = w('end3', '136'), longT = w('end3', 'longest');
  shot(s('end1') - 0.08, (g, lt, t, sh) => portrait(g, lt, t, t >= cpuT ? 'magnusCPU' : 'magnus', exprAt([[0, 'focus'], [cpuT - (t - lt), { ...EXPR.focus, lid: 0.1, pupil: 0.55 }]], lt), { back: 'dubai', keys: flyAt(FRONT(-0.8, 0.0), FRONT(-0.1, 0.7), 0.14, len(sh)) }),
    { trans: 'whip', grade: 'neutral', post: (g, lt, t) => scan(g, t, seg(t, cpuT, cpuT + 0.15)), hud: (g, lt, t) => { if (t >= cpuT) evalBar(g, 60, 520, 640, 0, { label: '0.00', a: seg(t, cpuT, cpuT + 0.1) }); } });
  cue(s('end1') - 0.18, 'whoosh_fast', 0.3); cue(cpuT, 'error', 0.3);
  const bT = s('end2') - 0.06, ffT = w('end2', 'for') - 0.05;
  shot(bT, (g, lt, t, sh) => portrait(g, lt, t, 'nepo', 'focus', { back: 'dubai', pieces: at(230), keys: [[0, { yaw: 0.35, pitch: 0.55, dist: 9.5, fov: 1500, cy: H * 0.5, target: [4, 1.2, 5] }], [len(sh), { yaw: 0.2, pitch: 0.6, dist: 8.6, fov: 1500, cy: H * 0.5, target: [4, 1.2, 5] }]] }),
    { trans: 'cut', hud: (g, lt, t) => {
      placeStamp(g, lt, 'Dubai · World Championship', '2021', { y: 190, t0: 0.05 });
      evalBar(g, 60, 420, 700, 0, { label: '0.00' });
      if (t >= drawT) badge(g, 'TABLEBASE: DEAD DRAW', W / 2, 1110, { color: BLUE, size: 44, a: seg(t, drawT, drawT + 0.1), scale: pop(t, drawT) });
    } });
  boom(drawT, 0.7);
  const FF0 = 230, FF1 = 259, ffDt = (pushT - 0.15 - ffT) / (FF1 - FF0);
  shot(ffT, (g, lt, t) => {
    const R = stepPieces(FF0, FF1, ffT + 0.05, ffDt, t);
    rig(B, lt, [[0, { yaw: 0.2, pitch: 0.95, dist: 10.5, fov: 1500, cy: H * 0.52, target: [4, 0, 4] }], [2, { yaw: -0.1, pitch: 1.0, dist: 10, fov: 1500, cy: H * 0.52, target: [4, 0, 4] }]], { t });
    backdrop(g, t, 'dubai'); gameTable(g); B.drawSlab(g, COM);
    const m = G6[R.k]; if (R.k > FF0 && m.from) { B.highlight(g, m.from, '#F2C46A', 0.45); B.highlight(g, m.to, TEAL, 0.6); }
    B.drawPieces(g, R.pieces, { focus: B.dist, dof: 0.8 }); lowKey(g, { cy: H * 0.45, a: 0.25 });
  }, { trans: 'cut', info: true, hud: (g, lt, t) => {
    const R = stepPieces(FF0, FF1, ffT + 0.05, ffDt, t), mv = Math.ceil(R.k / 2);
    counter(g, 'MOVE ' + mv, 'COMPUTER: 0.00 · DRAW', { y: 330, size: 130, color: '#FFFFFF', labelColor: BLUE });
    evalBar(g, 60, 520, 640, 0, { label: '0.00' });
  } });
  for (let i = 0; i < 8; i++) cue(ffT + 0.1 + i * 0.16, 'clock_tick', 0.25);
  shot(pushT, (g, lt, t, sh) => twoShot(g, lt, t, 'magnus', 'nepo', 'focus', { ...EXPR.tired, sweat: 1 }, { back: 'dubai', pieces: at(259), keys: flyAt(OTS(0.75, 12.5), OTS(-0.3, 11.2), 0.14, len(sh), 0.3) }),
    { trans: 'cut', hud: (g, lt, t) => counter(g, '7 HOURS +', 'AT THE BOARD', { y: 330, size: 110, color: '#FFFFFF', labelColor: GOLD }) });
  cue(pushT, 'whoosh_fast', 0.3);
  const wT = wonT - 0.08, errT = wT + 0.1, HOLD = 0.6, endK = 271, finT = n136T + 0.55, wDt = (finT - (errT + HOLD)) / (endK - 261);
  shot(wT, (g, lt, t) => {
    const R = t < errT + HOLD ? stepPieces(259, 260, errT, 0.3, t) : stepPieces(260, endK, errT + HOLD, wDt, t);
    rig(B, lt, [[0, { yaw: -0.25, pitch: 0.75, dist: 9.5, fov: 1500, cy: H * 0.52, target: [5.5, 0, 4.5] }], [finT - wT - 0.1, { yaw: 0.15, pitch: 0.7, dist: 8.2, fov: 1500, cy: H * 0.52, target: [5.8, 0, 5.5] }], [finT - wT + 0.18, { yaw: 0.75, pitch: 0.55, dist: 7.0, fov: 1500, cy: H * 0.52, target: [6, 0.5, 6] }, ease.whip], [3, { yaw: 0.85, pitch: 0.5, dist: 6.6, fov: 1500, cy: H * 0.52, target: [6, 0.5, 6] }]], { t });
    backdrop(g, t, 'dubai'); gameTable(g); B.drawSlab(g, COM);
    const m = G6[R.k]; if (R.k >= 260 && m.from) { B.highlight(g, m.from, R.k === 260 ? RED : '#F2C46A', 0.45); B.highlight(g, m.to, R.k === 260 ? RED : TEAL, 0.65); }
    B.drawPieces(g, R.pieces, { focus: B.dist, dof: 1.0 });
    if (R.k === 260) { const [x, z] = sqXZ('e6'), p = B.project(x, 1.9, z); g.save(); g.font = sans(Math.round(p.s * 0.7), 900); g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = '#1A0606'; g.strokeText('?', p.x, p.y); g.fillStyle = RED; g.fillText('?', p.x, p.y); g.restore(); }
    if (t >= finT) { const [x, z] = sqXZ('g7'), p = B.project(x, 0.1, z); shockwave(g, p.x, p.y, t, finT, { r0: 30, r1: 520, life: 0.55, color: GOLD, lw: 12, squash: 0.45 }); }
    lowKey(g, { cy: H * 0.45, a: 0.25 });
  }, { trans: 'cut', hud: (g, lt, t) => {
    const R = t < errT + HOLD ? { k: t >= errT ? 260 : 259 } : stepPieces(260, endK, errT + HOLD, wDt, t);
    if (R.k === 260) tag(g, '130... QE6?  THE ONE MISTAKE', 1120, 1, { color: RED, size: 30 });
    counter(g, t >= finT ? '136 MOVES' : 'MOVE ' + Math.ceil(R.k / 2), t >= finT ? '1–0 · CARLSEN WINS' : null, { y: 330, size: 130, color: t >= finT ? GOLD : '#FFFFFF', labelColor: '#5EE06B' });
  } });
  cue(errT + 0.15, 'error', 0.3); boom(finT, 1.0);
  shot(longT - 0.08, (g, lt, t) => bars(g, lt, t, 'LONGEST WORLD CHAMPIONSHIP GAME', 'MOVES IN ONE GAME', [
    ['CARLSEN – NEPOMNIACHTCHI · 2021', 136, GOLD, longT, '7 HOURS 45 MINUTES · CARLSEN WON'], ['KORCHNOI – KARPOV · 1978', 124, '#9AA6C8', longT + 0.25, 'THE OLD RECORD · A DRAW']], { lo: 0, hi: 140 }),
    { trans: 'whip', info: true });
  cue(longT - 0.18, 'whoosh_fast', 0.3); boom(longT + 0.5, 0.7);

  // ======================= 2882 vs 2816, 14-1, No. 1 for 15 years =======================
  const r2882 = w('rate1', '2882,'), hiT = w('rate1', 'highest'), hikT = s('rate2') - 0.06, r2816 = w('rate2', '2816.');
  shot(s('rate1') - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', 'smug', { back: 'stage', keys: flyAt(FRONT(0.85, 0.0), FRONT(0.15, 0.55), 0.14, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => counter(g, '2882', 'PEAK RATING · MAY 2014', { y: 290, size: 170, color: GOLD, labelColor: '#FF4FD8', a: seg(t, r2882 - 0.05, r2882 + 0.05) }) });
  cue(s('rate1') - 0.12, 'whoosh_fast', 0.3); boom(r2882);
  shot(hiT - 0.1, (g, lt, t) => bars(g, lt, t, 'HIGHEST RATING EVER', 'FIDE · CLASSICAL', [['MAGNUS CARLSEN', 2882, GOLD, hiT - 0.05, 'MAY 2014 · THE RECORD']], { lo: 2700, hi: 2900 }), { trans: 'cut', info: true });
  boom(hiT + 0.4, 0.6);
  shot(hikT, (g, lt, t, sh) => portrait(g, lt, t, 'hikaru', exprAt([[0, 'neutral'], [r2816 - (t - lt), { ...EXPR.happy, curve: 0.5 }]], lt), { back: 'stage', keys: flyAt(FRONT(-0.85, 0.0), FRONT(-0.12, 0.55), 0.14, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => { counter(g, '2816', "HIKARU'S PEAK · OCT 2015", { y: 290, size: 170, color: '#9FC8FF', labelColor: BLUE, a: seg(t, r2816 - 0.05, r2816 + 0.05) });
      if (t > r2816 + 0.35) badge(g, '−66', W / 2 + 330, 210, { color: RED, size: 44, scale: pop(t, r2816 + 0.35) }); } });
  cue(hikT - 0.04, 'whoosh_fast', 0.3); cue(r2816, 'thud', 0.45);
  const vsT = s('rate3') - 0.05, f14 = w('rate3', 'fourteen'), onceT = w('rate3', 'once.'), hk2T = T.w('rate3', 9).s;  // the second "Hikaru"
  shot(vsT, (g, lt, t) => {
    const n = Math.round(lerp(0, 14, ease.out(seg(t, f14 - 0.9, f14, lin))));
    vsScore(g, lt, t, { v: n, k: t >= f14 ? lerp(1.35, 1, seg(t, f14, f14 + 0.25, ease.back)) : 1 }, { v: 0, k: 1 }, { lE: t >= f14 ? { ...EXPR.smug, curve: 0.9 } : 'smug' });
  }, { trans: 'whip', info: true });
  cue(vsT - 0.1, 'whoosh_fast', 0.3); for (let i = 0; i < 6; i++) cue(f14 - 0.85 + i * 0.14, 'clock_tick', 0.22); boom(f14, 0.9);
  shot(hk2T - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'hikaru', exprAt([[0, 'neutral'], [onceT - (t - lt), { ...EXPR.sad, curve: 0.1 }]], lt), { back: 'stage', keys: flyAt(FRONT(0.3, 0.6), FRONT(-0.35, 0.95), onceT - sh.a, len(sh)) }),
    { trans: 'cut', hud: (g, lt, t) => { counter(g, t >= onceT ? '1' : '0', 'HIKARU’S CLASSICAL WINS VS MAGNUS', { y: 300, size: 180, color: '#9FC8FF', labelColor: BLUE }); } });
  cue(onceT, 'thud', 0.5);
  const yrT = s('rate4') - 0.08, y15 = w('rate4', 'fifteen');
  shot(yrT, (g, lt, t) => yearStrip(g, lt, t, w('rate4', 'world'), (y15 - w('rate4', 'world')) / 15, y15), { trans: 'cut', info: true, grade: 'warm' });
  boom(y15, 0.9);

  // ======================= IQ: never said =======================
  const neverT = w('iq', 'never');
  shot(s('iq') - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', { ...EXPR.smug, curve: 0.8, look: [0.4, 0] }, { back: 'stage', keys: flyAt(FRONT(-0.3, 0.7), FRONT(0.35, 1.0), neverT - sh.a, len(sh)) }),
    { trans: 'cut', qaAllow: ['texts overlap'], hud: (g, lt, t) => {
      g.fillStyle = 'rgba(10,8,24,0.84)'; g.beginPath(); g.roundRect(150, 1390, W - 300, 230, 24); g.fill();
      counter(g, 'IQ ???', null, { y: 1560, size: 150, color: '#FFFFFF' });
      if (t >= neverT) { g.save(); g.translate(W / 2, 1490); g.rotate(-0.1); const k = lerp(1.6, 1, seg(t, neverT, neverT + 0.2, ease.back)); g.scale(k, k);
        g.strokeStyle = RED; g.lineWidth = 9; g.strokeRect(-280, -64, 560, 128); g.fillStyle = RED; g.font = sans(66, 900); g.textAlign = 'center'; g.letterSpacing = '6px'; g.fillText('NEVER SAID', 0, 24); g.restore(); }
    } });
  cue(neverT, 'stamp', 0.55);

  // ======================= FANTASY PREMIER LEAGUE: No. 1 of seven million =======================
  const oneT = w('fpl', 'one'), fanT = w('fpl', 'at') - 0.08, outT = w('fpl', 'Out') - 0.1, sevT = w('fpl', 'seven');
  shot(s('fpl') - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', exprAt([[0, 'happy'], [oneT - (t - lt), { ...EXPR.triumph, nod: 0.6 }]], lt), { back: 'pitch', keys: flyAt(FRONT(0.85, 0.0), FRONT(0.12, 0.5), 0.14, len(sh)) }),
    { trans: 'whip', grade: 'warm', hud: (g, lt, t) => { counter(g, '2019', null, { y: 240, size: 120, color: '#FFFFFF' }); if (t >= oneT) badge(g, 'NO. 1 IN THE WORLD', W / 2, 345, { color: '#5EE06B', size: 52, scale: pop(t, oneT) }); } });
  cue(s('fpl') - 0.18, 'whoosh_fast', 0.3); boom(oneT, 0.85);
  shot(fanT, (g, lt, t) => phoneBoard(g, lt, t), { trans: 'cut', info: true, grade: 'warm' });
  cue(fanT, 'notify', 0.3);
  shot(outT, (g, lt, t) => playerSea(g, lt, t, sevT), { trans: 'cut', info: true, grade: 'neutral' });
  boom(sevT, 0.8);

  // ======================= CTA: how many moves would you last? =======================
  const cT = s('cta') - 0.08, movesT = w('cta', 'moves'), comT = w('cta', 'Comment');
  shot(cT, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', { ...EXPR.smug, curve: 0.8 }, { back: 'stage', keys: flyAt(FRONT(-0.8, 0.0), FRONT(-0.06, 0.6), 0.14, 3) }),
    { trans: 'cut', noJump: true, hud: (g, lt, t) => { if (t >= movesT) badge(g, 'HOW MANY MOVES WOULD YOU LAST?', W / 2, 210, { color: '#FFD43B', size: 42, scale: pop(t, movesT) }); } });
  cue(cT - 0.04, 'whoosh_fast', 0.3); boom(movesT, 0.6);
  shot(comT - 0.1, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', { ...EXPR.smug, curve: 0.95 }, { back: 'stage', keys: [[0, FRONT(-0.06, 0.35)], [3, FRONT(-0.02, 0.5)]] }),
    { trans: 'cut', noJump: true, hud: (g, lt, t) => {
      badge(g, 'HOW MANY MOVES WOULD YOU LAST?', W / 2, 210, { color: '#FFD43B', size: 42 });
      badge(g, 'COMMENT A NUMBER', W / 2, 320, { color: '#5EE06B', size: 48, scale: pop(t, comT) });
      badge(g, 'FOLLOW FOR MORE', W / 2, 425, { color: '#8A8F98', size: 32, sub: 'THE 64 FILES', a: seg(t, comT + 0.5, comT + 0.6) });
    } });
  cue(comT, 'notify', 0.35);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: mapT, m: 'digital' }, { t: s('end1') - 0.08, m: 'tension' }, { t: wT, m: 'hit' }, { t: longT - 0.08, m: 'build' },
    { t: s('iq') - 0.08, m: 'drop' }, { t: s('fpl') - 0.08, m: 'digital' }, { t: cT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.3, zooms: [1, 1.12, 1.05], shift: 40 } };
}
