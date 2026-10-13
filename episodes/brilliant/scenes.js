// Who has the most brilliant (!!) moves on Chess.com: what a brilliant move is, Hikaru, Witty Alien (and 27 in one
// game, more than two engines managed), and the all-time king, Daniel Naroditsky (1995–2025). Ends as a tribute.
import { W, H, C, clamp, lerp, ease, seg, pulse, rgba, rng, mix, makeCanvas } from '../../engine/js/core.js';
import { flash, confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, sans, serif, mono } from '../../engine/js/hud.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, table, picture, box, pool, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { burst, shockwave, glint, embers } from '../../engine/js/fx.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { GAMER, ledStrip, chat, webcam } from '../../engine/js/witty.js';

const QN = await fetch('../engine/data/tal_queen.json').then(r => r.json());        // Qg8+!! Rxg8 Nf7#
const GOC = await fetch('../engine/data/game_of_century.json').then(r => r.json());
const photo = async k => { try { return await loadPhoto3d(`../episodes/brilliant/photos/${k}`); } catch { return null; } };
const PH = { naro: await photo('naroditsky2024'), memorial: await photo('memorial'), hikaru: await photo('hikaru2026') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const TEAL = '#1BADA6';
const STAGE = { base: '#05070A', wall: ['#141A22', '#11161D'], seam: '#0A0E13', floor: ['#0E1217', '#0B0F13'], light: '#BFD8FF', lightA: 0.16 };
const STUDY = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.32, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };

// the brilliant-move badge: a teal disc with "!!"
function brill(g, x, y, r, { a = 1, s = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowOffsetY = r * 0.12; g.fillStyle = TEAL; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(-r * 0.25, -r * 0.3, r * 0.55, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF';
  for (const sd of [-1, 1]) {  // two hand-drawn exclamation marks
    const x = sd * r * 0.24;
    g.beginPath(); g.moveTo(x - r * 0.11, -r * 0.56); g.lineTo(x + r * 0.11, -r * 0.56); g.lineTo(x + r * 0.07, r * 0.16); g.lineTo(x - r * 0.07, r * 0.16); g.closePath(); g.fill();
    g.beginPath(); g.arc(x, r * 0.42, r * 0.1, 0, 7); g.fill();
  }
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
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(17, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.7)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const brillAt = (g, sq, t0, t, { y = 1.9, r = 0.42 } = {}) => {  // badge popping above a square
    const [x, z] = sqXZ(sq), p = at(x, y, z), a = seg(t, t0, t0 + 0.12);
    brill(g, p.x, p.y, p.s * r, { a, s: lerp(1.6, 1, seg(t, t0, t0 + 0.25, ease.back)) });
  };

  // a study with a board, the player on the far side; pieces may be a list or a callback
  const study = (g, lt, t, keys, { env = STUDY, who = 'danya', e = 'focus', pieces = null, reach = null, blur = 4, dof = 1.4, ez = ease.inOut, bump = 0, slab = COM } = {}) => {
    rig(B, lt, keys, { t, e: ez, bump });
    const E = room(g, B, env, { t, blur });
    const hw = who ? seated(g, B, who, e, t, { z: 9.4, reach, side: -1 }) : () => {};
    table(g, B, E); B.drawSlab(g, slab);
    if (typeof pieces === 'function') pieces(); else if (pieces) B.drawPieces(g, pieces, { focus: B.dist, dof });
    hw();
    return E;
  };
  // leaderboard: three bars rising on a dark stage, the top one hidden until its moment
  const ROWS = [['HIKARU NAKAMURA', '5,000+', 'CHESS.COM · 2021', 0.25, '#7AA6D6'], ['WITTY ALIEN', '~15,000', 'MOST AMONG ACTIVE PLAYERS', 0.68, '#A8C66C'], ['DANIEL NARODITSKY', '20,000+', 'FAN COUNT · 10,000 BY 2023 (CHESS.COM)', 1.0, '#E9B654']];
  const board = (g, t, show, { reveal = 0, hi = -1 } = {}) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16202A'); bg.addColorStop(1, '#07090C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    brill(g, W / 2, 190, 60);
    g.save(); g.font = sans(44, 900); g.letterSpacing = '5px'; g.textAlign = 'center'; g.fillStyle = C.cream; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText('MOST BRILLIANT MOVES', W / 2, 320); g.restore();
    g.save(); g.fillStyle = TEAL; g.fillRect(W / 2 - 50, 348, 100, 6); g.restore();
    ROWS.forEach(([name, val, sub, frac, col], i) => {
      const u = seg(t, show[i], show[i] + 0.6, ease.out), y = 1010 - i * 245, x0 = 80, wmax = W - 160, hidden = i === 2 && reveal <= 0;
      g.save(); g.globalAlpha = seg(t, show[i] - 0.1, show[i] + 0.1) * (hi >= 0 && hi !== i ? 0.4 : 1);
      g.font = sans(40, 900); g.letterSpacing = '2px'; g.textAlign = 'left'; g.fillStyle = C.cream; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 4;
      g.fillText(`${3 - i}.  ${hidden ? '???' : name}`, x0, y - 22); g.shadowColor = 'transparent';
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x0, y, wmax, 104);
      g.fillStyle = hidden ? '#3A3F48' : col; g.fillRect(x0, y, Math.max(8, wmax * frac * u), 104);
      g.font = sans(54, 900); g.letterSpacing = '0px'; g.fillStyle = C.ink; g.textAlign = 'left'; if (wmax * frac * u > 260) g.fillText(hidden ? '?' : val, x0 + 22, y + 72);
      else { g.fillStyle = C.cream; g.fillText(hidden ? '?' : val, x0 + wmax * frac * u + 22, y + 72); }
      g.font = sans(20, 800); g.letterSpacing = '3px'; g.fillStyle = 'rgba(243,235,221,0.7)'; if (!hidden) g.fillText(sub, x0, y + 140);
      g.restore();
    });
  };

  // ======================= HOOK =======================
  const mostT = w('hook1', 'most');
  shot(0, (g, lt, t, sh) => {
    // a sacrifice lands and the badge pops
    const mv = new Moves(B, QN, [{ k: 1, t0: 0.05, color: TEAL }]);
    study(g, lt, t, [[0, { yaw: -0.4, pitch: 0.7, dist: 9.5, cy: H * 0.52, target: [5, 0, 5] }], [len(sh), { yaw: -0.2, pitch: 0.75, dist: 8 }]], { who: 'danya', e: { ...EXPR.smug, look: [0, 1] }, pieces: () => mv.draw(g, t, { labels: false, dof: 1.2 }), bump: mv.bump(t), ez: ease.out });
    brillAt(g, 'g8', 0.5, t, { r: 0.55 });
    counter(g, '#1 ?', 'MOST BRILLIANT MOVES', { y: 360, size: 140, a: seg(t, mostT, mostT + 0.1), labelColor: TEAL });
  }, { grade: 'neutral' });
  cue(0.05, 'whoosh', 0.6); cue(0.5, 'sparkle', 0.9); cue(0.5, 'hit', 0.7); cue(mostT, 'boom', 0.6);
  // it's not who you think: three silhouettes, question marks
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 0.12, dist: 15, cy: H * 0.5, target: [4, 3.2, 8] }], [len(sh), { yaw: 0.05, pitch: 0.1, dist: 13.5 }]], { t, e: lin });
    room(g, B, STAGE, { t });
    for (const [x, who] of [[0, 'hikaru'], [4, 'danya'], [8, 'witty']]) {
      const top = at(x, 12, 8), base = at(x, 0, 8); spotlight(g, top.x, base.y - 250, 360, '#DDE8FF', 0.12);
      actor(g, B, who, { x, y: 3.6, z: 8, e: 'neutral', t, silhouette: true, shade: 'brightness(0.08)' });
      const p = at(x, 6.6, 8); g.save(); g.font = sans(Math.round(p.s * 1.1), 900); g.textAlign = 'center'; g.fillStyle = TEAL; g.fillText('?', p.x, p.y); g.restore();
    }
  }, { trans: 'whip', grade: 'cold' });
  cue(w('hook2', 'not'), 'sting', 0.7);

  // ======================= WHAT IS A BRILLIANT MOVE =======================
  const sacT = w('what', 'sacrifice'), giveT = w('what', 'give'), topT = w('what', 'top');
  const demo = new Moves(B, QN, [{ k: 1, t0: giveT - 0.35, color: TEAL, label: 'Qg8+!!', labelColor: TEAL }, { k: 2, t0: giveT + 0.6, color: C.red }, { k: 3, t0: topT - 0.45, color: C.lime, label: 'MATE', labelColor: C.lime }]);
  shot(s('what') - 0.05, (g, lt, t, sh) => {
    const m = demo.current(t);
    study(g, lt, t, [[0, { yaw: 0.5, pitch: 0.62, dist: 10, cy: H * 0.5, target: [5.5, 0, 5.5] }], [len(sh), { yaw: 0.15, pitch: 0.7, dist: 8.2 }]], { e: exprAt([[0, 'focus'], [topT - (t - lt), { ...EXPR.triumph, nod: 0.5 }]], lt),
      pieces: () => demo.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: demo.bump(t), reach: m && m.k % 2 === 1 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.6 } : null, ez: lin });
    if (t > giveT - 0.35 + 0.42 && t < giveT + 0.6) brillAt(g, 'g8', giveT + 0.07, t, { r: 0.5 });
    badge(g, 'A SACRIFICE THAT WORKS', W / 2, 300, { color: TEAL, size: 40, a: seg(t, sacT, sacT + 0.1), scale: pop(t, sacT) });
  }, { trans: 'zoom', grade: 'neutral' });
  demo.cues(cue); cue(giveT + 0.07, 'sparkle', 0.8); cue(topT, 'boom', 0.9);

  // the engine gives it !! — and everybody wants one (chat spam)
  const exT = w('icon', 'exclamation'), wantT = w('icon', 'everybody');
  shot(s('icon') - 0.05, (g, lt, t, sh) => {
    const bg = g.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#163A3A'); bg.addColorStop(1, '#05090A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const r = rng(3);
    for (let i = 0; i < 22; i++) { const x = r() * W, y = ((r() * H + (t * (60 + r() * 80))) % (H + 200)) - 100; brill(g, x, H - y, 14 + r() * 26, { a: 0.25 + r() * 0.3 }); }
    brill(g, W / 2, H * 0.4, 220 + 10 * Math.sin(t * 3), { s: lerp(0.4, 1, seg(lt, 0, 0.35, ease.back)) });
    glint(g, W / 2, H * 0.4, t, exT, { r: 420, color: '#BFFFF8' });
    badge(g, 'EVERYBODY WANTS ONE', W / 2, 300, { color: C.cream, size: 40, a: seg(t, wantT, wantT + 0.1), scale: pop(t, wantT) });
  }, { trans: 'flash', grade: 'neutral', kb: 0.12 });
  cue(exT, 'shimmer', 0.9); cue(wantT, 'pluck', 0.8);
  shot(wantT + 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.2, pitch: 0.12, dist: 9, cy: H * 0.46, target: [4, 3.2, 9.4] }], [len(sh), { yaw: 0.05, pitch: 0.1, dist: 7.8 }]], { t, e: lin });
    const env = room(g, B, GAMER, { t, blur: 3 });
    ledStrip(g, B, [-8, 11.5, BACK_Z - 0.1], [16, 11.5, BACK_Z - 0.1], TEAL, t);
    const hands = seated(g, B, 'witty', { ...EXPR.shock, open: 0.6, look: [0, 0.6] }, t, { z: 9.4 });
    table(g, B, { ...env, table: ['#1E1C28', '#121018', '#0C0A12'] }); hands();
    chat(g, 560, 1220, t, wantT + 0.05, { n: 5, w: 470 });
  }, { trans: 'whip', grade: 'stream' });

  // ======================= THE COUNT =======================
  const SHOW = [w('hikaru', 'Over') - 0.1, w('witty', 'Around') - 0.1, 1e9];
  // Hikaru (2.5D photo if we have it, then the leaderboard)
  const hikT = w('hikaru', 'Hikaru');
  shot(s('hikaru') - 0.05, (g, lt, t, sh) => {
    if (PH.hikaru) photo3d(g, PH.hikaru, lt, { from: { x: 0.5, y: 0.38, zoom: 1.0, focus: 0.55 }, to: { x: 0.5, y: 0.34, zoom: 1.16, dolly: 0.12, sx: 0.02 }, dur: len(sh), e: lin });
    else study(g, lt, t, [[0, { yaw: 0.2, pitch: 0.14, dist: 8, cy: H * 0.46, target: [4, 3, 9.4] }], [len(sh), { yaw: 0.05, pitch: 0.12, dist: 7 }]], { env: GAMER, who: 'hikaru', e: 'smug' });
    nameTitle(g, lt, 'Hikaru Nakamura', 'GRANDMASTER · STREAMER', { y: 300, t0: 0.05, subColor: '#7AA6D6', size: 66 });
    if (PH.hikaru) credit(g, 'NARODITSKY MEMORIAL 2026 · PHOTO: KELLY CENTRELLI · CC BY 4.0', seg(lt, 0.2, 0.4));
  }, { trans: 'leak', grade: 'neutral', noJump: true });
  cue(hikT, 'boom', 0.6);
  shot(SHOW[0], (g, lt, t) => { board(g, t, SHOW, { hi: 0 }); }, { trans: 'zoom', grade: 'neutral', kb: 0.14 });
  cue(SHOW[0] + 0.1, 'riser', 0.4); cue(SHOW[0] + 0.6, 'hit', 0.6); cue(w('hikaru', '2021'), 'tick', 0.6);
  // Witty Alien — about 15,000
  shot(s('witty') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.3, pitch: 0.12, dist: 9.5, cy: H * 0.46, target: [4, 3.2, 9.4] }], [len(sh), { yaw: -0.1, pitch: 0.1, dist: 8 }]], { t, e: lin });
    const env = room(g, B, GAMER, { t, blur: 3 });
    ledStrip(g, B, [-8, 11.5, BACK_Z - 0.1], [16, 11.5, BACK_Z - 0.1], '#8FD16A', t);
    const hands = seated(g, B, 'witty', { ...EXPR.triumph, nod: 0.5 }, t, { z: 9.4 });
    table(g, B, { ...env, table: ['#1E1C28', '#121018', '#0C0A12'] }); hands();
    nameTitle(g, lt, 'Witty Alien', 'THE GUY WHO BEAT MAGNUS', { y: 300, t0: 0.05, subColor: '#A8C66C', size: 72 });
  }, { trans: 'whip', grade: 'stream' });
  cue(w('witty', 'Witty'), 'shimmer', 0.6);
  shot(SHOW[1], (g, lt, t) => { board(g, t, SHOW, { hi: 1 }); }, { trans: 'zoom', grade: 'neutral', kb: 0.14 });
  cue(SHOW[1] + 0.6, 'hit', 0.8); cue(w('witty', 'most'), 'boom', 0.6);
  // 27 brilliant moves in one game
  const t27 = w('witty27', 'twenty-seven'), gameT = w('witty27', 'game');
  const SQS = ['e6', 'f7', 'd5', 'g6', 'c6', 'h7', 'e5', 'b5', 'f5', 'd6', 'g5', 'c5', 'e7', 'a6', 'h6', 'f6', 'd7', 'b6', 'g7', 'c7', 'e4', 'f4', 'd4', 'h5', 'a5', 'b7', 'g4'];
  shot(s('witty27') - 0.05, (g, lt, t, sh) => {
    study(g, lt, t, [[0, { yaw: -0.5, pitch: 0.85, dist: 11.5, cy: H * 0.54, target: [4, 0, 4.5] }], [len(sh), { yaw: -0.25, pitch: 0.9, dist: 10 }]], { env: GAMER, who: 'witty', e: { ...EXPR.happy, look: [0, 1] }, pieces: piecesAt(GOC, 30), dof: 0.8, ez: lin });
    const n = Math.floor(clamp((t - t27 + 0.2) / 1.3) * 27);
    for (let i = 0; i < n; i++) brillAt(g, SQS[i], t27 - 0.2 + i * 1.3 / 27, t, { r: 0.32, y: 1.4 });
    counter(g, String(n), 'BRILLIANT MOVES · ONE GAME', { y: 360, size: 170, a: seg(t, t27 - 0.25, t27), labelColor: TEAL });
    badge(g, 'CHESS.COM, 2025', W / 2, 520, { color: C.cream, size: 28, a: seg(t, gameT, gameT + 0.1) });
  }, { trans: 'zoom', grade: 'stream' });
  for (let i = 0; i < 9; i++) cue(t27 - 0.2 + i * 0.145, 'sparkle', 0.3);
  cue(gameT, 'boom', 0.8);
  // two engines managed eighteen — humans one, robots zero
  const eighT = w('engine', 'eighteen'), humT = w('engine', 'Humans');
  const cccScreen = (n, lit) => { const c = makeCanvas(900, 560), g = c.getContext('2d'); g.fillStyle = '#0E1218'; g.fillRect(0, 0, 900, 560);
    g.fillStyle = '#E8EEF2'; g.font = '900 40px Rubik'; g.textAlign = 'center'; g.fillText('COMPUTER CHESS CHAMPIONSHIP', 450, 90);
    g.font = '800 34px "JetBrains Mono"'; g.fillStyle = '#9FB7C9'; g.fillText('STOOFVLEES  vs  HALOGEN', 450, 150);
    for (let i = 0; i < n; i++) { const x = 120 + (i % 9) * 82, y = 250 + Math.floor(i / 9) * 110; g.fillStyle = TEAL; g.beginPath(); g.arc(x, y, 32, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 36px Rubik'; g.fillText('!!', x, y + 13); }
    g.fillStyle = lit ? '#E9B654' : '#E8EEF2'; g.font = '900 60px Rubik'; g.fillText(String(n), 450, 520); return c; };
  shot(s('engine') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.1, pitch: 0.04, dist: 13, cy: H * 0.42, target: [4, 6.2, 9] }], [len(sh), { yaw: 0.03, pitch: 0.04, dist: 11.5 }]], { t, e: lin });
    const env = room(g, B, { ...STAGE, strips: '#4FA8FF', light: '#9FD0FF', lightA: 0.22 }, { t, blur: 2 });
    for (const x of [-6, -3, 11, 14]) box(g, B, [x, FLOOR_Y, 10], [x + 2, 8, 12], { top: '#1A2028', side: '#0E1218', front: '#141A22' });  // server racks
    for (const x of [-6, -3, 11, 14]) for (let k = 0; k < 12; k++) { const p = at(x + 0.4 + (k % 3) * 0.6, FLOOR_Y + 1 + Math.floor(k / 3) * 1.6, 9.98); if (B.toCam(x, 2, 10)[2] > 1) { g.fillStyle = (k + Math.floor(t * 4)) % 5 ? '#4FD18A' : '#FF6B4F'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.06), 0, 7); g.fill(); } }
    const n = Math.round(clamp((t - s('engine') - 0.3) / (eighT - s('engine') - 0.3)) * 18);
    picture(g, B, cccScreen(n, t > eighT), [-0.5, 9.0, 11], [8.5, 9.0, 11], [-0.5, 3.4, 11], { tone: 'color', border: '#3A4250', pad: 0.2, glow: 0.4 });
  }, { trans: 'whip', grade: 'cold' });
  cue(eighT, 'buzz', 0.6);
  shot(humT - 0.08, (g, lt, t) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1A2A1E'); bg.addColorStop(1, '#07090A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const col = (x, title, n, c, tt) => { const a = seg(t, tt, tt + 0.12); g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = sans(40, 900); g.letterSpacing = '5px'; g.fillStyle = C.cream; g.fillText(title, x, 640);
      g.font = sans(300, 900); g.letterSpacing = '0px'; g.lineWidth = 16; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeText(n, x, 960); g.fillStyle = c; g.fillText(n, x, 960); g.restore(); };
    col(290, 'HUMANS', '1', C.lime, humT); col(790, 'ROBOTS', '0', C.red, w('engine', 'robots'));
    g.save(); g.fillStyle = 'rgba(243,235,221,0.4)'; g.fillRect(W / 2 - 4, 560, 8, 440); g.restore();
    badge(g, '27  vs  18', W / 2, 1120, { color: TEAL, size: 46, a: seg(t, humT + 0.2, humT + 0.3) });
  }, { trans: 'zoom', grade: 'neutral', kb: 0.12 });
  cue(humT, 'hit', 0.8); cue(w('engine', 'zero'), 'stamp', 0.7);

  // ======================= THE KING =======================
  const kingT = w('twist', 'king');
  shot(s('twist') - 0.05, (g, lt, t) => { board(g, t, [SHOW[0] - 99, SHOW[1] - 99, s('twist') + 0.1], { hi: 2 }); }, { trans: 'whip', grade: 'neutral', kb: 0.14 });
  cue(kingT, 'sting', 0.8);
  const naroT = w('naro', 'Daniel');
  shot(s('naro') - 0.08, (g, lt, t, sh) => {
    if (PH.naro) photo3d(g, PH.naro, lt, { from: { x: 0.5, y: 0.36, zoom: 1.0, focus: 0.55 }, to: { x: 0.5, y: 0.32, zoom: 1.2, dolly: 0.14, sx: -0.02 }, dur: len(sh) + 1.5, e: lin });
    nameTitle(g, lt, 'Daniel Naroditsky', '“DANYA” · GRANDMASTER', { y: 300, t0: naroT - (s('naro') - 0.08), subColor: '#E9B654', size: 70 });
    credit(g, 'US MASTERS BLITZ 2024 · PHOTO: KELLY CENTRELLI · CC BY 4.0', seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true });
  cue(naroT, 'boom', 0.9); cue(naroT, 'shimmer', 0.6);
  // nearly 10,000 by early 2023, just blitz and bullet; fans: above 20,000
  const tenT = w('naro2', 'ten'), twT = w('naro3', 'twenty');
  shot(s('naro2') - 0.05, (g, lt, t, sh) => {
    const mv = new Moves(B, GOC, [17, 18, 19, 20, 21, 22, 23, 24].map((k, i) => ({ k, t0: s('naro2') + 0.2 + i * 0.5, dur: 0.18 })));
    study(g, lt, t, [[0, { yaw: 0.45, pitch: 0.55, dist: 10.5, cy: H * 0.54, target: [4, 0.4, 5] }], [len(sh), { yaw: 0.1, pitch: 0.6, dist: 9 }]], { who: 'danya', e: { ...EXPR.focus, look: [0, 1] }, pieces: () => mv.draw(g, t, { labels: false, dof: 1.1 }), bump: mv.bump(t), ez: lin });
    const v = Math.round(lerp(0, 9800, seg(t, s('naro2') + 0.2, tenT + 0.4, ease.out)) / 100) * 100;
    counter(g, v.toLocaleString('en-US'), 'BRILLIANT MOVES · BY JAN 2023', { y: 360, size: 150, labelColor: TEAL });
    badge(g, 'BLITZ + BULLET ONLY', W / 2, 520, { color: C.cream, size: 30, a: seg(t, w('naro2', 'blitz'), w('naro2', 'blitz') + 0.1) });
    credit(g, 'SOURCE: CHESS.COM, “DANIEL NARODITSKY’S BRILLIANT MOVES”', seg(lt, 0.3, 0.5));
  }, { trans: 'zoom', grade: 'warm' });
  for (let i = 0; i < 6; i++) cue(s('naro2') + 0.3 + i * 0.4, 'sparkle', 0.25);
  cue(tenT, 'hit', 0.7);
  shot(s('naro3') - 0.05, (g, lt, t) => {
    board(g, t, [SHOW[0] - 99, SHOW[1] - 99, s('naro3') - 0.05], { reveal: seg(t, twT - 0.1, twT), hi: 2 });
    if (t > twT) { confetti(g, t, twT, { n: 70 }); }
  }, { trans: 'whip', grade: 'gold', kb: 0.14 });
  cue(twT, 'boom', 1); cue(twT, 'cheer', 0.5);

  // who he was: a book at 14, GM at 18, US blitz 14/14
  const bookT = w('who', 'book'), gmT = w('who', 'grandmaster'), usT = w('who', 'US');
  const cover = (() => { const c = makeCanvas(600, 860), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 600, 860); gr.addColorStop(0, '#2A4A6A'); gr.addColorStop(1, '#14263A'); g.fillStyle = gr; g.fillRect(0, 0, 600, 860);
    g.fillStyle = '#E9B654'; g.fillRect(40, 120, 520, 6); g.fillStyle = '#F2E8D6'; g.font = '700 58px Cinzel'; g.textAlign = 'center'; g.fillText('MASTERING', 300, 220); g.fillText('POSITIONAL', 300, 290); g.fillText('CHESS', 300, 360);
    g.font = '800 30px Rubik'; g.fillStyle = '#E9B654'; g.fillText('DANIEL NARODITSKY', 300, 780);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) { g.fillStyle = 'rgba(242,232,214,0.18)'; g.fillRect(140 + i * 40, 420 + j * 40, 40, 40); } return c; })();
  shot(s('who') - 0.05, (g, lt, t, sh) => {
    study(g, lt, t, [[0, { yaw: -0.35, pitch: 0.3, dist: 9, cy: H * 0.5, target: [4, 1.6, 6] }], [len(sh), { yaw: -0.2, pitch: 0.28, dist: 8 }]], { who: 'danya', e: { ...EXPR.happy, look: [0, 0.8] }, pieces: () => {}, ez: lin, slab: { light: '#5A3E26', dark: '#5A3E26', frame: '#4A3220', side: '#2E1E10' } });
    picture(g, B, cover, [2.2, 0.02, 6.2], [5.8, 0.02, 6.0], [2.3, 0.02, 1.4], { tone: 'color', border: '#1A2A3A', pad: 0.08 });
    counter(g, 'AGE 14', 'FIRST BOOK · 2010', { y: 360, size: 130, a: seg(t, bookT, bookT + 0.1) });
  }, { trans: 'whip', grade: 'warm' });
  cue(bookT, 'pluck', 0.7);
  shot(gmT - 0.12, (g, lt, t, sh) => {
    study(g, lt, t, [[0, { yaw: 0.3, pitch: 0.14, dist: 8, cy: H * 0.46, target: [4, 3, 9.4] }], [len(sh), { yaw: 0.15, pitch: 0.12, dist: 7.2 }]], { who: 'danya', e: { ...EXPR.triumph, nod: 0.4 }, pieces: piecesAt(GOC, 0), ez: lin });
    badge(g, 'GRANDMASTER', W / 2, 330, { color: C.gold, size: 52, sub: 'AGE 18 · 2013', a: seg(t, gmT, gmT + 0.1), scale: pop(t, gmT) });
  }, { trans: 'zoom', grade: 'warm' });
  cue(gmT, 'boom', 0.7);
  shot(usT - 0.12, (g, lt, t, sh) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#22303E'); bg.addColorStop(1, '#0A0E13'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const n = Math.round(lerp(0, 14, seg(t, usT, w('who', 'out') + 0.3, lin)));
    for (let i = 0; i < 14; i++) { const x = 120 + (i % 7) * 140, y = 760 + Math.floor(i / 7) * 150, on = i < n; g.save(); g.fillStyle = on ? C.lime : 'rgba(255,255,255,0.08)'; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowOffsetY = on ? 6 : 0; g.beginPath(); g.roundRect(x - 52, y - 52, 104, 104, 12); g.fill(); g.shadowColor = 'transparent';
      g.fillStyle = on ? C.ink : 'rgba(255,255,255,0.3)'; g.font = sans(54, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(on ? '1' : '·', x, y + 2); g.restore(); }
    counter(g, `${n} / 14`, 'US BLITZ CHAMPION · 2025', { y: 520, size: 170 });
    placeStamp(g, lt, 'U.S. Blitz', 'August 2025', { y: 200, t0: 0.05 });
  }, { trans: 'whip', grade: 'neutral', kb: 0.12 });
  for (let i = 0; i < 7; i++) cue(usT + 0.1 + i * 0.22, 'tick', 0.5);
  cue(w('who', 'out') + 0.3, 'boom', 0.8);
  // teaching anyone who wanted to learn, for free
  const freeT = w('teacher', 'free');
  shot(s('teacher') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.25, pitch: 0.12, dist: 9, cy: H * 0.46, target: [4, 3.2, 9.4] }], [len(sh), { yaw: -0.08, pitch: 0.1, dist: 7.8 }]], { t, e: lin });
    const env = room(g, B, STUDY, { t, blur: 4 });
    picture(g, B, (() => { const c = makeCanvas(640, 640), x = c.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#769656' : '#EEEED2'; x.fillRect(i * 80, j * 80, 80, 80); } return c; })(), [-3.5, 10.5, 12.9], [1.5, 10.5, 12.9], [-3.5, 5.5, 12.9], { tone: 'color', border: '#3A2A1C', pad: 0.12 });
    const hands = seated(g, B, 'danya', { ...EXPR.happy, look: [0.3, 0.2], nod: 0.3 }, t, { z: 9.4 });
    table(g, B, env); hands();
    chat(g, 560, 1220, t, s('teacher') + 0.2, { n: 5, w: 470, lines: [['rook_lift', 'this explanation is gold'], ['endgame_enjoyer', 'finally get this endgame'], ['blitz_fan', 'the speedrun continues'], ['novice_17', 'learned more here than anywhere'], ['knightowl', 'thank you for the lesson'], ['pawn_storm', 'what a find']] });
    badge(g, 'FOR FREE', W / 2, 330, { color: C.lime, size: 52, a: seg(t, freeT, freeT + 0.1), scale: pop(t, freeT) });
  }, { trans: 'fade', transDur: 0.3, grade: 'warm' });
  cue(freeT, 'pluck', 0.6);

  // ======================= TRIBUTE =======================
  shot(s('death') - 0.08, (g, lt, t, sh) => {
    if (PH.memorial) photo3d(g, PH.memorial, lt, { from: { x: 0.5, y: 0.45, zoom: 1.0, focus: 0.4 }, to: { x: 0.52, y: 0.42, zoom: 1.15, dolly: 0.12 }, dur: len(sh), e: lin });
    const a = seg(t, w('death', 'died') - 0.1, w('death', 'died') + 0.4);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = serif(64, 700); g.fillStyle = C.cream; g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowOffsetY = 5;
    g.fillText('1995 – 2025', W / 2, 360); g.restore();
    credit(g, 'NARODITSKY MEMORIAL 2026 · PHOTO: KELLY CENTRELLI / CHARLOTTE CHESS CENTER · CC BY 4.0', seg(lt, 0.2, 0.4));
  }, { trans: 'fade', transDur: 0.5, grade: 'bw', noJump: true, vig: 0.8 });
  cue(w('death', 'died'), 'thud', 0.4);
  // that one's for Danya: one badge glowing over an empty board
  const forT = w('final', "Danya");
  shot(s('final') - 0.05, (g, lt, t, sh) => {
    study(g, lt, t, [[0, { yaw: 0.0, pitch: 0.55, dist: 12, cy: H * 0.56, target: [4, 0.5, 4] }], [len(sh), { yaw: 0.0, pitch: 0.48, dist: 9.5 }]], { who: null, pieces: [{ t: 'k', c: 'w', x: 4.5, z: 3.5 }], ez: ease.inOut, env: { ...STUDY, light: '#FFE2B0', lightA: 0.4 } });
    const p = at(4.5, 2.2, 3.5); brill(g, p.x, p.y, p.s * 0.6, { a: seg(t, s('final') + 0.4, s('final') + 0.8), s: 1 + 0.03 * Math.sin(t * 3) });
    embers(g, t, { n: 40, a: 0.5, color: '#FFE2B0' });
    const a = seg(t, forT - 0.1, forT + 0.3, ease.out);
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = serif(84, 700); g.fillStyle = C.cream; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowOffsetY = 6; g.fillText('For Danya', W / 2, 330);
    g.font = sans(26, 800); g.letterSpacing = '6px'; g.fillStyle = '#E9B654'; g.fillText('DANIEL NARODITSKY · 1995 – 2025', W / 2, 390); g.restore();
  }, { trans: 'fade', transDur: 0.4, grade: 'gold', noJump: true });
  cue(s('final') + 0.4, 'sparkle', 0.6); cue(forT, 'shimmer', 0.6);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: s('hook2') - 0.05, m: 'tension' }, { t: s('what') - 0.05, m: 'intrigue' }, { t: topT, m: 'hit' }, { t: topT + 0.5, m: 'digital' },
    { t: s('engine') - 0.05, m: 'clockwork' }, { t: humT, m: 'victory' }, { t: s('twist') - 0.05, m: 'drop' }, { t: s('naro') - 0.08, m: 'glory' },
    { t: s('who') - 0.05, m: 'build' }, { t: s('teacher') - 0.05, m: 'void' }, { t: s('death') - 0.08, m: 'elegy' }, { t: s('final') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
