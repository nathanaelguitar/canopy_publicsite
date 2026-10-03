/*
 * Sign-in and device approval for canopychat.app/link.
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

  /* ---------- helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function show(el, on) { if (el) el.hidden = !on; }

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
    } else if (context === 'remove') {
      if (err.status === 404) return 'That device is already gone. The list has been refreshed.';
    }
    return GENERIC_MESSAGE;
  }

  /* ---------- views ---------- */

  var app = $('[data-link-app]');
  var nojs = $('[data-link-nojs]');
  var notice = $('[data-link-notice]');
  var views = {
    email: $('[data-view="email"]'),
    code: $('[data-view="code"]'),
    account: $('[data-view="account"]'),
  };
  var lead = $('[data-link-lead]');
  var title = $('#link-title');
  var pendingEmail = '';
  var rawCode = (query.get('code') || '').toUpperCase().slice(0, 12);
  var pendingUserCode = normalizeUserCode(rawCode) || rawCode.slice(0, 9);

  function showView(name, focusSel) {
    Object.keys(views).forEach(function (k) { show(views[k], k === name); });
    if (lead) {
      lead.textContent = name === 'account'
        ? 'Approve the code your computer is showing, and manage the devices on your account.'
        : 'Sign in, then approve the code your computer is showing.';
    }
    var target = focusSel ? $(focusSel) : title;
    if (target) target.focus();
  }

  function setNotice(text) {
    if (!notice) return;
    notice.textContent = text || '';
    show(notice, Boolean(text));
  }

  function setError(form, input, text) {
    var el = $('[data-error]', form);
    if (el) el.textContent = text || '';
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

  /* ---------- sign in ---------- */

  var emailForm = $('[data-email-form]');
  var emailInput = $('#link-email');
  var codeForm = $('[data-code-form]');
  var codeInput = $('#link-code');

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
      $('[data-sent-to]').textContent = email;
      codeInput.value = '';
      setError(codeForm, codeInput, '');
      showView('code', '#link-code');
    }, function (err) {
      setError(emailForm, emailInput, messageFor(err, 'email'));
      emailInput.focus();
    }).then(function () { setBusy(emailForm, false); });
  });

  $('[data-back-to-email]').addEventListener('click', function () {
    showView('email', '#link-email');
  });

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
    rawRequest('POST', '/v1/auth/email/verify', {
      email: pendingEmail,
      code: code,
      device_name: deviceNameForBrowser(),
      platform: 'web',
    }).then(function (body) {
      setTokens(body);
      enterAccount();
    }, function (err) {
      setError(codeForm, codeInput, messageFor(err, 'code'));
      codeInput.focus();
    }).then(function () { setBusy(codeForm, false); });
  });

  /* ---------- signed in ---------- */

  var approveForm = $('[data-approve-form]');
  var userCodeInput = $('#link-user-code');
  var deviceNameInput = $('#link-device-name');
  var approveSuccess = $('[data-approve-success]');

  function enterAccount() {
    setNotice('');
    $('[data-account-email]').textContent = (session && session.email) || 'your account';
    show(approveForm, true);
    show(approveSuccess, false);
    if (pendingUserCode) userCodeInput.value = pendingUserCode;
    showView('account', pendingUserCode ? '#link-device-name' : '#link-user-code');
    loadDevices();
  }

  function leaveAccount(message) {
    clearLocal();
    pendingEmail = '';
    emailInput.value = '';
    showView('email', '#link-email');
    setNotice(message || '');
  }

  function expiredSession() {
    leaveAccount('Your session ended. Sign in again to continue.');
  }

  $('[data-sign-out]').addEventListener('click', function () {
    // Revoke on the server when we can, but always clear locally.
    var done = function () { leaveAccount('You are signed out.'); };
    if (!session) return done();
    authed('POST', '/v1/auth/logout', {}).then(done, done);
  });

  approveForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var userCode = normalizeUserCode(userCodeInput.value);
    if (!userCode) {
      setError(approveForm, userCodeInput, 'Enter the 8-character code from your computer, like WXYZ-1234.');
      userCodeInput.focus();
      return;
    }
    userCodeInput.value = userCode;
    setError(approveForm, userCodeInput, '');
    setBusy(approveForm, true);
    var body = { user_code: userCode };
    var name = deviceNameInput.value.trim();
    if (name) body.device_name = name;
    authed('POST', '/v1/auth/device/approve', body).then(function () {
      pendingUserCode = '';
      userCodeInput.value = '';
      deviceNameInput.value = '';
      show(approveForm, false);
      show(approveSuccess, true);
      approveSuccess.focus();
      loadDevices();
    }, function (err) {
      if (err.status === 401 || err.code === 'signed_out') return expiredSession();
      setError(approveForm, userCodeInput, messageFor(err, 'approve'));
      userCodeInput.focus();
    }).then(function () { setBusy(approveForm, false); });
  });

  $('[data-approve-another]').addEventListener('click', function () {
    show(approveSuccess, false);
    show(approveForm, true);
    userCodeInput.focus();
  });

  /* ---------- devices ---------- */

  var deviceList = $('[data-devices]');
  var devicesStatus = $('[data-devices-status]');
  var devicesError = $('[data-devices-error]');

  function loadDevices() {
    devicesError.textContent = '';
    devicesStatus.textContent = 'Loading your devices…';
    show(devicesStatus, true);
    return authed('GET', '/v1/devices').then(function (body) {
      renderDevices((body && body.devices) || []);
    }, function (err) {
      if (err.status === 401 || err.code === 'signed_out') return expiredSession();
      devicesStatus.textContent = '';
      deviceList.textContent = '';
      devicesError.textContent = 'We could not load your devices. ' + messageFor(err, 'devices');
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderDevices(devices) {
    deviceList.textContent = '';
    devicesStatus.textContent = devices.length ? '' : 'No devices yet. Approve a computer above to add one.';
    show(devicesStatus, !devices.length);
    devices.forEach(function (d) {
      var li = el('li', 'link-device');
      var info = el('div', 'link-device-info');
      var name = el('strong', 'link-device-name', d.name || 'Unnamed device');
      if (d.this_device) {
        name.appendChild(document.createTextNode(' '));
        name.appendChild(el('span', 'link-device-badge', 'This browser'));
      }
      info.appendChild(name);
      var meta = (PLATFORM_LABELS[d.platform] || d.platform || 'Device') + ' · last seen ' + relativeTime(d.last_seen_at);
      info.appendChild(el('span', 'link-device-meta', meta));
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
      btn.addEventListener('click', function () { removeDevice(d, btn); });
      li.appendChild(btn);
      deviceList.appendChild(li);
    });
  }

  function removeDevice(d, btn) {
    var label = d.name || 'this device';
    var text = d.this_device
      ? 'Remove ' + label + '? This signs you out of this browser.'
      : 'Remove ' + label + '? It will be signed out and will need a new code to come back.';
    if (!window.confirm(text)) return;
    btn.disabled = true;
    devicesError.textContent = '';
    authed('DELETE', '/v1/devices/' + encodeURIComponent(d.id)).then(function () {
      if (d.this_device) return leaveAccount('You are signed out.');
      return loadDevices();
    }, function (err) {
      if (err.status === 401 || err.code === 'signed_out') return expiredSession();
      btn.disabled = false;
      devicesError.textContent = messageFor(err, 'remove');
      if (err.status === 404) loadDevices();
    });
  }

  /* ---------- start ---------- */

  show(nojs, false);
  show(app, true);
  if (session) {
    // Confirm the stored token still works before showing the account view.
    refreshAccess().then(function () {
      enterAccount();
    }, function () {
      if (!session) {
        leaveAccount('Your session ended. Sign in again to continue.');
      } else {
        // Offline or server trouble: keep the session, offer a fresh sign-in.
        showView('email', '#link-email');
        setNotice(NETWORK_MESSAGE);
      }
    });
  } else {
    showView('email', null);
  }
})();
