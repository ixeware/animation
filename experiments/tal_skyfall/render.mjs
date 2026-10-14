// Standalone renderer for this one-off edit (does not touch the engine or the episode renderer).
//   node render.mjs --stills 1,15,26      -> build/stills
//   node render.mjs [--workers 4] [--fps 30] [--from 0 --to 10]   -> build/video.mp4 (silent)
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname), ROOT = path.resolve(HERE, '../..'), BUILD = path.join(HERE, 'build');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const FPS = +(opt('fps') || 30);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const PORT = server.address().port;
async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/experiments/tal_skyfall/index.html`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  return page;
}
const shot = (page, t, f) => page.evaluate(([t, f]) => window.renderFrame(t, f), [t, f]).then(() => page.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1080, height: 1920 } }));
fs.mkdirSync(BUILD, { recursive: true });
const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  if (opt('stills')) {
    const dir = path.join(BUILD, 'stills'); fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser), ts = opt('stills').split(',').map(Number), files = [];
    for (const t of ts) { const f = path.join(dir, `t${t.toFixed(2)}.jpg`); fs.writeFileSync(f, await shot(page, t, Math.round(t * FPS))); files.push(f); }
    if (files.length > 1) { const cols = Math.min(6, files.length);
      execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]scale=360:640[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') +
        `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|') + ':fill=black', path.join(dir, 'sheet.jpg')]); }
    console.log('stills ->', dir);
  } else {
    const p0 = await openPage(browser), dur = await p0.evaluate('window.DURATION'); await p0.close();
    const from = +(opt('from') || 0), to = +(opt('to') || dur), f0 = Math.round(from * FPS), f1 = Math.round(to * FPS), N = +(opt('workers') || 4), per = Math.ceil((f1 - f0) / N), t0 = Date.now();
    let done = 0;
    const parts = await Promise.all([...Array(N)].map(async (_, w) => {
      const a = f0 + w * per, b = Math.min(f1, a + per), out = path.join(BUILD, `part${w}.mp4`); if (a >= b) return null;
      const page = await openPage(browser);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = a; f < b; f++) { const buf = await shot(page, f / FPS, f); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (++done % 120 === 0) console.log(`${done}/${f1 - f0} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`); }
      ff.stdin.end(); await new Promise(r => ff.on('close', r)); return out;
    }));
    const list = path.join(BUILD, 'parts.txt'); fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(BUILD, 'video.mp4')]);
    parts.filter(Boolean).forEach(p => fs.unlinkSync(p));
    console.log(`video -> ${path.join(BUILD, 'video.mp4')} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
} finally { await browser.close(); server.close(); }
