// GothamChess vs The World (Chess.com vote chess, Sept–Nov 2025): Levy Rozman against 225,054 voters. The Caro-Kann,
// the rook left on h5, 21...e5!! and "the ROOOOK", the queen given back, the king hunt from g1 to a4, 41...Rxa2#.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas } from '../../engine/js/core.js';
import { flash, confetti, spotlight, speedlines, rays } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { nameTitle, counter, badge, stamp, sans, serif, mono } from '../../engine/js/hud.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, table, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { burst, shockwave, glint, embers } from '../../engine/js/fx.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { GAMER, ledStrip, chat } from '../../engine/js/witty.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const photo = async k => { try { return await loadPhoto3d(`../episodes/levy/photos/${k}`); } catch { return null; } };
const PH = { close: await photo('levy_closeup'), wave: await photo('levy_wave') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const TEAL = '#1BADA6';
const ARENA = { base: '#04060A', wall: ['#121A26', '#0E141D'], seam: '#0A0E13', floor: ['#0C1117', '#090D12'], light: '#BFD8FF', lightA: 0.18, strips: '#4F8FFF' };
const STUDY = { base: '#0A0806', wall: ['#3A2E22', '#33281E'], seam: '#221A12', rail: '#56432E', floor: ['#281E16', '#221912'], light: '#FFD9A0', lightA: 0.3, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const CREDIT = 'COLLISION 2024 · PHOTO: PIARAS Ó MÍDHEACH / COLLISION VIA SPORTSFILE · CC BY 2.0';

// the brilliant-move badge: a teal disc with two hand-drawn exclamation marks
function brill(g, x, y, r, { a = 1, s = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowOffsetY = r * 0.12; g.fillStyle = TEAL; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(-r * 0.25, -r * 0.3, r * 0.55, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF';
  for (const sd of [-1, 1]) {
    const x = sd * r * 0.24;
    g.beginPath(); g.moveTo(x - r * 0.11, -r * 0.56); g.lineTo(x + r * 0.11, -r * 0.56); g.lineTo(x + r * 0.07, r * 0.16); g.lineTo(x - r * 0.07, r * 0.16); g.closePath(); g.fill();
    g.beginPath(); g.arc(x, r * 0.42, r * 0.1, 0, 7); g.fill();
  }
  g.restore();
}

// "The World": rows of people seen from behind, small and hazy far away, big dark silhouettes up front;
// some hold up glowing phones (the votes). cheer makes them bounce.
function crowd(g, t, { y0 = H * 0.5, y1 = H + 60, rows = 16, a = 1, cheer = 0, seed = 4, tint = '#7AA6D6', phones = 0.1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  const hz = g.createLinearGradient(0, y0 - 120, 0, y0 + 420); hz.addColorStop(0, rgba(tint, 0)); hz.addColorStop(0.35, rgba(tint, 0.2)); hz.addColorStop(1, rgba(tint, 0));
  g.fillStyle = hz; g.fillRect(0, y0 - 120, W, 540);
  for (let r = 0; r < rows; r++) {
    const k = (r + 1) / rows, y = lerp(y0, y1, Math.pow(k, 1.7)), size = lerp(9, 150, Math.pow(k, 2)), sp = size * 1.15;
    const rr = rng(seed * 100 + r), off = rr() * sp, n = Math.ceil((W + 2 * sp) / sp) + 1;
    const body = mix(mix('#3A4658', tint, 0.3), '#0B0E14', Math.pow(k, 0.6));
    for (let i = 0; i < n; i++) {
      const jx = (rr() - 0.5) * sp * 0.5, ph = rr() * 6.28, hasPhone = rr() < phones && k < 0.55, sc = 0.85 + rr() * 0.3;
      const x = -sp + off + i * sp + jx, bob = Math.abs(Math.sin(t * (5 + ph) + ph)) * size * 0.12 * cheer + Math.sin(t * 1.3 + ph) * size * 0.02;
      const s = size * sc, yy = y - bob;
      g.fillStyle = body;
      g.beginPath(); g.ellipse(x, yy, s * 0.55, s * 0.36, 0, Math.PI, 0); g.fill();
      g.beginPath(); g.arc(x, yy - s * 0.52, s * 0.27, 0, 7); g.fill();
      g.strokeStyle = rgba(mix(tint, '#FFFFFF', 0.3), 0.6 - 0.25 * k); g.lineWidth = Math.max(1, s * 0.045);
      g.beginPath(); g.arc(x, yy - s * 0.52, s * 0.27, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.beginPath(); g.ellipse(x, yy, s * 0.55, s * 0.36, 0, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
      g.beginPath(); g.ellipse(x, yy, s * 0.55, s * 0.36, 0, Math.PI * 1.55, Math.PI * 1.85); g.stroke();
      if (hasPhone) {
        const px = x + s * 0.3, py = yy - s * (0.95 + 0.25 * cheer);
        g.fillStyle = rgba('#CFE6FF', 0.9); g.fillRect(px - s * 0.09, py - s * 0.15, s * 0.18, s * 0.3);
        g.fillStyle = rgba('#CFE6FF', 0.12); g.beginPath(); g.arc(px, py, s * 0.25, 0, 7); g.fill();
      }
    }
  }
  g.restore();
}

// flat Chess.com-style board for the voting panel
function board2d(g, x, y, size, plies, k, { arrow = null, hl = [] } = {}) {
  const c = size / 8, pcs = plies[k].pieces;
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { g.fillStyle = (f + r) % 2 ? COM.dark : COM.light; g.fillRect(x + f * c, y + (7 - r) * c, c, c); }
  for (const sq of hl) { const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1; g.fillStyle = 'rgba(246,246,105,0.55)'; g.fillRect(x + f * c, y + (7 - r) * c, c, c); }
  for (const p of pcs) { const f = p.sq.charCodeAt(0) - 97, r = +p.sq[1] - 1; drawPiece(g, p.t, p.c, x + (f + 0.5) * c, y + (7 - r + 0.9) * c, c * 0.95); }
  if (arrow) {
    const [a, b, u] = arrow, P = s => [x + (s.charCodeAt(0) - 97 + 0.5) * c, y + (7 - (+s[1] - 1) + 0.5) * c];
    const [x0, y0] = P(a), [x1, y1] = P(b), xe = lerp(x0, x1, u), ye = lerp(y0, y1, u), ang = Math.atan2(ye - y0, xe - x0);
    g.save(); g.strokeStyle = 'rgba(255,170,0,0.85)'; g.fillStyle = 'rgba(255,170,0,0.85)'; g.lineWidth = c * 0.2; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe - Math.cos(ang) * c * 0.3, ye - Math.sin(ang) * c * 0.3); g.stroke();
    g.beginPath(); g.moveTo(xe, ye); g.lineTo(xe - Math.cos(ang - 0.5) * c * 0.45, ye - Math.sin(ang - 0.5) * c * 0.45); g.lineTo(xe - Math.cos(ang + 0.5) * c * 0.45, ye - Math.sin(ang + 0.5) * c * 0.45); g.closePath(); g.fill();
    g.restore();
  }
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
  const brillAt = (g, sq, t0, t, { y = 1.9, r = 0.42 } = {}) => {
    const [x, z] = sqXZ(sq), p = at(x, y, z), a = seg(t, t0, t0 + 0.12);
    brill(g, p.x, p.y, p.s * r, { a, s: lerp(1.6, 1, seg(t, t0, t0 + 0.25, ease.back)) });
  };
  // Levy at the board, sitting behind Black (far side); pieces may be a list or a callback
  const atBoard = (g, lt, t, keys, { env = STUDY, who = 'levy', e = 'focus', pieces = null, reach = null, blur = 4, dof = 1.4, ez = ease.inOut, bump = 0 } = {}) => {
    rig(B, lt, keys, { t, e: ez, bump });
    const E = room(g, B, env, { t, blur });
    const hw = who ? seated(g, B, who, e, t, { z: 9.4, reach, side: -1 }) : () => {};
    table(g, B, E); B.drawSlab(g, COM);
    if (typeof pieces === 'function') pieces(); else if (pieces) B.drawPieces(g, pieces, { focus: B.dist, dof });
    hw();
    return E;
  };
  const vsTitle = (g, a = 1, y = 330) => {  // "225,000 vs 1" — readable from the very first frame
    if (a <= 0) return;
    counter(g, '225,000', null, { y, size: 168, color: C.gold, a });
    g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.font = sans(54, 900); g.letterSpacing = '4px'; g.fillStyle = C.cream;
    g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 5; g.fillText('PEOPLE  vs  1 GUY', W / 2, y + 86); g.restore();
  };

  // ======================= HOOK =======================
  const oneT = w('hook1', 'against') + 0.2, guyT = w('hook1', 'guy');
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 0.16, dist: 22, cy: H * 0.46, target: [4, 2.6, 8] }], [len(sh), { yaw: 0.03, pitch: 0.14, dist: 16.5 }]], { t, e: lin });
    const E = room(g, B, ARENA, { t, blur: 2 });
    const base = at(4, 0, 9.4);
    spotlight(g, base.x, base.y - 200, 420, '#DDE8FF', 0.14 + 0.14 * seg(t, oneT, oneT + 0.3));
    const hw = seated(g, B, 'levy', exprAt([[0, 'focus'], [oneT, { ...EXPR.smug, look: [0, 0.2] }]], t), t, { z: 9.4 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, piecesAt(G, 2), { focus: B.dist, dof: 1 }); hw();
    crowd(g, t, { y0: at(4, 0, -0.6).y + 24, rows: 18, phones: 0.14, cheer: 0.3 });
    vsTitle(g, 1, 300);
    badge(g, 'GOTHAMCHESS', W / 2, 480, { color: C.gold, size: 34, a: seg(t, guyT - 0.1, guyT), scale: pop(t, guyT - 0.1) });
  }, { grade: 'night', noJump: true });
  cue(0.05, 'boom', 0.7); cue(0.05, 'whoosh', 0.5); cue(w('hook1', 'one'), 'tick', 0.6); cue(oneT, 'sting', 0.6);
  // and they lost: the last move lands
  const lostT = w('hook2', 'lost');
  const mateMv = new Moves(B, G, [{ k: 82, t0: lostT - 0.42, color: C.red, label: 'Rxa2#', labelColor: C.red }]);
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    atBoard(g, lt, t, [[0, { yaw: -0.6, pitch: 0.95, dist: 9, cy: H * 0.55, target: [1.4, 0, 2.4] }], [len(sh), { yaw: -0.45, pitch: 1.0, dist: 7.6 }]], { who: null, pieces: () => mateMv.draw(g, t, { labels: 'custom', dof: 1 }), bump: mateMv.bump(t), ez: lin });
    stamp(g, 'CHECKMATE', W / 2, 420, t, lostT, { color: C.red, size: 110 });
  }, { trans: 'whip', grade: 'cold' });
  mateMv.cues(cue); cue(lostT, 'stamp', 1); cue(lostT, 'boom', 0.7);

  // ======================= WHO =======================
  const levyT = w('who', 'Levy'), bigT = w('who', 'biggest');
  shot(s('who') - 0.05, (g, lt, t, sh) => {
    if (PH.close) photo3d(g, PH.close, lt, { from: { x: 0.5, y: 0.4, zoom: 1.0, focus: 0.55 }, to: { x: 0.5, y: 0.36, zoom: 1.18, dolly: 0.12, sx: 0.02 }, dur: len(sh), e: lin });
    nameTitle(g, lt, 'Levy Rozman', '“GOTHAMCHESS” · INTERNATIONAL MASTER', { y: 300, t0: levyT - (s('who') - 0.05), subColor: C.gold, size: 74 });
    credit(g, CREDIT, seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true });
  cue(levyT, 'boom', 0.7); cue(w('who', 'GothamChess'), 'shimmer', 0.6);
  shot(bigT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.25, pitch: 0.12, dist: 9, cy: H * 0.47, target: [4, 3.2, 9.4] }], [len(sh), { yaw: 0.08, pitch: 0.1, dist: 7.6 }]], { t, e: lin });
    const env = room(g, B, GAMER, { t, blur: 3 });
    ledStrip(g, B, [-8, 11.5, BACK_Z - 0.1], [16, 11.5, BACK_Z - 0.1], '#E0603F', t);
    const hands = seated(g, B, 'levyStream', { ...EXPR.happy, nod: 0.4, look: [0.2, 0.1] }, t, { z: 9.4 });
    table(g, B, { ...env, table: ['#1E1C28', '#121018', '#0C0A12'] }); hands();
    badge(g, 'BIGGEST CHESS CHANNEL', W / 2, 330, { color: C.red, size: 50, sub: 'ON YOUTUBE', a: seg(t, bigT, bigT + 0.1), scale: pop(t, bigT) });
    chat(g, 560, 1230, t, bigT, { n: 5, w: 470, lines: [['rook_enjoyer', 'SACRIFICE THE ROOK'], ['caro_main', 'caro-kann gang'], ['pawn_pusher', 'hi levy!'], ['blunder_king', 'he hung it on purpose'], ['night_rider', 'GG']] });
  }, { trans: 'whip', grade: 'stream' });
  cue(bigT, 'hit', 0.7);

  // ======================= THE VOTE =======================
  const voteT = w('vote', 'vote'), dayT = w('vote', 'One');
  shot(s('vote') - 0.05, (g, lt, t, sh) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1A2230'); bg.addColorStop(1, '#07090C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    crowd(g, t, { y0: H * 0.66, rows: 14, phones: 0.3, cheer: 0.6 * seg(t, voteT, voteT + 0.3), tint: '#A8C66C' });
    // the voting panel
    const px = 130, py = 300, pw = W - 260, bs = pw - 240, ph = 100 + bs + 40 + 148 + 24, u = seg(lt, 0, 0.3, ease.out);
    g.save(); g.globalAlpha = u; g.translate(0, (1 - u) * 60);
    g.fillStyle = 'rgba(38,36,33,0.97)'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 12; g.beginPath(); g.roundRect(px, py, pw, ph, 18); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = C.cream; g.font = sans(34, 900); g.letterSpacing = '1px'; g.textAlign = 'center'; g.fillText('GothamChess vs The World', W / 2, py + 62);
    board2d(g, px + 120, py + 100, bs, G, 2, { hl: ['c7', 'c6'], arrow: ['d2', 'd4', seg(t, voteT, voteT + 0.4, ease.out)] });
    const bars = [['2. d4', 0.58, '58%', '#81B64C'], ['OTHER MOVES', 0.42, '42%', '#5A5855']];
    bars.forEach(([lab, f, pct, col], i) => {
      const yy = py + 100 + bs + 40 + i * 74, ww = (pw - 120) * f * seg(t, voteT + i * 0.1, voteT + 0.6 + i * 0.1, ease.out);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px + 60, yy, pw - 120, 54);
      g.fillStyle = col; g.fillRect(px + 60, yy, ww, 54);
      g.textAlign = 'left'; g.font = sans(30, 800); g.fillStyle = C.cream; g.fillText(lab, px + 76, yy + 38);
      g.textAlign = 'right'; g.fillText(pct, px + pw - 76, yy + 38);
    });
    g.restore();
    badge(g, '1 MOVE A DAY', W / 2, 250, { color: C.gold, size: 46, a: seg(t, dayT, dayT + 0.1), scale: pop(t, dayT) });
  }, { trans: 'zoom', grade: 'neutral', kb: 0.08 });
  cue(voteT, 'pluck', 0.8); cue(voteT + 0.1, 'riser', 0.3); cue(dayT, 'hit', 0.6);
  for (let i = 0; i < 6; i++) cue(voteT + 0.1 + i * 0.12, 'tick', 0.35);

  // ======================= THE RECORD =======================
  const twoT = w('record', 'two'), smashT = w('record', 'smashed'), recT = w('record', 'record');
  const ROWS = [['KASPAROV vs THE WORLD', '50,000', '1999', 50000, C.blue], ['ANAND vs THE WORLD', '~70,000', '2024', 70000, C.teal], ['CARLSEN vs THE WORLD', '143,000', 'THE OLD RECORD', 143000, C.lime], ['ROZMAN vs THE WORLD', '225,054', '2025', 225054, C.gold]];
  shot(s('record') - 0.05, (g, lt, t, sh) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#202A36'); bg.addColorStop(1, '#08090C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.font = sans(44, 900); g.letterSpacing = '5px'; g.textAlign = 'center'; g.fillStyle = C.cream; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText('BIGGEST ONLINE GAME EVER', W / 2, 300); g.restore();
    g.fillStyle = C.gold; g.fillRect(W / 2 - 50, 328, 100, 6);
    ROWS.forEach(([name, val, sub, n, col], i) => {
      const last = i === 3, t0 = last ? twoT : s('record') + i * 0.12, u = seg(t, t0, t0 + (last ? smashT + 0.25 - twoT : 0.4), last ? ease.inOut : ease.out);
      const y = 520 + i * 250, x0 = 110, wmax = W - 220, ww = Math.max(8, wmax * n / 225054 * u);
      g.save(); g.globalAlpha = seg(t, t0 - 0.1, t0 + 0.05);
      g.font = sans(36, 900); g.letterSpacing = '2px'; g.textAlign = 'left'; g.fillStyle = last ? C.gold : C.cream; g.fillText(name, x0, y - 20);
      g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x0, y, wmax, 96);
      g.fillStyle = col; g.fillRect(x0, y, ww, 96);
      g.font = sans(50, 900); g.letterSpacing = '0px'; g.fillStyle = C.ink; const shown = last ? Math.round(225054 * u).toLocaleString('en-US') : val;
      if (ww > 300) g.fillText(shown, x0 + 22, y + 66); else { g.fillStyle = C.cream; g.fillText(shown, x0 + ww + 22, y + 66); }
      g.font = sans(20, 800); g.letterSpacing = '3px'; g.fillStyle = 'rgba(243,235,221,0.7)'; g.fillText(sub, x0, y + 130);
      g.restore();
    });
    if (t > smashT + 0.2) { const p = { x: 110 + (W - 220) * 143000 / 225054, y: 520 + 2 * 250 + 48 }; burst(g, p.x, p.y, t, smashT + 0.2, { n: 30, color: C.lime, speed: 900, size: 7, seed: 3 }); shockwave(g, p.x, p.y, t, smashT + 0.2, { r1: 260, color: '#FFFFFF', squash: 1 }); }
    badge(g, 'IN 2 DAYS', W / 2, 420, { color: C.red, size: 44, a: seg(t, twoT, twoT + 0.1), scale: pop(t, twoT) });
    stamp(g, 'WORLD RECORD', W / 2, 1560, t, recT, { color: C.gold, size: 84, rot: -0.1 });
    credit(g, 'SOURCE: CHESS.COM', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'neutral', noJump: true });
  cue(twoT, 'riser', 0.5); cue(smashT + 0.2, 'glass', 0.9); cue(smashT + 0.2, 'boom', 0.8); cue(recT, 'stamp', 0.9);

  // ======================= THE GAME =======================
  // Levy takes Black: 1.e4 c6, the Caro-Kann
  const blackT = w('caro', 'Black'), ckT = w('caro', 'Caro-Kann'), courseT = w('caro', 'course');
  const open = new Moves(B, G, [{ k: 1, t0: blackT - 0.1 }, { k: 2, t0: ckT - 0.35, color: C.gold, label: '1...c6', labelColor: C.gold }]);
  shot(s('caro') - 0.05, (g, lt, t, sh) => {
    const m = open.current(t);
    atBoard(g, lt, t, [[0, { yaw: 0.55, pitch: 0.55, dist: 12, cy: H * 0.52, target: [4, 0.8, 5] }], [len(sh), { yaw: 0.2, pitch: 0.5, dist: 9.6 }]], {
      e: exprAt([[0, 'focus'], [ckT - (t - lt), { ...EXPR.smug, look: [0, 0.6] }], [courseT - 0.3 - (t - lt), { ...EXPR.happy, nod: 0.6 }]], lt),
      pieces: () => open.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: open.bump(t), reach: m && m.k === 2 ? { sq: 'c6', u: (t - m.t0 + 0.15) / 0.6 } : null, ez: lin });
    badge(g, 'LEVY = BLACK', W / 2, 300, { color: C.cream, size: 40, a: seg(t, blackT, blackT + 0.1) * (1 - seg(t, ckT - 0.1, ckT)), scale: pop(t, blackT) });
    badge(g, 'THE CARO-KANN', W / 2, 300, { color: C.gold, size: 52, a: seg(t, ckT, ckT + 0.1), scale: pop(t, ckT) });
    badge(g, 'OF COURSE', W / 2, 420, { color: C.red, size: 34, a: seg(t, courseT - 0.15, courseT - 0.05) });
  }, { trans: 'zoom', grade: 'warm' });
  open.cues(cue); cue(ckT, 'hit', 0.7); cue(courseT - 0.15, 'pluck', 0.6);

  // 20...Rh5: the rook parked in the open
  const h5T = w('rook', 'h5'), openT = w('rook', 'open');
  const rookMv = new Moves(B, G, [{ k: 40, t0: h5T - 0.45, color: C.gold, label: '20...Rh5', labelColor: C.gold, dur: 0.5 }]);
  shot(s('rook') - 0.05, (g, lt, t, sh) => {
    const m = rookMv.current(t);
    atBoard(g, lt, t, [[0, { yaw: -0.5, pitch: 0.6, dist: 11, cy: H * 0.53, target: [5, 0.6, 5.5] }], [h5T - (t - lt), { yaw: -0.65, pitch: 0.62, dist: 9 }], [len(sh), { yaw: -0.75, pitch: 0.7, dist: 6.8, target: [7.2, 0.4, 4.5] }]], {
      e: exprAt([[0, 'focus'], [openT - (t - lt), { ...EXPR.smug, look: [0.5, 0.6] }]], lt),
      pieces: () => rookMv.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: rookMv.bump(t), reach: m ? { sq: 'h5', u: (t - m.t0 + 0.15) / 0.7 } : null, ez: ease.inOut });
    if (t > openT) B.highlight(g, 'h5', C.gold, 0.25 + 0.15 * Math.sin(t * 8));
    badge(g, 'IN THE OPEN', W / 2, 300, { color: C.gold, size: 44, a: seg(t, openT, openT + 0.1), scale: pop(t, openT) });
  }, { trans: 'whip', grade: 'warm' });
  rookMv.cues(cue); cue(openT, 'sting', 0.5);

  // 21.g4 attacks it; 21...e5!! — Levy ignores it
  const attT = w('attack', 'attacked'), ignT = w('attack', 'ignored');
  const att = new Moves(B, G, [{ k: 41, t0: attT - 0.2, color: C.red, label: '21.g4', labelColor: C.red }, { k: 42, t0: ignT - 0.25, color: TEAL, label: '21...e5!!', labelColor: TEAL }]);
  shot(s('attack') - 0.05, (g, lt, t, sh) => {
    const m = att.current(t);
    atBoard(g, lt, t, [[0, { yaw: -0.85, pitch: 0.55, dist: 8.5, cy: H * 0.53, target: [6.4, 0.6, 4.4] }], [ignT - 0.3 - (t - lt), { yaw: -0.7, pitch: 0.6, dist: 8 }], [len(sh), { yaw: -0.3, pitch: 0.66, dist: 9, target: [5.2, 0.6, 4.6] }]], {
      e: exprAt([[0, { ...EXPR.focus, look: [0.6, 0.7] }], [ignT - 0.3 - (t - lt), { ...EXPR.smug, look: [-0.3, 0.6], lid: 0.55 }]], lt),
      pieces: () => att.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: att.bump(t), reach: m && m.k === 42 ? { sq: 'e5', u: (t - m.t0 + 0.15) / 0.6 } : null, ez: ease.inOut });
    if (t > attT + 0.25 && t < ignT) B.laser(g, 'g4', 'h5', C.red, 0.9, 0.5, seg(t, attT + 0.25, attT + 0.5));
    if (t > ignT + 0.2) brillAt(g, 'e5', ignT + 0.2, t, { r: 0.5 });
    badge(g, 'THE ROOK IS HANGING', W / 2, 300, { color: C.red, size: 42, a: seg(t, attT + 0.3, attT + 0.4) * (1 - seg(t, ignT - 0.1, ignT)), scale: pop(t, attT + 0.3) });
    badge(g, 'HE IGNORES IT', W / 2, 300, { color: TEAL, size: 46, a: seg(t, ignT, ignT + 0.1), scale: pop(t, ignT) });
  }, { trans: 'zoom', grade: 'warm' });
  att.cues(cue); cue(attT + 0.3, 'alarm', 0.4); cue(ignT + 0.2, 'sparkle', 0.9); cue(ignT + 0.2, 'shimmer', 0.6);

  // SACRIFICE THE ROOOOK
  const sacT = w('sac', 'Sacrifice'), rkT = w('sac', 'rook');
  shot(s('sac') - 0.05, (g, lt, t, sh) => {
    const bg = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#8E2A1E'); bg.addColorStop(1, '#1A0605'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    rays(g, W / 2, H * 0.62, t, { n: 22, color: '#FFB27A', a: 0.16 });
    speedlines(g, W / 2, H * 0.5, t, { a: 0.5, n: 50, r0: 380, color: '#FFE2C8' });
    // the rook rises behind him, huge
    const u = seg(t, sacT, rkT + 0.2, ease.out);
    drawPiece(g, 'r', 'b', W / 2 + 230, H * 0.98 - u * 260, 900, { rot: 0.12 * Math.sin(t * 9) * u, alpha: 0.95 });
    drawChar(g, 'levy', { x: W / 2 - 60, y: H * 0.56, s: 1.55 + 0.1 * u, e: { ...EXPR.shock, open: 1, mouth: 'o', brow: -0.7, browY: -20, shake: 0.8, look: [0.3, -0.2] }, t });
    g.save(); const k = lerp(1.6, 1, seg(t, sacT, sacT + 0.2, ease.back)); g.translate(W / 2, 330); g.rotate(-0.04); g.scale(k, k);
    g.textAlign = 'center'; g.font = sans(88, 900); g.letterSpacing = '2px'; g.lineJoin = 'round';
    g.lineWidth = 14; g.strokeStyle = C.ink; g.fillStyle = C.cream; g.strokeText('SACRIFICE', 0, -40); g.fillText('SACRIFICE', 0, -40);
    const ro = 'THE RO' + 'O'.repeat(1 + Math.floor(5 * seg(t, rkT - 0.1, rkT + 0.5))) + 'K!';
    g.font = sans(104, 900); g.fillStyle = C.red; g.strokeText(ro, 0, 80); g.fillText(ro, 0, 80);
    g.restore();
  }, { trans: 'flash', grade: 'warm', noJump: true });
  cue(sacT, 'boom', 1); cue(sacT, 'riser', 0.5); cue(rkT, 'hit', 0.9); cue(rkT, 'cheer', 0.4);

  // THE ROOOOOOOK — the meme, shouted with an echo: the word stretches across the screen while the scream lasts
  const r0 = s('rooook'), r1 = T.e('rooook');
  shot(r0 - 0.04, (g, lt, t, sh) => {
    const u = seg(t, r0, r0 + (r1 - r0) * 0.6), beat = 0.5 + 0.5 * Math.sin(t * 22);
    const bg = g.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.45, H * 0.85); bg.addColorStop(0, mix('#B8321E', '#E0603F', beat * 0.4)); bg.addColorStop(1, '#1A0605'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    rays(g, W / 2, H * 0.4, t * 3, { n: 26, color: '#FFD0A0', a: 0.2 });
    speedlines(g, W / 2, H * 0.4, t, { a: 0.7, n: 60, r0: 300, color: '#FFE8D0' });
    // the rook spins up out of the board toward the camera
    const k = seg(t, r0, r1, ease.in);
    drawPiece(g, 'r', 'b', W / 2 + Math.sin(t * 7) * 30, H * 0.62 + 300 * k, 420 + 1500 * k, { rot: t * 2.2, alpha: 1 - seg(t, r1 - 0.25, r1) });
    drawChar(g, 'levy', { x: W / 2, y: H * 0.8, s: 1.9, e: { ...EXPR.shock, open: 1, mouth: 'o', brow: -0.8, browY: -24, shake: 1.2, look: [0, -0.3], pupil: 0.45 }, t });
    // the word, fitted to the width; echo copies spread out behind it
    const word = 'RO' + 'O'.repeat(Math.round(lerp(1, 10, u))) + 'K!';
    g.save(); g.font = sans(200, 900); const tw = g.measureText(word).width, fs = Math.min(1, (W - 70) / tw);
    for (let e = 3; e >= 0; e--) {
      const de = seg(t, r0 + 0.16 * e, r0 + 0.16 * e + 0.5), sc = fs * (1 + e * 0.12 * de), al = e ? 0.35 * Math.pow(0.6, e) * (1 - de * 0.5) : 1;
      if (e && de <= 0) continue;
      g.save(); g.translate(W / 2 + Math.sin(t * 53 + e) * 8, 470 + Math.cos(t * 47 + e) * 6); g.rotate(-0.05); g.scale(sc, sc * 1.25);
      g.globalAlpha = al; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (!e) { g.lineWidth = 22; g.strokeStyle = C.ink; g.strokeText(word, 0, 0); }
      g.fillStyle = e ? '#FFD0A0' : C.cream; g.fillText(word, 0, 0); g.restore();
    }
    g.textAlign = 'center'; g.font = sans(84, 900); g.letterSpacing = '12px'; g.lineWidth = 12; g.strokeStyle = C.ink; g.lineJoin = 'round';
    g.strokeText('THE', W / 2, 270); g.fillStyle = C.red; g.fillText('THE', W / 2, 270);
    g.restore();
    if (lt < 0.15) flash(g, 0.7 * (1 - lt / 0.15));
  }, { trans: 'flash', grade: 'warm', noJump: true });
  cue(r0, 'boom', 1); cue(r0, 'hit', 0.9); cue(r0 + 0.05, 'cheer', 0.7); cue(r0 + 0.1, 'riser', 0.4); cue(r1 - 0.2, 'whoosh', 0.7);

  // 22.gxh5 — of course they took it
  const tookT = w('take', 'took');
  const take = new Moves(B, G, [{ k: 43, t0: tookT - 0.35, color: C.red, label: '22.gxh5', labelColor: C.red }]);
  shot(s('take') - 0.05, (g, lt, t, sh) => {
    atBoard(g, lt, t, [[0, { yaw: -0.7, pitch: 0.62, dist: 9.5, cy: H * 0.5, target: [6.4, 0.6, 4.6] }], [len(sh), { yaw: -0.55, pitch: 0.66, dist: 8.2 }]], {
      e: { ...EXPR.smug, look: [0.5, 0.6], lid: 0.5 }, pieces: () => take.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: take.bump(t), ez: lin });
    crowd(g, t, { y0: H * 0.82, rows: 6, phones: 0.25, cheer: seg(t, tookT, tookT + 0.2), tint: '#E0603F' });
  }, { trans: 'whip', grade: 'warm' });
  take.cues(cue); cue(tookT, 'cheer', 0.5);

  // 22...Qg4+ 23.Kf1 Nf4! — mate on g2 is coming — 24.Qxf4 exf4: the World gives up its queen
  const qT = w('queen', 'Queen'), nT = w('queen', 'Knight'), mT = w('queen', 'Mate'), giveT = w('queen', 'give'), qEnd = T.w('queen', -1).s;
  const qMv = new Moves(B, G, [{ k: 44, t0: qT - 0.3, color: C.red, label: 'Qg4+', labelColor: C.red }, { k: 45, t0: qT + 0.35, dur: 0.3 }, { k: 46, t0: nT - 0.25, color: TEAL, label: 'Nf4!', labelColor: TEAL },
    { k: 47, t0: giveT - 0.4, color: C.red, label: 'Qxf4', labelColor: C.red }, { k: 48, t0: qEnd - 0.4, color: C.gold, label: 'exf4', labelColor: C.gold }]);
  shot(s('queen') - 0.05, (g, lt, t, sh) => {
    const m = qMv.current(t);
    atBoard(g, lt, t, [[0, { yaw: -0.25, pitch: 0.8, dist: 10.5, cy: H * 0.54, target: [5.5, 0, 3.2] }], [mT - (t - lt), { yaw: -0.4, pitch: 0.85, dist: 9 }], [len(sh), { yaw: -0.15, pitch: 0.8, dist: 8.5, target: [5.4, 0, 3.4] }]], {
      e: exprAt([[0, { ...EXPR.focus, look: [0.3, 0.8] }], [mT - (t - lt), { ...EXPR.triumph, look: [0.3, 0.6] }]], lt),
      pieces: () => qMv.draw(g, t, { labels: 'custom', dof: 1.1 }), bump: qMv.bump(t), reach: m && m.k % 2 === 0 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.6 } : null, ez: ease.inOut });
    if (t > mT - 0.1 && t < giveT - 0.4) { B.laser(g, 'g4', 'g2', C.red, 0.95, 0.5, seg(t, mT - 0.1, mT + 0.2)); B.highlight(g, 'g2', C.red, 0.45 + 0.2 * Math.sin(t * 10)); B.label(g, 'g2', 'MATE?', C.red, seg(t, mT, mT + 0.15), 1.6); }
    badge(g, 'QUEEN GONE', W / 2, 300, { color: C.gold, size: 50, a: seg(t, qEnd, qEnd + 0.1), scale: pop(t, qEnd) });
  }, { trans: 'zoom', grade: 'warm' });
  qMv.cues(cue); cue(mT, 'alarm', 0.5); cue(qEnd, 'boom', 0.8);

  // the king hunt: g1 → f1 → e2 → d2 → c2 → b2 → a3 → a4
  const huntA = s('hunt') + 0.15, huntB = w('hunt', 'board') + 0.1, lionT = w('hunt', 'lion');
  const HUNT = [];
  for (let k = 65; k <= 81; k++) HUNT.push({ k, t0: huntA + (k - 65) * (huntB - huntA) / 17, dur: 0.16, color: k % 2 ? C.red : C.gold });
  const hunt = new Moves(B, G, HUNT);
  const PATH = ['g1', 'f1', 'e2', 'd2', 'c2', 'b2', 'a3', 'a4'], KT = [huntA - 0.2, ...[65, 69, 71, 73, 75, 77, 81].map(k => HUNT[k - 65].t0 + 0.16)];
  shot(s('hunt') - 0.05, (g, lt, t, sh) => {
    atBoard(g, lt, t, [[0, { yaw: 0, pitch: 1.2, dist: 12.5, cy: H * 0.52, target: [4, 0, 3.6] }], [len(sh), { yaw: -0.2, pitch: 1.15, dist: 10.5, target: [3, 0, 2.6] }]], {
      who: null, pieces: () => {
        // trail of the hunted king
        const n = PATH.filter((_, i) => t >= KT[i]).length;
        g.save(); g.strokeStyle = rgba(C.gold, 0.9); g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([2, 22]);
        g.beginPath(); PATH.slice(0, n).forEach((q, i) => { const [x, z] = sqXZ(q), p = at(x, 0.03, z); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }); g.stroke(); g.restore();
        PATH.slice(0, n).forEach(q => B.highlight(g, q, C.red, 0.28, false));
        hunt.draw(g, t, { labels: false, dof: 0.8, fx: false });
      }, ez: lin });
    const a = seg(t, lionT - 0.1, lionT + 0.15);
    if (a > 0) {
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(14,10,6,0.82)'; g.fillRect(0, 210, W, 250); g.restore();
      g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = serif(60, 700); g.fillStyle = C.cream; g.fillText('“Like a lion chasing', W / 2, 310); g.fillText('its prey.”', W / 2, 382);
      g.font = sans(22, 800); g.letterSpacing = '6px'; g.fillStyle = C.gold; g.fillText('LEVY ROZMAN', W / 2, 432); g.restore();
    }
    counter(g, `MOVE ${Math.min(41, 33 + Math.floor(clamp((t - huntA) / (huntB - huntA)) * 8))}`, 'THE KING HUNT', { y: 1500, size: 96, a: seg(t, huntA, huntA + 0.1) * (1 - a), labelColor: C.red });
  }, { trans: 'whip', grade: 'night' });
  for (const m of HUNT) cue(m.t0 + 0.16, 'clack', 0.6);
  cue(lionT, 'sting', 0.5);

  // 41...Rxa2#
  const m41T = w('mate', '41'), takesT = w('mate', 'takes'), cmT = w('mate', 'Checkmate');
  const fin = new Moves(B, G, [{ k: 80, t0: s('mate') - 0.1, dur: 0.25, color: C.gold }, { k: 81, t0: s('mate') + 0.4, dur: 0.25 }, { k: 82, t0: takesT - 0.2, dur: 0.5, color: C.red, label: '41...Rxa2#', labelColor: C.red }]);
  shot(s('mate') - 0.05, (g, lt, t, sh) => {
    atBoard(g, lt, t, [[0, { yaw: -0.9, pitch: 0.7, dist: 10, cy: H * 0.54, target: [2, 0.4, 3] }], [takesT - (t - lt), { yaw: -0.75, pitch: 0.72, dist: 8 }], [len(sh), { yaw: -0.6, pitch: 0.8, dist: 6.6, target: [1, 0.4, 2.6] }]], {
      e: exprAt([[0, 'focus'], [cmT - (t - lt), { ...EXPR.triumph, nod: 0.6 }]], lt), pieces: () => fin.draw(g, t, { labels: 'custom', dof: 1 }), bump: fin.bump(t), ez: ease.inOut });
    counter(g, 'MOVE 41', null, { y: 330, size: 110, a: seg(t, m41T, m41T + 0.1) });
    stamp(g, 'CHECKMATE', W / 2, 560, t, cmT, { color: C.red, size: 120 });
    if (t > cmT) flash(g, 0.5 * (1 - seg(t, cmT, cmT + 0.25)));
  }, { trans: 'zoom', grade: 'warm' });
  fin.cues(cue); cue(m41T, 'tick', 0.7); cue(cmT, 'stamp', 1); cue(cmT, 'boom', 1);

  // ======================= THE END =======================
  const ytT = w('end', 'YouTuber'), pplT = w('end', '225,000'), gcT = w('end', 'GothamChess'), zeroT = w('end', 'zero');
  shot(s('end') - 0.08, (g, lt, t, sh) => {
    if (PH.wave) photo3d(g, PH.wave, lt, { from: { x: 0.5, y: 0.42, zoom: 1.0, focus: 0.5 }, to: { x: 0.5, y: 0.38, zoom: 1.15, dolly: 0.12, sx: -0.02 }, dur: len(sh) + 2, e: lin });
    g.save(); const sh2 = g.createLinearGradient(0, 0, 0, 760); sh2.addColorStop(0, 'rgba(8,6,4,0.82)'); sh2.addColorStop(0.75, 'rgba(8,6,4,0.55)'); sh2.addColorStop(1, 'rgba(8,6,4,0)'); g.fillStyle = sh2; g.fillRect(0, 0, W, 760); g.restore();
    const sc = seg(t, gcT - 0.1, gcT);
    g.save(); g.globalAlpha = 1 - sc;
    counter(g, '1', 'YOUTUBER', { y: 330, x: 270, size: 170, color: C.gold, a: seg(t, ytT - 0.1, ytT) });
    counter(g, '225,000', 'PEOPLE', { y: 330, x: 700, size: 120, a: seg(t, pplT - 0.1, pplT) });
    g.restore();
    if (sc > 0) {  // editorial scoreboard: two solid blocks
      g.save(); g.globalAlpha = sc;
      for (const [x, name, n, col, t0] of [[300, 'GOTHAMCHESS', '1', C.gold, gcT], [780, 'THE WORLD', '0', C.red, zeroT]]) {
        const k = pop(t, t0);
        g.save(); g.translate(x, 330); g.scale(k, k);
        g.fillStyle = col; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-190, -150, 380, 260); g.shadowColor = 'transparent';
        g.fillStyle = C.ink; g.textAlign = 'center'; g.font = sans(190, 900); g.fillText(t >= t0 ? n : '', 0, 50);
        g.font = sans(32, 900); g.letterSpacing = '4px'; g.fillText(name, 0, 96); g.restore();
      }
      g.restore();
    }
    credit(g, CREDIT, seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true });
  cue(ytT, 'hit', 0.6); cue(pplT, 'tick', 0.6); cue(gcT, 'boom', 0.8); cue(zeroT, 'stamp', 0.8); cue(zeroT, 'cheer', 0.5);

  // follow
  const folT = w('cta', 'Follow');
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.15, pitch: 0.14, dist: 9, cy: H * 0.5, target: [4, 3.2, 9.4] }], [len(sh), { yaw: 0.05, pitch: 0.12, dist: 7.8 }]], { t, e: lin });
    const E = room(g, B, ARENA, { t, blur: 3 });
    const hands = seated(g, B, 'levy', { ...EXPR.happy, nod: 0.5 }, t, { z: 9.4 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, piecesAt(G, 82), { focus: B.dist, dof: 1 }); hands();
    confetti(g, t, s('cta'), { n: 60 });
    badge(g, 'FOLLOW FOR MORE', W / 2, 330, { color: C.gold, size: 54, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
    credit(g, 'GAME: CHESS.COM VOTE CHESS · NOTES: NM DANE MATTSON (CHESS.COM)', seg(lt, 0.2, 0.4));
  }, { trans: 'whip', grade: 'gold' });
  cue(folT, 'pluck', 0.8); cue(folT, 'sparkle', 0.6);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: s('who') - 0.05, m: 'build' }, { t: s('vote') - 0.05, m: 'digital' }, { t: s('record') - 0.05, m: 'tension' }, { t: recT, m: 'hit' },
    { t: s('caro') - 0.05, m: 'intrigue' }, { t: s('attack') - 0.05, m: 'tension' }, { t: s('sac') - 0.05, m: 'drop' }, { t: s('take') - 0.05, m: 'inferno' },
    { t: s('hunt') - 0.05, m: 'clockwork' }, { t: cmT, m: 'hit' }, { t: s('end') - 0.08, m: 'victory' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
