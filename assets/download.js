// Hero download pills (Windows, Mac, iPhone, Android, Linux). All pills look the same and stay
// in a fixed order; this script only keeps the download URLs in one place.
(function () {
  'use strict';

  // ---- Settings: edit these, nothing else. ----
  var LINUX = 'https://downloads.canopychat.app/linux/';
  var CONFIG = {
    // Windows installer (stable "latest" URL on R2; the SHA-256 sits next to it as .sha256).
    windowsUrl: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
    // Linux: the .deb is the main link (Ubuntu 22.04+ and Debian); the AppImage runs on other
    // distributions. One of each per architecture. null = not released yet: Linux stays hidden.
    linux: {
      x64: { deb: LINUX + 'CanopyChat-amd64.deb', appimage: LINUX + 'CanopyChat-x86_64.AppImage' },
      arm64: { deb: LINUX + 'CanopyChat-arm64.deb', appimage: LINUX + 'CanopyChat-aarch64.AppImage' }
    }
  };

  var grid = document.querySelector('.download-grid');
  if (!grid) return;

  var win = grid.querySelector('[data-platform="windows"]');
  if (win) win.href = CONFIG.windowsUrl;

  var pill = grid.querySelector('[data-platform="linux"]');
  if (!pill || !CONFIG.linux) return;

  function fileName(url) { return url.slice(url.lastIndexOf('/') + 1); }

  // The pill looks like the others (glyph + "Linux"): no text under it. It downloads the .deb
  // for the visitor's architecture (x86_64 unless the browser says ARM); the AppImage and the
  // other architecture are named only in the tooltip and the accessible label.
  function show(arch) {
    var mine = CONFIG.linux[arch];
    var label = arch === 'arm64' ? 'ARM64' : 'x86_64';
    var otherLabel = arch === 'arm64' ? 'x86_64' : 'ARM64';
    pill.href = mine.deb;
    pill.setAttribute('download', fileName(mine.deb));
    pill.title = 'Linux · Ubuntu 22.04 or newer · .deb for ' + label +
      ' (also available as an AppImage and for ' + otherLabel + ')';
    pill.setAttribute('aria-label', 'Download CanopyChat for Linux, .deb for Ubuntu 22.04 or newer, ' + label);
  }

  var ua = navigator.userAgent || '';
  show(/aarch64|arm64/i.test(ua) ? 'arm64' : 'x64');
  pill.hidden = false;

  // Chromium hides the architecture from the user agent; ask for it.
  var uad = navigator.userAgentData;
  if (uad && uad.getHighEntropyValues && /linux/i.test(uad.platform || '')) {
    uad.getHighEntropyValues(['architecture', 'bitness']).then(function (v) {
      if (v && v.architecture === 'arm' && v.bitness === '64') show('arm64');
    }).catch(function () {});
  }
})();
