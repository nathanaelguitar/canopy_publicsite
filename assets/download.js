// "Download CanopyChat" in the hero. index.html has one button per platform, all hidden except
// the generic one; this script shows the visitor's platform button instead. Without JavaScript
// (or on an unknown device) the generic button jumps to the "Other platforms" links.
(function () {
  'use strict';

  // ---- Settings: edit these, nothing else. ----
  var CONFIG = {
    // Windows installer (stable "latest" URL on R2; the SHA-256 sits next to it as .sha256).
    windowsUrl: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
    // Show the "Windows may show a security prompt" note. Set to false once the installer is code-signed.
    windowsUnsigned: true,
    // Linux AppImage. null = not released yet: Linux visitors see "coming soon".
    linuxUrl: null
  };

  function detect() {
    var ua = navigator.userAgent || '';
    var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    // iPadOS reports itself as a Mac; a touch screen gives it away.
    if (/Mac/i.test(platform + ua) && navigator.maxTouchPoints > 1) return 'ios';
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
    if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'mac';
    if (/CrOS/i.test(ua)) return 'other';
    if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'linux';
    return 'other';
  }

  var root = document.querySelector('[data-download]');
  if (!root) return;

  // Keep every Windows link on the configured URL.
  var winLinks = root.querySelectorAll('[data-download-url="windows"]');
  for (var i = 0; i < winLinks.length; i++) winLinks[i].href = CONFIG.windowsUrl;

  // Linux: a real download once linuxUrl is set, otherwise a "coming soon" button with no link.
  var linuxButton = root.querySelector('[data-dl="linux"]');
  var linuxLink = root.querySelector('[data-platform-link="linux"]');
  if (CONFIG.linuxUrl) {
    linuxButton.href = CONFIG.linuxUrl;
    linuxButton.setAttribute('download', 'CanopyChat.AppImage');
    root.querySelector('[data-linux-label]').textContent = 'Download for Linux';
    root.querySelector('[data-linux-sub]').textContent = 'AppImage · runs on most distributions';
    if (linuxLink) {
      var a = document.createElement('a');
      a.href = CONFIG.linuxUrl;
      a.textContent = 'Linux';
      a.setAttribute('data-platform-link', 'linux');
      linuxLink.parentNode.replaceChild(a, linuxLink);
    }
  } else {
    linuxButton.setAttribute('aria-disabled', 'true');
    linuxButton.classList.add('is-soon');
  }

  var os = detect();
  var mine = root.querySelector('[data-dl="' + os + '"]');
  if (!mine || os === 'other') return;

  root.setAttribute('data-os', os);
  root.querySelector('[data-dl="other"]').hidden = true;
  mine.hidden = false;

  // The visitor's own platform is already the big button; don't repeat it below.
  var own = root.querySelector('[data-platform-link="' + os + '"]');
  if (own) own.hidden = true;

  var note = root.querySelector('[data-download-note]');
  if (note && os === 'windows' && CONFIG.windowsUnsigned) note.hidden = false;
})();
