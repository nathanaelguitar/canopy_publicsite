/*
 * Headless-Chromium test of the Linux install help on the home page and the /linux guide.
 * Same setup as tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/linux.e2e.cjs
 *
 * Asserts both architectures, the one-line install and the browser-download line are present
 * whatever the user agent says. Nothing leaves the machine.
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
  linux: { platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  // Chromium on ARM Linux reports x86_64 in its user agent: the page must not rely on it.
  linuxArm: { platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  android: { platform: 'Linux armv81', ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' }
};
const AMD = 'https://downloads.canopychat.app/linux/CanopyChat-amd64.deb';
const ARM = 'https://downloads.canopychat.app/linux/CanopyChat-arm64.deb';
const ONELINER = 'curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb';
const BROWSER = 'cd ~/Downloads && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb';

(async () => {
  const srv = serveSite();
  const port = await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
  const SITE = 'http://localhost:' + port + '/';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

  async function open(name, url) {
    const d = DEVICES[name];
    const ctx = await browser.newContext({ userAgent: d.ua, viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript((platform) => {
      Object.defineProperty(Navigator.prototype, 'platform', { get: () => platform });
      Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
    }, d.platform);
    await ctx.route('**/*', (route) => (route.request().url().startsWith('http://localhost:' + port) ? route.continue() : route.abort()));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(SITE + (url || ''));
    await page.waitForLoadState('load');
    return { ctx, page, errors };
  }

  for (const name of Object.keys(DEVICES)) {
    const { ctx, page, errors } = await open(name);
    const got = await page.evaluate(() => {
      const help = document.querySelector('.download-help');
      const a = (k) => { const e = help.querySelector('[data-linux-arch="' + k + '"]'); return e && { href: e.href, text: e.textContent.trim() }; };
      return { amd: a('amd64'), arm: a('arm64'), cmd: help.querySelector('#linux-install-command').textContent, text: help.textContent, guide: !!help.querySelector('a[href="/linux"]'), open: help.open, overflow: document.documentElement.scrollWidth > window.innerWidth };
    });
    assert.deepStrictEqual(errors, [], name + ': page errors');
    assert.deepStrictEqual(got.amd, { href: AMD, text: 'Linux x86-64 (.deb)' }, name + ': x86-64 link');
    assert.ok(got.arm && got.arm.href === ARM && got.arm.text.startsWith('Linux ARM64 (.deb, e.g. DGX Spark'), name + ': ARM64 link');
    assert.strictEqual(got.cmd, ONELINER, name + ': one-line install');
    assert.ok(got.text.includes(BROWSER), name + ': browser-download line');
    assert.ok(got.text.includes('not yet code-signed'), name + ': Windows note kept');
    assert.ok(got.guide, name + ': link to the Linux guide');
    assert.strictEqual(got.open, name.startsWith('linux'), name + ': help opens by itself only on Linux');
    assert.strictEqual(got.overflow, false, name + ': horizontal scroll');
    console.log('ok  install help on ' + name);
    await ctx.close();
  }

  {
    const { ctx, page, errors } = await open('linux', 'linux');
    const t = await page.evaluate(() => document.body.innerText);
    assert.deepStrictEqual(errors, [], 'guide: page errors');
    for (const need of ['uname -m', 'dpkg --print-architecture', 'sudo apt remove canopy-chat', 'E: Unsupported file ./CanopyChat-amd64.deb given on commandline', '~/.local/share/canopychat', BROWSER, ONELINER, 'Linux x86-64 (.deb)', 'Linux ARM64 (.deb']) assert.ok(t.includes(need), 'guide: ' + need);
    const hrefs = await page.$$eval('a', (as) => as.map((a) => a.href));
    for (const h of [AMD, ARM, 'https://downloads.canopychat.app/linux/CanopyChat-x86_64.AppImage', 'https://downloads.canopychat.app/linux/CanopyChat-aarch64.AppImage']) assert.ok(hrefs.includes(h), 'guide link ' + h);
    console.log('ok  /linux guide');
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('all linux install checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
