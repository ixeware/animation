// Flat Staunton-style piece sprites: cream whites with soft volume, slate blacks with a light rim.
import { makeCanvas, rgba } from './core.js';

const S = 2.4;               // sprite resolution multiplier (units -> px)
const SW = 120, SH = 170;    // sprite box in units; base at (0,0), x in [-60,60], y in [-160,10]

function base(p) {
  p.roundRect(-42, -15, 84, 15, [6, 6, 4, 4]);
  p.roundRect(-35, -24, 70, 11, 5);
}
function stem(p, y0, w0, y1, w1) {
  p.moveTo(-w0 / 2, y0);
  p.bezierCurveTo(-w0 / 2 + 4, (y0 + y1) / 2, -w1 / 2 - 2, y1 + 6, -w1 / 2, y1);
  p.lineTo(w1 / 2, y1);
  p.bezierCurveTo(w1 / 2 + 2, y1 + 6, w0 / 2 - 4, (y0 + y1) / 2, w0 / 2, y0);
  p.closePath();
}
const collar = (p, y, rx, ry) => p.ellipse(0, y, rx, ry, 0, 0, Math.PI * 2);

const SHAPES = {
  p(p) { base(p); stem(p, -22, 50, -62, 24); collar(p, -64, 26, 6); p.moveTo(22, -86); p.arc(0, -86, 22, 0, Math.PI * 2); },
  r(p) {
    base(p); stem(p, -22, 58, -88, 46);
    p.moveTo(-32, -88); p.lineTo(32, -88); p.lineTo(34, -116); p.lineTo(21, -116); p.lineTo(21, -106);
    p.lineTo(7, -106); p.lineTo(7, -116); p.lineTo(-7, -116); p.lineTo(-7, -106); p.lineTo(-21, -106);
    p.lineTo(-21, -116); p.lineTo(-34, -116); p.closePath();
  },
  b(p) {
    base(p); stem(p, -22, 50, -70, 22); collar(p, -72, 28, 6);
    p.moveTo(0, -130); p.bezierCurveTo(26, -112, 28, -86, 14, -78); p.lineTo(-14, -78);
    p.bezierCurveTo(-28, -86, -26, -112, 0, -130); p.closePath();
    p.moveTo(7, -137); p.arc(0, -137, 7, 0, Math.PI * 2);
  },
  q(p) {
    base(p); stem(p, -22, 54, -84, 24); collar(p, -86, 32, 7);
    p.moveTo(-17, -92); p.lineTo(-31, -122); p.lineTo(-15, -108); p.lineTo(-8, -128); p.lineTo(0, -110);
    p.lineTo(8, -128); p.lineTo(15, -108); p.lineTo(31, -122); p.lineTo(17, -92); p.closePath();
    for (const [x, y] of [[-31, -124], [-8, -130], [8, -130], [31, -124]]) { p.moveTo(x + 6, y); p.arc(x, y, 6, 0, Math.PI * 2); }
    p.moveTo(8, -136); p.arc(0, -136, 8, 0, Math.PI * 2);
  },
  k(p) {
    base(p); stem(p, -22, 56, -88, 26); collar(p, -90, 32, 7);
    p.moveTo(-18, -95); p.bezierCurveTo(-30, -108, -30, -126, -12, -128); p.lineTo(12, -128);
    p.bezierCurveTo(30, -126, 30, -108, 18, -95); p.closePath();
    p.roundRect(-5, -158, 10, 32, 2); p.roundRect(-14, -148, 28, 9, 2);
  },
  n(p) {
    base(p);
    p.moveTo(32, -22); p.bezierCurveTo(40, -50, 40, -84, 26, -108);
    p.bezierCurveTo(20, -120, 12, -128, 8, -132); p.lineTo(6, -146); p.lineTo(-4, -132);
    p.bezierCurveTo(-18, -128, -30, -116, -38, -100); p.lineTo(-46, -84);
    p.bezierCurveTo(-48, -76, -40, -70, -32, -72); p.lineTo(-14, -78);
    p.bezierCurveTo(-8, -70, -18, -56, -26, -44); p.bezierCurveTo(-32, -36, -34, -28, -32, -22); p.closePath();
  },
};

const cache = new Map();

function paint(type, color, glow) {
  const c = makeCanvas(SW * S, SH * S), g = c.getContext('2d');
  g.translate(SW * S / 2, (SH - 10) * S); g.scale(S, S);
  const p = new Path2D(); SHAPES[type](p);
  const white = color === 'w';
  if (glow) { g.save(); g.shadowColor = glow; g.shadowBlur = 26; g.fillStyle = glow; g.fill(p); g.restore(); }
  // rim / outline
  g.lineJoin = 'round';
  g.strokeStyle = white ? 'rgba(150,158,166,0.9)' : 'rgba(178,192,200,0.95)';
  g.lineWidth = white ? 3 : 5; g.stroke(p);
  // body
  const grad = g.createLinearGradient(-45, 0, 45, 0);
  if (white) { grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.55, '#EEF0F1'); grad.addColorStop(1, '#C3C9CE'); }
  else { grad.addColorStop(0, '#83909A'); grad.addColorStop(0.5, '#5E6A72'); grad.addColorStop(1, '#3B444B'); }
  g.fillStyle = grad; g.fill(p);
  // soft bottom occlusion + left sheen
  g.save(); g.clip(p);
  const v = g.createLinearGradient(0, 0, 0, -160);
  v.addColorStop(0, rgba('#000000', white ? 0.16 : 0.25)); v.addColorStop(0.2, 'rgba(0,0,0,0)');
  g.fillStyle = v; g.fillRect(-60, -170, 120, 180);
  g.fillStyle = rgba('#ffffff', white ? 0.55 : 0.18); g.fillRect(-30, -170, 7, 170);
  g.restore();
  if (type === 'n') { // eye + mane line
    g.fillStyle = white ? '#4a5258' : '#1d2327'; g.beginPath(); g.ellipse(-12, -108, 4, 5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = white ? 'rgba(120,128,136,0.7)' : 'rgba(20,26,30,0.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(10, -126); g.bezierCurveTo(26, -100, 30, -70, 24, -40); g.stroke();
  }
  if (type === 'b') { g.strokeStyle = white ? '#9aa2a8' : '#2a3136'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, -116); g.lineTo(10, -100); g.stroke(); }
  return c;
}

export function sprite(type, color, glow = null) {
  const key = type + color + (glow || '');
  if (!cache.has(key)) cache.set(key, paint(type, color, glow));
  return cache.get(key);
}

// draw a piece standing at (x, y=base) with pixel height h (king-relative scale)
export function drawPiece(ctx, type, color, x, y, h, { blur = 0, alpha = 1, glow = null, rot = 0, sx = 1 } = {}) {
  const img = sprite(type, color, glow);
  const s = h / 150, w = SW * s, hh = SH * s;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (blur > 0.6) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, 1);
  ctx.drawImage(img, -w / 2, -(SH - 10) * s, w, hh);
  ctx.restore();
}
