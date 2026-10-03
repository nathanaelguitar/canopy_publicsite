/*
 * Headless-Chromium walkthrough of /link against tests/mock-accounts-api.cjs.
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/link.e2e.cjs
 *
 * The page is served from this repo over http://localhost. Requests the page
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const apiHits = [];
  const violations = [];
  page.on('console', (m) => { if (/Content Security Policy|violates|Refused/i.test(m.text())) violations.push(m.text()); });
  page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
  await ctx.route(/https:\/\/founding-api(-staging)?\.canopychat\.app\/.*/, async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    apiHits.push(u.host + ' ' + req.method() + ' ' + u.pathname);
    if (u.host === 'founding-api.canopychat.app' && process.env.ALLOW_PROD !== '1') {
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

  page.on('dialog', (d) => d.accept());
  const shot = (name) => page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false });
  const errText = (sel) => page.locator(sel).innerText();
  const step = (m) => console.log('ok  ' + m);

  // ---- index callout
  await page.goto(SITE + '/');
  const callout = page.locator('.link-callout a');
  assert.strictEqual(await callout.getAttribute('href'), '/link');
  await page.locator('.link-callout').scrollIntoViewIfNeeded();
  await shot('01-index-link');
  step('index has the link callout');

  // ---- sign in, prefilled code in the URL (lowercase, no dash)
  await page.goto(SITE + '/link?api=staging&code=wxyz1234');
  await page.waitForSelector('#link-email');
  assert.ok(await page.locator('[data-view="email"]').isVisible());
  await page.screenshot({ path: path.join(SHOTS, '02-signin-email.png'), fullPage: true });

  await page.fill('#link-email', 'nope');
  await page.click('[data-email-form] button[type=submit]');
  assert.match(await errText('#link-email-error'), /email address/);
  assert.strictEqual(await page.getAttribute('#link-email', 'aria-invalid'), 'true');

  await page.fill('#link-email', 'ratelimit@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-email-error').textContent.includes('Too many tries'));
  await shot('03-rate-limited-email');
  step('email validation and rate_limited message');

  await page.fill('#link-email', 'nate@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForSelector('[data-view="code"]:not([hidden])');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'link-code');
  assert.strictEqual(await page.locator('[data-sent-to]').innerText(), 'nate@example.com');

  await page.fill('#link-code', '000000');
  await page.click('[data-code-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-code-error').textContent.includes('not right'));
  await shot('04-wrong-code');
  assert.strictEqual(await page.getAttribute('#link-code', 'aria-describedby'), 'link-code-hint link-code-error');

  await page.fill('#link-code', '123456');
  await page.click('[data-code-form] button[type=submit]');
  await page.waitForSelector('[data-view="account"]:not([hidden])');
  step('email start, wrong code, correct code');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('canopy_account')));
  assert.ok(stored.refresh_token && stored.email === 'nate@example.com');
  assert.deepStrictEqual((await page.evaluate(() => Object.keys(localStorage))).filter((k) => /canopy|token/i.test(k)), ['canopy_account']);
  const verifyBody = mock.state.log.find((l) => l.path === '/v1/auth/email/verify');
  assert.ok(verifyBody && verifyBody.client === 'canopy-web/1');

  // ---- approve prefilled code
  assert.strictEqual(await page.inputValue('#link-user-code'), 'WXYZ-1234');
  assert.strictEqual(await page.evaluate(() => document.activeElement.id), 'link-device-name');
  mock.addDevice('nate@example.com', { name: "Nate's MacBook Air", platform: 'macos', kind: 'computer', public_key: 'AAAA', fingerprint: '482910', last_seen_at: new Date(Date.now() - 5 * 60e3).toISOString() });
  mock.addDevice('nate@example.com', { name: 'iPhone 16', platform: 'ios', kind: 'phone', public_key: 'BBBB', fingerprint: '071733', last_seen_at: new Date(Date.now() - 3 * 3600e3).toISOString() });
  await page.fill('#link-device-name', 'Studio Mac');
  await shot('05-approve-prefilled');
  await page.click('[data-approve-form] button[type=submit]');
  await page.waitForSelector('[data-approve-success]:not([hidden])');
  assert.match(await page.locator('[data-approve-success]').innerText(), /Your computer is signed in\.\s+You can close this tab\./);
  assert.deepStrictEqual(mock.state.lastApprove, { user_code: 'WXYZ-1234', device_name: 'Studio Mac' });
  await page.locator('[data-approve-success]').scrollIntoViewIfNeeded();
  await shot('06-approve-success');
  step('approve prefilled code, normalized, success state');

  // ---- devices
  await page.waitForSelector('.link-device');
  assert.strictEqual(await page.locator('.link-device').count(), 3);
  const devText = await page.locator('[data-devices]').innerText();
  assert.match(devText, /482910/);
  assert.match(devText, /071733/);
  assert.match(devText, /This browser/i);
  assert.match(devText, /Chrome on Mac/);
  await page.locator('[data-devices]').scrollIntoViewIfNeeded();
  await shot('07-devices');
  await page.click('[aria-label="Remove iPhone 16"]');
  await page.waitForFunction(() => document.querySelectorAll('.link-device').length === 2);
  assert.ok(!(await page.locator('[data-devices]').innerText()).includes('iPhone 16'));
  step('devices list with fingerprints; remove with confirm');

  // ---- failure states (also with an expired access token: refresh + retry)
  await mockFetch('/__test/expire-access', { method: 'POST' });
  const cases = [
    ['EXPD-0000', /expired/, '08-error-expired'],
    ['NONE-0000', /do not know that code/, '09-error-unknown'],
    ['SLOW-0000', /Too many tries/, '10-error-rate-limited'],
  ];
  await page.click('[data-approve-another]');
  for (const [code, re, name] of cases) {
    await page.fill('#link-user-code', code.toLowerCase());
    await page.click('[data-approve-form] button[type=submit]');
    await page.waitForFunction((r) => new RegExp(r).test(document.querySelector('#link-approve-error').textContent), re.source);
    assert.match(await errText('#link-approve-error'), re);
    await page.locator('#link-user-code').scrollIntoViewIfNeeded();
    await shot(name);
  }
  assert.ok(mock.state.log.some((l) => l.path === '/v1/auth/token'), 'access token was refreshed');
  await page.fill('#link-user-code', 'abc');
  await page.click('[data-approve-form] button[type=submit]');
  assert.match(await errText('#link-approve-error'), /8-character/);
  step('expired / unknown / rate_limited / malformed code messages, silent token refresh');

  // ---- reload keeps the session
  await page.reload();
  await page.waitForSelector('[data-view="account"]:not([hidden])');
  assert.strictEqual(await page.locator('[data-account-email]').innerText(), 'nate@example.com');
  step('reload restores session via /v1/auth/token');

  // ---- sign out
  await page.click('[data-sign-out]');
  await page.waitForSelector('[data-view="email"]:not([hidden])');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('canopy_account')), null);
  assert.ok(mock.state.log.some((l) => l.path === '/v1/auth/logout'));
  assert.match(await page.locator('[data-link-notice]').innerText(), /signed out/);
  await shot('11-signed-out');
  step('sign out: logout called, storage cleared');

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
  await page.goto(SITE + '/link');
  await page.fill('#link-email', 'x@example.com');
  await page.click('[data-email-form] button[type=submit]');
  await page.waitForFunction(() => document.querySelector('#link-email-error').textContent.length > 0);
  assert.ok(apiHits.some((h) => h.startsWith('founding-api.canopychat.app POST /v1/auth/email/start')), 'default API host: ' + apiHits.join(', '));
  step('default base is founding-api.canopychat.app (intercepted, never sent)');

  // ---- mobile layout has no horizontal scroll
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, 'horizontal overflow ' + overflow);

  // ---- without JavaScript
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const p2 = await noJs.newPage();
  await p2.goto(SITE + '/link');
  assert.ok(await p2.locator('[data-link-nojs]').isVisible());
  assert.ok(!(await p2.locator('[data-link-app]').isVisible()));
  await p2.screenshot({ path: path.join(SHOTS, '12-no-javascript.png') });
  await noJs.close();
  step('no-JS message shown, app hidden');

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
