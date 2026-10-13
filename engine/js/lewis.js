// The Lewis chessmen (walrus ivory, c. 1150–1200) as carved billboard sprites, and the props of their episode:
// an antique shop, a chest of drawers, a dune beach with a stone cist, a museum vitrine, an auction room,
// a wall of drawers, a walrus. Sprites are drawn in a unit box (x in [-65, 65], y in [-170, 10], base at y = 0)
// and painted once per type/variant/tone at S px per unit.
import { W, H, C, clamp, lerp, rgba, mix, rng, makeCanvas, ease } from './core.js';
import { FLOOR_Y, BACK_Z, LEFT_X, RIGHT_X, CEIL_Y, box, pool } from './env.js';
import { drawChar, EXPR } from './characters.js';

const S = 8, SW = 130, SH = 180;

export const TONE = {
  ivory: { hi: '#FBF5E6', base: '#E8D9BA', lo: '#B39670', line: '#6A5236', deep: '#3A2C1C', fleck: '#A2855C' },
  red: { hi: '#F0C2A8', base: '#C98466', lo: '#8E5038', line: '#5A2A1A', deep: '#341810', fleck: '#7A3A26' },
};

// ---- shapes: each type is a list of parts drawn back to front ({p: Path2D} filled, {s: Path2D, w} stroked), plus carved detail ----
const P = f => { const p = new Path2D(); f(p); return p; };
const plinth = (w = 84) => ({ p: P(p => p.roundRect(-w / 2, -10, w, 10, 3)), k: 0.35 });
const throne = () => ({ p: P(p => { p.moveTo(-40, -8); p.lineTo(-40, -94); p.quadraticCurveTo(-40, -108, -26, -108); p.lineTo(26, -108); p.quadraticCurveTo(40, -108, 40, -94); p.lineTo(40, -8); p.closePath(); }), k: 0.5 });
const robe = (top = -98) => ({ p: P(p => { p.moveTo(-23, top); p.quadraticCurveTo(0, top - 6, 23, top); p.bezierCurveTo(29, -82, 30, -64, 31, -54); p.lineTo(28, -10); p.lineTo(-28, -10); p.lineTo(-31, -54); p.bezierCurveTo(-30, -64, -29, -82, -23, top); p.closePath(); }), k: -0.12 });
const ell = (x, y, rx, ry, r = 0) => P(p => p.ellipse(x, y, rx, ry, r, 0, Math.PI * 2));
const kite = (cx, top, w, bot) => P(p => { p.moveTo(cx - w / 2, top + 4); p.quadraticCurveTo(cx, top - 4, cx + w / 2, top + 4); p.quadraticCurveTo(cx + w / 2 + 1, (top + bot) / 2 - 6, cx, bot); p.quadraticCurveTo(cx - w / 2 - 1, (top + bot) / 2 - 6, cx - w / 2, top + 4); p.closePath(); });

// incised line: a light lip under a dark groove
function inc(g, T, f, w = 1.2, a = 1) {
  const p = new Path2D(); f(p);
  g.save(); g.globalAlpha *= a; g.lineCap = 'round'; g.lineJoin = 'round';
  g.translate(0.5, 0.7); g.strokeStyle = rgba(T.hi, 0.75); g.lineWidth = w; g.stroke(p);
  g.translate(-0.5, -0.7); g.strokeStyle = T.line; g.stroke(p); g.restore();
}
function eye(g, T, x, y, rx, ry, pr = 0.5, look = [0, 0]) {
  g.fillStyle = T.hi; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
  g.strokeStyle = T.line; g.lineWidth = 1.1; g.stroke();
  g.fillStyle = T.deep; g.beginPath(); g.arc(x + look[0], y + look[1], ry * pr, 0, 7); g.fill();
}
const folds = (g, T, xs, y0, y1) => xs.forEach(x => inc(g, T, p => { p.moveTo(x, y0); p.quadraticCurveTo(x + (x > 0 ? 2 : -2), (y0 + y1) / 2, x + (x > 0 ? 3 : -3), y1); }, 1.1, 0.8));
const knots = (g, T, x) => { for (const y of [-30, -58, -86]) { inc(g, T, p => { p.arc(x - 1.5, y, 3.2, 0, 7); }, 0.9); inc(g, T, p => { p.arc(x + 1.5, y + 2.5, 3.2, 0, 7); }, 0.9); } };
function face(g, T, x, y, { r = 15, wide = 1, pupil = 0.55, brow = 0, beard = 0, mouth = 0 } = {}) {
  eye(g, T, x - r * 0.4, y, 5 * wide, 3.7 * wide, pupil); eye(g, T, x + r * 0.4, y, 5 * wide, 3.7 * wide, pupil);
  for (const sd of [-1, 1]) inc(g, T, p => { p.moveTo(x + sd * r * 0.15, y - 5 - brow * sd * 0 - (brow > 0 ? 0 : -brow * 2)); p.quadraticCurveTo(x + sd * r * 0.4, y - 8 - Math.max(0, -brow) * 2, x + sd * r * 0.7, y - 4.5 + brow * 2); }, 1.2);
  inc(g, T, p => { p.moveTo(x, y - 3); p.lineTo(x - 1.5, y + 7); p.lineTo(x + 2, y + 7.5); }, 1.1);
  if (mouth) inc(g, T, p => { p.moveTo(x - 4, y + 12); p.quadraticCurveTo(x, y + 12 - mouth * 3, x + 4, y + 12); }, 1.1);
}

const DEF = {
  // warder (rook): helmeted foot soldier behind a kite shield, sword upright; v = 'berserk' bites the shield rim
  r: v => {
    const bz = v === 'berserk', st = bz ? -108 : -104;
    return {
      parts: [plinth(80),
        { p: P(p => { p.moveTo(-36, -9); p.bezierCurveTo(-37, -50, -33, -84, -26, -98); p.quadraticCurveTo(-18, -104, 0, -104); p.quadraticCurveTo(18, -104, 26, -98); p.bezierCurveTo(33, -84, 37, -50, 36, -9); p.closePath(); }) },
        { p: ell(0, -118, 17, 19) },
        { p: P(p => { p.moveTo(-19, -120); p.quadraticCurveTo(-18, -146, 0, -163); p.quadraticCurveTo(18, -146, 19, -120); p.quadraticCurveTo(0, -125, -19, -120); p.closePath(); }), k: 0.12 },
        { p: P(p => { p.moveTo(25, -62); p.lineTo(25, -158); p.lineTo(28, -166); p.lineTo(31, -158); p.lineTo(31, -62); p.closePath(); p.roundRect(17, -68, 22, 6, 2); }), k: -0.15 },
        { p: P(p => { p.moveTo(8, -84); p.lineTo(22, -60); p.lineTo(33, -60); p.lineTo(20, -90); p.closePath(); }), k: 0.15 },
        { p: kite(-9, st, 48, -14), k: -0.08 },
        { p: ell(28, -55, 8, 9) },
      ],
      detail(g, T) {
        inc(g, T, p => { p.moveTo(0, -158); p.lineTo(0, -124); }, 1);
        g.fillStyle = T.hi; g.beginPath(); g.roundRect(-2.2, -124, 4.4, bz ? 10 : 14, 1); g.fill(); g.strokeStyle = T.line; g.lineWidth = 1; g.stroke();
        if (bz) {
          eye(g, T, -7.5, -117, 6, 5, 0.3); eye(g, T, 7.5, -117, 6, 5, 0.3);
          for (const sd of [-1, 1]) inc(g, T, p => { p.moveTo(sd * 2, -122); p.lineTo(sd * 13, -127); }, 1.6);
          g.fillStyle = T.deep; g.beginPath(); g.ellipse(-3, -106.5, 10, 3.6, 0, 0, 7); g.fill();
          for (let i = 0; i < 6; i++) { g.fillStyle = T.hi; g.fillRect(-10.5 + i * 2.9, -109.5, 2.4, 3.2); g.strokeStyle = T.line; g.lineWidth = 0.5; g.strokeRect(-10.5 + i * 2.9, -109.5, 2.4, 3.2); }
        } else {
          face(g, T, 0, -116, { r: 17 });
          inc(g, T, p => { p.moveTo(-12, -108); p.quadraticCurveTo(0, -100, 12, -108); }, 1.1);
          inc(g, T, p => { p.moveTo(-7, -106); p.quadraticCurveTo(0, -103, 7, -106); }, 1.1);
        }
        inc(g, T, p => p.addPath(kite(-9, st + 6, 38, -24)), 1);
        g.fillStyle = mix(T.base, T.hi, 0.4); g.beginPath(); g.arc(-9, -72, 8, 0, 7); g.fill(); g.strokeStyle = T.line; g.lineWidth = 1.1; g.stroke();
        if (bz) for (let i = -3; i <= 3; i++) inc(g, T, p => { p.moveTo(-26 + i * 6, -100); p.lineTo(-6 + i * 6, -30); }, 0.7, 0.6);
        else { inc(g, T, p => { p.moveTo(-26, -72); p.lineTo(8, -72); p.moveTo(-9, st + 4); p.lineTo(-9, -22); }, 1.2); }
        inc(g, T, p => { p.moveTo(28, -160); p.lineTo(28, -70); }, 0.8, 0.7);
        for (const x0 of [-34, 22]) for (let i = 0; i < 4; i++) inc(g, T, p => { p.moveTo(x0 + i * 3.5, -40); p.lineTo(x0 + i * 3.5 + 6, -12); p.moveTo(x0 + i * 3.5 + 6, -40); p.lineTo(x0 + i * 3.5, -12); }, 0.6, 0.5);
      },
    };
  },
  // king: enthroned, crowned, a sword across his knees
  k: () => ({
    parts: [plinth(), throne(),
      { p: P(p => { p.moveTo(-18, -124); p.bezierCurveTo(-26, -110, -26, -96, -22, -90); p.lineTo(22, -90); p.bezierCurveTo(26, -96, 26, -110, 18, -124); p.closePath(); }), k: 0.2 },
      robe(), { p: ell(0, -116, 15, 18) },
      { p: P(p => { p.moveTo(-13, -112); p.quadraticCurveTo(-14, -96, 0, -84); p.quadraticCurveTo(14, -96, 13, -112); p.quadraticCurveTo(0, -103, -13, -112); p.closePath(); }), k: 0.05 },
      { p: P(p => { p.rect(-16, -134, 32, 7); for (const x of [-12, 0, 12]) { p.moveTo(x - 4.5, -134); p.lineTo(x, -144); p.lineTo(x + 4.5, -134); p.closePath(); p.moveTo(x + 2.6, -145); p.arc(x, -145, 2.6, 0, 7); } }), k: -0.2 },
      { p: P(p => { p.moveTo(-22, -65); p.lineTo(31, -56); p.lineTo(33, -51.5); p.lineTo(-21, -58.5); p.closePath(); p.roundRect(-26, -71, 4.5, 17, 1.5); p.moveTo(-31, -62); p.ellipse(-33, -62, 4, 3, 0, 0, 7); }), k: -0.2 },
      { p: ell(-20, -60, 7, 6) }, { p: ell(18, -55, 7, 6) },
    ],
    detail(g, T) {
      knots(g, T, -35.5); knots(g, T, 35.5);
      inc(g, T, p => { p.moveTo(-37, -94); p.quadraticCurveTo(-37, -104, -26, -104); p.lineTo(26, -104); p.quadraticCurveTo(37, -104, 37, -94); }, 0.9, 0.7);
      face(g, T, 0, -118, { r: 15 });
      inc(g, T, p => { p.moveTo(-8, -105); p.quadraticCurveTo(0, -109, 8, -105); }, 1.2);
      for (const x of [-7, -3, 1, 5]) inc(g, T, p => { p.moveTo(x, -102); p.quadraticCurveTo(x * 0.6, -94, x * 0.2, -88); }, 0.8, 0.7);
      for (const x of [-20, -16]) inc(g, T, p => { p.moveTo(x, -118); p.quadraticCurveTo(x - 3, -104, x - 1, -94); }, 0.8, 0.6);
      for (const x of [16, 20]) inc(g, T, p => { p.moveTo(x, -118); p.quadraticCurveTo(x + 3, -104, x + 1, -94); }, 0.8, 0.6);
      inc(g, T, p => { p.moveTo(-12, -89); p.quadraticCurveTo(0, -80, 12, -89); }, 1, 0.8);
      folds(g, T, [-22, -13, -4, 5, 14, 23], -48, -12);
      inc(g, T, p => { p.moveTo(-18, -62); p.lineTo(30, -54); }, 0.7, 0.6);
      for (const x of [-12, 0, 12]) { g.fillStyle = T.deep; g.beginPath(); g.arc(x, -130.5, 1.4, 0, 7); g.fill(); }
    },
  }),
  // queen: enthroned, veiled, a hand pressed to her cheek, a drinking horn on her knee
  q: () => ({
    parts: [plinth(), throne(),
      { p: P(p => { p.moveTo(-17, -130); p.bezierCurveTo(-24, -118, -28, -100, -27, -88); p.lineTo(27, -88); p.bezierCurveTo(28, -100, 24, -118, 17, -130); p.closePath(); }), k: 0.12 },
      robe(-96), { p: ell(0, -114, 14, 17) },
      { p: P(p => { p.rect(-15, -131, 30, 6); for (const x of [-11, -3.5, 3.5, 11]) { p.moveTo(x - 3, -131); p.lineTo(x, -138); p.lineTo(x + 3, -131); p.closePath(); } }), k: -0.2 },
      { p: P(p => { p.moveTo(10, -80); p.quadraticCurveTo(27, -74, 27, -55); p.lineTo(21, -55); p.quadraticCurveTo(21, -70, 8, -73); p.closePath(); }), k: -0.15 },
      { p: ell(17, -63, 6, 5) },
      { p: P(p => { p.moveTo(-31, -66); p.lineTo(-21, -61); p.lineTo(-11, -98); p.lineTo(-19, -102); p.closePath(); }), k: 0.1 },
      { p: ell(-12.5, -106, 5, 8.5, -0.25) },
    ],
    detail(g, T) {
      knots(g, T, -35.5); knots(g, T, 35.5);
      eye(g, T, -5.5, -116, 4.4, 4, 0.45); eye(g, T, 5.5, -116, 4.4, 4, 0.45);
      for (const sd of [-1, 1]) inc(g, T, p => { p.moveTo(sd * 2, -123); p.quadraticCurveTo(sd * 6, -125, sd * 10, -121); }, 1.1);
      inc(g, T, p => { p.moveTo(0, -113); p.lineTo(-1.2, -106); p.lineTo(1.6, -105.5); }, 1);
      inc(g, T, p => { p.moveTo(-3.5, -100); p.quadraticCurveTo(0, -102.5, 3.5, -99.5); }, 1.1);
      for (const sd of [-1, 1]) inc(g, T, p => { p.moveTo(sd * 15, -124); p.quadraticCurveTo(sd * 22, -110, sd * 24, -92); }, 0.8, 0.7);
      inc(g, T, p => { p.moveTo(-14, -112); p.lineTo(-11, -100); }, 0.6, 0.6);
      folds(g, T, [-22, -12, -2, 8, 18, 26], -48, -12);
      inc(g, T, p => { p.moveTo(-14, -92); p.quadraticCurveTo(0, -84, 14, -92); }, 1, 0.8);
      for (let i = 0; i < 4; i++) inc(g, T, p => { p.moveTo(13 + i * 3, -77 + i * 0.6); p.lineTo(13 + i * 3, -72 + i * 1.2); }, 0.6, 0.6);
    },
  }),
  // bishop: enthroned, two-peaked mitre, crozier and a book
  b: () => ({
    parts: [plinth(), throne(), robe(-96), { p: ell(0, -112, 14, 17) },
      { p: P(p => { p.moveTo(-15, -121); p.lineTo(-14, -140); p.lineTo(-6, -148); p.lineTo(0, -139); p.lineTo(6, -148); p.lineTo(14, -140); p.lineTo(15, -121); p.closePath(); }), k: -0.1 },
      { s: P(p => { p.moveTo(23, -12); p.lineTo(23, -140); p.bezierCurveTo(23, -158, 42, -158, 40, -142); p.bezierCurveTo(39, -133, 30, -134, 31, -142); }), w: 4.5 },
      { p: ell(23, -84, 6, 6) },
      { p: P(p => p.roundRect(-22, -74, 18, 22, 2)), k: -0.25 },
      { p: ell(-12, -56, 6.5, 5) },
    ],
    detail(g, T) {
      knots(g, T, -35.5); knots(g, T, 35.5);
      inc(g, T, p => { p.moveTo(-14.5, -126); p.quadraticCurveTo(0, -129, 14.5, -126); p.moveTo(0, -139); p.lineTo(0, -127); }, 1);
      face(g, T, 0, -113, { r: 14, mouth: 0.3 });
      inc(g, T, p => { p.moveTo(-18, -94); p.lineTo(0, -66); p.lineTo(18, -94); }, 1.1);
      folds(g, T, [-24, -14, 6, 16], -48, -12);
      inc(g, T, p => { p.moveTo(-19, -70); p.lineTo(-7, -70); p.moveTo(-19, -65); p.lineTo(-7, -65); p.moveTo(-19, -60); p.lineTo(-7, -60); }, 0.7, 0.7);
    },
  }),
  // knight: helmeted rider on a stocky pony, kite shield and spear
  n: () => ({
    parts: [plinth(88),
      { p: P(p => { p.moveTo(-28, -38); p.lineTo(-30, -10); p.lineTo(32, -10); p.lineTo(30, -38); p.closePath(); }), k: 0.15 },
      { p: P(p => { p.moveTo(30, -52); p.quadraticCurveTo(45, -40, 41, -12); p.lineTo(34, -12); p.quadraticCurveTo(37, -34, 27, -45); p.closePath(); }), k: 0.1 },
      { p: ell(2, -45, 33, 16) },
      { p: P(p => { p.moveTo(-16, -54); p.bezierCurveTo(-24, -70, -30, -84, -36, -90); p.quadraticCurveTo(-44, -95, -48, -86); p.lineTo(-56, -61); p.quadraticCurveTo(-57, -52, -49, -52); p.lineTo(-36, -56); p.quadraticCurveTo(-28, -46, -20, -40); p.closePath(); p.moveTo(-41, -90); p.lineTo(-39, -101); p.lineTo(-34, -90); p.closePath(); }) },
      { p: P(p => { p.moveTo(-8, -56); p.lineTo(-6, -94); p.quadraticCurveTo(5, -100, 16, -94); p.lineTo(18, -56); p.closePath(); }), k: 0.05 },
      { p: ell(5, -107, 12, 14) },
      { p: P(p => { p.moveTo(-8, -109); p.quadraticCurveTo(-6, -130, 5, -142); p.quadraticCurveTo(16, -130, 18, -109); p.quadraticCurveTo(5, -113, -8, -109); p.closePath(); }), k: 0.12 },
      { s: P(p => { p.moveTo(-12, -40); p.lineTo(-14, -156); }), w: 3.5 },
      { p: P(p => { p.moveTo(-17.5, -154); p.lineTo(-14.2, -168); p.lineTo(-10.5, -154); p.closePath(); }), k: -0.2 },
      { p: kite(13, -98, 30, -34), k: -0.08 },
      { p: ell(-12.5, -78, 5.5, 5.5) },
    ],
    detail(g, T) {
      eye(g, T, -45, -77, 3.4, 2.6, 0.55);
      inc(g, T, p => { p.moveTo(-54, -58); p.lineTo(-50, -57); p.moveTo(-47, -54); p.lineTo(-30, -66); p.lineTo(-12, -78); }, 0.9);
      for (let i = 0; i < 6; i++) inc(g, T, p => { p.moveTo(-33 + i * 3, -88 + i * 6); p.lineTo(-27 + i * 3, -86 + i * 6); }, 0.8, 0.7);
      for (const x of [-20, -8, 12, 24]) inc(g, T, p => { p.moveTo(x, -34); p.lineTo(x, -12); }, 0.9, 0.8);
      for (let i = 0; i < 9; i++) inc(g, T, p => { p.moveTo(-22 + i * 5, -34); p.lineTo(-22 + i * 5, -29); }, 0.6, 0.6);
      eye(g, T, 1, -108, 3.2, 2.6, 0.55); eye(g, T, 9, -108, 3.2, 2.6, 0.55);
      inc(g, T, p => { p.moveTo(5, -106); p.lineTo(4, -100); }, 0.9);
      inc(g, T, p => { p.moveTo(-1, -98); p.quadraticCurveTo(5, -93, 11, -98); }, 0.9);
      inc(g, T, p => p.addPath(kite(13, -92, 22, -42)), 0.9);
      inc(g, T, p => { p.moveTo(13, -95); p.lineTo(13, -40); p.moveTo(1, -78); p.lineTo(25, -78); }, 1);
      inc(g, T, p => { p.moveTo(5, -140); p.lineTo(5, -113); }, 0.8);
    },
  }),
  // pawn: an octagonal, gravestone-like slab
  p: () => ({
    parts: [plinth(60), { p: P(p => { p.moveTo(-26, -9); p.lineTo(-25, -70); p.quadraticCurveTo(-24, -91, 0, -93); p.quadraticCurveTo(24, -91, 25, -70); p.lineTo(26, -9); p.closePath(); }) }],
    detail(g, T) {
      inc(g, T, p => { p.moveTo(-13, -88); p.quadraticCurveTo(-14, -50, -13, -12); p.moveTo(13, -88); p.quadraticCurveTo(14, -50, 13, -12); }, 1, 0.8);
      inc(g, T, p => { p.moveTo(-25, -22); p.lineTo(25, -22); p.moveTo(-25, -27); p.lineTo(25, -27); }, 0.9, 0.7);
      inc(g, T, p => { p.moveTo(-6, -70); p.quadraticCurveTo(0, -80, 6, -70); p.quadraticCurveTo(0, -60, -6, -70); }, 0.9, 0.6);
    },
  }),
};

function paint(type, v, tone, glow) {
  const c = makeCanvas(SW * S, SH * S), g = c.getContext('2d');
  g.translate(SW * S / 2, (SH - 10) * S); g.scale(S, S);
  const T = TONE[tone] || TONE.ivory, def = DEF[type](v);
  const grad = k => {
    const gr = g.createLinearGradient(-50, -150, 55, -10), d = c => k > 0 ? mix(c, T.lo, k) : mix(c, T.hi, -k);
    gr.addColorStop(0, d(T.hi)); gr.addColorStop(0.42, d(T.base)); gr.addColorStop(1, d(T.lo)); return gr;
  };
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const pt of def.parts) {
    if (pt.s) { g.strokeStyle = T.line; g.lineWidth = pt.w + 2.2; g.stroke(pt.s); g.strokeStyle = grad(0); g.lineWidth = pt.w; g.stroke(pt.s); continue; }
    g.fillStyle = grad(pt.k || 0); g.fill(pt.p);
    g.strokeStyle = T.line; g.lineWidth = 1.3; g.stroke(pt.p);
  }
  // age: occlusion at the base, top light, flecks and hairline cracks, then the carving
  g.globalCompositeOperation = 'source-atop';
  const oc = g.createLinearGradient(0, 0, 0, -55); oc.addColorStop(0, 'rgba(40,24,10,0.35)'); oc.addColorStop(1, 'rgba(40,24,10,0)');
  g.fillStyle = oc; g.fillRect(-65, -60, 130, 70);
  const tl = g.createRadialGradient(-20, -150, 4, -20, -150, 90); tl.addColorStop(0, rgba('#FFFFFF', 0.28)); tl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = tl; g.fillRect(-65, -175, 130, 120);
  const r = rng(type.charCodeAt(0) * 7 + (v ? 3 : 0) + (tone === 'red' ? 11 : 0));
  for (let i = 0; i < 160; i++) { g.fillStyle = rgba(T.fleck, 0.08 + r() * 0.22); g.beginPath(); g.ellipse(-60 + r() * 120, -168 + r() * 165, 0.5 + r() * 2.4, 0.3 + r() * 1.3, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 6; i++) {
    let x = -40 + r() * 80, y = -160 + r() * 140; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 4; y += 3 + r() * 4; g.lineTo(x, y); }
    g.strokeStyle = rgba(T.line, 0.35); g.lineWidth = 0.5; g.stroke();
  }
  def.detail(g, T);
  if (glow) {
    g.globalCompositeOperation = 'destination-over'; g.shadowColor = glow; g.shadowBlur = 10 * S; g.fillStyle = glow;
    for (const pt of def.parts) if (pt.p) g.fill(pt.p); else { g.strokeStyle = glow; g.lineWidth = pt.w; g.stroke(pt.s); }
  }
  return c;
}

const cache = new Map();
export function lewisSprite(type, { v = '', tone = 'ivory', glow = null } = {}) {
  const key = [type, v, tone, glow].join('|');
  if (!cache.has(key)) cache.set(key, paint(type, v, tone, glow));
  return cache.get(key);
}
// draw a piece with its base at (x, y); h = pixel height of the 150-unit reference (a king is ~h tall)
export function drawLewis(g, type, x, y, h, { v = '', tone = 'ivory', glow = null, blur = 0, alpha = 1, rot = 0, sx = 1, sy = 1, filter = null, clip = null } = {}) {
  if (alpha <= 0) return;
  const img = lewisSprite(type, { v, tone, glow }), s = h / 150;
  g.save(); g.globalAlpha *= alpha;
  const f = [blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : '', filter || ''].join(' ').trim();
  if (f) g.filter = f;
  g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy);
  if (clip) { g.beginPath(); g.rect(-SW * s / 2, clip[0] * s, SW * s, (clip[1] - clip[0]) * s); g.clip(); }
  g.drawImage(img, -SW * s / 2, -(SH - 10) * s, SW * s, SH * s);
  g.restore();
}
export const lewisBox = h => { const s = h / 150; return { w: SW * s, h: SH * s, top: -(SH - 10) * s }; };

// glowing outline of a piece that is not there (the missing ones)
const gcache = new Map();
function ghostSprite(type, v, color) {
  const key = [type, v, color].join('|');
  if (gcache.has(key)) return gcache.get(key);
  const m = makeCanvas(SW * S, SH * S), mg = m.getContext('2d');
  mg.translate(SW * S / 2, (SH - 10) * S); mg.scale(S, S); mg.fillStyle = '#fff'; mg.strokeStyle = '#fff'; mg.lineCap = 'round';
  for (const pt of DEF[type](v).parts) if (pt.p) mg.fill(pt.p); else { mg.lineWidth = pt.w; mg.stroke(pt.s); }
  const o = makeCanvas(SW * S, SH * S), og = o.getContext('2d');
  og.shadowColor = color; og.shadowBlur = 4 * S; og.drawImage(m, 0, 0); og.drawImage(m, 0, 0); og.shadowBlur = 0;
  og.globalCompositeOperation = 'source-atop'; og.fillStyle = color; og.fillRect(0, 0, o.width, o.height);
  og.globalCompositeOperation = 'destination-out'; og.globalAlpha = 0.8; og.drawImage(m, 0, 0);
  gcache.set(key, o);
  return o;
}
export function ghostLewis(g, type, x, y, h, { v = '', color = C.red, a = 1, q = true, t = 0 } = {}) {
  if (a <= 0) return;
  const s = h / 150, img = ghostSprite(type, v, color);
  g.save(); g.globalAlpha *= a * (0.8 + 0.2 * Math.sin(t * 6));
  g.drawImage(img, x - SW * s / 2, y - (SH - 10) * s, SW * s, SH * s);
  if (q) { g.font = `900 ${Math.round(60 * s)}px Rubik`; g.textAlign = 'center'; g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 20; g.fillText('?', x, y - 55 * s); }
  g.restore();
}

// pieces in a set: [{t, x, y, z, k, v, tone, rot, glow, alpha, sharp, ghost, halo, ground}], drawn far to near with depth of field
export function drawLewisSet(g, b, list, { focus = null, dof = 1.4, maxBlur = 14, scale = 1.35, shadow = true, t = 0 } = {}) {
  const fz = focus ?? b.dist;
  const L = list.map(p => ({ ...p, c: b.toCam(p.x, p.y || 0, p.z) })).filter(p => p.c[2] > 0.5).sort((a, q) => q.c[2] - a.c[2]);
  for (const p of L) {
    const pr = b.project(p.x, p.y || 0, p.z), h = pr.s * scale * (p.k || 1);
    const blur = p.sharp ? 0 : clamp(Math.abs(p.c[2] - fz) * dof, 0, maxBlur);
    if (shadow && !p.ghost) {
      const gp = b.project(p.x, p.ground ?? 0, p.z);
      g.save(); g.globalAlpha = (p.alpha ?? 1) * 0.4 / (1 + Math.max(0, (p.y || 0) - (p.ground ?? 0)) * 2);
      g.fillStyle = '#000'; g.beginPath(); g.ellipse(gp.x, gp.y, h * 0.3, h * 0.08, 0, 0, 7); g.fill(); g.restore();
    }
    if (p.halo) {
      const gp = b.project(p.x, p.ground ?? (p.y || 0), p.z), rr = h * 0.8, gr = g.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, rr);
      gr.addColorStop(0, rgba(p.halo, 0.55 * (p.haloA ?? 1))); gr.addColorStop(1, rgba(p.halo, 0));
      g.save(); g.fillStyle = gr; g.beginPath(); g.ellipse(gp.x, gp.y, rr, rr * 0.4, 0, 0, 7); g.fill(); g.restore();
    }
    if (p.ghost) ghostLewis(g, p.t, pr.x, pr.y, h, { v: p.v, color: p.color || C.red, a: p.alpha ?? 1, t, q: p.q !== false });
    else drawLewis(g, p.t, pr.x, pr.y, h, { v: p.v, tone: p.tone, glow: p.glow, blur, alpha: p.alpha ?? 1, rot: p.rot || 0, sx: p.sx || 1, sy: p.sy || 1, filter: p.filter });
  }
  return L;
}

// ---------------------------------------------------------------------------------------------------------------
// sets and props

export const SETS = {
  shop: { base: '#0B0805', wall: ['#3A2A1C', '#33251A'], seam: '#1A120B', rail: '#4A3622', floor: ['#24180F', '#1E140C'], light: '#FFD08A', lightA: 0.3, lamp: true },
  home: { base: '#0A0907', wall: ['#44503E', '#3C4736'], seam: '#283024', rail: '#5A4630', floor: ['#2E2016', '#261A11'], light: '#FFD9A8', lightA: 0.3, frames: true, lamp: true },
  museum: { base: '#05070A', wall: ['#1E2730', '#1A222A'], seam: '#10161B', floor: ['#2A2E33', '#24282C'], light: '#FFE7C2', lightA: 0.2 },
  sale: { base: '#07090C', wall: ['#4A5864', '#43505C'], seam: '#2E3943', rail: '#6E7C88', floor: ['#3A1418', '#321116'], light: '#FFF1D8', lightA: 0.32, ceilingLights: true },
  vault: { base: '#030303', wall: ['#2A1E14', '#241A11'], seam: '#140E09', floor: ['#18110B', '#140E09'], light: '#FFC97A', lightA: 0.18 },
};

const spr = new Map();
// cached 2D drawing (for shelf clutter): key -> canvas of w×h drawn by f(g, w, h)
function cached(key, w, h, f) { if (!spr.has(key)) { const c = makeCanvas(w, h); f(c.getContext('2d'), w, h); spr.set(key, c); } return spr.get(key); }
const vase = (col, k) => cached('vase' + col + k, 200, 300, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, mix(col, '#FFFFFF', 0.35)); gr.addColorStop(0.5, col); gr.addColorStop(1, mix(col, '#000000', 0.55));
  g.fillStyle = gr; g.beginPath(); const nw = 30 + k * 10, bw = 80 - k * 6;
  g.moveTo(w / 2 - nw, 10); g.lineTo(w / 2 + nw, 10); g.bezierCurveTo(w / 2 + nw - 6, 80, w / 2 + bw + 14, 130, w / 2 + bw, 220);
  g.quadraticCurveTo(w / 2 + bw - 10, 290, w / 2 + 40, 296); g.lineTo(w / 2 - 40, 296); g.quadraticCurveTo(w / 2 - bw + 10, 290, w / 2 - bw, 220);
  g.bezierCurveTo(w / 2 - bw - 14, 130, w / 2 - nw + 6, 80, w / 2 - nw, 10); g.fill();
  g.strokeStyle = rgba('#FFFFFF', 0.25); g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2 - bw * 0.5, 120); g.quadraticCurveTo(w / 2 - bw * 0.7, 200, w / 2 - bw * 0.4, 270); g.stroke();
});
const clock = () => cached('clock', 220, 260, (g, w, h) => {
  g.fillStyle = '#4A2E18'; g.beginPath(); g.moveTo(10, 260); g.lineTo(10, 90); g.quadraticCurveTo(w / 2, -20, w - 10, 90); g.lineTo(w - 10, 260); g.fill();
  g.fillStyle = '#E9DFC8'; g.beginPath(); g.arc(w / 2, 120, 62, 0, 7); g.fill(); g.strokeStyle = '#C9A05A'; g.lineWidth = 8; g.stroke();
  g.strokeStyle = '#2A1E14'; g.lineWidth = 6; g.beginPath(); g.moveTo(w / 2, 120); g.lineTo(w / 2, 78); g.moveTo(w / 2, 120); g.lineTo(w / 2 + 30, 132); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillStyle = '#2A1E14'; g.fillRect(w / 2 + Math.cos(a) * 50 - 3, 120 + Math.sin(a) * 50 - 3, 6, 6); }
});
const candle = () => cached('candle', 80, 300, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#F1D58A'); gr.addColorStop(1, '#8A6A2A');
  g.fillStyle = gr; g.fillRect(w / 2 - 8, 70, 16, 200); g.beginPath(); g.ellipse(w / 2, 280, 36, 14, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w / 2, 70, 22, 8, 0, 0, 7); g.fill();
  g.fillStyle = '#EFE6D2'; g.fillRect(w / 2 - 9, 10, 18, 60);
});
const globe = () => cached('globe', 220, 300, (g, w, h) => {
  g.fillStyle = '#3A2414'; g.fillRect(w / 2 - 6, 200, 12, 80); g.beginPath(); g.ellipse(w / 2, 286, 60, 14, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(w / 2 - 30, 80, 10, w / 2, 110, 100); gr.addColorStop(0, '#E8D6A6'); gr.addColorStop(1, '#6E5A34');
  g.fillStyle = gr; g.beginPath(); g.arc(w / 2, 110, 90, 0, 7); g.fill();
  g.fillStyle = 'rgba(70,90,60,0.5)'; for (const [x, y, r] of [[-30, -20, 30], [30, 20, 25], [10, -50, 18]]) { g.beginPath(); g.ellipse(w / 2 + x, 110 + y, r, r * 0.7, 0.4, 0, 7); g.fill(); }
  g.strokeStyle = '#C9A05A'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, 110, 100, -2.4, 2.4); g.stroke();
});
const jug = col => cached('jug' + col, 220, 260, (g, w, h) => {
  g.strokeStyle = col; g.lineWidth = 16; g.beginPath(); g.arc(w / 2 + 70, 120, 45, -1.4, 1.4); g.stroke();
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, mix(col, '#FFFFFF', 0.3)); gr.addColorStop(1, mix(col, '#000000', 0.5));
  g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2 - 50, 30); g.lineTo(w / 2 + 50, 30); g.quadraticCurveTo(w / 2 + 90, 150, w / 2 + 60, 256); g.lineTo(w / 2 - 60, 256); g.quadraticCurveTo(w / 2 - 90, 150, w / 2 - 50, 30); g.fill();
});
const ITEMS = [[() => vase('#3E6E8E', 0), 1.3], [() => clock(), 1.6], [() => candle(), 1.7], [() => vase('#8E3E2E', 1), 1.1], [() => globe(), 1.9], [() => jug('#C9B48A'), 1.2], [() => vase('#4E7A4A', 2), 1.0], [() => jug('#6E6A64'), 1.0]];

// shelves of antiques along the back wall and the side walls
export function shelves(g, b, { seed = 3, blur = 0, z = BACK_Z - 0.05, sides = true } = {}) {
  const r = rng(seed);
  if (blur > 0.5) { g.save(); g.filter = `blur(${blur.toFixed(1)}px)`; }
  const wood = { top: '#5A3E26', side: '#2A1C10', front: '#3E2A18' };
  for (const y of [0.4, 3.4, 6.4, 9.4]) {
    box(g, b, [LEFT_X + 0.5, y - 0.25, z - 1.6], [RIGHT_X - 0.5, y, z], wood);
    for (let x = LEFT_X + 1.5; x < RIGHT_X - 1; x += 1.2 + r() * 1.6) {
      const kind = Math.floor(r() * (ITEMS.length + 3));
      if (kind >= ITEMS.length) {  // a run of books
        const n = 3 + Math.floor(r() * 5);
        for (let i = 0; i < n; i++) {
          const hgt = 1.3 + r() * 0.9, col = ['#6E1E1E', '#1E3A5A', '#2E4A2A', '#5A4A2A', '#3A2A3A'][Math.floor(r() * 5)];
          box(g, b, [x + i * 0.32, y, z - 1.3], [x + i * 0.32 + 0.3, y + hgt, z - 0.2], { top: mix(col, '#FFFFFF', 0.2), side: mix(col, '#000000', 0.4), front: col });
        }
        x += n * 0.32;
        continue;
      }
      const [img, hgt] = ITEMS[kind], q = b.toCam(x, y, z - 0.8);
      if (q[2] < 0.6) continue;
      const p = b.project(x, y, z - 0.8), c = img(), hh = hgt * p.s, ww = hh * c.width / c.height;
      g.drawImage(c, p.x - ww / 2, p.y - hh, ww, hh);
    }
  }
  if (blur > 0.5) g.restore();
}

// a counter top (y = 0) for the shop, pieces stand on it
export function counter(g, b, { x0 = -1.5, x1 = 9.5, z0 = 0.5, z1 = 7.5, top = '#5A3A22' } = {}) {
  box(g, b, [x0, FLOOR_Y, z0], [x1, -0.25, z1], { top: '#2A1A0E', side: '#1A1008', front: '#3A2414' });
  box(g, b, [x0 - 0.3, -0.25, z0 - 0.3], [x1 + 0.3, 0, z1 + 0.3], { top, side: '#2A1A0E', front: '#3E2816' });
}

// hand-written ledger page (canvas), written on up to u (0..1)
export function ledgerPage(u = 1) {
  const c = makeCanvas(900, 600), g = c.getContext('2d');
  g.fillStyle = '#EFE3C4'; g.fillRect(0, 0, 900, 600);
  g.strokeStyle = 'rgba(80,110,160,0.35)'; g.lineWidth = 2; for (let y = 90; y < 600; y += 56) { g.beginPath(); g.moveTo(0, y); g.lineTo(900, y); g.stroke(); }
  g.strokeStyle = 'rgba(170,50,50,0.5)'; g.beginPath(); g.moveTo(110, 0); g.lineTo(110, 600); g.moveTo(760, 0); g.lineTo(760, 600); g.stroke();
  g.fillStyle = 'rgba(30,40,80,0.55)'; g.font = '700 30px Cinzel';
  g.fillText('1964', 18, 140); g.fillText('£', 790, 140);
  const lines = [['Antique Walrus Tusk', 250], ['Warrior Chessman', 306]];
  const total = lines.reduce((s, [l]) => s + l.length, 0) + 1;
  let n = Math.round(u * total);
  g.save(); g.fillStyle = '#1E2A5A'; g.font = 'italic 700 46px Cinzel';
  for (const [l, y] of lines) { const k = Math.min(n, l.length); g.save(); g.translate(130, y); g.transform(1, 0, -0.18, 1, 0, 0); g.fillText(l.slice(0, k), 0, 0); g.restore(); n -= k; }
  if (n > 0) { g.font = '700 56px Cinzel'; g.fillText('5', 800, 306); }
  g.restore();
  g.fillStyle = 'rgba(40,40,60,0.25)'; g.font = 'italic 600 30px Cinzel';
  g.fillText('Brass candlestick, pair', 140, 418); g.fillText('2', 800, 418); g.fillText('Mantel clock', 140, 474); g.fillText('7', 800, 474);
  return c;
}

// price tag hanging on a string from a screen point (x, y), swinging
export function priceTag(g, x, y, s, text, { swing = 0, a = 1, color = '#F1E6C8' } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(swing);
  g.strokeStyle = '#D8CBB0'; g.lineWidth = 2.5 * s; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14 * s, 40 * s, 10 * s, 80 * s); g.stroke();
  g.translate(10 * s, 80 * s); g.rotate(-0.12);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 12 * s; g.fillStyle = color;
  g.beginPath(); g.moveTo(-34 * s, 0); g.lineTo(34 * s, 0); g.lineTo(34 * s, 76 * s); g.lineTo(-34 * s, 76 * s); g.lineTo(-34 * s, 14 * s); g.closePath(); g.fill();
  g.shadowBlur = 0; g.fillStyle = '#2A2016'; g.beginPath(); g.arc(0, 10 * s, 5 * s, 0, 7); g.fill();
  g.font = `900 ${Math.round(34 * s)}px Rubik`; g.textAlign = 'center'; g.fillStyle = '#7A1E1E'; g.fillText(text, 0, 58 * s);
  g.restore();
}

// chest of drawers against the back wall: the top drawer slides out toward -z by `open` (0..1).
// contents(g, zFront) draws what lies in the drawer (only z < zf is visible); top(g) dresses the top surface.
export function dresser(g, b, { open = 0, x0 = 0, x1 = 8, zf = 6, dust = 0, contents = null, top = null, glow = 0, t = 0 } = {}) {
  const wood = { top: '#5E3E24', side: '#2E1E10', front: '#4A301A' };
  box(g, b, [x0 - 0.6, FLOOR_Y, zf], [x1 + 0.6, 1.6, zf + 4.6], wood);
  if (top) top(g);
  // lower drawers and their brass pulls
  const pull = (x, y, z) => { if (b.toCam(x, y, z)[2] < 0.5) return; const p = b.project(x, y, z); g.fillStyle = '#C9A05A'; g.beginPath(); g.ellipse(p.x, p.y, p.s * 0.28, p.s * 0.1, 0, 0, 7); g.fill(); };
  for (const [ya, yb] of [[-1.5, -0.15], [-3.0, -1.7]]) {
    box(g, b, [x0, ya, zf - 0.08], [x1, yb, zf], { top: '#5A3A20', side: '#3A2614', front: '#55381F' });
    pull(x0 + 2, (ya + yb) / 2, zf - 0.1); pull(x1 - 2, (ya + yb) / 2, zf - 0.1);
  }
  const d = clamp(open) * 3.8, zd = zf - d, y0 = 0.05, y1 = 1.35;
  if (b.E[2] < zf) { if (b.poly(g, [[x0, y0, zf - 0.01], [x1, y0, zf - 0.01], [x1, y1, zf - 0.01], [x0, y1, zf - 0.01]])) { g.fillStyle = '#0A0603'; g.fill(); } }
  if (d > 0.02) {
    if (b.poly(g, [[x0 + 0.15, y0 + 0.1, zd], [x1 - 0.15, y0 + 0.1, zd], [x1 - 0.15, y0 + 0.1, zf], [x0 + 0.15, y0 + 0.1, zf]])) { g.fillStyle = '#3A2614'; g.fill(); }
    if (glow > 0) pool(g, b, (x0 + x1) / 2, y0 + 0.2, zd + d / 2, 4.5, '#FFD27A', 0.5 * glow);
    for (const xs of [x0, x1 - 0.15]) box(g, b, [xs, y0, zd], [xs + 0.15, y1 - 0.15, zf], { top: '#6A4A2C', side: '#3E2816', front: '#4A301A' });
    if (contents) { g.save(); b.poly(g, [[x0 + 0.15, -2, zd], [x1 - 0.15, -2, zd], [x1 - 0.15, 6, zd], [x0 + 0.15, 6, zd]]); contents(g, zd); g.restore(); }
  }
  box(g, b, [x0, y0, zd - 0.16], [x1, y1, zd], { top: '#6A4A2C', side: '#3A2614', front: '#5A3B21' });
  pull(x0 + 2, (y0 + y1) / 2, zd - 0.2); pull(x1 - 2, (y0 + y1) / 2, zd - 0.2);
  if (dust > 0) {  // grey film on the fronts as the years pass
    for (const q of [[[x0 - 0.6, FLOOR_Y, zf - 0.02], [x1 + 0.6, FLOOR_Y, zf - 0.02], [x1 + 0.6, 1.6, zf - 0.02], [x0 - 0.6, 1.6, zf - 0.02]], [[x0 - 0.6, 1.61, zf], [x1 + 0.6, 1.61, zf], [x1 + 0.6, 1.61, zf + 4.6], [x0 - 0.6, 1.61, zf + 4.6]]])
      if (b.poly(g, q)) { g.fillStyle = rgba('#B8B0A0', 0.3 * dust); g.fill(); }
  }
}

// things in the drawer, laid flat at y = 0.16 around (x, z): keys, buttons, letters, an old photo
export function clutter(g, b, x, z, { seed = 2 } = {}) {
  const r = rng(seed), y = 0.17;
  const flat = (cx, cz, w, d, rot, col, lines = 0) => {
    const c = Math.cos(rot), s = Math.sin(rot), P = [[-w, -d], [w, -d], [w, d], [-w, d]].map(([u, v]) => [cx + u * c - v * s, y, cz + u * s + v * c]);
    if (b.poly(g, P)) { g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.stroke(); }
    for (let i = 1; i <= lines; i++) { const v = -d + (2 * d) * i / (lines + 1), A = [cx - w * 0.8 * c - v * s, y + 0.01, cz - w * 0.8 * s + v * c], B = [cx + w * 0.8 * c - v * s, y + 0.01, cz + w * 0.8 * s + v * c];
      if (b.toCam(...A)[2] > 0.3 && b.toCam(...B)[2] > 0.3) { const a = b.project(...A), q = b.project(...B); g.strokeStyle = 'rgba(40,40,70,0.45)'; g.lineWidth = Math.max(1, a.s * 0.02); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(q.x, q.y); g.stroke(); } }
  };
  flat(x - 2.4, z + 0.3, 1.0, 0.7, 0.3, '#EDE4D0', 4);
  flat(x - 2.1, z + 0.6, 0.9, 0.6, -0.2, '#E2D6BC', 3);
  flat(x + 2.3, z + 0.5, 0.7, 0.55, 0.5, '#BFB6A4');
  flat(x + 2.3, z + 0.5, 0.55, 0.4, 0.5, '#5E574C');
  flat(x + 0.1, z + 0.1, 1.6, 0.9, 0.05, '#D9CFB8');                                   // the cloth the piece lies on
  for (let i = 0; i < 6; i++) {
    const px = x - 3 + r() * 6, pz = z - 0.5 + r() * 1.6;
    if (Math.abs(px - x) < 1.6) continue;
    if (b.toCam(px, y, pz)[2] < 0.4) continue;
    const p = b.project(px, y, pz), rr = p.s * (0.12 + r() * 0.08);
    g.fillStyle = ['#C9A05A', '#8E8A84', '#3A3A3A', '#A0522D'][i % 4]; g.beginPath(); g.ellipse(p.x, p.y, rr, rr * 0.6, 0, 0, 7); g.fill();
  }
  // a key
  if (b.toCam(x + 1.8, y, z - 0.5)[2] > 0.4) {
    const p = b.project(x + 1.8, y, z - 0.5), s = p.s;
    g.save(); g.translate(p.x, p.y); g.rotate(0.4); g.strokeStyle = '#B8893A'; g.lineWidth = s * 0.07;
    g.beginPath(); g.ellipse(0, 0, s * 0.22, s * 0.13, 0, 0, 7); g.moveTo(s * 0.22, 0); g.lineTo(s * 0.95, 0); g.moveTo(s * 0.8, 0); g.lineTo(s * 0.8, s * 0.12); g.moveTo(s * 0.65, 0); g.lineTo(s * 0.65, s * 0.1); g.stroke(); g.restore();
  }
}

// ---- beach (outdoor) ----
const sandH = (x, z, mound = 0) => 3.4 * Math.exp(-((x + 8) ** 2) / 50 - ((z - 12) ** 2) / 30) + 2.4 * Math.exp(-((x - 16) ** 2) / 40 - ((z - 13) ** 2) / 24)
  + 0.3 * Math.sin(x * 0.7 + z * 0.45) * clamp((Math.hypot(x - 4, z - 4) - 3) / 6) * clamp((21 - z) / 6)
  + mound * Math.exp(-((x - 4) ** 2) / 8 - ((z - 4) ** 2) / 6) - 0.6 * clamp((z - 18) / 5);
export const sandAt = sandH;

export function beach(g, b, t, { mound = 0, blur = 0, night = 0, wind = 1 } = {}) {
  // sky: stormy gradient to a pale horizon
  const fw = [-Math.sin(b.yaw), 0, Math.cos(b.yaw)], E = b.E;
  const hz = b.project(E[0] + fw[0] * 1e5, 0, E[2] + fw[2] * 1e5).y;
  const sky = g.createLinearGradient(0, hz - 1400, 0, hz);
  sky.addColorStop(0, mix('#1E2A36', '#05080C', night)); sky.addColorStop(0.7, mix('#5E6E78', '#16202A', night)); sky.addColorStop(1, mix('#A8B4B4', '#2A3640', night));
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // clouds drifting with the yaw
  const r = rng(17);
  g.save(); g.globalAlpha = 0.35;
  for (let i = 0; i < 9; i++) {
    const x = ((r() * 2600 - b.yaw * 900 + t * (12 + r() * 20)) % 2600 + 2600) % 2600 - 760, y = hz - 120 - r() * 900, w = 300 + r() * 500;
    const gr = g.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, mix('#C9D2D6', '#3A4650', night)); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, w * 0.32, 0, 0, 7); g.fill();
  }
  g.restore();
  // sea plane with incoming swell lines
  if (b.poly(g, [[-900, -0.7, 20], [900, -0.7, 20], [900, -0.7, 2000], [-900, -0.7, 2000]])) { g.fillStyle = mix('#2E4A52', '#0C161A', night); g.fill(); }
  for (let k = 0; k < 12; k++) {
    const z = 20 + ((k * 9 - t * 3) % 108 + 108) % 108;
    if (b.poly(g, [[-200, -0.68, z], [200, -0.68, z], [200, -0.68, z + 0.5], [-200, -0.68, z + 0.5]])) { g.fillStyle = rgba('#DDE8EA', 0.25 * clamp((z - 20) / 8) * (1 - night * 0.6)); g.fill(); }
  }
  // sand: heightfield quads, far to near, lit from the upper left
  // coarse 2-unit cells, with 1-unit cells around the hoard where the mound needs the detail
  const Q = [], fine = (x, z) => x >= -6 && x < 14 && z >= -6 && z < 14;
  for (let x = -30; x < 38; x += 2) for (let z = -16; z < 24; z += 2) {
    if (fine(x, z)) { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const c = b.toCam(x + i + 0.5, sandH(x + i + 0.5, z + j + 0.5, mound), z + j + 0.5); if (c[2] > -2) Q.push([x + i, z + j, c[2], 1]); } continue; }
    const c = b.toCam(x + 1, sandH(x + 1, z + 1, mound), z + 1);
    if (c[2] < -2) continue;
    Q.push([x, z, c[2], 2]);
  }
  Q.sort((a, q) => q[2] - a[2]);
  const target = blur > 0.5 ? (g.save(), g.filter = `blur(${blur.toFixed(1)}px)`, g) : g;
  for (const [x, z, d, st] of Q) {
    const h00 = sandH(x, z, mound), h10 = sandH(x + st, z, mound), h01 = sandH(x, z + st, mound), h11 = sandH(x + st, z + st, mound);
    const nx = (h00 - h10 + h01 - h11) / (2 * st), nz = (h00 - h01 + h10 - h11) / (2 * st), lit = clamp(0.62 + nx * 0.8 - nz * 0.5, 0.25, 1.1);
    const wet = clamp((z - 16) / 5), base = mix(mix('#D2BC8E', '#8E7A5A', wet), '#0A0D10', night * 0.6);
    const col = mix(mix(base, '#000000', 1 - Math.min(1, lit)), '#FFFFFF', Math.max(0, lit - 1) * 0.5);
    if (b.poly(target, [[x, h00, z], [x + st + 0.04, h10, z], [x + st + 0.04, h11, z + st + 0.04], [x, h01, z + st + 0.04]])) { target.fillStyle = mix(col, mix('#5E6E78', '#10161C', night), clamp((d - 12) / 40) * 0.7); target.fill(); }
  }
  if (blur > 0.5) g.restore();
  // shore foam
  for (let k = 0; k < 2; k++) {
    const z = 21 + Math.sin(t * 0.9 + k * 2) * 0.8 + k * 0.6;
    if (b.poly(g, [[-200, -0.6, z], [200, -0.6, z], [200, -0.6, z + 0.35], [-200, -0.6, z + 0.35]])) { g.fillStyle = rgba('#F2F6F4', 0.5 - k * 0.2); g.fill(); }
  }
  // marram grass on the dunes, bending in the wind
  const rg = rng(23);
  for (let i = 0; i < 70; i++) {
    const x = -16 + rg() * 40, z = 6 + rg() * 12, h = sandH(x, z, 0);
    if (h < 0.9 || b.toCam(x, h, z)[2] < 0.6) continue;
    const p = b.project(x, h, z), s = p.s, sw = Math.sin(t * 2.4 + i) * 0.25 * wind + 0.35 * wind;
    g.strokeStyle = mix('#8E9A5A', '#20281A', night * 0.7); g.lineWidth = Math.max(1, s * 0.03); g.beginPath();
    for (let k = -2; k <= 2; k++) { g.moveTo(p.x + k * s * 0.06, p.y); g.quadraticCurveTo(p.x + k * s * 0.1 + sw * s * 0.4, p.y - s * 0.5, p.x + k * s * 0.15 + sw * s * 0.9, p.y - s * (0.8 + 0.1 * k * k)); }
    g.stroke();
  }
  return hz;
}
// blowing sand: streaks across the frame
export function sandWind(g, t, { a = 1, n = 140, seed = 9, color = '#E8D6AE' } = {}) {
  if (a <= 0) return;
  const r = rng(seed);
  g.save(); g.strokeStyle = rgba(color, 0.35 * a); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sp = 900 + r() * 1400, y = r() * H, len = 30 + r() * 90, x = ((r() * (W + 400) + t * sp) % (W + 400)) - 200, w = 1 + r() * 3;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, y + Math.sin(t * 3 + i) * 8); g.lineTo(x - len, y + Math.sin(t * 3 + i) * 8 + 4); g.stroke();
  }
  g.restore();
}
// stone cist (the hoard's chamber) around (cx, cz); draw(g, 'back') before the pieces and (g, 'front') after
export function cist(g, b, part, { cx = 4, cz = 4, w = 3.8, d = 3.0, top = 0.5 } = {}) {
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y0 = -0.9, th = 0.28;
  const stone = { top: '#9A8E78', side: '#4E4638', front: '#746A58' };
  const walls = [
    [[x0, y0, z0], [x1, top, z0 + th], [cx, 0, z0]], [[x0, y0, z1 - th], [x1, top + 0.2, z1], [cx, 0, z1]],
    [[x0, y0, z0], [x0 + th, top - 0.1, z1], [x0, 0, cz]], [[x1 - th, y0, z0], [x1, top + 0.1, z1], [x1, 0, cz]],
  ];
  if (part === 'back') if (b.poly(g, [[x0, -0.5, z0], [x1, -0.5, z0], [x1, -0.5, z1], [x0, -0.5, z1]])) { g.fillStyle = '#2A2218'; g.fill(); }
  const E = b.E;
  for (const [a, q, c] of walls) {
    const near = c[2] === z0 ? E[2] < z0 : c[2] === z1 ? E[2] > z1 : c[0] === x0 ? E[0] < x0 : E[0] > x1;
    if ((part === 'front') === near) box(g, b, a, q, stone);
  }
}

// a wall of small drawers (apothecary cabinet) on the back wall; lit = {index: color}
export function drawerWall(g, b, t, { lit = {}, cols = 14, rows = 9, x0 = LEFT_X + 1, x1 = RIGHT_X - 1, y0 = FLOOR_Y + 0.4, y1 = CEIL_Y - 1.2, z = BACK_Z, open = {} } = {}) {
  const dw = (x1 - x0) / cols, dh = (y1 - y0) / rows;
  box(g, b, [x0 - 0.3, y0 - 0.3, z - 1.2], [x1 + 0.3, y1 + 0.3, z], { top: '#3A2614', side: '#24180C', front: '#2A1C10' });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const k = j * cols + i, xa = x0 + i * dw + 0.08, xb = xa + dw - 0.16, ya = y0 + j * dh + 0.08, yb = ya + dh - 0.16, col = lit[k];
    const o = (open[k] || 0) * 1.2;
    box(g, b, [xa, ya, z - 1.3 - o], [xb, yb, z - 1.2 - (o ? o - 0.1 : 0)], { top: '#6A4A2C', side: '#3A2614', front: col ? mix('#5A3B21', col, 0.35) : (i + j) % 2 ? '#5A3B21' : '#553820' });
    const c = [(xa + xb) / 2, (ya + yb) / 2, z - 1.32 - o];
    if (b.toCam(...c)[2] < 0.5) continue;
    const p = b.project(...c);
    g.fillStyle = '#C9A05A'; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, p.s * 0.09), 0, 7); g.fill();
    if (col) {
      const pulseA = 0.6 + 0.4 * Math.sin(t * 5 + k);
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * dw * 1.2);
      gr.addColorStop(0, rgba(col, 0.6 * pulseA)); gr.addColorStop(1, rgba(col, 0));
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.s * dw * 1.2, 0, 7); g.fill(); g.restore();
      g.save(); g.font = `900 ${Math.round(p.s * dh * 0.5)}px Rubik`; g.textAlign = 'center'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 16; g.fillText('?', p.x, p.y - p.s * dh * 0.12); g.restore();
    }
  }
}

// glass vitrine over a pedestal: pedestal() before the contents, glass() after
export function vitrine(g, b, part, { x0 = -0.8, x1 = 8.8, z0 = -0.8, z1 = 8.8, y1 = 3.6, t = 0 } = {}) {
  if (part === 'pedestal') {
    box(g, b, [x0 + 0.4, FLOOR_Y, z0 + 0.4], [x1 - 0.4, -0.4, z1 - 0.4], { top: '#2A2E33', side: '#16191C', front: '#202428' });
    box(g, b, [x0, -0.4, z0], [x1, -0.05, z1], { top: '#E8E2D4', side: '#9A958A', front: '#C9C3B6' });
    return;
  }
  const y0 = -0.05, F = [
    [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
    [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
    [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
  ];
  g.save();
  for (const q of F) if (b.poly(g, q)) { g.fillStyle = 'rgba(190,220,240,0.05)'; g.fill(); g.strokeStyle = 'rgba(230,245,255,0.35)'; g.lineWidth = 2; g.stroke(); }
  // a moving glare streak across the front pane
  const u = ((t * 0.15) % 1.6) - 0.3, xa = lerp(x0, x1, u), xb = lerp(x0, x1, u + 0.12);
  if (b.poly(g, [[xa, y0, z0 - 0.01], [xb, y0, z0 - 0.01], [xb + 1.2, y1, z0 - 0.01], [xa + 1.2, y1, z0 - 0.01]])) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill(); }
  g.restore();
}

// auction rostrum with a lectern front
export function rostrum(g, b, { x = 4, z = 11, w = 3.6 } = {}) {
  box(g, b, [x - w / 2, FLOOR_Y, z - 0.8], [x + w / 2, 1.5, z + 0.8], { top: '#5A3A22', side: '#2A1A0E', front: '#3E2816' });
  box(g, b, [x - w / 2 - 0.15, 1.5, z - 0.95], [x + w / 2 + 0.15, 1.75, z + 0.95], { top: '#6A4A2C', side: '#3A2614', front: '#4A301A' });
}
// the room's currency board (canvas): rows of converted amounts for a sterling bid
export function currencyBoard(gbp, { lit = 0 } = {}) {
  const c = makeCanvas(700, 900), g = c.getContext('2d');
  g.fillStyle = '#0B0F14'; g.fillRect(0, 0, 700, 900);
  g.strokeStyle = '#3A4654'; g.lineWidth = 8; g.strokeRect(4, 4, 692, 892);
  const rows = [['STERLING', '£', 1], ['US DOLLAR', '$', 1.26], ['EURO', '€', 1.12], ['SWISS FRANC', 'CHF', 1.25], ['HONG KONG $', 'HK$', 9.85], ['YEN', '¥', 136]];
  g.textBaseline = 'middle';
  rows.forEach(([n, sym, k], i) => {
    const y = 110 + i * 138, v = Math.round(gbp * k / (k > 50 ? 1000 : 1)) * (k > 50 ? 1000 : 1);
    g.fillStyle = i === 0 ? mix('#FFD27A', '#FFFFFF', lit) : '#E8EEF2'; g.font = `800 ${i === 0 ? 40 : 30}px "JetBrains Mono"`; g.textAlign = 'left';
    g.fillText(n, 34, y - 26);
    g.font = `800 ${i === 0 ? 68 : 52}px "JetBrains Mono"`; g.textAlign = 'right'; g.fillStyle = i === 0 ? mix('#FFC94A', '#FFFFFF', lit) : '#7FE3A0';
    g.fillText(`${sym} ${v.toLocaleString('en-US')}`, 670, y + 26);
  });
  return c;
}

// a walrus, sprawled on the sand: (x, y) is the bottom of its belly, s px per unit (body ~3 units long)
export function walrus(g, x, y, s, t, { look = 0, a = 1 } = {}) {
  if (a <= 0) return;
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s / 100, s / 100);
  const br = Math.sin(t * 2) * 4;
  const gr = g.createLinearGradient(-160, -200, 160, 0); gr.addColorStop(0, '#B07A5A'); gr.addColorStop(1, '#6A3E2A');
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(-170, 0); g.bezierCurveTo(-190, -90, -110, -150 - br, -10, -160 - br); g.bezierCurveTo(90, -165, 140, -120, 150, -60); g.quadraticCurveTo(160, -10, 120, 0); g.closePath(); g.fill();
  g.fillStyle = '#5A3220'; g.beginPath(); g.ellipse(-120, -10, 50, 16, -0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(160, -6, 40, 12, 0.3, 0, 7); g.fill();
  g.strokeStyle = 'rgba(60,30,20,0.35)'; g.lineWidth = 4;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-40 + i * 30, -60, 40, -1.2, -0.4); g.stroke(); }
  // head
  g.save(); g.translate(-80 + look * 6, -150 - br);
  const hg = g.createRadialGradient(-20, -30, 10, 0, 0, 80); hg.addColorStop(0, '#C48C68'); hg.addColorStop(1, '#7A4A32');
  g.fillStyle = hg; g.beginPath(); g.ellipse(0, 0, 70, 58, 0, 0, 7); g.fill();
  // tusks
  for (const sd of [-1, 1]) {
    const tg = g.createLinearGradient(0, 20, 0, 170); tg.addColorStop(0, '#FFF6E2'); tg.addColorStop(1, '#D9C49C');
    g.fillStyle = tg; g.strokeStyle = '#9A8462'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(sd * 16 - 9, 30); g.quadraticCurveTo(sd * 22, 110, sd * 14, 175); g.quadraticCurveTo(sd * 30, 110, sd * 16 + 9, 30); g.closePath(); g.fill(); g.stroke();
  }
  // whisker pad and whiskers
  g.fillStyle = '#B98262'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 24, 22, 30, 24, 0, 0, 7); g.fill(); }
  g.fillStyle = '#5A3220'; for (let i = 0; i < 14; i++) { const sd = i % 2 ? 1 : -1; g.beginPath(); g.arc(sd * (10 + (i >> 1) * 5), 16 + (i % 3) * 8, 2.2, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(240,230,210,0.7)'; g.lineWidth = 2;
  for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 30, 18 + i * 5); g.lineTo(sd * (70 + i * 3), 14 + i * 9); g.stroke(); }
  // eyes (blink)
  const bl = (t % 3.3) < 0.12 ? 0.1 : 1;
  g.fillStyle = '#1A0E08'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 28 + look * 4, -24, 6, 6 * bl, 0, 0, 7); g.fill(); }
  g.fillStyle = '#FFFFFF'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(sd * 28 + look * 4 - 2, -26, 2, 0, 7); g.fill(); }
  g.restore();
  g.restore();
}

// a framed character portrait (sepia), for a photo on a dresser or a wall
export function portrait(who, e, { w = 600, h = 760, bg = '#8A7A62' } = {}) {
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const gr = g.createRadialGradient(w / 2, h * 0.35, 40, w / 2, h * 0.4, h * 0.7); gr.addColorStop(0, mix(bg, '#FFFFFF', 0.25)); gr.addColorStop(1, mix(bg, '#000000', 0.4));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  drawChar(g, who, { x: w / 2, y: h * 0.4, s: 1.25, e: typeof e === 'string' ? EXPR[e] : e, t: 0 });
  return c;
}
