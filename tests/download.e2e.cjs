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
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

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

const EXPECT = {
  windows: { href: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe', label: 'Download for Windows', note: true },
  mac: { href: 'https://testflight.apple.com/join/f5xCZmVv', label: 'Get it for Mac' },
  ipad: { href: 'https://apps.apple.com/us/app/canopychat/id6788203137', label: 'Download on the App Store' },
  iphone: { href: 'https://apps.apple.com/us/app/canopychat/id6788203137', label: 'Download on the App Store' },
  android: { href: 'https://play.google.com/store/apps/details?id=com.nathanaelguitar.canopychat', label: 'Get it on Google Play' },
  linux: { href: null, label: 'Linux version coming soon' },
  chromeos: { hrefEndsWith: '#downloads', label: 'Download CanopyChat' }
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
    await page.waitForSelector('[data-download-label]');
    return { ctx, page, errors };
  }

  for (const name of Object.keys(DEVICES)) {
    const { ctx, page, errors } = await open(name);
    const want = EXPECT[name];
    const got = await page.evaluate(() => {
      const b = document.querySelector('[data-download-button]');
      return {
        href: b.getAttribute('href') === null ? null : b.href,
        label: document.querySelector('[data-download-label]').textContent,
        note: !document.querySelector('[data-download-note]').hidden,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.deepStrictEqual(errors, [], name + ': page errors');
    assert.strictEqual(got.label, want.label, name + ': label');
    if (want.hrefEndsWith) assert.ok(got.href.endsWith(want.hrefEndsWith), name + ': href ' + got.href);
    else assert.strictEqual(got.href, want.href, name + ': href');
    assert.strictEqual(got.note, !!want.note, name + ': unsigned note');
    assert.strictEqual(got.overflow, false, name + ': horizontal scroll');
    console.log('ok  ' + name + ' -> ' + got.label + ' (' + got.href + ')');
    await ctx.close();
  }

  const shots = [
    ['download-windows-light.png', 'windows', {}],
    ['download-windows-dark.png', 'windows', { dark: true }],
    ['download-iphone-light.png', 'iphone', {}],
    ['download-android-dark.png', 'android', { dark: true }],
    ['download-windows-mobile-width.png', 'windows', { viewport: { width: 390, height: 844 } }],
    ['download-linux-light.png', 'linux', {}]
  ];
  for (const [file, name, opts] of shots) {
    const { ctx, page } = await open(name, opts);
    await (opts.viewport || DEVICES[name].mobile ? page : page.locator('.hero')).screenshot({ path: path.join(SHOTS, file) });
    console.log('shot ' + path.join(SHOTS, file));
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('all download checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
