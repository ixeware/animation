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
  // The Mechanical Turk episode
  turk: { face: [0.98, 1.06, 0.86], hair: 'turban', hairC: '#2A1E16', brow: '#1E1712', suit: '#8A2F2C', suitD: '#5E1E1F', shirt: 'robe', ears: 1, mustache: '#1E1712', turban: '#EFE8D8', fez: '#B3262E' },
  napoleon: { face: [0.96, 1.02, 0.86], hair: 'bicorne', hairC: '#2F2219', brow: '#2A1F17', suit: '#24365E', suitD: '#18264A', shirt: 'uniform', ears: 1 },
  kempelen: { face: [0.95, 1.06, 0.84], hair: 'wig', hairC: '#ECE8E0', brow: '#7A6A58', suit: '#7A3B2A', suitD: '#5A2A1E', shirt: 'jabot', vest: '#C9A05A', ears: 1 },
  franklin: { face: [1.02, 1.04, 0.95], hair: 'franklin', hairC: '#CFC9BE', brow: '#9B9488', suit: '#8C7F6E', suitD: '#6E6354', shirt: 'jabot', vest: '#B8AE9C', glasses: 'round', ears: 1 },
  babbage: { face: [1.0, 1.04, 0.92], hair: 'receding', hairC: '#8E8A84', brow: '#6E6A64', suit: '#262A30', suitD: '#1A1D22', shirt: 'bow', tie: '#15171A', sideburns: true, ears: 1 },
  empress: { face: [0.95, 1.02, 0.86], hair: 'updo', hairC: '#DCCBA6', brow: '#9C7E58', suit: '#4A78A8', suitD: '#33587E', shirt: 'gown', ears: 0.9, female: true, crown: true },
  courtier: { face: [0.96, 1.04, 0.86], hair: 'wig', hairC: '#E4E0D8', brow: '#8A7A66', suit: '#2F5D4A', suitD: '#21443A', shirt: 'jabot', vest: '#D9C7A0', ears: 1 },
  // Mikhail Tal episode
  tal: { face: [0.9, 1.1, 0.8], hair: 'swept', hairC: '#1E1612', brow: '#16100C', suit: '#2A2F38', suitD: '#1D2129', shirt: 'tie', tie: '#5A1F24', ears: 1.05 },
  talOld: { face: [0.88, 1.12, 0.78], hair: 'wild', hairC: '#BDB8AE', brow: '#77726A', suit: '#3A3F46', suitD: '#2A2E34', shirt: 'tie', tie: '#2A2D33', ears: 1.05, gaunt: true },
  botvinnik: { face: [0.96, 1.0, 0.9], hair: 'receding', hairC: '#5A4A3A', brow: '#4A3C2E', suit: '#55585C', suitD: '#3E4145', shirt: 'tie', tie: '#3A3F46', glasses: true, ears: 1 },
  kasparov: { face: [0.98, 1.04, 0.9], hair: 'curly', hairC: '#1C1612', brow: '#120D0A', suit: '#1E2228', suitD: '#14171C', shirt: 'tie', tie: '#7A1F2B', ears: 1 },
  dealer: { face: [0.98, 1.04, 0.9], hair: 'receding', hairC: '#A39C90', brow: '#6E685E', suit: '#6A5A42', suitD: '#4E4230', shirt: 'tie', tie: '#5A2A22', glasses: true, mustache: '#8E877C', ears: 1 },
  daughter: { face: [0.95, 1.02, 0.88], hair: 'updo', hairC: '#B9AFA2', brow: '#857B70', suit: '#5E6F78', suitD: '#45535B', shirt: 'gown', ears: 0.9, female: true },
  auctioneer: { face: [0.94, 1.05, 0.86], hair: 'swept', hairC: '#3A3530', brow: '#2A2622', suit: '#1E2430', suitD: '#141922', shirt: 'tie', tie: '#8E1E2A', ears: 1 },
  doctor: { face: [0.98, 1.04, 0.9], hair: 'receding', hairC: '#8E8A84', brow: '#6E6A64', suit: '#F2F2EE', suitD: '#D3D8D4', shirt: 'labcoat', glasses: true, ears: 1 },
  operator: { face: [0.94, 1.04, 0.84], hair: 'tied', hairC: '#3A2A20', brow: '#2E2119', suit: '#E8E0CF', suitD: '#C2B8A3', shirt: 'sleeves', vest: '#3B2E26', ears: 1 },
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
  if (c.shirt === 'robe') {  // Ottoman robe with a fur collar and a gold sash
    g.save(); g.clip(p);
    g.fillStyle = '#3C5A3A'; g.beginPath(); g.moveTo(-70, 150); g.lineTo(70, 150); g.lineTo(30, 520); g.lineTo(-30, 520); g.closePath(); g.fill();
    g.fillStyle = '#C9A05A'; g.fillRect(-220, 430, 440, 40);
    g.restore();
    g.strokeStyle = '#F1EBDD'; g.lineWidth = 34; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-150, 200); g.quadraticCurveTo(-60, 170, -50, 520); g.moveTo(150, 200); g.quadraticCurveTo(60, 170, 50, 520); g.stroke();
    g.strokeStyle = 'rgba(160,140,110,0.5)'; g.lineWidth = 3;
    for (let y = 210; y < 520; y += 26) for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * (60 + (y < 260 ? 60 : 0)) - 12, y); g.lineTo(sd * (60 + (y < 260 ? 60 : 0)) + 12, y + 8); g.stroke(); }
  }
  if (c.shirt === 'uniform') {  // Napoleon: blue coat, white waistcoat, red collar, gold epaulettes
    g.fillStyle = '#F2EFE8'; g.beginPath(); g.moveTo(-70, 160); g.lineTo(70, 160); g.lineTo(46, 520); g.lineTo(-46, 520); g.closePath(); g.fill();
    g.fillStyle = '#C9A05A'; for (let y = 230; y < 520; y += 56) { g.beginPath(); g.arc(0, y, 8, 0, 7); g.fill(); }
    g.fillStyle = '#B3262E'; g.beginPath(); g.roundRect(-64, 138, 128, 34, 10); g.fill();
    g.fillStyle = '#F5F1E8'; g.beginPath(); g.moveTo(-22, 150); g.lineTo(22, 150); g.lineTo(0, 196); g.closePath(); g.fill();
    for (const sd of [-1, 1]) {
      g.fillStyle = '#E2B14A'; g.beginPath(); g.ellipse(sd * 158, 196, 52, 20, sd * 0.25, 0, 7); g.fill();
      g.strokeStyle = '#C9922E'; g.lineWidth = 5; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(sd * 158 + i * 13, 208); g.lineTo(sd * 158 + i * 14, 244); g.stroke(); }
    }
  }
  if (c.shirt === 'jabot') {  // 18th-century coat, waistcoat and a lace jabot
    g.fillStyle = c.vest; g.beginPath(); g.moveTo(-70, 160); g.lineTo(70, 160); g.lineTo(40, 520); g.lineTo(-40, 520); g.closePath(); g.fill();
    g.fillStyle = '#FBF8F0'; g.strokeStyle = 'rgba(150,140,120,0.5)'; g.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const y = 160 + i * 26, r = 30 - i * 3; g.beginPath(); g.ellipse(0, y, r, 18, 0, 0, Math.PI); g.fill(); g.stroke(); }
  }
  if (c.shirt === 'gown') {  // the Empress: low neckline, lace trim and pearls
    g.fillStyle = SKIN.base; g.beginPath(); g.moveTo(-120, 175); g.quadraticCurveTo(0, 270, 120, 175); g.lineTo(60, 150); g.lineTo(-60, 150); g.closePath(); g.fill();
    g.strokeStyle = '#FBF8F0'; g.lineWidth = 14; g.beginPath(); g.moveTo(-130, 178); g.quadraticCurveTo(0, 290, 130, 178); g.stroke();
    g.fillStyle = '#FFF8EA'; for (let i = -5; i <= 5; i++) { const a = i / 5; g.beginPath(); g.arc(a * 62, 182 + (1 - a * a) * 34, 7, 0, 7); g.fill(); }
  }
  if (c.shirt === 'labcoat') {  // white coat, shirt and tie, stethoscope
    g.fillStyle = '#9DB8C9'; g.beginPath(); g.moveTo(-40, 148); g.lineTo(40, 148); g.lineTo(26, 330); g.lineTo(-26, 330); g.closePath(); g.fill();
    g.fillStyle = '#2C4A63'; g.beginPath(); g.moveTo(-9, 160); g.lineTo(9, 160); g.lineTo(13, 270); g.lineTo(0, 288); g.lineTo(-13, 270); g.closePath(); g.fill();
    g.fillStyle = c.suitD; g.beginPath(); g.moveTo(-62, 150); g.lineTo(-20, 340); g.lineTo(-90, 260); g.closePath(); g.fill(); g.beginPath(); g.moveTo(62, 150); g.lineTo(20, 340); g.lineTo(90, 260); g.closePath(); g.fill();
    g.strokeStyle = '#2A2F35'; g.lineWidth = 9; g.beginPath(); g.moveTo(-70, 160); g.bezierCurveTo(-90, 260, -40, 330, -10, 360); g.moveTo(70, 160); g.bezierCurveTo(90, 260, 40, 330, 10, 360); g.stroke();
    g.fillStyle = '#C9CED3'; g.beginPath(); g.arc(0, 372, 20, 0, 7); g.fill();
  }
  if (c.shirt === 'sleeves') {  // shirt sleeves and a dark waistcoat (the hidden operator)
    g.save(); g.clip(p); g.fillStyle = c.vest;
    g.beginPath(); g.moveTo(-60, 150); g.lineTo(-10, 300); g.lineTo(-20, 520); g.lineTo(-150, 520); g.lineTo(-130, 190); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(60, 150); g.lineTo(10, 300); g.lineTo(20, 520); g.lineTo(150, 520); g.lineTo(130, 190); g.closePath(); g.fill(); g.restore();
  }
}

function hairBack(g, c, fw) {
  g.fillStyle = c.hairC;
  if (c.hair === 'messy') { g.beginPath(); g.ellipse(0, -20, 118 * fw, 125, 0, 0, 7); g.fill(); }
  if (c.hair === 'wavy') { g.beginPath(); g.ellipse(0, -40, 112 * fw, 105, 0, 0, 7); g.fill(); }
  if (c.hair === 'wig' || c.hair === 'tied') { g.beginPath(); g.ellipse(0, -30, 112 * fw, 112, 0, 0, 7); g.fill(); }
  if (c.hair === 'franklin') {  // long grey hair falling to the shoulders
    const w = 100 * fw; g.beginPath(); g.moveTo(-w * 0.9, -80); g.bezierCurveTo(-w - 50, 0, -w - 40, 120, -w - 14, 175);
    g.lineTo(w + 14, 175); g.bezierCurveTo(w + 40, 120, w + 50, 0, w * 0.9, -80); g.closePath(); g.fill();
  }
  if (c.hair === 'curly') { g.beginPath(); g.ellipse(0, -36, 116 * fw, 112, 0, 0, 7); g.fill(); }
  if (c.hair === 'wild') {  // untamed grey hair at the sides and back, thin on top
    for (let i = 0; i < 12; i++) { const a = Math.PI * (0.85 + i / 11 * 1.3), r = 104 + (i % 3) * 8; g.beginPath(); g.arc(Math.cos(a) * r * fw, -6 + Math.sin(a) * r * 0.85, 34 + (i % 2) * 8, 0, 7); g.fill(); }
  }
  if (c.hair === 'updo') { g.beginPath(); g.ellipse(0, -150, 80, 62, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -40, 118 * fw, 110, 0, 0, 7); g.fill(); }
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
    case 'wig':  // powdered wig with rolled curls over the ears
    case 'tied':
      p.moveTo(-w - 6, -10); p.bezierCurveTo(-w - 12, -h * 0.95, -40, -h - 20, 0, -h - 18);
      p.bezierCurveTo(40, -h - 20, w + 12, -h * 0.95, w + 6, -10);
      p.bezierCurveTo(w - 4, -60, 50, -84, 0, -86); p.bezierCurveTo(-50, -84, -w + 4, -60, -w - 6, -10); break;
    case 'franklin':  // bald crown, side hair only
      p.moveTo(-w - 6, 40); p.bezierCurveTo(-w - 12, -20, -w - 4, -70, -w + 18, -88); p.lineTo(-w + 22, 30); p.closePath();
      p.moveTo(w + 6, 40); p.bezierCurveTo(w + 12, -20, w + 4, -70, w - 18, -88); p.lineTo(w - 22, 30); p.closePath(); break;
    case 'updo':
      p.moveTo(-w - 8, 0); p.bezierCurveTo(-w - 16, -h - 10, -30, -h - 30, 0, -h - 26);
      p.bezierCurveTo(30, -h - 30, w + 16, -h - 10, w + 8, 0);
      p.bezierCurveTo(w - 6, -70, 30, -86, 4, -92); p.bezierCurveTo(-30, -86, -w + 6, -70, -w - 8, 0); break;
    case 'bicorne':
      p.moveTo(-w - 2, -24); p.bezierCurveTo(-w - 6, -h * 0.9, -30, -h - 14, 10, -h - 12);
      p.bezierCurveTo(70, -h - 8, w + 6, -h * 0.7, w + 2, -24);
      p.bezierCurveTo(w - 8, -60, 40, -78, 0, -74); p.bezierCurveTo(-40, -70, -w + 6, -56, -w - 2, -24); break;
    case 'turban': break;
    case 'curly':  // Kasparov: dense dark curls, low hairline
      p.moveTo(-w - 6, -10); p.bezierCurveTo(-w - 14, -h - 58, w + 14, -h - 58, w + 6, -10);
      p.bezierCurveTo(w - 4, -50, 50, -66, 0, -64); p.bezierCurveTo(-50, -66, -w + 4, -50, -w - 6, -10);
      for (let i = 0; i < 10; i++) { const a = Math.PI * (1.0 + i / 9), rx = (w + 2) * Math.cos(a), ry = -14 + (h + 4) * Math.sin(a); p.moveTo(rx + 24, ry); p.arc(rx, ry, 24, 0, 7); }
      for (let i = 0; i < 5; i++) { const x = -60 + i * 30; p.moveTo(x + 20, -68); p.arc(x, -68, 20, 0, 7); }
      break;
    case 'wild':  // tufts sticking out over the ears, a few strands on the crown
      for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const y = -70 + i * 26; p.moveTo(sd * (w + 8) + 22, y); p.arc(sd * (w + 8), y, 22 + (i % 2) * 6, 0, 7); }
      p.moveTo(-40, -h + 6); p.quadraticCurveTo(0, -h - 26, 40, -h + 6); p.quadraticCurveTo(0, -h - 6, -40, -h + 6);
      break;
    case 'cap':
      // white hair tufts at the sides
      p.moveTo(-w - 10, 30); p.bezierCurveTo(-w - 22, -10, -w - 10, -60, -w + 14, -70); p.lineTo(-w + 20, 20); p.closePath();
      p.moveTo(w + 10, 30); p.bezierCurveTo(w + 22, -10, w + 10, -60, w - 14, -70); p.lineTo(w - 20, 20); p.closePath(); break;
  }
  g.fill(p);
  // a few highlight strands
  if (!['cap', 'receding', 'turban', 'franklin', 'wild', 'curly'].includes(c.hair)) {
    g.save(); g.clip(p); g.strokeStyle = rgba('#ffffff', 0.07); g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(-60 + i * 30, -h + 4); g.quadraticCurveTo(-30 + i * 34, -h + 40, -10 + i * 36, -h + 30); g.stroke(); }
    g.restore();
  }
  if (c.hair === 'wig') {  // two rolled curls on each side, over the ears
    g.fillStyle = c.hairC; g.strokeStyle = 'rgba(150,140,125,0.55)'; g.lineWidth = 4;
    for (const sd of [-1, 1]) for (const y of [-2, 34]) {
      g.beginPath(); g.roundRect(sd * (w + 12) - 34, y - 15, 68, 30, 15); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(sd * (w + 12) - 20, y); g.quadraticCurveTo(sd * (w + 12), y - 10, sd * (w + 12) + 20, y); g.stroke();
    }
  }
  if (c.hair === 'turban') {  // big wrapped turban with a red crown and a jewel
    g.fillStyle = c.fez; g.beginPath(); g.roundRect(-46, -h - 92, 92, 70, 20); g.fill();
    const tp = new Path2D();
    tp.moveTo(-w - 22, -30); tp.bezierCurveTo(-w - 40, -h - 50, -40, -h - 70, 0, -h - 62);
    tp.bezierCurveTo(40, -h - 70, w + 40, -h - 50, w + 22, -30);
    tp.bezierCurveTo(w - 10, -70, 40, -80, 0, -78); tp.bezierCurveTo(-40, -80, -w + 10, -70, -w - 22, -30);
    const tg = g.createLinearGradient(0, -h - 60, 0, -40); tg.addColorStop(0, c.turban); tg.addColorStop(1, '#CFC6B2');
    g.fillStyle = tg; g.fill(tp);
    g.save(); g.clip(tp); g.strokeStyle = 'rgba(120,105,85,0.45)'; g.lineWidth = 6;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-w - 30, -40 - i * 30); g.quadraticCurveTo(0, -110 - i * 34, w + 30, -50 - i * 24); g.stroke(); }
    g.restore();
    g.fillStyle = '#2FD3B5'; g.strokeStyle = '#C9A05A'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, -h - 20, 14, 18, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#F5F1E8'; g.beginPath(); g.moveTo(0, -h - 38); g.quadraticCurveTo(30, -h - 110, 10, -h - 140); g.quadraticCurveTo(-4, -h - 90, 0, -h - 38); g.fill();
  }
  if (c.hair === 'bicorne') {  // Napoleon's hat, worn sideways, with the tricolour cockade
    const hp = new Path2D();
    hp.moveTo(-w - 95, -40); hp.bezierCurveTo(-w - 60, -h - 110, w + 60, -h - 110, w + 95, -40);
    hp.bezierCurveTo(w + 40, -76, 50, -h + 34, 0, -h + 36); hp.bezierCurveTo(-50, -h + 34, -w - 40, -76, -w - 95, -40);
    g.fillStyle = '#16181C'; g.fill(hp); g.strokeStyle = '#3A3F47'; g.lineWidth = 6; g.stroke(hp);
    g.strokeStyle = '#C9A05A'; g.lineWidth = 4; g.beginPath(); g.moveTo(-w - 80, -46); g.bezierCurveTo(-w - 30, -h + 4, w + 30, -h + 4, w + 80, -46); g.stroke();
    for (const [r, col] of [[24, '#2B4C9B'], [16, '#F5F1E8'], [8, '#C8283A']]) { g.fillStyle = col; g.beginPath(); g.arc(w - 10, -h - 36, r, 0, 7); g.fill(); }
  }
  if (c.crown) {  // small imperial crown on the updo
    g.fillStyle = '#E2B14A'; g.beginPath(); g.moveTo(-40, -h - 18); g.lineTo(-46, -h - 58); g.lineTo(-20, -h - 38); g.lineTo(0, -h - 68); g.lineTo(20, -h - 38); g.lineTo(46, -h - 58); g.lineTo(40, -h - 18); g.closePath(); g.fill();
    g.fillStyle = '#C8283A'; g.beginPath(); g.arc(0, -h - 34, 7, 0, 7); g.fill();
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

export function drawChar(g, who, { x = 0, y = 0, s = 1, e = EXPR.neutral, t = 0, tilt = 0, silhouette = false, shade = 'brightness(0)', eyeGlow = null, noBody = false, alpha = 1 } = {}) {
  const c = CAST[who];
  const [fw, fh, jaw] = c.face;
  // idle life: breathing bob + slow head sway
  const ph = who.length * 1.7 + x * 0.01;
  y += Math.sin(t * 1.7 + ph) * 4 * s; tilt += Math.sin(t * 0.8 + ph) * 0.018;
  // reactions: shake (fear/shock jitter), nod (laugh / agreement bounce)
  const sh = e.shake || 0, nod = e.nod || 0, turn = clamp(e.turn || 0, -1, 1);
  x += Math.sin(t * 47) * sh * 6 * s; tilt += Math.sin(t * 39) * sh * 0.03; y += Math.abs(Math.sin(t * 9)) * nod * -10 * s;
  g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.scale(s, s); g.rotate(tilt);
  if (silhouette) g.filter = shade;
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
    if (c.gaunt) {  // hollow cheeks and tired eyes
      g.strokeStyle = 'rgba(120,70,50,0.28)'; g.lineWidth = 5; g.lineCap = 'round';
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 70, 30); g.quadraticCurveTo(sd * 62, 62, sd * 48, 86); g.stroke(); g.beginPath(); g.arc(sd * 38, 22, 20, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke(); }
    }
    if (c.sideburns) { g.fillStyle = c.hairC; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 88 * fw, 30, 16, 52, sd * -0.1, 0, 7); g.fill(); } }
    mouth(g, e, c);
    if (c.mustache) {  // curled moustache over the mouth
      g.fillStyle = c.mustache;
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, 52); g.bezierCurveTo(sd * 30, 38, sd * 60, 44, sd * 74, 30); g.bezierCurveTo(sd * 70, 50, sd * 40, 66, 0, 60); g.fill(); }
    }
    if (c.female) {  // lashes
      g.strokeStyle = '#2A1F1A'; g.lineWidth = 4; g.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) { const a = -0.25 - i * 0.3; g.beginPath(); g.moveTo(sd * (38 + 18 * Math.cos(a)), -2 - 24 * Math.sin(-a)); g.lineTo(sd * (38 + 26 * Math.cos(a)), -2 - 34 * Math.sin(-a)); g.stroke(); }
    }
    if (c.glasses === 'round') {  // Franklin's small spectacles, low on the nose
      g.strokeStyle = '#4A3F33'; g.lineWidth = 4;
      for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * 36, 8, 22, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(-14, 6); g.quadraticCurveTo(0, 0, 14, 6); g.stroke();
    } else if (c.glasses) {
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
