// Drawing primitives and full-frame effects in the @chess.history look.
import { W, H, C, rgba, rng, clamp, lerp, makeCanvas, ease, inv } from './core.js';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// dark scene base: radial falloff from a lit center + optional tint
export function bgBase(ctx, { top = '#2a3135', mid = C.bg, edge = C.bgDeep, cx = W / 2, cy = H * 0.32, r = H * 0.75 } = {}) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, top); g.addColorStop(0.45, mid); g.addColorStop(1, edge);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// soft cone of light behind a character's head
export function spotlight(ctx, x, y, r, color = '#ffffff', a = 0.16) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.5, rgba(color, a * 0.45)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// top-down beam (stage light)
export function beam(ctx, x, top, w1, w2, h, color = '#fff6e0', a = 0.12) {
  const g = ctx.createLinearGradient(0, top, 0, top + h);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - w1 / 2, top); ctx.lineTo(x + w1 / 2, top);
  ctx.lineTo(x + w2 / 2, top + h); ctx.lineTo(x - w2 / 2, top + h); ctx.fill();
}

export function vignette(ctx, strength = 0.85, inner = 0.38) {
  const g = ctx.createRadialGradient(W / 2, H * 0.45, H * inner * 0.5, W / 2, H * 0.45, H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

let grainTiles = null;
export function grain(ctx, frame, a = 0.05) {
  if (!grainTiles) {
    grainTiles = [0, 1, 2, 3].map(k => {
      const c = makeCanvas(270, 480), g = c.getContext('2d'), im = g.createImageData(270, 480), r = rng(77 + k);
      for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      g.putImageData(im, 0, 0); return c;
    });
  }
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grainTiles[frame % 4], 0, 0, W, H);
  ctx.restore();
}

// floating out-of-focus discs (dust / distant lights)
export function bokeh(ctx, t, { n = 14, color = '#ffffff', a = 0.06, seed = 3, yMin = 0, yMax = H } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = lerp(yMin, yMax, r()), s = 20 + r() * 70, sp = 4 + r() * 10, ph = r() * 6.28;
    ctx.fillStyle = rgba(color, a * (0.5 + 0.5 * Math.sin(t * 0.8 + ph)));
    ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.3 + ph) * sp * 3, y - t * sp, s, 0, 7); ctx.fill();
  }
}

// radial speed lines (the "Check!" burst)
export function speedlines(ctx, x, y, t, { a = 0.6, n = 46, r0 = 260, color = '#ffffff', seed = 9 } = {}) {
  const fr = Math.floor(t * 15), r = rng(seed + fr);
  ctx.save(); ctx.strokeStyle = rgba(color, a); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, d0 = r0 + r() * 220, len = 80 + r() * 260;
    ctx.lineWidth = 2 + r() * 6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(ang) * d0, y + Math.sin(ang) * d0);
    ctx.lineTo(x + Math.cos(ang) * (d0 + len), y + Math.sin(ang) * (d0 + len));
    ctx.stroke();
  }
  ctx.restore();
}

// sunburst rays (victory)
export function rays(ctx, x, y, t, { n = 18, color = '#ffe9a8', a = 0.18, len = 1600 } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.15);
  for (let i = 0; i < n; i++) {
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, len, (i / n) * 6.283, (i / n) * 6.283 + 0.12); ctx.fill();
  }
  ctx.restore();
}

export function confetti(ctx, t, t0, { n = 120, seed = 5 } = {}) {
  if (t < t0) return;
  const r = rng(seed), cols = [C.gold, C.lime, C.red, C.blue, '#ffffff', C.teal];
  const dt = t - t0;
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, vy = 260 + r() * 380, vx = (r() - 0.5) * 200, sz = 10 + r() * 14, rot = r() * 6, spin = (r() - 0.5) * 10;
    const y = -60 - r() * 600 + vy * dt, x = x0 + vx * dt + Math.sin(dt * 3 + i) * 30;
    if (y > H + 40) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot + spin * dt); ctx.scale(1, Math.abs(Math.cos(dt * 5 + i)));
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2); ctx.restore();
  }
}

// full-screen flash
export function flash(ctx, a, color = '#ffffff') {
  if (a <= 0.001) return;
  ctx.fillStyle = rgba(color, clamp(a)); ctx.fillRect(0, 0, W, H);
}

// diagonal light-leak sweep used on cuts; p in 0..1 across the transition
export function lightLeak(ctx, p) {
  if (p <= 0 || p >= 1) return;
  const a = Math.sin(p * Math.PI);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(W / 2, H / 2); ctx.rotate(-0.62);
  const x = lerp(-1700, 1700, p);
  const g = ctx.createLinearGradient(x - 420, 0, x + 420, 0);
  g.addColorStop(0, 'rgba(255,120,90,0)'); g.addColorStop(0.35, `rgba(255,150,120,${0.75 * a})`);
  g.addColorStop(0.5, `rgba(255,236,220,${0.95 * a})`); g.addColorStop(0.65, `rgba(214,120,92,${0.7 * a})`);
  g.addColorStop(1, 'rgba(160,80,60,0)');
  ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 4000, 4000);
  ctx.restore();
  flash(ctx, a * 0.35, '#fff3ea');
}

// CRT power-off: squash the frame to a line, then a dot. p 0..1
export function tvOff(ctx, src, p) {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (p < 0.55) {
    const q = ease.in(p / 0.55), sh = Math.max(4, H * (1 - q));
    ctx.save(); ctx.filter = `brightness(${1 + q * 2.5})`;
    ctx.drawImage(src, 0, (H - sh) / 2, W, sh); ctx.restore();
  } else {
    const q = ease.out((p - 0.55) / 0.45), w = W * (1 - q);
    const g = ctx.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
    g.addColorStop(0, 'rgba(180,220,255,0)'); g.addColorStop(0.5, `rgba(240,250,255,${1 - q * 0.6})`); g.addColorStop(1, 'rgba(180,220,255,0)');
    ctx.fillStyle = g; ctx.fillRect(W / 2 - w / 2, H / 2 - 3, w, 6);
  }
}

// text with dark outline and soft shadow (captions & badges)
export function outlinedText(ctx, s, x, y, { font, fill = '#fff', stroke = 'rgba(8,10,12,0.95)', sw = 10, shadow = 0.6, align = 'center' } = {}) {
  ctx.save(); ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (shadow) { ctx.shadowColor = `rgba(0,0,0,${shadow})`; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; }
  ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(s, x, y);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
}

export function glowText(ctx, s, x, y, { font, fill = '#fff', glow = '#fff', blur = 24, align = 'center', a = 1, spacing = 0 } = {}) {
  ctx.save(); ctx.globalAlpha *= a; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (spacing) ctx.letterSpacing = `${spacing}px`;
  ctx.shadowColor = glow; ctx.shadowBlur = blur; ctx.fillStyle = fill; ctx.fillText(s, x, y);
  ctx.shadowBlur = 0; ctx.fillText(s, x, y); ctx.restore();
}

// red/teal crosshair circle (target on a king)
export function target(ctx, x, y, r, t, color = C.red, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.arc(x, y, r * (1.25 + 0.08 * Math.sin(t * 6)), 0, 7); ctx.stroke();
  ctx.restore();
}

export function xMark(ctx, x, y, s, color = C.red, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x + s / 2, y + s / 2);
  ctx.moveTo(x + s / 2, y - s / 2); ctx.lineTo(x - s / 2, y + s / 2); ctx.stroke(); ctx.restore();
}

export function sweatDrop(ctx, x, y, s, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#5fb4ef');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -32);
  ctx.bezierCurveTo(14, -8, 22, 6, 18, 16); ctx.arc(0, 14, 18, 0.1, Math.PI - 0.1); ctx.bezierCurveTo(-22, 6, -14, -8, 0, -32);
  ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-6, 10, 4, 7, -0.3, 0, 7); ctx.fill();
  ctx.restore();
}

// soft drop shadow ellipse
export function shadowEllipse(ctx, x, y, rx, ry, a = 0.4) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, 7); ctx.fill(); ctx.restore();
}

// screen-space camera: zoom around a focus point + drift + shake
export function camera(ctx, { zoom = 1, fx = W / 2, fy = H / 2, dx = 0, dy = 0, rot = 0, shake = 0, t = 0 } = {}) {
  const sx = shake ? (Math.sin(t * 91) + Math.sin(t * 57)) * shake : 0;
  const sy = shake ? (Math.cos(t * 83) + Math.sin(t * 41)) * shake : 0;
  ctx.translate(W / 2 + dx + sx, H / 2 + dy + sy);
  ctx.rotate(rot); ctx.scale(zoom, zoom);
  ctx.translate(-fx, -fy);
}

export { inv };
