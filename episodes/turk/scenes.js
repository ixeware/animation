// The Mechanical Turk — shots timed to narration words. Every scene lives in a 3D set; the hook graphic,
// the map, the blueprint and the gear machine are flat inserts.
import { W, H, C, clamp, lerp, ease, seg, pulse, rgba, rng, makeCanvas } from '../../engine/js/core.js';
import { bgBase, spotlight, speedlines, rays, flash, target, xMark, glowText, bokeh } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { drawChar, exprAt, hand, EXPR } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, scoreboard, mono, serif, sans } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { loadImage, photoCard, photoFull } from '../../engine/js/photo.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, cabinet, box, picture, placeAt, gear, pool, FLOOR_Y } from '../../engine/js/env.js';
import { burst, shockwave, glint, dust, flames, embers } from '../../engine/js/fx.js';

const NT = await fetch('../engine/data/napoleon_turk_1809.json').then(r => r.json());
const FM = await fetch('../engine/data/fools_mate.json').then(r => r.json());
const map = await new DotMap().init();
// archival images, all public domain (see photos/credits.json)
const P = Object.fromEntries(await Promise.all(['turk1783', 'racknitz1', 'racknitz3', 'babbage', 'napoleon', 'franklin'].map(async k => [k, await loadImage(`../episodes/turk/photos/${k}.jpg`)])));

const B = new Board();
const TURK = [4, 3.1, 9.4], NEAR = [4, 3.1, -1.6], PI = Math.PI;

function crown(g, x, y, s, { a = 1 } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = C.gold; g.shadowColor = C.gold; g.shadowBlur = 24;
  g.beginPath(); g.moveTo(-90, 40); g.lineTo(-100, -50); g.lineTo(-50, -10); g.lineTo(0, -70); g.lineTo(50, -10); g.lineTo(100, -50); g.lineTo(90, 40); g.closePath(); g.fill();
  g.restore();
}

function candle(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  spotlight(g, 0, -120, 260, '#ffcf7a', 0.4);
  g.fillStyle = '#EDE6D6'; g.beginPath(); g.roundRect(-18, -90, 36, 100, 6); g.fill();
  const fl = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 31);
  const gr = g.createRadialGradient(0, -112, 2, 0, -112, 24 * fl); gr.addColorStop(0, '#FFF6D0'); gr.addColorStop(0.5, '#FFC04A'); gr.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -112, 12 * fl, 26 * fl, 0, 0, 7); g.fill();
  g.restore();
}

// the gear machine (Babbage's engine and the hook): a wall of meshing gears in screen space
function gearWall(g, t, { a = 1, color = '#B8893A', seed = 2, speed = 1 } = {}) {
  const r = rng(seed);
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < 14; i++) {
    const x = r() * W, y = r() * H, rad = 70 + r() * 170, n = 8 + Math.floor(r() * 10), dir = i % 2 ? 1 : -1;
    g.save(); g.translate(x, y); g.rotate(t * speed * dir * (60 / rad));
    g.fillStyle = rgba(color, 0.18 + r() * 0.15); g.beginPath();
    for (let k = 0; k < n * 4; k++) { const rr = Math.floor(k / 2) % 2 ? rad * 0.82 : rad, th = k / (n * 4) * 6.283; k ? g.lineTo(Math.cos(th) * rr, Math.sin(th) * rr) : g.moveTo(Math.cos(th) * rr, Math.sin(th) * rr); }
    g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, rad * 0.3, 0, 7); g.fill();
    g.restore();
  }
  g.restore();
}

// UI shown on the giant "AI" screen in the last act (drawn once into a canvas, mapped into 3D)
const UI = makeCanvas(900, 600);
{
  const u = UI.getContext('2d');
  u.fillStyle = '#0D1520'; u.fillRect(0, 0, 900, 600);
  u.fillStyle = '#16233A'; u.fillRect(0, 0, 900, 70);
  u.fillStyle = '#6CB8FF'; u.font = '800 34px "JetBrains Mono"'; u.fillText('AI ASSISTANT', 34, 47);
  u.fillStyle = '#2FD3B5'; u.beginPath(); u.arc(850, 35, 12, 0, 7); u.fill();
  const rows = [['Label 10,000 photos', '✓ DONE'], ['Transcribe audio', '✓ DONE'], ['Moderate comments', '✓ DONE'], ['Check this receipt', '✓ DONE']];
  rows.forEach(([a, b], i) => {
    const y = 130 + i * 110;
    u.fillStyle = '#132033'; u.beginPath(); u.roundRect(30, y - 50, 840, 86, 14); u.fill();
    u.fillStyle = '#E6EEF5'; u.font = '700 34px "JetBrains Mono"'; u.fillText(a, 60, y + 4);
    u.fillStyle = '#B8E65A'; u.font = '800 32px "JetBrains Mono"'; u.textAlign = 'right'; u.fillText(b, 840, y + 4); u.textAlign = 'left';
  });
}

// ---------- the film ----------
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
  // the Turk's table: the Turk on the far side, an opponent on the near side, the cabinet under the board
  const turkSet = (g, lt, t, keys, { style = 'palace', blur = 0, over = null, turkE = 'smug', opp = null, oppE = 'focus', reach = null, oppReach = null, open = 0, xray = 0, inside = null, pieces = null, dof = 1.4, focus = null, bump = 0, shake = 1, e = ease.inOut, before = null } = {}) => {
    rig(B, lt, keys, { t, bump, shake, e });
    const env = room(g, B, style, { t, blur, over });
    if (before) before(g, env);
    const ht = seated(g, B, 'turk', turkE, t, { z: 9.4, reach, side: -1 });
    const ho = opp ? seated(g, B, opp, oppE, t, { z: -1.6, face: 1, reach: oppReach }) : () => {};
    cabinet(g, B, { t, open, xray, inside });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' });
    ht(); ho();
    if (pieces) B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof });
    return env;
  };

  // S1a — hook: the Turk checkmates Napoleon (the real end of their game: 24...Qe2#)
  const mateHook = new Moves(B, NT, [{ k: 48, t0: w('hook1', 'beat') - 0.42, dur: 0.42, label: 'CHECKMATE', labelColor: C.lime, color: C.red }]);
  mateHook.cues(cue);
  const hookMateT = w('hook1', 'beat');
  shot(0, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.75, pitch: 0.5, dist: 13.5, cy: H * 0.55, target: [4, 0.6, 3] }], [len(sh), { yaw: -0.2, pitch: 0.42, dist: 10.5 }]], { t, bump: mateHook.bump(t), e: lin });
    const env = room(g, B, 'palace', { t });
    picture(g, B, P.napoleon, [12.4, 9.8, 12.85], [15.2, 9.8, 12.85], [12.4, 5.2, 12.85], { tone: 'warm', fx: 0.5, fy: 0.3, border: '#C9A05A' });
    const m = mateHook.current(t);
    const ht = seated(g, B, 'turk', exprAt([[0, 'focus'], [hookMateT - (t - lt), { ...EXPR.smug, nod: 0.4 }]], lt), t, { z: 9.4, side: -1, reach: m ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.75 } : null });
    const hn = seated(g, B, 'napoleon', t >= hookMateT ? { ...EXPR.shock, shake: 0.6 } : 'focus', t, { z: -1.6, face: 1 });
    cabinet(g, B, { t });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); ht(); hn();
    mateHook.draw(g, t, { dof: 1.3 });
    if (t >= hookMateT) {
      const q = seg(t, hookMateT, hookMateT + 0.3);
      for (const sq of ['d1', 'd2', 'f1', 'f2']) { const [x, z] = sqXZ(sq), p = B.project(x, 0.05, z); xMark(g, p.x, p.y, p.s * 0.42 * (1 + 0.4 * (1 - ease.back(q))), C.red, q); }
      flash(g, 0.45 * pulse(t, hookMateT, 0.25), '#FFE9C8');
    }
  }, { vig: 0.6 });
  cue(0.05, 'ratchet', 0.7); cue(hookMateT, 'boom', 1.0);
  // S1b — Napoleon, stunned, from across the table
  shot(w('hook1', 'Napoleon') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [-0.32, 0.05], dist: [8.6, 7.2], pitch: [0.16, 0.12], cy: H * 0.42 }), { blur: 6, opp: 'napoleon', oppE: { ...EXPR.shock, shake: 0.7, look: [0, 1] }, pieces: piecesAt(NT, 48), dof: 2, e: ease.out });
    nameTitle(g, lt, 'Napoléon Bonaparte', 'EMPEROR OF THE FRENCH', { y: 210, t0: 0.1, subColor: C.gold });
  }, { trans: 'whip' });

  // S2 — 1809… and the word "robot" only arrives in 1920
  const yrT0 = w('hook2', 'century'), robotT = w('hook2', 'robot');
  shot(s('hook2') - 0.05, (g, lt, t) => {
    bgBase(g, { top: '#2A2016', mid: '#120D08', edge: '#050302', cy: H * 0.4 });
    gearWall(g, t, { a: 0.9 });
    const yr = Math.round(lerp(1809, 1920, seg(t, yrT0, robotT, ease.inOut)));
    const pop = pulse(t, robotT, 0.35);
    counter(g, String(yr), t < yrT0 ? 'NAPOLEON VS THE TURK' : '+' + (yr - 1809) + ' YEARS', { y: 640, size: 190 * (1 + 0.1 * pop), color: '#FFF4D6', glow: C.gold, labelColor: C.gold });
    if (t >= robotT - 0.05) {
      const k = Math.floor(clamp((t - robotT + 0.05) / 0.5) * 5);
      glowText(g, '“' + 'ROBOT'.slice(0, k) + (k < 5 ? '▍' : '') + '”', W / 2, 1000, { font: mono(130, 800), fill: C.blue, glow: rgba(C.blue, 0.7), blur: 30 });
      badge(g, 'WORD INVENTED · 1920', W / 2, 1120, { color: C.blue, size: 32, a: seg(t, robotT + 0.5, robotT + 0.7), sub: 'KAREL ČAPEK · R.U.R.' });
    }
    placeStamp(g, lt, 'Schönbrunn', '1809', { y: 160, t0: 0.05 });
  }, { trans: 'zoom' });
  cue(s('hook2'), 'tick', 0.8); cue(yrT0, 'riser', 0.6); cue(robotT - 0.05, 'typewriter', 0.9); cue(robotT + 0.5, 'boom', 0.7);

  // S3 — so who was moving the pieces? A knight moves by itself in the dark; the Turk stares
  const ghost = new Moves(B, NT, [{ k: 2, t0: w('hook3', 'moving') - 0.1, dur: 0.6, color: C.red }]);
  ghost.cues(cue);
  shot(s('hook3') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.55, pitch: 0.12, dist: 7, cy: H * 0.5, target: [4, 1.6, 6.5] }], [len(sh), { yaw: 0.1, pitch: 0.08, dist: 5.6 }]], { t, e: lin });
    const env = room(g, B, 'dark', { t, blur: 6, over: { light: C.red, lightA: 0.25 } });
    actor(g, B, 'turk', { ...{ x: 4, y: 3.1, z: 9.4 }, e: { ...EXPR.neutral, look: [0, 0.4], lid: 0.3 }, t, eyeGlow: C.red });
    cabinet(g, B, { t }); B.drawSlab(g, { light: '#2A2420', dark: '#191411', frame: '#120D0A', side: '#080605' });
    ghost.draw(g, t, { dof: 1.6, labels: false, fx: false });
    const tp = B.project(4, 3.1, 9.4);
    const glow = seg(t, w('hook3', 'pieces') - 0.1, w('hook3', 'pieces') + 0.2);
    if (glow > 0) for (const sd of [-1, 1]) { g.save(); g.globalAlpha = glow; g.fillStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 30; g.beginPath(); g.ellipse(tp.x + sd * 38 * tp.s / 100, tp.y - 2 * tp.s / 100, 12 * tp.s / 100, 6 * tp.s / 100, 0, 0, 7); g.fill(); g.restore(); }
    badge(g, '?', W / 2, 330, { color: C.red, size: 120, a: seg(t, w('hook3', 'who'), w('hook3', 'who') + 0.2), scale: lerp(1.6, 1, seg(t, w('hook3', 'who'), w('hook3', 'who') + 0.25, ease.back)) });
  }, { trans: 'zoom', vig: 0.8 });
  cue(s('hook3'), 'heartbeat', 0.8); cue(w('hook3', 'who'), 'sting', 0.7);

  // S4 — Vienna, 1770: crane down from the chandeliers of Schönbrunn
  shot(s('vienna') - 0.1, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: 0.6, pitch: 0.95, dist: 15, cy: H * 0.5, target: [4, 0, 4] }], [len(sh), { yaw: 0.15, pitch: 0.45, dist: 12.5 }]], { turkE: 'neutral', pieces: piecesAt(NT, 0), dof: 1.2 });
    placeStamp(g, lt, 'Vienna', '1770', { y: 160, t0: 0.05 });
  }, { trans: 'leak' });
  cue(w('vienna', '1770'), 'boom', 0.8);

  // S5a — the inventor presents his machine
  shot(s('unveil'), (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: -0.5, pitch: 0.3, dist: 12, cy: H * 0.5, target: [6, 2, 7] }], [len(sh), { yaw: -0.15, pitch: 0.26, dist: 10.5 }]], {
      turkE: 'neutral', pieces: piecesAt(NT, 0), dof: 1.3,
      before: g2 => actor(g2, B, 'kempelen', { x: 7.8, y: 4.6, z: 10.8, e: exprAt([[0, 'happy'], [1.2, { ...EXPR.smug, nod: 0.5 }]], lt), t, k: 1.0 }),
    });
    const p = B.project(7.8, 4.6, 10.8);
    hand(g, p.x - 150 * p.s / 100, p.y + 230 * p.s / 100 + Math.sin(lt * 3) * 8, 34 * p.s / 100);
    nameTitle(g, lt, 'Wolfgang von Kempelen', 'INVENTOR · AGE 36', { y: 210, t0: 0.05, subColor: C.gold, size: 56 });
  }, { trans: 'whip' });
  // S5b — the Empress
  shot(w('unveil', 'Empress') - 0.1, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [0.3, -0.05], dist: [8.8, 7.8], pitch: [0.16, 0.12], cy: H * 0.42 }), { blur: 6, opp: 'empress', oppE: exprAt([[0, 'smug'], [0.5, 'happy']], lt), pieces: piecesAt(NT, 0), dof: 2 });
    nameTitle(g, lt, 'Maria Theresa', 'EMPRESS OF AUSTRIA', { y: 210, t0: 0.05, subColor: C.gold });
  }, { trans: 'whip', whipDir: -1 });
  cue(w('unveil', 'Empress'), 'shimmer', 0.6);

  // S6 — the Turk himself: an orbit round the automaton, and the real 1783 engraving
  shot(s('turk'), (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit([5.6, 3.1, 9.4], len(sh), { yaw: [-0.55, 0.35], dist: [9.5, 8.2], pitch: [0.18, 0.12], cy: H * 0.42 }), { blur: 5, turkE: { ...EXPR.neutral, look: [0, 0.3] }, pieces: piecesAt(NT, 0), dof: 2, e: lin });
    photoCard(g, P.turk1783, lt, 0.25, { x: 820, y: 760, w: 330, aspect: 0.87, rot: 0.06, from: 'right', caption: 'THE TURK · 1783', credit: 'Engraving · Public domain', fx: 0.5, fy: 0.5, zoom: [1.0, 1.08], dur: 3 });
    nameTitle(g, lt, 'The Turk', 'CHESS AUTOMATON · 1770', { y: 210, t0: 0.05, subColor: C.blue });
  }, { trans: 'zoom' });
  cue(s('turk') + 0.25, 'shutter', 0.6); cue(w('turk', 'gears'), 'ratchet', 0.7);

  // S7 — every door opens: nothing inside but clockwork
  const doorT = w('doors', 'opens') - 0.1;
  shot(s('doors') - 0.05, (g, lt, t, sh) => {
    const open = seg(t, doorT, doorT + 0.9, ease.out);
    turkSet(g, lt, t, [[0, { yaw: -0.5, pitch: 0.2, dist: 13, cy: H * 0.55, target: [4.6, -0.2, 0] }], [len(sh), { yaw: 0.15, pitch: 0.16, dist: 11 }]], {
      turkE: 'neutral', open, pieces: piecesAt(NT, 0), dof: 1.4, e: lin,
    });
    actor(g, B, 'kempelen', { x: 10.6, y: 3.0, z: -2.6, e: 'happy', t, face: -1, k: 1.15 });
    if (B.toCam(9.4, -0.3, -3.2)[2] > 1) { const cp = B.project(9.4, -0.3, -3.2); candle(g, cp.x, cp.y, cp.s / 120, t); }
    photoCard(g, P.racknitz1, lt, w('doors', 'clockwork') - s('doors') + 0.05, { x: 300, y: 560, w: 360, aspect: 0.86, rot: -0.06, from: 'left', caption: 'OPEN CABINET · 1789', credit: 'J. F. zu Racknitz · PD', fx: 0.5, fy: 0.6, zoom: [1.0, 1.06], dur: 2 });
  }, { trans: 'leak' });
  cue(doorT, 'creak', 0.9); cue(doorT + 0.3, 'creak', 0.6); cue(w('doors', 'clockwork'), 'whirr', 0.8);

  // S8 — the Turk lifts its arm…
  const armT = s('arm');
  shot(armT - 0.05, (g, lt, t, sh) => {
    const u = seg(t, w('arm', 'lifts') - 0.1, w('arm', 'arm') + 0.3, ease.inOut) * 0.85;
    turkSet(g, lt, t, orbit(TURK, len(sh), { yaw: [0.5, 0.3], dist: [7.4, 6.4], pitch: [0.04, 0.08], cy: H * 0.45, dy: -0.6 }), { blur: 5, turkE: { ...EXPR.focus, look: [-0.3, 1] }, reach: { x: 3.5, z: 5.5, y: 2.4, u, hold: true }, pieces: piecesAt(FM, 0), dof: 2.2, e: ease.out });
  }, { trans: 'zoom' });
  cue(w('arm', 'lifts'), 'whirr', 0.9); cue(w('arm', 'lifts') + 0.1, 'ratchet', 0.5);
  // S9 — …and wins (Fool's mate in two: the Turk is black)
  const quick = new Moves(B, FM, [{ k: 1, t0: armT - 0.2 }, { k: 2, t0: armT + 0.25 }, { k: 3, t0: armT + 0.7 }, { k: 4, t0: w('wins', 'wins') - 0.42, color: C.red, label: 'Qh4#', labelColor: C.lime }], { dur: 0.36 });
  quick.cues(cue);
  const winT = w('wins', 'wins');
  shot(s('wins') - 0.05, (g, lt, t, sh) => {
    const m = quick.current(t);
    turkSet(g, lt, t, [[0, { yaw: -0.7, pitch: 0.72, dist: 10, cy: H * 0.5, target: [5.5, 0, 3] }], [len(sh), { yaw: -0.4, pitch: 0.8, dist: 8 }]], {
      turkE: t >= winT ? { ...EXPR.smug, nod: 0.6 } : 'focus', opp: 'kempelen', oppE: t >= winT ? { ...EXPR.shock } : 'focus', bump: quick.bump(t) * 1.5,
      reach: m && m.k % 2 === 0 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.75 } : null,
    });
    quick.draw(g, t, { dof: 1.2 });
    if (t >= winT) {
      const [kx, kz] = sqXZ('e1'), kp = B.project(kx, 0.8, kz);
      target(g, kp.x, kp.y, 90, t, C.red, seg(t, winT, winT + 0.2));
      flash(g, 0.5 * pulse(t, winT, 0.25), '#E6FFC8');
      speedlines(g, W / 2, H * 0.45, t, { a: 0.5 * (1 - seg(t, winT + 0.2, winT + 0.8)), color: '#E9FFD0' });
    }
  }, { trans: 'whip' });
  cue(winT, 'boom', 1); cue(winT, 'hit', 0.8);

  // S10a — decades on tour: Vienna → Paris → London
  shot(s('tour'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.4, ease.inOut);
    map.view({ lon: lerp(16, 4, u), lat: lerp(48, 50, u), zoom: lerp(22, 16, u), cy: H * 0.47 });
    map.draw(g, { spacing: 15, color: id => id === ISO.AUT ? rgba(C.gold, 0.9) : id === ISO.FRA ? rgba(C.blue, 0.4 + 0.5 * seg(lt, 0.6, 0.9)) : id === ISO.GBR ? rgba(C.red, 0.3 + 0.5 * seg(lt, 1.3, 1.6)) : null });
    map.route(g, 'Vienna', 'Paris', seg(lt, 0.1, 0.8), { color: C.gold, bend: 0.25 });
    map.route(g, 'Paris', 'London', seg(lt, 0.8, 1.4), { color: C.gold, bend: 0.35 });
    for (const [c, a0, below] of [['Vienna', 0, false], ['Paris', 0.75, true], ['London', 1.35, false]]) map.pin(g, c, { color: C.gold, a: seg(lt, a0, a0 + 0.2), below, pulse: lt > a0 ? ((lt - a0) * 1.2) % 1 : 0 });
    placeStamp(g, lt, 'European tour', '1783', { y: 160 });
  }, { trans: 'leak' });
  cue(s('tour') + 0.1, 'whoosh', 0.6); cue(s('tour') + 0.8, 'whoosh', 0.5);
  // S10b — kings… scholars… (dark silhouettes queue up in front of the Turk)
  shot(w('tour', 'Kings') - 0.05, (g, lt, t, sh) => {
    const kT = w('tour', 'Kings'), scT = w('tour', 'Scholars');
    turkSet(g, lt, t, [[0, { yaw: -0.4, pitch: 0.14, dist: 13, cy: H * 0.42, target: [4, 2.6, 2] }], [len(sh), { yaw: -0.12, pitch: 0.16, dist: 12 }]], { style: 'wood', turkE: 'smug', pieces: piecesAt(NT, 0), dof: 1.4, e: lin });
    [[-1.2, -4.4, kT, true], [4.2, -4.8, kT + 0.12, true], [9.4, -4.4, kT + 0.24, true], [1.4, -7.2, scT, false], [7.2, -7.2, scT + 0.12, false]].forEach(([x, z, t0, king]) => {
      const a = seg(t, t0, t0 + 0.25, ease.back);
      if (a <= 0) return;
      const p = actor(g, B, king ? 'napoleon' : 'babbage', { x, y: lerp(0.5, 3.6, a), z, k: 1.25, t, face: 1, silhouette: true, alpha: clamp(a * 2) });
      if (p && king) crown(g, p.x, p.y - 160 * p.s / 100, 0.75 * p.s / 100, { a: clamp(a) });
    });
    badge(g, 'KINGS', W / 2 - 200, 300, { color: C.gold, size: 44, a: seg(t, kT, kT + 0.15) });
    badge(g, 'SCHOLARS', W / 2 + 170, 300, { color: C.blue, size: 44, a: seg(t, scT, scT + 0.15) });
  }, { trans: 'whip' });
  cue(w('tour', 'Kings'), 'thud', 0.8); cue(w('tour', 'Scholars'), 'thud', 0.8);
  // S10c — even Benjamin Franklin (Paris)
  shot(w('tour', 'Even') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [-0.3, 0.08], dist: [9, 8], pitch: [0.16, 0.12], cy: H * 0.44 }), { style: 'wood', blur: 6, opp: 'franklin', oppE: exprAt([[0, 'focus'], [0.6, 'happy']], lt), pieces: piecesAt(NT, 0), dof: 2 });
    photoCard(g, P.franklin, lt, 0.2, { x: 870, y: 500, w: 280, aspect: 1.2, rot: 0.07, from: 'right', caption: 'FRANKLIN · 1785', credit: 'J. S. Duplessis · PD', fx: 0.5, fy: 0.32, zoom: [1.05, 1.12], dur: 2.5 });
    nameTitle(g, lt, 'Benjamin Franklin', 'PARIS · 1783', { y: 210, t0: 0.05, subColor: C.blue });
  }, { trans: 'whip' });
  cue(w('tour', 'Franklin') + 0.1, 'shutter', 0.6);

  // S11 — 1809: Napoleon sits down (his portrait already hangs in the palace)
  shot(s('napoleon') - 0.05, (g, lt, t, sh) => {
    const sitT = w('napoleon', 'sits') - s('napoleon');
    rig(B, lt, [[0, { yaw: 0.7, pitch: 0.36, dist: 14, cy: H * 0.5, target: [4, 1.2, 3] }], [len(sh), { yaw: 0.25, pitch: 0.3, dist: 11.5 }]], { t });
    const env = room(g, B, 'palace', { t });
    picture(g, B, P.napoleon, [-4.6, 10.2, 12.85], [-1.8, 10.2, 12.85], [-4.6, 5.6, 12.85], { tone: 'warm', fx: 0.5, fy: 0.3, border: '#C9A05A' });
    const ht = seated(g, B, 'turk', 'neutral', t, { z: 9.4 });
    const u = seg(lt, sitT - 0.4, sitT + 0.3, ease.out);
    const hn = seated(g, B, 'napoleon', { ...EXPR.smug, look: [0, 1] }, t, { z: -1.6, face: 1, lift: lerp(5.2, 3.1, u), alpha: clamp(u * 3) });
    cabinet(g, B, { t }); B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); ht(); if (u > 0.9) hn();
    B.drawPieces(g, piecesAt(NT, 0), { focus: B.dist, dof: 1.2 });
    placeStamp(g, lt, 'Schönbrunn', '1809', { y: 160, t0: 0.05 });
    credit(g, 'PORTRAIT: J.-L. DAVID, 1812 · PUBLIC DOMAIN', seg(lt, 0.6, 1));
  }, { trans: 'leak' });
  cue(w('napoleon', '1809'), 'boom', 0.8); cue(w('napoleon', 'sits'), 'thud', 0.6);

  // the cheating, move by move: the white knight jumps b1→b3 in a straight line (illegal)
  const KN = NT[0].pieces.find(p => p.sq === 'b1').id;
  const ill1 = w('illegal', 'illegal') - 0.35, backT = w('back', 'back') - 0.5, ill2 = s('again'), awayT = w('again', 'away') - 0.55;
  const [b1x, b1z] = sqXZ('b1'), [b3x, b3z] = sqXZ('b3');
  const knightAt = t => {
    if (t < ill1) return { x: b1x, z: b1z };
    if (t < backT) { const u = seg(t, ill1, ill1 + 0.45, ease.inOut); return { x: b1x, z: lerp(b1z, b3z, u), y: Math.sin(u * PI) * 0.25 }; }
    if (t < ill2) { const u = seg(t, backT, backT + 0.5, ease.inOut); return { x: b1x, z: lerp(b3z, b1z, u), y: Math.sin(u * PI) * 0.6 }; }
    if (t < awayT) { const u = seg(t, ill2, ill2 + 0.45, ease.inOut); return { x: b1x, z: lerp(b1z, b3z, u), y: Math.sin(u * PI) * 0.25 }; }
    const u = seg(t, awayT, awayT + 0.6, ease.inOut);
    return { x: lerp(b1x, -0.75, u), z: lerp(b3z, 2.5, u), y: Math.sin(u * PI) * 1.2 - 0.35 * u };
  };
  const cheatPieces = t => piecesAt(NT, 0).map(p => p.id === KN ? { ...p, ...knightAt(t), glow: t > ill1 && t < ill1 + 2.5 ? C.red : null } : p);
  const turkHand = t => {
    const r1 = seg(t, backT - 0.25, backT + 0.75), r2 = seg(t, awayT - 0.25, awayT + 0.85);
    if (r1 > 0 && r1 < 1) { const k = knightAt(t); return { x: k.x, z: k.z, y: (k.y || 0) + 0.9, u: Math.sin(PI * r1), hold: true }; }
    if (r2 > 0 && r2 < 1) { const k = knightAt(t); return { x: k.x, z: k.z, y: (k.y || 0) + 0.9, u: Math.sin(PI * r2), hold: true }; }
    return null;
  };
  const napHand = t => {
    for (const t0 of [ill1, ill2]) { const r = seg(t, t0 - 0.2, t0 + 0.7); if (r > 0 && r < 1) { const k = knightAt(t); return { x: k.x, z: k.z, y: (k.y || 0) + 0.9, u: Math.sin(PI * r), hold: true }; } }
    return null;
  };
  // S12 — he makes an illegal move
  shot(s('illegal') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: -0.7, pitch: 0.5, dist: 7.5, cy: H * 0.5, target: [1.6, 0.3, 2.2] }], [len(sh), { yaw: -0.45, pitch: 0.55, dist: 6.6 }]], { opp: 'napoleon', oppE: { ...EXPR.smug, look: [-0.4, 1] }, oppReach: napHand(t), pieces: cheatPieces(t), dof: 1.6, turkE: 'focus' });
    const a = seg(t, ill1 + 0.45, ill1 + 0.6);
    if (a > 0) { B.highlight(g, 'b3', C.red, 0.55 * a); B.laser(g, 'b1', 'b3', C.red, a, 0.4); }
    const kp = B.project(b3x, 1.4, b3z);
    stamp(g, 'ILLEGAL', kp.x, kp.y - 120, lt, ill1 + 0.5 - (s('illegal') - 0.05), { size: 70, rot: -0.12 });
  }, { trans: 'whip' });
  cue(ill1 + 0.45, 'clack', 0.9); cue(ill1 + 0.5, 'buzz', 0.9);
  // S13 — the Turk puts the piece back
  shot(s('back') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: -0.3, pitch: 0.3, dist: 9, cy: H * 0.46, target: [3, 1.6, 5.5] }], [len(sh), { yaw: -0.05, pitch: 0.28, dist: 8 }]], { turkE: { ...EXPR.focus, shake: 0.15 }, reach: turkHand(t), pieces: cheatPieces(t), dof: 1.6 });
    const tp = B.project(4, 4.6, 9.4);
    if (t > backT) badge(g, '↩ b1', tp.x, tp.y - 40, { color: C.blue, size: 36, a: seg(t, backT + 0.4, backT + 0.6) * (1 - seg(t, s('again') - 0.2, s('again'))) });
  }, { trans: 'whip', whipDir: -1 });
  cue(backT, 'whirr', 0.8); cue(backT + 0.5, 'clack', 0.9);
  // S14 — he tries again; the Turk takes the piece away
  shot(s('again') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: 0.35, pitch: 0.65, dist: 9.5, cy: H * 0.5, target: [1.4, 0, 3] }], [len(sh), { yaw: -0.1, pitch: 0.6, dist: 8.6 }]], { turkE: { ...EXPR.angry, look: [-1, 0.6] }, reach: turkHand(t), opp: 'napoleon', oppE: t > awayT ? { ...EXPR.shock } : 'smug', oppReach: napHand(t), pieces: cheatPieces(t), dof: 1.4 });
    if (t > awayT + 0.6) { const p = B.project(-0.75, 0.4, 2.5); xMark(g, p.x, p.y, 70, C.red, seg(t, awayT + 0.6, awayT + 0.8)); }
  }, { trans: 'zoom' });
  cue(ill2 + 0.45, 'clack', 0.8); cue(awayT, 'whirr', 0.7); cue(awayT + 0.6, 'thud', 0.8);
  // S15 — a third time… (Napoleon, close, reaching again)
  shot(s('third') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [0.25, 0.1], dist: [7.6, 6.2], pitch: [0.14, 0.1], cy: H * 0.42 }), { blur: 7, opp: 'napoleon', oppE: { ...EXPR.smug, browTilt: 0.7, look: [0.3, 1] }, pieces: piecesAt(NT, 0).filter(p => p.id !== KN), dof: 2.2, e: ease.out });
    badge(g, '×3', W / 2, 330, { color: C.red, size: 80, a: seg(lt, 0.1, 0.3), scale: lerp(1.6, 1, seg(lt, 0.1, 0.35, ease.back)) });
  }, { trans: 'zoom' });
  cue(s('third'), 'heartbeat', 0.7);

  // S16 — the Turk sweeps every piece off the board (physics, slow-motion)
  const sweepT = w('sweep', 'sweeps') - 0.05;
  const flyers = piecesAt(NT, 0).filter(p => p.id !== KN).map((p, i) => {
    const r = rng(i * 13 + 5), [x, z] = sqXZ(p.sq);
    return { ...p, x0: x, z0: z, t0: sweepT + (8 - z) * 0.04 + r() * 0.05, vx: 5 + r() * 6, vz: (r() - 0.5) * 5, vy: 3 + r() * 5, spin: (r() - 0.5) * 14 };
  });
  const sweptAt = (t, slow = 1) => flyers.map(f => {
    const dt = Math.max(0, (t - f.t0) * slow);
    if (dt <= 0) return { ...f, x: f.x0, z: f.z0 };
    let y = f.vy * dt - 9 * dt * dt; const x = f.x0 + f.vx * dt, z = f.z0 + f.vz * dt;
    const onTable = x > -1.1 && x < 9.1 && z > -1.1 && z < 9.1;
    y = Math.max(y, onTable ? 0 : FLOOR_Y + 0.2);
    return { ...f, x, y, z, rot: f.spin * Math.min(dt, 0.9) };
  });
  shot(s('sweep') - 0.05, (g, lt, t, sh) => {
    const u = seg(t, sweepT - 0.15, sweepT + 0.45);
    turkSet(g, lt, t, [[0, { yaw: -0.95, pitch: 0.42, dist: 13, cy: H * 0.5, target: [5, 0.5, 4] }], [len(sh), { yaw: -0.6, pitch: 0.36, dist: 11.5 }]], {
      turkE: t > sweepT ? { ...EXPR.angry, open: 0.5, mouth: 'grit' } : 'angry', opp: 'napoleon', oppE: t > sweepT + 0.2 ? { ...EXPR.shock, shake: 0.8 } : 'smug',
      reach: u > 0 && u < 1 ? { x: lerp(-0.5, 9, u), z: 6, y: 0.8, u: Math.sin(PI * u), hold: true } : null, pieces: sweptAt(t, 0.6), dof: 1.2, shake: 2,
    });
    if (t > sweepT) speedlines(g, W / 2, H * 0.45, t, { a: 0.45 * (1 - seg(t, sweepT + 0.3, sweepT + 1)), color: '#FFE3C8' });
    flash(g, 0.35 * pulse(t, sweepT + 0.1, 0.2), '#FFF1DA');
  }, { trans: 'whip' });
  cue(sweepT, 'scatter', 1); cue(sweepT, 'boom', 0.9); cue(sweepT + 0.1, 'hit', 0.6);

  // S17 — then it checkmates him (the real ending: 22...Ng1 23.Nc3 Bxc3+ 24.bxc3 Qe2#)
  const mateT = w('mate', 'checkmates') + 0.2;
  const fin = new Moves(B, NT, [{ k: 44, t0: s('mate') - 0.05, dur: 0.3 }, { k: 45, t0: s('mate') + 0.3, dur: 0.3 }, { k: 46, t0: s('mate') + 0.62, dur: 0.3, color: C.red },
    { k: 47, t0: mateT - 0.75, dur: 0.3 }, { k: 48, t0: mateT - 0.4, dur: 0.4, color: C.red, label: '24...Qe2#', labelColor: C.lime }], { dur: 0.3 });
  fin.cues(cue);
  shot(s('mate') - 0.1, (g, lt, t, sh) => {
    const m = fin.current(t), mated = t >= mateT;
    turkSet(g, lt, t, [[0, { yaw: 0.35, pitch: 0.85, dist: 9.5, cy: H * 0.5, target: [4, 0, 2] }], [len(sh), { yaw: 0.05, pitch: 0.9, dist: 7.8 }]], {
      turkE: mated ? { ...EXPR.smug, nod: 0.5 } : 'focus', opp: 'napoleon', oppE: mated ? { ...EXPR.shock } : 'worried', bump: fin.bump(t) * 1.5,
      reach: m && m.k % 2 === 0 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.75 } : null, over: mated ? { light: C.lime, lightA: 0.45 } : null,
    });
    fin.draw(g, t, { dof: 1.2 });
    if (mated) {
      const q = seg(t, mateT, mateT + 0.3);
      B.dots(g, C.red, 0.8 * q, ['d1', 'd2', 'f1', 'f2']);
      for (const sq of ['d1', 'd2', 'f1', 'f2']) { const [x, z] = sqXZ(sq), p = B.project(x, 0.05, z); xMark(g, p.x, p.y, p.s * 0.42 * (1 + 0.4 * (1 - ease.back(q))), C.red, q); }
      const kp = B.project(4.5, 0.8, 0.5); target(g, kp.x, kp.y, 90, t, C.red, q);
      flash(g, 0.55 * pulse(t, mateT, 0.25), '#E6FFC8');
    }
  }, { trans: 'zoom' });
  cue(mateT, 'boom', 1.1); cue(mateT, 'hit', 0.9);
  // S18 — fair and square (the Turk, smug, gold glint)
  shot(s('fair') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(TURK, len(sh), { yaw: [-0.3, 0.12], dist: [7.6, 6.6], pitch: [0.12, 0.1], cy: H * 0.44 }), { blur: 6, turkE: { ...EXPR.smug, browTilt: 0.6, nod: 0.4 }, pieces: piecesAt(NT, 48), dof: 2.2, over: { light: C.gold, lightA: 0.5 } });
    const p = B.project(4, 3.1, 9.4);
    glint(g, p.x + 90 * p.s / 100, p.y - 30 * p.s / 100, t, w('fair', 'square'), { r: 200, color: C.gold });
  }, { trans: 'whip' });
  cue(w('fair', 'square'), 'sparkle', 0.8);

  // S19 — except… the Turk had a secret: the lights die, we creep toward the cabinet
  const secT = w('secret', 'secret');
  shot(s('secret') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: 0.15, pitch: 0.12, dist: 12, cy: H * 0.55, target: [4, -1.2, 0] }], [len(sh), { yaw: 0.02, pitch: 0.08, dist: 8.5 }]], {
      style: 'dark', over: { light: C.red, lightA: 0.18 }, turkE: { ...EXPR.neutral, lid: 0.35 }, pieces: piecesAt(NT, 48), dof: 1.4, e: lin,
    });
    const tp = B.project(4, 3.1, 9.4), ga = seg(t, secT - 0.1, secT + 0.2);
    if (ga > 0) for (const sd of [-1, 1]) { g.save(); g.globalAlpha = ga; g.fillStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 30; g.beginPath(); g.ellipse(tp.x + sd * 38 * tp.s / 100, tp.y - 2 * tp.s / 100, 12 * tp.s / 100, 6 * tp.s / 100, 0, 0, 7); g.fill(); g.restore(); }
    const c = B.project(4, -1.8, -0.62);  // light leaking through the door seams
    g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, 260); gr.addColorStop(0, rgba('#FFC04A', 0.35 * seg(t, secT - 0.3, secT + 0.3))); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }, { trans: 'fade', transDur: 0.35, vig: 0.85 });
  cue(secT, 'sting', 0.9); cue(s('secret'), 'heartbeat', 0.8);

  // S20a — x-ray: the fake gears, and a chess master hiding behind them with a candle
  const masterT = w('inside', 'master');
  shot(s('inside') - 0.05, (g, lt, t, sh) => {
    const xr = seg(t, s('inside') + 0.1, s('inside') + 0.6);
    turkSet(g, lt, t, [[0, { yaw: -0.35, pitch: 0.06, dist: 9.5, cy: H * 0.5, target: [4.2, -1.4, 0] }], [len(sh), { yaw: 0.15, pitch: 0.05, dist: 7.6 }]], {
      style: 'dark', over: { light: '#7FE3FF', lightA: 0.12 }, turkE: { ...EXPR.neutral, lid: 0.3 }, pieces: piecesAt(NT, 48), dof: 1.4, e: lin, xray: xr,
      inside: g2 => {
        g2.fillStyle = rgba('#14476E', 0.8 * xr); g2.fillRect(0, 0, W, H);
        const ma = seg(t, masterT - 0.5, masterT);
        const cp = B.project(7.4, -2.75, 2.2); pool(g2, B, 7.4, -2.2, 2.2, 3.5, '#FFC04A', 0.5 * xr, true);
        actor(g2, B, 'operator', { x: 5.2, y: -1.3, z: 2.4, k: 0.55, e: { ...EXPR.focus, look: [-0.5, -0.6] }, t, alpha: ma });
        candle(g2, cp.x, cp.y, cp.s / 150, t);
      },
    });
    const fg = seg(t, w('inside', 'fake') - 0.05, w('inside', 'fake') + 0.2);
    for (const [x, y] of [[0.9, -1.6], [2.2, -2.2]]) { const p = B.project(x, y, 0.1); xMark(g, p.x, p.y, p.s * 0.55, C.red, fg); }
    const mp = B.project(5.2, 0.2, 2.4);
    if (t > masterT) badge(g, 'CHESS MASTER', mp.x, mp.y - 60, { color: C.gold, size: 34, a: seg(t, masterT, masterT + 0.2), scale: lerp(1.5, 1, seg(t, masterT, masterT + 0.25, ease.back)) });
  }, { trans: 'zoom', vig: 0.75 });
  cue(s('inside') + 0.1, 'static', 0.6); cue(w('inside', 'fake'), 'buzz', 0.6); cue(masterT, 'boom', 0.9);
  // S20b — the real 1789 cutaway engraving: the hidden man
  shot(masterT + 0.75, (g, lt, t) => {
    photoFull(g, P.racknitz3, lt, { fx: 0.62, fy: 0.72, zoom: [1.35, 1.6], dur: 2.5, tone: 'sepia', credit: 'J. F. ZU RACKNITZ, 1789 · PUBLIC DOMAIN' });
    const a = seg(lt, 0.2, 0.4);
    g.save(); g.globalAlpha = a; g.strokeStyle = C.gold; g.lineWidth = 6; g.shadowColor = C.gold; g.shadowBlur = 20;
    g.beginPath(); g.ellipse(W * 0.5, H * 0.52, 240, 300, 0, 0, 7); g.stroke(); g.restore();
    badge(g, 'THE REAL DRAWING · 1789', W / 2, 300, { color: C.gold, size: 32, a });
  }, { trans: 'flash' });

  // S21 — how it worked: magnets, a candle, a lever (blueprint)
  const mgT = w('how', 'Magnets'), cdT = w('how', 'candle'), lvT = w('how', 'lever');
  shot(s('how') - 0.1, (g, lt, t) => {
    g.fillStyle = '#0A2440'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(160,210,255,0.08)'; g.lineWidth = 2;
    for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const line = '#CFE8FF', X0 = 140, X1 = 940, YT = 820, YB = 1440;
    g.save(); g.translate(0, (1 - seg(lt, 0, 0.4, ease.out)) * 60);
    g.strokeStyle = line; g.lineWidth = 5; g.lineJoin = 'round';
    g.strokeRect(X0, YT, X1 - X0, YB - YT);                                  // cabinet
    g.strokeRect(X0 - 30, YT - 30, X1 - X0 + 60, 30);                        // top / board
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(207,232,255,0.25)' : 'rgba(207,232,255,0.05)'; g.fillRect(X0 + 80 + i * 80, YT - 30, 80, 30); }
    // the Turk on top
    g.beginPath(); g.arc(540, 520, 70, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(540, 455, 85, 40, 0, PI, 0); g.stroke();
    g.beginPath(); g.moveTo(420, 790); g.quadraticCurveTo(420, 620, 540, 600); g.quadraticCurveTo(660, 620, 660, 790); g.stroke();
    // magnets: iron discs hanging under every square, one jumps when a piece moves above it
    const ma = seg(t, mgT - 0.1, mgT + 0.25);
    for (let i = 0; i < 8; i++) {
      const x = X0 + 120 + i * 80, jump = i === 5 ? Math.abs(Math.sin((t - mgT) * 6)) * 26 * ma : 0;
      g.strokeStyle = rgba(line, 0.5 + 0.5 * ma); g.beginPath(); g.moveTo(x, YT); g.lineTo(x, YT + 50 - jump); g.stroke();
      g.fillStyle = ma > 0 ? rgba(C.blue, 0.9) : 'rgba(0,0,0,0)'; g.beginPath(); g.arc(x, YT + 62 - jump, 12, 0, 7); g.fill(); g.stroke();
    }
    // operator seated inside, holding the lever
    g.strokeStyle = line; g.beginPath(); g.arc(470, 1110, 46, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(470, 1156); g.lineTo(470, 1300); g.lineTo(560, 1300); g.lineTo(560, 1420); g.stroke();
    const la = seg(t, lvT - 0.1, lvT + 0.25), sw = Math.sin((t - lvT) * 3) * 0.25 * la;
    g.beginPath(); g.moveTo(470, 1200); g.lineTo(620, 1180); g.stroke();
    g.save(); g.translate(620, 1180); g.rotate(-1.2 + sw); g.strokeStyle = la > 0 ? C.lime : line; g.lineWidth = la > 0 ? 8 : 5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -340); g.stroke(); g.restore();
    if (la > 0) { g.strokeStyle = rgba(C.lime, la); g.setLineDash([14, 10]); g.beginPath(); g.moveTo(620 + Math.sin(-1.2 + sw) * 340, 1180 - Math.cos(-1.2 + sw) * 340); g.lineTo(660, 700); g.lineTo(760, 760); g.stroke(); g.setLineDash([]); }
    // candle with a smoke tube up through the Turk's turban
    const ca = seg(t, cdT - 0.1, cdT + 0.25);
    if (ca > 0) {
      candle(g, 330, 1300, 0.9, t);
      g.strokeStyle = rgba(C.gold, ca); g.setLineDash([10, 10]); g.lineDashOffset = -t * 60;
      g.beginPath(); g.moveTo(330, 1180); g.lineTo(330, 900); g.lineTo(540, 640); g.lineTo(540, 440); g.stroke(); g.setLineDash([]);
    }
    g.restore();
    const lbl = (txt, x, y, col, t0) => { const a = seg(t, t0, t0 + 0.2); if (a > 0) badge(g, txt, x, y, { color: col, size: 40, a, scale: lerp(1.5, 1, seg(t, t0, t0 + 0.25, ease.back)) }); };
    lbl('MAGNETS', 760, 720, C.blue, mgT); lbl('CANDLE', 300, 1530, C.gold, cdT); lbl('LEVER', 790, 1060, C.lime, lvT);
    glowText(g, 'HOW THE TURK WORKED', W / 2, 220, { font: mono(36, 800), fill: '#CFE8FF', glow: 'rgba(0,0,0,0.6)', blur: 8, spacing: 6 });
  }, { trans: 'leak', vig: 0.4 });
  cue(mgT, 'tick', 0.9); cue(cdT, 'lamp', 0.8); cue(lvT, 'ratchet', 0.8);

  // S22 — Charles Babbage lost to it twice (London, 1819)
  shot(s('babbage') - 0.05, (g, lt, t, sh) => {
    turkSet(g, lt, t, orbit(NEAR, len(sh), { side: PI, yaw: [0.35, 0.05], dist: [9.4, 8.4], pitch: [0.16, 0.12], cy: H * 0.5 }), { style: 'cold', blur: 6, opp: 'babbage', oppE: exprAt([[0, 'focus'], [w('babbage', 'twice') - s('babbage'), { ...EXPR.worried, shake: 0.3 }]], lt), pieces: piecesAt(NT, 30), dof: 2 });
    photoCard(g, P.babbage, lt, 0.2, { x: 820, y: 700, w: 280, aspect: 1.35, rot: 0.07, from: 'right', caption: 'BABBAGE · 1860', credit: 'Public domain', fx: 0.5, fy: 0.25, zoom: [1.1, 1.18], dur: 2.5 });
    scoreboard(g, 'THE TURK', 'BABBAGE', t >= w('babbage', 'twice') ? '2' : '1', '0', { y: 330, flashL: pulse(t, w('babbage', 'twice'), 0.4), title: 'LONDON · 1819' });
  }, { trans: 'whip' });
  cue(w('babbage', 'twice'), 'buzz', 0.8); cue(s('babbage') + 0.2, 'shutter', 0.6);
  // S23 — later, he designed the first computer: the Analytical Engine as a wall of turning gears
  const compT = w('computer', 'computer');
  shot(s('computer') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.45, pitch: 0.1, dist: 14, cy: H * 0.5, target: [4, 1.5, 5] }], [len(sh), { yaw: 0.35, pitch: 0.16, dist: 12 }]], { t, e: lin });
    room(g, B, 'cold', { t, over: { light: '#B8E6FF', lightA: 0.3 } });
    box(g, B, [-0.5, FLOOR_Y, 4.4], [8.5, FLOOR_Y + 0.6, 6], { top: '#3A3F44', side: '#25292D', front: '#2E3338' });
    for (let c = 0; c < 6; c++) for (let r = 0; r < 6; r++) {
      const x = 0.6 + c * 1.35, y = -2.2 + r * 1.15, dir = (c + r) % 2 ? 1 : -1;
      gear(g, B, x, y, 5, 0.62, { teeth: 10, angle: t * 2.2 * dir + c, color: (c + r) % 3 ? '#B8893A' : '#D9A94E' });
    }
    for (let c = 0; c < 6; c++) box(g, B, [0.55 + c * 1.35, FLOOR_Y + 0.6, 5.1], [0.65 + c * 1.35, 4.8, 5.2], { top: '#8E99A3', side: '#5E6870', front: '#7A858E' });
    badge(g, 'THE FIRST COMPUTER', W / 2, 330, { color: C.blue, size: 46, sub: 'ANALYTICAL ENGINE · 1837', a: seg(t, compT - 0.1, compT + 0.15), scale: lerp(1.6, 1, seg(t, compT - 0.1, compT + 0.2, ease.back)) });
  }, { trans: 'leak' });
  cue(s('computer'), 'whirr', 0.8); cue(compT, 'shimmer', 0.8);

  // S24 — 1854, Philadelphia: a fire in the museum where the Turk ended up
  const fireT = w('fire', 'fire');
  const burnSet = (g, lt, t, keys, { blur = 0, turkE = 'neutral', intensity = 1 } = {}) => {
    const k = intensity * seg(t, fireT - 0.2, fireT + 1.2);
    rig(B, lt, keys, { t, shake: 1 + k });
    const env = room(g, B, 'dark', { t, blur, over: { light: '#FF7A30', lightA: 0.15 + 0.45 * k * (0.85 + 0.15 * Math.sin(t * 13)) } });
    for (const [x, z, sc, sd] of [[-4, 11.5, 1.6, 1], [12, 10.5, 1.4, 2], [0.5, 12.2, 1.9, 3], [8, 12.2, 1.7, 4], [-6, 6, 1.3, 5], [15, 6, 1.5, 6]])
      placeAt(B, x, FLOOR_Y, z, (px, py, s) => flames(g, px, py, s * sc, t, { seed: sd, a: k }));
    for (const [x, z] of [[-5, 2], [13, 2]]) box(g, B, [x - 1.2, FLOOR_Y, z - 1], [x + 1.2, 0.5, z + 1], { top: '#2A2018', side: '#16110C', front: '#20180F' });  // exhibit cases
    const ht = seated(g, B, 'turk', turkE, t, { z: 9.4 });
    cabinet(g, B, { t }); B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); ht();
    B.drawPieces(g, piecesAt(NT, 0), { focus: B.dist, dof: 1.4 });
    for (const [x, z, sc, sd] of [[-2.5, -2.5, 1.2, 7], [10.5, -1.5, 1.4, 8]]) placeAt(B, x, FLOOR_Y, z, (px, py, s) => flames(g, px, py, s * sc, t, { seed: sd, a: k * seg(t, fireT + 0.4, fireT + 1.2) }));
    embers(g, t, { n: 70, a: k });
  };
  shot(s('fire') - 0.05, (g, lt, t, sh) => {
    burnSet(g, lt, t, [[0, { yaw: 0.6, pitch: 0.3, dist: 15, cy: H * 0.5, target: [4, 1, 5] }], [len(sh), { yaw: 0.2, pitch: 0.24, dist: 12.5 }]]);
    placeStamp(g, lt, 'Philadelphia', '1854', { y: 160, t0: 0.05 });
  }, { trans: 'leak', vig: 0.7 });
  cue(w('fire', '1854'), 'boom', 0.7); cue(fireT, 'fire', 1.0); cue(fireT + 1.6, 'fire', 0.9);
  // S25 — the Turk burns
  shot(s('burns') - 0.05, (g, lt, t, sh) => {
    burnSet(g, lt, t, orbit(TURK, len(sh), { yaw: [-0.25, 0.1], dist: [8, 6.6], pitch: [0.1, 0.06], cy: H * 0.44 }), { blur: 4, turkE: exprAt([[0, { ...EXPR.sad }], [0.8, { ...EXPR.sad, lid: 0.85 }]], lt), intensity: 1.2 });
    placeAt(B, 4, -0.4, 6.5, (px, py, sc) => flames(g, px, py, sc * 2.4, t, { seed: 11, n: 9 }));
  }, { trans: 'fade', transDur: 0.3, vig: 0.75 });
  cue(s('burns'), 'fire', 1.0); cue(w('burns', 'burns'), 'thud', 0.7);

  // S26 — today: an "AI" screen… and the people behind it
  const humT = w('amazon', 'humans');
  shot(s('amazon') - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.1, pitch: 0.05, dist: 10.5, cy: H * 0.46, target: [4, -0.2, 6] }], [humT - s('amazon') - 0.1, { yaw: 0.04, pitch: 0.06, dist: 10 }],
      [humT - s('amazon') + 1.3, { yaw: 0.3, pitch: 0.85, dist: 11, target: [4, -0.5, 10], cy: H * 0.5 }], [len(sh) + 1.3, { yaw: 0.45, pitch: 0.9, dist: 10.5 }]], { t });
    room(g, B, 'dark', { t, over: { light: '#6CB8FF', lightA: 0.25 } });
    // the people doing the work, hidden behind a wall with an "AI" screen on it; the camera cranes up over the wall
    const list = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) list.push([-1.5 + c * 2.9, 8.6 + r * 1.6, r, c]);
    list.sort((p, q) => B.toCam(q[0], 0, q[1])[2] - B.toCam(p[0], 0, p[1])[2]);
    for (const [x, z, r, c] of list) {
      actor(g, B, 'operator', { x, y: 0.5, z, k: 0.6, e: { ...EXPR.tired, look: [0, 1] }, t: t + r + c, face: -1 });
      box(g, B, [x - 0.8, FLOOR_Y, z - 1.0], [x + 0.8, -1.3, z - 0.55], { top: '#2A3036', side: '#15191C', front: '#1E2328' });
      box(g, B, [x - 0.45, -1.3, z - 0.95], [x + 0.45, -0.6, z - 0.88], { top: '#6CB8FF', side: '#2A4A6A', front: '#9AD0FF' });
    }
    box(g, B, [-9, FLOOR_Y, 6], [17, 2.4, 6.4], { top: '#2A323C', side: '#151A20', front: '#10151B' });
    picture(g, B, UI, [0.7, 2.0, 5.98], [7.3, 2.0, 5.98], [0.7, -2.4, 5.98], { tone: 'warm', border: '#6CB8FF', pad: 0.12, glow: 0.6 });
    placeStamp(g, lt, 'Today', '', { y: 160, t0: 0.05 });
    if (t > humT) badge(g, 'HUMANS INSIDE', W / 2, 330, { color: C.red, size: 48, a: seg(t, humT + 0.3, humT + 0.5), scale: lerp(1.5, 1, seg(t, humT + 0.3, humT + 0.55, ease.back)) });
  }, { trans: 'leak' });
  cue(s('amazon'), 'shimmer', 0.6); cue(humT + 0.2, 'whoosh', 0.7); cue(humT + 0.4, 'sting', 0.6);

  // S27 — "They named it… Mechanical Turk." Back in the palace with the Turk (loop to the opening)
  const nameT = w('name', 'Mechanical');
  shot(s('name') - 0.1, (g, lt, t, sh) => {
    turkSet(g, lt, t, [[0, { yaw: 0.2, pitch: 0.12, dist: 7, cy: H * 0.46, target: [4, 2.6, 9] }], [len(sh), { yaw: -0.45, pitch: 0.4, dist: 13.5 }]], { turkE: { ...EXPR.smug, nod: 0.3 }, pieces: piecesAt(NT, 48), dof: 1.4 });
    const a = seg(t, nameT - 0.15, nameT + 0.3, ease.out), sc = lerp(1.35, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 300); g.scale(sc, sc); g.translate(-W / 2, -300);
    glowText(g, 'MECHANICAL', W / 2, 250, { font: serif(96, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    glowText(g, 'TURK', W / 2, 350, { font: serif(120, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    g.restore();
    glowText(g, '1770 · THE AUTOMATON   ·   2005 · AMAZON', W / 2, 420, { font: mono(24, 800), fill: C.cream, glow: 'rgba(0,0,0,0.8)', blur: 8, spacing: 3, a: seg(t, nameT + 0.4, nameT + 0.8) });
    glint(g, W / 2 + 250, 230, t, nameT + 0.2, { r: 220, color: C.gold });
  }, { trans: 'flash' });
  cue(nameT, 'boom', 1); cue(nameT, 'shimmer', 0.8);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);

  const music = [
    { t: 0, m: 'clockwork' }, { t: s('hook3') - 0.05, m: 'paranoia' }, { t: s('vienna') - 0.1, m: 'court' }, { t: s('arm') - 0.05, m: 'drop' }, { t: winT, m: 'hit' },
    { t: s('tour'), m: 'court' }, { t: s('napoleon') - 0.05, m: 'tension' }, { t: s('third') - 0.05, m: 'drop' }, { t: sweepT, m: 'hit' }, { t: s('mate') - 0.1, m: 'tension' },
    { t: mateT, m: 'glory' }, { t: s('secret') - 0.1, m: 'drop' }, { t: s('inside') - 0.05, m: 'paranoia' }, { t: s('how') - 0.1, m: 'clockwork' }, { t: s('babbage') - 0.05, m: 'intrigue' },
    { t: s('fire') - 0.1, m: 'inferno' }, { t: s('amazon') - 0.2, m: 'drop' }, { t: s('amazon'), m: 'digital' }, { t: s('name') - 0.3, m: 'drop' }, { t: nameT, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  return { shots, cues, music, tvOff, duration: T.duration };
}
