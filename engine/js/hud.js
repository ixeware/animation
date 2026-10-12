// On-screen graphics: name titles, place/date stamps, counters, scoreboard, health bar, badges, stamps.
import { W, H, C, rgba, clamp, ease, inv, lerp } from './core.js';
import { glowText, outlinedText } from './draw.js';

const serif = (s, w = 700) => `${w} ${s}px Cinzel`;
const mono = (s, w = 700) => `${w} ${s}px "JetBrains Mono"`;
const sans = (s, w = 800) => `${w} ${s}px Rubik`;

// typewriter reveal of a string over [t0, t0+d]
const typed = (s, lt, t0, d) => s.slice(0, Math.round(s.length * clamp((lt - t0) / d)));

// "NEW YORK · 1956" small serif caps, year in gold
export function placeStamp(ctx, lt, place, year, { y = 150, a = 1, t0 = 0 } = {}) {
  const u = ease.out(clamp((lt - t0) / 0.35)) * a;
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= u; ctx.font = serif(34, 700); ctx.letterSpacing = '4px';
  const s1 = place.toUpperCase() + '  ·  ', w1 = ctx.measureText(s1).width, w2 = ctx.measureText(year).width;
  const x0 = W / 2 - (w1 + w2) / 2;
  ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
  ctx.fillStyle = C.cream; ctx.fillText(s1, x0, y + (1 - u) * 14);
  ctx.fillStyle = C.gold; ctx.fillText(year, x0 + w1, y + (1 - u) * 14);
  ctx.restore();
}

// character title: serif name + mono subtitle (typed)
export function nameTitle(ctx, lt, name, sub, { y = 230, a = 1, t0 = 0, subColor = C.lime, size = 64 } = {}) {
  const u = ease.out(clamp((lt - t0) / 0.4)) * a;
  if (u <= 0) return;
  ctx.save(); ctx.globalAlpha *= u;
  glowText(ctx, name, W / 2, y + (1 - u) * 18, { font: serif(size, 700), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 16, spacing: 1 });
  if (sub) glowText(ctx, typed(sub, lt, t0 + 0.25, 0.5), W / 2, y + 50, { font: mono(26, 700), fill: subColor, glow: 'rgba(0,0,0,0.9)', blur: 10, spacing: 5 });
  ctx.restore();
}

// big glowing number with a small mono label under it
export function counter(ctx, value, label, { x = W / 2, y = 330, size = 150, color = '#EAF7F3', glow = C.teal, a = 1, labelColor = C.teal } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  glowText(ctx, value, x, y, { font: mono(size, 800), fill: color, glow, blur: 34 });
  if (label) glowText(ctx, label, x, y + 52, { font: mono(26, 700), fill: labelColor, glow: 'rgba(0,0,0,0.8)', blur: 8, spacing: 6 });
  ctx.restore();
}

// rounded badge with glowing border
export function badge(ctx, text, x, y, { color = C.gold, size = 40, a = 1, scale = 1, sub = null, fill = 'rgba(12,14,16,0.85)' } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.font = sans(size, 900); const w = ctx.measureText(text).width + size * 1.1, h = size * (sub ? 2.0 : 1.55);
  ctx.shadowColor = color; ctx.shadowBlur = 26; ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, sub ? -size * 0.28 : 2);
  if (sub) { ctx.font = mono(size * 0.42, 700); ctx.fillStyle = rgba('#ffffff', 0.75); ctx.letterSpacing = '3px'; ctx.fillText(sub, 0, size * 0.52); }
  ctx.restore();
}

// rubber stamp that slams in (FORFEIT, WARRANT...)
export function stamp(ctx, text, x, y, lt, t0, { color = C.red, size = 96, rot = -0.18, sub = null } = {}) {
  const u = clamp((lt - t0) / 0.18);
  if (lt < t0) return;
  const s = lerp(2.4, 1, ease.out(u));
  ctx.save(); ctx.globalAlpha *= clamp(u * 1.5); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.font = sans(size, 900); const w = ctx.measureText(text).width + 60, h = size * (sub ? 1.75 : 1.35);
  ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.shadowColor = rgba(color, 0.6); ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 16); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, sub ? -size * 0.18 : 4);
  if (sub) { ctx.font = mono(size * 0.26, 800); ctx.letterSpacing = '4px'; ctx.fillText(sub, 0, size * 0.5); }
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
