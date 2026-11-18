/*
 * Headless test of the Linux install experience: the short install note on the home page and
 * the /linux guide. Runs in Chromium, Firefox and WebKit. Same setup as tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium firefox webkit   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/linux.e2e.cjs
 *
 * ENGINES=chromium,firefox limits the browsers. Asserts: the home page carries no apt / curl
 * command and links to /linux; /linux has a copy button on every command block that puts the
 * exact command on the clipboard (real clipboard in Chromium, a recorded writeText elsewhere);
 * no horizontal overflow at 360, 768 and 1280 px in light and dark; the architecture tabs are
 * keyboard-operable. Nothing leaves the machine.
 *
 * The local server drops the CSP's upgrade-insecure-requests directive: WebKit applies it to
 * http://localhost too, which would leave the page unstyled. The live site is HTTPS. Headless
 * WebKit on macOS also delivers synthetic mouse clicks at wrong coordinates (every page, every
 * element), so in WebKit the copy buttons are activated with a dispatched click event and the
 * keyboard; Chromium and Firefox use real clicks.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const playwright = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

function serveSite() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(ROOT, p === '/' ? '/index.html' : p);
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    if (file.endsWith('.html')) return res.end(fs.readFileSync(file, 'utf8').replace('; upgrade-insecure-requests', ''));
    fs.createReadStream(file).pipe(res);
  });
}

const ENGINES = (process.env.ENGINES || 'chromium,firefox,webkit').split(',');
const WIDTHS = [360, 768, 1280];
const SCHEMES = ['light', 'dark'];
const AMD = 'https://downloads.canopychat.app/linux/CanopyChat-amd64.deb';
const ARM = 'https://downloads.canopychat.app/linux/CanopyChat-arm64.deb';
const ONELINER = 'curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb';
const BROWSER = 'cd ~/Downloads && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb';
const UA = {
  linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  linuxArm: 'Mozilla/5.0 (X11; Linux aarch64; rv:128.0) Gecko/20100101 Firefox/128.0',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
};

(async () => {
  const srv = serveSite();
  const port = await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
  const SITE = 'http://localhost:' + port + '/';

  for (const engine of ENGINES) {
    const browser = await playwright[engine].launch();
    const real = engine === 'chromium'; // only Chromium grants clipboard-read to a test page

    async function open(url, opts) {
      opts = opts || {};
      const ctx = await browser.newContext({
        userAgent: opts.ua || UA.linux,
        viewport: { width: opts.width || 1280, height: 900 },
        colorScheme: opts.scheme || 'light',
        permissions: real ? ['clipboard-read', 'clipboard-write'] : []
      });
      await ctx.addInitScript(() => {
        Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => undefined });
      });
      if (!real) {
        await ctx.addInitScript(() => {
          window.__copied = null;
          const writeText = (t) => { window.__copied = t; return Promise.resolve(); };
          if (navigator.clipboard) {
            try { Object.defineProperty(navigator.clipboard, 'writeText', { value: writeText, configurable: true }); } catch (e) { /* fall through */ }
          }
          if (!navigator.clipboard || navigator.clipboard.writeText !== writeText) {
            Object.defineProperty(Navigator.prototype, 'clipboard', { get: () => ({ writeText }), configurable: true });
          }
        });
      }
      await ctx.route('**/*', (route) => (route.request().url().startsWith('http://localhost:' + port) ? route.continue() : route.abort()));
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(SITE + (url || ''));
      await page.waitForLoadState('load');
      return { ctx, page, errors };
    }

    const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    // ---- Home page: short note, no commands, link to the guide ----
    for (const ua of ['linux', 'windows']) {
      const { ctx, page, errors } = await open('', { ua: UA[ua] });
      const got = await page.evaluate(() => {
        const dl = document.querySelector('.download');
        const help = dl.querySelector('.download-help');
        const a = (k) => { const e = help.querySelector('[data-linux-arch="' + k + '"]'); return e && { href: e.href, text: e.textContent.trim() }; };
        return {
          amd: a('amd64'), arm: a('arm64'), text: dl.textContent,
          guide: !!help.querySelector('a[href="/linux"]'),
          pre: dl.querySelectorAll('pre').length,
          linuxPill: !document.querySelector('.download-grid [data-platform="linux"]').hidden,
          pillHref: document.querySelector('.download-grid [data-platform="linux"]').href
        };
      });
      assert.deepStrictEqual(errors, [], engine + ' home/' + ua + ': page errors');
      assert.deepStrictEqual(got.amd, { href: AMD, text: 'Linux x86-64 (.deb)' }, engine + ' home: x86-64 link');
      assert.ok(got.arm && got.arm.href === ARM && got.arm.text.startsWith('Linux ARM64 (.deb, e.g. DGX Spark'), engine + ' home: ARM64 link');
      assert.ok(got.guide, engine + ' home: links to /linux');
      assert.ok(!/apt |curl |dpkg|uname/.test(got.text), engine + ' home: no install command in the download block');
      assert.strictEqual(got.pre, 0, engine + ' home: no code block in the download block');
      assert.ok(got.text.includes('not yet code-signed') && got.text.includes('More info') && got.text.includes('Run anyway'), engine + ' home: Windows note kept');
      assert.ok(got.linuxPill && got.pillHref === AMD, engine + ' home: Linux pill shown, x86-64 by default');
      await ctx.close();
    }
    console.log('ok  ' + engine + ': home page install note');

    // ---- /linux: content, links, no overflow in every width and theme ----
    for (const scheme of SCHEMES) {
      for (const width of WIDTHS) {
        const { ctx, page, errors } = await open('linux', { width, scheme });
        assert.deepStrictEqual(errors, [], engine + ' guide ' + width + '/' + scheme + ': page errors');
        assert.ok(await noOverflow(page), engine + ' guide ' + width + '/' + scheme + ': horizontal overflow');
        const cmdOverflow = await page.$$eval('.cmd pre', (pres) => pres.filter((p) => p.scrollWidth > p.clientWidth + 1).length);
        assert.strictEqual(cmdOverflow, 0, engine + ' guide ' + width + '/' + scheme + ': a command block scrolls instead of wrapping');
        await ctx.close();
      }
    }
    {
      const { ctx, page } = await open('', { width: 360 });
      assert.ok(await noOverflow(page), engine + ' home 360: horizontal overflow');
      await ctx.close();
    }
    console.log('ok  ' + engine + ': no horizontal overflow at 360/768/1280, light and dark');

    {
      const { ctx, page } = await open('linux');
      const t = await page.evaluate(() => document.body.innerText);
      for (const need of ['uname -m', 'dpkg --print-architecture', 'sudo apt remove canopy-chat', 'E: Unsupported file ./CanopyChat-amd64.deb given on commandline', '~/.local/share/canopychat', BROWSER, ONELINER, 'Linux x86-64 (.deb)', 'Linux ARM64 (.deb', 'Ubuntu 24.04 or newer', 'Ubuntu 22.04 or newer', 'Other distributions']) assert.ok(t.includes(need), engine + ' guide: ' + need);
      const hrefs = await page.$$eval('a', (as) => as.map((a) => a.href));
      for (const h of [AMD, ARM, 'https://downloads.canopychat.app/linux/CanopyChat-x86_64.AppImage', 'https://downloads.canopychat.app/linux/CanopyChat-aarch64.AppImage', 'https://downloads.canopychat.app/linux/latest.json']) assert.ok(hrefs.includes(h), engine + ' guide link ' + h);
      const toc = await page.$$eval('.doc-toc a', (as) => as.map((a) => [a.getAttribute('href'), !!document.querySelector(a.getAttribute('href'))]));
      assert.ok(toc.length >= 7 && toc.every((x) => x[1]), engine + ' guide: every on-this-page link has a target ' + JSON.stringify(toc));

      // Every command block has a copy button that copies exactly the command.
      const blocks = await page.$$eval('.cmd', (cs) => cs.map((c) => ({ id: c.querySelector('pre code').id, text: c.querySelector('pre code').textContent, button: !!c.querySelector('.copy-button[data-copy-target="' + c.querySelector('pre code').id + '"]'), visible: !c.closest('[hidden]') })));
      assert.ok(blocks.length >= 8, engine + ' guide: command blocks ' + blocks.length);
      for (const b of blocks) assert.ok(b.button, engine + ' guide: copy button for ' + b.id);
      assert.ok(blocks.some((b) => b.text === ONELINER), engine + ' guide: one-liner block');
      for (const b of blocks.filter((b) => b.visible)) {
        const btn = page.locator('.copy-button[data-copy-target="' + b.id + '"]');
        if (engine === 'webkit') await btn.dispatchEvent('click'); else await btn.click();
        await page.waitForFunction((id) => document.querySelector('.copy-button[data-copy-target="' + id + '"]').textContent === 'Copied', b.id);
        const copied = real ? await page.evaluate(() => navigator.clipboard.readText()) : await page.evaluate(() => window.__copied);
        assert.strictEqual(copied, b.text, engine + ' guide: clipboard after copying ' + b.id);
      }
      // The announcement is written a tick later so repeated copies re-announce.
      await page.waitForFunction(() => document.getElementById('copy-status').textContent === 'Command copied to the clipboard');
      assert.strictEqual(await page.evaluate(() => document.getElementById('copy-status').getAttribute('aria-live')), 'polite', engine + ' guide: aria-live status');
      console.log('ok  ' + engine + ': copy buttons put the exact command on the clipboard (' + blocks.filter((b) => b.visible).length + ' blocks)');

      // Keyboard: the copy button is reachable and works with Enter; the tabs switch with arrows.
      await page.locator('#tab-amd64').focus();
      await page.keyboard.press('ArrowRight');
      let sel = await page.evaluate(() => [document.activeElement.id, document.querySelector('#panel-arm64').hidden, document.querySelector('#panel-amd64').hidden]);
      assert.deepStrictEqual(sel, ['tab-arm64', false, true], engine + ' guide: ArrowRight selects ARM64');
      await page.keyboard.press('Home');
      sel = await page.evaluate(() => [document.activeElement.id, document.querySelector('#panel-amd64').hidden]);
      assert.deepStrictEqual(sel, ['tab-amd64', false], engine + ' guide: Home selects x86-64');
      await page.locator('.copy-button[data-copy-target="cmd-oneliner"]').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('.copy-button[data-copy-target="cmd-oneliner"]').textContent === 'Copied');
      console.log('ok  ' + engine + ': keyboard tabs and copy');
      await ctx.close();
    }

    // ARM64 is picked when the user agent says so; x86-64 otherwise.
    for (const [ua, arch] of [['linux', 'amd64'], ['linuxArm', 'arm64']]) {
      const { ctx, page } = await open('linux', { ua: UA[ua] });
      const got = await page.evaluate(() => document.querySelector('.arch-tab[aria-selected="true"]').getAttribute('data-arch'));
      assert.strictEqual(got, arch, engine + ' guide: default tab for ' + ua);
      await ctx.close();
    }
    console.log('ok  ' + engine + ': default architecture tab');

    await browser.close();
  }

  srv.close();
  console.log('all linux install checks passed (' + ENGINES.join(', ') + ')');
})().catch((e) => { console.error(e); process.exit(1); });
