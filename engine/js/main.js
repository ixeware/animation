// Film runner: loads an episode, composes shots with transitions, captions and grain.
// The page exposes renderFrame(t), DURATION and cues for render.mjs.
import { W, H, FPS, makeCanvas, clamp, inv, QA } from './core.js';
import { grain, vignette, lightLeak, flash, tvOff } from './draw.js';
import { screenShatter } from './fx.js';
import { buildChunks, drawCaptions } from './captions.js';
import { finish } from './post.js';

const q = new URLSearchParams(location.search);
QA.on = q.has('qa');
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
layer.dataset.qa = '1';
const hold = makeCanvas(), hctx = hold.getContext('2d');

await document.fonts.ready;
for (const f of ['700 40px Rubik', '800 40px Rubik', '700 40px Cinzel', '700 40px "JetBrains Mono"', '900 40px Rubik', '600 40px Cinzel', '500 40px "JetBrains Mono"', '800 40px "JetBrains Mono"', '800 40px Cinzel'])
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

// screen shake driven by impact sounds (boom, hit, stamp, glass); decays in ~0.15 s
const SHAKE = { boom: 14, hit: 11, stamp: 12, glass: 16, thud: 6, clack: 2.5, buzz: 5, boom_cine: 12, hit_punch: 9, gavel: 7, door_slam: 9 };
const shakeCues = (film.cues || []).filter(c => SHAKE[c.id]).map(c => ({ t: c.t, a: SHAKE[c.id] * (c.gain ?? 1) }));
function shakeAmp(t) {
  let a = 0;
  for (const c of shakeCues) { const d = t - c.t; if (d >= 0 && d < 0.6) a += c.a * Math.exp(-d / 0.15); }
  return Math.min(a, 26) * (film.shake ?? 1);
}

function jumpAt({ every = 1.4, zooms = [1, 1.15, 1.06], shift = 50 }, lt, len, i) {
  const n = Math.floor(lt / every), last = Math.floor((len - 0.45) / every);
  const k = Math.min(n, Math.max(0, last));
  if (k <= 0) return [1, 0, 0];
  const sd = (k + i) % 2 ? 1 : -1;
  return [zooms[k % zooms.length] || 1, sd * shift * (k % zooms.length ? 1 : 0), -shift * 0.6 * (k % zooms.length ? 1 : 0)];
}

function compose(t, frame) {
  const s = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
  QA.items = []; QA.M = null; QA.skip = false; QA.shot = s.i; QA.allow = s.qaAllow || [];
  drawShot(s, t, lctx);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
  const lt = t - s.a, tr = s.trans || 'cut';
  if (tr === 'fade' && lt < (s.transDur || 0.35)) {
    const prev = shots[s.i - 1];
    if (prev) { drawShot(prev, t, hctx); ctx.drawImage(hold, 0, 0); }
    ctx.globalAlpha = clamp(lt / (s.transDur || 0.35));
  }
  if (['whip', 'zoom', 'fade', 'flash', 'shatter'].includes(tr) && lt < 0.3) QA.skip = true;
  if (tr === 'whip' && lt < 0.22) {
    const u = 1 - lt / 0.22;
    ctx.filter = `blur(${(u * 26).toFixed(1)}px)`;
    ctx.drawImage(layer, -u * u * 380 * (s.whipDir || 1), 0);
  } else if (tr === 'zoom' && lt < 0.25) {
    const u = 1 - lt / 0.25, z = 1 + u * u * 0.6;
    ctx.filter = `blur(${(u * 18).toFixed(1)}px)`;
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); ctx.drawImage(layer, 0, 0);
  } else {
    // every shot keeps moving: slow push-in across the shot + impact shake from the sound cues
    // info shots (tables, leaderboards, panels, quotes) stay framed: no jump cuts, barely any push-in
    const kb = s.info ? 0.01 : s.kb ?? 0.04, a = shakeAmp(t), sx = Math.sin(t * 83) * a, sy = Math.cos(t * 71) * a;
    // dense editing: long shots get hard punch-in jump cuts every `every` seconds (film.jumpCut)
    const J = film.jumpCut, [jz, jx, jy] = J && !s.noJump && !s.info ? jumpAt(J, lt, s.b - s.a, s.i) : [1, 0, 0];
    const z = (1 + kb * clamp(lt / Math.max(0.5, s.b - s.a)) + a * 0.0015) * jz;
    ctx.translate(W / 2 + sx + jx, H / 2 + sy + jy); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    { const m = ctx.getTransform(); QA.M = [m.a, m.b, m.c, m.d, m.e, m.f]; }
    ctx.drawImage(layer, 0, 0);
  }
  ctx.restore();
  if (tr === 'shatter' && lt < 0.8) {  // the previous shot, frozen, breaks like glass over this one
    const prev = shots[s.i - 1];
    if (prev) { drawShot(prev, s.a - 0.001, hctx); screenShatter(ctx, hold, lt / 0.8, { seed: s.i * 7 + 3 }); }
  }
  finish(ctx, main, s.grade ?? film.grade ?? 'neutral', { amount: film.finish ?? 1 });
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
window.qaFrame = t => { renderFrame(t); return { items: QA.items, M: QA.M, skip: QA.skip, shot: QA.shot, allow: QA.allow }; };
// every stylized cut gets a soft whoosh; glass breaks get their crash
const autoCues = shots.slice(1).flatMap(s => s.trans === 'shatter' ? [{ t: s.a, id: 'glass', gain: 1 }, { t: s.a, id: 'hit', gain: 0.7 }]
  : ['leak', 'whip', 'zoom', 'flash'].includes(s.trans) ? [{ t: Math.max(0, s.a - 0.12), id: 'whoosh', gain: 0.45 }] : []);
window.CUES = [...(film.cues || []), ...(film.autoWhoosh === false ? [] : autoCues)];
window.MUSIC = film.music || [];
window.READY = true;
if (q.has('t')) renderFrame(+q.get('t'));
