/* /account: the signed-in home. Email, devices, sign out. */
(function () {
  'use strict';
  var A = window.CanopyAccount;
  var $ = A.$;

  function toSignup(message) {
    // Carry the reason across the redirect only as a hash-free, non-sensitive flag.
    A.go('/signup');
  }

  var devices = A.bindDevices(document, toSignup, toSignup);
  var billing = A.bindBilling(document, toSignup);

  // Back from Stripe Checkout: confirm, then wait briefly for the webhook to
  // land (the subscription shows up on /v1/me a moment after the redirect).
  var checkout = A.query.get('checkout');
  if (checkout === 'success' || checkout === 'cancel') {
    try {
      var clean = new URL(window.location.href);
      clean.searchParams.delete('checkout');
      window.history.replaceState(null, '', clean.pathname + clean.search);
    } catch (e) { /* cosmetic only */ }
  }

  function afterCheckout() {
    var tries = 0;
    var notice = $('[data-billing-notice]');
    notice.textContent = 'Thanks. Your free trial is starting. This can take a few seconds.';
    A.show(notice, true);
    function poll() {
      billing.load().then(function (me) {
        if (me && billing.billingState(me) !== 'none') {
          notice.textContent = 'You are all set. Remote control is on for your account.';
        } else if (me && ++tries < 8) {
          window.setTimeout(poll, 2000);
        } else if (me) {
          notice.textContent = 'Your payment went through, but it is taking longer than usual to show here. Refresh in a minute.';
        }
      });
    }
    poll();
  }

  $('[data-sign-out]').addEventListener('click', function () {
    A.signOut().then(toSignup);
  });

  $('[data-link-nojs]').hidden = true;

  A.checkSession().then(function (state) {
    if (state === 'out') return toSignup();
    if (state === 'unknown') {
      // Offline: we cannot show devices, but the stored email is still ours to show.
      A.setNotice(A.NETWORK_MESSAGE);
    }
    var s = A.getSession();
    $('[data-account-email]').textContent = (s && s.email) || 'your account';
    A.show($('[data-link-app]'), true);
    $('#link-title').focus();
    if (state === 'in') {
      devices.load();
      if (checkout === 'success') afterCheckout();
      else {
        if (checkout === 'cancel') {
          var n = $('[data-billing-notice]');
          n.textContent = 'Checkout was canceled. You have not been charged.';
          A.show(n, true);
        }
        billing.load();
      }
    }
    else {
      $('[data-devices-status]').textContent = '';
      A.show($('[data-devices-status]'), false);
      $('[data-billing-status]').textContent = '';
      A.show($('[data-billing]'), false);
    }
  });
})();
