// "Who stat-pads more: Messi or Ronaldo?" Messi fans say Ronaldo stat-pads, Ronaldo fans say Messi does: 1,922 goals
// (Messi 937 in 1,185 games, Ronaldo 985 in 1,343, as of 10 November 2026), and which of them won games: match-winners
// 196 and 240 (21% and 24% of their goals); without their goals their teams lose 364 and 418 points (0.39 and 0.42 a goal).
// Ronaldo's bicycle kick in Turin (2018) and Messi's run through Getafe (2007) are deleted on screen. The numbers say
// Messi stat-pads more; Ronaldo's goals decide more games. The topic and the order of a video the author sent (The Final
// Third, TikTok, 2 November 2026); the words and the numbers checked here are ours. SOURCES.md.
// The settings are those of plea2005 (STYLE_BIBLE rule 68), the opening, the one-take cutting and the length rule 70.
// The iconic photograph (rule 69, asked of the author) opens the film once it is in photos/iconic.jpg.
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, stamp, enter, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, playerItems, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, BALL_R, skeleton, figureK, v3 } from '../../engine/js/football.js';
import { loadImage } from '../../engine/js/photo.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI, FPS = 30;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', LIME = '#9CCB4A', RED = '#D8453A', BLACK = '#15161A';
const IMG = { iconic: await loadImage('../episodes/statpad/photos/iconic.jpg').catch(() => null), credit: null };
const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const pin = (t, t0, a = 1) => { const u = enter(t, t0); return { a: u * a, scale: lerp(0.94, 1, u), dy: (1 - u) * 14 }; };
const fadeOut = (t, t1, d = 0.25) => 1 - clamp((t - t1) / d);
// a camera that stands at E and looks at T (a pan and a zoom from one place, like a camera on a tripod)
const lookFrom = (E, T, o = {}) => { const dx = E[0] - T[0], dy = E[1] - T[1], dz = E[2] - T[2], d = Math.hypot(dx, dy, dz); return { yaw: Math.atan2(dx, -dz), pitch: Math.asin(dy / d), dist: d, fov: 1500, cy: H * 0.5, target: T, ...o }; };
// a camera given as a function of time: rig() measures how far the picture moved since the last frame, so the motion
// blur works on a hand-computed move as well
const rigFn = (lt, t, cam, o = {}) => rig(B, lt, [[lt - 1 / FPS, cam(t - 1 / FPS)], [lt, cam(t)]], { t, e: lin, shake: 0.4, ...o });

// grades: a floodlit night (the big European nights of both), the faded replays of the two goals that get deleted
const NIGHT_G = { con: 1.07, sat: 1.06, bri: 1.03, tone: ['#DCE8FF', 0.06], lift: ['#0E1630', 0.1], bloom: 0.3 };
const PRINT_G = { con: 1.02, sat: 1.0, bri: 1.0, tone: null, lift: ['#101010', 0.04], bloom: 0.12 };
const GRAPH_G = { con: 1.04, sat: 1.02, bri: 1.0, tone: ['#DCE8FF', 0.04], lift: ['#0E1630', 0.08], bloom: 0.2 };

// ---------- kits (drawn, not the exact designs; no sponsors, a plain badge) and the cast: cartoons, not likenesses
const SKIN_L = { base: '#ECC6A2', shade: '#D8AC86', deep: '#B4845C', blush: '#E2967E', hi: '#F7DEC2' };
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const GARNET = '#A3123F', BLAU = '#1D3F92', MADRID_GOLD = '#C9A44A', BAR_GOLD = '#F2C94C';
// Barcelona: blue and garnet stripes, blue shorts and socks. Real Madrid: all white. Juventus: black and white stripes
const BAR = { shirt: GARNET, shirtD: '#800D32', stripes: [BLAU, 3], trim: BAR_GOLD, num: BAR_GOLD, numEdge: null, shorts: BLAU, socks: BLAU, band: GARNET, boots: '#1A1B1F', badge: BAR_GOLD };
const RMA = { shirt: '#F4F4F2', shirtD: '#D9DBDE', trim: MADRID_GOLD, num: '#1C2333', numEdge: null, shorts: '#F4F4F2', socks: '#F4F4F2', band: MADRID_GOLD, boots: '#1A1B1F', badge: MADRID_GOLD };
const JUV = { shirt: '#F4F4F2', shirtD: '#D6D8DA', stripes: ['#16171B', 3], trim: '#16171B', num: '#16171B', numEdge: '#F4F4F2', shorts: '#F4F4F2', socks: '#F4F4F2', band: '#16171B', boots: '#1A1B1F', badge: '#E2C46A' };
// the opponents of the made-up matches, and Getafe in the replay of 2007 (in black and white: their kit that night was not checked)
const OPP = { shirt: '#2E8A84', shirtD: '#22706B', trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: '#16303A', socks: '#2E8A84', band: '#F4F4F2', boots: '#1A1B1F', badge: '#F4F4F2' };
const OPP2 = { shirt: '#E07A2E', shirtD: '#B8601E', trim: '#1A1B1F', num: '#1A1B1F', numEdge: null, shorts: '#1A1B1F', socks: '#E07A2E', band: '#1A1B1F', boots: '#1A1B1F', badge: '#1A1B1F' };
const GET = { shirt: '#3D5FA6', shirtD: '#2E4A86', trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: '#3D5FA6', socks: '#3D5FA6', band: '#F4F4F2', boots: '#1A1B1F', badge: '#F4F4F2' };
const GK = { shirt: '#5E6A76', shirtD: '#4A545E', trim: '#D8DCE0', num: '#F4F4F2', numEdge: null, shorts: '#2A2D34', socks: '#5E6A76', band: '#D8DCE0', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#D8DCE0' };
const GK2 = { shirt: '#C9D23A', shirtD: '#A6AE2C', trim: '#1A1B1F', num: '#1A1B1F', numEdge: null, shorts: '#1A1B1F', socks: '#C9D23A', band: '#1A1B1F', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#1A1B1F' };
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: '#22252D', suitD: '#16181E', shirt: 'tee', ears: 1.0, ...o });
// their hair is drawn whole, all round the head: a cap in front, a full shape behind it and a full back of the head. The
// stock short styles left skin showing at the temples when the head turned and down the back of the head (the author:
// «on peut parfois voir apparaître leur crâne»). quiff: a raised wave of hair over the forehead (Ronaldo)
const fullHair = (col, quiff = false) => {
  const front = (g, layer, { fw, fh = 1, turn = 0 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = col;
    if (layer === 'back') { g.beginPath(); g.ellipse(0, -26, 106 * fw, 110, 0, 0, 7); g.fill(); return; }
    const p = new Path2D(); p.moveTo(-w - 3, -6); p.bezierCurveTo(-w - 9, -h * 0.95, -40, -h - 14, 0, -h - 12); p.bezierCurveTo(40, -h - 14, w + 9, -h * 0.95, w + 3, -6);
    p.bezierCurveTo(w - 4, -60, 56, -92, 0, -95); p.bezierCurveTo(-56, -92, -w + 4, -60, -w - 3, -6);
    if (turn) { g.save(); g.translate(-9 * turn, 0); g.fill(p); g.restore(); }  // the same cap held on the skull under a turned head: no sliver of skull on the far side
    g.fill(p);
    if (quiff) { g.beginPath(); g.moveTo(-62, -h - 6); g.bezierCurveTo(-50, -h - 30, 30, -h - 40, 74, -h - 18); g.bezierCurveTo(66, -h - 4, 20, -h + 2, -62, -h - 6); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 26, -95 + Math.abs(i) * 4); g.quadraticCurveTo(i * 31 + (quiff ? 10 : 0), -h * 0.92 - (quiff ? 16 : 0), i * 27 + (quiff ? 18 : 0), -h - 6 + Math.abs(i) * 6 - (quiff ? 18 : 0)); g.stroke(); } };
  const back = (g, { fw, fh }) => { g.fillStyle = col; g.beginPath(); g.ellipse(0, -6, 104 * fw, 124 * fh, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 28, -112); g.quadraticCurveTo(i * 24, -10, i * 10, 100); g.stroke(); } };
  return { hairFx: front, backFx: back };
};
// Ronaldo: the engine's swept-up quiff ('quiff' in characters.js, as in the first cut, the author's picture) with a few
// blond streaks («sum mech blond»). The stock quiff let the skull show: when the head turns the hair is drawn slid
// 9·turn toward the look while the skull stays put, and from behind the generic back of the head ends halfway down. So
// under the quiff the same shape, a little wider, stays on the skull (dxS), and the back of the head is hair down to the
// neck, the quiff rising over it; the picture from the front is the stock one.
const cr7Quiff = col => {
  const quiffPath = (w, h, dx, out = 0) => { const p = new Path2D();
    p.moveTo(dx - w + 2 - out, -74); p.bezierCurveTo(dx - w - 4 - out, -h + 2, dx - w + 18 - out, -h - 30, dx - 34, -h - 44);
    p.bezierCurveTo(dx - 4, -h - 58, dx + 40, -h - 66, dx + 62, -h - 50);
    p.bezierCurveTo(dx + 78, -h - 40, dx + w + 4 + out, -h - 14, dx + w + 2 + out, -74);
    p.lineTo(dx + w - 14, -86); p.quadraticCurveTo(dx + w - 20, -110, dx + 58, -114); p.quadraticCurveTo(dx + 6, -100, dx - 48, -112);
    p.quadraticCurveTo(dx - w + 20, -110, dx - w + 14, -86); p.closePath(); return p; };
  // blond streaks (mèches) along the sweep: each a tapered lock, dark at the root by the hairline, blond toward the tip
  // [x0, y0 (root), x1, y1 above the skull top (tip), width at the tip, colour]
  const streaks = [[-56, -104, 26, -56, 9, '#C9A25E'], [-28, -106, 50, -52, 11, '#DDBD78'], [-2, -108, 68, -40, 9, '#C9A25E'], [24, -110, 82, -24, 7, '#DDBD78'], [-74, -96, 4, -44, 6, '#B48C50']];
  const lock = (g, x0, y0, x1, y1, wt, colr) => {  // a tapered lock along a curve swept up and back, its colour growing toward the tip
    const cx = (x0 + x1) / 2 - 20, cy = (y0 + y1) / 2 - 20, n = 14, L = [], R = [];
    for (let i = 0; i <= n; i++) { const t = i / n, x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), d = Math.hypot(dx, dy) || 1, hw = (1 + (wt - 1) * Math.sin(t * Math.PI * 0.62)) / 2;
      L.push([x - dy / d * hw, y + dx / d * hw]); R.push([x + dy / d * hw, y - dx / d * hw]); }
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba(colr, 0)); gr.addColorStop(0.35, rgba(colr, 0.5)); gr.addColorStop(1, rgba(colr, 0.95));
    g.fillStyle = gr; g.beginPath(); g.moveTo(L[0][0], L[0][1]); for (const [x, y] of L) g.lineTo(x, y); for (const [x, y] of R.reverse()) g.lineTo(x, y); g.closePath(); g.fill(); };
  const front = (g, layer, { fw, fh = 1, turn = 0 }) => {
    const w = 100 * fw, h = 125 * fh;
    g.fillStyle = col;
    if (layer === 'back') { g.beginPath(); g.ellipse(4, -70, 98 * fw, 92, 0, 0, 7); g.fill(); return; }  // as the stock quiff
    g.fill(quiffPath(w, h, -9 * (turn || 0), 5));  // on the skull: covers it whatever the turn
    const p = quiffPath(w, h, 0); g.fill(p);
    for (const sd of [-1, 1]) {  // short faded sides
      const fg = g.createLinearGradient(0, -100, 0, -2); fg.addColorStop(0, rgba(col, 0.9)); fg.addColorStop(1, rgba(col, 0.35));
      g.fillStyle = fg; g.beginPath(); g.moveTo(sd * (w + 3), -96); g.lineTo(sd * (w + 3), -4); g.lineTo(sd * (w - 6), -4); g.lineTo(sd * (w - 14), -88); g.closePath(); g.fill();
    }
    g.save(); g.clip(p); g.lineCap = 'round';
    g.strokeStyle = rgba('#FFFFFF', 0.13); g.lineWidth = 16; g.beginPath(); g.moveTo(-50, -h + 4); g.bezierCurveTo(-30, -h - 30, 10, -h - 50, 56, -h - 46); g.stroke();
    for (const [x0, y0, x1, y1, wt, colr] of streaks) lock(g, x0, y0, x1, -h + y1, wt, colr);
    g.strokeStyle = rgba('#000000', 0.28); g.lineWidth = 4;
    for (const [x0, y0, x1, y1] of [[-70, -100, 20, -h - 52], [-40, -104, 44, -h - 50], [-10, -102, 64, -h - 40], [20, -106, 80, -h - 24]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 20, (y0 + y1) / 2 - 20, x1, y1); g.stroke(); }
    g.restore();
  };
  const back = (g, { fw, fh }) => {  // from behind: hair over the whole back of the head, the quiff rising over it (mirrored)
    const w = 100 * fw, h = 125 * fh, all = new Path2D();
    all.ellipse(0, -6, 104 * fw, 124 * fh, 0, 0, 7); all.ellipse(-4, -70, 98 * fw, 92, 0, 0, 7);
    g.fillStyle = col; g.fill(all);
    g.save(); g.clip(all); g.lineCap = 'round';
    g.strokeStyle = rgba('#FFFFFF', 0.08); g.lineWidth = 16; g.beginPath(); g.moveTo(50, -h + 10); g.bezierCurveTo(30, -h - 20, -10, -h - 34, -50, -h - 26); g.stroke();
    for (const [x0, y0, x1, y1, wt, colr] of [[64, -h + 34, -18, -h - 30, 9, '#C9A25E'], [36, -h + 38, -44, -h - 20, 10, '#DDBD78'], [8, -h + 40, -62, -h - 6, 7, '#C9A25E']]) lock(g, x0, y0, x1, y1, wt, colr);
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 28, -112); g.quadraticCurveTo(i * 24, -10, i * 10, 100); g.stroke(); }
    g.restore();
  };
  return { hairFx: front, backFx: back };
};
// Messi today: short hair combed back and a full beard; Messi at 19 (the replay of 2007): long untidy hair, no beard
CAST.lmessi = head('buzz', [0.95, 1.04, 0.9], '#4A3324', { skin: SKIN_L, brow: '#3A2618', beard: '#4A3324', beardStyle: 'full', ...fullHair('#4A3324') });
CAST.ymessi = head('messy', [0.95, 1.03, 0.9], '#3A2618', { skin: SKIN_L, brow: '#2A1C12' });
// Ronaldo: the swept-up quiff with blond streaks, clean-shaven, a long jaw
CAST.cr7 = head('quiff', [0.92, 1.1, 0.84], '#1E1612', { skin: SKIN_T, brow: '#1A120E', ...cr7Quiff('#1E1612') });
CAST.bar1 = head('swept', [0.97, 1.05, 0.91], '#2A1E16', { skin: SKIN_L });
CAST.bar2 = head('buzz', [0.97, 1.05, 0.91], '#17110D', { skin: SKIN_M, brow: '#100C0A' });
CAST.rm1 = head('buzz', [0.97, 1.06, 0.91], '#2A1E16', { skin: SKIN_T });
CAST.opp1 = head('messy', [0.98, 1.05, 0.92], '#3A2618', { skin: SKIN_T });
CAST.opp2 = head('buzz', [0.97, 1.06, 0.91], '#120D0A', { skin: SKIN_M, brow: '#0E0A08' });
CAST.gk1 = head('swept', [0.98, 1.06, 0.92], '#5A3E28', { skin: SKIN_L });
CAST.juv1 = head('swept', [0.97, 1.06, 0.92], '#1E1612', { skin: SKIN_T, beard: '#1E1612', beardStyle: 'full' });
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const MESSI = mk('lmessi', BAR, 10, 1.70), MESSI07 = mk('ymessi', BAR, 19, 1.69), CR7 = mk('cr7', RMA, 7, 1.87);
const BARS = [mk('bar1', BAR, 8, 1.71), mk('bar2', BAR, 9, 1.82), mk('bar1', BAR, 6, 1.70), mk('bar2', BAR, 11, 1.75)];
const RMS = [mk('rm1', RMA, 2, 1.73), mk('rm1', RMA, 11, 1.85), mk('rm1', RMA, 10, 1.74)];
const OPPS = [mk('opp1', OPP, 4, 1.86), mk('opp2', OPP, 5, 1.84), mk('opp1', OPP, 3, 1.80), mk('opp2', OPP, 6, 1.82)];
const OPPS2 = [mk('opp1', OPP2, 4, 1.86), mk('opp2', OPP2, 15, 1.84), mk('opp1', OPP2, 3, 1.80)];
const GETS = [mk('opp1', GET, 4, 1.80), mk('opp2', GET, 6, 1.82), mk('opp1', GET, 21, 1.78), mk('opp2', GET, 8, 1.76)];
const JUVS = [mk('juv1', JUV, 15, 1.87), mk('opp1', JUV, 3, 1.87)];
const KEEP = mk('gk1', GK, 1, 1.89), KEEP2 = mk('gk1', GK2, 1, 1.9);

// ---------- a big European stadium under floodlights: the crowd in blue and garnet, white, dark coats
const FLAG_BAR = g => { for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? GARNET : BLAU; g.fillRect(i / 5, 0, 1 / 5 + 0.01, 1); } };
const FLAG_RMA = g => { g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#5B3C8E'; g.fillRect(0, 0.42, 1, 0.16); };
const CROWD = [[BLAU, 18], [GARNET, 16], ['#F2F0EA', 18], ['#2A3040', 24], ['#4A5266', 14], [BAR_GOLD, 4], ['#7A5A8E', 6]];
const ARENA = new Stadium({ seed: 21, density: 1, flags: 6, flagSet: [FLAG_BAR, FLAG_RMA], haze: '#3A4562', cloth: CROWD, rc: 30 });
const BOARDS = [boardDesign('GOALS THAT WIN GAMES', { bg: BLAU, ink: '#FFFFFF' }), boardDesign('MESSI vs RONALDO'), boardDesign('1,922 GOALS', { bg: GARNET, ink: '#FFFFFF' }), boardDesign('WHO STAT-PADS?', { bg: '#1C2333', ink: BAR_GOLD })];
const SKY_N = { zen: '#070B1A', mid: '#111B36', hor: '#2E3A5C', clouds: 0.12, cloud: '#2C3652', seed: 3 };
// the grass: plain mown stripes, no noise texture (laid only on the cells near the camera, each at its own strength, it
// showed seams between them and smeared into streaks under motion blur: the author asked for a smooth field)
const TURF = { colors: ['#3A8A3D', '#449648'], wear: 0, haze: '#26324E', noise: false };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { cheer = 0, blur = 0, hit = null, hitSide = 1, boards = BOARDS, goals = true } = {}) {
  const back = c => { sky(c, B, { t, ...SKY_N }); ARENA.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...(goals ? [...goalItems(B, -1, { t, hit: hitSide < 0 ? hit : null }), ...goalItems(B, 1, { t, hit: hitSide > 0 ? hit : null })] : []), ...(boards.length ? boardItems(B, boards) : []), ...items]);
}

// a player as a drawable; the shadow knows how high he is off the grass (st.air, metres) and where a lying body is
const P = (pl, st) => { const it = playerItems(B, pl, st), k = figureK(pl.h), S = st.shadow || {};
  it.shadow = gg => groundShadow(gg, B, st.x + 0.05 + (S.dx || 0), st.z + 0.12 + (S.dz || 0), { r: (S.r ?? 0.36) * k, rz: (S.rz ?? 0.24) * k, y: st.air ?? st.pose?.lift ?? 0, a: 0.26, ang: S.ang ?? st.head ?? 0 }); it.pl = pl; it.st = st; return it; };
const BALL = (pos, o = {}) => { const it = ballItem(B, pos, o); it.shadow = gg => groundShadow(gg, B, pos[0], pos[2], { r: BALL_R * 1.1, y: pos[1] - BALL_R, a: 0.32 }); return it; };
const ballOf = (bp, tt, o = {}) => { const b = bp.at(tt); return BALL(b.pos, { spin: b.spin, axis: b.axis, ...o }); };
const trailOf = (bp, tt, n = 5, dt = 0.011) => Array.from({ length: n }, (_, i) => bp.at(tt - (n - i) * dt).pos);
function moving(mv, tt, { e = 'focus', t = tt, I = null, drib = 0 } = {}) {
  const s = mv.at(tt), inten = I ?? clamp(s.sp / 6.5, 0, 1);
  const p = blend(POSE.stand(), POSE.run(s.phase, Math.max(0.35, inten), drib), clamp((s.sp - 0.25) / 1.2));
  return { x: s.x, z: s.z, head: s.head, pose: p, e, t, sp: s.sp };
}
// a runner who strikes the ball at time tk: the run goes over into the kick and back, no pop. u0: where in the swing the
// foot meets the ball (0.55 on the grass, a little later for a ball off the ground)
function runKick(mv, t, tk, foot, { e = 'focus', dur = 0.6, u0 = 0.55, I = null } = {}) {
  const ms = moving(mv, t, { e, t, I }), u = u0 + (t - tk) / dur;
  if (u <= 0 || u >= 1) return ms;
  return { ...ms, pose: blend(ms.pose, POSE.kick(u, foot), smooth(clamp(u / 0.2)) * smooth(clamp((1 - u) / 0.25))) };
}
// poses that carry their own pelvis height blend with standing ones only once the standing one has its height made explicit
function grounded(pl, st) {
  if (st.pose?.ground === false) return st;
  const sk = skeleton(pl, { ...st, pose: { ...st.pose, lift: 0 } });
  return { ...st, pose: { ...st.pose, ground: false, pelvisY: sk.pel[1], pelvisYW: 1, lift: st.pose?.lift ?? 0 } };
}
function onGrass(pl, st, rest = false) {  // nothing under the grass; rest: also lower the body until it touches
  const sk = skeleton(pl, st), k = sk.k;
  const lo = Math.min(...sk.legs.flatMap(L => [L.knee[1] - 0.06 * k, L.ankle[1] - 0.06 * k, L.toe[1] - 0.02 * k]), sk.C[1] - 0.14 * k, sk.pel[1] - 0.12 * k,
    sk.headC[1] - 0.22 * k, ...sk.arms.map(A => A.hand[1] - 0.04 * k));
  if (lo >= 0 && !rest) return st;
  return { ...st, pose: { ...st.pose, ground: false, pelvisY: sk.pel[1] - (st.pose?.lift || 0) - lo, pelvisYW: 1 } };
}

// ---------- a goalkeeper set for a shot, his dive along the line, and how he comes down. side: +1 to his own left, -1 to his right
const SET = { ...POSE.stand(), crouch: 0.1, hip: [[0.16, 0.24], [0.16, 0.24]], knee: [0.34, 0.34], sh: [[0.45, 0.55], [0.45, 0.55]], el: [0.95, 0.95], lean: 0.14 };
const DIVE = (u, side, reach = 1) => { const k = smooth(clamp(u)); return { hip: [[0.3, 0.26], [0.12, 0.2]], knee: [0.55, 0.3], sh: [[lerp(0.45, 2.95, k), 0.3], [lerp(0.45, 2.8, k), 0.36]], el: [lerp(0.95, 0.1, k), lerp(0.95, 0.12, k)],
  lean: 0.1, tilt: side * 1.38 * k * reach, pelvisY: lerp(0.86, 0.5, k), ground: false, look: 0.25 }; };
// down after the dive: flat on the side he fell to, the under arm still stretched along the grass, the other one fallen in
// front of his chest, the upper leg a little bent
const LAID = side => { const d = side > 0 ? 0 : 1, hip = [[0.3, 0.12], [0.3, 0.12]], knee = [0.5, 0.5], sh = [[1.6, -0.5], [1.6, -0.5]], el = [0.5, 0.5];
  hip[d] = [0.1, -0.08]; knee[d] = 0.15; sh[d] = [2.9, -0.2]; el[d] = 0.1;
  return { hip, knee, sh, el, lean: 0.05, tilt: side * 1.5, pelvisY: 0.2, ground: false, look: 0.2 }; };
// face: PI for the goal at +x (he looks up the pitch toward -x), 0 for the goal at -x. dive: {t0, dur, side, dz}
function keeper(pl, mv, t, { dive = null, e = 'focus', face = PI } = {}) {
  const s = mv.at(t), base = grounded(pl, { x: s.x, z: s.z, head: face, pose: blend(SET, POSE.run(s.phase, 0.5, 0), clamp(s.sp / 3) * 0.5), e, t });
  if (!dive || t < dive.t0) return base;
  const u = clamp((t - dive.t0) / dive.dur), k = smooth(u);
  const v = clamp((t - dive.t0 - dive.dur * 0.85) / (dive.dur * 0.5)), fall = v * v;  // from full stretch he drops onto his side, faster and faster
  let pose = blend(base.pose, DIVE(u, dive.side, dive.reach ?? 1), smooth(clamp(u * 2.5)));
  if (fall > 0) pose = blend(pose, LAID(dive.side), fall);
  const lz = Math.cos(face) * dive.side;  // his left along z: the head ends up on that side of his hips
  return onGrass(pl, { ...base, z: s.z + dive.dz * (1 - (1 - u) * (1 - u)), pose, e: u > 0.3 ? 'shock' : e, air: 0.3 * Math.sin(PI * k) * (1 - fall),
    shadow: fall > 0 ? { dz: lz * 0.3 * fall, r: lerp(0.24, 0.95, fall), rz: lerp(0.36, 0.3, fall), ang: PI / 2 } : null }, u > 0.85);
}
const JOY = { ...EXPR.happy, open: 0.62, lid: 0.1, brow: -0.25, browY: -8 };
const SHOUT = { ...EXPR.happy, open: 0.95, lid: 0.04, brow: -0.35, browY: -10 };  // the "Siu"
const SMUG = { ...EXPR.happy, open: 0.08, lid: 0.32, curve: 0.45 };
const GRAVE = { ...EXPR.focus, brow: 0.35, lid: 0.18, curve: -0.15 };
const LOST = { ...EXPR.sad, lid: 0.6, look: [0, 0.4], curve: -0.4 };
// ---------- poses of this film
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };  // hands on hips
const DESPAIR = { ...POSE.handsOnHead(), lean: -0.05 };
const SKYWARD = { ...POSE.armsUp(1), look: 0.55, lean: -0.06 };  // Messi: both arms up to the sky
// Ronaldo's "Siu" on landing: feet apart, knees bent, arms spread down and out, chest out
const SIU = { ...POSE.stand(), hip: [[0.12, 0.3], [0.12, 0.3]], knee: [0.42, 0.42], sh: [[0.12, 1.12], [0.12, 1.12]], el: [0.08, 0.08], fingers: true, lean: -0.14, look: 0.22 };
const TUCK = { ...POSE.stand(), hip: [[0.55, 0.12], [0.55, 0.12]], knee: [1.0, 1.0], sh: [[0.6, 1.25], [0.6, 1.25]], el: [0.2, 0.2], lean: -0.05, look: 0.2 };
// people: a man who stands, one who jogs in a straight line
const man = (t, pl, x, z, hd, pose = {}, e = 'focus', ph = 0, extra = {}) => P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph, ...extra }));
const jog = (t, t0, pl, x0, z0, vx, vz, ph = 0, e = 'focus') => { const sp = Math.hypot(vx, vz), st = clamp(1.15 + 0.3 * sp, 1.3, 3.6), d = sp * (t - t0), r = POSE.run(2 * PI * d / st + ph, clamp(sp / 6.5, 0.35, 1), 0);
  return P(pl, { x: x0 + vx * (t - t0), z: z0 + vz * (t - t0), head: Math.atan2(vz, vx), pose: r, e, t: t + ph }); };
// the "Siu": he jumps at t0, turns half round in the air and lands at t0 + 0.55 with his arms spread. h0: the way he faces
// before the jump; the turn is toward his left
function siu(t, pl, x, z, h0, t0, { e0 = JOY } = {}) {
  const u = clamp((t - t0) / 0.55), air = t > t0 && t < t0 + 0.55, land = smooth(clamp((t - t0 - 0.5) / 0.18));
  const head = h0 + PI * smooth(u), lift = air ? 0.62 * Math.sin(PI * u) : 0;
  const settle = t > t0 + 0.55 ? 0.12 * Math.exp(-(t - t0 - 0.55) * 7) : 0;  // the knees give as he lands
  let pose = t < t0 ? blend({ ...POSE.stand(), sh: [[0.4, 0.5], [0.4, 0.5]] }, TUCK, smooth(clamp((t - t0 + 0.2) / 0.2)) * 0.6) : blend(TUCK, SIU, land);
  const knee = pose.knee.map(k => k + settle * 3), flat = t < t0 ? 0 : land;  // feet flat on the grass from the landing on
  pose = { ...pose, knee, toes: pose.hip.map((h, i) => h[0] - knee[i]), toesW: flat, lift, watch: 0.8 * land };
  return P(pl, grounded(pl, { x, z, head, pose, e: t > t0 + 0.3 ? SHOUT : e0, t }));
}
// the bicycle kick, u 0..1: the take-off, his back to the goal; upside down with the right leg over his head (the strike at
// u = 0.45); down flat on his back by 0.72, his legs along the grass; then he sits up, leaning back on his hands. The legs
// are set in the world, the arms with the body
function bike(u) {
  const a = smooth(clamp(u / 0.45)), c = smooth(clamp((u - 0.45) / 0.27)), d = smooth(clamp((u - 0.72) / 0.28)), up = smooth(clamp(u / 0.22));
  const kick = lerp(0.3, 3.15, a) - 1.55 * c - 0.15 * d, other = lerp(0.4, 1.2, up) + 0.3 * c - 0.05 * d;
  const lean = lerp(0, -1.3, a) - 0.25 * c + 0.8 * d, py = lerp(0.93, 1.38, a) * (1 - c) + 0.2 * c + 0.06 * d;
  const kk = lerp(0.5, 0.06, a) + 0.3 * c + 0.4 * d, ko = lerp(0.8, 0.35, a) + 0.25 * c + 0.45 * d;
  const armF = lerp(0.3, 0.9, a) - 0.4 * c - 1.05 * d, armA = lerp(0.35, 1.1, a) + 0.25 * c - 0.95 * d;
  return { ...POSE.stand(), hip: [[other, 0.1], [kick, -0.04]], knee: [ko, kk], sh: [[armF, armA], [armF, armA]], el: [0.35 - 0.15 * d, 0.35 - 0.15 * d],
    lean, ground: false, pelvisY: py, look: -0.15 * a + 0.35 * d };
}

// ---------- pictures drawn flat on the screen
function photoIn(g, img, x, y, w, h, { z = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * z, sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, x, y, w, h); g.restore();
}
const ink = (g, txt, x, y, font, fill, lw = 16, stroke = '#0E1018') => { g.font = font; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); };
// the cover: the two names, the question under them
function titleVS(g, a = 1, k = 1, y = 180) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  g.font = sans(104, 900); const wm = g.measureText('MESSI').width, wr = g.measureText('RONALDO').width; g.font = sans(62, 900); const wv = g.measureText('vs').width, gap = 26;
  let x = -(wm + wv + wr + 2 * gap) / 2;
  ink(g, 'MESSI', x, 0, sans(104, 900), '#FFFFFF', 22); x += wm + gap;
  ink(g, 'vs', x, -6, sans(62, 900), GOLD, 16); x += wv + gap;
  ink(g, 'RONALDO', x, 0, sans(104, 900), '#FFFFFF', 22);
  g.textAlign = 'center'; ink(g, 'WHO STAT-PADS MORE?', 0, 112, sans(76, 900), '#FF4B3A', 18);
  g.restore();
  qaRect(g, 30, y - 95 * k, W - 60, 230 * k, 'text', 'cover title');
}
function title2(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FF4B3A', s1 = 96, s2 = 132, a = 1, k = 1 } = {}) {  // a small line over a heavy one
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, 0, 0); g.fillStyle = c1; g.fillText(l1, 0, 0);
  g.font = sans(s2, 900); g.strokeText(l2, 0, s2 * 1.02); g.fillStyle = c2; g.fillText(l2, 0, s2 * 1.02);
  g.restore();
  qaRect(g, 40, y - s1 * 0.8, W - 80, s1 * 0.8 + s2 * 1.1, 'text', 'cover title');
}
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
// a card for one player: his name on a band in his colours, a big number, a line under it. u: 0..1 how far it has come in
function statCard(g, cx, y, { name, big, sub = '', col = BLAU, col2 = null, u = 1, w = 440, numCol = GOLD } = {}) {
  if (u <= 0) return;
  const e = ease.out(clamp(u)), h = sub ? 300 : 250, x = cx - w / 2;
  g.save(); g.globalAlpha *= clamp(u * 2); g.translate(cx, y + h / 2); g.scale(0.9 + 0.1 * e, 0.9 + 0.1 * e); g.translate(-cx, -(y + h / 2));
  g.fillStyle = 'rgba(0,0,0,0.35)'; rrect(g, x + 8, y + 12, w, h, 26); g.fill();
  g.fillStyle = 'rgba(12,16,30,0.86)'; rrect(g, x, y, w, h, 26); g.fill();
  g.save(); rrect(g, x, y, w, h, 26); g.clip(); g.fillStyle = col; g.fillRect(x, y, w, 70);
  if (col2) { g.fillStyle = col2; for (let i = 1; i < 6; i += 2) g.fillRect(x + w * i / 6, y, w / 6, 70); } g.restore();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  ink(g, name, cx, y + 37, sans(42, 900), '#FFFFFF', 10);
  ink(g, big, cx, y + 150, sans(118, 900), numCol, 14);
  if (sub) { g.font = sans(30, 800); g.letterSpacing = '3px'; g.fillStyle = 'rgba(242,238,230,0.9)'; g.fillText(sub, cx, y + 252); g.letterSpacing = '0px'; }
  g.restore();
  qaRect(g, x, y, w, h, 'text', 'card ' + name);
}
// a ring that fills to a share: the share in the middle, a line under it
function ringMeter(g, cx, cy, r, frac, { col = GOLD, label = '', sub = '', a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.lineCap = 'round';
  g.fillStyle = 'rgba(12,16,30,0.78)'; g.beginPath(); g.arc(cx, cy, r + 34, 0, 2 * PI); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, r, 0, 2 * PI); g.stroke();
  if (frac > 0) { g.strokeStyle = col; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, r, -PI / 2, -PI / 2 + 2 * PI * frac); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; ink(g, label, cx, cy - 6, sans(96, 900), '#FFFFFF', 12);
  if (sub) { g.font = sans(26, 800); g.letterSpacing = '2px'; g.fillStyle = 'rgba(242,238,230,0.85)'; g.fillText(sub, cx, cy + r + 62); g.letterSpacing = '0px'; }
  g.restore();
  qaRect(g, cx - r - 34, cy - r - 34, 2 * r + 68, 2 * r + 68 + (sub ? 50 : 0), 'text', 'ring ' + label);
}
// a balance: a ball in each pan, worth what its player's goals are worth in points; tilt > 0: the right pan goes down
function scaleViz(g, cx, cy, tilt, { a = 1, lv = '', rv = '', ln = '', rn = '' } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  const L = 330, ca = Math.cos(tilt), sa = Math.sin(tilt), ends = [[cx - L * ca, cy - L * sa], [cx + L * ca, cy + L * sa]];
  g.fillStyle = 'rgba(12,16,30,0.6)'; rrect(g, cx - 430, cy - 170, 860, 640, 30); g.fill();
  g.fillStyle = '#C9CED8'; g.beginPath(); g.moveTo(cx - 70, cy + 400); g.lineTo(cx + 70, cy + 400); g.lineTo(cx + 12, cy); g.lineTo(cx - 12, cy); g.closePath(); g.fill();  // the stand
  g.strokeStyle = '#E8ECF2'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(ends[0][0], ends[0][1]); g.lineTo(ends[1][0], ends[1][1]); g.stroke();
  g.fillStyle = GOLD; g.beginPath(); g.arc(cx, cy, 18, 0, 2 * PI); g.fill();
  ends.forEach(([x, y], i) => {
    g.strokeStyle = 'rgba(232,236,242,0.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 80, y + 150); g.moveTo(x, y); g.lineTo(x + 80, y + 150); g.stroke();
    g.fillStyle = '#E8ECF2'; g.beginPath(); g.ellipse(x, y + 152, 96, 20, 0, 0, 2 * PI); g.fill();
    // the ball in the pan
    g.fillStyle = '#FAFAF8'; g.beginPath(); g.arc(x, y + 110, 40, 0, 2 * PI); g.fill(); g.fillStyle = '#22252C'; g.beginPath(); g.arc(x, y + 110, 13, 0, 2 * PI); g.fill();
    for (let k = 0; k < 5; k++) { const an = -PI / 2 + k * 2 * PI / 5; g.beginPath(); g.arc(x + Math.cos(an) * 32, y + 110 + Math.sin(an) * 32, 7, 0, 2 * PI); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    ink(g, i ? rv : lv, x, y + 238, sans(84, 900), GOLD, 12);
    ink(g, i ? rn : ln, x, y + 312, sans(38, 900), '#FFFFFF', 10);
  });
  g.restore();
  qaRect(g, cx - 430, cy - 170, 860, 640, 'text', 'scale');
}
// the picture breaks up: strips of it slide sideways, a colour fringe, a few bright bars. amt 0..1
function glitch(g, amt, seed = 0) {
  if (amt <= 0.01) return;
  const r = rng(Math.floor(seed * 9973) + 7), n = Math.round(5 + 16 * amt);
  g.save();
  for (let i = 0; i < n; i++) { const y = r() * H, h = 6 + r() * 70 * amt, dx = (r() - 0.5) * 220 * amt; g.drawImage(g.canvas, 0, y, W, h, dx, y, W, h); }
  g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.45 * amt;
  g.fillStyle = 'rgba(255,40,80,0.5)'; for (let i = 0; i < 3; i++) g.fillRect(0, r() * H, W, 2 + r() * 10 * amt);
  g.fillStyle = 'rgba(60,200,255,0.5)'; for (let i = 0; i < 3; i++) g.fillRect(0, r() * H, W, 2 + r() * 10 * amt);
  g.restore();
}
// an old replay: the colour gone, scan lines, REPLAY with a red dot, the place and the day
function replayLook(g, lt, place, day, k = 1) {
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${(0.95 * k).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalAlpha = 0.16 * k; g.fillStyle = '#000000'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
  g.save(); g.globalAlpha *= k; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillStyle = 'rgba(10,10,12,0.6)'; rrect(g, 40, 70, 560, 118, 18); g.fill();
  if (Math.floor(lt * 2) % 2 === 0) { g.fillStyle = '#E8392E'; g.beginPath(); g.arc(80, 106, 13, 0, 2 * PI); g.fill(); }
  g.font = sans(40, 900); g.letterSpacing = '4px'; g.fillStyle = '#F4F2EC'; g.fillText('REPLAY', 108, 108);
  g.font = sans(26, 800); g.letterSpacing = '3px'; g.fillStyle = 'rgba(244,242,236,0.85)'; g.fillText(`${place} · ${day}`, 64, 160); g.letterSpacing = '0px';
  g.restore();
  qaRect(g, 40, 70, 560, 118, 'text', 'replay label');
}


// ================================================================== the film
// One take of about 1:02 (STYLE_BIBLE rule 70): every change of shot is a camera swing or a push, every shot moves. The
// first frame is the iconic photograph of the two with their names over it; until it is here, a drawn poster of the two.
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain, ...o });  // o: { end, fade } (s): the sound dies away by `end`
  let panN = 0;
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: NIGHT_G, trans: 'pan', panDir: panN++ % 2 ? -1 : 1, transDur: 0.3, noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player'];
  const LINE = 52.5, SPOT = 41.5;
  const pinT = (t, t0) => (t > t0 ? pin(t, t0) : null);
  const plateAt = (g, t, t0, txt, y, o = {}) => { const p = pinT(t, t0); if (p) plate(g, txt, W / 2, y, { color: CREAM, size: 40, ...o, ...p }); };
  // a little score box with no team names: the scorer's side on the left
  const chip = (g, a, b, colL, colR, min = '', al = 1) => { if (al <= 0) return; g.save(); g.globalAlpha *= al; const x = 40, y = 76, w = 250, hh = 56;
    g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh); g.fillStyle = CREAM; g.fillRect(x, y, w, hh); g.fillStyle = colL; g.fillRect(x, y, 16, hh); g.fillStyle = colR; g.fillRect(x + w - 16, y, 16, hh);
    g.font = sans(36, 900); g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${a} – ${b}`, x + w / 2, y + hh / 2 + 2);
    if (min) { g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 100, hh); g.fillStyle = CREAM; g.font = sans(30, 900); g.fillText(min, x + w + 58, y + hh / 2 + 2); }
    qaRect(g, x, y, w + (min ? 108 : 0), hh, 'text', 'score chip'); g.restore(); };

  // ======================= THE OPENING (0–12 s, made to be lifted out whole) =======================
  const c1 = wn('hook', 'Ronaldo', 1) - 0.1, c2 = wn('hook', 'So') - 0.1, c3 = wn('hook', 'and') - 0.1, c4 = s('winners') - 0.1;
  const coverK = t => 1 + 0.06 * Math.exp(-Math.max(0, t - 0.05) * 6);
  // "Messi fans say Ronaldo stat-pads": the cover. The photograph if it is here, else the two of them side by side, a poster
  if (IMG.iconic) shot(0, (g, lt, t) => {
    const im = IMG.iconic, ph = W * im.height / im.width, y0 = Math.max(420, 1000 - ph / 2), z = 1 + 0.08 * glide(clamp(lt / c1));
    g.fillStyle = '#05070B'; g.fillRect(0, 0, W, H);
    g.save(); g.filter = 'blur(28px) brightness(0.5)'; photoIn(g, im, -80, -80, W + 160, H + 160); g.restore();
    g.save(); g.translate(W / 2, y0 + ph / 2); g.scale(z, z); g.translate(-W / 2, -(y0 + ph / 2)); photoIn(g, im, 0, y0, W, ph); g.restore();
    const gr = g.createLinearGradient(0, 0, 0, 520); gr.addColorStop(0, 'rgba(6,8,14,0.85)'); gr.addColorStop(1, 'rgba(6,8,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 520);
  }, { grade: PRINT_G, hud: (g, lt, t) => { titleVS(g, fadeOut(t, c1 - 0.1, 0.1), coverK(t)); } });
  else shot(0, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp(tt / c1)); return lookFrom([3.7 - 0.7 * v, 1.42, -0.35 + 0.7 * v], [0, 1.22, 0], { fov: lerp(1450, 1620, v), cy: H * 0.6 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, MESSI, 0, -0.62, 0.3, { ...HIPS, lean: 0.03 + 0.01 * Math.sin(t * 1.3), watch: 1 }, SMUG, 0), man(t, CR7, 0.05, 0.62, -0.3, { ...HIPS, lean: 0.02 + 0.01 * Math.sin(t * 1.1), watch: 1 }, SMUG, 1)], { cheer: 0.5, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { titleVS(g, fadeOut(t, c1 - 0.1, 0.1), coverK(t)); } });
  cue(0, 'boom_cine', 0.4); cue(0.05, 'camera', 0.3);
  // "Ronaldo fans say Messi does": Messi taps one in; it is already 5–0
  const tk1 = c1 + 0.62, tl1 = tk1 + 0.3;
  const cross1 = new BallPath([{ t0: tk1 - 0.9, t1: tk1, kind: 'roll', from: [LINE - 5.5, BALL_R, -14], to: [LINE - 3.3, BALL_R, 0.3], decay: 0.3 }, { t0: tk1, t1: tl1, kind: 'air', from: [LINE - 3.3, BALL_R, 0.3], to: [LINE + 0.4, 0.4, 0.9] },
    { t0: tl1, t1: tl1 + 0.4, kind: 'roll', from: [LINE + 0.4, BALL_R, 0.9], to: [LINE + 1.5, BALL_R, 1.0] }, { t0: tl1 + 0.4, t1: 99, kind: 'hold', from: [LINE + 1.5, BALL_R, 1.0] }]);
  const m1 = new Mover([[tk1 - 1.4, LINE - 9, 2.6], [tk1, LINE - 3.6, 0.6], [tk1 + 0.6, LINE - 2.4, 1.4, { stop: true }], [99, LINE - 2.4, 1.4]], { heading0: -0.3 });
  const gk1 = new Mover([[tk1 - 3, LINE - 0.6, -0.6], [99, LINE - 0.6, -0.6]], { heading0: PI, face: () => PI });
  const SKY_V = { ...SKYWARD, sh: [[2.7, 1.05], [2.7, 1.05]], el: [0.05, 0.05] };
  shot(c1, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c1) / (c2 - c1)); return lookFrom([LINE + 3.6 - 0.6 * v, 1.2, 1.6 - 0.8 * v], [LINE - 3.8, 1.05, 0.2], { fov: 1700, cy: H * 0.55 }); }, { shake: 0.5 + (t > tl1 ? 2 * Math.exp(-(t - tl1) * 7) : 0) });
    const rk = runKick(m1, t, tk1, 'L', { e: 'focus' }), cel = smooth(clamp((t - tl1 - 0.15) / 0.35));
    // arms up in a wide V (rule 57): straight up, the far arm went behind his head and the hand stuck out of his hair (the
    // author: «the hand of messi is behind his head making a strange plan»)
    stadium(g, t, [P(MESSI, cel > 0 ? { ...rk, pose: blend(rk.pose, SKY_V, cel), e: JOY } : rk), P(KEEP2, keeper(KEEP2, gk1, t, { dive: { t0: tk1 - 0.1, dur: 0.5, side: 1, dz: -1.6 }, face: PI })),
      jog(t, c1, OPPS[0], LINE - 9.5, -3.6, 2.2, 0.45, 1, 'worried'), ballOf(cross1, t)], { cheer: t > tl1 ? 1 : 0.6, blur: 2, hit: t > tl1 ? { t0: tl1, y: 0.4, z: 0.9, k: 1 } : null, hitSide: 1 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    chip(g, t > tl1 ? 6 : 5, 0, GARNET, OPP.shirt, '', 1);
    plateAt(g, t, c1 + 0.08, 'RONALDO FANS:', 300, { size: 40 });
    if (t > wn('hook', 'does.') - 0.05) stamp(g, 'STAT-PADS', W / 2, 430, lt, wn('hook', 'does.') - 0.05 - c1, { color: RED, size: 96, rot: -0.06 });
  } });
  cue(c1, 'whoosh_fast', 0.2); cue(tk1 - 0.02, 'kick', 0.6); cue(tl1, 'net', 0.7); cue(tl1 + 0.02, 'crowd_roar', 0.5); cue(wn('hook', 'does.') - 0.05, 'stamp', 0.5);
  // "So let's go through all 1,922 of their goals": goal after goal into one net, the count running; it splits into the two
  const n2 = 46, r2 = rng(1922), RAIN = Array.from({ length: n2 }, (_, i) => { const t0 = c2 + 0.15 + i * 0.075;
    return { t0, t1: t0 + 0.42, from: [LINE - 7.6 - r2() * 1.6, 0.15 + r2() * 0.35, (r2() - 0.5) * 9], to: [LINE + 0.9 + r2() * 0.8, 0.25 + r2() * 2.0, (r2() - 0.5) * 6.4], rest: [LINE + 1.0 + r2() * 0.8, BALL_R + (i % 5) * 0.05 + r2() * 0.05, (r2() - 0.5) * 6.4] }; });
  const rainAt = (t, gone = () => false) => RAIN.filter((b, i) => t > b.t0 && !gone(i)).map(b => { const u = clamp((t - b.t0) / (b.t1 - b.t0)), v = clamp((t - b.t1) / 0.35);
    const p = u < 1 ? [lerp(b.from[0], b.to[0], u), lerp(b.from[1], b.to[1], u) + 0.8 * Math.sin(PI * u), lerp(b.from[2], b.to[2], u)] : [lerp(b.to[0], b.rest[0], v), lerp(b.to[1], b.rest[1], v * v), lerp(b.to[2], b.rest[2], v)];
    return BALL(p); });
  const allT = wn('hook', 'all'), ofT = wn('hook', 'of');
  shot(c2, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c2) / (c3 - c2)); return lookFrom([LINE - 10.5 - 1.8 * v, 1.35 + 0.35 * v, 1.2 - 2.4 * v], [LINE + 0.8, 1.1, 0], { fov: lerp(1450, 1350, v), cy: H * 0.64 }); }, { shake: 0.5 });
    stadium(g, t, rainAt(t), { cheer: 0.9, blur: 3, hit: { t0: RAIN[Math.min(n2 - 1, Math.max(0, Math.floor((t - c2 - 0.15) / 0.075)))].t1, y: 1.2, z: 0, k: 0.6 }, hitSide: 1 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    const k = smooth(clamp((t - allT) / (ofT - allT - 0.05))), out = clamp((t - ofT + 0.02) / 0.1), split = smooth(clamp((t - ofT - 0.1) / 0.35));
    if (t > allT - 0.1 && out < 1) { g.save(); g.globalAlpha *= 1 - out; counter(g, Math.round(1922 * k).toLocaleString('en-US'), 'GOALS', { y: 470, size: 190, color: GOLD, at: [t, allT - 0.1] }); g.restore(); }
    if (split > 0) { statCard(g, 290, 290, { name: 'MESSI', big: '937', sub: 'GOALS · 1,185 GAMES', col: GARNET, col2: BLAU, u: split, w: 460 });
      statCard(g, 790, 290, { name: 'RONALDO', big: '985', sub: 'GOALS · 1,343 GAMES', col: '#E8E6E0', u: split, w: 460, numCol: GOLD });
      if (split > 0.5) { g.save(); g.globalAlpha *= (split - 0.5) * 2; g.font = sans(22, 800); g.letterSpacing = '3px'; g.textAlign = 'center'; g.fillStyle = 'rgba(242,238,230,0.75)'; g.fillText('CLUB AND COUNTRY · AS OF 10 NOV 2026', W / 2, 640); g.letterSpacing = '0px'; g.restore(); } }
  } });
  cue(c2, 'whoosh_soft', 0.2); for (let i = 0; i < n2; i += 6) cue(RAIN[i].t1, 'net', 0.35); cue(allT, 'riser', 0.25); cue(ofT, 'stamp', 0.4);
  // "and find out whose goals actually win games": the two of them back to back; the camera goes round them
  const winT = wn('hook', 'win');
  shot(c3, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - c3) / (c4 - c3))); return K(-PI / 2 - 0.55 + 1.1 * v, 0.02, lerp(4.4, 3.7, v), [0, 1.3, 0], { fov: 1550, cy: H * 0.56 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, MESSI, 0, -0.27, -PI / 2, { ...HIPS, watch: 0.7 }, GRAVE, 0), man(t, CR7, 0, 0.3, PI / 2, { ...HIPS, watch: 0.7 }, GRAVE, 2)], { cheer: 0.6, blur: 4, goals: false });
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => {
    title2(g, 'WHOSE GOALS', 'WIN GAMES?', 230, { c2: LIME, s1: 72, s2: 120, a: clamp((t - winT + 0.1) / 0.1), k: 1 + 0.08 * Math.exp(-Math.max(0, t - winT) * 6) });
  } });
  cue(c3, 'whoosh_deep', 0.25); cue(winT - 0.1, 'boom_cine', 0.45);

  // ======================= GOALS THAT WON THE MATCH =======================
  const c5 = wn('winners', 'Ronaldo', 0) - 0.1, c6 = wn('winners', "That's") - 0.1, c7 = s('delete') - 0.1;
  // "Goals that won the match: Messi 196": in from the right onto his left foot, curled into the far top corner, 2–1
  const tk4 = wn('winners', 'won') + 0.15, tl4 = tk4 + 0.75;
  const m4 = new Mover([[tk4 - 2.4, LINE - 24, -12], [tk4, LINE - 19, -6.4], [tk4 + 0.5, LINE - 17.8, -6.2, { stop: true }], [tk4 + 1.6, LINE - 15, -11], [99, LINE - 15, -11]], { heading0: 0.5 });
  const m4k = m4.at(tk4), B4 = [m4k.x + Math.cos(m4k.head) * 0.55, BALL_R, m4k.z + Math.sin(m4k.head) * 0.55], E4 = [LINE + 0.15, 2.05, 3.0];
  const ball4 = new BallPath([{ t0: tk4 - 3, t1: tk4 - 2.4, kind: 'hold', from: [LINE - 23.4, BALL_R, -11.6] },
    { t0: tk4 - 2.4, t1: tk4, kind: 'fn', fn: tt => { const m = m4.at(tt), f = [Math.cos(m.head), Math.sin(m.head)]; return [m.x + f[0] * 0.55, BALL_R + 0.04 * Math.abs(Math.sin(m.phase)), m.z + f[1] * 0.55]; } },
    { t0: tk4, t1: tl4, kind: 'fn', fn: tt => { const u = (tt - tk4) / (tl4 - tk4); return [lerp(B4[0], E4[0], u), lerp(B4[1], E4[1], u) + 1.6 * Math.sin(PI * u) * (1 - u * 0.3), lerp(B4[2], E4[2], u) - 3.2 * Math.sin(PI * u)]; } },
    { t0: tl4, t1: tl4 + 0.4, kind: 'air', from: E4, to: [LINE + 1.5, 0.6, 3.2] }, { t0: tl4 + 0.4, t1: 99, kind: 'hold', from: [LINE + 1.6, BALL_R, 3.3] }]);
  const gk4 = new Mover([[tk4 - 3, LINE - 0.8, -1.2], [tk4, LINE - 0.9, -1.0], [99, LINE - 0.9, -1.0]], { heading0: PI, face: () => PI });
  shot(c4, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = m4.at(Math.min(tt, tk4 + 0.2)), v = clamp((tt - c4) / (c5 - c4)); const w = smooth(clamp((tt - tl4 - 0.15) / 0.7)), mm = m4.at(tt); return lookFrom([m.x - 4.2 + 1.2 * v, 1.7, m.z - 2.6], [lerp(lerp(m.x + 6, LINE - 2, smooth(clamp((tt - tk4) / 0.6))), mm.x + 0.6, w), lerp(1.4, 1.3, w), lerp(lerp(m.z + 3, 1, smooth(clamp((tt - tk4) / 0.6))), mm.z, w)], { fov: lerp(1500, 2300, w), cy: H * 0.55 }); }, { shake: 0.5 + (t > tl4 ? 2 * Math.exp(-(t - tl4) * 7) : 0) });
    const rk = runKick(m4, t, tk4, 'L', { e: 'focus' }), cel = smooth(clamp((t - tl4 - 0.1) / 0.4));
    stadium(g, t, [P(MESSI, cel > 0 ? { ...rk, pose: blend(rk.pose, SKYWARD, cel), e: JOY } : rk), P(KEEP, keeper(KEEP, gk4, t, { dive: { t0: tk4 + 0.35, dur: 0.5, side: -1, dz: 2.6, reach: 0.8 }, face: PI })),
      jog(t, c4, OPPS[2], LINE - 9, 2.5, -0.6, -1.4, 3, 'worried'), ballOf(ball4, t, { trail: t > tk4 && t < tl4 ? trailOf(ball4, t) : null })],
      { cheer: t > tl4 ? 1 : 0.5, blur: 2, hit: t > tl4 ? { t0: tl4, y: 2.05, z: 3.0, k: 1 } : null, hitSide: 1 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    chip(g, t > tl4 ? 2 : 1, 1, GARNET, OPP.shirt, "88'", 1);
    plateAt(g, t, c4 + 0.15, 'GOALS THAT WON THE MATCH', 300, { size: 42, color: LIME, ink: '#10200A' });
    const n = wn('winners', '196,'); if (t > n - 0.05) counter(g, '196', 'MESSI', { y: 520, size: 200, color: GOLD, at: [t, n - 0.05] });
  } });
  cue(c4, 'whoosh_fast', 0.2); cue(tk4 - 0.02, 'kick', 0.8); cue(tl4, 'net', 0.8); cue(tl4 + 0.02, 'crowd_roar', 0.7); cue(wn('winners', '196,') - 0.05, 'boom_move', 0.4);
  // "Ronaldo 240": a cross from the left, he climbs above everyone and heads it in
  const tj5 = wn('winners', 'Ronaldo', 0) + 0.45, th5 = tj5 + 0.28, tl5 = th5 + 0.3, R5 = [LINE - 9.5, 0.4];
  const r5 = new Mover([[tj5 - 1.4, LINE - 13, 3.2], [tj5, R5[0], R5[1], { stop: true }], [tj5 + 0.9, R5[0] + 0.4, R5[1] - 0.2, { stop: true }], [99, R5[0] + 0.4, R5[1] - 0.2]], { heading0: -0.4, face: tt => (tt > tj5 - 0.3 ? 0.15 : null) });
  const jump5 = tt => { const u = clamp((tt - tj5) / 0.62); return 0.78 * Math.sin(PI * u); };
  const HEAD5 = [R5[0] + 0.2, 1.87 + 0.78 + 0.05, R5[1]];
  const ball5 = new BallPath([{ t0: th5 - 1.3, t1: th5, kind: 'air', from: [LINE - 6, 1.0, 19], to: HEAD5, g: 6 }, { t0: th5, t1: tl5, kind: 'air', from: HEAD5, to: [LINE + 0.2, 0.7, -2.6] },
    { t0: tl5, t1: tl5 + 0.4, kind: 'air', from: [LINE + 0.2, 0.7, -2.6], to: [LINE + 1.5, BALL_R, -2.8] }, { t0: tl5 + 0.4, t1: 99, kind: 'hold', from: [LINE + 1.6, BALL_R, -2.8] }]);
  const gk5 = new Mover([[tj5 - 3, LINE - 0.7, 0.6], [99, LINE - 0.7, 0.6]], { heading0: PI, face: () => PI });
  const LEAP = { ...POSE.stand(), hip: [[0.35, 0.1], [0.9, 0.12]], knee: [0.7, 1.5], sh: [[1.5, 0.55], [1.2, 0.6]], el: [0.7, 0.7], lean: 0.08, look: 0.35 };
  shot(c5, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c5) / (c6 - c5)); return lookFrom([LINE - 6.6 + 0.6 * v, 0.75, -4.4 + 0.3 * v], [R5[0] + 0.3, 1.9, R5[1]], { fov: 1450, cy: H * 0.58 }); }, { shake: 0.5 + (t > tl5 ? 2 * Math.exp(-(t - tl5) * 7) : 0) });
    const ms = moving(r5, t, { e: 'focus', t }), j = jump5(t), inAir = t > tj5 && t < tj5 + 0.62, w = smooth(clamp((t - tj5 + 0.15) / 0.2)) * (1 - smooth(clamp((t - tj5 - 0.55) / 0.25)));
    const cel = smooth(clamp((t - tj5 - 0.75) / 0.35)), it = P(CR7, grounded(CR7, { ...ms, head: 0.15 + 0.5 * cel, pose: { ...blend(blend(ms.pose, LEAP, w), { ...POSE.stand(), sh: [[0.35, 1.15], [0.35, 1.15]], el: [0.15, 0.15], fingers: true, lean: -0.12 }, cel), lift: j }, e: t > tl5 ? SHOUT : 'focus', air: j }));
    stadium(g, t, [it, man(t, OPPS2[0], R5[0] + 0.9, R5[1] + 1.7, PI - 0.3, { lift: 0.35 * Math.max(0, Math.sin(PI * clamp((t - tj5 - 0.05) / 0.55))) }, 'worried', 1),
      P(KEEP2, keeper(KEEP2, gk5, t, { dive: { t0: th5 + 0.05, dur: 0.45, side: 1, dz: -1.6 }, face: PI })), ballOf(ball5, t, { trail: t > th5 && t < tl5 ? trailOf(ball5, t) : null })],
      { cheer: t > tl5 ? 1 : 0.6, blur: 2.5, hit: t > tl5 ? { t0: tl5, y: 0.7, z: -2.6, k: 1 } : null, hitSide: 1 });
  }, { mbStep: 3, mbMax: 12, qaAllow: [...CROWDED, 'head out of frame'], hud: (g, lt, t) => {
    chip(g, t > tl5 ? 2 : 1, 1, '#E8E6E0', OPP2.shirt, "90'", 1);
    plateAt(g, t, c5 + 0.05, 'GOALS THAT WON THE MATCH', 300, { size: 42, color: LIME, ink: '#10200A' });
    const n = wn('winners', '240.'); if (t > n - 0.05) counter(g, '240', 'RONALDO', { y: 520, size: 200, color: GOLD, at: [t, n - 0.05] });
  } });
  cue(c5, 'whoosh_fast', 0.2); cue(th5, 'touch', 0.7); cue(tl5, 'net', 0.8); cue(tl5 + 0.02, 'crowd_roar', 0.7); cue(wn('winners', '240.') - 0.05, 'boom_move', 0.4);
  // "That's 21% of Messi's goals and 24% of Ronaldo's": the two of them, each under a ring that fills to his share
  const p21 = wn('winners', '21%'), p24 = wn('winners', '24%');
  shot(c6, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - c6) / (c7 - c6))); const a = lerp(-0.42, 0.42, v), d = lerp(5.0, 4.1, v); return lookFrom([d * Math.cos(a), 1.25 + 0.15 * v, d * Math.sin(a)], [0, 1.1, 0], { fov: 1500, cy: H * 0.7 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, MESSI, 0, -1.1, 0.1, { ...HIPS, watch: 1 }, t > p21 ? SMUG : 'focus', 0), man(t, CR7, 0, 1.1, -0.1, { ...HIPS, watch: 1 }, t > p24 ? SMUG : 'focus', 2)], { cheer: 0.5, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    plateAt(g, t, c6 + 0.1, 'SHARE OF THEIR GOALS THAT WON THE MATCH', 230, { size: 32 });
    ringMeter(g, 290, 560, 150, 0.208 * smooth(clamp((t - p21 + 0.1) / 0.6)), { col: GOLD, label: t > p21 - 0.1 ? '21%' : '', sub: 'MESSI · 196 OF 937', a: clamp((t - c6 - 0.2) / 0.3) });
    ringMeter(g, 790, 560, 150, 0.244 * smooth(clamp((t - p24 + 0.1) / 0.6)), { col: LIME, label: t > p24 - 0.1 ? '24%' : '', sub: 'RONALDO · 240 OF 985', a: clamp((t - c6 - 0.2) / 0.3) });
  } });
  cue(c6, 'whoosh_soft', 0.2); cue(p21 - 0.1, 'shimmer', 0.4); cue(p24 - 0.1, 'shimmer', 0.45);

  // ======================= DELETE EVERY GOAL =======================
  const delT = wn('delete', 'delete'), scT = wn('delete', 'scored.'), c8 = wn('delete', "Ronaldo's", 0) - 0.1, c9 = wn('delete', "Messi's", 0) - 0.1, c10 = wn('delete', 'Without', 0) - 0.1, c11 = wn('delete', "That's") - 0.1, c12 = s('verdict') - 0.1;
  // "Now delete every goal they ever scored": the net full of their goals; they go, one after another
  const goneAt = i => delT + 0.2 + (n2 - 1 - i) * ((scT - delT) / n2);
  shot(c7, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c7) / (c8 - c7)); return lookFrom([LINE - 6.5 - 4.0 * v, 1.25 + 0.4 * v, -1.6 + 2.6 * v], [LINE + 1.0, 0.9, 0], { fov: lerp(1500, 1380, v), cy: H * 0.64 }); }, { shake: 0.4 });
    stadium(g, t, rainAt(9e9, i => t > goneAt(i)), { cheer: 0.3, blur: 3 });
    for (let i = 0; i < n2; i++) { const d = t - goneAt(i); if (d > 0 && d < 0.25) { const b = RAIN[i].rest, q = B.project(b[0], b[1], b[2]); if (q.z > 0.3) { g.save(); g.globalAlpha = 1 - d / 0.25; g.strokeStyle = '#FF5A4A'; g.lineWidth = 4; g.beginPath(); g.arc(q.x, q.y, (0.2 + d * 2) * q.s * 0.3, 0, 2 * PI); g.stroke(); g.restore(); } } }
  }, { trans: 'push', qaAllow: CROWDED, post: (g, lt, t) => { glitch(g, Math.exp(-Math.max(0, t - delT) * 5) * (t > delT ? 0.9 : 0), Math.floor(t * 20)); }, hud: (g, lt, t) => {
    const left = RAIN.filter((_, i) => t <= goneAt(i)).length, n = Math.round(1922 * left / n2);
    counter(g, n.toLocaleString('en-US'), 'GOALS', { y: 470, size: 190, color: t > delT ? RED : GOLD, at: [t, c7] });
    if (t > delT - 0.05) stamp(g, 'DELETE', W / 2, 760, lt, delT - 0.05 - c7, { color: RED, size: 110, rot: -0.05 });
  } });
  cue(c7, 'whoosh_deep', 0.25); cue(delT - 0.05, 'error', 0.6); cue(delT, 'radio_static', 0.35); for (let i = 0; i < n2; i += 5) cue(goneAt(i), 'sparkle_pop', 0.25);
  // "Ronaldo's bicycle kick in Turin? Gone.": the replay; at "Gone" it breaks up and he is not there any more
  const goneT = wn('delete', 'Gone.'), tb0 = wn('delete', 'kick') - 0.5, tkB = tb0 + 0.495, tlB = tkB + 0.42, RB = [LINE - 11.5, 0.5];
  const footAt = () => { const st = { x: RB[0], z: RB[1], head: PI, pose: bike(0.45) }, sk = skeleton(CR7, st); return sk.legs[1].toe; };
  const FB = footAt(), GB = [LINE + 0.2, 0.55, -2.9];
  const ballB = new BallPath([{ t0: tkB - 1.25, t1: tkB, kind: 'air', from: [LINE - 15, 1.0, -21], to: FB, g: 5 }, { t0: tkB, t1: tlB, kind: 'air', from: FB, to: GB, g: 2 },
    { t0: tlB, t1: tlB + 0.4, kind: 'air', from: GB, to: [LINE + 1.5, BALL_R, -3.1] }, { t0: tlB + 0.4, t1: 99, kind: 'hold', from: [LINE + 1.6, BALL_R, -3.1] }]);
  const rB = new Mover([[tb0 - 1.2, RB[0] + 1.6, RB[1] + 1.4], [tb0 - 0.1, RB[0], RB[1], { stop: true }], [99, RB[0], RB[1]]], { heading0: PI - 0.5, face: tt => (tt > tb0 - 0.5 ? PI : null) });
  const gkB = new Mover([[tb0 - 3, LINE - 0.7, -0.6], [99, LINE - 0.7, -0.6]], { heading0: PI, face: () => PI });
  shot(c8, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c8) / (c9 - c8)); return lookFrom([RB[0] + 0.6 + 0.8 * v, 1.25, 7.6 - 0.7 * v], [RB[0] + 0.7, 1.55, RB[1]], { fov: 1500, cy: H * 0.45 }); }, { shake: 0.4 + (t > tlB ? 1.5 * Math.exp(-(t - tlB) * 7) : 0) });
    const gone = t > goneT + 0.05, u = clamp((t - tb0) / 1.1), ms = moving(rB, t, { e: 'focus', t });
    const cr = t < tb0 ? P(CR7, ms) : P(CR7, { x: RB[0], z: RB[1], head: PI, pose: bike(u), e: u > 0.6 ? 'shock' : 'focus', t, air: Math.max(0, bike(u).pelvisY - 0.93), shadow: { r: 0.5 } });
    stadium(g, t, [...(gone ? [] : [cr, ballOf(ballB, t, { trail: t > tkB && t < tlB ? trailOf(ballB, t) : null })]), man(t, JUVS[0], RB[0] - 1.2, RB[1] - 2.4, 0.4, { lift: 0 }, 'shock', 1), man(t, JUVS[1], RB[0] + 2.6, RB[1] - 1.9, PI + 0.4, {}, 'worried', 2),
      P(KEEP, keeper(KEEP, gkB, t, { face: PI }))], { cheer: 0.6, blur: 2, hit: !gone && t > tlB ? { t0: tlB, y: 0.55, z: -2.9, k: 1 } : null, hitSide: 1 });
  }, { qaAllow: [...CROWDED, 'head out of frame'], post: (g, lt, t) => { replayLook(g, lt, 'TURIN', '3 APRIL 2018'); glitch(g, (t > goneT - 0.05 ? 1 : 0) * Math.exp(-Math.max(0, t - goneT + 0.05) * 4), Math.floor(t * 24));
    if (t > goneT - 0.02) stamp(g, 'GONE', W / 2, 520, lt, goneT - 0.02 - c8, { color: RED, size: 150, rot: -0.07 });  // after the grey: the stamp keeps its red
  } });
  cue(c8, 'whoosh_fast', 0.2); cue(c8 + 0.05, 'radio_static', 0.2); cue(tkB - 0.02, 'kick', 0.7); cue(tlB, 'net', 0.7); cue(goneT - 0.05, 'record_scratch', 0.6); cue(goneT, 'stamp', 0.5);
  // "Messi's run through Getafe? Never happened.": the replay, at 19; at "Never" he is gone from it, the defenders left looking
  const nevT = wn('delete', 'Never'), MG = new Mover([[c9 - 1.0, 3, -10.2], [c9 + 0.4, 8, -8.7], [c9 + 2.4, 17.5, -5.6]], { heading0: 0.25 });
  const REPS = 0.72, rt = t => c9 + (t - c9) * REPS;  // the replay's clock
  const getAt = (t, i, x, z, h0) => { const m = MG.at(t), d = Math.hypot(m.x - x, m.z - z), lunge = smooth(clamp(1.2 - d / 2.4)), past = smooth(clamp((m.x - x - 0.1) / 0.9));
    const lungeP = blend(POSE.stand(), { lean: 0.2, hip: [[0.9, 0.2], [0.2, 0.2]], knee: [0.9, 0.5] }, lunge), afterP = blend(POSE.stand(), { ...POSE.stand(), lean: 0.12, hip: [[0.35, 0.12], [0.1, 0.12]], knee: [0.5, 0.2] }, 0.8);
    const ha = Math.atan2(m.z - z, m.x - x), hd = h0 + Math.atan2(Math.sin(ha - h0), Math.cos(ha - h0)) * past;
    return man(t, GETS[i], x + 0.4 * past, z, hd, blend(lungeP, afterP, past), t > nevT + 0.1 ? 'worried' : 'focus', i); };
  shot(c9, (g, lt, t) => {
    // once he is gone the camera does not stop: it keeps going on along his line, slowly, and closes in on the empty spot
    rigFn(lt, t, tt => { const k = Math.max(0, tt - nevT - 0.1), u = smooth(clamp(k / 1.6)), m = MG.at(rt(Math.min(tt, nevT + 0.1)) + k * 0.3);
      return lookFrom([m.x - 1.2, 3.4 - 0.35 * u, m.z - 9.5 + 1.4 * u], [m.x + 0.8, 0.95, m.z], { fov: 2300 + 180 * u, cy: H * 0.52 }); }, { shake: 0.2 });
    const r = rt(t), gone = t > nevT + 0.05, ms = moving(MG, r, { e: 'focus', t: r, drib: 1 }), m = MG.at(r), f = [Math.cos(m.head), Math.sin(m.head)];
    stadium(g, r, [...(gone ? [] : [P(MESSI07, ms), BALL([m.x + f[0] * 0.5, BALL_R + 0.04 * Math.abs(Math.sin(m.phase * 2)), m.z + f[1] * 0.5])]),
      // the defenders on the far side of his line from the camera, so none of them steps between it and him (rule 57)
      getAt(r, 0, 9.5, -7.3, PI + 0.2), getAt(r, 1, 12.6, -6.2, PI - 0.2), getAt(r, 2, 15.6, -5.2, PI + 0.3), getAt(r, 3, 19.5, -3.6, PI - 0.4)], { cheer: 0.7, blur: 2, goals: false });
  }, { mbStep: 1.5, mbMax: 16, qaAllow: [...CROWDED, 'head out of frame'], post: (g, lt, t) => { replayLook(g, lt, 'CAMP NOU', '18 APRIL 2007');  // dense blur: a lunging defender came out as two or three see-through copies glitch(g, (t > nevT - 0.05 ? 1 : 0) * Math.exp(-Math.max(0, t - nevT + 0.05) * 4), Math.floor(t * 24) + 5);
    if (t > nevT - 0.02) stamp(g, 'NEVER HAPPENED', W / 2, 520, lt, nevT - 0.02 - c9, { color: RED, size: 80, rot: -0.05 });
  } });
  cue(c9, 'whoosh_fast', 0.2); cue(c9 + 0.05, 'radio_static', 0.2); cue(nevT - 0.05, 'record_scratch', 0.6); cue(nevT + 0.02, 'stamp', 0.5);
  // "Without Messi's goals, his teams lose 364 points. Without Ronaldo's, 418.": each of them, and what his teams would lose
  const t364 = wn('delete', '364'), wR = wn('delete', 'Without', 1), t418 = wn('delete', '418.');
  shot(c10, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - wR + 0.5) / 0.9)); const h = tt < wR - 0.5 ? clamp((tt - c10) / (wR - 0.5 - c10)) : clamp((tt - wR - 0.4) / (c11 - wR - 0.4)), a = lerp(-0.45, 0.4, glide(h)), d = lerp(4.8, 3.7, glide(h)), z = lerp(-3.2, 3.2, v);
      return lookFrom([d * Math.cos(a), 1.45, z + d * Math.sin(a)], [0, 1.3, z], { fov: 1500, cy: H * 0.66 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, MESSI, 0, -3.2, 0.15, { ...HIPS, look: -0.3, watch: 1 }, LOST, 0), man(t, CR7, 0, 3.2, -0.15, { ...HIPS, look: -0.3, watch: 1 }, LOST, 2)], { cheer: 0.2, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    plateAt(g, t, c10 + 0.1, 'WITHOUT THEIR GOALS', 230, { size: 40 });
    const aM = 1 - smooth(clamp((t - wR + 0.4) / 0.3)); if (t > t364 - 0.05 && aM > 0) { g.save(); g.globalAlpha *= aM; counter(g, '−364', 'POINTS LOST · MESSI', { y: 470, size: 190, color: RED, at: [t, t364 - 0.05] }); g.restore(); }
    if (t > t418 - 0.05) counter(g, '−418', 'POINTS LOST · RONALDO', { y: 470, size: 190, color: RED, at: [t, t418 - 0.05] });
  } });
  cue(c10, 'whoosh_soft', 0.2); cue(t364 - 0.05, 'boom_move', 0.45); cue(wR - 0.3, 'whoosh_fast', 0.2); cue(t418 - 0.05, 'boom_move', 0.5);
  // "That's 0.39 points per Messi goal and 0.42 per Ronaldo goal": a balance, a goal in each pan; Ronaldo's weighs more
  const t39 = wn('delete', '0.39'), t42 = wn('delete', '0.42');
  shot(c11, (g, lt, t) => {
    rigFn(lt, t, tt => K(-0.5 + 0.25 * (tt - c11), 0.42, 34, [0, 1, 0], { fov: 1500, cy: H * 0.5 }), { shake: 0.2 });
    stadium(g, t, [], { cheer: 0.3, blur: 9 });
  }, { grade: GRAPH_G, hud: (g, lt, t) => {
    title2(g, 'POINTS', 'PER GOAL', 240, { c2: GOLD, s1: 70, s2: 104, a: clamp((t - c11 - 0.1) / 0.15) });
    const tilt = 0.13 * ease.out(clamp((t - t42 - 0.1) / 0.7)) + 0.02 * Math.sin(t * 3) * clamp((t - t42) / 0.5);
    scaleViz(g, W / 2, 760, tilt, { a: clamp((t - c11 - 0.2) / 0.3), lv: t > t39 - 0.05 ? '0.39' : '', rv: t > t42 - 0.05 ? '0.42' : '', ln: 'MESSI', rn: 'RONALDO' });
  } });
  cue(c11, 'whoosh_soft', 0.22); cue(t39 - 0.05, 'stamp', 0.35); cue(t42 - 0.05, 'stamp', 0.4); cue(t42 + 0.2, 'thud', 0.5);

  // ======================= WHO STAT-PADS MORE =======================
  const c13 = wn('verdict', 'More', 1) - 0.1, c14 = wn('verdict', "Ronaldo's") - 0.1, c15 = wn('verdict', 'Case') - 0.1, mT = wn('verdict', 'Messi.');
  // "So who stat-pads more?": the two of them side by side, and a held silence of 2 s in the narration (the author:
  // «add some suspence when the final rusult comes ... make us see both players and then make a zoom on messi to reveal
  // the result»), the camera creeping in, the crowd hushed, a heartbeat. On "The numbers say Messi." it rushes in on
  // Messi and lands on his face as the stamp comes down on "Messi."
  const qT = wn('verdict', 'more?'), zA = wn('verdict', 'The') - 0.15, zB = mT - 0.05;
  shot(c12, (g, lt, t) => {
    rigFn(lt, t, tt => {
      const s1 = glide(clamp((tt - c12) / (zA - c12))), z = ease.inOut(clamp((tt - zA) / (zB - zA))), s3 = glide(clamp((tt - zB) / (c13 - zB)));
      const E1 = [lerp(4.6, 3.6, s1), 1.48, 0], A1 = [0, 1.3, 0], E2 = [lerp(2.4, 2.0, s3), 1.52, -0.55], A2 = [0, 1.38, -0.55];
      const L = (u, v) => [lerp(u[0], v[0], z), lerp(u[1], v[1], z), lerp(u[2], v[2], z)];
      return lookFrom(L(E1, E2), L(A1, A2), { fov: lerp(1650, 2050, z), cy: H * 0.56 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, MESSI, 0, -0.55, 0, { ...HIPS, look: 0.05, watch: 1 }, t > mT ? SMUG : GRAVE, 0),
      man(t, CR7, 0.05, 0.55, 0, { ...HIPS, look: 0.05, watch: 1 }, GRAVE, 2)], { cheer: t > mT ? 0.7 : 0.15, blur: 5, goals: false });
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => {
    title2(g, 'WHO STAT-PADS', 'MORE?', 230, { c2: RED, s1: 74, s2: 120, a: clamp((t - c12 - 0.05) / 0.12) });
    if (t > mT - 0.05) stamp(g, 'MESSI', W / 2, 560, lt, mT - 0.05 - c12, { color: GOLD, size: 130, rot: -0.05 });
  } });
  cue(c12, 'whoosh_deep', 0.25); cue(qT + 0.75, 'heartbeat', 0.6); cue(zA, 'whoosh_fast', 0.3); cue(mT - 0.05, 'boom_big', 0.5); cue(mT, 'stamp', 0.5);  // the heartbeat: two beats in the silence
  // "More of his goals came when Barcelona were already cruising, which, to be fair, was most weekends": 4–0 up, he walks
  // round the goalkeeper and rolls in the fifth
  const alrT = wn('verdict', 'already'), wkT = wn('verdict', 'weekends.'), tk13 = alrT + 0.55, tl13 = tk13 + 0.55;
  const m13 = new Mover([[c13 - 0.5, LINE - 16, -3], [tk13 - 0.6, LINE - 6, -1.4], [tk13 - 0.15, LINE - 3.6, 1.5], [tk13, LINE - 3.2, 1.6], [tk13 + 0.8, LINE - 1.2, 2.3, { stop: true }], [tk13 + 1.3, LINE - 1.2, 2.3], [tk13 + 4.5, LINE - 6.5, 5.2]], { heading0: 0.1 });
  const ball13 = new BallPath([{ t0: c13 - 0.5, t1: tk13, kind: 'fn', fn: tt => { const m = m13.at(tt), f = [Math.cos(m.head), Math.sin(m.head)]; return [m.x + f[0] * 0.5, BALL_R + 0.04 * Math.abs(Math.sin(m.phase)), m.z + f[1] * 0.5]; } },
    { t0: tk13, t1: tl13, kind: 'roll', from: [LINE - 2.7, BALL_R, 1.75], to: [LINE + 0.6, BALL_R, 0.6], decay: 0.4 }, { t0: tl13, t1: tl13 + 0.5, kind: 'roll', from: [LINE + 0.6, BALL_R, 0.6], to: [LINE + 1.3, BALL_R, 0.5] }, { t0: tl13 + 0.5, t1: 99, kind: 'hold', from: [LINE + 1.3, BALL_R, 0.5] }]);
  const gk13 = new Mover([[c13 - 1, LINE - 0.6, 0], [tk13 - 0.7, LINE - 2.6, -0.8], [tk13 - 0.2, LINE - 3.4, -1.0, { stop: true }], [99, LINE - 3.4, -1.0]], { heading0: PI, face: () => PI });
  shot(c13, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - c13) / (c14 - c13)), m = m13.at(Math.min(tt, tk13 + 0.5)); return lookFrom([m.x - 4.5 + 1.2 * v, 2.0 - 0.5 * v, m.z + 5.2], [m.x + 1.2, 1.0, m.z], { fov: lerp(1500, 1800, smooth(clamp((tt - tk13 - 0.8) / 1.5))), cy: H * 0.55 }); }, { shake: 0.4 });
    const rk = runKick(m13, t, tk13, 'L', { e: 'focus', I: 0.6 }), cel = smooth(clamp((t - tl13) / 0.5));
    stadium(g, t, [P(MESSI, cel > 0 ? { ...rk, pose: blend(rk.pose, { sh: [[0.3, 0.5], [0.3, 0.5]], el: [0.3, 0.3] }, cel), e: SMUG } : rk), P(KEEP2, keeper(KEEP2, gk13, t, { dive: { t0: tk13 - 0.25, dur: 0.5, side: 1, dz: -1.3 }, face: PI })),
      jog(t, c13, OPPS[3], LINE - 14, -6, 2.2, 0.9, 1, 'worried'), jog(t, c13, BARS[1], LINE - 18, 4, 2.6, -0.3, 2, JOY), ballOf(ball13, t)], { cheer: t > tl13 ? 0.9 : 0.6, blur: 2.5 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    chip(g, t > tl13 ? 5 : 4, 0, GARNET, OPP.shirt, "71'", 1);
    plateAt(g, t, alrT - 0.05, 'ALREADY CRUISING', 300, { size: 44, color: LIME, ink: '#10200A' });
    plateAt(g, t, wkT - 0.05, '…MOST WEEKENDS', 400, { size: 44, color: GOLD, ink: '#2A1E06' });
  } });
  cue(c13, 'whoosh_fast', 0.2); cue(tk13 - 0.02, 'kick', 0.5); cue(tl13, 'net', 0.6); cue(tl13 + 0.02, 'crowd_roar', 0.4); cue(wkT - 0.05, 'stamp', 0.4);
  // "Ronaldo's goals decide more games.": 1–1 in the 89th minute; he hits it from 25 metres, wheels away and jumps
  const decT = wn('verdict', 'decide'), tk14 = decT - 0.35, tl14 = tk14 + 0.45, t0S = c15 + 0.1;
  const m14 = new Mover([[tk14 - 1.6, LINE - 30, 4], [tk14, LINE - 25.5, 1.8], [tk14 + 0.5, LINE - 24.3, 1.4], [t0S, LINE - 21, -3.5, { stop: true }], [99, LINE - 21, -3.5]], { heading0: -0.3 });
  const ball14 = new BallPath([{ t0: tk14 - 1.6, t1: tk14, kind: 'roll', from: [LINE - 32, BALL_R, -6], to: [LINE - 25.0, BALL_R, 1.6], decay: 0.5 }, { t0: tk14, t1: tl14, kind: 'air', from: [LINE - 25.0, BALL_R, 1.6], to: [LINE + 0.1, 1.9, -2.9], g: 4 },
    { t0: tl14, t1: tl14 + 0.4, kind: 'air', from: [LINE + 0.1, 1.9, -2.9], to: [LINE + 1.5, 0.5, -3.1] }, { t0: tl14 + 0.4, t1: 99, kind: 'hold', from: [LINE + 1.6, BALL_R, -3.1] }]);
  shot(c14, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = m14.at(tt), v = clamp((tt - c14) / (c15 - c14)); return lookFrom([m.x + 4.0 - 1.0 * v, 1.3, m.z - 3.4 + 1.0 * v], [m.x, 1.25, m.z], { fov: 1500, cy: H * 0.55 }); }, { shake: 0.5 + (t > tl14 ? 2 * Math.exp(-(t - tl14) * 7) : 0) });
    const rk = runKick(m14, t, tk14, 'R', { e: 'focus' }), pos = m14.at(Math.min(t, t0S));
    const it = t < t0S - 0.25 ? P(CR7, rk) : siu(t, CR7, pos.x, pos.z, m14.at(t0S - 0.3).head, t0S);
    stadium(g, t, [it, jog(t, c14, OPPS2[1], LINE - 22, 3.5, -0.8, -1.5, 2, 'worried'), ballOf(ball14, t, { trail: t > tk14 && t < tl14 ? trailOf(ball14, t) : null })], { cheer: t > tl14 ? 1 : 0.6, blur: 3 });
  }, { mbStep: 3, mbMax: 12, qaAllow: [...CROWDED, 'head out of frame'], hud: (g, lt, t) => {
    chip(g, t > tl14 ? 2 : 1, 1, '#E8E6E0', OPP2.shirt, "89'", 1);
    plateAt(g, t, decT - 0.05, 'DECIDES MORE GAMES', 300, { size: 44, color: GOLD, ink: '#2A1E06' });
  } });
  cue(c14, 'whoosh_fast', 0.2); cue(tk14 - 0.02, 'kick', 0.85); cue(tl14, 'net', 0.8); cue(tl14 + 0.02, 'crowd_roar', 0.8);
  // "Case closed.": the landing of the "Siu", slowly, the camera going round him
  const SLOW = 0.5, closeT = wn('verdict', 'Case'), landT = c15 + (t0S + 0.55 - c15) / SLOW, hL = m14.at(t0S - 0.3).head + PI, yawF = Math.atan2(Math.cos(hL), -Math.sin(hL));  // the camera on the side he faces once he has landed
  shot(c15, (g, lt, t) => {
    const ts = c15 + (t - c15) * SLOW;
    rigFn(lt, t, tt => { const v = glide(clamp((tt - c15) / (T.duration - c15))); return K(yawF - 0.45 + 0.8 * v, 0.05, lerp(4.2, 3.4, v), [LINE - 21, 1.15, -3.5], { fov: 1600, cy: H * 0.56 }); }, { shake: 0.2 });
    stadium(g, ts, [siu(ts, CR7, LINE - 21, -3.5, m14.at(t0S - 0.3).head, t0S)], { cheer: 1, blur: 5, goals: false });
  }, { trans: 'push', transDur: 0.35, qaAllow: CROWDED, hud: (g, lt, t) => {
    if (t > closeT - 0.02) stamp(g, 'CASE CLOSED', W / 2, 420, lt, closeT - 0.02 - c15, { color: RED, size: 120, rot: -0.06 });
    if (t > landT - 0.06) { const u = clamp((t - landT + 0.06) / 0.18), k = 0.6 + 0.4 * ease.back(u) + 0.03 * Math.sin((t - landT) * 18) * Math.exp(-(t - landT) * 3);  // "SIUUU!" lands with him
      g.save(); g.translate(W / 2, 640); g.rotate(-0.04); g.scale(k, k); g.globalAlpha *= clamp(u * 2); g.textAlign = 'center'; g.textBaseline = 'middle';
      ink(g, 'SIUUU!', 0, 0, sans(150, 900), '#FFFFFF', 26, '#B8892A'); g.restore(); qaRect(g, 160, 560, W - 320, 170, 'text', 'siu'); }
  } });
  cue(c15, 'whoosh_deep', 0.25); cue(closeT - 0.02, 'gavel', 0.7); cue(closeT + 0.02, 'boom_big', 0.5); cue(landT - 0.12, 'siu', 1.0, { end: T.duration - 1.05, fade: 0.45 }); cue(landT, 'crowd_roar', 0.7, { end: T.duration - 1.05, fade: 0.9 });  // both gone by the switch-off, as in plea2005: then only its click
  const tvOff = T.duration - 1.05;
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd: a full stadium at night, a roar for each goal; quiet for the replays
  amb.push({ id: 'crowd_bed', t0: 0, t1: T.duration - 0.6, gain: 0.6, fi: 0.1, fo: 0.6, keys: [[0, 0.5], [c2, 0.8], [c3, 0.5], [c4, 0.7], [c6, 0.45], [c7, 0.3], [c8, 0.15], [c10, 0.3], [c11, 0.2], [c12, 0.3], [qT + 0.7, 0.08], [mT, 0.55], [c13, 0.7], [tl14, 1.1], [c15, 0.9], [tvOff, 0.2]] });

  const music = [
    { t: 0, m: 'hook' }, { t: c4, m: 'digital' }, { t: c7, m: 'intrigue' }, { t: c10, m: 'build' }, { t: c12, m: 'void' }, { t: mT, m: 'slam' }, { t: c14, m: 'victory' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [{ t0: goneT - 0.45, t1: goneT, kind: 'mute' }];  // the music stops for a breath before "Gone"
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
