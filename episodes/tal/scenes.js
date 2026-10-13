// Mikhail Tal — the last game. Shots timed to narration words; every scene lives in a 3D set,
// the map and the medical scan are flat inserts.
import { W, H, C, clamp, lerp, ease, seg, pulse, rgba, rng } from '../../engine/js/core.js';
import { bgBase, speedlines, rays, flash, target, xMark, glowText, confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, scoreboard, mono, serif } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { loadImage, photoCard } from '../../engine/js/photo.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, table, chair, picture, placeAt, bed, ivStand, monitor, chessClock, FLOOR_Y } from '../../engine/js/env.js';
import { burst, shockwave, glint, dust } from '../../engine/js/fx.js';

// the sacrifice lines are written with white to move; mirror them so Tal plays from the far side (black)
const mirrorSq = q => q && q[0] + (9 - +q[1]);
const mirror = plies => plies.map(p => ({ ...p, from: mirrorSq(p.from), to: mirrorSq(p.to), pieces: p.pieces.map(x => ({ ...x, sq: mirrorSq(x.sq), c: x.c === 'w' ? 'b' : 'w' })) }));
const KN = mirror(await fetch('../engine/data/tal_knight.json').then(r => r.json()));
const RK = mirror(await fetch('../engine/data/tal_rook.json').then(r => r.json()));
const QN = mirror(await fetch('../engine/data/tal_queen.json').then(r => r.json()));
const GOC = await fetch('../engine/data/game_of_century.json').then(r => r.json());
const map = await new DotMap().init();
const P = Object.fromEntries(await Promise.all(['match1960', 'kasparov1985', 'tal1988'].map(async k => [k, await loadImage(`../episodes/tal/photos/${k}.jpg`)])));

const B = new Board();
const FAR = [4, 3.1, 9.4], NEAR = [4, 3.1, -1.6], PI = Math.PI;
const SLAB = { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' };

// cigarette smoke curling up from a screen point
function smoke(g, x, y, s, t, a = 1) {
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(220,225,230,0.35)'; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.lineWidth = (6 - i) * s; g.beginPath();
    for (let k = 0; k <= 20; k++) { const u = k / 20, yy = y - u * 260 * s, xx = x + Math.sin(u * 7 + t * 2 + i) * 22 * s * u; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.stroke();
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
  const orbit = (h, dur, { yaw = [-0.3, 0.2], dist = [9, 8], pitch = [0.16, 0.12], cy = H * 0.42, side = 0, dy = 0 } = {}) =>
    [[0, { yaw: side + yaw[0], pitch: pitch[0], dist: dist[0], cy, target: [h[0], h[1] + dy, h[2]] }], [dur, { yaw: side + yaw[1], pitch: pitch[1], dist: dist[1] }]];
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = mono(18, 700); g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.6)'; g.fillText(text, W - 28, H - 36); g.restore(); };

  // Tal at the board (far side), an opponent on the near side; pieces may be a list or a draw callback
  const match = (g, lt, t, keys, { style = 'hall', blur = 0, over = null, who = 'tal', e = 'focus', opp = null, oppE = 'focus', reach = null, pieces = null, dof = 1.4, bump = 0, shake = 1, ease: ez = ease.inOut, clock = null, smokeA = 0, before = null } = {}) => {
    rig(B, lt, keys, { t, bump, shake, e: ez });
    const env = room(g, B, style, { t, blur, over });
    if (before) before(g, env);
    const ht = seated(g, B, who, e, t, { z: 9.4, reach, side: -1 });
    const ho = opp ? seated(g, B, opp, oppE, t, { z: -1.6, face: 1 }) : () => {};
    table(g, B, env, { x1: clock ? 11.2 : 8.4 });
    B.drawSlab(g, SLAB);
    if (clock) chessClock(g, B, 10.1, -0.35, 4, clock);
    if (typeof pieces === 'function') pieces(); else if (pieces) B.drawPieces(g, pieces, { focus: B.dist, dof });
    // hands and back-view silhouettes last, the player nearer to the camera on top
    if (B.toCam(4, 3.1, 9.4)[2] > B.toCam(4, 3.1, -1.6)[2]) { ht(); ho(); } else { ho(); ht(); }
    if (smokeA > 0 && B.toCam(4.9, 2.4, 9.2)[2] > 1) { const p = B.project(4.9, 2.4, 9.2); smoke(g, p.x, p.y, p.s / 100, t, smokeA); }
    return env;
  };
  // hospital room: bed, IV drip, heart monitor; the patient (or nobody) sits up in bed
  const ward = (g, lt, t, keys, { blur = 0, over = null, who = null, e = 'tired', alpha = 1, blanket = 1, sway = 0, flat = false, board = false, reach = null, pieces = null, ease: ez = ease.inOut, bpm = 72, kingOnPillow = false } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    const env = room(g, B, 'hospital', { t, blur, over });
    monitor(g, B, 8.8, 3.2, 11.2, t, { flat, bpm });
    ivStand(g, B, 0.6, 10.8, { sway, t });
    bed(g, B, { part: 'back' });
    if (kingOnPillow) B.drawPieces(g, [{ t: 'k', c: 'b', x: 4.2, y: -0.45, z: 11.0, rot: 1.35, sharp: true }], { focus: B.dist, dof: 1 });
    let hands = () => {};
    if (who) hands = seated(g, B, who, e, t, { z: 9.6, alpha, reach, side: -1 });
    bed(g, B, { part: 'front', blanket });
    if (board) { table(g, B, env); B.drawSlab(g, SLAB); hands(); if (pieces) B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 }); }
    return env;
  };

  // S1a — an empty hospital bed; the black king left on the pillow
  shot(0, (g, lt, t, sh) => {
    ward(g, lt, t, [[0, { yaw: -0.55, pitch: 0.32, dist: 13, cy: H * 0.5, target: [4, 0, 9.5] }], [len(sh), { yaw: -0.15, pitch: 0.24, dist: 9.5 }]], { blanket: 0.35, sway: Math.sin(t * 2.2) * 0.12, kingOnPillow: true, flat: true, ease: lin });
    const c = B.project(4.2, -0.2, 11);
    glint(g, c.x, c.y, t, w('hook1', 'escaped') + 0.05, { r: 160 });
    badge(g, 'PATIENT MISSING', W / 2, 300, { color: C.red, size: 40, a: seg(t, w('hook1', 'escaped'), w('hook1', 'escaped') + 0.15), scale: lerp(1.5, 1, seg(t, w('hook1', 'escaped'), w('hook1', 'escaped') + 0.25, ease.back)) });
  }, { vig: 0.65 });
  cue(0.05, 'flatline', 0.25); cue(w('hook1', 'escaped'), 'boom', 0.9); cue(w('hook1', 'hospital'), 'creak', 0.5);
  // S1b — …to play chess: the old man at a tournament board, fast push-in
  shot(w('hook1', 'play') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [0.4, 0.15], dist: [9.5, 7.2], pitch: [0.18, 0.12], cy: H * 0.42 }), { who: 'talOld', e: { ...EXPR.focus, look: [0, 1] }, blur: 5, pieces: piecesAt(GOC, 30), dof: 2, ease: ease.out });
  }, { trans: 'whip' });
  // S2 — against the world champion: over Tal's shoulder at Kasparov
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [0.3, 0.08], dist: [13.5, 12], pitch: [0.14, 0.12], cy: H * 0.44 }), { who: 'talOld', opp: 'kasparov', oppE: { ...EXPR.smug, look: [0, 1] }, blur: 3, pieces: piecesAt(GOC, 30), dof: 1.6 });
    badge(g, 'WORLD CHAMPION', W / 2, 300, { color: C.gold, size: 44, a: seg(t, w('hook2', 'world'), w('hook2', 'world') + 0.15), scale: lerp(1.5, 1, seg(t, w('hook2', 'world'), w('hook2', 'world') + 0.25, ease.back)) });
  }, { trans: 'whip' });
  cue(w('hook2', 'world'), 'hit', 0.8);
  // S3 — a month later he was dead: the empty chair, the flatline
  const deadT = w('hook3', 'dead');
  shot(s('hook3') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.1, pitch: 0.3, dist: 14, cy: H * 0.52, target: [4, 1, 7] }], [len(sh), { yaw: -0.05, pitch: 0.26, dist: 12 }]], { t, e: lin });
    const env = room(g, B, 'dark', { t, over: { light: '#CFE6FF', lightA: 0.12 } });
    chair(g, B, 4, 10.6, { face: -1, color: '#2A3036' });
    table(g, B, env, { x1: 11.2 }); B.drawSlab(g, SLAB);
    chessClock(g, B, 10.1, -0.35, 4, { tl: 12, tr: 95 });
    const top = B.project(4, 12, 9.5); spotlight(g, top.x, B.project(4, 0, 9.5).y - 200, 520, '#ffffff', 0.12);
    const a = seg(t, deadT - 0.1, deadT + 0.1);
    if (a > 0) {  // flatline across the frame
      g.save(); g.globalAlpha = a; g.strokeStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 18; g.lineWidth = 6;
      const x1 = lerp(0, W, seg(t, deadT, deadT + 0.6));
      g.beginPath(); g.moveTo(0, 420); g.lineTo(x1, 420); g.stroke(); g.restore();
    }
    counter(g, '1 MONTH', 'LATER', { y: 330, size: 110, color: '#FFE9E4', glow: C.red, labelColor: C.red, a: seg(t, w('hook3', 'month') - 0.1, w('hook3', 'month') + 0.15) });
  }, { trans: 'fade', transDur: 0.3, vig: 0.85 });
  cue(deadT, 'flatline', 0.9); cue(w('hook3', 'month'), 'clock', 0.5);

  // S4 — Riga, 1936
  shot(s('riga') - 0.1, (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.2, ease.inOut);
    map.view({ lon: lerp(10, 24, u), lat: lerp(52, 57, u), zoom: lerp(10, 26, u), cy: H * 0.47 });
    map.draw(g, { spacing: 14, color: id => id === ISO.LVA ? rgba(C.gold, 0.4 + 0.55 * seg(lt, 0.4, 0.8)) : id === ISO.RUS ? '#7A3A36' : null });
    map.pin(g, 'Riga', { color: C.gold, a: seg(lt, 0.4, 0.7), pulse: (lt * 0.8) % 1 });
    placeStamp(g, lt, 'Riga', '1936', { y: 160, t0: 0.05 });
  }, { trans: 'leak' });
  cue(w('riga', '1936'), 'boom', 0.7);

  // S5 — Mikhail Tal: a young man who plays like nobody before him
  shot(s('tal') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [-0.5, 0.3], dist: [9.5, 8.2], pitch: [0.2, 0.14], cy: H * 0.42 }), { style: 'wood', who: 'tal', e: exprAt([[0, { ...EXPR.focus, look: [0, 1] }], [1.4, { ...EXPR.smug, browTilt: 0.5 }]], lt), blur: 5, pieces: piecesAt(KN, 8), dof: 2, ease: lin });
    nameTitle(g, lt, 'Mikhail Tal', 'RIGA · LATVIA', { y: 210, t0: 0.05, subColor: C.gold });
  }, { trans: 'whip' });

  // S6 — he throws pieces away: a knight, a rook, then his queen (bows on the gifts, shards when taken)
  const giftT = [w('gifts', 'knight'), w('gifts', 'rook'), w('gifts', 'queen')];
  const sacKN = new Moves(B, KN, [{ k: 11, t0: giftT[0] - 0.45, color: C.gold, label: 'GIFT', labelColor: C.gold }, { k: 12, t0: giftT[0] + 0.35, color: C.red }]);
  const sacRK = new Moves(B, RK, [{ k: 1, t0: giftT[1] - 0.45, color: C.gold, label: 'GIFT', labelColor: C.gold }, { k: 2, t0: giftT[1] + 0.35, color: C.red }]);
  const mateQ = w('gifts', 'queen') + 1.2;
  const sacQN = new Moves(B, QN, [{ k: 1, t0: giftT[2] - 0.45, color: C.gold, label: 'GIFT', labelColor: C.gold }, { k: 2, t0: giftT[2] + 0.35, color: C.red }, { k: 3, t0: mateQ - 0.42, color: C.lime, label: 'CHECKMATE', labelColor: C.lime }]);
  [sacKN, sacRK, sacQN].forEach(m => m.cues(cue));
  const bowOn = (mv, plies, t) => { const m = mv.current(t); return m && m.label === 'GIFT' && t < m.land + 0.7 ? { [m.mover?.id]: { bow: 1, halo: C.gold, haloA: 0.8 } } : {}; };
  const sacShot = (a0, mv, plies, keys, { e = 'smug', opp = null } = {}) => shot(a0, (g, lt, t, sh) => {
    const m = mv.current(t);
    match(g, lt, t, keys(sh), { style: 'wood', who: 'tal', e, opp, oppE: 'worried', bump: mv.bump(t) * 1.4, reach: m && m.k % 2 === 1 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.75 } : null,
      pieces: () => mv.draw(g, t, { dof: 1.2, labels: 'custom', opts: bowOn(mv, plies, t) }) });
  }, { trans: 'whip' });
  shot(s('gifts') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [0.35, 0.1], dist: [7.6, 6.4], pitch: [0.1, 0.08], cy: H * 0.44 }), { style: 'wood', who: 'tal', e: { ...EXPR.happy, nod: 0.4 }, blur: 6, pieces: piecesAt(KN, 10).map(p => ({ ...p, glow: p.c === 'b' && p.t !== 'p' && p.t !== 'k' ? C.gold : null })), dof: 2.2, ease: ease.out });
  }, { trans: 'zoom' });
  sacShot(giftT[0] - 0.55, sacKN, KN, sh => [[0, { yaw: -0.6, pitch: 0.55, dist: 8.5, cy: H * 0.5, target: [5.5, 0, 2.5] }], [len(sh), { yaw: -0.4, pitch: 0.6, dist: 7.4 }]]);
  sacShot(giftT[1] - 0.55, sacRK, RK, sh => [[0, { yaw: 0.6, pitch: 0.6, dist: 8.5, cy: H * 0.5, target: [3.5, 0, 3.5] }], [len(sh), { yaw: 0.35, pitch: 0.65, dist: 7.6 }]]);
  sacShot(giftT[2] - 0.55, sacQN, QN, sh => [[0, { yaw: -0.3, pitch: 0.75, dist: 9, cy: H * 0.5, target: [6, 0, 1.5] }], [len(sh), { yaw: 0.0, pitch: 0.82, dist: 7.2 }]]);
  giftT.forEach(t0 => cue(t0, 'sparkle', 0.5)); cue(mateQ, 'boom', 1); cue(mateQ, 'hit', 0.8);

  // S7 — "two kinds of sacrifices: correct ones… and mine." (smirk, smoke)
  const corT = w('joke', 'Correct'), mineT = w('joke', 'mine');
  shot(Math.max(s('joke') - 0.05, mateQ + 0.6), (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [-0.35, 0.1], dist: [8.4, 7], pitch: [0.14, 0.1], cy: H * 0.44 }), { style: 'wood', who: 'tal', e: exprAt([[0, { ...EXPR.neutral, look: [0.3, 0.3] }], [mineT - (t - lt), { ...EXPR.smug, browTilt: 0.8, nod: 0.5 }]], lt), blur: 6, pieces: piecesAt(QN, 3), dof: 2.2 });
    badge(g, 'CORRECT ✓', W / 2 - 170, 330, { color: C.blue, size: 40, a: seg(t, corT, corT + 0.15) * (1 - 0.6 * seg(t, mineT, mineT + 0.2)), scale: lerp(1.4, 1, seg(t, corT, corT + 0.25, ease.back)) });
    badge(g, 'MINE ★', W / 2 + 190, 330, { color: C.lime, size: 52, a: seg(t, mineT, mineT + 0.15), scale: lerp(1.6, 1, seg(t, mineT, mineT + 0.25, ease.back)) });
  }, { trans: 'zoom' });
  cue(corT, 'tick', 0.7); cue(mineT, 'pluck', 0.9); cue(mineT, 'ting', 0.5);

  // S8 — the Magician from Riga: pieces float around him, sparkles
  shot(s('magician') - 0.05, (g, lt, t, sh) => {
    const lev = piecesAt(KN, 10).map((p, i) => ({ ...p, y: 0.4 + 0.5 * Math.sin(t * 2.4 + i) + 0.6 * seg(lt, 0, 0.6), rot: 0.15 * Math.sin(t * 1.7 + i), glow: i % 4 === 0 ? C.gold : null }));
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [0.55, -0.35], dist: [10.5, 9], pitch: [0.18, 0.16], cy: H * 0.42 }), { style: 'gold', who: 'tal', e: { ...EXPR.smug, look: [0, -0.4], browTilt: 0.4 }, blur: 4, pieces: lev, dof: 1.6, ease: lin });
    const r = rng(5);
    for (let i = 0; i < 8; i++) glint(g, r() * W, 500 + r() * 900, t, s('magician') + i * 0.18, { r: 90 + r() * 80, color: C.gold, life: 0.5 });
    nameTitle(g, lt, 'The Magician', 'FROM RIGA', { y: 210, t0: w('magician', 'Magician') - s('magician'), subColor: C.gold, size: 70 });
  }, { trans: 'flash' });
  cue(w('magician', 'Magician'), 'shimmer', 0.9);

  // S9a — 1960: the title match against Botvinnik (real photo from the match)
  const champT = w('champ', 'champion');
  shot(s('champ') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, [[0, { yaw: -0.7, pitch: 0.35, dist: 13, cy: H * 0.5, target: [4, 1, 4] }], [len(sh), { yaw: -0.35, pitch: 0.3, dist: 11.5 }]], { style: 'hall', who: 'tal', e: 'focus', opp: 'botvinnik', oppE: 'focus', pieces: piecesAt(GOC, 40), dof: 1.4 });
    placeStamp(g, lt, 'Moscow', '1960', { y: 160, t0: 0.05 });
    photoCard(g, P.match1960, lt, 0.25, { x: 700, y: 560, w: 520, aspect: 0.67, rot: 0.04, caption: 'BOTVINNIK — TAL · 1960', credit: 'Glavarkhiv Moskvy · CC BY 4.0', fx: 0.5, fy: 0.5, zoom: [1.0, 1.06], dur: 2.5 });
  }, { trans: 'leak' });
  cue(w('champ', '1960'), 'boom', 0.8); cue(s('champ') + 0.25, 'shutter', 0.6);
  // S9b — world champion at 23
  shot(champT - 0.1, (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [0.45, -0.1], dist: [9.6, 8.8], pitch: [0.18, 0.14], cy: H * 0.46 }), { style: 'gold', who: 'tal', e: { ...EXPR.triumph, nod: 0.7 }, blur: 4, pieces: piecesAt(GOC, 40), dof: 1.8, ease: lin });
    counter(g, '12½ – 8½', null, { y: 300, size: 110, color: '#FFF4D6', glow: C.gold });
    badge(g, 'YOUNGEST WORLD CHAMPION', W / 2, 410, { color: C.gold, size: 40, sub: 'AGE 23 · 1960', a: seg(lt, 0.1, 0.3), scale: lerp(1.5, 1, seg(lt, 0.1, 0.35, ease.back)) });
    confetti(g, t, champT);
  }, { trans: 'flash' });
  cue(champT, 'boom', 1.1); cue(champT, 'cheer', 0.7); cue(champT + 0.05, 'confetti', 0.7);

  // S10 — but his kidneys are failing (medical scan insert)
  shot(s('kidneys') - 0.05, (g, lt, t) => {
    g.fillStyle = '#04100E'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(80,200,170,0.08)'; g.lineWidth = 2;
    for (let y = 0; y < H; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.save(); g.translate(W / 2, 980); g.strokeStyle = 'rgba(120,230,200,0.7)'; g.lineWidth = 5; g.shadowColor = '#5CFFC9'; g.shadowBlur = 16;
    g.beginPath(); g.arc(0, -520, 110, 0, 7); g.stroke();                                    // head
    g.beginPath(); g.moveTo(-60, -410); g.lineTo(-250, -330); g.lineTo(-300, 120); g.moveTo(60, -410); g.lineTo(250, -330); g.lineTo(300, 120); g.stroke();
    g.beginPath(); g.moveTo(-200, -330); g.lineTo(-180, 300); g.moveTo(200, -330); g.lineTo(180, 300); g.stroke();
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-150, -250 + i * 45); g.quadraticCurveTo(0, -230 + i * 45, 150, -250 + i * 45); g.stroke(); }  // ribs
    const pz = 0.5 + 0.5 * Math.sin(t * 6);
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * 95, 40); g.rotate(sd * 0.25);
      g.fillStyle = rgba(C.red, 0.45 + 0.4 * pz); g.shadowColor = C.red; g.shadowBlur = 30 + 20 * pz;
      g.beginPath(); g.ellipse(0, 0, 48, 80, 0, 0, 7); g.fill(); g.restore();
    }
    g.restore();
    badge(g, 'KIDNEY FAILURE', W / 2, 330, { color: C.red, size: 48, a: seg(t, w('kidneys', 'kidneys'), w('kidneys', 'kidneys') + 0.15), scale: lerp(1.5, 1, seg(t, w('kidneys', 'kidneys'), w('kidneys', 'kidneys') + 0.25, ease.back)) });
  }, { trans: 'zoom', vig: 0.5 });
  cue(w('kidneys', 'kidneys'), 'heartbeat', 0.9); cue(w('kidneys', 'failing'), 'sting', 0.6);

  // S11 — hospital after hospital (two quick rooms) … he keeps playing on a tray table
  const h2T = w('hospitals', 'hospital'), playT = w('hospitals', 'playing');
  shot(s('hospitals') - 0.05, (g, lt, t, sh) => {
    ward(g, lt, t, [[0, { yaw: 0.6, pitch: 0.3, dist: 14, cy: H * 0.5, target: [4, 1, 9.5] }], [len(sh), { yaw: 0.4, pitch: 0.28, dist: 12.5 }]], { who: 'tal', e: { ...EXPR.tired }, bpm: 80 });
    badge(g, 'HOSPITAL', W / 2, 300, { color: C.red, size: 40, a: seg(lt, 0, 0.12) });
  }, { trans: 'whip' });
  shot(h2T - 0.05, (g, lt, t, sh) => {
    ward(g, lt, t, [[0, { yaw: -0.65, pitch: 0.36, dist: 13.5, cy: H * 0.5, target: [4, 1, 9.5] }], [len(sh), { yaw: -0.45, pitch: 0.3, dist: 12 }]], { who: 'tal', e: { ...EXPR.tired, look: [0, 0.6] }, over: { light: '#FFE2C0', lightA: 0.3 }, bpm: 84 });
    badge(g, 'HOSPITAL', W / 2, 300, { color: C.red, size: 40, a: seg(lt, 0, 0.12) });
  }, { trans: 'whip', whipDir: -1 });
  shot(w('hospitals', 'He') - 0.05, (g, lt, t, sh) => {
    const u = seg(t, playT - 0.3, playT + 0.5);
    ward(g, lt, t, orbit([4, 3.1, 9.6], len(sh), { yaw: [-0.3, 0.15], dist: [10, 8.6], pitch: [0.24, 0.2], cy: H * 0.42 }), { who: 'tal', e: exprAt([[0, 'tired'], [playT - (t - lt), { ...EXPR.happy, look: [0, 1] }]], lt), board: true, blur: 4, pieces: piecesAt(KN, 8), reach: u > 0 && u < 1 ? { sq: 'e5', u } : null });
  }, { trans: 'zoom' });
  cue(s('hospitals'), 'beep', 0.6); cue(s('hospitals') + 0.8, 'beep', 0.6); cue(h2T, 'beep', 0.6); cue(playT, 'clack', 0.9);

  // S12 — 1992, Moscow: night ward, the old man, the monitor
  shot(s('y1992') - 0.05, (g, lt, t, sh) => {
    ward(g, lt, t, orbit([4, 3.1, 9.6], len(sh), { yaw: [0.4, 0.1], dist: [11.5, 9.5], pitch: [0.26, 0.2], cy: H * 0.44 }), { who: 'talOld', e: { ...EXPR.tired, lid: 0.7 }, over: { light: '#7FA8FF', lightA: 0.15 }, bpm: 54 });
    placeStamp(g, lt, 'Moscow', '1992', { y: 160, t0: 0.05 });
  }, { trans: 'fade', transDur: 0.35, vig: 0.8 });
  for (let k = 0; k < 4; k++) cue(s('y1992') + 0.2 + k * 1.1, 'beep', 0.5);
  cue(w('y1992', 'dying'), 'heartbeat', 0.7);

  // S13 — so he sneaks out: the bed is empty, the drip still swinging
  const sneakT = w('sneak', 'sneaks');
  shot(s('sneak') - 0.05, (g, lt, t, sh) => {
    const gone = seg(t, sneakT - 0.1, sneakT + 0.4);
    ward(g, lt, t, [[0, { yaw: -0.2, pitch: 0.24, dist: 11, cy: H * 0.5, target: [4, 0.6, 9.5] }], [len(sh), { yaw: -0.7, pitch: 0.28, dist: 12 }]], { who: 'talOld', e: { ...EXPR.smug, browTilt: 0.6 }, alpha: 1 - gone, blanket: lerp(1, 0.3, gone), sway: Math.sin(t * 3) * 0.2 * gone, flat: gone > 0.5, over: { light: '#7FA8FF', lightA: 0.15 }, ease: lin });
    if (gone > 0) { const c = B.project(4, 2, 9.6); dust(g, c.x, c.y + 120, t, sneakT + 0.1, { size: 40, spread: 200, n: 12, color: '#DDE6EA' }); }
  }, { trans: 'whip' });
  cue(sneakT, 'whoosh', 0.8); cue(sneakT + 0.1, 'poof', 0.5); cue(sneakT + 0.3, 'flatline', 0.15);
  // S14 — to play a blitz tournament: clocks slam in a hall
  shot(s('blitz') - 0.05, (g, lt, t, sh) => {
    const press = Math.floor(t * 4) % 2 ? 1 : -1;
    match(g, lt, t, [[0, { yaw: -0.85, pitch: 0.3, dist: 9.5, cy: H * 0.5, target: [8.5, 0.5, 4] }], [len(sh), { yaw: -0.55, pitch: 0.26, dist: 8 }]], { who: 'talOld', e: 'happy', clock: { tl: 300 - t * 7, tr: 300 - t * 6, press }, pieces: piecesAt(GOC, 20), dof: 1.4, ease: lin });
    placeStamp(g, lt, 'Moscow Blitz', 'May 1992', { y: 160, t0: 0.05 });
    badge(g, 'BLITZ', W / 2, 300, { color: C.gold, size: 56, a: seg(t, w('blitz', 'blitz'), w('blitz', 'blitz') + 0.15), scale: lerp(1.6, 1, seg(t, w('blitz', 'blitz'), w('blitz', 'blitz') + 0.25, ease.back)) });
  }, { trans: 'whip' });
  for (let k = 0; k < 6; k++) cue(s('blitz') + k * 0.25, 'clack', 0.55);

  // S15 — across the board: Garry Kasparov (over Tal's shoulder; the real photo)
  shot(s('kasparov') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [-0.25, 0.05], dist: [12.5, 11], pitch: [0.14, 0.12], cy: H * 0.46 }), { who: 'talOld', opp: 'kasparov', oppE: exprAt([[0, 'focus'], [1.2, { ...EXPR.smug }]], lt), clock: { tl: 160, tr: 170 }, blur: 3, pieces: piecesAt(GOC, 40), dof: 1.6 });
    photoCard(g, P.kasparov1985, lt, 0.3, { x: 820, y: 560, w: 330, aspect: 0.9, rot: 0.06, from: 'right', caption: 'KASPAROV · 1985', credit: 'Anefo / Nationaal Archief · CC0', fx: 0.5, fy: 0.35, zoom: [1.15, 1.22], dur: 2.5 });
    nameTitle(g, lt, 'Garry Kasparov', 'WORLD CHAMPION', { y: 210, t0: 0.05, subColor: C.blue });
  }, { trans: 'whip' });
  cue(w('kasparov', 'Garry'), 'boom', 0.8); cue(s('kasparov') + 0.3, 'shutter', 0.5);

  // S16 — the Magician attacks: a blitz of moves, sparks, clock presses
  const atkA = s('attack') - 0.05, atkB = w('flag', 'defends') - 0.1;
  shot(atkA, (g, lt, t, sh) => {
    const x = 40 + clamp((t - atkA) / (atkB - atkA + 1.2)) * 30, k = Math.floor(x) + 1, u = x % 1;
    const press = k % 2 ? 1 : -1;
    match(g, lt, t, [[0, { yaw: 0.9, pitch: 0.7, dist: 10, cy: H * 0.5, target: [5, 0, 4] }], [len(sh), { yaw: 0.4, pitch: 0.75, dist: 8.6 }]], { who: 'talOld', e: { ...EXPR.happy, look: [0, 1] }, opp: 'kasparov', oppE: 'worried', clock: { tl: 60 - t * 3, tr: 30 - t * 3, press },
      pieces: piecesAt(GOC, k, clamp(u * 1.6), { arc: 0.5, keepCaptured: false }).map(p => ({ ...p, glow: p.c === 'b' && (k % 2 === 0) && u < 0.6 ? C.gold : null })), dof: 1.2, ease: lin, shake: 1.6, reach: k % 2 === 0 ? { sq: GOC[k].to, u: u } : null });
    speedlines(g, W / 2, H * 0.45, t, { a: 0.3, color: '#FFE9C8' });
    const c = B.project(5, 0.5, 4); burst(g, c.x, c.y, t, atkA + Math.floor((t - atkA) * 3) / 3, { n: 10, color: C.gold, speed: 500, size: 5, seed: k });
  }, { trans: 'zoom' });
  for (let k = 0; k < 8; k++) cue(atkA + 0.1 + k * 0.32, 'clack', 0.6);
  // S17a — Kasparov defends…
  const flagT = w('flag', 'time');
  shot(atkB, (g, lt, t, sh) => {
    match(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [0.3, 0.1], dist: [8.5, 7.4], pitch: [0.16, 0.12], cy: H * 0.44 }), { who: 'talOld', opp: 'kasparov', oppE: { ...EXPR.angry, look: [0, 1], shake: 0.2 }, blur: 5, pieces: piecesAt(GOC, 70), dof: 2, ease: ease.out });
    badge(g, 'DEFENDING', W / 2, 300, { color: C.blue, size: 40, a: seg(lt, 0.1, 0.25) });
  }, { trans: 'whip' });
  // S17b — …and runs out of time: the flag falls
  shot(w('flag', 'runs') - 0.1, (g, lt, t, sh) => {
    const fl = seg(t, flagT - 0.1, flagT + 0.35, ease.in);
    match(g, lt, t, [[0, { yaw: -0.25, pitch: 0.14, dist: 4.4, cy: H * 0.5, target: [10.1, 0.4, 4] }], [len(sh), { yaw: -0.1, pitch: 0.12, dist: 3.6 }]], { who: 'talOld', opp: 'kasparov', clock: { tl: 41, tr: Math.max(0, 3 - (t - (flagT - 3))), flagR: fl }, blur: 6, pieces: piecesAt(GOC, 70), dof: 2.5, ease: ease.out });
    stamp(g, 'TIME!', W / 2, 360, lt, flagT + 0.1 - (w('flag', 'runs') - 0.1), { size: 110, sub: 'KASPAROV LOSES ON TIME' });
  }, { trans: 'zoom' });
  cue(w('flag', 'runs'), 'clock', 0.6); cue(flagT + 0.1, 'stamp', 1); cue(flagT + 0.1, 'boom', 0.8);

  // S18 — Tal wins
  const winT = w('wins', 'wins');
  shot(s('wins') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, orbit(FAR, len(sh), { yaw: [-0.4, 0.2], dist: [8.6, 7.6], pitch: [0.16, 0.12], cy: H * 0.44 }), { who: 'talOld', e: { ...EXPR.triumph, nod: 0.6 }, blur: 5, over: { light: C.lime, lightA: 0.35 }, pieces: piecesAt(GOC, 70), dof: 2 });
    badge(g, 'TAL WINS', W / 2, 320, { color: C.lime, size: 64, a: seg(t, winT, winT + 0.12), scale: lerp(1.7, 1, seg(t, winT, winT + 0.25, ease.back)) });
    shockwave(g, W / 2, 320, t, winT + 0.05, { r0: 80, r1: 460, color: C.lime, lw: 12, squash: 0.5 });
    flash(g, 0.4 * pulse(t, winT, 0.25), '#E6FFC8');
  }, { trans: 'flash' });
  cue(winT, 'boom', 1.1); cue(winT, 'hit', 0.8); cue(winT + 0.1, 'cheer', 0.5);

  // S19 — a month later he is gone: the empty chair, his photo on the wall
  const goneT = w('gone', 'gone');
  shot(s('gone') - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.35, pitch: 0.24, dist: 15, cy: H * 0.5, target: [4, 2.5, 9] }], [len(sh), { yaw: 0.1, pitch: 0.2, dist: 12.5 }]], { t, e: lin });
    const env = room(g, B, 'dark', { t, over: { light: '#FFE2B0', lightA: 0.16 } });
    picture(g, B, P.tal1988, [2.2, 9.8, 12.85], [5.8, 9.8, 12.85], [2.2, 5.4, 12.85], { tone: 'bw', fx: 0.6, fy: 0.3, border: '#2A2A2A' });
    chair(g, B, 4, 10.6, { face: -1, color: '#2A3036' });
    table(g, B, env, { x1: 11.2 }); B.drawSlab(g, SLAB);
    chessClock(g, B, 10.1, -0.35, 4, { tl: 0, tr: 0 });
    B.drawPieces(g, [{ t: 'k', c: 'b', x: 4.5, z: 7.5, rot: 1.4, y: 0.05 }], { focus: B.dist, dof: 1.2 });
    placeStamp(g, lt, 'June', '1992', { y: 160, t0: 0.05 });
    credit(g, 'PHOTO: ROB C. CROES / ANEFO, 1988 · CC0', seg(lt, 0.4, 0.8));
  }, { trans: 'fade', transDur: 0.45, vig: 0.8 });
  cue(goneT, 'flatline', 0.5); cue(goneT + 0.2, 'thud', 0.5);

  // S20 — he did not escape to live longer. He escaped to play.
  const playT2 = w('final', 'play');
  shot(s('final') - 0.05, (g, lt, t, sh) => {
    match(g, lt, t, [[0, { yaw: 0.2, pitch: 0.14, dist: 7, cy: H * 0.44, target: [4, 2.8, 9.4] }], [len(sh), { yaw: -0.4, pitch: 0.42, dist: 14 }]], { style: 'dark', over: { light: '#FFE2B0', lightA: 0.3 }, who: 'talOld', e: exprAt([[0, { ...EXPR.tired, look: [0, 1] }], [playT2 - (t - lt) - 0.4, { ...EXPR.happy, look: [0, 1] }]], lt), pieces: piecesAt(KN, 8), dof: 1.4 });
    const top = B.project(4, 12, 9.4); spotlight(g, top.x, B.project(4, 3, 9.4).y, 460, '#FFE9C0', 0.14);
    const a = seg(t, playT2 - 0.2, playT2 + 0.3, ease.out), sc = lerp(1.3, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 300); g.scale(sc, sc); g.translate(-W / 2, -300);
    glowText(g, 'MIKHAIL TAL', W / 2, 250, { font: serif(92, 800), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 20 });
    glowText(g, '1936 – 1992', W / 2, 318, { font: serif(36, 700), fill: C.gold, glow: 'rgba(0,0,0,0.9)', blur: 10, spacing: 6 });
    glowText(g, 'THE MAGICIAN FROM RIGA', W / 2, 376, { font: mono(28, 800), fill: C.lime, glow: 'rgba(0,0,0,0.9)', blur: 8, spacing: 6 });
    g.restore();
  }, { trans: 'fade', transDur: 0.3 });
  cue(playT2, 'shimmer', 0.8); cue(playT2, 'boom', 0.7);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);

  const music = [
    { t: 0, m: 'tension' }, { t: s('hook3') - 0.1, m: 'drop' }, { t: s('riga') - 0.1, m: 'intrigue' }, { t: s('gifts') - 0.05, m: 'build' }, { t: mateQ, m: 'hit' },
    { t: mateQ + 0.8, m: 'intrigue' }, { t: s('champ') - 0.05, m: 'tension' }, { t: champT - 0.3, m: 'drop' }, { t: champT, m: 'victory' },
    { t: s('kidneys') - 0.05, m: 'drop' }, { t: s('kidneys') + 0.3, m: 'elegy' }, { t: s('y1992') - 0.05, m: 'void' }, { t: s('sneak') - 0.05, m: 'build' },
    { t: s('kasparov') - 0.05, m: 'tension' }, { t: atkA, m: 'hit' }, { t: atkB, m: 'tension' }, { t: flagT - 0.2, m: 'drop' }, { t: winT, m: 'glory' },
    { t: s('gone') - 0.1, m: 'drop' }, { t: s('gone') + 0.3, m: 'elegy' }, { t: playT2 - 0.1, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  return { shots, cues, music, tvOff, duration: T.duration };
}
