// LOOK v2 lighting: low key, one source. A spotlight cone with dust in the beam, a pool on the floor or table,
// soft out-of-focus lights in the dark background, and heavy edge darkening so the subject is the brightest thing.
import { W, H, clamp, rgba, rng } from './core.js';

// a cone of light from `top` (a lamp above) to a circle of radius r1 around `base` (world points)
export function spotCone(g, B, { top = [4, 16, 6], base = [4, 0, 6], r0 = 0.5, r1 = 4, color = '#FFF0D8', a = 0.2, dust = 40, t = 0, seed = 3 } = {}) {
  const pt = B.toCam(...top), pb = B.toCam(...base);
  if (pt[2] < 0.5 || pb[2] < 0.5) return;
  const P = B.project(...top), Q = B.project(...base), w0 = r0 * P.s, w1 = r1 * Q.s;
  // the beam: a trapezoid between the two circles, brighter at the lamp
  const dx = Q.x - P.x, dy = Q.y - P.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  g.save(); g.globalCompositeOperation = 'screen';
  const gr = g.createLinearGradient(P.x, P.y, Q.x, Q.y); gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, a * 0.35));
  g.fillStyle = gr; g.filter = 'blur(6px)';
  g.beginPath(); g.moveTo(P.x + nx * w0, P.y + ny * w0); g.lineTo(Q.x + nx * w1, Q.y + ny * w1);
  g.ellipse(Q.x, Q.y, w1, w1 * 0.28, 0, 0, Math.PI); g.lineTo(P.x - nx * w0, P.y - ny * w0); g.closePath(); g.fill();
  g.filter = 'none';
  // the pool where it lands
  const pg = g.createRadialGradient(Q.x, Q.y, 0, Q.x, Q.y, w1 * 1.15); pg.addColorStop(0, rgba(color, a * 1.6)); pg.addColorStop(1, rgba(color, 0));
  g.fillStyle = pg; g.save(); g.translate(Q.x, Q.y); g.scale(1, 0.32); g.beginPath(); g.arc(0, 0, w1 * 1.15, 0, 7); g.fill(); g.restore();
  // dust drifting in the beam
  const r = rng(seed);
  for (let i = 0; i < dust; i++) {
    const u = r(), v = r() * 2 - 1, ph = r() * 6.28, sp = 0.05 + r() * 0.08;
    const k = (u + t * sp) % 1, wx = (w0 + (w1 - w0) * k) * v * 0.85;
    const x = P.x + dx * k + nx * wx + Math.sin(t * 0.7 + ph) * 6, y = P.y + dy * k + ny * wx + Math.cos(t * 0.5 + ph) * 4;
    const al = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + ph * 3))) * a * 2.2;
    g.fillStyle = rgba('#FFFFFF', clamp(al, 0, 0.6)); g.beginPath(); g.arc(x, y, 1.2 + r() * 1.8, 0, 7); g.fill();
  }
  g.restore();
}

// soft round lights far behind the subject (stage lamps, windows), drifting a little with the camera
export function bokeh(g, t, { n = 14, seed = 9, y0 = 0.05, y1 = 0.5, colors = ['#FFD9A0', '#FFE9C8', '#9FC2E8'], size = [40, 110], a = 0.22, drift = 12 } = {}) {
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = H * (y0 + r() * (y1 - y0)), R = size[0] + r() * (size[1] - size[0]), c = colors[Math.floor(r() * colors.length)], ph = r() * 6.28;
    const xx = x + Math.sin(t * 0.3 + ph) * drift, al = a * (0.6 + 0.4 * r());
    const gr = g.createRadialGradient(xx, y, 0, xx, y, R); gr.addColorStop(0, rgba(c, al)); gr.addColorStop(0.7, rgba(c, al * 0.55)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(xx, y, R, 0, 7); g.fill();
  }
  g.restore();
}

// heavy low-key falloff: darkens toward the edges and the bottom, keeps a lit oval around (cx, cy)
export function lowKey(g, { cx = W / 2, cy = H * 0.42, rx = W * 0.62, a = 0.55, bottom = 0.35 } = {}) {
  g.save();
  const gr = g.createRadialGradient(cx, cy, rx * 0.35, cx, cy, rx * 1.35); gr.addColorStop(0, 'rgba(4,6,9,0)'); gr.addColorStop(1, `rgba(4,6,9,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (bottom > 0) { const bg = g.createLinearGradient(0, H * 0.7, 0, H); bg.addColorStop(0, 'rgba(4,6,9,0)'); bg.addColorStop(1, `rgba(4,6,9,${bottom})`); g.fillStyle = bg; g.fillRect(0, H * 0.7, W, H * 0.3); }
  g.restore();
}
