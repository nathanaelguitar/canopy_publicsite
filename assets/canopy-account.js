/*
 * Shared account code for canopychat.app: /signup, /link, /account and the
 * "Create account" / "Account" nav links on every page that loads it.
 *
 * Talks to the Canopy accounts API (contract: canopy/docs/accounts-api.md).
 * The refresh token lives in localStorage under STORAGE_KEY on this origin
 * only; the access token stays in memory. No third-party scripts.
 * Use ?api=staging to point the page at the staging API for testing.
 */
(function () {
  'use strict';

  var API_BASE = 'https://founding-api.canopychat.app';
  var API_BASE_STAGING = 'https://founding-api-staging.canopychat.app';
  var STORAGE_KEY = 'canopy_account';
  var CLIENT_HEADER = 'canopy-web/1';

  var query = new URLSearchParams(window.location.search);
  var apiBase = query.get('api') === 'staging' ? API_BASE_STAGING : API_BASE;
  // Keep the staging override when moving between our own pages.
  var carry = query.get('api') === 'staging' ? '?api=staging' : '';

  /* ---------- storage and tokens ---------- */

  var session = loadSession(); // { refresh_token, email } or null
  var accessToken = null;
  var accessExpiresAt = 0;
  var refreshing = null;

  function loadSession() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.refresh_token ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function saveSession(next) {
    session = next;
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* storage blocked: the session lasts until the tab closes */ }
  }

  function clearLocal() {
    accessToken = null;
    accessExpiresAt = 0;
    saveSession(null);
  }

  function setTokens(body) {
    accessToken = body.access_token;
    accessExpiresAt = Date.parse(body.expires_at) || 0;
    saveSession({
      refresh_token: body.refresh_token,
      email: (body.account && body.account.email) || (session && session.email) || '',
    });
  }

  /* ---------- API ---------- */

  function ApiError(status, code, message) {
    this.status = status;
    this.code = code || '';
    this.message = message || '';
  }

  function rawRequest(method, path, body, token) {
    var headers = { 'X-Canopy-Client': CLIENT_HEADER };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(apiBase + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!res.ok) throw new ApiError(res.status, data && data.error, data && data.message);
        return data;
      });
    }, function () {
      throw new ApiError(0, 'network', '');
    });
  }

  function refreshAccess() {
    if (!session) return Promise.reject(new ApiError(401, 'signed_out', ''));
    if (!refreshing) {
      refreshing = rawRequest('POST', '/v1/auth/token', { refresh_token: session.refresh_token })
        .then(function (body) { setTokens(body); return accessToken; })
        .catch(function (err) {
          // Only a rejected token ends the session; a network blip keeps it.
          if (err.status === 400 || err.status === 401 || err.status === 403) clearLocal();
          throw err;
        })
        .then(function (t) { refreshing = null; return t; }, function (e) { refreshing = null; throw e; });
    }
    return refreshing;
  }

  function validAccess() {
    if (accessToken && Date.now() < accessExpiresAt - 60000) return Promise.resolve(accessToken);
    return refreshAccess();
  }

  // Authenticated call: refresh when needed, retry once on 401.
  function authed(method, path, body) {
    return validAccess().then(function (token) {
      return rawRequest(method, path, body, token).catch(function (err) {
        if (err.status !== 401) throw err;
        return refreshAccess().then(function (fresh) {
          return rawRequest(method, path, body, fresh);
        });
      });
    });
  }

  function isAuthLost(err) {
    return err && (err.status === 401 || err.code === 'signed_out');
  }

  /* ---------- helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function show(el, on) { if (el) el.hidden = !on; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function deviceNameForBrowser() {
    var ua = navigator.userAgent || '';
    var os = 'this device';
    if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua)) os = 'iPad';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X|Macintosh/.test(ua)) os = 'Mac';
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    var browser = 'Browser';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
    else if (/Firefox\/|FxiOS/.test(ua)) browser = 'Firefox';
    else if (/Chrome\/|CriOS/.test(ua)) browser = 'Chrome';
    else if (/Safari\//.test(ua)) browser = 'Safari';
    return browser + ' on ' + os;
  }

  // "wxyz 1234" -> "WXYZ-1234"; returns '' when it cannot be a code.
  function normalizeUserCode(value) {
    var s = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length !== 8) return '';
    return s.slice(0, 4) + '-' + s.slice(4);
  }

  function relativeTime(iso) {
    var t = Date.parse(iso);
    if (!t) return 'never';
    var s = Math.round((t - Date.now()) / 1000);
    var abs = Math.abs(s);
    if (abs < 60) return 'just now';
    var units = [['day', 86400], ['hour', 3600], ['minute', 60]];
    for (var i = 0; i < units.length; i++) {
      if (abs >= units[i][1]) {
        var n = Math.round(s / units[i][1]);
        if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
          return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(n, units[i][0]);
        }
        return Math.abs(n) + ' ' + units[i][0] + (Math.abs(n) === 1 ? '' : 's') + ' ago';
      }
    }
    return 'just now';
  }

  var PLATFORM_LABELS = { macos: 'Mac', ios: 'iPhone / iPad', web: 'Web browser', linux: 'Linux', windows: 'Windows' };

  /* ---------- messages ---------- */

  var NETWORK_MESSAGE = 'We could not reach CanopyChat. Check your connection and try again.';
  var GENERIC_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';
  var RATE_MESSAGE = 'Too many tries. Wait a few minutes, then try again.';

  function messageFor(err, context) {
    if (!(err instanceof ApiError)) return GENERIC_MESSAGE;
    if (err.code === 'network' || err.status === 0) return NETWORK_MESSAGE;
    if (err.status === 429 || err.code === 'rate_limited' || err.code === 'slow_down') return RATE_MESSAGE;
    if (context === 'email') {
      if (err.status === 400) return 'That does not look like an email address. Check it and try again.';
    } else if (context === 'code') {
      if (err.code === 'expired' || err.status === 410) return 'That code has expired. Go back and ask for a new one.';
      if (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 404) {
        return 'That code is not right. Check the 6 digits in your email, or go back and ask for a new one.';
      }
    } else if (context === 'approve') {
      if (err.code === 'expired' || err.status === 410) {
        return 'That code has expired. Run canopy sign-in on your computer again to get a new one.';
      }
      if (err.status === 404 || err.status === 400 || err.code === 'unknown_code' || err.code === 'not_found' || err.code === 'invalid_code') {
        return 'We do not know that code. Check it against your computer, or run canopy sign-in again.';
      }
    } else if (context === 'billing') {
      if (err.code === 'already_subscribed' || err.status === 409) return 'You already have a subscription. Use Manage billing to change it.';
    } else if (context === 'remove') {
      if (err.status === 404) return 'That device is already gone. The list has been refreshed.';
    }
    return GENERIC_MESSAGE;
  }

  /* ---------- form helpers ---------- */

  function setError(form, input, text) {
    var e = $('[data-error]', form);
    if (e) e.textContent = text || '';
    if (input) {
      if (text) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function setBusy(form, busy) {
    var btn = $('button[type="submit"]', form);
    if (!btn) return;
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function setNotice(text) {
    var n = $('[data-link-notice]');
    if (!n) return;
    n.textContent = text || '';
    show(n, Boolean(text));
  }

  /* ---------- sign-in flow (email, then 6-digit code) ---------- */

  // root contains [data-view="email"] and [data-view="code"] with the forms.
  // onSignedIn(body) runs after a successful verify. Returns { showEmail }.
  function bindSignIn(root, onSignedIn) {
    var emailView = $('[data-view="email"]', root);
    var codeView = $('[data-view="code"]', root);
    var emailForm = $('[data-email-form]', root);
    var emailInput = $('input[name="email"]', emailForm);
    var codeForm = $('[data-code-form]', root);
    var codeInput = $('input[name="code"]', codeForm);
    var pendingEmail = '';

    function showEmail(focus) {
      show(emailView, true);
      show(codeView, false);
      if (focus) emailInput.focus();
    }

    emailForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = emailInput.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(emailForm, emailInput, 'Enter your email address, like you@example.com.');
        emailInput.focus();
        return;
      }
      setError(emailForm, emailInput, '');
      setNotice('');
      setBusy(emailForm, true);
      rawRequest('POST', '/v1/auth/email/start', { email: email }).then(function () {
        pendingEmail = email;
        $('[data-sent-to]', root).textContent = email;
        codeInput.value = '';
        setError(codeForm, codeInput, '');
        show(emailView, false);
        show(codeView, true);
        codeInput.focus();
      }, function (err) {
        setError(emailForm, emailInput, messageFor(err, 'email'));
        emailInput.focus();
      }).then(function () { setBusy(emailForm, false); });
    });

    $('[data-back-to-email]', root).addEventListener('click', function () { showEmail(true); });

    codeForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var code = codeInput.value.replace(/\s/g, '');
      if (!/^\d{6}$/.test(code)) {
        setError(codeForm, codeInput, 'Enter the 6 digits from your email.');
        codeInput.focus();
        return;
      }
      setError(codeForm, codeInput, '');
      setBusy(codeForm, true);
      // For a new email the backend creates the account on first verify.
      rawRequest('POST', '/v1/auth/email/verify', {
        email: pendingEmail,
        code: code,
        device_name: deviceNameForBrowser(),
        platform: 'web',
      }).then(function (body) {
        setTokens(body);
        onSignedIn(body);
      }, function (err) {
        setError(codeForm, codeInput, messageFor(err, 'code'));
        codeInput.focus();
      }).then(function () { setBusy(codeForm, false); });
    });

    return { showEmail: showEmail };
  }

  /* ---------- sign out, session check ---------- */

  // Revokes this browser on the server when it can, always clears locally.
  function signOut() {
    var done = function () { clearLocal(); };
    if (!session) return Promise.resolve();
    return authed('POST', '/v1/auth/logout', {}).then(done, done);
  }

  // Resolves 'in' (token works), 'out' (no or rejected session) or 'unknown'
  // (offline: a session exists but could not be checked).
  function checkSession() {
    if (!session) return Promise.resolve('out');
    return refreshAccess().then(function () { return 'in'; }, function () {
      return session ? 'unknown' : 'out';
    });
  }

  function go(path) {
    window.location.replace(path + carry);
  }

  /* ---------- devices list ---------- */

  function bindDevices(root, onSessionLost, onSelfRemoved) {
    var list = $('[data-devices]', root);
    var status = $('[data-devices-status]', root);
    var errBox = $('[data-devices-error]', root);

    function render(devices) {
      list.textContent = '';
      status.textContent = devices.length ? '' : 'No devices yet. Approve a computer to add one.';
      show(status, !devices.length);
      devices.forEach(function (d) {
        var li = el('li', 'link-device');
        var info = el('div', 'link-device-info');
        var name = el('strong', 'link-device-name', d.name || 'Unnamed device');
        if (d.this_device) {
          name.appendChild(document.createTextNode(' '));
          name.appendChild(el('span', 'link-device-badge', 'This browser'));
        }
        info.appendChild(name);
        info.appendChild(el('span', 'link-device-meta',
          (PLATFORM_LABELS[d.platform] || d.platform || 'Device') + ' · last seen ' + relativeTime(d.last_seen_at)));
        if (d.fingerprint) {
          var fp = el('span', 'link-device-fp');
          fp.appendChild(document.createTextNode('Match code '));
          fp.appendChild(el('b', null, d.fingerprint));
          info.appendChild(fp);
        }
        li.appendChild(info);
        var btn = el('button', 'link-remove', 'Remove');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Remove ' + (d.name || 'device'));
        btn.addEventListener('click', function () { remove(d, btn); });
        li.appendChild(btn);
        list.appendChild(li);
      });
    }

    function load() {
      errBox.textContent = '';
      status.textContent = 'Loading your devices…';
      show(status, true);
      return authed('GET', '/v1/devices').then(function (body) {
        render((body && body.devices) || []);
      }, function (err) {
        if (isAuthLost(err)) return onSessionLost();
        status.textContent = '';
        list.textContent = '';
        errBox.textContent = 'We could not load your devices. ' + messageFor(err, 'devices');
      });
    }

    function remove(d, btn) {
      var label = d.name || 'this device';
      var text = d.this_device
        ? 'Remove ' + label + '? This signs you out of this browser.'
        : 'Remove ' + label + '? It will be signed out and will need a new code to come back.';
      if (!window.confirm(text)) return;
      btn.disabled = true;
      errBox.textContent = '';
      authed('DELETE', '/v1/devices/' + encodeURIComponent(d.id)).then(function () {
        if (d.this_device) { clearLocal(); return onSelfRemoved(); }
        return load();
      }, function (err) {
        if (isAuthLost(err)) return onSessionLost();
        btn.disabled = false;
        errBox.textContent = messageFor(err, 'remove');
        if (err.status === 404) load();
      });
    }

    return { load: load };
  }

  /* ---------- billing: the Remote control card on /account ---------- */

  function formatDate(iso) {
    var t = Date.parse(iso);
    if (!t) return '';
    try {
      return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return new Date(t).toDateString();
    }
  }

  // Which state the card is in, from GET /v1/me. Tolerates old backends that
  // send neither field (treated as "none").
  function billingState(me) {
    var ents = (me && me.entitlements) || [];
    var sub = (me && me.subscription) || null;
    var has = ents.indexOf('remote_control') !== -1;
    if (sub && (sub.status === 'trialing' || sub.status === 'active')) return 'subscribed';
    if (sub && sub.status === 'past_due') return 'past_due';
    if (has && !sub) return 'included';
    if (has) return 'subscribed';
    return 'none';
  }

  function bindBilling(root, onSessionLost) {
    var status = $('[data-billing-status]', root);
    var detail = $('[data-billing-detail]', root);
    var warning = $('[data-billing-warning]', root);
    var errBox = $('[data-billing-error]', root);
    var trialBtn = $('[data-billing-trial]', root);
    var manageBtn = $('[data-billing-manage]', root);

    function render(me) {
      var state = billingState(me);
      var sub = (me && me.subscription) || null;
      var detailText = '';
      var statusText = '';
      var warn = '';
      if (state === 'included') {
        statusText = 'Included with your account';
      } else if (state === 'subscribed' || state === 'past_due') {
        var trialing = sub && sub.status === 'trialing';
        statusText = trialing ? 'Free trial' : (state === 'past_due' ? 'Payment past due' : 'Active');
        if (sub && sub.cancel_at_period_end) {
          var endOn = formatDate(sub.current_period_end);
          detailText = endOn ? 'Ends on ' + endOn + '. It will not renew.' : 'It will not renew.';
        } else if (trialing) {
          var tEnd = formatDate(sub.trial_end || sub.current_period_end);
          detailText = tEnd ? 'Your trial ends on ' + tEnd + ', then $5/month.' : 'Then $5/month.';
        } else if (sub) {
          var renew = formatDate(sub.current_period_end);
          if (renew) detailText = 'Renews on ' + renew + ' ($5/month).';
        }
        if (state === 'past_due') {
          warn = 'We could not charge your card. Update your payment method to keep remote control working.';
        }
      } else {
        statusText = 'Control your computer from your phone. 7-day free trial, then $5/month.';
      }
      status.textContent = statusText;
      status.className = state === 'none' ? 'link-hint' : 'link-billing-state';
      status.setAttribute('data-billing-state', state);
      show(status, true);
      detail.textContent = detailText;
      show(detail, Boolean(detailText));
      warning.textContent = warn;
      show(warning, Boolean(warn));
      show(trialBtn, state === 'none');
      show(manageBtn, state === 'subscribed' || state === 'past_due');
    }

    function load() {
      errBox.textContent = '';
      return authed('GET', '/v1/me').then(function (me) {
        render(me || {});
        return me || {};
      }, function (err) {
        if (isAuthLost(err)) { onSessionLost(); return null; }
        show(trialBtn, false);
        show(manageBtn, false);
        status.textContent = '';
        errBox.textContent = 'We could not load your plan. ' + messageFor(err, 'billing');
        return null;
      });
    }

    function redirectTo(path, body, btn) {
      errBox.textContent = '';
      btn.disabled = true;
      btn.classList.add('is-loading');
      authed('POST', path, body).then(function (res) {
        if (res && typeof res.url === 'string' && /^https:\/\//.test(res.url)) {
          window.location.assign(res.url);
          return;
        }
        throw new ApiError(500, 'bad_response', '');
      }).catch(function (err) {
        if (isAuthLost(err)) return onSessionLost();
        btn.disabled = false;
        btn.classList.remove('is-loading');
        errBox.textContent = messageFor(err, 'billing');
        if (err.status === 409) load();
      });
    }

    trialBtn.addEventListener('click', function () {
      redirectTo('/v1/billing/checkout', { product: 'remote_control', return_origin: window.location.origin }, trialBtn);
    });
    manageBtn.addEventListener('click', function () {
      redirectTo('/v1/billing/portal', {}, manageBtn);
    });

    return { load: load, billingState: billingState };
  }

  /* ---------- nav: "Create account" becomes "Account" when signed in ---------- */

  function updateNav() {
    var links = document.querySelectorAll('[data-account-nav]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var signedIn = Boolean(session);
      a.textContent = signedIn ? 'Account' : a.getAttribute('data-label-out') || 'Create account';
      a.setAttribute('href', (signedIn ? '/account' : '/signup') + carry);
    }
  }

  updateNav();

  window.CanopyAccount = {
    $: $, show: show, el: el, query: query,
    getSession: function () { return session; },
    checkSession: checkSession, signOut: signOut, clearLocal: clearLocal, authed: authed,
    bindSignIn: bindSignIn, bindDevices: bindDevices, bindBilling: bindBilling,
    setError: setError, setBusy: setBusy, setNotice: setNotice,
    messageFor: messageFor, isAuthLost: isAuthLost,
    normalizeUserCode: normalizeUserCode, go: go, carry: carry,
    NETWORK_MESSAGE: NETWORK_MESSAGE, updateNav: updateNav,
  };
})();
