// "149–0". AS Adema 149–0 SO l'Emyrne: Madagascar's championship, Toamasina, Thursday 31 October 2002. SO l'Emyrne, the
// defending champions, scored every goal into their own net in protest at the refereeing of their previous match (a late,
// disputed penalty against them, in the game with DSA Antananarivo, that cost them the title; it went to AS Adema). The
// federation banned their coach for three years and suspended several players. SOURCES.md.
// The settings are those of plea2005 (STYLE_BIBLE rule 68), the one-take cutting and the length rule 70, the shots on the
// grammar of cantona1995 (rule 73). No photograph of the match is known: the first frame is the drawn scoreboard, with the
// score as the title. The header and the shared helpers are those of cantona1995.
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, stamp, enter, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, playerItems, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, BALL_R, skeleton, figureK, v3, texQuadW, crowdTex } from '../../engine/js/football.js';
import { loadImage } from '../../engine/js/photo.js';
import { serif } from '../../engine/js/hud.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI, FPS = 30;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', LIME = '#9CCB4A', RED = '#D8453A', BLACK = '#15161A';
const IMG = {};  // no photograph of the match is known (SOURCES.md)
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

// ---------- skins, people, hair (shared with cantona1995)
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
function scoreBug(g, L, R, a, b, m, { x = 40, y = 76, al = 1, colL = UNAVY, colR = CYEL, pop = 0, w = 360 } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const hh = 54, my = y + hh / 2 + 2;
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
const poly = (g, pts, fill) => { if (B.poly(g, pts)) { g.fillStyle = fill; g.fill(); } };

// ---------- from cantona1995: a picture on a plane, the glitch of the rewind, the slow motion
const quadImg = (g, img, tl, tr, bl) => { const a = B.project(...tl), b = B.project(...tr), c = B.project(...bl); if (a.z < 0.2 || b.z < 0.2 || c.z < 0.2) return;
  g.save(); g.transform((b.x - a.x) / img.width, (b.y - a.y) / img.width, (c.x - a.x) / img.height, (c.y - a.y) / img.height, a.x, a.y); g.drawImage(img, 0, 0); g.restore(); };
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
function warp(knots) {  // monotone cubic through [real time, game time] knots: a slow motion that eases in and out
  const n = knots.length, x = knots.map(k => k[0]), y = knots.map(k => k[1]), d = [];
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s2 = a * a + b * b; if (s2 > 9) { const tau = 3 / Math.sqrt(s2); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; } }
  return r => { if (r <= x[0]) return y[0] + (r - x[0]) * m[0]; if (r >= x[n - 1]) return y[n - 1] + (r - x[n - 1]) * m[n - 1];
    let i = 0; while (r > x[i + 1]) i++; const h = x[i + 1] - x[i], u = (r - x[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1]; };
}

// ---------- this film's colours and kits. SO l'Emyrne in yellow, AS Adema in blue: the clubs' colours in their Wikipedia
// infoboxes (the kits worn on 31 October 2002 were not checked); DSA Antananarivo in white (not checked); the referee in
// black. The cast: cartoons, not likenesses
const UNAVY = '#1C2B5A', CYEL = '#F2C811';  // scoreBug's defaults
const SYEL = '#F4D21E', SYELD = '#D3B214', ABLUE = '#2257C4', ABLUED = '#1A4396', DWHITE = '#F2F2EE', INK = '#16171B';
const SOEK = { shirt: SYEL, shirtD: SYELD, trim: INK, num: INK, numEdge: null, shorts: SYEL, socks: SYEL, band: INK, boots: INK, badge: INK };
const SOEGK = { shirt: '#2F9A55', shirtD: '#237A42', trim: INK, num: '#F4F4F2', numEdge: null, shorts: INK, socks: '#2F9A55', band: INK, boots: INK, badge: '#F4F4F2', gloves: '#F4F4F2' };
const ADEK = { shirt: ABLUE, shirtD: ABLUED, trim: '#F4F4F2', num: '#F4F4F2', numEdge: null, shorts: ABLUE, socks: ABLUE, band: '#F4F4F2', boots: INK, badge: '#F4F4F2' };
const ADEGK = { shirt: '#E8762A', shirtD: '#C45E1C', trim: INK, num: INK, numEdge: null, shorts: INK, socks: '#E8762A', band: INK, boots: INK, badge: INK, gloves: '#F4F4F2' };
const DSAK = { shirt: DWHITE, shirtD: '#CDD1D4', trim: INK, num: INK, numEdge: null, shorts: INK, socks: DWHITE, band: INK, boots: INK, badge: INK };
const REFK = { shirt: '#141518', shirtD: '#0C0D10', trim: '#2A2C30', num: null, shorts: '#141518', socks: '#141518', band: '#2A2C30', boots: '#0E0F12', badge: null };
const COACHK = plain('#26303E', '#26303E'), CLERKK = plain('#8A97A6', '#3A3E48');
// faces: Malagasy players, staff and fans of many looks; full heads of dark hair (rule 71)
const MGH = ['#120D0A', '#1A1310', '#0E0A08', '#22180F', '#15100C'];
const MGS = [SKIN_M, SKIN_D, SKIN_T, SKIN_M, SKIN_D, SKIN_L];
// 24 players' faces (SO l'Emyrne 0-9, their keeper 10; AS Adema 12-21, their keeper 22; DSA 11 and 23): no face is seen twice
// in one picture. The shapes and noses vary, a few have a goatee
for (let i = 0; i < 24; i++) { const r = rng(4100 + i * 13), hc = MGH[(i * 3) % 5];
  CAST['mg' + i] = head('buzz', [0.92 + r() * 0.08, 1.0 + r() * 0.1, 0.84 + r() * 0.1], hc, { skin: MGS[(i + (i < 12 ? 0 : 3)) % 6], brow: '#0E0A08', nose: 0.9 + r() * 0.25,
    ...(i % 8 === 5 ? { beard: hc, beardStyle: 'goatee' } : {}), ...fullHair(hc) }); }
// 12 faces for the fans and the man in the ticket booth: older men among them, a few beards, a pair of glasses
const FANH = ['#120D0A', '#2A2420', '#0E0A08', '#5A5550', '#1A1310', '#3A3632'];
for (let i = 0; i < 12; i++) { const r = rng(5200 + i * 7), hc = FANH[i % 6];
  CAST['fc' + i] = head('buzz', [0.93 + r() * 0.09, 0.98 + r() * 0.1, 0.86 + r() * 0.1], hc, { skin: MGS[(i * 5 + 2) % 6], brow: '#1A1410', nose: 0.9 + r() * 0.3,
    ...(i % 4 === 1 ? { age: 0.5 } : {}), ...(i % 5 === 2 ? { beard: hc, beardStyle: 'full' } : {}), ...(i % 6 === 4 ? { glasses: true } : {}), ...fullHair(hc) }); }
CAST.coach = head('buzz', [1.0, 1.06, 0.95], '#3A3632', { skin: SKIN_M, brow: '#2A2622', age: 0.4, beard: '#3A3632', beardStyle: 'full', ...fullHair('#3A3632') });
CAST.ref = head('buzz', [0.98, 1.05, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', ...fullHair('#120D0A') });
const NUMS = [9, 10, 8, 6, 4, 5, 2, 3, 7, 11];
const SOE = NUMS.map((n, i) => mk('mg' + i, SOEK, n, 1.71 + (i % 4) * 0.04));
const SOE_GK = mk('mg10', SOEGK, 1, 1.84);
const ADE = NUMS.map((n, i) => mk('mg' + (12 + i), ADEK, n, 1.72 + ((i + 2) % 4) * 0.04));
const ADE_GK = mk('mg22', ADEGK, 1, 1.85);
const DSA = [9, 7, 10, 11].map((n, i) => mk('mg' + [11, 23, 10, 22][i], DSAK, n, 1.76));
const REF = mk('ref', REFK, null, 1.78), COACH = mk('coach', COACHK, null, 1.74), CLERK = mk('fc4', CLERKK, null, 1.7);
const FANCOL = ['#ECE8DE', '#C8302C', '#2E7D3A', SYEL, ABLUE, '#7A5238', '#3A3E48', '#D88A2A', '#F2F2EE', '#5A6E8A', '#9A2E6A', '#4A8A8A'];
const FANS = Array.from({ length: 36 }, (_, i) => mk('fc' + (i % 12), plain(FANCOL[(i * 7 + Math.floor(i / 12) * 5) % 12], i % 3 ? '#2A2D34' : '#5A5850'), null, 1.64 + ((i * 3) % 5) * 0.04));  // the 12 faces, three outfits each

// ---------- the ground at Toamasina, drawn from the general look of a stadium in a tropical port town (not the Barikadimy
// Stadium itself): the pitch inside a low wall, open concrete terraces on three sides, a covered main stand along +z, the
// -x end open to the palm trees; afternoon light. The scoreboard stands on two legs behind the terrace at the +x end
const SKY_T = { zen: '#3D78C4', mid: '#8CB8E2', hor: '#EEF0E6', clouds: 0.55, cloud: '#FFFFFF', seed: 31 };
const SKY_DUSK = { zen: '#3E4E7A', mid: '#B88A78', hor: '#F2C48A', clouds: 0.45, cloud: '#F6D2AA', seed: 31 };
const TURF_T = { colors: ['#4C9E44', '#58AA4E'], wear: 0.12, haze: '#B9C9B0', noise: false };
const WALLX = 57, WALLZ = 40, TD = 12, TH0 = 1.2, TH1 = 7.0;
const FLAG_SOE = g => { g.fillStyle = SYEL; g.fillRect(0, 0, 1, 1); g.fillStyle = INK; g.fillRect(0, 0.42, 1, 0.16); };
const FLAG_ADE = g => { g.fillStyle = ABLUE; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0.42, 0, 0.16, 1); };
const TCROWD = [['#ECE8DE', 26], ['#C8302C', 10], ['#2E7D3A', 8], [SYEL, 14], [ABLUE, 12], ['#7A5238', 10], ['#3A3E48', 12], ['#D88A2A', 6]];
const CT = [crowdTex(1024, 256, { rows: 12, seed: 61, density: 0.7, cloth: TCROWD, flags: 3, flagSet: [FLAG_SOE, FLAG_ADE], step: '#A9A397', riser: '#7C766C' }),
  crowdTex(1024, 256, { rows: 12, seed: 61, density: 0.7, cheer: 1, cloth: TCROWD, flags: 3, flagSet: [FLAG_SOE, FLAG_ADE], step: '#A9A397', riser: '#7C766C' })];
const TERR = [{ ax: 'z', s: 1, a0: -48, a1: 48, roof: true }, { ax: 'z', s: -1, a0: -48, a1: 48 }, { ax: 'x', s: 1, a0: -30, a1: 30 }];
const BOARDS_T = [boardDesign('TOAMASINA', { bg: '#1E5AA8', ink: '#FFFFFF' }), boardDesign('MADAGASCAR'), boardDesign('31 · 10 · 2002', { bg: SYEL, ink: INK }), boardDesign('CHAMPIONNAT 2002', { bg: '#C8302C', ink: '#FFFFFF' })];
const PALMS = (() => { const r = rng(2002), out = [];
  for (let i = 0; i < 26; i++) out.push({ x: -70 + i * 5.6 + (r() - 0.5) * 3, z: WALLZ + TD + 6 + r() * 16, h: 13 + r() * 7, lean: (r() - 0.5) * 1.2, seed: i });
  for (let i = 0; i < 26; i++) out.push({ x: -70 + i * 5.6 + (r() - 0.5) * 3, z: -(WALLZ + TD + 6 + r() * 16), h: 13 + r() * 7, lean: (r() - 0.5) * 1.2, seed: 40 + i });
  for (let i = 0; i < 14; i++) out.push({ x: -(WALLX + 6 + r() * 26), z: -36 + i * 5.4 + (r() - 0.5) * 3, h: 11 + r() * 8, lean: (r() - 0.5) * 1.2, seed: 80 + i });
  for (let i = 0; i < 12; i++) out.push({ x: WALLX + TD + 14 + r() * 18, z: -34 + i * 6.2 + (r() - 0.5) * 3, h: 14 + r() * 7, lean: (r() - 0.5) * 1.2, seed: 120 + i });
  return out; })();
// ---------- this film's faces and poses
const SHOUT = { ...EXPR.angry, open: 0.85, mouth: 'o', brow: 0.9, browY: 10, lid: 0.1, noBlink: true };
const SHOCK = { ...EXPR.shock, sweat: 0 };
const PUZZLED = { ...EXPR.worried, brow: -0.5, browY: -8, lid: 0.05, look: [0.4, 0], curve: -0.1 };
const BLANK = { ...EXPR.neutral, lid: 0.28, curve: -0.05, look: [0, 0] };  // the Adema players: nothing to do but watch
const GRIM = { ...EXPR.angry, brow: 0.7, browY: 6, lid: 0.25, curve: -0.3 };
const SEATED = { hip: [[1.5, 0.12], [1.5, 0.12]], knee: [1.52, 1.52], sh: [[0.95, 0.16], [0.95, 0.16]], el: [0.95, 0.95], lean: 0.08, pelvisY: 0.5, ground: false, look: 0 };
const POINTING = { ...POSE.stand(), sh: [[0.1, 0.1], [1.45, 0.05]], el: [0.3, 0.15], point: [false, true], lean: 0.12 };
const SHRUG = { ...POSE.stand(), sh: [[0.7, 0.95], [0.7, 0.95]], el: [1.65, 1.65], lean: 0.02 };  // palms up: what is this?
const SCRATCH = { ...POSE.stand(), sh: [[2.55, 0.85], [0.12, 0.1]], el: [2.0, 0.3], lean: 0.03 };  // a hand to the head
const TICKET_UP = { ...POSE.stand(), sh: [[0.1, 0.1], [2.75, 0.25]], el: [0.3, 0.12], lean: 0.05 };  // a ticket held up
const v3sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], v3dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const facing = (n, c) => v3dot(n, v3sub(B.E, c)) > 0;

// ---------- palm trees (drawn flat at their place in the world: a tapering trunk, a crown of drooping fronds)
function palmItem(p) {
  return { get d() { return depth(p.x, p.h / 2, p.z); }, draw: g => {
    const b = B.project(p.x, 0, p.z), t = B.project(p.x + p.lean * p.h * 0.16, p.h, p.z); if (b.z < 0.8 || t.z < 0.8) return;
    const dist = Math.hypot(p.x - B.E[0], p.z - B.E[2]), hz = clamp((dist - 30) / 260) * 0.55, r = rng(p.seed);
    const trunk = mix('#7C6448', '#B9C6CC', hz), leaf = mix('#2E6A33', '#A8BCC0', hz), leafD = mix('#22522A', '#9EB2B6', hz);
    const w0 = 0.3 * b.s, w1 = 0.16 * t.s, mx = (b.x + t.x) / 2 + p.lean * 0.12 * Math.abs(b.y - t.y), my = (b.y + t.y) / 2;
    g.fillStyle = trunk; g.beginPath(); g.moveTo(b.x - w0, b.y); g.quadraticCurveTo(mx - (w0 + w1) / 2, my, t.x - w1, t.y); g.lineTo(t.x + w1, t.y);
    g.quadraticCurveTo(mx + (w0 + w1) / 2, my, b.x + w0, b.y); g.closePath(); g.fill();
    const L = 4.4 * t.s;
    for (let i = 0; i < 10; i++) { const a = 0.08 * PI + (i / 9) * 0.84 * PI + (r() - 0.5) * 0.2, len = L * (0.75 + r() * 0.4), droop = 0.5 + r() * 0.5;
      const ex = t.x + Math.cos(a) * len, ey = t.y - Math.sin(a) * len * 0.4 + droop * len * 0.55, cx = t.x + Math.cos(a) * len * 0.5, cy = t.y - Math.sin(a) * len * 0.42 - len * 0.1;
      g.fillStyle = i % 2 ? leaf : leafD; g.beginPath(); g.moveTo(t.x, t.y); g.quadraticCurveTo(cx, cy - len * 0.07, ex, ey); g.quadraticCurveTo(cx, cy + len * 0.1, t.x, t.y + 0.12 * t.s); g.fill(); }
    g.fillStyle = mix('#5A4630', '#B9C6CC', hz); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(t.x + (i - 1.5) * 0.22 * t.s, t.y + 0.28 * t.s, 0.16 * t.s, 0, 2 * PI); g.fill(); } } };
}
// ---------- the terraces: one textured slope per 12 m, seen only from the pitch side; the covered one in shade
function terraceItems(t, cheer, hole = null) {
  const out = [], img = CT[cheer > 0.4 ? Math.floor(t * 7) % 2 : 0];
  for (const tr of TERR) { const n = Math.round((tr.a1 - tr.a0) / 12);
    for (let i = 0; i < n; i++) { const u0 = tr.a0 + 12 * i, u1 = u0 + 12;
      if (hole && tr.ax === 'z' && tr.s === hole.s && u1 > hole.x0 && u0 < hole.x1) continue;
      const Pt = (u, d, y) => tr.ax === 'z' ? [u, y, tr.s * (WALLZ + 0.6 + d)] : [tr.s * (WALLX + 0.6 + d), y, u];
      const p00 = Pt(u0, 0, TH0), p10 = Pt(u1, 0, TH0), p11 = Pt(u1, TD, TH1), p01 = Pt(u0, TD, TH1);
      const N = tr.ax === 'z' ? [0, TD, -tr.s * (TH1 - TH0)] : [-tr.s * (TH1 - TH0), TD, 0];
      const c = [(p00[0] + p11[0]) / 2, (TH0 + TH1) / 2, (p00[2] + p11[2]) / 2]; if (!facing(N, c)) continue;
      const k = i % 4, U0 = img.width * k / 4, U1 = img.width * (k + 1) / 4;
      out.push({ d: depth(...c), draw: g => { texQuadW(g, B, img, p00, p10, p11, p01, [U0, img.height, U1, 0]);
        if (tr.roof) poly(g, [p00, p10, p11, p01], 'rgba(10,14,24,0.34)');
        const back = [Pt(u0, TD, TH1), Pt(u1, TD, TH1), Pt(u1, TD + 0.3, TH1 + 1.1), Pt(u0, TD + 0.3, TH1 + 1.1)]; poly(g, back, '#BDB6A6'); } });
    } }
  return out;
}
// the main stand's roof (+z): posts, the underside, the fascia, and its top for the shots from above
function roofItems() {
  const y = 12.6, z0 = WALLZ - 1.2, z1 = WALLZ + TD + 1.5, out = [];
  out.push({ d: depth(0, y, (z0 + z1) / 2) - 2, draw: g => {
    for (let x = -45; x <= 45; x += 15) poly(g, [[x - 0.18, TH0, WALLZ + 1], [x + 0.18, TH0, WALLZ + 1], [x + 0.18, y, WALLZ + 1], [x - 0.18, y, WALLZ + 1]], '#8C8A84');
    const under = [[-50, y, z0], [50, y, z0], [50, y, z1], [-50, y, z1]];
    poly(g, under, B.E[1] > y ? '#B8B4AA' : '#45484F');
    poly(g, [[-50, y - 0.5, z0], [50, y - 0.5, z0], [50, y + 0.6, z0], [-50, y + 0.6, z0]], '#E2DED2'); } });
  return out;
}
// ---------- the scoreboard: dark panel, the two names, amber figures, the minute. Drawn again only when it changes
const SBW = 1600, SBH = 620, SBC = makeCanvas(SBW, SBH), sbg = SBC.getContext('2d'); let sbKey = null;
function sbFace(a, b, m, flash = 0) {
  const key = `${a}|${b}|${m}|${flash > 0.5 ? 1 : 0}`; if (key === sbKey) return SBC; sbKey = key; const g = sbg;
  g.save(); g.fillStyle = '#0E1013'; g.fillRect(0, 0, SBW, SBH); g.strokeStyle = '#3A3E46'; g.lineWidth = 18; g.strokeRect(9, 9, SBW - 18, SBH - 18);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = sans(88, 900); g.fillStyle = '#A9C8FF'; g.fillText('AS ADEMA', SBW * 0.27, 112); g.fillStyle = SYEL; g.fillText("SO L'EMYRNE", SBW * 0.73, 112);
  const led = flash > 0.5 ? '#FFFFFF' : '#FFB21E'; g.shadowColor = led; g.shadowBlur = 34; g.fillStyle = led;
  g.font = sans(a >= 100 ? 270 : 300, 900); g.fillText(String(a), SBW * (a >= 100 ? 0.24 : 0.27), 350); g.font = sans(300, 900); g.fillText(String(b), SBW * 0.73, 350);
  g.font = sans(190, 900); g.fillText('–', SBW / 2, 330);
  g.shadowBlur = 0; g.font = sans(66, 800); g.fillStyle = '#E8E8E0'; g.fillText(`MIN ${String(m).padStart(2, '0')}`, SBW / 2, 545); g.restore();
  return SBC;
}
const SBX = 73, SBZ = 8.5, SBY0 = 9, SBY1 = 15.2;
function scoreboardItem(a, b, m, flash = 0) {
  return { get d() { return depth(SBX, (SBY0 + SBY1) / 2, 0); }, draw: g => {
    for (const z of [-5.5, 5.5]) poly(g, [[SBX + 0.3, 0, z - 0.25], [SBX + 0.3, 0, z + 0.25], [SBX + 0.3, SBY0, z + 0.25], [SBX + 0.3, SBY0, z - 0.25]], '#4A4C52');
    poly(g, [[SBX + 0.05, SBY0 - 0.45, SBZ + 0.45], [SBX + 0.05, SBY0 - 0.45, -SBZ - 0.45], [SBX + 0.05, SBY1 + 0.45, -SBZ - 0.45], [SBX + 0.05, SBY1 + 0.45, SBZ + 0.45]], '#23252A');
    if (B.E[0] < SBX) texQuadW(g, B, sbFace(a, b, m, flash), [SBX, SBY0, SBZ], [SBX, SBY0, -SBZ], [SBX, SBY1, -SBZ], [SBX, SBY1, SBZ], [0, SBH, SBW, 0], { live: true }); } };
}
// ---------- the ground: sky, the land and palms, the terraces, the roof and the scoreboard (behind, blurred if asked),
// then the pitch, the boards, the goals and the people
const BG2 = makeCanvas(), bg2 = BG2.getContext('2d');
function ground(g, t, items = [], { sk = SKY_T, cheer = 0.3, blur = 0, score = 0, min = 0, flash = 0, board = true, hole = null, hit = null, hitL = null } = {}) {
  const back = c => { sky(c, B, { t, ...sk });
    poly(c, [[-400, -0.02, -400], [400, -0.02, -400], [400, -0.02, 400], [-400, -0.02, 400]], '#7E9A5A');
    poly(c, [[-WALLX - 40, -0.01, -WALLZ - 30], [-WALLX, -0.01, -WALLZ - 30], [-WALLX, -0.01, WALLZ + 30], [-WALLX - 40, -0.01, WALLZ + 30]], '#86A262');
    const bk = [...PALMS.map(palmItem), ...terraceItems(t, cheer, hole), ...roofItems(), ...(board ? [scoreboardItem(score, 0, min, flash)] : [])];
    bk.sort((p, q) => q.d - p.d); for (const it of bk) it.draw(c);
    for (const [a0, a1, ax, s] of [[-WALLX, WALLX, 'z', 1], [-WALLX, WALLX, 'z', -1], [-WALLZ, WALLZ, 'x', 1], [-WALLZ, WALLZ, 'x', -1]]) {
      const P0 = ax === 'z' ? [a0, 0, s * WALLZ] : [s * WALLX, 0, a0], P1 = ax === 'z' ? [a1, 0, s * WALLZ] : [s * WALLX, 0, a1];
      poly(c, [P0, P1, [P1[0], 1.2, P1[2]], [P0[0], 1.2, P0[2]]], '#E8E2D4'); poly(c, [[P0[0], 0.9, P0[2]], [P1[0], 0.9, P1[2]], [P1[0], 1.2, P1[2]], [P0[0], 1.2, P0[2]]], '#1E5AA8'); } };
  if (blur > 0.4) { bg2.setTransform(1, 0, 0, 1, 0, 0); back(bg2); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG2, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF_T, apron: [WALLX, WALLZ] });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t, hit: hitL }), ...goalItems(B, 1, { t, hit }), ...boardItems(B, BOARDS_T), ...(B.E[0] < -53.6 ? [netBack(t, hitL)] : []), ...items]);
}
// the back panel of the goal at -x (the engine's goalItems shape and bulge), drawn again in firmer cord for the shots from
// behind the net, where the engine fades a net that close to a haze
function netBack(t, hit) {
  const gx = -52.5, hw = 3.66, bulge = (y, z) => { if (!hit || t < hit.t0) return 0; const dt = t - hit.t0, r2 = ((y - hit.y) ** 2 + (z - hit.z) ** 2) / 1.1;
    return (hit.k ?? 1) * 0.9 * Math.exp(-r2) * Math.exp(-dt * 2.2) * Math.sin(Math.min(dt * 9, PI / 2 + dt * 6)); };
  const P3 = (u, v) => { const y = lerp(2.36, 0, v), z = lerp(-hw, hw, u); return [gx - lerp(1.1, 2.0, v) - bulge(y, z), y, z]; };
  return { get d() { return depth(...P3(0.5, 0.5)) - 0.02; }, draw: g => { g.save(); g.strokeStyle = 'rgba(246,246,240,0.5)'; g.lineWidth = 2.2; g.lineJoin = 'round';
    for (let i = 0; i <= 30; i++) { g.beginPath(); for (let j = 0; j <= 10; j++) { const q = B.project(...P3(i / 30, j / 10)); j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); } g.stroke(); }
    for (let j = 0; j <= 10; j++) { g.beginPath(); for (let i = 0; i <= 30; i++) { const q = B.project(...P3(i / 30, j / 10)); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); } g.stroke(); }
    g.restore(); } };
}
// ---------- fans standing on the terrace close to the camera (the +z stand, under the roof): their places are fixed
const FROW = r => ({ z: WALLZ + 1.0 + r * 0.95, y: TH0 + 0.15 + r * 0.48 });
const FSPOTS = (() => { const r = rng(1031), out = []; for (let row = 0; row < 5; row++) for (let i = 0; i < 30; i++) out.push({ row, x: -12 + i * 0.8 + (row % 2) * 0.4 + (r() - 0.5) * 0.2, k: Math.floor(r() * FANS.length), ph: r() * 9, m: Math.floor(r() * 6) }); return out; })();
function fanRows(t, cx, span = 7) {
  const items = [{ d: 1e8, draw: g => { for (let r = 4; r >= 0; r--) { const { z, y } = FROW(r), x0 = cx - span - 3, x1 = cx + span + 3;
    poly(g, [[x0, y, z - 0.47], [x1, y, z - 0.47], [x1, y, z + 0.47], [x0, y, z + 0.47]], r % 2 ? '#9C968A' : '#A8A296');
    const y0 = Math.max(TH0 + 0.02, y - 0.48);  // the front step's riser starts at the top of the wall in front of it
    poly(g, [[x0, y0, z - 0.47], [x1, y0, z - 0.47], [x1, y, z - 0.47], [x0, y, z - 0.47]], '#7A756C'); } } }];
  for (const s of FSPOTS) { if (Math.abs(s.x - cx) > span) continue;
    const pose = [{ ...POSE.stand(), ...POSE.handsOnHead() }, SHRUG, SCRATCH, { ...POSE.stand(), ...POSE.point() }, { ...POSE.stand(), sh: [[0.15, 0.12], [0.15, 0.12]], el: [0.3, 0.3] }, SHRUG][s.m];
    const e = [SHOCK, PUZZLED, PUZZLED, EXPR.paranoid, BLANK, PUZZLED][s.m], hd = -PI / 2 + Math.sin(t * 0.7 + s.ph) * 0.35;
    items.push(man(t, FANS[s.k], s.x, FROW(s.row).z, hd, { ...pose, lift: FROW(s.row).y, look: 0.05 }, e, s.ph, { shadow: { r: 0.01 } })); }
  return items;
}
// ---------- the dressing room: a world at x = 1500. Pale green walls, a concrete floor, a bench, and the coach's tactics
// board on the back wall (z = 4); the camera stands behind the bench, looking +z
const RX = 1500;
const TBW = 1300, TBH = 860, TBC = makeCanvas(TBW, TBH), tbg = TBC.getContext('2d');
function tbFace(u = 0, ring = 0) {  // u: how much of the arrow is drawn (0..1); ring: the circle round their own goal (0..1)
  const g = tbg, px = 70, py = 130, pw = TBW - 140, ph = TBH - 200; g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = '#ECEEEA'; g.fillRect(0, 0, TBW, TBH); g.fillStyle = '#2F8A4C'; g.fillRect(px, py, pw, ph);
  g.strokeStyle = '#F4F4F0'; g.lineWidth = 6; g.strokeRect(px, py, pw, ph); g.beginPath(); g.moveTo(px + pw / 2, py); g.lineTo(px + pw / 2, py + ph); g.stroke();
  g.beginPath(); g.arc(px + pw / 2, py + ph / 2, 80, 0, 2 * PI); g.stroke();
  for (const sd of [0, 1]) { const bx = sd ? px + pw - 150 : px; g.strokeRect(bx, py + ph / 2 - 180, 150, 360); }
  g.fillStyle = '#F4F4F0'; g.fillRect(px - 20, py + ph / 2 - 52, 20, 104); g.fillRect(px + pw, py + ph / 2 - 52, 20, 104);
  const mag = (x, y, col) => { g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.arc(x + 4, y + 7, 27, 0, 2 * PI); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 27, 0, 2 * PI); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke(); };
  const Y = [[0.4, 0.5], [0.27, 0.25], [0.27, 0.75], [0.15, 0.38], [0.15, 0.62], [0.44, 0.24], [0.44, 0.76], [0.04, 0.5]];
  for (const [fx, fy] of Y) mag(px + pw * fx, py + ph * fy, SYEL);
  for (const [fx, fy] of Y) mag(px + pw * (1 - fx), py + ph * fy, ABLUE);
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(px + pw / 2, py + ph / 2, 17, 0, 2 * PI); g.fill(); g.strokeStyle = '#222226'; g.lineWidth = 3; g.stroke();
  if (u > 0) { const x0 = px + pw / 2, y0 = py + ph / 2, x1 = px + 30, y1 = py + ph / 2, cx = (x0 + x1) / 2, cy = y0 - 150, N = 48, n = Math.max(1, Math.round(N * u));
    const at = s => [(1 - s) * (1 - s) * x0 + 2 * (1 - s) * s * cx + s * s * x1, (1 - s) * (1 - s) * y0 + 2 * (1 - s) * s * cy + s * s * y1];
    g.strokeStyle = '#D8231E'; g.lineWidth = 15; g.beginPath(); g.moveTo(x0, y0); for (let i = 1; i <= n; i++) g.lineTo(...at(i / N)); g.stroke();
    if (u >= 1) { const [ax, ay] = at(1), [bx, by] = at(0.96), an = Math.atan2(ay - by, ax - bx);
      g.beginPath(); g.moveTo(ax - Math.cos(an - 0.5) * 60, ay - Math.sin(an - 0.5) * 60); g.lineTo(ax, ay); g.lineTo(ax - Math.cos(an + 0.5) * 60, ay - Math.sin(an + 0.5) * 60); g.stroke(); } }
  if (ring > 0) { g.strokeStyle = '#D8231E'; g.lineWidth = 12; g.beginPath(); g.ellipse(px + 18, py + ph / 2, 105, 150, 0, -PI / 2, -PI / 2 + 2 * PI * ring); g.stroke(); }
  g.fillStyle = '#1A1B1F'; g.font = sans(56, 800); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('SOE', px, 72); g.textAlign = 'right'; g.fillText('AS ADEMA', px + pw, 72);
  g.restore(); return TBC;
}
const BOARD_Q = [[RX - 1.35, 0.95, 3.98], [RX + 1.35, 0.95, 3.98], [RX + 1.35, 2.75, 3.98], [RX - 1.35, 2.75, 3.98]];
function dressingRoom(g, t, items, { u = 0, ring = 0, shirts = false } = {}) {
  g.fillStyle = '#20231F'; g.fillRect(0, 0, W, H);
  poly(g, [[RX - 9, 0, 4], [RX + 9, 0, 4], [RX + 9, 3.3, 4], [RX - 9, 3.3, 4]], '#C4CDBB');  // the back wall, pale green
  poly(g, [[RX - 9, 0, 3.99], [RX + 9, 0, 3.99], [RX + 9, 0.9, 3.99], [RX - 9, 0.9, 3.99]], '#9AAB9E');  // its tiled skirting
  for (const sd of [-1, 1]) poly(g, [[RX + sd * 6, 0, -8], [RX + sd * 6, 0, 4], [RX + sd * 6, 3.3, 4], [RX + sd * 6, 3.3, -8]], sd < 0 ? '#AEB8A6' : '#B6C0AE');
  poly(g, [[RX - 9, 0, -8], [RX + 9, 0, -8], [RX + 9, 0, 4], [RX - 9, 0, 4]], '#6C6E70');  // the floor
  poly(g, [[RX - 9, 3.3, -8], [RX + 9, 3.3, -8], [RX + 9, 3.3, 4], [RX - 9, 3.3, 4]], '#D6DACF');  // the ceiling, a strip light on it
  poly(g, [[RX - 9, 0, -3.2], [RX + 9, 0, -3.2], [RX + 9, 3.3, -3.2], [RX - 9, 3.3, -3.2]], '#BCC6B2');  // the wall with the door (behind the camera in most shots)
  poly(g, [[RX - 9, 0, -3.19], [RX + 9, 0, -3.19], [RX + 9, 0.9, -3.19], [RX - 9, 0.9, -3.19]], '#9AAB9E');
  poly(g, [[RX - 3.7, 0, -3.18], [RX - 2.7, 0, -3.18], [RX - 2.7, 2.1, -3.18], [RX - 3.7, 2.1, -3.18]], '#7A5A3C');
  for (let i = 0; i < 6; i++) { const x = RX - 1.2 + i * 1.1;  // more shirts on hooks
    poly(g, [[x - 0.03, 2.95, -3.17], [x + 0.03, 2.95, -3.17], [x + 0.03, 3.05, -3.17], [x - 0.03, 3.05, -3.17]], '#55585E');
    poly(g, [[x + 0.32, 2.95, -3.16], [x - 0.32, 2.95, -3.16], [x - 0.26, 2.15, -3.16], [x + 0.26, 2.15, -3.16]], i % 2 ? SYEL : SYELD); }
  poly(g, [[RX - 1.8, 3.29, 0.9], [RX + 1.8, 3.29, 0.9], [RX + 1.8, 3.29, 1.25], [RX - 1.8, 3.29, 1.25]], '#FAFBF4');
  for (let i = 0; i < 9; i++) { const x = RX - 5.6 + i * 1.4;  // hooks along the back wall, a yellow shirt on each
    poly(g, [[x - 0.03, 2.95, 3.97], [x + 0.03, 2.95, 3.97], [x + 0.03, 3.05, 3.97], [x - 0.03, 3.05, 3.97]], '#55585E');
    if (shirts || Math.abs(x - RX) > 1.6) { const sh = [[x - 0.32, 2.95, 3.96], [x + 0.32, 2.95, 3.96], [x + 0.26, 2.15, 3.96], [x - 0.26, 2.15, 3.96]]; poly(g, sh, i % 2 ? SYEL : SYELD); } }
  poly(g, [[RX - 1.45, 0.85, 3.985], [RX + 1.45, 0.85, 3.985], [RX + 1.45, 2.85, 3.985], [RX - 1.45, 2.85, 3.985]], '#9A9EA4');  // the board's frame
  texQuadW(g, B, tbFace(u, ring), ...BOARD_Q, [0, TBH, TBW, 0], { live: true });
  // the bench, solid, with a solid back like a pew: its front, its ends and its seat go under the people; its low back (z = 0.55,
  // up to 0.62 m) is sorted with them, so seen from behind it hides the legs and the lower backs of the men sitting on it (the
  // author, 15 Nov 2026: their legs showed through the bench), and seen from in front it stands behind them
  poly(g, [[RX - 3.4, 0, 1.05], [RX + 3.4, 0, 1.05], [RX + 3.4, 0.43, 1.05], [RX - 3.4, 0.43, 1.05]], '#5E4430');
  for (const sd of [-1, 1]) poly(g, [[RX + sd * 3.4, 0, 0.55], [RX + sd * 3.4, 0, 1.05], [RX + sd * 3.4, 0.43, 1.05], [RX + sd * 3.4, 0.43, 0.55]], '#6A4C34');
  poly(g, [[RX - 3.4, 0.43, 0.55], [RX + 3.4, 0.43, 0.55], [RX + 3.4, 0.43, 1.05], [RX - 3.4, 0.43, 1.05]], '#7A5A3C');
  for (const it of items) it.shadow?.(g);
  const near = { get d() { return depth(RX, 0.31, 0.55); }, draw: gg => {
    poly(gg, [[RX - 3.4, 0, 0.55], [RX + 3.4, 0, 0.55], [RX + 3.4, 0.62, 0.55], [RX - 3.4, 0.62, 0.55]], '#6A4C34');
    poly(gg, [[RX - 3.4, 0.62, 0.55], [RX + 3.4, 0.62, 0.55], [RX + 3.4, 0.62, 0.49], [RX - 3.4, 0.62, 0.49]], '#8A6A4A');  // the top of the back
    poly(gg, [[RX - 3.4, 0.57, 0.549], [RX + 3.4, 0.57, 0.549], [RX + 3.4, 0.62, 0.549], [RX - 3.4, 0.62, 0.549]], '#7E5E40');
    for (const sd of [-1, 1]) poly(gg, [[RX + sd * 3.4, 0.43, 0.55], [RX + sd * 3.4, 0.62, 0.55], [RX + sd * 3.4, 0.62, 0.49], [RX + sd * 3.4, 0.43, 0.49]], '#5E4430'); } };
  drawSorted(g, [near, ...items]);
}
// ---------- outside the ground: the ticket booth in the outer wall, a world at x = -1500 (the wall at z = 5, the window in
// it; the clerk behind it, drawn first, then the wall round the opening)
const BX = -1500;
const SIGN_T = makeCanvas(900, 200); { const s = SIGN_T.getContext('2d'); s.fillStyle = '#1E5AA8'; s.fillRect(0, 0, 900, 200); s.fillStyle = '#FFFFFF'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.font = sans(120, 900); s.fillText('TICKETS', 450, 106); }
function ticketBooth(g, t, items, { clerk = null } = {}) {
  sky(g, B, { t, ...SKY_T });
  for (const p of PALMS.slice(0, 8)) palmItem({ ...p, x: BX - 18 + (p.seed % 8) * 5.5, z: 14 + (p.seed % 3) * 4 }).draw(g);
  poly(g, [[BX - 60, 0, -30], [BX + 60, 0, -30], [BX + 60, 0, 30], [BX - 60, 0, 30]], '#A49C8C');  // the street, dusty
  poly(g, [[BX - 30, 0.02, 1], [BX + 30, 0.02, 1], [BX + 30, 0.02, 5], [BX - 30, 0.02, 5]], '#B8B0A0');  // the pavement
  poly(g, [[BX - 0.75, 0.9, 5.7], [BX + 0.75, 0.9, 5.7], [BX + 0.75, 2.2, 5.7], [BX - 0.75, 2.2, 5.7]], '#2E2A26');  // inside the booth
  if (clerk) drawSorted(g, [clerk]);
  const wall = '#D8CCB2', o = [BX - 0.75, BX + 0.75, 1.0, 2.1];
  poly(g, [[BX - 30, 0, 5], [o[0], 0, 5], [o[0], 7, 5], [BX - 30, 7, 5]], wall); poly(g, [[o[1], 0, 5], [BX + 30, 0, 5], [BX + 30, 7, 5], [o[1], 7, 5]], wall);
  poly(g, [[o[0], 0, 5], [o[1], 0, 5], [o[1], o[2], 5], [o[0], o[2], 5]], wall); poly(g, [[o[0], o[3], 5], [o[1], o[3], 5], [o[1], 7, 5], [o[0], 7, 5]], wall);
  poly(g, [[BX - 30, 0, 4.99], [BX + 30, 0, 4.99], [BX + 30, 0.7, 4.99], [BX - 30, 0.7, 4.99]], '#B8A88C');  // a darker band at the foot
  poly(g, [[BX - 30, 6.4, 4.98], [BX + 30, 6.4, 4.98], [BX + 30, 7.0, 4.98], [BX - 30, 7.0, 4.98]], SYEL);  // and a painted band at the top
  for (let i = 0; i <= 6; i++) { const x = o[0] + (o[1] - o[0]) * i / 6; poly(g, [[x - 0.015, o[2], 4.97], [x + 0.015, o[2], 4.97], [x + 0.015, o[3], 4.97], [x - 0.015, o[3], 4.97]], '#3A3C40'); }  // bars
  poly(g, [[o[0] - 0.1, o[2] - 0.08, 4.96], [o[1] + 0.1, o[2] - 0.08, 4.96], [o[1] + 0.1, o[2], 4.96], [o[0] - 0.1, o[2], 4.96]], '#8A7E68');  // the counter
  quadImg(g, SIGN_T, [BX - 0.9, 2.85, 4.97], [BX + 0.9, 2.85, 4.97], [BX - 0.9, 2.45, 4.97]);
  for (const it of items) it.shadow?.(g);
  drawSorted(g, items);
}
// a ticket in a raised hand (the hand of arm i)
function ticketItem(it, i = 1) {
  return { get d() { return it.d - 0.03; }, draw: g => { const sk = it.sk; if (!sk) return; const h = B.project(...sk.arms[i].hand); if (h.z < 0.3) return;
    const w = 0.15 * h.s, hh = 0.075 * h.s; g.save(); g.translate(h.x, h.y - hh * 0.6); g.rotate(-0.25);
    g.fillStyle = '#F6F2E4'; g.fillRect(-w / 2, -hh / 2, w, hh); g.fillStyle = '#C8302C'; g.fillRect(w * 0.18, -hh / 2, w * 0.06, hh); g.restore(); } };
}
// a speech bubble with words in it, beside a head (p: the head's projection)
function sayBubble(g, p, txt, a, k = 1, D = 150) {
  if (a <= 0 || p.z < 0.3) return;
  g.save(); g.globalAlpha *= a; g.translate(p.x, p.y); g.scale(k, k);
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#141018'; g.lineWidth = 10; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(D - 210, -230); g.quadraticCurveTo(D - 230, -340, D - 60, -345); g.quadraticCurveTo(D + 120, -360, D + 210, -300); g.quadraticCurveTo(D + 250, -225, D + 120, -200);
  g.lineTo(D - 20, -197); g.lineTo(0, -120); g.lineTo(D - 80, -196); g.quadraticCurveTo(D - 200, -185, D - 210, -230); g.closePath(); g.stroke(); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; ink(g, txt, D, -272, sans(70, 900), '#E2201E', 10, '#141018');
  g.restore();
  qaRect(g, p.x + (D - 230) * k, p.y - 360 * k, 480 * k, 240 * k, 'text', 'speech bubble');
}
// a gold cup with two handles and ribbons (a cup in general, not the real trophy); (x, y): the middle of its foot, s: height
function goldCup(g, x, y, s, rib = SYEL, rib2 = '#F4F4F2', a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  const gold = g.createLinearGradient(-s * 0.3, 0, s * 0.3, 0); gold.addColorStop(0, '#9C7420'); gold.addColorStop(0.35, '#F7DC7A'); gold.addColorStop(0.6, '#E2B640'); gold.addColorStop(1, '#8A6418');
  for (const sd of [-1, 1]) for (const [dx, col] of [[0, rib], [0.05, rib2]]) { g.fillStyle = col; g.beginPath(); g.moveTo(sd * s * (0.3 + dx), -s * 0.72);
    g.quadraticCurveTo(sd * s * (0.48 + dx), -s * 0.45, sd * s * (0.4 + dx), -s * 0.12); g.lineTo(sd * s * (0.34 + dx), -s * 0.14); g.quadraticCurveTo(sd * s * (0.4 + dx), -s * 0.45, sd * s * (0.25 + dx), -s * 0.7); g.closePath(); g.fill(); }
  g.strokeStyle = gold; g.lineWidth = s * 0.045; g.lineCap = 'round';
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * s * 0.27, -s * 0.86); g.bezierCurveTo(sd * s * 0.5, -s * 0.86, sd * s * 0.5, -s * 0.55, sd * s * 0.18, -s * 0.52); g.stroke(); }
  g.fillStyle = gold; g.beginPath(); g.moveTo(-s * 0.3, -s * 0.95); g.lineTo(s * 0.3, -s * 0.95); g.quadraticCurveTo(s * 0.28, -s * 0.5, s * 0.06, -s * 0.38); g.lineTo(-s * 0.06, -s * 0.38); g.quadraticCurveTo(-s * 0.28, -s * 0.5, -s * 0.3, -s * 0.95); g.fill();
  g.fillRect(-s * 0.045, -s * 0.38, s * 0.09, s * 0.2); g.beginPath(); g.moveTo(-s * 0.2, 0); g.lineTo(s * 0.2, 0); g.lineTo(s * 0.13, -s * 0.18); g.lineTo(-s * 0.13, -s * 0.18); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-s * 0.13, -s * 0.72, s * 0.03, s * 0.16, -0.15, 0, 2 * PI); g.fill();
  g.restore();
}
// a stopwatch: the hand at angle ang (0: up, clockwise), the time and a line under it
function stopwatch(g, cx, cy, r, ang, txt, sub, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.lineCap = 'round';
  g.fillStyle = '#16171B'; g.fillRect(cx - r * 0.14, cy - r * 1.28, r * 0.28, r * 0.22); g.beginPath(); g.arc(cx, cy - r * 1.3, r * 0.12, 0, 2 * PI); g.fill();
  g.fillStyle = '#F6F3EA'; g.strokeStyle = '#16171B'; g.lineWidth = r * 0.09; g.beginPath(); g.arc(cx, cy, r, 0, 2 * PI); g.fill(); g.stroke();
  for (let i = 0; i < 60; i++) { const q = i / 60 * 2 * PI, l = i % 5 ? 0.07 : 0.15; g.strokeStyle = '#16171B'; g.lineWidth = i % 5 ? 3 : 6;
    g.beginPath(); g.moveTo(cx + Math.sin(q) * r * 0.86, cy - Math.cos(q) * r * 0.86); g.lineTo(cx + Math.sin(q) * r * (0.86 - l), cy - Math.cos(q) * r * (0.86 - l)); g.stroke(); }
  g.strokeStyle = '#D8231E'; g.lineWidth = r * 0.05; g.beginPath(); g.moveTo(cx - Math.sin(ang) * r * 0.15, cy + Math.cos(ang) * r * 0.15); g.lineTo(cx + Math.sin(ang) * r * 0.78, cy - Math.cos(ang) * r * 0.78); g.stroke();
  g.fillStyle = '#16171B'; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, 2 * PI); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; ink(g, txt, cx, cy + r + 110, sans(130, 900), GOLD, 18); if (sub) ink(g, sub, cx, cy + r + 215, sans(54, 900), '#FFFFFF', 12);
  g.restore(); qaRect(g, cx - r * 1.1, cy - r * 1.45, r * 2.2, r * 2.45 + 260, 'text', 'stopwatch');
}
// ================================================================== the film
// One take (rule 70), its shots on the grammar of cantona1995 (rule 73): a moving shot for almost every sentence, a hook that
// runs ahead and rewinds, the key action in slow motion, numbers and verdicts as objects, an epilogue on their backs.
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain, ...o });
  let panN = 0;
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: DAY_G, trans: 'pan', panDir: panN++ % 2 ? -1 : 1, transDur: 0.3, noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player', 'head out of frame'];
  const pinT = (t, t0) => (t > t0 ? pin(t, t0) : null);
  const plateAt = (g, t, t0, txt, y, o = {}) => { const p = pinT(t, t0); if (p) plate(g, txt, W / 2, y, { color: CREAM, size: 40, ...o, ...p }); };

  // the times, from the narration
  const tThe = wn('hook', 'The') - 0.1, tAndH = wn('hook', 'And') - 0.1, tOwnGoal = wn('hook', 'goal.', 1);
  const cChamps = s('champs') - 0.1, cBut = wn('champs', 'But') - 0.1, cPen = wn('champs', 'a') - 0.1, tPenalty = wn('champs', 'penalty');
  const cTitle = wn('champs', 'handed') - 0.1, tAdema = wn('champs', 'Adema.');
  const cLast = wn('plan', 'So') - 0.1, cCoach = wn('plan', 'their') - 0.1, cEvery = wn('plan', 'every') - 0.1, cWould = wn('plan', 'they') - 0.1, tNet = wn('plan', 'net.');
  const cKick = wn('goals', 'Kick-off.') - 0.1, cTurn = wn('goals', 'They') - 0.1, cShoot = wn('goals', 'and') - 0.1, g1 = wn('goals', 'goal.');
  const tAgain = wn('goals', 'Again.'), cAgain = tAgain - 0.34, tAgain2 = wn('goals', 'again.', 1), cAgain2 = wn('goals', 'And', 1) - 0.2;
  const cEvery36 = wn('goals', 'One') - 0.1;
  const cWatch = wn('watch', 'AS') - 0.1, cClimb = wn('watch', 'as', 1) - 0.1, t50 = wn('watch', '50.'), t100 = wn('watch', '100.'), t149 = wn('watch', '149.');
  const cStands = wn('fans', 'In') - 0.1, cBooth = wn('fans', 'fans') - 0.1, cMoney = wn('fans', 'and') - 0.1, tMoney = wn('fans', 'money');
  const cBan = wn('after', 'The') - 0.1, tThree = wn('after', 'three'), cSusp = wn('after', 'and') - 0.1, tSusp = wn('after', 'suspended');
  const cEpi = wn('after', 'And', 1) - 0.1, cRecord = wn('after', 'is') - 0.1, tWorld = wn('after', 'world');
  const tvOff = T.duration - 1.05;

  // ---------- the score. AS Adema kicked off the match; every kick-off after SOE's first own goal was SOE's, so the one
  // shown comes with 1–0 on the board. The goals shown land on the words; then the count runs on to 149
  const g2 = tAgain + 0.36, g3 = tAgain2 + 0.32, LAP = 0.42, tLaps = cEvery36 + 0.3;
  const SK = [[cKick - 0.01, 1], [g1 - 0.001, 1], [g1, 2], [g2 - 0.001, 2], [g2, 3], [g3 - 0.001, 3], [g3, 4], [tLaps, 4], [cWatch, 4 + Math.floor((cWatch - tLaps) / LAP)], [t50 - 0.45, 46], [t50, 50], [t100 - 0.55, 50], [t100, 100], [t149 - 0.55, 100], [t149, 149]];
  const scoreAt = t => { if (t < SK[0][0]) return 1; for (let i = 1; i < SK.length; i++) if (t < SK[i][0]) { const [a, sa] = SK[i - 1], [b, sb] = SK[i]; return Math.floor(sa + (sb - sa) * (t - a) / (b - a)); } return 149; };
  const minAt = t => Math.max(1, Math.min(90, Math.round(scoreAt(t) * 90 / 149)));
  const bug = (g, t) => scoreBug(g, 'ADM', 'SOE', scoreAt(t), 0, `${minAt(t)}'`, { al: clamp((t - cKick - 0.2) / 0.25), colL: ABLUE, colR: SYEL, w: 430, pop: [g1, g2, g3, t50, t100, t149].some(x => t > x && t < x + 0.25) ? 1 : 0 });
  const flashAt = t => ([t50, t100, t149].some(x => t > x && t < x + 0.14) ? 1 : 0);

  // ---------- people on the pitch
  const SPOT = [-41.5, 0], GL = [-52.5, 0];  // SOE defend the goal at x = -52.5
  const keeperAside = (t, x = -51.3, z = 4.7, hd = 0.15) => man(t, SOE_GK, x, z, hd, { ...POSE.stand(), ...HIPS }, BLANK, 3);
  const shooter = (t, pl, x, z, hd, tk, e = GRIM) => { const u = (t - tk + 0.3) / 0.6;
    if (u <= 0 || u >= 1) return man(t, pl, x, z, hd, u >= 1 ? { lean: -0.04 } : { lean: 0.06 }, e, 0);
    return P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...POSE.kick(u, 'R') }, e, t })); };
  const shotPath = (tk, from, dur, to = [-53.3, 0.95, 0.6], pre = null) => new BallPath([pre ? { t0: pre.t0, t1: tk, kind: 'roll', from: pre.from, to: from, decay: 3 } : { t0: tk - 9, t1: tk, kind: 'hold', from }, { t0: tk, t1: tk + dur, kind: 'air', from, to, g: 4 },
    { t0: tk + dur, t1: tk + dur + 0.5, kind: 'roll', from: [to[0], BALL_R, to[2]], to: [to[0] - 0.6, BALL_R, to[2] + 0.2], decay: 3 }, { t0: tk + dur + 0.5, t1: 99, kind: 'hold', from: [to[0] - 0.6, BALL_R, to[2] + 0.2] }]);
  const ADE_SPOTS = [[-12, -14], [-10, -6], [-13, 2], [-9, 9], [-15, 15], [-6, -1], [-17, -9], [-7, 13], [-19, 6], [-14, -19]];
  const ademaWatching = (t, dx = 0) => ADE_SPOTS.map(([x, z], i) => man(t, ADE[i], x + dx, z, PI + Math.atan2(-z * 0.04, 1) + (i % 3 - 1) * 0.15, i % 3 ? { ...HIPS } : {}, [BLANK, PUZZLED, EXPR.smug][i % 3], i));
  const soeAround = (t, skip = -1) => [[-35, -8], [-40, 9], [-33, 14], [-25, -12], [-44, -3], [-29, 6]].map(([x, z], i) => i === skip ? null : man(t, SOE[(i + 2) % 10], x, z, Math.atan2(-z, -52.5 - x), i % 2 ? { ...HIPS } : {}, 'focus', i)).filter(Boolean);  // waiting their turn

  // ======================= THE HOOK: the end of the match, run ahead =======================
  // "149–0.": the scoreboard at the end of the match; the score as the title
  shot(0, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp(tt / tThe)); return lookFrom([44 + 3 * v, 8.6 + 0.5 * v, 6 - 2.5 * v], [73, 12.1, 0], { fov: lerp(1450, 1650, v), cy: H * 0.56 }); }, { shake: 0.2 });
    ground(g, t, [], { score: 149, min: 90, blur: 0, cheer: 0.2 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => title2(g, "AS ADEMA v SO L'EMYRNE", '149–0', 200, { c2: SYEL, s1: 58, s2: 170, a: fadeOut(t, tThe - 0.12, 0.12), k: 1 + 0.06 * Math.exp(-Math.max(0, t - 0.05) * 6) }) });
  cue(0, 'boom_cine', 0.4); cue(0.25, 'crowd_roar', 0.22);
  // "The craziest scoreline in football.": the pitch from above: yellow shirts round their own goal, blue shirts standing
  const watchers = (t, pts, off = 0) => pts.map(([x, z], i) => man(t, ADE[(i + off) % 10], x, z, Math.atan2(0.5 - z, -52.5 - x), i % 2 ? { ...HIPS } : {}, i % 2 ? PUZZLED : BLANK, i));
  const S2 = [-33.0, 7.0], S2H = Math.atan2(0.6 - S2[1], -53.3 - S2[0]), S2B = [S2[0] + 0.5 * Math.cos(S2H), BALL_R, S2[1] + 0.5 * Math.sin(S2H)];
  shot(tThe, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - tThe) / (tAndH - tThe))); return lookFrom([-24 - 1.5 * v, 7.5 - 0.8 * v, 10.5 - v], [-46, 0.5, 1.5], { fov: 1450, cy: H * 0.5 }); }, { shake: 0.15 });
    const bp = shotPath(tThe + 1.0, S2B, 1.0);
    ground(g, t, [...soeAround(t, 5), shooter(t, SOE[0], ...S2, S2H, tThe + 1.0), ballOf(bp, t), keeperAside(t), ...watchers(t, [[-36.0, 2.9], [-40.8, 6.8]], 3), man(t, REF, -26, 4, PI + 0.2, {}, BLANK, 1)],
      { score: t > tThe + 2.0 ? 148 : 147, min: 90, cheer: 0.3, blur: 1.5, hitL: { t0: tThe + 2.0, y: 0.95, z: 0.6, k: 1 } });
  }, { qaAllow: CROWDED, mbStep: 3, mbMax: 10 });
  cue(tThe, 'whoosh_soft', 0.2); cue(tThe + 1.0, 'kick', 0.4); cue(tThe + 1.9, 'net', 0.45);
  // "And every goal was an own goal.": the own goal, run ahead and slowed: from behind their net, the ball coming at it; it
  // stops a moment before it goes in (the board behind still at 148), and the picture tears back to the beginning
  const kw = warp([[tAndH - 0.6, 4.95], [tAndH, 5.25], [tAndH + 0.4, 5.55], [tOwnGoal + 0.2, 6.25], [cChamps - 0.3, 6.33], [cChamps + 0.4, 6.335]]);
  const hookBall = shotPath(5.55, [-43.7, BALL_R, 1.15], 0.95, [-53.3, 1.05, 0.5]);
  shot(tAndH, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - tAndH) / (cChamps - tAndH))); return lookFrom([-55.9 + 0.2 * v, 1.05, 1.3 - 0.3 * v], [-42, 1.0, 0.6], { fov: lerp(1800, 2050, v), cy: H * 0.5 }); }, { shake: 0.25 });
    const k = kw(t);
    ground(g, t, [shooter(k, SOE[1], -43.2, 1.25, PI, 5.55), ballOf(hookBall, k), keeperAside(t, -49.4, 2.7, 0.1), man(t, SOE[4], -37.2, -3.4, PI - 0.4, {}, GRIM, 2), man(t, SOE[6], -36.2, 4.6, PI + 0.5, {}, GRIM, 3),
      ...watchers(t, [[-29.5, -5.5], [-27.6, 2.4], [-31.2, 7.4]]), man(t, REF, -30.4, -1.4, PI, {}, BLANK, 1)],
      { score: 148, min: 90, cheer: 0.3, blur: 1.2 });
  }, { qaAllow: CROWDED, mbStep: 3, mbMax: 12, post: (g, lt, t) => glitch(g, clamp((t - cChamps + 0.4) / 0.4), Math.floor(t * 30)) });
  cue(tAndH, 'whoosh_fast', 0.22); cue(tAndH + 0.4, 'kick', 0.5); cue(tAndH + 0.5, 'heartbeat', 0.5); cue(cChamps - 0.4, 'record_scratch', 0.45);

  // ======================= THE TITLE THAT GOT AWAY =======================
  // "Stade Olympique de l'Emyrne were the defending champions.": the 2001 champions with their cup, a team photograph
  const TEAM = [-4.2, -3.15, -2.1, -1.05, 0, 1.05, 2.1, 3.15, 4.2].map(x => x - 14), CUPHOLD = { sh: [[0.35, 0.22], [0.35, 0.22]], el: [1.15, 1.15] };
  shot(cChamps, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cChamps) / (cBut - cChamps))); return lookFrom([-15.6 + 2.2 * v, 1.5, -4.0 + 0.3 * v], [-14.5 + 0.8 * v, 1.2, 2.1], { fov: 1450, cy: H * 0.56 }); }, { shake: 0.15 });
    const team = TEAM.map((x, i) => man(t, i === 4 ? SOE[3] : SOE[(i + 5) % 10], x, 2 + (i % 2) * 0.12, -PI / 2, i === 4 ? { ...POSE.stand(), ...CUPHOLD } : { ...HIPS }, i % 3 ? EXPR.smug : 'happy', i));
    ground(g, t, team, { score: 0, board: false, cheer: 0.2, blur: 5 });
    const cap = skeleton(SOE[3], team[4].st), a = B.project(...cap.arms[0].hand), b = B.project(...cap.arms[1].hand);
    goldCup(g, (a.x + b.x) / 2, (a.y + b.y) / 2 + 0.1 * a.s, 0.44 * a.s, SYEL, INK);
    if (t > cChamps + 0.55 && t < cChamps + 0.85) { g.fillStyle = `rgba(255,255,255,${(0.75 * (1 - (t - cChamps - 0.55) / 0.3)).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, cChamps + 0.15, "STADE OLYMPIQUE DE L'EMYRNE", 300, { size: 40, sub: 'CHAMPIONS OF MADAGASCAR, 2001' }) });
  cue(cChamps, 'whoosh_deep', 0.22); cue(cChamps + 0.55, 'camera', 0.5);
  // "But in their previous match,": SOE against DSA Antananarivo; a challenge in the box, the forward goes down
  const fwd = new Mover([[cBut - 0.6, -33, 3.2], [cBut + 0.85, -43.6, 1.3, { stop: true }], [99, -43.6, 1.3]], { heading0: PI });
  const dfn = new Mover([[cBut - 0.6, -40, -2.5], [cBut + 0.8, -43.8, 0.55, { stop: true }], [99, -43.8, 0.55]], { heading0: PI / 2 });
  const fwdAt = t => { const ms = moving(fwd, t, { e: 'focus', t }), down = smooth(clamp((t - cBut - 0.75) / 0.45));
    if (down <= 0) return P(DSA[0], ms); return P(DSA[0], onGrass(DSA[0], { ...grounded(DSA[0], ms), pose: blend(grounded(DSA[0], ms).pose, { ...POSE.sit(), look: -0.1 }, down), e: down > 0.5 ? HURT : 'shock', shadow: { r: lerp(0.36, 0.7, down) } }, down > 0.9)); };
  shot(cBut, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cBut) / (cPen - cBut))); return lookFrom([-39.2 - 1.0 * v, 1.4, 5.9 - 0.4 * v], [-43.6, 0.95, 1.2], { fov: 1500, cy: H * 0.55 }); }, { shake: 0.3 });
    ground(g, t, [fwdAt(t), P(SOE[4], moving(dfn, t, { e: GRIM, t })), BALL([-44.6 - Math.max(0, t - cBut - 0.8) * 1.2, BALL_R, 1.1]), man(t, SOE_GK, -51.5, 0.4, 0, { ...SET }, 'focus', 2), jog(t, cBut, DSA[1], -36, -6, -1.5, 0.6, 1, 'focus')],
      { score: 0, board: false, cheer: 0.6, blur: 3 });
  }, { qaAllow: CROWDED, mbStep: 3, mbMax: 10, hud: (g, lt, t) => plateAt(g, t, cBut + 0.1, 'THE PREVIOUS MATCH', 300, { size: 40, sub: 'SOE v DSA ANTANANARIVO' }) });
  cue(cBut, 'whoosh_soft', 0.2); cue(cBut + 0.8, 'thud', 0.45);
  // "a late, disputed penalty": the referee points to the spot; the yellow shirts round him, protesting
  const REFP = [-40.4, 3.6], RHC = Math.atan2(0.1 - REFP[1], -44.7 - REFP[0]), REFPOINT = { ...POSE.stand(), sh: [[0.35, 1.15], [0.1, 0.12]], el: [0.08, 0.3], point: [true, false], lean: 0.05 };
  shot(cPen, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cPen) / (cTitle - cPen))); return lookFrom([-44.9 + 0.4 * v, 1.6, 0.3 - 0.4 * v], [-40.4, 1.3, 3.6], { fov: lerp(1300, 1420, v), cy: H * 0.56 }); }, { shake: 0.3 });
    const up = smooth(clamp((t - cPen - 0.1) / 0.35)), ref = man(t, REF, ...REFP, RHC, blend(POSE.stand(), REFPOINT, up), 'angry', 0);
    const pro = [[-41.2, 5.0], [-40.77, 4.47], [-39.63, 3.07], [-39.2, 2.54]].map(([x, z], i) => man(t, SOE[(i + 4) % 10], x, z, Math.atan2(REFP[1] - z, REFP[0] - x), { ...POSE.stand(), ...POSE.protest(t + i) }, SHOUT, i));
    ground(g, t, [ref, ...pro, BALL([SPOT[0], BALL_R, SPOT[1]])], { score: 0, board: false, cheer: 0.9, blur: 3 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tPenalty - 0.05) stamp(g, 'PENALTY', W / 2, 420, lt, tPenalty - 0.05 - cPen, { color: RED, size: 130, rot: -0.06 }); } });
  cue(cPen + 0.05, 'whistle', 0.55); cue(cPen + 0.4, 'crowd_protest', 0.6); cue(tPenalty - 0.05, 'stamp', 0.5);
  // "handed the title to AS Adema.": the cup's ribbons go from yellow to blue
  shot(cTitle, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cTitle) / (cLast - cTitle))); return lookFrom([-6 + 8 * v, 6, -30], [0, 4, 40], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.1 });
    ground(g, t, [], { score: 0, board: false, cheer: 0, blur: 9 });
    g.fillStyle = 'rgba(8,12,20,0.45)'; g.fillRect(0, 0, W, H);
    const sw = smooth(clamp((t - cTitle - 0.75) / 0.6)), v = clamp((t - cTitle) / (cLast - cTitle)), sz = 640 * (1 + 0.05 * v), y = 1180 - 20 * v;
    goldCup(g, W / 2, y, sz, SYEL, INK, 1 - sw); if (sw > 0) goldCup(g, W / 2, y, sz, ABLUE, '#F4F4F2', sw);
  }, { trans: 'push', hud: (g, lt, t) => { if (t > tAdema - 0.05) stamp(g, 'AS ADEMA · CHAMPIONS', W / 2, 420, lt, tAdema - 0.05 - cTitle, { color: ABLUE, size: 62, rot: -0.04 }); } });
  cue(cTitle, 'whoosh_deep', 0.22); cue(cTitle + 0.8, 'reveal_bell', 0.35); cue(tAdema - 0.05, 'stamp', 0.5);

  // ======================= THE PLAN =======================
  // "So for the last game, against Adema,": the line-up at Toamasina, the two teams side by side
  shot(cLast, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cLast) / (cCoach - cLast))); return lookFrom([3.0 - 3.5 * v, 1.55, -6.2], [1.0 - 3.5 * v, 1.3, 0], { fov: 1500, cy: H * 0.56 }); }, { shake: 0.15 });
    const line = [...ADE.slice(0, 8).map((pl, i) => man(t, pl, -10.4 + i * 1.1, 0, -PI / 2, {}, BLANK, i)), man(t, REF, -0.6, 0.1, -PI / 2, {}, 'focus', 1),
      ...SOE.slice(0, 8).map((pl, i) => man(t, pl, 1.1 + i * 1.1, 0, -PI / 2, {}, GRIM, i + 3))];
    ground(g, t, line, { score: 0, min: 0, cheer: 0.5, blur: 4 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => plateAt(g, t, cLast + 0.15, 'TOAMASINA · 31 OCTOBER 2002', 300, { size: 40, sub: "THE LAST MATCH · AS ADEMA v SO L'EMYRNE" }) });
  cue(cLast, 'whoosh_soft', 0.2); cue(cLast + 0.1, 'crowd_roar', 0.3);
  // "their coach planned a protest:": in the dressing room, the players on the bench, the coach at his tactics board
  const SEATED_REST = { ...SEATED, sh: [[0.5, 0.2], [0.5, 0.2]], el: [0.6, 0.6] };  // seen from behind: the hands resting on the thighs, none by the head
  const benchSOE = (t, face = PI / 2, e = 'focus', down = 0, gap = 1.2, pose = SEATED_REST) => [-2, -1, 0, 1, 2].map((k, i) => P(SOE[i], grounded(SOE[i], { x: RX + k * gap, z: 0.8, head: face, pose: { ...pose, look: -0.55 * down }, e, t: t + i })));
  const coachAt = (t, pose, e = GRIM, x = RX + 1.75, z = 2.9, hd = -PI / 2 - 0.8) => man(t, COACH, x, z, hd, pose, e, 0);
  const arrowU = t => clamp((t - cEvery - 0.55) / (cWould + 0.35 - cEvery - 0.55)), ringU = t => clamp((t - tNet + 0.35) / 0.5);
  shot(cCoach, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cCoach) / (cEvery - cCoach))); return lookFrom([RX + 0.5 - 0.3 * v, 1.5, -2.6 + 0.8 * v], [RX + 0.3, 1.55, 3.5], { fov: lerp(1300, 1420, v), cy: H * 0.5 }); }, { shake: 0.15 });
    dressingRoom(g, t, [...benchSOE(t), coachAt(t, POINTING)], { u: 0 });
  }, { trans: 'push', qaAllow: CROWDED });
  cue(cCoach, 'whoosh_deep', 0.22); cue(cCoach + 0.1, 'door_slam', 0.25);
  // "every time his players got the ball,": the board: the ball at the centre spot, the red marker starts back from it
  shot(cEvery, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cEvery) / (cWould - cEvery))); return lookFrom([RX - 0.15, 1.85, 1.15 + 0.35 * v], [RX - 0.1, 1.85, 4], { fov: 1080, cy: H * 0.5 }); }, { shake: 0.1 });
    dressingRoom(g, t, [coachAt(t, { ...POSE.stand(), sh: [[0.1, 0.1], [2.1, 0.35]], el: [0.3, 0.6] })], { u: arrowU(t) });
  }, { qaAllow: CROWDED });
  cue(cEvery, 'whoosh_soft', 0.18); cue(cEvery + 0.6, 'scribble', 0.45);
  // "they would score into their own net.": the arrow reaches their own goal and is ringed; the players watch it
  shot(cWould, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cWould) / (cKick - cWould))); return lookFrom([RX - 0.9 + 0.4 * v, 1.55, -1.7 + 0.3 * v], [RX - 0.3, 1.75, 4], { fov: lerp(1250, 1400, v), cy: H * 0.5 }); }, { shake: 0.12 });
    dressingRoom(g, t, benchSOE(t), { u: arrowU(t), ring: ringU(t) });
  }, { qaAllow: CROWDED });
  cue(tNet - 0.35, 'scribble', 0.4); cue(tNet, 'dun_dun', 0.4);

  // ======================= THE MATCH: 31 OCTOBER 2002 =======================
  // "Kick-off.": the centre spot, from low; the referee's whistle; Adema waiting in their half
  shot(cKick, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cKick) / (cTurn - cKick))); return lookFrom([-3.4 + 0.5 * v, 0.55, -1.8 + 0.2 * v], [2, 0.8, 0.4], { fov: 1500, cy: H * 0.56 }); }, { shake: 0.2 });
    const tap = smooth(clamp((t - cKick - 0.35) / 0.3));
    ground(g, t, [shooter(t, SOE[0], -0.35, 0.15, 0, cKick + 0.4), man(t, SOE[1], -0.3, 1.7, 0.2, {}, GRIM, 1), BALL([lerp(0, 1.83, tap), BALL_R, lerp(0, 1.33, tap)]),
      ...[[9, -6], [11, 3], [14, -12], [16, 10], [20, -2]].map(([x, z], i) => man(t, ADE[i], x, z, PI, {}, 'focus', i)), man(t, REF, 4, -8, PI * 0.75, {}, 'focus', 2)],
      { score: 1, min: 1, cheer: 0.4, blur: 2 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(cKick + 0.05, 'whistle', 0.55); cue(cKick + 0.4, 'kick', 0.3);
  // "They turn,": the man who takes the pass turns his back on Adema and faces his own goal
  shot(cTurn, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cTurn) / (cShoot - cTurn))); return lookFrom([4.6 - 0.4 * v, 1.35, 3.6 - 0.3 * v], [0.2, 1.15, 1.0], { fov: 1500, cy: H * 0.56 }); }, { shake: 0.25 });
    const turn = smooth(clamp((t - cTurn - 0.32) / 0.4)), go = Math.max(0, t - cTurn - 0.72), hd = lerp(0.3, PI, turn);
    const runner = go > 0 ? jog(t, cTurn + 0.72, SOE[1], 1.4, 1.2, -5.5, -0.2, 0, GRIM) : man(t, SOE[1], 1.4, 1.2, hd, {}, GRIM, 1);
    const bx = go > 0 ? 1.4 - 5.5 * go - 0.5 : 1.4 + 0.45 * Math.cos(hd), bz = go > 0 ? 1.2 - 0.2 * go : 1.2 + 0.45 * Math.sin(hd);
    ground(g, t, [runner, man(t, SOE[0], -0.6, 2.2, 0.2, {}, GRIM, 0), BALL([bx, BALL_R, bz])],
      { score: 1, min: 1, cheer: 0.4, blur: 3 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(cTurn + 0.15, 'whoosh_soft', 0.16);
  // "and shoot into their own goal.": from behind their own net; their keeper stands aside; the board far behind: 2–0
  const tk1 = g1 - 0.75, b1 = shotPath(tk1, [-42.6, BALL_R, 1.0], 0.75, [-53.3, 0.95, -0.4], { t0: tk1 - 1.8, from: [-34.5, BALL_R, 1.3] });
  shot(cShoot, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cShoot) / (cAgain - cShoot))); return lookFrom([-55.9 + 0.2 * v, 1.05, -0.9 + 0.3 * v], [-42, 1.0, 0.4], { fov: 1800, cy: H * 0.5 }); }, { shake: 0.3 + (t > g1 ? 1.4 * Math.exp(-(t - g1) * 6) : 0) });
    const pl = t < tk1 - 0.3 ? jog(t, tk1 - 0.3, SOE[1], -42.1, 1.05, -4.6, 0.05, 0, GRIM) : shooter(t, SOE[1], -42.1, 1.05, PI, tk1);
    ground(g, t, [pl, ballOf(b1, t), keeperAside(t, -49.2, -1.5, -0.1), ...watchers(t, [[-30.5, -6.0], [-28.4, 3.0], [-33.5, 8.2]], 4)], { score: scoreAt(t), min: minAt(t), cheer: 0.5, blur: 1.2, hitL: { t0: g1, y: 0.95, z: -0.4, k: 1.1 } });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(tk1, 'kick', 0.55); cue(g1, 'net', 0.6); cue(g1 + 0.1, 'crowd_gasp', 0.5);
  // "Again.": side on, another one: kicked in from close range
  const A2 = [-43.0, -2.8], A2H = Math.atan2(-1.2 - A2[1], -53.3 - A2[0]);
  const tk2 = tAgain - 0.02, b2 = shotPath(tk2, [A2[0] + 0.5 * Math.cos(A2H), BALL_R, A2[1] + 0.5 * Math.sin(A2H)], g2 - tk2, [-53.3, 0.6, -1.2]);
  shot(cAgain, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cAgain) / (cAgain2 - cAgain))); return lookFrom([-37.8 - 0.6 * v, 1.55, -5.4 + 0.3 * v], [-50.5, 1.0, -0.9], { fov: 1500, cy: H * 0.55 }); }, { shake: 0.3 + (t > g2 ? 1.2 * Math.exp(-(t - g2) * 6) : 0) });
    ground(g, t, [shooter(t, SOE[2], ...A2, A2H, tk2), ballOf(b2, t), keeperAside(t, -51.0, 3.2, 0.3)], { score: scoreAt(t), min: minAt(t), cheer: 0.4, blur: 2, hitL: { t0: g2, y: 0.6, z: -1.2, k: 1 } });
  }, { mbStep: 3, mbMax: 10, qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(tk2, 'kick', 0.5); cue(g2, 'net', 0.55);
  // "And again.": from high in the main stand: and again, while the blue shirts stand about in the middle
  const tk3 = tAgain2 - 0.05, b3 = shotPath(tk3, [-37.5, BALL_R, 5.2], g3 - tk3, [-53.3, 1.1, 1.8]);
  shot(cAgain2, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cAgain2) / (cEvery36 - cAgain2))); return lookFrom([-29 - 2 * v, 9.5 - 0.5 * v, 21 - 1.5 * v], [-44, 0.5, 1.5], { fov: 1450, cy: H * 0.5 }); }, { shake: 0.15 });
    ground(g, t, [shooter(t, SOE[3], -37, 5.2, PI - 0.25, tk3), ballOf(b3, t), keeperAside(t), ...soeAround(t, 0), ...watchers(t, [[-35.2, 9.1], [-45.5, 7.5]], 6)], { score: scoreAt(t), min: minAt(t), cheer: 0.4, blur: 1.5, hitL: { t0: g3, y: 1.1, z: 1.8, k: 1 } });
  }, { mbStep: 3, mbMax: 10, qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(tk3, 'kick', 0.45); cue(g3, 'net', 0.5);
  // "One goal every 36 seconds.": the stopwatch over the match running fast: a ball in the net with every turn of the hand
  const lapShooters = [[-36, 4], [-31, -6], [-38, -2], [-33, 8]];
  shot(cEvery36, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cEvery36) / (cWatch - cEvery36))); return lookFrom([-19 - 2 * v, 14.5 - v, 34 - 2 * v], [-41, 0, 0], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.1 });
    const k = Math.max(0, Math.floor((t - tLaps) / LAP)), f = clamp((t - tLaps - k * LAP) / LAP), [sx, sz] = lapShooters[k % 4];
    const from = [sx, BALL_R, sz], to = [-53.3, 0.9, (k % 3 - 1) * 1.6], pos = t < tLaps ? from : [lerp(from[0], to[0], f), BALL_R + 3.5 * f * (1 - f) + (to[1] - BALL_R) * f, lerp(from[2], to[2], f)];
    ground(g, t, [shooter(t, SOE[(k + 3) % 10], sx + 0.4, sz, PI, tLaps + k * LAP + 0.02), BALL(pos), keeperAside(t), ...soeAround(t), ...ademaWatching(t, -2)],
      { score: scoreAt(t), min: minAt(t), cheer: 0.3, blur: 1, hitL: { t0: tLaps + (k + 0.95) * LAP - LAP, y: 0.9, z: to[2], k: 0.8 } });
    g.save(); g.filter = 'blur(5px)'; g.drawImage(g.canvas, 0, 0, W, H, 0, 0, W, H); g.restore();
    g.fillStyle = 'rgba(8,12,20,0.38)'; g.fillRect(0, 0, W, H);
    const a = smooth(clamp((t - cEvery36 - 0.05) / 0.25)), ang = 2 * PI * 0.6 * ((t - tLaps) / LAP);  // 36 s of the 60-second dial per goal
    stopwatch(g, W / 2, 690, 210, t < tLaps ? 0 : ang, '36 s', 'PER GOAL', a);
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(cEvery36, 'whoosh_deep', 0.2); for (let i = 0; i < 8; i++) { cue(tLaps + i * LAP, 'clock_tick', 0.35); cue(tLaps + (i + 0.9) * LAP, 'net', 0.22); }
  // "AS Adema's players just stood and watched,": the blue shirts standing, looking past us at the other goal; the board
  // behind them keeps counting
  shot(cWatch, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cWatch) / (cClimb - cWatch))); return lookFrom([1.2 + 0.8 * v, 1.55, -3.6 + 5.4 * v], [9, 2.4, 0.85 * (-3.6 + 5.4 * v)], { fov: 1500, cy: H * 0.45 }); }, { shake: 0.15 });
    const blue = [[6, -5.5], [7.5, -2.2], [6.4, 1.2], [8.2, 4.4], [6.8, 7.6], [10.5, -7.8], [11, 0], [10.6, 9.5], [13.2, -3.6], [13.4, 4.8]].map(([x, z], i) => man(t, ADE[i], x, z, PI - z * 0.02, i % 3 ? { ...HIPS } : {}, [BLANK, PUZZLED, EXPR.smug][i % 3], i));
    ground(g, t, [...blue, man(t, REF, 9.2, -0.8, PI, {}, BLANK, 2)], { score: scoreAt(t), min: minAt(t), cheer: 0.2, blur: 0.8 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(cWatch, 'whoosh_soft', 0.18); for (let i = 0; i < 6; i++) cue(cWatch + 0.3 + i * 0.45, 'net', 0.12);
  // "as the score kept climbing.": up to the scoreboard
  shot(cClimb, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = ease.inOut(clamp((tt - cClimb) / (t50 - 0.5 - cClimb))); return lookFrom([32, 2.2 + 2.5 * v, 4 - v], mix3([62, 5, 0], [73, 12.1, 0], v), { fov: lerp(1400, 1600, v), cy: H * 0.52 }); }, { shake: 0.2 });
    ground(g, t, [], { score: scoreAt(t), min: minAt(t), cheer: 0.2 });
  }, { qaAllow: CROWDED, hud: (g, lt, t) => bug(g, t) });
  cue(cClimb, 'whoosh_fast', 0.18);
  // "50. 100. 149.": the board, close: each figure lands; at 149 the final whistle
  shot(t50 - 0.5, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - t50 + 0.5) / (cStands - t50 + 0.5))); return lookFrom([43 + 2.5 * v, 10.6 + 0.4 * v, 2 - 1.2 * v], [73, 12.1, 0], { fov: lerp(1480, 1600, v) + 80 * glide(clamp((tt - t149) / 2)), cy: H * 0.5 }); }, { shake: 0.2 + [t50, t100, t149].reduce((a, x) => a + (t > x ? 0.5 * Math.exp(-(t - x) * 9) : 0), 0) });
    ground(g, t, [], { score: scoreAt(t), min: minAt(t), flash: flashAt(t), cheer: 0.2 });
    if (t > t149 && t < t149 + 0.3) { g.fillStyle = `rgba(255,250,235,${(0.5 * (1 - (t - t149) / 0.3)).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  }, { trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => { bug(g, t); plateAt(g, t, t149 + 0.55, 'FULL TIME', 300, { size: 44 }); } });
  cue(t50, 'stamp', 0.45); cue(t100, 'stamp', 0.5); cue(t149, 'boom_cine', 0.4); cue(t149 + 0.5, 'whistle', 0.6);

  // ======================= THE STANDS, AND THE TICKET BOOTHS =======================
  // "In the stands,": the people on the terrace, puzzled
  shot(cStands, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cStands) / (cBooth - cStands))); return lookFrom([2 + 1.2 * v, 2.1, 34.6 + 0.5 * v], [2.6 + v, 3.1, 44], { fov: 1500, cy: H * 0.55 }); }, { shake: 0.2 });
    ground(g, t, fanRows(t, 2.6, 7), { score: 149, min: 90, cheer: 0, blur: 2, hole: { s: 1, x0: -12, x1: 12 } });
  }, { qaAllow: CROWDED });
  cue(cStands, 'whoosh_soft', 0.18);
  // "fans went to the ticket booths": outside, the queue at the window
  const Q = [[-0.2, 4.35], [-1.05, 3.75], [-1.85, 3.2], [-2.6, 2.7], [-3.35, 2.25], [-4.1, 1.85], [-4.8, 1.5]];
  const queue = (t, n = Q.length) => Q.slice(0, n).map(([dx, z], i) => { const x = BX + dx, hd = Math.atan2(5 - z, BX - x + 0.2) + (i % 2 ? 0.2 : -0.1);
    const it = man(t, FANS[[7, 6, 2, 8, 3, 11, 5][i]], x, z, hd, i === 0 ? { ...POSE.stand(), ...POSE.protest(t) } : i % 2 ? TICKET_UP : i === 2 ? SCRATCH : { ...POSE.stand(), sh: [[0.18, 0.14], [0.18, 0.14]], el: [0.45, 0.45] }, i === 0 ? SHOUT : PUZZLED, i);
    return i % 2 && i ? [it, ticketItem(it)] : [it]; }).flat();
  const clerkAt = t => man(t, CLERK, BX + 0.05, 5.45, -PI / 2, t > tMoney ? SHRUG : {}, t > tMoney ? PUZZLED : BLANK, 1);
  shot(cBooth, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cBooth) / (cMoney - cBooth))); return lookFrom([BX - 5.0 + 0.6 * v, 1.7, -1.3 + 0.4 * v], [BX - 0.9, 1.75, 4.6], { fov: 1450, cy: H * 0.52 }); }, { shake: 0.2 });
    ticketBooth(g, t, queue(t, 5), { clerk: clerkAt(t) });
  }, { grade: DAY_G, qaAllow: CROWDED });
  cue(cBooth, 'whoosh_soft', 0.2); cue(cBooth + 0.2, 'crowd_protest', 0.35);
  // "and asked for their money back.": at the window: tickets up, and the man at the front shouting through the bars
  shot(cMoney, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cMoney) / (cBan - cMoney))); return lookFrom([BX + 1.5 - 0.2 * v, 1.68, 2.6 + 0.3 * v], [BX - 0.25, 1.62, 4.7], { fov: 1500, cy: H * 0.56 }); }, { shake: 0.2 });
    ticketBooth(g, t, queue(t, 3), { clerk: clerkAt(t) });
  }, { grade: DAY_G, qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tMoney - 0.1) { const it = queue(t, 1)[0], p = B.project(...skeleton(it.pl, it.st).headC); sayBubble(g, p, 'OUR MONEY BACK!', clamp((t - tMoney + 0.1) / 0.12), 1 + 0.06 * Math.exp(-(t - tMoney) * 6), 120); } } });
  cue(tMoney - 0.1, 'crowd_protest', 0.45); cue(tMoney + 0.2, 'coins', 0.35);

  // ======================= THE AFTERMATH =======================
  // "The federation banned the coach for three years": the coach alone by his board
  shot(cBan, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cBan) / (cSusp - cBan))); return lookFrom([RX + 0.2 + 0.4 * v, 1.62, -2.4 + 1.5 * v], [RX + 0.7, 1.5, 3.2], { fov: lerp(1300, 1450, v), cy: H * 0.5 }); }, { shake: 0.12 });
    dressingRoom(g, t, [coachAt(t, { ...POSE.stand(), ...HEADDOWN }, LOST, RX + 0.9, 2.9, -PI / 2 - 0.2)], { u: 1, ring: 1 });
  }, { grade: ROOM_G, trans: 'push', qaAllow: CROWDED, hud: (g, lt, t) => { plateAt(g, t, cBan + 0.15, 'MALAGASY FOOTBALL FEDERATION', 300, { size: 40 }); if (t > tThree - 0.05) stamp(g, 'COACH BANNED · 3 YEARS', W / 2, 470, lt, tThree - 0.05 - cBan, { color: RED, size: 60, rot: -0.04 }); } });
  cue(cBan, 'whoosh_deep', 0.22); cue(cBan + 0.2, 'paper', 0.35); cue(tThree - 0.05, 'stamp', 0.55);
  // "and suspended several players.": the players on the bench, heads down
  shot(cSusp, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cSusp) / (cEpi - cSusp))); return lookFrom([RX - 0.6 + 1.0 * v, 1.35, 3.6 - 0.3 * v], [RX + 0.1, 0.95, 0.4], { fov: 1000, cy: H * 0.52 }); }, { shake: 0.12 });
    dressingRoom(g, t, benchSOE(t, PI / 2, LOST, 1, 0.8, SEATED), { u: 1, ring: 1 });
  }, { grade: ROOM_G, qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tSusp + 0.2) stamp(g, 'PLAYERS SUSPENDED', W / 2, 420, lt, tSusp + 0.2 - cSusp, { color: RED, size: 70, rot: -0.04 }); } });
  cue(cSusp, 'whoosh_soft', 0.2); cue(tSusp + 0.2, 'stamp', 0.5);

  // ======================= THE EPILOGUE =======================
  // "And 149 own goals": the empty ground at dusk, the ball on the centre spot, the board still lit
  shot(cEpi, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cEpi) / (cRecord - cEpi))); return lookFrom([-4.5 + 6.5 * v, 0.5 + 6.5 * v, -0.3 + 1.1 * v], [73, 10.5, 0], { fov: lerp(1350, 1500, v), cy: H * 0.55 }); }, { shake: 0.12 });
    ground(g, t, [BALL([0, BALL_R, 0])], { sk: SKY_DUSK, score: 149, min: 90, cheer: 0 });
  }, { grade: DUSK_G, trans: 'push', qaAllow: CROWDED });
  cue(cEpi, 'whoosh_deep', 0.22);
  // "is still a world record.": the yellow shirts walk away toward the board; the flash, and the record stays on screen
  shot(cRecord, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - cRecord) / (T.duration - cRecord))), d = 1.15 * (tt - cRecord); return lookFrom([10 + d, 1.7 + 0.4 * v, 0.6], [73, 8.5, 0], { fov: lerp(1450, 1550, v), cy: H * 0.56 }); }, { shake: 0.12 });
    const walkers = [[16.5, -2.2], [17.6, 0.4], [16.9, 2.8], [18.8, -0.9], [18.2, 4.6]].map(([x, z], i) => jog(t, cRecord, SOE[(i + 1) % 10], x, z, 1.15, 0, i * 1.3, 'tired'));
    ground(g, t, walkers, { sk: SKY_DUSK, score: 149, min: 90, cheer: 0 });
    if (t > tWorld - 0.12 && t < tWorld + 0.25) { g.fillStyle = `rgba(255,255,255,${(0.8 * (1 - (t - tWorld + 0.12) / 0.37)).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  }, { grade: DUSK_G, qaAllow: CROWDED, hud: (g, lt, t) => { if (t > tWorld - 0.12) title2(g, '149 OWN GOALS', 'STILL A WORLD RECORD', 230, { c2: SYEL, s1: 92, s2: 72, a: clamp((t - tWorld + 0.12) / 0.08), k: 1 + 0.08 * Math.exp(-(t - tWorld) * 7) }); } });
  cue(cRecord, 'whoosh_soft', 0.18); cue(tWorld - 0.12, 'camera', 0.5); cue(tWorld - 0.1, 'boom_move', 0.3);
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd: loud at the ground, a gasp at the first own goal, then murmurs; quiet in the dressing room
  amb.push({ id: 'crowd_bed', t0: 0, t1: cCoach + 0.3, gain: 0.55, fi: 0.1, fo: 0.4, keys: [[0, 0.4], [cChamps, 0.35], [cBut, 0.7], [cPen, 0.9], [cTitle, 0.2], [cLast, 0.6], [cCoach, 0.0]] });
  amb.push({ id: 'crowd_bed', t0: cKick - 0.2, t1: cBooth + 0.2, gain: 0.5, fi: 0.2, fo: 0.4, keys: [[cKick, 0.6], [g1, 0.9], [cEvery36, 0.5], [cWatch, 0.4], [t149, 0.7], [cStands, 0.5], [cBooth, 0.2]] });
  amb.push({ id: 'murmur', t0: cStands - 0.1, t1: cBan + 0.2, gain: 0.4, fi: 0.2, fo: 0.4, keys: [[cStands, 0.8], [cBooth, 0.6], [cMoney, 0.7], [cBan, 0.1]] });
  amb.push({ id: 'crowd_bed', t0: cEpi - 0.1, t1: tvOff - 0.15, gain: 0.3, fi: 0.4, fo: 0.9, keys: [[cEpi, 0.25], [cRecord, 0.2], [tvOff - 0.6, 0.05]] });

  const music = [
    { t: 0, m: 'hook' }, { t: cChamps - 0.1, m: 'stands' }, { t: cPen, m: 'hit' }, { t: cLast - 0.1, m: 'intrigue' }, { t: cKick - 0.1, m: 'tension' }, { t: cEvery36 - 0.1, m: 'auction' },
    { t: t149, m: 'slam' }, { t: cStands - 0.1, m: 'clockwork' }, { t: cBan - 0.1, m: 'court' }, { t: cEpi - 0.1, m: 'elegy' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx: [], ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
