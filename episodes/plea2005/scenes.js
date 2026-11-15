// "The player who once stopped a war". Didier Drogba and Ivory Coast, 2005–2007.
// 8 October 2005, Omdurman: Sudan 1–3 Ivory Coast; in Yaoundé Cameroon are held 1–1 by Egypt after Womé hits the post with
// a penalty in injury time, and Ivory Coast go to their first World Cup. In the dressing room, in front of a camera of
// Ivorian television, Drogba takes the microphone, the squad goes down on its knees, and he asks both sides of a country
// cut in two since 2002 to lay down their weapons. March 2007: a peace agreement in Ouagadougou. 3 June 2007: at his
// asking the national team plays in Bouaké, the rebels' capital; soldiers of both sides in the ground; 5–0 against
// Madagascar, Drogba the fifth. Facts, what is drawn and what is not known: SOURCES.md.
// The opening (0–9 s) is cut to stand on its own: "a war" only, no name until its last words. "A civil war" comes in
// the middle of the film, with the map.
// Two pictures supplied by the author are used as they are: the television frame of the plea (on a television set) and
// the photograph of Drogba among soldiers in Bouaké (on the front page that ends the film).
import { W, H, C, clamp, lerp, ease, smooth, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { CAST, EXPR } from '../../engine/js/characters.js';
import { plate, counter, nameTitle, placeStamp, stamp, enter, sans } from '../../engine/js/hud.js';
import { rig } from '../../engine/js/stage.js';
import { useLookV2, useMark } from '../../engine/js/look.js';
import { box } from '../../engine/js/env.js';
import { Stadium, sky, pitch, goalItems, boardItems, boardDesign, playerItems, ballItem, groundShadow,
  drawSorted, POSE, blend, Mover, BallPath, BALL_R, skeleton, figureK, v3 } from '../../engine/js/football.js';
import { loadImage } from '../../engine/js/photo.js';

useLookV2();
useMark(null);
const CHANNEL = null;  // no handle: no FOLLOW plate
const B = new Board();
const PI = Math.PI, FPS = 30;
const GOLD = '#E8C35A', CREAM = C.cream, NAVY = '#1B2436', LIME = '#9CCB4A', RED = '#D8453A', BLACK = '#15161A', ORANGE = '#F07A1C', IGREEN = '#1E8F52', WHITE = '#F4F2EC';
// the two pictures the author supplied (photos/, sources in SOURCES.md)
const IMG = { plea: await loadImage('../episodes/plea2005/photos/plea2005.jpg'), bouake: await loadImage('../episodes/plea2005/photos/bouake2007.jpg') };
// the neighbours on the map: outlines from the engine's world atlas (Liberia, Guinea, Mali, Burkina Faso, Ghana)
const NEIGH = await (async () => { try { const world = await fetch('../engine/data/countries-110m.json').then(r => r.json());
  return topojson.feature(world, world.objects.countries).features.filter(f => ['430', '324', '466', '854', '288'].includes(String(f.id))).map(f => (f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0])); } catch (e) { console.error('map: no atlas', e); return []; } })();
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
// grades: a floodlit night, the overcast afternoon in Bouaké, the evening in Omdurman, the dressing room, the picture of a
// television camera, a map, print
const NIGHT_G = { con: 1.07, sat: 1.04, bri: 1.02, tone: ['#DCE8FF', 0.06], lift: ['#0E1630', 0.12], bloom: 0.3 };
const DAY_G = { con: 1.05, sat: 1.06, bri: 1.03, tone: ['#FFF2DC', 0.05], lift: ['#1A2444', 0.05], bloom: 0.2 };
const DUSK_G = { con: 1.05, sat: 1.05, bri: 1.03, tone: ['#FFD9B0', 0.1], lift: ['#1A2444', 0.08], bloom: 0.22 };
const ROOM_G = { con: 1.06, sat: 1.0, bri: 1.02, tone: ['#FFD9A0', 0.1], lift: ['#161008', 0.08], bloom: 0.26 };
const TV_G = { con: 1.12, sat: 1.08, bri: 1.03, tone: ['#E6EEFF', 0.06], lift: ['#0A1024', 0.1], bloom: 0.34 };
const MAP_G = { con: 1.06, sat: 1.0, bri: 1.0, tone: ['#FFE6C0', 0.05], lift: ['#0C1220', 0.1], bloom: 0.22 };

// ---------- kits (drawn, not the exact designs) and the cast: cartoons, not likenesses
const SKIN_T = { base: '#E2B48E', shade: '#CDA07A', deep: '#A87850', blush: '#D08A72', hi: '#F0CDA8' };
const SKIN_M = { base: '#B98058', shade: '#A06C46', deep: '#7A4C2E', blush: '#A8664C', hi: '#CF9A70' };
const SKIN_D = { base: '#8A5A3A', shade: '#74482C', deep: '#56331E', blush: '#7C4832', hi: '#A8744E' };
// Ivory Coast: in white in Omdurman (the shirts of the dressing-room pictures), in orange at home in Bouaké. The shorts a
// shade off the shirt where they would be the same colour (STYLE_BIBLE rule 64)
const CIV_W = { shirt: '#F1EFE8', shirtD: '#D9D5CA', trim: IGREEN, num: '#1E2A22', numEdge: null, shorts: '#DCD8CE', socks: '#F1EFE8', band: ORANGE, boots: '#1A1B1F', badge: ORANGE };
const CIV_O = { shirt: ORANGE, shirtD: '#C85E10', trim: WHITE, num: WHITE, numEdge: '#B4520C', shorts: WHITE, socks: IGREEN, band: WHITE, boots: '#1A1B1F', badge: WHITE };
const CMR = { shirt: '#1F8A4C', shirtD: '#156A38', trim: '#F2D21E', num: '#F2D21E', numEdge: null, shorts: '#C8202C', socks: '#F2D21E', band: '#1F8A4C', boots: '#1A1B1F', badge: '#F2D21E' };
const MAD = { shirt: '#C8202C', shirtD: '#9E1620', trim: WHITE, num: WHITE, numEdge: null, shorts: '#1F7A45', socks: '#C8202C', band: WHITE, boots: '#1A1B1F', badge: WHITE };
const GK_DARK = { shirt: '#2A2D34', shirtD: '#1C1E24', trim: '#8A8F98', num: '#DDE6F2', numEdge: null, shorts: '#22252B', socks: '#22252B', band: '#8A8F98', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#8A8F98' };
const GK_GREY = { shirt: '#8E949C', shirtD: '#6E747C', trim: '#2A2D34', num: '#1E2A22', numEdge: null, shorts: '#2A2D34', socks: '#8E949C', band: '#2A2D34', boots: '#1A1B1F', long: true, gloves: '#E8E6DE', badge: '#2A2D34' };
// the two armies. The film's own convention, so that the two can be told apart at a glance: the government's soldiers in
// green with a peaked cap, the rebels' in sand with a red beret (in fact both wore mixed camouflage)
const ARMY_K = { shirt: '#4E5E36', shirtD: '#3A4728', trim: '#3A4728', num: null, shorts: '#44532E', socks: '#44532E', boots: '#17181A', long: true, trousers: true, band: null };
const REBEL_K = { shirt: '#A38C5A', shirtD: '#7C6A42', trim: '#7C6A42', num: null, shorts: '#8E7A4E', socks: '#8E7A4E', boots: '#2A2118', long: true, trousers: true, band: null };
const SUIT_K = { shirt: '#22252D', shirtD: '#16181E', trim: '#E9E9E4', num: null, shorts: '#1D2027', socks: '#1D2027', boots: '#111214', long: true, trousers: true, band: null };
const CREW_K = { shirt: '#23262C', shirtD: '#17191D', trim: '#8A8F98', num: null, shorts: '#1B1D22', socks: '#1B1D22', boots: BLACK, long: true, trousers: true, band: null };
const head = (hair, face, hc, o = {}) => ({ face, hair, hairC: hc, brow: '#1E1612', suit: '#22252D', suitD: '#16181E', shirt: 'tee', ears: 1.0, ...o });
// Drogba's hair: braids combed straight back, falling behind his neck
const braidsFx = (g, layer, { fw, fh = 1 }) => { const w = 100 * fw, h = 125 * fh; g.fillStyle = '#120D0A';
  if (layer === 'back') { g.beginPath(); g.ellipse(0, -34, 106 * fw, 108, 0, 0, 7); g.fill();
    // from the front they hang beside the neck to the shoulders (one mass under the chin read as a beard)
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 96 * fw, 20); g.bezierCurveTo(sd * 114 * fw, 90, sd * 106 * fw, 150, sd * 86 * fw, 178); g.bezierCurveTo(sd * 72 * fw, 188, sd * 58 * fw, 172, sd * 60 * fw, 140);
      g.bezierCurveTo(sd * 62 * fw, 110, sd * 68 * fw, 80, sd * 64 * fw, 40); g.closePath(); g.fill(); } return; }
  const p = new Path2D(); p.moveTo(-w - 3, -16); p.bezierCurveTo(-w - 9, -h * 0.95, -40, -h - 16, 0, -h - 14); p.bezierCurveTo(40, -h - 16, w + 9, -h * 0.95, w + 3, -16);
  p.bezierCurveTo(w - 4, -62, 50, -96, 0, -98); p.bezierCurveTo(-50, -96, -w + 4, -62, -w - 3, -16); g.fill(p);
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 22, -96 + Math.abs(i) * 5); g.quadraticCurveTo(i * 27, -h * 0.9, i * 24, -h - 6 + Math.abs(i) * 6); g.stroke(); }
  g.strokeStyle = '#E9ECF2'; g.lineWidth = 7; g.beginPath(); g.moveTo(-w + 2, -52); g.bezierCurveTo(-52, -100, 52, -100, w - 2, -52); g.stroke(); };  // the band
const braidsBack = (g, { fw, fh }) => { g.fillStyle = '#120D0A'; g.beginPath(); g.ellipse(0, -14, 104 * fw, 114 * fh, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-74 * fw, 40); g.bezierCurveTo(-84 * fw, 120, -52, 196, -30, 212); g.lineTo(30, 212); g.bezierCurveTo(52, 196, 84 * fw, 120, 74 * fw, 40); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3; g.lineCap = 'round'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 24, -112); g.quadraticCurveTo(i * 30, 20, i * 14, 202); g.stroke(); } };
// a soldier's beret, pulled down to one side, and a peaked field cap
const beretFx = col => (g, layer, { fw, fh = 1 }) => { const w = 100 * fw, h = 125 * fh;
  if (layer === 'back') { g.fillStyle = '#17110D'; g.beginPath(); g.ellipse(0, -30, 102 * fw, 100, 0, 0, 7); g.fill(); return; }
  g.fillStyle = col; const p = new Path2D(); p.moveTo(-w - 8, -44); p.bezierCurveTo(-w - 34, -h - 6, -34, -h - 36, 22, -h - 28); p.bezierCurveTo(w * 0.92, -h - 18, w + 20, -98, w + 4, -50); p.bezierCurveTo(56, -80, -56, -80, -w - 8, -44); g.fill(p);
  g.fillStyle = mix(col, '#000000', 0.3); g.beginPath(); g.moveTo(-w - 8, -44); g.bezierCurveTo(-56, -80, 56, -80, w + 4, -50); g.bezierCurveTo(56, -64, -56, -64, -w - 8, -44); g.fill(); };
const beretBack = col => (g, { fw, fh }) => { g.fillStyle = '#17110D'; g.beginPath(); g.ellipse(0, 4, 100 * fw, 112 * fh, 0, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(-8 * fw, -66, 112 * fw, 66 * fh, -0.08, 0, 7); g.fill(); };
const capBack = col => (g, { fw, fh }) => { g.fillStyle = '#17110D'; g.beginPath(); g.ellipse(0, 6, 100 * fw, 112 * fh, 0, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(0, -62, 106 * fw, 66 * fh, 0, 0, 7); g.fill(); };
CAST.drogba = head('buzz', [0.97, 1.07, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08', hairFx: braidsFx, backFx: braidsBack });
CAST.civ1 = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.civ2 = head('bald', [0.98, 1.06, 0.92], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.civ3 = head('curly', [0.96, 1.04, 0.9], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.civ4 = head('buzz', [0.99, 1.07, 0.93], '#15100C', { skin: SKIN_M, brow: '#100C0A' });
CAST.civ5 = head('bald', [0.95, 1.05, 0.89], '#120D0A', { skin: SKIN_M, brow: '#0E0A08' });
CAST.cmr = head('buzz', [0.97, 1.05, 0.91], '#120D0A', { skin: SKIN_D, brow: '#0E0A08' });
CAST.gk = head('bald', [0.98, 1.05, 0.92], '#17110D', { skin: SKIN_M, brow: '#100C0A' });
CAST.crew = head('buzz', [0.97, 1.05, 0.91], '#15100C', { skin: SKIN_D, brow: '#100C0A' });
CAST.army1 = head('cap', [0.98, 1.05, 0.92], '#17110D', { skin: SKIN_D, brow: '#0E0A08', cap: '#3F4E2C', backFx: capBack('#3F4E2C') });
CAST.army2 = head('cap', [0.96, 1.06, 0.9], '#17110D', { skin: SKIN_M, brow: '#100C0A', cap: '#3F4E2C', backFx: capBack('#3F4E2C') });
CAST.reb1 = head('buzz', [0.97, 1.06, 0.91], '#17110D', { skin: SKIN_D, brow: '#0E0A08', hairFx: beretFx('#B0282C'), backFx: beretBack('#B0282C') });
CAST.reb2 = head('buzz', [0.99, 1.04, 0.93], '#17110D', { skin: SKIN_M, brow: '#100C0A', hairFx: beretFx('#B0282C'), backFx: beretBack('#B0282C') });
CAST.suit1 = head('receding', [0.99, 1.05, 0.94], '#2A2420', { skin: SKIN_D, brow: '#17110D', age: 0.3 });
CAST.suit2 = head('buzz', [0.97, 1.06, 0.92], '#17110D', { skin: SKIN_D, brow: '#0E0A08', age: 0.15 });
const mk = (who, kit, num, h, o = {}) => ({ who, kit, num, h, ...o });
const DROGBA_W = mk('drogba', CIV_W, 11, 1.89, { build: 1.05 }), DROGBA_O = mk('drogba', CIV_O, 11, 1.89, { build: 1.05 });
const squad = kit => [mk('civ1', kit, 5, 1.83), mk('civ2', kit, 4, 1.86, { build: 1.05 }), mk('civ3', kit, 15, 1.78), mk('civ4', kit, 8, 1.8), mk('civ5', kit, 21, 1.76),
  mk('civ1', kit, 10, 1.8), mk('civ2', kit, 6, 1.88, { build: 1.04 }), mk('civ4', kit, 14, 1.82), mk('civ3', kit, 3, 1.79), mk('civ5', kit, 9, 1.84)];
const MATES_W = squad(CIV_W), MATES_O = squad(CIV_O);
const WOME = mk('cmr', CMR, 3, 1.8), GK_E = mk('gk', GK_DARK, 1, 1.88), GK_M = mk('gk', GK_GREY, 1, 1.84);
const MADS = [mk('civ4', MAD, 4, 1.8), mk('civ5', MAD, 5, 1.78), mk('civ3', MAD, 2, 1.76)];
const ARMY = [mk('army1', ARMY_K, null, 1.84, { build: 1.06 }), mk('army2', ARMY_K, null, 1.8, { build: 1.05 })];
const REBELS = [mk('reb1', REBEL_K, null, 1.85, { build: 1.06 }), mk('reb2', REBEL_K, null, 1.79, { build: 1.05 })];
const CREW = mk('crew', CREW_K, null, 1.8);
const ENVOYS = [mk('suit1', SUIT_K, null, 1.8), mk('suit2', { ...SUIT_K, shirt: '#2C3040', shirtD: '#1E2230' }, null, 1.82)];

// ---------- the grounds: Omdurman at dusk, Bouaké under cloud, and a ground at night for the opening
const FLAG_CIV = g => { g.fillStyle = ORANGE; g.fillRect(0, 0, 1 / 3, 1); g.fillStyle = '#F4F4F2'; g.fillRect(1 / 3, 0, 1 / 3, 1); g.fillStyle = IGREEN; g.fillRect(2 / 3, 0, 1 / 3 + 0.01, 1); };
const FLAG_SUD = g => { g.fillStyle = '#C8202C'; g.fillRect(0, 0, 1, 1 / 3); g.fillStyle = '#F4F4F2'; g.fillRect(0, 1 / 3, 1, 1 / 3); g.fillStyle = '#15161A'; g.fillRect(0, 2 / 3, 1, 1 / 3 + 0.01); g.fillStyle = '#1F8A4C'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0.36, 0.5); g.lineTo(0, 1); g.closePath(); g.fill(); };
const CROWD_SUD = [['#C8C4BA', 26], ['#9A2A2A', 12], ['#2E6A3C', 12], ['#3A3A40', 18], ['#E8E5DE', 20], ['#6A5A48', 12]];
const CROWD_CIV = [[ORANGE, 36], ['#F4F2EC', 22], [IGREEN, 16], ['#3A2E26', 12], ['#E0A060', 8], ['#D8D4CC', 6]];
const ARENA_S = new Stadium({ seed: 12, density: 1, flags: 3, flagSet: [FLAG_SUD], haze: '#7A6658', cloth: CROWD_SUD });
const ARENA_B = new Stadium({ seed: 44, density: 1, flags: 6, flagSet: [FLAG_CIV], haze: '#93A2AC', cloth: CROWD_CIV });
const ARENA_N = new Stadium({ seed: 44, density: 1, flags: 0, flagSet: [FLAG_CIV], haze: '#1B2238', cloth: [['#2A3040', 40], ['#3A4050', 30], ['#1E2430', 30]] });
const BOARDS_S = [boardDesign('OMDURMAN', { bg: '#1D2A44', ink: '#F4F2EC' }), boardDesign('8 OCTOBER 2005'), boardDesign('WORLD CUP QUALIFIER', { bg: '#7A1E22', ink: '#F4F2EC' })];
const BOARDS_B = [boardDesign('BOUAKÉ', { bg: ORANGE, ink: '#FFFFFF' }), boardDesign('3 JUNE 2007'), boardDesign('CÔTE D’IVOIRE', { bg: IGREEN, ink: '#FFFFFF' })];
const SKY_DUSK = { zen: '#2A4674', mid: '#6E88AE', hor: '#E8B088', clouds: 0.3, cloud: '#C0989A', seed: 5 };
const SKY_NIGHT = { zen: '#060A18', mid: '#0E1730', hor: '#262F4C', clouds: 0.15, cloud: '#2C3652', seed: 3 };
const SKY_CLOUD = { zen: '#8497AB', mid: '#B2BEC9', hor: '#D8DCD8', clouds: 0.75, cloud: '#EDEFEF', seed: 8 };
const TURF = { colors: ['#3F8E3C', '#4A9C45'], wear: 0, haze: '#5A6E78' };
const TURF_B = { colors: ['#5C9640', '#69A34A'], wear: 0.7, haze: '#8A9AA0' };  // "the poor condition of the pitch" (VOA)
const TURF_N = { colors: ['#27583A', '#2E6442'], wear: 0, haze: '#1B2238' };
const BG = makeCanvas(), bgx = BG.getContext('2d');
function stadium(g, t, items = [], { arena = ARENA_B, skyP = SKY_CLOUD, turf = TURF_B, cheer = 0, blur = 0, hit = null, hitSide = 1, boards = BOARDS_B, goals = true } = {}) {
  const back = c => { sky(c, B, { t, ...skyP }); arena.draw(c, B, t, { cheer }); };
  if (blur > 0.4) { bgx.setTransform(1, 0, 0, 1, 0, 0); back(bgx); g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore(); }
  else back(g);
  pitch(g, B, { t, ...turf });
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
// he means it: the brows down, the eyes wide, the mouth working (k: how hard)
const PLEAD = (t, k = 1) => ({ ...EXPR.sad, brow: -0.6, browY: -5, lid: 0.08, mouth: 'o', curve: -0.25, open: 0.18 + 0.4 * k * Math.abs(Math.sin(t * 8.2)), pupil: 0.8 });
const GRAVE = { ...EXPR.focus, brow: 0.4, lid: 0.16, curve: -0.2 };
// ---------- poses of this film
// both knees on the floor, the shins flat behind, the body upright; then the same with the hands on the thighs, the hands
// joined in front of the chest, and one arm laid over the next man's shoulders
const KNEEL = { hip: [[0.06, 0.14], [0.06, 0.14]], knee: [1.63, 1.63], toes: [1.5, 1.5], pelvisY: 0.47, ground: false, lean: 0.03 };
const KNEEL_REST = { ...KNEEL, sh: [[0.42, 0.14], [0.42, 0.14]], el: [0.95, 0.95] };
const KNEEL_PRAY = { ...KNEEL, sh: [[0.85, -0.12], [0.85, -0.12]], el: [1.65, 1.65], fore: [-0.5, -0.5], fingers: true, look: -0.18 };
const KNEEL_ARM = side => ({ ...KNEEL, sh: side < 0 ? [[1.28, 0.8], [0.42, 0.14]] : [[0.42, 0.14], [1.28, 0.8]], el: side < 0 ? [0.3, 0.95] : [0.95, 0.3] });
// the right hand holds a microphone under his mouth: the elbow low in front, the forearm folded up and in; the left hand
// open, asking
const MIC_ARMS = (t = 0) => ({ sh: [[0.75 + 0.08 * Math.sin(t * 3.1), 0.42], [0.55, 0.1]], el: [0.75, 2.1], fore: [0.3, -0.69], fingers: true });
// a rifle held across the chest in both hands, and let down: both hands low, the muzzle at the ground
const PORT = { ...POSE.stand(), sh: [[0.95, 0.12], [0.4, 0.06]], el: [1.25, 1.2], fore: [-0.5, -0.4], lean: 0.02, look: 0 };
const LOWERED = { ...POSE.stand(), sh: [[0.5, 0.14], [0.22, 0.1]], el: [0.6, 0.4], fore: [-0.35, -0.2], lean: 0.04, look: -0.2 };
const DESPAIR = { ...POSE.handsOnHead(), lean: -0.05 };
// down on both knees from standing, u: 0..1, through three poses: upright; sunk on the toes, the knees forward; on the knees,
// the shins flat behind. st.x, st.z: where he ends up; the hips come forward as he goes down (the feet stay where they were).
// to: the kneeling pose (one without arms keeps the arms of st.pose)
function kneelDown(pl, st, u, to = KNEEL_REST) {
  const f = [Math.cos(st.head), Math.sin(st.head)], own = st.pose || {};
  const kn = onGrass(pl, { ...st, pose: { ...own, ...to } }, true);
  if (u >= 1) return kn;
  const up = grounded(pl, { ...st, pose: { ...POSE.stand(), ...own } }).pose;
  const sq = grounded(pl, { ...st, pose: { ...POSE.stand(), ...own, hip: [[0.95, 0.12], [0.95, 0.12]], knee: [2.05, 2.05], lean: 0.12 } }).pose;
  const w1 = smooth(clamp(u / 0.5)), w2 = smooth(clamp((u - 0.38) / 0.62));
  const pose = blend(blend(up, sq, w1), kn.pose, w2), back = 0.42 * (1 - w2) - 0.1 * w1 * (1 - w2);
  return onGrass(pl, { ...st, x: st.x - f[0] * back, z: st.z - f[1] * back, pose });
}

// a rifle between two points of the picture (p: the grip hand, q: the forward hand); u: pixels per metre
function rifle(g, p, q, u) {
  const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, sg = ux >= 0 ? 1 : -1, nx = -uy * sg, ny = ux * sg, L = l / u;
  const at = (f, n = 0) => [p.x + ux * f * u + nx * n * u, p.y + uy * f * u + ny * n * u];
  const seg = (a, b, w, col) => { g.strokeStyle = col; g.lineWidth = Math.max(1.5, w * u); g.beginPath(); g.moveTo(...at(a)); g.lineTo(...at(b)); g.stroke(); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  seg(-0.24, -0.05, 0.062, '#5A3A22');                 // the stock
  seg(-0.06, L + 0.1, 0.046, '#1B1D22');               // the body
  seg(L + 0.08, L + 0.3, 0.02, '#1B1D22');             // the barrel
  seg(L * 0.45, L + 0.02, 0.056, '#5A3A22');           // the wood under the barrel
  g.strokeStyle = '#1B1D22'; g.lineWidth = Math.max(1.5, 0.05 * u); g.beginPath(); g.moveTo(...at(0.1, 0.03)); g.quadraticCurveTo(...at(0.15, 0.13), ...at(0.24, 0.19)); g.stroke();  // the magazine
  g.restore();
}
// 'hands': in both hands; 'slung': on his back, the muzzle up over the right shoulder
const rifleProp = (mode = 'hands') => mode === 'slung'
  ? { at: 'back', draw: (g, sk, pr) => { const k = sk.k, a = pr(v3.add(v3.add(sk.pel, v3.mul(sk.r, -0.1 * k)), v3.mul(sk.ft, -0.13 * k))), b = pr(v3.add(v3.add(v3.add(sk.C, v3.mul(sk.r, 0.14 * k)), v3.mul(sk.spine, 0.02 * k)), v3.mul(sk.ft, -0.13 * k))); rifle(g, a, b, a.s * k); } }
  : { at: 'hands', draw: (g, sk, pr) => { const R = pr(sk.arms[1].hand), L = pr(sk.arms[0].hand); rifle(g, R, L, R.s * sk.k); } };
// a hand microphone: (hx, hy), where the fist is; (ux, uy), which way it points; u, pixels per metre
function drawMic(g, hx, hy, ux, uy, u, from = -0.075) {
  g.save(); g.lineCap = 'round';
  g.strokeStyle = '#23262C'; g.lineWidth = Math.max(2, 0.04 * u); g.beginPath(); g.moveTo(hx + ux * from * u, hy + uy * from * u); g.lineTo(hx + ux * 0.105 * u, hy + uy * 0.105 * u); g.stroke();
  g.fillStyle = '#B4B9C2'; g.beginPath(); g.arc(hx + ux * 0.14 * u, hy + uy * 0.14 * u, Math.max(2, 0.042 * u), 0, 2 * PI); g.fill();
  g.strokeStyle = '#7C828C'; g.lineWidth = Math.max(1, 0.012 * u); g.beginPath(); g.arc(hx + ux * 0.14 * u, hy + uy * 0.14 * u, Math.max(2, 0.042 * u), 0.25 * PI, 0.75 * PI); g.stroke();
  g.restore();
}
// the microphone in a man's right fist: it points up out of the fist, a little along the forearm. A thing of its own, drawn in
// front of him (it: what P() made): as something he holds it went under his head, which the engine keeps in front of his arms
const micOf = it => { const sk = it.sk, A = sk.arms[1], k = sk.k, dir = v3.nrm(v3.sub(A.hand, A.elbow)), up = v3.nrm(v3.add(v3.add(v3.mul(dir, 0.35), v3.mul(sk.spine, 0.75)), v3.mul(sk.ft, 0.2))), tip = v3.add(A.hand, v3.mul(up, 0.14 * k));
  return { get d() { return depth(A.hand[0], A.hand[1], A.hand[2]) - 0.35; }, draw: g => { const h = B.project(A.hand[0], A.hand[1], A.hand[2]), q = B.project(tip[0], tip[1], tip[2]); if (h.z < 0.2) return;
    const l = Math.hypot(q.x - h.x, q.y - h.y) || 1; drawMic(g, h.x, h.y, (q.x - h.x) / l, (q.y - h.y) / l, h.s * k, 0.03); } }; };
const withMic = it => [it, micOf(it)];
// the African Footballer of the Year's trophy, held up in the left hand: a golden ball on a short stem
const trophyProp = () => ({ at: 'hands', draw: (g, sk, pr) => { const k = sk.k, h = sk.arms[0].hand, a = pr(h), b = pr([h[0], h[1] + 0.2 * k, h[2]]), u = a.s * k;
  g.save(); g.fillStyle = '#3A2C1A'; g.beginPath(); g.roundRect(a.x - 0.075 * u, a.y - 0.075 * u, 0.15 * u, 0.06 * u, 0.012 * u); g.fill();  // a foot, a stem that narrows, a collar, the ball
  g.fillStyle = '#B8922E'; g.beginPath(); g.moveTo(a.x - 0.05 * u, a.y - 0.07 * u); g.lineTo(a.x + 0.05 * u, a.y - 0.07 * u); g.lineTo(b.x + 0.022 * u, b.y - 0.02 * u); g.lineTo(b.x - 0.022 * u, b.y - 0.02 * u); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(b.x, b.y - 0.02 * u, 0.07 * u, 0.022 * u, 0, 0, 2 * PI); g.fill();
  g.fillStyle = '#E8C35A'; g.beginPath(); g.arc(b.x, b.y - 0.125 * u, 0.115 * u, 0, 2 * PI); g.fill();
  g.strokeStyle = '#B8922E'; g.lineWidth = Math.max(1.5, 0.012 * u); g.beginPath(); g.arc(b.x, b.y - 0.125 * u, 0.115 * u, 0.15 * PI, 0.85 * PI); g.stroke(); g.restore(); } });
// a broadcast camera on the right shoulder of the man who carries it, its lens where he looks
const tvCamProp = () => ({ at: 'front', depth: (sk, dp) => dp(sk.arms[1].sh) - 0.12, draw: (g, sk, pr) => { const k = sk.k, S = v3.add(sk.arms[1].sh, [0, 0.17 * k, 0]), f = sk.f;
  const at = d => pr(v3.add(S, v3.mul(f, d * k))), a = at(-0.3), b = at(0.22), c = at(0.5), e = at(0.62);
  g.save(); g.lineCap = 'round';
  g.strokeStyle = '#1A1C21'; g.lineWidth = 0.27 * k * b.s; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  g.strokeStyle = '#2E323A'; g.lineWidth = 0.2 * k * b.s; g.beginPath(); g.moveTo(a.x, a.y - 0.02 * k * a.s); g.lineTo(b.x, b.y - 0.02 * k * b.s); g.stroke();
  g.lineCap = 'butt'; g.strokeStyle = '#0E0F12'; g.lineWidth = 0.2 * k * c.s; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke();
  g.strokeStyle = '#3A3F49'; g.lineWidth = 0.25 * k * e.s; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(e.x, e.y); g.stroke();
  const tl = pr(v3.add(v3.add(S, v3.mul(f, -0.26 * k)), [0, 0.17 * k, 0])); g.fillStyle = '#FF3B30'; g.beginPath(); g.arc(tl.x, tl.y, Math.max(2, 0.03 * k * tl.s), 0, 2 * PI); g.fill();
  g.restore(); } });

// ---------- the visitors' dressing room: yellow walls (as in the television pictures), a bench along the back wall, kit on a
// rail of pegs, a door, a strip light
const RX = 300, RZ = 300;
function dressingRoom(g) {
  g.fillStyle = '#2A2418'; g.fillRect(0, 0, W, H);
  const q = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  const x0 = RX - 6, x1 = RX + 6, zb = RZ - 2.7, zf = RZ + 10, hh = 3.1;
  q([[x0, 0, zb], [x1, 0, zb], [x1, 0, zf], [x0, 0, zf]], '#8C877C');
  for (let i = -4; i <= 4; i++) q([[RX + i * 1.3 - 0.012, 0.002, zb], [RX + i * 1.3 + 0.012, 0.002, zb], [RX + i * 1.3 + 0.012, 0.002, zf], [RX + i * 1.3 - 0.012, 0.002, zf]], '#7E796E');
  q([[x0, 0, zb], [x1, 0, zb], [x1, hh, zb], [x0, hh, zb]], '#C9A23C');
  q([[x0, 0, zb + 0.01], [x1, 0, zb + 0.01], [x1, 1.05, zb + 0.01], [x0, 1.05, zb + 0.01]], '#B58D2E');
  q([[x0, 0, zb], [x0, 0, zf], [x0, hh, zf], [x0, hh, zb]], '#B4902E'); q([[x1, 0, zb], [x1, 0, zf], [x1, hh, zf], [x1, hh, zb]], '#BE9834');
  q([[x0, hh, zb], [x1, hh, zb], [x1, hh, zf], [x0, hh, zf]], '#3A3324');
  box(g, B, [x0 + 0.3, 0, zb + 0.02], [x1 - 0.3, 0.46, zb + 0.5], { top: '#8A6238', side: '#5E4124', front: '#6E4C2A' });
  q([[x0 + 0.3, 1.88, zb + 0.02], [x1 - 0.3, 1.88, zb + 0.02], [x1 - 0.3, 1.94, zb + 0.02], [x0 + 0.3, 1.94, zb + 0.02]], '#5E4124');
  for (const [col, dx] of [['#F1EFE8', -4.7], [ORANGE, -3.5], ['#F1EFE8', -2.3], ['#2A6E4A', -1.0], ['#F1EFE8', 0.5], ['#E4E0D6', 1.8], [ORANGE, 3.0]])
    q([[RX + dx - 0.27, 1.18, zb + 0.03], [RX + dx + 0.27, 1.18, zb + 0.03], [RX + dx + 0.22, 1.88, zb + 0.03], [RX + dx - 0.22, 1.88, zb + 0.03]], col);
  q([[x1 - 1.9, 0, zb + 0.02], [x1 - 0.75, 0, zb + 0.02], [x1 - 0.75, 2.1, zb + 0.02], [x1 - 1.9, 2.1, zb + 0.02]], '#5A4326');
  q([[RX - 1.3, hh - 0.02, RZ - 0.6], [RX + 1.3, hh - 0.02, RZ - 0.6], [RX + 1.3, hh - 0.02, RZ - 0.1], [RX - 1.3, hh - 0.02, RZ - 0.1]], '#FFF6DC');
}
// back: people out of focus behind the ones the shot is about (drawn with the room, under its blur)
function room(g, items, { blur = 2, back = [] } = {}) {
  bgx.setTransform(1, 0, 0, 1, 0, 0); dressingRoom(bgx);
  if (back.length) { for (const it of back) it.shadow?.(bgx); drawSorted(bgx, back); }
  g.save(); if (blur > 0.4) g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(BG, 0, 0); g.restore();
  for (const it of items) it.shadow?.(g);
  drawSorted(g, items);
}
// a room for talks: dark panelled walls, a long table with a cloth, two flags behind it
const TX0 = 600, TZ0 = 300;
function talksRoom(g) {
  g.fillStyle = '#14110E'; g.fillRect(0, 0, W, H);
  const q = (pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
  const x0 = TX0 - 7, x1 = TX0 + 7, zb = TZ0 - 2.4, zf = TZ0 + 9, hh = 3.4;
  q([[x0, 0, zb], [x1, 0, zb], [x1, 0, zf], [x0, 0, zf]], '#4A3A2C');
  q([[x0, 0, zb], [x1, 0, zb], [x1, hh, zb], [x0, hh, zb]], '#5A4632');
  for (let i = -5; i <= 5; i++) q([[TX0 + i * 1.3 - 0.03, 0, zb + 0.01], [TX0 + i * 1.3 + 0.03, 0, zb + 0.01], [TX0 + i * 1.3 + 0.03, hh, zb + 0.01], [TX0 + i * 1.3 - 0.03, hh, zb + 0.01]], '#4A3826');
  q([[x0, 0.95, zb + 0.012], [x1, 0.95, zb + 0.012], [x1, 1.02, zb + 0.012], [x0, 1.02, zb + 0.012]], '#3E2E20');
  for (const sd of [-1, 1]) { const fx = TX0 + sd * 2.6;  // a flag on a pole each side: the national one
    q([[fx - 0.025, 0, zb + 0.3], [fx + 0.025, 0, zb + 0.3], [fx + 0.025, 2.6, zb + 0.3], [fx - 0.025, 2.6, zb + 0.3]], '#C9A05A');
    const cols = [ORANGE, '#F4F4F2', IGREEN]; cols.forEach((c, i) => q([[fx + 0.03 + i * 0.26, 1.35, zb + 0.31], [fx + 0.29 + i * 0.26, 1.3, zb + 0.31], [fx + 0.29 + i * 0.26, 2.5, zb + 0.31], [fx + 0.03 + i * 0.26, 2.55, zb + 0.31]], c)); }
}
const tableItems = () => [{ d: depth(TX0, 0.4, TZ0), draw: g => { box(g, B, [TX0 - 1.7, 0, TZ0 - 0.45], [TX0 + 1.7, 0.78, TZ0 + 0.45], { top: '#2E5A46', side: '#1E3E30', front: '#244A3A' });
  if (B.poly(g, [[TX0 - 0.26, 0.785, TZ0 - 0.2], [TX0 + 0.26, 0.785, TZ0 - 0.2], [TX0 + 0.26, 0.785, TZ0 + 0.2], [TX0 - 0.26, 0.785, TZ0 + 0.2]])) { g.fillStyle = '#F1EEE4'; g.fill(); } } }];

// ---------- pictures drawn flat on the screen
// a photograph laid into a box of the picture, cover-cropped (fx, fy: the point of the photograph kept in the middle), in its own colours
function photoIn(g, img, x, y, w, h, { z = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = Math.max(w / img.width, h / img.height) * z, sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, sw, sh, x, y, w, h); g.restore();
}
// Ivory Coast's flag as a roundel
function flagDisc(g, x, y, r, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.beginPath(); g.arc(x, y, r, 0, 2 * PI); g.clip();
  g.fillStyle = ORANGE; g.fillRect(x - r, y - r, r * 2 / 3 + 1, r * 2); g.fillStyle = '#F4F4F2'; g.fillRect(x - r / 3, y - r, r * 2 / 3 + 1, r * 2); g.fillStyle = IGREEN; g.fillRect(x + r / 3, y - r, r * 2 / 3 + 1, r * 2);
  g.restore();
}
// Ivory Coast: the outline of the engine's world atlas (Natural Earth, 1:110m), [longitude, latitude]. And the line the
// country was cut along from 2002 (the "zone of confidence"), west to east, drawn approximately: Man, Séguéla, Bouaké and
// Bouna north of it; Duékoué, Daloa, Yamoussoukro and Bondoukou south
const CI = [[-8.03, 10.21], [-7.9, 10.3], [-7.62, 10.15], [-6.85, 10.14], [-6.67, 10.43], [-6.49, 10.41], [-6.2, 10.52], [-6.05, 10.1], [-5.82, 10.22], [-5.41, 10.37], [-4.96, 10.15], [-4.78, 9.82], [-4.33, 9.61], [-3.98, 9.86],
  [-3.51, 9.9], [-2.83, 9.64], [-2.56, 8.22], [-2.98, 7.38], [-3.25, 6.25], [-2.81, 5.39], [-2.86, 5], [-3.31, 4.98], [-4.01, 5.18], [-4.65, 5.17], [-5.83, 4.99], [-6.53, 4.71], [-7.52, 4.34], [-7.71, 4.36], [-7.63, 5.19], [-7.54, 5.31],
  [-7.57, 5.71], [-7.99, 6.13], [-8.31, 6.19], [-8.6, 6.47], [-8.39, 6.91], [-8.49, 7.4], [-8.44, 7.69], [-8.28, 7.69], [-8.22, 8.12], [-8.3, 8.32], [-8.2, 8.45], [-7.83, 8.58], [-8.08, 9.38], [-8.31, 9.79], [-8.23, 10.13], [-8.03, 10.21]];
const CUT = [[-9.4, 6.86], [-8.5, 6.95], [-8.0, 7.02], [-7.45, 7.06], [-6.95, 7.2], [-6.5, 7.14], [-5.95, 7.1], [-5.5, 7.3], [-5.2, 7.34], [-4.8, 7.48], [-4.4, 7.56], [-4.0, 7.82], [-3.6, 8.08], [-3.15, 8.36], [-2.6, 8.62], [-1.7, 8.8]];
const CITY = { bouake: [-5.03, 7.69], abidjan: [-4.02, 5.33], yamoussoukro: [-5.28, 6.82] };
// m: {cx, cy, s}: where the middle of the country sits and how many pixels a degree is
const MX = (m, lon) => m.cx + (lon + 5.58) * 0.99 * m.s, MY = (m, lat) => m.cy - (lat - 7.43) * m.s;
const mapPath = (m, ring, dy = 0) => { const p = new Path2D(); ring.forEach(([lo, la], i) => (i ? p.lineTo(MX(m, lo), MY(m, la) + dy) : p.moveTo(MX(m, lo), MY(m, la) + dy))); p.closePath(); return p; };
// the ground the map lies on: a dark sheet, a faint grid, the neighbours, the sea to the south
function mapBack(g, m) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#10161F'); bg.addColorStop(0.62, '#0C1119'); bg.addColorStop(1, '#0A1420'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(160,180,210,0.07)'; g.lineWidth = 2;
  for (let lo = -14; lo <= 4; lo += 1) { g.beginPath(); g.moveTo(MX(m, lo), 0); g.lineTo(MX(m, lo), H); g.stroke(); }
  for (let la = 0; la <= 16; la += 1) { g.beginPath(); g.moveTo(0, MY(m, la)); g.lineTo(W, MY(m, la)); g.stroke(); }
  g.fillStyle = '#1B2330'; g.strokeStyle = 'rgba(150,170,200,0.2)'; g.lineWidth = 3; g.lineJoin = 'round';
  for (const ring of NEIGH) { const p = mapPath(m, ring); g.fill(p); g.stroke(p); }
  g.restore();
}
// split: how far the two halves have come apart (0..1); crack: how much of the cut is drawn, west to east, before that;
// hiN / hiS: the north / the south lit; whole: the country in one colour again (the old line stays as a scar)
function mapCI(g, m, { split = 0, crack = 0, hiN = 0, hiS = 0, a = 1, whole = 0 } = {}) {
  if (a <= 0) return;
  const gap = 30 * split * (m.s / 125);
  const half = (north, dy) => { const p = new Path2D(); CUT.forEach(([lo, la], i) => (i ? p.lineTo(MX(m, lo), MY(m, la) + dy) : p.moveTo(MX(m, lo), MY(m, la) + dy))); const yy = MY(m, north ? 13 : 2) + dy; p.lineTo(MX(m, -1.7), yy); p.lineTo(MX(m, -9.4), yy); p.closePath(); return p; };
  g.save(); g.globalAlpha *= a; g.lineJoin = 'round';
  if (split < 0.001 && Math.abs(hiN - hiS) < 0.001) { const col = mix(mix(mix('#CFC7B2', '#D2A858', 0), '#FFFFFF', 0), '#E6DFCC', whole);
    g.fillStyle = 'rgba(4,6,10,0.5)'; g.fill(mapPath(m, CI, 16 * (m.s / 125))); g.fillStyle = hiN > 0.001 ? mix('#CFC7B2', '#E6DFCC', whole) : col; g.fill(mapPath(m, CI)); g.strokeStyle = 'rgba(20,16,10,0.55)'; g.lineWidth = 5; g.stroke(mapPath(m, CI)); }
  else for (const north of [true, false]) {
    const hi = north ? hiN : hiS, dy = (north ? -1 : 1) * gap * 0.5;
    const base = mix('#CFC7B2', north ? '#D2A858' : '#62A068', clamp(split * 0.55 + hi * 0.45)), col = mix(mix(base, '#FFFFFF', 0.1 * hi), '#E6DFCC', whole);
    g.save(); g.clip(half(north, dy));
    g.fillStyle = 'rgba(4,6,10,0.5)'; g.fill(mapPath(m, CI, dy + 16 * (m.s / 125)));
    g.fillStyle = col; g.fill(mapPath(m, CI, dy)); g.strokeStyle = 'rgba(20,16,10,0.55)'; g.lineWidth = 5; g.stroke(mapPath(m, CI, dy));
    g.restore();
  }
  const line = (n, dy = 0) => { g.beginPath(); const N = CUT.length - 1, f = clamp(n) * N; for (let i = 0; i <= Math.min(N, Math.ceil(f)); i++) { const k = Math.min(1, f - (i - 1)), a0 = CUT[Math.max(0, i - 1)], b0 = CUT[i], lo = lerp(a0[0], b0[0], i ? k : 1), la = lerp(a0[1], b0[1], i ? k : 1); i ? g.lineTo(MX(m, lo), MY(m, la) + dy) : g.moveTo(MX(m, lo), MY(m, la) + dy); } };
  if (split <= 0.02 && crack > 0) {  // the cut being made: a red line that runs across the country
    g.save(); g.clip(mapPath(m, CI)); g.lineCap = 'round'; line(crack); g.strokeStyle = 'rgba(214,52,44,0.95)'; g.lineWidth = 9 * (m.s / 125); g.stroke(); line(crack); g.strokeStyle = '#0C0E14'; g.lineWidth = 3 * (m.s / 125); g.stroke(); g.restore();
  }
  if (split > 0.02) {  // the edges of the two halves, red
    for (const sd of [-1, 1]) { g.save(); g.clip(mapPath(m, CI, sd * gap * 0.5)); line(1, sd * gap * 0.5); g.strokeStyle = `rgba(214,52,44,${(0.9 * (1 - whole)).toFixed(2)})`; g.lineWidth = 7 * (m.s / 125); g.stroke(); g.restore(); }
  }
  if (whole > 0 && split <= 0.02) { g.save(); g.clip(mapPath(m, CI)); g.setLineDash([14, 12]); line(1); g.strokeStyle = `rgba(120,96,70,${(0.6 * whole).toFixed(2)})`; g.lineWidth = 4 * (m.s / 125); g.stroke(); g.restore(); }
  g.restore();
}
function mapDot(g, m, name, label, { a = 1, col = '#FFFFFF', dy = 0, side = 1, size = 32, pulse = 0 } = {}) {
  if (a <= 0) return;
  const [lo, la] = CITY[name], x = MX(m, lo), y = MY(m, la) + dy;
  g.save(); g.globalAlpha *= a;
  if (pulse > 0 && pulse < 1) { g.save(); g.strokeStyle = col; g.lineWidth = 5; g.globalAlpha *= 1 - pulse; g.beginPath(); g.arc(x, y, 14 + 60 * pulse, 0, 2 * PI); g.stroke(); g.restore(); }
  g.fillStyle = 'rgba(12,9,6,0.6)'; g.beginPath(); g.arc(x, y + 3, 15, 0, 2 * PI); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 13, 0, 2 * PI); g.fill(); g.fillStyle = '#15161A'; g.beginPath(); g.arc(x, y, 5, 0, 2 * PI); g.fill(); g.restore();
  if (label) { g.save(); g.font = sans(size, 900); const tw = g.measureText(label).width; g.restore(); plate(g, label, x + side * (40 + tw / 2 + size * 0.5), y - 2, { color: col, ink: '#15161A', size, a, rot: 0 }); }
  return { x, y };
}
// little soldiers on the map: a head with a cap or a beret, shoulders, a rifle's line
function mapSoldier(g, x, y, s, rebel, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(12,9,6,0.45)'; g.beginPath(); g.ellipse(0, 44, 30, 8, 0, 0, 2 * PI); g.fill();
  g.strokeStyle = '#1B1D22'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(20, 34); g.lineTo(-6, -40); g.stroke();
  g.fillStyle = rebel ? '#A38C5A' : '#4E5E36'; g.beginPath(); g.roundRect(-24, -8, 48, 50, 14); g.fill();
  g.fillStyle = '#8A5A3A'; g.beginPath(); g.arc(0, -26, 18, 0, 2 * PI); g.fill();
  g.fillStyle = rebel ? '#B0282C' : '#3F4E2C'; g.beginPath(); g.ellipse(rebel ? -3 : 0, -38, 21, 10, rebel ? -0.25 : 0, 0, 2 * PI); g.fill();
  g.restore();
}
// a television set of the time with a picture on its tube: scan lines, a soft reflection, the glow it throws
function tvSet(g, img, x, y, w, t, { a = 1, fx = 0.5, fy = 0.5, z = 1, glow = 1, dark = 0, ph = 0 } = {}) {
  if (a <= 0) return;
  const h = w * 430 / 690, pad = w * 0.045, bw = w + pad * 2, bh = h + pad * 2 + w * 0.085;
  g.save(); g.globalAlpha *= a;
  if (glow > 0) { const rg = g.createRadialGradient(x, y, w * 0.3, x, y, w * 1.25); rg.addColorStop(0, `rgba(190,205,235,${(0.22 * glow).toFixed(3)})`); rg.addColorStop(1, 'rgba(190,205,235,0)'); g.fillStyle = rg; g.fillRect(x - w * 1.3, y - w * 1.3, w * 2.6, w * 2.6); }
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.roundRect(x - bw / 2 + 8, y - h / 2 - pad + 14, bw, bh, pad * 0.9); g.fill();
  g.fillStyle = '#23262C'; g.beginPath(); g.roundRect(x - bw / 2, y - h / 2 - pad, bw, bh, pad * 0.9); g.fill();
  g.fillStyle = '#34383F'; g.beginPath(); g.roundRect(x - bw / 2 + 5, y - h / 2 - pad + 5, bw - 10, bh - 10, pad * 0.7); g.fill();
  g.fillStyle = '#0A0B0E'; g.beginPath(); g.roundRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, w * 0.025); g.fill();
  g.save(); g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, w * 0.02); g.clip();
  photoIn(g, img, x - w / 2, y - h / 2, w, h, { z, fx, fy });
  g.fillStyle = 'rgba(8,10,18,0.16)'; for (let yy = y - h / 2 + (((t + ph) * 40) % 6); yy < y + h / 2; yy += 6) g.fillRect(x - w / 2, yy, w, 2);
  const fl = 0.04 + 0.03 * Math.sin((t + ph) * 31) * Math.sin((t + ph) * 7.3); g.fillStyle = `rgba(255,255,255,${Math.max(0, fl).toFixed(3)})`; g.fillRect(x - w / 2, y - h / 2, w, h);
  const roll = ((t + ph) * 0.23) % 1; g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x - w / 2, y - h / 2 + roll * h, w, h * 0.09);  // the band that rolls down a tube filmed off the air
  const sh = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); sh.addColorStop(0, 'rgba(255,255,255,0.1)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(x - w / 2, y - h / 2, w, h);
  if (dark > 0) { g.fillStyle = `rgba(6,8,14,${dark.toFixed(3)})`; g.fillRect(x - w / 2, y - h / 2, w, h); }
  g.restore();
  g.fillStyle = '#17191D'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x + bw / 2 - pad * 1.6 - i * pad * 1.5, y + h / 2 + pad + w * 0.04, pad * 0.42, 0, 2 * PI); g.fill(); }
  g.fillStyle = '#C8202C'; g.beginPath(); g.arc(x - bw / 2 + pad * 1.6, y + h / 2 + pad + w * 0.04, pad * 0.22, 0, 2 * PI); g.fill();
  g.restore();
}
// the back of a head and shoulders, dark against a screen
function watcher(g, x, y, s, { cap = null, a = 1, rim = 1 } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const body = () => { g.beginPath(); g.moveTo(-170, 300); g.bezierCurveTo(-170, 120, -100, 86, -44, 74); g.lineTo(44, 74); g.bezierCurveTo(100, 86, 170, 120, 170, 300); g.closePath(); };
  if (rim > 0) { g.save(); g.translate(0, -5); g.fillStyle = `rgba(150,170,210,${(0.5 * rim).toFixed(2)})`; body(); g.fill(); g.beginPath(); g.ellipse(0, 0, 64, 78, 0, 0, 2 * PI); g.fill(); g.restore(); }
  g.fillStyle = '#12141C'; body(); g.fill();
  g.beginPath(); g.ellipse(0, 0, 62, 76, 0, 0, 2 * PI); g.fill();
  if (cap === 'beret') { g.fillStyle = '#7A1C22'; g.beginPath(); g.ellipse(-6, -50, 76, 36, -0.12, 0, 2 * PI); g.fill(); }
  if (cap === 'cap') { g.fillStyle = '#34452A'; g.beginPath(); g.ellipse(0, -48, 70, 36, 0, 0, 2 * PI); g.fill(); }
  g.restore();
}
// the score in a corner. m: what the box beside it says ('' for no box); hotL, hotR: the side that has just scored swells
function scoreBug(g, L, R, a, b, m, { x = 40, y = 76, al = 1, colL = '#C8202C', colR = ORANGE, hotL = 0, hotR = 0 } = {}) {
  if (al <= 0) return;
  g.save(); g.globalAlpha *= al; g.font = sans(30, 900); g.letterSpacing = '3px';
  const w = 360, hh = 54, my = y + hh / 2 + 2;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, hh);
  g.fillStyle = CREAM; g.fillRect(x, y, w, hh);
  g.fillStyle = colL; g.fillRect(x, y, 14, hh); g.fillStyle = colR; g.fillRect(x + w - 14, y, 14, hh);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(L, x + 26, my); g.fillText(R, x + w - 104, my);
  g.textAlign = 'center';
  const num = (v, cx, hot) => { g.save(); g.translate(cx, my); g.scale(1 + 0.5 * hot, 1 + 0.5 * hot); g.fillStyle = mix(C.ink, '#C85E10', hot); g.fillText(String(v), 0, 0); g.restore(); };
  num(a, x + w / 2 - 32, hotL); g.fillStyle = C.ink; g.fillText('–', x + w / 2 - 2, my); num(b, x + w / 2 + 28, hotR);
  if (m) { g.fillStyle = NAVY; g.fillRect(x + w + 8, y, 132, hh); g.fillStyle = CREAM; g.fillText(m, x + w + 74, my); }
  qaRect(g, x, y, w + (m ? 140 : 0), hh, 'text', 'score bug');
  g.restore();
}
function title2(g, l1, l2, y, { c1 = '#FFFFFF', c2 = '#FF4B3A', s1 = 96, s2 = 132, a = 1, k = 1 } = {}) {  // a small line over a heavy one
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, y); g.scale(k, k); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 20; g.strokeStyle = '#141018';
  g.font = sans(s1, 900); g.strokeText(l1, 0, 0); g.fillStyle = c1; g.fillText(l1, 0, 0);
  g.font = sans(s2, 900); g.strokeText(l2, 0, s2 * 1.02); g.fillStyle = c2; g.fillText(l2, 0, s2 * 1.02);
  g.restore();
  qaRect(g, 40, y - s1 * 0.8, W - 80, s1 * 0.8 + s2 * 1.1, 'text', 'cover title');
}
// what a television camera adds to its own picture: a recording mark and the corners of the frame
function recMark(g, t, { a = 1, x = 40, y = 76, label = 'NATIONAL TV' } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(28, 900); g.letterSpacing = '3px'; const w = 74 + g.measureText(label).width;
  g.fillStyle = 'rgba(12,9,6,0.5)'; g.fillRect(x, y + 5, w, 54); g.fillStyle = '#C8202C'; g.fillRect(x, y, w, 54);
  g.fillStyle = `rgba(255,255,255,${(0.55 + 0.45 * (Math.sin(t * 6) > 0 ? 1 : 0.3)).toFixed(2)})`; g.beginPath(); g.arc(x + 30, y + 28, 10, 0, 2 * PI); g.fill();
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#FFFFFF'; g.fillText(label, x + 54, y + 29);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; g.lineCap = 'square';
  for (const [cx, cy, sx, sy] of [[34, 170, 1, 1], [W - 34, 170, -1, 1], [34, H - 60, 1, -1], [W - 34, H - 60, -1, -1]]) { g.beginPath(); g.moveTo(cx + sx * 60, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + sy * 60); g.stroke(); }
  qaRect(g, x, y, w, 54, 'text', 'rec mark');
  g.restore();
}
// ---------- more kits and grounds: Sudan and Egypt in red, Yaoundé in daylight, Drogba out of his kit
const SUD = { shirt: '#B8202C', shirtD: '#8E1620', trim: WHITE, num: WHITE, numEdge: null, shorts: '#F1EFE8', socks: '#B8202C', band: WHITE, boots: '#1A1B1F', badge: WHITE };
const EGY = { shirt: '#C8202C', shirtD: '#9E1620', trim: '#15161A', num: WHITE, numEdge: null, shorts: '#F1EFE8', socks: '#15161A', band: WHITE, boots: '#1A1B1F', badge: WHITE };
const CIVVY = { shirt: '#F4F2EC', shirtD: '#D9D5CA', trim: '#D9D5CA', num: null, shorts: '#22252B', socks: '#22252B', boots: '#111214', long: true, trousers: true, band: null };
const SUDS = [mk('civ4', SUD, 6, 1.8), mk('civ5', SUD, 8, 1.78), mk('civ1', SUD, 4, 1.82), mk('civ3', SUD, 2, 1.76)];
const DROGBA_C = mk('drogba', CIVVY, null, 1.89, { build: 1.05 });
const FLAG_CMR = g => { g.fillStyle = '#1F8A4C'; g.fillRect(0, 0, 1 / 3, 1); g.fillStyle = '#C8202C'; g.fillRect(1 / 3, 0, 1 / 3, 1); g.fillStyle = '#F2D21E'; g.fillRect(2 / 3, 0, 1 / 3 + 0.01, 1); };
const CROWD_CMR = [['#1F8A4C', 34], ['#C8202C', 22], ['#F2D21E', 22], ['#3A2E26', 12], ['#E8E5DE', 10]];
const ARENA_Y = new Stadium({ seed: 7, density: 1, flags: 4, flagSet: [FLAG_CMR], haze: '#8FA0A8', cloth: CROWD_CMR });
const BOARDS_Y = [boardDesign('YAOUNDÉ', { bg: '#1F8A4C', ink: '#FFFFFF' }), boardDesign('8 OCTOBER 2005'), boardDesign('CAMEROON v EGYPT', { bg: '#7A1E22', ink: '#F4F2EC' })];
const SKY_DAY = { zen: '#3E78BE', mid: '#86B2DE', hor: '#DCE8EC', clouds: 0.5, cloud: '#FFFFFF', seed: 11 };
const HIPS = { sh: [[0.25, 0.85], [0.25, 0.85]], el: [-0.25, -0.25], fore: [-0.86, -0.86], lean: 0.04 };
// people: a man who stands, one who jogs in a straight line, one who jumps on the spot (the knees give as he lands)
const man = (t, pl, x, z, hd, pose = {}, e = 'focus', ph = 0, extra = {}) => P(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...pose }, e, t: t + ph, ...extra });
const angTo = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const jog = (t, t0, pl, x0, z0, vx, vz, ph = 0, e = 'focus', arms = null) => { const sp = Math.hypot(vx, vz), st = clamp(1.15 + 0.3 * sp, 1.3, 3.6), d = sp * (t - t0), r = POSE.run(2 * PI * d / st + ph, clamp(sp / 6.5, 0.35, 1), 0);
  return P(pl, { x: x0 + vx * (t - t0), z: z0 + vz * (t - t0), head: Math.atan2(vz, vx), pose: arms ? { ...r, ...arms } : r, e, t: t + ph }); };
const hopper = (t, pl, x, z, hd, ph, { amp = 0.16, arms = POSE.armsUp(1), e = JOY, rate = 6.5 } = {}) => { const a = Math.abs(Math.sin(t * rate + ph)), bend = 0.2 + 0.55 * (1 - a);
  return P(pl, grounded(pl, { x, z, head: hd, pose: { ...POSE.stand(), ...arms, hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend], lift: amp * a }, e, t: t + ph })); };

// ================================================================== the film
export async function build(T) {
  const s = id => T.s(id);
  const nk = x => x.toLowerCase().replace(/[^\w-]/g, '');
  const wn = (id, key, n = 0) => { const ws = T.p(id).words.filter(x => nk(x.w) === nk(key)); if (!ws[n]) throw new Error(`no word ${key} #${n} in ${id}`); return ws[n].s; };
  const cues = [], shots = [], amb = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +Math.max(0, t).toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: DAY_G, trans: 'cut', noJump: true, kb: 0, ...o });
  const CROWDED = ['face cut by frame', 'player hidden', 'face behind player'];

  // ======================= THE OPENING, made to be lifted out whole: a war; not an army; a microphone; his knees; a
  // dressing room; and only then the name =======================
  const stoppedT = wn('hook', 'stopped'), notT = wn('hook', 'Not') - 0.08, withT = wn('hook', 'With', 1) - 0.06, kneesT = wn('hook', 'on') - 0.1, roomT = wn('hook', 'in') - 0.1,
    nameT = wn('hook', 'His', 1) - 0.12, didierT = wn('hook', 'Didier'), ctxA = s('ctx') - 0.19;
  // a ground at night, two lines of armed men face to face, and a footballer who walks between them: seen from behind
  const NIGHT = { arena: ARENA_N, skyP: SKY_NIGHT, turf: TURF_N, boards: [] };
  const SOLX = i => 3.6 + i * 1.5;
  const dM1 = new Mover([[-0.8, -3.4, 0], [1.2, -1.2, 0], [3.6, 1.2, 0], [99, 1.2, 0]], { heading0: 0, face: () => 0 });
  const soldiers = (t, low, d, which = 'both') => { const out = [];
    for (let i = 0; i < 6; i++) { const x = SOLX(i), k = low(i);
      const one = (pl, sx, z, base, ph) => man(t, pl, sx, z, angTo(base, Math.atan2(d.z - z, d.x - sx), 0.4), blend(PORT, LOWERED, k), GRAVE, ph, { prop: rifleProp() });
      if (which !== 'rebels') out.push(one(ARMY[i % 2], x + 0.35, -1.5, PI / 2, i * 1.3));
      if (which !== 'army') out.push(one(REBELS[i % 2], x, 1.5, -PI / 2, i * 1.7 + 4)); }
    return out; };
  shot(0, (g, lt, t) => {
    const d = moving(dM1, t, { e: 'focus', t, I: 0.36 });
    rigFn(lt, t, tt => { const m = dM1.at(tt), u = glide(clamp(tt / notT)); return lookFrom([m.x - lerp(4.3, 3.4, u), lerp(1.7, 2.1, u), 0.4], [m.x + 2.6, 1.15, 0], { fov: 1500, cy: H * 0.47 }); }, { shake: 0.5 });
    stadium(g, t, [P(DROGBA_O, d), ...soldiers(t, () => 0, d)], { ...NIGHT, blur: 2.5 });
  }, { grade: NIGHT_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    title2(g, 'THIS PLAYER', 'STOPPED A WAR', 250, { s1: 84, s2: 108, a: fadeOut(t, notT - 0.12, 0.1), k: 1 + 0.07 * Math.exp(-Math.max(0, t - stoppedT) * 6) * (t > stoppedT ? 1 : 0) });
  } });
  cue(0, 'boom_cine', 0.4); cue(stoppedT, 'boom_move', 0.4); for (let i = 0; i < 4; i++) cue(0.2 + i * 0.52, 'touch', 0.22);
  // "Not with an army": one of the lines, close; the rifles come down one after another
  shot(notT, (g, lt, t) => {
    const low = i => smooth(clamp((t - notT - 0.1 - i * 0.07) / 0.45));
    rigFn(lt, t, tt => { const u = clamp((tt - notT) / (withT - notT)); return lookFrom([SOLX(0) - 0.9 + 0.5 * u, 1.38, -0.1], [SOLX(1) + 0.6, 1.3, 1.5], { fov: 1500, cy: H * 0.4 }); }, { shake: 0.6 });
    stadium(g, t, soldiers(t, low, { x: SOLX(0) - 0.4, z: -0.1 }, 'rebels').slice(1), { ...NIGHT, blur: 3 });
  }, { grade: NIGHT_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED });
  cue(notT, 'whoosh_fast', 0.22); cue(notT + 0.32, 'thud', 0.3);
  // the dressing room. Where each man ends up on his knees (dx, dz from the middle of the room), and what his arms do there
  const DZ = RZ + 0.25, FRONT = PI / 2;
  const SPOTS = [[-0.8, -0.15], [0.8, -0.15], [-1.6, -0.32], [1.6, -0.32], [-0.42, -0.95], [0.42, -0.95], [-1.25, -1.08], [1.25, -1.08], [-0.52, -1.78], [0.58, -1.78]];
  const TO = [KNEEL_REST, KNEEL_REST, KNEEL_PRAY, KNEEL_REST, KNEEL_PRAY, KNEEL_REST, KNEEL_REST, KNEEL_PRAY, KNEEL_REST, KNEEL_REST];
  // u: 0 on his feet .. 1 on his knees
  const drog = (t, u, pose, e, extra = {}) => withMic(P(DROGBA_W, kneelDown(DROGBA_W, { x: RX, z: DZ, head: FRONT, pose, e, t, ...extra }, u, KNEEL)));  // he and his microphone
  const mates = (t, uOf, { e = 'sad', bow = 0.3, own = null } = {}) => SPOTS.map(([dx, dz], i) => { const u = clamp(uOf(i));
    return P(MATES_W[i], kneelDown(MATES_W[i], { x: RX + dx, z: DZ + dz, head: FRONT + dx * 0.09, pose: { look: -bow * (0.4 + 0.3 * (i % 3)) * smooth(u), ...(own ? own(i) : {}) }, e: typeof e === 'function' ? e(i) : e, t: t + i * 1.3 }, u, TO[i])); });
  // "With a microphone": a hand brings one up to a mouth. The eyes stay out of the picture
  shot(withT, (g, lt, t) => {
    const k = smooth(clamp((t - withT - 0.05) / 0.6));
    rigFn(lt, t, tt => { const u = clamp((tt - withT) / (kneesT - withT)); return K(PI + 0.1 - 0.08 * u, 0.02, lerp(1.5, 1.34, u), [RX + 0.02, lerp(1.185, 1.235, u), DZ - 0.42], { fov: 3000, cy: H * 0.5 }); }, { shake: 0.5 });
    room(g, drog(t, 0, blend({ sh: [[0.1, 0.09], [0.25, 0.1]], el: [0.32, 0.7], fore: [0.09, 0.1], lean: 0.02 }, { ...MIC_ARMS(t), lean: 0.02 }, k), { ...GRAVE, mouth: 'o', open: 0.12 * k }),
      { blur: 6, back: mates(t, () => 0, { e: 'focus', bow: 0 }).slice(4) });
  }, { grade: ROOM_G, qaAllow: CROWDED });
  cue(withT, 'whoosh_soft', 0.2); cue(withT + 0.5, 'touch', 0.3);
  // "on his knees": from the floor. His knees come down, then the knees either side of him
  shot(kneesT, (g, lt, t) => {
    const u = i => clamp((t - kneesT - 0.12 - i * 0.1) / 0.5);
    rigFn(lt, t, tt => { const v = clamp((tt - kneesT) / (roomT - kneesT)); return lookFrom([RX + 0.85 - 0.3 * v, 0.2, DZ + 2.35], [RX + 0.05, 0.2, DZ + 0.1], { fov: 3300, cy: H * 0.42 }); }, { shake: 0.8 });
    const ms = mates(t, i => u(1 + (i % 4)), { e: 'sad' });
    room(g, [...drog(t, u(0), { ...MIC_ARMS(t), lean: 0.03 }, GRAVE), ms[0], ms[1]], { blur: 4, back: ms.slice(2) });
  }, { grade: ROOM_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED });
  cue(kneesT, 'whoosh_fast', 0.2); cue(kneesT + 0.52, 'thud', 0.55); cue(kneesT + 0.64, 'thud', 0.4); cue(kneesT + 0.78, 'thud', 0.35);
  // "in a dressing room": all of it, past the back of the man with the television camera
  const CREWP = [RX + 0.66, DZ + 2.75];
  const crewMan = (t, dx = 0, dz = 0) => P(CREW, { x: CREWP[0] + dx + 0.012 * Math.sin(t * 2.1), z: CREWP[1] + dz, head: -PI / 2 + 0.08, pose: { ...POSE.stand(), sh: [[0.6, 0.3], [1.5, 0.45]], el: [1.2, 1.7], lean: 0.05 }, e: 'focus', t: t + 7, prop: tvCamProp() });
  shot(roomT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - roomT) / (nameT - roomT)); return lookFrom([RX + 0.3 - 0.12 * v, 1.74, DZ + 5.0 - 0.55 * v], [RX - 0.1, 0.95, DZ - 0.3], { fov: 1900, cy: H * 0.42 }); }, { shake: 0.6 });
    room(g, [...drog(t, 1, { ...MIC_ARMS(t), look: -0.3, lean: 0.06 }, { ...EXPR.sad, lid: 0.45 }), ...mates(t, () => 1), crewMan(t)], { blur: 1.5 });
  }, { grade: ROOM_G, qaAllow: CROWDED });
  cue(roomT, 'whoosh_soft', 0.2);
  // "His name?" His head is down. "Didier Drogba": it comes up, into the lens
  shot(nameT, (g, lt, t) => {
    const up = ease.inOut(clamp((t - didierT + 0.3) / 0.5));
    rigFn(lt, t, tt => { const v = glide(clamp((tt - nameT) / (ctxA - nameT))); return K(PI - 0.14 + 0.1 * v, 0.03, lerp(2.3, 1.95, v), [RX, 1.13, DZ], { fov: 2600, cy: H * 0.475 }); }, { shake: 0.4 });
    room(g, drog(t, 1, { ...MIC_ARMS(t), look: lerp(-0.55, 0.06, up), lean: lerp(0.1, 0.02, up) }, { ...GRAVE, lid: lerp(0.94, 0.2, up), mouth: 'line' }), { blur: 5, back: mates(t, () => 1) });
  }, { grade: ROOM_G, qaAllow: CROWDED, hud: (g, lt, t) => {
    title2(g, 'DIDIER', 'DROGBA', 196, { c2: ORANGE, s1: 88, s2: 128, a: clamp((t - didierT + 0.05) / 0.08), k: 1 + 0.1 * Math.exp(-Math.max(0, t - didierT + 0.05) * 6) });
  } });
  cue(nameT, 'whoosh_soft', 0.2); cue(nameT + 0.1, 'heartbeat', 0.5); cue(didierT, 'boom_cine', 0.5); cue(didierT + 0.02, 'reveal_bell', 0.35);

  // ======================= 8 OCTOBER 2005. Omdurman: Sudan 1–3 Ivory Coast. Yaoundé, at the same hour: Cameroon 1–1 Egypt,
  // and a penalty in injury time =======================
  const ctxS = s('ctx'), ivoryT = wn('ctx', 'Ivory') - 0.14, winT = wn('ctx', 'win'), rivalsT = wn('ctx', 'their') - 0.11, missT = wn('ctx', 'miss'), andT = wn('ctx', 'and') - 0.1, firstT = wn('ctx', 'first'), micA = s('mic') - 0.2;
  const OMD = { arena: ARENA_S, skyP: SKY_DUSK, turf: TURF, boards: BOARDS_S };
  // the ground from high up, the game going on: a pass forward to the number 11
  const ball7 = new BallPath([
    { t0: ctxA - 1, t1: ctxA + 0.35, kind: 'fn', fn: tt => [6.5 + 2.6 * (tt - ctxA) + 0.45, BALL_R, -7 + 0.5 * (tt - ctxA) + 0.05] },
    { t0: ctxA + 0.35, t1: ctxA + 1.5, kind: 'roll', from: [7.86, BALL_R, -6.775], to: [21.05, BALL_R, 2.0], decay: 1.1 },
    { t0: ctxA + 1.5, t1: 99, kind: 'fn', fn: tt => [15.5 + 3.4 * (tt - ctxA) + 0.45, BALL_R, 2.5 - 0.3 * (tt - ctxA) - 0.05] }]);
  const play7 = t => { const a = ctxA; return [
    jog(t, a, MATES_W[3], 6.5, -7, 2.6, 0.5, 0), jog(t, a, DROGBA_W, 15.5, 2.5, 3.4, -0.3, 1), jog(t, a, MATES_W[2], 12, 14, 3.0, -0.6, 2), jog(t, a, MATES_W[4], 10, -17, 2.8, 0.4, 3),
    jog(t, a, MATES_W[0], -6, -5, 1.6, 0, 4), jog(t, a, MATES_W[1], -8, 7, 1.6, 0.2, 5), jog(t, a, MATES_W[5], 2, 3, 2.2, 0.1, 2.5), jog(t, a, MATES_W[6], -3, 16, 1.8, -0.2, 0.7), jog(t, a, MATES_W[7], -4, -19, 1.9, 0.2, 3.6),
    jog(t, a, SUDS[0], 21, -3, 1.9, 0.3, 6, 'worried'), jog(t, a, SUDS[1], 24, 6, 1.8, -0.4, 7, 'worried'), jog(t, a, SUDS[2], 17, -10, 2.0, 0.5, 8, 'worried'), jog(t, a, SUDS[3], 12, 6, 2.4, -0.2, 9, 'worried'),
    jog(t, a, SUDS[0], 28, -14, 1.4, 0.3, 1.5, 'worried'), jog(t, a, SUDS[1], 30, 15, 1.3, -0.3, 4.4, 'worried'), jog(t, a, SUDS[2], 33, 1, 1.0, 0, 5.2, 'worried'),
    man(t, GK_M, 49, 0, PI, SET, 'focus', 3), man(t, GK_E, -47, 0, 0, {}, 'focus', 5), ballOf(ball7, t)]; };
  shot(ctxA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - ctxA) / (ivoryT - ctxA))); return K(0.62 - 0.36 * v, lerp(0.42, 0.13, v), lerp(72, 19, v), [lerp(6, 19, v), 1, lerp(0, 1.8, v)], { cy: H * lerp(0.5, 0.55, v) }); }, { shake: 0.2 });
    stadium(g, t, play7(t), { ...OMD, cheer: 0.5, blur: 1.2 });
  }, { grade: DUSK_G, mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Omdurman, Sudan', '8 October 2005', { y: 190, t0: 0.1 });
    if (t > ctxS + 0.75) plate(g, 'WORLD CUP QUALIFIER · THE LAST DAY', W / 2, 340, { color: CREAM, size: 34, ...pin(t, ctxS + 0.75) });
  } });
  cue(ctxA, 'whoosh_soft', 0.25); cue(ctxA + 0.35, 'kick', 0.3); cue(ctxS + 0.75, 'reveal_bell', 0.25);
  // full time, 1–3: the men in white, close
  const joyers = (t, cx, cz, k = 1) => [
    hopper(t, MATES_W[0], cx - 1.05, cz - 0.7, FRONT + 0.3, 0.4), hopper(t, MATES_W[2], cx + 1.05, cz - 0.65, FRONT - 0.3, 1.7), hopper(t, MATES_W[4], cx - 0.45, cz - 1.5, FRONT + 0.1, 2.9, { amp: 0.12 }),
    hopper(t, MATES_W[1], cx + 0.55, cz - 1.6, FRONT - 0.15, 0.9, { amp: 0.13 }), hopper(t, MATES_W[3], cx - 1.9, cz - 1.7, FRONT + 0.4, 2.2, { arms: { sh: [[2.3, 0.7], [2.3, 0.7]], el: [1.2, 1.2] } }),
    hopper(t, MATES_W[5], cx + 1.95, cz - 1.8, FRONT - 0.4, 3.4, { arms: { sh: [[2.3, 0.7], [2.3, 0.7]], el: [1.2, 1.2] } }),
    hopper(t, DROGBA_W, cx, cz, FRONT + 0.06 * Math.sin(t * 1.7), 0, { amp: 0.1 * k, rate: 5.2, arms: { sh: [[2.25 + 0.25 * Math.sin(t * 10.4), 0.55], [2.25 - 0.25 * Math.sin(t * 10.4), 0.55]], el: [1.35, 1.35], lean: -0.05 } })];
  shot(ivoryT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - ivoryT) / (rivalsT - ivoryT))); return K(PI - 0.3 + 0.36 * v, 0.04, lerp(4.9, 3.9, v), [10, 1.25, -0.5], { cy: H * 0.53 }); }, { shake: 0.9 });
    stadium(g, t, [...joyers(t, 10, 0), jog(t, ivoryT, MATES_W[6], 3.5, -7.5, 3.6, 0.5, 1.2, JOY, { sh: [[2.5, 0.6], [2.5, 0.6]], el: [0.4, 0.4] }), man(t, SUDS[0], 15.5, -9, 2.6, HIPS, 'sad', 1), man(t, SUDS[1], 4.5, -12, 0.5, { ...HIPS, look: -0.4 }, 'sad', 4)],
      { ...OMD, cheer: 0.25, blur: 3 });
  }, { grade: DUSK_G, mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'SUD', 'CIV', 1, 3, 'FT', { colL: '#B8202C', colR: ORANGE });
    plate(g, 'FULL TIME', W / 2, 300, { color: CREAM, size: 52, ...pin(t, ivoryT + 0.1) });
    if (t > winT + 0.4) plate(g, 'NOW CAMEROON MUST NOT WIN', W / 2, 400, { color: GOLD, size: 38, ...pin(t, winT + 0.4) });
  } });
  cue(ivoryT, 'whoosh_fast', 0.22); cue(ivoryT + 0.05, 'whistle', 0.5); cue(ivoryT + 0.4, 'whistle', 0.55); cue(winT + 0.4, 'stamp', 0.35);
  // Yaoundé. Womé's penalty, deep in injury time: against the post and away. From behind him; at the post; his face
  const YAO = { arena: ARENA_Y, skyP: SKY_DAY, turf: TURF, boards: BOARDS_Y };
  const tK = missT - 0.05, tP = tK + 0.42, postA = tK + 0.07, faceA = tP + 0.42;
  const wM = new Mover([[tK - 1.7, 37.6, -1.95], [tK - 0.3, 40.75, -0.3], [tK, 41.2, -0.1], [tK + 0.45, 42.0, 0.05, { stop: true }], [99, 42.0, 0.05]], { heading0: 0.45 });
  const gkM9 = new Mover([[tK - 4, 51.9, 0], [99, 51.9, 0]], { heading0: PI, face: () => PI });
  const ball9 = new BallPath([
    { t0: tK - 5, t1: tK, kind: 'hold', from: [41.5, BALL_R, 0] },
    { t0: tK, t1: tP, kind: 'air', from: [41.5, BALL_R, 0], to: [52.38, 0.6, 3.74], g: 3 },
    { t0: tP, t1: tP + 0.75, kind: 'air', from: [52.38, 0.6, 3.74], to: [55.6, BALL_R, 7.6] },
    { t0: tP + 0.75, t1: tP + 1.8, kind: 'roll', from: [55.6, BALL_R, 7.6], to: [57.6, BALL_R, 9.9] },
    { t0: tP + 1.8, t1: 99, kind: 'hold', from: [57.6, BALL_R, 9.9] }]);
  const yao = (g, t, { blur = 1.5, face = false } = {}) => { const kick = runKick(wM, t, tK, 'L', { e: 'focus' }), sad = smooth(clamp((t - tP - 0.12) / 0.4));
    const wome = P(WOME, sad > 0 ? { ...kick, pose: blend(kick.pose, { ...DESPAIR, handsFront: face }, sad), e: 'shock' } : kick);
    stadium(g, t, [wome, P(GK_E, keeper(GK_E, gkM9, t, { dive: { t0: tK - 0.05, dur: 0.5, side: -1, dz: 2.2 }, face: PI })), ballOf(ball9, t, { trail: t > tK && t < tP + 0.5 ? trailOf(ball9, t) : null })], { ...YAO, cheer: 0.7 - 0.5 * sad, blur }); };
  const yaoHud = (g, lt, t) => {
    scoreBug(g, 'CMR', 'EGY', 1, 1, '90+', { colL: '#1F8A4C', colR: '#C8202C' });
    plate(g, 'YAOUNDÉ · A PENALTY IN INJURY TIME', W / 2, 225, { color: CREAM, size: 36, ...pin(t, rivalsT + 0.15) });
    if (t > tP + 0.03) plate(g, 'OFF THE POST', W / 2, 330, { color: RED, ink: '#FFF4E8', size: 60, ...pin(t, tP + 0.03) });
  };
  shot(rivalsT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - rivalsT) / (postA - rivalsT)); return lookFrom([lerp(35.0, 36.4, v), 1.55, -1.1], [48.5, 1.1, 0.9], { fov: 1650, cy: H * 0.45 }); }, { shake: 0.7 });
    yao(g, t);
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: yaoHud });
  shot(postA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - postA) / (faceA - postA)); return lookFrom([47.6 + 0.3 * v, 0.8, 8.2 - 0.4 * v], [52.5, 0.75, 3.3], { fov: 1900, cy: H * 0.47 }); }, { shake: 0.8 + (t > tP ? 4 * Math.exp(-(t - tP) * 6) : 0) });
    yao(g, t, { blur: 2 });
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: yaoHud });
  shot(faceA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - faceA) / (andT - faceA))); return lookFrom([44.9 - 0.25 * v, 1.35, 2.9 - 0.2 * v], [42.0, 1.5, 0.05], { fov: 2300, cy: H * 0.42 }); }, { shake: 0.6 });
    yao(g, t, { blur: 3.5, face: true });
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: yaoHud });
  cue(rivalsT, 'whoosh_fast', 0.22); cue(rivalsT + 0.5, 'heartbeat', 0.5); cue(tK - 0.02, 'kick', 0.85); cue(tP - 0.01, 'thud', 0.75); cue(tP + 0.02, 'crowd_gasp', 0.7); cue(tP + 0.04, 'stamp', 0.4); cue(faceA, 'whoosh_soft', 0.18);
  // Omdurman again: they are going to a World Cup
  // three more come running in with their arms out and join the jumping
  const runIn = (pl, x0, z0, ph) => { const x1 = x0 + (10 - x0) * 0.82, z1 = z0 + (-2.6 - z0) * 0.82; return { pl, ph, mv: new Mover([[andT - 0.3, x0, z0], [andT + 1.45, x1, z1, { stop: true }], [99, x1, z1]], { face: tt => (tt > andT + 1.2 ? FRONT : null), turn: 6 }) }; };
  const RUN10 = [runIn(MATES_W[6], 0.5, -5.5, 0.6), runIn(MATES_W[7], 19.5, -6.5, 2.3), runIn(MATES_W[8], 9, -12, 4.1)];
  const runner = (r, t) => { const ms = moving(r.mv, t, { e: JOY, t: t + r.ph }), k = smooth(clamp((t - andT - 1.3) / 0.35)), a = Math.abs(Math.sin(t * 6.5 + r.ph)), bend = 0.2 + 0.55 * (1 - a);
    const pose = blend(blend(ms.pose, { sh: [[2.5, 0.6], [2.5, 0.6]], el: [0.4, 0.4] }, 0.85), { ...POSE.stand(), ...POSE.armsUp(1), hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend] }, k);
    return P(r.pl, grounded(r.pl, { ...ms, pose: { ...pose, lift: 0.15 * a * k } })); };
  shot(andT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - andT) / (micA - andT))); return K(PI + 0.42 - 0.75 * v, lerp(0.1, 0.05, v), lerp(6.6, 4.4, v), [10, 1.25, -0.6], { cy: H * 0.53 }); }, { shake: 1.0 });
    stadium(g, t, [...joyers(t, 10, 0, 1.4), ...RUN10.map(r => runner(r, t))], { ...OMD, cheer: 0.3, blur: 3 });
  }, { grade: DUSK_G, mbStep: 3, mbMax: 16, qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'CMR', 'EGY', 1, 1, 'FT', { colL: '#1F8A4C', colR: '#C8202C', al: fadeOut(t, firstT - 0.3, 0.2) });
    if (t > firstT - 0.08) { title2(g, 'FIRST', 'WORLD CUP', 250, { c2: GOLD, s1: 92, s2: 124, a: clamp((t - firstT + 0.08) / 0.1), k: 1 + 0.1 * Math.exp(-Math.max(0, t - firstT + 0.08) * 6) });
      plate(g, 'IVORY COAST · GERMANY 2006', W / 2, 480, { color: ORANGE, ink: '#FFFFFF', size: 40, ...pin(t, firstT + 0.55) }); }
  } });
  cue(andT, 'whoosh_fast', 0.22); cue(andT + 0.05, 'crowd_roar', 0.5); cue(firstT - 0.08, 'boom_cine', 0.5); cue(firstT + 0.55, 'stamp', 0.4);
  // ======================= THE DRESSING ROOM: a party, a television camera, and a man who asks for the microphone =======================
  const micS = s('mic'), insteadT = wn('mic', 'Instead') - 0.1, takesT = wn('mic', 'Drogba') - 0.12, takeT = wn('mic', 'takes') + 0.1, warA = s('war') - 0.18;
  // where they dance: anywhere but in rows. Then each walks to where he will stand behind him
  const PARTY = [[-1.1, -0.4], [1.0, -0.6], [-0.3, -1.3], [0.7, -1.6], [-1.9, -1.3], [1.9, -1.4], [-1.0, -2.1], [1.4, -2.3], [0.1, -2.4], [2.6, -0.5]];
  const dance = (t, i, k) => { const a = Math.abs(Math.sin(t * (6.2 + 0.5 * (i % 3)) + i * 1.9)), bend = 0.2 + 0.55 * (1 - a) * k, sw = Math.sin(t * 12 + i);
    return { ...POSE.stand(), ...(i % 3 === 2 ? { sh: [[lerp(0.1, 1.9 + 0.5 * sw, k), lerp(0.09, 0.5, k)], [lerp(0.1, 1.9 - 0.5 * sw, k), lerp(0.09, 0.5, k)]], el: [lerp(0.32, 1.3, k), lerp(0.32, 1.3, k)] } : POSE.armsUp(k)),
      hip: [[bend * 0.5, 0.08], [bend * 0.5, 0.08]], knee: [bend, bend], lift: 0.15 * a * k }; };
  const party = t => PARTY.map(([dx, dz], i) => P(MATES_W[i], grounded(MATES_W[i], { x: RX + dx, z: DZ + dz, head: FRONT + (i % 2 ? -0.5 : 0.5) * Math.sin(t * 1.3 + i), pose: dance(t, i, 1), e: JOY, t: t + i * 1.9 })));
  shot(micA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - micA) / (insteadT - micA))); return K(PI + 0.3 - 0.5 * v, 0.04, lerp(4.2, 3.5, v), [RX + lerp(0.5, 0.0, v), 1.25, DZ - 1.1], { fov: 1700, cy: H * 0.52 }); }, { shake: 1.5 });
    room(g, party(t), { blur: 2 });
  }, { grade: ROOM_G, mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => {
    plate(g, 'THE VISITORS’ DRESSING ROOM', W / 2, 225, { color: CREAM, size: 38, ...pin(t, micA + 0.15) });
  } });
  cue(micA, 'whoosh_fast', 0.22); cue(micA + 0.05, 'applause', 0.3);
  // "Instead": past the man with the camera. He comes out of the dancing and up to the lens; behind him they stop, and gather
  const dM12 = new Mover([[insteadT - 0.3, RX + 0.5, DZ - 1.75], [insteadT + 0.35, RX + 0.5, DZ - 1.75, { stop: true }], [takesT - 0.3, RX, DZ - 0.42, { stop: true }], [99, RX, DZ - 0.42]], { heading0: FRONT, face: () => FRONT });
  const GATH = SPOTS.map(([dx, dz], i) => { const [px, pz] = PARTY[i], a = insteadT + 0.55 + 0.09 * i;
    return new Mover([[insteadT - 0.5, RX + px, DZ + pz], [a, RX + px, DZ + pz, { stop: true }], [a + 1.5, RX + dx, DZ + dz - 0.42, { stop: true }], [99, RX + dx, DZ + dz - 0.42]], { heading0: FRONT, face: tt => (tt > a + 0.9 ? FRONT + dx * 0.09 : null), turn: 5 }); });
  const gather = t => GATH.map((mv, i) => { const k = 1 - smooth(clamp((t - insteadT - 0.15 - 0.09 * i) / 0.45)), ms = moving(mv, t, { e: k > 0.5 ? JOY : 'focus', t: t + i * 1.9, I: 0.36 }), w = clamp(ms.sp / 0.6);
    return P(MATES_W[i], grounded(MATES_W[i], { ...ms, head: k > 0.01 ? angTo(ms.head, FRONT + (i % 2 ? -0.5 : 0.5) * Math.sin(t * 1.3 + i), k) : ms.head, pose: blend(dance(t, i, k), ms.pose, w * (1 - k)) })); });
  shot(insteadT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - insteadT) / (takesT - insteadT))); return lookFrom([RX + 0.3 - 0.1 * v, 1.74, DZ + lerp(4.75, 4.3, v)], [RX - 0.05, 1.2, DZ - 0.5], { fov: 1900, cy: H * 0.42 }); }, { shake: 0.8 });
    const ds = moving(dM12, t, { e: GRAVE, t, I: 0.36 });
    room(g, [...gather(t), P(DROGBA_W, ds), crewMan(t)], { blur: 1.5 });
  }, { grade: ROOM_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    const cT = wn('mic', 'national') - 0.1; if (t > cT) plate(g, 'NATIONAL TELEVISION', W / 2, 225, { color: '#C8202C', ink: '#FFFFFF', size: 40, ...pin(t, cT) });
  } });
  cue(insteadT, 'record_scratch', 0.3); cue(insteadT + 0.02, 'whoosh_deep', 0.25); cue(wn('mic', 'national') - 0.1, 'stamp', 0.3);
  // through the lens. A hand holds a microphone out to him: he takes it, and it goes up to his mouth
  const REACH = { sh: [[0.1, 0.09], [1.05, 0.05]], el: [0.32, 0.45], fore: [0.09, 0.0], lean: 0.05 };
  const DSTAND = { x: RX, z: DZ - 0.42, head: FRONT };
  const HM = skeleton(DROGBA_W, grounded(DROGBA_W, { ...DSTAND, pose: { ...POSE.stand(), ...REACH } })).arms[1].hand;
  const offer = (pos, held) => ({ d: depth(pos[0], pos[1], pos[2]) - 0.4, draw: g => { const h = B.project(pos[0], pos[1] - 0.085, pos[2]), e = B.project(pos[0] + 0.55, pos[1] - 0.95, pos[2] + 0.55); if (h.z < 0.2 || e.z < 0.2) return; const u = h.s;
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#3A4252'; g.lineWidth = 0.1 * u; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(lerp(e.x, h.x, 0.9), lerp(e.y, h.y, 0.9)); g.stroke();
    g.fillStyle = SKIN_M.base; g.beginPath(); g.arc(h.x, h.y, 0.052 * u, 0, 2 * PI); g.fill(); g.restore();
    if (held) drawMic(g, h.x, h.y, 0, -1, u, 0.03); } });
  shot(takesT, (g, lt, t) => {
    const inn = ease.out(clamp((t - takesT - 0.05) / 0.45)), out = smooth(clamp((t - takeT - 0.12) / 0.4)), reach = smooth(clamp((t - takeT + 0.42) / 0.4)), up = smooth(clamp((t - takeT - 0.08) / 0.55)), has = t >= takeT;
    rigFn(lt, t, tt => { const v = glide(clamp((tt - takesT) / (warA - takesT))); return K(PI + 0.05 - 0.04 * v, 0.02, lerp(2.3, 2.0, v), [RX, 1.36, DZ - 0.42], { fov: 2400, cy: H * 0.4 }); }, { shake: 1.0 });
    const pose = blend(blend({ ...POSE.stand() }, REACH, reach), { ...MIC_ARMS(t), lean: 0.03 }, up), k2 = (1 - inn) + out;
    const hand = [HM[0] + 0.5 * k2, HM[1] + 0.02 - 0.75 * k2, HM[2] + 0.02 + 0.5 * k2];
    const dIt = P(DROGBA_W, grounded(DROGBA_W, { ...DSTAND, pose, e: has && up > 0.6 ? { ...GRAVE, mouth: 'o', open: 0.1 } : GRAVE, t }));
    room(g, [dIt, ...(has ? [micOf(dIt)] : []), ...(k2 < 1.2 ? [offer(hand, !has)] : [])],
      { blur: 3.5, back: mates(t, () => 0, { e: 'focus', bow: 0 }) });
  }, { grade: TV_G, qaAllow: CROWDED, hud: (g, lt, t) => { recMark(g, t, { a: clamp((t - takesT) / 0.15) }); } });
  cue(takesT, 'whoosh_fast', 0.2); cue(takesT + 0.02, 'radio_static', 0.2); cue(takeT, 'touch', 0.45);

  // ======================= WHY: THE MAP. A country cut in two since September 2002 =======================
  const warS = s('war'), cutT = wn('war', 'cut'), twoT = wn('war', 'two'), northT = wn('war', 'rebels'), southT = wn('war', 'army') - 0.15, civilA = wn('war', 'A') - 0.14, civilT = wn('war', 'civil'), pleaA = s('plea') - 0.12;
  shot(warA, (g, lt, t) => {
    const crack = clamp((t - cutT + 0.3) / 0.55), split = ease.out(clamp((t - twoT + 0.12) / 0.6)), hiN = smooth(clamp((t - northT) / 0.3)), hiS = smooth(clamp((t - southT) / 0.3));
    const m = { cx: W / 2, cy: 770, s: 120 * (1 + 0.04 * clamp(lt / (civilA - warA))) }, gap = 30 * split * (m.s / 125);
    mapBack(g, m); mapCI(g, m, { crack: split > 0.02 ? 0 : crack, split, hiN, hiS });  // the country is there from the first frame (it used to fade in from the dark sheet: a black hole after the cut)
    for (let i = 0; i < 3; i++) { mapSoldier(g, MX(m, -7.2 + i * 0.72), MY(m, 8.95 - (i % 2) * 0.22) - gap / 2, 0.95, true, smooth(clamp((t - northT - 0.12 - i * 0.11) / 0.2)));
      mapSoldier(g, MX(m, -7.4 + i * 0.72), MY(m, 5.95 + (i % 2) * 0.2) + gap / 2, 0.95, false, smooth(clamp((t - southT - 0.12 - i * 0.11) / 0.2))); }
    if (t > northT) plate(g, 'REBELS', MX(m, -4.15), MY(m, 8.95) - gap / 2, { color: '#D2A858', size: 46, rot: 0, ...pin(t, northT) });
    if (t > southT) plate(g, 'THE ARMY', MX(m, -4.45), MY(m, 6.25) + gap / 2, { color: '#62A068', ink: '#0E1A10', size: 46, rot: 0, ...pin(t, southT) });
    mapDot(g, m, 'bouake', 'BOUAKÉ', { a: hiN, dy: -gap / 2, col: '#F3E3B8', size: 28 });
    mapDot(g, m, 'abidjan', 'ABIDJAN', { a: hiS, dy: gap / 2, col: '#D9F0D9', size: 28, side: -1 });
  }, { grade: MAP_G, kb: 0.02, hud: (g, lt, t) => {
    plate(g, 'IVORY COAST', W / 2, 205, { color: CREAM, size: 54, ...pin(t, warS + 0.15) });
    if (t > twoT - 0.1) plate(g, 'CUT IN TWO SINCE 2002', W / 2, 302, { color: RED, ink: '#FFF4E8', size: 40, ...pin(t, twoT - 0.1) });
  } });
  cue(warA, 'whoosh_deep', 0.3); cue(cutT - 0.3, 'riser', 0.25); cue(twoT - 0.12, 'boom_cine', 0.55); cue(twoT - 0.1, 'stamp', 0.4); cue(northT, 'stamp', 0.35); cue(southT, 'stamp', 0.35);
  // "A civil war": the cut itself, close, armed men on both sides of it
  shot(civilA, (g, lt, t) => {
    const v = clamp(lt / (pleaA - civilA)), sc = lerp(232, 258, glide(v)), m = { cx: W / 2 - 0.28 * 0.99 * sc, cy: 800 - 0.08 * sc, s: sc }, gap = 30 * (sc / 125);
    mapBack(g, m); mapCI(g, m, { split: 1, hiN: 1, hiS: 1 });
    const red = g.createLinearGradient(0, 560, 0, 1040); red.addColorStop(0, 'rgba(200,40,36,0)'); red.addColorStop(0.5, `rgba(200,40,36,${(0.16 + 0.06 * Math.sin(t * 7)).toFixed(3)})`); red.addColorStop(1, 'rgba(200,40,36,0)'); g.fillStyle = red; g.fillRect(0, 560, W, 480);
    const pop = i => ease.out(clamp((t - civilA - 0.05 - i * 0.06) / 0.2));
    [[-6.9, 7.98], [-5.6, 8.15], [-4.4, 8.4]].forEach(([lo, la], i) => mapSoldier(g, MX(m, lo), MY(m, la) - gap / 2, 1.55 * pop(i), true, pop(i)));
    [[-6.4, 6.42], [-5.1, 6.58], [-3.9, 6.95]].forEach(([lo, la], i) => mapSoldier(g, MX(m, lo), MY(m, la) + gap / 2, 1.55 * pop(i + 3), false, pop(i + 3)));
  }, { grade: MAP_G, kb: 0.02, hud: (g, lt, t) => {
    title2(g, 'A CIVIL', 'WAR', 232, { c2: '#FF4B3A', s1: 96, s2: 176, a: clamp((t - civilT + 0.1) / 0.08), k: 1 + 0.12 * Math.exp(-Math.max(0, t - civilT + 0.1) * 6) });
  } });
  cue(civilA, 'whoosh_fast', 0.25); cue(civilT - 0.1, 'boom_big', 0.6); cue(civilT - 0.08, 'dun_dun', 0.4);

  // ======================= THE PLEA =======================
  const pleaS = s('plea'), andHeT = wn('plea', 'And') - 0.15, pleaseA = wn('plea', 'please') - 0.12, afterA = s('after') - 0.13;
  // the whole team goes down on its knees: he first, then the rows behind him
  shot(pleaA, (g, lt, t) => {
    const u0 = clamp((t - pleaS - 0.22) / 0.6), uI = i => clamp((t - pleaS - 0.4 - i * 0.075) / 0.6);
    rigFn(lt, t, tt => { const v = glide(clamp((tt - pleaA) / (andHeT - pleaA))); return lookFrom([RX + 1.0 - 0.3 * v, lerp(1.6, 1.22, v), DZ + lerp(4.7, 4.15, v)], [RX, lerp(1.15, 0.8, v), DZ - 0.55], { fov: 1900, cy: H * 0.42 }); }, { shake: 0.6 });
    room(g, [...drog(t, u0, { ...MIC_ARMS(t), lean: 0.03, look: -0.2 * smooth(u0) }, GRAVE), ...mates(t, uI)], { blur: 1.5 });
  }, { grade: ROOM_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED });
  cue(pleaA, 'whoosh_soft', 0.2); cue(pleaS + 0.22 + 0.5, 'thud', 0.5); for (let i = 0; i < 5; i++) cue(pleaS + 0.4 + 0.5 + i * 0.15, 'thud', 0.3 - 0.03 * i);
  // "And he begs both sides": the lens on him
  shot(andHeT, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = glide(clamp((tt - andHeT) / (pleaseA - andHeT))); return K(PI + 0.06 - 0.05 * v, 0.02, lerp(2.15, 1.85, v), [RX, 1.12, DZ], { fov: 2600, cy: H * 0.4 }); }, { shake: 1.0 });
    room(g, drog(t, 1, { ...MIC_ARMS(t), sh: [[1.0 + 0.2 * Math.sin(t * 5.2), 0.5], [0.55, 0.1]], el: [0.7, 2.1], lean: 0.06 + 0.02 * Math.sin(t * 4.1) }, PLEAD(t)), { blur: 3.5, back: mates(t, () => 1) });
  }, { grade: TV_G, qaAllow: CROWDED, hud: (g, lt, t) => { recMark(g, t); } });
  cue(andHeT, 'whoosh_soft', 0.2); cue(andHeT + 0.1, 'heartbeat', 0.5); cue(andHeT + 1.1, 'heartbeat', 0.5);
  // "please, lay down your weapons": the television picture itself, on a set at home
  const tvRoom = g => { const wall = g.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#141922'); wall.addColorStop(0.6, '#10141B'); wall.addColorStop(1, '#07090D'); g.fillStyle = wall; g.fillRect(0, 0, W, H); };
  shot(pleaseA, (g, lt, t) => {
    const v = clamp(lt / (afterA - pleaseA)), z = 1 + 0.06 * glide(v);
    tvRoom(g);
    g.save(); g.translate(W / 2, 650); g.scale(z, z); g.translate(-W / 2, -650);
    g.fillStyle = '#1D1612'; g.fillRect(30, 1040, 1020, 44); g.fillStyle = '#17110D'; g.fillRect(64, 1084, 952, 420);
    tvSet(g, IMG.plea, W / 2, 650, 900, t);
    g.restore();
    watcher(g, 205 - 14 * v, 1660, 1.25); watcher(g, 860 + 18 * v, 1715, 1.45, { cap: 'cap' }); watcher(g, 540 + 6 * v, 1790, 1.1);
  }, { grade: TV_G, hud: (g, lt, t) => {
    g.save(); g.font = sans(22, 800); g.letterSpacing = '2px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(233,226,208,0.62)'; const cr = 'ARCHIVE: IVORIAN NATIONAL TELEVISION, 8 OCTOBER 2005'; g.fillText(cr, W / 2, 1150);
    qaRect(g, W / 2 - g.measureText(cr).width / 2, 1136, g.measureText(cr).width, 28, 'text', 'archive credit'); g.restore();
  } });
  cue(pleaseA, 'radio_static', 0.3); cue(pleaseA + 0.02, 'whoosh_deep', 0.25);
  // ======================= AFTERWARDS: the clip on every screen; the two sides at a table; a peace deal =======================
  const afterS = s('after'), weeksT = wn('after', 'for') - 0.05, bothA = wn('after', 'Both') - 0.12, returnT = wn('after', 'return'), marchA = wn('after', 'In') - 0.1, signT = wn('after', 'sign'), dealT = wn('after', 'deal'), bouA = s('bouake') - 0.13;
  // a shop window full of sets, all showing it; people stopped in front of it, soldiers among them
  const WALL = [[150, 330, 1.0, 0.5, 0.5], [580, 330, 1.7, 0.5, 0.62], [1010, 330, 1.25, 0.3, 0.45], [150, 665, 1.5, 0.66, 0.4], [580, 665, 1.0, 0.5, 0.5], [1010, 665, 1.9, 0.52, 0.66], [150, 1000, 1.3, 0.2, 0.5], [580, 1000, 2.1, 0.5, 0.56], [1010, 1000, 1.0, 0.5, 0.5]];
  shot(afterA, (g, lt, t) => {
    const v = clamp(lt / (bothA - afterA)), dx = lerp(55, -75, glide(v)), wx = lerp(-40, 50, glide(v));
    tvRoom(g);
    for (const y of [505, 840, 1175]) { g.fillStyle = '#1C1612'; g.fillRect(0, y - 4, W, 16); }
    WALL.forEach(([x, y, z, fx, fy], i) => tvSet(g, IMG.plea, x + dx, y, 392, t, { z, fx, fy, glow: 0.45, ph: i * 0.37 }));
    const gl = g.createLinearGradient(0, 150, W, 1200); gl.addColorStop(0, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 150, W, 1060);
    watcher(g, 120 + wx, 1650, 1.2, { cap: 'beret' }); watcher(g, 405 + wx * 1.2, 1715, 1.35); watcher(g, 700 + wx * 0.9, 1670, 1.15, { cap: 'cap' }); watcher(g, 985 + wx * 1.1, 1735, 1.3);
  }, { grade: TV_G, hud: (g, lt, t) => {
    if (t > weeksT) plate(g, 'ON EVERY SCREEN · FOR WEEKS', W / 2, 118, { color: GOLD, size: 40, ...pin(t, weeksT) });
  } });
  cue(afterA, 'whoosh_soft', 0.25); cue(afterA + 0.05, 'radio_static', 0.25); cue(weeksT, 'stamp', 0.35);
  // a table: two men come to it from either side and shake hands across it
  const eA = new Mover([[bothA - 0.4, TX0 - 2.9, TZ0 - 1.0], [bothA + 1.05, TX0 - 0.5, TZ0 - 1.0, { stop: true }], [99, TX0 - 0.5, TZ0 - 1.0]], { heading0: 0, face: () => 0 });
  const eB = new Mover([[bothA - 0.4, TX0 + 2.9, TZ0 - 1.0], [bothA + 1.05, TX0 + 0.5, TZ0 - 1.0, { stop: true }], [99, TX0 + 0.5, TZ0 - 1.0]], { heading0: PI, face: () => PI });
  const SHAKE_ARM = t => ({ sh: [[0.1, 0.09], [1.22 + 0.07 * Math.sin(t * 9), -0.32]], el: [0.32, 0.22 + 0.05 * Math.sin(t * 9)], fore: [0.09, -0.32] });
  shot(bothA, (g, lt, t) => {
    const k = smooth(clamp((t - bothA - 0.75) / 0.4));
    rigFn(lt, t, tt => { const v = glide(clamp((tt - bothA) / (marchA - bothA))); return K(PI + 0.12 - 0.2 * v, 0.05, lerp(4.4, 3.1, v), [TX0, 1.3, TZ0 - 0.9], { fov: 1800, cy: H * 0.45 }); }, { shake: 0.4 });
    bgx.setTransform(1, 0, 0, 1, 0, 0); talksRoom(bgx); g.save(); g.filter = 'blur(2px)'; g.drawImage(BG, 0, 0); g.restore();
    const one = (pl, mv, ph) => { const ms = moving(mv, t, { e: 'focus', t: t + ph, I: 0.36 }); return P(pl, { ...ms, pose: blend({ ...ms.pose, fore: [0.09, 0.09] }, SHAKE_ARM(t), k) }); };
    const items = [...tableItems(), one(ENVOYS[0], eA, 0), one(ENVOYS[1], eB, 3)];
    for (const it of items) it.shadow?.(g);
    drawSorted(g, items);
  }, { grade: ROOM_G, mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    if (t > returnT) plate(g, 'PEACE TALKS · OUAGADOUGOU', W / 2, 225, { color: CREAM, size: 40, ...pin(t, returnT) });
  } });
  cue(bothA, 'whoosh_soft', 0.22); cue(bothA + 0.35, 'touch', 0.22); cue(bothA + 0.75, 'touch', 0.22); cue(returnT, 'reveal_bell', 0.25);
  // the agreement, from above: two signatures, and a stamp
  shot(marchA, (g, lt, t) => {
    const v = clamp(lt / (bouA - marchA)), z = 1 + 0.06 * glide(v);
    const cl = g.createRadialGradient(W / 2, 760, 100, W / 2, 760, 1100); cl.addColorStop(0, '#2F5E49'); cl.addColorStop(1, '#16302A'); g.fillStyle = cl; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, 760); g.scale(z, z); g.rotate(-0.03); g.translate(-W / 2, -760);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(120, 350, 860, 840); g.fillStyle = '#F1EBDB'; g.fillRect(110, 336, 860, 840);
    g.fillStyle = '#23262C'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 46px Cinzel'; g.fillText('POLITICAL AGREEMENT', W / 2, 416);
    g.font = sans(26, 800); g.letterSpacing = '4px'; g.fillStyle = '#6A6458'; g.fillText('OUAGADOUGOU · 4 MARCH 2007', W / 2, 474); g.letterSpacing = '0px';
    g.fillStyle = '#C9C2B0'; for (let i = 0; i < 9; i++) g.fillRect(180, 540 + i * 42, i === 8 ? 420 : 720 - (i % 3) * 40, 12);
    for (const [x, lab] of [[330, 'THE GOVERNMENT'], [750, 'THE REBELS']]) { g.fillStyle = '#6A6458'; g.fillRect(x - 150, 1080, 300, 3); g.font = sans(20, 800); g.letterSpacing = '3px'; g.fillText(lab, x, 1112); g.letterSpacing = '0px'; }
    // each signature is a line of loops that the pen draws; the hand that holds the pen comes with it
    const sig = (x0, k, seed) => { if (k <= 0) return null; g.save(); g.strokeStyle = '#1A2A6A'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); let px = 0, py = 0; const N = 60, n = Math.floor(N * clamp(k));
      for (let i = 0; i <= n; i++) { const u = i / N; px = x0 - 120 + 240 * u; py = 1052 - 26 * Math.sin(u * 11 + seed) * (1 - 0.5 * u) - 14 * Math.sin(u * 23 + seed * 2); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.restore(); return [px, py]; };
    const k1 = clamp((t - signT + 0.2) / 0.5), k2 = clamp((t - signT - 0.45) / 0.5);
    const p1 = sig(330, k1, 1.3), p2 = sig(750, k2, 4.1);
    const at = (x0, seed, k) => { const u = clamp(k); return [x0 - 120 + 240 * u, 1052 - 26 * Math.sin(u * 11 + seed) * (1 - 0.5 * u) - 14 * Math.sin(u * 23 + seed * 2)]; };
    // where the pen is: on its way to the first line, along it, across to the second, along it, and away
    const a0 = signT - 0.75, b0 = at(330, 1.3, 0), b1 = at(330, 1.3, 1), c0 = at(750, 4.1, 0), c1 = at(750, 4.1, 1), mixP = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
    const pen = t < signT - 0.2 ? mixP([760, 1560], b0, ease.out(clamp((t - a0) / 0.55))) : k1 < 1 ? at(330, 1.3, k1) : k2 <= 0 ? mixP(b1, c0, smooth(clamp((t - signT - 0.3) / 0.15))) : k2 < 1 ? at(750, 4.1, k2) : mixP(c1, [1150, 1500], ease.in(clamp((t - signT - 0.95) / 0.5)));
    if (t > a0 && t < signT + 1.5) { const lift = (t < signT - 0.2 || (k1 >= 1 && k2 <= 0) || k2 >= 1) ? 10 : 0, [qx, qy] = [pen[0], pen[1] - lift];
      g.save(); g.lineCap = 'round'; g.strokeStyle = '#22252D'; g.lineWidth = 96; g.beginPath(); g.moveTo(qx + 86, qy + 6); g.lineTo(qx + 420, qy + 520); g.stroke();
      g.strokeStyle = '#E9E9E4'; g.lineWidth = 98; g.lineCap = 'butt'; g.beginPath(); g.moveTo(qx + 92, qy + 16); g.lineTo(qx + 106, qy + 38); g.stroke();
      g.translate(qx, qy); g.rotate(0.62); g.fillStyle = '#15161A'; g.beginPath(); g.moveTo(0, 0); g.lineTo(8, -24); g.lineTo(-8, -24); g.closePath(); g.fill(); g.fillStyle = '#23305E'; g.fillRect(-8, -200, 16, 176); g.fillStyle = '#C9A05A'; g.fillRect(-8, -50, 16, 8);
      g.rotate(-0.62); g.fillStyle = SKIN_D.base; g.beginPath(); g.ellipse(52, -52, 46, 38, 0.5, 0, 2 * PI); g.fill(); g.restore(); }
    g.restore();
  }, { grade: ROOM_G, hud: (g, lt, t) => {
    stamp(g, 'PEACE DEAL', W / 2, 760, lt, dealT - marchA, { color: '#2E8B57', size: 124, rot: -0.1 });
  } });
  cue(marchA, 'whoosh_soft', 0.22); cue(marchA + 0.05, 'paper', 0.4); cue(signT - 0.2, 'pen', 0.6); cue(signT + 0.45, 'pen', 0.6); cue(dealT, 'stamp', 0.7); cue(dealT + 0.02, 'reveal_bell', 0.3);

  // ======================= BOUAKÉ =======================
  const bouS = s('bouake'), playA = wn('bouake', 'play') - 0.1, bouakeT = wn('bouake', 'Bouaké'), rebelT = wn('bouake', 'rebel'), soldA = wn('bouake', 'Soldiers') - 0.12, bothT = wn('bouake', 'both'), sameT = wn('bouake', 'same'), stadT = wn('bouake', 'stadium'),
    goalsA = wn('bouake', 'Ivory') - 0.13, drogA = wn('bouake', 'Drogba', 1) - 0.1, scoresT = wn('bouake', 'scores'), fifthT = wn('bouake', 'fifth'), endS = s('end'), paperA = wn('end', 'one') - 0.1;
  const BOU = { arena: ARENA_B, skyP: SKY_CLOUD, turf: TURF_B, boards: BOARDS_B };
  // 28 March 2007: he brings the African Footballer of the Year's trophy to the rebels' town, and asks for the match
  shot(bouA, (g, lt, t) => {
    const up = ease.out(clamp((t - bouA - 0.15) / 0.5));
    rigFn(lt, t, tt => { const v = glide(clamp((tt - bouA) / (playA - bouA))); return lookFrom([0.7 - 0.5 * v, 1.25, -36 + lerp(3.4, 2.8, v)], [0, 1.55, -36], { fov: 1500, cy: H * 0.5 }); }, { shake: 0.6 });
    stadium(g, t, withMic(man(t, DROGBA_C, 0.03 * Math.sin(t * 1.9), -36, FRONT + 0.07 * Math.sin(t * 1.3), { sh: [[lerp(0.3, 2.85 + 0.07 * Math.sin(t * 4.2), up), 0.22 + 0.05 * Math.sin(t * 2.1)], [0.55, 0.1]], el: [lerp(0.9, 0.12, up), 2.1], fore: [0.22, -0.69], lean: -0.02 + 0.02 * Math.sin(t * 2.6) }, { ...JOY, open: 0.22 + 0.3 * Math.abs(Math.sin(t * 8)) }, 0,
      { prop: trophyProp() })), { ...BOU, cheer: 0.9, blur: 3.5, boards: [], goals: false });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Bouaké', '28 March 2007', { y: 190, t0: 0.1 });
    if (t > bouS + 0.6) plate(g, 'AFRICAN FOOTBALLER OF THE YEAR', W / 2, 340, { color: GOLD, size: 34, ...pin(t, bouS + 0.6) });
  } });
  cue(bouA, 'whoosh_soft', 0.22); cue(bouA + 0.1, 'crowd_roar', 0.4); cue(bouS + 0.6, 'stamp', 0.3);
  // the road north on the map: Abidjan, Yamoussoukro, Bouaké
  const ROAD = [CITY.abidjan, [-4.55, 5.95], CITY.yamoussoukro, [-5.2, 7.3], CITY.bouake];
  const roadAt = k => { const L = ROAD.slice(1).map((p, i) => Math.hypot(p[0] - ROAD[i][0], p[1] - ROAD[i][1])), tot = L.reduce((a, b) => a + b, 0); let d = clamp(k) * tot;
    for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const u = clamp(d / L[i]); return { i, p: [lerp(ROAD[i][0], ROAD[i + 1][0], u), lerp(ROAD[i][1], ROAD[i + 1][1], u)] }; } d -= L[i]; } };
  shot(playA, (g, lt, t) => {
    const zz = glide(clamp(lt / 2.3)), sc = lerp(122, 205, zz), lon0 = lerp(-5.58, -4.75, zz), lat0 = lerp(7.43, 6.75, zz);
    const m = { cx: W / 2 - (lon0 + 5.58) * 0.99 * sc, cy: 770 + (lat0 - 7.43) * sc, s: sc };
    mapBack(g, m); mapCI(g, m, { whole: 1 });
    const k = ease.inOut(clamp((t - playA - 0.25) / (bouakeT - playA - 0.15))), h = roadAt(k);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([18, 14]);
    for (const [col, lw] of [['rgba(12,9,6,0.55)', 13], ['#FFFFFF', 7]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(MX(m, ROAD[0][0]), MY(m, ROAD[0][1])); for (let i = 1; i <= h.i; i++) g.lineTo(MX(m, ROAD[i][0]), MY(m, ROAD[i][1])); g.lineTo(MX(m, h.p[0]), MY(m, h.p[1])); g.stroke(); }
    g.restore();
    mapDot(g, m, 'abidjan', 'ABIDJAN', { col: '#D9F0D9', size: 28 });
    const arr = t > bouakeT - 0.1; mapDot(g, m, 'bouake', arr ? 'BOUAKÉ' : '', { col: arr ? GOLD : '#F3E3B8', size: 44, pulse: arr ? ((t - bouakeT + 0.1) * 0.9) % 1 : 0, a: 1 });
    if (k < 1) { const bx = MX(m, h.p[0]), by = MY(m, h.p[1]); g.save(); g.fillStyle = 'rgba(12,9,6,0.5)'; g.beginPath(); g.arc(bx, by + 4, 22, 0, 2 * PI); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(bx, by, 20, 0, 2 * PI); g.fill();
      g.fillStyle = '#15161A'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = t * 6 + i * 2 * PI / 5; i ? g.lineTo(bx + 8 * Math.cos(a), by + 8 * Math.sin(a)) : g.moveTo(bx + 8 * Math.cos(a), by + 8 * Math.sin(a)); } g.closePath(); g.fill(); g.restore(); }
    if (t > rebelT - 0.1) plate(g, 'THE REBEL CAPITAL', MX(m, CITY.bouake[0]) + 150, MY(m, CITY.bouake[1]) - 86, { color: RED, ink: '#FFF4E8', size: 40, rot: 0, ...pin(t, rebelT - 0.1) });
  }, { grade: MAP_G, kb: 0.02, hud: (g, lt, t) => {
    plate(g, 'THE NEXT HOME MATCH · 3 JUNE 2007', W / 2, 215, { color: CREAM, size: 36, ...pin(t, playA + 0.2) });
  } });
  cue(playA, 'whoosh_deep', 0.28); cue(bouakeT - 0.1, 'reveal_bell', 0.35); cue(rebelT - 0.1, 'stamp', 0.5);
  // 3 June 2007. Along the touchline: soldiers of the army and of the rebellion, side by side, watching a football match
  const LINE = [-4.6, -3.45, -2.3, -1.15, 0, 1.15, 2.3, 3.45, 4.6];
  const WATCH = { sh: [[0.32, -0.08], [0.32, -0.08]], el: [0.95, 0.95], fore: [-0.55, -0.55], lean: 0.02 };
  const FIST_UP = { sh: [[0.3, 0.12], [2.75, 0.3]], el: [0.6, 0.45], fore: [0.1, 0.1], lean: -0.03 };
  const lineMen = t => LINE.map((x, i) => { const rebel = i % 2 === 1, pl = (rebel ? REBELS : ARMY)[(i >> 1) % 2], ch = smooth(clamp((t - stadT - 0.05 - 0.04 * i) / 0.3));
    const pair = i === 3 || i === 4, nod = pair ? smooth(clamp((t - sameT + 0.15) / 0.35)) * (1 - smooth(clamp((t - stadT + 0.25) / 0.3))) : 0;
    const hd = FRONT + 0.25 * Math.sin(t * 0.9 + 0.3) * (1 - nod) + nod * (i === 3 ? -0.8 : 0.8), a = Math.abs(Math.sin(t * 6.5 + i * 1.7));
    return P(pl, grounded(pl, { x, z: -36.4, head: hd, pose: { ...blend({ ...POSE.stand(), ...WATCH }, FIST_UP, ch), lift: 0.1 * a * ch }, e: ch > 0.5 ? JOY : nod > 0.5 ? 'happy' : 'focus', t: t + i * 1.3, prop: rifleProp('slung') })); });
  shot(soldA, (g, lt, t) => {
    rigFn(lt, t, tt => { const v = clamp((tt - soldA) / (goalsA - soldA)), cx = lerp(-1.7, 0.6, v); return lookFrom([cx - 2.4, 1.5, -33.9], [cx + 0.8, 1.35, -36.4], { fov: 1500, cy: H * 0.45 }); }, { shake: 0.5 });
    stadium(g, t, lineMen(t), { ...BOU, cheer: 0.6 + 0.4 * smooth(clamp((t - stadT) / 0.3)), blur: 3, boards: [], goals: false });
  }, { mbStep: 3, mbMax: 12, qaAllow: CROWDED, hud: (g, lt, t) => {
    placeStamp(g, lt, 'Bouaké', '3 June 2007', { y: 190, t0: 0.1 });
    if (t > bothT - 0.1) { plate(g, 'THE ARMY', 330, 345, { color: '#62A068', ink: '#0E1A10', size: 38, ...pin(t, bothT - 0.1) }); plate(g, 'THE REBELS', 740, 345, { color: '#D2A858', size: 38, ...pin(t, bothT + 0.12) }); }
  } });
  cue(soldA, 'whoosh_soft', 0.22); cue(bothT - 0.1, 'stamp', 0.3); cue(bothT + 0.12, 'stamp', 0.3); cue(stadT, 'crowd_roar', 0.5);
  // four goals, one after another: Kalou, Yaya Touré, Koné twice (drawn as four finishes, not after the real ones)
  const N19 = { ...MATES_O[6], num: 19 };
  const GOALS = [{ from: [44.8, -3.2], hit: [0.9, 2.4], cam: 'net', foot: 'R', pl: MATES_O[3] }, { from: [42.6, 5.5], hit: [1.6, -2.6], cam: 'side', foot: 'L', pl: N19 },
    { from: [46.2, 1.2], hit: [0.5, -1.9], cam: 'back', foot: 'R', pl: MATES_O[9] }, { from: [45.2, -5.6], hit: [1.9, 1.5], cam: 'net', foot: 'R', pl: MATES_O[9] }];
  const gDur = (drogA - goalsA) / GOALS.length, goalT = [];
  GOALS.forEach((G, i) => {
    const a = goalsA + i * gDur, tk = a + 0.22, tn = tk + 0.3, [fx, fz] = G.from, [hy, hz] = G.hit; goalT.push(tn);
    const mv = new Mover([[tk - 1.3, fx - 6.5, fz * 1.3], [tk, fx - 0.4, fz], [tk + 0.7, fx + 2.2, fz * 0.9, { stop: true }], [99, fx + 2.2, fz * 0.9]]);
    const dv = new Mover([[tk - 1.3, fx - 4.2, fz * 1.3 + 2.2], [tk, fx + 0.8, fz + 1.5], [tk + 0.7, fx + 2.6, fz + 1.2, { stop: true }], [99, fx + 2.6, fz + 1.2]]);
    const gk = new Mover([[tk - 3, 51.7, 0], [99, 51.7, 0]], { heading0: PI, face: () => PI });
    const bp = new BallPath([{ t0: tk - 3, t1: tk - 0.7, kind: 'hold', from: [fx - 3.4, BALL_R, fz * 1.16] }, { t0: tk - 0.7, t1: tk, kind: 'roll', from: [fx - 3.4, BALL_R, fz * 1.16], to: [fx, BALL_R, fz], decay: 0.8 },
      { t0: tk, t1: tn, kind: 'air', from: [fx, BALL_R, fz], to: [53.2, hy, hz], g: 3 }, { t0: tn, t1: tn + 0.4, kind: 'air', from: [53.2, hy, hz], to: [53.7, BALL_R, hz * 1.03] }, { t0: tn + 0.4, t1: 99, kind: 'hold', from: [53.7, BALL_R, hz * 1.03] }]);
    const cam = tt => { const u = clamp((tt - a) / gDur);
      if (G.cam === 'net') return lookFrom([56.9, 1.55, hz * 0.4 + 1.5 - 0.5 * u], [fx + 1.5, 1.0, fz * 0.55], { fov: 2100, cy: H * 0.45 });
      if (G.cam === 'side') return lookFrom([48.6 + 0.5 * u, 1.5, -13.5], [50.4, 1.0, 0.6], { fov: 1950, cy: H * 0.45 });
      return lookFrom([fx - 7 + 1.2 * u, 1.75, fz - 1.2], [52, 1.15, hz * 0.5], { fov: 2000, cy: H * 0.45 }); };
    shot(a, (g, lt, t) => {
      rigFn(lt, t, cam, { shake: 0.8 + (t > tn ? 3 * Math.exp(-(t - tn) * 7) : 0) });
      stadium(g, t, [P(G.pl, runKick(mv, t, tk, G.foot, { e: t > tn ? JOY : 'focus' })), P(MADS[i % 3], moving(dv, t, { e: 'worried', t: t + 2 })),
        P(GK_M, keeper(GK_M, gk, t, { dive: { t0: tk + 0.06, dur: 0.5, side: hz > 0 ? -1 : 1, dz: hz * 0.72 }, face: PI })), ballOf(bp, t, { trail: t > tk && t < tn + 0.1 ? trailOf(bp, t) : null })],
        { ...BOU, cheer: t > tn ? 1 : 0.5, blur: 1.5, hit: t >= tn ? { t0: tn, y: hy, z: hz, k: 1 } : null, hitSide: 1 });
    }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'CIV', 'MAD', i + (t >= tn ? 1 : 0), 0, '', { colL: ORANGE, colR: '#C8202C', hotL: t >= tn ? Math.exp(-(t - tn) * 5) : 0 }); } });
    cue(a, 'whoosh_fast', 0.2); cue(tk - 0.02, 'kick', 0.6); cue(tn - 0.01, 'net', 0.6); cue(tn, 'crowd_roar', 0.3);
  });
  // the fifth: Drogba
  const tk5 = scoresT - 0.02, tn5 = tk5 + 0.34, celebA = fifthT + 0.12;
  const dM5 = new Mover([[tk5 - 1.5, 37.0, -5.0], [tk5 - 0.5, 42.3, -2.7], [tk5, 44.5, -1.95], [tk5 + 0.45, 46.2, -1.9], [tk5 + 1.3, 47.4, -4.6], [99, 47.4, -4.6]]);
  const dv5 = new Mover([[tk5 - 1.5, 38.6, -2.4], [tk5, 44.9, -0.4], [tk5 + 0.6, 47.0, 0.2, { stop: true }], [99, 47.0, 0.2]]);
  const gk5 = new Mover([[tk5 - 2, 51.2, -0.3], [tk5 - 0.2, 49.6, -0.8, { stop: true }], [99, 49.6, -0.8]], { heading0: PI, face: () => PI });
  const ball5 = new BallPath([{ t0: tk5 - 3, t1: tk5 - 0.75, kind: 'hold', from: [41.6, BALL_R, -2.95] }, { t0: tk5 - 0.75, t1: tk5, kind: 'roll', from: [41.6, BALL_R, -2.95], to: [44.95, BALL_R, -1.8], decay: 0.9 },
    { t0: tk5, t1: tn5, kind: 'air', from: [44.95, BALL_R, -1.8], to: [53.2, 0.5, 2.7], g: 3 }, { t0: tn5, t1: tn5 + 0.4, kind: 'air', from: [53.2, 0.5, 2.7], to: [53.7, BALL_R, 2.8] }, { t0: tn5 + 0.4, t1: 99, kind: 'hold', from: [53.7, BALL_R, 2.8] }]);
  shot(drogA, (g, lt, t) => {
    rigFn(lt, t, tt => { const m = dM5.at(Math.min(tt, tk5 + 0.12)), u = smooth(clamp((tt - tk5) / 0.4)); return lookFrom([m.x - 6.0, 1.8, m.z - 2.6], [lerp(m.x + 3.5, 52.4, u), lerp(1.2, 1.0, u), lerp(m.z + 0.8, 2.0, u)], { fov: lerp(1500, 2000, u), cy: H * 0.45 }); },
      { shake: 0.9 + (t > tn5 ? 4 * Math.exp(-(t - tn5) * 6) : 0) });
    const kk = runKick(dM5, t, tk5, 'R', { e: t > tn5 ? JOY : 'focus' }), fist = smooth(clamp((t - tn5 - 0.05) / 0.35));
    stadium(g, t, [P(DROGBA_O, fist > 0 ? { ...kk, pose: blend(kk.pose, { sh: [[0.4, 0.3], [2.6, 0.5]], el: [1.0, 0.7] }, fist) } : kk), P(MADS[1], moving(dv5, t, { e: 'worried', t: t + 2 })),
      P(GK_M, keeper(GK_M, gk5, t, { dive: { t0: tk5 + 0.04, dur: 0.5, side: -1, dz: 1.3 }, face: PI })), ballOf(ball5, t, { trail: t > tk5 && t < tn5 + 0.1 ? trailOf(ball5, t) : null })],
      { ...BOU, cheer: t > tn5 ? 1 : 0.6, blur: 1.5, hit: t >= tn5 ? { t0: tn5, y: 0.5, z: 2.7, k: 1 } : null, hitSide: 1 });
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => {
    scoreBug(g, 'CIV', 'MAD', 4 + (t >= tn5 ? 1 : 0), 0, '', { colL: ORANGE, colR: '#C8202C', hotL: t >= tn5 ? Math.exp(-(t - tn5) * 4) : 0 });
    if (t > tn5 + 0.05) plate(g, 'DROGBA · THE FIFTH', W / 2, 300, { color: GOLD, size: 52, ...pin(t, tn5 + 0.05) });
  } });
  cue(drogA, 'whoosh_fast', 0.22); cue(tk5 - 0.02, 'kick', 0.85); cue(tn5 - 0.01, 'net', 0.9); cue(tn5, 'crowd_roar', 0.8); cue(tn5, 'boom_move', 0.4); cue(tn5 + 0.05, 'stamp', 0.35);
  // full time. Soldiers of both armies close round him, and he walks off among them with his fist up: the moment of the
  // photograph that follows
  const cM = new Mover([[celebA - 0.5, 30, -31.2], [paperA + 0.5, 30, -28.6]], { heading0: FRONT, face: () => FRONT });
  const FIST = t => ({ sh: [[0.55, 0.15], [2.3 + 0.08 * Math.sin(t * 7), 0.8]], el: [1.35, 0.95], fore: [-0.5, -0.15], lean: -0.03 });
  const escort = (t, pl, dx, dz, ph, arm) => { const m = cM.at(t - 0.02 * ph); return P(pl, { x: m.x + dx, z: m.z + dz, head: FRONT + (dx > 0 ? -0.25 : 0.25), pose: { ...POSE.run(m.phase + ph, 0.36, 0), ...arm, lean: 0.06 },
    e: { ...JOY, open: 0.35 + 0.3 * Math.abs(Math.sin(t * 7 + ph)) }, t: t + ph, prop: rifleProp('slung') }); };
  shot(celebA, (g, lt, t) => {
    const m = cM.at(t);
    rigFn(lt, t, tt => { const mm = cM.at(tt), v = clamp((tt - celebA) / (paperA - celebA)); return lookFrom([mm.x + 0.45 - 0.3 * v, 1.5, mm.z + lerp(3.6, 3.1, v)], [mm.x, 1.42, mm.z], { fov: 2300, cy: H * 0.42 }); }, { shake: 1.4 });
    const dr = P(DROGBA_O, { x: m.x, z: m.z, head: FRONT + 0.18, pose: { ...POSE.run(m.phase, 0.36, 0), ...FIST(t), look: 0.1 }, e: { ...EXPR.happy, lid: 0.1, open: 0.3 + 0.12 * Math.sin(t * 6) }, t });
    stadium(g, t, [dr, escort(t, ARMY[0], 0.82, -0.2, 1.1, { sh: [[1.1, 0.5], [0.3, 0.15]], el: [0.6, 0.5] }), escort(t, ARMY[1], 1.55, -0.75, 2.6, { sh: [[0.3, 0.2], [2.4, 0.4]], el: [0.5, 0.6] }),
      escort(t, REBELS[0], -0.85, -0.25, 3.3, { sh: [[0.3, 0.15], [1.1, 0.5]], el: [0.5, 0.6] }), escort(t, REBELS[1], -1.6, -0.8, 4.4, { sh: [[2.4, 0.4], [0.3, 0.2]], el: [0.6, 0.5] }),
      escort(t, ARMY[0], -0.35, -1.35, 5.2, {}), escort(t, REBELS[0], 0.6, -1.5, 0.4, {})], { ...BOU, cheer: 1, blur: 3, boards: [], goals: false });
  }, { mbStep: 3, mbMax: 14, qaAllow: CROWDED, hud: (g, lt, t) => { scoreBug(g, 'CIV', 'MAD', 5, 0, 'FT', { colL: ORANGE, colR: '#C8202C' }); } });
  cue(celebA, 'whoosh_fast', 0.2); cue(celebA + 0.05, 'whistle', 0.5); cue(celebA + 0.1, 'crowd_roar', 0.5); cue(paperA - 0.06, 'camera', 0.6);

  // ======================= THE NEXT MORNING: the front page, with the photograph =======================
  const five1 = wn('end', 'five'), five2 = wn('end', 'five', 1), warE = wn('end', 'war');
  const PH = { x: 150, y: 462, w: 780, h: 655 };  // where the photograph sits on the page
  shot(paperA, (g, lt, t) => {
    const land = ease.out(clamp(lt / 0.45)), v = clamp(lt / (T.duration - paperA)), z = lerp(1.22, 1.0, land) * (1 + 0.05 * glide(v)), rot = lerp(-0.12, -0.018, land);
    const tb = g.createRadialGradient(W / 2, 800, 100, W / 2, 800, 1200); tb.addColorStop(0, '#3B2C20'); tb.addColorStop(1, '#17100B'); g.fillStyle = tb; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, 700); g.scale(z, z); g.rotate(rot); g.translate(-W / 2, -700);
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(54, 156, 1000, 1700); g.fillStyle = '#EFE8D6'; g.fillRect(40, 140, 1000, 1700);
    g.fillStyle = '#23262C'; g.fillRect(80, 176, 920, 6); g.fillRect(80, 238, 920, 2);
    g.font = sans(24, 800); g.letterSpacing = '5px'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('MONDAY 4 JUNE 2007', 84, 210); g.textAlign = 'right'; g.fillText('SPORT', 996, 210); g.letterSpacing = '0px';
    // the headline, and a marker that runs under each line as it is read
    g.textAlign = 'center'; g.font = '800 62px Cinzel';
    const lines = [['FIVE GOALS TO ERASE', 312, clamp((t - five1) / (five2 - 0.15 - five1))], ['FIVE YEARS OF WAR', 396, clamp((t - five2) / (warE + 0.45 - five2))]];
    for (const [txt, y, k] of lines) { const tw = g.measureText(txt).width; if (k > 0) { g.fillStyle = 'rgba(240,122,28,0.42)'; g.fillRect(W / 2 - tw / 2 - 8, y - 4, (tw + 16) * k, 34); } g.fillStyle = '#17181C'; g.fillText(txt, W / 2, y); }
    // the photograph: the picture as received, with our own roundel over the one a page had put on it
    g.fillStyle = '#17181C'; g.fillRect(PH.x - 5, PH.y - 5, PH.w + 10, PH.h + 10);
    photoIn(g, IMG.bouake, PH.x, PH.y, PH.w, PH.h);
    flagDisc(g, PH.x + 88 / 399 * PH.w, PH.y + 259 / 335 * PH.h, 85 / 399 * PH.w);
    g.font = sans(21, 700); g.textAlign = 'left'; g.fillStyle = '#4A463E'; g.fillText('Bouaké, 3 June 2007. Didier Drogba, with soldiers of both armies around him.', PH.x, PH.y + PH.h + 30);
    g.fillStyle = '#BEB6A2'; for (let c = 0; c < 3; c++) for (let i = 0; i < 13; i++) g.fillRect(84 + c * 312, 1250 + i * 38, 290 - ((i + c) % 4 === 3 ? 90 : 0), 11);
    g.restore();
  }, { grade: ROOM_G, trans: 'flash' });
  cue(paperA, 'paper', 0.6); cue(paperA + 0.3, 'thud', 0.3); cue(five1, 'reveal_bell', 0.3);
  // the picture is squeezed to a line and a dot: the set is switched off, a second before the end (the sound of it lasts that long)
  const tvOff = T.duration - 1.05;
  cue(tvOff, 'tvoff', 0.5);

  // ---------- the crowds under it: a quiet ground at night, Omdurman, Yaoundé holding its breath, Bouaké
  amb.push({ id: 'crowd_bed', t0: 0, t1: withT, gain: 0.22, fi: 0.05, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: ctxA, t1: micA + 0.3, gain: 0.7, fi: 0.2, fo: 0.4, keys: [[ctxA, 0.6], [ivoryT, 0.75], [rivalsT, 0.7], [tK - 0.5, 0.35], [tP + 0.1, 0.8], [andT, 1.0], [firstT, 1.25]] });
  amb.push({ id: 'crowd_bed', t0: bouA, t1: playA + 0.2, gain: 0.6, fi: 0.2, fo: 0.3 });
  amb.push({ id: 'crowd_bed', t0: soldA, t1: paperA + 0.15, gain: 0.75, fi: 0.2, fo: 0.25, keys: [[soldA, 0.6], [stadT, 1.0], [goalsA, 0.9], [tn5, 1.35], [celebA, 1.2]] });

  const music = [
    { t: 0, m: 'hook' }, { t: didierT, m: 'hit' }, { t: ctxA, m: 'stands' }, { t: rivalsT, m: 'tension' }, { t: andT, m: 'stands_hot' }, { t: micA, m: 'fiesta' }, { t: insteadT, m: 'void' },
    { t: warA, m: 'coldwar' }, { t: civilT - 0.1, m: 'slam' }, { t: pleaA, m: 'elegy' }, { t: afterA, m: 'intrigue' }, { t: marchA, m: 'build' }, { t: bouA, m: 'stands' }, { t: playA, m: 'clockwork' },
    { t: soldA, m: 'stands_hot' }, { t: goalsA, m: 'glory' }, { t: paperA, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, ambience: amb, duration: T.duration, autoWhoosh: false, tvOff, grain: 0.02 };
}
