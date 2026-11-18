// The Linux install guide: copy buttons on every command block and the x86-64 / ARM64 switcher
// in the Quick install card. Without JS the tab strip stays hidden and both architectures show
// stacked; the copy buttons are plain buttons that do nothing, and every command can still be
// selected by hand.
(function () {
  'use strict';

  var status = document.getElementById('copy-status');

  function announce(message) {
    if (!status) return;
    status.textContent = '';
    window.setTimeout(function () { status.textContent = message; }, 50);
  }

  // The fallback hint has to name the right modifier: Linux and Windows have no Command key.
  function copyHint() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent || '') ? 'Press ⌘C' : 'Press Ctrl+C';
  }

  function selectText(element) {
    var selection = window.getSelection && window.getSelection();
    if (!selection || !document.createRange) return;
    var range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function fallbackCopy(text, element) {
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
    // Nothing could write the clipboard: leave the command selected so one keystroke copies it.
    if (!ok && element) selectText(element);
    return ok;
  }

  function confirm(button, message, ok) {
    var original = button.getAttribute('data-label') || button.textContent;
    button.setAttribute('data-label', original);
    button.textContent = message;
    button.classList.toggle('copied', ok);
    announce(ok ? 'Command copied to the clipboard' : 'Could not copy automatically. The command is selected: ' + message + ' to copy it.');
    window.clearTimeout(button._copyTimer);
    button._copyTimer = window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1800);
  }

  function copyFrom(button) {
    var target = document.getElementById(button.getAttribute('data-copy-target'));
    if (!target) return;
    var text = target.textContent.trim();
    var finish = function () {
      var ok = fallbackCopy(text, target);
      confirm(button, ok ? 'Copied' : copyHint(), ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { confirm(button, 'Copied', true); }, finish);
    } else {
      finish();
    }
  }

  var buttons = document.querySelectorAll('[data-copy-target]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function (event) { copyFrom(event.currentTarget); });
  }

  // ---- Architecture switcher ----

  var tablist = document.querySelector('.arch-tabs');
  var tabs = tablist ? tablist.querySelectorAll('[role="tab"]') : [];
  var panels = document.querySelectorAll('.arch-panel');
  if (!tablist || !tabs.length || !panels.length) return;

  for (var p = 0; p < panels.length; p++) {
    panels[p].setAttribute('role', 'tabpanel');
    panels[p].setAttribute('aria-labelledby', 'tab-' + panels[p].getAttribute('data-arch'));
    panels[p].setAttribute('tabindex', '0');
  }

  function select(arch, moveFocus) {
    var selectedTab = null;
    for (var i = 0; i < tabs.length; i++) {
      var isSelected = tabs[i].getAttribute('data-arch') === arch;
      tabs[i].setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tabs[i].setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected) selectedTab = tabs[i];
    }
    for (var j = 0; j < panels.length; j++) {
      panels[j].hidden = panels[j].getAttribute('data-arch') !== arch;
    }
    if (moveFocus && selectedTab) selectedTab.focus();
  }

  function indexOfTab(tab) {
    for (var i = 0; i < tabs.length; i++) if (tabs[i] === tab) return i;
    return -1;
  }

  // Once the visitor picks a tab, the delayed architecture lookup below must not undo it.
  var picked = false;
  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function (event) {
      picked = true;
      select(event.currentTarget.getAttribute('data-arch'), false);
    });
    tabs[t].addEventListener('keydown', function (event) {
      var index = indexOfTab(event.currentTarget);
      var next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      picked = true;
      select(tabs[next].getAttribute('data-arch'), true);
    });
  }

  // Default: ARM64 when the browser says so, else x86-64. Firefox puts aarch64 in the user agent;
  // Chromium hides it and has to be asked.
  tablist.hidden = false;
  document.documentElement.classList.add('arch-tabs-on');
  select(/aarch64|arm64/i.test(navigator.userAgent || '') ? 'arm64' : 'amd64', false);
  var uad = navigator.userAgentData;
  if (uad && uad.getHighEntropyValues) {
    uad.getHighEntropyValues(['architecture', 'bitness']).then(function (v) {
      if (!picked && v && v.architecture === 'arm' && v.bitness === '64') select('arm64', false);
    }).catch(function () {});
  }
})();
