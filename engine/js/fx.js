// Deterministic particle and impact effects. Every function is a pure function of (t, t0, seed),
// so any frame can be rendered independently.
import { W, H, C, rgba, rng, clamp, lerp, ease } from './core.js';

// sparks / dots flying out of a point, with gravity
export function burst(g, x, y, t, t0, { n = 18, color = '#FFFFFF', speed = 700, life = 0.55, size = 5, gravity = 1400,
  dir = -Math.PI / 2, spread = Math.PI * 1.6, seed = 1, kind = 'spark', glow = true } = {}) {
  const dt = t - t0;
  if (dt < 0 || dt > life) return;
  const r = rng(seed * 7919 + 13);
  g.save(); g.lineCap = 'round';
  if (glow) { g.shadowColor = color; g.shadowBlur = 12; }
  for (let i = 0; i < n; i++) {
    const a = dir + (r() - 0.5) * spread, v = speed * (0.35 + 0.65 * r()), l = life * (0.6 + 0.4 * r());
    if (dt > l) continue;
    const k = dt / l, vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const px = x + vx * dt, py = y + vy * dt + 0.5 * gravity * dt * dt;
    g.globalAlpha = (1 - k) * (1 - k);
    if (kind === 'spark') {
      const tail = 0.035; g.strokeStyle = color; g.lineWidth = size * (1 - k * 0.6);
      g.beginPath(); g.moveTo(px - vx * tail, py - (vy + gravity * dt) * tail); g.lineTo(px, py); g.stroke();
    } else {
      g.fillStyle = color; g.beginPath(); g.arc(px, py, size * (1 - k * 0.5), 0, 7); g.fill();
    }
  }
  g.restore();
}

// expanding ellipse shockwave in screen space (squash ~ board perspective)
export function shockwave(g, x, y, t, t0, { r0 = 20, r1 = 220, life = 0.5, color = '#FFFFFF', lw = 10, squash = 0.42 } = {}) {
  const dt = t - t0;
  if (dt < 0 || dt > life) return;
  const k = ease.out(dt / life), r = lerp(r0, r1, k);
  g.save(); g.globalAlpha = (1 - dt / life); g.strokeStyle = color; g.lineWidth = lw * (1 - k * 0.7);
  g.shadowColor = color; g.shadowBlur = 20;
  g.beginPath(); g.ellipse(x, y, r, r * squash, 0, 0, 7); g.stroke(); g.restore();
}

// radial flash of light at a point
export function glint(g, x, y, t, t0, { r = 160, life = 0.35, color = '#FFFFFF' } = {}) {
  const dt = t - t0;
  if (dt < 0 || dt > life) return;
  const a = 1 - dt / life;
  const gr = g.createRadialGradient(x, y, 0, x, y, r * (0.6 + 0.4 * a));
  gr.addColorStop(0, rgba(color, 0.9 * a)); gr.addColorStop(1, rgba(color, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  // 4-point star
  g.fillStyle = rgba(color, a); g.beginPath();
  const s = r * 0.55 * a;
  g.moveTo(x, y - s); g.lineTo(x + s * 0.12, y); g.lineTo(x, y + s); g.lineTo(x - s * 0.12, y); g.closePath();
  g.moveTo(x - s, y); g.lineTo(x, y + s * 0.12); g.lineTo(x + s, y); g.lineTo(x, y - s * 0.12); g.closePath(); g.fill();
  g.restore();
}

// --- shattering -------------------------------------------------------------------------------------

// jittered grid triangulation of a w×h rectangle; returns triangles [[x,y]x3] and their centroids
function fragments(w, h, cols, rows, seed) {
  const r = rng(seed), P = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
    P.push([i / cols * w + (edgeX ? 0 : (r() - 0.5) * w / cols * 0.8), j / rows * h + (edgeY ? 0 : (r() - 0.5) * h / rows * 0.8)]);
  }
  const tris = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = P[j * (cols + 1) + i], b = P[j * (cols + 1) + i + 1], c = P[(j + 1) * (cols + 1) + i], d = P[(j + 1) * (cols + 1) + i + 1];
    if (r() > 0.5) tris.push([a, b, d], [a, d, c]); else tris.push([a, b, c], [b, d, c]);
  }
  return tris.map(t => ({ t, cx: (t[0][0] + t[1][0] + t[2][0]) / 3, cy: (t[0][1] + t[1][1] + t[2][1]) / 3, r: r(), r2: r() }));
}
const fragCache = new Map();
const frags = (w, h, cols, rows, seed) => {
  const k = [w, h, cols, rows, seed].join();
  if (!fragCache.has(k)) fragCache.set(k, fragments(w, h, cols, rows, seed));
  return fragCache.get(k);
};

// shatter an image (sprite or frame) drawn at (x, y, w, h); p = time since impact (s)
export function shatterImage(g, img, x, y, w, h, dt, { cols = 4, rows = 6, seed = 3, power = 700, gravity = 1800, spin = 6, life = 0.9, ox = 0.5, oy = 0.5, sw = img.width, sh = img.height } = {}) {
  if (dt < 0 || dt > life) return;
  const F = frags(w, h, cols, rows, seed), cx = w * ox, cy = h * oy;
  g.save();
  for (const f of F) {
    const dx = f.cx - cx, dy = f.cy - cy, d = Math.hypot(dx, dy) || 1;
    const v = power * (0.5 + f.r), tx = dx / d * v * dt, ty = dy / d * v * dt + 0.5 * gravity * dt * dt - 200 * dt * f.r2;
    const rot = (f.r - 0.5) * spin * dt;
    g.save(); g.globalAlpha = clamp(1 - dt / life) ** 0.7;
    g.translate(x + f.cx + tx, y + f.cy + ty); g.rotate(rot); g.translate(-f.cx, -f.cy);
    g.beginPath(); f.t.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
    g.clip(); g.drawImage(img, 0, 0, sw, sh, 0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.stroke();
    g.restore();
  }
  g.restore();
}

// full-screen glass break: cracks first, then the pieces fall away revealing what is underneath.
// src = canvas holding the frame being broken; p in 0..1 over ~0.8 s
export function screenShatter(g, src, p, { seed = 11, cx = W * 0.5, cy = H * 0.42 } = {}) {
  const F = frags(W, H, 7, 12, seed);
  const crack = clamp(p / 0.22), fly = clamp((p - 0.22) / 0.78);
  g.save();
  for (const f of F) {
    const dx = f.cx - cx, dy = f.cy - cy, d = Math.hypot(dx, dy) || 1;
    const delay = d / 1400 * 0.35;
    const q = clamp((fly - delay) / (1 - delay));
    if (q >= 1) continue;
    const tx = dx / d * 900 * q * (0.4 + f.r), ty = dy / d * 600 * q + 2600 * q * q * (0.5 + f.r2);
    const rot = (f.r - 0.5) * 3 * q, s = 1 - 0.25 * q;
    g.save(); g.globalAlpha = 1 - q * 0.4;
    g.translate(f.cx + tx, f.cy + ty); g.rotate(rot); g.scale(s, s); g.translate(-f.cx, -f.cy);
    g.beginPath(); f.t.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
    g.save(); g.clip(); g.drawImage(src, 0, 0); if (q > 0) { g.fillStyle = `rgba(255,255,255,${0.12 * q})`; g.fillRect(0, 0, W, H); } g.restore();
    g.strokeStyle = `rgba(255,255,255,${0.8 * crack})`; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  // impact flash at the crack center
  if (p < 0.3) { const a = 1 - p / 0.3; const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 500); gr.addColorStop(0, `rgba(255,255,255,${0.8 * a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.restore();
}

// dust puff (soft discs) e.g. when a piece lands or falls over
export function dust(g, x, y, t, t0, { n = 10, color = '#C9D2D8', life = 0.7, size = 22, spread = 120, seed = 5 } = {}) {
  const dt = t - t0;
  if (dt < 0 || dt > life) return;
  const r = rng(seed * 31 + 7), k = dt / life;
  g.save();
  for (let i = 0; i < n; i++) {
    const a = (r() - 0.5) * Math.PI, d = spread * ease.out(k) * (0.5 + r());
    g.globalAlpha = 0.35 * (1 - k);
    g.fillStyle = color; g.beginPath(); g.arc(x + Math.sin(a) * d, y - Math.abs(Math.cos(a)) * d * 0.35 - 10 * k, size * (0.6 + r()) * (0.6 + k), 0, 7); g.fill();
  }
  g.restore();
}

// a cluster of flame tongues at a screen point (billboard); s = pixels per unit / 100
export function flames(g, x, y, s, t, { seed = 1, n = 7, w = 1.6, h = 2.6, a = 1 } = {}) {
  if (a <= 0) return;
  const r = rng(seed * 31 + 7);
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha *= a;
  for (let i = 0; i < n; i++) {
    const ox = (r() - 0.5) * w * 100 * s, ph = r() * 6.28, sp = 5 + r() * 5;
    const hh = h * 100 * s * (0.45 + 0.55 * r()) * (0.75 + 0.25 * Math.sin(t * sp + ph)), ww = hh * (0.28 + 0.1 * r());
    const sway = Math.sin(t * 3.1 + ph) * ww * 0.35, bx = x + ox, by = y;
    const gr = g.createLinearGradient(bx, by, bx, by - hh);
    gr.addColorStop(0, 'rgba(255,240,190,0.95)'); gr.addColorStop(0.35, 'rgba(255,160,60,0.85)'); gr.addColorStop(0.75, 'rgba(230,70,30,0.55)'); gr.addColorStop(1, 'rgba(120,20,10,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(bx - ww, by);
    g.bezierCurveTo(bx - ww * 1.1, by - hh * 0.45, bx + sway - ww * 0.3, by - hh * 0.7, bx + sway, by - hh);
    g.bezierCurveTo(bx + sway + ww * 0.3, by - hh * 0.7, bx + ww * 1.1, by - hh * 0.45, bx + ww, by); g.fill();
  }
  const gl = g.createRadialGradient(x, y - h * 40 * s, 0, x, y - h * 40 * s, h * 130 * s);
  gl.addColorStop(0, 'rgba(255,140,50,0.35)'); gl.addColorStop(1, 'rgba(255,90,30,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y - h * 40 * s, h * 130 * s, 0, 7); g.fill();
  g.restore();
}

// embers drifting up across the frame (screen space)
export function embers(g, t, { n = 60, seed = 3, a = 1, color = '#FFB060' } = {}) {
  if (a <= 0) return;
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 10;
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 120 + r() * 260, ph = r() * 10, life = (t * sp / H + ph) % 1;
    const x = x0 + Math.sin(t * 2 + i) * 30, y = H * (1.05 - life * 1.15), sz = 2 + r() * 4;
    g.globalAlpha = a * Math.sin(life * Math.PI) * (0.5 + 0.5 * r());
    g.beginPath(); g.arc(x, y, sz, 0, 7); g.fill();
  }
  g.restore();
}
