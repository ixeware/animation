// Five goals in nine minutes. FC Bayern München 5–1 VfL Wolfsburg, Bundesliga, Allianz Arena, 22 September 2015.
// Wolfsburg lead 1–0 at half-time (Caligiuri, 26'). Pep Guardiola sends on Robert Lewandowski for Thiago. 51': a loose
// ball in the box after Dante's tackle on Müller, a tap-in. 52': from outside the box, low to the left. 55': the post,
// the goalkeeper, then in at the third try, a hat-trick in 3:22. 57': Douglas Costa's cross, a volley from close in,
// 5:42. 60': Götze's cross from the right, a scissor kick from the edge of the box into the top right corner, 8:59.
// Guardiola, who was still giving Boateng instructions at 4–1, puts his hands to his head; afterwards: "I can't explain
// it." Four Guinness World Records; he had started on the bench. Facts and what is drawn: SOURCES.md.
// Staged after the Bundesliga's uncut video of the nine minutes: who was where, which corner each ball went to, the kits.
// Palette: a floodlit night in Munich, the stands in red; Bayern all in red, Wolfsburg in white with a green band.
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, enter, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { box } from '../../engine/js/env.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, flagItems, playerItems, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, BALL_R, skeleton, figureK, v3 } from '../../engine/js/football.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI, FPS = 30;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', BRED = '#D4172F', WGREEN = '#3BA63A', LIME = '#9CCB4A', RED = '#D8453A';
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
// grades: the floodlit ground, the night outside, the interview wall
const NIGHT_G = { con: 1.07, sat: 1.04, bri: 1.02, tone: ['#FFE2B4', 0.08], lift: ['#101A34', 0.12], bloom: 0.3 };
const AIR_G = { con: 1.08, sat: 1.08, bri: 1.0, tone: ['#FF8A7A', 0.06], lift: ['#060A18', 0.1], bloom: 0.5 };
const ROOM_G = { con: 1.05, sat: 0.95, bri: 1.0, tone: ['#FFD9A0', 0.08], lift: ['#0C1220', 0.1], bloom: 0.24 };

// ---------- kits as worn that night (drawn, not the exact designs) and the cast: cartoons, not likenesses
const BAY = { shirt: BRED, shirtD: '#A60F22', trim: '#F4F4F2', num: '#F4F4F2', numEdge: '#A60F22', shorts: BRED, socks: BRED, band: '#F4F4F2', boots: '#F2F2EE', badge: '#F4F4F2' };
const WOB = { shirt: '#F4F5F2', shirtD: '#CFD4D0', trim: WGREEN, chest: WGREEN, num: '#1F6B2A', numEdge: '#F4F5F2', shorts: WGREEN, socks: '#F4F5F2', band: WGREEN, boots: '#1A1B1F', badge: WGREEN };
const WOB_GK = { shirt: '#232C4E', shirtD: '#171D36', trim: '#8FD0E8', num: '#DDE6F2', numEdge: '#171D36', shorts: '#232C4E', socks: '#232C4E', band: '#8FD0E8', boots: '#F2643A', long: true, gloves: '#F2F2EE', badge: '#DDE6F2' };
const BAY_GK = { shirt: '#6FB4E8', shirtD: '#4A8FC8', trim: '#1B2748', num: '#1B2748', numEdge: '#6FB4E8', shorts: '#1B2748', socks: '#6FB4E8', band: '#1B2748', boots: '#E8E23A', long: true, gloves: '#C8E23A', badge: '#1B2748' };
const SUIT_PEP = { shirt: '#2A2C33', shirtD: '#1B1D23', trim: '#E9E9E4', num: null, shorts: '#23252B', socks: '#23252B', boots: '#111214', long: true, trousers: true, band: null };
const TRACK_R = { shirt: '#C8202C', shirtD: '#971520', trim: '#F4F4F2', num: null, shorts: '#1B1C22', socks: '#1B1C22', boots: '#EDEDE8', long: true, trousers: true, band: null, badge: '#F4F4F2' };
const TRACK_G = { shirt: '#70757C', shirtD: '#54585E', trim: '#F4F4F2', num: null, shorts: '#1B1C22', socks: '#1B1C22', boots: '#EDEDE8', long: true, trousers: true, band: null, badge: '#F4F4F2' };
const BENCH_KIT = { shirt: '#B81A28', shirtD: '#8C121D', trim: '#F4F4F2', num: null, shorts: BRED, socks: BRED, band: '#F4F4F2', boots: '#F2702A', long: true, badge: '#F4F4F2' };  // a warm-up top over the kit
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const SKIN_D = { base: '#8A5A3A', shade: '#74482C', deep: '#56331E', blush: '#7C4832', hi: '#A8744E' };
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: BRED, suitD: '#A60F22', shirt: 'tee', ears: 1.0, ...o });
CAST.lewy = head('quiff', [0.95, 1.07, 0.88], '#2B1F17', { iris: '#5E8DB4', brow: '#221811' });
CAST.pep = head('bald', [0.97, 1.05, 0.9], '#8A8780', { brow: '#4A4640', beard: '#8C857C', beardStyle: 'full', ears: 1.02, age: 0.3, skin: SKIN_T, suit: '#2A2C33', suitD: '#1B1D23', shirt: 'tie', tie: '#3A3D46' });
CAST.muller = head('messy', [0.94, 1.08, 0.86], '#7A5A3C', { brow: '#5E4630' });
CAST.gotze = head('swept', [0.98, 1.03, 0.92], '#5E452E', { brow: '#4A3624' });
CAST.costa = head('buzz', [0.96, 1.04, 0.9], '#15100C', { skin: SKIN_D, brow: '#100C0A' });
CAST.boateng = head('buzz', [0.97, 1.06, 0.9], '#15100C', { skin: SKIN_D, brow: '#100C0A' });
CAST.vidal = head('buzz', [0.97, 1.04, 0.92], '#15100C', { skin: SKIN_M, brow: '#100C0A' });
CAST.neuer = head('swept', [0.96, 1.06, 0.9], '#C9A46A', { brow: '#A8844E', iris: '#6F9FC8' });
CAST.benaglio = head('receding', [0.97, 1.06, 0.9], '#2A2019', { brow: '#221811' });
CAST.dante = head('curly', [0.96, 1.05, 0.9], '#17110D', { skin: SKIN_D, brow: '#100C0A' });
CAST.naldo = head('buzz', [0.98, 1.07, 0.92], '#15100C', { skin: SKIN_D, brow: '#100C0A' });
CAST.calig = head('swept', [0.95, 1.05, 0.89], '#1A1410', { skin: SKIN_T, brow: '#15100C' });
CAST.wob1 = head('buzz', [0.96, 1.05, 0.9], '#B89A64', { brow: '#8E7446' });
CAST.wob2 = head('swept', [0.95, 1.06, 0.88], '#2A1E16', { skin: SKIN_T });
CAST.wob3 = head('buzz', [0.97, 1.04, 0.92], '#15100C', { skin: SKIN_M, brow: '#100C0A' });
CAST.staff1 = head('receding', [0.98, 1.04, 0.93], '#8E8A84', { brow: '#6E6A64', age: 0.3 });
CAST.staff2 = head('swept', [0.96, 1.05, 0.9], '#3A2A1E');
CAST.staff3 = head('buzz', [0.97, 1.04, 0.92], '#C9BEA8', { brow: '#9A9080', age: 0.25 });
CAST.sub1 = head('swept', [0.95, 1.06, 0.88], '#2A1E16', { skin: SKIN_T });
CAST.sub2 = head('buzz', [0.96, 1.05, 0.9], '#3A2A1E');
CAST.sub3 = head('messy', [0.95, 1.05, 0.9], '#5A4030', { brow: '#3E2C20' });
const BLACK = '#15161A';
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const LEWY = mk('lewy', { ...BAY, boots: '#F2702A' }, 9, 1.85, { armband: [BLACK, 1] });
const MULLER = mk('muller', { ...BAY, boots: '#E8E23A' }, 25, 1.86, { armband: [BLACK, 1] });
const GOTZE = mk('gotze', BAY, 19, 1.76, { armband: [BLACK, 1] });
const COSTA = mk('costa', { ...BAY, boots: '#F25A9A' }, 11, 1.72, { armband: [BLACK, 1] });
const VIDAL = mk('vidal', BAY, 23, 1.8, { armband: [BLACK, 1] });
const BOATENG = mk('boateng', BAY, 17, 1.92, { armband: [BLACK, -1] });
const ALABA = mk('costa', BAY, 27, 1.8, { armband: [BLACK, 1] });
const NEUER = mk('neuer', BAY_GK, 1, 1.93);
const BENAGLIO = mk('benaglio', WOB_GK, 1, 1.94);
const DANTE = mk('dante', WOB, 18, 1.88), NALDO = mk('naldo', WOB, 25, 1.98), CALIG = mk('calig', WOB, 7, 1.82);
const TRASCH = mk('wob1', WOB, 15, 1.8), RODRI = mk('wob2', WOB, 34, 1.82), GUSTAVO = mk('wob3', WOB, 22, 1.87), DRAXLER = mk('wob2', WOB, 10, 1.85), KRUSE = mk('wob1', WOB, 11, 1.8);
const PEP = mk('pep', SUIT_PEP, null, 1.8);
const STAFF = [mk('staff1', TRACK_R, null, 1.82), mk('staff2', TRACK_G, null, 1.78), mk('staff3', TRACK_R, null, 1.85), mk('sub1', TRACK_R, null, 1.8), mk('sub2', TRACK_G, null, 1.83)];
const LEWY_SUB = mk('lewy', BENCH_KIT, null, 1.85), SUBS = [mk('sub1', BENCH_KIT, null, 1.8), mk('sub2', BENCH_KIT, null, 1.84), mk('sub3', { ...BENCH_KIT, boots: '#F2F2EE' }, null, 1.78)];

// ---------- the ground: a full house in red under the lights
const FLAGS = [
  g => { g.fillStyle = BRED; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 0.4, 1, 0.2); },
  g => { g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#4F8FD0'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) g.fillRect(i / 4, j / 3, 1 / 4, 1 / 3); },
  g => { g.fillStyle = BRED; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 0.5, 1); },
];
const RED_CROWD = [['#C8202C', 44], ['#E8E5DE', 15], ['#9C1420', 14], ['#D83A44', 8], ['#2A2A30', 8], ['#D8D4CC', 5], ['#7A1018', 6]];
const ARENA = new Stadium({ seed: 23, density: 1, flags: 4, flagSet: FLAGS, haze: '#2A2436', cloth: RED_CROWD });
const BOARDS = [boardDesign('MÜNCHEN', { bg: BRED, ink: '#FFFFFF' }), boardDesign('22 SEPTEMBER 2015'), boardDesign('MATCHDAY 6', { bg: '#1D2A44', ink: '#F4F2EC' }), boardDesign('BAYERN v WOLFSBURG')];
const NIGHT = { zen: '#070C1C', mid: '#111B36', hor: '#2B3552', clouds: 0.18, cloud: '#313C58', seed: 3 };
const TURF = { colors: ['#3F8E3C', '#4A9C45'], wear: 0, haze: '#5A6E78' };
const BG = makeCanvas(), bgx = BG.getContext('2d');
const L2 = makeCanvas(), l2x = L2.getContext('2d');
function stadium(g, t, items = [], { cheer = 0, blur = 0, hit = null, boards = BOARDS } = {}) {
  const back = c => { sky(c, B, { t, ...NIGHT }); ARENA.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t }), ...goalItems(B, 1, { t, hit }), ...(boards.length ? boardItems(B, boards) : []), ...flagItems(B, t), ...items]);
}
// a player as a drawable; the shadow knows how high he is off the grass (st.air, metres)
const P = (pl, st) => { const it = playerItems(B, pl, st), k = figureK(pl.h);
  const S = st.shadow || {};  // st.shadow: {dx, dz, r, rz, ang} for a body that is not upright
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

// ---------- poses of this film
// a goalkeeper set for a shot, his dive along the line, and how he comes down. side: +1 to his own left, -1 to his right
const SET = { ...POSE.stand(), crouch: 0.1, hip: [[0.16, 0.24], [0.16, 0.24]], knee: [0.34, 0.34], sh: [[0.45, 0.55], [0.45, 0.55]], el: [0.95, 0.95], lean: 0.14 };
const DIVE = (u, side, reach = 1) => { const k = smooth(clamp(u)); return { hip: [[0.3, 0.26], [0.12, 0.2]], knee: [0.55, 0.3], sh: [[lerp(0.45, 2.95, k), 0.3], [lerp(0.45, 2.8, k), 0.36]], el: [lerp(0.95, 0.1, k), lerp(0.95, 0.12, k)],
  lean: 0.1, tilt: side * 1.38 * k * reach, pelvisY: lerp(0.86, 0.5, k), ground: false, look: 0.25 }; };
// down after the dive: flat on the side he fell to, the under arm still stretched along the grass, the other one fallen in
// front of his chest, the upper leg a little bent. (The dive alone ends at full stretch half a metre up, propped on a foot.)
const LAID = side => { const d = side > 0 ? 0 : 1, hip = [[0.3, 0.12], [0.3, 0.12]], knee = [0.5, 0.5], sh = [[1.6, -0.5], [1.6, -0.5]], el = [0.5, 0.5];
  hip[d] = [0.1, -0.08]; knee[d] = 0.15; sh[d] = [2.9, -0.2]; el[d] = 0.1;
  return { hip, knee, sh, el, lean: 0.05, tilt: side * 1.5, pelvisY: 0.2, ground: false, look: 0.2 }; };
function keeper(pl, mv, t, { dive = null, e = 'focus' } = {}) {  // dive: {t0, dur, side, dz}: he goes dz metres along the line
  const s = mv.at(t), base = grounded(pl, { x: s.x, z: s.z, head: PI, pose: blend(SET, POSE.run(s.phase, 0.5, 0), clamp(s.sp / 3) * 0.5), e, t });
  if (!dive || t < dive.t0) return base;
  const u = clamp((t - dive.t0) / dive.dur), k = smooth(u);
  // the fall: from full stretch he drops onto his side, faster and faster, and stops when he meets the grass
  const v = clamp((t - dive.t0 - dive.dur * 0.85) / (dive.dur * 0.5)), fall = v * v;
  let pose = blend(base.pose, DIVE(u, dive.side, dive.reach ?? 1), smooth(clamp(u * 2.5)));
  if (fall > 0) pose = blend(pose, LAID(dive.side), fall);
  const lz = -dive.side;  // he faces up the pitch (heading PI), so his left is -z: the head ends up on that side of his hips
  return onGrass(pl, { ...base, z: s.z + dive.dz * (1 - (1 - u) * (1 - u)), pose, e: u > 0.3 ? 'shock' : e, air: 0.3 * Math.sin(PI * k) * (1 - fall),
    shadow: fall > 0 ? { dz: lz * 0.3 * fall, r: lerp(0.24, 0.95, fall), rz: lerp(0.36, 0.3, fall), ang: PI / 2 } : null }, u > 0.85);
}
// the scissor kick. u: 0 he leaves the grass, 0.5 the strike, 1 down on his left side. He goes up leading with the left
// leg, lies back with his left shoulder down, and the right leg whips through level with his hip
function SCISSOR(u) {
  const up1 = smooth(clamp(u / 0.4)), whip = smooth(clamp((u - 0.36) / 0.15)), fall = smooth(clamp((u - 0.58) / 0.42));
  const hipR = lerp(lerp(0.2, -0.55, up1), 1.5, whip) - 0.55 * fall, kneeR = lerp(lerp(0.4, 1.65, up1), 0.06, whip) + 0.55 * fall;
  const hipL = lerp(0.2, 1.2, smooth(clamp(u / 0.3))) - 0.9 * whip + 0.25 * fall, kneeL = lerp(0.5, 0.95, up1) + 0.45 * whip;
  // the left arm goes out and down toward the grass he will land on, the right one is flung up and back for balance
  return { hip: [[hipL, 0.14], [hipR, 0.05]], knee: [kneeL, kneeR], sh: [[lerp(0.3, 0.55, up1), lerp(0.2, 1.15, up1)], [lerp(0.3, -0.5, up1) + 0.9 * whip, lerp(0.2, 0.8, up1)]], el: [lerp(0.6, 0.3, up1), 0.5],
    lean: lerp(0.1, -1.0, up1) - 0.18 * fall, tilt: lerp(0, 0.8, up1) + 0.4 * fall, pelvisY: lerp(0.88, 1.03, smooth(clamp(u / 0.46))) - 0.75 * fall * fall, ground: false, look: 0.45 * up1 };
}
const JOY = { ...EXPR.happy, open: 0.62, lid: 0.1, brow: -0.25, browY: -8 };
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };  // hands on his hips
const ARM_UP = (w = 1) => ({ sh: [[0.2, 0.35], [lerp(0.2, 2.75, w), 0.3]], el: [0.7, lerp(0.7, 0.18, w)] });  // the right arm in the air
const SEATED = { hip: [[1.5, 0.12], [1.5, 0.12]], knee: [1.55, 1.55], sh: [[0.62, 0.08], [0.62, 0.08]], el: [0.75, 0.75], lean: 0.2, pelvisY: 0.5, ground: false };
const SHRUG = { sh: [[0.2, 0.3], [0.2, 0.3]], el: [1.75, 1.75], fore: [0.55, 0.55], fingers: true, lean: -0.03 };  // the upper arms down, the forearms out, the palms open
const HEAD_HOLD = { ...POSE.handsOnHead(), sh: [[2.62, 0.84], [2.62, 0.84]], handsFront: true, fingers: true };  // both hands on top of his head, the fingers spread
const DOWN = { hip: [[1.45, 0.2], [1.3, 0.14]], knee: [0.9, 0.5], sh: [[-0.6, 0.4], [-0.45, 0.35]], el: [0.15, 0.2], lean: -0.42, pelvisY: 0.17, ground: false, look: 0.5 };  // sat on the grass, leaning back on his hands

// ---------- on-screen pieces
const mmss = sec => { const s = Math.max(0, Math.floor(sec + 1e-6)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function scoreBug(g, a, b, m, { x = 40, y = 76, al = 1, hotL = 0, hotR = 0 } = {}) {  // flat (rule 50); hot: the side that has just scored swells
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54, my = y + hh / 2 + 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = BRED; g.fillRect(x, y, 14, hh); g.fillStyle = WGREEN; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('BAY', x + 26, my); g.fillText('WOB', x + w - 104, my);
  g.textAlign = 'center';
  const num = (v, cx, hot, col) => { g.save(); g.translate(cx, my); g.scale(1 + 0.5 * hot, 1 + 0.5 * hot); g.fillStyle = mix(C.ink, col, hot); g.fillText(String(v), 0, 0); g.restore(); };
  num(a, x + w / 2 - 32, hotL, BRED); g.fillStyle = C.ink; g.fillText('–', x + w / 2 - 2, my); num(b, x + w / 2 + 28, hotR, '#2E8A2E');
  g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 118, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 67, my);
  qaRect(g, x, y, w + 126, hh, 'text', 'score bug');
  g.restore();
}
function watch(g, sec, { x = 800, y = 76, al = 1, hot = 0 } = {}) {  // the stopwatch that starts with the first goal
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al;
  const w = 240, hh = 54, cx = x + 36, cy = y + hh / 2 + 1, r = 15, ink = hot > 0.5 ? '#1B1F27' : CREAM;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = mix('#1B1F27', GOLD, hot); g.fillRect(x, y, w, hh);
  g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy + 2, r, 0, 2 * PI); g.stroke();
  g.fillStyle = ink; g.fillRect(cx - 4, cy - r - 6, 8, 6);
  const an = (sec % 60) / 60 * 2 * PI; g.lineCap = 'round'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx, cy + 2); g.lineTo(cx + Math.sin(an) * r * 0.7, cy + 2 - Math.cos(an) * r * 0.7); g.stroke();
  g.font = sans(36, 900); g.letterSpacing = '2px'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = ink; g.fillText(mmss(sec), x + 70, cy + 3);
  qaRect(g, x, y, w, hh, 'text', 'stopwatch');
  g.restore();
}
function goalDots(g, n, { x = 40, y = 150, pulse = 0, al = 1 } = {}) {  // five marks under the score, one filled for each goal
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(24, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    const cx = x + 24 + i * 56, cy = y + 24, on = i < n, k = on && i === n - 1 ? 1 + 0.4 * pulse : 1;
    g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.arc(cx, cy + 4, 22 * k, 0, 2 * PI); g.fill();
    g.fillStyle = on ? GOLD : '#1B1F27'; g.beginPath(); g.arc(cx, cy, 22 * k, 0, 2 * PI); g.fill();
    if (!on) { g.strokeStyle = 'rgba(244,238,224,0.4)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, 20.5, 0, 2 * PI); g.stroke(); }
    g.fillStyle = on ? '#1B1F27' : 'rgba(244,238,224,0.6)'; g.fillText(String(i + 1), cx, cy + 2);
  }
  qaRect(g, x, y, 272, 52, 'text', 'goal marks');
  g.restore();
}
function bigText(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#F2D27A', s1 = 150, s2 = 84, a = 1 } = {}) {  // the cover: two heavy lines
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
  g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.2); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.2);
  qaRect(g, 60, y - s1 * 0.8, W - 120, s1 * 0.8 + s2 * 1.3, 'text', 'cover title');
  g.restore();
}

// ================= THE GROUND FROM THE AIR =================
// The Allianz Arena at night, its skin of cushions lit red as on Bayern's nights: a tyre-shaped shell of rhombic
// panels, the roof ring, the light of the pitch coming up through the opening; car parks and roads around it
const SHELL = (() => { const r = rng(5), N = 76, M = 9, v = []; for (let i = 0; i < N * M; i++) v.push(0.72 + 0.28 * r()); return { N, M, v, A: 130, Bz: 114, Hh: 48 }; })();
const LAMPS = (() => { const r = rng(88), out = []; for (let i = 0; i < 260; i++) { const a = r() * 2 * PI, d = 190 + r() * 900; out.push([Math.cos(a) * d, Math.sin(a) * d * 0.9, r() < 0.2 ? '#FFD9A0' : '#FFF2D8', 0.4 + r() * 0.6]); } return out; })();
function arenaNight(g, t) {
  const sg = g.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#050814'); sg.addColorStop(0.5, '#0C1530'); sg.addColorStop(1, '#141E38'); g.fillStyle = sg; g.fillRect(0, 0, W, H);
  if (B.poly(g, [[-4000, 0, -4000], [4000, 0, -4000], [4000, 0, 4000], [-4000, 0, 4000]])) { g.fillStyle = '#0A0E18'; g.fill(); }
  const quad = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); return true; } return false; };
  for (const [x0, z0, x1, z1] of [[-1500, 260, 1500, 320], [-420, -1500, -360, 1500], [230, -1500, 262, 1500]]) quad([[x0, 0.1, z0], [x1, 0.1, z0], [x1, 0.1, z1], [x0, 0.1, z1]], '#141A26');  // roads
  for (const [x, z, col, a] of LAMPS) { const p = B.project(x, 1, z); if (p.z < 5) continue; g.fillStyle = rgba(col, a * (0.7 + 0.3 * Math.sin(t * 2 + x))); g.beginPath(); g.arc(p.x, p.y, Math.max(1.2, p.s * 1.6), 0, 2 * PI); g.fill(); }
  { const c = B.project(0, 0, 0), R = c.s * 330; g.save(); g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(c.x, c.y, R * 0.2, c.x, c.y, R); rg.addColorStop(0, 'rgba(255,60,50,0.34)'); rg.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = rg; g.beginPath(); g.arc(c.x, c.y, R, 0, 2 * PI); g.fill(); g.restore(); }
  const { N, M, v, A, Bz, Hh } = SHELL, E = B.E;
  const at = (a, h) => { const s = h / Hh, k = 1 + 0.1 * Math.sin(PI * Math.pow(s, 0.8)) - 0.05 * s; return [Math.cos(a) * A * k, h, Math.sin(a) * Bz * k]; };
  const cells = [];
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const off = (j % 2) * 0.5, a0 = (i + off) / N * 2 * PI, a1 = (i + 1 + off) / N * 2 * PI, am = (a0 + a1) / 2, h0 = j / M * Hh, h1 = (j + 1) / M * Hh, hm = (h0 + h1) / 2;
    const c = at(am, hm), nrm = [Math.cos(am) * Bz, 26 * (hm / Hh - 0.45), Math.sin(am) * A];
    if (nrm[0] * (E[0] - c[0]) + nrm[1] * (E[1] - c[1]) + nrm[2] * (E[2] - c[2]) <= 0) continue;
    cells.push({ d: depth(...c), pts: [at(am, h0), at(a1, hm), at(am, h1), at(a0, hm)], v: v[j * N + i], lit: clamp(0.55 + 0.45 * (hm / Hh)) });  // a rhombus: its points on the neighbours' edges
  }
  // the gaps between the rhombi: a darker band under them
  for (let i = 0; i < N; i++) { const a0 = i / N * 2 * PI, a1 = (i + 1) / N * 2 * PI, c = at((a0 + a1) / 2, Hh / 2); if (Math.cos((a0 + a1) / 2) * Bz * (E[0] - c[0]) + Math.sin((a0 + a1) / 2) * A * (E[2] - c[2]) > 0) quad([at(a0, 0), at(a1, 0), at(a1, Hh), at(a0, Hh)], '#7A0E14'); }
  cells.sort((p, q) => q.d - p.d);
  for (const c of cells) quad(c.pts, mix('#A01018', '#FF4038', c.v * c.lit));
  // the roof ring and the opening over the pitch
  const ring = (k, h) => Array.from({ length: 64 }, (_, i) => { const a = i / 64 * 2 * PI; return [Math.cos(a) * A * k, h, Math.sin(a) * Bz * k]; });
  quad(ring(1.0, Hh), '#8E1218'); quad(ring(0.93, Hh + 3), '#B8222A');
  for (let i = 0; i < 64; i += 2) { const a = i / 64 * 2 * PI, a1 = (i + 1) / 64 * 2 * PI; quad([[Math.cos(a) * A * 0.93, Hh + 3.1, Math.sin(a) * Bz * 0.93], [Math.cos(a1) * A * 0.93, Hh + 3.1, Math.sin(a1) * Bz * 0.93], [Math.cos(a1) * A * 0.56, Hh + 1, Math.sin(a1) * Bz * 0.5], [Math.cos(a) * A * 0.56, Hh + 1, Math.sin(a) * Bz * 0.5]], 'rgba(60,8,12,0.3)'); }
  { const pts = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 2 * PI; return [Math.cos(a) * A * 0.56, Hh + 1, Math.sin(a) * Bz * 0.5]; });
    if (B.poly(g, pts)) { const c = B.project(0, Hh, 0), R = c.s * 76; const rg = g.createRadialGradient(c.x, c.y, R * 0.1, c.x, c.y, R); rg.addColorStop(0, '#F4FFE6'); rg.addColorStop(0.55, '#BFE89A'); rg.addColorStop(1, '#5E9A4A'); g.fillStyle = rg; g.fill(); }
    const c = B.project(0, Hh + 20, 0), R = c.s * 170; g.save(); g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(c.x, c.y, R * 0.15, c.x, c.y, R); rg.addColorStop(0, 'rgba(235,255,220,0.5)'); rg.addColorStop(1, 'rgba(235,255,220,0)'); g.fillStyle = rg; g.beginPath(); g.arc(c.x, c.y, R, 0, 2 * PI); g.fill(); g.restore(); }
}

// ================= THE TOUCHLINE =================
// The dugout behind the technical area: a glass back and roof, a row of red seats; the coach out in front of it
const DUG = { x0: 5.2, x1: 14.8, zb: -39.1, zf: -37.9 };
function dugoutItems(t, { mood = 0, sitX = [5.6, 8.3, 14.1], staffX = [7.4, 12.4] } = {}) {  // sitX, staffX: where the substitutes and the staff are (nobody straight behind the man the shot is about)  // mood: 0 they sit and watch, 1 they are up and in each other's arms
  const items = [], { x0, x1, zb, zf } = DUG, bx = (a, b, col, far = 0) => ({ d: depth((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) + far, draw: gg => box(gg, B, a, b, col) });  // far: the bench is long, its middle is no guide to who is in front of it
  items.push({ d: depth((x0 + x1) / 2, 1.1, zb) + 6, draw: gg => { if (B.poly(gg, [[x0, 0, zb], [x1, 0, zb], [x1, 2.1, zb], [x0, 2.1, zb]])) { gg.fillStyle = 'rgba(20,26,38,0.86)'; gg.fill(); }
    for (let x = x0; x <= x1 + 0.01; x += 1.2) { const a = B.project(x, 0, zb + 0.01), b = B.project(x, 2.1, zb + 0.01); if (a.z > 0.3 && b.z > 0.3) { gg.strokeStyle = 'rgba(160,170,186,0.5)'; gg.lineWidth = Math.max(1, a.s * 0.04); gg.beginPath(); gg.moveTo(a.x, a.y); gg.lineTo(b.x, b.y); gg.stroke(); } } } });
  items.push(bx([x0 - 0.1, 2.1, zb - 0.1], [x1 + 0.1, 2.2, zf + 0.5], { top: '#3A4150', side: '#262B36', front: '#2E3440' }));
  items.push(bx([x0 + 0.2, 0.3, zb + 0.15], [x1 - 0.2, 0.44, zb + 0.75], { top: '#B81A28', side: '#7E1019', front: '#971520' }, 4));
  items.push(bx([x0 + 0.2, 0.44, zb + 0.15], [x1 - 0.2, 1.02, zb + 0.28], { top: '#B81A28', side: '#7E1019', front: '#A8161F' }, 5));
  const up = smooth(clamp(mood));
  // on the bench
  sitX.forEach((x, i) => {
    const pl = SUBS[i], st = up > 0.5
      ? { x, z: zb + 1.25, head: PI / 2, pose: { ...POSE.stand(), ...POSE.armsUp(1), lift: 0.12 * Math.abs(Math.sin(t * 7 + i * 2)) }, e: 'happy', t: t + i }
      : { x, z: zb + 0.5, head: PI / 2, pose: { ...SEATED, lean: 0.2 + 0.03 * Math.sin(t * 1.3 + i) }, e: 'focus', t: t + i };
    items.push(P(pl, st));
  });
  // the staff, on their feet in front of it
  staffX.forEach((x, i) => { const z = [-37.2, -37.0, -37.3][i], turn = [0.25, -0.2, -0.3][i];
    const pl = STAFF[i], hop = up * 0.14 * Math.abs(Math.sin(t * 6.5 + i * 1.7));
    const calm = { ...POSE.stand(), sh: [[-0.3, 0.1], [-0.3, 0.1]], el: [0.55, 0.55], lean: 0.02 + 0.01 * Math.sin(t * 1.4 + i) };
    const wild = { ...POSE.stand(), ...POSE.armsUp(1), sh: [[2.7, 0.55], [2.7, 0.55]], lift: hop };
    items.push(P(pl, { x, z, head: PI / 2 + turn * (1 - up) + up * 0.5 * Math.sin(t * 3 + i), pose: blend(calm, wild, up), e: up > 0.5 ? 'happy' : 'focus', t: t + 3 + i }));
  });
  return items;
}
function touchline(g, t, items, { cheer = 0, blur = 2.5, mood = 0, ...who } = {}) {
  stadium(g, t, [...dugoutItems(t, { mood, ...who }), ...items], { cheer, blur, boards: [] });
}
const PEP_AT = [10.2, -35.3];
const TALK = t => ({ ...EXPR.focus, mouth: 'o', open: 0.25 + 0.3 * Math.abs(Math.sin(t * 9)) * (Math.sin(t * 2.3) > -0.4 ? 1 : 0), lid: 0.2 });

// ================= AFTER THE MATCH =================
// An interview wall and a microphone; no real sponsors on it
function wallSet(g, t, cx, cz) {
  g.fillStyle = '#0A0E16'; g.fillRect(0, 0, W, H);
  const quad = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  quad([[cx - 9, 0, cz - 1.6], [cx + 9, 0, cz - 1.6], [cx + 9, 0, cz + 9], [cx - 9, 0, cz + 9]], '#1A1C22');
  quad([[cx - 6, 0, cz - 1.6], [cx + 6, 0, cz - 1.6], [cx + 6, 3.4, cz - 1.6], [cx - 6, 3.4, cz - 1.6]], '#16223C');
  for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) { const x = cx - 5.7 + i * 0.96, y = 0.5 + j * 0.56, red = (i + j) % 2 === 0; quad([[x, y, cz - 1.59], [x + 0.78, y, cz - 1.59], [x + 0.78, y + 0.4, cz - 1.59], [x, y + 0.4, cz - 1.59]], red ? '#8E1420' : '#1E2C4E'); }
  { const c = B.project(cx, 1.5, cz), R = c.s * 3.2; g.save(); g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(c.x, c.y, R * 0.1, c.x, c.y, R); rg.addColorStop(0, 'rgba(255,236,200,0.22)'); rg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.restore(); }
}
function micItem(x, y, z) {  // a reporter's microphone, held up from below
  return { d: depth(x, y, z), draw: g => { const a = B.project(x - 1.1, y - 0.42, z + 0.34), b = B.project(x - 0.07, y - 0.03, z + 0.02), c = B.project(x, y, z); if (c.z < 0.3) return;
    const an = Math.atan2(c.x - a.x, a.y - c.y);
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#22252B'; g.lineWidth = c.s * 0.03; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.translate(c.x, c.y); g.rotate(an);
    g.fillStyle = '#3A3F49'; g.beginPath(); g.ellipse(0, -c.s * 0.02, c.s * 0.05, c.s * 0.07, 0, 0, 2 * PI); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(-c.s * 0.015, -c.s * 0.04, c.s * 0.022, c.s * 0.03, 0, 0, 2 * PI); g.fill();
    g.fillStyle = '#E8E6E0'; g.fillRect(-c.s * 0.034, c.s * 0.04, c.s * 0.068, c.s * 0.025); g.restore(); } };
}

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: NIGHT_G, trans: 'cut', noJump: true, kb: 0, ...o });

  // ======================= THE FIFTH GOAL as an action in the world, with its own clock (tt: 0 when he strikes it).
  // Götze crosses from the right; at the edge of the box he goes up, lies back and meets it; the top right corner.
  // The opening shows it at half speed; the full take near the end slows the clock down round the strike =======================
  const CROSS = 1.15, FLY = 0.6, S5 = [36.3, 1.0], N5 = [53.75, 2.02, -3.05];
  const U5 = tt => (tt + 0.45) / 0.9;  // where he is in the kick
  const st5 = tt => ({ x: S5[0], z: S5[1], head: -0.1, pose: SCISSOR(clamp(U5(tt))), e: 'focus', t: tt });
  const HIT5 = (() => { const sk = skeleton(LEWY, st5(0)), L = sk.legs[1]; return v3.add(L.toe, v3.add(v3.mul(sk.f, 0.1), [0, 0.03, 0])); })();  // the ball is where his boot is
  const gM5 = new Mover([[-CROSS - 2.6, 23.5, -25.4], [-CROSS - 0.9, 28.4, -24.1], [-CROSS, 30.2, -23.5], [-CROSS + 0.8, 31.6, -22.6, { stop: true }], [99, 31.6, -22.6]]);
  const tM5 = new Mover([[-CROSS - 2.6, 27.5, -21.0], [-CROSS - 0.5, 31.6, -21.9], [-CROSS + 0.3, 32.4, -22.6, { stop: true }], [99, 32.4, -22.6]]);  // the left-back (Rodríguez: the line-up has him on this flank) closing him down
  const lM5 = new Mover([[-CROSS - 2.6, 33.4, 3.6], [-CROSS - 0.9, 35.2, 2.1], [-0.62, S5[0], S5[1], { stop: true }], [99, S5[0], S5[1]]], { heading0: 0, face: tt => (tt > -1.25 ? -0.1 : null) });  // he squares up to the goal before he jumps
  const nM5 = new Mover([[-CROSS - 2.6, 39.6, -0.4], [-CROSS - 0.6, 41.0, -1.6], [-0.2, 41.5, -2.0, { stop: true }], [99, 41.5, -2.0]], { heading0: PI, face: tt => (tt > 0.04 ? -0.55 : PI - 0.4), turn: 8 });
  const kM5 = new Mover([[-9, 51.5, -0.9], [-0.3, 51.5, 0.2], [0.14, 51.45, -0.1, { stop: true }], [99, 51.45, -0.1]], { heading0: PI, face: () => PI });
  const footG = tt => { const m = gM5.at(tt); return [m.x + Math.cos(m.head) * 0.55 + Math.sin(m.head) * 0.12, BALL_R, m.z + Math.sin(m.head) * 0.55 - Math.cos(m.head) * 0.12]; };
  const ball5 = new BallPath([
    { t0: -CROSS - 3, t1: -CROSS, kind: 'fn', fn: tt => footG(Math.min(tt, -CROSS)) },
    { t0: -CROSS, t1: 0, kind: 'air', from: footG(-CROSS), to: HIT5 },
    { t0: 0, t1: FLY, kind: 'air', from: HIT5, to: N5, g: 3 },
    { t0: FLY, t1: FLY + 0.55, kind: 'air', from: N5, to: [53.35, BALL_R, -2.85] },
    { t0: FLY + 0.55, t1: 99, kind: 'hold', from: [53.35, BALL_R, -2.85] },
  ]);
  function fifth(tt, t, { far = true } = {}) {
    const u = U5(tt), items = [];
    // he shuffles into place, goes up, and comes down on his left side; then he sits up to see where it went
    let ls;
    if (u <= 0) { const ms = grounded(LEWY, moving(lM5, tt, { t, e: 'focus' })); ls = { ...ms, pose: blend(ms.pose, SCISSOR(0), smooth(clamp((tt + 0.63) / 0.18))) }; }  // he gathers himself: the stand goes over into the take-off
    else if (u < 1) ls = onGrass(LEWY, { ...st5(tt), air: Math.max(0, SCISSOR(clamp(u)).pelvisY - 0.4), e: u > 0.5 ? { ...EXPR.focus, mouth: 'o', open: 0.4 } : 'focus', t });
    else { const k = ease.inOut(clamp((tt - 0.45) / 0.5)); ls = onGrass(LEWY, { x: S5[0], z: S5[1], head: -0.1 + 0.3 * k, pose: blend(SCISSOR(1), DOWN, k), e: k > 0.6 ? 'happy' : 'focus', t }, true); }
    items.push(P(LEWY, ls));
    items.push(P(NALDO, { ...moving(nM5, tt, { t: t + 2, e: tt > 0.1 ? 'shock' : 'worried' }) }));
    items.push(P(BENAGLIO, keeper(BENAGLIO, kM5, tt, { dive: { t0: 0.16, dur: 0.5, side: 1, dz: -1.75 }, e: 'focus' })));
    if (far) {
      items.push(P(GOTZE, runKick(gM5, tt, -CROSS, 'R', { e: 'focus' })));
      items.push(P(RODRI, moving(tM5, tt, { t: t + 5, e: 'focus' })));
    }
    const fast = tt > 0 && tt < FLY;
    items.push(ballOf(ball5, tt, fast ? { trail: trailOf(ball5, tt, 6, 0.012) } : {}));
    return items;
  }
  const hit5 = t0 => ({ t0, y: N5[1], z: N5[2], k: 1.35 });

  // ======================= HOOK: the fifth goes in. He is in the air at the edge of the box, the ball on his boot;
  // half speed; then his own coach on the touchline, his hands going to his head =======================
  const ctxS = s('ctx'), evenT = w('hook', 'Even') - 0.07, R0 = 0.42, T0 = 0.06;  // T0: the strike, on the film's clock
  const tt0 = t => (t - T0) * R0, netH0 = T0 + FLY / R0;
  const E0 = [34.9, 1.1, 4.0];
  const cam0 = t => { const u = ease.inOut(clamp((t - T0 - 0.08) / (netH0 - T0 - 0.3))), k = smooth(clamp((t - netH0 + 0.3) / (evenT - netH0 + 0.3)));
    // u: the pan after the ball; k: once it is in, the lens keeps closing in on that corner, so the shot never stands still
    return lookFrom(E0, mix3(mix3([36.2, 1.0, 1.0], [52.1, 1.4, -1.3], u), [52.3, 1.2, -2.0], 0.6 * k), { fov: lerp(1720, 2600, u) + 300 * k, cy: H * lerp(0.47, 0.5, u) }); };
  shot(0, (g, lt, t) => {
    rigFn(lt, t, cam0, { shake: t < netH0 ? 0.5 : 0.4 + 1.4 * (1 - clamp((t - netH0) / 0.4)) });
    stadium(g, t, fifth(tt0(t), t, { far: false }), { cheer: t > netH0 ? 1 : 0.45, blur: 2.5, hit: hit5(netH0) });
  }, { mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    bigText(g, '5 GOALS', 'IN 9 MINUTES', 330, { a: fadeOut(t, evenT - 0.3, 0.25) });
  } });
  cue(0, 'whoosh_fast', 0.25); cue(T0 - 0.02, 'kick', 0.7); cue(T0, 'thud', 0.4); cue(netH0 - 0.03, 'net', 0.85); cue(netH0, 'boom_cine', 0.45); cue(netH0 + 0.05, 'crowd_roar', 0.5);

  // his coach: the hands go up to the head, the mouth opens, then the laugh; behind him the bench is on its feet
  const pepHook = (t, t0) => { const k = ease.inOut(clamp((t - t0) / 0.5)), grin = clamp((t - t0 - 0.85) / 0.35);
    return { x: PEP_AT[0], z: PEP_AT[1], head: PI / 2 + 0.12 * Math.sin((t - t0) * 2.1), pose: blend({ ...POSE.stand(), sh: [[0.1, 0.1], [0.1, 0.1]], el: [0.3, 0.3] }, { ...HEAD_HOLD, lean: -0.06, look: 0.25 }, k),
      e: grin > 0 ? { ...EXPR.happy, brow: -0.6, browY: -14, lid: 0, open: 0.55 + 0.2 * grin } : { ...EXPR.shock, sweat: 0 }, t }; };
  shot(evenT, (g, lt, t) => {
    const L = ctxS - evenT, u = glide(clamp(lt / L));
    rig(B, lt, [[0, K(PI + lerp(0.34, 0.1, u), 0.02, lerp(3.5, 2.4, u), [PEP_AT[0] - 0.05, 1.42, PEP_AT[1]], { cy: H * 0.5 })]], { t, e: lin, shake: 0.5 });
    touchline(g, t, [P(PEP, pepHook(t, evenT + 0.1))], { cheer: 1, mood: 1, blur: 3 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    nameTitle(g, lt, 'Pep Guardiola', 'BAYERN MUNICH · HEAD COACH', { y: 230, t0: 0.15 });
  } });
  cue(evenT, 'whoosh_soft', 0.3); cue(evenT + 0.1, 'crowd_roar', 0.35);

  // ======================= MUNICH, 22 SEPTEMBER 2015: the ground from the air, lit red =======================
  const bayT = w('ctx', 'Bayern') - 0.1;
  shot(ctxS - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(0.75, 0.42, 520, [0, 22, 0], { cy: H * 0.46 })], [bayT - ctxS + 0.3, K(0.52, 0.38, 395, [0, 22, 0], { cy: H * 0.46 })]], { t, e: lin, shake: 0.3 });
    arenaNight(g, t);
  }, { grade: AIR_G, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Munich', '22 September 2015', { y: 190, t0: 0.08 });
  } });
  cue(ctxS - 0.05, 'whoosh_deep', 0.3);

  // ======================= THE FIRST HALF: Wolfsburg score. Caligiuri (26'), a half-volley from the right of the box,
  // past Neuer; seen from behind him =======================
  const htT = w('ctx', '1–0') - 0.08, kC = w('ctx', 'losing') - 0.05, netC = kC + 0.36;
  const cM = new Mover([[kC - 1.4, 37.6, -11.8], [kC - 0.3, 43.3, -8.1], [kC, 44.5, -7.35], [kC + 0.6, 46.6, -7.2], [kC + 1.5, 46.8, -11.5], [kC + 2.8, 43.5, -18.5], [99, 40, -24]]);
  const nuM = new Mover([[kC - 3, 51.4, -2.2], [kC - 0.1, 51.4, -1.8, { stop: true }], [99, 51.4, -1.8]], { heading0: PI, face: () => PI });
  const alM = new Mover([[kC - 1.4, 40.4, -3.4], [kC - 0.25, 44.1, -5.3], [kC + 0.25, 45.6, -6.3, { stop: true }], [99, 45.6, -6.3]]);  // the defender slides in from the inside and is too late
  const drM = new Mover([[kC - 1.4, 35.5, 0.4], [kC, 38.6, -0.6], [kC + 1.6, 43.0, -6.5], [kC + 2.8, 42.0, -14.5], [99, 40, -20]]);
  const ballC = new BallPath([
    { t0: kC - 1.2, t1: kC - 0.3, kind: 'air', from: [36.6, 0.3, -1.6], to: [43.7, BALL_R, -7.7] },
    { t0: kC - 0.3, t1: kC, kind: 'air', from: [43.7, BALL_R, -7.7], to: [45.1, 0.42, -7.25] },
    { t0: kC, t1: netC, kind: 'air', from: [45.1, 0.42, -7.25], to: [53.65, 1.3, 2.5], g: 3 },
    { t0: netC, t1: netC + 0.5, kind: 'air', from: [53.65, 1.3, 2.5], to: [53.3, BALL_R, 2.3] },
    { t0: netC + 0.5, t1: 99, kind: 'hold', from: [53.3, BALL_R, 2.3] },
  ]);
  // the camera: behind him for the shot, then round to meet him as he runs off with his arms out
  const camC = tt => { const c = cM.at(tt), u = ease.inOut(clamp((tt - kC + 0.1) / 0.7)), v = ease.inOut(clamp((tt - netC - 0.02) / 0.65));
    return K(lerp(lerp(-0.92, -0.8, u), -0.5, v), lerp(lerp(0.17, 0.14, u), 0.1, v), lerp(lerp(10.5, 9.4, u), 5.6, v), mix3([lerp(45.6, 48.6, u), 1.0, lerp(-5.4, -3.2, u)], [c.x + 0.4, 1.15, c.z + 0.5], v), { cy: H * 0.5 }); };
  shot(bayT, (g, lt, t) => {
    rigFn(lt, t, camC, { shake: 0.8 });
    const cs = runKick(cM, t, kC, 'R', { u0: 0.58 }), cel = ease.inOut(clamp((t - netC - 0.25) / 0.4));
    const as = moving(alM, t, { t: t + 1, e: t > netC ? 'sad' : 'worried' }), asl = ease.inOut(clamp((t - kC + 0.3) / 0.3));
    const items = [
      P(CALIG, cel > 0 ? { ...cs, pose: blend(cs.pose, { sh: [[0.5, 1.2], [0.5, 1.2]], el: [0.15, 0.15] }, cel), e: 'happy' } : cs),
      P(NEUER, keeper(NEUER, nuM, t, { dive: { t0: kC + 0.08, dur: 0.46, side: -1, dz: 1.7 } })),
      P(ALABA, onGrass(ALABA, { ...as, pose: asl > 0 ? blend(grounded(ALABA, as).pose, POSE.slide(), asl) : as.pose })),
      P(DRAXLER, { ...moving(drM, t, { t: t + 2, e: t > netC ? 'happy' : 'focus' }), ...(t > netC + 0.3 ? { pose: blend(moving(drM, t).pose, POSE.armsUp(1), ease.inOut(clamp((t - netC - 0.3) / 0.4))) } : {}) }),
      ballOf(ballC, t, t > kC && t < netC ? { trail: trailOf(ballC, t) } : {}),
    ];
    stadium(g, t, items, { cheer: 0.2, blur: 2.5, hit: { t0: netC, y: 1.3, z: 2.5, k: 1.2 } });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 0, t > netC ? 1 : 0, "26'", { hotR: t > netC ? 1 - clamp((t - netC) / 0.6) : 0 });
    if (t > netC + 0.1) plate(g, "CALIGIURI 26'", W / 2, 300, { color: CREAM, size: 46, ...pin(t, netC + 0.1) });
  } });
  cue(bayT, 'whoosh_fast', 0.22); cue(kC - 0.02, 'kick', 0.6); cue(netC - 0.02, 'net', 0.7); cue(netC + 0.05, 'crowd_gasp', 0.5);

  // half-time, 0–1: Guardiola on the touchline, hands on his hips
  const subS = s('sub');
  shot(htT, (g, lt, t) => {
    const L = subS - htT, u = glide(clamp(lt / L));
    rig(B, lt, [[0, K(PI - lerp(0.42, 0.12, u), 0.03, lerp(4.3, 3.1, u), [PEP_AT[0], 1.35, PEP_AT[1]], { cy: H * 0.5 })]], { t, e: lin, shake: 0.3 });
    const shake = 0.1 * Math.sin(t * 5.5) * clamp((lt - 0.3) / 0.3);
    touchline(g, t, [P(PEP, { x: PEP_AT[0], z: PEP_AT[1], head: PI / 2 + shake, pose: { ...POSE.stand(), ...HIPS, lean: 0.05 + 0.01 * Math.sin(t * 2), look: -0.15 }, e: { ...EXPR.angry, open: 0, brow: 0.7, look: [0.3 * Math.sin(t * 1.3), 0.2] }, t })], { cheer: 0, mood: 0, blur: 3, sitX: [11.7, 13.0, 14.2], staffX: [7.3] });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 0, 1, "45'");
    plate(g, 'HALF-TIME · BAYERN 0–1 WOLFSBURG', W / 2, 300, { color: CREAM, size: 38, ...pin(t, htT + 0.05) });
  } });
  cue(htT, 'whistle', 0.4); cue(htT + 0.3, 'whistle', 0.35); cue(htT + 0.1, 'murmur', 0.3);

  // ======================= THE SUBSTITUTION: a hand on his shoulder, an arm out at the pitch; then he runs on =======================
  const g1S = s('g1'), robT = w('sub', 'Robert') - 0.12, goT = robT - 0.2;
  const L_AT = [9.2, -34.9];
  const lsM = new Mover([[subS - 1, L_AT[0], L_AT[1], { stop: true }], [goT, L_AT[0], L_AT[1], { stop: true }], [goT + 0.9, 8.4, -32.4], [goT + 2.2, 6.3, -26.5], [99, 2, -12]], { heading0: PI / 2 - 0.5, turn: 6 });
  shot(subS - 0.05, (g, lt, t) => {
    const m = lsM.at(t), go = ease.inOut(clamp((t - goT) / 1.2));
    rig(B, lt, [[0, K(PI + lerp(0.24, 0.2, go) - 0.14 * clamp(lt / 2.4), 0.04, lerp(3.5, 4.6, go) - 0.35 * clamp(lt / 2.4), [lerp(9.62, m.x, go), lerp(1.36, 1.2, go), lerp(-35.05, m.z, go)], { cy: H * 0.5 })]], { t, e: lin, shake: 0.4 });
    const ms = moving(lsM, t, { t, e: 'focus' }), chop = 0.12 * Math.sin(t * 8);
    const lewy = t < goT ? { ...ms, pose: { ...POSE.stand(), sh: [[-0.2, 0.12], [-0.2, 0.12]], el: [0.5, 0.5], lean: 0.04 + 0.03 * Math.abs(Math.sin(t * 3.1)), look: 0.1 }, e: { ...EXPR.focus, look: [0.7, 0] }, t } : ms;
    const sent = ease.inOut(clamp((t - goT) / 0.5));
    const pep = { x: 9.98, z: -35.15, head: PI - 0.25 - 0.6 * sent, pose: blend({ ...POSE.stand(), sh: [[1.18, 0.1], [1.0 + 1.3 * chop, 0.15]], el: [0.4, 0.95 + 2 * Math.abs(chop)], lean: 0.1 },
      { ...POSE.stand(), sh: [[0.75, 0.3], [0.75, 0.3]], el: [1.35, 1.35], fore: [-0.5, -0.5], lean: 0.04 }, sent), e: sent > 0.5 ? 'focus' : TALK(t), t: t + 1 };
    touchline(g, t, [P(LEWY, lewy), P(PEP, pep)], { cheer: 0.25, mood: 0, blur: 3, sitX: [12.4, 13.8], staffX: [] });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 0, 1, "46'");
    if (t > robT + 0.4) nameTitle(g, t - robT - 0.4, 'Robert Lewandowski', 'ON AT HALF-TIME · FOR THIAGO', { y: 250, t0: 0.05 });
  } });
  cue(subS - 0.05, 'whoosh_soft', 0.3); cue(goT + 0.1, 'whistle', 0.3); cue(goT + 0.2, 'applause', 0.3); cue(robT, 'stamp', 0.3);

  // ======================= 51': THE FIRST, in two shots. On the right of the box Müller runs into Dante's tackle and
  // the ball squirts away across goal; then, from behind him, he arrives on it and taps it in =======================
  const g2S = s('g2'), tapT = w('g1', 'taps') + 0.02, net1 = tapT + 0.3, tack = w('g1', 'loose') - 0.05, cutT1 = tack + 0.5;
  const mM1 = new Mover([[tack - 1.7, 39.2, -9.6], [tack - 0.6, 44.0, -7.1], [tack, 46.3, -5.7], [tack + 0.5, 47.3, -5.4, { stop: true }], [99, 47.3, -5.4]]);
  const dM1 = new Mover([[tack - 1.7, 49.6, -2.4], [tack - 0.5, 48.7, -4.0], [tack + 0.05, 47.35, -5.2], [tack + 0.5, 46.7, -5.6, { stop: true }], [99, 46.7, -5.6]]);
  const lM1 = new Mover([[tack - 1.7, 37.6, 4.6], [tack, 42.4, 2.5], [tapT - 0.6, 45.2, 0.3], [tapT, 46.35, -0.55], [tapT + 0.6, 47.2, 0.9], [tapT + 1.3, 46.6, 2.2], [tapT + 2.3, 45.0, 3.0, { stop: true }], [99, 45.0, 3.0]],
    { face: tt => (tt > tapT + 1.35 ? PI - 0.45 : null), turn: 6 });
  const bM1 = new Mover([[tack - 3, 51.3, -2.7], [tack + 0.2, 51.25, -2.5], [tapT - 0.1, 50.95, -1.3], [tapT + 0.1, 50.9, -1.1, { stop: true }], [99, 50.9, -1.1]], { heading0: PI, face: () => PI });
  const nM1 = new Mover([[tack - 1.7, 51.2, -1.6], [tapT - 0.5, 50.8, -2.9], [tapT + 0.05, 50.5, -3.6, { stop: true }], [99, 50.5, -3.6]], { heading0: PI, face: tt => (tt > net1 + 0.1 ? 0.9 : PI - 0.3), turn: 6 });
  const rM1 = new Mover([[tack - 1.7, 37.9, -11.2], [tack, 44.8, -7.9], [tack + 0.7, 46.1, -7.4, { stop: true }], [99, 46.1, -7.4]]);
  const footM = t => { const m = mM1.at(t); return [m.x + Math.cos(m.head) * 0.5, BALL_R, m.z + Math.sin(m.head) * 0.5 - 0.12]; };
  const ball1 = new BallPath([
    { t0: tack - 2, t1: tack, kind: 'fn', fn: t => footM(Math.min(t, tack)) },
    { t0: tack, t1: tapT, kind: 'roll', from: footM(tack), to: [46.98, BALL_R, -0.72], decay: 1.3 },
    { t0: tapT, t1: net1, kind: 'air', from: [46.98, BALL_R, -0.72], to: [53.6, 0.3, 2.05], g: 1.5 },
    { t0: net1, t1: net1 + 0.5, kind: 'roll', from: [53.6, BALL_R, 2.05], to: [54.0, BALL_R, 2.3], decay: 3 },
    { t0: net1 + 0.5, t1: 99, kind: 'hold', from: [54.0, BALL_R, 2.3] },
  ]);
  const first = t => {
    const fall = ease.inOut(clamp((t - tack - 0.03) / 0.4)), mm = moving(mM1, t, { t, e: fall > 0.3 ? 'shock' : 'focus', drib: 1 });
    const sl = ease.inOut(clamp((t - tack + 0.22) / 0.25)), dd = moving(dM1, t, { t: t + 1 });
    const ls = runKick(lM1, t, tapT, 'R', { dur: 0.5 }), fist = ease.inOut(clamp((t - net1 - 0.2) / 0.35));
    return [
      P(MULLER, onGrass(MULLER, { ...mm, pose: fall > 0 ? blend(grounded(MULLER, mm).pose, { ...DOWN, lean: -0.2 }, fall) : mm.pose })),
      P(DANTE, onGrass(DANTE, { ...dd, pose: sl > 0 ? blend(grounded(DANTE, dd).pose, POSE.slide(), sl) : dd.pose, e: 'focus' })),
      P(LEWY, fist > 0 ? { ...ls, pose: blend(ls.pose, { sh: [[0.2, 0.3], [1.3, 0.35]], el: [0.8, 1.9] }, fist), e: JOY } : ls),
      P(BENAGLIO, keeper(BENAGLIO, bM1, t, { dive: { t0: tapT + 0.04, dur: 0.42, side: -1, dz: 1.1 } })),
      P(NALDO, (() => { const ns = moving(nM1, t, { t: t + 2, e: t > net1 ? 'sad' : 'worried' }), lu = 0.3 + (t - tapT + 0.2) / 0.5, hp = ease.inOut(clamp((t - net1 - 0.3) / 0.5));
        if (lu > 0 && lu < 1) return { ...ns, pose: blend(ns.pose, POSE.kick(lu, 'L'), smooth(clamp(lu / 0.2)) * smooth(clamp((1 - lu) / 0.25))) };
        return hp > 0 ? { ...ns, pose: blend(ns.pose, { ...HIPS, look: -0.6 }, hp) } : ns; })()),
      P(RODRI, moving(rM1, t, { t: t + 3 })),
      ballOf(ball1, t, t > tapT && t < net1 ? { trail: trailOf(ball1, t) } : {}),
    ];
  };
  // (a) the camera by the byline on the right, Müller coming at it; after the tackle it goes with the ball
  const camT = tt => { const m = mM1.at(Math.min(tt, tack + 0.1)), b = ball1.at(tt).pos, go = ease.inOut(clamp((tt - tack - 0.05) / 0.45));
    return K(0.95 - 0.14 * go, 0.1, lerp(6.4, 7.2, go), mix3([m.x + 0.7, 1.0, m.z + 0.3], [b[0] + 0.2, 0.8, b[2] + 0.4], go * 0.8), { cy: H * 0.5 }); };
  shot(g1S - 0.05, (g, lt, t) => {
    rigFn(lt, t, camT, { shake: 0.8 + 1.2 * clamp(1 - Math.abs(t - tack) / 0.2) });
    stadium(g, t, first(t), { cheer: 0.4, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 0, 1, "51'"); goalDots(g, 0);
  } });
  // (b) the camera behind him, on the line of his shot: the ball rolls in from the right, he comes in from the left,
  // and the goal is in front of them; then it goes round with him as he turns away
  const E1 = [41.6, 1.55, -2.25];
  const cam1 = tt => { const on = ease.inOut(clamp((tt - net1 - 0.25) / 0.8)), l = lM1.at(tt);
    return lookFrom(E1, mix3([50.5, 0.95, 0.0], [l.x + 0.4, 1.15, l.z], on * 0.9), { fov: lerp(1380, 1650, on) }); };
  shot(cutT1, (g, lt, t) => {
    const on = clamp(t - net1, 0, 1);
    rigFn(lt, t, cam1, { shake: 0.6 + 1.2 * on * (1 - on) });
    stadium(g, t, first(t), { cheer: t > net1 ? 1 : 0.4, blur: 2.5, hit: { t0: net1, y: 0.3, z: 2.05, k: 1.1 } });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > net1;
    scoreBug(g, sc ? 1 : 0, 1, "51'", { hotL: sc ? 1 - clamp((t - net1) / 0.6) : 0 });
    goalDots(g, sc ? 1 : 0, { pulse: sc ? 1 - clamp((t - net1) / 0.5) : 0 });
    if (sc) watch(g, t - net1, { al: clamp((t - net1) / 0.2), hot: 1 - clamp((t - net1) / 0.7) });
    if (sc) plate(g, "GOAL 1 · 51'", W / 2, 300, { color: GOLD, size: 50, ...pin(t, net1 + 0.05) });
  } });
  cue(g1S - 0.05, 'whoosh_fast', 0.22); cue(tack, 'thud', 0.45); cue(tack + 0.02, 'crowd_gasp', 0.3); cue(cutT1, 'whoosh_soft', 0.2); cue(tapT - 0.02, 'kick', 0.5); cue(net1 - 0.02, 'net', 0.75); cue(net1 + 0.03, 'crowd_roar', 0.5); cue(net1 + 0.05, 'clock_press', 0.5);

  // ======================= 52': THE SECOND, a minute on: a touch, and a low drive from outside the box into the
  // bottom left corner. From over his shoulder =======================
  const g3S = s('g3'), k2 = w('g2', 'box.') - 0.1, net2 = w('g2', '2–1.') + 0.08, W2 = 61;  // W2: what the stopwatch reads when it goes in
  const lM2 = new Mover([[k2 - 1.9, 24.6, 3.4], [k2 - 0.95, 27.2, 1.5], [k2, 29.3, 1.0], [k2 + 0.6, 30.7, 0.9], [k2 + 1.3, 31.3, 0.8, { stop: true }], [99, 31.3, 0.8]], { face: tt => (tt > net2 + 0.3 ? PI - 0.3 : null), turn: 6 });
  const naM2 = new Mover([[k2 - 1.9, 34.8, -2.0], [k2 - 0.3, 33.6, -1.7], [k2 + 0.2, 33.1, -1.6, { stop: true }], [99, 33.1, -1.6]], { heading0: PI, face: tt => (tt > k2 + 0.14 ? 0.3 : PI), turn: 7 });
  const daM2 = new Mover([[k2 - 1.9, 35.6, 8.2], [k2 - 0.3, 34.3, 4.8], [k2 + 0.2, 33.9, 4.3, { stop: true }], [99, 33.9, 4.3]], { heading0: PI, face: tt => (tt > k2 + 0.2 ? -0.25 : PI + 0.2), turn: 7 });
  const guM2 = new Mover([[k2 - 1.9, 24.0, 6.6], [k2, 28.0, 3.6], [k2 + 0.5, 29.0, 3.2, { stop: true }], [99, 29.0, 3.2]]);
  const bM2 = new Mover([[k2 - 3, 51.4, 0.2], [k2, 51.3, 0.5, { stop: true }], [99, 51.3, 0.5]], { heading0: PI, face: () => PI });
  const ball2 = new BallPath([
    { t0: k2 - 1.9, t1: k2 - 0.95, kind: 'roll', from: [20.5, BALL_R, -6.0], to: [27.75, BALL_R, 1.35], decay: 1.0 },
    { t0: k2 - 0.95, t1: k2, kind: 'roll', from: [27.75, BALL_R, 1.35], to: [29.9, BALL_R, 0.9], decay: 1.9 },
    { t0: k2, t1: net2, kind: 'air', from: [29.9, BALL_R, 0.9], to: [53.3, 0.24, 3.15], g: 1.3 },
    { t0: net2, t1: net2 + 0.4, kind: 'roll', from: [53.3, BALL_R, 3.15], to: [54.0, BALL_R, 3.0], decay: 3 },
    { t0: net2 + 0.4, t1: 99, kind: 'hold', from: [54.0, BALL_R, 3.0] },
  ]);
  shot(g2S - 0.05, (g, lt, t) => {
    const m = lM2.at(t), u = ease.inOut(clamp((t - k2) / 0.9)), on = clamp(t - net2, 0, 2), up = ease.inOut(clamp((t - net2 - 0.1) / 0.4));
    // as he turns round the picture comes up a little, so his face is clear of the caption band (the words sit on his chest)
    rig(B, lt, [[0, K(-PI / 2 + lerp(0.24, 0.12, u), lerp(0.13, 0.16, u), lerp(6.4, 8.8, u) - 0.4 * on, [lerp(m.x + 2.7, 36.5, u), lerp(1.0, 1.2, u), lerp(m.z + 0.25, 1.5, u)], { cy: H * (0.53 - 0.06 * up) })]], { t, e: lin, shake: 0.8 });
    const ls = runKick(lM2, t, k2, 'R');
    const blk = (pl, mv, tt, e) => { const ms = moving(mv, tt, { t: tt, e }), k = ease.inOut(clamp((tt - k2 + 0.25) / 0.3)) * (1 - ease.inOut(clamp((tt - k2 - 0.2) / 0.35))); return { ...ms, pose: blend(ms.pose, { ...POSE.kick(0.62, 'R'), lean: -0.05 }, k * 0.8) }; };
    const items = [
      P(LEWY, up > 0 ? { ...ls, pose: blend(ls.pose, { ...POSE.armsUp(1), sh: [[2.6, 0.6], [2.6, 0.6]] }, up), e: JOY } : ls),
      P(NALDO, blk(NALDO, naM2, t, 'worried')), P(DANTE, moving(daM2, t, { t: t + 1, e: 'worried' })), P(GUSTAVO, moving(guM2, t, { t: t + 2 })),
      P(BENAGLIO, keeper(BENAGLIO, bM2, t, { dive: { t0: k2 + 0.24, dur: 0.5, side: -1, dz: 1.15 } })),
      ballOf(ball2, t, t > k2 && t < net2 ? { trail: trailOf(ball2, t, 6, 0.012) } : {}),
    ];
    stadium(g, t, items, { cheer: t > net2 ? 1 : 0.5, blur: 2.5, hit: { t0: net2, y: 0.24, z: 3.15, k: 1.15 } });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > net2;
    scoreBug(g, sc ? 2 : 1, 1, "52'", { hotL: sc ? 1 - clamp((t - net2) / 0.6) : 0 });
    goalDots(g, sc ? 2 : 1, { pulse: sc ? 1 - clamp((t - net2) / 0.5) : 0 });
    watch(g, W2 - (net2 - t), { hot: sc ? 1 - clamp((t - net2) / 0.7) : 0 });
    if (sc) plate(g, "GOAL 2 · 52'", W / 2, 300, { color: GOLD, size: 50, ...pin(t, net2 + 0.05) });
  } });
  cue(g2S - 0.05, 'whoosh_fast', 0.22); cue(k2 - 0.95, 'touch', 0.4); cue(k2 - 0.02, 'kick', 0.75); cue(net2 - 0.02, 'net', 0.75); cue(net2 + 0.03, 'crowd_roar', 0.55);

  // ======================= 55': THE THIRD takes three tries. Through on the left: the post; the rebound, and the
  // goalkeeper smothers it; the ball pops up and he puts it in. One take from beside the post he hit =======================
  const postT = w('g3', 'post,') + 0.02, keepT = w('g3', 'keeper,') + 0.02, net3 = w('g3', 'net.') + 0.04, hatT = w('g3', 'hat-trick') - 0.1, W3 = 202;
  const s1 = postT - 0.25, s2 = keepT - 0.17, s3 = net3 - 0.2;
  const lM3 = new Mover([[s1 - 1.9, 37.2, 7.3], [s1 - 0.9, 41.9, 5.7], [s1, 45.4, 4.6], [s2, 47.7, 3.2], [s3, 48.8, 1.0], [s3 + 0.5, 49.4, 1.3], [s3 + 1.1, 48.2, 4.4], [s3 + 2.3, 43.8, 9.8], [s3 + 3.8, 38.8, 14.6], [s3 + 5.2, 36.2, 16.8, { stop: true }], [99, 36.2, 16.8]]);
  const naM3 = new Mover([[s1 - 1.9, 39.4, 9.7], [s1, 44.7, 7.0], [s2, 46.9, 5.6], [s3, 48.3, 4.6], [s3 + 0.6, 49.6, 5.2, { stop: true }], [99, 49.6, 5.2]]);
  const daM3 = new Mover([[s1 - 1.9, 41.6, 0.6], [s1, 44.6, -0.2], [s3 - 0.1, 46.9, -0.9, { stop: true }], [99, 46.9, -0.9]]);
  const mM3 = new Mover([[s1 - 1.9, 36.5, -4.5], [s3, 46.0, -4.2], [s3 + 1.3, 46.2, -0.5], [s3 + 2.6, 44.0, 4.6], [s3 + 4.2, 39.6, 9.6], [s3 + 5.4, 37.4, 12.2, { stop: true }], [99, 37.4, 12.2]]);
  const bM3 = new Mover([[s1 - 3, 51.7, 2.4], [s1, 51.0, 3.05], [s2 - 0.1, 50.6, 2.95], [s2 + 0.1, 50.5, 2.9, { stop: true }], [99, 50.5, 2.9]], { heading0: PI, face: () => PI });
  const POST = [52.42, 0.34, 3.6], KP = [50.2, 0.42, 2.85];
  const ball3 = new BallPath([
    { t0: s1 - 1.9, t1: s1, kind: 'roll', from: [35.5, BALL_R, 5.2], to: [46.02, BALL_R, 4.45], decay: 1.5 },
    { t0: s1, t1: postT, kind: 'air', from: [46.02, BALL_R, 4.45], to: POST, g: 1 },
    { t0: postT, t1: s2, kind: 'air', from: POST, to: [48.35, BALL_R, 3.05], g: 7 },
    { t0: s2, t1: keepT, kind: 'air', from: [48.35, BALL_R, 3.05], to: KP, g: 1 },
    { t0: keepT, t1: s3, kind: 'air', from: KP, to: [49.4, 0.24, 0.88] },
    { t0: s3, t1: net3, kind: 'air', from: [49.4, 0.24, 0.88], to: [53.6, 0.7, -0.9], g: 2 },
    { t0: net3, t1: net3 + 0.5, kind: 'air', from: [53.6, 0.7, -0.9], to: [53.3, BALL_R, -0.8] },
    { t0: net3 + 0.5, t1: 99, kind: 'hold', from: [53.3, BALL_R, -0.8] },
  ]);
  const lewy3 = t => {  // three swings of the right boot, the run between them
    let ls = moving(lM3, t, { t, e: 'focus' });
    for (const [tk, u0] of [[s1, 0.55], [s2, 0.55], [s3, 0.58]]) { const u = u0 + (t - tk) / 0.44; if (u > 0 && u < 1) ls = { ...ls, pose: blend(ls.pose, POSE.kick(u, 'R'), smooth(clamp(u / 0.2)) * smooth(clamp((1 - u) / 0.25))) }; }
    const joy = ease.inOut(clamp((t - net3 - 0.15) / 0.4));
    return joy > 0 ? { ...ls, pose: blend(ls.pose, ARM_UP(1), joy), e: JOY } : ls;
  };
  const keeper3 = t => {  // out to narrow the angle; down on the second; beaten on the third; then his hands on his head
    const sM = bM3.at(t), base = grounded(BENAGLIO, { x: sM.x, z: sM.z, head: PI + 0.25, pose: blend(SET, POSE.run(sM.phase, 0.5, 0), clamp(sM.sp / 3) * 0.5), e: 'focus', t });
    const dn = ease.inOut(clamp((t - s2 + 0.12) / 0.22)), lost = ease.inOut(clamp((t - net3 - 0.5) / 0.6));
    const sprawl = { ...POSE.slide(), sh: [[0.45, 0.95], [0.45, 0.95]], el: [0.3, 0.3], lean: -0.6 };  // down across his path, feet first, the arms spread
    let pose = blend(base.pose, sprawl, dn);
    if (lost > 0) pose = blend(blend(pose, { ...POSE.sit(), look: 0.2 }, lost), POSE.handsOnHead(), lost);
    return onGrass(BENAGLIO, { ...base, pose, e: t > net3 ? 'shock' : 'focus' }, dn > 0.5);
  };
  // the camera: behind the goal, just outside the post he will hit. It comes off his run to hold him and the post
  // together, stays with the scramble, and swings to the net with the third
  const E3 = [56.0, 1.55, 4.4];
  const cam3 = tt => { const l = lM3.at(tt), a = glide(clamp((tt - s1 + 1.3) / 1.2)), b = glide(clamp((tt - postT - 0.05) / (s3 - postT - 0.1))), c = ease.inOut(clamp((tt - s3 - 0.02) / 0.2));
    let T = mix3([l.x + 0.8, 1.0, l.z - 0.2], [48.9, 0.9, 4.1], a);
    T = mix3(T, [49.5, 0.9, 2.3], b); T = mix3(T, [52.6, 0.85, -0.1], c);
    return lookFrom(E3, T, { fov: lerp(lerp(3000, 2200, a), 1900, c) }); };
  shot(g3S - 0.05, (g, lt, t) => {
    const on = clamp(t - net3, 0, 1);
    rigFn(lt, t, cam3, { shake: 0.5 + 1.2 * clamp(1 - Math.abs(t - postT) / 0.2) + 1.0 * on * (1 - on) });
    const items = [P(LEWY, lewy3(t)), P(BENAGLIO, keeper3(t)), P(NALDO, moving(naM3, t, { t: t + 1, e: 'worried' })), P(DANTE, moving(daM3, t, { t: t + 2, e: 'worried' })), P(MULLER, moving(mM3, t, { t: t + 3 })),
      ballOf(ball3, t, (t > s1 && t < postT) || (t > s3 && t < net3) ? { trail: trailOf(ball3, t) } : {})];
    stadium(g, t, items, { cheer: t > net3 ? 1 : 0.6, blur: 2.5, hit: { t0: net3, y: 0.7, z: -0.9, k: 1.15 } });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > net3;
    scoreBug(g, sc ? 3 : 2, 1, "55'", { hotL: sc ? 1 - clamp((t - net3) / 0.6) : 0 });
    goalDots(g, sc ? 3 : 2, { pulse: sc ? 1 - clamp((t - net3) / 0.5) : 0 });
    watch(g, W3 - (net3 - t), { hot: sc ? 1 - clamp((t - net3) / 0.7) : 0 });
    if (t > postT) plate(g, '1 · POST', 220, 300, { color: RED, size: 38, ...pin(t, postT) });
    if (t > keepT) plate(g, '2 · KEEPER', 540, 300, { color: RED, size: 38, ...pin(t, keepT) });
    if (t > net3) plate(g, '3 · GOAL', 870, 300, { color: LIME, size: 38, ...pin(t, net3) });
  } });
  cue(g3S - 0.05, 'whoosh_fast', 0.22); cue(s1 - 0.02, 'kick', 0.6); cue(postT - 0.01, 'thud', 0.7); cue(postT, 'clock_press', 0.5); cue(postT + 0.03, 'crowd_gasp', 0.45);
  cue(s2 - 0.02, 'kick', 0.5); cue(keepT - 0.01, 'fist', 0.7); cue(s3 - 0.02, 'kick', 0.6); cue(net3 - 0.02, 'net', 0.8); cue(net3 + 0.03, 'crowd_roar', 0.6);

  // a hat-trick in 3:22: he wheels away with an arm in the air, Müller after him; the goalkeeper on his knees
  const g4S = s('g4'), recT = w('g3', '3') - 0.08;
  shot(hatT, (g, lt, t) => {
    const m = lM3.at(t), u = clamp(lt / (g4S - hatT));
    rig(B, lt, [[0, K(-2.7 + 0.2 * u, 0.05, lerp(5.6, 4.3, glide(u)), [m.x, 1.15, m.z], { cy: H * 0.52 })]], { t, e: lin, shake: 0.5 });
    const ms = moving(mM3, t, { t: t + 3, e: 'happy' });
    const items = [P(LEWY, { ...lewy3(t), e: JOY }), P(MULLER, { ...ms, pose: blend(ms.pose, { sh: [[0.6, 1.1], [0.6, 1.1]], el: [0.3, 0.3] }, 0.8) }),
      P(BENAGLIO, keeper3(t)), P(NALDO, { ...moving(naM3, t, { t: t + 1, e: 'sad' }), pose: { ...POSE.stand(), ...HIPS, look: -0.7 } }), ballOf(ball3, t)];
    stadium(g, t, items, { cheer: 1, blur: 2.5 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 3, 1, "55'"); goalDots(g, 3); watch(g, W3, { hot: t > recT ? 1 : 0 });
    if (t < recT) plate(g, 'HAT-TRICK', W / 2, 300, { color: GOLD, size: 56, ...pin(t, hatT + 0.05, fadeOut(t, recT - 0.2, 0.2)) });
    else counter(g, '3:22', 'FASTEST HAT-TRICK IN BUNDESLIGA HISTORY', { y: 420, size: 190, color: GOLD, at: [t, recT] });
  } });
  cue(hatT, 'whoosh_soft', 0.25); cue(recT, 'stamp', 0.6); cue(recT + 0.02, 'boom_move', 0.4);

  // ======================= 57': THE FOURTH, from behind the net: Douglas Costa's cross from the byline, nobody
  // clears it, and he volleys it into the roof of the net =======================
  const andT = w('g4', 'And') - 0.1, x4 = w('g4', 'cross,') - 0.02, v4 = w('g4', 'volley,') - 0.02, net4 = v4 + 0.2, W4 = 342;
  const cM4 = new Mover([[x4 - 1.2, 45.6, -15.2], [x4, 50.25, -12.3], [x4 + 0.7, 51.0, -11.2, { stop: true }], [99, 51.0, -11.2]]);
  const tM4 = new Mover([[x4 - 1.2, 43.4, -14.6], [x4, 47.6, -12.9], [x4 + 0.5, 48.4, -12.6, { stop: true }], [99, 48.4, -12.6]]);
  const lM4 = new Mover([[x4 - 1.2, 40.6, 4.8], [v4 - 0.4, 45.2, 1.9], [v4, 46.45, 1.0], [v4 + 0.6, 47.9, 0.85], [v4 + 1.25, 48.9, 0.7, { stop: true }], [99, 48.9, 0.7]]);
  const naM4 = new Mover([[x4 - 1.2, 49.2, -1.6], [x4 + 0.36, 48.25, -3.9], [x4 + 0.9, 48.5, -3.5, { stop: true }], [99, 48.5, -3.5]], { face: () => PI + 0.9 });
  const daM4 = new Mover([[x4 - 1.2, 48.0, 4.0], [v4, 47.7, 3.6, { stop: true }], [99, 47.7, 3.6]], { heading0: PI, face: () => PI });
  const bM4 = new Mover([[x4 - 3, 51.7, -2.9], [x4 + 0.3, 51.6, -2.7], [v4, 51.5, -2.1], [v4 + 0.15, 51.45, -1.9, { stop: true }], [99, 51.45, -1.9]], { heading0: PI, face: () => PI });
  const footC = t => { const m = cM4.at(t); return [m.x + Math.cos(m.head) * 0.5 - Math.sin(m.head) * 0.12, BALL_R, m.z + Math.sin(m.head) * 0.5 + Math.cos(m.head) * 0.12]; };
  const V4 = [46.98, 0.5, 0.72], R4 = [53.85, 2.12, 0.35];
  const ball4 = new BallPath([
    { t0: x4 - 2, t1: x4, kind: 'fn', fn: t => footC(Math.min(t, x4)) },
    { t0: x4, t1: x4 + 0.38, kind: 'air', from: footC(x4), to: [48.3, BALL_R, -4.5] },
    { t0: x4 + 0.38, t1: v4, kind: 'air', from: [48.3, BALL_R, -4.5], to: V4 },
    { t0: v4, t1: net4, kind: 'air', from: V4, to: R4, g: 2 },
    { t0: net4, t1: net4 + 0.6, kind: 'air', from: R4, to: [53.4, BALL_R, 0.3] },
    { t0: net4 + 0.6, t1: 99, kind: 'hold', from: [53.4, BALL_R, 0.3] },
  ]);
  const fourth = t => {
    const ls = runKick(lM4, t, v4, 'R', { u0: 0.61, dur: 0.5 }), up = ease.inOut(clamp((t - net4 - 0.12) / 0.35));
    const na = moving(naM4, t, { t: t + 1, e: 'worried' }), miss = 0.56 + (t - (x4 + 0.4)) / 0.5;
    const ks = keeper(BENAGLIO, bM4, t), fling = ease.inOut(clamp((t - v4 - 0.02) / 0.16));
    return [
      P(COSTA, runKick(cM4, t, x4, 'L')), P(RODRI, moving(tM4, t, { t: t + 4 })),
      P(LEWY, up > 0 ? { ...ls, pose: blend(ls.pose, { ...POSE.armsUp(1), sh: [[2.6, 0.62], [2.6, 0.62]] }, up), e: JOY } : ls),
      P(NALDO, miss > 0 && miss < 1 ? { ...na, pose: blend(na.pose, POSE.kick(miss, 'R'), smooth(clamp(miss / 0.2)) * smooth(clamp((1 - miss) / 0.25))) } : na),
      P(DANTE, moving(daM4, t, { t: t + 2, e: t > net4 ? 'sad' : 'worried' })),
      P(BENAGLIO, { ...ks, pose: blend(ks.pose, { sh: [[2.2, 0.5], [2.85, 0.25]], el: [0.4, 0.1], look: 0.6 }, fling), e: fling > 0.5 ? 'shock' : 'focus' }),
      ballOf(ball4, t, t > v4 && t < net4 ? { trail: trailOf(ball4, t) } : {}),
    ];
  };
  // (a) at the byline on the right: Douglas Costa, from in front, pulls it back across goal. The camera stands behind the
  // byline, on the same side of the ball's path as the camera of the next shot, so the ball leaves this picture to the
  // right and comes into the next one from the left; his feet and the ball stay above the caption band (cy)
  const cutT4 = x4 + 0.3;
  const camX = tt => { const c = cM4.at(Math.min(tt, x4 + 0.05)), u = clamp((tt - g4S + 0.05) / (cutT4 - g4S + 0.05));  // it stays on him: the ball leaves the picture, and the next shot is where it lands
    return K(2.5 + 0.1 * u, 0.07, lerp(5.2, 4.6, u), [c.x - 0.5, 1.0, c.z + 0.5], { cy: H * 0.42 }); };
  shot(g4S - 0.05, (g, lt, t) => {
    rigFn(lt, t, camX, { shake: 0.8 });
    stadium(g, t, fourth(t), { cheer: 0.7, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 3, 1, "57'"); goalDots(g, 3); watch(g, W4 - (net4 - t));
  } });
  // (b) from behind the net: the cross comes over from the left, nobody clears it, and the volley flies at the camera
  const E4 = [56.6, 1.5, 1.9];
  const cam4 = tt => lookFrom(E4, [48.6, 1.25, 0.7], { fov: lerp(2250, 2450, ease.inOut(clamp((tt - net4 - 0.1) / 0.8))) });
  shot(cutT4, (g, lt, t) => {
    const on = clamp(t - net4, 0, 1);
    rigFn(lt, t, cam4, { shake: 0.5 + 2.0 * on * (1 - on) });
    stadium(g, t, fourth(t), { cheer: t > net4 ? 1 : 0.7, blur: 2.5, hit: { t0: net4, y: 2.12, z: 0.35, k: 1.5 } });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > net4;
    scoreBug(g, sc ? 4 : 3, 1, "57'", { hotL: sc ? 1 - clamp((t - net4) / 0.6) : 0 });
    goalDots(g, sc ? 4 : 3, { pulse: sc ? 1 - clamp((t - net4) / 0.5) : 0 });
    watch(g, W4 - (net4 - t), { hot: sc ? 1 : 0 });
    if (sc) plate(g, "GOAL 4 · 57'", W / 2, 300, { color: GOLD, size: 50, ...pin(t, net4 + 0.05) });
  } });
  cue(g4S - 0.05, 'whoosh_fast', 0.22); cue(x4 - 0.02, 'kick', 0.5); cue(x4 + 0.38, 'bounce', 0.5); cue(v4 - 0.02, 'kick', 0.8); cue(net4 - 0.02, 'net', 0.9); cue(net4, 'boom_move', 0.45); cue(net4 + 0.03, 'crowd_roar', 0.6);

  // 4–1, and on the touchline Guardiola has Boateng by the shoulder and is still telling him where to stand
  const g5S = s('g5');
  shot(andT, (g, lt, t) => {
    const L = g5S - andT, u = glide(clamp(lt / L)), chop = Math.sin(t * 9);
    rig(B, lt, [[0, K(PI + lerp(0.33, 0.0, u), 0.03, lerp(3.6, 2.8, u), [10.55, 1.5, -35.25], { cy: H * 0.5 })]], { t, e: lin, shake: 0.4 });
    const pep = { x: 10.1, z: -35.2, head: 0.35, pose: { ...POSE.stand(), sh: [[1.2, 0.05], [0.95 + 0.14 * chop, 0.35]], el: [0.45, 0.75 + 0.2 * Math.abs(chop)], lean: 0.1 }, e: TALK(t), t };
    const boa = { x: 10.98, z: -35.32, head: PI - 0.3, pose: { ...POSE.stand(), ...HIPS, lean: 0.14 + 0.03 * Math.abs(Math.sin(t * 2.6)), look: -0.25 }, e: { ...EXPR.focus, look: [-0.5, 0.3] }, t: t + 2 };
    touchline(g, t, [P(PEP, pep), P(BOATENG, boa)], { cheer: 0.9, mood: 0.75, blur: 3 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 4, 1, "57'"); goalDots(g, 4); watch(g, W4, { hot: 0 });
    plate(g, 'STILL GIVING INSTRUCTIONS', W / 2, 300, { color: CREAM, size: 42, ...pin(t, andT + 0.25) });
  } });
  cue(andT, 'whoosh_soft', 0.25);

  // ======================= 60': THE FIFTH, one take from one place. The camera finds Götze out on the right, follows
  // his cross across, and the clock slows almost to a stop as he meets it; then it lets go and the ball is in the top
  // corner =======================
  const X5 = w('g5', 'cross.') - 0.1, W5 = 539;
  const rate5 = t => lerp(lerp(1, 0.2, smooth(clamp((t - X5 - 0.88) / 0.42))), 1, smooth(clamp((t - X5 - 1.75) / 0.6)));
  const TAB5 = (() => { const out = [], t0 = X5 - 4, dt = 1 / 240; let tt = -CROSS - 4; for (let i = 0; i < 240 * 9; i++) { out.push(tt); tt += rate5(t0 + i * dt) * dt; } return { out, t0, dt }; })();
  const tt5 = t => { const f = clamp((t - TAB5.t0) / TAB5.dt, 0, TAB5.out.length - 1.001), i = Math.floor(f); return lerp(TAB5.out[i], TAB5.out[i + 1], f - i); };
  const when5 = v => { let i = 0; while (i < TAB5.out.length - 1 && TAB5.out[i] < v) i++; return TAB5.t0 + i * TAB5.dt; };
  const hitT5 = when5(0), net5 = when5(FLY), fiveT = net5 + 0.42;
  const cutT5 = X5 + 0.34;
  // out on the right, from behind Götze: he looks up and the cross leaves his boot for the box
  const camG = t => { const tt = tt5(t), m = gM5.at(tt), b = ball5.at(tt).pos, up = smooth(clamp((tt + CROSS) / 0.4));
    return K(0.2 - 0.1 * up, 0.09 - 0.05 * up, 6.2, mix3([m.x + 0.45, 1.05, m.z + 1.6], [lerp(m.x, b[0], 0.6) + 0.6, 1.0 + 0.5 * b[1], lerp(m.z, b[2], 0.6) + 1.2], up), { cy: H * 0.52 }); };
  shot(g5S - 0.05, (g, lt, t) => {
    rigFn(lt, t, camG, { shake: 0.6 });
    stadium(g, t, fifth(tt5(t), t), { cheer: 0.7, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 4, 1, "60'"); goalDots(g, 4); watch(g, W5 - (FLY - tt5(t)));
  } });
  const E5 = [34.6, 1.35, 5.3];
  const cam5 = t => {
    const tt = tt5(t), b = ball5.at(tt).pos;
    const c = smooth(clamp((tt + 0.8) / 0.4)), d = smooth(clamp((tt - 0.03) / 0.3)), e = smooth(clamp((tt - 0.14) / 0.3));
    let T = mix3([36.7, 1.5, 0.2], [36.25, 1.02, 1.0], c);                                  // a little up and toward the ball as it comes in, then on him
    T = mix3(T, [lerp(36.25, Math.min(b[0], 47), 0.5), 1.25, lerp(1.0, b[2], 0.5)], d);  // after the strike: after the ball; he stays in the picture a moment
    T = mix3(T, [52.1, 1.4, -1.3], e);                                                     // the goal
    return lookFrom(E5, T, { fov: lerp(lerp(1650, 1850, c), 2550, e), cy: H * lerp(0.5, 0.47, c * (1 - e)) });
  };
  shot(cutT5, (g, lt, t) => {
    const tt = tt5(t), on = clamp(t - net5, 0, 1);
    rigFn(lt, t, cam5, { shake: 0.35 + 1.6 * on * (1 - on) });
    stadium(g, t, fifth(tt, t), { cheer: t > net5 ? 1 : 0.7, blur: 2.5, hit: hit5(net5) });
  }, { mbStep: 3, mbMax: 40, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > net5;
    scoreBug(g, sc ? 5 : 4, 1, "60'", { hotL: sc ? 1 - clamp((t - net5) / 0.6) : 0 });
    goalDots(g, sc ? 5 : 4, { pulse: sc ? 1 - clamp((t - net5) / 0.5) : 0 });
    watch(g, W5 - (FLY - tt5(t)), { hot: sc ? 1 : 0 });
  } });
  cue(g5S - 0.05, 'whoosh_fast', 0.22); cue(X5 - 0.02, 'kick', 0.55); cue(X5 + 0.85, 'whoosh_deep', 0.45); cue(hitT5 - 0.25, 'heartbeat', 0.5); cue(hitT5 - 0.02, 'kick', 0.9); cue(hitT5, 'thud', 0.5);
  cue(hitT5 + 0.3, 'riser', 0.4); cue(net5 - 0.02, 'net', 0.95); cue(net5, 'boom_big', 0.55); cue(net5 + 0.04, 'crowd_roar', 0.75);

  // five in 8:59: he runs off with his arm up, laughing; Douglas Costa gets to him first, Müller after
  const pepS = s('pep'), nineT = w('g5', '8') - 0.08;
  const lM6 = new Mover([[fiveT - 0.6, 37.2, 1.4], [fiveT + 0.6, 36.0, -4.2], [fiveT + 1.8, 33.6, -11.2], [fiveT + 3.0, 31.6, -16.4], [fiveT + 4.0, 30.9, -18.6, { stop: true }], [99, 30.9, -18.6]]);
  const cM6 = new Mover([[fiveT - 0.6, 43.5, -8.6], [fiveT + 1.0, 38.0, -8.2], [fiveT + 2.2, 34.9, -12.4], [fiveT + 3.2, 32.9, -16.9], [fiveT + 4.0, 32.2, -18.5, { stop: true }], [99, 32.2, -18.5]]);
  const mM6 = new Mover([[fiveT - 0.6, 30.0, 7.0], [fiveT + 2.0, 29.6, -5.0], [fiveT + 3.6, 28.8, -12.8], [fiveT + 4.4, 28.6, -14.6, { stop: true }], [99, 28.6, -14.6]]);
  shot(fiveT, (g, lt, t) => {
    const m = lM6.at(t), u = clamp(lt / (pepS - fiveT)), slow = ease.inOut(clamp((t - fiveT - 3.0) / 0.9)), wag = 0.12 * Math.sin(t * 5);
    rig(B, lt, [[0, K(-0.36 + 0.2 * u, 0.05, lerp(5.4, 4.1, glide(u)), [m.x + 0.5 * ease.inOut(clamp((t - fiveT - 1.6) / 1.6)), 1.2, m.z], { cy: H * 0.53 })]], { t, e: lin, shake: 0.6 });
    const ls = moving(lM6, t, { t, e: 'happy' }), cs = moving(cM6, t, { t: t + 1, e: 'happy' }), ms = moving(mM6, t, { t: t + 2, e: 'happy' });
    const items = [
      P(LEWY, { ...ls, head: ls.head + wag * slow, pose: blend(blend(ls.pose, ARM_UP(1), 1 - 0.6 * slow), { sh: [[0.55, 0.9], [0.55, 0.9]], el: [0.5, 0.5] }, slow * 0.7), e: { ...EXPR.happy, open: 0.7, lid: 0.1, brow: -0.4, browY: -10 } }),
      P(COSTA, { ...cs, pose: blend(cs.pose, { sh: [[1.5, 0.75], [1.5, 0.75]], el: [0.5, 0.5] }, 0.3 + 0.6 * slow) }),
      P(MULLER, { ...ms, pose: blend(ms.pose, { ...POSE.armsUp(1), sh: [[2.6, 0.62], [2.6, 0.62]] }, 0.75) }),
    ];
    stadium(g, t, items, { cheer: 1, blur: 3 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 5, 1, "60'"); goalDots(g, 5); watch(g, W5, { hot: 1 });
    if (t < nineT) plate(g, 'FIVE', W / 2, 300, { color: GOLD, size: 64, ...pin(t, fiveT + 0.05, fadeOut(t, nineT - 0.2, 0.2)) });
    else counter(g, '8:59', 'FIVE GOALS · A BUNDESLIGA RECORD', { y: 420, size: 200, color: GOLD, at: [t, nineT] });
  } });
  cue(fiveT, 'whoosh_soft', 0.25); cue(nineT, 'stamp', 0.65); cue(nineT + 0.02, 'boom_cine', 0.45);

  // ======================= GUARDIOLA: both hands on his head, laughing; the bench behind him in each other's arms =======================
  const laterT = w('pep', 'Later') - 0.12;
  shot(pepS - 0.05, (g, lt, t) => {
    const L = laterT - pepS, u = glide(clamp(lt / L));
    rig(B, lt, [[0, K(PI - lerp(0.36, 0.02, u), 0.015, lerp(2.9, 2.0, u), [PEP_AT[0] + 0.02, 1.47, PEP_AT[1]], { cy: H * 0.5 })]], { t, e: lin, shake: 0.5 });
    const turn = 0.3 * Math.sin((t - pepS) * 1.5);
    touchline(g, t, [P(PEP, { x: PEP_AT[0], z: PEP_AT[1], head: PI / 2 + turn, pose: { ...POSE.stand(), ...HEAD_HOLD, lean: -0.07 + 0.02 * Math.sin(t * 3), look: 0.2 },
      e: { ...EXPR.happy, brow: -0.6, browY: -14, lid: 0, open: 0.6 + 0.15 * Math.sin(t * 6), look: [0.5 * Math.sin((t - pepS) * 1.5), -0.1] }, t })], { cheer: 1, mood: 1, blur: 3.5 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 5, 1, "60'"); goalDots(g, 5); watch(g, W5, { hot: 1 });
  } });
  cue(pepS - 0.05, 'whoosh_soft', 0.25); cue(pepS + 0.2, 'laugh', 0.25);

  // afterwards, at the interview wall: "I can't explain it"
  const recS = s('rec'), cantT = w('pep', 'I') - 0.05, IX = 300, IZ = 300;
  shot(laterT, (g, lt, t) => {
    const L = recS - laterT, u = glide(clamp(lt / L));
    rig(B, lt, [[0, K(PI + 0.22 - 0.34 * u, 0.02, lerp(2.5, 1.95, u), [IX, 1.5, IZ], { cy: H * 0.5 })]], { t, e: lin, shake: 0.3 });
    bgx.setTransform(1, 0, 0, 1, 0, 0); wallSet(bgx, t, IX, IZ); g.save(); g.filter = 'blur(5px)'; g.drawImage(BG, 0, 0); g.restore();
    const k = ease.inOut(clamp((t - cantT + 0.25) / 0.4));
    const items = [P(PEP, { x: IX, z: IZ, head: PI / 2 + 0.06 * Math.sin(t * 1.7), pose: blend({ ...POSE.stand(), sh: [[0.05, 0.1], [0.05, 0.1]], el: [0.3, 0.3] }, SHRUG, k), e: { ...EXPR.happy, open: 0.25 + 0.25 * Math.abs(Math.sin(t * 8)), brow: -0.5, browY: -10, lid: 0.1, curve: 0.5 }, t }), micItem(IX - 0.34, 1.2, IZ + 0.42)];
    for (const it of items) it.shadow?.(g);
    drawSorted(g, items);
  }, { grade: ROOM_G, trans: 'fade', transDur: 0.25, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    plate(g, 'AFTER THE MATCH', W / 2, 200, { color: CREAM, size: 34, ...pin(t, laterT + 0.2) });
    if (t > cantT) plate(g, '“I CAN’T EXPLAIN IT.”', W / 2, 330, { color: GOLD, size: 60, ...pin(t, cantT) });
  } });
  cue(laterT, 'camera', 0.3); cue(cantT, 'stamp', 0.4);

  // ======================= FOUR RECORDS: full time, the match ball under his arm; the four of them, one by one =======================
  const endS = s('end'), r1 = w('rec', 'hat-trick,') - 0.62, r2 = w('rec', 'goals,') - 0.93, r3 = w('rec', 'five,') - 0.69, r4 = w('rec', 'substitute.') - 1.48, fourT = w('rec', 'four') - 0.06;
  const RC = [-6, 4];
  shot(recS - 0.05, (g, lt, t) => {
    const L = endS - recS, u = glide(clamp(lt / L));
    // cy: his face and the ball he holds sit above the caption band (the words cross his shorts), the list of records above his head
    rig(B, lt, [[0, K(lerp(0.5, 0.05, u), 0.03, lerp(4.5, 3.15, u), [RC[0], 1.3, RC[1]], { cy: H * 0.575 })]], { t, e: lin, shake: 0.3 });
    const st = { x: RC[0], z: RC[1], head: -PI / 2 + 0.2 - 0.25 * u, pose: { ...POSE.stand(), sh: [[0.32, 0.42], [-0.25, 0.12]], el: [1.25, 0.55], fore: [-0.15, 0.12], lean: 0.02 + 0.01 * Math.sin(t * 1.6) }, e: { ...EXPR.happy, open: 0.3, lid: 0.15 }, t };
    const sk = skeleton(LEWY, st), hand = sk.arms[0].hand, bp = [hand[0] - sk.r[0] * 0.02 + sk.f[0] * 0.04, hand[1] + 0.1, hand[2] - sk.r[2] * 0.02 + sk.f[2] * 0.04];
    const walk = (pl, x0, z0, dx, ph, e) => { const x = x0 + dx * (t - recS); return P(pl, { x, z: z0, head: dx > 0 ? 0 : PI, pose: POSE.run((t + ph) * 5.2, 0.45, 0), e, t: t + ph }); };
    const items = [P(LEWY, st), BALL(bp, { spin: 0.6 }), walk(MULLER, -1.4, 13, -0.2, 1, 'happy'), walk(DANTE, -15.4, 17, -0.3, 2, 'sad'), walk(NALDO, -16.8, 12, -0.3, 4, 'sad')];
    stadium(g, t, items, { cheer: 0.8, blur: 3.5 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 5, 1, "90'");
    if (t > fourT) plate(g, '4 GUINNESS WORLD RECORDS', W / 2, 250, { color: GOLD, size: 46, ...pin(t, fourT) });
    const row = (y, t0, big, label, col) => { if (t <= t0) return; const u = enter(t, t0); g.save(); g.globalAlpha = u; plate(g, big, 190, y, { color: col, size: 50, scale: lerp(0.94, 1, u), minW: 210 }); plate(g, label, 660, y, { color: '#1B2436', ink: CREAM, size: 34, scale: lerp(0.94, 1, u), dy: 0, minW: 680 }); g.restore(); };
    row(372, r1, '3:22', 'FASTEST HAT-TRICK', CREAM); row(478, r2, '5:42', 'FASTEST FOUR GOALS', CREAM); row(584, r3, '8:59', 'FASTEST FIVE GOALS', CREAM); row(690, r4, '5', 'MOST GOALS BY A SUBSTITUTE', GOLD);
  } });
  cue(recS - 0.05, 'whistle', 0.4); cue(recS + 0.25, 'whistle', 0.35); cue(recS + 0.1, 'applause', 0.4); cue(fourT, 'reveal_bell', 0.35);
  for (const r of [r1, r2, r3, r4]) cue(r, 'stamp', 0.4);
  cue(r4 + 0.05, 'success', 0.3);

  // ======================= AND HE HAD STARTED IT ON THE BENCH: the first half, the dugout, him in a warm-up top =======================
  const benchT = w('end', 'bench.');
  shot(endS - 0.05, (g, lt, t) => {
    const L = T.duration - endS, u = glide(clamp(lt / L)), bx = 10.9, bz = DUG.zb + 0.5;
    rig(B, lt, [[0, K(PI + lerp(0.34, 0.06, u), lerp(0.02, 0.08, u), lerp(2.6, 4.9, u), [bx, lerp(1.05, 1.15, u), bz], { cy: H * 0.5 })]], { t, e: lin, shake: 0.25 });
    const lewy = P(LEWY_SUB, { x: bx, z: bz, head: PI / 2 - 0.06, pose: { ...SEATED, lean: 0.22 + 0.015 * Math.sin(t * 1.5), look: 0.05 }, e: { ...EXPR.neutral, brow: 0.2, look: [0.25 * Math.sin(t * 0.9), 0.15], lid: 0.18 }, t });
    touchline(g, t, [lewy], { cheer: 0, mood: 0, blur: 3, sitX: [7.2, 13.9], staffX: [] });
  }, { trans: 'fade', transDur: 0.3, qaAllow: ['face cut by frame'],
    post: (g, lt, t) => { const f = clamp((t - (T.duration - 1.9)) / 1.2); if (f > 0) { g.fillStyle = `rgba(0,0,0,${f.toFixed(3)})`; g.fillRect(0, 0, W, H); } }, hud: (g, lt, t) => {
    const a = fadeOut(t, T.duration - 2.0, 0.6);
    scoreBug(g, 0, 1, "45'", { al: a });
    plate(g, 'THE FIRST HALF', W / 2, 250, { color: CREAM, size: 40, ...pin(t, endS + 0.15, a) });
    if (t > benchT - 0.1) plate(g, 'ON THE BENCH', W / 2, 345, { color: GOLD, size: 54, ...pin(t, benchT - 0.1, a) });
  } });
  cue(endS - 0.05, 'whoosh_deep', 0.3); cue(benchT - 0.1, 'boom_cine', 0.3);

  // ---------- the crowd under it all: quiet at 0–1, louder with every goal
  amb.push({ id: 'crowd_bed', t0: 0, t1: ctxS, gain: 0.9, fi: 0.02, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: bayT, t1: subS, gain: 0.45, fi: 0.2, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: subS - 0.05, t1: laterT + 0.2, gain: 0.6, fi: 0.2, fo: 0.3, keys: [[subS, 0.6], [net1, 0.6], [net1 + 0.2, 0.95], [net2 + 0.2, 1.05], [net3 + 0.2, 1.15], [net4 + 0.2, 1.25], [g5S, 1.0], [hitT5 - 0.3, 0.45], [net5, 0.5], [net5 + 0.15, 1.45], [pepS + 1, 1.3]] });
  amb.push({ id: 'crowd_bed', t0: recS - 0.05, t1: endS, gain: 0.7, fi: 0.2, fo: 0.4 });
  amb.push({ id: 'crowd_bed', t0: endS - 0.05, t1: T.duration, gain: 0.35, fi: 0.3, fo: 1.6 });

  const music = [
    { t: 0, m: 'hook' }, { t: ctxS - 0.05, m: 'tension' }, { t: subS - 0.05, m: 'build' }, { t: g1S - 0.05, m: 'stands' }, { t: g2S - 0.05, m: 'stands_hot' },
    { t: hatT, m: 'fiesta' }, { t: g4S - 0.05, m: 'stands_hot' }, { t: andT, m: 'intrigue' }, { t: g5S - 0.05, m: 'build' }, { t: X5 + 0.9, m: 'void' },
    { t: net5, m: 'slam' }, { t: fiveT, m: 'fiesta' }, { t: laterT, m: 'intrigue' }, { t: recS - 0.05, m: 'glory' }, { t: endS - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff: null, grain: 0.02 };
}
