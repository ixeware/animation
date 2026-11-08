// "There's always a bigger fish" (The 64 Files). Stockfish, the strongest chess player on Earth, is a fish (the cod of
// its logo, cut out); it only came up in November 2008, ten months after Bobby Fischer died, and Fischer is German for
// "fisherman". The hook: the fish, and above the surface the silhouette of a man with a rod. Then the engines it eats,
// the worm on the hook, the bite and the yank through the surface in slow motion to the pier where the fisherman stands;
// his catches (1956, the U.S. title at 14, twenty wins in a row, Reykjavik 1972 against the Soviet machine), the empty
// chair of 1975, the empty boat, the floor of the photo ("I hate chess"), the rod left on a snowy pier, 64 squares, and
// the fish coming up at last. Sources and what is drawn: SOURCES.md. Storyboard: SCENARIO.md.
// Palette: a bright sea (turquoise, sand), a misty lake at dawn (peach sky, blue water, warm pier wood), the warm club of
// 1956, the red machine of 1972, the grey room of the photo, a snowy pier.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board, piecesAt, sqXZ } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar, hand } from '../../engine/js/characters.js';
import { plate, inkText, inkWidth, counter, sans, popIn } from '../../engine/js/hud.js';
import { rig, seated } from '../../engine/js/stage.js';
import { room, table, chair, gear, FLOOR_Y, chessClock } from '../../engine/js/env.js';
import { useLookV2, SKIN2 } from '../../engine/js/look.js';
import { spotCone, bokeh } from '../../engine/js/light.js';
import { BOOM_HIT, MOVE_HIT, SLIDE, SLIDE_OPTS, slide, moveOf, moveUnder, moveOver } from '../../engine/js/movefx.js';
import { loadImage } from '../../engine/js/photo.js';
import { flashTint } from '../../engine/js/hifx.js';
import { confetti, rays, speedlines } from '../../engine/js/draw.js';
import { shockwave, glint } from '../../engine/js/fx.js';
import { trophy } from '../../engine/js/witty.js';
import { drawPiece } from '../../engine/js/pieces.js';

useLookV2();
const CHANNEL = 'THE 64 FILES';
const B = new Board();
const GOLD = '#F2C14E', RED = '#E0603F', CREAM = C.cream, LIME = C.lime, BLUE = '#2F63B8', SKY = '#5DB8F0';
const FISH = await loadImage('../episodes/hikaru213/photos/stockfish_fish.png');
const GOC = await fetch('../engine/data/game_of_century.json').then(r => r.json());
const G3 = await fetch('../engine/data/spassky_fischer_1972_g3.json').then(r => r.json());
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const tex = (w, h, draw) => { const c = makeCanvas(w, h), x = c.getContext('2d'); draw(x, w, h); return c; };
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); return true; } return false; };
const PI = Math.PI;

// ---------- Bobby Fischer: wavy tousled hair with a lock on the forehead, deep-set eyes under heavy brows, a big nose,
// lips a little full but not puffy, a drawn jaw line and cheekbones (the author's brief, after the young portrait) ----------
const HAIR = '#3A2A1E', HAIR_LO = '#21170F', HAIR_HI = '#6E5442', LIP = '#9A5E54';
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
      if ((e.mouth ?? 'line') === 'line' && (e.open ?? 0) < 0.2) {  // a hint of the lower lip: a thin muted crescent, not a puffy one
        const cy = 71 - (e.curve ?? 0) * 3;
        g.fillStyle = rgba(LIP, 0.34); g.beginPath(); g.ellipse(0, cy, 15, 4.2, 0, 0, Math.PI); g.fill();
      }
    }
  };
}
const fischer = (o = {}) => { const c = { face: [0.95, 1.02, 0.87], hair: 'custom', hairC: HAIR, brow: '#251910', iris: '#4A3527', nose: 1.38, ears: 1.04, lids: 0.08,
  skin: { blush: '#D9AE98' },
  suit: '#2C313C', suitD: '#1D2129', shirt: 'tie', tie: '#1E222B', hairFx: fischerHair, ...o }; c.faceFx = fischerFace(c); return c; };
CAST.fischerA = fischer();
CAST.fischerB = fischer({ face: [0.98, 0.98, 0.91] });
CAST.fischerC = fischer({ face: [0.93, 1.06, 0.84] });
CAST.fischerShirt = fischer({ suit: '#D8D3C8', suitD: '#B9B3A7', shirt: 'open' });
CAST.fischer13 = fischer({ face: [0.99, 0.95, 0.93], nose: 1.12, lids: 0, young: true, suit: '#7FA6C4', suitD: '#5E86A6', shirt: 'polo' });

CAST.fischer14 = fischer({ face: [0.98, 0.97, 0.91], nose: 1.18, lids: 0, young: true, suit: '#4E5866', suitD: '#39414C', shirt: 'tie', tie: '#2A2F38' });

// expressions: the cold stare, the smirk at his catch, the empty look on the floor
const STARE = { ...EXPR.focus, lid: 0.22, look: [0, 0], curve: -0.08 };
const SMIRK = { ...EXPR.smug, lid: 0.28, look: [0, 0], curve: 0.4 };
const COLD = { ...EXPR.neutral, brow: 0.45, browY: 4, lid: 0.26, look: [0.25, 0.35], curve: -0.15 };
const EMPTY = { ...EXPR.tired, lid: 0.34, look: [0.55, 0.35], curve: -0.3 };

// ======================= THE SEA (as in hikaru213): a bright blue with light from the surface, a sand floor =======================
const fogSea = (col, d) => mix(col, '#185E96', clamp((d - 6) / 34) * 0.92);
const WEED = (() => { const r = rng(57), a = []; for (let i = 0; i < 26; i++) a.push({ x: -14 + r() * 36, z: 2 + r() * 34, h: 1.6 + r() * 3.4, ph: r() * 6, c: r() < 0.5 ? '#2F8A5E' : '#3E9C4E' }); return a; })();
const ROCKS = (() => { const r = rng(91), a = []; for (let i = 0; i < 9; i++) a.push({ x: -10 + r() * 28, z: 4 + r() * 30, r: 0.6 + r() * 1.4 }); return a; })();
const SEAY = -6;
function sea(g, t, { shade = 0 } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#62C9EC'); gr.addColorStop(0.42, '#2384C0'); gr.addColorStop(1, '#0E3F73');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let z = 44; z > -6; z -= 2) {
    const d = depth(4, SEAY, z + 1); if (d < 0.5) continue;
    if (B.poly(g, [[-30, SEAY, z], [40, SEAY, z], [40, SEAY, z + 2], [-30, SEAY, z + 2]])) { g.fillStyle = fogSea(z % 4 === 0 ? '#D8C48E' : '#CFBA82', d); g.fill(); }
  }
  for (const k of ROCKS) { const d = depth(k.x, SEAY, k.z); if (d < 1) continue; const p = B.project(k.x, SEAY, k.z); g.fillStyle = fogSea('#5D6F7A', d); g.beginPath(); g.ellipse(p.x, p.y, k.r * p.s, k.r * p.s * 0.45, 0, PI, 0); g.fill(); }
  for (const k of [...WEED].sort((a, b) => depth(b.x, SEAY, b.z) - depth(a.x, SEAY, a.z))) {
    const d = depth(k.x, SEAY, k.z); if (d < 1) continue;
    const p0 = B.project(k.x, SEAY, k.z), sw = Math.sin(t * 1.3 + k.ph) * 0.5, p1 = B.project(k.x + sw * 0.5, SEAY + k.h * 0.55, k.z), p2 = B.project(k.x + sw, SEAY + k.h, k.z);
    g.strokeStyle = fogSea(k.c, d); g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.28 * p0.s);
    g.beginPath(); g.moveTo(p0.x, p0.y); g.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); g.stroke();
  }
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const x0 = -140 + i * 230 + Math.sin(t * 0.5 + i * 1.9) * 50, w0 = 70 + (i * 41) % 80;
    const lg = g.createLinearGradient(0, 0, 0, H * 0.85); lg.addColorStop(0, 'rgba(225,248,255,0.19)'); lg.addColorStop(1, 'rgba(225,248,255,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x0, -10); g.lineTo(x0 + w0, -10); g.lineTo(x0 + w0 + 330, H * 0.85); g.lineTo(x0 + 250, H * 0.85); g.closePath(); g.fill();
  }
  g.restore();
  if (shade > 0) { g.fillStyle = `rgba(4,22,44,${(0.55 * shade).toFixed(3)})`; g.fillRect(0, 0, W, H); }
}
function bubble(g, x, y, R) {
  g.strokeStyle = 'rgba(235,250,255,0.75)'; g.lineWidth = Math.max(1.5, R * 0.14); g.beginPath(); g.arc(x, y, R, 0, 7); g.stroke();
  g.fillStyle = 'rgba(235,250,255,0.18)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x - R * 0.35, y - R * 0.35, R * 0.22, 0, 7); g.fill();
}
function seaSpecks(g, t, { burst = null } = {}) {
  const r = rng(33);
  for (let i = 0; i < 70; i++) {
    const x = -8 + r() * 24, z = -1 + r() * 26, y = SEAY + ((r() * 14 + t * (0.15 + r() * 0.2)) % 14);
    if (depth(x, y, z) < 1) continue; const p = B.project(x, y, z);
    g.fillStyle = `rgba(230,245,255,${(0.25 + 0.3 * r()).toFixed(2)})`; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, 0.035 * p.s), 0, 7); g.fill();
  }
  const bub = (x, y, z, rr) => { if (depth(x, y, z) < 1) return; const p = B.project(x, y, z); bubble(g, p.x, p.y, Math.max(3, rr * p.s)); };
  const r2 = rng(71);
  for (let i = 0; i < 22; i++) { const x = -5 + r2() * 18, z = 1 + r2() * 16, sp = 0.6 + r2() * 0.8, y = SEAY + ((r2() * 13 + t * sp) % 13); bub(x + Math.sin(t * 2 + i) * 0.08, y, z, 0.06 + r2() * 0.1); }
  if (burst) { const [bx, by, bz, t0] = burst, dt = t - t0; if (dt > 0 && dt < 1.4) { const r3 = rng(19); for (let i = 0; i < 18; i++) { const a = r3() * 6.28, v = 0.6 + r3() * 1.6; bub(bx + Math.cos(a) * v * dt * 0.6 + 0.6 * r3(), by + dt * (1.2 + r3() * 1.4) + Math.sin(a) * 0.3, bz + (r3() - 0.5) * 0.8, 0.07 + r3() * 0.12); } } }
}
// 2D water for the half-under shots: light under the surface, deeper blue below, rays, specks; rise > 0 streams the
// bubbles down past a camera that rises
function under2d(g, t, { top = 0, rise = 0 } = {}) {
  const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, '#7FD8F2'); gr.addColorStop(0.3, '#2E92C8'); gr.addColorStop(1, '#0D3A6C');
  g.fillStyle = gr; g.fillRect(0, top, W, H - top);
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const x0 = -100 + i * 260 + Math.sin(t * 0.6 + i * 1.7) * 40, lg = g.createLinearGradient(0, top, 0, H);
    lg.addColorStop(0, 'rgba(225,248,255,0.2)'); lg.addColorStop(1, 'rgba(225,248,255,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x0, top); g.lineTo(x0 + 90, top); g.lineTo(x0 + 330, H); g.lineTo(x0 + 220, H); g.closePath(); g.fill();
  }
  g.restore();
  const r = rng(8);
  for (let i = 0; i < 40; i++) {
    const x = r() * W, sp = 40 + r() * 80, y = top + ((r() * (H - top) - t * sp + rise * (900 + r() * 900)) % (H - top) + (H - top)) % (H - top);
    bubble(g, x + Math.sin(t * 2 + i) * 6, y, 3 + r() * 9);
  }
}
// the Stockfish fish (the logo's cod, cut out), facing left; drawn in strips that sway more toward the tail
const FISHC = makeCanvas(FISH.width, Math.ceil(FISH.height * 1.3)), fishx = FISHC.getContext('2d');
function fishPhoto(g, x, y, len, t, { rot = 0, wag = 1, flip = false, a = 1, shadow = true } = {}) {
  if (a <= 0) return;
  const iw = FISH.width, ih = FISH.height, ch = FISHC.height, n = 48;
  fishx.setTransform(1, 0, 0, 1, 0, 0); fishx.clearRect(0, 0, iw, ch);
  for (let i = 0; i < n; i++) {
    const u = i / n, x0 = Math.floor(u * iw), x1 = Math.floor((i + 1) / n * iw), amp = ih * 0.055 * wag * Math.pow(u, 1.7);
    fishx.drawImage(FISH, x0, 0, x1 - x0, ih, x0, (ch - ih) / 2 + Math.sin(t * 8.5 - u * 4.2) * amp, x1 - x0, ih);
  }
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(len / iw * (flip ? -1 : 1), len / iw);
  if (shadow) { g.shadowColor = 'rgba(4,30,60,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 26; }
  g.drawImage(FISHC, -iw / 2, -ch / 2);
  g.restore();
}
// the mouth of the cut-out fish relative to its centre, for a line in its mouth: the left tip of the image
const MOUTH = [-0.5, 0.02];
const mouthAt = (x, y, len, rot, flip = false) => { const mx = MOUTH[0] * len * (flip ? -1 : 1), my = MOUTH[1] * len; return [x + mx * Math.cos(rot) - my * Math.sin(rot), y + mx * Math.sin(rot) + my * Math.cos(rot)]; };
function smallCredit(g, text, y) {
  g.save(); g.font = sans(19, 700); g.letterSpacing = '2px'; const w = inkWidth(g, text) + 36;
  g.fillStyle = 'rgba(4,24,48,0.55)'; g.beginPath(); g.roundRect(W / 2 - w / 2, y - 18, w, 36, 18); g.fill();
  g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; inkText(g, text, W / 2, y + 1); g.restore();
}
// a small drawn fish (the other engines, the grandmasters, the catches), facing left like the logo's cod
function fishy(g, x, y, len, t, { col = '#8FA7B8', belly = '#E4ECF0', fin = null, rot = 0, wag = 1, ph = 0, flip = false, a = 1, stripe = null } = {}) {
  if (a <= 0 || len < 2) return;
  const L = len, Hh = len * 0.36, tw = Math.sin(t * 9 + ph) * wag * Hh * 0.35, tx = L * 0.36, fc = fin || mix(col, '#000000', 0.22);
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); if (flip) g.scale(-1, 1);
  g.fillStyle = fc;
  g.beginPath(); g.moveTo(tx, tw * 0.4); g.lineTo(L * 0.62, -Hh * 0.55 + tw); g.quadraticCurveTo(L * 0.52, tw, L * 0.62, Hh * 0.55 + tw); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-L * 0.08, -Hh * 0.44); g.quadraticCurveTo(L * 0.02, -Hh * 0.92, L * 0.17, -Hh * 0.38); g.closePath(); g.fill();
  const gr = g.createLinearGradient(0, -Hh / 2, 0, Hh / 2); gr.addColorStop(0, mix(col, '#000000', 0.25)); gr.addColorStop(0.45, col); gr.addColorStop(1, belly);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-L * 0.5, 0);
  g.bezierCurveTo(-L * 0.42, -Hh * 0.62, L * 0.1, -Hh * 0.66 + tw * 0.2, tx, tw * 0.4);
  g.bezierCurveTo(L * 0.1, Hh * 0.62 + tw * 0.2, -L * 0.42, Hh * 0.56, -L * 0.5, 0); g.fill();
  if (stripe) { g.strokeStyle = stripe; g.lineWidth = Hh * 0.13; g.lineCap = 'round'; g.beginPath(); g.moveTo(-L * 0.28, -Hh * 0.04); g.quadraticCurveTo(0, -Hh * 0.12, tx * 0.85, tw * 0.3); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(1.5, L * 0.014); g.beginPath(); g.arc(-L * 0.3, 0, Hh * 0.32, -1.1, 1.1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-L * 0.12, -Hh * 0.2, L * 0.16, Hh * 0.07, -0.05, 0, 7); g.fill();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(-L * 0.39, -Hh * 0.1, Hh * 0.13, 0, 7); g.fill();
  g.fillStyle = '#10161C'; g.beginPath(); g.arc(-L * 0.4, -Hh * 0.1, Hh * 0.075, 0, 7); g.fill();
  g.restore();
}
// a name tag over a fish
function fishTag(g, x, y, text, col, u = 1, size = 28) {
  if (u <= 0) return;
  const k = ease.back(clamp(u * 1.4));
  g.save(); g.font = sans(size, 900); g.letterSpacing = '2px';
  const w = inkWidth(g, text) + size * 1.1, h = size * 1.6;
  const edge = clamp((Math.min(x - w / 2, W - x - w / 2, y - h / 2, H - y - h / 2) - 40) / 50), al = clamp(u * 3) * edge;  // fades out near the frame's edges
  if (al < 0.02) { g.restore(); return; }
  g.globalAlpha *= al;
  g.translate(x, y); g.scale(k, k);
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
  g.fillStyle = col; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h * 0.3); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle'; inkText(g, text, 0, 1); g.restore();
  qaRect(g, x - w / 2, y - h / 2, w, h, 'text', text);
}
// the hook on its line, with a worm wriggling on it (worm 0: a bare hook)
function hookWorm(g, x, y, s, t, { worm = 1, top = -40, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.strokeStyle = 'rgba(240,250,255,0.8)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, top); g.lineTo(x, y - 60 * s); g.stroke();
  g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
  const hk = () => { g.beginPath(); g.moveTo(0, -54); g.lineTo(0, 34); g.arc(-22, 34, 22, 0, PI, false); g.lineTo(-44, 14); };
  g.strokeStyle = '#3C4650'; g.lineWidth = 8; hk(); g.stroke();
  g.strokeStyle = '#D5DEE4'; g.lineWidth = 4; hk(); g.stroke();
  g.fillStyle = '#D5DEE4'; g.beginPath(); g.moveTo(-44, 8); g.lineTo(-36, 22); g.lineTo(-48, 24); g.closePath(); g.fill();
  g.strokeStyle = '#3C4650'; g.lineWidth = 4; g.beginPath(); g.arc(0, -60, 6, 0, 7); g.stroke();
  if (worm > 0) {
    g.globalAlpha *= clamp(worm);
    const pts = []; for (let i = 0; i <= 26; i++) { const u = i / 26, free = Math.abs(u - 0.5) * 2; pts.push([Math.sin(u * 8.5 + t * 6.5) * (7 + 22 * free * free) + Math.sin(t * 3.7 + u * 3) * 5 * free, -46 + u * 128 + Math.cos(u * 6 + t * 5) * 4]); }
    const path = () => { g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); };
    g.lineJoin = 'round'; g.lineWidth = 19; g.strokeStyle = '#8E2F3C'; path(); g.stroke();
    g.lineWidth = 12; g.strokeStyle = '#D0606F'; path(); g.stroke();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,215,220,0.6)'; g.beginPath(); pts.slice(2, 24).forEach(([px, py], i) => i ? g.lineTo(px - 3, py - 2) : g.moveTo(px - 3, py - 2)); g.stroke();
    g.fillStyle = 'rgba(110,25,35,0.45)'; for (let i = 3; i < 24; i += 3) { const [px, py] = pts[i]; g.beginPath(); g.ellipse(px, py, 9, 2.6, 0, 0, 7); g.fill(); }
  }
  g.restore();
}

// ======================= LOOKING UP AT THE SURFACE: the window to the sky with the man on the pier =======================
const SIL = tex(1200, 1000, x => {
  x.fillStyle = '#0B1B2E'; x.strokeStyle = '#0B1B2E'; x.lineCap = 'round'; x.lineJoin = 'round';
  x.fillRect(40, 900, 560, 50); x.fillRect(84, 940, 46, 60); x.fillRect(500, 940, 46, 60);  // the end of the pier: its deck and two piles
  for (const sd of [-1, 1]) {  // the trousers, a little apart, and the shoes
    x.beginPath(); x.moveTo(300 + sd * 8, 590); x.lineTo(300 + sd * 80, 590); x.lineTo(300 + sd * 66, 888); x.lineTo(300 + sd * 22, 888); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(300 + sd * 50, 893, 44, 14, 0, 0, 7); x.fill();
  }
  x.beginPath(); x.moveTo(184, 610); x.lineTo(178, 300); x.quadraticCurveTo(188, 248, 244, 240); x.lineTo(356, 240); x.quadraticCurveTo(412, 248, 422, 300); x.lineTo(416, 610); x.closePath(); x.fill();  // the jacket
  x.fillRect(278, 200, 44, 50);
  x.beginPath(); x.ellipse(300, 158, 52, 62, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(296, 110, 62, 40, -0.12, 0, 7); x.fill();
  x.beginPath(); x.ellipse(270, 122, 24, 34, 0.5, 0, 7); x.fill();  // the lock over the forehead
  for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(300 + sd * 52, 166, 11, 16, 0, 0, 7); x.fill(); }
  x.lineWidth = 12; x.beginPath(); x.moveTo(268, 590); x.quadraticCurveTo(760, 300, 1150, 170); x.stroke();  // the rod, its tip bent by the line
  x.lineWidth = 46; x.beginPath(); x.moveTo(196, 300); x.lineTo(206, 470); x.lineTo(318, 556); x.stroke();  // both hands on it
  x.beginPath(); x.moveTo(404, 300); x.lineTo(432, 440); x.lineTo(372, 524); x.stroke();
});
const SIL_TIP = [1150, 170];
const SURF = makeCanvas(), surfx = SURF.getContext('2d');
function surfaceUp(g, t, { oy = 0, sil = 1 } = {}) {
  const x = surfx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
  const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9FE3F6'); gr.addColorStop(0.42, '#47B4E2'); gr.addColorStop(1, '#2384C0');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  const wx = W / 2 + 20, wy = 360, R = 470;
  // rays from the window down into the water
  x.save(); x.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const a0 = -0.95 + i * 0.24 + Math.sin(t * 0.7 + i) * 0.03, lg = x.createLinearGradient(wx, wy, wx, H);
    lg.addColorStop(0, 'rgba(235,252,255,0.26)'); lg.addColorStop(1, 'rgba(235,252,255,0)');
    x.fillStyle = lg; x.beginPath(); x.moveTo(wx + Math.sin(a0) * R * 0.7, wy + R * 0.5); x.lineTo(wx + Math.sin(a0 + 0.07) * R * 0.7, wy + R * 0.5);
    x.lineTo(wx + Math.sin(a0 + 0.07) * 2600, wy + 2400); x.lineTo(wx + Math.sin(a0) * 2600, wy + 2400); x.closePath(); x.fill();
  }
  x.restore();
  // outside the window: the underside of the surface, mirror-dark, with a net of caustic light
  x.save(); x.globalCompositeOperation = 'screen'; x.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    x.strokeStyle = `rgba(220,250,255,${(0.08 + 0.05 * Math.sin(t * 2 + i)).toFixed(3)})`; x.lineWidth = 5 + (i % 3) * 3;
    x.beginPath();
    for (let k = 0; k <= 24; k++) { const px = k / 24 * W, py = i * 52 - 60 + Math.sin(px * 0.011 + t * 1.4 + i * 1.3) * 26 + Math.sin(px * 0.027 - t * 2.1 + i) * 10; k ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  }
  x.restore();
  // the window: a soft disc of sky with the man and his rod on the end of the pier, wobbling with the ripples
  x.save(); x.beginPath(); x.ellipse(wx, wy, R, R * 0.86, 0, 0, 7); x.clip();
  const sk = x.createRadialGradient(wx, wy - 60, 30, wx, wy, R); sk.addColorStop(0, '#FFF7E6'); sk.addColorStop(0.6, '#E6F7FF'); sk.addColorStop(1, '#9ADDF3');
  x.fillStyle = sk; x.fillRect(wx - R, wy - R, R * 2, R * 2);
  const sh = 540, sw = SIL.width * sh / SIL.height, sx0 = wx - 322, sy0 = wy - 363;
  x.globalAlpha = 0.9 * sil;
  for (let yy = 0; yy < sh; yy += 4) {
    const off = Math.sin(yy * 0.045 + t * 2.6) * 3 + Math.sin(yy * 0.013 - t * 1.7) * 2;
    x.drawImage(SIL, 0, yy / sh * SIL.height, SIL.width, 4 / sh * SIL.height + 1, sx0 + off, sy0 + yy, sw, 5);
  }
  x.restore();
  const rim = x.createRadialGradient(wx, wy, R * 0.82, wx, wy, R * 1.12); rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(0.45, 'rgba(240,253,255,0.55)'); rim.addColorStop(1, 'rgba(20,90,140,0)');
  x.fillStyle = rim; x.beginPath(); x.ellipse(wx, wy, R * 1.12, R * 0.97, 0, 0, 7); x.fill();
  // the bottom of the layer fades into the water below, so it can slide in over the sea as the camera tilts up
  x.globalCompositeOperation = 'destination-in';
  const fade = x.createLinearGradient(0, H * 0.55, 0, H); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = fade; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  g.drawImage(SURF, 0, oy);
  const tip = [sx0 + SIL_TIP[0] / SIL.width * sw, sy0 + SIL_TIP[1] / SIL.height * sh + oy];
  return tip;
}

// ======================= THE LAKE: dawn mist over the water, a wooden pier, the far shore and its reflection =======================
const MOODS = {
  dawn: { sky: ['#8EC6EA', '#F4D7C4', '#FFE6C8'], water: ['#EED9C8', '#3C7C9C'], hill: '#9DB1C2', trees: '#5B7362', fog: '#F1DFD0', sun: 1 },
  day: { sky: ['#4FA8E8', '#A9DAF4', '#E2F2F8'], water: ['#D4EBF3', '#2C7CA6'], hill: '#8BAEC4', trees: '#4C7A57', fog: '#E0EEF3', sun: 0.8 },
  grey: { sky: ['#93A2AE', '#BCC6CD', '#D3D9DC'], water: ['#C8D0D4', '#5A6E7A'], hill: '#A6B2BA', trees: '#7A8A86', fog: '#CED5D9', sun: 0 },
  snow: { sky: ['#7D92A8', '#B5C3D0', '#D3DCE4'], water: ['#BCC8D2', '#3E5669'], hill: '#9DAEBE', trees: '#5E7280', fog: '#C8D2DB', sun: 0 },
};
const TREES = (() => { const r = rng(12), a = []; for (let x = -110; x <= 110; x += 1.6) a.push([x, 2.4 + r() * 2.2 + (r() < 0.22 ? 1.8 : 0)]); return a; })();
const HILLS = (() => { const r = rng(5), a = []; let h = 9; for (let x = -340; x <= 340; x += 9) { h = clamp(h + (r() - 0.5) * 5, 4, 17); a.push([x, h]); } return a; })();
const PY = 1.4, PZ1 = 58, SHORE = 64;  // the deck's height over the water; the pier runs from z = 0 (its end) to the shore
function ridge(g, pts, z, col, { mirror = false, a = 1 } = {}) {
  if (depth(0, 0, z) < 2) return;
  g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath();
  const q0 = B.project(pts[0][0], 0, z); g.moveTo(q0.x, q0.y);
  for (const [x, h] of pts) { const p = B.project(x, mirror ? -h * 0.8 : h, z); g.lineTo(p.x, p.y); }
  const q1 = B.project(pts[pts.length - 1][0], 0, z); g.lineTo(q1.x, q1.y); g.closePath(); g.fill(); g.restore();
}
const PLANK = (() => { const r = rng(4), a = []; for (let i = 0; i < 140; i++) a.push(mix('#A27A52', '#7E5C3C', r())); return a; })();
function lake(g, t, { mood = 'dawn', mist = 0.6, fog = 0, snow = 0, pier = true, far = false } = {}) {
  const M = MOODS[mood], dir = far ? -1 : 1, zT = SHORE * dir + (far ? -60 : 0), zH = 260 * dir;
  const fogL = (col, d) => mix(col, M.fog, clamp(clamp((d - 6) / 80) * 0.85 + fog));
  const hp = B.project(0, 0, 9000 * dir), hz = depth(0, 0, 9000 * dir) > 0 ? hp.y : -100;
  const sk = g.createLinearGradient(0, hz - 1500, 0, hz); sk.addColorStop(0, M.sky[0]); sk.addColorStop(0.62, M.sky[1]); sk.addColorStop(1, M.sky[2]);
  g.fillStyle = sk; g.fillRect(0, 0, W, Math.max(0, hz) + 2);
  if (M.sun > 0 && !far && depth(-70, 26, 600) > 0) {  // the low sun over the far shore, a wide soft glow
    const sp = B.project(-70, 26, 600), R = 620;
    const sg = g.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, R); sg.addColorStop(0, `rgba(255,248,226,${0.95 * M.sun})`); sg.addColorStop(0.18, `rgba(255,236,200,${0.55 * M.sun})`); sg.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = sg; g.fillRect(sp.x - R, sp.y - R, R * 2, R * 2);
    g.fillStyle = `rgba(255,252,240,${M.sun})`; g.beginPath(); g.arc(sp.x, sp.y, 44, 0, 7); g.fill();
  }
  ridge(g, HILLS, zH, fogL(M.hill, 200));
  const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, M.water[0]); wg.addColorStop(1, M.water[1]);
  g.fillStyle = wg; g.fillRect(0, hz, W, H - hz);
  ridge(g, HILLS, zH, fogL(M.hill, 200), { mirror: true, a: 0.3 });
  ridge(g, TREES, zT, fogL(M.trees, 70), { mirror: true, a: 0.42 });
  ridge(g, TREES, zT, fogL(M.trees, 70));
  // glitter under the sun, ripple streaks on the water
  if (M.sun > 0 && !far && depth(-70, 26, 600) > 0) {
    const sx = B.project(-70, 26, 600).x, r = rng(21);
    for (let i = 0; i < 70; i++) {
      const v = r(), y = hz + 6 + v * v * (H - hz), half = 20 + v * 260, x = sx + (r() - 0.5) * 2 * half * (0.3 + v);
      const a = (0.25 + 0.6 * M.sun) * (0.5 + 0.5 * Math.sin(t * 6 + i * 2.3)) * (1 - v * 0.6);
      g.fillStyle = `rgba(255,246,224,${a.toFixed(3)})`; g.fillRect(x, y, 10 + v * 60, 1.5 + v * 3.5);
    }
  }
  const r = rng(30);
  for (let i = 0; i < 150; i++) {
    const z = (3 + r() * 70) * dir, x = -40 + r() * 80 + Math.sin(t * 0.4 + i) * 0.6; if (depth(x, 0, z) < 1) continue;
    const p = B.project(x, 0, z), a = 0.22 * (1 - Math.abs(z) / 80) * (1 - fog);
    g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect(p.x - 0.5 * p.s, p.y, 1.0 * p.s, Math.max(1.2, 0.05 * p.s));
  }
  if (mist > 0) {  // bands of mist over the water at the far shore
    for (let i = 0; i < 6; i++) {
      const cx = W / 2 + Math.sin(t * 0.12 + i * 1.7) * 260, cy = hz - 40 + i * 34, rx = W * (0.7 + 0.1 * i), ry = 46 + 8 * i;
      const mg = g.createRadialGradient(cx, cy, 0, cx, cy, rx); mg.addColorStop(0, rgba(M.fog, 0.32 * mist)); mg.addColorStop(1, rgba(M.fog, 0));
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy); g.fillStyle = mg; g.fillRect(cx - rx, cy - rx, rx * 2, rx * 2); g.restore();
    }
  }
  if (pier) pierDeck(g, fogL);
  if (fog > 0) { const fg = g.createLinearGradient(0, hz - 600, 0, H); fg.addColorStop(0, rgba(M.fog, 0.85 * fog)); fg.addColorStop(0.5, rgba(M.fog, 0.55 * fog)); fg.addColorStop(1, rgba(M.fog, 0.15 * fog)); g.fillStyle = fg; g.fillRect(0, 0, W, H); }
  return { hz, fogL, M };
}
function pierDeck(g, fogL) {
  const posts = []; for (let z = 0; z <= PZ1; z += 4) for (const sd of [-1, 1]) posts.push([sd * 1.95, z]);
  posts.sort((a, b) => depth(b[0], 0, b[1]) - depth(a[0], 0, a[1]));
  for (const [x, z] of posts) {  // the posts and their wobbling reflections
    const d = depth(x, 0, z); if (d < 0.6) continue;
    quad(g, [[x - 0.17, 0, z], [x + 0.17, 0, z], [x + 0.17, -1.5, z], [x - 0.17, -1.5, z]], rgba(fogL('#2B2118', d), 0.28));
    quad(g, [[x - 0.17, -0.2, z], [x + 0.17, -0.2, z], [x + 0.17, PY - 0.1, z], [x - 0.17, PY - 0.1, z]], fogL('#4E3C2A', d));
  }
  const under = B.E[1] < PY;
  for (const sd of [-1, 1]) {  // the long side boards
    for (let z = PZ1; z > 0; z -= 6) { const d = depth(sd * 1.85, PY, z); if (d < 0.6) continue; quad(g, [[sd * 1.85, PY - 0.34, z], [sd * 1.85, PY - 0.34, Math.max(0, z - 6)], [sd * 1.85, PY, Math.max(0, z - 6)], [sd * 1.85, PY, z]], fogL('#6A4E34', d)); }
  }
  if (!under) {
    for (let i = Math.floor(PZ1 / 0.5) - 1; i >= 0; i--) {
      const z = i * 0.5, d = depth(0, PY, z); if (d < 0.6) continue;
      quad(g, [[-1.85, PY, z + 0.04], [1.85, PY, z + 0.04], [1.85, PY, z + 0.47], [-1.85, PY, z + 0.47]], fogL(PLANK[i % PLANK.length], d));
    }
  } else quad(g, [[-1.85, PY - 0.3, 0], [1.85, PY - 0.3, 0], [1.85, PY - 0.3, PZ1], [-1.85, PY - 0.3, PZ1]], fogL('#3A2C1E', 20));
}
function pierFront(g) { const d = depth(0, PY, 0); if (d < 0.6) return; quad(g, [[-1.9, PY - 0.36, 0], [1.9, PY - 0.36, 0], [1.9, PY + 0.02, 0], [-1.9, PY + 0.02, 0]], '#6E5136'); }
// snow falling in front of the camera
function snowfall(g, t, a = 1) {
  const r = rng(77);
  g.save(); g.fillStyle = `rgba(255,255,255,${(0.85 * a).toFixed(3)})`;
  for (let i = 0; i < 140; i++) {
    const s = 2 + r() * 6, sp = 60 + s * 26, x = (r() * W + Math.sin(t * 0.8 + i) * 30) % W, y = (r() * H + t * sp) % (H + 20) - 10;
    g.beginPath(); g.arc(x, y, s * 0.5, 0, 7); g.fill();
  }
  g.restore();
}

// ======================= PEOPLE: a standing man (hikaru213's walker) who can hold a rod or a stringer =======================
function limb(g, a, b, wa, wb, col, colD = mix(col, '#000000', 0.4)) {
  if (depth(...a) < 0.5 || depth(...b) < 0.5) return;
  const P = B.project(...a), Q = B.project(...b), w0 = wa * P.s, w1 = wb * Q.s;
  const dx = Q.x - P.x, dy = Q.y - P.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const gr = g.createLinearGradient(P.x + nx * w0, P.y + ny * w0, P.x - nx * w0, P.y - ny * w0); gr.addColorStop(0, colD); gr.addColorStop(0.42, col); gr.addColorStop(1, colD);
  g.fillStyle = gr; g.beginPath(); g.moveTo(P.x + nx * w0, P.y + ny * w0); g.lineTo(Q.x + nx * w1, Q.y + ny * w1); g.lineTo(Q.x - nx * w1, Q.y - ny * w1); g.lineTo(P.x - nx * w0, P.y - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(Q.x, Q.y, w1, 0, 7); g.arc(P.x, P.y, w0, 0, 7); g.fill();
}
function shoe(g, cx, ty, s) {
  const hw = s * 0.4, h = s * 0.3, top = ty - s * 0.06;
  const gr = g.createLinearGradient(cx - hw, 0, cx + hw, 0); gr.addColorStop(0, '#1A0F09'); gr.addColorStop(0.45, '#4A2C1A'); gr.addColorStop(1, '#1A0F09');
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - hw * 0.82, top); g.lineTo(cx + hw * 0.82, top);
  g.quadraticCurveTo(cx + hw * 1.12, top + h * 0.5, cx + hw * 1.02, top + h * 0.84); g.lineTo(cx - hw * 1.02, top + h * 0.84);
  g.quadraticCurveTo(cx - hw * 1.12, top + h * 0.5, cx - hw * 0.82, top); g.closePath(); g.fill();
  g.fillStyle = '#0C0705'; g.beginPath(); g.roundRect(cx - hw * 1.06, top + h * 0.8, hw * 2.12, h * 0.22, h * 0.08); g.fill();
}
function footShadow(g, x, z, r, a = 1, y = FLOOR_Y) {
  if (a <= 0.02 || depth(x, y, z) < 0.6) return;
  const p = B.project(x, y, z), w = p.s * r, gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, w);
  gr.addColorStop(0, `rgba(0,0,0,${0.5 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.fillStyle = gr; g.translate(p.x, p.y); g.scale(1, 0.32); g.translate(-p.x, -p.y); g.fillRect(p.x - w, p.y - w, w * 2, w * 2); g.restore();
}
const HK = 0.82, FEET = 7.1 * 100 / 1.05 / HK;
function jacketClip(g) {
  g.beginPath(); g.moveTo(-700, -900); g.lineTo(700, -900); g.lineTo(700, 198); g.lineTo(160, 212);
  g.bezierCurveTo(156, 300, 150, 380, 148, 446); g.quadraticCurveTo(0, 470, -148, 446);
  g.bezierCurveTo(-150, 380, -156, 300, -160, 212); g.lineTo(-700, 198); g.closePath(); g.clip();
}
function leg(g, sd, { col }) {
  const ay = FEET - 34, ky = (440 + ay) / 2, sx = sd * 72;
  shoe(g, sx, ay + 4, 112);
  const gr = g.createLinearGradient(sd * 150, 0, 0, 0);
  gr.addColorStop(0, col[1]); gr.addColorStop(0.42, col[0]); gr.addColorStop(1, mix(col[1], '#000000', 0.25));
  g.fillStyle = gr; g.beginPath(); g.moveTo(sd * 2, 396); g.lineTo(sd * 147, 396);
  g.bezierCurveTo(sd * 148, 480, sd * 124, ky, sd * 112, ay);
  g.lineTo(sd * 32, ay); g.bezierCurveTo(sd * 28, ky + 20, sd * 14, 520, sd * 4, 478); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(sd * 74, 470); g.lineTo(sx, ay - 10); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(sd > 0 ? 32 : -112, ay - 8, 80, 8);
}
function hand2(g, x, y, r, sk = SKIN2) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); gr.addColorStop(0, sk.hi); gr.addColorStop(1, sk.base);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
function arm2(g, [x0, y0], [x1, y1], w0, w1, col, colD) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const gr = g.createLinearGradient(x0 + nx * w0, y0 + ny * w0, x0 - nx * w0, y0 - ny * w0); gr.addColorStop(0, colD); gr.addColorStop(0.45, col); gr.addColorStop(1, colD);
  g.fillStyle = gr; g.beginPath(); g.moveTo(x0 + nx * w0, y0 + ny * w0); g.lineTo(x1 + nx * w1, y1 + ny * w1); g.lineTo(x1 - nx * w1, y1 - ny * w1); g.lineTo(x0 - nx * w0, y0 - ny * w0); g.closePath(); g.fill();
  g.beginPath(); g.arc(x1, y1, w1, 0, 7); g.arc(x0, y0, w0, 0, 7); g.fill();
}
// the fisherman: arms down, or both hands on a rod (rod.bend: how far its tip is pulled down), or one hand raised with a
// stringer. Returns the head's projection and the scale; tip: the rod's tip on screen; grip: the raised fist on screen
function fisher(g, x, z, { who = 'fischerA', e = STARE, t = 0, k = 1, y0 = PY, fx = 0, fz = -1, a = 1, rod = null, raise = false } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8 || a <= 0) return null;
  const c = CAST[who], p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK;
  const ex = typeof e === 'string' ? EXPR[e] : e, dx = x - B.E[0], dz = z - B.E[2], l = Math.hypot(dx, dz) || 1;
  const ee = { ...ex, turn: clamp((ex.turn || 0) + (fx * dz - fz * dx) / l * 0.85, -1, 1) };
  const out = { p, sc, tip: null, grip: null };
  const at = (u, v) => [p.x + u * sc, p.y + v * sc];
  g.save(); g.globalAlpha *= a;
  footShadow(g, x, z, 1.3 * k, 0.55, y0);
  g.translate(p.x, p.y); g.scale(sc, sc);
  const tc = [mix(c.suit, '#000000', 0.1), mix(c.suitD, '#000000', 0.35)];
  for (const sd of [-1, 1]) leg(g, sd, { col: tc });
  g.save(); jacketClip(g); drawChar(g, who, { e: ee, t });
  g.strokeStyle = 'rgba(0,0,0,0.24)'; g.lineWidth = 5;
  if (!rod) for (const sd of raise ? [1] : [-1, 1]) { g.beginPath(); g.moveTo(sd * 114, 236); g.quadraticCurveTo(sd * 120, 340, sd * 112, 444); g.stroke(); }
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(-150, 436); g.quadraticCurveTo(0, 460, 150, 436); g.lineTo(150, 480); g.lineTo(-150, 480); g.closePath(); g.fill();
  g.restore();
  const sl = c.suit, slD = mix(c.suitD, '#000000', 0.25), cuff = mix(c.suitD, '#000000', 0.2);
  if (rod) {  // the lower hand at his belt, the upper one forward and to his left (our right); the rod rises to the right
    const { lo, hi, ux, uy, tip, ctl } = rodGeom(rod);
    arm2(g, [118, 246], [158, 372], 46, 38, sl, slD); arm2(g, [158, 372], hi, 38, 30, sl, slD);
    g.lineCap = 'round';
    g.strokeStyle = '#3A2A1C'; g.lineWidth = 17; g.beginPath(); g.moveTo(lo[0] - ux * 90, lo[1] - uy * 90); g.lineTo(lo[0] + ux * 40, lo[1] + uy * 40); g.stroke();
    g.strokeStyle = '#17181B'; g.lineWidth = 9; g.beginPath(); g.moveTo(lo[0], lo[1]); g.quadraticCurveTo(ctl[0], ctl[1], tip[0], tip[1]); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#6A7078'; g.beginPath(); g.arc(lo[0] + 26, lo[1] + 22, 24, 0, 7); g.fill(); g.fillStyle = '#3E4248'; g.beginPath(); g.arc(lo[0] + 26, lo[1] + 22, 10, 0, 7); g.fill();
    arm2(g, [-118, 246], [-160, 392], 46, 38, sl, slD); arm2(g, [-160, 392], lo, 38, 30, sl, slD);
    hand2(g, lo[0], lo[1], 31); hand2(g, hi[0], hi[1], 31);
    out.tip = at(tip[0], tip[1]);
  } else {
    for (const sd of [-1, 1]) {
      if (raise && sd < 0) {  // his right arm up, the fist at the height of his head
        arm2(g, [-118, 246], [-232, 120], 46, 38, sl, slD); arm2(g, [-232, 120], [-214, -70], 38, 31, sl, slD);
        hand2(g, -214, -92, 33); out.grip = at(-214, -92); continue;
      }
      hand(g, sd * 142, 470, 30);
      g.fillStyle = cuff; g.beginPath(); g.roundRect(sd * 128 - 26, 430, 52, 22, 8); g.fill();
    }
  }
  g.restore();
  return out;
}
// the rod's geometry in the fisherman's own units, and its tip on screen (for shots that need the tip before drawing him)
function rodGeom(rod = {}) {
  const lo = [-22, 404], hi = [74, 300], L = rod.len ?? 1150, bend = rod.bend ?? 0.2;
  const dl = Math.hypot(hi[0] - lo[0], hi[1] - lo[1]), ux = (hi[0] - lo[0]) / dl, uy = (hi[1] - lo[1]) / dl;
  return { lo, hi, ux, uy, tip: [hi[0] + ux * L + L * bend * 0.42, hi[1] + uy * L + L * bend * 0.62], ctl: [hi[0] + ux * L * 0.6, hi[1] + uy * L * 0.6] };
}
function rodTip(x, z, { k = 1, y0 = PY, rod = {} } = {}) {
  const hy = y0 + 7.1 * k; if (depth(x, hy, z) < 0.8) return null;
  const p = B.project(x, hy, z), sc = p.s * k / 100 * 1.05 * HK, { tip } = rodGeom(rod);
  return [p.x + tip[0] * sc, p.y + tip[1] * sc];
}
// a fish hanging head up on the line from a rod tip; it swings and struggles. Returns its mouth on screen
function hangFish(g, tip, len, drop, t, { swing = 0.12, wag = 1.6, a = 1, at = null } = {}) {
  const ang = Math.sin(t * 2.3) * swing, m = at || [tip[0] + Math.sin(ang) * drop, tip[1] + Math.cos(ang) * drop];
  g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(248,252,255,0.85)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(tip[0], tip[1]); g.lineTo(m[0], m[1]); g.stroke(); g.restore();
  const rot = PI / 2 + ang * 0.7 + Math.sin(t * 7) * 0.05 * wag;
  fishPhoto(g, m[0] - Math.cos(rot) * MOUTH[0] * len, m[1] - Math.sin(rot) * MOUTH[0] * len, len, t, { rot, wag, a });
  return m;
}
// drops thrown up by a splash, falling back (screen space)
function splash(g, x, y, t, t0, { n = 46, power = 1100, seed = 3, life = 1.3, size = 9 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life) return;
  const r = rng(seed);
  g.save();
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (r() - 0.5) * 2.2, v = power * (0.35 + r() * 0.75), s = size * (0.4 + r());
    const px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 1600 * dt * dt;
    g.fillStyle = `rgba(240,252,255,${(0.9 * (1 - dt / life)).toFixed(3)})`; g.beginPath(); g.ellipse(px, py, s * 0.7, s, a + PI / 2, 0, 7); g.fill();
  }
  const cu = clamp(dt / 0.35);  // the crown of foam at the surface
  if (cu < 1) { g.fillStyle = `rgba(255,255,255,${(0.8 * (1 - cu)).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, 60 + 200 * cu, 26 + 30 * cu, 0, 0, 7); g.fill(); }
  g.restore();
}
// the waterline of a half-under shot: a wavy band across the frame; above() and below() draw the two halves
const waveY = (x, wl, t) => wl + Math.sin(x * 0.012 + t * 3.1) * 9 + Math.sin(x * 0.031 - t * 4.3) * 4;
function wavePath(g, wl, t) { g.moveTo(-10, waveY(-10, wl, t)); for (let x = 30; x <= W + 40; x += 40) g.lineTo(x, waveY(x, wl, t)); }
function overUnder(g, t, wl, above, below) {
  if (wl > -40) { g.save(); g.beginPath(); g.moveTo(-10, -10); g.lineTo(W + 40, -10); g.lineTo(W + 40, waveY(W + 40, wl, t)); for (let x = W; x >= -10; x -= 40) g.lineTo(x, waveY(x, wl, t)); g.closePath(); g.clip(); above(g); g.restore(); }
  if (wl < H + 40) { g.save(); g.beginPath(); wavePath(g, wl, t); g.lineTo(W + 40, H + 10); g.lineTo(-10, H + 10); g.closePath(); g.clip(); below(g); g.restore(); }
  if (wl > -40 && wl < H + 40) {
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(20,70,100,0.35)'; g.lineWidth = 22; g.beginPath(); g.translate(0, 14); wavePath(g, wl, t); g.stroke(); g.translate(0, -14);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 7; g.beginPath(); wavePath(g, wl, t); g.stroke();
    g.strokeStyle = 'rgba(190,240,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.translate(0, 9); wavePath(g, wl, t); g.stroke();
    g.restore();
  }
}

// ======================= 1956: the club room of the Game of the Century; 1958: the U.S. trophy =======================
const WOOD = { light: '#E4C89C', dark: '#9C6B40', frame: '#4A2F1B', side: '#2C1B0F', m: 0.42, th: 0.38, rc: 0.25 };
const CLUB = { over: { wall: ['#9A7650', '#8A6844'], floor: ['#5A3E26', '#4E3520'], light: '#FFE2B0', lightA: 0.42, base: '#2A1A0E' } };
// the crown of the world title
function crown(g, x, y, s, { tilt = 0, gray = 0, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  const col = mix(GOLD, '#8C8F92', gray), dk = mix('#C98D24', '#6E7174', gray);
  g.shadowColor = rgba(GOLD, 0.8 * (1 - gray)); g.shadowBlur = 34;
  const gr = g.createLinearGradient(-100, -70, 100, 50); gr.addColorStop(0, mix('#FFE7A0', '#B9BCBF', gray)); gr.addColorStop(0.5, col); gr.addColorStop(1, dk);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-90, 40); g.lineTo(-100, -50); g.lineTo(-50, -10); g.lineTo(0, -70); g.lineTo(50, -10); g.lineTo(100, -50); g.lineTo(90, 40); g.closePath(); g.fill();
  g.shadowBlur = 0; g.fillStyle = dk; g.fillRect(-92, 30, 184, 22);
  g.fillStyle = mix(RED, '#A7AAAD', gray); for (const px of [-100, 0, 100]) { g.beginPath(); g.arc(px, px ? -54 : -76, 12, 0, 7); g.fill(); }
  g.fillStyle = mix('#3A7BD5', '#A7AAAD', gray); for (const px of [-45, 45]) { g.beginPath(); g.arc(px, 40, 8, 0, 7); g.fill(); }
  g.restore();
}

// ======================= REYKJAVIK 1972: a stage, the table, and behind Spassky the red machine =======================
const MACH_Z = -12;
function machine(g, t, { spin = 1, steam = 0, stop = 0 } = {}) {
  const z = MACH_Z, run = 1 - stop;
  quad(g, [[-16, FLOOR_Y, z + 0.2], [24, FLOOR_Y, z + 0.2], [24, 20, z + 0.2], [-16, 20, z + 0.2]], '#4A0E12');
  for (let i = 0; i < 9; i++) { const x0 = -16 + i * 5; quad(g, [[x0 + 0.1, FLOOR_Y, z + 0.1], [x0 + 0.5, FLOOR_Y, z + 0.1], [x0 + 0.5, 20, z + 0.1], [x0 + 0.1, 20, z + 0.1]], '#36090C'); }
  for (const y of [1.2, 6.4, 13.2]) quad(g, [[-16, y, z], [24, y, z], [24, y + 0.7, z], [-16, y + 0.7, z]], '#7A1A1C');  // pipes across
  const ang = t * spin * 1.4 * run;
  for (const [x, y, r, d] of [[-6.5, 9.5, 4.2, 1], [1.2, 13.6, 2.8, -1.6], [8.6, 8.8, 5.0, -0.85], [15.8, 13.2, 3.1, 1.3], [14.4, 3.6, 2.5, -1.7], [-2.4, 3.2, 2.7, 1.5]])
    gear(g, B, x, y, z - 0.05, r, { teeth: Math.round(r * 4 + 6), angle: ang * d, color: '#C8322A', hub: '#2A0708' });
  for (let i = 0; i < 4; i++) {  // pistons pumping
    const x = -11 + i * 2.2, py = 2 + Math.max(0, Math.sin(t * 6 * run + i * 1.6)) * 1.6 * run;
    quad(g, [[x - 0.35, FLOOR_Y + 1, z - 0.1], [x + 0.35, FLOOR_Y + 1, z - 0.1], [x + 0.35, py + 3, z - 0.1], [x - 0.35, py + 3, z - 0.1]], '#8C8C90');
    quad(g, [[x - 0.6, py + 3, z - 0.12], [x + 0.6, py + 3, z - 0.12], [x + 0.6, py + 3.8, z - 0.12], [x - 0.6, py + 3.8, z - 0.12]], '#B0B4B8');
  }
  // the red star in a gold ring at the top
  const sp = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 1.1 : 2.6; sp.push([4 + Math.cos(a) * r, 17 - Math.sin(a) * r, z - 0.15]); }
  const ring = []; for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * PI; ring.push([4 + Math.cos(a) * 3.3, 17 + Math.sin(a) * 3.3, z - 0.12]); }
  if (B.poly(g, ring)) { g.fillStyle = GOLD; g.fill(); }
  const ring2 = ring.map(([x, y]) => [4 + (x - 4) * 0.86, 17 + (y - 17) * 0.86, z - 0.13]);
  if (B.poly(g, ring2)) { g.fillStyle = '#7A0E10'; g.fill(); }
  if (B.poly(g, sp)) { g.save(); g.shadowColor = '#FF3B30'; g.shadowBlur = 30 * run; g.fillStyle = '#E8302A'; g.fill(); g.restore(); }
  for (let i = 0; i < 7; i++) {  // red lamps blinking along the top pipe
    const x = -12 + i * 5.6, p = B.project(x, 13.55, z - 0.2); if (depth(x, 13.55, z - 0.2) < 1) continue;
    const on = run * (0.45 + 0.55 * (Math.sin(t * 7 + i * 1.3) > 0 ? 1 : 0));
    const lg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 1.2); lg.addColorStop(0, `rgba(255,90,70,${(0.95 * on).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,60,40,0)');
    g.fillStyle = lg; g.fillRect(p.x - p.s * 1.2, p.y - p.s * 1.2, p.s * 2.4, p.s * 2.4);
  }
  if (steam > 0) for (const [x, y] of [[-12.5, 19], [20.5, 19]]) {  // steam from two stacks
    const r = rng(x > 0 ? 5 : 9);
    for (let i = 0; i < 10; i++) {
      const u = ((t * 0.7 + r()) % 1), px = x + Math.sin(i + t) * 0.4 + u * 1.5 * (x > 0 ? -1 : 1), py = y + u * 6;
      if (depth(px, py, z + 1) < 1) continue; const p = B.project(px, py, z + 1), R = p.s * (0.8 + u * 2.4);
      const sg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); sg.addColorStop(0, `rgba(236,226,226,${(0.5 * (1 - u) * steam).toFixed(3)})`); sg.addColorStop(1, 'rgba(236,226,226,0)');
      g.fillStyle = sg; g.fillRect(p.x - R, p.y - R, R * 2, R * 2);
    }
  }
}
function stage72(g, t, o = {}) {
  g.fillStyle = '#16090B'; g.fillRect(0, 0, W, H);
  quad(g, [[-20, FLOOR_Y, MACH_Z], [28, FLOOR_Y, MACH_Z], [28, FLOOR_Y, 30], [-20, FLOOR_Y, 30]], '#2A1E22');
  for (let i = 0; i < 12; i++) { const z = MACH_Z + i * 3.5; quad(g, [[-20, FLOOR_Y + 0.01, z], [28, FLOOR_Y + 0.01, z], [28, FLOOR_Y + 0.01, z + 0.12], [-20, FLOOR_Y + 0.01, z + 0.12]], 'rgba(0,0,0,0.25)'); }
  machine(g, t, o);
  const glow = B.project(4, 6, MACH_Z + 2), gg = g.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.s * 22);
  gg.addColorStop(0, `rgba(255,70,50,${(0.28 * (1 - (o.stop || 0))).toFixed(3)})`); gg.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gg; g.fillRect(0, 0, W, H);
}

// ======================= THE GREY ROOM of the photo: a bare wall, a demonstration board, the floor =======================
const RZ = 10;  // the back wall
function greyRoom(g, t) {
  g.fillStyle = '#B9BBB8'; g.fillRect(0, 0, W, H);
  quad(g, [[-30, FLOOR_Y, -30], [30, FLOOR_Y, -30], [30, FLOOR_Y, RZ], [-30, FLOOR_Y, RZ]], '#7C7F82');
  for (let i = 0; i < 14; i++) { const z = RZ - i * 2.6; quad(g, [[-30, FLOOR_Y + 0.005, z], [30, FLOOR_Y + 0.005, z], [30, FLOOR_Y + 0.005, z - 0.05], [-30, FLOOR_Y + 0.005, z - 0.05]], 'rgba(0,0,0,0.06)'); }
  quad(g, [[-30, FLOOR_Y, RZ], [30, FLOOR_Y, RZ], [30, 22, RZ], [-30, 22, RZ]], '#E4E5E1');
  quad(g, [[14, FLOOR_Y, -30], [14, FLOOR_Y, RZ], [14, 22, RZ], [14, 22, -30]], '#D2D3CF');  // the wall on the right, the corner
  quad(g, [[-30, FLOOR_Y, RZ - 0.02], [14, FLOOR_Y, RZ - 0.02], [14, FLOOR_Y + 0.35, RZ - 0.02], [-30, FLOOR_Y + 0.35, RZ - 0.02]], '#5E6064');
  quad(g, [[14 - 0.02, FLOOR_Y, -30], [14 - 0.02, FLOOR_Y, RZ], [14 - 0.02, FLOOR_Y + 0.35, RZ], [14 - 0.02, FLOOR_Y + 0.35, -30]], '#5E6064');
  // the demonstration board over him, its grid, the rail under it
  quad(g, [[-8.5, FLOOR_Y + 6.6, RZ - 0.05], [8.5, FLOOR_Y + 6.6, RZ - 0.05], [8.5, FLOOR_Y + 13.5, RZ - 0.05], [-8.5, FLOOR_Y + 13.5, RZ - 0.05]], '#3E4449');
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.5;
  for (let i = 1; i < 16; i++) { const x = 1.5 + i * 0.44; const a = B.project(x, FLOOR_Y + 6.6, RZ - 0.06), b = B.project(x, FLOOR_Y + 13.5, RZ - 0.06); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  for (let j = 1; j < 16; j++) { const y = FLOOR_Y + 6.6 + j * 0.44; const a = B.project(1.5, y, RZ - 0.06), b = B.project(8.5, y, RZ - 0.06); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  g.restore();
  quad(g, [[-9, FLOOR_Y + 6.3, RZ - 0.4], [9, FLOOR_Y + 6.3, RZ - 0.4], [9, FLOOR_Y + 6.62, RZ - 0.06], [-9, FLOOR_Y + 6.62, RZ - 0.06]], '#F1F1EE');
  for (const x of [-7.6, 0.6, 7.6]) quad(g, [[x - 0.12, FLOOR_Y + 5.9, RZ - 0.06], [x + 0.12, FLOOR_Y + 5.9, RZ - 0.06], [x + 0.12, FLOOR_Y + 6.3, RZ - 0.06], [x - 0.12, FLOOR_Y + 6.3, RZ - 0.06]], '#C9CAC6');
  quad(g, [[10.2, FLOOR_Y + 2.6, RZ - 0.04], [11.6, FLOOR_Y + 2.6, RZ - 0.04], [11.6, FLOOR_Y + 3.9, RZ - 0.04], [10.2, FLOOR_Y + 3.9, RZ - 0.04]], '#9A9C99');  // a grille
  quad(g, [[4.9, FLOOR_Y + 1.6, RZ - 0.04], [5.3, FLOOR_Y + 1.6, RZ - 0.04], [5.3, FLOOR_Y + 2.1, RZ - 0.04], [4.9, FLOOR_Y + 2.1, RZ - 0.04]], '#F7F7F4');  // an outlet
  // window light from the left
  const wl = g.createLinearGradient(0, 0, W, 0); wl.addColorStop(0, 'rgba(255,255,250,0.18)'); wl.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = wl; g.fillRect(0, 0, W, H);
}
// Fischer on the floor against the wall, as in the photo: legs out (the right knee up a little), the right arm down by
// a paper cup, the left forearm on his knee; light shirt, grey trousers
function floorSit(g, t, e) {
  const who = 'fischerShirt', c = CAST[who], F = FLOOR_Y, x0 = 0.4, z0 = RZ - 1.0, hy = F + 4.55;
  if (depth(x0, hy, z0) < 1) return;
  const p = B.project(x0, hy, z0), sc = p.s / 100 * 1.05 * HK, trou = '#6E6A64', trouD = '#4A4742', shirt = '#E2DED4', shirtD = '#B9B4A8';
  footShadow(g, x0, z0 - 2.5, 4.2, 0.5, F);
  g.save(); g.translate(p.x, p.y); g.rotate(-0.05); g.scale(sc, sc);
  g.save(); jacketClip(g); drawChar(g, who, { e, t, tilt: 0.06 }); g.restore();
  g.restore();
  const bust = (u, v) => { const ca = Math.cos(-0.05), sa = Math.sin(-0.05); return [p.x + (u * ca - v * sa) * sc, p.y + (u * sa + v * ca) * sc]; };
  // the legs, from the hips toward the camera
  const hipR = [x0 - 0.75, F + 0.75, z0 - 0.2], kneeR = [x0 - 1.15, F + 2.05, z0 - 3.0], ankR = [x0 - 0.95, F + 0.42, z0 - 5.5];
  const hipL = [x0 + 0.75, F + 0.75, z0 - 0.2], kneeL = [x0 + 1.55, F + 1.25, z0 - 3.4], ankL = [x0 + 2.55, F + 0.42, z0 - 6.7];
  const legs = [[hipL, kneeL, ankL, 1], [hipR, kneeR, ankR, -1]].sort((a, b) => depth(...b[1]) - depth(...a[1]));
  for (const [hp, kn, an, sd] of legs) {
    limb(g, hp, kn, 0.6, 0.5, trou, trouD); limb(g, kn, an, 0.5, 0.36, trou, trouD);
    const toe = [an[0] + sd * 0.35, an[1] + 0.55, an[2] - 0.75];
    limb(g, an, toe, 0.34, 0.27, '#1E1A17', '#0A0807');
  }
  // the right arm hangs to the floor by the cup; the left forearm lies on the left knee
  const shR = bust(-138, 252), shL = bust(138, 252), cupP = [x0 - 2.55, F, z0 - 1.25];
  const handR = B.project(x0 - 2.25, F + 0.32, z0 - 1.05), kl = B.project(...kneeL);
  const elR = [lerp(shR[0], handR.x, 0.45) - 26 * sc, lerp(shR[1], handR.y, 0.5)], elL = [shL[0] + 60 * sc, shL[1] + 190 * sc];
  arm2(g, shR, elR, 44 * sc, 38 * sc, shirt, shirtD); arm2(g, elR, [handR.x, handR.y], 38 * sc, 30 * sc, shirt, shirtD);
  if (depth(...cupP) > 1) {  // the paper cup
    const q = B.project(...cupP), w = 0.3 * q.s, h = 0.62 * q.s;
    g.fillStyle = '#F4F2EC'; g.beginPath(); g.moveTo(q.x - w, q.y - h); g.lineTo(q.x + w, q.y - h); g.lineTo(q.x + w * 0.78, q.y); g.lineTo(q.x - w * 0.78, q.y); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(q.x + w * 0.2, q.y - h, w * 0.8, h);
    g.fillStyle = '#D9D6CE'; g.beginPath(); g.ellipse(q.x, q.y - h, w, w * 0.3, 0, 0, 7); g.fill();
  }
  hand2(g, handR.x, handR.y, 30 * sc);
  arm2(g, shL, elL, 44 * sc, 38 * sc, shirt, shirtD); arm2(g, elL, [kl.x - 20 * sc, kl.y - 40 * sc], 38 * sc, 30 * sc, shirt, shirtD);
  hand2(g, kl.x - 20 * sc, kl.y - 40 * sc, 30 * sc);
  // chess pieces scattered on the floor
  for (const [tp, cl, x, z, rot] of [['k', 'w', 3.9, z0 - 4.6, 1.45], ['p', 'b', -3.1, z0 - 3.4, -1.5], ['n', 'w', 1.2, z0 - 7.4, 0.2], ['p', 'w', 4.8, z0 - 2.2, 1.6], ['q', 'b', -1.8, z0 - 8.2, -1.35]]) {
    if (depth(x, F, z) < 1) continue; const q = B.project(x, F + (Math.abs(rot) > 1 ? 0.3 : 0), z);
    drawPiece(g, tp, cl, q.x, q.y, q.s * 1.05, { rot });
  }
}

// ======================= PROPS: the diver at a chessboard on the seabed, the empty boat, the rod left on the pier =======================
function diver(g, t, { x = 4, z = 9, look = 0 } = {}) {
  if (depth(x, SEAY, z) < 1) return;
  const b = B.project(x, SEAY, z), s = b.s / 100;
  g.save(); g.translate(b.x, b.y); g.scale(s, s);
  g.fillStyle = 'rgba(0,20,40,0.25)'; g.beginPath(); g.ellipse(60, 4, 210, 26, 0, 0, 7); g.fill();
  g.fillStyle = '#6E7F89'; g.beginPath(); g.ellipse(-10, -40, 70, 44, 0, PI, 0); g.fill(); g.fillRect(-80, -40, 140, 40);  // the rock he sits on
  g.fillStyle = '#7E8F98'; g.beginPath(); g.moveTo(112, 0); g.lineTo(132, -118); g.lineTo(292, -118); g.lineTo(312, 0); g.closePath(); g.fill();  // the rock table
  g.fillStyle = '#5E6E77'; g.beginPath(); g.moveTo(122, -118); g.lineTo(302, -118); g.lineTo(318, -184); g.lineTo(138, -184); g.closePath(); g.fill();
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {  // the board, seen from above at a slant
    g.fillStyle = (i + j) % 2 ? '#F1E6CF' : '#8A6440'; const y0 = -124 - j * 14, k = j * 3.5;
    g.beginPath(); g.moveTo(140 + i * 38 + k, y0); g.lineTo(178 + i * 38 + k, y0); g.lineTo(181.5 + i * 38 + k, y0 - 14); g.lineTo(143.5 + i * 38 + k, y0 - 14); g.closePath(); g.fill();
  }
  drawPiece(g, 'k', 'b', 258, -160, 58); drawPiece(g, 'q', 'b', 222, -164, 54); drawPiece(g, 'p', 'w', 186, -140, 34); drawPiece(g, 'k', 'w', 160, -128, 56);
  const suit = '#C8B07C', suitD = '#9A8456', lk = look * 0.5;
  g.strokeStyle = suitD; g.lineCap = 'round'; g.lineWidth = 46;
  g.beginPath(); g.moveTo(0, -110); g.lineTo(90, -112); g.lineTo(100, -6); g.stroke();  // the legs, bent
  g.strokeStyle = suit; g.lineWidth = 40; g.stroke();
  g.fillStyle = '#3A3E44'; g.beginPath(); g.ellipse(112, -4, 34, 16, 0, 0, 7); g.fill();  // a lead boot
  g.fillStyle = suit; g.beginPath(); g.roundRect(-58, -250, 116, 150, 40); g.fill();  // the body
  g.fillStyle = suitD; g.fillRect(-58, -132, 116, 18);  // the belt
  g.strokeStyle = suitD; g.lineWidth = 38; g.beginPath(); g.moveTo(40, -220); g.lineTo(112, -176); g.lineTo(148, -166); g.stroke();  // an arm out to the board
  g.strokeStyle = suit; g.lineWidth = 32; g.stroke();
  g.fillStyle = '#4A3E30'; g.beginPath(); g.ellipse(156, -166, 20, 15, 0.3, 0, 7); g.fill();  // the glove, on a piece
  const bp = g.createLinearGradient(0, -280, 0, -196); bp.addColorStop(0, '#E8B868'); bp.addColorStop(1, '#9A6428');
  g.fillStyle = bp; g.beginPath(); g.ellipse(0, -250, 84, 50, 0, 0, PI); g.fill();  // the brass breastplate
  g.fillStyle = '#B87A3A'; g.beginPath(); g.ellipse(0, -248, 74, 22, 0, 0, 7); g.fill();  // the brass collar
  g.save(); g.translate(0, -300); g.rotate(-lk);
  const hg = g.createRadialGradient(-20, -24, 6, 0, 0, 62); hg.addColorStop(0, '#FFE2A0'); hg.addColorStop(0.5, '#D49A3E'); hg.addColorStop(1, '#8A5A1E');
  g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fill();
  g.fillStyle = '#5A3A14'; g.beginPath(); g.arc(14, -4, 30, 0, 7); g.fill();
  g.fillStyle = '#1E3A4E'; g.beginPath(); g.arc(14, -4, 24, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(6, -12, 9, 5, -0.5, 0, 7); g.fill();
  g.fillStyle = '#5A3A14'; for (const a of [0.6, 2.2, 3.6, 5.0]) { g.beginPath(); g.arc(Math.cos(a) * 52, Math.sin(a) * 52, 5, 0, 7); g.fill(); }
  g.restore();
  g.strokeStyle = 'rgba(40,40,44,0.8)'; g.lineWidth = 10; g.beginPath(); g.moveTo(-40, -330); g.bezierCurveTo(-120, -600, 40, -900, -60, -1400); g.stroke();  // the air hose
  g.restore();
}
function boat(g, t, { x = 2, z = -14 } = {}) {
  if (depth(x, 0, z) < 1) return;
  const c = B.project(x, Math.sin(t * 1.1) * 0.05, z), s = c.s / 100;
  g.save(); g.translate(c.x, c.y); g.rotate(Math.sin(t * 0.8) * 0.03); g.scale(s, s);
  g.save(); g.scale(1, -0.55); g.globalAlpha = 0.25; g.fillStyle = '#4A3A2C'; g.beginPath(); g.moveTo(-240, 0); g.quadraticCurveTo(0, 90, 250, -10); g.lineTo(-240, 0); g.fill(); g.restore();  // its reflection
  g.fillStyle = '#5E4632'; g.beginPath(); g.moveTo(-240, -40); g.quadraticCurveTo(-210, 40, 0, 44); g.quadraticCurveTo(200, 40, 255, -64); g.lineTo(-240, -40); g.closePath(); g.fill();  // the hull
  g.fillStyle = '#7A5C40'; g.beginPath(); g.moveTo(-240, -40); g.quadraticCurveTo(0, -10, 255, -64); g.quadraticCurveTo(0, -56, -240, -40); g.fill();  // the inside
  g.strokeStyle = '#3E2E20'; g.lineWidth = 8; g.beginPath(); g.moveTo(-240, -40); g.quadraticCurveTo(0, -10, 255, -64); g.stroke();
  g.fillStyle = '#4A3726'; g.fillRect(-30, -52, 70, 12);  // the seat
  g.strokeStyle = '#2A2018'; g.lineWidth = 5; g.beginPath(); g.moveTo(-180, -62); g.lineTo(200, -98); g.stroke();  // a rod lying across it
  g.strokeStyle = '#6A4A30'; g.lineWidth = 10; g.beginPath(); g.moveTo(-120, -30); g.lineTo(-330, 30); g.stroke();  // an oar trailing in the water
  g.restore();
}
function abandonedRod(g, t) {
  const a = [-1.3, PY + 0.07, 1.9], b = [2.9, PY + 0.07, 1.0], w = [3.4, 0, 0.1];
  if (depth(...a) < 1 || depth(...b) < 1) return;
  const P = B.project(...a), Q = B.project(...b), R = B.project(...w);
  g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(240,248,255,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(Q.x, Q.y); g.quadraticCurveTo(Q.x + 30, R.y - 20, R.x, R.y); g.stroke();  // the slack line into the water
  g.strokeStyle = '#17181B'; g.lineWidth = Math.max(4, 0.07 * Q.s); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(Q.x, Q.y); g.stroke();
  const h = [lerp(P.x, Q.x, 0.16), lerp(P.y, Q.y, 0.16)];
  g.strokeStyle = '#3A2A1C'; g.lineWidth = Math.max(8, 0.14 * P.s); g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(h[0], h[1]); g.stroke();
  g.fillStyle = '#6A7078'; g.beginPath(); g.arc(h[0], h[1] + 0.12 * P.s, 0.2 * P.s, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(lerp(P.x, Q.x, 0.5), lerp(P.y, Q.y, 0.5) - 3, 0.25 * Q.s, 0.05 * Q.s, Math.atan2(Q.y - P.y, Q.x - P.x), 0, 7); g.fill();  // snow on it
  g.restore();
  const r = rng(13);  // snow on the planks
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 260; i++) { const x = -1.8 + r() * 3.6, z = -0.2 + r() * 11; if (depth(x, PY, z) < 1) continue; const p = B.project(x, PY + 0.01, z); g.fillRect(p.x, p.y, Math.max(2, 0.08 * p.s), Math.max(1, 0.03 * p.s)); }
}
// the words in chalk on the demonstration board, letter by letter
function chalk(g, t, text, t0, { x = 0, y = FLOOR_Y + 10.1, z = RZ - 0.07, step = 0.1 } = {}) {
  if (t < t0 || depth(x, y, z) < 1) return;
  const p = B.project(x, y, z), n = Math.min(text.length, Math.floor((t - t0) / step) + 1), fs = Math.round(p.s * 1.3);
  g.save(); g.font = sans(fs, 900); g.letterSpacing = `${Math.round(fs * 0.05)}px`; g.textAlign = 'left'; g.textBaseline = 'middle';
  let full = inkWidth(g, text);
  if (full > 820) { const f2 = Math.floor(fs * 820 / full); g.font = sans(f2, 900); g.letterSpacing = `${Math.round(f2 * 0.05)}px`; full = inkWidth(g, text); }
  const x0 = p.x - full / 2, sub = text.slice(0, n);
  g.fillStyle = 'rgba(250,250,246,0.35)'; g.fillText(sub, x0 + 2, p.y + 2);
  g.fillStyle = 'rgba(250,250,246,0.92)'; g.fillText(sub, x0, p.y);
  g.restore();
  qaRect(g, x0, p.y - fs * 0.6, full, fs * 1.2, 'text', text);
}
const pin = (t, t0, a = 1) => { const o = popIn(t, t0); return { ...o, a: (o.a ?? 1) * a, rot: 0 }; };

// ======================= THE FILM =======================
export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [], shots = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'neutral', trans: 'cut', noJump: true, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const K = (yaw, pitch, dist, target, o = {}) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.5, target, ...o });
  const lin = x => x;
  const boom = (t, gn = 0.8) => cue(t - BOOM_HIT, 'boom_move', gn);

  // ======================= HOOK: the sea; the fish swims up to the camera; the camera tilts up to the surface, where a man
  // in a suit stands on the end of a pier with a rod; his line comes down =======================
  const fishT = w('hook', 'fish'), andT = w('hook', 'and'), oneT = w('hook', 'one'), diedT = w('hook', 'died'), stS = s('stock');
  const TILT0 = andT - 0.05, TILT1 = oneT + 0.1;
  shot(0, (g, lt, t, sh) => {
    const u = ease.inOut(clamp((t - TILT0) / (TILT1 - TILT0)));
    rig(B, lt, [[0, K(0.2, 0.02, 12, [4.2, 0.4, 7.5])], [TILT0, K(0.06, 0.04, 9.6, [4.2, 0.5, 7.5])], [TILT1, K(0.02, 0.6, 9.0, [4.2, 2.0, 7.5])], [len(sh), K(0, 0.64, 8.8, [4.2, 2.2, 7.5])]], { t, e: lin });
    sea(g, t);
    const fu = ease.out(clamp(t / 2.4)), fx = lerp(9.5, 4.4, fu), fz = lerp(17, 7.5, fu), fy = 0.2 + Math.sin(t * 2) * 0.12;
    if (depth(fx, fy, fz) > 1) { const p = B.project(fx, fy, fz); fishPhoto(g, p.x, p.y, p.s * 4.9, t, { rot: Math.sin(t * 1.6) * 0.04, wag: 1.3 }); }
    seaSpecks(g, t);
    if (u > 0) {
      const tip = surfaceUp(g, t, { oy: lerp(-H * 1.05, 0, u) });
      if (u > 0.55) hookWorm(g, tip[0], lerp(tip[1] + 160, 1120, ease.inOut(clamp((t - oneT) / 1.3))), 1.3, t, { worm: 0, top: tip[1], a: clamp((u - 0.55) * 3) });
    }
  }, { hud: (g, lt, t) => {
    if (t < fishT) return;
    const a = 1 - clamp((t - TILT0) / 0.4);
    plate(g, 'STOCKFISH', W / 2, 250, { color: BLUE, size: 66, ...pin(t, fishT, a) });
    if (a > 0.01) { g.save(); g.globalAlpha *= a; smallCredit(g, 'Logo: Stockfish (GPLv3) · Klein Maetschke', 342); g.restore(); }
  } });
  cue(0.02, 'whoosh_soft', 0.25); cue(fishT, 'sparkle_pop', 0.25); cue(TILT0, 'whoosh_deep', 0.3); cue(oneT, 'sting', 0.35); cue(diedT, 'dun_dun', 0.4);

  // ======================= STOCKFISH: the engines swim round it, its record; on "food" it lunges and they scatter =======================
  const sfT = w('stock', 'stockfish'), ninT = w('stock', 'nineteen'), twT = w('stock', 'twelve'), evT = w('stock', 'every'), foodT = w('stock', 'food');
  const huT = w('stock', 'humans'), notT = w('stock', 'not');
  const ENG = [['LEELA', '#E8A23A'], ['KOMODO', '#7C5BD6'], ['TORCH', '#E0603F'], ['RECKLESS', '#2FA36B'], ['BERSERK', '#D94C8A'], ['OBSIDIAN', '#55606E']];
  const engAt = (i, t) => {
    const a = i / ENG.length * 2 * PI + 0.4 + t * (0.5 + (i % 3) * 0.08), fl = ease.in(clamp((t - foodT - 0.05) / 0.7)), R = 1 + fl * 2.4;
    return { x: 4.4 + Math.cos(a) * 4.7 * R, y: 0.6 + Math.sin(a * 2 + i) * 0.6 + (i % 2 ? 1.3 : -0.5) * (1 + fl), z: 7.5 + Math.sin(a) * 2.6 * R, dir: -Math.sin(a), fl };
  };
  shot(stS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.1, 0.06, 12, [4.3, 0.5, 7.5])], [len(sh), K(-0.06, 0.03, 9.8, [4.2, 0.45, 7.5])]], { t, e: lin, bump: t > foodT && t < foodT + 0.3 ? 1 : 0 });
    sea(g, t);
    const lunge = Math.sin(PI * clamp((t - foodT + 0.12) / 0.55));
    const big = { big: true, x: 4.4 - lunge * 1.4, y: 0.35 + Math.sin(t * 2.1) * 0.1, z: 7.5 - lunge * 0.8 };
    const items = ENG.map((e, i) => ({ ...engAt(i, t), i })).concat([big]).sort((a, b) => depth(b.x, b.y, b.z) - depth(a.x, a.y, a.z));
    for (const f of items) {
      if (depth(f.x, f.y, f.z) < 1) continue; const p = B.project(f.x, f.y, f.z); f.p = p;
      if (f.big) fishPhoto(g, p.x, p.y, p.s * 4.9, t, { wag: 1 + 2 * lunge });
      else fishy(g, p.x, p.y, p.s * 1.5, t, { col: ENG[f.i][1], belly: mix(ENG[f.i][1], '#FFFFFF', 0.6), flip: f.dir > 0, ph: f.i, wag: 1 + f.fl * 2, stripe: 'rgba(255,255,255,0.45)', a: 1 - clamp((f.fl - 0.6) * 2.5) });
    }
    for (const f of items) if (!f.big && f.p && t >= evT) fishTag(g, f.p.x, f.p.y - f.p.s * 0.8, ENG[f.i][0], ENG[f.i][1], (t - evT - f.i * 0.06) * 3 * (1 - f.fl), 24);
    seaSpecks(g, t, { burst: [big.x - 2.2, big.y, big.z, foodT] });
  }, { trans: 'whip', hud: (g, lt, t) => {
    const fade = 1 - clamp((t - evT + 0.2) / 0.3);
    plate(g, 'STOCKFISH', W / 2, 250, { color: BLUE, size: 66, ...pin(t, sfT) });
    if (t >= ninT && fade > 0) counter(g, String(Math.round(19 * ease.out(clamp((t - ninT) / 0.9)))), 'TCEC TITLES', { y: 480, size: 150, color: GOLD, a: fade, at: [t, ninT] });
    if (t >= twT && fade > 0) plate(g, '12 IN A ROW', W / 2, 640, { color: RED, size: 50, ...pin(t, twT, fade) });
  } });
  cue(stS - 0.08, 'whoosh_fast', 0.3); cue(sfT, 'sparkle_pop', 0.25); cue(ninT, 'whirr', 0.3); cue(twT, 'stamp', 0.4); cue(evT, 'notify', 0.2);
  cue(foodT - 0.02, 'chomp', 0.6); cue(foodT + 0.05, 'whoosh_fast', 0.3);

  // "Humans? Not even close.": a diver at a chessboard on the seabed; the giant fish passes over him
  shot(huT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.14, 0.26, 8.0, [4.8, SEAY + 2.2, 9])], [len(sh), K(0.04, 0.3, 7.0, [4.8, SEAY + 2.3, 9])]], { t, e: lin });
    sea(g, t);
    const u = clamp((t - huT + 0.1) / 2.6), fx = lerp(19, -10, u), fy = SEAY + 6.6, fz = 12.5, shd = Math.exp(-Math.pow((fx - 4.4) / 6, 2));
    diver(g, t, { x: 4, z: 9, look: clamp((t - notT + 0.3) * 3) });
    if (depth(fx, fy, fz) > 1) { const p = B.project(fx, fy, fz); fishPhoto(g, p.x, p.y, p.s * 12, t, { wag: 0.8, rot: 0.03 }); }
    if (shd > 0.01) { g.fillStyle = `rgba(4,22,44,${(0.32 * shd).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    seaSpecks(g, t);
  }, { trans: 'zoom', hud: (g, lt, t) => {
    plate(g, 'HUMANS?', W / 2, 250, { color: CREAM, size: 60, ...pin(t, huT) });
    if (t >= notT) plate(g, 'NOT EVEN CLOSE', W / 2, 350, { color: RED, size: 54, ...pin(t, notT) });
  } });
  cue(huT - 0.06, 'whoosh_deep', 0.3); cue(notT, 'thud', 0.45);

  // ======================= THE BIGGER FISH: the worm comes down in front of its nose; it goes for it and bites =======================
  const bgS = s('bigger'), bigT = w('bigger', 'bigger'), fsT = w('bigger', 'fish');
  const BITE = fsT + 0.06, YANK = BITE + 0.2, HX = 1.5;
  shot(bgS - 0.04, (g, lt, t, sh) => {
    const lk = YANK - (bgS - 0.04);
    rig(B, lt, [[0, K(0.05, 0.05, 6.6, [3.0, 0.9, 7.5])], [lk, K(-0.02, 0.06, 5.3, [2.7, 1.0, 7.5])], [len(sh), K(-0.02, 0.2, 5.1, [2.7, 2.2, 7.5])]], { t, e: lin, bump: t > BITE && t < BITE + 0.25 ? 1 : 0 });
    sea(g, t);
    const app = ease.inOut(clamp((t - bigT + 0.2) / (BITE - bigT + 0.2))), yk = ease.in(clamp((t - YANK + 0.06) / 0.25));
    const f = { x: lerp(4.9, HX + 2.4, app), y: 0.35 + Math.sin(t * 2.2) * 0.08 + yk * 6, rot: -0.1 * app + yk * 1.2 };
    const hookY = lerp(7, 0.55, ease.out(clamp((t - bgS) / 0.9)));
    if (depth(f.x, f.y, 7.5) > 1) {
      const p = B.project(f.x, f.y, 7.5), L = p.s * 4.9;
      if (t < BITE) { const hp = B.project(HX, hookY, 7.5); hookWorm(g, hp.x, hp.y, p.s / 95, t, { top: -40 }); }
      fishPhoto(g, p.x, p.y, L, t, { rot: f.rot, wag: 1 + app * 1.5 + yk * 3 });
      if (t >= BITE) { const m = mouthAt(p.x, p.y, L, f.rot); g.strokeStyle = 'rgba(240,250,255,0.85)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(m[0] + (t - BITE) * 60, -40); g.lineTo(m[0], m[1]); g.stroke(); }
    }
    seaSpecks(g, t, { burst: [HX, 0.6, 7.5, BITE] });
  }, { trans: 'whip' });
  cue(bgS - 0.08, 'whoosh_deep', 0.3); cue(bigT - 0.2, 'riser', 0.4); cue(BITE, 'chomp', 0.6);

  // ======================= THE YANK: up through the surface in slow motion, to the pier and the fisherman =======================
  const fiT = w('name', 'fischer'), gerT = w('name', 'in'), fmT = w('name', 'fisherman');
  const warp = tau => tau < 0.22 ? tau : tau < 0.9 ? 0.22 + (tau - 0.22) * 0.33 : 0.4444 + (tau - 0.9);  // story time: slow around the surface
  const wlAt = s2 => s2 < 0.2 ? lerp(-80, 1060, ease.in(clamp(s2 / 0.2))) : lerp(1060, H + 80, ease.inOut(clamp((s2 - 0.2) / 0.4)));
  const SC = 0.3, YC = wlAt(SC), XC = 600;
  const camY = [[0, K(0.34, 0.1, 21, [0.9, PY + 3.55, 1.2], { cy: 700 })], [0.62, K(0.3, 0.08, 17.5, [1.1, PY + 4.3, 1.2], { cy: 820 })], [2.4, K(0.26, 0.07, 14.5, [1.3, PY + 5.0, 1.2])]];
  const ROD = s2 => ({ len: 700, bend: bendAt(s2) });
  const bendAt = s2 => lerp(0.6, 0.22, ease.out(clamp((s2 - 0.28) / 0.8)));
  shot(YANK, (g, lt, t, sh) => {
    const s2 = warp(lt), tt = YANK + s2, wl = wlAt(s2);
    rig(B, s2, camY, { t: tt, e: lin });
    const tip = rodTip(0, 1.2, { rod: ROD(s2) }), fs = B.project(0, PY + 7.1, 1.2).s, FL = fs * 2.6, DROP = fs * 1.15;
    overUnder(g, tt, wl, g2 => {
      lake(g2, tt, { mood: 'dawn' });
      fisher(g2, 0, 1.2, { e: exprAt([[0, COLD], [0.45, SMIRK]], s2), t: tt, rod: ROD(s2), fx: 0.15 });
      pierFront(g2);
    }, g2 => under2d(g2, tt, { top: Math.max(0, wl - 40), rise: clamp(s2 / SC) }));
    let m;
    if (s2 < SC) m = [lerp(560, XC, s2 / SC), lerp(1560, YC, s2 / SC)];
    else {
      const u = ease.out(clamp((s2 - SC) / 0.5)), ang = Math.sin(tt * 2.3) * 0.12 * u, hang = [tip[0] + Math.sin(ang) * DROP, tip[1] + Math.cos(ang) * DROP];
      m = [lerp(XC, hang[0], u), lerp(YC, hang[1], u) - Math.sin(PI * u) * 160];
    }
    hangFish(g, tip, FL, DROP, tt, { at: m, wag: s2 < 0.9 ? 3 : 1.6 });
    splash(g, XC, YC, s2, SC, { n: 54, power: 1500, life: 1.6, size: 11 });
    glint(g, XC + 30, YC - 20, s2, SC, { r: 300, life: 0.5, color: '#FFF6DE' });
    if (Math.abs(s2 - SC) < 0.06) flashTint(g, '#FFFFFF', 0.28 * (1 - Math.abs(s2 - SC) / 0.06));
  }, { trans: 'cut', hud: (g, lt, t) => { if (t >= fiT) plate(g, 'BOBBY FISCHER', W / 2, 250, { color: CREAM, size: 70, ...pin(t, fiT) }); } });
  const crossT = YANK + 0.22 + (SC - 0.22) / 0.33;
  cue(YANK - 0.02, 'whoosh_fast', 0.5); cue(crossT - 0.3, 'revswell', 0.45); cue(crossT, 'boom_big', 0.6); cue(crossT, 'waves', 0.55); cue(crossT + 0.02, 'shimmer', 0.3); cue(fiT, 'stamp', 0.4);

  // "In German, Fischer means... fisherman.": closer; he looks at his catch with a smirk, then at us
  shot(gerT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.2, 0.03, 8.2, [-0.4, PY + 6.2, 1.2])], [len(sh), K(0.12, 0.02, 7.2, [-0.4, PY + 6.3, 1.2])]], { t, e: lin });
    lake(g, t, { mood: 'dawn' });
    const F = fisher(g, 0, 1.2, { e: exprAt([[0, { ...SMIRK, look: [-0.8, -0.2] }], [fmT - 0.15, SMIRK]], t), t, raise: true, fx: 0.1 });
    if (F && F.grip) hangFish(g, F.grip, F.p.s * 2.2, F.p.s * 0.35, t, { swing: 0.08, wag: 2 });
  }, { hud: (g, lt, t) => {
    plate(g, 'BOBBY FISCHER', W / 2, 250, { color: CREAM, size: 70, rot: 0 });
    if (t >= fmT) plate(g, 'FISCHER = FISHERMAN', W / 2, 360, { color: GOLD, size: 50, ...pin(t, fmT) });
  } });
  cue(fmT, 'reveal_bell', 0.35);

  // ======================= 1956: the Game of the Century, 17...Be6!!; 1958: champion of America at 14 =======================
  const ygS = s('young'), thT = w('young', 'thirteen'), gmT = w('young', 'game'), f14T = w('young', 'fourteen'), chT = w('young', 'champion');
  const MV = gmT + 0.05, MP = 34, m34 = moveOf(GOC, MP);
  shot(ygS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.42, 0.36, 12.8, [4, 2.0, 6.2])], [len(sh), K(-0.22, 0.32, 10.8, [4, 2.2, 6.4])]], { t, e: lin, bump: t > MV + SLIDE && t < MV + SLIDE + 0.25 ? 1 : 0 });
    const env = room(g, B, 'wood', { t, ...CLUB });
    const yb = seated(g, B, 'fischer13', exprAt([[0, { ...EXPR.focus, look: [0, 0.75], lid: 0.12 }], [MV + 0.45, { ...EXPR.smug, look: [0.1, 0.1], lid: 0.12, curve: 0.3 }]], t), t, { z: 9.3, face: -1, hands: false });
    const by = seated(g, B, 'byrne', 'focus', t, { z: -1.4, face: 1, hands: false });
    table(g, B, env);
    B.drawSlab(g, WOOD);
    const l2 = t - MV, ps = l2 < 0 ? piecesAt(GOC, MP - 1) : piecesAt(GOC, MP, slide(l2), SLIDE_OPTS);
    if (l2 >= 0) moveUnder(g, B, m34, l2);
    B.drawPieces(g, ps, { focus: B.dist, dof: 1.2 });
    if (l2 >= 0) moveOver(g, B, m34, l2);
    yb(); by();
  }, { trans: 'whip', hud: (g, lt, t) => {
    plate(g, '1956 · AGE 13', W / 2, 230, { color: GOLD, size: 54, ...pin(t, thT) });
    if (t >= gmT) plate(g, 'THE GAME OF THE CENTURY', W / 2, 330, { color: CREAM, size: 44, ...pin(t, gmT) });
  } });
  cue(ygS - 0.08, 'whoosh_fast', 0.3); cue(thT, 'sparkle_pop', 0.22); cue(MV + SLIDE - MOVE_HIT, 'move', 0.5); boom(MV + SLIDE, 0.8); cue(MV + SLIDE, 'shimmer', 0.35);
  const FLASH = [f14T + 0.08, f14T + 0.5, chT + 0.02, chT + 0.45, chT + 0.85];
  shot(f14T - 0.05, (g, lt, t, sh) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#30487A'); bg.addColorStop(1, '#16274A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    bokeh(g, t, { n: 22, seed: 4, y0: 0.04, y1: 0.7, colors: ['#FFD9A0', '#FFE9C8', '#9FC2E8'], size: [60, 170], a: 0.3 });
    g.fillStyle = '#F4F1EA'; for (let i = 0; i < 9; i++) { const x = 60 + i * 120, y = 140 + (i % 2) * 18; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? 9 : 22; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
    const k = lerp(1.4, 1.5, clamp(lt / 2.8)), cx = W / 2 - 70, cy = 830;
    drawChar(g, 'fischer14', { x: cx, y: cy, s: k, e: exprAt([[0, { ...EXPR.happy, look: [0.35, 0] }], [chT, { ...EXPR.happy, look: [0, 0] }]], t), t });
    trophy(g, cx + 300, 1330, 2.3);
    hand2(g, cx + 190, 1130, 34); hand2(g, cx + 400, 1100, 34);
    for (const ft of FLASH) { const d = t - ft; if (d < 0 || d > 0.3) continue; const r = rng(Math.round(ft * 100)), x = 120 + r() * 840, y = 300 + r() * 500, R = 260 * (1 - d / 0.3);
      const fg = g.createRadialGradient(x, y, 0, x, y, R); fg.addColorStop(0, `rgba(255,255,255,${(1 - d / 0.3).toFixed(3)})`); fg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = fg; g.fillRect(x - R, y - R, R * 2, R * 2);
      if (d < 0.12) flashTint(g, '#FFFFFF', 0.25 * (1 - d / 0.12)); }
  }, { trans: 'whip', hud: (g, lt, t) => {
    plate(g, 'AGE 14', W / 2, 260, { color: GOLD, size: 72, ...pin(t, f14T) });
    if (t >= chT) { plate(g, 'U.S. CHAMPION', W / 2, 380, { color: CREAM, size: 56, ...pin(t, chT) }); confetti(g, t, chT, { n: 110, seed: 6 }); }
  } });
  cue(f14T - 0.08, 'whoosh_fast', 0.3); for (const ft of FLASH) cue(ft, 'camera', 0.3); cue(chT, 'applause', 0.35); cue(chT, 'confetti', 0.3);

  // ======================= TWENTY IN A ROW: the stringer fills up, fish by fish; two 6–0 boards slam in =======================
  const skS = s('streak'), twnT = w('streak', 'twenty'), wldT = w('streak', 'world'), s60a = w('streak', 12), s60b = w('streak', 13);
  const NF = 20, catchT = i => twnT + 0.05 + i * (wldT + 0.3 - twnT) / (NF - 1);
  shot(skS - 0.04, (g, lt, t, sh) => {
    const hit = (t > s60a && t < s60a + 0.25) || (t > s60b && t < s60b + 0.25);
    rig(B, lt, [[0, K(-0.22, 0.04, 14, [0.4, PY + 5.8, 1.2])], [len(sh), K(-0.12, 0.03, 12.6, [0.4, PY + 5.9, 1.2])]], { t, e: lin, bump: hit ? 1 : 0 });
    lake(g, t, { mood: 'day', mist: 0.3 });
    const F = fisher(g, 0, 1.2, { e: exprAt([[0, SMIRK], [s60a, { ...SMIRK, curve: 0.55 }]], t), t, raise: true });
    pierFront(g);
    if (!F || !F.grip) return;
    const [gx, gy] = F.grip, sp = 46 * F.sc, fl = 150 * F.sc, top = gy + 26 * F.sc;
    let shown = 0; for (let i = 0; i < NF; i++) if (t >= catchT(i)) shown = i + 1;
    g.strokeStyle = '#E8E2D2'; g.lineWidth = Math.max(2, 4 * F.sc); g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, top + Math.max(0, shown - 1) * sp + 6); g.stroke();
    for (let i = shown - 1; i >= 0; i--) {  // each hangs by its mouth from the cord, heads alternately left and right
      const u = clamp((t - catchT(i)) / 0.18), sd = i % 2 ? 1 : -1, a = 0.42 + Math.sin(t * 2 + i) * 0.04, my = top + i * sp - (1 - ease.out(u)) * 60, L = fl * lerp(0.3, 1, ease.back(u));
      fishy(g, gx - sd * Math.sin(a) * L * 0.5, my + Math.cos(a) * L * 0.5, L, t, { col: ['#A9B8C4', '#9DB0BE', '#B5C2CB'][i % 3], belly: '#EEF3F5', rot: PI / 2 + sd * a, wag: 0.4, ph: i });
    }
  }, { trans: 'whip', hud: (g, lt, t) => {
    let shown = 0; for (let i = 0; i < NF; i++) if (t >= catchT(i)) shown = i + 1;
    const fade = 1 - clamp((t - s60a + 0.1) / 0.2);
    if (shown > 0 && fade > 0) counter(g, String(shown), 'WINS IN A ROW', { y: 330, size: 150, color: GOLD, a: fade, at: [t, twnT] });
    if (t >= s60a) plate(g, '6–0', W / 2, 225, { color: GOLD, size: 104, sub: 'VS TAIMANOV · 1971', ...pin(t, s60a) });
    if (t >= s60b) plate(g, '6–0', W / 2, 485, { color: GOLD, size: 104, sub: 'VS LARSEN · 1971', ...pin(t, s60b) });
  } });
  cue(skS - 0.08, 'whoosh_fast', 0.3); for (let i = 0; i < NF; i++) cue(catchT(i), i % 2 ? 'piece' : 'pluck', 0.2);
  for (const tt of [s60a, s60b]) { cue(tt - 0.004, 'boom_big', 0.5); cue(tt, 'stamp', 0.4); }

  // ======================= REYKJAVIK 1972: alone against the Soviet machine; he reels in the crown =======================
  const usS = s('ussr'), y72T = w('ussr', 1), tookT = w('ussr', 'took'), sovT = w('ussr', 'soviet'), alnT = w('ussr', 'alone'), and2T = w('ussr', 10), wtT = w('ussr', 'world');
  const reyk = (g, t, { ef = COLD, es = EXPR.focus, spin = 1, steam = 0, stop = 0, spot = 0, extra = null } = {}) => {
    stage72(g, t, { spin, steam, stop });
    if (spot > 0) spotCone(g, B, { top: [4, 18, 9.3], base: [4, FLOOR_Y, 9.6], r0: 0.6, r1: 4.6, color: '#FFF3DA', a: 0.26 * spot, t, dust: 30 });
    const sp = seated(g, B, 'spassky', es, t, { z: -1.4, face: 1, hands: false });
    const fi = seated(g, B, 'fischerA', ef, t, { z: 9.3, face: -1, hands: false });
    table(g, B, { table: ['#5A3E28', '#3E2A1A', '#4A3220'] }, { x1: 10.6 });
    B.drawSlab(g, WOOD);
    B.drawPieces(g, piecesAt(G3, 22), { focus: B.dist, dof: 1.0 });
    sp(); fi();
    if (extra) extra(g);
  };
  shot(usS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.62, 0.3, 22, [4, 3.0, 1.0])], [len(sh), K(PI - 0.48, 0.27, 20, [4, 3.2, 1.0])]], { t, e: lin });
    reyk(g, t, { spin: 0.5 });
  }, { trans: 'whip', hud: (g, lt, t) => plate(g, 'REYKJAVIK · 1972', W / 2, 250, { color: CREAM, size: 56, ...pin(t, y72T) }) });
  shot(tookT - 0.08, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.08, 0.1, 14.5, [4, 5.4, 1.5])], [len(sh), K(PI + 0.02, 0.12, 12.8, [4, 5.8, 1.5])]], { t, e: lin, bump: t > sovT && t < sovT + 0.25 ? 0.6 : 0 });
    const spin = 0.5 + 2.5 * ease.inOut(clamp((t - sovT) / 0.6));
    reyk(g, t, { spin, steam: clamp((t - sovT) * 2), es: { ...EXPR.focus, look: [0, -0.1] }, spot: clamp((t - alnT + 0.1) * 3) });
    if (t >= alnT) { const u = clamp((t - alnT) / 0.4); const vg = g.createRadialGradient(W / 2, H * 0.62, H * 0.15, W / 2, H * 0.62, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(8,2,3,${(0.6 * u).toFixed(3)})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= sovT) plate(g, 'THE SOVIET MACHINE', W / 2, 250, { color: RED, size: 56, ...pin(t, sovT) });
    if (t >= alnT) plate(g, 'ALONE', W / 2, 350, { color: CREAM, size: 56, ...pin(t, alnT) });
  } });
  const CR0 = [7.2, 9.5, -0.5], CR1 = [4, 4.75, 9.3], LAND = wtT + 0.18;
  shot(and2T - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.26, 0.14, 10, [4, 3.6, 8.4])], [len(sh), K(0.16, 0.12, 8.9, [4, 3.8, 8.6])]], { t, e: lin, bump: t > LAND && t < LAND + 0.25 ? 1 : 0 });
    const u = ease.inOut(clamp((t - and2T - 0.1) / (LAND - and2T - 0.1)));
    reyk(g, t, { ef: exprAt([[0, COLD], [LAND, SMIRK]], t), spin: 0, stop: 1, extra: g2 => {
      const rb = [4.9, 0.9, 8.2], rt = [6.7, 5.6, 6.6];
      const cp = [lerp(CR0[0], CR1[0], u), lerp(CR0[1], CR1[1], u) + Math.sin(PI * u) * 1.6, lerp(CR0[2], CR1[2], u)];
      if (depth(...rb) > 1 && depth(...rt) > 1) {
        const P = B.project(...rb), Q = B.project(...rt);
        g2.strokeStyle = '#17181B'; g2.lineWidth = Math.max(3, 0.06 * Q.s); g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(P.x, P.y); g2.lineTo(Q.x, Q.y); g2.stroke();
        hand2(g2, P.x, P.y, 0.3 * P.s);
        if (depth(...cp) > 1 && u < 1) { const C2 = B.project(...cp); g2.strokeStyle = 'rgba(250,250,255,0.85)'; g2.lineWidth = 2; g2.beginPath(); g2.moveTo(Q.x, Q.y); g2.quadraticCurveTo((Q.x + C2.x) / 2, (Q.y + C2.y) / 2 + 40 * (1 - u), C2.x, C2.y); g2.stroke(); }
      }
      if (depth(...cp) > 1) { const C2 = B.project(...cp); crown(g2, C2.x, C2.y, C2.s / 100 * 0.9, { tilt: (1 - u) * 0.4 }); }
      if (t >= LAND) { const C2 = B.project(...CR1); shockwave(g2, C2.x, C2.y, t, LAND, { r0: 40, r1: 700, life: 0.55, color: GOLD, lw: 12, squash: 0.5 }); glint(g2, C2.x, C2.y - 30, t, LAND, { r: 220 }); }
    } });
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= wtT) plate(g, 'WORLD CHAMPION', W / 2, 250, { color: GOLD, size: 64, sub: '12½–8½ · SPASSKY', ...pin(t, wtT) }); } });
  cue(usS - 0.08, 'whoosh_fast', 0.3); cue(y72T, 'sparkle_pop', 0.22); cue(tookT - 0.1, 'whoosh_deep', 0.3); cue(sovT, 'whirr', 0.45); cue(sovT + 0.1, 'ratchet', 0.35);
  cue(alnT, 'sting', 0.35); cue(and2T, 'ratchet', 0.45); cue(LAND, 'reveal_bell', 0.4); cue(LAND + 0.05, 'applause', 0.3);

  // ======================= THE FISHERMAN: every grandmaster hooked at once; the hero shot =======================
  const nkS = s('nick'), gm2T = w('nick', 'grandmaster'), fish2T = w('nick', 'fish'), heT = w('nick', 'he'), fmanT = w('nick', 'fisherman');
  const GMS = [['SPASSKY', '#C8322A'], ['PETROSIAN', '#2F63B8'], ['LARSEN', '#2FA36B'], ['TAIMANOV', '#D98A2B'], ['BYRNE', '#7C5BD6']];
  shot(nkS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.08, 0.05, 10.5, [4, 0.8, 7.5])], [len(sh), K(-0.04, 0.08, 9.2, [4, 1.1, 7.5])]], { t, e: lin });
    sea(g, t);
    const yk = ease.in(clamp((t - fish2T - 0.1) / 0.35));
    const tags = [];
    GMS.forEach(([name, col], i) => {
      const x = 4 + (i - 2) * 1.3 + Math.sin(t * 1.2 + i) * 0.15, y = 0.4 + Math.sin(t * 1.7 + i * 1.3) * 0.4 + (i % 2) * 1.4 + yk * (9 + i), z = 7.5 + (i % 3) * 0.7;
      if (depth(x, y, z) < 1) return; const p = B.project(x, y, z), L = p.s * 2.2, rot = yk * 1.25;
      if (t >= fish2T - 0.3) { const mx = p.x - L * 0.5 * Math.cos(rot), my = p.y - L * 0.5 * Math.sin(rot); g.strokeStyle = 'rgba(240,250,255,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx, lerp(-40, my, 1)); g.lineTo(mx, my); g.stroke(); }
      fishy(g, p.x, p.y, L, t, { col, belly: mix(col, '#FFFFFF', 0.6), rot, wag: 1 + yk * 3, ph: i, stripe: 'rgba(255,255,255,0.4)' });
      tags.push([p.x, p.y - p.s * 1.05, name, col, (t - gm2T - i * 0.07) * 3 * (1 - clamp(yk * 4))]);
    });
    for (const [x, y, name, col, u] of tags) fishTag(g, x, y, name, col, u, 34);  // the tags over all the fish
    seaSpecks(g, t);
  }, { trans: 'whip', hud: (g, lt, t) => plate(g, 'EVERY GRANDMASTER', W / 2, 250, { color: CREAM, size: 54, ...pin(t, gm2T) }) });
  cue(nkS - 0.08, 'whoosh_fast', 0.3); cue(fish2T - 0.3, 'pluck', 0.3); cue(fish2T + 0.1, 'whoosh_fast', 0.45);
  shot(heT - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(-0.05, -0.02, 8.8, [0, PY + 6.6, 1.2], { cy: H * 0.52 })], [len(sh), K(0, -0.03, 6.3, [0, PY + 6.8, 1.2], { cy: H * 0.52 }), ease.out]], { t, e: lin, bump: t > fmanT && t < fmanT + 0.3 ? 1 : 0 });
    lake(g, t, { mood: 'dawn', mist: 0.5 });
    const hp = B.project(0, PY + 7.1, 1.2);
    if (t >= fmanT) { g.save(); g.globalCompositeOperation = 'screen'; rays(g, hp.x, hp.y, t, { n: 16, color: '#FFE2A0', a: 0.22 * seg(t, fmanT, fmanT + 0.3), len: 1800 }); g.restore(); }
    const F = fisher(g, 0, 1.2, { e: exprAt([[0, STARE], [fmanT - 0.1, SMIRK]], t), t, rod: { bend: 0.22 } });
    if (F && F.tip) hangFish(g, F.tip, F.p.s * 2.6, F.p.s * 1.15, t);
    if (t >= fmanT) { shockwave(g, hp.x, hp.y, t, fmanT, { r0: 60, r1: 950, life: 0.6, color: GOLD, lw: 16, squash: 1 }); if (t < fmanT + 0.3) flashTint(g, '#FFE8B0', 0.3 * (1 - (t - fmanT) / 0.3)); }
  }, { trans: 'whip', hud: (g, lt, t) => { if (t >= fmanT) plate(g, 'THE FISHERMAN', W / 2, 260, { color: GOLD, size: 84, ...pin(t, fmanT) }); } });
  cue(heT - 0.08, 'whoosh_fast', 0.3); cue(fmanT - 0.3, 'revswell', 0.5); cue(fmanT - 0.004, 'boom_big', 0.65); cue(fmanT, 'shimmer', 0.3);

  // ======================= THE FALL: 1975, an empty chair and no game; an empty boat in the fog =======================
  const flS = s('fall'), wkT = w('fall', 'walked'), wtoT = w('fall', 'without'), andF = w('fall', 'and'), vanT = w('fall', 'vanished'), twyT = w('fall', 'twenty'), yrsT = w('fall', 'years');
  shot(flS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.45, 0.56, 16.5, [4, -0.2, 8.6])], [len(sh), K(0.32, 0.52, 14.5, [4, 0.0, 8.9])]], { t, e: lin });
    const env = room(g, B, 'cold', { t });
    spotCone(g, B, { top: [4, 16, 12], base: [4, FLOOR_Y, 12.2], r0: 0.6, r1: 4.4, color: '#E6EEFF', a: 0.24, t, dust: 30 });
    chair(g, B, 4, 13.0, { face: -1, color: '#66717E' });
    { const cp = [4, -0.55, 12.9]; if (depth(...cp) > 1) { const p = B.project(...cp), gu = ease.inOut(clamp((t - wtoT) / 0.5)); crown(g, p.x, p.y, p.s / 100 * 0.8, { gray: gu }); } }  // the title, left on the empty chair
    table(g, B, env);
    B.drawSlab(g, WOOD);
    B.drawPieces(g, piecesAt(GOC, 0), { focus: B.dist, dof: 1.0 });
    chessClock(g, B, 9.7, 0, 4, { tl: Math.max(0, 60 - (t - flS) * 12), tr: 60 });
  }, { trans: 'whip', hud: (g, lt, t) => {
    plate(g, '1975', W / 2, 250, { color: GOLD, size: 70, ...pin(t, wkT) });
    if (t >= wtoT) plate(g, '0 GAMES PLAYED', W / 2, 360, { color: RED, size: 52, ...pin(t, wtoT) });
  } });
  shot(andF - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI - 0.3, 0.07, 18, [2, 1.2, -14])], [len(sh), K(PI - 0.22, 0.06, 16.5, [2.2, 1.2, -14])]], { t, e: lin });
    lake(g, t, { mood: 'grey', mist: 1, fog: 0.3, pier: false, far: true });
    boat(g, t, { x: 2.2, z: -14 });
  }, { trans: 'fade', transDur: 0.4, hud: (g, lt, t) => {
    if (t >= vanT) plate(g, 'VANISHED', W / 2, 250, { color: CREAM, size: 64, ...pin(t, vanT) });
    if (t >= twyT - 0.1) counter(g, String(Math.round(20 * ease.out(clamp((t - twyT + 0.1) / 0.6)))), 'YEARS', { y: 500, size: 150, color: GOLD, at: [t, twyT - 0.1] });
  } });
  cue(flS - 0.08, 'whoosh_soft', 0.3); cue(wkT, 'creak', 0.3); cue(wtoT, 'glass', 0.25); cue(andF, 'wind', 0.35); cue(vanT, 'whoosh_soft', 0.25);

  // ======================= "I HATE CHESS": the grey room of the photo; the camera slowly backs away; the words in chalk =======================
  const htS = s('hate'), iT = w('hate', 'i'), hateT = w('hate', 'hate'), chessT = w('hate', 'chess'), dtS = s('death');
  shot(htS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.07, 0.12, 11.5, [0.4, FLOOR_Y + 4.2, RZ - 1.6])], [len(sh), K(0.0, 0.14, 16.5, [0.4, FLOOR_Y + 4.9, RZ - 1.8])]], { t, e: x => ease.inOut(x) });
    greyRoom(g, t);
    floorSit(g, t, exprAt([[0, EMPTY], [iT - 0.2, { ...EMPTY, look: [0, 0.1], lid: 0.3, curve: -0.35 }]], t));
    chalk(g, t, 'I HATE CHESS…', iT, { x: 0.4, step: (chessT + 0.35 - iT) / 13 });
  }, { trans: 'fade', transDur: 0.5, grade: 'bw' });
  for (let tt = htS + 0.1; tt < dtS - 0.3; tt += 0.86) cue(tt, 'heartbeat', 0.5);
  cue(iT, 'scribble', 0.35); cue(hateT, 'scribble', 0.35); cue(chessT, 'scribble', 0.35);

  // ======================= DEATH: the rod left on a snowy pier; 64 squares light up, one for every year =======================
  const janT = w('death', 'january'), sixT = w('death', 6), one2T = w('death', 'one'), brdT = w('death', 'board'), sfS = s('surface');
  shot(dtS - 0.04, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(PI + 0.16, 0.46, 6.8, [0.9, PY + 0.3, 1.4])], [len(sh), K(PI + 0.08, 0.42, 5.9, [0.9, PY + 0.4, 1.4])]], { t, e: lin });
    lake(g, t, { mood: 'snow', mist: 0.8, fog: 0.12, far: true });
    abandonedRod(g, t);
    snowfall(g, t, 0.9);
  }, { trans: 'fade', transDur: 0.5, hud: (g, lt, t) => {
    if (t >= janT) plate(g, 'JANUARY 2008', W / 2, 250, { color: CREAM, size: 60, ...pin(t, janT) });
    if (t >= sixT) plate(g, 'AGE 64', W / 2, 360, { color: GOLD, size: 60, ...pin(t, sixT) });
  } });
  const sqAt = i => one2T + 0.05 + i * (brdT + 0.1 - one2T) / 63;
  shot(one2T - 0.06, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0, 1.18, 12.8, [4, 0, 4.2])], [len(sh), K(0.2, 1.26, 11.4, [4, 0, 4.2])]], { t, e: lin });
    const env = room(g, B, 'wood', { t, ...CLUB });
    table(g, B, env); B.drawSlab(g, WOOD);
    for (let i = 0; i < 64; i++) {
      const d = t - sqAt(i); if (d < 0) break;
      const r = Math.floor(i / 8), f = r % 2 ? 7 - i % 8 : i % 8, a = 0.55 + 0.35 * Math.exp(-d * 4);
      g.save(); g.shadowColor = GOLD; g.shadowBlur = 24 * Math.exp(-d * 3);
      quad(g, [[f + 0.04, 0.02, r + 0.04], [f + 0.96, 0.02, r + 0.04], [f + 0.96, 0.02, r + 0.96], [f + 0.04, 0.02, r + 0.96]], rgba(GOLD, a)); g.restore();
    }
  }, { trans: 'whip', hud: (g, lt, t) => {
    plate(g, '1943 – 2008', W / 2, 250, { color: CREAM, size: 60, ...pin(t, one2T) });
    let n = 0; for (let i = 0; i < 64; i++) if (t >= sqAt(i)) n = i + 1;
    if (n > 0) counter(g, String(n), n >= 64 ? 'SQUARES · 64 YEARS' : 'SQUARES', { y: 500, size: 150, color: GOLD, at: [t, one2T] });
  } });
  cue(dtS - 0.06, 'wind', 0.35); cue(w('death', 'died'), 'sting', 0.3); cue(one2T - 0.08, 'whoosh_fast', 0.25); cue(one2T + 0.05, 'whirr', 0.3); cue(brdT + 0.1, 'reveal_bell', 0.3);

  // ======================= THE FISH COMES UP: half under at the empty pier; then its eye breaks the surface =======================
  const novT = w('surface', 'november'), fish3T = w('surface', 'fish'), itsT = w('surface', 'its'), sf3T = w('surface', 'stockfish');
  const WL = 760;
  shot(sfS - 0.04, (g, lt, t, sh) => {
    overUnder(g, t, WL, g2 => {
      rig(B, lt, [[0, K(0.3, 0.06, 13, [0, PY + 1.8, 1.2], { cy: WL - 60 })], [len(sh), K(0.24, 0.06, 12.2, [0, PY + 1.8, 1.2], { cy: WL - 60 })]], { t, e: lin });
      lake(g2, t, { mood: 'dawn', mist: 0.7 });
      pierFront(g2);
    }, g2 => {
      under2d(g2, t, { top: WL });
      for (const sd of [-1, 1]) for (const z of [0, 4, 8]) { if (depth(sd * 1.95, 0, z) < 1) continue; const p = B.project(sd * 1.95, 0, z); g2.fillStyle = `rgba(20,40,50,${(0.5 - z * 0.04).toFixed(3)})`; g2.fillRect(p.x - 0.17 * p.s, WL, 0.34 * p.s, H - WL); }
      const u = ease.inOut(clamp((t - sfS) / (itsT - sfS))), x = lerp(660, 560, u), y = lerp(1750, WL + 300, u), L = lerp(240, 620, u);
      fishPhoto(g2, x, y, L, t, { rot: lerp(-0.2, 0.55, u), wag: 1.2, a: lerp(0.4, 1, u) });
    });
  }, { trans: 'fade', transDur: 0.5, hud: (g, lt, t) => { if (t >= novT) plate(g, 'NOVEMBER 2008', W / 2, 250, { color: GOLD, size: 60, ...pin(t, novT) }); } });
  shot(itsT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, K(0.25, 0.2, 9.5, [1.0, 1.6, -3])], [len(sh), K(0.18, 0.18, 8.4, [1.0, 1.7, -3])]], { t, e: lin });
    lake(g, t, { mood: 'dawn', mist: 0.7 });
    const em = ease.out(clamp((t - sf3T + 0.3) / 0.55)), c = B.project(1.0, 0, -3), L = c.s * 3.6;
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.6)';
    for (let k = 0; k < 4; k++) { const ru = (t - sf3T + 0.25) * 0.75 - k * 0.22; if (ru < 0 || ru > 1) continue; g.globalAlpha = (1 - ru) * 0.8; g.lineWidth = 4; const rx = L * 0.18 + ru * L * 1.2; g.beginPath(); g.ellipse(c.x, c.y, rx, rx * 0.2, 0, 0, 7); g.stroke(); }
    g.restore();
    const fy = c.y + L * 0.5 - em * L * 0.44, rot = PI / 2 - 0.08;
    g.save(); g.beginPath(); g.rect(0, c.y, W, H - c.y); g.clip(); fishPhoto(g, c.x, fy, L, t, { rot, wag: 0.4, a: 0.3, shadow: false }); g.restore();
    g.save(); g.beginPath(); g.rect(0, 0, W, c.y); g.clip(); fishPhoto(g, c.x, fy, L, t, { rot, wag: 0.4, shadow: false }); g.restore();
    if (em > 0.05 && em < 0.9) splash(g, c.x, c.y, t, sf3T - 0.3, { n: 24, power: 700, life: 1.0, size: 7, seed: 9 });
  }, { trans: 'cut', hud: (g, lt, t) => {
    if (t >= sf3T) { plate(g, 'STOCKFISH 1.0', W / 2, 250, { color: BLUE, size: 66, ...pin(t, sf3T) }); smallCredit(g, 'Logo: Stockfish (GPLv3) · Klein Maetschke', 342); }
  } });
  cue(sfS - 0.06, 'waves', 0.3); cue(novT, 'sparkle_pop', 0.2); cue(fish3T, 'whoosh_deep', 0.3); cue(sf3T - 0.3, 'splat', 0.45); cue(sf3T, 'boom_cine', 0.45);

  // ======================= CTA: the fish and the fisherman, side by side =======================
  const ctS = s('cta'), fish4T = w('cta', 'fish'), fm4T = w('cta', 'fisherman');
  shot(ctS - 0.04, (g, lt, t, sh) => {
    g.save(); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); g.translate(W * 0.25, 0);
    rig(B, lt, [[0, K(0.12, 0.03, 9.6, [0.6, PY + 5.8, 1.2])], [len(sh), K(0.06, 0.03, 8.8, [0.6, PY + 5.9, 1.2])]], { t, e: lin });
    lake(g, t, { mood: 'dawn' });
    fisher(g, 0, 1.2, { e: exprAt([[0, STARE], [fm4T, SMIRK]], t), t, rod: { bend: 0.12 } });
    g.restore();
    g.save(); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip();
    under2d(g, t, { top: 0 });
    fishPhoto(g, W * 0.25, 900, 460, t, { flip: true, wag: 1.3, rot: Math.sin(t * 1.4) * 0.05 });
    g.restore();
    const u = ease.out(clamp(lt / 0.3));
    g.save(); g.shadowColor = '#FFFFFF'; g.shadowBlur = 20; g.fillStyle = '#FFFFFF'; g.fillRect(W / 2 - 3, H / 2 - H / 2 * u, 6, H * u); g.restore();
  }, { trans: 'whip', hud: (g, lt, t) => {
    if (t >= fish4T) plate(g, 'FISH?', W * 0.25, 380, { color: LIME, size: 60, ...pin(t, fish4T) });
    if (t >= fm4T) plate(g, 'FISHERMAN?', W * 0.745, 380, { color: GOLD, size: 46, ...pin(t, fm4T) });
    if (t >= fm4T + 0.5) plate(g, 'COMMENT BELOW', W / 2, 1500, { color: CREAM, size: 46, ...pin(t, fm4T + 0.5) });
    if (t >= fm4T + 1.0) plate(g, 'FOLLOW ' + CHANNEL, W / 2, 1600, { color: CREAM, size: 38, ...pin(t, fm4T + 1.0) });
  } });
  cue(ctS - 0.06, 'whoosh_fast', 0.3); cue(fish4T, 'sparkle_pop', 0.3); cue(fm4T, 'sparkle_pop', 0.3); cue(fm4T + 0.5, 'sparkle_pop', 0.22); cue(fm4T + 1.0, 'sparkle_pop', 0.2);

  const music = [
    { t: 0, m: 'void' }, { t: stS - 0.05, m: 'digital' }, { t: bgS - 0.05, m: 'tension' }, { t: YANK, m: 'slam' },
    { t: ygS - 0.05, m: 'glory' }, { t: skS - 0.05, m: 'victory' }, { t: usS - 0.05, m: 'build' }, { t: nkS - 0.05, m: 'tension' },
    { t: fmanT - 0.004, m: 'slam' }, { t: flS - 0.05, m: 'elegy' }, { t: htS - 0.05, m: 'void' }, { t: dtS - 0.05, m: 'elegy' },
    { t: sfS - 0.05, m: 'tension' }, { t: ctS - 0.05, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  const musicFx = [
    { t0: BITE - 0.35, t1: YANK - 0.01, kind: 'mute' }, { t0: YANK, t1: YANK + 1.4, kind: 'boost', db: 3 },
    { t0: fmanT - 0.3, t1: fmanT - 0.01, kind: 'mute' }, { t0: fmanT, t1: fmanT + 0.9, kind: 'boost', db: 3 },
    { t0: htS - 0.05, t1: dtS - 0.1, kind: 'mute' },
    { t0: ctS, t1: T.duration, kind: 'lp', f: 900 },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, musicFx, duration: T.duration, autoWhoosh: false };
}
