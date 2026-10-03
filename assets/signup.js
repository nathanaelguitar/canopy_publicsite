/* /signup: create an account (or sign in) with an email code. */
(function () {
  'use strict';
  var A = window.CanopyAccount;
  var $ = A.$;

  var signin = $('[data-signin]');
  var done = $('[data-view="done"]');

  var flow = A.bindSignIn(signin, function () {
    A.show(signin, false);
    A.show(done, true);
    document.body.classList.add('is-signed-up');
    $('[data-title]').textContent = 'Welcome to CanopyChat.';
    $('[data-link-lead]').hidden = true;
    A.updateNav();
    $('[data-account-link]').setAttribute('href', '/account' + A.carry);
    $('#link-done-title').focus();
  });

  $('[data-link-nojs]').hidden = true;
  A.show($('[data-link-app]'), true);

  A.checkSession().then(function (state) {
    if (state === 'in') return A.go('/account');
    if (state === 'unknown') A.setNotice(A.NETWORK_MESSAGE);
    flow.showEmail(false);
  });
})();
