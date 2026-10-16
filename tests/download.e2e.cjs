/*
 * Headless-Chromium test of the hero "Download CanopyChat" button (assets/download.js).
 * Same setup as tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/download.e2e.cjs
 *
 * Spoofs each device's user agent and platform, checks where the button goes, and saves
 * screenshots to tests/screenshots/. Nothing leaves the machine.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serveSite() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(ROOT, p === '/' ? '/index.html' : p);
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const DEVICES = {
  windows: { platform: 'Win32', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  mac: { platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15' },
  ipad: { platform: 'MacIntel', touch: true, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15' },
  iphone: { platform: 'iPhone', touch: true, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1' },
  android: { platform: 'Linux armv81', touch: true, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' },
  linux: { platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  chromeos: { platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' }
};

const HREF = {
  windows: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
  mac: 'https://testflight.apple.com/join/f5xCZmVv',
  ios: 'https://apps.apple.com/us/app/canopychat/id6788203137',
  android: 'https://play.google.com/store/apps/details?id=com.nathanaelguitar.canopychat'
};

(async () => {
  const srv = serveSite();
  const port = await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
  const SITE = 'http://localhost:' + port + '/';
  const browser = await chromium.launch();
  fs.mkdirSync(SHOTS, { recursive: true });

  async function open(name, opts = {}) {
    const d = DEVICES[name];
    const ctx = await browser.newContext({
      userAgent: d.ua,
      viewport: opts.viewport || (d.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }),
      deviceScaleFactor: 2,
      hasTouch: !!d.touch,
      isMobile: !!d.mobile,
      colorScheme: opts.dark ? 'dark' : 'light'
    });
    await ctx.addInitScript(([platform, touch]) => {
      Object.defineProperty(Navigator.prototype, 'platform', { get: () => platform });
      Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
      Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => (touch ? 5 : 0) });
    }, [d.platform, !!d.touch]);
    await ctx.route('**/*', (route) => (route.request().url().startsWith('http://localhost:' + port) ? route.continue() : route.abort()));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(SITE);
    await page.waitForLoadState('load');
    return { ctx, page, errors };
  }

  for (const name of Object.keys(DEVICES)) {
    const { ctx, page, errors } = await open(name);
    const got = await page.evaluate(() => {
      const pills = [...document.querySelectorAll('.download-grid > a')].filter((e) => !e.hidden && e.offsetParent !== null);
      const rows = [...new Set(pills.map((p) => Math.round(p.getBoundingClientRect().top)))];
      return {
        title: document.querySelector('.download-title').textContent.trim(),
        names: pills.map((p) => p.textContent.trim()),
        order: pills.map((p) => p.dataset.platform),
        hrefs: Object.fromEntries(pills.map((p) => [p.dataset.platform, p.href])),
        labelled: pills.every((p) => p.getAttribute('aria-label') && p.title),
        sizes: [...new Set(pills.map((p) => p.offsetWidth + 'x' + p.offsetHeight))],
        looks: [...new Set(pills.map((p) => { const c = getComputedStyle(p); return c.backgroundColor + c.color + c.boxShadow + c.borderRadius; }))],
        rows: rows.length,
        below: document.querySelector('.download').nextElementSibling.className,
        winDownload: document.querySelector('[data-platform="windows"]').getAttribute('download'),
        code: (() => { const a = document.querySelector('.install-cta-compact'); const r = a.getBoundingClientRect(); const row = document.querySelector('.actions-row').getBoundingClientRect(); return { label: a.getAttribute('aria-label'), text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href'), inRow: r.top >= row.top - 1 && r.bottom <= row.bottom + 1, h: a.offsetHeight, rowH: document.querySelector('.actions-row .button').offsetHeight }; })(),
        devLink: [...document.querySelectorAll('.hero-footnotes a')].some((a) => a.getAttribute('href') === '#install'),
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.deepStrictEqual(errors, [], name + ': page errors');
    assert.deepStrictEqual(got.code, { label: 'Install Canopy Code (for developers)', text: '>_ Canopy Code', href: '#install', inRow: true, h: got.code.rowH, rowH: got.code.rowH }, name + ': Canopy Code pill in the Join Beta row');
    assert.strictEqual(got.devLink, false, name + ': developer text link removed');
    assert.strictEqual(got.title, 'Download', name + ': heading');
    assert.deepStrictEqual(got.names, ['Windows', 'Mac', 'iPhone', 'Android'], name + ': pills are just platform names');
    for (const k of Object.keys(HREF)) assert.strictEqual(got.hrefs[k], HREF[k], name + ': ' + k + ' link');
    assert.strictEqual(got.winDownload, 'CanopyChat-Setup.exe', name + ': windows download attribute');
    assert.ok(got.labelled, name + ': every pill has aria-label and title');
    assert.strictEqual(got.sizes.length, 1, name + ': equal pill sizes ' + got.sizes);
    assert.strictEqual(got.looks.length, 1, name + ': identical pill styling');
    assert.strictEqual(got.rows, 2, name + ': 2 x 2 grid');
    assert.strictEqual(got.below, 'actions', name + ': nothing between the pills and Join Beta');
    assert.strictEqual(got.overflow, false, name + ': horizontal scroll');
    console.log('ok  ' + name + ' -> ' + got.names.join(', ') + ' (' + got.sizes[0] + ')');
    await ctx.close();
  }

  const shots = [
    ['download-windows-light.png', 'windows', {}],
    ['download-windows-dark.png', 'windows', { dark: true }],
    ['download-iphone-light.png', 'iphone', {}],
    ['download-android-dark.png', 'android', { dark: true }],
    ['download-windows-mobile-width.png', 'windows', { viewport: { width: 390, height: 844 } }],
    ['download-linux-light.png', 'linux', {}],
    ['download-mac-light.png', 'mac', {}],
    ['download-iphone-dark.png', 'iphone', { dark: true }],
    ['download-android-light.png', 'android', {}]
  ];
  for (const [file, name, opts] of shots) {
    const { ctx, page } = await open(name, opts);
    await (opts.viewport || DEVICES[name].mobile ? page : page.locator('.hero > div').first()).screenshot({ path: path.join(SHOTS, file) });
    console.log('shot ' + path.join(SHOTS, file));
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('all download checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
