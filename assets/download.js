// "Download CanopyChat" button. Detects the visitor's device and points the button at the right
// download or store page. Without JavaScript (or on an unknown device) the button jumps to the
// "Other platforms" links, which always work.
(function () {
  'use strict';

  // ---- Settings: edit these, nothing else. ----
  var CONFIG = {
    // Windows installer (stable "latest" URL on R2; SHA-256 sits next to it as .sha256).
    windowsUrl: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
    // Show the "Windows may show a security prompt" note. Set to false once the installer is code-signed.
    windowsUnsigned: true,
    // Linux AppImage. null = not released yet: Linux visitors see "coming soon".
    linuxUrl: null,
    macUrl: 'https://testflight.apple.com/join/f5xCZmVv',
    iosUrl: 'https://apps.apple.com/us/app/canopychat/id6788203137',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.nathanaelguitar.canopychat'
  };

  var ICONS = {
    download: '<path d="M12 3v12m0 0-5-5m5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    apple: '<path fill="currentColor" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>',
    android: '<path fill="currentColor" d="M3.61 1.81 13.79 12 3.61 22.19a1.5 1.5 0 0 1-.61-1.21V3.02c0-.49.23-.93.61-1.21zm11.24 11.25 2.39 2.39-11.1 6.33 8.71-8.72zm3.69-3.69 2.79 1.59c.84.48.84 1.6 0 2.08l-2.79 1.59L15.91 12l2.63-2.63zM6.14 2.22l11.1 6.33-2.39 2.39-8.71-8.72z"/>'
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

  var CHOICES = {
    windows: { url: CONFIG.windowsUrl, label: 'Download for Windows', sub: 'Windows 10 and 11 · about 130 MB', icon: 'download' },
    mac: { url: CONFIG.macUrl, label: 'Get it for Mac', sub: 'Free beta through Apple TestFlight', icon: 'apple', external: true },
    ios: { url: CONFIG.iosUrl, label: 'Download on the App Store', sub: 'For iPhone and iPad', icon: 'apple', external: true },
    android: { url: CONFIG.androidUrl, label: 'Get it on Google Play', sub: 'For Android phones', icon: 'android', external: true },
    linux: CONFIG.linuxUrl
      ? { url: CONFIG.linuxUrl, label: 'Download for Linux', sub: 'AppImage · runs on most distributions', icon: 'download' }
      : { url: null, label: 'Linux version coming soon', sub: 'Try it on your phone in the meantime', icon: 'download' }
  };

  var root = document.querySelector('[data-download]');
  if (!root) return;
  var button = root.querySelector('[data-download-button]');
  var os = detect();
  var choice = CHOICES[os];

  // Keep the "Other platforms" links in sync with the settings above.
  var linuxLink = root.querySelector('[data-platform-link="linux"]');
  if (linuxLink && CONFIG.linuxUrl) {
    var a = document.createElement('a');
    a.href = CONFIG.linuxUrl;
    a.textContent = 'Linux';
    a.setAttribute('data-platform-link', 'linux');
    linuxLink.parentNode.replaceChild(a, linuxLink);
  }
  var winLink = root.querySelector('[data-platform-link="windows"]');
  if (winLink) winLink.href = CONFIG.windowsUrl;

  if (!choice) return; // Unknown device: leave the button pointing at "Other platforms".

  root.setAttribute('data-os', os);
  root.querySelector('[data-download-label]').textContent = choice.label;
  root.querySelector('[data-download-sub]').textContent = choice.sub;
  root.querySelector('[data-download-icon]').innerHTML = ICONS[choice.icon];

  if (choice.url) {
    button.href = choice.url;
    if (choice.external) {
      button.target = '_blank';
      button.rel = 'noopener';
    }
  } else {
    button.removeAttribute('href');
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-soon');
  }

  // The visitor's own platform is already the big button; don't repeat it below.
  var own = root.querySelector('[data-platform-link="' + os + '"]');
  if (own) own.hidden = true;

  var note = root.querySelector('[data-download-note]');
  if (note && os === 'windows' && CONFIG.windowsUnsigned) note.hidden = false;
})();
