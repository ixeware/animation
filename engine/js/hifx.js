// Move effects after the @chess.history short on Kramnik–Topalov (Elista 2006), worked out frame by frame and from its
// audio (STYLE_BIBLE §8). A key move lights the board as a dot matrix in the mover's colour, in a wave from the landing
// square; the landing square burns solid; neon lines run from the piece to what it attacks, with thin rings round the
// targets, and a red laser for a check; a wide thin ellipse spreads over the board. On the big move the frame flashes
// the colour, white manga speed lines burst from the piece and the camera punches in. Before a move a pale arrow lies on
// the board. The hero's moves are lime, the opponent's red, a result gold. Sound (audio/sfx.py `revswell`, `airwash`):
// the music cuts out ~0.25 s before the big move, a short reverse swell, then a low boom with an airy wash.
import { W, H, clamp, lerp, ease, rgba, mix, rng, qaRect } from './core.js';
import { LOOK } from './look.js';
import { sqXZ } from './board.js';
import { hand } from './characters.js';

export const HI = { good: '#B8F04A', bad: '#FF4A3D', gold: '#F2C14E', hero: '#5FE3D0' };

// ---------- the dot-matrix glow: squares light up in a wave from `sq` (speed in squares per second) ----------
export function ledGlow(ctx, B, sq, color, t, t0, { speed = 20, reach = 8, a = 1, n = 6 } = {}) {
  if (t < t0 || a <= 0) return;
  const [cx, cz] = sqXZ(sq), front = (t - t0) * speed, dot = mix(color, '#FFFFFF', 0.3);
  ctx.save();
  for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
    const d = Math.max(Math.abs(f + 0.5 - cx), Math.abs(r + 0.5 - cz));
    if (d > reach || d > front) continue;
    const k = clamp((front - d) / 1.5) * a, light = (f + r) % 2 === 1;  // drawSlab paints (f + r) odd as the light squares
    B.quad(ctx, f, r, f + 1, r + 1, 0.006); ctx.fillStyle = rgba(color, (light ? 0.3 : 0.17) * k); ctx.fill();
    ctx.fillStyle = rgba(dot, (light ? 0.95 : 0.65) * k);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p = B.project(f + (i + 0.5) / n, 0.01, r + (j + 0.5) / n);
      if (p.z < 0.5) continue;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.9, p.s * 0.03), 0, 7); ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- a glowing line between two squares (or [x, z] points), on the board or at a height ----------
export function neon(ctx, B, a, b, color, alpha = 1, { y = 0.05, u = 1, w = 1 } = {}) {
  if (alpha <= 0) return;
  const [x0, z0] = typeof a === 'string' ? sqXZ(a) : a, [x1, z1] = typeof b === 'string' ? sqXZ(b) : b;
  const p = B.project(x0, y, z0), q = B.project(lerp(x0, x1, u), y, lerp(z0, z1, u));
  if (p.z < 0.5 || q.z < 0.5) return;
  const s = (p.s + q.s) / 2;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.lineCap = 'round'; ctx.shadowColor = color;
  ctx.strokeStyle = rgba(color, 0.4); ctx.lineWidth = Math.max(5, s * 0.07) * w; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  ctx.strokeStyle = mix(color, '#FFFFFF', 0.45); ctx.lineWidth = Math.max(2, s * 0.022) * w; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  ctx.restore();
}

// ---------- a thin ring round a piece (screen space, at mid height), drawn on in a sweep ----------
export function pieceRing(ctx, B, sq, color, alpha = 1, u = 1) {
  if (alpha <= 0 || u <= 0) return;
  const [x, z] = sqXZ(sq), p = B.project(x, 0.62, z);
  if (p.z < 0.5) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2.5, p.s * 0.028); ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.56, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(u)); ctx.stroke(); ctx.restore();
}

// ---------- a wide thin ellipse spreading over the board from a square ----------
export function spread(ctx, B, sq, t, t0, color, { life = 1.5, r1 = 6.5, lw = 3 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life) return;
  const [x, z] = sqXZ(sq);
  B.ring(ctx, x, z, lerp(0.7, r1, ease.out(dt / life)), color, 0.85 * (1 - dt / life), lw);
}

// ---------- the big move: a colour flash over the frame and white speed lines from the piece ----------
export function flashTint(ctx, color, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(color, 0.5 * a); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(mix(color, '#FFFFFF', 0.4), 0.5 * a); ctx.fillRect(0, 0, W, H); ctx.restore();
}
export function speedLines(ctx, x, y, t, t0, { life = 0.65, n = 34, seed = 5, r0 = 240 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life) return;
  const r = rng(seed), k = dt / life;
  ctx.save(); ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < n; i++) {
    const ang = (i + r() * 0.8) / n * Math.PI * 2, len = 240 + r() * 560, w = 5 + r() * 13, start = r0 + r() * 180 + ease.out(k) * 140;
    ctx.globalAlpha = (1 - k) * (0.4 + r() * 0.55);
    const ca = Math.cos(ang), sa = Math.sin(ang), x0 = x + ca * start, y0 = y + sa * start, x1 = x + ca * (start + len), y1 = y + sa * (start + len);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - sa * w, y1 + ca * w); ctx.lineTo(x1 + sa * w, y1 - ca * w); ctx.closePath(); ctx.fill();  // a wedge, sharp end inwards
  }
  ctx.restore();
}
// short white sparks round the landing piece (the "impact" ticks)
export function ticks(ctx, B, sq, t, t0, { life = 0.5, n = 10, seed = 3 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life) return;
  const [x, z] = sqXZ(sq), p = B.project(x, 0.7, z), r = rng(seed), k = dt / life;
  if (p.z < 0.5) return;
  ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, p.s * 0.02);
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (r() - 0.5) * 2.4, d0 = p.s * (0.45 + k * 0.5), d1 = d0 + p.s * (0.12 + r() * 0.16);
    ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(ang) * d0, p.y + Math.sin(ang) * d0); ctx.lineTo(p.x + Math.cos(ang) * d1, p.y + Math.sin(ang) * d1); ctx.stroke();
  }
  ctx.restore();
}

// ---------- the light streak a sliding piece leaves (the slowed-down moves): a comet tail from where it started ----------
// draw it under the pieces, so the moving piece sits on its bright end
export function slideStreak(ctx, B, from, p, alpha = 1) {
  if (alpha <= 0 || !p) return;
  const [x0, z0] = sqXZ(from), a = B.project(x0, 0.3, z0), b = B.project(p.x, 0.3 + (p.y || 0), p.z);
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  if (a.z < 0.5 || b.z < 0.5 || L < 4) return;
  const nx = -dy / L, ny = dx / L, w1 = Math.max(6, b.s * 0.2), w0 = w1 * 0.12, an = Math.atan2(ny, nx);
  const gr = ctx.createLinearGradient(a.x, a.y, b.x, b.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.85)');
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = gr; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(a.x + nx * w0, a.y + ny * w0); ctx.lineTo(b.x + nx * w1, b.y + ny * w1);
  ctx.arc(b.x, b.y, w1, an, an - Math.PI, true); ctx.lineTo(a.x - nx * w0, a.y - ny * w0); ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------- a pale arrow lying on the board: the move about to be played ----------
export function boardArrow(ctx, B, from, to, alpha = 1, u = 1) {
  if (alpha <= 0 || u <= 0) return;
  const [x0, z0] = sqXZ(from), [x1, z1] = sqXZ(to), dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, nx = -uz, nz = ux;
  const len = Math.max(0.6, L * u), sw = 0.12, hw = 0.34, hl = 0.42, y = 0.06;
  const P = (s, o) => [x0 + ux * s + nx * o, y, z0 + uz * s + nz * o];
  const pts = [P(0.18, -sw), P(len - hl, -sw), P(len - hl, -hw), P(len, 0), P(len - hl, hw), P(len - hl, sw), P(0.18, sw)];
  ctx.save(); ctx.globalAlpha *= alpha;
  if (B.poly(ctx, pts)) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fill(); }
  ctx.restore();
}
// a square outlined (target preview, or a frame dropping onto the landing square)
export function squareFrame(ctx, B, sq, color, alpha = 1, { k = 1, fill = 0.18, lw = 4 } = {}) {
  if (alpha <= 0) return;
  const [x, z] = sqXZ(sq), h = 0.5 * k, pts = [[x - h, 0.03, z - h], [x + h, 0.03, z - h], [x + h, 0.03, z + h], [x - h, 0.03, z + h]];
  ctx.save(); ctx.globalAlpha *= alpha;
  if (B.poly(ctx, pts)) { ctx.fillStyle = rgba(color, fill); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.stroke(); }
  ctx.restore();
}

// ---------- what a piece attacks (rays stop at the first piece); enemy pieces among them ----------
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]], BISH = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
export function attacks(pieces, sq) {
  const at = new Map(pieces.map(p => [p.sq, p])), me = at.get(sq); if (!me) return [];
  const f0 = sq.charCodeAt(0) - 97, r0 = +sq[1] - 1, on = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8, nm = (f, r) => String.fromCharCode(97 + f) + (r + 1);
  const out = [];
  const ray = dirs => { for (const [df, dr] of dirs) for (let f = f0 + df, r = r0 + dr; on(f, r); f += df, r += dr) { out.push(nm(f, r)); if (at.has(nm(f, r))) break; } };
  const jump = dirs => dirs.forEach(([df, dr]) => on(f0 + df, r0 + dr) && out.push(nm(f0 + df, r0 + dr)));
  ({ r: () => ray(ROOK), b: () => ray(BISH), q: () => ray([...ROOK, ...BISH]), n: () => jump(KNIGHT), k: () => jump([...ROOK, ...BISH]),
    p: () => jump(me.c === 'w' ? [[1, 1], [-1, 1]] : [[1, -1], [-1, -1]]) })[me.t]?.();
  return out;
}
export const targets = (pieces, sq) => {
  const me = pieces.find(p => p.sq === sq); if (!me) return [];
  return attacks(pieces, sq).map(s => pieces.find(p => p.sq === s)).filter(p => p && p.c !== me.c);
};

// ---------- the whole accent of one key move, drawn in two layers round the pieces ----------
// m = {from, to, color, t0 (lift), land, label, check: king square or null, attackFrom: square giving check (default `to`)}
export function keyUnder(ctx, B, m, t, { glow = true, reach = 8 } = {}) {
  if (t < m.t0) return;
  if (glow) ledGlow(ctx, B, m.to, m.color, t, m.land, { reach });
  B.highlight(ctx, m.from, m.color, 0.35 * clamp((t - m.t0) / 0.08), false);
  if (t >= m.land) B.highlight(ctx, m.to, m.color, 0.85 * clamp((t - m.land) / 0.06), true);
  spread(ctx, B, m.to, t, m.land, m.color);
}
export function keyOver(ctx, B, m, t, pieces, { label = true, lines = true } = {}) {
  if (t < m.land) return;
  const lt = t - m.land, u = ease.out(clamp(lt / 0.35));
  if (lines) targets(pieces, m.to).forEach((p, i) => {  // neon to everything it hits, rings round the targets
    const isKing = p.t === 'k';
    neon(ctx, B, m.to, p.sq, isKing ? HI.bad : m.color, 1, { y: 0.55, u: clamp((lt - i * 0.06) / 0.25) });
    pieceRing(ctx, B, p.sq, isKing ? HI.bad : m.color, 1, clamp((lt - 0.15 - i * 0.06) / 0.3));
  });
  if (m.check) {  // a red laser from the checking piece to the king, a red ring round the king
    B.laser(ctx, m.attackFrom || m.to, m.check, HI.bad, 1, 0.6, u);
    pieceRing(ctx, B, m.check, HI.bad, 1, clamp((lt - 0.1) / 0.3));
  }
  ticks(ctx, B, m.to, t, m.land, { seed: m.to.charCodeAt(0) });
  if (label && m.label) { const [x, z] = sqXZ(m.to), p = B.project(x, 1.75, z); moveTag(ctx, m.label, p.x, p.y, m.color, Math.round(clamp(p.s * 0.42, 24, 54)), clamp(lt / 0.12)); }
}

// ---------- the move label as in `brilliant` (board.js label): mono in a dark rounded box outlined in the mover's colour ----------
export function moveTag(ctx, text, x, y, color, fs = 40, a = 1, { u = null } = {}) {
  if (a <= 0 || u === 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `800 ${fs}px "JetBrains Mono"`; ctx.letterSpacing = '-1px';
  const tw = ctx.measureText(text).width, bx = x - tw / 2 - 12, by = y - fs * 0.95, bw = tw + 24, bh = fs * 1.3;
  if (u !== null && LOOK.motion >= 2) {  // motion 2: grows out of the square below it (the box's bottom edge is the origin)
    const k = 0.9 + 0.1 * u, oy = by + bh; ctx.globalAlpha *= u;
    ctx.translate(x, oy + (1 - u) * 8); ctx.scale(k, k); ctx.translate(-x, -oy); if (u < 0.95) ctx.filter = `blur(${((1 - u) * 4).toFixed(1)}px)`;
  }
  ctx.fillStyle = 'rgba(6,9,11,0.78)'; ctx.strokeStyle = rgba(color, 0.7); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillText(text, x, y);
  qaRect(ctx, bx, by, bw, bh, 'text', 'move ' + text);
  ctx.restore();
}

// ---------- the player's reaction: both hands to the head, as in the reference ----------
// the sleeves rise behind the head (armsUp, drawn before the bust), the hands land on the temples with a shirt cuff
// under each (handsOnHead, drawn after it); (x, y) is the bust's head anchor, s its scale, u 0..1 the arms going up
const ARM = sd => ({ up: { s: [sd * 140, 250], e: [sd * 205, 110], w: [sd * 122, -14], h: [sd * 106, -42] },
  down: { s: [sd * 140, 250], e: [sd * 175, 250], w: [sd * 165, 225], h: [sd * 160, 235] } });
const armAt = (sd, u) => { const { up, down } = ARM(sd), k = ease.out(clamp(u)), L = q => [lerp(down[q][0], up[q][0], k), lerp(down[q][1], up[q][1], k)]; return { s: L('s'), e: L('e'), w: L('w'), h: L('h') }; };
export function armsUp(ctx, x, y, s, u = 1, jacket = '#1E2228') {
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(u * 3); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [col, lw] of [[mix(jacket, '#8A9AAE', 0.45), 64 * s + 7], [mix(jacket, '#8A9AAE', 0.08), 64 * s]])  // a rim light, so a dark sleeve reads on a dark room
    for (const sd of [-1, 1]) {
      const a = armAt(sd, u); ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x + a.s[0] * s, y + a.s[1] * s); ctx.lineTo(x + a.e[0] * s, y + a.e[1] * s); ctx.lineTo(x + a.w[0] * s, y + a.w[1] * s); ctx.stroke();
    }
  ctx.restore();
}
export function handsOnHead(ctx, x, y, s, t, u = 1, skin) {
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(u * 3);
  for (const sd of [-1, 1]) {
    const a = armAt(sd, u), jy = Math.sin(t * 21 + sd) * 2.2 * s * clamp(u);  // a nervous tremble
    ctx.fillStyle = '#F4F1EA'; ctx.beginPath(); ctx.ellipse(x + a.w[0] * s, y + a.w[1] * s + jy, 21 * s, 15 * s, sd * 0.6, 0, 7); ctx.fill();
    hand(ctx, x + a.h[0] * s, y + a.h[1] * s + jy, 34 * s, skin);
  }
  ctx.restore();
}
