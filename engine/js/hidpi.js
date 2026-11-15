// Supersampling: ?ss=2 renders the film at twice the size (2160×3840, "4K" for a vertical video) without a line of the
// engine or of an episode changing. Everything is still drawn in the film's own 1080×1920 coordinates; every canvas simply
// has S×S device pixels behind each of them, so text, edges, textures and blurs come out at the full resolution (this is
// a real render at that size, not a 1080p picture enlarged). render.mjs --scale 2 opens the page with this and a device
// scale factor of 2, and its screenshots are then 2160×3840.
// A plain script, loaded before the modules. Without ?ss (or with ss=1) it does nothing at all.
//
// What it changes on 2D canvases whose size is set after it loads:
//   canvas.width / height     the logical size, as before; the backing store is S times larger
//   setTransform / resetTransform / getTransform   work in logical units (a base scale of S sits under them)
//   drawImage(canvas, ...)    a scaled canvas counts as its logical size (source rectangles in logical units too)
//   filter                    lengths in px (blur, drop-shadow) are multiplied by S: they are not scaled by the transform
//   shadowBlur, shadowOffsetX/Y   the same
//   createPattern(canvas)     the pattern's pixels are logical ones (and CanvasPattern.setTransform keeps it so)
//   getImageData / putImageData   read and write logical pixels (a noise tile, a colour-keyed map keep their layout)
// WebGL canvases are left at their own size.
(function () {
  const S = +(new URLSearchParams(location.search).get('ss') || 1);
  if (!(S > 1)) return;
  window.SS = S;
  const HC = HTMLCanvasElement.prototype, C2 = CanvasRenderingContext2D.prototype, PT = CanvasPattern.prototype;
  const wD = Object.getOwnPropertyDescriptor(HC, 'width'), hD = Object.getOwnPropertyDescriptor(HC, 'height');
  const LOG = new WeakMap(), CTX = new WeakMap(), PAT = new WeakSet();   // canvas -> logical size; canvas -> its 2D context; patterns cut from scaled canvases
  const nGC = HC.getContext, nST = C2.setTransform, nGT = C2.getTransform, nDI = C2.drawImage, nGID = C2.getImageData, nPID = C2.putImageData, nCP = C2.createPattern, nPST = PT.setTransform;
  const scaled = c => c instanceof HTMLCanvasElement && LOG.has(c);
  const base = c => { const g = CTX.get(c); if (g) nST.call(g, S, 0, 0, S, 0, 0); };   // setting a size resets the context: put the base scale back
  const size = (c, k, v) => { v = Math.max(0, Math.floor(+v) || 0); if (!LOG.has(c)) LOG.set(c, { w: wD.get.call(c), h: hD.get.call(c), raw: false }); const l = LOG.get(c);
    if (l.raw) { (k === 'w' ? wD : hD).set.call(c, v); l[k] = v; return; }
    const first = !l.set; l.set = true; l[k] = v;
    if (first) { wD.set.call(c, Math.round(l.w * S)); hD.set.call(c, Math.round(l.h * S)); } else (k === 'w' ? wD : hD).set.call(c, Math.round(v * S));
    base(c); };
  Object.defineProperty(HC, 'width', { configurable: true, enumerable: true, get() { const l = LOG.get(this); return l ? l.w : wD.get.call(this); }, set(v) { size(this, 'w', v); } });
  Object.defineProperty(HC, 'height', { configurable: true, enumerable: true, get() { const l = LOG.get(this); return l ? l.h : hD.get.call(this); }, set(v) { size(this, 'h', v); } });
  HC.getContext = function (type, ...a) {
    if (type !== '2d') {   // WebGL and the rest: back to a plain canvas of its logical size
      const l = LOG.get(this); if (l && !l.raw) { l.raw = true; wD.set.call(this, l.w); hD.set.call(this, l.h); }
      return nGC.call(this, type, ...a);
    }
    const had = CTX.has(this), g = nGC.call(this, type, ...a);
    if (g && !had) { CTX.set(this, g); const l = LOG.get(this); if (l && !l.raw) nST.call(g, S, 0, 0, S, 0, 0); }
    return g;
  };
  const on = g => { const l = LOG.get(g.canvas); return l && !l.raw ? S : 1; };
  C2.setTransform = function (a, b, c, d, e, f) { const k = on(this);
    if (a === undefined) return nST.call(this, k, 0, 0, k, 0, 0);
    if (typeof a === 'object' && a !== null) return nST.call(this, a.a * k, a.b * k, a.c * k, a.d * k, a.e * k, a.f * k);
    return nST.call(this, a * k, b * k, c * k, d * k, e * k, f * k); };
  C2.resetTransform = function () { const k = on(this); nST.call(this, k, 0, 0, k, 0, 0); };
  C2.getTransform = function () { const m = nGT.call(this), k = on(this); return k === 1 ? m : new DOMMatrix([m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k]); };
  const isScaled = c => { const l = scaled(c) && LOG.get(c); return !!l && !l.raw; };
  C2.drawImage = function (img, ...a) {
    if (!isScaled(img)) return nDI.call(this, img, ...a);
    const l = LOG.get(img);
    if (a.length === 2) return nDI.call(this, img, a[0], a[1], l.w, l.h);
    if (a.length === 4) return nDI.call(this, img, a[0], a[1], a[2], a[3]);
    return nDI.call(this, img, a[0] * S, a[1] * S, a[2] * S, a[3] * S, a[4], a[5], a[6], a[7]);
  };
  // lengths the current transform does not touch
  const px = (v, k) => (typeof v === 'string' ? v.replace(/(-?\d*\.?\d+(?:e[-+]?\d+)?)px/gi, (_, n) => (+n * k) + 'px') : v);
  const fD = Object.getOwnPropertyDescriptor(C2, 'filter');
  if (fD) Object.defineProperty(C2, 'filter', { configurable: true, enumerable: true, get() { return px(fD.get.call(this), 1 / on(this)); }, set(v) { fD.set.call(this, px(v, on(this))); } });
  for (const p of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) { const d = Object.getOwnPropertyDescriptor(C2, p);
    Object.defineProperty(C2, p, { configurable: true, enumerable: true, get() { return d.get.call(this) / on(this); }, set(v) { d.set.call(this, v * on(this)); } }); }
  // patterns: the tile of a scaled canvas is S times too large in user space
  C2.createPattern = function (img, rep) { const p = nCP.call(this, img, rep); if (p && isScaled(img)) { PAT.add(p); nPST.call(p, new DOMMatrix([1 / S, 0, 0, 1 / S, 0, 0])); } return p; };
  PT.setTransform = function (m) { if (!PAT.has(this)) return nPST.call(this, m); const q = m ? DOMMatrix.fromMatrix(m) : new DOMMatrix(); return nPST.call(this, q.scaleSelf(1 / S, 1 / S)); };
  // pixels: code that reads or writes them thinks in logical pixels. A plain canvas of the logical size stands in between
  const plain = (w, h) => { const c = document.createElement('canvas'); wD.set.call(c, w); hD.set.call(c, h); return c; };
  C2.getImageData = function (x, y, w, h, o) {
    if (on(this) === 1) return nGID.call(this, x, y, w, h, o);
    const c = plain(w, h), g = nGC.call(c, '2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
    nDI.call(g, this.canvas, x * S, y * S, w * S, h * S, 0, 0, w, h);
    return nGID.call(g, 0, 0, w, h, o);
  };
  C2.putImageData = function (im, x, y, ...r) {
    if (on(this) === 1) return nPID.call(this, im, x, y, ...r);
    const c = plain(im.width, im.height), g = nGC.call(c, '2d'); nPID.call(g, im, 0, 0);
    this.save(); nST.call(this, 1, 0, 0, 1, 0, 0); fD && fD.set.call(this, 'none'); this.globalAlpha = 1; this.globalCompositeOperation = 'source-over'; this.shadowColor = 'transparent'; this.imageSmoothingEnabled = false;
    this.clearRect(x * S, y * S, im.width * S, im.height * S); nDI.call(this, c, 0, 0, im.width, im.height, x * S, y * S, im.width * S, im.height * S);
    this.restore();
  };
})();
