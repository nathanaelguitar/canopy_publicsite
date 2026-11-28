/*
 * Headless-Chromium test of the hero "Download" pills on the home page. Same setup as
 * tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/download.e2e.cjs
 *
 * CHROMIUM_PATH points at a chrome-headless-shell binary when the package and the downloaded
 * browsers disagree; SHOTS_DIR moves the screenshots out of tests/screenshots/.
 *
 * Spoofs each device's user agent and platform and checks: iPhone and Android pills open their
 * stores; Windows, Mac and Linux pills open the guide pages in the same tab (no direct download,
 * no target=_blank); there is no beta line under the pills;
 * every pill looks the same; no horizontal scroll. Nothing leaves the machine.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS_DIR || path.join(__dirname, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

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

// Where each pill points. The guide pages are site-relative and resolved against the test server.
const STORE = {
  ios: 'https://apps.apple.com/us/app/canopychat/id6788203137',
  android: 'https://play.google.com/store/apps/details?id=com.nathanaelguitar.canopychat'
};
const GUIDE = { windows: '/windows', mac: '/mac', linux: '/linux' };

(async () => {
  const srv = serveSite();
  const port = await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
  const SITE = 'http://localhost:' + port + '/';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
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
      const pills = [...document.querySelectorAll('.download-grid > a.dl-pill')].filter((e) => !e.hidden && e.offsetParent !== null);
      const rows = [...new Set(pills.map((p) => Math.round(p.getBoundingClientRect().top)))];
      const beta = document.querySelector('.download .download-beta');
      return {
        title: document.querySelector('.download-title').textContent.trim(),
        names: pills.map((p) => p.textContent.replace(/\s+/g, ' ').trim().replace(/ beta$/i, '')),
        hrefs: Object.fromEntries(pills.map((p) => [p.dataset.platform, p.getAttribute('href')])),
        targets: Object.fromEntries(pills.map((p) => [p.dataset.platform, p.getAttribute('target')])),
        downloads: pills.filter((p) => p.hasAttribute('download')).map((p) => p.dataset.platform),
        labelled: pills.every((p) => p.getAttribute('aria-label') && p.title),
        betaLabelled: ['windows', 'mac', 'linux'].every((k) => /beta/i.test(pills.find((p) => p.dataset.platform === k).getAttribute('aria-label'))),
        sizes: [...new Set(pills.map((p) => p.offsetWidth + 'x' + p.offsetHeight))],
        looks: [...new Set(pills.map((p) => { const c = getComputedStyle(p); return c.backgroundColor + c.color + c.boxShadow + c.borderRadius; }))],
        rows: rows.length,
        beta: beta && { text: beta.textContent.replace(/\s+/g, ' ').trim(), links: [...beta.querySelectorAll('a')].map((a) => a.getAttribute('href')), visible: beta.offsetParent !== null },
        details: document.querySelectorAll('.download details').length,
        commands: /apt |curl |dpkg|uname|Invoke-|\.exe/.test(document.querySelector('.download').textContent),
        code: (() => { const a = document.querySelector('.download-grid .dl-cc'); return { label: a.getAttribute('aria-label'), text: a.textContent.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') }; })(),
        footer: ['/windows', '/mac', '/linux'].every((h) => [...document.querySelectorAll('.footer a')].some((a) => a.getAttribute('href') === h)),
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert.deepStrictEqual(errors, [], name + ': page errors');
    assert.strictEqual(got.title, 'Download', name + ': heading');
    assert.deepStrictEqual(got.names, ['Windows', 'Mac', 'iPhone', 'Android', 'Linux'], name + ': pills are just platform names');
    for (const k of Object.keys(GUIDE)) assert.strictEqual(got.hrefs[k], GUIDE[k], name + ': ' + k + ' pill opens its guide');
    for (const k of Object.keys(STORE)) assert.strictEqual(got.hrefs[k], STORE[k], name + ': ' + k + ' pill opens its store');
    for (const k of Object.keys(GUIDE)) assert.strictEqual(got.targets[k], null, name + ': ' + k + ' pill stays in the same tab');
    assert.deepStrictEqual(got.downloads, [], name + ': no pill downloads a file directly');
    assert.ok(got.labelled, name + ': every pill has aria-label and title');
    assert.ok(got.betaLabelled, name + ': desktop pills say beta in their label');
    assert.strictEqual(got.sizes.length, 1, name + ': equal pill sizes ' + got.sizes);
    assert.strictEqual(got.looks.length, 1, name + ': identical pill styling');
    assert.strictEqual(got.rows, 3, name + ': pills in a two-column grid (3 rows)');
    assert.ok(!got.beta, name + ': no beta line under the pills (the beta status is on each pill and on each guide)');
    assert.strictEqual(got.details, 0, name + ': no dropdown under the pills');
    assert.strictEqual(got.commands, false, name + ': no install commands or file names on the home page');
    assert.deepStrictEqual(got.code, { label: 'Install Canopy Code (for developers)', text: '>_ Canopy Code', href: '#install' }, name + ': Canopy Code pill in the grid');
    assert.ok(got.footer, name + ': footer links the three guides');
    assert.strictEqual(got.overflow, false, name + ': horizontal scroll');
    console.log('ok  ' + name + ' -> ' + got.names.join(', ') + ' (' + got.sizes[0] + ')');
    await ctx.close();
  }

  // Clicking a desktop pill lands on the matching guide, in the same tab.
  for (const [platform, route] of Object.entries(GUIDE)) {
    const { ctx, page } = await open('windows');
    const pagesBefore = ctx.pages().length;
    await page.locator('.download-grid [data-platform="' + platform + '"]').click();
    await page.waitForLoadState('load');
    assert.strictEqual(new URL(page.url()).pathname, route, platform + ': pill navigates to ' + route);
    assert.strictEqual(ctx.pages().length, pagesBefore, platform + ': no new tab');
    const h1 = await page.locator('h1').first().textContent();
    assert.ok(/Install CanopyChat on/.test(h1), platform + ': guide heading ' + h1);
    console.log('ok  click ' + platform + ' -> ' + route);
    await ctx.close();
  }

  const shots = [
    ['download-windows-light.png', 'windows', {}],
    ['download-windows-dark.png', 'windows', { dark: true }],
    ['download-iphone-light.png', 'iphone', {}],
    ['download-windows-mobile-width.png', 'windows', { viewport: { width: 390, height: 844 } }],
    ['download-mac-light.png', 'mac', {}]
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
