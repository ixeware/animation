// The highest IQs in chess, rumour vs test: a countdown 5 -> 1 with an IQ scale under every player.
// Only Kasparov's 135 comes from a real, supervised test (Der Spiegel, 1987); Hikaru's 102 is a casual online test on
// stream; Magnus has never released a score (the "190" is internet folklore); Polgar's 170 and Fischer's "180s" are
// reports (Fischer's from a school official quoted in Brady's 1973 biography). Einstein's 160 is an estimate.
import { W, H, C, clamp, lerp, ease, seg, rgba, rng, makeCanvas, qaRect } from '../../engine/js/core.js';
import { Board } from '../../engine/js/board.js';
import { EXPR, exprAt, CAST } from '../../engine/js/characters.js';
import { counter, badge, nameTitle, sans, mono, serif } from '../../engine/js/hud.js';
import { rig, seated, actor, diveOut, riseIn } from '../../engine/js/stage.js';
import { box, pool } from '../../engine/js/env.js';
import { useLookV2, SLATE } from '../../engine/js/look.js';
import { spotCone, bokeh, lowKey } from '../../engine/js/light.js';
import { BOOM_HIT } from '../../engine/js/movefx.js';

useLookV2();
CAST.judit02 = { ...CAST.judit, suit: '#2B3140', suitD: '#1E2330', shirt: 'open', scrunchie: null };  // Judit Polgar in 2002 (26), dark jacket
const B = new Board();
const depth = (x, y, z) => B.toCam(x, y, z)[2];
const RED = '#E0503F', GOLD = '#E9B654';
const img = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src; });
const FISCHER = await img('../episodes/iq/photos/fischer_1972.jpg'), KASP = await img('../episodes/iq/photos/kasparov_1985a.jpg');

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
// the number above the scale: counts up from 70 to v, landing at tl
const iqAt = (t, tl, v, d = 0.55) => Math.round(lerp(70, v, ease.out(seg(t, tl - d, tl))));
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

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, grade: 'slate', ...o });
  const len = sh => sh.b - sh.a + 0.35;

  // ======================= HOOK: a silhouette, and the scale running past Einstein =======================
  const einT = w('hook2', "Einstein's"), sixtyT = w('hook2', '160.');
  shot(0, (g, lt, t) => portrait(g, lt, t, 'bobby72', 'neutral', { dark: 1, keys: [[0, FRONT(-0.35, -0.4)], [6.4, FRONT(-0.1, 0.5)]] }),
    { noJump: true, hud: (g, lt, t) => {
      const v = lerp(70, 182, ease.inOut(seg(t, sixtyT - 0.9, sixtyT)));
      iqScale(g, v, { einstein: seg(t, einT, einT + 0.2) + (v > 160 ? 1 : 0) });
      iqNumber(g, t < sixtyT - 0.9 ? '???' : t < sixtyT ? String(Math.round(v)) : '???', { label: 'NUMBER ONE' });
    } });
  cue(sixtyT - 0.9, 'whoosh_soft', 0.4); cue(sixtyT - BOOM_HIT, 'boom_move', 0.9);

  // ======================= #5 HIKARU: 102 on a stream test =======================
  const hT = s('h5a') - 0.06, chatT = w('h5b', 'stream,'), h102 = w('h5c', '102.') + 0.25;
  shot(hT, (g, lt, t) => portrait(g, lt, t, 'hikaru', exprAt([[0, 'happy'], [h102 + 0.1 - (t - lt), { ...EXPR.happy, nod: 1 }]], lt), { back: 'stream', yaw: -0.12 }),
    { trans: 'whip', hud: (g, lt, t) => {
      rank(g, lt, 5, 'Hikaru Nakamura', '5× U.S. CHAMPION');
      streamOverlay(g, t, chatT - 0.4);
      const a = seg(t, s('h5c') - 0.2, s('h5c'));
      iqScale(g, iqAt(t, h102, 102), { a }); iqNumber(g, String(iqAt(t, h102, 102)), { a, label: 'ONLINE TEST · ON STREAM' });
    } });
  cue(h102 - 0.05, 'thud', 0.45);

  // ======================= #4 KASPAROV: the only real test, 135 =======================
  const kT = s('k4a') - 0.06, testT = s('k4b') - 0.05, backT = s('k4c') - 0.08, k135 = w('k4c', '135.') + 0.45, belowT = w('k4c', 'Below');
  const KEYS4 = [[0, FRONT(0.12)], [3, FRONT(0.05, 0.5)]];
  shot(kT, (g, lt, t) => portrait(g, lt, t, 'kasparov', 'focus', { keys: KEYS4 }),
    { trans: 'whip', hud: (g, lt) => rank(g, lt, 4, 'Garry Kasparov', 'WORLD CHAMPION 1985–2000') });
  shot(testT, (g, lt, t) => { deskInsert(g, t); testSheet(g, lt); }, { trans: 'cut', info: true });
  cue(testT, 'paper', 0.5);
  const end4 = s('m3a') - 0.06 - backT;
  shot(backT, (g, lt, t, sh) => portrait(g, lt, t, 'kasparov', exprAt([[0, 'focus'], [belowT - (t - lt), 'sad']], lt),
    { keys: diveOut([[0, FRONT(0.05, 0.6)], [len(sh), FRONT(-0.02, 0.9)]], end4) }),
    { trans: 'cut', hud: (g, lt, t) => {
      rank(g, lt + 1, 4, 'Garry Kasparov', 'WORLD CHAMPION 1985–2000', 1 - seg(t, k135 - 0.6, k135 - 0.4));
      iqScale(g, iqAt(t, k135, 135), {}); iqNumber(g, String(iqAt(t, k135, 135)), { label: 'TESTED · DER SPIEGEL 1987' });
      if (t > belowT) badge(g, 'SPATIAL SKILLS: BELOW AVERAGE', W / 2, 1150, { color: RED, size: 34, a: seg(t, belowT, belowT + 0.1), scale: lerp(1.4, 1, seg(t, belowT, belowT + 0.25, ease.back)) });
    } });
  cue(k135 - BOOM_HIT, 'boom_move', 0.85); cue(backT + end4 - 0.26, 'whoosh_fast', 0.55);

  // ======================= #3 MAGNUS: the internet's 190 =======================
  const mT = s('m3a') - 0.06, m190 = w('m3b', '190.') + 0.25, neverT = w('m3b', 'never');
  shot(mT, (g, lt, t, sh) => portrait(g, lt, t, 'magnus', exprAt([[0, 'smug'], [neverT - (t - lt), { ...EXPR.smug, curve: 1 }]], lt),
    { keys: riseIn([[0, FRONT(0.1)], [len(sh), FRONT(0.03, 0.55)]]) }),
    { trans: 'cut', qaAllow: ['texts overlap'], hud: (g, lt, t) => {  // the NO SCORE stamp crosses the number on purpose
      rank(g, lt, 3, 'Magnus Carlsen', 'WORLD CHAMPION 2013–2023');
      const a = seg(t, s('m3b') - 0.1, s('m3b') + 0.1), gone = seg(t, neverT, neverT + 0.15);
      iqScale(g, iqAt(t, m190, 190), { a, ghost: true, unknown: gone > 0.5 });
      iqNumber(g, gone > 0.5 ? '?' : String(iqAt(t, m190, 190)), { a, color: '#B8BEC4', label: gone > 0.5 ? 'NEVER RELEASED' : 'THE INTERNET SAYS', labelColor: gone > 0.5 ? RED : '#AEB8C0' });
      noScore(g, gone, lerp(1.5, 1, seg(t, neverT, neverT + 0.2, ease.back)));
    } });
  cue(neverT, 'stamp', 0.6);

  // ======================= #2 POLGAR: reportedly 170, and she beat Kasparov =======================
  const pT = s('p2a') - 0.06, p170 = w('p2b', '170.') + 0.35, beatT = w('p2b', 'And');
  shot(pT, (g, lt, t) => portrait(g, lt, t, 'judit02', 'happy', { yaw: -0.1 }),
    { trans: 'whip', hud: (g, lt, t) => {
      rank(g, lt, 2, 'Judit Polgar', 'STRONGEST WOMAN IN CHESS HISTORY');
      const a = seg(t, s('p2b') - 0.15, s('p2b') + 0.05) * (1 - seg(t, beatT - 0.1, beatT + 0.1)), v = iqAt(t, p170, 170);
      iqScale(g, v, { a, einstein: v > 160 ? 1 : 0 }); iqNumber(g, String(v), { a, label: 'REPORTED' });
      const sb = seg(t, beatT, beatT + 0.15);
      resultPlate(g, sb);
    } });
  cue(p170 - BOOM_HIT, 'boom_move', 0.8);

  // ======================= #1 FISCHER: the legend =======================
  const fT = s('f1a') - 0.1, revT = w('f1b', 'Bobby'), f180 = w('f1c', '180s.') + 0.3, sixteenT = w('f1d', '16'), champT = w('f1d', 'champion.');
  shot(fT, (g, lt, t) => {
    const dark = 1 - seg(t, revT - 0.02, revT + 0.12);
    portrait(g, lt, t, 'bobby72', exprAt([[0, 'neutral'], [revT - (t - lt), { ...EXPR.happy, look: [0, 0.2] }]], lt), {
      dark, keys: [[0, FRONT(-0.6, -0.3)], [revT - 0.42 - fT, FRONT(-0.48, 0)], [revT + 0.08 - fT, FRONT(0.12, 0.2), ease.whip], [10, FRONT(0.04, 0.8)]],
      extra: () => { if (t > champT - 0.4) { const hd = headAt(), u = ease.out(seg(t, champT - 0.35, champT + 0.05)); crown(g, hd.x, hd.y - 168 * hd.s - (1 - u) * 380, hd.s * 0.72, seg(t, champT - 0.35, champT - 0.2)); } } });
  }, { trans: 'cut', noJump: true, hud: (g, lt, t) => {
    if (t < revT) return;
    rank(g, t - revT, 1, 'Bobby Fischer', 'WORLD CHAMPION 1972', 1 - seg(t, champT - 0.6, champT - 0.4));
    photoCard(g, FISCHER, W - 190, 760, 210, 0.08, 'BOBBY FISCHER, 1972 · ANEFO · CC0', seg(t, revT + 0.3, revT + 0.5) * (1 - seg(t, sixteenT - 0.3, sixteenT - 0.1)), [60, 40, 840, 1000]);
    const a = seg(t, s('f1c') - 0.1, s('f1c') + 0.1), v = iqAt(t, f180, 182, 0.9);
    iqScale(g, v, { a, einstein: v > 160 ? 1 : 0 });
    iqNumber(g, t > f180 ? '180s' : t < f180 - 0.9 ? '???' : String(v), { a, label: 'REPORTED · SCHOOL OFFICIAL' });
    if (t > sixteenT) tag(g, 'AGE 16 · LEFT SCHOOL', 1160, seg(t, sixteenT, sixteenT + 0.12) * (1 - seg(t, champT - 0.3, champT - 0.1)));
  } });
  cue(fT, 'riser', 0.45); cue(revT - BOOM_HIT - 0.03, 'boom_big', 1.0); cue(revT - 0.45, 'whoosh_fast', 0.5);
  cue(f180 - BOOM_HIT, 'boom_move', 0.9); cue(champT - 0.35, 'whoosh_soft', 0.4);

  // ======================= CTA: could you beat 135? =======================
  const cT = s('cta') - 0.08, comT = w('cta', 'Comment');
  shot(cT, (g, lt, t) => portrait(g, lt, t, 'kasparov', { ...EXPR.smug, curve: 0.7 }, { yaw: 0.08, push: 0.6 }),
    { trans: 'whip', noJump: true, hud: (g, lt, t) => {
      iqScale(g, 135, { you: { v: 118 + 22 * Math.sin(t * 1.3), t } }); iqNumber(g, '135', { label: 'KASPAROV · TESTED' });
      badge(g, 'COMMENT YOUR IQ', W / 2, 230, { color: GOLD, size: 48, a: seg(t, comT, comT + 0.1), scale: lerp(1.5, 1, seg(t, comT, comT + 0.25, ease.back)) });
      badge(g, 'FOLLOW FOR MORE', W / 2, 330, { color: '#8A8F98', size: 34, sub: 'THE 64 FILES', a: seg(t, comT + 0.5, comT + 0.6) });
    } });

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'hook' }, { t: hT, m: 'tension' }, { t: fT, m: 'drop' }, { t: revT, m: 'hit' }, { t: cT, m: 'hook' }, { t: T.duration, m: 'end' },
  ];
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.1, 1.04], shift: 30 } };
}
