// Staging helpers: camera rig, seated characters with reaching hands, and the move animator that
// turns each chess move into a small event (lift, arc, landing squash, shockwave, sparks, shards).
import { W, H, C, clamp, lerp, ease, track, noise1, inv } from './core.js';
import { sqXZ, piecesAt } from './board.js';
import { drawChar, hand, EXPR, CAST } from './characters.js';
import { sprite, spriteBox } from './pieces.js';
import { burst, shockwave, glint, shatterImage, dust } from './fx.js';
import { LOOK } from './look.js';

// keyframed orbit camera: keys = [[t, {yaw, pitch, dist, fov, cy, target:[x,y,z]}], ...] (local time)
export function rig(b, lt, keys, { t = lt, shake = 1, e = ease.inOut, bump = 0 } = {}) {
  const DEF = { yaw: 0, pitch: 0.7, dist: 12, fov: 1500, cx: W / 2, cy: H * 0.52, target: [4, 0, 4] };  // cx/cy: lens shift
  const first = { ...DEF, ...keys[0][1] };
  const val = k => track(keys.map(([tt, o]) => [tt, o[k] ?? first[k]]), lt, e);
  const tgt = track(keys.map(([tt, o]) => [tt, o.target ?? first.target]), lt, e);
  const hh = shake * 0.012, bb = bump * 0.02;
  b.setCam({
    yaw: val('yaw') + noise1(t * 0.55, 1) * hh + Math.sin(t * 61) * bb,
    pitch: val('pitch') + noise1(t * 0.45, 2) * hh * 0.7 + Math.cos(t * 53) * bb,
    dist: val('dist'), fov: val('fov'), cx: val('cx'), cy: val('cy'), target: tgt,
  });
  return b;
}

// The cartoon heads are billboards; to sell the 3D orbit, the face turns by the angle between the
// character's facing direction (+z or -z) and the line of sight from the camera.
const resolve = e => (typeof e === 'string' ? EXPR[e] : e) || EXPR.neutral;
function viewTurn(b, x, z, face) {
  const dx = x - b.E[0], dz = z - b.E[2], l = Math.hypot(dx, dz) || 1;
  return face * (dx / l);  // = dot(facing, right axis of the ray toward the character)
}

// a character at a world point (head center), drawn as a camera-facing billboard; returns its projection
export function actor(g, b, who, { x = 4, y = 3.1, z = 9.4, k = 1, e = 'neutral', t = 0, face = -1, follow = 0.85, alpha = 1, blur = 0, ...o } = {}) {
  if (b.toCam(x, y, z)[2] < 0.8 || alpha <= 0) return null;
  const p = b.project(x, y, z), ex = resolve(e);
  if (blur > 0.5) { g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; }
  drawChar(g, who, { ...o, x: p.x, y: p.y, s: p.s * k / 100 * 1.05, e: { ...ex, turn: clamp((ex.turn || 0) - viewTurn(b, x, z, face) * follow, -1, 1) }, t, alpha });
  if (blur > 0.5) g.restore();
  return p;
}

// character seated at the board: far side (z≈9.4, face=-1) or near side (z≈-1.4, face=1).
// Returns a function that draws the hands after the board. reach = {sq, u}: the hand travels to a square and back (u 0..1).
// When the camera is behind the character (over-the-shoulder), nothing is drawn now: the returned function draws the
// hands and then the character as a dark, defocused back-view silhouette in the foreground — call it after the pieces.
export function seated(g, b, who, e, t, { x = 4, z = 9.3, k = 1.0, lift = 3.1, alpha = 1, hx: hx0 = null, reach = null, side = 1, face = -1, hands: showHands = true, ...o } = {}) {
  const hx = hx0 ?? (LOOK.v2 ? 4.4 : 1.6);  // LOOK v2: fists rest on the table beside the board, not among the pieces
  const back = (b.E[2] - z) * face < 0;
  if (!back) actor(g, b, who, { x, y: lift, z, k, e, t, face, alpha, ...o });
  const hands = () => {
    if (!showHands) return;
    for (const sd of [-1, 1]) {
      if (b.toCam(x + sd * hx, 0.25, z + face * 0.75)[2] < 0.6) continue;
      const hr = LOOK.v2 ? 0.27 : 0.33;
      let p = b.project(x + sd * hx * -face, 0.25, z + face * 0.75), r = hr * p.s;
      if (reach && sd === side && reach.u > 0) {
        const [sx, sz] = reach.sq ? sqXZ(reach.sq) : [reach.x, reach.z], q = b.project(sx, reach.y ?? 0.9, sz), u = reach.hold ? clamp(reach.u) : Math.sin(Math.PI * clamp(reach.u));
        const rest = p, ka = reach.hold ? clamp(reach.u * 4) : clamp(Math.sin(Math.PI * clamp(reach.u)) * 3);  // out-and-back reaches end at rest again
        if (LOOK.v2) {  // the reach starts at the table edge in front of the shoulder, not at the fist's resting spot out at the side
          const nb = b.project(x + sd * 1.3 * -face, 0.4, z + face * 1.3);
          p = { x: lerp(p.x, nb.x, ka), y: lerp(p.y, nb.y, ka), s: lerp(p.s, nb.s, ka) };
        }
        p = { x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u) - Math.sin(Math.PI * u) * 40, s: lerp(p.s, q.s, u) };
        r = hr * p.s;
        if (LOOK.v2) arm(g, b, who, { x, lift, z, k }, rest, p, r, ka * alpha);
      }
      g.save(); g.globalAlpha *= alpha; hand(g, p.x, p.y, r); g.restore();
    }
  };
  if (!back) return hands;
  return () => {
    hands();
    const d = b.toCam(x, lift, z)[2];
    actor(g, b, who, { x, y: lift, z, k, e: 'neutral', t, face, alpha, silhouette: true, shade: 'brightness(0.18) saturate(0.5)', blur: clamp((b.dist - d) * 1.3, 0, 12) });
  };
}

// LOOK v2: the sleeve of a reaching arm, from the bust's shoulder on the fist's side to the wrist, with a shirt cuff
function arm(g, b, who, { x, lift, z, k }, rest, p, r, a) {
  const c = CAST[who]; if (!c || a <= 0) return;
  const hp = b.project(x, lift, z), s = hp.s * k / 100 * 1.05, sdx = Math.sign(rest.x - hp.x) || 1;
  const sx = hp.x + sdx * 125 * s, sy = hp.y + 255 * s;  // inside the torso, so the sleeve grows out of the jacket
  const dx = p.x - sx, dy = p.y - sy, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  const w0 = 50 * s, w1 = r * 0.85, wx = p.x - dx / l * r * 0.5, wy = p.y - dy / l * r * 0.5;
  g.save(); g.globalAlpha *= a;
  const gr = g.createLinearGradient(sx + nx * w0, sy + ny * w0, sx - nx * w0, sy - ny * w0); gr.addColorStop(0, c.suit); gr.addColorStop(1, c.suitD);
  g.fillStyle = gr; g.beginPath();
  g.moveTo(sx + nx * w0, sy + ny * w0); g.lineTo(wx + nx * w1, wy + ny * w1); g.lineTo(wx - nx * w1, wy - ny * w1); g.lineTo(sx - nx * w0, sy - ny * w0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,236,214,0.22)'; g.lineWidth = Math.max(2, r * 0.08);  // rim light along the top edge of the sleeve
  const up = ny < 0 ? 1 : -1; g.beginPath(); g.moveTo(sx + nx * w0 * up, sy + ny * w0 * up); g.lineTo(wx + nx * w1 * up, wy + ny * w1 * up); g.stroke();
  g.strokeStyle = '#F4F2EE'; g.lineWidth = r * 0.34; g.lineCap = 'round';
  g.beginPath(); g.moveTo(wx + nx * w1 * 0.9, wy + ny * w1 * 0.9); g.lineTo(wx - nx * w1 * 0.9, wy - ny * w1 * 0.9); g.stroke();
  g.restore();
}

// Scheduled moves over a ply list (tools/pgn_to_json.py). schedule: [{k, t0, dur?, label?, color?}]
export class Moves {
  constructor(b, plies, schedule, { dur = 0.42 } = {}) {
    this.b = b; this.plies = plies;
    this.sched = schedule.map(m => {
      const prev = new Set(plies[m.k - 1].pieces.map(p => p.id)), cur = new Set(plies[m.k].pieces.map(p => p.id));
      const capId = [...prev].find(id => !cur.has(id));
      const cap = capId ? plies[m.k - 1].pieces.find(p => p.id === capId) : null;
      const mover = plies[m.k].pieces.find(p => p.sq === plies[m.k].to);
      return { dur, ...m, land: m.t0 + (m.dur ?? dur), cap, mover, to: plies[m.k].to, from: plies[m.k].from, san: plies[m.k].san };
    });
  }
  current(t) {
    let cur = null;
    for (const m of this.sched) if (t >= m.t0) cur = m;
    return cur;
  }
  // camera bump to feed into rig({bump}) right after a landing
  bump(t) {
    const m = this.current(t);
    if (!m) return 0;
    const dt = t - m.land;
    return dt < 0 || dt > 0.35 ? 0 : (m.cap ? 1 : 0.45) * (1 - dt / 0.35);
  }
  draw(g, t, { focus = null, dof = 1.2, labels = true, fx = true, opts = {}, hideHighlights = false } = {}) {
    const b = this.b, m = this.current(t);
    const base = this.sched[0].k - 1;
    let pieces;
    if (!m) pieces = piecesAt(this.plies, base, 1, { opts });
    else {
      const u = clamp((t - m.t0) / (m.land - m.t0));
      pieces = piecesAt(this.plies, m.k, u, { arc: 0.9, opts }).filter(p => !(m.cap && p.id === m.cap.id && t >= m.land));
      const q = clamp((t - m.land) / 0.22);
      if (q > 0 && q < 1) {
        const mv = pieces.find(p => p.id === m.mover?.id);
        if (mv) { const s = Math.sin(Math.PI * q); mv.sy = 1 - 0.22 * s; mv.sx = 1 + 0.14 * s; }
      }
      if (!hideHighlights) {
        b.highlight(g, m.from, C.red, 0.5 * clamp((t - m.t0) / 0.1));
        b.highlight(g, m.to, m.color || C.teal, 0.6 * clamp((t - m.t0) / 0.15));
      }
    }
    b.drawPieces(g, pieces, { focus: focus ?? b.dist, dof });
    if (!m) return;
    const [x, z] = sqXZ(m.to), land = b.project(x, 0.02, z), mid = b.project(x, 0.6, z);
    const sc = land.s / 130;
    if (fx) {
      b.ring(g, x, z, lerp(0.35, 1.6, ease.out(clamp((t - m.land) / 0.45))), m.color || C.teal, 1 - clamp((t - m.land) / 0.45), 6);
      shockwave(g, land.x, land.y, t, m.land, { r0: 20 * sc, r1: 190 * sc, life: 0.42, color: '#FFFFFF', lw: 8 * sc, squash: 0.36 });
      burst(g, mid.x, mid.y, t, m.land, { n: m.cap ? 26 : 12, color: m.cap ? '#FFE3A0' : '#FFFFFF', speed: 620 * sc, size: 5 * sc, seed: m.k });
      glint(g, mid.x, mid.y - 30 * sc, t, m.land, { r: 150 * sc, life: 0.3 });
      dust(g, land.x, land.y, t, m.land, { size: 18 * sc, spread: 110 * sc, seed: m.k });
      if (m.cap) {  // captured piece explodes into shards
        const h = land.s * 1.25, box = spriteBox(h), img = sprite(m.cap.t, m.cap.c);
        shatterImage(g, img, land.x - box.w / 2, land.y + box.top, box.w, box.h, t - m.land,
          { cols: 3, rows: 5, seed: m.k, power: 520 * sc, gravity: 2200 * sc, spin: 8, life: 0.85, oy: 0.55 });
        burst(g, mid.x, mid.y, t, m.land, { n: 16, color: m.cap.c === 'w' ? '#FFFFFF' : '#9FB0BA', speed: 900 * sc, size: 7 * sc, kind: 'dot', seed: m.k + 99 });
      }
    }
    // reticle snaps in with overshoot after landing, then keeps rotating
    const rq = clamp((t - m.land + 0.05) / 0.3);
    if (rq > 0) b.reticle(g, m.to, t, m.color || C.teal, Math.min(1, rq * 2), 0.95 * (1 + 0.7 * (1 - ease.back(rq))));
    if (labels && m.san && (labels !== 'custom' || m.label)) {
      const lq = clamp((t - m.t0) / 0.2);
      b.label(g, m.to, m.label || m.san, m.labelColor || C.lime, lq, 1.9 + 0.3 * (1 - ease.back(lq)));
    }
  }
  // sound design for every move: whoosh on lift, wooden clack on landing, glass + impact on capture
  cues(cue) {
    for (const m of this.sched) {
      cue(m.t0, 'whoosh', 0.35);
      cue(m.land, 'clack', 1.0);
      cue(m.land, 'ting', 0.25);
      if (m.cap) { cue(m.land, 'glass', 0.8); cue(m.land, 'hit', 0.55); }
    }
  }
}
