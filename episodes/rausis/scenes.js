// The grandmaster in the bathroom: Igors Rausis, 58, the oldest player in the world's top 100, kept getting stronger
// until July 2019, when a phone was found in the toilet he had just used at the Strasbourg Open. A photo of him on the
// toilet lid with a chess program went round the world (an iPhone 4, in his own words); he signed that the phone was
// his, FIDE banned him for six years and took his GM title; a year later he turned up at a small tournament in Latvia
// as Isa Kasimi, and half the room knew him. Sources: SOURCES.md. Retention: the hook asks a question (how does a
// 58-year-old keep getting better?) and points at the bathroom without saying why; the phone lands at half time; a new
// loop ("the craziest part came a year later") carries the last 20 seconds. Calm rooms (rule 30), brilliant text
// (rule 33), a closing question answered with a number (rule 39), light tone: he died in 2024, no mockery.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, placeStamp, stamp, sans, serif, popIn } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, room, table, ENV, FLOOR_Y, texTri } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { sprite, spriteBox } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { DotMap, CITY } from '../../engine/js/map.js';
import { armsUp, handsOnHead } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

// ---------- cast: Rausis after the 2011 Commons photo (thick short grey hair with a fringe, thin metal glasses, a slim
// face, a dark sweater); everyone else is a generic player ----------
CAST.rausis = { face: [0.9, 1.08, 0.82], hair: 'magnus', hairC: '#ABA9A3', brow: '#77736B', suit: '#47423E', suitD: '#34302C', shirt: 'tee', glasses: 'thin', age: 0.5, iris: '#6A5A48', ears: 1.04 };
CAST.gmA = { face: [0.98, 1.04, 0.9], hair: 'receding', hairC: '#3A302A', brow: '#2E2620', suit: '#2E3440', suitD: '#20242C', shirt: 'tie', tie: '#5A2A2A', glasses: true, ears: 1.02 };
CAST.gmB = { face: [0.95, 1.06, 0.86], hair: 'parted', hairC: '#2A201A', brow: '#221A15', suit: '#4A3A2E', suitD: '#36291F', shirt: 'tie', tie: '#2A3A4A', ears: 1.04 };
CAST.amateur = { face: [1.02, 1.0, 0.95], hair: 'messy', hairC: '#6A4A2E', brow: '#4A3420', suit: '#3E6A5A', suitD: '#2C4E42', shirt: 'polo', ears: 1.04 };

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream, PHONE = '#9FD8FF';
const PH = { rausis: await loadPhoto3d('../episodes/rausis/photos/rausis2011') };
const MAP = await new DotMap().init();
CITY['Strasbourg'] = [7.75, 48.58]; CITY['Valka'] = [26.02, 57.78];
const CREDIT = 'Photo: Mt7 / Wikimedia Commons, CC BY-SA 3.0';

// ---------- calm rooms (rule 30) ----------
const HALL = { base: '#0E0B08', wall: ['#5A4A38', '#4C3E2F'], seam: '#2E241A', rail: '#6A5236', floor: ['#2E2318', '#261D14'], light: '#FFE6B8', lightA: 0.3, windows: true };
const CLUB = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.32, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const darkCard = (g, top, bottom) => { const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bottom); g.fillStyle = bg; g.fillRect(0, 0, W, H); };
const SLATEBG = ['#16202A', '#07090C'];
const pop = (t, t0) => popIn(t, t0);
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a heading in the brilliant type: letter-spaced heavy cream with a teal underline
function heading(g, text, y, a = 1, { size = 44, color = CREAM, spacing = 5 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = `${spacing}px`; g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText(text, W / 2, y); g.shadowColor = 'transparent';
  const tw = g.measureText(text).width; g.fillStyle = TEAL; g.fillRect(W / 2 - 40, y + 18, 80, 5);
  qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 30, 'text', text); g.restore();
}
const zoomAt = (g, x, y, z) => { g.translate(x, y); g.scale(z, z); g.translate(-x, -y); };

// ---------- the tournament hall: long rows of tables, a board and an opponent at every place ----------
const WOOD = (() => {
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { g.fillStyle = (f + r) % 2 ? '#E2C89A' : '#8A5A34'; g.fillRect(f * 32, r * 32, 32, 32); }
  g.strokeStyle = '#3A2414'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248); return c;
})();
const BS = 0.9;
const layout = (rows, nb, z0, dz, seed) => {  // a mid-game on every board, a different one each time
  const out = [], r = rng(seed);
  for (const xc of rows) for (let i = 0; i < nb; i++) {
    const pcs = [];
    for (let k = 0; k < 9; k++) pcs.push({ t: 'pnbrqk'[Math.floor(r() * 5.99)] || 'p', c: r() < 0.5 ? 'w' : 'b', f: Math.floor(r() * 8), rk: Math.floor(r() * 8) });
    out.push({ xc, z: z0 + i * dz, pcs, tone: r(), turn: r() });
  }
  return { rows, items: out, z0: z0 - 0.7, z1: z0 + (nb - 1) * dz + 0.7 };
};
const BIG = layout([0.3, 4, 7.7], 15, -3.6, 1.12, 47), SMALL = layout([1.2, 6.8], 4, 1.0, 2.2, 20);
function hallBoards(g, L, { lit = 1, turn = 0, marks = 0, t = 0 } = {}) {
  const items = [...L.items].sort((a, b) => B.toCam(b.xc, 0, b.z)[2] - B.toCam(a.xc, 0, a.z)[2]);
  for (const xc of [...L.rows].sort((a, b) => Math.abs(b - B.E[0]) - Math.abs(a - B.E[0])))
    box(g, B, [xc - 0.62, FLOOR_Y, L.z0], [xc + 0.62, 0, L.z1], { top: '#5A3E26', side: '#2A1A0E', front: '#3A2616' });
  for (const it of items) {
    const d = B.toCam(it.xc, 0, it.z)[2]; if (d < 0.8) continue;
    const fog = clamp(1 - (d - 8) / 26, 0.25, 1) * lit, h = BS / 2, y = 0.004;
    const P = ([x, z]) => B.project(it.xc + x, y, it.z + z);
    const tl = P([-h, h]), tr = P([h, h]), bl = P([-h, -h]), br = P([h, -h]);
    g.save(); g.globalAlpha *= fog; texTri(g, WOOD, 0, 0, 256, 256, tl, tr, bl, false); texTri(g, WOOD, 0, 0, 256, 256, br, bl, tr, true); g.restore();
    for (const pc of it.pcs) {
      const p = B.project(it.xc - h + (pc.f + 0.5) * BS / 8, 0.01, it.z - h + (pc.rk + 0.5) * BS / 8), hh = p.s * 0.2;
      if (p.z < 0.8 || hh < 2) continue;
      const bx = spriteBox(hh); g.save(); g.globalAlpha *= fog; g.drawImage(sprite(pc.t, pc.c), p.x - bx.w / 2, p.y + bx.top, bx.w, bx.h); g.restore();
    }
    // the player across the board: a dark bust; with `turn` the heads swing round, with `marks` a "!" pops over them
    const hp = B.project(it.xc + 1.05, 1.25, it.z), sp = B.project(it.xc + 1.05, 0.5, it.z);
    if (hp.z > 0.8) {
      const k = hp.s, col = mix('#2A221C', '#4A3C30', it.tone), sw = turn * (it.turn < 0.5 ? 1 : 0.7) * k * 0.09;
      g.save(); g.globalAlpha *= fog;
      g.fillStyle = col; g.beginPath(); g.ellipse(sp.x, sp.y, k * 0.42, k * 0.52, 0, Math.PI, 0); g.lineTo(sp.x + k * 0.42, sp.y + k * 0.3); g.lineTo(sp.x - k * 0.42, sp.y + k * 0.3); g.fill();
      g.fillStyle = mix(col, '#C8A27A', 0.35); g.beginPath(); g.arc(hp.x + sw, hp.y, k * 0.22, 0, 7); g.fill();
      g.fillStyle = mix(col, '#000000', 0.2); g.beginPath(); g.arc(hp.x + sw, hp.y - k * 0.06, k * 0.22, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      if (marks > 0 && it.turn < 0.5 + marks * 0.5) {
        const u = seg(marks, it.turn * 0.5, it.turn * 0.5 + 0.3, ease.back);
        g.globalAlpha = fog * clamp(u * 2); g.fillStyle = GOLD; g.font = sans(Math.max(14, k * 0.42), 900); g.textAlign = 'center';
        g.fillText('!', hp.x + sw, hp.y - k * (0.35 + 0.15 * u) + Math.sin(t * 9 + it.tone * 7) * 2);
      }
      g.restore();
    }
  }
}
// the hall seen from behind the boards, or a small club room; `who` sits at the head of the hall
function hall(g, lt, t, keys, { L = BIG, env = HALL, lit = 1, turn = 0, marks = 0, who = null, e = 'focus', face = 1, wx = 4, wz = -6.6 } = {}) {
  rig(B, lt, keys, { t });
  room(g, B, env, { t, blur: 2 });
  if (who && face > 0) {
    const hp = B.project(wx, 3.1, wz); if (hp.z > 0.8) rim(g, hp.x, hp.y, hp.s * 3.2, '#FFD9A0', 0.35);
    actor(g, B, who, { x: wx, y: 3.1, z: wz, k: 1.05, e, t, face });
    box(g, B, [wx - 2.6, FLOOR_Y, wz + 0.2], [wx + 2.6, 0.3, wz + 1.3], { top: '#4A3220', side: '#22160C', front: '#2E1E10' });
  }
  hallBoards(g, L, { lit, turn, marks, t });
  lowKey(g, { cy: H * 0.44, a: 0.24 });
}
const HALLR = (yaw = 0, dist = 17, pitch = 0.34, tz = -4) => ({ yaw: Math.PI + yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, 2.6, tz] });
const HIGH = (yaw, dist, pitch = 0.62) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, 0, 4] });

// ---------- a portrait behind a board (him), and a game seen from the side (him against a weaker player) ----------
const FRONT = (yaw = 0.1, dist = 7.4, pitch = 0.3) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [4, 2.8, 9.2] });
const START = 'rnbqkbnr/pppppppp/8/8/4P3/2N2N2/PPPP1PPP/R1BQKB1R'.split('/');
const POS = (() => { const out = []; START.forEach((row, r) => { let f = 0; for (const ch of row) { if (/\d/.test(ch)) { f += +ch; continue; } const sq = 'abcdefgh'[f] + (8 - r); out.push({ id: sq, t: ch.toLowerCase(), c: ch === ch.toUpperCase() ? 'w' : 'b', sq, x: f + 0.5, z: 7 - r + 0.5 }); f++; } }); return out; })();
function portrait(g, lt, t, who, e, { keys, env = CLUB, pieces = POS } = {}) {
  rig(B, lt, keys, { t });
  const E = room(g, B, env, { t, blur: 3 });
  bokeh(g, t, { n: 7, seed: 5, y0: 0.06, y1: 0.4, a: 0.16, size: [50, 110], colors: ['#FFD9A0', '#FFC27A'] });
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 3.6, E.light, 0.22);
  const hands = seated(g, B, who, e, t, { z: 9.4 });
  table(g, B, E); B.drawSlab(g, SLATE);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 });
  hands();
  lowKey(g, { cy: H * 0.4, a: 0.24 });
}
function versus(g, lt, t, tGap) {
  darkCard(g, '#1C150E', '#070504'); rim(g, 290, 700, 700, '#FFD9A0', 0.24); rim(g, 800, 720, 600, '#9FB0BA', 0.12);
  drawChar(g, 'rausis', { x: 290, y: 820, s: 1.12, e: { ...EXPR.smug, turn: 0.45, look: [0.7, 0], curve: 0.35 }, t });
  drawChar(g, 'amateur', { x: 800, y: 860, s: 0.92, e: { ...EXPR.worried, turn: -0.45, look: [-0.7, 0] }, t });
  g.save(); g.font = sans(90, 900); g.textAlign = 'center'; g.fillStyle = CREAM; g.globalAlpha = 0.9; g.fillText('VS', W / 2 + 10, 760); g.restore();
  const tag = (x, y, txt, col, u) => { if (u <= 0) return; g.save(); g.globalAlpha *= clamp(u * 2); g.translate(x, y); g.scale(lerp(1.4, 1, ease.out(u)), lerp(1.4, 1, ease.out(u)));
    g.font = sans(56, 900); const tw = g.measureText(txt).width + 44; g.fillStyle = 'rgba(8,6,4,0.7)'; g.beginPath(); g.roundRect(-tw / 2, -44, tw, 80, 12); g.fill();
    g.strokeStyle = col; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.textAlign = 'center'; g.fillText(txt, 0, 16); g.restore(); qaRect(g, x - tw / 2, y - 44, tw, 80, 'text', txt); };
  tag(290, 1110, '2686', GOLD, seg(lt, 0.1, 0.3));
  tag(800, 1110, '−400', RED, seg(t, tGap, tGap + 0.2));
}
function duel(g, lt, t, keys, { wE = 'worried', bE = 'focus' } = {}) {
  rig(B, lt, keys, { t });
  const E = room(g, B, CLUB, { t, blur: 3 });
  const hb = seated(g, B, 'rausis', bE, t, { z: 9.4 });
  const hw = seated(g, B, 'amateur', wE, t, { z: -1.4, face: 1, alpha: B.E[2] > -1.4 ? 1 : 0 });
  table(g, B, E); B.drawSlab(g, SLATE);
  B.drawPieces(g, POS, { focus: B.dist, dof: 1.3 });
  hb(); hw();
  lowKey(g, { cy: H * 0.42, a: 0.28 });
}

// ---------- 2D sets ----------
// two grandmasters who cannot explain it: busts turned to each other, question marks over their heads
function puzzled(g, lt, t) {
  darkCard(g, '#2A2016', '#0A0705'); rim(g, W / 2, 620, 900, '#FFD9A0', 0.25);
  const z = 1 + 0.04 * clamp(lt / 1.4); g.save(); zoomAt(g, W / 2, 900, z);
  drawChar(g, 'gmA', { x: 290, y: 860, s: 1.3, e: { ...EXPR.worried, turn: 0.55, look: [0.8, 0], sweat: 0 }, t });
  drawChar(g, 'gmB', { x: 790, y: 880, s: 1.3, e: { ...EXPR.worried, turn: -0.55, look: [-0.8, 0], sweat: 0, brow: -0.5 }, t });
  g.restore();
  g.save(); g.font = sans(120, 900); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 6;
  [[300, 470, 0], [790, 490, 0.15]].forEach(([x, y, d]) => { const u = seg(lt, 0.1 + d, 0.35 + d, ease.back); if (u > 0) { g.globalAlpha = clamp(u * 2); g.fillText('?', x + Math.sin(t * 3 + d * 9) * 6, y - 30 * u); } });
  g.restore();
}
// the corridor to the bathroom: a door at the far end, light leaking under it (a cold blue, like a screen)
function corridor(g, lt, t, { z0 = 1, z1 = 1.14, dur = 3, glow = 1, shut = 0 } = {}) {
  darkCard(g, '#0E0C0A', '#050404');
  const z = lerp(z0, z1, ease.inOut(clamp(lt / dur))); g.save(); zoomAt(g, W / 2, 860, z);
  const cx = W / 2, cy = 860, dw = 300, dh = 560, dx = cx - dw / 2, dy = cy - dh / 2;
  const wall = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  wall([[0, 0], [dx - 120, dy - 140], [dx - 120, dy + dh + 140], [0, H]], '#3A3128');          // left wall
  wall([[W, 0], [dx + dw + 120, dy - 140], [dx + dw + 120, dy + dh + 140], [W, H]], '#332B23');  // right wall
  wall([[0, 0], [W, 0], [dx + dw + 120, dy - 140], [dx - 120, dy - 140]], '#1E1914');           // ceiling
  wall([[0, H], [W, H], [dx + dw + 120, dy + dh + 140], [dx - 120, dy + dh + 140]], '#2A2219');  // floor
  wall([[dx - 120, dy - 140], [dx + dw + 120, dy - 140], [dx + dw + 120, dy + dh + 140], [dx - 120, dy + dh + 140]], '#4A3E31');  // far wall
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3;
  for (let i = 1; i < 7; i++) { const k = i / 7; g.beginPath(); g.moveTo(lerp(0, dx - 120, k), lerp(H, dy + dh + 140, k)); g.lineTo(lerp(W, dx + dw + 120, k), lerp(H, dy + dh + 140, k)); g.stroke(); }  // floor tiles
  rim(g, cx, dy - 60, 420, '#FFE2B0', 0.35);  // a ceiling lamp over the door
  g.fillStyle = '#2A1E14'; g.fillRect(dx - 14, dy - 14, dw + 28, dh + 14);  // frame
  const dg = g.createLinearGradient(dx, 0, dx + dw, 0); dg.addColorStop(0, '#6A5440'); dg.addColorStop(1, '#584434');
  g.fillStyle = dg; g.fillRect(dx, dy, dw, dh);
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.strokeRect(dx + 30, dy + 34, dw - 60, dh * 0.42); g.strokeRect(dx + 30, dy + dh * 0.52, dw - 60, dh * 0.4);
  g.fillStyle = '#C9A05A'; g.beginPath(); g.arc(dx + dw - 44, dy + dh * 0.5, 12, 0, 7); g.fill();
  g.fillStyle = '#E8DCC0'; g.beginPath(); g.roundRect(cx - 62, dy + 70, 124, 70, 8); g.fill();
  g.fillStyle = '#2A2016'; g.font = sans(46, 900); g.textAlign = 'center'; g.letterSpacing = '4px'; g.fillText('WC', cx + 2, dy + 122);
  if (glow > 0) {  // the cold light under the door
    const fl = 0.8 + 0.2 * Math.sin(t * 7) * Math.sin(t * 2.3);
    g.save(); g.globalCompositeOperation = 'screen';
    const lg = g.createLinearGradient(0, dy + dh - 4, 0, dy + dh + 150); lg.addColorStop(0, rgba(PHONE, 0.95 * glow * fl)); lg.addColorStop(1, rgba(PHONE, 0));
    g.fillStyle = lg; g.beginPath(); g.moveTo(dx, dy + dh); g.lineTo(dx + dw, dy + dh); g.lineTo(dx + dw + 200, dy + dh + 150); g.lineTo(dx - 200, dy + dh + 150); g.closePath(); g.fill();
    rim(g, W / 2, dy + dh + 20, 260, PHONE, 0.35 * glow * fl);
    g.fillStyle = rgba(PHONE, 0.9 * glow * fl); g.fillRect(dx + 6, dy + dh - 5, dw - 12, 5);
    g.restore();
  }
  if (shut > 0) { g.fillStyle = `rgba(0,0,0,${(0.6 * shut).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  g.restore();
}
// inside the stall: tiles, a wall cistern, the toilet with its lid down and a phone lying on the lid, glowing
const PHX = W / 2 + 40, PHY = 760;
function stall(g, lt, t, { find = 9, zoom = [1, 1.06], dur = 3 } = {}) {
  darkCard(g, '#1A1E20', '#0A0C0D');
  const z = lerp(zoom[0], zoom[1], ease.inOut(clamp(lt / dur))) * (1 + 0.55 * ease.inOut(seg(t, find, find + 0.8)));
  g.save(); zoomAt(g, lerp(W / 2, PHX, seg(t, find, find + 0.8)), lerp(800, PHY, seg(t, find, find + 0.8)), z);
  for (let r = 0; r < 26; r++) for (let c = 0; c < 10; c++) { g.fillStyle = (r + c) % 2 ? '#B9C1BC' : '#B2BAB5'; g.fillRect(c * 110 + 2, r * 80 + 2, 106, 76); }
  g.fillStyle = 'rgba(8,12,14,0.5)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#5A625E'; g.fillRect(0, 1060, W, H - 1060);  // the floor
  rim(g, W / 2, 260, 900, '#FFF1D6', 0.22);
  const cx = W / 2, on = 0.75 + 0.25 * Math.sin(t * 5) ** 2;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
  g.fillStyle = '#ECECE6'; g.beginPath(); g.roundRect(cx - 190, 330, 380, 230, 18); g.fill(); g.restore();  // wall cistern
  g.fillStyle = '#D8D8D0'; g.beginPath(); g.roundRect(cx - 50, 352, 100, 54, 10); g.fill();                 // flush plate
  g.fillStyle = '#C6C6BE'; g.fillRect(cx - 30, 560, 60, 110);                                                // pipe
  const bg = g.createLinearGradient(cx - 210, 0, cx + 210, 0); bg.addColorStop(0, '#CFCFC7'); bg.addColorStop(0.45, '#F2F2EC'); bg.addColorStop(1, '#C4C4BC');
  g.fillStyle = bg; g.beginPath(); g.moveTo(cx - 205, 760); g.bezierCurveTo(cx - 200, 900, cx - 120, 960, cx - 110, 1060); g.lineTo(cx + 110, 1060); g.bezierCurveTo(cx + 120, 960, cx + 200, 900, cx + 205, 760); g.closePath(); g.fill();  // bowl
  g.fillStyle = '#E6E6DE'; g.beginPath(); g.ellipse(cx, 760, 215, 92, 0, 0, 7); g.fill();     // the lid, closed
  g.fillStyle = '#F6F6F0'; g.beginPath(); g.ellipse(cx, 752, 200, 80, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.1)'; g.beginPath(); g.ellipse(cx, 676, 120, 16, 0, 0, 7); g.fill();  // hinge shadow
  g.fillStyle = '#F4F2EA'; g.beginPath(); g.arc(cx + 400, 600, 64, 0, 7); g.fill(); g.fillStyle = '#B9B5AA'; g.beginPath(); g.arc(cx + 400, 600, 20, 0, 7); g.fill();  // paper roll
  rim(g, PHX, PHY, 300, PHONE, 0.55 * on);
  g.save(); g.translate(PHX, PHY); g.scale(1, 0.55); g.rotate(-0.5);  // the phone, lying flat on the lid
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 14; g.fillStyle = '#16181C'; g.beginPath(); g.roundRect(-46, -86, 92, 172, 12); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = rgba(PHONE, 0.95 * on); g.beginPath(); g.roundRect(-38, -66, 76, 122, 4); g.fill();
  for (let f = 0; f < 6; f++) for (let k = 0; k < 6; k++) if ((f + k) % 2) { g.fillStyle = 'rgba(30,60,80,0.35)'; g.fillRect(-33 + f * 11, -50 + k * 11, 11, 11); }
  g.restore();
  g.restore();
}
// the photo that went round the world, redrawn: shot from above the partition, him on the lid with the phone
function pressPhoto(g, lt, t, { x = W / 2, y = 760, s = 1, rot = -0.03, flashT = -9, a = 1 } = {}) {
  if (a <= 0) return;
  const w = 760, h = 900;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20; g.fillStyle = '#F2EEE4'; g.fillRect(-w / 2 - 22, -h / 2 - 22, w + 44, h + 110); g.shadowColor = 'transparent';
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip();
  g.fillStyle = '#5E6A66'; g.fillRect(-w / 2, -h / 2, w, h);
  for (let r = 0; r < 12; r++) for (let c = 0; c < 8; c++) { g.fillStyle = (r + c) % 2 ? '#7E8A84' : '#76827C'; g.fillRect(-w / 2 + c * 100, -h / 2 + r * 80, 98, 78); }
  g.fillStyle = '#D8D8D0'; g.beginPath(); g.roundRect(-150, -h / 2 + 90, 300, 150, 16); g.fill();  // the cistern behind him
  const ph = { x: 40, y: 150 };
  drawChar(g, 'rausis', { x: 0, y: 40, s: 1.15, e: { ...EXPR.focus, look: [0.25, 1], lid: 0.45, brow: 0.3 }, t });
  rim(g, ph.x, ph.y - 70, 230, PHONE, 0.55);  // the screen lights his face
  g.save(); g.translate(ph.x, ph.y); g.rotate(0.18);
  g.fillStyle = '#16181C'; g.beginPath(); g.roundRect(-44, -78, 88, 156, 12); g.fill();
  g.fillStyle = '#EAF6FF'; g.beginPath(); g.roundRect(-38, -60, 76, 112, 4); g.fill();
  for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? '#7C9A6A' : '#E8EED8'; g.fillRect(-34 + f * 8.5, -50 + k * 8.5, 8.5, 8.5); }
  g.restore();
  hand(g, ph.x - 46, ph.y + 30, 34); hand(g, ph.x + 48, ph.y + 34, 34);
  g.fillStyle = '#C9C9C0'; g.fillRect(-w / 2, h / 2 - 120, w, 120);  // the partition top, in the foreground
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-w / 2, h / 2 - 120, w, 10);
  if (t > flashT && t < flashT + 0.5) { g.fillStyle = `rgba(255,255,255,${(0.9 * (1 - (t - flashT) / 0.5)).toFixed(3)})`; g.fillRect(-w / 2, -h / 2, w, h); }
  g.restore();
}
// "it was an iPhone 4": an old phone, metal band, home button, a chess app with an engine bar
function oldPhone(g, lt, t, { z = 1 } = {}) {
  darkCard(g, '#16202A', '#06080B'); rim(g, W / 2, 760, 800, PHONE, 0.12);
  g.save(); zoomAt(g, W / 2, 780, z * (1 + 0.04 * clamp(lt / 4))); g.translate(W / 2, 780); g.rotate(-0.06);
  const w = 420, h = 820;
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 60; g.shadowOffsetY = 26; g.fillStyle = '#B9BCC0'; g.beginPath(); g.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 46); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#0E0F12'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 40); g.fill();
  g.fillStyle = '#23252A'; g.beginPath(); g.roundRect(-40, -h / 2 + 50, 80, 12, 6); g.fill();   // earpiece
  g.strokeStyle = '#3A3C42'; g.lineWidth = 4; g.beginPath(); g.arc(0, h / 2 - 66, 30, 0, 7); g.stroke();  // home button
  g.beginPath(); g.roundRect(-10, h / 2 - 76, 20, 20, 4); g.stroke();
  const sw = 340, sh = 510, sx = -sw / 2, sy = -sh / 2 - 10;
  g.fillStyle = '#1E2A22'; g.fillRect(sx, sy, sw, sh);
  const q = sw / 8 - 3, bx0 = sx + 12, by0 = sy + 70;
  for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? '#769656' : '#EEEED2'; g.fillRect(bx0 + f * q, by0 + k * q, q + 0.5, q + 0.5); }
  for (const p of POS) { const f = p.sq.charCodeAt(0) - 97, k = 8 - +p.sq[1], bx = spriteBox(q * 1.05); g.drawImage(sprite(p.t, p.c), bx0 + (f + 0.5) * q - bx.w / 2, by0 + (k + 1) * q - q * 0.1 + bx.top, bx.w, bx.h); }
  g.fillStyle = '#F2F2F2'; g.fillRect(bx0 + 8 * q + 6, by0, 8, 8 * q); g.fillStyle = '#2A2A2A'; g.fillRect(bx0 + 8 * q + 6, by0, 8, 8 * q * 0.42);  // engine bar
  g.fillStyle = '#EAF7EE'; g.font = sans(26, 800); g.textAlign = 'left'; g.fillText('+1.3', sx + 14, sy + 44);
  g.fillStyle = 'rgba(234,247,238,0.5)'; g.fillRect(sx + 14, by0 + 8 * q + 20, sw - 28, 10); g.fillRect(sx + 14, by0 + 8 * q + 42, sw * 0.6, 10);
  g.restore();
}
// the rating line: about 2500 in 2013, 2686 in July 2019 (only the two ends are data; the line between is a sketch)
function ratingChart(g, lt, t, tA, tB, tLo = tA) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  const x0 = 150, x1 = 930, y0 = 1080, y1 = 520, v = r => lerp(y0, y1, (r - 2450) / (2700 - 2450));
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2;
  for (const r of [2500, 2550, 2600, 2650, 2700]) { g.beginPath(); g.moveTo(x0, v(r)); g.lineTo(x1, v(r)); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.font = sans(22, 800); g.textAlign = 'right'; g.fillText(String(r), x0 - 14, v(r) + 8); }
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.textAlign = 'center'; g.font = sans(26, 800); g.fillText('2013', x0 + 20, y0 + 56); g.fillText('2019', x1 - 20, y0 + 56);
  g.fillText('AGE 52', x0 + 20, y0 + 92); g.fillText('AGE 58', x1 - 20, y0 + 92);
  const u = seg(t, tA, tB, ease.out), n = 60;  // the line grows through the whole sentence and lands on "2686"
  const pt = k => { const x = lerp(x0 + 20, x1 - 20, k), r = 2500 + 186 * (k * k * 0.55 + k * 0.45) + Math.sin(k * 23) * 7 * (1 - k); return [x, v(r)]; };
  if (u > 0) {
    g.save(); g.strokeStyle = C.lime; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = C.lime; g.shadowBlur = 16;
    g.beginPath(); for (let i = 0; i <= n * u; i++) { const [x, y] = pt(i / n); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
    const [ax, ay] = pt(0); g.fillStyle = CREAM; g.beginPath(); g.arc(ax, ay, 12, 0, 7); g.fill();
    if (t >= tLo) { g.globalAlpha = seg(t, tLo, tLo + 0.15); g.font = sans(40, 900); g.textAlign = 'left'; g.fillText('2500', ax + 22, ay + 52); g.globalAlpha = 1; }
  }
  if (t >= tB) { const [bx, by] = pt(1), k = seg(t, tB, tB + 0.25, ease.back); g.fillStyle = GOLD; g.beginPath(); g.arc(bx, by, 16 * k, 0, 7); g.fill(); rim(g, bx, by, 160, GOLD, 0.4 * k); g.font = sans(64, 900); g.textAlign = 'right'; g.fillStyle = GOLD; g.fillText('2686', bx - 10, by - 36); }
  qaRect(g, x0 - 80, y1 - 120, x1 - x0 + 100, y0 - y1 + 230, 'text', 'rating chart');
}
// the world's top 100 as bars without names; one row lit: his
function top100(g, lt, t, tOld) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  heading(g, 'WORLD TOP 100', 330, seg(lt, 0, 0.15), { size: 44 });
  const rows = 10, y0 = 430, rh = 70, me = 7, scroll = lerp(0, 1, ease.inOut(clamp(lt / 2.2)));
  g.save(); g.beginPath(); g.rect(90, y0 - 10, W - 180, rows * rh + 10); g.clip();
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * rh, mine = i === me, r = rng(i * 7 + 3);
    g.fillStyle = mine ? rgba(GOLD, 0.22) : 'rgba(255,255,255,0.05)'; g.beginPath(); g.roundRect(100, y, W - 200, rh - 12, 10); g.fill();
    g.fillStyle = mine ? GOLD : 'rgba(255,255,255,0.25)'; g.fillRect(130, y + 22, mine ? 330 : 140 + r() * 180, 14);
    g.fillStyle = mine ? GOLD : 'rgba(255,255,255,0.18)'; g.font = sans(30, 900); g.textAlign = 'right'; g.fillText(mine ? '2686' : String(2700 - i * 2 - Math.floor(r() * 2)), W - 130, y + 40);
    if (mine) { g.textAlign = 'left'; g.font = sans(30, 900); g.fillStyle = CREAM; g.fillText('RAUSIS · AGE 58', 130 + 350, y + 40); }
  }
  g.restore();
  qaRect(g, 100, y0, W - 200, rows * rh, 'text', 'top 100 list');
  if (t >= tOld) badge(g, 'THE OLDEST', W / 2, 1210 - 30, { color: GOLD, size: 54, ...pop(t, tOld) });
}
// small opens: a wall of boards, each one won, "1-0" stamped in turn
function wins(g, lt, t, t0, dt) {
  darkCard(g, '#1C150E', '#070504'); rim(g, W / 2, 700, 900, '#FFD9A0', 0.16);
  const cols = 3, s = 250, gap = 36, gw = cols * s + (cols - 1) * gap, x0 = W / 2 - gw / 2, y0 = 340;
  for (let i = 0; i < 9; i++) {
    const x = x0 + (i % cols) * (s + gap), y = y0 + Math.floor(i / cols) * (s + gap), q = s / 8, r = rng(i + 3);
    g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillStyle = '#2A1A0E'; g.fillRect(x - 8, y - 8, s + 16, s + 16); g.restore();
    for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? '#8A5A34' : '#E2C89A'; g.fillRect(x + f * q, y + k * q, q + 0.5, q + 0.5); }
    for (let n = 0; n < 7; n++) { const f = Math.floor(r() * 8), k = Math.floor(r() * 8), bx = spriteBox(q * 1.05); g.drawImage(sprite('pnbrqk'[Math.floor(r() * 5.99)], r() < 0.5 ? 'w' : 'b'), x + (f + 0.5) * q - bx.w / 2, y + (k + 1) * q - q * 0.1 + bx.top, bx.w, bx.h); }
    const ts = t0 + i * dt;
    if (t >= ts) {
      const u = seg(t, ts, ts + 0.14), k = lerp(1.9, 1, ease.out(u));
      g.save(); g.translate(x + s / 2, y + s / 2); g.rotate(-0.16); g.scale(k, k); g.globalAlpha = clamp(u * 2);
      g.fillStyle = 'rgba(10,8,6,0.55)'; g.beginPath(); g.roundRect(-96, -46, 192, 92, 12); g.fill();
      g.strokeStyle = C.lime; g.lineWidth = 6; g.stroke(); g.fillStyle = C.lime; g.font = sans(64, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1–0', 0, 4); g.restore();
    }
  }
  qaRect(g, x0, y0, gw, gw, 'text', 'wins grid');
}
// the fair-play desk: two monitors with his games, a folder, a magnifier; the calendar runs on
function fairPlay(g, lt, t, tMonths) {
  darkCard(g, '#0C1014', '#040506'); rim(g, W / 2, 420, 900, '#BFE0F4', 0.12);
  const scr = (x, y, w, h, seed) => {
    g.fillStyle = '#1A1E24'; g.beginPath(); g.roundRect(x - 14, y - 14, w + 28, h + 28, 12); g.fill();
    g.fillStyle = '#0A1820'; g.fillRect(x, y, w, h); const r = rng(seed);
    g.strokeStyle = 'rgba(191,224,244,0.12)'; g.lineWidth = 2; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x, y + i * h / 5); g.lineTo(x + w, y + i * h / 5); g.stroke(); }
    g.strokeStyle = PHONE; g.lineWidth = 4; g.beginPath();
    for (let i = 0; i <= 40; i++) { const xx = x + i / 40 * w, yy = y + h * (0.75 - 0.5 * (i / 40) ** 1.4 + (r() - 0.5) * 0.08); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.stroke(); g.fillStyle = rgba(PHONE, 0.15); g.fillRect(x, y, w, h);
    rim(g, x + w / 2, y + h / 2, w * 0.7, PHONE, 0.18);
  };
  const sway = Math.sin(t * 0.6) * 6;
  scr(110 + sway, 420, 400, 280, 3); scr(570 + sway, 400, 400, 300, 9);
  g.fillStyle = '#2A2016'; g.fillRect(0, 900, W, H - 900);  // the desk
  g.fillStyle = 'rgba(255,214,160,0.1)'; g.fillRect(0, 900, W, 6);
  g.save(); g.translate(W / 2 - 120, 1040); g.rotate(-0.06);  // the folder
  g.fillStyle = '#C9A86A'; g.fillRect(-200, -110, 400, 220); g.fillStyle = '#B8975A'; g.fillRect(-200, -110, 160, 30);
  g.fillStyle = '#2A2016'; g.font = sans(30, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('FAIR PLAY', 0, 10);
  g.fillStyle = RED; g.font = sans(22, 900); g.letterSpacing = '4px'; g.fillText('CONFIDENTIAL', 0, 56); g.restore();
  const mx = W / 2 + 230 + Math.sin(t * 1.3) * 30, my = 1030 + Math.cos(t * 1.1) * 18;  // the magnifier
  g.strokeStyle = '#3A3A3A'; g.lineWidth = 14; g.beginPath(); g.arc(mx, my, 60, 0, 7); g.stroke(); g.fillStyle = 'rgba(191,224,244,0.15)'; g.fill();
  g.lineWidth = 18; g.beginPath(); g.moveTo(mx + 44, my + 44); g.lineTo(mx + 110, my + 110); g.stroke();
  if (t >= tMonths) {  // the calendar on the wall runs through the months
    const k = Math.min(5, Math.floor((t - tMonths) / 0.12)), m = ['FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'][k];
    g.fillStyle = '#ECE3CC'; g.beginPath(); g.roundRect(W / 2 - 70, 160, 140, 150, 10); g.fill(); g.fillStyle = RED; g.fillRect(W / 2 - 70, 160, 140, 44);
    g.fillStyle = '#FFFFFF'; g.font = sans(28, 900); g.textAlign = 'center'; g.fillText('2019', W / 2, 192); g.fillStyle = '#2A2016'; g.font = sans(54, 900); g.fillText(m, W / 2, 280);
    qaRect(g, W / 2 - 70, 160, 140, 150, 'text', 'calendar');
  }
}
// the signed statement
function statement(g, lt, t, tSign) {
  darkCard(g, '#1C150E', '#060403'); rim(g, W / 2, 600, 900, '#FFE2B0', 0.2);
  g.save(); g.translate(W / 2, 760); g.rotate(-0.04);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#F2EEE2'; g.fillRect(-340, -440, 680, 880); g.shadowColor = 'transparent';
  g.fillStyle = '#1E1A14'; g.font = sans(48, 900); g.letterSpacing = '8px'; g.textAlign = 'center'; g.fillText('STATEMENT', 0, -350);
  g.fillRect(-280, -320, 560, 4);
  g.fillStyle = 'rgba(30,26,20,0.35)'; for (let i = 0; i < 12; i++) g.fillRect(-280, -270 + i * 40, 560 - (i % 3) * 70, 12);
  g.fillStyle = 'rgba(30,26,20,0.5)'; g.fillRect(-280, 300, 300, 3); g.font = sans(20, 800); g.letterSpacing = '3px'; g.textAlign = 'left'; g.fillText('SIGNATURE', -280, 330);
  const u = seg(t, tSign, tSign + 1.0, lin);  // the signature, written stroke by stroke
  if (u > 0) {
    g.strokeStyle = '#1F3A7A'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    const n = Math.floor(120 * u);
    for (let i = 0; i <= n; i++) { const k = i / 120, x = -270 + k * 290, y = 280 - 26 * Math.sin(k * 26) * (0.6 + 0.4 * Math.sin(k * 7)) - k * 10; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    if (u < 1) { const k = n / 120, x = -270 + k * 290, y = 280 - 26 * Math.sin(k * 26) * (0.6 + 0.4 * Math.sin(k * 7)) - k * 10; g.save(); g.translate(x, y); g.rotate(-0.7); g.fillStyle = '#2A2A30'; g.fillRect(-6, -150, 12, 150); g.fillStyle = '#C9A05A'; g.fillRect(-6, -150, 12, 20); g.restore(); }
  }
  g.restore();
}
// the name plate loses its "GM"
function namePlate(g, lt, t, tBan, tStrip) {
  darkCard(g, '#1C150E', '#060403'); rim(g, W / 2, 700, 900, '#FFE2B0', 0.2);
  g.fillStyle = '#3A2614'; g.fillRect(0, 1000, W, H - 1000); g.fillStyle = 'rgba(255,214,160,0.1)'; g.fillRect(0, 1000, W, 6);
  const px = W / 2, py = 880;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 16;
  const pg = g.createLinearGradient(0, py - 90, 0, py + 90); pg.addColorStop(0, '#6A4A2A'); pg.addColorStop(1, '#3A2414');
  g.fillStyle = pg; g.beginPath(); g.moveTo(px - 400, py + 110); g.lineTo(px - 360, py - 90); g.lineTo(px + 360, py - 90); g.lineTo(px + 400, py + 110); g.closePath(); g.fill(); g.restore();
  g.fillStyle = '#D8B878'; g.fillRect(px - 330, py - 60, 660, 120);
  g.font = sans(64, 900); g.letterSpacing = '4px'; g.textAlign = 'left'; g.textBaseline = 'middle';
  const name = 'IGORS RAUSIS', gm = 'GM', wn = g.measureText(name).width, wg = g.measureText(gm + ' ').width, x0 = px - (wg + wn) / 2;
  const cut = x0 + wg - 10;  // the brass plate is cut just after "GM"
  g.fillStyle = '#D8B878'; g.fillRect(cut, py - 60, px + 330 - cut, 120);
  g.fillStyle = '#2A1C10'; g.fillText(name, x0 + wg, py + 4);
  const piece = () => { g.fillStyle = '#E2C486'; g.fillRect(-(cut - (px - 330)), -60, cut - (px - 330), 120); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-4, -60, 4, 120); g.fillStyle = '#2A1C10'; g.fillText(gm, x0 - cut, 4); };
  if (t < tStrip) { g.save(); g.translate(cut, py); piece(); g.restore(); }
  else {  // the "GM" piece breaks off, tumbles and lands on the desk
    const d = t - tStrip, fall = Math.min(1, d / 0.45), yy = py + lerp(0, 230, fall * fall), rot = lerp(0, -0.9, ease.out(fall)) + (fall >= 1 ? Math.sin((d - 0.45) * 18) * 0.08 * Math.exp(-(d - 0.45) * 6) : 0);
    g.save(); g.translate(cut - 80 * fall, yy); g.rotate(rot); piece(); g.restore();
  }
  g.textBaseline = 'alphabetic';
  qaRect(g, px - 330, py - 60, 660, 120, 'text', 'name plate');
  if (t >= tBan) stamp(g, 'BANNED', W / 2, 520, t, tBan, { color: RED, size: 96, rot: -0.12, sub: '6 YEARS' });
}
// a year passes: the calendar page flips
function yearFlip(g, lt, t, tFlip) {
  darkCard(g, '#14100C', '#050403'); rim(g, W / 2, 760, 900, '#FFE2B0', 0.18);
  const u = seg(t, tFlip, tFlip + 0.35, ease.inOut), cx = W / 2, cy = 820, w = 520, h = 600;
  const page = (yr, sc) => {
    g.save(); g.translate(cx, cy - h / 2); g.scale(1, sc);
    g.fillStyle = '#ECE3CC'; g.fillRect(-w / 2, 0, w, h); g.fillStyle = RED; g.fillRect(-w / 2, 0, w, 120);
    g.fillStyle = '#FFFFFF'; g.font = sans(54, 900); g.textAlign = 'center'; g.letterSpacing = '8px'; g.fillText('YEAR', 0, 82);
    g.fillStyle = '#2A2016'; g.font = serif(200, 700); g.letterSpacing = '0px'; g.fillText(yr, 0, 420); g.restore();
  };
  g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20; g.fillStyle = '#ECE3CC'; g.fillRect(cx - w / 2, cy - h / 2, w, h); g.restore();
  page('2020', 1);
  if (u < 1) page('2019', Math.cos(u * Math.PI / 2) * (u < 0.5 ? 1 : 1));
  g.fillStyle = '#2A2016'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.arc(cx + i * 60, cy - h / 2 - 6, 10, 0, 7); g.fill(); }
  qaRect(g, cx - w / 2, cy - h / 2, w, h, 'text', 'calendar');
}
// the entry list of the small tournament: the last line is a new name
function entryList(g, lt, t, tName) {
  darkCard(g, '#1C150E', '#060403'); rim(g, W / 2, 600, 900, '#FFE2B0', 0.2);
  g.save(); g.translate(W / 2, 760); g.rotate(0.03);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#F2EEE2'; g.fillRect(-340, -440, 680, 880); g.shadowColor = 'transparent';
  g.fillStyle = '#1E1A14'; g.font = sans(40, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('PLAYERS', 0, -360); g.fillRect(-280, -330, 560, 4);
  const r = rng(4);
  for (let i = 0; i < 10; i++) {  // names as handwriting squiggles: nobody real
    const y = -280 + i * 58; g.fillStyle = 'rgba(30,26,20,0.6)'; g.font = sans(26, 800); g.textAlign = 'left'; g.letterSpacing = '0px'; g.fillText(`${i + 1}.`, -280, y + 10);
    g.strokeStyle = 'rgba(30,26,20,0.55)'; g.lineWidth = 4; g.beginPath(); const len = 220 + r() * 200;
    for (let k = 0; k <= 30; k++) { const x = -230 + k / 30 * len, yy = y + Math.sin(k * 1.7 + i) * 6; k ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
  }
  const y = -280 + 10 * 58, typed = 'ISA KASIMI'.slice(0, Math.max(0, Math.floor((t - tName) / 0.05)));
  g.fillStyle = 'rgba(30,26,20,0.6)'; g.font = sans(26, 800); g.fillText('11.', -280, y + 10);
  if (t >= tName) {
    const k = seg(t, tName + 0.5, tName + 0.8);
    g.fillStyle = rgba(GOLD, 0.45 * k); g.fillRect(-240, y - 34, 380, 58);
    g.fillStyle = '#1E1A14'; g.font = sans(40, 900); g.letterSpacing = '3px'; g.fillText(typed, -226, y + 12);
  }
  g.restore();
  qaRect(g, W / 2 - 340, 320, 680, 880, 'text', 'entry list');
}
// a tiny tournament in Latvia: the country lit on the dotted map, a pin on Valka
function mapLatvia(g, lt, t) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  MAP.view({ lon: lerp(20, 24.5, ease.out(clamp(lt / 1.6))), lat: 56.5, zoom: lerp(26, 70, ease.out(clamp(lt / 1.6))), cy: H * 0.5 });
  MAP.draw(g, { spacing: 12, base: '#34506A', color: id => id === 428 ? GOLD : null });
  MAP.pin(g, 'Valka', { color: '#BFE0F4', a: seg(lt, 0.6, 0.75), pulse: lt > 0.75 ? ((lt - 0.75) / 0.8) % 1 : 0 });
}
// the room turns round: players at their boards look up at him, one after another
const ROOMF = [['gmA', 250, 980, 0.8, 0.0], ['amateur', 560, 1000, 0.82, 0.12], ['gmB', 850, 990, 0.8, 0.05], ['arbiter', 400, 760, 0.6, 0.2], ['gmB', 700, 770, 0.6, 0.3], ['amateur', 170, 740, 0.56, 0.4], ['gmA', 920, 750, 0.56, 0.25]];
function roomFaces(g, lt, t, tTurn) {
  darkCard(g, '#2A2016', '#0A0705'); rim(g, W / 2, 560, 900, '#FFD9A0', 0.25);
  [...ROOMF].sort((a, b) => a[2] - b[2]).forEach(([who, x, y, k, d], i) => {
    const u = ease.out(seg(t, tTurn + d, tTurn + d + 0.25));
    const e = { ...exprAt([[0, { ...EXPR.focus, look: [0, 1] }], [0.01, { ...EXPR.shock, sweat: 0 }]], u > 0.5 ? 1 : 0), turn: lerp(i % 2 ? 0.7 : -0.7, 0, u) };
    drawChar(g, who, { x, y, s: k, e, t: t + i });
    g.fillStyle = '#3A2614'; g.fillRect(x - 210 * k, y + 150 * k, 420 * k, 40 * k);  // their table edge
    if (u > 0.3) { g.save(); g.globalAlpha = clamp((u - 0.3) * 3); g.fillStyle = GOLD; g.font = sans(Math.round(110 * k), 900); g.textAlign = 'center'; g.fillText('!', x + 110 * k, y - 170 * k - 10 * Math.sin(t * 8 + i)); g.restore(); }
  });
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 1140, W, H - 1140);
}
// two badges, one face: 2019 and 2020
function twoNames(g, lt, t, tEq) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  const card = (x, name, yr, e) => {
    g.save(); g.fillStyle = '#ECE6D8'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.beginPath(); g.roundRect(x - 220, 420, 440, 640, 22); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = TEAL; g.fillRect(x - 220, 420, 440, 70); g.fillStyle = '#FFFFFF'; g.font = sans(30, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText(yr, x, 468);
    g.beginPath(); g.roundRect(x - 170, 520, 340, 380, 12); g.fillStyle = '#C9D3D6'; g.fill(); g.clip();
    drawChar(g, 'rausis', { x, y: 730, s: 0.95, e, t });
    g.restore();
    g.fillStyle = '#1E1A14'; g.font = sans(40, 900); g.letterSpacing = '3px'; g.textAlign = 'center'; g.fillText(name, x, 990);
  };
  card(285, 'IGORS RAUSIS', '2019', EXPR.neutral);
  card(795, 'ISA KASIMI', '2020', { ...EXPR.smug, curve: 0.3 });
  qaRect(g, 75, 950, 420, 60, 'text', 'IGORS RAUSIS'); qaRect(g, 585, 950, 420, 60, 'text', 'ISA KASIMI');
  if (t >= tEq) { const u = seg(t, tEq, tEq + 0.2, ease.back); g.save(); g.translate(W / 2, 740); g.scale(u, u); g.fillStyle = GOLD; g.beginPath(); g.arc(0, 0, 56, 0, 7); g.fill(); g.fillStyle = C.ink; g.font = sans(80, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('=', 0, 4); g.restore(); }
}
// a real photograph in 2.5D under a dark band carrying its title
const DROP = 330, lin = x => x;
function photoShot(g, lt, ph, { from, to, dur, dim = 0, drop = DROP }) {
  g.fillStyle = '#0B0E11'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, drop); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, drop - 20, 0, drop + 250); gr.addColorStop(0, '#0B0E11'); gr.addColorStop(1, 'rgba(11,14,17,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, drop + 250);
  if (dim > 0) { g.fillStyle = `rgba(0,0,0,${dim.toFixed(3)})`; g.fillRect(0, 0, W, H); }
}
function credit(g, a = 0.75, y = 314) { g.save(); g.globalAlpha *= a; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(CREDIT, W / 2, y); g.restore(); }
// the photo goes round the world: thumbnails landing on a dotted map
function worldPhotos(g, lt, t, t0) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  MAP.view({ lon: -12 + 6 * clamp(lt / 4), lat: 36, zoom: 4.6, cy: H * 0.46 });
  MAP.draw(g, { spacing: 11, base: '#34506A' });
  const spots = ['Strasbourg', 'London', 'New York', 'Paris', 'Moscow', 'Tokyo', 'Manila', 'Reykjavik'];
  spots.forEach((c, i) => {
    const ti = t0 + i * 0.16; if (t < ti) return;
    const [x, y] = MAP.proj(...CITY[c]), u = seg(t, ti, ti + 0.25, ease.back);
    g.save(); g.translate(x, y - 40 * u); g.scale(1.35 * u, 1.35 * u); g.rotate((i % 2 ? 1 : -1) * 0.06);
    g.fillStyle = '#F2EEE4'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 16; g.fillRect(-44, -54, 88, 108); g.shadowColor = 'transparent';
    g.fillStyle = '#76827C'; g.fillRect(-36, -46, 72, 80); g.fillStyle = '#ABA9A3'; g.beginPath(); g.arc(0, -16, 16, 0, 7); g.fill(); g.fillStyle = rgba(PHONE, 0.9); g.fillRect(-6, 4, 12, 18);
    g.restore();
  });
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);

  // ======================= HOOK: 58, and getting better; nobody could explain it... until the bathroom =======================
  const betT = w('hook', 'better'), chessT = w('hook', 'chess.');
  shot(0, (g, lt, t, sh) => portrait(g, lt, t, 'rausis', { ...EXPR.focus, brow: 0.25, browY: 3, look: [0, 0.6] }, { keys: [[0, FRONT(0.12, 7.4, 0.3)], [len(sh), FRONT(0.04, 6.4, 0.3)]] }),
    { noJump: true, hud: (g, lt, t) => {
      const r = Math.round(lerp(2500, 2686, ease.inOut(seg(t, 0.15, chessT + 0.1))));
      counter(g, String(r), 'RATING · AGE 58', { y: 330, size: 190, labelColor: TEAL });
      if (t >= betT) { g.save(); g.globalAlpha = seg(t, betT, betT + 0.15); g.fillStyle = C.lime; g.font = sans(70, 900); g.textAlign = 'center'; g.fillText('▲', W / 2 + 290, 270 - 10 * Math.sin(t * 6)); g.restore(); }
    } });
  boom(betT, 0.5);
  const nobT = s('bath'), untilT = w('bath', 'Until'), bathT = w('bath', 'bathroom.');
  shot(nobT - 0.06, (g, lt, t, sh) => puzzled(g, lt, t), { noJump: true });
  cue(nobT + 0.1, 'whoosh_soft', 0.18);
  shot(untilT - 0.06, (g, lt, t, sh) => corridor(g, lt, t, { z0: 1.0, z1: 1.18, dur: 2.6, glow: seg(t, bathT - 0.3, bathT + 0.2) }), { noJump: true });
  cue(untilT, 'footsteps', 0.25); cue(bathT, 'dun_dun', 0.5);

  // ======================= WHO: Igors Rausis, grandmaster since 1992 =======================
  const whoS = s('who');
  shot(whoS - 0.08, (g, lt, t, sh) => photoShot(g, lt, PH.rausis, { from: { x: 0.55, y: 0.45, zoom: 1.0, dolly: 0 }, to: { x: 0.56, y: 0.47, zoom: 1.1, dolly: 0.06 }, dur: 4.4, drop: 440 }),
    { noJump: true, hud: (g, lt, t) => { nameTitle(g, lt, 'Igors Rausis', 'GRANDMASTER · SINCE 1992', { y: 200, size: 66, t0: w('who', 'Igors') - (t - lt) }); credit(g, seg(lt, 0.4, 0.6) * 0.75); } });
  cue(whoS, 'camera', 0.2);

  // ======================= CLIMB: from 2500 to 2686 =======================
  const clS = s('climb'), fromT = w('climb', 'From'), r2686 = w('climb', '2686.');
  shot(clS - 0.06, (g, lt, t, sh) => ratingChart(g, lt, t, clS + 0.15, r2686, w('climb', '2500')), { info: true, hud: (g, lt, t) => heading(g, 'HIS RATING', 330, seg(lt, 0, 0.15)) });
  boom(r2686, 0.6);

  // ======================= TOP 100: the oldest =======================
  const topS = s('top'), oldT = w('top', 'oldest');
  shot(topS - 0.06, (g, lt, t, sh) => top100(g, lt, t, oldT), { info: true });

  // ======================= WHO HE WAS BEATING =======================
  const howS = s('how'), whoT = w('how', 'who');
  shot(howS - 0.06, (g, lt, t, sh) => versus(g, lt, t, whoT), { noJump: true, hud: (g, lt, t) => heading(g, 'HIS OPPONENTS', 300, seg(lt, 0, 0.15)) });
  cue(whoT, 'dun_dun', 0.3);
  const wkS = s('weak'), winT = w('weak', 'Win');
  shot(wkS - 0.06, (g, lt, t, sh) => wins(g, lt, t, winT - 0.5, 0.17), { info: true, hud: (g, lt, t) => heading(g, 'SMALL OPENS', 260, seg(lt, 0, 0.15)) });
  for (let i = 0; i < 9; i++) cue(winT - 0.5 + i * 0.17, 'stamp', 0.12);

  // ======================= FIDE WATCHED HIM FOR MONTHS =======================
  const waS = s('watch'), monT = w('watch', 'months.');
  shot(waS - 0.06, (g, lt, t, sh) => fairPlay(g, lt, t, monT - 0.15), { noJump: true });
  for (let i = 0; i < 5; i++) cue(monT - 0.15 + i * 0.12, 'page_flip', 0.12);
  cue(waS, 'clock_tick', 0.15);

  // ======================= STRASBOURG, JULY 2019: HE GETS UP AND WALKS TO THE BATHROOM =======================
  const stS = s('stras'), midT = w('stras', 'In'), upT = w('stras', 'gets'), walkT = w('stras', 'walks'), bath2 = w('stras', 'bathroom.');
  shot(stS - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, HIGH(-0.5, 15, 0.5)], [len(sh), HIGH(-0.3, 13, 0.52)]], {}),
    { noJump: true, hud: (g, lt, t) => placeStamp(g, lt, 'Strasbourg', '2019', { y: 200, t0: 0.1 }) });
  shot(midT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'rausis', exprAt([[0, { ...EXPR.focus, look: [0, 0.7] }], [upT - (t - lt), { ...EXPR.neutral, look: [0.9, 0], turn: 0.4 }]], lt),
    { keys: [[0, FRONT(-0.15, 6.8, 0.3)], [len(sh), FRONT(-0.05, 6.2, 0.3)]] }), { noJump: true });
  shot(walkT - 0.06, (g, lt, t, sh) => corridor(g, lt, t, { z0: 1.05, z1: 1.2, dur: 2, glow: 0.4 + 0.6 * seg(t, bath2, bath2 + 0.5) }), { noJump: true });
  cue(walkT, 'footsteps', 0.3); cue(bath2 + 0.15, 'door_slam', 0.22);

  // ======================= THE PHONE =======================
  const fdS = s('found'), findT = w('found', 'find'), phT = w('found', 'phone.');
  shot(fdS - 0.06, (g, lt, t, sh) => stall(g, lt, t, { find: findT, zoom: [1, 1.06], dur: 3 }),
    { noJump: true, hud: (g, lt, t) => { if (t >= phT) badge(g, 'PHONE FOUND', W / 2, 330, { color: RED, size: 56, ...pop(t, phT) }); } });
  cue(fdS, 'heartbeat', 0.3); cue(phT - 0.32, 'revswell', 0.9); cue(phT - 0.004, 'boom', 0.9); cue(phT - BOOM_HIT, 'boom_big', 0.45);

  // ======================= THE PHOTO THAT WENT ROUND THE WORLD =======================
  const poS = s('photo'), photoT = w('photo', 'photo'), worldT = w('photo', 'world:'), lidT = w('photo', 'toilet'), progT = w('photo', 'chess');
  shot(poS - 0.06, (g, lt, t, sh) => { darkCard(g, '#14100C', '#050403'); pressPhoto(g, lt, t, { flashT: photoT, s: lerp(0.86, 0.9, clamp(lt / 1.5)) }); },
    { noJump: true, hud: (g, lt, t) => heading(g, 'THE PHOTO', 230, seg(t, photoT, photoT + 0.15)) });
  cue(photoT, 'camera', 0.4);
  shot(worldT - 0.2, (g, lt, t, sh) => worldPhotos(g, lt, t, worldT - 0.1), { info: true });
  shot(lidT - 0.3, (g, lt, t, sh) => { darkCard(g, '#14100C', '#050403'); pressPhoto(g, lt, t, { s: lerp(1.0, 1.08, clamp(lt / 2)), y: 820 }); },
    { noJump: true, hud: (g, lt, t) => { if (t >= progT) badge(g, 'A CHESS PROGRAM', W / 2, 240, { color: TEAL, size: 50, ...pop(t, progT) }); } });
  for (let i = 0; i < 8; i++) cue(worldT - 0.1 + i * 0.16, 'paper', 0.08);

  // ======================= AN iPHONE 4. IN 2019. =======================
  const ipS = s('iphone'), fourT = w('iphone', '4.'), yrT = w('iphone', '2019.');
  shot(ipS - 0.06, (g, lt, t, sh) => oldPhone(g, lt, t, {}),
    { noJump: true, hud: (g, lt, t) => {
      if (t >= fourT) badge(g, 'IPHONE 4', W / 2, 250, { color: TEAL, size: 60, sub: 'RELEASED IN 2010', ...pop(t, fourT) });
      if (t >= yrT) badge(g, 'USED IN 2019', W / 2, 1300 - 90, { color: GOLD, size: 50, ...pop(t, yrT) });
    } });
  cue(fourT - 0.05, 'record_scratch', 0.35);

  // ======================= THE STATEMENT; "I SIMPLY LOST MY MIND YESTERDAY" =======================
  const sgS = s('sign'), signsT = w('sign', 'signs'), qT = w('sign', '"I');
  shot(sgS - 0.06, (g, lt, t, sh) => statement(g, lt, t, signsT), { info: true });
  cue(signsT, 'pen', 0.4);
  shot(qT - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, FRONT(0.1, 6.6, 0.26)], [len(sh), FRONT(0.04, 6.0, 0.26)]], { t });
    const E = room(g, B, CLUB, { t, blur: 3 }); const hp = B.project(4, 3.1, 9.4), hs = hp.s / 100 * 1.05;
    rim(g, hp.x, hp.y, hp.s * 3.4, E.light, 0.25);
    armsUp(g, hp.x, hp.y, hs, 1, CAST.rausis.suit);
    seated(g, B, 'rausis', { ...EXPR.sad, look: [0, 0.8] }, t, { z: 9.4, hands: false });
    handsOnHead(g, hp.x, hp.y, hs, t, 1);
    table(g, B, E); lowKey(g, { cy: H * 0.42, a: 0.3 });
  }, { noJump: true, hud: (g, lt, t) => heading(g, '“I SIMPLY LOST MY MIND”', 250, seg(lt, 0.05, 0.25), { size: 40, spacing: 3 }) });

  // ======================= BANNED FOR SIX YEARS; THE GM TITLE GOES =======================
  const bnS = s('ban'), bansT = w('ban', 'bans'), stripT = w('ban', 'strips');
  shot(bnS - 0.06, (g, lt, t, sh) => namePlate(g, lt, t, bansT, stripT + 0.1), { info: true });
  cue(bansT, 'gavel', 0.5); cue(bansT + 0.05, 'stamp', 0.4); cue(stripT + 0.45, 'thud', 0.3);

  // ======================= THE CRAZIEST PART CAME A YEAR LATER =======================
  const teS = s('tease'), yearT = w('tease', 'year');
  shot(teS - 0.06, (g, lt, t, sh) => yearFlip(g, lt, t, yearT - 0.1), { info: true });
  cue(yearT - 0.1, 'page_flip', 0.4);

  // ======================= LATVIA, 2020: A NEW NAME ON THE LIST =======================
  const lvS = s('latvia'), listT = T.w('latvia', 5).s, isaT = w('latvia', 'Isa');  // the second "A": "A new name on the list"
  shot(lvS - 0.06, (g, lt, t, sh) => mapLatvia(g, lt, t), { info: true, hud: (g, lt, t) => placeStamp(g, lt, 'Latvia', '2020', { y: 200, t0: 0.1 }) });
  shot(listT - 0.06, (g, lt, t, sh) => entryList(g, lt, t, isaT), { info: true });
  cue(isaT, 'typewriter', 0.3);

  // ======================= NEW NAME, SAME FACE; HALF THE ROOM KNEW HIM =======================
  const fcS = s('face'), sameT = w('face', 'Same'), halfT = w('face', 'Half');
  shot(fcS - 0.06, (g, lt, t, sh) => twoNames(g, lt, t, sameT), { info: true });
  cue(sameT, 'dun_dun', 0.35);
  shot(halfT - 0.06, (g, lt, t, sh) => roomFaces(g, lt, t, halfT + 0.05), { noJump: true });
  cue(halfT + 0.1, 'murmur', 0.35); cue(halfT + 0.2, 'gasp', 0.25);

  // ======================= "YOU CAN CHANGE YOUR NAME, BUT YOU CANNOT HIDE YOUR FACE" =======================
  const quS = s('quote'), saidT = w('quote', '"You');
  shot(quS - 0.06, (g, lt, t, sh) => corridor(g, lt, t, { z0: 1.12, z1: 1.0, dur: 1.4, glow: 0, shut: seg(lt, 0.3, 1.2) }), { noJump: true });
  cue(quS + 0.1, 'door_slam', 0.18);
  shot(saidT - 0.3, (g, lt, t, sh) => photoShot(g, lt, PH.rausis, { from: { x: 0.55, y: 0.45, zoom: 1.04, dolly: 0 }, to: { x: 0.56, y: 0.47, zoom: 1.14, dolly: 0.05 }, dur: 4, dim: 0.25, drop: 440 }),
    { noJump: true, hud: (g, lt, t) => {
      g.save(); g.globalAlpha = seg(lt, 0.15, 0.4); g.font = serif(46, 700); g.textAlign = 'center'; g.fillStyle = CREAM; g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 20;
      g.fillText('“You can change your name,', W / 2, 190); g.fillText('but you cannot hide your face.”', W / 2, 252); g.restore();
      qaRect(g, 100, 145, W - 200, 125, 'text', 'quote'); credit(g, seg(lt, 0.4, 0.6) * 0.75, 314);
    } });

  // ======================= CTA: how many years would you ban him? =======================
  const ctaT = s('cta') - 0.06, howT = w('cta', 'how'), comT = w('cta', 'Comment');
  shot(ctaT, (g, lt, t, sh) => corridor(g, lt, t, { z0: 1.0, z1: 1.08, dur: 3, glow: 1 }),
    { noJump: true, hud: (g, lt, t) => {
      badge(g, 'HOW MANY YEARS WOULD YOU BAN HIM?', W / 2, 230, { color: TEAL, size: 40, a: seg(t, howT, howT + 0.1), ...pop(t, howT) });
      badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, comT, comT + 0.1), ...pop(t, comT) });
      badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, comT + 0.6, comT + 0.7) });
    } });

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'intrigue' }, { t: s('climb') - 0.06, m: 'build' }, { t: s('how') - 0.06, m: 'clockwork' }, { t: s('watch') - 0.06, m: 'paranoia' },
    { t: s('stras') - 0.06, m: 'tension' }, { t: phT, m: 'slam' }, { t: s('iphone') - 0.06, m: 'hook' }, { t: s('sign') - 0.06, m: 'court' },
    { t: s('tease') - 0.06, m: 'void' }, { t: s('latvia') - 0.06, m: 'clockwork' }, { t: s('quote') - 0.06, m: 'finale' }, { t: ctaT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: bathT - 0.05, t1: whoS - 0.1, kind: 'lp', f: 700 },             // the hook lands on the bathroom: muffled
    { t0: phT - 0.32, t1: phT - 0.01, kind: 'mute' }, { t0: phT, t1: poS - 0.3, kind: 'boost', db: 6 },
    { t0: s('sign') - 0.06, t1: s('ban') - 0.1, kind: 'lp', f: 900 },
    { t0: ctaT, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
