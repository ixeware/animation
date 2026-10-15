// The move accent, worked out frame by frame from the @chess.history shorts: the piece slides fast and low; its
// start square fills with the mover's colour; a white streak with an arrowhead runs along the path; on landing a
// holographic square frame drops onto the target (wide and faint first, then tight on the square), a thin glowing
// ring settles round the piece, the move is labelled in small mono type and a few sparks rise. White's moves are
// teal, Black's gold, captures red. The sound is `move` / `move_capture` in audio/samples (audio/sfx_move.py), its
// hit lands 85 ms into the sample: cue it at landing − MOVE_HIT.
//
// Per frame: pieces = piecesAt(G, k, slide(lt), SLIDE_OPTS); draw the board, moveUnder(), the pieces, moveOver().
import { W, clamp, lerp, ease, seg, rgba, qaRect } from './core.js';
import { sqXZ } from './board.js';

export const MOVE_COL = { w: '#3FE0C5', b: '#E9B654', x: '#FF5A4F' };
export const SLIDE = 0.24;                       // the slide, seconds
export const MOVE_HIT = 0.085;                   // where the hit sits in the move sample
export const SLIDE_OPTS = { arc: 0.12, e: ease.out, trail: false };
export const slide = (lt, dur = SLIDE) => clamp(lt / dur);

// move k of a game (plies from tools/pgn_to_json.py): {from, to, side, capture, label}
export function moveOf(plies, k) {
  const p = plies[k], prev = plies[k - 1], mover = p.pieces.find(q => q.sq === p.to);
  const side = mover ? mover.c : (k % 2 ? 'w' : 'b');
  return { from: p.from, to: p.to, side, capture: prev.pieces.length > p.pieces.length, label: `${Math.ceil(k / 2)}${side === 'w' ? '.' : '...'}${p.san}` };
}
const colOf = m => m.capture ? MOVE_COL.x : MOVE_COL[m.side];

// board-plane layer: start and target squares, the dot grid and the dropping frame (draw before the pieces)
export function moveUnder(ctx, B, m, lt, { dur = SLIDE, hold = 1.3 } = {}) {
  const out = 1 - seg(lt, hold, hold + 0.35);
  if (lt < 0 || out <= 0) return;
  const col = colOf(m);
  B.highlight(ctx, m.from, col, 0.45 * seg(lt, 0, 0.06) * out, false);
  const ll = lt - dur; if (ll < 0) return;
  B.highlight(ctx, m.to, col, 0.55 * seg(ll, 0, 0.05) * out, true);
  B.dots(ctx, '#FFFFFF', 0.2 * out * seg(ll, 0, 0.1), [m.to], 6);
  const u = ease.out(seg(ll, 0, 0.45)), half = lerp(1.35, 0.56, u), [x, z] = sqXZ(m.to);
  const pts = [[x - half, 0.03, z - half], [x + half, 0.03, z - half], [x + half, 0.03, z + half], [x - half, 0.03, z + half]];
  ctx.save(); ctx.globalAlpha *= out * lerp(0.5, 1, u);
  if (B.poly(ctx, pts)) {
    ctx.fillStyle = rgba(col, 0.1); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 22; ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
  }
  ctx.restore();
}

// over the pieces: the streak and arrowhead, the ring, the label, sparks (and a flash on a capture)
export function moveOver(ctx, B, m, lt, { dur = SLIDE, hold = 1.3, label = true } = {}) {
  const out = 1 - seg(lt, hold, hold + 0.35);
  if (lt < 0 || out <= 0) return;
  const col = colOf(m), [x0, z0] = sqXZ(m.from), [x1, z1] = sqXZ(m.to), u = ease.out(slide(lt, dur));
  const sa = (lt < dur ? 1 : 1 - seg(lt, dur, dur + 0.4)) * out;
  if (sa > 0) {
    const tu = lt < dur ? 0 : ease.in(seg(lt, dur, dur + 0.4)) * 0.85;   // after landing the tail catches up
    const a = B.project(lerp(x0, x1, tu), 0.22, lerp(z0, z1, tu)), b = B.project(lerp(x0, x1, u), 0.22, lerp(z0, z1, u));
    const w = Math.max(3, b.s * 0.075), dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    if (l > 4) {
      const gr = ctx.createLinearGradient(a.x, a.y, b.x, b.y); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.95)');
      ctx.save(); ctx.globalAlpha *= sa; ctx.lineCap = 'round'; ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 16;
      ctx.strokeStyle = gr; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (lt < dur + 0.12) {                                             // the arrowhead rides the front
        const ux = dx / l, uy = dy / l, s = w * 2.6;
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(b.x + ux * s, b.y + uy * s);
        ctx.lineTo(b.x - uy * s * 0.75, b.y + ux * s * 0.75); ctx.lineTo(b.x + uy * s * 0.75, b.y - ux * s * 0.75); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
  const ll = lt - dur; if (ll < 0) return;
  const p = B.project(x1, 0.55, z1), r = p.s * 0.62 * lerp(0.7, 1, ease.out(seg(ll, 0, 0.2))), ra = out * seg(ll, 0, 0.06);
  ctx.save(); ctx.globalAlpha *= ra; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, p.s * 0.035); ctx.shadowColor = col; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  if (label && m.label) {
    const fs = Math.round(clamp(p.s * 0.34, 26, 48)), ly = p.y - r * 1.02;
    ctx.save(); ctx.globalAlpha *= ra; ctx.font = `800 ${fs}px "JetBrains Mono"`; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(m.label).width;            // right of the ring, or left of it near the right edge
    const lx = p.x + r * 0.55 + tw > W - 28 ? p.x - r * 0.55 - tw : p.x + r * 0.55;
    ctx.fillStyle = col; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6; ctx.fillText(m.label, lx, ly);
    qaRect(ctx, lx, ly - fs, tw, fs * 1.2, 'text', 'move ' + m.label);
    ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.globalAlpha *= 0.5; ctx.fillText(m.label, lx, ly);
    ctx.restore();
  }
  if (ll < 0.55) {                                                       // sparks from the landing point
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 12; i++) {
      const an = i / 12 * Math.PI * 2 + (i % 3) * 0.4, sp = 1.2 + (i % 4) * 0.35;
      const q = B.project(x1 + Math.cos(an) * ll * sp * 0.6, 0.06 + ll * (1.4 + (i % 3) * 0.4) - ll * ll * 2.2, z1 + Math.sin(an) * ll * sp * 0.6);
      ctx.globalAlpha = (1 - ll / 0.55) * out; ctx.fillStyle = i % 2 ? '#FFFFFF' : col;
      ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.2, q.s * 0.03), 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  if (m.capture && ll < 0.3) {
    const g = B.project(x1, 0.3, z1), R = g.s * 1.6, gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, R);
    gr.addColorStop(0, rgba(MOVE_COL.x, 0.55 * (1 - ll / 0.3))); gr.addColorStop(1, rgba(MOVE_COL.x, 0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(g.x - R, g.y - R, R * 2, R * 2); ctx.restore();
  }
}

// a run of moves on a timeline: at = [time of move k0+1, time of move k0+2, ...] (each = the start of its slide).
// Returns the pieces for time t and the active moves (the last two, so a new move overlaps the fading one).
export function playRun(plies, k0, at, t, piecesAt) {
  let i = -1; while (i + 1 < at.length && t >= at[i + 1]) i++;
  const k = k0 + i + 1, lt = i >= 0 ? t - at[i] : 0;
  const pieces = i < 0 ? piecesAt(plies, k0) : piecesAt(plies, k, slide(lt), SLIDE_OPTS);
  const active = [];
  for (let j = Math.max(0, i - 1); j <= i; j++) {
    const last = j === i, hold = last ? 1.3 : Math.min(1.3, at[j + 1] + SLIDE - at[j] - 0.2);
    active.push({ m: moveOf(plies, k0 + j + 1), lt: t - at[j], last, hold, label: last });
  }
  return { pieces, active, k };
}
