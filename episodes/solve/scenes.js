// Can chess be solved? Shannon's 1950 estimate (10^120 games, 10^90 years for the first move), atoms in the universe,
// checkers solved in 2007, 4.8 x 10^44 legal positions, the 7-piece Lomonosov tablebase (140 TB, mate in 549),
// 8 pieces still running, 32 impossible, engines draw each other: probably a draw, nobody can prove it.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas } from '../../engine/js/core.js';
import { flash, confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { nameTitle, counter, badge, stamp, placeStamp, sans, serif, mono } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { room, table, box, picture, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { burst, shockwave, embers } from '../../engine/js/fx.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const START = piecesAt(G, 0);
const photo = async k => { try { return await loadPhoto3d(`../episodes/solve/photos/${k}`); } catch { return null; } };
const PH = { shannon: await photo('shannon') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const CHK = { light: '#E6D6B0', dark: '#2E3A2A', frame: '#5A2A1E', side: '#3A1A12' };
const LAB = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.3, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const SERVER = { base: '#04070B', wall: ['#121C26', '#0E161E'], seam: '#0A1016', floor: ['#0C1218', '#090E13'], light: '#A8D4FF', lightA: 0.2, strips: '#4FA8FF' };
const CREDIT = 'C.E. SHANNON · TEKNISKA MUSEET (STOCKHOLM) · CC BY 2.0';

const P = (spec) => spec.map(([t, c, sq]) => { const [x, z] = sqXZ(sq); return { t, c, x, z }; });
const SEVEN = P([['k', 'w', 'g1'], ['q', 'w', 'd4'], ['n', 'w', 'e5'], ['k', 'b', 'b7'], ['r', 'b', 'c8'], ['b', 'b', 'f8'], ['n', 'b', 'a5']]);
const EIGHT = P([['k', 'w', 'g1'], ['q', 'w', 'd4'], ['r', 'w', 'h3'], ['k', 'b', 'b7'], ['r', 'b', 'c8'], ['b', 'b', 'f8'], ['n', 'b', 'a5'], ['n', 'b', 'e6']]);

// "10" with a raised exponent, centred at x
function pow10(g, x, y, e, size, color, { a = 1, label = null, labelColor = C.gold } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  g.font = sans(size, 900); const w1 = g.measureText('10').width; g.font = sans(size * 0.55, 900); const w2 = g.measureText(String(e)).width;
  const x0 = x - (w1 + w2) / 2;
  g.font = sans(size, 900); g.lineWidth = size * 0.07; g.strokeStyle = 'rgba(10,8,6,0.6)'; g.strokeText('10', x0, y); g.fillStyle = color; g.fillText('10', x0, y);
  g.font = sans(size * 0.55, 900); g.strokeText(String(e), x0 + w1 + 4, y - size * 0.45); g.fillText(String(e), x0 + w1 + 4, y - size * 0.45);
  if (label) { g.font = sans(24, 800); g.letterSpacing = '5px'; g.textAlign = 'center'; const lw = g.measureText(label).width + 30; g.fillStyle = labelColor; g.fillRect(x - lw / 2, y + 26, lw, 40); g.fillStyle = C.ink; g.textBaseline = 'middle'; g.fillText(label, x + 2, y + 47); }
  g.restore();
}

// server racks with blinking LEDs, standing on the floor along z
function racks(g, b, xs, z, t, { h = 9, w = 2, d = 2, red = 0.2 } = {}) {
  for (const x of xs) box(g, b, [x, FLOOR_Y, z], [x + w, FLOOR_Y + h, z + d], { top: '#1A2028', side: '#0E1218', front: '#141A22' });
  for (const x of xs) {
    if (b.toCam(x + w / 2, 2, z)[2] < 1) continue;
    for (let k = 0; k < 18; k++) {
      const p = b.project(x + 0.35 + (k % 3) * 0.6, FLOOR_Y + 1 + Math.floor(k / 3) * (h - 2) / 6, z - 0.02);
      const on = (k * 7 + Math.floor(t * 6 + x)) % 5;
      g.fillStyle = on ? '#4FD18A' : (k % 4 ? '#7AA6D6' : rgba('#FF6B4F', 0.5 + red)); g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.07), 0, 7); g.fill();
    }
  }
}

// a 1950s computer cabinet: wall of bulbs, two tape reels, a printer slot
function oldComputer(g, b, x0, z0, t, { busy = 1 } = {}) {
  const x1 = x0 + 6, y1 = FLOOR_Y + 9, z1 = z0 + 2.2;
  box(g, b, [x0, FLOOR_Y, z0], [x1, y1, z1], { top: '#6A6458', side: '#3E3A32', front: '#8A8274' });
  if (b.toCam(x0 + 3, 2, z0)[2] < 1) return;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    const p = b.project(x0 + 0.7 + i * 0.6, FLOOR_Y + 6.2 + j * 0.55, z0 - 0.02), on = Math.sin(t * (5 + i) + j * 2.1 + i) > 0.2 - busy * 0.4;
    g.fillStyle = on ? '#FFD27A' : '#4A3A22'; g.beginPath(); g.arc(p.x, p.y, Math.max(2, p.s * 0.14), 0, 7); g.fill();
    if (on) { g.fillStyle = rgba('#FFD27A', 0.25); g.beginPath(); g.arc(p.x, p.y, p.s * 0.3, 0, 7); g.fill(); }
  }
  for (const [rx, sp] of [[x0 + 4.4, 1], [x0 + 5.3, -1.3]]) {  // tape reels
    const c = b.project(rx, FLOOR_Y + 5.2, z0 - 0.02), r = c.s * 0.42;
    g.fillStyle = '#2A2620'; g.beginPath(); g.arc(c.x, c.y, r, 0, 7); g.fill();
    g.strokeStyle = '#B8B0A0'; g.lineWidth = Math.max(2, r * 0.12);
    for (let k = 0; k < 3; k++) { const a = t * 3 * sp * busy + k * 2.09; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(a) * r * 0.85, c.y + Math.sin(a) * r * 0.85); g.stroke(); }
    g.fillStyle = '#B8B0A0'; g.beginPath(); g.arc(c.x, c.y, r * 0.18, 0, 7); g.fill();
  }
  const s0 = b.project(x0 + 0.6, FLOOR_Y + 3.6, z0 - 0.02), s1 = b.project(x0 + 3.4, FLOOR_Y + 2.8, z0 - 0.02);
  g.fillStyle = '#1A1814'; g.fillRect(s0.x, s0.y, s1.x - s0.x, s1.y - s0.y);
}

// checker discs standing on the board plane
function checkers(g, b, list) {
  const sorted = list.map(q => ({ ...q, d: b.toCam(q.x, 0, q.z)[2] })).sort((a, q) => q.d - a.d);
  for (const q of sorted) {
    const ring = y => [...Array(18)].map((_, i) => [q.x + Math.cos(i / 18 * 6.283) * 0.38, y, q.z + Math.sin(i / 18 * 6.283) * 0.38]);
    const top = q.c === 'r' ? '#C8402E' : '#2A2622', side = q.c === 'r' ? '#8A2418' : '#141210';
    if (b.poly(g, ring(0.02))) { g.fillStyle = side; g.fill(); }
    for (let k = 1; k <= 3; k++) if (b.poly(g, ring(0.06 * k))) { g.fillStyle = side; g.fill(); }
    if (b.poly(g, ring(0.2))) { g.fillStyle = top; g.fill(); }
    if (b.poly(g, ring(0.2).map(([x, y, z]) => [q.x + (x - q.x) * 0.6, 0.21, q.z + (z - q.z) * 0.6]))) { g.strokeStyle = rgba('#FFFFFF', 0.18); g.lineWidth = 2; g.stroke(); }
  }
}
const CHECKERS = [];
for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) if ((f + r) % 2 === 0 && (r < 3 || r > 4)) CHECKERS.push({ x: f + 0.5, z: r + 0.5, c: r < 3 ? 'r' : 'b' });

// an engine as a monitor with a pixel face
const faceCache = new Map();
function engineFace(kind, blink) {
  const key = kind + blink; if (faceCache.has(key)) return faceCache.get(key);
  const c = makeCanvas(480, 360), g = c.getContext('2d');
  g.fillStyle = '#0E1620'; g.fillRect(0, 0, 480, 360);
  g.fillStyle = kind === 'a' ? '#7AA6D6' : '#A8C66C';
  for (const sx of [-1, 1]) { if (blink) g.fillRect(240 + sx * 90 - 40, 150, 80, 14); else g.fillRect(240 + sx * 90 - 30, 110, 60, 80); }
  g.fillRect(170, 250, 140, 16);
  faceCache.set(key, c); return c;
}

function stars(g, t, { n = 260, seed = 7, a = 1 } = {}) {
  const r = rng(seed); g.save(); g.globalAlpha *= a;
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, s = r() * 2.6 + 0.4, tw = 0.6 + 0.4 * Math.sin(t * (1 + r() * 3) + i);
    g.fillStyle = rgba(r() > 0.85 ? '#FFD9A0' : '#DDE8FF', tw); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.restore();
}
function galaxy(g, x, y, t, s = 1, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(t * 0.05); g.scale(s, s * 0.55);
  const r = rng(3);
  for (let i = 0; i < 900; i++) { const arm = i % 2, d = Math.pow(r(), 0.6) * 420, ang = d * 0.012 + arm * Math.PI + (r() - 0.5) * 0.6;
    g.fillStyle = rgba(d < 80 ? '#FFE6B0' : '#9FC0FF', 0.5 * (1 - d / 460)); g.fillRect(Math.cos(ang) * d, Math.sin(ang) * d, 3, 3); }
  const cg = g.createRadialGradient(0, 0, 0, 0, 0, 120); cg.addColorStop(0, 'rgba(255,240,200,0.9)'); cg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill();
  g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const lin = x => x;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const at = (x, y, z) => B.project(x, y, z);
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const bg = (g, top, bot) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const title = (g, a = 1, y = 250) => {  // the question, readable from frame 0
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round';
    g.font = sans(104, 900); g.lineWidth = 16; g.strokeStyle = C.ink; g.strokeText('CAN CHESS', W / 2, y); g.fillStyle = C.cream; g.fillText('CAN CHESS', W / 2, y);
    g.font = sans(120, 900); g.strokeText('BE SOLVED?', W / 2, y + 125); g.fillStyle = C.gold; g.fillText('BE SOLVED?', W / 2, y + 125);
    g.restore();
  };
  // Shannon's lab: the 1950s computer on the left, a desk with a board
  const lab = (g, lt, t, keys, { e = 'focus', busy = 1, pieces = START, ez = lin } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    const E = room(g, B, LAB, { t, blur: 3 });
    oldComputer(g, B, -7.5, 10.5, t, { busy });
    const hw = seated(g, B, 'shannon', e, t, { z: 9.4 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.1 }); hw();
  };

  // ======================= HOOK =======================
  const shanT = w('hook1', 'Shannon') - 0.35, compT = w('hook1', 'computer'), firstT = w('hook1', 'first');
  shot(0, (g, lt, t, sh) => {
    lab(g, lt, t, [[0, { yaw: 0.35, pitch: 0.28, dist: 15, cy: H * 0.56, target: [2, 2.6, 9] }], [len(sh), { yaw: 0.25, pitch: 0.24, dist: 12.5 }]], { e: { ...EXPR.focus, look: [-0.6, 0.2] } });
    title(g);
    placeStamp(g, lt, 'Bell Labs', '1950', { y: 560, t0: 0.15 });
  }, { grade: 'warm', noJump: true });
  cue(0.05, 'boom', 0.6); cue(0.05, 'whirr', 0.5);
  shot(shanT, (g, lt, t, sh) => {
    if (PH.shannon) photo3d(g, PH.shannon, lt, { from: { x: 0.5, y: 0.36, zoom: 1.0, focus: 0.55 }, to: { x: 0.5, y: 0.33, zoom: 1.14, dolly: 0.12, sx: 0.02 }, dur: len(sh), e: lin });
    else { bg(g, '#2A2018', '#0A0806'); drawChar(g, 'shannon', { x: W / 2, y: H * 0.45, s: 2, e: EXPR.smug, t }); }
    title(g, 1, 230);
    g.save(); const nb = g.createLinearGradient(0, 1330, 0, 1640); nb.addColorStop(0, 'rgba(8,6,4,0)'); nb.addColorStop(0.35, 'rgba(8,6,4,0.75)'); nb.addColorStop(1, 'rgba(8,6,4,0.75)'); g.fillStyle = nb; g.fillRect(0, 1330, W, 310); g.restore();
    nameTitle(g, lt, 'Claude Shannon', 'THE FATHER OF INFORMATION THEORY', { y: 1480, t0: 0.1, subColor: C.gold, size: 70 });
    if (PH.shannon) credit(g, CREDIT, seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'bw', noJump: true });
  cue(shanT + 0.1, 'shimmer', 0.6);
  shot(compT - 0.1, (g, lt, t, sh) => {
    lab(g, lt, t, [[0, { yaw: 0.55, pitch: 0.16, dist: 11, cy: H * 0.5, target: [-4.5, 2.6, 10.4] }], [len(sh), { yaw: 0.45, pitch: 0.14, dist: 8.5 }]], { e: { ...EXPR.worried, look: [-1, 0] }, busy: 1.5 });
    // progress panel
    const u = seg(t, firstT, firstT + 0.4, ease.out);
    g.save(); g.globalAlpha = seg(lt, 0, 0.2); g.fillStyle = 'rgba(14,12,10,0.88)'; g.fillRect(90, 250, W - 180, 230);
    g.textAlign = 'left'; g.font = mono(34, 800); g.fillStyle = C.cream; g.fillText('CALCULATING MOVE 1 ...', 130, 320);
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(130, 360, W - 260, 50); g.fillStyle = C.lime; g.fillRect(130, 360, 4 + 2 * u, 50);
    g.font = mono(30, 800); g.fillStyle = C.gold; g.textAlign = 'right'; g.fillText('0.000000000001 %', W - 130, 455); g.restore();
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(compT, 'whirr', 0.7); cue(firstT, 'beep', 0.6);

  // a 1 with 90 zeros. In years.
  const zT = w('hook2', '90'), yT = w('hook2', 'years');
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    bg(g, '#1A1410', '#060504');
    const n = Math.round(lerp(0, 90, seg(t, s('hook2'), zT + 0.5, ease.inOut))), per = 15, cw = 56, x0 = W / 2 - per * cw / 2 + cw / 2;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = sans(140, 900); g.fillStyle = C.gold; g.fillText('1', W / 2, 400);
    g.font = mono(64, 800);
    for (let i = 0; i < n; i++) { const x = x0 + (i % per) * cw, y = 560 + Math.floor(i / per) * 80; g.fillStyle = i === n - 1 ? C.cream : rgba(C.cream, 0.82); g.fillText('0', x, y); }
    g.restore();
    stamp(g, 'YEARS', W / 2, 1150, t, yT, { color: C.red, size: 130, rot: -0.08 });
    credit(g, 'C. SHANNON, “PROGRAMMING A COMPUTER FOR PLAYING CHESS”, 1950', seg(lt, 0.3, 0.5));
  }, { trans: 'zoom', grade: 'neutral', info: true });
  for (let i = 0; i < 10; i++) cue(s('hook2') + 0.1 + i * 0.12, 'tick', 0.35);
  cue(yT, 'stamp', 1); cue(yT, 'boom', 0.7);

  // ======================= THE SIZE OF CHESS =======================
  const gamesT = w('why', 'games'), atomsT = w('why', 'atoms'), wayT = w('why', 'Way');
  shot(s('why') - 0.05, (g, lt, t, sh) => {
    bg(g, '#0A0E1A', '#020306'); stars(g, t);
    const shrink = seg(t, wayT, wayT + 0.5, ease.inOut);
    galaxy(g, W / 2, H * 0.62, t, lerp(1.1, 0.35, shrink), 0.9);
    pow10(g, W / 2, 480, 120, lerp(150, 210, shrink), C.gold, { a: seg(t, gamesT - 0.1, gamesT), label: 'POSSIBLE CHESS GAMES' });
    pow10(g, W / 2, lerp(820, 1500, shrink), 80, lerp(120, 70, shrink), '#9FC0FF', { a: seg(t, atomsT - 0.1, atomsT), label: 'ATOMS IN THE UNIVERSE', labelColor: '#9FC0FF' });
    if (t >= wayT) { g.save(); const k = pop(t, wayT); g.translate(W / 2, 860); g.scale(k, k); g.textAlign = 'center'; g.font = sans(90, 900); g.lineWidth = 12; g.lineJoin = 'round'; g.strokeStyle = C.ink; g.strokeText('×', -150, 0); g.fillStyle = C.red; g.fillText('×', -150, 0); g.restore();
      pow10(g, W / 2 + 40, 860, 40, 120 * pop(t, wayT), C.red, { label: 'TIMES MORE', labelColor: C.red }); }
  }, { trans: 'whip', grade: 'night', info: true });
  cue(gamesT, 'hit', 0.7); cue(atomsT, 'pluck', 0.6); cue(wayT, 'boom', 0.8);

  // what "solved" means
  const solT = w('solved', 'Solving'), perfT = w('solved', 'perfect');
  shot(s('solved') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 0.95, dist: 12, cy: H * 0.6, target: [4, 0, 4] }], [len(sh), { yaw: 0.08, pitch: 1.0, dist: 11 }]], { t, e: lin });
    const E = room(g, B, LAB, { t, blur: 4 }); table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, START, { focus: B.dist, dof: 0.8 });
    const cards = [['WHITE WINS', C.cream], ['DRAW', C.gold], ['BLACK WINS', '#3A3F48']];
    cards.forEach(([txt, col], i) => {
      const t0 = perfT + i * 0.15, k = seg(t, t0, t0 + 0.25, ease.back), x = W / 2 + (i - 1) * 330;
      if (k <= 0) return;
      g.save(); g.translate(x, 330); g.scale(k, k); g.fillStyle = col; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-150, -110, 300, 220); g.shadowColor = 'transparent';
      g.fillStyle = col === '#3A3F48' ? C.cream : C.ink; g.textAlign = 'center'; g.font = sans(110, 900); g.fillText('?', 0, 30); g.font = sans(30, 900); g.letterSpacing = '2px'; g.fillText(txt, 0, 90); g.restore();
    });
    badge(g, 'PERFECT PLAY · FROM MOVE 1', W / 2, 540, { color: C.lime, size: 36, a: seg(t, solT, solT + 0.1), scale: pop(t, solT) });
  }, { trans: 'zoom', grade: 'warm', info: true });
  for (let i = 0; i < 3; i++) cue(perfT + i * 0.15, 'pluck', 0.5);

  // checkers: solved in 2007, dozens of computers, 18 years, a draw
  const ckT = w('checkers', 'Checkers'), y07 = w('checkers', '2007'), dozT = w('checkers', 'Dozens'), e18 = w('checkers', 'eighteen'), drawT = T.w('checkers', -1).s;
  shot(s('checkers') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.4, pitch: 0.5, dist: 14, cy: H * 0.55, target: [4, 1.5, 6] }], [len(sh), { yaw: -0.2, pitch: 0.45, dist: 11.5 }]], { t, e: lin });
    const E = room(g, B, SERVER, { t, blur: 2 });
    racks(g, B, [-7, -4.5, -2, 10, 12.5, 15], 11, t);
    table(g, B, E); B.drawSlab(g, CHK); checkers(g, B, CHECKERS);
    const yr = Math.round(lerp(1989, 2007, seg(t, dozT, e18 + 0.6, ease.inOut)));
    counter(g, String(t < dozT ? 2007 : yr), 'CHECKERS · SOLVED', { y: 330, size: 150, a: seg(t, ckT, ckT + 0.1) });
    stamp(g, 'DRAW', W / 2, 1480, t, drawT, { color: C.blue, size: 140, rot: -0.1 });
    credit(g, 'J. SCHAEFFER ET AL., “CHECKERS IS SOLVED”, SCIENCE, 2007', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'cold', info: true });
  cue(ckT, 'hit', 0.6); for (let i = 0; i < 8; i++) cue(dozT + i * 0.18, 'tick', 0.35); cue(drawT, 'stamp', 0.9);

  // 45 digits of legal positions
  const bigT = w('positions', 'bigger'), legT = w('positions', 'legal'), d45 = w('positions', '45');
  const DIG = '482000000000000000000000000000000000000000000';
  shot(s('positions') - 0.05, (g, lt, t, sh) => {
    bg(g, '#18202A', '#06080B');
    const n = Math.round(lerp(0, 45, seg(t, legT, d45 + 0.3, ease.inOut)));
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = mono(62, 800);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 15), col = i % 15, x = W / 2 - 448 + col * 56 + Math.floor(col / 3) * 14 + 28, y = 520 + row * 120;
      const settle = seg(t, legT + i * 0.03, legT + i * 0.03 + 0.2), ch = settle < 1 ? String(Math.floor((t * 40 + i * 7) % 10)) : DIG[i];
      g.fillStyle = i < 3 ? C.gold : C.cream; g.fillText(ch, x, y);
    }
    g.restore();
    counter(g, '45 DIGITS', 'LEGAL CHESS POSITIONS ≈ 4.8 × 10⁴⁴', { y: 1080, size: 110, a: seg(t, d45, d45 + 0.1), labelColor: C.gold });
    badge(g, 'WAY BIGGER', W / 2, 300, { color: C.red, size: 48, a: seg(t, bigT, bigT + 0.1), scale: pop(t, bigT) });
    credit(g, 'ESTIMATE: J. TROMP & P. ÖSTERLUND, 2022', seg(lt, 0.3, 0.5));
  }, { trans: 'zoom', grade: 'neutral', info: true });
  for (let i = 0; i < 8; i++) cue(legT + i * 0.15, 'tick', 0.3); cue(d45, 'hit', 0.7);

  // ======================= WHAT WE HAVE SOLVED =======================
  const sevT = w('seven', 'seven'), supT = w('seven', 'supercomputer'), tbT = w('seven', '140');
  shot(s('seven') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.5, pitch: 0.42, dist: 15, cy: H * 0.55, target: [4, 2, 6] }], [len(sh), { yaw: 0.25, pitch: 0.4, dist: 11 }]], { t, e: lin });
    const E = room(g, B, SERVER, { t, blur: 2 });
    racks(g, B, [-8, -5.5, -3, -0.5, 8.5, 11, 13.5, 16], 11.5, t, { h: 11 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, SEVEN, { focus: B.dist, dof: 1 });
    if (t > sevT) for (const p of SEVEN) B.highlight(g, String.fromCharCode(97 + Math.floor(p.x)) + (Math.floor(p.z) + 1), C.lime, 0.25);
    badge(g, '7 PIECES · EVERY POSITION SOLVED', W / 2, 300, { color: C.lime, size: 36, a: seg(t, sevT, sevT + 0.1), scale: pop(t, sevT) });
    counter(g, '140 TB', 'LOMONOSOV SUPERCOMPUTER · MOSCOW · 2012', { y: 520, size: 140, a: seg(t, tbT - 0.1, tbT), labelColor: '#7AA6D6' });
  }, { trans: 'whip', grade: 'cold', info: true });
  cue(sevT, 'hit', 0.6); cue(supT, 'whirr', 0.7); cue(tbT, 'boom', 0.7);

  // a checkmate 549 moves long: the score sheet unrolls
  const cmT = w('mate', 'checkmate'), n549 = w('mate', '549'), m549 = T.w('mate', '549').e;
  shot(s('mate') - 0.05, (g, lt, t, sh) => {
    bg(g, '#2A2016', '#0A0806');
    const u = seg(t, s('mate'), m549, ease.in), mv = Math.max(1, Math.round(549 * u)), lh = 70;
    g.save(); g.fillStyle = '#F2E8D6'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.fillRect(W / 2 - 260, 0, 520, H); g.restore();
    g.save(); g.beginPath(); g.rect(W / 2 - 260, 0, 520, H); g.clip(); g.font = mono(40, 800); g.textBaseline = 'middle';
    for (let k = -2; k < H / lh + 2; k++) {
      const m = mv - k + Math.floor(H / lh / 2); if (m < 1 || m > 549) continue;
      const y = k * lh + ((549 * u) % 1) * lh;
      g.fillStyle = m === 549 ? C.red : '#3A2E22'; g.textAlign = 'left'; g.fillText(`${m}.`, W / 2 - 220, y);
      g.fillStyle = 'rgba(58,46,34,0.35)'; g.fillRect(W / 2 - 90, y - 3, 140, 6); g.fillRect(W / 2 + 80, y - 3, 140, 6);
    }
    g.restore();
    if (t > cmT - 0.1) { g.save(); g.globalAlpha = seg(t, cmT - 0.1, cmT); g.fillStyle = 'rgba(14,10,6,0.9)'; g.fillRect(W / 2 - 330, 220, 660, 150); g.restore(); }
    counter(g, `MOVE ${mv}`, null, { y: 340, size: 120, a: seg(t, cmT - 0.1, cmT), color: mv >= 549 ? C.red : C.cream });
    if (t > m549 + 0.05) stamp(g, 'CHECKMATE', W / 2, 1450, t, m549 + 0.05, { color: C.red, size: 110 });
  }, { trans: 'zoom', grade: 'warm', info: true });
  cue(cmT, 'riser', 0.6); for (let i = 0; i < 12; i++) cue(cmT + 0.2 + i * 0.12, 'tick', 0.3); cue(m549 + 0.05, 'stamp', 1);

  // eight pieces: still running
  const eT = w('eight', 'Eight'), notT = w('eight', 'not');
  shot(s('eight') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.3, pitch: 0.7, dist: 11, cy: H * 0.56, target: [4, 0.5, 4] }], [len(sh), { yaw: -0.2, pitch: 0.75, dist: 10 }]], { t, e: lin });
    const E = room(g, B, SERVER, { t, blur: 3 }); table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, EIGHT, { focus: B.dist, dof: 1 });
    g.save(); g.fillStyle = 'rgba(10,12,16,0.88)'; g.fillRect(110, 250, W - 220, 200);
    g.textAlign = 'left'; g.font = sans(40, 900); g.fillStyle = C.cream; g.fillText('8 PIECES', 150, 315);
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(150, 345, W - 300, 44); g.fillStyle = C.gold; g.fillRect(150, 345, (W - 300) * (0.55 + 0.02 * Math.sin(t)), 44);
    const sp = t * 6; g.strokeStyle = C.cream; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(W - 160, 305, 18, sp, sp + 4.4); g.stroke();
    g.font = sans(22, 800); g.letterSpacing = '3px'; g.fillStyle = rgba(C.cream, 0.75); g.fillText('LONGEST WIN FOUND SO FAR: 584 MOVES', 150, 425); g.restore();
    badge(g, 'STILL NOT FINISHED', W / 2, 560, { color: C.red, size: 44, a: seg(t, notT, notT + 0.1), scale: pop(t, notT) });
  }, { trans: 'whip', grade: 'cold', info: true });
  cue(eT, 'hit', 0.5); cue(notT, 'buzz', 0.6);

  // all 32: the drives pile up to the ceiling; impossible
  const allT = w('all', '32'), impT = w('all', 'impossible');
  shot(s('all') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.2, pitch: 0.5, dist: 15, cy: H * 0.6, target: [4, 2, 5] }], [len(sh), { yaw: 0.1, pitch: 0.15, dist: 17, target: [4, 6, 6] }]], { t, e: ease.inOut });
    const E = room(g, B, 'dark', { t, blur: 2 }); table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, START, { focus: B.dist, dof: 1 });
    const n = Math.floor(seg(t, allT, impT, ease.in) * 60);
    for (let i = 0; i < n; i++) { const col = i % 6, lvl = Math.floor(i / 6), x = col < 3 ? -6 + col * 1.4 : 11 + (col - 3) * 1.4;
      box(g, B, [x, FLOOR_Y + lvl * 1.6, 9], [x + 1.2, FLOOR_Y + lvl * 1.6 + 1.5, 10.4], { top: '#AAB4C4', side: '#5E6878', front: '#7E8898' });
      const led = B.project(x + 0.3, FLOOR_Y + lvl * 1.6 + 0.4, 8.98); if (B.toCam(x, 0, 9)[2] > 1) { g.fillStyle = (i + Math.floor(t * 5)) % 3 ? '#4FD18A' : '#FFB060'; g.beginPath(); g.arc(led.x, led.y, Math.max(2, led.s * 0.08), 0, 7); g.fill(); } }
    counter(g, '32 PIECES', null, { y: 330, size: 120, a: seg(t, allT, allT + 0.1) });
    stamp(g, 'IMPOSSIBLE', W / 2, 560, t, impT, { color: C.red, size: 110 });
  }, { trans: 'zoom', grade: 'night', info: true });
  for (let i = 0; i < 10; i++) cue(allT + 0.2 + i * 0.13, 'thud', 0.3); cue(impT, 'stamp', 1); cue(impT, 'boom', 0.7);

  // engines draw each other: probably a draw, nobody can prove it
  const engT = w('draw', 'engines'), probT = w('draw', 'probably'), nobT = w('draw', 'nobody');
  shot(s('draw') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 0.42, dist: 13, cy: H * 0.56, target: [4, 1.5, 5] }], [len(sh), { yaw: 0.06, pitch: 0.4, dist: 11.5 }]], { t, e: lin });
    const E = room(g, B, SERVER, { t, blur: 2 }); table(g, B, E);
    const blink = Math.floor(t * 1.3) % 4 === 0;
    picture(g, B, engineFace('a', blink), [-0.2, 6.2, 10], [3.6, 6.2, 10], [-0.2, 3.3, 10], { tone: 'color', border: '#2A3038', pad: 0.15 });
    picture(g, B, engineFace('b', !blink), [4.4, 6.2, 10], [8.2, 6.2, 10], [4.4, 3.3, 10], { tone: 'color', border: '#2A3038', pad: 0.15 });
    B.drawSlab(g, COM); B.drawPieces(g, START, { focus: B.dist, dof: 1 });
    const n = Math.min(12, Math.floor(Math.max(0, t - engT) * 6));
    for (let i = 0; i < n; i++) { const x = 140 + (i % 4) * 266, y = 260 + Math.floor(i / 4) * 92; g.save(); g.fillStyle = C.blue; g.fillRect(x - 110, y - 36, 220, 72); g.fillStyle = C.ink; g.font = sans(40, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('½ – ½', x, y + 2); g.restore(); }
    badge(g, 'PROBABLY A DRAW', W / 2, 610, { color: C.gold, size: 50, a: seg(t, probT, probT + 0.1) * (1 - seg(t, nobT - 0.1, nobT)), scale: pop(t, probT) });
    stamp(g, 'UNPROVEN', W / 2, 620, t, nobT, { color: C.red, size: 104, sub: 'NOBODY CAN PROVE IT' });
  }, { trans: 'whip', grade: 'cold', info: true });
  for (let i = 0; i < 6; i++) cue(engT + 0.1 + i * 0.17, 'pluck', 0.35); cue(probT, 'hit', 0.6); cue(nobT, 'stamp', 0.9);

  // follow
  const folT = w('cta', 'Follow');
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    lab(g, lt, t, [[0, { yaw: -0.2, pitch: 0.16, dist: 9, cy: H * 0.5, target: [4, 3.1, 9.4] }], [len(sh), { yaw: -0.1, pitch: 0.14, dist: 7.6 }]], { e: { ...EXPR.happy, nod: 0.5 }, busy: 0.6 });
    badge(g, 'FOLLOW FOR MORE', W / 2, 330, { color: C.gold, size: 54, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
  }, { trans: 'whip', grade: 'warm' });
  cue(folT, 'pluck', 0.8); cue(folT, 'sparkle', 0.6);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'intrigue' }, { t: s('hook2') - 0.05, m: 'hit' }, { t: s('why') - 0.05, m: 'void' }, { t: s('solved') - 0.05, m: 'build' },
    { t: s('checkers') - 0.05, m: 'digital' }, { t: s('seven') - 0.05, m: 'clockwork' }, { t: s('mate') - 0.05, m: 'tension' },
    { t: s('all') - 0.05, m: 'drop' }, { t: s('draw') - 0.05, m: 'void' }, { t: s('cta') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
