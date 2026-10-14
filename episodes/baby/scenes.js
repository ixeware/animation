// What if Magnus Carlsen taught a baby chess from day one? Someone already tried: Laszlo Polgar (1970, "geniuses are made,
// not born"), three daughters homeschooled mostly in chess; Judit a grandmaster at 15 (younger than Fischer), later beat
// Kasparov and Magnus. Magnus started at 5, GM at 13; the youngest GM ever was 12. The baby is a generic cartoon.
import { W, H, C, clamp, lerp, ease, seg, rgba, mix } from '../../engine/js/core.js';
import { confetti, spotlight } from '../../engine/js/draw.js';
import { Board, piecesAt } from '../../engine/js/board.js';
import { EXPR, exprAt, drawChar } from '../../engine/js/characters.js';
import { nameTitle, counter, badge, stamp, placeStamp, sans, serif } from '../../engine/js/hud.js';
import { rig, seated, actor } from '../../engine/js/stage.js';
import { room, table, box, FLOOR_Y } from '../../engine/js/env.js';
import { loadPhoto3d, photo3d } from '../../engine/js/photo3d.js';

const G = await fetch('../engine/data/gotham_world_2025.json').then(r => r.json());
const START = piecesAt(G, 0), MID = piecesAt(G, 14);
const photo = async k => { try { return await loadPhoto3d(`../episodes/baby/photos/${k}`); } catch { return null; } };
const PH = { sisters: await photo('sisters'), judit: await photo('judit1990') };
const B = new Board();
const COM = { light: '#EEEED2', dark: '#769656', frame: '#2B2B2B', side: '#1A1A1A' };
const NURSERY = { base: '#0E0A08', wall: ['#7A9CB8', '#6A8CA8'], seam: '#5A7A94', rail: '#E8E0D0', floor: ['#8A6A4A', '#7A5A3C'], light: '#FFF0D8', lightA: 0.35, frames: true, table: ['#C9A57A', '#8A6A4A', '#6A4E34'] };
const HOME = { base: '#0A0806', wall: ['#5A4A36', '#4E4030'], seam: '#3A2E22', rail: '#6A5440', floor: ['#3A2C1E', '#302418'], light: '#FFD9A0', lightA: 0.32, sconces: true, table: ['#6A4A2E', '#3A2614', '#2A1A0C'] };
const PCREDIT = 'HOOGOVENS CHESS 1990 · FOTOBURO DE BOER / NOORD-HOLLANDS ARCHIEF · CC0';

export async function build(T) {
  const s = id => T.s(id), w = (id, k) => T.w(id, k).s;
  const cues = [];
  const cue = (t, id, gain = 1) => cues.push({ t: +t.toFixed(3), id, gain });
  const shots = [];
  const shot = (a, draw, o = {}) => shots.push({ a, draw, ...o });
  const len = sh => sh.b - sh.a + 0.35;
  const lin = x => x;
  const pop = (t, t0, d = 0.25) => lerp(1.5, 1, seg(t, t0, t0 + d, ease.back));
  const credit = (g, text, a = 1) => { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = sans(16, 700); g.letterSpacing = '1px'; g.textAlign = 'right'; g.fillStyle = 'rgba(243,235,221,0.72)'; g.fillText(text, W - 28, H - 36); g.restore(); };
  const bg = (g, top, bot) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  const bigText = (g, l1, l2, y, { c1 = C.cream, c2 = C.gold, s1 = 96, s2 = 110, a = 1 } = {}) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = C.ink;
    g.font = sans(s1, 900); g.strokeText(l1, W / 2, y); g.fillStyle = c1; g.fillText(l1, W / 2, y);
    g.font = sans(s2, 900); g.strokeText(l2, W / 2, y + s2 * 1.08); g.fillStyle = c2; g.fillText(l2, W / 2, y + s2 * 1.08);
    g.restore();
  };
  // nursery: the baby at a little table with a board, Magnus standing behind as the coach
  const nursery = (g, lt, t, keys, { be = 'happy', me = 'smug', pieces = START, ez = lin } = {}) => {
    rig(B, lt, keys, { t, e: ez });
    const E = room(g, B, NURSERY, { t, blur: 3 });
    actor(g, B, 'magnus', { x: 7.2, y: 4.9, z: 12, k: 1.1, e: me, t });
    const hw = seated(g, B, 'baby', be, t, { x: 3.6, z: 9.2, k: 1.0, lift: 2.5, hx: 1.1 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, pieces, { focus: B.dist, dof: 1.1 }); hw();
  };

  // ======================= HOOK =======================
  const oneT = w('hook1', 'day');
  shot(0, (g, lt, t, sh) => {
    nursery(g, lt, t, [[0, { yaw: 0.06, pitch: 0.22, dist: 12, cy: H * 0.42, target: [4.6, 3.2, 10.2] }], [len(sh), { yaw: 0.02, pitch: 0.2, dist: 10.2 }]], {
      be: exprAt([[0, 'happy'], [oneT, { ...EXPR.triumph, nod: 0.6 }]], t), me: { ...EXPR.smug, look: [-0.5, 0.6] } });
    bigText(g, 'WHAT IF MAGNUS', 'TRAINED A BABY?', 250);
  }, { grade: 'warm', noJump: true });
  cue(0.05, 'boom', 0.6); cue(0.05, 'sparkle', 0.5); cue(oneT, 'pluck', 0.7);

  // someone already tried it
  const triedT = w('hook2', 'tried');
  shot(s('hook2') - 0.05, (g, lt, t, sh) => {
    if (PH.sisters) photo3d(g, PH.sisters, lt, { from: { x: 0.52, y: 0.55, zoom: 1.0, focus: 0.5 }, to: { x: 0.5, y: 0.52, zoom: 1.1, dolly: 0.1 }, dur: len(sh), e: lin });
    else bg(g, '#2A2018', '#0A0806');
    g.save(); g.fillStyle = 'rgba(8,6,4,0.7)'; g.fillRect(0, 1450, W, 130); g.restore();
    placeStamp(g, lt, 'The Polgárs', '1990', { y: 1520, t0: 0.1 });
    stamp(g, 'IT HAPPENED', W / 2, 330, t, triedT, { color: C.red, size: 100, rot: -0.1 });
    credit(g, PCREDIT, seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'bw', noJump: true });
  cue(triedT, 'stamp', 0.9);

  // ======================= THE POLGAR EXPERIMENT =======================
  const lasT = w('polgar', 'László'), madeT = w('polgar', 'made'), soT = w('polgar', 'So'), homeT = w('polgar', 'homeschooled'), chessT = T.w('polgar', -1).s;
  shot(s('polgar') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.3, pitch: 0.18, dist: 9.5, cy: H * 0.5, target: [4, 3, 9.4] }], [len(sh), { yaw: 0.12, pitch: 0.16, dist: 8 }]], { t, e: lin });
    const E = room(g, B, HOME, { t, blur: 3 });
    const hw = seated(g, B, 'laszlo', exprAt([[0, 'focus'], [madeT - (t - lt), { ...EXPR.smug, look: [0, 0.1] }]], lt), t, { z: 9.4 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, START, { focus: B.dist, dof: 1.2 }); hw();
    placeStamp(g, lt, 'Budapest', '1970', { y: 230, t0: 0.05 });
    g.save(); const nb = g.createLinearGradient(0, 1300, 0, 1640); nb.addColorStop(0, 'rgba(8,6,4,0)'); nb.addColorStop(0.35, 'rgba(8,6,4,0.78)'); nb.addColorStop(1, 'rgba(8,6,4,0.78)'); g.fillStyle = nb; g.fillRect(0, 1300, W, 340); g.restore();
    nameTitle(g, lt, 'László Polgár', 'THE FATHER', { y: 1480, t0: lasT - (t - lt), subColor: C.gold, size: 62 });
    const a = seg(t, madeT - 0.15, madeT + 0.1);
    if (a > 0) { g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(14,10,6,0.85)'; g.fillRect(70, 320, W - 140, 250); g.textAlign = 'center'; g.font = serif(64, 700); g.fillStyle = C.cream;
      g.fillText('“Geniuses are made,', W / 2, 420); g.fillStyle = C.gold; g.fillText('not born.”', W / 2, 510); g.restore(); }
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(lasT, 'hit', 0.5); cue(madeT, 'shimmer', 0.6);
  shot(soT - 0.1, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: -0.2, pitch: 0.42, dist: 12, cy: H * 0.56, target: [4, 1.5, 7] }], [len(sh), { yaw: -0.08, pitch: 0.4, dist: 10.5 }]], { t, e: lin });
    const E = room(g, B, HOME, { t, blur: 3 });
    actor(g, B, 'susan', { x: 1.2, y: 2.4, z: 9.6, k: 0.75, e: { ...EXPR.focus, look: [0.5, 0.8] }, t });
    actor(g, B, 'sofia', { x: 6.8, y: 2.4, z: 9.6, k: 0.75, e: { ...EXPR.focus, look: [-0.5, 0.8] }, t });
    const hw = seated(g, B, 'judit', { ...EXPR.happy, look: [0, 0.8] }, t, { z: 9.4, k: 0.7, lift: 2.2, hx: 1.0 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, MID, { focus: B.dist, dof: 1.1 }); hw();
    badge(g, '3 DAUGHTERS', W / 2, 260, { color: C.cream, size: 44, a: seg(t, soT, soT + 0.1) * (1 - seg(t, homeT - 0.1, homeT)), scale: pop(t, soT) });
    badge(g, 'NO SCHOOL', W / 2, 260, { color: C.red, size: 52, a: seg(t, homeT, homeT + 0.1), scale: pop(t, homeT) });
    badge(g, 'JUST CHESS', W / 2, 370, { color: C.lime, size: 52, a: seg(t, chessT, chessT + 0.1), scale: pop(t, chessT) });
  }, { trans: 'whip', grade: 'warm' });
  cue(homeT, 'stamp', 0.6); cue(chessT, 'pluck', 0.7);

  // Judit: grandmaster at 15, younger than Fischer
  const juT = w('judit', 'Judit'), gmT = w('judit', '15'), fiT = w('judit', 'Fischer');
  shot(s('judit') - 0.05, (g, lt, t, sh) => {
    if (PH.judit) photo3d(g, PH.judit, lt, { from: { x: 0.46, y: 0.36, zoom: 1.0, focus: 0.55 }, to: { x: 0.44, y: 0.32, zoom: 1.12, dolly: 0.12, sx: 0.02 }, dur: len(sh), e: lin });
    else drawChar(g, 'judit', { x: W / 2, y: H * 0.45, s: 2, e: EXPR.smug, t });
    g.save(); const nb = g.createLinearGradient(0, 1300, 0, 1640); nb.addColorStop(0, 'rgba(8,6,4,0)'); nb.addColorStop(0.35, 'rgba(8,6,4,0.75)'); nb.addColorStop(1, 'rgba(8,6,4,0.75)'); g.fillStyle = nb; g.fillRect(0, 1300, W, 340); g.restore();
    nameTitle(g, lt, 'Judit Polgár', 'THE YOUNGEST SISTER · AGE 13 HERE', { y: 1480, t0: juT - (t - lt), subColor: C.gold, size: 70 });
    badge(g, 'GRANDMASTER AT 15', W / 2, 270, { color: C.lime, size: 54, sub: '1991', a: seg(t, gmT, gmT + 0.1), scale: pop(t, gmT) });
    badge(g, 'YOUNGER THAN BOBBY FISCHER', W / 2, 420, { color: C.gold, size: 38, a: seg(t, fiT, fiT + 0.1), scale: pop(t, fiT) });
    credit(g, PCREDIT, seg(lt, 0.2, 0.4));
  }, { trans: 'flash', grade: 'bw', noJump: true });
  cue(juT, 'shimmer', 0.6); cue(gmT, 'boom', 0.8); cue(fiT, 'hit', 0.6);

  // later she beat Kasparov... and Magnus
  const kaT = w('beat', 'Kasparov'), maT = T.w('beat', -1).s;
  shot(s('beat') - 0.05, (g, lt, t, sh) => {
    rig(B, lt, [[0, { yaw: 0.25, pitch: 0.22, dist: 10, cy: H * 0.54, target: [4, 2.8, 9.4] }], [len(sh), { yaw: 0.1, pitch: 0.2, dist: 8.6 }]], { t, e: lin });
    const E = room(g, B, 'hall', { t, blur: 3 });
    const hw = seated(g, B, 'judit', { ...EXPR.triumph, nod: 0.4 }, t, { z: 9.4 });
    table(g, B, E); B.drawSlab(g, COM); B.drawPieces(g, MID, { focus: B.dist, dof: 1.1 }); hw();
    const opp = t >= maT - 0.05 ? 'MAGNUS' : 'KASPAROV';
    for (const [x, name, n, col, t0] of [[300, 'JUDIT', '1', C.gold, kaT - 0.1], [780, opp, '0', C.red, kaT]]) {
      const k = name === 'MAGNUS' ? pop(t, maT - 0.05) : pop(t, t0), a = seg(t, t0 - 0.05, t0 + 0.05);
      if (a <= 0) continue;
      g.save(); g.globalAlpha = a; g.translate(x, 330); g.scale(k, k);
      g.fillStyle = col; g.shadowColor = 'rgba(8,6,4,0.55)'; g.shadowOffsetY = 8; g.fillRect(-190, -140, 380, 250); g.shadowColor = 'transparent';
      g.fillStyle = C.ink; g.textAlign = 'center'; g.font = sans(170, 900); g.fillText(n, 0, 40); g.font = sans(36, 900); g.letterSpacing = '4px'; g.fillText(name, 0, 92); g.restore();
    }
  }, { trans: 'zoom', grade: 'cold', info: true });
  cue(kaT, 'hit', 0.8); cue(maT, 'stamp', 0.9);

  // ======================= THE AGES =======================
  const ROWS = [['MAGNUS', 5, 13, '#A8C66C'], ['JUDIT', null, 15, C.gold], ['YOUNGEST GM EVER', null, 12, C.red]];
  const timeline = (g, t, shows, { baby = -1, babyT = 0 } = {}) => {
    const x0 = 120, x1 = W - 90, ax = a => lerp(x0, x1, a / 16), y0 = 300;
    g.save(); g.fillStyle = 'rgba(12,10,8,0.88)'; g.fillRect(60, y0 - 90, W - 120, 120 + 130 * (ROWS.length + (baby >= 0 ? 1 : 0)));
    g.textAlign = 'center'; g.font = sans(26, 800); g.fillStyle = rgba(C.cream, 0.7);
    for (let a = 0; a <= 16; a += 2) { g.fillText(String(a), ax(a), y0 - 40); g.fillRect(ax(a) - 1, y0 - 26, 2, 14); }
    g.textAlign = 'left'; g.fillText('AGE', 80, y0 - 70);
    ROWS.forEach(([name, from, to, col], i) => {
      const a = seg(t, shows[i], shows[i] + 0.15); if (a <= 0) return;
      const y = y0 + 40 + i * 130, u = seg(t, shows[i], shows[i] + 0.5, ease.out);
      g.globalAlpha = a; g.font = sans(30, 900); g.fillStyle = C.cream; g.fillText(name, ax(0), y);
      if (from != null) { g.fillStyle = rgba(col, 0.35); g.fillRect(ax(from), y + 18, (ax(to) - ax(from)) * u, 40); g.fillStyle = C.cream; g.font = sans(22, 800); g.fillText('START ' + from, ax(from), y + 86); }
      g.fillStyle = col; g.beginPath(); g.arc(ax(from != null ? lerp(from, to, u) : to), y + 38, 24, 0, 7); g.fill();
      g.fillStyle = C.ink; g.font = sans(22, 900); g.textAlign = 'center'; g.fillText('GM', ax(from != null ? lerp(from, to, u) : to), y + 46); g.textAlign = 'left';
      g.fillStyle = C.cream; g.font = sans(30, 900); g.fillText(String(to), ax(to) + 34, y + 50);
      g.globalAlpha = 1;
    });
    if (baby >= 0) {
      const y = y0 + 40 + ROWS.length * 130, age = baby;
      g.font = sans(30, 900); g.fillStyle = '#9FC6E8'; g.fillText('MAGNUS-TRAINED BABY', ax(0), y);
      g.fillStyle = rgba('#9FC6E8', 0.35); g.fillRect(ax(0), y + 18, ax(age) - ax(0), 40);
      g.fillStyle = '#9FC6E8'; g.beginPath(); g.arc(ax(age), y + 38, 24, 0, 7); g.fill(); g.fillStyle = C.ink; g.font = sans(30, 900); g.textAlign = 'center'; g.fillText('?', ax(age), y + 49);
    }
    g.restore();
  };
  const mgT = w('magnus', 'Magnus'), fiveT = w('magnus', 'five'), thT = w('magnus', 'thirteen');
  shot(s('magnus') - 0.05, (g, lt, t, sh) => {
    bg(g, '#1E2A22', '#070A08');
    drawChar(g, 'magnus', { x: W / 2, y: H * 0.78, s: 1.4, e: exprAt([[0, 'focus'], [thT - (t - lt), { ...EXPR.smug, nod: 0.3 }]], lt), t });
    timeline(g, t, [fiveT - 0.1, s('magnus') + 99, 1e9]);
  }, { trans: 'whip', grade: 'neutral', info: true });
  cue(fiveT, 'tick', 0.6); cue(thT, 'hit', 0.6);

  // a baby with Magnus as its coach: the record would be in trouble
  const bbT = w('baby', 'baby'), ygT = w('baby', 'youngest'), trT = w('baby', 'trouble');
  shot(s('baby') - 0.05, (g, lt, t, sh) => {
    nursery(g, lt, t, [[0, { yaw: -0.2, pitch: 0.28, dist: 13, cy: H * 0.66, target: [4.6, 2.6, 9.6] }], [len(sh), { yaw: -0.1, pitch: 0.26, dist: 11 }]], {
      be: exprAt([[0, 'focus'], [trT - (t - lt), { ...EXPR.triumph, nod: 0.7 }]], lt), me: { ...EXPR.happy, look: [-0.4, 0.6] }, pieces: MID });
    const age = lerp(0, 11.5, seg(t, ygT, trT, ease.inOut));
    timeline(g, t, [-99, -99, ygT - 0.1], { baby: age });
    stamp(g, 'RECORD IN TROUBLE', W / 2, 1060, t, trT, { color: C.red, size: 80, rot: -0.08 });
  }, { trans: 'whip', grade: 'warm', info: true });
  cue(bbT, 'pluck', 0.6); cue(ygT, 'riser', 0.5); cue(trT, 'stamp', 1); cue(trT, 'boom', 0.6);

  // could it ever beat Magnus? tell me, and follow
  const cbT = w('cta', 'beat'), folT = T.w('cta', -1).s;
  shot(s('cta') - 0.05, (g, lt, t, sh) => {
    nursery(g, lt, t, [[0, { yaw: 0.1, pitch: 0.24, dist: 10, cy: H * 0.6, target: [5, 3, 10] }], [len(sh), { yaw: 0.04, pitch: 0.22, dist: 8.6 }]], {
      be: { ...EXPR.smug, look: [0.6, -0.2] }, me: { ...EXPR.shock, shake: 0.4 }, pieces: MID });
    bigText(g, 'COULD IT EVER', 'BEAT MAGNUS?', 230, { a: seg(t, cbT - 0.2, cbT) });
    badge(g, 'TELL ME IN THE COMMENTS · FOLLOW', W / 2, 520, { color: C.gold, size: 34, a: seg(t, folT - 0.4, folT - 0.3), scale: pop(t, folT - 0.4) });
    if (t > cbT) confetti(g, t, cbT, { n: 40 });
  }, { trans: 'zoom', grade: 'warm' });
  cue(cbT, 'hit', 0.7); cue(folT - 0.4, 'pluck', 0.8);

  const tvOff = T.duration - 0.55;
  cue(tvOff, 'tvoff', 0.6);
  const music = [
    { t: 0, m: 'intrigue' }, { t: s('hook2') - 0.05, m: 'tension' }, { t: s('polgar') - 0.05, m: 'build' }, { t: gmT, m: 'hit' }, { t: gmT + 0.4, m: 'glory' },
    { t: s('magnus') - 0.05, m: 'clockwork' }, { t: trT, m: 'drop' }, { t: s('cta') - 0.05, m: 'finale' }, { t: T.duration, m: 'end' },
  ];
  music.sort((a, b) => a.t - b.t);
  shots.sort((a, b) => a.a - b.a);
  return { shots, cues, music, tvOff, duration: T.duration, jumpCut: { every: 1.6, zooms: [1, 1.14, 1.06], shift: 46 } };
}
