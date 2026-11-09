// "The Hand of God" — the first football episode. Argentina 2–1 England, Estadio Azteca, Mexico City, 22 June 1986:
// Maradona punches the ball in (51'), says it was "a little with the head of Maradona and a little with the hand of
// God", and four minutes later runs from his own half past Beardsley, Reid, Butcher, Fenwick and Shilton (one take).
// The commentator's "cosmic kite", the World Cup a week later, and the twist: Steve Hodge, whose ball back made the
// first goal, swapped shirts with Maradona; Argentina had bought those shirts in a Mexico City shop days before; in
// 2022 the shirt sold for $9.3 million. Sources and what is drawn: SOURCES.md.
// Palette: Mexico City at noon — sun-bleached grass, deep sky blue, Azteca concrete; Argentina's dark blue and sky
// blue, England's white and pale blue; a 1986 press room in blue, a concrete radio booth, a pink-and-yellow street
// market, a dark green auction gallery.
import { W, H, C, clamp, lerp, ease, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR, exprAt, drawChar, hand } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, popIn, stamp, sans, inkText } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { box, pool } from '../../engine/js/env.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { confetti } from '../../engine/js/draw.js';
import { CAP_BAND } from '../../engine/js/captions.js';
import { City, Stadium, sky, pitch, goalItems, boardItems, boardDesign, flagItems, playerItems, playerShadow, ballItem, groundShadow,
  drawSorted, drawPlayer, POSE, blend, Mover, BallPath, dribbleSegs, BALL_R, KITS, texQuadW, tex, figureK, skeleton, PITCH } from '../../engine/js/football.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no channel handle on this one: no FOLLOW plate, neutral boards
const B = new Board();
const PI = Math.PI;
const SKY = '#5FB3E8', NAVY = '#1E2D5C', GOLD = '#F2C14E', RED = '#E0603F', CREAM = C.cream, LIME = C.lime, BLUE = '#2C55AE';
const NOON = { con: 1.06, sat: 1.1, bri: 1.03, tone: ['#FFD8A0', 0.12], lift: ['#10243A', 0.07], bloom: 0.28 };  // Mexico City at noon
const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
const lin = x => x, glide = x => 0.35 * x + 0.65 * ease.inOut(x);
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const pin = (t, t0, a = 1) => { const p = popIn(t, t0); return { ...p, a: (p.a ?? 1) * a }; };

// ---------- the cast (cartoon doubles; small on the pitch, so likeness lives in hair, build and kit) ----------
const SKIN_ARG = { base: '#DDAA82', shade: '#C79570', deep: '#A87452', blush: '#D9907E', hi: '#F0CDAE' };
CAST.diego = { face: [0.99, 1.0, 0.95], hair: 'curly', hairC: '#15100C', brow: '#120D0A', suit: '#2C55AE', suitD: '#1C3C86', shirt: 'polo', ears: 1.0, iris: '#3A2618', skin: SKIN_ARG };
CAST.shilton = { face: [0.92, 1.1, 0.84], hair: 'curly', hairC: '#3A281C', brow: '#2E2118', suit: '#AEB5BD', suitD: '#8A929C', shirt: 'tee', ears: 1.02 };
CAST.hodge = { face: [0.94, 1.03, 0.88], hair: 'curly', hairC: '#5E422C', brow: '#4A3424', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.02 };
CAST.butcher = { face: [0.98, 1.1, 0.96], hair: 'buzz', hairC: '#8A6A4A', brow: '#6E5238', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.04 };
CAST.fenwick = { face: [0.95, 1.05, 0.9], hair: 'messy', hairC: '#2E2218', brow: '#241A12', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.0 };
CAST.reid = { face: [0.94, 1.06, 0.88], hair: 'receding', hairC: '#3A2A1E', brow: '#2E2118', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.02 };
CAST.beardsley = { face: [0.95, 1.04, 0.9], hair: 'fringe', hairC: '#1E1612', brow: '#16100C', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.06 };
CAST.engA = { face: [0.96, 1.04, 0.9], hair: 'swept', hairC: '#7A5A3A', brow: '#5E4430', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.0 };
CAST.engB = { face: [0.95, 1.06, 0.88], hair: 'messy', hairC: '#C9A06A', brow: '#9C7A50', suit: '#F3F3EF', suitD: '#CDD2D8', shirt: 'tee', ears: 1.0 };
CAST.valdano = { face: [0.92, 1.1, 0.86], hair: 'swept', hairC: '#1E1612', brow: '#16100C', suit: '#2C55AE', suitD: '#1C3C86', shirt: 'tee', ears: 1.0, skin: SKIN_ARG };
CAST.argA = { face: [0.97, 1.03, 0.92], hair: 'messy', hairC: '#1E1612', brow: '#16100C', suit: '#2C55AE', suitD: '#1C3C86', shirt: 'tee', ears: 1.0, skin: SKIN_ARG };
CAST.argB = { face: [0.95, 1.05, 0.9], hair: 'curly', hairC: '#2A1E16', brow: '#1E1610', suit: '#2C55AE', suitD: '#1C3C86', shirt: 'tee', ears: 1.0, skin: { base: '#E4B892', shade: '#CC9E78' } };
CAST.bennasser = { face: [0.96, 1.06, 0.9], hair: 'receding', hairC: '#16110D', brow: '#120D0A', suit: '#18191D', suitD: '#0E0F12', shirt: 'tee', ears: 1.02, mustache: '#16110D',
  skin: { base: '#C99A72', shade: '#B3845E', deep: '#93673F', blush: '#C9806E', hi: '#E2B994' } };
CAST.morales = { face: [0.95, 1.06, 0.88], hair: 'swept', hairC: '#1E1612', brow: '#16100C', suit: '#5A4A3A', suitD: '#42362A', shirt: 'open', ears: 1.0, mustache: '#1E1612', headphones: '#15171C' };
CAST.moschella = { face: [0.98, 1.04, 0.92], hair: 'receding', hairC: '#6E665E', brow: '#4E4842', suit: '#2C55AE', suitD: '#1C3C86', shirt: 'polo', ears: 1.02, glasses: true, mustache: '#5E5650' };
CAST.diegoPress = { ...CAST.diego, suit: '#2C55AE', suitD: '#1C3C86', shirt: 'polo' };

// players: who (head), kit, number, height (m), build
const DIEGO = { who: 'diego', kit: 'arg86', num: 10, h: 1.65, build: 1.1, captain: '#EDEDE8' };
const SHIL = { who: 'shilton', kit: 'engGK86', num: 1, h: 1.83 };
const HODGE = { who: 'hodge', kit: 'eng86', num: 18, h: 1.73 };
const BUTCH = { who: 'butcher', kit: 'eng86', num: 6, h: 1.93, build: 1.08 };
const FENW = { who: 'fenwick', kit: 'eng86', num: 14, h: 1.78 };
const REID = { who: 'reid', kit: 'eng86', num: 16, h: 1.71 };
const BEARD = { who: 'beardsley', kit: 'eng86', num: 20, h: 1.68 };
const ENG = (who, num, h = 1.8) => ({ who, kit: 'eng86', num, h });
const ARG = (who, num, h = 1.78) => ({ who, kit: 'arg86', num, h });
const VALD = { who: 'valdano', kit: 'arg86', num: 11, h: 1.88 };
const ENRI = ARG('argA', 12, 1.76);
const REF = { who: 'bennasser', kit: 'ref86', num: null, h: 1.76 };

// ---------- the stadium world ----------
const STAD = new Stadium({ seed: 7 }), CITY = new City({ seed: 21 });
const BOARDS = [boardDesign('MÉXICO 1986'), boardDesign('ESTADIO AZTECA', { bg: '#1F7A45', ink: '#FFFFFF' }), boardDesign('CUARTOS DE FINAL', { bg: '#E8C23A', ink: NAVY }),
  boardDesign('ARGENTINA · INGLATERRA', { bg: '#C8262E', ink: '#FFFFFF' }), boardDesign('22 · JUNIO · 1986', { bg: '#F4F2EC', ink: '#1F7A45' }), boardDesign('CIUDAD DE MÉXICO', { bg: NAVY, ink: '#FFFFFF' })];
const BG = makeCanvas(), bgx = BG.getContext('2d');
// an item list -> the whole stadium frame. blur: the stands and sky out of focus (close-ups), outside: the shell and the city
function stadium(g, t, items = [], { cheer = 0, hitL = null, hitR = null, outside = false, blur = 0, skyO = {}, pitchO = {}, city = outside } = {}) {
  const back = c => { sky(c, B, { t, ...skyO }); if (city) CITY.draw(c, B, 'far'); STAD.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...pitchO });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t, hit: hitL }), ...goalItems(B, 1, { t, hit: hitR }), ...boardItems(B, BOARDS), ...flagItems(B, t), ...items]);
  if (outside) { STAD.draw(g, B, t, { part: 'outer' }); CITY.draw(g, B, 'near'); }
}
// a player as a drawable with its shadow
const P = (pl, st) => { const it = playerItems(B, pl, st); it.shadow = gg => playerShadow(gg, B, pl, st); it.pl = pl; it.st = st; return it; };
const BALL = (pos, o = {}) => { const it = ballItem(B, pos, o); it.shadow = gg => groundShadow(gg, B, pos[0], pos[2], { r: BALL_R * 1.1, y: pos[1] - BALL_R, a: 0.4 }); return it; };
// a mover's state as a player state, with a pose chosen by speed (stand / jog / run / dribble)
function moving(mv, tt, { dribble = 0, e = 'focus', pose = null, t = tt, I = null } = {}) {
  const s = mv.at(tt), sp = s.sp, inten = I ?? clamp(sp / 6.5, 0, 1);
  const p = pose || (sp < 0.4 ? POSE.stand() : blend(POSE.stand(), POSE.run(s.phase, Math.max(0.35, inten), dribble), clamp(sp / 1.2)));
  return { x: s.x, z: s.z, head: s.head, pose: p, e, t };
}
// head point of a player state, projected (for tags that follow a player)
const headOf = (pl, st, up = 0.35) => { const sk = skeleton(pl, st); return { ...B.project(sk.headC[0], sk.headC[1] + up, sk.headC[2]), d: depth(...sk.headC) }; };

// ---------- on-screen pieces ----------
// the TV score bug of the era: a solid cream block, team chips, the minute (rule 50: flat, no glass)
function scoreBug(g, a, h, m, { x = 40, y = 76, al = 1 } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = SKY; g.fillRect(x, y, 14, hh); g.fillStyle = '#FFFFFF'; g.fillRect(x + w - 14, y, 14, hh); g.fillStyle = '#C8262E'; g.fillRect(x + w - 14, y + hh / 2 - 4, 14, 8);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('ARG', x + 26, y + hh / 2 + 2); g.fillText('ENG', x + w - 92, y + hh / 2 + 2);
  g.textAlign = 'center'; g.fillText(`${a} – ${h}`, x + w / 2 - 6, y + hh / 2 + 2);
  g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 92, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 54, y + hh / 2 + 2);
  qaRect(g, x, y, w + 100, hh, 'text', 'score bug');
  g.restore();
}
// two-line cover headline (rule 28: white over yellow, heavy outline)
function bigText(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FFD43B', s1 = 92, s2 = 104, a = 1, sc = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(sc, sc); g.translate(-W / 2, -y);
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#0E1A2E';
  g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
  g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.08); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.08);
  qaRect(g, 70, y - s1 * 0.8, W - 140, s1 * 0.8 + s2 * 1.12, 'text', 'cover title');
  g.restore();
}
// place and date on a solid plate, for bright backgrounds (rule 50: no cream text straight on a light sky)
function stampPlate(g, place, date, y, t, t0, { color = NAVY, size = 34 } = {}) { if (t >= t0) plate(g, `${place.toUpperCase()} · ${date}`, W / 2, y, { color, size, ...pin(t, t0) }); }
// a name tag on a player (world-anchored plate); struck through once he has been beaten
function playerTag(g, name, p, t, t0, { color = RED, struck = null, size = 34 } = {}) {
  if (t < t0 || !p || p.d < 0.8) return;
  const out = struck ? clamp((t - struck - 0.25) / 0.45) : 0;
  if (out >= 1) return;
  const y = clamp(Math.min(p.y - 18, CAP_BAND[0] - 40), 160, H - 160), x = clamp(p.x, 190, W - 190);
  p = { ...p, x };
  const pp = popIn(t, t0), sz = plate(g, name, p.x, y - out * 40, { color, size, ...pp, a: (pp.a ?? 1) * (1 - out) });
  if (struck && t > struck && sz) {
    const u = clamp((t - struck) / 0.16), w = sz.w * (pp.scale ?? 1);
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha *= 1 - out;
    g.beginPath(); g.moveTo(p.x - w / 2 + 6, y - out * 40 + 4); g.lineTo(p.x - w / 2 + 6 + (w - 12) * u, y - out * 40 - 6); g.stroke(); g.restore();
  }
}
// VHS overlay for the rewind: scanlines, a tracking band, chroma fringe, the REW sign
function vhs(g, t, { label = '◀◀ REW', a = 1 } = {}) {
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
  const by = ((t * 900) % (H + 300)) - 150; g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, by, W, 46); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, by + 46, W, 18);
  g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,0,60,0.05)'; g.fillRect(4, 0, W, H); g.fillStyle = 'rgba(0,160,255,0.05)'; g.fillRect(-4, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  g.font = '800 54px "JetBrains Mono"'; g.fillStyle = '#FFFFFF'; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowOffsetY = 4; g.textAlign = 'left';
  g.fillText(label, 60, 170); qaRect(g, 60, 120, 300, 60, 'text', label);
  g.restore();
}

// ---------- slow motion: story time from film time, through piecewise-linear speeds ----------
function warp(knots) {  // knots: [[t, speed], ...]; tau(t0) = t0 at the first knot
  const tab = []; let tau = knots[0][0];
  const sp = t => { if (t <= knots[0][0]) return knots[0][1]; for (let i = 0; i < knots.length - 1; i++) { const [a, va] = knots[i], [b, vb] = knots[i + 1]; if (t <= b) return lerp(va, vb, (t - a) / (b - a)); } return knots[knots.length - 1][1]; };
  for (let t = knots[0][0]; t <= knots[knots.length - 1][0] + 30; t += 1 / 240) { tab.push(tau); tau += sp(t) / 240; }
  return t => t <= knots[0][0] ? t : tab[Math.min(tab.length - 1, Math.round((t - knots[0][0]) * 240))];
}

// ================= THE HAND OF GOD (story time) =================
// 51': Maradona plays it toward Valdano; it goes behind him to Hodge, who hooks it back toward his keeper; Shilton
// comes out; Maradona, 18 cm shorter, gets there first with his left fist. England attack nothing here: Argentina
// attack the goal at x = -52.5. Positions are a reconstruction (SOURCES.md, "drawn, not documented").
const HG = { pass: 12.6, hook: 14.09, punch: 15.54, jump0: 15.32, jumpD: 0.46, sJump0: 15.34, sJumpD: 0.55, cross: 16.24, net: 16.42 };
const hgD = new Mover([[11.2, -16.5, -11.5], [12.6, -28.6, -5.4], [14.09, -38.2, -2.4], [15.36, -45.9, 0.1], [15.54, -46.35, 0.35], [16.3, -47.3, 0.8],
  [16.9, -46.6, 2.6], [18.2, -42.5, 7.8], [20.5, -35.5, 13.5], [23, -29, 16]]);
const hgV = new Mover([[11.2, -26.5, 3.0], [13.0, -33.6, 0.9], [14.6, -40.0, 8.0], [16.5, -43.0, 10.0], [18, -41.5, 9.5], [21, -36.5, 12.5]]);
const hgH = new Mover([[11.2, -42.5, 11.0], [13.95, -38.85, 6.1, { stop: true }], [14.3, -38.9, 6.0], [15.5, -41.6, 4.6], [17.2, -43.2, 3.4], [19, -40.5, 2.0]],
  { face: (t) => (t > 13.6 && t < 14.4 ? -2.2 : null) });
const hgS = new Mover([[11.2, -51.7, -0.6], [14.09, -51.2, -0.2], [15.0, -48.9, 0.05], [15.3, -47.95, 0.15], [15.54, -47.65, 0.2, { stop: true }], [16.1, -47.65, 0.2], [17.2, -46.6, 1.6], [19.5, -43.3, 3.6], [22, -41.0, 4.6]],
  { face: (t) => (t < 16.2 ? 0.05 : null) });
const hgF = new Mover([[11.2, -39.5, -8.5], [14.5, -41.8, -6.2], [16.2, -42.3, -5.3], [18.5, -41.0, 0.5], [22, -40.0, 3.5]]);
const hgB = new Mover([[11.2, -44.0, 4.5], [14.5, -45.4, 2.6], [16.2, -46.4, 2.4], [18.5, -43.6, 3.9], [22, -41.2, 5.0]]);
const hgSt = new Mover([[11.2, -37.0, -14.0], [15.0, -42.0, -8.5], [18.5, -40.2, -3.5], [22, -38.5, 1.0]]);
const hgRef = new Mover([[11.2, -27.0, 6.0], [14.5, -32.5, 7.2], [16.5, -35.6, 6.8, { stop: true }], [18.8, -35.6, 6.8, { stop: true }], [23, -34.5, 7.0]], { face: (t) => (t < 18.4 ? PI + 0.2 : 0.1) });
// the ball: to Hodge, looped back, punched over Shilton into the net. The contact point is Maradona's left fist at the
// top of his jump (taken from his skeleton), so the fist and the ball really meet
let hgBall = null;
function hgInit() {
  const at = hgD.at(HG.punch), st = { x: at.x, z: at.z, head: PI - 0.05, pose: POSE.jump(jumpU(HG.punch, HG.jump0, HG.jumpD), { arm: 'L', h: 0.62 }) };
  const fist = skeleton(DIEGO, st).arms[0].hand, C = [fist[0] - 0.05, fist[1] + 0.14, fist[2]];
  HG.contact = C;
  hgBall = new BallPath([
    { t0: 10.5, t1: 12.6, kind: 'fn', fn: t => { const q = hgD.at(t); return [q.x + Math.cos(q.head) * 0.45, BALL_R, q.z + Math.sin(q.head) * 0.45]; } },
    { t0: 12.6, t1: 13.95, kind: 'roll', from: [-28.2, -5.2], to: [-38.55, 5.85], decay: 1.1 },
    { t0: 14.09, t1: HG.punch, kind: 'air', from: [-38.5, 0.3, 5.85], to: C },
    { t0: HG.punch, t1: HG.cross, kind: 'air', from: C, to: [-52.5, 1.15, 1.05] },
    { t0: HG.cross, t1: HG.net, kind: 'air', from: [-52.5, 1.15, 1.05], to: [-53.9, 0.55, 1.2], g: 4 },
    { t0: HG.net, t1: HG.net + 1.2, kind: 'roll', from: [-53.9, 0.4, 1.2], to: [-53.7, BALL_R, 1.3], decay: 3 },
    { t0: HG.net + 1.2, t1: 40, kind: 'hold', from: [-53.7, BALL_R, 1.3] },
  ]);
}
// film time -> story time: real speed to the hook, then about 0.2x bullet time while the ball loops, so the fist lands on
// "punches"; the speed comes back as it drops into the net
let hgTau = null;
function hgWarp(T) {
  const tP = T.w('punch', 'punches').s, s0 = 14.25, s1 = 14.9, r0 = tP - 0.05, r1 = tP + 0.3;
  let lo = 0.02, hi = 1;
  for (let i = 0; i < 40; i++) { const s = (lo + hi) / 2, f = warp([[s0 - 3, 1], [s0, 1], [s1, s], [r0, s], [r1, 1], [r1 + 30, 1]]); if (f(tP) > HG.punch) hi = s; else lo = s; }
  hgTau = warp([[s0 - 3, 1], [s0, 1], [s1, (lo + hi) / 2], [r0, (lo + hi) / 2], [r1, 1], [r1 + 30, 1]]);
}
const jumpU = (tau, t0, d = 0.72) => clamp((tau - t0) / d);
// the Hand of God scene at story time tau: everyone in place; extra: {protest: 0..1, refPoint: 0..1}
function hgItems(tau, t, { protest = 0, refPoint = 0, tagHodge = false } = {}) {
  const items = [];
  const dJ = jumpU(tau, HG.jump0, HG.jumpD), sJ = jumpU(tau, HG.sJump0, HG.sJumpD);
  const sd = hgD.at(tau);
  let dp = moving(hgD, tau, { dribble: tau < HG.pass ? 0.6 : 0, t });
  if (dJ > 0 && dJ < 1) dp = { ...dp, head: PI - 0.05, pose: POSE.jump(dJ, { arm: 'L', h: 0.62 }) };
  if (tau > HG.net && tau < HG.net + 1.6) dp = { ...dp, pose: blend(dp.pose, POSE.armsUp(clamp((tau - HG.net) * 2)), 0.7), e: 'triumph' };
  if (tau > HG.net + 1.6) dp = { ...dp, pose: blend(dp.pose, { sh: [[0.2, 0.2], [2.7, 0.35]], el: [1.2, 0.3] }, 1), e: 'happy' };
  items.push(P(DIEGO, dp));
  let sp = moving(hgS, tau, { e: tau < HG.punch ? 'focus' : 'shock', t });
  if (sJ > 0 && sJ < 1) sp = { ...sp, head: 0.05, pose: POSE.jump(sJ, { arm: 'R', h: 0.38 }) };
  if (tau > 16.2) sp = { ...sp, pose: blend(sp.pose, POSE.protest(t), clamp(protest + (tau - 16.4) * 1.5)), e: 'angry' };
  items.push(P(SHIL, sp));
  let hp = moving(hgH, tau, { t });
  if (tau > HG.hook - 0.45 && tau < HG.hook + 0.5) hp = { ...hp, pose: POSE.kick(clamp((tau - HG.hook + 0.3) / 0.65), 'L') };
  const hodgeIt = P(HODGE, hp); items.push(hodgeIt);
  items.push(P(VALD, moving(hgV, tau, { t })));
  for (const [pl, mv] of [[FENW, hgF], [BUTCH, hgB], [ENG('engA', 2, 1.8), hgSt]]) {
    let st = moving(mv, tau, { t });
    if (tau > 16.4) st = { ...st, pose: blend(st.pose, POSE.protest(t + pl.num), clamp((tau - 16.4) * 1.4 + protest)), e: 'angry' };
    items.push(P(pl, st));
  }
  let rp = moving(hgRef, tau, { t, e: 'neutral' });
  if (refPoint > 0) rp = { ...rp, head: 0.15, pose: blend(rp.pose, POSE.point(), refPoint) };
  items.push(P(REF, rp));
  const b = hgBall.at(tau); items.push(BALL(b.pos, { spin: b.spin, axis: b.axis }));
  return { items, ball: b.pos, hodge: hodgeIt, sd };
}

// ================= THE GOAL OF THE CENTURY (film time) =================
// 55': Enrique to Maradona in his own half; he turns between Beardsley and Reid, runs past Butcher and Fenwick, takes the
// ball round Shilton and scores as Butcher slides in. The path is a reconstruction at about real pace (SOURCES.md).
let GC = null;
function goalOfCentury(T) {
  const run = T.p('run'), w = k => T.w('run', k).s;
  const tB = w('Beardsley'), tR = w('Reid'), tBu = w('Butcher'), tF = w('Fenwick'), tS = w('Shilton'), tG = w('Goal');
  const t0 = T.s('later'), tRecv = T.w('later', 'own').s, tShot = tG - 0.6;
  const D = new Mover([[t0, 3.8, -9.4], [tRecv - 0.3, 3.7, -9.5], [tRecv + 0.25, 3.3, -9.9], [tB, 1.6, -10.6], [tR, -2.4, -11.3], [tBu, -14.6, -12.1], [tF, -27.4, -12.6],
    [tS, -39.6, -10.4], [tS + 0.55, -44.2, -8.6], [tShot - 0.28, -47.0, -7.3], [tShot, -48.4, -6.1], [tG, -49.6, -6.6], [tG + 0.6, -48.6, -10.2], [tG + 2.2, -44.0, -18.5]],
    { face: (t) => (t < tRecv - 0.05 ? 0.05 : null), turn: 7 });
  const steps = D.steps(tRecv + 0.45, tShot - 0.2, { side: 'L' });
  const touches = [tRecv + 0.05, tRecv + 0.42, ...steps.filter(x => x > tRecv + 0.6), tShot].filter((x, i, a) => i === 0 || x - a[i - 1] > 0.2);
  const dr = dribbleSegs(D, touches, { ahead: 0.5, decay: 2.4 });
  const net = [-53.8, 0.45, -1.4];
  const ball = new BallPath([
    { t0: t0 - 1, t1: t0 + 0.35, kind: 'hold', from: [9.6, BALL_R, -5.9] },
    { t0: t0 + 0.35, t1: tRecv + 0.05, kind: 'roll', from: [9.6, -5.9], to: dr.foot(tRecv + 0.05), decay: 1.0 },
    ...dr.segs,
    { t0: tShot, t1: tG - 0.04, kind: 'roll', from: dr.foot(tShot), to: [-52.6, -1.9], decay: 0.35 },
    { t0: tG - 0.04, t1: tG + 0.12, kind: 'air', from: [-52.6, BALL_R, -1.9], to: net, g: 2 },
    { t0: tG + 0.12, t1: tG + 1.0, kind: 'roll', from: [net[0], 0.3, net[2]], to: [-53.5, BALL_R, -1.5], decay: 3 },
    { t0: tG + 1.0, t1: tG + 30, kind: 'hold', from: [-53.5, BALL_R, -1.5] },
  ]);
  const BE = new Mover([[t0, -2.6, -12.8], [tRecv + 0.1, 1.2, -11.2], [tB + 0.05, 2.0, -10.4, { stop: true }], [tB + 0.6, 2.2, -10.5], [tB + 2.5, -3.5, -11.4]]);
  const RE = new Mover([[t0, -3.6, -7.4], [tRecv + 0.2, 0.6, -9.2], [tR - 0.1, -0.6, -10.5], [tR + 0.8, -6.4, -11.4], [tBu + 0.5, -15.5, -12.0], [tF + 1, -21.5, -12.4]]);
  const BU = new Mover([[t0, -24.0, -6.5], [tBu - 1.1, -18.6, -9.6], [tBu - 0.12, -15.8, -11.5], [tBu + 0.35, -15.0, -11.9], [tBu + 0.8, -18.6, -12.3], [tF, -26.0, -12.0],
    [tS, -37.4, -10.0], [tShot - 0.45, -45.6, -8.2], [tShot - 0.05, -47.3, -6.9, { stop: true }], [tG + 1, -47.6, -6.6]]);
  const FE = new Mover([[t0, -36.0, -6.5], [tF - 1.2, -31.6, -9.6], [tF - 0.1, -28.8, -11.9], [tF + 0.4, -28.4, -12.2], [tF + 1.2, -32.0, -12.0], [tG, -42.0, -9.0]]);
  const SH = new Mover([[t0, -51.6, -0.8], [tS - 0.6, -51.2, -2.0], [tS + 0.4, -48.8, -4.6], [tShot - 0.55, -47.6, -5.4, { stop: true }], [tG + 1, -47.6, -5.4]], { face: () => 0.15 });
  const others = [
    [ENG('engA', 2, 1.8), new Mover([[t0, -30, -22], [tG, -45, -16]])], [ENG('engB', 3, 1.78), new Mover([[t0, -34, 8], [tG, -47, 4]])],
    [ENG('engA', 4, 1.82), new Mover([[t0, -8, 6], [tG, -26, 1]])], [ENG('engB', 10, 1.75), new Mover([[t0, 6, 14], [tG, -4, 10]])],
    [HODGE, new Mover([[t0, -12, 2], [tG, -30, -2]])], [VALD, new Mover([[t0, -6, -1], [tS, -38, -1.2], [tG, -45.5, -0.5]])],
    [ENRI, new Mover([[t0, 9.0, -6.2], [t0 + 1.2, 8.5, -6.5], [tG, -6, -9]])], [ARG('argB', 7, 1.75), new Mover([[t0, 0, 9], [tG, -24, 5]])],
  ];
  const REFm = new Mover([[t0, -6, 8], [tG, -36, 10]]);
  GC = { D, ball, touches, BE, RE, BU, FE, SH, REFm, others, w: { t0, tRecv, tB, tR, tBu, tF, tS, tG, tShot }, run };
}
function gcItems(t, { tags = true } = {}) {
  const { D, ball, BE, RE, BU, FE, SH, others, w } = GC, items = [], tg = {};
  let ds = moving(D, t, { dribble: 0.7, I: 1 });
  if (t > w.tRecv - 0.2 && t < w.tB) ds = { ...ds, pose: blend(POSE.run(D.at(t).phase, 0.55, 0.9), { lean: 0.28, crouch: 0.1, sh: [[0.3, 0.75], [0.3, 0.75]] }, 0.6) };
  if (t > w.tShot - 0.3 && t < w.tShot + 0.45) ds = { ...ds, pose: POSE.kick(clamp((t - w.tShot + 0.3) / 0.65), 'L') };
  if (t > w.tG - 0.15) ds = { ...ds, pose: blend(ds.pose, { sh: [[0.25, 0.25], [2.75, 0.3]], el: [1.1, 0.25] }, clamp((t - w.tG + 0.15) * 3)), e: 'triumph' };
  items.push(P(DIEGO, ds)); tg.D = ds;
  const lunge = (st, t0, d = 0.55) => (t > t0 && t < t0 + d ? { ...st, pose: blend(st.pose, POSE.slide(), Math.sin(PI * clamp((t - t0) / d)) * 0.75) } : st);
  tg.BE = lunge(moving(BE, t, { e: 'worried' }), w.tB - 0.25); tg.RE = moving(RE, t, { e: 'worried' });
  tg.BU = lunge(moving(BU, t, { e: 'angry' }), w.tBu - 0.2);
  if (t > w.tShot - 0.3) tg.BU = { ...tg.BU, pose: POSE.slide(), head: BU.at(w.tShot - 0.3).head };
  tg.FE = lunge(moving(FE, t, { e: 'worried' }), w.tF - 0.2);
  tg.SH = moving(SH, t, { e: 'focus' });
  if (t > w.tS + 0.35) tg.SH = { ...tg.SH, pose: blend(POSE.stand(), { crouch: 0.22, hip: [[0.35, 0.3], [0.35, 0.3]], knee: [0.7, 0.7], sh: [[0.4, 0.7], [0.4, 0.7]], el: [0.4, 0.4], lean: 0.25 }, 1) };
  if (t > w.tShot - 0.55) tg.SH = { ...tg.SH, pose: blend(tg.SH.pose, POSE.sit(), clamp((t - w.tShot + 0.55) / 0.35)), e: 'shock' };
  items.push(P(BEARD, tg.BE), P(REID, tg.RE), P(BUTCH, tg.BU), P(FENW, tg.FE), P(SHIL, tg.SH));
  for (const [pl, mv] of others) items.push(P(pl, moving(mv, t, { e: 'neutral' })));
  items.push(P(REF, moving(GC.REFm, t, { e: 'neutral' })));
  const b = ball.at(t); items.push(BALL(b.pos, { spin: b.spin, axis: b.axis }));
  return { items, tg, ball: b.pos };
}

// ================= SETS OFF THE PITCH (metres; the camera is the same board camera) =================
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); return true; } return false; };
const bust = (g, who, x, y, z, { e = 'neutral', t = 0, w = 0.34, alpha = 1, tilt = 0 } = {}) => {
  if (depth(x, y, z) < 0.3) return null;
  const p = B.project(x, y, z), s = w * p.s / 210;
  drawChar(g, who, { x: p.x, y: p.y, s, e: typeof e === 'string' ? EXPR[e] : e, t, alpha, tilt });
  return { ...p, s };
};
// an arm for a bust (drawChar units from the head centre, scale hp.s): a sleeve from inside the shoulder bending at the
// elbow to a hand at (hx, hy) with the index finger out (up: the finger's angle, 0 = straight up). No floating fists
function pointArm(g, hp, side, hx, hy, { up = 0, sleeve = '#2C55AE', cuff = '#F4F4F2', skin = SKIN_ARG.base } = {}) {
  const s = hp.s, sx = hp.x + side * 118 * s, sy = hp.y + 250 * s;
  const mx = (sx + hx) / 2, my = (sy + hy) / 2, dx = hx - sx, dy = hy - sy, l = Math.hypot(dx, dy) || 1;
  const bow = Math.max(0, 300 * s - l * 0.35), ex = mx + side * (-dy / l) * bow * -1 + side * 40 * s, ey = my + (dx / l) * bow * side * 0.2 + 40 * s;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = mix(sleeve, '#000000', 0.2); g.lineWidth = 78 * s; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy + 30 * s); g.stroke();
  g.strokeStyle = sleeve; g.lineWidth = 64 * s; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy + 30 * s); g.stroke();
  g.strokeStyle = cuff; g.lineWidth = 66 * s; const cx = lerp(ex, hx, 0.8), cy = lerp(ey, hy + 30 * s, 0.8); g.beginPath(); g.moveTo(cx, cy); g.lineTo(lerp(ex, hx, 0.86), lerp(ey, hy + 30 * s, 0.86)); g.stroke();
  g.translate(hx, hy); g.rotate(up);
  g.fillStyle = mix(skin, '#000000', 0.12); g.beginPath(); g.ellipse(0, 6 * s, 36 * s, 40 * s, 0, 0, 7); g.fill();
  g.fillStyle = skin; g.beginPath(); g.ellipse(-3 * s, 3 * s, 32 * s, 36 * s, 0, 0, 7); g.fill();
  g.strokeStyle = skin; g.lineWidth = 19 * s; g.beginPath(); g.moveTo(-side * 6 * s, -18 * s); g.lineTo(-side * 8 * s, -78 * s); g.stroke();  // the index finger
  g.strokeStyle = mix(skin, '#000000', 0.15); g.lineWidth = 3 * s; for (const k of [0, 1, 2]) { g.beginPath(); g.moveTo(-24 * s, (2 + k * 12) * s); g.lineTo(18 * s, (2 + k * 12) * s); g.stroke(); }
  g.restore();
}
// a T-shirt laid flat or held up: centre (x, y) on screen, width w (px), rotation; back: the number side
function shirtCloth(g, x, y, w, { kit = KITS.arg86, num = 10, back = true, rot = 0, a = 1, sway = 0, shine = 0 } = {}) {
  if (a <= 0) return;
  const h = w * 1.05;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  const body = new Path2D();
  body.moveTo(-w * 0.22, -h / 2); body.quadraticCurveTo(0, -h / 2 + (back ? w * 0.04 : w * 0.12), w * 0.22, -h / 2);
  body.lineTo(w * 0.5, -h * 0.38); body.lineTo(w * 0.42 + sway, -h * 0.14); body.lineTo(w * 0.3, -h * 0.2);
  body.lineTo(w * 0.32 + sway * 0.5, h / 2); body.quadraticCurveTo(0, h / 2 + w * 0.03, -w * 0.32 + sway * 0.5, h / 2);
  body.lineTo(-w * 0.3, -h * 0.2); body.lineTo(-w * 0.42 + sway, -h * 0.14); body.lineTo(-w * 0.5, -h * 0.38); body.closePath();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.translate(w * 0.02, w * 0.03); g.fill(body); g.translate(-w * 0.02, -w * 0.03);
  const gr = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gr.addColorStop(0, mix(kit.shirt, '#FFFFFF', 0.12)); gr.addColorStop(1, kit.shirtD);
  g.fillStyle = gr; g.fill(body);
  g.save(); g.clip(body);
  if (kit.stripe) { g.fillStyle = kit.stripe; for (const fx of [-0.16, 0.12]) g.fillRect(w * fx, -h / 2, w * 0.07, h); }
  g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = w * 0.01; for (const fx of [-0.18, 0.05, 0.2]) { g.beginPath(); g.moveTo(w * fx, -h * 0.1); g.quadraticCurveTo(w * (fx + 0.04), h * 0.15, w * fx, h * 0.45); g.stroke(); }
  g.restore();
  g.strokeStyle = kit.trim; g.lineWidth = w * 0.035; g.lineJoin = 'round'; g.beginPath();
  if (back) { g.moveTo(-w * 0.2, -h / 2 + w * 0.01); g.quadraticCurveTo(0, -h / 2 + w * 0.05, w * 0.2, -h / 2 + w * 0.01); }
  else { g.moveTo(-w * 0.17, -h / 2 + w * 0.01); g.lineTo(0, -h / 2 + w * 0.16); g.lineTo(w * 0.17, -h / 2 + w * 0.01); }
  g.stroke();
  if (back && num != null && kit.num) {
    g.font = sans(Math.round(w * 0.42), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = w * 0.03; g.strokeStyle = kit.numEdge || '#555'; g.strokeText(String(num), 0, h * 0.04);
    const ng = g.createLinearGradient(0, -h * 0.15, 0, h * 0.25); ng.addColorStop(0, '#FFFFFF'); ng.addColorStop(0.5 - shine * 0.3, kit.num); ng.addColorStop(1, mix(kit.num, '#5A626C', 0.5));
    g.fillStyle = ng; g.fillText(String(num), 0, h * 0.04);
  }
  if (!back && kit.badge) { g.fillStyle = kit.badge; g.beginPath(); g.ellipse(w * 0.14, -h * 0.25, w * 0.035, w * 0.045, 0, 0, 7); g.fill(); }
  g.restore();
}

// ---------- the press room after the match (1986): a blue backdrop, a long table, microphones, photographers ----------
const BACKDROP = tex(1024, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1C3F7A'); gr.addColorStop(1, '#122C58'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.font = sans(22, 900); g.letterSpacing = '6px'; g.fillStyle = 'rgba(255,255,255,0.07)'; g.textAlign = 'center';
  for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) g.fillText('MÉXICO 1986', (c + (r % 2) * 0.5) * 190, 40 + r * 50);
});
const MICS = ['#C8262E', '#15171C', '#E8C23A', '#2C55AE', '#5A5E66', '#1F7A45', '#E07A2A'];
function pressRoom(g, t, { flashes = [], lit = 0 } = {}) {
  g.fillStyle = '#0C1426'; g.fillRect(0, 0, W, H);
  quad(g, [[-6, 0, 2.4], [6, 0, 2.4], [6, 0, -6], [-6, 0, -6]], '#2A3242');  // carpet
  texQuadW(g, B, BACKDROP, [-4.5, 0, 2.4], [4.5, 0, 2.4], [4.5, 3.4, 2.4], [-4.5, 3.4, 2.4], [0, 512, 1024, 0]);
  for (const sx of [-1, 1]) quad(g, [[sx * 4.5, 0, 2.4], [sx * 4.5, 3.4, 2.4], [sx * 4.5, 3.4, -6], [sx * 4.5, 0, -6]], sx < 0 ? '#3A2A1E' : '#2E2218');
  pool(g, B, 0, 1.6, 2.35, 3.2, '#FFF1D8', 0.28 + lit * 0.4, true);
}
function pressTable(g, t, { name = 'D. MARADONA' } = {}) {
  box(g, B, [-2.6, 0, -0.25], [2.6, 0.76, 0.55], { top: '#EDE9E0', side: '#C9C4BA', front: '#DCD6CA' });
  for (let i = 0; i < 7; i++) {  // the bunch of microphones on stands
    const x = -0.55 + i * 0.18, z = -0.12 - (i % 2) * 0.08, top = [x * 0.6, 1.02 + (i % 3) * 0.05, 0.12];
    if (depth(x, 0.77, z) < 0.3) continue;
    const a = B.project(x, 0.77, z), b = B.project(...top);
    g.strokeStyle = '#1A1C20'; g.lineWidth = Math.max(1.5, a.s * 0.012); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.fillStyle = MICS[i % MICS.length]; g.beginPath(); g.ellipse(b.x, b.y, b.s * 0.045, b.s * 0.06, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(b.x - b.s * 0.015, b.y - b.s * 0.02, b.s * 0.015, b.s * 0.02, 0, 0, 7); g.fill();
  }
  // a name card on the cloth
  const c0 = [-0.95, 0.77, -0.1], c1 = [-0.35, 0.77, -0.1];
  if (depth(...c0) > 0.3) { const p = B.project(...c0), q = B.project(...c1), hh = p.s * 0.12; g.fillStyle = '#F7F4EC'; g.fillRect(p.x, p.y - hh, q.x - p.x, hh); g.fillStyle = NAVY; g.font = sans(Math.max(8, Math.round(hh * 0.5)), 900); g.textAlign = 'center'; g.fillText(name, (p.x + q.x) / 2, p.y - hh * 0.3); }
}
function photographers(g, t, flashes) {  // dark heads and cameras in the foreground, flashes going off
  const r = rng(5);
  for (let i = 0; i < 6; i++) {
    const x = (i % 2 ? 1 : -1) * (1.5 + Math.floor(i / 2) * 0.45 + r() * 0.2), z = -1.2 - Math.floor(i / 2) * 0.3, y = 0.95 + r() * 0.2;
    if (depth(x, y, z) < 0.4) continue;
    const p = B.project(x, y, z), s = p.s;
    g.save(); g.filter = 'blur(6px)'; g.fillStyle = '#0B0F18';
    g.beginPath(); g.ellipse(p.x, p.y, s * 0.13, s * 0.16, 0, 0, 7); g.fill(); g.fillRect(p.x - s * 0.28, p.y + s * 0.12, s * 0.56, s * 0.9);
    g.fillStyle = '#16191F'; g.fillRect(p.x - s * 0.12, p.y - s * 0.08, s * 0.24, s * 0.14); g.restore();
    for (const f of flashes) {
      if (f.i !== i || t < f.t || t > f.t + 0.16) continue;
      const u = 1 - (t - f.t) / 0.16, gr = g.createRadialGradient(p.x, p.y - s * 0.05, 0, p.x, p.y - s * 0.05, s * 1.6);
      gr.addColorStop(0, `rgba(255,255,255,${0.95 * u})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = `rgba(255,250,240,${0.18 * u})`; g.fillRect(0, 0, W, H); g.restore();
    }
  }
}

// ---------- the radio booth high in the stand; through its window the pitch, live ----------
const FEED = makeCanvas(), fdx = FEED.getContext('2d'), BF = new Board();
function feedStadium(t, { kite = 0 } = {}) {  // the stadium through the window: the run's own camera, still going
  const keep = { yaw: B.yaw, pitch: B.pitch, dist: B.dist, fov: B.f, target: B.T, cx: B.cx, cy: B.cy };
  B.setCam(GC.camAt(t));
  fdx.setTransform(1, 0, 0, 1, 0, 0);
  stadium(fdx, t, gcItems(t).items, { cheer: 1, hitL: { t0: GC.w.tG + 0.06, y: 0.45, z: -1.4, k: 1 }, blur: 1.5 });
  if (kite > 0) kiteIn(fdx, t, kite);
  B.setCam(keep);
}
function kiteIn(g, t, u) {  // a kite in sky blue and white with a 10 on it, climbing over the far stand ("barrilete" is a kite)
  const x = lerp(W * 0.2, W * 0.68, ease.out(u)), y = lerp(H * 0.36, H * 0.08, ease.out(u)), s = 120;
  g.save(); g.translate(x, y); g.rotate(-0.25 + Math.sin(t * 3) * 0.1);
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, s); for (let k = 1; k <= 6; k++) g.quadraticCurveTo(Math.sin(t * 5 + k) * 30, s + k * 40, Math.sin(t * 4 + k) * 20, s + k * 48); g.stroke();
  const diamond = () => { g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, 0); g.lineTo(0, s); g.lineTo(-s * 0.7, 0); g.closePath(); };
  diamond(); g.fillStyle = SKY; g.fill(); g.save(); diamond(); g.clip(); g.fillStyle = '#FFFFFF'; g.fillRect(-s, -s * 0.22, 2 * s, s * 0.44); g.restore();
  g.fillStyle = NAVY; g.font = sans(70, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', 0, 4);
  g.restore();
}
function booth(g, t, lt) {
  g.fillStyle = '#1A1D22'; g.fillRect(0, 0, W, H);
  const WX = 1.1, Y0 = 0.9, Y1 = 2.6;
  // the window: the live stadium mapped into the frame (perspective-correct), then the glass and the frame
  const fh = W / (2 * WX / (Y1 - Y0)), fc = H * 0.5;
  texQuadW(g, B, FEED, [-WX, Y0, 0], [WX, Y0, 0], [WX, Y1, 0], [-WX, Y1, 0], [0, fc + fh / 2, W, fc - fh / 2], { live: true });
  quad(g, [[-WX, Y0, 0], [WX, Y0, 0], [WX, Y1, 0], [-WX, Y1, 0]], 'rgba(170,200,220,0.08)');
  for (const x of [-WX, WX]) quad(g, [[x - 0.05, Y0, -0.01], [x + 0.05, Y0, -0.01], [x + 0.05, Y1, -0.01], [x - 0.05, Y1, -0.01]], '#2A2E34');
  quad(g, [[-3.5, Y1, -0.01], [3.5, Y1, -0.01], [3.5, 3.2, -0.01], [-3.5, 3.2, -0.01]], '#5E5A54');  // concrete over and under the window
  quad(g, [[-3.5, 0, -0.01], [3.5, 0, -0.01], [3.5, Y0, -0.01], [-3.5, Y0, -0.01]], '#4E4A44');
  for (const x of [-3.5, 3.5]) quad(g, [[x, 0, 0], [x, 3.2, 0], [x, 3.2, -4], [x, 0, -4]], x < 0 ? '#45423D' : '#3B3934');
  quad(g, [[-3.5, 0, 0], [3.5, 0, 0], [3.5, 0, -4], [-3.5, 0, -4]], '#2C2A27');
  box(g, B, [-2.4, 0.78, -0.75], [2.4, 0.86, -0.02], { top: '#7A5636', side: '#4E3622', front: '#5E4228' });  // the desk
  box(g, B, [-2.4, 0, -0.7], [2.4, 0.78, -0.62], { top: '#3A2A1C', side: '#2A1E14', front: '#33251A' });
  for (const [x, z, w2, h2, c] of [[0.7, -0.4, 0.3, 0.02, '#EDE6D6'], [1.0, -0.5, 0.26, 0.02, '#E6DECA'], [-1.6, -0.45, 0.38, 0.22, '#2B2F35']]) box(g, B, [x, 0.86, z], [x + w2, 0.86 + h2, z + 0.22], { top: c, side: mix(c, '#000', 0.25), front: mix(c, '#000', 0.15) });
}
function microphone(g, x, y, z, s0 = 1) {  // a big 1980s broadcast microphone on a desk stand
  if (depth(x, y, z) < 0.3) return;
  const b = B.project(x, 0.86, z), p = B.project(x, y, z), s = p.s * s0;
  g.strokeStyle = '#2A2C30'; g.lineWidth = Math.max(2, s * 0.02); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(p.x, p.y); g.stroke();
  const gr = g.createLinearGradient(p.x - s * 0.05, 0, p.x + s * 0.05, 0); gr.addColorStop(0, '#9AA0A8'); gr.addColorStop(0.5, '#E2E6EA'); gr.addColorStop(1, '#6E747C');
  g.fillStyle = gr; g.beginPath(); g.roundRect(p.x - s * 0.05, p.y - s * 0.13, s * 0.1, s * 0.16, s * 0.05); g.fill();
  g.strokeStyle = 'rgba(40,40,40,0.4)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(p.x - s * 0.05, p.y - s * 0.13 + k * s * 0.025); g.lineTo(p.x + s * 0.05, p.y - s * 0.13 + k * s * 0.025); g.stroke(); }
}

// ---------- the street market (Tepito, Mexico City), and the iron-on numbers ----------
const TARPS = ['#E85D9A', '#F2C14E', '#2FB5A8', '#F28A3A', '#7E5BD6', '#E0603F'];
const RACK = ['#E0603F', '#F2F2EE', '#2FB5A8', '#E8C23A', '#1E1E22', '#7FC1EC', '#C8262E', '#2E8B4E'];
function market(g, t, { pick = 0 } = {}) {
  sky(g, B, { t, zen: '#2F78C8', mid: '#7CB4E2', hor: '#E6EEF0', clouds: 0.6 });
  quad(g, [[-30, 0, -30], [30, 0, -30], [30, 0, 40], [-30, 0, 40]], '#7A766E');
  const facades = ['#E89BB0', '#F2D27A', '#7FC9C0', '#F0A86A', '#C9B3E6', '#EDE6D6'];
  for (let i = 0; i < 9; i++) {  // the street's facades behind the stalls
    const x0 = -16 + i * 4, c = facades[i % facades.length], hgt = 7 + (i * 37 % 5);
    quad(g, [[x0, 0, 14], [x0 + 4, 0, 14], [x0 + 4, hgt, 14], [x0, hgt, 14]], c);
    for (let fl = 0; fl < 2; fl++) for (let k = 0; k < 2; k++) quad(g, [[x0 + 0.6 + k * 1.8, 2.6 + fl * 2.6, 13.98], [x0 + 1.6 + k * 1.8, 2.6 + fl * 2.6, 13.98], [x0 + 1.6 + k * 1.8, 4.0 + fl * 2.6, 13.98], [x0 + 0.6 + k * 1.8, 4.0 + fl * 2.6, 13.98]], mix(c, '#2A2F38', 0.55));
  }
  for (let i = 0; i < 6; i++) {  // stalls: a table, poles and a tarp, a rail of shirts
    const x0 = -9 + i * 3.2, z0 = 6 + (i % 2) * 1.2, col = TARPS[i % TARPS.length];
    box(g, B, [x0, 0.75, z0], [x0 + 2.6, 0.82, z0 + 1.2], { top: '#B8A68A', side: '#7A6A52', front: '#8E7C62' });
    for (const px of [x0, x0 + 2.6]) quad(g, [[px - 0.03, 0, z0], [px + 0.03, 0, z0], [px + 0.03, 2.6, z0], [px - 0.03, 2.6, z0]], '#4A4A4A');
    quad(g, [[x0 - 0.3, 2.7, z0 - 0.4], [x0 + 2.9, 2.7, z0 - 0.4], [x0 + 2.9, 2.3, z0 + 1.6], [x0 - 0.3, 2.3, z0 + 1.6]], col);
    for (let k = 0; k < 9; k++) { const x = x0 + 0.15 + k * 0.27; quad(g, [[x, 1.2, z0 - 0.05], [x + 0.22, 1.2, z0 - 0.05], [x + 0.22, 2.0, z0 - 0.05], [x, 2.0, z0 - 0.05]], RACK[(i * 3 + k) % RACK.length]); }
  }
  // the hero rack in front: blue shirts, two kinds
  for (let k = 0; k < 10; k++) {
    const x = -1.6 + k * 0.32, z = 1.2, c = k < 5 ? '#2C55AE' : '#2A4A9E';
    if (depth(x + 0.15, 1.6, z) < 0.3) continue;
    const p = B.project(x + 0.15, 1.65, z), s = p.s;
    shirtCloth(g, p.x, p.y, s * 0.42, { kit: { ...KITS.arg86, shirt: c, shirtD: mix(c, '#000', 0.3), stripe: k < 5 ? 'rgba(255,255,255,0.07)' : null }, back: false, rot: Math.sin(t * 1.3 + k) * 0.03, a: 1 });
  }
  const a = B.project(-1.7, 2.12, 1.2), b = B.project(1.7, 2.12, 1.2); g.strokeStyle = '#9AA0A8'; g.lineWidth = 6; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
}
function ironing(g, t, u) {  // the board, the blue shirt laid back up, the iron passing over a silver 10
  g.fillStyle = '#3A3530'; g.fillRect(0, 0, W, H);
  quad(g, [[-1.2, 0.9, -0.5], [1.2, 0.9, -0.5], [1.0, 0.9, 0.5], [-1.4, 0.9, 0.5]], '#D9D4C8');
  const p = B.project(0, 0.9, 0), s = p.s;
  shirtCloth(g, p.x, p.y, s * 0.9, { back: true, num: 10, shine: u, a: 1 });
  // the iron: a 1980s white-and-blue steam iron sliding across the number, seen from above
  const ix = lerp(0.5, -0.32, ease.inOut(clamp(u))), q = B.project(ix, 0.97, 0.02), sz = q.s * 0.55;
  g.save(); g.translate(q.x, q.y); g.rotate(-0.12);
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(sz * 0.06, sz * 0.08, sz * 0.42, sz * 0.2, 0, 0, 7); g.fill();
  const plateP = new Path2D(); plateP.moveTo(-sz * 0.42, sz * 0.16); plateP.quadraticCurveTo(-sz * 0.4, -sz * 0.16, sz * 0.05, -sz * 0.18); plateP.quadraticCurveTo(sz * 0.36, -sz * 0.12, sz * 0.48, 0); plateP.quadraticCurveTo(sz * 0.36, sz * 0.12, sz * 0.05, sz * 0.18); plateP.closePath();
  g.fillStyle = '#B9BEC4'; g.fill(plateP); g.save(); g.scale(0.86, 0.78); g.fillStyle = '#F4F3EF'; g.fill(plateP); g.restore();
  g.fillStyle = '#2C55AE'; g.beginPath(); g.roundRect(-sz * 0.3, -sz * 0.07, sz * 0.5, sz * 0.14, sz * 0.07); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-sz * 0.1, -sz * 0.1, sz * 0.16, sz * 0.03, 0, 0, 7); g.fill();
  g.restore();
  const r = rng(3);  // a little steam
  for (let k = 0; k < 7; k++) { const ph = (t * 0.9 + r()) % 1, x = q.x - sz * 0.3 + (r() - 0.5) * sz * 0.4, y = q.y - sz * 0.15 - ph * sz * 0.9; g.fillStyle = `rgba(255,255,255,${(0.28 * (1 - ph)).toFixed(3)})`; g.beginPath(); g.arc(x + Math.sin(t * 2 + k) * 8, y, sz * (0.05 + ph * 0.1), 0, 7); g.fill(); }
}

// ---------- the auction: a dark green gallery, the shirt in a glass case, the online bids on a screen ----------
function gallery(g, t, { bid = 0, sold = 0 } = {}) {
  g.fillStyle = '#0D1A15'; g.fillRect(0, 0, W, H);
  quad(g, [[-6, 0, 4], [6, 0, 4], [6, 0, -6], [-6, 0, -6]], '#2A2420');
  quad(g, [[-6, 0, 4], [6, 0, 4], [6, 4.2, 4], [-6, 4.2, 4]], '#1E3A2E');
  for (const sx of [-1, 1]) quad(g, [[sx * 6, 0, 4], [sx * 6, 4.2, 4], [sx * 6, 4.2, -6], [sx * 6, 0, -6]], '#17302A');
  for (let i = 0; i < 3; i++) { const x = -4.6 + i * 3.4; quad(g, [[x, 1.5, 3.98], [x + 1.4, 1.5, 3.98], [x + 1.4, 3.0, 3.98], [x, 3.0, 3.98]], '#B8924A'); quad(g, [[x + 0.1, 1.6, 3.97], [x + 1.3, 1.6, 3.97], [x + 1.3, 2.9, 3.97], [x + 0.1, 2.9, 3.97]], '#2A2A2A'); }
  pool(g, B, 0, 0.02, 0.8, 1.8, '#FFF1D8', 0.35);
  box(g, B, [-0.55, 0, 0.3], [0.55, 1.05, 1.3], { top: '#E8E2D6', side: '#BDB5A6', front: '#D2CBBE' });  // plinth
  // the case: a thin frame and glass; the shirt mounted inside, back out (the silver 10)
  const c = B.project(0, 1.75, 0.8), s = c.s;
  shirtCloth(g, c.x, c.y, s * 0.78, { back: true, num: 10, a: 1 });
  for (const [a, b] of [[[-0.5, 1.07, 0.35], [-0.5, 2.45, 0.35]], [[0.5, 1.07, 0.35], [0.5, 2.45, 0.35]], [[-0.5, 2.45, 0.35], [0.5, 2.45, 0.35]], [[-0.5, 2.45, 1.25], [0.5, 2.45, 1.25]], [[-0.5, 2.45, 0.35], [-0.5, 2.45, 1.25]], [[0.5, 2.45, 0.35], [0.5, 2.45, 1.25]]]) {
    if (depth(...a) < 0.3 || depth(...b) < 0.3) continue; const p = B.project(...a), q = B.project(...b); g.strokeStyle = '#C9B27A'; g.lineWidth = Math.max(1.5, p.s * 0.012); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
  quad(g, [[-0.5, 1.07, 0.35], [0.5, 1.07, 0.35], [0.5, 2.45, 0.35], [-0.5, 2.45, 0.35]], 'rgba(200,230,240,0.10)');
  const gl = B.project(-0.3, 2.2, 0.35); g.save(); g.globalCompositeOperation = 'screen'; g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = gl.s * 0.05; g.beginPath(); g.moveTo(gl.x, gl.y); g.lineTo(gl.x + gl.s * 0.2, gl.y + gl.s * 0.35); g.stroke(); g.restore();
  // the screen on the wall with the online bidding
  const sc = [[1.1, 1.45, 3.95], [3.7, 1.45, 3.95], [3.7, 2.95, 3.95], [1.1, 2.95, 3.95]];
  if (quad(g, sc, '#0A0F14')) {
    const a = B.project(...sc[3]), b = B.project(...sc[2]), d = B.project(...sc[0]), w2 = b.x - a.x, h2 = d.y - a.y;
    const fit = (txt, px, wt = 900) => { let fs = px; g.font = sans(Math.round(fs), wt); while (g.measureText(txt).width > w2 * 0.86 && fs > 6) { fs *= 0.92; g.font = sans(Math.round(fs), wt); } };
    g.save(); g.fillStyle = '#E8E4DA'; g.textAlign = 'center'; g.letterSpacing = '3px';
    fit('LOT · 1986 SHIRT · No. 10', h2 * 0.1); g.fillText('LOT · 1986 SHIRT · No. 10', a.x + w2 / 2, a.y + h2 * 0.2);
    const amount = '$' + Math.round(bid).toLocaleString('en-US'); g.letterSpacing = '0px'; fit(amount, h2 * 0.26); g.fillStyle = sold > 0 ? GOLD : '#FFFFFF';
    g.fillText(amount, a.x + w2 / 2, a.y + h2 * 0.6);
    g.font = sans(Math.round(h2 * 0.09), 800); g.fillStyle = sold > 0 ? '#7FD18A' : '#9AA4AE'; g.fillText(sold > 0 ? 'SOLD' : 'ONLINE BIDDING', a.x + w2 / 2, a.y + h2 * 0.85);
    g.restore();
  }
}

// a generic gold cup with two handles (not the real trophy's design)
function cup(g, x, y, s, { a = 1 } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y);
  const gr = g.createLinearGradient(-s * 0.5, 0, s * 0.5, 0); gr.addColorStop(0, '#9C7420'); gr.addColorStop(0.35, '#F7DC7A'); gr.addColorStop(0.6, '#E2B640'); gr.addColorStop(1, '#8A6418');
  g.fillStyle = gr; g.strokeStyle = gr; g.lineWidth = s * 0.08;
  g.beginPath(); g.moveTo(-s * 0.42, -s * 0.9); g.quadraticCurveTo(-s * 0.46, -s * 0.2, -s * 0.08, 0); g.lineTo(s * 0.08, 0); g.quadraticCurveTo(s * 0.46, -s * 0.2, s * 0.42, -s * 0.9); g.closePath(); g.fill();
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * s * 0.48, -s * 0.6, s * 0.16, s * 0.22, 0, 0, 7); g.stroke(); }
  g.fillRect(-s * 0.06, 0, s * 0.12, s * 0.35); g.beginPath(); g.roundRect(-s * 0.3, s * 0.35, s * 0.6, s * 0.16, s * 0.04); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(-s * 0.18, -s * 0.6, s * 0.05, s * 0.2, -0.2, 0, 7); g.fill();
  g.restore();
}

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: NOON, trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  hgInit(); hgWarp(T); goalOfCentury(T);
  const tPunch = w('punch', 'punches'), tauOf = t => hgTau(t);

  // ======================= HOOK 1: the fist on the ball, from the goal mouth (the cover: bright sky, his face lit) ===========
  const handT = w('hook', 'hand'), fourT = w('hook', 'four'), goalT = w('hook', 'goal'), centT = w('hook', 'century');
  shot(0, (g, lt, t) => {
    const tau = HG.punch - 0.06 + lt * 0.03;  // nearly frozen at the moment of the punch
    rig(B, lt, [[0, K(-0.78, -0.26, 4.4, [-46.9, 1.7, 0.3], { cy: H * 0.56 })], [len({ a: 0, b: fourT }), K(-0.64, -0.22, 3.8, [-46.85, 1.75, 0.3], { cy: H * 0.56 })]], { t, e: glide });
    stadium(g, t, hgItems(tau, t).items, { cheer: 0.4, blur: 3.5 });
    if (t > handT) {  // the replay ring round the fist
      const sk = skeleton(DIEGO, hgItems(tau, t).items[0].st), hp = B.project(...sk.arms[0].hand), u = clamp((t - handT) / 0.22);
      g.save(); g.strokeStyle = RED; g.lineWidth = 9; g.globalAlpha = u; g.beginPath(); g.arc(hp.x, hp.y, hp.s * 0.22 * (1.4 - 0.4 * ease.back(u)), 0, 7); g.stroke(); g.restore();
    }
  }, { hud: (g, lt, t) => bigText(g, 'HE SCORED', 'WITH HIS HAND', 300, { sc: 1 }), kb: 0.03 });
  cue(0.02, 'crowd_gasp', 0.5); cue(handT, 'fist', 0.9); cue(handT, 'dun_dun', 0.5);

  // ======================= HOOK 2: four minutes later, the run; the ball in the net =======================
  shot(fourT - 0.06, (g, lt, t) => {
    const tt = GC.w.tBu - 0.7 + lt;  // the run, around Butcher
    const st = GC.D.at(tt), u = clamp(lt / 1.6);
    rig(B, lt, [[0, K(lerp(0.62, 0.5, u), 0.1, lerp(7.6, 6.9, u), [st.x - 1.4, 0.95, st.z])]], { t });
    stadium(g, t, gcItems(tt).items, { cheer: 0.3, blur: 2.5 });
  }, { trans: 'whip', mbStep: 4, hud: (g, lt, t) => { if (t < goalT) plate(g, '4 MINUTES LATER', W / 2, 260, { color: GOLD, size: 56, ...pin(t, fourT) }); } });
  shot(goalT - 0.04, (g, lt, t) => {
    const tt = GC.w.tG - (centT - t);  // the ball reaches the net on "century"
    rig(B, lt, [[0, K(-2.46, 0.08, 6.5, [-51.5, 0.8, -3.5])], [len({ a: 0, b: 1.4 }), K(-2.36, 0.1, 5.9, [-51.5, 0.85, -3.5])]], { t, e: glide });
    stadium(g, t, gcItems(tt).items, { cheer: t > centT ? 1 : 0.2, hitL: { t0: centT + 0.02, y: 0.45, z: -1.4, k: 1 }, blur: 2 });
  }, { hud: (g, lt, t) => { if (t > centT) bigText(g, 'THE GOAL OF', 'THE CENTURY', 300, { a: clamp((t - centT) / 0.15), sc: lerp(1.25, 1, ease.out(clamp((t - centT) / 0.25))) }); } });
  cue(fourT - 0.1, 'whoosh_fast', 0.4); cue(goalT - 0.35, 'kick', 0.8); cue(centT, 'net', 1.0); cue(centT, 'crowd_roar', 0.9); cue(centT, 'boom_cine', 0.55);

  // ======================= PLACE: Mexico City from the air, down into the Azteca =======================
  const plS = s('place'), mxT = w('place', 'mexico'), yrT = w('place', '1986'), wcT = w('place', 'world'), argT = w('place', 'argentina'), engT = w('place', 'england'), fourY = w('place', 'four'), falkT = w('place', 'falklands');
  shot(plS - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(0.9, 0.5, 900, [60, 0, -40])], [wcT - plS + 0.4, K(0.55, 0.58, 330, [0, 10, 0]), ease.inOut]], { t });
    stadium(g, t, [], { outside: true, cheer: 0.2, skyO: { haze: 0.15 } });
  }, { trans: 'zoom', hud: (g, lt, t) => {
    stampPlate(g, 'Mexico City', '1986', 170, t, mxT);
    if (t > yrT) counter(g, Math.round(114580 * ease.out(clamp((t - yrT) / 0.9))).toLocaleString('en-US'), 'IN THE STANDS', { y: 400, size: 120, color: CREAM, at: [t, yrT] });
  } });
  cue(plS - 0.1, 'whoosh_deep', 0.45); cue(yrT, 'sparkle_pop', 0.25);
  // the two teams lined up on the halfway line, the camera sweeping in over the stand
  const lineup = (t) => {
    const items = [];
    const ARGL = [[DIEGO], [VALD], [ENRI], [ARG('argB', 7)], [ARG('argA', 2)], [ARG('argB', 5)], [ARG('argA', 19)], [ARG('argB', 9)], [ARG('argA', 16)], [ARG('argB', 14)], [{ who: 'argA', kit: { ...KITS.arg86, shirt: '#E8C23A', shirtD: '#C9A030', num: '#1E2D5C', numEdge: '#E8C23A', long: true, gloves: '#EEEDE6' }, num: 18, h: 1.86 }]];
    const ENGL = [[SHIL], [ENG('engA', 2)], [ENG('engB', 3)], [ENG('engA', 4)], [BUTCH], [FENW], [REID], [HODGE], [BEARD], [ENG('engB', 10)], [ENG('engA', 17)]];
    ARGL.forEach(([pl], i) => items.push(P(pl, { x: -1.4 - i * 1.4, z: -8, head: -PI / 2, pose: POSE.stand(), e: i ? 'neutral' : 'focus', t: t + i })));
    ENGL.forEach(([pl], i) => items.push(P(pl, { x: 1.4 + i * 1.4, z: -8, head: -PI / 2, pose: POSE.stand(), e: 'neutral', t: t + i * 1.3 })));
    items.push(P(REF, { x: 0, z: -8, head: -PI / 2, pose: POSE.stand(), e: 'neutral', t }));
    return items;
  };
  shot(wcT - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(0.25, 0.42, 48, [0, 2, -6])], [len({ a: 0, b: argT - wcT }), K(0.1, 0.12, 13, [0, 1.3, -8]), ease.inOut]], { t });
    stadium(g, t, lineup(t), { cheer: 0.6 });
  }, { trans: 'whip', hud: (g, lt, t) => { plate(g, 'WORLD CUP · QUARTER-FINAL', W / 2, 250, { color: GOLD, size: 52, ...pin(t, wcT + 0.05) }); if (t > wcT + 0.3) plate(g, '22 JUNE 1986 · ESTADIO AZTECA', W / 2, 345, { color: CREAM, size: 32, ...pin(t, wcT + 0.3) }); } });
  cue(wcT - 0.1, 'whoosh_fast', 0.35); cue(wcT + 0.05, 'stamp', 0.4);
  // Argentina | England: a split face-off, each half sliding in on its word
  shot(argT - 0.05, (g, lt, t) => {
    const u = ease.out(clamp((t - engT + 0.05) / 0.3));
    const left = () => { rig(B, lt, [[0, K(-0.32, -0.04, 2.7, [-1.4, 1.38, -8])], [3, K(-0.22, -0.02, 2.3, [-1.4, 1.4, -8])]], { t }); stadium(g, t, lineup(t), { cheer: 0.6, blur: 4 }); };
    const right = () => { rig(B, lt, [[0, K(0.32, -0.04, 2.9, [1.4, 1.55, -8])], [3, K(0.22, -0.02, 2.5, [1.4, 1.57, -8])]], { t }); stadium(g, t, lineup(t), { cheer: 0.6, blur: 4 }); };
    if (u <= 0) { left(); return; }
    g.save(); g.beginPath(); g.rect(0, 0, W - u * W / 2, H); g.clip(); g.translate(-u * W / 4, 0); left(); g.restore();  // Argentina slides to the left half
    g.save(); g.beginPath(); g.rect(W - u * W / 2, 0, u * W / 2, H); g.clip(); g.translate(W / 4 + (1 - u) * W / 4, 0); right(); g.restore();  // England comes in on the right
    g.save(); g.fillStyle = CREAM; g.fillRect(W - u * W / 2 - 3, 0, 6, H); g.restore();
  }, { trans: 'cut', hud: (g, lt, t) => {
    const u = ease.out(clamp((t - engT + 0.05) / 0.3)); plate(g, 'MARADONA · 10', lerp(W / 2, W * 0.25, u), 1500, { color: SKY, size: 40, ...pin(t, argT) });
    if (t > engT) plate(g, 'SHILTON · 1', W * 0.75, 1500, { color: CREAM, size: 40, ...pin(t, engT) });
  } });
  cue(argT - 0.08, 'whoosh_fast', 0.35); cue(engT - 0.08, 'whoosh_fast', 0.35); cue(argT, 'sparkle_pop', 0.25); cue(engT, 'sparkle_pop', 0.25);
  // four years after the Falklands War: low along the halfway line between the two lines, cold
  shot(fourY - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(-1.2, 0.05, 9.8, [-8.3, 1.32, -8])], [len({ a: 0, b: s('loop') - fourY }), K(-1.2, 0.06, 8.8, [-8.6, 1.35, -8]), ease.inOut]], { t });
    stadium(g, t, lineup(t), { cheer: 0.1, blur: 2 });
  }, { grade: 'cold', hud: (g, lt, t) => { if (t > falkT) plate(g, 'FALKLANDS WAR · 1982', W / 2, 260, { color: RED, size: 54, ...pin(t, falkT) }); } });
  cue(fourY - 0.05, 'heartbeat', 0.45); cue(falkT, 'dun_dun', 0.5);

  // ======================= 51': the ball back to the keeper =======================
  const lpS = s('loop'), midT = w('loop', 'midfielder'), loopsT = w('loop', 'loops'), keepT = w('loop', 'keeper');
  shot(lpS - 0.05, (g, lt, t) => {
    const tau = tauOf(t), bp = hgBall.at(tau).pos;
    rig(B, lt, [[0, K(0.1, 0.62, 44, [-33, 0, -1])], [len({ a: 0, b: loopsT - lpS }), K(0.22, 0.5, 34, [-37, 0, 1.5])]], { t, e: glide });
    const H1 = hgItems(tau, t); stadium(g, t, H1.items, { cheer: 0.4 });
    if (t > midT) { const u = clamp((t - midT) / 0.25); g.save(); g.strokeStyle = GOLD; g.lineWidth = 6; g.globalAlpha = u; const q = B.project(H1.hodge.st.x, 0.02, H1.hodge.st.z); g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.9, q.s * 0.35, 0, 0, 7); g.stroke(); g.restore(); }
    void bp;
  }, { trans: 'whip', hud: (g, lt, t) => scoreBug(g, 0, 0, "51'", { al: 1 }) });
  cue(lpS - 0.1, 'whistle', 0.25); cue(HG.pass, 'kick', 0.5); cue(midT, 'sparkle_pop', 0.2);
  shot(loopsT - 0.12, (g, lt, t) => {
    const tau = tauOf(t), H1 = hgItems(tau, t), bp = H1.ball;
    rig(B, lt, [[0, K(0.15, 0.2, 14, [-40.5, 1.6, 4], { cy: H * 0.42 })], [len({ a: 0, b: s('punch') - loopsT }), K(0.05, 0.16, 13, [-44.5, 2.4, 1.5], { cy: H * 0.42 })]], { t, e: glide });
    stadium(g, t, H1.items, { cheer: 0.4, blur: 1.5 });
    // the loop drawn as a dotted arc ahead of the ball
    g.save(); g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 1; k <= 14; k++) { const q = hgBall.at(tau + k * 0.1).pos; if (depth(...q) < 0.5) continue; const p = B.project(...q); g.globalAlpha = 0.8 * (1 - k / 15); g.beginPath(); g.arc(p.x, p.y, 5, 0, 7); g.fill(); }
    g.restore(); void bp;
  }, { hud: (g, lt, t) => scoreBug(g, 0, 0, "51'") });
  cue(loopsT, 'kick', 0.7); cue(keepT, 'whoosh_soft', 0.3);

  // ======================= the punch: slow motion, the heights, the jump, the fist =======================
  const puS = s('punch'), sevT = w('punch', 'seven'), jumpT = w('punch', 'jumps'), inT = w('punch', 'in');
  shot(puS - 0.05, (g, lt, t) => {
    const tau = tauOf(t), H1 = hgItems(tau, t);
    rig(B, lt, [[0, K(0.08, 0.02, 10.4, [-45.6, 1.3, 0.25])], [len({ a: 0, b: jumpT - puS }), K(0.2, -0.02, 6.4, [-46.8, 1.4, 0.25])]], { t, e: glide });
    stadium(g, t, H1.items, { cheer: 0.3, blur: 3 });
    if (t > sevT) {  // height marks: a line over each head to a ruler, the gap between them
      const u = ease.out(clamp((t - sevT) / 0.4)), fade = 1 - clamp((t - jumpT + 0.15) / 0.3);
      const dI = H1.items[0], sI = H1.items[1], yd = 1.65, ys = 1.83, rx = -44.8;
      g.save(); g.globalAlpha = u * fade; g.setLineDash([12, 10]); g.lineWidth = 4;
      for (const [it, y, col] of [[dI, yd, SKY], [sI, ys, CREAM]]) { const a = B.project(it.st.x, y, it.st.z), b = B.project(rx, y, 0.3); g.strokeStyle = col; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      g.setLineDash([]); const r0 = B.project(rx, 0, 0.3), r1 = B.project(rx, 2.0, 0.3); g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.moveTo(r0.x, r0.y); g.lineTo(r1.x, r1.y); g.stroke();
      const bd = B.project(rx, yd, 0.3), bs = B.project(rx, ys, 0.3); g.strokeStyle = GOLD; g.lineWidth = 10; g.beginPath(); g.moveTo(bd.x + 14, bd.y); g.lineTo(bs.x + 14, bs.y); g.stroke();
      g.restore();
    }
  }, { hud: (g, lt, t) => {
    scoreBug(g, 0, 0, "51'");
    if (t > sevT && t < jumpT) {
      const fade = 1 - clamp((t - jumpT + 0.15) / 0.3);
      plate(g, `MARADONA 5'5"`, W * 0.3, 1530, { color: SKY, size: 38, ...pin(t, sevT, fade) });
      plate(g, `SHILTON 6'0"`, W * 0.72, 1530, { color: CREAM, size: 38, ...pin(t, sevT + 0.1, fade) });
      plate(g, '7 INCHES', W / 2, 1640, { color: GOLD, size: 46, ...pin(t, w('punch', 'inches'), fade) });
    }
  } });
  cue(puS - 0.05, 'whoosh_deep', 0.4); cue(puS, 'heartbeat', 0.4); cue(sevT, 'pen', 0.3); cue(w('punch', 'inches'), 'stamp', 0.3);
  shot(jumpT - 0.08, (g, lt, t) => {
    const tau = tauOf(t), H1 = hgItems(tau, t);
    rig(B, lt, [[0, K(-0.3, -0.16, 5.6, [-46.9, 2.0, 0.4])], [tPunch - jumpT + 0.05, K(-0.42, -0.2, 4.6, [-46.9, 2.2, 0.45])], [len({ a: 0, b: s('ref') - jumpT }), K(-0.06, 0.03, 8.6, [-50.3, 1.4, 0.7]), ease.inOut]], { t });
    stadium(g, t, H1.items, { cheer: tau > HG.net ? 0.6 : 0.2, hitL: { t0: tauToFilm(HG.net), y: 0.6, z: 1.2, k: 0.9 }, blur: 2.5 });
    if (t > tPunch && t < tPunch + 0.5) { const p = B.project(...H1.ball), u = (t - tPunch) / 0.5; g.save(); g.strokeStyle = `rgba(255,255,255,${(1 - u).toFixed(3)})`; g.lineWidth = 10 * (1 - u); g.beginPath(); g.arc(p.x, p.y, 30 + u * 260, 0, 7); g.stroke(); g.restore(); }
  }, { mbStep: 4, hud: (g, lt, t) => scoreBug(g, 0, 0, "51'") });
  cue(jumpT, 'whoosh_fast', 0.4); cue(tPunch - 0.02, 'fist', 1.0); cue(tPunch, 'boom_big', 0.7); cue(tauToFilm(HG.net), 'net', 0.9); cue(tauToFilm(HG.net), 'crowd_gasp', 0.6);

  // ======================= the referee doesn't see it. Goal. =======================
  const rfS = s('ref'), refT = w('ref', 'referee'), gl1T = w('ref', 'goal');
  shot(rfS - 0.05, (g, lt, t) => {
    const tau = tauOf(t), H1 = hgItems(tau, t, { refPoint: clamp((t - gl1T + 0.05) / 0.25) });
    const rp = hgRef.at(tau);
    rig(B, lt, [[0, K(-2.2, 0.0, 4.2, [rp.x, 1.55, rp.z])], [gl1T - rfS, K(-2.05, 0.02, 4.6, [rp.x, 1.55, rp.z])], [gl1T - rfS + 0.25, K(0.88, 0.05, 11.7, [-40.0, 1.4, 8.5]), ease.whip], [len({ a: 0, b: s('quote') - rfS }), K(0.84, 0.06, 12.4, [-40.2, 1.4, 8.6])]], { t });
    stadium(g, t, H1.items, { cheer: t > gl1T ? 1 : 0.3, blur: t < gl1T ? 4 : 1, hitL: { t0: tauToFilm(HG.net), y: 0.6, z: 1.2, k: 0.9 } });
  }, { mbStep: 4, hud: (g, lt, t) => {
    scoreBug(g, t > gl1T ? 1 : 0, 0, "51'");
    nameTitle(g, lt, 'Ali Bin Nasser', 'REFEREE · TUNISIA', { y: 250, t0: refT - rfS, a: 1 - clamp((t - gl1T + 0.1) / 0.2) });
    if (t > gl1T) plate(g, 'GOAL', W / 2, 300, { color: LIME, size: 80, ...pin(t, gl1T) });
  } });
  cue(rfS, 'crowd_protest', 0.5); cue(gl1T, 'whistle', 0.9); cue(gl1T, 'crowd_roar', 0.8); cue(gl1T, 'stamp', 0.4);

  // ======================= the press conference: "a little with the head of Maradona, a little with the hand of God" =========
  const qS = s('quote'), headT = w('quote', 'head'), handQ = w('quote', 'hand'), godT = w('quote', 'god'), qSplit = w('quote', 'and');
  const flashes = Array.from({ length: 14 }, (_, i) => ({ i: i % 6, t: qS + 0.2 + i * 0.31 + (i % 3) * 0.07 }));
  const pressShot = (closer) => (g, lt, t) => {
    rig(B, lt, closer ? [[0, K(-0.06, 0.02, 2.2, [0.1, 1.42, 0.85], { cy: H * 0.46 })], [len({ a: 0, b: s('later') - qSplit }), K(0.06, 0.03, 1.8, [0.08, 1.45, 0.85], { cy: H * 0.46 })]]
      : [[0, K(0.18, 0.08, 3.3, [0, 1.3, 0.7], { cy: H * 0.5 })], [len({ a: 0, b: qSplit - qS }), K(0.06, 0.06, 2.7, [0, 1.33, 0.75], { cy: H * 0.5 })]], { t, e: glide });
    pressRoom(g, t, { lit: closer ? clamp((t - godT + 0.3) / 0.4) : 0 });
    const tap = clamp((t - headT + 0.1) / 0.25) * (1 - clamp((t - headT - 0.7) / 0.3)), raise = clamp((t - handQ + 0.15) / 0.3);
    const e = t > handQ ? { ...EXPR.smug, lid: 0.3, turn: 0.15 } : t > headT ? { ...EXPR.smug, lid: 0.25 } : { ...EXPR.happy, open: 0.25 };
    const hp = bust(g, 'diegoPress', 0, 1.42, 0.85, { e, t, w: 0.36 });
    if (hp) {  // a sleeved arm from the shoulder and a pointing finger: at his temple on "head", up to the sky on "hand of God"
      if (tap > 0) pointArm(g, hp, 1, lerp(hp.x + hp.s * 260, hp.x + hp.s * 112, ease.out(tap)), lerp(hp.y + hp.s * 330, hp.y - hp.s * 40, ease.out(tap)), { up: -0.6 });
      if (raise > 0) {
        const hx = lerp(hp.x - hp.s * 250, hp.x - hp.s * 215, raise), hy = lerp(hp.y + hp.s * 320, hp.y - hp.s * 190, ease.out(raise));
        g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(hx, hy - hp.s * 60, 0, hx, hy - hp.s * 60, hp.s * 260 * raise); gr.addColorStop(0, 'rgba(255,226,140,0.55)'); gr.addColorStop(1, 'rgba(255,226,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
        pointArm(g, hp, -1, hx, hy, { up: 0 });
      }
    }
    pressTable(g, t);
    photographers(g, t, flashes);
  };
  shot(qS - 0.05, pressShot(false), { trans: 'whip', hud: (g, lt, t) => {
    placeStamp(g, lt, 'After the game', 'PRESS', { y: 150, t0: 0.05 });
    if (t > w('quote', 'a')) plate(g, '"A LITTLE WITH THE HEAD', W / 2, 1480, { color: CREAM, size: 40, ...pin(t, w('quote', 'a')) });
    if (t > headT) plate(g, 'OF MARADONA…"', W / 2, 1580, { color: SKY, size: 46, ...pin(t, headT) });
  } });
  shot(qSplit - 0.05, pressShot(true), { hud: (g, lt, t) => {
    plate(g, '"…AND A LITTLE WITH', W / 2, 1480, { color: CREAM, size: 40, ...pin(t, qSplit) });
    if (t > handQ) plate(g, 'THE HAND OF GOD"', W / 2, 1580, { color: GOLD, size: 56, ...pin(t, handQ) });
  } });
  cue(qS - 0.08, 'whoosh_fast', 0.35); cue(qS, 'murmur', 0.35); for (const f of flashes) cue(f.t, 'camera', 0.18);
  cue(headT, 'piece', 0.3); cue(handQ, 'shimmer', 0.5); cue(godT, 'reveal_bell', 0.45);

  // ======================= THE GOAL OF THE CENTURY: one take =======================
  const { tRecv, tB, tR, tBu, tF, tS, tG, tShot } = GC.w, laS = s('later'), runEnd = s('radio');
  const camAt = t => {  // a smooth crane-and-track: high and wide, down to his side, round behind him for the finish
    const st = GC.D.at(Math.min(t, tG)), lead = clamp((t - tRecv) / 1.2);
    const tg = [st.x - 2.2 * lead, 1.0, st.z + 0.6];
    const k1 = ease.inOut(clamp((t - laS) / (tB - laS))), k2 = ease.inOut(clamp((t - tS + 0.6) / 1.4)), k3 = ease.inOut(clamp((t - tG - 0.1) / 0.8));
    const yaw = lerp(lerp(0.15, 0.62, k1), 1.35, k2) - 0.3 * k3, pitch = lerp(lerp(0.6, 0.14, k1), 0.1, k2) + 0.12 * k3, dist = lerp(lerp(42, 9.5, k1), 7.2, k2) + 4 * k3;
    return K(yaw, pitch, dist, tg);
  };
  const runKeys = []; for (let tt = laS - 0.1; tt <= runEnd + 0.6; tt += 1 / 30) runKeys.push([tt - (laS - 0.05), camAt(tt)]);
  GC.camAt = camAt; let runTags = null;
  shot(laS - 0.05, (g, lt, t) => {
    rig(B, lt, runKeys, { t, e: lin, shake: 0.6 });
    const G1 = gcItems(t);
    stadium(g, t, G1.items, { cheer: t > tG ? 1 : 0.35 + 0.4 * clamp((t - tF) / 2), hitL: { t0: tG + 0.06, y: 0.45, z: -1.4, k: 1 }, blur: lerp(0, 2.2, clamp((t - laS) / 2)) });
    runTags = { t, tg: G1.tg };
  }, { kb: 0, mbStep: 3, mbMax: 30, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    // name tags: each defender as he is named, struck through once beaten (on the screen layer: sharp in the blur)
    if (runTags) for (const [pl, key, name, t0, beat] of [[BEARD, 'BE', 'BEARDSLEY', tB, tB + 0.25], [REID, 'RE', 'REID', tR, tR + 0.4], [BUTCH, 'BU', 'BUTCHER', tBu, tBu + 0.3], [FENW, 'FE', 'FENWICK', tF, tF + 0.3], [SHIL, 'SH', 'SHILTON', tS, tShot - 0.2]]) {
      if (t > t0 - 0.05 && t < t0 + 2.4) playerTag(g, name, headOf(pl, runTags.tg[key], 0.55), t, t0, { struck: beat });
    }
    scoreBug(g, 1, 0, "55'");
    if (t > tRecv && t < tG + 1.2) { const yd = Math.round(60 * clamp((GC.D.at(Math.min(t, tShot)).dist - GC.D.at(tRecv).dist) / Math.max(1, GC.D.at(tShot).dist - GC.D.at(tRecv).dist))); counter(g, String(yd), 'YARDS', { y: 300, size: 110, color: CREAM, a: 1 - clamp((t - tG - 0.9) / 0.3) }); }
    if (t > tG + 0.25) plate(g, '60 YARDS · 10 SECONDS', W / 2, 1520, { color: GOLD, size: 46, ...pin(t, tG + 0.25) });
  } });
  cue(laS - 0.08, 'whoosh_deep', 0.35); cue(laS + 0.35, 'kick', 0.45);
  for (const tt of GC.touches) cue(tt, 'touch', 0.55);
  for (const tt of [tB, tR, tBu, tF, tS]) { cue(tt - 0.05, 'whoosh_fast', 0.3); cue(tt, 'sparkle_pop', 0.18); }
  cue(tS, 'riser', 0.35); cue(tShot, 'kick', 0.8); cue(tG, 'net', 1.0); cue(tG, 'crowd_roar', 1.0); cue(tG + 0.1, 'crowd_roar', 0.6); cue(tG, 'boom_cine', 0.6);

  // ======================= the commentator: through the booth window, the camera pulls back =======================
  const raS = s('radio'), cosT = w('radio', 'cosmic'), planT = w('radio', 'planet');
  shot(raS - 0.04, (g, lt, t) => {
    feedStadium(t, { kite: clamp((t - cosT + 0.2) / 1.6) });
    rig(B, lt, [[0, K(0, 0.0, 1.5, [0, 1.75, 0.1])], [0.3, K(0, 0.0, 1.55, [0, 1.75, 0.1])], [1.6, K(1.45, 0.04, 2.6, [-0.4, 1.62, -0.55]), ease.inOut], [len({ a: 0, b: s('champ') - raS }), K(1.38, 0.05, 2.3, [-0.45, 1.62, -0.6])]], { t });
    booth(g, t, lt);
    microphone(g, -0.45, 1.25, -0.45, 1.6);
    const e = t > cosT ? { ...EXPR.triumph, open: 0.95, lid: 0.15, brow: -0.2, shake: 0.4, turn: 0.35 } : { ...EXPR.shock, open: 0.7, turn: 0.35 };
    const hp = bust(g, 'morales', -0.55, 1.62, -1.05, { e, t, w: 0.34 });
  }, { kb: 0, hud: (g, lt, t) => {
    if (lt > 1.2) nameTitle(g, lt, 'Víctor Hugo Morales', 'ON THE RADIO · 1986', { y: 240, t0: 1.25, a: 1 - clamp((t - cosT + 0.05) / 0.2) });
    if (t > cosT) plate(g, '"¡BARRILETE CÓSMICO!"', W / 2, 260, { color: GOLD, size: 54, sub: 'COSMIC KITE', ...pin(t, cosT) });
    if (t > planT) plate(g, '"WHAT PLANET DID YOU COME FROM?"', W / 2, 1520, { color: CREAM, size: 36, ...pin(t, planT) });
  } });
  cue(raS - 0.04, 'radio_static', 0.6); cue(cosT, 'shimmer', 0.4); cue(planT, 'sparkle_pop', 0.25);

  // ======================= champions, a week later =======================
  const chS = s('champ'), weekT = w('champ', 'week'), chT = w('champ', 'champions');
  shot(chS - 0.04, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.5, -0.24, 5.0, [2, 2.75, 0.8], { cy: H * 0.6 })], [len({ a: 0, b: s('twist') - chS }), K(-0.28, -0.25, 4.6, [2, 2.78, 0.8], { cy: H * 0.6 })]], { t, e: glide });
    const items = [];
    const mates = [[ARG('argA', 2), [1.2, 0.6]], [ARG('argB', 19), [2.8, 0.7]], [VALD, [0.1, 2.2]], [ARG('argB', 7), [3.9, 2.0]], [ENRI, [-0.6, 0.4]], [ARG('argA', 5), [4.6, 0.2]]];
    for (const [pl, [x, z]] of mates) items.push(P(pl, { x, z, head: -PI / 2 + (x - 2) * 0.1, pose: blend(POSE.stand(), POSE.armsUp(0.6 + 0.4 * Math.sin(t * 6 + x)), 0.8), e: 'happy', t: t + x }));
    const up = { x: 2, z: 0.65, head: -PI / 2, pose: { ...POSE.trophy(), hip: [[1.25, 0.25], [1.25, 0.25]], knee: [1.3, 1.3], pelvisY: 1.95 + Math.sin(t * 4) * 0.03, ground: false, lean: -0.05, look: 0.3 }, e: { ...EXPR.triumph, lid: 0.2 }, t };
    const DIEGO86 = { ...DIEGO };
    items.push(P(DIEGO86, up));
    stadium(g, t, items, { cheer: 1, blur: 3 });
    const sk = skeleton(DIEGO86, up), a = B.project(...sk.arms[0].hand), b = B.project(...sk.arms[1].hand);
    cup(g, (a.x + b.x) / 2, Math.min(a.y, b.y) - a.s * 0.05, a.s * 0.42);
    confetti(g, t, chS + 0.3, { n: 160, seed: 9 });
  }, { trans: 'whip', grade: 'gold', hud: (g, lt, t) => {
    stampPlate(g, 'Mexico City · 29 June', '1986', 170, t, weekT);
    if (t > chT) plate(g, 'WORLD CHAMPIONS', W / 2, 300, { color: GOLD, size: 70, ...pin(t, chT) });
    if (t > chT + 0.35) plate(g, 'ARGENTINA 3–2 WEST GERMANY', W / 2, 410, { color: SKY, size: 36, ...pin(t, chT + 0.35) });
  } });
  cue(chS - 0.05, 'whoosh_fast', 0.35); cue(chT, 'crowd_roar', 0.8); cue(chT, 'confetti', 0.5); cue(chT, 'applause', 0.5); cue(chS + 0.3, 'camera', 0.2);

  // ======================= the twist: rewind to the man who looped the ball back =======================
  const twS = s('twist'), hodT = w('twist', 'hodge'), backT = w('twist', 'back'), swapT = w('twist', 'swapped');
  const freezeAt = HG.hook + 0.02, rewEnd = hodT + 0.25;
  shot(twS - 0.04, (g, lt, t) => {
    const u = clamp((t - twS) / (rewEnd - twS)), tau = lerp(HG.net + 0.4, freezeAt, ease.out(u));
    const H1 = hgItems(tau, t);
    rig(B, lt, [[0, K(-0.35, 0.3, 16, [-43, 1.8, 2])], [rewEnd - twS + 0.04, K(-0.6, 0.18, 6.8, [-38.9, 1.25, 5.9]), ease.out], [len({ a: 0, b: swapT - twS }), K(-0.66, 0.16, 5.8, [-38.9, 1.3, 5.9])]], { t });
    stadium(g, t, H1.items, { cheer: 0.2, blur: 2 });
    if (t > rewEnd) { const q = B.project(H1.hodge.st.x, 0.02, H1.hodge.st.z), k = ease.back(clamp((t - rewEnd) / 0.3)); g.save(); g.strokeStyle = GOLD; g.lineWidth = 8; g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.85 * k, q.s * 0.32 * k, 0, 0, 7); g.stroke(); g.restore(); }
  }, { trans: 'cut', grade: 'cold', post: (g, lt, t) => vhs(g, t, { label: t < rewEnd ? '◀◀ REW' : '❚❚ PAUSE' }), hud: (g, lt, t) => {
    if (t > rewEnd) nameTitle(g, lt, 'Steve Hodge', 'ENGLAND · No. 18', { y: 260, t0: rewEnd - twS });
  } });
  cue(twS - 0.04, 'record_scratch', 0.5); cue(twS, 'whoosh_deep', 0.4); cue(rewEnd, 'tvoff', 0.25); cue(rewEnd + 0.05, 'sparkle_pop', 0.3);

  // ======================= the swap, in the corridor by the dressing rooms =======================
  const corridor = (g, t) => {
    g.fillStyle = '#1A1C1E'; g.fillRect(0, 0, W, H);
    quad(g, [[-1.6, 0, -3], [1.6, 0, -3], [1.6, 0, 22], [-1.6, 0, 22]], '#6E6C66');
    for (const sx of [-1, 1]) {
      quad(g, [[sx * 1.6, 0, -3], [sx * 1.6, 1.3, -3], [sx * 1.6, 1.3, 22], [sx * 1.6, 0, 22]], sx < 0 ? '#D8D2C2' : '#CEC8B8');
      quad(g, [[sx * 1.6, 1.3, -3], [sx * 1.6, 2.8, -3], [sx * 1.6, 2.8, 22], [sx * 1.6, 1.3, 22]], sx < 0 ? '#A9B4A8' : '#9FAA9E');
      for (let z = -3; z < 22; z += 0.5) { if (depth(sx * 1.6, 0.65, z) < 0.3) continue; const a = B.project(sx * 1.6, 0, z), b = B.project(sx * 1.6, 1.3, z); g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    }
    quad(g, [[-1.6, 2.8, -3], [1.6, 2.8, -3], [1.6, 2.8, 22], [-1.6, 2.8, 22]], '#4A4C4E');
    for (let z = -1; z < 22; z += 3.2) { quad(g, [[-0.5, 2.78, z], [0.5, 2.78, z], [0.5, 2.78, z + 0.3], [-0.5, 2.78, z + 0.3]], '#F4F6F2'); pool(g, B, 0, 0.01, z + 0.15, 1.8, '#F0F6FF', 0.12); }
    quad(g, [[-0.6, 0, 21.9], [0.6, 0, 21.9], [0.6, 2.2, 21.9], [-0.6, 2.2, 21.9]], '#2C4A6E');
    const sg = [[-0.7, 2.3, 21.88], [0.7, 2.3, 21.88], [0.7, 2.62, 21.88], [-0.7, 2.62, 21.88]];
    if (quad(g, sg, '#F2EEE4') && depth(0, 2.46, 21.88) > 1) { const p = B.project(0, 2.46, 21.88); g.fillStyle = NAVY; g.font = sans(Math.max(8, Math.round(p.s * 0.2)), 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VESTIDORES', p.x, p.y); }
  };
  const BARE = (skin) => ({ shirt: skin, shirtD: mix(skin, '#000000', 0.15), trim: skin, num: null, shorts: '#86B0DE', socks: '#86B0DE', band: '#F3F3EF', boots: '#141518' });
  shot(swapT - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.12, 0.03, 3.9, [0.35, 1.3, 1.3])], [len({ a: 0, b: s('shop') - swapT }), K(-0.04, 0.04, 3.1, [0.35, 1.32, 1.35])]], { t, e: glide });
    corridor(g, t);
    const hodgeB = { ...HODGE, kit: { ...BARE('#EBCDB2'), shirtD: '#D8B699' } }, diegoB = { ...DIEGO, kit: { ...BARE('#DDAA82'), shorts: '#15171D', socks: '#22448E', band: '#EDEDE8' }, captain: null };
    const dz = 4.0 + Math.max(0, t - swapT - 0.4) * 1.2, ph = (t - swapT) * 7;
    const items = [P(diegoB, { x: -0.55, z: dz, head: PI / 2, pose: t > swapT + 0.4 ? POSE.run(ph, 0.25) : POSE.stand(), e: 'happy', t }),
      P(hodgeB, { x: 0.45, z: 1.0, head: -PI / 2 + 0.2, pose: POSE.hold(), e: { ...EXPR.happy, open: 0.2, look: [0.2, -0.2] }, t })];
    drawSorted(g, items);
    // the white England shirt over Maradona's shoulder; the blue 10 in Hodge's hands
    const sd = skeleton(diegoB, items[0].st), sp = B.project(...sd.arms[1].sh); if (depth(...sd.arms[1].sh) > 0.5) shirtCloth(g, sp.x, sp.y + sp.s * 0.15, sp.s * 0.45, { kit: KITS.eng86, back: false, rot: 0.5, a: 1 });
    const sh = skeleton(hodgeB, items[1].st), a = B.project(...sh.arms[0].hand), b = B.project(...sh.arms[1].hand);
    shirtCloth(g, (a.x + b.x) / 2, (a.y + b.y) / 2 + Math.abs(b.x - a.x) * 0.48, Math.abs(b.x - a.x) * 1.1, { back: true, num: 10, sway: Math.sin(t * 2) * 4 });
  }, { trans: 'whip', hud: (g, lt, t) => { plate(g, 'SHIRT SWAP', W / 2, 260, { color: GOLD, size: 56, ...pin(t, swapT) }); if (t > w('twist', 'game')) plate(g, 'A FEW METRES FROM THE DRESSING ROOMS', W / 2, 360, { color: CREAM, size: 28, ...pin(t, w('twist', 'game')) }); } });
  cue(swapT - 0.08, 'whoosh_fast', 0.35); cue(swapT, 'studs', 0.5); cue(swapT + 0.4, 'fabric', 0.5);

  // ======================= the shop: Argentina's shirts came off a Mexico City rack =======================
  const shS = s('shop'), boughtT = w('shop', 'bought'), shopT = w('shop', 'shop'), daysT = w('shop', 'days');
  shot(shS - 0.04, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.25, 0.08, 6.2, [0, 1.6, 2])], [len({ a: 0, b: daysT - shS }), K(-0.08, 0.06, 4.6, [0, 1.6, 1.6])]], { t, e: glide });
    market(g, t);
    const hp = bust(g, 'moschella', 0.9, 1.7, 0.55, { e: { ...EXPR.focus, turn: -0.2 }, t, w: 0.33 });
    if (hp) {  // he holds up two blue shirts to compare
      shirtCloth(g, hp.x - hp.s * 230, hp.y + hp.s * 210, hp.s * 230, { back: false, rot: -0.08 + Math.sin(t * 2) * 0.02 });
      shirtCloth(g, hp.x + hp.s * 230, hp.y + hp.s * 210, hp.s * 230, { kit: { ...KITS.arg86, shirt: '#2A4A9E', shirtD: '#1C3474', stripe: null }, back: false, rot: 0.08 - Math.sin(t * 2) * 0.02 });
    }
  }, { trans: 'whip', grade: 'warm', hud: (g, lt, t) => {
    stampPlate(g, 'Mexico City', 'JUNE 1986', 170, t, shS);
    if (t > shopT) plate(g, 'BOUGHT IN A SHOP', W / 2, 300, { color: GOLD, size: 60, ...pin(t, shopT) });
  } });
  shot(daysT - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(0.1, 1.15, 2.1, [0, 0.9, 0])], [len({ a: 0, b: s('price') - daysT }), K(0.0, 1.22, 1.8, [0, 0.9, 0])]], { t, e: glide });
    ironing(g, t, clamp((t - daysT) / 1.2));
  }, { grade: 'warm', hud: (g, lt, t) => { plate(g, 'DAYS BEFORE THE GAME', W / 2, 280, { color: RED, size: 50, ...pin(t, daysT) }); if (t > daysT + 0.6) plate(g, 'SILVER NUMBERS, IRONED ON', W / 2, 1520, { color: CREAM, size: 38, ...pin(t, daysT + 0.6) }); } });
  amb.push({ id: 'market', t0: shS - 0.04, t1: s('price') - 0.05, gain: 0.9, fi: 0.2, fo: 0.25 });
  cue(shS - 0.06, 'whoosh_fast', 0.35); cue(shopT, 'stamp', 0.35); cue(daysT, 'thud', 0.4); cue(daysT + 0.1, 'whoosh_soft', 0.3);

  // ======================= the auction, 2022 =======================
  const prS = s('price'), yr2T = w('price', '2022'), soldT = w('price', 'sold'), mT = w('price', '$9.3'), endP = s('cta');
  shot(prS - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(-0.75, 0.12, 5.2, [0.2, 1.7, 1.0])], [mT - prS, K(-0.25, 0.08, 3.6, [0.6, 1.9, 1.5]), ease.inOut], [mT - prS + 0.25, K(0.3, 0.04, 4.6, [2.2, 2.15, 3.0]), ease.whip], [len({ a: 0, b: endP - prS }), K(0.34, 0.04, 4.3, [2.3, 2.18, 3.1])]], { t });
    const bid = t < mT ? 4000000 + 3800000 * ease.inOut(clamp((t - soldT) / (mT - soldT))) : 9300000;
    gallery(g, t, { bid: t < soldT ? 4000000 : bid, sold: t > mT + 0.9 ? 1 : 0 });
  }, { mbStep: 4, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Auction', '2022', { y: 150, t0: yr2T - prS });
    if (t > mT) counter(g, '$9.3M', 'AT AUCTION', { y: 400, size: 150, color: GOLD, at: [t, mT] });
    if (t > mT + 0.9) stamp(g, 'SOLD', W / 2, 1560, lt, mT + 0.9 - prS, { color: RED, size: 110, sub: 'MAY 2022' });
  } });
  cue(prS - 0.06, 'whoosh_deep', 0.35); cue(prS, 'murmur', 0.3); cue(soldT, 'clock_tick', 0.3); cue(mT, 'cash', 0.6); cue(mT, 'coins', 0.35); cue(mT + 0.9, 'gavel', 0.7); cue(mT + 0.9, 'stamp', 0.5);

  // ======================= CTA: the defenders between you and the goal =======================
  const ctS = s('cta'), defT = w('cta', 'defenders'), pastT = w('cta', 'past');
  shot(ctS - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, K(1.57, 0.06, 3.0, [-6, 1.1, 0])], [len({ a: 0, b: T.duration - ctS }), K(1.57, 0.08, 2.4, [-6.5, 1.15, 0])]], { t, e: glide });
    const line = [[BEARD, -9.5, 0.9], [REID, -13.5, -1.1], [BUTCH, -18.0, 1.3], [FENW, -23.0, -0.9], [SHIL, -50.0, 2.6]];
    const items = line.map(([pl, x, z], i) => P(pl, { x, z, head: 0, pose: i === 4 ? { ...POSE.stand(), crouch: 0.2, knee: [0.6, 0.6], hip: [[0.3, 0.25], [0.3, 0.25]], sh: [[0.4, 0.7], [0.4, 0.7]], lean: 0.25 } : blend(POSE.stand(), { crouch: 0.12, knee: [0.4, 0.4], hip: [[0.2, 0.12], [0.2, 0.12]], lean: 0.18 }, 1), e: 'focus', t: t + i }));
    items.push(BALL([-5.3, BALL_R, 0.1], { spin: 0 }));
    stadium(g, t, items, { cheer: 0.5, blur: 2 });
    line.forEach(([pl, x, z], i) => { const st = items[i].st, p = headOf(pl, st, 0.7), t0 = defT + i * 0.22; if (t > t0 && p.d > 0.8) { const pp = popIn(t, t0); g.save(); g.globalAlpha *= pp.a ?? 1; plate(g, String(i + 1), p.x, p.y, { color: i === 4 ? GOLD : CREAM, size: 54, scale: pp.scale ?? 1 }); g.restore(); } });
  }, { trans: 'whip', hud: (g, lt, t) => {
    plate(g, 'HOW MANY COULD YOU DRIBBLE PAST?', W / 2, 260, { color: SKY, size: 44, ...pin(t, ctS + 0.1) });
    if (t > pastT + 0.4) plate(g, 'COMMENT A NUMBER', W / 2, 1540, { color: CREAM, size: 50, ...pin(t, pastT + 0.4) });
    if (CHANNEL && t > pastT + 0.9) plate(g, 'FOLLOW ' + CHANNEL, W / 2, 1640, { color: CREAM, size: 38, ...pin(t, pastT + 0.9) });
  } });
  cue(ctS - 0.06, 'whoosh_fast', 0.35); for (let i = 0; i < 5; i++) cue(defT + i * 0.22, 'sparkle_pop', 0.22); cue(pastT + 0.4, 'sparkle_pop', 0.3);

  // ---------- the crowd under the stadium scenes, on its own bus ----------
  amb.push({ id: 'crowd_bed', t0: 0, t1: s('quote') - 0.05, gain: 0.85, fi: 0.05, fo: 0.15, keys: [[0, 1], [puS - 0.2, 1], [puS + 0.3, 0.35], [tPunch, 0.35], [tPunch + 0.4, 1], [40, 1]] });
  amb.push({ id: 'crowd_bed', t0: laS - 0.05, t1: raS + 0.2, gain: 0.85, fi: 0.2, fo: 0.2 });
  amb.push({ id: 'crowd_bed', t0: raS, t1: chS, gain: 0.5, fi: 0.2, fo: 0.15 });
  amb.push({ id: 'crowd_bed', t0: chS - 0.04, t1: twS, gain: 1.0, fi: 0.1, fo: 0.2 });
  amb.push({ id: 'crowd_bed', t0: twS, t1: swapT, gain: 0.3, fi: 0.2, fo: 0.2 });
  amb.push({ id: 'crowd_bed', t0: ctS - 0.05, t1: T.duration, gain: 0.5, fi: 0.3, fo: 1.0 });

  const music = [
    { t: 0, m: 'stands' }, { t: plS - 0.05, m: 'glory' }, { t: wcT - 0.05, m: 'stands' }, { t: fourY - 0.05, m: 'coldwar' }, { t: lpS - 0.05, m: 'tension' },
    { t: puS - 0.05, m: 'drop' }, { t: tPunch, m: 'slam' }, { t: rfS - 0.05, m: 'intrigue' }, { t: gl1T, m: 'hit' }, { t: qS - 0.05, m: 'intrigue' }, { t: handQ, m: 'glory' },
    { t: laS - 0.05, m: 'build' }, { t: tB - 0.05, m: 'stands_hot' }, { t: tG, m: 'slam' }, { t: raS - 0.04, m: 'victory' }, { t: chS - 0.04, m: 'fiesta' },
    { t: twS - 0.04, m: 'void' }, { t: swapT - 0.05, m: 'intrigue' }, { t: prS - 0.05, m: 'auction' }, { t: mT, m: 'victory' }, { t: ctS - 0.05, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: tPunch - 0.3, t1: tPunch - 0.01, kind: 'mute' }, { t0: tPunch, t1: tPunch + 1.0, kind: 'boost', db: 3 },
    { t0: gl1T - 0.25, t1: gl1T - 0.01, kind: 'mute' }, { t0: tG - 0.3, t1: tG - 0.01, kind: 'mute' }, { t0: tG, t1: tG + 1.2, kind: 'boost', db: 3 },
    { t0: twS, t1: swapT - 0.05, kind: 'lp', f: 900 }, { t0: mT - 0.25, t1: mT - 0.01, kind: 'mute' }, { t0: ctS, t1: T.duration, kind: 'lp', f: 1200 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff: T.duration - 0.55 };
}
// story time -> film time (inverse of the warp), for cues and the net that bulges in film time
function tauToFilm(tau) { let lo = 0, hi = 40; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (hgTau(m) < tau) lo = m; else hi = m; } return (lo + hi) / 2; }
