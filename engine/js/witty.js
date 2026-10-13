// Sets and props for the Witty Alien episode: a Bulgarian hillside village (terrain, whitewashed houses with tiled
// roofs, fences, goats), a streamer's room with LED strips, a code screen, an engine evaluation bar, chat
// bubbles and webcam panels laid out like a stream overlay.
import { W, H, C, clamp, lerp, rgba, mix, rng, makeCanvas, ease } from './core.js';
import { box, FLOOR_Y, BACK_Z } from './env.js';
import { drawChar, EXPR } from './characters.js';

// ---- countryside ----
export const hillH = (x, z) => 2.6 * Math.exp(-((x + 10) ** 2) / 90 - ((z - 22) ** 2) / 60) + 3.4 * Math.exp(-((x - 18) ** 2) / 110 - ((z - 26) ** 2) / 70)
  + 0.45 * Math.sin(x * 0.21 + 1.3) * Math.sin(z * 0.17) * clamp((Math.hypot(x - 4, z - 4) - 4) / 8) + 0.8 * clamp((z - 12) / 14) * (1 + Math.sin(x * 0.12));

// sky with layered mountain ridges that slide with the camera yaw; sun 0 = midday, 1 = sunset
function skyAndRidges(g, b, t, sun) {
  const fw = [-Math.sin(b.yaw), 0, Math.cos(b.yaw)], E = b.E;
  const hz = b.project(E[0] + fw[0] * 1e5, 0, E[2] + fw[2] * 1e5).y;
  const sky = g.createLinearGradient(0, hz - 1500, 0, hz + 40);
  sky.addColorStop(0, mix('#5E9BD0', '#3A3F78', sun)); sky.addColorStop(0.65, mix('#A9D2EC', '#F0906A', sun)); sky.addColorStop(1, mix('#E6F2F2', '#FFD38A', sun));
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  if (sun > 0) { const sx = W * 0.62 - b.yaw * 700, sy = hz - 160; const gr = g.createRadialGradient(sx, sy, 10, sx, sy, 520); gr.addColorStop(0, rgba('#FFF2C0', 0.95 * sun)); gr.addColorStop(0.12, rgba('#FFC870', 0.6 * sun)); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const r = rng(31);
  g.save(); g.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) { const x = ((r() * 2600 - b.yaw * 600 + t * (8 + r() * 10)) % 2600 + 2600) % 2600 - 760, y = hz - 300 - r() * 800, w = 220 + r() * 380;
    g.fillStyle = rgba(mix('#FFFFFF', '#FFD8C0', sun), 0.55); g.beginPath(); g.ellipse(x, y, w, w * 0.22, 0, 0, 7); g.ellipse(x + w * 0.35, y - w * 0.08, w * 0.5, w * 0.2, 0, 0, 7); g.fill(); }
  g.restore();
  // three ridges, far to near, each with its own parallax and haze
  for (const [k, amp, base, col] of [[0.25, 160, 40, '#8FB0C0'], [0.45, 220, 10, '#6F9A7E'], [0.7, 180, -10, '#4E7E52']]) {
    g.beginPath(); g.moveTo(-10, H);
    for (let x = -10; x <= W + 10; x += 20) {
      const u = (x + b.yaw * 900 * k) / 260;
      g.lineTo(x, hz - base - amp * (0.55 + 0.3 * Math.sin(u * 1.3 + k * 9) + 0.15 * Math.sin(u * 3.7 + k * 4)));
    }
    g.lineTo(W + 10, H); g.closePath(); g.fillStyle = mix(mix(col, '#E8B07A', sun * 0.45), '#C9DCE6', 0.25 - k * 0.2); g.fill();
  }
  return hz;
}

export function countryside(g, b, t, { sun = 0, blur = 0, wind = 0.6 } = {}) {
  skyAndRidges(g, b, t, sun);
  const Q = [];
  for (let x = -40; x < 48; x += 2) for (let z = -14; z < 40; z += 2) {
    const c = b.toCam(x + 1, hillH(x + 1, z + 1), z + 1);
    if (c[2] > -2) Q.push([x, z, c[2]]);
  }
  Q.sort((a, q) => q[2] - a[2]);
  const tg = blur > 0.5 ? (g.save(), g.filter = `blur(${blur.toFixed(1)}px)`, g) : g;
  const st = 2;
  for (const [x, z, d] of Q) {
    const h00 = hillH(x, z), h10 = hillH(x + st, z), h01 = hillH(x, z + st), h11 = hillH(x + st, z + st);
    const nx = (h00 - h10 + h01 - h11) / (2 * st), nz = (h00 - h01 + h10 - h11) / (2 * st), lit = clamp(0.7 + nx * 0.9 - nz * 0.6, 0.35, 1.15);
    const field = ((Math.floor(x / 6) + Math.floor(z / 6)) % 3 + 3) % 3, base = ['#6E9A3E', '#7FA848', '#8BAA52'][field];
    let col = mix(mix(base, '#1E2A14', 1 - Math.min(1, lit)), '#F4F0C0', Math.max(0, lit - 1) * 0.6);
    col = mix(col, '#E8A060', sun * 0.18);
    col = mix(col, '#B9CED6', clamp((d - 14) / 50) * 0.55);
    if (b.poly(tg, [[x, h00, z], [x + st + 0.04, h10, z], [x + st + 0.04, h11, z + st + 0.04], [x, h01, z + st + 0.04]])) { tg.fillStyle = col; tg.fill(); }
  }
  if (blur > 0.5) g.restore();
  // grass tufts swaying
  const rg = rng(12);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = -8 + rg() * 24, z = -2 + rg() * 16, h = hillH(x, z);
    if (b.toCam(x, h, z)[2] < 0.8) continue;
    const p = b.project(x, h, z), s = p.s, sw = (Math.sin(t * 2 + i) * 0.2 + 0.25) * wind;
    g.strokeStyle = mix('#5E8A2E', '#C8D070', rg() * 0.5); g.lineWidth = Math.max(1, s * 0.025); g.beginPath();
    for (let k = -2; k <= 2; k++) { g.moveTo(p.x + k * s * 0.05, p.y); g.quadraticCurveTo(p.x + k * s * 0.08 + sw * s * 0.3, p.y - s * 0.22, p.x + k * s * 0.12 + sw * s * 0.6, p.y - s * (0.36 + 0.05 * (2 - Math.abs(k)))); }
    g.stroke();
  }
  g.restore();
}

// whitewashed house with a red tile roof (ridge along x); (x0..x1, z0..z1) footprint at ground height y
export function house(g, b, x0, z0, x1, z1, { h = 2.6, y = 0, wall = '#ECE4D2', roof = '#B5532F', door = true } = {}) {
  box(g, b, [x0, y - 0.6, z0], [x1, y + h, z1], { top: mix(wall, '#000', 0.1), side: mix(wall, '#3A2A1A', 0.28), front: wall });
  const zm = (z0 + z1) / 2, yr = y + h + (z1 - z0) * 0.45, o = 0.35;
  const faces = [[[x0 - o, y + h, z0 - o], [x1 + o, y + h, z0 - o], [x1 + o, yr, zm], [x0 - o, yr, zm]], [[x0 - o, y + h, z1 + o], [x1 + o, y + h, z1 + o], [x1 + o, yr, zm], [x0 - o, yr, zm]]];
  const gables = [[[x0, y + h, z0], [x0, y + h, z1], [x0, yr - 0.2, zm]], [[x1, y + h, z0], [x1, y + h, z1], [x1, yr - 0.2, zm]]];
  for (const q of gables) if ((b.E[0] < x0 && q[0][0] === x0) || (b.E[0] > x1 && q[0][0] === x1)) if (b.poly(g, q)) { g.fillStyle = mix(wall, '#3A2A1A', 0.2); g.fill(); }
  faces.sort((a, q) => b.toCam(...q[0])[2] - b.toCam(...a[0])[2]);
  for (const q of faces) if (b.poly(g, q)) {
    g.fillStyle = q[0][2] < zm ? roof : mix(roof, '#000', 0.25); g.fill();
    g.strokeStyle = 'rgba(60,20,10,0.35)'; g.lineWidth = 1.5;
    for (let k = 1; k < 5; k++) { const u = k / 5, A = b.project(lerp(q[0][0], q[3][0], u), lerp(q[0][1], q[3][1], u), lerp(q[0][2], q[3][2], u)), B2 = b.project(lerp(q[1][0], q[2][0], u), lerp(q[1][1], q[2][1], u), lerp(q[1][2], q[2][2], u)); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B2.x, B2.y); g.stroke(); }
  }
  if (door && b.E[2] < z0) {
    box(g, b, [x0 + (x1 - x0) * 0.42, y - 0.1, z0 - 0.04], [x0 + (x1 - x0) * 0.58, y + h * 0.62, z0], { top: '#5A3A22', side: '#3A2414', front: '#6A4428' });
    for (const xf of [0.15, 0.75]) box(g, b, [x0 + (x1 - x0) * xf, y + h * 0.4, z0 - 0.03], [x0 + (x1 - x0) * (xf + 0.12), y + h * 0.75, z0], { top: '#2A3A4A', side: '#2A3A4A', front: '#3A5068' });
  }
}

// wooden fence along a line of posts
export function fence(g, b, pts, { color = '#7A5A3A' } = {}) {
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i], y = hillH(x, z);
    box(g, b, [x - 0.08, y, z - 0.08], [x + 0.08, y + 1.1, z + 0.08], { top: color, side: mix(color, '#000', 0.3), front: color });
    if (i) { const [px, pz] = pts[i - 1], py = hillH(px, pz);
      for (const hh of [0.45, 0.9]) if (b.poly(g, [[px, py + hh, pz], [x, y + hh, z], [x, y + hh + 0.1, z], [px, py + hh + 0.1, pz]])) { g.fillStyle = mix(color, '#FFF', 0.08); g.fill(); } }
  }
}

// goat sprite: (x, y) = feet on the ground, s = px per world unit, face = ±1, chew/bob animated by t
export function goat(g, x, y, s, t, { face = 1, color = '#F2EEE6', patch = null, seed = 0, look = 0, phones = false } = {}) {
  const k = s / 100, bob = Math.sin(t * 3 + seed) * 2, chew = Math.sin(t * 9 + seed * 3) * 2;
  g.save(); g.translate(x, y); g.scale(face * k, k);
  const dark = mix(color, '#2A2420', 0.45);
  g.strokeStyle = dark; g.lineWidth = 9; g.lineCap = 'round';
  for (const lx of [-34, -18, 22, 36]) { g.beginPath(); g.moveTo(lx, -40); g.lineTo(lx + Math.sin(t * 2 + lx) * 1.5, 0); g.stroke(); }
  const gr = g.createLinearGradient(0, -90, 0, -30); gr.addColorStop(0, color); gr.addColorStop(1, mix(color, '#8A7A6A', 0.35));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -58 + bob * 0.3, 52, 26, 0, 0, 7); g.fill();
  if (patch) { g.fillStyle = patch; g.beginPath(); g.ellipse(-14, -64, 22, 16, 0.3, 0, 7); g.fill(); }
  g.fillStyle = color; g.beginPath(); g.moveTo(-50, -66); g.lineTo(-62, -82); g.lineTo(-48, -74); g.fill();  // tail
  g.save(); g.translate(46, -74 + bob); g.rotate(-0.25 + look * 0.2);
  g.fillStyle = color; g.beginPath(); g.moveTo(-14, 6); g.lineTo(6, -20); g.lineTo(30, -10); g.lineTo(38, 8 + chew * 0.5); g.lineTo(18, 16); g.closePath(); g.fill();
  g.fillStyle = dark; g.beginPath(); g.moveTo(30, 12); g.lineTo(28, 30 + chew); g.lineTo(22, 14); g.fill();             // beard
  g.strokeStyle = '#B8A88E'; g.lineWidth = 5; g.beginPath(); g.moveTo(4, -18); g.quadraticCurveTo(-6, -36, -18, -30); g.stroke();  // horn
  g.fillStyle = mix(color, '#C9A890', 0.4); g.beginPath(); g.ellipse(-4, -8, 14, 6, -0.6, 0, 7); g.fill();                  // ear
  g.fillStyle = '#1A1410'; g.beginPath(); g.ellipse(18, -6, 3.5, 4.5, 0, 0, 7); g.fill();
  if (phones) {  // a gaming headset, for the last joke
    g.strokeStyle = '#15171C'; g.lineWidth = 6; g.beginPath(); g.arc(2, -8, 22, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.fillStyle = '#15171C'; g.beginPath(); g.roundRect(-16, -12, 14, 20, 6); g.fill(); g.fillStyle = '#8FD16A'; g.fillRect(-12, -6, 5, 10);
  }
  g.restore();
  g.restore();
}
// goats in world space: [{x, z, face, color, patch}], sorted far to near
export function herd(g, b, list, t, { k = 1 } = {}) {
  list.map(q => ({ ...q, c: b.toCam(q.x, hillH(q.x, q.z), q.z) })).filter(q => q.c[2] > 0.8).sort((a, q) => q.c[2] - a.c[2]).forEach((q, i) => {
    const p = b.project(q.x, hillH(q.x, q.z), q.z);
    g.save(); g.globalAlpha = 0.25; g.fillStyle = '#000'; g.beginPath(); g.ellipse(p.x, p.y, p.s * 0.5 * k, p.s * 0.1 * k, 0, 0, 7); g.fill(); g.restore();
    goat(g, p.x, p.y, p.s * 0.75 * k, t, { face: q.face || 1, color: q.color, patch: q.patch, seed: i * 1.7, look: q.look || 0, phones: q.phones });
  });
}

// ---- streamer room ----
export const GAMER = { base: '#06050C', wall: ['#16142A', '#121024'], floor: ['#0C0B14', '#0A0912'], light: '#B48CFF', lightA: 0.28, strips: '#8E6CFF' };

// glowing LED strip along a world-space line
export function ledStrip(g, b, a, q, color, t, { w = 0.12, phase = 0 } = {}) {
  if (b.toCam(...a)[2] < 0.5 || b.toCam(...q)[2] < 0.5) return;
  const A = b.project(...a), B2 = b.project(...q), pulse = 0.8 + 0.2 * Math.sin(t * 2 + phase);
  g.save(); g.globalCompositeOperation = 'screen'; g.lineCap = 'round';
  g.strokeStyle = rgba(color, 0.18 * pulse); g.lineWidth = Math.max(8, A.s * w * 8); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B2.x, B2.y); g.stroke();
  g.strokeStyle = rgba(color, 0.9); g.lineWidth = Math.max(2, A.s * w); g.stroke();
  g.restore();
}

// code editor screen (canvas), cursor blinking; cached per (line count, blink)
const CODE = ['const app = express();', 'app.get("/", (req, res) => {', '  res.render("index", { user });', '});', '', 'function validate(form) {', '  if (!form.email) return false;', '  return form.email.includes("@");', '}', '', '// TODO: fix the footer again', 'export default app;'];
const codeCache = new Map();
export function codeScreen(lines = 12, blink = true) {
  const key = lines + '|' + blink;
  if (codeCache.has(key)) return codeCache.get(key);
  const c = makeCanvas(900, 560), g = c.getContext('2d');
  g.fillStyle = '#14171E'; g.fillRect(0, 0, 900, 560);
  g.fillStyle = '#1C2029'; g.fillRect(0, 0, 900, 40); g.fillStyle = '#C9CED8'; g.font = '600 20px "JetBrains Mono"'; g.fillText('index.js — website', 20, 27);
  const col = s => /^\s*\/\//.test(s) ? '#8A94A8' : /function|const|return|export|if/.test(s) ? '#D6A8FF' : '#F2F4F8';
  g.font = '700 36px "JetBrains Mono"';
  CODE.slice(0, lines).forEach((s, i) => { g.fillStyle = '#5A6278'; g.fillText(String(i + 1).padStart(2), 14, 92 + i * 40); g.fillStyle = col(s); g.fillText(s, 76, 92 + i * 40); });
  if (blink) { const i = Math.min(lines, CODE.length) - 1, w = g.measureText(CODE[i] || '').width; g.fillStyle = '#8FD16A'; g.fillRect(80 + w, 64 + i * 40, 18, 34); }
  codeCache.set(key, c);
  return c;
}

// engine evaluation bar (white share from the bottom), value in pawns from White's view
export function evalBar(g, x, y, w, h, v, { a = 1, flip = false, label = true } = {}) {
  if (a <= 0) return;
  const share = clamp(0.5 + Math.atan(v / 3) / Math.PI, 0.03, 0.97);
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#2A2A2A'; g.fillRect(x, y, w, h);
  g.fillStyle = '#F2F0EA'; const wh = h * share;
  if (flip) g.fillRect(x, y, w, wh); else g.fillRect(x, y + h - wh, w, wh);
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
  if (!label) { g.restore(); return; }
  g.font = '800 26px Rubik'; g.textAlign = 'center'; g.fillStyle = v >= 0 ? '#2A2A2A' : '#F2F0EA';
  const txt = (v > 0 ? '+' : '') + v.toFixed(1);
  g.fillText(txt, x + w / 2, v >= 0 !== flip ? y + h - 14 : y + 32);
  g.restore();
}

// chat messages rising in a column (stream chat)
const CHAT = [['alien_fan', 'ALIEN GAMBIT LETS GO'], ['caro_kann_main', 'knight sac?? again??'], ['blitz_goblin', 'NO WAY'], ['pawnstorm', 'he did it again lol'], ['gm_wannabe', 'engine says -2 lmao'], ['f7_enjoyer', 'Nxf7!!!'], ['chesskid99', 'GG'], ['night_owl', 'how is this working']];
export function chat(g, x, y, t, t0, { n = 6, a = 1, w = 420, lines = CHAT } = {}) {
  if (a <= 0 || t < t0) return;
  const k = (t - t0) * 3.2;
  g.save(); g.globalAlpha *= a; g.font = '700 24px Rubik';
  for (let i = 0; i < n; i++) {
    const j = Math.floor(k) - i; if (j < 0) continue;
    const [u, m] = lines[j % lines.length], yy = y - i * 64 - (k % 1) * 64 * (i === 0 ? 0 : 1);
    const al = clamp(1 - i / n) * (i === 0 ? clamp((k % 1) * 4) : 1);
    g.globalAlpha = a * al; g.fillStyle = 'rgba(14,12,22,0.82)'; g.beginPath(); g.roundRect(x, yy - 40, w, 52, 10); g.fill();
    g.fillStyle = ['#B48CFF', '#8FD16A', '#E9B654', '#7AA6D6'][j % 4]; g.fillText(u + ':', x + 14, yy - 6);
    const uw = g.measureText(u + ': ').width; g.fillStyle = '#F2EEE8'; g.fillText(m, x + 14 + uw, yy - 6);
  }
  g.restore();
}

// webcam panel of a stream overlay: a character in front of a soft backdrop, name strip underneath
export function webcam(g, x, y, w, h, who, e, t, { bg = ['#2A2440', '#120F1E'], name = '', nameColor = C.cream, zoom = 1, shake = 0, gray = 0, cy = 0.5 } = {}) {
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 14); g.clip();
  const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(x, y, w, h);
  if (gray > 0) g.filter = `grayscale(${gray})`;
  const sx = Math.sin(t * 47) * shake * 8, sy = Math.cos(t * 53) * shake * 6;
  drawChar(g, who, { x: x + w / 2 + sx, y: y + h * cy + sy, s: (h / 520) * zoom, e: typeof e === 'string' ? EXPR[e] : e, t });
  g.filter = 'none';
  g.restore();
  g.save(); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 4; g.beginPath(); g.roundRect(x, y, w, h, 14); g.stroke();
  if (name) { g.font = '900 26px Rubik'; g.letterSpacing = '3px'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,8,14,0.85)'; g.fillRect(x, y + h - 44, w, 44); g.fillStyle = nameColor; g.fillText(name, x + w / 2, y + h - 13); }
  g.restore();
}

// trophy cup sprite
export function trophy(g, x, y, s, { a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const gr = g.createLinearGradient(-60, 0, 60, 0); gr.addColorStop(0, '#FFE08A'); gr.addColorStop(0.5, '#E2A93A'); gr.addColorStop(1, '#9A6A1A');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-60, -170); g.lineTo(60, -170); g.bezierCurveTo(60, -90, 30, -70, 12, -64); g.lineTo(12, -30); g.lineTo(40, -14); g.lineTo(40, 0); g.lineTo(-40, 0); g.lineTo(-40, -14); g.lineTo(-12, -30); g.lineTo(-12, -64); g.bezierCurveTo(-30, -70, -60, -90, -60, -170); g.fill();
  g.strokeStyle = '#C99236'; g.lineWidth = 10; for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * 66, -130, 26, sd > 0 ? -1.6 : 1.6 - Math.PI, sd > 0 ? 1.6 : -1.6 - Math.PI, sd < 0); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-36, -160, 10, 80);
  g.restore();
}
