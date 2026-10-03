/*
 * Headless-Chromium walkthrough of /signup, /account and /link against
 * tests/mock-accounts-api.cjs.
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/link.e2e.cjs
 *
 * The site is served from this repo over http://localhost. Requests the page
 * makes to the two real API hostnames are intercepted in the browser and
 * answered by the mock, so CSP and CORS are enforced exactly as in production
 * and nothing ever reaches the real hosts.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');
const { createMock } = require('./mock-accounts-api.cjs');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

function serveSite() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    let file = path.join(ROOT, p);
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html'; // GitHub Pages clean URLs
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end('nf');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));

(async () => {
  const mock = createMock();
  const mockSrv = http.createServer(mock.handler);
  const mockPort = await listen(mockSrv);
  const siteSrv = serveSite();
  const sitePort = await listen(siteSrv);
  const SITE = 'http://localhost:' + sitePort;
  const MOCK = 'http://127.0.0.1:' + mockPort;
  const mockFetch = (p, opts) => fetch(MOCK + p, opts);

  const browser = await chromium.launch();

  const apiHits = [];
  const violations = [];
  async function newPage(opts) {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }, opts));
    const page = await ctx.newPage();
    page.on('console', (m) => { if (/Content Security Policy|violates|Refused/i.test(m.text())) violations.push(m.text()); });
    page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
    page.on('dialog', (d) => d.accept());
    await ctx.route(/https:\/\/founding-api(-staging)?\.canopychat\.app\/.*/, async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      apiHits.push(u.host + ' ' + req.method() + ' ' + u.pathname);
      if (u.host === 'founding-api.canopychat.app') {
        return route.fulfill({ status: 599, body: 'prod host is not reachable from tests' });
      }
      const headers = {};
      for (const [k, v] of Object.entries(req.headers())) {
        if (['authorization', 'content-type', 'x-canopy-client', 'access-control-request-method', 'access-control-request-headers', 'origin'].includes(k)) headers[k] = v;
      }
      const r = await mockFetch(u.pathname + u.search, { method: req.method(), headers, body: req.postData() || undefined });
      const out = {};
      r.headers.forEach((v, k) => { out[k] = v; });
      await route.fulfill({ status: r.status, headers: out, body: Buffer.from(await r.arrayBuffer()) });
    });
    return page;
  }

  const step = (m) => console.log('ok  ' + m);
  const page = await newPage();
  const shot = (name, full) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: Boolean(full) });
  const errText = (sel) => page.locator(sel).innerText();
  const visible = (sel) => page.locator(sel).isVisible();
  const onPath = (p) => page.waitForURL((u) => u.pathname === p, { timeout: 5000 });

  // ---- home: Create account button, nav link, one-liner for /link
  await page.goto(SITE + '/');
  assert.strictEqual(await page.locator('.hero .actions a[data-account-nav]').getAttribute('href'), '/signup');
  assert.strictEqual(await page.locator('.nav-links a[data-account-nav]').innerText(), 'Create account');
  assert.strictEqual(await page.locator('.link-callout a').getAttribute('href'), '/link');
  await shot('01-home');
  step('home: Create account button + nav link -> /signup, one-liner -> /link');

  // ---- signed out /account and /link without a code go to /signup
  await page.goto(SITE + '/account?api=staging');
  await onPath('/signup');
  assert.ok((await page.evaluate(() => location.search)).includes('api=staging'), 'staging override is kept');
  await page.goto(SITE + '/link?api=staging');
  await onPath('/signup');
  step('signed-out /account and code-less /link redirect to /signup');

  // ---- sign up as a new email
  await page.waitForSelector('#link-email');
  await page.screenshot({ path: path.join(SHOTS, '02-signup.png'), fullPage: true });
  await page.fill('#link-email', 'nope');
  await page.click('[data-email-form] button[type=submit]');
  assert.match(await errText('#link-email-error'), /email address/);
  assert.strictEqual(await page.getAttribute('#link-email', 'aria-invalid'), 'true');
  await page.fill('#link-email', 'ratelimit@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-email-error').textContent.includes('Too many tries'));
  await shot('03-signup-rate-limited');
  await page.fill('#link-email', 'new.person@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForSelector('[data-view="code"]:not([hidden])');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'link-code');
  await page.fill('#link-code', '000000');
  await page.click('[data-code-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-code-error').textContent.includes('not right'));
  assert.strictEqual(await page.getAttribute('#link-code', 'aria-describedby'), 'link-code-hint link-code-error');
  await shot('04-signup-wrong-code');
  assert.ok(!mock.state.accounts['new.person@example.com'], 'account is not created before verify');
  await page.fill('#link-code', '123456');
  await page.click('[data-code-form] button[type=submit]');
  await page.waitForSelector('[data-view="done"]:not([hidden])');
  assert.ok(mock.state.accounts['new.person@example.com'], 'verify created the account');
  const done = await page.locator('[data-view="done"]').innerText();
  assert.match(done, /I.ll use the terminal/);
  assert.match(done, /I.d rather have an app/);
  assert.match(done, /canopy sign-in/);
  assert.match(done, /Install Canopy Code\.\s+Coming soon/);
  assert.match(done, /CanopyChat for Mac\s+Coming soon/i);
  // Mac has no store listing yet: no link or button next to it.
  assert.strictEqual(await page.locator('[data-view="done"] li:has-text("CanopyChat for Mac") a').count(), 0);
  // iPhone is the terminal path's companion; nothing but Mac on the app path.
  assert.strictEqual(await page.locator('#choice-terminal ~ p a[href*="apps.apple.com"]').count(), 1);
  assert.match(await page.locator('#choice-terminal ~ p.link-choice-note').innerText(), /Check on your computer from anywhere: get CanopyChat for iPhone and sign in with this account\./);
  assert.strictEqual(await page.locator('[data-view="done"] a[href="/android-beta"]').count(), 0);
  assert.strictEqual(await page.locator('.link-choice[aria-labelledby="choice-app"] a').count(), 0, 'app path has no links');
  assert.ok(!/iPhone/.test(await page.locator('.link-choice[aria-labelledby="choice-app"]').innerText()), 'no iPhone on the app path');
  assert.strictEqual(await page.locator('#choice-terminal ~ ol a[href^="/link"]').count(), 1);
  assert.strictEqual(await page.locator('#choice-app ~ ol, #choice-app ~ p:has-text("canopy sign-in")').count(), 0, 'no terminal steps on the app path');
  await page.screenshot({ path: path.join(SHOTS, '05-signup-done.png'), fullPage: true });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('canopy_account')));
  assert.ok(stored.refresh_token && stored.email === 'new.person@example.com');
  assert.deepStrictEqual((await page.evaluate(() => Object.keys(localStorage))).filter((k) => /canopy|token/i.test(k)), ['canopy_account']);
  assert.strictEqual(mock.state.log.find((l) => l.path === '/v1/auth/email/verify').client, 'canopy-web/1');
  step('sign up: validation, rate limit, wrong code, new account created on verify, next steps shown');

  // ---- nav flips to Account when signed in
  await page.goto(SITE + '/?api=staging');
  assert.strictEqual(await page.locator('.nav-links a[data-account-nav]').innerText(), 'Account');
  assert.strictEqual(await page.locator('.hero .actions a[data-account-nav]').innerText(), 'Account');
  assert.strictEqual(await page.locator('.nav-links a[data-account-nav]').getAttribute('href'), '/account?api=staging');
  await shot('06-home-signed-in');
  await page.goto(SITE + '/signup?api=staging');
  await onPath('/account');
  step('signed in: nav says Account; /signup forwards to /account');

  // ---- /account: email, devices, remove
  await page.waitForSelector('.link-device');
  assert.strictEqual(await page.locator('[data-account-email]').innerText(), 'new.person@example.com');
  mock.addDevice('new.person@example.com', { name: "Nate's MacBook Air", platform: 'macos', kind: 'computer', public_key: 'AAAA', fingerprint: '482910', last_seen_at: new Date(Date.now() - 5 * 60e3).toISOString() });
  mock.addDevice('new.person@example.com', { name: 'iPhone 16', platform: 'ios', kind: 'phone', public_key: 'BBBB', fingerprint: '071733', last_seen_at: new Date(Date.now() - 3 * 3600e3).toISOString() });
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.link-device').length === 3);
  const devText = await page.locator('[data-devices]').innerText();
  assert.match(devText, /482910/);
  assert.match(devText, /071733/);
  assert.match(devText, /This browser/i);
  assert.match(devText, /Chrome on Mac/);
  assert.match(await page.locator('.link-fingerprint-note').innerText(), /same 6 digits/);
  await shot('07-account-devices');
  step('/account: email, devices with fingerprints, session restored on reload');

  // ---- /link with a prefilled code: approve
  await page.goto(SITE + '/link?api=staging&code=wxyz1234');
  await page.waitForSelector('[data-view="approve"]:not([hidden])');
  assert.strictEqual(await page.inputValue('#link-user-code'), 'WXYZ-1234');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'link-device-name');
  assert.ok(!(await visible('[data-signin]')), 'device list moved off /link');
  assert.strictEqual(await page.locator('[data-devices]').count(), 0);
  await page.fill('#link-device-name', 'Studio Mac');
  await shot('08-link-approve');
  await page.click('[data-approve-form] button[type=submit]');
  await page.waitForSelector('[data-approve-success]:not([hidden])');
  assert.match(await page.locator('[data-approve-success]').innerText(), /Your computer is signed in\.\s+You can close this tab\./);
  assert.deepStrictEqual(mock.state.lastApprove, { user_code: 'WXYZ-1234', device_name: 'Studio Mac' });
  await shot('09-link-success');
  step('/link: prefilled code normalized and approved, success state');

  // ---- failure states (the access token is expired first: refresh + retry)
  await mockFetch('/__test/expire-access', { method: 'POST' });
  await page.click('[data-approve-another]');
  for (const [code, re, name] of [
    ['EXPD-0000', /expired/, '10-link-error-expired'],
    ['NONE-0000', /do not know that code/, '11-link-error-unknown'],
    ['SLOW-0000', /Too many tries/, '12-link-error-rate-limited'],
  ]) {
    await page.fill('#link-user-code', code.toLowerCase());
    await page.click('[data-approve-form] button[type=submit]');
    await page.waitForFunction((r) => new RegExp(r).test(document.querySelector('#link-approve-error').textContent), re.source);
    assert.match(await errText('#link-approve-error'), re);
    await shot(name);
  }
  assert.ok(mock.state.log.some((l) => l.path === '/v1/auth/token'), 'access token was refreshed');
  await page.fill('#link-user-code', 'abc');
  await page.click('[data-approve-form] button[type=submit]');
  assert.match(await errText('#link-approve-error'), /8-character/);
  step('expired / unknown / rate_limited / malformed code messages, silent token refresh');

  // ---- remove a device on /account
  await page.click('[data-account-link]:visible');
  await onPath('/account');
  await page.waitForFunction(() => document.querySelectorAll('.link-device').length >= 3);
  await page.click('[aria-label="Remove iPhone 16"]');
  await page.waitForFunction(() => !document.querySelector('[data-devices]').textContent.includes('iPhone 16'));
  assert.ok(!Object.values(mock.state.devices).some((d) => d.name === 'iPhone 16'));
  step('remove a device with confirm');

  // ---- sign out
  await page.click('[data-sign-out]');
  await onPath('/signup');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('canopy_account')), null);
  assert.ok(mock.state.log.some((l) => l.path === '/v1/auth/logout'));
  await page.goto(SITE + '/?api=staging');
  assert.strictEqual(await page.locator('.nav-links a[data-account-nav]').innerText(), 'Create account');
  step('sign out: logout called, storage cleared, nav back to Create account');

  // ---- signed out with a code: /link signs in with the shared flow, then approves
  await page.goto(SITE + '/link?api=staging&code=ABCD-5678');
  await page.waitForSelector('[data-signin]:not([hidden])');
  assert.ok((await page.evaluate(() => location.pathname)) === '/link');
  await page.fill('#link-email', 'new.person@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForSelector('[data-view="code"]:not([hidden])');
  await page.fill('#link-code', '654321');
  await page.click('[data-code-form] button[type=submit]');
  await page.waitForSelector('[data-view="approve"]:not([hidden])');
  assert.strictEqual(await page.inputValue('#link-user-code'), 'ABCD-5678');
  await shot('13-link-after-signin');
  step('/link with a code while signed out: sign in, then approve');

  // ---- remove this browser: signs out
  await page.goto(SITE + '/account?api=staging');
  await page.waitForSelector('.link-device');
  await page.click('[aria-label^="Remove Chrome on Mac"]');
  await onPath('/signup');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('canopy_account')), null);
  step('removing this browser signs out');

  // ---- CSP: nothing needed was blocked, and nothing else is allowed
  assert.deepStrictEqual(violations, [], 'unexpected console/CSP violations: ' + violations.join('\n'));
  const blocked = await page.evaluate(() => new Promise((resolve) => {
    document.addEventListener('securitypolicyviolation', (e) => resolve(e.blockedURI + ' by ' + e.violatedDirective));
    fetch('https://evil.example/x').catch(() => {});
    setTimeout(() => resolve('not blocked'), 2000);
  }));
  assert.match(blocked, /connect-src/, 'other hosts must be blocked, got: ' + blocked);
  const inlineBlocked = await page.evaluate(() => new Promise((resolve) => {
    document.addEventListener('securitypolicyviolation', (e) => resolve(e.violatedDirective));
    const s = document.createElement('script'); s.textContent = 'window.__x = 1'; document.head.appendChild(s);
    setTimeout(() => resolve('not blocked'), 1000);
  }));
  assert.match(inlineBlocked, /script-src/);
  assert.ok(apiHits.every((h) => h.startsWith('founding-api-staging.canopychat.app')), 'staging override only hits staging: ' + apiHits.join(', '));
  step('CSP: staging API allowed, other hosts and inline script blocked');

  // ---- default (production) host without ?api=staging, still intercepted
  apiHits.length = 0;
  await page.goto(SITE + '/signup');
  await page.fill('#link-email', 'x@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-email-error').textContent.length > 0);
  assert.ok(apiHits.some((h) => h.startsWith('founding-api.canopychat.app POST /v1/auth/email/start')), 'default API host: ' + apiHits.join(', '));
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, 'no horizontal overflow');
  step('default base is founding-api.canopychat.app (intercepted, never sent)');

  // ---- without JavaScript
  const noJs = await newPage({ javaScriptEnabled: false });
  for (const p of ['/signup', '/account', '/link']) {
    await noJs.goto(SITE + p);
    assert.ok(await noJs.locator('[data-link-nojs]').isVisible(), p + ' shows the no-JS message');
    assert.ok(!(await noJs.locator('[data-link-app]').isVisible()), p + ' hides the app');
  }
  await noJs.screenshot({ path: path.join(SHOTS, '14-no-javascript.png') });
  step('no-JS message shown on /signup, /account, /link');

  // ---- CLI-side polling states from the contract
  const j = (p, b) => mockFetch(p, { method: 'POST', body: JSON.stringify(b), headers: { 'Content-Type': 'application/json' } }).then(async (r) => [r.status, await r.text()]);
  const [, startText] = await j('/v1/auth/device', { client: 'canopy-cli', device_name: 'x', platform: 'macos', user_code_for_test: 'POLL-0001' });
  const dc = JSON.parse(startText).device_code;
  assert.strictEqual((await j('/v1/auth/device/token', { device_code: dc }))[0], 428);
  assert.strictEqual((await j('/v1/auth/device/token', { device_code: dc }))[0], 429);
  assert.strictEqual((await j('/v1/auth/device/token', { device_code: 'nope' }))[0], 410);
  step('mock covers authorization_pending (428), slow_down (429), expired (410)');

  await browser.close();
  mockSrv.close(); siteSrv.close();
  console.log('\nALL PASSED');
})().catch((e) => { console.error(e); process.exit(1); });
