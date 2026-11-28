// witty2: Chessigma's review page of Witty_Alien vs MagnusCarlsen for the TV in the video: the board flipped to
// White's side, a screenshot after every ply (plyf/ply_000.png = the start), each taken once the coach has finished
// typing his comment. Then: python3 episodes/witty2/capture/tv_frames.py <out dir>.
//
//   node episodes/witty2/capture/tv_capture.cjs <browser profile dir> <out dir>
//
// The sponsor asked for the signed-in page (13 Nov 2026): the comments are whole, the button under them reads
// "Explain", the arrows are on. Signed out the same script works, with "Sign in for free" in the coach's panel.
// Signing in needs no password: chessigma.com/signin sends a one-time link to the account's e-mail; open it in a
// Chromium profile kept outside the repository (launchPersistentContext on the same folder) and delete the folder
// after the capture. Only with the author's word for it; do not press "Sign out" (it may end his other sessions).
const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const [profile, out] = process.argv.slice(2); fs.mkdirSync(`${out}/plyf`, { recursive: true });
  const ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
  const p = ctx.pages()[0] || await ctx.newPage();
  const close = async () => { for (let k = 0; k < 3; k++) { await p.evaluate(() => { for (const b of document.querySelectorAll('button')) { const t = ((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).trim(); if (/^Maybe later$|^Dismiss$|^No thanks$|^Dismiss app announcement$/i.test(t)) b.click(); } }); await p.waitForTimeout(400); } };
  const press = (label) => p.evaluate((l) => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === l); if (b && !b.disabled) { b.click(); return true; } return false; }, label);
  await p.goto('https://www.chessigma.com/games/36fc7bb3-b70e-4781-bfe4-d91cf7cd7c65', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(15000); await close();
  if (await press('Expand navigation')) await p.waitForTimeout(1200);   // the page laid out as a visitor first sees it
  const boardBox = () => p.evaluate(() => { const e = [...document.querySelectorAll('*')].find(x => { const b = x.getBoundingClientRect(); return Math.abs(b.width - b.height) < 2 && b.width > 500 && b.width < 900; }); const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width)]; });
  // White is at the bottom when the rank label 8 sits above the rank label 1
  const whiteDown = () => p.evaluate(() => { const y = (d) => { const e = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && (x.textContent || '').trim() === d && x.getBoundingClientRect().x > 300 && x.getBoundingClientRect().x < 420); return e ? e.getBoundingClientRect().y : null; }; const a = y('8'), b = y('1'); return a === null || b === null ? null : a < b; });
  console.log('board', JSON.stringify(await boardBox()), 'white at the bottom on load:', await whiteDown());
  if ((await whiteDown()) !== true) {
    await press('Review settings'); await p.waitForTimeout(1000);
    await p.locator('button', { hasText: /^Flip board$/ }).first().click();
    await p.waitForTimeout(800); await p.keyboard.press('Escape'); await p.waitForTimeout(800); await close();
  }
  console.log('white at the bottom now:', await whiteDown());
  // the coach types his comment letter by letter: wait until the page's text has stood still for 0.6 s
  const settle = async () => { let last = '', same = 0; for (let i = 0; i < 40; i++) { const t = await p.evaluate(() => document.body.innerText); if (t === last) { same++; if (same >= 3) return i; } else { same = 0; last = t; } await p.waitForTimeout(200); } return -1; };
  for (let i = 0; i < 120; i++) { if (!(await press('Previous move'))) break; await p.waitForTimeout(50); }
  await p.waitForTimeout(1200); await settle(); await p.screenshot({ path: `${out}/plyf/ply_000.png` });
  const slow = [];
  for (let k = 1; k <= 107; k++) {
    await press('Next move');
    await p.waitForTimeout(700);
    const n = await settle(); if (n < 0) slow.push(k);
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${out}/plyf/ply_${String(k).padStart(3, '0')}.png` });
  }
  console.log('plies whose text never stood still:', slow.join(',') || 'none');
  console.log('next still enabled after 107:', await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Next move'); return b ? !b.disabled : null; }));
  console.log('done');
  await ctx.close();
})().catch(e => { console.error(e); process.exit(1); });
