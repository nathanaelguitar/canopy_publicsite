/*
 * /link: approve the device code a computer is showing.
 * Signed-out visitors without a code are sent to /signup first; visitors
 * holding a code (?code=WXYZ-1234) sign in here with the shared flow.
 */
(function () {
  'use strict';
  var A = window.CanopyAccount;
  var $ = A.$;

  var raw = (A.query.get('code') || '').toUpperCase().slice(0, 12);
  var pendingUserCode = A.normalizeUserCode(raw) || raw.slice(0, 9);

  var signin = $('[data-signin]');
  var approveView = $('[data-view="approve"]');
  var form = $('[data-approve-form]');
  var userCodeInput = $('#link-user-code');
  var nameInput = $('#link-device-name');
  var success = $('[data-approve-success]');
  var title = $('#link-title');

  var flow = A.bindSignIn(signin, enterApprove);

  function enterApprove() {
    A.setNotice('');
    var s = A.getSession();
    $('[data-account-email]').textContent = (s && s.email) || 'your account';
    var links = document.querySelectorAll('[data-account-link]');
    for (var i = 0; i < links.length; i++) links[i].setAttribute('href', '/account' + A.carry);
    A.show(signin, false);
    A.show(approveView, true);
    A.show(form, true);
    A.show(success, false);
    $('[data-link-lead]').textContent = 'Approve the code your computer is showing.';
    A.updateNav();
    if (pendingUserCode) userCodeInput.value = pendingUserCode;
    (pendingUserCode ? nameInput : userCodeInput).focus();
  }

  function enterSignIn(notice) {
    A.show(approveView, false);
    A.show(signin, true);
    $('[data-link-lead]').textContent = 'Sign in, then approve the code your computer is showing.';
    flow.showEmail(false);
    if (notice) A.setNotice(notice);
    title.focus();
  }

  function sessionEnded() {
    A.clearLocal();
    enterSignIn('Your session ended. Sign in again to continue.');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var userCode = A.normalizeUserCode(userCodeInput.value);
    if (!userCode) {
      A.setError(form, userCodeInput, 'Enter the 8-character code from your computer, like WXYZ-1234.');
      userCodeInput.focus();
      return;
    }
    userCodeInput.value = userCode;
    A.setError(form, userCodeInput, '');
    A.setBusy(form, true);
    var body = { user_code: userCode };
    var name = nameInput.value.trim();
    if (name) body.device_name = name;
    A.authed('POST', '/v1/auth/device/approve', body).then(function () {
      pendingUserCode = '';
      userCodeInput.value = '';
      nameInput.value = '';
      A.show(form, false);
      A.show(success, true);
      success.focus();
    }, function (err) {
      if (A.isAuthLost(err)) return sessionEnded();
      A.setError(form, userCodeInput, A.messageFor(err, 'approve'));
      userCodeInput.focus();
    }).then(function () { A.setBusy(form, false); });
  });

  $('[data-approve-another]').addEventListener('click', function () {
    A.show(success, false);
    A.show(form, true);
    userCodeInput.focus();
  });

  $('[data-link-nojs]').hidden = true;

  A.checkSession().then(function (state) {
    if (state === 'in') {
      A.show($('[data-link-app]'), true);
      return enterApprove();
    }
    // No account yet and no code to approve: create one first.
    if (!pendingUserCode) return A.go('/signup');
    A.show($('[data-link-app]'), true);
    enterSignIn(state === 'unknown' ? A.NETWORK_MESSAGE : '');
  });
})();
