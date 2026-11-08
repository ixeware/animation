// "There's always a bigger fish" (The 64 Files): Stockfish, the strongest engine on Earth, a fish that only came up to
// the surface in November 2008, ten months after Bobby Fischer (German: "fisherman") died. Step 1: the look of Fischer
// (a character sheet for the author), before the script is voiced and the scenes are built.
import { W, H, C, clamp, lerp, ease, seg, rgba, mix, makeCanvas } from '../../engine/js/core.js';
import { EXPR, CAST, drawChar } from '../../engine/js/characters.js';
import { plate, sans, inkText } from '../../engine/js/hud.js';
import { useLookV2 } from '../../engine/js/look.js';
import { loadImage } from '../../engine/js/photo.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';
const REF = await loadImage('../episodes/biggerfish/reference/fischer_portrait.jpg');

// ---------- Bobby Fischer: wavy tousled hair with a lock on the forehead, deep-set eyes under heavy brows, a big nose,
// full lips, a drawn jaw line and cheekbones (the author's brief, after the young portrait) ----------
const HAIR = '#3A2A1E', HAIR_LO = '#21170F', HAIR_HI = '#6E5442', LIP = '#B0645A';
function fischerHair(g, phase, { fw, fh = 1 }) {
  const w = 100 * fw, h = 125 * fh;
  g.fillStyle = HAIR;
  if (phase === 'back') {  // the volume behind the head, tousled bumps along the crown
    g.beginPath(); g.ellipse(0, -44, 118 * fw, 110, 0, 0, 7); g.fill();
    return;
  }
  const p = new Path2D();  // the top, a wavy hairline, and the lock that falls onto the forehead
  p.moveTo(-w - 8, 6);
  p.bezierCurveTo(-w - 26, -h * 0.62, -w - 12, -h * 0.98, -w * 0.62, -h - 22);
  p.quadraticCurveTo(-w * 0.42, -h - 46, -w * 0.12, -h - 36);  // a gently waved crown
  p.quadraticCurveTo(w * 0.16, -h - 50, w * 0.42, -h - 32);
  p.quadraticCurveTo(w * 0.8, -h - 30, w + 10, -h * 0.66);
  p.bezierCurveTo(w + 24, -h * 0.4, w + 14, -20, w + 8, 2);
  p.bezierCurveTo(w + 2, -40, w - 8, -70, w * 0.62, -86);
  p.quadraticCurveTo(w * 0.36, -100, w * 0.12, -92);
  p.quadraticCurveTo(-w * 0.02, -100, -w * 0.12, -92);
  p.bezierCurveTo(-w * 0.04, -80, -w * 0.12, -68, -w * 0.24, -62);  // the lock: an S that falls onto the forehead
  p.bezierCurveTo(-w * 0.3, -72, -w * 0.3, -84, -w * 0.4, -90);
  p.bezierCurveTo(-w * 0.7, -86, -w - 2, -56, -w - 8, 6);
  p.closePath();
  g.fill(p);
  g.save(); g.clip(p); g.lineCap = 'round';
  const strands = (col, lw, dx, dy) => {
    g.strokeStyle = col; g.lineWidth = lw;
    for (const [x0, y0, cx, cy, x1, y1] of [
      [-0.86, -0.42, -0.72, -0.98, -0.1, -1.0], [-0.56, -0.7, -0.2, -1.0, 0.36, -0.98], [0.0, -0.74, 0.42, -0.96, 0.84, -0.64],
      [-0.08, -0.8, -0.06, -0.62, -0.22, -0.52], [0.46, -0.72, 0.7, -0.82, 0.88, -0.48], [-0.8, -0.6, -0.62, -0.76, -0.42, -0.72]]) {
      g.beginPath(); g.moveTo(x0 * w + dx, y0 * h + dy); g.quadraticCurveTo(cx * w + dx, cy * h + dy, x1 * w + dx, y1 * h + dy); g.stroke();
    }
  };
  strands(rgba(HAIR_LO, 0.8), 6, 0, 0);
  strands(rgba(HAIR_HI, 0.7), 4, 4, -6);
  g.restore();
  // the lock: a thick wavy strand that falls from the crown onto the forehead, with a light along it
  const lk = new Path2D();
  lk.moveTo(-w * 0.02, -h * 0.8); lk.bezierCurveTo(-w * 0.04, -70, -w * 0.3, -76, -w * 0.32, -48);
  lk.bezierCurveTo(-w * 0.22, -62, -w * 0.12, -64, w * 0.14, -h * 0.76); lk.closePath();
  g.fillStyle = HAIR; g.fill(lk);
  g.strokeStyle = rgba(HAIR_HI, 0.75); g.lineWidth = 3.5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-w * 0.02, -h * 0.74); g.bezierCurveTo(-w * 0.06, -70, -w * 0.22, -70, -w * 0.28, -54); g.stroke();
  // loose strands at the crown and the temples: tousled, not combed
  g.strokeStyle = HAIR; g.lineWidth = 6;
  for (const [x0, y0, cx, cy, x1, y1] of [[0.92, -0.62, 1.12, -0.66, 1.16, -0.46], [-0.96, -0.5, -1.16, -0.52, -1.14, -0.3], [-0.98, -0.2, -1.1, -0.12, -1.06, 0.02]]) {
    g.beginPath(); g.moveTo(x0 * w, y0 * h); g.quadraticCurveTo(cx * w, cy * h, x1 * w, y1 * h); g.stroke();
  }
}
function softSpot(g, x, y, rx, ry, col, a) {
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.55, rgba(col, a * 0.55)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill(); g.restore();
}
function fischerFace(c) {
  return (g, phase, { e, fw, fh, jaw, S, hp }) => {
    const w = 100 * fw, h = 125 * fh, k = c.young ? 0.45 : 1;
    if (phase === 'head') {
      g.save(); g.clip(hp);
      for (const sd of [-1, 1]) {  // the hollow under each cheekbone and a light on the bone
        softSpot(g, sd * 70, 60, 38, 22, S.deep, 0.34 * k);
        softSpot(g, sd * 64, 20, 26, 12, S.hi, 0.4 * k);
      }
      g.strokeStyle = rgba(S.deep, 0.5 * k); g.lineWidth = 4; g.lineCap = 'round';  // the jaw line, just inside the edge
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * w * 0.95, h * 0.26); g.bezierCurveTo(sd * w * 0.95, h * 0.5, sd * w * jaw * 0.88, h * 0.68, sd * w * 0.44, h * 0.85); g.quadraticCurveTo(sd * w * 0.2, h * 0.93, 0, h * 0.94); g.stroke(); }
      const ch = g.createRadialGradient(0, 100, 2, 0, 100, 22); ch.addColorStop(0, rgba(S.deep, 0.2)); ch.addColorStop(1, rgba(S.deep, 0));  // under the lower lip
      g.fillStyle = ch; g.beginPath(); g.ellipse(0, 100, 22, 9, 0, 0, 7); g.fill();
      g.restore();
    } else if (phase === 'eyes') {  // deep-set: dark sockets under the brow ridge, a crease over each lid
      softSpot(g, 0, -24, 96, 26, S.deep, 0.3 * k);  // the brow ridge's shadow across both eyes
      for (const sd of [-1, 1]) {
        softSpot(g, sd * 38, -10, 50, 32, S.deep, 0.62 * k);
        g.strokeStyle = rgba(S.deep, 0.55 * k); g.lineWidth = 3.5; g.beginPath(); g.arc(sd * 38, -1, 24, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      }
    } else if (phase === 'mouth') {
      g.save(); g.translate(0, -2);  // a big, defined nose: a shaded side, a round tip, the wings and nostrils
      g.fillStyle = rgba(S.deep, 0.3); g.beginPath(); g.moveTo(-5, -16); g.quadraticCurveTo(-19, 18, -19, 36); g.quadraticCurveTo(-10, 30, -5, 8); g.closePath(); g.fill();
      g.fillStyle = rgba(S.deep, 0.32); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 16, 41, 9, 8, sd * 0.4, 0, 7); g.fill(); }
      g.fillStyle = S.base; g.beginPath(); g.ellipse(0, 37, 17, 13, 0, 0, 7); g.fill();
      g.fillStyle = rgba(S.deep, 0.22); g.beginPath(); g.ellipse(0, 46, 15, 5, 0, 0, 7); g.fill();
      g.fillStyle = rgba(S.deep, 0.34); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 7, 47, 4.5, 2.2, sd * 0.3, 0, 7); g.fill(); }
      g.strokeStyle = rgba(S.hi, 0.55); g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(3, -10); g.lineTo(3, 26); g.stroke();
      g.fillStyle = rgba(S.hi, 0.7); g.beginPath(); g.ellipse(-3, 32, 6, 4, -0.3, 0, 7); g.fill();
      g.restore();
      g.fillStyle = c.brow;  // heavy brows, a little lower than the default ones
      for (const sd of [-1, 1]) {
        g.save(); g.translate(sd * 40, -42 - (e.browY || 0) + (e.brow || 0) * 4);
        g.rotate(-sd * (e.brow || 0) * 0.34 - (sd < 0 ? (e.browTilt || 0) * 0.25 : 0));
        g.beginPath(); g.roundRect(-35, -10, 70, 20, 10); g.fill(); g.restore();
      }
      if ((e.mouth ?? 'line') === 'line' && (e.open ?? 0) < 0.2) {  // a full lower lip under the closed mouth
        const cy = 72 - (e.curve ?? 0) * 3;
        g.fillStyle = rgba(LIP, 0.9); g.beginPath(); g.ellipse(0, cy, 22, 8, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(-4, cy - 2, 9, 2.6, 0, 0, 7); g.fill();
      }
    }
  };
}
const fischer = (o = {}) => { const c = { face: [0.95, 1.02, 0.87], hair: 'custom', hairC: HAIR, brow: '#251910', iris: '#4A3527', nose: 1.38, lip: LIP, ears: 1.04, lids: 0.08,
  skin: { blush: '#D9AE98' },
  suit: '#2C313C', suitD: '#1D2129', shirt: 'tie', tie: '#1E222B', hairFx: fischerHair, ...o }; c.faceFx = fischerFace(c); return c; };
CAST.fischerA = fischer();
CAST.fischerB = fischer({ face: [0.98, 0.98, 0.91] });
CAST.fischerC = fischer({ face: [0.93, 1.06, 0.84] });
CAST.fischerShirt = fischer({ suit: '#D8D3C8', suitD: '#B9B3A7', shirt: 'open' });
CAST.fischer13 = fischer({ face: [0.99, 0.95, 0.93], nose: 1.12, lids: 0, young: true, suit: '#7FA6C4', suitD: '#5E86A6', shirt: 'polo' });

// expressions: the cold look at the board, the smirk of 1972, the stare, the end
const STARE = { ...EXPR.focus, lid: 0.22, look: [0, 0], curve: -0.08 };
const SMIRK = { ...EXPR.smug, lid: 0.28, look: [0, 0], curve: 0.4 };
const COLD = { ...EXPR.neutral, brow: 0.45, browY: 4, lid: 0.26, look: [0.25, 0.35], curve: -0.15 };
const EMPTY = { ...EXPR.tired, lid: 0.34, look: [0.2, 0.5], curve: -0.3 };

function sheet(g, t) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#DCE3EA'); bg.addColorStop(1, '#BCC7D2');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  plate(g, 'BOBBY FISCHER · LOOK', W / 2, 96, { color: '#1D2129', size: 46, rot: 0 });
  const cw = 330, chh = 520, gx = 15, x0 = (W - 3 * cw - 2 * gx) / 2, rows = [178, 718, 1258];
  const cell = (col, row, label, draw) => {
    const x = x0 + col * (cw + gx), y = rows[row];
    g.save(); g.beginPath(); g.roundRect(x, y, cw, chh, 22); g.clip();
    const cg = g.createLinearGradient(0, y, 0, y + chh); cg.addColorStop(0, '#F2F5F8'); cg.addColorStop(1, '#D3DBE3'); g.fillStyle = cg; g.fillRect(x, y, cw, chh);
    draw(x + cw / 2, y, x, cw);
    g.restore();
    g.save(); g.font = sans(30, 900); g.fillStyle = '#1D2129'; g.textAlign = 'left'; g.fillText(label, x + 18, y + 44); g.restore();
  };
  const bust = (who, e, k = 1.12) => (cx, y) => drawChar(g, who, { x: cx, y: y + 250, s: k, e, t });
  cell(0, 0, 'REF', (cx, y, x, w) => { const sc = Math.max(w / REF.width, chh / REF.height); g.drawImage(REF, cx - REF.width * sc / 2, y + chh / 2 - REF.height * sc / 2, REF.width * sc, REF.height * sc); });
  cell(1, 0, 'A', bust('fischerA', STARE));
  cell(2, 0, 'B', bust('fischerB', STARE));
  cell(0, 1, 'C (longer)', bust('fischerC', STARE));
  cell(1, 1, 'A · smirk', bust('fischerA', SMIRK));
  cell(2, 1, 'A · cold', bust('fischerA', COLD));
  cell(0, 2, '1956 (13)', bust('fischer13', { ...EXPR.focus, look: [0, 0.4], lid: 0.12 }));
  cell(1, 2, 'A · 1972', bust('fischerA', { ...SMIRK, look: [0.3, 0.1] }));
  cell(2, 2, 'A · "I hate chess"', bust('fischerShirt', EMPTY));
}

export async function build(T) {
  const shots = [{ a: 0, draw: (g, lt, t) => sheet(g, t), grade: 'neutral', trans: 'cut', noJump: true, info: true }];
  return { shots, cues: [], music: [{ t: 0, m: 'void' }, { t: T.duration, m: 'end' }], musicFx: [], duration: T.duration };
}
