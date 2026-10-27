/*
 * Headless-Chromium walkthrough of /flame (waitlist + optional contribution)
 * and the homepage links that point to it.
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/flame.e2e.cjs
 *
 * Requests to founding-api.canopychat.app are intercepted in the browser and
 * answered here with the Worker's contract (local_ai_aether PR #57), so CSP is
 * enforced as in production and nothing reaches the real API or Stripe.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots', 'flame');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_flame_mock';

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

/* The Worker contract for the two Flame routes. */
function flameApi(method, pathname, body) {
  if (method !== 'POST') return [405, { error: 'method_not_allowed' }];
  if (pathname === '/v1/flame/waitlist') {
    const keys = Object.keys(body || {});
    if (keys.length !== 1 || keys[0] !== 'email') return [400, { error: 'invalid_request' }];
    if (body.email === 'ratelimit@example.com') return [429, { error: 'rate_limited' }];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return [400, { error: 'invalid_email' }];
    return [200, { ok: true }];
  }
  if (pathname === '/v1/flame/contribute') {
    const keys = Object.keys(body || {});
    if (keys.some((k) => k !== 'amount_cents' && k !== 'email')) return [400, { error: 'invalid_request' }];
    if (!Number.isSafeInteger(body.amount_cents) || body.amount_cents < 1000) return [400, { error: 'invalid_amount' }];
    if (body.amount_cents === 4200) return [503, { error: 'service_misconfigured' }];
    return [200, { url: CHECKOUT_URL }];
  }
  return [404, { error: 'not_found' }];
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const siteSrv = serveSite();
  const SITE = 'http://localhost:' + (await listen(siteSrv));
  const browser = await chromium.launch();

  const calls = [];
  const violations = [];
  async function newPage(viewport) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (/Content Security Policy|violates|Refused/i.test(m.text())) violations.push(m.text()); });
    page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
    await ctx.route(/https:\/\/connect\.facebook\.net\/.*/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await ctx.route(/https:\/\/founding-api\.canopychat\.app\/.*/, (route) => {
      const req = route.request();
      const u = new URL(req.url());
      const cors = { 'access-control-allow-origin': SITE, 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const body = req.postData() ? JSON.parse(req.postData()) : {};
      calls.push({ path: u.pathname, body });
      const [status, payload] = flameApi(req.method(), u.pathname, body);
      return route.fulfill({ status, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify(payload) });
    });
    await ctx.route(/https:\/\/checkout\.stripe\.com\/.*/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Stripe Checkout (mock)</title>' }));
    return page;
  }

  const step = (m) => console.log('ok  ' + m);

  // ---- homepage: Founding Members is unlisted, Flame is linked
  let page = await newPage({ width: 1280, height: 860 });
  await page.goto(SITE + '/');
  assert.strictEqual(await page.locator('a[href="/founding"]').count(), 0, 'homepage must not link /founding');
  assert.strictEqual(await page.locator('.nav-links a[href="/flame"]').count(), 1);
  assert.strictEqual(await page.locator('.hero .actions a[href="/flame"]').innerText(), 'Meet Flame');
  const eco = await page.locator('#how-it-works').innerText();
  assert.ok(!/No data centers|No water wasted/i.test(eco), 'old eco claims are gone');
  assert.ok(/Hybrid by design/.test(eco) && /Privacy comes first/.test(eco) && /A lighter footprint/.test(eco));
  assert.ok(/Permanent removal/.test(eco), 'climate commitment kept');
  assert.ok(await page.locator('.flame-cta img').evaluate((img) => img.complete && img.naturalWidth === 96), 'Flame face loads');
  await page.locator('.hero .actions').screenshot({ path: path.join(SHOTS, 'home-cta.png') });
  await page.locator('#how-it-works').screenshot({ path: path.join(SHOTS, 'home-eco.png') });
  for (const p of ['/privacy', '/terms', '/support']) {
    await page.goto(SITE + p);
    assert.strictEqual(await page.locator('a[href="/founding"]').count(), 0, p + ' must not link /founding');
  }
  await page.goto(SITE + '/founding');
  assert.strictEqual(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
  await page.goto(SITE + '/privacy#cloud');
  assert.ok(await page.locator('#cloud').isVisible(), 'privacy policy has the cloud section the homepage links to');
  step('homepage + legal pages: /founding unlisted and noindex, Flame linked, hybrid copy in, #cloud exists');

  // ---- /flame desktop
  await page.goto(SITE + '/flame');
  {
    const body = await page.locator('body').innerText();
    assert.match(body, /Every paid CanopyChat plan already includes agents and remote control/);
    assert.equal((body.match(/Flame’s house in the clouds is part of Pro\./g) || []).length, 2, 'cloud computer is Pro-only, said twice');
  }
  await page.waitForTimeout(1100); // let the entrance motion settle before capturing
  assert.ok(await page.locator('.flame-portrait img').evaluate((img) => img.complete && img.naturalWidth === 512));
  await page.screenshot({ path: path.join(SHOTS, 'desktop.png'), fullPage: true });

  // waitlist validation, rate limit, success
  await page.click('[data-flame-waitlist-submit]');
  assert.match(await page.locator('[data-flame-waitlist-status]').innerText(), /valid email/);
  assert.strictEqual(calls.length, 0, 'invalid email never reaches the API');
  await page.fill('#flame-email', 'ratelimit@example.com');
  await page.click('[data-flame-waitlist-submit]');
  await page.waitForFunction(() => document.querySelector('[data-flame-waitlist-status]').textContent.includes('Too many'));
  await page.fill('#flame-email', 'early.bird@example.com');
  await page.click('[data-flame-waitlist-submit]');
  await page.waitForSelector('[data-flame-waitlist-success]:not([hidden])');
  assert.match(await page.locator('[data-flame-waitlist-success]').innerText(), /early\.bird@example\.com/);
  assert.ok(await page.locator('[data-flame-waitlist-form]').isHidden());
  assert.deepStrictEqual(calls[calls.length - 1], { path: '/v1/flame/waitlist', body: { email: 'early.bird@example.com' } });
  step('waitlist: client validation, 429 message, success state with the email');

  // contribution: presets, custom, validation, error, redirect
  assert.strictEqual(await page.locator('[data-flame-contribute-cta]').innerText(), 'Contribute $25 securely');
  await page.click('[data-flame-amount-cents="5000"]');
  assert.strictEqual(await page.getAttribute('[data-flame-amount-cents="5000"]', 'aria-pressed'), 'true');
  assert.strictEqual(await page.getAttribute('[data-flame-amount-cents="2500"]', 'aria-pressed'), 'false');
  assert.strictEqual(await page.locator('[data-flame-contribute-cta]').innerText(), 'Contribute $50 securely');
  await page.fill('[data-flame-custom-amount]', '5');
  assert.strictEqual(await page.locator('[data-flame-contribute-cta]').innerText(), 'Contribute securely');
  const before = calls.length;
  await page.click('[data-flame-contribute-cta]');
  assert.match(await page.locator('[data-flame-contribute-status]').innerText(), /at least \$10/);
  assert.strictEqual(calls.length, before, 'invalid amount never reaches the API');
  await page.fill('[data-flame-custom-amount]', '42');
  await page.click('[data-flame-contribute-cta]');
  await page.waitForFunction(() => document.querySelector('[data-flame-contribute-status]').textContent.includes('temporarily unavailable'));
  assert.strictEqual(await page.locator('[data-flame-contribute-cta]').isDisabled(), false, 'button re-enabled after an error');
  await page.fill('[data-flame-custom-amount]', '');
  await page.click('[data-flame-amount-cents="1000"]');
  await Promise.all([page.waitForURL(CHECKOUT_URL), page.click('[data-flame-contribute-cta]')]);
  assert.deepStrictEqual(calls[calls.length - 1], {
    path: '/v1/flame/contribute',
    body: { amount_cents: 1000, email: 'early.bird@example.com' },
  });
  step('contribution: presets + custom, min-amount guard, 503 message, $10 redirect to Stripe with the waitlist email');

  // return states
  await page.goto(SITE + '/flame?contribution=thanks');
  assert.match(await page.locator('[data-flame-contribute-status]').innerText(), /Thank you/);
  await page.goto(SITE + '/flame?contribution=cancelled');
  assert.match(await page.locator('[data-flame-contribute-status]').innerText(), /Nothing was charged/);
  step('return from Stripe: thanks and cancelled messages');

  // ---- /flame mobile, contribution without a waitlist email
  page = await newPage({ width: 390, height: 844 });
  await page.goto(SITE + '/flame');
  await page.waitForTimeout(1100);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, 'no horizontal scroll at 390px (overflow ' + overflow + 'px)');
  await page.screenshot({ path: path.join(SHOTS, 'mobile.png'), fullPage: true });
  await Promise.all([page.waitForURL(CHECKOUT_URL), page.click('[data-flame-contribute-cta]')]);
  assert.deepStrictEqual(calls[calls.length - 1].body, { amount_cents: 2500 }, 'email is optional for a contribution');
  step('mobile: no horizontal overflow; contribution works without a waitlist email');

  assert.deepStrictEqual(violations, [], 'no CSP violations or page errors');
  step('no CSP violations or page errors');

  await browser.close();
  siteSrv.close();
  console.log('\nflame e2e passed');
})().catch((e) => { console.error(e); process.exit(1); });
