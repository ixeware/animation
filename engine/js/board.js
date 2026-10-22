// Perspective chessboard: orbit camera, squares, overlays, billboard pieces with depth of field.
import { W, H, C, rgba, mix, clamp, lerp, smooth, ease } from './core.js';
import { drawPiece } from './pieces.js';
import { LOOK } from './look.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

export const sqXZ = name => [name.charCodeAt(0) - 97 + 0.5, +name[1] - 1 + 0.5];

// the outline of the slab, -m..8+m with corners rounded to rc: points with their outward normals, the corners'
// arcs in n steps (with rc = 0 an arc's points coincide and its quads are skipped)
function slabRing(m, rc, n = 14) {
  const lo = -m + rc, hi = 8 + m - rc, out = [];
  for (const [cx, cz, a0] of [[hi, lo, -Math.PI / 2], [hi, hi, 0], [lo, hi, Math.PI / 2], [lo, lo, Math.PI]])
    for (let i = 0; i <= n; i++) {
      const a = a0 + i / n * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a);
      out.push({ x: cx + nx * rc, z: cz + nz * rc, nx, nz });
    }
  return out;
}

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

  // camera-space coordinates: [right, up, depth]
  toCam(x, y, z) { const d = sub([x, y, z], this.E); return [dot(d, this.R), dot(d, this.U), dot(d, this.F)]; }

  // polygon path with near-plane clipping, so geometry can surround the camera (walls, floor, close-ups)
  poly(ctx, pts, near = 0.2) {
    const cam = pts.map(p => this.toCam(...p)), out = [];
    for (let i = 0; i < cam.length; i++) {
      const a = cam[i], b = cam[(i + 1) % cam.length], ia = a[2] >= near, ib = b[2] >= near;
      if (ia) out.push(a);
      if (ia !== ib) { const k = (near - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, near]); }
    }
    ctx.beginPath();
    out.forEach(([rx, uy, d], i) => { const x = this.cx + this.f * rx / d, y = this.cy - this.f * uy / d; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    return out.length >= 3;
  }

  quad(ctx, x0, z0, x1, z1, y = 0) { this.poly(ctx, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]); }

  // the slab as in the reference (STYLE_BIBLE rule 46): rounded corners (rc), a soft light rim along the top edge, dark
  // sides that catch a little light from the camera's right, a soft shadow round the foot, and the channel's mark
  // engraved on every side that faces the camera (LOOK.mark; mark: null leaves the sides bare)
  drawSlab(ctx, { light = C.sq2, dark = C.sq1, frame = '#151A1D', side = '#0B0E10', m = 0.35, th = 0.35, rc = 0.3, rim = 0.45,
    shadow = 0.4, mark = LOOK.mark, ink = null, tint = null, tintA = 0 } = {}) {
    const ring = slabRing(m, Math.min(rc, m)), E = this.E;
    if (shadow > 0) {
      ctx.save(); this.poly(ctx, ring.map(p => [p.x, -th, p.z]));
      ctx.shadowColor = `rgba(0,0,0,${shadow})`; ctx.shadowBlur = clamp(this.project(4, -th, 4).s * 0.22, 3, 36);
      ctx.fillStyle = side; ctx.fill(); ctx.restore();
    }
    // the sides: a quad per pair of neighbouring outline points; the slab is convex, so the ones facing the camera
    // never overlap and need no sorting. Fill and stroke in one colour, so no seams show between the quads
    const vis = [];
    ctx.save(); ctx.lineWidth = 1; ctx.lineJoin = 'round';
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      if (Math.hypot(b.x - a.x, b.z - a.z) < 1e-6) continue;
      const nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2;
      if (nx * (E[0] - (a.x + b.x) / 2) + nz * (E[2] - (a.z + b.z) / 2) <= 0) continue;
      vis.push([a, b]);
      const lit = 0.04 + 0.12 * Math.max(0, (nx * this.R[0] + nz * this.R[2]) / Math.hypot(nx, nz));
      if (!this.poly(ctx, [[a.x, 0, a.z], [b.x, 0, b.z], [b.x, -th, b.z], [a.x, -th, a.z]])) continue;
      ctx.fillStyle = ctx.strokeStyle = mix(side, '#B8C6CC', lit); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    this.poly(ctx, ring.map(p => [p.x, 0, p.z])); ctx.fillStyle = frame; ctx.fill();
    // the rim: a thin light line along the visible top edge, as if the edge were rounded and caught the key light
    if (rim > 0) {
      ctx.save(); ctx.strokeStyle = rgba(mix(frame, '#FFFFFF', 0.3), rim); ctx.lineCap = 'round';
      for (const [a, b] of vis) {
        if (this.toCam(a.x, 0, a.z)[2] < 0.3 || this.toCam(b.x, 0, b.z)[2] < 0.3) continue;
        const p = this.project(a.x, 0, a.z), q = this.project(b.x, 0, b.z);
        ctx.lineWidth = clamp((p.s + q.s) * 0.009, 1, 5);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.restore();
    }
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
      this.quad(ctx, f, r, f + 1, r + 1);
      ctx.fillStyle = (f + r) % 2 ? light : dark; ctx.fill();
    }
    if (tint && tintA > 0) { this.quad(ctx, 0, 0, 8, 8); ctx.fillStyle = rgba(tint, tintA); ctx.fill(); }
    if (mark) this.engrave(ctx, mark, { m, th, rc: Math.min(rc, m), ink: ink || mix(side, '#E4ECEE', 0.3) });
  }

  // a mark engraved on the sides of the slab, in Cinzel caps a little over half the side's height, centred. Glyph by
  // glyph: each one is mapped onto the side with the perspective of its own spot (the Jacobian of the projection
  // there), so the line of letters follows the side into the distance. A dark copy above and a faint light one below
  // cut it in.
  engrave(ctx, text, { m, th, rc, ink }) {
    const fs = 100, chars = [...text];
    ctx.save(); ctx.font = `700 ${fs}px Cinzel`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = '0px';
    const capPx = ctx.measureText('H').actualBoundingBoxAscent, gw = chars.map(ch => ctx.measureText(ch).width), track = fs * 0.1;
    const span = gw.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
    const k = Math.min(th * 0.56 / capPx, (8 + 2 * m - 2 * rc - 1.2) / span), cap = capPx * k;  // world units per font px
    const base = ctx.getTransform(), a0 = ctx.globalAlpha, e = 0.05;
    for (const [nx, nz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const rx = -nz, rz = nx, cx = 4 + nx * (4 + m), cz = 4 + nz * (4 + m), cy = -th / 2;
      const v = norm(sub(this.E, [cx, cy, cz])), a = smooth(clamp((nx * v[0] + nz * v[2] - 0.06) / 0.24));
      if (a <= 0.01) continue;
      let u = -span * k / 2;
      const glyphs = [];
      for (let i = 0; i < chars.length; i++) {
        const uc = u + gw[i] * k / 2; u += (gw[i] + track) * k;
        const P = [cx + rx * uc, cy, cz + rz * uc];
        if (this.toCam(...P)[2] < 0.4) continue;
        const S = this.project(...P), R0 = this.project(P[0] - rx * e, cy, P[2] - rz * e), R1 = this.project(P[0] + rx * e, cy, P[2] + rz * e);
        const D0 = this.project(P[0], cy + e, P[2]), D1 = this.project(P[0], cy - e, P[2]);
        const ju = [(R1.x - R0.x) / (2 * e), (R1.y - R0.y) / (2 * e)], jd = [(D1.x - D0.x) / (2 * e), (D1.y - D0.y) / (2 * e)];
        const hpx = Math.hypot(...jd) * cap;
        if (hpx < 3) continue;
        glyphs.push({ ch: chars[i], m: [ju[0] * k, ju[1] * k, jd[0] * k, jd[1] * k,
          S.x - ju[0] * gw[i] * k / 2 + jd[0] * cap / 2, S.y - ju[1] * gw[i] * k / 2 + jd[1] * cap / 2], a: a * clamp((hpx - 3) / 5) });
      }
      for (const [col, dy, al] of [['#000000', -fs * 0.035, 0.6], ['#FFFFFF', fs * 0.03, 0.07], [ink, 0, 1]]) {
        ctx.fillStyle = col;
        for (const gl of glyphs) {
          ctx.setTransform(base); ctx.transform(...gl.m); ctx.globalAlpha = a0 * gl.a * al;
          ctx.fillText(gl.ch, 0, dy);
        }
      }
    }
    ctx.restore();
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
      if (p.alpha === 0 || p.pr.z < 0.6) continue;
      const h = p.pr.s * scale * (p.scale || 1);
      // LOOK v2: the middle of the board stays sharp; only pieces right in front of the lens go soft (as in the reference)
      const dz = p.pr.z - fz, defocus = LOOK.v2 ? (dz < 0 ? -dz - 1.2 : (dz - 2.5) * 0.35) : Math.abs(dz);
      const blur = clamp(defocus * dof, 0, maxBlur) * (p.sharp ? 0 : 1);
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
      if (p.brill) brilliantIcon(ctx, p.pr.x - h * 0.34, p.pr.y - h * 1.04, Math.max(32, h * 0.3), p.brill);  // left: the move label sits on the right
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
// the "brilliant move" mark over a sacrificed piece: a teal disc with a white "!!", popping in (a = 0..1)
export const BRILL = '#1EB6A0';
export function brilliantIcon(ctx, x, y, r, a = 1) {
  if (a <= 0) return;
  const k = ease.back(clamp(a * 1.6)), al = clamp(a * 3);
  ctx.save(); ctx.globalAlpha *= al; ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(r * 0.08, r * 0.14, r * 1.04, 0, 7); ctx.fill();
  ctx.fillStyle = '#0E7F70'; ctx.beginPath(); ctx.arc(0, 0, r * 1.06, 0, 7); ctx.fill();
  const gr = ctx.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#37D1B9'); gr.addColorStop(1, BRILL);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 0.92, 0, 7); ctx.fill();
  // the two marks drawn by hand: tapered bars and round dots with a clear gap (a font's "!!" reads as "II" when small)
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#FFFFFF'; ctx.lineJoin = 'round'; ctx.lineWidth = r * 0.07;
  for (const dx of [-0.25, 0.25]) {
    const x = dx * r;
    ctx.beginPath(); ctx.moveTo(x - r * 0.12, -r * 0.54); ctx.lineTo(x + r * 0.12, -r * 0.54); ctx.lineTo(x + r * 0.06, r * 0.15); ctx.lineTo(x - r * 0.06, r * 0.15); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, r * 0.42, r * 0.11, 0, 7); ctx.fill();
  }
  ctx.restore();
}

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
export function piecesAt(plies, k, u = 1, { arc = 0.7, opts = {}, keepCaptured = true, e: ef = ease.inOut, trail = true } = {}) {
  const cur = plies[Math.max(0, k)].pieces;
  if (k <= 0 || u >= 1) return cur.map(p => ({ ...p, ...xz(p.sq), ...(opts[p.id] || {}) }));
  const prev = new Map(plies[k - 1].pieces.map(p => [p.id, p]));
  const out = [];
  const e = ef(clamp(u));
  for (const p of cur) {
    const q = prev.get(p.id), [x1, z1] = sqXZ(p.sq);
    if (q && q.sq !== p.sq) {
      const [x0, z0] = sqXZ(q.sq);
      out.push({ ...p, x: lerp(x0, x1, e), z: lerp(z0, z1, e), y: Math.sin(Math.PI * e) * arc, ...(trail ? { trail: [x0, z0], trailA: Math.sin(Math.PI * clamp(u)) } : {}), ...(opts[p.id] || {}) });
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
