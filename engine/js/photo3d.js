// 2.5D photo moves: a photo plus its depth map (tools/depth.py, near = white) rendered through a small WebGL2
// shader, so the camera can push in, drift and dolly "inside" a still photograph. The result is drawn into the
// 2D frame like any image. SwiftShader runs it on the CPU, so the shader works at 720×1280 and is upscaled.
import { W, H, clamp, lerp, ease } from './core.js';
import { loadImage } from './photo.js';

const RW = 720, RH = 1280;
let gl = null, cvs = null, prog = null, U = {};

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
// screen uv -> image uv (cover fit around a focus point), then a fixed-point search for the pixel whose
// depth-displaced position lands here: near pixels (d > focus) move with the camera shift and the dolly
const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D img, dep;
uniform vec2 span, center, shift;
uniform float dolly, focus;
void main() {
  vec2 p = center + (uv - 0.5) * span;
  vec2 c = p;
  for (int i = 0; i < 24; i++) {
    float d = texture(dep, clamp(c, 0.0, 1.0)).r - focus;
    c = p - shift * d - (p - center) * dolly * d;
  }
  o = vec4(texture(img, clamp(c, 0.001, 0.999)).rgb, 1.0);
}`;

function init() {
  cvs = document.createElement('canvas'); cvs.width = RW; cvs.height = RH;
  gl = cvs.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error('photo3d: no WebGL2');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const k of ['img', 'dep', 'span', 'center', 'shift', 'dolly', 'focus']) U[k] = gl.getUniformLocation(prog, k);
  gl.uniform1i(U.img, 0); gl.uniform1i(U.dep, 1);
}

function texture(image) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return t;
}

// load "<base>.jpg" and "<base>_depth.png"
export async function loadPhoto3d(base) {
  const [img, dep] = await Promise.all([loadImage(base + '.jpg'), loadImage(base + '_depth.png')]);
  return { img, dep, aspect: img.width / img.height, tex: null };
}

// key: {x, y} focus point in the photo (0..1), zoom (1 = cover), sx/sy camera shift, dolly, focus depth (0 far .. 1 near)
const DEF = { x: 0.5, y: 0.5, zoom: 1.05, sx: 0, sy: 0, dolly: 0, focus: 0.35 };
export function photo3d(g, ph, lt, { from = {}, to = {}, dur = 3, e = ease.inOut, a = 1 } = {}) {
  if (a <= 0) return;
  if (!gl) init();
  if (!ph.tex) ph.tex = [texture(ph.img), texture(ph.dep)];
  const u = e(clamp(lt / dur)), A = { ...DEF, ...from }, B = { ...DEF, ...from, ...to };
  const k = Object.fromEntries(Object.keys(DEF).map(n => [n, lerp(A[n], B[n], u)]));
  const sa = RW / RH, span = ph.aspect > sa ? [sa / ph.aspect / k.zoom, 1 / k.zoom] : [1 / k.zoom, ph.aspect / sa / k.zoom];
  const cx = clamp(k.x, span[0] / 2, 1 - span[0] / 2), cy = clamp(k.y, span[1] / 2, 1 - span[1] / 2);
  gl.viewport(0, 0, RW, RH);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ph.tex[0]);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ph.tex[1]);
  gl.uniform2f(U.span, span[0], span[1]); gl.uniform2f(U.center, cx, cy); gl.uniform2f(U.shift, k.sx, k.sy);
  gl.uniform1f(U.dolly, k.dolly); gl.uniform1f(U.focus, k.focus);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  g.save(); g.globalAlpha *= a; g.imageSmoothingQuality = 'high'; g.drawImage(cvs, 0, 0, W, H); g.restore();
}
