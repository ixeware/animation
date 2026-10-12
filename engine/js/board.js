// Perspective chessboard: orbit camera, squares, overlays, billboard pieces with depth of field.
import { W, H, C, rgba, clamp, lerp, smooth, ease } from './core.js';
import { drawPiece } from './pieces.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

export const sqXZ = name => [name.charCodeAt(0) - 97 + 0.5, +name[1] - 1 + 0.5];

export class Board {
  constructor(cam = {}) { this.setCam(cam); }

  // yaw 0 = white's side, pitch in radians above the board, dist in squares
  setCam({ yaw = 0, pitch = 0.75, dist = 13, fov = 1500, target = [4, 0, 4], cx = W / 2, cy = H * 0.5 } = {}) {
    Object.assign(this, { yaw, pitch, dist, f: fov, T: target, cx, cy });
    const E = [target[0] + dist * Math.sin(yaw) * Math.cos(pitch), target[1] + dist * Math.sin(pitch),
      target[2] - dist * Math.cos(yaw) * Math.cos(pitch)];
    this.E = E; this.F = norm(sub(target, E));
    this.R = norm(cross([0, 1, 0], this.F)); this.U = cross(this.F, this.R);
    return this;
  }

  project(x, y, z) {
    const d = sub([x, y, z], this.E), depth = Math.max(0.05, dot(d, this.F));
    return { x: this.cx + this.f * dot(d, this.R) / depth, y: this.cy - this.f * dot(d, this.U) / depth, s: this.f / depth, z: depth };
  }

  poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y, z], i) => { const p = this.project(x, y, z); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
    ctx.closePath();
  }

  quad(ctx, x0, z0, x1, z1, y = 0) { this.poly(ctx, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]); }

  drawSlab(ctx, { light = C.sq2, dark = C.sq1, frame = '#151A1D', side = '#0B0E10', m = 0.35, th = 0.35, tint = null, tintA = 0 } = {}) {
    // side faces (front-facing ones drawn last)
    const faces = [
      [[-m, 0, -m], [8 + m, 0, -m], [8 + m, -th, -m], [-m, -th, -m]],
      [[8 + m, 0, -m], [8 + m, 0, 8 + m], [8 + m, -th, 8 + m], [8 + m, -th, -m]],
      [[8 + m, 0, 8 + m], [-m, 0, 8 + m], [-m, -th, 8 + m], [8 + m, -th, 8 + m]],
      [[-m, 0, 8 + m], [-m, 0, -m], [-m, -th, -m], [-m, -th, 8 + m]],
    ].map(f => ({ f, d: this.project(...f.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0])).z }))
      .sort((a, b) => b.d - a.d);
    for (const { f } of faces) { this.poly(ctx, f); ctx.fillStyle = side; ctx.fill(); }
    this.quad(ctx, -m, -m, 8 + m, 8 + m); ctx.fillStyle = frame; ctx.fill();
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      this.quad(ctx, f, r, f + 1, r + 1);
      ctx.fillStyle = (f + r) % 2 ? light : dark; ctx.fill();
    }
    if (tint && tintA > 0) { this.quad(ctx, 0, 0, 8, 8); ctx.fillStyle = rgba(tint, tintA); ctx.fill(); }
  }

  highlight(ctx, sq, color, a = 0.8, glow = true) {
    if (a <= 0) return;
    const [x, z] = sqXZ(sq);
    ctx.save(); this.quad(ctx, x - 0.5, z - 0.5, x + 0.5, z + 0.5, 0.005);
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 24; }
    ctx.fillStyle = rgba(color, a); ctx.fill(); ctx.restore();
  }

  // dot-matrix overlay over a set of squares (or whole board)
  dots(ctx, color, a, squares = null, n = 5) {
    if (a <= 0) return;
    ctx.save(); ctx.fillStyle = rgba(color, a);
    const list = squares ? squares.map(sqXZ).map(([x, z]) => [x - 0.5, z - 0.5]) : [...Array(64)].map((_, i) => [i % 8, Math.floor(i / 8)]);
    for (const [x0, z0] of list) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const p = this.project(x0 + (i + 0.5) / n, 0.01, z0 + (j + 0.5) / n);
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.8, p.s * 0.045), 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // rotating diamond reticle on the board plane
  reticle(ctx, sq, t, color = C.teal, a = 1, size = 0.95) {
    if (a <= 0) return;
    const [x, z] = sqXZ(sq), ang = t * 1.2;
    const pts = [0, 1, 2, 3].map(i => [x + Math.cos(ang + i * Math.PI / 2) * size, 0.02, z + Math.sin(ang + i * Math.PI / 2) * size]);
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 20;
    this.poly(ctx, pts); ctx.stroke(); ctx.globalAlpha *= 0.15; ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  ring(ctx, x, z, r, color, a = 1, lw = 4) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) { const p = this.project(x + Math.cos(i / 48 * 6.283) * r, 0.02, z + Math.sin(i / 48 * 6.283) * r); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
    ctx.stroke(); ctx.restore();
  }

  // laser line between two squares, at height y
  laser(ctx, a, b, color = C.red, alpha = 1, y = 0.6, u = 1) {
    if (alpha <= 0) return;
    const [x0, z0] = sqXZ(a), [x1, z1] = sqXZ(b);
    const p = this.project(x0, y, z0), q = this.project(lerp(x0, x1, u), y, lerp(z0, z1, u));
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
  }

  label(ctx, sq, text, color = C.teal, a = 1, y = 1.75) {
    if (a <= 0) return;
    const [x, z] = sqXZ(sq), p = this.project(x, y, z);
    const fs = Math.round(clamp(p.s * 0.42, 24, 54));
    ctx.save(); ctx.globalAlpha *= a; ctx.font = `800 ${fs}px "JetBrains Mono"`; ctx.letterSpacing = '-1px';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(6,9,11,0.78)'; ctx.strokeStyle = rgba(color, 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(p.x - tw / 2 - 12, p.y - fs * 0.95, tw + 24, fs * 1.3, 8); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.fillText(text, p.x, p.y); ctx.restore();
  }

  // pieces: [{t, c, x, z, y?, alpha?, glow?, bow?}] world coords; focus = depth in focus
  drawPieces(ctx, pieces, { focus = null, dof = 1.6, maxBlur = 16, scale = 1.25, trail = null } = {}) {
    const fz = focus ?? this.dist;
    const list = pieces.map(p => ({ ...p, pr: this.project(p.x, p.y || 0, p.z) })).sort((a, b) => b.pr.z - a.pr.z);
    for (const p of list) {
      if (p.alpha === 0) continue;
      const h = p.pr.s * scale * (p.scale || 1);
      const blur = clamp(Math.abs(p.pr.z - fz) * dof, 0, maxBlur) * (p.sharp ? 0 : 1);
      if (p.trail) this.trail(ctx, p.trail, p, h);
      // contact shadow
      const g = this.project(p.x, 0, p.z);
      ctx.save(); ctx.globalAlpha = (p.alpha ?? 1) * 0.35 / (1 + (p.y || 0) * 2);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(g.x, g.y, h * 0.3, h * 0.08, 0, 0, 7); ctx.fill(); ctx.restore();
      if (p.halo) { // golden glow pool under a piece
        ctx.save(); const r = h * 0.7, gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
        gr.addColorStop(0, rgba(p.halo, 0.55 * p.haloA)); gr.addColorStop(1, rgba(p.halo, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(g.x, g.y, r, r * 0.4, 0, 0, 7); ctx.fill(); ctx.restore();
      }
      drawPiece(ctx, p.t, p.c, p.pr.x, p.pr.y, h, { blur, alpha: p.alpha ?? 1, glow: p.glow, rot: p.rot || 0, sx: p.sx || 1, sy: p.sy || 1 });
      if (p.bow) drawBow(ctx, p.pr.x, p.pr.y - h * 0.62, h * 0.32, p.bow);
    }
    return list;
  }

  trail(ctx, from, p, h) {
    const a = this.project(from[0], 0.5, from[1]), b = this.project(p.x, (p.y || 0) + 0.5, p.z);
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.55 * (p.trailA ?? 1)})`);
    ctx.save(); ctx.strokeStyle = g; ctx.lineCap = 'round'; ctx.lineWidth = h * 0.28;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  }
}

// gift bow on top of a piece
export function drawBow(ctx, x, y, s, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s / 40, s / 40);
  ctx.fillStyle = '#F5C451'; ctx.strokeStyle = '#B9821E'; ctx.lineWidth = 3;
  for (const sgn of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(sgn * 40, -34, sgn * 46, 10, 0, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(sgn * 18, 30); ctx.lineTo(sgn * 8, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
}

// Interpolate piece placement between plies k-1 -> k with progress u (0..1).
// plies: from tools/pgn_to_json.py. Returns world-space piece list.
export function piecesAt(plies, k, u = 1, { arc = 0.7, opts = {}, keepCaptured = true } = {}) {
  const cur = plies[Math.max(0, k)].pieces;
  if (k <= 0 || u >= 1) return cur.map(p => ({ ...p, ...xz(p.sq), ...(opts[p.id] || {}) }));
  const prev = new Map(plies[k - 1].pieces.map(p => [p.id, p]));
  const out = [];
  const e = ease.inOut(clamp(u));
  for (const p of cur) {
    const q = prev.get(p.id), [x1, z1] = sqXZ(p.sq);
    if (q && q.sq !== p.sq) {
      const [x0, z0] = sqXZ(q.sq);
      out.push({ ...p, x: lerp(x0, x1, e), z: lerp(z0, z1, e), y: Math.sin(Math.PI * e) * arc, trail: [x0, z0], trailA: Math.sin(Math.PI * clamp(u)), ...(opts[p.id] || {}) });
    } else out.push({ ...p, x: x1, z: z1, ...(opts[p.id] || {}) });
    prev.delete(p.id);
  }
  for (const q of prev.values()) { // captured: stays until the attacker lands (it then shatters), or fades
    const [x, z] = sqXZ(q.sq), f = clamp((u - 0.45) / 0.4);
    if (keepCaptured) out.push({ ...q, x, z });
    else if (f < 1) out.push({ ...q, x, z, alpha: 1 - f, scale: 1 - f * 0.4, y: f * 0.3, rot: f * 0.6 });
  }
  return out;
}
const xz = sq => { const [x, z] = sqXZ(sq); return { x, z }; };
