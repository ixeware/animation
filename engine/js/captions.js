// Word-by-word karaoke captions: 1–4 words on screen, the spoken word lights up in its color.
import { W, H, capColor, clamp, ease, qaRect } from './core.js';
import { outlinedText } from './draw.js';

const FONT = s => `800 ${s}px Rubik`;
const SIZE = 66, Y = Math.round(H * 0.68), MAXW = 860;
// the band the captions occupy (with room for the jump-cut zoom), for labels that must keep out of it
export const CAP_BAND = [Y - SIZE * 0.82 - 40, Y + SIZE * 0.3 + 40];

export function buildChunks(phrases, ctx) {
  ctx.font = FONT(SIZE);
  const chunks = [];
  for (const p of phrases) {
    let cur = [];
    const flush = () => { if (cur.length) chunks.push({ words: cur, pid: p.id }); cur = []; };
    for (const w of p.words) {
      const trial = [...cur, w].map(x => x.w).join(' ');
      // break on sentence ends inside a phrase, on width, or after 4 words
      if (cur.length && (ctx.measureText(trial).width > MAXW || cur.length >= 4)) flush();
      cur.push(w);
      if (/[.!?]$/.test(w.w) && !/\.\.\.$/.test(w.w)) flush();
    }
    flush();
  }
  chunks.forEach((c, i) => {
    c.s = c.words[0].s - 0.04;
    const next = chunks[i + 1];
    c.e = Math.min(next ? next.words[0].s - 0.04 : 1e9, c.words[c.words.length - 1].e + 0.55);
  });
  return chunks;
}

export function drawCaptions(ctx, chunks, t, { y = Y, hide = false } = {}) {
  if (hide) return;
  const c = chunks.find(c => t >= c.s && t < c.e);
  if (!c) return;
  ctx.save(); ctx.font = FONT(SIZE);
  const space = ctx.measureText(' ').width;
  const widths = c.words.map(w => ctx.measureText(w.w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (widths.length - 1);
  const big = c.words.length === 1 && /checkmate/i.test(c.words[0].w);
  const pop = ease.back(clamp((t - c.s) / 0.12));
  let x = W / 2 - total / 2;
  qaRect(ctx, x - 10, y - SIZE * 0.82, total + 20, SIZE * 1.12, 'caption', c.words.map(w => w.w).join(' '));
  c.words.forEach((w, i) => {
    const next = c.words[i + 1];
    const active = t >= w.s - 0.03 && (next ? t < next.s - 0.03 : true);
    const spoken = t >= w.s - 0.03;
    const cx = x + widths[i] / 2;
    const s = (big ? 1.35 : 1) * (0.85 + 0.15 * pop) * (active ? 1 + 0.06 * clamp(1 - (t - w.s) / 0.15) : 1);
    ctx.save(); ctx.translate(cx, y); ctx.scale(s, s);
    outlinedText(ctx, w.w, 0, 0, { font: FONT(SIZE), fill: active || (big && spoken) ? capColor[w.c] || capColor.lime : '#FFFFFF', sw: 12 });
    ctx.restore();
    x += widths[i] + space;
  });
  ctx.restore();
}
