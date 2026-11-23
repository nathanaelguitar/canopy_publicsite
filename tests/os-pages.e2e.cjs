/*
 * Headless-Chromium test of the per-system install guides: /windows, /mac, /linux and /agents.
 * Same setup as tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/os-pages.e2e.cjs
 *
 * CHROMIUM_PATH points at a chrome-headless-shell binary when the package and the downloaded
 * browsers disagree; SHOTS_DIR moves the screenshots out of tests/screenshots/.
 *
 * Asserts, per page: a beta notice under the lead that says "beta" and names support@canopychat.app;
 * the links to the other systems; every "On this page" link has a target and the sections come in
 * the shared order; every command block has a copy button that puts exactly its text on the
 * clipboard; the agent prompt points at canopychat.app/agents.md and carries the rules; the
 * per-system facts (installer URL, TestFlight link, one-liner); no horizontal overflow and no
 * scrolling command block at 390, 768 and 1280 px in light and dark. Nothing leaves the machine.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = process.env.SHOTS_DIR || path.join(__dirname, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.md': 'text/markdown' };

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

const WIDTHS = [390, 768, 1280];
const SCHEMES = ['light', 'dark'];
const ORDER = ['what-you-get', 'supported-systems', 'install', 'agent', 'first-start', 'updates', 'uninstall', 'known-gaps', 'troubleshooting'];
const MAC_ORDER = ORDER.filter((id) => id !== 'known-gaps');
const APP_STORE = 'https://apps.apple.com/us/app/canopychat/id6788203137';
const WIN_EXE = 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe';
const WIN_MANIFEST = 'https://downloads.canopychat.app/windows/latest.json';
const ONELINER = 'curl -fLO https://downloads.canopychat.app/linux/CanopyChat-$(dpkg --print-architecture).deb && sudo apt install ./CanopyChat-$(dpkg --print-architecture).deb';

const PAGES = {
  windows: {
    h1: 'Install CanopyChat on Windows',
    others: ['/mac', '/linux'],
    links: [WIN_EXE, WIN_MANIFEST],
    text: ['Windows protected your PC', 'More info', 'Run anyway', 'about 170 MB', 'not yet code-signed', 'Get-FileHash', 'Check for updates', 'Update now', 'Uninstall', 'No list of your other computers', 'Canopy Lite'],
    prompt: ['https://canopychat.app/agents.md', 'Tell me before you run the installer', 'administrator', 'Do not sign in'],
    noText: ['Mac App Store']
  },
  mac: {
    h1: 'Install CanopyChat on Mac',
    others: ['/windows', '/linux'],
    released: true,
    order: MAC_ORDER,
    links: [APP_STORE],
    text: ['Mac App Store', 'macOS 14.0 or later', 'universal build', 'Apple-silicon Macs with enough memory', 'Canopy Lite', 'offline', 'no account', 'cannot finish this install', 'Get', 'Updates', 'Trash'],
    prompt: ['https://canopychat.app/agents.md', APP_STORE, 'cannot click Get or Install', 'do not sign in'],
    // The Mac app is released: no beta, no TestFlight.
    noText: ['TestFlight', 'beta', 'Beta', 'Stop Testing', '90 days', 'App Review']
  },
  linux: {
    h1: 'Install CanopyChat on Linux',
    others: ['/windows', '/mac'],
    links: ['https://downloads.canopychat.app/linux/CanopyChat-amd64.deb', 'https://downloads.canopychat.app/linux/CanopyChat-arm64.deb', 'https://downloads.canopychat.app/linux/CanopyChat-x86_64.rpm', 'https://downloads.canopychat.app/linux/CanopyChat-aarch64.rpm', 'https://downloads.canopychat.app/linux/latest.json'],
    text: [ONELINER, 'WEBKIT_DISABLE_DMABUF_RENDERER=1 canopychat &', 'sudo apt remove canopy-chat', 'sudo dnf remove canopy-chat', 'sudo zypper remove canopy-chat', 'sudo dnf install ./CanopyChat-$(uname -m).rpm', 'Ubuntu 22.04 or newer', 'Ubuntu 24.04 or newer', 'No list of your other computers', 'Canopy Lite'],
    prompt: ['https://canopychat.app/agents.md', 'needs sudo', 'never type my password', 'Do not sign in'],
    noText: []
  }
};

// Every Markdown twin that tools/build-md.py writes must be in the deploy workflow's copy list, or
// the live /name.md returns 404 while the HTML advertises it (agents.md shipped that way once).
{
  const build = fs.readFileSync(path.join(ROOT, 'tools/build-md.py'), 'utf8');
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
  const pages = [...build.match(/PAGES = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const copied = (workflow.match(/cp -- ([^\n]*\.md[^\n]*) _site\//) || [, ''])[1].split(/\s+/);
  const missing = pages.filter((p) => !copied.includes(p + '.md'));
  assert.deepStrictEqual(missing, [], 'pages.yml does not deploy these Markdown twins: ' + missing.join(', '));
  console.log('ok  pages.yml deploys every Markdown twin (' + pages.length + ')');
}

(async () => {
  const srv = serveSite();
  const port = await new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
  const SITE = 'http://localhost:' + port + '/';
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  fs.mkdirSync(SHOTS, { recursive: true });

  async function open(route, opts = {}) {
    const ctx = await browser.newContext({
      viewport: { width: opts.width || 1280, height: 900 },
      deviceScaleFactor: opts.shot ? 2 : 1,
      colorScheme: opts.scheme || 'light',
      permissions: ['clipboard-read', 'clipboard-write']
    });
    await ctx.route('**/*', (r) => (r.request().url().startsWith('http://localhost:' + port) ? r.continue() : r.abort()));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(SITE + route);
    await page.waitForLoadState('load');
    return { ctx, page, errors };
  }

  for (const [route, want] of Object.entries(PAGES)) {
    // Layout: no overflow in any width or theme; command blocks wrap instead of scrolling.
    for (const scheme of SCHEMES) {
      for (const width of WIDTHS) {
        const { ctx, page, errors } = await open(route, { width, scheme });
        const tag = '/' + route + ' ' + width + '/' + scheme;
        assert.deepStrictEqual(errors, [], tag + ': page errors');
        const got = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          cmdScroll: [...document.querySelectorAll('.cmd pre')].filter((p) => p.scrollWidth > p.clientWidth + 1).length,
          wide: [...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).length,
          gutter: (() => { const m = document.querySelector('main'); const r = m.getBoundingClientRect(); return Math.round(Math.min(r.left, window.innerWidth - r.right)); })()
        }));
        assert.strictEqual(got.overflow, false, tag + ': horizontal overflow');
        assert.strictEqual(got.cmdScroll, 0, tag + ': a command block scrolls instead of wrapping');
        assert.strictEqual(got.wide, 0, tag + ': an element sticks out past the viewport');
        if (width === 390) assert.ok(got.gutter >= 16, tag + ': side gutter ' + got.gutter + 'px');
        await ctx.close();
      }
    }
    console.log('ok  /' + route + ': no overflow at 390/768/1280, light and dark');

    const { ctx, page } = await open(route);
    const got = await page.evaluate((order) => {
      const beta = document.querySelector('.linux-head .beta-note');
      const toc = [...document.querySelectorAll('.doc-toc a')].map((a) => a.getAttribute('href'));
      const sections = [...document.querySelectorAll('.doc-sections > .doc-section')].map((s) => s.id);
      return {
        h1: document.querySelector('h1').textContent.trim(),
        title: document.title,
        beta: beta && { text: beta.textContent.replace(/\s+/g, ' ').trim(), support: !!beta.querySelector('a[href="mailto:support@canopychat.app"]'), afterLead: beta.previousElementSibling && beta.previousElementSibling.classList.contains('linux-lead') },
        others: [...document.querySelectorAll('.os-switch a')].map((a) => a.getAttribute('href')),
        toc, tocTargets: toc.every((h) => !!document.querySelector(h)),
        sections,
        order: order.every((id) => sections.includes(id)) && order.map((id) => sections.indexOf(id)).every((i, n, arr) => n === 0 || i > arr[n - 1]),
        text: document.body.innerText,
        hrefs: [...document.querySelectorAll('a')].map((a) => a.href),
        prompt: document.getElementById('cmd-prompt') && document.getElementById('cmd-prompt').textContent,
        promptInAgent: !!document.querySelector('#agent #cmd-prompt'),
        status: document.getElementById('copy-status') && document.getElementById('copy-status').getAttribute('aria-live'),
        md: document.querySelector('link[rel="alternate"][type="text/markdown"]') && document.querySelector('link[rel="alternate"][type="text/markdown"]').getAttribute('href'),
        eyebrow: !!document.querySelector('.linux-head .eyebrow'),
        blocks: [...document.querySelectorAll('.cmd')].map((c) => { const code = c.querySelector('pre code'); return { id: code.id, text: code.textContent, button: !!c.querySelector('.copy-button[data-copy-target="' + code.id + '"]'), visible: !c.closest('[hidden]') }; })
      };
    }, want.order || ORDER);
    const tag = '/' + route;
    assert.strictEqual(got.h1, want.h1, tag + ': heading');
    if (want.released) {
      assert.ok(!/beta|testflight/i.test(got.title), tag + ': title does not say beta: ' + got.title);
      assert.strictEqual(got.beta, null, tag + ': no beta notice on a released app');
    } else {
    assert.ok(/beta/i.test(got.title), tag + ': title says beta: ' + got.title);
    assert.ok(got.beta && got.beta.afterLead, tag + ': beta notice right under the lead');
    assert.ok(/beta/i.test(got.beta.text) && /feature requests/i.test(got.beta.text) && /bug reports/i.test(got.beta.text), tag + ': beta notice says beta and invites feature requests and bug reports: ' + got.beta.text);
    assert.ok(!/rough edges|missing/i.test(got.beta.text), tag + ': beta notice does not talk the app down: ' + got.beta.text);
    assert.ok(got.beta.support, tag + ': beta notice links support@canopychat.app');
    }
    assert.deepStrictEqual(got.others, want.others.concat(['/agents']), tag + ': links to the other systems and /agents');
    assert.ok(got.toc.length >= (want.released ? 8 : 9) && got.tocTargets, tag + ': every on-this-page link has a target ' + JSON.stringify(got.toc));
    assert.ok(got.order, tag + ': sections in the shared order ' + JSON.stringify(got.sections));
    assert.strictEqual(got.eyebrow, false, tag + ': no eyebrow above the heading');
    for (const need of want.text) assert.ok(got.text.includes(need), tag + ': text "' + need + '"');
    for (const no of want.noText) assert.ok(!got.text.includes(no), tag + ': must not say "' + no + '"');
    for (const h of want.links) assert.ok(got.hrefs.includes(h), tag + ': link ' + h);
    assert.ok(got.prompt && got.promptInAgent, tag + ': agent prompt block inside #agent');
    for (const need of want.prompt) assert.ok(got.prompt.includes(need), tag + ': prompt says "' + need + '"');
    assert.strictEqual(got.status, 'polite', tag + ': aria-live copy status');
    assert.strictEqual(got.md, '/' + route + '.md', tag + ': Markdown twin advertised');
    assert.ok(fs.existsSync(path.join(ROOT, route + '.md')), tag + ': ' + route + '.md exists (run tools/build-md.py)');
    assert.ok(got.blocks.length >= 2, tag + ': command blocks ' + got.blocks.length);
    for (const b of got.blocks) assert.ok(b.button, tag + ': copy button for ' + b.id);

    // Every visible copy button puts exactly its block on the clipboard.
    for (const b of got.blocks.filter((b) => b.visible)) {
      await page.locator('.copy-button[data-copy-target="' + b.id + '"]').click();
      await page.waitForFunction((id) => document.querySelector('.copy-button[data-copy-target="' + id + '"]').textContent === 'Copied', b.id);
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      assert.strictEqual(copied, b.text, tag + ': clipboard after copying ' + b.id);
    }
    console.log('ok  ' + tag + ': beta notice, sections, facts, ' + got.blocks.filter((b) => b.visible).length + ' copy buttons');
    await ctx.close();
  }

  // /agents: the generic guide names the beta, points at the three pages and has a Mac section.
  {
    const { ctx, page, errors } = await open('agents');
    assert.deepStrictEqual(errors, [], '/agents: page errors');
    const got = await page.evaluate(() => ({
      text: document.body.innerText,
      links: ['/windows', '/mac', '/linux'].every((h) => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === h)),
      mac: !!document.querySelector('#mac h2'),
      toc: [...document.querySelectorAll('.doc-toc a')].every((a) => !!document.querySelector(a.getAttribute('href'))),
      overflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    assert.ok(got.links, '/agents: links the three guides');
    assert.ok(got.mac && got.toc, '/agents: Mac section in the body and the on-this-page nav');
    for (const need of ['App Store', 'cannot complete this install', 'Do not sign in for the user', 'beta', 'Get-FileHash']) assert.ok(got.text.includes(need), '/agents: text "' + need + '"');
    assert.ok(!/TestFlight/.test(got.text), '/agents: no TestFlight left');
    assert.ok(got.text.includes('macOS 14.0'), '/agents: Mac section names the macOS requirement');
    assert.strictEqual(got.overflow, false, '/agents: horizontal overflow');
    console.log('ok  /agents: beta note, Mac section, links to the guides');
    await ctx.close();
  }

  for (const route of Object.keys(PAGES)) {
    for (const [width, scheme] of [[1280, 'light'], [390, 'light'], [390, 'dark']]) {
      const { ctx, page } = await open(route, { width, scheme, shot: true });
      const file = path.join(SHOTS, route + '-' + width + '-' + scheme + '.png');
      await page.screenshot({ path: file, fullPage: width === 390 });
      console.log('shot ' + file);
      await ctx.close();
    }
  }

  await browser.close();
  srv.close();
  console.log('all OS page checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
