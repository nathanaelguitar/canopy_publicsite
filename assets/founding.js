/*
 * Reusable Founding Member CTA behavior.
 *
 * No checkout, payment, email collection, or backend logic is implemented.
 * Each [data-founding-member-flow] block can later host either a direct
 * checkout redirect or an email-first step without changing the page layout.
 */
(function () {
  'use strict';

  function FoundingMemberCTA(root) {
    this.root = root;
    this.button = root.querySelector('[data-founding-member-cta]');
    this.status = root.querySelector('[data-founding-member-status]');
    this.emailSlot = root.querySelector('[data-founding-member-email-slot]');
  }

  FoundingMemberCTA.prototype.connect = function () {
    var component = this;

    if (!component.button) {
      return;
    }

    component.button.addEventListener('click', function () {
      handleFoundingMemberCheckout(component);
    });
  };

  function handleFoundingMemberCheckout(component) {
    /*
     * TODO(founding-checkout): Connect the selected enrollment flow here.
     *
     * Option A: verify current-group availability, redirect to Stripe
     * Checkout, collect email there, and return to a success page.
     *
     * Option B: reveal or render an email form in component.emailSlot,
     * then continue to Stripe Checkout and the same success page.
     *
     * Keep secret keys and Checkout Session creation on the server. If the
     * current group is full, route to a waitlist before accepting payment.
     */
    if (component && component.status) {
      component.status.textContent = 'Checkout is not connected yet. No payment has been started.';
    }
  }

  var flows = document.querySelectorAll('[data-founding-member-flow]');
  Array.prototype.forEach.call(flows, function (root) {
    new FoundingMemberCTA(root).connect();
  });

  // Exposed for the future checkout integration and focused browser tests.
  window.handleFoundingMemberCheckout = handleFoundingMemberCheckout;
})();
