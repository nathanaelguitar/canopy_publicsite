// The "Install Canopy Code" section: a macOS / Linux / Windows switcher over one terminal, and
// copy buttons that copy the command without its prompt. Without JS the tab strip stays hidden
// and all three commands show stacked, each under its own comment line.
(function () {
  'use strict';

  function commandText(element) {
    var clone = element.cloneNode(true);
    var prompts = clone.querySelectorAll('.terminal-prompt');
    for (var i = 0; i < prompts.length; i++) prompts[i].remove();
    return clone.textContent.trim();
  }

  // The fallback hint has to name the right modifier: Windows and Linux have no Command key.
  function copyHint() {
    var ua = navigator.userAgent || '';
    return /Mac|iPhone|iPad|iPod/.test(ua) ? 'Press \u2318C' : 'Press Ctrl+C';
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
          function () { confirm(button, fallbackCopy(text) ? 'Copied' : copyHint()); }
        );
      } else {
        confirm(button, fallbackCopy(text) ? 'Copied' : copyHint());
      }
    });
  }

  // ---- Platform switcher ----

  // Phones get no default: they are not where you install a terminal agent, and Android's user
  // agent says "Linux", which would otherwise land them on the Linux tab.
  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var uad = navigator.userAgentData;
    var platform = (uad && uad.platform) || navigator.platform || '';
    if (/Android|iPhone|iPad|iPod/i.test(ua)) return null;
    if (/Windows/i.test(platform) || /Windows NT/i.test(ua)) return 'windows';
    // iPadOS reports MacIntel, so a touch-capable "Mac" is not a Mac.
    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
      return navigator.maxTouchPoints > 1 ? null : 'macos';
    }
    if (/CrOS|Linux|X11/i.test(platform + ' ' + ua)) return 'linux';
    return null;
  }

  var tablist = document.querySelector('.terminal-tabs');
  var tabs = tablist ? tablist.querySelectorAll('[role="tab"]') : [];
  var panels = document.querySelectorAll('.terminal-panel');
  var notes = document.querySelectorAll('.install-notes [data-platforms]');
  if (!tablist || !tabs.length || !panels.length) return;

  // The panels only become tabpanels once there is a tab strip to control them; without JS they
  // are plain stacked blocks, and a tabpanel pointing at a hidden tab would be a dangling label.
  for (var p = 0; p < panels.length; p++) {
    panels[p].setAttribute('role', 'tabpanel');
    panels[p].setAttribute('aria-labelledby', 'tab-' + panels[p].getAttribute('data-platform'));
  }

  function select(platform, moveFocus) {
    var selectedTab = null;
    for (var i = 0; i < tabs.length; i++) {
      var isSelected = tabs[i].getAttribute('data-platform') === platform;
      tabs[i].setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tabs[i].setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected) selectedTab = tabs[i];
    }
    for (var j = 0; j < panels.length; j++) {
      panels[j].hidden = panels[j].getAttribute('data-platform') !== platform;
    }
    for (var k = 0; k < notes.length; k++) {
      var list = ' ' + notes[k].getAttribute('data-platforms') + ' ';
      notes[k].hidden = list.indexOf(' ' + platform + ' ') < 0;
    }
    if (moveFocus && selectedTab) selectedTab.focus();
  }

  function indexOfTab(tab) {
    for (var i = 0; i < tabs.length; i++) if (tabs[i] === tab) return i;
    return -1;
  }

  for (var t = 0; t < tabs.length; t++) {
    tabs[t].addEventListener('click', function (event) {
      select(event.currentTarget.getAttribute('data-platform'), false);
    });
    tabs[t].addEventListener('keydown', function (event) {
      var current = indexOfTab(event.currentTarget);
      var next = -1;
      if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      event.preventDefault();
      select(tabs[next].getAttribute('data-platform'), true);
    });
  }

  select(detectPlatform() || 'macos', false);
  tablist.hidden = false;
})();
