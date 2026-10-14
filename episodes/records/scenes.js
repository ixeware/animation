// The craziest chess world records (Guinness): #5 a chess set arranged in 29.85 s with one hand (2021), #4 the largest chess
// piece, a 20 ft king in Saint Louis (2018), #3 Ehsan Ghaem-Maghami's 604-board simul (2011; Guinness counted 135),
// #2 Tunde Onakoya and Shawn Martinez, 64 hours in Times Square (2025), #1 Timur Gareyev, 48 blindfold games on an exercise bike (2016).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix } from '../../engine/js/core.js';
import { confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar, hand } from '../../engine/js/characters.js';
import { counter, badge, stamp, placeStamp, sans, serif, mono } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { table } from '../../engine/js/env.js';
import { drawPiece } from '../../engine/js/pieces.js';
import { burst } from '../../engine/js/fx.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const START = piecesAt(G, 0), MID = piecesAt(G, 20);
const photo = async k => { try { return await loadPhoto3d(`../episodes/records/photos/${k}`); } catch { return null; } };
const PH = { timur: await photo('gareyev2009') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const TBL = { table: ['#3A3A44', '#22222A', '#18181E'] };

// Times Square at night, baked once (towers, lit windows, billboards, chessboard screen) and drawn soft, so HUD text reads on top
let TS = null;
function bakeTimesSquare() {
  const c = document.createElement('canvas'); c.width = W + 240; c.height = H; const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0A0E1E'); sky.addColorStop(0.6, '#1A1430'); sky.addColorStop(1, '#2A1A2A'); g.fillStyle = sky; g.fillRect(0, 0, c.width, H);
  const r = rng(21);
  for (const [x0, w0, top] of [[-60, 320, 260], [240, 240, 120], [460, 280, 40], [720, 240, 160], [940, 380, 300]]) {
    g.fillStyle = '#0C0C16'; g.fillRect(x0, top, w0, H);
    for (let y = top + 30; y < H * 0.75; y += 34) for (let x = x0 + 18; x < x0 + w0 - 16; x += 30) if (r() > 0.45) { g.fillStyle = rgba(r() > 0.8 ? '#FFD9A0' : '#9FB7D9', 0.2 + r() * 0.3); g.fillRect(x, y, 12, 16); }
  }
  for (const [x, y, w, h, col] of [[-20, 560, 320, 340, '#E0603F'], [780, 440, 380, 320, '#1BADA6'], [300, 360, 300, 170, '#E9B654'], [40, 1000, 240, 170, '#7AA6D6'], [900, 860, 240, 220, '#B48CFF']]) {
    const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(1, rgba(mix(col, '#000000', 0.5), 0.9)); g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.font = sans(h * 0.32, 900); g.fillText(['SALE', 'NYC', 'LIVE', '24/7', 'NEW'][Math.floor(x + y) % 5], x + 20, y + h * 0.55);
    g.fillRect(x + 20, y + h * 0.7, w * 0.5, h * 0.08);
  }
  const cx = 560, cy = 1160, cs = 30; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#EEEED2' : '#769656'; g.fillRect(cx + i * cs, cy + j * cs, cs, cs); }
  const out = document.createElement('canvas'); out.width = c.width; out.height = H; const o = out.getContext('2d');
  o.filter = 'blur(7px) brightness(0.7) saturate(0.85)'; o.drawImage(c, 0, 0); return out;
}
function timesSquare(g, t, { clock = null, pan = 0 } = {}) {
  TS ??= bakeTimesSquare();
  g.drawImage(TS, -120 + pan, 0);
  g.fillStyle = rgba('#FFD9A0', 0.03 + 0.03 * Math.sin(t * 5)); g.fillRect(0, 0, W, H);  // billboard flicker
  if (clock != null) {  // the big clock board
    g.save(); g.fillStyle = '#05070A'; g.fillRect(250, 120, 580, 170); g.strokeStyle = '#3A3F48'; g.lineWidth = 6; g.strokeRect(250, 120, 580, 170);
    const hh = Math.floor(clock / 3600), mm = Math.floor(clock / 60) % 60, ss = Math.floor(clock) % 60, txt = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    g.font = mono(118, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FF6B4F'; g.fillText(txt, W / 2, 208); g.restore();
  }
}

// the 604-board hall in perspective: two long rows of tables down an aisle, a board and an opponent at each
function hall(g, t, walk) {
  const hz = H * 0.36, f = 800, camY = 1.7, P = (X, Y, Z) => [W / 2 + X * f / Z, hz + (camY - Y) * f / Z];
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1A1E26'); bg.addColorStop(0.36, '#2A2E36'); bg.addColorStop(0.37, '#3A3430'); bg.addColorStop(1, '#14100E'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const quad = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  const off = walk % 1;
  for (let i = 30; i >= 0; i--) {
    const Z = 1.6 + i - off; if (Z < 1.2) continue;
    const fog = clamp((Z - 3) / 24) * 0.9, F = c => mix(c, '#22262E', fog);
    if (Z > 3.5) {  // ceiling lights
    const [lx0, ly] = P(-0.5, 3.4, Z), [lx1] = P(0.5, 3.4, Z), [, ly2] = P(0, 3.4, Z + 0.3);
    quad([[lx0, ly], [lx1, ly], [lx1 - (lx1 - lx0) * 0.03, ly2], [lx0 + (lx1 - lx0) * 0.03, ly2]], rgba('#FFF1D6', 0.5 * (1 - fog))); }
    for (const sd of [-1, 1]) {
      const X0 = sd * 0.6, X1 = sd * 1.3, z0 = Z - 0.42, z1 = Z + 0.42;
      quad([P(X0, 0.75, z0), P(X1, 0.75, z0), P(X1, 0.75, z1), P(X0, 0.75, z1)], F('#6A5440'));  // table top
      quad([P(X0, 0.75, z0), P(X0, 0.75, z1), P(X0, 0, z1), P(X0, 0, z0)], F('#3A2C20'));  // side facing the aisle
      const bx = sd * 0.95, n = Z < 8 ? 8 : 4, sq = 0.44 / n;
      for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) {
        const xa = bx - 0.22 + u * sq, za = Z - 0.22 + v * sq;
        quad([P(xa, 0.76, za), P(xa + sq, 0.76, za), P(xa + sq, 0.76, za + sq), P(xa, 0.76, za + sq)], F((u + v) % 2 ? '#EEEED2' : '#769656'));
      }
      const [ox, oy] = P(sd * 1.5, 1.2, Z), k = f / Z;  // the opponent across the board
      g.fillStyle = F(['#3A4458', '#5A3A3A', '#3A5040', '#4A4A5A'][(i + (sd > 0)) % 4]); g.beginPath(); g.ellipse(ox, oy + 0.3 * k, 0.24 * k, 0.32 * k, 0, Math.PI, 0); g.fill();
      g.fillStyle = F(i % 3 ? '#C9946E' : '#8A5A3E'); g.beginPath(); g.arc(ox, oy - 0.08 * k, 0.11 * k, 0, 7); g.fill();
      g.fillStyle = F('#1E1814'); g.beginPath(); g.arc(ox, oy - 0.12 * k, 0.11 * k, Math.PI * 1.05, Math.PI * 1.95); g.fill();
    }
  }
}

// an exercise bike seen from the front-side: flywheel, frame, saddle, handlebar
function bike(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#2A2E36'; g.lineWidth = 26; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-220, 300); g.lineTo(220, 300); g.moveTo(-160, 300); g.lineTo(-40, 40); g.lineTo(140, 300); g.moveTo(-40, 40); g.lineTo(60, -120); g.stroke();
  g.fillStyle = '#1A1D22'; g.beginPath(); g.arc(140, 200, 110, 0, 7); g.fill();
  g.strokeStyle = '#8A93A3'; g.lineWidth = 8; for (let k = 0; k < 6; k++) { const a = t * 9 + k * 1.047; g.beginPath(); g.moveTo(140, 200); g.lineTo(140 + Math.cos(a) * 100, 200 + Math.sin(a) * 100); g.stroke(); }
  g.strokeStyle = '#E0603F'; g.lineWidth = 10; g.beginPath(); g.arc(140, 200, 108, 0, 7); g.stroke();
  g.strokeStyle = '#3A3F48'; g.lineWidth = 22; g.beginPath(); g.moveTo(60, -120); g.lineTo(-30, -150); g.moveTo(60, -120); g.lineTo(150, -150); g.stroke();
  const pa = t * 9; g.strokeStyle = '#3A3F48'; g.lineWidth = 14; g.beginPath(); g.moveTo(-40, 120); g.lineTo(-40 + Math.cos(pa) * 70, 120 + Math.sin(pa) * 70); g.stroke();
  g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const lin = x => x;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const rank = (g, n, t, t0) => {  // the countdown number, slammed in at the start of each record
    const a = seg(t, t0, t0 + 0.08); if (a <= 0) return;
    const k = lerp(1.8, 1, seg(t, t0, t0 + 0.22, ease.back));
    g.save(); g.globalAlpha = a; g.translate(130, 170); g.scale(k, k); g.rotate(-0.05);
    g.fillStyle = C.gold; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-90, -78, 180, 156); g.shadowColor = 'transparent';
    g.fillStyle = C.ink; g.font = sans(120, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + n, 0, 6); g.restore();
  };
  // the Times Square board: Tunde alone (3/4 view), or both players from the side (two = true)
  const marathon = (g, lt, t, keys, { e = 'focus', e2 = 'focus', clock = null, pieces = MID, two = false } = {}) => {
    rig(B, lt, keys, { t, e: lin });
    timesSquare(g, t, { clock, pan: -B.yaw * 120 });
    const hw = seated(g, B, 'tunde', e, t, { z: two ? 8.9 : 9.4 });
    const hr = two ? seated(g, B, 'rival', e2, t, { z: -0.9, face: 1 }) : null;
    table(g, B, TBL); B.drawSlab(g, COM); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.1 }); hw(); hr?.();
  };

  // ======================= HOOK =======================
  const h64 = w('hook1', '64'), twoT = w('hook2', 'two');
  shot(0, (g, lt, t, sh) => {
    marathon(g, lt, t, [[0, { yaw: 0.42, pitch: 0.34, dist: 15, cy: H * 0.62, target: [4, 2.2, 6] }], [len(sh), { yaw: 0.3, pitch: 0.3, dist: 12.5 }]], { e: { ...EXPR.tired, look: [0, 0.6] }, clock: lerp(0, 64 * 3600, seg(t, 0, h64 + 0.6, ease.out)) });
    counter(g, '64 HOURS', 'OF CHESS · NO STOPPING', { y: 470, size: 150, color: C.cream, labelColor: C.red });
    stamp(g, 'ONLY #2', W / 2, 790, t, twoT, { color: C.gold, size: 120, rot: -0.1 });
  }, { grade: 'night', noJump: true });
  cue(0.05, 'boom', 0.6); cue(0.05, 'clock', 0.5); cue(twoT, 'stamp', 1);

  // ======================= #5: 29.85 SECONDS =======================
  const fiveT = s('n5'), secT = w('n5', '29.85'), handT = w('n5', 'hand');
  const ORDER = [...START].sort((a, b) => (a.c === b.c ? 0 : a.c === 'w' ? -1 : 1) || (a.c === 'w' ? a.z - b.z : b.z - a.z) || a.x - b.x);
  shot(fiveT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0, pitch: 1.25, dist: 12, cy: H * 0.56, target: [4, 0, 4] }], [len(sh), { yaw: 0.08, pitch: 1.2, dist: 11 }]], { t, e: lin });
    const bgc = g.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#2A2420'); bgc.addColorStop(1, '#100C0A'); g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    table(g, B, { table: ['#6A4A2E', '#3A2614', '#2A1A0C'] }); B.drawSlab(g, COM);
    const t0 = fiveT + 0.4, t1 = handT - 0.4, n = Math.floor(clamp((t - t0) / (t1 - t0)) * 32);
    const placed = ORDER.slice(0, n).map((p, i) => { const age = t - (t0 + (i + 1) * (t1 - t0) / 32); return { ...p, y: Math.max(0, 0.8 - age * 6) }; });
    B.drawPieces(g, placed, { focus: B.dist, dof: 0.6 });
    if (n < 32 && t > t0) {  // one hand on an arm from the lower right, hovering over the next square
      const nx = ORDER[n], p = B.project(nx.x, 1.1, nx.z), r = 0.5 * p.s;
      g.save(); g.lineCap = 'round'; g.strokeStyle = '#2E3A55'; g.lineWidth = r * 1.5; g.beginPath(); g.moveTo(W + 80, H + 60); g.quadraticCurveTo(W * 0.8, p.y + 300, p.x + r * 0.6, p.y + r * 0.9); g.stroke();
      g.strokeStyle = '#C9946E'; g.lineWidth = r * 1.05; g.beginPath(); g.moveTo(p.x + r * 1.2, p.y + r * 1.6); g.lineTo(p.x + r * 0.3, p.y + r * 0.4); g.stroke(); g.restore();
      hand(g, p.x, p.y, r, '#C9946E');
    }
    const secs = lerp(0, 29.85, seg(t, t0, t1));
    g.save(); g.fillStyle = 'rgba(10,8,6,0.85)'; g.fillRect(W / 2 - 300, 300, 600, 170); g.font = mono(120, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = t >= t1 ? C.lime : C.cream; g.fillText(secs.toFixed(2).padStart(5, '0'), W / 2, 390); g.restore();
    rank(g, 5, t, fiveT);
    badge(g, 'ONE HAND', W / 2, 560, { color: C.blue, size: 50, a: seg(t, handT, handT + 0.1), scale: pop(t, handT) });
    credit(g, 'GUINNESS WORLD RECORDS · FASTEST TIME TO ARRANGE A CHESS SET · 2021', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(fiveT, 'hit', 0.8); for (let i = 0; i < 16; i++) cue(fiveT + 0.4 + i * (handT - 0.8 - fiveT) / 16, 'clack', 0.35); cue(handT - 0.4, 'ting', 0.8); cue(handT, 'pluck', 0.6);

  // ======================= #4: THE 20 FT KING =======================
  const fourT = s('n4'), kingT = w('n4', 'king'), ftT = w('n4', '20'), lbT = w('n4', '11,000');
  shot(fourT - 0.05, (g, lt, t, sh) => {
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#6FA6D6'); sky.addColorStop(0.7, '#CFE2EE'); sky.addColorStop(1, '#E8E0C8'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const u = seg(t, fourT, T.e('n4') + 0.3, ease.inOut), zoom = lerp(1.0, 0.82, u), gy = 1640;
    g.fillStyle = '#6E9A4E'; g.fillRect(0, gy, W, H - gy); g.fillStyle = '#B8A88A'; g.fillRect(0, gy, W, 26);
    g.save(); g.translate(W / 2, gy); g.scale(zoom, zoom); g.translate(-W / 2, -gy);
    g.fillStyle = 'rgba(30,40,20,0.35)'; g.beginPath(); g.ellipse(W / 2 - 60, gy + 8, 420, 34, 0, 0, 7); g.fill();
    g.save(); g.filter = 'sepia(1) saturate(1.25) brightness(1.3) contrast(1.15) hue-rotate(-6deg)'; drawPiece(g, 'k', 'b', W / 2 - 60, gy, 1380); g.restore();
    drawChar(g, 'rival', { x: 800, y: gy - 225, s: 0.55, e: { ...EXPR.shock, look: [-0.6, -0.8] }, t });
    const hTop = gy - 1380 * 0.98, a = seg(t, ftT - 0.1, ftT + 0.2), x = 1000;
    if (a > 0) { g.save(); g.globalAlpha = a; g.strokeStyle = C.ink; g.lineWidth = 8; g.beginPath(); g.moveTo(x, gy); g.lineTo(x, lerp(gy, hTop, seg(t, ftT - 0.1, ftT + 0.4, ease.out))); g.stroke();
      for (const y of [gy, hTop]) { g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x + 30, y); g.stroke(); }
      g.translate(x + 42, (gy + hTop) / 2); g.rotate(-Math.PI / 2); g.font = sans(76, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.ink; g.fillText('20 FT', 0, 0);
      g.restore(); }
    g.restore();
    rank(g, 4, t, fourT);
    badge(g, '≈ 11,000 LB', W / 2 + 60, 190, { color: C.red, size: 60, a: seg(t, lbT, lbT + 0.1), scale: pop(t, lbT) });
    badge(g, 'BIGGEST CHESS PIECE EVER', W / 2 + 60, 190, { color: C.gold, size: 40, a: seg(t, kingT - 0.4, kingT - 0.3) * (1 - seg(t, lbT - 0.1, lbT)) });
    credit(g, 'WORLD CHESS HALL OF FAME · SAINT LOUIS · 2018', seg(lt, 0.3, 0.5));
  }, { trans: 'zoom', grade: 'neutral', info: true });
  cue(fourT, 'hit', 0.8); cue(kingT, 'thud', 0.8); cue(ftT, 'riser', 0.4); cue(lbT, 'boom', 0.8);

  // ======================= #3: 604 BOARDS =======================
  const threeT = s('n3'), n604 = w('n3', '604'), h25 = w('n3', '25'), eightT = w('n3', 'eight');
  shot(threeT - 0.05, (g, lt, t, sh) => {
    hall(g, t, lt * 0.9);
    drawChar(g, 'ehsan', { x: W / 2 + Math.sin(t * 3) * 14, y: 1010 + Math.abs(Math.sin(t * 6)) * 10, s: 1.15, e: { ...EXPR.focus, look: [Math.sin(t * 0.8), 0.6] }, t });
    rank(g, 3, t, threeT);
    const n = Math.round(lerp(0, 604, seg(t, n604 - 0.3, n604 + 1.2, ease.out)));
    counter(g, String(n), 'OPPONENTS AT ONCE', { y: 400, size: 160, a: seg(t, n604 - 0.4, n604 - 0.3) });
    badge(g, '25+ HOURS', W / 2 - 230, 560, { color: C.blue, size: 40, a: seg(t, h25, h25 + 0.1), scale: pop(t, h25) });
    badge(g, 'LOST: 8', W / 2 + 240, 560, { color: C.red, size: 40, a: seg(t, eightT, eightT + 0.1), scale: pop(t, eightT) });
    credit(g, 'GM EHSAN GHAEM-MAGHAMI · TEHRAN · 2011', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'cold', info: true });
  cue(threeT, 'hit', 0.8); for (let i = 0; i < 10; i++) cue(n604 - 0.3 + i * 0.15, 'tick', 0.3); cue(eightT, 'stamp', 0.6);
  // ...Guinness counted 135
  const gT = w('n3b', 'Guinness'), c135 = w('n3b', '135');
  shot(s('n3b') - 0.05, (g, lt, t, sh) => {
    const bgc = g.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#22262E'); bgc.addColorStop(1, '#0A0C10'); g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    counter(g, '604', 'GAMES PLAYED', { y: 700, size: 230 });
    if (t > gT) { const u = seg(t, gT, gT + 0.3, ease.out); g.save(); g.strokeStyle = C.red; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - 250, 640); g.lineTo(W / 2 - 250 + 500 * u, 560); g.stroke(); g.restore(); }
    stamp(g, '135', W / 2, 1060, t, c135, { color: C.gold, size: 190, rot: -0.08, sub: 'COUNTED BY GUINNESS' });
    g.save(); g.globalAlpha = seg(t, c135 + 0.4, c135 + 0.6); g.font = sans(30, 800); g.letterSpacing = '3px'; g.textAlign = 'center'; g.fillStyle = 'rgba(243,235,221,0.8)';
    g.fillText('ONLY OPPONENTS RATED 1200+ COUNTED', W / 2, 1460); g.restore();
  }, { trans: 'zoom', grade: 'neutral', info: true });
  cue(gT, 'glass', 0.5); cue(c135, 'stamp', 1);

  // ======================= #2: 64 HOURS IN TIMES SQUARE =======================
  const twoT2 = s('n2'), tsT = w('n2', 'Times'), h64b = w('n2', '64'), g473 = w('n2', '473');
  shot(twoT2 - 0.05, (g, lt, t, sh) => {
    const tired = { ...EXPR.tired, sweat: 1, look: [0, 0.6] };
    marathon(g, lt, t, [[0, { yaw: 1.5, pitch: 0.3, dist: 23, cy: H * 0.6, target: [4, 2.2, 4] }], [len(sh), { yaw: 1.44, pitch: 0.28, dist: 21 }]], {
      two: true, e: exprAt([[0, { ...EXPR.focus, look: [-0.7, 0.5] }], [g473 - (t - lt), tired]], lt), e2: exprAt([[0, { ...EXPR.focus, look: [0.7, 0.5] }], [g473 - (t - lt), tired]], lt), clock: lerp(0, 64 * 3600, seg(t, h64b - 0.8, h64b + 0.4, ease.out)) });
    rank(g, 2, t, twoT2);
    counter(g, String(Math.round(lerp(0, 473, seg(t, g473 - 0.3, g473 + 0.8, ease.out)))), 'GAMES', { y: 470, size: 150, a: seg(t, g473 - 0.4, g473 - 0.3), labelColor: C.lime });
    placeStamp(g, lt, 'Times Square', 'April 2025', { y: 1560, t0: tsT - (t - lt) });
    credit(g, 'TUNDE ONAKOYA & SHAWN MARTINEZ · GUINNESS WORLD RECORDS', seg(lt, 0.3, 0.5));
  }, { trans: 'whip', grade: 'night', info: true });
  cue(twoT2, 'hit', 0.8); cue(h64b, 'clock', 0.7); cue(g473, 'boom', 0.6);

  // ======================= #1: 48 BLINDFOLD GAMES ON A BIKE =======================
  const oneT = s('n1'), tmT = w('n1', 'Timur'), g48 = w('n1', '48'), bfT = w('n1', 'Blindfolded'), bkT = w('n1', 'bike');
  if (PH.timur) shot(oneT - 0.05, (g, lt, t, sh) => {  // the real man first (2009 photo), then the record
    photo3d(g, PH.timur, lt, { from: { x: 0.42, y: 0.4, zoom: 1.0, focus: 0.5 }, to: { x: 0.42, y: 0.38, zoom: 1.1, dolly: 0.1 }, dur: len(sh), e: lin });
    rank(g, 1, t, oneT);
    badge(g, 'TIMUR GAREYEV', W / 2, 1480, { color: C.gold, size: 52, sub: 'GRANDMASTER', a: seg(t, tmT - 0.1, tmT), scale: pop(t, tmT) });
    credit(g, 'PHOTO: LUCIANA MORALES · CC BY 2.0 · 2009', seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'warm', noJump: true, kb: 0 });
  shot(PH.timur ? g48 - 0.45 : oneT - 0.05, (g, lt, t, sh) => {
    const bgc = g.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, H * 0.8); bgc.addColorStop(0, '#2A2436'); bgc.addColorStop(1, '#07060A'); g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    const nB = Math.round(lerp(0, 48, seg(t, g48 - 0.4, g48 + 0.6))), cell = 118, x0 = W / 2 - cell * 4, y0 = 470;
    for (let i = 0; i < nB; i++) {  // 48 boards on a wall behind him, one per game
      const x = x0 + (i % 8) * cell + 7, y = y0 + Math.floor(i / 8) * cell + 7, sz = cell - 14, q = sz / 8, rr = rng(i + 7);
      g.save(); g.globalAlpha = 0.55 * seg(t, g48 - 0.4 + i * 0.021, g48 - 0.3 + i * 0.021);
      for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) { g.fillStyle = (u + v) % 2 ? '#EEEED2' : '#769656'; g.fillRect(x + u * q, y + v * q, q, q); }
      for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#F7F3EA' : '#1A1A1A'; g.beginPath(); g.arc(x + (Math.floor(rr() * 8) + 0.5) * q, y + (Math.floor(rr() * 8) + 0.5) * q, q * 0.34, 0, 7); g.fill(); }
      g.restore();
    }
    spotlight(g, W / 2, 900, 480, '#FFF1D6', 0.22);
    const bob = Math.sin(t * 9) * 8;
    drawChar(g, 'timur', { x: W / 2, y: 840 + bob, s: 1.0, e: { ...EXPR.smug, curve: 0.8 }, t, tilt: Math.sin(t * 9) * 0.03 });
    bike(g, W / 2 - 66, 1290, 1.1, t);
    for (const gx of [-30, 150]) hand(g, W / 2 - 66 + gx * 1.1, 1290 - 150 * 1.1 + bob * 0.3, 34);
    rank(g, 1, t, oneT);
    counter(g, nB ? String(nB) : '', nB ? 'GAMES AT ONCE' : null, { y: 330, size: 150, a: seg(t, g48 - 0.4, g48 - 0.3) });
    badge(g, 'BLINDFOLDED', W / 2 - 250, 640, { color: C.red, size: 40, a: seg(t, bfT, bfT + 0.1), scale: pop(t, bfT) });
    badge(g, 'ON A BIKE', W / 2 + 270, 1150, { color: C.blue, size: 40, a: seg(t, bkT, bkT + 0.1), scale: pop(t, bkT) });
    credit(g, 'GM TIMUR GAREYEV · LAS VEGAS · 2016', seg(lt, 0.3, 0.5));
  }, { trans: PH.timur ? 'whip' : 'flash', grade: 'night', info: true });
  cue(oneT, 'boom', 0.9); cue(oneT, 'hit', 0.8); cue(g48, 'riser', 0.4); cue(bfT, 'stamp', 0.6); cue(bkT, 'pluck', 0.7);
  // he won 35: wins / draws / losses
  const wonT = w('n1b', 'won'), t35 = w('n1b', '35');
  shot(s('n1b') - 0.05, (g, lt, t, sh) => {
    const bgc = g.createLinearGradient(0, 0, 0, H); bgc.addColorStop(0, '#1E2A22'); bgc.addColorStop(1, '#070A08'); g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    const n = Math.round(lerp(0, 48, seg(t, wonT - 0.2, t35 + 0.4)));
    for (let i = 0; i < n; i++) { const col = i < 35 ? C.lime : i < 42 ? '#8A8F98' : C.red, x = W / 2 - 3.5 * 106 + (i % 8) * 106, y = 600 + Math.floor(i / 8) * 106;
      g.fillStyle = col; g.beginPath(); g.roundRect(x - 44, y - 44, 88, 88, 10); g.fill(); }
    counter(g, '35 WINS', '7 DRAWS · 6 LOSSES', { y: 420, size: 140, color: C.lime, a: seg(t, t35 - 0.1, t35), labelColor: '#8A8F98' });
  }, { trans: 'zoom', grade: 'neutral', info: true });
  for (let i = 0; i < 8; i++) cue(wonT + i * 0.12, 'tick', 0.3); cue(t35, 'hit', 0.8);

  // which one would you try? follow
  const tryT = w('cta', 'try'), folT = w('cta', 'Follow');
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    timesSquare(g, t);
    g.fillStyle = 'rgba(6,6,12,0.45)'; g.fillRect(0, 0, W, H);
    const items = [['29.85 SEC', 'ONE HAND', C.lime], ['20 FT', 'CHESS KING', C.gold], ['604', 'BOARDS AT ONCE', C.blue], ['64 HOURS', 'NONSTOP', C.red], ['48 BLIND', 'ON A BIKE', '#B48CFF']];
    items.forEach(([big, small, col], i) => {
      const t0 = s('cta') + i * 0.12, u = seg(t, t0, t0 + 0.25, ease.out); if (u <= 0) return;
      const y = 540 + i * 128; g.save(); g.globalAlpha = u; g.translate((1 - u) * -120, 0);
      g.fillStyle = 'rgba(10,8,14,0.82)'; g.beginPath(); g.roundRect(110, y - 52, W - 220, 104, 10); g.fill();
      g.fillStyle = col; g.fillRect(110, y - 52, 120, 104); g.fillStyle = C.ink; g.font = sans(54, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('#' + (5 - i), 170, y + 3);
      g.textAlign = 'left'; g.fillStyle = C.cream; g.font = sans(50, 900); g.fillText(big, 262, y + 3); const bw = g.measureText(big).width;
      g.fillStyle = col; g.font = sans(30, 800); g.letterSpacing = '2px'; g.fillText(small, 262 + bw + 24, y + 5); g.restore();
    });
    counter(g, 'WHICH ONE?', null, { y: 380, size: 130, a: seg(t, tryT - 0.3, tryT - 0.2) });
    badge(g, 'FOLLOW FOR MORE', W / 2, 1500, { color: C.gold, size: 48, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
    if (t > folT) confetti(g, t, folT, { n: 50 });
  }, { trans: 'whip', grade: 'night' });
  for (let i = 0; i < 5; i++) cue(s('cta') + i * 0.12, 'pluck', 0.4); cue(folT, 'sparkle', 0.7);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: fiveT - 0.05, m: 'digital' }, { t: fourT - 0.05, m: 'build' }, { t: threeT - 0.05, m: 'clockwork' }, { t: c135, m: 'hit' },
    { t: twoT2 - 0.05, m: 'tension' }, { t: oneT - 0.05, m: 'drop' }, { t: oneT + 0.4, m: 'victory' }, { t: s('cta') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
