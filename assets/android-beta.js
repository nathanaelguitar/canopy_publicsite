/*
 * Android free-beta claim form.
 *
 * Posts the visitor's Google Play email to the canopy-founding-members Worker
 * (contract: HANDOFF-ANDROID-BETA.md). No payment is involved anywhere on this
 * page. Until the endpoint is wired, network failures degrade to a clear
 * try-again message; localhost preview modes let the states be reviewed
 * without a backend (?preview=success | full | error).
 */
(function () {
  'use strict';

  var CLAIM_ENDPOINT = 'https://founding-api.canopychat.app/v1/android-beta';
  var SUPPORT_EMAIL = 'support@canopychat.app';
  var SPOTS_TOTAL = 6;

  var STATUS_MESSAGES = {
    submitting: 'Claiming your spot…',
    invalid_email: 'Enter the email address you use with Google Play.',
    capacity_reached:
      'All ' + SPOTS_TOTAL + ' spots are claimed. Email ' + SUPPORT_EMAIL + ' to join the waitlist.',
    rate_limited: 'Too many attempts from this device. Please wait a few minutes and try again.',
    generic_error: 'We could not save that request. Please try again in a moment.',
    preview: 'Local preview mode — nothing was sent.',
  };

  function trackEvent(name, props) {
    if (typeof window.canopyMetaTrack === 'function') window.canopyMetaTrack(name, props || {});
    if (typeof window.canopyTrack === 'function') window.canopyTrack(name, props || {});
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  var form = $('[data-android-beta-form]');
  var input = $('[data-android-beta-email]');
  var submit = $('[data-android-beta-submit]');
  var status = $('[data-android-beta-status]');
  var success = $('[data-android-beta-success]');
  var busy = false;

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function setBusy(nextBusy) {
    busy = nextBusy;
    if (!submit) return;
    submit.disabled = nextBusy;
    submit.classList.toggle('is-loading', nextBusy);
  }

  function showSuccess(email, alreadyClaimed) {
    if (form && form.parentElement) form.hidden = true;
    var fullNote = $('.android-full-note');
    if (fullNote) fullNote.hidden = true;
    if (!success) return;
    success.hidden = false;
    var heading = $('[data-android-beta-success-heading]');
    var message = $('[data-android-beta-success-message]');
    if (heading) heading.textContent = alreadyClaimed ? 'You’re already on the list.' : 'You’re in.';
    if (message) {
      message.textContent =
        'Your Google Play invite will go to ' + email + '. Keep an eye out for an email from Google Play.';
    }
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function localPreviewMode() {
    try {
      var localHost =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!localHost) return null;
      return new URLSearchParams(window.location.search).get('preview');
    } catch (error) {
      return null;
    }
  }

  async function submitClaim(event) {
    event.preventDefault();
    if (busy) return;

    var email = input ? input.value.trim() : '';
    if (!isValidEmail(email)) {
      setStatus(STATUS_MESSAGES.invalid_email, true);
      if (input) input.focus();
      return;
    }

    setBusy(true);
    setStatus(STATUS_MESSAGES.submitting, false);
    trackEvent('android_beta_submitted', {});

    var response;
    try {
      response = await fetch(CLAIM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });
    } catch (networkError) {
      setBusy(false);
      setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('android_beta_claim_error', { reason: 'network_error' });
      return;
    }

    if (response.status === 409) {
      setBusy(false);
      setStatus(STATUS_MESSAGES.capacity_reached, true);
      trackEvent('android_beta_claim_error', { reason: 'capacity_reached' });
      return;
    }

    if (response.status === 429) {
      setBusy(false);
      setStatus(STATUS_MESSAGES.rate_limited, true);
      trackEvent('android_beta_claim_error', { reason: 'rate_limited' });
      return;
    }

    if (response.status === 400) {
      setBusy(false);
      setStatus(STATUS_MESSAGES.invalid_email, true);
      trackEvent('android_beta_claim_error', { reason: 'invalid_email' });
      return;
    }

    if (!response.ok) {
      setBusy(false);
      setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('android_beta_claim_error', { reason: 'http_' + response.status });
      return;
    }

    var payload = null;
    try {
      payload = await response.json();
    } catch (parseError) {
      payload = null;
    }

    setBusy(false);
    trackEvent('android_beta_claimed', {});
    showSuccess(email, Boolean(payload && payload.already_claimed));
  }

  function trackSectionViewedOnce() {
    var section = $('#claim');
    if (!section || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            trackEvent('android_beta_section_viewed', {});
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(section);
  }

  function init() {
    if (form) form.addEventListener('submit', submitClaim);

    var mode = localPreviewMode();
    if (mode === 'success') {
      showSuccess('tester@example.com', false);
      setStatus(STATUS_MESSAGES.preview, false);
    } else if (mode === 'full') {
      setStatus(STATUS_MESSAGES.capacity_reached, true);
    } else if (mode === 'error') {
      setStatus(STATUS_MESSAGES.generic_error, true);
    }

    trackSectionViewedOnce();

    // Exposed for tests.
    window.handleAndroidBetaSubmit = submitClaim;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
