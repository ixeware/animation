// fivepoints: Chessigma's review of the two games for the screens in the video, one screenshot per chosen ply, each
// taken once the coach has finished typing. Then: python3 episodes/fivepoints/capture/cg_frames.py <out dir>.
//
//   node episodes/fivepoints/capture/cg_capture.cjs <out dir> <game id> <tag> <plies> [black|white] [browser profile dir]
//
// The games (imported as PGN on 20 Nov 2026, SOURCES.md): Martirosyan – Carlsen fc0473cd-056b-4790-b6b8-44059ac7630b
// (plies 77,78,79: 39...Qd5 and the mate), Carlsen – Artemiev ff53cbdb-47e7-4fa9-a852-51c0f42305ea (57,58: 29...Qc2).
// The review of a PGN game runs on the device that first opens it; in this session's headless browser it never starts
// ("All set" with empty grades), so open each link once on a real device (phone or computer: "Start review") and the
// grades are then served to everyone. Signed in (the sponsor's wish for witty2): pass a Chromium profile kept outside the
// repository in which the author's account is signed in (one-time link from chessigma.com/signin), and only with the
// author's word for it; do not press "Sign out".
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const [out, id, tag, plies, side = 'white', profile = null] = process.argv.slice(2);
  const want = plies.split(',').map(Number); fs.mkdirSync(`${out}/raw`, { recursive: true });
  const opts = { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 };
  const ctx = profile ? await chromium.launchPersistentContext(profile, opts) : await (await chromium.launch()).newContext(opts);
  const p = ctx.pages()[0] || await ctx.newPage();
  const close = async () => { for (let k = 0; k < 3; k++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { const t = ((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).trim(); if (/^Maybe later$|^Dismiss$|^No thanks$|^Dismiss app announcement$/i.test(t)) b.click(); } }); await p.waitForTimeout(400); } };
  const press = (label) => p.evaluate((l) => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === l); if (b && !b.disabled) { b.click(); return true; } return false; }, label);
  await p.goto(`https://www.chessigma.com/games/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(15000); await close();
  // the "New: Chessigma is now on Chrome" toast and the app banner
  await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { if (/^×$|^✕$/.test((b.innerText || '').trim()) || /close/i.test(b.getAttribute('aria-label') || '')) b.click(); } });
  await p.locator('button', { hasText: /^Analysis$/ }).last().click().catch(() => {}); await p.waitForTimeout(1200);
  const whiteDown = () => p.evaluate(() => { const y = (d) => { const e = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && (x.textContent || '').trim() === d && x.getBoundingClientRect().x > 300 && x.getBoundingClientRect().x < 420); return e ? e.getBoundingClientRect().y : null; }; const a = y('8'), b = y('1'); return a === null || b === null ? null : a < b; });
  if ((await whiteDown()) !== (side === 'white')) {
    await press('Review settings'); await p.waitForTimeout(1000);
    await p.locator('button', { hasText: /^Flip board$/ }).first().click();
    await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.waitForTimeout(800); await close();
  }
  const settle = async () => { let last = '', same = 0; for (let i = 0; i < 40; i++) { const t = await p.evaluate(() => document.body.innerText); if (t === last) { same++; if (same >= 3) return; } else { same = 0; last = t; } await p.waitForTimeout(200); } };
  for (let i = 0; i < 140; i++) { if (!(await press('Previous move'))) break; await p.waitForTimeout(30); }
  let ply = 0;
  for (const w of want) {
    while (ply < w) { await press('Next move'); ply++; await p.waitForTimeout(ply < w ? 60 : 700); }
    await settle(); await p.waitForTimeout(250);
    await p.screenshot({ path: `${out}/raw/${tag}_${String(w).padStart(3, '0')}.png` });
    const t = await p.evaluate(() => document.body.innerText); const k = t.lastIndexOf('Insights');
    console.log(tag, w, '|', t.slice(k + 8, k + 220).replace(/\n+/g, ' | '));
  }
  await ctx.close();
})().catch(e => { console.error(e); process.exit(1); });
