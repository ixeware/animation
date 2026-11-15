// "It's a disgrace". Chelsea 1–1 FC Barcelona, Champions League semi-final, second leg, Stamford Bridge, 6 May 2009.
// Essien's volley after 9 minutes. Four penalty appeals turned down by the referee, Tom Henning Øvrebø: Malouda under
// Alves on the edge of the box (a free kick, outside), Drogba pulled back by Abidal, the ball on Piqué's hand, Ballack's
// shot on Eto'o's arm. Abidal sent off (66'). Iniesta's equaliser in the 93rd minute, Barcelona's first shot on target:
// through on away goals. At the final whistle Drogba, already substituted, marches back on in flip-flops and shouts
// into a live television camera. A three-match ban; the referee changed hotels that night; nine years later: "It was
// not my best day." Facts and what is drawn: SOURCES.md.
// Staged after television footage of the match: the kits, the ends, where each incident happened.
// Palette: Stamford Bridge in blue, the evening going dark between the halves; Chelsea in blue, Barcelona in yellow with
// dark blue shorts, the referee in dark grey.
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, stamp, enter, sans } from '../../engine/js/hud.js';
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
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', CBLUE = '#1C48B0', BYEL = '#F2D21E', BNAVY = '#1A2748', LIME = '#9CCB4A', RED = '#D8453A', BLACK = '#15161A';
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
// grades: the evening of the first half, the floodlit night, the picture of a television camera, a room
const DUSK_G = { con: 1.05, sat: 1.05, bri: 1.03, tone: ['#FFD9B0', 0.1], lift: ['#1A2444', 0.08], bloom: 0.22 };
const NIGHT_G = { con: 1.07, sat: 1.04, bri: 1.02, tone: ['#DCE8FF', 0.06], lift: ['#0E1630', 0.12], bloom: 0.3 };
const TV_G = { con: 1.12, sat: 1.1, bri: 1.03, tone: ['#E6EEFF', 0.06], lift: ['#0A1024', 0.1], bloom: 0.34 };
const ROOM_G = { con: 1.05, sat: 0.92, bri: 1.0, tone: ['#FFD9A0', 0.08], lift: ['#0C1220', 0.1], bloom: 0.24 };

// ---------- kits as worn that night (drawn, not the exact designs) and the cast: cartoons, not likenesses
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const SKIN_D = { base: '#8A5A3A', shade: '#74482C', deep: '#56331E', blush: '#7C4832', hi: '#A8744E' };
const CBLUE_S = '#1A42A2';  // the shorts: a shade deeper than the shirt, so that the two do not run together now that nothing is shaded
const CHE = { shirt: CBLUE, shirtD: '#12327E', trim: '#F4F4F2', num: '#F4F4F2', numEdge: '#12327E', shorts: CBLUE_S, socks: '#F4F4F2', band: CBLUE, boots: '#1A1B1F', badge: '#F4F4F2' };
const BAR = { shirt: BYEL, shirtD: '#CFA90F', trim: BNAVY, center: ['#1E3C96', '#B8202C'], num: BNAVY, numEdge: BYEL, shorts: BNAVY, socks: BYEL, band: BNAVY, boots: '#1A1B1F', badge: '#B8202C' };
const CECH_K = { shirt: '#F26A2A', shirtD: '#C84E18', trim: BLACK, num: BLACK, numEdge: '#F26A2A', shorts: BLACK, socks: '#F26A2A', band: BLACK, boots: '#1A1B1F', long: true, gloves: '#F2F2EE', badge: BLACK };
const VALDES_K = { shirt: '#1D1F24', shirtD: '#121317', trim: '#3BA63A', num: '#DDE6F2', numEdge: '#121317', shorts: '#1D1F24', socks: '#1D1F24', band: '#3BA63A', boots: '#F2F2EE', long: true, gloves: '#C8E23A', badge: '#3BA63A' };
const REF_K = { shirt: '#3D4048', shirtD: '#2A2C32', trim: '#C8202C', piping: '#C8202C', num: null, shorts: BLACK, socks: BLACK, band: '#C8202C', boots: BLACK, badge: '#E8E6E0' };
const SUIT_K = { shirt: '#22252D', shirtD: '#16181E', trim: '#E9E9E4', num: null, shorts: '#1D2027', socks: '#1D2027', boots: '#111214', long: true, trousers: true, band: null };
const STEWARD_K = { shirt: '#F26A1E', shirtD: '#C24E10', trim: '#E8E23A', chest: '#D8DCE2', num: null, shorts: BLACK, socks: BLACK, boots: BLACK, long: true, trousers: true, band: null };
const POLICE_K = { shirt: '#D4E03A', shirtD: '#A8B420', trim: '#1B2436', chest: '#C8CDD4', num: null, shorts: '#15161A', socks: '#15161A', boots: BLACK, long: true, trousers: true, band: null };
const CREW_K = { shirt: '#23262C', shirtD: '#17191D', trim: '#8A8F98', num: null, shorts: '#1B1D22', socks: '#1B1D22', boots: BLACK, long: true, trousers: true, band: null };
const SUB_B = { shirt: '#F2643A', shirtD: '#C8481E', trim: BNAVY, num: null, shorts: BNAVY, socks: BYEL, band: BNAVY, boots: '#1A1B1F', badge: BNAVY };  // Barcelona's substitutes in orange bibs
const SUB_C = { shirt: '#E8D83A', shirtD: '#BEB01E', trim: BLACK, num: null, shorts: CBLUE_S, socks: '#F4F4F2', band: CBLUE, boots: '#1A1B1F', badge: BLACK };  // Chelsea's in yellow ones
const CIVIL_K = { shirt: '#3A4252', shirtD: '#2A303C', trim: '#C9CDD4', num: null, shorts: '#23262E', socks: '#23262E', boots: '#111214', long: true, trousers: true, band: null };  // a jacket, years later
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: CBLUE, suitD: '#12327E', shirt: 'tee', ears: 1.0, ...o });
// Drogba's hair: braids combed straight back, falling behind his neck
const braidsFx = (g, layer, { fw, fh = 1 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = '#120D0A';
  if (layer === 'back') { g.beginPath(); g.ellipse(0, -34, 106 * fw, 108, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-58 * fw, 60); g.bezierCurveTo(-70 * fw, 120, -40, 170, -22, 182); g.lineTo(22, 182); g.bezierCurveTo(40, 170, 70 * fw, 120, 58 * fw, 60); g.closePath(); g.fill(); return; }
  const p = new Path2D(); p.moveTo(-w - 3, -16); p.bezierCurveTo(-w - 9, -h * 0.95, -40, -h - 16, 0, -h - 14); p.bezierCurveTo(40, -h - 16, w + 9, -h * 0.95, w + 3, -16);
  p.bezierCurveTo(w - 4, -62, 50, -96, 0, -98); p.bezierCurveTo(-50, -96, -w + 4, -62, -w - 3, -16); g.fill(p);
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 22, -96 + Math.abs(i) * 5); g.quadraticCurveTo(i * 27, -h * 0.9, i * 24, -h - 6 + Math.abs(i) * 6); g.stroke(); }
  g.strokeStyle = '#E9ECF2'; g.lineWidth = 7; g.beginPath(); g.moveTo(-w + 2, -52); g.bezierCurveTo(-52, -100, 52, -100, w - 2, -52); g.stroke(); };  // the band
const braidsBack = (g, { fw, fh }) => { g.fillStyle = '#120D0A'; g.beginPath(); g.ellipse(0, -14, 104 * fw, 114 * fh, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-74 * fw, 40); g.bezierCurveTo(-84 * fw, 120, -52, 196, -30, 212); g.lineTo(30, 212); g.bezierCurveTo(52, 196, 84 * fw, 120, 74 * fw, 40); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 24, -112); g.quadraticCurveTo(i * 30, 20, i * 14, 202); g.stroke(); } };
// Čech's padded head guard
const guardFx = (g, layer, { fw, fh = 1 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = '#17181C';
  if (layer === 'back') { g.beginPath(); g.ellipse(0, -30, 108 * fw, 110, 0, 0, 7); g.fill(); return; }
  const p = new Path2D(); p.moveTo(-w - 8, 24); p.bezierCurveTo(-w - 14, -h * 0.95, -40, -h - 20, 0, -h - 18); p.bezierCurveTo(40, -h - 20, w + 14, -h * 0.95, w + 8, 24);
  p.lineTo(w - 12, 24); p.bezierCurveTo(w - 10, -40, 60, -72, 0, -72); p.bezierCurveTo(-60, -72, -w + 10, -40, -w + 12, 24); p.closePath(); g.fill(p);
  g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 4; g.lineCap = 'round'; for (const y of [-h * 0.74, -h * 0.52]) { g.beginPath(); g.moveTo(-w * 0.8, y + 26); g.quadraticCurveTo(0, y, w * 0.8, y + 26); g.stroke(); } };
const guardBack = (g, { fw, fh }) => { g.fillStyle = '#17181C'; g.beginPath(); g.ellipse(0, -8, 106 * fw, 118 * fh, 0, 0, 7); g.fill(); };
CAST.drogba = head('buzz', [0.97, 1.07, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', hairFx: braidsFx, backFx: braidsBack });
CAST.essien = head('curly', [0.98, 1.04, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.lampard = head('swept', [0.97, 1.05, 0.9], '#3A2A1E', { brow: '#2A1E16' });
CAST.terry = head('buzz', [0.98, 1.05, 0.92], '#4A3828', { brow: '#3A2A1E' });
CAST.ballack = head('messy', [0.96, 1.07, 0.9], '#1E1612', { brow: '#17110D' });
CAST.malouda = head('buzz', [0.96, 1.05, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.anelka = head('bald', [0.96, 1.06, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.cole = head('buzz', [0.96, 1.04, 0.9], '#15100C', { skin: SKIN_M, brow: '#100C0A' });
CAST.alex = head('bald', [0.99, 1.06, 0.93], '#3A2A1E', { brow: '#3A2A1E', skin: SKIN_T });
CAST.cech = head('buzz', [0.96, 1.08, 0.9], '#17181C', { brow: '#3A2A1E', hairFx: guardFx, backFx: guardBack });
CAST.hiddink = head('swept', [1.0, 1.03, 0.95], '#B8B4AC', { brow: '#8E8A82', age: 0.35, suit: '#22252D', suitD: '#16181E', shirt: 'tie', tie: '#2C4A9A' });
CAST.valdes = head('buzz', [0.97, 1.05, 0.9], '#1E1612', { brow: '#17110D', skin: SKIN_T });
CAST.alves = head('buzz', [0.95, 1.04, 0.89], '#17110D', { skin: SKIN_M, brow: '#100C0A' });
CAST.pique = head('swept', [0.96, 1.08, 0.88], '#4A3524', { brow: '#3A2A1C' });
CAST.toure = head('buzz', [0.98, 1.07, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.abidal = head('bald', [0.96, 1.07, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.busquets = head('swept', [0.94, 1.09, 0.87], '#1E1612', { brow: '#17110D', skin: SKIN_T });
CAST.xavi = head('buzz', [0.97, 1.03, 0.92], '#1A1410', { brow: '#15100C', skin: SKIN_T });
CAST.keita = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.messi = head('messy', [0.95, 1.03, 0.9], '#3A2618', { brow: '#2A1C12' });
CAST.etoo = head('buzz', [0.97, 1.04, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.iniesta = head('slick', [0.96, 1.05, 0.9], '#2A1E16', { brow: '#221811', hairline: -99 });
CAST.pep09 = head('buzz', [0.96, 1.06, 0.89], '#231C17', { brow: '#1C1612', skin: SKIN_T, suit: '#22252D', suitD: '#16181E', shirt: 'tie', tie: '#2A2D36' });
CAST.ovrebo = head('bald', [1.0, 1.07, 0.95], '#8A8780', { brow: '#8E7A60', ears: 1.04, age: 0.2, iris: '#6F8FA8' });
CAST.ovrebo18 = head('bald', [1.0, 1.07, 0.95], '#8A8780', { brow: '#A89A88', ears: 1.04, age: 0.5, iris: '#6F8FA8', suit: '#3A4252', suitD: '#2A303C', shirt: 'open' });
CAST.man1 = head('receding', [0.98, 1.04, 0.93], '#5A4A3C', { brow: '#4A3C30', age: 0.25 });
CAST.man2 = head('buzz', [0.97, 1.05, 0.91], '#2A1E16', { skin: SKIN_M });
CAST.man3 = head('swept', [0.96, 1.05, 0.9], '#6A5240', { brow: '#4E3C2E' });
CAST.man4 = head('buzz', [0.98, 1.04, 0.93], '#15100C', { skin: SKIN_D, brow: '#100C0A' });
CAST.cop1 = head('cap', [0.98, 1.05, 0.92], '#3A2A1E', { brow: '#2A1E16', cap: '#14161C' });
CAST.cop2 = head('cap', [0.96, 1.06, 0.9], '#1E1612', { brow: '#17110D', cap: '#14161C', skin: SKIN_T });
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const DROGBA = mk('drogba', CHE, 11, 1.89, { build: 1.05 }), ESSIEN = mk('essien', CHE, 5, 1.78, { build: 1.06 }), LAMPARD = mk('lampard', CHE, 8, 1.84), TERRY = mk('terry', CHE, 26, 1.87, { captain: '#E8E23A' });
const BALLACK = mk('ballack', CHE, 13, 1.89), MALOUDA = mk('malouda', CHE, 15, 1.81), ANELKA = mk('anelka', CHE, 39, 1.85), COLE = mk('cole', CHE, 3, 1.76), ALEX = mk('alex', CHE, 33, 1.88), BOSINGWA = mk('malouda', CHE, 17, 1.83);
const CECH = mk('cech', CECH_K, 1, 1.96), VALDES = mk('valdes', VALDES_K, 1, 1.83);
const ALVES = mk('alves', BAR, 20, 1.72), PIQUE = mk('pique', BAR, 3, 1.94), TOURE = mk('toure', BAR, 24, 1.88, { build: 1.05 }), ABIDAL = mk('abidal', BAR, 22, 1.86), BUSQUETS = mk('busquets', BAR, 28, 1.89);
const XAVI = mk('xavi', BAR, 6, 1.7, { captain: '#C8202C' }), KEITA = mk('keita', BAR, 15, 1.83), MESSI = mk('messi', BAR, 10, 1.69), ETOO = mk('etoo', BAR, 9, 1.8), INIESTA = mk('iniesta', BAR, 8, 1.7);
const REF = mk('ovrebo', REF_K, null, 1.93, { build: 1.08 });
const PEP = mk('pep09', SUIT_K, null, 1.8), HIDDINK = mk('hiddink', { ...SUIT_K, shirt: '#262A36', shirtD: '#1A1D26' }, null, 1.8);
const STEWARDS = [mk('man1', STEWARD_K, null, 1.84, { build: 1.08 }), mk('man2', STEWARD_K, null, 1.8, { build: 1.05 }), mk('man4', STEWARD_K, null, 1.88, { build: 1.1 })];
const POLICE = [mk('cop1', POLICE_K, null, 1.86, { build: 1.06 }), mk('cop2', POLICE_K, null, 1.83, { build: 1.06 })];
const CREW = mk('man3', CREW_K, null, 1.8);
const SUBS_B = [mk('man2', SUB_B, null, 1.78), mk('man3', SUB_B, null, 1.82), mk('man4', SUB_B, null, 1.8)], SUBS_C = [mk('man3', SUB_C, null, 1.8), mk('man4', SUB_C, null, 1.84), mk('man2', SUB_C, null, 1.78)];
const STAFF_B = [mk('man1', { ...SUIT_K, shirt: '#2A2E3A' }, null, 1.8), mk('man2', SUB_B, null, 1.78)], STAFF_C = [mk('man1', { ...CREW_K, trim: '#E8D83A' }, null, 1.82), mk('man2', { ...CREW_K, trim: '#E8D83A' }, null, 1.78)];
const DROGBA_END = mk('drogba', { ...CHE, socks: SKIN_D.base, band: null, flipflops: BLACK }, 11, 1.89, { build: 1.05 });  // boots and shin pads off: bare legs, flip-flops
const REF_18 = mk('ovrebo18', CIVIL_K, null, 1.93, { build: 1.08 });

// ---------- the ground: Stamford Bridge, a full house in blue
const FLAGS = [
  g => { g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#C8202C'; g.fillRect(0.42, 0, 0.16, 1); g.fillRect(0, 0.38, 1, 0.24); },  // St George's crosses
  g => { g.fillStyle = CBLUE; g.fillRect(0, 0, 1, 1); g.fillStyle = '#F4F4F2'; g.fillRect(0, 0.4, 1, 0.2); },
  g => { g.fillStyle = '#F4F4F2'; g.fillRect(0, 0, 1, 1); g.fillStyle = CBLUE; g.fillRect(0, 0, 0.5, 1); },
];
const BLUE_CROWD = [[CBLUE, 40], ['#E8E5DE', 15], ['#12327E', 14], ['#3A66C8', 9], ['#2A2A30', 9], ['#D8D4CC', 6], ['#0E2458', 7]];
const ARENA = new Stadium({ seed: 31, density: 1, flags: 4, flagSet: FLAGS, haze: '#27304C', cloth: BLUE_CROWD });
const BOARDS = [boardDesign('LONDON', { bg: CBLUE, ink: '#FFFFFF' }), boardDesign('6 MAY 2009'), boardDesign('SEMI-FINAL', { bg: '#1D2A44', ink: '#F4F2EC' }), boardDesign('CHELSEA v BARCELONA')];
const SKY_DUSK = { zen: '#243C6A', mid: '#5A78A6', hor: '#E0A680', clouds: 0.3, cloud: '#B0888A', seed: 5 };
const SKY_NIGHT = { zen: '#060A18', mid: '#0E1730', hor: '#262F4C', clouds: 0.15, cloud: '#2C3652', seed: 3 };
const TURF = { colors: ['#3F8E3C', '#4A9C45'], wear: 0, haze: '#5A6E78' };
const BG = makeCanvas(), bgx = BG.getContext('2d');
// a figure in shade: painted on a layer of its own and darkened there (k 0..1), then laid into the picture. For a man who
// walks out of the floodlights into the tunnel: the darkness takes him gradually, with no step
const FG = makeCanvas(), fgx = FG.getContext('2d');
FG.dataset.qa = '1';  // the figures painted on it count in the layout check, like those of the film layer
const shaded = (it, k) => (k < 0.02 ? it : { get d() { return it.d; }, shadow: it.shadow, pl: it.pl, st: it.st, sk: it.sk, draw: g => {
  fgx.setTransform(1, 0, 0, 1, 0, 0); fgx.globalCompositeOperation = 'source-over'; fgx.clearRect(0, 0, W, H); it.draw(fgx);
  fgx.globalCompositeOperation = 'source-atop'; fgx.fillStyle = `rgba(7,9,16,${k.toFixed(3)})`; fgx.fillRect(0, 0, W, H); fgx.globalCompositeOperation = 'source-over';
  g.drawImage(FG, 0, 0); } });
// night: the second half and after (the first half was played in the last of the daylight). hitSide: which goal's net moves
function stadium(g, t, items = [], { cheer = 0, blur = 0, hit = null, hitSide = 1, boards = BOARDS, night = true } = {}) {
  const back = c => { sky(c, B, { t, ...(night ? SKY_NIGHT : SKY_DUSK) }); ARENA.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...TURF });
  for (const it of items) it.shadow?.(g);
  drawSorted(g, [...goalItems(B, -1, { t, hit: hitSide < 0 ? hit : null }), ...goalItems(B, 1, { t, hit: hitSide > 0 ? hit : null }), ...(boards.length ? boardItems(B, boards) : []), ...flagItems(B, t), ...items]);
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

// ---------- poses of this film
// a goalkeeper set for a shot, his dive along the line, and how he comes down. side: +1 to his own left, -1 to his right
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
const SHOUT = (t, k = 1) => ({ ...EXPR.angry, brow: 1, browY: 5, mouth: 'shout', curve: -0.5, open: 0.3 + 0.65 * k * Math.abs(Math.sin(t * 9.5)), lid: 0.12, pupil: 0.72, noBlink: true });  // furious: a roar, the teeth bared, the eyes never shut
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };
const SEATED = { hip: [[1.5, 0.12], [1.5, 0.12]], knee: [1.55, 1.55], sh: [[0.62, 0.08], [0.62, 0.08]], el: [0.75, 0.75], lean: 0.2, pelvisY: 0.5, ground: false };
const DOWN = { hip: [[1.45, 0.2], [1.3, 0.14]], knee: [0.9, 0.5], sh: [[-0.6, 0.4], [-0.45, 0.35]], el: [0.15, 0.2], lean: -0.42, pelvisY: 0.17, ground: false, look: 0.5 };  // sat on the grass, leaning back on his hands
const APPEAL = (t = 0) => ({ sh: [[1.5 + 0.1 * Math.sin(t * 7), 0.75], [1.5 + 0.1 * Math.sin(t * 7 + 1), 0.75]], el: [0.5, 0.5], fingers: true, lean: -0.04 });  // both arms out, the palms open: "referee!"
// the referee's "nothing, play on": both arms out in front at chest height, the hands crossing and sweeping apart
const PLAY_ON = (t = 0) => { const a = 0.38 + 0.62 * Math.sin(t * 8.5); return { sh: [[1.3, a], [1.3, a]], el: [0.14, 0.14], fingers: true, lean: 0.05 }; };
const CARD_UP = { sh: [[0.1, 0.12], [2.95, 0.12]], el: [0.3, 0.1], lean: -0.02 };  // the right arm straight up, a card in the hand
const POINT_AT = (side = 1) => ({ sh: [[0.1, 0.12], [1.35, side * 0.5]], el: [0.3, 0.08], point: [false, true], lean: 0.03 });  // the right arm out, pointing at the place

const SIT_APPEAL = (t = 0) => ({ ...DOWN, sh: [[1.25 + 0.08 * Math.sin(t * 6), 0.85], [1.25 + 0.08 * Math.sin(t * 6 + 1), 0.85]], el: [0.45, 0.45], lean: -0.12, fingers: true });  // sat on the grass, both arms out to the referee
const INNOCENT = { sh: [[1.75, 0.55], [1.75, 0.55]], el: [1.2, 1.2], fingers: true, lean: -0.03 };  // both hands up, the palms out: "I never touched him"
const WHISTLE = { sh: [[0.1, 0.12], [1.9, 0.0]], el: [0.3, 1.95], fore: [0.12, -0.83], lean: 0.02 };  // the right hand at his mouth: the elbow up in front, the forearm folded back in to the face
const DESPAIR = { ...POSE.handsOnHead(), lean: -0.05 };
// caught from behind: down forward, flat on his front, the arms out to break the fall, the heels kicking up; then up on his
// knees, both arms out to the referee
const FALL_FWD = { hip: [[-1.5, 0.1], [-1.42, 0.16]], knee: [0.5, 1.0], toes: [1.0, 1.0], sh: [[2.6, 0.45], [2.75, 0.35]], el: [0.5, 0.35], lean: 1.5, pelvisY: 0.13, ground: false, look: 1.0, fingers: true };
// the same man once he is down. LYING: the legs of a body flat on its front, the feet pointed (pose.toes: at a right angle to
// the shin the toes go 18 cm under the grass, and a pose set down on its lowest point then floats on them). SLIDE_FLAT: sliding
// on his front, the arms out ahead on the grass. APPEAL_ELBOW: up on one elbow, the forearm flat on the grass, the other arm
// thrown up at the referee. SUNK_FLAT: face down, the hands on the grass by his head
const LYING = { hip: [[-1.5, 0.12], [-1.38, 0.2]], knee: [0.1, 0.3], toes: [1.6, 1.6], pelvisY: 0.13, ground: false, fingers: true };
const SLIDE_FLAT = { ...LYING, sh: [[2.75, 0.55], [2.85, 0.45]], el: [0.15, 0.25], lean: 1.5, look: 0.9 };
const APPEAL_ELBOW = (t = 0) => ({ ...LYING, sh: [[3.25 + 0.08 * Math.sin(t * 6.5), 0.45], [1.13, 0.2]], el: [0.35, 1.57], lean: 1.13, look: 0.8 });
const SUNK_FLAT = { ...LYING, sh: [[2.5, 0.8], [2.55, 0.75]], el: [0.57, 0.52], fore: [-0.6, -0.6], lean: 1.5, look: 0.35 };
// the shadow of a body lying along its heading h (k: how far down it is): long, and under the body, not beside it
const lyingShadow = (h, k) => ({ dx: (0.1 * Math.cos(h) - 0.05) * k, dz: (0.1 * Math.sin(h) - 0.12) * k, r: lerp(0.36, 1.0, k), rz: lerp(0.24, 0.36, k) });
// sat on the grass: one leg out, one knee up, both hands flat on the ground beside him, the head down
const SIT_GROUND = { hip: [[1.62, 0.16], [1.9, 0.2]], knee: [0.1, 0.9], sh: [[-0.3, 0.32], [-0.3, 0.32]], el: [0.05, 0.05], lean: -0.22, pelvisY: 0.13, ground: false, look: -0.5, fingers: true };
// on his knees, the shins and the feet flat on the grass behind him, both arms out to the referee
const KNEEL_APPEAL = (t = 0) => ({ hip: [[0.06, 0.14], [0.06, 0.14]], knee: [1.63, 1.63], toes: [1.5, 1.5], sh: [[1.3 + 0.1 * Math.sin(t * 6.5), 0.9], [1.3 + 0.1 * Math.sin(t * 6.5 + 1), 0.9]], el: [0.4, 0.4], lean: -0.06, pelvisY: 0.47, ground: false, fingers: true });
// a whistle at the referee's mouth (with WHISTLE: the hand that holds it)
const whistleProp = () => ({ at: 'front', depth: (sk, dp) => dp(sk.arms[1].hand) - 0.06, draw: (g, sk, pr) => { const k = sk.k, q = pr(v3.add(v3.add(sk.headC, v3.mul(sk.spine, -0.1 * k)), v3.mul(sk.ft, 0.1 * k))), u = q.s * k;
  g.save(); g.translate(q.x, q.y); g.fillStyle = '#101114'; g.beginPath(); g.roundRect(-0.05 * u, -0.02 * u, 0.1 * u, 0.045 * u, 0.012 * u); g.fill();
  g.fillStyle = '#C9CED6'; g.beginPath(); g.arc(0.022 * u, 0.012 * u, 0.026 * u, 0, 2 * PI); g.fill(); g.restore(); } });
// a card in the referee's raised right hand
const cardProp = col => ({ at: 'hands', depth: (sk, dp) => dp(sk.arms[1].hand) - 0.03, draw: (g, sk, pr) => { const h = sk.arms[1].hand, q = pr([h[0], h[1] + 0.085 * sk.k, h[2]]), u = q.s * sk.k;
  g.save(); g.translate(q.x, q.y); g.rotate(-0.1); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-0.05 * u + 0.008 * u, -0.08 * u + 0.012 * u, 0.1 * u, 0.15 * u); g.fillStyle = col; g.fillRect(-0.05 * u, -0.08 * u, 0.1 * u, 0.15 * u);
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(-0.05 * u, -0.08 * u, 0.03 * u, 0.15 * u); g.restore(); } });
// a ring drawn round a point in the world (a hand on a shirt, a ball on an arm)
function ringAt(g, pos, r, col, a = 1) {
  const q = B.project(pos[0], pos[1], pos[2]); if (q.z < 0.3 || a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(12,9,6,0.6)'; g.lineWidth = Math.max(6, 0.03 * q.s); g.beginPath(); g.arc(q.x, q.y, r * q.s, 0, 2 * PI); g.stroke();
  g.strokeStyle = col; g.lineWidth = Math.max(4, 0.018 * q.s); g.beginPath(); g.arc(q.x, q.y, r * q.s, 0, 2 * PI); g.stroke(); g.restore();
}
// a flat label lying in the picture at a point of the pitch
function groundTag(g, text, pos, { color = CREAM, ink = C.ink, size = 34, a = 1 } = {}) {
  const q = B.project(pos[0], pos[1], pos[2]); if (q.z < 0.3 || a <= 0) return;
  plate(g, text, q.x, q.y, { color, ink, size, a, rot: 0, qa: false });
}

// ---------- on-screen pieces
function scoreBug(g, a, b, m, { x = 40, y = 76, al = 1, hotL = 0, hotR = 0 } = {}) {  // flat (rule 50); hot: the side that has just scored swells
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54, my = y + hh / 2 + 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = CBLUE; g.fillRect(x, y, 14, hh); g.fillStyle = BYEL; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('CHE', x + 26, my); g.fillText('BAR', x + w - 104, my);
  g.textAlign = 'center';
  const num = (v, cx, hot, col) => { g.save(); g.translate(cx, my); g.scale(1 + 0.5 * hot, 1 + 0.5 * hot); g.fillStyle = mix(C.ink, col, hot); g.fillText(String(v), 0, 0); g.restore(); };
  num(a, x + w / 2 - 32, hotL, CBLUE); g.fillStyle = C.ink; g.fillText('–', x + w / 2 - 2, my); num(b, x + w / 2 + 28, hotR, '#B8860B');
  g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 74, my);
  qaRect(g, x, y, w + 140, hh, 'text', 'score bug');
  g.restore();
}
// four marks under the score, one struck out for each penalty appeal turned down
function appeals(g, n, { x = 40, y = 150, pulse = 0, al = 1 } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(24, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 4; i++) {
    const cx = x + 24 + i * 56, cy = y + 24, on = i < n, k = on && i === n - 1 ? 1 + 0.45 * pulse : 1;
    g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.arc(cx, cy + 4, 22 * k, 0, 2 * PI); g.fill();
    g.fillStyle = on ? RED : '#1B1F27'; g.beginPath(); g.arc(cx, cy, 22 * k, 0, 2 * PI); g.fill();
    if (on) { g.strokeStyle = '#FFF4E8'; g.lineWidth = 5 * k; g.lineCap = 'round'; const r = 9 * k; g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r); g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r); g.stroke(); }
    else { g.strokeStyle = 'rgba(244,238,224,0.4)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, 20.5, 0, 2 * PI); g.stroke(); g.fillStyle = 'rgba(244,238,224,0.6)'; g.fillText(String(i + 1), cx, cy + 2); }
  }
  g.font = sans(20, 800); g.letterSpacing = '3px'; g.textAlign = 'left'; g.fillStyle = 'rgba(12,9,6,0.55)'; g.fillText('PENALTY APPEALS', x + 232, y + 28); g.fillStyle = CREAM; g.fillText('PENALTY APPEALS', x + 230, y + 26);
  qaRect(g, x, y, 470, 52, 'text', 'appeal marks');
  g.restore();
}
function title2(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FF4B3A', s1 = 104, s2 = 168, a = 1, k = 1 } = {}) {  // the cover: a small line over a heavy one
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, 0, 0); g.fillStyle = c1; g.fillText(l1, 0, 0);
  g.font = sans(s2, 900); g.strokeText(l2, 0, s2 * 0.98); g.fillStyle = c2; g.fillText(l2, 0, s2 * 0.98);
  g.restore();
  qaRect(g, 40, y - s1 * 0.8, W - 80, s1 * 0.8 + s2 * 1.05, 'text', 'cover title');
}
// what a television camera adds to its own picture: a LIVE mark and the corners of the frame
function liveMark(g, t, { a = 1, x = 40, y = 76 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, 168, 54); g.fillStyle = '#C8202C'; g.fillRect(x, y, 168, 54);
  g.fillStyle = `rgba(255,255,255,${(0.55 + 0.45 * (Math.sin(t * 6) > 0 ? 1 : 0.3)).toFixed(2)})`; g.beginPath(); g.arc(x + 30, y + 28, 10, 0, 2 * PI); g.fill();
  g.font = sans(30, 900); g.letterSpacing = '4px'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#FFFFFF'; g.fillText('LIVE', x + 54, y + 29);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.lineCap = 'square';
  for (const [cx, cy, sx, sy] of [[34, 170, 1, 1], [W - 34, 170, -1, 1], [34, H - 60, 1, -1], [W - 34, H - 60, -1, -1]]) { g.beginPath(); g.moveTo(cx + sx * 60, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * 60); g.stroke(); }
  qaRect(g, x, y, 168, 54, 'text', 'live mark');
  g.restore();
}
// the tape running backwards: torn lines across the picture and a clock that counts down
function rewindFx(g, t, k, clock) {
  if (k <= 0) return;
  const r = rng(Math.floor(t * 30) + 7);
  g.save(); g.globalAlpha = 0.5 * k;
  for (let i = 0; i < 9; i++) { const y = r() * H, hh = 6 + r() * 46, dx = (r() - 0.5) * 120; g.drawImage(g.canvas, 0, y, W, hh, dx, y, W, hh); }
  g.globalAlpha = 0.16 * k; g.fillStyle = '#DCE6FF'; for (let i = 0; i < 5; i++) g.fillRect(0, r() * H, W, 2 + r() * 5);
  g.restore();
  g.save(); g.globalAlpha = k; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(10,12,20,0.66)'; g.fillRect(W / 2 - 250, 190, 500, 250);
  g.font = sans(84, 900); g.fillStyle = '#FFFFFF'; g.fillText('◀◀', W / 2, 258);
  g.font = sans(92, 900); g.letterSpacing = '4px'; g.fillStyle = GOLD; g.fillText(clock, W / 2, 368);
  qaRect(g, W / 2 - 250, 190, 500, 250, 'text', 'rewind clock');
  g.restore();
}

// ================= THE TOUCHLINE =================
// A dugout behind the technical area (a glass back and roof, a row of seats); the tunnel is in the stand behind, between the two of them
function dugout(t, { x0, x1, seat = '#1C48B0', seatD = '#12327E', sit = [], stand = [], mood = 0 } = {}) {
  const zb = -39.1, zf = -37.9, items = [], bx = (a, b, col, far = 0) => ({ d: depth((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) + far, draw: gg => box(gg, B, a, b, col) });
  items.push({ d: depth((x0 + x1) / 2, 1.1, zb) + 6, draw: gg => { if (B.poly(gg, [[x0, 0, zb], [x1, 0, zb], [x1, 2.1, zb], [x0, 2.1, zb]])) { gg.fillStyle = 'rgba(20,26,38,0.86)'; gg.fill(); }
    for (let x = x0; x <= x1 + 0.01; x += 1.2) { const a = B.project(x, 0, zb + 0.01), b = B.project(x, 2.1, zb + 0.01); if (a.z > 0.3 && b.z > 0.3) { gg.strokeStyle = 'rgba(160,170,186,0.5)'; gg.lineWidth = Math.max(1, a.s * 0.04); gg.beginPath(); gg.moveTo(a.x, a.y); gg.lineTo(b.x, b.y); gg.stroke(); } } } });
  items.push(bx([x0 - 0.1, 2.1, zb - 0.1], [x1 + 0.1, 2.2, zf + 0.5], { top: '#3A4150', side: '#262B36', front: '#2E3440' }));
  items.push(bx([x0 + 0.2, 0.3, zb + 0.15], [x1 - 0.2, 0.44, zb + 0.75], { top: seat, side: seatD, front: seatD }, 4));
  items.push(bx([x0 + 0.2, 0.44, zb + 0.15], [x1 - 0.2, 1.02, zb + 0.28], { top: seat, side: seatD, front: seat }, 5));
  const up = smooth(clamp(mood));
  sit.forEach(([pl, x], i) => { items.push(P(pl, up > 0.5
    ? { x, z: zb + 1.25, head: PI / 2, pose: { ...POSE.stand(), ...POSE.armsUp(1), lift: 0.12 * Math.abs(Math.sin(t * 7 + i * 2)) }, e: JOY, t: t + i }
    : { x, z: zb + 0.5, head: PI / 2, pose: { ...SEATED, lean: 0.2 + 0.03 * Math.sin(t * 1.3 + i) }, e: 'focus', t: t + i })); });
  stand.forEach(([pl, x, z = -37.2, turn = 0], i) => { const hop = up * 0.14 * Math.abs(Math.sin(t * 6.5 + i * 1.7));
    const calm = { ...POSE.stand(), sh: [[-0.3, 0.1], [-0.3, 0.1]], el: [0.55, 0.55], lean: 0.02 + 0.01 * Math.sin(t * 1.4 + i) }, wild = { ...POSE.stand(), ...POSE.armsUp(1), sh: [[2.7, 0.55], [2.7, 0.55]], lift: hop };
    items.push(P(pl, { x, z, head: PI / 2 + turn * (1 - up) + up * 0.5 * Math.sin(t * 3 + i), pose: blend(calm, wild, up), e: up > 0.5 ? JOY : 'focus', t: t + 3 + i })); });
  return items;
}
// The way off the pitch: a doorway in the front of the stand itself, the crowd sitting right above it, and behind the
// doorway a lit corridor running back under the seats (the concrete, the blue line and the strip lights of the corridor the
// referee is walked down afterwards). It used to be a blue canopy standing on the grass by itself with a flat black back:
// it read as a box, and a man walked toward it did not look as if he was leaving the pitch (the author's note).
// The doorway is in the stand's front wall, which here is blue and as tall as the door along the whole straight (down to
// the stand's own low wall toward the corners): from any side there is no block standing out, only a wall with a door in it.
// It is one piece of set, painted before any shadow (its `shadow` pass; touchline() puts it first): the men who go in are
// drawn after it, and their shadows fall on its floor. The lights over the door are the competition's stars, left as dots
const TX = 2.0, TZ = -44.38;  // the middle of the doorway, and the plane of the wall (just proud of the stand's own)
function tunnel(x = TX) {
  const hw = 1.5, hh = 2.45, top = 2.95, deep = 14, n = 7, seg = deep / n, X1 = 45.5, X0 = 39.5;
  const q = (gg, pts, col) => { if (B.poly(gg, pts)) { gg.fillStyle = col; gg.fill(); } };
  const paint = gg => {
    if (B.E[2] < TZ + 0.3) return;  // only ever seen from the pitch
    q(gg, [[-X1, 0, TZ], [X1, 0, TZ], [X1, 1.25, TZ], [X0, top, TZ], [-X0, top, TZ], [-X1, 1.25, TZ]], '#1A3380');
    q(gg, [[-X0, top - 0.1, TZ + 0.01], [X0, top - 0.1, TZ + 0.01], [X0, top, TZ + 0.01], [-X0, top, TZ + 0.01]], '#2A4CA6');
    for (let i = -5; i <= 5; i++) { const pp = B.project(x + i * 0.58, 2.7, TZ + 0.01); if (pp.z > 0.3) { gg.fillStyle = 'rgba(244,246,255,0.85)'; gg.beginPath(); gg.arc(pp.x, pp.y, Math.max(1, pp.s * 0.07), 0, 2 * PI); gg.fill(); } }
    // inside, seen through the doorway only: bays of a corridor going back, each darker than the one before it, a strip
    // light and its pool on the floor in every bay, a lit door at the far end
    gg.save();
    if (B.poly(gg, [[x - hw, 0, TZ], [x + hw, 0, TZ], [x + hw, hh, TZ], [x - hw, hh, TZ]])) {
      gg.fillStyle = '#0C0E14'; gg.fill(); gg.clip();
      const zf = TZ - deep;
      q(gg, [[x - hw, 0, zf], [x + hw, 0, zf], [x + hw, hh, zf], [x - hw, hh, zf]], '#1A1D25');
      q(gg, [[x - 1.3, 0, zf + 0.02], [x - 0.3, 0, zf + 0.02], [x - 0.3, 2.05, zf + 0.02], [x - 1.3, 2.05, zf + 0.02]], '#7C89A4');
      for (let i = n - 1; i >= 0; i--) {
        const za = TZ - (i + 1) * seg, zb = TZ - i * seg, dk = 0.1 + 0.55 * i / (n - 1), sh = c => mix(c, '#07080C', dk);
        q(gg, [[x - hw, 0, za], [x + hw, 0, za], [x + hw, 0, zb], [x - hw, 0, zb]], sh('#2B2F38'));
        q(gg, [[x - 0.95, 0.004, za + seg * 0.28], [x + 0.95, 0.004, za + seg * 0.28], [x + 0.95, 0.004, za + seg * 0.74], [x - 0.95, 0.004, za + seg * 0.74]], sh('#3A404C'));
        q(gg, [[x - hw, hh, za], [x + hw, hh, za], [x + hw, hh, zb], [x - hw, hh, zb]], sh('#1E2129'));
        for (const sd of [-1, 1]) { const wx = x + sd * hw, wi = wx - sd * 0.012; if ((B.E[0] - wx) * sd >= 0) continue;  // a wall seen from behind
          q(gg, [[wx, 0, za], [wx, 0, zb], [wx, hh, zb], [wx, hh, za]], sh(sd < 0 ? '#3B404C' : '#353A46'));
          q(gg, [[wi, 1.0, za], [wi, 1.0, zb], [wi, 1.22, zb], [wi, 1.22, za]], sh('#22408E'));
          q(gg, [[wi, 0, za], [wi, 0, za + 0.12], [wi, hh, za + 0.12], [wi, hh, za]], sh('#23262E')); }
        q(gg, [[x - 0.55, hh - 0.02, za + seg * 0.4], [x + 0.55, hh - 0.02, za + seg * 0.4], [x + 0.55, hh - 0.02, za + seg * 0.62], [x - 0.55, hh - 0.02, za + seg * 0.62]], mix('#EAF1FF', '#07080C', 0.3 * i / (n - 1)));
      }
    }
    gg.restore();
  };
  return [{ d: 9000, draw: () => {}, shadow: paint }];
}
function touchline(g, t, items, { cheer = 0, blur = 2.5, night = true, parts = [] } = {}) {
  stadium(g, t, [...tunnel(), ...parts, ...items], { cheer, blur, boards: [], night });  // the stand's wall and the tunnel first: they are painted before anyone's shadow
}

// a service corridor under a stand: concrete, a blue line along the walls, strip lights
function corridor(g, t, cx, cz) {
  g.fillStyle = '#0B0D12'; g.fillRect(0, 0, W, H);
  const quad = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  const x0 = cx - 26, x1 = cx + 26, z0 = cz - 1.75, z1 = cz + 1.75, hh = 2.8;
  quad([[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], '#2B2F38');
  quad([[x0, 0, z0], [x1, 0, z0], [x1, hh, z0], [x0, hh, z0]], '#3B404C'); quad([[x0, 0, z1], [x1, 0, z1], [x1, hh, z1], [x0, hh, z1]], '#353A46');
  quad([[x0, hh, z0], [x1, hh, z0], [x1, hh, z1], [x0, hh, z1]], '#1E2129');
  for (const z of [z0 + 0.01, z1 - 0.01]) quad([[x0, 1.0, z], [x1, 1.0, z], [x1, 1.22, z], [x0, 1.22, z]], '#22408E');
  for (let x = x0 + 1; x < x1; x += 4) quad([[x, hh - 0.02, cz - 0.3], [x + 1.5, hh - 0.02, cz - 0.3], [x + 1.5, hh - 0.02, cz + 0.3], [x, hh - 0.02, cz + 0.3]], '#EAF1FF');
  for (let x = x0 + 3; x < x1; x += 8) quad([[x, 0, z0 + 0.02], [x + 1.0, 0, z0 + 0.02], [x + 1.0, 2.1, z0 + 0.02], [x, 2.1, z0 + 0.02]], '#262A33');  // doors
}
// a quiet room, years later: a wall, a window's light on it, a lamp
function roomSet(g, t, cx, cz) {
  g.fillStyle = '#0C1016'; g.fillRect(0, 0, W, H);
  const quad = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  quad([[cx - 9, 0, cz - 1.9], [cx + 9, 0, cz - 1.9], [cx + 9, 0, cz + 9], [cx - 9, 0, cz + 9]], '#22262E');
  quad([[cx - 7, 0, cz - 1.9], [cx + 7, 0, cz - 1.9], [cx + 7, 3.4, cz - 1.9], [cx - 7, 3.4, cz - 1.9]], '#2B3A4C');
  quad([[cx - 3.9, 0.9, cz - 1.89], [cx - 1.5, 0.9, cz - 1.89], [cx - 1.5, 2.6, cz - 1.89], [cx - 3.9, 2.6, cz - 1.89]], '#465C74');
  quad([[cx + 1.6, 0, cz - 1.89], [cx + 3.4, 0, cz - 1.89], [cx + 3.4, 2.05, cz - 1.89], [cx + 1.6, 2.05, cz - 1.89]], '#232D3A');
  { const c = B.project(cx - 0.6, 1.6, cz), R = c.s * 3.4; g.save(); g.globalCompositeOperation = 'screen'; const rg = g.createRadialGradient(c.x, c.y, R * 0.1, c.x, c.y, R); rg.addColorStop(0, 'rgba(255,226,186,0.2)'); rg.addColorStop(1, 'rgba(255,226,186,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); g.restore(); }
}
function micItem(x, y, z, { dx = -0.15, dy = -0.17, dz = 0.04, ax = -1.3, ay = -0.32, az = 0.3, sleeve = '#34505C', skin = '#CFA98C' } = {}) {  // a reporter's microphone, held up to him from out of the picture: a sleeve, a fist, the handle, the foam head
  return { d: depth(x, y, z), draw: g => { const c = B.project(x, y, z), h = B.project(x + dx, y + dy, z + dz), e = B.project(x + ax, y + ay, z + az); if (c.z < 0.3 || h.z < 0.3 || e.z < 0.3) return;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = sleeve; g.lineWidth = h.s * 0.085; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(lerp(e.x, h.x, 0.9), lerp(e.y, h.y, 0.9)); g.stroke();
    g.lineCap = 'butt'; g.strokeStyle = '#E8E6E0'; g.lineWidth = h.s * 0.075; g.beginPath(); g.moveTo(lerp(e.x, h.x, 0.9), lerp(e.y, h.y, 0.9)); g.lineTo(lerp(e.x, h.x, 0.96), lerp(e.y, h.y, 0.96)); g.stroke(); g.lineCap = 'round';
    g.strokeStyle = '#22252B'; g.lineWidth = c.s * 0.032; g.beginPath(); g.moveTo(h.x + (h.x - c.x) * 0.35, h.y + (h.y - c.y) * 0.35); g.lineTo(c.x, c.y); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(h.x, h.y, h.s * 0.046, 0, 2 * PI); g.fill();
    g.translate(c.x, c.y); g.rotate(Math.atan2(c.x - h.x, h.y - c.y));
    g.fillStyle = '#3A3F49'; g.beginPath(); g.ellipse(0, -c.s * 0.02, c.s * 0.05, c.s * 0.07, 0, 0, 2 * PI); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(-c.s * 0.015, -c.s * 0.04, c.s * 0.022, c.s * 0.03, 0, 0, 2 * PI); g.fill();
    g.fillStyle = '#E8E6E0'; g.fillRect(-c.s * 0.034, c.s * 0.04, c.s * 0.068, c.s * 0.025); g.restore(); } };
}
// a broadcast camera on the right shoulder of the man who carries it, its lens where he looks
const tvCamProp = () => ({ at: 'front', depth: (sk, dp) => dp(sk.arms[1].sh) - 0.12, draw: (g, sk, pr) => { const k = sk.k, S = v3.add(sk.arms[1].sh, [0, 0.17 * k, 0]), f = sk.f;
  const at = d => pr(v3.add(S, v3.mul(f, d * k))), a = at(-0.3), b = at(0.22), c = at(0.5), e = at(0.62);
  g.save(); g.lineCap = 'round';
  g.strokeStyle = '#1A1C21'; g.lineWidth = 0.27 * k * b.s; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  g.strokeStyle = '#2E323A'; g.lineWidth = 0.2 * k * b.s; g.beginPath(); g.moveTo(a.x, a.y - 0.02 * k * a.s); g.lineTo(b.x, b.y - 0.02 * k * b.s); g.stroke();
  g.lineCap = 'butt'; g.strokeStyle = '#0E0F12'; g.lineWidth = 0.2 * k * c.s; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke();
  g.strokeStyle = '#3A3F49'; g.lineWidth = 0.25 * k * e.s; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(e.x, e.y); g.stroke();
  const tl = pr(v3.add(v3.add(S, v3.mul(f, 0.1 * k)), [0, 0.17 * k, 0])); g.fillStyle = '#FF3B30'; g.beginPath(); g.arc(tl.x, tl.y, Math.max(2, 0.03 * k * tl.s), 0, 2 * PI); g.fill();
  g.restore(); } });

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: NIGHT_G, trans: 'cut', noJump: true, kb: 0, ...o });

  // ======================= HOOK: full time. Drogba, substituted an hour and a half into the night, has a live television
  // camera in his hands. We are the camera =======================
  const ctxS = s('ctx'), whyT = w('hook', 'This') - 0.1, itsT = w('hook', "It's") - 0.05;
  const DR = [TX, TZ + 2.3];  // where he stands, a couple of steps out of the tunnel's doorway, facing the pitch and the lens
  // a: the clock of his rant (it runs backwards in the rewind)
  const drogbaCam = (a, t) => { const jab = Math.sin(a * 10.5), hard = smooth(clamp((a - itsT + 0.2) / 0.3));
    return { x: DR[0] + 0.025 * Math.sin(a * 3.1), z: DR[1] + 0.03 * Math.sin(a * 2.3) + 0.04 * hard, head: PI / 2 + 0.05 * Math.sin(a * 2.7),
      pose: { ...POSE.stand(), sh: [[1.74 + 0.03 * jab, 0.03], [1.74 - 0.03 * jab, 0.03]], el: [0.3, 0.3], fingers: true, lean: 0.2 + 0.05 * Math.sin(a * 4.1) + 0.06 * hard, look: -0.12 },
      e: { ...SHOUT(a, 1), look: [0.05 * Math.sin(a * 5), -0.05] }, t }; };
  const holdCam = (a, t) => {  // two stewards at his shoulders, hauling; the tunnel behind them
    const pull = (pl, dx, dz, ph, right) => P(pl, { x: DR[0] + dx + 0.03 * Math.sin(a * 3 + ph), z: DR[1] + dz, head: PI / 2 + (right ? 0.5 : -0.5), pose: { ...POSE.stand(), sh: right ? [[1.3, 0.35], [0.3, 0.2]] : [[0.3, 0.2], [1.3, 0.35]], el: [0.5, 0.5], lean: -0.08 + 0.03 * Math.sin(a * 4 + ph) }, e: 'worried', t: t + ph });
    return [pull(STEWARDS[0], -0.62, -0.42, 0, false), pull(STEWARDS[1], 0.66, -0.5, 1.7, true), P(STEWARDS[2], { x: DR[0] + 1.9, z: DR[1] - 1.6, head: PI / 2 - 0.4, pose: POSE.stand(), e: 'worried', t: t + 3 })];
  };
  const camPOV = a => { const hc = skeleton(DROGBA, drogbaCam(a, 0)).headC;  // the lens is on his face whatever he does
    return lookFrom([DR[0] + 0.02 * Math.sin(a * 6.3), 1.66 + 0.012 * Math.sin(a * 7.7), DR[1] + lerp(1.03, 0.85, smooth(clamp(a / 4.8)))], [hc[0] * 0.6 + DR[0] * 0.4, hc[1] - 0.03, hc[2]], { fov: 990, cy: H * 0.442 }); };
  const hookDraw = (g, lt, t, aOf) => {  // aOf: his clock as a function of the film's
    const a = aOf(t);
    rigFn(lt, t, tt => camPOV(aOf(tt)), { shake: 2.2 + (a > itsT ? 7 * Math.exp(-(a - itsT) * 5) : 0) });
    touchline(g, t, [P(DROGBA_END, drogbaCam(a, t)), ...holdCam(a, t)], { cheer: 0.6, blur: 6 });
  };
  shot(0, (g, lt, t) => hookDraw(g, lt, t, tt => tt), { grade: TV_G, mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame', 'player hidden', 'face behind player'], hud: (g, lt, t) => {
    liveMark(g, t);
    const k = 1 + 0.06 * Math.exp(-Math.max(0, t - itsT) * 5) * (t > itsT ? 1 : 0);
    title2(g, 'IT’S A', 'DISGRACE', 285, { k, a: fadeOut(t, whyT - 0.12, 0.12) });
  } });
  cue(0, 'boom_cine', 0.35); cue(0.02, 'crowd_gasp', 0.3); cue(itsT, 'boom_move', 0.45);
  // "This is why": the tape runs back
  shot(whyT, (g, lt, t) => {
    hookDraw(g, lt, t, tt => whyT - (tt - whyT) * 2.4);
  }, { grade: TV_G, mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame', 'player hidden', 'face behind player'],
    post: (g, lt, t) => { const k = clamp(lt / 0.15) * (1 - clamp((t - (ctxS - 0.2)) / 0.15)), m = lerp(95, 0, ease.inOut(clamp(lt / (ctxS - whyT - 0.15)))); rewindFx(g, t, k, `${String(Math.floor(m)).padStart(2, '0')}:00`); },
    hud: (g, lt, t) => { liveMark(g, t, { a: fadeOut(t, whyT + 0.1, 0.2) }); } });
  cue(whyT, 'whoosh_deep', 0.4); cue(whyT + 0.1, 'riser', 0.3);

  // ======================= 6 MAY 2009: Stamford Bridge in the last of the daylight =======================
  const afterT = w('ctx', 'After') - 0.12, semiT = w('ctx', 'A') - 0.05, vsT = w('ctx', 'Chelsea') - 0.05;
  const lineup = t => {  // both teams where they stand at the kick-off: Chelsea to attack +x in the first half
    const at = (pl, x, z, hd, ph) => P(pl, { x, z, head: hd, pose: { ...POSE.stand(), lean: 0.02 + 0.01 * Math.sin(t * 1.3 + ph) }, e: 'focus', t: t + ph });
    return [at(CECH, -46, 0, 0, 0), at(BOSINGWA, -27, -19, 0, 1), at(ALEX, -30, -6, 0, 2), at(TERRY, -30, 6, 0, 3), at(COLE, -27, 19, 0, 4), at(ESSIEN, -17, 0, 0, 5), at(BALLACK, -12, -9, 0, 6), at(LAMPARD, -12, 9, 0, 7),
      at(ANELKA, -3, -16, 0, 8), at(DROGBA, -0.6, 0.9, 0.3, 9), at(MALOUDA, -3, 16, 0, 10),
      at(VALDES, 46, 0, PI, 11), at(ALVES, 26, -19, PI, 12), at(TOURE, 29, -6, PI, 13), at(PIQUE, 29, 6, PI, 14), at(ABIDAL, 26, 19, PI, 15), at(BUSQUETS, 17, 0, PI, 16), at(XAVI, 12, -9, PI, 17), at(KEITA, 12, 9, PI, 18),
      at(MESSI, 10.5, -12.5, PI, 19), at(ETOO, 9.3, 1.5, PI, 20), at(INIESTA, 6, 17, PI, 21), at(REF, 2.5, -7, PI * 0.75, 22), BALL([0, BALL_R, 0])];
  };
  shot(ctxS - 0.05, (g, lt, t) => {
    const L = afterT - ctxS, u = glide(clamp(lt / L));
    rigFn(lt, t, tt => { const v = glide(clamp((tt - ctxS + 0.05) / L)); return K(0.5 - 0.4 * v, lerp(0.46, 0.1, v), lerp(64, 17, v), [lerp(-4, 2.6, v), 1, lerp(-2, 0.6, v)], { cy: H * lerp(0.5, 0.57, v) }); }, { shake: 0.2 });
    stadium(g, t, lineup(t), { cheer: 0.5, blur: 1.2, night: false });
  }, { grade: DUSK_G, mbStep: 3, mbMax: 14, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    placeStamp(g, lt, 'London', '6 May 2009', { y: 190, t0: 0.08 });
    if (t > semiT) plate(g, 'CHAMPIONS LEAGUE SEMI-FINAL · SECOND LEG', W / 2, 330, { color: CREAM, size: 34, ...pin(t, semiT) });
    if (t > vsT) { plate(g, 'CHELSEA', 300, 440, { color: CBLUE, ink: '#FFFFFF', size: 52, ...pin(t, vsT) }); plate(g, 'BARCELONA', 760, 440, { color: BYEL, size: 52, ...pin(t, vsT + 0.25) });
      plate(g, 'FIRST LEG 0–0', W / 2, 540, { color: '#1B2436', ink: CREAM, size: 36, ...pin(t, vsT + 0.6) }); }
  } });
  cue(ctxS - 0.05, 'whoosh_soft', 0.25); cue(semiT, 'reveal_bell', 0.3); cue(vsT, 'stamp', 0.35); cue(vsT + 0.25, 'stamp', 0.35); cue(ctxS + 0.3, 'whistle', 0.3);

  // 9': the ball loops up off Touré on the edge of the box, and Essien meets it on the volley with his left foot: off the
  // underside of the bar and in. From behind him
  const a1S = s('a1'), tE = w('ctx', 'volleys') + 0.12, barT = tE + 0.6, netE = barT + 0.22;
  const eM = new Mover([[tE - 2.2, 25.6, 4.2], [tE - 0.5, 30.3, 2.2], [tE, 31.2, 1.9], [tE + 0.6, 32.2, 1.8, { stop: true }], [tE + 1.2, 32.4, 1.8], [99, 32.4, 1.8]], { face: tt => (tt > netE + 0.2 ? PI - 0.35 : null), turn: 6 });
  const tyM = new Mover([[tE - 2.2, 40.2, -5.2], [tE - 1.1, 39.3, -4.3, { stop: true }], [99, 39.3, -4.3]], { heading0: PI, face: () => PI });
  const pqM = new Mover([[tE - 2.2, 43.6, 7.2], [tE, 43.0, 6.0, { stop: true }], [99, 43.0, 6.0]], { heading0: PI, face: () => PI });
  const laM = new Mover([[tE - 2.2, 33.0, 12.5], [tE, 36.2, 10.6], [tE + 1.4, 38.0, 9.0, { stop: true }], [99, 38.0, 9.0]]);
  const drM1 = new Mover([[tE - 2.2, 42.4, 4.8], [tE, 44.4, 3.3], [tE + 1.2, 45.3, 2.9, { stop: true }], [99, 45.3, 2.9]]);
  const vM1 = new Mover([[tE - 3, 51.6, 0.3], [tE, 51.4, 0.1, { stop: true }], [99, 51.4, 0.1]], { heading0: PI, face: () => PI });
  const HITE = [31.85, 0.62, 1.7];
  const ballE = new BallPath([
    { t0: tE - 2.2, t1: tE - 1.05, kind: 'air', from: [35.5, BALL_R, 13.0], to: [39.0, 1.95, -4.1], g: 4 },
    { t0: tE - 1.05, t1: tE, kind: 'air', from: [39.0, 1.95, -4.1], to: HITE },
    { t0: tE, t1: barT, kind: 'air', from: HITE, to: [52.42, 2.38, -0.9], g: 3 },
    { t0: barT, t1: netE, kind: 'air', from: [52.42, 2.38, -0.9], to: [53.05, 0.35, -1.0], g: 0 },
    { t0: netE, t1: netE + 0.5, kind: 'air', from: [53.05, 0.35, -1.0], to: [53.6, BALL_R, -1.1] },
    { t0: netE + 0.5, t1: 99, kind: 'hold', from: [53.6, BALL_R, -1.1] },
  ]);
  shot(afterT, (g, lt, t) => {
    const up = ease.inOut(clamp((t - netE - 0.15) / 0.4));
    rigFn(lt, t, tt => { const m = eM.at(tt), v = ease.inOut(clamp((tt - tE - 0.05) / 0.7)), b = ballE.at(Math.min(tt, netE)).pos;
      const q = ease.inOut(clamp((tt - afterT - 0.12) / 0.95)), ph = lerp(1.0, 2.83, q), R = lerp(4.4, 5.15, q);  // round him: his face to the lens first, then over his shoulder
      return lookFrom([m.x + R * Math.cos(ph), lerp(1.45, 1.75, q), m.z + R * Math.sin(ph)], mix3(mix3([m.x + 0.3, 1.2, m.z], [m.x + 3.5, 1.15, m.z - 0.4], q), [lerp(m.x, b[0], 0.72), 1.35, lerp(m.z, b[2], 0.72)], v), { fov: lerp(1500, 1750, v), cy: H * 0.47 }); }, { shake: t > barT && t < barT + 0.4 ? 2.4 : 0.6 });
    const es = runKick(eM, t, tE, 'L', { u0: 0.6, dur: 0.56 });
    const head1 = (pl, mv, tt) => { const ms = moving(mv, tt, { t, e: 'focus' }), j = clamp((tt - (tE - 1.32)) / 0.5); return j > 0 && j < 1 ? { ...ms, pose: blend(ms.pose, POSE.jump(j, { h: 0.4 }), smooth(clamp(j / 0.2)) * smooth(clamp((1 - j) / 0.25))), air: 0.4 * Math.sin(PI * j) } : ms; };
    stadium(g, t, [
      P(ESSIEN, up > 0 ? { ...es, pose: blend(es.pose, { ...POSE.armsUp(1), sh: [[2.6, 0.6], [2.6, 0.6]] }, up), e: JOY } : es),
      P(TOURE, head1(TOURE, tyM, t)), P(PIQUE, moving(pqM, t, { t: t + 1, e: t > netE ? 'sad' : 'focus' })), P(LAMPARD, moving(laM, t, { t: t + 2, e: t > netE ? JOY : 'focus' })),
      P(DROGBA, moving(drM1, t, { t: t + 3 })),
      P(VALDES, keeper(VALDES, vM1, t, { dive: { t0: tE + 0.2, dur: 0.46, side: 1, dz: -0.9 } })),
      ballOf(ballE, t, t > tE && t < netE ? { trail: trailOf(ballE, t, 6, 0.012) } : {}),
    ], { cheer: t > netE ? 1 : 0.5, blur: 2.5, night: false, hit: { t0: netE, y: 0.9, z: -1.0, k: 1.2 } });
  }, { grade: DUSK_G, mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const sc = t > netE;
    scoreBug(g, sc ? 1 : 0, 0, "9'", { hotL: sc ? 1 - clamp((t - netE) / 0.6) : 0 });
    if (sc) plate(g, "ESSIEN · 9'", W / 2, 300, { color: CBLUE, ink: '#FFFFFF', size: 50, ...pin(t, netE + 0.05) });
  } });
  cue(afterT, 'whoosh_fast', 0.22); cue(tE - 1.07, 'touch', 0.35); cue(tE - 0.02, 'kick', 0.85); cue(barT - 0.01, 'thud', 0.6); cue(netE, 'net', 0.8); cue(netE + 0.02, 'crowd_roar', 0.7); cue(netE, 'boom_move', 0.4);

  // ======================= 23': APPEAL ONE. Malouda into the corner of the area, Alves across him; he goes down over the
  // line; the free kick is given outside it. Seen along that line from the goal-line end: the box on the left =======================
  const a2S = s('a2'), cT = w('a1', 'down') + 0.12, edgeT = w('a1', 'edge') - 0.1, refT = w('a1', 'referee,') - 0.32, givesT = w('a1', 'gives') - 0.05, outT = w('a1', 'Outside.') - 0.05;
  const LZ = 20.16;  // the side line of the penalty area
  const maM = new Mover([[cT - 2.3, 30.0, 27.6], [cT - 0.9, 36.6, 23.6], [cT, 40.5, 20.75], [cT + 0.4, 42.0, 19.85], [cT + 1.15, 42.95, 19.4, { stop: true }], [99, 42.95, 19.4]]);  // after the contact: down in 0.4 s, then a slide of a good metre, slowing
  const alM = new Mover([[cT - 2.3, 44.4, 16.0], [cT - 0.7, 42.6, 18.2], [cT, 41.0, 19.75], [cT + 0.5, 41.2, 20.5, { stop: true }], [99, 41.2, 20.5]], { heading0: PI * 0.8, face: tt => (tt > cT + 0.4 ? -2.1 : null), turn: 5 });
  const coM = new Mover([[cT - 2.3, 26.0, 33.0], [cT, 28.8, 31.8], [cT + 1.6, 32.6, 30.9, { stop: true }], [99, 32.6, 30.9]]);
  const buM = new Mover([[cT - 2.3, 31.6, 20.6], [cT, 37.4, 17.6], [cT + 1.2, 38.6, 17.2, { stop: true }], [99, 38.6, 17.2]]);
  const rfM1 = new Mover([[cT - 2.3, 25.0, 33.0], [cT - 0.9, 30.0, 29.0], [cT, 33.4, 24.7], [cT + 1.5, 37.6, 23.2], [cT + 2.3, 38.4, 22.6, { stop: true }], [givesT - 0.25, 38.4, 22.6, { stop: true }], [givesT + 0.7, 38.95, 21.55, { stop: true }], [99, 38.95, 21.55]], { face: tt => (tt > cT + 1.2 ? -0.75 : null), turn: 5 });
  const footA1 = tt => { const m = maM.at(tt); return [m.x + Math.cos(m.head) * 0.62, BALL_R, m.z + Math.sin(m.head) * 0.62]; };
  const ballA1 = new BallPath([
    { t0: cT - 3, t1: cT - 0.04, kind: 'fn', fn: tt => footA1(Math.min(tt, cT - 0.04)) },
    { t0: cT - 0.04, t1: cT + 1.5, kind: 'roll', from: footA1(cT - 0.04), to: [46.4, BALL_R, 16.6], decay: 1.7 },
    { t0: cT + 1.5, t1: 99, kind: 'hold', from: [46.4, BALL_R, 16.6] },
  ]);
  const SPOT = [39.9, 21.0];  // where the free kick is given
  const first = (t, { ref = true, spot = false } = {}) => {
    // he pitches forward (faster and faster), lands on his front and slides on, the heels coming down and the arms spreading;
    // once he has stopped he comes up on one elbow and throws the other arm up at the referee; when the free kick is
    // given outside, the arm and his head go down
    const dn = clamp((t - cT - 0.03) / 0.36), sl = smooth(clamp((t - cT - 0.4) / 0.75)), prop = smooth(clamp((t - cT - 1.2) / 0.45)), sunk = smooth(clamp((t - outT - 0.1) / 0.5));
    const ms = moving(maM, t, { t, e: t > cT ? 'shock' : 'focus', drib: 1 });
    const mal = t < cT ? ms : onGrass(MALOUDA, { ...ms, pose: blend(blend(blend(blend(ms.pose, FALL_FWD, dn * dn), SLIDE_FLAT, sl), APPEAL_ELBOW(t), prop), SUNK_FLAT, sunk),
      e: sunk > 0.5 ? 'sad' : prop > 0.5 ? SHOUT(t, 0.6) : 'shock', shadow: lyingShadow(ms.head, dn * dn) }, true);
    const as = moving(alM, t, { t: t + 1, e: 'focus' }), inn = smooth(clamp((t - cT - 0.45) / 0.4));
    const alv = { ...as, pose: blend(blend(as.pose, { lean: 0.16, sh: [[0.7, 0.45], [0.7, 0.45]], el: [1.0, 1.0] }, smooth(clamp(1 - Math.abs(t - cT) / 0.3))), INNOCENT, inn), e: inn > 0.5 ? 'worried' : 'focus' };
    const rs = moving(rfM1, t, { t: t + 5, e: 'focus' }), wh = smooth(clamp((t - cT - 0.25) / 0.2)) * (1 - smooth(clamp((t - cT - 1.3) / 0.4))), pt = smooth(clamp((t - givesT) / 0.35));
    const items = [P(MALOUDA, mal), P(ALVES, alv), P(COLE, { ...moving(coM, t, { t: t + 2 }), ...(t > cT + 0.7 ? { pose: blend(moving(coM, t).pose, APPEAL(t), smooth(clamp((t - cT - 0.7) / 0.4))), e: SHOUT(t, 0.5) } : {}) }),
      P(BUSQUETS, moving(buM, t, { t: t + 3 })), spot && t > givesT + 0.5 ? BALL([SPOT[0], BALL_R, SPOT[1]]) : ballOf(ballA1, t)];
    if (ref) items.push(P(REF, { ...rs, pose: blend(blend(rs.pose, WHISTLE, wh), { ...POSE.stand(), sh: [[0.1, 0.12], [0.95, 0.25]], el: [0.3, 0.06], point: [false, true], lean: 0.05 }, pt), ...(wh > 0.5 ? { prop: whistleProp() } : {}) }));
    return items;
  };
  const EA = [50.4, 1.25, LZ + 0.03];
  const camA1 = tt => { const m = maM.at(Math.min(tt, cT + 0.2)), v = ease.inOut(clamp((tt - cT + 0.5) / 0.9)), w0 = lerp(0.1, 0.55, smooth(clamp((tt - a1S) / 1.3))),  // on him first; then the line comes to the middle of the picture
    T0 = mix3([m.x, 0.95, lerp(m.z, LZ, w0)], [41.3, 0.75, LZ - 0.12], v), d = Math.hypot(EA[0] - T0[0], EA[2] - T0[2]);
    return lookFrom(EA, T0, { fov: clamp(232 * d, 1900, 4200), cy: H * 0.47 }); };
  shot(a1S - 0.05, (g, lt, t) => {
    rigFn(lt, t, camA1, { shake: t > cT + 0.3 && t < cT + 0.75 ? 2.4 : t > cT && t <= cT + 0.3 ? 1.4 : 0.5 });
    stadium(g, t, first(t), { cheer: 0.6, blur: 2.5, night: false });
    const la = clamp((t - edgeT) / 0.25);
    if (la > 0) { groundTag(g, 'THE BOX', [47.0, 0, LZ - 0.56], { color: '#1B2436', ink: CREAM, a: la }); groundTag(g, 'OUTSIDE', [47.0, 0, LZ + 0.56], { color: CREAM, a: la }); }
  }, { grade: DUSK_G, mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "23'"); appeals(g, 0);
  } });
  cue(a1S - 0.05, 'whoosh_fast', 0.22); cue(cT, 'thud', 0.5); cue(cT + 0.36, 'thud', 0.55); cue(cT + 0.05, 'crowd_gasp', 0.45); cue(cT + 0.45, 'whistle', 0.55);
  // the referee
  shot(refT, (g, lt, t) => {
    const m = rfM1.at(t), u = glide(clamp(lt / (givesT - refT)));
    rig(B, lt, [[0, K(1.0 - 0.1 * u, 0.03, lerp(2.9, 2.35, u), [m.x, 1.5, m.z], { cy: H * 0.46 })]], { t, e: lin, shake: 0.4 });
    stadium(g, t, first(t), { cheer: 0.7, blur: 3.5, night: false });
  }, { grade: DUSK_G, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "23'"); appeals(g, 0);
    nameTitle(g, lt, 'Tom Henning Øvrebø', 'THE REFEREE · NORWAY', { y: 300, t0: 0.12 });
  } });
  cue(refT, 'whoosh_soft', 0.2); cue(refT + 0.15, 'reveal_bell', 0.3);
  // he gives it: outside
  const camA1c = tt => { const u = glide(clamp((tt - givesT) / (a2S - givesT))); return lookFrom([EA[0] - 2.4, 1.5, LZ + 0.04], [40.9, 0.8, LZ - 0.25], { fov: lerp(1750, 1950, u), cy: H * 0.47 }); };
  shot(givesT, (g, lt, t) => {
    rigFn(lt, t, camA1c, { shake: 0.4 });
    stadium(g, t, first(t, { spot: true }), { cheer: 0.85, blur: 2.5, night: false });
    groundTag(g, 'THE BOX', [45.3, 0, LZ - 0.5], { color: '#1B2436', ink: CREAM }); groundTag(g, 'OUTSIDE', [45.3, 0, LZ + 0.5], { color: CREAM });
    if (t > outT) ringAt(g, [SPOT[0], 0.02, SPOT[1]], 0.55, RED, clamp((t - outT) / 0.2));
  }, { grade: DUSK_G, mbStep: 3, mbMax: 14, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const no = t > outT;
    scoreBug(g, 1, 0, "23'"); appeals(g, no ? 1 : 0, { pulse: no ? 1 - clamp((t - outT) / 0.5) : 0 });
    if (no) plate(g, 'FREE KICK · OUTSIDE THE BOX', W / 2, 320, { color: RED, ink: '#FFF4E8', size: 46, ...pin(t, outT) });
  } });
  cue(givesT, 'whoosh_soft', 0.18); cue(outT, 'stamp', 0.6); cue(outT + 0.05, 'murmur', 0.5);

  // ======================= 26': APPEAL TWO. Drogba through on the right of the area, Abidal at his shoulder with a hand on
  // his shirt; he goes down; play on. From in front of them, going back with their run =======================
  const redS = s('red'), pT = w('a2', 'pulls') + 0.05, no2T = w('a2', 'Nothing.') - 0.08;
  const dM2 = new Mover([[pT - 1.9, 34.6, -9.6], [pT, 41.9, -6.9], [pT + 0.75, 44.3, -5.9], [pT + 1.1, 44.9, -5.7, { stop: true }], [99, 44.9, -5.7]]);
  const abAt = tt => { const m = dM2.at(tt), k = smooth(clamp((tt - pT + 0.9) / 0.7)), off = lerp(1.5, 0.7, k) + 1.0 * smooth(clamp((tt - pT - 0.8) / 0.5)), a = m.head - PI + 1.2; return { x: m.x + Math.cos(a) * off, z: m.z + Math.sin(a) * off, head: m.head + 0.25, sp: m.sp, phase: m.phase + 1.3 }; };
  const vM2 = new Mover([[pT - 2, 51.3, -0.6], [pT, 50.2, -1.6], [pT + 1.3, 47.6, -3.4, { stop: true }], [99, 47.6, -3.4]], { heading0: PI, face: () => PI + 0.3 });
  const rfM2 = new Mover([[pT - 2, 31.5, -2.6], [pT, 37.6, -2.2], [pT + 1.2, 42.0, -2.1], [pT + 2.6, 45.3, -2.3], [99, 45.3, -2.3]]);
  const footD2 = tt => { const m = dM2.at(tt); return [m.x + Math.cos(m.head) * 0.75, BALL_R, m.z + Math.sin(m.head) * 0.75]; };
  const ballA2 = new BallPath([
    { t0: pT - 3, t1: pT + 0.1, kind: 'fn', fn: tt => footD2(Math.min(tt, pT + 0.1)) },
    { t0: pT + 0.1, t1: pT + 1.3, kind: 'roll', from: footD2(pT + 0.1), to: [47.7, BALL_R, -3.7], decay: 1.4 },
    { t0: pT + 1.3, t1: 99, kind: 'hold', from: [47.7, BALL_R, -3.7] },
  ]);
  const second = t => {
    const ds = moving(dM2, t, { t, e: t > pT ? 'shock' : 'focus', drib: 1 }), held = smooth(clamp((t - pT + 0.15) / 0.25)), dn = clamp((t - pT - 0.5) / 0.45), up = smooth(clamp((t - pT - 1.3) / 0.5)), lay = dn * dn * (1 - up);
    let dro = { ...ds, pose: blend(ds.pose, { lean: -0.16, sh: [[1.2, 0.7], [0.4, 0.6]], el: [0.6, 0.5] }, held * (1 - smooth(dn))) };
    // down forward, flat on his front; then up on his knees, turned to the referee, both arms out
    if (dn > 0) dro = onGrass(DROGBA, { ...dro, head: dro.head + 0.95 * up, pose: blend(blend(dro.pose, FALL_FWD, dn * dn), KNEEL_APPEAL(t), up), e: up > 0.4 ? SHOUT(t, 0.7) : 'shock', shadow: lyingShadow(dro.head, lay) }, true);
    const am = abAt(t), ab0 = { x: am.x, z: am.z, head: am.head, pose: blend(POSE.stand(), POSE.run(am.phase, 0.8, 0), clamp((am.sp - 0.25) / 1.2)), e: 'focus', t: t + 2 };
    const abi = { ...ab0, pose: blend(blend(ab0.pose, { sh: [[1.0, 1.1], [0.3, 0.3]], el: [0.15, 0.7], lean: 0.12 }, held * (1 - smooth(clamp((t - pT - 0.7) / 0.3)))), INNOCENT, smooth(clamp((t - pT - 1.0) / 0.4))) };
    const rs = moving(rfM2, t, { t: t + 5, e: 'focus' }), po = smooth(clamp((t - no2T + 0.15) / 0.25));
    return { dro, abi, items: [P(DROGBA, dro), P(ABIDAL, abi), P(VALDES, keeper(VALDES, vM2, t)), P(REF, { ...rs, pose: blend(rs.pose, { ...POSE.stand(), ...PLAY_ON(t) }, po) }), ballOf(ballA2, t)] };
  };
  shot(a2S - 0.05, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = dM2.at(tt), v = ease.inOut(clamp((tt - pT - 0.5) / 0.6)); return K(2.25 - 0.2 * v, 0.07, lerp(5.4, 4.6, v), [m.x + 0.1, lerp(1.05, 0.7, v), m.z - 0.2], { cy: H * 0.45 }); }, { shake: 0.8 });
    const sc = second(t);
    stadium(g, t, sc.items, { cheer: 0.6, blur: 2.5, night: false });
    const hl = clamp((t - pT + 0.05) / 0.15) * (1 - clamp((t - pT - 0.75) / 0.2));
    if (hl > 0) ringAt(g, skeleton(ABIDAL, sc.abi).arms[0].hand, 0.2, GOLD, hl);
  }, { grade: DUSK_G, mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "26'"); appeals(g, 1);
  } });
  cue(a2S - 0.05, 'whoosh_fast', 0.22); cue(pT + 0.9, 'thud', 0.5); cue(pT + 0.7, 'crowd_gasp', 0.5);
  shot(no2T - 0.45, (g, lt, t) => {
    const u = glide(clamp(lt / (redS - no2T + 0.4)));
    rigFn(lt, t, tt => { const m = rfM2.at(tt), v = glide(clamp((tt - no2T + 0.45) / (redS - no2T + 0.4))); return lookFrom([47.3 - 0.4 * v, 1.25, -7.9 - 0.3 * v], [lerp(44.0, m.x + 0.4, 0.45), 1.2, lerp(-5.6, m.z, 0.45)], { fov: lerp(1250, 1400, v), cy: H * 0.46 }); }, { shake: 0.5 });
    stadium(g, t, second(t).items, { cheer: 0.9, blur: 3, night: false });
  }, { grade: DUSK_G, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const no = t > no2T;
    scoreBug(g, 1, 0, "26'"); appeals(g, no ? 2 : 1, { pulse: no ? 1 - clamp((t - no2T) / 0.5) : 0 });
    if (no) plate(g, 'PLAY ON', W / 2, 320, { color: RED, ink: '#FFF4E8', size: 60, ...pin(t, no2T) });
  } });
  cue(no2T - 0.45, 'whoosh_soft', 0.18); cue(no2T, 'stamp', 0.6); cue(no2T + 0.05, 'murmur', 0.55);

  // ======================= 66': ABIDAL SENT OFF. The second half, under the lights; Chelsea now attack the other goal.
  // Anelka runs on to a ball over the top, Abidal comes across him just outside the area =======================
  const a3S = s('a3'), fT = w('red', 'Abidal') - 0.3, cardT = w('red', 'sent') - 0.12, tenT = w('red', 'ten') - 0.15;
  const anM = new Mover([[fT - 1.8, -16.8, 4.4], [fT, -31.2, 1.7], [fT + 0.5, -33.3, 1.5, { stop: true }], [99, -33.3, 1.5]]);
  const abM3 = new Mover([[fT - 1.8, -18.4, 7.6], [fT, -30.8, 2.55], [fT + 0.6, -32.5, 3.3, { stop: true }], [99, -32.5, 3.3]], { face: tt => (tt > fT + 0.15 ? -0.5 : null), turn: 6 });
  const rfM3 = new Mover([[fT - 1.8, -11.5, -1.6], [fT, -23.6, 0.0], [fT + 1.0, -29.2, 1.5], [fT + 1.45, -30.0, 1.8, { stop: true }], [99, -30.0, 1.8]]);
  const tyM3 = new Mover([[fT - 1.8, -27.0, -5.5], [fT, -34.0, -2.2], [fT + 0.9, -35.2, -1.4, { stop: true }], [99, -35.2, -1.4]]);
  const footAn = tt => { const m = anM.at(tt); return [m.x + Math.cos(m.head) * 0.75, BALL_R, m.z + Math.sin(m.head) * 0.75]; };
  const ballR = new BallPath([
    { t0: fT - 3, t1: fT, kind: 'fn', fn: tt => footAn(Math.min(tt, fT)) },
    { t0: fT, t1: fT + 1.6, kind: 'roll', from: footAn(fT), to: [-36.6, BALL_R, 6.4], decay: 1.5 },
    { t0: fT + 1.6, t1: 99, kind: 'hold', from: [-36.6, BALL_R, 6.4] },
  ]);
  const sentOff = (t, down = true) => {
    const dn = clamp((t - fT) / 0.5), as = moving(anM, t, { t, e: t > fT ? 'shock' : 'focus', drib: 1 });
    const ane = t < fT ? as : onGrass(ANELKA, { ...as, pose: blend(as.pose, FALL_FWD, dn * dn), e: 'shock', shadow: lyingShadow(as.head, dn * dn) }, true);
    const bs = moving(abM3, t, { t: t + 1, e: 'focus' }), inn = smooth(clamp((t - fT - 0.5) / 0.4)), desp = smooth(clamp((t - cardT - 0.25) / 0.45));
    const abi = { ...bs, pose: blend(blend(bs.pose, INNOCENT, inn), { ...POSE.stand(), ...DESPAIR }, desp), e: desp > 0.4 ? 'shock' : inn > 0.5 ? 'worried' : 'focus' };
    const rs = moving(rfM3, t, { t: t + 5, e: 'focus' }), wh = smooth(clamp((t - fT - 0.2) / 0.2)) * (1 - smooth(clamp((t - fT - 0.9) / 0.3))), cd = smooth(clamp((t - cardT + 0.22) / 0.28));
    const off = smooth(clamp((t - tenT) / 0.3));  // the card still up, the other arm shows him the way off
    const ref = { ...rs, e: { ...EXPR.focus, noBlink: true }, pose: blend(blend(blend(rs.pose, WHISTLE, wh), { ...POSE.stand(), ...CARD_UP }, cd), { sh: [[1.35, 1.15], [2.95, 0.12]], el: [0.08, 0.1], point: [true, false] }, off),
      ...(cd > 0.3 ? { prop: cardProp('#D8202A') } : wh > 0.5 ? { prop: whistleProp() } : {}) };
    return [...(down ? [P(ANELKA, ane)] : []), P(ABIDAL, abi), P(REF, ref), P(TOURE, moving(tyM3, t, { t: t + 3 })), ballOf(ballR, t)];
  };
  shot(redS - 0.05, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = anM.at(tt), v = ease.inOut(clamp((tt - fT - 0.1) / 0.5)); return K(-1.2 + 0.12 * v, 0.07, lerp(5.6, 5.0, v), [m.x - 0.2, lerp(1.05, 0.75, v), m.z + 0.5], { cy: H * 0.45 }); }, { shake: t > fT && t < fT + 0.35 ? 2.0 : 0.7 });
    stadium(g, t, sentOff(t), { cheer: 0.6, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "66'"); appeals(g, 2);
  } });
  cue(redS - 0.05, 'whoosh_fast', 0.22); cue(fT, 'thud', 0.55); cue(fT + 0.05, 'crowd_gasp', 0.4); cue(fT + 0.3, 'whistle', 0.55);
  shot(cardT - 0.2, (g, lt, t) => {
    rigFn(lt, t, tt => { const u = glide(clamp((tt - cardT + 0.2) / (tenT - cardT + 0.2))), u2 = ease.inOut(clamp((tt - tenT + 0.1) / 0.7));  // over the shoulder of the man sent off; then in on the card
      return lookFrom([-34.6 + 0.3 * u + 0.75 * u2, 1.25 + 0.1 * u2, 3.4 + 0.15 * u - 0.75 * u2], mix3([-30.5, 1.72, 2.1], [-30.0, 2.0, 1.8], u2), { fov: lerp(lerp(1300, 1420, u), 2100, u2), cy: H * 0.47 }); }, { shake: 0.5 });
    stadium(g, t, sentOff(t, false), { cheer: 0.75, blur: 3 });
  }, { mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "66'"); appeals(g, 2);
    if (t > cardT) plate(g, "ABIDAL · SENT OFF · 66'", W / 2, 320, { color: '#D8202A', ink: '#FFF4E8', size: 48, ...pin(t, cardT) });
    if (t > tenT) plate(g, 'BARCELONA: TEN MEN', W / 2, 425, { color: BYEL, size: 40, ...pin(t, tenT) });
  } });
  cue(cardT - 0.2, 'whoosh_soft', 0.18); cue(cardT, 'stamp', 0.6); cue(cardT + 0.1, 'crowd_roar', 0.3); cue(tenT, 'stamp', 0.35);

  // ======================= APPEAL THREE: the hand of Piqué. Anelka flicks the ball past him in the area and it strikes his
  // outstretched arm. At half speed, from behind him =======================
  const goalS = s('goal'), h3F = w('a3', 'hand') - 0.1, no3T = w('a3', 'Nothing.') - 0.08, R3 = 0.5;
  const aa3 = t => (t - h3F) * R3;  // the clock of the action: 0 as the ball meets the arm
  const an3 = new Mover([[-1.6, -31.8, 7.9], [-0.3, -36.0, 6.0], [0.35, -37.4, 5.7], [0.9, -37.9, 6.0, { stop: true }], [99, -37.9, 6.0]]);
  const pq3 = new Mover([[-1.6, -40.2, 3.4], [0, -38.55, 4.55], [0.5, -38.6, 4.7, { stop: true }], [99, -38.6, 4.7]], { heading0: 0.25, face: () => 0.25 });
  const ty3 = new Mover([[-1.6, -41.6, 0.6], [0.4, -40.6, 1.6, { stop: true }], [99, -40.6, 1.6]], { heading0: 0, face: () => 0.5 });
  const rf3 = new Mover([[-1.6, -30.5, 5.0], [-0.2, -34.6, 6.9], [1.0, -36.6, 7.75, { stop: true }], [99, -36.6, 7.75]], { face: a => (a > 0.45 ? 3.62 : null), turn: 5 });  // the referee runs up to within two metres of him
  const footA3 = a => { const m = an3.at(a); return [m.x + Math.cos(m.head) * 0.7, BALL_R, m.z + Math.sin(m.head) * 0.7]; };
  const ARM3 = [-38.3, 1.43, 5.27];
  const ball3 = new BallPath([
    { t0: -3, t1: -0.3, kind: 'fn', fn: a => footA3(Math.min(a, -0.3)) },
    { t0: -0.3, t1: 0, kind: 'air', from: footA3(-0.3), to: ARM3, g: 2 },
    { t0: 0, t1: 0.5, kind: 'air', from: ARM3, to: [-39.0, BALL_R, 6.5] },
    { t0: 0.5, t1: 1.4, kind: 'roll', from: [-39.0, BALL_R, 6.5], to: [-40.4, BALL_R, 7.6], decay: 2 },
    { t0: 1.4, t1: 99, kind: 'hold', from: [-40.4, BALL_R, 7.6] },
  ]);
  const third = (t, a, ref = true) => {
    const ap = smooth(clamp((a - 0.12) / 0.3));
    // an arm up at once; then he turns to the referee, both arms out at him, shouting; when it is waved away his hands go to his head
    const turn = smooth(clamp((a - 0.28) / 0.4)), no = smooth(clamp((t - no3T - 0.3) / 0.3));
    const as = runKick(an3, a, -0.3, 'R', { u0: 0.5, dur: 0.5, e: 'focus' });
    const ap3 = blend(blend(blend(as.pose, { ...POSE.stand(), ...POSE.protest(t) }, ap * (1 - turn)), { ...POSE.stand(), ...APPEAL(t), lean: 0.1 }, turn), { ...POSE.stand(), ...DESPAIR }, no);
    const dh = Math.atan2(Math.sin(1.38 - as.head), Math.cos(1.38 - as.head));  // the short way round
    const ane = { ...as, t, head: as.head + dh * turn, pose: no > 0.5 ? { ...ap3, handsFront: true } : ap3,
      e: ap > 0.4 ? { ...(no > 0.5 ? { ...EXPR.shock, sweat: 0 } : SHOUT(t, 0.8)), look: [-0.6 * turn, 0], noBlink: true } : 'focus' };
    const ps = moving(pq3, a, { t: t + 1, e: 'focus' }), arm = smooth(clamp((a + 0.5) / 0.3)) * (1 - smooth(clamp((a - 0.25) / 0.4)));
    const piq = { ...ps, pose: blend(ps.pose, { sh: [[0.25, 1.42], [0.5, 0.5]], el: [0.08, 0.6], lean: -0.06, fingers: true }, arm), e: a > 0 ? 'worried' : 'focus' };
    const rs = moving(rf3, a, { t: t + 5, e: { ...EXPR.focus, look: [0.5, 0.1], noBlink: true } }), po = smooth(clamp((t - no3T + 0.15) / 0.25));
    return { piq, items: [P(ANELKA, ane), P(PIQUE, piq), P(TOURE, moving(ty3, a, { t: t + 2 })), ...(ref ? [P(REF, { ...rs, pose: blend(rs.pose, { ...POSE.stand(), ...PLAY_ON(t) }, po) })] : []), ballOf(ball3, a)] };
  };
  shot(a3S - 0.05, (g, lt, t) => {
    const a = aa3(t), th = third(t, a, false);
    rigFn(lt, t, tt => { const u = glide(clamp((tt - a3S) / (no3T - a3S))); return lookFrom([-42.2, 1.55, 8.9 - 0.5 * u], [-38.2, 1.22, 5.25], { fov: lerp(1700, 2050, u), cy: H * 0.45 }); }, { shake: a > 0 && a < 0.15 ? 1.6 : 0.4 });
    stadium(g, t, th.items, { cheer: 0.6, blur: 2.5 });
    const hl = clamp((a + 0.02) / 0.05) * (1 - clamp((a - 0.42) / 0.15));
    if (hl > 0) ringAt(g, ARM3, 0.3, GOLD, hl);
  }, { mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 0, "82'"); appeals(g, 2);
  } });
  cue(a3S - 0.05, 'whoosh_fast', 0.22); cue(h3F - 0.3 / R3, 'kick', 0.4); cue(h3F, 'thud', 0.55); cue(h3F + 0.08, 'crowd_gasp', 0.5);
  shot(no3T - 0.12, (g, lt, t) => {
    const a = aa3(t);
    rigFn(lt, t, tt => { const u = glide(clamp((tt - no3T + 0.12) / (goalS - no3T + 0.1))); return lookFrom([-41.2 + 0.35 * u, 1.25, 9.9 - 0.3 * u], [-37.25, 1.2, 6.9], { fov: lerp(1450, 1600, u), cy: H * 0.44 }); }, { shake: 0.5 });
    stadium(g, t, third(t, a).items, { cheer: 0.9, blur: 3 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const no = t > no3T;
    scoreBug(g, 1, 0, "82'"); appeals(g, no ? 3 : 2, { pulse: no ? 1 - clamp((t - no3T) / 0.5) : 0 });
    if (no) plate(g, 'PLAY ON', W / 2, 320, { color: RED, ink: '#FFF4E8', size: 60, ...pin(t, no3T) });
  } });
  cue(no3T - 0.12, 'whoosh_soft', 0.18); cue(no3T, 'stamp', 0.6); cue(no3T + 0.05, 'murmur', 0.6);

  // ======================= 90+3': INIESTA. Barcelona's first shot on target. Essien's clearance falls to Messi; he comes
  // along the edge of the area and lays it across; Iniesta, first time, into the top corner to Čech's left. One take
  // from behind the shot, then the run =======================
  const a4S = s('a4'), sT = w('goal', 'Iniesta.') - 0.3, pT6 = sT - 0.62, nT = sT + 0.55, oneT = w('goal', '1–1,') - 0.05, andT = w('goal', 'and') - 0.06, pepT = w('goal', 'go') - 0.35;
  const meM = new Mover([[sT - 3.4, 31.4, -13.6], [sT - 1.7, 34.8, -8.8], [pT6, 35.8, -5.0], [sT + 0.5, 36.7, -3.4, { stop: true }], [sT + 1.5, 35.6, -4.2], [sT + 2.9, 36.0, -12.4], [sT + 4.7, 40.2, -24.2], [99, 40.2, -24.2]]);
  const inM = new Mover([[sT - 3.4, 28.4, 7.6], [sT - 1.0, 32.3, 4.3], [sT, 34.05, 3.1], [sT + 0.5, 34.9, 2.6], [sT + 1.3, 37.0, -2.6], [sT + 2.6, 41.6, -13.6], [sT + 4.4, 47.2, -26.4], [sT + 5.4, 48.6, -29.4, { stop: true }], [99, 48.6, -29.4]]);
  const esM6 = new Mover([[sT - 3.4, 29.7, -15.2], [sT - 1.82, 32.8, -9.9], [pT6, 34.1, -6.2], [sT + 0.3, 34.5, -5.5, { stop: true }], [99, 34.5, -5.5]]);  // at Messi's shoulder, on the outside
  const teM6 = new Mover([[sT - 3.4, 41.0, -2.6], [sT, 39.8, -0.9, { stop: true }], [99, 39.8, -0.9]], { heading0: PI, face: () => PI });
  const axM6 = new Mover([[sT - 3.4, 41.4, 0.4], [sT - 0.5, 39.2, 1.2], [sT + 0.1, 37.0, 2.1, { stop: true }], [99, 37.0, 2.1]], { heading0: PI, face: () => PI - 0.3 });
  const etM6 = new Mover([[sT - 3.4, 43.2, 7.6], [sT, 43.6, 6.8], [sT + 0.9, 43.4, 6.4], [sT + 1.8, 41.4, 2.4], [sT + 3.1, 40.0, -8.8], [sT + 4.9, 44.6, -21.4], [99, 44.6, -21.4]], { heading0: 0 });
  const ceM6 = new Mover([[sT - 4, 51.4, -0.7], [sT, 51.3, 0.15, { stop: true }], [99, 51.3, 0.15]], { heading0: PI, face: () => PI });
  const footMe = tt => { const m = meM.at(tt); return [m.x + Math.cos(m.head) * 0.6, BALL_R, m.z + Math.sin(m.head) * 0.6]; };
  const HIT6 = [34.72, BALL_R, 2.86], N6 = [52.8, 2.2, -3.25];
  const ball6 = new BallPath([
    { t0: sT - 5, t1: pT6, kind: 'fn', fn: tt => footMe(Math.min(tt, pT6)) },
    { t0: pT6, t1: sT, kind: 'roll', from: footMe(pT6), to: HIT6, decay: 0.5 },
    { t0: sT, t1: nT, kind: 'air', from: HIT6, to: N6, g: 2.5 },
    { t0: nT, t1: nT + 0.55, kind: 'air', from: N6, to: [53.4, BALL_R, -3.0] },
    { t0: nT + 0.55, t1: 99, kind: 'hold', from: [53.4, BALL_R, -3.0] },
  ]);
  const goal = (t, { far = true } = {}) => {
    const is = runKick(inM, t, sT, 'R', { u0: 0.55, dur: 0.56 }), joy = ease.inOut(clamp((t - nT - 0.1) / 0.35));
    // away: the arms flung wide and up, rocking as he runs, the head back, the mouth wide open
    const ini = joy > 0 ? { ...is, pose: blend(is.pose, { sh: [[2.6 + 0.14 * Math.sin(t * 5.2), 1.15], [2.6 - 0.14 * Math.sin(t * 5.2), 1.15]], el: [0.35, 0.35], lean: -0.04, look: 0.3, fingers: true }, joy), e: { ...JOY, open: 0.9 } } : is;
    const ms = runKick(meM, t, pT6, 'L', { u0: 0.55, dur: 0.5 }), mj = smooth(clamp((t - nT - 0.2) / 0.4));
    const lunge = clamp((t - sT + 0.3) / 0.45), ax = moving(axM6, t, { t: t + 2, e: t > nT ? 'shock' : 'focus' });
    const items = [P(INIESTA, ini), P(MESSI, { ...ms, pose: blend(ms.pose, { ...POSE.armsUp(1), sh: [[2.6, 0.6], [2.6, 0.6]] }, mj), e: mj > 0.3 ? JOY : 'focus' }),
      P(ESSIEN, moving(esM6, t, { t: t + 1, e: t > nT ? 'sad' : 'focus' })), P(TERRY, moving(teM6, t, { t: t + 3, e: t > nT ? 'shock' : 'focus' })),
      P(ALEX, lunge > 0 && lunge < 1 ? { ...ax, pose: blend(ax.pose, POSE.kick(0.55 + 0.2 * lunge, 'R'), smooth(clamp(lunge / 0.25)) * smooth(clamp((1 - lunge) / 0.3))) } : ax),
      P(ETOO, { ...moving(etM6, t, { t: t + 6 }), e: t > nT ? JOY : 'focus' }),
      P(CECH, keeper(CECH, ceM6, t, { dive: { t0: sT + 0.1, dur: 0.5, side: 1, dz: -2.35 } })),
      ballOf(ball6, t, t > sT && t < nT ? { trail: trailOf(ball6, t, 6, 0.012) } : {})];
    return items;
  };
  // (a) Messi along the edge of the area, from in front of him
  const hudGoal = (g, t) => { const sc = t > nT;
    scoreBug(g, 1, sc ? 1 : 0, "90+3'", { hotR: sc ? 1 - clamp((t - nT) / 0.6) : 0 }); appeals(g, 3);
    const f0 = w('goal', 'first') - 0.1;
    if (!sc && t > f0) plate(g, 'BARCELONA: 0 SHOTS ON TARGET', W / 2, 320, { color: '#1B2436', ink: CREAM, size: 40, ...pin(t, f0) });
    if (sc) plate(g, "INIESTA · 90+3'", W / 2, 320, { color: BYEL, size: 54, ...pin(t, nT + 0.05) }); };
  shot(goalS - 0.05, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = meM.at(tt), u = glide(clamp((tt - goalS) / (pT6 - goalS))); return K(m.head + PI / 2 + 0.55 - 0.35 * u, 0.06, lerp(5.6, 4.7, u), [m.x + 0.2, 1.0, m.z + 0.2], { cy: H * 0.45 }); }, { shake: 0.7 });
    stadium(g, t, goal(t), { cheer: 0.5, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => hudGoal(g, t) });
  cue(goalS - 0.05, 'whoosh_fast', 0.22); cue(goalS + 0.2, 'heartbeat', 0.5);
  // (b) from behind Iniesta: the ball comes across, he hits it, and the lens goes with it to the top corner
  const E6 = [29.9, 1.55, 7.7];
  const cam6 = tt => { const b = ball6.at(Math.min(tt, nT)).pos, i = inM.at(Math.min(tt, sT)), v2 = ease.inOut(clamp((tt - sT - 0.03) / 0.42));
    const T1 = [i.x + 1.6, 1.15, lerp(i.z, b[2], 0.12) + 0.9], T2 = mix3(T1, [52.2, 1.7, lerp(b[2], -2.4, 0.7)], v2);
    return lookFrom(E6, T2, { fov: lerp(1350, 3100, v2), cy: H * lerp(0.47, 0.45, v2) }); };
  shot(pT6 - 0.05, (g, lt, t) => {
    const on = clamp(t - nT, 0, 1);
    rigFn(lt, t, cam6, { shake: 0.5 + 2.6 * on * (1 - on) });
    stadium(g, t, goal(t), { cheer: 0.5, blur: 2.5, hit: { t0: nT, y: N6[1], z: N6[2], k: 1.4 } });
  }, { mbStep: 3, mbMax: 24, qaAllow: ['face cut by frame'], hud: (g, lt, t) => hudGoal(g, t) });
  cue(pT6 - 0.02, 'touch', 0.4); cue(sT - 0.02, 'kick', 0.9); cue(nT - 0.02, 'net', 0.9); cue(nT, 'boom_cine', 0.5); cue(nT + 0.06, 'crowd_gasp', 0.7); cue(nT + 0.35, 'crowd_roar', 0.25);
  // (c) he is away, his arms out, and nobody can catch him
  const runT = nT + 0.55;
  shot(runT, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = inM.at(tt), u = glide(clamp((tt - runT) / (pepT - runT))); return K(m.head + PI / 2 + 0.3 - 0.25 * u, 0.06, lerp(5.2, 4.2, u), [m.x, 1.08, m.z], { cy: H * 0.45 }); }, { shake: 1.0 });
    stadium(g, t, goal(t), { cheer: 0.35, blur: 2.5 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, "90+3'"); appeals(g, 3);
    if (t > andT) { plate(g, '1–1 ON AGGREGATE', W / 2, 300, { color: CREAM, size: 44, ...pin(t, andT) }); plate(g, 'BARCELONA THROUGH ON AWAY GOALS', W / 2, 400, { color: BYEL, size: 40, ...pin(t, andT + 0.35) }); }
  } });
  cue(runT, 'whoosh_fast', 0.2);
  // (d) and on the touchline their coach is running too
  const PEPZ = -35.7;
  const ppM = new Mover([[pepT - 0.8, 5.5, PEPZ], [pepT + 1.2, 15.6, PEPZ - 0.1], [pepT + 2.9, 25.5, PEPZ], [99, 26, PEPZ]]);
  shot(pepT, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = ppM.at(tt), u = glide(clamp((tt - pepT) / (a4S - pepT))); return K(2.02 - 0.2 * u, 0.05, lerp(4.6, 3.9, u), [m.x + 0.3, 1.2, PEPZ + 0.1], { cy: H * 0.45 }); }, { shake: 1.2 });
    const ps = moving(ppM, t, { t, e: JOY, I: 0.95 });
    const follow = (pl, dx, dz, ph) => { const m = ppM.at(t - 0.25 - ph * 0.12); return P(pl, { x: m.x - dx, z: PEPZ + dz, head: m.head, pose: blend(POSE.run(m.phase + ph * 2.1, 0.9, 0), { ...POSE.armsUp(1), sh: [[2.5, 0.6], [2.5, 0.6]] }, 0.55), e: JOY, t: t + ph }); };
    touchline(g, t, [P(PEP, { ...ps, pose: blend(ps.pose, { sh: [[1.9, 0.5], [1.9, 0.5]], el: [1.5, 1.5], lean: 0.1 }, 0.6) }), follow(SUBS_B[0], 2.6, -0.7, 1), follow(SUBS_B[1], 4.1, 0.5, 2), follow(STAFF_B[0], 5.6, -0.4, 3)],
      { cheer: 0.3, blur: 3, parts: [...dugout(t, { x0: 5.2, x1: 14.8, seat: '#22408E', seatD: '#15286A' }), ...dugout(t, { x0: 17.5, x1: 27.1, seat: '#22408E', seatD: '#15286A' })] });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, "90+3'"); appeals(g, 3);
    plate(g, '1–1 ON AGGREGATE', W / 2, 300, { color: CREAM, size: 44 }); plate(g, 'BARCELONA THROUGH ON AWAY GOALS', W / 2, 400, { color: BYEL, size: 40, ...pin(t, andT + 0.35) });
  } });
  cue(pepT, 'whoosh_soft', 0.2);

  // ======================= APPEAL FOUR, in what time is left: a corner, the ball drops to Ballack on the edge of the area,
  // and his shot strikes Eto'o's raised arm. Slowed. Then Ballack and the referee, all the way up the pitch =======================
  const drogbaS = s('drogba'), b4F = w('a4', 'hits') - 0.1, no4T = w('a4', 'Nothing.') - 0.08, fourT = w('a4', 'Four') - 0.08, noPenT = w('a4', 'No') - 0.08, R4 = 0.6;
  const aa4 = t => (t - b4F) * R4;  // the clock of the action: 0 as he strikes it
  const ba4 = new Mover([[-1.5, -30.6, -3.4], [0, -34.5, -1.75], [0.4, -35.2, -1.55, { stop: true }], [99, -35.2, -1.55]]);
  const et4 = new Mover([[-1.5, -39.0, 0.5], [-0.1, -37.9, -1.4], [0.3, -37.8, -1.5, { stop: true }], [99, -37.8, -1.5]], { heading0: 0, face: a => (a > -0.22 ? 2.3 : 0.1), turn: 10 });
  const va4 = new Mover([[-3, -51.4, 0.4], [0.2, -51.2, -0.4, { stop: true }], [99, -51.2, -0.4]], { heading0: 0, face: () => 0 });
  // Eto'o turns his back to the shot, the arm on that side out from his body: that is where it hits him
  const etoAt = a => { const es = moving(et4, a, { e: 'worried' }), arm = smooth(clamp((a + 0.3) / 0.22)) * (1 - 0.7 * smooth(clamp((a - 0.4) / 0.5)));
    return { ...es, pose: blend(es.pose, { sh: [[0.9, 0.3], [1.6, 1.3]], el: [1.4, 0.3], lean: 0.14, fingers: true }, arm) }; };
  const HIT4 = [-35.2, 0.46, -1.6], ARM4 = (() => { const A = skeleton(ETOO, etoAt(0.095)).arms[1], q = mix3(A.sh, A.elbow, 0.85); return [q[0] + 0.11, q[1] + 0.02, q[2] - 0.02]; })();
  const ball4 = new BallPath([
    { t0: -1.3, t1: 0, kind: 'air', from: [-40.6, 2.2, 1.6], to: HIT4, g: 5 },
    { t0: 0, t1: 0.095, kind: 'air', from: HIT4, to: ARM4, g: 0 },
    { t0: 0.095, t1: 0.6, kind: 'air', from: ARM4, to: [-36.6, BALL_R, -2.9] },
    { t0: 0.6, t1: 99, kind: 'hold', from: [-36.6, BALL_R, -2.9] },
  ]);
  const fourth = (t, a) => {
    const ap = smooth(clamp((a - 0.14) / 0.25));
    const bs = runKick(ba4, a, 0, 'R', { u0: 0.6, dur: 0.56 }), bal = { ...bs, t, pose: blend(bs.pose, { ...POSE.stand(), ...POSE.protest(t) }, ap), e: ap > 0.3 ? SHOUT(t, 0.9) : 'focus' };
    const eto = { ...etoAt(a), t: t + 1 };
    const still = (pl, x, z, hd, ph, pose = POSE.stand(), e = 'focus') => P(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph });
    return [P(BALLACK, bal), P(ETOO, eto), P(VALDES, keeper(VALDES, va4, a, { face: 0 })),
      still(TERRY, -41.7, -1.4, 0.5, 3, a > 0.2 ? APPEAL(t) : POSE.stand(), a > 0.2 ? SHOUT(t, 0.5) : 'focus'),
      ballOf(ball4, a, a > 0 && a < 0.095 ? { trail: trailOf(ball4, a, 5, 0.012) } : {})];
  };
  shot(a4S - 0.05, (g, lt, t) => {
    const a = aa4(t);
    rigFn(lt, t, tt => { const u = glide(clamp((tt - a4S) / (no4T - a4S))); return lookFrom([-31.0 - 0.5 * u, 1.5, -4.9 + 0.3 * u], [-37.3, 1.3, -1.15], { fov: lerp(1450, 1800, u), cy: H * 0.45 }); }, { shake: a > 0.09 && a < 0.25 ? 1.8 : 0.5 });
    stadium(g, t, fourth(t, a), { cheer: 0.7, blur: 2.5 });
    const hl = clamp((a - 0.08) / 0.04) * (1 - clamp((a - 0.5) / 0.15));
    if (hl > 0) ringAt(g, ARM4, 0.3, GOLD, hl);
  }, { mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, "90+5'"); appeals(g, 3);
  } });
  cue(a4S - 0.05, 'whoosh_fast', 0.22); cue(b4F - 0.02, 'kick', 0.85); cue(b4F + 0.095 / R4, 'thud', 0.6); cue(b4F + 0.2, 'crowd_gasp', 0.6);
  const rfM4 = new Mover([[no4T - 0.4, -31.2, -6.4], [no4T + 0.5, -27.0, -6.9], [no4T + 1.9, -18.6, -7.9], [no4T + 3.6, -8.8, -8.5], [99, -8, -8.5]]);
  shot(no4T - 0.12, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = rfM4.at(tt), u = glide(clamp((tt - no4T + 0.12) / (drogbaS - no4T))); return K(2.15 - 0.2 * u, 0.05, lerp(4.8, 4.0, u), [m.x + 0.1, 1.0, m.z + 0.45], { cy: H * 0.432 }); }, { shake: 1.2 });
    const m = rfM4.at(t), rs = moving(rfM4, t, { t: t + 5, e: 'focus', I: 0.7 }), po = smooth(clamp((t - no4T + 0.15) / 0.25)) * (1 - smooth(clamp((t - no4T - 0.9) / 0.5)));
    const lag = rfM4.at(t - 0.07), bx = lag.x - 0.3 * Math.cos(m.head) - 0.85 * Math.sin(m.head), bz = lag.z - 0.3 * Math.sin(m.head) + 0.85 * Math.cos(m.head);
    const bal = { x: bx, z: bz, head: m.head - 0.5, pose: blend(POSE.run(m.phase + 1.4, 0.85, 0), { sh: [[1.3 + 0.3 * Math.sin(t * 9), 0.8], [2.3, 0.5]], el: [0.9, 0.5], lean: 0.2, fingers: true }, 0.75), e: SHOUT(t, 1), t };
    stadium(g, t, [P(REF, { ...rs, e: { ...EXPR.focus, noBlink: true }, pose: blend(rs.pose, { ...POSE.stand(), ...PLAY_ON(t) }, po) }), P(BALLACK, bal)], { cheer: 1, blur: 3 });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    const no = t > no4T;
    scoreBug(g, 1, 1, "90+5'"); appeals(g, no ? 4 : 3, { pulse: no ? 1 - clamp((t - no4T) / 0.5) : 0 });
    if (no && t < fourT) plate(g, 'PLAY ON', W / 2, 320, { color: RED, ink: '#FFF4E8', size: 60, ...pin(t, no4T) });
    if (t > fourT) plate(g, '4 APPEALS', W / 2, 300, { color: CREAM, size: 64, ...pin(t, fourT) });
    if (t > noPenT) plate(g, '0 PENALTIES', W / 2, 420, { color: RED, ink: '#FFF4E8', size: 64, ...pin(t, noPenT) });
  } });
  cue(no4T - 0.12, 'whoosh_soft', 0.18); cue(no4T, 'stamp', 0.6); cue(no4T + 0.1, 'murmur', 0.7); cue(fourT, 'stamp', 0.5); cue(noPenT, 'boom_move', 0.5); cue(noPenT, 'stamp', 0.6);

  // ======================= FULL TIME. Drogba, taken off after 72 minutes, comes back on to the pitch in flip-flops =======================
  const afterS = s('after'), dT = w('drogba', 'Drogba,') - 0.1, marchT = w('drogba', 'marches') - 0.1, findsT = w('drogba', 'finds') - 0.12;
  shot(drogbaS - 0.1, (g, lt, t) => {
    const u = glide(clamp(lt / (dT - drogbaS + 0.1)));
    rig(B, lt, [[0, K(0.32 - 0.12 * u, 0.04, lerp(4.4, 3.5, u), [0.4, 1.5, -4.0], { cy: H * 0.46 })]], { t, e: lin, shake: 0.4 });
    const blow = 1 - smooth(clamp((t - drogbaS - 1.0) / 0.4));
    const still = (pl, x, z, hd, ph, pose, e = 'sad') => P(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph });
    const hop = (pl, x, z, ph) => P(pl, { x, z, head: -PI / 2, pose: { ...POSE.stand(), ...POSE.armsUp(1), lift: 0.14 * Math.abs(Math.sin(t * 6.5 + ph)) }, e: JOY, t: t + ph });
    stadium(g, t, [P(REF, { x: 0.4, z: -4.0, head: -PI / 2 + 0.1, pose: blend({ ...POSE.stand(), sh: [[2.9, 0.25], [0.1, 0.12]], el: [0.08, 0.3] }, { ...POSE.stand(), sh: [[2.9, 0.25], [1.9, 0.0]], el: [0.08, 1.95], fore: [0.25, -0.83] }, blow), e: { ...EXPR.focus, noBlink: true }, t, ...(blow > 0.5 ? { prop: whistleProp() } : {}) }),
      still(TERRY, 4.6, 0.6, -2.2, 1, DESPAIR, 'shock'), P(LAMPARD, onGrass(LAMPARD, { x: -3.8, z: 2.2, head: -0.35, pose: { ...SIT_GROUND, look: -0.5 + 0.05 * Math.sin(t * 1.1) }, e: 'sad', t: t + 2, shadow: { r: 0.6, rz: 0.34 } }, true)),
      hop(XAVI, 9.5, 9.5, 0), hop(PIQUE, 11.2, 8.4, 1.3), hop(KEITA, 8.2, 11.2, 2.2)], { cheer: 0.5, blur: 3 });
  }, { qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, 'FT'); appeals(g, 4);
    plate(g, 'FULL TIME', W / 2, 300, { color: CREAM, size: 56, ...pin(t, drogbaS + 0.05) });
    plate(g, 'BARCELONA GO TO THE FINAL', W / 2, 405, { color: BYEL, size: 40, ...pin(t, drogbaS + 0.4) });
  } });
  cue(drogbaS - 0.1, 'whoosh_soft', 0.2); cue(drogbaS + 0.05, 'whistle', 0.6); cue(drogbaS + 0.45, 'whistle', 0.6); cue(drogbaS + 0.85, 'whistle', 0.7);
  // he gets up from the bench
  const dM8 = new Mover([[dT - 0.6, -9.6, -37.6], [dT + 0.5, -8.6, -36.6], [marchT, -6.6, -34.5], [marchT + 1.3, -4.9, -31.6], [findsT, -3.6, -29.4], [99, -3.6, -29.4]]);
  const stM8 = new Mover([[dT - 0.6, -11.4, -37.9], [dT + 0.9, -10.2, -37.2], [marchT, -8.3, -35.6], [marchT + 1.3, -6.5, -32.9], [findsT, -5.1, -30.6], [99, -5.1, -30.6]]);
  const homeBench = t => dugout(t, { x0: -14.8, x1: -5.2, sit: [[SUBS_C[0], -14.1], [SUBS_C[1], -12.7]] });
  const hiM8 = new Mover([[dT - 0.6, -7.9, -37.5], [dT + 0.2, -7.9, -37.5, { stop: true }], [marchT, -5.2, -35.9, { stop: true }], [99, -5.2, -35.9]], { heading0: 2.7, face: (tt, q) => { const d = dM8.at(tt); return Math.atan2(d.z - q.z, d.x - q.x); }, turn: 6 });
  const march = (t, coach = true) => { const ds = moving(dM8, t, { t, e: SHOUT(t, 0.6), I: 0.5 }), ss = moving(stM8, t, { t: t + 2, e: 'worried', I: 0.5 }), hs = moving(hiM8, t, { t: t + 4, e: 'worried', I: 0.4 });
    return [P(DROGBA_END, { ...ds, pose: blend(ds.pose, { sh: [[0.5, 0.35], [1.25 + 0.2 * Math.sin(t * 7), 0.2]], el: [0.9, 0.35], lean: 0.12 }, 0.7) }),
      P(STEWARDS[0], { ...ss, pose: blend(ss.pose, { sh: [[0.2, 0.2], [1.2, 0.3]], el: [0.4, 0.4] }, 0.7) }),
      ...(coach ? [P(HIDDINK, { ...hs, pose: blend(hs.pose, { sh: [[1.2, 0.35], [1.1, 0.3]], el: [0.4, 0.5], fingers: true, lean: 0.06 }, 0.75) })] : [])]; };
  shot(dT, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = dM8.at(tt), u = glide(clamp((tt - dT) / (marchT - dT))); return K(PI - 0.5 + 0.3 * u, 0.05, lerp(4.8, 3.9, u), [m.x + 0.2, 1.2, m.z], { cy: H * 0.45 }); }, { shake: 0.8 });
    touchline(g, t, march(t), { cheer: 0.8, blur: 3, parts: homeBench(t) });
  }, { mbStep: 3, mbMax: 16, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, 'FT'); appeals(g, 4);
    nameTitle(g, lt, 'Didier Drogba', "SUBSTITUTED · 72'", { y: 300, t0: 0.1 });
  } });
  cue(dT, 'whoosh_soft', 0.2);
  // on to the pitch, in flip-flops: from his feet up to his face
  shot(marchT, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = dM8.at(tt), u = ease.inOut(clamp((tt - marchT - 1.15) / 0.8)); return K(m.head + PI / 2 + 0.5 - 0.25 * u, lerp(0.02, 0.05, u), lerp(1.75, 3.1, u), [m.x, lerp(0.2, 1.42, u), m.z], { cy: H * lerp(0.52, 0.45, u) }); }, { shake: 0.9 });
    touchline(g, t, march(t, false), { cheer: 0.9, blur: 3.5, parts: homeBench(t) });
  }, { mbStep: 3, mbMax: 20, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    scoreBug(g, 1, 1, 'FT'); appeals(g, 4);
    const fT2 = w('drogba', 'flip-flops,') - 0.15; if (t > fT2) plate(g, 'IN FLIP-FLOPS', W / 2, 320, { color: GOLD, size: 54, ...pin(t, fT2) });
  } });
  cue(marchT, 'whoosh_fast', 0.2); for (let i = 0; i < 5; i++) cue(marchT + 0.2 + i * 0.42, 'touch', 0.3);
  // and a television camera. From beside it: he walks straight up to the lens, the stewards a step behind
  const endS = s('end'), refAfT = w('after', 'referee') - 0.3, hotelsT = w('after', 'hotels') - 0.1, deathT = w('after', 'death') - 0.1;
  const povT = findsT + 0.62, banT = w('after', 'three-match') - 0.25;
  const dM9 = new Mover([[findsT - 0.25, DR[0] - 1.25, DR[1] - 0.95], [povT - 0.1, DR[0], DR[1], { stop: true }], [99, DR[0], DR[1]]], { face: tt => (tt > povT - 0.35 ? PI / 2 : null), turn: 7 });
  const crewAt = { x: DR[0] + 0.12, z: DR[1] + 1.2, head: -PI / 2 };
  const arrive = t => { const k = smooth(clamp((t - povT + 0.42) / 0.32)), ds = moving(dM9, t, { t, e: SHOUT(t, 0.8), I: 0.6 }), dc = drogbaCam(itsT - 0.1, t);
    const chase = (pl, dx, dz, ph) => { const m = dM9.at(t - 0.3 - 0.06 * ph); return P(pl, { x: m.x + dx, z: m.z + dz, head: m.head, pose: blend(POSE.run(m.phase + ph * 1.9, 0.6, 0), { sh: [[1.2, 0.35], [1.2, 0.35]], el: [0.5, 0.5] }, 0.6), e: 'worried', t: t + ph }); };
    return [P(DROGBA_END, { ...ds, pose: blend(blend(ds.pose, { sh: [[0.5, 0.35], [1.3, 0.2]], el: [0.9, 0.35], lean: 0.12 }, 0.7 * (1 - k)), dc.pose, k) }),
      chase(STEWARDS[0], -0.75, -0.55, 0), chase(STEWARDS[1], 0.35, -0.95, 1.7),
      P(CREW, { ...crewAt, pose: { ...POSE.stand(), sh: [[0.6, 0.3], [1.5, 0.45]], el: [1.2, 1.7], lean: 0.04 - 0.1 * k }, e: 'worried', t: t + 7, prop: tvCamProp() })]; };
  shot(findsT, (g, lt, t) => {
    rigFn(lt, t, tt => { const u = ease.out(clamp((tt - findsT) / (povT - findsT))); return lookFrom([DR[0] - 3.1 + 0.6 * u, 1.5, DR[1] + 1.9 + 0.2 * u], [DR[0] - 0.05, 1.45, DR[1] + 0.5], { fov: lerp(1250, 1500, u), cy: H * 0.46 }); }, { shake: 1.6 });
    touchline(g, t, arrive(t), { cheer: 0.9, blur: 4 });
  }, { mbStep: 3, mbMax: 16, qaAllow: ['face cut by frame', 'player hidden', 'face behind player'], hud: (g, lt, t) => { scoreBug(g, 1, 1, 'FT'); appeals(g, 4); } });
  cue(findsT, 'whoosh_fast', 0.25);
  // through the lens again: the opening, where it belongs
  const aCam = tt => itsT - 0.08 + (tt - povT);
  shot(povT, (g, lt, t) => hookDraw(g, lt, t, aCam), { grade: TV_G, mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame', 'player hidden', 'face behind player'], hud: (g, lt, t) => {
    liveMark(g, t);
    title2(g, 'IT’S A', 'DISGRACE', 285, { a: clamp((t - povT - 0.06) / 0.1), k: 1 + 0.12 * Math.exp(-Math.max(0, t - povT - 0.06) * 6) });
  } });
  cue(povT, 'boom_cine', 0.5); cue(povT + 0.05, 'crowd_gasp', 0.4);

  // ======================= AFTERWARDS: the ban; the referee out of the ground between two policemen =======================
  shot(banT, (g, lt, t) => {
    // the stewards have him by the arms and walk him backwards off the pitch: through the doorway under the stand and on
    // down the corridor, out of the floodlights, still at it. The camera backs away, and the doorway closes round the
    // three of them. (He used to be walked up to a canopy and stop there: he did not look as if he was leaving the pitch)
    const L = refAfT - banT, k = clamp(lt / L), a = aCam(t), back = 1.85 + 3.0 * k, zD = DR[1] - back;
    rigFn(lt, t, tt => { const u = clamp((tt - banT) / L); return lookFrom([DR[0] + 0.15, 1.6, DR[1] + 1.35 + 0.9 * u], [DR[0], 1.4 - 0.1 * u, DR[1] - 1.85 - 3.0 * u], { fov: lerp(1400, 1320, u), cy: H * 0.45 }); }, { shake: 0.9 });
    const legs = ph => { const r = POSE.run(-back * 3.4 + ph, 0.42, 0); return { hip: r.hip, knee: r.knee }; };
    const dim = z => 0.52 * smooth(clamp((TZ + 0.2 - z) / 2.2));  // how far out of the light a man at z is
    const d = drogbaCam(a, t), pull = (pl, dx, ph, right) => shaded(P(pl, { x: DR[0] + dx, z: zD - 0.15, head: PI / 2 + (right ? 0.9 : -0.9), pose: { ...POSE.stand(), ...legs(ph + 1), sh: right ? [[1.2, 0.5], [0.3, 0.2]] : [[0.3, 0.2], [1.2, 0.5]], el: [0.6, 0.6], lean: -0.1 }, e: 'worried', t: t + ph }), dim(zD - 0.15));
    touchline(g, t, [shaded(P(DROGBA_END, { ...d, z: zD, pose: { ...d.pose, ...legs(0), sh: [[1.2, 0.9], [1.35 + 0.1 * Math.sin(t * 9), 0.3]], el: [0.5, 1.45], fore: [0.9, 0.2], point: [false, 'mid'], fingers: false, lean: -0.12 } }), dim(zD)), pull(STEWARDS[0], -0.66, 0, false), pull(STEWARDS[1], 0.68, 1.7, true)], { cheer: 0.8, blur: 4 });
  }, { mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame', 'player hidden', 'face behind player'], hud: (g, lt, t) => {
    const bT = w('after', 'three-match') - 0.1;
    if (t > bT) counter(g, '3', 'MATCH BAN · UEFA', { y: 420, size: 200, color: GOLD, at: [t, bT] });
  } });
  cue(banT, 'whoosh_soft', 0.2); cue(w('after', 'three-match') - 0.1, 'stamp', 0.6);
  const CX = 300, CZ = 300;
  const walkM = new Mover([[refAfT - 0.5, CX + 9.5, CZ], [endS + 0.5, CX - 1.5, CZ], [99, CX - 2, CZ]]);
  shot(refAfT, (g, lt, t) => {
    const m = walkM.at(t);
    rigFn(lt, t, tt => { const mm = walkM.at(tt), v = glide(clamp((tt - refAfT) / (endS - refAfT))); return K(-PI / 2 + 0.08 - 0.16 * v, 0.03, lerp(4.4, 3.4, v), [mm.x, 1.5, CZ], { cy: H * 0.46 }); }, { shake: 0.6 });
    bgx.setTransform(1, 0, 0, 1, 0, 0); corridor(bgx, t, CX, CZ); g.save(); g.filter = 'blur(2.5px)'; g.drawImage(BG, 0, 0); g.restore();
    const walk = (pl, dx, dz, ph, e) => { const mm = walkM.at(t - 0.02 * ph); return P(pl, { x: mm.x + dx, z: CZ + dz, head: PI, pose: POSE.run(mm.phase + ph, 0.36, 0), e, t: t + ph }); };
    const items = [P(REF, { x: m.x, z: CZ, head: PI, pose: { ...POSE.run(m.phase, 0.34, 0), lean: 0.06, look: 0.5 }, e: { ...EXPR.sad, look: [0.2 * Math.sin(t * 0.9), 0.5] }, t }), walk(POLICE[0], 0.75, -0.85, 1.6, 'focus'), walk(POLICE[1], 0.9, 0.85, 3.1, 'focus')];
    for (const it of items) it.shadow?.(g);
    drawSorted(g, items);
  }, { grade: ROOM_G, mbStep: 3, mbMax: 12, qaAllow: ['face cut by frame'], hud: (g, lt, t) => {
    if (t > hotelsT) plate(g, 'THAT NIGHT: A DIFFERENT HOTEL', W / 2, 300, { color: CREAM, size: 40, ...pin(t, hotelsT) });
    if (t > deathT) plate(g, 'DEATH THREATS, FOR YEARS', W / 2, 400, { color: RED, ink: '#FFF4E8', size: 44, ...pin(t, deathT) });
  } });
  cue(refAfT, 'whoosh_deep', 0.3); cue(hotelsT, 'stamp', 0.4); cue(deathT, 'boom_cine', 0.4);

  // ======================= NINE YEARS LATER =======================
  const saidT = w('end', 'It') - 0.1, IX = 420, IZ = 300;
  shot(endS - 0.08, (g, lt, t) => {
    const L = T.duration - endS, u = glide(clamp(lt / L));
    rig(B, lt, [[0, K(PI + 0.2 - 0.28 * u, 0.02, lerp(2.2, 1.78, u), [IX, 1.6, IZ], { cy: H * 0.44 })]], { t, e: lin, shake: 0.25 });
    bgx.setTransform(1, 0, 0, 1, 0, 0); roomSet(bgx, t, IX, IZ); g.save(); g.filter = 'blur(5px)'; g.drawImage(BG, 0, 0); g.restore();
    const k = ease.inOut(clamp((t - saidT + 0.2) / 0.5)), talk = t > saidT && t < w('end', 'day.') + 0.5;
    const items = [P(REF_18, { x: IX, z: IZ, head: PI / 2 + 0.05 * Math.sin(t * 1.3), pose: blend({ ...POSE.stand(), sh: [[0.05, 0.1], [0.05, 0.1]], el: [0.3, 0.3] }, { sh: [[0.2, 0.3], [0.2, 0.3]], el: [1.6, 1.6], fore: [0.32, 0.32], fingers: true, lean: -0.02 }, k * 0.8), e: { ...EXPR.sad, brow: -0.5, lid: 0.2, curve: -0.15, mouth: talk ? 'o' : 'line', open: talk ? 0.2 + 0.25 * Math.abs(Math.sin(t * 8.5)) : 0, look: [0.15 * Math.sin(t * 0.8), talk ? 0 : 0.35] }, t }), micItem(IX - 0.17, 1.47, IZ + 0.36)];
    for (const it of items) it.shadow?.(g);
    drawSorted(g, items);
  }, { grade: ROOM_G, trans: 'fade', transDur: 0.3, qaAllow: ['face cut by frame'],
    hud: (g, lt, t) => {
    const a = 1;
    plate(g, 'NINE YEARS LATER · 2018', W / 2, 230, { color: CREAM, size: 38, ...pin(t, endS + 0.15, a) });
    if (t > saidT) plate(g, '“IT WAS NOT MY BEST DAY.”', W / 2, 345, { color: GOLD, size: 56, ...pin(t, saidT, a) });
    if (t > saidT + 0.5) plate(g, 'TOM HENNING ØVREBØ', W / 2, 450, { color: '#1B2436', ink: CREAM, size: 32, ...pin(t, saidT + 0.5, a) });
  } });
  cue(endS - 0.08, 'whoosh_deep', 0.3); cue(endS + 0.1, 'camera', 0.3); cue(saidT, 'boom_cine', 0.3);
  // the picture is squeezed to a line and a dot: the set is switched off. A second before the end, not the usual 0.55 s: the
  // sound of it lasts a second, and the film must not stop in the middle of it
  const tvOff = T.duration - 1.05;
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowd under it all: a full house for ninety minutes, struck dumb by the goal, furious at the end
  amb.push({ id: 'crowd_bed', t0: 0, t1: ctxS, gain: 1.0, fi: 0.02, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: ctxS - 0.05, t1: afterS + 1.6, gain: 0.7, fi: 0.2, fo: 0.5, keys: [[ctxS, 0.6], [netE, 0.7], [netE + 0.2, 1.3], [a1S, 0.8], [cT + 0.3, 1.0], [outT + 0.2, 1.15], [no2T + 0.2, 1.2], [redS, 0.8], [cardT + 0.2, 1.1], [no3T + 0.2, 1.25], [goalS, 0.9], [sT - 0.4, 0.55], [nT + 0.1, 0.4], [pepT, 0.45], [a4S, 0.9], [no4T + 0.2, 1.35], [drogbaS + 1, 1.1], [findsT, 1.3]] });
  amb.push({ id: 'crowd_bed', t0: afterS + 1.4, t1: endS, gain: 0.16, fi: 0.3, fo: 0.4 });

  const music = [
    { t: 0, m: 'hook' }, { t: whyT, m: 'clockwork' }, { t: ctxS - 0.05, m: 'stands' }, { t: afterT, m: 'stands_hot' }, { t: a1S - 0.05, m: 'tension' }, { t: redS - 0.05, m: 'court' },
    { t: a3S - 0.05, m: 'paranoia' }, { t: goalS - 0.05, m: 'build' }, { t: sT - 0.35, m: 'void' }, { t: nT, m: 'slam' }, { t: runT, m: 'coldwar' }, { t: a4S - 0.05, m: 'inferno' },
    { t: drogbaS - 0.1, m: 'tension' }, { t: marchT, m: 'stands_hot' }, { t: povT, m: 'hit' }, { t: banT, m: 'exile' }, { t: endS - 0.08, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
