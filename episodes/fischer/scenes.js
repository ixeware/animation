// Bobby Fischer — shots, timed to narration words. Every shot draws a full frame.
import { W, H, C, clamp, lerp, ease, seg, env, pulse, track, rgba, rng, noise1, inv } from '../../engine/js/core.js';
import { bgBase, spotlight, beam, bokeh, speedlines, rays, confetti, flash, camera, target, xMark, outlinedText, glowText, shadowEllipse } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ, drawBow } from '../../engine/js/board.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { drawChar, exprAt, hand, EXPR } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, healthBar, scoreboard, vsSplit, vsLabel, paper, mono, serif, sans } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { loadImage, photoCard } from '../../engine/js/photo.js';
import { rig, seated, actor, Moves } from '../../engine/js/stage.js';
import { room, table, chair, committee, picture, placeAt, wallEyes, blindLight, FLOOR_Y } from '../../engine/js/env.js';
import { burst, shockwave, glint, dust } from '../../engine/js/fx.js';

const GOC = await fetch('../engine/data/game_of_century.json').then(r => r.json());
const G1 = await fetch('../engine/data/spassky_fischer_1972_g1.json').then(r => r.json());
const G3 = await fetch('../engine/data/spassky_fischer_1972_g3.json').then(r => r.json());
const map = await new DotMap().init();
// real archival photos (free licenses, see photos/credits.json)
const P = Object.fromEntries(await Promise.all(['fischer13', 'fischer1972', 'spassky1973', 'grave'].map(async k => [k, await loadImage(`../episodes/fischer/photos/${k}.jpg`)])));

// ---------- shared pieces of staging ----------
const B = new Board();

function tooth(g, x, y, s, lt, pops, { tint = null } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const p = new Path2D();
  p.moveTo(-90, -40); p.bezierCurveTo(-100, -110, -40, -120, 0, -96); p.bezierCurveTo(40, -120, 100, -110, 90, -40);
  p.bezierCurveTo(86, 20, 70, 60, 64, 120); p.bezierCurveTo(60, 170, 30, 170, 26, 120); p.bezierCurveTo(20, 70, -20, 70, -26, 120);
  p.bezierCurveTo(-30, 170, -60, 170, -64, 120); p.bezierCurveTo(-70, 60, -86, 20, -90, -40); p.closePath();
  const gr = g.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, '#F1ECE4'); gr.addColorStop(1, '#C9C2B8');
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.fillStyle = gr; g.fill(p); g.shadowBlur = 0;
  g.strokeStyle = 'rgba(120,110,100,0.6)'; g.lineWidth = 4; g.stroke(p);
  if (tint) { g.fillStyle = tint; g.fill(p); }
  const spots = [[-40, -70, 26, 16], [34, -64, 22, 14], [0, -40, 18, 12]];
  spots.forEach(([fx, fy, rx, ry], i) => {
    const t0 = pops[i];
    const u = t0 == null ? 0 : clamp((lt - t0) / 0.9);
    if (u >= 1) return;
    const k = ease.out(u);
    g.save(); g.translate(fx + k * (i % 2 ? 260 : -260), fy - k * 520 + u * u * 300); g.rotate(k * 6 * (i % 2 ? 1 : -1));
    const fg = g.createLinearGradient(-rx, -ry, rx, ry); fg.addColorStop(0, '#D7DCE0'); fg.addColorStop(1, '#6E767D');
    g.fillStyle = fg; g.beginPath(); g.ellipse(0, 0, rx, ry, 0.2, 0, 7); g.fill();
    if (u > 0 && u < 0.4) { g.strokeStyle = rgba('#ffffff', 1 - u / 0.4); g.lineWidth = 4; for (let j = 0; j < 6; j++) { const a = j * 1.05; g.beginPath(); g.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); g.lineTo(Math.cos(a) * 60, Math.sin(a) * 60); g.stroke(); } }
    g.restore();
    if (u > 0) { g.fillStyle = 'rgba(70,40,40,0.55)'; g.beginPath(); g.ellipse(fx, fy, rx * 0.8, ry * 0.7, 0.2, 0, 7); g.fill(); }
  });
  g.restore();
}

function waves(g, cx, cy, lt, { color = C.red, n = 4, r0 = 760, r1 = 300, a = 1, block = 0 } = {}) {
  g.save(); g.lineCap = 'round';
  for (const sd of [-1, 1]) for (let i = 0; i < n; i++) {
    const ph = ((lt * 0.9 + i / n) % 1), r = lerp(r0, r1, ph);
    g.strokeStyle = rgba(color, a * Math.sin(ph * Math.PI) * 0.9); g.lineWidth = 10; g.shadowColor = color; g.shadowBlur = 18;
    g.beginPath(); g.arc(cx + sd * (r0 + 60), cy, r, sd > 0 ? Math.PI - 0.5 : -0.5, sd > 0 ? Math.PI + 0.5 : 0.5); g.stroke();
  }
  if (block > 0) {
    g.strokeStyle = rgba(C.teal, block * (0.6 + 0.4 * Math.sin(lt * 20))); g.lineWidth = 6; g.shadowColor = C.teal; g.shadowBlur = 30;
    g.setLineDash([22, 14]); g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.stroke();
  }
  g.restore();
}

function crown(g, x, y, s, { tilt = 0, gray = 0, a = 1 } = {}) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  const col = gray ? '#8C8F92' : C.gold;
  g.fillStyle = col; g.shadowColor = gray ? 'transparent' : C.gold; g.shadowBlur = 30;
  g.beginPath(); g.moveTo(-90, 40); g.lineTo(-100, -50); g.lineTo(-50, -10); g.lineTo(0, -70); g.lineTo(50, -10); g.lineTo(100, -50); g.lineTo(90, 40); g.closePath(); g.fill();
  g.shadowBlur = 0; g.fillStyle = gray ? '#6E7174' : '#C98D24'; g.fillRect(-92, 30, 184, 22);
  g.fillStyle = gray ? '#A7AAAD' : C.red; for (const px of [-100, 0, 100]) { g.beginPath(); g.arc(px, px ? -54 : -76, 12, 0, 7); g.fill(); }
  g.restore();
}

function filmCam(g, x, y, s, lt, flip = 1) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  g.fillStyle = '#20262B'; g.strokeStyle = '#46525B'; g.lineWidth = 4;
  g.beginPath(); g.roundRect(-70, -40, 140, 80, 10); g.fill(); g.stroke();
  for (const [rx, ry] of [[-34, -66], [30, -70]]) { g.beginPath(); g.arc(rx, ry, 30, 0, 7); g.fill(); g.stroke(); g.save(); g.translate(rx, ry); g.rotate(lt * 6); g.strokeStyle = '#5A6770'; for (let i = 0; i < 3; i++) { g.rotate(2.09); g.beginPath(); g.moveTo(0, 0); g.lineTo(22, 0); g.stroke(); } g.restore(); }
  g.fillStyle = '#11161A'; g.beginPath(); g.moveTo(70, -22); g.lineTo(120, -36); g.lineTo(120, 36); g.lineTo(70, 22); g.fill(); g.stroke();
  g.fillStyle = ((lt * 2) % 1) < 0.6 ? C.red : '#5a1c16'; g.shadowColor = C.red; g.shadowBlur = 16; g.beginPath(); g.arc(-48, -18, 8, 0, 7); g.fill();
  g.restore();
}

function candle(g, x, y, s, lt) {
  g.save(); g.translate(x, y); g.scale(s, s);
  spotlight(g, 0, -120, 260, '#ffcf7a', 0.35);
  g.fillStyle = '#EDE6D6'; g.beginPath(); g.roundRect(-22, -100, 44, 120, 6); g.fill();
  const fl = 1 + 0.08 * Math.sin(lt * 17) + 0.05 * Math.sin(lt * 31);
  const gr = g.createRadialGradient(0, -128, 2, 0, -128, 26 * fl); gr.addColorStop(0, '#FFF6D0'); gr.addColorStop(0.5, '#FFC04A'); gr.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -128, 14 * fl, 30 * fl, 0, 0, 7); g.fill();
  g.restore();
}

function spit(g, x0, y0, x1, y1, u) {
  if (u <= 0 || u >= 1.6) return;
  const k = clamp(u);
  const x = lerp(x0, x1, k), y = lerp(y0, y1, k) - Math.sin(k * Math.PI) * 120;
  g.save(); g.fillStyle = 'rgba(200,230,240,0.9)';
  if (u < 1) { g.beginPath(); g.ellipse(x, y, 16, 12, 0, 0, 7); g.fill(); }
  else { const v = (u - 1) / 0.6; g.globalAlpha = 1 - v * 0.6; for (let i = 0; i < 9; i++) { const a = i * 0.7; g.beginPath(); g.arc(x1 + Math.cos(a) * 40 * (0.4 + v), y1 + Math.sin(a) * 26 * (0.4 + v), 9 - i * 0.6, 0, 7); g.fill(); } g.beginPath(); g.ellipse(x1, y1, 34, 22, 0, 0, 7); g.fill(); }
  g.restore();
}

// extra props for the new inserts
function bigCam(g, x, y, s, t, flip = 1) {  // a hero-sized film camera with spinning reels and a blinking REC light
  filmCam(g, x, y, s, t, flip);
  const on = ((t * 2) % 1) < 0.6;
  g.save(); g.font = mono(Math.round(26 * s), 800); g.fillStyle = on ? C.red : 'rgba(255,107,79,0.3)'; g.textAlign = 'center';
  g.shadowColor = C.red; g.shadowBlur = on ? 18 : 0; g.fillText('● REC', x, y - 120 * s); g.restore();
  // lens glare
  const lx = x + flip * 125 * s, gr = g.createRadialGradient(lx, y, 0, lx, y, 160 * s);
  gr.addColorStop(0, 'rgba(200,230,255,0.55)'); gr.addColorStop(1, 'rgba(200,230,255,0)');
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.arc(lx, y, 160 * s, 0, 7); g.fill(); g.restore();
}

// film camera on a tripod, standing in the set (world position of the camera body)
function tripodCam(g, b, x, y, z, t, { flip = 1, k = 1, hero = false } = {}) {
  if (b.toCam(x, y, z)[2] < 0.8) return null;
  g.save(); g.strokeStyle = '#2E373E'; g.lineCap = 'round';
  for (const [dx, dz] of [[-0.9, -0.5], [0.9, -0.5], [0, 0.8]]) {
    if (b.toCam(x + dx, FLOOR_Y, z + dz)[2] < 0.5) continue;
    const p = b.project(x, y - 0.4 * k, z), q = b.project(x + dx, FLOOR_Y, z + dz);
    g.lineWidth = Math.max(2, p.s * 0.07); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
  g.restore();
  return placeAt(b, x, y, z, (px, py, sc) => (hero ? bigCam : filmCam)(g, px, py, sc * k, t, flip));
}

// the Soviet machine: officials in silhouette behind a long red table, eyes glowing
const OFFICIALS = [[-5, 12.5, 'byrne'], [-1.6, 12.2, 'spassky'], [1.2, 12.5, 'byrne'], [6.8, 12.5, 'spassky'], [9.6, 12.2, 'byrne'], [13, 12.5, 'spassky']];
function machine(g, b, t, { a = 1, rise = null } = {}) {
  OFFICIALS.forEach(([x, z, who], i) => {
    const u = rise ? rise(i) : 1;
    if (u <= 0) return;
    actor(g, b, who, { x, y: lerp(-1.2, 3.5, u), z, k: 0.9, t, silhouette: true, eyeGlow: C.red, alpha: a * clamp(u * 3) });
  });
  committee(g, b, { z: 11.1, x0: -7, x1: 15 });
}

// ---------- the film ----------
// Every shot lives in a 3D set (room, table, board, players, props); the camera orbits, cranes and
// dollies through it. Maps, the VS card and the documents stay as flat graphic inserts.
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;  // camera moves run past the cut, so they never come to rest on screen
  const wood = { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' };
  const FAR = [4, 3.1, 9.4], NEAR = [4, 3.1, -1.4], PI = Math.PI;
  // close-up orbit around a head: yaw/dist/pitch go [from, to] across the shot; side = PI looks from the far player's side
  const orbit = (h, dur, { yaw = [-0.3, 0.2], dist = [9, 8], pitch = [0.16, 0.12], cy = H * 0.42, side = 0, dy = 0 } = {}) =>
    [[0, { yaw: side + yaw[0], pitch: pitch[0], dist: dist[0], cy, target: [h[0], h[1] + dy, h[2]] }], [dur, { yaw: side + yaw[1], pitch: pitch[1], dist: dist[1] }]];
  const lin = x => x;
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = mono(18, 700); g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.6)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  // Reykjavik hall: the two players on giant posters (real photos) on the back wall
  const posters = (g, a = 1) => {
    picture(g, B, P.spassky1973, [-5.4, 10.6, 12.85], [-1.4, 10.6, 12.85], [-5.4, 5.6, 12.85], { fx: 0.45, fy: 0.3, border: '#6E1A1F', a });
    picture(g, B, P.fischer1972, [9.4, 10.6, 12.85], [13.4, 10.6, 12.85], [9.4, 5.6, 12.85], { fx: 0.5, fy: 0.3, border: '#123A57', a });
  };

  // S1a — hook, wide: Fischer and the Soviet machine; the kings start to fall
  const kings = [[1.5, 5.5], [3.2, 4.6], [5.0, 5.2], [6.6, 4.4], [2.4, 3.2], [4.4, 2.8], [6.0, 2.4], [1.2, 2.0]];
  const fallAt = i => w('hook1', 'beat') + i * 0.3;
  const hookPieces = t => {
    const ps = [{ t: 'k', c: 'w', x: 4.5, z: 7.5 }, { t: 'q', c: 'w', x: 3.5, z: 7.4 }, { t: 'r', c: 'w', x: 1.5, z: 7.6 }, { t: 'r', c: 'w', x: 6.5, z: 7.6 }, { t: 'n', c: 'w', x: 2.5, z: 7.3 }, { t: 'b', c: 'w', x: 5.5, z: 7.3 }];
    kings.forEach(([x, z], i) => { const u = seg(t, fallAt(i), fallAt(i) + 0.32, ease.in); ps.push({ t: 'k', c: 'b', x: x + u * 0.45, z, rot: u * 1.5, y: Math.sin(u * Math.PI) * 0.15 }); });
    return ps;
  };
  const kingFX = (g, t) => kings.forEach(([x, z], i) => {
    const p = B.project(x + 0.5, 0, z), sc = p.s / 130, tl = fallAt(i) + 0.32;
    dust(g, p.x, p.y, t, tl, { size: 20 * sc, spread: 120 * sc, seed: i });
    burst(g, p.x, p.y - 20 * sc, t, tl, { n: 10, color: '#FF8A6C', speed: 500 * sc, size: 4 * sc, seed: i + 5 });
  });
  const hookSet = (g, lt, t, keys, o = {}) => {
    rig(B, lt, keys, { t, shake: o.shake ?? 1, e: lin });
    const env = room(g, B, 'crimson', { t });
    machine(g, B, t);
    const hands = seated(g, B, 'bobby72', o.expr ?? exprAt([[0, 'focus'], [w('hook1', 'beat'), { ...EXPR.smug, turn: 0.3 }]], t), t, { z: 9.6 });
    table(g, B, env); B.drawSlab(g); hands();
    B.drawPieces(g, hookPieces(t), { focus: o.focus ?? 11, dof: o.dof ?? 1.4 });
    kingFX(g, t);
  };
  shot(0, (g, lt, t, sh) => hookSet(g, lt, t, [[0, { yaw: -0.65, pitch: 0.6, dist: 15, cy: H * 0.56, target: [4, 0.5, 4.6] }], [len(sh), { yaw: -0.05, pitch: 0.5, dist: 11.5 }]]), { vig: 0.6 });
  // S1b — low angle among the falling kings, sweeping the other way
  shot(w('hook1', 'Soviet') - 0.05, (g, lt, t, sh) => hookSet(g, lt, t, [[0, { yaw: 0.85, pitch: 0.18, dist: 7.5, cy: H * 0.5, target: [4, 0.6, 3.8] }], [len(sh), { yaw: 0.15, pitch: 0.3, dist: 6.0 }]],
    { shake: 2, focus: 6, dof: 2.0, expr: { ...EXPR.smug, turn: 0.4, look: [0.6, 0.4] } }), { trans: 'whip', vig: 0.65 });
  kings.forEach((_, i) => { cue(fallAt(i) + 0.3, 'clack', 0.8); cue(fallAt(i) + 0.3, 'thud', 0.35); });
  cue(0.05, 'boom', 1); cue(w('hook1', 'chess'), 'hit', 0.7);

  // S2a — the fillings pop: the tooth floats in the dark set next to him
  shot(s('hook2'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.45, pitch: 0.14, dist: 8.4, cy: H * 0.4, target: [4.6, 3.9, 8.8] }], [len(sh), { yaw: 0.2, pitch: 0.1, dist: 7.2 }]], { t, e: lin, bump: 0.6 * pulse(t, w('hook2', 'fillings'), 0.3) });
    const env = room(g, B, 'backroom', { t, blur: 5, over: { light: '#FF9A8A', lightA: 0.35 } });
    const hands = seated(g, B, 'bobbyBeard', exprAt([[0, 'worried'], [w('hook2', 'fillings'), { ...EXPR.shock, shake: 0.6, look: [1, -1] }]], t), t, { z: 9.4, x: 3.6 });
    table(g, B, env); B.drawSlab(g); hands();
    B.drawPieces(g, piecesAt(G3, 82), { focus: B.dist, dof: 2.4 });
    const tp = placeAt(B, 6.1, 5.2, 7.9, (x, y, sc) => tooth(g, x, y, sc * 1.05, t, [w('hook2', 'fillings'), w('hook2', 'out'), null]));
    if (tp) glint(g, tp.x - 50, tp.y - 150, t, w('hook2', 'fillings'), { r: 220 });
  }, { trans: 'zoom' });
  // S2b — punch-in on his face as the last filling flies past
  shot(w('hook2', 'teeth') - 0.12, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [0.5, 0.22], dist: [6.4, 5.6], pitch: [0.08, 0.05], cy: H * 0.42 }), { t, e: ease.out });
    const env = room(g, B, 'crimson', { t, blur: 8 });
    seated(g, B, 'bobbyBeard', { ...EXPR.paranoid, shake: 0.5, look: [-1, -0.5] }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g);
    speedlines(g, W / 2, 760, t, { a: 0.3, color: '#ffc8b8' });
    tooth(g, 830, 330, 0.9, t, [-9, -9, w('hook2', 'teeth')]);
    burst(g, 830, 300, t, w('hook2', 'teeth') + 0.05, { n: 14, color: '#E8EEF2', speed: 700, size: 6 });
  }, { trans: 'zoom' });
  cue(w('hook2', 'fillings'), 'ting', 0.9); cue(w('hook2', 'out'), 'ting', 0.8); cue(w('hook2', 'teeth'), 'ting', 0.8); cue(w('hook2', 'teeth'), 'hit', 0.5);

  // S3a — nobody gets inside his head: the shield (the camera circles him)
  shot(s('hook3'), (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.55, 0.35], dist: [10, 9], pitch: [0.22, 0.14], cy: H * 0.38 }), { t, e: lin });
    const env = room(g, B, 'dark', { t, blur: 5, over: { light: C.teal, lightA: 0.18 } });
    const hp = actor(g, B, 'bobbyBeard', { ...{ x: 4, y: 3.1, z: 9.4 }, e: { ...EXPR.paranoid, look: [Math.sin(lt * 5) > 0 ? 1 : -1, 0], turn: Math.sin(lt * 5) * 0.4 }, t });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G3, 82), { focus: B.dist, dof: 2.4 });
    if (hp) {
      waves(g, hp.x, hp.y, lt, { block: seg(t, w('hook3', 'nobody'), w('hook3', 'nobody') + 0.3) });
      shockwave(g, hp.x, hp.y, t, w('hook3', 'nobody'), { r0: 200, r1: 520, life: 0.5, color: C.teal, lw: 12, squash: 1 });
    }
  });
  // S3b — extreme close-up: the eyes dart
  shot(w('hook3', 'inside') - 0.08, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [0.22, -0.12], dist: [4.9, 4.3], pitch: [0.03, 0.03], cy: H * 0.5, dy: 0.1 }), { t, e: lin });
    room(g, B, 'crimson', { t, blur: 12 });
    const hp = actor(g, B, 'bobbyBeard', { x: 4, y: 3.1, z: 9.4, e: { ...EXPR.paranoid, pupil: 0.5, look: [Math.sin(lt * 9) > 0 ? 1 : -1, 0] }, t, follow: 0.5 });
    if (hp) waves(g, hp.x, hp.y, lt + 1, { a: 0.6, r0: 900, r1: 420 });
    flash(g, 0.3 * pulse(t, w('hook3', 'head'), 0.25), C.red);
  }, { trans: 'zoom' });
  cue(s('hook3'), 'static', 0.5); cue(w('hook3', 'nobody'), 'shield', 0.9); cue(w('hook3', 'head'), 'boom', 0.8); cue(w('hook3', 'inside') - 0.05, 'heartbeat', 0.6);

  // S4 — New York 1956: a wide sweep around the club room; his photo hangs on the wall
  shot(s('ny'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.85, pitch: 0.7, dist: 15, cy: H * 0.56, target: [4, 0, 4.6] }], [len(sh), { yaw: 0.1, pitch: 0.36, dist: 11.5, cy: H * 0.64 }]], { t });
    const env = room(g, B, 'wood', { t });
    picture(g, B, P.fischer13, [-0.4, 6.6, 12.85], [2.0, 6.6, 12.85], [-0.4, 4.2, 12.85], { tone: 'sepia', fx: 0.42, fy: 0.42, border: '#5A3B22' });
    const hands = seated(g, B, 'bobby13', 'focus', t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    B.drawPieces(g, piecesAt(GOC, 33), { focus: B.dist, dof: 1.5 });
    placeStamp(g, lt, 'New York', '1956', { y: 160, t0: 0.05 });
    credit(g, 'PHOTO: UNITED PRESS · PUBLIC DOMAIN', seg(lt, 0.8, 1.2));
  }, { trans: 'leak' });
  cue(w('ny', '1956'), 'boom', 0.8);

  // S5 — Bobby is 13: the camera pans off him and the real photo slides in
  shot(s('age'), (g, lt, t, sh) => {
    const ph = w('age', 'thirteen') - s('age') - 0.15;
    rig(B, lt, [[0, { yaw: 0.4, pitch: 0.2, dist: 9.6, cy: H * 0.4, target: FAR }], [ph, { yaw: 0.18, pitch: 0.18, dist: 9.2, target: FAR }],
      [ph + 0.45, { yaw: 0.02, dist: 9.2, target: [6.3, 3.1, 9.4] }], [len(sh), { yaw: -0.12, pitch: 0.16, dist: 8.8, target: [6.3, 3.1, 9.4] }]], { t });
    const env = room(g, B, 'wood', { t, blur: 5 });
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'neutral'], [0.6, { ...EXPR.focus, turn: 0.4, look: [1, 0] }]], lt), t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    B.drawPieces(g, piecesAt(GOC, 33), { focus: B.dist, dof: 1.7 });
    photoCard(g, P.fischer13, lt, ph, { x: 790, y: 790, w: 400, aspect: 1.0, rot: 0.06, from: 'right', caption: 'BOBBY · APRIL 1956', credit: 'United Press · Public domain', fx: 0.4, fy: 0.42, zoom: [1.0, 1.1], dur: 2.5 });
    nameTitle(g, lt, 'Bobby Fischer', '13 YEARS OLD', { y: 210, t0: 0.05, subColor: C.gold });
  }, { trans: 'whip' });
  cue(w('age', 'thirteen'), 'tick', 0.8); cue(w('age', 'thirteen') - 0.15, 'whoosh', 0.6); cue(w('age', 'thirteen') + 0.2, 'shutter', 0.7);

  // S6a — against a master: the camera goes round to the other side of the table
  shot(s('queen'), (g, lt, t, sh) => {
    rig(B, lt, orbit(NEAR, len(sh), { side: PI, yaw: [-0.4, 0.1], dist: [10, 8.6], pitch: [0.22, 0.17], cy: H * 0.4 }), { t });
    const env = room(g, B, 'wood', { t, blur: 5 });
    const hands = seated(g, B, 'byrne', exprAt([[0, 'smug'], [0.7, { ...EXPR.smug, nod: 0.6 }]], lt), t, { z: -1.4, face: 1 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    B.drawPieces(g, piecesAt(GOC, 33), { focus: B.dist, dof: 1.7 });
    nameTitle(g, lt, 'Donald Byrne', 'U.S. MASTER', { y: 210, t0: 0.05, subColor: C.red });
  }, { trans: 'whip' });

  // S6b — 17...Be6!!: the bishop leaves the queen hanging
  const beMove = new Moves(B, GOC, [{ k: 34, t0: w('queen', 'leaves'), dur: 0.42, label: '17...Be6!!', labelColor: C.lime }]);
  beMove.cues(cue);
  shot(w('queen', 'he') - 0.05, (g, lt, t) => {
    rig(B, lt, [[0, { yaw: 0.55, pitch: 0.78, dist: 11, cy: H * 0.52, target: [3.8, 0, 5.4] }], [0.7, { yaw: 0.3, pitch: 0.85, dist: 8.2, target: [3.6, 0, 5.4] }], [2.5, { yaw: 0.12, pitch: 0.82, dist: 7.6 }]], { t, bump: beMove.bump(t) });
    const env = room(g, B, 'wood', { t, blur: 1.5 });
    const m = beMove.current(t);
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'focus'], [0.6, { ...EXPR.smug, look: [0, 1] }]], lt), t, { z: 9.4, reach: m ? { sq: m.to, u: (t - m.t0 + 0.15) / 0.75 } : null });
    table(g, B, env); B.drawSlab(g, wood); hands();
    beMove.draw(g, t, { dof: 1.2 });
  });
  // S6c — the hanging queen, close and low
  const qT = w('queen', 'queen');
  shot(qT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 1.05, pitch: 0.26, dist: 6, cy: H * 0.5, target: [1.6, 0.5, 5.5] }], [len(sh), { yaw: 0.65, pitch: 0.34, dist: 5.1 }]], { t, shake: 1.5, e: lin });
    const env = room(g, B, 'wood', { t, blur: 4 });
    const hands = seated(g, B, 'bobby13', { ...EXPR.smug, turn: -0.5, look: [-1, 0.6] }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    const qa = seg(t, qT - 0.05, qT + 0.2);
    B.dots(g, C.red, 0.55 * qa, ['b6']);
    B.drawPieces(g, piecesAt(GOC, 34, 1, { opts: { q2: { halo: C.red, haloA: qa * (0.7 + 0.3 * Math.sin(t * 9)), sharp: true } } }), { focus: 5.5, dof: 1.6 });
    B.laser(g, 'c5', 'b6', C.red, qa, 0.7, seg(t, qT, qT + 0.25));
    const [bx, bz] = sqXZ('b6'), qp = B.project(bx, 0.75, bz);
    target(g, qp.x, qp.y, 110, t, C.red, qa);
    shockwave(g, qp.x, qp.y + 60, t, w('queen', 'hanging'), { r0: 40, r1: 300, color: C.red, lw: 10 });
    badge(g, 'QUEEN HANGING', W / 2, 260, { color: C.red, size: 40, a: seg(t, w('queen', 'hanging'), w('queen', 'hanging') + 0.15), scale: lerp(1.5, 1, seg(t, w('queen', 'hanging'), w('queen', 'hanging') + 0.2, ease.out)) });
  }, { trans: 'whip', whipDir: -1 });
  cue(qT, 'alarm', 0.6); cue(w('queen', 'hanging'), 'boom', 0.7);

  // S7 — on purpose: push in on the smirk
  shot(s('purpose'), (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.32, 0.1], dist: [11, 7.6], pitch: [0.2, 0.14], cy: H * 0.4 }), { t, e: ease.out });
    const env = room(g, B, 'wood', { t, blur: 6 });
    const hp = actor(g, B, 'bobby13', { x: 4, y: 3.1, z: 9.4, e: exprAt([[0, 'smug'], [w('purpose', 'purpose') - s('purpose'), { ...EXPR.smug, browTilt: 0.7, nod: 0.5 }]], lt), t });
    table(g, B, env); B.drawSlab(g, wood);
    B.drawPieces(g, piecesAt(GOC, 34), { focus: B.dist, dof: 1.8 });
    if (hp) glint(g, hp.x + 100, hp.y - 120, t, w('purpose', 'purpose'), { r: 140, color: C.gold });
  }, { trans: 'zoom' });
  cue(w('purpose', 'purpose'), 'pluck', 0.8); cue(w('purpose', 'purpose'), 'ting', 0.5);

  // S8a — fast forward: 24 moves while the camera swings round the board and the room spins past
  const ffA = s('later') - 0.2, ffB = w('later', 'later') + 0.55, mateT = w('mate1', 0);
  shot(ffA, (g, lt, t) => {
    rig(B, lt, [[0, { yaw: -0.6, pitch: 0.8, dist: 12, cy: H * 0.52, target: [4, 0, 4] }], [ffB - ffA, { yaw: 1.4, pitch: 0.95, dist: 10, target: [3.4, 0, 3] }]], { t, e: lin });
    const env = room(g, B, 'wood', { t });
    const x = 34 + clamp((t - ffA) / (ffB - ffA)) * (78 - 34), k = Math.min(78, Math.floor(x) + 1), u = x % 1;
    const hands = seated(g, B, 'bobby13', { ...EXPR.focus, look: [Math.sin(t * 7), 0.6] }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    const P = GOC[k];
    if (P.from) { B.highlight(g, P.from, C.red, 0.45); B.highlight(g, P.to, C.teal, 0.55); }
    B.drawPieces(g, piecesAt(GOC, k, clamp(u * 1.4), { arc: 0.5, keepCaptured: false }), { focus: B.dist, dof: 1.0 });
    badge(g, `▶▶  MOVE ${String(Math.min(41, Math.ceil(k / 2))).padStart(2, '0')}`, W / 2, 170, { color: C.teal, size: 40 });
  }, { trans: 'leak' });
  for (let k = 35; k <= 78; k += 2) cue(ffA + (k - 34) / 44 * (ffB - ffA), 'tick', 0.35);
  // S8b/S8c — the last moves in slow motion, then the mate (41...Rc2#)
  const slow = new Moves(B, GOC, [
    { k: 79, t0: ffB + 0.05, dur: 0.4 }, { k: 80, t0: ffB + 0.55, dur: 0.4 }, { k: 81, t0: ffB + 1.05, dur: 0.4, color: C.red },
    { k: 82, t0: mateT - 0.42, dur: 0.42, label: '41...Rc2#', labelColor: C.lime, color: C.red }]);
  slow.cues(cue);
  const mateBoard = (g, lt, t, keys) => {
    const mated = t >= mateT;
    rig(B, lt, keys, { t, bump: slow.bump(t) * 1.5 });
    const env = room(g, B, 'wood', { t, blur: 2.5, over: mated ? { light: C.lime, lightA: 0.45 } : null });
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'focus'], [mateT - (t - lt), 'triumph']], lt), t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, { ...wood, tint: C.lime, tintA: mated ? 0.22 * (1 - 0.6 * seg(t, mateT + 0.3, mateT + 1)) : 0 }); hands();
    if (mated) { const m = seg(t, mateT, mateT + 0.3); B.dots(g, C.red, 0.85 * m, ['b1', 'b2', 'd1', 'd2', 'c1']); B.dots(g, C.lime, 0.3 * m); }
    slow.draw(g, t, { dof: 1.3 });
    if (mated) {
      const m = seg(t, mateT + 0.05, mateT + 0.3);
      for (const sq of ['b1', 'b2', 'd1', 'd2']) { const [x, z] = sqXZ(sq), p = B.project(x, 0.05, z); xMark(g, p.x, p.y, p.s * 0.45 * (1 + 0.4 * (1 - ease.back(m))), C.red, m); }
      const kp = B.project(2.5, 0.8, 0.5); target(g, kp.x, kp.y, 90, t, C.red, m);
      speedlines(g, W / 2, H * 0.45, t, { a: 0.6 * (1 - seg(t, mateT + 0.2, mateT + 0.9)), color: '#E9FFD0' });
      flash(g, 0.55 * pulse(t, mateT, 0.25), '#E6FFC8');
    }
  };
  shot(ffB, (g, lt, t) => mateBoard(g, lt, t, [[0, { yaw: 1.05, pitch: 0.42, dist: 8, cy: H * 0.5, target: [2.4, 0.3, 1.6] }], [mateT - 0.3 - ffB, { yaw: 0.5, pitch: 0.55, dist: 6.5 }]]), { trans: 'whip' });
  shot(mateT - 0.28, (g, lt, t) => mateBoard(g, lt, t, [[0, { yaw: 0.25, pitch: 0.75, dist: 7.5, cy: H * 0.5, target: [2.6, 0.2, 1.4] }], [0.3, { yaw: 0.15, pitch: 0.8, dist: 5.8 }], [1.4, { yaw: -0.12, pitch: 0.82, dist: 5.3 }]]), { trans: 'zoom' });
  cue(ffB, 'riser', 0.9); cue(mateT, 'boom', 1.1); cue(mateT, 'hit', 0.9);

  // S9 — Byrne shocked: crash zoom across the table
  shot(s('mate1') + 0.85, (g, lt, t, sh) => {
    rig(B, lt, orbit(NEAR, len(sh), { side: PI, yaw: [0.35, 0.05], dist: [8.4, 6.2], pitch: [0.14, 0.1], cy: H * 0.42 }), { t, e: ease.out });
    const env = room(g, B, 'wood', { t, blur: 7, over: { light: C.red, lightA: 0.5 } });
    seated(g, B, 'byrne', { ...EXPR.shock, shake: 1 }, t, { z: -1.4, face: 1 });
    table(g, B, env); B.drawSlab(g, wood);
    B.drawPieces(g, piecesAt(GOC, 82), { focus: B.dist, dof: 1.8 });
    speedlines(g, W / 2, 800, t, { a: 0.35, color: '#ffb0a0' });
  }, { trans: 'whip' });

  // S10 — The Game of the Century: crane up over the final position
  shot(s('century'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.35, pitch: 0.5, dist: 9, cy: H * 0.68, target: [3.5, 0, 3.5] }], [len(sh), { yaw: 0.5, pitch: 1.05, dist: 13, target: [4, 0, 4] }]], { t });
    const env = room(g, B, 'wood', { t, over: { lightA: 0.5 } });
    const hands = seated(g, B, 'bobby13', { ...EXPR.happy, nod: 0.5 }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, wood); hands();
    B.drawPieces(g, piecesAt(GOC, 82), { focus: B.dist, dof: 1.2 });
    rays(g, W / 2, 260, t, { a: 0.12 * seg(t, w('century', 'Game') - 0.2, w('century', 'Game') + 0.3) });
    const a = seg(t, w('century', 'Game') - 0.15, w('century', 'Game') + 0.25, ease.out), sc = lerp(1.4, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 300); g.scale(sc, sc); g.translate(-W / 2, -300);
    glowText(g, 'THE GAME', W / 2, 250, { font: serif(92, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    glowText(g, 'OF THE CENTURY', W / 2, 345, { font: serif(70, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    g.restore();
    glowText(g, 'BYRNE 0 – 1 FISCHER  ·  OCT 17, 1956', W / 2, 410, { font: mono(24, 800), fill: C.cream, glow: 'rgba(0,0,0,0.8)', blur: 8, spacing: 4, a: seg(t, w('century', 'Century'), w('century', 'Century') + 0.4) });
    glint(g, W / 2 + 230, 230, t, w('century', 'Game') + 0.2, { r: 200, color: C.gold });
  }, { trans: 'flash' });
  cue(w('century', 'Game'), 'boom', 1); cue(w('century', 'Game'), 'shimmer', 0.7);

  // S11 — Reykjavik 1972 on the map
  shot(s('rey'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.6, ease.inOut);
    map.view({ lon: lerp(-60, -24, u), lat: lerp(48, 62, u), zoom: lerp(7, 16, u), cy: H * 0.47 });
    map.draw(g, { spacing: 15, color: id => id === ISO.ISL ? rgba(C.blue, 0.95) : id === ISO.USA ? '#6C93A3' : id === ISO.RUS ? '#7A3A36' : null });
    const head = map.route(g, 'New York', 'Reykjavik', seg(lt, 0.1, 1.5), { color: C.gold, bend: 0.3 });
    burst(g, head[0], head[1], t, s('rey') + 1.5, { n: 18, color: C.gold, speed: 500, size: 5 });
    map.pin(g, 'New York', { color: C.gold, a: 1 - seg(lt, 1.6, 2.2) });
    map.pin(g, 'Reykjavik', { color: C.blue, a: seg(lt, 1.2, 1.6), pulse: (lt * 0.8) % 1 });
    placeStamp(g, lt, 'Reykjavik', '1972', { y: 160, t0: 0.1 });
    badge(g, 'MATCH OF THE CENTURY', W / 2, 260, { color: C.red, size: 30, a: seg(t, w('rey', '1972'), w('rey', '1972') + 0.3), scale: lerp(1.4, 1, seg(t, w('rey', '1972'), w('rey', '1972') + 0.25, ease.out)) });
    photoCard(g, P.fischer1972, lt, w('rey', '1972') - s('rey'), { x: 850, y: 1050, w: 260, aspect: 1.25, rot: 0.07, caption: 'FISCHER · 1972', credit: 'Anefo / Nationaal Archief · CC0', fx: 0.5, fy: 0.32, zoom: [1.0, 1.08], dur: 2 });
  }, { trans: 'leak' });
  cue(w('rey', '1972'), 'boom', 0.9); cue(w('rey', '1972') + 0.1, 'shutter', 0.6); cue(s('rey') + 1.5, 'ting', 0.6);

  // S12 — Boris Spassky, World champion (VS card)
  const vsT = s('spassky');
  shot(vsT, (g, lt, t) => {
    g.fillStyle = '#05080B'; g.fillRect(0, 0, W, H);
    vsSplit(g, lt, { left: '#6E1A1F', right: '#123A57' });
    spotlight(g, 280, 820, 500, '#ff9a8a', 0.18); spotlight(g, 800, 820, 500, '#9ad0ff', 0.18);
    camera(g, { zoom: lerp(1.0, 1.06, seg(lt, 0, 2.3)), t });
    drawChar(g, 'spassky', { x: 290 - (1 - seg(lt, 0, 0.4, ease.out)) * 400, y: 860, s: 1.25, e: exprAt([[0, { ...EXPR.neutral, turn: 0.5, look: [1, 0] }], [1.2, { ...EXPR.smug, turn: 0.3 }]], lt), t });
    drawChar(g, 'bobby72', { x: 800 + (1 - seg(lt, 0, 0.4, ease.out)) * 400, y: 860, s: 1.25, e: { ...EXPR.focus, turn: -0.5, look: [-1, 0] }, t });
    vsLabel(g, lt, 0.15, W / 2, 520);
    shockwave(g, W / 2, 520, t, vsT + 0.2, { r0: 60, r1: 420, color: C.gold, lw: 14, squash: 1 });
    photoCard(g, P.spassky1973, lt, 0.35, { x: 175, y: 430, w: 220, aspect: 1.2, rot: -0.1, caption: 'SPASSKY', credit: 'Anefo · CC0', fx: 0.45, fy: 0.3, zoom: [1.15, 1.2] });
    photoCard(g, P.fischer1972, lt, 0.55, { x: 905, y: 430, w: 220, aspect: 1.2, rot: 0.1, caption: 'FISCHER', credit: 'Anefo · CC0', fx: 0.5, fy: 0.3, zoom: [1.05, 1.1] });
    g.save(); g.font = serif(40, 700); g.textAlign = 'center'; g.fillStyle = C.cream;
    g.fillText('BORIS SPASSKY', 290, 1220); g.fillText('BOBBY FISCHER', 800, 1220);
    g.font = mono(22, 800); g.letterSpacing = '4px'; g.fillStyle = C.red; g.fillText('USSR', 290, 1258); g.fillStyle = C.blue; g.fillText('USA', 800, 1258); g.restore();
    healthBar(g, 'Boris Spassky', 'WORLD CHAMPION', 1, { y: 170, a: seg(t, w('spassky', 'World') - 0.1, w('spassky', 'World') + 0.2) });
  }, { trans: 'whip' });
  cue(vsT + 0.15, 'boom', 1); cue(w('spassky', 'World'), 'hit', 0.6); cue(vsT + 0.4, 'shutter', 0.5); cue(vsT + 0.6, 'shutter', 0.5);

  // S13 — Soviets held the title for 24 years: the champions rise behind the red table, the camera tracks along
  const champs = [['1948', 'byrne'], ['1957', 'spassky'], ['1960', 'bobby72'], ['1963', 'byrne'], ['1969', 'spassky']];
  const champX = [-1.6, 1.6, 4.8, 8.0, 11.2];
  shot(s('soviets'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.32, pitch: 0.16, dist: 18, cy: H * 0.5, target: [3.6, 3.2, 11.8] }], [len(sh), { yaw: 0.26, pitch: 0.2, dist: 16, target: [5.4, 3.2, 11.8] }]], { t, e: lin });
    room(g, B, 'crimson', { t });
    champs.forEach(([yr, who], i) => {
      const t0 = 0.15 + i * 0.32, a = seg(lt, t0, t0 + 0.3, ease.back);
      if (a <= 0) return;
      const x = champX[i], z = 12.2 + (i % 2) * 0.3;
      actor(g, B, who, { x, y: lerp(-1.2, 3.6, a), z, k: 0.9, t, silhouette: true, eyeGlow: C.red, alpha: clamp(a * 2) });
    });
    committee(g, B, { z: 11.1, x0: -7, x1: 15 });
    champs.forEach(([yr], i) => {
      const t0 = 0.15 + i * 0.32, a = seg(lt, t0, t0 + 0.3);
      const p = B.project(champX[i], 0.0, 10.35);
      dust(g, p.x, B.project(champX[i], 0.4, 11.1).y, lt, t0 + 0.2, { color: '#7a2a2a', size: 30 * p.s / 110, spread: 120 * p.s / 110, seed: i });
      g.save(); g.globalAlpha = clamp(a); g.font = mono(Math.round(clamp(p.s * 0.45, 28, 48)), 800); g.textAlign = 'center'; g.fillStyle = C.gold; g.fillText(yr, p.x, p.y); g.restore();
    });
    const cp = B.project(13.6, 7.2, 12.4); crown(g, cp.x, cp.y + Math.sin(t * 2) * 6, cp.s / 100 * 0.9, { a: seg(lt, 1.6, 1.9) });
    const yr = Math.round(lerp(1948, 1972, seg(t, s('soviets') + 0.1, w('soviets', 'twenty-four'))));
    counter(g, String(yr), 'SOVIET CHAMPIONS', { y: 330, size: 140, color: '#FFE9E4', glow: C.red, labelColor: C.red });
    const tw = w('soviets', 'twenty-four');
    badge(g, '24 YEARS', W / 2, 1110, { color: C.gold, size: 54, a: seg(t, tw, tw + 0.2), scale: lerp(1.8, 1, seg(t, tw, tw + 0.25, ease.back)) });
    shockwave(g, W / 2, 1110, t, tw + 0.1, { r0: 80, r1: 380, color: C.gold, lw: 10, squash: 0.5 });
  }, { trans: 'leak' });
  champs.forEach((_, i) => cue(s('soviets') + 0.35 + i * 0.32, 'thud', 0.7));
  cue(w('soviets', 'twenty-four'), 'boom', 0.9);

  // S14a — game 1: 29...Bxh2? 30.g3 — the bishop is trapped (Reykjavik hall, posters on the wall)
  const g1 = new Moves(B, G1, [{ k: 58, t0: w('loses', 'Bobby') - 0.1, dur: 0.42, label: '29...Bxh2?', labelColor: C.red, color: C.red }, { k: 59, t0: w('loses', 'game') - 0.2, dur: 0.4, label: '30.g3', labelColor: C.teal }]);
  g1.cues(cue);
  shot(s('loses'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.95, pitch: 0.55, dist: 9, cy: H * 0.5, target: [6.5, 0, 2.5] }], [len(sh), { yaw: -0.45, pitch: 0.62, dist: 6.8 }]], { t, bump: g1.bump(t) });
    const env = room(g, B, 'hall', { t, blur: 1.5 });
    posters(g);
    const trapped = seg(t, w('loses', 'game') + 0.25, w('loses', 'game') + 0.45);
    const hands = seated(g, B, 'bobby72', exprAt([[0, 'focus'], [w('loses', 'game') + 0.2 - s('loses'), { ...EXPR.worried, shake: 0.4, look: [1, 0.8], turn: 0.5 }]], lt), t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g); hands();
    B.dots(g, C.red, 0.6 * trapped, ['h2', 'g1', 'g3']);
    g1.draw(g, t, { dof: 1.1 });
    const [hx, hz] = sqXZ('h2'), hp = B.project(hx, 0.8, hz);
    target(g, hp.x, hp.y, 90, t, C.red, trapped);
    badge(g, 'TRAPPED', hp.x - 40, hp.y - 170, { color: C.red, size: 34, a: trapped, scale: lerp(1.6, 1, ease.back(trapped)) });
  }, { trans: 'whip' });
  // S14b — the scoreboard over his angry face
  shot(w('loses', 'one') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [0.32, 0.08], dist: [8.6, 9.6], pitch: [0.24, 0.2], cy: H * 0.52 }), { t, e: ease.out });
    const env = room(g, B, 'hall', { t, blur: 6 });
    posters(g);
    seated(g, B, 'bobby72', { ...EXPR.angry, shake: 0.3 }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G1, 59), { focus: B.dist, dof: 1.7 });
    const f = pulse(t, w('loses', 'one'), 0.4);
    scoreboard(g, 'SPASSKY', 'FISCHER', '1', '0', { y: 330, flashL: f, title: 'GAME 1' });
  }, { trans: 'zoom' });
  cue(w('loses', 'one'), 'buzz', 0.8);

  // S15a — he hears the cameras: film cameras on tripods behind him, the camera circles
  const cams = [[0.4, 4.3, 12.0, 1], [7.8, 4.6, 11.6, -1]];
  shot(s('cameras'), (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.4, 0.36], dist: [11, 9.6], pitch: [0.18, 0.14], cy: H * 0.44 }), { t, e: lin });
    const env = room(g, B, 'hall', { t, blur: 3 });
    const cp = cams.map(([x, y, z, f]) => tripodCam(g, B, x, y, z, t, { flip: f }));
    const look = lt < 0.6 ? [0, 0] : (Math.floor(lt * 3) % 2 ? [1, -0.4] : [-1, -0.4]);
    seated(g, B, 'bobby72', { ...exprAt([[0, 'focus'], [0.4, 'paranoid']], lt), look, turn: look[0] * 0.5 }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G1, 59), { focus: B.dist, dof: 1.6 });
    cp.forEach((p, i) => {
      if (!p || lt < 0.4 + i * 0.4) return;
      g.save(); g.strokeStyle = rgba('#ffffff', 0.55); g.lineWidth = 4;
      for (let j = 0; j < 3; j++) { const r = (30 + ((lt * 80 + j * 30) % 90)) * p.s / 120; g.beginPath(); g.arc(p.x, p.y, r, -0.6 + (i ? Math.PI : 0), 0.6 + (i ? Math.PI : 0)); g.stroke(); }
      g.restore();
    });
  });
  // S15b — the camera, huge, REC blinking: we orbit the tripod
  shot(w('cameras', 'cameras') - 0.05, (g, lt, t, sh) => {
    const [cx, cy, cz] = cams[1];
    rig(B, lt, [[0, { yaw: 0.75, pitch: 0.06, dist: 4.4, cy: H * 0.45, target: [cx, cy, cz] }], [len(sh), { yaw: 0.3, pitch: 0.1, dist: 3.5 }]], { t, e: ease.out });
    room(g, B, 'hall', { t, blur: 6 });
    tripodCam(g, B, cams[0][0], cams[0][1], cams[0][2], t, { flip: 1 });
    tripodCam(g, B, cx, cy, cz, t, { flip: -1, hero: true });
  }, { trans: 'whip' });
  cue(w('cameras', 'cameras'), 'whirr', 0.9); cue(w('cameras', 'cameras') + 0.25, 'shutter', 0.7); cue(w('cameras', 'cameras') + 0.6, 'shutter', 0.5);

  // S16 — refuses to play: his chair stays empty, FORFEIT
  shot(s('refuses'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.65, pitch: 0.5, dist: 13, cy: H * 0.5, target: [4, 0, 4.5] }], [len(sh), { yaw: 0.05, pitch: 0.56, dist: 10.6 }]], { t });
    const env = room(g, B, 'hall', { t });
    posters(g);
    const hands = seated(g, B, 'spassky', exprAt([[0, 'neutral'], [0.8, { ...EXPR.worried, look: [0, 1] }]], lt), t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g); hands();
    B.drawPieces(g, piecesAt([{ pieces: start() }], 0), { focus: B.dist, dof: 1.3 });
    chair(g, B, 4, -2.4, { face: 1, color: '#2A3138' });
    stamp(g, 'FORFEIT', W / 2, 1640, lt, w('refuses', 'play') - s('refuses'), { sub: 'GAME 2 · FISCHER ABSENT' });
  }, { trans: 'leak' });
  cue(w('refuses', 'play'), 'stamp', 1); cue(s('refuses') + 0.2, 'clock', 0.5);

  // S17 — down two to zero
  shot(s('down'), (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.36, -0.1], dist: [8.4, 9.4], pitch: [0.26, 0.2], cy: H * 0.52 }), { t, e: ease.out });
    const env = room(g, B, 'hall', { t, blur: 6 });
    posters(g);
    seated(g, B, 'bobby72', { ...EXPR.angry, shake: 0.6 * pulse(t, w('down', 'two'), 0.5) }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt([{ pieces: start() }], 0), { focus: B.dist, dof: 1.7 });
    const f = pulse(t, w('down', 'two'), 0.4);
    scoreboard(g, 'SPASSKY', 'FISCHER', t >= w('down', 'two') ? '2' : '1', '0', { y: 330, flashL: f, title: 'AFTER GAME 2' });
    flash(g, 0.25 * f, C.red);
  }, { trans: 'whip' });
  cue(w('down', 'two'), 'buzz', 0.9);

  // S18 — game three in a back room: crane down past the hanging lamp
  shot(s('room'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.45, pitch: 1.05, dist: 12.5, cy: H * 0.6, target: [4, 0, 4.4] }], [len(sh), { yaw: 0.1, pitch: 0.55, dist: 10.5 }]], { t });
    const env = room(g, B, 'backroom', { t });
    const fc = tripodCam(g, B, 8.6, 4.5, 11.9, t, { flip: -1 });
    const hands = seated(g, B, 'spassky', 'focus', t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g); hands();
    B.drawPieces(g, piecesAt(G3, 0), { focus: B.dist, dof: 1.3 });
    placeStamp(g, lt, 'Game 3', 'Back room', { y: 280, t0: 0.05 });
    if (fc && t > w('room', 'No')) {
      const a = seg(t, w('room', 'No'), w('room', 'No') + 0.2);
      xMark(g, fc.x, fc.y, fc.s * 1.6 * (1 + 0.5 * (1 - ease.back(a))), C.red, a);
    }
  }, { trans: 'leak', vig: 0.75 });
  cue(s('room') + 0.1, 'lamp', 0.6); cue(w('room', 'No'), 'thud', 0.9);

  // S19 — Bobby wins, then again, and again: three hits from game 3, three camera angles, the boss bar drains
  const hits = [w('wins', 'wins'), w('again', 1), w('again', 3)];
  const g3 = new Moves(B, G3, [
    { k: 62, t0: hits[0] - 0.42 }, { k: 63, t0: hits[0] + 0.45, dur: 0.35, color: C.red },
    { k: 64, t0: hits[1] - 0.42 }, { k: 65, t0: hits[1] + 0.3, dur: 0.3, color: C.red },
    { k: 66, t0: hits[2] - 0.42 }], { dur: 0.42 });
  g3.cues(cue);
  const hp = t => 1 - hits.filter(h => t >= h).length * 0.3;
  const boss = (g, lt, t, keys) => {
    const last = hits.filter(h => t >= h).pop() ?? -9;
    rig(B, lt, keys, { t, bump: g3.bump(t) * 1.5 });
    const env = room(g, B, 'backroom', { t, blur: 1.5 });
    const n = hits.filter(h => t >= h).length;
    const hands = seated(g, B, 'spassky', n === 0 ? 'focus' : n === 1 ? { ...EXPR.worried, look: [0, 1] } : { ...EXPR.shock, shake: 0.7 }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g, { tint: C.lime, tintA: 0.3 * pulse(t, last, 0.3) }); hands();
    g3.draw(g, t, { dof: 1.2, labels: false });
    healthBar(g, 'Boris Spassky', 'WORLD CHAMPION', lerp(hp(t - 0.25), hp(t), seg(t - last, 0, 0.25)), { y: 170 });
    if (t - last < 0.5) speedlines(g, W / 2, H * 0.45, t, { a: 0.5 * (1 - (t - last) / 0.5), color: '#E9FFD0' });
    flash(g, 0.35 * pulse(t, last, 0.2), '#E6FFC8');
  };
  shot(s('wins'), (g, lt, t, sh) => boss(g, lt, t, [[0, { yaw: 0.6, pitch: 0.7, dist: 10, cy: H * 0.55, target: [3, 0, 3.5] }], [len(sh), { yaw: 0.15, pitch: 0.62, dist: 7.4 }]]), { trans: 'whip' });
  shot(hits[1] - 0.3, (g, lt, t, sh) => boss(g, lt, t, [[0, { yaw: -0.9, pitch: 0.36, dist: 7, cy: H * 0.5, target: [4.5, 0.3, 3.5] }], [len(sh), { yaw: -0.45, pitch: 0.42, dist: 5.8 }]]), { trans: 'whip', whipDir: -1 });
  shot(hits[2] - 0.3, (g, lt, t, sh) => boss(g, lt, t, [[0, { yaw: -0.1, pitch: 1.1, dist: 10, cy: H * 0.55, target: [4.5, 0, 3.5] }], [len(sh), { yaw: 0.7, pitch: 1.0, dist: 8 }]]), { trans: 'zoom' });
  hits.forEach(h => { cue(h, 'boom', 0.8); cue(h, 'hit', 0.7); });

  // S20 — World champion: a big orbit around him in a golden hall
  const champT = s('champ');
  shot(champT, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [0.6, -0.3], dist: [10.5, 9.4], pitch: [0.2, 0.14], cy: H * 0.44 }), { t, e: lin });
    const env = room(g, B, 'gold', { t, blur: 4 });
    const p = actor(g, B, 'bobby72', { x: 4, y: 3.1, z: 9.4, e: { ...EXPR.triumph, nod: 0.8 }, t });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G3, 82), { focus: B.dist, dof: 1.6 });
    if (p) {
      const k = p.s / 100 * 1.05 / 1.6;
      rays(g, p.x, p.y, t, { a: 0.16 });
      hand(g, p.x - 290 * k, p.y - 200 * k - Math.sin(lt * 8) * 18 * k, 52 * k); hand(g, p.x + 290 * k, p.y - 200 * k + Math.sin(lt * 8) * 18 * k, 52 * k);
    }
    counter(g, '12½ – 8½', null, { y: 330, size: 120, color: '#FFF4D6', glow: C.gold });
    badge(g, 'WORLD CHAMPION', W / 2, 440, { color: C.gold, size: 46, sub: 'REYKJAVIK · 1 SEPTEMBER 1972', a: seg(lt, 0.1, 0.4), scale: lerp(1.6, 1, seg(lt, 0.1, 0.4, ease.back)) });
    shockwave(g, W / 2, 440, t, champT + 0.15, { r0: 100, r1: 560, color: C.gold, lw: 14, squash: 0.5 });
    confetti(g, t, champT + 0.05);
  }, { trans: 'flash' });
  cue(champT, 'boom', 1.1); cue(champT, 'cheer', 0.8); cue(champT + 0.05, 'confetti', 0.8);

  // S21 — and then... he vanished: the chair stays
  const vanT = w('vanish', 'vanished');
  shot(s('vanish') - 0.3, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [0.3, -0.22], dist: [11.5, 9.8], pitch: [0.2, 0.16], cy: H * 0.4 }), { t });
    const env = room(g, B, 'cold', { t, blur: 4 });
    chair(g, B, 4, 10.4, { face: -1, color: '#252C31' });
    const gone = seg(t, vanT - 0.1, vanT + 0.5);
    const p = actor(g, B, 'bobby72', { x: 4, y: 3.1, z: 9.4, e: { ...EXPR.neutral, look: [0, 0.3] }, t, alpha: 1 - gone });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G3, 82), { focus: B.dist, dof: 1.6 });
    const c = B.project(4, 2.2, 9.4), k = c.s / 150;
    if (gone > 0 && gone < 1) { const r = rng(11); for (let i = 0; i < 90; i++) { const x = c.x + (r() - 0.5) * 360 * k, y = c.y + (r() - 0.6) * 700 * k; g.fillStyle = rgba('#d8dde0', (1 - gone) * 0.8); g.beginPath(); g.arc(x + (r() - 0.5) * 360 * gone * k, y - gone * 360 * r() * k, (4 + r() * 6) * k, 0, 7); g.fill(); } }
    glint(g, c.x, c.y - 120 * k, t, vanT, { r: 300, life: 0.5 });
  }, { trans: 'fade', transDur: 0.45 });
  cue(vanT, 'poof', 0.9);

  // S22 — never played for the title again: the crown falls onto the empty board
  const crownT = w('never', 'never');
  shot(s('never'), (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.95, pitch: 0.6, dist: 10, cy: H * 0.62, target: [4, 0.5, 4] }], [len(sh), { yaw: 0.25, pitch: 0.75, dist: 8.4 }]], { t });
    const env = room(g, B, 'hall', { t, blur: 2 });
    posters(g, 0.8);
    chair(g, B, 4, 10.4, { face: -1, color: '#252C31' });
    table(g, B, env); B.drawSlab(g);
    const tilt = seg(t, crownT, crownT + 0.5, ease.in);
    const cp = B.project(4, 1.2, 4), k = cp.s / 100 * 1.15;
    crown(g, cp.x + tilt * 50 * k, cp.y + tilt * 55 * k, k, { tilt: tilt * 1.25, gray: tilt });
    dust(g, cp.x + 50 * k, cp.y + 90 * k, t, crownT + 0.5, { size: 40, spread: 260, n: 14 });
    burst(g, cp.x + 50 * k, cp.y + 70 * k, t, crownT + 0.5, { n: 16, color: C.gold, speed: 700, size: 6 });
    stamp(g, 'TITLE FORFEITED', W / 2, 420, lt, w('never', 'title') - s('never'), { size: 72, sub: '1975 · NEVER DEFENDED' });
  }, { trans: 'fade', transDur: 0.4 });
  cue(crownT + 0.5, 'thud', 1); cue(crownT + 0.5, 'clack', 0.6); cue(w('never', 'title'), 'stamp', 1);

  // S23 — sure the Soviets were watching: eyes open on every wall as the camera circles him
  shot(s('watching'), (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.6, 0.55], dist: [10.5, 9], pitch: [0.2, 0.12], cy: H * 0.5 }), { t, e: lin });
    const env = room(g, B, 'dark', { t, blur: 2 });
    blindLight(g, B);
    wallEyes(g, B, lt, w('watching', 'Soviets') - s('watching'), 30);
    seated(g, B, 'bobbyBeard', { ...EXPR.paranoid, look: [Math.sin(lt * 4) > 0 ? 1 : -1, -0.3], turn: Math.sin(lt * 4) * 0.5, shake: 0.25 }, t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g);
    B.drawPieces(g, piecesAt(G3, 82), { focus: B.dist, dof: 1.6 });
  }, { trans: 'shatter', vig: 0.7 });
  cue(s('watching') + 0.3, 'heartbeat', 0.9); cue(w('watching', 'Soviets'), 'sting', 0.8);

  // S24 — so the fillings came out (graphic insert)
  shot(s('fillings'), (g, lt, t) => {
    bgBase(g, { top: '#4A1A1C', mid: '#1A0B0C', edge: '#050203', cy: H * 0.35 });
    const pops = [w('fillings', 'fillings'), w('fillings', 'came'), w('fillings', 'out')];
    camera(g, { zoom: 1.15 + pops.reduce((a, p) => a + 0.08 * pulse(t, p, 0.25), 0), rot: lerp(-0.06, 0.04, seg(lt, 0, 2)), fy: 640, t });
    tooth(g, W / 2, 680, 2.5, t, pops, { tint: 'rgba(255,60,40,0.08)' });
    pops.forEach((p, i) => { glint(g, W / 2 + [-100, 85, 0][i], 520 + [0, 15, 75][i], t, p, { r: 180 }); burst(g, W / 2 + [-100, 85, 0][i], 520, t, p, { n: 10, color: '#E8EEF2', speed: 600, size: 5, seed: i }); });
  }, { trans: 'zoom' });
  cue(w('fillings', 'fillings'), 'ting', 0.9); cue(w('fillings', 'came'), 'ting', 0.9); cue(w('fillings', 'out'), 'ting', 0.9); cue(w('fillings', 'out'), 'boom', 0.6);

  // S25a — 1992: the order from the US Treasury (document insert)
  const spitT = w('spat', 'spat');
  shot(s('spat'), (g, lt, t) => {
    bgBase(g, { top: '#2C3A45', mid: '#121A20', edge: '#04070A', cy: H * 0.3 });
    camera(g, { zoom: lerp(1.0, 1.1, seg(lt, 0, 2.0)), fy: 600, t });
    placeStamp(g, lt, 'Yugoslavia', '1992', { y: 150, t0: 0.05 });
    paper(g, W / 2, 620 + (1 - seg(lt, 0, 0.5, ease.out)) * 600, 600, 720, { rot: lerp(0.2, -0.04, seg(lt, 0, 0.5, ease.out)), title: 'U.S. DEPARTMENT\nOF THE TREASURY', lines: 9 });
    badge(g, 'EXECUTIVE ORDER 12810', W / 2, 1060, { color: C.blue, size: 30, a: seg(lt, 0.7, 1.0) });
  }, { trans: 'leak' });
  cue(s('spat') + 0.1, 'whoosh', 0.7); cue(w('spat', '1992'), 'boom', 0.7);
  // S25b — he spits (toward the lens)
  shot(w('spat', 'he') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, orbit(FAR, len(sh), { yaw: [-0.3, 0.08], dist: [7.6, 6.2], pitch: [0.1, 0.08], cy: H * 0.43 }), { t, e: ease.out });
    const env = room(g, B, 'cold', { t, blur: 6 });
    const p = actor(g, B, 'bobbyBeard', { x: 4, y: 3.1, z: 9.4, e: exprAt([[0, 'angry'], [spitT - (w('spat', 'he') - 0.05) - 0.12, { ...EXPR.angry, mouth: 'o', open: 0.4, shake: 0.4 }], [spitT - (w('spat', 'he') - 0.05) + 0.3, { ...EXPR.smug, browTilt: 0.6 }]], lt), t });
    table(g, B, env); B.drawSlab(g);
    const u = (t - spitT) / 0.35;
    if (p && u > 0 && u < 1) { const k = ease.in(u), sc = p.s / 100; g.save(); g.fillStyle = 'rgba(200,230,240,0.9)'; g.beginPath(); g.ellipse(p.x, p.y + 80 * sc - k * 200, 14 + k * 160, 10 + k * 120, 0, 0, 7); g.fill(); g.restore(); }
  }, { trans: 'whip' });
  cue(spitT, 'spit', 1);
  // S25c — on the order: splat, then WARRANT
  shot(w('spat', 'order') - 0.05, (g, lt, t) => {
    bgBase(g, { top: '#2C3A45', mid: '#121A20', edge: '#04070A', cy: H * 0.3 });
    camera(g, { zoom: lerp(1.3, 1.15, seg(lt, 0, 0.4, ease.out)), fy: 620, t });
    paper(g, W / 2, 620, 600, 720, { rot: -0.04, title: 'U.S. DEPARTMENT\nOF THE TREASURY', lines: 9 });
    spit(g, W / 2, 620, W / 2 + 20, 600, 1 + clamp(lt / 0.6));
    stamp(g, 'WARRANT', W / 2, 640, lt, w('spat', 'government') - (w('spat', 'order') - 0.05), { size: 110, sub: 'ARREST ORDERED' });
  }, { trans: 'zoom' });
  cue(w('spat', 'order') - 0.05, 'splat', 0.9); cue(w('spat', 'government'), 'stamp', 1);

  // S26 — never went home: exile route (starts on the USA, pans east)
  shot(s('home'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0.5, 2.3, ease.inOut);
    map.view({ lon: lerp(-80, 75, u), lat: lerp(40, 38, u), zoom: lerp(7, 6, u), cy: H * 0.46 });
    const usa = seg(t, w('home', 'never'), w('home', 'never') + 0.3);
    map.draw(g, { spacing: 14, color: id => id === ISO.USA ? (usa > 0.5 ? rgba(C.red, 0.85) : '#6C93A3') : null });
    const [ux, uy] = map.proj(-98, 39);
    xMark(g, ux, uy, 180 * (1 + 0.6 * (1 - ease.back(usa))), C.red, usa);
    map.route(g, 'Belgrade', 'Budapest', seg(lt, 0.9, 1.2), { bend: 0.4 });
    map.route(g, 'Budapest', 'Manila', seg(lt, 1.1, 1.9), { bend: 0.25 });
    map.route(g, 'Manila', 'Tokyo', seg(lt, 1.8, 2.2), { bend: 0.3 });
    for (const [c, a0, below] of [['Belgrade', 0.8, true], ['Budapest', 1.0, false], ['Manila', 1.8, true], ['Tokyo', 2.1, false]]) map.pin(g, c, { a: seg(lt, a0, a0 + 0.2), below, pulse: lt > a0 ? ((lt - a0) * 1.5) % 1 : 0 });
    placeStamp(g, lt, 'Exile', '1992 – 2004', { y: 160 });
  }, { trans: 'whip' });
  cue(w('home', 'never'), 'buzz', 0.8); cue(s('home') + 0.9, 'whoosh', 0.5); cue(s('home') + 1.6, 'whoosh', 0.5);

  // S27 — Iceland took him in
  shot(s('iceland'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.0, ease.inOut);
    map.view({ lon: lerp(60, -20, u), lat: lerp(42, 62, u), zoom: lerp(3.6, 14, u), cy: H * 0.47 });
    const ic = seg(t, w('iceland', 'Iceland'), w('iceland', 'Iceland') + 0.4);
    map.draw(g, { spacing: 13, color: id => id === ISO.ISL ? rgba(C.blue, 0.4 + 0.6 * ic) : id === ISO.USA ? rgba(C.red, 0.85) : null });
    map.route(g, 'Tokyo', 'Reykjavik', seg(lt, 0, 1.5), { bend: 0.35, color: C.blue });
    map.pin(g, 'Reykjavik', { color: C.blue, a: seg(lt, 1.2, 1.5), pulse: (lt * 0.8) % 1 });
    badge(g, 'ICELANDIC CITIZEN', W / 2, 300, { color: C.blue, size: 40, sub: 'MARCH 2005', a: seg(lt, 0.9, 1.2), scale: lerp(1.5, 1, seg(lt, 0.9, 1.2, ease.back)) });
  });
  cue(w('iceland', 'Iceland'), 'shimmer', 0.8);

  // S28a — he died in Reykjavik: a winter room, the old man at the board, a candle
  const kingT = w('died', 'king');
  const lastBoard = (g, lt, t, keys, blur = 0) => {
    rig(B, lt, keys, { t, shake: 0.6 });
    const env = room(g, B, 'cold', { t, blur });
    const hands = seated(g, B, 'bobbyOld', exprAt([[0, 'tired'], [0.8, { ...EXPR.sad, look: [0, 1] }]], lt), t, { z: 9.4 });
    table(g, B, env); B.drawSlab(g); hands();
    const kg = seg(t, kingT - 0.1, kingT + 0.4);
    B.drawPieces(g, [{ t: 'k', c: 'w', x: 4.5, z: 5.5, glow: kg > 0.05 ? C.gold : null, halo: C.gold, haloA: kg, sharp: true }, { t: 'p', c: 'b', x: 2.5, z: 3.5 }, { t: 'p', c: 'w', x: 6.5, z: 2.5 }], { focus: B.dist });
    if (B.toCam(7.4, 0, 6.8)[2] > 1) { const cp = B.project(7.4, 0, 6.8); candle(g, cp.x, cp.y, cp.s / 110, t); }
    bokeh(g, t, { n: 10, color: '#cfe6ff', a: 0.05, seed: 8 });
  };
  shot(s('died'), (g, lt, t, sh) => {
    lastBoard(g, lt, t, [[0, { yaw: 0.45, pitch: 0.58, dist: 13.5, cy: H * 0.56, target: [4, 0, 4.6] }], [len(sh), { yaw: 0.05, pitch: 0.55, dist: 11 }]]);
    placeStamp(g, lt, 'Reykjavik', '2008', { y: 160, t0: 0.05 });
    photoCard(g, P.grave, lt, w('died', 'died') - s('died'), { x: 225, y: 1000, w: 280, aspect: 1.2, rot: -0.05, from: 'left', tone: 'warm', caption: 'LAUGARDÆLIR', credit: 'Ted Cross · CC BY 2.0', fx: 0.6, fy: 0.3, zoom: [1.0, 1.08], dur: 4 });
  }, { trans: 'fade', transDur: 0.5, vig: 0.7 });
  // S28b — the city where he became king: low on the glowing king
  shot(w('died', 'The') - 0.08, (g, lt, t, sh) => {
    lastBoard(g, lt, t, [[0, { yaw: -0.7, pitch: 0.24, dist: 6, cy: H * 0.5, target: [4.5, 0.7, 5.5] }], [len(sh), { yaw: -0.15, pitch: 0.3, dist: 4.9 }]], 4);
    const kp = B.project(4.5, 1.1, 5.5);
    rays(g, kp.x, kp.y, t, { a: 0.14 * seg(t, kingT - 0.1, kingT + 0.4), color: '#ffe9a8', len: 900 });
    glint(g, kp.x, kp.y - 40, t, kingT, { r: 260, color: C.gold });
  }, { trans: 'fade', transDur: 0.4, vig: 0.7 });
  cue(w('died', 'died'), 'boom', 0.6); cue(kingT, 'shimmer', 0.8);

  // S29 — age 64: squares light up while the camera spins overhead
  const sqA = w('age64', 'Age'), sqB = w('age64', 'sixty-four') + 0.6;
  const lit = t => Math.floor(clamp((t - sqA) / (sqB - sqA)) * 64);
  shot(s('age64') - 0.2, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.7, pitch: 1.12, dist: 13, cy: H * 0.55, target: [4, 0, 4] }], [len(sh), { yaw: 1.0, pitch: 1.02, dist: 11.5 }]], { t, e: lin });
    const env = room(g, B, 'cold', { t });
    chair(g, B, 4, 10.4, { face: -1, color: '#252C31' });
    table(g, B, env); B.drawSlab(g);
    const n = lit(t);
    for (let i = 0; i < n; i++) { const f = i % 8, r = Math.floor(i / 8); B.highlight(g, String.fromCharCode(97 + (r % 2 ? 7 - f : f)) + (r + 1), C.gold, 0.55, false); }
    counter(g, String(n).padStart(2, '0'), n >= 64 ? 'YEARS · SQUARES' : 'YEARS', { y: 320, size: 170 * (1 + 0.15 * pulse(t, sqB, 0.3)), color: '#FFF4D6', glow: C.gold, labelColor: C.gold });
    const c = B.project(4, 0, 4); shockwave(g, c.x, c.y, t, sqB, { r0: 100, r1: 700, color: C.gold, lw: 14, squash: 0.6 });
  }, { trans: 'leak' });
  for (let i = 0; i < 64; i += 4) cue(sqA + i / 64 * (sqB - sqA), 'tick', 0.4);
  cue(sqB, 'boom', 0.9);

  // S30 — one year for every square: back in the red hall, back to the start (loop)
  const endT = s('square');
  shot(endT, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.7, pitch: 0.95, dist: 11, cy: H * 0.55, target: [4, 0, 4.4] }], [len(sh), { yaw: -0.6, pitch: 0.62, dist: 15 }]], { t });
    const env = room(g, B, 'crimson', { t });
    machine(g, B, t, { a: seg(lt, 1.0, 1.8) });
    const hands = seated(g, B, 'bobby72', 'smug', t, { z: 9.6, alpha: seg(lt, 0.8, 1.6) });
    table(g, B, env); B.drawSlab(g); hands();
    for (let i = 0; i < 64; i++) B.highlight(g, String.fromCharCode(97 + (i % 8)) + (Math.floor(i / 8) + 1), C.gold, 0.5 * (1 - seg(lt, 1.2, 2.4)), false);
    B.drawPieces(g, [{ t: 'k', c: 'w', x: 4.5, z: 7.5 }, { t: 'q', c: 'w', x: 3.5, z: 7.4 }, { t: 'r', c: 'w', x: 1.5, z: 7.6 }, { t: 'r', c: 'w', x: 6.5, z: 7.6 }, { t: 'n', c: 'w', x: 2.5, z: 7.3 }, { t: 'b', c: 'w', x: 5.5, z: 7.3 }, ...kings.map(([x, z]) => ({ t: 'k', c: 'b', x, z }))].map(p => ({ ...p, alpha: p.c === 'b' ? seg(lt, 1.6, 2.4) : 1 })), { focus: 11, dof: 1.4 });
    const a = seg(t, w('square', 'every') - 0.2, w('square', 'every') + 0.3), sc = lerp(1.3, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 300); g.scale(sc, sc); g.translate(-W / 2, -300);
    glowText(g, 'BOBBY FISCHER', W / 2, 250, { font: serif(86, 800), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 20 });
    glowText(g, '1943 – 2008', W / 2, 315, { font: serif(36, 700), fill: C.gold, glow: 'rgba(0,0,0,0.9)', blur: 10, spacing: 6 });
    glowText(g, '64 SQUARES  ·  64 YEARS', W / 2, 372, { font: mono(28, 800), fill: C.lime, glow: 'rgba(0,0,0,0.9)', blur: 8, spacing: 6 });
    g.restore();
  }, { trans: 'flash' });
  cue(w('square', 'every'), 'shimmer', 0.8); cue(w('square', 'board'), 'boom', 1);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);

  // music: sections plus deliberate drops to (near) silence right before the big reveals
  const music = [
    { t: 0, m: 'hook' }, { t: s('ny') - 0.1, m: 'intrigue' }, { t: w('queen', 'hanging') + 0.3, m: 'drop' }, { t: s('purpose'), m: 'intrigue' },
    { t: s('later') - 0.2, m: 'tension' }, { t: w('later', 'later') + 0.4, m: 'drop' }, { t: mateT, m: 'hit' }, { t: s('century'), m: 'glory' },
    { t: s('rey') - 0.1, m: 'coldwar' }, { t: s('refuses'), m: 'drop' }, { t: w('refuses', 'play') + 0.1, m: 'coldwar' }, { t: s('room') - 0.1, m: 'build' },
    { t: s('champ') - 0.35, m: 'drop' }, { t: champT, m: 'victory' },
    { t: s('vanish') - 0.3, m: 'void' }, { t: s('watching'), m: 'paranoia' }, { t: s('spat'), m: 'exile' }, { t: s('home') - 0.3, m: 'drop' }, { t: s('home'), m: 'exile' },
    { t: s('died') - 0.4, m: 'drop' }, { t: s('died'), m: 'elegy' }, { t: endT, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  return { shots, cues, music, tvOff, duration: T.duration };
}

// initial position piece list
function start() {
  const back = 'rnbqkbnr', out = [];
  for (let f = 0; f < 8; f++) {
    const file = String.fromCharCode(97 + f);
    out.push({ t: back[f], c: 'w', sq: file + 1 }, { t: 'p', c: 'w', sq: file + 2 }, { t: 'p', c: 'b', sq: file + 7 }, { t: back[f], c: 'b', sq: file + 8 });
  }
  return out.map((p, i) => ({ ...p, id: 'x' + i }));
}
