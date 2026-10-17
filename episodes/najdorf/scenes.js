// Najdorf: forty-five boards blindfolded (São Paulo, January 1947). The 1939 Olympiad strands him in Buenos Aires; his
// family stays in Poland. He breaks the blindfold record twice (40 boards in 1943, 45 in 1947) hoping the papers reach
// Europe and someone from his family finds him. No one writes back: his wife Genia, daughter Lusia, parents and four
// siblings were murdered in the Holocaust. He starts again as Miguel, and the line he made famous, 5...a6, becomes the
// Najdorf. Sources: SOURCES.md. One turn (rule 38), calm rooms (rule 30), brilliant text (rule 33), the big-move
// effects of §8 for the Polish Immortal's pawn mate, a closing question answered with a number (rule 39).
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, sqXZ, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, placeStamp, sans, serif } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { box, room, table, ENV, FLOOR_Y, texTri } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { shatterImage, burst } from '../../engine/js/fx.js';
import { sprite, spriteBox } from '../../engine/js/pieces.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { DotMap, CITY } from '../../engine/js/map.js';
import { webcam } from '../../engine/js/witty.js';
import { HI, ledGlow, spread, flashTint, speedLines, ticks, pieceRing, moveTag, armsUp, handsOnHead, slideStreak } from '../../engine/js/hifx.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';  // whose channel the video is made for: the follow line names it (THE 64 FILES / HAPPYCHESS)

// ---------- cast: Najdorf at 29 (1939) and at 37 (1947), after the 1950 Anefo photos — a round face, dark hair combed
// straight back and receding at the temples; his opponent in the Polish Immortal is a generic player ----------
CAST.naj39 = { face: [0.95, 1.04, 0.88], hair: 'slick', hairline: -86, hairC: '#22180F', brow: '#1A120C', suit: '#3A3F4A', suitD: '#2A2E36', shirt: 'tie', tie: '#6A2A2A', ears: 1.04 };
CAST.naj39b = { ...CAST.naj39, blindfold: '#14141A' };
CAST.naj47 = { face: [0.99, 1.01, 0.93], hair: 'slick', hairline: -100, hairC: '#22180F', brow: '#1A120C', suit: '#3A3F4A', suitD: '#2A2E36', shirt: 'tie', tie: '#5A3A2A', ears: 1.04 };
CAST.naj47b = { ...CAST.naj47, blindfold: '#14141A' };
CAST.gluck = { face: [0.94, 1.06, 0.86], hair: 'parted', hairC: '#5A4634', brow: '#4A3A2A', suit: '#5A4E40', suitD: '#42382E', shirt: 'tie', tie: '#2A3A4A', mustache: '#4A3A2A', ears: 1.02 };

const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', TEAL = C.accent, CREAM = C.cream;
const PI = await fetch('../engine/data/polish_immortal.json').then(r => r.json());
const NS = await fetch('../engine/data/najdorf_sicilian.json').then(r => r.json());
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
const posOf = (G, k) => G[k].pieces.map(p => ({ ...p, ...xz(p.sq) }));
const lin = x => x;
const PH = { naj: await loadPhoto3d('../episodes/najdorf/photos/najdorf1950') };
const MAP = await new DotMap().init();
CITY['Warsaw'] = [21.0, 52.23]; CITY['Buenos Aires'] = [-58.38, -34.6]; CITY['São Paulo'] = [-46.63, -23.55];

// ---------- calm rooms (rule 30) ----------
const STUDY = { base: '#0A0806', wall: ['#3E3426', '#372E22'], seam: '#241C14', rail: '#5A4630', floor: ['#2A2018', '#241B14'], light: '#FFD9A0', lightA: 0.32, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const CAFE = { base: '#060A08', wall: ['#24382C', '#1F3126'], seam: '#14201A', rail: '#4A3A26', floor: ['#2A2018', '#241B14'], light: '#FFE2B0', lightA: 0.3, frames: true, sconces: true, table: ['#5A3E26', '#2E1E10', '#22160C'] };
const BACKROOM = { ...ENV.backroom, table: ['#3A2A1C', '#22180E', '#180F08'] };
const GALLERY = { base: '#0E0B08', wall: ['#5A4A38', '#4C3E2F'], seam: '#2E241A', rail: '#6A5236', floor: ['#2E2318', '#261D14'], light: '#FFE6B8', lightA: 0.3, windows: true };
const darkCard = (g, top, bottom) => { const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, top); bg.addColorStop(1, bottom); g.fillStyle = bg; g.fillRect(0, 0, W, H); };
const SLATEBG = ['#16202A', '#07090C'];
const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
function rim(g, x, y, r, col, a = 0.5) {
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}
// a heading in the brilliant type: letter-spaced heavy cream with a teal underline
function heading(g, text, y, a = 1, { size = 44, color = CREAM } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(size, 900); g.letterSpacing = '5px'; g.textAlign = 'center'; g.fillStyle = color;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowOffsetY = 5; g.fillText(text, W / 2, y); g.shadowColor = 'transparent';
  const tw = g.measureText(text).width; g.fillStyle = TEAL; g.fillRect(W / 2 - 40, y + 18, 80, 5);
  qaRect(g, W / 2 - tw / 2, y - size * 0.8, tw, size + 30, 'text', text); g.restore();
}

// ---------- the simul hall: three long rows of tables, fifteen boards each, an opponent at every board ----------
const WOOD = (() => {
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { g.fillStyle = (f + r) % 2 ? '#E2C89A' : '#8A5A34'; g.fillRect(f * 32, r * 32, 32, 32); }
  g.strokeStyle = '#3A2414'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 248); return c;
})();
const ROWS = [0.3, 4, 7.7], NB = 15, BZ = i => -3.6 + i * 1.12, BS = 0.9;
const LAYOUT = (() => {  // a mid-game on every board, a different one each time
  const out = [], r = rng(47);
  for (const xc of ROWS) for (let i = 0; i < NB; i++) {
    const pcs = [];
    for (let k = 0; k < 9; k++) pcs.push({ t: 'pnbrqk'[Math.floor(r() * 5.99)] || 'p', c: r() < 0.5 ? 'w' : 'b', f: Math.floor(r() * 8), rk: Math.floor(r() * 8) });
    out.push({ xc, z: BZ(i), pcs, tone: r() });
  }
  return out;
})();
function hallBoards(g, { players = true, lit = 1, glow = null } = {}) {
  const items = [...LAYOUT].sort((a, b) => B.toCam(b.xc, 0, b.z)[2] - B.toCam(a.xc, 0, a.z)[2]);
  for (const xc of [...ROWS].sort((a, b) => Math.abs(b - B.E[0]) - Math.abs(a - B.E[0])))  // the tables, the farthest row first
    box(g, B, [xc - 0.62, FLOOR_Y, BZ(0) - 0.7], [xc + 0.62, 0, BZ(NB - 1) + 0.7], { top: '#5A3E26', side: '#2A1A0E', front: '#3A2616' });
  for (const it of items) {
    const d = B.toCam(it.xc, 0, it.z)[2]; if (d < 0.8) continue;
    const fog = clamp(1 - (d - 8) / 26, 0.25, 1) * lit, h = BS / 2, y = 0.004;
    const P = ([x, z]) => B.project(it.xc + x, y, it.z + z);
    const tl = P([-h, h]), tr = P([h, h]), bl = P([-h, -h]), br = P([h, -h]);
    g.save(); g.globalAlpha *= fog; texTri(g, WOOD, 0, 0, 256, 256, tl, tr, bl, false); texTri(g, WOOD, 0, 0, 256, 256, br, bl, tr, true); g.restore();
    if (glow && glow(it) > 0) { g.save(); g.globalAlpha *= glow(it); g.fillStyle = 'rgba(184,240,74,0.35)'; g.beginPath(); [tl, tr, br, bl].forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.fill(); g.restore(); }
    for (const pc of it.pcs) {  // the pieces, small sprites
      const p = B.project(it.xc - h + (pc.f + 0.5) * BS / 8, 0.01, it.z - h + (pc.rk + 0.5) * BS / 8), hh = p.s * 0.2;
      if (p.z < 0.8 || hh < 2) continue;
      const bx = spriteBox(hh); g.save(); g.globalAlpha *= fog; g.drawImage(sprite(pc.t, pc.c), p.x - bx.w / 2, p.y + bx.top, bx.w, bx.h); g.restore();
    }
    if (players) {  // the opponent across the board: a dark bust, lit from the hall's windows
      const hp = B.project(it.xc + 1.05, 1.25, it.z), sp = B.project(it.xc + 1.05, 0.5, it.z);
      if (hp.z > 0.8) {
        const k = hp.s, col = mix('#2A221C', '#4A3C30', it.tone);
        g.save(); g.globalAlpha *= fog;
        g.fillStyle = col; g.beginPath(); g.ellipse(sp.x, sp.y, k * 0.42, k * 0.52, 0, Math.PI, 0); g.lineTo(sp.x + k * 0.42, sp.y + k * 0.3); g.lineTo(sp.x - k * 0.42, sp.y + k * 0.3); g.fill();
        g.fillStyle = mix(col, '#C8A27A', 0.35); g.beginPath(); g.arc(hp.x, hp.y, k * 0.22, 0, 7); g.fill();
        g.fillStyle = mix(col, '#000000', 0.2); g.beginPath(); g.arc(hp.x, hp.y - k * 0.06, k * 0.22, Math.PI * 1.05, Math.PI * 1.95); g.fill();
        g.restore();
      }
    }
  }
}
// the hall with Najdorf in front of it (the hook and 1943), or empty (1947: he sat in another room)
function hall(g, lt, t, keys, { who = null, e = 'focus', env = GALLERY, wx = 4, wz = -6.6, lit = 1, glow = null, k = 1.05, face = -1, low = 0.24 } = {}) {
  rig(B, lt, keys, { t });
  room(g, B, env, { t, blur: 2 });
  const desk = () => box(g, B, [wx - 2.6, FLOOR_Y, face < 0 ? wz - 1.3 : wz + 0.2], [wx + 2.6, 0.3, face < 0 ? wz - 0.2 : wz + 1.3], { top: '#4A3220', side: '#22160C', front: '#2E1E10' });  // his desk hides where the bust ends
  const him = () => {
    if (!who) return;
    const hp = B.project(wx, 3.1, wz); if (hp.z > 0.8) rim(g, hp.x, hp.y, hp.s * 3.2, '#FFD9A0', 0.35);
    actor(g, B, who, { x: wx, y: 3.1, z: wz, k, e, t, face }); desk();
  };
  if (face > 0) him();  // seen from behind the boards: he is the farthest thing in the hall
  hallBoards(g, { lit, glow });
  if (face < 0) him();
  lowKey(g, { cy: H * 0.44, a: low });
}
const HALLV = (yaw = 0, dist = 7.2, pitch = 0.12, ty = 3.0) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, ty, -6.6] });
const HALLR = (yaw = 0, dist = 17, pitch = 0.28, tz = -4) => ({ yaw: Math.PI + yaw, pitch, dist, fov: 1500, cy: H * 0.5, target: [4, 2.6, tz] });  // from behind the boards

// ---------- one game on the slate board: White at the near end of the table, Black at the far end ----------
function board(G, t, run, base) {
  let k = base;
  for (const m of run) {
    if (t >= m.t1) { k = m.k; continue; }
    if (t >= m.t0) {
      const knight = G[m.k].pieces.find(p => p.sq === G[m.k].to)?.t === 'n';
      return piecesAt(G, m.k, (t - m.t0) / (m.t1 - m.t0), { arc: knight ? 0.9 : 0.14, e: m.e || ease.inOut });
    }
    break;
  }
  return posOf(G, k);
}
const ff = (a, b, T0, dt, f = 0.7) => Array.from({ length: b - a + 1 }, (_, i) => ({ k: a + i, t0: T0 + i * dt, t1: T0 + i * dt + dt * f }));
function captured(g, G, k, t, land) {
  const dt = t - land; if (dt < 0 || dt > 0.9) return;
  const ids = new Set(G[k].pieces.map(p => p.id)), cap = G[k - 1].pieces.find(p => !ids.has(p.id)); if (!cap) return;
  const [x, z] = sqXZ(cap.sq), p0 = B.project(x, 0.02, z), mid = B.project(x, 0.6, z), sc = p0.s / 130, h = p0.s * 1.25, bx = spriteBox(h);
  shatterImage(g, sprite(cap.t, cap.c), p0.x - bx.w / 2, p0.y + bx.top, bx.w, bx.h, dt, { cols: 3, rows: 5, seed: k, power: 520 * sc, gravity: 2200 * sc, spin: 8, life: 0.85, oy: 0.55 });
  burst(g, mid.x, mid.y, t, land, { n: 14, color: cap.c === 'w' ? '#FFFFFF' : '#9FB0BA', speed: 900 * sc, size: 7 * sc, kind: 'dot', seed: k + 99 });
}
function label(G, k, t, land, color, { y = 1.8, dx = 0 } = {}) {
  if (t < land) return;
  const [x, z] = sqXZ(G[k].to), p = B.project(x, y, z), fs = Math.round(clamp(p.s * 0.42, 24, 54)), txt = `${Math.ceil(k / 2)}${k % 2 ? '.' : '...'}${G[k].san}`;
  g_measure.font = `800 ${fs}px "JetBrains Mono"`; const tw = g_measure.measureText(txt).width;
  moveTag(gCur, txt, clamp(p.x + dx, 80 + tw / 2, W - 80 - tw / 2), Math.min(p.y, 1200 - fs * 0.35), color, fs, clamp((t - land) / 0.12));
}
const g_measure = makeCanvas(8, 8).getContext('2d'); let gCur = null;
function game(g, lt, t, keys, pieces, { wWho = 'gluck', bWho = 'naj39', wE = 'focus', bE = 'focus', env = CAFE, under = null, over = null, dof = 1.3, e = ease.inOut, wHands = 0, slab = SLATE } = {}) {
  gCur = g;
  rig(B, lt, keys, { t, e });
  const E = room(g, B, env, { t, blur: 3 });
  bokeh(g, t, { n: 7, seed: 5, y0: 0.06, y1: 0.4, a: 0.16, size: [50, 110], colors: ['#FFD9A0', '#FFC27A'] });
  const off = (z, y) => { if (B.toCam(4, y, z)[2] < 3.5) return true; const p = B.project(4, y, z); return p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60; };
  const wp = wHands > 0 && !off(-1.4, 3.1) && B.E[2] > -1.4 ? B.project(4, 3.1, -1.4) : null, ws = wp ? wp.s / 100 * 1.05 : 0;
  if (wp) armsUp(g, wp.x, wp.y, ws, wHands, CAST[wWho].suit);
  const hb = seated(g, B, bWho, bE, t, { z: 9.4, alpha: B.E[2] < 9.4 && !off(9.4, 3.1) ? 1 : 0 });
  const hw = seated(g, B, wWho, wE, t, { z: -1.4, face: 1, alpha: B.E[2] > -1.4 && !off(-1.4, 3.1) ? 1 : 0 });
  if (wp) handsOnHead(g, wp.x, wp.y, ws, t, wHands);
  table(g, B, E); B.drawSlab(g, slab);
  if (under) under();
  B.drawPieces(g, pieces, { focus: B.dist, dof });
  hb(); hw();
  if (over) over();
  lowKey(g, { cy: H * 0.42, a: 0.3 });
}

// ---------- a portrait behind a board in a calm room ----------
const FRONT = (yaw = 0.1, dist = 7.4, pitch = 0.3) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.46, target: [4, 2.8, 9.2] });
function portrait(g, lt, t, who, e, { keys, env = STUDY, pieces = posOf(NS, 0), slab = SLATE, reach = null } = {}) {
  rig(B, lt, keys, { t });
  const E = room(g, B, env, { t, blur: 3 });
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 3.6, E.light, 0.22);
  const hands = seated(g, B, who, e, t, { z: 9.4, reach });
  table(g, B, E); B.drawSlab(g, slab);
  B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 });
  hands();
  lowKey(g, { cy: H * 0.4, a: 0.24 });
}

// ---------- 2D sets: the family photo, the newspapers, the mail rack, the clock, the score grid, the candles ----------
function warmRoom(g, t, { dim = 0, lampX = W * 0.78, lampY = 300 } = {}) {
  darkCard(g, '#1C130C', '#070504');
  rim(g, lampX, lampY, 900, '#FFC88A', 0.42 * (1 - dim * 0.75));
  const wall = g.createLinearGradient(0, 0, W, 0); wall.addColorStop(0, 'rgba(0,0,0,0.35)'); wall.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2A1A0E'; g.fillRect(0, 1180, W, 40); g.fillStyle = '#1A1008'; g.fillRect(0, 1220, W, H - 1220);  // the dresser top and front
  g.fillStyle = 'rgba(255,214,160,0.12)'; g.fillRect(0, 1180, W, 6);
}
// two sepia silhouettes in a gilt frame (no likeness: no photo of them is used)
function familyFrame(g, lt, t, { names = [0, 0], dim = 0, clip = 0, zoom = 1 } = {}) {
  g.save(); const z = zoom * (1 + 0.04 * clamp(lt / 3)); g.translate(W / 2, 760); g.scale(z, z); g.translate(-W / 2, -760);
  warmRoom(g, t, { dim });
  const fx = W / 2 - 230, fy = 470, fw = 460, fh = 600;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 20;
  const gf = g.createLinearGradient(fx, fy, fx + fw, fy + fh); gf.addColorStop(0, '#C9A05A'); gf.addColorStop(0.5, '#8A6A2E'); gf.addColorStop(1, '#C9A05A');
  g.fillStyle = gf; g.fillRect(fx - 26, fy - 26, fw + 52, fh + 52); g.restore();
  const sp = g.createRadialGradient(W / 2, fy + 220, 40, W / 2, fy + 300, 420); sp.addColorStop(0, '#D8B888'); sp.addColorStop(1, '#8A6A44');
  g.fillStyle = sp; g.fillRect(fx, fy, fw, fh);
  g.fillStyle = 'rgba(58,38,22,0.85)';  // the mother, and the daughter in front of her
  g.beginPath(); g.ellipse(W / 2 - 60, fy + 210, 70, 86, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(W / 2 - 60, fy + 140, 62, 34, 0, Math.PI, 0); g.fill();
  g.beginPath(); g.moveTo(W / 2 - 230, fy + fh); g.quadraticCurveTo(W / 2 - 200, fy + 300, W / 2 - 60, fy + 300); g.quadraticCurveTo(W / 2 + 60, fy + 300, W / 2 + 90, fy + 420); g.lineTo(W / 2 + 90, fy + fh); g.fill();
  g.fillStyle = 'rgba(46,30,16,0.9)';
  g.beginPath(); g.ellipse(W / 2 + 80, fy + 360, 50, 60, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(W / 2 - 20, fy + fh); g.quadraticCurveTo(W / 2 - 10, fy + 430, W / 2 + 80, fy + 430); g.quadraticCurveTo(W / 2 + 170, fy + 430, W / 2 + 180, fy + fh); g.fill();
  if (clip > 0) {  // a newspaper cutting leaning on the frame
    g.save(); g.globalAlpha *= clamp(clip); g.translate(W / 2 + 300, 1000); g.rotate(0.12);
    g.fillStyle = '#E8DFC8'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillRect(-120, -170, 240, 340); g.shadowColor = 'transparent';
    g.fillStyle = '#1E1A14'; g.font = sans(30, 900); g.textAlign = 'center'; g.fillText('NAJDORF', 0, -110); g.font = sans(22, 800); g.fillText('40 BOARDS', 0, -78); g.fillText('BLINDFOLD', 0, -52);
    g.fillStyle = 'rgba(30,26,20,0.35)'; for (let i = 0; i < 7; i++) g.fillRect(-96, -24 + i * 22, 192 - (i % 3) * 30, 8);
    g.restore();
  }
  if (dim > 0) { g.fillStyle = `rgba(0,0,0,${(0.55 * dim).toFixed(3)})`; g.fillRect(0, 0, W, H); }
  g.restore();
  g.save(); g.font = sans(34, 900); g.letterSpacing = '8px'; g.textAlign = 'center'; g.fillStyle = CREAM;
  if (names[0] > 0) { g.globalAlpha = names[0]; g.fillText('GENIA', W / 2 - 130, 1150); }
  if (names[1] > 0) { g.globalAlpha = names[1]; g.fillText('LUSIA', W / 2 + 130, 1150); }
  g.restore();
  if (names[0] > 0) qaRect(g, W / 2 - 260, 1110, 520, 56, 'text', 'family names');
}
// a newspaper sheet: masthead, a headline, the name, column lines
function newspaper(g, x, y, w, h, { mast = 'NEWS', head = '', sub = '', rot = 0, a = 1, scale = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(scale, scale);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18; g.fillStyle = '#ECE3CC'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowColor = 'transparent';
  g.fillStyle = '#1A1612'; g.textAlign = 'center';
  g.font = serif(Math.round(w * 0.09), 700); g.fillText(mast, 0, -h / 2 + w * 0.12);
  g.fillRect(-w / 2 + 24, -h / 2 + w * 0.15, w - 48, 4);
  let fs = Math.round(w * 0.13); g.font = sans(fs, 900); while (g.measureText(head).width > w - 50 && fs > 20) { fs -= 2; g.font = sans(fs, 900); }
  g.fillText(head, 0, -h / 2 + w * 0.15 + fs * 1.15);
  if (sub) { let ss = Math.round(w * 0.07); g.font = sans(ss, 800); while (g.measureText(sub).width > w - 50 && ss > 14) { ss -= 1; g.font = sans(ss, 800); } g.fillText(sub, 0, -h / 2 + w * 0.15 + fs * 1.15 + ss * 1.4); }
  g.fillStyle = 'rgba(26,22,18,0.3)';
  const top = -h / 2 + w * 0.48;
  for (let c = 0; c < 3; c++) for (let i = 0; i < Math.floor((h / 2 - top) / 20) - 1; i++) g.fillRect(-w / 2 + 24 + c * (w - 48) / 3, top + i * 20, (w - 48) / 3 - 16 - ((i * 7 + c) % 4) * 8, 7);
  g.restore();
}
// a hotel's mail rack: letters, and now and then a room key, in every slot but his
const MINE = [1, 2];  // his slot: column 1, row 2
function mailRack(g, lt, t, { dim = 0, z0 = 1, z1 = 1.16, dur = 3 } = {}) {
  darkCard(g, '#1A120B', '#070504');
  const cols = 4, rows = 5, cw = 200, ch = 168, gw = cols * cw, gh = rows * ch, x0 = W / 2 - gw / 2, y0 = 300;
  const fx = x0 + (MINE[0] + 0.5) * cw, fy = y0 + (MINE[1] + 0.5) * ch, z = lerp(z0, z1, ease.inOut(clamp(lt / dur)));
  g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
  rim(g, W / 2, 520, 1100, '#FFD9A0', 0.26 * (1 - dim * 0.6));
  g.save(); g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 60; g.shadowOffsetY = 24; g.fillStyle = '#5A3C24'; g.fillRect(x0 - 34, y0 - 64, gw + 68, gh + 98); g.restore();
  g.fillStyle = '#6E4A2C'; g.fillRect(x0 - 44, y0 - 64, gw + 88, 34); g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(x0 - 44, y0 - 64, gw + 88, 5);
  const r = rng(5);
  for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * cw, y = y0 + rr * ch, his = c === MINE[0] && rr === MINE[1];
    g.fillStyle = '#1E130B'; g.fillRect(x + 10, y + 8, cw - 20, ch - 44);  // the slot, deep in shadow at the top
    const sh = g.createLinearGradient(0, y + 8, 0, y + 54); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(x + 10, y + 8, cw - 20, 46);
    if (!his) {
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {  // envelopes leaning in the slot
        g.save(); g.translate(x + cw / 2 + (i - (n - 1) / 2) * 20, y + ch - 38); g.rotate((r() - 0.5) * 0.22);
        g.fillStyle = ['#EDE3CA', '#E2D3B0', '#F2EBDA'][i % 3]; g.fillRect(-60, -84, 120, 80);
        g.strokeStyle = 'rgba(90,70,45,0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-60, -84); g.lineTo(0, -48); g.lineTo(60, -84); g.stroke();
        if (r() < 0.7) { g.fillStyle = ['#B8402E', '#2E5A8A', '#3A7A4A'][Math.floor(r() * 3)]; g.fillRect(34, -78, 18, 20); }
        g.restore();
      }
      if (r() < 0.3) {  // a room key on a brass tag
        const kx = x + cw - 40, ky = y + 30; g.strokeStyle = '#C9A05A'; g.lineWidth = 4; g.beginPath(); g.arc(kx, ky, 8, 0, 7); g.stroke();
        g.fillStyle = '#B8955A'; g.beginPath(); g.ellipse(kx, ky + 34, 11, 24, 0, 0, 7); g.fill();
      }
    } else {  // his slot: empty, dust drifting in the light
      for (let i = 0; i < 14; i++) {
        const px = x + 20 + ((r() * (cw - 40) + Math.sin(t * 0.5 + i) * 10) % (cw - 40)), py = y + 16 + ((r() * 100 - t * 9 * (0.5 + r())) % 100 + 100) % 100;
        g.fillStyle = `rgba(255,228,190,${(0.35 * r()).toFixed(3)})`; g.beginPath(); g.arc(px, py, 1 + r() * 2, 0, 7); g.fill();
      }
    }
    g.fillStyle = his ? '#E8D4A0' : '#A8854A'; g.fillRect(x + cw / 2 - (his ? 76 : 30), y + ch - 31, his ? 152 : 60, 24);  // brass plates
    g.fillStyle = '#2A1C10'; g.font = sans(his ? 19 : 15, 900); g.letterSpacing = '2px'; g.textAlign = 'center';
    g.fillText(his ? 'NAJDORF' : String(101 + rr * 10 + c * 2), x + cw / 2, y + ch - 13);
  }
  g.restore();
  if (dim > 0) { g.fillStyle = `rgba(0,0,0,${(0.5 * dim).toFixed(3)})`; g.fillRect(0, 0, W, H); }
}
function wallClock(g, x, y, R, hours) {
  g.save(); g.translate(x, y);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.fillStyle = '#2A1E12'; g.beginPath(); g.arc(0, 0, R + 18, 0, 7); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#EDE4CE'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
  g.fillStyle = '#2A2016';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.rotate(a); g.fillRect(-3, -R + 10, 6, i % 3 ? 16 : 28); g.restore(); }
  const ha = (hours % 12) / 12 * Math.PI * 2, ma = (hours % 1) * Math.PI * 2;
  g.lineCap = 'round'; g.strokeStyle = '#1A140E';
  g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ha) * R * 0.52, -Math.cos(ha) * R * 0.52); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ma) * R * 0.8, -Math.cos(ma) * R * 0.8); g.stroke();
  g.fillStyle = '#1A140E'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill();
  g.restore();
}
// the blindfold room: Najdorf alone with a microphone, the moves relayed from the hall; a clock on the wall
function blindRoom(g, lt, t, keys, { hours = 0, e = 'focus' } = {}) {
  rig(B, lt, keys, { t });
  room(g, B, BACKROOM, { t, blur: 3 });
  const hp = B.project(4, 3.3, 9.4); rim(g, hp.x, hp.y, hp.s * 3.4, '#FFF1D6', 0.3);
  wallClock(g, hp.x + hp.s * 2.15, hp.y - hp.s * 2.1, hp.s * 0.85, hours);  // on the wall behind him
  seated(g, B, 'naj47b', e, t, { z: 9.4, hands: false });
  box(g, B, [0.6, FLOOR_Y, 6.6], [7.4, 0, 8.6], { top: '#3A2A1C', side: '#1A120A', front: '#22180E' });
  const mb = B.project(4.6, 0.02, 7.4), mt = B.project(4.6, 1.5, 7.6);  // a 1940s desk microphone
  if (mb.z > 0.8) {
    const k = mb.s;
    g.fillStyle = '#1E1E22'; g.beginPath(); g.ellipse(mb.x, mb.y, k * 0.42, k * 0.14, 0, 0, 7); g.fill();
    g.strokeStyle = '#3A3A40'; g.lineWidth = Math.max(3, k * 0.07); g.beginPath(); g.moveTo(mb.x, mb.y); g.lineTo(mt.x, mt.y); g.stroke();
    const gr = g.createRadialGradient(mt.x - k * 0.08, mt.y - k * 0.1, 2, mt.x, mt.y, k * 0.3); gr.addColorStop(0, '#C8CCD2'); gr.addColorStop(1, '#4A4E56');
    g.fillStyle = gr; g.beginPath(); g.ellipse(mt.x, mt.y, k * 0.26, k * 0.32, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(30,30,34,0.6)'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(mt.x - k * 0.2, mt.y + i * k * 0.1); g.lineTo(mt.x + k * 0.2, mt.y + i * k * 0.1); g.stroke(); }
  }
  lowKey(g, { cy: H * 0.42, a: 0.3 });
}
// 45 results: 39 wins, 4 draws, 2 losses (the order is ours: the record lists only the totals)
const RES = (() => { const a = Array(45).fill('1'), r = rng(1947); for (const v of ['½', '½', '½', '½', '0', '0']) { let i; do { i = Math.floor(r() * 45); } while (a[i] !== '1'); a[i] = v; } return a; })();
function scoreGrid(g, lt, t, t0) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  const n = clamp(Math.floor((t - t0) / 0.018), 0, 45), wins = RES.slice(0, n).filter(v => v === '1').length;
  counter(g, String(wins), n >= 45 ? 'WINS · 4 DRAWS · 2 LOSSES' : 'WINS', { y: 360, size: 170, labelColor: TEAL });
  const cols = 9, s = 96, gap = 12, x0 = W / 2 - (cols * s + (cols - 1) * gap) / 2, y0 = 560;
  for (let i = 0; i < 45; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (s + gap), y = y0 + r * (s + gap), on = i < n, v = RES[i];
    g.fillStyle = !on ? 'rgba(255,255,255,0.06)' : v === '1' ? C.lime : v === '½' ? '#8A949C' : RED;
    g.beginPath(); g.roundRect(x, y, s, s, 12); g.fill();
    if (on) { g.fillStyle = v === '1' ? C.ink : '#FFFFFF'; g.font = sans(46, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(v, x + s / 2, y + s / 2 + 2); g.textBaseline = 'alphabetic'; }
  }
  qaRect(g, x0, y0, cols * (s + gap), 5 * (s + gap), 'text', 'results grid');
}
// eight candles, one for each of them; the four names we know in one line below
const KIN = ['GENIA', 'LUSIA', 'GDALIK', 'RAISA'];
function candles(g, lt, t, lightAt) {
  darkCard(g, '#0C0A08', '#030202');
  const n = 8, sx = 118, x0 = W / 2 - (n - 1) * sx / 2, y = 1060, lit = lightAt.filter(v => t >= v).length;
  rim(g, W / 2, y - 220, 820, '#FFB25A', 0.05 + 0.05 * lit);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sx, hgt = 330 - (i % 3) * 28, on = t >= lightAt[i], u = seg(t, lightAt[i], lightAt[i] + 0.35);
    const body = g.createLinearGradient(x - 31, 0, x + 31, 0); body.addColorStop(0, '#B8A888'); body.addColorStop(0.5, '#F2E8D2'); body.addColorStop(1, '#A89878');
    g.fillStyle = body; g.beginPath(); g.roundRect(x - 31, y - hgt, 62, hgt, 7); g.fill();
    g.fillStyle = '#2A2016'; g.fillRect(x - 2.5, y - hgt - 20, 5, 22);
    if (on) {
      const fl = 1 + 0.08 * Math.sin(t * 13 + i * 2.1) + 0.05 * Math.sin(t * 29 + i), fh = 58 * fl * u, fx = x + Math.sin(t * 7 + i) * 2.5, fy = y - hgt;
      rim(g, fx, fy - 40, 170 * u, '#FFB25A', 0.55);
      const fg = g.createRadialGradient(fx, fy - 30, 2, fx, fy - 36, fh); fg.addColorStop(0, '#FFFBE8'); fg.addColorStop(0.5, '#FFD27A'); fg.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = fg; g.beginPath(); g.moveTo(fx, fy - 20 - fh * 1.6); g.quadraticCurveTo(fx + 20 * u, fy - 30, fx, fy - 13); g.quadraticCurveTo(fx - 20 * u, fy - 30, fx, fy - 20 - fh * 1.6); g.fill();
    }
  }
  g.fillStyle = '#1A1410'; g.fillRect(0, y, W, 16);
  // the names, each fading in with its candle, laid out once for the whole line so nothing shifts
  g.save(); g.font = sans(30, 900); g.letterSpacing = '6px'; g.textAlign = 'left';
  const sep = '   ·   ', ws = KIN.map(k => g.measureText(k).width), wsep = g.measureText(sep).width, tw = ws.reduce((a, b) => a + b, 0) + wsep * 3;
  let x = W / 2 - tw / 2;
  KIN.forEach((k, i) => {
    const a = seg(t, lightAt[i], lightAt[i] + 0.35) * 0.9;
    g.fillStyle = CREAM; g.globalAlpha = a; g.fillText(k, x, y + 92);
    if (i < 3) { g.globalAlpha = seg(t, lightAt[i + 1], lightAt[i + 1] + 0.35) * 0.5; g.fillText(sep, x + ws[i], y + 92); }
    x += ws[i] + wsep;
  });
  g.restore();
  if (lit) qaRect(g, W / 2 - tw / 2, y + 56, tw, 48, 'text', 'names');
}
// the grid of boards: the Najdorf on every board, a different White sixth move on each (6.Bg5 in the middle)
const SIX = [['c1', 'e3'], ['f1', 'e2'], ['f2', 'f3'], ['f1', 'c4'], ['c1', 'g5'], ['h2', 'h3'], ['g2', 'g3'], ['a2', 'a4'], ['f2', 'f4']];
function boardGrid(g, lt, t, t0) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  const cols = 3, s = 296, gap = 30, gw = cols * s + (cols - 1) * gap, cy = 740;
  const z = lerp(3.0, 1, ease.inOut(seg(t, t0 + 0.2, t0 + 1.9)));  // from the middle board out to all nine
  g.save(); g.translate(W / 2, cy); g.scale(z, z); g.translate(-gw / 2, -gw / 2);
  SIX.forEach(([from, to], i) => {
    const x = (i % cols) * (s + gap), y = Math.floor(i / cols) * (s + gap), q = s / 8;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 10; g.fillStyle = SLATE.dark; g.fillRect(x, y, s, s); g.restore();
    for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? SLATE.light : SLATE.dark; g.fillRect(x + f * q, y + (7 - k) * q, q + 0.5, q + 0.5); }
    g.fillStyle = rgba(GOLD, 0.6 + 0.25 * Math.sin(t * 4 + i)); g.fillRect(x, y + 2 * q, q, q);  // a6
    for (const p of NS[10].pieces) {
      const sq = p.sq === from ? to : p.sq, f = sq.charCodeAt(0) - 97, k = +sq[1] - 1, bx = spriteBox(q * 1.12);
      g.drawImage(sprite(p.t, p.c), x + (f + 0.5) * q - bx.w / 2, y + (8 - k) * q - q * 0.1 + bx.top, bx.w, bx.h);
    }
  });
  g.restore();
}
// a real photograph in 2.5D under a dark band carrying its title
const DROP = 330;
function photoShot(g, lt, ph, { from, to, dur }) {
  g.fillStyle = '#0B0E11'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, DROP); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, DROP - 20, 0, DROP + 250); gr.addColorStop(0, '#0B0E11'); gr.addColorStop(1, 'rgba(11,14,17,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, DROP + 250);
}
function photoTitle(g, lt, name, sub, credit, t0 = 0.05) {
  nameTitle(g, lt, name, sub, { y: 200, size: 66, t0 });
  g.save(); g.globalAlpha *= seg(lt, t0 + 0.2, t0 + 0.4) * 0.75; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = CREAM;
  g.fillText(credit, W / 2, 314); g.restore();
}
// a sepia film leader with the year landing on the beat
const GRAIN = (() => { const c = makeCanvas(540, 960), g = c.getContext('2d'), d = g.createImageData(540, 960), r = rng(91); for (let i = 0; i < d.data.length; i += 4) { const v = 120 + r() * 135; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();
function filmYear(g, lt, t, year, hitT) {
  const fr = Math.floor(t * 30), r = rng(fr * 13 + 7), fl = 0.9 + 0.1 * r();
  const bg = g.createRadialGradient(W / 2, H * 0.46, 60, W / 2, H * 0.46, H * 0.78);
  bg.addColorStop(0, `rgb(${Math.round(218 * fl)},${Math.round(180 * fl)},${Math.round(124 * fl)})`); bg.addColorStop(1, '#2A1A0C');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = 880;
  g.save(); g.strokeStyle = 'rgba(46,28,10,0.6)'; g.lineWidth = 7;
  for (const R of [360, 300]) { g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); }
  g.beginPath(); g.moveTo(0, cy); g.lineTo(W, cy); g.moveTo(cx, cy - 560); g.lineTo(cx, cy + 560); g.stroke();
  const sw = (((t - hitT) % 0.8 + 0.8) % 0.8) / 0.8 * Math.PI * 2;
  g.fillStyle = 'rgba(46,28,10,0.2)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 360, -Math.PI / 2, -Math.PI / 2 + sw); g.closePath(); g.fill();
  g.restore();
  if (t > hitT - 0.12) {
    const u = seg(t, hitT - 0.12, hitT, lin), k = lerp(2.2, 1, ease.in(u));
    g.save(); g.translate(cx, cy); g.scale(k, k); g.globalAlpha = clamp(u * 2.5);
    g.font = serif(250, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(38,22,6,0.92)'; g.fillText(year, 0, 12);
    g.restore();
    if (t >= hitT) qaRect(g, cx - 330, cy - 120, 660, 240, 'text', year);
  }
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5; g.drawImage(GRAIN, -(fr % 7) * 30, -(fr % 5) * 40, W + 240, H + 240); g.restore();
  g.save(); g.strokeStyle = 'rgba(255,248,230,0.45)'; g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const x = r() * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 24, H); g.stroke(); }
  g.restore();
}
// the voyage and the hope: dotted maps over the Atlantic, a liner (1939) or a newspaper (the hope) riding the route
function shipIcon(g, x, y, k = 1) {  // a small ocean liner sailing left
  g.save(); g.translate(x, y); g.scale(-k, k);
  g.fillStyle = '#16161A'; g.beginPath(); g.moveTo(-34, 0); g.lineTo(40, 0); g.lineTo(30, 13); g.lineTo(-28, 13); g.closePath(); g.fill();
  g.fillStyle = '#B8402E'; g.fillRect(-28, 10, 58, 3);
  g.fillStyle = '#F2EBDA'; g.fillRect(-22, -10, 44, 10); g.fillRect(-14, -17, 26, 7);
  g.fillStyle = '#E0A040'; g.fillRect(-8, -29, 8, 13); g.fillRect(6, -27, 8, 11);
  g.restore();
}
function paperIcon(g, x, y, k = 1) {
  g.save(); g.translate(x, y); g.scale(k, k); g.rotate(-0.14);
  g.fillStyle = '#ECE3CC'; g.fillRect(-28, -20, 56, 40);
  g.fillStyle = '#1A1612'; g.fillRect(-22, -14, 44, 7);
  g.fillStyle = 'rgba(26,22,18,0.45)'; for (let i = 0; i < 3; i++) g.fillRect(-22, -2 + i * 7, 44 - (i % 2) * 12, 3);
  g.restore();
}
function mapVoyage(g, lt, t, t0, t1, { from = 'Warsaw', to = 'Buenos Aires', icon = 'ship' } = {}) {
  darkCard(g, SLATEBG[0], SLATEBG[1]);
  MAP.view({ lon: -19 + 2 * clamp(lt / 3), lat: 9, zoom: 8.2, cy: H * 0.4 });
  MAP.draw(g, { spacing: 13, base: '#34506A', color: id => id === 616 ? GOLD : id === 32 ? '#7AC0E8' : null });
  const go = from === 'Warsaw', u = seg(t, t0 + 0.1, t1, ease.inOut);
  MAP.pin(g, from, { color: go ? GOLD : '#BFE0F4', a: seg(t, t0, t0 + 0.1) });
  const head = MAP.route(g, from, to, u, { color: go ? '#BFE0F4' : GOLD, bend: 0.22 });
  MAP.pin(g, to, { color: go ? '#BFE0F4' : GOLD, a: seg(t, t1, t1 + 0.1), pulse: t > t1 ? ((t - t1) / 0.7) % 1 : 0 });
  if (u > (go ? 0.14 : 0.02) && u < 1) (icon === 'ship' ? shipIcon : paperIcon)(g, head[0], head[1] - 30, 1.5);  // the liner from the coast on
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const boom = (t, g = 0.85) => cue(t - BOOM_HIT, 'boom_move', g);

  // ======================= HOOK: forty-five games at once, blindfolded — and the record wasn't the point =======================
  const fortyT = w('hook', 'forty-five'), blindT = w('hook', 'Blindfolded.'), andT = w('hook', 'And'), recT = w('hook', 'record'), wasT = w('hook', "wasn't");
  shot(0, (g, lt, t, sh) => hall(g, lt, t, [[0, HALLR(0.04, 17, 0.34)], [len(sh), HALLR(0.01, 14.5, 0.32)]], { who: 'naj47b', e: 'focus', face: 1 }),
    { noJump: true, hud: (g, lt, t) => counter(g, '45', 'GAMES AT ONCE', { y: 330, size: 190, labelColor: TEAL, a: 1 }) });
  boom(fortyT, 0.55);
  shot(blindT - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, HALLV(-0.3, 8.4, 0.1, 2.2)], [len(sh), HALLV(-0.26, 7.8, 0.1, 2.2)]], { who: 'naj47b', e: { ...EXPR.focus, turn: 0.2 } }),
    { noJump: true, hud: (g, lt, t) => badge(g, 'BLINDFOLDED', W / 2, 330, { color: RED, size: 54, scale: pop(t, blindT) }) });
  cue(blindT, 'whoosh_soft', 0.2);
  shot(andT - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, { yaw: 0.5, pitch: 0.62, dist: 15, fov: 1500, cy: H * 0.5, target: [4, 0, 4] }], [len(sh), { yaw: 0.36, pitch: 0.66, dist: 13.4, fov: 1500, cy: H * 0.5, target: [4, 0, 4] }]], {}),
    { noJump: true, hud: (g, lt, t) => {
      if (t < recT) return;
      badge(g, 'WORLD RECORD', W / 2, 360, { color: GOLD, size: 60, scale: pop(t, recT) });
      const u = seg(t, wasT, wasT + 0.18); if (u <= 0) return;  // ...wasn't the point: struck out
      g.save(); g.strokeStyle = RED; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - 250, 380); g.lineTo(W / 2 - 250 + 500 * u, 340); g.stroke(); g.restore();
    } });
  cue(recT, 'stamp', 0.35);

  // ======================= WARSAW: the rising star =======================
  const warT = w('star', 'Warsaw.');
  shot(s('star') - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'naj39', { ...EXPR.smug, curve: 0.5 }, { env: CAFE, pieces: posOf(PI, 16), keys: [[0, FRONT(-0.3, 7.6, 0.3)], [len(sh), FRONT(-0.12, 6.6, 0.3)]] }),
    { hud: (g, lt, t) => nameTitle(g, lt, 'Najdorf', 'WARSAW · THE RISING STAR', { y: 200, size: 72, t0: warT - (t - lt) + 0.3 }) });

  // ======================= THE POLISH IMMORTAL: both bishops, both knights, mate with a pawn =======================
  const immT = s('imm'), bishT = w('imm', 'bishops,'), kniT = w('imm', 'knights,'), pawnT = w('imm', 'pawn.');
  const BIG = { k: 44, t1: pawnT }; BIG.t0 = BIG.t1 - 0.3; BIG.e = ease.in;
  const RUN = [...ff(25, 43, immT + 0.45, (BIG.t0 - 0.12 - immT - 0.45) / 19), BIG];
  const CAP = [27, 33, 41, 43];
  shot(immT - 0.08, (g, lt, t, sh) => {
    const P = board(PI, t, RUN, 24), hl = BIG.t1 - sh.a;
    const A = { yaw: Math.PI + 0.3, pitch: 0.68, dist: 11.4, fov: 1500, cy: H * 0.58, target: [5.6, 0.6, 3.2] }, D = { ...A, yaw: Math.PI + 0.22, pitch: 0.7, dist: 10.6, cy: H * 0.56, target: [5.9, 0.6, 3.4] };
    game(g, lt, t, [[0, A], [hl - 0.06, { ...A, yaw: Math.PI + 0.22 }], [hl + 0.05, D, ease.whip], [hl + 0.6, { ...D, dist: 9.9 }, ease.out], [Math.max(len(sh), hl + 0.7), { ...D, dist: 10.1 }]], P, {
      wE: exprAt([[0, 'focus'], [BIG.t1 + 0.1 - (t - lt), { ...EXPR.shock, sweat: 1 }]], lt), wHands: seg(t, BIG.t1 + 0.15, BIG.t1 + 0.3), dof: 1.1,
      under: () => {
        if (t >= BIG.t0 && t < BIG.t1 + 0.3) slideStreak(g, B, 'h7', P.find(q => q.id === PI[44].pieces.find(z => z.sq === 'h5').id), 1 - seg(t, BIG.t1, BIG.t1 + 0.3));
        ledGlow(g, B, 'h5', HI.good, t, BIG.t1, { reach: 8, speed: 18 });
        if (t >= BIG.t1) B.highlight(g, 'h5', HI.good, 0.9, true);
        spread(g, B, 'h5', t, BIG.t1, HI.good, { life: 1.6, r1: 7 });
      },
      over: () => {
        for (const k of CAP) { const m = RUN.find(r => r.k === k); if (m) captured(g, PI, k, t, m.t1); }
        if (t >= BIG.t1) { B.laser(g, 'h5', 'g4', HI.bad, 1, 0.6, ease.out(seg(t, BIG.t1, BIG.t1 + 0.25))); pieceRing(g, B, 'g4', HI.bad, 1, seg(t, BIG.t1 + 0.1, BIG.t1 + 0.4)); }
        ticks(g, B, 'h5', t, BIG.t1, { seed: 7, n: 14 }); label(PI, 44, t, BIG.t1, HI.good);
      },
    });
  }, { noJump: true, roll: lt => 0.04 * Math.sin(Math.min(1, lt / 2) * 1.2), hud: (g, lt, t) => {
      heading(g, 'THE POLISH IMMORTAL', 200, seg(lt, 0.1, 0.3), { size: 40 });
      // the tally: both bishops and both knights given up, then the pawn that mates
      const icons = [['b', bishT], ['b', bishT + 0.12], ['n', kniT], ['n', kniT + 0.12], ['p', BIG.t1]], x0 = W / 2 - 2 * 108 - 40;
      icons.forEach(([tp, tt], i) => {
        const x = x0 + i * 108, y = 330, on = t >= tt, bx = spriteBox(92);
        g.save(); g.globalAlpha *= seg(lt, 0.2, 0.4) * (i === 4 && !on ? 0.35 : 1);
        if (i === 4 && on) { g.shadowColor = HI.good; g.shadowBlur = 30; }
        g.drawImage(sprite(tp, 'b'), x - bx.w / 2, y - 46 + bx.top + 92, bx.w, bx.h); g.restore();
        if (i < 4 && on) { const u = seg(t, tt, tt + 0.12); g.save(); g.strokeStyle = RED; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 34, 300); g.lineTo(x - 34 + 68 * u, 300 + 68 * u); g.stroke(); g.restore(); }
      });
      qaRect(g, x0 - 54, 250, 4 * 108 + 108, 130, 'text', 'tally');
    },
    post: (g, lt, t) => { if (t >= BIG.t1) { flashTint(g, HI.good, 1 - seg(t, BIG.t1, BIG.t1 + 0.45)); const [x, z] = sqXZ('h5'), p = B.project(x, 0.7, z); speedLines(g, p.x, p.y, t, BIG.t1, { life: 0.7, seed: 23 }); } } });
  RUN.slice(0, -1).forEach((m, i) => { if (CAP.includes(m.k)) cue(m.t1, 'glass', 0.14); else if (i % 3 === 0) cue(m.t1, 'piece', 0.14); });
  cue(BIG.t1 - 0.32, 'revswell', 1.0); cue(BIG.t0, 'piece_slide', 0.3); cue(BIG.t1 - 0.004, 'boom', 1.0); cue(BIG.t1, 'hit_punch', 0.6); cue(BIG.t1, 'airwash', 0.55); cue(BIG.t1 - BOOM_HIT, 'boom_big', 0.45);

  // ======================= 1939: to Buenos Aires; Genia and Lusia at home =======================
  const sailT = s('sail'), olyT = w('sail', 'Olympiad.'), atT = w('sail', 'At'), genT = w('sail', 'Genia'), lusT = w('sail', 'Lusia');
  shot(sailT - 0.08, (g, lt, t, sh) => mapVoyage(g, lt, t, sailT + 0.2, olyT, {}),
    { info: true, hud: (g, lt, t) => placeStamp(g, lt, 'Buenos Aires', '1939', { y: 200, t0: olyT - (t - lt) }) });
  cue(sailT + 0.2, 'whoosh_soft', 0.18);
  shot(atT - 0.06, (g, lt, t, sh) => familyFrame(g, lt, t, { names: [seg(t, genT, genT + 0.2), seg(t, lusT, lusT + 0.2)] }), { noJump: true });

  // ======================= SEPTEMBER 1: GERMANY INVADES POLAND =======================
  const warS = s('war'), invT = w('war', 'invades');
  shot(warS - 0.06, (g, lt, t, sh) => {
    darkCard(g, '#1A1612', '#070605'); rim(g, W / 2, 700, 900, '#FFE2B0', 0.18);
    const u = seg(lt, 0, 0.22, ease.out), k = lerp(1.9, 1, u), sk = t > invT ? Math.sin(t * 90) * 6 * (1 - seg(t, invT, invT + 0.4)) : 0;
    newspaper(g, W / 2 + sk, 720, 760, 980, { mast: 'LATE EDITION', head: 'WAR IN EUROPE', sub: 'GERMANY INVADES POLAND · SEPTEMBER 1, 1939', rot: -0.04, a: clamp(u * 3), scale: k });
  }, { noJump: true });
  cue(warS + 0.04, 'page_flip', 0.35); cue(invT - BOOM_HIT, 'boom_big', 0.5);

  // ======================= HE STAYS; NO LETTERS, NO NEWS =======================
  const stayS = s('stay'), noT = w('stay', 'No');
  shot(stayS - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'naj39', { ...EXPR.worried, look: [0.3, 0.7] }, { env: BACKROOM, pieces: [], keys: [[0, FRONT(0.34, 7.0, 0.22)], [len(sh), FRONT(0.24, 6.3, 0.22)]] }), { noJump: true });
  shot(noT - 0.06, (g, lt, t, sh) => mailRack(g, lt, t, { dur: 1.8 }), { noJump: true });

  // ======================= SO HE TRIES THE ONE THING HE HAS: CHESS =======================
  const tryS = s('try'), chessT = w('try', 'Chess.');
  shot(tryS - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'naj39', exprAt([[0, { ...EXPR.worried, look: [0, 0.8] }], [chessT - (t - lt), { ...EXPR.focus, look: [0, 1] }]], lt),
    { env: BACKROOM, pieces: t >= chessT ? [{ id: 'K', t: 'k', c: 'w', sq: 'e4', ...xz('e4') }] : [], reach: { sq: 'e4', u: seg(t, chessT - 0.4, chessT + 0.2) },
      keys: [[0, FRONT(-0.2, 6.6, 0.42)], [len(sh), FRONT(-0.1, 5.8, 0.46)]] }), { noJump: true });
  cue(chessT, 'piece', 0.45);

  // ======================= 1943: FORTY BOARDS, A WORLD RECORD =======================
  const r40S = s('r40'), y43T = w('r40', '1943.'), f40T = w('r40', 'Forty'), wr40T = w('r40', 'record.');
  shot(r40S - 0.06, (g, lt, t, sh) => filmYear(g, lt, t, '1943', y43T + 0.05), { noJump: true });
  boom(y43T + 0.05, 0.5);
  shot(f40T - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, HALLV(0.4, 9.4, 0.2, 2.8)], [len(sh), HALLV(0.3, 8.4, 0.2, 2.8)]], { who: 'naj39b', env: CAFE, lit: 0.9 }),
    { noJump: true, hud: (g, lt, t) => { counter(g, '40', 'BOARDS AT ONCE · BLINDFOLDED', { y: 330, size: 170, labelColor: TEAL }); if (t >= wr40T) badge(g, 'WORLD RECORD', W / 2, 520, { color: GOLD, size: 52, scale: pop(t, wr40T) }); } });
  boom(f40T, 0.5); cue(wr40T, 'shimmer', 0.25);

  // ======================= MAYBE THE PAPERS WILL REACH EUROPE... NOTHING =======================
  const hopeS = s('hope'), may2 = T.w('hope', 6).s, eurT = w('hope', 'Europe.'), nothT = w('hope', 'Nothing.');
  shot(hopeS - 0.06, (g, lt, t, sh) => mapVoyage(g, lt, t, hopeS + 0.1, eurT, { from: 'Buenos Aires', to: 'Warsaw', icon: 'paper' }), { info: true });
  cue(hopeS + 0.1, 'whoosh_soft', 0.18);
  shot(may2 - 0.06, (g, lt, t, sh) => familyFrame(g, lt, t, { names: [1, 1], clip: seg(lt, 0.1, 0.4), zoom: 1.06 }), { noJump: true });
  shot(nothT - 0.06, (g, lt, t, sh) => familyFrame(g, lt, t, { names: [1, 1], clip: 1, dim: seg(lt, 0, 0.8), zoom: 1.12 }), { noJump: true });

  // ======================= 1947, SÃO PAULO: FORTY-FIVE BOARDS, 23 HOURS, 39 WINS =======================
  const r45S = s('r45'), f45T = w('r45', 'Forty-five'), h23T = w('r45', 'Twenty-three'), heT = w('r45', 'He'), newsT = w('r45', 'Newspapers');
  shot(r45S - 0.06, (g, lt, t, sh) => hall(g, lt, t, [[0, { yaw: -0.5, pitch: 0.36, dist: 12, fov: 1500, cy: H * 0.5, target: [4, 0.6, 4] }], [len(sh), { yaw: -0.2, pitch: 0.4, dist: 10.2, fov: 1500, cy: H * 0.5, target: [4, 0.6, 4] }]], {}),
    { noJump: true, hud: (g, lt, t) => { placeStamp(g, lt, 'São Paulo', '1947', { y: 200, t0: 0.1 }); if (t >= f45T) counter(g, '45', 'BOARDS', { y: 400, size: 170, labelColor: TEAL, a: seg(t, f45T, f45T + 0.08) }); } });
  boom(f45T, 0.55);
  shot(h23T - 0.06, (g, lt, t, sh) => blindRoom(g, lt, t, [[0, FRONT(0.3, 7.6, 0.24)], [len(sh), FRONT(0.2, 6.8, 0.24)]], { hours: 9 + 23 * seg(t, h23T, heT - 0.1, lin), e: { ...EXPR.focus, sweat: 1 } }),
    { noJump: true, hud: (g, lt, t) => counter(g, String(Math.max(1, Math.round(23 * seg(t, h23T, heT - 0.15, lin)))), 'HOURS', { y: 330, size: 170, labelColor: TEAL }) });
  for (let i = 0; i < 6; i++) cue(h23T + i * 0.2, 'clock_tick', 0.12);
  shot(heT - 0.06, (g, lt, t, sh) => scoreGrid(g, lt, t, heT), { info: true });
  cue(w('r45', 'thirty-nine.'), 'shimmer', 0.3);
  const PAPERS = [['NOTÍCIAS', 'RECORDE MUNDIAL', 'NAJDORF: 45 PARTIDAS ÀS CEGAS', -0.1, -175, 640], ['NOTICIAS', 'RÉCORD MUNDIAL', 'NAJDORF: 45 PARTIDAS A CIEGAS', 0.08, 210, 700],
    ['NOUVELLES', 'RECORD DU MONDE', "NAJDORF : 45 PARTIES À L'AVEUGLE", 0.05, -130, 900], ['WORLD NEWS', 'WORLD RECORD', 'NAJDORF PLAYS 45 BLINDFOLD', -0.03, 60, 840]];
  shot(newsT - 0.06, (g, lt, t, sh) => {
    darkCard(g, '#1A1612', '#070605'); rim(g, W / 2, 760, 900, '#FFE2B0', 0.16 * (1 - seg(t, s('wrote') - 0.6, s('wrote'))));
    PAPERS.forEach(([mast, head, sub, rot, dx, y], i) => {
      const t0 = newsT + i * 0.32, u = seg(t, t0, t0 + 0.3, ease.out);
      newspaper(g, W / 2 + dx * (0.6 + 0.4 * u) + (i % 2 ? 1 : -1) * (1 - u) * 900, y, 560, 720, { mast, head, sub, rot: rot * u, a: clamp(u * 4) });
    });
  }, { noJump: true });
  PAPERS.forEach((_, i) => cue(newsT + i * 0.32 + 0.05, 'page_flip', 0.22));

  // ======================= NO ONE EVER WROTE BACK — the turn =======================
  const wroteS = s('wrote');
  shot(wroteS - 0.45, (g, lt, t, sh) => mailRack(g, lt, t, { dim: 0.45, z0: 1.18, z1: 1.5, dur: 2.6 }), { noJump: true });

  // ======================= HIS WIFE, HIS DAUGHTER, HIS PARENTS, HIS FOUR SIBLINGS =======================
  const truS = s('truth'), wifeT = w('truth', 'wife,'), dauT = w('truth', 'daughter,'), parT = w('truth', 'parents,'), sibT = w('truth', 'siblings.');
  shot(truS - 0.1, (g, lt, t, sh) => { const z = 1 + 0.05 * clamp(lt / 5); g.save(); g.translate(W / 2, 800); g.scale(z, z); g.translate(-W / 2, -800); candles(g, lt, t, [wifeT, dauT, parT, parT + 0.15, sibT - 0.2, sibT - 0.05, sibT + 0.1, sibT + 0.25]); g.restore(); }, { noJump: true, vig: 0.7 });

  // ======================= HE STAYS, BECOMES MIGUEL, STARTS AGAIN =======================
  const agS = s('again'), migT = w('again', 'Miguel.'), lineT = w('again', 'And'), najT = w('again', 'Najdorf:'), weapT = w('again', 'weapon');
  shot(agS - 0.08, (g, lt, t, sh) => photoShot(g, lt, PH.naj, { from: { x: 0.62, y: 0.32, zoom: 1.32, dolly: 0 }, to: { x: 0.6, y: 0.32, zoom: 1.45, dolly: 0.06 }, dur: 3.4 }),
    { noJump: true, hud: (g, lt, t) => { if (t >= migT - 0.1) photoTitle(g, lt, 'Miguel Najdorf', 'AMSTERDAM · 1950', 'Photo: Carel L. de Vogel / Anefo (CC0)', migT - 0.1 - (t - lt)); } });
  cue(agS, 'camera', 0.2);
  const NRUN = [...ff(1, 9, lineT + 0.1, (najT - 0.45 - lineT - 0.1) / 9, 0.75), { k: 10, t0: najT - 0.3, t1: najT, e: ease.in }];
  shot(lineT - 0.06, (g, lt, t, sh) => {
    const P = board(NS, t, NRUN, 0), A = { yaw: 0.3, pitch: 0.8, dist: 11.4, fov: 1500, cy: H * 0.62, target: [3.6, 0.4, 5.0] };
    game(g, lt, t, [[0, A], [len(sh), { ...A, yaw: 0.2, dist: 10.4 }]], P, { wWho: 'gluck', bWho: 'naj47', env: STUDY, dof: 1.2,
      under: () => { ledGlow(g, B, 'a6', GOLD, t, najT, { reach: 3, speed: 14 }); if (t >= najT) B.highlight(g, 'a6', GOLD, 0.85, true); spread(g, B, 'a6', t, najT, GOLD); },
      over: () => { ticks(g, B, 'a6', t, najT, { seed: 3 }); label(NS, 10, t, najT, GOLD); } });
  }, { noJump: true, hud: (g, lt, t) => { if (t >= najT) badge(g, 'THE NAJDORF', W / 2, 260, { color: TEAL, size: 56, scale: pop(t, najT) }); } });
  NRUN.slice(0, -1).forEach((m, i) => { if (i % 2 === 0) cue(m.t1, 'piece', 0.14); }); boom(najT, 0.7); cue(najT, 'shimmer', 0.22);
  shot(weapT - 0.06, (g, lt, t, sh) => {
    darkCard(g, SLATEBG[0], SLATEBG[1]);
    heading(g, 'THE WEAPON OF CHAMPIONS', 300, seg(lt, 0, 0.15), { size: 40 });
    webcam(g, 60, 400, 460, 640, 'bobby72', 'focus', t, { bg: ['#3A5A7A', '#14202E'], name: 'FISCHER', zoom: 0.95, cy: 0.5 });
    webcam(g, 560, 400, 460, 640, 'kasparov', 'focus', t, { bg: ['#6A3A3A', '#2A1214'], name: 'KASPAROV', zoom: 0.95, cy: 0.5 });
  }, { info: true });
  cue(weapT, 'whoosh_soft', 0.18);

  // ======================= TODAY: ONE OF THE MOST POPULAR OPENINGS =======================
  const todS = s('today');
  shot(todS - 0.06, (g, lt, t, sh) => boardGrid(g, lt, t, todS), { info: true });

  // ======================= CTA: how many boards could you play blindfolded? =======================
  const ctaT = s('cta') - 0.06, howT = w('cta', 'How'), comT = w('cta', 'Comment');
  shot(ctaT, (g, lt, t, sh) => portrait(g, lt, t, 'naj47', { ...EXPR.happy, curve: 0.6 }, { env: STUDY, pieces: posOf(NS, 10), keys: [[0, FRONT(0.12, 7.0, 0.3)], [len(sh), FRONT(0.04, 6.2, 0.3)]] }),
    { noJump: true, hud: (g, lt, t) => {
      badge(g, 'HOW MANY BOARDS BLINDFOLDED?', W / 2, 230, { color: TEAL, size: 44, a: seg(t, howT, howT + 0.1), scale: pop(t, howT) });
      badge(g, 'COMMENT A NUMBER', W / 2, 330, { color: GOLD, size: 40, a: seg(t, comT, comT + 0.1), scale: pop(t, comT) });
      badge(g, 'FOLLOW ' + CHANNEL, W / 2, 420, { color: CREAM, size: 34, a: seg(t, comT + 0.6, comT + 0.7) });
    } });
  cue(comT + 0.6, 'notify', 0.3);

  const tvOff = T.duration - 0.5;
  cue(tvOff, 'tvoff', 0.5);
  const music = [
    { t: 0, m: 'intrigue' }, { t: immT - 0.08, m: 'build' }, { t: BIG.t1, m: 'slam' }, { t: sailT - 0.08, m: 'exile' }, { t: warS - 0.06, m: 'tension' },
    { t: r40S - 0.06, m: 'build' }, { t: r45S - 0.06, m: 'glory' }, { t: wroteS - 0.45, m: 'void' }, { t: truS - 0.1, m: 'elegy' }, { t: agS - 0.08, m: 'finale' },
    { t: ctaT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: BIG.t0, t1: BIG.t1 - 0.01, kind: 'mute' }, { t0: BIG.t1, t1: sailT - 0.3, kind: 'boost', db: 8 },
    { t0: s('r45') + 7.6, t1: wroteS - 0.45, kind: 'lp', f: 900 }, { t0: wroteS - 0.45, t1: truS - 0.1, kind: 'mute' },
    { t0: ctaT, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.4, zooms: [1, 1.1, 1.04], shift: 30 } };
}
