// Move-effects test after the @chess.history short on Kramnik–Topalov (STYLE_BIBLE §8): 13-year-old Magnus Carlsen vs
// Garry Kasparov, Reykjavik Rapid, 18 March 2004, round 1 (1/2-1/2 in 52 moves; PGN from chessgames.com). The flurry
// 19...Bh2+ 20.Kh1 Nd6 21.Kxh2 Nxe4+ (a discovered check from c7 that also hits the bishop on f6) 22.Be5 (saves the
// bishop, blocks the check, hits the queen), 27.Nxc6 wins a pawn and hits the rook, the draw. Dark slate board on a
// curtained stage with a few warm lamps, as in the reference; the big move is 22.Be5.
import { W, H, C, clamp, lerp, ease, seg, rgba } from '../../engine/js/core.js';
import { piecesAt, sqXZ, Board } from '../../engine/js/board.js';
import { EXPR, exprAt } from '../../engine/js/characters.js';
import { badge, placeStamp, sans, score } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { room, table } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { shatterImage, burst } from '../../engine/js/fx.js';
import { sprite, spriteBox } from '../../engine/js/pieces.js';
import { HI, ledGlow, neon, pieceRing, spread, flashTint, speedLines, ticks, boardArrow, squareFrame, armsUp, handsOnHead, moveTag, targets, slideStreak } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it
const B = new Board();
const G = await fetch('../engine/data/carlsen_kasparov_2004.json').then(r => r.json());
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
const pos = k => G[k].pieces.map(p => ({ ...p, ...xz(p.sq) }));
const lin = x => x;
const label = k => `${Math.ceil(k / 2)}${k % 2 ? '.' : '...'}${G[k].san}`;

// ---------- the stage of the reference: a dark curtain, a few warm lamps out of focus ----------
const HALL = { base: '#06080A', wall: ['#1A1F24', '#15191E'], folds: true, valance: '#15191E', floor: ['#0C0F12', '#0A0C0F'], light: '#FFD9A0', lightA: 0.1, table: ['#20262C', '#14181C', '#0E1114'] };
const KV = (yaw = 0.12, dist = 8.6, pitch = 0.34, y = 2.3) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [4, y, 8.0] });                 // Kasparov behind the black pieces
const MV = (yaw = 0.12, dist = 8.6, pitch = 0.34, y = 2.2) => ({ yaw: Math.PI + yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [4, y, 0.0] });  // Magnus behind the white pieces
const SQ = (sq, yaw, dist = 5.4, pitch = 0.4, y = 0.8, cy = 0.5) => { const [x, z] = sqXZ(sq); return { yaw, pitch, dist, fov: 1500, cy: H * cy, target: [x, y, z] }; };
const TOP = (yaw = 0.25, dist = 15, pitch = 1.05) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, 0.4, 4] });

// moves on a timeline: [{k, t0, t1, e?, trail?}] sorted; the position at t (the moving piece slides, knights hop)
function board(t, run, base) {
  let k = base;
  for (const m of run) {
    if (t >= m.t1) { k = m.k; continue; }
    if (t >= m.t0) {
      const knight = G[m.k].pieces.find(p => p.sq === G[m.k].to)?.t === 'n';
      return piecesAt(G, m.k, (t - m.t0) / (m.t1 - m.t0), { arc: knight ? 0.9 : 0.14, e: m.e || ease.inOut, trail: !!m.trail });
    }
    break;
  }
  return pos(k);
}
// a fast-forward of plies a..b from T0, one every dt
const ff = (a, b, T0, dt, f = 0.7) => Array.from({ length: b - a + 1 }, (_, i) => ({ k: a + i, t0: T0 + i * dt, t1: T0 + i * dt + dt * f }));
// the piece a move captured, shattering from its square on the landing
function captured(g, k, t, land) {
  const dt = t - land; if (dt < 0 || dt > 0.9) return;
  const ids = new Set(G[k].pieces.map(p => p.id)), cap = G[k - 1].pieces.find(p => !ids.has(p.id)); if (!cap) return;
  const [x, z] = sqXZ(cap.sq), land0 = B.project(x, 0.02, z), mid = B.project(x, 0.6, z), sc = land0.s / 130, h = land0.s * 1.25, bx = spriteBox(h);
  shatterImage(g, sprite(cap.t, cap.c), land0.x - bx.w / 2, land0.y + bx.top, bx.w, bx.h, dt, { cols: 3, rows: 5, seed: k, power: 520 * sc, gravity: 2200 * sc, spin: 8, life: 0.85, oy: 0.55 });
  burst(g, mid.x, mid.y, t, land, { n: 16, color: cap.c === 'w' ? '#FFFFFF' : '#9FB0BA', speed: 900 * sc, size: 7 * sc, kind: 'dot', seed: k + 99 });
}
// the move label in the mover's colour above the landed piece, in the brilliant box (hifx moveTag)
function moveLabel(g, k, t, land, color, { y = 1.8, text = null, dx = 0 } = {}) {
  if (t < land) return;
  const [x, z] = sqXZ(G[k].to), p = B.project(x, y, z), fs = Math.round(clamp(p.s * 0.42, 24, 54)), txt = text || label(k);
  g.save(); g.font = `800 ${fs}px "JetBrains Mono"`; g.letterSpacing = '-1px'; const tw = g.measureText(txt).width; g.restore();
  moveTag(g, txt, clamp(p.x + dx, 80 + tw / 2, W - 80 - tw / 2), Math.min(p.y, 1200 - fs * 0.35), color, fs, clamp((t - land) / 0.12));  // inside the frame, above the captions
}

// one board scene: both players, the table, the slate board, effects under and over the pieces
function scene(g, lt, t, keys, pieces, { kE = 'focus', mE = 'focus', under = null, over = null, dof = 1.4, e = ease.inOut, kHands = 0, backs = false } = {}) {
  rig(B, lt, keys, { t, e });
  const E = room(g, B, HALL, { t, blur: 3 });
  bokeh(g, t, { n: 8, seed: 4, y0: 0.06, y1: 0.4, a: 0.2, size: [50, 120], colors: ['#FFD9A0', '#FFC27A'] });  // the warm lamps of the hall
  const kp = kHands > 0 && B.toCam(4, 3.1, 9.4)[2] > 0.8 && B.E[2] < 9.4 ? B.project(4, 3.1, 9.4) : null, ks = kp ? kp.s / 100 * 1.05 : 0;
  if (kp) armsUp(g, kp.x, kp.y, ks, kHands);
  const near = (z, y) => { if (B.toCam(4, y, z)[2] < 3.5) return true; const p = B.project(4, y, z); return p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60; };  // too close, or off the frame
  const hk = seated(g, B, 'kasparov', kE, t, { z: 9.4, alpha: (backs || B.E[2] < 9.4) && !near(9.4, 3.1) ? 1 : 0 }), hm = seated(g, B, 'magnus14', mE, t, { z: -1.4, face: 1, lift: 2.95, k: 0.95, alpha: (backs || B.E[2] > -1.4) && !near(-1.4, 2.95) ? 1 : 0 });
  if (kp) handsOnHead(g, kp.x, kp.y, ks, t, kHands);
  table(g, B, E); B.drawSlab(g, SLATE);
  if (under) under();
  B.drawPieces(g, pieces, { focus: B.dist, dof });
  hk(); hm();
  if (over) over();
  lowKey(g, { cy: H * 0.42, a: 0.32 });
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);
  const panel = (g, t, a = 1) => score(g, 'CARLSEN', 'KASPAROV', '13', '40', { label: 'AGE · REYKJAVIK 2004', a });
  const result = g => score(g, 'CARLSEN', 'KASPAROV', '½', '½', { label: 'DRAW · 52 MOVES' });

  // ======================= HOOK: a 13-year-old against the world number one =======================
  const yo = w('hook', 'thirteen-year-old'), agT = w('hook', 'against'), wnT = w('hook', 'world');
  shot(0, (g, lt, t, sh) => scene(g, lt, t, [[0, MV(0.16, 7.4, 0.3)], [len(sh), MV(0.06, 6.6, 0.3)]], pos(0), { mE: { ...EXPR.focus, look: [0, 0.6] } }),
    { noJump: true, hud: (g, lt, t) => panel(g, t) });
  shot(agT - 0.05, (g, lt, t, sh) => scene(g, lt, t, [[0, KV(-0.14, 7.6, 0.3)], [len(sh), KV(-0.05, 6.8, 0.3)]], pos(0), { kE: 'smug' }),
    { hud: (g, lt, t) => { panel(g, t); badge(g, 'WORLD NO. 1', W / 2, 420, { color: C.gold, size: 40, a: seg(t, wnT, wnT + 0.08), scale: lerp(1.4, 1, seg(t, wnT, wnT + 0.2, ease.back)) }); } });
  boom(wnT, 0.6);

  // ======================= WHO, WHERE: the opening in fast forward, seen from above =======================
  const magT = w('who', 'Magnus'), garT = w('who', 'Garry'), rekT = w('who', 'Reykjavik,');
  const OPEN = ff(1, 37, s('who') + 0.05, (w('a1', 'Kasparov') - 0.35 - s('who')) / 37);
  shot(s('who') - 0.08, (g, lt, t, sh) => {
    scene(g, lt, t, [[0, { ...TOP(0.55, 15.5, 0.95), cy: H * 0.56 }], [len(sh), { ...TOP(0.2, 13.5, 0.85), cy: H * 0.56 }]], board(t, OPEN, 0), { e: lin, kE: 'focus', mE: 'focus', backs: true,  // Magnus's back carries his tag
      over: () => {  // name tags over the players on their names
        for (const [x, y, z, name, col, t0] of [[4, 1.5, -1.4, 'CARLSEN', C.accent, magT], [4, 0.6, 9.4, 'KASPAROV', C.red, garT]]) {
          const p = B.project(x, y, z); if (p.z < 0.6 || t < t0) continue;
          badge(g, name, p.x, p.y, { color: col, size: 30, a: seg(t, t0, t0 + 0.1), scale: lerp(1.4, 1, seg(t, t0, t0 + 0.2, ease.back)) });
        }
      } });
  }, { noJump: true, hud: (g, lt, t) => { panel(g, t); placeStamp(g, lt, 'Reykjavik', '2004', { y: 420, x: 260, t0: rekT - (t - lt) }); } });  // the stamp beside Kasparov, under the panel
  OPEN.forEach((m, i) => { if (i % 6 === 0) cue(m.t1, 'piece', 0.14); });

  // ======================= KASPAROV STRIKES FIRST: 19...Bh2+ =======================
  const kasT = w('a1', 'Kasparov'), bisT = w('a1', 'Bishop.'), chkT = w('a1', 'Check.');
  const firT = w('a1', 'first.');
  const BH2 = { k: 38, t0: bisT - 0.02, t1: chkT, e: ease.inOut };  // slowed down: half a second over four squares
  shot(kasT - 0.08, (g, lt, t, sh) => scene(g, lt, t, [[0, KV(0.25, 7.4, 0.36)], [len(sh), KV(0.1, 6.4, 0.34)]], pos(37), { kE: exprAt([[0, 'focus'], [0.5, 'smug']], lt) }),
    { hud: (g, lt, t) => panel(g, t) });
  shot(firT - 0.05, (g, lt, t, sh) => {
    const P = board(t, [BH2], 37);
    const C = { yaw: Math.PI + 0.28, pitch: 0.74, dist: 10.5, fov: 1500, cy: H * 0.56, target: [5.6, 0.5, 3.2] };
    scene(g, lt, t, [[0, C], [len(sh), { ...C, yaw: Math.PI + 0.18, dist: 9.6 }]], P, {
      mE: exprAt([[0, 'focus'], [chkT - (t - lt), { ...EXPR.worried, sweat: 0 }]], lt),
      under: () => {
        if (t < BH2.t1) { boardArrow(g, B, 'd6', 'h2', seg(t, firT + 0.1, firT + 0.25) * (1 - seg(t, BH2.t0, BH2.t0 + 0.2))); squareFrame(g, B, 'h2', HI.bad, seg(t, firT + 0.1, firT + 0.25)); }
        if (t >= BH2.t0) B.highlight(g, 'd6', HI.bad, 0.35);
        if (t >= BH2.t0 && t < BH2.t1 + 0.4) slideStreak(g, B, 'd6', P.find(q => q.id === G[38].pieces.find(z => z.sq === 'h2').id), 1 - seg(t, BH2.t1, BH2.t1 + 0.4));
        ledGlow(g, B, 'h2', HI.bad, t, BH2.t1, { reach: 3 }); if (t >= BH2.t1) B.highlight(g, 'h2', HI.bad, 0.85, true); spread(g, B, 'h2', t, BH2.t1, HI.bad);
      },
      over: () => {
        if (t >= BH2.t1) { B.laser(g, 'h2', 'g1', HI.bad, 1, 0.6, ease.out(seg(t, BH2.t1, BH2.t1 + 0.25))); pieceRing(g, B, 'g1', HI.bad, 1, seg(t, BH2.t1 + 0.1, BH2.t1 + 0.4)); }
        ticks(g, B, 'h2', t, BH2.t1, { seed: 2 }); moveLabel(g, 38, t, BH2.t1, HI.bad); },
    });
  }, { noJump: true, roll: -0.05 });
  cue(firT + 0.1, 'whoosh_soft', 0.2); cue(BH2.t0, 'piece_slide', 0.35); boom(BH2.t1, 0.9); cue(BH2.t1, 'hit_punch', 0.3);

  // ======================= MAGNUS STEPS ASIDE (20.Kh1), THEN TAKES THE BISHOP (20...Nd6 21.Kxh2, slowed down) =======================
  const magT2 = w('a2', 'Magnus'), asT = w('a2', 'aside,'), thenT = w('a2', 'then'), takT = w('a2', 'takes'), bis2 = w('a2', 'bishop.');
  const KH1 = { k: 39, t0: asT - 0.2, t1: asT }, ND6 = { k: 40, t0: thenT - 0.16, t1: thenT }, KXH2 = { k: 41, t0: bis2 - 0.26, t1: bis2 };
  const KC = { yaw: Math.PI - 0.3, pitch: 0.5, dist: 8.0, fov: 1500, cy: H * 0.5, target: [5.6, 1.2, 0.8] };  // Magnus and his king's corner
  shot(magT2 - 0.08, (g, lt, t, sh) => scene(g, lt, t, [[0, KC], [len(sh), { ...KC, yaw: Math.PI - 0.2, dist: 7.2 }]], board(t, [KH1], 38), {
    mE: exprAt([[0, 'focus'], [0.5, { ...EXPR.focus, look: [0.5, 0.5] }]], lt),
    under: () => { if (t >= KH1.t0) { B.highlight(g, 'g1', HI.hero, 0.35); squareFrame(g, B, 'h1', HI.hero, seg(t, KH1.t1, KH1.t1 + 0.1), { k: lerp(1.6, 1, ease.out(seg(t, KH1.t1, KH1.t1 + 0.35))) }); } },
    over: () => moveLabel(g, 39, t, KH1.t1, HI.hero),
  }));
  cue(KH1.t1, 'piece', 0.4);
  shot(thenT - 0.22, (g, lt, t, sh) => {
    const P = board(t, [ND6, KXH2], 39);
    scene(g, lt, t, [[0, SQ('h2', 0.42, 6.0, 0.4, 0.9, 0.52)], [len(sh), SQ('h2', 0.3, 5.0, 0.4, 0.9, 0.52)]], P, { kE: exprAt([[0, 'focus'], [bis2 - (t - lt), { ...EXPR.focus, curve: -0.3 }]], lt),
      under: () => {
        if (t >= ND6.t1 && t < KXH2.t0 + 0.1) squareFrame(g, B, 'd6', HI.bad, 1 - seg(t, KXH2.t0, KXH2.t0 + 0.1));
        if (t >= KXH2.t0) B.highlight(g, 'h1', HI.good, 0.35);
        ledGlow(g, B, 'h2', HI.good, t, KXH2.t1, { reach: 2 }); if (t >= KXH2.t1) B.highlight(g, 'h2', HI.good, 0.85, true); spread(g, B, 'h2', t, KXH2.t1, HI.good);
      },
      over: () => { captured(g, 41, t, KXH2.t1); ticks(g, B, 'h2', t, KXH2.t1, { seed: 4 }); moveLabel(g, 41, t, KXH2.t1, HI.good); },
    });
  }, { noJump: true, roll: 0.04 });
  cue(ND6.t1, 'piece', 0.3); boom(KXH2.t1, 0.85); cue(KXH2.t1, 'glass', 0.18);

  // ======================= DISCOVERED CHECK: 21...Nxe4+ (the queen on c7 sees h2; the knight hits f6) =======================
  const disT = w('a3', 'Discovered'), dchT = w('a3', 'check!');
  const NXE4 = { k: 42, t0: disT - 0.2, t1: disT };
  shot(disT - 0.26, (g, lt, t, sh) => {
    const P = board(t, [NXE4], 41);
    scene(g, lt, t, [[0, { yaw: -0.22, pitch: 0.78, dist: 11.2, fov: 1500, cy: H * 0.5, target: [4.6, 0.8, 4.6] }], [len(sh), { yaw: -0.16, pitch: 0.76, dist: 10.2, fov: 1500, cy: H * 0.5, target: [4.6, 0.8, 4.6] }]], P, { kE: exprAt([[0, 'focus'], [0.3, { ...EXPR.smug, curve: 0.8 }]], lt), dof: 1.0,
      under: () => {
        ledGlow(g, B, 'c7', HI.bad, t, dchT, { reach: 8, speed: 16 }); if (t >= NXE4.t1) B.highlight(g, 'e4', HI.bad, 0.8, true);
        spread(g, B, 'e4', t, NXE4.t1, HI.bad);
      },
      over: () => {
        captured(g, 42, t, NXE4.t1); moveLabel(g, 42, t, NXE4.t1, HI.bad, { dx: 200 });
        if (t >= NXE4.t1) { neon(g, B, 'e4', 'f6', HI.bad, 1, { y: 0.55, u: seg(t, NXE4.t1 + 0.1, NXE4.t1 + 0.35) }); pieceRing(g, B, 'f6', HI.bad, 1, seg(t, NXE4.t1 + 0.25, NXE4.t1 + 0.55)); }
        if (t >= dchT) { B.laser(g, 'c7', 'h2', HI.bad, 1, 0.6, ease.out(seg(t, dchT, dchT + 0.3))); pieceRing(g, B, 'h2', HI.bad, 1, seg(t, dchT + 0.2, dchT + 0.5)); pieceRing(g, B, 'c7', HI.bad, 1, seg(t, dchT, dchT + 0.3)); }
      },
    });
  }, { noJump: true, roll: -0.04, post: (g, lt, t) => flashTint(g, HI.bad, 0.6 * (1 - seg(t, dchT, dchT + 0.3)) * (t >= dchT)) });
  boom(NXE4.t1, 0.75); cue(NXE4.t1, 'glass', 0.18); cue(dchT, 'hit_punch', 0.55); cue(dchT, 'boom_big', 0.35);

  // ======================= THE BIG ONE: 22.Be5 — saves the bishop, blocks the check, hits the queen =======================
  const butT = w('a4', 'But'), blkT = w('a4', 'blocks'), andT = w('a4', 'and'), hitT = w('a4', 'hits'), qT = w('a4', 'queen.');
  // as in the reference: the line stops ("…blocks it,"), the music cuts, the bishop slides in the silence and lands on the
  // hit, then the music plays alone and loud before the voice comes back (the line holds its breath: script.json `hold`)
  const BE5 = { k: 43, t1: andT - 1.1 }; BE5.t0 = BE5.t1 - 0.28; BE5.e = ease.in;
  // the zoom punch: hold, snap in on the landing (motion blur), ease back out
  const PUNCH = (A, D, hl, L) => [[0, A], [hl - 0.06, A], [hl + 0.05, D, ease.whip], [hl + 0.6, { ...D, dist: D.dist + 0.5 }, ease.out], [Math.max(L, hl + 0.7), { ...D, yaw: D.yaw - 0.04, dist: D.dist + 0.7 }]];
  shot(butT - 0.06, (g, lt, t, sh) => {
    const P = board(t, [BE5], 42), A = { yaw: 0.38, pitch: 0.92, dist: 10.5, fov: 1500, cy: H * 0.5, target: [4.2, 0.4, 5.6] }, D = { ...A, yaw: 0.36, dist: 9.4 };
    scene(g, lt, t, PUNCH(A, D, BE5.t1 - sh.a, len(sh)), P, {
      kE: exprAt([[0, 'smug'], [BE5.t1 + 0.1 - (t - lt), { ...EXPR.worried, sweat: 1 }]], lt), kHands: seg(t, BE5.t1 + 0.15, BE5.t1 + 0.3), dof: 1.2,
      under: () => {
        if (t < BE5.t1) { boardArrow(g, B, 'f6', 'e5', seg(t, butT + 0.1, butT + 0.25) * (1 - seg(t, BE5.t0, BE5.t1))); squareFrame(g, B, 'e5', HI.good, seg(t, butT + 0.1, butT + 0.25)); }
        if (t >= BE5.t0 && t < BE5.t1 + 0.3) slideStreak(g, B, 'f6', P.find(q => q.id === G[43].pieces.find(z => z.sq === 'e5').id), 1 - seg(t, BE5.t1, BE5.t1 + 0.3));
        if (t < BE5.t1) B.laser(g, 'c7', 'h2', HI.bad, 0.9, 0.6);                      // the check it is about to block
        ledGlow(g, B, 'e5', HI.good, t, BE5.t1, { reach: 8, speed: 18 });
        if (t >= BE5.t0) B.highlight(g, 'f6', HI.good, 0.35); if (t >= BE5.t1) B.highlight(g, 'e5', HI.good, 0.9, true);
        spread(g, B, 'e5', t, BE5.t1, HI.good, { life: 1.8, r1: 7.5 });
      },
      over: () => {
        if (t >= BE5.t1) {
          B.laser(g, 'c7', 'e5', HI.bad, 0.8, 0.6);                                     // blocked: the queen's line now ends on the bishop
          neon(g, B, 'e5', 'c7', HI.good, 1, { y: 0.62, u: ease.out(seg(t, BE5.t1 + 0.15, BE5.t1 + 0.4)), w: t >= hitT ? 1.4 : 1 });
          pieceRing(g, B, 'c7', HI.bad, 1, seg(t, BE5.t1 + 0.3, BE5.t1 + 0.6)); if (t >= hitT) pieceRing(g, B, 'c7', HI.bad, 1 - seg(t, hitT, hitT + 0.5), 1);
        }
        ticks(g, B, 'e5', t, BE5.t1, { seed: 9, n: 14 }); moveLabel(g, 43, t, BE5.t1, HI.good);
      },
    });
  }, { noJump: true, roll: lt => 0.05 * Math.sin(Math.min(1, lt / 2) * 1.2),
    post: (g, lt, t) => {
      if (t >= BE5.t1) { flashTint(g, HI.good, 1 - seg(t, BE5.t1, BE5.t1 + 0.45)); const [x, z] = sqXZ('e5'), p = B.project(x, 0.7, z); speedLines(g, p.x, p.y, t, BE5.t1, { life: 0.7, seed: 21 }); }
    } });
  cue(BE5.t1 - 0.32, 'revswell', 1.0); cue(BE5.t0, 'piece_slide', 0.3); cue(BE5.t1 - 0.004, 'boom', 1.0); cue(BE5.t1, 'hit_punch', 0.6); cue(BE5.t1, 'airwash', 0.55); cue(BE5.t1 - BOOM_HIT, 'boom_big', 0.45);
  // "…and hits the queen": closer on the queen, Kasparov behind it with his hands on his head
  shot(andT - 0.06, (g, lt, t, sh) => {
    const C = { yaw: 0.22, pitch: 0.5, dist: 7.2, fov: 1500, cy: H * 0.55, target: [2.9, 1.0, 6.0] };
    scene(g, lt, t, [[0, C], [len(sh), { ...C, yaw: 0.14, dist: 6.5 }]], pos(43), { kE: { ...EXPR.worried, sweat: 1 }, kHands: 1, dof: 1.2,
      under: () => { ledGlow(g, B, 'e5', HI.good, t, BE5.t1, { reach: 8, speed: 18 }); B.highlight(g, 'e5', HI.good, 0.9, true); },
      over: () => {
        neon(g, B, 'e5', 'c7', HI.good, 1, { y: 0.62, w: t >= hitT ? 1.5 : 1 }); pieceRing(g, B, 'c7', HI.bad, 1, 1);
        if (t >= hitT) pieceRing(g, B, 'c7', HI.bad, 1 - seg(t, hitT, hitT + 0.5), seg(t, hitT, hitT + 0.3));
      },
    });
  }, { noJump: true, roll: 0.03 });
  cue(hitT, 'boom_move', 0.45);

  // ======================= FIVE MOVES LATER: 27.Nxc6 wins a pawn (and hits the rook) =======================
  const fiveT = s('a5'), kidT = w('a5', 'kid'), pawnT = w('a5', 'pawn.');
  const MID = ff(44, 52, fiveT + 0.05, (kidT - fiveT - 0.1) / 9);
  const NXC6 = { k: 53, t0: pawnT - 0.24, t1: pawnT };
  shot(fiveT - 0.05, (g, lt, t, sh) => {
    const P = board(t, [...MID, NXC6], 43);
    scene(g, lt, t, [[0, TOP(-0.35, 13.5, 0.9)], [kidT - sh.a, TOP(-0.15, 12, 0.8)], [len(sh), { ...SQ('c6', -0.1, 7.2, 0.62, 0.6, 0.5) }]], P, { e: ease.inOut,
      kE: exprAt([[0, 'focus'], [pawnT - (t - lt), { ...EXPR.focus, curve: -0.35 }]], lt),
      under: () => { ledGlow(g, B, 'c6', HI.good, t, NXC6.t1, { reach: 3 }); if (t >= NXC6.t1) B.highlight(g, 'c6', HI.good, 0.85, true); spread(g, B, 'c6', t, NXC6.t1, HI.good); },
      over: () => {
        captured(g, 53, t, NXC6.t1); moveLabel(g, 53, t, NXC6.t1, HI.good); ticks(g, B, 'c6', t, NXC6.t1, { seed: 5 });
        if (t >= NXC6.t1) targets(pos(53), 'c6').forEach((p, i) => { neon(g, B, 'c6', p.sq, HI.good, 1, { y: 0.55, u: seg(t, NXC6.t1 + 0.1 + i * 0.08, NXC6.t1 + 0.35 + i * 0.08) }); pieceRing(g, B, p.sq, HI.bad, 1, seg(t, NXC6.t1 + 0.3 + i * 0.08, NXC6.t1 + 0.6 + i * 0.08)); });
      },
    });
  }, { noJump: true });
  MID.forEach((m, i) => { if (i % 3 === 0) cue(m.t1, 'piece', 0.15); }); boom(NXC6.t1, 0.85); cue(NXC6.t1, 'glass', 0.18);

  // ======================= 52 MOVES, A DRAW: the rest in fast forward, the board turns gold =======================
  const endT = s('end'), drawT = w('end', 'draw'), wldT = w('end', 'world');
  const LATE = ff(54, 103, endT + 0.05, (drawT - 0.25 - endT) / 50, 0.5);
  shot(endT - 0.06, (g, lt, t, sh) => scene(g, lt, t, [[0, { ...TOP(0.45, 14, 1.12), cy: H * 0.64 }], [len(sh), { ...TOP(0.15, 13.0, 1.08), cy: H * 0.64 }]], board(t, LATE, 53), { e: lin,
    under: () => ledGlow(g, B, 'd4', HI.gold, t, drawT, { reach: 8, speed: 14, a: 0.9 }) }),
    { noJump: true, hud: (g, lt, t) => {
      if (t < drawT) panel(g, t); else result(g);
    } });
  cue(endT + 0.1, 'whoosh_soft', 0.22); boom(drawT, 0.7); cue(drawT, 'shimmer', 0.3);
  shot(wldT - 0.12, (g, lt, t, sh) => scene(g, lt, t, [[0, { ...KV(0.08, 6.8, 0.3), cy: H * 0.53 }], [len(sh), { ...KV(0.02, 6.2, 0.3), cy: H * 0.53 }]], pos(103), { kE: { ...EXPR.tired, look: [0.3, 0.6], curve: -0.4 } }),
    { hud: (g, lt, t) => result(g) });

  // ======================= CTA: could you draw against Kasparov? =======================
  const ctaT = s('cta') - 0.06, youT = w('cta', 'you');
  shot(ctaT, (g, lt, t, sh) => scene(g, lt, t, [[0, MV(0.1, 6.8, 0.3)], [len(sh), MV(0.03, 6.0, 0.3)]], pos(103), { mE: { ...EXPR.happy, curve: 0.6 } }),
    { noJump: true, hud: (g, lt, t) => {
      badge(g, 'COULD YOU DRAW KASPAROV?', W / 2, 250, { color: C.accent, size: 46, a: seg(t, youT, youT + 0.1), scale: lerp(1.5, 1, seg(t, youT, youT + 0.25, ease.back)) });
      badge(g, 'FOLLOW ' + CHANNEL, W / 2, 360, { color: C.cream, size: 36, a: seg(t, youT + 0.8, youT + 0.9) });
    } });
  cue(youT + 0.8, 'notify', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [{ t: 0, m: 'tension' }, { t: BE5.t1, m: 'slam' }, { t: fiveT - 0.05, m: 'build' }, { t: ctaT, m: 'hook' }, { t: T.duration, m: 'end' }];
  const musicFx = [{ t0: s('who') - 0.08, t1: kasT - 0.1, kind: 'lp', f: 700 }, { t0: BE5.t0, t1: BE5.t1 - 0.01, kind: 'mute' }, { t0: BE5.t1, t1: andT - 0.2, kind: 'boost', db: 10 }, { t0: ctaT, t1: T.duration, kind: 'lp', f: 900 }];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
