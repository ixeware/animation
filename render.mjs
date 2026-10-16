// Render an episode with headless Chromium.
//   node render.mjs fischer --stills 0.5,12,30      -> build/stills/t*.jpg (+ contact sheet)
//   node render.mjs fischer [--workers 4] [--from 0 --to 10]  -> build/video.mp4 (silent) + cues.json
//   node render.mjs fischer --cues                       -> build/cues.json only (sound edits: then audio/mix.py)
//   node render.mjs fischer --qa [--step 0.1]       -> build/qa.json: text over faces / captions, text off frame, faces cut
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const ep = args[0];
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const BUILD = path.join(ROOT, 'episodes', ep, 'build');
const FPS = 30;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const PORT = server.address().port;

async function openPage(browser, extra = '') {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${PORT}/engine/index.html?ep=${ep}${extra}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  return page;
}

const shot = (page, t, f) => page.evaluate(([t, f]) => window.renderFrame(t, f), [t, f])
  .then(() => page.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1080, height: 1920 } }));


// ---- QA: step through the film and flag layout mistakes from the rectangles the engine logs in QA mode
function qaCheck(fr, t, W = 1080, H = 1920) {
  if (fr.skip) return [];
  const M = fr.M, tf = r => {
    if (r.screen || !M) return r;
    const pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].map(([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { ...r, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const it = fr.items.map(tf), area = r => Math.max(1, r.w * r.h);
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const texts = it.filter(r => r.kind === 'text'), faces = it.filter(r => r.kind === 'face' && r.w > 60), caps = it.filter(r => r.kind === 'caption');
  const out = [];
  for (const x of texts) {
    for (const f of faces) if (inter(x, f) / area(f) > 0.12) out.push(['text over face', `"${x.label}" / ${f.label}`]);
    for (const c of caps) if (inter(x, c) / Math.min(area(x), area(c)) > 0.1) out.push(['text over captions', `"${x.label}"`]);
    if (x.x < -4 || x.y < -4 || x.x + x.w > W + 4 || x.y + x.h > H + 4) out.push(['text off frame', `"${x.label}"`]);
    // a person's name title belongs at the top, above the head (as in the reference), never down over the board
    if (x.label.startsWith('name: ') && x.y + x.h / 2 > H * 0.33) out.push(['name title low', `"${x.label}"`]);
    for (const y of texts) if (x !== y && x.label < y.label && inter(x, y) / Math.min(area(x), area(y)) > 0.2) out.push(['texts overlap', `"${x.label}" / "${y.label}"`]);
  }
  for (const f of faces) {
    for (const c of caps) if (inter(f, c) / area(f) > 0.25) out.push(['captions over face', f.label]);
    const inside = inter(f, { x: 0, y: 0, w: W, h: H }) / area(f);
    if (inside < 0.55 && area(f) < W * H * 0.5) out.push(['face cut by frame', f.label]);
  }
  return out.filter(([type]) => !(fr.allow || []).includes(type)).map(([type, what]) => ({ t, type, what, shot: fr.shot }));
}

const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--disable-web-security'] });
try {
  if (args.includes('--qa')) {
    const step = +(opt('step') || 0.1), N = +(opt('workers') || 4);
    const p0 = await openPage(browser, '&qa=1'); const dur = await p0.evaluate('window.DURATION'); await p0.close();
    const ts = []; for (let t = 0.05; t < dur - 0.6; t += step) ts.push(+t.toFixed(3));
    const per = Math.ceil(ts.length / N);
    const found = (await Promise.all([...Array(N)].map(async (_, w) => {
      const page = await openPage(browser, '&qa=1'), mine = ts.slice(w * per, (w + 1) * per), res = [];
      for (const t of mine) res.push(...qaCheck(await page.evaluate(t => window.qaFrame(t), t), t));
      await page.close(); return res;
    }))).flat().sort((a, b) => a.t - b.t);
    // merge each (type, what) into time ranges
    const ranges = [];
    for (const f of found) {
      const r = ranges.find(r => r.type === f.type && r.what === f.what && f.t - r.to <= step * 1.6);
      if (r) r.to = f.t; else ranges.push({ type: f.type, what: f.what, from: f.t, to: f.t, shot: f.shot });
    }
    ranges.sort((a, b) => a.from - b.from);
    fs.writeFileSync(path.join(BUILD, 'qa.json'), JSON.stringify(ranges, null, 1));
    console.log(ranges.length ? ranges.map(r => `${r.from.toFixed(2)}–${r.to.toFixed(2)}s  [${r.type}] ${r.what}  (shot ${r.shot})`).join('\n') : 'QA: no issues');
    console.log(`QA: ${ranges.length} issue(s), ${ts.length} frames checked -> ${path.join(BUILD, 'qa.json')}`);
  } else if (opt('stills')) {
    const dir = path.join(BUILD, 'stills'); fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    const ts = opt('stills').split(',').map(Number);
    const files = [];
    for (const t of ts) {
      const f = path.join(dir, `t${t.toFixed(2)}.jpg`);
      fs.writeFileSync(f, await shot(page, t, Math.round(t * FPS))); files.push(f);
    }
    // contact sheet, 6 per row, small
    if (files.length > 1) {
    const cols = Math.min(6, files.length);
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex',
      files.map((_, i) => `[${i}]scale=360:640[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') +
      `xstack=inputs=${files.length}:layout=` + files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|') + `:fill=black`,
      path.join(dir, 'sheet.jpg')]);
    }
    console.log('stills ->', dir);
  } else if (args.includes('--cues')) {  // cues.json only: re-mix after a sound edit without re-rendering the video
    const page = await openPage(browser);
    fs.writeFileSync(path.join(BUILD, 'cues.json'), JSON.stringify(await page.evaluate('({duration: window.DURATION, cues: window.CUES, music: window.MUSIC})'), null, 1));
    console.log('cues ->', path.join(BUILD, 'cues.json'));
  } else {
    const page0 = await openPage(browser);
    const dur = await page0.evaluate('window.DURATION');
    fs.writeFileSync(path.join(BUILD, 'cues.json'), JSON.stringify(await page0.evaluate('({duration: window.DURATION, cues: window.CUES, music: window.MUSIC})'), null, 1));
    await page0.close();
    const from = +(opt('from') || 0), to = +(opt('to') || dur);
    const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
    const N = +(opt('workers') || 4);
    const per = Math.ceil((f1 - f0) / N);
    const t0 = Date.now();
    let done = 0;
    const parts = await Promise.all([...Array(N)].map(async (_, w) => {
      const a = f0 + w * per, b = Math.min(f1, a + per);
      const out = path.join(BUILD, `part${w}.mp4`);
      if (a >= b) return null;
      const page = await openPage(browser);
      const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = a; f < b; f++) {
        const buf = await shot(page, f / FPS, f);
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
        if (++done % 60 === 0) console.log(`${done}/${f1 - f0} frames, ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
      }
      ff.stdin.end(); await new Promise(r => ff.on('close', r));
      return out;
    }));
    const list = path.join(BUILD, 'parts.txt');
    fs.writeFileSync(list, parts.filter(Boolean).map(p => `file '${p}'`).join('\n'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(BUILD, 'video.mp4')]);
    parts.filter(Boolean).forEach(p => fs.unlinkSync(p));
    console.log(`video -> ${path.join(BUILD, 'video.mp4')} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
} finally {
  await browser.close(); server.close();
}
