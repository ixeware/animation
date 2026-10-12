// Film runner: loads an episode, composes shots with transitions, captions and grain.
// The page exposes renderFrame(t), DURATION and cues for render.mjs.
import { W, H, FPS, makeCanvas, clamp, inv } from './core.js';
import { grain, vignette, lightLeak, flash, tvOff } from './draw.js';
import { buildChunks, drawCaptions } from './captions.js';

const q = new URLSearchParams(location.search);
const ep = q.get('ep') || 'fischer';

class Timeline {
  constructor(tm) {
    this.duration = tm.duration; this.phrases = tm.phrases;
    this.by = Object.fromEntries(tm.phrases.map((p, i) => [p.id, { ...p, i }]));
  }
  p(id) { const p = this.by[id]; if (!p) throw new Error('no phrase ' + id); return p; }
  s(id) { return this.p(id).s; }
  e(id) { return this.p(id).e; }
  next(id) { const n = this.phrases[this.p(id).i + 1]; return n ? n.s : this.duration; }
  // word start by text (first match, case-insensitive, punctuation ignored) or index
  w(id, key) {
    const ws = this.p(id).words;
    if (typeof key === 'number') return ws[key < 0 ? ws.length + key : key];
    const k = key.toLowerCase().replace(/[^\w-]/g, '');
    const w = ws.find(w => w.w.toLowerCase().replace(/[^\w-]/g, '') === k);
    if (!w) throw new Error(`no word ${key} in ${id}`);
    return w;
  }
}

const main = document.getElementById('c');
main.width = W; main.height = H;
const ctx = main.getContext('2d');
const layer = makeCanvas(), lctx = layer.getContext('2d');
const hold = makeCanvas(), hctx = hold.getContext('2d');

await document.fonts.ready;
for (const f of ['800 40px Rubik', '700 40px Cinzel', '700 40px "JetBrains Mono"', '900 40px Rubik', '600 40px Cinzel', '500 40px "JetBrains Mono"', '800 40px "JetBrains Mono"', '800 40px Cinzel'])
  await document.fonts.load(f);

const tm = await fetch(`../episodes/${ep}/build/timings.json`).then(r => r.json());
const T = new Timeline(tm);
const mod = await import(`../../episodes/${ep}/scenes.js`);
const film = await mod.build(T);
const shots = film.shots.map((s, i) => ({ ...s, i }));
shots.forEach((s, i) => { s.b = s.b ?? (shots[i + 1] ? shots[i + 1].a : film.duration ?? T.duration); });
const chunks = buildChunks(T.phrases, ctx);
const DURATION = film.duration ?? T.duration;

function drawShot(s, t, g) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#05090D'; g.fillRect(0, 0, W, H);
  s.draw(g, t - s.a, t, s);
  g.restore();
}

function compose(t, frame) {
  const s = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
  drawShot(s, t, lctx);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
  const lt = t - s.a, tr = s.trans || 'cut';
  if (tr === 'fade' && lt < (s.transDur || 0.35)) {
    const prev = shots[s.i - 1];
    if (prev) { drawShot(prev, t, hctx); ctx.drawImage(hold, 0, 0); }
    ctx.globalAlpha = clamp(lt / (s.transDur || 0.35));
  }
  if (tr === 'whip' && lt < 0.22) {
    const u = 1 - lt / 0.22;
    ctx.filter = `blur(${(u * 26).toFixed(1)}px)`;
    ctx.drawImage(layer, -u * u * 380 * (s.whipDir || 1), 0);
  } else if (tr === 'zoom' && lt < 0.25) {
    const u = 1 - lt / 0.25, z = 1 + u * u * 0.6;
    ctx.filter = `blur(${(u * 18).toFixed(1)}px)`;
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); ctx.drawImage(layer, 0, 0);
  } else ctx.drawImage(layer, 0, 0);
  ctx.restore();
  if (s.post) s.post(ctx, lt, t);
  // light leak straddles the cut into this shot (and into the next one, if it asks)
  const nx = shots[s.i + 1];
  if (tr === 'leak' && lt < 0.14) lightLeak(ctx, 0.5 + lt / 0.28);
  if (nx && nx.trans === 'leak' && nx.a - t < 0.14) lightLeak(ctx, 0.5 - (nx.a - t) / 0.28);
  if (tr === 'flash') flash(ctx, 1 - lt / 0.3);
  vignette(ctx, s.vig ?? 0.55);
  drawCaptions(ctx, chunks, t, { hide: s.noCaptions });
  grain(ctx, frame, 0.06);
}

function renderFrame(t, frame = Math.round(t * FPS)) {
  if (film.tvOff && t >= film.tvOff) {
    compose(film.tvOff - 0.001, frame);
    hctx.drawImage(main, 0, 0);
    tvOff(ctx, hold, clamp((t - film.tvOff) / 0.5));
    return;
  }
  compose(t, frame);
}

window.DURATION = DURATION;
window.renderFrame = renderFrame;
window.CUES = film.cues || [];
window.MUSIC = film.music || [];
window.READY = true;
if (q.has('t')) renderFrame(+q.get('t'));
