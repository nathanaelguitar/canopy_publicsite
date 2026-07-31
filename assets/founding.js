/*
 * CanopyChat — Founding Member page behaviour.
 *
 * This file contains NO payment logic. The checkout button is a deliberate
 * placeholder until Stripe Checkout is wired up in a later phase.
 *
 * STRIPE INTEGRATION POINT: handleFoundingMemberCheckout(), below.
 */
(function () {
  'use strict';

  var SUPPORT_EMAIL = 'support@canopychat.app';

  /*
   * Analytics shim.
   *
   * No analytics provider is installed on this site today, so this is a
   * no-op that logs nothing in production. When a provider is added, forward
   * to it here and every existing call site starts reporting.
   *
   * TODO(analytics): forward to the chosen provider, e.g.
   *   window.plausible && window.plausible(name, { props: props });
   */
  function trackEvent(name, props) {
    if (typeof window.canopyTrack === 'function') {
      window.canopyTrack(name, props || {});
    }
  }

  /*
   * PLACEHOLDER CHECKOUT HANDLER.
   *
   * Replace the body of this function with the Stripe Checkout redirect:
   *
   *   1. POST to your backend endpoint that creates a Checkout Session
   *      (one-time $10 price, mode: 'payment' — NOT mode: 'subscription').
   *   2. Redirect to the returned session URL.
   *
   * Do not put a Stripe secret key in this file. Only a publishable key or a
   * server-issued session URL may ever reach the browser.
   */
  function handleFoundingMemberCheckout(button, status) {
    trackEvent('founding_checkout_clicked', { location: 'offer_card' });

    // TODO(stripe): trackEvent('founding_checkout_started') immediately before
    // redirecting to the Stripe Checkout session, and fire
    // 'founding_checkout_completed' from the post-payment success page.

    button.disabled = true;
    button.classList.add('is-loading');

    status.textContent =
      'Founding Member checkout is not open yet. Email ' +
      SUPPORT_EMAIL +
      ' and we will notify you the moment it is.';
    status.classList.add('is-visible');

    // Re-enable so the page never looks stuck. Remove this once the handler
    // actually navigates away to Stripe.
    window.setTimeout(function () {
      button.disabled = false;
      button.classList.remove('is-loading');
    }, 900);
  }

  function init() {
    var button = document.getElementById('founding-checkout');
    var status = document.getElementById('founding-checkout-status');

    if (button && status) {
      button.addEventListener('click', function () {
        handleFoundingMemberCheckout(button, status);
      });
    }

    // Generic CTA click tracking for links that declare an event name.
    var tracked = document.querySelectorAll('a[data-analytics]');
    Array.prototype.forEach.call(tracked, function (el) {
      el.addEventListener('click', function () {
        trackEvent(el.getAttribute('data-analytics'), {
          label: el.textContent.trim()
        });
      });
    });

    // FAQ open/close tracking.
    var faqItems = document.querySelectorAll('.faq-item');
    Array.prototype.forEach.call(faqItems, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) {
          return;
        }
        var summary = item.querySelector('summary');
        trackEvent('founding_faq_opened', {
          question: summary ? summary.textContent.trim() : ''
        });
      });
    });

    // Fire once when the offer section first becomes visible.
    var offer = document.getElementById('founding-access');
    if (offer && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              trackEvent('founding_offer_viewed', {});
              observer.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(offer);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
