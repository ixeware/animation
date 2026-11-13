// The two looks of witty2 (rule 62: a nod in our own drawing, not a copy of the manga): Witty Alien as Gojo, Magnus
// Carlsen as Sukuna ("Jujutsu Kaisen"). Version 5: redrawn after the author's "сделай их дизайн в образе лучше".
// Witty: white hair in curved locks, standing up over the black blindfold; when the blindfold comes off (e.band 1 → 0)
// the hair falls into a fringe and the eyes show: bright blue irises with a pale ring, white lashes and brows; a dark
// jacket with a high collar and one bronze button. Magnus: black marks (a diamond between the brows, a bar across the
// bridge of the nose, two tapering bands on each cheekbone), a second pair of eyes under his own that opens with the
// glow (e.glow), red irises with a slit pupil, his white shirt closed like a kimono over a black collar.
// Head units: the face is 100·fw wide and 125·fh tall from its centre, the eyes sit at (±38, −2).
import { clamp, lerp, rgba, mix, ease } from '../../engine/js/core.js';
import { CAST } from '../../engine/js/characters.js';

const HAIR = '#F7FAFE', HAIR_S = '#C5D2E6', HAIR_L = '#A9BAD4', BAND = '#101016';
// the manga page ("Witty lost."): the hair's lines in ink, a little heavier
export const INKED = { on: false };
const hl = () => (INKED.on ? '#0B0B10' : HAIR_L), hw = k => (INKED.on ? k * 1.5 : k);

// a lock of hair: a curved blade from its root (bx, by) to its tip (tx, ty), wd wide at the root, bent sideways by bend
function lockPath(bx, by, tx, ty, wd, bend) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, p = new Path2D();
  const lx = bx + nx * wd / 2, ly = by + ny * wd / 2, rx = bx - nx * wd / 2, ry = by - ny * wd / 2;
  p.moveTo(lx, ly);
  p.quadraticCurveTo(bx + ux * L * 0.55 + nx * (wd * 0.42 + bend), by + uy * L * 0.55 + ny * (wd * 0.42 + bend), tx, ty);
  p.quadraticCurveTo(bx + ux * L * 0.5 + nx * (-wd * 0.3 + bend), by + uy * L * 0.5 + ny * (-wd * 0.3 + bend), rx, ry);
  p.closePath();
  return { p, edge: [tx, ty, bx + ux * L * 0.5 + nx * (-wd * 0.3 + bend), by + uy * L * 0.5 + ny * (-wd * 0.3 + bend), rx, ry] };
}
function drawLocks(g, locks, fill, line = HAIR_L, lw = 3.2) {
  for (const [bx, by, tx, ty, wd, bend] of locks) {
    const { p, edge } = lockPath(bx, by, tx, ty, wd, bend);
    g.fillStyle = fill; g.fill(p);
    if (line) { g.strokeStyle = line; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(edge[0], edge[1]); g.quadraticCurveTo(edge[2], edge[3], edge[4], edge[5]); g.stroke(); }
  }
}
// the hair standing up over the blindfold: roots along the top of the head, the middle locks the longest, all of them
// leaning a little to one side
const UP = (() => {
  const out = [], n = 9;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), a = lerp(Math.PI * 1.12, Math.PI * 1.88, u), mid = 1 - Math.abs(u - 0.46) * 2;
    const bx = Math.cos(a) * 86, by = -52 + Math.sin(a) * 78;
    const len = 64 + 58 * Math.max(0, mid) + 12 * Math.sin(i * 2.3 + 0.4), dir = lerp(a, Math.PI * 1.5, 0.42) + 0.14;
    out.push([bx, by, bx + Math.cos(dir) * len, by + Math.sin(dir) * len, 54 + 8 * Math.sin(i * 1.7), (i % 2 ? -1 : 1) * 10]);
  }
  return out;
})();
const UP_BACK = UP.map(([bx, by, tx, ty, wd, bend], i) => [bx * 1.04, by + 6, tx * 1.1 + (i % 2 ? -12 : 14), ty * 1.04 - 6, wd * 1.05, -bend]);
const UP_TUFT = [[-62, -86, -78, -58, 34, 6], [-22, -96, -30, -66, 36, -6], [24, -96, 30, -64, 36, 6], [64, -86, 80, -60, 34, -6]];
// the hair down (the blindfold off): a fringe over the forehead, side locks before the ears, a few tufts on top
const DOWN = [[-80, -92, -99, 0, 46, -8], [-56, -110, -64, -30, 46, 8], [-28, -118, -36, -30, 44, -6], [2, -122, 6, -18, 42, 6], [30, -118, 34, -32, 44, -7], [58, -110, 62, -34, 46, 7], [82, -92, 99, 2, 46, 8]];
const DOWN_TOP = [[-78, -108, -118, -150, 54, 8], [-44, -132, -62, -192, 56, -8], [0, -140, 8, -208, 58, 8], [44, -132, 70, -190, 56, -8], [80, -108, 122, -146, 54, 8]];

function gojoHair(g, phase, { e }) {
  const b = clamp(e?.band ?? 1), up = ease.inOut(b), down = 1 - up;
  if (phase === 'back') {  // the mass behind the head
    if (up > 0.01) { g.save(); g.globalAlpha *= up; drawLocks(g, UP_BACK, HAIR_S, null); g.fillStyle = HAIR_S; g.beginPath(); g.ellipse(0, -52, 100, 84, 0, 0, 7); g.fill(); g.restore(); }
    if (down > 0.01) { g.save(); g.globalAlpha *= down; g.fillStyle = HAIR_S; g.beginPath(); g.ellipse(0, -40, 112, 112, 0, 0, 7); g.fill(); g.restore(); }
    return;
  }
  if (up > 0.01) {
    g.save(); g.globalAlpha *= up;
    // the scalp between the roots, down to the blindfold
    g.fillStyle = HAIR; g.beginPath(); g.moveTo(-94, -56); g.bezierCurveTo(-98, -118, -52, -140, 0, -140); g.bezierCurveTo(52, -140, 98, -118, 94, -56); g.quadraticCurveTo(0, -74, -94, -56); g.fill();
    drawLocks(g, UP, HAIR, hl(), hw(3.2));
    drawLocks(g, UP_TUFT, HAIR, hl(), hw(2.4));
    g.restore();
  }
  if (down > 0.01) {
    g.save(); g.globalAlpha *= down; g.translate(0, -26 * up);
    g.fillStyle = HAIR; g.beginPath(); g.moveTo(-100, -70); g.bezierCurveTo(-112, -150, -56, -168, 0, -168); g.bezierCurveTo(56, -168, 112, -150, 100, -70); g.quadraticCurveTo(0, -112, -100, -70); g.fill();
    drawLocks(g, DOWN_TOP, HAIR, hl(), hw(3.2));
    drawLocks(g, DOWN, HAIR, hl(), hw(3.2));
    g.restore();
  }
}
// the eye opening under its lid, as the engine draws it (characters.js eye()): clips to what shows of the eye
function eyeClip(g, cx, cy, e, side) {
  const rx = 21, ry = 25, lid = clamp(e.lid ?? 0), tilt = (e.browTilt || 0) * side * 8 + (e.brow || 0) * side * 6, ly = cy - ry + lid * ry * 2.05;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
  g.beginPath(); g.moveTo(cx - rx - 4, ly + tilt + 2); g.lineTo(cx + rx + 4, ly - tilt + 2); g.lineTo(cx + rx + 4, cy + ry + 4); g.lineTo(cx - rx - 4, cy + ry + 4); g.closePath(); g.clip();
  return { rx, ry, lid, tilt, ly };
}
function gojoFace(g, phase, { e, ee }) {
  if (phase === 'eyes' && e.glow > 0) halo(g, e.glow, '#4FC3FF');
  if (phase === 'iris') {  // the eyes: a bright blue iris with a pale ring and two sparks, a white lash line
    const x = ee || e, [lx, ly] = x.look || [0, 0], pr = 9.5 * (x.pupil ?? 1);
    for (const sd of [-1, 1]) {
      const cx = sd * 38, cy = -2, ix = cx + lx * 9, iy = cy + ly * 10;
      g.save(); const o = eyeClip(g, cx, cy, x, sd);
      const gr = g.createRadialGradient(ix, iy + 3, 1, ix, iy, pr * 1.7);
      gr.addColorStop(0, '#E9FBFF'); gr.addColorStop(0.3, '#7FE0FF'); gr.addColorStop(0.72, '#2D9BF0'); gr.addColorStop(1, '#1561C4');
      g.fillStyle = gr; g.beginPath(); g.arc(ix, iy, pr * 1.7, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.6; g.beginPath();
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832 + 0.3; g.moveTo(ix + Math.cos(a) * pr * 0.75, iy + Math.sin(a) * pr * 0.75); g.lineTo(ix + Math.cos(a) * pr * 1.5, iy + Math.sin(a) * pr * 1.5); }
      g.stroke();
      g.strokeStyle = '#0E4FA8'; g.lineWidth = 2.4; g.beginPath(); g.arc(ix, iy, pr * 1.66, 0, 7); g.stroke();
      g.fillStyle = '#0B2A5C'; g.beginPath(); g.arc(ix, iy, pr * 0.5, 0, 7); g.fill();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(ix - pr * 0.55, iy - pr * 0.6, pr * 0.34, 0, 7); g.fill(); g.beginPath(); g.arc(ix + pr * 0.6, iy + pr * 0.55, pr * 0.16, 0, 7); g.fill();
      g.restore();
      // the lash line, white: along the lid when it is down, else along the top of the eye; three lashes at the outer corner
      const rx = 21, ry = 25;
      g.save(); g.strokeStyle = '#F2F7FF'; g.lineCap = 'round'; g.lineWidth = 5; g.beginPath();
      if (o.lid > 0.04 && o.lid < 0.97) { g.moveTo(cx - rx - 1, o.ly + o.tilt); g.lineTo(cx + rx + 1, o.ly - o.tilt); }
      else if (o.lid <= 0.04) g.ellipse(cx, cy, rx, ry, 0, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
      if (o.lid < 0.97) {
        const oy = o.lid > 0.04 ? o.ly - sd * o.tilt : cy - ry * 0.55; g.lineWidth = 3.4; g.beginPath();
        for (const [k, l] of [[0, 9], [1, 11], [2, 8]]) { const x0 = cx + sd * (rx - 5 + k * 3.2), y0 = oy + k * 4.5; g.moveTo(x0, y0); g.lineTo(x0 + sd * l, y0 - l * 0.7); }
        g.stroke();
      }
      g.restore();
    }
  }
  if (phase === 'top' && (e.band ?? 0) > 0) {  // the black blindfold; pushed up (band → 0) it is gone
    const b = e.band, dy = (1 - b) * -84;
    g.save(); g.globalAlpha *= clamp(b * 2.5); g.translate(0, dy);
    const p = new Path2D(); p.moveTo(-97, -62); p.quadraticCurveTo(0, -80, 97, -62); p.lineTo(98, 26); p.quadraticCurveTo(0, 12, -98, 26); p.closePath();
    g.fillStyle = BAND; g.fill(p);
    g.save(); g.clip(p);
    const sh = g.createLinearGradient(0, -80, 0, 30); sh.addColorStop(0, 'rgba(120,130,170,0.22)'); sh.addColorStop(0.35, 'rgba(120,130,170,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = sh; g.fillRect(-110, -90, 220, 130);
    g.strokeStyle = 'rgba(150,160,200,0.2)'; g.lineWidth = 2.6;  // the folds of the cloth
    for (const [y, c] of [[-44, -13], [-18, -12], [6, -10]]) { g.beginPath(); g.moveTo(-98, y + 8); g.quadraticCurveTo(0, y + c, 98, y + 8); g.stroke(); }
    g.restore(); g.restore();
  }
}
// Witty's jacket in the look: dark, a high collar closed to the chin, one bronze button
function gojoBody(g, phase, { S }) {
  if (phase !== 'under') return false;
  g.fillStyle = S.shade; g.fillRect(-24, 90, 48, 70);
  const p = new Path2D(); p.moveTo(-210, 520); p.bezierCurveTo(-205, 260, -170, 170, -60, 150); p.lineTo(60, 150); p.bezierCurveTo(170, 170, 205, 260, 210, 520); p.closePath();
  const gr = g.createLinearGradient(-200, 0, 200, 0); gr.addColorStop(0, '#20263C'); gr.addColorStop(1, '#10131F'); g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 150); g.lineTo(0, 520); g.stroke();
  g.strokeStyle = 'rgba(130,150,210,0.16)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-150, 220); g.quadraticCurveTo(-110, 300, -128, 520); g.moveTo(150, 220); g.quadraticCurveTo(110, 300, 128, 520); g.stroke(); g.restore();
  // the collar: a tall band round the neck
  const c = new Path2D(); c.moveTo(-84, 176); c.quadraticCurveTo(-74, 122, -58, 100); c.quadraticCurveTo(0, 116, 58, 100); c.quadraticCurveTo(74, 122, 84, 176); c.quadraticCurveTo(0, 204, -84, 176); c.closePath();
  g.fillStyle = '#1A1F33'; g.fill(c);
  g.strokeStyle = 'rgba(140,160,220,0.35)'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-58, 101); g.quadraticCurveTo(0, 117, 58, 101); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 110); g.lineTo(0, 196); g.stroke();
  g.fillStyle = '#B98A3E'; g.beginPath(); g.arc(22, 212, 12, 0, 7); g.fill(); g.strokeStyle = '#6E4E1C'; g.lineWidth = 2.5; g.beginPath(); g.arc(22, 212, 6.5, 0.6, 5.2); g.stroke();
  return true;
}

function sukunaFace(g, phase, { e, ee }) {
  if (phase === 'eyes' && e.glow > 0) halo(g, e.glow, '#E3262F');
  if (phase === 'iris') {  // red irises, a slit pupil
    const x = ee || e, [lx, ly] = x.look || [0, 0], pr = 9.5 * (x.pupil ?? 1);
    for (const sd of [-1, 1]) {
      const cx = sd * 38, cy = -2, ix = cx + lx * 9, iy = cy + ly * 10;
      g.save(); eyeClip(g, cx, cy, x, sd);
      const gr = g.createRadialGradient(ix, iy, 1, ix, iy, pr * 1.6); gr.addColorStop(0, '#FF7A6A'); gr.addColorStop(0.55, '#D8202C'); gr.addColorStop(1, '#7A0A14');
      g.fillStyle = gr; g.beginPath(); g.arc(ix, iy, pr * 1.6, 0, 7); g.fill();
      g.strokeStyle = '#4A0409'; g.lineWidth = 2.4; g.beginPath(); g.arc(ix, iy, pr * 1.56, 0, 7); g.stroke();
      g.fillStyle = '#18040A'; g.beginPath(); g.ellipse(ix, iy, pr * 0.3, pr * 1.05, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ix - pr * 0.6, iy - pr * 0.6, pr * 0.26, 0, 7); g.fill();
      g.restore();
    }
  }
  if (phase === 'mouth') {
    const INK = '#170A10', open = clamp((e.glow ?? 0) * 1.4 - 0.2);
    g.save(); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round';
    // the bridge of the nose
    g.lineWidth = 6; g.beginPath(); g.moveTo(-13, 8); g.quadraticCurveTo(0, 4, 13, 8); g.stroke();
    for (const sd of [-1, 1]) {
      // the second eye under each eye: a slit, opening red with the glow
      const ex = sd * 38, ey = 33, hw = 18, hh = 0.9 + 6.2 * open;
      const sl = new Path2D(); sl.moveTo(ex - hw, ey + 1); sl.quadraticCurveTo(ex, ey - hh * 1.9, ex + hw, ey); sl.quadraticCurveTo(ex, ey + hh * 1.5, ex - hw, ey + 1); sl.closePath();
      g.fillStyle = INK; g.fill(sl); g.lineWidth = 2.2 + open; g.stroke(sl);
      if (open > 0.05) { g.save(); g.clip(sl); g.fillStyle = '#F6ECE6'; g.fillRect(ex - hw, ey - 12, hw * 2, 24); g.fillStyle = '#D8202C'; g.beginPath(); g.arc(ex, ey, 6.4, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ey, 1.8, 5.4, 0, 0, 7); g.fill(); g.restore(); g.lineWidth = 3; g.stroke(sl); }
      // one band on each cheek: from under the outer corner of the eye, sweeping out and up to the temple, tapering
      const bd = new Path2D(); bd.moveTo(sd * 60, 42); bd.quadraticCurveTo(sd * 86, 40, sd * 97, 2); bd.quadraticCurveTo(sd * 90, 30, sd * 62, 52); bd.closePath();
      g.fillStyle = INK; g.fill(bd);
      const b2 = new Path2D(); b2.moveTo(sd * 66, 60); b2.quadraticCurveTo(sd * 88, 56, sd * 99, 26); b2.quadraticCurveTo(sd * 92, 50, sd * 68, 68); b2.closePath();
      g.fill(b2);
    }
    g.fillStyle = INK; g.beginPath(); g.moveTo(0, -42); g.lineTo(6, -31); g.lineTo(0, -20); g.lineTo(-6, -31); g.closePath(); g.fill();  // a diamond between the brows
    g.restore();
  }
}
// Magnus's white shirt closed like a kimono: left over right, a black collar under it
function sukunaBody(g, phase) {
  if (phase !== 'over') return false;
  g.save();
  g.fillStyle = '#17121A'; g.beginPath(); g.moveTo(-46, 148); g.lineTo(46, 148); g.lineTo(4, 236); g.closePath(); g.fill();  // the black under-collar in the V
  g.fillStyle = '#EDEDE8'; g.beginPath(); g.moveTo(34, 148); g.lineTo(74, 152); g.lineTo(-64, 420); g.lineTo(-96, 396); g.closePath(); g.fill();  // the left panel crossing over
  g.strokeStyle = 'rgba(60,62,70,0.45)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(36, 150); g.lineTo(-94, 396); g.stroke();
  g.fillStyle = '#F6F6F2'; g.beginPath(); g.moveTo(-34, 148); g.lineTo(-74, 152); g.lineTo(-18, 250); g.lineTo(4, 236); g.closePath(); g.fill();  // the right panel's edge, tucked under
  g.strokeStyle = 'rgba(60,62,70,0.4)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-36, 150); g.lineTo(2, 234); g.stroke();
  g.restore();
  return false;
}
// the glow behind both eyes (drawn before them)
function halo(g, a, col) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (const sd of [-1, 1]) { const gr = g.createRadialGradient(sd * 38, -2, 4, sd * 38, -2, 74); gr.addColorStop(0, rgba(col, 0.95 * a)); gr.addColorStop(0.4, rgba(col, 0.42 * a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(sd * 38 - 76, -78, 152, 152); }
  g.restore();
}

// the cast of this video: wit / mag in the look, witN / magN as themselves
export function setupCast() {
  CAST.wit = { face: [0.92, 1.07, 0.84], hair: 'messy', hairC: HAIR, brow: '#E4EAF3', suit: '#1A1F33', suitD: '#10131F', shirt: 'plain', ears: 1.02, iris: '#59C8FF',
    hairFx: gojoHair, faceFx: gojoFace, bodyFx: gojoBody };
  CAST.mag = { ...CAST.magnus, iris: '#C8283A', faceFx: sukunaFace, bodyFx: sukunaBody };
  CAST.witN = { ...CAST.witty };
  CAST.magN = { ...CAST.magnus };
}
export { gojoHair, UP, lockPath, drawLocks, HAIR, HAIR_S, HAIR_L, BAND };
