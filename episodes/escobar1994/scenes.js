// "The gentleman of football". Andrés Escobar, Colombia's number 2 at the 1994 World Cup: one of the favourites after
// Argentina 0–5 Colombia (Buenos Aires, 5 September 1993); beaten 3–1 by Romania; against the hosts, USA 2–1 Colombia, the
// Rose Bowl, 22 June 1994, he turned John Harkes's cross into his own net; out on 26 June. He wrote in El Tiempo "Hasta
// pronto, porque la vida no termina aquí". Shot dead in the early hours of 2 July 1994 in a car park in Medellín, ten days
// after the match, aged 27 (the shooting is not shown, the brief). More than 100,000 at his funeral; his statue in Medellín;
// "El Caballero del Fútbol". Facts, what is drawn and what is not known: SOURCES.md.
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
import { serif } from '../../engine/js/hud.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI, FPS = 30;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', LIME = '#9CCB4A', RED = '#D8453A', BLACK = '#15161A';
const IMG = { iconic: await loadImage('../episodes/escobar1994/photos/iconic.jpg').catch(() => null), credit: null };
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

// grades: the Rose Bowl in the afternoon; Buenos Aires and Medellín at night; a lamp over the newspaper; the grey day of
// the funeral; the warm evening at the statue
const DAY_G = { con: 1.05, sat: 1.06, bri: 1.03, tone: ['#FFF2DC', 0.05], lift: ['#1A2444', 0.05], bloom: 0.2 };
const NIGHT_G = { con: 1.07, sat: 1.04, bri: 1.02, tone: ['#DCE8FF', 0.06], lift: ['#0E1630', 0.12], bloom: 0.3 };
const STREET_G = { con: 1.08, sat: 1.0, bri: 1.02, tone: ['#FFC98A', 0.08], lift: ['#0A0E1C', 0.14], bloom: 0.34 };
const ROOM_G = { con: 1.06, sat: 1.0, bri: 1.02, tone: ['#FFD9A0', 0.1], lift: ['#161008', 0.08], bloom: 0.26 };
const GREY_G = { con: 1.03, sat: 0.9, bri: 1.02, tone: ['#E8ECF0', 0.06], lift: ['#1A2030', 0.08], bloom: 0.16 };
const DUSK_G = { con: 1.05, sat: 1.05, bri: 1.03, tone: ['#FFD9B0', 0.1], lift: ['#1A2444', 0.08], bloom: 0.24 };
const PRINT_G = { con: 1.02, sat: 1.0, bri: 1.0, tone: null, lift: ['#101010', 0.04], bloom: 0.12 };

// ---------- kits (drawn; the colours of 22 June 1994 are not confirmed, SOURCES.md: Colombia in their home yellow, blue
// and red until the photograph settles it), no sponsors, a plain badge. The cast: cartoons, not likenesses
const SKIN_L = { base: '#ECC6A2', shade: '#D8AC86', deep: '#B4845C', blush: '#E2967E', hi: '#F7DEC2' };
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const SKIN_D = { base: '#8A5A3A', shade: '#74482C', deep: '#56331E', blush: '#7C4832', hi: '#A8744E' };
const CYEL = '#F2C811', CBLUE = '#1E3F8A', CRED = '#C8202C', UNAVY = '#1C2B5A', URED = '#B8202C', CELESTE = '#7EB6E6', VERDE = '#0F7A3E';
const COL = { shirt: CYEL, shirtD: '#CFA80C', trim: CBLUE, num: CBLUE, numEdge: null, shorts: CBLUE, socks: CRED, band: CYEL, boots: '#1A1B1F', badge: CBLUE };
const GK_COL = { shirt: '#5E6A76', shirtD: '#4A545E', trim: CYEL, num: '#F4F4F2', numEdge: null, shorts: '#2A2D34', socks: '#5E6A76', band: CYEL, boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: CYEL };
const USA = { shirt: '#F4F4F2', shirtD: '#D6D9DE', trim: UNAVY, num: UNAVY, numEdge: null, shorts: '#F4F4F2', socks: '#F4F4F2', band: URED, boots: '#1A1B1F', badge: URED };
const ARG_GK = { shirt: '#3A4048', shirtD: '#2A2F36', trim: '#C9CED6', num: '#F4F4F2', numEdge: null, shorts: '#1E2126', socks: '#3A4048', band: '#C9CED6', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#C9CED6' };
// people in the street and in the stand (long sleeves and trousers, no number)
const plain = (shirt, trousers = '#2A2D34', o = {}) => ({ shirt, shirtD: mix(shirt, '#000000', 0.16), trim: mix(shirt, '#000000', 0.16), num: null, shorts: trousers, socks: trousers, boots: '#1A1B1F', long: true, trousers: true, band: null, badge: null, ...o });
const MOURN = [plain('#F2F0EA', '#2A2D34'), plain('#2E3138', '#22252B'), plain('#F2F0EA', '#3A3E48'), plain(CYEL, '#2A3A66'), plain('#4A5262', '#2A2D34')];
const NAC = { ...plain('#F4F4F2', '#22252B'), stripes: [VERDE, 3], trim: VERDE };
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: '#22252D', suitD: '#16181E', shirt: 'tee', ears: 1.0, ...o });
// hair drawn whole, all round the head: a cap in front, a full shape behind it and a full back of the head, so no skull
// shows when the head turns or from behind (STYLE_BIBLE rule 71; the fullHair of statpad)
const fullHair = col => {
  const front = (g, layer, { fw, fh = 1, turn = 0 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = col;
    if (layer === 'back') { g.beginPath(); g.ellipse(0, -26, 106 * fw, 110, 0, 0, 7); g.fill(); return; }
    const p = new Path2D(); p.moveTo(-w - 3, -6); p.bezierCurveTo(-w - 9, -h * 0.95, -40, -h - 14, 0, -h - 12); p.bezierCurveTo(40, -h - 14, w + 9, -h * 0.95, w + 3, -6);
    p.bezierCurveTo(w - 4, -60, 56, -92, 0, -95); p.bezierCurveTo(-56, -92, -w + 4, -60, -w - 3, -6);
    if (turn) { g.save(); g.translate(-9 * turn, 0); g.fill(p); g.restore(); }
    g.fill(p);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 26, -95 + Math.abs(i) * 4); g.quadraticCurveTo(i * 31, -h * 0.92, i * 27, -h - 6 + Math.abs(i) * 6); g.stroke(); } };
  const back = (g, { fw, fh }) => { g.fillStyle = col; g.beginPath(); g.ellipse(0, -6, 104 * fw, 124 * fh, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 28, -112); g.quadraticCurveTo(i * 24, -10, i * 10, 100); g.stroke(); } };
  return { hairFx: front, backFx: back };
};
// Escobar: short dark hair, clean-shaven, a long, calm face
CAST.escobar = head('buzz', [0.95, 1.08, 0.88], '#1A1410', { skin: SKIN_T, brow: '#16100C', ...fullHair('#1A1410') });
// the statue: the same figure in bronze (its colour is laid over the drawing, STATUE in part_props)
// drawn in greys, its bronze laid over it afterwards (statueScene): one metal from the hair to the boots
const SKIN_G = { base: '#A2A2A2', shade: '#8C8C8C', deep: '#707070', blush: '#A2A2A2', hi: '#B8B8B8' };
const BRONZE_K = { shirt: '#969696', shirtD: '#7C7C7C', trim: '#8A8A8A', num: null, shorts: '#8A8A8A', socks: '#929292', band: '#8C8C8C', boots: '#6A6A6A', badge: null };
CAST.bronze = head('buzz', [0.95, 1.08, 0.88], '#7A7A7A', { skin: SKIN_G, brow: '#6A6A6A', ...fullHair('#7A7A7A') });
CAST.col1 = head('buzz', [0.97, 1.05, 0.91], '#17110D', { skin: SKIN_M, brow: '#100C0A', ...fullHair('#17110D') });
CAST.col2 = head('buzz', [0.98, 1.04, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', ...fullHair('#120D0A') });
CAST.col3 = head('buzz', [0.96, 1.06, 0.9], '#2A1E16', { skin: SKIN_T, ...fullHair('#2A1E16') });
CAST.cordoba = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_M, brow: '#0E0A08', ...fullHair('#120D0A') });
CAST.usa1 = head('buzz', [0.97, 1.06, 0.91], '#5A3E28', { skin: SKIN_L, ...fullHair('#5A3E28') });
CAST.usa2 = head('buzz', [0.98, 1.05, 0.92], '#2A1E16', { skin: SKIN_L, ...fullHair('#2A1E16') });
CAST.gkarg = head('buzz', [0.98, 1.06, 0.92], '#2A1E16', { skin: SKIN_T, ...fullHair('#2A1E16') });
CAST.man1 = head('buzz', [0.97, 1.05, 0.91], '#1E1612', { skin: SKIN_T, ...fullHair('#1E1612') });
CAST.man2 = head('buzz', [0.98, 1.04, 0.92], '#120D0A', { skin: SKIN_M, brow: '#0E0A08', ...fullHair('#120D0A') });
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const ESCOBAR = mk('escobar', COL, 2, 1.86), STATUE_PL = mk('bronze', BRONZE_K, null, 1.86), CORDOBA = mk('cordoba', GK_COL, 1, 1.84);
const COLS = [mk('col1', COL, 4, 1.78), mk('col2', COL, 3, 1.8), mk('col3', COL, 14, 1.75), mk('col1', COL, 10, 1.75), mk('col2', COL, 11, 1.79), mk('col3', COL, 19, 1.76),
  mk('col1', COL, 9, 1.82), mk('col2', COL, 20, 1.77), mk('col3', COL, 6, 1.74)];
const USAS = [mk('usa1', USA, 6, 1.75), mk('usa2', USA, 9, 1.83), mk('usa1', USA, 22, 1.88), mk('usa2', USA, 11, 1.8), mk('usa1', USA, 8, 1.77)];
const HARKES = USAS[0], GK_A = mk('gkarg', ARG_GK, 1, 1.82);

// ---------- the stadiums: the Rose Bowl in the afternoon (a crowd in Colombian yellow, blue and red and American white,
// red and blue); the Monumental in Buenos Aires at night (sky blue and white); a stand in Medellín at night (green and
// white of Atlético Nacional, his club)
const FLAG_COL = g => { g.fillStyle = CYEL; g.fillRect(0, 0, 1, 0.5); g.fillStyle = CBLUE; g.fillRect(0, 0.5, 1, 0.25); g.fillStyle = CRED; g.fillRect(0, 0.75, 1, 0.25); };
const FLAG_USA = g => { for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#F4F4F2' : URED; g.fillRect(0, i / 7, 1, 1 / 7 + 0.01); } g.fillStyle = UNAVY; g.fillRect(0, 0, 0.42, 4 / 7); };
const FLAG_ARG = g => { g.fillStyle = CELESTE; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 1 / 3, 1, 1 / 3); g.fillStyle = '#E8B830'; g.beginPath(); g.arc(0.5, 0.5, 0.08, 0, 7); g.fill(); };
const FLAG_NAC = g => { g.fillStyle = VERDE; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 0.36, 1, 0.28); };
const CROWD_RB = [[CYEL, 24], ['#F4F2EC', 22], [CRED, 12], [UNAVY, 10], [CBLUE, 10], ['#3A3A40', 10], ['#E0A060', 8], ['#86B0DE', 4]];
const CROWD_AR = [[CELESTE, 30], ['#F2F0EA', 26], ['#2A3040', 22], ['#4A5266', 14], ['#E8B830', 4], ['#7A5A8E', 4]];
const CROWD_NC = [[VERDE, 32], ['#F2F0EA', 28], ['#2A3040', 20], ['#4A5266', 10], [CYEL, 6], [CRED, 4]];
const ARENA_RB = new Stadium({ seed: 94, density: 1, flags: 6, flagSet: [FLAG_COL, FLAG_USA], haze: '#B8C8D4', cloth: CROWD_RB, rc: 36 });
const ARENA_AR = new Stadium({ seed: 93, density: 1, flags: 6, flagSet: [FLAG_ARG], haze: '#3A4562', cloth: CROWD_AR, rc: 30 });
const ARENA_NC = new Stadium({ seed: 67, density: 1, flags: 8, flagSet: [FLAG_NAC, FLAG_COL], haze: '#3A4562', cloth: CROWD_NC, rc: 30 });
const BOARDS_RB = [boardDesign('PASADENA', { bg: CBLUE, ink: '#FFFFFF' }), boardDesign('22 JUNE 1994'), boardDesign('WORLD CUP 1994', { bg: URED, ink: '#FFFFFF' }), boardDesign('ROSE BOWL', { bg: UNAVY, ink: '#FFFFFF' })];
const BOARDS_AR = [boardDesign('BUENOS AIRES', { bg: '#1C2333', ink: '#FFFFFF' }), boardDesign('5 SEPTEMBER 1993'), boardDesign('WORLD CUP QUALIFIER', { bg: CELESTE, ink: '#14203A' })];
const BOARDS_NC = [boardDesign('MEDELLÍN', { bg: VERDE, ink: '#FFFFFF' }), boardDesign('ANDRÉS ESCOBAR · 2'), boardDesign('MEDELLÍN', { bg: '#1C2333', ink: '#FFFFFF' })];
const SKY_DAY = { zen: '#3E78BE', mid: '#86B2DE', hor: '#E4ECEC', clouds: 0.35, cloud: '#FFFFFF', seed: 11 };
const SKY_DUSK = { zen: '#2A4674', mid: '#6E88AE', hor: '#E8B088', clouds: 0.3, cloud: '#C0989A', seed: 5 };
const SKY_N = { zen: '#070B1A', mid: '#111B36', hor: '#2E3A5C', clouds: 0.12, cloud: '#2C3652', seed: 3 };
// the grass: plain mown stripes, no noise texture (the author asked for a smooth field, rule 71)
const TURF = { colors: ['#4A9C45', '#56A84E'], wear: 0, haze: '#9AB0B8', noise: false };
const TURF_N = { colors: ['#3A8A3D', '#449648'], wear: 0, haze: '#26324E', noise: false };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { arena = ARENA_RB, skyP = SKY_DAY, turf = TURF, cheer = 0, blur = 0, hit = null, hitSide = 1, boards = BOARDS_RB, goals = true, gt = t } = {}) {
  const back = c => { sky(c, B, { t, ...skyP }); arena.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...turf });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...(goals ? [...goalItems(B, -1, { t: gt, hit: hitSide < 0 ? hit : null }), ...goalItems(B, 1, { t: gt, hit: hitSide > 0 ? hit : null })] : []), ...(boards.length ? boardItems(B, boards) : []), ...items]);
}
const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

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
const LOST = { ...EXPR.sad, lid: 0.6, look: [0, 0.45], curve: -0.4 };
const GRAVE = { ...EXPR.focus, brow: 0.35, lid: 0.18, curve: -0.15 };
const CALM = { ...EXPR.neutral, lid: 0.2, curve: 0.12 };
const HURT = { ...EXPR.sad, lid: 1, brow: -0.85, browY: -4, curve: -0.5 };  // eyes shut
const STONE = { ...EXPR.neutral, lid: 0.32, curve: 0.08, look: [0, 0.05] };
// ---------- poses of this film
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };  // hands on hips
const HEADDOWN = { sh: [[0.14, 0.1], [0.14, 0.1]], el: [0.28, 0.28], look: -0.6, lean: 0.06 };
const KNEES = { hip: [[0.62, 0.12], [0.62, 0.12]], knee: [0.8, 0.8], sh: [[0.95, 0.12], [0.95, 0.12]], el: [0.12, 0.12], lean: 0.55, look: -0.15, crouch: 0.05 };  // bent over, hands on knees
// on his back on the grass, the knees up, one forearm over his eyes (as in the photograph of 22 June 1994). The legs are
// set in the world, the arms with the body (bike() of statpad)
// the raised knee: thigh 50° above the grass, the shin down to it (0.445 sin 50° = 0.43 cos 0.66), so the foot rests on the grass
const LIE = { hip: [[2.44, 0.16], [1.62, 0.06]], knee: [1.78, 0.1], sh: [[0.25, 1.05], [0.15, 1.2]], el: [0.45, 0.3], lean: -1.5, pelvisY: 0.12, ground: false, look: 0.2 };
// a low slide: the left leg straight out along the grass, the right thigh forward too with the shin folded back beside it
// (the stock slide knelt on the bent leg: the pelvis stayed 0.67 m up and the foot met the ball in the air)
const SLIDE = { ...POSE.slide(), hip: [[1.48, 0.1], [1.0, 0.45]], knee: [0.05, 2.6], toes: [0, 1.5], lean: -0.85, pelvisY: 0.22, look: 0.15 };  // the right shin flat along the grass behind, its foot pointed
// back along it (at a right angle it dug into the grass and held the body 0.43 m up)
// people: a man who stands, one who walks or jogs in a straight line
const man = (t, pl, x, z, hd, pose = {}, e = 'focus', ph = 0, extra = {}) => P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph, ...extra }));
const jog = (t, t0, pl, x0, z0, vx, vz, ph = 0, e = 'focus', over = null) => { const sp = Math.hypot(vx, vz), st = clamp(1.15 + 0.3 * sp, 1.3, 3.6), d = sp * (t - t0), r = POSE.run(2 * PI * d / st + ph, clamp(sp / 6.5, 0.25, 1), 0);
  return P(pl, { x: x0 + vx * (t - t0), z: z0 + vz * (t - t0), head: Math.atan2(vz, vx), pose: over ? { ...r, ...over } : r, e, t: t + ph }); };
const hopper = (t, pl, x, z, hd, ph, { amp = 0.14, e = JOY, rate = 6.5 } = {}) => { const a = Math.abs(Math.sin(t * rate + ph)), bend = 0.2 + 0.55 * (1 - a);
  return P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), sh: [[2.7, 1.05], [2.7, 1.05]], el: [0.05, 0.05], hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend], lift: amp * a }, e, t: t + ph })); };

// ---------- pictures drawn flat on the screen
function photoIn(g, img, x, y, w, h, { z = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * z, sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, x, y, w, h); g.restore();
}
const ink = (g, txt, x, y, font, fill, lw = 16, stroke = '#0E1018') => { g.font = font; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); };
const rrect = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
function title2(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FF4B3A', s1 = 96, s2 = 132, a = 1, k = 1 } = {}) {  // a small line over a heavy one
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, 0, 0); g.fillStyle = c1; g.fillText(l1, 0, 0);
  g.font = sans(s2, 900); g.strokeText(l2, 0, s2 * 1.02); g.fillStyle = c2; g.fillText(l2, 0, s2 * 1.02);
  g.restore();
  qaRect(g, 40, y - s1 * 0.8, W - 80, s1 * 0.8 + s2 * 1.1, 'text', 'title');
}
// the score in a corner; m: what the box beside it says ('' for none)
function scoreBug(g, L, R, a, b, m, { x = 40, y = 76, al = 1, colL = UNAVY, colR = CYEL, pop = 0 } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54, my = y + hh / 2 + 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = colL; g.fillRect(x, y, 14, hh); g.fillStyle = colR; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(L, x + 26, my); g.fillText(R, x + w - 104, my);
  g.textAlign = 'center'; g.save(); g.translate(x + w / 2, my); g.scale(1 + 0.35 * pop, 1 + 0.35 * pop); g.fillText(`${a} – ${b}`, 0, 0); g.restore();
  if (m) { g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 74, my); }
  qaRect(g, x, y, w + (m ? 140 : 0), hh, 'text', 'score bug');
  g.restore();
}
// the colour drains out of the picture (k: 0..1), a cold shadow comes in. Drawn after the grade
function sadPost(g, k) {
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${Math.min(1, k).toFixed(3)})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(60,90,140,${(0.4 * k).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore();
}
// a tear-off calendar from 22 June to 2 July 1994: k = how many pages have gone (0..10, fractions mid-flip)
const PAGES = [...[22, 23, 24, 25, 26, 27, 28, 29, 30].map(d => [d, 'JUNE']), [1, 'JULY'], [2, 'JULY']];
function calPage(g, x, y, w, h, [d, m], { dark = 0 } = {}) {
  g.fillStyle = '#F6F3EC'; g.fillRect(x, y, w, h);
  g.fillStyle = mix(CRED, '#3A3A40', dark); g.fillRect(x, y, w, h * 0.22);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = sans(Math.round(h * 0.11), 900); g.letterSpacing = '8px'; g.fillStyle = '#FFFFFF'; g.fillText(m, x + w / 2 + 4, y + h * 0.115); g.letterSpacing = '0px';
  g.font = sans(Math.round(h * 0.5), 900); g.fillStyle = mix('#1A1C22', CRED, dark * 0.0); g.fillText(String(d), x + w / 2, y + h * 0.56);
  g.font = sans(Math.round(h * 0.075), 800); g.letterSpacing = '6px'; g.fillStyle = '#6A6E78'; g.fillText('1994', x + w / 2 + 3, y + h * 0.88); g.letterSpacing = '0px';
}
function calendar(g, cx, cy, w, k, { a = 1, rot = 0 } = {}) {
  if (a <= 0) return;
  const h = w * 1.12, x = -w / 2, y = -h / 2, i = Math.min(PAGES.length - 1, Math.floor(k)), f = k - Math.floor(k);
  g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 50; g.shadowOffsetY = 24;
  g.fillStyle = '#D8D3C8'; g.fillRect(x + 6, y + 14, w - 12, h);  // the edge of the pad below
  g.shadowColor = 'transparent';
  calPage(g, x, y, w, h, PAGES[Math.min(PAGES.length - 1, i + (f > 0 ? 1 : 0))], { dark: i + (f > 0 ? 1 : 0) >= PAGES.length - 1 ? 1 : 0 });
  if (f > 0 && i < PAGES.length - 1) {  // the page being torn off: it folds up over the binding and flies away
    const u = Math.min(1, f / 0.7), c = Math.cos(PI / 2 * u);
    if (c > 0.02) { g.save(); g.translate(0, y); g.scale(1, c); g.translate(0, -y); calPage(g, x, y, w, h, PAGES[i]);
      g.fillStyle = `rgba(20,16,10,${(0.45 * u).toFixed(3)})`; g.fillRect(x, y, w, h); g.restore(); }
  }
  g.fillStyle = '#26282E'; g.fillRect(x - 10, y - 34, w + 20, 44);  // the binding
  g.fillStyle = '#8A8E96'; for (let r = 0; r < 6; r++) { g.beginPath(); g.arc(x + w * (r + 0.5) / 6, y - 12, 9, 0, 2 * PI); g.fill(); }
  g.restore();
  qaRect(g, cx - w / 2 - 10, cy - h / 2 - 34, w + 20, h + 50, 'text', 'calendar');
}
// the table of Group A once it was over: Romania 6, Switzerland 4, USA 4, Colombia 3 (Wikipedia, 1994 FIFA World Cup Group A)
const GROUP_A = [['ROMANIA', 6, ['#1E3F8A', '#F2C811', '#C8202C']], ['SWITZERLAND', 4, ['#D52B1E']], ['USA', 4, [UNAVY, '#F4F4F2', URED]], ['COLOMBIA', 3, [CYEL, CBLUE, CRED]]];
function groupTable(g, x, y, u, { strike = 0 } = {}) {
  if (u <= 0) return;
  const w = W - 2 * x, rh = 92, h = 96 + rh * 4 + 20, e = ease.out(clamp(u));
  g.save(); g.globalAlpha *= clamp(u * 2); g.translate(0, (1 - e) * 60);
  g.fillStyle = 'rgba(0,0,0,0.35)'; rrect(g, x + 8, y + 12, w, h, 26); g.fill();
  g.fillStyle = 'rgba(12,16,30,0.88)'; rrect(g, x, y, w, h, 26); g.fill();
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = sans(34, 900); g.letterSpacing = '4px'; g.fillStyle = GOLD; g.fillText('GROUP A · FINAL TABLE', x + 36, y + 52);
  g.textAlign = 'right'; g.fillStyle = 'rgba(242,238,230,0.6)'; g.font = sans(26, 800); g.fillText('PTS', x + w - 36, y + 52); g.letterSpacing = '0px';
  GROUP_A.forEach(([name, pts, cols], i) => {
    const ry = y + 96 + i * rh, col = i === 3;
    if (col) { g.fillStyle = rgba(CRED, 0.28 + 0.2 * strike); g.fillRect(x + 14, ry + 6, w - 28, rh - 12); }
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 24, ry + rh - 2, w - 48, 2);
    g.textAlign = 'left'; g.font = sans(34, 900); g.fillStyle = 'rgba(242,238,230,0.55)'; g.fillText(String(i + 1), x + 40, ry + rh / 2 + 2);
    cols.forEach((c, k) => { g.fillStyle = c; g.fillRect(x + 92, ry + rh / 2 - 22 + k * 44 / cols.length, 64, 44 / cols.length + 0.5); });
    g.font = sans(44, 900); g.fillStyle = '#F4F2EC'; g.fillText(name, x + 180, ry + rh / 2 + 3);
    g.textAlign = 'right'; g.fillText(String(pts), x + w - 40, ry + rh / 2 + 3);
    if (col && strike > 0) { g.strokeStyle = CRED; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 172, ry + rh / 2 + 2); g.lineTo(x + 172 + (w - 240) * ease.out(clamp(strike)), ry + rh / 2 + 2); g.stroke(); }
  });
  g.restore();
  qaRect(g, x, y, w, h, 'text', 'group table');
}
// ---------- the newspaper: a page with no masthead in the picture, the column's last line in Spanish, picked out in yellow
// as the narration says it. hi: 0..1 the highlighter sweeping across
const NEWS = makeCanvas(1400, 1800);
{ const n = NEWS.getContext('2d'), r = rng(1994); n.fillStyle = '#ECE5D2'; n.fillRect(0, 0, 1400, 1800);
  for (let i = 0; i < 2600; i++) { n.fillStyle = `rgba(90,70,40,${(0.02 + r() * 0.04).toFixed(3)})`; n.fillRect(r() * 1400, r() * 1800, 2 + r() * 4, 2 + r() * 4); }  // the grain of old paper
  n.fillStyle = 'rgba(26,22,18,0.85)'; n.fillRect(60, 60, 1280, 6);
  n.fillStyle = 'rgba(26,22,18,0.28)';
  const col = (x0, w, y0, y1) => { for (let y = y0; y < y1; y += 30) n.fillRect(x0, y, w - ((y * 7) % 5) * 22, 11); };
  col(60, 400, 120, 1740); col(500, 400, 120, 560); col(500, 400, 1240, 1740); col(940, 400, 120, 1740);
  n.fillStyle = 'rgba(26,22,18,0.75)'; n.fillRect(500, 600, 400, 5); n.fillRect(500, 1190, 400, 5); }
function newsPage(g, cx, cy, s, rot, hi) {
  const w = 1400 * s, h = 1800 * s;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.translate(-w / 2, -h / 2);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 60 * s; g.shadowOffsetY = 30 * s; g.drawImage(NEWS, 0, 0, w, h); g.shadowColor = 'transparent';
  g.scale(s, s);
  // the pull-quote in the middle column
  const lines = ['«Hasta pronto,', 'porque la vida', 'no termina aquí»'];
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  lines.forEach((L, i) => { const y = 700 + i * 150, u = clamp(hi * 3 - i);
    if (u > 0) { g.fillStyle = 'rgba(255,214,60,0.72)'; g.font = serif(96, 700); const tw = g.measureText(L).width; g.fillRect(508, y - 84, tw * ease.inOut(u) + 8, 104); }
    g.fillStyle = '#16120E'; g.font = serif(96, 700); g.fillText(L, 512, y); });
  g.font = sans(36, 900); g.letterSpacing = '6px'; g.fillStyle = '#16120E'; g.fillText('ANDRÉS ESCOBAR', 512, 1150); g.letterSpacing = '0px';
  g.restore();
}
// a wooden table under a lamp
function tableTop(g, t) {
  const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#3A2414'); gr.addColorStop(1, '#22140A'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; for (let i = -10; i < 40; i++) { g.beginPath(); g.moveTo(i * 70, 0); g.bezierCurveTo(i * 70 + 40, H * 0.3, i * 70 - 30, H * 0.7, i * 70 + 20, H); g.stroke(); }
}
// ---------- Medellín at night: a city filling a valley, its lights climbing the slopes on both sides (drawn from its general
// look, not one view). Back to front: the far range, the valley floor and its towers, the two near slopes. cam: {x, z} a
// sideways drift and a zoom; the near layers move more
const GLOWS = ['#FFB45A', '#FFE2B0', '#BFD8FF'].map(col => { const c = makeCanvas(32, 32), x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.22, rgba(col, 0.6)); gr.addColorStop(1, rgba(col, 0)); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return c; });
const VALLEY = (() => { const r = rng(1967);
  const bump = (x, a, b) => 0.018 * Math.sin(x * a) + 0.01 * Math.sin(x * b + 1.3);
  const far = x => 0.40 + bump(x, 9.1, 23.7) - 0.03 * Math.cos(x * 2.4);
  const slopeL = x => 0.27 + 0.42 * clamp((x + 0.3) / 0.75) + bump(x, 13.3, 31.1);   // falls from the left edge to the floor
  const slopeR = x => 0.27 + 0.42 * clamp((1.3 - x) / 0.75) + bump(x, 11.7, 27.9);
  const pick = () => { const u = r(); return u < 0.7 ? 0 : u < 0.92 ? 1 : 2; };
  const lights = [];
  // the valley floor: streets of light, finer toward the far end
  for (let i = 0; i < 2600; i++) { const y = 0.47 + Math.pow(r(), 1.6) * 0.55, x = 0.5 + (r() - 0.5) * (0.5 + (y - 0.47) * 3.2); lights.push({ L: 1, x, y, s: 0.6 + (y - 0.47) * 6 + r() * 0.8, k: pick(), ph: r() * 9 }); }
  for (let i = 0; i < 260; i++) { const x = r() * 1.6 - 0.3, y = far(x) + 0.004 + r() * 0.06; lights.push({ L: 0, x, y, s: 0.5 + r() * 0.5, k: pick(), ph: r() * 9 }); }
  // the slopes: the houses climb them, thinner toward the top
  for (const [L, f, x0, x1] of [[3, slopeL, -0.3, 0.48], [4, slopeR, 0.52, 1.3]]) for (let i = 0; i < 1500; i++) {
    const x = x0 + r() * (x1 - x0), top = f(x), y = top + 0.008 + Math.pow(r(), 1.3) * (1.05 - top); if (r() > 0.25 + 0.75 * (y - top) / 0.25) continue;
    lights.push({ L, x, y, s: 1.0 + (y - 0.3) * 4 + r() * 1.2, k: pick(), ph: r() * 9 }); }
  const towers = Array.from({ length: 12 }, () => { const x = 0.38 + r() * 0.24; return { x, w: 0.009 + r() * 0.012, h: 0.03 + r() * 0.075 * (1 - Math.abs(x - 0.5) * 3), ph: r() * 9 }; });
  const stars = Array.from({ length: 160 }, () => ({ x: r(), y: r() * 0.36, s: 0.6 + r() * 1.6, ph: r() * 9 }));
  return { far, slopeL, slopeR, lights, towers, stars }; })();
function valley(g, t, { x = 0, z = 1 } = {}) {
  const V = VALLEY, PAR = [0.08, 0.25, 0.3, 0.75, 0.75];
  const sk = g.createLinearGradient(0, 0, 0, H * 0.6); sk.addColorStop(0, '#04071A'); sk.addColorStop(0.55, '#0E1838'); sk.addColorStop(1, '#3A2E3E'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  for (const s of V.stars) { g.fillStyle = `rgba(230,236,255,${(0.35 + 0.3 * Math.sin(t * 2 + s.ph)).toFixed(3)})`; g.fillRect((s.x - x * 0.02) * W, s.y * H, s.s, s.s); }
  const view = (d, fn) => { const zz = Math.pow(z, 0.5 + d), sx = -x * (30 + 260 * d); g.save(); g.translate(W / 2 + sx, H * 0.56); g.scale(zz, zz); g.translate(-W / 2, -H * 0.56); fn(); g.restore(); };
  const shape = (f, x0, x1, n = 60) => { const p = new Path2D(); p.moveTo(x0 * W, H * 1.3); for (let i = 0; i <= n; i++) { const xx = x0 + (x1 - x0) * i / n; p.lineTo(xx * W, f(xx) * H); } p.lineTo(x1 * W, H * 1.3); p.closePath(); return p; };
  const lightsOf = L => { g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of V.lights) { if (p.L !== L) continue; const tw = 0.8 + 0.2 * Math.sin(t * 3 + p.ph), r = p.s * 2.4;
      g.globalAlpha = tw; g.drawImage(GLOWS[p.k], p.x * W - r, p.y * H - r, 2 * r, 2 * r); }
    g.restore(); };
  // the far range, the glow of the city on the haze above the valley
  view(PAR[0], () => { const halo = g.createRadialGradient(W / 2, H * 0.5, 20, W / 2, H * 0.5, W * 0.9); halo.addColorStop(0, 'rgba(255,150,80,0.28)'); halo.addColorStop(1, 'rgba(255,150,80,0)');
    g.fillStyle = halo; g.fillRect(-W, 0, 3 * W, H); g.fillStyle = '#121830'; g.fill(shape(V.far, -0.4, 1.4)); lightsOf(0); });
  // the valley floor and its towers
  view(PAR[1], () => { const hz = g.createLinearGradient(0, H * 0.43, 0, H * 0.8); hz.addColorStop(0, 'rgba(255,160,90,0)'); hz.addColorStop(0.3, 'rgba(255,160,90,0.18)'); hz.addColorStop(1, 'rgba(255,160,90,0.03)');
    g.fillStyle = hz; g.fillRect(-W, H * 0.43, 3 * W, H * 0.7); lightsOf(1);
    for (const tw of V.towers) { const bx = tw.x * W, bw = tw.w * W, bh = tw.h * H, by = H * 0.53;
      g.fillStyle = '#0A0E1C'; g.fillRect(bx, by - bh, bw, bh + 30);
      for (let wy = by - bh + 6; wy < by + 20; wy += 11) for (let wx = bx + 3; wx < bx + bw - 3; wx += 8) if (Math.sin(wx * 12.9 + wy * 7.7 + tw.ph) > 0.3) { g.fillStyle = 'rgba(255,214,150,0.8)'; g.fillRect(wx, wy, 3.5, 5); } } });
  // the two slopes, near
  view(PAR[3], () => { g.fillStyle = '#0A0D1A'; g.fill(shape(V.slopeL, -0.6, 0.5)); lightsOf(3); g.fillStyle = '#0A0D1A'; g.fill(shape(V.slopeR, 0.5, 1.6)); lightsOf(4); });
}
// ---------- the car park on a night street (no people: the brief, SOURCES.md). A world of its own at x = 500: asphalt, the
// bays, a wall with a dim strip of coloured light, one parked car, a street lamp and its pool of light
const PX = 500;
const poly = (g, pts, fill) => { if (B.poly(g, pts)) { g.fillStyle = fill; g.fill(); } };
const STARS = Array.from({ length: 220 }, (_, i) => { const r = rng(400 + i), a = r() * 2 * PI, e = 0.12 + r() * 1.3; return { d: [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)], s: 0.8 + r() * 1.8, ph: r() * 9 }; });
function starField(g, t, a = 1) {
  const E = B.E;
  for (const s of STARS) { const p = B.project(E[0] + s.d[0] * 900, E[1] + s.d[1] * 900, E[2] + s.d[2] * 900); if (p.z < 1 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
    g.fillStyle = `rgba(232,238,255,${(a * (0.45 + 0.35 * Math.sin(t * 2.2 + s.ph))).toFixed(3)})`; g.fillRect(p.x, p.y, s.s, s.s); }
}
function carPark(g, t) {
  sky(g, B, { t, ...SKY_N, clouds: 0 }); starField(g, t);
  // the city beyond the wall: dark roofs and a few lit windows
  const r = rng(77);
  for (let i = 0; i < 14; i++) { const x0 = PX - 40 + i * 7, h = 8 + r() * 16; poly(g, [[x0, 0, 30], [x0 + 6.4, 0, 30], [x0 + 6.4, h, 30], [x0, h, 30]], '#0B0F1C');
    for (let k = 0; k < 6; k++) { const wx = x0 + 0.8 + r() * 4.8, wy = 2 + r() * (h - 3); if (r() < 0.5) poly(g, [[wx, wy, 29.9], [wx + 0.7, wy, 29.9], [wx + 0.7, wy + 0.9, 29.9], [wx, wy + 0.9, 29.9]], r() < 0.7 ? 'rgba(255,200,120,0.6)' : 'rgba(170,200,255,0.5)'); } }
  poly(g, [[PX - 60, 0, -20], [PX + 60, 0, -20], [PX + 60, 0, 30], [PX - 60, 0, 30]], '#1A1C22');  // the asphalt
  // the lamp's pool of light on the ground
  const Lp = B.project(PX + 3, 0, 8), Lr = B.project(PX + 3 + 7, 0, 8);
  if (Lp.z > 0.2) { const rad = Math.abs(Lr.x - Lp.x) + 40, gr = g.createRadialGradient(Lp.x, Lp.y, 0, Lp.x, Lp.y, rad); gr.addColorStop(0, 'rgba(255,190,110,0.42)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
    g.save(); g.translate(Lp.x, Lp.y); g.scale(1, 0.42); g.translate(-Lp.x, -Lp.y); g.fillStyle = gr; g.beginPath(); g.arc(Lp.x, Lp.y, rad, 0, 2 * PI); g.fill(); g.restore(); }
  for (let i = -5; i <= 5; i++) poly(g, [[PX + i * 2.6 - 0.06, 0.01, 9], [PX + i * 2.6 + 0.06, 0.01, 9], [PX + i * 2.6 + 0.06, 0.01, 14], [PX + i * 2.6 - 0.06, 0.01, 14]], 'rgba(220,214,190,0.38)');  // the bays
  poly(g, [[PX - 16, 0.01, 8.94], [PX + 16, 0.01, 8.94], [PX + 16, 0.01, 9.06], [PX - 16, 0.01, 9.06]], 'rgba(220,214,190,0.3)');
  // the wall at the back with a dim strip of light along its top
  poly(g, [[PX - 30, 0, 16], [PX + 30, 0, 16], [PX + 30, 3.4, 16], [PX - 30, 3.4, 16]], '#23232C');
  poly(g, [[PX - 30, 3.0, 15.95], [PX + 30, 3.0, 15.95], [PX + 30, 3.12, 15.95], [PX - 30, 3.12, 15.95]], `rgba(255,70,120,${(0.55 + 0.08 * Math.sin(t * 1.7)).toFixed(3)})`);
  // one parked car, dark, its roof catching the lamp
  const cx = PX - 4.2, cz = 11.4;
  poly(g, [[cx - 2.2, 0.25, cz - 0.9], [cx + 2.2, 0.25, cz - 0.9], [cx + 2.2, 0.95, cz - 0.9], [cx - 2.2, 0.95, cz - 0.9]], '#2A303C');
  poly(g, [[cx - 2.2, 0.95, cz - 0.9], [cx + 2.2, 0.95, cz - 0.9], [cx + 2.2, 0.95, cz + 0.9], [cx - 2.2, 0.95, cz + 0.9]], '#3A4250');
  poly(g, [[cx - 1.1, 0.95, cz - 0.8], [cx + 1.0, 0.95, cz - 0.8], [cx + 0.7, 1.45, cz - 0.7], [cx - 0.8, 1.45, cz - 0.7]], '#1A2030');
  poly(g, [[cx - 0.8, 1.45, cz - 0.7], [cx + 0.7, 1.45, cz - 0.7], [cx + 0.7, 1.45, cz + 0.7], [cx - 0.8, 1.45, cz + 0.7]], '#4A5262');
  for (const wx of [cx - 1.4, cx + 1.4]) { const p = B.project(wx, 0.3, cz - 0.92); if (p.z > 0.2) { g.fillStyle = '#0C0D10'; g.beginPath(); g.ellipse(p.x, p.y, 0.32 * p.s, 0.3 * p.s, 0, 0, 2 * PI); g.fill(); } }
  // the street lamp: a pole and its head, the light round it
  poly(g, [[PX + 3 - 0.07, 0, 8], [PX + 3 + 0.07, 0, 8], [PX + 3 + 0.07, 6.2, 8], [PX + 3 - 0.07, 6.2, 8]], '#3A3E46');
  poly(g, [[PX + 3 - 0.07, 6.1, 8], [PX + 1.6, 6.3, 8], [PX + 1.6, 6.4, 8], [PX + 3 - 0.07, 6.22, 8]], '#3A3E46');
  const hp = B.project(PX + 1.7, 6.2, 8);
  if (hp.z > 0.2) { const gl = g.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 2.2 * hp.s); gl.addColorStop(0, 'rgba(255,214,150,0.95)'); gl.addColorStop(0.08, 'rgba(255,190,110,0.6)'); gl.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(hp.x, hp.y, 2.2 * hp.s, 0, 2 * PI); g.fill();
    const base = B.project(PX + 1.7, 0, 8), cone = g.createLinearGradient(hp.x, hp.y, base.x, base.y); cone.addColorStop(0, 'rgba(255,200,130,0.16)'); cone.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(hp.x - 0.2 * hp.s, hp.y); g.lineTo(hp.x + 0.2 * hp.s, hp.y); g.lineTo(base.x + 3.4 * base.s, base.y); g.lineTo(base.x - 3.4 * base.s, base.y); g.closePath(); g.fill(); }
}
// ---------- the funeral: a street full of people as far as the eye goes, white handkerchiefs and flags (a world at x = -800)
const FX = -800;
const MOURNERS = (() => { const r = rng(7212), out = [];
  for (let i = 0; i < 3400; i++) { const x = FX - 3 - Math.pow(r(), 1.15) * 150, z = (r() - 0.5) * 17.5;
    out.push({ x, z, c: ['#F2F0EA', '#2E3138', '#F2F0EA', '#4A5262', CYEL, '#E8E4DA', '#3A3E48', CBLUE][Math.floor(r() * 8)], hair: r() < 0.8 ? '#1A1410' : '#4A3A2A', skin: [SKIN_T.base, SKIN_M.base, SKIN_L.base, SKIN_D.base][Math.floor(r() * 4)], face: r() < 0.45, h: 1.6 + r() * 0.25, wave: r() < 0.14 ? 1 : 0, flag: r() < 0.012, ph: r() * 9 }); }
  return out.sort((a, b) => a.x - b.x); })();
function funeral(g, t, { wave = 1 } = {}) {
  sky(g, B, { t, zen: '#7E8A98', mid: '#A8B2BC', hor: '#CDD2D4', clouds: 0.85, cloud: '#E2E5E6', seed: 8 });
  poly(g, [[FX - 200, 0, -12], [FX + 30, 0, -12], [FX + 30, 0, 12], [FX - 200, 0, 12]], '#6A6A66');
  // the buildings along both sides
  const r = rng(31);
  for (const sd of [-1, 1]) for (let i = 0; i < 26; i++) { const x0 = FX + 20 - i * 9, h = 9 + r() * 14, zf = sd * 9.5, wall = mix('#C8BCA8', '#8A8478', r());
    poly(g, [[x0, 0, zf], [x0 - 8.6, 0, zf], [x0 - 8.6, h, zf], [x0, h, zf]], wall);
    for (let fy = 3; fy < h - 1; fy += 3.2) for (let fx = 1; fx < 8; fx += 2.4) poly(g, [[x0 - fx, fy, zf - sd * 0.02], [x0 - fx - 1.1, fy, zf - sd * 0.02], [x0 - fx - 1.1, fy + 1.6, zf - sd * 0.02], [x0 - fx, fy + 1.6, zf - sd * 0.02]], 'rgba(40,44,54,0.55)'); }
  const E = B.E;
  for (const m of MOURNERS) {
    const p = B.project(m.x, m.h * 0.55, m.z); if (p.z < 0.5 || p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 80) continue;
    const s = p.s, sh = B.project(m.x, m.h - 0.27, m.z), ft = B.project(m.x, 0.25, m.z), hd = B.project(m.x, m.h - 0.11, m.z), r0 = 0.115 * s;
    const top = sh.y, bot = Math.max(top + 0.12 * s, ft.y), hw = 0.24 * s, bw2 = 0.19 * s;  // shoulders down to the knees, narrowing
    g.fillStyle = m.c; g.beginPath(); g.moveTo(p.x - hw, top + 0.06 * s); g.quadraticCurveTo(p.x - hw, top - 0.02 * s, p.x - hw + 0.08 * s, top - 0.03 * s);
    g.lineTo(p.x + hw - 0.08 * s, top - 0.03 * s); g.quadraticCurveTo(p.x + hw, top - 0.02 * s, p.x + hw, top + 0.06 * s); g.lineTo(p.x + bw2, bot); g.lineTo(p.x - bw2, bot); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(p.x + hw * 0.35, top, hw * 0.65, bot - top);
    if (m.face) { g.fillStyle = m.skin; g.beginPath(); g.arc(hd.x, hd.y, r0, 0, 2 * PI); g.fill();
      g.fillStyle = m.hair; g.beginPath(); g.arc(hd.x, hd.y, r0 * 1.04, PI * 1.02, PI * 1.98); g.quadraticCurveTo(hd.x, hd.y - r0 * 0.15, hd.x - r0 * 1.04, hd.y); g.fill(); }
    else { g.fillStyle = m.hair; g.beginPath(); g.arc(hd.x, hd.y, r0 * 1.04, 0, 2 * PI); g.fill(); }
    if (m.wave && wave > 0) {  // a white handkerchief held up, waving
      const sw = Math.sin(t * 3.2 + m.ph) * 0.12, a = B.project(m.x + sw * 0.5, m.h + 0.45, m.z), b0 = B.project(m.x, m.h - 0.05, m.z);
      g.strokeStyle = mix(m.c, '#000000', 0.2); g.lineWidth = Math.max(1, 0.07 * s); g.beginPath(); g.moveTo(b0.x + 0.18 * s, b0.y); g.lineTo(a.x + 0.1 * s, a.y); g.stroke();
      g.fillStyle = '#FBFAF6'; g.beginPath(); g.moveTo(a.x + 0.1 * s, a.y); g.quadraticCurveTo(a.x + 0.35 * s, a.y - 0.08 * s + sw * s, a.x + 0.42 * s, a.y + 0.2 * s); g.lineTo(a.x + 0.12 * s, a.y + 0.24 * s); g.closePath(); g.fill(); }
    if (m.flag) {  // a Colombian flag on a pole
      const top = B.project(m.x, m.h + 1.6, m.z), bt = B.project(m.x, m.h, m.z); g.strokeStyle = '#3A3530'; g.lineWidth = Math.max(1, 0.04 * s); g.beginPath(); g.moveTo(bt.x, bt.y); g.lineTo(top.x, top.y); g.stroke();
      const fw = 1.1 * s, fh = 0.72 * s, wv = Math.sin(t * 2.6 + m.ph) * 0.12 * s;
      g.save(); g.translate(top.x, top.y); g.transform(1, wv / fw, 0, 1, 0, 0); g.scale(fw, fh); FLAG_COL(g); g.restore(); }
  }
}
// ---------- the statue: the figure in bronze on a stone plinth, flowers and candles round its foot (a world at x = 900).
// Drawn whole on its own canvas, then the bronze laid over it (its colour over the drawing's light and shade)
const SX = 900, PLH = 1.25;
const ST = makeCanvas(), stx = ST.getContext('2d'), ST2 = makeCanvas(), st2 = ST2.getContext('2d');
const PLAQUE = makeCanvas(600, 220);
{ const p = PLAQUE.getContext('2d'); const gr = p.createLinearGradient(0, 0, 0, 220); gr.addColorStop(0, '#B08A4E'); gr.addColorStop(1, '#7A5A2C'); p.fillStyle = gr; p.fillRect(0, 0, 600, 220);
  p.strokeStyle = '#5A4020'; p.lineWidth = 10; p.strokeRect(8, 8, 584, 204); p.fillStyle = '#3A2810'; p.textAlign = 'center'; p.textBaseline = 'middle';
  p.font = '900 70px Rubik'; p.fillText('ANDRÉS', 300, 78); p.fillText('ESCOBAR', 300, 154); }
const quadImg = (g, img, tl, tr, bl) => { const a = B.project(...tl), b = B.project(...tr), c = B.project(...bl); if (a.z < 0.2 || b.z < 0.2 || c.z < 0.2) return;
  g.save(); g.transform((b.x - a.x) / img.width, (b.y - a.y) / img.width, (c.x - a.x) / img.height, (c.y - a.y) / img.height, a.x, a.y); g.drawImage(img, 0, 0); g.restore(); };
const BLOOMS = Array.from({ length: 140 }, (_, i) => { const r = rng(300 + i), a = r() * 2 * PI, d = 0.66 + Math.pow(r(), 2) * 0.45; return { x: SX + Math.cos(a) * d, z: Math.sin(a) * d, c: [CRED, CYEL, '#F4F2EC', '#E86A9A', '#F29A2E', CRED][Math.floor(r() * 6)], s: 0.028 + r() * 0.026 }; });
function plinth(g) {
  const E = B.E, w = 0.55, s = [[SX - w, 0, -w], [SX + w, 0, -w], [SX + w, 0, w], [SX - w, 0, w]];
  const faces = [[0, 1, '#9A968E'], [1, 2, '#B6B2A8'], [2, 3, '#8A867E'], [3, 0, '#A8A49A']];
  for (const [i, j, c] of faces) { const a = s[i], b = s[j], mid = [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], n = [mid[0] - SX, 0, mid[2]];
    if ((E[0] - mid[0]) * n[0] + (E[2] - mid[2]) * n[2] <= 0) continue;
    poly(g, [[a[0], 0, a[2]], [b[0], 0, b[2]], [b[0], PLH, b[2]], [a[0], PLH, a[2]]], c);
    if (i === 3) quadImg(g, PLAQUE, [SX - w - 0.01, 0.98, 0.36], [SX - w - 0.01, 0.98, -0.36], [SX - w - 0.01, 0.72, 0.36]); }
  poly(g, s.map(p => [p[0], PLH, p[2]]), '#C8C4BA');
}
function statueScene(g, t, figure) {
  sky(g, B, { t, ...SKY_DUSK });
  poly(g, [[SX - 60, 0, -60], [SX + 60, 0, -60], [SX + 60, 0, 60], [SX - 60, 0, 60]], '#8E8A80');
  // trees round the square
  for (let i = 0; i < 18; i++) { const a = i / 18 * 2 * PI, tx = SX + Math.cos(a) * 14, tz = Math.sin(a) * 14, tr = B.project(tx, 0, tz), tp = B.project(tx, 4.2, tz);
    if (tr.z < 0.5) continue; g.fillStyle = '#4A3A2A'; g.fillRect(tr.x - 0.15 * tr.s, tp.y, 0.3 * tr.s, tr.y - tp.y);
    g.fillStyle = i % 2 ? '#3E5A34' : '#4A6A3A'; g.beginPath(); g.arc(tp.x, tp.y, 2.1 * tp.s, 0, 2 * PI); g.fill(); }
  plinth(g);
  // the figure in bronze
  stx.setTransform(1, 0, 0, 1, 0, 0); stx.clearRect(0, 0, W, H); drawSorted(stx, figure);
  st2.setTransform(1, 0, 0, 1, 0, 0); st2.globalCompositeOperation = 'source-over'; st2.clearRect(0, 0, W, H); st2.drawImage(ST, 0, 0);
  st2.globalCompositeOperation = 'color'; st2.fillStyle = '#8A5E2A'; st2.fillRect(0, 0, W, H);
  st2.globalCompositeOperation = 'multiply'; st2.fillStyle = '#A27A4E'; st2.fillRect(0, 0, W, H);
  { const top = B.project(SX, PLH + 2.0, 0), bot = B.project(SX, PLH, 0), sh = st2.createLinearGradient(top.x - 0.6 * top.s, top.y, bot.x + 0.4 * bot.s, bot.y);
    sh.addColorStop(0, 'rgba(255,236,190,0.55)'); sh.addColorStop(0.5, 'rgba(128,128,128,0)'); sh.addColorStop(1, 'rgba(20,12,4,0.5)'); st2.globalCompositeOperation = 'soft-light'; st2.fillStyle = sh; st2.fillRect(0, 0, W, H); }
  st2.globalCompositeOperation = 'destination-in'; st2.drawImage(ST, 0, 0); st2.globalCompositeOperation = 'source-over';
  g.drawImage(ST2, 0, 0);
  // flowers and candles at the foot
  for (const f of BLOOMS) { const p = B.project(f.x, f.s, f.z); if (p.z < 0.3) continue; g.fillStyle = '#3E6A34'; g.beginPath(); g.ellipse(p.x + 0.6 * f.s * p.s, p.y + 0.3 * f.s * p.s, f.s * p.s, 0.5 * f.s * p.s, 0.4, 0, 2 * PI); g.fill();
    g.fillStyle = f.c; g.beginPath(); g.arc(p.x, p.y, f.s * p.s, 0, 2 * PI); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(p.x - 0.3 * f.s * p.s, p.y - 0.3 * f.s * p.s, 0.4 * f.s * p.s, 0, 2 * PI); g.fill(); }
  for (let i = 0; i < 5; i++) { const a = 2.4 + i * 0.3, p = B.project(SX + Math.cos(a) * 0.72, 0.12, Math.sin(a) * 0.72); if (p.z < 0.3) continue;
    g.fillStyle = '#F2EEE2'; g.fillRect(p.x - 0.03 * p.s, p.y - 0.12 * p.s, 0.06 * p.s, 0.14 * p.s);
    const fl = g.createRadialGradient(p.x, p.y - 0.17 * p.s, 0, p.x, p.y - 0.17 * p.s, 0.14 * p.s); fl.addColorStop(0, 'rgba(255,220,140,0.95)'); fl.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = fl; g.beginPath(); g.arc(p.x, p.y - 0.17 * p.s, 0.14 * p.s, 0, 2 * PI); g.fill(); }
}
// a banner hung from the front of the stand (fans in Medellín still bring his name and his number)
const TIFO = makeCanvas(1600, 520);
{ const b = TIFO.getContext('2d'); for (let i = 0; i < 8; i++) { b.fillStyle = i % 2 ? '#F4F4F2' : VERDE; b.fillRect(i * 200, 0, 200, 520); }
  b.fillStyle = 'rgba(10,30,18,0.82)'; b.fillRect(140, 70, 1320, 380);
  b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillStyle = CYEL; b.font = '900 300px Rubik'; b.fillText('2', 330, 270);
  b.fillStyle = '#F4F4F2'; b.font = '900 120px Rubik'; b.fillText('ANDRÉS', 900, 190); b.fillText('ESCOBAR', 900, 340); }

// ================================================================== the film
// One take of about 1:03 (STYLE_BIBLE rule 70): every change of shot is a camera swing or a push, every shot moves. The
// first frame is the iconic photograph with his name over it; until it is here, the same moment drawn: Escobar on his back
// on the Rose Bowl grass after the own goal, the ball in the net behind him. The shooting is not shown (the brief).
// monotone cubic through [real time, game time] knots: the slow motion of a replay that eases in and out
function warp(knots) {
  const n = knots.length, x = knots.map(k => k[0]), y = knots.map(k => k[1]), d = [];
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { const a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b; if (s2 > 9) { const tau = 3 / Math.sqrt(s2); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; } }
  return r => { if (r <= x[0]) return y[0] + (r - x[0]) * m[0]; if (r >= x[n - 1]) return y[n - 1] + (r - x[n - 1]) * m[n - 1];
    let i = 0; while (r > x[i + 1]) i++; const h = x[i + 1] - x[i], u = (r - x[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain, ...o });  // o: { end, fade } (s): the sound dies away by `end`
  let panN = 0;
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: DAY_G, trans: 'pan', panDir: panN++ % 2 ? -1 : 1, transDur: 0.3, noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player'];
  const LINE = 52.5;
  const pinT = (t, t0) => (t > t0 ? pin(t, t0) : null);
  const plateAt = (g, t, t0, txt, y, o = {}) => { const p = pinT(t, t0); if (p) plate(g, txt, W / 2, y, { color: CREAM, size: 40, ...o, ...p }); };

  // the times, from the narration
  const tOne = wn('hook', 'One') - 0.1, tNum = wn('hook', 'number'), tAnd = wn('hook', 'and') - 0.1, tTen0 = wn('hook', 'ten'), tGone = wn('hook', 'gone.');
  const cR = s('rise') - 0.2, t94 = wn('rise', '1994,'), tFav = wn('rise', 'favourites.'), cM = wn('rise', 'Months') - 0.1, tCr = wn('rise', 'crushed'), t50 = wn('rise', '5–0');
  const cG = s('goal') - 0.15, cH = wn('goal', 'Then,') - 0.1, tUSA = wn('goal', 'USA.'), cX = wn('goal', 'A') - 0.1, tCross = wn('goal', 'cross'), tTurn = wn('goal', 'turned'), tOwn = wn('goal', 'own'), tNet = wn('goal', 'net.');
  const cL = wn('goal', 'Colombia') - 0.1, t21 = wn('goal', '2–1.'), cF = wn('goal', 'Four') - 0.1, tOut = wn('goal', 'out.');
  const cN = s('home') - 0.2, tSee = wn('home', 'see'), tHere = wn('home', 'here.');
  const cC = s('night') - 0.2, tJuly = wn('night', 'July'), tTen = wn('night', 'ten'), cP = wn('night', 'he') - 0.1, tHe2 = wn('night', 'he', 1);
  const cT = s('tribute') - 0.2, t100 = wn('tribute', '100,000'), cS = wn('tribute', 'Today') - 0.1, cE = wn('tribute', 'and') - 0.1, tGent = wn('tribute', 'gentleman');
  const tvOff = T.duration - 1.05;

  // ======================= THE OWN GOAL, in game time G (0: Harkes's cross; 0.62: the touch; 1.05: in the net) =======================
  // The USA attack +x; Colombia's goal is at +x. Harkes crosses from the US left (+z); Escobar, coming across, stretches
  // his left leg and turns the ball past Córdoba, who has gone toward the near post
  const G_T = 0.62, G_N = 1.05;
  const esMv = new Mover([[-1.6, LINE - 10.4, -4.6], [-0.2, LINE - 7.8, -0.7], [0.45, LINE - 6.7, 1.2], [0.95, LINE - 6.2, 2.0, { stop: true }], [9, LINE - 6.2, 2.0]], { heading0: 1.0 });
  const SIT = { ...POSE.sit(), look: -0.35 };
  const esAt = (G, t = G) => {
    const m = moving(esMv, G, { e: 'focus', t }), base = grounded(ESCOBAR, m), sl = smooth(clamp((G - 0.18) / 0.32)), sit = smooth(clamp((G - 1.35) / 0.7));
    let pose = sl > 0 ? blend(base.pose, SLIDE, sl) : base.pose; if (sit > 0) pose = blend(pose, SIT, sit);
    const e = G < G_T ? 'focus' : G < 1.3 ? 'shock' : HURT;
    return sl > 0 ? onGrass(ESCOBAR, { ...base, pose, e, shadow: { r: lerp(0.36, 0.7, sl), rz: 0.32, ang: m.head } }, sl > 0.95) : { ...base, e };
  };
  // where his left foot is at the touch: the cross is aimed there
  const skT = skeleton(ESCOBAR, esAt(G_T)), ank = skT.legs[0].ankle, TP = [ank[0] + 0.14 * skT.f[0], Math.max(BALL_R + 0.02, ank[1]), ank[2] + 0.14 * skT.f[2]];  // at the sole of his left boot
  const NP = [LINE + 0.35, 0.6, -2.5];
  const hkMv = new Mover([[-1.6, LINE - 22.5, 15.6], [0, LINE - 15.8, 14.3], [0.5, LINE - 14.6, 13.8, { stop: true }], [9, LINE - 14.6, 13.8]], { heading0: -0.2 });
  const ogBall = new BallPath([{ t0: -1.6, t1: 0, kind: 'roll', from: [LINE - 22.0, BALL_R, 15.2], to: [LINE - 15.3, BALL_R, 13.95], decay: 0.4 },
    { t0: 0, t1: G_T, kind: 'air', from: [LINE - 15.3, BALL_R, 13.95], to: TP },
    { t0: G_T, t1: G_N, kind: 'air', from: TP, to: NP, g: 3 },
    { t0: G_N, t1: G_N + 0.45, kind: 'air', from: NP, to: [LINE + 1.45, BALL_R, -2.7], g: 9 }, { t0: G_N + 0.45, t1: 99, kind: 'hold', from: [LINE + 1.45, BALL_R, -2.7] }]);
  const cdMv = new Mover([[-1.6, LINE - 1.0, -0.2], [0.3, LINE - 1.2, 1.3], [0.8, LINE - 1.15, 2.1, { stop: true }], [9, LINE - 1.15, 2.1]], { heading0: PI, face: () => PI });
  const stMv = new Mover([[-1.6, LINE - 15.5, -6.4], [0.6, LINE - 8.4, -2.4], [1.4, LINE - 7.2, -2.0, { stop: true }], [9, LINE - 7.2, -2.0]], { heading0: 0.4 });
  const dfMv = new Mover([[-1.6, LINE - 15, 7.5], [1.0, LINE - 9.5, 5.4], [1.8, LINE - 8.8, 5.0, { stop: true }], [9, LINE - 8.8, 5.0]], { heading0: 0 });
  const ogItems = (G, t = G) => [P(HARKES, runKick(hkMv, G, 0, 'L', { e: 'focus' })), P(ESCOBAR, esAt(G, t)),
    P(CORDOBA, { ...keeper(CORDOBA, cdMv, G, { face: PI }), e: G > 0.9 ? 'shock' : 'focus' }),
    P(USAS[1], { ...moving(stMv, G, { e: G > G_N ? JOY : 'focus', t }) }), P(COLS[1], moving(dfMv, G, { e: G > G_N ? LOST : 'focus', t })),
    ballOf(ogBall, G, { trail: G > -0.05 && G < G_N ? trailOf(ogBall, G, 5, 0.02) : null })];

  // ======================= THE OPENING (0–8 s, made to be lifted out whole) =======================
  const coverK = t => 1 + 0.06 * Math.exp(-Math.max(0, t - 0.05) * 6);
  const cover = (g, t) => { title2(g, 'ANDRÉS', 'ESCOBAR', 210, { c2: CYEL, s1: 96, s2: 150, a: fadeOut(t, tOne - 0.12, 0.12), k: coverK(t) });
    if (t > tNum - 0.05) plateAt(g, t, tNum - 0.05, 'COLOMBIA · Nº 2', 470, { size: 44, color: CYEL, ink: '#1A1406', a: fadeOut(t, tOne - 0.12, 0.12) }); };
  // "Andrés Escobar. Colombia's number two.": the photograph if it is here; else the same moment drawn, the camera coming
  // down over him
  const LIE_AT = [LINE - 5.6, 2.4], lying = t => P(ESCOBAR, onGrass(ESCOBAR, { x: LIE_AT[0], z: LIE_AT[1], head: PI / 2 + 0.35, pose: { ...LIE, lean: -1.5 + 0.01 * Math.sin(t * 1.3) }, e: HURT, t,
    shadow: { dz: -0.45, r: 0.95, rz: 0.38, ang: PI / 2 + 0.35 } }, true));
  const cordobaAfter = t => man(t, CORDOBA, LINE - 1.3, 2.8, PI + 0.1, { ...HIPS, look: -0.3 }, LOST, 3);  // by the near post, clear of his name
  // the photograph (sent by the author, 12 Nov 2026), enlarged once to the width of the frame, its top and bottom edges
  // fading into the blurred copy behind it (as in baggio1994)
  const IMF = IMG.iconic ? (() => { const im = IMG.iconic, ph = Math.round(W * im.height / im.width), c = makeCanvas(W, ph), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, W, ph); x.globalCompositeOperation = 'destination-in';
    const gr = x.createLinearGradient(0, 0, 0, ph); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.12, 'rgba(0,0,0,1)'); gr.addColorStop(0.9, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, W, ph); return c; })() : null;
  if (IMG.iconic) shot(0, (g, lt, t) => {
    const im = IMG.iconic, ph = IMF.height, y0 = Math.max(420, 1000 - ph / 2), z = 1 + 0.08 * glide(clamp(lt / tOne));
    g.fillStyle = '#05070B'; g.fillRect(0, 0, W, H);
    g.save(); g.filter = 'blur(28px) brightness(0.5)'; photoIn(g, im, -80, -80, W + 160, H + 160); g.restore();
    g.save(); g.translate(W * 0.6, y0 + ph * 0.45); g.scale(z, z); g.translate(-W * 0.6, -(y0 + ph * 0.45)); g.drawImage(IMF, 0, y0, W, ph); g.restore();
    const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, 'rgba(6,8,14,0.85)'); gr.addColorStop(1, 'rgba(6,8,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 560);
  }, { grade: PRINT_G, hud: (g, lt, t) => cover(g, t) });
  else shot(0, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp(tt / tOne)); return lookFrom([LIE_AT[0] - 3.0 + 0.6 * v, lerp(3.4, 2.9, v), LIE_AT[1] + 2.0 - 0.4 * v], [LIE_AT[0] + 1.7, 0.2, LIE_AT[1] - 1.3], { fov: lerp(1300, 1420, v), cy: H * 0.45 }); }, { shake: 0.25 });
    stadium(g, t, [lying(t), BALL([LINE + 1.45, BALL_R, -2.7])], { cheer: 0.7, blur: 3 });
  }, { qaAllow: [...CROWDED, 'head out of frame'], hud: (g, lt, t) => cover(g, t) });
  cue(0, 'boom_cine', 0.4); cue(0.05, 'camera', 0.3); cue(0.9, 'heartbeat', 0.45);
  // "One touch at the World Cup": the touch itself, very slowly, from the grass
  const g1 = t => G_T - 0.13 + (t - tOne) * 0.1, tTouch1 = tOne + 0.13 / 0.1;
  shot(tOne, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - tOne) / (tAnd - tOne))); return lookFrom([TP[0] + 4.6 - 0.6 * v, 0.95 + 0.1 * v, TP[2] - 4.0 + 0.9 * v], [TP[0] - 0.9, 0.5, TP[2] + 0.2], { fov: lerp(1450, 1600, v), cy: H * 0.44 }); }, { shake: 0.2 });
    const G = g1(t);
    stadium(g, t, ogItems(G, t), { cheer: 0.5, blur: 6, gt: G });
  }, { mbStep: 3, mbMax: 12, qaAllow: [...CROWDED, 'head out of frame'] });
  cue(tOne, 'whoosh_soft', 0.2); cue(tTouch1 - 0.02, 'touch', 0.6); cue(tOne + 0.2, 'heartbeat', 0.5); cue(tOne + 1.2, 'heartbeat', 0.5);
  // "and ten days later, he was gone": the calendar from 22 June to 2 July; the colour goes
  const flipA = tTen0 - 0.05, flipB = tGone - 0.15, calK = t => 10 * ease.inOut(clamp((t - flipA) / (flipB - flipA)));
  shot(tAnd, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - tAnd) / (cR - tAnd))); return lookFrom([LINE - 30 + 4 * v, 6.5, -20 + 3 * v], [0, 3, 10], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.2 });
    stadium(g, t, [], { skyP: SKY_DUSK, cheer: 0, blur: 9 });
    g.fillStyle = 'rgba(8,10,18,0.45)'; g.fillRect(0, 0, W, H);
    const v = clamp((t - tAnd) / (cR - tAnd));
    calendar(g, W / 2, 830 - 30 * v, 600 * (1 + 0.06 * v), calK(t), { rot: -0.035 + 0.02 * Math.sin(t * 0.9) });
  }, { grade: DUSK_G, trans: 'push', post: (g, lt, t) => sadPost(g, clamp((t - tGone + 0.05) / 0.6)) });
  cue(tAnd, 'whoosh_deep', 0.22); for (let i = 0; i < 10; i += 3) cue(flipA + (flipB - flipA) * (0.5 - 0.5 * Math.cos(PI * (i + 0.5) / 10)), 'page_flip', 0.35); cue(tGone, 'boom_move', 0.35);

  // ======================= 1994: ONE OF THE FAVOURITES =======================
  // "In 1994, Colombia came to the World Cup as one of the favourites": the team lined up before a match, the camera along
  // the line to the number 2
  const ROW = [CORDOBA, COLS[0], COLS[1], COLS[2], COLS[8], ESCOBAR, COLS[3], COLS[4], COLS[5], COLS[6], COLS[7]], RX = i => -5 + i * 1.02, EX = RX(5);
  shot(cR, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cR) / (cM - cR))), x = lerp(RX(0) - 1.5, EX - 0.4, v);
      return lookFrom([x, 1.55, lerp(-3.1, -2.2, v)], [x + lerp(2.4, 0.4, v), 1.45, 0], { fov: lerp(1500, 1750, v), cy: H * 0.55 }); }, { shake: 0.3 });
    stadium(g, t, ROW.map((pl, i) => man(t, pl, RX(i), 0, -PI / 2, { lean: 0.02 + 0.008 * Math.sin(t * 1.2 + i), watch: 0.5, look: 0.04 }, pl === ESCOBAR ? CALM : 'focus', i * 0.7)), { cheer: 0.6, blur: 4, goals: false });
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => {
    plateAt(g, t, t94 - 0.05, 'WORLD CUP · USA 1994', 300, { size: 40 });
    plateAt(g, t, tFav - 0.05, 'ONE OF THE FAVOURITES', 400, { size: 46, color: GOLD, ink: '#2A1E06' });
  } });
  cue(cR, 'whoosh_deep', 0.25); cue(tFav - 0.05, 'stamp', 0.3);
  // "Months earlier, they had crushed Argentina 5–0 in Buenos Aires": five goals into one net, the Monumental going quiet
  const g0 = Math.max(cM + 0.55, tCr - 0.7), GT = Array.from({ length: 5 }, (_, i) => g0 + i * (t50 + 0.05 - g0) / 4);  // spread over the line, about 0.4 s apart
  const r5 = rng(1993), SHOTS5 = GT.map((tg, i) => { const from = [LINE - 15 - r5() * 6, 0.25, (r5() - 0.5) * 14], to = [LINE + 0.15, 0.4 + r5() * 1.7, (i % 2 ? 1 : -1) * (1.2 + r5() * 2.2)];
    return { tg, bp: new BallPath([{ t0: tg - 0.5, t1: tg, kind: 'air', from, to, g: 5 }, { t0: tg, t1: tg + 0.35, kind: 'air', from: to, to: [LINE + 1.4, BALL_R + 0.05 * i, to[2] * 0.9], g: 9 }, { t0: tg + 0.35, t1: 99, kind: 'hold', from: [LINE + 1.4, BALL_R + 0.05 * i, to[2] * 0.9] }]), to }; });
  const gkAr = new Mover([[cM - 1, LINE - 1.2, 0.3], ...SHOTS5.slice(0, 3).map(sh => [sh.tg - 0.12, LINE - 1.2, clamp(sh.to[2] * 0.3, -1.2, 1.2)]), [GT[2] + 0.4, LINE - 1.2, 0.3, { stop: true }], [99, LINE - 1.2, 0.3]], { heading0: PI, face: () => PI });
  shot(cM, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cM) / (cG - cM))); return lookFrom([LINE + 6.2 - 0.9 * v, 3.4 - 0.8 * v, 3.6 - 6.0 * v], [LINE - 8, 0.4, lerp(-0.5, 0.8, v)], { fov: lerp(930, 1100, v), cy: H * 0.5 }); }, { shake: 0.4 });
    const n = GT.filter(tg => t >= tg).length, last = n ? SHOTS5[n - 1] : null, down = smooth(clamp((t - GT[2]) / 0.5));
    const gk = P(GK_A, n >= 3 ? grounded(GK_A, { x: LINE - 1.2, z: 0.3, head: PI, pose: blend({ ...POSE.stand(), ...SET }, { ...POSE.stand(), ...HIPS, look: -0.3 }, down), e: down > 0.5 ? LOST : 'shock', t }) : keeper(GK_A, gkAr, t, { face: PI }));
    stadium(g, t, [gk, ...SHOTS5.filter(sh => t > sh.tg - 0.5).map(sh => ballOf(sh.bp, t))], { arena: ARENA_AR, skyP: SKY_N, turf: TURF_N, boards: BOARDS_AR, cheer: 0, blur: 3,
      hit: last ? { t0: last.tg, y: last.to[1], z: last.to[2], k: 1 } : null, hitSide: 1 });
  }, { grade: NIGHT_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    const n = GT.filter(tg => t >= tg).length, pop = n ? Math.exp(-(t - GT[n - 1]) * 8) : 0;
    scoreBug(g, 'ARG', 'COL', 0, n, '', { colL: CELESTE, colR: CYEL, pop });
    plateAt(g, t, cM + 0.15, 'BUENOS AIRES · 5 SEPTEMBER 1993', 300, { size: 34 });
    if (t > t50 - 0.02) title2(g, 'ARGENTINA – COLOMBIA', '0 – 5', 470, { c1: '#FFFFFF', c2: CYEL, s1: 58, s2: 190, a: clamp((t - t50 + 0.02) / 0.08), k: 1 + 0.1 * Math.exp(-Math.max(0, t - t50) * 6) });
  } });
  cue(cM, 'whoosh_fast', 0.22); GT.forEach(tg => { cue(tg - 0.5, 'kick', 0.45); cue(tg, 'net', 0.6); }); cue(t50, 'boom_cine', 0.4);

  // ======================= 22 JUNE 1994: USA–COLOMBIA =======================
  // "But they lost their first game.": Romania 3–1 Colombia; Escobar and two teammates, heads down
  shot(cG, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cG) / (cH - cG))); return K(PI / 2 + 0.5 - 0.5 * v, 0.02, lerp(4.3, 3.6, v), [-6, 1.25, 0], { fov: 1550, cy: H * 0.56 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, ESCOBAR, -6, 0.2, -PI / 2 - 0.3, { ...HEADDOWN }, LOST, 0), man(t, COLS[3], -7.4, -0.9, -PI / 2 + 0.4, { ...HIPS, look: -0.35 }, LOST, 2), man(t, COLS[1], -4.6, -1.3, -PI / 2 - 0.6, { ...HIPS, look: -0.25 }, LOST, 4)], { cheer: 0.3, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { plateAt(g, t, cG + 0.1, 'ROMANIA 3 – 1 COLOMBIA', 300, { size: 46, color: '#FFFFFF', sub: '18 JUNE 1994' }); } });
  cue(cG, 'whoosh_soft', 0.22);
  // "Then, the hosts: the USA.": the Americans, the camera swinging past them toward Colombia's half
  shot(cH, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cH) / (cX - cH))); return K(-PI / 2 + 0.55 - 0.7 * v, 0.03, lerp(5.2, 4.4, v), [6.4, 1.15, 1.6], { fov: 1550, cy: H * 0.57 }); }, { shake: 0.35 });
    stadium(g, t, [man(t, USAS[2], 6.0, 1.0, -PI / 2 + 0.3, { lean: 0.03, watch: 0.6 }, 'focus', 1), man(t, USAS[3], 7.4, 2.2, -PI / 2 - 0.2, { ...HIPS, watch: 0.4 }, 'focus', 2), jog(t, cH, USAS[4], 4.6, 3.6, 1.1, -0.2, 0, 'focus')], { cheer: 0.85, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'USA', 'COL', 0, 0, '');
    plateAt(g, t, cH + 0.1, 'PASADENA · 22 JUNE 1994', 300, { size: 36 });
    plateAt(g, t, tUSA - 0.05, 'THE HOSTS', 390, { size: 46, color: GOLD, ink: '#2A1E06' });
  } });
  cue(cH, 'whoosh_fast', 0.2); cue(tUSA, 'crowd_roar', 0.3);
  // "A cross came in. Escobar stretched, and turned it into his own net.": the whole move, slowed from the cross on
  const tCrossR = tCross + 0.05, tTouchR = tTurn - 0.05, tNetR = tOwn + 0.1;
  const gw = warp([[cX - 1, -1.25 - (tCrossR - cX)], [cX, -(tCrossR - cX)], [tCrossR, 0],  // real speed up to the cross, then the slow motion
    [tTouchR, G_T], [tNetR, G_N], [cL + 1, G_N + (cL + 1 - tNetR) * 0.55]]);
  // from behind the play, on the pitch side: the cross comes into the picture from the left, Escobar slides across it
  // 6 m from the lens, and the ball goes on past Córdoba into the net, all in one view (a whip pan to the net blurred it)
  const camOG = tt => { const v = ease.inOut(clamp((tt - cX) / (cL - cX))), G = gw(tt), b = ogBall.at(G).pos, after = smooth(clamp((G - G_T + 0.05) / 0.6));
    const es = esMv.at(G), before = mix3(mix3(TP, [es.x, 0, es.z], 0.45), b, 0.12), toGoal = mix3(TP, [LINE - 0.5, 0.9, -0.6], 0.6 * smooth(clamp((G - G_T) / (G_N - G_T + 0.4)))), T0 = mix3(before, toGoal, after);
    return lookFrom([LINE - 12.6 + 1.6 * v, 2.9 - 0.3 * v, 4.8 - 0.6 * v], [T0[0], 0.6, T0[2] - 0.9], { fov: lerp(1350, 1500, v), cy: H * 0.42 }); };  // the action above the captions
  shot(cX, (g, lt, t) => {
    rigFn(lt, t, camOG, { shake: 0.35 });
    const G = gw(t);
    stadium(g, t, ogItems(G, t), { cheer: G > G_N ? 1 : 0.6, blur: 3, gt: G, hit: G > G_N ? { t0: G_N, y: NP[1], z: NP[2], k: 1 } : null, hitSide: 1 });
  }, { mbStep: 3, mbMax: 16, qaAllow: [...CROWDED, 'head out of frame'], hud: (g, lt, t) => {
    const G = gw(t); scoreBug(g, 'USA', 'COL', G > G_N ? 1 : 0, 0, '', { pop: G > G_N ? Math.exp(-(t - tNetR) * 6) : 0 });
    if (t > tNet - 0.02) stamp(g, 'OWN GOAL', W / 2, 420, lt, tNet - 0.02 - cX, { color: RED, size: 120, rot: -0.06 });
  } });
  cue(cX, 'whoosh_deep', 0.22); cue(tCrossR - 0.02, 'kick', 0.6); cue(tCrossR + 0.4, 'heartbeat', 0.5); cue(tCrossR + 1.4, 'heartbeat', 0.55); cue(tTouchR - 0.02, 'touch', 0.8);
  cue(tNetR, 'net', 0.7); cue(tNetR + 0.05, 'crowd_roar', 0.7); cue(tNet - 0.02, 'stamp', 0.5);
  // "Colombia lost 2–1.": the final whistle; Escobar bent over, the Americans celebrating behind him
  shot(cL, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cL) / (cF - cL))); return K(-PI / 2 - 0.4 + 0.6 * v, 0.03, lerp(3.9, 3.3, v), [10, 1.0, -2], { fov: 1550, cy: H * 0.57 }); }, { shake: 0.3 });
    stadium(g, t, [man(t, ESCOBAR, 10, -2, PI / 2 + 0.2, { ...KNEES }, LOST, 0), man(t, COLS[2], 11.6, -3.4, PI / 2 + 0.6, { ...HEADDOWN }, LOST, 2),
      hopper(t, USAS[1], 15.5, 5.5, -PI / 2, 0), hopper(t, USAS[3], 17.2, 4.4, -PI / 2 - 0.4, 1.7), hopper(t, USAS[2], 14.0, 7.2, -PI / 2 + 0.3, 3.1)], { cheer: 1, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'USA', 'COL', 2, 1, 'FT', { pop: t > t21 ? Math.exp(-(t - t21) * 6) : 0 }); } });
  cue(cL, 'whistle', 0.55); cue(cL + 0.05, 'crowd_roar', 0.5);
  // "Four days later, they were out.": the group table; Colombia walking off
  shot(cF, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cF) / (cN - cF))); return lookFrom([-3.2 - 1.45 * (tt - cF), 1.75, 1.3 - 0.3 * v], [-15 - 1.45 * (tt - cF), 1.0, 0.1], { fov: 1500, cy: H * 0.64 }); }, { shake: 0.3 });
    stadium(g, t, [jog(t, cF, ESCOBAR, -7.5, 0.5, -1.45, 0, 0, LOST, { look: -0.5 }), jog(t, cF, COLS[4], -9.2, -1.2, -1.45, 0, 1.3, LOST, { look: -0.4 }), jog(t, cF, COLS[0], -10.6, 1.6, -1.45, 0, 2.2, LOST, { look: -0.45 })], { cheer: 0.25, blur: 4, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    groupTable(g, 60, 250, clamp((t - cF - 0.1) / 0.35), { strike: clamp((t - tOut + 0.1) / 0.3) });
    if (t > tOut - 0.02) stamp(g, 'ELIMINATED', W / 2, 900, lt, tOut - 0.02 - cF, { color: RED, size: 110, rot: -0.07 });
  } });
  cue(cF, 'whoosh_soft', 0.22); cue(tOut - 0.02, 'stamp', 0.5); cue(tOut, 'boom_move', 0.3);

  // ======================= "SEE YOU SOON" =======================
  // "He wrote in a newspaper: see you soon, because life doesn't end here.": his column, the last line picked out
  shot(cN, (g, lt, t) => {
    const v = glide(clamp((t - cN) / (cC - cN))), sc = lerp(0.6, 0.86, v);
    tableTop(g, t);
    newsPage(g, W / 2 - 110 * sc + 60 * (1 - v), 900 + 40 * sc, sc, lerp(-0.07, -0.025, v), clamp((t - tSee + 0.1) / (tHere - tSee + 0.25)));
    const lamp = g.createRadialGradient(W * 0.45, H * 0.4, 50, W * 0.45, H * 0.45, H * 0.75); lamp.addColorStop(0, 'rgba(255,220,160,0.18)'); lamp.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = lamp; g.fillRect(0, 0, W, H);
  }, { grade: ROOM_G, trans: 'push' });
  cue(cN, 'paper', 0.4); cue(cN + 0.1, 'whoosh_soft', 0.15);

  // ======================= 2 JULY 1994, MEDELLÍN (nothing of the shooting is shown) =======================
  // "On July 2, ten days after that match,": the city at night
  shot(cC, (g, lt, t) => {
    const v = glide(clamp((t - cC) / (cP - cC)));
    valley(g, t, { x: lerp(-0.4, 0.4, v), z: lerp(1.0, 1.14, v) });
  }, { grade: NIGHT_G, hud: (g, lt, t) => {
    plateAt(g, t, tJuly - 0.05, 'MEDELLÍN · 2 JULY 1994', 300, { size: 40 });
    plateAt(g, t, tTen - 0.05, '10 DAYS AFTER THE MATCH', 390, { size: 40, color: GOLD, ink: '#2A1E06' });
  } });
  cue(cC, 'whoosh_soft', 0.18);
  // "he was shot dead outside a nightclub in Medellín. He was 27.": an empty car park under a street lamp; the camera
  // rises to the night sky and his years
  const upT = tHe2 - 0.5;
  shot(cP, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cP) / (cT - cP))), up = ease.inOut(clamp((tt - upT) / (cT + 0.3 - upT)));
      return lookFrom([PX - 8.0 + 5.0 * v, 2.3 + 0.6 * up, -7.0 + 4.6 * v], [PX + 0.5 + 1.5 * v, lerp(0.6, 26, up), lerp(12, 30, up)], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.15 });
    carPark(g, t);
  }, { grade: STREET_G, hud: (g, lt, t) => {
    if (t > tHe2 - 0.05) title2(g, 'ANDRÉS ESCOBAR', '1967 – 1994', 760, { c1: CREAM, c2: '#FFFFFF', s1: 64, s2: 128, a: clamp((t - tHe2 + 0.05) / 0.4) });
  } });
  cue(cP, 'whoosh_soft', 0.12); cue(tHe2, 'reveal_bell', 0.25);

  // ======================= HOW HE IS REMEMBERED =======================
  // "More than 100,000 people came to his funeral.": a street full of people, the camera rising over them
  shot(cT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cT) / (cS - cT))); return lookFrom([FX + 12 - 4 * v, lerp(3.2, 9.5, v), 1.5 - 1.0 * v], [FX - 40, lerp(1.2, 0.2, v), 0], { fov: 1500, cy: H * 0.52 }); }, { shake: 0.2 });
    funeral(g, t);
  }, { grade: GREY_G, trans: 'push', hud: (g, lt, t) => {
    if (t > t100 - 0.1) { const k = ease.out(clamp((t - t100 + 0.1) / 0.8)), n = Math.round(100000 * k / 1000) * 1000;
      counter(g, n.toLocaleString('en-US') + (k >= 1 ? '+' : ''), 'AT HIS FUNERAL', { y: 330, size: 150, color: GOLD, at: [t, t100 - 0.1] }); }
  } });
  cue(cT, 'whoosh_soft', 0.18); cue(t100 + 0.7, 'stamp', 0.3);
  // "Today his statue stands in Medellín,": the statue in bronze, the camera going round it
  const STAT_POSE = { ...POSE.stand(), hip: [[0.02, 0.06], [0.36, 0.1]], knee: [0.06, 0.55], sh: [[0.18, 0.22], [0.22, 0.18]], el: [0.42, 0.5], lean: 0.02, look: 0.05, lift: PLH };
  const statue = hd => { const st = grounded(STATUE_PL, { x: SX, z: 0, head: hd, pose: STAT_POSE, e: STONE, t: 0 }), toe = skeleton(STATUE_PL, st).legs[1].toe;
    return [P(STATUE_PL, st), BALL([toe[0] + 0.12 * Math.cos(hd), PLH + BALL_R, toe[2] + 0.12 * Math.sin(hd)])]; };  // a ball under his right foot
  shot(cS, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cS) / (cE - cS))); return K(-PI / 2 - 0.75 + 0.8 * v, -0.06, lerp(5.0, 4.4, v), [SX, 2.0, 0], { fov: 1600, cy: H * 0.5 }); }, { shake: 0.15 });
    statueScene(g, t, statue(2.9));
  }, { grade: DUSK_G, hud: (g, lt, t) => { plateAt(g, t, cS + 0.15, 'MEDELLÍN', 300, { size: 40, sub: 'UNIDAD DEPORTIVA DE BELÉN' }); } });
  cue(cS, 'whoosh_soft', 0.18); cue(cS + 0.2, 'shimmer', 0.25);
  // "and they still call him the gentleman of football.": the stand in Medellín, his name and his number; the camera draws back
  const tifo = () => ({ d: 1e9, draw: g => quadImg(g, TIFO, [10, 7.6, -50.0], [-10, 7.6, -50.0], [10, 3.0, -50.0]) });
  shot(cE, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cE) / (T.duration - cE))); return lookFrom([1.2 * Math.sin(tt * 0.3), lerp(4.5, 6.5, v), lerp(-26, -16, v)], [0, lerp(5.0, 4.6, v), -50], { fov: lerp(1450, 1350, v), cy: H * 0.5 }); }, { shake: 0.2 });
    stadium(g, t, [tifo()], { arena: ARENA_NC, skyP: SKY_N, turf: TURF_N, boards: BOARDS_NC, cheer: 1, blur: 2, goals: false });
  }, { grade: NIGHT_G, trans: 'push', hud: (g, lt, t) => {
    if (t > tGent - 0.08) { const a = clamp((t - tGent + 0.08) / 0.15), k = 1 + 0.08 * Math.exp(-Math.max(0, t - tGent) * 6);
      title2(g, 'EL CABALLERO DEL FÚTBOL', 'THE GENTLEMAN', 230, { c1: CREAM, c2: GOLD, s1: 56, s2: 120, a, k });
      title2(g, '', 'OF FOOTBALL', 360, { c2: GOLD, s1: 10, s2: 120, a, k }); }
  } });
  cue(cE, 'whoosh_soft', 0.18); cue(tGent - 0.08, 'boom_cine', 0.35); cue(cE + 0.1, 'crowd_roar', 0.45, { end: tvOff, fade: 0.9 });
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd: the Rose Bowl full; the Monumental quiet; nothing from the newspaper to the funeral; a stand at the end
  amb.push({ id: 'crowd_bed', t0: 0, t1: T.duration - 0.6, gain: 0.6, fi: 0.1, fo: 0.6, keys: [[0, 0.35], [tOne, 0.3], [tAnd, 0.12], [cR, 0.55], [cM, 0.35], [GT[2], 0.15], [cG, 0.4], [cH, 0.7], [tNetR, 1.0], [cL, 0.8], [cF, 0.3], [cN - 0.2, 0.25], [cN + 0.5, 0], [cE - 0.3, 0], [cE + 0.3, 0.6], [tvOff, 0.15]] });
  amb.push({ id: 'murmur', t0: cT - 0.3, t1: cS + 0.6, gain: 0.35, fi: 0.4, fo: 0.6, keys: [[cT, 0.5], [cS, 0.4]] });

  const music = [
    { t: 0, m: 'hook' }, { t: cR, m: 'glory' }, { t: cM, m: 'stands_hot' }, { t: cG, m: 'tension' }, { t: tTouchR - 0.1, m: 'hit' }, { t: cL, m: 'void' }, { t: cN, m: 'elegy' }, { t: cP, m: 'void' }, { t: cT, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [{ t0: tGone - 0.35, t1: tGone + 0.1, kind: 'mute' }];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
