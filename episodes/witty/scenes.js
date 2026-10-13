// Witty Alien: a Bulgarian kid kept out of school to herd goats, a self-taught programmer who quit to stream
// chess, the Alien Gambit, and a blitz win over Magnus Carlsen. 3D sets for the story, 2.5D moves on real
// photos (village, Plovdiv, Carlsen), and the Carlsen game laid out like the stream overlay it happened on.
import { W, H, C, clamp, lerp, ease, seg, pulse, rgba, rng, mix } from '../../engine/js/core.js';
import { flash, glowText, confetti, spotlight, rays } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar, hand } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, vsLabel, mono, sans, serif } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, table, chair, picture, box, pool, lamp, FLOOR_Y, BACK_Z } from '../../engine/js/env.js';
import { burst, shockwave, glint, dust, embers } from '../../engine/js/fx.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { countryside, house, fence, herd, hillH, GAMER, ledStrip, codeScreen, evalBar, chat, webcam, trophy } from '../../engine/js/witty.js';

const mirrorSq = q => q && q[0] + (9 - +q[1]);
const mirror = plies => plies.map(p => ({ ...p, from: mirrorSq(p.from), to: mirrorSq(p.to), pieces: p.pieces.map(x => ({ ...x, sq: mirrorSq(x.sq), c: x.c === 'w' ? 'b' : 'w' })) }));
const AG = mirror(await fetch('../engine/data/alien_gambit.json').then(r => r.json()));   // Witty plays White from the far side
const CW = await fetch('../engine/data/carlsen_witty_2026.json').then(r => r.json());       // shown from Black's side (yaw = π)
const map = await new DotMap().init();
const PH = Object.fromEntries(await Promise.all(['kaleytsa', 'glozhene', 'plovdiv', 'magnus2025'].map(async k => [k, await loadPhoto3d(`../episodes/witty/photos/${k}`)])));
const B = new Board();
const WOOD = { light: '#E8D3A8', dark: '#9A6A3E', frame: '#5A3A22', side: '#3A2414' };
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };   // the online-board colours
const HOME = { base: '#0A0806', wall: ['#5A4634', '#4E3C2C'], seam: '#2E2218', rail: '#6A4E34', floor: ['#3A2A1C', '#322418'], light: '#FFC98A', lightA: 0.34, lamp: true, table: ['#6A4A2C', '#3A2614', '#2A1A0C'] };
const OFFICE = { base: '#06090C', wall: ['#2A3640', '#25313A'], seam: '#18222A', floor: ['#1A2026', '#161B20'], light: '#D8ECFF', lightA: 0.22, ceilingLights: true };
const RENT = { base: '#050505', wall: ['#3A3834', '#34322E'], seam: '#22201C', floor: ['#2A2622', '#24211E'], light: '#FFE2B0', lightA: 0.16, lamp: true };

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const lin = x => x;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const at = (x, y, z) => B.project(x, y, z);
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(17, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.7)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const live = (g, x = 70, y = 200, t = 0) => {
    g.save(); g.fillStyle = '#D9363E'; g.beginPath(); g.roundRect(x, y, 130, 46, 8); g.fill();
    g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 5)})`; g.beginPath(); g.arc(x + 24, y + 23, 8, 0, 7); g.fill();
    g.fillStyle = '#FFF'; g.font = sans(26, 900); g.letterSpacing = '2px'; g.fillText('LIVE', x + 42, y + 33); g.restore();
  };
  // flat chess.com-style move arrow between two squares
  const arrow = (g, a, b, color = '#F0A23A', u = 1, al = 0.85) => {
    if (u <= 0) return;
    const [x0, z0] = sqXZ(a), [x1, z1] = sqXZ(b), p = at(x0, 0.02, z0), q0 = at(lerp(x0, x1, u), 0.02, lerp(z0, z1, u));
    const ang = Math.atan2(q0.y - p.y, q0.x - p.x), L = Math.hypot(q0.x - p.x, q0.y - p.y), wd = p.s * 0.22;
    g.save(); g.globalAlpha *= al; g.translate(p.x, p.y); g.rotate(ang); g.fillStyle = color;
    g.beginPath(); g.moveTo(0, -wd / 2); g.lineTo(L - wd * 1.6, -wd / 2); g.lineTo(L - wd * 1.6, -wd * 1.3); g.lineTo(L, 0); g.lineTo(L - wd * 1.6, wd * 1.3); g.lineTo(L - wd * 1.6, wd / 2); g.lineTo(0, wd / 2); g.fill();
    g.restore();
  };

  // ---- sets ----
  // the streamer's room: LED strips, shelves, desk; Witty behind it with headphones
  const stream = (g, lt, t, keys, { who = 'witty', e = 'happy', ez = ease.inOut, blur = 3, reach = null } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    const env = room(g, B, GAMER, { t, blur });
    ledStrip(g, B, [-8, 11.5, BACK_Z - 0.1], [16, 11.5, BACK_Z - 0.1], '#8FD16A', t);
    ledStrip(g, B, [-8, 1.0, BACK_Z - 0.1], [16, 1.0, BACK_Z - 0.1], '#B48CFF', t, { phase: 2 });
    box(g, B, [-3, 4.6, BACK_Z - 1.2], [1.6, 4.8, BACK_Z], { top: '#2A2440', side: '#14121E', front: '#1E1A30' });
    for (const [x, ty] of [[-2.4, 'k'], [-1.2, 'q'], [0.4, 'n']]) { const p = at(x, 4.8, BACK_Z - 0.6); if (B.toCam(x, 4.8, BACK_Z - 0.6)[2] > 1) { g.save(); g.filter = `blur(${blur}px)`; g.fillStyle = '#C9C4D8'; g.beginPath(); g.ellipse(p.x, p.y - p.s * 0.4, p.s * 0.22, p.s * 0.45, 0, 0, 7); g.fill(); g.restore(); } }
    const hands = seated(g, B, who, e, t, { z: 9.4, reach, side: -1 });
    table(g, B, { ...env, table: ['#1E1C28', '#121018', '#0C0A12'] });
    box(g, B, [1.6, -0.35, 4.6], [6.4, -0.2, 6.2], { top: '#2A2838', side: '#141220', front: '#1C1A28' });   // keyboard
    for (let i = 0; i < 12; i++) { const p = at(1.9 + (i % 6) * 0.75, -0.18, 5.0 + Math.floor(i / 6) * 0.6); g.fillStyle = ['#8E6CFF', '#8FD16A', '#6CB8FF'][i % 3]; g.globalAlpha = 0.5; g.fillRect(p.x - p.s * 0.15, p.y - p.s * 0.05, p.s * 0.3, p.s * 0.1); g.globalAlpha = 1; }
    hands();
    return env;
  };
  // the village: hills, two houses at the edge, a fence, the goats
  const GOATS = [[1, 6, 1, null], [3.5, 7.5, -1, '#8A5A3A'], [6, 5.5, 1, null], [-2, 9, 1, '#5A4A3A'], [8, 9.5, -1, null], [4.5, 11, 1, '#9A6A44'], [-4.5, 6.5, -1, null]].map(([x, z, f, patch]) => ({ x, z, face: f, patch }));
  const village = (g, lt, t, keys, { sun = 0, kids = null, ez = ease.inOut, goats = GOATS, school = false, blur = 0 } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    countryside(g, B, t, { sun, blur });
    house(g, B, -9, 14, -4, 18, { y: hillH(-6.5, 14) });
    house(g, B, 10, 15, 15, 19, { y: hillH(12.5, 15), roof: '#A84A2A' });
    if (school) {
      house(g, B, 2, 18, 8, 22, { y: hillH(5, 18), wall: '#E2D8C0', roof: '#7A3A2A' });
      const p = at(5, hillH(5, 18) + 2.2, 17.9);
      if (B.toCam(5, hillH(5, 18) + 2.2, 17.9)[2] > 1) { g.save(); g.font = sans(Math.round(p.s * 0.55), 900); g.textAlign = 'center'; g.fillStyle = '#2A1E14'; g.fillRect(p.x - p.s * 2.1, p.y - p.s * 0.55, p.s * 4.2, p.s * 0.8); g.fillStyle = '#F2E8D6'; g.fillText('УЧИЛИЩЕ', p.x, p.y + p.s * 0.05); g.restore(); }
    }
    fence(g, B, [[-7, 4], [-5, 3.4], [-3, 3], [-1, 2.8]]);
    herd(g, B, goats, t);
    if (kids) kids(g);
  };
  // a character standing in the field: the bust is cut at the ground line and tall grass covers the cut
  const standing = (g, who, x, z, { k = 0.7, e = 'neutral', t = 0 } = {}) => {
    const y0 = hillH(x, z); if (B.toCam(x, y0, z)[2] < 1) return;
    const p0 = at(x, y0 + 0.25, z), r = rng(Math.round(x * 13 + z * 7));
    g.save(); g.beginPath(); g.rect(0, 0, W, p0.y); g.clip();
    actor(g, B, who, { x, y: y0 + 3.3 * k / 0.7 * 0.62, z, k, e, t, face: -1 }); g.restore();
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const gx = p0.x + (r() - 0.5) * p0.s * 2.6, gh = p0.s * (0.35 + r() * 0.45), sw = Math.sin(t * 2 + i) * p0.s * 0.05;
      g.strokeStyle = mix('#4E7A2A', '#9AB850', r()); g.lineWidth = Math.max(2, p0.s * 0.04); g.beginPath(); g.moveTo(gx, p0.y + p0.s * 0.1); g.quadraticCurveTo(gx + sw, p0.y - gh * 0.5, gx + sw * 2 + (r() - 0.5) * p0.s * 0.2, p0.y - gh); g.stroke(); }
    g.restore();
  };
  // Witty (or the kid) at a table with a chessboard
  const boardRoom = (g, lt, t, keys, { env = HOME, who = 'witty', e = 'focus', opp = null, oppE = 'focus', pieces = null, reach = null, blur = 4, dof = 1.4, ez = ease.inOut, slab = WOOD, oppK = 1, whoK = 1, bump = 0 } = {}) => {
    rig(B, lt, keys, { t, e: ez, bump });
    const E = room(g, B, env, { t, blur });
    const hw = seated(g, B, who, e, t, { z: 9.4, reach, side: -1, k: whoK, lift: 3.1 * whoK });
    const ho = opp ? seated(g, B, opp, oppE, t, { z: -1.6, face: 1, k: oppK, lift: 3.1 * oppK }) : () => {};
    table(g, B, E); B.drawSlab(g, slab);
    if (typeof pieces === 'function') pieces(); else if (pieces) B.drawPieces(g, pieces, { focus: B.dist, dof });
    if (B.toCam(4, 3.1, 9.4)[2] > B.toCam(4, 3.1, -1.6)[2]) { hw(); ho(); } else { ho(); hw(); }
    return E;
  };
  // the online game: two webcams on top, the board from Black's side below, an optional eval bar
  const overlay = (g, lt, t, { pieces, wE = 'focus', mE = 'focus', yaw = 0, ev = null, wGray = 0, torn = false, wShake = 0, extra = null, camZoom = 0 }) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#15121C'); bg.addColorStop(1, '#0A090E'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    B.setCam({ yaw: Math.PI + yaw, pitch: 1.05, dist: 11.2 - camZoom, cy: H * 0.68, target: [4, 0, 4] });
    B.drawSlab(g, COM);
    if (typeof pieces === 'function') pieces(); else B.drawPieces(g, pieces, { dof: 0, scale: 1.4 });
    if (extra) extra(g);
    webcam(g, 28, 150, 500, 470, torn ? 'wittyTorn' : 'witty', wE, t, { bg: ['#2C2248', '#120E20'], name: 'WITTY ALIEN', nameColor: '#A8C66C', shake: wShake, zoom: 1.1 });
    webcam(g, 552, 150, 500, 470, 'magnus', mE, t, { bg: ['#4A3A30', '#1E1814'], name: 'MAGNUS CARLSEN', nameColor: '#E9B654', zoom: 1.1 });
    if (ev !== null) evalBar(g, 18, 760, 26, 900, ev, { label: false, flip: true });
  };

  // ======================= HOOK =======================
  // H1 — this guy never went to school
  shot(0, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: 0.25, pitch: 0.14, dist: 13.5, cy: H * 0.46, target: [4, 3.2, 9.4] }], [len(sh), { yaw: 0.05, pitch: 0.1, dist: 8.2 }]], { e: { ...EXPR.happy, look: [0, 0.2] }, ez: ease.out });
    live(g, 70, 200, t);
    counter(g, '0', 'DAYS AT SCHOOL', { y: 420, size: 190, a: seg(t, w('hook1', 'never') - 0.05, w('hook1', 'never') + 0.1), labelColor: C.red });
  }, { grade: 'stream' });
  cue(0.05, 'whoosh', 0.6); cue(w('hook1', 'never'), 'hit', 0.9);
  // H2 — his dad wanted him to herd goats (2.5D: goats on a Lovech hillside)
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    photo3d(g, PH.kaleytsa, lt, { from: { x: 0.42, y: 0.7, zoom: 2.4, sx: 0.0, focus: 0.6, dolly: 0 }, to: { x: 0.36, y: 0.72, zoom: 2.9, sx: 0.04, dolly: 0.22 }, dur: len(sh), e: lin });
    badge(g, 'FUTURE GOAT HERDER', W / 2, 330, { color: C.gold, size: 46, a: seg(t, w('hook2', 'herd'), w('hook2', 'herd') + 0.1), scale: pop(t, w('hook2', 'herd')) });
    credit(g, 'KALEYTSA, LOVECH PROVINCE · PUBLIC DOMAIN', seg(lt, 0.2, 0.4));
  }, { trans: 'whip', grade: 'village', noJump: true });
  cue(w('hook2', 'goats'), 'honk', 0.45); cue(w('hook2', 'herd'), 'pluck', 0.7);
  // H3 — and he just beat Magnus Carlsen: the final position, Qd5+, then black and white
  const beatT = w('hook3', 'beat'), magT = w('hook3', 'Magnus');
  shot(s('hook3') - 0.05, (g, lt, t) => {
    overlay(g, lt, t, { pieces: piecesAt(CW, 41), wE: { ...EXPR.focus, look: [0, 0.8] }, mE: 'neutral', extra: g2 => arrow(g2, 'g8', 'd5', '#F0A23A', seg(t, beatT - 0.2, beatT + 0.15)) });
  }, { trans: 'zoom', noJump: true });
  shot(magT - 0.08, (g, lt, t) => {
    overlay(g, lt, t, { pieces: piecesAt(CW, 42), wE: { ...EXPR.shock, open: 1, shake: 0.6 }, mE: { ...EXPR.sad, look: [0, 0.8], lid: 0.6 }, wShake: 0.8, camZoom: lt * 0.6,
      extra: g2 => { B.highlight(g2, 'd2', C.red, 0.6); arrow(g2, 'g8', 'd5', '#F0A23A', 1); } });
    stamp(g, 'CARLSEN RESIGNS', W / 2, 700, lt, 0.12, { size: 72, color: C.red, rot: -0.12 });
  }, { grade: 'bw', noJump: true });
  cue(beatT, 'whoosh', 0.5); cue(magT, 'boom', 1.1); cue(magT, 'cheer', 0.6); cue(magT + 0.12, 'stamp', 0.8);
  // N — meet Witty Alien
  shot(s('name') - 0.05, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: -0.3, pitch: 0.12, dist: 9.2, cy: H * 0.46, target: [4, 3.2, 9.4] }], [len(sh), { yaw: -0.12, pitch: 0.1, dist: 8 }]], { e: exprAt([[0, 'neutral'], [0.5, { ...EXPR.triumph, nod: 0.5 }]], lt) });
    live(g, 70, 200, t);
    nameTitle(g, lt, 'Witty Alien', 'VOLEN DYULGEROV · BULGARIA', { y: 360, t0: w('name', 'Witty') - (s('name') - 0.05), subColor: '#A8C66C', size: 80 });
    chat(g, 600, 1180, t, s('name') + 0.3, { n: 4, w: 440 });
  }, { trans: 'flash', grade: 'stream' });
  cue(w('name', 'Witty'), 'shimmer', 0.8); cue(w('name', 'Witty'), 'boom', 0.6);

  // ======================= DRENOV =======================
  shot(s('village') - 0.1, (g, lt, t) => {
    g.fillStyle = '#0B1418'; g.fillRect(0, 0, W, H);
    const u = seg(lt, 0, 1.0, ease.inOut);
    map.view({ lon: lerp(18, 24.9, u), lat: lerp(46, 43.1, u), zoom: lerp(16, 70, u), cy: H * 0.47 });
    map.draw(g, { spacing: 14, color: id => id === ISO.BGR ? rgba(C.lime, 0.55 + 0.35 * seg(lt, 0.2, 0.6)) : null });
    map.pin(g, 'Drenov', { color: C.gold, a: seg(lt, 0.3, 0.6), pulse: (lt * 0.8) % 1 });
    map.pin(g, 'Sofia', { color: C.cream, a: 0.6 * seg(lt, 0.2, 0.5), below: true });
    placeStamp(g, lt, 'Drenov', 'Bulgaria', { y: 160, t0: 0.05 });
  }, { trans: 'leak', noJump: true });
  cue(w('village', 'Drenov'), 'boom', 0.7);
  shot(w('village', 'A') - 0.08, (g, lt, t, sh) => {
    photo3d(g, PH.glozhene, lt, { from: { x: 0.5, y: 0.55, zoom: 1.0, focus: 0.3 }, to: { x: 0.56, y: 0.6, zoom: 1.25, sx: -0.05, dolly: 0.15 }, dur: len(sh), e: lin });
    badge(g, 'POPULATION: TINY', W / 2, 330, { color: C.cream, size: 40, a: seg(t, w('village', 'tiny'), w('village', 'tiny') + 0.1), scale: pop(t, w('village', 'tiny')) });
    credit(g, 'GLOZHENE, LOVECH PROVINCE · PHOTO: CATTLE RIPPER · CC BY 4.0', seg(lt, 0.2, 0.4));
  }, { trans: 'whip', grade: 'village', noJump: true });
  cue(w('village', 'tiny'), 'pluck', 0.6);
  // G1 — the family kept goats
  shot(s('goats') - 0.05, (g, lt, t, sh) => {
    village(g, lt, t, [[0, { yaw: -0.5, pitch: 0.08, dist: 9, cy: H * 0.56, target: [3, 1.2, 7] }], [len(sh), { yaw: -0.25, pitch: 0.1, dist: 7.5 }]], { ez: lin });
    badge(g, 'GOATS', W / 2, 330, { color: C.cream, size: 52, a: seg(t, w('goats', 'goats'), w('goats', 'goats') + 0.1), scale: pop(t, w('goats', 'goats')) });
  }, { trans: 'zoom', grade: 'village' });
  cue(w('goats', 'goats'), 'honk', 0.6); cue(s('goats'), 'wind', 0.4);
  // G2 — the kids took turns herding them
  const kidsT = T.p('goats').words[4].s;  // second "The"
  shot(kidsT - 0.08, (g, lt, t, sh) => {
    village(g, lt, t, [[0, { yaw: 0.35, pitch: 0.06, dist: 5.6, cy: H * 0.5, target: [2.5, 2.6, 4] }], [len(sh), { yaw: 0.2, pitch: 0.06, dist: 5 }]], { ez: lin,
      kids: g2 => { standing(g2, 'brother', 0.4, 5.6, { k: 0.75, t }); standing(g2, 'wittyKid', 3.2, 4, { k: 0.68, e: { ...EXPR.happy, look: [-0.5, 0] }, t }); } });
  }, { trans: 'whip', grade: 'village' });
  // G3 — school? not on the menu
  const schoolT = w('goats', 'School');
  shot(schoolT - 0.08, (g, lt, t, sh) => {
    village(g, lt, t, [[0, { yaw: 0.1, pitch: 0.12, dist: 12, cy: H * 0.5, target: [5, 3, 17] }], [len(sh), { yaw: 0.0, pitch: 0.1, dist: 10.5 }]], { school: true, ez: lin, goats: GOATS.slice(0, 3) });
    stamp(g, 'NOT ON THE MENU', W / 2, 360, lt, w('goats', 'Not') - (schoolT - 0.08), { size: 70, color: C.red, rot: -0.1 });
  }, { trans: 'zoom', grade: 'village' });
  cue(w('goats', 'Not'), 'stamp', 0.9);

  // S — so Volen taught himself: night, a lamp, a stack of books
  const bookT = w('self', 'himself');
  shot(s('self') - 0.05, (g, lt, t, sh) => {
    boardRoom(g, lt, t, [[0, { yaw: 0.35, pitch: 0.3, dist: 9.5, cy: H * 0.5, target: [4, 2, 6] }], [len(sh), { yaw: 0.15, pitch: 0.26, dist: 8 }]], { who: 'wittyKid', whoK: 0.8, e: { ...EXPR.focus, look: [0, 1] }, slab: { light: '#3A2A1C', dark: '#3A2A1C', frame: '#2A1C10', side: '#1A100A' }, ez: lin,
      pieces: () => { for (let i = 0; i < 5; i++) box(g, B, [1.2 + i * 0.12, i * 0.32, 1.5], [3.4 - i * 0.1, i * 0.32 + 0.3, 3.2], { top: ['#E8DCC0', '#C9B48A', '#E2D2B0'][i % 3], side: ['#7A2E22', '#2A4A6A', '#3A5A2A', '#6A4A1A', '#4A2A4A'][i], front: ['#8E3A2A', '#345A7E', '#4A6A34', '#7E5A22', '#5A3458'][i] });
        box(g, B, [4.4, 0.02, 3.2], [7.0, 0.06, 5.0], { top: '#F2EADA', side: '#C9C0B0', front: '#E2D8C8' }); } });
    counter(g, '1ST GRADE', 'SELF-TAUGHT', { y: 360, size: 110, a: seg(t, w('self', 'first') - 0.05, w('self', 'first') + 0.1) });
  }, { trans: 'fade', transDur: 0.25, grade: 'warm', vig: 0.8 });
  cue(bookT, 'pluck', 0.6); cue(w('self', 'first'), 'hit', 0.6);

  // C1 — his brother showed him chess
  shot(s('chess') - 0.05, (g, lt, t, sh) => {
    const u = seg(t, w('chess', 'showed'), w('chess', 'chess') + 0.2);
    boardRoom(g, lt, t, [[0, { yaw: -0.5, pitch: 0.5, dist: 11, cy: H * 0.5, target: [4, 0.5, 4] }], [len(sh), { yaw: -0.3, pitch: 0.55, dist: 9.5 }]], { who: 'wittyKid', whoK: 0.8, e: { ...EXPR.happy, look: [0, 1] }, opp: 'brother', oppK: 0.85, oppE: 'smug', pieces: piecesAt(AG, 0), reach: null, ez: lin });
    const p = at(4.5, 0.6, 1.5); if (u > 0 && u < 1) hand(g, lerp(p.x - 200, p.x, Math.sin(Math.PI * u)), p.y, p.s * 0.3);
  }, { trans: 'whip', grade: 'warm' });
  cue(w('chess', 'chess'), 'clack', 0.8);
  // C2 — and the kid was good
  const goodT = w('chess', 'good');
  const kidMv = new Moves(B, AG, [{ k: 1, t0: goodT - 0.5, color: C.lime }]);
  shot(w('chess', 'And') - 0.05, (g, lt, t, sh) => {
    boardRoom(g, lt, t, [[0, { yaw: 0.3, pitch: 0.28, dist: 7.8, cy: H * 0.46, target: [4, 2.4, 9] }], [len(sh), { yaw: 0.12, pitch: 0.24, dist: 6.8 }]], { who: 'wittyKid', whoK: 0.8, e: exprAt([[0, 'focus'], [goodT - (t - lt), { ...EXPR.smug, browTilt: 0.6 }]], lt), opp: 'brother', oppK: 0.85, oppE: 'shock', pieces: () => kidMv.draw(g, t, { labels: false, dof: 1.2 }), bump: kidMv.bump(t), reach: kidMv.current(t) ? { sq: 'e4', u: (t - goodT + 0.65) / 0.75 } : null });
  }, { trans: 'zoom', grade: 'warm' });
  kidMv.cues(cue);
  // C3 — Bulgarian youth champion good
  const champT = w('chess', 'champion');
  shot(w('chess', 'Bulgarian') - 0.05, (g, lt, t, sh) => {
    boardRoom(g, lt, t, [[0, { yaw: -0.2, pitch: 0.2, dist: 8.2, cy: H * 0.5, target: [4, 2.6, 9.4] }], [len(sh), { yaw: 0.0, pitch: 0.16, dist: 7.2 }]], { env: { ...HOME, light: '#FFE2A0', lightA: 0.45 }, who: 'wittyKid', whoK: 0.8, e: { ...EXPR.triumph, nod: 0.6 }, pieces: piecesAt(AG, 1), ez: lin });
    const p = at(6.8, 0, 6); trophy(g, p.x, p.y, p.s / 160, { a: seg(t, champT - 0.2, champT) });
    glint(g, p.x, p.y - p.s * 0.9, t, champT, { r: 220, color: C.gold });
    badge(g, 'BULGARIAN YOUTH CHAMPION', W / 2, 330, { color: C.gold, size: 38, a: seg(t, champT, champT + 0.1), scale: pop(t, champT) });
    confetti(g, t, champT);
  }, { trans: 'flash', grade: 'gold' });
  cue(champT, 'boom', 0.9); cue(champT, 'cheer', 0.6);

  // L1 — at seventeen he left home (2.5D: an old Plovdiv street)
  shot(s('leave') - 0.05, (g, lt, t, sh) => {
    photo3d(g, PH.plovdiv, lt, { from: { x: 0.5, y: 0.55, zoom: 1.0, focus: 0.15 }, to: { x: 0.5, y: 0.5, zoom: 1.12, dolly: 0.35, sy: -0.02 }, dur: len(sh), e: lin });
    counter(g, '17', 'YEARS OLD', { y: 380, size: 200, a: seg(t, w('leave', 'seventeen') - 0.05, w('leave', 'seventeen') + 0.1), labelColor: C.cream });
    placeStamp(g, lt, 'Plovdiv', 'Alone', { y: 160, t0: 0.4 });
    credit(g, 'OLD PLOVDIV · PHOTO: DARREN DONAHUE · CC BY 2.0', seg(lt, 0.2, 0.4));
  }, { trans: 'fade', transDur: 0.3, grade: 'cold', noJump: true });
  cue(w('leave', 'seventeen'), 'boom', 0.7); cue(w('leave', 'left'), 'creak', 0.6);
  // L2 — alone and broke: a bare rented room
  shot(w('leave', 'Alone') - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.6, pitch: 0.4, dist: 14, cy: H * 0.5, target: [4, 1, 8] }], [len(sh), { yaw: 0.45, pitch: 0.36, dist: 12.5 }]], { t, e: lin });
    room(g, B, RENT, { t });
    box(g, B, [0.5, FLOOR_Y, 7], [7.5, FLOOR_Y + 0.7, 11.5], { top: '#C9C0B0', side: '#8A8278', front: '#A8A094' });   // mattress on the floor
    actor(g, B, 'wittyTeen', { x: 4, y: 0.6, z: 9.4, e: { ...EXPR.sad, look: [0, 0.6] }, t, face: -1 });
    box(g, B, [0.5, FLOOR_Y + 0.7, 5.5], [7.5, FLOOR_Y + 1.6, 7.2], { top: '#7A8290', side: '#4A5260', front: '#5A6270' });    // blanket in front
    badge(g, 'ALONE', W / 2 - 140, 330, { color: C.cream, size: 44, a: seg(t, w('leave', 'Alone'), w('leave', 'Alone') + 0.1), scale: pop(t, w('leave', 'Alone')) });
    badge(g, 'BROKE', W / 2 + 150, 330, { color: C.red, size: 44, a: seg(t, w('leave', 'broke'), w('leave', 'broke') + 0.1), scale: pop(t, w('leave', 'broke')) });
  }, { trans: 'whip', grade: 'night', vig: 0.85 });
  cue(w('leave', 'broke'), 'thud', 0.7);

  // P1 — taught himself to code, became a programmer
  const office = (g, lt, t, keys, { e = 'focus', lines = 12, typing = true, ez = ease.inOut, quit = 0 } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    const E = room(g, B, OFFICE, { t, blur: 3 });
    const hands = seated(g, B, 'wittyTeen', e, t, { z: 9.4, side: -1, reach: typing ? { x: 3.2 + Math.sin(t * 18) * 0.6, z: 4.5, y: 0.1, u: 0.5 + 0.5 * Math.sin(t * 9) } : null });
    table(g, B, { ...E, table: ['#3A4048', '#22262C', '#1A1E22'] });
    box(g, B, [5.4, -0.35, 2.2], [8.2, 0.3, 3.0], { top: '#202428', side: '#121418', front: '#181B1F' });
    if (B.E[2] > 2.5) {
      box(g, B, [3.6, -0.35, 1.6], [4.4, 0.6, 2.0], { top: '#3A3F48', side: '#22262C', front: '#2E333A' });                          // stand
      pool(g, B, 4, 2.5, 1.9, 6, '#7FB8FF', 0.28, true);
      picture(g, B, codeScreen(lines, Math.floor(t * 2) % 2 === 0), [7.0, 4.4, 2.0], [1.0, 4.4, 2.0], [7.0, 0.6, 2.0], { tone: 'color', border: '#5A6270', pad: 0.18, glow: 0.5 });
    }
    hands();
    if (quit > 0) stamp(g, 'I QUIT', W / 2, 700, quit, 0, { size: 110, color: C.red, rot: -0.15 });
  };
  shot(s('code') - 0.05, (g, lt, t, sh) => {
    office(g, lt, t, [[0, { yaw: Math.PI + 0.6, pitch: 0.14, dist: 9.5, cy: H * 0.5, target: [4, 2.6, 3] }], [len(sh), { yaw: Math.PI + 0.45, pitch: 0.12, dist: 8.4 }]], { lines: 4 + Math.floor(lt * 4), ez: lin });
    badge(g, 'PROGRAMMER', W / 2, 330, { color: C.blue, size: 44, a: seg(t, w('code', 'programmer'), w('code', 'programmer') + 0.1), scale: pop(t, w('code', 'programmer')) });
  }, { trans: 'whip', grade: 'cold' });
  for (let k = 0; k < 6; k++) cue(s('code') + 0.2 + k * 0.33, 'typewriter', 0.25);
  // P2 — and was bored out of his mind
  const boredT = w('code', 'bored');
  shot(w('code', 'and') - 0.05, (g, lt, t, sh) => {
    office(g, lt, t, [[0, { yaw: 0.15, pitch: 0.14, dist: 7, cy: H * 0.46, target: [4, 3, 9.4] }], [len(sh), { yaw: 0.05, pitch: 0.12, dist: 6.2 }]], { e: exprAt([[0, 'neutral'], [boredT - (t - lt), { ...EXPR.tired, lid: 0.75, mouth: 'o', open: 0.5 }]], lt), typing: false, ez: lin });
    const p = at(10.5, 6, 12.9); if (B.toCam(10.5, 6, 12.9)[2] > 1) { g.save(); g.fillStyle = '#F2EEE6'; g.beginPath(); g.arc(p.x, p.y, p.s * 0.9, 0, 7); g.fill(); g.strokeStyle = '#1A1A1A'; g.lineWidth = p.s * 0.08; g.stroke();
      for (const [len2, sp] of [[0.55, 1], [0.75, 12]]) { const an = t * sp * 2; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.sin(an) * p.s * len2, p.y - Math.cos(an) * p.s * len2); g.stroke(); } g.restore(); }
    badge(g, 'BORED', W / 2, 330, { color: C.cream, size: 52, a: seg(t, boredT, boredT + 0.1), scale: pop(t, boredT) });
  }, { trans: 'zoom', grade: 'cold' });
  cue(boredT, 'tick', 0.6); cue(boredT + 0.4, 'tick', 0.6); cue(boredT + 0.8, 'tick', 0.6);

  // Q1 — so in 2022 he quit to stream chess
  const quitT = w('quit', 'quit'), streamT = w('quit', 'stream');
  shot(s('quit') - 0.05, (g, lt, t, sh) => {
    office(g, lt, t, [[0, { yaw: Math.PI - 0.55, pitch: 0.12, dist: 9.2, cy: H * 0.5, target: [4, 2.6, 3] }], [len(sh), { yaw: Math.PI - 0.45, pitch: 0.1, dist: 8.6 }]], { lines: 12, typing: false, quit: t - quitT });
    placeStamp(g, lt, '2022', 'September', { y: 160, t0: 0.05 });
  }, { trans: 'whip', grade: 'cold' });
  cue(quitT, 'stamp', 1); cue(quitT, 'hit', 0.6);
  shot(streamT - 0.1, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: 0.4, pitch: 0.16, dist: 11, cy: H * 0.46, target: [4, 3, 9.4] }], [len(sh), { yaw: 0.2, pitch: 0.12, dist: 9 }]], { e: { ...EXPR.happy, nod: 0.4 } });
    const a = seg(t, streamT, streamT + 0.1); if (a > 0) { g.save(); g.globalAlpha = a; live(g, 70, 200, t); g.restore(); }
    flash(g, 0.4 * pulse(t, streamT, 0.2), '#E8D8FF');
  }, { trans: 'flash', grade: 'stream' });
  cue(streamT, 'lamp', 0.7); cue(streamT, 'boom', 0.6);
  // Q2 — with two hundred leva in his pocket
  const levT = w('quit', 'two');
  shot(levT - 0.1, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: -0.25, pitch: 0.1, dist: 7, cy: H * 0.44, target: [4, 3.3, 9.4] }], [len(sh), { yaw: -0.1, pitch: 0.1, dist: 6.2 }]], { e: { ...EXPR.worried, look: [0, 0.8] }, ez: lin });
    counter(g, '200 LEVA', 'IN HIS POCKET', { y: 380, size: 130, a: seg(t, levT, levT + 0.1) });
    const r = rng(4); for (let i = 0; i < 6; i++) { const ti = levT + 0.1 + i * 0.12; if (t < ti) continue; const y = Math.min(1250, 600 + (t - ti) * 1400); g.save(); g.fillStyle = '#D8B45A'; g.strokeStyle = '#8A6A2A'; g.lineWidth = 4; g.beginPath(); g.ellipse(300 + r() * 480, y, 34, 34 * Math.abs(Math.cos((t - ti) * 9 + i)), 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
  }, { trans: 'zoom', grade: 'stream' });
  for (let i = 0; i < 6; i++) cue(levT + 0.1 + i * 0.12 + 0.45, 'coins', 0.35);
  // Q3 — about a hundred bucks
  const bucksT = w('quit', 'About');
  shot(bucksT - 0.08, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: 0.2, pitch: 0.08, dist: 5.6, cy: H * 0.44, target: [4, 3.4, 9.4] }], [len(sh), { yaw: 0.1, pitch: 0.08, dist: 5.2 }]], { e: { ...EXPR.happy, look: [0.8, -0.3], sweat: 1 }, ez: lin });
    badge(g, '≈ $100', W / 2, 360, { color: C.lime, size: 80, a: seg(t, w('quit', 'hundred'), w('quit', 'hundred') + 0.1), scale: pop(t, w('quit', 'hundred')) });
  }, { trans: 'whip', grade: 'stream' });
  cue(w('quit', 'hundred'), 'pluck', 0.8);

  // ======================= THE ALIEN GAMBIT =======================
  const insT = w('gambit', 'insane'), f7T = w('gambit', 'f7'), pawnT = w('gambit', 'pawn');
  const openMv = new Moves(B, AG, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k, i) => ({ k, t0: s('gambit') + 0.1 + i * 0.2, dur: 0.16 })));
  const sacMv = new Moves(B, AG, [{ k: 11, t0: f7T - 0.45, color: C.gold, label: 'Nxf7!?', labelColor: C.gold }, { k: 12, t0: pawnT - 0.2, color: C.red }]);
  const ag = (g, lt, t, keys, mv, { e = 'smug', oppE = 'focus', labels = 'custom' } = {}) => {
    const m = mv.current(t);
    boardRoom(g, lt, t, keys, { env: GAMER, who: 'witty', e, opp: 'botvinnik', oppE, pieces: () => mv.draw(g, t, { labels, dof: 1.1 }), bump: mv.bump(t), blur: 4,
      reach: m && m.k % 2 === 1 ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.6 } : null, slab: COM });
  };
  shot(s('gambit') - 0.05, (g, lt, t, sh) => {
    ag(g, lt, t, [[0, { yaw: -0.35, pitch: 0.75, dist: 10.5, cy: H * 0.52, target: [4, 0, 4] }], [len(sh), { yaw: -0.15, pitch: 0.8, dist: 9.5 }]], openMv, { labels: false });
    badge(g, 'SOMETHING INSANE', W / 2, 330, { color: C.red, size: 44, a: seg(t, insT, insT + 0.1), scale: pop(t, insT) });
  }, { trans: 'whip', grade: 'stream' });
  openMv.cues(cue);
  shot(w('gambit', 'Move') - 0.08, (g, lt, t, sh) => {
    ag(g, lt, t, [[0, { yaw: 0.45, pitch: 0.5, dist: 7.5, cy: H * 0.5, target: [5.5, 0.4, 5] }], [len(sh), { yaw: 0.25, pitch: 0.55, dist: 6.4 }]], sacMv, { e: { ...EXPR.smug, browTilt: 0.8 } });
    counter(g, 'MOVE 6', null, { y: 330, size: 110, a: seg(t, w('gambit', 'Move'), w('gambit', 'Move') + 0.1) * (1 - seg(t, f7T - 0.3, f7T)) });
  }, { trans: 'zoom', grade: 'stream' });
  sacMv.cues(cue); cue(f7T, 'boom', 0.8);
  shot(w('gambit', 'For') - 0.08, (g, lt, t, sh) => {
    ag(g, lt, t, [[0, { yaw: -0.2, pitch: 0.95, dist: 7, cy: H * 0.5, target: [5.5, 0, 6.5] }], [len(sh), { yaw: -0.1, pitch: 1.0, dist: 6.2 }]], sacMv, { oppE: 'smug' });
    badge(g, 'A KNIGHT FOR A PAWN', W / 2, 330, { color: C.gold, size: 42, a: seg(t, pawnT, pawnT + 0.1), scale: pop(t, pawnT) });
  }, { trans: 'whip', grade: 'stream' });
  // E1 — engines hate it: the eval bar drops to −2
  const hateT = w('engines', 'hate');
  shot(s('engines') - 0.05, (g, lt, t, sh) => {
    ag(g, lt, t, [[0, { yaw: 0.25, pitch: 0.85, dist: 9.8, cy: H * 0.56, target: [4, 0, 4] }], [len(sh), { yaw: 0.1, pitch: 0.9, dist: 9 }]], sacMv, { e: 'happy' });
    const v = lerp(0.3, -2.0, seg(t, hateT - 0.3, hateT + 0.3, ease.out));
    evalBar(g, 40, 520, 44, 900, v, {});
    badge(g, 'STOCKFISH: −2.0', W / 2, 330, { color: C.red, size: 42, a: seg(t, hateT, hateT + 0.1), scale: pop(t, hateT) });
  }, { trans: 'zoom', grade: 'stream' });
  cue(hateT, 'buzz', 0.6);
  // E2 — humans panic: the opponent sweats, the clock runs
  const panT = w('engines', 'panic');
  shot(w('engines', 'Humans') - 0.08, (g, lt, t, sh) => {
    ag(g, lt, t, [[0, { yaw: Math.PI - 0.3, pitch: 0.18, dist: 7.8, cy: H * 0.46, target: [4, 2.6, -1.6] }], [len(sh), { yaw: Math.PI - 0.12, pitch: 0.16, dist: 6.8 }]], sacMv, { oppE: { ...EXPR.shock, shake: 0.4, sweat: 1 } });
    badge(g, 'PANIC', W / 2, 330, { color: C.red, size: 60, a: seg(t, panT, panT + 0.1), scale: pop(t, panT) });
  }, { trans: 'whip', grade: 'stream' });
  cue(panT, 'heartbeat', 0.7);
  // AL — he called it the Alien Gambit, and it blew up
  const blewT = w('alien', 'blew');
  shot(s('alien') - 0.05, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: 0.35, pitch: 0.12, dist: 10, cy: H * 0.48, target: [4, 3, 9.4] }], [len(sh), { yaw: -0.2, pitch: 0.1, dist: 8 }]], { e: exprAt([[0, 'smug'], [blewT - (t - lt), { ...EXPR.triumph, nod: 0.6 }]], lt), ez: lin });
    live(g, 70, 200, t);
    nameTitle(g, lt, 'The Alien Gambit', '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nf6 5.Ng5 h6 6.Nxf7!?', { y: 340, t0: w('alien', 'Alien') - (s('alien') - 0.05), subColor: '#A8C66C', size: 70 });
    badge(g, 'CHESS.COM CREATOR OF THE MONTH', W / 2, 520, { color: C.lime, size: 32, sub: 'JULY 2024', a: seg(t, blewT, blewT + 0.1), scale: pop(t, blewT) });
    chat(g, 560, 1200, t, blewT - 0.1, { n: 6, w: 480 });
  }, { trans: 'flash', grade: 'stream' });
  cue(w('alien', 'Alien'), 'shimmer', 0.8); cue(blewT, 'boom', 0.9); cue(blewT, 'confetti', 0.5);

  // ======================= CARLSEN =======================
  // M1 — September 2026, five-minute blitz (2.5D: Carlsen at the board)
  const blitzT = w('magnus', 'blitz');
  shot(s('magnus') - 0.05, (g, lt, t, sh) => {
    photo3d(g, PH.magnus2025, lt, { from: { x: 0.5, y: 0.4, zoom: 1.0, focus: 0.55 }, to: { x: 0.52, y: 0.36, zoom: 1.18, sx: 0.03, dolly: 0.12 }, dur: len(sh), e: lin });
    placeStamp(g, lt, 'Chess.com', 'Sept 30, 2026', { y: 160, t0: 0.05 });
    badge(g, '5 + 0 BLITZ', W / 2, 330, { color: C.gold, size: 48, a: seg(t, blitzT, blitzT + 0.1), scale: pop(t, blitzT) });
    credit(g, 'MAGNUS CARLSEN, 2025 · PHOTO: MIROSLAV VAJDIC · CC BY 4.0', seg(lt, 0.2, 0.4));
  }, { trans: 'leak', grade: 'neutral', noJump: true });
  cue(w('magnus', '2026'), 'boom', 0.7); cue(blitzT, 'clock', 0.6);
  // M2 — Witty Alien versus Magnus Carlsen: the overlay appears
  const vsT = w('magnus', 'versus');
  shot(w('magnus', 'Witty') - 0.08, (g, lt, t) => {
    overlay(g, lt, t, { pieces: piecesAt(CW, 0), wE: { ...EXPR.shock, open: 0.5 }, mE: 'neutral' });
    vsLabel(g, lt, vsT - (w('magnus', 'Witty') - 0.08), W / 2, 400);
  }, { trans: 'zoom', grade: 'neutral', noJump: true });
  cue(vsT, 'hit', 0.9);
  // LO — Magnus is crushing him (after 19…Bxa2: the eval bar is all White)
  shot(s('losing') - 0.05, (g, lt, t) => {
    overlay(g, lt, t, { pieces: piecesAt(CW, 38), wE: { ...EXPR.worried, look: [0, 0.8] }, mE: { ...EXPR.smug, look: [0, 0.8] }, ev: 5, camZoom: lt * 0.5 });
    badge(g, 'CRUSHING', W / 2, 700, { color: C.red, size: 50, a: seg(t, w('losing', 'crushing'), w('losing', 'crushing') + 0.1), scale: pop(t, w('losing', 'crushing')) });
  }, { trans: 'whip', grade: 'neutral', noJump: true });
  // BL — one natural move (20.Rde1) … and it's a blunder
  const natT = w('blunder', 'natural'), bluT = w('blunder', 'blunder');
  const rde1 = new Moves(B, CW, [{ k: 39, t0: natT - 0.2, color: '#F0A23A', label: 'Rde1??', labelColor: C.red }]);
  shot(s('blunder') - 0.05, (g, lt, t) => {
    const ev = lerp(5, -6, seg(t, bluT - 0.2, bluT + 0.4, ease.inOut));
    overlay(g, lt, t, { pieces: () => rde1.draw(g, t, { labels: t > bluT - 0.1 ? 'custom' : false, dof: 0 }), wE: exprAt([[0, { ...EXPR.focus, look: [0, 0.8] }], [bluT - (t - lt), { ...EXPR.shock, open: 0.4 }]], lt), mE: { ...EXPR.neutral, look: [0, 0.8] }, ev, camZoom: lt * 0.4 });
  }, { trans: 'zoom', grade: 'neutral', noJump: true });
  rde1.cues(cue); cue(bluT, 'sting', 0.9);
  // CH — rook check, queen check
  const rookT = w('checks', 'Rook'), queenT = w('checks', 'Queen'), resT = w('checks', 'Magnus');
  const finale = new Moves(B, CW, [{ k: 40, t0: rookT - 0.1, color: C.red, label: 'Rb1+', labelColor: C.gold }, { k: 41, t0: rookT + 0.45, color: '#F0A23A' }, { k: 42, t0: queenT - 0.1, color: C.red, label: 'Qd5+', labelColor: C.gold }]);
  shot(s('checks') - 0.05, (g, lt, t) => {
    const m = finale.current(t);
    overlay(g, lt, t, { pieces: () => finale.draw(g, t, { labels: 'custom', dof: 0 }), wE: { ...EXPR.shock, open: 0.8, look: [0, 0.8] }, mE: exprAt([[0, 'neutral'], [queenT - (t - lt), { ...EXPR.shock, open: 0.3 }]], lt), ev: -8, camZoom: lt * 0.5,
      extra: g2 => { if (m && m.k >= 40) B.highlight(g2, m.k === 40 ? 'c1' : 'd2', C.red, 0.5); if (m && m.k === 42) arrow(g2, 'g8', 'd5', '#F0A23A', clamp((t - queenT) / 0.25)); } });
  }, { trans: 'whip', grade: 'neutral', noJump: true });
  finale.cues(cue); cue(rookT, 'hit', 0.8); cue(queenT, 'hit', 1);
  // RE — Magnus resigns: black and white, Witty screaming, Magnus with his head in his hands
  shot(resT - 0.1, (g, lt, t) => {
    overlay(g, lt, t, { pieces: piecesAt(CW, 42), wE: { ...EXPR.shock, open: 1, shake: 0.8, look: [0, -0.4] }, mE: { ...EXPR.sad, lid: 0.7, look: [0, 1] }, wShake: 1, camZoom: lt * 0.8, extra: g2 => { B.highlight(g2, 'd2', C.red, 0.6); arrow(g2, 'g8', 'd5', '#F0A23A', 1); } });
    stamp(g, 'MAGNUS RESIGNS', W / 2, 700, lt, w('checks', 'resigns') - (resT - 0.1), { size: 76, color: C.red, rot: -0.1 });
  }, { grade: 'bw', noJump: true });
  cue(resT, 'boom', 1.1); cue(w('checks', 'resigns'), 'stamp', 0.9); cue(w('checks', 'resigns'), 'cheer', 0.7);
  // SH — he rips his shirt on stream (full-frame webcam, still black and white)
  const ripT = w('shirt', 'rips');
  shot(s('shirt') - 0.05, (g, lt, t) => {
    g.fillStyle = '#0A090E'; g.fillRect(0, 0, W, H);
    webcam(g, 40, 280, W - 80, 1100, t < ripT ? 'witty' : 'wittyTorn', { ...EXPR.triumph, open: 1, shake: 0.6, nod: 0.8 }, t, { bg: ['#2C2248', '#120E20'], name: 'WITTY ALIEN', nameColor: '#A8C66C', shake: 0.7, zoom: 0.62 + lt * 0.03, cy: 0.3 });
    live(g, 70, 310, t);
    if (t >= ripT) { burst(g, W / 2, 900, t, ripT, { n: 24, color: '#E8E0D0', speed: 900, size: 8 }); shockwave(g, W / 2, 900, t, ripT, { r0: 60, r1: 600, color: '#FFFFFF', lw: 10 }); }
    badge(g, 'SHIRT: DESTROYED', W / 2, 200, { color: C.cream, size: 40, a: seg(t, ripT + 0.2, ripT + 0.3), scale: pop(t, ripT + 0.2) });
  }, { trans: 'zoom', grade: 'bw', noJump: true });
  cue(ripT, 'splat', 0.6); cue(ripT, 'boom', 0.8); cue(ripT + 0.05, 'cheer', 0.7);
  // LU — his verdict? pure luck (colour back, calm)
  const luckT = w('luck', 'Pure');
  shot(s('luck') - 0.05, (g, lt, t, sh) => {
    stream(g, lt, t, [[0, { yaw: -0.15, pitch: 0.1, dist: 6.4, cy: H * 0.44, target: [4, 3.3, 9.4] }], [len(sh), { yaw: -0.05, pitch: 0.1, dist: 5.8 }]], { e: { ...EXPR.happy, look: [0.5, -0.4] }, ez: lin });
    badge(g, 'PURE LUCK', W / 2, 330, { color: C.gold, size: 60, a: seg(t, luckT, luckT + 0.1), scale: pop(t, luckT) });
  }, { trans: 'fade', transDur: 0.25, grade: 'stream' });
  cue(luckT, 'pluck', 0.8);
  // F — not bad for a kid who was supposed to herd goats: sunset on the hill; one goat wears the headset
  const kidT2 = w('final', 'kid'), goatT = w('final', 'goats');
  shot(s('final') - 0.05, (g, lt, t, sh) => {
    village(g, lt, t, [[0, { yaw: -0.3, pitch: 0.06, dist: 6.5, cy: H * 0.55, target: [3, 1.6, 6] }], [len(sh), { yaw: 0.1, pitch: 0.08, dist: 5.4, target: [3.5, 1.2, 5.5] }]], { sun: 1, ez: ease.inOut,
      goats: [...GOATS.slice(1), { x: 3.6, z: 5.2, face: -1, phones: true, look: 1 }],
      kids: g2 => standing(g2, 'wittyKid', 1.4, 5, { k: 0.68, e: { ...EXPR.happy, look: [0.6, 0.2] }, t }) });
    const a = seg(t, goatT - 0.1, goatT + 0.25, ease.out), sc = lerp(1.25, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 320); g.scale(sc, sc); g.translate(-W / 2, -320);
    nameTitle(g, 10, 'Witty Alien', 'FROM GOATS TO MAGNUS', { y: 320, subColor: '#A8C66C', size: 84 });
    g.restore();
  }, { trans: 'fade', transDur: 0.3, grade: 'gold' });
  cue(kidT2, 'pluck', 0.5); cue(goatT, 'honk', 0.9); cue(goatT, 'shimmer', 0.6);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);
  const music = [
    { t: 0, m: 'hook' }, { t: magT, m: 'hit' }, { t: s('name') - 0.05, m: 'digital' }, { t: s('village') - 0.1, m: 'norse' },
    { t: s('self') - 0.05, m: 'void' }, { t: s('chess') - 0.05, m: 'court' }, { t: champT - 0.2, m: 'victory' }, { t: s('leave') - 0.05, m: 'elegy' },
    { t: s('code') - 0.05, m: 'clockwork' }, { t: quitT, m: 'drop' }, { t: streamT - 0.1, m: 'digital' }, { t: s('gambit') - 0.05, m: 'build' }, { t: f7T, m: 'hit' },
    { t: f7T + 0.6, m: 'tension' }, { t: s('alien') - 0.05, m: 'glory' }, { t: s('magnus') - 0.05, m: 'tension' }, { t: bluT - 0.2, m: 'drop' }, { t: rookT - 0.1, m: 'build' },
    { t: resT, m: 'victory' }, { t: s('luck') - 0.05, m: 'digital' }, { t: s('final') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
