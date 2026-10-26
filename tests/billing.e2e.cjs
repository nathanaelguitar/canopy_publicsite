/*
 * Headless-Chromium test of the plan chooser on /account and the homepage
 * #plans section
 * against tests/mock-accounts-api.cjs. Same setup as tests/link.e2e.cjs:
 *
 *   npm i playwright && npx playwright install chromium   (in any temp dir)
 *   NODE_PATH=<that dir>/node_modules node tests/billing.e2e.cjs
 *
 * Stripe hosts are intercepted in the browser; nothing leaves the machine.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium: pwChromium } = require('playwright');
const chromium = { launch: (o) => pwChromium.launch(Object.assign({ executablePath: process.env.CHROMIUM_PATH || undefined }, o || {})) };
const { createMock } = require('./mock-accounts-api.cjs');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const EMAIL = 'billing.person@example.com';
const DAY = 86400e3;
const iso = (ms) => new Date(Date.now() + ms).toISOString();

// Public plan copy never mentions internal budgets, costs, token counts or
// model vendors, and never promises pictures.
const BANNED = /budget|token|inference|\bcost\b|qwen|deepseek|kimi|glm|sail|leaf|picture|image/i;
function assertCleanCopy(text, where) {
  const m = text.match(BANNED);
  assert.ok(!m, where + ' must not say "' + (m && m[0]) + '"');
}

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
const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));

(async () => {
  const mock = createMock();
  const mockSrv = http.createServer(mock.handler);
  const mockPort = await listen(mockSrv);
  const siteSrv = serveSite();
  const sitePort = await listen(siteSrv);
  const SITE = 'http://localhost:' + sitePort;
  const MOCK = 'http://127.0.0.1:' + mockPort;
  const mockPost = (p, b) => fetch(MOCK + p, { method: 'POST', body: JSON.stringify(b), headers: { 'Content-Type': 'application/json' } });
  const setBilling = (b) => mockPost('/__test/billing', Object.assign({ email: EMAIL }, b));
  const step = (m) => console.log('ok  ' + m);

  const browser = await chromium.launch();
  const violations = [];
  const redirects = [];
  async function newPage() {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (/Content Security Policy|violates|Refused/i.test(m.text())) violations.push(m.text()); });
    page.on('pageerror', (e) => violations.push('pageerror: ' + e.message));
    await ctx.route(/https:\/\/founding-api-staging\.canopychat\.app\/.*/, async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      const headers = {};
      for (const [k, v] of Object.entries(req.headers())) {
        if (['authorization', 'content-type', 'x-canopy-client', 'access-control-request-method', 'access-control-request-headers', 'origin'].includes(k)) headers[k] = v;
      }
      const r = await fetch(MOCK + u.pathname + u.search, { method: req.method(), headers, body: req.postData() || undefined });
      const out = {};
      r.headers.forEach((v, k) => { out[k] = v; });
      await route.fulfill({ status: r.status, headers: out, body: Buffer.from(await r.arrayBuffer()) });
    });
    await ctx.route(/https:\/\/(checkout|billing)\.stripe\.test\/.*/, (route) => {
      redirects.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stripe</title>' });
    });
    const sess = await (await mockPost('/__test/session', { email: EMAIL })).json();
    await page.addInitScript((s) => {
      if (!localStorage.getItem('canopy_account')) localStorage.setItem('canopy_account', JSON.stringify({ refresh_token: s.refresh_token, email: s.account.email }));
    }, sess);
    return page;
  }
  const card = (page) => page.locator('[data-billing]');
  const open = async (page, q) => {
    await page.goto(SITE + '/account?api=staging' + (q || ''));
    await page.waitForSelector('[data-link-app]:not([hidden])');
  };
  const visible = (page, attr) => page.locator('[data-billing-' + attr + ']').isVisible();

  // ---- none: trial button, checkout POST with return_origin, redirect
  let page = await newPage();
  await setBilling({ entitlements: [], subscription: null, publicSiteUrl: SITE });
  await open(page);
  await page.waitForSelector('[data-billing-trial]:not([hidden])');
  assert.match(await page.locator('[data-billing-trial]').innerText(), /Start 7-day free trial/);
  assert.ok(!(await visible(page, 'manage')));
  assert.ok(await visible(page, 'pro'), 'Pro offered to a free account');
  const planText = await card(page).innerText();
  assert.match(planText, /\$9\.99/);
  assert.match(planText, /\$49\.99/);
  assert.match(planText, /then \$9\.99 a month/);
  assert.equal(await page.locator('[data-plan="free"]').getAttribute('data-current'), 'true', 'Grove highlighted');
  assert.ok(await page.locator('[data-plan="free"] [data-plan-badge]').isVisible());
  assert.ok(!(await page.locator('[data-plan="plus"] [data-plan-badge]').isVisible()));
  assertCleanCopy(planText, 'account plans');
  await page.click('[data-billing-trial]');
  await page.waitForURL(/checkout\.stripe\.test/);
  const co = mock.state.billingCalls.find((c) => c.path === '/v1/billing/checkout');
  assert.deepStrictEqual(co.body, { product: 'remote_control', return_origin: SITE });
  step('none: Grove highlighted, $9.99 / $49.99 shown; trial button POSTs checkout {product, return_origin} and redirects');

  // ---- none: Pro button starts a Pro (agents) checkout
  await open(page);
  await page.waitForSelector('[data-billing-pro]:not([hidden])');
  mock.state.billingCalls = [];
  await page.click('[data-billing-pro]');
  await page.waitForURL(/checkout\.stripe\.test/);
  assert.deepStrictEqual(mock.state.billingCalls.find((c) => c.path === '/v1/billing/checkout').body, { product: 'agents', return_origin: SITE });
  step('none: Choose Pro POSTs checkout {product: agents} and redirects');

  // ---- a backend that does not sell Pro: "coming soon", never an error
  await setBilling({ entitlements: [], subscription: null, proUnavailable: true });
  await open(page);
  await page.waitForSelector('[data-billing-pro]:not([hidden])');
  await page.click('[data-billing-pro]');
  await page.waitForSelector('[data-billing-pro-note]:not([hidden])');
  assert.match(await page.locator('[data-billing-pro-note]').innerText(), /Pro is coming soon/);
  assert.ok(!(await visible(page, 'pro')));
  assert.equal((await page.locator('[data-billing-error]').innerText()).trim(), '', 'no error shown');
  assert.ok(await visible(page, 'trial'), 'Plus still offered');
  await setBilling({ entitlements: [], subscription: null, proUnavailable: false });
  step('Pro product_unavailable: card says "Pro is coming soon", no error');

  // ---- old backend: no entitlements/subscription fields at all
  mock.state.billing = {};
  await open(page);
  await page.waitForSelector('[data-billing-trial]:not([hidden])');
  step('old backend (fields absent) is treated as none');

  // ---- checkout 409 already_subscribed
  await setBilling({ entitlements: ['remote_control'], subscription: { product: 'remote_control', status: 'active', current_period_end: iso(20 * DAY), trial_end: null, cancel_at_period_end: false } });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');

  // ---- active: status, renewal date, manage billing -> portal
  assert.match(await card(page).innerText(), /Active/);
  assert.match(await page.locator('[data-billing-detail]').innerText(), /^Renews on /);
  assert.ok(!(await visible(page, 'trial')));
  assert.ok(!(await visible(page, 'pro')));
  await page.click('[data-billing-manage]');
  await page.waitForURL(/billing\.stripe\.test/);
  assert.ok(mock.state.billingCalls.some((c) => c.path === '/v1/billing/portal'));
  step('active: status, renewal date, Manage billing -> portal redirect');

  // ---- active but canceling
  await setBilling({ entitlements: ['remote_control'], subscription: { product: 'remote_control', status: 'active', current_period_end: iso(5 * DAY), trial_end: null, cancel_at_period_end: true } });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');
  assert.match(await page.locator('[data-billing-detail]').innerText(), /^Ends on .*will not renew/);
  step('active + cancel_at_period_end: end date, will not renew');

  // ---- trialing
  await setBilling({ entitlements: ['remote_control'], subscription: { product: 'remote_control', status: 'trialing', current_period_end: iso(7 * DAY), trial_end: iso(7 * DAY), cancel_at_period_end: false } });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');
  assert.match(await card(page).innerText(), /Free trial/);
  assert.match(await page.locator('[data-billing-detail]').innerText(), /trial ends on .*then \$5\/month/);
  step('trialing (old Remote control subscription): status, trial end date at its own price, Manage billing');

  // ---- Plus (leaf) trial: Plus highlighted, $9.99
  await setBilling({ entitlements: ['remote_control', 'leaf'], subscription: { product: 'leaf', status: 'trialing', current_period_end: iso(7 * DAY), trial_end: iso(7 * DAY), cancel_at_period_end: false } });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');
  assert.match(await page.locator('[data-billing-status]').innerText(), /Plus: Free trial/);
  assert.match(await page.locator('[data-billing-detail]').innerText(), /then \$9\.99\/month/);
  assert.equal(await page.locator('[data-plan="plus"]').getAttribute('data-current'), 'true');
  assert.ok(!(await visible(page, 'trial')) && !(await visible(page, 'pro')));
  assert.match(await page.locator('[data-billing-pro-note]').innerText(), /Want Pro/);
  // ---- Plus bought in the App Store / Google Play: portal says no_billing_account
  await setBilling({ entitlements: ['remote_control', 'leaf'], subscription: { product: 'leaf', status: 'active', current_period_end: iso(20 * DAY), trial_end: null, cancel_at_period_end: false }, storeOnly: true });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');
  await page.click('[data-billing-manage]');
  await page.waitForFunction(() => /App Store or Google Play/.test(document.querySelector('[data-billing-error]').innerText));
  await setBilling({ entitlements: [], subscription: null, storeOnly: false });
  step('store Plus: Manage billing explains it is managed in the App Store or Google Play');
  step('Plus trial: Plus highlighted, $9.99/month after, Manage billing, no buy buttons');

  // ---- Pro active: Pro highlighted, $49.99
  await setBilling({ entitlements: ['remote_control', 'leaf', 'agents'], subscription: { product: 'agents', status: 'active', current_period_end: iso(20 * DAY), trial_end: null, cancel_at_period_end: false } });
  await open(page);
  await page.waitForSelector('[data-billing-manage]:not([hidden])');
  assert.match(await page.locator('[data-billing-status]').innerText(), /Pro: Active/);
  assert.match(await page.locator('[data-billing-detail]').innerText(), /Renews on .*\$49\.99\/month/);
  assert.equal(await page.locator('[data-plan="pro"]').getAttribute('data-current'), 'true');
  assert.equal(await page.locator('[data-plan="free"]').getAttribute('data-current'), 'false');
  step('Pro active: Pro highlighted, renews at $49.99/month');

  // ---- past_due
  await setBilling({ entitlements: [], subscription: { product: 'remote_control', status: 'past_due', current_period_end: iso(-1 * DAY), trial_end: null, cancel_at_period_end: false } });
  await open(page);
  await page.waitForSelector('[data-billing-warning]:not([hidden])');
  assert.match(await page.locator('[data-billing-warning]').innerText(), /could not charge your card/);
  assert.ok(await visible(page, 'manage'));
  assert.ok(!(await visible(page, 'trial')));
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '15-account-billing-past-due.png') });
  step('past_due: warning plus Manage billing');

  // ---- complimentary / founding: entitlement, no subscription
  await setBilling({ entitlements: ['remote_control'], subscription: null });
  await open(page);
  await page.waitForFunction(() => /Included with your account/.test(document.querySelector('[data-billing]').innerText));
  assert.ok(!(await visible(page, 'trial')));
  assert.ok(!(await visible(page, 'manage')));
  step('entitlement without subscription: "Included with your account", no buttons');

  // ---- ?checkout=cancel
  await setBilling({ entitlements: [], subscription: null });
  await open(page, '&checkout=cancel');
  await page.waitForSelector('[data-billing-trial]:not([hidden])');
  assert.match(await page.locator('[data-billing-notice]').innerText(), /canceled/);
  assert.ok(!page.url().includes('checkout='), 'checkout param removed from the URL');
  assert.ok(page.url().includes('api=staging'), 'api override kept');
  step('?checkout=cancel: notice, trial button still offered');

  // ---- ?checkout=success: confirmation, then refetch picks up the new subscription
  await open(page, '&checkout=success');
  assert.match(await page.locator('[data-billing-notice]').innerText(), /plan is starting/);
  const meCalls = () => fetch(MOCK + '/__test/log').then((r) => r.json()).then((l) => l.filter((e) => e.path === '/v1/me').length);
  const before = await meCalls();
  await setBilling({ entitlements: ['remote_control'], subscription: { product: 'remote_control', status: 'trialing', current_period_end: iso(7 * DAY), trial_end: iso(7 * DAY), cancel_at_period_end: false } });
  await page.waitForSelector('[data-billing-manage]:not([hidden])', { timeout: 10000 });
  assert.match(await page.locator('[data-billing-notice]').innerText(), /all set/);
  assert.ok((await meCalls()) > before, '/v1/me was refetched');
  assert.ok(!page.url().includes('checkout='));
  step('?checkout=success: confirmation line, /v1/me refetched until the subscription appears');

  // ---- /v1/me failure leaves the rest of the page usable
  await page.route(/founding-api-staging\.canopychat\.app\/v1\/me/, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }));
  await open(page);
  await page.waitForFunction(() => /could not load your plan/.test(document.querySelector('[data-billing]').innerText));
  assert.ok(!(await visible(page, 'trial')) && !(await visible(page, 'manage')) && !(await visible(page, 'pro')));
  step('/v1/me error: message, no purchase buttons');

  // ---- homepage #plans: public prices, nav link, plain words
  const home = await newPage();
  await home.goto(SITE + '/');
  assert.ok(await home.locator('.nav-links a[href="#plans"]').isVisible(), 'Plans nav link');
  const plans = home.locator('#plans');
  assert.ok(await plans.isVisible());
  const homeText = await plans.innerText();
  for (const name of ['Grove', 'Plus', 'Pro']) assert.match(homeText, new RegExp(name));
  assert.match(homeText, /\$9\.99/);
  assert.match(homeText, /\$49\.99/);
  assert.match(homeText, /7-day free trial/);
  assert.match(homeText, /App Store/);
  assert.match(homeText, /Invite-only/i);
  assertCleanCopy(homeText, 'homepage plans');
  assert.equal(await home.locator('#plans [data-plan-cta="plus"]').getAttribute('href'), '/account');
  assert.equal(await home.locator('#plans .plans-flame').getAttribute('href'), '/flame');
  await home.close();
  step('homepage #plans: Grove / Plus $9.99 / Pro $49.99, nav link, no budget or vendor words');

  assert.deepStrictEqual(violations, [], 'no CSP violations or page errors: ' + violations.join('; '));
  step('no CSP violations');

  await browser.close();
  mockSrv.close(); siteSrv.close();
  console.log('\nALL PASSED');
})().catch((e) => { console.error(e); process.exit(1); });
