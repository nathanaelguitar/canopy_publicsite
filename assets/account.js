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
    if (state === 'in') devices.load();
    else {
      $('[data-devices-status]').textContent = '';
      A.show($('[data-devices-status]'), false);
    }
  });
})();
