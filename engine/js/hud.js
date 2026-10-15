// On-screen graphics: name titles, place/date stamps, counters, scoreboard, health bar, badges, stamps.
import { W, H, C, rgba, clamp, ease, inv, lerp, qaRect } from './core.js';
import { glowText, outlinedText } from './draw.js';

const serif = (s, w = 700) => `${w} ${s}px Cinzel`;
const mono = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;
const sans = (s, w = 800) => `${w} ${s}px Rubik`;

// typewriter reveal of a string over [t0, t0+d]
const typed = (s, lt, t0, d) => s.slice(0, Math.round(s.length * clamp((lt - t0) / d)));

// Editorial on-screen type: solid blocks, hard drop shadows, no glows. Text colour on a block is chosen
// for contrast; the accent colours come from the muted film palette in core.js.
const HARD = 'rgba(8,6,4,0.55)';
const hard = (ctx, dy = 6) => { ctx.shadowColor = HARD; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = dy; };
const unhard = ctx => { ctx.shadowColor = 'transparent'; ctx.shadowOffsetY = 0; };
const lum = hex => { const n = parseInt(hex.replace('#', '').slice(0, 6), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };

// "NEW YORK · 1956": small caps on a thin rule, year in the accent colour
export function placeStamp(ctx, lt, place, year, { y = 150, a = 1, t0 = 0 } = {}) {
  const u = ease.out(clamp((lt - t0) / 0.35)) * a;
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= u; ctx.font = sans(30, 800); ctx.letterSpacing = '6px';
  const s1 = place.toUpperCase(), w1 = ctx.measureText(s1).width, w2 = ctx.measureText(year).width, gap = 46;
  const x0 = W / 2 - (w1 + gap + w2) / 2, yy = y + (1 - u) * 14;
  ctx.textAlign = 'left'; hard(ctx, 3);
  ctx.fillStyle = C.cream; ctx.fillText(s1, x0, yy); qaRect(ctx, x0, yy - 26, w1 + gap + w2, 46, 'text', place);
  ctx.fillStyle = C.gold; ctx.fillRect(x0 + w1 + gap / 2 - 3, yy - 22, 6, 6); ctx.fillText(year, x0 + w1 + gap, yy);
  unhard(ctx); ctx.fillStyle = rgba(C.cream, 0.5); ctx.fillRect(W / 2 - (w1 + gap + w2) / 2 * u, yy + 16, (w1 + gap + w2) * u, 2);
  ctx.restore();
}

// character title: serif name, a short accent bar, small-caps subtitle (typed)
export function nameTitle(ctx, lt, name, sub, { y = 230, a = 1, t0 = 0, subColor = C.gold, size = 64 } = {}) {
  const u = ease.out(clamp((lt - t0) / 0.4)) * a;
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= u; ctx.textAlign = 'center';
  ctx.font = serif(size, 700); ctx.letterSpacing = '1px'; hard(ctx, 5); ctx.fillStyle = C.cream;
  ctx.fillText(name, W / 2, y + (1 - u) * 18); unhard(ctx);
  { const nw = ctx.measureText(name).width; qaRect(ctx, W / 2 - nw / 2, y - size * 0.75, nw, size * 0.75 + (sub ? 72 : 28), 'text', name); }
  ctx.fillStyle = subColor; ctx.fillRect(W / 2 - 40 * u, y + 22, 80 * u, 5);
  if (sub) { ctx.font = sans(24, 800); ctx.letterSpacing = '6px'; hard(ctx, 3); ctx.fillStyle = C.cream; ctx.fillText(typed(sub, lt, t0 + 0.25, 0.5), W / 2, y + 62); }
  ctx.restore();
}

// big number: heavy sans in cream with a hard shadow; the label sits on a small accent block
export function counter(ctx, value, label, { x = W / 2, y = 330, size = 150, color = C.cream, glow = null, a = 1, labelColor = C.gold } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.textAlign = 'center';
  ctx.font = sans(size * 0.92, 900); ctx.letterSpacing = '0px';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.06; ctx.strokeStyle = 'rgba(10,8,6,0.55)'; ctx.strokeText(value, x, y);
  hard(ctx, size * 0.06); ctx.fillStyle = color === '#EAF7F3' ? C.cream : color; ctx.fillText(value, x, y); unhard(ctx);
  { const vw = ctx.measureText(value).width; qaRect(ctx, x - vw / 2, y - size * 0.7, vw, size * 0.72, 'text', value); }
  if (label) {
    ctx.font = sans(24, 800); ctx.letterSpacing = '5px'; const w = ctx.measureText(label).width + 30;
    ctx.fillStyle = labelColor; hard(ctx, 4); ctx.fillRect(x - w / 2, y + 26, w, 40); unhard(ctx); qaRect(ctx, x - w / 2, y + 26, w, 40, 'text', label);
    ctx.fillStyle = lum(labelColor) > 0.55 ? C.ink : C.cream; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 2, y + 47);
  }
  ctx.restore();
}

// solid label block (slightly tilted), dark or light text for contrast, optional small subline
export function badge(ctx, text, x, y, { color = C.gold, size = 40, a = 1, scale = 1, sub = null, fill = null } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(-0.018); ctx.scale(scale, scale);
  ctx.font = sans(size, 900); ctx.letterSpacing = '1px';
  const w = ctx.measureText(text).width + size * 0.9, h = size * (sub ? 1.95 : 1.42);
  hard(ctx, Math.max(4, size * 0.14)); ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fill(); unhard(ctx); qaRect(ctx, -w / 2, -h / 2, w, h, 'text', text);
  const ink = lum(color) > 0.55 ? C.ink : C.cream;
  ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, sub ? -size * 0.3 : size * 0.04);
  if (sub) { ctx.font = sans(size * 0.4, 800); ctx.letterSpacing = '3px'; ctx.globalAlpha *= 0.8; ctx.fillText(sub, 0, size * 0.5); }
  ctx.restore();
}

// rubber stamp that slams in (SOLD, FORFEIT…): ink outline with a worn texture, no glow
export function stamp(ctx, text, x, y, lt, t0, { color = C.red, size = 96, rot = -0.18, sub = null } = {}) {
  const u = clamp((lt - t0) / 0.18);
  if (lt < t0) return;
  const s = lerp(2.4, 1, ease.out(u));
  ctx.save(); ctx.globalAlpha *= clamp(u * 1.5) * 0.92; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.font = sans(size, 900); ctx.letterSpacing = '4px'; const w = ctx.measureText(text).width + 64, h = size * (sub ? 1.75 : 1.35);
  ctx.strokeStyle = color; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.stroke(); if (u >= 1) qaRect(ctx, -w / 2, -h / 2, w, h, 'text', text);
  ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 6); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, sub ? -size * 0.18 : 4);
  if (sub) { ctx.font = sans(size * 0.24, 800); ctx.letterSpacing = '5px'; ctx.fillText(sub, 0, size * 0.5); }
  // worn ink: knock out small specks
  ctx.globalCompositeOperation = 'destination-out';
  let r = 7; for (let i = 0; i < 70; i++) { r = (r * 16807) % 2147483647; const px = (r % 1000) / 1000 * w - w / 2; r = (r * 16807) % 2147483647; const py = (r % 1000) / 1000 * h - h / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.arc(px, py, 2 + (r % 5), 0, 7); ctx.fill(); }
  ctx.restore();
}

// fighting-game health bar for a "boss"
export function healthBar(ctx, name, label, pct, { y = 150, a = 1, x0 = 150, x1 = 930 } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  glowText(ctx, name, x0, y, { font: serif(46, 700), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 10, align: 'left' });
  glowText(ctx, label, x1, y, { font: mono(26, 800), fill: '#F08A6C', glow: 'rgba(0,0,0,0.9)', blur: 8, align: 'right', spacing: 5 });
  const by = y + 24, bh = 26, w = x1 - x0;
  ctx.fillStyle = '#0B0D0F'; ctx.strokeStyle = '#C9A066'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x0, by, w, bh, 13); ctx.fill(); ctx.stroke();
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#E2533E'); g.addColorStop(1, '#FF8A5C');
  ctx.save(); ctx.beginPath(); ctx.roundRect(x0 + 3, by + 3, w - 6, bh - 6, 10); ctx.clip();
  ctx.fillStyle = g; ctx.fillRect(x0 + 3, by + 3, (w - 6) * clamp(pct), bh - 6); ctx.restore();
  ctx.font = mono(20, 800); ctx.fillStyle = '#fff'; ctx.textAlign = 'right'; ctx.fillText(`${Math.round(pct * 100)}%`, x1 - 14, by + 20);
  ctx.restore();
}

// two-name scoreboard with big score digits
export function scoreboard(ctx, left, right, sl, sr, { y = 300, a = 1, hiL = false, hiR = false, flashR = 0, flashL = 0, title = null } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const w = 860, h = 210, x = W / 2 - w / 2;
  ctx.fillStyle = 'rgba(10,12,14,0.88)'; ctx.strokeStyle = rgba(C.gold, 0.8); ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, 22); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  if (title) glowText(ctx, title, W / 2, y - h / 2 + 40, { font: mono(24, 800), fill: rgba(C.gold, 0.9), glow: 'rgba(0,0,0,0)', blur: 0, spacing: 6 });
  ctx.font = serif(36, 700); ctx.textAlign = 'center'; ctx.fillStyle = hiL ? C.red : C.cream; ctx.fillText(left, x + 170, y + 78);
  ctx.fillStyle = hiR ? C.lime : C.cream; ctx.fillText(right, x + w - 170, y + 78);
  const dig = (s, cx, fl, col) => glowText(ctx, s, cx, y + 36, { font: mono(108, 800), fill: fl > 0 ? '#ffffff' : col, glow: col, blur: 20 + fl * 40 });
  dig(sl, x + 170, flashL, C.red); dig(sr, x + w - 170, flashR, C.lime);
  glowText(ctx, '–', W / 2, y + 30, { font: mono(90, 800), fill: rgba('#ffffff', 0.6), glow: 'rgba(0,0,0,0)', blur: 0 });
  ctx.restore();
}

// split-screen VS card background halves + label
export function vsSplit(ctx, lt, { left = '#7A1E22', right = '#16405E', a = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= a;
  const off = (1 - ease.out(clamp(lt / 0.4))) * 600;
  ctx.fillStyle = left; ctx.beginPath(); ctx.moveTo(-off, 0); ctx.lineTo(W * 0.62 - off, 0); ctx.lineTo(W * 0.38 - off, H); ctx.lineTo(-off, H); ctx.fill();
  ctx.fillStyle = right; ctx.beginPath(); ctx.moveTo(W * 0.62 + off, 0); ctx.lineTo(W + off, 0); ctx.lineTo(W + off, H); ctx.lineTo(W * 0.38 + off, H); ctx.fill();
  ctx.restore();
}
export function vsLabel(ctx, lt, t0, x = W / 2, y = 560) {
  if (lt < t0) return;
  const s = lerp(3, 1, ease.out(clamp((lt - t0) / 0.2)));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.08);
  outlinedText(ctx, 'VS', 0, 0, { font: sans(170, 900), fill: C.gold, sw: 16 });
  ctx.restore();
}

// old-paper document (executive order)
export function paper(ctx, x, y, w, h, { rot = 0, title = '', lines = 7, seal = true, a = 1 } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#EFE6D2'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#2B2620'; ctx.font = serif(34, 700); ctx.textAlign = 'center';
  title.split('\n').forEach((s, i) => ctx.fillText(s, 0, -h / 2 + 80 + i * 42));
  ctx.fillStyle = 'rgba(43,38,32,0.35)';
  for (let i = 0; i < lines; i++) ctx.fillRect(-w / 2 + 50, -h / 2 + 200 + i * 34, w - 100 - (i % 3) * 60, 10);
  if (seal) { ctx.strokeStyle = '#7B2B33'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w / 2 - 90, h / 2 - 90, 46, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(w / 2 - 90, h / 2 - 90, 34, 0, 7); ctx.stroke(); }
  ctx.restore();
}

export { serif, mono, sans };
