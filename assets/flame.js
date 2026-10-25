/*
 * Flame waitlist and optional contribution.
 *
 * The waitlist posts an email to the canopy-founding-members Worker
 * (POST /v1/flame/waitlist). The Worker answers the same 200 for a new or an
 * already-listed address, so this page never learns who else signed up.
 *
 * The contribution creates a Stripe Checkout Session on the same Worker
 * (POST /v1/flame/contribute) and redirects to Stripe-hosted Checkout. It is
 * separate from the waitlist: it never changes invite order. No card form or
 * Stripe.js is loaded here; payment details only touch checkout.stripe.com.
 */
(function () {
  'use strict';

  var API_ORIGIN = 'https://founding-api.canopychat.app';
  var WAITLIST_ENDPOINT = API_ORIGIN + '/v1/flame/waitlist';
  var CONTRIBUTE_ENDPOINT = API_ORIGIN + '/v1/flame/contribute';
  var MIN_DOLLARS = 10;

  var MESSAGES = {
    joining: 'Adding you to the list…',
    invalid_email: 'Enter a valid email address.',
    rate_limited: 'Too many attempts from this device. Please wait a few minutes and try again.',
    waitlist_error: 'We could not save that. Please try again in a moment.',
    opening_checkout: 'Opening secure checkout…',
    invalid_amount: 'Choose a contribution of at least $10 in whole dollars.',
    checkout_unavailable: 'Checkout is temporarily unavailable. Please try again shortly.',
    checkout_error: 'Something went wrong starting checkout. Please try again.',
    thanks: 'Thank you. Your contribution went through, and it goes straight into building Flame.',
    cancelled: 'Your contribution was not completed. Nothing was charged.',
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

  function setStatus(node, message, isError) {
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(isError));
  }

  function setBusy(button, busy) {
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle('is-loading', busy);
    if (busy) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  }

  async function postJson(url, body) {
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    var payload = null;
    try {
      payload = await response.json();
    } catch (parseError) {
      payload = null;
    }
    return { status: response.status, ok: response.ok, payload: payload || {} };
  }

  /* ---------- Waitlist ---------- */

  var form = $('[data-flame-waitlist-form]');
  var emailInput = $('[data-flame-email]');
  var joinButton = $('[data-flame-waitlist-submit]');
  var joinStatus = $('[data-flame-waitlist-status]');
  var joinSuccess = $('[data-flame-waitlist-success]');
  var joining = false;

  function showJoined(email) {
    if (form) form.hidden = true;
    if (!joinSuccess) return;
    var message = $('[data-flame-waitlist-success-message]');
    if (message) {
      message.textContent = 'Your invite will go to ' + email + '. We send them in small groups, so it may take a little while.';
    }
    joinSuccess.hidden = false;
    joinSuccess.focus({ preventScroll: true });
  }

  async function submitWaitlist(event) {
    event.preventDefault();
    if (joining) return;

    var email = emailInput ? emailInput.value.trim() : '';
    if (!isValidEmail(email)) {
      setStatus(joinStatus, MESSAGES.invalid_email, true);
      if (emailInput) emailInput.focus();
      return;
    }

    joining = true;
    setBusy(joinButton, true);
    setStatus(joinStatus, MESSAGES.joining, false);

    var result;
    try {
      result = await postJson(WAITLIST_ENDPOINT, { email: email });
    } catch (networkError) {
      result = null;
    }
    joining = false;
    setBusy(joinButton, false);

    if (!result) {
      setStatus(joinStatus, MESSAGES.waitlist_error, true);
      trackEvent('flame_waitlist_error', { reason: 'network_error' });
      return;
    }
    if (result.status === 429) {
      setStatus(joinStatus, MESSAGES.rate_limited, true);
      trackEvent('flame_waitlist_error', { reason: 'rate_limited' });
      return;
    }
    if (result.status === 400) {
      setStatus(joinStatus, MESSAGES.invalid_email, true);
      trackEvent('flame_waitlist_error', { reason: 'invalid_email' });
      return;
    }
    if (!result.ok) {
      setStatus(joinStatus, MESSAGES.waitlist_error, true);
      trackEvent('flame_waitlist_error', { reason: 'http_' + result.status });
      return;
    }

    setStatus(joinStatus, '', false);
    trackEvent('Lead', { content_name: 'flame_waitlist' });
    showJoined(email);
  }

  /* ---------- Contribution ---------- */

  var amountChoices = document.querySelectorAll('[data-flame-amount-cents]');
  var customAmount = $('[data-flame-custom-amount]');
  var contributeButton = $('[data-flame-contribute-cta]');
  var contributeStatus = $('[data-flame-contribute-status]');
  var selectedCents = 2500;
  var contributing = false;

  function markSelected(cents) {
    Array.prototype.forEach.call(amountChoices, function (choice) {
      var isSelected = Number(choice.getAttribute('data-flame-amount-cents')) === cents;
      choice.setAttribute('aria-pressed', String(isSelected));
      choice.classList.toggle('is-selected', isSelected);
    });
  }

  /* Returns whole-dollar cents, or null when the custom field holds an invalid amount. */
  function currentAmountCents() {
    var raw = customAmount ? customAmount.value.trim() : '';
    if (!raw) return selectedCents;
    var dollars = Number(raw);
    return Number.isSafeInteger(dollars) && dollars >= MIN_DOLLARS ? dollars * 100 : null;
  }

  function updateContributeLabel() {
    if (!contributeButton) return;
    var cents = currentAmountCents();
    contributeButton.textContent =
      cents === null ? 'Contribute securely' : 'Contribute $' + Math.round(cents / 100) + ' securely';
  }

  async function startContribution() {
    if (contributing) return;

    var cents = currentAmountCents();
    if (cents === null) {
      setStatus(contributeStatus, MESSAGES.invalid_amount, true);
      if (customAmount) customAmount.focus();
      return;
    }

    // Reuse the waitlist email when the visitor typed one, so the contribution
    // lands on the same row. It is optional; Stripe asks for an email anyway.
    var body = { amount_cents: cents };
    var email = emailInput ? emailInput.value.trim() : '';
    if (isValidEmail(email)) body.email = email;

    contributing = true;
    setBusy(contributeButton, true);
    setStatus(contributeStatus, MESSAGES.opening_checkout, false);
    trackEvent('InitiateCheckout', { value: cents / 100, currency: 'USD', content_name: 'flame_contribution' });

    var result;
    try {
      result = await postJson(CONTRIBUTE_ENDPOINT, body);
    } catch (networkError) {
      result = null;
    }

    if (result && result.ok && typeof result.payload.url === 'string' &&
        result.payload.url.indexOf('https://checkout.stripe.com/') === 0) {
      window.location.assign(result.payload.url);
      return;
    }

    contributing = false;
    setBusy(contributeButton, false);
    var error = result && result.payload && result.payload.error;
    var message = MESSAGES.checkout_error;
    if (result && result.status === 429) message = MESSAGES.rate_limited;
    else if (error === 'invalid_amount') message = MESSAGES.invalid_amount;
    else if (error === 'invalid_email') message = MESSAGES.invalid_email;
    else if (error === 'service_misconfigured' || error === 'checkout_unavailable') message = MESSAGES.checkout_unavailable;
    setStatus(contributeStatus, message, true);
    trackEvent('flame_contribution_error', { reason: error || (result ? 'http_' + result.status : 'network_error') });
  }

  function showReturnState() {
    var state = null;
    try {
      state = new URLSearchParams(window.location.search).get('contribution');
    } catch (error) {
      state = null;
    }
    if (state !== 'thanks' && state !== 'cancelled') return;
    setStatus(contributeStatus, MESSAGES[state], false);
    if (state === 'thanks') trackEvent('flame_contribution_returned', {});
    var section = $('#contribute');
    if (section) section.scrollIntoView({ block: 'center' });
  }

  function init() {
    if (form) form.addEventListener('submit', submitWaitlist);

    Array.prototype.forEach.call(amountChoices, function (choice) {
      choice.addEventListener('click', function () {
        selectedCents = Number(choice.getAttribute('data-flame-amount-cents'));
        if (customAmount) customAmount.value = '';
        markSelected(selectedCents);
        setStatus(contributeStatus, '', false);
        updateContributeLabel();
      });
    });
    if (customAmount) {
      customAmount.addEventListener('input', function () {
        markSelected(customAmount.value.trim() ? -1 : selectedCents);
        updateContributeLabel();
      });
    }
    if (contributeButton) contributeButton.addEventListener('click', startContribution);

    updateContributeLabel();
    showReturnState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
