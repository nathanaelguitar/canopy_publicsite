/*
 * Tiny in-memory mock of the Canopy accounts API (canopy/docs/accounts-api.md)
 * covering the endpoints canopychat.app/link calls, plus the CLI-side
 * device-code endpoints so tests can see authorization_pending / slow_down.
 *
 * Standalone:  node tests/mock-accounts-api.cjs [port]
 * Test hooks:  POST /__test/expire-access   invalidates every access token
 *              POST /__test/reset           clears all state
 *
 *              POST /__test/session       {email} -> tokens for a signed-in browser
 *              POST /__test/billing       {email, entitlements, subscription} sets /v1/me billing
 *
 * Billing (contract: billing-contract.md): GET /v1/me, POST /v1/billing/checkout
 * (409 already_subscribed, 400 bad_return_origin) and /v1/billing/portal.
 *
 * Magic values:
 *   email  ratelimit@example.com        -> 429 rate_limited on /email/start
 *   code   000000                       -> 401 invalid_code on /email/verify
 *   user_code EXPD-0000 -> 410 expired, NONE-0000 -> 404 unknown_code,
 *             SLOW-0000 -> 429 rate_limited
 * Any other 6-digit code signs in; any other WXYZ-1234 style code approves.
 */
'use strict';
const http = require('http');
const crypto = require('crypto');

function createMock() {
  let state;
  function reset() {
    state = {
      accounts: {}, // email -> { id, email }
      refresh: {}, // token -> { email, deviceId, usedAt }
      access: {}, // token -> { email, deviceId }
      devices: {}, // id -> device
      userCodes: {}, // user_code -> { device_code, approved, device_name, email, lastPoll }
      deviceCodes: {}, // device_code -> user_code
      billing: {}, // email -> { entitlements, subscription }
      publicSiteUrl: null, // when set, checkout return_origin must equal it
      billingCalls: [],
      seq: 0,
      log: [],
    };
  }
  reset();

  const id = (p) => p + '_' + (++state.seq);
  const token = () => crypto.randomBytes(18).toString('base64url');
  const now = () => new Date().toISOString();

  function mintTokens(email, deviceId) {
    const refresh = token();
    const access = token();
    state.refresh[refresh] = { email, deviceId };
    state.access[access] = { email, deviceId };
    return { refresh_token: refresh, access_token: access, expires_at: new Date(Date.now() + 3600e3).toISOString() };
  }

  function addDevice(email, d) {
    const dev = Object.assign({
      id: id('dev'), name: 'Device', platform: 'web', kind: 'browser', public_key: null, fingerprint: null,
      created_at: now(), last_seen_at: now(), this_device: false, email,
    }, d);
    state.devices[dev.id] = dev;
    return dev;
  }

  function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Canopy-Client');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  function send(res, status, body) {
    cors(res);
    if (status === 204 || body === undefined) { res.writeHead(status); return res.end(); }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }
  const err = (res, status, code, message) => send(res, status, { error: code, message: message || code });

  function authed(req, res) {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    const a = m && state.access[m[1]];
    if (!a) { err(res, 401, 'invalid_token', 'Sign in again.'); return null; }
    return a;
  }

  function handler(req, res) {
    const url = new URL(req.url, 'http://mock');
    const path = url.pathname;
    state.log.push({ method: req.method, path, client: req.headers['x-canopy-client'] || null });
    if (req.method === 'OPTIONS') return send(res, 204);
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch (e) { return err(res, 400, 'bad_json'); }
      route(req.method, path, body, req, res);
    });
  }

  function route(method, path, body, req, res) {
    if (method === 'POST' && path === '/__test/expire-access') { state.access = {}; return send(res, 204); }
    if (method === 'POST' && path === '/__test/reset') { reset(); return send(res, 204); }
    if (method === 'GET' && path === '/__test/log') return send(res, 200, state.log);
    if (method === 'POST' && path === '/__test/seed-device') {
      return send(res, 200, addDevice(body.email, body));
    }

    if (method === 'POST' && path === '/__test/session') {
      const acct = state.accounts[body.email] || (state.accounts[body.email] = { id: id('acct'), email: body.email });
      const dev = addDevice(body.email, { name: 'Chrome on Mac', platform: 'web', kind: 'browser' });
      return send(res, 200, Object.assign(mintTokens(body.email, dev.id), { account: { id: acct.id, email: acct.email } }));
    }
    if (method === 'POST' && path === '/__test/billing') {
      state.billing[body.email] = { entitlements: body.entitlements || [], subscription: body.subscription || null };
      if (body.publicSiteUrl !== undefined) state.publicSiteUrl = body.publicSiteUrl;
      return send(res, 204);
    }

    // ---- website sign-in
    if (method === 'POST' && path === '/v1/auth/email/start') {
      if (body.email === 'ratelimit@example.com') return err(res, 429, 'rate_limited', 'Too many codes.');
      if (!/^[^\s@]+@[^\s@]+$/.test(body.email || '')) return err(res, 400, 'invalid_email');
      return send(res, 202, {});
    }
    if (method === 'POST' && path === '/v1/auth/email/verify') {
      if (body.platform !== 'web' || !body.device_name) return err(res, 400, 'invalid_request');
      if (!/^\d{6}$/.test(body.code || '') || body.code === '000000') return err(res, 401, 'invalid_code', 'That code is not right.');
      const acct = state.accounts[body.email] || (state.accounts[body.email] = { id: id('acct'), email: body.email });
      const dev = addDevice(body.email, { name: body.device_name, platform: 'web', kind: 'browser' });
      const t = mintTokens(body.email, dev.id);
      return send(res, 200, Object.assign(t, { account: { id: acct.id, email: acct.email }, device: { id: dev.id, name: dev.name } }));
    }
    if (method === 'POST' && path === '/v1/auth/token') {
      const r = state.refresh[body.refresh_token];
      if (!r) return err(res, 401, 'invalid_refresh_token', 'Sign in again.');
      // Rotate: the old token stays valid for 60 s.
      if (!r.usedAt) r.usedAt = Date.now();
      else if (Date.now() - r.usedAt > 60e3) return err(res, 401, 'invalid_refresh_token');
      const t = mintTokens(r.email, r.deviceId);
      return send(res, 200, t);
    }
    if (method === 'POST' && path === '/v1/auth/logout') {
      const a = authed(req, res); if (!a) return;
      for (const [k, v] of Object.entries(state.refresh)) if (v.deviceId === a.deviceId) delete state.refresh[k];
      for (const [k, v] of Object.entries(state.access)) if (v.deviceId === a.deviceId) delete state.access[k];
      delete state.devices[a.deviceId];
      return send(res, 204);
    }

    // ---- device-code (CLI side + approve)
    if (method === 'POST' && path === '/v1/auth/device') {
      const user_code = body.user_code_for_test || 'WXYZ-1234';
      const device_code = token();
      state.userCodes[user_code] = { device_code, approved: false, device_name: body.device_name, lastPoll: 0 };
      state.deviceCodes[device_code] = user_code;
      return send(res, 201, {
        device_code, user_code,
        verification_url: 'https://canopychat.app/link',
        verification_url_complete: 'https://canopychat.app/link?code=' + user_code,
        expires_at: new Date(Date.now() + 600e3).toISOString(), interval_seconds: 5,
      });
    }
    if (method === 'POST' && path === '/v1/auth/device/token') {
      const uc = state.deviceCodes[body.device_code];
      const rec = uc && state.userCodes[uc];
      if (!rec) return err(res, 410, 'expired');
      if (Date.now() - rec.lastPoll < 1000) return err(res, 429, 'slow_down');
      rec.lastPoll = Date.now();
      if (!rec.approved) return err(res, 428, 'authorization_pending');
      const dev = addDevice(rec.email, { name: rec.device_name, platform: 'macos', kind: 'computer' });
      const t = mintTokens(rec.email, dev.id);
      delete state.userCodes[uc];
      return send(res, 200, Object.assign(t, { account: { id: state.accounts[rec.email].id, email: rec.email }, device: { id: dev.id, name: dev.name } }));
    }
    if (method === 'POST' && path === '/v1/auth/device/approve') {
      const a = authed(req, res); if (!a) return;
      const code = body.user_code;
      if (code === 'EXPD-0000') return err(res, 410, 'expired', 'That code has expired.');
      if (code === 'SLOW-0000') return err(res, 429, 'rate_limited', 'Too many tries.');
      if (code === 'NONE-0000' || !/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code || '')) return err(res, 404, 'unknown_code', 'No such code.');
      const rec = state.userCodes[code] || (state.userCodes[code] = { device_code: null, lastPoll: 0 });
      rec.approved = true; rec.email = a.email; rec.device_name = body.device_name || rec.device_name || 'Computer';
      state.lastApprove = body;
      return send(res, 204);
    }

    // ---- billing
    if (method === 'GET' && path === '/v1/me') {
      const a = authed(req, res); if (!a) return;
      const b = state.billing[a.email];
      const me = { account: { id: (state.accounts[a.email] || {}).id, email: a.email } };
      if (b) { me.entitlements = b.entitlements; me.subscription = b.subscription; } // absent = old backend
      return send(res, 200, me);
    }
    if (method === 'POST' && path === '/v1/billing/checkout') {
      const a = authed(req, res); if (!a) return;
      state.billingCalls.push({ path, body });
      if (body.product === 'inference') return err(res, 409, 'product_unavailable');
      if (body.product !== 'remote_control') return err(res, 400, 'invalid_product');
      if (state.publicSiteUrl && body.return_origin !== state.publicSiteUrl) return err(res, 400, 'bad_return_origin');
      const b = state.billing[a.email];
      if (b && b.subscription && ['trialing', 'active'].includes(b.subscription.status)) return err(res, 409, 'already_subscribed');
      return send(res, 200, { url: 'https://checkout.stripe.test/c/cs_test_1' });
    }
    if (method === 'POST' && path === '/v1/billing/portal') {
      const a = authed(req, res); if (!a) return;
      state.billingCalls.push({ path, body });
      const b = state.billing[a.email];
      if (!b || !b.subscription) return err(res, 404, 'no_customer');
      return send(res, 200, { url: 'https://billing.stripe.test/p/session_1' });
    }

    // ---- devices
    if (method === 'GET' && path === '/v1/devices') {
      const a = authed(req, res); if (!a) return;
      const list = Object.values(state.devices).filter((d) => d.email === a.email).map((d) => {
        const o = Object.assign({}, d, { this_device: d.id === a.deviceId });
        delete o.email;
        return o;
      });
      return send(res, 200, { devices: list });
    }
    const m = /^\/v1\/devices\/([^/]+)$/.exec(path);
    if (m && method === 'DELETE') {
      const a = authed(req, res); if (!a) return;
      const d = state.devices[m[1]];
      if (!d || d.email !== a.email) return err(res, 404, 'not_found');
      delete state.devices[d.id];
      for (const [k, v] of Object.entries(state.refresh)) if (v.deviceId === d.id) delete state.refresh[k];
      for (const [k, v] of Object.entries(state.access)) if (v.deviceId === d.id) delete state.access[k];
      return send(res, 204);
    }
    return err(res, 404, 'not_found');
  }

  return { handler, get state() { return state; }, addDevice };
}

module.exports = { createMock };

if (require.main === module) {
  const port = Number(process.argv[2]) || 4191;
  http.createServer(createMock().handler).listen(port, '127.0.0.1', () => {
    console.log('mock accounts API on http://127.0.0.1:' + port);
  });
}
