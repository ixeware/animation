// Flat cartoon character rig: big head, bust, ball hands, expressive brows/lids/mouth.
// drawChar(ctx, who, {x, y, s, e: expression, t}) — (x, y) is the head center, s scale (head ~210px wide at s=1).
import { rgba, clamp, lerp, smooth, track } from './core.js';
import { sweatDrop } from './draw.js';

const SKIN = { base: '#F2C39C', shade: '#E2A984', deep: '#C98B66', blush: '#F28B82' };

export const CAST = {
  bobby13: { face: [0.96, 0.98, 0.9], hair: 'fringe', hairC: '#4A3324', brow: '#3B2A1E', suit: '#6FA3C7', suitD: '#4E7FA3', shirt: 'polo', ears: 1.05 },
  bobby72: { face: [0.94, 1.08, 0.82], hair: 'swept', hairC: '#3A2A20', brow: '#2E2119', suit: '#26324A', suitD: '#1A2336', shirt: 'tie', tie: '#1B1F2A', ears: 1 },
  bobbyBeard: { face: [0.94, 1.06, 0.82], hair: 'messy', hairC: '#3A2A20', brow: '#2E2119', suit: '#6B5240', suitD: '#4E3B2E', shirt: 'open', beard: '#3A2A20', ears: 1 },
  bobbyOld: { face: [0.98, 1.04, 0.9], hair: 'cap', hairC: '#E9E6E0', brow: '#D9D4CC', suit: '#2F3A3F', suitD: '#202A2E', shirt: 'puffer', beard: '#ECE9E3', beardBig: true, cap: '#27354F', ears: 1 },
  spassky: { face: [1.0, 1.02, 0.92], hair: 'wavy', hairC: '#A47B4E', brow: '#7A5735', suit: '#5C636B', suitD: '#41474E', shirt: 'tie', tie: '#7B2B33', ears: 1 },
  byrne: { face: [0.92, 1.06, 0.86], hair: 'receding', hairC: '#3E3228', brow: '#3E3228', suit: '#6E5640', suitD: '#523F2F', shirt: 'bow', tie: '#6E1F2B', glasses: true, ears: 1 },
};

export const EXPR = {
  neutral: { brow: 0, browY: 0, lid: 0.12, look: [0, 0], mouth: 'line', curve: 0.1, open: 0 },
  smug: { brow: 0.25, browY: 4, lid: 0.48, look: [0.3, 0.1], mouth: 'smirk', curve: 0.6, open: 0, browTilt: 0.35 },
  focus: { brow: 0.55, browY: 6, lid: 0.3, look: [0, 0.4], mouth: 'line', curve: -0.05, open: 0 },
  angry: { brow: 0.9, browY: 10, lid: 0.25, look: [0, 0], mouth: 'grit', curve: -0.3, open: 0.3 },
  worried: { brow: -0.8, browY: -6, lid: 0.05, look: [0, 0], mouth: 'line', curve: -0.45, open: 0, sweat: 1 },
  shock: { brow: -0.5, browY: -16, lid: 0, look: [0, 0], mouth: 'o', curve: 0, open: 0.8, pupil: 0.55, sweat: 1 },
  happy: { brow: -0.15, browY: -6, lid: 0.15, look: [0, 0], mouth: 'smile', curve: 0.9, open: 0.45, blush: 0.6 },
  triumph: { brow: 0.1, browY: -8, lid: 0.55, look: [0, -0.2], mouth: 'smile', curve: 1, open: 0.7, blush: 0.5 },
  sad: { brow: -0.85, browY: -2, lid: 0.45, look: [0, 0.5], mouth: 'line', curve: -0.6, open: 0 },
  paranoid: { brow: -0.6, browY: -8, lid: 0, look: [1, 0], mouth: 'line', curve: -0.35, open: 0, pupil: 0.65, sweat: 1 },
  tired: { brow: -0.3, browY: 2, lid: 0.6, look: [0, 0.3], mouth: 'line', curve: -0.2, open: 0 },
  blind: { brow: 0, browY: 0, lid: 1, look: [0, 0], mouth: 'line', curve: 0, open: 0 },
};

// blend expression keyframes: keys = [[t, 'name' | {...}], ...]
export function exprAt(keys, t) {
  const get = k => (typeof k === 'string' ? EXPR[k] : { ...EXPR.neutral, ...k });
  // the active key is the last one whose time has passed; we blend into it from the previous key over 0.2 s
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
  const cur = get(keys[i][1]);
  if (i === 0) return cur;
  const prev = get(keys[i - 1][1]);
  const u = smooth(clamp((t - keys[i][0]) / 0.2));
  if (u >= 1) return cur;
  const out = {};
  for (const k of new Set([...Object.keys(prev), ...Object.keys(cur)])) {
    const va = prev[k] ?? EXPR.neutral[k] ?? 0, vb = cur[k] ?? EXPR.neutral[k] ?? 0;
    out[k] = typeof va === 'number' ? lerp(va, vb, u) : Array.isArray(va) ? va.map((x, j) => lerp(x, vb[j], u)) : (u < 0.5 ? va : vb);
  }
  return out;
}

function headPath(fw, fh, jaw) {
  const p = new Path2D();
  const w = 100 * fw, h = 125 * fh;
  p.moveTo(0, -h);
  p.bezierCurveTo(w * 0.62, -h, w, -h * 0.62, w, -h * 0.12);
  p.bezierCurveTo(w, h * 0.38, w * jaw * 0.95, h * 0.72, w * 0.42, h * 0.92);
  p.bezierCurveTo(w * 0.22, h * 1.02, -w * 0.22, h * 1.02, -w * 0.42, h * 0.92);
  p.bezierCurveTo(-w * jaw * 0.95, h * 0.72, -w, h * 0.38, -w, -h * 0.12);
  p.bezierCurveTo(-w, -h * 0.62, -w * 0.62, -h, 0, -h);
  return p;
}

function body(g, c, open) {
  // neck
  g.fillStyle = SKIN.shade; g.fillRect(-24, 90, 48, 70);
  // torso
  const p = new Path2D();
  p.moveTo(-210, 520); p.bezierCurveTo(-205, 260, -170, 170, -60, 150);
  p.lineTo(60, 150); p.bezierCurveTo(170, 170, 205, 260, 210, 520); p.closePath();
  const gr = g.createLinearGradient(-200, 0, 200, 0); gr.addColorStop(0, c.suit); gr.addColorStop(1, c.suitD);
  g.fillStyle = gr; g.fill(p);
  if (c.shirt === 'tie' || c.shirt === 'bow' || c.shirt === 'open') {
    g.fillStyle = '#F4F2EE'; g.beginPath(); g.moveTo(-40, 148); g.lineTo(40, 148); g.lineTo(0, 260); g.closePath(); g.fill();
    g.fillStyle = c.suitD; // lapels
    g.beginPath(); g.moveTo(-62, 150); g.lineTo(-8, 300); g.lineTo(-70, 230); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(62, 150); g.lineTo(8, 300); g.lineTo(70, 230); g.closePath(); g.fill();
  }
  if (c.shirt === 'tie') { g.fillStyle = c.tie; g.beginPath(); g.moveTo(-10, 160); g.lineTo(10, 160); g.lineTo(14, 250); g.lineTo(0, 268); g.lineTo(-14, 250); g.closePath(); g.fill(); }
  if (c.shirt === 'bow') { g.fillStyle = c.tie; g.beginPath(); g.moveTo(0, 165); g.lineTo(-26, 152); g.lineTo(-26, 180); g.closePath(); g.moveTo(0, 165); g.lineTo(26, 152); g.lineTo(26, 180); g.closePath(); g.fill(); g.beginPath(); g.arc(0, 165, 7, 0, 7); g.fill(); }
  if (c.shirt === 'polo') {
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let y = 190; y < 520; y += 44) { g.save(); g.clip(p); g.fillRect(-220, y, 440, 18); g.restore(); }
    g.fillStyle = '#F4F2EE'; g.beginPath(); g.moveTo(-46, 146); g.lineTo(0, 196); g.lineTo(-30, 205); g.closePath(); g.moveTo(46, 146); g.lineTo(0, 196); g.lineTo(30, 205); g.closePath(); g.fill();
  }
  if (c.shirt === 'puffer') {
    g.save(); g.clip(p); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 6;
    for (let y = 200; y < 520; y += 60) { g.beginPath(); g.moveTo(-220, y); g.quadraticCurveTo(0, y + 18, 220, y); g.stroke(); }
    g.restore(); g.fillStyle = '#1A2226'; g.fillRect(-4, 150, 8, 370);
    g.fillStyle = c.suitD; g.beginPath(); g.ellipse(0, 150, 70, 26, 0, 0, 7); g.fill();
  }
  if (c.shirt === 'open') { g.fillStyle = '#D8D2C8'; g.beginPath(); g.moveTo(-30, 150); g.lineTo(30, 150); g.lineTo(0, 200); g.closePath(); g.fill(); }
}

function hairBack(g, c, fw) {
  g.fillStyle = c.hairC;
  if (c.hair === 'messy') { g.beginPath(); g.ellipse(0, -20, 118 * fw, 125, 0, 0, 7); g.fill(); }
  if (c.hair === 'wavy') { g.beginPath(); g.ellipse(0, -40, 112 * fw, 105, 0, 0, 7); g.fill(); }
}

function hairFront(g, c, fw, fh) {
  const w = 100 * fw, h = 125 * fh;
  g.fillStyle = c.hairC;
  const p = new Path2D();
  switch (c.hair) {
    case 'swept':
      p.moveTo(-w - 4, -10); p.bezierCurveTo(-w - 10, -h * 0.9, -40, -h - 22, 10, -h - 16);
      p.bezierCurveTo(70, -h - 10, w + 10, -h * 0.7, w + 4, -14);
      p.bezierCurveTo(w - 6, -60, w - 20, -78, 50, -82);
      p.bezierCurveTo(10, -86, -30, -100, -44, -92); // side part swoop
      p.bezierCurveTo(-70, -84, -w + 6, -60, -w - 4, -10); break;
    case 'fringe':
      p.moveTo(-w - 4, -6); p.bezierCurveTo(-w - 8, -h * 0.95, -30, -h - 16, 10, -h - 14);
      p.bezierCurveTo(70, -h - 8, w + 8, -h * 0.7, w + 4, -10);
      p.bezierCurveTo(w - 8, -50, w - 26, -62, 40, -66); p.lineTo(26, -56); p.lineTo(8, -68); p.lineTo(-10, -56);
      p.lineTo(-28, -70); p.lineTo(-46, -58); p.bezierCurveTo(-74, -64, -w + 6, -40, -w - 4, -6);
      p.moveTo(-6, -h - 12); p.lineTo(4, -h - 34); p.lineTo(14, -h - 12); break; // cowlick
    case 'messy':
      p.moveTo(-w - 18, 40); p.bezierCurveTo(-w - 30, -h, -30, -h - 40, 20, -h - 24);
      p.bezierCurveTo(90, -h - 20, w + 30, -h * 0.6, w + 18, 40);
      p.lineTo(w - 2, -30); p.bezierCurveTo(60, -80, 20, -70, -10, -86); p.lineTo(-30, -66); p.lineTo(-50, -84);
      p.bezierCurveTo(-80, -60, -w + 4, -40, -w - 18, 40); break;
    case 'wavy':
      p.moveTo(-w - 6, -4); p.bezierCurveTo(-w - 20, -h - 10, -20, -h - 46, 20, -h - 34);
      p.bezierCurveTo(90, -h - 26, w + 22, -h * 0.6, w + 6, -6);
      p.bezierCurveTo(w - 10, -44, w - 30, -70, 60, -66);
      for (let i = 0; i < 5; i++) { const x = 60 - i * 32; p.quadraticCurveTo(x - 16, -94 + (i % 2) * 8, x - 32, -72); }
      p.bezierCurveTo(-100, -60, -w, -40, -w - 6, -4); break;
    case 'receding':
      p.moveTo(-w - 4, 10); p.bezierCurveTo(-w - 6, -60, -w + 6, -90, -70, -100); p.lineTo(-60, -60); p.bezierCurveTo(-80, -40, -w + 8, -10, -w - 4, 10);
      p.moveTo(w + 4, 10); p.bezierCurveTo(w + 6, -60, w - 6, -90, 70, -100); p.lineTo(60, -60); p.bezierCurveTo(80, -40, w - 8, -10, w + 4, 10);
      p.moveTo(-30, -h + 6); p.quadraticCurveTo(0, -h - 10, 30, -h + 6); p.quadraticCurveTo(0, -h + 2, -30, -h + 6); break;
    case 'cap':
      // white hair tufts at the sides
      p.moveTo(-w - 10, 30); p.bezierCurveTo(-w - 22, -10, -w - 10, -60, -w + 14, -70); p.lineTo(-w + 20, 20); p.closePath();
      p.moveTo(w + 10, 30); p.bezierCurveTo(w + 22, -10, w + 10, -60, w - 14, -70); p.lineTo(w - 20, 20); p.closePath(); break;
  }
  g.fill(p);
  // a few highlight strands
  if (c.hair !== 'cap' && c.hair !== 'receding') {
    g.save(); g.clip(p); g.strokeStyle = rgba('#ffffff', 0.07); g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(-60 + i * 30, -h + 4); g.quadraticCurveTo(-30 + i * 34, -h + 40, -10 + i * 36, -h + 30); g.stroke(); }
    g.restore();
  }
  if (c.hair === 'cap') {
    g.fillStyle = c.cap; g.beginPath(); g.moveTo(-w - 6, -48); g.bezierCurveTo(-w - 4, -h - 40, w + 4, -h - 40, w + 6, -48); g.closePath(); g.fill();
    g.fillStyle = '#1C2740'; g.beginPath(); g.ellipse(-16, -48, w + 34, 20, -0.04, 0, 7); g.fill(); // brim
    g.fillStyle = rgba('#ffffff', 0.15); g.beginPath(); g.ellipse(-30, -h + 2, 40, 14, -0.3, 0, 7); g.fill();
  }
}

function eye(g, cx, cy, e, side, t, pupilScale) {
  const rx = 21, ry = 25;
  g.save();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill();
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
  const [lx, ly] = e.look || [0, 0];
  const pr = 9.5 * pupilScale;
  g.fillStyle = '#2A1F1A'; g.beginPath(); g.arc(cx + lx * 9, cy + ly * 10, pr, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(cx + lx * 9 - pr * 0.35, cy + ly * 10 - pr * 0.35, pr * 0.3, 0, 7); g.fill();
  // upper lid (tilted for smug/angry looks)
  const lid = clamp(e.lid);
  if (lid > 0.01) {
    const tilt = (e.browTilt || 0) * side * 8 + (e.brow || 0) * side * 6;
    const ly2 = cy - ry + lid * ry * 2.05;
    g.fillStyle = SKIN.base; g.beginPath(); g.moveTo(cx - rx - 2, cy - ry - 4); g.lineTo(cx + rx + 2, cy - ry - 4);
    g.lineTo(cx + rx + 2, ly2 - tilt); g.lineTo(cx - rx - 2, ly2 + tilt); g.closePath(); g.fill();
    g.strokeStyle = '#3B2A22'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - rx - 2, ly2 + tilt); g.lineTo(cx + rx + 2, ly2 - tilt); g.stroke();
  }
  g.restore();
  g.restore();
}

export function drawChar(g, who, { x = 0, y = 0, s = 1, e = EXPR.neutral, t = 0, tilt = 0, silhouette = false, eyeGlow = null, noBody = false, alpha = 1 } = {}) {
  const c = CAST[who];
  const [fw, fh, jaw] = c.face;
  // idle life: breathing bob + slow head sway
  const ph = who.length * 1.7 + x * 0.01;
  y += Math.sin(t * 1.7 + ph) * 4 * s; tilt += Math.sin(t * 0.8 + ph) * 0.018;
  // reactions: shake (fear/shock jitter), nod (laugh / agreement bounce)
  const sh = e.shake || 0, nod = e.nod || 0, turn = clamp(e.turn || 0, -1, 1);
  x += Math.sin(t * 47) * sh * 6 * s; tilt += Math.sin(t * 39) * sh * 0.03; y += Math.abs(Math.sin(t * 9)) * nod * -10 * s;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.scale(s, s); g.rotate(tilt);
  if (silhouette) g.filter = 'brightness(0)';
  if (!noBody) body(g, c);
  hairBack(g, c, fw);
  // ears
  g.fillStyle = SKIN.shade;
  for (const sd of [-1, 1]) { const k = 1 - clamp(sd * turn, 0, 1) * 0.75; g.beginPath(); g.ellipse(sd * 98 * fw - turn * 10, 8, 18 * c.ears * k, 28 * c.ears, 0, 0, 7); g.fill(); }
  // head with soft side shading
  const hp = headPath(fw, fh, jaw);
  const hg = g.createLinearGradient(-110, 0, 110, 0); hg.addColorStop(0, SKIN.base); hg.addColorStop(0.7, SKIN.base); hg.addColorStop(1, SKIN.shade);
  g.fillStyle = hg; g.fill(hp);
  if (c.beard && !c.beardBig) { // short dark beard
    g.save(); g.clip(hp); g.fillStyle = c.beard; g.beginPath(); g.moveTo(-110, 20); g.bezierCurveTo(-90, 60, -60, 50, -30, 52); g.quadraticCurveTo(0, 46, 30, 52);
    g.bezierCurveTo(60, 50, 90, 60, 110, 20); g.lineTo(110, 200); g.lineTo(-110, 200); g.closePath(); g.fill(); g.restore();
  }
  // blink every ~3.7s unless lids already heavy
  const bt = (t + (who.length * 0.37)) % 3.7, blink = bt < 0.12 ? Math.sin(bt / 0.12 * Math.PI) : 0;
  const ee = { ...e, lid: Math.max(e.lid ?? 0, blink) };
  g.save(); g.translate(turn * 26 * fw, 0);  // head turn: the face slides toward the look direction
  if (silhouette) {
    g.filter = 'none';
    if (eyeGlow) for (const sd of [-1, 1]) { g.save(); g.shadowColor = eyeGlow; g.shadowBlur = 30; g.fillStyle = eyeGlow; g.beginPath(); g.ellipse(sd * 38, -2, 14, 8, sd * 0.25, 0, 7); g.fill(); g.restore(); }
  } else {
    for (const sd of [-1, 1]) eye(g, sd * 38, -2, ee, sd, t, e.pupil ?? 1);
    // brows
    g.fillStyle = c.brow;
    for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * 40, -46 - (e.browY || 0) + (e.brow || 0) * 4);
      g.rotate(-sd * (e.brow || 0) * 0.34 - (sd < 0 ? (e.browTilt || 0) * 0.25 : 0));
      g.beginPath(); g.roundRect(-30, -8, 60, 16, 8); g.fill(); g.restore();
    }
    // nose
    g.save(); g.translate(turn * 12, 0);
    g.fillStyle = SKIN.deep; g.globalAlpha *= 0.55;
    g.beginPath(); g.moveTo(-4, 4); g.quadraticCurveTo(-16, 32, -12, 38); g.quadraticCurveTo(0, 44, 12, 38); g.quadraticCurveTo(4, 30, -4, 4); g.fill();
    g.restore();
    if (e.blush) { g.fillStyle = rgba(SKIN.blush, 0.35 * e.blush); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 58, 40, 20, 11, 0, 0, 7); g.fill(); } }
    if (c.beardBig) { // white bushy beard drawn over the jaw, mouth sits on it
      g.fillStyle = c.beard;
      g.beginPath(); g.moveTo(-96, 0);
      const pts = [[-104, 60], [-92, 120], [-70, 168], [-36, 196], [0, 206], [36, 196], [70, 168], [92, 120], [104, 60], [96, 0]];
      for (const [px, py] of pts) g.quadraticCurveTo(px * 1.08, py + 10, px, py);
      g.bezierCurveTo(70, 40, 30, 40, 0, 44); g.bezierCurveTo(-30, 40, -70, 40, -96, 0); g.fill();
      g.strokeStyle = rgba('#9a958c', 0.5); g.lineWidth = 4;
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 22, 90); g.quadraticCurveTo(i * 26, 140, i * 18, 180); g.stroke(); }
      g.fillStyle = '#DAD6CF'; g.beginPath(); g.ellipse(-26, 52, 34, 13, 0.25, 0, 7); g.ellipse(26, 52, 34, 13, -0.25, 0, 7); g.fill(); // mustache
    }
    mouth(g, e, c);
    if (c.glasses) {
      g.strokeStyle = '#2B2622'; g.lineWidth = 6;
      for (const sd of [-1, 1]) { g.beginPath(); g.roundRect(sd * 38 - 30, -32, 60, 54, 14); g.stroke(); }
      g.beginPath(); g.moveTo(-8, -10); g.quadraticCurveTo(0, -16, 8, -10); g.stroke();
      g.fillStyle = rgba('#ffffff', 0.12); for (const sd of [-1, 1]) { g.beginPath(); g.roundRect(sd * 38 - 27, -29, 54, 48, 12); g.fill(); }
    }
  }
  g.restore();
  g.save(); g.translate(turn * 9, 0); hairFront(g, c, fw, fh); g.restore();
  if (!silhouette) {
    if (e.sweat) sweatDrop(g, 92, -70 + Math.sin(t * 2) * 4 + ((t * 30) % 30), 0.9, e.sweat);
    if (e.tear) { g.fillStyle = rgba('#7cc4f2', 0.9 * e.tear); g.beginPath(); g.ellipse(34, 24 + ((t * 40) % 60), 7, 11, 0, 0, 7); g.fill(); }
  }
  g.restore();
}

function mouth(g, e, c) {
  const my = c.beardBig ? 66 : 64, w = 30, curve = e.curve ?? 0, open = e.open ?? 0;
  g.save(); g.translate(0, my);
  g.strokeStyle = '#6B2E2A'; g.lineCap = 'round'; g.lineWidth = 7;
  if (e.mouth === 'o') {
    g.fillStyle = '#5A2320'; g.beginPath(); g.ellipse(0, 4, 13 + open * 6, 10 + open * 16, 0, 0, 7); g.fill();
    g.fillStyle = '#C9605A'; g.beginPath(); g.ellipse(0, 10 + open * 8, 8, 5, 0, 0, 7); g.fill();
  } else if (open > 0.15 && (e.mouth === 'smile' || e.mouth === 'grit')) {
    const hh = 10 + open * 26;
    g.fillStyle = '#5A2320'; g.beginPath(); g.moveTo(-w - 6, -curve * 8);
    g.quadraticCurveTo(0, curve * 10 - 4, w + 6, -curve * 8);
    g.quadraticCurveTo(0, hh + curve * 8, -w - 6, -curve * 8); g.fill();
    g.save(); g.clip(); g.fillStyle = '#FFFFFF'; g.fillRect(-w - 6, -20, 2 * w + 12, e.mouth === 'grit' ? hh : 12); g.restore();
  } else if (e.mouth === 'smirk') {
    g.beginPath(); g.moveTo(-w + 4, 2); g.quadraticCurveTo(4, 8, w + 4, -8 - curve * 10); g.stroke();
  } else {
    g.beginPath(); g.moveTo(-w, -curve * 10); g.quadraticCurveTo(0, curve * 14, w, -curve * 10); g.stroke();
  }
  g.restore();
}

export function hand(g, x, y, r = 30, color = SKIN.base) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#FFE2CB'); gr.addColorStop(1, color);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}

export { SKIN };
