// The highest IQs in chess, rumour vs test: a countdown 5 -> 1 with an IQ scale under every player.
// Cut for pace (like the brilliant-moves episode): ~34 short shots — countdown cards with a BOOM, real photos in 2.5D,
// inserts (the stream IQ test, a mental-rotation item, the clickbait feed, Fischer's school file), fly-arounds.
// Only Kasparov's 135 comes from a real, supervised test (Der Spiegel, 1987); Hikaru's 102 is a casual online test on
// stream; Magnus has never released a score (the "190" is internet folklore); Polgar's 170 and Fischer's "180s" are
// reports (Fischer's from a school official quoted in Brady's 1973 biography). Einstein's 160 is an estimate.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, mix, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST, drawChar } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, sans, mono, serif } from '../../engine/js/hud.js';
import { rig, seated, actor, diveOut } from '../../engine/js/stage.js';
import { box, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { spotCone, bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';
import { webcam, chat } from '../../engine/js/witty.js';
import { shockwave, embers } from '../../engine/js/fx.js';

useLookV2();
CAST.judit02 = { ...CAST.judit, suit: '#2B3140', suitD: '#1E2330', scrunchie: null };  // Judit Polgar in 2002 (26), dark top (an open collar showed only its white tip under the hair)
const B = new Board();
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const RED = '#E0503F', GOLD = '#E9B654';
const PH = {};  // real photos (2.5D: each has a depth map from tools/depth.py)
for (const k of ['einstein_1921', 'hikaru2026', 'kasparov_1985a', 'fischer_1972']) PH[k] = await loadPhoto3d(`../episodes/iq/photos/${k}`);
const FISCHER = PH.fischer_1972.img, KASP = PH.kasparov_1985a.img, EIN = PH.einstein_1921.img;

// the start position, as world pieces
const START = (() => {
  const files = 'abcdefgh', back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], out = [];
  for (let i = 0; i < 8; i++) for (const [c, r1, r2] of [['w', 1, 2], ['b', 8, 7]]) {
    out.push({ id: c + back[i] + i, t: back[i], c, x: i + 0.5, z: r1 - 0.5 }, { id: c + 'p' + i, t: 'p', c, x: i + 0.5, z: r2 - 0.5 });
  }
  return out;
})();

// ---------- sets: the hall (dark drapes, warm lamps) and a streamer's room (LED strips), painted and blurred once ----------
const paintBack = style => {
  const w = 1800, h = 1500, c = makeCanvas(w, h), g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, h);
  if (style === 'stream') { bg.addColorStop(0, '#0E1018'); bg.addColorStop(0.6, '#161A26'); bg.addColorStop(1, '#0C0E14'); }
  else { bg.addColorStop(0, '#12171C'); bg.addColorStop(0.55, '#1C252C'); bg.addColorStop(1, '#13181D'); }
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (style === 'stream') {
    for (const [y, col] of [[260, '#7A4DFF'], [980, '#22C7B8']]) {  // two LED strips along the wall
      const gr = g.createLinearGradient(0, y - 90, 0, y + 90); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(0.5, rgba(col, 0.55)); gr.addColorStop(1, rgba(col, 0));
      g.fillStyle = gr; g.fillRect(0, y - 90, w, 180);
    }
    for (let i = 0; i < 4; i++) {  // shelves with small glowing objects, acoustic panels
      g.fillStyle = '#1D2230'; g.fillRect(120 + i * 430, 420, 300, 380);
      g.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 4; k++) g.fillRect(140 + i * 430, 440 + k * 92, 260, 70);
    }
  } else {
    for (let x = 0; x < w; x += 70) {
      const fg = g.createLinearGradient(x, 0, x + 70, 0); fg.addColorStop(0, 'rgba(0,0,0,0.3)'); fg.addColorStop(0.5, 'rgba(120,150,170,0.06)'); fg.addColorStop(1, 'rgba(0,0,0,0.3)');
      g.fillStyle = fg; g.fillRect(x, 0, 70, h * 0.78);
    }
    const wy = h * 0.78, wg = g.createLinearGradient(0, wy, 0, h); wg.addColorStop(0, '#5E4A3A'); wg.addColorStop(1, '#3A2E25');
    g.fillStyle = wg; g.fillRect(0, wy, w, h - wy); g.fillStyle = '#7A6450'; g.fillRect(0, wy - 8, w, 12);
    for (let i = 0; i < 7; i++) {
      const x = 160 + i * 250, gr = g.createRadialGradient(x, 120, 0, x, 120, 90); gr.addColorStop(0, 'rgba(255,214,160,0.9)'); gr.addColorStop(1, 'rgba(255,214,160,0)');
      g.fillStyle = gr; g.fillRect(x - 90, 30, 180, 180);
    }
  }
  const out = makeCanvas(w, h), o = out.getContext('2d'); o.filter = 'blur(11px)'; o.drawImage(c, 0, 0); return out;
};
const BACKS = { hall: paintBack('hall'), stream: paintBack('stream') };
function backdrop(g, t, style = 'hall') {
  const ox = -Math.sin(B.yaw) * 700, oy = (B.pitch - 0.3) * 520, im = BACKS[style];
  g.drawImage(im, -360 + ox, -120 + oy, W + 720, (W + 720) * im.height / im.width);
  bokeh(g, t, { n: 12, seed: style === 'stream' ? 7 : 4, y0: 0.04, y1: 0.4, a: 0.14, size: [30, 80], colors: style === 'stream' ? ['#9C7BFF', '#5FE0D2', '#FFE9C8'] : undefined });
}
function gameTable(g) {
  box(g, B, [3.3, -3.2, 3.3], [4.7, -1.6, 4.7], { top: '#2A1610', side: '#1E100B', front: '#24130D' });
  box(g, B, [-1.4, -1.6, -1.4], [9.4, -0.35, 9.4], { top: '#6E3A28', side: '#3A1E14', front: '#4E2A1C' });
  if (depth(4, 0, 4) > 0.5) pool(g, B, 4, -0.33, 4, 7, '#FFE8C8', 0.2);
}

// a player behind the board (far side), the camera on the near side; `dark` 0..1 turns the shot into a backlit silhouette
const FRONT = (yaw = 0.1, push = 0) => ({ yaw, pitch: 0.3, dist: 7.4 - push, fov: 1500, cy: H * 0.46, target: [4, 2.9, 9.2] });
function portrait(g, lt, t, who, e, { keys = null, push = 0.5, yaw = 0.1, back = 'hall', dark = 0, extra = null, pieces = START } = {}) {
  rig(B, lt, keys || [[0, FRONT(yaw)], [3, FRONT(yaw * 0.4, push)]], { t });
  backdrop(g, t, back);
  if (dark > 0) {  // backlight: a bright halo behind the head and a shaft from a lamp behind him
    spotCone(g, B, { top: [4, 16, 11.5], base: [4, 0, 10.6], r0: 0.5, r1: 3.2, a: 0.28 * dark, t, dust: 30, seed: 11 });
    const p = B.project(4, 3.1, 9.9), gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4.2);
    gr.addColorStop(0, rgba('#FFE4BC', 0.95 * dark)); gr.addColorStop(0.35, rgba('#FFC98A', 0.45 * dark)); gr.addColorStop(1, rgba('#FFC98A', 0));
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  let hands = null;
  if (dark >= 0.999) actor(g, B, who, { x: 4, y: 3.1, z: 9.4, e: 'neutral', t, face: -1, silhouette: true, shade: 'brightness(0.06)' });
  else hands = seated(g, B, who, e, t, { z: 9.4 });
  gameTable(g); B.drawSlab(g, SLATE); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.6 }); if (hands) hands();
  if (extra) extra();
  spotCone(g, B, { top: [4, 18, 9.2], base: [4, 0, 9.2], r0: 0.6, r1: 4.5, a: 0.12, t });
  lowKey(g, { cy: H * 0.4 });
  if (dark > 0) { const v = g.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.4, H * 0.75); v.addColorStop(0, `rgba(3,4,7,${0.25 * dark})`); v.addColorStop(1, `rgba(3,4,7,${0.85 * dark})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
}
const headAt = (z = 9.4, lift = 3.1) => { const p = B.project(4, lift, z); return { x: p.x, y: p.y, s: p.s * 1.05 / 100 }; };

// ---------- the IQ scale (screen layer, under the captions) ----------
const IQX = v => 150 + (W - 300) * clamp((v - 70) / 130);
function iqScale(g, v, { a = 1, y = 1660, unknown = false, ghost = false, einstein = 0, you = null } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(8,11,15,0.78)'; g.beginPath(); g.roundRect(80, y - 300, W - 160, 400, 26); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#2A333B'; g.beginPath(); g.roundRect(150, y - 8, W - 300, 16, 8); g.fill();
  if (!unknown && v > 70) {
    const gr = g.createLinearGradient(150, 0, IQX(v), 0); gr.addColorStop(0, ghost ? '#4A5058' : '#7A5A22'); gr.addColorStop(1, ghost ? '#8A9098' : GOLD);
    g.fillStyle = gr; g.beginPath(); g.roundRect(150, y - 8, IQX(v) - 150, 16, 8); g.fill();
  }
  g.textAlign = 'center';
  for (const [tv, name, k] of [[100, 'AVERAGE', 0], [160, 'EINSTEIN (EST.)', einstein]]) {
    const x = IQX(tv), col = k > 0 ? GOLD : '#AEB8C0';
    g.fillStyle = col; g.fillRect(x - 2, y - 26, 4, 52);
    g.font = mono(26, 800); g.fillText(String(tv), x, y + 62);
    g.font = sans(19, 800); g.letterSpacing = '3px'; g.fillText(name, x, y - 38); g.letterSpacing = '0px';
    if (k > 0) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(x, y, 0, x, y, 70); gr.addColorStop(0, rgba(GOLD, 0.5 * k)); gr.addColorStop(1, rgba(GOLD, 0)); g.fillStyle = gr; g.fillRect(x - 70, y - 70, 140, 140); g.restore(); }
  }
  if (!unknown) {  // the marker
    const x = IQX(v); g.fillStyle = ghost ? '#C8CDD2' : '#FFFFFF';
    g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x - 13, y - 36); g.lineTo(x + 13, y - 36); g.closePath(); g.fill();
    g.fillRect(x - 2, y - 14, 4, 28);
  }
  if (you) {  // the viewer: a blinking marker wandering between 100 and 150
    const x = IQX(you.v), bl = 0.55 + 0.45 * Math.sin(you.t * 8);
    g.globalAlpha *= bl; g.fillStyle = '#3FE0C5'; g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x - 13, y + 36); g.lineTo(x + 13, y + 36); g.closePath(); g.fill();
    g.font = sans(24, 900); g.letterSpacing = '4px'; g.fillText('YOU?', x, y + 92); g.letterSpacing = '0px';
  }
  qaRect(g, 120, y - 60, W - 240, 140, 'text', 'iq scale');  // the strip with the ticks (the number above it sits on the same plate by design)
  g.restore();
}
// the number above the scale: '???' (and no marker) until the count, then 70 -> v, landing at tl
const iqAt = (t, tl, v, d = 0.55) => Math.round(lerp(70, v, ease.out(seg(t, tl - d, tl))));
const iqHidden = (t, tl, d = 0.55) => t < tl - d;
const iqText = (t, tl, v, d = 0.55) => iqHidden(t, tl, d) ? '???' : String(iqAt(t, tl, v, d));
function iqNumber(g, text, { a = 1, y = 1540, color = C.cream, label = 'IQ', labelColor = GOLD, scale = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.translate(W / 2, y); g.scale(scale, scale); g.translate(-W / 2, -y);
  counter(g, text, null, { y, size: 150, a, color });
  g.font = sans(30, 900); g.letterSpacing = '8px'; g.textAlign = 'center'; g.globalAlpha *= a; g.fillStyle = labelColor;
  g.fillText(label, W / 2, y - 132); g.restore();
}
// rank numeral, top left, and the name title in the middle
function rank(g, lt, n, name, sub, a = 1) {
  const u = ease.out(clamp(lt / 0.35)) * a; if (u <= 0) return;
  g.save(); g.globalAlpha *= u; g.textAlign = 'left';
  g.font = sans(22, 900); g.letterSpacing = '6px'; g.fillStyle = rgba(C.cream, 0.7); g.fillText('NO.', 70, 150);
  g.font = serif(190, 700); g.letterSpacing = '0px'; g.fillStyle = GOLD; g.fillText(String(n), 62, 320 + (1 - u) * 20);
  qaRect(g, 62, 120, 130, 210, 'text', 'rank ' + n);
  g.restore();
  nameTitle(g, lt, name, sub, { y: 240, size: 62, a });
}
// a photo card (real photograph, credited) pinned at a slight angle
function photoCard(g, im, x, y, w, rot, credit, a = 1, crop = null) {
  if (a <= 0) return;
  const [sx, sy, sw, sh] = crop || [0, 0, im.width, im.height], h = w * sh / sw;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
  g.fillStyle = '#EDE6D6'; g.fillRect(-w / 2 - 14, -h / 2 - 14, w + 28, h + 66); g.shadowColor = 'transparent';
  g.filter = 'sepia(0.12) contrast(1.05)'; g.drawImage(im, sx, sy, sw, sh, -w / 2, -h / 2, w, h); g.filter = 'none';
  g.fillStyle = '#5A5248'; g.font = sans(13, 700); g.textAlign = 'center'; g.fillText(credit, 0, h / 2 + 34);
  qaRect(g, -w / 2 - 14, -h / 2 - 14, w + 28, h + 66, 'text', 'photo');
  g.restore();
}
// wooden table for paper inserts
function deskInsert(g, t) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2A1810'); gr.addColorStop(0.5, '#5A3324'); gr.addColorStop(1, '#2A1810');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = rng(3); g.strokeStyle = 'rgba(20,10,6,0.25)'; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const y = r() * H; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 20, W * 0.6, y - 20, W, y + 10); g.stroke(); }
  const pg = g.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.45, W * 0.9); pg.addColorStop(0, 'rgba(255,226,180,0.22)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = pg; g.fillRect(0, 0, W, H); lowKey(g, { cy: H * 0.45, a: 0.6 });
}
// the 1987 test sheet: a matrix puzzle with one blank, a pencil, the real photo clipped on
function testSheet(g, lt) {
  g.save(); g.translate(W / 2, 760); g.rotate(-0.025);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = '#EFE9DC'; g.fillRect(-400, -470, 800, 940); g.shadowColor = 'transparent';
  g.fillStyle = '#2A2622'; g.textAlign = 'left'; g.font = sans(24, 800); g.letterSpacing = '6px';
  g.fillText('1987 · MAGAZINE IQ TEST', -340, -400); g.letterSpacing = '0px'; g.fillRect(-340, -380, 680, 3);
  g.font = serif(42, 700); g.fillText('Which shape is missing?', -340, -320);
  qaRect(g, -340, -440, 680, 140, 'text', 'test title');
  const cell = 150, x0 = -230, y0 = -260, sh = ['circle', 'square', 'tri'];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = x0 + j * cell, y = y0 + i * cell;
    g.strokeStyle = '#3A342E'; g.lineWidth = 3; g.strokeRect(x, y, cell - 10, cell - 10);
    if (i === 2 && j === 2) { g.font = serif(90, 700); g.fillStyle = '#B03A2E'; g.textAlign = 'center'; g.fillText('?', x + (cell - 10) / 2, y + 108); g.textAlign = 'left'; continue; }
    const k = (i + j) % 3, n = j + 1, cx = x + (cell - 10) / 2, cy = y + (cell - 10) / 2;
    g.fillStyle = '#2A2622';
    for (let m = 0; m < n; m++) {
      const dx = (m - (n - 1) / 2) * 34;
      g.beginPath();
      if (sh[k] === 'circle') g.arc(cx + dx, cy, 14, 0, 7);
      else if (sh[k] === 'square') g.rect(cx + dx - 13, cy - 13, 26, 26);
      else { g.moveTo(cx + dx, cy - 16); g.lineTo(cx + dx + 15, cy + 13); g.lineTo(cx + dx - 15, cy + 13); g.closePath(); }
      g.fill();
    }
  }
  g.fillStyle = 'rgba(42,38,34,0.25)'; for (let i = 0; i < 3; i++) g.fillRect(-340, 250 + i * 40, 600 - i * 120, 12);
  g.restore();
  photoCard(g, KASP, W / 2 + 225, 1060, 240, 0.07, 'GARRY KASPAROV, 1985 · ROB BOGAERTS / ANEFO · CC0', 1, [80, 60, 1120, 1300]);
  // a pencil across the sheet
  g.save(); g.translate(W / 2 - 170, 1230); g.rotate(-0.35 + Math.sin(lt * 2) * 0.02);
  g.fillStyle = '#E9B654'; g.fillRect(-180, -14, 300, 28); g.fillStyle = '#F3D9B4'; g.beginPath(); g.moveTo(120, -14); g.lineTo(170, 0); g.lineTo(120, 14); g.closePath(); g.fill();
  g.fillStyle = '#2A2622'; g.beginPath(); g.moveTo(155, -5); g.lineTo(170, 0); g.lineTo(155, 5); g.closePath(); g.fill();
  g.fillStyle = '#C9837A'; g.fillRect(-210, -14, 32, 28); g.restore();
}
// the streamer's overlay: a LIVE pill and a chat column
function streamOverlay(g, t, t0) {
  const a = seg(t, t0, t0 + 0.2); if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = '#D93A30'; g.beginPath(); g.roundRect(W - 230, 110, 150, 52, 12); g.fill();
  g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(W - 202, 136, 8, 0, 7); g.fill();
  g.font = sans(28, 900); g.letterSpacing = '4px'; g.textAlign = 'left'; g.fillText('LIVE', W - 186, 146); g.letterSpacing = '0px';
  qaRect(g, W - 230, 110, 150, 52, 'text', 'live');
  const msgs = [['knight_rider', 'what is this test lol'], ['gm_fan', 'hikaru reading chat 💀'], ['tal_enjoyer', 'focus!!'], ['blitz4life', 'type faster'], ['e4e5', 'it’s a triangle']];
  const shown = Math.floor(clamp((t - t0) / 0.45, 0, msgs.length));
  for (let i = 0; i < shown; i++) {  // a narrow column at the left edge, beside the face: user name over the message
    const y = 1000 - (shown - 1 - i) * 74, [u, m] = msgs[i];
    g.fillStyle = 'rgba(8,11,15,0.66)'; g.beginPath(); g.roundRect(34, y - 54, 268, 66, 10); g.fill();
    g.font = sans(19, 800); g.fillStyle = ['#7FD3FF', '#FFB86B', '#B6FF7A', '#FF8AD6', '#C9A7FF'][i]; g.fillText(u, 48, y - 30);
    g.font = sans(21, 700); g.fillStyle = '#E9ECEE'; g.fillText(m, 48, y - 4);
  }
  qaRect(g, 34, 1000 - (msgs.length - 1) * 74 - 54, 268, msgs.length * 74, 'text', 'chat');
  g.restore();
}
// a stamp across the number (Magnus: no score released)
function noScore(g, a, sc) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(W / 2, 1490); g.rotate(-0.1); g.scale(sc, sc);
  g.strokeStyle = RED; g.lineWidth = 8; g.strokeRect(-250, -62, 500, 124);
  g.fillStyle = RED; g.font = sans(70, 900); g.letterSpacing = '6px'; g.textAlign = 'center'; g.fillText('NO SCORE', 0, 25);
  g.restore(); qaRect(g, W / 2 - 260, 1420, 520, 140, 'text', 'no score');
}
// Moscow 2002: Polgar 1-0 Kasparov
function resultPlate(g, a, y = 1540) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(8,11,15,0.84)'; g.beginPath(); g.roundRect(110, y - 190, W - 220, 260, 24); g.fill();
  g.textAlign = 'center'; g.font = sans(26, 800); g.letterSpacing = '6px'; g.fillStyle = GOLD; g.fillText('MOSCOW · 2002 · RAPID', W / 2, y - 120);
  g.letterSpacing = '0px'; g.font = sans(54, 900);
  g.textAlign = 'right'; g.fillStyle = C.cream; g.fillText('POLGAR', W / 2 - 80, y - 20);
  g.textAlign = 'center'; g.fillStyle = GOLD; g.fillText('1–0', W / 2, y - 20);
  g.textAlign = 'left'; g.fillStyle = '#9AA4AC'; g.fillText('KASPAROV', W / 2 + 80, y - 20);
  qaRect(g, 110, y - 190, W - 220, 260, 'text', 'result');
  g.restore();
}
// a small-caps tag on a dark plate
function tag(g, text, y, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.font = sans(30, 900); g.letterSpacing = '6px'; g.textAlign = 'center';
  const w = g.measureText(text).width + 50;
  g.fillStyle = 'rgba(8,11,15,0.8)'; g.beginPath(); g.roundRect(W / 2 - w / 2, y - 40, w, 58, 12); g.fill();
  g.fillStyle = C.cream; g.fillText(text, W / 2, y); qaRect(g, W / 2 - w / 2, y - 40, w, 58, 'text', text);
  g.restore();
}
function crown(g, x, y, s, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  const gr = g.createLinearGradient(0, -120, 0, 0); gr.addColorStop(0, '#F6D774'); gr.addColorStop(1, '#C8902E');
  g.fillStyle = gr; g.beginPath(); g.moveTo(-82, 0); g.lineTo(-96, -96); g.lineTo(-46, -50); g.lineTo(0, -118); g.lineTo(46, -50); g.lineTo(96, -96); g.lineTo(82, 0); g.closePath(); g.fill();
  g.fillStyle = '#B07A22'; g.fillRect(-84, -14, 168, 18);
  for (const [cx, cy] of [[-96, -98], [0, -122], [96, -98]]) { g.fillStyle = '#F6D774'; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill(); }
  for (const [cx, col] of [[-44, '#3C6FD0'], [0, '#C8283A'], [44, '#3C6FD0']]) { g.fillStyle = col; g.beginPath(); g.arc(cx, -24, 9, 0, 7); g.fill(); }
  g.restore();
}

// ---------- v2 cut: countdown cards, the hook lineup, real photos, inserts ----------
const lin = x => x;
// the rank numeral alone (top left), for the later shots of a player
function rankTag(g, n, a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.textAlign = 'left';
  g.font = sans(22, 900); g.letterSpacing = '6px'; g.fillStyle = rgba(C.cream, 0.7); g.fillText('NO.', 70, 150);
  g.font = serif(190, 700); g.letterSpacing = '0px'; g.fillStyle = GOLD; g.fillText(String(n), 62, 320);
  qaRect(g, 62, 120, 130, 210, 'text', 'rank ' + n);
  g.restore();
}

// countdown card: the player's backlit silhouette, a giant numeral punching in from the lens on the word, the ladder 5..1
const LADDER = [5, 4, 3, 2, 1];
function rankSlam(g, lt, t, n, hitT, who) {
  const gold = n === 1, land = t >= hitT, u = seg(t, hitT - 0.16, hitT, lin);
  const bg = g.createRadialGradient(W / 2, H * 0.38, 40, W / 2, H * 0.42, H * 0.85);
  bg.addColorStop(0, gold ? '#2E2416' : '#1C252D'); bg.addColorStop(1, '#06080A');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 12, seed: 30 + n, y0: 0.03, y1: 0.9, a: 0.1, colors: gold ? ['#FFD9A0', '#FFE9C8'] : undefined });
  const hc = gold ? '#FFC98A' : '#A9C8E8', halo = g.createRadialGradient(W / 2, 690, 0, W / 2, 690, 640);
  halo.addColorStop(0, rgba(hc, 0.42)); halo.addColorStop(1, rgba(hc, 0));
  g.fillStyle = halo; g.fillRect(0, 0, W, H);
  drawChar(g, who, { x: W / 2, y: 730 - ease.out(clamp(lt / 0.9)) * 36, s: 1.45, e: EXPR.neutral, t, silhouette: true, shade: 'brightness(0.04)' });
  const fl = g.createLinearGradient(0, 1080, 0, H); fl.addColorStop(0, 'rgba(6,8,10,0)'); fl.addColorStop(0.3, 'rgba(6,8,10,0.94)'); fl.addColorStop(1, '#06080A');
  g.fillStyle = fl; g.fillRect(0, 1080, W, H - 1080);
  if (t > hitT - 0.16) {  // the numeral (a graphic, not text for QA: it sits over the silhouette on purpose)
    const k = lerp(3.4, 1, ease.in(u)) * (land ? 1 + 0.06 * Math.exp(-(t - hitT) * 10) : 1);
    g.save(); g.translate(W / 2, 1040); g.scale(k, k); g.globalAlpha = clamp(u * 2.5);
    g.font = serif(720, 700); g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(String(n), 12, 26);
    const gr = g.createLinearGradient(0, -500, 0, 0); gr.addColorStop(0, gold ? '#FFE7A8' : '#F6EFE2'); gr.addColorStop(1, gold ? '#C8902E' : '#AEB9C2');
    g.fillStyle = gr; g.fillText(String(n), 0, 0);
    g.restore();
  }
  if (land) shockwave(g, W / 2, 800, t, hitT, { r0: 80, r1: 780, life: 0.5, color: gold ? GOLD : '#DCE6EE', lw: 12, squash: 1 });
  LADDER.forEach((m, i) => {  // the countdown so far: done (dim), this one (lit), still to come (outlined)
    const x = W / 2 + (i - 2) * 132, cur = m === n, done = m > n, k = cur ? lerp(1.6, 1, seg(t, hitT, hitT + 0.25, ease.back)) : 1;
    g.save(); g.translate(x, 1560); g.scale(k, k);
    g.beginPath(); g.arc(0, 0, cur ? 44 : 34, 0, 7);
    if (cur && land) { g.fillStyle = gold ? GOLD : C.cream; g.fill(); }
    else if (done) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill(); }
    else { g.strokeStyle = 'rgba(243,235,221,0.45)'; g.lineWidth = 3; g.stroke(); }
    g.font = sans(cur ? 40 : 30, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = cur && land ? C.ink : done ? 'rgba(243,235,221,0.35)' : 'rgba(243,235,221,0.75)';
    g.fillText(String(m), 0, 2);
    g.restore();
  });
  qaRect(g, W / 2 - 310, 1514, 620, 92, 'text', 'ladder');
}

// the hook: five silhouettes on a stage, rank numbers over their heads (number one in gold)
const LINE = [['hikaru', 5], ['kasparov', 4], ['magnus', 3], ['judit02', 2], ['bobby72', 1]];
const LX = i => -6.6 + i * 3.3;
const LPOSE = (x, dist, yaw = 0, y = 3.4) => ({ yaw, pitch: 0.1, dist, fov: 1500, cy: H * 0.5, target: [x, y, 9.4] });
function lineup(g, lt, t, keys) {
  rig(B, lt, keys, { t });
  backdrop(g, t, 'hall');
  LINE.forEach(([, n], i) => spotCone(g, B, { top: [LX(i), 15, 10.2], base: [LX(i), 0, 9.6], r0: 0.35, r1: 1.9, a: n === 1 ? 0.34 : 0.15, t, dust: 10, seed: 5 + i, color: n === 1 ? '#FFE0B0' : '#E2ECF6' }));
  LINE.forEach(([who], i) => actor(g, B, who, { x: LX(i), y: 3.1, z: 9.4, e: 'neutral', t, face: -1, silhouette: true, shade: 'brightness(0.06)' }));
  box(g, B, [-14, -3.2, 7.4], [22, 0.3, 8.6], { top: '#20272C', side: '#0E1215', front: '#161B1F' });
  lowKey(g, { cy: H * 0.42, a: 0.45 });
  LINE.forEach(([, n], i) => {
    const p = B.project(LX(i), 6.1, 9.4); if (p.z < 0.6) return;
    g.save(); g.textAlign = 'center'; g.font = serif(Math.max(20, Math.round(p.s * (n === 1 ? 1.5 : 1.1))), 700);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowOffsetY = 5; g.fillStyle = n === 1 ? GOLD : rgba(C.cream, 0.8); g.fillText(String(n), p.x, p.y); g.restore();
  });
}

// a real photograph in 2.5D, dropped below a dark band that carries the title (names sit at the top, above the head)
const DROP = 330;
function photoShot(g, lt, ph, { from, to, dur }) {
  g.fillStyle = '#0B0E11'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, DROP); photo3d(g, ph, lt, { from, to, dur, e: lin }); g.restore();
  const gr = g.createLinearGradient(0, DROP - 20, 0, DROP + 250); gr.addColorStop(0, '#0B0E11'); gr.addColorStop(1, 'rgba(11,14,17,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, DROP + 250);
}
function photoTitle(g, lt, name, sub, credit) {
  nameTitle(g, lt, name, sub, { y: 200, size: 66 });
  g.save(); g.globalAlpha *= seg(lt, 0.2, 0.4) * 0.75; g.font = sans(17, 700); g.letterSpacing = '2px'; g.textAlign = 'center'; g.fillStyle = C.cream;
  g.fillText(credit, W / 2, 314); g.restore();
}

// the hook's scale, full screen: number one's marker runs past Einstein's tick (his real photo on it) and keeps going
const BX = v => 110 + (W - 220) * clamp((v - 70) / 130);
function bigScale(g, lt, t, runT, passT) {
  const bg = g.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.45, H * 0.8); bg.addColorStop(0, '#1C242B'); bg.addColorStop(1, '#06080A');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  bokeh(g, t, { n: 10, seed: 41, y0: 0.05, y1: 0.7, a: 0.1 });
  const y = 1040, lit = t >= passT;
  const v = !lit ? lerp(70, 160, ease.inOut(seg(t, runT, passT, lin))) : lerp(160, 186, ease.out(seg(t, passT, passT + 0.5, lin)));
  g.textAlign = 'center'; g.font = sans(30, 900); g.letterSpacing = '8px'; g.fillStyle = GOLD; g.fillText('NUMBER ONE', W / 2, 250); g.letterSpacing = '0px';
  g.save(); g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(10,8,6,0.55)'; g.font = sans(170, 900); g.strokeText('???', W / 2, 430);
  g.fillStyle = C.cream; g.fillText('???', W / 2, 430); g.restore();
  qaRect(g, W / 2 - 230, 215, 460, 225, 'text', 'number one');
  // Einstein on his tick
  const ex = BX(160), ey = 760, k = lit ? 1 + 0.18 * Math.exp(-(t - passT) * 7) : 1;
  if (lit) { g.save(); g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(ex, ey, 60, ex, ey, 300); gl.addColorStop(0, rgba(GOLD, 0.45 * Math.exp(-(t - passT) * 2.5))); gl.addColorStop(1, rgba(GOLD, 0)); g.fillStyle = gl; g.fillRect(ex - 300, ey - 300, 600, 600); g.restore(); }
  g.fillStyle = lit ? GOLD : '#8A949C'; g.fillRect(ex - 2, ey + 100, 4, y - 30 - ey - 100);
  g.save(); g.translate(ex, ey); g.scale(k, k);
  g.fillStyle = lit ? GOLD : '#8A949C'; g.beginPath(); g.arc(0, 0, 112, 0, 7); g.fill();
  g.beginPath(); g.arc(0, 0, 102, 0, 7); g.clip(); g.filter = 'sepia(0.25)'; g.drawImage(EIN, 385, 175, 320, 320, -102, -102, 204, 204); g.filter = 'none';
  g.restore();
  g.font = sans(26, 900); g.letterSpacing = '5px'; g.fillStyle = lit ? GOLD : '#AEB8C0'; g.fillText('EINSTEIN · EST.', ex, ey - 138); g.letterSpacing = '0px';
  qaRect(g, ex - 150, ey - 170, 300, 44, 'text', 'einstein label');
  // the track
  g.fillStyle = '#2A333B'; g.beginPath(); g.roundRect(110, y - 12, W - 220, 24, 12); g.fill();
  if (t >= runT) { const gr = g.createLinearGradient(110, 0, BX(v), 0); gr.addColorStop(0, '#7A5A22'); gr.addColorStop(1, GOLD); g.fillStyle = gr; g.beginPath(); g.roundRect(110, y - 12, Math.max(24, BX(v) - 110), 24, 12); g.fill(); }
  for (const tv of [70, 100, 130, 160, 190]) { const x = BX(tv); g.fillStyle = tv === 160 && lit ? GOLD : '#AEB8C0'; g.fillRect(x - 3, y - 30, 6, 60); g.font = mono(32, 800); g.fillText(String(tv), x, y + 84); }
  g.font = sans(22, 900); g.letterSpacing = '4px'; g.fillStyle = '#AEB8C0'; g.fillText('AVERAGE', BX(100), y + 124); g.letterSpacing = '0px';
  qaRect(g, 90, y - 40, W - 180, 180, 'text', 'big scale');
  if (t >= runT) {  // number one's marker, with its tag
    const x = BX(v); g.fillStyle = '#FFFFFF';
    g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x - 20, y - 52); g.lineTo(x + 20, y - 52); g.closePath(); g.fill(); g.fillRect(x - 3, y - 18, 6, 36);
    g.fillStyle = GOLD; g.beginPath(); g.roundRect(x - 48, y - 112, 96, 48, 10); g.fill();
    g.fillStyle = C.ink; g.font = sans(28, 900); g.fillText('NO. 1', x, y - 78);
  }
}

// shapes for the puzzles: n circles / squares / triangles in a row
function glyphs(g, kind, n, cx, cy, r, col) {
  g.fillStyle = col;
  for (let m = 0; m < n; m++) {
    const dx = (m - (n - 1) / 2) * r * 2.5;
    g.beginPath();
    if (kind === 'circle') g.arc(cx + dx, cy, r, 0, 7);
    else if (kind === 'square') g.rect(cx + dx - r * 0.92, cy - r * 0.92, r * 1.84, r * 1.84);
    else { g.moveTo(cx + dx, cy - r * 1.15); g.lineTo(cx + dx + r * 1.05, cy + r * 0.9); g.lineTo(cx + dx - r * 1.05, cy + r * 0.9); g.closePath(); }
    g.fill();
  }
}
function cursor(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s * 1.7, s * 1.7);
  g.fillStyle = '#FFFFFF'; g.strokeStyle = '#111111'; g.lineWidth = 1.6; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 26); g.lineTo(7, 20); g.lineTo(12, 31); g.lineTo(16, 29); g.lineTo(11, 18); g.lineTo(19, 18); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

// Hikaru's stream: a free online IQ test in the browser, his webcam, chat scrolling
const CHAT_IQ = [['gm_fan', 'question 7 already??'], ['knight_rider', 'answer is C'], ['tal_enjoyer', 'focus!!'], ['blitz4life', 'chat is helping lol'], ['e4e5', 'not C, D'], ['pawnstorm', 'speedrun any%']];
function streamTest(g, lt, t, t0) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#171428'); bg.addColorStop(1, '#08070E'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#D93A30'; g.beginPath(); g.roundRect(50, 56, 132, 48, 10); g.fill(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(76, 80, 7, 0, 7); g.fill();
  g.font = sans(26, 900); g.letterSpacing = '4px'; g.textAlign = 'left'; g.fillText('LIVE', 92, 90); g.letterSpacing = '0px';
  qaRect(g, 50, 56, 132, 48, 'text', 'live');
  const X = 50, Y = 130, Wd = 980, Hd = 700;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#F4F2EE'; g.beginPath(); g.roundRect(X, Y, Wd, Hd, 18); g.fill(); g.restore();
  g.fillStyle = '#2A2838'; g.beginPath(); g.roundRect(X, Y, Wd, 60, [18, 18, 0, 0]); g.fill();
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(X + 34 + i * 28, Y + 30, 8, 0, 7); g.fill(); });
  g.fillStyle = '#3A384A'; g.beginPath(); g.roundRect(X + 140, Y + 13, Wd - 280, 34, 17); g.fill();
  const next = t > t0 + 1.15, q = next ? 8 : 7;
  g.fillStyle = '#1E2230'; g.font = sans(38, 900); g.textAlign = 'left'; g.fillText('FREE ONLINE IQ TEST', X + 46, Y + 128);
  g.font = sans(24, 800); g.letterSpacing = '3px'; g.fillStyle = '#6A6F7C'; g.fillText(`QUESTION ${q} OF 30`, X + 46, Y + 170); g.letterSpacing = '0px';
  qaRect(g, X + 46, Y + 92, 480, 88, 'text', 'iq test header');
  g.textAlign = 'right'; g.font = mono(30, 800); g.fillStyle = '#D93A30'; g.fillText(`00:${String(47 - Math.floor(Math.max(0, t - t0))).padStart(2, '0')}`, X + Wd - 46, Y + 128);
  g.fillStyle = '#E2DED6'; g.fillRect(X + 46, Y + 196, Wd - 92, 10); g.fillStyle = '#7A5CFF'; g.fillRect(X + 46, Y + 196, (Wd - 92) * q / 30, 10);
  const cell = 118, mx = X + 60, my = Y + 250;  // the matrix, one blank
  g.textAlign = 'center';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = mx + j * cell, y = my + i * cell; g.strokeStyle = '#C9C4BA'; g.lineWidth = 3; g.strokeRect(x, y, cell - 10, cell - 10);
    if (i === 2 && j === 2) { g.fillStyle = '#7A5CFF'; g.font = sans(64, 900); g.fillText('?', x + 54, y + 78); continue; }
    glyphs(g, ['circle', 'square', 'tri'][(i + j) % 3], j + 1, x + 54, y + 54, 13, '#2A2E3A');
  }
  const ax = X + 520, ay = Y + 262, sel = t > t0 + 0.82 && !next;  // four answers; he clicks D (the answer is C)
  ['circle', 'tri', 'square', 'tri'].forEach((k, i) => {
    const x = ax + (i % 2) * 210, y = ay + Math.floor(i / 2) * 196, on = sel && i === 3;
    g.fillStyle = on ? '#E6E0FF' : '#FFFFFF'; g.strokeStyle = on ? '#7A5CFF' : '#C9C4BA'; g.lineWidth = on ? 5 : 3;
    g.beginPath(); g.roundRect(x, y, 180, 170, 14); g.fill(); g.stroke();
    glyphs(g, k, [2, 3, 3, 3][i], x + 90, y + 92, 12, '#2A2E3A');
    g.font = sans(22, 900); g.fillStyle = '#9AA0AA'; g.textAlign = 'left'; g.fillText('ABCD'[i], x + 14, y + 32);
  });
  const cu = ease.inOut(seg(t, t0 + 0.2, t0 + 0.72, lin)), click = t > t0 + 0.8 && t < t0 + 0.9;
  cursor(g, lerp(X + 880, ax + 300, cu), lerp(Y + 680, ay + 300, cu), click ? 0.85 : 1);
  webcam(g, 50, 880, 450, 290, 'hikaru', exprAt([[0, { ...EXPR.focus, look: [0.5, -0.3] }], [1.0, { ...EXPR.happy, look: [0.7, 0.1] }]], lt), t, { name: 'HIKARU', zoom: 1.1, cy: 0.62 });
  chat(g, 540, 1160, t, t0 - 0.9, { n: 5, w: 490, lines: CHAT_IQ });
}

// a mental-rotation item drawn as cubes (orthographic, painter-sorted faces)
const POLY = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 2, 1], [2, 2, 2]];
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function cubes(g, cx, cy, size, yaw, pitch, list, col) {
  const has = new Set(list.map(p => p.join(','))), c = [0, 1, 2].map(k => list.reduce((s, p) => s + p[k], 0) / list.length);
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const R = ([x, y, z]) => { const X = x * cyw + z * syw, Z = -x * syw + z * cyw; return [X, y * cp - Z * sp, y * sp + Z * cp]; };
  const faces = [];
  for (const p of list) for (const d of DIRS) {
    if (has.has([p[0] + d[0], p[1] + d[1], p[2] + d[2]].join(','))) continue;
    const nrm = R(d); if (nrm[2] > -0.001) continue;  // the camera looks down +z: only faces turned toward it
    const [a, b] = d[0] ? [[0, 1, 0], [0, 0, 1]] : d[1] ? [[1, 0, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0]];
    const o = [0, 1, 2].map(k => p[k] - c[k] + d[k] * 0.5);
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => R([0, 1, 2].map(k => o[k] + (a[k] * u + b[k] * v) * 0.5)));
    faces.push({ pts, z: pts.reduce((s, q) => s + q[2], 0) / 4, light: clamp(0.5 + 0.5 * (-nrm[2] * 0.55 + nrm[1] * 0.45 - nrm[0] * 0.15)) });
  }
  faces.sort((A, Bf) => Bf.z - A.z);
  g.lineJoin = 'round';
  for (const f of faces) {
    g.beginPath(); f.pts.forEach(([x, y], i) => (i ? g.lineTo(cx + x * size, cy - y * size) : g.moveTo(cx + x * size, cy - y * size))); g.closePath();
    g.fillStyle = mix('#10141A', col, 0.35 + 0.65 * f.light); g.fill(); g.strokeStyle = '#1A1E24'; g.lineWidth = 3; g.stroke();
  }
}
function rotationTest(g, lt, t) {
  deskInsert(g, t);
  const u = ease.out(clamp(lt / 0.25));
  g.save(); g.globalAlpha *= u; g.translate(W / 2, 690 - (1 - u) * 260); g.rotate(0.02);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = '#EFE9DC'; g.fillRect(-430, -510, 860, 990); g.shadowColor = 'transparent';
  g.fillStyle = '#2A2622'; g.textAlign = 'left'; g.font = sans(24, 800); g.letterSpacing = '6px'; g.fillText('1987 · SPATIAL TEST', -370, -440); g.letterSpacing = '0px';
  g.fillRect(-370, -420, 740, 3);
  g.font = serif(44, 700); g.fillText('Same shape, rotated?', -370, -355);
  qaRect(g, -370, -470, 740, 130, 'text', 'rotation title');
  cubes(g, -195, -40, 50, 0.75, 0.42, POLY, '#7D9BB5');
  cubes(g, 195, -40, 50, 0.75 + lt * 2.6, 0.42 + 0.25 * Math.sin(lt * 2.2), POLY, '#7D9BB5');
  g.textAlign = 'center';
  for (const [i, txt] of ['SAME', 'DIFFERENT'].entries()) { const x = -340 + i * 380; g.strokeStyle = '#3A342E'; g.lineWidth = 3; g.strokeRect(x, 250, 300, 96); g.font = sans(34, 900); g.fillStyle = '#2A2622'; g.fillText(txt, x + 150, 311); }
  qaRect(g, -340, 250, 680, 96, 'text', 'answers');
  g.restore();
}

// "the internet says": headline cards stacking up
const BAIT = [['MAGNUS CARLSEN’S IQ IS 190?!', '#C8463A'], ['SMARTER THAN EINSTEIN?', '#5A4FCF'], ['THE 190 IQ CHESS GENIUS', '#2C8FB8'], ['WHAT IS MAGNUS’S REAL IQ?', '#B8862C']];
const wrap = (g, s, max) => { const out = []; let cur = ''; for (const wd of s.split(' ')) { const nx = cur ? cur + ' ' + wd : wd; if (g.measureText(nx).width > max && cur) { out.push(cur); cur = wd; } else cur = nx; } if (cur) out.push(cur); return out; };
function clickbait(g, lt, t, t0) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#12161C'); bg.addColorStop(1, '#07090B'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  BAIT.forEach(([txt, col], i) => {
    const ti = t0 + i * 0.3; if (t < ti) return;
    const a = seg(t, ti, ti + 0.1), k = lerp(1.3, 1, seg(t, ti, ti + 0.22, ease.back));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 300 + i * 225); g.rotate([-0.035, 0.03, -0.025, 0.035][i]); g.scale(k, k);
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 26; g.shadowOffsetY = 12;
    g.fillStyle = '#F6F4F0'; g.beginPath(); g.roundRect(-450, -88, 900, 176, 18); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = col; g.beginPath(); g.roundRect(-432, -70, 140, 140, 12); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.arc(-362, -14, 30, 0, 7); g.fill(); g.beginPath(); g.ellipse(-362, 70, 54, 40, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#FFFFFF'; g.font = sans(46, 900); g.textAlign = 'center'; g.fillText('?', -362, 2);
    g.textAlign = 'left'; g.fillStyle = '#16181C'; g.font = sans(40, 900);
    const lines = wrap(g, txt, 580); lines.forEach((l, j) => g.fillText(l, -262, (j - (lines.length - 1) / 2) * 46 + 14));
    qaRect(g, -450, -88, 900, 176, 'text', 'bait ' + i);
    g.restore();
  });
}

// Fischer's school file: Erasmus Hall, the IQ line under a sticker
function schoolFile(g, lt, t, iqT) {
  deskInsert(g, t);
  const u = ease.out(clamp(lt / 0.28)), open = ease.inOut(seg(lt, 0.3, 0.6, lin));
  g.save(); g.globalAlpha *= u; g.translate(W / 2, 680 - (1 - u) * 260); g.rotate(-0.025);
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 44; g.shadowOffsetY = 18;
  g.fillStyle = '#C9A562'; g.beginPath(); g.roundRect(-410, -470, 820, 960, 14); g.fill(); g.shadowColor = 'transparent';
  g.beginPath(); g.roundRect(-410, -530, 340, 80, 12); g.fill();
  g.fillStyle = '#3A2A14'; g.font = mono(24, 800); g.textAlign = 'left'; g.fillText('FISCHER, ROBERT J.', -386, -482);
  g.fillStyle = '#F4EFE4'; g.fillRect(-370, -430, 740, 880);
  g.fillStyle = '#2A2622'; g.textAlign = 'center'; g.font = serif(36, 700); g.fillText('ERASMUS HALL HIGH SCHOOL', 0, -350);
  g.font = sans(20, 800); g.letterSpacing = '5px'; g.fillText('BROOKLYN, N.Y. · STUDENT RECORD', 0, -310); g.letterSpacing = '0px';
  g.fillRect(-320, -286, 640, 3);
  qaRect(g, -340, -390, 680, 110, 'text', 'school header');
  [['NAME', 'FISCHER, ROBERT J.'], ['BORN', 'MARCH 9, 1943'], ['I.Q.', '']].forEach(([k, v], i) => {
    const y = -196 + i * 110;
    g.textAlign = 'left'; g.font = sans(24, 800); g.letterSpacing = '4px'; g.fillStyle = '#6A6258'; g.fillText(k, -320, y); g.letterSpacing = '0px';
    if (v) { g.font = mono(32, 700); g.fillStyle = '#2A2622'; g.fillText(v, -150, y); }
    g.fillStyle = 'rgba(42,38,34,0.25)'; g.fillRect(-320, y + 22, 640, 2);
  });
  const yq = -196 + 220, hl = seg(t, iqT - 0.1, iqT + 0.25, lin);  // marker sweep, a red sticker over the value
  g.fillStyle = 'rgba(245,214,90,0.55)'; g.fillRect(-330, yq - 42, 660 * hl, 58);
  g.save(); g.translate(-60, yq - 12); g.rotate(-0.06); g.fillStyle = '#C8463A'; g.fillRect(0, -38, 210, 66);
  g.fillStyle = '#FFFFFF'; g.font = sans(42, 900); g.textAlign = 'center'; g.fillText('???', 105, 12); g.restore();
  qaRect(g, -330, yq - 42, 660, 58, 'text', 'iq row');
  g.fillStyle = 'rgba(42,38,34,0.16)'; for (let i = 0; i < 6; i++) g.fillRect(-320, 150 + i * 44, 640 - (i % 3) * 120, 12);
  if (open < 1) { g.save(); g.translate(0, -470); g.scale(1, 1 - open); g.fillStyle = '#D6B470'; g.fillRect(-410, 0, 820, 960); g.restore(); }
  g.restore();
  tag(g, 'AS REPORTED BY A FORMER SCHOOL OFFICIAL', 1132, seg(t, iqT, iqT + 0.15));
}

// close on the board for the result: views and positions
const BOARDV = (yaw, pitch, dist) => ({ yaw, pitch, dist, fov: 1500, cy: H * 0.48, target: [4, 1.6, 6.8] });
const KINGV = (yaw, dist) => ({ yaw, pitch: 0.22, dist, fov: 1500, cy: H * 0.42, target: [4.5, 0.9, 7.6] });

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'slate', ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  // a countdown card: whip in, the numeral lands on the word with a BOOM
  const slam = (a, n, hitT, who) => {
    shot(a, (g, lt, t) => rankSlam(g, lt, t, n, hitT, who), { trans: 'whip', whipDir: n % 2 ? 1 : -1, info: true });
    cue(a - 0.1, 'whoosh_fast', 0.4); cue(hitT - BOOM_HIT, 'boom_move', n === 1 ? 1 : 0.85);
  };
  const photo = (a, ph, view, title, o = {}) => {
    shot(a, (g, lt, t, sh) => photoShot(g, lt, ph, { ...view, dur: len(sh) }), { trans: 'zoom', noJump: true, hud: (g, lt) => photoTitle(g, lt + (o.instant ? 1 : 0), ...title), ...o });
    cue(a, 'camera', 0.3);
  };

  // ======================= HOOK: five silhouettes, the camera whips to number one =======================
  const inT = w('hook1', 'in'), einT = w('hook2', "Einstein's"), estT = w('hook2', 'estimated'), sixtyT = w('hook2', '160.');
  const landT = 1.1;
  shot(0, (g, lt, t) => lineup(g, lt, t, [[0, LPOSE(0, 23)], [0.62, LPOSE(0.3, 22, 0.02)], [landT, LPOSE(LX(4), 7.0, -0.08, 3.3), ease.whip], [2, LPOSE(LX(4), 6.4, -0.1, 3.3)]]),
    { noJump: true, hud: (g, lt) => nameTitle(g, lt, 'Highest IQ in Chess', 'THE TOP 5', { y: 240, size: 64, a: 1 - seg(lt, landT - 0.45, landT - 0.25) }) });
  cue(landT - 0.4, 'whoosh_fast', 0.4); cue(landT - BOOM_HIT, 'boom_move', 0.75);
  shot(inT - 0.05, (g, lt, t) => portrait(g, lt, t, 'bobby72', 'neutral', { dark: 1, keys: [[0, FRONT(-0.2, 0.3)], [2.4, FRONT(-0.04, 1.3)]] }),
    { noJump: true, hud: (g, lt) => rank(g, lt, 1, '???', 'HIGHEST IQ IN CHESS') });
  photo(einT - 0.12, PH.einstein_1921, { from: { x: 0.56, y: 0.5, zoom: 1.0, focus: 0.6 }, to: { x: 0.57, y: 0.45, zoom: 1.12, dolly: 0.1 } },
    ['Albert Einstein', 'ESTIMATED 160 · NEVER TESTED', 'ALBERT EINSTEIN, 1921 · F. SCHMUTZER · PUBLIC DOMAIN'], { trans: 'cut', grade: 'warm' });
  const scaleT = estT + 0.3, runT = scaleT + 0.12, passT = sixtyT + 0.04;
  shot(scaleT, (g, lt, t) => bigScale(g, lt, t, runT, passT), { trans: 'cut', info: true });
  cue(runT, 'whoosh_soft', 0.3); cue(passT - BOOM_HIT, 'boom_move', 0.9);

  // ======================= #5 HIKARU: 102 on a stream test =======================
  const hT = s('h5a') - 0.04, hikT = w('h5a', 'Hikaru'), testT = s('h5b') - 0.03, liveT = w('h5b', 'live'), h102 = w('h5c', '102.') + 0.25;
  slam(hT, 5, w('h5a', 'five:'), 'hikaru');
  photo(hikT - 0.06, PH.hikaru2026, { from: { x: 0.36, y: 0.5, zoom: 1.0, focus: 0.55 }, to: { x: 0.37, y: 0.45, zoom: 1.14, dolly: 0.12, sx: 0.02 } },
    ['Hikaru Nakamura', '5× U.S. CHAMPION', 'HIKARU NAKAMURA, 2026 · PHOTO: KELLY CENTRELLI · CC BY 4.0']);
  shot(testT, (g, lt, t) => streamTest(g, lt, t, testT), { trans: 'cut', info: true });
  cue(testT + 0.8, 'clock_press', 0.3);
  shot(liveT - 0.04, (g, lt, t, sh) => portrait(g, lt, t, 'hikaru', exprAt([[0, 'focus'], [0.5, { ...EXPR.happy, look: [-0.6, 0.2] }]], lt),
    { back: 'stream', keys: [[0, FRONT(-0.6, 0.1)], [0.4, FRONT(-0.16, 0.45), ease.whip], [len(sh), FRONT(-0.08, 0.7)]] }),
    { trans: 'cut', hud: (g, lt, t) => { rankTag(g, 5); streamOverlay(g, t, liveT); } });
  cue(liveT - 0.04, 'whoosh_fast', 0.3);
  shot(s('h5c') - 0.05, (g, lt, t, sh) => portrait(g, lt, t, 'hikaru', exprAt([[0, 'happy'], [h102 + 0.1 - (t - lt), { ...EXPR.happy, nod: 1 }]], lt),
    { back: 'stream', keys: [[0, FRONT(0.32, 0.7)], [len(sh), FRONT(0.24, 1.0)]] }),
    { trans: 'cut', hud: (g, lt, t) => {
      rankTag(g, 5);
      iqScale(g, iqAt(t, h102, 102), { unknown: iqHidden(t, h102) }); iqNumber(g, iqText(t, h102, 102), { label: 'ONLINE TEST · ON STREAM' });
    } });
  cue(h102 - 0.05, 'thud', 0.45);

  // ======================= #4 KASPAROV: the only real test, 135 =======================
  const kT = s('k4a') - 0.05, garryT = w('k4a', 'Garry'), y1987 = w('k4b', '1987,'), sheetT = w('k4b', 'German') - 0.1;
  const backT = s('k4c') - 0.08, k135 = w('k4c', '135.') + 0.45, rotT = w('k4c', 'His') - 0.06, belowT = w('k4c', 'Below'), end4 = s('m3a') - 0.08;
  slam(kT, 4, w('k4a', 'four:'), 'kasparov');
  photo(garryT - 0.06, PH.kasparov_1985a, { from: { x: 0.5, y: 0.5, zoom: 1.0, focus: 0.5 }, to: { x: 0.5, y: 0.42, zoom: 1.15, dolly: 0.12 } },
    ['Garry Kasparov', 'WORLD CHAMPION 1985–2000', 'GARRY KASPAROV, 1985 · ROB BOGAERTS / ANEFO · CC0'], { grade: 'bw' });
  shot(s('k4b') - 0.04, (g, lt, t, sh) => portrait(g, lt, t, 'kasparov', 'focus', { keys: [[0, FRONT(0.45, 0.2)], [len(sh), FRONT(0.32, 0.55)]] }),
    { trans: 'cut', hud: (g, lt, t) => { rankTag(g, 4); counter(g, '1987', 'DER SPIEGEL · IQ TEST', { y: 400, size: 150, a: seg(t, y1987, y1987 + 0.1) }); } });
  cue(y1987, 'stamp', 0.35);
  shot(sheetT, (g, lt, t) => { deskInsert(g, t); const u = ease.out(clamp(lt / 0.3)); g.save(); g.globalAlpha *= u; g.translate(0, -(1 - u) * 260); testSheet(g, lt); g.restore(); }, { trans: 'cut', info: true });
  cue(sheetT, 'paper', 0.5); cue(w('k4b', 'test') - 0.1, 'pen', 0.3);
  shot(backT, (g, lt, t, sh) => portrait(g, lt, t, 'kasparov', 'focus', { keys: [[0, FRONT(0.05, 0.6)], [len(sh), FRONT(-0.02, 0.9)]] }),
    { trans: 'cut', hud: (g, lt, t) => {
      rankTag(g, 4);
      iqScale(g, iqAt(t, k135, 135, 0.6), { unknown: iqHidden(t, k135, 0.6) }); iqNumber(g, iqText(t, k135, 135, 0.6), { label: 'TESTED · DER SPIEGEL 1987' });
    } });
  cue(k135 - BOOM_HIT, 'boom_move', 0.85);
  shot(rotT, (g, lt, t) => rotationTest(g, lt, t), { trans: 'cut', info: true });
  cue(rotT, 'whoosh_soft', 0.3);
  shot(belowT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'kasparov', exprAt([[0, 'focus'], [0.15, 'sad']], lt),
    { keys: diveOut([[0, FRONT(-0.2, 0.8)], [len(sh), FRONT(-0.14, 1.0)]], end4 - (belowT - 0.06)) }),
    { trans: 'cut', hud: (g, lt, t) => { rankTag(g, 4); badge(g, 'SPATIAL SKILLS: BELOW AVERAGE', W / 2, 1150, { color: RED, size: 34, a: seg(t, belowT, belowT + 0.1), scale: pop(t, belowT) }); } });
  cue(belowT, 'error', 0.3);

  // ======================= #3 MAGNUS: the internet's 190 =======================
  const magT = w('m3a', 'Magnus'), baitT = s('m3b') - 0.04, m190 = w('m3b', '190.') + 0.25, mag2T = w('m3b', 'Magnus'), neverT = w('m3b', 'never');
  slam(end4, 3, w('m3a', 'three:'), 'magnus');
  shot(magT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', 'smug', { keys: [[0, FRONT(0.75, -0.2)], [0.42, FRONT(0.14, 0.4), ease.whip], [len(sh), FRONT(0.08, 0.6)]] }),
    { trans: 'zoom', hud: (g, lt) => rank(g, lt, 3, 'Magnus Carlsen', 'WORLD CHAMPION 2013–2023') });
  cue(magT, 'whoosh_fast', 0.3);
  shot(baitT, (g, lt, t) => clickbait(g, lt, t, baitT + 0.08), { trans: 'cut', info: true, hud: (g, lt, t) => {
    iqScale(g, iqAt(t, m190, 190), { ghost: true, unknown: iqHidden(t, m190) });
    iqNumber(g, iqText(t, m190, 190), { color: '#B8BEC4', label: 'THE INTERNET SAYS', labelColor: '#AEB8C0' });
  } });
  [0, 1, 2, 3].forEach(i => cue(baitT + 0.08 + i * 0.3, 'notify', 0.18));
  shot(mag2T - 0.08, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', exprAt([[0, 'smug'], [neverT - (t - lt), { ...EXPR.smug, curve: 1 }]], lt), { keys: [[0, FRONT(-0.25, 0.6)], [len(sh), FRONT(-0.15, 0.9)]] }),
    { trans: 'cut', qaAllow: ['texts overlap'], hud: (g, lt, t) => {  // the NO SCORE stamp crosses the number on purpose
      rankTag(g, 3);
      const gone = seg(t, neverT, neverT + 0.15);
      iqScale(g, 190, { ghost: true, unknown: gone > 0.5 });
      iqNumber(g, gone > 0.5 ? '?' : '190', { color: '#B8BEC4', label: gone > 0.5 ? 'NEVER RELEASED' : 'THE INTERNET SAYS', labelColor: gone > 0.5 ? RED : '#AEB8C0' });
      noScore(g, gone, lerp(1.5, 1, seg(t, neverT, neverT + 0.2, ease.back)));
    } });
  cue(neverT, 'stamp', 0.6);

  // ======================= #2 POLGAR: reportedly 170, and she beat Kasparov =======================
  const pT = s('p2a') - 0.08, juditT = w('p2a', 'Judit'), boardT = w('p2a', 'the') - 0.06, strongT = w('p2a', 'strongest');
  const p170 = w('p2b', '170.') + 0.35, andT = w('p2b', 'And'), fallT = w('p2b', 'beat') + 0.1, hitK = fallT + 0.32, kasT = w('p2b', 'Kasparov.');
  slam(pT, 2, w('p2a', 'two:'), 'judit02');
  shot(juditT - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'judit02', 'happy', { keys: [[0, FRONT(-0.35, 0.2)], [len(sh), FRONT(-0.22, 0.5)]] }),
    { trans: 'zoom', hud: (g, lt) => rank(g, lt, 2, 'Judit Polgar', 'GRANDMASTER AT 15 · 1991') });
  shot(boardT, (g, lt, t, sh) => portrait(g, lt, t, 'judit02', { ...EXPR.focus, look: [0, 0.9] },
    { keys: [[0, BOARDV(-1.0, 0.62, 9.5)], [0.45, BOARDV(-0.3, 0.5, 8.2), ease.whip], [len(sh), BOARDV(-0.18, 0.48, 7.8)]] }),
    { trans: 'cut', hud: (g, lt, t) => { rankTag(g, 2); badge(g, 'ONLY WOMAN EVER IN THE WORLD TOP 10', W / 2, 1120, { color: GOLD, size: 38, sub: 'PEAK: WORLD NO. 8 · 2004', a: seg(t, strongT, strongT + 0.1), scale: pop(t, strongT) }); } });
  cue(boardT, 'whoosh_fast', 0.35);
  shot(s('p2b') - 0.06, (g, lt, t, sh) => portrait(g, lt, t, 'judit02', 'happy', { keys: [[0, FRONT(0.3, 0.75)], [len(sh), FRONT(0.22, 1.0)]] }),
    { trans: 'cut', hud: (g, lt, t) => {
      rankTag(g, 2);
      const v = iqAt(t, p170, 170);
      iqScale(g, v, { einstein: v > 160 ? 1 : 0, unknown: iqHidden(t, p170) }); iqNumber(g, iqText(t, p170, 170), { label: 'REPORTED' });
    } });
  cue(p170 - BOOM_HIT, 'boom_move', 0.8);
  // Moscow 2002: Kasparov's king goes down (symbolic: his king falls; the plate gives the real result)
  shot(andT - 0.08, (g, lt, t, sh) => {
    const rot = -1.42 * ease.in(seg(t, fallT, hitK, lin)) + (t > hitK ? 0.07 * Math.sin((t - hitK) * 24) * Math.exp(-(t - hitK) * 7) : 0);
    portrait(g, lt, t, 'kasparov', exprAt([[0, 'sad'], [0.3, { ...EXPR.sad, look: [0, 0.8] }]], lt), { keys: [[0, KINGV(0.35, 7.2)], [len(sh), KINGV(0.24, 6.6)]],
      pieces: [{ t: 'k', c: 'b', x: 4.5, z: 7.5, rot }, { t: 'p', c: 'b', x: 5.5, z: 6.5 }, { t: 'p', c: 'b', x: 6.5, z: 6.5 }, { t: 'q', c: 'w', x: 3.5, z: 5.5 }, { t: 'r', c: 'w', x: 1.5, z: 4.5 }] });
  }, { trans: 'cut', hud: (g, lt, t) => resultPlate(g, seg(t, kasT, kasT + 0.15)) });
  cue(hitK - BOOM_HIT, 'boom_move', 0.85); cue(hitK, 'piece', 0.45);

  // ======================= #1 FISCHER: the legend =======================
  const fT = s('f1a') - 0.1, lgT = w('f1a', 'legend...') - 0.12, revT = w('f1b', 'Bobby'), photoT = w('f1b', 'Fischer.') + 0.7;
  const fileT = w('f1c', 'official') - 0.05, iqT = w('f1c', 'IQ'), n180T = w('f1c', '180s.') - 0.12, f180 = w('f1c', '180s.') + 0.3;
  const ageT = s('f1d') - 0.04, sixteenT = w('f1d', '16'), crT = w('f1d', 'and') - 0.08, champT = w('f1d', 'champion.');
  slam(fT, 1, w('f1a', 'first'), 'bobby72');
  cue(fT - 0.7, 'riser', 0.4);
  shot(lgT, (g, lt, t) => {
    const dark = 1 - seg(t, revT - 0.02, revT + 0.12);
    portrait(g, lt, t, 'bobby72', exprAt([[0, 'neutral'], [revT - (t - lt), { ...EXPR.happy, look: [0, 0.2] }]], lt), {
      dark, keys: [[0, FRONT(-0.6, -0.3)], [revT - 0.42 - lgT, FRONT(-0.48, 0)], [revT + 0.08 - lgT, FRONT(0.12, 0.2), ease.whip], [3, FRONT(0.06, 0.6)]] });
  }, { trans: 'cut', noJump: true, hud: (g, lt, t) => { if (t >= revT) rank(g, t - revT, 1, 'Bobby Fischer', 'WORLD CHAMPION 1972'); } });
  cue(revT - BOOM_HIT - 0.03, 'boom_big', 1.0); cue(revT - 0.45, 'whoosh_fast', 0.5);
  photo(photoT, PH.fischer_1972, { from: { x: 0.62, y: 0.5, zoom: 1.0, focus: 0.55 }, to: { x: 0.62, y: 0.42, zoom: 1.15, dolly: 0.12 } },
    ['Bobby Fischer', 'WORLD CHAMPION 1972', 'BOBBY FISCHER, 1972 · ANEFO / NATIONAAL ARCHIEF · CC0'], { grade: 'bw', instant: true });
  shot(fileT, (g, lt, t) => schoolFile(g, lt, t, iqT), { trans: 'cut', info: true });
  cue(fileT, 'paper', 0.45); cue(fileT + 0.32, 'page_flip', 0.35);
  shot(n180T, (g, lt, t, sh) => portrait(g, lt, t, 'bobby72', 'happy', { keys: [[0, FRONT(0.32, 0.5)], [len(sh), FRONT(0.25, 0.8)]] }),
    { trans: 'cut', hud: (g, lt, t) => {
      rankTag(g, 1);
      const v = iqAt(t, f180, 182, 0.45);
      iqScale(g, v, { einstein: v > 160 ? 1 : 0, unknown: iqHidden(t, f180, 0.45) });
      iqNumber(g, t > f180 ? '180s' : iqText(t, f180, 182, 0.45), { label: 'REPORTED · SCHOOL OFFICIAL' });
    } });
  cue(f180 - BOOM_HIT, 'boom_move', 0.9);
  shot(ageT, (g, lt, t, sh) => portrait(g, lt, t, 'bobby13', 'neutral', { keys: [[0, FRONT(-0.4, 0.3)], [len(sh), FRONT(-0.3, 0.6)]] }),
    { trans: 'whip', hud: (g, lt, t) => { rankTag(g, 1); counter(g, 'AGE 16', 'LEFT SCHOOL · 1959', { y: 400, size: 130, a: seg(t, sixteenT - 0.05, sixteenT + 0.05) }); } });
  cue(ageT - 0.1, 'whoosh_soft', 0.3); cue(sixteenT, 'thud', 0.4);
  shot(crT, (g, lt, t, sh) => portrait(g, lt, t, 'bobby72', { ...EXPR.happy, look: [0, -0.3] }, {
    keys: [[0, FRONT(-0.5, 0.0)], [0.4, FRONT(-0.12, 0.4), ease.whip], [len(sh), FRONT(-0.06, 0.6)]],
    extra: () => { if (t > champT - 0.4) { const hd = headAt(), u = ease.out(seg(t, champT - 0.35, champT + 0.05)); crown(g, hd.x, hd.y - 168 * hd.s - (1 - u) * 380, hd.s * 0.72, seg(t, champT - 0.35, champT - 0.2)); } } }),
    { trans: 'cut', hud: (g, lt, t) => {
      rankTag(g, 1);
      badge(g, 'WORLD CHAMPION', W / 2, 1110, { color: GOLD, size: 50, sub: 'REYKJAVIK · 1972', a: seg(t, champT, champT + 0.1), scale: pop(t, champT) });
      if (t > champT) embers(g, t, { n: 40, seed: 9, a: 0.55 * seg(t, champT, champT + 0.3), color: '#FFD98A' });
    } });
  cue(crT, 'whoosh_fast', 0.3); cue(champT - 0.35, 'whoosh_soft', 0.3); cue(champT - BOOM_HIT, 'boom_move', 0.9); cue(champT + 0.05, 'applause', 0.25);

  // ======================= CTA: could you beat 135? =======================
  const cT = s('cta') - 0.08, comT = w('cta', 'Comment');
  const ctaHud = (g, t) => { iqScale(g, 135, { you: { v: 118 + 22 * Math.sin(t * 1.3), t } }); iqNumber(g, '135', { label: 'KASPAROV · TESTED' }); };
  shot(cT, (g, lt, t) => portrait(g, lt, t, 'kasparov', { ...EXPR.smug, curve: 0.7 }, { keys: [[0, FRONT(0.5, 0.2)], [0.4, FRONT(0.1, 0.55), ease.whip], [3, FRONT(0.06, 0.65)]] }),
    { trans: 'whip', noJump: true, hud: (g, lt, t) => ctaHud(g, t) });
  cue(cT - 0.1, 'whoosh_soft', 0.3);
  shot(comT - 0.1, (g, lt, t) => portrait(g, lt, t, 'kasparov', { ...EXPR.smug, curve: 0.9 }, { keys: [[0, FRONT(-0.12, 0.6)], [3, FRONT(-0.08, 0.75)]] }),
    { trans: 'cut', noJump: true, hud: (g, lt, t) => {
      ctaHud(g, t);
      badge(g, 'COMMENT YOUR IQ', W / 2, 230, { color: GOLD, size: 48, a: seg(t, comT, comT + 0.1), scale: lerp(1.5, 1, seg(t, comT, comT + 0.25, ease.back)) });
      badge(g, 'FOLLOW FOR MORE', W / 2, 330, { color: '#8A8F98', size: 34, sub: 'THE 64 FILES', a: seg(t, comT + 0.5, comT + 0.6) });
    } });
  cue(comT, 'notify', 0.35);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: hT, m: 'digital' }, { t: kT, m: 'tension' }, { t: end4, m: 'build' }, { t: pT, m: 'digital' },
    { t: fT, m: 'drop' }, { t: revT, m: 'hit' }, { t: photoT, m: 'build' }, { t: cT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, autoWhoosh: false, jumpCut: { every: 1.3, zooms: [1, 1.12, 1.05], shift: 40 } };
}
