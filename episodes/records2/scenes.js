// Chess records that sound fake. Hook: a man plays dozens of games at once, blindfolded — how many? (answer at #1).
// #5 Nikolić–Arsović, Belgrade 1989, 269 moves over 20 hours, a draw; #4 Carlsen's 125 classical games unbeaten (2018–2020);
// #3 Fischer's 20 straight wins (1970–71) and the 6–0 sweeps of Taimanov and Larsen; #2 Onakoya & Martinez, 64 hours in
// Times Square (2025); #1 Gareyev, 48 blindfold games on an exercise bike (2016).
// Every record lives in a 3D set: a blindfold arena with a double ring of 48 tables, a wood-panelled 1989 hall, a long
// corridor with a row of 125 boards, a stage with 20 kings falling like dominoes, Times Square with a crowd.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas } from '../../engine/js/core.js';
import { confetti } from '../../engine/js/draw.js';
import { Board, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar, hand } from '../../engine/js/characters.js';
import { counter, badge, stamp, placeStamp, sans, mono } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { room, table, box, pool, placeAt, ENV, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { timesSquare, bike } from '../records/scenes.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const MID = piecesAt(G, 20);
const photo = async k => { try { return await loadPhoto3d(`../episodes/records/photos/${k}`); } catch { return null; } };
const PH = { timur: await photo('gareyev2009') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const WOOD = { light: '#E8D3A8', dark: '#9A6B3E', frame: '#3A2412', side: '#24160A' };
const TBL = { table: ['#3A3A44', '#22222A', '#18181E'] };
const lin = x => x;
const fogTo = (col, d, base, near = 10, far = 70, max = 0.92) => mix(col, base, clamp((d - near) / (far - near)) * max);
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };

// ---------- cached character sprites (front, or a dark back view) drawn as world billboards ----------
const SPR = new Map();
function sprite(who, e = 'focus', dark = false) {  // dark: true = back-view silhouette, or a CSS filter string (dimmed crowd)
  const key = `${who}|${typeof e === 'string' ? e : JSON.stringify(e)}|${dark}`;
  if (!SPR.has(key)) {
    const c = makeCanvas(520, 720), g = c.getContext('2d');
    drawChar(g, who, { x: 260, y: 260, s: 1, e: typeof e === 'string' ? EXPR[e] : e, t: 0, silhouette: !!dark, shade: typeof dark === 'string' ? dark : 'brightness(0.16) saturate(0.4)' });
    SPR.set(key, c);
  }
  return SPR.get(key);
}
function billboard(g, spr, x, y, z, k = 1, { alpha = 1, blur = 0 } = {}) {
  if (B.toCam(x, y, z)[2] < 0.8) return;
  const p = B.project(x, y, z), s = p.s * k / 100 * 1.05;
  g.save(); g.globalAlpha *= alpha; if (blur > 0.6) g.filter = `blur(${blur.toFixed(1)}px)`;
  g.drawImage(spr, p.x - 260 * s, p.y - 260 * s, 520 * s, 720 * s); g.restore();
}
const CROWD = ['rival', 'ivan', 'goran', 'ehsan', 'susan', 'sofia', 'brother', 'dealer', 'daughter', 'operator', 'witty', 'shannon'];

// ---------- a small table with a board and a position on it, at (x, z), top at y = h ----------
function miniBoard(g, x, z, { s = 2.0, h = 1.0, base = '#0A0B10', d = 0, pos = null, mark = null, markA = 0, a = 1 } = {}) {
  if (a <= 0) return;
  const top = '#4A3A2C', side = '#2A2018';
  g.save(); g.globalAlpha *= a;
  box(g, B, [x - s / 2, 0, z - s / 2], [x + s / 2, h, z + s / 2], { top: fogTo(top, d, base), side: fogTo(side, d, base), front: fogTo('#33271C', d, base) });
  const bs = s * 0.74, x0 = x - bs / 2, z0 = z - bs / 2, q = bs / 8, y = h + 0.01;
  if (mark && markA > 0) { g.save(); g.globalAlpha *= markA; quad(g, [[x - s * 0.5, y, z - s * 0.5], [x + s * 0.5, y, z - s * 0.5], [x + s * 0.5, y, z + s * 0.5], [x - s * 0.5, y, z + s * 0.5]], mark); g.restore(); pool(g, B, x, y, z, s * 1.2, mark, 0.35 * markA); }
  quad(g, [[x0, y, z0], [x0 + bs, y, z0], [x0 + bs, y, z0 + bs], [x0, y, z0 + bs]], fogTo('#EEEED2', d, base));
  if (d < 45) { const dk = fogTo('#769656', d, base); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) quad(g, [[x0 + i * q, y, z0 + j * q], [x0 + (i + 1) * q, y, z0 + j * q], [x0 + (i + 1) * q, y, z0 + (j + 1) * q], [x0 + i * q, y, z0 + (j + 1) * q]], dk); }
  if (pos && d < 30) B.drawPieces(g, pos.map(p => ({ ...p, x: x0 + p.x * q, z: z0 + p.z * q, y: y, scale: q })), { dof: 0 });
  g.restore();
}

// ---------- SET: the blindfold arena — Gareyev on a bike in the middle of a double ring of 48 tables ----------
const RING = [];
{ const r = rng(48);
  for (let i = 0; i < 48; i++) {
    const inner = i < 20, n = inner ? 20 : 28, k = inner ? i : i - 20, R = inner ? 9 : 13.5, a = (k + (inner ? 0 : 0.5)) / n * Math.PI * 2;
    RING.push({ x: Math.sin(a) * R, z: Math.cos(a) * R, ang: a, R, who: CROWD[Math.floor(r() * CROWD.length)], pos: piecesAt(G, 30 + Math.floor(r() * 50)), res: 0 });
  }
  const order = RING.map((_, i) => i).sort(() => r() - 0.5);  // 35 wins, 7 draws, 6 losses spread around the ring
  order.forEach((i, k) => { RING[i].res = k < 35 ? 1 : k < 42 ? 0.5 : 0; });
}
const ARENA = '#07070C';
function arena(g, lt, t, keys, { shown = 48, marks = 0, e = { ...EXPR.smug, curve: 0.8 }, bob = 1 } = {}) {
  rig(B, lt, keys, { t, e: lin });
  g.fillStyle = ARENA; g.fillRect(0, 0, W, H);
  // floor with a light pool in the middle, the outer wall with warm light slits
  quad(g, [[-60, 0, -60], [60, 0, -60], [60, 0, 60], [-60, 0, 60]], '#15151E');
  pool(g, B, 0, 0, 0, 14, '#FFD9A0', 0.24);
  for (let i = 0; i < 36; i++) {
    const a0 = i / 36 * Math.PI * 2, a1 = (i + 1) / 36 * Math.PI * 2, R = 28;
    const pts = [[Math.sin(a0) * R, 0, Math.cos(a0) * R], [Math.sin(a1) * R, 0, Math.cos(a1) * R], [Math.sin(a1) * R, 16, Math.cos(a1) * R], [Math.sin(a0) * R, 16, Math.cos(a0) * R]];
    quad(g, pts, i % 2 ? '#14141C' : '#111118');
  }
  for (let i = 0; i < 18; i++) { const a = (i + 0.5) / 18 * Math.PI * 2; pool(g, B, Math.sin(a) * 27.8, 7, Math.cos(a) * 27.8, 3.2, '#FFC98A', 0.35, true); }
  RING.forEach((T, i) => { if (i < shown) pool(g, B, T.x, 0, T.z, 2.6, '#FFD9A0', 0.16); });
  // everything on the floor, far to near: tables (with their boards), opponents, the man on the bike
  const items = [];
  RING.forEach((T, i) => {
    if (i >= shown) return;
    const ox = T.x * (T.R + 1.7) / T.R, oz = T.z * (T.R + 1.7) / T.R, d = B.toCam(T.x, 1, T.z)[2];
    const vx = B.E[0] - ox, vz = B.E[2] - oz, front = vx * -T.x + vz * -T.z < 0;  // camera on the far side of the table from him → we see his face
    items.push({ d, f: () => miniBoard(g, T.x, T.z, { d, base: ARENA, pos: T.pos, mark: T.res === 1 ? C.lime : T.res === 0.5 ? '#9AA0AA' : C.red, markA: marks }) });
    items.push({ d: B.toCam(ox, 2.3, oz)[2], f: () => billboard(g, sprite(T.who, 'focus', !front), ox, 2.25, oz, 0.42, { alpha: front ? 1 : 0.9 }) });
  });
  items.push({ d: B.toCam(0, 2, 0)[2], f: () => {
    const b = Math.sin(t * 9) * 0.06 * bob;
    actor(g, B, 'timur', { x: 0, y: 3.0 + b, z: 0, k: 0.62, e, t, face: -1, follow: 0.2 });
    placeAt(B, 0, 0.95, 0, (px, py, sc) => { const k = sc * 0.55; bike(g, px - 66 * k, py, k, t); for (const gx of [-30, 150]) hand(g, px - 66 * k + gx * k, py - 150 * k, 34 * k); });
  } });
  items.sort((a, b) => b.d - a.d).forEach(it => it.f());
  // a hard top light on him
  const top = B.project(0, 14, 0), bot = B.project(0, 0, 0);
  const gr = g.createLinearGradient(0, top.y, 0, bot.y); gr.addColorStop(0, rgba('#FFF1D6', 0.18)); gr.addColorStop(1, rgba('#FFF1D6', 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.moveTo(top.x - top.s * 0.6, top.y); g.lineTo(top.x + top.s * 0.6, top.y); g.lineTo(bot.x + bot.s * 3.4, bot.y); g.lineTo(bot.x - bot.s * 3.4, bot.y); g.fill(); g.restore();
}

// ---------- SET: Belgrade 1989 — wood hall, both players, a growing pile of scoresheets, wall clock, windows day/night ----------
const EG = [['wk', 'k', 'w', 0, 0, 4, 3], ['wr', 'r', 'w', 4, 0, 4, 3], ['wb', 'b', 'w', 0, 3, 8, 2], ['bk', 'k', 'b', 4, 5, 4, 3], ['br', 'r', 'b', 0, 5, 4, 3]];
function endgameAt(ply) {  // a long endgame shuffling about: each piece wanders in its own zone, one piece per ply
  const p = Math.floor(ply), u = ease.inOut(ply - p);
  const mover = k => (k % 2 === 0 ? Math.floor(rng(k * 7 + 1)() * 3) : 3 + Math.floor(rng(k * 7 + 2)() * 2));
  return EG.map(([id, t, c, x0, z0, w, h], i) => {
    let n = 0; for (let k = 0; k < p; k++) if (mover(k) === i) n++;
    const at = m => { const r = rng(i * 977 + m * 13 + 5); return [x0 + Math.floor(r() * w) + 0.5, z0 + Math.floor(r() * h) + 0.5]; };
    const [xa, za] = at(n), moving = mover(p) === i, [xb, zb] = moving ? at(n + 1) : [xa, za];
    return { id, t, c, x: lerp(xa, xb, u), z: lerp(za, zb, u), y: moving ? Math.sin(Math.PI * u) * 0.5 : 0 };
  });
}
function belgrade(g, lt, t, keys, { ply = 0, hours = 0, e1 = 'focus', e2 = 'focus', blur = 2.5, ez = lin, near = true, pile = true } = {}) {
  rig(B, lt, keys, { t, e: ez });
  room(g, B, 'wood', { t, blur });
  // two tall windows on the back wall: the sky runs through day and night as the hours pass
  const sky = mix('#9CC3E6', '#0B1426', 0.5 + 0.5 * Math.cos(hours / 24 * Math.PI * 2 * 1.0 + 0.6));
  for (const x of [-6.5, 12.5]) { quad(g, [[x - 1.6, 2, BACK_Z - 0.08], [x + 1.6, 2, BACK_Z - 0.08], [x + 1.6, 9, BACK_Z - 0.08], [x - 1.6, 9, BACK_Z - 0.08]], '#2A1C12');
    quad(g, [[x - 1.35, 2.25, BACK_Z - 0.1], [x + 1.35, 2.25, BACK_Z - 0.1], [x + 1.35, 8.75, BACK_Z - 0.1], [x - 1.35, 8.75, BACK_Z - 0.1]], sky);
    quad(g, [[x - 0.06, 2.25, BACK_Z - 0.12], [x + 0.06, 2.25, BACK_Z - 0.12], [x + 0.06, 8.75, BACK_Z - 0.12], [x - 0.06, 8.75, BACK_Z - 0.12]], '#2A1C12'); }
  // the wall clock above the players: hands spin with the hours
  placeAt(B, 4, 9.2, BACK_Z - 0.1, (px, py, sc) => {
    const r = 90 * sc; g.save(); g.fillStyle = '#F2E8D4'; g.strokeStyle = '#3A2412'; g.lineWidth = 10 * sc; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = '#2A1C12'; g.lineCap = 'round';
    for (const [len, w, ang] of [[0.5, 9, hours / 12 * Math.PI * 2], [0.78, 5, hours * Math.PI * 2]]) { g.lineWidth = w * sc; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(ang) * r * len, py - Math.cos(ang) * r * len); g.stroke(); }
    g.restore();
  });
  const h1 = seated(g, B, 'goran', e1, t, { z: 8.9 }), h2 = near ? seated(g, B, 'ivan', e2, t, { z: -0.9, face: 1 }) : () => {};
  table(g, B, ENV.wood, { x1: 11.2 });
  // the pile of scoresheets grows with the moves
  const ph = 0.1 + 1.6 * clamp(ply / 538);
  if (pile) box(g, B, [9.0, -0.35, 2.2], [10.8, -0.35 + ph, 4.4], { top: '#F4EFE2', side: '#D9D2C2', front: '#E6DFCF' });
  if (pile) for (let k = 1; k < 8; k++) { const y = -0.35 + ph * k / 8; quad(g, [[9.0, y, 2.19], [10.8, y, 2.19], [10.8, y + 0.02, 2.19], [9.0, y + 0.02, 2.19]], '#BDB5A4'); }
  B.drawSlab(g, WOOD); B.drawPieces(g, endgameAt(ply), { focus: B.dist, dof: 1.0 }); h1(); h2();
}

// ---------- SET: a long hall with one table running into the distance: 125 boards, one per game of the streak ----------
const ROW = Array.from({ length: 125 }, (_, i) => ({ z: 11 + i * 2.6, win: rng(400 + i)() < 42 / 125, pos: piecesAt(G, 20 + (i * 7) % 60) }));
const HALL_BASE = '#05080E';
function corridor(g, lt, t, keys, { n = 125, e = 'focus' } = {}) {
  rig(B, lt, keys, { t, e: lin });
  g.fillStyle = HALL_BASE; g.fillRect(0, 0, W, H);
  quad(g, [[-8, 0, -10], [16, 0, -10], [16, 0, 360], [-8, 0, 360]], '#0E141C');
  quad(g, [[-8, 11, -10], [16, 11, -10], [16, 11, 360], [-8, 11, 360]], '#070A10');
  for (const x of [-8, 16]) quad(g, [[x, 0, -10], [x, 0, 360], [x, 11, 360], [x, 11, -10]], '#111A26');
  for (let z = 0; z < 360; z += 9) for (const x of [-7.95, 15.95]) {  // blue light columns on both walls
    const d = B.toCam(x, 5, z)[2]; if (d < 1) continue;
    quad(g, [[x, 0.5, z], [x, 0.5, z + 0.6], [x, 10, z + 0.6], [x, 10, z]], rgba('#4FA8FF', 0.55 * (1 - clamp((d - 10) / 120))));
  }
  box(g, B, [2.6, 0, 9], [5.4, 0.98, 340], { top: '#2A2E36', side: '#14171C', front: '#1C2026' });
  for (let i = ROW.length - 1; i >= 0; i--) {
    const R = ROW[i], d = B.toCam(4, 1, R.z)[2]; if (d < 1 || d > 260) continue;
    const on = clamp(n - i);
    miniBoard(g, 4, R.z, { s: 2.2, h: 1.0, d, base: HALL_BASE, pos: R.pos, mark: R.win ? C.lime : '#9AA0AA', markA: on, a: 0.35 + 0.65 * on });
    if (on > 0 && d < 120) pool(g, B, 4, 1.05, R.z, 1.6, R.win ? C.lime : '#C9D0DA', 0.28 * on);
  }
  actor(g, B, 'magnus', { x: 6.7, y: 3.1, z: 23, k: 0.95, e, t, face: -1, follow: 0.3 });
}

// ---------- SET: the 1971 stage — a long table of 20 kings that fall like dominoes ----------
function stage71(g, lt, t, keys, { fallen = 0, e = 'focus', blur = 2, bobby = true } = {}) {
  rig(B, lt, keys, { t, e: lin });
  room(g, B, 'curtain', { t, blur });
  if (bobby) actor(g, B, 'bobby72', { x: 4, y: 3.9, z: 11, k: 0.95, e, t, face: -1, follow: 0.6 });
  box(g, B, [-8.2, FLOOR_Y, 2.6], [16.2, -0.1, 5.4], { top: '#2F5A3E', side: '#1A3424', front: '#22442E' });
  pool(g, B, 4, -0.1, 4, 12, '#FFE6B8', 0.18);
  const kings = Array.from({ length: 20 }, (_, i) => { const f = ease.in(clamp(fallen - i)); return { t: 'k', c: 'w', x: -6.6 + i * 1.12, z: 4, y: -0.1, rot: f * 1.42, scale: 1.3 }; });
  B.drawPieces(g, kings, { focus: B.dist, dof: 0 });
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const rank = (g, n, t, t0) => {  // the countdown number, slammed in at the start of each record
    const a = seg(t, t0, t0 + 0.08); if (a <= 0) return;
    const k = lerp(1.8, 1, seg(t, t0, t0 + 0.22, ease.back));
    g.save(); g.globalAlpha = a; g.translate(130, 170); g.scale(k, k); g.rotate(-0.05);
    g.fillStyle = C.gold; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-90, -78, 180, 156); g.shadowColor = 'transparent';
    g.fillStyle = C.ink; g.font = sans(120, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + n, 0, 6); g.restore();
  };
  const scrim = (g, a = 0.4, h = 620) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(4,4,8,${a})`); gr.addColorStop(1, 'rgba(4,4,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, h); };
  const T0 = 0.0;

  // ======================= HOOK: dozens of games at once, blindfolded — how many? =======================
  const dozT = w('hook1', 'dozens'), bfT = w('hook1', 'Blindfolded'), howT = w('hook2', 'How'), stayT = w('hook2', 'Stay');
  shot(T0, (g, lt, t, sh) => {  // low orbit around him, boards and opponents all around
    arena(g, lt, t, [[0, { yaw: 0.55, pitch: 0.28, dist: 10.5, fov: 1500, cy: H * 0.5, target: [0, 2.5, 0] }], [len(sh), { yaw: -0.1, pitch: 0.24, dist: 9 }]]);
    scrim(g, 0.55);
    counter(g, '??', 'CHESS GAMES AT ONCE', { y: 400, size: 190, color: C.cream, labelColor: C.gold });
    badge(g, 'BLINDFOLDED', W / 2, 560, { color: C.red, size: 46, a: seg(t, bfT, bfT + 0.1), scale: pop(t, bfT) });
  }, { grade: 'night', noJump: true, info: true });
  shot(howT - 0.1, (g, lt, t, sh) => {  // crane up: the double ring of tables appears
    arena(g, lt, t, [[0, { yaw: -0.15, pitch: 0.3, dist: 12, fov: 1500, cy: H * 0.52, target: [0, 2.2, 0] }], [len(sh), { yaw: -0.6, pitch: 0.7, dist: 24, target: [0, 1.2, 0] }]]);
    scrim(g, 0.55);
    counter(g, 'HOW MANY?', null, { y: 400, size: 130, color: C.cream });
    badge(g, 'ANSWER AT #1', W / 2, 540, { color: C.gold, size: 46, a: seg(t, stayT, stayT + 0.1), scale: pop(t, stayT) });
  }, { trans: 'whip', grade: 'night', info: true });
  cue(0.05, 'boom', 0.7); cue(dozT, 'riser', 0.4); cue(bfT, 'stamp', 0.9); cue(howT, 'hit', 0.7); cue(stayT, 'pluck', 0.6);

  // ======================= #5: BELGRADE 1989, 269 MOVES, 20 HOURS, A DRAW =======================
  const n5 = s('n5'), bgT = w('n5', 'Belgrade'), twoP = w('n5', 'Two'), m269 = w('n5', '269'), h20 = w('n5', '20'), endT = w('n5', 'ended'), drawT = w('n5', 'draw');
  const plyAt = t => 538 * Math.pow(seg(t, twoP, m269 + 1.0), 2.0), hrsAt = t => 20.25 * seg(t, twoP, h20 + 0.5, ease.inOut);
  shot(n5 - 0.05, (g, lt, t, sh) => {  // establishing: crane down into the hall
    belgrade(g, lt, t, [[0, { yaw: 0.75, pitch: 0.55, dist: 15.5, fov: 1200, cy: H * 0.58, target: [4, 1.5, 5] }], [len(sh), { yaw: 0.55, pitch: 0.34, dist: 12.5, target: [4, 1.8, 5] }]], { ply: 300, hours: 0, e1: { ...EXPR.focus, look: [0, 0.6] } });
    rank(g, 5, t, n5);
    placeStamp(g, lt, 'Belgrade', '1989', { y: 330, t0: bgT - (t - lt) });
  }, { trans: 'whip', grade: 'warm' });
  shot(twoP - 0.1, (g, lt, t, sh) => {  // over the board: the moves fly, the pile grows, the clock spins, day and night pass
    belgrade(g, lt, t, [[0, { yaw: -0.25, pitch: 0.62, dist: 11.5, fov: 1350, cy: H * 0.6, target: [5, 0.5, 4] }], [len(sh), { yaw: 0.25, pitch: 0.5, dist: 10.5 }]],
      { ply: plyAt(t), hours: hrsAt(t), e1: { ...EXPR.tired, look: [0, 0.6] }, blur: 1.5, near: false });
    scrim(g, 0.5);
    rank(g, 5, t, n5);
    counter(g, String(Math.ceil(plyAt(t) / 2)), 'MOVES', { y: 340, size: 170, color: plyAt(t) >= 538 ? C.lime : C.cream });
    const hr = hrsAt(t); badge(g, `${String(Math.floor(hr)).padStart(2, '0')} H ${String(Math.floor(hr * 60) % 60).padStart(2, '0')} MIN`, W / 2, 490, { color: C.blue, size: 42, a: seg(t, twoP, twoP + 0.1) });
    credit(g, 'IVAN NIKOLIĆ vs GORAN ARSOVIĆ · BELGRADE 1989', seg(lt, 0.3, 0.5));
  }, { trans: 'cut', grade: 'warm', info: true });
  shot(endT - 0.15, (g, lt, t, sh) => {  // side two-shot: exhausted, then the draw
    const sad = l => exprAt([[0, { ...EXPR.tired, look: l }], [drawT - (t - lt), { ...EXPR.sad, look: [l[0] * 0.6, 0.2] }]], lt);
    belgrade(g, lt, t, [[0, { yaw: 1.5, pitch: 0.28, dist: 11, fov: 860, cy: H * 0.6, target: [4, 2.2, 4] }], [len(sh), { yaw: 1.56, pitch: 0.26, dist: 9.8 }]], { ply: 538, hours: 20.25, e1: sad([-0.6, 0.5]), e2: sad([0.6, 0.5]), pile: false });
    scrim(g, 0.45);
    counter(g, '269 MOVES', '20 HOURS 15 MINUTES', { y: 340, size: 120, labelColor: C.blue });
    stamp(g, 'DRAW', W / 2, 720, t, drawT, { color: C.red, size: 160, rot: -0.08, sub: '½ – ½' });
    credit(g, 'IVAN NIKOLIĆ vs GORAN ARSOVIĆ · BELGRADE 1989', 1);
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(n5, 'hit', 0.8); for (let i = 0; i < 16; i++) cue(twoP + (m269 + 1 - twoP) * Math.sqrt(i / 16), 'clack', 0.3); cue(m269, 'ting', 0.6); cue(h20, 'clock', 0.6); cue(drawT, 'stamp', 1); cue(drawT + 0.1, 'thud', 0.6);

  // ======================= #4: CARLSEN, 125 CLASSICAL GAMES UNBEATEN =======================
  const n4 = s('n4'), mgT = w('n4', 'Magnus'), forT = w('n4', 'for'), yrsT = w('n4', 'two'), g125 = w('n4', '125');
  shot(n4 - 0.05, (g, lt, t, sh) => {  // Magnus at the board in a modern hall
    rig(B, lt, [[0, { yaw: -0.5, pitch: 0.2, dist: 11, cy: H * 0.6, target: [4, 2.4, 7] }], [len(sh), { yaw: -0.25, pitch: 0.18, dist: 9.5 }]], { t, e: lin });
    room(g, B, 'hall', { t, blur: 3 });
    const hw = seated(g, B, 'magnus', { ...EXPR.focus, look: [0, 0.6] }, t, { z: 9.4 });
    table(g, B, ENV.hall); B.drawSlab(g, COM); B.drawPieces(g, MID, { focus: B.dist, dof: 1.1 }); hw();
    rank(g, 4, t, n4);
    badge(g, 'MAGNUS CARLSEN', W / 2, 1500, { color: C.gold, size: 48, sub: 'CLASSICAL CHESS', a: seg(t, mgT, mgT + 0.1), scale: pop(t, mgT) });
  }, { trans: 'whip', grade: 'cold' });
  shot(forT - 0.1, (g, lt, t, sh) => {  // the row of 125 boards lights up into the distance
    const n = lerp(0, 125, seg(t, forT, g125 + 0.4, ease.inOut));
    corridor(g, lt, t, [[0, { yaw: 0.1, pitch: 0.16, dist: 9, fov: 1400, cy: H * 0.56, target: [4.6, 1.8, 17] }], [len(sh), { yaw: -0.02, pitch: 0.12, dist: 7.5, target: [4.6, 1.8, 21] }]], { n, e: exprAt([[0, { ...EXPR.focus, look: [-0.5, 0.3] }], [g125 - (t - lt), 'smug']], lt) });
    scrim(g, 0.55);
    rank(g, 4, t, n4);
    counter(g, String(Math.round(n)), n >= 124.5 ? '42 WINS · 83 DRAWS · 0 LOSSES' : 'GAMES · NO LOSS', { y: 340, size: 170, color: n >= 124.5 ? C.lime : C.cream });
    badge(g, 'JUL 2018 → OCT 2020', W / 2, 480, { color: C.blue, size: 38, a: seg(t, yrsT, yrsT + 0.1), scale: pop(t, yrsT) });
    credit(g, 'MAGNUS CARLSEN · UNBEATEN IN CLASSICAL CHESS 2018–2020', seg(lt, 0.3, 0.5));
  }, { trans: 'cut', grade: 'cold', info: true });
  cue(n4, 'hit', 0.8); cue(yrsT, 'pluck', 0.6); for (let i = 0; i < 12; i++) cue(forT + i * (g125 + 0.4 - forT) / 12, 'tick', 0.25); cue(g125, 'boom', 0.7);

  // ======================= #3: FISCHER, 20 IN A ROW =======================
  const n3 = s('n3'), bbT = w('n3', 'Bobby'), w20 = w('n3', '20'), titT = w('n3', 'title');
  const fallAt = t => 20.6 * seg(t, n3 + 0.5, w20 + 1.0);
  shot(n3 - 0.05, (g, lt, t, sh) => {  // the camera tracks along the table as the kings go down
    const f = fallAt(t), tx = -6.6 + clamp(f, 0, 19) * 1.12;
    stage71(g, lt, t, [[0, { yaw: -0.25, pitch: 0.24, dist: 9, cy: H * 0.46, target: [-4, 0.6, 5] }], [len(sh), { yaw: 0.2, pitch: 0.22, dist: 10.5, target: [11, 0.6, 5] }]], { fallen: f, e: exprAt([[0, 'focus'], [w20 - (t - lt), 'smug']], lt) });
    scrim(g, 0.5);
    rank(g, 3, t, n3);
    counter(g, String(Math.min(20, Math.floor(f))), 'WINS IN A ROW', { y: 340, size: 170, color: f >= 20 ? C.lime : C.cream });
    badge(g, 'BOBBY FISCHER', W / 2, 1480, { color: C.gold, size: 44, a: seg(t, bbT, bbT + 0.1) * (1 - seg(t, titT - 0.35, titT - 0.25)), scale: pop(t, bbT) });
    badge(g, 'ROAD TO THE WORLD TITLE', W / 2, 1480, { color: C.gold, size: 36, a: seg(t, titT - 0.25, titT - 0.15), scale: pop(t, titT - 0.25) });
    credit(g, 'BOBBY FISCHER · 1970–71', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(n3, 'hit', 0.8); for (let i = 0; i < 20; i++) cue(n3 + 0.5 + (i + 1) / 20.6 * (w20 + 1.0 - n3 - 0.5), 'clack', 0.35); cue(w20, 'riser', 0.4);
  // two of his matches ended 6-0: score cards over the stage, Fischer seated behind the fallen kings
  const sixT = w('n3b', 'six'), zeroT = w('n3b', 'zero');
  shot(s('n3b') - 0.05, (g, lt, t, sh) => {
    stage71(g, lt, t, [[0, { yaw: 0.1, pitch: 0.3, dist: 13, cy: H * 0.66, target: [4, 1.6, 5] }], [len(sh), { yaw: -0.08, pitch: 0.26, dist: 11.5 }]], { fallen: 20, e: { ...EXPR.smug, curve: 0.8 }, blur: 3 });
    g.fillStyle = 'rgba(6,4,4,0.35)'; g.fillRect(0, 0, W, H);
    [['TAIMANOV', 'QUARTERFINAL'], ['LARSEN', 'SEMIFINAL']].forEach(([opp, round], i) => {
      const y = 360 + i * 270, a = seg(t, s('n3b') + i * 0.3, s('n3b') + i * 0.3 + 0.15); if (a <= 0) return;
      g.save(); g.globalAlpha = a; g.translate((1 - ease.out(a)) * (i ? 140 : -140), 0);
      g.fillStyle = 'rgba(10,8,6,0.9)'; g.beginPath(); g.roundRect(110, y - 105, W - 220, 210, 14); g.fill();
      g.font = sans(28, 800); g.letterSpacing = '4px'; g.textAlign = 'center'; g.fillStyle = C.gold; g.fillText(`1971 CANDIDATES · ${round}`, W / 2, y - 58); g.letterSpacing = '0px';
      g.font = sans(40, 900); g.fillStyle = C.cream; g.fillText('FISCHER', 235, y + 38); g.fillText(opp, W - 235, y + 38);
      g.font = mono(90, 800); g.fillStyle = t >= zeroT ? C.lime : C.cream; g.fillText(t >= zeroT ? '6 – 0' : t >= sixT ? '6 – ?' : '? – ?', W / 2, y + 50); g.restore();
    });
    credit(g, 'BOBBY FISCHER · CANDIDATES MATCHES 1971', 1);
  }, { trans: 'zoom', grade: 'warm', info: true });
  cue(sixT, 'pluck', 0.6); cue(zeroT, 'stamp', 1);

  // ======================= #2: 64 HOURS IN TIMES SQUARE =======================
  const n2 = s('n2'), tsT = w('n2', 'Times'), h64 = w('n2', '64'), g473 = w('n2', '473');
  const CR = Array.from({ length: 34 }, (_, i) => { const r = rng(900 + i), a = Math.PI * (0.05 + 0.9 * r()), R = 11 + r() * 6; return { x: 4 + Math.cos(a) * R * 1.3, z: 4 + Math.sin(a) * R, who: CROWD[i % CROWD.length] }; });
  const marathon = (g, lt, t, keys, { e = 'focus', e2 = 'focus', clock = null, crowd = 1 } = {}) => {
    rig(B, lt, keys, { t, e: lin });
    timesSquare(g, t, { clock, pan: -B.yaw * 120 });
    quad(g, [[-30, FLOOR_Y, -20], [40, FLOOR_Y, -20], [40, FLOOR_Y, 40], [-30, FLOOR_Y, 40]], 'rgba(20,18,26,0.85)');
    pool(g, B, 4, FLOOR_Y, 4, 12, '#FFD9A0', 0.18);
    if (crowd) CR.map(c => ({ ...c, d: B.toCam(c.x, 1, c.z)[2] })).sort((a, b) => b.d - a.d).forEach(c => billboard(g, sprite(c.who, 'happy', 'brightness(0.5) saturate(0.6)'), c.x, 1.6, c.z, 0.85, { blur: clamp(Math.abs(c.d - B.dist) * 0.25, 0, 6) }));
    const hw = seated(g, B, 'tunde', e, t, { z: 8.9 }), hr = seated(g, B, 'rival', e2, t, { z: -0.9, face: 1 });
    table(g, B, TBL); B.drawSlab(g, COM); B.drawPieces(g, MID, { focus: B.dist, dof: 1.1 }); hw(); hr();
  };
  shot(n2 - 0.05, (g, lt, t, sh) => {  // high wide over the crowd
    marathon(g, lt, t, [[0, { yaw: 1.0, pitch: 0.6, dist: 26, cy: H * 0.6, target: [4, 0.5, 4] }], [len(sh), { yaw: 0.8, pitch: 0.48, dist: 21 }]], {});
    rank(g, 2, t, n2);
    placeStamp(g, lt, 'Times Square', 'April 2025', { y: 330, t0: tsT - (t - lt) });
  }, { trans: 'whip', grade: 'night', info: true });
  shot(h64 - 0.6, (g, lt, t, sh) => {  // the two of them from the side, the clock to 64 hours
    const tired = { ...EXPR.tired, sweat: 1, look: [0, 0.6] };
    marathon(g, lt, t, [[0, { yaw: 1.5, pitch: 0.3, dist: 23, cy: H * 0.6, target: [4, 2.2, 4] }], [len(sh), { yaw: 1.44, pitch: 0.28, dist: 21 }]], {
      e: exprAt([[0, { ...EXPR.focus, look: [-0.7, 0.5] }], [h64 - (t - lt), tired]], lt), e2: exprAt([[0, { ...EXPR.focus, look: [0.7, 0.5] }], [h64 - (t - lt), tired]], lt),
      clock: lerp(40 * 3600, 64 * 3600, seg(t, h64 - 0.5, h64 + 0.4, ease.out)), crowd: 0 });
    rank(g, 2, t, n2);
    counter(g, String(Math.round(lerp(0, 473, seg(t, g473 - 0.3, g473 + 0.8, ease.out)))), 'GAMES', { y: 470, size: 150, a: seg(t, g473 - 0.4, g473 - 0.3), labelColor: C.lime });
    credit(g, 'TUNDE ONAKOYA & SHAWN MARTINEZ · NEW YORK · 2025', seg(lt, 0.3, 0.5));
  }, { trans: 'cut', grade: 'night', info: true });
  cue(n2, 'hit', 0.8); cue(h64, 'clock', 0.7); cue(g473, 'boom', 0.6);

  // ======================= #1: THE ANSWER — 48, BLINDFOLDED, ON A BIKE =======================
  const n1 = s('n1'), tmT = w('n1', 'Timur'), g48 = w('n1', '48'), bldT = w('n1', 'Blindfolded'), bkT = w('n1', 'bike');
  if (PH.timur) shot(n1 - 0.05, (g, lt, t, sh) => {  // the real man first (2009 photo)
    photo3d(g, PH.timur, lt, { from: { x: 0.42, y: 0.4, zoom: 1.0, focus: 0.5 }, to: { x: 0.42, y: 0.38, zoom: 1.1, dolly: 0.1 }, dur: len(sh), e: lin });
    rank(g, 1, t, n1);
    badge(g, 'TIMUR GAREYEV', W / 2, 1480, { color: C.gold, size: 52, sub: 'GRANDMASTER', a: seg(t, tmT - 0.1, tmT), scale: pop(t, tmT) });
    credit(g, 'PHOTO: LUCIANA MORALES · CC BY 2.0 · 2009', seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true, kb: 0 });
  shot(PH.timur ? g48 - 0.45 : n1 - 0.05, (g, lt, t, sh) => {  // back in the arena: the boards light up one by one, crane to the top
    const nB = Math.round(lerp(0, 48, seg(t, g48 - 0.3, g48 + 0.9)));
    arena(g, lt, t, [[0, { yaw: 0.3, pitch: 0.3, dist: 12, fov: 1500, cy: H * 0.52, target: [0, 2.2, 0] }], [len(sh), { yaw: 0.9, pitch: 0.95, dist: 27, target: [0, 1, 0] }]], { shown: nB });
    scrim(g, 0.55);
    rank(g, 1, t, n1);
    counter(g, String(nB), 'GAMES AT ONCE', { y: 340, size: 170, color: nB >= 48 ? C.lime : C.cream });
    badge(g, 'BLINDFOLDED', W / 2 - 220, 490, { color: C.red, size: 40, a: seg(t, bldT, bldT + 0.1), scale: pop(t, bldT) });
    badge(g, 'ON A BIKE', W / 2 + 240, 490, { color: C.blue, size: 40, a: seg(t, bkT, bkT + 0.1), scale: pop(t, bkT) });
    credit(g, 'GM TIMUR GAREYEV · LAS VEGAS · 2016', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'night', info: true });
  cue(n1, 'boom', 0.9); cue(n1, 'hit', 0.8); for (let i = 0; i < 12; i++) cue(g48 - 0.3 + i * 0.1, 'tick', 0.25); cue(g48 + 0.9, 'riser', 0.4); cue(bldT, 'stamp', 0.6); cue(bkT, 'pluck', 0.7);
  // he won 35: every table gets its result
  const wonT = w('n1b', 'won'), t35 = w('n1b', '35');
  shot(s('n1b') - 0.05, (g, lt, t, sh) => {
    arena(g, lt, t, [[0, { yaw: 0.95, pitch: 1.05, dist: 28, fov: 1300, cy: H * 0.6, target: [0, 1, 0] }], [len(sh), { yaw: 1.15, pitch: 1.1, dist: 26 }]], { marks: seg(t, wonT - 0.2, t35 + 0.2) });
    scrim(g, 0.6);
    counter(g, '35 WINS', '7 DRAWS · 6 LOSSES', { y: 360, size: 150, color: C.lime, a: seg(t, t35 - 0.1, t35), labelColor: '#C9D0DA' });
  }, { trans: 'cut', grade: 'night', info: true });
  for (let i = 0; i < 8; i++) cue(wonT + i * 0.12, 'tick', 0.3); cue(t35, 'hit', 0.8);

  // did you guess right? follow — the whole list over the arena
  const gsT = w('cta', 'guess'), folT = w('cta', 'Follow');
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    arena(g, lt, t, [[0, { yaw: 1.3, pitch: 0.5, dist: 20, fov: 1300, cy: H * 0.62, target: [0, 1.6, 0] }], [len(sh), { yaw: 1.7, pitch: 0.45, dist: 17 }]], { marks: 1 });
    g.fillStyle = 'rgba(6,6,12,0.55)'; g.fillRect(0, 0, W, H);
    const items = [['269 MOVES', 'AND A DRAW', C.blue], ['125 GAMES', 'UNBEATEN', C.gold], ['20 WINS', 'IN A ROW', C.lime], ['64 HOURS', 'NONSTOP', C.red], ['48 BLIND', 'ON A BIKE', '#B48CFF']];
    items.forEach(([big, small, col], i) => {
      const t0 = s('cta') + i * 0.12, u = seg(t, t0, t0 + 0.25, ease.out); if (u <= 0) return;
      const y = 560 + i * 128; g.save(); g.globalAlpha = u; g.translate((1 - u) * -120, 0);
      g.fillStyle = 'rgba(10,8,14,0.85)'; g.beginPath(); g.roundRect(110, y - 52, W - 220, 104, 10); g.fill();
      g.fillStyle = col; g.fillRect(110, y - 52, 120, 104); g.fillStyle = C.ink; g.font = sans(54, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + (5 - i), 170, y + 3);
      g.textAlign = 'left'; g.fillStyle = C.cream; g.font = sans(50, 900); g.fillText(big, 262, y + 3); const bw = g.measureText(big).width;
      g.fillStyle = col; g.font = sans(30, 800); g.letterSpacing = '2px'; g.fillText(small, 262 + bw + 24, y + 5); g.restore();
    });
    counter(g, 'GUESSED 48?', null, { y: 400, size: 120, a: seg(t, gsT - 0.2, gsT - 0.1) });
    badge(g, 'FOLLOW FOR MORE', W / 2, 1500, { color: C.gold, size: 48, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
    if (t > folT) confetti(g, t, folT, { n: 50 });
  }, { trans: 'whip', grade: 'night' });
  for (let i = 0; i < 5; i++) cue(s('cta') + i * 0.12, 'pluck', 0.4); cue(gsT, 'hit', 0.5); cue(folT, 'sparkle', 0.7);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: n5 - 0.05, m: 'clockwork' }, { t: drawT, m: 'hit' }, { t: n4 - 0.05, m: 'build' }, { t: n3 - 0.05, m: 'tension' }, { t: zeroT, m: 'hit' },
    { t: n2 - 0.05, m: 'digital' }, { t: n1 - 0.05, m: 'drop' }, { t: n1 + 0.4, m: 'victory' }, { t: s('cta') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
