// Flat Staunton-style piece sprites: cream whites with soft volume, slate blacks with a light rim.
import { makeCanvas, rgba } from './core.js';
import { LOOK } from './look.js';

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

// LOOK v2 (as @chess.history): chunkier Staunton shapes on a wide plinth, drawn like stickers
function base2(p) {
  p.roundRect(-44, -16, 88, 16, [7, 7, 5, 5]);
  p.roundRect(-36, -27, 72, 13, 6);
}
function body2(p, y0, w0, y1, w1) {  // a flared body: wide at the plinth, narrow under the collar, concave sides
  p.moveTo(-w0 / 2, y0);
  p.bezierCurveTo(-w0 / 2 + 2, y0 - 14, -w1 / 2, y1 + 16, -w1 / 2, y1);
  p.lineTo(w1 / 2, y1);
  p.bezierCurveTo(w1 / 2, y1 + 16, w0 / 2 - 2, y0 - 14, w0 / 2, y0);
  p.closePath();
}
const SHAPES2 = {
  p(p) { base2(p); body2(p, -25, 62, -64, 30); collar(p, -66, 30, 7); p.moveTo(25, -91); p.arc(0, -91, 25, 0, Math.PI * 2); },
  r(p) {
    base2(p); body2(p, -25, 64, -96, 54); p.roundRect(-36, -103, 72, 10, 3);
    p.moveTo(-34, -101); p.lineTo(-35, -134); p.lineTo(-19, -134); p.lineTo(-19, -123); p.lineTo(-8, -123); p.lineTo(-8, -134);
    p.lineTo(8, -134); p.lineTo(8, -123); p.lineTo(19, -123); p.lineTo(19, -134); p.lineTo(35, -134); p.lineTo(34, -101); p.closePath();
  },
  b(p) {
    base2(p); body2(p, -25, 56, -74, 26); collar(p, -76, 31, 7);
    p.moveTo(0, -138); p.bezierCurveTo(30, -117, 30, -90, 16, -82); p.lineTo(-16, -82); p.bezierCurveTo(-30, -90, -30, -117, 0, -138); p.closePath();
    p.moveTo(8, -144); p.arc(0, -144, 8, 0, Math.PI * 2);
  },
  q(p) {
    base2(p); body2(p, -25, 60, -88, 28); collar(p, -90, 34, 8);
    p.moveTo(-20, -96); p.lineTo(-35, -127); p.lineTo(-19, -113); p.lineTo(-11, -134); p.lineTo(0, -115); p.lineTo(11, -134);
    p.lineTo(19, -113); p.lineTo(35, -127); p.lineTo(20, -96); p.closePath();
    for (const [x, y, r] of [[-36, -130, 7], [-11, -138, 7], [11, -138, 7], [36, -130, 7], [0, -144, 8]]) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
  },
  k(p) {
    base2(p); body2(p, -25, 62, -92, 30); collar(p, -94, 34, 8);
    p.moveTo(-20, -100); p.bezierCurveTo(-34, -112, -32, -131, -14, -133); p.lineTo(14, -133);
    p.bezierCurveTo(32, -131, 34, -112, 20, -100); p.closePath();
    p.roundRect(-7, -160, 14, 30, 4); p.roundRect(-17, -152, 34, 12, 4);
  },
  n(p) {
    base2(p);
    p.moveTo(35, -25); p.bezierCurveTo(45, -56, 43, -92, 29, -114);
    p.bezierCurveTo(23, -126, 15, -134, 10, -138); p.lineTo(8, -152); p.lineTo(-5, -138);
    p.bezierCurveTo(-20, -134, -34, -121, -42, -104); p.lineTo(-50, -86);
    p.bezierCurveTo(-53, -76, -44, -70, -35, -72); p.lineTo(-16, -79);
    p.bezierCurveTo(-10, -70, -21, -55, -29, -44); p.bezierCurveTo(-36, -36, -38, -29, -36, -25); p.closePath();
  },
};
const COLLAR2 = { p: [-66, 30, 7], b: [-76, 31, 7], q: [-90, 34, 8], k: [-94, 34, 8] };
const SW2 = 132, SH2 = 186, BASE2 = 14;  // v2 sprite box: base line BASE2 units above the bottom edge

// thick outline around the outer silhouette only (stroke first, body over it), flat body with a soft cylindrical
// shade, details (collars, band, plinth step, eye, mane) in the outline colour
function paint2(type, color, glow) {
  const c = makeCanvas(SW2 * S, SH2 * S), g = c.getContext('2d'); c.base = SH2 - BASE2;
  g.translate(SW2 * S / 2, (SH2 - BASE2) * S); g.scale(S, S);
  const p = new Path2D(); SHAPES2[type](p);
  const white = color === 'w', rim = white ? '#A3ADB7' : '#8B99A7';
  if (glow) { g.save(); g.shadowColor = glow; g.shadowBlur = 26; g.fillStyle = glow; g.fill(p); g.restore(); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = rim; g.lineWidth = 12; g.stroke(p);
  const grad = g.createLinearGradient(-44, 0, 44, 0);
  if (white) { grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(0.5, '#F3F5F7'); grad.addColorStop(1, '#C8CFD6'); }
  else { grad.addColorStop(0, '#53606C'); grad.addColorStop(0.45, '#3D4752'); grad.addColorStop(1, '#2A323A'); }
  g.fillStyle = grad; g.fill(p);
  g.save(); g.clip(p);
  const v = g.createLinearGradient(0, 0, 0, -60); v.addColorStop(0, rgba('#000000', white ? 0.12 : 0.24)); v.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = v; g.fillRect(-66, -60, 132, 74);
  g.fillStyle = rgba('#FFFFFF', white ? 0.6 : 0.1); g.fillRect(-25, -175, 9, 175);
  g.restore();
  g.strokeStyle = rgba(rim, white ? 0.9 : 0.8); g.lineWidth = 3.2;
  g.beginPath(); g.moveTo(-35, -16); g.lineTo(35, -16); g.stroke();
  if (COLLAR2[type]) { const [y, rx, ry] = COLLAR2[type]; g.beginPath(); g.ellipse(0, y, rx - 1.5, ry - 1.5, 0, 0, Math.PI * 2); g.stroke(); }
  if (type === 'r') { g.beginPath(); g.moveTo(-34, -98); g.lineTo(34, -98); g.stroke(); }
  if (type === 'b') { g.beginPath(); g.moveTo(-7, -122); g.lineTo(10, -105); g.stroke(); }
  if (type === 'n') {
    g.fillStyle = white ? '#4A535B' : '#C4CED7'; g.beginPath(); g.ellipse(-14, -112, 4.5, 5.5, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(11, -130); g.bezierCurveTo(27, -104, 31, -72, 25, -42); g.stroke();
  }
  return c;
}

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
  const key = (LOOK.v2 ? 'v2' : '') + type + color + (glow || '');
  if (!cache.has(key)) { const c = LOOK.v2 ? paint2(type, color, glow) : paint(type, color, glow); c.base = c.base ?? SH - 10; cache.set(key, c); }
  return cache.get(key);
}

// draw a piece standing at (x, y=base) with pixel height h (king-relative scale)
export function drawPiece(ctx, type, color, x, y, h, { blur = 0, alpha = 1, glow = null, rot = 0, sx = 1, sy = 1 } = {}) {
  const img = sprite(type, color, glow);
  const s = h / 150, w = img.width / S * s, hh = img.height / S * s;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (blur > 0.6) ctx.filter = `blur(${blur.toFixed(1)}px)`;
  ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
  ctx.drawImage(img, -w / 2, -img.base * s, w, hh);
  ctx.restore();
}

// sprite geometry for effects that need to cut a piece into fragments
export function spriteBox(h) {
  const s = h / 150, [sw, sh, base] = LOOK.v2 ? [SW2, SH2, SH2 - BASE2] : [SW, SH, SH - 10];
  return { w: sw * s, h: sh * s, top: -base * s };
}
