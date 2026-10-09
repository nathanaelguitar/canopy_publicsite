// Copy buttons for the "Install Canopy Code" section. Copies the command text without the
// "$ " prompt, and confirms on the button itself.
(function () {
  'use strict';

  function commandText(element) {
    var clone = element.cloneNode(true);
    var prompts = clone.querySelectorAll('.terminal-prompt');
    for (var i = 0; i < prompts.length; i++) prompts[i].remove();
    return clone.textContent.trim();
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  function confirm(button, message) {
    var original = button.getAttribute('data-label') || button.textContent;
    button.setAttribute('data-label', original);
    button.textContent = message;
    button.classList.add('copied');
    window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1800);
  }

  var buttons = document.querySelectorAll('[data-copy-target]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) {
      var button = event.currentTarget;
      var target = document.getElementById(button.getAttribute('data-copy-target'));
      if (!target) return;
      var text = commandText(target);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { confirm(button, 'Copied'); },
          function () { confirm(button, fallbackCopy(text) ? 'Copied' : 'Press ⌘C'); }
        );
      } else {
        confirm(button, fallbackCopy(text) ? 'Copied' : 'Press ⌘C');
      }
    });
  }
})();
