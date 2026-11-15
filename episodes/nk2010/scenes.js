// North Korea 0–7 Portugal (World Cup 2010, Cape Town, 21 June). North Korea's first World Cup in 44 years; after a 2–1
// loss to Brazil shown a day late, state TV showed the Portugal match live, the first match abroad to go out live at
// home. 1–0 at half-time, 7–0 at the end, in pouring rain; the commentator closed the broadcast and the picture cut to
// factory workers. Then what was reported and what was rumoured: Radio Free Asia's account of a six-hour criticism
// session on 2 July, the rumours of the mines and of executions, FIFA's letter and Pyongyang's answer ("training as
// usual"). What can be checked: all eleven who started the match were in the squad for the Asian Cup six months later;
// the coach was not, and nothing about him has been confirmed since. Facts and what is drawn: SOURCES.md.
// Palette: a grey, rain-soaked Cape Town (North Korea in white, Portugal in red); the blue flicker of a television in
// a dark room; the dark red of the hall in Pyongyang; fog for the rumours; plain daylight for what is known.
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, enter, stamp, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { box } from '../../engine/js/env.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, flagItems, playerItems, playerShadow, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, BALL_R, skeleton } from '../../engine/js/football.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1F2D5C', RED = '#D8453A', NKRED = '#C8202A', GREEN = '#2E9E5B';
const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const pin = (t, t0, a = 1) => { const u = enter(t, t0); return { a: u * a, scale: lerp(0.94, 1, u), dy: (1 - u) * 14 }; };  // a label comes in at its own size, never larger (a long one would run off the frame)
const fadeOut = (t, t1, d = 0.25) => 1 - clamp((t - t1) / d);
// grades: the rain, the floodlit night, the room lit by a television, the hall, the fog of rumour, daylight
const RAIN_G = { con: 1.06, sat: 0.9, bri: 0.99, tone: ['#B9CBD8', 0.12], lift: ['#12202C', 0.12], bloom: 0.16 };
const NIGHT_G = { con: 1.07, sat: 0.98, bri: 1.0, tone: ['#FFD9A0', 0.1], lift: ['#0E1630', 0.14], bloom: 0.34 };
const ROOM_G = { con: 1.05, sat: 0.92, bri: 1.0, tone: ['#9FC0E8', 0.07], lift: ['#0A1018', 0.1], bloom: 0.3 };
const HALL_G = { con: 1.08, sat: 0.95, bri: 0.99, tone: ['#FF9A7A', 0.07], lift: ['#160808', 0.14], bloom: 0.26 };
const FOG_G = { con: 1.02, sat: 0.6, bri: 0.99, tone: ['#B8C4D0', 0.14], lift: ['#141A22', 0.16], bloom: 0.2 };
const DESK_G = { con: 1.05, sat: 0.9, bri: 1.0, tone: ['#FFD9A0', 0.1], lift: ['#120C08', 0.1], bloom: 0.22 };
const DAY_G = { con: 1.05, sat: 1.0, bri: 1.03, tone: ['#FFD8A0', 0.1], lift: ['#10243A', 0.06], bloom: 0.2 };

// ---------- kits as worn (drawn, not the exact designs): North Korea in their white change kit against Portugal and in
// red against Brazil; Portugal all in red; tracksuits and suits back home. The cast: cartoons, not likenesses
const NK_W = { shirt: '#F4F5F2', shirtD: '#CDD2D6', trim: NKRED, num: NKRED, numEdge: '#F4F5F2', shorts: '#F4F5F2', socks: '#F4F5F2', band: NKRED, boots: '#141518', badge: NKRED };
const NK_R = { shirt: NKRED, shirtD: '#9C141C', trim: '#F4F5F2', num: '#F4F5F2', numEdge: '#9C141C', shorts: '#F4F5F2', socks: NKRED, band: '#F4F5F2', boots: '#141518', badge: '#F4F5F2' };
const NK_GK = { shirt: '#2F8F5B', shirtD: '#1F6B41', trim: '#15171A', num: '#F4F5F2', numEdge: '#1F6B41', shorts: '#1C1D21', socks: '#2F8F5B', band: '#15171A', boots: '#141518', long: true, gloves: '#F2F2EE', badge: '#F4F5F2' };
const POR = { shirt: '#B81226', shirtD: '#8C0C1B', trim: '#0E6B3C', num: '#F2D24A', numEdge: '#8C0C1B', shorts: '#B81226', socks: '#B81226', band: '#0E6B3C', boots: '#141518', badge: '#F2D24A' };
const BRA = { shirt: '#F5D31A', shirtD: '#CDAE0E', trim: '#1E8A4A', num: '#1E8A4A', numEdge: '#F5D31A', shorts: '#1E4E9E', socks: '#F4F5F2', band: '#1E8A4A', boots: '#141518', badge: '#1E8A4A' };
const BRA_GK = { shirt: '#8E9AA0', shirtD: '#6C777D', trim: '#15171A', num: '#F4F5F2', numEdge: '#6C777D', shorts: '#8E9AA0', socks: '#8E9AA0', band: '#15171A', boots: '#141518', long: true, gloves: '#F2F2EE', badge: '#F5D31A' };
const TRACK = { shirt: '#B81C24', shirtD: '#8E1219', trim: '#F4F5F2', num: null, shorts: '#1B2A4E', socks: '#1B2A4E', boots: '#EDEDE8', long: true, trousers: true, band: null, badge: '#F4F5F2' };
const SUIT = (c, d) => ({ shirt: c, shirtD: d, trim: c, num: null, shorts: d, socks: d, boots: '#111214', long: true, trousers: true, band: null });
const SKIN_K = { base: '#EAC09C', shade: '#D4A782', deep: '#B2835E', blush: '#DD9984', hi: '#F5DBC0' };
const SKIN_P = { base: '#D9A77E', shade: '#C28F68', deep: '#9F704C', blush: '#CF8A72', hi: '#EBC6A2' };
const nkFace = (hair, face, hc = '#15110E') => ({ face, hair, hairC: hc, brow: '#100C0A', suit: '#F4F5F2', suitD: '#CDD2D6', shirt: 'tee', ears: 1.0, skin: SKIN_K });
CAST.nk1 = nkFace('buzz', [0.96, 1.04, 0.9]); CAST.nk2 = nkFace('fringe', [0.95, 1.06, 0.88]); CAST.nk3 = nkFace('swept', [0.97, 1.03, 0.92]);
CAST.nk4 = nkFace('messy', [0.95, 1.05, 0.9]); CAST.nk5 = nkFace('buzz', [0.98, 1.02, 0.93], '#1E1814'); CAST.nk6 = nkFace('fringe', [0.94, 1.07, 0.87], '#1A1512');
CAST.nkCoach = { ...nkFace('receding', [0.98, 1.04, 0.93], '#3A3632'), suit: '#2A2F3A', suitD: '#1C2029' };
CAST.nkOff1 = { ...nkFace('receding', [1.0, 1.02, 0.95], '#2A2623'), suit: '#3A3F47', suitD: '#272B31' };
CAST.nkOff2 = { ...nkFace('swept', [0.97, 1.05, 0.9], '#4A4642'), suit: '#4A4038', suitD: '#332B25' };
const poFace = (hair, face, hc) => ({ face, hair, hairC: hc, brow: '#16100C', suit: '#B81226', suitD: '#8C0C1B', shirt: 'tee', ears: 1.0, skin: SKIN_P });
CAST.po1 = poFace('swept', [0.95, 1.06, 0.89], '#1E1612'); CAST.po2 = poFace('curly', [0.96, 1.04, 0.9], '#16110D'); CAST.po3 = poFace('buzz', [0.95, 1.05, 0.9], '#2A1E16');
// the eleven who started against Portugal, by shirt number (1 the goalkeeper)
const XI = [[1, 'nk5'], [2, 'nk1'], [13, 'nk2'], [3, 'nk3'], [8, 'nk4'], [5, 'nk6'], [17, 'nk1'], [11, 'nk3'], [4, 'nk2'], [10, 'nk4'], [9, 'nk6']];
const HT = [1.87, 1.76, 1.8, 1.78, 1.74, 1.79, 1.82, 1.75, 1.77, 1.73, 1.81];
const squad = (kit, gk) => XI.map(([num, who], i) => ({ who, kit: i === 0 ? gk : kit, num, h: HT[i] }));
const NKW = squad(NK_W, NK_GK), NKR = squad(NK_R, NK_GK), NKT = XI.map(([, who], i) => ({ who, kit: TRACK, num: null, h: HT[i] }));
const GK = NKW[0];
const PORP = [[16, 'po1'], [11, 'po2'], [18, 'po3'], [19, 'po1'], [9, 'po2'], [7, 'po3']].map(([num, who], i) => ({ who, kit: POR, num, h: 1.8 + 0.02 * (i % 3) }));
const BRAP = [{ who: 'po2', kit: BRA_GK, num: 1, h: 1.86 }, { who: 'po1', kit: BRA, num: 3, h: 1.86 }, { who: 'po3', kit: BRA, num: 4, h: 1.82 }];
const COACH = { who: 'nkCoach', kit: SUIT('#2A2F3A', '#1C2029'), num: null, h: 1.72 };
const SPEAKER = { who: 'nkOff2', kit: SUIT('#4A4038', '#332B25'), num: null, h: 1.7 };
const MINISTER = { who: 'nkOff1', kit: SUIT('#3A3F47', '#272B31'), num: null, h: 1.74 };

// ---------- the grounds: Cape Town in the rain, a floodlit night for the anthem, a quiet ground in daylight
const FLAGS = [
  g => { g.fillStyle = '#1E8A4A'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F2C200'; g.fillRect(0, 0.38, 1, 0.24); },
  g => { g.fillStyle = '#B81226'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#0E6B3C'; g.fillRect(0, 0, 0.4, 1); },
  g => { g.fillStyle = '#F4F5F2'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#1E4E9E'; g.fillRect(0, 0, 1, 0.3); },
];
const CAPE = new Stadium({ seed: 31, density: 0.95, flags: 3, flagSet: FLAGS, haze: '#A9B4BE' });
const ELLIS = new Stadium({ seed: 17, density: 1, flags: 3, flagSet: FLAGS, haze: '#2A3550' });
const QATAR = new Stadium({ seed: 9, density: 0.3, flags: 0, haze: '#D6CFC0' });
const BARE = new Stadium({ seed: 9, density: 0, flags: 0, haze: '#9AA3AD' });
const BOARDS = [boardDesign('SOUTH AFRICA 2010', { bg: '#F2C200', ink: '#1D2A44' }), boardDesign('CAPE TOWN'), boardDesign('21 JUNE 2010', { bg: '#1E4E9E', ink: '#FFFFFF' }), boardDesign('GREEN POINT')];
const BOARDS_J = [boardDesign('SOUTH AFRICA 2010', { bg: '#F2C200', ink: '#1D2A44' }), boardDesign('JOHANNESBURG'), boardDesign('15 JUNE 2010', { bg: '#1E4E9E', ink: '#FFFFFF' }), boardDesign('ELLIS PARK')];
const BOARDS_Q = [boardDesign('ASIAN CUP', { bg: '#7A1E3A', ink: '#FFFFFF' }), boardDesign('QATAR 2011'), boardDesign('JANUARY 2011', { bg: '#1D2A44', ink: '#F4F2EC' })];
const RAINSKY = { zen: '#5A6470', mid: '#7F8A95', hor: '#AEB7BD', clouds: 1, cloud: '#99A2AA', seed: 12 };
const NIGHT = { zen: '#0A1124', mid: '#17233F', hor: '#33415F', clouds: 0.25, cloud: '#3B4660', seed: 3 };
const SUNQ = { zen: '#3A86D0', mid: '#8CC0EA', hor: '#EDE6D2', clouds: 0.25, seed: 2 };
const FOGSKY = { zen: '#6E7780', mid: '#8E979F', hor: '#A9B1B8', clouds: 1, cloud: '#9EA6AD', seed: 5 };
const WET = { colors: ['#447F36', '#4E8A3E'] };
const BG = makeCanvas(), bgx = BG.getContext('2d');
const L2 = makeCanvas(), l2x = L2.getContext('2d');
const TVB = makeCanvas(), tvx = TVB.getContext('2d');
function stadium(g, t, items = [], { stad = CAPE, boards = BOARDS, cheer = 0, blur = 0, skyO = RAINSKY, pitchO = WET, hit = null } = {}) {
  const back = c => { sky(c, B, { t, ...skyO }); stad.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...pitchO });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t }), ...goalItems(B, 1, { t, hit }), ...(boards.length ? boardItems(B, boards) : []), ...flagItems(B, t), ...items]);
}
const P = (pl, st) => { const it = playerItems(B, pl, st); it.shadow = gg => playerShadow(gg, B, pl, st); it.pl = pl; it.st = st; return it; };
const BALL = (pos, o = {}) => { const it = ballItem(B, pos, o); it.shadow = gg => groundShadow(gg, B, pos[0], pos[2], { r: BALL_R * 1.1, y: pos[1] - BALL_R, a: 0.35 }); return it; };
function moving(mv, tt, { e = 'focus', t = tt, I = null } = {}) {
  const s = mv.at(tt), inten = I ?? clamp(s.sp / 6.5, 0, 1);
  const p = s.sp < 0.4 ? POSE.stand() : blend(POSE.stand(), POSE.run(s.phase, Math.max(0.35, inten), 0), clamp(s.sp / 1.2));
  return { x: s.x, z: s.z, head: s.head, pose: p, e, t };
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

// ---------- the rain: two layers of streaks falling a little aslant, and a wet haze low over the ground
const DROPS = (() => { const r = rng(77); return Array.from({ length: 300 }, () => ({ x: r(), y: r(), v: 0.9 + 0.8 * r(), l: 36 + 64 * r(), a: 0.1 + 0.26 * r(), near: r() < 0.28 })); })();
function rain(g, t, k = 1) {
  if (k <= 0) return;
  g.save(); g.lineCap = 'round';
  for (const d of DROPS) {
    const sp = (d.near ? 2.5 : 1.6) * d.v, yy = ((d.y + t * sp) % 1) * (H + 300) - 150, xx = ((d.x + t * sp * 0.13) % 1) * (W + 200) - 100, len = d.l * (d.near ? 1.7 : 1);
    g.strokeStyle = `rgba(226,236,246,${(d.a * k * (d.near ? 1 : 0.7)).toFixed(3)})`; g.lineWidth = d.near ? 2.4 : 1.3;
    g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - len * 0.13, yy - len); g.stroke();
  }
  const hz = g.createLinearGradient(0, H * 0.3, 0, H * 0.62); hz.addColorStop(0, 'rgba(190,202,212,0)'); hz.addColorStop(1, `rgba(190,202,212,${(0.1 * k).toFixed(3)})`);
  g.fillStyle = hz; g.fillRect(0, H * 0.3, W, H * 0.32);
  g.restore();
}

// ---------- on-screen pieces
function scoreBug(g, a, b, m, { x = 40, y = 76, al = 1, hot = 0, L = 'PRK', R = 'POR', lc = '#C9CCD0', rc = '#B81226' } = {}) {  // flat (rule 50); hot: the second score swells and turns red
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = lc; g.fillRect(x, y, 14, hh); g.fillStyle = rc; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(L, x + 26, y + hh / 2 + 2); g.fillText(R, x + w - 96, y + hh / 2 + 2);
  g.textAlign = 'center'; g.fillText(`${a} –`, x + w / 2 - 34, y + hh / 2 + 2);
  g.save(); g.translate(x + w / 2 + 20, y + hh / 2 + 2); g.scale(1 + 0.5 * hot, 1 + 0.5 * hot); g.fillStyle = mix(C.ink, '#B81226', hot); g.fillText(String(b), 0, 0); g.restore();
  g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 74, y + hh / 2 + 2);
  qaRect(g, x, y, w + 140, hh, 'text', 'score bug');
  g.restore();
}
function bigText(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#F2D27A', s1 = 96, s2 = 78, a = 1 } = {}) {  // the cover: two heavy lines
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#121A26';
  g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
  g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.14); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.14);
  qaRect(g, 60, y - s1 * 0.8, W - 120, s1 * 0.8 + s2 * 1.2, 'text', 'cover title');
  g.restore();
}

// ================= ON THE PITCH =================
// after the seventh: the goalkeeper on his knees in his goal, the others where they stopped. The seven balls lying in the
// net are a figure for the seven goals (a match has one ball)
const SIT_UP = { hip: [[1.45, 0.2], [1.36, 0.14]], knee: [0.95, 0.6], sh: [[-0.62, 0.35], [-0.5, 0.3]], el: [0.15, 0.2], lean: -0.36, pelvisY: 0.17, ground: false, look: 0.9 };  // sitting in his goal, leaning back on his hands, his face up to the rain
const SLUMP = { hip: [[1.52, 0.2], [1.46, 0.16]], knee: [1.5, 1.36], sh: [[0.9, 0.25], [0.9, 0.25]], el: [0.5, 0.5], lean: 0.36, pelvisY: 0.17, ground: false, look: -1.0 };  // knees up, his arms on them, head down
const BENT = { lean: 0.95, crouch: 0.08, hip: [[0.4, 0.12], [0.4, 0.12]], knee: [0.3, 0.3], sh: [[0.95, 0.12], [0.95, 0.12]], el: [0.1, 0.1], look: -0.5 };  // hands on his knees
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.06, look: -0.8 };  // hands on his hips, head down
const SQUAT = { hip: [[0.95, 0.12], [0.95, 0.12]], knee: [1.75, 1.75], lean: 0.34 };  // down on his haunches
const DOWNCAST = { lean: 0.1, look: -0.9, sh: [[0.05, 0.1], [0.05, 0.1]], el: [0.18, 0.18] };
const NETBALLS = [[53.7, -2.7], [54.0, -0.7], [53.4, 0.9], [54.05, 1.7], [53.55, 2.5], [53.95, 3.05]];
const SAD = { ...EXPR.sad, lid: 0.7 };
// tt: seconds since the seventh went in. They stand one behind another along the pitch (the frame is narrow): one
// nearest us with his back to us, one bent over, one with his hands on his head, the goalkeeper sitting in his goal
function aftermath(t, tt, { balls = true, more = false, front = true } = {}) {
  const k = ease.inOut(clamp((tt - 0.55) / 1.2)), br = 0.03 * Math.sin(t * 2.4);
  const items = [
    P(GK, onGrass(GK, { x: 51.6, z: 0.3, head: PI + 0.2, pose: blend(SIT_UP, SLUMP, k), e: k < 0.4 ? { ...EXPR.shock, lid: lerp(0.2, 1, clamp(tt / 0.4)), sweat: 0 } : { ...EXPR.sad, lid: 1 }, t }, true)),
    ...(front ? [P(NKW[6], { x: 46.5, z: 0.1, head: 0.1 + 0.12 * ease.inOut(clamp((tt - 0.4) / 2.4)), pose: { ...POSE.stand(), ...HIPS, lean: HIPS.lean + br, look: lerp(-0.1, -0.95, ease.inOut(clamp((tt - 0.3) / 2.2))) }, e: SAD, t: t + 2 })] : []),
    P(NKW[3], { x: 49.4, z: -1.6, head: PI - 0.5, pose: { ...POSE.stand(), ...BENT, lean: BENT.lean + br }, e: SAD, t: t + 1 }),
    P(NKW[9], { x: 50.3, z: 2.0, head: PI - 0.35, pose: blend(blend(POSE.stand(), SQUAT, ease.inOut(clamp((tt - 0.7) / 2.0))), POSE.handsOnHead(), 1), e: { ...EXPR.worried, look: [0, 0.5] }, t: t + 3 }),
  ];
  if (more) items.push(P(NKW[4], onGrass(NKW[4], { x: 48.2, z: 3.4, head: PI * 0.5 + 0.9, pose: { ...POSE.sit(), look: -0.7 }, e: SAD, t: t + 4 }, true)));
  if (balls) for (const [x, z] of NETBALLS) items.push(BALL([x, BALL_R, z]));
  return items;
}

// ---------- the anthem line and the squad line: eleven side by side, facing us
const ANTHEM = { sh: [[0.08, 0.1], [0.5, 0.05]], el: [0.3, 2.05], fore: [0.1, -0.7], lean: 0.0 };  // the right hand on the heart
function lineItems(players, t, { z = 0, x0 = -7.5, dx = 1.5, pose = () => POSE.stand(), e = () => 'focus' } = {}) {
  return players.map((pl, i) => P(pl, { x: x0 + i * dx, z, head: -PI / 2, pose: { ...POSE.stand(), ...pose(i), lean: (pose(i).lean ?? 0.02) + 0.01 * Math.sin(t * 1.7 + i) }, e: e(i), t: t + i * 1.3 }));
}

// ================= THE TELEVISION =================
// A room in Pyongyang lit by a television set, drawn flat: the set on its cabinet, three heads in front of it. The
// picture on the screen is whatever `screen` draws (the match is rendered whole and cropped to 4:3)
const TV = { x: 172, y: 520, w: 612, h: 459 };
function tvRoom(g, t, screen, { glow = [150, 190, 235], lum = 0.6, zoom = 1, power = 1 } = {}) {
  g.save();
  g.translate(W / 2 + 4 * Math.sin(t * 0.7), 760 + 3 * Math.sin(t * 0.9 + 1)); g.scale(zoom, zoom); g.translate(-W / 2, -760);
  const wg = g.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#1C2B2E'); wg.addColorStop(0.62, '#131E21'); wg.addColorStop(1, '#0A1012'); g.fillStyle = wg; g.fillRect(-120, -120, W + 240, H + 240);
  g.fillStyle = 'rgba(255,255,255,0.018)'; for (let x = -100; x < W + 100; x += 54) g.fillRect(x, -120, 22, 1380);
  g.fillStyle = '#0D1416'; g.fillRect(-120, 1250, W + 240, 30);
  const fg = g.createLinearGradient(0, 1280, 0, H); fg.addColorStop(0, '#1B1512'); fg.addColorStop(1, '#0A0807'); g.fillStyle = fg; g.fillRect(-120, 1280, W + 240, H);
  const fl = power * lum * (0.86 + 0.14 * Math.sin(t * 23) * Math.sin(t * 7.3)), col = a => `rgba(${glow[0]},${glow[1]},${glow[2]},${a.toFixed(3)})`;
  { const rg = g.createRadialGradient(W / 2, 760, 120, W / 2, 760, 980); rg.addColorStop(0, col(0.4 * fl)); rg.addColorStop(1, col(0)); g.fillStyle = rg; g.fillRect(-120, -120, W + 240, H + 240); }
  // the cabinet and its cloth
  g.fillStyle = '#2B1F17'; g.beginPath(); g.roundRect(80, 1124, 920, 150, 8); g.fill(); g.fillStyle = '#3A2A1F'; g.fillRect(80, 1124, 920, 16);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(540, 1146); g.lineTo(540, 1270); g.stroke();
  g.fillStyle = 'rgba(232,226,210,0.86)'; g.beginPath(); g.moveTo(250, 1122); g.lineTo(830, 1122); g.lineTo(790, 1176); g.lineTo(540, 1196); g.lineTo(290, 1176); g.closePath(); g.fill();
  // the aerial, the set
  g.strokeStyle = '#6B6259'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(540, 472); g.lineTo(372, 236); g.moveTo(540, 472); g.lineTo(704, 248); g.stroke();
  g.fillStyle = '#3B3029'; g.beginPath(); g.ellipse(540, 470, 46, 14, 0, 0, 2 * PI); g.fill();
  g.fillStyle = '#2E241D'; g.beginPath(); g.roundRect(130, 470, 820, 660, 26); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(150, 474, 780, 6);
  g.fillStyle = '#1B1512'; g.beginPath(); g.roundRect(150, 494, 656, 512, 34); g.fill();
  g.save(); g.beginPath(); g.roundRect(TV.x, TV.y, TV.w, TV.h, 30); g.clip(); g.fillStyle = '#05080A'; g.fillRect(TV.x, TV.y, TV.w, TV.h);
  screen(g, TV.x, TV.y, TV.w, TV.h);
  g.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = TV.y; y < TV.y + TV.h; y += 4) g.fillRect(TV.x, y, TV.w, 1.5);
  { const vg = g.createRadialGradient(TV.x + TV.w / 2, TV.y + TV.h / 2, TV.h * 0.35, TV.x + TV.w / 2, TV.y + TV.h / 2, TV.w * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = vg; g.fillRect(TV.x, TV.y, TV.w, TV.h); }
  { const gl = g.createLinearGradient(TV.x, TV.y, TV.x + TV.w * 0.6, TV.y + TV.h * 0.7); gl.addColorStop(0, 'rgba(255,255,255,0.09)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(TV.x, TV.y, TV.w, TV.h); }
  g.restore();
  g.fillStyle = '#15100D'; for (let i = 0; i < 9; i++) g.fillRect(836, 524 + i * 16, 84, 6);
  for (const ky of [760, 852]) { g.fillStyle = '#3B3029'; g.beginPath(); g.arc(878, ky, 30, 0, 2 * PI); g.fill(); g.strokeStyle = '#1B1512'; g.lineWidth = 5; g.beginPath(); g.moveTo(878, ky); g.lineTo(878 + 20 * Math.cos(ky), ky - 20 * Math.abs(Math.sin(ky))); g.stroke(); }
  g.fillStyle = power > 0.5 ? '#FF5A4F' : '#3A1512'; g.beginPath(); g.arc(878, 940, 7, 0, 2 * PI); g.fill();
  // three watching, from behind: dark against the screen, the light catching the tops of their heads
  for (const [x0, y, r, bun] of [[232, 1640, 112, 0], [556, 1716, 84, 1], [860, 1630, 118, 0]]) {
    const x = x0 + 3 * Math.sin(t * 0.8 + x0), dark = '#080B0E';
    g.fillStyle = dark; g.beginPath(); g.moveTo(x - r * 2.3, H + 200); g.bezierCurveTo(x - r * 2.3, y + r * 1.35, x - r * 0.9, y + r * 1.25, x - r * 0.42, y + r * 0.9); g.lineTo(x + r * 0.42, y + r * 0.9);
    g.bezierCurveTo(x + r * 0.9, y + r * 1.25, x + r * 2.3, y + r * 1.35, x + r * 2.3, H + 200); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(x, y, r * 0.86, r, 0, 0, 2 * PI); g.fill();
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * r * 0.86, y + r * 0.12, r * 0.16, r * 0.24, 0, 0, 2 * PI); g.fill(); }
    if (bun) { g.beginPath(); g.arc(x, y - r * 1.08, r * 0.3, 0, 2 * PI); g.fill(); }
    // the light of the screen on them: the crown of the head, the tops of the shoulders
    g.strokeStyle = col(0.85 * fl); g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.ellipse(x, y, r * 0.86 - 4, r - 4, 0, PI * 1.14, PI * 1.86); g.stroke();
    g.strokeStyle = col(0.4 * fl); g.lineWidth = 6; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x + sd * r * 0.75, y + r * 1.12); g.quadraticCurveTo(x + sd * r * 1.5, y + r * 1.26, x + sd * r * 2.05, y + r * 1.62); g.stroke(); }
  }
  g.restore();
}
function tvCard(g, x, y, w, h, t) {  // the Brazil match, shown on tape: a scoreline card
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#1D3A6B'); gr.addColorStop(1, '#0E1F3F'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  const row = (yy, name, sc, col, ink) => { g.fillStyle = col; g.fillRect(x + 46, yy, w - 92, 94); g.fillStyle = ink; g.font = sans(52, 900); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(name, x + 72, yy + 50); g.textAlign = 'right'; g.fillText(String(sc), x + w - 72, yy + 50); };
  row(y + 96, 'BRAZIL', 2, '#F2C200', '#12315E'); row(y + 208, 'KOREA DPR', 1, NKRED, '#FFFFFF');
  g.fillStyle = 'rgba(255,255,255,0.78)'; g.font = sans(28, 800); g.textAlign = 'center'; g.fillText('15 JUNE 2010 · ON TAPE', x + w / 2, y + 366);
  const ly = y + ((t * 90) % (h + 40)) - 20; g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x, ly, w, 14);
}
function tvNoise(g, x, y, w, h, t) {
  let r = (Math.floor(t * 30) * 9301 + 49297) % 233280;
  for (let i = 0; i < 520; i++) { r = (r * 9301 + 49297) % 233280; const px = x + (r / 233280) * w; r = (r * 9301 + 49297) % 233280; const py = y + (r / 233280) * h; r = (r * 9301 + 49297) % 233280; const v = 60 + Math.floor((r / 233280) * 190); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(px, py, 26, 5); }
}
// the match as the set shows it: the ground rendered whole from the main stand, small figures for the players, then
// cropped to the screen. dots: [x, z, shirt, shorts]
function tvFeed(t, cam, dots, ballPos = null) {
  rig(B, 0, [[0, cam]], { t, shake: 0 });
  tvx.setTransform(1, 0, 0, 1, 0, 0); tvx.clearRect(0, 0, W, H);
  stadium(tvx, t, [], { cheer: 0.2 });
  const list = dots.map(d => ({ d, p: B.project(d[0], 0, d[1]) })).filter(o => o.p.z > 1).sort((a, b) => b.p.z - a.p.z);
  for (const { d, p } of list) {
    const s = p.s;
    tvx.fillStyle = 'rgba(0,0,0,0.25)'; tvx.beginPath(); tvx.ellipse(p.x + 0.1 * s, p.y, 0.34 * s, 0.1 * s, 0, 0, 2 * PI); tvx.fill();
    tvx.fillStyle = d[3]; tvx.fillRect(p.x - 0.13 * s, p.y - 0.9 * s, 0.26 * s, 0.9 * s);
    tvx.fillStyle = d[2]; tvx.fillRect(p.x - 0.21 * s, p.y - 1.5 * s, 0.42 * s, 0.68 * s);
    tvx.fillStyle = '#D9B08C'; tvx.beginPath(); tvx.arc(p.x, p.y - 1.66 * s, 0.15 * s, 0, 2 * PI); tvx.fill();
  }
  if (ballPos) { const p = B.project(ballPos[0], ballPos[1] ?? 0.15, ballPos[2]); if (p.z > 1) { tvx.fillStyle = '#FFFFFF'; tvx.beginPath(); tvx.arc(p.x, p.y, Math.max(3, 0.16 * p.s), 0, 2 * PI); tvx.fill(); } }
  rain(tvx, t, 1.2);
}
const tvCrop = (g, x, y, w, h) => { const ch = W * h / w; g.drawImage(TVB, 0, H * 0.5 - ch / 2, W, ch, x, y, w, h); };
function tvBug(g, x, y, text) {
  g.fillStyle = 'rgba(244,242,236,0.92)'; g.fillRect(x + 22, y + 22, 248, 40); g.fillStyle = '#12161C'; g.font = sans(24, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x + 146, y + 43);
}
function tvWorkers(g, x, y, w, h, t) {  // what the broadcast cut to: workers at their machines, fists raised
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#5A6F86'); gr.addColorStop(1, '#2C3A4A'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.fillStyle = '#22303E'; g.fillRect(x, y + h * 0.58, w, h * 0.42); g.fillRect(x + w * 0.04, y + h * 0.22, w * 0.17, h * 0.5); g.fillRect(x + w * 0.76, y + h * 0.3, w * 0.22, h * 0.4);
  { const cx = x + w * 0.87, cy = y + h * 0.4, r = h * 0.13; g.strokeStyle = '#8FA2B6'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, r, 0, 2 * PI); g.stroke(); for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * PI / 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); g.stroke(); } }
  g.fillStyle = '#B81C24'; g.fillRect(x, y + h * 0.04, w, h * 0.12); g.fillStyle = 'rgba(255,240,200,0.9)'; for (let i = 0; i < 9; i++) g.fillRect(x + w * (0.065 + i * 0.1), y + h * 0.078, w * 0.062, h * 0.044);  // a slogan: blocks, no words
  for (let i = 0; i < 3; i++) {
    const cx = x + w * (0.28 + i * 0.2), by = y + h * 1.03, k = 0.5 + 0.5 * Math.sin(t * 6.5 + i * 1.3), hs = h * 0.1, col = ['#3E5B7A', '#4C6B55', '#3E5B7A'][i];
    g.fillStyle = col; g.beginPath(); g.roundRect(cx - hs * 1.5, by - h * 0.43, hs * 3, h * 0.46, hs * 0.5); g.fill();
    g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = hs * 0.78; g.beginPath(); g.moveTo(cx + hs * 1.1, by - h * 0.37); g.lineTo(cx + hs * 1.65, by - h * (0.57 + 0.07 * k)); g.stroke();
    g.fillStyle = '#D9B08C'; g.beginPath(); g.arc(cx + hs * 1.65, by - h * (0.6 + 0.07 * k), hs * 0.44, 0, 2 * PI); g.fill();
    g.beginPath(); g.arc(cx, by - h * 0.52, hs, 0, 2 * PI); g.fill();
    g.fillStyle = '#263647'; g.beginPath(); g.arc(cx, by - h * 0.54, hs * 1.04, PI, 2 * PI); g.fill(); g.fillRect(cx - hs * 1.25, by - h * 0.55, hs * 2.5, hs * 0.26);
  }
}
function tvDark(g, x, y, w, h, p) {  // switched off: the picture folds to a line and goes
  g.fillStyle = '#04070A'; g.fillRect(x, y, w, h);
  if (p < 0.5) { const q = ease.out(p / 0.5), hh = Math.max(3, h * (1 - q)); g.fillStyle = `rgba(230,240,250,${(0.9 - 0.3 * q).toFixed(3)})`; g.fillRect(x + w * 0.02, y + h / 2 - hh / 2, w * 0.96, hh); }
  else if (p < 1) { const q = (p - 0.5) / 0.5, ww = w * 0.96 * (1 - q); g.fillStyle = `rgba(230,240,250,${(0.8 * (1 - q)).toFixed(3)})`; g.fillRect(x + w / 2 - ww / 2, y + h / 2 - 2, ww, 4); }
}
// small figures for the feed: two lines of white, the reds coming at them; they shift a little so the picture lives
const feedDots = (t, k = 1) => {
  const out = [], j = (i, a) => a * Math.sin(t * 0.7 + i * 1.9);
  [[36, -10], [35, -3], [35.5, 4], [36, 11], [28, -12], [27, -5], [27.5, 2], [28, 9], [20, -2], [19, 6]].forEach(([x, z], i) => out.push([x + j(i, 1.2 * k), z + j(i + 3, 0.9 * k), '#F4F5F2', '#E2E5E2']));
  [[22, -9], [18, 1], [23, 8], [12, -6], [10, 5], [26, -1], [5, 0], [31, 6]].forEach(([x, z], i) => out.push([x + j(i + 5, 1.6 * k), z + j(i + 8, 1.1 * k), '#B81226', '#96101F']));
  out.push([50.5 + j(1, 0.3 * k), j(2, 0.8 * k), '#2F8F5B', '#1C1D21']);
  return out;
};
const FEED_CAM = K(0.0, 0.34, 60, [27, 0, 1]);

// ================= THE HALL =================
// A stage, a dark red curtain with banners, a lectern, the squad standing in two rows, their coach apart; the hall below
// full of heads. Drawn after Radio Free Asia's description; nobody outside has seen the room
// the six hours, as a clock face on the screen: the hands go round from ten to four
function hudClock(g, x, y, r, mins, a = 1, sweep = 0) {  // sweep: minutes the long hand moved since the last frame
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.arc(0, 8, r * 1.1, 0, 2 * PI); g.fill();
  g.fillStyle = '#2B2422'; g.beginPath(); g.arc(0, 0, r * 1.1, 0, 2 * PI); g.fill();
  g.fillStyle = '#F1ECE0'; g.beginPath(); g.arc(0, 0, r, 0, 2 * PI); g.fill();
  g.strokeStyle = '#2B2422'; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { const an = i / 12 * 2 * PI; g.lineWidth = i % 3 ? 4 : 8; g.beginPath(); g.moveTo(Math.sin(an) * r * 0.9, -Math.cos(an) * r * 0.9); g.lineTo(Math.sin(an) * r * (i % 3 ? 0.8 : 0.72), -Math.cos(an) * r * (i % 3 ? 0.8 : 0.72)); g.stroke(); }
  const hand = (an, l, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(an) * l, -Math.cos(an) * l); g.stroke(); };
  const ma = (mins % 60) / 60 * 2 * PI;
  if (sweep > 1 && g.createConicGradient) {  // a fast hand leaves a fading fan behind it: one spin, not a hand hopping round the dial
    const da = Math.min(sweep / 60 * 2 * PI, 5.2), th = ma - PI / 2, p = da / (2 * PI), cg = g.createConicGradient(th - da, 0, 0);
    cg.addColorStop(0, 'rgba(32,38,44,0)'); cg.addColorStop(p, 'rgba(32,38,44,0.42)'); cg.addColorStop(p + 0.002, 'rgba(32,38,44,0)'); cg.addColorStop(1, 'rgba(32,38,44,0)');
    g.fillStyle = cg; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * 0.78, th - da, th); g.closePath(); g.fill();
  }
  hand(((mins / 60) % 12) / 12 * 2 * PI, r * 0.5, 12, '#20262C'); hand(ma, r * 0.78, 8, '#20262C');
  g.fillStyle = '#B81C24'; g.beginPath(); g.arc(0, 0, r * 0.08, 0, 2 * PI); g.fill();
  qaRect(g, -r * 1.1, -r * 1.1, r * 2.2, r * 2.2, 'text', 'clock');
  g.restore();
}
function hallSet(g, t, { spot = [0, 3.2], spotA = 1, hot = null, hotA = 0 } = {}) {
  g.fillStyle = '#0A0506'; g.fillRect(0, 0, W, H);
  const quad = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  quad([[-16, -1, 6.4], [16, -1, 6.4], [16, 11, 6.4], [-16, 11, 6.4]], '#4A1014');
  for (let x = -16; x < 16; x += 0.8) quad([[x, -1, 6.39], [x + 0.34, -1, 6.39], [x + 0.34, 11, 6.39], [x, 11, 6.39]], 'rgba(0,0,0,0.2)');
  for (const [x0, x1] of [[-8.6, -6.0], [-1.4, 1.4], [6.0, 8.6]]) { quad([[x0, 1.5, 6.3], [x1, 1.5, 6.3], [x1, 8.2, 6.3], [x0, 8.2, 6.3]], '#9C1A20'); quad([[x0, 1.5, 6.29], [x1, 1.5, 6.29], [x1, 1.72, 6.29], [x0, 1.72, 6.29]], '#C9A05A'); }
  quad([[-16, -1, -16], [16, -1, -16], [16, -1, 0], [-16, -1, 0]], '#120D0B');
  quad([[-10.5, 0, 0], [10.5, 0, 0], [10.5, 0, 6.4], [-10.5, 0, 6.4]], '#5A3A22');
  for (let z = 0.8; z < 6.4; z += 0.8) quad([[-10.5, 0.005, z], [10.5, 0.005, z], [10.5, 0.005, z + 0.04], [-10.5, 0.005, z + 0.04]], 'rgba(0,0,0,0.22)');
  quad([[-10.5, -1, 0], [10.5, -1, 0], [10.5, 0, 0], [-10.5, 0, 0]], '#2A1A0F');
  // the pool of light on the boards
  { const c = B.project(spot[0], 0, spot[1]), rx = c.s * 4.6, ry = c.s * 1.5; g.save(); g.globalCompositeOperation = 'screen'; g.translate(c.x, c.y); g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx); rg.addColorStop(0, `rgba(255,226,180,${(0.34 * spotA).toFixed(3)})`); rg.addColorStop(1, 'rgba(255,226,180,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, 2 * PI); g.fill(); g.restore(); }
  if (hot && hotA > 0.01) {  // the one being named: a hard white pool at his feet
    const c = B.project(hot[0], 0, hot[1]), rx = c.s * 0.95, ry = c.s * 0.34; g.save(); g.globalCompositeOperation = 'screen'; g.translate(c.x, c.y); g.scale(1, ry / rx);
    const rg = g.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx); rg.addColorStop(0, `rgba(255,246,226,${(0.6 * hotA).toFixed(3)})`); rg.addColorStop(0.7, `rgba(255,246,226,${(0.28 * hotA).toFixed(3)})`); rg.addColorStop(1, 'rgba(255,246,226,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, 2 * PI); g.fill(); g.restore();
  }
}
const SEATS = (() => { const r = rng(41), out = []; for (let row = 0; row < 9; row++) for (let x = -9.6 + (row % 2) * 0.4; x <= 9.6; x += 0.82) out.push({ x: x + (r() - 0.5) * 0.16, z: -1.2 - row * 0.9, h: 0.24 + r() * 0.1, c: r(), ph: r() * 6 }); return out.sort((a, b) => b.z - a.z); })();
function audience(g, t) {  // four hundred watching: heads and shoulders, dark
  for (const s of SEATS) {
    const y = -1 + 1.0 + s.h, hd = B.project(s.x + 0.012 * Math.sin(t * 0.9 + s.ph), y, s.z); if (hd.z < 0.8) continue;
    const sh = B.project(s.x, y - 0.27, s.z), col = mix('#07080B', '#17191F', s.c);
    g.fillStyle = col; g.beginPath(); g.ellipse(sh.x, sh.y, 0.29 * sh.s, 0.17 * sh.s, 0, 0, 2 * PI); g.fill(); g.beginPath(); g.arc(hd.x, hd.y, 0.115 * hd.s, 0, 2 * PI); g.fill();
    g.strokeStyle = 'rgba(255,196,160,0.3)'; g.lineWidth = Math.max(1.5, 0.014 * hd.s); g.beginPath(); g.arc(hd.x, hd.y, 0.108 * hd.s, PI * 1.16, PI * 1.84); g.stroke();  // the stage lights on the tops of their heads
  }
}
const HALL_ROWS = [[-2.2, 2.5], [-1.1, 2.5], [0, 2.5], [1.1, 2.5], [2.2, 2.5], [-2.75, 3.7], [-1.65, 3.7], [-0.55, 3.7], [0.55, 3.7], [1.65, 3.7]];
const COACH_AT = [4.1, 1.5], LECTERN = [-4.0, 1.3];
const HALL_ORDER = HALL_ROWS.map((_, i) => i).sort((a, b) => HALL_ROWS[a][0] - HALL_ROWS[b][0]), HALL_RANK = [];  // along the stage, left to right
HALL_ORDER.forEach((i, k) => { HALL_RANK[i] = k; });
const hotSpot = r => { const a = HALL_ROWS[HALL_ORDER[clamp(Math.floor(r), 0, 9)]], b = HALL_ROWS[HALL_ORDER[clamp(Math.floor(r) + 1, 0, 9)]], u = r - Math.floor(r); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
// point: 0..1, the players' arms going out toward their coach one after another, nearest first
function hallItems(t, { point = 0, sweep = 0, hot = -9, hotA = 0 } = {}) {
  const items = [];
  HALL_ROWS.forEach(([x, z], i) => {
    const pl = NKT[i + 1], near = (x + 3) / 6, u = ease.inOut(clamp(point * 2.2 - (1 - near) * 1.2));
    const wv = hotA * clamp(1 - Math.abs(hot - HALL_RANK[i]) * 1.5);  // his turn: the head goes lower, the shoulders in
    const base = { ...POSE.stand(), ...DOWNCAST, lean: 0.1 + 0.07 * wv + 0.01 * Math.sin(t * 1.5 + i), look: lerp(-0.9, -1.4, wv), sh: [[0.05, 0.1 - 0.05 * wv], [0.05, 0.1 - 0.05 * wv]] };
    const aim = Math.atan2(COACH_AT[1] - z, COACH_AT[0] - x), arm = { sh: [[1.5, 1.25], base.sh[1]], el: [0.06, base.el[1]], look: -0.25 };
    items.push(P(pl, { x, z, head: -PI / 2 + u * clamp(aim + PI / 2, -0.2, 0.7) * 0.6, pose: blend(base, arm, u), e: u > 0.5 ? { ...EXPR.worried, look: [0.5, 0.3] } : wv > 0.5 ? { ...EXPR.worried, look: [0, 0.8], lid: 0.5 } : SAD, t: t + i * 1.1 }));
  });
  items.push(P(COACH, { x: COACH_AT[0], z: COACH_AT[1], head: -PI / 2 - 0.1, pose: { ...POSE.stand(), lean: lerp(0.08, 0.2, point), look: lerp(-0.6, -1.25, point), sh: [[0.04, 0.08], [0.04, 0.08]], el: [0.15, 0.15] }, e: { ...EXPR.sad, lid: lerp(0.6, 1, point) }, t: t + 9 }));
  // the commentator at the lectern, going down the line with his finger
  const sw = -0.32 + 0.16 * Math.sin(sweep * 2.2), jab = 0.1 * Math.sin(sweep * 9);
  items.push(P(SPEAKER, { x: LECTERN[0], z: LECTERN[1] + 0.75, head: sw, pose: { ...POSE.stand(), sh: [[0.2, 0.25], [1.52 + jab, 0.06]], el: [1.1, 0.08 + 0.1 * Math.abs(Math.sin(sweep * 9))], lean: 0.14 }, e: 'angry', t: t + 5 }));
  items.push(P(MINISTER, { x: -5.2, z: 2.7, head: -0.9, pose: { ...POSE.stand(), sh: [[-0.35, 0.12], [-0.35, 0.12]], el: [0.6, 0.6], lean: 0.0 }, e: { ...EXPR.angry, open: 0 }, t: t + 7 }));
  items.push({ d: depth(LECTERN[0], 0.6, LECTERN[1]), draw: gg => box(gg, B, [LECTERN[0] - 0.42, 0, LECTERN[1] - 0.3], [LECTERN[0] + 0.42, 1.14, LECTERN[1] + 0.3], { top: '#7A5A36', side: '#3E2A16', front: '#5A3E22' }) });
  return items;
}

// ================= THE PAPERS =================
function deskSet(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#231A13'); bg.addColorStop(1, '#0E0A07'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 3; for (let y = 90; y < H; y += 170) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 26, W * 0.7, y - 22, W, y + 12); g.stroke(); }
  const rg = g.createRadialGradient(780, 380, 60, 780, 380, 1100); rg.addColorStop(0, `rgba(255,214,150,${(0.3 + 0.015 * Math.sin(t * 5)).toFixed(3)})`); rg.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
function sheet(g, x, y, w, h, rot, a, draw) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
  g.fillStyle = '#F2EEE4'; g.fillRect(-w / 2, -h / 2, w, h);
  draw(g, w, h); g.restore();
}
const lines = (g, w, y0, n, lh = 34) => { g.fillStyle = 'rgba(40,44,52,0.28)'; for (let i = 0; i < n; i++) g.fillRect(-w / 2 + 56, y0 + i * lh, (w - 112) * (i === n - 1 ? 0.55 : 1 - 0.07 * ((i * 7) % 3)), 10); };

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: RAIN_G, trans: 'cut', noJump: true, ...o });

  // ======================= HOOK: the seventh goes in. The goalkeeper on his knees, seven balls in his net, the others
  // where they stopped, the rain coming down; the camera backs away from him =======================
  const ctxS = s('ctx'), HIT = 0.1;
  const hookBall = new BallPath([
    { t0: -1, t1: HIT, kind: 'air', from: [36.5, 0.9, -7.5], to: [53.75, 1.55, -1.7], g: 3 },
    { t0: HIT, t1: HIT + 0.42, kind: 'air', from: [53.75, 1.55, -1.7], to: [53.35, BALL_R, -1.45] },
    { t0: HIT + 0.42, t1: HIT + 1.3, kind: 'roll', from: [53.35, -1.45], to: [53.0, -1.15], decay: 2.5 },
    { t0: HIT + 1.3, t1: 99, kind: 'hold', from: [53.0, BALL_R, -1.15] },
  ]);
  shot(0, (g, lt, t) => {
    rig(B, lt, [[0, K(-PI / 2 + 0.22, 0.34, 9.0, [51.2, 0.9, 0.2], { cy: H * 0.47 })], [0.5, K(-PI / 2 + 0.21, 0.34, 9.2, [51.2, 0.9, 0.2], { cy: H * 0.47 })],
      [3.9, K(-PI / 2 + 0.1, 0.42, 13.2, [49.9, 0.9, 0.3], { cy: H * 0.5 }), ease.inOut]], { t, e: lin, shake: t < HIT ? 0.6 : 0.3 + 1.6 * (1 - clamp((t - HIT) / 0.4)) });
    const b = hookBall.at(t);
    stadium(g, t, [...aftermath(t, t - HIT), BALL(b.pos, { spin: b.spin, axis: b.axis })], { cheer: 0.3, blur: 2.5, hit: { t0: HIT, y: 1.55, z: -1.7, k: 1.3 } });
    rain(g, t, 1);
  }, { kb: 0, mbStep: 3, mbMax: 24, hud: (g, lt, t) => {
    scoreBug(g, 0, 7, "89'", { hot: 1 - clamp((t - HIT) / 0.5) });
    bigText(g, 'NORTH KOREA 0–7', 'WORLD CUP 2010', 300);
  } });
  cue(0, 'whoosh_fast', 0.25); cue(HIT - 0.03, 'net', 0.85); cue(HIT, 'thud', 0.45); cue(HIT, 'boom_cine', 0.4); cue(HIT + 0.1, 'crowd_roar', 0.3);

  // ======================= 2010: the first World Cup in 44 years. The anthem at their first match, at night, in red =======================
  const liveS = s('live'), fortyT = w('ctx', 'forty-four');
  shot(ctxS - 0.06, (g, lt, t) => {
    const L = liveS - ctxS + 0.3, u = clamp(lt / L);
    rig(B, lt, [[0, K(lerp(0.22, 0.16, u), 0.02, lerp(4.7, 4.5, u), [lerp(-2.6, 1.9, u), 1.5, 0])]], { t, e: lin, shake: 0.3 });
    stadium(g, t, lineItems(NKR, t, { pose: () => ANTHEM, e: i => (i === 10 ? { ...EXPR.sad, lid: 0.9 } : i % 3 === 1 ? { ...EXPR.focus, lid: 0.9 } : 'focus') }),
      { stad: ELLIS, boards: BOARDS_J, cheer: 0.6, blur: 3, skyO: NIGHT, pitchO: {} });
  }, { grade: NIGHT_G, kb: 0, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    placeStamp(g, lt, 'South Africa', '2010', { y: 190, t0: 0.1 });
    if (t > fortyT - 0.05) counter(g, '44', 'YEARS SINCE THEIR LAST WORLD CUP', { y: 430, size: 150, color: CREAM, at: [t, fortyT - 0.05] });
  } });
  cue(ctxS - 0.06, 'whoosh_soft', 0.3); cue(fortyT - 0.05, 'stamp', 0.3);

  // ======================= "A narrow loss to Brazil": the goal North Korea scored in it (Ji Yun-nam, 89'), at night, in red =======================
  const halfS = s('half'), brazT = w('live', 'Brazil,'), nextT = w('live', 'The'), liveT = w('live', 'live.'), firstT = w('live', 'first.');
  const tvA = w('live', 'state') - 0.14, kickB = liveS + 0.62, netB = kickB + 0.34;
  const bM = new Mover([[liveS - 1.2, 34.5, 4.4], [kickB, 44.6, 1.5], [kickB + 0.55, 46.6, 1.2], [kickB + 1.5, 49.4, 5.2], [99, 55, 9]]);
  const bgM = new Mover([[liveS - 1.2, 51.6, -0.2], [kickB - 0.05, 48.5, 0.6], [kickB + 0.55, 47.6, 0.85, { stop: true }], [99, 47.6, 0.85]]);
  const b1M = new Mover([[liveS - 1.2, 36.2, 1.8], [kickB, 43.9, -0.4], [kickB + 1.3, 47.0, -1.0, { stop: true }], [99, 47.0, -1.0]]);
  const b2M = new Mover([[liveS - 1.2, 37.4, 6.2], [kickB, 44.6, 3.6], [kickB + 1.3, 47.6, 3.4, { stop: true }], [99, 47.6, 3.4]]);
  const braBall = new BallPath([
    { t0: liveS - 1.2, t1: kickB, kind: 'roll', from: [33.0, 10.2], to: [45.05, 1.35], decay: 1.1 },
    { t0: kickB, t1: netB, kind: 'air', from: [45.05, BALL_R, 1.35], to: [53.9, 0.45, -1.4], g: 2.4 },
    { t0: netB, t1: netB + 0.45, kind: 'air', from: [53.9, 0.45, -1.4], to: [53.5, BALL_R, -1.6] },
    { t0: netB + 0.45, t1: 99, kind: 'hold', from: [53.5, BALL_R, -1.6] },
  ]);
  shot(liveS - 0.06, (g, lt, t) => {
    const m = bM.at(t), u = ease.inOut(clamp((t - kickB + 0.05) / 0.55)), on = clamp(t - netB, 0, 2);
    rig(B, lt, [[0, K(lerp(-PI / 2 - 0.16, -PI / 2 - 0.06, u) + 0.03 * on, lerp(0.2, 0.16, u), lerp(7.6, 8.6, u) - 0.4 * on, [lerp(m.x + 3.2, 50.3, u), 1.0, lerp(m.z - 0.3, -0.2, u)], { cy: H * 0.5 })]], { t, e: lin, shake: 0.9 });
    const ku = (t - (kickB - 0.3)) / 0.6, ms = moving(bM, t, { t });
    const shooter = ku > 0 && ku < 1 ? { ...ms, pose: POSE.kick(clamp(ku), 'L') } : t > kickB + 0.45 ? { ...ms, pose: blend(ms.pose, { sh: [[0.3, 1.25], [0.3, 1.25]], el: [0.2, 0.2] }, ease.inOut(clamp((t - kickB - 0.45) / 0.35))), e: 'happy' } : ms;
    const gs = moving(bgM, t, { t }), sl = ease.inOut(clamp((t - kickB + 0.2) / 0.3));
    const keeper = onGrass(BRAP[0], { ...gs, head: PI, pose: sl > 0 ? blend(grounded(BRAP[0], gs).pose, POSE.slide(), sl) : gs.pose, e: sl > 0.5 ? 'shock' : 'focus' });
    const b = braBall.at(t);
    stadium(g, t, [P(NKR[4], shooter), P(BRAP[0], keeper), P(BRAP[1], moving(b1M, t, { t: t + 1 })), P(BRAP[2], moving(b2M, t, { t: t + 2 })), BALL(b.pos, { spin: b.spin, axis: b.axis })],
      { stad: ELLIS, boards: BOARDS_J, cheer: t > netB ? 1 : 0.5, blur: 2.5, skyO: NIGHT, pitchO: {}, hit: { t0: netB, y: 0.45, z: -1.4, k: 1.1 } });
  }, { grade: NIGHT_G, kb: 0, mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame', 'face behind player'], hud: (g, lt, t) => {
    scoreBug(g, 2, t > netB ? 1 : 0, "89'", { hot: t > netB ? 1 - clamp((t - netB) / 0.6) : 0, L: 'BRA', R: 'PRK', lc: '#F5D31A', rc: NKRED });
    if (t > netB + 0.1) plate(g, 'BRAZIL 2–1 NORTH KOREA', W / 2, 300, { color: GOLD, size: 44, ...pin(t, netB + 0.1) });
  } });
  cue(liveS - 0.06, 'whoosh_fast', 0.25); cue(kickB - 0.02, 'kick', 0.55); cue(netB - 0.02, 'net', 0.65); cue(netB + 0.05, 'crowd_roar', 0.4);

  // ======================= LIVE: a room in Pyongyang. That match on tape, a day late; then the next one, live =======================
  shot(tvA, (g, lt, t) => {
    const onAir = t > nextT + 0.16;
    if (onAir) { const bx = 24 + 8 * Math.sin(t * 0.9); tvFeed(t, { ...FEED_CAM, target: [27 + 3 * Math.sin(t * 0.4), 0, 1] }, feedDots(t), [bx, 0.15, 3 * Math.sin(t * 1.3)]); }
    tvRoom(g, t, (gg, x, y, ww, hh) => {
      if (t < nextT) tvCard(gg, x, y, ww, hh, t);
      else if (!onAir) tvNoise(gg, x, y, ww, hh, t);
      else { tvCrop(gg, x, y, ww, hh); tvBug(gg, x, y, "PRK 0–0 POR"); }
    }, { zoom: 1 + 0.05 * clamp(lt / 1.8) + 0.3 * ease.inOut(clamp((t - nextT) / (firstT - nextT + 0.7))), glow: t < nextT ? [140, 170, 230] : [160, 205, 180], lum: 0.62 });
  }, { grade: ROOM_G, kb: 0, trans: 'fade', hud: (g, lt, t) => {
    if (t > tvA + 0.2) plate(g, 'PYONGYANG · STATE TELEVISION', W / 2, 250, { color: CREAM, size: 36, ...pin(t, tvA + 0.2) });
    if (t > tvA + 0.35 && t < nextT + 0.2) plate(g, 'SHOWN A DAY LATER, ON TAPE', W / 2, 345, { color: GOLD, size: 30, ...pin(t, tvA + 0.35, fadeOut(t, nextT)) });
    if (t > liveT) plate(g, '● LIVE · 21 JUNE 2010', W / 2, 345, { color: RED, size: 34, ...pin(t, liveT) });
    if (t > firstT) plate(g, 'THE FIRST MATCH ABROAD SHOWN LIVE', W / 2, 1440, { color: GOLD, size: 34, ...pin(t, firstT) });
  } });
  cue(tvA, 'radio_static', 0.3); cue(nextT, 'radio_static', 0.45); cue(liveT, 'sparkle_pop', 0.2); cue(firstT, 'stamp', 0.3);

  // ======================= HALF-TIME, only 1–0: the first goal (29'), run onto and put under the goalkeeper =======================
  const routS = s('rout'), kickH = halfS + 0.24, netH = kickH + 0.34, htT = w('half', '1–0.');
  const mM = new Mover([[halfS - 1.4, 35.5, -4.6], [kickH, 44.6, -1.7], [kickH + 0.55, 46.6, -1.3], [kickH + 1.7, 48.2, -4.2, { stop: true }], [99, 48.2, -4.2]]);
  const gkM = new Mover([[halfS - 1.4, 51.6, 0.2], [kickH - 0.05, 48.5, -0.7], [kickH + 0.55, 47.6, -0.95, { stop: true }], [99, 47.6, -0.95]]);
  const d1M = new Mover([[halfS - 1.4, 36.9, -1.9], [kickH, 43.9, 0.2], [kickH + 1.4, 47.2, 0.9, { stop: true }], [99, 47.2, 0.9]]);
  const d2M = new Mover([[halfS - 1.4, 38.0, -6.4], [kickH, 44.6, -3.7], [kickH + 1.4, 48.0, -3.9, { stop: true }], [99, 48.0, -3.9]]);
  const halfBall = new BallPath([
    { t0: halfS - 1.4, t1: kickH, kind: 'roll', from: [33.0, -10.5], to: [45.05, -1.55], decay: 1.1 },
    { t0: kickH, t1: netH, kind: 'air', from: [45.05, BALL_R, -1.55], to: [53.9, 0.42, 1.3], g: 2.4 },
    { t0: netH, t1: netH + 0.45, kind: 'air', from: [53.9, 0.42, 1.3], to: [53.5, BALL_R, 1.5] },
    { t0: netH + 0.45, t1: 99, kind: 'hold', from: [53.5, BALL_R, 1.5] },
  ]);
  shot(halfS - 0.06, (g, lt, t) => {
    const m = mM.at(t), u = ease.inOut(clamp((t - kickH + 0.05) / 0.55)), on = clamp(t - netH, 0, 2);
    rig(B, lt, [[0, K(lerp(-PI / 2 + 0.16, -PI / 2 + 0.06, u) - 0.03 * on, lerp(0.2, 0.16, u), lerp(7.6, 8.6, u) - 0.45 * on, [lerp(m.x + 3.2, 50.3, u), 1.0, lerp(m.z + 0.3, 0.2, u)], { cy: H * 0.5 })]], { t, e: lin, shake: 0.9 });
    const ku = (t - (kickH - 0.3)) / 0.6, ms = moving(mM, t, { t });
    const shooter = ku > 0 && ku < 1 ? { ...ms, pose: POSE.kick(clamp(ku), 'R') } : t > kickH + 0.5 ? { ...ms, pose: blend(ms.pose, POSE.armsUp(1), ease.inOut(clamp((t - kickH - 0.5) / 0.4))), e: 'happy' } : ms;
    const gs = moving(gkM, t, { t }), sl = ease.inOut(clamp((t - kickH + 0.2) / 0.3));
    const keeper = onGrass(GK, { ...gs, head: PI, pose: sl > 0 ? blend(grounded(GK, gs).pose, POSE.slide(), sl) : gs.pose, e: sl > 0.5 ? 'shock' : 'focus' });
    const b = halfBall.at(t);
    stadium(g, t, [P(PORP[0], shooter), P(GK, keeper), P(NKW[3], moving(d1M, t, { t: t + 1 })), P(NKW[5], moving(d2M, t, { t: t + 2 })), BALL(b.pos, { spin: b.spin, axis: b.axis })],
      { cheer: t > netH ? 1 : 0.3, blur: 2, hit: { t0: netH, y: 0.42, z: 1.3, k: 1.1 } });
    rain(g, t, 0.75);
  }, { kb: 0, mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame', 'face behind player'], hud: (g, lt, t) => {
    scoreBug(g, 0, t > netH ? 1 : 0, "29'", { hot: t > netH ? 1 - clamp((t - netH) / 0.6) : 0 });
    if (t > htT - 0.05) plate(g, 'HALF-TIME · 0–1', W / 2, 300, { color: GOLD, size: 46, ...pin(t, htT - 0.05) });
  } });
  cue(halfS - 0.06, 'whoosh_fast', 0.25); cue(kickH - 0.02, 'kick', 0.6); cue(netH - 0.02, 'net', 0.7); cue(netH + 0.05, 'crowd_roar', 0.4); cue(htT + 0.25, 'whistle', 0.35);

  // ======================= THE SECOND HALF: the rain, and six more. Six goals in six quick cuts, each ball into the net
  // from another side (in front of the goal, then from behind the net); then all of them standing in the rain =======================
  const tvS = s('tv'), g0 = routS + 0.95, GD = 0.43, sevenT = w('rout', '7–0.');
  shot(routS - 0.06, (g, lt, t) => {  // the rain over the ground: Portugal coming forward in numbers
    const u = clamp(lt / 1.1), adv = lt * 5.2;
    rig(B, lt, [[0, K(0.5, 0.27, 44, [30, 0, 0])], [1.1, K(0.44, 0.24, 37, [36, 0, 0])]], { t, e: lin, shake: 0.5 });
    const items = [];
    [[14, -11], [17, -2], [13, 7], [22, -7], [24, 5], [9, 0]].forEach(([x, z], i) => items.push(P(PORP[i], { x: x + adv, z, head: 0, pose: POSE.run(t * 9 + i * 1.7, 0.9, 0), e: 'focus', t: t + i })));
    [[33, -13], [32, -4], [32.5, 4], [33, 12], [40, -8], [39.5, 0], [40, 8]].forEach(([x, z], i) => items.push(P(NKW[i + 1], { x: x + adv * 0.55, z, head: 0.2 * Math.sin(i), pose: POSE.run(t * 8 + i * 2.1, 0.6, 0), e: 'worried', t: t + i })));
    items.push(P(GK, { x: 50.5, z: 0.3 * Math.sin(t * 2), head: PI, pose: { ...POSE.stand(), crouch: 0.08, sh: [[0.5, 0.5], [0.5, 0.5]], el: [0.9, 0.9] }, e: 'focus', t }));
    items.push(BALL([19 + adv, BALL_R, -2.6 + 0.5 * Math.sin(t * 7)], { spin: t * 14 }));
    stadium(g, t, items, { cheer: 0.5 });
    rain(g, t, 1.25);
  }, { kb: 0, mbStep: 3, mbMax: 16, hud: (g, lt, t) => {
    scoreBug(g, 0, 1, "46'");
    if (t > routS + 0.05) plate(g, 'THE SECOND HALF', W / 2, 300, { color: CREAM, size: 44, ...pin(t, routS + 0.05) });
  } });
  const GOALS = [  // scorer and minute; the ball's flight; where the goalkeeper is and which way he goes; who struck it, from where
    { name: 'SIMÃO', min: "53'", cam: 1, from: [44.6, 0.25, 4.6], to: [53.85, 0.5, -2.5], gk: [51.9, 0.9, -1], by: [44.1, 5.0], head: false },
    { name: 'ALMEIDA', min: "56'", cam: -1, from: [48.0, 2.45, -1.6], to: [53.7, 1.0, 2.3], gk: [52.0, -0.5, 1], by: [47.6, -1.7], head: true },
    { name: 'TIAGO', min: "60'", cam: 1, from: [45.2, 0.22, -3.2], to: [53.85, 0.9, 2.6], gk: [51.9, -0.8, 1], by: [44.7, -3.5], head: false },
    { name: 'LIÉDSON', min: "81'", cam: -1, from: [48.6, 0.22, 2.1], to: [53.8, 0.4, -1.6], gk: [52.0, 1.0, -1], by: [48.1, 2.4], head: false },
    { name: 'RONALDO', min: "87'", cam: 1, from: [49.4, 0.2, 0.8], to: [53.8, 0.3, 0.5], gk: [50.9, -1.0, -1], by: [48.9, 1.0], head: false },
    { name: 'TIAGO', min: "89'", cam: -1, from: [48.2, 2.4, 1.2], to: [53.7, 1.3, -2.4], gk: [52.0, 0.3, -1], by: [47.8, 1.3], head: true },
  ];
  GOALS.forEach((G, k) => {
    const a = g0 + k * GD, hitL = 0.2;
    const bp = new BallPath([
      { t0: -0.2, t1: hitL, kind: 'air', from: [lerp(G.from[0], G.to[0], -1), G.from[1], lerp(G.from[2], G.to[2], -1)], to: G.to, g: G.head ? 6 : 2.2 },
      { t0: hitL, t1: hitL + 0.4, kind: 'air', from: G.to, to: [G.to[0] - 0.4, BALL_R, G.to[2] * 0.9] },
      { t0: hitL + 0.4, t1: 9, kind: 'hold', from: [G.to[0] - 0.4, BALL_R, G.to[2] * 0.9] },
    ]);
    shot(a, (g, lt, t) => {
      const tz = G.to[2] * 0.35;
      if (G.cam > 0) rig(B, lt, [[0, K(-PI / 2 + 0.5 * Math.sign(G.from[2] || 1), 0.07, 7.6, [51.4, 1.15, tz], { cy: H * 0.55 })], [GD, K(-PI / 2 + 0.44 * Math.sign(G.from[2] || 1), 0.07, 7.0, [51.6, 1.15, tz], { cy: H * 0.55 })]], { t, e: lin, shake: 1.2 });
      else rig(B, lt, [[0, K(PI / 2 + 0.3 * Math.sign(G.to[2]), 0.05, 5.6, [51.7, 1.25, tz], { cy: H * 0.55 })], [GD, K(PI / 2 + 0.26 * Math.sign(G.to[2]), 0.05, 5.2, [51.7, 1.25, tz], { cy: H * 0.55 })]], { t, e: lin, shake: 1.2 });
      const b = bp.at(lt), du = clamp(0.3 + lt * 1.5), sd = G.gk[2];
      const keeper = k === 4  // the fifth: he is already on the ground, the net empty
        ? onGrass(GK, { x: G.gk[0], z: G.gk[1], head: PI + 0.6, pose: { ...POSE.slide(), lean: -0.9 }, e: 'shock', t }, true)
        : onGrass(GK, { x: G.gk[0], z: G.gk[1] + sd * 1.5 * lt / GD, head: PI, pose: POSE.dive(du, sd), e: 'shock', t });
      const shooter = { x: G.by[0], z: G.by[1], head: Math.atan2(G.to[2] - G.by[1], G.to[0] - G.by[0]), pose: G.head ? POSE.jump(clamp(0.5 + lt * 1.1), { arm: 'L', h: 0.5 }) : POSE.kick(clamp(0.55 + lt * 1.0), 'R'), e: 'focus', t };
      const mark = { x: G.by[0] + 1.5, z: G.by[1] - 1.1 * Math.sign(G.by[1] || 1), head: PI * 0.85, pose: POSE.run(t * 9, 0.7, 0), e: 'worried', t: t + 2 };
      const cast = G.cam > 0 ? [P(GK, keeper)] : [P(GK, keeper), P(PORP[(k + 1) % 6], shooter), P(NKW[2 + (k % 4)], mark)];
      stadium(g, t, [...cast, BALL(b.pos, { spin: b.spin, axis: b.axis })], { cheer: 0.8, blur: 2.5, hit: { t0: a + hitL, y: G.to[1], z: G.to[2], k: 1.3 } });
      rain(g, t, 1.3);
    }, { kb: 0, mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame', 'face behind player', 'player hidden'], hud: (g, lt, t) => {
      scoreBug(g, 0, lt > hitL ? k + 2 : k + 1, G.min, { hot: lt > hitL ? 1 - clamp((lt - hitL) / 0.3) : 0 });
      plate(g, `${G.name} ${G.min}`, W / 2, 300, { color: k % 2 ? CREAM : GOLD, size: 52, ...pin(t, a) });
    } });
    cue(a - 0.02, 'kick', 0.4); cue(a + hitL - 0.02, 'net', 0.75); cue(a + hitL, k % 2 ? 'boom_move' : 'thud', 0.4);
  });
  const endA = g0 + 6 * GD;
  shot(endA, (g, lt, t) => {  // seven–nil: the same goalmouth as the opening, from the side
    rig(B, lt, [[0, K(-PI / 2 - 0.34, 0.1, 10.6, [48.9, 1.2, 1.0], { cy: H * 0.54 })], [tvS - endA + 0.3, K(-PI / 2 - 0.2, 0.12, 9.4, [49.1, 1.15, 1.0], { cy: H * 0.54 })]], { t, e: glide, shake: 0.5 });
    stadium(g, t, aftermath(t, lt + 2.4, { more: true, front: false }), { cheer: 0.25, blur: 2.5 });
    rain(g, t, 1.2);
  }, { kb: 0, hud: (g, lt, t) => {
    scoreBug(g, 0, 7, "90'");
    counter(g, '0–7', 'FULL TIME · CAPE TOWN', { y: 400, size: 190, color: CREAM, at: [t, endA + 0.05] });
  } });
  cue(routS - 0.04, 'whistle', 0.35); cue(g0 - 0.5, 'riser', 0.3); cue(g0, 'crowd_roar', 0.4); cue(endA + 0.05, 'boom_big', 0.5); cue(endA + 0.9, 'whistle', 0.4); cue(endA + 1.2, 'whistle', 0.35);

  // ======================= THE BROADCAST ENDS: the room again. "We are ending our live broadcast now"; the picture
  // cuts to factory workers; someone switches the set off =======================
  const homeS = s('home'), weT = w('tv', 'we'), cutT = w('tv', 'cut'), offT = homeS - 0.55;
  shot(tvS - 0.06, (g, lt, t) => {
    const work = t > cutT + 0.14, off = clamp((t - offT) / 0.4);
    if (t < cutT) tvFeed(t, { ...FEED_CAM, dist: 54, target: [40, 0, 1] }, feedDots(t, 0.15), [53.2, 0.15, -1.2]);
    tvRoom(g, t, (gg, x, y, ww, hh) => {
      if (off > 0) tvDark(gg, x, y, ww, hh, off);
      else if (t < cutT) { tvCrop(gg, x, y, ww, hh); tvBug(gg, x, y, "PRK 0–7 POR"); }
      else if (!work) tvNoise(gg, x, y, ww, hh, t);
      else tvWorkers(gg, x, y, ww, hh, t);
    }, { zoom: 1.08 + 0.42 * ease.inOut(clamp(lt / (cutT - tvS))) - 0.26 * ease.inOut(clamp((t - offT + 0.25) / 0.6)), glow: work ? [200, 190, 170] : [160, 205, 180], lum: 0.62, power: 1 - off });
  }, { grade: ROOM_G, kb: 0, trans: 'fade', hud: (g, lt, t) => {
    if (t > tvS + 0.1) plate(g, 'KOREAN CENTRAL TELEVISION', W / 2, 250, { color: CREAM, size: 36, ...pin(t, tvS + 0.1, fadeOut(t, offT)) });
    if (t > weT - 0.1 && t < cutT + 0.3) plate(g, '“WE ARE ENDING OUR LIVE BROADCAST NOW”', W / 2, 1440, { color: CREAM, size: 30, ...pin(t, weT - 0.1, fadeOut(t, cutT)) });
    if (t > cutT + 0.2) plate(g, 'CUT TO: FACTORY WORKERS', W / 2, 1440, { color: GOLD, size: 34, ...pin(t, cutT + 0.2, fadeOut(t, offT)) });
  } });
  cue(tvS - 0.04, 'whoosh_soft', 0.25); cue(cutT, 'radio_static', 0.5); cue(offT, 'tvoff', 0.6);

  // ======================= PYONGYANG, 2 JULY (as Radio Free Asia reported it): six hours on a stage before four hundred.
  // One slow move along the stage: the commentator at the lectern jabbing his finger, the rows of bowed heads, and at the
  // far end their coach, alone; then the players' arms go out toward him =======================
  const rumS = s('rumours'), sixT = w('home', 'six'), fourT = w('home', 'four'), denT = w('home', 'players') - 0.14, HL = rumS - homeS + 0.3;
  // the camera's way along the stage: one even move, easing in at the lectern and out on the coach as he is named. At
  // 0.72 m a second the picture moves about 6 px a frame and stays sharp (a quicker arrival drew the men as ghost copies)
  const coachL = w('home', 'coach.') - homeS + 0.06, plL = denT - homeS + 0.2;
  const ramp = (x, a, b) => { const u = clamp((x - a) / (b - a)); return (b - a) * (u * u * u - u * u * u * u / 2) + Math.max(0, x - b); };  // the integral of a smooth step from a to b
  const hallX = lt => -3.3 + 0.2 * lt + 0.52 * ramp(lt, 0.8, 2.0) - 0.62 * ramp(lt, coachL - 0.4, coachL + 0.6);
  shot(homeS - 0.06, (g, lt, t) => {
    const point = clamp((t - denT - 0.1) / 1.4);
    const sx = hallX(lt), a1 = ease.inOut(clamp(lt / 1.5)), a2 = ease.inOut(clamp((lt - 1.5) / (plL - 1.5))), a3 = ease.inOut(clamp((lt - plL) / (HL - plL)));
    rig(B, lt, [[0, K(0.1 - 0.04 * a2 - 0.08 * a3, 0.1 - 0.01 * a3, 6.6 + 0.2 * a1 + 0.8 * a2 - 0.7 * a3, [sx, 1.5 - 0.05 * a3, 2.2 + 0.1 * a1 + 0.6 * a2 - 0.8 * a3], { cy: H * 0.46 })]], { t, e: lin, shake: 0.25 });
    // the light goes down the rows, a step at a time, from the first words to "the players had to"
    const hv = (t - (homeS + 0.9)) / (denT - homeS - 0.9) * 10 - 0.5, hr = Math.floor(hv) + ease.inOut(clamp((hv - Math.floor(hv)) / 0.4));
    const hotA = clamp((t - homeS - 0.9) / 0.3) * fadeOut(t, denT - 0.15, 0.3), hot = clamp(hr, 0, 9);
    hallSet(g, t, { spot: [sx, 2.8], spotA: 1 - 0.35 * hotA, hot: hotSpot(hot), hotA });
    const items = hallItems(t, { point, sweep: lt, hot, hotA });
    for (const it of items) it.shadow?.(g);
    drawSorted(g, items);
    audience(g, t);
    { const v = g.createRadialGradient(W / 2, H * 0.45, 320, W / 2, H * 0.45, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  }, { grade: HALL_G, kb: 0, trans: 'fade', qaAllow: ['face behind player', 'face cut by frame', 'player hidden'], hud: (g, lt, t) => {  // two rows of men: the back row shows between the front one
    placeStamp(g, lt, 'Pyongyang', '2 July 2010', { y: 170, t0: 0.25 });
    const hrs = tt => 6 * smooth(clamp((tt - sixT + 0.1) / 3.0));  // an even run: with a sharper ease the long hand jumped 70 degrees a frame
    const ca = clamp((t - sixT + 0.25) / 0.25) * fadeOut(t, denT + 0.1), hours = hrs(t);
    hudClock(g, W / 2, 380, 96, 600 + hours * 60, ca, (hours - hrs(t - 1 / 30)) * 60);
    if (t > sixT - 0.05 && t < denT + 0.4) plate(g, '6 HOURS OF PUBLIC CRITICISM', W / 2, 545, { color: CREAM, size: 36, ...pin(t, sixT - 0.05, fadeOut(t, denT + 0.1)) });
    if (t > fourT - 0.05 && t < denT + 0.4) plate(g, 'BEFORE 400 PEOPLE', W / 2, 625, { color: GOLD, size: 34, ...pin(t, fourT - 0.05, fadeOut(t, denT + 0.1)) });
    if (t > denT + 0.35) plate(g, 'MADE TO DENOUNCE THEIR COACH', W / 2, 330, { color: RED, size: 40, ...pin(t, denT + 0.35) });
    if (t > homeS + 0.9) plate(g, 'AS REPORTED BY RADIO FREE ASIA · NEVER CONFIRMED', W / 2, 1450, { color: '#2A2F38', ink: CREAM, size: 26, ...pin(t, homeS + 0.9) });
  } });
  cue(homeS - 0.04, 'door_slam', 0.3); cue(homeS + 0.25, 'murmur', 0.3); for (let k = 0; k < 6; k++) cue(sixT - 0.1 + k * 0.5, 'clock_tick', 0.22); cue(denT + 0.3, 'gavel', 0.4);

  // ======================= THE RUMOURS: the same men, dark in the fog, going one by one; then the letters: FIFA asks,
  // Pyongyang answers =======================
  const truthS = s('truth'), minesT = w('rumours', 'mines.'), execT = w('rumours', 'Executions.'), fifaT = w('rumours', 'FIFA'), pyT = w('rumours', 'Pyongyang'), usualT = w('rumours', 'training');
  const deskA = fifaT - 0.18;
  shot(rumS - 0.06, (g, lt, t) => {
    const L = deskA - rumS + 0.4;
    rig(B, lt, [[0, K(0.34, 0.05, 9.2, [-1.6, 1.3, 0])], [L, K(0.2, 0.05, 8.2, [0.6, 1.3, 0])]], { t, e: glide, shake: 0.3 });
    stadium(g, t, [], { stad: BARE, boards: [], cheer: 0, blur: 4, skyO: FOGSKY, pitchO: { colors: ['#3E5E3A', '#456641'] } });
    l2x.setTransform(1, 0, 0, 1, 0, 0); l2x.clearRect(0, 0, W, H);
    drawSorted(l2x, lineItems(NKW, t, { dx: 1.25, x0: -6.25, pose: () => DOWNCAST, e: () => SAD }));
    const v = clamp((t - minesT + 0.25) / (deskA - minesT + 0.2));
    if (v > 0) { const ex = lerp(W + 320, -320, v), m = l2x.createLinearGradient(ex - 300, 0, ex, 0); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); l2x.globalCompositeOperation = 'destination-in'; l2x.fillStyle = m; l2x.fillRect(0, 0, W, H); l2x.globalCompositeOperation = 'source-over'; }
    g.save(); g.filter = 'brightness(0.13) saturate(0.3)'; g.drawImage(L2, 0, 0); g.restore();
    const fog = g.createLinearGradient(0, H * 0.2, 0, H * 0.75); fog.addColorStop(0, 'rgba(160,170,180,0.5)'); fog.addColorStop(1, 'rgba(160,170,180,0.16)'); g.fillStyle = fog; g.fillRect(0, 0, W, H);
  }, { grade: FOG_G, kb: 0, trans: 'fade', qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    if (t > rumS + 0.15) plate(g, 'THEN CAME THE RUMOURS', W / 2, 260, { color: CREAM, size: 40, ...pin(t, rumS + 0.15) });
    if (t > minesT - 0.05) plate(g, 'SENT TO THE MINES?', W / 2, 390, { color: '#2A2F38', ink: CREAM, size: 46, sub: 'RUMOUR', ...pin(t, minesT - 0.05) });
    if (t > execT - 0.05) plate(g, 'EXECUTED?', W / 2, 540, { color: RED, size: 56, sub: 'RUMOUR', ...pin(t, execT - 0.05) });
  } });
  shot(deskA, (g, lt, t) => {
    deskSet(g, t);
    const inA = ease.out(clamp((t - deskA) / 0.4)), inB = ease.out(clamp((t - pyT + 0.12) / 0.4));
    sheet(g, 500 - 10 * inB, lerp(-520, 640, inA), 760, 900, -0.035, 1, (c, ww, hh) => {
      c.fillStyle = '#1E4E9E'; c.fillRect(-ww / 2, -hh / 2, ww, 150); c.fillStyle = '#FFFFFF'; c.font = sans(76, 900); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('FIFA', -ww / 2 + 56, -hh / 2 + 78);
      c.font = sans(24, 800); c.textAlign = 'right'; c.fillText('ZURICH · 11 AUGUST 2010', ww / 2 - 56, -hh / 2 + 80);
      lines(c, ww, -hh / 2 + 210, 4);
      c.fillStyle = '#12161C'; c.font = sans(38, 900); c.textAlign = 'left'; c.fillText('WERE THE COACH AND', -ww / 2 + 56, -hh / 2 + 400); c.fillText('PLAYERS PUNISHED?', -ww / 2 + 56, -hh / 2 + 452);
      lines(c, ww, -hh / 2 + 520, 6);
    });
    sheet(g, lerp(1500, 600, inB), 900, 740, 760, 0.045, inB > 0 ? 1 : 0, (c, ww, hh) => {
      c.fillStyle = NKRED; c.fillRect(-ww / 2, -hh / 2, ww, 120); c.fillStyle = '#FFFFFF'; c.font = sans(34, 900); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('DPR KOREA FOOTBALL ASSOCIATION', -ww / 2 + 46, -hh / 2 + 62);
      c.fillStyle = '#3A3F47'; c.font = sans(24, 800); c.fillText('PYONGYANG · REPLY TO FIFA', -ww / 2 + 46, -hh / 2 + 168);
      lines(c, ww, -hh / 2 + 220, 3);
      c.fillStyle = '#12161C'; c.font = sans(34, 900); c.fillText('“…ARE TRAINING AS USUAL.”', -ww / 2 + 46, -hh / 2 + 372);
      lines(c, ww, -hh / 2 + 430, 5);
    });
  }, { grade: DESK_G, kb: 0, hud: (g, lt, t) => {
    stamp(g, 'TRAINING AS USUAL', 590, 1030, t, usualT + 0.05, { color: GREEN, size: 62, rot: -0.1 });
    if (t > usualT + 0.4) plate(g, 'FIFA: CASE CLOSED · 25 AUGUST 2010', W / 2, 1450, { color: CREAM, size: 34, ...pin(t, usualT + 0.4) });
  } });
  cue(rumS - 0.04, 'whoosh_deep', 0.35); cue(minesT - 0.05, 'thud', 0.35); cue(execT - 0.05, 'boom_cine', 0.45); cue(deskA, 'paper', 0.45); cue(pyT - 0.1, 'paper', 0.4); cue(usualT + 0.05, 'stamp', 0.55);

  // ======================= WHAT IS KNOWN: six months on, the Asian Cup; all eleven of them in the squad =======================
  const coachS = s('coach'), elevenT = w('truth', 'eleven'), c0 = truthS + 0.55, c1 = elevenT + 0.12;
  const count = t => Math.round(11 * clamp((t - c0) / (c1 - c0)));
  shot(truthS - 0.06, (g, lt, t) => {
    const L = coachS - truthS + 0.3, u = clamp(lt / L);
    rig(B, lt, [[0, K(lerp(-0.2, -0.12, u), 0.04, lerp(6.6, 6.3, u), [lerp(2.5, -2.5, u), 1.3, 0], { cy: H * 0.5 })]], { t, e: lin, shake: 0.25 });
    stadium(g, t, lineItems(NKR, t, { dx: 1.25, x0: -6.25, pose: () => ({ sh: [[-0.25, 0.1], [-0.25, 0.1]], el: [0.55, 0.55], lean: 0.0 }), e: i => (i % 2 ? 'neutral' : 'focus') }),
      { stad: QATAR, boards: BOARDS_Q, cheer: 0.2, blur: 2.5, skyO: SUNQ, pitchO: {} });
  }, { grade: DAY_G, kb: 0, trans: 'fade', qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    placeStamp(g, lt, 'Asian Cup', 'January 2011', { y: 180, t0: 0.15 });
    if (t > c0 - 0.1) counter(g, `${count(t)}/11`, 'STARTERS BACK IN THE SQUAD', { y: 440, size: 170, color: count(t) === 11 ? GOLD : CREAM, at: [t, c0 - 0.1] });
  } });
  cue(truthS - 0.04, 'whoosh_soft', 0.3); for (let k = 1; k <= 11; k++) cue(c0 + (c1 - c0) * k / 11, 'touch', 0.22); cue(c1 + 0.05, 'success', 0.25);

  // ======================= THE COACH: the touchline where he stood. He fades; nothing about him has been confirmed =======================
  const notT = w('coach', 'not.'), whatT = w('coach', 'What'), confT = w('coach', 'confirmed.'), neverT = w('coach', 'never');
  shot(coachS - 0.06, (g, lt, t) => {
    const L = T.duration - coachS, u = ease.inOut(clamp(lt / L));
    rig(B, lt, [[0, K(lerp(PI + 0.2, PI + 0.1, u), 0.04, lerp(4.5, 6.0, u), [lerp(1.75, 1.5, u), 1.2, -35.3], { cy: H * 0.5 })]], { t, e: lin, shake: 0.2 });
    stadium(g, t, [], { stad: QATAR, boards: [], cheer: 0, blur: 3.5, skyO: SUNQ, pitchO: {} });
    // he stands there through "the coach was not", and is gone by the time the last sentence ends
    const a = 1 - ease.inOut(clamp((t - whatT + 0.1) / (confT + 0.2 - whatT)));
    if (a > 0.004) {
      const st = { x: 2.1, z: -35.2, head: PI / 2 - 0.22, pose: { ...POSE.stand(), sh: [[-0.3, 0.1], [-0.3, 0.1]], el: [0.55, 0.55], lean: 0.02, look: -0.12 }, e: { ...EXPR.neutral, look: [0, 0.2] }, t };
      const it = P(COACH, st);
      l2x.setTransform(1, 0, 0, 1, 0, 0); l2x.clearRect(0, 0, W, H); it.shadow(l2x); drawSorted(l2x, [it]);
      g.save(); g.globalAlpha = a; g.drawImage(L2, 0, 0); g.restore();
    }
  }, { grade: DAY_G, kb: 0, trans: 'fade', post: (g, lt, t) => { const f = clamp((t - (T.duration - 1.9)) / 1.2); if (f > 0) { g.fillStyle = `rgba(0,0,0,${f.toFixed(3)})`; g.fillRect(0, 0, W, H); } }, hud: (g, lt, t) => {
    nameTitle(g, lt, 'Kim Jong-hun', 'NORTH KOREA HEAD COACH · 2007–2010', { y: 230, t0: 0.2 });
    if (t > neverT - 0.05) plate(g, 'NEVER CONFIRMED', W / 2, 1460, { color: CREAM, size: 48, ...pin(t, neverT - 0.05) });
  } });
  cue(coachS - 0.04, 'whoosh_deep', 0.3); cue(notT, 'boom_cine', 0.3);

  // ---------- the rain and the crowd under the stadium scenes
  amb.push({ id: 'rain', t0: 0, t1: ctxS, gain: 0.9, fi: 0.02, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: 0, t1: ctxS, gain: 0.45, fi: 0.02, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: ctxS - 0.06, t1: tvA + 0.2, gain: 0.6, fi: 0.2, fo: 0.3 });
  amb.push({ id: 'rain', t0: halfS - 0.06, t1: tvS, gain: 1.0, fi: 0.15, fo: 0.35 });
  amb.push({ id: 'crowd_bed', t0: halfS - 0.06, t1: tvS, gain: 0.65, fi: 0.15, fo: 0.35 });
  amb.push({ id: 'rain', t0: tvS - 0.06, t1: cutT, gain: 0.22, fi: 0.2, fo: 0.1 });
  amb.push({ id: 'crowd_bed', t0: truthS - 0.06, t1: T.duration, gain: 0.3, fi: 0.4, fo: 1.5, keys: [[0, 1], [coachS, 1], [coachS + 1.5, 0.35]] });

  const music = [
    { t: 0, m: 'hook' }, { t: ctxS - 0.06, m: 'coldwar' }, { t: tvA, m: 'intrigue' }, { t: halfS - 0.06, m: 'build' }, { t: g0 - 0.05, m: 'tension' },
    { t: endA, m: 'slam' }, { t: tvS - 0.06, m: 'void' }, { t: homeS - 0.06, m: 'paranoia' }, { t: rumS - 0.06, m: 'exile' }, { t: deskA, m: 'intrigue' },
    { t: truthS - 0.06, m: 'glory' }, { t: coachS - 0.06, m: 'elegy' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff: null, grain: 0.02 };
}
function lerpK(A, Bc, u) {
  return { ...A, yaw: lerp(A.yaw, Bc.yaw, u), pitch: lerp(A.pitch, Bc.pitch, u), dist: lerp(A.dist, Bc.dist, u), cy: lerp(A.cy, Bc.cy, u),
    target: [lerp(A.target[0], Bc.target[0], u), lerp(A.target[1], Bc.target[1], u), lerp(A.target[2], Bc.target[2], u)] };
}
