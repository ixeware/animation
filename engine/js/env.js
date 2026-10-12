// 3D sets around the board: a closed room (floor, four walls, ceiling), furniture, framed photos and
// lights, all projected through the board camera so the whole scene parallaxes as the camera flies.
// World units: one board square = 1. Board spans x,z in [0,8] at y=0; the far player sits at z≈9.4,
// the near player at z≈-1.4. The camera must stay inside the room box.
import { W, H, C, rgba, clamp, lerp, mix, rng, makeCanvas } from './core.js';

export const ENV = {
  wood: { base: '#120C08', wall: ['#4A3322', '#3E2A1C'], seam: '#1E140D', rail: '#5C402A', floor: ['#2A1C12', '#22170F'], light: '#FFD9A0', lightA: 0.32,
    frames: true, sconces: true, table: ['#3A2717', '#24180E', '#1A110A'] },
  curtain: { base: '#12060A', wall: ['#8E1E2E', '#5A0F1B'], folds: true, valance: '#C9A05A', floor: ['#1C0C0F', '#150A0C'], light: '#FFC48A', lightA: 0.35, sconces: true },
  gold: { base: '#0E0A04', wall: ['#6A5420', '#45360F'], folds: true, valance: '#F5C451', floor: ['#1E1708', '#171106'], light: '#FFE2A0', lightA: 0.45, sconces: true },
  hall: { base: '#05090E', wall: ['#16263A', '#101C2B'], strips: '#4FA8FF', floor: ['#0C141D', '#09111A'], light: '#A8D4FF', lightA: 0.25 },
  crimson: { base: '#0A0203', wall: ['#5A1418', '#3E0C10'], banners: '#8E1E22', floor: ['#160506', '#100405'], light: '#FF8A7A', lightA: 0.35, star: true },
  backroom: { base: '#030405', wall: ['#1A1D20', '#141618'], floor: ['#0E1012', '#0B0C0E'], light: '#FFF1D6', lightA: 0.2, lamp: true },
  cold: { base: '#05080B', wall: ['#24323C', '#1C2830'], seam: '#121A20', floor: ['#10171C', '#0D1318'], light: '#CFE6FF', lightA: 0.2, windows: true },
  dark: { base: '#020304', wall: ['#0E1215', '#0B0E10'], floor: ['#08090B', '#060708'], light: '#9FB7C9', lightA: 0.07 },
};

export const FLOOR_Y = -3.2, BACK_Z = 13, FRONT_Z = -12, LEFT_X = -9, RIGHT_X = 17, CEIL_Y = 14;

// fade a color toward the room's base with distance from camera (atmospheric depth)
const fogged = (b, env, col, x, y, z) => mix(col, env.base, clamp((b.toCam(x, y, z)[2] - 9) / 26) * 0.85);

function strip(g, b, pts, color) { if (b.poly(g, pts)) { g.fillStyle = color; g.fill(); } }

const SCR = makeCanvas(), sctx = SCR.getContext('2d');

// style: name or env object; over: overrides (e.g. {light: C.red}); blur: background defocus in px
export function room(g, b, style = 'cold', { over = null, lights = null, t = 0, blur = 0 } = {}) {
  const env = { ...(typeof style === 'string' ? ENV[style] : style), ...(over || {}) };
  g.fillStyle = env.base; g.fillRect(0, 0, W, H);
  const d = blur > 0.5 ? sctx : g;
  if (d === sctx) { d.setTransform(1, 0, 0, 1, 0, 0); d.clearRect(0, 0, W, H); d.fillStyle = env.base; d.fillRect(0, 0, W, H); }
  shell(d, b, env, t, lights);
  if (d === sctx) { g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; g.drawImage(SCR, 0, 0); g.restore(); }
  return env;
}

function shell(g, b, env, t, lights) {
  const fz0 = FRONT_Z, fz1 = BACK_Z;
  // floor planks along z, with a light pool under the table
  for (let i = 0, x = LEFT_X; x < RIGHT_X; x += 2, i++)
    strip(g, b, [[x, FLOOR_Y, fz0], [x + 2, FLOOR_Y, fz0], [x + 2, FLOOR_Y, fz1], [x, FLOOR_Y, fz1]], fogged(b, env, env.floor[i % 2], x + 1, FLOOR_Y, 4));
  pool(g, b, 4, FLOOR_Y, 4.5, 9, env.light, 0.22);
  // ceiling
  strip(g, b, [[LEFT_X, CEIL_Y, fz0], [RIGHT_X, CEIL_Y, fz0], [RIGHT_X, CEIL_Y, fz1], [LEFT_X, CEIL_Y, fz1]], mix(env.base, '#000000', 0.3));
  // side walls in vertical panels
  for (const [x, k] of [[LEFT_X, 1], [RIGHT_X, 0]])
    for (let i = 0, z = fz0; z < fz1; z += 2.5, i++)
      strip(g, b, [[x, FLOOR_Y, z], [x, FLOOR_Y, z + 2.5], [x, CEIL_Y, z + 2.5], [x, CEIL_Y, z]], fogged(b, env, env.wall[(i + k) % 2], x, 4, z + 1.2));
  // front wall (behind the camera in most shots, seen when we look from the far player's side)
  for (let i = 0, x = LEFT_X; x < RIGHT_X; x += 2, i++)
    strip(g, b, [[x, FLOOR_Y, fz0], [x + 2, FLOOR_Y, fz0], [x + 2, CEIL_Y, fz0], [x, CEIL_Y, fz0]], fogged(b, env, env.wall[(i + 1) % 2], x + 1, 4, fz0));
  // back wall
  if (env.folds) {  // stage curtain: narrow folds with cylindrical shading
    for (let i = 0, x = LEFT_X; x < RIGHT_X; x += 0.55, i++) {
      const k = 0.5 + 0.5 * Math.sin(i * 1.7);
      strip(g, b, [[x, FLOOR_Y, fz1], [x + 0.57, FLOOR_Y, fz1], [x + 0.57, CEIL_Y, fz1], [x, CEIL_Y, fz1]], fogged(b, env, mix(env.wall[1], env.wall[0], k), x, 4, fz1));
    }
    strip(g, b, [[LEFT_X, 11, fz1 - 0.2], [RIGHT_X, 11, fz1 - 0.2], [RIGHT_X, CEIL_Y, fz1 - 0.2], [LEFT_X, CEIL_Y, fz1 - 0.2]], fogged(b, env, env.valance, 4, 12, fz1));
  } else {
    for (let i = 0, x = LEFT_X; x < RIGHT_X; x += 2, i++) {
      strip(g, b, [[x, FLOOR_Y, fz1], [x + 2, FLOOR_Y, fz1], [x + 2, CEIL_Y, fz1], [x, CEIL_Y, fz1]], fogged(b, env, env.wall[i % 2], x + 1, 4, fz1));
      if (env.seam) strip(g, b, [[x, FLOOR_Y, fz1 - 0.01], [x + 0.08, FLOOR_Y, fz1 - 0.01], [x + 0.08, CEIL_Y, fz1 - 0.01], [x, CEIL_Y, fz1 - 0.01]], env.seam);
    }
  }
  if (env.rail) for (const [z, x0, x1, fx] of [[fz1 - 0.05, LEFT_X, RIGHT_X, 0], [fz0 + 0.05, LEFT_X, RIGHT_X, 0]])
    strip(g, b, [[x0, 1.6, z], [x1, 1.6, z], [x1, 1.9, z], [x0, 1.9, z]], fogged(b, env, env.rail, 4, 2, z));
  if (env.strips) {  // tall glowing light columns (TV hall), on the back and side walls
    const cols = [];
    for (let x = LEFT_X + 2; x < RIGHT_X; x += 3.4) cols.push([[x, FLOOR_Y, fz1 - 0.05], [x + 0.35, FLOOR_Y, fz1 - 0.05], [x + 0.35, 13, fz1 - 0.05], [x, 13, fz1 - 0.05]]);
    for (let z = fz0 + 3; z < fz1; z += 4) for (const x of [LEFT_X + 0.05, RIGHT_X - 0.05]) cols.push([[x, FLOOR_Y, z], [x, FLOOR_Y, z + 0.35], [x, 13, z + 0.35], [x, 13, z]]);
    for (const q of cols) if (b.poly(g, q)) { g.save(); g.shadowColor = env.strips; g.shadowBlur = 30; g.fillStyle = rgba(env.strips, 0.5); g.fill(); g.restore(); }
  }
  if (env.banners) for (const x of [-4, 1.5, 6.5, 12])
    strip(g, b, [[x, 3, fz1 - 0.1], [x + 2, 3, fz1 - 0.1], [x + 2, 12, fz1 - 0.1], [x, 12, fz1 - 0.1]], fogged(b, env, env.banners, x, 7, fz1));
  if (env.star) star(g, b, 4, 11.4, fz1 - 0.15, 1.4, fogged(b, env, '#E2B14A', 4, 9, fz1));
  if (env.windows) for (const [x0, x1] of [[-6, -2], [10, 14]]) window_(g, b, env, x0, x1, fz1 - 0.05, t);
  if (env.frames) {
    for (const [x, y, w, h] of [[-4.5, 5.6, 2.6, 3.2], [12.5, 5.2, 3.2, 2.4]]) frame(g, b, env, [x - w / 2, y + h / 2, fz1 - 0.06], [x + w / 2, y + h / 2, fz1 - 0.06], [x - w / 2, y - h / 2, fz1 - 0.06]);
    frame(g, b, env, [LEFT_X + 0.06, 6.6, 2], [LEFT_X + 0.06, 6.6, 5], [LEFT_X + 0.06, 3.8, 2]);
    frame(g, b, env, [RIGHT_X - 0.06, 6.4, 5.5], [RIGHT_X - 0.06, 6.4, 2.5], [RIGHT_X - 0.06, 3.6, 5.5]);
    for (const x of [-3.5, 11.5]) frame(g, b, env, [x + 1.3, 7.2, fz0 + 0.06], [x - 1.3, 7.2, fz0 + 0.06], [x + 1.3, 4, fz0 + 0.06]);
  }
  if (env.windows) for (const [x0, x1] of [[-6, -2], [10, 14]]) window_(g, b, env, x0, x1, fz0 + 0.05, t, 1);
  // key light: soft pool on the back wall behind the far player, plus fixtures
  pool(g, b, 4, 4.5, fz1 - 0.1, 8, env.light, env.lightA, true);
  const L = lights ?? [
    ...(env.lamp ? [{ p: [4, 8.5, 4.5], r: 1.4, hanging: true }] : []),
    ...(env.sconces ? [{ p: [-1.2, 6.8, fz1 - 0.2], r: 1.1 }, { p: [9.2, 6.8, fz1 - 0.2], r: 1.1 }, { p: [LEFT_X + 0.2, 7, -4], r: 1 }, { p: [RIGHT_X - 0.2, 7, -4], r: 1 },
      { p: [0.5, 6.8, fz0 + 0.2], r: 1.1 }, { p: [7.5, 6.8, fz0 + 0.2], r: 1.1 }] : []),
  ];
  for (const l of L) lamp(g, b, l, env, t);
}

function star(g, b, x, y, z, r, color) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y - Math.sin(a) * rr, z]); }
  if (b.poly(g, pts)) { g.save(); g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 20; g.fill(); g.restore(); }
}

function window_(g, b, env, x0, x1, z, t, dir = -1) {
  const y0 = 1.5, y1 = 10;
  if (b.poly(g, [[x0 - 0.3, y0 - 0.3, z], [x1 + 0.3, y0 - 0.3, z], [x1 + 0.3, y1 + 0.3, z], [x0 - 0.3, y1 + 0.3, z]])) { g.fillStyle = mix(env.wall[0], '#000000', 0.4); g.fill(); }
  if (b.poly(g, [[x0, y0, z - 0.01], [x1, y0, z - 0.01], [x1, y1, z - 0.01], [x0, y1, z - 0.01]])) {
    const p = b.project((x0 + x1) / 2, y1, z), q = b.project((x0 + x1) / 2, y0, z);
    const gr = g.createLinearGradient(p.x, p.y, q.x, q.y); gr.addColorStop(0, rgba(env.light, 0.75)); gr.addColorStop(1, rgba(env.light, 0.25));
    g.save(); g.fillStyle = gr; g.shadowColor = env.light; g.shadowBlur = 40; g.fill(); g.restore();
  }
  const bar = mix(env.wall[1], '#000000', 0.5), xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
  strip(g, b, [[xm - 0.08, y0, z - 0.02], [xm + 0.08, y0, z - 0.02], [xm + 0.08, y1, z - 0.02], [xm - 0.08, y1, z - 0.02]], bar);
  strip(g, b, [[x0, ym - 0.08, z - 0.02], [x1, ym - 0.08, z - 0.02], [x1, ym + 0.08, z - 0.02], [x0, ym + 0.08, z - 0.02]], bar);
  // light spilling onto the floor
  pool(g, b, xm, FLOOR_Y, z + dir * 4, 4.5, env.light, 0.16);
}

// framed dark painting (decor); corners tl, tr, bl in world space
function frame(g, b, env, tl, tr, bl) {
  const br = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1], tr[2] + bl[2] - tl[2]];
  strip(g, b, [tl, tr, br, bl], fogged(b, env, '#B08A4A', ...tl));
  const ins = (p, k) => [lerp(p[0], (tl[0] + br[0]) / 2, k), lerp(p[1], (tl[1] + br[1]) / 2, k), lerp(p[2], (tl[2] + br[2]) / 2, k)];
  strip(g, b, [ins(tl, 0.14), ins(tr, 0.14), ins(br, 0.14), ins(bl, 0.14)], fogged(b, env, mix(env.wall[1], '#000000', 0.45), ...tl));
}

// a real photo hung in the set: corners tl, tr, bl (world). Affine-mapped, clipped to the projected quad.
export function picture(g, b, img, tl, tr, bl, { tone = 'bw', fx = 0.5, fy = 0.4, zoom = 1, border = '#C9A05A', pad = 0.18, a = 1, glow = 0 } = {}) {
  const br = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1], tr[2] + bl[2] - tl[2]];
  if ([tl, tr, bl, br].some(p => b.toCam(...p)[2] < 0.4) || a <= 0) return;
  const ex = (p, k) => { const c = [(tl[0] + br[0]) / 2, (tl[1] + br[1]) / 2, (tl[2] + br[2]) / 2]; return p.map((v, i) => c[i] + (v - c[i]) * k); };
  const span = Math.hypot(tr[0] - tl[0], tr[1] - tl[1], tr[2] - tl[2]), kk = 1 + pad * 2 / span;
  g.save(); g.globalAlpha *= a;
  if (b.poly(g, [ex(tl, kk), ex(tr, kk), ex(br, kk), ex(bl, kk)])) {
    g.save(); g.shadowColor = glow ? border : 'rgba(0,0,0,0.6)'; g.shadowBlur = glow ? 40 * glow : 30; g.fillStyle = border; g.fill(); g.restore();
  }
  const P = [tl, tr, bl].map(p => b.project(...p));
  const wq = Math.hypot(tr[0] - tl[0], tr[1] - tl[1], tr[2] - tl[2]), hq = Math.hypot(bl[0] - tl[0], bl[1] - tl[1], bl[2] - tl[2]);
  const s = Math.max(wq / img.width, hq / img.height) * zoom, sw = wq / s, sh = hq / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  b.poly(g, [tl, tr, br, bl]); g.clip();
  g.transform(P[1].x - P[0].x, P[1].y - P[0].y, P[2].x - P[0].x, P[2].y - P[0].y, P[0].x, P[0].y);
  g.filter = tone === 'sepia' ? 'sepia(0.55) contrast(1.08) brightness(0.95)' : tone === 'warm' ? 'sepia(0.25) contrast(1.05)' : 'grayscale(1) contrast(1.08)';
  g.drawImage(img, sx, sy, sw, sh, 0, 0, 1, 1);
  g.restore();
}

// soft radial light projected at a world point
export function pool(g, b, x, y, z, r, color, a, vertical = false) {
  const c = b.toCam(x, y, z);
  if (c[2] < 0.3) return;
  const p = b.project(x, y, z), rad = r * p.s;
  if (rad > 6000) return;
  const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
  gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr;
  g.translate(p.x, p.y); g.scale(1, vertical ? 1 : 0.45); g.translate(-p.x, -p.y);
  g.beginPath(); g.arc(p.x, p.y, rad, 0, 7); g.fill(); g.restore();
}

export function lamp(g, b, { p: [x, y, z], r = 1, hanging = false, color }, env, t = 0) {
  const c = b.toCam(x, y, z);
  if (c[2] < 0.3) return;
  const col = color || env.light, q = b.project(x, y, z), fl = 1 + 0.04 * Math.sin(t * 13);
  if (hanging) {  // cord + shade + downward cone
    const top = b.project(x, CEIL_Y, z);
    g.save(); g.strokeStyle = '#2B2F33'; g.lineWidth = Math.max(2, q.s * 0.05); g.beginPath(); g.moveTo(top.x, top.y); g.lineTo(q.x, q.y); g.stroke(); g.restore();
    const fl0 = b.project(x, -0.2, z), w0 = q.s * 0.6, w1 = fl0.s * 3.2;
    const gr = g.createLinearGradient(0, q.y, 0, fl0.y); gr.addColorStop(0, rgba(col, 0.22)); gr.addColorStop(1, rgba(col, 0));
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath();
    g.moveTo(q.x - w0, q.y); g.lineTo(q.x + w0, q.y); g.lineTo(fl0.x + w1, fl0.y); g.lineTo(fl0.x - w1, fl0.y); g.fill(); g.restore();
    g.save(); g.fillStyle = '#C9B48A'; g.beginPath(); g.moveTo(q.x - q.s * 0.7, q.y + q.s * 0.2); g.lineTo(q.x + q.s * 0.7, q.y + q.s * 0.2); g.lineTo(q.x + q.s * 0.35, q.y - q.s * 0.25); g.lineTo(q.x - q.s * 0.35, q.y - q.s * 0.25); g.fill(); g.restore();
  } else {  // wall sconce: small brass cup under the glow
    g.save(); g.fillStyle = '#6B5530'; g.beginPath(); g.ellipse(q.x, q.y + q.s * 0.25, q.s * 0.28, q.s * 0.12, 0, 0, 7); g.fill(); g.restore();
  }
  const rad = r * q.s * fl;
  const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rad);
  gr.addColorStop(0, rgba('#FFFFFF', 0.95)); gr.addColorStop(0.15, rgba(col, 0.75)); gr.addColorStop(1, rgba(col, 0));
  g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, rad, 0, 7); g.fill(); g.restore();
}

// axis-aligned box; only the faces turned toward the camera are drawn, so no sorting is needed
export function box(g, b, [x0, y0, z0], [x1, y1, z1], { top = '#2A2018', side = '#140E09', front = '#1D150E' } = {}) {
  const E = b.E, F = [];
  if (E[1] > y1) F.push([[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top]);
  if (E[1] < y0) F.push([[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], side]);
  if (E[2] < z0) F.push([[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], front]);
  if (E[2] > z1) F.push([[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], front]);
  if (E[0] < x0) F.push([[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], side]);
  if (E[0] > x1) F.push([[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side]);
  for (const [pts, col] of F) strip(g, b, pts, col);
}

// the table under the board: a top with a lip and a solid pedestal that hides the players' lower bodies
export function table(g, b, env = ENV.cold) {
  const [top, side, front] = env.table || [mix(env.wall[0], '#000000', 0.35), mix(env.base, '#000000', 0.2), mix(env.wall[1], '#000000', 0.5)];
  box(g, b, [-0.4, FLOOR_Y, -0.4], [8.4, -0.75, 8.4], { top: side, side: mix(side, '#000000', 0.3), front: side });
  box(g, b, [-1.1, -0.75, -1.1], [9.1, -0.35, 9.1], { top, side: front, front });
}

// a chair facing +z (face=1) or -z (face=-1); seat center (x, z)
export function chair(g, b, x, z, { face = -1, color = '#1E2428', a = 1 } = {}) {
  if (a <= 0) return;
  const dark = mix(color, '#000000', 0.35), lite = mix(color, '#FFFFFF', 0.08);
  const zb = z - face * 0.85;  // the back is behind the sitter
  const parts = [
    [() => box(g, b, [x - 1, -1.35, z - 0.95], [x + 1, -1.0, z + 0.95], { top: lite, side: dark, front: color }), [x, -1.2, z]],
    [() => box(g, b, [x - 1, -1.0, zb - 0.12], [x + 1, 2.4, zb + 0.12], { top: lite, side: dark, front: color }), [x, 0.7, zb]],
    ...[[-0.85, -0.8], [0.85, -0.8], [-0.85, 0.8], [0.85, 0.8]].map(([dx, dz]) => [() => box(g, b, [x + dx - 0.1, FLOOR_Y, z + dz - 0.1], [x + dx + 0.1, -1.35, z + dz + 0.1], { top: dark, side: dark, front: dark }), [x + dx, -2.2, z + dz]]),
  ].map(([f, c]) => [f, b.toCam(...c)[2]]).sort((p, q) => q[1] - p[1]);
  g.save(); g.globalAlpha *= a; for (const [f] of parts) f(); g.restore();
}

// long draped table for a row of officials (the Soviet machine)
export function committee(g, b, { x0 = -6, x1 = 14, z = 11.2, h = 0.4, cloth = '#7A1418' } = {}) {
  box(g, b, [x0, FLOOR_Y, z - 0.7], [x1, h, z + 0.7], { top: mix(cloth, '#FFFFFF', 0.08), side: mix(cloth, '#000000', 0.45), front: mix(cloth, '#000000', 0.2) });
}

// draws something at a projected world point: draw(x, y, scale, depth) with scale = pixels per world unit / 100
export function placeAt(b, x, y, z, draw) {
  const c = b.toCam(x, y, z);
  if (c[2] < 0.5) return null;
  const p = b.project(x, y, z);
  draw(p.x, p.y, p.s / 100, c[2]);
  return p;
}

// pairs of glowing eyes on the walls (paranoia): placed in world space so they parallax
export function wallEyes(g, b, lt, t0, n, { seed = 4, color = C.red } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const side = r(), u = r(), v = r(), d = t0 + i * 0.09;
    const p = side < 0.55 ? [LEFT_X + 1 + u * (RIGHT_X - LEFT_X - 2), 1 + v * 10, BACK_Z - 0.1]
      : side < 0.78 ? [LEFT_X + 0.1, 1 + v * 10, -6 + u * 18] : [RIGHT_X - 0.1, 1 + v * 10, -6 + u * 18];
    if (lt < d || b.toCam(...p)[2] < 0.5) continue;
    const q = b.project(...p), s = q.s / 60 * (0.7 + r() * 0.5);
    const a = clamp((lt - d) / 0.2), bl = ((lt + i) % 3.1) < 0.12 ? 0.1 : 1;
    g.save(); g.globalAlpha *= a; g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 24;
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(q.x + sd * 26 * s, q.y, 13 * s, 7 * s * bl, sd * 0.2, 0, 7); g.fill(); }
    g.restore();
  }
}

// light through venetian blinds: stripes on the back wall and across the floor
export function blindLight(g, b, { a = 1, color = '#D2E1EB' } = {}) {
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const y = 2.2 + i * 0.9;
    strip(g, b, [[-3, y, BACK_Z - 0.08], [11, y, BACK_Z - 0.08], [11, y + 0.42, BACK_Z - 0.08], [-3, y + 0.42, BACK_Z - 0.08]], rgba(color, 0.2 * a));
    const z = -2 + i * 1.3;
    strip(g, b, [[-4, FLOOR_Y + 0.01, z], [12, FLOOR_Y + 0.01, z], [12, FLOOR_Y + 0.01, z + 0.6], [-4, FLOOR_Y + 0.01, z + 0.6]], rgba(color, 0.1 * a));
  }
  g.restore();
}
