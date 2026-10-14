// One-off cinematic chess edit (not part of the episode engine): Tal vs Hecht, Varna Olympiad 1962, cut to the beat of the
// Skyfall clip from the reference edit. A WebGL plane carries the board (perspective, depth blur, distance fog); the 2D layer
// adds fog, light, lasers, sparks, lightning, fire, the moon, giant piece silhouettes, text, bloom and grain.
// Engine modules are only imported (piece sprites, shatter fx); nothing in engine/ is changed.
import { drawPiece, sprite, spriteBox } from '../../engine/js/pieces.js';
import { shatterImage } from '../../engine/js/fx.js';

const W = 1080, H = 1920;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b, e = x => x) => e(clamp((t - a) / (b - a)));
const E = { out: u => 1 - (1 - u) ** 3, inOut: u => u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2, in: u => u ** 3, back: u => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2 };
const rng = s => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

const PLIES = await fetch('data/hecht.json').then(r => r.json());
await document.fonts.ready;
for (const f of ['800 40px Rubik', '900 40px Rubik', '700 40px Cinzel', '800 40px Cinzel', '800 40px "JetBrains Mono"']) await document.fonts.load(f);

// ---------------------------------------------------------------- timeline (seconds in the Skyfall clip)
const DURATION = 68.4;
const T = {};
for (let k = 1; k <= 32; k++) T[k] = 7.05 + (k - 1) * 0.205;           // opening, fast
Object.assign(T, { 33: 14.0, 34: 15.51, 35: 16.7, 36: 18.16, 37: 25.26, 38: 26.82, 39: 28.37, 40: 29.54, 41: 32.28, 42: 33.83, 43: 35.39, 44: 36.97, 45: 38.48, 46: 39.66, 47: 41.42, 48: 42.82, 49: 45.51, 50: 47.09, 51: 48.65 });
for (let k = 52; k <= 96; k++) T[k] = 51.73 + (k - 52) * 0.13;          // the rest, fast-forward
const BRILL = [33, 35, 37, 41, 47, 49];                                   // Tal leaves material en prise, Stockfish approves
const DROPS = [14.0, 25.26, 41.42, 51.73];
const HITS = [0.07, 3.37, 6.95, 14.0, 16.7, 18.16, 20.18, 23.31, 25.26, 26.82, 28.37, 32.28, 35.39, 38.48, 41.42, 45.51, 47.09, 49.81, 51.73, 57.79, 62.21];
const plyAt = t => { let k = 0; for (let i = 1; i < PLIES.length; i++) if (T[i] != null && t >= T[i]) k = i; return k; };
const dur = k => (k <= 32 || k >= 52 ? 0.11 : 0.3);

// ---------------------------------------------------------------- textures made once
const fogTex = (seed, n = 70) => { const c = mk(1024, 1024), g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < n; i++) { const x = r() * 1024, y = r() * 1024, rad = 90 + r() * 320, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(255,255,255,${0.05 + r() * 0.12})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024); }
  return c; };
const FOG = [fogTex(3), fogTex(11), fogTex(29, 50)];
const GRAIN = [0, 1, 2, 3].map(s => { const c = mk(540, 960), g = c.getContext('2d'), d = g.createImageData(540, 960), r = rng(7 + s * 13);
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });
const MOON = (() => { const c = mk(900, 900), g = c.getContext('2d'), r = rng(5);
  const gr = g.createRadialGradient(400, 380, 40, 450, 450, 440); gr.addColorStop(0, '#F2F0FA'); gr.addColorStop(0.7, '#C9C6D8'); gr.addColorStop(1, '#8E8AA4');
  g.fillStyle = gr; g.beginPath(); g.arc(450, 450, 440, 0, 7); g.fill(); g.save(); g.clip();
  g.filter = 'blur(6px)'; for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,66,92,${0.06 + r() * 0.12})`; g.beginPath(); g.arc(r() * 900, r() * 900, 20 + r() * 110, 0, 7); g.fill(); }
  g.filter = 'none'; g.restore(); return c; })();
// board base: squares with a faint grain, a dark frame; 1024 px, frame 64, square 112
const SQ = 112, M0 = 64;
const BOARD = (() => { const c = mk(1024, 1024), g = c.getContext('2d'), r = rng(17);
  g.fillStyle = '#121215'; g.fillRect(0, 0, 1024, 1024);
  for (let f = 0; f < 8; f++) for (let k = 0; k < 8; k++) { g.fillStyle = (f + k) % 2 ? '#5C5C63' : '#323238'; g.fillRect(M0 + f * SQ, M0 + k * SQ, SQ, SQ); }
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},255,0.025)`; g.fillRect(M0 + r() * 896, M0 + r() * 896, 2, 2); }
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 3; g.strokeRect(M0 - 2, M0 - 2, 900, 900);
  return c; })();
const sqPx = sq => [M0 + (sq.charCodeAt(0) - 97 + 0.5) * SQ, M0 + (7 - (+sq[1] - 1) + 0.5) * SQ];
const sqPlane = sq => { const [x, y] = sqPx(sq); return [x / 512 - 1, 1 - y / 512]; };

// ---------------------------------------------------------------- WebGL board plane
const glc = mk(W, H), gl = glc.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: true });
const prog = (() => {
  const VS = `#version 300 es
  in vec3 p; in vec2 uv; uniform mat4 M; out vec2 v; out float w;
  void main(){ vec4 c = M * vec4(p, 1.0); gl_Position = c; v = uv; w = c.w; }`;
  const FS = `#version 300 es
  precision highp float; uniform sampler2D T; uniform float focus, dof, fogA; uniform vec3 fogC; in vec2 v; in float w; out vec4 o;
  void main(){ float b = clamp(abs(w - focus) * dof, 0.0, 4.5); vec4 c = texture(T, v, b); float f = clamp((w - focus) * fogA, 0.0, 0.85);
    o = vec4(mix(c.rgb, fogC, f), c.a); }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p); gl.useProgram(p);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 1, 1, -1, 0, 1, 1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 0]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(p, 'p'), lu = gl.getAttribLocation(p, 'uv');
  gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 20, 12);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { p, U: Object.fromEntries(['M', 'T', 'focus', 'dof', 'fogA', 'fogC'].map(k => [k, gl.getUniformLocation(p, k)])) };
})();
const M4 = {
  mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
  persp(fy, asp, n, f) { const t = 1 / Math.tan(fy / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); },
  tr(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); },
  rx(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
  rz(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
};
let MAT = null;
function camera({ dist = 3, tilt = -0.6, spin = 0, px = 0, py = 0, fov = 0.75 }) {
  const V = M4.mul(M4.tr(0, 0, -dist), M4.mul(M4.rx(tilt), M4.mul(M4.rz(spin), M4.tr(-px, -py, 0))));
  MAT = M4.mul(M4.persp(fov, W / H, 0.05, 50), V); return MAT;
}
const proj = (x, y, z = 0) => { const m = MAT, cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  return { x: (cx / cw * 0.5 + 0.5) * W, y: (0.5 - cy / cw * 0.5) * H, s: 1 / cw, w: cw }; };
const projSq = (sq, z = 0) => { const [x, y] = sqPlane(sq); return proj(x, y, z); };
function drawPlane(texCanvas, cam, { dof = 1.1, fogA = 0.45, fogC = [0.04, 0.04, 0.05] } = {}) {
  camera(cam);
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas); gl.generateMipmap(gl.TEXTURE_2D);
  gl.uniformMatrix4fv(prog.U.M, false, MAT); gl.uniform1i(prog.U.T, 0);
  gl.uniform1f(prog.U.focus, cam.dist); gl.uniform1f(prog.U.dof, dof); gl.uniform1f(prog.U.fogA, fogA); gl.uniform3f(prog.U.fogC, ...fogC);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ---------------------------------------------------------------- the board texture for a moment t
const TEX = mk(1024, 1024), tg = TEX.getContext('2d');
function boardState(t) {
  const k = plyAt(t), cur = PLIES[k], prev = PLIES[Math.max(0, k - 1)];
  if (k === 0) return { k, pieces: cur.pieces.map(p => ({ ...p, pos: sqPx(p.sq) })), mover: null };
  const u = E.inOut(seg(t, T[k], T[k] + dur(k)));
  const mover = cur.pieces.find(p => p.sq === cur.to);
  const pieces = cur.pieces.map(p => { let pos = sqPx(p.sq);
    if (mover && p.id === mover.id && u < 1) { const a = sqPx(cur.from), b = pos; pos = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; }
    return { ...p, pos }; });
  const capId = prev.pieces.map(p => p.id).find(id => !cur.pieces.some(q => q.id === id));
  const cap = capId ? prev.pieces.find(p => p.id === capId) : null;
  if (cap && u < 1) pieces.unshift({ ...cap, pos: sqPx(cap.sq), fade: 1 - u });
  return { k, pieces, mover, cap, u, from: cur.from, to: cur.to };
}
function fillSq(sq, col, a) { const [x, y] = sqPx(sq); tg.fillStyle = rgba(col, a); tg.fillRect(x - SQ / 2, y - SQ / 2, SQ, SQ); }
function laserTex(a, b, col, w = 26, alpha = 1) {
  const [x0, y0] = sqPx(a), [x1, y1] = sqPx(b);
  tg.save(); tg.lineCap = 'round'; tg.globalAlpha = alpha;
  tg.strokeStyle = rgba(col, 0.35); tg.lineWidth = w * 2.4; tg.beginPath(); tg.moveTo(x0, y0); tg.lineTo(x1, y1); tg.stroke();
  tg.strokeStyle = rgba(col, 0.9); tg.lineWidth = w; tg.stroke(); tg.strokeStyle = '#FFFFFF'; tg.lineWidth = w * 0.25; tg.stroke(); tg.restore();
}
function drawBoardTex(t, { extra = null } = {}) {
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = 1; tg.drawImage(BOARD, 0, 0);
  const st = boardState(t), k = st.k;
  if (k > 0 && T[k] != null) {
    const brill = BRILL.includes(k), age = t - T[k];
    const col = brill ? '#1BADA6' : k % 2 ? '#C9A45A' : '#B8483E';
    fillSq(st.from, col, 0.35); fillSq(st.to, col, brill ? 0.55 + 0.25 * Math.max(0, 1 - age / 0.6) : 0.45);
  }
  if (extra) extra(tg, t, st);
  for (const p of st.pieces) {
    tg.save(); if (p.fade != null) tg.globalAlpha = p.fade;
    drawPiece(tg, p.t, p.c, p.pos[0], p.pos[1] + SQ * 0.4, SQ * 0.9); tg.restore();
  }
  return st;
}

// ---------------------------------------------------------------- 2D effects
function fogLayers(g, t, { a = 0.5, tint = '#B8C0D8', y = 0 } = {}) {
  a *= 0.55;
  g.save(); g.globalCompositeOperation = 'screen';
  FOG.forEach((f, i) => { const sp = [14, -22, 9][i], s = [2.6, 2.1, 3.2][i], x = ((t * sp * (i + 1)) % (1024 * s)) - 1024 * s * 0.25;
    g.globalAlpha = a * [0.55, 0.4, 0.35][i]; g.drawImage(f, x - 300, y - 400 + i * 300, 1024 * s, 1024 * s); g.drawImage(f, x - 300 - 1024 * s, y - 400 + i * 300, 1024 * s, 1024 * s); });
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 1; g.fillStyle = tint; g.fillRect(0, 0, 0, 0);
  g.restore();
}
function bg(g, top = '#141419', bot = '#050507') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
function sparks(g, x, y, t, t0, { n = 40, col = '#FFD7C8', speed = 700, life = 0.9, seed = 1, size = 4 } = {}) {
  const dt = t - t0; if (dt < 0 || dt > life) return; const r = rng(seed * 97 + 3);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const a = r() * 6.283, v = speed * (0.3 + r() * 0.9), px = x + Math.cos(a) * v * dt, py = y + Math.sin(a) * v * dt + 500 * dt * dt, al = 1 - dt / life;
    g.fillStyle = rgba(col, al); g.beginPath(); g.arc(px, py, size * (0.5 + r()), 0, 7); g.fill(); }
  g.restore();
}
function embers(g, t, { n = 60, col = '#FF7A5A', a = 0.8, seed = 4, rise = 120 } = {}) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x0 = r() * W, sp = rise * (0.5 + r()), ph = r() * 20, y = H - ((t * sp + ph * 100) % (H + 200)), x = x0 + Math.sin(t * (0.5 + r()) + i) * 40, s = 1 + r() * 3;
    g.fillStyle = rgba(col, a * (0.3 + r() * 0.7)); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  g.restore();
}
function bolt(g, x0, y0, x1, y1, seed, { col = '#9FB4FF', w = 4, depth = 6, spread = 0.35 } = {}) {
  const r = rng(seed); let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) { const n = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    n.push(pts[i], [(ax + bx) / 2 + (r() - 0.5) * L * spread * (-(by - ay) / L) * 2, (ay + by) / 2 + (r() - 0.5) * L * spread * ((bx - ax) / L) * 2]); } n.push(pts[pts.length - 1]); pts = n; }
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [lw, c] of [[w * 6, rgba(col, 0.12)], [w * 2.5, rgba(col, 0.45)], [w, '#FFFFFF']]) { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
  g.restore();
}
const mixDark = d => { const v = Math.round(20 + d * 60); return `rgb(${v},${v},${v + 6})`; };
// big piece silhouette: tinted copy cached per (type, color, tint)
const sil = new Map();
function silhouette(type, color, tint) {
  const key = type + color + tint; if (sil.has(key)) return sil.get(key);
  const src = sprite(type, color), c = mk(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height);
  sil.set(key, c); return c;
}
function bigPiece(g, type, color, x, y, h, { glow = '#9FB4FF', glowA = 0.8, dark = 0.35, rim = 0.6, rot = 0 } = {}) {
  const b = spriteBox(h), src = sprite(type, color);
  g.save(); g.translate(x, y); g.rotate(rot);
  if (glowA > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = glowA; g.filter = `blur(${(h * 0.05).toFixed(0)}px)`;
    g.drawImage(silhouette(type, color, glow), -b.w / 2 * 1.06, b.top * 1.06, b.w * 1.06, b.h * 1.06); g.restore(); }
  if (rim > 0) { g.save(); g.globalAlpha = rim; g.drawImage(silhouette(type, color, glow), -b.w / 2 - h * 0.014, b.top - h * 0.012, b.w, b.h); g.restore(); }
  g.drawImage(silhouette(type, color, mixDark(dark)), -b.w / 2, b.top, b.w, b.h);
  g.save(); g.globalAlpha = 0.5; g.globalCompositeOperation = 'source-atop'; g.filter = `brightness(${dark * 1.6})`; g.drawImage(src, -b.w / 2, b.top, b.w, b.h); g.restore();
  g.restore();
}
function fire(g, x, y, w, h, t, { col1 = '#FF5A3A', col2 = '#FFC08A', n = 140, seed = 9 } = {}) {
  const r = rng(seed); g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const life = 0.8 + r() * 0.8, ph = r() * life, a0 = (t + ph) % life / life, px = x + (r() - 0.5) * w * (1 - a0 * 0.5) + Math.sin(t * 6 + i) * 12, py = y - a0 * h * (0.6 + r() * 0.6), s = (1 - a0) * (18 + r() * 30);
    const gr = g.createRadialGradient(px, py, 0, px, py, s); gr.addColorStop(0, rgba(a0 < 0.4 ? col2 : col1, 0.55 * (1 - a0))); gr.addColorStop(1, rgba(col1, 0)); g.fillStyle = gr; g.fillRect(px - s, py - s, s * 2, s * 2); }
  g.restore();
}
function rays(g, x, y, t, { n = 14, col = '#FFFFFF', a = 0.12, len = 2200, width = 0.08 } = {}) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y);
  for (let i = 0; i < n; i++) { const ang = i / n * 6.283 + t * 0.05, wv = width * (0.6 + 0.4 * Math.sin(t * 1.7 + i * 3)); const gr = g.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ang - wv) * len, Math.sin(ang - wv) * len); g.lineTo(Math.cos(ang + wv) * len, Math.sin(ang + wv) * len); g.closePath(); g.fill(); }
  g.restore();
}
function brill(g, x, y, r, a = 1) {  // "!!" badge
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.translate(x, y);
  g.shadowColor = 'rgba(27,173,166,0.8)'; g.shadowBlur = r * 0.8; g.fillStyle = '#1BADA6'; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#FFFFFF'; for (const sd of [-1, 1]) { const xx = sd * r * 0.24; g.beginPath(); g.moveTo(xx - r * 0.11, -r * 0.56); g.lineTo(xx + r * 0.11, -r * 0.56); g.lineTo(xx + r * 0.07, r * 0.16); g.lineTo(xx - r * 0.07, r * 0.16); g.closePath(); g.fill(); g.beginPath(); g.arc(xx, r * 0.42, r * 0.1, 0, 7); g.fill(); }
  g.restore();
}
function title(g, txt, y, { size = 70, font = 'Cinzel', w = 800, col = '#F2EEE6', a = 1, spacing = 10, glow = 0.5 } = {}) {
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${w} ${size}px ${font}`; g.letterSpacing = spacing + 'px';
  g.shadowColor = `rgba(255,255,255,${glow * 0.6})`; g.shadowBlur = size * 0.5; g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore();
}
const counter = (g, t, a = 1) => {  // "!! x n" in the corner during the game
  const n = BRILL.filter(k => t >= T[k]).length; if (!n || a <= 0) return;
  const lastK = BRILL.filter(k => t >= T[k]).pop(), pop = 1 + 0.5 * Math.max(0, 1 - (t - T[lastK]) / 0.3);
  g.save(); g.globalAlpha = a; brill(g, 110, 150, 46 * pop); g.font = '900 64px Rubik'; g.textBaseline = 'middle'; g.fillStyle = '#F2EEE6'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 10;
  g.fillText('× ' + n, 172, 154); g.restore();
};

// ---------------------------------------------------------------- shots
const LAYER = mk(), L = LAYER.getContext('2d');
const board = (g, t, cam, opts = {}) => { const st = drawBoardTex(t, opts); drawPlane(TEX, cam, opts.gl || {}); g.drawImage(glc, 0, 0); return st; };
const camLerp = (t, a, b, keys) => { const u = seg(t, a, b, E.inOut), A = keys[0], B = keys[1]; const o = {}; for (const k of Object.keys(A)) o[k] = lerp(A[k], B[k] ?? A[k], u); return o; };
const brillFx = (g, t, k, { r = 70 } = {}) => {  // !! badge, sparks and a ring on Tal's sacrifices
  if (!BRILL.includes(k) || t < T[k]) return; const p = projSq(PLIES[k].to), age = t - T[k];
  sparks(g, p.x, p.y, t, T[k] + 0.12, { n: 50, col: '#9FFFF6', speed: 900, seed: k });
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba('#1BADA6', Math.max(0, 1 - age / 0.6)); g.lineWidth = 10; g.beginPath(); g.ellipse(p.x, p.y, 40 + age * 600, (40 + age * 600) * 0.55, 0, 0, 7); g.stroke(); g.restore();
  brill(g, p.x + 60, p.y - 90, r * lerp(1.6, 1, seg(t, T[k], T[k] + 0.25, E.back)), seg(t, T[k], T[k] + 0.08));
};
const caption = (g, txt, t, t0, t1, { y = 1500, size = 64, col = '#F2EEE6' } = {}) => {
  const a = seg(t, t0, t0 + 0.15) * (1 - seg(t, t1 - 0.2, t1)); if (a <= 0) return;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${size}px Rubik`; g.letterSpacing = '6px';
  g.lineWidth = 12; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,0.65)'; g.strokeText(txt, W / 2, y); g.fillStyle = col; g.fillText(txt, W / 2, y); g.restore();
};

const SHOTS = [
  // hook: the queen sacrifice position, lasers and the !! from the first frame
  [0, 3.37, (g, t) => {
    bg(g); const cam = camLerp(t, 0, 3.37, [{ dist: 3.1, tilt: -0.75, spin: 0.35, px: 0.1, py: -0.1 }, { dist: 2.7, tilt: -0.7, spin: 0.25 }]);
    board(g, 26.0, cam, { extra: (tg) => { laserTex('b5', 'a4', '#E0403A', 22, 0.6 + 0.4 * Math.sin(t * 9)); fillSq('a4', '#E0403A', 0.6); fillSq('f6', '#1BADA6', 0.65); } });
    fogLayers(g, t, { a: 0.45 });
    const p = projSq('f6'); brill(g, p.x + 50, p.y - 80, 60);
    title(g, '6 SACRIFICES.', 300, { font: 'Rubik', w: 900, size: 104, spacing: 6, glow: 0.3 });
    title(g, '1 GAME.', 420, { font: 'Rubik', w: 900, size: 104, spacing: 6, col: '#1BADA6', glow: 0.3 });
  }],
  // the moon, a dark knight, the name
  [3.37, 6.95, (g, t) => {
    bg(g, '#0E1018', '#030306'); const u = seg(t, 3.37, 6.95);
    g.save(); g.globalAlpha = 0.9; g.drawImage(MOON, W / 2 - 430 + u * 20, 420 - u * 30, 860, 860); g.restore();
    fogLayers(g, t * 2, { a: 0.6, y: 300 });
    bigPiece(g, 'n', 'b', W / 2 - 20, 1250 + (1 - u) * 60, 980 + u * 80, { glow: '#B8C8FF', glowA: 0.5, dark: 0.12, rim: 0.9 });
    fogLayers(g, t * 3 + 7, { a: 0.35, y: 900 });
    title(g, 'MIKHAIL TAL', 1440, { size: 92, a: seg(t, 3.6, 4.2), spacing: 14 });
    title(g, 'vs HECHT · VARNA 1962', 1540, { font: 'Rubik', w: 800, size: 34, a: seg(t, 4.6, 5.2), spacing: 10, col: '#B8C0D8', glow: 0.2 });
  }],
  // the opening, fast
  [6.95, 13.96, (g, t) => {
    bg(g); const cam = camLerp(t, 6.95, 13.96, [{ dist: 4.6, tilt: -0.5, spin: -0.5, px: 0, py: 0.2 }, { dist: 2.9, tilt: -0.72, spin: -0.15, px: -0.15, py: -0.05 }]);
    board(g, t, cam); fogLayers(g, t, { a: 0.5 }); embers(g, t, { n: 40, col: '#C8D0FF', a: 0.5 });
    const k = plyAt(t); if (k > 0) { const n = Math.ceil(k / 2); caption(g, `MOVE ${n}`, t, 7.0, 13.9, { y: 260, size: 52 }); }
  }],
  // drop 1: 17.Nc4!! and 18.e5!!, then 18...b5 hits the queen
  [13.96, 20.18, (g, t) => {
    bg(g, '#1A1012', '#060304');
    const cam = t < 16.65 ? camLerp(t, 13.96, 16.65, [{ dist: 2.0, tilt: -0.82, spin: 0.2, px: -0.35, py: -0.1 }, { dist: 1.8, tilt: -0.8, spin: 0.3, px: -0.3, py: -0.05 }])
      : t < 18.1 ? camLerp(t, 16.65, 18.1, [{ dist: 2.1, tilt: -0.7, spin: -0.25, px: 0.1, py: 0.05 }, { dist: 1.9, tilt: -0.72, spin: -0.2, px: 0.05, py: 0.05 }])
        : camLerp(t, 18.1, 20.18, [{ dist: 2.3, tilt: -0.8, spin: 0.5, px: -0.6, py: 0.15 }, { dist: 1.6, tilt: -0.85, spin: 0.55, px: -0.75, py: 0.15 }]);
    board(g, t, cam, { extra: (tg, tt) => { if (tt > T[36] + 0.2) { laserTex('b5', 'a4', '#E0403A', 22, seg(tt, T[36] + 0.2, T[36] + 0.5)); fillSq('a4', '#E0403A', 0.4 + 0.25 * Math.sin(tt * 10)); } } });
    fogLayers(g, t, { a: 0.4 }); embers(g, t, { col: '#FF8A6A' });
    for (const k of [33, 35]) brillFx(g, t, k);
    caption(g, 'HIS QUEEN IS ATTACKED', t, T[36] + 0.3, 20.18, { col: '#FF6B5A' });
    counter(g, t);
  }],
  // the queen under attack: slow push, red pulse
  [20.18, 23.31, (g, t) => {
    bg(g, '#120A0C', '#040203'); const cam = camLerp(t, 20.18, 23.31, [{ dist: 1.5, tilt: -0.55, spin: 0.7, px: -0.8, py: 0.2 }, { dist: 1.1, tilt: -0.5, spin: 0.75, px: -0.85, py: 0.2 }]);
    board(g, t, cam, { extra: (tg, tt) => { laserTex('b5', 'a4', '#E0403A', 22, 0.7 + 0.3 * Math.sin(tt * 6)); fillSq('a4', '#E0403A', 0.45 + 0.25 * Math.sin(tt * 6)); }, gl: { dof: 1.8 } });
    fogLayers(g, t, { a: 0.55 });
    caption(g, 'TAL DOES NOT CARE.', t, 21.4, 23.31);
    counter(g, t);
  }],
  // the e5 pawn in blue lightning, the moment before
  [23.31, 25.26, (g, t) => {
    bg(g, '#0A0C16', '#020208'); fogLayers(g, t * 2, { a: 0.5, y: 200 });
    const cx = W / 2, cy = 1150, f = Math.floor(t * 15);
    for (let i = 0; i < 5; i++) bolt(g, cx + (i - 2) * 140, 200, cx + (i - 2) * 30, cy - 300, f * 7 + i, { w: 3 + (i % 2) * 2 });
    rays(g, cx, cy - 300, t, { col: '#9FB4FF', a: 0.08 });
    bigPiece(g, 'p', 'w', cx, cy + 200, 880 + seg(t, 23.31, 25.26) * 120, { glow: '#9FB4FF', glowA: 0.9, dark: 0.55, rim: 1 });
    caption(g, 'e5', t, 23.4, 25.26, { y: 300, size: 90 });
  }],
  // drop 2: 19.exf6!! — the queen falls — 20.fxg7, 20...Rg8
  [25.26, 29.95, (g, t) => {
    bg(g, '#1A0A0A', '#060202');
    const cam = t < 26.75 ? camLerp(t, 25.26, 26.75, [{ dist: 1.7, tilt: -0.8, spin: -0.3, px: 0.4, py: 0.25 }, { dist: 1.5, tilt: -0.82, spin: -0.25, px: 0.4, py: 0.25 }])
      : t < 28.3 ? camLerp(t, 26.75, 28.3, [{ dist: 1.6, tilt: -0.75, spin: 0.6, px: -0.75, py: 0.2 }, { dist: 2.0, tilt: -0.78, spin: 0.5, px: -0.6, py: 0.15 }])
        : camLerp(t, 28.3, 29.95, [{ dist: 2.0, tilt: -0.7, spin: -0.5, px: 0.5, py: 0.4 }, { dist: 1.7, tilt: -0.72, spin: -0.45, px: 0.55, py: 0.45 }]);
    const st = board(g, t, cam);
    fogLayers(g, t, { a: 0.4 });
    if (t < 26.75) { const p = projSq('f6'); for (let i = 0; i < 4; i++) bolt(g, p.x + (i - 1.5) * 120, -50, p.x, p.y, Math.floor(t * 15) * 5 + i, { w: 3 }); }
    brillFx(g, t, 37, { r: 80 });
    if (t >= T[38] + 0.2 && t < T[38] + 1.3) {  // the queen shatters
      const p = projSq('a4'), h = SQ * 0.9 * p.s * 2.2, b = spriteBox(h);
      shatterImage(g, sprite('q', 'w'), p.x - b.w / 2, p.y + b.top + h * 0.4, b.w, b.h, t - T[38] - 0.2, { cols: 3, rows: 5, seed: 38, power: 900, gravity: 1800, spin: 8, life: 1.1 });
      sparks(g, p.x, p.y, t, T[38] + 0.2, { n: 70, col: '#FF8A6A', speed: 1100, seed: 38 });
    }
    if (t > T[39]) { const p = projSq('g7'); fire(g, p.x, p.y + 20, 90, 260, t, { n: 70 }); }
    caption(g, 'QUEEN SACRIFICE', t, T[38] + 0.15, 29.9, { col: '#FF6B5A', size: 76 });
    counter(g, t);
  }],
  // the g7 pawn in red fire
  [29.95, 32.28, (g, t) => {
    bg(g, '#1A0606', '#050101'); fogLayers(g, t * 2, { a: 0.45, y: 300 });
    fire(g, W / 2, 1500, 520, 1100, t, { n: 220 });
    bigPiece(g, 'p', 'w', W / 2, 1520, 860 + seg(t, 29.95, 32.28) * 90, { glow: '#FF5A3A', glowA: 0.9, dark: 0.45, rim: 1 });
    fire(g, W / 2, 1600, 380, 600, t + 3, { n: 90, seed: 4 });
    caption(g, 'ONE STEP FROM A NEW QUEEN', t, 30.1, 32.28, { y: 300, size: 50 });
  }],
  // 21.Bf5!! hunts the queen, 22.Bxe6 takes it back, 23.Nd6+, 23...Ke7
  [32.28, 41.42, (g, t) => {
    bg(g, '#14100E', '#040303');
    const cam = t < 35.3 ? camLerp(t, 32.28, 35.3, [{ dist: 2.2, tilt: -0.85, spin: 0.15, px: 0.2, py: 0.15 }, { dist: 1.8, tilt: -0.85, spin: 0.25, px: 0.15, py: 0.2 }])
      : t < 38.4 ? camLerp(t, 35.3, 38.4, [{ dist: 2.4, tilt: -0.7, spin: -0.6, px: 0.0, py: 0.3 }, { dist: 2.0, tilt: -0.75, spin: -0.5, px: 0.05, py: 0.35 }])
        : camLerp(t, 38.4, 41.42, [{ dist: 1.6, tilt: -0.6, spin: 0.4, px: 0.1, py: 0.5 }, { dist: 1.2, tilt: -0.55, spin: 0.45, px: 0.15, py: 0.55 }]);
    board(g, t, cam, { extra: (tg, tt, st) => {
      if (tt > T[41] + 0.2 && tt < T[43]) { laserTex('f5', 'e6', '#E0403A', 22, seg(tt, T[41] + 0.2, T[41] + 0.4)); fillSq('e6', '#E0403A', 0.5); }
      if (tt > T[45] && tt < T[46] + 0.6) fillSq('e8', '#E0403A', 0.5 + 0.3 * Math.sin(tt * 12));
    } });
    fogLayers(g, t, { a: 0.4 }); embers(g, t, { col: '#FFB27A', n: 40 });
    brillFx(g, t, 41);
    caption(g, 'QUEEN TAKEN BACK', t, T[43] + 0.15, T[44] + 1.2, { col: '#E9B654' });
    caption(g, 'CHECK', t, T[45] + 0.05, T[46], { col: '#FF6B5A', size: 90 });
    counter(g, t);
  }],
  // drop 3: 24.Bc4!!, 24...Rxg7, 25.g3!! (the knight is left hanging), 25...Kxd6, 26.Bxa6
  [41.42, 48.9, (g, t) => {
    bg(g, '#100E16', '#030306');
    const cam = t < 45.4 ? camLerp(t, 41.42, 45.4, [{ dist: 2.4, tilt: -0.85, spin: -0.35, px: 0.0, py: 0.25 }, { dist: 2.0, tilt: -0.82, spin: -0.2, px: 0.1, py: 0.2 }])
      : camLerp(t, 45.4, 48.9, [{ dist: 1.7, tilt: -0.7, spin: 0.5, px: 0.3, py: 0.0 }, { dist: 2.3, tilt: -0.8, spin: 0.2, px: 0.0, py: 0.2 }]);
    board(g, t, cam, { extra: (tg, tt) => { if (tt > T[49] && tt < T[50]) { fillSq('d6', '#E0403A', 0.45 + 0.25 * Math.sin(tt * 10)); laserTex('e7', 'd6', '#E0403A', 18, 0.8); } } });
    fogLayers(g, t, { a: 0.45 }); embers(g, t, { col: '#B8C8FF', n: 50 });
    for (const k of [47, 49]) brillFx(g, t, k, { r: 80 });
    if (t > T[49] && t < T[49] + 0.5) { const p = projSq('g3'); for (let i = 0; i < 3; i++) bolt(g, p.x + (i - 1) * 200, -50, p.x, p.y, Math.floor(t * 15) * 3 + i, { w: 3, col: '#9FFFF6' }); }
    caption(g, 'HE GIVES THE KNIGHT TOO', t, T[49] + 0.3, T[50] + 0.4, { size: 56 });
    counter(g, t);
  }],
  // at skyfall: the giant knight before the moon, beams
  [48.9, 51.73, (g, t) => {
    bg(g, '#120A10', '#040205'); const u = seg(t, 48.9, 51.73);
    rays(g, W / 2, 760, t, { col: '#FF9A8A', a: 0.1 });
    g.save(); g.drawImage(MOON, W / 2 - 470, 300 - u * 40, 940, 940); g.restore();
    fogLayers(g, t * 2, { a: 0.55, y: 200 });
    bigPiece(g, 'n', 'w', W / 2 + 30, 1500 + (1 - u) * 80, 1150 + u * 120, { glow: '#FF8A7A', glowA: 0.6, dark: 0.18, rim: 1 });
    g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0); gr.addColorStop(0, 'rgba(255,60,50,0)'); gr.addColorStop(0.5, `rgba(255,90,70,${0.5 * u})`); gr.addColorStop(1, 'rgba(255,60,50,0)'); g.fillStyle = gr; g.fillRect(W / 2 - 40, 0, 80, H); g.restore();
    fogLayers(g, t * 3, { a: 0.3, y: 1000 });
  }],
  // fast-forward to the end
  [51.73, 57.79, (g, t) => {
    bg(g); const u = seg(t, 51.73, 57.79), cam = { dist: lerp(3.2, 2.5, u), tilt: -0.72, spin: lerp(-0.9, 0.4, E.inOut(u)), px: 0, py: 0 };
    board(g, t, cam); fogLayers(g, t, { a: 0.5 }); embers(g, t, { n: 80, col: '#FFD0B0', rise: 400 });
    const k = plyAt(t); caption(g, `MOVE ${Math.ceil(k / 2)}`, t, 51.8, 57.79, { y: 260, size: 52 });
    counter(g, t);
  }],
  // 1-0: the black king goes down in the smoke
  [57.79, 62.21, (g, t) => {
    bg(g, '#0C0C10', '#020203'); const u = seg(t, 57.79, 62.21);
    fogLayers(g, t * 2, { a: 0.55, y: 400 });
    bigPiece(g, 'k', 'b', W / 2 + u * 60, 1620 + E.in(seg(t, 59.0, 61.6)) * 300, 900, { glow: '#FF5A4A', glowA: 0.35, dark: 0.22, rim: 0.7, rot: E.in(seg(t, 58.6, 61.6)) * 1.35 });
    fogLayers(g, t * 3 + 4, { a: 0.4, y: 1100 });
    title(g, '1 – 0', 400, { font: 'Cinzel', size: 190, a: seg(t, 57.85, 58.2), spacing: 10, glow: 0.8 });
    title(g, 'HECHT RESIGNS', 560, { font: 'Rubik', w: 800, size: 40, a: seg(t, 58.6, 59.1), spacing: 12, col: '#C9C2B8', glow: 0.2 });
  }],
  // outro: six badges, the name, follow
  [62.21, DURATION, (g, t) => {
    bg(g, '#0A0A0E', '#020203'); fogLayers(g, t, { a: 0.4 }); embers(g, t, { n: 50, col: '#9FFFF6', a: 0.5, rise: 80 });
    for (let i = 0; i < 6; i++) { const t0 = 62.3 + i * 0.39; brill(g, W / 2 + (i - 2.5) * 150, 820, 58 * lerp(1.6, 1, seg(t, t0, t0 + 0.25, E.back)), seg(t, t0, t0 + 0.08)); }
    title(g, '6 SACRIFICES', 1000, { font: 'Rubik', w: 900, size: 84, a: seg(t, 64.6, 65.0), spacing: 8, glow: 0.3 });
    title(g, 'MIKHAIL TAL · 1962', 1110, { font: 'Cinzel', size: 52, a: seg(t, 65.0, 65.5), spacing: 10, col: '#C9C2B8' });
    title(g, 'FOLLOW FOR MORE', 1420, { font: 'Rubik', w: 800, size: 38, a: seg(t, 65.8, 66.2), spacing: 12, col: '#1BADA6', glow: 0.4 });
    g.save(); g.fillStyle = `rgba(0,0,0,${seg(t, 67.2, DURATION)})`; g.fillRect(0, 0, W, H); g.restore();
  }],
];

// ---------------------------------------------------------------- frame composition: shake, flashes, chroma, bloom, grade, grain
const BLOOM = mk(W >> 2, H >> 2), bctx = BLOOM.getContext('2d');
const COPY = mk(), cctx = COPY.getContext('2d');
const hitAmp = t => { let a = 0; for (const h of HITS) { const d = t - h; if (d >= 0 && d < 0.5) a += Math.exp(-d / 0.12); } return Math.min(a, 1.5); };
const dropAmp = t => { let a = 0; for (const h of DROPS) { const d = t - h; if (d >= 0 && d < 0.6) a = Math.max(a, Math.exp(-d / 0.15)); } return a; };

window.DURATION = DURATION;
window.renderFrame = (t, frame = 0) => {
  const shot = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
  L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.filter = 'none';
  shot[2](L, t);
  // camera: punch-in and shake on the hits
  const h = hitAmp(t), d = dropAmp(t), z = 1 + 0.04 * h + 0.03 * Math.sin(t * 0.7) * 0.3, sx = Math.sin(t * 91) * 14 * h, sy = Math.cos(t * 77) * 12 * h;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  ctx.filter = 'contrast(1.22) brightness(0.88) saturate(0.92)'; ctx.drawImage(LAYER, 0, 0); ctx.filter = 'none';
  if (d > 0.05) {  // chromatic split on the drops
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * d;
    ctx.filter = 'sepia(1) saturate(6) hue-rotate(-40deg) brightness(0.6)'; ctx.drawImage(LAYER, 10 * d, 0);
    ctx.filter = 'sepia(1) saturate(6) hue-rotate(150deg) brightness(0.6)'; ctx.drawImage(LAYER, -10 * d, 0); ctx.filter = 'none';
  }
  ctx.restore();
  // bloom
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalCompositeOperation = 'copy'; bctx.filter = 'brightness(0.62) contrast(4.2) blur(6px)'; bctx.drawImage(cv, 0, 0, W >> 2, H >> 2); bctx.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5; ctx.drawImage(BLOOM, 0, 0, W, H); ctx.restore();
  // flash on the drops
  if (d > 0.02) { ctx.save(); ctx.fillStyle = `rgba(255,240,235,${0.55 * d})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // vignette + grain
  ctx.save(); const vg = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.88)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07; ctx.drawImage(GRAIN[frame % 4], 0, 0, W, H); ctx.restore();
  // fade in from black at the start
  if (t < 0.25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`; ctx.fillRect(0, 0, W, H); }
};
window.READY = true;
