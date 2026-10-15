// Magnus quit the World Championship because of his jeans (FIDE World Rapid & Blitz, New York, December 2024): the $200 fine,
// "I'll change tomorrow", not paired for round 9, the walk-out, FIDE backing down, the return in jeans, the shared blitz title
// with Nepomniachtchi, and the jeans sold on eBay for $36,100 for charity.
// Every shot is staged in 3D: a grand hall with columns, chandeliers and rows of tables; Magnus's table stands on legs so the
// jeans show underneath; the dress code and the pairings board are objects in the room; a podium; the jeans in a glass case.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { confetti } from '../../engine/js/draw.js';
import { Board, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { counter, badge, stamp, placeStamp, nameTitle, sans, mono, serif } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { room, box, pool, placeAt, picture, chandelier, chair, lamp, FLOOR_Y } from '../../engine/js/env.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const lin = x => x;
const quad = (g, pts, col) => { if (B.poly(g, pts)) { g.fillStyle = col; g.fill(); } };
const HALL = { base: '#0B0907', light: '#FFE2B0', lightA: 0.4 };
const fog = (col, d, near = 18, far = 95) => mix(col, HALL.base, clamp((d - near) / (far - near)) * 0.85);
const depth = (x, y, z) => B.toCam(x, y, z)[2];

// ---------- cached character sprites for the other players in the hall ----------
const SPR = new Map();
function sprite(who, e = 'focus', dark = false) {
  const key = `${who}|${e}|${dark}`;
  if (!SPR.has(key)) {
    const c = makeCanvas(520, 720), g = c.getContext('2d');
    drawChar(g, who, { x: 260, y: 260, s: 1, e: EXPR[e], t: 0, silhouette: dark, shade: 'brightness(0.16) saturate(0.4)' });
    SPR.set(key, c);
  }
  return SPR.get(key);
}
function billboard(g, spr, x, y, z, k = 1, { alpha = 1, blur = 0 } = {}) {
  if (depth(x, y, z) < 0.8) return;
  const p = B.project(x, y, z), s = p.s * k / 100 * 1.05;
  g.save(); g.globalAlpha *= alpha; if (blur > 0.6) g.filter = `blur(${blur.toFixed(1)}px)`;
  g.drawImage(spr, p.x - 260 * s, p.y - 260 * s, 520 * s, 720 * s); g.restore();
}
const CROWD = ['rival', 'ivan', 'goran', 'ehsan', 'susan', 'sofia', 'brother', 'witty', 'shannon', 'danya', 'tunde', 'operator'];

// ---------- jeans ----------
const DENIM = { base: '#3E5C86', dark: '#2A4266', seam: '#9DB5D6', shoe: '#2A1E18' };
// standing legs under a bust; (x, y) = the head centre on screen, sc = the character scale; walk 0..1 swings the legs
function legs(g, x, y, sc, { jeans = true, walk = 0, phase = 0, dark = false } = {}) {
  const col = dark ? ['#0E0E12', '#0A0A0D', '#16161B'] : jeans ? [DENIM.base, DENIM.dark, DENIM.seam] : ['#23262E', '#181A20', '#2E323B'];
  for (const sd of Math.sin(phase) > 0 ? [-1, 1] : [1, -1]) {
    const ang = walk * 0.3 * Math.sin(phase + (sd > 0 ? 0 : Math.PI));
    g.save(); g.translate(x + sd * 56 * sc, y + 315 * sc); g.rotate(ang); g.scale(sc, sc);
    const gr = g.createLinearGradient(-52, 0, 52, 0); gr.addColorStop(0, col[1]); gr.addColorStop(0.45, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(-54, 0); g.lineTo(54, 0); g.lineTo(42, 340); g.lineTo(-42, 340); g.closePath(); g.fill();
    if (jeans && !dark) {
      g.strokeStyle = rgba(col[2], 0.75); g.lineWidth = 3; g.setLineDash([7, 6]);
      g.beginPath(); g.moveTo(sd * 45, 6); g.lineTo(sd * 35, 336); g.stroke(); g.setLineDash([]);
      g.strokeStyle = rgba(col[2], 0.35); g.lineWidth = 2; for (const ky of [160, 172]) { g.beginPath(); g.moveTo(-32, ky); g.quadraticCurveTo(0, ky + 9, 32, ky); g.stroke(); }
      g.fillStyle = rgba(col[2], 0.5); g.fillRect(-42, 324, 84, 12);  // turned-up hem
    }
    g.fillStyle = dark ? '#060608' : DENIM.shoe; g.beginPath(); g.ellipse(4, 352, 54, 22, 0, 0, 7); g.fill();
    g.restore();
  }
}
// a whole standing (or walking) person in world space: legs, then the bust; head centre at y = 3.9
function standing(g, who, x, z, { e = 'neutral', t = 0, k = 1, walk = 0, phase = 0, jeans = true, back = false, face = -1, follow = 0.6 } = {}) {
  if (depth(x, 3.9, z) < 0.8) return;
  const p = B.project(x, 3.9, z), sc = p.s * k / 100 * 1.05, bob = walk ? Math.abs(Math.sin(phase)) * -10 * sc : 0;
  legs(g, p.x, p.y + bob, sc, { jeans, walk, phase, dark: back });
  if (back) { g.save(); g.filter = 'brightness(0.12) saturate(0.4)'; }
  drawChar(g, who, { x: p.x, y: p.y + bob, s: sc, e: typeof e === 'string' ? EXPR[e] : e, t });
  if (back) g.restore();
}
// a leather shoe seen from the front: (cx, ty) = the middle of the hem, s = the projected scale there
function shoe(g, cx, ty, s) {
  const hw = s * 0.4, h = s * 0.3, top = ty - s * 0.06;
  const gr = g.createLinearGradient(cx - hw, 0, cx + hw, 0); gr.addColorStop(0, '#1A0F09'); gr.addColorStop(0.45, '#4A2C1A'); gr.addColorStop(1, '#1A0F09');
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx - hw * 0.82, top); g.lineTo(cx + hw * 0.82, top);
  g.quadraticCurveTo(cx + hw * 1.12, top + h * 0.5, cx + hw * 1.02, top + h * 0.84); g.lineTo(cx - hw * 1.02, top + h * 0.84);
  g.quadraticCurveTo(cx - hw * 1.12, top + h * 0.5, cx - hw * 0.82, top); g.closePath(); g.fill();
  g.fillStyle = '#0C0705'; g.beginPath(); g.roundRect(cx - hw * 1.06, top + h * 0.8, hw * 2.12, h * 0.22, h * 0.08); g.fill();  // sole
  g.fillStyle = 'rgba(255,228,196,0.16)'; g.beginPath(); g.ellipse(cx - hw * 0.28, top + h * 0.5, hw * 0.34, h * 0.13, -0.1, 0, 7); g.fill();  // toe-cap shine
}
// a soft contact shadow on the carpet under a foot; fades as the foot lifts
function footShadow(g, x, z, r, a) {
  if (a <= 0.02 || depth(x, FLOOR_Y, z) < 0.6) return;
  const p = B.project(x, FLOOR_Y, z), w = p.s * r, gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, w);
  gr.addColorStop(0, `rgba(0,0,0,${0.55 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.fillStyle = gr; g.translate(p.x, p.y); g.scale(1, 0.3); g.translate(-p.x, -p.y); g.fillRect(p.x - w, p.y - w, w * 2, w * 2); g.restore();
}
// knees and shins under a table, seen from the front: knee at world (x, ky, z), shins down to the floor
function seatedJeans(g, x, z, { ky = -1.0 } = {}) {
  for (const sd of [-1, 1]) {
    const k = B.project(x + sd * 0.55, ky, z), f = B.project(x + sd * 0.6, FLOOR_Y + 0.3, z + 0.3), w = k.s * 0.42;
    if (depth(x, ky, z) < 0.6) continue;
    footShadow(g, x + sd * 0.6, z + 0.3, 0.7, 1); shoe(g, f.x, f.y, f.s * 1.05);
    const gr = g.createLinearGradient(k.x - w, 0, k.x + w, 0); gr.addColorStop(0, DENIM.dark); gr.addColorStop(0.5, DENIM.base); gr.addColorStop(1, DENIM.dark);
    g.fillStyle = gr; g.beginPath(); g.moveTo(k.x - w, k.y); g.lineTo(f.x - w * 0.82, f.y); g.lineTo(f.x + w * 0.82, f.y); g.lineTo(k.x + w, k.y); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(k.x, k.y, w, w * 0.55, 0, Math.PI, 0); g.fill();  // the knee
    g.strokeStyle = rgba(DENIM.seam, 0.7); g.lineWidth = Math.max(1.5, w * 0.06); g.setLineDash([w * 0.16, w * 0.14]);
    g.beginPath(); g.moveTo(k.x + sd * w * 0.82, k.y); g.lineTo(f.x + sd * w * 0.68, f.y); g.stroke(); g.setLineDash([]);
  }
}
// legs only, walking toward the camera (front view): the hips stay level, each leg swings forward and lifts at the knee
function walkingLegs(g, x, z, phase) {
  const bob = 0.08 * Math.abs(Math.sin(phase));
  const legsArr = [-1, 1].map(sd => {
    const ph = phase + (sd > 0 ? 0 : Math.PI), lift = Math.max(0, Math.sin(ph)), fwd = Math.cos(ph);
    const X = x + sd * 0.52;
    return { sd, d: depth(X, -1.5, z - 0.6 * fwd), hip: [X, 0.45 - bob, z], knee: [X, -1.35 + lift * 0.45 - bob, z - 0.35 * fwd - lift * 0.4], ankle: [X, -2.95 + lift * 0.55, z - 0.75 * fwd - lift * 0.15] };
  }).sort((a, b) => b.d - a.d);
  // belt and the jacket hem above the hips
  const bl = B.project(x - 1.08, 0.75 - bob, z), br = B.project(x + 1.08, 0.75 - bob, z), bb = B.project(x, 0.4 - bob, z);
  g.fillStyle = DENIM.dark; g.fillRect(bl.x, bl.y, br.x - bl.x, bb.y - bl.y + 4);
  g.fillStyle = '#3A2414'; g.fillRect(bl.x, bl.y, br.x - bl.x, (bb.y - bl.y) * 0.45);
  g.fillStyle = '#18213A'; const jt = B.project(x, 2.2 - bob, z); g.fillRect(bl.x - (br.x - bl.x) * 0.06, jt.y, (br.x - bl.x) * 1.12, bl.y - jt.y + 2);
  for (const L of legsArr) footShadow(g, L.ankle[0], L.ankle[2], 0.75, 1 - clamp((L.ankle[1] + 2.95) / 0.4));
  for (const L of legsArr) {
    const [h, k, a] = [L.hip, L.knee, L.ankle].map(p => B.project(...p));
    shoe(g, a.x, a.y, a.s);
    const seg2 = (p, q, w0, w1) => {
      const gr = g.createLinearGradient(p.x - w0, 0, p.x + w0, 0); gr.addColorStop(0, DENIM.dark); gr.addColorStop(0.45, DENIM.base); gr.addColorStop(1, DENIM.dark);
      g.fillStyle = gr; g.beginPath(); g.moveTo(p.x - w0, p.y); g.lineTo(p.x + w0, p.y); g.lineTo(q.x + w1, q.y); g.lineTo(q.x - w1, q.y); g.closePath(); g.fill();
    };
    const wh = h.s * 0.52, wk = k.s * 0.44, wa = a.s * 0.37;
    seg2(h, k, wh, wk); seg2(k, a, wk, wa);
    g.fillStyle = DENIM.base; g.beginPath(); g.ellipse(k.x, k.y, wk, wk * 0.35, 0, 0, 7); g.fill();
    g.strokeStyle = rgba(DENIM.seam, 0.75); g.lineWidth = Math.max(1.5, k.s * 0.03); g.setLineDash([k.s * 0.08, k.s * 0.07]);
    g.beginPath(); g.moveTo(h.x + L.sd * wh * 0.85, h.y); g.lineTo(k.x + L.sd * wk * 0.85, k.y); g.lineTo(a.x + L.sd * wa * 0.85, a.y); g.stroke(); g.setLineDash([]);
    g.strokeStyle = rgba(DENIM.seam, 0.3); g.lineWidth = Math.max(1, k.s * 0.02); for (const dy of [-0.18, -0.1]) { g.beginPath(); g.moveTo(k.x - wk * 0.6, k.y + dy * k.s); g.quadraticCurveTo(k.x, k.y + dy * k.s + k.s * 0.05, k.x + wk * 0.6, k.y + dy * k.s); g.stroke(); }
    g.fillStyle = rgba(DENIM.seam, 0.45); g.fillRect(a.x - wa, a.y - a.s * 0.12, wa * 2, a.s * 0.12);  // turned-up hem
  }
}
// a pair of jeans on its own (on a hanger in the glass case)
function jeansProp(g, x, y, sc) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.strokeStyle = '#C9A05A'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, -30); g.moveTo(-110, 0); g.lineTo(0, -34); g.lineTo(110, 0); g.stroke();
  const gr = g.createLinearGradient(-110, 0, 110, 0); gr.addColorStop(0, DENIM.dark); gr.addColorStop(0.5, DENIM.base); gr.addColorStop(1, DENIM.dark);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-104, 0); g.lineTo(104, 0); g.lineTo(112, 470); g.lineTo(18, 470); g.lineTo(4, 120); g.lineTo(-10, 120); g.lineTo(-24, 470); g.lineTo(-118, 470); g.closePath(); g.fill();
  g.fillStyle = DENIM.dark; g.fillRect(-104, 0, 208, 34);
  g.strokeStyle = rgba(DENIM.seam, 0.8); g.lineWidth = 3; g.setLineDash([8, 7]);
  g.beginPath(); g.moveTo(-104, 34); g.lineTo(104, 34); g.moveTo(-60, 34); g.quadraticCurveTo(-56, 90, -98, 96); g.moveTo(60, 34); g.quadraticCurveTo(56, 90, 98, 96);
  g.moveTo(0, 34); g.lineTo(0, 118); g.moveTo(-96, 120); g.lineTo(-108, 466); g.moveTo(96, 120); g.lineTo(108, 466); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#C9A05A'; for (const bx of [-60, 0, 60]) { g.beginPath(); g.arc(bx, 17, 6, 0, 7); g.fill(); }
  g.restore();
}

// ---------- documents and screens, drawn once and hung in the room ----------
function rulePage(after) {
  const c = makeCanvas(800, 1060), g = c.getContext('2d');
  g.fillStyle = '#F4EFE2'; g.fillRect(0, 0, 800, 1060);
  g.fillStyle = '#1E3A6E'; g.fillRect(0, 0, 800, 150);
  g.fillStyle = '#FFFFFF'; g.font = sans(70, 900); g.textAlign = 'center'; g.fillText('FIDE', 400, 100);
  g.fillStyle = '#2A2A2A'; g.font = sans(34, 800); g.fillText('WORLD RAPID & BLITZ 2024', 400, 220);
  g.fillStyle = '#8E1E22'; g.font = sans(46, 900); g.fillText('DRESS CODE', 400, 300);
  const rows = [['✓', 'JACKET, SHIRT, TROUSERS', '#2E6B3A'], ['✓', 'FORMAL SHOES', '#2E6B3A'], ['✗', 'SPORTS SHOES', '#8E1E22'], ['✗', 'JEANS', '#C0262C']];
  g.textAlign = 'left';
  rows.forEach(([m, txt, col], i) => {
    const y = 420 + i * 120, big = txt === 'JEANS';
    if (big) { g.fillStyle = after ? 'rgba(46,107,58,0.12)' : 'rgba(192,38,44,0.14)'; g.fillRect(60, y - 70, 680, 100); }
    g.fillStyle = col; g.font = sans(big ? 64 : 40, 900); g.fillText(m, 90, y); g.fillStyle = big ? col : '#2A2A2A'; g.fillText(txt, 170, y);
    if (big && after) { g.strokeStyle = '#C0262C'; g.lineWidth = 10; g.beginPath(); g.moveTo(80, y - 22); g.lineTo(420, y - 22); g.stroke(); }
  });
  if (after) { g.fillStyle = '#2E6B3A'; g.font = sans(40, 900); g.fillText('✓ APPROPRIATE JEANS', 90, 960); g.font = sans(30, 800); g.fillText('WITH A JACKET — ALLOWED', 130, 1010); }
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(40,40,40,0.12)'; g.fillRect(90, 340 + i * 4 - 4, 0, 0); }
  return c;
}
const PAGE = { before: rulePage(false), after: rulePage(true) };
function pairingsScreen() {
  const c = makeCanvas(1000, 640), g = c.getContext('2d');
  g.fillStyle = '#0A1220'; g.fillRect(0, 0, 1000, 640);
  g.fillStyle = '#E9B654'; g.font = sans(46, 900); g.textAlign = 'left'; g.fillText('ROUND 9 · PAIRINGS', 50, 80);
  for (let i = 0; i < 7; i++) {
    const y = 140 + i * 66; g.fillStyle = i % 2 ? '#12203A' : '#0F1A30'; g.fillRect(40, y - 40, 920, 58);
    g.fillStyle = '#5A6A88'; g.font = mono(30, 800); g.fillText(String(i + 1).padStart(2, ' '), 60, y);
    g.fillStyle = 'rgba(160,180,210,0.35)'; g.fillRect(140, y - 26, 300 - (i * 37) % 90, 20); g.fillRect(560, y - 26, 280 - (i * 53) % 110, 20);
  }
  g.fillStyle = 'rgba(192,38,44,0.9)'; g.fillRect(40, 572 - 46, 920, 70);
  g.fillStyle = '#FFFFFF'; g.font = sans(40, 900); g.fillText('CARLSEN — NOT PAIRED', 70, 576);
  return c;
}
const PAIR = pairingsScreen();
function fineSlip(stamped) {
  const c = makeCanvas(720, 300), g = c.getContext('2d');
  g.fillStyle = '#F2ECDD'; g.fillRect(0, 0, 720, 300);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,70,${Math.random() * 0.05})`; g.fillRect(Math.random() * 720, Math.random() * 300, 2, 2); }
  g.fillStyle = '#1E3A6E'; g.fillRect(0, 0, 720, 58); g.fillStyle = '#FFFFFF'; g.font = sans(30, 900); g.textAlign = 'left'; g.fillText('FIDE · WORLD RAPID 2024', 24, 40);
  g.fillStyle = '#8E1E22'; g.font = sans(40, 900); g.fillText('FINE NOTICE', 24, 112);
  g.fillStyle = '#2A2A2A'; g.font = mono(24, 800);
  [['PLAYER', 'CARLSEN, MAGNUS'], ['REASON', 'DRESS CODE: JEANS'], ['AMOUNT', '$200']].forEach(([k, v], i) => { g.fillStyle = '#6A6A6A'; g.fillText(k, 24, 160 + i * 42); g.fillStyle = '#1A1A1A'; g.fillText(v, 170, 160 + i * 42); });
  g.strokeStyle = '#2A2A2A'; g.lineWidth = 2; g.beginPath(); g.moveTo(470, 262); g.lineTo(690, 262); g.stroke(); g.font = mono(16, 700); g.fillStyle = '#6A6A6A'; g.fillText('CHIEF ARBITER', 520, 284);
  g.strokeStyle = '#2A3A6A'; g.lineWidth = 3; g.beginPath(); g.moveTo(480, 250); g.bezierCurveTo(520, 210, 540, 270, 580, 236); g.bezierCurveTo(610, 214, 630, 262, 680, 238); g.stroke();
  if (stamped) { g.save(); g.translate(578, 138); g.rotate(-0.16); g.strokeStyle = 'rgba(192,38,44,0.9)'; g.lineWidth = 7; g.strokeRect(-128, -46, 256, 92); g.lineWidth = 3; g.strokeRect(-119, -37, 238, 74);
    g.fillStyle = 'rgba(192,38,44,0.92)'; g.font = sans(58, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$200', 0, 4);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.arc((Math.random() - 0.5) * 256, (Math.random() - 0.5) * 92, 1 + Math.random() * 3, 0, 7); g.fill(); } g.restore(); }
  return c;
}
const FINE = { before: fineSlip(false), after: fineSlip(true) };
const BANNER = (() => { const c = makeCanvas(1400, 360), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#1E3A6E'); gr.addColorStop(1, '#13264A'); g.fillStyle = gr; g.fillRect(0, 0, 1400, 360);
  g.strokeStyle = '#C9A05A'; g.lineWidth = 8; g.strokeRect(14, 14, 1372, 332);
  g.fillStyle = '#E9D8A6'; g.font = serif(54, 700); g.textAlign = 'center'; g.fillText('WORLD BLITZ CHAMPIONSHIP', 700, 150);
  g.fillStyle = '#C9A05A'; g.font = sans(34, 800); g.fillText('NEW YORK · 2024', 700, 230); return c; })();
const PLAQUE = (() => { const c = makeCanvas(700, 220), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 700, 220); gr.addColorStop(0, '#8A6A2A'); gr.addColorStop(0.5, '#E2BE6A'); gr.addColorStop(1, '#8A6A2A'); g.fillStyle = gr; g.fillRect(0, 0, 700, 220);
  g.fillStyle = '#2A1C0C'; g.font = serif(40, 700); g.textAlign = 'center'; g.fillText("CARLSEN'S JEANS", 350, 92); g.font = sans(24, 800); g.fillText('WORLD RAPID · NEW YORK · 2024', 350, 150); return c; })();



// ---------- textures, drawn once and mapped onto the 3D surfaces ----------
function noiseCanvas(w, h, seed, draw) { const c = makeCanvas(w, h), g = c.getContext('2d'); draw(g, rng(seed), w, h); return c; }
// marble: warm cream slab with soft cloudiness and dark grey veins (2x2 tiles per texture, so the joints show)
const MARBLE = [0, 1].map(k => noiseCanvas(512, 512, 31 + k, (g, r, w, h) => {
  const base = k ? ['#9C8C74', '#5E5246'] : ['#5E5246', '#9C8C74'];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = base[(i + j) % 2]; g.fillRect(i * 256, j * 256, 256, 256); }
  for (let n = 0; n < 120; n++) { const x = r() * w, y = r() * h, rad = 20 + r() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${r() > 0.5 ? '255,240,215' : '20,14,10'},${0.04 + r() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.filter = 'blur(0.8px)';
  for (let n = 0; n < 9; n++) { g.strokeStyle = `rgba(${r() > 0.4 ? '210,195,170' : '15,12,10'},${0.18 + r() * 0.22})`; g.lineWidth = 0.8 + r() * 2.2;
    g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { const nx = x + (r() - 0.3) * 160, ny = y + (r() - 0.5) * 160; g.quadraticCurveTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 120, nx, ny); x = nx; y = ny; } g.stroke(); }
  g.filter = 'none'; g.strokeStyle = 'rgba(12,10,8,0.55)'; g.lineWidth = 3; g.strokeRect(0, 0, 512, 512); g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
}));
// wallpaper: deep green damask with faded gold medallions, a wainscot band at the bottom
const PAPER_WALL = noiseCanvas(256, 512, 9, (g, r, w, h) => {
  g.fillStyle = '#23332C'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 128) for (let x = (y / 128) % 2 ? 64 : 0; x < w + 64; x += 128) {
    g.save(); g.translate(x, y + 40); g.strokeStyle = 'rgba(201,160,90,0.32)'; g.fillStyle = 'rgba(201,160,90,0.10)'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, 0, 26, 40, 0, 0, 7); g.fill(); g.stroke();
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, -40); g.quadraticCurveTo(sd * 46, -10, sd * 8, 34); g.stroke(); }
    g.beginPath(); g.arc(0, -52, 6, 0, 7); g.fill(); g.restore(); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.3)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3A2414'; g.fillRect(0, h - 92, w, 92); g.fillStyle = '#C9A05A'; g.fillRect(0, h - 96, w, 5);
  for (let x = 8; x < w; x += 64) { g.strokeStyle = 'rgba(201,160,90,0.35)'; g.lineWidth = 2; g.strokeRect(x, h - 78, 48, 62); }
});
// tournament carpet: deep burgundy with a faint diamond lattice (seamless, so no tile joints show)
const CARPET = noiseCanvas(512, 512, 17, (g, r, w, h) => {
  g.fillStyle = '#3E1A1E'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '90,40,44' : '24,10,12'},${0.25 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 2, 2); }
  g.strokeStyle = 'rgba(201,160,90,0.10)'; g.lineWidth = 3;
  for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128 + 512, 512); g.stroke(); g.beginPath(); g.moveTo(k * 128 + 512, 0); g.lineTo(k * 128, 512); g.stroke(); }
  for (let x = 0; x <= w; x += 128) for (let y = 0; y <= h; y += 128) { g.fillStyle = 'rgba(201,160,90,0.12)'; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
});
// carved double doors: walnut leaves with raised panels and brass handles; `open` shows light between them
function doorTex(open) {
  const c = makeCanvas(400, 420), g = c.getContext('2d');
  g.fillStyle = '#FFF1D6'; g.fillRect(0, 0, 400, 420);
  const leaf = (x0, w) => {
    const gr = g.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, '#3A2414'); gr.addColorStop(0.5, '#5A3A22'); gr.addColorStop(1, '#3A2414');
    g.fillStyle = gr; g.fillRect(x0, 0, w, 420);
    g.strokeStyle = 'rgba(20,10,4,0.6)'; g.lineWidth = 4; for (const [py, ph] of [[30, 160], [220, 170]]) g.strokeRect(x0 + w * 0.15, py, w * 0.7, ph);
    g.strokeStyle = 'rgba(201,160,90,0.35)'; g.lineWidth = 2; for (const [py, ph] of [[36, 148], [226, 158]]) g.strokeRect(x0 + w * 0.18, py, w * 0.64, ph);
  };
  if (open) { leaf(0, 70); leaf(330, 70); } else { leaf(0, 198); leaf(202, 198); g.fillStyle = '#C9A05A'; g.fillRect(180, 200, 12, 40); g.fillRect(208, 200, 12, 40); }
  return c;
}
const DOORS = { shut: doorTex(false), open: doorTex(true) };
// walnut table top: long grain with growth rings
const WOOD = noiseCanvas(512, 512, 5, (g, r, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#4A2F1C'); gr.addColorStop(0.5, '#5A3A22'); gr.addColorStop(1, '#46301E'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let n = 0; n < 70; n++) { g.strokeStyle = `rgba(${r() > 0.5 ? '30,18,10' : '120,80,48'},${0.12 + r() * 0.18})`; g.lineWidth = 0.6 + r() * 2;
    const x0 = r() * w; g.beginPath(); g.moveTo(x0, 0); for (let y = 0; y <= h; y += 32) g.lineTo(x0 + Math.sin(y * 0.02 + n) * (4 + r() * 6), y); g.stroke(); }
  for (let n = 0; n < 4; n++) { const x = r() * w, y = r() * h; g.strokeStyle = 'rgba(30,18,10,0.25)'; for (let k = 1; k < 6; k++) { g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, k * 5, k * 18, 0, 0, 7); g.stroke(); } }
  g.fillStyle = 'rgba(255,220,170,0.06)'; g.fillRect(0, 0, w, h * 0.4);
});
// map a texture onto a world quad (tl, tr, bl; the 4th corner is implied); fog darkens it with distance
function texQuad(g, img, tl, tr, bl, { d = 0, fogA = 0 } = {}) {
  const br = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1], tr[2] + bl[2] - tl[2]];
  const cs = [tl, tr, bl, br].map(p => depth(...p));
  if (Math.min(...cs) < 0.4) { if (B.poly(g, [tl, tr, br, bl])) { g.fillStyle = mix('#2E2822', HALL.base, fogA); g.fill(); } return; }
  const P = [tl, tr, bl].map(p => B.project(...p));
  g.save(); B.poly(g, [tl, tr, br, bl]); g.clip();
  g.transform(P[1].x - P[0].x, P[1].y - P[0].y, P[2].x - P[0].x, P[2].y - P[0].y, P[0].x, P[0].y);
  g.drawImage(img, 0, 0, 1, 1);
  if (fogA > 0) { g.fillStyle = rgba(HALL.base, fogA); g.fillRect(0, 0, 1, 1); }
  g.restore();
}
const fogK = (d, near = 18, far = 95) => clamp((d - near) / (far - near)) * 0.85;

// ---------- the grand hall ----------
const TABLES = [[-20, 4], [28, 4], [-20, 24], [28, 24], [-20, 44], [28, 44]].map(([x, z], i) => {
  const r = rng(70 + i); return { x, z, far: CROWD[Math.floor(r() * CROWD.length)], near: CROWD[Math.floor(r() * CROWD.length)], pos: piecesAt(G, 10 + Math.floor(r() * 60)) };
});
function hallShell(g, t, { dim = 0, doorsOpen = false } = {}) {
  g.fillStyle = HALL.base; g.fillRect(0, 0, W, H);
  // carpeted floor (seamless texture, 12-unit pieces)
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const x0 = -40 + i * 12, z0 = -30 + j * 12, d = depth(x0 + 6, FLOOR_Y, z0 + 6); if (d > 150) continue;
    texQuad(g, CARPET, [x0, FLOOR_Y, z0 + 12], [x0 + 12, FLOOR_Y, z0 + 12], [x0, FLOOR_Y, z0], { d, fogA: fogK(d) });
  }
  // back wall: wallpaper between tall night windows; side walls papered too
  for (let i = 0; i < 11; i++) { const x0 = -40 + i * 8, d = depth(x0 + 4, 6, 60);
    texQuad(g, PAPER_WALL, [x0, 20, 60], [x0 + 8, 20, 60], [x0, FLOOR_Y, 60], { d, fogA: fogK(d) });
    quad(g, [[x0 + 2, 0, 59.9], [x0 + 6, 0, 59.9], [x0 + 6, 13, 59.9], [x0 + 2, 13, 59.9]], fog('#1C2A44', d));
    quad(g, [[x0 + 1.8, 13, 59.92], [x0 + 6.2, 13, 59.92], [x0 + 6.2, 13.4, 59.92], [x0 + 1.8, 13.4, 59.92]], fog('#C9A05A', d));
    pool(g, B, x0 + 4, 7, 59.8, 4, '#7FA6D9', 0.18, true); }
  for (const x of [-40, 48]) for (let i = 0; i < 12; i++) { const z0 = -30 + i * 7.5, d = depth(x, 6, z0 + 3.7);
    texQuad(g, PAPER_WALL, [x, 20, x < 0 ? z0 : z0 + 7.5], [x, 20, x < 0 ? z0 + 7.5 : z0], [x, FLOOR_Y, x < 0 ? z0 : z0 + 7.5], { d, fogA: fogK(d) }); }
  // the exit: carved double doors in the back wall, in a stone frame
  quad(g, [[-0.8, FLOOR_Y, 59.85], [8.8, FLOOR_Y, 59.85], [8.8, 9.2, 59.85], [-0.8, 9.2, 59.85]], fog('#B8A88A', depth(4, 3, 60)));
  texQuad(g, doorsOpen ? DOORS.open : DOORS.shut, [0, 8.4, 59.8], [8, 8.4, 59.8], [0, FLOOR_Y, 59.8]);
  if (doorsOpen) { pool(g, B, 4, 2, 59.5, 9, '#FFF1D6', 0.45, true); pool(g, B, 4, FLOOR_Y, 54, 9, '#FFF1D6', 0.3); }
  // round columns: shaded shaft with flutes, a base and a gilded capital
  for (const x of [-30, -8, 16, 38]) for (const z of [-12, 14, 36]) { const d = depth(x, 6, z); if (d < 3) continue; column(g, x, z, d); }
  for (const [x, z] of [[4, 4], [-16, 24], [24, 24], [4, 36]]) chandelier(g, B, x, 12, z, HALL, t);
  if (dim) { g.fillStyle = `rgba(0,0,0,${dim})`; g.fillRect(0, 0, W, H); }
}
function column(g, x, z, d) {
  const seg3 = (y0, y1, r, cols, flutes = 0) => {
    if (depth(x, y0, z) < 1 || depth(x, y1, z) < 1) return;
    const a = B.project(x, y0, z), b = B.project(x, y1, z), wa = r * a.s, wb = r * b.s;
    const gr = g.createLinearGradient(a.x - wa, 0, a.x + wa, 0); gr.addColorStop(0, fog(cols[2], d)); gr.addColorStop(0.35, fog(cols[0], d)); gr.addColorStop(0.6, fog(cols[1], d)); gr.addColorStop(1, fog(cols[2], d));
    g.fillStyle = gr; g.beginPath(); g.moveTo(a.x - wa, a.y); g.lineTo(a.x + wa, a.y); g.lineTo(b.x + wb, b.y); g.lineTo(b.x - wb, b.y); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(b.x, b.y, wb, wb * 0.18, 0, 0, 7); g.fill();
    if (flutes) { g.strokeStyle = rgba('#000000', 0.12); g.lineWidth = Math.max(1, wa * 0.05); for (let k = 1; k < flutes; k++) { const f = -1 + 2 * k / flutes, s2 = Math.sin(f * Math.PI / 2); g.beginPath(); g.moveTo(a.x + s2 * wa, a.y); g.lineTo(b.x + s2 * wb, b.y); g.stroke(); } }
  };
  seg3(FLOOR_Y, FLOOR_Y + 0.9, 1.55, ['#E2D6BC', '#C9BC9F', '#8E8268']);
  seg3(FLOOR_Y + 0.9, 16.2, 1.05, ['#E8DCC2', '#D2C5A8', '#8E8268'], 9);
  seg3(16.2, 17.2, 1.5, ['#F5D27A', '#C9A05A', '#7A5A20']);
  seg3(17.2, 17.6, 1.7, ['#E2BE6A', '#B08A3A', '#6A4A18']);
}
// another game in the hall: table, board, pieces and two players (sprites)
function otherTable(g, T) {
  const d = depth(T.x, 0, T.z); if (d < 1 || d > 120) return;
  const tab = (c) => fog(c, d);
  for (const [lx, lz] of [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]]) box(g, B, [T.x + lx - 0.25, FLOOR_Y, T.z + lz - 0.25], [T.x + lx + 0.25, -0.75, T.z + lz + 0.25], { top: tab('#2A1C12'), side: tab('#1E140D'), front: tab('#24180F') });
  box(g, B, [T.x - 5.1, -0.75, T.z - 5.1], [T.x + 5.1, -0.35, T.z + 5.1], { top: tab('#4A3322'), side: tab('#2A1C12'), front: tab('#3A2818') });
  if (B.E[1] > -0.35) texQuad(g, WOOD, [T.x - 5.1, -0.35, T.z + 5.1], [T.x + 5.1, -0.35, T.z + 5.1], [T.x - 5.1, -0.35, T.z - 5.1], { d, fogA: fogK(d) });
  const x0 = T.x - 4, z0 = T.z - 4;
  quad(g, [[x0, -0.34, z0], [x0 + 8, -0.34, z0], [x0 + 8, -0.34, z0 + 8], [x0, -0.34, z0 + 8]], tab('#EEEED2'));
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) quad(g, [[x0 + i, -0.33, z0 + j], [x0 + i + 1, -0.33, z0 + j], [x0 + i + 1, -0.33, z0 + j + 1], [x0 + i, -0.33, z0 + j + 1]], tab('#769656'));
  if (d < 70) B.drawPieces(g, T.pos.map(p => ({ ...p, x: x0 + p.x, z: z0 + p.z, y: -0.33 })), { dof: 0 });
}
function hallCrowd(g, { skipMain = true } = {}) {
  const items = [];
  for (const T of TABLES) {
    items.push({ d: depth(T.x, 0, T.z), f: () => otherTable(g, T) });
    const farFront = B.E[2] < T.z + 5.4, nearFront = B.E[2] > T.z - 5.4;
    items.push({ d: depth(T.x, 3, T.z + 5.4), f: () => billboard(g, sprite(T.far, 'focus', !farFront), T.x, 3.1, T.z + 5.4, 1.0) });
    items.push({ d: depth(T.x, 3, T.z - 5.4), f: () => billboard(g, sprite(T.near, 'focus', !nearFront), T.x, 3.1, T.z - 5.4, 1.0) });
  }
  return items;
}
// Magnus's table on legs (so the jeans show), the board, Magnus seated at the far side; opponent optional at the near side
function mainTable(g, t, { who = 'magnusNY', e = 'focus', opp = null, oppE = 'focus', pieces, jeans = true, focus = null, chairSeat = false, lift = 3.1, alpha = 1 } = {}) {
  if (chairSeat) {  // upholstered chair: walnut frame, red velvet back and seat
    box(g, B, [2.7, FLOOR_Y, 10.6], [5.3, 2.7, 11.0], { top: '#4A2E1E', side: '#2A1A10', front: '#3A2414' });
    quad(g, [[3.0, 2.4, 10.58], [5.0, 2.4, 10.58], [5.0, -0.7, 10.58], [3.0, -0.7, 10.58]], '#7A1E28');
    quad(g, [[3.15, 2.2, 10.57], [4.85, 2.2, 10.57], [4.85, 1.8, 10.57], [3.15, 1.8, 10.57]], 'rgba(255,200,190,0.10)');
    if (depth(4, 1, 10.56) > 0.6) for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      const p = B.project(3.4 + i * 0.6 + (j % 2) * 0.3 - 0.15, -0.25 + j * 0.65, 10.56); if (j % 2 && i === 2) continue;
      g.fillStyle = 'rgba(30,6,10,0.55)'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.055), 0, 7); g.fill();
    }
    quad(g, [[2.6, 2.7, 10.55], [5.4, 2.7, 10.55], [5.4, 2.95, 10.55], [2.6, 2.95, 10.55]], '#5A3A22');  // crest rail
  }
  const under = B.E[1] < -0.35;  // camera under the table: only the legs show, the torso is above the table top
  const h1 = who && alpha > 0 && !under ? seated(g, B, who, e, t, { z: 9.4, lift, alpha, hands: false }) : () => {};
  const leg = ([lx, lz]) => box(g, B, [lx - 0.3, FLOOR_Y, lz - 0.3], [lx + 0.3, -0.75, lz + 0.3], { top: '#2A1C12', side: '#1E140D', front: '#24180F' });
  leg([-0.6, 8.6]); leg([8.6, 8.6]);
  if (jeans && who && alpha > 0) { g.save(); g.globalAlpha *= alpha; seatedJeans(g, 4, 8.3); g.restore(); }
  leg([-0.6, -0.6]); leg([8.6, -0.6]);
  box(g, B, [-1.1, -0.75, -1.1], [9.1, -0.35, 9.1], { top: '#4A3322', side: '#2A1C12', front: '#3A2818' });
  if (B.E[1] > -0.35) texQuad(g, WOOD, [-1.1, -0.35, 9.1], [9.1, -0.35, 9.1], [-1.1, -0.35, -1.1]);
  pool(g, B, 4, -0.3, 4, 7, '#FFE2B0', 0.18);
  const h2 = opp ? seated(g, B, opp, oppE, t, { z: -1.4, face: 1, hands: false }) : () => {};
  if (B.E[1] > -0.35) { B.drawSlab(g, COM); B.drawPieces(g, pieces, { focus: focus ?? B.dist, dof: 1.0 }); }
  h1(); h2();
}
// the whole hall with Magnus's table among the others, depth-sorted
const DOFC = makeCanvas(), dofx = DOFC.getContext('2d');
function hall(g, lt, t, keys, { ez = lin, main = {}, extra = [], dim = 0, dof = 3.5, focus = null, tables = true, doorsOpen = false } = {}) {
  rig(B, lt, keys, { t, e: ez });
  const items = tables ? hallCrowd(g) : [];
  if (main) items.push({ d: depth(4, 0, 4), f: () => mainTable(g, t, main) });
  items.push(...extra.map(x => ({ d: x.p ? depth(...x.p) : x.d, f: x.f })));  // depth after the camera is set
  items.sort((a, b) => b.d - a.d);
  // depth of field: the room and everything well behind the subject, drawn first and blurred as one layer
  const fz = (focus ?? B.dist) + 7;
  hallShell(g, t, { dim, doorsOpen });
  const far = items.filter(it => it.d > fz), near = items.filter(it => it.d <= fz);
  far.forEach(it => it.f());
  if (dof > 0.5) {
    dofx.setTransform(1, 0, 0, 1, 0, 0); dofx.globalCompositeOperation = 'copy'; dofx.drawImage(g.canvas, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = `blur(${dof}px)`; g.drawImage(DOFC, 0, 0); g.restore();
  }
  near.forEach(it => it.f());
}
// a speech bubble pointing at a world point
function bubble(g, x, y, z, text, a = 1, { side = -1 } = {}) {
  if (a <= 0 || depth(x, y, z) < 0.6) return;
  const p = B.project(x, y, z);
  g.save(); g.globalAlpha *= a; g.font = sans(46, 900);
  const w = g.measureText(text).width + 70, h = 92, bx = clamp(p.x + side * 60 - (side < 0 ? w : 0), 30, W - 30 - w), by = p.y - 260;
  g.fillStyle = '#FFFFFF'; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowOffsetY = 8; g.beginPath(); g.roundRect(bx, by, w, h, 26); g.fill(); g.shadowColor = 'transparent'; qaRect(g, bx, by, w, h, 'text', text);
  g.beginPath(); g.moveTo(clamp(p.x, bx + 40, bx + w - 40) - 22, by + h - 2); g.lineTo(p.x, p.y - 140); g.lineTo(clamp(p.x, bx + 40, bx + w - 40) + 22, by + h - 2); g.fill();
  g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, bx + w / 2, by + h / 2 + 2); g.restore();
}
// a red target ring around something on screen
function ring(g, x, y, r, t, t0, a = 1) {
  const u = seg(t, t0, t0 + 0.25, ease.back); if (u <= 0 || a <= 0) return;
  g.save(); g.globalAlpha *= a; g.strokeStyle = C.red; g.lineWidth = 10; g.beginPath(); g.arc(x, y, r * lerp(1.6, 1, u), 0, 7); g.stroke();
  g.lineWidth = 6; for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + 0.4; g.beginPath(); g.moveTo(x + Math.cos(an) * r * 0.85, y + Math.sin(an) * r * 0.85); g.lineTo(x + Math.cos(an) * r * 1.2, y + Math.sin(an) * r * 1.2); g.stroke(); }
  g.restore();
}
function trophy(g, x, y, sc) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, '#9A7420'); gr.addColorStop(0.5, '#F5D27A'); gr.addColorStop(1, '#9A7420');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-70, -200); g.lineTo(70, -200); g.quadraticCurveTo(70, -90, 12, -70); g.lineTo(12, -30); g.lineTo(40, -10); g.lineTo(-40, -10); g.lineTo(-12, -30); g.lineTo(-12, -70); g.quadraticCurveTo(-70, -90, -70, -200); g.fill();
  g.strokeStyle = '#C9A05A'; g.lineWidth = 10; g.beginPath(); g.arc(-74, -160, 26, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(74, -160, 26, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
  g.fillStyle = '#3A2A14'; g.fillRect(-50, -10, 100, 22);
  g.restore();
}

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s, e_ = id => T.e(id);
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const scrim = (g, a = 0.45, h = 640) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(6,4,2,${a})`); gr.addColorStop(1, 'rgba(6,4,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, h); };
  const EV = 'FIDE WORLD RAPID & BLITZ · NEW YORK · DECEMBER 2024';
  const MID = piecesAt(G, 24), SP = piecesAt(G, 66).filter(p => p.z > 2.6);  // SP: a sparse late position for close shots, so few pieces block the view
  const FAR = SP.filter(p => p.z > 5);  // for the closest shots: only the pieces on Magnus's half

  // ======================= HOOK =======================
  const quitT = w('hook1', 'quit'), jeansT = w('hook2', 'jeans');
  shot(0, (g, lt, t, sh) => {  // the champion at his board, low enough to see the jeans under the table
    hall(g, lt, t, [[0, { yaw: 0.16, pitch: 0.52, dist: 16, fov: 1500, cy: H * 0.47, target: [4, 1.4, 6.8] }], [len(sh), { yaw: 0.06, pitch: 0.48, dist: 14.2 }]], {
      main: { pieces: SP, e: { ...EXPR.smug, look: [0, -0.2], curve: 0.7 }, chairSeat: true } });
    scrim(g, 0.6);
    nameTitle(g, lt, 'MAGNUS CARLSEN', 'WORLD CHAMPION', { y: 300, size: 78 });
    stamp(g, 'QUIT', W / 2, 1560, t, quitT, { color: C.red, size: 150, rot: -0.1 });
  }, { grade: 'warm', noJump: true, info: true });
  shot(jeansT - 0.55, (g, lt, t, sh) => {  // under the table: the jeans
    hall(g, lt, t, [[0, { yaw: 0.14, pitch: 0.04, dist: 11, fov: 2300, cy: H * 0.4, target: [4, -1.9, 8.3] }], [len(sh), { yaw: 0.04, pitch: 0.03, dist: 10.5, fov: 2500 }]], {
      main: { pieces: MID, e: 'smug', chairSeat: true } });
    const kn = B.project(4, -1.9, 8.4); ring(g, kn.x, kn.y, 330, t, jeansT, 1);
    scrim(g, 0.6);
    counter(g, 'BECAUSE OF', 'HIS JEANS', { y: 1530, size: 110, color: C.cream, labelColor: C.blue });
  }, { trans: 'whip', grade: 'warm', info: true, qaAllow: ['face cut by frame'] });
  cue(0.05, 'boom_cine', 0.9); cue(0.05, 'murmur', 0.35); cue(quitT, 'stamp', 1); cue(quitT + 0.05, 'gasp', 0.5); cue(w('hook2', 'Because') - 0.12, 'record_scratch', 0.8); cue(jeansT, 'fabric', 0.8); cue(jeansT, 'shimmer', 0.5);

  // ======================= NEW YORK, DECEMBER 2024: HE SHOWS UP IN JEANS =======================
  const nyT = w('s1', 'New'), magT = w('s1', 'Magnus'), rapT = w('s1', 'Rapid'), j1T = w('s1', 'jeans');
  shot(s('s1') - 0.1, (g, lt, t, sh) => {  // crane down into the hall
    hall(g, lt, t, [[0, { yaw: 0.1, pitch: 0.17, dist: 46, fov: 1150, cy: H * 0.5, target: [4, 3, 32] }], [len(sh), { yaw: 0.0, pitch: 0.13, dist: 38 }]], { ez: ease.inOut, main: null, dof: 0 });
    scrim(g, 0.5);
    placeStamp(g, lt, 'New York', 'December 2024', { y: 330, t0: nyT - (t - lt) });
  }, { trans: 'whip', grade: 'warm' });
  shot(magT - 0.15, (g, lt, t, sh) => {  // he walks in: a low shot of just the legs, the camera backing off in front of them
    const z = lerp(36, 26, clamp(lt / len(sh))), ph = t * 6.5;
    hall(g, lt, t, [[0, { yaw: 0.22, pitch: 0.03, dist: 5.2, fov: 1500, cy: H * 0.36, target: [4, -1.6, 36] }], [len(sh), { yaw: 0.12, pitch: 0.03, dist: 5.2, target: [4, -1.6, 26] }]], {
      main: null, doorsOpen: true, extra: [{ p: [4, -1, z], f: () => walkingLegs(g, 4, z, ph) }] });
    const kn = B.project(4, -1.3, z); ring(g, kn.x, kn.y, 330, t, j1T, 1);
    badge(g, 'WORLD RAPID CHAMPIONSHIP', W / 2, 1480, { color: C.gold, size: 44, a: seg(t, rapT - 0.2, rapT - 0.1), scale: pop(t, rapT - 0.2) });
    stamp(g, 'JEANS', W / 2, 1640, t, j1T, { color: C.blue, size: 110, rot: -0.08 });
    credit(g, EV, 1);
  }, { trans: 'cut', grade: 'warm', info: true });
  cue(nyT, 'whoosh_deep', 0.7); cue(nyT + 0.2, 'murmur', 0.5); cue(magT - 0.1, 'footsteps', 0.75); cue(j1T, 'stamp', 0.9); cue(j1T + 0.05, 'fabric', 0.6);

  // ======================= THE DRESS CODE SAYS NO JEANS =======================
  const noT = w('s2', 'no');
  const pageAt = (g, img, x0, z0, a = 1) => picture(g, B, img, [x0, -0.33, z0 + 4.2], [x0 + 3.2, -0.33, z0 + 4.2], [x0, -0.33, z0], { tone: 'color', border: '#E8E0CC', pad: 0.06, a });
  const arbDesk = (g, img, cup = [-8.4, -4.4]) => {  // the arbiters' desk: the rules on top of a booklet, a pen, a coffee cup, a desk lamp
    box(g, B, [-15, FLOOR_Y, -10], [-7, -0.75, -4], { top: '#2A1C12', side: '#1E140D', front: '#24180F' });
    box(g, B, [-15.4, -0.75, -10.4], [-6.6, -0.35, -3.6], { top: '#1E2A44', side: '#14203A', front: '#18243C' });
    pool(g, B, -11.5, -0.3, -7.2, 5, '#FFE2B0', 0.3);
    picture(g, B, PAGE.before, [-12.4, -0.345, -4.9], [-9.2, -0.345, -4.9], [-12.4, -0.345, -9.1], { tone: 'warm', border: '#CFC6B0', pad: 0.05, a: 0.9 });
    pageAt(g, img, -12.6, -9.2);
    const pa = B.project(-9.0, -0.3, -8.6), pb = B.project(-8.7, -0.3, -6.2);  // pen
    g.save(); g.lineCap = 'round'; g.strokeStyle = '#141A2A'; g.lineWidth = pa.s * 0.16; g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(pb.x, pb.y); g.stroke();
    g.strokeStyle = '#C9A05A'; g.lineWidth = pa.s * 0.05; g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(lerp(pa.x, pb.x, 0.25), lerp(pa.y, pb.y, 0.25)); g.stroke(); g.restore();
    const cb = B.project(cup[0], -0.35, cup[1]), ct = B.project(cup[0], 0.55, cup[1]), rr = cb.s * 0.5;  // coffee cup
    g.save(); g.fillStyle = '#E8E2D6'; g.fillRect(cb.x - rr, ct.y, rr * 2, cb.y - ct.y); g.beginPath(); g.ellipse(cb.x, cb.y, rr, rr * 0.35, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#3A2214'; g.beginPath(); g.ellipse(ct.x, ct.y, rr, rr * 0.35, 0, 0, 7); g.fill(); g.strokeStyle = '#E8E2D6'; g.lineWidth = rr * 0.2; g.beginPath(); g.arc(cb.x + rr * 1.1, (cb.y + ct.y) / 2, rr * 0.4, -1.2, 1.2); g.stroke(); g.restore();
  };
  shot(s('s2') - 0.1, (g, lt, t, sh) => {
    hall(g, lt, t, [[0, { yaw: -0.2, pitch: 1.0, dist: 9, fov: 1500, cy: H * 0.44, target: [-11, -0.3, -7] }], [len(sh), { yaw: -0.05, pitch: 1.1, dist: 7 }]], {
      main: { pieces: MID, who: null }, tables: false, extra: [{ p: [-11, 0, -7], f: () => arbDesk(g, PAGE.before) }], dof: 5 });
    scrim(g, 0.5);
    counter(g, 'DRESS CODE', null, { y: 300, size: 110, color: C.cream });
    stamp(g, 'NO JEANS', W / 2, 1520, t, noT, { color: C.red, size: 110, rot: -0.08 });
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(s('s2') - 0.05, 'paper', 0.8); cue(noT, 'error', 0.6); cue(noT + 0.05, 'stamp', 0.9);

  // ======================= $200 FINE, CHANGE NOW =======================
  const fineT = w('s3', '200'), nowT = w('s3', 'Right');
  shot(s('s3') - 0.1, (g, lt, t, sh) => {  // insert: the fine notice slides onto his table and gets stamped
    const sl = ease.out(seg(t, s('s3') + 0.1, s('s3') + 0.5)), dz = (1 - sl) * -3.5;
    hall(g, lt, t, [[0, { yaw: 0.12, pitch: 1.28, dist: 4.6, fov: 1500, cy: H * 0.5, target: [6.7, -0.35, -0.55] }], [len(sh), { yaw: 0.04, pitch: 1.32, dist: 3.9 }]], {
      main: null, tables: false, dof: 5, focus: 4.2, extra: [{ p: [6.7, 0, -0.6], f: () => {
        box(g, B, [0, -0.75, -4], [13, -0.35, 4], { top: '#4A3322', side: '#2A1C12', front: '#3A2818' });
        texQuad(g, WOOD, [0, -0.35, 4], [13, -0.35, 4], [0, -0.35, -4]);
        pool(g, B, 6.7, -0.3, -0.5, 4, '#FFE2B0', 0.22);
        const pa = B.project(8.4, -0.3, -1.2), pb = B.project(8.7, -0.3, 0.3);  // the arbiter's pen
        g.save(); g.lineCap = 'round'; g.strokeStyle = '#141A2A'; g.lineWidth = pa.s * 0.09; g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(pb.x, pb.y); g.stroke(); g.restore();
        picture(g, B, t >= fineT ? FINE.after : FINE.before, [5.5, -0.34, -0.05 + dz], [7.9, -0.34, -0.05 + dz], [5.5, -0.34, -1.05 + dz], { tone: 'color', border: '#E6DFCF', pad: 0.03 });
      } }] });
    scrim(g, 0.5);
    counter(g, 'FINED', null, { y: 300, size: 120, color: C.cream, a: seg(t, s('s3') + 0.2, s('s3') + 0.3) });
    credit(g, EV, 1);
  }, { trans: 'whip', grade: 'warm', info: true });
  shot(nowT - 1.15, (g, lt, t, sh) => {  // the arbiter at his board: change, now
    hall(g, lt, t, [[0, { yaw: -0.65, pitch: 0.16, dist: 15, fov: 1400, cy: H * 0.55, target: [3, 1.2, 8] }], [len(sh), { yaw: -0.45, pitch: 0.14, dist: 13 }]], {
      main: { pieces: SP, e: { ...EXPR.neutral, look: [-0.8, -0.3] } },
      extra: [{ p: [0.6, 2, 12.5], f: () => standing(g, 'arbiter', 0.6, 12.5, { e: exprAt([[0, 'focus'], [nowT - (t - lt), 'angry']], lt), t, jeans: false }) }] });
    scrim(g, 0.55);
    badge(g, 'CHANGE. NOW.', W / 2, 1540, { color: C.gold, size: 54, a: seg(t, nowT, nowT + 0.1), scale: pop(t, nowT) });
    credit(g, EV, 1);
  }, { trans: 'cut', grade: 'warm', info: true });
  cue(s('s3') + 0.1, 'swipe_card', 0.8); cue(fineT, 'stamp', 1); cue(fineT + 0.03, 'gavel', 0.5); cue(nowT, 'hit_punch', 0.7);

  // ======================= "I'LL CHANGE TOMORROW" =======================
  const tomT = w('s4', "I'll");
  shot(s('s4') - 0.1, (g, lt, t, sh) => {
    hall(g, lt, t, [[0, { yaw: 0.24, pitch: 0.38, dist: 12.5, fov: 1500, cy: H * 0.48, target: [4, 2.4, 9] }], [len(sh), { yaw: 0.16, pitch: 0.36, dist: 11 }]], {
      main: { pieces: FAR.filter(p => p.x > 1.2 && p.x < 6.8), e: { ...EXPR.smug, look: [0.3, -0.1], curve: 0.8 }, chairSeat: true } });
    bubble(g, 4, 3.8, 9.4, "I'll change tomorrow.", seg(t, tomT - 0.15, tomT), { side: 1 });
  }, { trans: 'cut', grade: 'warm' });
  cue(tomT - 0.15, 'sparkle_pop', 0.6); cue(tomT + 0.5, 'laugh', 0.3);

  // ======================= NOT PAIRED =======================
  const fnoT = w('s5', 'no'), parT = w('s5', 'paired');
  shot(s('s5') - 0.1, (g, lt, t, sh) => {  // the pairings board on its stand in the hall
    const scr = { p: [-14, 5, 28], f: () => {
      box(g, B, [-14.4, FLOOR_Y, 27.6], [-13.6, 2, 28.4], { top: '#1A1A1E', side: '#121216', front: '#16161A' });
      picture(g, B, PAIR, [-20, 10, 28], [-8, 10, 28], [-20, 2.3, 28], { tone: 'color', border: '#101014', pad: 0.3 });
      if (t > parT) pool(g, B, -14, 3, 27.6, 5, C.red, 0.25 * seg(t, parT, parT + 0.2), true);
    } };
    hall(g, lt, t, [[0, { yaw: -0.12, pitch: 0.1, dist: 24, fov: 1500, cy: H * 0.48, target: [-14, 6, 28] }], [len(sh), { yaw: 0.0, pitch: 0.08, dist: 19 }]], { main: null, tables: false, extra: [scr] });
    scrim(g, 0.5);
    counter(g, 'FIDE: NO', null, { y: 300, size: 120, color: C.cream, a: seg(t, fnoT - 0.1, fnoT) });
    stamp(g, 'NOT PAIRED', W / 2, 1540, t, parT, { color: C.red, size: 110, rot: -0.08 });
  }, { trans: 'whip', grade: 'cold', info: true });
  cue(fnoT, 'error', 0.6); cue(parT, 'stamp', 0.9); cue(parT + 0.05, 'dun_dun', 0.7);

  // ======================= HE WALKS OUT =======================
  const outT = w('s6', 'walks'), wholeT = w('s6', 'whole');
  shot(s('s6') - 0.1, (g, lt, t, sh) => {  // he stands up and leaves: an empty chair at the board
    const u = seg(t, outT - 0.5, outT + 0.5, ease.inOut);
    hall(g, lt, t, [[0, { yaw: -0.3, pitch: 0.24, dist: 15, fov: 1500, cy: H * 0.55, target: [4, 1.6, 7] }], [len(sh), { yaw: -0.15, pitch: 0.24, dist: 13 }]], {
      main: { pieces: SP, e: { ...EXPR.smug, look: [0.6, -0.4] }, chairSeat: true, lift: 3.1 + 1.2 * u, alpha: 1 - seg(t, outT - 0.1, outT + 0.35) } });
    scrim(g, 0.55);
    stamp(g, 'WITHDRAWN', W / 2, 330, t, outT, { color: C.red, size: 120, rot: -0.08 });
    badge(g, 'RAPID: OUT', W / 2 - 200, 500, { color: C.red, size: 42, a: seg(t, wholeT, wholeT + 0.1), scale: pop(t, wholeT) });
    badge(g, 'BLITZ: OUT', W / 2 + 200, 500, { color: C.red, size: 42, a: seg(t, wholeT + 0.15, wholeT + 0.25), scale: pop(t, wholeT + 0.15) });
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(outT - 0.3, 'fabric', 0.5); cue(outT, 'door_slam', 0.9); cue(outT + 0.05, 'stamp', 0.7); cue(outT + 0.2, 'gasp', 0.5); cue(wholeT, 'thud', 0.7); cue(wholeT + 0.15, 'thud', 0.7);

  // ======================= FIDE BACKS DOWN: JEANS ALLOWED =======================
  const daysT = w('s7', 'Two'), downT = w('s7', 'backs'), allT = w('s7', 'allowed');
  shot(s('s7') - 0.1, (g, lt, t, sh) => {
    const img = t >= downT + 0.4 ? PAGE.after : PAGE.before;
    hall(g, lt, t, [[0, { yaw: 0.35, pitch: 0.95, dist: 8.6, fov: 1500, cy: H * 0.42, target: [-11, -0.3, -7.3] }], [len(sh), { yaw: 0.15, pitch: 1.05, dist: 7.4 }]], {
      main: { pieces: MID, who: null }, tables: false, extra: [{ p: [-11, 0, -7], f: () => arbDesk(g, img, [-14.3, -4.7]) }], dof: 5 });
    scrim(g, 0.5);
    badge(g, '2 DAYS LATER', W / 2, 300, { color: C.blue, size: 44, a: seg(t, daysT, daysT + 0.1), scale: pop(t, daysT) });
    stamp(g, 'ALLOWED', W / 2, 1520, t, allT, { color: C.lime, size: 120, rot: -0.08 });
  }, { trans: 'zoom', grade: 'warm', info: true });
  cue(daysT, 'clock_tick', 0.5); cue(downT + 0.35, 'page_flip', 0.8); cue(allT, 'success', 0.9); cue(allT + 0.05, 'stamp', 0.7);

  // ======================= HE COMES BACK. IN JEANS =======================
  const backT = w('s8', 'back'), inJT = w('s8', 'jeans');
  shot(s('s8') - 0.1, (g, lt, t, sh) => {  // the legs again, walking out of the light of the doors
    const z = lerp(54, 45, clamp(lt / len(sh))), ph = t * 6.5;
    hall(g, lt, t, [[0, { yaw: -0.15, pitch: 0.03, dist: 5.2, fov: 1500, cy: H * 0.36, target: [4, -1.6, 54] }], [len(sh), { yaw: -0.05, pitch: 0.03, dist: 5.2, target: [4, -1.6, 45] }]], {
      main: null, doorsOpen: true, extra: [{ p: [4, -1, z], f: () => walkingLegs(g, 4, z, ph) }] });
    const kn = B.project(4, -1.3, z); ring(g, kn.x, kn.y, 330, t, inJT, 1);
    counter(g, "HE'S BACK", null, { y: 1520, size: 120, color: C.lime, a: seg(t, backT - 0.1, backT) });
  }, { trans: 'flash', grade: 'warm', info: true });
  cue(s('s8') - 0.1, 'footsteps', 0.75); cue(backT, 'boom_cine', 0.8); cue(inJT, 'shimmer', 0.8); cue(inJT + 0.05, 'fabric', 0.5);

  // ======================= THE BLITZ FINAL vs NEPOMNIACHTCHI =======================
  const finT = w('s9', 'final'), ianT = w('s9', 'Ian');
  const SIDE = { yaw: 1.5, pitch: 0.26, dist: 14, fov: 950, cy: H * 0.6, target: [4, 2.2, 4] };
  const final = (g, lt, t, keys, o = {}) => hall(g, lt, t, keys, { main: { pieces: o.pieces || MID, e: o.e || { ...EXPR.focus, look: [-0.6, 0.5] }, opp: 'nepo', oppE: o.oppE || { ...EXPR.focus, look: [0.6, 0.5] }, jeans: false }, extra: o.extra || [] });
  shot(s('s9') - 0.1, (g, lt, t, sh) => {
    final(g, lt, t, [[0, { ...SIDE, dist: 15 }], [len(sh), { ...SIDE, yaw: 1.42, dist: 13 }]]);
    scrim(g, 0.55);
    badge(g, 'WORLD BLITZ · FINAL', W / 2, 330, { color: C.gold, size: 48, a: seg(t, finT, finT + 0.1), scale: pop(t, finT) });
    badge(g, 'NEPOMNIACHTCHI', 260, 1500, { color: C.red, size: 36, a: seg(t, ianT, ianT + 0.1), scale: pop(t, ianT) });
    badge(g, 'CARLSEN', W - 230, 1500, { color: C.blue, size: 36, a: seg(t, ianT + 0.1, ianT + 0.2), scale: pop(t, ianT + 0.1) });
    credit(g, EV, 1);
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(finT, 'hit_punch', 0.7); cue(finT + 0.1, 'murmur', 0.4); cue(ianT, 'camera', 0.6); cue(ianT + 0.35, 'camera', 0.5);

  // ======================= THREE SUDDEN-DEATH GAMES, THREE DRAWS =======================
  const sdT = w('s10', 'sudden-death');
  const d3 = w('s10', 'draws');
  shot(s('s10') - 0.1, (g, lt, t, sh) => {  // over the board, the games fly by
    const k = Math.floor(lerp(30, 80, lt / len(sh)));
    hall(g, lt, t, [[0, { yaw: 0.5, pitch: 1.15, dist: 17.5, fov: 1500, cy: H * 0.5, target: [4, 0, 4] }], [len(sh), { yaw: 0.62, pitch: 1.12, dist: 16.3 }]], { main: { pieces: piecesAt(G, Math.min(k, G.length - 1)), who: null, jeans: false }, tables: false });
    scrim(g, 0.55);
    badge(g, 'SUDDEN DEATH', W / 2, 300, { color: C.red, size: 48, a: seg(t, sdT, sdT + 0.1), scale: pop(t, sdT) });
    for (let i = 0; i < 3; i++) { const t0 = d3 - 0.25 + i * 0.18, a = seg(t, t0, t0 + 0.1); if (a <= 0) continue;
      g.save(); g.globalAlpha = a; const x = W / 2 + (i - 1) * 250, y = 1520, sc = pop(t, t0); g.translate(x, y); g.scale(sc, sc);
      g.fillStyle = 'rgba(10,8,6,0.9)'; g.beginPath(); g.roundRect(-100, -60, 200, 120, 14); g.fill(); qaRect(g, -100, -60, 200, 120, 'text', '½–½ ' + i);
      g.fillStyle = C.cream; g.font = mono(64, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('½–½', 0, 4); g.restore(); }
  }, { trans: 'cut', grade: 'warm', info: true, qaAllow: ['face cut by frame'] });
  cue(sdT, 'heartbeat', 0.8); cue(sdT + 0.1, 'clock_tick', 0.5); for (let i = 0; i < 3; i++) { cue(d3 - 0.25 + i * 0.18, 'piece', 0.8); cue(d3 - 0.2 + i * 0.18, 'clock_press', 0.5); }

  // ======================= "CAN WE JUST SHARE THE TITLE?" — "YES" =======================
  const shT = w('s11', 'share'), yesT = w('s11', 'yes');
  shot(s('s11') - 0.1, (g, lt, t, sh) => {
    final(g, lt, t, [[0, { ...SIDE, dist: 15 }], [len(sh), { ...SIDE, yaw: 1.44, dist: 13.5 }]], {
      e: { ...EXPR.happy, look: [-0.9, 0.1] }, oppE: exprAt([[0, { ...EXPR.focus, look: [0.6, 0.5] }], [shT + 0.4 - (t - lt), { ...EXPR.shock, look: [0.8, 0] }], [yesT - (t - lt), { ...EXPR.happy, look: [0.6, 0] }]], lt),
      extra: [{ p: [-3.5, 2, 4], f: () => standing(g, 'arbiter', -3.5, 4, { e: exprAt([[0, 'focus'], [yesT - (t - lt), { ...EXPR.happy, nod: 1 }]], lt), t, jeans: false }) }] });
    bubble(g, 4, 3.6, 9.4, 'Share the title?', seg(t, shT - 0.2, shT), { side: -1 });
    scrim(g, 0.5, 520);
    stamp(g, 'FIDE: YES', W / 2, 330, t, yesT, { color: C.lime, size: 120, rot: -0.08 });
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(shT - 0.2, 'sparkle_pop', 0.6); cue(yesT, 'gavel', 0.9); cue(yesT + 0.05, 'success', 0.6); cue(yesT + 0.2, 'applause', 0.5);

  // ======================= THE FIRST SHARED WORLD TITLE =======================
  const firstT = w('s12', 'first');
  shot(s('s12') - 0.1, (g, lt, t, sh) => {  // both on the podium with two trophies
    const pod = { p: [4, 0, 20], f: () => {
      picture(g, B, BANNER, [-3.5, 12.4, 26], [11.5, 12.4, 26], [-3.5, 8.5, 26], { tone: 'color', border: '#0E1A30', pad: 0.2 });
      standing(g, 'nepo', 1.4, 21.5, { e: 'happy', t, jeans: false }); standing(g, 'magnusNY', 6.6, 21.5, { e: { ...EXPR.triumph }, t });
      box(g, B, [-3, FLOOR_Y, 19], [11, -0.2, 21], { top: '#E2BE6A', side: '#7A5A20', front: '#B08A3A' });
      for (const x of [1.4, 6.6]) placeAt(B, x, -0.2, 19.6, (px, py, sc) => trophy(g, px, py, sc * 1.1));
    } };
    hall(g, lt, t, [[0, { yaw: -0.2, pitch: 0.1, dist: 17, fov: 1500, cy: H * 0.52, target: [4, 1.8, 20] }], [len(sh), { yaw: 0.1, pitch: 0.1, dist: 15 }]], { main: null, extra: [pod] });
    pool(g, B, 4, 6, 20.5, 10, '#FFE6B8', 0.3, true);
    if (t > firstT - 0.3) confetti(g, t, firstT - 0.3, { n: 90 });
    for (let k = 0; k < 7; k++) {  // press photographers' flashes
      const tf = firstT + 0.15 + k * 0.33 + (k % 3) * 0.07, a = Math.exp(-Math.max(0, t - tf) / 0.08) * (t >= tf ? 1 : 0); if (a < 0.02) continue;
      const fp = B.project(-6 + ((k * 37) % 20), 1 + (k % 2) * 1.5, 11 + (k % 3)), gr = g.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 260);
      gr.addColorStop(0, `rgba(255,255,255,${0.9 * a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(fp.x - 260, fp.y - 260, 520, 520); g.restore();
      if (k === 0 || k === 3) { g.save(); g.fillStyle = `rgba(255,255,255,${0.18 * a})`; g.fillRect(0, 0, W, H); g.restore(); }
    }
    scrim(g, 0.55);
    badge(g, 'CO-CHAMPIONS', W / 2, 1500, { color: C.gold, size: 52, sub: 'FIRST SHARED WORLD TITLE IN HISTORY', a: seg(t, firstT, firstT + 0.1), scale: pop(t, firstT) });
  }, { trans: 'flash', grade: 'warm', info: true });
  cue(firstT, 'reveal_bell', 0.8); cue(firstT, 'applause', 0.8); cue(firstT - 0.3, 'confetti', 0.8); for (let k = 0; k < 7; k++) cue(firstT + 0.15 + k * 0.33 + (k % 3) * 0.07, 'camera', 0.45);

  // ======================= THE JEANS: eBAY, $36,100, FOR CHARITY =======================
  const ebT = w('s13', 'eBay'), bidT = w('s13', '36,100'), solT = w('s13', 'dollars'), chT = w('s13', 'charity');
  shot(s('s13') - 0.1, (g, lt, t, sh) => {  // a glass case under a spotlight
    rig(B, lt, [[0, { yaw: -0.45, pitch: 0.12, dist: 14, fov: 1400, cy: H * 0.6, target: [4, 2.4, 4] }], [len(sh), { yaw: 0.35, pitch: 0.1, dist: 12.5 }]], { t, e: lin });
    room(g, B, 'backroom', { t, blur: 3, over: { light: '#FFE6B8', lightA: 0.25 } });
    box(g, B, [2, FLOOR_Y, 2], [6, -0.6, 6], { top: '#2A2A30', side: '#141418', front: '#1E1E24' });
    picture(g, B, PLAQUE, [3, -1.2, 1.97], [5, -1.2, 1.97], [3, -1.83, 1.97], { tone: 'color', border: '#4A3A1A', pad: 0.06 });
    placeAt(B, 4, 6.2, 4, (px, py, sc) => jeansProp(g, px, py, sc * 0.95));
    g.save(); g.globalAlpha = 0.16; box(g, B, [2.2, -0.6, 2.2], [5.8, 8.6, 5.8], { top: '#DDEEFF', side: '#A9C4DD', front: '#C9DDEE' }); g.restore();
    pool(g, B, 4, 3, 4, 7, '#FFF1D6', 0.25, true);
    scrim(g, 0.6);
    badge(g, 'eBAY AUCTION', W / 2, 170, { color: C.gold, size: 44, a: seg(t, ebT, ebT + 0.1), scale: pop(t, ebT) });
    const bid = Math.round(lerp(8200, 36100, seg(t, bidT - 0.2, bidT + 1.3, ease.inOut)) / 100) * 100;
    counter(g, '$' + bid.toLocaleString('en-US'), t >= solT ? 'SOLD' : 'CURRENT BID', { y: 320, size: 120, color: t >= solT ? C.lime : C.cream, a: seg(t, bidT - 0.3, bidT - 0.2), labelColor: t >= solT ? C.lime : C.gold });
    badge(g, 'FOR CHARITY', W / 2, 1500, { color: C.blue, size: 40, a: seg(t, chT, chT + 0.1), scale: pop(t, chT) });
    credit(g, 'PROCEEDS: BIG BROTHERS BIG SISTERS OF AMERICA · 2025', seg(t, chT, chT + 0.2));
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(s('s13') - 0.1, 'glass', 0.6); cue(ebT, 'notify', 0.8); for (let i = 0; i < 8; i++) cue(bidT - 0.2 + i * 0.18, 'clock_press', 0.35); cue(solT, 'gavel', 1); cue(solT + 0.05, 'cash', 0.8); cue(chT, 'shimmer', 0.7);

  // ======================= WOULD YOU HAVE CHANGED? FOLLOW =======================
  const chgT = w('cta', 'changed'), folT = w('cta', 'Follow');
  shot(s('cta') - 0.1, (g, lt, t, sh) => {
    hall(g, lt, t, [[0, { yaw: -0.2, pitch: 0.5, dist: 15.5, fov: 1500, cy: H * 0.5, target: [4, 1.4, 6.8] }], [len(sh), { yaw: 0.0, pitch: 0.47, dist: 13.8 }]], {
      main: { pieces: SP, e: { ...EXPR.smug, look: [0, 0], curve: 0.9 }, chairSeat: true } });
    scrim(g, 0.65);
    counter(g, 'WOULD YOU', 'HAVE CHANGED?', { y: 320, size: 110, color: C.cream, labelColor: C.gold, a: seg(t, s('cta'), s('cta') + 0.1) });
    badge(g, 'YES — CHANGE', W / 2 - 220, 500, { color: '#8A8F98', size: 38, a: seg(t, chgT, chgT + 0.1), scale: pop(t, chgT) });
    badge(g, 'NO — KEEP JEANS', W / 2 + 210, 500, { color: C.blue, size: 38, a: seg(t, chgT + 0.12, chgT + 0.22), scale: pop(t, chgT + 0.12) });
    badge(g, 'FOLLOW FOR MORE', W / 2, 1500, { color: C.gold, size: 48, sub: 'THE 64 FILES', a: seg(t, folT, folT + 0.1), scale: pop(t, folT) });
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(chgT, 'sparkle_pop', 0.5); cue(chgT + 0.12, 'sparkle_pop', 0.5); cue(folT, 'success', 0.8);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.7);
  const music = [
    { t: 0, m: 'hook' }, { t: s('s1') - 0.1, m: 'build' }, { t: fineT, m: 'tension' }, { t: s('s6') - 0.1, m: 'drop' }, { t: s('s7') - 0.1, m: 'clockwork' },
    { t: s('s8') - 0.1, m: 'victory' }, { t: s('s10') - 0.1, m: 'tension' }, { t: yesT, m: 'hit' }, { t: s('s12') - 0.1, m: 'victory' }, { t: s('s13') - 0.1, m: 'digital' },
    { t: s('cta') - 0.1, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
