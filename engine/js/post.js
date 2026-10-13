// Film finish applied to every composed frame before captions: a colour grade (contrast / saturation /
// brightness, warm highlights, lifted tinted shadows) and bloom with a warm halation on bright areas.
// Shots pick a grade by name (shot.grade, else film.grade, else 'neutral').
import { W, H, makeCanvas, rgba } from './core.js';

export const GRADES = {
  //            contrast sat   bright  highlight tone      shadow lift        bloom
  neutral: { con: 1.07, sat: 1.06, bri: 1.0, tone: ['#FFB27A', 0.10], lift: ['#0F2430', 0.10], bloom: 0.32 },
  warm: { con: 1.08, sat: 1.12, bri: 1.03, tone: ['#FF9A50', 0.18], lift: ['#2A1630', 0.08], bloom: 0.38 },     // 1960s Kodachrome
  village: { con: 1.06, sat: 1.1, bri: 1.04, tone: ['#FFC97A', 0.16], lift: ['#163024', 0.10], bloom: 0.36 },  // summer haze
  cold: { con: 1.12, sat: 0.82, bri: 0.98, tone: ['#7FB0D0', 0.14], lift: ['#0A2234', 0.16], bloom: 0.28 },
  night: { con: 1.12, sat: 0.9, bri: 0.95, tone: ['#8FA0FF', 0.10], lift: ['#0A1030', 0.18], bloom: 0.42 },
  stream: { con: 1.1, sat: 1.12, bri: 1.0, tone: ['#C68CFF', 0.10], lift: ['#0E1432', 0.14], bloom: 0.45 },   // RGB streamer room
  gold: { con: 1.1, sat: 1.1, bri: 1.04, tone: ['#FFC060', 0.2], lift: ['#24140A', 0.08], bloom: 0.5 },
  bw: { con: 1.28, sat: 0, bri: 1.02, tone: null, lift: ['#101010', 0.08], bloom: 0.25 },
};

const COPY = makeCanvas(), cctx = COPY.getContext('2d');
const BW = W >> 2, BH = H >> 2;
const BLOOM = makeCanvas(BW, BH), bctx = BLOOM.getContext('2d');

export function finish(ctx, src, name = 'neutral', { amount = 1 } = {}) {
  const G = typeof name === 'string' ? GRADES[name] || GRADES.neutral : name;
  if (!G || amount <= 0) return;
  cctx.setTransform(1, 0, 0, 1, 0, 0); cctx.globalCompositeOperation = 'copy'; cctx.drawImage(src, 0, 0);
  // bright pass at quarter size: contrast crushes the mids, the blur spreads what is left
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalCompositeOperation = 'copy';
  bctx.filter = 'brightness(0.75) contrast(3.2) saturate(1.4) blur(3px)'; bctx.drawImage(COPY, 0, 0, BW, BH); bctx.filter = 'none';
  bctx.globalCompositeOperation = 'multiply'; bctx.fillStyle = '#FFC8A0'; bctx.fillRect(0, 0, BW, BH);  // warm halation
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // grade
  ctx.globalCompositeOperation = 'copy'; ctx.filter = `contrast(${G.con}) saturate(${G.sat}) brightness(${G.bri})`;
  ctx.drawImage(COPY, 0, 0); ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  if (G.tone) { ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = rgba(G.tone[0], G.tone[1] * amount); ctx.fillRect(0, 0, W, H); }
  if (G.lift) { ctx.globalCompositeOperation = 'lighten'; ctx.fillStyle = rgba(G.lift[0], G.lift[1] * 6 * amount); ctx.fillRect(0, 0, W, H); }
  // bloom
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = G.bloom * amount; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(BLOOM, 0, 0, W, H);
  ctx.restore();
}
