// Real archival photos as in-scene props: polaroid / framed print / full-screen insert.
import { W, H, C, clamp, lerp, ease, rgba } from './core.js';

export async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

// draw img cover-cropped into a w×h box with Ken Burns zoom (z) and focus (fx, fy in 0..1)
function cover(g, img, x, y, w, h, { z = 1, fx = 0.5, fy = 0.4, tone = 'bw' } = {}) {
  const s = Math.max(w / img.width, h / img.height) * z;
  const sw = w / s, sh = h / s;
  const sx = clamp(fx * img.width - sw / 2, 0, img.width - sw), sy = clamp(fy * img.height - sh / 2, 0, img.height - sh);
  g.save();
  g.filter = tone === 'sepia' ? 'sepia(0.55) contrast(1.08) brightness(0.95)' : tone === 'cold' ? 'grayscale(1) contrast(1.1) brightness(0.9)' : tone === 'warm' ? 'sepia(0.25) contrast(1.05)' : 'grayscale(1) contrast(1.08)';
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  g.restore();
  // print sheen + edge darkening
  const v = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = v; g.fillRect(x, y, w, h);
}

/**
 * Photo card. (x, y) is the card center, w the image width; t0 = appear time (local seconds).
 * style: 'polaroid' (white border, caption, tape) | 'frame' (dark wood frame on a wall) | 'gold'
 */
export function photoCard(g, img, lt, t0, { x = W / 2, y = H / 2, w = 380, aspect = 1.2, rot = 0, style = 'polaroid', caption = '', credit = '',
  tone = 'bw', fx = 0.5, fy = 0.4, zoom = [1.0, 1.12], dur = 4, a = 1, from = 'drop', tape = true } = {}) {
  if (lt < t0) return;
  const u = clamp((lt - t0) / 0.45), e = ease.back(u);
  const h = w * aspect;
  const pad = style === 'polaroid' ? w * 0.06 : style === 'frame' ? w * 0.09 : w * 0.05;
  const bottom = style === 'polaroid' ? w * 0.24 : pad;
  const cw = w + pad * 2, ch = h + pad + bottom;
  g.save(); g.globalAlpha *= a * clamp(u * 2);
  const dx = from === 'right' ? (1 - e) * 700 : from === 'left' ? -(1 - e) * 700 : 0;
  const dy = from === 'drop' ? -(1 - e) * 120 : 0;
  const sc = from === 'drop' ? lerp(1.35, 1, e) : 1;
  g.translate(x + dx, y + dy); g.rotate(rot + (1 - e) * 0.25 * (from === 'left' ? -1 : 1)); g.scale(sc, sc);
  // shadow + paper
  g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  if (style === 'frame') {
    const fr = g.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); fr.addColorStop(0, '#5A3B22'); fr.addColorStop(1, '#2C1B0F');
    g.fillStyle = fr;
  } else if (style === 'gold') {
    const fr = g.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2); fr.addColorStop(0, '#E9C46A'); fr.addColorStop(0.5, '#A8762A'); fr.addColorStop(1, '#E9C46A');
    g.fillStyle = fr;
  } else g.fillStyle = '#F1ECE2';
  g.fillRect(-cw / 2, -ch / 2, cw, ch);
  g.shadowColor = 'transparent';
  if (style === 'frame') { g.fillStyle = '#E8E0D0'; g.fillRect(-w / 2 - pad * 0.35, -ch / 2 + pad * 0.65, w + pad * 0.7, h + pad * 0.7); }
  const kb = lerp(zoom[0], zoom[1], clamp((lt - t0) / dur));
  cover(g, img, -w / 2, -ch / 2 + pad, w, h, { z: kb, fx, fy, tone });
  if (style === 'polaroid') {
    if (caption) { g.fillStyle = '#2B2620'; g.font = `800 ${Math.round(w * 0.075)}px "JetBrains Mono"`; g.textAlign = 'center'; g.letterSpacing = '2px'; g.fillText(caption, 0, ch / 2 - bottom * 0.45); }
    if (credit) { g.fillStyle = 'rgba(43,38,32,0.6)'; g.font = `500 ${Math.round(w * 0.036)}px "JetBrains Mono"`; g.letterSpacing = '0px'; g.fillText(credit, 0, ch / 2 - bottom * 0.12); }
    if (tape) for (const sd of [-1, 1]) {
      g.save(); g.translate(sd * cw * 0.32, -ch / 2 + 4); g.rotate(sd * 0.35);
      g.fillStyle = 'rgba(236,226,196,0.78)'; g.fillRect(-w * 0.13, -w * 0.04, w * 0.26, w * 0.08); g.restore();
    }
  } else if (credit) {
    g.fillStyle = style === 'gold' ? 'rgba(40,24,6,0.8)' : 'rgba(255,240,220,0.65)'; g.font = `500 ${Math.round(Math.max(13, w * 0.04))}px "JetBrains Mono"`; g.textAlign = 'center';
    g.fillText(credit, 0, ch / 2 - pad * 0.25);
  }
  // flash on arrival
  if (u < 1) { g.fillStyle = `rgba(255,255,255,${0.6 * (1 - u)})`; g.fillRect(-cw / 2, -ch / 2, cw, ch); }
  g.restore();
}

// full-screen archival insert: grainy b&w photo with slow push-in
export function photoFull(g, img, lt, { fx = 0.5, fy = 0.4, zoom = [1.05, 1.18], dur = 3, tone = 'bw', credit = '' } = {}) {
  cover(g, img, 0, 0, W, H, { z: lerp(zoom[0], zoom[1], clamp(lt / dur)), fx, fy, tone });
  if (credit) { g.save(); g.font = '500 20px "JetBrains Mono"'; g.fillStyle = 'rgba(255,255,255,0.6)'; g.textAlign = 'right'; g.fillText(credit, W - 30, H - 40); g.restore(); }
}
