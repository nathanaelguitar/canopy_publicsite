(function () {
  var query = new URLSearchParams(window.location.search);
  var pairingId = query.get('pairing_id');
  var code = query.get('code');
  var message = document.getElementById('message');
  var open = document.getElementById('open-app');
  if (!pairingId || !code) {
    message.textContent = 'This pairing link is incomplete. Run /remote-control again on your computer.';
    message.className = 'pair-error';
    open.remove();
    return;
  }
  var target = 'canopychat://remote-control/pair?pairing_id=' + encodeURIComponent(pairingId) + '&code=' + encodeURIComponent(code);
  open.href = target;
  window.setTimeout(function () { window.location.assign(target); }, 150);
}());
