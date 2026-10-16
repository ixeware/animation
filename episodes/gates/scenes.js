// Bill Gates vs Magnus Carlsen (Skavlan talk show, recorded in London, January 2014): Gates had White and two
// minutes, Magnus thirty seconds; Magnus knocked over a pawn on move 2, left a knight "free" on e5, Gates took the
// bishop (the engine had him winning), then took the knight — 9...Qh2#. Magnus used twelve seconds.
// The first episode in LOOK v2 (engine/js/look.js): slate board, low-key light, close framing, quiet text.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { counter, badge, placeStamp, nameTitle, sans, mono, serif } from '../../engine/js/hud.js';
import { rig, seated, diveOut, riseIn } from '../../engine/js/stage.js';
import { box, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { spotCone, bokeh, lowKey } from '../../engine/js/light.js';
import { moveUnder, moveOver, playRun, brilliantSquare, SLIDE, MOVE_HIT, BOOM_HIT } from '../../engine/js/movefx.js';

useLookV2();
const G = await fetch('../engine/data/gates_carlsen_2014.json').then(r => r.json());
G[14].san = 'Ne5!!';  // the bait: Magnus leaves the knight to be taken (shown as a brilliant move, as in the reference)
const PHOTO = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = '../episodes/gates/photos/bill_gates_2013.jpg'; });
const B = new Board();
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const RED = '#E0503F', TEAL = '#3FE0C5', GOLD = '#E9B654';

// ---------- the studio: a blurred backdrop (painted once), the game table, stage light ----------
const BACK = (() => {
  const w = 1800, h = 1500, c = makeCanvas(w, h), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#12171C'); bg.addColorStop(0.55, '#1C252C'); bg.addColorStop(1, '#13181D');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 70) {  // drape folds
    const fg = g.createLinearGradient(x, 0, x + 70, 0); fg.addColorStop(0, 'rgba(0,0,0,0.3)'); fg.addColorStop(0.5, 'rgba(120,150,170,0.06)'); fg.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = fg; g.fillRect(x, 0, 70, h * 0.78);
  }
  const wy = h * 0.78;  // a low, dark wooden stage wall
  const wg = g.createLinearGradient(0, wy, 0, h); wg.addColorStop(0, '#5E4A3A'); wg.addColorStop(1, '#3A2E25');
  g.fillStyle = wg; g.fillRect(0, wy, w, h - wy); g.fillStyle = '#7A6450'; g.fillRect(0, wy - 8, w, 12);
  g.strokeStyle = 'rgba(20,14,8,0.45)'; g.lineWidth = 5; for (let x = 30; x < w; x += 190) g.strokeRect(x, wy + 40, 150, h - wy - 80);
  for (const [x, s] of [[110, 1], [w - 150, -1]]) {  // potted palms at the sides
    g.save(); g.translate(x, wy - 8); g.scale(s, 1);
    g.fillStyle = '#4A3426'; g.fillRect(-46, -10, 92, 120); g.fillStyle = '#26402E';
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.32; g.beginPath(); g.ellipse(Math.cos(a) * 110, -40 + Math.sin(a) * 150, 130, 26, a, 0, 7); g.fill(); }
    g.restore();
  }
  for (let i = 0; i < 7; i++) {  // a row of warm practical lamps along the top of the set
    const x = 160 + i * 250, gr = g.createRadialGradient(x, 120, 0, x, 120, 90); gr.addColorStop(0, 'rgba(255,214,160,0.9)'); gr.addColorStop(1, 'rgba(255,214,160,0)');
    g.fillStyle = gr; g.fillRect(x - 90, 30, 180, 180);
  }
  const out = makeCanvas(w, h), o = out.getContext('2d'); o.filter = 'blur(11px)'; o.drawImage(c, 0, 0); return out;
})();
function backdrop(g, t, { dim = 0 } = {}) {
  const ox = -Math.sin(B.yaw) * 700, oy = (B.pitch - 0.3) * 520;
  g.drawImage(BACK, -360 + ox, -120 + oy, W + 720, (W + 720) * BACK.height / BACK.width);
  bokeh(g, t, { n: 12, seed: 4, y0: 0.04, y1: 0.4, a: 0.14, size: [30, 80] });
  if (dim) { g.fillStyle = `rgba(4,6,9,${dim})`; g.fillRect(0, 0, W, H); }
}
// the table: a warm red-brown top around the board, its front edge and a pedestal
function gameTable(g) {
  box(g, B, [3.3, -3.2, 3.3], [4.7, -1.6, 4.7], { top: '#2A1610', side: '#1E100B', front: '#24130D' });
  box(g, B, [-1.4, -1.6, -1.4], [9.4, -0.35, 9.4], { top: '#6E3A28', side: '#3A1E14', front: '#4E2A1C' });
  if (depth(4, 0, 4) > 0.5) pool(g, B, 4, -0.33, 4, 7, '#FFE8C8', 0.2);
}
// the digital blitz clock on the table, at the side of the board (3D): two LCD windows
function tableClock(g, l, r, { x = 9.0, z = 4, hot = null } = {}) {
  if (depth(x, 0, z) < 0.8) return;
  box(g, B, [x - 0.35, -0.35, z - 1.1], [x + 0.35, 0.35, z + 1.1], { top: '#2A2E33', side: '#16191C', front: '#202428' });
  const face = B.E[0] < x ? -1 : 1;  // which long face looks at the camera
  for (const [dz, txt, k] of [[-0.55, l, 'l'], [0.55, r, 'r']]) {
    const p = B.project(x + face * 0.36, 0.05, z + dz); if (p.z < 0.6) continue;
    const s = p.s, w = s * 0.62, h = s * 0.3;
    g.save(); g.fillStyle = '#9FB0A0'; g.fillRect(p.x - w / 2, p.y - h / 2, w, h);
    g.fillStyle = hot === k ? '#B3261E' : '#1E2622'; g.font = mono(Math.max(8, h * 0.72), 800); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, p.x, p.y + h * 0.04); g.restore();
  }
}
// the two players: Magnus behind the black pieces (far side), Gates behind the white pieces (near side)
function boardScene(g, lt, t, keys, { pieces, run = null, mE = 'focus', gE = 'focus', gHands = true, mHands = true, mReach = null, gReach = null, mHide = false,
  dof = 1.4, focus = null, spot = [4, 4], clock = null, extraUnder = null, extraOver = null, ez = ease.inOut, labels = true } = {}) {
  rig(B, lt, keys, { t, e: ez });
  backdrop(g, t);
  const hm = seated(g, B, 'magnus14', mE, t, { z: 9.4, hands: mHands, reach: mReach, side: mReach?.side ?? 1, alpha: mHide ? 0 : 1 });
  const hg = seated(g, B, 'gates', gE, t, { z: -1.4, face: 1, hands: gHands, reach: gReach, side: gReach?.side ?? 1 });
  gameTable(g);
  if (clock) tableClock(g, clock[0], clock[1], { hot: clock[2] });
  B.drawSlab(g, SLATE);
  if (run) run.active.forEach(a => moveUnder(g, B, a.m, a.lt, { hold: a.hold }));
  if (extraUnder) extraUnder();
  B.drawPieces(g, run ? run.pieces : pieces, { focus: focus ?? B.dist, dof });
  if (run) run.active.forEach(a => moveOver(g, B, a.m, a.lt, { hold: a.hold, label: labels && a.label }));
  if (extraOver) extraOver();
  hm(); hg();
  spotCone(g, B, { top: [spot[0], 18, spot[1]], base: [spot[0], 0, spot[1]], r0: 0.7, r1: 5.5, a: 0.1, t });
  lowKey(g, { cy: H * 0.42 });
}
// close-up of one player behind the board (the other player's side is the camera's side)
function closeUp(g, lt, t, who, e, { pieces = G[0].pieces.map(p => ({ ...p, ...xz(p.sq) })), push = 0.5, yaw = 0.12, extra = null } = {}) {
  const magnus = who === 'magnus14', tz = magnus ? 9.2 : -1.2, base = magnus ? 0 : Math.PI;
  rig(B, lt, [[0, { yaw: base + yaw, pitch: 0.3, dist: 7.4, fov: 1500, cy: H * 0.46, target: [4, 2.9, tz] }], [3, { yaw: base + yaw * 0.4, dist: 7.4 - push }]], { t });
  backdrop(g, t);
  const h = seated(g, B, who, e, t, magnus ? { z: 9.4 } : { z: -1.4, face: 1 });
  gameTable(g); B.drawSlab(g, SLATE); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 }); h();
  if (extra) extra();
  spotCone(g, B, { top: [4, 18, tz], base: [4, 0, tz], r0: 0.6, r1: 4.5, a: 0.12, t });
  lowKey(g, { cy: H * 0.4 });
}
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
const at = k => G[k].pieces.map(p => ({ ...p, ...xz(p.sq) }));
// where a seated player's head is on screen (for the crown, the sweat)
const headAt = (z, lift = 3.1) => { const p = B.project(4, lift, z); return { x: p.x, y: p.y, s: p.s * 1.05 / 100 }; };

// ---------- props for the inserts ----------
function crown(g, x, y, s, a = 1) {  // a gold crown with three gems, dropped on a head
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const gr = g.createLinearGradient(0, -120, 0, 0); gr.addColorStop(0, '#F6D774'); gr.addColorStop(1, '#C8902E');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-82, 0); g.lineTo(-96, -96); g.lineTo(-46, -50); g.lineTo(0, -118); g.lineTo(46, -50); g.lineTo(96, -96); g.lineTo(82, 0); g.closePath(); g.fill();
  g.fillStyle = '#B07A22'; g.fillRect(-84, -14, 168, 18);
  for (const [cx, cy] of [[-96, -98], [0, -122], [96, -98]]) { g.fillStyle = '#F6D774'; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill(); }
  for (const [cx, col] of [[-44, '#3C6FD0'], [0, '#C8283A'], [44, '#3C6FD0']]) { g.fillStyle = col; g.beginPath(); g.arc(cx, -24, 9, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(-70, -10); g.lineTo(-80, -70); g.lineTo(-62, -52); g.closePath(); g.fill();
  g.restore();
}
// the blitz clock, big, as an insert on the table: two LCD windows, two buttons, name plates
function bigClock(g, t, l, r, { hotL = 0, hotR = 0, y = 860, press = null } = {}) {
  g.save(); g.translate(W / 2, y);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(0, 230, 470, 60, 0, 0, 7); g.fill();
  const body = g.createLinearGradient(0, -200, 0, 220); body.addColorStop(0, '#3A4047'); body.addColorStop(1, '#1C2025');
  g.fillStyle = body; g.beginPath(); g.roundRect(-440, -170, 880, 380, 46); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.roundRect(-430, -162, 860, 60, 30); g.fill();
  for (const [sd, txt, hot, name] of [[-1, l, hotL, 'GATES'], [1, r, hotR, 'CARLSEN']]) {
    const bx = sd * 210, down = press === (sd < 0 ? 'l' : 'r');
    g.fillStyle = '#5A6068'; g.beginPath(); g.roundRect(bx - 90, -230 + (down ? 16 : 0), 180, 70, 16); g.fill();  // button
    g.fillStyle = '#9FB2A2'; g.beginPath(); g.roundRect(bx - 170, -90, 340, 190, 18); g.fill();                       // LCD
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(bx - 160, -80, 320, 10);
    g.fillStyle = hot > 0.5 ? '#A3221B' : '#1D2621'; g.font = mono(140, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, bx, 8); qaRect(g, bx - 170, -90, 340, 190, 'text', 'clock ' + name);
    g.fillStyle = '#E9E2D2'; g.font = sans(30, 800); g.letterSpacing = '6px'; g.fillText(name, bx, 150); g.letterSpacing = '0px';
  }
  g.restore();
}
const fmt = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;
// an insert card on paper: the 2014 rich list with Gates at number one
function richCard(g, lt, t) {
  g.save(); g.translate(W / 2, 760); g.rotate(-0.03); g.scale(0.88, 0.88);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = '#F2ECDF'; g.fillRect(-400, -470, 800, 940); g.shadowColor = 'transparent';
  const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(110,90,60,${r() * 0.05})`; g.fillRect(-400 + r() * 800, -470 + r() * 940, 2, 2); }
  g.fillStyle = '#2A2622'; g.font = serif(46, 700); g.textAlign = 'center'; g.fillText('BILLIONAIRES INDEX', 0, -380); qaRect(g, -330, -420, 660, 50, 'text', 'rich title');
  g.font = sans(24, 800); g.letterSpacing = '7px'; g.fillStyle = '#8E6A2A'; g.fillText('BLOOMBERG · JANUARY 2014', 0, -330); g.letterSpacing = '0px';
  g.fillStyle = '#2A2622'; g.fillRect(-330, -300, 660, 3);
  // number one: a framed portrait
  g.fillStyle = '#E4DCCB'; g.fillRect(-330, -270, 660, 300);
  g.save(); g.beginPath(); g.rect(-310, -255, 230, 270); g.clip(); g.filter = 'sepia(0.15) contrast(1.05)';
  g.drawImage(PHOTO, 330, 0, 1180, 1386, -310, -255, 230, 270); g.restore();
  g.strokeStyle = '#B08A3A'; g.lineWidth = 6; g.strokeRect(-310, -255, 230, 270);
  g.textAlign = 'left'; g.fillStyle = '#2A2622'; g.font = serif(96, 700); g.fillText('1', -50, -110);
  g.font = serif(44, 700); g.fillText('BILL GATES', -50, -40); qaRect(g, -50, -150, 300, 130, 'text', 'rich #1');
  g.font = sans(30, 900); g.fillStyle = '#2E6B3A'; g.fillText('$78.2 BILLION', -50, 4);
  g.font = sans(15, 700); g.fillStyle = '#7A7268'; g.textAlign = 'left'; g.fillText('PHOTO: KEN SHIPP / U.S. DEPT. OF ENERGY, PUBLIC DOMAIN', -310, 44);
  for (let i = 0; i < 4; i++) {  // the rest of the list, out of focus on purpose
    const y = 90 + i * 90; g.fillStyle = 'rgba(42,38,34,0.25)'; g.font = serif(56, 700); g.textAlign = 'left'; g.fillText(String(i + 2), -320, y + 22);
    g.fillRect(-240, y, 300 - i * 40, 16); g.fillRect(-240, y + 30, 160, 10);
  }
  g.restore();
}
// the quote: a newspaper clipping
function clipping(g, lt) {
  g.save(); g.translate(W / 2, 860); g.rotate(0.025);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = '#EDE6D6'; g.fillRect(-410, -360, 820, 720); g.shadowColor = 'transparent';
  const r = rng(8); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(110,90,60,${r() * 0.05})`; g.fillRect(-410 + r() * 820, -360 + r() * 720, 2, 2); }
  g.fillStyle = '#25221E'; g.textAlign = 'left'; g.font = sans(24, 800); g.letterSpacing = '5px'; g.fillText('NRK · JANUARY 2014', -350, -290); g.letterSpacing = '0px';
  g.fillRect(-350, -270, 700, 3);
  g.font = serif(50, 700); g.fillText('CARLSEN ADMITS:', -350, -190); qaRect(g, -350, -240, 700, 400, 'text', 'quote');
  const lines = ['he had to break one of', 'his own principles —', 'not to use cheap', 'tricks to win.'];
  g.font = 'italic 600 52px Georgia, serif';
  lines.forEach((s, i) => { const u = clamp((lt - 0.2 - i * 0.25) / 0.25); g.globalAlpha = u; g.fillText(s, -350, -100 + i * 72); }); g.globalAlpha = 1;
  g.fillStyle = 'rgba(37,34,30,0.25)'; for (let i = 0; i < 3; i++) g.fillRect(-350, 230 + i * 34, 640 - i * 90, 12);
  g.restore();
}
// the engine bar at the left edge: white share from the bottom; text shows the evaluation
function evalBar(g, v, label, a = 1) {
  if (a <= 0) return;
  const x = 52, y0 = 470, h = 760, w = 46, u = clamp(0.5 + Math.atan(v / 2.2) / Math.PI);
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#1B1F23'; g.fillRect(x, y0, w, h); g.fillStyle = '#E9ECEE'; g.fillRect(x, y0 + h * (1 - u), w, h * u);
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.strokeRect(x, y0, w, h);
  g.font = mono(40, 800); g.textAlign = 'left'; g.fillStyle = '#E9ECEE'; g.fillText(label, x + w + 16, y0 + h * (1 - u) + 14);
  g.font = mono(22, 800); g.fillStyle = 'rgba(233,236,238,0.6)'; g.fillText('ENGINE', x, y0 - 18);
  qaRect(g, x, y0 - 40, w + 140, h + 40, 'text', 'eval');
  g.restore();
}
// silhouettes of the studio audience along the bottom of a wide shot
function audience(g, t, { y = H - 150, n = 9, seed = 2, a = 1 } = {}) {
  const r = rng(seed); g.save(); g.globalAlpha *= a; g.filter = 'blur(2px)';
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) / n * W + (r() - 0.5) * 60, s = 0.85 + r() * 0.35, yy = y + r() * 60 + Math.sin(t * 1.3 + i) * 3;
    for (const [col, d] of [['rgba(255,214,160,0.18)', -4], ['#07090C', 0]]) { g.fillStyle = col;
      g.beginPath(); g.ellipse(x, yy + d, 70 * s, 84 * s, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(x, yy + 170 * s + d, 150 * s, 110 * s, 0, 0, 7); g.fill(); }
  }
  g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'slate', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const moveCue = (tm, k, gain = 0.85) => { const cap = G[k - 1].pieces.length > G[k].pieces.length; cue(tm + SLIDE - MOVE_HIT, cap ? 'move_capture' : 'move', gain); };

  // ======================= HOOK =======================
  const magT = w('hook1', 'Magnus'), secT = w('hook2', 'seconds');
  // one shot: Gates's close-up, then the camera whips round the board to Magnus as his name lands (fly-around)
  const flyA = magT - 0.36, flyB = magT + 0.1;
  const CU = (gates, yaw, push = 0) => ({ yaw: (gates ? Math.PI : 2 * Math.PI) + yaw, pitch: 0.3, dist: 7.4 - push, fov: 1500, cy: H * 0.46, target: [4, 2.9, gates ? -1.2 : 9.2] });
  shot(0, (g, lt, t, sh) => boardScene(g, lt, t, [[0, CU(true, 0.16)], [flyA, CU(true, 0.1, 0.25)], [flyB, CU(false, -0.14), ease.whip], [len(sh), CU(false, -0.06, 0.4)]],
    { pieces: at(0), gE: { ...EXPR.happy, look: [0, 0.35] }, mE: { ...EXPR.smug, look: [0, 0.3], curve: 0.8 }, dof: 1.6, spot: [4, lerp(-1.2, 9.2, seg(t, flyA, flyB, ease.whip))] }), { noJump: true });
  shot(s('hook2') - 0.05, (g, lt, t) => {  // Magnus's half of the clock runs 0:30 -> 0:18 as he says it
    backdropInsert(g, t);
    const used = clamp((t - s('hook2')) / 1.3) * 12;
    bigClock(g, t, '2:00', fmt(30 - used), { hotR: 1, y: 900 });
  }, { trans: 'whip', info: true, hud: (g, lt, t) => counter(g, '12 SECONDS', null, { y: 400, size: 130, color: C.cream, a: seg(t, secT - 0.1, secT) }) });
  cue(0.02, 'boom_cine', 0.6); cue(flyA - 0.04, 'whoosh_fast', 0.7); cue(flyB - BOOM_HIT, 'boom_move', 0.9);
  for (let i = 0; i < 4; i++) cue(s('hook2') + i * 0.3, 'clock_tick', 0.3);
  cue(secT - BOOM_HIT, 'boom_move', 0.8);

  // ======================= LONDON 2014: THE NEW WORLD CHAMPION =======================
  const champT = w('s1', 'champion');
  shot(s('s1') - 0.1, (g, lt, t) => {
    closeUp(g, lt, t, 'magnus14', { ...EXPR.smug, look: [0, 0.2] }, { yaw: 0.1, push: 0.7, extra: () => {
      const hd = headAt(9.4), drop = ease.out(seg(t, champT - 0.35, champT + 0.05)), y = hd.y - 168 * hd.s - (1 - drop) * 380;
      crown(g, hd.x, y, hd.s * 0.72, seg(t, champT - 0.35, champT - 0.2));
    } });
  }, { trans: 'whip', hud: (g, lt, t) => placeStamp(g, lt, 'London', 'January 2014', { y: 200, a: 1 - seg(t, champT - 0.6, champT - 0.4) }) });
  cue(champT - 0.3, 'whoosh_soft', 0.45);  // the crown drops

  // ======================= GATES: THE RICHEST MAN =======================
  const richT = w('s2', 'one');
  shot(s('s2') - 0.1, (g, lt, t) => {
    closeUp(g, lt, t, 'gates', { ...EXPR.happy, look: [0, 0.3] }, { yaw: -0.12 });
  }, { trans: 'cut', hud: (g, lt) => nameTitle(g, lt, 'Bill Gates', 'FOUNDER OF MICROSOFT', { y: 230, size: 76 }) });
  shot(richT - 0.12, (g, lt, t) => { backdropInsert(g, t); richCard(g, lt, t); }, { trans: 'whip', info: true });
  cue(richT, 'cash', 0.45);

  // ======================= THE TALK SHOW =======================
  const blitzT = w('s3', 'blitz');
  shot(s('s3') - 0.1, (g, lt, t, shx) => {  // wide: the stage from the audience
    boardScene(g, lt, t, [[0, { yaw: 1.5, pitch: 0.26, dist: 17, fov: 1150, cy: H * 0.5, target: [4, 2.4, 4] }], [len(shx), { yaw: 1.45, dist: 16.2 }]],
      { pieces: at(0), mE: { ...EXPR.happy, look: [-0.8, 0.2] }, gE: { ...EXPR.happy, look: [0.8, 0.2] }, dof: 0.6, clock: ['2:00', '0:30'] });
    for (const [x, z] of [[-6, -6], [14, 12]]) spotCone(g, B, { top: [x, 20, z], base: [4, 0, 4], r0: 0.5, r1: 3.5, a: 0.08, t, dust: 20, seed: 5 + x });
    audience(g, t, { y: H - 330, n: 6 });
  }, { trans: 'zoom', noJump: true, hud: (g, lt) => placeStamp(g, lt, 'Skavlan', 'TV talk show', { y: 200 }) });
  cue(s('s3'), 'applause', 0.45); cue(blitzT, 'clock_press', 0.5);

  // ======================= TWO MINUTES vs THIRTY SECONDS =======================
  const twoT = w('s4', 'two'), thirtyT = w('s4', 'thirty');
  shot(s('s4') - 0.1, (g, lt, t) => {
    backdropInsert(g, t);
    bigClock(g, t, '2:00', '0:30', { hotL: 0, hotR: t > thirtyT ? 1 : 0, y: 900 });
    const hl = (x, t0, col) => { const a = seg(t, t0, t0 + 0.12); if (a <= 0) return; g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.roundRect(W / 2 + x - 190, 900 - 110, 380, 230, 26); g.stroke(); g.restore(); };
    hl(-210, twoT, '#8FB8E0'); hl(210, thirtyT, RED);
  }, { trans: 'whip', info: true });
  cue(twoT, 'clock_press', 0.55); cue(thirtyT, 'clock_press', 0.55);

  // ======================= 1.e4 ... the pawn knocked over =======================
  const e4T = w('s5', 'e4'), pawnT = w('s6', 'pawn'), goneT = w('s6', 'gone');
  const openMoves = [e4T - 0.25, e4T + 0.45, e4T + 0.9, pawnT - 0.6];  // 1.e4 Nc6 2.Nf3 d5
  shot(s('s5') - 0.1, (g, lt, t, sh) => {
    const R = playRun(G, 0, openMoves.slice(0, 3), t, piecesAt);
    boardScene(g, lt, t, [[0, { yaw: 0.35, pitch: 0.62, dist: 12.5, fov: 1500, cy: H * 0.5, target: [4, 1, 4.8] }], [len(sh), { yaw: 0.25, dist: 11.4 }]],
      { run: R, mE: 'focus', gE: 'focus', gHands: false, clock: [fmt(120 - 1.5 * clamp(t - e4T, 0, 9)), '0:30'] });
  }, { trans: 'whip' });
  shot(s('s6') - 0.05, (g, lt, t, sh) => {  // close on d5: Magnus's hand is too fast, the pawn goes over
    const R = playRun(G, 0, openMoves, t, piecesAt);
    // Magnus's fast hand knocks the d5 pawn over as it lands; it lies there, then he sets it up again
    const tip = seg(t, openMoves[3] + 0.22, openMoves[3] + 0.42, ease.out) * (1 - seg(t, goneT + 0.2, goneT + 0.5, ease.inOut));
    if (tip > 0) for (const p of R.pieces) if (p.sq === 'd5' && p.t === 'p') { p.rot = -1.45 * tip; p.y = 0.12 * tip; }
    boardScene(g, lt, t, diveOut([[0, { yaw: 0.2, pitch: 0.42, dist: 7.6, fov: 1500, cy: H * 0.52, target: [3.6, 1.4, 5.6] }], [len(sh), { yaw: 0.12, dist: 7.0 }]], (s('s7') - 0.1) - (s('s6') - 0.05)),
      { run: R, mE: exprAt([[0, 'focus'], [pawnT - (t - lt), { ...EXPR.happy, nod: 1 }]], lt), gE: 'focus', gHands: false, dof: 1.8,
        mReach: { sq: 'd5', u: seg(t, openMoves[3] - 0.1, openMoves[3] + 0.5) }, clock: [fmt(120 - 1.5 * clamp(t - e4T, 0, 9)), fmt(30 - 2 * (t > openMoves[3] + 0.3 ? 1 : 0)), t > openMoves[3] + 0.3 ? 'r' : null] });
  }, { trans: 'cut', hud: (g, lt, t) => { if (t > pawnT) { const a = seg(t, pawnT, pawnT + 0.1) * (1 - seg(t, goneT + 0.6, goneT + 0.8)); badge(g, '−2 SECONDS', W / 2, 1500, { color: RED, size: 46, a, scale: pop(t, pawnT) }); } } });
  openMoves.forEach((tm, i) => moveCue(tm, i + 1));
  cue(openMoves[3] + 0.3, 'piece', 0.7);

  // ======================= Gates plays well: 3.Bd3 ... 6.O-O =======================
  const wellT = w('s7', 'own'), castT = w('s7', 'castles');
  const midMoves = [s('s7') - 0.05, s('s7') + 0.3, s('s7') + 0.65, s('s7') + 1.0, wellT, wellT + 0.32, castT - 0.1];  // 3.Bd3 Nf6 4.exd5 Qxd5 5.Nc3 Qh5 6.O-O
  shot(s('s7') - 0.1, (g, lt, t, sh) => {
    const R = playRun(G, 4, midMoves, t, piecesAt);
    boardScene(g, lt, t, riseIn([[0, { yaw: Math.PI - 0.3, pitch: 0.55, dist: 11, fov: 1500, cy: H * 0.5, target: [4.4, 1.2, 2.6] }], [len(sh), { yaw: Math.PI - 0.15, dist: 10 }]]),
      { run: R, gE: exprAt([[0, 'focus'], [castT - (t - lt), { ...EXPR.happy, look: [0, 0.4] }]], lt), mE: 'focus', mHands: false });
  }, { trans: 'cut' });
  midMoves.forEach((tm, i) => moveCue(tm, 5 + i, 0.75));
  cue(s('s7') - 0.1 - 0.26, 'whoosh_fast', 0.6);  // the dive between the two shots

  // ======================= the free knight: 6...Bg4 7.h3 Ne5 =======================
  const neverT = w('s8', 'never'), knightT = w('s8', 'knight'), freeT = w('s8', 'free');
  const trapMoves = [s('s8') + 0.1, s('s8') + 0.5, knightT - 0.2];  // 6...Bg4 7.h3 Ne5
  const brT = trapMoves[2] + SLIDE;  // 7...Ne5!! lands: brilliant mark, glowing square, the boom
  // s8 swings round the board into s9: half the fly-around ends one shot, half starts the next, cut at the side view
  const end8 = s('s9') - s('s8'), A8 = { yaw: 0.25, pitch: 0.62, dist: 10.6, fov: 1500, cy: H * 0.56, target: [4.6, 1.4, 5.4] };
  const A9 = { yaw: Math.PI - 0.35, pitch: 0.6, dist: 10.5, fov: 1500, cy: H * 0.52, target: [5.4, 1, 3.4] };
  const MID = { yaw: 1.45, pitch: 0.62, dist: 10.4, fov: 1500, cy: H * 0.54, target: [5.0, 1.25, 4.2] };
  shot(s('s8') - 0.1, (g, lt, t, sh) => {
    const R = playRun(G, 11, trapMoves, t, piecesAt);
    for (const p of R.pieces) if (p.sq === 'e5' && p.t === 'n' && p.c === 'b' && t > brT) p.brill = seg(t, brT, brT + 0.35);
    boardScene(g, lt, t, [[0, A8], [end8 - 0.3, { ...A8, yaw: 0.12, dist: 9.4, target: [4.6, 1.1, 5.0] }], [end8, MID, ease.in]],
      { run: R, mE: exprAt([[0, 'focus'], [neverT - (t - lt), { ...EXPR.smug, curve: 0.9 }]], lt), gE: 'focus', gHands: false, focus: null,
        extraUnder: () => brilliantSquare(g, B, 'e5', seg(t, brT, brT + 0.2), t) });
  }, { trans: 'cut' });
  trapMoves.forEach((tm, i) => moveCue(tm, 12 + i, 0.8));
  cue(trapMoves[2] + SLIDE - BOOM_HIT, 'boom_move', 1.0);  // the bait lands: brilliant move
  cue(s('s9') - 0.1 - 0.32, 'whoosh_deep', 0.7);  // the swing round the board

  // ======================= 8.hxg4: the engine says Gates is winning =======================
  const insteadT = w('s9', 'instead'), winT = w('s9', 'winning');
  const takeMoves = [w('s9', 'takes') - 0.1, insteadT + 0.3];  // 8.hxg4 Nfxg4
  shot(s('s9') - 0.1, (g, lt, t, sh) => {
    const R = playRun(G, 14, takeMoves, t, piecesAt);
    for (const p of R.pieces) if (p.sq === 'e5' && p.t === 'n' && p.c === 'b') p.brill = 1;
    boardScene(g, lt, t, [[0, MID], [0.3, A9, ease.out], [len(sh), { ...A9, yaw: Math.PI - 0.22, dist: 9.6 }]],
      { run: R, gE: exprAt([[0, 'focus'], [winT - (t - lt), { ...EXPR.happy, look: [0, 0.3] }]], lt), mE: 'focus', mHands: false,
        extraUnder: () => { if (R.pieces.some(p => p.sq === 'e5' && p.c === 'b')) brilliantSquare(g, B, 'e5', 1, t); } });
  }, { trans: 'cut', hud: (g, lt, t) => { const v = t < takeMoves[1] + 0.3 ? 3.1 : 3.2; evalBar(g, v, '+' + v.toFixed(1), seg(t, winT - 0.5, winT - 0.3)); } });
  takeMoves.forEach((tm, i) => moveCue(tm, 15 + i, 0.8));

  // ======================= 9.Nxe5?? Qh2# =======================
  const takeT = w('s10', 'takes'), queenT = w('s11', 'Queen'), mateT = w('s11', 'Checkmate');
  const endMoves = [takeT + 0.05, queenT - 0.05];
  // after the queen lands, a fast orbit to the mated corner: king g1 and queen h2 above the captions, Magnus behind
  const A10 = { yaw: 0.75, pitch: 0.6, dist: 12, fov: 1500, cy: H * 0.5, target: [5.4, 1.2, 4.8] };
  const M10 = { yaw: 0.35, pitch: 0.4, dist: 9.3, fov: 1500, cy: H * 0.52, target: [6.5, 1, 1.5] };
  const orbA = endMoves[1] + SLIDE + 0.09, orbB = orbA + 0.5, t10 = s('s10') - 0.1;
  shot(s('s10') - 0.1, (g, lt, t, sh) => {
    const R = playRun(G, 16, endMoves, t, piecesAt);
    const bait = 1 - seg(t, endMoves[0] + 0.1, endMoves[0] + 0.25);  // the mark stays on the bait until Gates takes it
    for (const p of R.pieces) if (p.t === 'n' && p.sq === 'e5' && p.c === 'b') p.brill = bait;
    const mated = t > endMoves[1] + SLIDE;
    if (mated) for (const p of R.pieces) if (p.t === 'k' && p.c === 'w') { const u = seg(t, mateT + 0.1, mateT + 0.45, ease.in); p.rot = 1.45 * u; p.y = 0.08 * u; }
    boardScene(g, lt, t, [[0, A10], [orbA - t10, { ...A10, yaw: 0.7, dist: 11.3 }], [orbB - t10, M10, ease.whip], [len(sh), { ...M10, yaw: 0.3, dist: 8.8 }]],
      { run: R, labels: t < endMoves[1], mE: exprAt([[0, 'focus'], [queenT - (t - lt), { ...EXPR.smug, curve: 1 }]], lt), gE: exprAt([[0, 'happy'], [mateT - (t - lt), 'shock']], lt), gHands: false, mHands: false,
        extraUnder: () => { brilliantSquare(g, B, 'e5', bait, t); if (mated) { const a = seg(t, mateT - 0.2, mateT); B.highlight(g, 'h2', RED, 0.55 * a); B.highlight(g, 'g1', RED, 0.55 * a); } },
        extraOver: () => { if (mated) { const a = seg(t, mateT - 0.2, mateT); B.laser(g, 'h2', 'g1', RED, a, 0.5); } } });
    if (mated) { const a = seg(t, mateT, mateT + 0.12); g.save(); g.fillStyle = rgba('#5A0E0E', 0.28 * a); g.fillRect(0, 0, W, H); g.restore(); }
  }, { trans: 'whip', hud: (g, lt, t) => { if (t > endMoves[1] + SLIDE) { const a = seg(t, mateT, mateT + 0.12);
      g.save(); g.globalAlpha = a; g.font = mono(64, 800); g.textAlign = 'center'; g.fillStyle = '#F07A6A'; g.letterSpacing = '6px'; g.fillText('CHECKMATE', W / 2, 250); qaRect(g, W / 2 - 260, 190, 520, 80, 'text', 'checkmate'); g.restore(); } } });
  endMoves.forEach((tm, i) => moveCue(tm, 17 + i, 0.95));
  cue(endMoves[0] + SLIDE - BOOM_HIT, 'boom_move', 0.6); cue(endMoves[1] + SLIDE - BOOM_HIT, 'boom_move', 0.9);  // 9.Nxe5 and Qh2
  cue(orbA - 0.04, 'whoosh_fast', 0.55);
  cue(mateT - 0.09, 'boom_big', 1.0); cue(mateT + 0.02, 'gasp', 0.4);
  shot(mateT + 0.75, (g, lt, t) => closeUp(g, lt, t, 'gates', { ...EXPR.shock, look: [0, 0.4] }, { pieces: at(18), yaw: 0.1, push: 0.9 }), { trans: 'cut' });

  // ======================= nine moves, twelve seconds =======================
  const nineT = w('s12', 'Nine'), twelveT = w('s12', 'twelve'), minT = w('s13', 'minute');
  shot(s('s12') - 0.1, (g, lt, t) => {
    backdropInsert(g, t);
    bigClock(g, t, '1:10', '0:18', { hotR: t > twelveT ? 1 : 0, hotL: 0, y: 900 });
    counter(g, '9 MOVES', null, { y: 400, size: 120, a: seg(t, nineT - 0.1, nineT) * (1 - seg(t, twelveT - 0.2, twelveT - 0.05)) });
    counter(g, '12 SECONDS', 'OF HIS 30', { y: 400, size: 120, a: seg(t, twelveT - 0.05, twelveT + 0.05) * (1 - seg(t, minT - 0.3, minT - 0.15)) });
    if (t > minT - 0.15) { const a = seg(t, minT - 0.15, minT); g.save(); g.globalAlpha = a; g.strokeStyle = '#8FB8E0'; g.lineWidth = 8; g.beginPath(); g.roundRect(W / 2 - 400, 790, 380, 230, 26); g.stroke(); g.restore();
      counter(g, '1:10 LEFT', 'GATES', { y: 400, size: 120, a, labelColor: '#8FB8E0' }); }
  }, { trans: 'whip', info: true });
  cue(nineT, 'stamp', 0.55); cue(twelveT, 'clock_press', 0.5);

  // ======================= the quote =======================
  shot(s('s14') - 0.1, (g, lt, t) => { backdropInsert(g, t, 0.55); clipping(g, lt); }, { trans: 'whip', info: true });
  cue(s('s14') - 0.1, 'paper', 0.6);

  // ======================= CTA =======================
  const gatesQT = w('cta', 'Gates?'), folT = w('cta', 'Follow');
  shot(s('cta') - 0.1, (g, lt, t, sh) => {  // the viewer takes Magnus's seat: Gates across the board, a new game about to start
    boardScene(g, lt, t, [[0, { yaw: Math.PI + 0.14, pitch: 0.3, dist: 7.6, fov: 1500, cy: H * 0.47, target: [4, 2.9, -1.2] }], [len(sh), { yaw: Math.PI + 0.05, dist: 6.9 }]],
      { pieces: at(0), gE: { ...EXPR.smug, look: [0, 0.15], curve: 0.6 }, mHide: true, dof: 1.6, spot: [4, -1.2] });
  }, { trans: 'whip', noJump: true, hud: (g, lt, t) => {
    badge(g, 'YES', W / 2 - 130, 290, { color: GOLD, size: 46, a: seg(t, gatesQT, gatesQT + 0.1), scale: pop(t, gatesQT) });
    badge(g, 'NO', W / 2 + 130, 290, { color: '#8A8F98', size: 46, a: seg(t, gatesQT + 0.12, gatesQT + 0.22), scale: pop(t, gatesQT + 0.12) });
    badge(g, 'FOLLOW FOR MORE', W / 2, 1520, { color: GOLD, size: 48, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
  } });

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [  // no music box or bells (they rang over the voice): strings and pizzicato, a calm piano after the mate
    { t: 0, m: 'hook' }, { t: s('s1') - 0.1, m: 'build' }, { t: s('s5') - 0.1, m: 'tension' },
    { t: mateT, m: 'hit' }, { t: s('s12') - 0.1, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.12, 1.05], shift: 40 } };
}

// inserts sit on the table under the lamp: the wood, out of focus, a pool of light
function backdropInsert(g, t, dim = 0.35) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2A1810'); gr.addColorStop(0.5, '#5A3324'); gr.addColorStop(1, '#2A1810');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(3); g.strokeStyle = 'rgba(20,10,6,0.25)'; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const y = r() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 20, W * 0.6, y - 20, W, y + 10); g.stroke(); }
  const pg = g.createRadialGradient(W / 2, H * 0.48, 40, W / 2, H * 0.48, W * 0.9); pg.addColorStop(0, 'rgba(255,226,180,0.22)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = pg; g.fillRect(0, 0, W, H);
  lowKey(g, { cy: H * 0.48, a: 0.6 });
  if (dim) { g.fillStyle = `rgba(4,6,9,${dim * 0.4})`; g.fillRect(0, 0, W, H); }
}
