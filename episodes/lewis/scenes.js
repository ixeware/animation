// The £5 chess piece: a Lewis chessman bought in 1964, kept in a drawer for 55 years, sold for £735,000.
// Every scene lives in a 3D set (antique shop, the family's chest of drawers, the dune beach of 1831, the British
// Museum, a saleroom, a wall of drawers); the map is a flat insert.
import { W, H, C, clamp, lerp, ease, seg, pulse, rgba, rng, mix, makeCanvas } from '../../engine/js/core.js';
import { rays, flash, glowText, confetti, spotlight, speedlines, target } from '../../engine/js/draw.js';
import { Board } from '../../engine/js/board.js';
import { EXPR, exprAt, hand, drawChar } from '../../engine/js/characters.js';
import { placeStamp, nameTitle, counter, badge, stamp, mono, serif } from '../../engine/js/hud.js';
import { DotMap, ISO } from '../../engine/js/map.js';
import { loadImage, photoCard } from '../../engine/js/photo.js';
import { rig, actor } from '../../engine/js/stage.js';
import { room, picture, chair, box, pool, blindLight, FLOOR_Y } from '../../engine/js/env.js';
import { burst, shockwave, glint, dust, shatterImage, embers, bills } from '../../engine/js/fx.js';
import { drawLewis, drawLewisSet, ghostLewis, lewisSprite, lewisBox, SETS, shelves, counter as shopCounter, ledgerPage, priceTag, dresser, clutter,
  beach, sandWind, sandAt, cist, drawerWall, vitrine, rostrum, currencyBoard, walrus, portrait } from '../../engine/js/lewis.js';

const map = await new DotMap().init();
const P = Object.fromEntries(await Promise.all(['bm_lewis', 'room40', 'king1845', 'queen1845', 'rook1845'].map(async k => [k, await loadImage(`../episodes/lewis/photos/${k}.jpg`)])));
const B = new Board();
const HALL = { base: '#05060A', wall: ['#3A3E46', '#33373E'], seam: '#1E2126', floor: ['#1A1C20', '#16181B'], light: '#9FB7FF', lightA: 0.25, sconces: true };
const DEALER = portrait('dealer', { ...EXPR.happy, look: [0, 0] });
const PIECE = { t: 'r', k: 1.25 };  // the 1964 piece: a warder

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const lin = x => x;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = mono(18, 700); g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.6)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const at = (x, y, z) => B.project(x, y, z);

  // ---- sets ----
  // Edinburgh antique shop: shelves of clutter, the dealer behind the counter, the warder with its £5 tag
  const shop = (g, lt, t, keys, { blur = 3, dealer = true, dealerE = 'happy', dealerBlur = 0, piece = true, tag = 1, ledger = null, ez = ease.inOut, focus = null, dof = 0.9, held = null } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    room(g, B, SETS.shop, { t, blur: blur * 0.7 });
    shelves(g, B, { blur });
    if (dealer) actor(g, B, 'dealer', { x: 4, y: 3.5, z: 8.9, e: dealerE, t, blur: dealerBlur });
    shopCounter(g, B);
    box(g, B, [7.2, 0, 4.8], [9.2, 1.3, 6.8], { top: '#2E2A26', side: '#151311', front: '#3A332C' });  // cash register
    if (ledger !== null) picture(g, B, ledgerPage(ledger), [0.4, 0.02, 3.4], [3.6, 0.02, 3.2], [0.5, 0.02, 1.2], { tone: 'warm', border: '#4A2E18', pad: 0.06 });
    if (held) {  // the dealer lifts the piece toward the camera
      const p = at(held[0], held[1], held[2]);
      drawLewisSet(g, B, [{ ...PIECE, x: held[0], y: held[1], z: held[2], ground: held[1] }], { shadow: false, focus, dof });
      hand(g, p.x, p.y + p.s * 0.05, p.s * 0.32);
    } else if (piece) {
      drawLewisSet(g, B, [{ ...PIECE, x: 4.6, z: 3.0 }], { focus, dof });
      const p = at(4.95, 1.25, 3.0);
      priceTag(g, p.x, p.y, p.s / 100, '£5', { swing: Math.sin(t * 2.6) * 0.18, a: tag });
    }
  };
  // the family home: chest of drawers with the dealer's photo on top; the warder upright in the top drawer
  const home = (g, lt, t, keys, { open = 0, glow = 0, dust: dst = 0, over = null, night = 0, daughter = null, ez = ease.inOut, blur = 0, sun = 0 } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    room(g, B, SETS.home, { t, over, blur });
    if (sun > 0) blindLight(g, B, { a: sun, color: '#FFE6B0' });
    dresser(g, B, { open, glow, dust: dst, t,
      top: () => picture(g, B, DEALER, [5.2, 3.7, 7.2], [7.0, 3.7, 7.2], [5.2, 1.6, 7.2], { tone: 'sepia', border: '#C9A05A', pad: 0.12 }),
      contents: (g2, zd) => { clutter(g, B, 4, zd + 1.5); drawLewisSet(g, B, [{ ...PIECE, x: 4, y: 0.17, z: zd + 1.5, ground: 0.17, glow: glow > 0.3 ? C.gold : null }], { dof: 0.5 }); } });
    if (daughter) actor(g, B, 'daughter', { x: -1.4, y: 4.4, z: 5.4, e: daughter, t });
    if (night > 0) { g.fillStyle = rgba('#050A18', 0.5 * night); g.fillRect(0, 0, W, H); }
  };
  const museumSet = (k = 0.85) => {
    const L = [], back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    back.forEach((ty, i) => { L.push({ t: ty, x: i + 0.5, z: 0.5, k }); L.push({ t: 'p', x: i + 0.5, z: 1.5, k }); L.push({ t: back[7 - i], x: i + 0.5, z: 7.5, k, tone: 'red' }); L.push({ t: 'p', x: i + 0.5, z: 6.5, k, tone: 'red' }); });
    return L;
  };
  const museum = (g, lt, t, keys, { blur = 2, visitors = true, flashes = true, ez = ease.inOut, dof = 0.7 } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    room(g, B, SETS.museum, { t, blur });
    picture(g, B, P.bm_lewis, [-7.5, 10, 12.95], [-0.5, 10, 12.95], [-7.5, 4.4, 12.95], { tone: 'color', border: '#11161B', pad: 0.1 });
    picture(g, B, P.room40, [16.95, 10, 3], [16.95, 10, 10.5], [16.95, 5, 3], { tone: 'color', border: '#11161B', pad: 0.1 });
    if (visitors) for (const [x, who, e] of [[0.2, 'dealer', 'happy'], [4.4, 'daughter', 'smug'], [8.6, 'auctioneer', 'focus']])
      actor(g, B, who, { x, y: 4.2, z: 11, e: { ...EXPR[e], look: [0, 1] }, t, blur: 3 });
    vitrine(g, B, 'pedestal');
    B.drawSlab(g, { light: '#EFE6D2', dark: '#B02A30', frame: '#E9E2D3', side: '#D9D0BE', m: 0.3, th: 0.3 });
    drawLewisSet(g, B, museumSet(), { dof });
    vitrine(g, B, 'glass', { t });
    if (visitors) for (const [x, z, who] of [[11.5, -2.2, 'auctioneer']]) {
      const d = B.toCam(x, 3.6, z)[2];
      actor(g, B, who, { x, y: 3.6, z, t, face: 1, silhouette: true, shade: 'brightness(0.12) saturate(0.4)', blur: clamp((9 - d) * 1.2, 0, 10) });
    }
    if (flashes) for (let i = 0; i < 3; i++) {  // phone camera flashes from the crowd
      const tf = (t * 0.9 + i * 0.37) % 1.3;
      if (tf < 0.08) { const p = at([0.6, 4.8, 11.5][i], 3.4, [10.6, 10.6, -2][i]); g.save(); g.globalCompositeOperation = 'screen'; spotlight(g, p.x, p.y, 220, '#FFFFFF', 0.8 * (1 - tf / 0.08)); g.restore(); }
    }
  };
  // the saleroom: rostrum, currency board, the warder on a lit plinth, rows of bidders seen from behind
  const BIDDERS = [];
  for (const z of [2.2, -0.6, -3.4]) for (let x = -6; x <= 14; x += 2.5) BIDDERS.push([x + (z < 0 ? 1.2 : 0), z]);
  const sale = (g, lt, t, keys, { gbp = 0, lit = 0, auctE = 'focus', gavel = null, paddles = [], blur = 0, ez = ease.inOut, focus = null, dof = 0.8, piece = true, bidders = true } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    room(g, B, SETS.sale, { t, blur });
    picture(g, B, currencyBoard(gbp, { lit }), [-7.8, 11.4, 12.95], [-2.4, 11.4, 12.95], [-7.8, 4.4, 12.95], { tone: 'color', border: '#2A323A', pad: 0.15, glow: lit });
    picture(g, B, lewisSprite('r'), [10.6, 11.4, 12.95], [15.4, 11.4, 12.95], [10.6, 4.8, 12.95], { tone: 'color', border: '#2A323A', pad: 0.15, fx: 0.5, fy: 0.5 });
    actor(g, B, 'auctioneer', { x: 4, y: 4.7, z: 11.8, e: auctE, t });
    rostrum(g, B);
    if (gavel) gavelAt(g, gavel);
    box(g, B, [7.9, FLOOR_Y, 7.9], [9.7, 0.4, 9.7], { top: '#E8E2D4', side: '#8A857C', front: '#B8B2A6' });
    pool(g, B, 8.8, 0.4, 8.8, 2.2, '#FFF1D8', 0.5);
    if (piece) drawLewisSet(g, B, [{ ...PIECE, x: 8.8, y: 0.4, z: 8.8, ground: 0.4, k: 1.1 }], { focus, dof });
    if (bidders) BIDDERS.filter(([x, z]) => B.toCam(x, 1.6, z)[2] > 0.8).sort((a, q) => B.toCam(q[0], 1.6, q[1])[2] - B.toCam(a[0], 1.6, a[1])[2]).forEach(([x, z], i) => {
      chair(g, B, x, z + 0.4, { face: 1, color: '#2A1418' });
      const d = B.toCam(x, 1.5, z)[2], p = d > 0.8 ? at(x, 1.5, z) : null;
      if (p) {  // back-view silhouettes are static: one cached bitmap per character, scaled like actor()
        const c = silhouette(i % 3 ? 'auctioneer' : 'daughter'), k = p.s / 100 * 1.05, bl = clamp((7 - d) * 1.4, 0, 9);
        g.save(); if (bl > 1) g.filter = `blur(${bl.toFixed(1)}px)`;
        g.drawImage(c, p.x - 320 * k, p.y - 320 * k + Math.sin(t * 1.7 + i) * 3 * k, 640 * k, 1000 * k); g.restore();
      }
      const up = paddles.find(q => Math.abs(q[0] - x) < 0.01 && Math.abs(q[1] - z) < 0.01);
      if (p && up) paddle(g, p.x + p.s * 0.9, p.y - p.s * 0.2, p.s / 100, up[2], seg(t, up[3], up[3] + 0.25, ease.back));
    });
  };
  const SIL = {};
  const silhouette = who => SIL[who] ??= (() => { const c = makeCanvas(640, 1000); drawChar(c.getContext('2d'), who, { x: 320, y: 320, s: 1, silhouette: true, shade: 'brightness(0.16) saturate(0.4)' }); return c; })();
  const paddle = (g, x, y, s, n, u) => {
    if (u <= 0) return;
    g.save(); g.translate(x, y + (1 - u) * 160 * s); g.rotate(0.1);
    g.fillStyle = '#C9B48A'; g.fillRect(-6 * s, -10 * s, 12 * s, 120 * s);
    g.fillStyle = '#F4F1EA'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 10; g.beginPath(); g.roundRect(-55 * s, -120 * s, 110 * s, 110 * s, 10 * s); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#1A1A1A'; g.font = `900 ${Math.round(54 * s)}px Rubik`; g.textAlign = 'center'; g.fillText(n, 0, -45 * s);
    g.restore();
  };
  // gavel {x, y, z, lift 0..1}: head swings down onto the sound block
  const gavelAt = (g, { x = 4.9, y = 1.75, z = 10.3, lift = 0 }) => {
    if (B.toCam(x, y, z)[2] < 0.6) return;
    const p = at(x, y, z), s = p.s / 100;
    g.save(); g.fillStyle = '#3A2414'; g.beginPath(); g.ellipse(p.x, p.y, 70 * s, 22 * s, 0, 0, 7); g.fill(); g.fillStyle = '#5A3A22'; g.fillRect(p.x - 70 * s, p.y - 16 * s, 140 * s, 16 * s);
    g.beginPath(); g.ellipse(p.x, p.y - 16 * s, 70 * s, 22 * s, 0, 0, 7); g.fillStyle = '#6A4A2C'; g.fill();
    g.translate(p.x + 150 * s, p.y - 30 * s); g.rotate(-0.15 - lift * 1.1);
    g.fillStyle = '#4A2E18'; g.fillRect(0, -9 * s, 190 * s, 18 * s);
    const gr = g.createLinearGradient(-40 * s, 0, 40 * s, 0); gr.addColorStop(0, '#8A5A32'); gr.addColorStop(1, '#3A2414');
    g.fillStyle = gr; g.beginPath(); g.roundRect(-38 * s, -48 * s, 56 * s, 96 * s, 10 * s); g.fill();
    g.fillStyle = '#C9A05A'; g.fillRect(-38 * s, -30 * s, 56 * s, 8 * s); g.fillRect(-38 * s, 22 * s, 56 * s, 8 * s);
    hand(g, 150 * s, 0, 34 * s);
    g.restore();
  };
  const beachHoard = (reveal, k = 0.5) => {
    const L = [['k', 3.1, 3.7], ['q', 4.0, 3.5], ['b', 4.9, 3.7], ['n', 3.3, 4.6], ['r', 4.2, 4.7], ['b', 5.0, 4.5], ['p', 2.9, 3.0], ['p', 4.5, 2.9], ['r', 5.3, 3.1]];
    return L.map(([t, x, z], i) => ({ t, x, z, y: lerp(-1.6, -0.5, reveal), ground: -0.5, k, glow: reveal > 0.9 && i % 3 === 0 ? C.gold : null }));
  };

  // the 110m world map has no Outer Hebrides: dot in Lewis and Harris by hand
  const lewisIsland = (g, a) => {
    const v = map.v, step = 14 / v.zoom;
    g.save(); g.globalAlpha *= a; g.fillStyle = rgba(C.gold, 0.85);
    for (let lat = 57.7; lat <= 58.55; lat += step) for (let lon = -7.15; lon <= -6.1; lon += step) {
      const u = (lon + 6.62) / 0.5, q = (lat - 58.12) / 0.42, r = u * 0.8 + q * 0.6, k = -u * 0.6 + q * 0.8;
      if (r * r + k * k * 1.6 > 1) continue;
      const [x, y] = map.proj(lon, lat); g.beginPath(); g.arc(x, y, 14 * 0.34, 0, 7); g.fill();
    }
    g.restore();
  };

  // ======================= HOOK =======================
  // H1a — "This chess piece…": frame one is the warder's carved face, a red ring snaps onto it,
  // then the camera tears back and up to show where it is — an open drawer
  const drawT = w('hook1', 'drawer');
  shot(0, (g, lt, t, sh) => {
    home(g, lt, t, [[0, { yaw: 0.3, pitch: 0.1, dist: 2.3, cy: H * 0.46, target: [4, 1.45, 4.08] }], [0.25, { yaw: 0.3, pitch: 0.1, dist: 2.2 }],
      [len(sh), { yaw: 0.08, pitch: 0.7, dist: 9.5, target: [4, 0.4, 4.6] }]], { open: 0.9, glow: 0.5, ez: ease.inOut });
    const p = at(4, 1.5, 4.08), u = seg(lt, 0.05, 0.3, ease.back);
    const ra = seg(lt, 0.05, 0.12) * (1 - seg(t, drawT - 0.5, drawT - 0.2)), rr = p.s * 0.3 * lerp(1.8, 1, u);
    if (ra > 0) {  // thumbnail-style red ring and arrow on the carved face
      g.save(); g.globalAlpha = ra; g.strokeStyle = C.red; g.shadowColor = C.red; g.shadowBlur = 24; g.lineCap = 'round'; g.lineJoin = 'round';
      g.lineWidth = 14; g.beginPath(); g.arc(p.x, p.y, rr, 0, 7); g.stroke();
      const ax = p.x + rr * 0.72, ay = p.y + rr * 0.72, k = seg(lt, 0.15, 0.35, ease.out);
      g.lineWidth = 18; g.beginPath(); g.moveTo(ax + 40 + 260 * k, ay + 50 + 300 * k); g.lineTo(ax + 40, ay + 50); g.stroke();
      g.beginPath(); g.moveTo(ax + 40 + 85, ay + 50 + 10); g.lineTo(ax + 40, ay + 50); g.lineTo(ax + 40 + 10, ay + 50 + 95); g.stroke();
      g.restore();
    }
    glint(g, p.x, p.y, t, 0.1, { r: 260 });
  }, { vig: 0.6, noJump: true });
  cue(0.05, 'hit', 0.9); cue(0.05, 'riser', 0.35); cue(w('hook1', 'sat') - 0.3, 'whoosh', 0.7);
  // H1b — …in a drawer for fifty-five years: the drawer slams shut, the years tear past
  const ffT = w('hook1', 'fifty-five');
  shot(drawT - 0.12, (g, lt, t, sh) => {
    const shut = seg(t, drawT - 0.1, drawT + 0.1, ease.in), u = seg(t, ffT - 0.05, s('hook2') - 0.2, lin), day = 0.5 + 0.5 * Math.sin(lt * 16);
    home(g, lt, t, [[0, { yaw: -0.3, pitch: 0.34, dist: 10, cy: H * 0.52, target: [4, 0.6, 5] }], [len(sh), { yaw: -0.15, pitch: 0.3, dist: 11.5 }]],
      { open: 0.9 * (1 - shut), glow: 0.5 * (1 - shut), dust: u, sun: u > 0 ? day * 0.9 : 0, night: u > 0 ? (1 - day) * 0.8 : 0, over: { light: u > 0 ? mix('#7FA8FF', '#FFD9A8', day) : '#FFD9A8', lightA: 0.3 }, ez: ease.out });
    if (shut >= 1) { const q = at(4, 0.7, 5.84); dust(g, q.x, q.y, t, drawT + 0.1, { size: 40, spread: 380, n: 18, color: '#D8CCB4' }); }
    counter(g, String(Math.round(lerp(1964, 2019, u))), '55 YEARS', { y: 330, size: 150, color: '#FFF4D6', glow: C.gold, labelColor: C.red, a: seg(t, ffT - 0.1, ffT + 0.05) });
  }, { noJump: true });
  cue(drawT - 0.1, 'drawer', 1); cue(drawT + 0.1, 'thud', 1); cue(ffT, 'ratchet', 0.8);

  // H2a — then it sold…: the gavel comes down
  const soldT = w('hook2', 'sold'), almostT = w('hook2', 'almost'), millT = w('hook2', 'million');
  shot(s('hook2') - 0.08, (g, lt, t, sh) => {
    const lift = t < soldT ? lerp(0.6, 1.25, seg(t, s('hook2') - 0.08, soldT - 0.12)) * (1 - seg(t, soldT - 0.12, soldT, ease.in)) : 0;
    sale(g, lt, t, [[0, { yaw: 0.3, pitch: 0.55, dist: 4.4, cy: H * 0.6, target: [5.3, 1.8, 10.3] }], [len(sh), { yaw: 0.25, pitch: 0.5, dist: 3.9 }]], { gbp: 735000, lit: 1, auctE: 'triumph', gavel: { lift }, blur: 5, bidders: false, piece: false });
    const p = at(4.9, 1.75, 10.3);
    if (t >= soldT) { shockwave(g, p.x, p.y, t, soldT, { r0: 40, r1: 560, color: '#FFE2A0', lw: 16, squash: 0.5 }); burst(g, p.x, p.y, t, soldT, { n: 26, color: C.gold, speed: 950, size: 7 }); }
    stamp(g, 'SOLD', W / 2, 360, lt, soldT + 0.04 - (s('hook2') - 0.08), { size: 140, color: C.red });
  }, { trans: 'whip', noJump: true });
  cue(soldT, 'gavel', 1.2); cue(soldT, 'boom', 1); cue(soldT + 0.04, 'stamp', 0.8);
  // H2b — …for almost a million dollars: the room erupts, the number rolls, money rains
  shot(almostT - 0.1, (g, lt, t, sh) => {
    const v = Math.round(lerp(5, 927000, seg(t, almostT, millT + 0.15, ease.out)) / 1000) * 1000 || 5;
    const paddles = BIDDERS.filter((_, i) => i % 3 === 1).map(([x, z], i) => [x, z, String(100 + i * 37), almostT + i * 0.06]);
    sale(g, lt, t, [[0, { yaw: -0.35, pitch: 0.22, dist: 16, cy: H * 0.5, target: [4, 3.4, 7] }], [len(sh), { yaw: 0.05, pitch: 0.16, dist: 11.5 }]], { gbp: Math.round(v / 1.26 / 1000) * 1000, lit: 1, auctE: 'triumph', paddles, ez: ease.out });
    counter(g, '$' + v.toLocaleString('en-US'), null, { y: 320, size: 130, color: '#F4FFE8', glow: C.lime, a: seg(lt, 0, 0.08) });
    badge(g, 'ALMOST $1,000,000', W / 2, 450, { color: C.lime, size: 44, a: seg(t, millT, millT + 0.12), scale: pop(t, millT) });
    bills(g, t, millT - 0.05, { n: 46, life: 2.4 });
    confetti(g, t, millT, { n: 80 });
    flash(g, 0.5 * pulse(t, millT, 0.25), '#E8FFD8');
  }, { trans: 'zoom' });
  cue(almostT, 'riser', 0.5); cue(millT, 'boom', 1.1); cue(millT, 'kaching', 1); cue(millT + 0.05, 'cheer', 0.8); cue(millT + 0.1, 'confetti', 0.6);

  // H3 — it cost five pounds: the music cuts out, silence, the paper tag
  const fiveT = w('hook3', 'five');
  shot(s('hook3') - 0.05, (g, lt, t, sh) => {
    shop(g, lt, t, [[0, { yaw: -0.25, pitch: 0.04, dist: 3.4, cy: H * 0.52, target: [5.0, 0.8, 3.0] }], [len(sh), { yaw: -0.15, pitch: 0.03, dist: 2.8 }]], { blur: 7, dealer: false, ez: ease.out, dof: 0.6 });
    badge(g, '£5', W / 2, 320, { color: C.red, size: 110, a: seg(t, fiveT, fiveT + 0.1), scale: pop(t, fiveT) });
    glint(g, W / 2, 320, t, fiveT + 0.05, { r: 280 });
    badge(g, '£5  →  $927,000', W / 2, 470, { color: C.lime, size: 36, a: seg(t, w('hook3', 'pounds') + 0.25, w('hook3', 'pounds') + 0.4) });
  }, { trans: 'flash', vig: 0.8 });
  cue(s('hook3') - 0.05, 'tvoff', 0.25); cue(fiveT, 'kaching', 0.9); cue(fiveT, 'hit', 0.6);
  // H4 — so what is it? the warder spins in a spotlight
  const whatT = w('bridge', 'what');
  shot(s('bridge') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.9, pitch: 0.1, dist: 4.6, cy: H * 0.6, target: [4, 1.1, 4] }], [len(sh), { yaw: 0.7, pitch: 0.16, dist: 4.0 }]], { t, e: ease.inOut });
    room(g, B, SETS.vault, { t, blur: 7, over: { light: C.gold, lightA: 0.2 } });
    box(g, B, [2.6, FLOOR_Y, 2.8], [5.4, 0, 5.2], { top: '#5E5A52', side: '#2E2C28', front: '#46433D' });
    pool(g, B, 4, 0, 4, 2.6, '#FFE6B0', 0.5);
    const top = at(4, 9, 4), base = at(4, 0, 4); spotlight(g, top.x, base.y - 300, 520, '#FFF1D8', 0.16);
    drawLewisSet(g, B, [{ ...PIECE, x: 4, z: 4, k: 1.5, sharp: true, glow: C.gold }], { t });
    const r = rng(9);
    for (let i = 0; i < 5; i++) { const a = seg(t, whatT + i * 0.08, whatT + i * 0.08 + 0.2); if (a <= 0) continue;
      g.save(); g.globalAlpha = a * 0.8; g.font = `900 ${Math.round(80 + r() * 70)}px Rubik`; g.fillStyle = C.gold; g.shadowColor = C.gold; g.shadowBlur = 24; g.textAlign = 'center';
      g.fillText('?', 140 + r() * 800, 560 + r() * 500 - (t - whatT) * 60); g.restore(); }
  }, { trans: 'whip', vig: 0.8 });
  cue(whatT, 'shimmer', 0.9); cue(whatT, 'pluck', 0.6);

  // A — it's one of the Lewis chessmen: the famous set in its British Museum vitrine
  const lewisT = w('answer', 'Lewis');
  shot(s('answer') - 0.05, (g, lt, t, sh) => {
    museum(g, lt, t, [[0, { yaw: -0.45, pitch: 0.36, dist: 13, cy: H * 0.52, target: [4, 0.6, 4] }], [len(sh), { yaw: -0.2, pitch: 0.42, dist: 11.5 }]], { ez: lin });
    nameTitle(g, lt, 'The Lewis Chessmen', 'c. 1150 – 1200 · BRITISH MUSEUM', { y: 300, t0: lewisT - (s('answer') - 0.05), subColor: C.gold, size: 66 });
    const legT = w('answer', 'legends'); badge(g, 'TOTAL LEGENDS', W / 2, 480, { color: C.lime, size: 48, a: seg(t, legT, legT + 0.1), scale: pop(t, legT) });
    photoCard(g, P.bm_lewis, lt, 0.3, { x: 270, y: 900, w: 340, aspect: 0.8, rot: -0.05, from: 'left', caption: 'ROOM 40', credit: 'APK · CC BY 4.0', fx: 0.4, fy: 0.5, tone: 'color' });
    credit(g, 'WALL PHOTOS: APK · CC BY 4.0 / PAUL HUDSON · CC BY 2.0', seg(lt, 0.2, 0.5));
  }, { trans: 'flash' });
  cue(lewisT, 'boom', 0.9); cue(lewisT, 'shimmer', 0.7); cue(w('answer', 'legends'), 'hit', 0.7); for (let k = 0; k < 3; k++) cue(s('answer') + 0.2 + k * 0.4, 'shutter', 0.35);

  // ======================= 1831 =======================
  // S7 — Isle of Lewis, 1831: the map dives to the Outer Hebrides
  shot(s('lewis') - 0.1, (g, lt, t) => {
    g.fillStyle = '#0B1418'; g.fillRect(0, 0, W, H);
    const u = seg(lt, 0, 2.0, ease.inOut);
    map.view({ lon: lerp(0, -5.8, u), lat: lerp(53, 57.8, u), zoom: lerp(18, 90, u), cy: H * 0.47 });
    map.draw(g, { spacing: 14, color: id => id === ISO.GBR ? rgba(C.blue, 0.45 + 0.4 * seg(lt, 0.3, 0.7)) : null });
    lewisIsland(g, seg(lt, 0.2, 0.6));
    map.pin(g, 'Isle of Lewis', { color: C.gold, a: seg(lt, 0.4, 0.7), pulse: (lt * 0.8) % 1 });
    map.pin(g, 'Edinburgh', { color: C.cream, a: 0.6 * seg(lt, 0.2, 0.5), below: true });
    placeStamp(g, lt, 'Isle of Lewis', '1831', { y: 160, t0: 0.05 });
  }, { trans: 'leak', noJump: true });
  cue(w('lewis', '1831'), 'boom', 0.7); cue(s('lewis'), 'wind', 0.5);

  // S8 — a sand dune gives up a hidden hoard: the wind strips the mound off a stone cist
  const givesT = w('hoard', 'gives'), hoardT = w('hoard', 'hoard');
  shot(s('hoard') - 0.05, (g, lt, t, sh) => {
    const rv = seg(t, givesT - 0.1, hoardT + 0.2);
    rig(B, lt, [[0, { yaw: 0.7, pitch: 0.16, dist: 15, cy: H * 0.55, target: [4, 0.6, 4] }], [len(sh), { yaw: 0.35, pitch: 0.34, dist: 8.4 }]], { t, e: ease.inOut });
    beach(g, B, t, { mound: 2.4 * (1 - rv) });
    cist(g, B, 'back', { top: lerp(-0.6, 0.5, rv) });
    drawLewisSet(g, B, beachHoard(rv), { t, dof: 0.6 });
    cist(g, B, 'front', { top: lerp(-0.6, 0.5, rv) });
    const c = at(4, 0, 4);
    if (rv > 0.6) { g.save(); g.globalCompositeOperation = 'screen'; rays(g, c.x, c.y - 40, t, { color: '#FFE2A0', a: 0.18 * rv }); g.restore(); }
    dust(g, c.x, c.y, t, givesT, { size: 60, spread: 420, n: 18, color: '#E2CFA4', life: 1.2 });
    sandWind(g, t, { a: 1 });
    badge(g, 'HIDDEN HOARD', W / 2, 300, { color: C.gold, size: 44, a: seg(t, hoardT, hoardT + 0.15), scale: pop(t, hoardT) });
  }, { trans: 'whip' });
  cue(s('hoard'), 'waves', 0.6); cue(givesT, 'wind', 0.7); cue(hoardT, 'shimmer', 0.9); cue(hoardT, 'boom', 0.6);
  // S9 — ninety-three pieces: rows of chessmen across the sand, counting up
  const n93 = w('hoard', 'Ninety-three');
  const ROWS = []; { const ty = ['k', 'q', 'b', 'n', 'r', 'p', 'p', 'r', 'b', 'n', 'p']; for (let i = 0; i < 93; i++) ROWS.push({ t: ty[i % ty.length], x: -3 + (i % 12) * 1.25, z: -1 + Math.floor(i / 12) * 1.5, tone: i % 2 && i % 5 === 0 ? 'red' : 'ivory' }); }
  shot(n93 - 0.1, (g, lt, t, sh) => {
    const n = Math.round(lerp(1, 93, seg(t, n93, n93 + 0.9, lin)));
    rig(B, lt, [[0, { yaw: -0.5, pitch: 0.42, dist: 11, cy: H * 0.5, target: [4, 0, 4] }], [len(sh), { yaw: -0.2, pitch: 0.55, dist: 13.5 }]], { t, e: lin });
    beach(g, B, t, { mound: 0 });
    drawLewisSet(g, B, ROWS.slice(0, n).map((p, i) => ({ ...p, k: 0.62, y: i === n - 1 ? 0.4 * (1 - seg(t, n93 + i / 93 * 0.9, n93 + i / 93 * 0.9 + 0.1)) : 0 })), { t, dof: 0.35 });
    sandWind(g, t, { a: 0.5 });
    counter(g, String(n), 'PIECES', { y: 330, size: 160, color: '#FFF4D6', glow: C.gold, labelColor: C.gold });
  }, { trans: 'zoom' });
  for (let k = 0; k < 6; k++) cue(n93 + k * 0.15, 'clack', 0.5);
  cue(n93 + 0.9, 'hit', 0.7);
  // S10 — carved from walrus tusk: the walrus on the beach, tusks gleaming
  const walT = w('hoard', 'walrus');
  shot(walT - 0.12, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.25, pitch: 0.06, dist: 7, cy: H * 0.6, target: [1, 1.2, 8] }], [len(sh), { yaw: -0.1, pitch: 0.05, dist: 6 }]], { t, e: ease.out });
    beach(g, B, t, { mound: 0, wind: 0.6 });
    const wp = at(0.4, sandAt(0.4, 8.4), 8.4);
    walrus(g, wp.x, wp.y - 60 * pulse(t, yesT, 0.25), wp.s * 1.15, t, { look: Math.sin(t * 1.3) });
    drawLewisSet(g, B, [{ t: 'r', x: 3.2, z: 6.6, y: sandAt(3.2, 6.6), ground: sandAt(3.2, 6.6), k: 1.1 }], { t, dof: 0.5 });
    glint(g, wp.x - wp.s * 0.6, wp.y - wp.s * 0.9, t, w('hoard', 'tusk') + 0.05, { r: 200 });
    badge(g, 'WALRUS IVORY', W / 2, 300, { color: C.blue, size: 48, a: seg(t, walT, walT + 0.15), scale: pop(t, walT) });
    badge(g, 'YES. WALRUS.', W / 2, 400, { color: C.cream, size: 40, a: seg(t, yesT, yesT + 0.1), scale: pop(t, yesT) });
  }, { trans: 'whip', whipDir: -1 });
  const yesT = T.w('hoard', -1).s;
  cue(walT, 'honk', 0.5); cue(w('hoard', 'tusk'), 'ting', 0.6); cue(yesT, 'honk', 1.0);

  // S11 — over eight hundred years old: the king on a stone in candlelight, dust motes
  const oldT = w('old', 'eight');
  shot(s('old') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.5, pitch: 0.12, dist: 5.6, cy: H * 0.56, target: [4, 1.1, 4] }], [len(sh), { yaw: 0.25, pitch: 0.14, dist: 4.8 }]], { t, e: lin });
    room(g, B, SETS.vault, { t, blur: 6, over: { light: '#FFB060', lightA: 0.22 } });
    box(g, B, [2.6, FLOOR_Y, 2.8], [5.4, 0, 5.2], { top: '#5E5A52', side: '#2E2C28', front: '#46433D' });
    pool(g, B, 4, 0, 4, 2.6, '#FFB060', 0.35);
    drawLewisSet(g, B, [{ t: 'k', x: 4, z: 4, k: 1.4, sharp: true }], { t });
    embers(g, t, { n: 40, a: 0.5, color: '#FFD9A0' });
    counter(g, '800+', 'YEARS OLD', { y: 330, size: 150, color: '#FFF4D6', glow: C.amber, labelColor: C.red, a: seg(t, oldT - 0.1, oldT + 0.1) });
    badge(g, 'c. 1150 – 1200 · NORWAY?', W / 2, 470, { color: C.cream, size: 28, a: seg(lt, 0.5, 0.7) });
    photoCard(g, P.king1845, lt, 0.35, { x: 860, y: 880, w: 230, aspect: 1.65, rot: 0.06, from: 'right', caption: 'KING', credit: 'DRAWING c.1845 · PD', tone: 'warm', fx: 0.5, fy: 0.5, zoom: [1, 1.05], dur: 2 });
  }, { trans: 'fade', transDur: 0.3, vig: 0.8 });
  cue(oldT, 'boom', 0.8); cue(oldT, 'sting', 0.5);

  // S16 — copies even show up in the first Harry Potter film: giant pieces in a stone hall, one smashed
  const hpT = w('potter', 'Harry'), smashT = w('potter', 'Potter') + 0.15;
  shot(s('potter') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.6, pitch: 0.08, dist: 9, cy: H * 0.58, target: [4, 2, 4] }], [len(sh), { yaw: 0.25, pitch: 0.12, dist: 7.5 }]], { t, e: lin, bump: pulse(t, smashT, 0.3) * 2 });
    room(g, B, HALL, { t, blur: 4 });
    B.drawSlab(g, { light: '#8A8E96', dark: '#2A2D33', frame: '#3A3D44', side: '#1A1C20' });
    const u = seg(t, smashT - 0.35, smashT, ease.in);
    const L = [{ t: 'q', x: lerp(2.5, 4.5, u), z: lerp(2.5, 5.5, u), y: Math.sin(Math.PI * u) * 0.8, k: 2.2 }, { t: 'k', x: 1.5, z: 6.5, k: 2.2, tone: 'red' }, { t: 'p', x: 6.5, z: 2.5, k: 2.2 }, { t: 'b', x: 6.5, z: 6.5, k: 2.2, tone: 'red' }];
    if (t < smashT) L.push({ t: 'n', x: 4.5, z: 5.5, k: 2.2, tone: 'red' });
    drawLewisSet(g, B, L, { t, dof: 0.5 });
    if (t >= smashT) {
      const p = at(4.5, 0, 5.5), h = p.s * 1.35 * 2.2, bx = lewisBox(h);
      shatterImage(g, lewisSprite('n', { tone: 'red' }), p.x - bx.w / 2, p.y + bx.top, bx.w, bx.h, t - smashT, { cols: 4, rows: 6, seed: 5, power: 900, gravity: 2400, life: 1.0 });
      shockwave(g, p.x, p.y, t, smashT, { r0: 60, r1: 700, color: '#CFE0FF', lw: 14 });
      burst(g, p.x, p.y - h * 0.4, t, smashT, { n: 30, color: '#E8D6B0', speed: 1100, size: 8, seed: 3 });
    }
    badge(g, 'HARRY POTTER · 2001', W / 2, 300, { color: C.gold, size: 44, a: seg(t, hpT, hpT + 0.15), scale: pop(t, hpT) });
    badge(g, 'WIZARD CHESS', W / 2, 390, { color: C.cream, size: 30, a: seg(t, hpT + 0.3, hpT + 0.45) });
  }, { trans: 'flash' });
  cue(hpT, 'shimmer', 0.7); cue(smashT - 0.35, 'whoosh', 0.6); cue(smashT, 'glass', 1); cue(smashT, 'boom', 1);

  // S17 — but five pieces were never found: glowing outlines where they should stand
  const fiveMT = w('missing', 'five'), neverT = w('missing', 'never');
  shot(s('missing') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.25, pitch: 0.2, dist: 8.6, cy: H * 0.56, target: [4, 0.9, 3.5] }], [len(sh), { yaw: 0.15, pitch: 0.18, dist: 7.6 }]], { t, e: lin });
    room(g, B, SETS.vault, { t, blur: 5, over: { light: C.red, lightA: 0.12 } });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' });
    const L = museumSet(0.9).filter(p => p.z > 6).map(p => ({ ...p, alpha: 0.7 }));
    ['r', 'r', 'n', 'r', 'r'].forEach((ty, i) => L.push({ t: ty, x: 1.6 + i * 1.2, z: 3.4, k: 1.15, ghost: true, alpha: seg(t, fiveMT + i * 0.12, fiveMT + i * 0.12 + 0.15) }));
    drawLewisSet(g, B, L, { t, dof: 0.5 });
    counter(g, '5', 'NEVER FOUND', { y: 330, size: 170, color: '#FFE9E4', glow: C.red, labelColor: C.red, a: seg(t, neverT - 0.1, neverT + 0.1) });
  }, { trans: 'fade', transDur: 0.3, vig: 0.8 });
  for (let i = 0; i < 5; i++) cue(fiveMT + i * 0.12, 'tick', 0.7);
  cue(neverT, 'sting', 0.8); cue(neverT, 'boom', 0.6);

  // ======================= 1964 → 2019 =======================
  // D1 — in 1964, an Edinburgh dealer… (push in over the shop counter onto the warder and its tag)
  shot(s('buy') - 0.05, (g, lt, t, sh) => {
    shop(g, lt, t, [[0, { yaw: -0.3, pitch: 0.22, dist: 9.5, cy: H * 0.56, target: [4.6, 1.2, 3] }], [len(sh), { yaw: -0.08, pitch: 0.12, dist: 6 }]], { dealerBlur: 5, ez: ease.out });
    placeStamp(g, lt, 'Edinburgh', '1964', { y: 160, t0: 0.05 });
  }, { trans: 'whip' });
  cue(s('buy'), 'creak', 0.5); cue(w('buy', '1964'), 'boom', 0.7);
  // D2 — …bought it for five pounds: he lifts it, pleased with himself
  const boughtT = w('buy', 'buys'), buyFiveT = w('buy', 'five');
  shot(boughtT - 0.08, (g, lt, t, sh) => {
    const u = seg(lt, 0, 0.5, ease.out);
    shop(g, lt, t, [[0, { yaw: 0.35, pitch: 0.1, dist: 7.4, cy: H * 0.44, target: [4.4, 2.6, 6] }], [len(sh), { yaw: 0.2, pitch: 0.08, dist: 6.4 }]], { piece: false, held: [lerp(4.6, 5.4, u), lerp(0, 1.4, u), lerp(3, 4.4, u)], dealerE: { ...EXPR.happy, look: [0.4, 0.6] }, blur: 4 });
    badge(g, '£5', W / 2, 300, { color: C.lime, size: 80, a: seg(t, buyFiveT, buyFiveT + 0.1), scale: pop(t, buyFiveT) });
  }, { trans: 'whip' });
  cue(boughtT, 'coins', 0.8); cue(buyFiveT, 'kaching', 0.8);
  // D3 — the dealer's ledger: "Antique Walrus Tusk Warrior Chessman … £5", written as he speaks
  const ledA = w('dealer', 'walrus') - 0.2, ledB = w('dealer', 'warrior') + 0.4;
  shot(s('dealer') - 0.05, (g, lt, t, sh) => {
    shop(g, lt, t, [[0, { yaw: -0.06, pitch: 1.15, dist: 6.0, cy: H * 0.46, target: [2.1, 0, 2.3] }], [len(sh), { yaw: 0.04, pitch: 1.22, dist: 5.3 }]], { ledger: seg(t, ledA, ledB, lin), blur: 4, dealer: false, tag: 0 });
    placeStamp(g, lt, 'The ledger', '1964', { y: 160, t0: 0.05 });
  }, { trans: 'zoom' });
  cue(ledA, 'scribble', 0.9);
  // S19 — he had no idea
  const ideaT = w('dealer', 'idea');
  shot(w('dealer', 'had') - 0.3, (g, lt, t, sh) => {
    shop(g, lt, t, [[0, { yaw: 0.1, pitch: 0.14, dist: 8.4, cy: H * 0.46, target: [4.2, 2.4, 5] }], [len(sh), { yaw: -0.05, pitch: 0.12, dist: 7.6 }]], { dealerE: { ...EXPR.happy, look: [0.6, -0.3], nod: 0.4 }, ledger: 1, blur: 4, dof: 0.3 });
    badge(g, 'NO IDEA', W / 2, 300, { color: C.red, size: 56, a: seg(t, ideaT - 0.1, ideaT + 0.05), scale: pop(t, ideaT - 0.1) });
  }, { trans: 'zoom' });
  cue(ideaT - 0.1, 'pluck', 0.8);

  // S20 — after he died, his daughter kept it in a drawer
  const diedT = w('drawer', 'dies'), dDrawT = w('drawer', 'drawer');
  shot(s('drawer') - 0.05, (g, lt, t, sh) => {
    const shut = seg(t, dDrawT - 0.4, dDrawT + 0.1, ease.in);
    home(g, lt, t, [[0, { yaw: 0.45, pitch: 0.26, dist: 14, cy: H * 0.5, target: [2.4, 2.2, 6] }], [len(sh), { yaw: 0.3, pitch: 0.3, dist: 12 }]],
      { open: 0.85 * (1 - shut), daughter: exprAt([[0, 'sad'], [1.2, { ...EXPR.sad, look: [0.6, 0.6] }]], lt), over: { light: '#BFD0FF', lightA: 0.22 }, ez: lin });
    const p = at(6.1, 2.7, 7.2); g.save(); g.globalAlpha = seg(t, diedT - 0.1, diedT + 0.2) * 0.35; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.restore();
    spotlight(g, p.x, p.y, 260, '#FFE6B0', 0.18 * seg(t, diedT - 0.1, diedT + 0.2));
  }, { trans: 'fade', transDur: 0.35, vig: 0.8 });
  cue(diedT, 'heartbeat', 0.4); cue(dDrawT - 0.4, 'drawer', 0.9);

  // S21 — 2019, the family takes it to Sotheby's
  const sothT = w('sothebys', "Sotheby's");
  shot(s('sothebys') - 0.08, (g, lt, t, sh) => {
    sale(g, lt, t, [[0, { yaw: 0.2, pitch: 0.18, dist: 17, cy: H * 0.5, target: [4, 3.2, 7] }], [len(sh), { yaw: 0.05, pitch: 0.16, dist: 13 }]], { gbp: 0, ez: lin });
    placeStamp(g, lt, 'London', '2019', { y: 160, t0: 0.05 });
    badge(g, "SOTHEBY'S", W / 2, 320, { color: C.gold, size: 52, a: seg(t, sothT, sothT + 0.15), scale: pop(t, sothT) });
  }, { trans: 'leak' });
  cue(w('sothebys', '2019'), 'boom', 0.7); cue(sothT, 'hit', 0.5);
  // E1 — experts believe…: a magnifier sweeps the warder on its plinth
  const expT = w('sothebys', 'experts'), fiveExT = w('experts', 'five'), missT = w('experts', 'missing');
  shot(expT - 0.1, (g, lt, t, sh) => {
    sale(g, lt, t, [[0, { yaw: -0.3, pitch: 0.1, dist: 4.4, cy: H * 0.58, target: [8.8, 1.3, 8.8] }], [len(sh), { yaw: -0.1, pitch: 0.08, dist: 3.8 }]], { blur: 6, bidders: false, ez: lin });
    const p = at(8.8, 0.4, 8.8), h = p.s * 1.35 * 1.1;
    const mx = p.x + Math.sin(lt * 2.4) * 140, my = p.y - h * 0.62 + Math.cos(lt * 1.7) * 60, r = 150;
    g.save(); g.beginPath(); g.arc(mx, my, r, 0, 7); g.clip();  // magnifying glass: the same sprite at 1.8×
    g.fillStyle = '#1A1E24'; g.fillRect(mx - r, my - r, r * 2, r * 2);
    g.translate(mx, my); g.scale(1.8, 1.8); g.translate(-mx, -my); drawLewis(g, 'r', p.x, p.y, h); g.restore();
    g.save(); g.strokeStyle = '#C9A05A'; g.lineWidth = 16; g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke();
    g.lineWidth = 26; g.beginPath(); g.moveTo(mx + r * 0.72, my + r * 0.72); g.lineTo(mx + r * 1.6, my + r * 1.6); g.stroke(); g.restore();
    badge(g, 'EXPERTS', W / 2, 300, { color: C.blue, size: 44, a: seg(t, expT, expT + 0.12), scale: pop(t, expT) });
  }, { trans: 'zoom' });
  cue(expT, 'whoosh', 0.4); cue(expT + 0.3, 'shutter', 0.4);
  // E2 — …one of the five missing pieces: back to the five empty outlines; the warder drops into one and it lights up
  shot(fiveExT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.15, pitch: 0.2, dist: 7.6, cy: H * 0.56, target: [4, 0.9, 3.5] }], [len(sh), { yaw: -0.05, pitch: 0.24, dist: 6.6, target: [3.2, 0.9, 3.4] }]], { t, e: lin });
    room(g, B, SETS.vault, { t, blur: 5, over: { light: C.lime, lightA: 0.08 + 0.12 * seg(t, missT, missT + 0.2) } });
    B.drawSlab(g, { light: '#3A3029', dark: '#241C17', frame: '#1A120C', side: '#0E0905' });
    const drop = seg(t, missT - 0.35, missT, ease.in), landed = t >= missT;
    const L = museumSet(0.9).filter(p => p.z > 6).map(p => ({ ...p, alpha: 0.7 }));
    ['r', 'r', 'n', 'r', 'r'].forEach((ty, i) => { if (!(i === 1 && landed)) L.push({ t: ty, x: 1.6 + i * 1.2, z: 3.4, k: 1.15, ghost: true, color: i === 1 ? C.lime : C.red }); });
    L.push({ ...PIECE, x: 2.8, z: 3.4, y: lerp(5, 0, drop), k: 1.15, glow: landed ? C.lime : null, halo: landed ? C.lime : null, haloA: 1 });
    drawLewisSet(g, B, L, { t, dof: 0.5 });
    const q = at(2.8, 0, 3.4);
    if (landed) { shockwave(g, q.x, q.y, t, missT, { r0: 40, r1: 520, color: C.lime, lw: 12, squash: 0.4 }); burst(g, q.x, q.y - 120, t, missT, { n: 26, color: C.lime, speed: 900, size: 7 }); }
    badge(g, 'ONE OF THE MISSING FIVE?', W / 2, 300, { color: C.lime, size: 40, a: seg(t, missT, missT + 0.12), scale: pop(t, missT) });
  }, { trans: 'whip' });
  for (let i = 0; i < 5; i++) cue(fiveExT + i * 0.08, 'tick', 0.5);
  cue(missT - 0.35, 'whoosh', 0.6); cue(missT, 'clack', 1); cue(missT, 'boom', 0.8); cue(missT + 0.05, 'shimmer', 0.7);

  // S23 — the hammer falls at… paddles go up, the board climbs
  const hamA = s('hammer') - 0.05, priceT = s('price');
  const bidAt = t => lerp(400000, 700000, seg(t, hamA, priceT, lin));
  shot(hamA, (g, lt, t, sh) => {
    const paddles = [[-6, 2.2, '112', hamA + 0.1], [5.2, -0.6, '208', hamA + 0.45], [10.2, -3.4, '341', hamA + 0.8], [4, 2.2, '77', hamA + 1.1]];
    sale(g, lt, t, [[0, { yaw: -0.2, pitch: 0.2, dist: 16, cy: H * 0.5, target: [3, 3.6, 7] }], [len(sh), { yaw: -0.05, pitch: 0.16, dist: 12.5 }]], { gbp: Math.round(bidAt(t) / 5000) * 5000, auctE: { ...EXPR.focus, look: [Math.sin(t * 3), 0.2] }, gavel: { lift: 1 }, paddles, ez: lin });
    counter(g, '£' + (Math.round(bidAt(t) / 5000) * 5000).toLocaleString('en-US'), null, { y: 330, size: 110, color: '#FFF4D6', glow: C.gold });
  }, { trans: 'whip' });
  for (let k = 0; k < 4; k++) cue(hamA + 0.1 + k * 0.35, 'tick', 0.6);
  cue(hamA, 'riser', 0.7);
  // S24a — seven hundred and thirty-five thousand pounds: the gavel comes down
  const slamT = priceT + 0.12;
  shot(priceT - 0.1, (g, lt, t, sh) => {
    const lift = t < slamT ? lerp(1, 1.25, seg(t, priceT - 0.1, slamT - 0.12)) * (1 - seg(t, slamT - 0.12, slamT, ease.in)) : 0;
    sale(g, lt, t, [[0, { yaw: 0.3, pitch: 0.55, dist: 4.4, cy: H * 0.6, target: [5.3, 1.8, 10.3] }], [len(sh), { yaw: 0.25, pitch: 0.5, dist: 4.0 }]], { gbp: 735000, lit: 1, auctE: 'triumph', gavel: { lift }, blur: 5, bidders: false, piece: false });
    const p = at(4.9, 1.75, 10.3);
    if (t >= slamT) { shockwave(g, p.x, p.y, t, slamT, { r0: 40, r1: 520, color: '#FFE2A0', lw: 14, squash: 0.5 }); burst(g, p.x, p.y, t, slamT, { n: 24, color: C.gold, speed: 900, size: 7 }); }
    stamp(g, 'SOLD', W / 2, 360, lt, slamT + 0.05 - (priceT - 0.1), { size: 130, color: C.red });
  }, { trans: 'zoom' });
  cue(slamT, 'gavel', 1.2); cue(slamT, 'boom', 1); cue(slamT + 0.05, 'stamp', 0.7);
  // S24b — the price on the board: £735,000, from £5
  const thouT = w('price', 'thousand');
  shot(Math.max(slamT + 0.55, thouT - 0.25), (g, lt, t, sh) => {
    sale(g, lt, t, [[0, { yaw: 0.45, pitch: 0.16, dist: 14, cy: H * 0.52, target: [0, 6, 9] }], [len(sh), { yaw: 0.3, pitch: 0.14, dist: 12 }]], { gbp: 735000, lit: 1, auctE: 'triumph', paddles: [] });
    const a = seg(lt, 0, 0.15);
    counter(g, '£735,000', null, { y: 320, size: 130, color: '#FFF4D6', glow: C.lime, a });
    badge(g, '£5 → £735,000', W / 2, 450, { color: C.lime, size: 40, a: seg(lt, 0.25, 0.4), scale: pop(lt, 0.25) });
    badge(g, 'NEARLY $1,000,000', W / 2, 540, { color: C.cream, size: 30, a: seg(lt, 0.5, 0.65) });
    confetti(g, t, s('price') + 0.4, { n: 90 });
  }, { trans: 'flash' });
  cue(thouT, 'cheer', 0.7); cue(thouT, 'kaching', 0.9); cue(thouT + 0.1, 'confetti', 0.6);

  // S25 — which means four may still be out there: a wall of drawers, four of them glowing
  const fourT = w('still', 'four');
  shot(s('still') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.25, pitch: 0.06, dist: 9, cy: H * 0.5, target: [4, 5, 9] }], [len(sh), { yaw: 0.2, pitch: 0.12, dist: 16 }]], { t, e: ease.inOut });
    room(g, B, SETS.vault, { t });
    const lit = {}; [47, 78, 90, 37].forEach((k, i) => { if (t > fourT + i * 0.12) lit[k] = C.gold; });
    drawerWall(g, B, t, { lit });
    counter(g, '4', 'STILL OUT THERE', { y: 330, size: 170, color: '#FFF4D6', glow: C.gold, labelColor: C.gold, a: seg(t, fourT, fourT + 0.12) });
  }, { trans: 'whip', vig: 0.8 });
  for (let i = 0; i < 4; i++) cue(fourT + i * 0.12, 'ting', 0.6);
  cue(fourT, 'boom', 0.6);

  // S26 — so… check your drawer: the family chest at night, the top drawer creeping open toward us
  const chkT = w('final', 'check');
  shot(s('final') - 0.05, (g, lt, t, sh) => {
    const op = seg(t, s('final') + 0.1, chkT + 0.6, ease.inOut);
    home(g, lt, t, [[0, { yaw: 0.0, pitch: 0.22, dist: 10.5, cy: H * 0.52, target: [4, 0.8, 5] }], [len(sh), { yaw: 0.0, pitch: 0.34, dist: 6.4, target: [4, 0.6, 4] }]], { open: 0.65 * op, glow: op, night: 0.6, over: { light: '#FFD27A', lightA: 0.25 }, ez: ease.out });
    const a = seg(t, chkT - 0.1, chkT + 0.25, ease.out), sc = lerp(1.3, 1, ease.back(a));
    g.save(); g.globalAlpha = a; g.translate(W / 2, 330); g.scale(sc, sc); g.translate(-W / 2, -330);
    glowText(g, 'CHECK YOUR', W / 2, 300, { font: serif(80, 800), fill: C.cream, glow: 'rgba(0,0,0,0.9)', blur: 20 });
    glowText(g, 'DRAWER.', W / 2, 400, { font: serif(110, 800), fill: C.gold, glow: 'rgba(0,0,0,0.9)', blur: 20 });
    g.restore();
  }, { trans: 'fade', transDur: 0.3, vig: 0.85 });
  cue(s('final') + 0.1, 'creak', 0.7); cue(chkT, 'shimmer', 0.8); cue(chkT, 'boom', 0.6);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.9);

  const music = [
    { t: 0, m: 'tension' }, { t: soldT, m: 'hit' }, { t: almostT - 0.1, m: 'build' }, { t: millT, m: 'victory' }, { t: s('hook3') - 0.05, m: 'drop' }, { t: s('bridge') - 0.05, m: 'void' },
    { t: s('answer') - 0.05, m: 'glory' }, { t: s('lewis') - 0.1, m: 'norse' }, { t: s('potter') - 0.05, m: 'build' }, { t: smashT, m: 'hit' },
    { t: s('missing') - 0.05, m: 'void' }, { t: s('buy') - 0.05, m: 'intrigue' }, { t: s('drawer') - 0.05, m: 'elegy' }, { t: s('sothebys') - 0.08, m: 'auction' }, { t: missT, m: 'hit' }, { t: missT + 0.6, m: 'auction' },
    { t: slamT - 0.15, m: 'drop' }, { t: slamT, m: 'victory' }, { t: s('still') - 0.05, m: 'tension' }, { t: chkT - 0.1, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.16, 1.07], shift: 50 } };
}
