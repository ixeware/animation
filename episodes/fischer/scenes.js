// Bobby Fischer — shots, timed to narration words. Every shot draws a full frame.
import { W, H, C, clamp, lerp, ease, seg, env, pulse, track, rgba, rng, noise1, inv } from '../../engine/js/core.js';
import { bgBase, spotlight, beam, bokeh, speedlines, rays, confetti, flash, camera, target, xMark, outlinedText, glowText, shadowEllipse } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ, drawBow } from '../../engine/js/board.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { drawChar, exprAt, hand, EXPR } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, healthBar, scoreboard, vsSplit, vsLabel, paper, mono, serif, sans } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { loadImage, photoCard } from '../../engine/js/photo.js';

const GOC = await fetch('../engine/data/game_of_century.json').then(r => r.json());
const map = await new DotMap().init();
// real archival photos (free licenses, see photos/credits.json)
const P = Object.fromEntries(await Promise.all(['fischer13', 'fischer1972', 'spassky1973', 'grave'].map(async k => [k, await loadImage(`../episodes/fischer/photos/${k}.jpg`)])));

// ---------- shared pieces of staging ----------
const B = new Board();

// character sitting behind the far edge of the board
function seated(g, b, who, e, t, { x = 4, z = 9.3, k = 1.0, hands = true, handY = 0.25, lift = 3.1, alpha = 1, hx = 1.6 } = {}) {
  const a = b.project(x, 0, z);
  drawChar(g, who, { x: a.x, y: a.y - lift * a.s, s: a.s * k / 100 * 1.05, e, t, alpha });
  return () => { // hands are drawn after the board
    if (!hands) return;
    for (const sd of [-1, 1]) { const p = b.project(x + sd * hx, handY, z - 0.75); hand(g, p.x, p.y, 0.33 * p.s); }
  };
}

function woodRoom(g) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3B2A1F'); gr.addColorStop(0.5, '#24190F'); gr.addColorStop(1, '#0C0806');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0,0,0,0.22)'; for (let x = -40; x < W; x += 180) g.fillRect(x, 0, 14, H * 0.55);
  g.fillStyle = 'rgba(255,200,140,0.05)'; for (let x = 30; x < W; x += 180) g.fillRect(x, 60, 110, H * 0.45);
  spotlight(g, W / 2, H * 0.28, 620, '#ffd9a0', 0.22);
}
function crimson(g, cy = H * 0.3) { bgBase(g, { top: '#6A1A1E', mid: '#2A0A0C', edge: '#080203', cy }); }
function coldRoom(g) { bgBase(g, { top: '#2C3A45', mid: '#121A20', edge: '#04070A', cy: H * 0.3 }); }

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

function blinds(g, lt, a = 1) {
  g.save(); g.globalAlpha *= a;
  for (let i = 0; i < 14; i++) {
    const y = 140 + i * 58, gr = g.createLinearGradient(0, y, 0, y + 30);
    gr.addColorStop(0, 'rgba(210,225,235,0.22)'); gr.addColorStop(1, 'rgba(210,225,235,0.02)');
    g.fillStyle = gr; g.fillRect(140, y, 800, 30);
  }
  g.restore();
}

function eyesInDark(g, lt, t0, n, seed = 4) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = 90 + r() * 900, y = 130 + r() * 1100, s = 0.5 + r() * 0.9, d = t0 + i * 0.09;
    if (lt < d) continue;
    const a = clamp((lt - d) / 0.2), bl = ((lt + i) % 3.1) < 0.12 ? 0.1 : 1;
    g.save(); g.globalAlpha *= a; g.fillStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 24;
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * 26 * s, y, 13 * s, 7 * s * bl, sd * 0.2, 0, 7); g.fill(); }
    g.restore();
  }
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

// ---------- the film ----------
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });

  // S1 — hook: the Soviet kings fall
  const kings = [[1.5, 5.5], [3.2, 4.6], [5.0, 5.2], [6.6, 4.4], [2.4, 3.2], [4.4, 2.8], [6.0, 2.4], [1.2, 2.0]];
  const fallAt = i => w('hook1', 'beat') + i * 0.26;
  shot(0, (g, lt, t) => {
    crimson(g, H * 0.25);
    for (let i = 0; i < 5; i++) drawChar(g, i % 2 ? 'spassky' : 'byrne', { x: 140 + i * 200, y: 330 + (i % 2) * 40, s: 0.62, silhouette: true, eyeGlow: C.red, t, alpha: 0.85 * (1 - seg(t, 2.6, 3.4)) });
    B.setCam({ yaw: 0.06 * Math.sin(t * 0.3), pitch: 0.6, dist: lerp(12.5, 11.2, seg(t, 0, 3.8)), fov: 1500, cy: H * 0.55, target: [4, 0, 4.4] });
    const hands = seated(g, B, 'bobby72', exprAt([[0, 'focus'], [w('hook1', 'Soviet'), 'smug']], t), t, { z: 9.6 });
    B.drawSlab(g); hands();
    const ps = [{ t: 'k', c: 'w', x: 4.5, z: 7.5 }, { t: 'q', c: 'w', x: 3.5, z: 7.4 }, { t: 'r', c: 'w', x: 1.5, z: 7.6 }, { t: 'r', c: 'w', x: 6.5, z: 7.6 }, { t: 'n', c: 'w', x: 2.5, z: 7.3 }, { t: 'b', c: 'w', x: 5.5, z: 7.3 }];
    kings.forEach(([x, z], i) => {
      const u = seg(t, fallAt(i), fallAt(i) + 0.35, ease.in);
      ps.push({ t: 'k', c: 'b', x: x + u * 0.4, z, rot: u * 1.45, alpha: 1 - seg(t, fallAt(i) + 0.6, fallAt(i) + 1.2) * 0.55 });
      if (u > 0 && u < 1) B.highlight(g, String.fromCharCode(97 + Math.floor(x)) + (Math.floor(z) + 1), C.red, 0.5 * (1 - u));
    });
    B.drawPieces(g, ps, { focus: 11, dof: 1.4 });
  }, { vig: 0.6 });
  kings.forEach((_, i) => cue(fallAt(i) + 0.3, 'clack', 0.7));
  cue(0.05, 'boom', 1); cue(w('hook1', 'chess'), 'hit', 0.6);

  // S2 — fillings out
  shot(s('hook2'), (g, lt, t) => {
    bgBase(g, { top: '#3A2326', mid: '#160E10', edge: '#050304', cy: H * 0.35 });
    camera(g, { zoom: lerp(1, 1.08, seg(lt, 0, 2.5)), t });
    spotlight(g, W / 2, 640, 520, '#ffe0d0', 0.18);
    tooth(g, W / 2 + 40, 640, 2.2, t, [w('hook2', 'fillings'), w('hook2', 'teeth'), w('hook2', 'teeth') + 0.22]);
    drawChar(g, 'bobbyBeard', { x: 250, y: 1420, s: 1.25, e: exprAt([[0, 'worried'], [0.9, 'paranoid']], lt), t, tilt: 0.12 });
  }, { trans: 'zoom' });
  cue(w('hook2', 'fillings'), 'ting', 0.9); cue(w('hook2', 'teeth'), 'ting', 0.8); cue(w('hook2', 'teeth') + 0.22, 'ting', 0.7); cue(s('hook2'), 'whoosh', 0.8);

  // S3 — nobody gets inside his head
  shot(s('hook3'), (g, lt, t) => {
    bgBase(g, { top: '#1F2A31', mid: '#0D1317', edge: '#030506', cy: H * 0.36 });
    const look = Math.sin(lt * 5) > 0 ? [1, 0] : [-1, 0];
    waves(g, W / 2, 700, lt, { block: seg(t, w('hook3', 'nobody'), w('hook3', 'nobody') + 0.3) });
    camera(g, { zoom: lerp(1, 1.12, seg(t, w('hook3', 'head') - 0.2, w('hook3', 'head') + 0.4)), fy: 700, t });
    drawChar(g, 'bobbyBeard', { x: W / 2, y: 720, s: 1.45, e: { ...EXPR.paranoid, look }, t });
  });
  cue(s('hook3'), 'static', 0.5); cue(w('hook3', 'nobody'), 'shield', 0.8); cue(w('hook3', 'head'), 'boom', 0.7);

  // S4 — New York 1956
  shot(s('ny'), (g, lt, t) => {
    woodRoom(g);
    photoCard(g, P.fischer13, lt, -1, { x: 205, y: 470, w: 240, aspect: 0.95, rot: -0.035, style: 'frame', tone: 'sepia', fx: 0.42, fy: 0.42, credit: 'United Press · PD', zoom: [1.05, 1.12], dur: 3 });
    B.setCam({ yaw: -0.2 + lt * 0.03, pitch: 0.58, dist: 12.5 - lt * 0.15, fov: 1450, cy: H * 0.56, target: [4, 0, 4.6] });
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'focus']], lt), t, { z: 9.4 });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); hands();
    B.drawPieces(g, piecesAt(GOC, 33), { focus: 12, dof: 1.5 });
    placeStamp(g, lt, 'New York', '1956', { y: 160, t0: 0.05 });
  }, { trans: 'leak' });
  cue(s('ny'), 'whoosh', 0.9); cue(w('ny', '1956'), 'boom', 0.8);

  // S5 — Bobby is 13
  shot(s('age'), (g, lt, t) => {
    woodRoom(g);
    camera(g, { zoom: lerp(1, 1.06, seg(lt, 0, 2.3)), fy: 760, t });
    const ph = w('age', 'thirteen') - s('age') - 0.15;
    drawChar(g, 'bobby13', { x: lerp(W / 2, 300, seg(lt, ph, ph + 0.45, ease.inOut)), y: 760, s: 1.6, e: exprAt([[0, 'neutral'], [0.9, 'focus']], lt), t });
    photoCard(g, P.fischer13, lt, ph, { x: 790, y: 790, w: 400, aspect: 1.0, rot: 0.06, from: 'right', caption: 'BOBBY · APRIL 1956', credit: 'United Press · Public domain', fx: 0.4, fy: 0.42, zoom: [1.0, 1.1], dur: 2.5 });
    for (const [x, ty] of [[180, 'p'], [880, 'n'], [540, 'k']]) drawPiece(g, ty, 'w', x, 1500, 520, { blur: 14 });
    nameTitle(g, lt, 'Bobby Fischer', '13 YEARS OLD', { y: 210, t0: 0.05, subColor: C.gold });
  });
  cue(w('age', 'thirteen'), 'tick', 0.8); cue(w('age', 'thirteen') - 0.15, 'whoosh', 0.6); cue(w('age', 'thirteen') + 0.2, 'shutter', 0.7);

  // S6a — against a master
  shot(s('queen'), (g, lt, t) => {
    woodRoom(g);
    camera(g, { zoom: lerp(1.04, 1, seg(lt, 0, 1.3)), fy: 760, t });
    drawChar(g, 'byrne', { x: W / 2, y: 760, s: 1.55, e: 'smug', t });
    for (const [x, ty] of [[220, 'q'], [860, 'b']]) drawPiece(g, ty, 'b', x, 1500, 540, { blur: 14 });
    nameTitle(g, lt, 'Donald Byrne', 'U.S. MASTER', { y: 210, t0: 0.05, subColor: C.red });
  }, { trans: 'whip' });
  cue(s('queen'), 'whoosh', 0.7);

  // S6b — he leaves his queen hanging: 17...Be6!!
  const beT = w('queen', 'leaves');
  shot(w('queen', 'he') - 0.05, (g, lt, t) => {
    woodRoom(g);
    B.setCam({ yaw: 0.35 - lt * 0.04, pitch: 0.82, dist: 8.6 - lt * 0.3, fov: 1500, cy: H * 0.52, target: [3.4, 0, 5.2] });
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'focus'], [1.0, 'smug']], lt), t, { z: 9.4 });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); hands();
    const u = seg(t, beT, beT + 0.55, x => x);
    const qa = seg(t, w('queen', 'queen') - 0.1, w('queen', 'queen') + 0.2);
    B.highlight(g, 'g4', C.red, 0.55 * u); B.highlight(g, 'e6', C.teal, 0.6 * u);
    B.dots(g, C.red, 0.5 * qa, ['b6']);
    B.drawPieces(g, piecesAt(GOC, 34, u, { opts: { q2: { halo: C.red, haloA: qa * (0.7 + 0.3 * Math.sin(t * 9)), sharp: true } } }), { focus: 8.6, dof: 1.2 });
    B.reticle(g, 'e6', t, C.teal, u);
    B.laser(g, 'c5', 'b6', C.red, qa, 0.7, seg(t, w('queen', 'queen') - 0.1, w('queen', 'queen') + 0.25));
    const [bx, bz] = sqXZ('b6'), qp = B.project(bx, 0.75, bz);
    target(g, qp.x, qp.y, 70, t, C.red, qa);
    B.label(g, 'e6', '17...Be6!!', C.lime, u);
  });
  cue(beT + 0.5, 'clack', 1); cue(w('queen', 'queen'), 'alarm', 0.6); cue(w('queen', 'hanging'), 'boom', 0.6);

  // S7 — on purpose
  shot(s('purpose'), (g, lt, t) => {
    woodRoom(g);
    camera(g, { zoom: lerp(1.0, 1.22, seg(lt, 0, 1.6, ease.out)), fy: 700, t });
    drawChar(g, 'bobby13', { x: W / 2, y: 760, s: 1.6, e: exprAt([[0, 'smug']], lt), t });
    drawPiece(g, 'q', 'b', 860, 1520, 560, { blur: 12 });
  }, { trans: 'zoom' });
  cue(s('purpose'), 'whoosh', 0.6); cue(w('purpose', 'purpose'), 'pluck', 0.8);

  // S8 — fast forward to mate (plies 35..82)
  const ffA = s('later') - 0.2, ffB = w('later', 'later') + 0.55, slowB = s('mate1') - 0.05, mateT = w('mate1', 0);
  const plyAt = t => {
    if (t < ffA) return [34, 1];
    if (t < ffB) { const x = 34 + (t - ffA) / (ffB - ffA) * (78 - 34); return [Math.floor(x) + 1, x % 1]; }
    if (t < slowB) { const x = 78 + (t - ffB) / (slowB - ffB) * 3; return [Math.floor(x) + 1, (x % 1) * 1.6]; }
    return [82, clamp((t - slowB) / 0.25)];
  };
  shot(ffA, (g, lt, t) => {
    const mated = t >= mateT;
    const tint = mated ? seg(t, mateT, mateT + 0.15) * (1 - 0.6 * seg(t, mateT + 0.3, mateT + 1)) : 0;
    bgBase(g, { top: mated ? '#30402A' : '#2A3238', cy: H * 0.3 });
    const tz = lerp(4.2, 1.6, seg(t, ffA, slowB)), tx = lerp(4, 2.6, seg(t, ffA, slowB));
    B.setCam({ yaw: lerp(-0.3, 0.25, seg(t, ffA, slowB)), pitch: lerp(0.75, 0.9, seg(t, ffB, mateT)), dist: lerp(11, 7.5, seg(t, ffB, mateT + 0.5)), fov: 1500, cy: H * 0.5, target: [tx, 0, tz] });
    const hands = seated(g, B, 'bobby13', exprAt([[0, 'focus'], [mateT - ffA, 'triumph']], lt), t, { z: 9.4 });
    B.drawSlab(g, { tint: C.lime, tintA: tint * 0.25 }); hands();
    const [k, u] = plyAt(t), P = GOC[Math.min(k, 82)];
    if (P.from) { B.highlight(g, P.from, C.red, 0.45); B.highlight(g, P.to, C.teal, 0.55); }
    if (mated) {
      const m = seg(t, mateT, mateT + 0.3);
      B.dots(g, C.red, 0.85 * m, ['b1', 'b2', 'd1', 'd2', 'c1']);
      B.dots(g, C.lime, 0.35 * m);
    }
    B.drawPieces(g, piecesAt(GOC, Math.min(k, 82), clamp(u), { arc: 0.5 }), { focus: B.dist, dof: 1.0 });
    if (mated) {
      const m = seg(t, mateT + 0.1, mateT + 0.4);
      for (const sq of ['b1', 'b2', 'd1', 'd2']) { const [x, z] = sqXZ(sq), p = B.project(x, 0.05, z); xMark(g, p.x, p.y, p.s * 0.45, C.red, m); }
      const kp = B.project(2.5, 0.8, 0.5); target(g, kp.x, kp.y, 80, t, C.red, m);
      B.laser(g, 'c2', 'c1', C.red, m, 0.6);
      B.label(g, 'c2', '41...Rc2#', C.lime, m, 2.0);
      speedlines(g, W / 2, H * 0.45, t, { a: 0.55 * (1 - seg(t, mateT + 0.2, mateT + 0.9)), color: '#E9FFD0' });
    } else if (P.san) {
      B.label(g, P.to, P.san, C.teal, 0.9);
    }
    const mv = Math.min(41, Math.ceil(k / 2));
    if (t < mateT) badge(g, `▶▶  MOVE ${String(mv).padStart(2, '0')}`, W / 2, 170, { color: C.teal, size: 40, a: env(t, ffA, mateT, 0.2, 0.15) });
    flash(g, 0.55 * pulse(t, mateT, 0.25), '#E6FFC8');
  }, { trans: 'leak' });
  for (let k = 35; k <= 78; k += 2) cue(ffA + (k - 34) / 44 * (ffB - ffA), 'tick', 0.35);
  for (let i = 0; i < 3; i++) cue(ffB + (i + 0.6) / 3 * (slowB - ffB), 'clack', 0.8);
  cue(ffB, 'riser', 0.9); cue(mateT, 'boom', 1.1); cue(mateT, 'hit', 0.9);

  // S9 — Byrne shocked
  shot(s('mate1') + 0.85, (g, lt, t) => {
    crimson(g, H * 0.4);
    speedlines(g, W / 2, 800, t, { a: 0.35, color: '#ffb0a0' });
    camera(g, { zoom: lerp(1.15, 1.25, lt), fy: 800, t, shake: 6 * (1 - clamp(lt / 0.5)) });
    drawChar(g, 'byrne', { x: W / 2, y: 820, s: 1.9, e: 'shock', t });
  }, { trans: 'whip' });

  // S10 — The Game of the Century
  shot(s('century'), (g, lt, t) => {
    woodRoom(g);
    rays(g, W / 2, 260, t, { a: 0.1 * seg(t, w('century', 'Game') - 0.2, w('century', 'Game') + 0.3) });
    B.setCam({ yaw: 0.2 + lt * 0.05, pitch: lerp(0.6, 1.0, seg(lt, 0, 3, ease.inOut)), dist: lerp(10, 12.5, seg(lt, 0, 3)), fov: 1500, cy: H * 0.68, target: [4, 0, 4] });
    const hands = seated(g, B, 'bobby13', 'happy', t, { z: 9.4 });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' }); hands();
    B.drawPieces(g, piecesAt(GOC, 82), { focus: B.dist, dof: 1.2 });
    const a = seg(t, w('century', 'Game') - 0.15, w('century', 'Game') + 0.25, ease.out);
    g.save(); g.globalAlpha = a;
    glowText(g, 'THE GAME', W / 2, 250 - (1 - a) * 30, { font: serif(92, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    glowText(g, 'OF THE CENTURY', W / 2, 345 - (1 - a) * 30, { font: serif(70, 800), fill: C.gold, glow: 'rgba(245,196,81,0.6)', blur: 30 });
    glowText(g, 'BYRNE 0 – 1 FISCHER  ·  OCT 17, 1956', W / 2, 410, { font: mono(24, 800), fill: C.cream, glow: 'rgba(0,0,0,0.8)', blur: 8, spacing: 4, a: seg(t, w('century', 'Century') , w('century', 'Century') + 0.4) });
    g.restore();
  }, { trans: 'flash' });
  cue(w('century', 'Game'), 'boom', 1); cue(w('century', 'Game'), 'shimmer', 0.7);

  // S11 — Reykjavik 1972 on the map
  shot(s('rey'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.6, ease.inOut);
    map.view({ lon: lerp(-55, -24, u), lat: lerp(50, 62, u), zoom: lerp(9, 16, u), cy: H * 0.47 });
    map.draw(g, { spacing: 15, base: '#4F7787', color: id => id === ISO.ISL ? rgba(C.blue, 0.95) : id === ISO.USA ? '#456C7C' : id === ISO.RUS ? '#7A3A36' : null });
    map.route(g, 'New York', 'Reykjavik', seg(lt, 0.1, 1.6), { color: C.gold, bend: 0.3 });
    map.pin(g, 'New York', { color: C.gold, a: 1 - seg(lt, 1.6, 2.2) });
    map.pin(g, 'Reykjavik', { color: C.blue, a: seg(lt, 1.2, 1.6), pulse: (lt * 0.8) % 1 });
    placeStamp(g, lt, 'Reykjavik', '1972', { y: 160, t0: 0.1 });
    badge(g, 'MATCH OF THE CENTURY', W / 2, 260, { color: C.red, size: 30, a: seg(t, w('rey', '1972'), w('rey', '1972') + 0.3) });
    photoCard(g, P.fischer1972, lt, w('rey', '1972') - s('rey'), { x: 850, y: 1050, w: 260, aspect: 1.25, rot: 0.07, caption: 'FISCHER · 1972', credit: 'Anefo / Nationaal Archief · CC0', fx: 0.5, fy: 0.32, zoom: [1.0, 1.08], dur: 2 });
  }, { trans: 'leak' });
  cue(s('rey'), 'whoosh', 0.9); cue(w('rey', '1972'), 'boom', 0.9); cue(w('rey', '1972') + 0.1, 'shutter', 0.6);

  // S12 — Boris Spassky, World champion (VS)
  const vsT = s('spassky');
  shot(vsT, (g, lt, t) => {
    g.fillStyle = '#05080B'; g.fillRect(0, 0, W, H);
    vsSplit(g, lt, { left: '#6E1A1F', right: '#123A57' });
    spotlight(g, 280, 820, 500, '#ff9a8a', 0.18); spotlight(g, 800, 820, 500, '#9ad0ff', 0.18);
    drawChar(g, 'spassky', { x: 290 - (1 - seg(lt, 0, 0.4, ease.out)) * 400, y: 860, s: 1.25, e: exprAt([[0, 'neutral'], [1.2, 'smug']], lt), t });
    drawChar(g, 'bobby72', { x: 800 + (1 - seg(lt, 0, 0.4, ease.out)) * 400, y: 860, s: 1.25, e: 'focus', t });
    vsLabel(g, lt, 0.15, W / 2, 520);
    photoCard(g, P.spassky1973, lt, 0.35, { x: 175, y: 430, w: 220, aspect: 1.2, rot: -0.1, caption: 'SPASSKY', credit: 'Anefo · CC0', fx: 0.45, fy: 0.3, zoom: [1.15, 1.2] });
    photoCard(g, P.fischer1972, lt, 0.55, { x: 905, y: 430, w: 220, aspect: 1.2, rot: 0.1, caption: 'FISCHER', credit: 'Anefo · CC0', fx: 0.5, fy: 0.3, zoom: [1.05, 1.1] });
    g.save(); g.font = serif(40, 700); g.textAlign = 'center'; g.fillStyle = C.cream;
    g.fillText('BORIS SPASSKY', 290, 1220); g.fillText('BOBBY FISCHER', 800, 1220);
    g.font = mono(22, 800); g.letterSpacing = '4px'; g.fillStyle = C.red; g.fillText('USSR', 290, 1258); g.fillStyle = C.blue; g.fillText('USA', 800, 1258); g.restore();
    healthBar(g, 'Boris Spassky', 'WORLD CHAMPION', 1, { y: 170, a: seg(t, w('spassky', 'World') - 0.1, w('spassky', 'World') + 0.2) });
  }, { trans: 'whip' });
  cue(vsT + 0.15, 'boom', 1); cue(w('spassky', 'World'), 'hit', 0.6); cue(vsT + 0.4, 'shutter', 0.5); cue(vsT + 0.6, 'shutter', 0.5);

  // S13 — Soviets held the title for 24 years
  const champs = [['1948', 'byrne'], ['1957', 'spassky'], ['1960', 'bobby72'], ['1963', 'byrne'], ['1969', 'spassky']];
  shot(s('soviets'), (g, lt, t) => {
    crimson(g, H * 0.35);
    champs.forEach(([yr, who], i) => {
      const t0 = 0.15 + i * 0.32, a = seg(lt, t0, t0 + 0.25);
      const x = 120 + i * 210, y = 760 + (i % 2) * 50;
      drawChar(g, who, { x, y: y + (1 - a) * 40, s: 0.72, silhouette: true, eyeGlow: C.red, t, alpha: a });
      g.save(); g.globalAlpha = a; g.font = mono(30, 800); g.textAlign = 'center'; g.fillStyle = C.gold; g.fillText(yr, x, y + 230); g.restore();
    });
    crown(g, 960, 520 + Math.sin(t * 2) * 6, 0.55, { a: seg(lt, 1.6, 1.9) });
    const yr = Math.round(lerp(1948, 1972, seg(t, s('soviets') + 0.1, w('soviets', 'twenty-four'))));
    counter(g, String(yr), 'SOVIET CHAMPIONS', { y: 330, size: 140, color: '#FFE9E4', glow: C.red, labelColor: C.red });
    badge(g, '24 YEARS', W / 2, 1110, { color: C.gold, size: 54, a: seg(t, w('soviets', 'twenty-four'), w('soviets', 'twenty-four') + 0.2), scale: lerp(1.6, 1, seg(t, w('soviets', 'twenty-four'), w('soviets', 'twenty-four') + 0.2, ease.out)) });
  }, { trans: 'leak' });
  champs.forEach((_, i) => cue(s('soviets') + 0.15 + i * 0.32, 'thud', 0.6));
  cue(w('soviets', 'twenty-four'), 'boom', 0.9);

  // S14 — loses game one
  shot(s('loses'), (g, lt, t) => {
    coldRoom(g);
    drawChar(g, 'bobby72', { x: W / 2, y: 1000, s: 1.5, e: exprAt([[0, 'focus'], [w('loses', 'loses') - s('loses'), 'angry']], lt), t });
    const f = pulse(t, w('loses', 'loses'), 0.4);
    scoreboard(g, 'SPASSKY', 'FISCHER', t >= w('loses', 'loses') ? '1' : '0', '0', { y: 330, flashL: f, title: 'GAME 1' });
  }, { trans: 'whip' });
  cue(w('loses', 'loses'), 'buzz', 0.8);

  // S15 — he hears the cameras
  shot(s('cameras'), (g, lt, t) => {
    coldRoom(g);
    const camOn = seg(t, w('cameras', 'cameras') - 0.2, w('cameras', 'cameras') + 0.1);
    const look = lt < 0.9 ? [0, 0] : (Math.floor(lt * 3) % 2 ? [1, -0.4] : [-1, -0.4]);
    camera(g, { zoom: lerp(1, 1.1, seg(lt, 0, 2.2)), fy: 820, t });
    drawChar(g, 'bobby72', { x: W / 2, y: 860, s: 1.7, e: { ...exprAt([[0, 'focus'], [0.5, 'paranoid']], lt), look }, t });
    g.save(); g.globalAlpha = camOn;
    filmCam(g, 170, 260, 1.1, t, 1); filmCam(g, 910, 300, 1.1, t, -1); filmCam(g, 120, 1100, 0.9, t, 1); filmCam(g, 960, 1050, 0.9, t, -1);
    g.restore();
    if (camOn > 0) for (const [x, y] of [[300, 300], [780, 330]]) { g.save(); g.strokeStyle = rgba('#ffffff', 0.5 * camOn); g.lineWidth = 4; for (let i = 0; i < 3; i++) { const r = 30 + ((lt * 80 + i * 30) % 90); g.beginPath(); g.arc(x, y, r, -0.6, 0.6); g.stroke(); } g.restore(); }
  });
  cue(w('cameras', 'cameras'), 'whirr', 0.9); cue(w('cameras', 'cameras') + 0.2, 'shutter', 0.7);

  // S16 — refuses to play: empty chair, FORFEIT
  shot(s('refuses'), (g, lt, t) => {
    coldRoom(g);
    B.setCam({ yaw: 0.1, pitch: 0.55, dist: 11.5 - lt * 0.3, fov: 1450, cy: H * 0.55, target: [4, 0, 4.5] });
    const hands = seated(g, B, 'spassky', exprAt([[0, 'neutral'], [0.8, 'worried']], lt), t, { z: 9.4 });
    B.drawSlab(g); hands();
    B.drawPieces(g, piecesAt([{ pieces: start() }], 0), { focus: 11, dof: 1.3 });
    // empty chair (near side)
    g.save(); g.fillStyle = '#1B2126'; g.beginPath(); g.roundRect(300, 1460, 480, 420, 30); g.fill(); g.restore();
    stamp(g, 'FORFEIT', W / 2, 1640, lt, w('refuses', 'play') - s('refuses'), { sub: 'GAME 2 · FISCHER ABSENT' });
  });
  cue(w('refuses', 'play'), 'stamp', 1); cue(s('refuses') + 0.2, 'clock', 0.5);

  // S17 — down two to zero
  shot(s('down'), (g, lt, t) => {
    coldRoom(g);
    drawChar(g, 'bobby72', { x: W / 2, y: 1000, s: 1.5, e: 'angry', t });
    const f = pulse(t, w('down', 'two'), 0.4);
    scoreboard(g, 'SPASSKY', 'FISCHER', t >= w('down', 'two') ? '2' : '1', '0', { y: 330, flashL: f, title: 'AFTER GAME 2' });
    flash(g, 0.25 * f, C.red);
  }, { trans: 'whip' });
  cue(w('down', 'two'), 'buzz', 0.9);

  // S18 — game three in a back room
  shot(s('room'), (g, lt, t) => {
    g.fillStyle = '#07090B'; g.fillRect(0, 0, W, H);
    beam(g, W / 2, 0, 160, 1100, 1500, '#FFF1D6', 0.16);
    g.fillStyle = '#2B2F33'; g.fillRect(W / 2 - 4, 0, 8, 150); g.fillStyle = '#C9B48A'; g.beginPath(); g.moveTo(W / 2 - 80, 190); g.lineTo(W / 2 + 80, 190); g.lineTo(W / 2 + 40, 140); g.lineTo(W / 2 - 40, 140); g.fill();
    B.setCam({ yaw: -0.15 + lt * 0.04, pitch: 0.62, dist: 11 - lt * 0.25, fov: 1450, cy: H * 0.58, target: [4, 0, 4.4] });
    const hands = seated(g, B, 'spassky', 'focus', t, { z: 9.4 });
    B.drawSlab(g); hands();
    B.drawPieces(g, piecesAt([{ pieces: start() }], 0), { focus: 11, dof: 1.3 });
    placeStamp(g, lt, 'Game 3', 'Back room', { y: 280, t0: 0.05 });
    if (lt > w('room', 'No') - s('room')) {
      const a = seg(t, w('room', 'No'), w('room', 'No') + 0.2);
      g.save(); g.globalAlpha = a; filmCam(g, 860, 450, 0.9, t, -1); g.restore();
      xMark(g, 860, 430, 170, C.red, a);
    }
  }, { trans: 'leak', vig: 0.75 });
  cue(s('room'), 'whoosh', 0.8); cue(s('room') + 0.1, 'lamp', 0.6); cue(w('room', 'No'), 'thud', 0.9);

  // S19 — Bobby wins, then again, and again (boss fight)
  const hits = [w('wins', 'wins'), w('again', 1), w('again', 3)];
  const hp = t => 1 - hits.filter(h => t >= h).length * 0.22 - 0.0;
  shot(s('wins'), (g, lt, t) => {
    coldRoom(g);
    const last = hits.filter(h => t >= h).pop() ?? -9;
    B.setCam({ yaw: 0.25 * Math.sin(t * 0.6), pitch: 0.7, dist: 9.5, fov: 1450, cy: H * 0.56, target: [4, 0, 5] });
    const hands = seated(g, B, 'spassky', t < hits[0] ? 'focus' : t < hits[2] ? 'worried' : 'shock', t, { z: 9.4 });
    B.drawSlab(g, { tint: C.lime, tintA: 0.3 * pulse(t, last, 0.3) }); hands();
    const ps = start().map(p => ({ ...p, ...{ x: sqXZ(p.sq)[0], z: sqXZ(p.sq)[1] } }));
    hits.forEach((h, i) => { const sqs = ['f5', 'd4', 'e3']; const u = seg(t, h - 0.35, h); ps.push({ t: 'n', c: 'w', x: lerp(4.5, sqXZ(sqs[i])[0], u), z: lerp(1.5, sqXZ(sqs[i])[1], u), y: Math.sin(u * Math.PI) * 0.8, alpha: t > h - 0.35 ? 1 : 0, sharp: true }); });
    B.drawPieces(g, ps.filter(p => p.alpha !== 0 && !(p.c === 'b' && p.t === 'p' && t > hits[0] && p.sq === 'e7')), { focus: 9.5, dof: 1.2 });
    healthBar(g, 'Boris Spassky', 'WORLD CHAMPION', lerp(hp(t - 0.25), hp(t), seg(t - last, 0, 0.25)), { y: 170 });
    if (t - last < 0.5) speedlines(g, W / 2, H * 0.45, t, { a: 0.5 * (1 - (t - last) / 0.5), color: '#E9FFD0' });
    flash(g, 0.35 * pulse(t, last, 0.2), '#E6FFC8');
  }, { trans: 'whip' });
  hits.forEach(h => { cue(h - 0.05, 'clack', 1); cue(h, 'boom', 0.8); cue(h, 'hit', 0.7); });

  // S20 — World champion
  const champT = s('champ');
  shot(champT, (g, lt, t) => {
    bgBase(g, { top: '#5A4A1C', mid: '#1C170B', edge: '#060503', cy: H * 0.42 });
    rays(g, W / 2, 820, t, { a: 0.16 });
    camera(g, { zoom: lerp(1.08, 1, seg(lt, 0, 0.6, ease.out)), t });
    drawChar(g, 'bobby72', { x: W / 2, y: 840, s: 1.6, e: 'triumph', t });
    hand(g, 250, 640 - Math.sin(lt * 6) * 10, 52); hand(g, 830, 640 + Math.sin(lt * 6) * 10, 52);
    counter(g, '12½ – 8½', null, { y: 330, size: 120, color: '#FFF4D6', glow: C.gold });
    badge(g, 'WORLD CHAMPION', W / 2, 440, { color: C.gold, size: 46, sub: 'REYKJAVIK · 1 SEPTEMBER 1972', a: seg(lt, 0.1, 0.4) });
    confetti(g, t, champT + 0.05);
  }, { trans: 'flash' });
  cue(champT, 'boom', 1.1); cue(champT, 'cheer', 0.7); cue(champT + 0.05, 'confetti', 0.8);

  // S21 — and then... he vanished
  const vanT = w('vanish', 'vanished');
  shot(s('vanish') - 0.3, (g, lt, t) => {
    coldRoom(g);
    spotlight(g, W / 2, 700, 520, '#ffffff', 0.12);
    const gone = seg(t, vanT - 0.1, vanT + 0.5);
    g.save(); g.fillStyle = '#15191C'; g.beginPath(); g.roundRect(330, 860, 420, 600, 40); g.fill(); g.fillStyle = '#1B2024'; g.fillRect(310, 1180, 460, 70); g.restore();
    drawChar(g, 'bobby72', { x: W / 2, y: 760, s: 1.35, e: 'neutral', t, alpha: 1 - gone });
    if (gone > 0 && gone < 1) { const r = rng(11); for (let i = 0; i < 70; i++) { const x = 360 + r() * 360, y = 520 + r() * 700; g.fillStyle = rgba('#d8dde0', (1 - gone) * 0.8); g.beginPath(); g.arc(x + (r() - 0.5) * 300 * gone, y - gone * 300 * r(), 4 + r() * 6, 0, 7); g.fill(); } }
  }, { trans: 'fade', transDur: 0.45 });
  cue(vanT, 'poof', 0.9);

  // S22 — never played for the title again
  shot(s('never'), (g, lt, t) => {
    coldRoom(g);
    B.setCam({ yaw: 0.4 + lt * 0.05, pitch: 0.72, dist: 9.5, fov: 1450, cy: H * 0.62, target: [4, 0, 4] });
    B.drawSlab(g);
    const tilt = seg(t, w('never', 'never'), w('never', 'never') + 0.6, ease.in);
    const cp = B.project(4, 1.2, 4);
    crown(g, cp.x + tilt * 90, cp.y + tilt * 100, 1.8, { tilt: tilt * 1.2, gray: tilt });
    stamp(g, 'TITLE FORFEITED', W / 2, 420, lt, w('never', 'title') - s('never'), { size: 72, sub: '1975 · NEVER DEFENDED' });
  }, { trans: 'fade', transDur: 0.4 });
  cue(w('never', 'never') + 0.55, 'thud', 0.9); cue(w('never', 'title'), 'stamp', 1);

  // S23 — sure the Soviets were watching
  shot(s('watching'), (g, lt, t) => {
    g.fillStyle = '#040608'; g.fillRect(0, 0, W, H);
    eyesInDark(g, lt, w('watching', 'Soviets') - s('watching'), 26);
    blinds(g, lt);
    drawChar(g, 'bobbyBeard', { x: W / 2, y: 1080, s: 1.5, e: { ...EXPR.paranoid, look: [Math.sin(lt * 4) > 0 ? 1 : -1, -0.3] }, t });
    g.fillStyle = 'rgba(210,225,235,0.12)'; for (let i = 0; i < 6; i++) g.fillRect(0, 900 + i * 58, W, 20);
  }, { trans: 'fade', transDur: 0.35, vig: 0.7 });
  cue(s('watching'), 'heartbeat', 0.9); cue(w('watching', 'Soviets'), 'sting', 0.8);

  // S24 — so the fillings came out
  shot(s('fillings'), (g, lt, t) => {
    bgBase(g, { top: '#4A1A1C', mid: '#1A0B0C', edge: '#050203', cy: H * 0.35 });
    camera(g, { zoom: lerp(1.15, 1.25, lt / 2), fy: 640, t, shake: 4 * pulse(t, w('fillings', 'out'), 0.3) });
    tooth(g, W / 2, 680, 2.5, t, [w('fillings', 'fillings'), w('fillings', 'came'), w('fillings', 'out')], { tint: 'rgba(255,60,40,0.08)' });
  }, { trans: 'zoom' });
  cue(w('fillings', 'fillings'), 'ting', 0.9); cue(w('fillings', 'came'), 'ting', 0.9); cue(w('fillings', 'out'), 'ting', 0.9); cue(w('fillings', 'out'), 'boom', 0.6);

  // S25 — spat on the US order (1992)
  const spitT = w('spat', 'spat');
  shot(s('spat'), (g, lt, t) => {
    coldRoom(g);
    placeStamp(g, lt, 'Yugoslavia', '1992', { y: 150, t0: 0.05 });
    paper(g, W / 2, 560, 560, 680, { rot: -0.04, title: 'U.S. DEPARTMENT\nOF THE TREASURY', lines: 9 });
    spit(g, 540, 1540, 560, 620, (t - spitT) / 0.35);
    drawChar(g, 'bobbyBeard', { x: W / 2, y: 1500, s: 1.25, e: exprAt([[0, 'angry'], [spitT - s('spat') - 0.15, { ...EXPR.angry, mouth: 'o', open: 0.3 }], [spitT - s('spat') + 0.3, 'smug']], lt), t });
    stamp(g, 'WARRANT', W / 2, 610, lt, w('spat', 'government') - s('spat'), { size: 110, sub: 'ARREST ORDERED' });
  }, { trans: 'leak' });
  cue(s('spat'), 'whoosh', 0.8); cue(w('spat', '1992'), 'boom', 0.7); cue(spitT, 'spit', 1); cue(spitT + 0.35, 'splat', 0.9); cue(w('spat', 'government'), 'stamp', 1);

  // S26 — never went home: exile route (starts on the USA, pans east)
  shot(s('home'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0.5, 2.3, ease.inOut);
    map.view({ lon: lerp(-80, 75, u), lat: lerp(40, 38, u), zoom: 6, cy: H * 0.46 });
    const usa = seg(t, w('home', 'never'), w('home', 'never') + 0.3);
    map.draw(g, { spacing: 14, color: id => id === ISO.USA ? (usa > 0.5 ? rgba(C.red, 0.85) : '#6C93A3') : null });
    const [ux, uy] = map.proj(-98, 39);
    xMark(g, ux, uy, 180, C.red, usa);
    map.route(g, 'Belgrade', 'Budapest', seg(lt, 0.9, 1.2), { bend: 0.4 });
    map.route(g, 'Budapest', 'Manila', seg(lt, 1.1, 1.9), { bend: 0.25 });
    map.route(g, 'Manila', 'Tokyo', seg(lt, 1.8, 2.2), { bend: 0.3 });
    for (const [c, a0, below] of [['Belgrade', 0.8, true], ['Budapest', 1.0, false], ['Manila', 1.8, true], ['Tokyo', 2.1, false]]) map.pin(g, c, { a: seg(lt, a0, a0 + 0.2), below });
    placeStamp(g, lt, 'Exile', '1992 – 2004', { y: 160 });
  }, { trans: 'whip' });
  cue(w('home', 'never'), 'buzz', 0.8); cue(s('home') + 0.9, 'whoosh', 0.5); cue(s('home') + 1.6, 'whoosh', 0.5);

  // S27 — Iceland took him in
  shot(s('iceland'), (g, lt, t) => {
    bgBase(g, { top: '#1E2B33', mid: '#0E1418', edge: '#04070A', cy: H * 0.4 });
    const u = seg(lt, 0, 2.0, ease.inOut);
    map.view({ lon: lerp(60, -20, u), lat: lerp(42, 62, u), zoom: lerp(3.6, 14, u), cy: H * 0.47 });
    const ic = seg(t, w('iceland', 'Iceland'), w('iceland', 'Iceland') + 0.4);
    map.draw(g, { spacing: 13, base: '#4F7787', color: id => id === ISO.ISL ? rgba(C.blue, 0.4 + 0.6 * ic) : id === ISO.USA ? rgba(C.red, 0.85) : null });
    map.route(g, 'Tokyo', 'Reykjavik', seg(lt, 0, 1.5), { bend: 0.35, color: C.blue });
    map.pin(g, 'Reykjavik', { color: C.blue, a: seg(lt, 1.2, 1.5), pulse: (lt * 0.8) % 1 });
    badge(g, 'ICELANDIC CITIZEN', W / 2, 300, { color: C.blue, size: 40, sub: 'MARCH 2005', a: seg(lt, 0.9, 1.2) });
  });
  cue(w('iceland', 'Iceland'), 'shimmer', 0.8);

  // S28 — died in Reykjavik, the city where he became king
  const kingT = w('died', 'king');
  shot(s('died'), (g, lt, t) => {
    bgBase(g, { top: '#26323A', mid: '#0F151A', edge: '#030507', cy: H * 0.32 });
    bokeh(g, t, { n: 10, color: '#cfe6ff', a: 0.05, seed: 8 });
    B.setCam({ yaw: 0.12 - lt * 0.02, pitch: 0.6, dist: 11.5 - lt * 0.2, fov: 1450, cy: H * 0.56, target: [4, 0, 4.6] });
    const hands = seated(g, B, 'bobbyOld', exprAt([[0, 'tired'], [1.0, 'sad']], lt), t, { z: 9.4 });
    B.drawSlab(g); hands();
    const kg = seg(t, kingT - 0.1, kingT + 0.4);
    B.drawPieces(g, [{ t: 'k', c: 'w', x: 4.5, z: 5.5, glow: kg > 0.05 ? C.gold : null, halo: C.gold, haloA: kg, sharp: true }, { t: 'p', c: 'b', x: 2.5, z: 3.5 }, { t: 'p', c: 'w', x: 6.5, z: 2.5 }], { focus: 11 });
    const cp = B.project(7.4, 0, 6.8); candle(g, cp.x, cp.y, cp.s / 110, t);
    placeStamp(g, lt, 'Reykjavik', '2008', { y: 160, t0: 0.05 });
    photoCard(g, P.grave, lt, w('died', 'died') - s('died'), { x: 225, y: 1000, w: 280, aspect: 1.2, rot: -0.05, from: 'left', tone: 'warm', caption: 'LAUGARDÆLIR', credit: 'Ted Cross · CC BY 2.0', fx: 0.6, fy: 0.3, zoom: [1.0, 1.08], dur: 4 });
  }, { trans: 'fade', transDur: 0.5, vig: 0.7 });
  cue(w('died', 'died'), 'boom', 0.6); cue(kingT, 'shimmer', 0.8);

  // S29 — age 64: squares light up
  const sqA = w('age64', 'Age'), sqB = w('age64', 'sixty-four') + 0.6;
  const lit = t => Math.floor(clamp((t - sqA) / (sqB - sqA)) * 64);
  shot(s('age64') - 0.2, (g, lt, t) => {
    bgBase(g, { top: '#26323A', mid: '#0F151A', edge: '#030507', cy: H * 0.32 });
    B.setCam({ yaw: 0.0 + lt * 0.08, pitch: 1.05, dist: 12, fov: 1450, cy: H * 0.55, target: [4, 0, 4] });
    B.drawSlab(g);
    const n = lit(t);
    for (let i = 0; i < n; i++) { const f = i % 8, r = Math.floor(i / 8); B.highlight(g, String.fromCharCode(97 + (r % 2 ? 7 - f : f)) + (r + 1), C.gold, 0.55, false); }
    counter(g, String(n).padStart(2, '0'), n >= 64 ? 'YEARS · SQUARES' : 'YEARS', { y: 320, size: 170, color: '#FFF4D6', glow: C.gold, labelColor: C.gold });
  }, { trans: 'leak' });
  for (let i = 0; i < 64; i += 4) cue(sqA + i / 64 * (sqB - sqA), 'tick', 0.4);
  cue(sqB, 'boom', 0.9);

  // S30 — one year for every square: title, back to the start (loop)
  const endT = s('square');
  shot(endT, (g, lt, t) => {
    crimson(g, H * 0.25);
    const u = seg(lt, 0, 2.4, ease.inOut);
    B.setCam({ yaw: lerp(0.2, 0.06 * Math.sin(t * 0.3), u), pitch: lerp(1.0, 0.6, u), dist: lerp(11, 12.5, u), fov: 1500, cy: H * 0.55, target: [4, 0, 4.4] });
    const hands = seated(g, B, 'bobby72', 'smug', t, { z: 9.6, alpha: seg(lt, 0.8, 1.6) });
    B.drawSlab(g); hands();
    for (let i = 0; i < 64; i++) B.highlight(g, String.fromCharCode(97 + (i % 8)) + (Math.floor(i / 8) + 1), C.gold, 0.5 * (1 - seg(lt, 1.2, 2.4)), false);
    B.drawPieces(g, [{ t: 'k', c: 'w', x: 4.5, z: 7.5 }, { t: 'q', c: 'w', x: 3.5, z: 7.4 }, { t: 'r', c: 'w', x: 1.5, z: 7.6 }, { t: 'r', c: 'w', x: 6.5, z: 7.6 }, { t: 'n', c: 'w', x: 2.5, z: 7.3 }, { t: 'b', c: 'w', x: 5.5, z: 7.3 }, ...kings.map(([x, z]) => ({ t: 'k', c: 'b', x, z }))].map(p => ({ ...p, alpha: p.c === 'b' ? seg(lt, 1.6, 2.4) : 1 })), { focus: 11, dof: 1.4 });
    const a = seg(t, w('square', 'every') - 0.2, w('square', 'every') + 0.3);
    g.save(); g.globalAlpha = a;
    glowText(g, 'BOBBY FISCHER', W / 2, 250, { font: serif(86, 800), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 20 });
    glowText(g, '1943 – 2008', W / 2, 315, { font: serif(36, 700), fill: C.gold, glow: 'rgba(0,0,0,0.9)', blur: 10, spacing: 6 });
    glowText(g, '64 SQUARES  ·  64 YEARS', W / 2, 372, { font: mono(28, 800), fill: C.lime, glow: 'rgba(0,0,0,0.9)', blur: 8, spacing: 6 });
    g.restore();
  }, { trans: 'flash' });
  cue(w('square', 'every'), 'shimmer', 0.8); cue(w('square', 'board'), 'boom', 1);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);

  const music = [
    { t: 0, m: 'hook' }, { t: s('ny') - 0.1, m: 'intrigue' }, { t: s('later') - 0.2, m: 'tension' },
    { t: w('later', 'later') + 0.4, m: 'drop' }, { t: mateT, m: 'hit' }, { t: s('century'), m: 'glory' },
    { t: s('rey') - 0.1, m: 'coldwar' }, { t: s('room') - 0.1, m: 'build' }, { t: champT, m: 'victory' },
    { t: s('vanish') - 0.3, m: 'void' }, { t: s('watching'), m: 'paranoia' }, { t: s('spat'), m: 'exile' },
    { t: s('died'), m: 'elegy' }, { t: endT, m: 'finale' }, { t: T.duration, m: 'end' },
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
