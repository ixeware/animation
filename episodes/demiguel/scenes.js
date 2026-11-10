// Jesús de Miguel (CD Tenerife, 1996–2026), a tribute. The Madrid striker who climbed through the lower leagues, turned
// pro at 27 and scored Tenerife back into the second division. On Monday 2 November 2026, deep in added time against FC
// Andorra (2–2, Heliodoro Rodríguez López), he chased a bouncing clearance; the Andorra goalkeeper Jesús Owono came out
// for it and his knee caught him in the chest. Cardiac arrest, his pulse back in the ambulance, death the next morning
// at 8. The goalkeeper's words, the minute-9 tributes. Facts and what is drawn: SOURCES.md. What is in dispute (CPR on
// the pitch, the cause beyond the preliminary autopsy) is left out, and the goalkeeper is shown going for the ball.
// Palette: an overcast Tenerife afternoon (grey sky, wet green), Tenerife white and blue, Andorra navy, a green keeper;
// the X-ray in deep blue and bone white with one red heart; a cold dawn in the empty ground; warm floodlights at the end.
import { W, H, C, clamp, lerp, ease, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR, drawChar } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, popIn, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { CAP_BAND } from '../../engine/js/captions.js';
import { room, blindLight, ivStand, bed, box, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, flagItems, playerItems, playerShadow, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, dribbleSegs, BALL_R, skeleton, tex, texQuadW } from '../../engine/js/football.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1F2D5C', TBLUE = '#1E4E9E', RED = '#D8453A';
const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const pin = (t, t0, a = 1) => { const p = popIn(t, t0); return { ...p, a: (p.a ?? 1) * a }; };
const L3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const AT = (p, ...terms) => terms.reduce((q, [v, s]) => [q[0] + v[0] * s, q[1] + v[1] * s, q[2] + v[2] * s], p);
// grades: an overcast afternoon, the morning after, the floodlit tributes
const GREY = { con: 1.05, sat: 0.92, bri: 1.0, tone: ['#C8D4DE', 0.08], lift: ['#152230', 0.1], bloom: 0.18 };
const DAWN_G = { con: 1.06, sat: 0.86, bri: 0.99, tone: ['#F0B890', 0.12], lift: ['#1A2238', 0.14], bloom: 0.26 };
const LIGHTS = { con: 1.06, sat: 0.96, bri: 1.0, tone: ['#FFD9A0', 0.12], lift: ['#121A2E', 0.12], bloom: 0.34 };
const SUNNY_G = { con: 1.05, sat: 1.0, bri: 1.03, tone: ['#FFD8A0', 0.1], lift: ['#10243A', 0.06], bloom: 0.2 };

// ---------- kits as the match footage shows them (Tenerife white and blue; Andorra in their red away kit; Owono in black
// with 25; the referee in yellow; the medics in orange vests), drawn, not the exact designs. The cast: cartoons, not likenesses
const TEN = { shirt: '#F4F6F8', shirtD: '#C9D2DC', trim: TBLUE, num: TBLUE, numEdge: '#F4F6F8', shorts: TBLUE, socks: '#F4F6F8', band: TBLUE, boots: '#141518', badge: TBLUE };
const AND = { shirt: '#D63A34', shirtD: '#A52823', trim: '#F2F2EE', num: '#F2F2EE', numEdge: '#A52823', shorts: '#C8302B', socks: '#D63A34', band: '#F2F2EE', boots: '#141518', badge: '#F2C200' };
const AND_GK = { shirt: '#1F2024', shirtD: '#121316', trim: '#5A5D64', num: '#F2F2EE', numEdge: '#1F2024', shorts: '#1F2024', socks: '#1F2024', band: '#5A5D64', boots: '#141518', long: true, gloves: '#F2F2EE', badge: '#F2C200' };
const REFK = { shirt: '#E9D63A', shirtD: '#C2AF22', trim: '#1F2024', num: null, shorts: '#1F2024', socks: '#1F2024', band: '#E9D63A', boots: '#111214' };
const MEDIC = { shirt: '#F28A1E', shirtD: '#C96A10', trim: '#E9EEF0', num: null, shorts: '#1F2733', socks: '#1F2733', boots: '#141518', long: true, trousers: true, band: null, gloves: '#E9EEF2' };
const FAN = (shirt, shirtD) => ({ shirt, shirtD, trim: shirt, num: null, shorts: '#2A3140', socks: '#2A3140', boots: '#1A1C20', trousers: true, band: null });
const SKIN_T = { base: '#E2B48E', shade: '#CB9C77', deep: '#A97A56', blush: '#D9907E', hi: '#F2D2B4' };
const SKIN_O = { base: '#7A5034', shade: '#66422A', deep: '#4E3220', blush: '#8A5038', hi: '#94684A' };
CAST.demiguel = { face: [0.94, 1.08, 0.86], hair: 'swept', hairC: '#2A1E16', brow: '#20160F', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'kit', trim: TBLUE, badge: TBLUE, ears: 1.02, skin: SKIN_T };
CAST.owono = { face: [0.97, 1.06, 0.9], hair: 'buzz', hairC: '#120D0A', brow: '#0E0A08', suit: '#1F2024', suitD: '#121316', shirt: 'kit', trim: '#5A5D64', panel: '#2B2D33', badge: '#F2C200', ears: 1.02, skin: SKIN_O };
CAST.tA = { face: [0.96, 1.04, 0.9], hair: 'messy', hairC: '#2A1E16', brow: '#20160F', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'tee', ears: 1.0, skin: SKIN_T };
CAST.tB = { face: [0.95, 1.06, 0.88], hair: 'fringe', hairC: '#16110D', brow: '#120D0A', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'tee', ears: 1.02 };
CAST.tC = { face: [0.97, 1.03, 0.92], hair: 'buzz', hairC: '#3A2A1E', brow: '#2E2118', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'tee', ears: 1.02, skin: SKIN_T };
CAST.tD = { face: [0.95, 1.05, 0.9], hair: 'curly', hairC: '#20160F', brow: '#1A120C', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'tee', ears: 1.0, skin: SKIN_O };
CAST.aA = { face: [0.95, 1.05, 0.9], hair: 'swept', hairC: '#3A2A1E', brow: '#2E2118', suit: '#D63A34', suitD: '#A52823', shirt: 'tee', ears: 1.0 };
CAST.aB = { face: [0.96, 1.04, 0.9], hair: 'curly', hairC: '#1E1612', brow: '#16100C', suit: '#D63A34', suitD: '#A52823', shirt: 'tee', ears: 1.0, skin: SKIN_T };
CAST.aC = { face: [0.94, 1.06, 0.88], hair: 'fringe', hairC: '#2A1E16', brow: '#20160F', suit: '#D63A34', suitD: '#A52823', shirt: 'tee', ears: 1.02 };
CAST.refC = { face: [0.96, 1.06, 0.9], hair: 'receding', hairC: '#3A2E26', brow: '#2E241C', suit: '#E9D63A', suitD: '#C2AF22', shirt: 'tee', ears: 1.02 };
CAST.medA = { face: [0.97, 1.04, 0.9], hair: 'buzz', hairC: '#2E241C', brow: '#241A14', suit: '#F28A1E', suitD: '#C96A10', shirt: 'tee', ears: 1.0 };
CAST.medB = { face: [0.95, 1.05, 0.88], hair: 'receding', hairC: '#5A4A3A', brow: '#4A3C2E', suit: '#F28A1E', suitD: '#C96A10', shirt: 'tee', ears: 1.02 };
CAST.medC = { face: [0.96, 1.05, 0.9], hair: 'messy', hairC: '#1E1612', brow: '#16100C', suit: '#F28A1E', suitD: '#C96A10', shirt: 'tee', ears: 1.0, skin: SKIN_T };
CAST.medD = { face: [0.95, 1.04, 0.9], hair: 'swept', hairC: '#6A5240', brow: '#4A3A2C', suit: '#F28A1E', suitD: '#C96A10', shirt: 'tee', ears: 1.0 };
CAST.fanA = { face: [0.96, 1.05, 0.9], hair: 'messy', hairC: '#2A1E16', brow: '#20160F', suit: TBLUE, suitD: '#173E7E', shirt: 'tee', ears: 1.0, skin: SKIN_T };
CAST.fanB = { face: [0.95, 1.04, 0.88], hair: 'curly', hairC: '#16110D', brow: '#120D0A', suit: '#F4F6F8', suitD: '#C9D2DC', shirt: 'tee', ears: 1.02 };
const DM = { who: 'demiguel', kit: TEN, num: 9, h: 1.89 };
const OW = { who: 'owono', kit: AND_GK, num: 25, h: 1.86 };
const T1 = { who: 'tA', kit: TEN, num: 4, h: 1.84 }, T2 = { who: 'tB', kit: TEN, num: 17, h: 1.78 }, T3 = { who: 'tC', kit: TEN, num: 23, h: 1.82 }, T4 = { who: 'tD', kit: TEN, num: 5, h: 1.86 };
const A1 = { who: 'aA', kit: AND, num: 6, h: 1.8 }, A2 = { who: 'aB', kit: AND, num: 14, h: 1.76 }, A3 = { who: 'aC', kit: AND, num: 11, h: 1.78 };
const REF = { who: 'refC', kit: REFK, num: null, h: 1.78 };
const DM_YOUNG = { who: 'demiguel', kit: { shirt: '#8FA6BE', shirtD: '#6F87A0', trim: '#EDEFF2', num: null, shorts: '#23303F', socks: '#23303F', band: '#EDEFF2', boots: '#141518' }, num: null, h: 1.89 };  // before Tenerife: a plain kit, no club's
const MED1 = { who: 'medA', kit: MEDIC, num: null, h: 1.78 }, MED2 = { who: 'medB', kit: MEDIC, num: null, h: 1.74 };
const MED3 = { who: 'medC', kit: MEDIC, num: null, h: 1.8 }, MED4 = { who: 'medD', kit: MEDIC, num: null, h: 1.72 };

// ---------- the grounds: the Heliodoro on the day (about 13,000 in), the same ground empty the next morning, a full one
const TF_FLAGS = [
  g => { g.fillStyle = TBLUE; g.fillRect(0, 0, 1, 1); g.strokeStyle = '#FFFFFF'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(0, 0); g.lineTo(1, 1); g.moveTo(1, 0); g.lineTo(0, 1); g.stroke(); },  // Tenerife: a white saltire on blue
  g => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1 / 3, 1); g.fillStyle = '#1F6FC0'; g.fillRect(1 / 3, 0, 1 / 3, 1); g.fillStyle = '#F2C200'; g.fillRect(2 / 3, 0, 1 / 3, 1); },  // the Canaries
  g => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1, 1); g.fillStyle = TBLUE; g.fillRect(0, 0, 0.5, 1); },  // the club's blue and white
];
const HELIO = new Stadium({ seed: 11, density: 0.6, flagSet: TF_FLAGS, haze: '#C2CAD0' });
const EMPTY = new Stadium({ seed: 11, density: 0, flags: 0, haze: '#B9BFC8' });
const FULL = new Stadium({ seed: 23, density: 1, flags: 3, flagSet: TF_FLAGS, haze: '#C2CAD0' });
const BOARDS = [boardDesign('HELIODORO RODRÍGUEZ LÓPEZ'), boardDesign('CD TENERIFE', { bg: TBLUE, ink: '#FFFFFF' }), boardDesign('SANTA CRUZ DE TENERIFE', { bg: '#F4F2EC', ink: TBLUE }),
  boardDesign('ISLAS CANARIAS', { bg: '#F2C200', ink: '#1D2A44' }), boardDesign('BLANQUIAZULES', { bg: TBLUE, ink: '#FFFFFF' })];
// the lower leagues: a half-empty ground; the boards along the far touchline carry his clubs in the order he runs past
// them (the ring cycles its designs backwards on that side: see boardItems), the last one Castellón, in gold
const LOWER = new Stadium({ seed: 5, density: 0.2, flags: 0, haze: '#C2CAD0' });
const CLUBS = ['LEGANÉS B', 'LUGO FUENLABRADA', 'INTERNACIONAL', 'FUENLABRADA', 'NAVALCARNERO', 'UNIONISTAS'];
const BOARDS_C = [[CLUBS[2]], [CLUBS[1], { bg: '#22324E', ink: '#F4F2EC' }], [CLUBS[0]], ['MADRID · 2015', { bg: '#22324E', ink: '#F4F2EC' }], ['TENERIFE · 2025', { bg: TBLUE, ink: '#FFFFFF' }],
  ['CASTELLÓN', { bg: '#E8C35A', ink: '#1D2A44' }], [CLUBS[5], { bg: '#22324E', ink: '#F4F2EC' }], [CLUBS[4]], [CLUBS[3], { bg: '#22324E', ink: '#F4F2EC' }]].map(([txt, o]) => boardDesign(txt, o));
const BOARD_C_W = { w: 5 };  // 5 m boards there: 23 a side, and with nine designs the far side reads Madrid 2015, Leganés B … Castellón, Tenerife 2025 from x -25 to +15
const BOARDS_T = [boardDesign('SIEMPRE EN NUESTRO RECUERDO', { bg: '#15171C', ink: '#FFFFFF' }), boardDesign('9', { bg: '#F4F2EC', ink: '#15171C' })];
const OVER = { zen: '#6C7682', mid: '#98A2AC', hor: '#C7CED3', clouds: 1, cloud: '#D3D8DD', seed: 9 };
const SUN = { zen: '#2E78C8', mid: '#79B2E2', hor: '#DDEBF0', clouds: 0.7, seed: 4 };
const DAWN = { zen: '#2F3B58', mid: '#7D8698', hor: '#E2BC9C', clouds: 0.5, cloud: '#BDB2B4', seed: 6 };
const DUSK = { zen: '#18223E', mid: '#4F5A80', hor: '#D99A74', clouds: 0.35, cloud: '#9C8E98', seed: 8 };
const WET = { colors: ['#4C8A3A', '#569443'] };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { stad = HELIO, boards = BOARDS, boardO = {}, cheer = 0, blur = 0, skyO = SUN, pitchO = WET } = {}) {
  const back = c => { sky(c, B, { t, ...skyO }); stad.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...pitchO });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t }), ...goalItems(B, 1, { t }), ...boardItems(B, boards, boardO), ...flagItems(B, t), ...items]);
}
function softStadium(g, t, o, blur) {  // the whole ground out of focus behind a portrait: boards and lines too, not just the stands
  bgx.setTransform(1, 0, 0, 1, 0, 0); stadium(bgx, t, [], { ...o, blur: 0 });
  g.save(); g.filter = `blur(${blur}px)`; g.drawImage(BG, 0, 0); g.restore();
}
const P = (pl, st) => { const it = playerItems(B, pl, st); it.shadow = gg => playerShadow(gg, B, pl, st); it.pl = pl; it.st = st; return it; };
const BALL = (pos, o = {}) => { const it = ballItem(B, pos, o); it.shadow = gg => groundShadow(gg, B, pos[0], pos[2], { r: BALL_R * 1.1, y: pos[1] - BALL_R, a: 0.35 }); return it; };
function moving(mv, tt, { e = 'focus', pose = null, t = tt, I = null } = {}) {
  const s = mv.at(tt), sp = s.sp, inten = I ?? clamp(sp / 6.5, 0, 1);
  const p = pose || (sp < 0.4 ? POSE.stand() : blend(POSE.stand(), POSE.run(s.phase, Math.max(0.35, inten), 0), clamp(sp / 1.2)));
  return { x: s.x, z: s.z, head: s.head, pose: p, e, t };
}
const headOf = (pl, st, up = 0.35) => { const sk = skeleton(pl, st); return { ...B.project(sk.headC[0], sk.headC[1] + up, sk.headC[2]), d: depth(...sk.headC) }; };

// ---------- on-screen pieces
function scoreBug(g, a, b, m, { x = 40, y = 76, al = 1, hot = 0 } = {}) {  // flat, as rule 50; hot: the minute swells and turns gold
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = TBLUE; g.fillRect(x, y, 14, hh); g.fillStyle = "#C8302B"; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('TEN', x + 26, y + hh / 2 + 2); g.fillText('AND', x + w - 92, y + hh / 2 + 2);
  g.textAlign = 'center'; g.fillText(`${a} – ${b}`, x + w / 2 - 6, y + hh / 2 + 2);
  g.save(); g.translate(x + w + 74, y + hh / 2); g.scale(1 + 0.22 * hot, 1 + 0.22 * hot); g.translate(-(x + w + 74), -(y + hh / 2));
  g.fillStyle = mix(NAVY, '#E8C35A', hot); g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = hot > 0.5 ? C.ink : CREAM; g.fillText(m, x + w + 74, y + hh / 2 + 2);
  g.restore();
  qaRect(g, x, y, w + 140, hh, 'text', 'score bug');
  g.restore();
}
function bigText(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#F2D27A', s1 = 96, s2 = 84, a = 1 } = {}) {  // the cover: name and years
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#121A26';
  g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
  g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.12); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.12);
  qaRect(g, 60, y - s1 * 0.8, W - 120, s1 * 0.8 + s2 * 1.18, 'text', 'cover title');
  g.restore();
}
// slow motion: story time from film time through piecewise-linear speeds (as in handofgod)
function warp(knots) {
  const tab = []; let tau = 0;
  const sp = t => { if (t <= knots[0][0]) return knots[0][1]; for (let i = 0; i < knots.length - 1; i++) { const [a, va] = knots[i], [b, vb] = knots[i + 1]; if (t <= b) return lerp(va, vb, (t - a) / (b - a)); } return knots[knots.length - 1][1]; };
  for (let t = knots[0][0]; t <= knots[knots.length - 1][0] + 30; t += 1 / 240) { tab.push(tau); tau += sp(t) / 240; }
  return t => t <= knots[0][0] ? (t - knots[0][0]) * knots[0][1] : tab[Math.min(tab.length - 1, Math.round((t - knots[0][0]) * 240))];
}

// ================= THE COLLISION (story time in seconds; 0 = the moment the knee meets his chest) =================
// Rebuilt from the broadcast footage (SOURCES.md). An Andorra cross from the right; Tenerife's centre-back meets it at the
// edge of the box and clears it long; it bounces on toward midfield. De Miguel, already making his run upfield, chases it
// at full pace; Owono sprints out of his area for it and leaps, knee raised, arms up for the ball. The knee catches de
// Miguel in the chest. The keeper's momentum carries him on past and down onto the grass, where he ends up sitting, then
// gets up and turns back; de Miguel is knocked back onto the grass and stays down. (AP: he first curled on his knees, then
// fell onto his back; after the X-ray has shown his heart stopping he is shown only lying still.) The chase plays at real
// speed; the slow motion starts at the blow
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const DM_END = [7.55, 1.72];  // where he comes to rest
const dmM = new Mover([[-14, -29.6, 5.1], [-7.9, -24.5, 4.2], [-5.6, -22.0, 3.9], [-4.4, -19.0, 3.5], [-2.0, -6.0, 2.5], [0, 5.85, 1.75],
  [0.3, 6.75, 1.72], [0.6, 7.33, 1.72], [0.95, DM_END[0], DM_END[1], { stop: true }], [20, DM_END[0], DM_END[1]]],
  { face: (tt) => (tt > -0.25 ? 0.04 : null) });  // he faces his run the whole time: no turning on the spot
const owM = new Mover([[-14, 46.5, -0.6], [-7.9, 44.0, -0.4], [-5.0, 34.0, 0.2], [-2.5, 18.5, 1.0], [0, 6.42, 1.72],
  [0.3, 5.6, 2.2], [0.6, 5.05, 2.55], [0.9, 4.8, 2.72], [1.2, 4.7, 2.8, { stop: true }], [2.0, 4.7, 2.8], [2.7, 5.3, 2.6], [3.6, 5.9, 2.5], [20, 5.9, 2.5]],
  { turn: 4, face: (tt, p) => (tt > -0.3 && tt < 2.0 ? PI : tt >= 2.0 ? Math.atan2(DM_END[1] - p.z, DM_END[0] - p.x) : null) });
const others = [  // each ends up in the half-ring in the order he starts across the frame, so that nobody runs in front of another's face;
  // the players and the referee nearest the play run to him and wave the medics on (from the far side, so
  // that nobody stands between the camera and him); the centre-back who clears the cross, the winger who sends it in
  [T1, new Mover([[-14, -33, 9.5], [-7.9, -27, 8.5], [0, -2, 6.5], [1.8, 5.3, 4.9], [20, 5.3, 4.9]])],
  [T2, new Mover([[-14, -26, 13], [-7.9, -19, 11], [0, -0.6, 8.8], [2.0, 2.2, 6.4], [20, 2.2, 6.4]])],
  [T3, new Mover([[-14, -37, 10.5], [-7.9, -31, 9], [0, -6, 8.0], [2.2, 2.6, 4.4], [20, 2.6, 4.4]])],
  [A1, new Mover([[-14, -27, 4.5], [-7.9, -21, 5.8], [0, 1, 7.5], [1.9, 6.0, 5.6], [20, 6.0, 5.6]])],
  [A2, new Mover([[-14, -29, 15], [-7.9, -22, 13], [0, 5, 12.8], [2.1, 8.5, 4.6], [20, 8.5, 4.6]])],
  [REF, new Mover([[-14, -20, 15.5], [-7.9, -14, 14], [0, 2, 10.5], [1.9, 7.0, 6.8], [20, 7.0, 6.8]])],
  [T4, new Mover([[-14, -40.5, 5.0], [-8.3, -36.8, 2.4], [-7.9, -36.4, 2.3], [-5.5, -33.0, 3.0], [20, -33.0, 3.0]])],
  [A3, new Mover([[-14, -19.5, -25.0], [-9.3, -28.6, -16.4], [-7.9, -31.5, -12.0], [-4.0, -32.5, -6.5], [20, -32.5, -6.5]])],
];
const ball = new BallPath([
  { t0: -20, t1: -14, kind: 'hold', from: [-19.0, BALL_R, -24.6] },
  { t0: -14, t1: -9.25, kind: 'roll', from: [-19.0, -24.6], to: [-28.2, -16.6], decay: 0.3 },  // at the winger's feet
  { t0: -9.25, t1: -7.95, kind: 'air', from: [-28.2, 0.3, -16.6], to: [-36.0, 0.55, 2.1] },  // the cross
  { t0: -7.95, t1: -4.9, kind: 'air', from: [-36.0, 0.55, 2.1], to: [-8.5, BALL_R, 2.6] },  // the clearance
  { t0: -4.9, t1: -2.9, kind: 'air', from: [-8.5, BALL_R, 2.6], to: [-0.5, BALL_R, 2.25] },
  { t0: -2.9, t1: -1.5, kind: 'air', from: [-0.5, BALL_R, 2.25], to: [3.6, BALL_R, 2.0] },
  { t0: -1.5, t1: 0, kind: 'air', from: [3.6, BALL_R, 2.0], to: [6.15, 2.5, 1.72] },
  { t0: 0, t1: 0.8, kind: 'air', from: [6.15, 2.5, 1.72], to: [4.4, BALL_R, 2.2] },  // knocked loose, it drops behind them
  { t0: 0.8, t1: 2.8, kind: 'roll', from: [4.4, 2.2], to: [2.5, 2.6], decay: 2.0 },
  { t0: 2.8, t1: 60, kind: 'hold', from: [2.5, BALL_R, 2.6] },
]);
// ---------- poses. Poses on the ground carry their own pelvis height (ground: false), and every pose is turned into one
// with an explicit height before it is blended (grounded), so that standing, falling and lying blend without a jump; the
// floor check lifts anything that would sink into the grass and settles a resting body onto it
const REACH = { lean: -0.06, sh: [[0.55, 0.95], [0.6, 0.9]], el: [0.5, 0.5], hip: [[0.35, 0.06], [-0.1, 0.06]], knee: [0.5, 0.35] };
const RECOIL = { lean: -0.42, sh: [[1.7, 0.75], [1.55, 0.7]], el: [0.45, 0.4], hip: [[0.6, 0.08], [0.25, 0.08]], knee: [0.35, 0.3] };
const BUCKLE = { lean: -0.55, crouch: 0.38, hip: [[0.95, 0.12], [0.75, 0.12]], knee: [1.35, 1.15], sh: [[1.25, 0.85], [1.05, 0.75]], el: [0.5, 0.5] };  // the legs go
// flat on his back on the grass, a hand on his chest, the other arm out, one knee up. The leg angles are measured from
// straight down in the world, not from the body: a raised knee needs the thigh past the horizontal (2.05), or the leg
// points into the ground and props the body up off it
const DOWN = { lean: -1.5, hip: [[2.05, 0.18], [1.52, 0.1]], knee: [1.55, 0.12], sh: [[0.65, -0.15], [0.35, 1.25]], el: [2.05, 0.35], pelvisY: 0.15, ground: false };
const LIMP = { lean: -1.52, hip: [[1.58, 0.2], [1.52, 0.12]], knee: [0.2, 0.12], sh: [[0.3, 0.95], [0.35, 1.25]], el: [0.45, 0.35], pelvisY: 0.15, ground: false };  // still, the arms fallen to his sides
const LYING = { hip: [[1.45, 0.1], [1.35, 0.14]], knee: [0.2, 0.35], sh: [[0.25, 0.55], [0.3, 0.5]], el: [0.35, 0.3], lean: -1.45, pelvisY: 0.13, ground: false };
let OW_OFF = [0, 0], KLIFT = 0.42;  // set by clashInit so that his knee meets the chest exactly
const KJUMP = u => ({ hip: [[-0.3, 0.06], [1.55, 0.08]], knee: [0.65, 1.7], sh: [[2.85, 0.22], [2.85, 0.22]], el: [0.12, 0.12], lean: 0.05, lift: KLIFT * Math.sin(PI * clamp(u)) });
const LAND = { lean: 0.5, crouch: 0.2, hip: [[0.75, 0.12], [0.35, 0.12]], knee: [1.05, 0.7], sh: [[1.2, 0.55], [1.05, 0.5]], el: [0.5, 0.5] };
const SITDOWN = { hip: [[1.45, 0.18], [1.3, 0.14]], knee: [0.9, 0.55], sh: [[-0.7, 0.4], [-0.6, 0.35]], el: [0.15, 0.2], lean: -0.42, pelvisY: 0.17, ground: false };
const CROUCH = { lean: 0.55, crouch: 0.32, hip: [[0.95, 0.12], [0.95, 0.12]], knee: [1.45, 1.45], sh: [[0.7, 0.35], [0.7, 0.35]], el: [0.7, 0.7] };
const HANDS_HEAD = POSE.handsOnHead();
const WAVE = t => ({ sh: [[0.2, 0.15], [2.6 + 0.3 * Math.sin(t * 9), 0.45]], el: [0.3, 0.2 + 0.25 * Math.sin(t * 9 + 1)] });  // one arm waving the medics on
const WAVE2 = t => ({ sh: [[2.5 + 0.3 * Math.sin(t * 8), 0.5], [2.5 + 0.3 * Math.sin(t * 8 + PI), 0.5]], el: [0.3, 0.3] });  // both arms over the head
function grounded(pl, st) {  // the pelvis height the grass gives a pose, made explicit
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
const pg = (pl, st, pose) => grounded(pl, { ...st, pose: { ...POSE.stand(), ...pose } }).pose;  // a pose at its own height
function dmState(tau, t) {
  let ds = moving(dmM, tau, { t, e: 'focus', I: 1 });
  if (tau <= 0) {
    if (tau > -0.35) ds = { ...ds, pose: blend(grounded(DM, ds).pose, pg(DM, ds, REACH), ease.inOut(clamp((tau + 0.35) / 0.3))) };
    return ds;
  }
  const R0 = pg(DM, ds, REACH), R1 = pg(DM, ds, RECOIL), hurt = { ...EXPR.shock, open: 0.35, lid: 0.45 };
  let p, e = hurt, rest = false;
  if (tau < 0.12) { p = blend(R0, R1, ease.out(tau / 0.12)); e = 'shock'; }
  else if (tau < 0.32) { p = blend(R1, pg(DM, ds, BUCKLE), ease.inOut((tau - 0.12) / 0.2)); e = 'shock'; }  // his legs give way
  else if (tau < 0.55) { const u = (tau - 0.32) / 0.23, Bk = pg(DM, ds, BUCKLE); p = blend(Bk, DOWN, ease.inOut(u)); p.pelvisY = lerp(Bk.pelvisY, DOWN.pelvisY, u * u); e = 'shock'; }  // and he goes over backwards onto the grass
  else { const u = ease.inOut(clamp((tau - 0.7) / 1.0)); p = blend(DOWN, LIMP, u); rest = true; e = u > 0.25 ? { ...EXPR.tired, lid: 1 } : hurt; }  // and stays down: the knee and the hand go limp, then nothing moves
  return onGrass(DM, { ...ds, pose: p, e }, rest);
}
function owState(tau, t) {
  let os = moving(owM, tau, { t, e: 'focus', I: 1 });
  os = { ...os, x: os.x + OW_OFF[0], z: os.z + OW_OFF[1] };
  if (tau <= -0.6) return os;
  const run = { ...grounded(OW, os).pose, lift: 0 }, J = u => ({ ...pg(OW, os, { ...KJUMP(u), lift: 0 }), lift: KJUMP(u).lift });
  let p, e = 'focus', rest = false;
  if (tau < 0.5) p = blend(run, J((tau + 0.6) / 1.1), ease.inOut(clamp((tau + 0.6) / 0.2)));  // the leap, straight off his stride
  else if (tau < 0.72) { p = blend(J(1), pg(OW, os, LAND), ease.out((tau - 0.5) / 0.22)); e = 'shock'; }
  else if (tau < 1.15) { const u = (tau - 0.72) / 0.43, L = pg(OW, os, LAND); p = blend(L, SITDOWN, u * u); p.pelvisY = lerp(L.pelvisY, SITDOWN.pelvisY, u * u); e = 'shock'; }
  else if (tau < 2.0) { p = { ...SITDOWN, lean: SITDOWN.lean + 0.04 * Math.sin(t * 3) }; rest = true; e = 'shock'; }
  else if (tau < 2.45) { p = blend(SITDOWN, pg(OW, os, CROUCH), ease.inOut((tau - 2.0) / 0.45)); e = 'worried'; }
  // on his feet, hands to his head, looking down at him. The target pose is spread together, not blended: a pose that
  // comes out of blend() carries its own weight for the forearm angle, and blending into that sets the weight at once
  // (the forearms would snap inward on the first frame)
  else { p = blend(pg(OW, os, CROUCH), { ...grounded(OW, os).pose, ...HANDS_HEAD }, ease.inOut(clamp((tau - 2.45) / 0.35))); e = { ...EXPR.worried, look: [0.25, 0.6] }; }
  return onGrass(OW, { ...os, pose: p, e }, rest);
}
// the front of his chest where the knee lands, and the keeper's kneecap: put the one on the other at the blow
const chestPt = sk => AT(sk.C, [sk.spine, -0.1 * sk.k], [sk.ft, 0.125 * sk.k]);
const kneeCap = sk => { const L = sk.legs[1]; return AT(L.knee, [nrm3(sub3(L.knee, L.hip)), 0.05 * sk.k]); };
function clashInit() {
  OW_OFF = [0, 0]; KLIFT = 0.42;
  for (let i = 0; i < 4; i++) {
    const hit = chestPt(skeleton(DM, dmState(0, 0))), cap = kneeCap(skeleton(OW, owState(0, 0)));
    OW_OFF = [OW_OFF[0] + hit[0] - cap[0], OW_OFF[1] + hit[2] - cap[2]]; KLIFT += hit[1] - cap[1];
  }
}
function othersState(pl, mv, tau, t) {
  let st = moving(mv, tau, { t: t + (pl.num || 3), e: 'neutral' });
  if (pl === T4 && tau > -8.35 && tau < -7.55) st = { ...st, pose: POSE.kick(clamp((tau + 8.25) / 0.6), 'R'), e: 'focus' };  // the clearance
  if (pl === A3 && tau > -9.6 && tau < -8.9) st = { ...st, pose: POSE.kick(clamp((tau + 9.55) / 0.6), 'L'), e: 'focus' };  // the cross
  if (tau > 0.6 && pl !== T4 && pl !== A3) {
    const arms = pl === REF || pl === T1 ? WAVE(t + pl.num) : pl === A1 ? WAVE2(t + 1) : HANDS_HEAD;
    st = { ...st, e: { ...EXPR.worried, look: [0, 0.45] }, pose: blend(st.pose, arms, ease.inOut(clamp((tau - 0.6) / 0.4))) };  // all eyes on him
  }
  return st;
}
function clashItems(tau, t, { withBall = true } = {}) {
  const ds = dmState(tau, t), items = [P(DM, ds), P(OW, owState(tau, t))];
  if (tau > 0.4) items[0].shadow = gg => lyingShadow(gg, DM, ds);
  for (const [pl, mv] of others) items.push(P(pl, othersState(pl, mv, tau, t)));
  if (withBall) { const b = ball.at(tau); items.push(BALL(b.pos, { spin: b.spin, axis: b.axis })); }
  return items;
}
// a body on the ground casts its shadow along its whole length, not as a small disc under the hips
function lyingShadow(g, pl, st) {
  const sk = skeleton(pl, st), hd = [sk.headC[0], sk.headC[2]], ft = sk.legs.map(L => [L.ankle[0], L.ankle[2]]);
  const fe = [(ft[0][0] + ft[1][0]) / 2, (ft[0][1] + ft[1][1]) / 2], c = [(hd[0] + fe[0]) / 2, (hd[1] + fe[1]) / 2];
  const len = Math.hypot(hd[0] - fe[0], hd[1] - fe[1]), ang = Math.atan2(hd[1] - fe[1], hd[0] - fe[0]);
  groundShadow(g, B, c[0] + 0.04, c[1] + 0.08, { r: Math.max(0.36 * sk.k, len / 2 + 0.15), rz: 0.3 * sk.k, a: 0.36, ang });
}
// ---------- the X-ray, in 3D: bones as glowing cylinders that add up where they cross (as on a radiograph), the ribs a
// cage round the chest that turns with the camera, the heart inside it. An illustration of the reported sequence (a
// knee to the chest, then cardiac arrest), not medical imaging: no fractures, no wounds
function bones(pl, st, { dent = null } = {}) {
  const sk = skeleton(pl, st), k = sk.k, out = [], D = p => (dent ? dent(p) : p);
  const seg = (a, b, r, w = 1) => out.push({ pts: [a, b], r, w });
  for (let i = 0; i < 13; i++) seg(L3(sk.pel, sk.neck, i / 13), L3(sk.pel, sk.neck, (i + 0.68) / 13), 0.026 * k, 0.9);  // vertebrae
  for (let i = 0; i < 8; i++) {  // ribs: from the spine round each side to the front, sloping down; the sternum between
    const c = AT(sk.C, [sk.spine, -(0.015 + i * 0.04) * k], [sk.ft, -0.015 * k]), rr = (0.125 + 0.03 * Math.sin(PI * (i + 1.2) / 9)) * k;
    for (const sd of [-1, 1]) {
      const pts = [];
      for (let j = 0; j <= 16; j++) {
        const u = j / 16, th = lerp(-PI / 2 + 0.12, PI / 2 - 0.3, u);
        pts.push(D(AT(c, [sk.r, sd * Math.cos(th) * rr], [sk.ft, Math.sin(th) * rr * 0.8], [sk.spine, -0.06 * k * u])));
      }
      out.push({ pts, r: 0.0125 * k, w: 0.85 });
    }
  }
  out.push({ pts: [D(AT(sk.C, [sk.ft, 0.1 * k], [sk.spine, 0.01 * k])), D(AT(sk.C, [sk.ft, 0.1 * k], [sk.spine, -0.17 * k])), D(AT(sk.C, [sk.ft, 0.09 * k], [sk.spine, -0.3 * k]))], r: 0.02 * k, w: 1 });  // sternum
  for (const A of sk.arms) {
    seg(AT(sk.neck, [sk.spine, -0.04 * k], [sk.ft, 0.03 * k]), A.sh, 0.017 * k);  // collarbone
    seg(AT(A.sh, [sk.ft, -0.05 * k], [sk.spine, -0.02 * k]), AT(A.sh, [sk.ft, -0.07 * k], [sk.spine, -0.16 * k]), 0.03 * k, 0.55);  // shoulder blade
    seg(A.sh, A.elbow, 0.028 * k); seg(A.elbow, A.wrist, 0.022 * k); seg(A.wrist, A.hand, 0.03 * k, 0.8);
  }
  const pv = []; for (let j = 0; j <= 18; j++) { const th = 2 * PI * j / 18; pv.push(AT(sk.pel, [sk.r, Math.cos(th) * 0.14 * k], [sk.ft, Math.sin(th) * 0.08 * k], [sk.spine, 0.04 * k])); }
  out.push({ pts: pv, r: 0.018 * k, w: 0.8 });  // pelvis
  for (const L of sk.legs) {
    seg(L.hip, L.knee, 0.034 * k); seg(L.knee, L.ankle, 0.03 * k); seg(L.ankle, L.toe, 0.022 * k); seg(L.heel, L.ankle, 0.022 * k, 0.8);
    const cap = AT(L.knee, [nrm3(sub3(L.knee, L.hip)), 0.035 * k]);
    out.push({ pts: [cap, AT(cap, [sk.up, 0.002])], r: 0.04 * k, w: 1.1 });  // kneecap
  }
  seg(sk.neck, AT(sk.headC, [sk.up, -0.1 * k]), 0.022 * k, 0.9);
  // the soft tissue, faint round the bones as on a radiograph: the trunk, the limbs, the head
  const flesh = [[sk.pel, sk.neck, 0.15 * k], [sk.neck, sk.headC, 0.06 * k], [sk.headC, AT(sk.headC, [sk.up, 0.002]), 0.13 * k]];
  for (const A of sk.arms) flesh.push([A.sh, A.elbow, 0.05 * k], [A.elbow, A.wrist, 0.042 * k]);
  for (const L of sk.legs) flesh.push([L.hip, L.knee, 0.072 * k], [L.knee, L.ankle, 0.052 * k]);
  return { sk, segs: out, flesh, skull: { c: sk.headC, r: 0.105 * k, f: sk.f, up: sk.up, rt: sk.r } };
}
// under(): what lies inside, drawn after the soft tissue and before the bones, so the ribs in front glow across it
function drawXray(g, figs, { a = 1, under = null, over = null } = {}) {
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const f of figs) for (const [p, q, r] of f.flesh || []) {
    if (depth(...p) < 0.15 || depth(...q) < 0.15) continue;
    const A = B.project(...p), Q = B.project(...q), wd = r * (A.s + Q.s);
    for (const [col, k] of [['rgba(70,110,190,0.07)', 1.25], ['rgba(110,150,225,0.06)', 0.9]]) {
      g.strokeStyle = col; g.lineWidth = Math.max(1, wd * k); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(Q.x, Q.y); g.stroke();
    }
  }
  g.restore();
  under?.();
  const items = [];
  for (const f of figs) for (const s of f.segs) for (let i = 0; i < s.pts.length - 1; i++) {
    const p = s.pts[i], q = s.pts[i + 1], dp = depth(...p), dq = depth(...q);
    if (dp < 0.12 || dq < 0.12) continue;
    items.push({ p, q, r: s.r, w: s.w, d: (dp + dq) / 2 });
  }
  if (!items.length) return;
  items.sort((x, y) => y.d - x.d);
  for (const f of figs) if (f.skull && depth(...f.skull.c) > 0.2) drawSkull(g, f.skull, a);
  const dn = items[items.length - 1].d, df = items[0].d;
  const bone = (it, k, halo) => {
    const A = B.project(...it.p), Q = B.project(...it.q), r = it.r * (A.s + Q.s) / 2;
    const near = 1 - clamp((it.d - dn) / Math.max(0.6, df - dn)), al = it.w * (0.38 + 0.62 * near) * k;
    const stroke = (col, wd) => { g.strokeStyle = col; g.lineWidth = Math.max(1, wd); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(Q.x, Q.y); g.stroke(); };
    if (halo) stroke(`rgba(70,130,255,${(0.1 * al).toFixed(3)})`, r * 3.4);  // halo
    stroke(`rgba(160,200,255,${(0.3 * al).toFixed(3)})`, r * 2.0);  // the bone
    stroke(`rgba(236,246,255,${(0.42 * al).toFixed(3)})`, r * 0.8);  // its dense core
  };
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const it of items) bone(it, 1, true);
  g.restore();
  if (over) {  // the heart over the cage, then the ribs in front of it again, faint, so that it sits inside
    over.draw();
    g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const it of items) if (it.d < over.d) bone(it, 0.4, false);
    g.restore();
  }
}
// the skull, in 3D so that it reads from any side: the cranium (a bright rim: bone seen edge-on), the lower jaw as a U
// under it with its two branches up to the ears, the cheekbones, a row of teeth; the eye sockets and the nose cavity dark,
// on the face side only
function drawSkull(g, { c, r, f: fw, up, rt }, a) {
  const P3 = (fx, ux, rx) => B.project(...AT(c, [fw, fx * r], [up, ux * r], [rt, rx * r]));
  const cr = P3(-0.05, 0.12, 0), R = r * cr.s;
  const fs = ((B.E[0] - c[0]) * fw[0] + (B.E[2] - c[2]) * fw[2]) / (Math.hypot(B.E[0] - c[0], B.E[2] - c[2]) || 1), front = Math.max(0, fs);
  const wf = clamp((fs + 0.35) / 0.5);  // the face bones fade out as the head turns away: none through the back of the skull
  const curve = (pts, wd, al) => { g.strokeStyle = `rgba(205,228,255,${al.toFixed(3)})`; g.lineWidth = Math.max(1.5, wd); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  const gr = g.createRadialGradient(cr.x, cr.y, R * 0.5, cr.x, cr.y, R * 1.02); gr.addColorStop(0, 'rgba(120,170,255,0.07)'); gr.addColorStop(0.84, 'rgba(200,225,255,0.5)'); gr.addColorStop(1, 'rgba(200,225,255,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(cr.x, cr.y, R * 1.0, R * 1.06, 0, 0, 2 * PI); g.fill();
  const jaw = []; for (let j = 0; j <= 16; j++) { const th = lerp(-PI / 2, PI / 2, j / 16), cs = Math.max(0, Math.cos(th)); jaw.push(P3(0.08 + 0.7 * cs, -0.62 - 0.42 * cs ** 1.5, 0.66 * Math.sin(th))); }
  if (wf > 0.02) {
    curve(jaw, R * 0.17, 0.42 * wf);
    for (const sd of [-1, 1]) curve([P3(-0.08, -0.15, sd * 0.68), P3(0.0, -0.62, sd * 0.66)], R * 0.15, 0.36 * wf);
    for (const sd of [-1, 1]) curve([P3(0.55, -0.12, sd * 0.72), P3(0.82, -0.22, sd * 0.42), P3(0.92, -0.52, sd * 0.2)], R * 0.12, 0.3 * wf);
    for (let i = -5; i <= 5; i++) { const sd = i / 5 * 0.4, f0 = 0.84 * Math.cos(sd * 1.1); curve([P3(f0, -0.5, sd), P3(f0, -0.78, sd)], R * 0.06, 0.4 * wf); }
  }
  g.restore();
  if (front > 0.25) {
    g.save(); g.globalAlpha = a * clamp((front - 0.25) * 3); g.fillStyle = 'rgba(2,8,18,0.78)';
    for (const sd of [-1, 1]) { const e = P3(0.78, 0.08, sd * 0.36); g.beginPath(); g.ellipse(e.x, e.y, R * 0.21, R * 0.24, 0, 0, 2 * PI); g.fill(); }
    const n0 = P3(0.95, -0.12, 0), n1 = P3(0.93, -0.36, -0.1), n2 = P3(0.93, -0.36, 0.1);
    g.beginPath(); g.moveTo(n0.x, n0.y); g.lineTo(n1.x, n1.y); g.lineTo(n2.x, n2.y); g.closePath(); g.fill();
    g.restore();
  }
}
// the lungs: air, so darker than the flesh round them (as on a chest film), one either side of the heart
function lungs(g, sk, a = 1) {
  const k = sk.k;
  g.save(); g.globalAlpha = a;
  for (const sd of [-1, 1]) {
    const c = AT(sk.C, [sk.spine, -0.12 * k], [sk.r, sd * 0.078 * k], [sk.ft, -0.01 * k]);
    if (depth(...c) < 0.15) continue;
    const q = B.project(...c), tp = B.project(...AT(c, [sk.spine, 0.12 * k])), si = B.project(...AT(c, [sk.r, 0.062 * k]));
    const ry = Math.hypot(tp.x - q.x, tp.y - q.y), rx = Math.max(ry * 0.3, Math.hypot(si.x - q.x, si.y - q.y));
    g.save(); g.translate(q.x, q.y); g.rotate(Math.atan2(tp.y - q.y, tp.x - q.x) - PI / 2); g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0.1, 0, 0, 0.1, 1); gr.addColorStop(0, 'rgba(1,4,12,0.5)'); gr.addColorStop(0.7, 'rgba(1,4,12,0.3)'); gr.addColorStop(1, 'rgba(1,4,12,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 2 * PI); g.fill(); g.restore();
  }
  g.restore();
}
// the heart, drawn after the anatomy (not a valentine): the broad right side, the left ventricle down to the apex on his
// left, the vena cava, the pulmonary trunk and the aortic arch on top, the grooves between the chambers. It beats, then
// quivers after the blow, then stops and goes grey (the reported cardiac arrest; schematic)
function heart3d(g, sk, { beat = 0, fib = 0, on = 1, a = 1, t = 0 } = {}) {
  const k = sk.k, hc = AT(sk.C, [sk.spine, -0.15 * k], [sk.r, -0.035 * k], [sk.ft, 0.025 * k]);
  if (depth(...hc) < 0.15) return;
  const apex = AT(hc, [sk.spine, -0.07 * k], [sk.r, -0.035 * k], [sk.ft, 0.02 * k]);
  const q = B.project(...hc), qa = B.project(...apex), ang = Math.atan2(qa.y - q.y, qa.x - q.x) - PI / 2;
  const lf = B.project(...AT(hc, [sk.r, -0.05 * k])), lx = (lf.x - q.x) * Math.cos(-ang) - (lf.y - q.y) * Math.sin(-ang);  // his left, on screen
  const jit = fib * (0.07 * Math.sin(t * 61) + 0.05 * Math.sin(t * 37 + 1)), R = 0.066 * k * q.s * (1 + 0.14 * beat + jit);
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter';
  const gl = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, R * 3.2); gl.addColorStop(0, rgba('#FF2D45', (0.32 + 0.34 * beat) * on)); gl.addColorStop(1, 'rgba(255,45,69,0)');
  g.fillStyle = gl; g.fillRect(q.x - R * 3.2, q.y - R * 3.2, R * 6.4, R * 6.4);
  g.restore();
  const C2 = (dead, live) => mix(dead, live, on);
  g.save(); g.globalAlpha = a * (0.88 + 0.12 * on); g.translate(q.x, q.y); g.rotate(ang + fib * 0.05 * Math.sin(t * 53)); g.scale((lx < 0 ? -1 : 1) * R / 46, R / 46);
  const tube = (col, wd, f) => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.beginPath(); f(); g.stroke(); };
  tube(C2('#3E2A38', '#6E3358'), 12, () => { g.moveTo(-26, -30); g.lineTo(-29, -70); });  // the vena cava
  tube(C2('#4A2A36', '#A33A5E'), 12, () => { g.moveTo(6, -30); g.quadraticCurveTo(12, -52, 30, -58); });  // the pulmonary trunk
  tube(C2('#523038', '#D8344A'), 14, () => { g.moveTo(-6, -32); g.bezierCurveTo(-10, -66, 30, -82, 38, -52); });  // the aortic arch
  const body = new Path2D();
  body.moveTo(-30, -32); body.bezierCurveTo(-52, -10, -46, 28, -10, 46); body.bezierCurveTo(2, 54, 10, 60, 16, 58);
  body.bezierCurveTo(40, 46, 56, 8, 46, -20); body.bezierCurveTo(40, -36, 22, -42, 8, -36); body.bezierCurveTo(-6, -42, -20, -40, -30, -32);
  const sh = g.createRadialGradient(-16, -16, 4, 2, 6, 66); sh.addColorStop(0, C2('#6A4048', '#FF8C98')); sh.addColorStop(0.5, C2('#4A2228', '#E02A40')); sh.addColorStop(1, C2('#28121A', '#7A0E1E'));
  g.fillStyle = sh; g.fill(body);
  g.save(); g.clip(body);
  g.strokeStyle = C2('#2A1218', '#8E1426'); g.lineWidth = 3.5;
  g.beginPath(); g.moveTo(2, -34); g.bezierCurveTo(-4, -2, 6, 30, 16, 58); g.stroke();
  g.beginPath(); g.moveTo(-48, -14); g.quadraticCurveTo(0, 0, 50, -16); g.stroke();
  g.fillStyle = `rgba(255,235,240,${(0.22 * on).toFixed(3)})`; g.beginPath(); g.ellipse(-18, -14, 12, 8, -0.5, 0, 2 * PI); g.fill();
  g.restore();
  g.restore();
}
// heartbeat trace on a monitor strip: normal beats, then chaos after the blow, then flat (schematic)
function ecg(g, t, { chaosAt, flatAt, y = 1590, w = 840, a = 1 } = {}) {
  if (a <= 0) return;
  const x0 = (W - w) / 2, hh = 150, span = 3.0, beat = 0.82;
  const val = tt => {
    if (tt >= flatAt) return 0;
    if (tt >= chaosAt) { const k = clamp((flatAt - tt) / (flatAt - chaosAt)); return k * 0.55 * (Math.sin(tt * 37) * 0.6 + Math.sin(tt * 23 + 1) * 0.4); }
    const ph = ((tt % beat) + beat) % beat / beat;
    return ph < 0.06 ? 0.15 * Math.sin(ph / 0.06 * PI) : ph < 0.1 ? -0.18 : ph < 0.13 ? 1.0 : ph < 0.16 ? -0.35 : ph > 0.3 && ph < 0.42 ? 0.22 * Math.sin((ph - 0.3) / 0.12 * PI) : 0;
  };
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(4,10,18,0.72)'; g.beginPath(); g.roundRect(x0 - 20, y - hh / 2 - 16, w + 40, hh + 32, 18); g.fill();
  g.strokeStyle = 'rgba(120,255,170,0.12)'; g.lineWidth = 1; for (let gx = x0; gx <= x0 + w; gx += 42) { g.beginPath(); g.moveTo(gx, y - hh / 2); g.lineTo(gx, y + hh / 2); g.stroke(); }
  const flat = t >= flatAt, col = flat ? '#FF5A5A' : '#7CFFAA';
  g.strokeStyle = col; g.lineWidth = 5; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 12;
  g.beginPath();
  for (let i = 0; i <= 240; i++) { const tt = t - span + span * i / 240, xx = x0 + w * i / 240, yy = y - val(tt) * hh * 0.42; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
  g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(x0 + w, y - val(t) * hh * 0.42, 7, 0, 2 * PI); g.fill();
  qaRect(g, x0 - 20, y - hh / 2 - 16, w + 40, hh + 32, 'text', 'heart trace');
  g.restore();
}
const lerpCam = (A, Bc, u) => ({ ...A, yaw: lerp(A.yaw, Bc.yaw, u), pitch: lerp(A.pitch, Bc.pitch, u), dist: lerp(A.dist, Bc.dist, u), cy: lerp(A.cy, Bc.cy, u), target: L3(A.target, Bc.target, u) });

// ================= the morning after, the tributes =================
// the banner with his portrait hung in the stand (the club's tribute, 7 November): a cloth, his cartoon face, the 9
function banner(g, t, a = 1) {
  const sw = (x, k) => k * 0.32 * Math.sin(t * 1.25 + x * 0.12) + k * 0.12 * Math.sin(t * 2.3 + x * 0.3);  // the cloth moves in the wind, the bottom most
  const c = [[-9, 3.2, 47.5 + sw(-9, 1)], [9, 3.2, 47.5 + sw(9, 1)], [9, 15.5, 52.5 + sw(9, 0.25)], [-9, 15.5, 52.5 + sw(-9, 0.25)]];
  if (!B.poly(g, c)) return;
  g.save(); g.globalAlpha *= a; g.fillStyle = '#F2F2EE'; g.fill(); g.clip();
  const top = B.project(0, 15.5, 52.5 + sw(0, 0.25)), bot = B.project(0, 3.2, 47.5 + sw(0, 1)), ctr = B.project(0, 9.35, 50 + sw(0, 0.6)), s = ctr.s, hh = bot.y - top.y;
  g.fillStyle = TBLUE; g.fillRect(ctr.x - s * 10, bot.y - hh * 0.2, s * 20, hh * 0.2);
  g.fillStyle = '#FFFFFF'; g.font = sans(Math.round(hh * 0.1), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('JESÚS DE MIGUEL', ctr.x, bot.y - hh * 0.1);
  drawChar(g, 'demiguel', { x: ctr.x - s * 3.4, y: top.y + hh * 0.42, s: hh * 0.0021, e: { ...EXPR.happy, open: 0.2 }, t: 0, noBody: true });
  g.fillStyle = TBLUE; g.font = sans(Math.round(hh * 0.5), 900); g.fillText('9', ctr.x + s * 4.0, top.y + hh * 0.42);
  g.restore();
}
// ---------- the stretcher: four medics in orange vests; two poles that run from hand to hand (each bearer grips one end,
// so the poles follow their hands as they walk and nobody carries air); a canvas bed slung between them; him lying on it
const BEARERS = [[MED1, 1.2, 1], [MED2, 1.2, -1], [MED3, -1.2, 1], [MED4, -1.2, -1]];
function stretcherItems(t, { cx, cz, hd, walk = 1 }) {
  const fw = [Math.cos(hd), Math.sin(hd)], rt = [Math.sin(hd), -Math.cos(hd)], items = [], hand = {};
  for (const [pl, along, sd] of BEARERS) {
    const front = along > 0, inner = sd > 0 ? 0 : 1;  // the arm on the stretcher side
    const x = cx + fw[0] * along + rt[0] * sd * 0.62, z = cz + fw[1] * along + rt[1] * sd * 0.62;
    const ph = t * 6.4 * walk + (front ? 0 : PI * 0.5) + (sd > 0 ? 0 : PI), w = POSE.run(ph, 0.3 * walk, 0);
    const sh = w.sh.map(a => [...a]), el = [...w.el];
    sh[inner] = front ? [-0.08, 0.22] : [0.5, 0.2]; el[inner] = front ? 0.1 : 0.35;  // the front pair carry at their sides, the back pair in front of them
    sh[1 - inner] = [0.12 + 0.3 * Math.sin(ph), 0.14]; el[1 - inner] = 0.5;
    const st = { x, z, head: hd, pose: { ...w, sh, el, lean: 0.08 }, e: 'focus', t: t + along * 2 + sd };
    hand[(front ? 'f' : 'b') + (sd > 0 ? 'r' : 'l')] = skeleton(pl, st).arms[inner].hand;
    items.push(P(pl, st));
  }
  const H = hand, mid = (a, b, u) => L3(a, b, u), grip = 0.1;
  const pole = (a, b) => {  // a pole with its handles a little past each hand
    const d = nrm3(sub3(b, a)), A = AT(a, [d, -grip]), Bq = AT(b, [d, grip]), m = mid(A, Bq, 0.5);
    items.push({ get d() { return depth(...m); }, draw: gg => {
      if (depth(...A) < 0.3 || depth(...Bq) < 0.3) return;
      const p = B.project(...A), q = B.project(...Bq), r = Math.max(2, 0.022 * (p.s + q.s));
      gg.save(); gg.lineCap = 'round'; gg.strokeStyle = '#59606A'; gg.lineWidth = r * 2; gg.beginPath(); gg.moveTo(p.x, p.y); gg.lineTo(q.x, q.y); gg.stroke();
      gg.strokeStyle = '#C9CFD6'; gg.lineWidth = r * 0.7; gg.beginPath(); gg.moveTo(p.x, p.y - r * 0.4); gg.lineTo(q.x, q.y - r * 0.4); gg.stroke(); gg.restore();
    } });
  };
  pole(H.fl, H.bl); pole(H.fr, H.br);
  // the canvas: between the poles, a hand's width in from each end, sagging a little in the middle
  const cn = [mid(H.fl, H.bl, 0.16), mid(H.fr, H.br, 0.16), mid(H.fr, H.br, 0.84), mid(H.fl, H.bl, 0.84)].map(p => [p[0], p[1] - 0.03, p[2]]);
  const ctr = L3(L3(cn[0], cn[1], 0.5), L3(cn[2], cn[3], 0.5), 0.5);
  items.push({ get d() { return depth(...ctr) + 0.12; }, draw: gg => {
    const sag = [L3(cn[0], cn[3], 0.5), L3(cn[1], cn[2], 0.5)].map(p => [p[0], p[1] - 0.05, p[2]]);
    if (B.poly(gg, [cn[0], cn[1], sag[1], cn[2], cn[3], sag[0]])) { gg.fillStyle = '#E86A1E'; gg.fill(); gg.strokeStyle = '#B4500F'; gg.lineWidth = 2; gg.stroke(); }
  } });
  // him on it, on his back, head toward the front, as low as the canvas lets him lie
  const lieHd = hd + PI, ls = { x: ctr[0] - fw[0] * 0.15, z: ctr[2] - fw[1] * 0.15, head: lieHd, pose: { ...LYING, pelvisY: ctr[1] + 0.07 }, e: { ...EXPR.tired, lid: 0.95 }, t };
  items.push(P(DM, ls));
  return items;
}

// ---------- the ambulance: a white panel van with a red-orange checked band, AMBULANCIA along the side, a light bar and
// strobes, a sloped windscreen, wheels that turn. Its faces are sorted far to near; the side panels are textures
const AMB = { x0: -3.2, x1: 1.25, cx1: 3.65, y0: 0.5, y1: 2.85, w: 1.05, band: 1.544, sq: 0.148 };
const ambTex = {};
// the side panels as the camera sees them from the +z side: the van's front on the left of the texture (u = 0)
function ambBoxTex() {  // the box, x from x1 (u 0) back to x0 (u 1024), y from the roof (v 0) down to the sill
  return ambTex.box ??= tex(1024, 540, (g, w, h) => {
    const U = x => (AMB.x1 - x) / (AMB.x1 - AMB.x0) * w, V = y => (AMB.y1 - y) / (AMB.y1 - AMB.y0) * h, sq = AMB.sq / (AMB.x1 - AMB.x0) * w;
    g.fillStyle = '#F4F6F7'; g.fillRect(0, 0, w, h);
    for (let i = 0; i * sq < w; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#F4F6F7' : '#E2462A'; g.fillRect(i * sq, V(AMB.band) + j * sq, sq + 1, sq + 1); }
    g.fillStyle = '#1E4E9E'; g.fillRect(0, V(AMB.band) - 12, w, 7); g.fillRect(0, V(AMB.band) + 2 * sq + 5, w, 7);
    g.strokeStyle = '#B9C1C8'; g.lineWidth = 4; g.strokeRect(U(1.05), V(2.7), U(-0.55) - U(1.05), V(0.62) - V(2.7));  // the sliding door
    g.fillStyle = '#9FB2C2'; g.beginPath(); g.roundRect(U(0.95), V(2.6), U(-0.45) - U(0.95), V(2.05) - V(2.6), 10); g.fill();  // its frosted window
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(U(0.9), V(2.56), 70, V(2.1) - V(2.56));
    g.fillStyle = '#C8262E'; g.font = sans(70, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AMBULANCIA', U(-1.55), V(2.25));
    g.fillStyle = '#1E4E9E'; g.font = sans(50, 900); g.fillText('112', U(-2.75), V(1.95));
    g.fillStyle = '#20242A'; g.beginPath(); g.arc(U(-1.95), h + 8, 0.53 / (AMB.x1 - AMB.x0) * w, PI, 2 * PI); g.fill();  // the rear wheel arch
    g.fillStyle = '#D9DEE2'; g.fillRect(0, h - 22, w, 22);  // the sill
  });
}
function ambCabTex() {  // the cab side, x from cx1 (u 0) back to x1 (u 600), y from 2.4 (v 0) down to the sill; clear outside the outline
  return ambTex.cab ??= tex(600, 480, (g, w, h) => {
    const U = x => (AMB.cx1 - x) / (AMB.cx1 - AMB.x1) * w, V = y => (2.4 - y) / (2.4 - AMB.y0) * h, sq = AMB.sq / (AMB.cx1 - AMB.x1) * w;
    const prof = [[AMB.x1, AMB.y0], [AMB.cx1, AMB.y0], [AMB.cx1, 1.25], [3.35, 1.42], [2.75, 2.3], [AMB.x1, 2.4]];
    g.beginPath(); prof.forEach(([x, y], i) => (i ? g.lineTo(U(x), V(y)) : g.moveTo(U(x), V(y)))); g.closePath();
    g.fillStyle = '#F4F6F7'; g.fill(); g.save(); g.clip();
    const off = ((AMB.cx1 - AMB.x1) / AMB.sq) % 2 < 1 ? 0 : 1;  // the checks run on from the box without a break
    for (let i = 0; i * sq < w + sq; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j + off) % 2 ? '#F4F6F7' : '#E2462A'; g.fillRect(w - (i + 1) * sq, V(AMB.band) + j * sq, sq + 1, sq + 1); }
    g.fillStyle = '#1E4E9E'; g.fillRect(0, V(AMB.band) - 12, w, 7); g.fillRect(0, V(AMB.band) + 2 * sq + 5, w, 7);
    g.beginPath(); g.moveTo(U(1.42), V(1.66)); g.lineTo(U(3.12), V(1.66)); g.lineTo(U(2.66), V(2.24)); g.lineTo(U(1.42), V(2.3)); g.closePath();  // the door window
    const gl = g.createLinearGradient(U(1.5), V(2.25), U(3.0), V(1.7)); gl.addColorStop(0, '#5E7488'); gl.addColorStop(0.45, '#2A3644'); gl.addColorStop(1, '#6A8094');
    g.fillStyle = gl; g.fill();
    g.strokeStyle = '#B9C1C8'; g.lineWidth = 4; g.beginPath(); g.moveTo(U(1.36), V(0.62)); g.lineTo(U(1.36), V(2.32)); g.moveTo(U(3.18), V(0.62)); g.lineTo(U(3.18), V(1.6)); g.stroke();  // the door
    g.fillStyle = '#2A2E34'; g.fillRect(U(1.62), V(1.42), 30, 9);  // the handle
    g.fillStyle = '#20242A'; g.beginPath(); g.arc(U(2.55), h + 6, 0.53 / (AMB.cx1 - AMB.x1) * w, PI, 2 * PI); g.fill();  // the front wheel arch
    g.restore();
  });
}
function ambulanceItems(x, z, t, { dist = 0 } = {}) {
  const S = B.E[2] > z ? 1 : -1, zs = z + S * AMB.w, faces = [];
  const face = (pts, fill, n) => {  // a flat face, culled when it looks away
    const m = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]);
    if (n && (B.E[0] - m[0]) * n[0] + (B.E[1] - m[1]) * n[1] + (B.E[2] - m[2]) * n[2] <= 0) return;
    faces.push({ d: depth(...m), draw: gg => { if (B.poly(gg, pts)) { gg.fillStyle = fill; gg.fill(); } } });
  };
  const X0 = x + AMB.x0, X1 = x + AMB.x1, CX = x + AMB.cx1, Y0 = AMB.y0, Y1 = AMB.y1, zn = z - AMB.w, zf = z + AMB.w;
  // the box: roof, rear, the cab-side end above the cab, the side with its texture
  face([[X0, Y1, zn], [X1, Y1, zn], [X1, Y1, zf], [X0, Y1, zf]], '#E9EDF0', [0, 1, 0]);
  face([[X0, Y0, zf], [X0, Y0, zn], [X0, Y1, zn], [X0, Y1, zf]], '#DCE1E5', [-1, 0, 0]);
  face([[X1, 2.4, zn], [X1, Y1, zn], [X1, Y1, zf], [X1, 2.4, zf]], '#E3E7EA', [1, 0, 0]);
  faces.push({ d: depth(x - 1, 1.6, zs), draw: gg => texQuadW(gg, B, ambBoxTex(), [X1, Y0, zs], [X0, Y0, zs], [X0, Y1, zs], [X1, Y1, zs], [0, 540, 1024, 0]) });
  // the cab: the side (texture, see-through outside its outline), the bonnet, the windscreen, the roof, the front
  faces.push({ d: depth(x + 2.4, 1.3, zs) - 0.01, draw: gg => texQuadW(gg, B, ambCabTex(), [CX, Y0, zs], [X1, Y0, zs], [X1, 2.4, zs], [CX, 2.4, zs], [0, 480, 600, 0]) });
  face([[x + 2.75, 2.3, zn], [X1, 2.4, zn], [X1, 2.4, zf], [x + 2.75, 2.3, zf]], '#E9EDF0', [0, 1, 0]);
  face([[x + 3.35, 1.42, zn], [x + 2.75, 2.3, zn], [x + 2.75, 2.3, zf], [x + 3.35, 1.42, zf]], '#2A3440', [0.82, 0.56, 0]);
  face([[CX, 1.25, zn], [x + 3.35, 1.42, zn], [x + 3.35, 1.42, zf], [CX, 1.25, zf]], '#EEF1F3', [0.5, 0.86, 0]);
  face([[CX, Y0, zf], [CX, Y0, zn], [CX, 1.25, zn], [CX, 1.25, zf]], '#E6EAED', [1, 0, 0]);
  face([[x - 3.0, 0.3, zn + 0.1], [x + 3.4, 0.3, zn + 0.1], [x + 3.4, Y0, zn + 0.1], [x - 3.0, Y0, zn + 0.1]], '#2A2D32', [0, 0, -1]);
  face([[x - 3.0, 0.3, zf - 0.1], [x + 3.4, 0.3, zf - 0.1], [x + 3.4, Y0, zf - 0.1], [x - 3.0, Y0, zf - 0.1]], '#2A2D32', [0, 0, 1]);
  // bumpers, lamps
  face([[CX + 0.12, 0.42, zs], [CX + 0.12, 0.42, -zs + 2 * z], [CX + 0.12, 0.72, -zs + 2 * z], [CX + 0.12, 0.72, zs]], '#3A3E44', [1, 0, 0]);
  faces.sort((a, b) => b.d - a.d);
  const out = [{ d: depth(x, 1.4, z) + 0.5, draw: gg => {
    groundShadow(gg, B, x + 0.2, z, { r: 3.9, rz: 1.35, a: 0.42 });
    for (const f of faces) f.draw(gg);
    // the wheels on the near side: tyre, rim, five spokes that turn with the road
    for (const wx of [x + 2.55, x - 1.95]) {
      const ring = (r, n = 26) => Array.from({ length: n }, (_, i) => { const a = i / n * 2 * PI; return [wx + Math.cos(a) * r, 0.43 + Math.sin(a) * r, zs + S * 0.02]; });
      if (B.poly(gg, ring(0.43))) { gg.fillStyle = '#17191C'; gg.fill(); }
      if (B.poly(gg, ring(0.27))) { gg.fillStyle = '#AEB5BC'; gg.fill(); }
      const rot = -dist / 0.43;
      gg.strokeStyle = '#6E757C'; gg.lineWidth = Math.max(2, B.project(wx, 0.43, zs).s * 0.035);
      for (let k = 0; k < 5; k++) { const a = rot + k * 2 * PI / 5, p = B.project(wx + Math.cos(a) * 0.06, 0.43 + Math.sin(a) * 0.06, zs + S * 0.03), q = B.project(wx + Math.cos(a) * 0.25, 0.43 + Math.sin(a) * 0.25, zs + S * 0.03); gg.beginPath(); gg.moveTo(p.x, p.y); gg.lineTo(q.x, q.y); gg.stroke(); }
      if (B.poly(gg, ring(0.07, 12))) { gg.fillStyle = '#5A6066'; gg.fill(); }
    }
    // the light bar and the corner strobes: blue, flashing in turn, with their glow
    const on = Math.floor(t * 7) % 2, glow = (p, col, r) => { gg.save(); gg.globalCompositeOperation = 'screen'; const G = gg.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); G.addColorStop(0, col); G.addColorStop(1, 'rgba(60,130,255,0)'); gg.fillStyle = G; gg.fillRect(p.x - r, p.y - r, 2 * r, 2 * r); gg.restore(); };
    for (const [lx, lz, lit] of [[x + 1.65, z, on], [x + 2.35, z, 1 - on]]) {
      const p = B.project(lx, 2.5, lz); if (p.z < 0.3) continue;
      gg.fillStyle = lit ? '#5FA8FF' : '#1C3A78'; gg.beginPath(); gg.roundRect(p.x - 0.32 * p.s, p.y - 0.09 * p.s, 0.64 * p.s, 0.18 * p.s, 0.05 * p.s); gg.fill();
      if (lit) glow(p, 'rgba(120,180,255,0.75)', 2.4 * p.s);
    }
    for (const [lx, lit] of [[X0 + 0.08, 1 - on], [X1 - 0.08, on]]) {
      const p = B.project(lx, Y1 - 0.12, zs + S * 0.01); if (p.z < 0.3) continue;
      gg.fillStyle = lit ? '#6FB2FF' : '#284A8A'; gg.fillRect(p.x - 0.09 * p.s, p.y - 0.06 * p.s, 0.18 * p.s, 0.12 * p.s);
      if (lit) glow(p, 'rgba(120,180,255,0.6)', 1.2 * p.s);
    }
    const hl = B.project(CX + 0.05, 0.95, zs - S * 0.2); if (hl.z > 0.3) glow(hl, 'rgba(255,240,200,0.7)', 0.9 * hl.s);  // headlight
    const tl = B.project(X0 - 0.02, 1.0, zs - S * 0.12); if (tl.z > 0.3) { gg.fillStyle = '#E0302A'; gg.fillRect(tl.x - 0.05 * tl.s, tl.y - 0.16 * tl.s, 0.1 * tl.s, 0.32 * tl.s); }
  } }];
  return out;
}

// ---------- inside the ambulance: the patient monitor, flat, then his pulse coming back (the club's account: his pulse was
// restored in the ambulance). Drawn flat, shaking with the road, the blue strobe through the rear window
function ambInterior(g, t, lt, back) {
  g.save();
  g.translate(W / 2 + 7 * Math.sin(t * 3.1) + 3 * Math.sin(t * 11), H / 2 + 5 * Math.sin(t * 2.3 + 1)); g.rotate(0.012 * Math.sin(t * 1.7)); g.scale(1.06 + 0.04 * clamp(lt / 1.4), 1.06 + 0.04 * clamp(lt / 1.4)); g.translate(-W / 2, -H / 2);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#26303A'); bg.addColorStop(1, '#10161C'); g.fillStyle = bg; g.fillRect(-60, -60, W + 120, H + 120);
  g.fillStyle = 'rgba(235,245,255,0.85)'; g.fillRect(-60, 96, W + 120, 16); const lg = g.createLinearGradient(0, 112, 0, 420); lg.addColorStop(0, 'rgba(220,235,255,0.22)'); lg.addColorStop(1, 'rgba(220,235,255,0)'); g.fillStyle = lg; g.fillRect(-60, 112, W + 120, 308);
  for (let i = 0; i < 4; i++) for (const sx of [-30, 830]) {  // cabinets either side
    g.fillStyle = '#3A4550'; g.beginPath(); g.roundRect(sx, 180 + i * 210, 280, 190, 14); g.fill();
    g.strokeStyle = '#4C5965'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#8A97A3'; g.fillRect(sx + 110, 180 + i * 210 + 160, 60, 10);
  }
  g.fillStyle = '#2F7A4E'; g.beginPath(); g.roundRect(70, 1080, 92, 560, 46); g.fill(); g.fillStyle = '#E9EEF0'; g.fillRect(70, 1080, 92, 40);  // oxygen
  g.fillStyle = '#C8262E'; g.beginPath(); g.roundRect(820, 1440, 230, 170, 18); g.fill(); g.fillStyle = '#F4F6F7'; g.fillRect(920, 1475, 30, 100); g.fillRect(885, 1510, 100, 30);  // the bag
  // the rear window: the street sliding away, blue on and off
  g.save(); g.beginPath(); g.roundRect(330, 150, 420, 230, 20); g.clip(); g.fillStyle = '#5A6A78'; g.fillRect(330, 150, 420, 230);
  for (let i = 0; i < 7; i++) { const xx = 330 + ((i * 140 + t * 900) % 980) - 140; g.fillStyle = i % 2 ? '#7E8C99' : '#46525E'; g.fillRect(xx, 230, 90, 150); }
  g.restore();
  // the monitor
  g.save(); g.translate(540, 820); g.rotate(-0.035);
  g.fillStyle = '#2B3036'; g.beginPath(); g.roundRect(-400, -300, 800, 600, 36); g.fill(); g.strokeStyle = '#4A525B'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#041008'; g.beginPath(); g.roundRect(-350, -250, 700, 440, 16); g.fill();
  g.save(); g.beginPath(); g.roundRect(-350, -250, 700, 440, 16); g.clip();
  g.strokeStyle = 'rgba(80,255,150,0.08)'; g.lineWidth = 2; for (let gx = -350; gx < 350; gx += 50) { g.beginPath(); g.moveTo(gx, -250); g.lineTo(gx, 190); g.stroke(); } for (let gy = -250; gy < 190; gy += 50) { g.beginPath(); g.moveTo(-350, gy); g.lineTo(350, gy); g.stroke(); }
  const alive = t >= back, col = alive ? '#6CFFA4' : '#FF6A5A', beat = 0.86;
  const val = tt => { if (tt < back) return 0; const ph = (((tt - back) % beat) + beat) % beat / beat; return ph < 0.05 ? 0.12 * Math.sin(ph / 0.05 * PI) : ph < 0.08 ? -0.2 : ph < 0.11 ? 1 : ph < 0.14 ? -0.4 : ph > 0.3 && ph < 0.42 ? 0.2 * Math.sin((ph - 0.3) / 0.12 * PI) : 0; };
  const span = 3.2, sweep = ((t % span) / span) * 700 - 350;  // a sweeping trace, as on a real monitor
  g.strokeStyle = col; g.lineWidth = 6; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 14; g.beginPath();
  for (let i = 0; i <= 280; i++) { const xx = -350 + 700 * i / 280; if (xx > sweep - 12 && xx < sweep + 26) { g.stroke(); g.beginPath(); continue; } const tt = t - ((sweep - xx + 700) % 700) / 700 * span, yy = -20 - val(tt) * 150; g.lineTo(xx, yy); }
  g.stroke(); g.shadowBlur = 0;
  g.fillStyle = col; g.font = sans(40, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('II', -320, -210);
  const hb = alive && ((t - back) % beat) / beat < 0.16;  // the heart symbol blinks with each beat
  g.save(); g.translate(270, -200); g.scale(hb ? 1.25 : 1, hb ? 1.25 : 1); g.fillStyle = alive ? col : 'rgba(255,106,90,0.35)'; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-30, -6, -18, -30, 0, -14); g.bezierCurveTo(18, -30, 30, -6, 0, 14); g.fill(); g.restore();
  g.restore();
  g.fillStyle = '#5A636D'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-260 + i * 120, 245, 18, 0, 2 * PI); g.fill(); }
  g.restore();
  qaRect(g, 160, 540, 760, 560, 'text', 'monitor');
  g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; const fl = Math.floor(t * 7) % 2 ? 0.16 : 0.04, bl = g.createRadialGradient(W * 0.55, 240, 40, W * 0.55, 240, 900); bl.addColorStop(0, `rgba(70,140,255,${fl})`); bl.addColorStop(1, 'rgba(70,140,255,0)'); g.fillStyle = bl; g.fillRect(0, 0, W, H); g.restore();
}

// ---------- the hospital room at dawn (the set from env.js): light through the blinds, the bed, the drip, the monitor
// beside it and the clock on the wall; the clock comes round to eight and the trace on the monitor goes flat
function wallClock(g, x, y, z, r, mins) {  // on the back wall (facing -z); mins: minutes past midnight
  const o = B.project(x, y, z); if (o.z < 0.5) return;
  const R = r * o.s;
  g.save(); g.translate(o.x, o.y);
  g.fillStyle = '#2B3238'; g.beginPath(); g.arc(0, 0, R * 1.1, 0, 2 * PI); g.fill();
  g.fillStyle = '#F4F2EC'; g.beginPath(); g.arc(0, 0, R, 0, 2 * PI); g.fill();
  g.strokeStyle = '#2B3238'; for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * PI, l = i % 5 ? 0.06 : 0.16; g.lineWidth = Math.max(1, R * (i % 5 ? 0.012 : 0.035)); g.beginPath(); g.moveTo(Math.sin(a) * R * 0.92, -Math.cos(a) * R * 0.92); g.lineTo(Math.sin(a) * R * (0.92 - l), -Math.cos(a) * R * (0.92 - l)); g.stroke(); }
  const hand = (a, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(-Math.sin(a) * l * 0.15, Math.cos(a) * l * 0.15); g.lineTo(Math.sin(a) * l, -Math.cos(a) * l); g.stroke(); };
  hand(((mins / 60) % 12) / 12 * 2 * PI, R * 0.5, R * 0.07, '#20262C');
  hand((mins % 60) / 60 * 2 * PI, R * 0.78, R * 0.05, '#20262C');
  hand(((mins * 60) % 60) / 60 * 2 * PI, R * 0.82, Math.max(1, R * 0.018), '#C8262E');
  g.fillStyle = '#20262C'; g.beginPath(); g.arc(0, 0, R * 0.05, 0, 2 * PI); g.fill();
  g.restore();
}
function wardMonitor(g, x, y, z, t, flatAt) {  // a bedside monitor facing -z: the trace slows, then lies flat in red
  box(g, B, [x - 0.06, FLOOR_Y, z + 0.25], [x + 0.06, y - 0.85, z + 0.35], { top: '#555B60', side: '#444A4F', front: '#4F555A' });
  box(g, B, [x - 1.35, y - 0.9, z], [x + 1.35, y + 0.9, z + 0.55], { top: '#3A4246', side: '#272D30', front: '#30373A' });
  if (B.E[2] > z || depth(x, y, z) < 0.6) return;
  if (!B.poly(g, [[x - 1.18, y + 0.74, z - 0.01], [x + 1.18, y + 0.74, z - 0.01], [x + 1.18, y - 0.74, z - 0.01], [x - 1.18, y - 0.74, z - 0.01]])) return;
  g.save(); g.fillStyle = '#04120C'; g.fill(); g.clip();
  const rate = tt => lerp(1.25, 0.55, clamp((tt - (flatAt - 2.2)) / 2.2));  // beats per second, slowing
  const val = tt => { if (tt >= flatAt) return 0; const ph = (tt * rate(tt)) % 1; return (ph > 0.42 && ph < 0.46 ? 0.5 : ph > 0.46 && ph < 0.5 ? -0.38 : ph > 0.5 && ph < 0.53 ? 0.14 : 0) * clamp((flatAt - tt) / 0.6 + 0.3); };
  g.shadowBlur = 14; g.lineWidth = Math.max(2, B.project(x, y, z).s * 0.05);
  const ux = clamp(1 - (t - flatAt) / 2.4), pt = u => B.project(x - 1.1 + u * 2.2, y - 0.05 + val(t - (1 - u) * 2.4) * 0.9, z - 0.02);
  for (const [u0, u1, c] of [[0, ux, '#5CFF9D'], [ux, 1, '#FF5A4F']]) {  // the beats stay green; only what comes after eight is red
    if (u1 - u0 < 1e-3) continue;
    g.strokeStyle = c; g.shadowColor = c; g.beginPath();
    for (let i = 0; i <= 80; i++) { const u = lerp(u0, u1, i / 80), q = pt(u); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); }
    g.stroke();
  }
  g.restore();
}
function ward(g, t, flatAt, mins) {
  room(g, B, 'hospital', { over: { light: '#FFD9B8', lightA: 0.24 }, t });
  // the window on the back wall: dawn over the city through the slats
  const wx0 = -7.4, wx1 = -1.2, wy0 = 2.6, wy1 = 10.4, wz = BACK_Z - 0.06;
  if (B.poly(g, [[wx0, wy1, wz], [wx1, wy1, wz], [wx1, wy0, wz], [wx0, wy0, wz]])) {
    const a = B.project(wx0, wy1, wz), b = B.project(wx0, wy0, wz), sk = g.createLinearGradient(0, a.y, 0, b.y);
    sk.addColorStop(0, '#5A6C94'); sk.addColorStop(0.55, '#E9A783'); sk.addColorStop(1, '#F6CF9A'); g.fillStyle = sk; g.fill();
    for (let yy = wy0 + 0.2; yy < wy1; yy += 0.55) if (B.poly(g, [[wx0, yy + 0.2, wz - 0.02], [wx1, yy + 0.2, wz - 0.02], [wx1, yy, wz - 0.02], [wx0, yy, wz - 0.02]])) { g.fillStyle = 'rgba(232,226,214,0.85)'; g.fill(); }
    if (B.poly(g, [[wx0 - 0.2, wy1 + 0.2, wz - 0.03], [wx1 + 0.2, wy1 + 0.2, wz - 0.03], [wx1 + 0.2, wy1, wz - 0.03], [wx0 - 0.2, wy1, wz - 0.03]])) { g.fillStyle = '#C9CDCF'; g.fill(); }
  }
  blindLight(g, B, { a: 1, color: '#FFD3A2' });
  wallClock(g, 8.4, 8.9, BACK_Z - 0.06, 1.35, mins);
  ivStand(g, B, 6.6, 8.2, { sway: 0.02 * Math.sin(t * 0.7), t });
  bed(g, B, { x0: 0.4, x1: 5.2, z0: 3.6, z1: 9.6, blanket: 1 });
  wardMonitor(g, 8.4, 3.6, 9.4, t, flatAt);
}

// ---------- the X-ray film on a light box (the preliminary autopsy points to the blow to his chest): a chest film drawn
// like a radiograph, the ribs, the spine, the heart's shadow; a red ring drawn round where the knee struck
function chestFilm(g, cx, cy, w, h, ring) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = '#05080B'; g.fillRect(-w / 2, -h / 2, w, h);
  const s = w / 600;
  g.scale(s, s);
  const soft = g.createRadialGradient(0, 40, 60, 0, 40, 330); soft.addColorStop(0, 'rgba(150,170,190,0.38)'); soft.addColorStop(1, 'rgba(150,170,190,0.02)');
  g.fillStyle = soft; g.beginPath(); g.moveTo(-60, -360); g.lineTo(60, -360); g.bezierCurveTo(80, -300, 250, -290, 270, -220); g.lineTo(280, 340); g.lineTo(-280, 340); g.lineTo(-270, -220); g.bezierCurveTo(-250, -290, -80, -300, -60, -360); g.fill();
  g.fillStyle = 'rgba(2,4,8,0.72)';  // the lungs, air: dark
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 120, 20, 100, 230, sd * 0.08, 0, 2 * PI); g.fill(); }
  g.fillStyle = 'rgba(205,215,225,0.55)'; g.beginPath(); g.ellipse(48, 110, 112, 92, -0.35, 0, 2 * PI); g.fill();  // the heart's shadow (his left: the film's right)
  g.strokeStyle = 'rgba(230,238,245,0.9)'; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(225,232,240,0.75)'; g.beginPath(); g.roundRect(-22, -300 + i * 50, 44, 40, 8); g.fill(); }  // the spine
  for (let i = 0; i < 10; i++) for (const sd of [-1, 1]) {  // the ribs: arcs out from the spine and down
    const y = -255 + i * 47, wd = 110 + 85 * Math.sin(PI * (i + 1.5) / 12);
    g.lineWidth = 9; g.beginPath(); g.moveTo(sd * 22, y); g.bezierCurveTo(sd * (wd * 0.7), y - 34, sd * (wd + 30), y + 6, sd * (wd + 18), y + 52); g.stroke();
    g.lineWidth = 5; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(sd * (wd + 18), y + 52); g.quadraticCurveTo(sd * (wd * 0.6), y + 92, sd * 40, y + 70); g.stroke(); g.globalAlpha = 1;
  }
  g.lineWidth = 12; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 30, -290); g.bezierCurveTo(sd * 110, -300, sd * 170, -270, sd * 245, -295); g.stroke(); }  // collarbones
  g.fillStyle = 'rgba(230,238,245,0.8)'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * 268, -262, 44, 0, 2 * PI); g.fill(); }  // the shoulder joints
  g.fillStyle = 'rgba(240,244,248,0.85)'; g.font = sans(46, 900); g.textAlign = 'left'; g.fillText('R', -280, -320);
  if (ring > 0) {  // where the knee struck: the front of his chest
    g.strokeStyle = '#FF3B30'; g.lineWidth = 12; g.shadowColor = '#FF3B30'; g.shadowBlur = 18;
    g.beginPath(); g.ellipse(25, 20, 150, 120, -0.2, -PI / 2, -PI / 2 + 2 * PI * clamp(ring)); g.stroke();
  }
  g.restore();
}
// the X-ray over the scene: the dark, both skeletons, the lungs and the heart, the ribs giving a little under the knee
// and springing back, the shock of the blow across his chest (the ring shows at the blow even before the X-ray is up).
// xr: 0..1; hitT: when the knee landed; stopT: when the heart stops (never, in the hook); beat0: the heartbeat's clock
function xrayPass(g, t, tau, { xr, hitT, stopT = Infinity, beat0 = hitT }) {
  const dS = dmState(tau, t), sk = skeleton(DM, dS), hit = chestPt(sk), kk = sk.k;
  if (xr > 0) {
    g.save(); g.fillStyle = rgba('#04101F', 0.92 * xr); g.fillRect(0, 0, W, H); g.restore();
    const dentAmt = 0.045 * kk * clamp((t - hitT) / 0.25) * (1 - clamp((t - hitT - 0.7) / 1.3));
    const dent = p => { const v = sub3(p, hit), dd = Math.hypot(v[0], v[1], v[2]); if (dd > 0.14 * kk) return p; const f = (1 - dd / (0.14 * kk)) ** 2; return AT(p, [sk.ft, -dentAmt * f]); };
    const ph = (t - beat0) / 0.82, beat = t < hitT ? 0 : Math.pow(Math.max(0, Math.sin(ph * 2 * PI)), 6) * clamp(1 - (t - hitT) / 0.9);
    drawXray(g, [bones(OW, owState(tau, t)), bones(DM, dS, { dent })], { a: xr, under: () => lungs(g, sk, xr), over: {
      d: depth(...AT(sk.C, [sk.spine, -0.15 * kk])),
      draw: () => heart3d(g, sk, { beat, fib: t > hitT + 0.3 && t < stopT ? 1 : 0, on: 1 - clamp((t - stopT) / 0.5), a: xr, t }),
    } });
  }
  const u = clamp((t - hitT) / 0.9), ringA = (1 - u) * Math.max(xr, 1 - clamp((t - hitT) / 0.22));
  if (t > hitT && u < 1 && ringA > 0.01) {
    const rho = lerp(0.02, 0.26, ease.out(u)) * kk, ring = [];
    for (let j = 0; j <= 36; j++) { const th = 2 * PI * j / 36; ring.push(B.project(...AT(hit, [sk.r, Math.cos(th) * rho], [sk.spine, Math.sin(th) * rho]))); }
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${(0.85 * ringA).toFixed(3)})`; g.lineWidth = 2 + 9 * (1 - u);
    g.beginPath(); ring.forEach((q, j) => (j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.stroke(); g.restore();
  }
}

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: SUNNY_G, trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  clashInit();

  // the one take's clock: real pace for the clearance and the chase, slow motion from the blow (on "chest."), almost
  // still through the X-ray, then real pace again as he goes down. The match shot before it runs on the same clock
  const clS = s('clash'), chestT = w('impact', 'chest.'), stopT = w('impact', 'stopped.'), medT = w('help', 'medics.'), carT = w('help', 'carried');
  const xrIn = chestT + 0.02, xrEnd = stopT + 0.45;
  const W0 = warp([[clS - 0.2, 1.0], [chestT - 0.32, 1.0], [chestT - 0.02, 0.07], [chestT + 0.2, 0.012], [xrEnd, 0.012], [xrEnd + 0.4, 1.0], [carT + 2, 1.0]]);
  const tauC = t => W0(t) - W0(chestT);

  // ======================= HOOK: the blow itself, the frame that shocks first (rule 42). Three strides at full pace, the
  // knee into his chest, time all but stops and the X-ray shows his heart; then the ball rolling to rest, alone =======================
  const neverT = w('hook', 'never'), hookCut = w('hook', 'Jesús') - 0.12, HIT = 0.13;
  const WH = warp([[0, 1.0], [0.09, 1.0], [HIT, 0.04], [0.5, 0.018], [hookCut + 1, 0.018]]);
  const tauH = t => -0.1108 + WH(t);  // the knee lands at t = HIT
  const hookCam = t => {  // side-on and a little from his front, both faces in profile; then in on his chest and round it
    const tau = tauH(t), ds = skeleton(DM, dmState(tau, t)), os = skeleton(OW, owState(tau, t));
    const chest = AT(ds.C, [ds.spine, -0.12 * ds.k]), oc = AT(os.C, [os.spine, -0.12 * os.k]);
    const u = clamp(t / hookCut), push = ease.out(clamp((t - 0.08) / 1.4));
    return K(lerp(0.1, 0.5, ease.inOut(u)), lerp(0.03, 0.1, u), lerp(4.1, 1.9, push), L3(L3(chest, oc, 0.45), chest, push), { cy: lerp(H * 0.56, H * 0.52, push) });
  };
  const hookKeys = []; for (let tt = 0; tt <= hookCut + 0.2; tt += 1 / 30) hookKeys.push([tt, hookCam(tt)]);
  shot(0, (g, lt, t) => {
    const tau = tauH(t);
    rig(B, lt, hookKeys, { t, e: lin, shake: t < HIT ? 0.8 : 2.2 * (1 - clamp((t - HIT) / 0.45)) });
    stadium(g, t, clashItems(tau, t), { cheer: 0.35, blur: 3 });
    xrayPass(g, t, tau, { xr: clamp((t - HIT - 0.08) / 0.25), hitT: HIT });
  }, { kb: 0, mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 2, 2, "90+7'", { hot: Math.sin(PI * clamp((t - w('hook', 'Ninety-seventh') + 0.05) / 0.8)) });  // "ninety-seventh minute"
    bigText(g, 'JESÚS DE MIGUEL', '1996–2026', 300, { a: 1 });
  } });
  shot(hookCut, (g, lt, t) => {  // "Jesús de Miguel never got up": the ball rolling on alone and coming to rest
    const tau = 1.0 + lt * 0.7, b = ball.at(tau), bp = b.pos;
    rig(B, lt, [[0, K(-0.35, 0.05, 3.4, [bp[0], 0.3, bp[2]], { cy: H * 0.56 })], [3.2, K(-0.2, 0.07, 2.6, [bp[0], 0.3, bp[2]], { cy: H * 0.56 })]], { t, e: lin });
    stadium(g, t, [BALL(bp, { spin: b.spin, axis: b.axis })], { cheer: 0, blur: 4 });
  }, { kb: 0, hud: (g, lt, t) => bigText(g, 'JESÚS DE MIGUEL', '1996–2026', 300, { a: 1 }) });
  cue(0, 'studs', 0.3); cue(HIT - 0.04, 'thud', 0.7); cue(HIT - 0.02, 'boom_cine', 0.45); cue(HIT + 0.12, 'crowd_gasp', 0.4);
  cue(HIT + 0.3, 'heartbeat', 0.6); cue(HIT + 1.75, 'heartbeat', 0.45); cue(hookCut - 0.05, 'whoosh_soft', 0.3); cue(hookCut + 0.35, 'bounce', 0.3);

  // ======================= WHO: his portrait; then the climb: he runs the ball up the touchline of a half-empty ground, and
  // the boards he passes carry his clubs in order, Castellón's in gold as he turns pro =======================
  // a close portrait in natural proportions: the shoulders run out of the bottom of the frame, nothing is stretched
  const whoS = s('who'), climbT = w('who', 'climbed'), proT = w('who', 'twenty-seven.'), runA = w('who', 'who') - 0.08;
  shot(whoS - 0.06, (g, lt, t) => {
    rig(B, lt, [[0, K(0.45, 0.06, 30, [0, 3, 0])], [3.0, K(0.3, 0.08, 26.5, [0, 3.1, 0])]], { t, e: glide });
    softStadium(g, t, { cheer: 0.3, skyO: SUN, pitchO: {} }, 9);
    g.fillStyle = 'rgba(10,20,40,0.24)'; g.fillRect(0, 0, W, H);
    const u = ease.inOut(clamp(lt / 2.7));  // a slow push on the portrait (rule 55)
    drawChar(g, 'demiguel', { x: W / 2 - 8 * u, y: 960 - 12 * u, s: 1.9 * (1 + 0.07 * u), e: { ...EXPR.happy, open: 0.15 }, t });
  }, { hud: (g, lt, t) => nameTitle(g, lt, 'Jesús de Miguel', 'STRIKER · MADRID, 1996', { y: 230, t0: 0.15 }) });
  const climbM = new Mover([[0, -17.75, 30.6], [1.25, -9.25, 30.3], [2.5, -0.75, 30.7], [3.75, 7.75, 30.3], [5.0, 16.25, 30.6], [6.5, 26.45, 30.4]]);
  const climbDr = dribbleSegs(climbM, climbM.steps(0.15, 6.3, { side: 'L' }), { ahead: 0.5, decay: 2.4 }), climbBall = new BallPath(climbDr.segs);
  const climbCam = lt => { const m = climbM.at(lt), u = clamp(lt / 5); return K(lerp(0.5, 0.42, u), 0.05, lerp(4.5, 4.1, u), [m.x + 0.72, 1.0, m.z], { cy: H * 0.46 }); };  // close, from his front: his feet and the ball above the caption line
  const climbKeys = []; for (let tt = 0; tt <= 5.6; tt += 1 / 30) climbKeys.push([tt, climbCam(tt)]);
  shot(runA, (g, lt, t) => {
    const m = climbM.at(lt), b = climbBall.at(lt);
    rig(B, lt, climbKeys, { t, e: lin, shake: 0.6 });
    stadium(g, t, [P(DM_YOUNG, { x: m.x, z: m.z, head: m.head, pose: POSE.run(m.phase, 1, 0.55), e: { ...EXPR.focus, brow: 0.3, curve: 0.2 }, t }), BALL(b.pos, { spin: b.spin, axis: b.axis })],
      { stad: LOWER, boards: BOARDS_C, boardO: BOARD_C_W, cheer: 0, blur: 2, skyO: SUN, pitchO: {} });
  }, { kb: 0, mbStep: 3, mbMax: 24, hud: (g, lt, t) => {
    CLUBS.forEach((c, i) => { const t0 = climbT + i * 0.24; if (t > t0) plate(g, c, 810, 770 - i * 74, { color: CREAM, size: 26, ...pin(t, t0) }); });  // the ladder, over the stand, clear of the boards
    if (t > proT - 0.1) plate(g, 'CASTELLÓN · PRO AT 27', 780, 770 - 6 * 74 - 14, { color: GOLD, size: 30, ...pin(t, proT - 0.1) });
  } });
  cue(whoS, 'whoosh_soft', 0.3); cue(runA, 'whoosh_fast', 0.25); cue(runA + 0.1, 'studs', 0.3); cue(runA + 2.4, 'studs', 0.25);
  for (let i = 0; i < 6; i++) cue(climbT + i * 0.24, 'piece', 0.12);
  cue(proT - 0.1, 'sparkle_pop', 0.2);

  // ======================= GOALS: last season, back to the second division =======================
  // he wheels away toward the camera with his arms spread, plants, jumps with both fists up and lands; a teammate runs
  // in to celebrate with him. The jump keeps its pelvis height continuous (no switch between standing and flying)
  const glS = s('goals'), elevT = w('goals', 'eleven'), divT = w('goals', 'second');
  const celM = new Mover([[0, -25.4, -12.6], [1.0, -27.9, -18.6], [1.6, -29.2, -21.3], [1.95, -29.45, -21.75, { stop: true }], [9, -29.45, -21.75]]);
  const mateM = new Mover([[0, -30.6, -8.5], [1.6, -31.0, -15.2], [2.9, -31.0, -21.0, { stop: true }], [9, -31.0, -21.0]]);  // from the background, in view all the way
  const celState = (lt, t) => {
    const m = celM.at(lt), face = -PI / 2 - 0.35, base = { x: m.x, z: m.z, head: lt < 1.6 ? m.head : lerp(m.head, face, ease.inOut(clamp((lt - 1.6) / 0.35))), t };
    const wings = { sh: [[0.3, 1.3], [0.3, 1.3]], el: [0.2, 0.2] }, arms = u => ({ sh: [[lerp(-0.45, 2.75, u), lerp(0.3, 0.5, u)], [lerp(-0.45, 2.75, u), lerp(0.3, 0.5, u)]], el: [lerp(0.6, 0.25, u), lerp(0.6, 0.25, u)] });
    let pose, lift = 0;
    if (lt < 1.55) pose = blend(POSE.run(m.phase, clamp(m.sp / 6), 0), wings, 1);
    else if (lt < 1.95) pose = blend(blend(POSE.run(m.phase, clamp(m.sp / 6), 0), wings, 1), { ...POSE.stand(), crouch: 0.12, knee: [0.6, 0.6], hip: [[0.35, 0.08], [0.35, 0.08]], lean: 0.25, ...arms(0) }, ease.inOut((lt - 1.55) / 0.4));
    else if (lt < 2.8) {  // the jump: crouch, take-off, tucked in the air, land
      const u = (lt - 1.95) / 0.85, air = clamp((u - 0.22) / 0.56), up = ease.out(clamp((u - 0.12) / 0.22));
      const dip = u < 0.22 ? Math.sin(PI * u / 0.44) : u > 0.78 ? Math.sin(PI * (u - 0.78) / 0.44) : 0;
      lift = 0.55 * Math.sin(PI * air);
      pose = { ...POSE.stand(), ...arms(up), lean: lerp(0.25, -0.08, up), crouch: 0.16 * dip, hip: [[0.35 + 0.5 * Math.sin(PI * air), 0.08], [0.35 + 0.5 * Math.sin(PI * air), 0.08]], knee: [0.6 + 0.8 * Math.sin(PI * air) + 0.3 * dip, 0.6 + 0.8 * Math.sin(PI * air) + 0.3 * dip] };
    } else { const k = 0.5 - 0.5 * Math.cos((lt - 2.8) * 7); pose = { ...POSE.stand(), ...arms(1), sh: [[2.65 + 0.2 * Math.sin((lt - 2.8) * 7), 0.48], [2.65 + 0.2 * Math.sin((lt - 2.8) * 7 + 0.4), 0.48]], crouch: 0.05 * k, knee: [0.15 + 0.25 * k, 0.15 + 0.25 * k], lean: -0.06 }; }
    const st = { ...base, pose: { ...pose, lift: 0 }, e: lt < 1.9 ? 'happy' : { ...EXPR.triumph, lid: 0.25 } };
    return lift > 0 ? { ...st, pose: { ...grounded(DM, st).pose, lift } } : st;
  };
  shot(glS - 0.06, (g, lt, t) => {
    const m = celM.at(lt), follow = [lerp(m.x, -29.45, 0.25), 1.35, lerp(m.z, -21.75, 0.25)];
    rig(B, lt, [[0, K(-0.42, 0.1, 10.5, follow)], [2.0, K(-0.36, 0.08, 5.6, [-29.6, 1.4, -21.9])], [len({ a: 0, b: s('match') - glS }), K(-0.22, 0.07, 4.8, [-29.9, 1.45, -22.0]), ease.inOut]], { t, e: glide });
    const mm = mateM.at(lt), mateArms = lt < 2.9 ? POSE.run(mm.phase, clamp(mm.sp / 6), 0) : { ...POSE.stand(), sh: [[2.6 + 0.2 * Math.sin(lt * 7 + 1), 0.55], [2.6 + 0.2 * Math.sin(lt * 7 + 1.4), 0.55]], el: [0.25, 0.25] };
    const mate = { x: mm.x, z: mm.z, head: lt < 2.9 ? mm.head : lerp(mm.head, -PI / 2 - 0.1, ease.inOut(clamp((lt - 2.9) / 0.4))), pose: lt < 2.9 ? blend(mateArms, { sh: [[2.2, 0.5], [2.2, 0.5]], el: [0.4, 0.4] }, clamp((lt - 2.2) / 0.5)) : mateArms, e: 'happy', t: t + 2 };
    stadium(g, t, [P(DM, celState(lt, t)), P(T2, mate)], { cheer: 1, blur: 3, skyO: SUN, pitchO: {} });
  }, { hud: (g, lt, t) => {
    if (t > elevT) counter(g, '11', 'GOALS · 2025–26', { y: 330, size: 140, color: CREAM, at: [t, elevT] });
    if (t > divT) plate(g, 'BACK TO THE SECOND DIVISION', W / 2, 1520, { color: GOLD, size: 40, ...pin(t, divT) });
  } });
  cue(glS - 0.06, 'whoosh_soft', 0.3); cue(glS, 'crowd_roar', 0.5); cue(glS - 0.06 + 2.15, 'crowd_roar', 0.35); cue(elevT, 'sparkle_pop', 0.25); cue(divT, 'stamp', 0.3);

  // ======================= MATCH: Monday afternoon, 2–2, added time =======================
  // the same clock as the take: Andorra's winger runs at the defence, crosses, Tenerife's centre-back meets it
  const mtS = s('match'), tenT = w('match', 'Tenerife'), scoreT = w('match', '2–2,');
  shot(mtS - 0.06, (g, lt, t) => {
    const tau = tauC(t);
    rig(B, lt, [[0, K(0.32, 0.62, 95, [-10, 0, 0])], [len({ a: 0, b: clS - mtS }), K(0.3, 0.26, 34, [-27, 1, 0]), ease.inOut]], { t });
    stadium(g, t, clashItems(tau, t), { cheer: 0.45 });
  }, { trans: 'fade', hud: (g, lt, t) => {
    if (t > mtS) plate(g, 'MONDAY · 2 NOVEMBER 2026', W / 2, 250, { color: CREAM, size: 40, ...pin(t, mtS) });
    if (t > tenT) plate(g, 'HELIODORO RODRÍGUEZ LÓPEZ', W / 2, 345, { color: TBLUE, size: 30, ...pin(t, tenT) });
    if (t > scoreT) scoreBug(g, 2, 2, "90+7'", { y: 1500, x: (W - 500) / 2, al: clamp((t - scoreT) / 0.2) });
  } });
  cue(mtS - 0.08, 'whoosh_deep', 0.35); cue(scoreT, 'stamp', 0.3);

  // ======================= THE ONE TAKE: the clearance, the chase at full pace, slow motion at the blow, the X-ray close
  // round his chest, then real pace again: he goes down onto his back and stays down, the keeper ends up sitting on the grass,
  // gets up and comes to him with his hands on his head, players run in. It opens close on the centre-back's clearance
  let kickT = clS; for (let tt = clS - 1.5; tt < clS + 1.5; tt += 1 / 240) if (tauC(tt) >= -7.95) { kickT = tt; break; }  // the centre-back's boot meets the cross
  const t4M = others.find(o => o[0] === T4)[1];
  const camAt = t => {
    const tau = tauC(t), d = dmM.at(tau), sk = skeleton(DM, dmState(tau, t)), chest = AT(sk.C, [sk.spine, -0.12 * sk.k]);
    // it opens on the clearance itself, close on the centre-back as he meets the cross; then back (so the ball stays in
    // frame as it climbs) and away downfield under it, to the wide view with the ball high over de Miguel. It backs off in
    // two steps: only to 12 m while it is still level with the winger who crossed (he stays behind the lens), the rest of
    // the way once it has left him behind
    const c4 = t4M.at(Math.min(tau, -7.9)), P0 = K(0.04, 0.06, 5.6, [c4.x + 0.9, 1.05, c4.z], { cy: H * 0.47 });
    const Pw = K(0.38, 0.14, 21, [d.x + 7, 2.2, d.z + 0.5]);
    const back = t < kickT + 0.75 ? lerp(P0.dist, 12, ease.out(clamp((t - (kickT + 0.05)) / 0.4))) : lerp(12, Pw.dist, ease.inOut(clamp((t - (kickT + 0.75)) / 0.6)));
    const P1 = { ...lerpCam(P0, Pw, ease.inOut(clamp((t - (kickT + 0.2)) / 1.25))), dist: back };
    const runU = clamp((t - clS - 2) / 5);
    const P2 = K(-1.38, lerp(0.11, 0.08, runU), lerp(8.0, 6.6, runU), [d.x + 4.6, 1.35, d.z + 0.3], { cy: H * 0.55 });  // over his shoulder, the keeper coming
    // round behind him while still far out, and only then in over his shoulder (the camera never passes his face)
    const u1 = ease.inOut(clamp((t - (clS + 1.4)) / 1.3)), u2 = ease.inOut(clamp((t - (clS + 2.1)) / 1.2));
    let cam = { ...lerpCam(P1, P2, u1), dist: lerp(P1.dist, P2.dist, u2) };
    const sw = ease.inOut(clamp((t - (chestT - 1.1)) / 1.1));
    if (sw > 0) {  // the swing to the side for the blow: a two-shot that keeps both men in frame, closing on his chest as they meet
      const os = skeleton(OW, owState(tau, t)), oc = AT(os.C, [os.spine, -0.12 * os.k]);
      const yaw = lerp(P2.yaw, -0.12, sw), R = [Math.cos(yaw), 0, Math.sin(yaw)];
      const fin = ease.inOut(clamp((t - (chestT - 0.3)) / 0.3)), wO = 0.5 * (1 - fin);
      const sepX = Math.abs((oc[0] - chest[0]) * R[0] + (oc[2] - chest[2]) * R[2]);
      const need = Math.max(3.4, (sepX * Math.max(wO, 1 - wO) + 0.8) / 0.36);
      const two = K(yaw, lerp(cam.pitch, 0.04, sw), lerp(need, 3.4, fin), L3(chest, oc, wO), { cy: lerp(cam.cy, H * 0.5, sw) });
      cam = lerpCam(cam, two, ease.inOut(clamp(sw * 2.5)));
    }
    if (t > xrIn) {  // the X-ray: in close on the chest and round to his front (the cage turns in perspective; the face
      // changes from the back of his head to his profile under the dark of the X-ray, unseen)
      const k4 = clamp((t - xrIn) / (xrEnd - xrIn)), push = ease.inOut(clamp((t - xrIn) / 0.9));
      cam = K(lerp(-0.12, 0.55, ease.inOut(k4)), lerp(0.04, 0.12, k4), lerp(3.4, 1.55, push), chest);
    }
    if (t > xrEnd) {  // out again as he goes down and the keeper tumbles past; then wide enough for both, the players coming
      const u = clamp((t - xrEnd) / 2.6), end = K(0.55, 0.12, 1.55, chest);
      const P5 = K(lerp(0.5, 0.4, u), lerp(0.2, 0.34, u), lerp(6.4, 9.4, ease.inOut(clamp((t - xrEnd - 0.5) / 1.8))), [lerp(6.6, 6.3, u), lerp(1.0, 0.6, u), lerp(2.1, 2.6, u)]);
      cam = lerpCam(end, P5, ease.inOut(clamp((t - xrEnd) / 0.9)));
    }
    return cam;
  };
  const takeA = kickT - 0.34, takeKeys = []; for (let tt = takeA; tt <= carT + 0.2; tt += 1 / 30) takeKeys.push([tt - takeA, camAt(tt)]);
  shot(takeA, (g, lt, t) => {
    const tau = tauC(t);
    rig(B, lt, takeKeys, { t, e: lin, shake: t < chestT - 0.35 ? 0.9 : t < xrEnd ? 0 : 0.45 });
    const items = clashItems(tau, t);
    stadium(g, t, items, { cheer: 0.35, blur: t < chestT - 1.2 ? 1.5 : 3 });
    xrayPass(g, t, tau, { xr: clamp((t - xrIn) / 0.25) * (1 - clamp((t - xrEnd) / 0.13)), hitT: chestT, stopT, beat0: xrIn });
  }, { kb: 0, mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 2, 2, "90+7'", { al: 1 - clamp((t - xrIn) / 0.3) });
    const xr = clamp((t - xrIn) / 0.25) * (1 - clamp((t - xrEnd) / 0.13));
    if (xr > 0) {
      ecg(g, t, { chaosAt: chestT, flatAt: stopT + 0.05, a: xr });
      if (t > chestT) plate(g, 'KNEE TO THE CHEST', W / 2, 300, { color: CREAM, size: 44, ...pin(t, chestT, xr) });
      if (t > stopT) plate(g, 'CARDIAC ARREST', W / 2, 405, { color: RED, size: 48, ...pin(t, stopT, xr) });
    }
    if (t > medT) plate(g, "MATCH STOPPED · 90+7'", W / 2, 260, { color: CREAM, size: 40, ...pin(t, medT) });
  } });
  cue(kickT - 0.02, 'kick', 0.6); cue(takeA, 'whoosh_fast', 0.2); cue(clS + 3.0, 'bounce', 0.3); cue(clS + 5.0, 'bounce', 0.25); cue(w('clash', 'chased'), 'studs', 0.35); cue(w('clash', 'came'), 'studs', 0.35);
  cue(chestT - 0.35, 'whoosh_deep', 0.45); cue(chestT - 0.04, 'thud', 0.6); cue(chestT - 0.02, 'boom_cine', 0.3);
  for (let k = 0; k < 4; k++) { const tb = xrIn + 0.82 * k + 0.12; if (tb < stopT - 0.15) cue(tb, 'heartbeat', 0.55 - k * 0.1); }
  cue(xrEnd + 0.3, 'crowd_gasp', 0.45); cue(xrEnd + 0.62, 'thud', 0.3); cue(xrEnd + 0.95, 'thud', 0.2); cue(medT - 0.4, 'whistle', 0.4);

  // ======================= the stretcher; the ambulance: the monitor inside, then the van racing away =======================
  const ambT = w('help', 'and'), backT = w('help', 'pulse') + 0.07, extT = w('help', 'ambulance.') - 0.05;  // flat for half a second, then two beats in view before the road
  shot(carT - 0.08, (g, lt, t) => {  // the stretcher off the pitch, from ahead and to the side, a little above: the four bearers apart
    const u = clamp(lt / 2.0), cx = lerp(5.4, 4.7, u), cz = lerp(0.6, -5.4, u), hd = -PI / 2 - 0.12;
    rig(B, lt, [[0, K(0.95, 0.3, 8.4, [cx, 0.85, cz])], [2.0, K(1.08, 0.28, 7.9, [4.7, 0.85, -5.4])]], { t, e: lin, shake: 0.35 });
    const items = stretcherItems(t, { cx, cz, hd });
    items.push(P(T1, { x: cx + 1.15, z: cz + 2.4, head: hd, pose: blend(POSE.run(t * 6.4 + 1, 0.3, 0), HANDS_HEAD, 1), e: 'sad', t: t + 3 }));
    stadium(g, t, items, { cheer: 0, blur: 2.5 });
  });
  shot(ambT - 0.06, (g, lt, t) => ambInterior(g, t, lt, backT), { grade: GREY, kb: 0 });
  shot(extT, (g, lt, t) => {  // outside the ground: the ambulance races along the road under the stadium wall, fans on the far kerb
    const RZ = 160, vx = lerp(-1.5, 11.5, lt / 1.4);
    rig(B, lt, [[0, K(PI + 0.12, -0.05, 12.0, [vx - 0.2, 1.6, RZ])], [1.4, K(PI + 0.2, -0.06, 11.4, [vx - 1.0, 1.6, RZ])]], { t, e: lin, shake: 0.5 });
    sky(g, B, { t, ...SUN });
    if (B.poly(g, [[-300, 0, -140], [300, 0, -140], [300, 0, 300], [-300, 0, 300]])) { g.fillStyle = '#6B6D70'; g.fill(); }  // the forecourt
    HELIO.draw(g, B, t, { part: 'outer' });
    for (let gx = -96; gx <= 96; gx += 16) if (B.poly(g, [[gx - 3, 0, 94.9], [gx + 3, 0, 94.9], [gx + 3, 4.6, 94.9], [gx - 3, 4.6, 94.9]])) { g.fillStyle = '#3E4146'; g.fill(); }  // the gates
    { const o = B.project(31, 34, 94.9), xe = B.project(-13, 34, 94.9), ye = B.project(31, 27, 94.9);  // the name high on the wall (read from outside: +x is to the left)
      g.save(); g.translate(o.x, o.y); g.transform((xe.x - o.x) / 1000, (xe.y - o.y) / 1000, (ye.x - o.x) / 159, (ye.y - o.y) / 159, 0, 0);
      g.fillStyle = TBLUE; g.font = sans(150, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HELIODORO', 500, 84, 1000); g.restore(); }
    for (const [z0, z1, col] of [[RZ - 7.5, RZ - 4.5, '#9C9A94'], [RZ + 4.5, RZ + 7, '#9C9A94'], [RZ - 4.5, RZ + 4.5, '#45474B']]) if (B.poly(g, [[-300, 0.01, z0], [300, 0.01, z0], [300, 0.01, z1], [-300, 0.01, z1]])) { g.fillStyle = col; g.fill(); }
    for (let i = -40; i < 40; i++) if (B.poly(g, [[i * 5, 0.02, RZ - 0.1], [i * 5 + 2.4, 0.02, RZ - 0.1], [i * 5 + 2.4, 0.02, RZ + 0.1], [i * 5, 0.02, RZ + 0.1]])) { g.fillStyle = '#E9E6DE'; g.fill(); }
    const fans = [[-4, 0], [-1.2, 1], [1.8, 0], [4.6, 1], [7.4, 0], [10.6, 1], [13.4, 0]].map(([fx, k], i) => P({ who: k ? 'fanA' : 'fanB', kit: k ? FAN(TBLUE, '#173E7E') : FAN('#F4F6F8', '#C9D2DC'), num: null, h: 1.72 + 0.06 * (i % 3) },
      { x: fx, z: RZ - 6.2 + 0.3 * (i % 2), head: PI / 2 + 0.25 * Math.sin(i * 2.1), pose: blend(POSE.stand(), i % 3 ? HANDS_HEAD : { sh: [[0.9, -0.3], [0.9, -0.3]], el: [1.9, 1.9] }, 1), e: 'worried', t: t + i }));
    drawSorted(g, [...fans, ...ambulanceItems(vx, RZ, t, { dist: vx + 1.5 })]);
  }, { kb: 0, mbStep: 3, mbMax: 16, hud: (g, lt, t) => { plate(g, 'HOSPITAL · LA CANDELARIA', W / 2, 300, { color: CREAM, size: 38, ...pin(t, extT) }); } });
  cue(carT, 'footsteps', 0.3); cue(ambT - 0.04, 'whoosh_soft', 0.25); cue(backT, 'heartbeat', 0.55); cue(backT + 0.86, 'heartbeat', 0.4); cue(extT, 'whoosh_fast', 0.45);

  // ======================= DEATH: the hospital room at dawn, the clock coming round to eight; the film on the light box =======================
  const dtS = s('death'), eightT = w('death', 'eight.'), autT = w('death', 'preliminary'), blowT = w('death', 'blow');
  const filmA = autT - 0.25;
  shot(dtS - 0.06, (g, lt, t) => {
    const u = clamp(lt / (filmA - dtS + 0.06));
    rig(B, lt, [[0, K(-0.2, 0.1, 18.5, [5.4, 4.6, 10])], [filmA - dtS + 0.06 + 0.35, K(0.02, 0.05, 13.6, [7.5, 4.85, 11]), ease.inOut]], { t });  // the clock under the date, the monitor above the caption
    const mins = t < eightT ? 480 - 6 * Math.pow(1 - clamp((t - (dtS - 0.06)) / (eightT - dtS + 0.06)), 1.6) : 480 + (t - eightT) / 60;
    ward(g, t, eightT, mins);
    g.save(); g.fillStyle = `rgba(255,190,140,${(0.05 + 0.06 * u).toFixed(3)})`; g.globalCompositeOperation = 'soft-light'; g.fillRect(0, 0, W, H); g.restore();
  }, { grade: DAWN_G, trans: 'fade', hud: (g, lt, t) => {
    if (t > dtS + 0.1) plate(g, 'TUESDAY · 3 NOVEMBER · 8:00', W / 2, 260, { color: CREAM, size: 40, ...pin(t, dtS + 0.1) });
  } });
  shot(filmA, (g, lt, t) => {  // the film on the light box: it flickers on, the camera closes in, a ring is drawn where the knee struck
    const on = lt < 0.25 ? (Math.floor(lt * 30) % 3 ? 1 : 0.3) : 1, z = 1 + 0.12 * ease.inOut(clamp(lt / 3.9));
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1B2731'); bg.addColorStop(1, '#0D141A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2 + 10 * Math.sin(lt * 0.6), 780); g.scale(0.82 * z, 0.82 * z); g.rotate(-0.02 + 0.015 * lt / 4);
    g.fillStyle = '#9DA6AD'; g.beginPath(); g.roundRect(-430, -500, 860, 1000, 26); g.fill();  // the light box
    const lb = g.createRadialGradient(0, 0, 100, 0, 0, 640); lb.addColorStop(0, `rgba(246,251,255,${on})`); lb.addColorStop(1, `rgba(200,220,235,${on})`);
    g.fillStyle = lb; g.beginPath(); g.roundRect(-395, -465, 790, 930, 14); g.fill();
    g.globalAlpha = 0.35 + 0.65 * on; chestFilm(g, 0, 0, 640, 800, clamp((t - blowT) / 0.6)); g.globalAlpha = 1;
    g.fillStyle = '#5C666E'; for (const cx of [-150, 150]) { g.beginPath(); g.roundRect(cx - 40, -470, 80, 36, 6); g.fill(); }  // the clips
    g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; const halo = g.createRadialGradient(W / 2, 780, 260, W / 2, 780, 820); halo.addColorStop(0, `rgba(200,225,255,${0.18 * on})`); halo.addColorStop(1, 'rgba(200,225,255,0)'); g.fillStyle = halo; g.fillRect(0, 0, W, H); g.restore();
  }, { grade: GREY, kb: 0, hud: (g, lt, t) => {
    if (t > autT) plate(g, 'PRELIMINARY AUTOPSY', W / 2, 1440, { color: CREAM, size: 38, ...pin(t, autT) });
    if (t > blowT) plate(g, 'CHEST TRAUMA', W / 2, 1545, { color: RED, size: 48, ...pin(t, blowT) });
  } });
  cue(dtS, 'clock_tick', 0.25); cue(dtS + 0.9, 'clock_tick', 0.2); cue(eightT, 'clock_tick', 0.3); cue(filmA + 0.02, 'touch', 0.35); cue(blowT, 'stamp', 0.25);

  // ======================= OWONO: back on the pitch (he had run to him with the others), then his portrait and his words =======================
  const owS = s('owono'), wroteT = w('owono', 'wrote:'), hardT = w('owono', 'hardest'), owB = w('owono', 'next') - 0.33;  // 'The next day': the phrase has an earlier 'the'
  shot(owS - 0.06, (g, lt, t) => {  // slowed: he gets up and comes to him with his hands on his head, the others round them
    const tau = 2.3 + lt * 0.62;
    rig(B, lt, [[0, K(0.48, 0.22, 7.45, [7.2, 0.8, 2.2], { cy: H * 0.47 })], [1.85, K(0.42, 0.21, 7.3, [7.3, 0.8, 2.2], { cy: H * 0.47 })]], { t, e: glide });
    stadium(g, t, clashItems(tau, t), { cheer: 0, blur: 3 });
  }, { grade: GREY, kb: 0, trans: 'fade', hud: (g, lt, t) => nameTitle(g, lt, 'Jesús Owono', 'FC ANDORRA GOALKEEPER', { y: 230, t0: 0.1 }) });
  shot(owB, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.12, 0.1, 30, [0, 3, 0])], [len({ a: 0, b: s('tribute') - owB }), K(0.12, 0.1, 26, [0, 3, 0])]], { t, e: glide });
    softStadium(g, t, { stad: EMPTY, skyO: OVER }, 9);
    g.fillStyle = 'rgba(8,14,26,0.12)'; g.fillRect(0, 0, W, H);
    { const gl = g.createRadialGradient(W / 2, 980, 120, W / 2, 980, 760); gl.addColorStop(0, 'rgba(235,240,245,0.28)'); gl.addColorStop(1, 'rgba(235,240,245,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
    const z = 1 + 0.06 * ease.inOut(clamp(lt / 4));
    drawChar(g, 'owono', { x: W / 2 + 10 * clamp(lt / 4), y: 960, s: 1.9 * z, e: { ...EXPR.sad, look: [0, 0.6] }, t });
  }, { grade: GREY, hud: (g, lt, t) => {
    nameTitle(g, lt + 3, 'Jesús Owono', 'FC ANDORRA GOALKEEPER', { y: 230, t0: 0.1 });  // already up: it carries over from the shot before
    if (t > hardT - 0.3) plate(g, '"THE HARDEST DAYS OF MY LIFE"', W / 2, 1470, { color: GOLD, size: 44, ...pin(t, hardT - 0.3) });
    if (t > wroteT) plate(g, '«ESTÁN SIENDO LOS DÍAS MÁS DIFÍCILES DE MI VIDA»', W / 2, 1565, { color: CREAM, size: 24, ...pin(t, wroteT) });
  } });

  // ======================= TRIBUTE: across Spain, play stopped in the ninth minute =======================
  const trS = s('tribute'), ninthT = w('tribute', 'ninth');
  shot(trS - 0.06, (g, lt, t) => {
    const L = len({ a: 0, b: s('end') - trS }), u = ease.inOut(clamp(lt / L));
    rig(B, lt, [[0, K(-0.1, 0.11, 7.8, [-2.8, 1.45, 2.2])], [L, K(0.12, 0.09, 6.6, [2.8, 1.45, 2.2])]], { t, e: glide });  // tracking along the line
    const items = [];
    for (let i = 0; i < 11; i++) {  // a line of players in the centre circle, backs to us, all wearing 9, applauding over their heads
      const x = -7.5 + i * 1.5, cl = 0.5 + 0.5 * Math.sin(t * 11 + i * 0.9), up = t > ninthT - 0.2 ? ease.inOut(clamp((t - ninthT + 0.2) / 0.4)) : 0;
      const arms = blend({ sh: [[1.0, -0.05 + 0.18 * cl], [1.0, -0.05 + 0.18 * cl]], el: [1.15, 1.15] }, { sh: [[2.45, 0.12 + 0.3 * cl], [2.45, 0.12 + 0.3 * cl]], el: [0.75, 0.75] }, up);
      items.push(P({ who: i % 2 ? 'aA' : 'tB', kit: i % 2 ? { ...AND, shirt: '#15171C', shirtD: '#0C0D10', num: '#F2F2EE', shorts: '#15171C', socks: '#15171C' } : { ...TEN, shirt: '#F2F2EE' }, num: 9, h: 1.8 },
        { x, z: 2.2, head: PI / 2, pose: { ...POSE.stand(), ...arms }, e: 'sad', t: t + i }));
    }
    stadium(g, t, items, { stad: FULL, boards: BOARDS_T, cheer: 1, blur: 2.5, skyO: DUSK, pitchO: {} });
  }, { grade: LIGHTS, trans: 'fade', hud: (g, lt, t) => {
    if (t > trS + 0.1) plate(g, 'MATCHDAY 12 · SPAIN', W / 2, 250, { color: CREAM, size: 36, ...pin(t, trS + 0.1) });
    if (t > ninthT) counter(g, "9'", 'PLAY STOPPED', { y: 420, size: 140, color: CREAM, at: [t, ninthT] });
  } });
  cue(ninthT - 0.1, 'whistle', 0.3); cue(ninthT, 'applause', 0.6);

  // ======================= END: the Heliodoro says goodbye =======================
  const enS = s('end');
  shot(enS - 0.06, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.05, -0.03, 24, [0, 6.0, 48])], [len({ a: 0, b: T.duration - enS }), K(0.04, -0.02, 20, [0, 6.0, 48])]], { t, e: glide });  // the banner above the caption line
    sky(g, B, { t, ...DUSK }); HELIO.draw(g, B, t, { cheer: 1 }); pitch(g, B, { t, ...WET });
    banner(g, t, 1);
  }, { grade: LIGHTS, trans: 'fade', post: (g, lt, t) => { const f = clamp((t - (T.duration - 1.6)) / 1.3); if (f > 0) { g.fillStyle = `rgba(0,0,0,${f.toFixed(3)})`; g.fillRect(0, 0, W, H); } }, hud: (g, lt, t) => {
    plate(g, 'DESCANSA EN PAZ, JESÚS', W / 2, 1470, { color: CREAM, size: 46, ...pin(t, enS + 0.3) });
    if (t > enS + 0.7) plate(g, '1996–2026', W / 2, 1570, { color: GOLD, size: 38, ...pin(t, enS + 0.7) });
  } });
  cue(enS, 'applause', 0.45);

  // ---------- the crowd under the stadium scenes, on its own bus: it falls quiet after the blow
  amb.push({ id: 'crowd_bed', t0: 0, t1: whoS, gain: 0.7, fi: 0.02, fo: 0.3, keys: [[0, 1], [HIT, 1], [HIT + 0.25, 0.1], [hookCut, 0.1], [hookCut + 0.5, 0.35]] });
  amb.push({ id: 'crowd_bed', t0: glS - 0.06, t1: mtS, gain: 0.7, fi: 0.2, fo: 0.2 });
  amb.push({ id: 'crowd_bed', t0: mtS - 0.06, t1: ambT, gain: 0.6, fi: 0.3, fo: 0.4, keys: [[0, 1], [chestT - 0.3, 1], [chestT + 0.1, 0.06], [xrEnd, 0.06], [xrEnd + 0.6, 0.35], [carT, 0.2]] });
  amb.push({ id: 'crowd_bed', t0: extT, t1: dtS - 0.06, gain: 0.3, fi: 0.15, fo: 0.4 });
  amb.push({ id: 'crowd_bed', t0: trS - 0.06, t1: T.duration, gain: 0.45, fi: 0.4, fo: 1.5 });

  const music = [
    { t: 0, m: 'void' }, { t: whoS - 0.06, m: 'elegy' }, { t: takeA, m: 'tension' }, { t: xrEnd, m: 'void' },
    { t: dtS - 0.06, m: 'elegy' }, { t: trS - 0.06, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: chestT - 0.2, t1: xrEnd + 0.2, kind: 'mute' },  // nothing but the heartbeat through the X-ray
    { t0: 0, t1: whoS, kind: 'lp', f: 1600 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff: null, grain: 0.02 };
}
