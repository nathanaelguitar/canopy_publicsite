/*
 * Founding Member beta access router.
 *
 * Stripe's session_id is exchanged only with the Worker, which verifies the
 * paid D1 record before minting a short-lived signed member-access token.
 * Platform mutations never trust a member id or payment claim from the page.
 */
(function () {
  'use strict';

  var API_ROOT = 'https://founding-api.canopychat.app/v1';
  var TOKEN_KEY = 'canopychat_founding_member_access_token';
  var accessState = null;
  var accessToken = null;

  function trackEvent(name, props) {
    if (typeof window.canopyMetaTrack === 'function') window.canopyMetaTrack(name, props || {});
    if (typeof window.canopyTrack === 'function') window.canopyTrack(name, props || {});
  }

  function trackPurchaseOnce(sessionId) {
    var key = 'canopychat_purchase_tracked_' + sessionId;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch (error) {}
    trackEvent('Purchase', {});
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function setHidden(selector, hidden) {
    var element = $(selector);
    if (element) element.hidden = hidden;
  }

  function cleanUrl() {
    var params = new URLSearchParams(window.location.search);
    params.delete('session_id');
    params.delete('access_token');
    var newSearch = params.toString();
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash,
    );
  }

  function loadStoredToken() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  function storeToken(token) {
    accessToken = token;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {}
  }

  function clearToken() {
    accessToken = null;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (error) {}
  }

  function setLoading(loading) {
    setHidden('[data-founding-success-loading]', !loading);
  }

  function showRecovery() {
    setLoading(false);
    setHidden('[data-founding-success-error]', true);
    setHidden('[data-access-selection]', true);
    setHidden('[data-access-panel="ios"]', true);
    setHidden('[data-access-panel="android"]', true);
    setHidden('[data-access-recovery]', false);
  }

  function showError(heading, message, includeRecovery) {
    setLoading(false);
    setHidden('[data-access-selection]', true);
    setHidden('[data-access-panel="ios"]', true);
    setHidden('[data-access-panel="android"]', true);
    setHidden('[data-access-recovery]', !includeRecovery);
    setHidden('[data-founding-success-error]', false);
    var headingElement = $('[data-founding-success-heading]');
    var messageElement = $('[data-founding-success-message]');
    if (headingElement) headingElement.textContent = heading;
    if (messageElement) messageElement.textContent = message;
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + accessToken,
    };
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function renderSelection(access) {
    accessState = access;
    setLoading(false);
    setHidden('[data-founding-success-error]', true);
    setHidden('[data-access-recovery]', true);
    setHidden('[data-access-selection]', false);
    setHidden('[data-access-panel="ios"]', true);
    setHidden('[data-access-panel="android"]', true);

    var platforms = Array.isArray(access.platforms) ? access.platforms : [];
    var devicePlatform = /Android/i.test(navigator.userAgent)
      ? 'android'
      : /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? 'ios'
        : null;
    all('[data-device-hint]').forEach(function (hint) {
      hint.hidden = hint.getAttribute('data-device-hint') !== devicePlatform;
    });
    all('[data-platform-status]').forEach(function (status) {
      var platform = status.getAttribute('data-platform-status');
      var alreadySelected = platforms.indexOf(platform) !== -1;
      status.textContent = alreadySelected
        ? platform === 'ios' ? 'Ready' : (access.android_provisioning_status === 'approved' || access.android_provisioning_status === 'granted' ? 'Access ready' : 'Requested')
        : '';
      status.hidden = !alreadySelected;
    });

    var iosLink = $('[data-testflight-link]');
    var iosNote = $('[data-testflight-note]');
    if (iosLink && access.testflight_url) {
      iosLink.href = access.testflight_url;
      iosLink.hidden = false;
    } else if (iosLink) {
      iosLink.hidden = true;
    }
    if (iosNote) {
      iosNote.textContent = access.testflight_code
        ? 'If TestFlight asks for a code, use ' + access.testflight_code + '.'
        : 'Open this link on your iPhone or iPad to continue in TestFlight.';
    }

    var androidEmail = $('[data-android-email]');
    if (androidEmail && !androidEmail.value) androidEmail.value = access.stripe_email || '';
  }

  function showAndroidResult(access) {
    var form = $('[data-android-form]');
    var success = $('[data-android-success]');
    var heading = $('[data-android-success-heading]');
    var message = $('[data-android-success-message]');
    var playLink = $('[data-play-store-link]');
    var ready = access.android_provisioning_status === 'approved' || access.android_provisioning_status === 'granted';
    if (form) form.hidden = true;
    if (success) success.hidden = false;
    if (heading) heading.textContent = ready ? 'Your Google Play beta access is ready.' : 'You’re on the Android beta list.';
    if (message) {
      message.textContent = ready
        ? 'Open Google Play to install CanopyChat.'
        : 'We’ve got your Google Play account. We’ll use it to grant access to the closed Android beta.';
    }
    if (playLink && access.android_play_store_url) {
      playLink.href = access.android_play_store_url;
      playLink.hidden = false;
    }
  }

  function selectPlatform(platform) {
    if (!accessState) return;
    setHidden('[data-access-selection]', true);
    setHidden('[data-access-panel="ios"]', platform !== 'ios');
    setHidden('[data-access-panel="android"]', platform !== 'android');
    trackEvent('beta_platform_selected', { platform: platform });
    if (platform === 'android') {
      trackEvent('android_beta_accessed', {});
      var platforms = Array.isArray(accessState.platforms) ? accessState.platforms : [];
      if (platforms.indexOf('android') !== -1) showAndroidResult(accessState);
      else {
        var form = $('[data-android-form]');
        var success = $('[data-android-success]');
        if (form) form.hidden = false;
        if (success) success.hidden = true;
      }
    }
  }

  async function submitAndroid(event) {
    event.preventDefault();
    var form = $('[data-android-form]');
    var input = $('[data-android-email]');
    var submit = $('[data-android-submit]');
    var status = $('[data-android-status]');
    var email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      if (input) input.focus();
      if (status) status.textContent = 'Enter the Google account email you use with Google Play.';
      return;
    }
    if (submit) submit.disabled = true;
    if (status) status.textContent = 'Saving your Google Play account…';
    var response;
    try {
      response = await fetch(API_ROOT + '/beta-access', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ platform: 'android', android_google_play_email: email }),
      });
    } catch (error) {
      if (status) status.textContent = 'We could not save that request. Please try again.';
      if (submit) submit.disabled = false;
      return;
    }
    if (response.status === 401) {
      clearToken();
      showRecovery();
      return;
    }
    if (!response.ok) {
      if (status) status.textContent = response.status === 400
        ? 'Enter a valid Google Play email address.'
        : 'We could not save that request. Please try again.';
      if (submit) submit.disabled = false;
      return;
    }
    var body = await response.json();
    accessState = body.access;
    trackEvent('android_beta_requested', { provisioning: body.provisioning || 'pending_manual' });
    showAndroidResult(accessState);
  }

  async function loadAccess() {
    if (!accessToken) {
      showRecovery();
      return;
    }
    var response;
    try {
      response = await fetch(API_ROOT + '/beta-access', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + accessToken },
        credentials: 'omit',
      });
    } catch (error) {
      showError('We could not load your beta access', 'Please try again, or request a new access link by email.', true);
      return;
    }
    if (response.status === 401) {
      clearToken();
      showRecovery();
      return;
    }
    if (!response.ok) {
      showError('We could not load your beta access', 'Please try again, or request a new access link by email.', true);
      return;
    }
    var body = await response.json();
    renderSelection(body.access);
  }

  async function handleSession(sessionId, attempt) {
    var response;
    try {
      response = await fetch(API_ROOT + '/checkout-session?session_id=' + encodeURIComponent(sessionId), {
        credentials: 'omit',
      });
    } catch (error) {
      showError('We could not confirm your payment', 'If you were charged, Stripe still has the payment record. We will verify it manually if you contact support.', true);
      return;
    }
    if (!response.ok) {
      showError('We could not confirm your payment', 'If you were charged, contact support and we will verify it manually.', true);
      return;
    }
    var body = await response.json();
    if (body.status === 'confirmed' && body.member_access_token && body.access) {
      storeToken(body.member_access_token);
      trackPurchaseOnce(sessionId);
      trackEvent('founding_member_payment_success', {});
      renderSelection(body.access);
      return;
    }
    if (body.status === 'processing') {
      if (attempt < 5) {
        window.setTimeout(function () {
          handleSession(sessionId, attempt + 1);
        }, 2000);
        return;
      }
      showError('Almost there', 'Your payment is still processing. You do not need to keep this page open; we will also email your secure beta access link.', false);
      return;
    }
    if (body.status === 'needs_review') {
      showError('Payment received — review in progress', 'You do not need to pay again. We will follow up by email, or you can contact support.', true);
      return;
    }
    showError('We could not confirm your payment', 'If you were charged, contact support and we will verify it manually.', true);
  }

  async function submitRecovery(event) {
    event.preventDefault();
    var input = $('[data-recovery-email]');
    var submit = $('[data-recovery-submit]');
    var status = $('[data-recovery-status]');
    var email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      if (input) input.focus();
      if (status) status.textContent = 'Enter a valid email address.';
      return;
    }
    if (submit) submit.disabled = true;
    if (status) status.textContent = 'Checking your Founding Member access…';
    try {
      await fetch(API_ROOT + '/beta-access/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
      if (status) status.textContent = 'If that email belongs to a Founding Member, we sent an access link.';
    } catch (error) {
      if (status) status.textContent = 'We could not send the link. Please try again.';
      if (submit) submit.disabled = false;
    }
  }

  function localPreviewAccess() {
    var params = new URLSearchParams(window.location.search);
    var localHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!localHost || params.get('preview') !== 'paid') return null;
    return {
      stripe_email: 'founding-member@example.com',
      platforms: [],
      testflight_url: 'https://testflight.apple.com/join/preview',
      testflight_code: 'CANOPY-TEST',
      android_google_play_email: null,
      android_provisioning_status: 'not_requested',
      android_access_requested_at: null,
      android_access_granted_at: null,
      android_play_store_url: null,
    };
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var incomingToken = params.get('access_token');
    var sessionId = params.get('session_id');
    if (incomingToken) storeToken(incomingToken);
    accessToken = accessToken || loadStoredToken();
    cleanUrl();

    var androidForm = $('[data-android-form]');
    var recoveryForm = $('[data-recovery-form]');
    if (androidForm) androidForm.addEventListener('submit', submitAndroid);
    if (recoveryForm) recoveryForm.addEventListener('submit', submitRecovery);
    all('[data-platform-choice]').forEach(function (choice) {
      choice.addEventListener('click', function () {
        selectPlatform(choice.getAttribute('data-platform-choice'));
      });
    });
    all('[data-access-back], [data-access-other]').forEach(function (button) {
      button.addEventListener('click', function () {
        renderSelection(accessState);
      });
    });

    var previewAccess = localPreviewAccess();
    if (previewAccess) {
      renderSelection(previewAccess);
      return;
    }

    var iosLink = $('[data-testflight-link]');
    if (iosLink) iosLink.addEventListener('click', function () {
      trackEvent('ios_testflight_clicked', {});
    });

    if (sessionId) {
      handleSession(sessionId, 0);
    } else if (accessToken) {
      loadAccess();
    } else {
      showRecovery();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
