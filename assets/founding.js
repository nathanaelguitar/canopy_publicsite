/*
 * Founding Member CTA behavior: creates a Stripe Checkout Session on the
 * canopy-founding-members Worker and redirects to Stripe-hosted Checkout.
 * No card form, no Stripe.js, no payment details ever touch this page —
 * Stripe collects those on checkout.stripe.com.
 */
(function () {
  'use strict';

  var CHECKOUT_ENDPOINT = 'https://founding-api.canopychat.app/v1/checkout';
  var SUPPORT_EMAIL = 'support@canopychat.app';
  var MIN_AMOUNT_CENTS = 1000;

  var STATUS_MESSAGES = {
    starting: 'Opening secure checkout…',
    capacity_reached:
      'This enrollment group is full. Email ' + SUPPORT_EMAIL + ' to join the waitlist for the next opening.',
    rate_limited: 'Too many attempts from this device. Please wait a few minutes and try again.',
    country_not_supported:
      'Founding Member beta enrollment is currently available in the United States.',
    misconfigured: 'Checkout is temporarily unavailable. Please try again shortly.',
    invalid_amount: 'Choose a contribution of at least $10 in whole dollars.',
    generic_error: 'Something went wrong starting checkout. Please try again.',
    cancelled: 'Your payment was not completed. You can return whenever you are ready.',
  };

  /*
   * No analytics provider is installed on this site, so this is a no-op
   * unless something else on the page defines window.canopyTrack.
   */
  function trackEvent(name, props) {
    if (typeof window.canopyMetaTrack === 'function') window.canopyMetaTrack(name, props || {});
    if (typeof window.canopyTrack === 'function') {
      window.canopyTrack(name, props || {});
    }
  }

  function FoundingMemberCTA(root) {
    this.root = root;
    this.button = root.querySelector('[data-founding-member-cta]');
    this.status = root.querySelector('[data-founding-member-status]');
    this.amountChoices = root.querySelectorAll('[data-founding-amount-cents]');
    this.customAmount = root.querySelector('[data-founding-custom-amount]');
    this.amountCents = 2500;
    this.busy = false;
  }

  FoundingMemberCTA.prototype.connect = function () {
    var component = this;
    if (!component.button) return;
    Array.prototype.forEach.call(component.amountChoices, function (choice) {
      choice.addEventListener('click', function () {
        component.setAmount(Number(choice.getAttribute('data-founding-amount-cents')));
        if (component.customAmount) component.customAmount.value = '';
      });
    });
    if (component.customAmount) {
      component.customAmount.addEventListener('input', function () {
        component.setCustomAmountState();
      });
    }
    component.button.addEventListener('click', function () {
      handleFoundingMemberCheckout(component);
    });
    component.updateButtonLabel();
  };

  FoundingMemberCTA.prototype.setAmount = function (amountCents) {
    if (!Number.isSafeInteger(amountCents) || amountCents < MIN_AMOUNT_CENTS) return;
    this.amountCents = amountCents;
    Array.prototype.forEach.call(this.amountChoices, function (choice) {
      var isSelected = Number(choice.getAttribute('data-founding-amount-cents')) === amountCents;
      choice.setAttribute('aria-pressed', String(isSelected));
      choice.classList.toggle('is-selected', isSelected);
    });
    this.updateButtonLabel();
  };

  FoundingMemberCTA.prototype.setCustomAmountState = function () {
    var raw = this.customAmount ? this.customAmount.value.trim() : '';
    if (!raw) {
      this.updateButtonLabel();
      return;
    }
    var dollars = Number(raw);
    if (Number.isSafeInteger(dollars) && dollars >= 10) {
      this.setAmount(dollars * 100);
    } else {
      Array.prototype.forEach.call(this.amountChoices, function (choice) {
        choice.setAttribute('aria-pressed', 'false');
        choice.classList.remove('is-selected');
      });
      this.updateButtonLabel();
    }
  };

  FoundingMemberCTA.prototype.getAmountCents = function () {
    var raw = this.customAmount ? this.customAmount.value.trim() : '';
    if (raw) {
      var dollars = Number(raw);
      return Number.isSafeInteger(dollars) && dollars >= 10 ? dollars * 100 : null;
    }
    return this.amountCents;
  };

  FoundingMemberCTA.prototype.updateButtonLabel = function () {
    if (!this.button) return;
    var dollars = Math.round(this.amountCents / 100);
    this.button.textContent = 'Continue securely with $' + dollars;
  };

  FoundingMemberCTA.prototype.setStatus = function (message, isError) {
    if (!this.status) return;
    this.status.textContent = message || '';
    this.status.classList.toggle('is-error', Boolean(isError));
  };

  FoundingMemberCTA.prototype.setBusy = function (busy) {
    this.busy = busy;
    if (!this.button) return;
    this.button.disabled = busy;
    this.button.classList.toggle('is-loading', busy);
  };

  async function handleFoundingMemberCheckout(component) {
    if (component.busy) return; // guards against double-submission on rapid clicks

    var amountCents = component.getAmountCents();
    if (!Number.isSafeInteger(amountCents) || amountCents < MIN_AMOUNT_CENTS) {
      component.setStatus(STATUS_MESSAGES.invalid_amount, true);
      if (component.customAmount) component.customAmount.focus();
      return;
    }

    component.setBusy(true);
    component.setStatus(STATUS_MESSAGES.starting, false);
    trackEvent('InitiateCheckout', { value: amountCents / 100, currency: 'USD' });

    var response;
    try {
      response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
    } catch (networkError) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'network_error' });
      return;
    }

    if (response.status === 409) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.capacity_reached, true);
      trackEvent('founding_member_checkout_error', { reason: 'capacity_reached' });
      return;
    }

    if (response.status === 429) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.rate_limited, true);
      trackEvent('founding_member_checkout_error', { reason: 'rate_limited' });
      return;
    }

    if (response.status === 403) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.country_not_supported, true);
      trackEvent('founding_member_checkout_error', { reason: 'country_not_supported' });
      return;
    }

    if (response.status === 503) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.misconfigured, true);
      trackEvent('founding_member_checkout_error', { reason: 'misconfigured' });
      return;
    }

    if (response.status === 400) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.invalid_amount, true);
      trackEvent('founding_member_checkout_error', { reason: 'invalid_amount' });
      return;
    }

    if (!response.ok) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'http_' + response.status });
      return;
    }

    var payload;
    try {
      payload = await response.json();
    } catch (parseError) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'invalid_response' });
      return;
    }

    if (!payload || typeof payload.url !== 'string') {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'missing_url' });
      return;
    }

    var checkoutUrl;
    try {
      checkoutUrl = new URL(payload.url);
    } catch (urlError) {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'invalid_checkout_url' });
      return;
    }

    if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') {
      component.setBusy(false);
      component.setStatus(STATUS_MESSAGES.generic_error, true);
      trackEvent('founding_member_checkout_error', { reason: 'untrusted_checkout_url' });
      return;
    }

    trackEvent('founding_member_checkout_redirected', {});
    // Full-page redirect to Stripe-hosted Checkout — no popup, nothing
    // fragile to a popup blocker. The button stays disabled through the
    // navigation away from this page.
    window.location.assign(checkoutUrl.href);
  }

  function showCancelledStateIfPresent() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'cancelled') return;

    trackEvent('founding_member_checkout_cancelled', {});

    var statuses = document.querySelectorAll('[data-founding-member-status]');
    Array.prototype.forEach.call(statuses, function (el) {
      el.textContent = STATUS_MESSAGES.cancelled;
      el.classList.remove('is-error');
    });

    // Drop the query param so refreshing the page does not keep re-showing
    // the cancellation message, while preserving the visitor's place on the
    // Founding Members page.
    params.delete('checkout');
    var newSearch = params.toString();
    var newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }

  function trackFoundingSectionViewedOnce() {
    var sections = document.querySelectorAll('[data-founding-member-flow]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            trackEvent('founding_member_section_viewed', {});
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(sections[0]);
  }

  function trackFaqInteractions() {
    var faqItems = document.querySelectorAll('.founding-faq details');
    Array.prototype.forEach.call(faqItems, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        var summary = item.querySelector('summary');
        trackEvent('founding_member_faq_interaction', {
          question: summary ? summary.textContent.trim() : '',
        });
      });
    });
  }

  function setupQuickContributionCTA() {
    var quick = document.querySelector('[data-founding-quick-cta]');
    var hero = document.querySelector('.founding-screen-hero');
    var contribution = document.querySelector('[data-contribute-section]');
    if (!quick || !hero || !contribution || !('IntersectionObserver' in window)) return;

    quick.classList.remove('is-ready');

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.target === hero) {
            quick.classList.toggle('is-ready', !entry.isIntersecting);
          }
          if (entry.target === contribution) {
            quick.classList.toggle('at-contribute', entry.isIntersecting);
          }
        });
      },
      { threshold: 0.22 },
    );
    observer.observe(hero);
    observer.observe(contribution);
  }

  var flows = document.querySelectorAll('[data-founding-member-flow]');
  Array.prototype.forEach.call(flows, function (root) {
    new FoundingMemberCTA(root).connect();
  });

  showCancelledStateIfPresent();
  trackFoundingSectionViewedOnce();
  trackFaqInteractions();
  setupQuickContributionCTA();

  // Exposed for the confirmation page and for tests.
  window.handleFoundingMemberCheckout = handleFoundingMemberCheckout;
})();
