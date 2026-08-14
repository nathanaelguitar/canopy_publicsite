/*
 * Founding Member confirmation page.
 *
 * This page is NOT the authoritative record of payment — the D1 row created
 * by the verified Stripe webhook is. This script only asks the Worker what
 * it currently knows and displays that; it never grants anything itself.
 */
(function () {
  'use strict';

  var STATUS_ENDPOINT = 'https://founding-api.canopychat.app/v1/checkout-session';

  function trackEvent(name, props) {
    if (typeof window.canopyMetaTrack === 'function') window.canopyMetaTrack(name, props || {});
    if (typeof window.canopyTrack === 'function') {
      window.canopyTrack(name, props || {});
    }
  }

  function trackConfirmedPurchaseOnce(sessionId) {
    var key = 'canopychat_purchase_tracked_' + sessionId;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch (storageError) {}
    trackEvent('Purchase', {}, { eventID: 'canopychat_' + sessionId });
  }

  function els() {
    return {
      heading: document.querySelector('[data-founding-success-heading]'),
      message: document.querySelector('[data-founding-success-message]'),
      details: document.querySelector('[data-founding-success-details]'),
    };
  }

  function render(heading, message, showDetails) {
    var e = els();
    if (e.heading) e.heading.textContent = heading;
    if (e.message) e.message.textContent = message;
    if (e.details) e.details.hidden = !showDetails;
  }

  async function checkStatus(sessionId, attempt) {
    var response;
    try {
      response = await fetch(STATUS_ENDPOINT + '?session_id=' + encodeURIComponent(sessionId), {
        credentials: 'omit',
      });
    } catch (networkError) {
      render(
        'We could not confirm your payment',
        'We could not reach our servers to confirm this. If you were charged, Stripe still has the payment record — contact support and we will verify it manually.',
        false,
      );
      return;
    }

    if (!response.ok) {
      render(
        'We could not confirm your payment',
        'We could not confirm this payment. If you were charged, contact support and we will verify it manually.',
        false,
      );
      return;
    }

    var body;
    try {
      body = await response.json();
    } catch (parseError) {
      render('We could not confirm your payment', 'Please contact support to verify your payment.', false);
      return;
    }

    if (body.status === 'confirmed') {
      trackConfirmedPurchaseOnce(sessionId);
      trackEvent('founding_member_payment_confirmed', {});
      render('You are a Founding Member', 'Payment received. Thank you for joining early.', true);
      return;
    }

    if (body.status === 'processing') {
      // Stripe has the payment as paid but our webhook has not fulfilled it
      // yet — this is normally seconds, not minutes. Poll a few times before
      // asking the visitor to just wait on email instead.
      if (attempt < 5) {
        window.setTimeout(function () {
          checkStatus(sessionId, attempt + 1);
        }, 2000);
        return;
      }
      render(
        'Almost there',
        'Your payment is processing. This can take a minute to finish confirming — you do not need to keep this page open. We will also email you once your Founding Member place is confirmed.',
        false,
      );
      return;
    }

    if (body.status === 'needs_review') {
      render(
        'Payment received — review in progress',
        'We received this payment, but your Founding Member record needs a quick manual review. You do not need to pay again. We will follow up by email, or you can contact support.',
        false,
      );
      return;
    }

    render(
      'We could not confirm your payment',
      "We don't see a completed payment for this session. If you believe you were charged, contact support and we will look into it.",
      false,
    );
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get('session_id');

    if (!sessionId) {
      render('No payment found', 'We could not find a payment to confirm. If you just paid, check your email for confirmation, or contact support.', false);
      return;
    }

    // Keep the Stripe session identifier out of browser history, analytics
    // page views, and future referrer values. The value is already captured
    // locally for the authoritative status lookup above.
    params.delete('session_id');
    var newSearch = params.toString();
    var cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);

    checkStatus(sessionId, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
