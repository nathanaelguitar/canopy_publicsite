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

  var STATUS_MESSAGES = {
    starting: 'Opening secure checkout…',
    capacity_reached:
      'This enrollment group is full. Email ' + SUPPORT_EMAIL + ' to join the waitlist for the next opening.',
    rate_limited: 'Too many attempts from this device. Please wait a few minutes and try again.',
    country_not_supported:
      'Founding Member beta enrollment is currently available in the United States.',
    misconfigured: 'Checkout is temporarily unavailable. Please try again shortly.',
    generic_error: 'Something went wrong starting checkout. Please try again.',
    cancelled: 'Your payment was not completed. You can return whenever you are ready.',
  };

  /*
   * No analytics provider is installed on this site, so this is a no-op
   * unless something else on the page defines window.canopyTrack.
   */
  function trackEvent(name, props) {
    if (typeof window.canopyTrack === 'function') {
      window.canopyTrack(name, props || {});
    }
  }

  function FoundingMemberCTA(root) {
    this.root = root;
    this.button = root.querySelector('[data-founding-member-cta]');
    this.status = root.querySelector('[data-founding-member-status]');
    this.busy = false;
  }

  FoundingMemberCTA.prototype.connect = function () {
    var component = this;
    if (!component.button) return;
    component.button.addEventListener('click', function () {
      handleFoundingMemberCheckout(component);
    });
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

    component.setBusy(true);
    component.setStatus(STATUS_MESSAGES.starting, false);
    trackEvent('founding_member_checkout_started', {});

    var response;
    try {
      response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
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

  var flows = document.querySelectorAll('[data-founding-member-flow]');
  Array.prototype.forEach.call(flows, function (root) {
    new FoundingMemberCTA(root).connect();
  });

  showCancelledStateIfPresent();
  trackFoundingSectionViewedOnce();
  trackFaqInteractions();

  // Exposed for the confirmation page and for tests.
  window.handleFoundingMemberCheckout = handleFoundingMemberCheckout;
})();
