// Chess records that sound fake: #5 Nikolić–Arsović, Belgrade 1989, 269 moves over 20 hours, a draw; #4 Carlsen's 125 classical
// games unbeaten (Jul 2018 – Oct 2020); #3 Fischer's 20 straight wins (1970–71) with the 6–0 sweeps of Taimanov and Larsen;
// #2 Onakoya & Martinez, 64 hours in Times Square (2025); #1 Gareyev, 48 blindfold games on an exercise bike (2016).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng } from '../../engine/js/core.js';
import { confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar, hand } from '../../engine/js/characters.js';
import { counter, badge, stamp, placeStamp, sans, mono } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { room, table, ENV } from '../../engine/js/env.js';
import { drawPiece } from '../../engine/js/pieces.js';
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

// a long endgame shuffling about: each piece wanders inside its own zone, one piece moves per ply
const EG = [['wk', 'k', 'w', 0, 0, 4, 3], ['wr', 'r', 'w', 4, 0, 4, 3], ['wb', 'b', 'w', 0, 3, 8, 2], ['bk', 'k', 'b', 4, 5, 4, 3], ['br', 'r', 'b', 0, 5, 4, 3]];
function endgameAt(ply) {
  const p = Math.floor(ply), u = ease.inOut(ply - p);
  return EG.map(([id, t, c, x0, z0, w, h], i) => {
    const mover = k => (k % 2 === 0 ? [0, 1, 2][Math.floor(rng(k * 7 + 1)() * 3)] : [3, 4][Math.floor(rng(k * 7 + 2)() * 2)]);
    let n = 0; for (let k = 0; k < p; k++) if (mover(k) === i) n++;  // how many times this piece has moved
    const at = m => { const r = rng(i * 977 + m * 13 + 5); return [x0 + Math.floor(r() * w) + 0.5, z0 + Math.floor(r() * h) + 0.5]; };
    const [xa, za] = at(n), moving = mover(p) === i, [xb, zb] = moving ? at(n + 1) : [xa, za];
    return { id, t, c, x: lerp(xa, xb, u), z: lerp(za, zb, u), y: moving ? Math.sin(Math.PI * u) * 0.5 : 0 };
  });
}

// the clock box at the top of the frame (hh:mm:ss)
function timer(g, secs, { y = 120, color = '#FF6B4F' } = {}) {
  const hh = Math.floor(secs / 3600), mm = Math.floor(secs / 60) % 60, ss = Math.floor(secs) % 60, txt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  g.save(); g.fillStyle = '#05070A'; g.fillRect(250, y, 580, 170); g.strokeStyle = '#3A3F48'; g.lineWidth = 6; g.strokeRect(250, y, 580, 170);
  g.font = mono(118, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(txt, W / 2, y + 88); g.restore();
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
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const rank = (g, n, t, t0) => {  // the countdown number, slammed in at the start of each record
    const a = seg(t, t0, t0 + 0.08); if (a <= 0) return;
    const k = lerp(1.8, 1, seg(t, t0, t0 + 0.22, ease.back));
    g.save(); g.globalAlpha = a; g.translate(130, 170); g.scale(k, k); g.rotate(-0.05);
    g.fillStyle = C.gold; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-90, -78, 180, 156); g.shadowColor = 'transparent';
    g.fillStyle = C.ink; g.font = sans(120, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + n, 0, 6); g.restore();
  };
  const dark = (g, top = '#22262E', bot = '#0A0C10') => { const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bot); g.fillStyle = bg; g.fillRect(0, 0, W, H); };
  // Belgrade 1989: both players from the side in a wood-panelled hall
  const duo = (g, lt, t, keys, { e1 = 'focus', e2 = 'focus', pieces }) => {
    rig(B, lt, keys, { t, e: lin });
    room(g, B, 'wood', { t, blur: 2.5 });
    const h1 = seated(g, B, 'goran', e1, t, { z: 8.9 }), h2 = seated(g, B, 'ivan', e2, t, { z: -0.9, face: 1 });
    table(g, B, ENV.wood); B.drawSlab(g, WOOD); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.1 }); h1(); h2();
  };
  const SIDE = { yaw: 1.5, pitch: 0.28, dist: 12, fov: 860, cy: H * 0.6, target: [4, 2.2, 4] };
  // the Times Square board, both players from the side
  const marathon = (g, lt, t, keys, { e = 'focus', e2 = 'focus', clock = null } = {}) => {
    rig(B, lt, keys, { t, e: lin });
    timesSquare(g, t, { clock, pan: -B.yaw * 120 });
    const hw = seated(g, B, 'tunde', e, t, { z: 8.9 }), hr = seated(g, B, 'rival', e2, t, { z: -0.9, face: 1 });
    table(g, B, TBL); B.drawSlab(g, COM); B.drawPieces(g, MID, { focus: B.dist, dof: 1.1 }); hw(); hr();
  };
  const L = look => ({ ...EXPR.tired, look }), plies = 538;

  // ======================= HOOK: 20 HOURS, ONLY #5 =======================
  const h20 = w('hook1', '20'), fiveT = w('hook2', 'five');
  shot(0, (g, lt, t, sh) => {
    duo(g, lt, t, [[0, { ...SIDE, dist: 11.5 }], [len(sh), { ...SIDE, yaw: 1.42, dist: 10.5 }]], { e1: L([-0.6, 0.5]), e2: L([0.6, 0.5]), pieces: endgameAt(lerp(300, 330, lt / 5)) });
    timer(g, lerp(0, 20 * 3600 + 15 * 60, seg(t, 0, h20 + 0.6, ease.out)));
    counter(g, '20 HOURS', 'ONE GAME OF CHESS', { y: 470, size: 150, color: C.cream, labelColor: C.red });
    stamp(g, 'ONLY #5', W / 2, 790, t, fiveT, { color: C.gold, size: 120, rot: -0.1 });
  }, { grade: 'warm', noJump: true });
  cue(0.05, 'boom', 0.6); cue(0.05, 'clock', 0.5); cue(fiveT, 'stamp', 1);

  // ======================= #5: 269 MOVES =======================
  const n5 = s('n5'), bgT = w('n5', 'Belgrade'), m269 = w('n5', '269'), endT = w('n5', 'ended'), drawT = w('n5', 'draw');
  shot(n5 - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 1.3, dist: 11.5, cy: H * 0.6, target: [4, 0, 4] }], [len(sh), { yaw: 0.1, pitch: 1.24, dist: 10.5 }]], { t, e: lin });
    room(g, B, 'wood', { t, blur: 3 });
    table(g, B, ENV.wood); B.drawSlab(g, WOOD);
    const u = seg(t, n5 + 0.2, m269 + 0.5), ply = plies * Math.pow(u, 2.2);
    B.drawPieces(g, endgameAt(ply), { focus: B.dist, dof: 0.6 });
    rank(g, 5, t, n5);
    counter(g, String(Math.ceil(ply / 2)), 'MOVES', { y: 360, size: 170, color: u >= 1 ? C.lime : C.cream });
    badge(g, '20 H 15 MIN', W / 2, 570, { color: C.blue, size: 40, a: seg(t, m269 + 0.2, m269 + 0.3), scale: pop(t, m269 + 0.2) });
    placeStamp(g, lt, 'Belgrade', '1989', { y: 480, t0: bgT - (t - lt) });
    credit(g, 'IVAN NIKOLIĆ vs GORAN ARSOVIĆ · BELGRADE 1989', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(n5, 'hit', 0.8); for (let i = 0; i < 14; i++) cue(n5 + 0.3 + (m269 - n5) * Math.sqrt(i / 14), 'clack', 0.3); cue(m269, 'ting', 0.7);
  // ...and it was a draw
  shot(endT - 0.1, (g, lt, t, sh) => {
    duo(g, lt, t, [[0, { ...SIDE, dist: 10.5 }], [len(sh), { ...SIDE, yaw: 1.55, dist: 9.5 }]], { e1: exprAt([[0, L([-0.6, 0.5])], [drawT - (t - lt), { ...EXPR.sad, look: [-0.4, 0.2] }]], lt), e2: exprAt([[0, L([0.6, 0.5])], [drawT - (t - lt), { ...EXPR.sad, look: [0.4, 0.2] }]], lt), pieces: endgameAt(plies) });
    counter(g, '269 MOVES', '20 HOURS 15 MINUTES', { y: 360, size: 120, labelColor: C.blue });
    stamp(g, 'DRAW', W / 2, 760, t, drawT, { color: C.red, size: 160, rot: -0.08, sub: '½ – ½' });
    credit(g, 'IVAN NIKOLIĆ vs GORAN ARSOVIĆ · BELGRADE 1989', 1);
  }, { trans: 'cut', grade: 'warm', info: true });
  cue(drawT, 'stamp', 1); cue(drawT + 0.1, 'thud', 0.6);

  // ======================= #4: CARLSEN, 125 UNBEATEN =======================
  const n4 = s('n4'), mgT = w('n4', 'Magnus'), loseT = w('n4', 'lose'), yrsT = w('n4', 'two'), g125 = w('n4', '125');
  const rWin = rng(44), WD = Array.from({ length: 125 }, () => rWin() < 42 / 125);  // 42 wins, 83 draws (order illustrative)
  shot(n4 - 0.05, (g, lt, t, sh) => {
    dark(g, '#1E2632', '#090C12');
    const n = Math.round(lerp(0, 125, seg(t, n4 + 0.4, g125 + 0.3, ease.inOut))), cols = 13, p = 62, x0 = W / 2 - (cols - 1) * p / 2, y0 = 560;
    for (let i = 0; i < n; i++) { const x = x0 + (i % cols) * p, y = y0 + Math.floor(i / cols) * p;
      g.fillStyle = WD[i] ? C.lime : '#8A8F98'; g.beginPath(); g.roundRect(x - 26, y - 26, 52, 52, 7); g.fill(); }
    rank(g, 4, t, n4);
    counter(g, String(n), n >= 125 ? '42 WINS · 83 DRAWS · 0 LOSSES' : 'CLASSICAL GAMES · NO LOSS', { y: 330, size: 160, color: n >= 125 ? C.lime : C.cream });
    badge(g, 'JUL 2018 → OCT 2020', W / 2, 470, { color: C.blue, size: 36, a: seg(t, yrsT, yrsT + 0.1), scale: pop(t, yrsT) });
    drawChar(g, 'magnus', { x: W / 2, y: 1600, s: 1.0, e: exprAt([[0, 'focus'], [g125 - (t - lt), 'smug']], lt), t });
    credit(g, 'MAGNUS CARLSEN · UNBEATEN IN CLASSICAL CHESS 2018–2020', seg(lt, 0.3, 0.5));
  }, { trans: 'zoom', grade: 'cold', info: true });
  cue(n4, 'hit', 0.8); cue(loseT, 'glass', 0.4); cue(yrsT, 'pluck', 0.6); for (let i = 0; i < 10; i++) cue(n4 + 0.4 + i * (g125 - n4) / 10, 'tick', 0.25); cue(g125, 'boom', 0.7);

  // ======================= #3: FISCHER, 20 IN A ROW =======================
  const n3 = s('n3'), bfT = w('n3', 'Bobby'), w20 = w('n3', '20'), titT = w('n3', 'title');
  shot(n3 - 0.05, (g, lt, t, sh) => {
    dark(g, '#2A2018', '#0C0906');
    spotlight(g, W / 2, 760, 560, '#FFF1D6', 0.12);
    const k = lerp(0, 20, seg(t, n3 + 0.4, w20 + 0.5));
    for (let i = 0; i < 20; i++) {  // twenty kings, toppled one by one
      const x = 150 + (i % 5) * 185, y = 640 + Math.floor(i / 5) * 165, fall = ease.out(clamp(k - i));
      g.save(); g.translate(x, y); g.rotate(fall * 1.5); drawPiece(g, 'k', 'b', 0, 0, 140, { alpha: 1 - fall * 0.35 }); g.restore();
    }
    rank(g, 3, t, n3);
    counter(g, String(Math.floor(k)), 'WINS IN A ROW', { y: 330, size: 170, a: seg(t, n3 + 0.3, n3 + 0.4), color: k >= 20 ? C.lime : C.cream });
    drawChar(g, 'bobby72', { x: W / 2, y: 1600, s: 1.0, e: exprAt([[0, 'focus'], [w20 - (t - lt), 'smug']], lt), t });
    badge(g, 'ROAD TO THE WORLD TITLE', W / 2, 1180, { color: C.gold, size: 34, a: seg(t, titT - 0.2, titT - 0.1), scale: pop(t, titT - 0.2) });
    credit(g, 'BOBBY FISCHER · 1970–71', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(n3, 'hit', 0.8); for (let i = 0; i < 20; i++) cue(n3 + 0.4 + i * (w20 + 0.5 - n3 - 0.4) / 20, 'clack', 0.3); cue(w20, 'riser', 0.4);
  // two of his matches ended 6-0
  const sixT = w('n3b', 'six'), zeroT = w('n3b', 'zero');
  shot(s('n3b') - 0.05, (g, lt, t, sh) => {
    dark(g, '#2A2018', '#0C0906');
    [['TAIMANOV', 'QUARTERFINAL'], ['LARSEN', 'SEMIFINAL']].forEach(([opp, round], i) => {
      const y = 470 + i * 300, a = seg(t, s('n3b') + i * 0.3, s('n3b') + i * 0.3 + 0.15); if (a <= 0) return;
      g.save(); g.globalAlpha = a; g.translate((1 - ease.out(a)) * (i ? 140 : -140), 0);
      g.fillStyle = 'rgba(10,8,6,0.88)'; g.beginPath(); g.roundRect(110, y - 110, W - 220, 220, 14); g.fill();
      g.font = sans(28, 800); g.letterSpacing = '4px'; g.textAlign = 'center'; g.fillStyle = C.gold; g.fillText(`1971 CANDIDATES · ${round}`, W / 2, y - 62); g.letterSpacing = '0px';
      g.font = sans(40, 900); g.fillStyle = C.cream; g.fillText('FISCHER', 235, y + 38); g.fillText(opp, W - 235, y + 38);
      const sc = t >= zeroT ? '6 – 0' : t >= sixT ? '6 – ?' : '? – ?';
      g.font = mono(90, 800); g.fillStyle = t >= zeroT ? C.lime : C.cream; g.fillText(sc, W / 2, y + 52); g.restore();
    });
    drawChar(g, 'bobby72', { x: W / 2, y: 1600, s: 1.0, e: { ...EXPR.smug, curve: 0.8 }, t });
    credit(g, 'BOBBY FISCHER · CANDIDATES MATCHES 1971', 1);
  }, { trans: 'zoom', grade: 'warm', info: true });
  cue(sixT, 'pluck', 0.6); cue(zeroT, 'stamp', 1);

  // ======================= #2: 64 HOURS IN TIMES SQUARE =======================
  const n2 = s('n2'), tsT = w('n2', 'Times'), h64 = w('n2', '64'), g473 = w('n2', '473');
  shot(n2 - 0.05, (g, lt, t, sh) => {
    const tired = { ...EXPR.tired, sweat: 1, look: [0, 0.6] };
    marathon(g, lt, t, [[0, { yaw: 1.5, pitch: 0.3, dist: 23, cy: H * 0.6, target: [4, 2.2, 4] }], [len(sh), { yaw: 1.44, pitch: 0.28, dist: 21 }]], {
      e: exprAt([[0, { ...EXPR.focus, look: [-0.7, 0.5] }], [h64 - (t - lt), tired]], lt), e2: exprAt([[0, { ...EXPR.focus, look: [0.7, 0.5] }], [h64 - (t - lt), tired]], lt),
      clock: lerp(0, 64 * 3600, seg(t, h64 - 0.8, h64 + 0.4, ease.out)) });
    rank(g, 2, t, n2);
    counter(g, String(Math.round(lerp(0, 473, seg(t, g473 - 0.3, g473 + 0.8, ease.out)))), 'GAMES', { y: 470, size: 150, a: seg(t, g473 - 0.4, g473 - 0.3), labelColor: C.lime });
    placeStamp(g, lt, 'Times Square', 'April 2025', { y: 1560, t0: tsT - (t - lt) });
    credit(g, 'TUNDE ONAKOYA & SHAWN MARTINEZ · NEW YORK · 2025', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'night', info: true });
  cue(n2, 'hit', 0.8); cue(h64, 'clock', 0.7); cue(g473, 'boom', 0.6);

  // ======================= #1: 48 BLINDFOLD GAMES ON A BIKE =======================
  const n1 = s('n1'), tmT = w('n1', 'Timur'), g48 = w('n1', '48'), bldT = w('n1', 'Blindfolded'), bkT = w('n1', 'bike');
  if (PH.timur) shot(n1 - 0.05, (g, lt, t, sh) => {  // the real man first (2009 photo), then the record
    photo3d(g, PH.timur, lt, { from: { x: 0.42, y: 0.4, zoom: 1.0, focus: 0.5 }, to: { x: 0.42, y: 0.38, zoom: 1.1, dolly: 0.1 }, dur: len(sh), e: lin });
    rank(g, 1, t, n1);
    badge(g, 'TIMUR GAREYEV', W / 2, 1480, { color: C.gold, size: 52, sub: 'GRANDMASTER', a: seg(t, tmT - 0.1, tmT), scale: pop(t, tmT) });
    credit(g, 'PHOTO: LUCIANA MORALES · CC BY 2.0 · 2009', seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true, kb: 0 });
  shot(PH.timur ? g48 - 0.45 : n1 - 0.05, (g, lt, t, sh) => {
    const bgc = g.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, H * 0.8); bgc.addColorStop(0, '#2A2436'); bgc.addColorStop(1, '#07060A'); g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    const nB = Math.round(lerp(0, 48, seg(t, g48 - 0.4, g48 + 0.6))), cell = 118, x0 = W / 2 - cell * 4, y0 = 470;
    for (let i = 0; i < nB; i++) {  // 48 boards on a wall behind him, one per game
      const x = x0 + (i % 8) * cell + 7, y = y0 + Math.floor(i / 8) * cell + 7, sz = cell - 14, q = sz / 8, rr = rng(i + 7);
      g.save(); g.globalAlpha = 0.55 * seg(t, g48 - 0.4 + i * 0.021, g48 - 0.3 + i * 0.021);
      for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) { g.fillStyle = (u + v) % 2 ? '#EEEED2' : '#769656'; g.fillRect(x + u * q, y + v * q, q, q); }
      for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#F7F3EA' : '#1A1A1A'; g.beginPath(); g.arc(x + (Math.floor(rr() * 8) + 0.5) * q, y + (Math.floor(rr() * 8) + 0.5) * q, q * 0.34, 0, 7); g.fill(); }
      g.restore();
    }
    spotlight(g, W / 2, 900, 480, '#FFF1D6', 0.22);
    const bob = Math.sin(t * 9) * 8;
    drawChar(g, 'timur', { x: W / 2, y: 840 + bob, s: 1.0, e: { ...EXPR.smug, curve: 0.8 }, t, tilt: Math.sin(t * 9) * 0.03 });
    bike(g, W / 2 - 66, 1290, 1.1, t);
    for (const gx of [-30, 150]) hand(g, W / 2 - 66 + gx * 1.1, 1290 - 150 * 1.1 + bob * 0.3, 34);
    rank(g, 1, t, n1);
    counter(g, nB ? String(nB) : '', nB ? 'GAMES AT ONCE' : null, { y: 330, size: 150, a: seg(t, g48 - 0.4, g48 - 0.3) });
    badge(g, 'BLINDFOLDED', W / 2 - 250, 640, { color: C.red, size: 40, a: seg(t, bldT, bldT + 0.1), scale: pop(t, bldT) });
    badge(g, 'ON A BIKE', W / 2 + 270, 1150, { color: C.blue, size: 40, a: seg(t, bkT, bkT + 0.1), scale: pop(t, bkT) });
    credit(g, 'GM TIMUR GAREYEV · LAS VEGAS · 2016', seg(lt, 0.3, 0.5));
  }, { trans: PH.timur ? 'whip' : 'flash', grade: 'night', info: true });
  cue(n1, 'boom', 0.9); cue(n1, 'hit', 0.8); cue(g48, 'riser', 0.4); cue(bldT, 'stamp', 0.6); cue(bkT, 'pluck', 0.7);
  // he won 35: wins / draws / losses
  const wonT = w('n1b', 'won'), t35 = w('n1b', '35');
  shot(s('n1b') - 0.05, (g, lt, t, sh) => {
    dark(g, '#1E2A22', '#070A08');
    const n = Math.round(lerp(0, 48, seg(t, wonT - 0.2, t35 + 0.4)));
    for (let i = 0; i < n; i++) { const col = i < 35 ? C.lime : i < 42 ? '#8A8F98' : C.red, x = W / 2 - 3.5 * 106 + (i % 8) * 106, y = 600 + Math.floor(i / 8) * 106;
      g.fillStyle = col; g.beginPath(); g.roundRect(x - 44, y - 44, 88, 88, 10); g.fill(); }
    counter(g, '35 WINS', '7 DRAWS · 6 LOSSES', { y: 420, size: 140, color: C.lime, a: seg(t, t35 - 0.1, t35), labelColor: '#8A8F98' });
  }, { trans: 'zoom', grade: 'neutral', info: true });
  for (let i = 0; i < 8; i++) cue(wonT + i * 0.12, 'tick', 0.3); cue(t35, 'hit', 0.8);

  // which one sounds the most fake? follow
  const fakeT = w('cta', 'fake'), folT = w('cta', 'Follow');
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    timesSquare(g, t);
    g.fillStyle = 'rgba(6,6,12,0.5)'; g.fillRect(0, 0, W, H);
    const items = [['269 MOVES', 'AND A DRAW', C.blue], ['125 GAMES', 'UNBEATEN', C.gold], ['20 WINS', 'IN A ROW', C.lime], ['64 HOURS', 'NONSTOP', C.red], ['48 BLIND', 'ON A BIKE', '#B48CFF']];
    items.forEach(([big, small, col], i) => {
      const t0 = s('cta') + i * 0.12, u = seg(t, t0, t0 + 0.25, ease.out); if (u <= 0) return;
      const y = 560 + i * 128; g.save(); g.globalAlpha = u; g.translate((1 - u) * -120, 0);
      g.fillStyle = 'rgba(10,8,14,0.82)'; g.beginPath(); g.roundRect(110, y - 52, W - 220, 104, 10); g.fill();
      g.fillStyle = col; g.fillRect(110, y - 52, 120, 104); g.fillStyle = C.ink; g.font = sans(54, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + (5 - i), 170, y + 3);
      g.textAlign = 'left'; g.fillStyle = C.cream; g.font = sans(50, 900); g.fillText(big, 262, y + 3); const bw = g.measureText(big).width;
      g.fillStyle = col; g.font = sans(30, 800); g.letterSpacing = '2px'; g.fillText(small, 262 + bw + 24, y + 5); g.restore();
    });
    counter(g, 'WHICH ONE?', 'SOUNDS THE MOST FAKE', { y: 380, size: 130, a: seg(t, s('cta'), s('cta') + 0.1) });
    badge(g, 'FOLLOW FOR MORE', W / 2, 1500, { color: C.gold, size: 48, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
    if (t > folT) confetti(g, t, folT, { n: 50 });
  }, { trans: 'whip', grade: 'night' });
  for (let i = 0; i < 5; i++) cue(s('cta') + i * 0.12, 'pluck', 0.4); cue(folT, 'sparkle', 0.7);

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
