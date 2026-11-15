// "The best player in the world sent it over the bar". Brazil 0–0 Italy (3–2 on penalties), World Cup final, the Rose Bowl,
// Pasadena, 17 July 1994: 12:30 kick-off, 38 °C; no goal in 120 minutes (Mauro Silva's shot off Pagliuca and the post at 75',
// Romário wide at the far post at 110'); the first World Cup final decided on penalties. Italy kicked first: Baresi over,
// Márcio Santos saved, Albertini, Romário (in off the post), Evani, Branco scored, Taffarel saved from Massaro, Dunga
// scored; Roberto Baggio, the world player of the year, playing with a hamstring injury, aimed for the middle and put it over
// the bar. Brazil's fourth title, dedicated to Ayrton Senna. Facts, what is drawn and what is not known: SOURCES.md.
// The opening (0–10 s) is cut to stand on its own: his face is kept out of the picture until his name.
// The settings are those of plea2005 (STYLE_BIBLE rule 68); the iconic photograph, sent by the author, ends the film (rule 69).
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
// the iconic photograph (photos/iconic.jpg, sent by the author; SOURCES.md). Until it is there, the drawn picture ends the film
const IMG = { iconic: await loadImage('../episodes/baggio1994/photos/iconic.jpg').catch(() => null), credit: null };
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
const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
// grades: the Californian midday sun, the same sun in the heat shot, a dark room for the photograph at the end
const DAY_G = { con: 1.05, sat: 1.06, bri: 1.03, tone: ['#FFF2DC', 0.05], lift: ['#1A2444', 0.05], bloom: 0.2 };
const HOT_G = { con: 1.06, sat: 1.08, bri: 1.05, tone: ['#FFD3A0', 0.14], lift: ['#2A1C10', 0.05], bloom: 0.32 };
const ROOM_G = { con: 1.06, sat: 1.0, bri: 1.02, tone: ['#FFD9A0', 0.1], lift: ['#161008', 0.08], bloom: 0.26 };
const PRINT_G = { con: 1.02, sat: 1.0, bri: 1.0, tone: null, lift: ['#101010', 0.04], bloom: 0.12 };

// ---------- kits (drawn, not the exact designs) and the cast: cartoons, not likenesses
const SKIN_L = { base: '#ECC6A2', shade: '#D8AC86', deep: '#B4845C', blush: '#E2967E', hi: '#F7DEC2' };
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const SKIN_D = { base: '#8A5A3A', shade: '#74482C', deep: '#56331E', blush: '#7C4832', hi: '#A8744E' };
const BYEL = '#F5D10F', BGRN = '#1E8A4C', BBLUE = '#1E46A8', IBLUE = '#2A63C8';
// Brazil: yellow shirts, blue shorts, white socks. Italy: blue shirts, white shorts, blue socks
const BRA = { shirt: BYEL, shirtD: '#D4B00A', trim: BGRN, num: BGRN, numEdge: null, shorts: BBLUE, socks: '#F4F4F2', band: BGRN, boots: '#1A1B1F', badge: BBLUE };
const ITA = { shirt: IBLUE, shirtD: '#1E4CA0', trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: '#F1EFE8', socks: IBLUE, band: '#F4F4F2', boots: '#1A1B1F', badge: '#F4F4F2' };
// the goalkeepers' kits were not checked: two greys, told apart from each other and from both teams
const GK_TAF = { shirt: '#6B7782', shirtD: '#56606A', trim: BYEL, num: '#F4F4F2', numEdge: null, shorts: '#2A2D34', socks: '#6B7782', band: BYEL, boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: BYEL };
const GK_PAG = { shirt: '#2C2F36', shirtD: '#1E2026', trim: '#9AA0A8', num: '#F4F4F2', numEdge: null, shorts: '#2C2F36', socks: '#2C2F36', band: '#9AA0A8', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#9AA0A8' };
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: '#22252D', suitD: '#16181E', shirt: 'tee', ears: 1.0, ...o });
// Baggio's hair: combed straight back into a short ponytail ("il Divin Codino")
const CODINO = '#2B1D14';
// the ponytail: a short tuft tied at the back of the head, as in the photographs: from straight in front it hides behind
// the head; as he turns it shows, small, at the nape (it was long and strange: the author asked for it shorter)
const ponytail = (g, x, sc = 1) => { g.save(); g.translate(x, 0); g.scale(sc, 1); g.fillStyle = CODINO;
  g.beginPath(); g.moveTo(-10, 38); g.bezierCurveTo(-13, 70, -6, 100, 6, 118); g.bezierCurveTo(12, 124, 20, 120, 18, 110); g.bezierCurveTo(12, 92, 12, 66, 11, 38); g.closePath(); g.fill(); g.restore(); };
const codinoFx = (g, layer, { fw, fh = 1, turn = 0 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = CODINO;
  if (layer === 'back') { const at = Math.abs(turn);  // turn > 0: the face toward +x, the back of the head (and the tuft) toward -x
    if (at > 0.3) { const side = turn > 0 ? -1 : 1; ponytail(g, side * 90 * at * fw - turn * 10, side); }
    g.fillStyle = CODINO; g.beginPath(); g.ellipse(0, -30, 104 * fw, 106, 0, 0, 7); g.fill(); return; }
  const p = new Path2D(); p.moveTo(-w - 2, -12); p.bezierCurveTo(-w - 8, -h * 0.95, -40, -h - 14, 0, -h - 12); p.bezierCurveTo(40, -h - 14, w + 8, -h * 0.95, w + 2, -12);
  p.bezierCurveTo(w - 6, -66, 54, -94, 0, -96); p.bezierCurveTo(-54, -94, -w + 6, -66, -w - 2, -12); g.fill(p);
  g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 26, -96 + Math.abs(i) * 4); g.quadraticCurveTo(i * 31, -h * 0.9, i * 27, -h - 4 + Math.abs(i) * 6); g.stroke(); } };
const codinoBack = (g, { fw, fh }) => { g.fillStyle = CODINO; g.beginPath(); g.ellipse(0, -16, 102 * fw, 112 * fh, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-11, 66); g.bezierCurveTo(-17, 88, -10, 108, 0, 116); g.bezierCurveTo(10, 108, 17, 88, 11, 66); g.closePath(); g.fill();  // the ponytail: a short tuft
  g.fillStyle = '#1A120C'; g.fillRect(-12, 68, 24, 7);  // the band
  g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 28, -110); g.quadraticCurveTo(i * 22, -10, i * 6, 64); g.stroke(); } };
CAST.rbaggio = head('buzz', [0.95, 1.08, 0.9], CODINO, { skin: SKIN_L, brow: '#20160F', hairFx: codinoFx, backFx: codinoBack });
CAST.taffarel = head('swept', [0.98, 1.06, 0.92], '#7A5634', { skin: SKIN_T, brow: '#4A321E' });
CAST.pagliuca = head('messy', [0.98, 1.05, 0.92], '#1E1612', { skin: SKIN_T });
CAST.baresi = head('receding', [0.97, 1.06, 0.91], '#2A1E16', { skin: SKIN_T, age: 0.2 });
CAST.massaro = head('receding', [0.98, 1.05, 0.93], '#3A2A1E', { skin: SKIN_T, age: 0.25 });
CAST.albertini = head('swept', [0.96, 1.05, 0.9], '#2A1E16', { skin: SKIN_T });
CAST.evani = head('messy', [0.97, 1.05, 0.91], '#2A1E16', { skin: SKIN_L });
CAST.ita1 = head('swept', [0.97, 1.06, 0.92], '#1E1612', { skin: SKIN_T });
CAST.ita2 = head('buzz', [0.98, 1.05, 0.92], '#2A1E16', { skin: SKIN_L });
CAST.romario = head('buzz', [0.96, 1.04, 0.9], '#120D0A', { skin: SKIN_M, brow: '#0E0A08' });
CAST.dunga = head('swept', [0.98, 1.06, 0.93], '#3A2618', { skin: SKIN_T });
CAST.branco = head('curly', [0.98, 1.05, 0.92], '#17110D', { skin: SKIN_M, brow: '#100C0A' });
CAST.msantos = head('buzz', [0.97, 1.06, 0.91], '#17110D', { skin: SKIN_M, brow: '#100C0A' });
CAST.msilva = head('bald', [0.98, 1.05, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.cafu = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.bra1 = head('curly', [0.96, 1.04, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.bra2 = head('swept', [0.97, 1.06, 0.91], '#2A1E16', { skin: SKIN_T });
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const BAGGIO = mk('rbaggio', ITA, 10, 1.74), BARESI = mk('baresi', ITA, 6, 1.76), MASSARO = mk('massaro', ITA, 19, 1.77), ALBERTINI = mk('albertini', ITA, 11, 1.79), EVANI = mk('evani', ITA, 17, 1.76);
const PAGLIUCA = mk('pagliuca', GK_PAG, 1, 1.9), TAFFAREL = mk('taffarel', GK_TAF, 1, 1.82);
const ROMARIO = mk('romario', BRA, 11, 1.69), DUNGA = mk('dunga', BRA, 8, 1.76), BRANCO = mk('branco', BRA, 6, 1.75), MSANTOS = mk('msantos', BRA, 15, 1.86), MSILVA = mk('msilva', BRA, 5, 1.79), CAFU = mk('cafu', BRA, 14, 1.76);
const ITAS = [BARESI, mk('ita1', ITA, 5, 1.86), mk('ita2', ITA, 3, 1.8), ALBERTINI, mk('ita1', ITA, 16, 1.76), mk('ita2', ITA, 14, 1.82), MASSARO, EVANI, mk('ita1', ITA, 2, 1.81), mk('ita2', ITA, 13, 1.83)];
const BRAS = [DUNGA, ROMARIO, BRANCO, MSANTOS, MSILVA, CAFU, mk('bra1', BRA, 7, 1.77), mk('bra2', BRA, 13, 1.83), mk('bra1', BRA, 17, 1.75), mk('bra2', BRA, 9, 1.79), mk('bra1', BRA, 21, 1.8)];

// ---------- the Rose Bowl: a bowl, open to the sky, full; the crowd in yellow and green, blue and white
const FLAG_BRA = g => { g.fillStyle = BGRN; g.fillRect(0, 0, 1, 1); g.fillStyle = BYEL; g.beginPath(); g.moveTo(0.5, 0.1); g.lineTo(0.93, 0.5); g.lineTo(0.5, 0.9); g.lineTo(0.07, 0.5); g.closePath(); g.fill();
  g.fillStyle = BBLUE; g.beginPath(); g.ellipse(0.5, 0.5, 0.2, 0.22, 0, 0, 7); g.fill(); };
const FLAG_ITA = g => { g.fillStyle = '#1E8A4C'; g.fillRect(0, 0, 1 / 3, 1); g.fillStyle = '#F4F4F2'; g.fillRect(1 / 3, 0, 1 / 3, 1); g.fillStyle = '#C8202C'; g.fillRect(2 / 3, 0, 1 / 3 + 0.01, 1); };
const CROWD_RB = [[BYEL, 30], [IBLUE, 20], ['#F4F2EC', 16], [BGRN, 10], ['#C8202C', 6], ['#3A3A40', 10], ['#E0A060', 8]];
const ARENA_RB = new Stadium({ seed: 94, density: 1, flags: 6, flagSet: [FLAG_BRA, FLAG_ITA], haze: '#B8C8D4', cloth: CROWD_RB, rc: 36 });
const BOARDS_RB = [boardDesign('PASADENA', { bg: BBLUE, ink: '#FFFFFF' }), boardDesign('17 JULY 1994'), boardDesign('WORLD CUP FINAL', { bg: BGRN, ink: '#FFFFFF' }), boardDesign('ROSE BOWL', { bg: '#C8202C', ink: '#FFFFFF' })];
const SKY_DAY = { zen: '#3E78BE', mid: '#86B2DE', hor: '#E4ECEC', clouds: 0.35, cloud: '#FFFFFF', seed: 11 };
const TURF = { colors: ['#4A9C45', '#56A84E'], wear: 0.15, haze: '#9AB0B8' };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { cheer = 0, blur = 0, hit = null, hitSide = 1, boards = BOARDS_RB, goals = true } = {}) {
  const back = c => { sky(c, B, { t, ...SKY_DAY }); ARENA_RB.draw(c, B, t, { cheer }); };
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
const LOST = { ...EXPR.sad, lid: 0.72, look: [0, 0.6], curve: -0.5 };  // eyes down, the mouth pulled down
const HOT = { ...EXPR.tired, sweat: 1, lid: 0.5 };
const GRAVE_B = { ...EXPR.focus, brow: 0.4, lid: 0.16, curve: -0.2 };  // set on what he has to do
// ---------- poses of this film
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };  // hands on hips
const DESPAIR = { ...POSE.handsOnHead(), lean: -0.05 };
const KNEEL = { hip: [[0.06, 0.14], [0.06, 0.14]], knee: [1.63, 1.63], toes: [1.5, 1.5], pelvisY: 0.47, ground: false, lean: 0.03 };
const ARMS_LINKED = { sh: [[1.32, 1.2], [1.32, 1.2]], el: [0.25, 0.25], lean: 0.03 };  // arms over the next men's shoulders
const BANNER_UP = { sh: [[1.75, 0.18], [1.75, 0.18]], el: [0.45, 0.45], fingers: true, lean: -0.03 };  // both hands up in front, holding a banner
// down on both knees from standing, u: 0..1 (as in plea2005)
function kneelDown(pl, st, u, to = KNEEL) {
  const f = [Math.cos(st.head), Math.sin(st.head)], own = st.pose || {};
  const kn = onGrass(pl, { ...st, pose: { ...own, ...to } }, true);
  if (u >= 1) return kn;
  const up = grounded(pl, { ...st, pose: { ...POSE.stand(), ...own } }).pose;
  const sq = grounded(pl, { ...st, pose: { ...POSE.stand(), ...own, hip: [[0.95, 0.12], [0.95, 0.12]], knee: [2.05, 2.05], lean: 0.12 } }).pose;
  const w1 = smooth(clamp(u / 0.5)), w2 = smooth(clamp((u - 0.38) / 0.62));
  const pose = blend(blend(up, sq, w1), kn.pose, w2), back = 0.42 * (1 - w2) - 0.1 * w1 * (1 - w2);
  return onGrass(pl, { ...st, x: st.x - f[0] * back, z: st.z - f[1] * back, pose });
}
// people: a man who stands, one who jogs in a straight line, one who jumps on the spot (the knees give as he lands)
const man = (t, pl, x, z, hd, pose = {}, e = 'focus', ph = 0, extra = {}) => P(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph, ...extra });
const jog = (t, t0, pl, x0, z0, vx, vz, ph = 0, e = 'focus', arms = null) => { const sp = Math.hypot(vx, vz), st = clamp(1.15 + 0.3 * sp, 1.3, 3.6), d = sp * (t - t0), r = POSE.run(2 * PI * d / st + ph, clamp(sp / 6.5, 0.35, 1), 0);
  return P(pl, { x: x0 + vx * (t - t0), z: z0 + vz * (t - t0), head: Math.atan2(vz, vx), pose: arms ? { ...r, ...arms } : r, e, t: t + ph }); };
const hopper = (t, pl, x, z, hd, ph, { amp = 0.16, arms = POSE.armsUp(1), e = JOY, rate = 6.5 } = {}) => { const a = Math.abs(Math.sin(t * rate + ph)), bend = 0.2 + 0.55 * (1 - a);
  return P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...arms, hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend], lift: amp * a }, e, t: t + ph })); };
// a ring drawn round a point in the world (a strapped thigh, a knee)
function ringAt(g, pos, r, col, a = 1) {
  const q = B.project(pos[0], pos[1], pos[2]); if (q.z < 0.3 || a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(12,9,6,0.6)'; g.lineWidth = Math.max(6, 0.03 * q.s); g.beginPath(); g.arc(q.x, q.y, r * q.s, 0, 2 * PI); g.stroke();
  g.strokeStyle = col; g.lineWidth = Math.max(4, 0.018 * q.s); g.beginPath(); g.arc(q.x, q.y, r * q.s, 0, 2 * PI); g.stroke(); g.restore();
}
// the banner the Brazilians held up after the final (the words as reported; the lettering is ours)
const BANNER = makeCanvas(1200, 300);
{ const b = BANNER.getContext('2d'); b.fillStyle = '#F4F2EC'; b.fillRect(0, 0, 1200, 300); b.fillStyle = BGRN; b.fillRect(0, 0, 1200, 20); b.fillRect(0, 280, 1200, 20);
  b.textAlign = 'center'; b.textBaseline = 'middle'; b.font = '900 64px Rubik'; b.fillStyle = BBLUE; b.fillText('SENNA... ACELERAMOS JUNTOS,', 600, 108); b.fillStyle = BGRN; b.font = '900 76px Rubik'; b.fillText('O TETRA É NOSSO!', 600, 202); }
// a banner held between two points of the world (the hands of the two men at its ends): top-left, top-right, bottom-left
function bannerItem(L, R, h = 0.55) {
  const mid = [(L[0] + R[0]) / 2, (L[1] + R[1]) / 2, (L[2] + R[2]) / 2];
  return { get d() { return depth(mid[0], mid[1], mid[2]) - 0.15; }, draw: g => {
    const tl = B.project(L[0], L[1] + 0.06, L[2]), tr = B.project(R[0], R[1] + 0.06, R[2]), bl = B.project(L[0], L[1] - h, L[2]); if (tl.z < 0.3 || tr.z < 0.3) return;
    g.save(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.translate(6, 10); g.beginPath(); g.moveTo(tl.x, tl.y); g.lineTo(tr.x, tr.y); g.lineTo(tr.x + bl.x - tl.x, tr.y + bl.y - tl.y); g.lineTo(bl.x, bl.y); g.closePath(); g.fill(); g.restore();
    g.save(); g.transform((tr.x - tl.x) / BANNER.width, (tr.y - tl.y) / BANNER.width, (bl.x - tl.x) / BANNER.height, (bl.y - tl.y) / BANNER.height, tl.x, tl.y); g.drawImage(BANNER, 0, 0); g.restore(); } };
}

// ---------- pictures drawn flat on the screen
function photoIn(g, img, x, y, w, h, { z = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * z, sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, x, y, w, h); g.restore();
}
// the score in a corner. m: what the box beside it says ('' for none); hotL, hotR: the side that has just scored swells
function scoreBug(g, L, R, a, b, m, { x = 40, y = 76, al = 1, colL = BYEL, colR = IBLUE } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54, my = y + hh / 2 + 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = colL; g.fillRect(x, y, 14, hh); g.fillStyle = colR; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(L, x + 26, my); g.fillText(R, x + w - 104, my);
  g.textAlign = 'center'; g.fillText(String(a), x + w / 2 - 32, my); g.fillText('–', x + w / 2 - 2, my); g.fillText(String(b), x + w / 2 + 28, my);
  if (m) { g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 74, my); }
  qaRect(g, x, y, w + (m ? 140 : 0), hh, 'text', 'score bug');
  g.restore();
}
// the shoot-out so far: five marks a side, Italy above (they kicked first): a tick for a goal, a cross for a miss
function shootout(g, t, kicks, { x = 40, y = 76, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textBaseline = 'middle'; g.letterSpacing = '3px';
  const w = 470, hh = 52;
  [['ITA', IBLUE, kicks.filter(k => k.side === 'ITA')], ['BRA', BYEL, kicks.filter(k => k.side === 'BRA')]].forEach(([lab, col, ks], r) => {
    const yy = y + r * (hh + 8);
    g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, yy + 5, w, hh); g.fillStyle = CREAM; g.fillRect(x, yy, w, hh); g.fillStyle = col; g.fillRect(x, yy, 14, hh);
    g.font = sans(30, 900); g.fillStyle = C.ink; g.textAlign = 'left'; g.fillText(lab, x + 28, yy + hh / 2 + 2);
    for (let i = 0; i < 5; i++) {
      const cx = x + 140 + i * 54, cy = yy + hh / 2, k = ks[i], done = k && t >= k.resT, pop = done ? 1 + 0.45 * Math.exp(-(t - k.resT) * 6) : 1;
      if (!done) { g.strokeStyle = 'rgba(30,34,44,0.3)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 15, 0, 2 * PI); g.stroke(); continue; }
      g.fillStyle = k.goal ? '#2E9B57' : RED; g.beginPath(); g.arc(cx, cy, 17 * pop, 0, 2 * PI); g.fill();
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 5 * pop; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      if (k.goal) { g.moveTo(cx - 8 * pop, cy); g.lineTo(cx - 2 * pop, cy + 6 * pop); g.lineTo(cx + 9 * pop, cy - 7 * pop); }
      else { const s = 7 * pop; g.moveTo(cx - s, cy - s); g.lineTo(cx + s, cy + s); g.moveTo(cx + s, cy - s); g.lineTo(cx - s, cy + s); }
      g.stroke();
    }
    g.font = sans(36, 900); g.textAlign = 'center'; g.fillStyle = C.ink; g.fillText(String(ks.filter(k => t >= k.resT && k.goal).length), x + w - 34, yy + hh / 2 + 2);
  });
  qaRect(g, x, y, w, hh * 2 + 8, 'text', 'shoot-out');
  g.restore();
}
// the cover: his name, then the hook in two lines
function title3(g, a = 1, k = 1, y = 205) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.strokeStyle = '#0E1018';
  g.lineWidth = 22; g.font = sans(100, 900); g.strokeText('ROBERTO BAGGIO', 0, 0); g.fillStyle = '#FFFFFF'; g.fillText('ROBERTO BAGGIO', 0, 0);
  g.lineWidth = 18; g.font = sans(70, 900); g.strokeText('ONE PENALTY', 0, 104); g.fillStyle = '#5B9BFF'; g.fillText('ONE PENALTY', 0, 104);
  g.lineWidth = 20; g.font = sans(100, 900); g.strokeText('OVER THE BAR', 0, 210); g.fillStyle = '#FF4B3A'; g.fillText('OVER THE BAR', 0, 210);
  g.restore();
  qaRect(g, 30, y - 95 * k, W - 60, 340 * k, 'text', 'cover title');
}
// the end turns cold: the colour drains out of the picture (k: 0..1) and a blue shadow comes in. Drawn after the grade
function sadPost(g, k) {
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${Math.min(1, k).toFixed(3)})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(60,90,140,${(0.4 * k).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore();
}
function title2(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FF4B3A', s1 = 96, s2 = 132, a = 1, k = 1 } = {}) {  // a small line over a heavy one
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, 0, 0); g.fillStyle = c1; g.fillText(l1, 0, 0);
  g.font = sans(s2, 900); g.strokeText(l2, 0, s2 * 1.02); g.fillStyle = c2; g.fillText(l2, 0, s2 * 1.02);
  g.restore();
  qaRect(g, 40, y - s1 * 0.8, W - 80, s1 * 0.8 + s2 * 1.1, 'text', 'cover title');
}

// ---------- a penalty at the +x goal. k: {pl, foot, tk (the strike), res: 'goal' | 'save' | 'over' | 'post', to: [y, z] (where the
// ball crosses the goal line, or meets the keeper's hands), dur (flight), keeper, dive: {side, dz} (side +1: to the keeper's own
// left, which is -z), side ('ITA' | 'BRA'), resT (when the shoot-out marks it; default: when the ball gets there)}
const SPOT = 41.5, LINE = 52.5;
function penalty(k) {
  const s = k.foot === 'L' ? -1 : 1, B0 = [SPOT, BALL_R, 0], [ty, tz] = k.to, dur = k.dur ?? 0.42, tl = k.tk + dur;
  k.mv = new Mover([[k.tk - (k.run ?? 1.8), SPOT - 4.2, 1.9 * s], [k.tk - 0.3, SPOT - 0.75, 0.3 * s], [k.tk, SPOT - 0.3, 0.1 * s], [k.tk + 0.45, SPOT + 0.5, -0.05 * s, { stop: true }], [99, SPOT + 0.5, -0.05 * s]], { heading0: -0.45 * s });
  k.gk = new Mover([[k.tk - 9, LINE - 0.3, 0], [99, LINE - 0.3, 0]], { heading0: PI, face: () => PI });
  k.dive = { t0: k.tk - 0.04, dur: 0.5, ...k.dive };
  const segs = [{ t0: k.tk - 30, t1: k.tk, kind: 'hold', from: B0 }];
  if (k.res === 'goal') segs.push({ t0: k.tk, t1: tl, kind: 'air', from: B0, to: [LINE + 0.1, ty, tz], g: 3 },
    { t0: tl, t1: tl + 0.35, kind: 'air', from: [LINE + 0.1, ty, tz], to: [LINE + 1.4, Math.max(BALL_R, ty * 0.45), tz * 1.04] },
    { t0: tl + 0.35, t1: tl + 1.2, kind: 'roll', from: [LINE + 1.4, BALL_R, tz * 1.04], to: [LINE + 1.75, BALL_R, tz * 1.05] }, { t0: tl + 1.2, t1: 99, kind: 'hold', from: [LINE + 1.75, BALL_R, tz * 1.05] });
  if (k.res === 'post') segs.push({ t0: k.tk, t1: tl, kind: 'air', from: B0, to: [LINE + 0.02, ty, tz], g: 3 },
    { t0: tl, t1: tl + 0.32, kind: 'air', from: [LINE + 0.02, ty, tz], to: [LINE + 1.3, BALL_R, tz * 0.62] }, { t0: tl + 0.32, t1: 99, kind: 'hold', from: [LINE + 1.3, BALL_R, tz * 0.62] });
  if (k.res === 'save') segs.push({ t0: k.tk, t1: tl, kind: 'air', from: B0, to: [LINE - 0.45, ty, tz], g: 3 },
    { t0: tl, t1: tl + 0.6, kind: 'air', from: [LINE - 0.45, ty, tz], to: [LINE - 5.2, BALL_R, tz * 1.7] }, { t0: tl + 0.6, t1: tl + 1.6, kind: 'roll', from: [LINE - 5.2, BALL_R, tz * 1.7], to: [LINE - 6.6, BALL_R, tz * 2.0] },
    { t0: tl + 1.6, t1: 99, kind: 'hold', from: [LINE - 6.6, BALL_R, tz * 2.0] });
  if (k.res === 'over') segs.push({ t0: k.tk, t1: tl, kind: 'air', from: B0, to: [LINE + 6.5, ty, tz], g: 3 }, { t0: tl, t1: tl + 0.35, kind: 'air', from: [LINE + 6.5, ty, tz], to: [LINE + 7.9, ty + 0.6, tz] }, { t0: tl + 0.35, t1: 99, kind: 'hold', from: [LINE + 7.9, ty + 0.6, tz] });
  k.bp = new BallPath(segs); k.tl = tl; k.goal = k.res === 'goal' || k.res === 'post';
  // when the ball crosses the line (for an 'over', the bar): the moment the crowd and the shoot-out react
  k.cross = k.res === 'over' ? k.tk + dur * (LINE - SPOT) / (LINE + 6.5 - SPOT) : tl;
  k.resT = k.resT ?? k.cross;
  k.hit = k.goal ? { t0: tl, y: ty, z: k.res === 'post' ? tz * 0.85 : tz, k: 1 } : null;
  // what the kicker does after: arms up, or hands to his head
  k.items = (t, { e = 'focus', show = true } = {}) => {
    const kick = runKick(k.mv, t, k.tk, k.foot, { e }), r = smooth(clamp((t - k.cross - 0.15) / 0.4));
    const after = k.goal ? { ...POSE.armsUp(1), lean: -0.05 } : DESPAIR;
    const kicker = P(k.pl, r > 0 ? { ...kick, pose: blend(kick.pose, after, r), e: k.goal ? JOY : 'shock' } : kick);
    const kp = P(k.keeper, keeper(k.keeper, k.gk, t, { dive: k.dive, face: PI, e: 'focus' }));
    const ballOn = show && !(k.res === 'over' && t > k.tl + 0.3);
    return [kicker, kp, ...(ballOn ? [ballOf(k.bp, t, { trail: t > k.tk && t < k.tl + 0.1 ? trailOf(k.bp, t) : null })] : [])];
  };
  return k;
}
// cameras for the spot kicks: behind the kicker; behind the net, low; beside the goal. Given the kick k, they creep in from
// the run-up to the strike and drift on after it (no static shots: the author)
const camV = (tt, k) => (k ? smooth(clamp((tt - k.tk + 1.4) / 2.4)) : 0.5);
const CAM_BEHIND = (tt, k) => { const v = camV(tt, k); return lookFrom([SPOT - 7.3 + 1.2 * v + 0.25 * Math.sin(tt * 0.6), 1.9 - 0.12 * v, 1.5 - 0.4 * v], [LINE - 1.3, 1.15, -0.1], { fov: 1700 + 110 * v, cy: H * 0.47 }); };
const CAM_GOAL = (tt, k) => { const v = camV(tt, k); return lookFrom([LINE + 6.5 - 0.9 * v, 1.55 - 0.1 * v, 1.5 - 0.6 * v + 0.1 * Math.sin(tt * 0.5)], [SPOT + 2.5, 1.5, -0.35], { fov: 1700 + 100 * v, cy: H * 0.5 }); };
// behind the net, off to one side: the goalkeeper big, the kicker beyond him
const CAM_SIDE = (tt, k) => { const v = camV(tt, k); return lookFrom([LINE + 6.0 - 0.9 * v, 1.45, -3.0 + 0.9 * v + 0.1 * Math.sin(tt * 0.5)], [SPOT + 1.5, 1.2, 0.6], { fov: 1400 + 90 * v, cy: H * 0.5 }); };
// ================================================================== the film
// About 1:04 (the author: "reduce length of the video to 1 minute, like 1:01-1:05"). It plays as one take: every change of
// shot is a camera swing or a push, and every shot moves (a dolly, an orbit, a crane, people in motion; the author: "make
// static scenes more dynamic"). The real photograph of Baggio at the spot opens the film under his name, and closes it: the
// drawing of the same moment dissolves into it ("to show how it was in real life")
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  let panN = 0;  // the film plays as one take: every change of shot is a camera swing (pan) or a push, never a hard cut
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: DAY_G, trans: 'pan', panDir: panN++ % 2 ? -1 : 1, transDur: 0.3, noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player'];
  const FRONT = 0;  // facing +x, toward the goal of the shoot-out

  // ---------- the photograph (photos/iconic.jpg, sent by the author): Baggio at the spot after the miss, seen from his right,
  // facing the right of the picture, head down, his right hand on his hip
  const IM = IMG.iconic; if (!IM) throw new Error('photos/iconic.jpg is missing');
  const PH = Math.round(W * IM.height / IM.width);
  // enlarged once to the width of the frame; its top and bottom edges fade into the blurred copy behind it
  const IMF = (() => { const c = makeCanvas(W, PH), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(IM, 0, 0, W, PH);
    x.globalCompositeOperation = 'destination-in'; const gr = x.createLinearGradient(0, 0, 0, PH);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.09, 'rgba(0,0,0,1)'); gr.addColorStop(0.95, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, W, PH); return c; })();
  // the photograph across the frame, its top at y0, over a blurred, darkened copy of itself; z: a push toward his face
  const photoPlate = (g, y0, { z = 1, rot = 0, fx = 0.57, fy = 0.27 } = {}) => {
    g.save(); g.filter = 'blur(28px) brightness(0.5)'; photoIn(g, IM, -80, -80, W + 160, H + 160, { fx: 0.5, fy: 0.42 }); g.restore();
    const cx = W * fx, cy = y0 + PH * fy;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(z, z); g.translate(-cx, -cy); g.drawImage(IMF, 0, y0, W, PH); g.restore();
  };

  // ======================= THE OPENING, made to be lifted out whole: the photograph and his name; one penalty; over the bar
  const oneT = wn('hook', 'One') - 0.1, heT = wn('hook', 'He') - 0.08, hisT = wn('hook', 'His') - 0.1, robT = wn('hook', 'Roberto') - 0.12, ctxA = s('ctx') - 0.2;
  const kH = penalty({ pl: BAGGIO, foot: 'R', tk: wn('hook', 'sent') + 0.04, res: 'over', to: [4.6, 0.35], dur: 0.6, keeper: TAFFAREL, dive: { side: 1, dz: -2.0 }, side: 'ITA' });
  // after the kick, as in the photograph: alone at the spot, his right hand on his hip, the left arm hanging, head down
  const ALONE = { ...POSE.stand(), sh: [[0.1, 0.12], [0.25, 0.85]], el: [0.3, -0.25], fore: [0.1, -0.86], look: -0.62, lean: 0.07 };
  const lone = t => P(BAGGIO, grounded(BAGGIO, { x: SPOT + 0.4, z: 0.05, head: FRONT + 0.05 * Math.sin(t * 0.7), pose: { ...ALONE, lean: 0.07 + 0.012 * Math.sin(t * 1.3) }, e: LOST, t }));
  // Brazilians running past him to their goalkeeper. Movers made once; each stops near the goal and jumps there. wide: they
  // pass well to the sides of the spot
  const RUSH = [[BRAS[0], 37.5, -4.5, 0], [BRAS[1], 38.5, 3.8, 1.1], [BRAS[2], 35.5, 6.5, 2.3], [BRAS[6], 39.5, -2.8, 3.4], [BRAS[8], 34.5, -7.5, 4.6], [BRAS[9], 36.5, 1.6, 5.2]];
  const rushOf = (t0, wide = false, dx = 0) => RUSH.map(([pl, x0, z0, ph]) => { x0 += dx; z0 *= wide ? 1.4 : 1; const tx = LINE - 2.6 + 0.5 * Math.sin(ph * 3), tz = wide ? (z0 >= 0 ? 5.6 + 0.3 * ph : -5.6 - 0.3 * ph) : z0 * 0.3, ta = t0 + Math.hypot(tx - x0, tz - z0) / 6.6;
    return { pl, ph, ta, mv: new Mover([[t0, x0, z0], [ta, tx, tz, { stop: true }], [99, tx, tz]], { face: tt => (tt > ta - 0.2 ? PI : null), turn: 6 }) }; });
  const rushers = rs => t => rs.map(r => { const ms = moving(r.mv, t, { e: JOY, t: t + r.ph }), up = smooth(clamp((t - r.ta + 0.3) / 0.4)), a = Math.abs(Math.sin(t * 6.5 + r.ph)), bend = 0.2 + 0.55 * (1 - a);
    const pose = blend(blend(ms.pose, { sh: [[2.5, 0.6], [2.5, 0.6]], el: [0.4, 0.4] }, 0.85), { ...POSE.stand(), ...POSE.armsUp(1), hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend] }, up);
    return P(r.pl, grounded(r.pl, { ...ms, pose: { ...pose, lift: 0.15 * a * up } })); });
  const RUSH_H = rushers(rushOf(hisT - 0.25));
  // "The best player in the world": the photograph, his name over it (viewers did not know him from the drawing: the author)
  const coverK = t => 1 + 0.06 * Math.exp(-Math.max(0, t - 0.05) * 6);
  shot(0, (g, lt, t) => {
    g.fillStyle = '#05070B'; g.fillRect(0, 0, W, H);
    photoPlate(g, 390, { z: 1 + 0.12 * glide(clamp(lt / oneT)) });
    const gr = g.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, 'rgba(6,8,14,0.82)'); gr.addColorStop(1, 'rgba(6,8,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 600);
  }, { grade: PRINT_G, hud: (g, lt, t) => { title3(g, fadeOut(t, oneT - 0.1, 0.1), coverK(t)); } });
  cue(0, 'boom_cine', 0.4); cue(0.05, 'camera', 0.3); cue(0.9, 'heartbeat', 0.45);
  // "One penalty to keep a World Cup final alive": from the grass at the ball the camera rises behind him, up to his head
  shot(oneT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - oneT) / (heT - oneT))); return lookFrom([SPOT - 3.6, lerp(0.34, 1.1, v), 1.2], [LINE, lerp(0.85, 1.2, v), -0.2], { fov: lerp(1450, 1520, v), cy: H * 0.56 }); }, { shake: 0.5 });
    stadium(g, t, [P(BAGGIO, grounded(BAGGIO, { x: SPOT - 1.15, z: 0.25, head: FRONT, pose: { ...POSE.stand(), ...HIPS, lean: 0.05 + 0.012 * Math.sin(t * 2.1) }, e: 'focus', t })), P(TAFFAREL, { ...keeper(TAFFAREL, kH.gk, t, { face: PI }), pose: { ...SET, lift: 0.12 * Math.max(0, Math.sin(t * 5.5)) } }), ballOf(kH.bp, t)], { cheer: 0.3, blur: 2.5 });
  }, { mbStep: 3, mbMax: 12, qaAllow: [...CROWDED, 'head out of frame'], hud: (g, lt, t) => { scoreBug(g, 'BRA', 'ITA', 0, 0, 'PENS'); } });
  cue(oneT, 'whoosh_soft', 0.22); cue(oneT + 0.1, 'heartbeat', 0.5); cue(oneT + 1.1, 'heartbeat', 0.5); cue(oneT + 2.1, 'heartbeat', 0.55);
  // "He sent it over the bar": from behind the net, creeping in
  shot(heT, (g, lt, t) => {
    rigFn(lt, t, tt => { const c = ease.out(clamp((tt - kH.cross - 0.05) / 0.5)), v = camV(tt, kH);  // once the ball is over, the lens snaps in on him
      return lookFrom([LINE + 6.5 - 0.9 * v, 1.55 - 0.1 * v, 1.5 - 0.6 * v + 0.1 * Math.sin(tt * 0.5)], [lerp(SPOT + 2.5, SPOT + 0.5, c), lerp(1.5, 1.2, c), lerp(-0.35, -0.05, c)], { fov: lerp(1700 + 100 * v, 4400, c), cy: H * 0.5 }); },
      { shake: 0.6 + (t > kH.cross ? 2.5 * Math.exp(-(t - kH.cross) * 6) : 0) });
    stadium(g, t, kH.items(t), { cheer: t > kH.cross ? 0.9 : 0.35, blur: 2 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'BRA', 'ITA', 0, 0, 'PENS'); } });
  cue(heT, 'whoosh_fast', 0.2); cue(kH.tk - 0.02, 'kick', 0.85); cue(kH.cross, 'crowd_gasp', 0.6); cue(kH.cross + 0.1, 'boom_move', 0.4);
  // "His name?": from behind him, closing in; yellow shirts running past
  shot(hisT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.out(clamp((tt - hisT) / (robT - hisT))); return lookFrom([SPOT - 4.8 + 1.1 * v, 1.62, -0.9 + 0.4 * v], [SPOT + 2.5, 1.35, 0.25], { fov: 1500, cy: H * 0.46 }); }, { shake: 0.4 });
    stadium(g, t, [lone(t), ...RUSH_H(t)], { cheer: 1, blur: 3 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED });
  cue(hisT, 'whoosh_soft', 0.2); cue(hisT, 'crowd_roar', 0.4);
  // "Roberto Baggio": his face, head down; the camera flies in and keeps turning round him
  shot(robT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - robT) / (ctxA - robT))); return K(PI / 2 - 0.35 + 0.3 * v, -0.04, lerp(2.3, 1.85, v), [SPOT + 0.4, 1.32, 0.05], { fov: 2400, cy: H * 0.52 }); }, { shake: 0.3 });
    stadium(g, t, [lone(t), ...RUSH_H(t)], { cheer: 1, blur: 5 });
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => {
    title2(g, 'ROBERTO', 'BAGGIO', 200, { c2: '#5B9BFF', s1: 88, s2: 128, a: clamp((t - robT - 0.08) / 0.08), k: 1 + 0.1 * Math.exp(-Math.max(0, t - robT - 0.08) * 6) });
  } });
  cue(robT + 0.08, 'boom_cine', 0.5); cue(robT + 0.1, 'reveal_bell', 0.35);

  // ======================= 17 JULY 1994, PASADENA =======================
  const ctxS = s('ctx'), pasA = wn('ctx', 'Pasadena,') - 0.1, hundT = wn('ctx', 'hundred'), braA = wn('ctx', 'Brazil') - 0.12, itaT = wn('ctx', 'Italy,') - 0.1, andA = wn('ctx', 'and') - 0.1, injT = wn('ctx', 'injured'), matchA = s('match') - 0.15;
  // both teams in their places at the kick-off (Brazil to attack +x); the forwards on their toes
  const LINEUP_B = [[-48, 0], [-30, -18], [-33, -6], [-33, 6], [-30, 18], [-17, -8], [-17, 8], [-12, -20], [-12, 20], [-0.6, -0.9], [-0.9, 1.5]], LINEUP_I = [[48, 0], [30, -18], [33, -6], [33, 6], [30, 18], [17, -8], [17, 8], [12, -20], [12, 20], [2.1, -1.7], [1.9, 1.1]];
  const bob = (t, i) => (i > 8 ? 0.05 * Math.max(0, Math.sin(t * 6 + i)) : 0);
  const lineup = t => [
    ...LINEUP_B.map(([x, z], i) => man(t, i === 0 ? TAFFAREL : BRAS[i - 1], x, z, FRONT, { lean: 0.02 + 0.01 * Math.sin(t * 1.3 + i), lift: bob(t, i) }, 'focus', i)),
    ...LINEUP_I.map(([x, z], i) => man(t, i === 0 ? PAGLIUCA : i === 10 ? BAGGIO : ITAS[i - 1], x, z, PI, { lean: 0.02 + 0.01 * Math.sin(t * 1.1 + i), lift: bob(t, i + 3) }, 'focus', i + 11)),
    BALL([0, BALL_R, 0])];
  // "July 17, 1994": the bowl from the sky; the camera dives down into it
  shot(ctxA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - ctxA) / (pasA - ctxA))); return K(0.95 - 0.6 * v, lerp(0.72, 0.22, v), lerp(128, 46, v), [0, 1, 0], { cy: H * lerp(0.5, 0.55, v) }); }, { shake: 0.2 });
    stadium(g, t, lineup(t), { cheer: 0.6, blur: 1 });
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Pasadena, California', '17 July 1994', { y: 190, t0: 0.1 });
    if (t > ctxS + 0.9) plate(g, 'WORLD CUP FINAL · THE ROSE BOWL', W / 2, 340, { color: CREAM, size: 36, ...pin(t, ctxS + 0.9) });
  } });
  cue(ctxA, 'whoosh_deep', 0.3); cue(ctxS + 0.05, 'reveal_bell', 0.25); cue(ctxS + 0.9, 'stamp', 0.3);
  // "Pasadena, a hundred degrees": the sun overhead; the camera circles players with their hands on their hips
  const sweat = t => [man(t, BRAS[4], 14.4, -1.9, PI - 0.4, { ...HIPS, look: -0.25 }, HOT, 1), man(t, ITAS[3], 16.6, -0.9, PI + 0.5, { ...HIPS, look: -0.3 }, HOT, 3),
    man(t, BRAS[0], 13.6, 1.3, -0.6, { ...HIPS }, HOT, 5), man(t, ITAS[5], 18.4, 2.0, PI, { ...HIPS, look: -0.2 }, HOT, 2), jog(t, pasA, ITAS[1], 9, -6.5, 1.3, 0.3, 4, HOT)];
  shot(pasA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - pasA) / (braA - pasA))); return K(PI + 0.45 - 0.8 * v, lerp(0.14, 0.06, v), lerp(8.0, 5.6, v), [15.8, 1.2, 0.4], { cy: H * 0.5 }); }, { shake: 0.3 });
    stadium(g, t, sweat(t), { cheer: 0.3, blur: 3 });
  }, { grade: HOT_G, qaAllow: CROWDED,
    post: (g, lt, t) => { const rg = g.createRadialGradient(W * 0.82, -80, 40, W * 0.82, -80, H * 0.75); rg.addColorStop(0, 'rgba(255,240,200,0.55)'); rg.addColorStop(0.35, 'rgba(255,214,150,0.18)'); rg.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); },
    hud: (g, lt, t) => {
      plate(g, '12:30 PM', W / 2, 300, { color: CREAM, size: 50, ...pin(t, pasA + 0.15) });
      if (t > hundT - 0.05) counter(g, '100°F', '38 °C IN THE SUN', { y: 470, size: 170, color: '#FFB347', at: [t, hundT - 0.05] });
    } });
  cue(pasA, 'whoosh_soft', 0.2); cue(pasA + 0.15, 'stamp', 0.3); cue(hundT - 0.05, 'boom_move', 0.35);
  // "Brazil against Italy": low between the two lines at the centre spot, the camera sliding along them
  shot(braA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - braA) / (andA - braA))); return lookFrom([lerp(-1.8, 1.9, v), lerp(1.15, 1.5, v), lerp(-5.6, -6.4, v)], [lerp(-0.4, 0.8, v), 1.1, 0.2], { fov: 1400, cy: H * 0.48 }); }, { shake: 0.4 });
    stadium(g, t, lineup(t), { cheer: 0.8, blur: 2.5 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    plate(g, 'BRAZIL', 300, 330, { color: BYEL, ink: '#14301E', size: 56, ...pin(t, braA + 0.05) });
    if (t > itaT) plate(g, 'ITALY', 780, 330, { color: IBLUE, ink: '#FFFFFF', size: 56, ...pin(t, itaT) });
  } });
  cue(braA, 'whoosh_fast', 0.2); cue(braA + 0.05, 'stamp', 0.35); cue(itaT, 'stamp', 0.35); cue(braA + 0.5, 'whistle', 0.3);
  // "and Baggio plays with an injured hamstring": walking it off, a hand to the back of his right thigh; the camera comes round
  // from his front to his back
  const LIMP = { sh: [[0.15, 0.1], [-0.42, 0.22]], el: [0.3, 0.18], fore: [0.1, 0.05], lean: 0.08 };
  const lM = new Mover([[andA - 1, 10, 3.5], [matchA + 1, 12.4, 2.9]], { heading0: -0.24 });
  shot(andA, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = lM.at(tt), v = ease.inOut(clamp((tt - andA) / (matchA - andA))); return K(0.45 - 0.8 * v, 0.04, lerp(3.4, 2.9, v), [m.x, 0.95, m.z], { cy: H * 0.5 }); }, { shake: 0.4 });
    const ms = moving(lM, t, { e: { ...EXPR.angry, open: 0.12, lid: 0.3 }, t, I: 0.3 }), it = P(BAGGIO, { ...ms, pose: blend(ms.pose, LIMP, 0.85) });
    stadium(g, t, [it, jog(t, andA, BRAS[6], 18, 9, -1.8, -0.3, 2.2, 'focus')], { cheer: 0.3, blur: 3.5 });
    const L = it.sk.legs[1]; ringAt(g, v3.lerp3(L.hip, L.knee, 0.45), 0.14, RED, clamp((t - injT + 0.05) / 0.15));
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { if (t > injT - 0.05) plate(g, 'A HAMSTRING INJURY', W / 2, 300, { color: RED, ink: '#FFF4E8', size: 48, ...pin(t, injT - 0.05) }); } });
  cue(andA, 'whoosh_soft', 0.2); cue(injT - 0.05, 'stamp', 0.4);

  // ======================= TWO HOURS, NO GOALS =======================
  const noA = wn('match', 'no') - 0.08, firstA = wn('match', 'For') - 0.1, shootA = s('shoot') - 0.25;
  // the match clock, through given minutes at given times
  const clk = (t, ks) => { let m = ks[0][1]; for (let i = 1; i < ks.length; i++) { const [t0, m0] = ks[i - 1], [t1, m1] = ks[i]; if (t >= t0) m = lerp(m0, m1, clamp((t - t0) / (t1 - t0))); } return Math.round(m); };
  // "Two hours,": the clock runs; Mauro Silva's long shot (75') slips through Pagliuca's gloves, hits the post and comes back to him
  const tHand = matchA + 0.42, tPost = tHand + 0.2;
  const silvaBall = new BallPath([{ t0: tHand - 1.0, t1: tHand, kind: 'air', from: [26.5, BALL_R, -5], to: [LINE - 0.55, 0.95, -0.8], g: 5 }, { t0: tHand, t1: tPost, kind: 'air', from: [LINE - 0.55, 0.95, -0.8], to: [LINE - 0.05, 0.45, -3.5], g: 9.8 },
    { t0: tPost, t1: tPost + 0.4, kind: 'air', from: [LINE - 0.05, 0.45, -3.5], to: [LINE - 1.3, BALL_R, -2.5] }, { t0: tPost + 0.4, t1: tPost + 0.8, kind: 'roll', from: [LINE - 1.3, BALL_R, -2.5], to: [LINE - 1.6, BALL_R, -2.3] }, { t0: tPost + 0.8, t1: 99, kind: 'hold', from: [LINE - 1.6, BALL_R, -2.3] }]);
  const pgM = new Mover([[tHand - 3, LINE - 0.6, -0.5], [99, LINE - 0.6, -0.5]], { heading0: PI, face: () => PI });
  shot(matchA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - matchA) / (noA - matchA)); return lookFrom([LINE - 6.9 + 1.5 * v, 1.5, -10.9 + 1.3 * v], [LINE - 0.6, 0.95, -1.6], { fov: 2300, cy: H * 0.5 }); }, { shake: 0.7 + (t > tPost ? 2 * Math.exp(-(t - tPost) * 7) : 0) });
    const kp = keeper(PAGLIUCA, pgM, t, { dive: { t0: tPost + 0.04, dur: 0.45, side: 1, dz: -1.5, reach: 0.6 }, face: PI, e: t > tHand ? 'shock' : 'focus' });
    stadium(g, t, [P(PAGLIUCA, t < tHand + 0.05 ? { ...kp, pose: blend(kp.pose, { sh: [[1.15, 0.12], [1.15, 0.12]], el: [0.55, 0.55], fingers: true }, 0.9) } : kp), ballOf(silvaBall, t, { trail: t < tHand ? trailOf(silvaBall, t) : null })], { cheer: t > tPost ? 0.9 : 0.5, blur: 2 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'BRA', 'ITA', 0, 0, `${clk(t, [[matchA + 0.05, 1], [tHand - 0.05, 75]])}'`);
    if (t > tPost) plate(g, 'OFF THE POST', W / 2, 300, { color: CREAM, size: 44, ...pin(t, tPost) });
  } });
  cue(matchA, 'whoosh_fast', 0.2); cue(tHand, 'touch', 0.5); cue(tPost, 'thud', 0.7); cue(tPost + 0.02, 'crowd_gasp', 0.6);
  // "no goals.": Romário misses at the far post (110') from Cafu's low cross; the whistle for the end of extra time
  const tR = noA + 0.55;
  const crossBall = new BallPath([{ t0: tR - 1.6, t1: tR, kind: 'roll', from: [45.5, BALL_R, -19], to: [LINE - 1.0, BALL_R, 3.3], decay: 0.4 }, { t0: tR, t1: tR + 0.4, kind: 'air', from: [LINE - 1.0, BALL_R, 3.3], to: [LINE + 3.6, 0.55, 5.7] },
    { t0: tR + 0.4, t1: tR + 1.4, kind: 'roll', from: [LINE + 3.6, BALL_R, 5.7], to: [LINE + 6.2, BALL_R, 6.6] }, { t0: tR + 1.4, t1: 99, kind: 'hold', from: [LINE + 6.2, BALL_R, 6.6] }]);
  const rM = new Mover([[tR - 1.6, LINE - 5.5, 8.6], [tR, LINE - 1.35, 3.5], [tR + 0.6, LINE - 0.4, 2.8, { stop: true }], [99, LINE - 0.4, 2.8]], { heading0: -0.9 });
  const pM = new Mover([[tR - 1.6, LINE - 2.5, -2.4], [tR, LINE - 1.4, -0.8], [99, LINE - 1.3, -0.6]], { heading0: PI / 2, face: () => PI / 2 });
  shot(noA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - noA) / (firstA - noA)); return lookFrom([LINE - 9.6 + 1.8 * v, 1.6, 9.6 - 1.4 * v], [LINE - 0.5, 0.75, 2.4], { fov: 1800, cy: H * 0.5 }); }, { shake: 0.7 });
    const miss = smooth(clamp((t - tR - 0.3) / 0.35)), rk = runKick(rM, t, tR, 'R', { e: 'focus' });
    stadium(g, t, [P(ROMARIO, miss > 0 ? { ...rk, pose: blend(rk.pose, DESPAIR, miss), e: 'shock' } : rk), P(PAGLIUCA, { ...moving(pM, t, { e: 'worried', t }), head: PI / 2 + 0.6 }), jog(t, noA, ITAS[0], LINE - 6, 1.5, 1.6, 0.9, 1.3, 'worried'), ballOf(crossBall, t)],
      { cheer: t > tR + 0.3 ? 0.9 : 0.6, blur: 2 });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'BRA', 'ITA', 0, 0, `${clk(t, [[noA + 0.05, 75], [tR, 110], [firstA - 0.15, 120]])}'`);
    if (t > tR + 0.3) plate(g, 'WIDE', W / 2, 300, { color: RED, ink: '#FFF4E8', size: 56, ...pin(t, tR + 0.3) });
  } });
  cue(noA, 'whoosh_fast', 0.2); cue(tR - 0.02, 'kick', 0.7); cue(tR + 0.3, 'crowd_gasp', 0.7); cue(firstA - 0.25, 'whistle', 0.5);
  // "For the first time, a World Cup final goes to penalties": both teams arm in arm in the centre circle; the camera sweeps
  // along the two lines, from the Brazilians to the Italians
  const ITAL = [BARESI, ALBERTINI, MASSARO, EVANI, BAGGIO, ITAS[1], ITAS[2]];
  const linked = t => [...[DUNGA, ROMARIO, BRANCO, MSANTOS, MSILVA, CAFU, BRAS[6]].map((pl, i) => man(t, pl, -0.5, -4.7 + i * 0.62, FRONT, { ...ARMS_LINKED, lean: 0.03 + 0.015 * Math.sin(t * 1.4 + i) }, 'worried', i)),
    ...ITAL.map((pl, i) => man(t, pl, -0.5, 1.0 + i * 0.62, FRONT, { ...ARMS_LINKED, lean: 0.03 + 0.015 * Math.sin(t * 1.2 + i) }, 'worried', i + 7))];
  shot(firstA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - firstA) / (shootA - firstA))); return K(PI / 2 + 0.35 - 0.7 * v, lerp(0.1, 0.04, v), lerp(9.0, 7.2, v), [-0.5, 1.2, lerp(-3.0, 3.0, v)], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.3 });
    stadium(g, t, linked(t), { cheer: 0.5, blur: 2.5 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    const pT = wn('match', 'penalties.') - 0.05;
    title2(g, 'FOR THE FIRST TIME', 'PENALTIES', 230, { c2: GOLD, s1: 64, s2: 132, a: clamp((t - wn('match', 'first') + 0.1) / 0.1), k: 1 + (t > pT ? 0.08 * Math.exp(-(t - pT) * 6) : 0) });
    if (t > pT) plate(g, 'A WORLD CUP FINAL GOES TO A SHOOT-OUT', W / 2, 470, { color: CREAM, size: 34, ...pin(t, pT) });
  } });
  cue(firstA, 'whoosh_soft', 0.22); cue(wn('match', 'first') - 0.1, 'boom_cine', 0.45); cue(wn('match', 'penalties.') - 0.05, 'stamp', 0.35);

  // ======================= THE SHOOT-OUT. Italy kick first =======================
  const markA = wn('shoot', 'Márcio') - 0.1, thenA = wn('shoot', 'Then') - 0.1, masA = wn('shoot', 'Taffarel') - 0.1, dunA = wn('shoot', 'Dunga') - 0.1, scoreA = wn('shoot', '3–2,') - 0.12, lastA = s('last') - 0.1;
  const qd = (masA - thenA) / 4;  // "Then four goals in a row": four kicks, one after another, each just the strike and the net
  const P1 = penalty({ pl: BARESI, foot: 'R', tk: shootA + 0.76, res: 'over', to: [4.4, 0.9], dur: 0.6, keeper: TAFFAREL, dive: { side: -1, dz: 2.0 }, side: 'ITA' });
  const P2 = penalty({ pl: MSANTOS, foot: 'R', tk: wn('shoot', 'saved.') - 0.48, res: 'save', to: [0.45, 2.1], keeper: PAGLIUCA, dive: { side: -1, dz: 2.2 }, side: 'BRA' });
  const quick = (i, o) => penalty({ foot: 'R', tk: thenA + i * qd + 0.15, run: 1.5, dur: 0.28, ...o });
  const P3 = quick(0, { pl: ALBERTINI, res: 'goal', to: [2.05, 3.0], keeper: TAFFAREL, dive: { side: 1, dz: -2.0 }, side: 'ITA' });
  const P4 = quick(1, { pl: ROMARIO, res: 'post', to: [0.45, -3.55], keeper: PAGLIUCA, dive: { side: -1, dz: 2.0 }, side: 'BRA' });
  const P5 = quick(2, { pl: EVANI, foot: 'L', res: 'goal', to: [2.0, 0.25], keeper: TAFFAREL, dive: { side: -1, dz: 2.1 }, side: 'ITA' });
  const P6 = quick(3, { pl: BRANCO, foot: 'L', res: 'goal', to: [0.35, 3.0], keeper: PAGLIUCA, dive: { side: 1, dz: -2.0 }, side: 'BRA' });
  const P7 = penalty({ pl: MASSARO, foot: 'R', tk: wn('shoot', 'Massaro.') - 0.4, res: 'save', to: [0.5, -2.0], keeper: TAFFAREL, dive: { side: 1, dz: -2.1 }, side: 'ITA' });
  const P8 = penalty({ pl: DUNGA, foot: 'R', tk: wn('shoot', 'scores.') - 0.35, res: 'goal', to: [0.35, 3.1], dur: 0.4, keeper: PAGLIUCA, dive: { side: 1, dz: -2.0 }, side: 'BRA' });
  // Baggio's: the plan was the middle, halfway up; it went over. Marked when the slow replay shows it over the bar
  const kickT = wn('last', 'dives.', 1) - 0.12, slowA = wn('last', 'The', 1) - 0.1, slowK = 0.38;
  const P9 = penalty({ pl: BAGGIO, foot: 'R', tk: kickT, run: 1.5, res: 'over', to: [4.6, 0.35], dur: 0.6, keeper: TAFFAREL, dive: { side: 1, dz: -2.0 }, side: 'ITA' });
  P9.resT = slowA + (P9.cross - (P9.tk - 0.25)) / slowK;
  const KICKS = [P1, P2, P3, P4, P5, P6, P7, P8, P9];
  const CAM_BEHIND2 = (tt, k) => { const v = camV(tt, k); return lookFrom([SPOT - 7.3 + 1.2 * v - 0.25 * Math.sin(tt * 0.6), 1.9 - 0.12 * v, -1.5 + 0.4 * v], [LINE - 1.3, 1.15, 0.1], { fov: 1700 + 110 * v, cy: H * 0.47 }); };
  const penShot = (k, a, cam, o = {}) => shot(a, (g, lt, t) => {
    rigFn(lt, t, tt => cam(tt, k), { shake: 0.6 + (t > k.cross ? 2.5 * Math.exp(-(t - k.cross) * 7) : 0) });
    stadium(g, t, k.items(t), { cheer: t > k.cross ? 0.95 : 0.45, blur: 2, hit: k.hit && t >= k.tl ? k.hit : null, hitSide: 1 });
  }, { transDur: o.td ?? 0.22, mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => { shootout(g, t, KICKS); if (o.hud) o.hud(g, lt, t); } });
  const penCues = (k, a, w = 0.18) => { cue(a, 'whoosh_fast', w); cue(k.tk - 0.02, 'kick', 0.8);
    if (k.res === 'goal') { cue(k.tl, 'net', 0.75); cue(k.tl + 0.02, 'crowd_roar', 0.45); }
    if (k.res === 'post') { cue(k.tl, 'thud', 0.5); cue(k.tl + 0.3, 'net', 0.7); cue(k.tl + 0.32, 'crowd_roar', 0.45); }
    if (k.res === 'save') { cue(k.tl, 'thud', 0.65); cue(k.tl + 0.03, 'crowd_roar', 0.55); }
    if (k.res === 'over') { cue(k.cross, 'crowd_gasp', 0.7); } };
  const missPlate = (k, txt) => (g, lt, t) => { if (t > k.cross) plate(g, txt, W / 2, 300, { color: RED, ink: '#FFF4E8', size: 44, ...pin(t, k.cross) }); };
  penShot(P1, shootA, CAM_BEHIND, { hud: missPlate(P1, 'BARESI · OVER') }); penCues(P1, shootA);
  penShot(P2, markA, CAM_BEHIND2, { hud: missPlate(P2, 'MÁRCIO SANTOS · SAVED') }); penCues(P2, markA);
  const fourPlate = (g, lt, t) => { if (t > thenA + 0.2) plate(g, 'FOUR GOALS IN A ROW', W / 2, 300, { color: '#2E9B57', ink: '#FFFFFF', size: 44, ...pin(t, thenA + 0.2) }); };
  [P3, P4, P5, P6].forEach((k, i) => { const a = thenA + i * qd; penShot(k, a, i % 2 ? CAM_SIDE : CAM_BEHIND, { td: 0.14, hud: fourPlate }); penCues(k, a, 0.1); });
  penShot(P7, masA, CAM_BEHIND, { hud: missPlate(P7, 'MASSARO · SAVED') }); penCues(P7, masA);
  penShot(P8, dunA, CAM_BEHIND2); penCues(P8, dunA);
  // "3–2, Brazil": the Italians arm in arm; Baggio lets go and walks out toward the spot, the camera backing away in front
  // of him and closing in
  const outT = scoreA + 0.9, bLine = [-0.5, 1.0 + 4 * 0.62];
  const bOut = new Mover([[outT - 1, bLine[0], bLine[1]], [outT, bLine[0], bLine[1]], [lastA + 0.6, bLine[0] + 3.6, bLine[1] - 0.3]], { heading0: FRONT, face: () => FRONT });
  const itaLine = t => ITAL.map((pl, i) => {
    if (i === 4 && t > outT) { const ms = moving(bOut, t, { e: GRAVE_B, t, I: 0.3 }); return P(BAGGIO, { ...ms, pose: blend({ ...POSE.stand(), ...ARMS_LINKED }, ms.pose, smooth(clamp((t - outT) / 0.4))) }); }
    const drop = (i === 3 || i === 5) ? smooth(clamp((t - outT) / 0.5)) : 0;  // the men either side of him let their arms fall
    return man(t, pl, -0.5, 1.0 + i * 0.62, FRONT, blend({ ...POSE.stand(), ...ARMS_LINKED, lean: 0.03 + 0.015 * Math.sin(t * 1.2 + i) }, { ...POSE.stand(), lean: 0.03 }, drop), 'worried', i + 7);
  });
  shot(scoreA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - scoreA) / (lastA - scoreA))), m = bOut.at(tt); return K(PI / 2 + 0.3 - 0.2 * v, 0.04, lerp(7.6, 4.6, v), [lerp(-0.5, m.x, v), 1.25, lerp(2.8, m.z, v)], { cy: H * 0.5 }); }, { shake: 0.3 });
    stadium(g, t, itaLine(t), { cheer: 0.8, blur: 3 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    shootout(g, t, KICKS);
    title2(g, 'BRAZIL LEAD', '3–2', 330, { c2: BYEL, s1: 72, s2: 150, a: clamp((t - scoreA - 0.1) / 0.1), k: 1 + 0.1 * Math.exp(-Math.max(0, t - scoreA - 0.1) * 6) });
  } });
  cue(scoreA, 'whoosh_soft', 0.2); cue(scoreA + 0.1, 'boom_cine', 0.45);

  // ======================= THE LAST KICK =======================
  const knowsA = wn('last', 'He') - 0.12, alwT = wn('last', 'always'), midT = wn('last', 'middle.'), divesA = wn('last', 'Taffarel', 1) - 0.12, endA = s('end') - 0.2;
  // "Italy's last kick: Baggio": the walk, alone; the camera backs away in front of him and swings across
  const walkM = new Mover([[lastA - 1, 22, -1.2], [knowsA + 1, 26.2, -0.6]], { heading0: 0.1 });
  shot(lastA, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = walkM.at(tt), v = ease.inOut(clamp((tt - lastA) / (knowsA - lastA))); return lookFrom([m.x + 3.4 - 0.7 * v, 1.55 - 0.12 * v, m.z + 1.0 - 1.8 * v], [m.x, 1.35, m.z], { fov: 1600, cy: H * 0.46 }); }, { shake: 0.4 });
    stadium(g, t, [P(BAGGIO, moving(walkM, t, { e: GRAVE_B, t, I: 0.3 }))], { cheer: 0.25, blur: 4 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    shootout(g, t, KICKS);
    plate(g, 'ITALY’S LAST KICK', W / 2, 300, { color: CREAM, size: 44, ...pin(t, lastA + 0.15) });
    const bT = wn('last', 'Baggio.'); if (t > bT) plate(g, 'MISS IT, AND BRAZIL ARE CHAMPIONS', W / 2, 395, { color: RED, ink: '#FFF4E8', size: 34, ...pin(t, bT) });
  } });
  cue(lastA, 'whoosh_soft', 0.2); cue(lastA + 0.2, 'heartbeat', 0.55); cue(lastA + 1.2, 'heartbeat', 0.55); cue(lastA + 2.2, 'heartbeat', 0.6);
  // "He knows Taffarel always dives, so he aims for the middle": over his shoulder, the plan drawn on the goal; the lens
  // closes in on it
  shot(knowsA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - knowsA) / (divesA - knowsA))); return lookFrom([SPOT - 7.9 + 0.35 * v, 1.85, 1.3 - 0.15 * v], [LINE - 0.5, 1.15, -0.3], { fov: lerp(1480, 1820, v), cy: H * 0.47 }); }, { shake: 0.35 });
    stadium(g, t, P9.items(t, { e: GRAVE_B }), { cheer: 0.25, blur: 2 });
    // the dive he expects: an arrow from the goalkeeper to his left; the target: the middle, halfway up
    const k1 = smooth(clamp((t - alwT + 0.05) / 0.4)), k2 = smooth(clamp((t - midT + 0.05) / 0.4));
    if (k1 > 0) { const a = B.project(LINE - 0.3, 1.1, 0), b = B.project(LINE - 0.3, 0.7, -2.6); g.save(); g.globalAlpha *= k1; g.strokeStyle = 'rgba(12,9,6,0.55)'; g.lineWidth = 16; g.lineCap = 'round'; g.setLineDash([1, 26]);
      const path = () => { g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + b.x) / 2, a.y - 80, lerp(a.x, b.x, k1), lerp(a.y, b.y, k1)); }; path(); g.stroke(); g.strokeStyle = '#FFFFFF'; g.lineWidth = 10; path(); g.stroke(); g.restore(); }
    if (k2 > 0) { const c = B.project(LINE + 0.05, 1.22, 0), b0 = B.project(SPOT, BALL_R, 0), r = 0.42 * c.s * (1.3 - 0.3 * k2); g.save(); g.globalAlpha *= k2;
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 5; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(b0.x, b0.y); g.lineTo(lerp(b0.x, c.x, k2), lerp(b0.y, c.y, k2)); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(12,9,6,0.6)'; g.lineWidth = 14; g.beginPath(); g.arc(c.x, c.y, r, 0, 2 * PI); g.stroke(); g.strokeStyle = GOLD; g.lineWidth = 8; g.beginPath(); g.arc(c.x, c.y, r, 0, 2 * PI); g.stroke(); g.restore(); }
  }, { qaAllow: CROWDED, hud: (g, lt, t) => {
    shootout(g, t, KICKS);
    if (t > alwT - 0.05) plate(g, 'TAFFAREL ALWAYS DIVES', W / 2, 300, { color: CREAM, size: 42, ...pin(t, alwT - 0.05) });
    if (t > midT - 0.05) plate(g, 'THE PLAN: THE MIDDLE, HALFWAY UP', W / 2, 395, { color: GOLD, size: 38, ...pin(t, midT - 0.05) });
  } });
  cue(knowsA, 'whoosh_soft', 0.2); cue(alwT - 0.05, 'stamp', 0.3); cue(midT - 0.05, 'stamp', 0.35); cue(knowsA + 0.6, 'heartbeat', 0.6); cue(knowsA + 1.6, 'heartbeat', 0.6); cue(knowsA + 2.6, 'heartbeat', 0.65);
  // "Taffarel dives": the run-up and the strike, from behind him
  penShot(P9, divesA, CAM_BEHIND, { td: 0.3 });
  cue(divesA, 'whoosh_fast', 0.18); cue(P9.tk - 0.02, 'kick', 0.9);
  // "The ball flies over the bar": the same kick again, slowly, from behind the net. The music stops just before the ball
  // goes over
  shot(slowA, (g, lt, t) => {
    const r = P9.tk - 0.25 + (t - slowA) * slowK;  // the replay's clock
    rigFn(lt, t, tt => CAM_GOAL(P9.tk - 0.25 + (tt - slowA) * slowK, P9), { shake: 0.25 });
    stadium(g, t, P9.items(r), { cheer: r > P9.cross ? 1 : 0.4, blur: 2 });
  }, { trans: 'push', qaAllow: CROWDED, post: (g, lt, t) => { g.fillStyle = 'rgba(10,14,24,0.08)'; g.fillRect(0, 0, W, H); sadPost(g, 0.35 * smooth(clamp((t - P9.resT) / 0.8))); }, hud: (g, lt, t) => {
    shootout(g, t, KICKS);
    stamp(g, 'OVER THE BAR', W / 2, 470, lt, P9.resT - slowA, { color: RED, size: 100, rot: -0.06 });
  } });
  cue(slowA, 'whoosh_deep', 0.3); cue(slowA + 0.05, 'riser', 0.25); cue(P9.resT, 'boom_big', 0.55); cue(P9.resT + 0.05, 'crowd_roar', 0.8);

  // ======================= BRAZIL CHAMPIONS; BAGGIO ALONE; THE PHOTOGRAPH =======================
  const andE = wn('end', 'And') - 0.12, yearsA = wn('end', 'Years') - 0.15, fourthT = wn('end', 'fourth');
  // the Brazilians, in slow motion: their goalkeeper on his knees, arms up; the others jumping; the banner for Ayrton Senna.
  // The camera circles them
  const champs = t => [P(TAFFAREL, kneelDown(TAFFAREL, { x: LINE - 8.2, z: 0.4, head: PI, pose: { ...POSE.armsUp(1), look: 0.5 }, e: JOY, t }, 1)),
    hopper(t, ROMARIO, LINE - 6.6, -2.4, PI + 0.3, 0.3), hopper(t, BRANCO, LINE - 6.4, 3.0, PI - 0.3, 1.4), hopper(t, MSILVA, LINE - 5.6, -0.6, PI, 2.5, { amp: 0.12 }),
    man(t, DUNGA, LINE - 4.2, 1.9, PI, BANNER_UP, JOY, 1), man(t, CAFU, LINE - 4.2, -1.2, PI, BANNER_UP, JOY, 3), bannerItem([LINE - 4.5, 2.05, 1.8], [LINE - 4.5, 2.05, -1.1])];
  shot(endA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - endA) / (andE - endA))); return K(-PI / 2 + 0.45 - 0.75 * v, lerp(0.1, 0.05, v), lerp(9.4, 7.4, v), [LINE - 6.0, 1.3, 0.4], { cy: H * 0.5 }); }, { shake: 0.6 });
    stadium(g, t, champs(endA + (t - endA) * 0.55), { cheer: 1, blur: 3 });  // slow motion
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    shootout(g, t, KICKS, { a: fadeOut(t, endA + 1.2, 0.3) });
    if (t > fourthT - 0.1) plate(g, 'BRAZIL · FOURTH WORLD CUP', W / 2, 300, { color: BYEL, ink: '#14301E', size: 48, ...pin(t, fourthT - 0.1) });
    if (t > fourthT + 0.5) plate(g, 'DEDICATED TO AYRTON SENNA', W / 2, 395, { color: CREAM, size: 34, ...pin(t, fourthT + 0.5) });
  } });
  cue(endA, 'whoosh_soft', 0.22); cue(fourthT - 0.1, 'stamp', 0.4); cue(fourthT + 0.5, 'reveal_bell', 0.3);
  // "And Baggio stays at the spot, alone, head down": in slow motion. The camera starts close on his bowed head and draws back
  // round his right side to the angle of the photograph (the whole of him, facing the right of the picture), where it stops
  // and the photograph itself takes over
  const SLOW = 0.45, PULL = yearsA - andE, A0 = -0.3, A1 = -0.7;  // the camera's bearing from him: from his front toward his right
  const iconCam = tt => { const v = ease.inOut(clamp((tt - andE) / PULL)), d = lerp(2.0, 3.45, v), a = lerp(A0, A1, v);
    return lookFrom([SPOT + 0.4 + Math.cos(a) * d, lerp(1.55, 1.05, v), 0.05 + Math.sin(a) * d], [SPOT + 0.4, lerp(1.5, 0.9, v), 0.05], { fov: lerp(2400, 2250, v), cy: H * lerp(0.45, 0.62, v) }); };
  const RUSH_E = rushers(rushOf(andE - 0.6, true, -19));
  shot(andE, (g, lt, t) => {
    const ts = andE + (t - andE) * SLOW;  // the world round him in slow motion
    rigFn(lt, t, iconCam, { shake: 0.12 });
    const it = P(BAGGIO, grounded(BAGGIO, { x: SPOT + 0.4, z: 0.05, head: FRONT + 0.04 * Math.sin(ts * 0.7), pose: { ...ALONE, look: -0.72, lean: 0.07 + 0.012 * Math.sin(ts * 1.3) }, e: { ...LOST, lid: lerp(0.72, 0.86, clamp(lt / PULL)), noBlink: true }, t: ts }));
    stadium(g, ts, [it, ...RUSH_E(ts)], { cheer: 1, blur: 6 });
  }, { trans: 'push', transDur: 0.5, vig: 0.85, qaAllow: CROWDED, post: (g, lt, t) => { sadPost(g, 0.55 * smooth(clamp((lt - 0.2) / 2.4))); }, hud: (g, lt, t) => { standing(g, t); } });
  cue(andE, 'whoosh_deep', 0.25); cue(andE + 0.5, 'heartbeat', 0.5); cue(andE + 1.6, 'heartbeat', 0.45); cue(andE + 2.7, 'heartbeat', 0.4);
  // the words over the end (a phrase written about Baggio in that moment; SOURCES.md)
  function standing(g, t) { const a = clamp((t - wn('end', 'down.') - 0.25) / 0.7); if (a <= 0) return; g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.textBaseline = 'middle';
    const k = 1 + 0.04 * (1 - a); g.translate(W / 2, 220); g.scale(k, k); g.font = '700 74px Cinzel'; g.letterSpacing = '4px';
    for (const [txt, y] of [['“THE MAN WHO', -50], ['DIED STANDING”', 50]]) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(txt, 3, y + 4); g.fillStyle = '#F4F0E8'; g.fillText(txt, 0, y); }
    g.restore(); qaRect(g, 60, 130, W - 120, 185, 'text', 'the man who died standing'); }
  // his name and the day, under the words, above his head in the photograph
  const endTitle = (g, t) => { const a = clamp((t - wn('end', 'one.') - 0.45) / 0.4); if (a <= 0) return; g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 60px Cinzel'; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText('Roberto Baggio', W / 2 + 3, 423); g.fillStyle = '#F2EEE6'; g.fillText('Roberto Baggio', W / 2, 420);
    g.font = sans(28, 800); g.letterSpacing = '6px'; g.fillStyle = 'rgba(242,238,230,0.85)'; g.fillText('PASADENA · 17 JULY 1994', W / 2, 486);
    qaRect(g, 160, 385, W - 320, 125, 'text', 'end title'); g.restore(); };
  // "Years later he said: if I could erase a moment from my career, it would be that one": the photograph itself, the real
  // moment, at the place of the drawing; it pushes in on him, and its colour drains away as he speaks
  shot(yearsA, (g, lt, t) => {
    const v = clamp(lt / (T.duration - yearsA));
    g.fillStyle = '#05070B'; g.fillRect(0, 0, W, H);
    photoPlate(g, 330, { z: 1 + 0.17 * glide(v), rot: -0.008 * v });
    const gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, 'rgba(6,8,14,0.85)'); gr.addColorStop(1, 'rgba(6,8,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 560);
  }, { grade: PRINT_G, trans: 'fade', transDur: 0.8, vig: 0.8, post: (g, lt, t) => { sadPost(g, 0.55 + 0.3 * smooth(clamp((lt - 1.0) / 4))); }, hud: (g, lt, t) => {
    standing(g, t); endTitle(g, t);
    if (lt > 0.6 && lt < 3.4) { const a = clamp((lt - 0.6) / 0.4) * (1 - clamp((lt - 2.9) / 0.5)); g.save(); g.globalAlpha *= a; g.font = sans(36, 800); g.letterSpacing = '8px'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText('THE REAL MOMENT', W / 2 + 3, 435); g.fillStyle = 'rgba(242,238,230,0.95)'; g.fillText('THE REAL MOMENT', W / 2, 432); qaRect(g, 250, 405, 580, 54, 'text', 'real moment'); g.restore(); }
  } });
  cue(yearsA, 'camera', 0.5);
  // the picture is squeezed to a line and a dot: the set is switched off, a second before the end
  const tvOff = T.duration - 1.05;
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd: a full bowl; quiet before each kick, a roar after; hushed for Baggio's walk; silent round him at the end
  amb.push({ id: 'crowd_bed', t0: 0, t1: yearsA + 0.4, gain: 0.7, fi: 0.1, fo: 0.5, keys: [[0, 0.4], [heT, 0.35], [kH.cross, 0.9], [hisT, 1.1], [ctxA, 0.75], [braA, 0.9], [andA, 0.6], [matchA, 0.7],
    [shootA, 0.5], [P8.tl + 0.3, 1.0], [lastA, 0.3], [divesA, 0.25], [P9.resT, 1.3], [andE, 0.9], [andE + 1.6, 0.18], [yearsA, 0.08]] });

  const music = [
    { t: 0, m: 'hook' }, { t: robT, m: 'hit' }, { t: ctxA, m: 'stands' }, { t: matchA, m: 'tension' }, { t: firstA, m: 'clockwork' },
    { t: shootA, m: 'tension' }, { t: lastA, m: 'void' }, { t: slowA, m: 'slam' }, { t: endA, m: 'fiesta' }, { t: andE, m: 'elegy' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [{ t0: P9.resT - 0.6, t1: P9.resT, kind: 'mute' }];  // the music stops just before the ball goes over
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
