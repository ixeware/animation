// "Feet first". Crystal Palace 1–1 Manchester United, Selhurst Park, Wednesday 25 January 1995: early in the second half
// Eric Cantona kicked out at Richard Shaw and was sent off; walking along the touchline he was abused by a Palace fan who
// had run down to the front, and he went over the barrier feet first. United fined him £20,000, the FA banned him to 30
// September 1995; two weeks in prison, cut on appeal to community service, coaching children; then the press conference:
// "When the seagulls follow the trawler, it's because they think sardines will be thrown into the sea." SOURCES.md.
// The settings are those of plea2005 (STYLE_BIBLE rule 68), the one-take cutting and the length rule 70. The first frame
// is the drawn Cantona with his name; the author's photograph of the kick comes mid-film (his instruction, 14 Nov 2026).
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
const IMG = { kick: await loadImage('../episodes/cantona1995/photos/kick.jpg') };
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
// people in the street and in the stand (long sleeves and trousers, no number)
const plain = (shirt, trousers = '#2A2D34', o = {}) => ({ shirt, shirtD: mix(shirt, '#000000', 0.16), trim: mix(shirt, '#000000', 0.16), num: null, shorts: trousers, socks: trousers, boots: '#1A1B1F', long: true, trousers: true, band: null, badge: null, ...o });
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
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
// the grass: plain mown stripes, no noise texture (the author asked for a smooth field, rule 71)
const TURF = { colors: ['#4A9C45', '#56A84E'], wear: 0, haze: '#9AB0B8', noise: false };
const TURF_N = { colors: ['#3A8A3D', '#449648'], wear: 0, haze: '#26324E', noise: false };
const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// ---------- this film's colours and kits. United's black away kit with the yellow trim and the yellow 7 (the author's
// photograph; ESPN: "the jersey worn by Eric Cantona when he leapt over the hoardings"); Crystal Palace in red and blue
// stripes (the scarves and shirts in the photograph's crowd; Shaw's exact kit that night was not checked). The cast:
// cartoons, not likenesses
const UNAVY = '#1C2B5A', CYEL = '#F2C811', CRED = '#C8202C', MUGOLD = '#E2B93B', PRED = '#C8202C', PBLUE = '#1E4CA0', FLUO = '#C6EE34';
const MUN = { shirt: '#17181B', shirtD: '#0E0F12', trim: MUGOLD, num: MUGOLD, numEdge: null, shorts: '#17181B', socks: '#17181B', band: MUGOLD, boots: '#0E0F12', badge: '#C8202C' };
const CPFC = { shirt: PRED, shirtD: '#A01820', stripes: [PBLUE, 3], trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: PBLUE, socks: PRED, band: PBLUE, boots: '#1A1B1F', badge: '#F4F4F2' };
// the referee in green: the Premier League's referees and linesmen wore green from 1992-93 to 1995-96 (SOURCES.md)
const REFK = { shirt: '#1F7A45', shirtD: '#16603A', trim: '#101114', num: null, shorts: '#141518', socks: '#141518', band: '#1F7A45', boots: '#0E0F12', badge: null };
const STAFF = plain('#1E2433', '#1E2433'), STEWARD = plain(FLUO, '#2A2D34', { shirtD: '#A8CC28' }), FANJ = plain('#16171A', '#8E8878');
const TRACK = plain('#1C2233', '#1C2233'), SUITK = plain('#24262E', '#24262E');
const kidKit = c => ({ shirt: c, shirtD: mix(c, '#000000', 0.18), trim: mix(c, '#000000', 0.18), num: null, shorts: '#1E2433', socks: '#F2F2EE', band: '#F2F2EE', boots: '#1A1B1F', badge: null });
// Cantona after the author's portrait: hair cropped very short, heavy straight brows, stubble over the jaw and the lip.
// No turned-up collar (the author: «Dont use the high collar just use the basic ones»): the shirt's own neckline
const cantonaHead = col => {
  const fh0 = fullHair(col);
  const beardLine = dy => { const q = new Path2D(); q.moveTo(-130, -30); q.lineTo(-84, -2 - dy); q.bezierCurveTo(-82, 24 - dy, -72, 48 - dy, -50, 58 - dy);
    q.quadraticCurveTo(-40, 62 - dy, -36, 55 - dy); q.quadraticCurveTo(-18, 46 - dy, 0, 49 - dy); q.quadraticCurveTo(18, 46 - dy, 36, 55 - dy);
    q.quadraticCurveTo(40, 62 - dy, 50, 58 - dy); q.bezierCurveTo(72, 48 - dy, 82, 24 - dy, 84, -2 - dy); q.lineTo(130, -30); q.lineTo(130, 240); q.lineTo(-130, 240); q.closePath(); return q; };
  const faceFx = (g, phase, { hp }) => { if (phase !== 'head') return;  // the stubble
    g.save(); g.clip(hp); for (const [dy, a] of [[12, 0.09], [6, 0.11], [0, 0.13]]) { g.fillStyle = rgba('#2A2420', a); g.fill(beardLine(dy)); } g.restore(); };
  return { ...fh0, faceFx };
};
CAST.cantona = head('buzz', [1.0, 1.08, 0.97], '#3A2F28', { skin: SKIN_T, brow: '#1A1410', ...cantonaHead('#3A2F28') });
CAST.cantonaT = CAST.cantona;  // in a tracksuit
CAST.cantonaS = CAST.cantona;  // in a dark jacket
CAST.shaw = head('buzz', [0.97, 1.05, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', ...fullHair('#120D0A') });
CAST.pal1 = head('buzz', [0.97, 1.06, 0.91], '#2A1E16', { skin: SKIN_L, ...fullHair('#2A1E16') });
CAST.mu1 = head('buzz', [0.97, 1.05, 0.91], '#4A3424', { skin: SKIN_L, ...fullHair('#4A3424') });
CAST.ref = head('buzz', [0.98, 1.06, 0.92], '#1A1410', { skin: SKIN_L, ...fullHair('#1A1410') });
CAST.staff = head('buzz', [0.98, 1.06, 0.92], '#75716C', { skin: SKIN_L, brow: '#4E4B47', ...fullHair('#75716C') });
CAST.fanA = head('buzz', [0.97, 1.05, 0.91], '#3A2A1E', { skin: SKIN_L, ...fullHair('#3A2A1E') });
CAST.fan1 = head('buzz', [0.98, 1.06, 0.92], '#5A4030', { skin: SKIN_L, ...fullHair('#5A4030') });
CAST.fan2 = head('buzz', [0.96, 1.04, 0.9], '#1E1612', { skin: SKIN_T, ...fullHair('#1E1612') });
CAST.fan3 = head('buzz', [0.98, 1.05, 0.92], '#B8B2A8', { skin: SKIN_L, brow: '#7A746C', ...fullHair('#B8B2A8') });
CAST.fan4 = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_M, brow: '#0E0A08', ...fullHair('#120D0A') });
CAST.kid1 = head('buzz', [0.96, 1.0, 0.9], '#5A4030', { skin: SKIN_L, ...fullHair('#5A4030') });
CAST.kid2 = head('buzz', [0.96, 1.0, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', ...fullHair('#120D0A') });
CAST.kid3 = head('buzz', [0.96, 1.0, 0.9], '#C89A5A', { skin: SKIN_L, brow: '#9A7448', ...fullHair('#C89A5A') });
CAST.snap = head('buzz', [0.98, 1.06, 0.92], '#2A1E16', { skin: SKIN_L, ...fullHair('#2A1E16') });
const CANTONA = mk('cantona', MUN, 7, 1.88), CANTONA_T = mk('cantonaT', TRACK, null, 1.88), CANTONA_S = mk('cantonaS', SUITK, null, 1.88);
const SHAW = mk('shaw', CPFC, 2, 1.78), REF = mk('ref', REFK, null, 1.8), KITMAN = mk('staff', STAFF, null, 1.74), FAN = mk('fanA', FANJ, null, 1.8), STEW = mk('fan2', STEWARD, null, 1.76);
const PALS = [mk('pal1', CPFC, 5, 1.83), mk('fan4', CPFC, 6, 1.8), mk('pal1', CPFC, 11, 1.75), mk('fan2', CPFC, 8, 1.78)];
const MUS = [mk('mu1', MUN, 4, 1.83), mk('fan2', MUN, 11, 1.75), mk('fan4', MUN, 16, 1.8)];
// the fans at the front of the stand, as in the photograph: coats and jackets, a red one, a beige one, Palace scarves
const FANS = [[mk('fan1', plain('#C8302C', '#2A2D34'), null, 1.78), PRED], [mk('fan3', plain('#CFC6B0', '#5A5850'), null, 1.76), null], [mk('fan2', plain('#2A2D34', '#22252B'), null, 1.8), PBLUE],
  [mk('fan4', plain('#6A2A30', '#2A2D34'), null, 1.75), PRED], [mk('fan1', plain('#3A3E48', '#22252B'), null, 1.82), null], [mk('fan3', plain('#8A1E28', '#2A2D34'), null, 1.72), PBLUE],
  [mk('fan2', plain('#4A4E58', '#2A2D34'), null, 1.79), PRED], [mk('fan1', plain('#2E3A30', '#22252B'), null, 1.77), null]];
const KIDS = [mk('kid1', kidKit('#F28C28'), null, 1.38, { headScale: 1.12 }), mk('kid2', kidKit('#2E7DD8'), null, 1.42, { headScale: 1.12 }), mk('kid3', kidKit('#F28C28'), null, 1.32, { headScale: 1.12 }),
  mk('kid2', kidKit('#2E7DD8'), null, 1.36, { headScale: 1.12 }), mk('kid1', kidKit('#F28C28'), null, 1.44, { headScale: 1.12 }), mk('kid3', kidKit('#2E7DD8'), null, 1.34, { headScale: 1.12 })];
const SNAPS = [mk('snap', plain('#3A3E48', '#2A2D34'), null, 1.78), mk('fan2', plain('#5A4A3A', '#2A2D34'), null, 1.8), mk('fan3', plain('#2A2D34', '#22252B'), null, 1.75), mk('fan4', plain('#6A6E78', '#2A2D34'), null, 1.82)];

// ---------- Selhurst Park at night: a crowd in Palace red and blue, dark winter coats; the boards
const FLAG_CPFC = g => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? PBLUE : PRED; g.fillRect(i / 4, 0, 1 / 4 + 0.01, 1); } };
const CROWD_SP = [[PRED, 20], [PBLUE, 16], ['#2A3040', 24], ['#4A5266', 14], ['#CFC6B0', 8], ['#F2F0EA', 8], ['#6A2A30', 6], ['#17181B', 4]];
const ARENA_SP = new Stadium({ seed: 95, density: 1, flags: 5, flagSet: [FLAG_CPFC], haze: '#3A4562', cloth: CROWD_SP, rc: 26 });
const BOARDS_SP = [boardDesign('SELHURST PARK', { bg: PRED, ink: '#FFFFFF' }), boardDesign('25 JANUARY 1995'), boardDesign('PREMIER LEAGUE', { bg: PBLUE, ink: '#FFFFFF' }), boardDesign('CRYSTAL PALACE', { bg: PRED, ink: '#FFFFFF' })];
const SKY_N = { zen: '#070B1A', mid: '#111B36', hor: '#2E3A5C', clouds: 0.12, cloud: '#2C3652', seed: 3 };
const SKY_DAY = { zen: '#4A7EB8', mid: '#8EB4DA', hor: '#E4ECEC', clouds: 0.45, cloud: '#FFFFFF', seed: 12 };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { cheer = 0, blur = 0, boards = BOARDS_SP, goals = true, front = null } = {}) {
  const back = c => { sky(c, B, { t, ...SKY_N }); ARENA_SP.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF_N });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...(goals ? [...goalItems(B, -1, { t }), ...goalItems(B, 1, { t })] : []), ...(boards.length ? boardItems(B, boards) : []), ...(front ? front(t) : []), ...items]);
}

// ---------- the coda: Old Trafford on the day of the trophy, 11 May 1997, in daylight. United at home in red shirts,
// white shorts and black socks (the exact trim of that shirt's collar was not checked); the crowd in red, white and black
const MUH = { shirt: '#D0202A', shirtD: '#A8161E', trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: '#F4F4F2', socks: '#17181B', band: '#D0202A', boots: '#0E0F12', badge: '#E8C23A' };
// No turned-up collar, in the last shot either. The author asked for it there («as he walks away with his collar up»), saw it
// drawn from behind (a band of the shirt round the neck) and had it taken out: «Remove this collar i dont like it an final».
// He walks away in the shirt's basic neckline, like everywhere else (rule 72)
const CANTONA_R = mk('cantona', MUH, 7, 1.88, { arms: 1.3 }), CANTONA_H = mk('cantona', MUH, 7, 1.88);  // longer arms for the cup: it has to clear his head
const MUR = [mk('mu1', MUH, 16, 1.8), mk('fan2', MUH, 11, 1.75), mk('fan4', MUH, 2, 1.8), mk('pal1', MUH, 10, 1.83)];
const FLAG_MUFC = g => { g.fillStyle = '#D0202A'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 0.38, 1, 0.24); };  // red with a white bar (three upright bands read as a tricolour)
const CROWD_OT = [['#D0202A', 34], ['#F4F4F2', 14], ['#17181B', 10], ['#8A1E28', 10], ['#3A4050', 14], ['#CFC6B0', 8], ['#E8C23A', 3]];
const ARENA_OT = new Stadium({ seed: 97, density: 1, flags: 8, flagSet: [FLAG_MUFC], haze: '#B8C6D2', cloth: CROWD_OT, rc: 26 });
const BOARDS_OT = [boardDesign('OLD TRAFFORD', { bg: '#D0202A', ink: '#FFFFFF' }), boardDesign('11 MAY 1997'), boardDesign('CHAMPIONS 1996-97', { bg: '#17181B', ink: '#E8C23A' }), boardDesign('MANCHESTER UNITED', { bg: '#D0202A', ink: '#FFFFFF' })];
function oldTrafford(g, t, items = [], { cheer = 1, blur = 0, boards = BOARDS_OT } = {}) {
  const back = c => { sky(c, B, { t, ...SKY_DAY }); ARENA_OT.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...(boards.length ? boardItems(B, boards) : []), ...items]);
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
function calPage(g, x, y, w, h, [d, m], { dark = 0 } = {}) {
  g.fillStyle = '#F6F3EC'; g.fillRect(x, y, w, h);
  g.fillStyle = mix(CRED, '#3A3A40', dark); g.fillRect(x, y, w, h * 0.22);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = sans(Math.round(h * 0.11), 900); g.letterSpacing = '8px'; g.fillStyle = '#FFFFFF'; g.fillText(m, x + w / 2 + 4, y + h * 0.115); g.letterSpacing = '0px';
  g.font = sans(Math.round(h * 0.5), 900); g.fillStyle = mix('#1A1C22', CRED, dark * 0.0); g.fillText(String(d), x + w / 2, y + h * 0.56);
  g.font = sans(Math.round(h * 0.075), 800); g.letterSpacing = '6px'; g.fillStyle = '#6A6E78'; g.fillText('1995', x + w / 2 + 3, y + h * 0.88); g.letterSpacing = '0px';
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
const poly = (g, pts, fill) => { if (B.poly(g, pts)) { g.fillStyle = fill; g.fill(); } };

// ---------- this film's faces and poses
const SNEER = { ...EXPR.angry, open: 0.12, curve: -0.2, brow: 0.7, browY: 6, lid: 0.3 };  // Cantona's stare
const PROUD = { ...EXPR.smug, lid: 0.38, curve: 0.18, look: [0, -0.1] };
const SHOUT = { ...EXPR.angry, open: 0.85, mouth: 'o', brow: 0.9, browY: 10, lid: 0.1, noBlink: true };
const SHOCK = { ...EXPR.shock, sweat: 0 };
const RAGE = { ...EXPR.angry, open: 0.3, curve: -0.4, brow: 1, browY: 10, lid: 0.02, noBlink: true };  // Cantona going at the man
const CHIN = { ...POSE.stand(), sh: [[0.1, 0.13], [0.1, 0.13]], el: [0.26, 0.26], lean: -0.07, look: 0.22 };  // chest out, chin up
// in the air over the barrier, feet first: the right leg straight out at the man's chest, the left folded under, the body
// thrown back, the left arm up (as in the photograph). The legs are set in the world, the arms with the body
const KICK_AIR = { hip: [[0.85, 0.12], [1.66, 0.04]], knee: [1.5, 0.1], sh: [[2.97, 0.4], [-0.08, 0.38]], el: [0.35, 0.5], lean: -0.62, ground: false, look: 0.15 };
const SEATED = { hip: [[1.5, 0.12], [1.5, 0.12]], knee: [1.52, 1.52], sh: [[0.95, 0.16], [0.95, 0.16]], el: [0.95, 0.95], lean: 0.08, pelvisY: 0.5, ground: false, look: 0 };
const CARD_UP = { ...POSE.stand(), sh: [[2.9, 0.3], [0.15, 0.12]], el: [0.06, 0.3], fingers: false, look: 0.1 };  // the arm on the camera's side
const POINTING = { ...POSE.stand(), sh: [[0.1, 0.1], [1.45, 0.05]], el: [0.3, 0.15], point: [false, true], lean: 0.12 };
const SNAPPING = { ...POSE.stand(), sh: [[1.1, 0.42], [1.1, 0.42]], el: [2.0, 2.0], lean: 0.04 };  // a camera held up to the face
const CLAP = { ...POSE.stand(), sh: [[0.75, 0.05], [0.75, 0.05]], el: [1.2, 1.2], fingers: true };
const quadImg = (g, img, tl, tr, bl) => { const a = B.project(...tl), b = B.project(...tr), c = B.project(...bl); if (a.z < 0.2 || b.z < 0.2 || c.z < 0.2) return;
  g.save(); g.transform((b.x - a.x) / img.width, (b.y - a.y) / img.width, (c.x - a.x) / img.height, (c.y - a.y) / img.height, a.x, a.y); g.drawImage(img, 0, 0); g.restore(); };
// ---------- the front of the stand at Selhurst Park, as in the photograph: the red advertising board, the rail along its
// top, the fans standing on the steps behind it in their coats and scarves. The touchline is at z = -34, the boards
// (boardItems) at z = -38; six steps rise behind them to the foot of the stand. An aisle (a stairway, yellow-edged) comes
// down through them at x = gap: the man who shouts runs down it to the rail
const RAILZ = -38.35, ROWZ = r => -38.95 - r * 0.72, ROWY = r => 0.32 + r * 0.42, NROWS = 6;
function steps(x0, x1, gap = null) {  // the concrete terraces, the highest first (each step's tread, then its riser)
  return { d: 1e8, draw: g => { for (let r = NROWS - 1; r >= 0; r--) { const z0 = ROWZ(r) + 0.36, z1 = z0 - 0.72, y = ROWY(r);
    poly(g, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], r % 2 ? '#56585E' : '#5E6066');
    poly(g, [[x0, y - 0.42, z0], [x1, y - 0.42, z0], [x1, y, z0], [x0, y, z0]], '#3E4046');
    if (gap != null) { poly(g, [[gap - 0.8, y + 0.004, z0], [gap + 0.8, y + 0.004, z0], [gap + 0.8, y + 0.004, z1], [gap - 0.8, y + 0.004, z1]], '#70727A');
      poly(g, [[gap - 0.8, y - 0.42, z0 + 0.004], [gap + 0.8, y - 0.42, z0 + 0.004], [gap + 0.8, y, z0 + 0.004], [gap - 0.8, y, z0 + 0.004]], '#4A4C54');
      poly(g, [[gap - 0.8, y - 0.07, z0 + 0.008], [gap + 0.8, y - 0.07, z0 + 0.008], [gap + 0.8, y, z0 + 0.008], [gap - 0.8, y, z0 + 0.008]], '#D8B42A');
      poly(g, [[gap - 0.8, y + 0.006, z0], [gap + 0.8, y + 0.006, z0], [gap + 0.8, y + 0.006, z0 - 0.08], [gap - 0.8, y + 0.006, z0 - 0.08]], '#D8B42A'); } } } };
}
function railItem(x0, x1) {
  return { get d() { return depth((x0 + x1) / 2, 1.15, RAILZ) - 0.05; }, draw: g => {
    const tube = (a, b, w, col) => { const p = B.project(...a), q = B.project(...b); if (p.z < 0.3 || q.z < 0.3) return; g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = Math.max(2, w * (p.s + q.s) / 2); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); };
    for (let x = Math.ceil(x0 / 2.5) * 2.5; x <= x1; x += 2.5) tube([x, 0.95, RAILZ], [x, 1.2, RAILZ], 0.045, '#6E7076');
    tube([x0, 1.2, RAILZ], [x1, 1.2, RAILZ], 0.05, '#8A8C92'); tube([x0, 1.21, RAILZ], [x1, 1.21, RAILZ], 0.018, 'rgba(255,255,255,0.35)'); } };
}
// the fans on the steps, each at his own place along the stand (x in metres, the same in every shot); crowdFront draws those
// within `span` of cx. mood 0..1: jeering (fists up) once Cantona is sent off; shock after the kick
const FANSPOTS = (() => { const r = rng(1995), out = [];
  for (let row = 0; row < NROWS; row++) for (let i = 0; i < 36; i++) out.push({ row, x: -9 + i * 1.0 + (row % 2) * 0.5 + (r() - 0.5) * 0.3, k: Math.floor(r() * FANS.length), ph: r() * 9, arm: r() });
  return out; })();
function crowdFront(t, cx, { span = 7, gap = null, rows = NROWS, mood = 0, shock = 0 } = {}) {
  const items = [steps(cx - span - 2, cx + span + 2, gap), railItem(cx - span - 2, cx + span + 2)];
  for (const s of FANSPOTS) { if (Math.abs(s.x - cx) > span || s.row >= rows) continue;
    if (gap != null && s.x - gap > (s.row ? -1.0 : -0.8) && s.x - gap < (s.row ? 1.0 : 2.4)) continue;  // the aisle, and the landing at its foot (the first row, where he comes over)
    const [pl, scarf] = FANS[s.k], near = gap != null && s.row < 3 && Math.abs(s.x - gap) < 2.6, up = !near && s.arm < 0.35 * mood ? 1 : 0, jeer = Math.abs(Math.sin(t * 5 + s.ph));
    const arms = shock > 0 ? { sh: [[1.6 + 0.5 * s.arm, 0.4], [1.4, 0.35]], el: [1.4, 1.5] } : up ? { sh: [[2.4 + 0.3 * jeer, 0.5], [0.3, 0.2]], el: [0.4, 0.3], fingers: false } : { sh: [[0.15, 0.12], [0.15, 0.12]], el: [0.3, 0.3] };
    const e = shock > 0 ? SHOCK : up ? SHOUT : s.arm < 0.5 ? 'angry' : 'focus';
    items.push(man(t, pl, s.x, ROWZ(s.row), PI / 2 + (s.arm - 0.5) * 0.5, { ...arms, lift: ROWY(s.row), lean: shock > 0 ? -0.12 : 0.03, look: 0.1 }, e, s.ph, { shadow: { r: 0.01 } }));
    if (scarf) { const it = items[items.length - 1]; items.push(scarfItem(it, scarf)); } }
  return items;
}
// a striped scarf round a fan's neck, drawn just in front of him
function scarfItem(it, col) {
  return { get d() { return it.d - 0.02; }, draw: g => { const sk = it.sk; if (!sk) return; const n = B.project(...sk.neck), c = B.project(...sk.C); if (n.z < 0.3) return;
    const w = 0.2 * n.s, h = 0.09 * n.s; g.save(); g.translate(n.x, n.y + 0.04 * n.s);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#F2F0EA' : col; g.fillRect(-w / 2 + i * w / 4, -h / 2, w / 4 + 1, h); }
    g.fillStyle = col; g.fillRect(-w * 0.32, h / 2, w * 0.18, Math.max(4, (c.y - n.y) * 0.8)); g.restore(); } };
}
// the referee's red card, held up in his raised hand
function cardItem(it) {
  return { get d() { return it.d - 0.03; }, draw: g => { const sk = it.sk; if (!sk) return; const h = B.project(...sk.arms[0].hand); if (h.z < 0.3) return;
    const w = 0.115 * h.s, hh = 0.16 * h.s; g.save(); g.translate(h.x, h.y - hh * 0.45); g.rotate(0.12);
    g.shadowColor = 'rgba(255,40,40,0.8)'; g.shadowBlur = 0.12 * h.s; g.fillStyle = '#E2201E'; g.fillRect(-w / 2, -hh / 2, w, hh); g.restore(); } };
}
// a speech bubble of symbols over the man shouting (what he shouted is disputed: no words, SOURCES.md)
function abuseBubble(g, p, a, k = 1, D = -150) {  // D: the bubble sits to one side of the head (over the aisle, clear of the faces behind)
  if (a <= 0 || p.z < 0.3) return;
  g.save(); g.globalAlpha *= a; g.translate(p.x, p.y); g.scale(k, k);
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#141018'; g.lineWidth = 10; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(D - 170, -230); g.quadraticCurveTo(D - 190, -330, D - 60, -340); g.quadraticCurveTo(D + 80, -360, D + 170, -300); g.quadraticCurveTo(D + 220, -230, D + 120, -200);
  g.lineTo(D + 110, -197); g.lineTo(0, -120); g.lineTo(D + 60, -195); g.quadraticCurveTo(D - 160, -180, D - 170, -230); g.closePath(); g.stroke(); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; ink(g, '#@%&!', D, -268, sans(84, 900), '#E2201E', 10, '#141018');
  g.restore();
  qaRect(g, p.x + (D - 180) * k, p.y - 350 * k, 360 * k, 240 * k, 'text', 'abuse bubble');
}
// the FA's ban on a tear-off calendar: the last day of each month from 25 January to 30 September 1995
const PAGES = [[25, 'JANUARY'], [28, 'FEBRUARY'], [31, 'MARCH'], [30, 'APRIL'], [31, 'MAY'], [30, 'JUNE'], [31, 'JULY'], [31, 'AUGUST'], [30, 'SEPTEMBER']];
// ---------- the magistrates' court in Croydon (a court building in general: columns and steps, not the real one): a world at
// x = 1200. Four steps rise from the pavement (z = 2.2) to the landing under the columns (y = 0.72); the doors at z = 6
const CX = 1200, COURT_Y = z => clamp((z - 2.2) / 2.4) * 0.72;
function courthouse(g, t) {
  sky(g, B, { t, zen: '#7E92AA', mid: '#AEBCCA', hor: '#D8DDDE', clouds: 0.7, cloud: '#EEF0F0', seed: 9 });
  poly(g, [[CX - 80, 0, -40], [CX + 80, 0, -40], [CX + 80, 0, 30], [CX - 80, 0, 30]], '#8E8C88');  // the pavement
  poly(g, [[CX - 80, 0.01, -40], [CX + 80, 0.01, -40], [CX + 80, 0.01, -14], [CX - 80, 0.01, -14]], '#5E5E62');  // the road
  const wall = '#C9BFA8', dark = '#A89E88';
  poly(g, [[CX - 16, 0, 6], [CX + 16, 0, 6], [CX + 16, 14, 6], [CX - 16, 14, 6]], wall);  // the facade
  for (let fx = -14; fx <= 12; fx += 4) for (const fy of [8.6, 11.3]) poly(g, [[CX + fx, fy, 5.98], [CX + fx + 1.8, fy, 5.98], [CX + fx + 1.8, fy + 1.8, 5.98], [CX + fx, fy + 1.8, 5.98]], '#5A6270');
  poly(g, [[CX - 2.45, 0.72, 5.985], [CX + 2.45, 0.72, 5.985], [CX + 2.45, 4.65, 5.985], [CX - 2.45, 4.65, 5.985]], '#A89E88');  // the doorway and its doors, in wood
  poly(g, [[CX - 2.2, 0.72, 5.98], [CX + 2.2, 0.72, 5.98], [CX + 2.2, 4.4, 5.98], [CX - 2.2, 4.4, 5.98]], '#6E4C34');
  for (const sd of [-1, 1]) for (const [y0, y1] of [[1.05, 2.0], [2.2, 3.15], [3.35, 4.1]]) poly(g, [[CX + sd * 0.35, y0, 5.975], [CX + sd * 1.85, y0, 5.975], [CX + sd * 1.85, y1, 5.975], [CX + sd * 0.35, y1, 5.975]], '#5C3E2A');
  poly(g, [[CX - 0.04, 0.72, 5.97], [CX + 0.04, 0.72, 5.97], [CX + 0.04, 4.4, 5.97], [CX - 0.04, 4.4, 5.97]], '#3A2618');
  for (const sd of [-1, 1]) poly(g, [[CX + sd * 0.14, 2.45, 5.968], [CX + sd * 0.24, 2.45, 5.968], [CX + sd * 0.24, 2.75, 5.968], [CX + sd * 0.14, 2.75, 5.968]], '#C8A04A');
  poly(g, [[CX - 12, 0.72, 4.6], [CX + 12, 0.72, 4.6], [CX + 12, 0.72, 6], [CX - 12, 0.72, 6]], '#D2CAB8');  // the landing
  for (let c = -5; c <= 5; c += 2) { const x = CX + c * 1.9; poly(g, [[x - 0.45, 0.72, 4.7], [x + 0.45, 0.72, 4.7], [x + 0.45, 7.2, 4.7], [x - 0.45, 7.2, 4.7]], '#E2DACA'); poly(g, [[x + 0.45, 0.72, 4.7], [x + 0.6, 0.72, 5.4], [x + 0.6, 7.2, 5.4], [x + 0.45, 7.2, 4.7]], dark); }
  poly(g, [[CX - 12.5, 7.2, 4.5], [CX + 12.5, 7.2, 4.5], [CX + 12.5, 8.0, 4.5], [CX - 12.5, 8.0, 4.5]], '#D8D0BE');  // the entablature (no lettering: the plate names the court)
  poly(g, [[CX - 12.5, 8.0, 4.5], [CX + 12.5, 8.0, 4.5], [CX, 10.6, 4.5]], '#CFC7B4');
  for (let s = 3; s >= 0; s--) { const z0 = 2.2 + s * 0.6, y = s * 0.18;  // the steps, the highest first
    poly(g, [[CX - 12, y + 0.18, z0], [CX + 12, y + 0.18, z0], [CX + 12, y + 0.18, z0 + 0.6], [CX - 12, y + 0.18, z0 + 0.6]], '#D2CAB8');
    poly(g, [[CX - 12, y, z0], [CX + 12, y, z0], [CX + 12, y + 0.18, z0], [CX - 12, y + 0.18, z0]], '#B4AC9C'); }
}
// a camera held up by a photographer, and its flash now and then
function snapItem(it, t, ph) {
  return { get d() { return it.d - 0.04; }, draw: g => { const sk = it.sk; if (!sk) return; const a = B.project(...sk.arms[0].hand), b = B.project(...sk.arms[1].hand); if (a.z < 0.3) return;
    const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2, s = a.s; g.fillStyle = '#1A1B1F'; g.fillRect(x - 0.09 * s, y - 0.06 * s, 0.18 * s, 0.11 * s);
    const f = (t * 1.7 + ph) % 2.3; if (f < 0.09) { const gr = g.createRadialGradient(x, y - 0.08 * s, 0, x, y - 0.08 * s, 0.9 * s); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y - 0.08 * s, 0.9 * s, 0, 2 * PI); g.fill(); } } };
}
// ---------- the training ground (community service, coaching children): a world at x = -1200, a pitch in the daytime,
// a hedge and trees along its far side
const TX = -1200;
function trainingGround(g, t, items) {
  sky(g, B, { t, ...SKY_DAY });
  poly(g, [[TX - 200, 0, -200], [TX + 200, 0, -200], [TX + 200, 0, 200], [TX - 200, 0, 200]], '#5E9A48');
  for (let i = -8; i <= 8; i++) poly(g, [[TX + i * 6, 0.005, -40], [TX + i * 6 + 3, 0.005, -40], [TX + i * 6 + 3, 0.005, 40], [TX + i * 6, 0.005, 40]], '#68A650');
  for (let i = 0; i < 30; i++) { const x = TX - 50 + i * 3.4, p = B.project(x, 0, 24), q = B.project(x, 4 + (i % 3), 24); if (p.z < 0.5) continue;
    g.fillStyle = i % 2 ? '#3E6A34' : '#4A7A3E'; g.beginPath(); g.arc(q.x, q.y, 2.6 * q.s, 0, 2 * PI); g.fill(); }
  poly(g, [[TX - 70, 0, 22], [TX + 70, 0, 22], [TX + 70, 1.6, 22], [TX - 70, 1.6, 22]], '#3A5E30');  // the hedge
  for (const [x, z] of [[TX - 0.2, 1.9], [TX + 1.0, 2.3], [TX + 2.2, 1.9], [TX + 3.4, 2.3]]) { const p = B.project(x, 0, z), q = B.project(x, 0.3, z); if (p.z < 0.3) continue;  // cones
    g.fillStyle = '#F07A1C'; g.beginPath(); g.moveTo(p.x - 0.1 * p.s, p.y); g.lineTo(p.x + 0.1 * p.s, p.y); g.lineTo(q.x, q.y); g.closePath(); g.fill(); }
  for (const it of items) it.shadow?.(g);
  drawSorted(g, items);
}
// ---------- the press-conference room: a world at x = 1500. A dark backdrop, a table with a pale cloth and a row of
// microphones, the chair; the camera stands among the photographers at z < 0, looking +z
const RX = 1500;
function pressBack(g, t) {
  g.fillStyle = '#10141E'; g.fillRect(0, 0, W, H);
  poly(g, [[RX - 12, -1, 4], [RX + 12, -1, 4], [RX + 12, 6, 4], [RX - 12, 6, 4]], '#1C2436');
  poly(g, [[RX - 3.2, 0.9, 3.98], [RX + 3.2, 0.9, 3.98], [RX + 3.2, 3.4, 3.98], [RX - 3.2, 3.4, 3.98]], '#24304A');  // the backdrop panel
  for (let r = 0; r < 6; r++) for (let c = -7; c <= 7; c++) { const x = RX + c * 0.44 + (r % 2) * 0.22, y = 1.0 + r * 0.4;  // its blank tiles
    poly(g, [[x - 0.15, y, 3.97], [x + 0.15, y, 3.97], [x + 0.15, y + 0.16, 3.97], [x - 0.15, y + 0.16, 3.97]], (r + c) % 2 ? '#2C3A58' : '#293552'); }
  poly(g, [[RX - 12, 0, -6], [RX + 12, 0, -6], [RX + 12, 0, 4], [RX - 12, 0, 4]], '#2A2622');  // the floor
  poly(g, [[RX - 0.35, 0.47, 2.2], [RX + 0.35, 0.47, 2.2], [RX + 0.35, 1.25, 2.7], [RX - 0.35, 1.25, 2.7]], '#2E2A26');  // the chair's back
}
function pressTable(t) {  // drawSorted leaves out anything nearer than 0.3: the table's depth is its own, a little nearer than the man
  return { get d() { return Math.max(0.31, depth(RX, 0.5, 1.2) - 0.3); }, draw: g => {
    poly(g, [[RX - 1.6, 0.76, 1.2], [RX + 1.6, 0.76, 1.2], [RX + 1.6, 0.76, 2.0], [RX - 1.6, 0.76, 2.0]], '#D2CCBE');
    poly(g, [[RX - 1.6, 0, 1.2], [RX + 1.6, 0, 1.2], [RX + 1.6, 0.76, 1.2], [RX - 1.6, 0.76, 1.2]], '#9E988C');
    const mics = [[-0.62, '#C8202C'], [-0.32, '#1E4CA0'], [-0.05, '#2A2D34'], [0.22, '#E2B93B'], [0.5, '#2E7D3A'], [0.74, '#F4F4F2']];
    for (const [dx, col] of mics) { const b = B.project(RX + dx, 0.76, 1.42), tp = B.project(RX + dx * 0.55, 1.08, 1.72); if (b.z < 0.3) continue;
      g.strokeStyle = '#1A1B1F'; g.lineWidth = Math.max(2, 0.018 * b.s); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(tp.x, tp.y); g.stroke();
      g.fillStyle = col; g.beginPath(); g.ellipse(tp.x, tp.y, 0.045 * tp.s, 0.06 * tp.s, 0, 0, 2 * PI); g.fill(); }
    const gl = B.project(RX + 0.42, 0.76, 1.85), gt = B.project(RX + 0.42, 0.9, 1.85);  // a glass of water
    if (gl.z > 0.3) { g.fillStyle = 'rgba(200,220,240,0.55)'; g.fillRect(gl.x - 0.03 * gl.s, gt.y, 0.06 * gl.s, gl.y - gt.y); } } };
}
// the photographers: dark heads along the bottom of the picture, their flashes among them (each lights the room a little)
function pressHeads(g) { g.fillStyle = 'rgba(6,8,12,0.94)'; for (let i = 0; i < 7; i++) { const x = 60 + i * 160 + (i % 2) * 40, y = H - 120 + (i % 3) * 30; g.beginPath(); g.ellipse(x, y, 92, 110, 0, 0, 2 * PI); g.fill(); g.fillRect(x - 150, y + 60, 300, 400); } }
function pressFlashes(g, t, n = 6, rate = 1) {
  for (let i = 0; i < n; i++) { const f = (t * 1.3 * rate + i * 0.37) % 1.9; if (f > 0.07) continue; const x = W * (0.08 + 0.84 * ((i * 0.618) % 1)), y = H * (0.885 + 0.05 * ((i * 0.37) % 1));
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(x, y, 0, x, y, 170); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 170, y - 170, 340, 340); }
}
// ---------- the words, as a picture: a trawler at sea, the seagulls following it, the sardines thrown over the side
const GULLS = Array.from({ length: 18 }, (_, i) => { const r = rng(70 + i); return { dx: 60 - r() * 760, dy: -150 - r() * 520, ph: r() * 9, s: 0.8 + r() * 0.8, sp: 5 + r() * 3 }; });
function seaScene(g, t, { x = 0, z = 1, fish = 0, lt = 0 } = {}) {
  const HY = H * 0.5, sk = g.createLinearGradient(0, 0, 0, HY); sk.addColorStop(0, '#5E7A98'); sk.addColorStop(0.7, '#B8C6CE'); sk.addColorStop(1, '#E2E0D2'); g.fillStyle = sk; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, HY); g.scale(z, z); g.translate(-W / 2 - x, -HY);
  const sea = g.createLinearGradient(0, HY, 0, H); sea.addColorStop(0, '#3E5E72'); sea.addColorStop(1, '#16283A'); g.fillStyle = sea; g.fillRect(-W, HY, 3 * W, H);
  g.strokeStyle = 'rgba(230,240,245,0.22)'; g.lineWidth = 3;
  for (let i = 0; i < 80; i++) { const y = HY + 20 + Math.pow(i / 80, 1.6) * H * 0.5, xx = ((i * 137 + t * (20 + i * 2)) % (W * 2)) - W / 2; g.beginPath(); g.moveTo(xx, y); g.quadraticCurveTo(xx + 30 + i, y - 4, xx + 60 + 2 * i, y); g.stroke(); }
  // the trawler: dark red hull, white wheelhouse, a mast with its booms, sailing to the right
  const K0 = 1.25, bx = W * 0.64 + lt * 26, by = HY + 58, bob = Math.sin(t * 1.4) * 6;
  // the wake behind it
  g.fillStyle = 'rgba(240,246,248,0.35)'; g.beginPath(); g.moveTo(bx - 300, by + 20); g.quadraticCurveTo(bx - 640, by + 44, bx - 1100, by + 96); g.lineTo(bx - 1100, by + 150); g.quadraticCurveTo(bx - 640, by + 80, bx - 280, by + 44); g.closePath(); g.fill();
  g.save(); g.translate(bx, by + bob); g.rotate(Math.sin(t * 1.1) * 0.02); g.scale(K0, K0);
  g.fillStyle = '#7A1E22'; g.beginPath(); g.moveTo(-230, -30); g.lineTo(200, -40); g.lineTo(250, -80); g.lineTo(230, 10); g.quadraticCurveTo(0, 40, -210, 20); g.closePath(); g.fill();
  g.fillStyle = '#2A2422'; g.fillRect(-226, -36, 470, 12);
  g.fillStyle = '#F2F0EA'; g.fillRect(40, -150, 120, 112); g.fillStyle = '#3A4A5A'; for (let i = 0; i < 3; i++) g.fillRect(52 + i * 36, -136, 24, 26);
  g.strokeStyle = '#2A2422'; g.lineWidth = 7; g.beginPath(); g.moveTo(-60, -40); g.lineTo(-60, -320); g.moveTo(-60, -280); g.lineTo(-220, -120); g.moveTo(-60, -280); g.lineTo(120, -150); g.stroke();
  g.restore();
  // the sardines thrown over the stern
  if (fish > 0) for (let i = 0; i < 9; i++) { const u = ((t * 0.9 + i / 9) % 1), fx = bx - 230 * K0 - 6 - u * 290 - i * 8, fy = by - 70 - Math.sin(PI * u) * 240 + u * 170;
    g.save(); g.globalAlpha *= fish * (1 - u * 0.3); g.translate(fx, fy); g.rotate(-0.8 + u * 1.8); g.fillStyle = '#DCE6EE'; g.beginPath(); g.ellipse(0, 0, 38, 12, 0, 0, 2 * PI); g.fill(); g.beginPath(); g.moveTo(-34, 0); g.lineTo(-58, -15); g.lineTo(-58, 15); g.closePath(); g.fill();
    g.fillStyle = '#7E93A8'; g.beginPath(); g.ellipse(0, -5, 34, 5, 0, PI, 2 * PI); g.fill(); g.fillStyle = '#22303E'; g.beginPath(); g.arc(24, -2, 3, 0, 2 * PI); g.fill(); g.restore(); }
  // the seagulls, following
  for (const gl of GULLS) { const gx = bx + gl.dx + Math.sin(t * 0.8 + gl.ph) * 40, gy = by + gl.dy + Math.sin(t * 1.3 + gl.ph) * 24, f = Math.sin(t * gl.sp + gl.ph), s = 40 * gl.s;
    g.strokeStyle = '#F4F4F2'; g.lineWidth = 8 * gl.s; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(gx - s, gy - f * s * 0.6); g.quadraticCurveTo(gx - s * 0.4, gy - s * 0.5 - f * s * 0.2, gx, gy); g.quadraticCurveTo(gx + s * 0.4, gy - s * 0.5 - f * s * 0.2, gx + s, gy - f * s * 0.6); g.stroke();
    g.strokeStyle = '#3A3E46'; g.lineWidth = 3.5 * gl.s; g.beginPath(); g.moveTo(gx - s, gy - f * s * 0.6); g.lineTo(gx - s * 0.75, gy - f * s * 0.45); g.moveTo(gx + s, gy - f * s * 0.6); g.lineTo(gx + s * 0.75, gy - f * s * 0.45); g.stroke(); }
  g.restore();
}
// the photograph of the kick (sent by the author): a band across the frame, its top and bottom edges fading into a dark
// blurred copy of itself
function photoBand(g, img, band, t0, t, { y = 520, h = 900, fx0 = 0.36, fx1 = 0.5, z0 = 1.0, z1 = 1.1, dur = 2.4 } = {}) {
  const u = glide(clamp((t - t0) / dur)), z = lerp(z0, z1, u), fx = lerp(fx0, fx1, u);
  g.fillStyle = '#05070B'; g.fillRect(0, 0, W, H);
  g.save(); g.filter = 'blur(28px) brightness(0.45)'; photoIn(g, img, -80, -80, W + 160, H + 160, { fx: 0.4, fy: 0.5 }); g.restore();
  const b = band.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, h);
  photoIn(b, img, 0, 0, W, h, { z, fx, fy: 0.5 });
  b.globalCompositeOperation = 'destination-in'; const gr = b.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.1, 'rgba(0,0,0,1)'); gr.addColorStop(0.9, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = gr; b.fillRect(0, 0, W, h); b.globalCompositeOperation = 'source-over';
  g.drawImage(band, 0, y, W, h);
}
// the picture breaks up for a moment: strips of it slide sideways, a colour fringe (the rewind from the hook into the match)
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
// ---------- the coda: the cup and the ticker tape
// A silver cup with two handles and a gold crown on a green base, red and white ribbons: after the look of the Premier
// League trophy, not a copy of it (no lions, no lettering). (x, y): the middle of the foot of its base; s: its height, px
function leagueCup(g, x, y, s) {
  g.save(); g.translate(x, y);
  const sil = g.createLinearGradient(-s * 0.26, 0, s * 0.26, 0); sil.addColorStop(0, '#7E8794'); sil.addColorStop(0.3, '#F2F5F8'); sil.addColorStop(0.55, '#C2C9D2'); sil.addColorStop(1, '#6E7784');
  const gold = g.createLinearGradient(-s * 0.24, 0, s * 0.24, 0); gold.addColorStop(0, '#9C7420'); gold.addColorStop(0.35, '#F7DC7A'); gold.addColorStop(0.6, '#E2B640'); gold.addColorStop(1, '#8A6418');
  for (const sd of [-1, 1]) for (const [dx, col] of [[0, '#D0202A'], [0.05, '#F4F4F2']]) {  // the ribbons, behind the cup
    g.fillStyle = col; g.beginPath(); g.moveTo(sd * s * (0.27 + dx), -s * 0.5); g.quadraticCurveTo(sd * s * (0.4 + dx), -s * 0.3, sd * s * (0.34 + dx), -s * 0.06);
    g.lineTo(sd * s * (0.29 + dx), -s * 0.08); g.quadraticCurveTo(sd * s * (0.34 + dx), -s * 0.3, sd * s * (0.23 + dx), -s * 0.48); g.closePath(); g.fill(); }
  g.strokeStyle = '#AEB6C0'; g.lineWidth = s * 0.035; g.lineCap = 'round';  // the handles
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * s * 0.24, -s * 0.6); g.quadraticCurveTo(sd * s * 0.42, -s * 0.52, sd * s * 0.17, -s * 0.3); g.stroke(); }
  g.fillStyle = '#1D6A48'; g.beginPath(); g.roundRect(-s * 0.17, -s * 0.13, s * 0.34, s * 0.13, s * 0.02); g.fill();  // the base
  g.fillStyle = '#2A8A60'; g.fillRect(-s * 0.17, -s * 0.13, s * 0.34, s * 0.03);
  g.fillStyle = sil; g.beginPath(); g.moveTo(-s * 0.1, -s * 0.13); g.lineTo(s * 0.1, -s * 0.13); g.quadraticCurveTo(s * 0.13, -s * 0.4, s * 0.25, -s * 0.64); g.lineTo(-s * 0.25, -s * 0.64); g.quadraticCurveTo(-s * 0.13, -s * 0.4, -s * 0.1, -s * 0.13); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-s * 0.09, -s * 0.44, s * 0.025, s * 0.13, -0.15, 0, 2 * PI); g.fill();
  g.fillStyle = gold; g.fillRect(-s * 0.26, -s * 0.69, s * 0.52, s * 0.055);  // the crown
  g.beginPath(); g.moveTo(-s * 0.2, -s * 0.69); g.lineTo(-s * 0.22, -s * 0.9); g.lineTo(-s * 0.1, -s * 0.79); g.lineTo(0, -s * 0.97); g.lineTo(s * 0.1, -s * 0.79); g.lineTo(s * 0.22, -s * 0.9); g.lineTo(s * 0.2, -s * 0.69); g.closePath(); g.fill();
  g.beginPath(); g.arc(0, -s * 0.97, s * 0.03, 0, 2 * PI); g.fill();
  g.restore();
}
// strips of red, white and silver paper falling through the picture
function tickerTape(g, t, { n = 110, seed = 5, a = 1 } = {}) {
  if (a <= 0) return;
  const cols = ['#D0202A', '#F4F4F2', '#D0202A', '#C8CED6', '#F4F4F2'];
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < n; i++) { const r = rng(seed * 131 + i), x0 = r() * W, sp = 300 + r() * 420, ph = r() * 9, w = 12 + r() * 16, h = 6 + r() * 8, y0 = r() * H * 1.2, sw = 1.6 + r() * 2, rot = 2 + r() * 5;
    const y = ((y0 + t * sp) % (H * 1.2)) - H * 0.1, x = x0 + Math.sin(t * sw + ph) * 46, flip = Math.abs(Math.cos(t * 4 + ph));
    g.save(); g.translate(x, y); g.rotate(t * rot + ph); g.fillStyle = cols[i % cols.length]; g.fillRect(-w / 2, -h * flip / 2 - 1, w, h * flip + 2); g.restore(); }
  g.restore();
}

// ================================================================== the film
// One take of about 1:01 (STYLE_BIBLE rule 70): every change of shot is a camera swing or a push, every shot moves. The
// first frame is the drawn Cantona with his name; the author's photograph of the kick comes in the middle of the film,
// right after the drawn kick, as the real moment (the author: not on the first frame).
function warp(knots) {  // monotone cubic through [real time, game time] knots: a slow motion that eases in and out
  const n = knots.length, x = knots.map(k => k[0]), y = knots.map(k => k[1]), d = [];
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b; if (s2 > 9) { const tau = 3 / Math.sqrt(s2); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; } }
  return r => { if (r <= x[0]) return y[0] + (r - x[0]) * m[0]; if (r >= x[n - 1]) return y[n - 1] + (r - x[n - 1]) * m[n - 1];
    let i = 0; while (r > x[i + 1]) i++; const h = x[i + 1] - x[i], u = (r - x[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain, ...o });
  let panN = 0;
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: NIGHT_G, trans: 'pan', panDir: panN++ % 2 ? -1 : 1, transDur: 0.3, noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player', 'head out of frame'];
  const pinT = (t, t0) => (t > t0 ? pin(t, t0) : null);
  const plateAt = (g, t, t0, txt, y, o = {}) => { const p = pinT(t, t0); if (p) plate(g, txt, W / 2, y, { color: CREAM, size: 40, ...o, ...p }); };

  // the times, from the narration
  const tMan = wn('hook', 'Manchester') - 0.1, tOn = wn('hook', 'On') - 0.1, tJan = wn('hook', 'January'), tHe = wn('hook', 'he') - 0.1, tFeet = wn('hook', 'feet');
  const cR = s('red') - 0.2, tSel = wn('red', 'Selhurst'), cThree = wn('red', 'Three') - 0.1, tKicks = wn('red', 'kicks'), cRef = wn('red', 'referee') - 0.17, tRed = wn('red', 'red.');
  const cWalk = s('fan') - 0.2, cFan = wn('fan', 'a') - 0.1, tRuns = wn('fan', 'runs'), tFront = wn('fan', 'front'), tShouts = wn('fan', 'shouts');
  const cStop = wn('kick', 'Cantona') - 0.1, tStops = wn('kick', 'stops.'), tTurns = wn('kick', 'turns.'), cLaunch = wn('kick', 'And') - 0.1, tLaunch = wn('kick', 'launches'), tStyle = wn('kick', 'style.');
  const cPhoto = tStyle + 0.45, cFine = wn('fallout', 'United') - 0.1, t20k = wn('fallout', '£20,000.'), cBan = wn('fallout', 'The') - 0.1, tMonths = wn('fallout', 'months.');
  const cCourt = wn('fallout', 'A') - 0.1, tCourt = wn('fallout', 'court'), tPrison = wn('fallout', 'prison,'), cCut = wn('fallout', 'cut') - 0.1, tCommunity = wn('fallout', 'community');
  const cPress = s('press') - 0.15, cWhen = wn('press', 'When') - 0.1, tSardines = wn('press', 'sardines'), cThank = wn('press', 'Thank') - 0.1, tAnd = wn('press', 'And');
  // the coda (the trophy, the walk away): the film used to end 2.5 s after the press room's last word
  const cLift = wn('coda', 'he') - 0.1, tLifts = wn('coda', 'lifts'), cAway = wn('coda', 'Then') - 0.1, tWalks = wn('coda', 'walks'), END0 = T.p('press').e + 2.5;
  const tvOff = T.duration - 1.05;

  // ======================= THE TOUCHLINE AND THE KICK =======================
  // He walks along the touchline toward +x (z = WZ, between the touchline and the boards), past the foot of the aisle at
  // x = KX where the man comes down to the rail, and stops at S0, 4.4 m past him. Then he turns back and goes at him: two
  // strides and a jump over the boards, on a slant, as in the photograph (the body across the picture, the leg out to
  // the man's chest). The kick has its own clock K (s): 0 the first stride, K_TO he leaves the ground, K_C his boot arrives
  const KX = 10, WZ = -35.8, FZ = ROWZ(0), S0 = [KX + 4.4, WZ];
  const UD = (() => { const dx = KX - S0[0], dz = FZ - S0[1], d = Math.hypot(dx, dz); return [dx / d, dz / d, d]; })();
  const HK = Math.atan2(UD[1], UD[0]), K_TO = 0.5, K_C = 0.9, RUN = 2.6, REACH = 0.95;
  const cantonaK = (K, t = K) => {
    if (K <= 0) return P(CANTONA, grounded(CANTONA, { x: S0[0], z: S0[1], head: HK, pose: { ...POSE.stand(), lean: 0.08, look: 0.1 }, e: SNEER, t }));
    if (K < K_TO) { const u = K / K_TO, d = RUN * (0.35 * u * u + 0.65 * u);
      return P(CANTONA, { x: S0[0] + UD[0] * d, z: S0[1] + UD[1] * d, head: HK, pose: POSE.run(2 * PI * d / 1.3, 0.95, 0), e: RAGE, t }); }
    const u = clamp((K - K_TO) / (K_C - K_TO)), d = lerp(RUN, UD[2] - REACH, u) + Math.max(0, K - K_C) * 0.6, lift = 0.62 * Math.sin(PI / 2 * Math.min(1, u * 1.15));
    const pose = blend(POSE.run(2 * PI * RUN / 1.3, 0.95, 0), KICK_AIR, smooth(clamp((K - K_TO) / 0.2)));
    return P(CANTONA, { x: S0[0] + UD[0] * d, z: S0[1] + UD[1] * d, head: HK, pose: { ...pose, lift }, e: RAGE, t, air: lift });
  };
  // the man at the rail: pointing and shouting at him (hd: the way he faces); as Cantona leaves the ground he pulls his
  // hands in front of him; knocked back as the boot arrives
  const fanAt = (t, K = -9, hd = Math.atan2(-UD[1], -UD[0])) => {
    const guard = smooth(clamp((K - K_TO + 0.08) / 0.24)), hit = smooth(clamp((K - K_C + 0.04) / 0.22));
    let pose = blend({ ...POINTING, lean: 0.14 }, { ...POSE.stand(), sh: [[0.95, 0.3], [0.95, 0.3]], el: [1.75, 1.75], lean: -0.06 }, guard);
    pose = blend(pose, { ...POSE.stand(), sh: [[1.9, 0.5], [1.7, 0.45]], el: [1.2, 1.3], lean: -0.38 }, hit);
    return man(t, FAN, KX + UD[0] * 0.15 * hit, FZ + UD[1] * 0.15 * hit, hd, { ...pose, point: [false, guard < 0.02], lift: ROWY(0) }, guard > 0.4 ? SHOCK : SHOUT, 0, { shadow: { r: 0.01 } });  // the finger points only while the arm is out
  };

  // ======================= THE OPENING =======================
  // "Eric Cantona.": Cantona under the floodlights, chest out, chin up; his name
  const POS0 = [6, 0, -20];
  shot(0, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp(tt / tMan)); return lookFrom([POS0[0] + 2.4 - 0.4 * v, 1.25, POS0[2] + 1.0 + 0.5 * v], [POS0[0], 1.62, POS0[2]], { fov: lerp(1750, 1950, v), cy: H * 0.53 }); }, { shake: 0.2 });
    stadium(g, t, [man(t, CANTONA, POS0[0], POS0[2], 0.45, { ...CHIN, watch: 0.6 }, PROUD, 0)], { cheer: 0.4, blur: 6, goals: false });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => title2(g, 'ERIC', 'CANTONA', 220, { c2: '#E8392E', s1: 96, s2: 150, a: fadeOut(t, tMan - 0.12, 0.12), k: 1 + 0.06 * Math.exp(-Math.max(0, t - 0.05) * 6) }) });
  cue(0, 'boom_cine', 0.4); cue(0.3, 'crowd_roar', 0.25);
  // "Manchester United's number seven.": the camera goes round behind him to the 7 on his back
  shot(tMan, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - tMan) / (tOn - tMan))); return K(-0.9 - 1.15 * v, 0.05, lerp(3.0, 3.6, v), [POS0[0], 1.3, POS0[2]], { fov: 1600, cy: H * 0.56 }); }, { shake: 0.25 });
    stadium(g, t, [man(t, CANTONA, POS0[0], POS0[2], 0.45, { ...CHIN, watch: 0.5 }, PROUD, 0)], { cheer: 0.5, blur: 5, goals: false });
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, tMan + 0.1, 'MANCHESTER UNITED · Nº 7', 300, { size: 42 }) });
  cue(tMan, 'whoosh_soft', 0.2);
  // "On a January night in 1995,": Selhurst Park from inside the ground, its crowd, the pitch under the floodlights
  shot(tOn, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - tOn) / (tHe - tOn))); return K(0.6 + 0.5 * v, 0.34 - 0.06 * v, lerp(46, 38, v), [0, 0, 0], { fov: 1400, cy: H * 0.5 }); }, { shake: 0.15 });
    stadium(g, t, [], { cheer: 0.6, blur: 0 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, tJan - 0.05, 'WEDNESDAY · 25 JANUARY 1995', 300, { size: 40 }) });
  cue(tOn, 'whoosh_deep', 0.22);
  // "he jumped into the crowd, feet first.": the kick, seen from up the aisle behind the man at the rail: Cantona comes at
  // him over the boards, boot first. It stops a moment before the boot arrives; then the picture rewinds into the match
  const kHook = t => (t < tFeet ? 0.46 + (t - tHe) / (tFeet - tHe) * 0.34 : 0.8 + 0.07 * (1 - Math.exp(-(t - tFeet) * 3)));
  shot(tHe, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - tHe) / (cR - tHe))); return lookFrom([KX + 0.25, 3.5 - 0.2 * v, -42.6 + 0.5 * v], [KX + 0.75, 1.5, -37.9], { fov: lerp(1500, 1750, v), cy: H * 0.5 }); }, { shake: 0.3 });
    const K = kHook(t);
    stadium(g, t, [cantonaK(K, t), fanAt(t, K)], { cheer: 1, blur: 4, goals: false, front: tt => crowdFront(tt, KX, { span: 5, gap: KX, mood: 1, rows: 3 }) });
  }, { qaAllow: CROWDED, mbStep: 3, mbMax: 12, post: (g, lt, t) => glitch(g, clamp((t - cR + 0.4) / 0.4), Math.floor(t * 30)) });
  cue(tHe, 'whoosh_fast', 0.22); cue(tHe + 0.3, 'heartbeat', 0.5); cue(tFeet, 'boom_move', 0.4); cue(cR - 0.4, 'record_scratch', 0.45);

  // ======================= THE MATCH: SELHURST PARK, 25 JANUARY 1995 =======================
  // "Selhurst Park, away at Crystal Palace.": the match under the floodlights, United in black, Shaw close on Cantona
  const SPOTS = [[CANTONA, 4, 6, 0.2], [SHAW, 5.3, 7.3, 0.2], [MUS[0], -1, 1, 0.1], [MUS[1], 9, 11, 0.3], [MUS[2], 12, 0, -0.2], [PALS[0], 10, 5, PI], [PALS[1], 0, 9, PI + 0.3], [PALS[2], 7, -2, PI - 0.4]];
  shot(cR, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cR) / (cThree - cR))); return K(-PI / 2 - 0.3 + 0.5 * v, 0.22 - 0.05 * v, lerp(22, 15, v), [6, 0.6, 5], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.2 });
    stadium(g, t, [...SPOTS.map(([pl, x, z, hd], i) => jog(t, cR, pl, x, z, 1.3 * Math.cos(hd), 1.3 * Math.sin(hd), i, 'focus')), BALL([7.5 + (t - cR) * 1.3, BALL_R, 4.2])], { cheer: 0.6, blur: 2 });
  }, { qaAllow: CROWDED, post: (g, lt, t) => glitch(g, clamp(1 - (t - cR) / 0.35), Math.floor(t * 30) + 3), hud: (g, lt, t) => {
    scoreBug(g, 'CRY', 'MUN', 0, 0, '', { colL: PRED, colR: '#17181B' }); plateAt(g, t, tSel - 0.05, 'SELHURST PARK', 300, { size: 44, sub: 'CRYSTAL PALACE v MANCHESTER UNITED' }); } });
  cue(cR + 0.05, 'whistle', 0.3);
  // "Three minutes into the second half, Cantona kicks out at defender Richard Shaw.": chasing a long ball together, Shaw
  // close on him; Cantona kicks out at him, Shaw goes down. Seen from in front of them, the camera backing away
  const cmv = new Mover([[cThree - 0.5, 6, 9], [tKicks - 0.2, 18.6, 12.4], [tKicks + 0.5, 19.6, 12.8, { stop: true }], [99, 19.6, 12.8]], { heading0: 0.3 });
  const smv = new Mover([[cThree - 0.5, 6.4, 10.0], [tKicks - 0.2, 18.8, 13.3], [tKicks + 0.45, 20.2, 14.1, { stop: true }], [99, 20.2, 14.1]], { heading0: 0.3 });
  const lb = new BallPath([{ t0: cThree - 0.5, t1: cThree + 1.2, kind: 'air', from: [-20, 0.3, 4], to: [16, BALL_R, 11], g: 9 }, { t0: cThree + 1.2, t1: tKicks + 1.5, kind: 'roll', from: [16, BALL_R, 11], to: [26, BALL_R, 8.6], decay: 0.6 }, { t0: tKicks + 1.5, t1: 99, kind: 'hold', from: [26, BALL_R, 8.6] }]);
  const cantonaShaw = t => { const ms = moving(cmv, t, { e: SNEER, t }), u = (t - tKicks + 0.2) / 0.55;
    if (u <= 0 || u >= 1) return P(CANTONA, u >= 1 ? grounded(CANTONA, { ...ms, head: ms.head + 0.9, pose: { ...POSE.stand(), look: -0.1 } }) : ms);
    return P(CANTONA, { ...ms, head: ms.head + 0.9 * smooth(clamp(u * 3)), pose: blend(ms.pose, POSE.kick(u, 'L'), smooth(clamp(u / 0.2)) * smooth(clamp((1 - u) / 0.25))) }); };
  const shawAt = t => { const ms = moving(smv, t, { e: 'focus', t }), down = smooth(clamp((t - tKicks - 0.15) / 0.45));
    if (down <= 0) return P(SHAW, { ...ms, pose: { ...ms.pose, sh: [[0.5, 0.6], [1.1, 0.5]] } });
    return P(SHAW, onGrass(SHAW, { ...grounded(SHAW, ms), pose: blend(grounded(SHAW, ms).pose, { ...POSE.sit(), look: -0.2 }, down), e: down > 0.5 ? HURT : 'shock', shadow: { r: lerp(0.36, 0.7, down) } }, down > 0.9)); };
  shot(cThree, (g, lt, t) => {
    rigFn(lt, t, tt => { const c = cmv.at(tt), s2 = smv.at(tt), mx = (c.x + s2.x) / 2, mz = (c.z + s2.z) / 2, v = clamp((tt - cThree) / (cRef - cThree));
      return lookFrom([mx + 4.0 - 0.8 * v, 1.4, mz + 3.0 - 0.6 * v], [mx - 0.2, 1.0, mz + 0.1], { fov: 1500, cy: H * 0.47 }); /* high in the frame: the kick lands above the caption */ }, { shake: 0.4 + (t > tKicks ? 1.5 * Math.exp(-(t - tKicks) * 5) : 0) });
    stadium(g, t, [cantonaShaw(t), shawAt(t), jog(t, cThree, PALS[1], 8, 4, 4.5, 2.4, 1, 'focus'), ballOf(lb, t)], { cheer: t > tKicks ? 1 : 0.6, blur: 3 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'CRY', 'MUN', 0, 0, "48'", { colL: PRED, colR: '#17181B' }); plateAt(g, t, cThree + 0.1, 'RICHARD SHAW', 300, { size: 40, sub: 'CRYSTAL PALACE DEFENDER' }); } });
  cue(cThree, 'whoosh_fast', 0.2); cue(tKicks - 0.02, 'hit_punch', 0.45); cue(tKicks + 0.25, 'crowd_protest', 0.5); cue(tKicks + 0.6, 'whistle', 0.5);
  // "The referee shows him red.": the two of them face to face, the card up against the floodlights; Cantona turns away
  const REFP = [21.5, 12.3], HR = Math.atan2(12.8 - REFP[1], 19.6 - REFP[0]);
  shot(cRef, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cRef) / (cWalk - cRef))); return lookFrom([20.7 - 0.3 * v, 1.2 + 0.15 * v, 7.9 + 0.6 * v], [20.55, 1.6, 12.5], { fov: lerp(1400, 1600, v), cy: H * 0.48 }); }, { shake: 0.3 });
    const up = smooth(clamp((t - cRef - 0.05) / 0.4)), ref = man(t, REF, REFP[0], REFP[1], HR, blend(POSE.stand(), CARD_UP, up), 'angry', 0);
    const turn = smooth(clamp((t - tRed - 0.15) / 0.7));
    stadium(g, t, [ref, cardItem(ref), man(t, CANTONA, 19.6, 12.8, lerp(HR - PI, -PI / 2 - 0.15, turn), { ...POSE.stand(), look: 0.05 }, SNEER, 0), shawAt(t)], { cheer: 1, blur: 5 });
    const gl = g.createRadialGradient(W * 0.72, H * 0.12, 10, W * 0.72, H * 0.12, W * 0.7); gl.addColorStop(0, 'rgba(255,250,235,0.3)'); gl.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);  // a floodlight behind them
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'CRY', 'MUN', 0, 0, "48'", { colL: PRED, colR: '#17181B' }); if (t > tRed - 0.02) stamp(g, 'RED CARD', W / 2, 420, lt, tRed - 0.02 - cRef, { color: RED, size: 120, rot: -0.06 }); } });
  cue(cRef, 'whoosh_soft', 0.2); cue(tRed - 0.02, 'stamp', 0.5); cue(tRed, 'boom_cine', 0.35);

  // ======================= THE TOUCHLINE =======================
  // He walks toward the tunnel, a United man leading the way; he stops, the other walks on two steps before he looks back
  const tStop = tStops, walkX = t => S0[0] - 1.4 * Math.max(0, tStop - t), KGO = 1.9 / 1.4;
  const kitman = t => { const x = walkX(Math.min(t, tStop)) + 0.9 + 1.4 * clamp(t - tStop, 0, KGO);
    return t < tStop + KGO ? jog(t, cWalk, KITMAN, x - 1.4 * (t - cWalk), WZ + 0.5, 1.4, 0, 1.5, 'focus') : man(t, KITMAN, x, WZ + 0.5, PI, { ...POSE.stand() }, 'worried', 2); };
  const walker = (t, turn = 0) => { const x = walkX(t); if (t < tStop) return jog(t, cWalk, CANTONA, x - 1.4 * (t - cWalk), WZ, 1.4, 0, 0, SNEER, { look: -0.05 });
    return man(t, CANTONA, x, WZ, lerp(0, HK, turn), { ...POSE.stand(), lean: 0.05 + 0.03 * turn, look: 0.1 * turn }, SNEER, 0); };
  // "As he walks along the touchline,": following him from the pitch, the crowd behind the boards on its feet
  shot(cWalk, (g, lt, t) => {
    rigFn(lt, t, tt => { const x = walkX(tt), v = clamp((tt - cWalk) / (cFan - cWalk)); return lookFrom([x + 1.9 - 0.7 * v, 1.55, -31.4 + 0.3 * v], [x + 0.45, 1.4, -36.8], { fov: 1500, cy: H * 0.56 }); }, { shake: 0.3 });
    stadium(g, t, [walker(t), kitman(t)], { cheer: 1, blur: 3, goals: false, front: tt => crowdFront(tt, walkX(tt) + 0.4, { span: 7.5, gap: KX, mood: 1 }) });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, cWalk + 0.15, 'SENT OFF', 300, { size: 44, color: RED, ink: '#FFFFFF' }) });
  cue(cWalk, 'whoosh_soft', 0.2); cue(cWalk + 0.1, 'crowd_protest', 0.55);
  // "a Palace fan runs down to the front and shouts abuse at him.": down the aisle to the rail, pointing, shouting; he
  // turns with Cantona as he goes by (Cantona is just below the picture, on the touchline)
  const downU = t => smooth(clamp((t - tRuns + 0.25) / (tFront - tRuns + 0.45)));
  const fanRun = t => { const u = downU(t);
    if (u >= 1) return fanAt(t, -9, Math.atan2(WZ - FZ, walkX(t) - KX));
    const row = lerp(4.6, 0, u);
    return P(FAN, grounded(FAN, { x: KX, z: ROWZ(0) - 0.72 * row, head: PI / 2, pose: { ...POSE.run(t * 9, 0.7, 0), lift: ROWY(0) + 0.42 * row }, e: SHOUT, t, shadow: { r: 0.01 } })); };
  shot(cFan, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cFan) / (cStop - cFan))), w = downU(tt);
      return lookFrom([KX + 1.3 - 0.7 * v, 1.75 + 0.1 * v, -36.0 - 0.3 * v], [KX, lerp(2.9, 1.95, w), lerp(-40.8, -39.0, w)], { fov: lerp(1350, 1600, v), cy: H * 0.5 }); }, { shake: 0.3 });
    stadium(g, t, [fanRun(t)], { cheer: 1, blur: 4, goals: false, front: tt => crowdFront(tt, KX, { span: 6, gap: KX, mood: 1 }) });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tShouts - 0.05) { const it = fanAt(t), p = B.project(...skeleton(FAN, it.st).headC); abuseBubble(g, p, clamp((t - tShouts + 0.05) / 0.12), 1 + 0.08 * Math.exp(-(t - tShouts) * 6)); } } });
  cue(cFan, 'whoosh_fast', 0.18); cue(tShouts, 'crowd_protest', 0.6);
  // "Cantona stops. He turns.": close on him, from the side of the stand: he stops, and turns back toward the man
  shot(cStop, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cStop) / (cLaunch - cStop))); return lookFrom([S0[0] - 1.2, 1.78, -37.6 + 0.2 * v], [walkX(tt) - 0.05, 1.68, WZ], { fov: lerp(1750, 2250, v), cy: H * 0.47 }); }, { shake: 0.2 });
    stadium(g, t, [walker(t, smooth(clamp((t - tTurns + 0.2) / 0.55))), kitman(t)], { cheer: 1, blur: 7, goals: false });
  }, { trans: 'push', qaAllow: CROWDED });
  cue(cStop, 'whoosh_deep', 0.2); cue(tStops, 'heartbeat', 0.6); cue(tTurns, 'heartbeat', 0.65);
  // "And he launches himself over the barrier, kung-fu style.": the run and the jump over the boards, slowed, from the pitch
  // as in the photograph: the stand facing us, Cantona going across the picture at the man. It stops as his boot arrives
  const kw = warp([[cLaunch - 1, -1.2], [cLaunch, -0.25], [tLaunch + 0.2, 0.25], [tStyle, K_C], [tStyle + 1.5, K_C + 0.06]]);
  shot(cLaunch, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - cLaunch) / (tStyle - cLaunch)));
      return lookFrom(mix3([KX + 2.9, 1.6, -28.6], [KX + 1.0, 1.5, -34.4], v), mix3([S0[0] - 1.3, 1.2, -36.6], [KX + 0.55, 1.5, -38.6], v), { fov: lerp(1350, 1650, v), cy: H * 0.52 }); }, { shake: 0.3 + (t > tStyle ? 2 * Math.exp(-(t - tStyle) * 6) : 0) });
    const K = kw(t);
    stadium(g, t, [cantonaK(K, t), fanAt(t, K)], { cheer: 1, blur: 3, goals: false, front: tt => crowdFront(tt, KX + 1.5, { span: 8, gap: KX, mood: 1, shock: K > K_C - 0.05 ? 1 : 0 }) });
    if (t > tStyle - 0.02) { const f = clamp(1 - (t - tStyle + 0.02) / 0.35); g.fillStyle = `rgba(255,255,255,${(0.85 * f).toFixed(3)})`; g.fillRect(0, 0, W, H); }  // the flash of a camera
  }, { mbStep: 2, mbMax: 16, qaAllow: CROWDED });
  cue(cLaunch, 'whoosh_fast', 0.2); cue(tLaunch, 'studs', 0.5); cue(tLaunch + 0.35, 'whoosh_deep', 0.35); cue(tStyle - 0.04, 'hit_punch', 0.7); cue(tStyle, 'camera', 0.6); cue(tStyle + 0.02, 'crowd_gasp', 0.8);
  // the photograph: the real moment, a second of silence
  const BAND = makeCanvas(W, 900);
  shot(cPhoto, (g, lt, t) => {
    photoBand(g, IMG.kick, BAND, cPhoto, t, { y: 360, h: 900, fx0: 0.34, fx1: 0.44, z0: 1.0, z1: 1.12, dur: cFine - cPhoto + 0.6 });
  }, { grade: PRINT_G, trans: 'push', transDur: 0.2, hud: (g, lt, t) => plateAt(g, t, cPhoto + 0.25, 'SELHURST PARK · 25 JANUARY 1995', 300, { size: 38 }) });
  cue(cPhoto + 0.05, 'camera', 0.45);

  // ======================= THE FALLOUT =======================
  // "United fine him £20,000.": led away along the touchline toward the tunnel, his back to us, the 7 on it
  const X12 = S0[0] + 1.0;
  shot(cFine, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cFine) / (cBan - cFine))), d = 1.3 * (tt - cFine); return lookFrom([X12 - 3.4 + d + 0.5 * v, 1.65, -34.4 - 0.3 * v], [X12 + 1.6 + d, 1.1, -36.0], { fov: 1500, cy: H * 0.6 }); }, { shake: 0.25 });
    stadium(g, t, [jog(t, cFine, CANTONA, X12, WZ + 0.1, 1.3, 0, 0, SNEER, { look: -0.1 }), jog(t, cFine, KITMAN, X12 + 0.5, WZ - 0.75, 1.3, 0, 1.5, 'worried')],
      { cheer: 0.8, blur: 6, goals: false, front: tt => crowdFront(tt, X12 + 5 + 1.3 * (tt - cFine), { span: 8, gap: KX, mood: 1 }) });
    g.fillStyle = 'rgba(6,8,16,0.25)'; g.fillRect(0, 0, W, H);
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { if (t > t20k - 0.1) { const k = ease.out(clamp((t - t20k + 0.1) / 0.6)); counter(g, '£' + (Math.round(20000 * k / 1000) * 1000).toLocaleString('en-US'), 'FINED BY UNITED', { y: 360, size: 170, color: GOLD, at: [t, t20k - 0.1] }); } } });
  cue(cFine, 'whoosh_soft', 0.2); cue(t20k + 0.5, 'cash', 0.4);
  // "The FA bans him for eight months.": the calendar runs from 25 January to 30 September
  const flipA = cBan + 0.25, flipB = tMonths + 0.2, calK = t => (PAGES.length - 1) * ease.inOut(clamp((t - flipA) / (flipB - flipA)));
  shot(cBan, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cBan) / (cCourt - cBan))); return lookFrom([-20 + 6 * v, 7, -26 + 2 * v], [0, 3, 10], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.2 });
    stadium(g, t, [], { cheer: 0, blur: 9 });
    g.fillStyle = 'rgba(8,10,18,0.5)'; g.fillRect(0, 0, W, H);
    const v = clamp((t - cBan) / (cCourt - cBan));
    calendar(g, W / 2, 860 - 30 * v, 560 * (1 + 0.06 * v), calK(t), { rot: -0.03 + 0.02 * Math.sin(t * 0.9) });
  }, { trans: 'push', hud: (g, lt, t) => plateAt(g, t, tMonths - 0.05, 'BANNED UNTIL 30 SEPTEMBER 1995', 300, { size: 40, color: RED, ink: '#FFFFFF' }) });
  cue(cBan, 'whoosh_deep', 0.22); for (let i = 0; i < 8; i += 2) cue(flipA + (flipB - flipA) * (0.5 - 0.5 * Math.cos(PI * (i + 0.5) / 8)), 'page_flip', 0.35); cue(tMonths, 'stamp', 0.4);
  // "A court sentences him to two weeks in prison,": he walks up to the court between the photographers, the camera behind
  // him; they turn with him as he passes
  const zCourt = t => -1.4 + 1.2 * (t - cCourt);
  const SN = [[-1.6, 0.6], [-2.5, 1.5], [1.6, 0.7], [2.5, 1.6]];
  const snappers = t => SN.map(([dx, z], i) => { const it = man(t, SNAPS[i], CX + dx, z, Math.atan2(zCourt(t) - z, -dx), { ...SNAPPING }, 'focus', i); return [it, snapItem(it, t, i * 0.7)]; }).flat();
  const upSteps = t => { const z = zCourt(t), y = COURT_Y(z);
    return P(CANTONA_S, grounded(CANTONA_S, { x: CX, z, head: PI / 2, pose: { ...POSE.run(2 * PI * 1.2 * (t - cCourt) / 1.45, 0.25, 0), lift: y }, e: SNEER, t, shadow: { r: y > 0.05 ? 0.01 : 0.36 } })); };
  shot(cCourt, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cCourt) / (cCut - cCourt))), z = zCourt(tt); return lookFrom([CX - 0.8 + 1.0 * v, 1.55 + 0.1 * v, z - 4.3 + 0.9 * v], [CX, 2.0, z + 3], { fov: lerp(1300, 1400, v), cy: H * 0.47 }); }, { shake: 0.2 });
    courthouse(g, t); const it = [...snappers(t), upSteps(t)]; for (const x of it) x.shadow?.(g); drawSorted(g, it);
  }, { grade: GREY_G, qaAllow: CROWDED, hud: (g, lt, t) => { plateAt(g, t, tCourt - 0.05, 'CROYDON MAGISTRATES\u2019 COURT', 300, { size: 40, sub: '23 MARCH 1995' }); if (t > tPrison - 0.05) stamp(g, '2 WEEKS IN PRISON', W / 2, 500, lt, tPrison - 0.05 - cCourt, { color: RED, size: 96, rot: -0.05 }); } });
  cue(cCourt, 'whoosh_soft', 0.2); for (let i = 0; i < 6; i++) cue(cCourt + 0.3 + i * 0.5, 'camera', 0.25); cue(tPrison - 0.05, 'gavel', 0.6);
  // "cut on appeal to community service, coaching children.": on a training pitch with a group of children, side on: he
  // rolls a ball to them and claps
  const CP = [TX - 0.7, 0], KP = [[0.6, -0.5], [0.95, 0.5], [1.3, -0.3], [1.65, 0.6], [2.0, -0.1]];
  const kidsAt = t => KP.map(([dx, dz], i) => { const x = TX + dx, hd = Math.atan2(CP[1] - 0.9 - dz, CP[0] - x);
    if (i === 2 || i === 4) return hopper(t, KIDS[i], x, dz, hd, i, { amp: 0.1, e: JOY });
    const u = i ? -1 : (t - cCut - 1.3) / 0.5, base = { ...POSE.stand(), lean: 0.03, look: 0.12 };  // the first boy passes the ball back
    return man(t, KIDS[i], x, dz, hd, u > 0 && u < 1 ? blend(base, POSE.kick(u, 'R'), smooth(clamp(u / 0.2)) * smooth(clamp((1 - u) / 0.25))) : base, i % 2 ? JOY : 'happy', i); });
  const pass = new BallPath([{ t0: cCut, t1: cCut + 0.9, kind: 'roll', from: [CP[0] + 0.4, BALL_R, -0.3], to: [TX + 0.3, BALL_R, -0.62], decay: 0.8 }, { t0: cCut + 0.9, t1: cCut + 1.55, kind: 'hold', from: [TX + 0.3, BALL_R, -0.62] },
    { t0: cCut + 1.55, t1: cCut + 2.5, kind: 'roll', from: [TX + 0.3, BALL_R, -0.62], to: [CP[0] + 0.42, BALL_R, -0.34], decay: 0.8 }, { t0: cCut + 2.5, t1: 99, kind: 'hold', from: [CP[0] + 0.42, BALL_R, -0.34] }]);
  shot(cCut, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cCut) / (cPress - cCut))); return lookFrom([TX + 0.3 + 0.6 * v, 1.4, -5.1 + 0.6 * v], [TX + 0.65, 0.95, 0], { fov: lerp(1350, 1450, v), cy: H * 0.56 }); }, { shake: 0.2 });
    const clap = smooth(clamp((t - tCommunity) / 0.3)), coach = man(t, CANTONA_T, CP[0], CP[1], -0.22, blend({ ...POINTING }, CLAP, clap), 'happy', 0);
    trainingGround(g, t, [coach, ...kidsAt(t), ballOf(pass, t)]);
  }, { grade: DAY_G, qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tCommunity - 0.05) stamp(g, 'COMMUNITY SERVICE', W / 2, 420, lt, tCommunity - 0.05 - cCut, { color: '#2E9B57', size: 76, rot: -0.05 }); } });
  cue(cCut, 'whoosh_soft', 0.2); cue(cCut + 0.02, 'kick', 0.4); cue(cCut + 1.55, 'kick', 0.32); cue(tCommunity - 0.05, 'stamp', 0.4);

  // ======================= THE PRESS CONFERENCE =======================
  // He sits behind the microphones; says his line; gets up, turns and walks out past the end of the table
  const tThank = wn('press', 'Thank'), tMuch = wn('press', 'much.'), RISE0 = tAnd - 0.85, GO0 = tAnd - 0.3, UPRIGHT = { ...POSE.stand(), sh: [[0.2, 0.1], [0.2, 0.1]], el: [0.4, 0.4] };
  const seated = t => {
    const talk = t > tThank - 0.03 && t < tMuch + 0.42 ? 0.1 + 0.32 * Math.abs(Math.sin((t - tThank) * 13)) : 0, rise = smooth(clamp((t - RISE0) / 0.5)), go = t - GO0;
    if (go <= 0) return P(CANTONA_S, grounded(CANTONA_S, { x: RX, z: 2.35, head: -PI / 2, pose: rise > 0 ? blend(UPRIGHT, SEATED, 1 - rise) : SEATED, e: rise > 0 ? PROUD : talk ? { ...CALM, open: talk } : CALM, t }));
    const d = 1.25 * (go - 0.25 * (1 - Math.exp(-go / 0.25))), hd = lerp(-PI / 2, -0.45, smooth(clamp(go / 0.45)));
    return P(CANTONA_S, grounded(CANTONA_S, { x: RX + d, z: 2.35, head: hd, pose: blend(UPRIGHT, POSE.run(2 * PI * d / 1.45, 0.25, 0), smooth(clamp(go / 0.3))), e: PROUD, t }));
  };
  // "Then he faces the press:": the room, the microphones, the photographers' flashes
  shot(cPress, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cPress) / (cWhen - cPress))); return lookFrom([RX + 0.5 - 0.4 * v, 1.42, -0.9 + 0.5 * v], [RX, 1.2, 2.3], { fov: lerp(1700, 1900, v), cy: H * 0.48 }); }, { shake: 0.15 });
    pressBack(g, t); drawSorted(g, [seated(t), pressTable(t)]); pressHeads(g); pressFlashes(g, t);
  }, { grade: ROOM_G, trans: 'push', hud: (g, lt, t) => plateAt(g, t, cPress + 0.15, 'AFTER THE APPEAL', 300, { size: 40 }) });
  cue(cPress, 'whoosh_deep', 0.2); for (let i = 0; i < 4; i++) cue(cPress + 0.2 + i * 0.4, 'camera', 0.3);
  // "When the seagulls follow the trawler, it's because they think sardines will be thrown into the sea.": the words as a
  // picture: a trawler, the gulls behind it, the sardines going over the stern
  shot(cWhen, (g, lt, t) => {
    const v = glide(clamp((t - cWhen) / (cThank - cWhen)));
    seaScene(g, t, { x: lerp(-20, 130, v), z: lerp(1.0, 1.08, v), fish: clamp((t - tSardines + 0.1) / 0.3), lt });
  }, { grade: DUSK_G });
  cue(cWhen, 'whoosh_soft', 0.2); cue(cWhen + 0.2, 'waves', 0.26); cue(cWhen + 3.1, 'waves', 0.26, { end: cThank, fade: 0.5 });  // the sea under the words
  // "Thank you very much. And he walks out.": back in the room; he says it, gets up and leaves; the flashes go on at an
  // empty chair
  shot(cThank, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cThank) / (END0 - cThank))); return lookFrom([RX - 0.2 + 0.5 * v, 1.45, -0.5 - 1.1 * v], [RX + 0.5 * v, 1.2, 2.3], { fov: lerp(1900, 1600, v), cy: H * 0.48 }); }, { shake: 0.15 });
    pressBack(g, t); drawSorted(g, [seated(t), pressTable(t)]); pressHeads(g); pressFlashes(g, t, 8, 1.6);
  }, { grade: ROOM_G, trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, tThank + 0.1, '\u00AB THANK YOU VERY MUCH \u00BB', 300, { size: 42, color: GOLD, ink: '#2A1E06' }) });
  cue(cThank, 'whoosh_soft', 0.18); for (let i = 0; i < 9; i++) cue(cThank + 0.3 + i * 0.45, 'camera', 0.25, { end: cLift + 0.1, fade: 0.3 }); cue(GO0 + 0.25, 'footsteps', 0.4, { end: cLift, fade: 0.4 });

  // ======================= THE CODA: MAY 1997 =======================
  // The author's added moment, 6.3 s from the first frame of Old Trafford to the end of the film (his limit: 7 s).
  // "he lifts the Premier League trophy.": Old Trafford, 11 May 1997: the cup goes up over his head, the others round him
  const LP = [0, 3];
  const tUp = Math.max(tLifts, cLift + 0.3);  // the cup goes up once the picture has arrived, on "lifts"
  const lifter = t => { const up = ease.out(clamp((t - tUp) / 0.45)), hop = up >= 1 ? Math.pow(Math.max(0, Math.sin((t - tUp - 0.45) * 5.4)), 2) : 0, kn = 0.1 + 0.16 * (1 - hop);
    const LOW = { ...POSE.stand(), sh: [[0.4, 0.1], [0.4, 0.1]], el: [0.3, 0.3] };  // the cup held low in front of him first: at his chest it hid his face
    const base = { ...blend(LOW, { ...POSE.stand(), ...POSE.trophy() }, up), knee: [kn, kn], crouch: 0.04 * (1 - hop), look: 0.08 + 0.17 * up };
    const y0 = skeleton(CANTONA_R, { x: LP[0], z: LP[1], head: -PI / 2, pose: base }).pel[1];  // standing on the grass, then the hop on top
    return { x: LP[0], z: LP[1], head: -PI / 2, pose: { ...base, pelvisY: y0 + 0.09 * hop, ground: false }, e: up > 0.5 ? { ...EXPR.triumph, lid: 0.2 } : PROUD, t, air: 0.09 * hop }; };
  shot(cLift, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cLift) / (cAway - cLift))); return lookFrom([LP[0] + 1.5 - 1.1 * v, 0.95, LP[1] - 4.5 + 0.9 * v], [LP[0], 1.85, LP[1]], { fov: lerp(1450, 1600, v), cy: H * 0.52 }); }, { shake: 0.35 });
    const st = lifter(t), me = P(CANTONA_R, st);
    const mates = [[-1.3, 0.9], [-0.72, 1.6], [0.72, 1.6], [1.3, 0.9]].map(([dx, dz], i) => hopper(t, MUR[i], LP[0] + dx, LP[1] + dz, -PI / 2 - dx * 0.12, i * 1.7, { amp: 0.12, e: JOY }));
    oldTrafford(g, t, [me, ...mates], { cheer: 1, blur: 3 });
    // the cup: its base in his hands (the hands drawn again over it, gripping), the bowl and the crown above
    const sk = skeleton(CANTONA_R, st), a = B.project(...sk.arms[0].hand), b = B.project(...sk.arms[1].hand), cs = a.s * 0.72;
    leagueCup(g, (a.x + b.x) / 2, (a.y + b.y) / 2 + cs * 0.06, cs);
    for (const q of [a, b]) { g.fillStyle = SKIN_T.base; g.beginPath(); g.arc(q.x, q.y, Math.max(1, 0.058 * figureK(CANTONA_R.h) * q.s), 0, 2 * PI); g.fill(); }
    tickerTape(g, t, { a: clamp((t - tUp) / 0.4) });
  }, { grade: DAY_G, qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, cLift + 0.25, 'OLD TRAFFORD \u00B7 11 MAY 1997', 300, { size: 40, sub: 'PREMIER LEAGUE CHAMPIONS 1996\u201397' }) });
  cue(cLift, 'whoosh_fast', 0.2); cue(cLift + 0.05, 'crowd_roar', 0.75, { end: cAway + 0.9, fade: 0.9 }); cue(tUp + 0.2, 'boom_cine', 0.35); cue(tUp + 0.25, 'confetti', 0.4); cue(tUp + 0.4, 'applause', 0.35, { end: cAway + 0.6, fade: 0.6 });
  // "Then he walks away.": alone, across the pitch, his back to us. The words of the
  // author's brief flash on the screen and stay to the switch-off
  const WP = [-14, 9], tFlash = tWalks - 0.12;
  const leaver = t => { const d = 1.2 * (t - cAway + 0.4);  // already walking when the picture arrives
    return P(CANTONA_H, grounded(CANTONA_H, { x: WP[0], z: WP[1] + d, head: PI / 2, pose: POSE.run(2 * PI * d / 1.45, 0.25, 0), e: CALM, t })); };
  shot(cAway, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cAway) / (T.duration - cAway))); return lookFrom([WP[0] + 0.7 - 0.5 * v, 1.45 + 0.45 * v, WP[1] - 2.5 + 3.0 * v], [WP[0], 1.5, WP[1] + 2.6 + 3.6 * v], { fov: lerp(1500, 1650, v), cy: H * 0.56 }); }, { shake: 0.25 });  // close behind him at first
    oldTrafford(g, t, [leaver(t)], { cheer: 0.5, blur: 4 });
    tickerTape(g, t, { n: 46, seed: 8, a: 0.8 });
    if (t > tFlash) { const f = clamp(1 - (t - tFlash) / 0.3); g.fillStyle = `rgba(255,255,255,${(0.8 * f).toFixed(3)})`; g.fillRect(0, 0, W, H); }  // the flash
  }, { grade: DUSK_G, qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tFlash) title2(g, 'MAY 1997', 'CANTONA RETIRES AT 30', 250, { c2: '#E8392E', s1: 84, s2: 70, a: clamp((t - tFlash) / 0.08), k: 1 + 0.08 * Math.exp(-(t - tFlash) * 7) }); } });
  cue(cAway, 'whoosh_soft', 0.2); cue(tFlash, 'camera', 0.5); cue(tFlash, 'boom_move', 0.3);

  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd: Selhurst Park loud; a gasp at the kick, quiet over the photograph; a murmur in the press room
  amb.push({ id: 'crowd_bed', t0: 0, t1: cCourt + 0.5, gain: 0.6, fi: 0.1, fo: 0.5, keys: [[0, 0.45], [tOn, 0.35], [tHe, 0.6], [cR, 0.7], [tKicks, 0.9], [cWalk, 1.0], [tShouts, 1.0], [cStop, 0.5], [cLaunch, 0.8], [tStyle, 1.0], [cPhoto + 0.3, 0.12], [cFine, 0.5], [cBan, 0.15], [cCourt, 0.0]] });
  amb.push({ id: 'murmur', t0: cPress - 0.2, t1: cLift + 0.15, gain: 0.35, fi: 0.3, fo: 0.4, keys: [[cPress, 0.6], [cWhen, 0.12], [cThank, 0.5], [cLift - 0.4, 0.4]] });
  amb.push({ id: 'crowd_bed', t0: cLift - 0.1, t1: tvOff - 0.1, gain: 0.6, fi: 0.15, fo: 0.9, keys: [[cLift, 0.95], [cAway, 0.6], [tvOff - 1.0, 0.3]] });  // Old Trafford; gone before the switch-off (rule 60)

  const music = [
    { t: 0, m: 'hook' }, { t: cR, m: 'stands' }, { t: cRef, m: 'hit' }, { t: cWalk, m: 'tension' }, { t: tLaunch, m: 'slam' }, { t: cPhoto, m: 'void' }, { t: cFine, m: 'intrigue' }, { t: cPress, m: 'clockwork' }, { t: cLift, m: 'fiesta' }, { t: cAway, m: 'elegy' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [{ t0: cPhoto - 0.1, t1: cFine - 0.2, kind: 'mute' }];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
