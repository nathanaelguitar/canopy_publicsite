/*
 * Headless-Chromium test of the "Install Canopy Code" section: the macOS / Linux / Windows
 * switcher (assets/install.js), the copy buttons, and the no-JS fallback.
 * Same setup as tests/download.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/install.e2e.cjs
 *
 * If the Playwright package and the downloaded browser builds disagree, point CHROMIUM_PATH at
 * the chrome-headless-shell binary you already have.
 *
 * Spoofs each device's user agent and platform, checks the selected tab, the visible notes and
 * the copied command, and saves screenshots to tests/screenshots/. Nothing leaves the machine.
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

const BREW = 'brew install nathanaelguitar/canopy/canopy-code';
const SCOOP = 'scoop install https://github.com/nathanaelguitar/canopy-code/releases/latest/download/canopy-code.json';

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

// `expect` is the tab that should be selected on load.
const DEVICES = {
  mac: { expect: 'macos', platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15' },
  windows: { expect: 'windows', platform: 'Win32', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  linux: { expect: 'linux', platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  linuxArm: { expect: 'linux', platform: 'Linux aarch64', ua: 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  chromeos: { expect: 'linux', platform: 'Linux x86_64', ua: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' },
  // iPadOS reports MacIntel; it must not be treated as a Mac.
  ipad: { expect: 'macos', platform: 'MacIntel', touch: true, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15' },
  // Android's user agent contains "Linux"; it must not land on the Linux tab.
  android: { expect: 'macos', platform: 'Linux armv81', touch: true, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' },
  iphone: { expect: 'macos', platform: 'iPhone', touch: true, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1' },
  unknown: { expect: 'macos', platform: '', ua: 'SomeAgent/1.0' }
};

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
      colorScheme: opts.dark ? 'dark' : 'light',
      javaScriptEnabled: opts.noJs ? false : true,
      permissions: opts.noJs ? [] : ['clipboard-read', 'clipboard-write']
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

  // Reads the switcher state: which tab is selected, which panel and notes are visible.
  const STATE = () => {
    const visible = (e) => !e.hidden && e.offsetParent !== null;
    const tabs = [...document.querySelectorAll('.terminal-tabs [role="tab"]')];
    const panels = [...document.querySelectorAll('.terminal-panel')];
    const notes = [...document.querySelectorAll('.install-notes li')];
    return {
      tablistVisible: visible(document.querySelector('.terminal-tabs')),
      selected: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.dataset.platform),
      focusable: tabs.filter((t) => t.getAttribute('tabindex') === '0').map((t) => t.dataset.platform),
      panels: panels.filter(visible).map((p) => p.dataset.platform),
      tabpanels: document.querySelectorAll('[role="tabpanel"]').length,
      notes: notes.filter(visible).map((n) => n.dataset.platforms),
      comingSoon: /coming soon/i.test(document.querySelector('.install').textContent),
      copyLabels: [...document.querySelectorAll('.terminal-panel:not([hidden]) .copy-button')].map((b) => b.getAttribute('aria-label')),
      overflow: document.querySelector('.terminal').scrollWidth > document.querySelector('.terminal').clientWidth + 1
    };
  };

  for (const name of Object.keys(DEVICES)) {
    const { ctx, page, errors } = await open(name);
    const got = await page.evaluate(STATE);
    assert.deepStrictEqual(errors, [], name + ': page errors');
    assert.strictEqual(got.tablistVisible, true, name + ': tab strip visible');
    assert.deepStrictEqual(got.selected, [DEVICES[name].expect], name + ': selected tab');
    assert.deepStrictEqual(got.focusable, [DEVICES[name].expect], name + ': one tab in the tab order');
    assert.deepStrictEqual(got.panels, [DEVICES[name].expect], name + ': one visible panel');
    assert.strictEqual(got.tabpanels, 3, name + ': three tabpanels in the DOM');
    assert.ok(got.notes.every((n) => n.split(' ').includes(DEVICES[name].expect)), name + ': notes match the tab');
    assert.ok(got.notes.includes('macos linux windows'), name + ': remote-control note always shown');
    assert.strictEqual(got.comingSoon, false, name + ': no "coming soon"');
    assert.strictEqual(got.copyLabels.length, 1, name + ': one copy button visible');
    assert.strictEqual(got.overflow, false, name + ': terminal does not overflow');
    console.log('ok  ' + name + ' -> ' + got.selected[0] + ' (' + got.notes.length + ' notes)');
    await ctx.close();
  }

  // Copying: the visible button copies the visible command, with no prompt.
  {
    const { ctx, page } = await open('mac');
    const copy = async () => {
      await page.locator('.terminal-panel:not([hidden]) .copy-button').click();
      await page.waitForFunction(() => document.querySelector('.terminal-panel:not([hidden]) .copy-button').textContent === 'Copied');
      return page.evaluate(() => navigator.clipboard.readText());
    };
    assert.strictEqual(await copy(), BREW, 'mac: copied command');
    await page.locator('#tab-windows').click();
    assert.strictEqual(await copy(), SCOOP, 'windows: copied command');
    await page.locator('#tab-linux').click();
    assert.strictEqual(await copy(), BREW, 'linux: copied command');
    console.log('ok  copy -> mac/linux brew, windows scoop');
    await ctx.close();
  }

  // Keyboard: arrows wrap, Home/End jump, and Tab leaves the strip for the copy button.
  {
    const { ctx, page } = await open('mac');
    const selected = () => page.evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]').dataset.platform);
    const focused = () => page.evaluate(() => document.activeElement && document.activeElement.dataset.platform);
    await page.locator('#tab-macos').focus();
    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await selected(), 'linux', 'keyboard: ArrowRight');
    assert.strictEqual(await focused(), 'linux', 'keyboard: ArrowRight moves focus');
    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await selected(), 'windows', 'keyboard: ArrowRight again');
    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await selected(), 'macos', 'keyboard: ArrowRight wraps');
    await page.keyboard.press('ArrowLeft');
    assert.strictEqual(await selected(), 'windows', 'keyboard: ArrowLeft wraps back');
    await page.keyboard.press('Home');
    assert.strictEqual(await selected(), 'macos', 'keyboard: Home');
    await page.keyboard.press('End');
    assert.strictEqual(await selected(), 'windows', 'keyboard: End');
    await page.keyboard.press('Tab');
    const onCopy = await page.evaluate(() => document.activeElement.classList.contains('copy-button'));
    assert.strictEqual(onCopy, true, 'keyboard: Tab reaches the copy button');
    console.log('ok  keyboard -> arrows, Home/End, Tab out');
    await ctx.close();
  }

  // No JS: the strip stays hidden, all three commands and every note show.
  {
    const { ctx, page } = await open('mac', { noJs: true });
    const got = await page.evaluate(STATE);
    assert.strictEqual(got.tablistVisible, false, 'no-js: tab strip hidden');
    assert.deepStrictEqual(got.panels, ['macos', 'linux', 'windows'], 'no-js: all three commands');
    assert.strictEqual(got.tabpanels, 0, 'no-js: no tabpanels');
    assert.strictEqual(got.notes.length, 7, 'no-js: every note');
    assert.strictEqual(got.comingSoon, false, 'no-js: no "coming soon"');
    const commands = await page.evaluate(() => [...document.querySelectorAll('.terminal-panel code[id]')].map((c) => c.textContent.replace(/^\S+\s+/, '').trim()));
    assert.deepStrictEqual(commands, [BREW, BREW, SCOOP], 'no-js: all three commands readable');
    console.log('ok  no-js -> 3 commands, 7 notes, no strip');
    await ctx.close();
  }

  // The #install anchor still outlines the card.
  {
    const { ctx, page } = await open('mac');
    await page.goto(SITE + '#install');
    await page.waitForLoadState('load');
    const outline = await page.evaluate(() => getComputedStyle(document.querySelector('.install-card')).outlineStyle);
    assert.strictEqual(outline, 'solid', 'anchor: #install outlines the card');
    console.log('ok  anchor -> #install still targets the card');
    await ctx.close();
  }

  const shots = [
    ['install-mac-light.png', 'mac', {}],
    ['install-windows-light.png', 'windows', {}],
    ['install-linux-light.png', 'linux', {}],
    ['install-windows-dark.png', 'windows', { dark: true }],
    ['install-windows-390.png', 'windows', { viewport: { width: 390, height: 844 } }],
    ['install-nojs.png', 'mac', { noJs: true }]
  ];
  for (const [file, name, opts] of shots) {
    const { ctx, page } = await open(name, opts);
    await page.locator('.install-card').screenshot({ path: path.join(SHOTS, file) });
    console.log('shot ' + path.join(SHOTS, file));
    await ctx.close();
  }

  await browser.close();
  srv.close();
  console.log('all install checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
