// Hero download pills (Windows, Mac, iPhone, Android; Linux once it ships). All pills look the
// same and stay in a fixed order; this script only keeps the download URLs in one place.
(function () {
  'use strict';

  // ---- Settings: edit these, nothing else. ----
  var CONFIG = {
    // Windows installer (stable "latest" URL on R2; the SHA-256 sits next to it as .sha256).
    windowsUrl: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
    // Linux AppImage. null = not released yet: the Linux pill stays hidden.
    linuxUrl: null
  };

  var grid = document.querySelector('.download-grid');
  if (!grid) return;

  var win = grid.querySelector('[data-platform="windows"]');
  if (win) win.href = CONFIG.windowsUrl;

  var linux = grid.querySelector('[data-platform="linux"]');
  if (linux && CONFIG.linuxUrl) {
    linux.href = CONFIG.linuxUrl;
    linux.setAttribute('download', 'CanopyChat.AppImage');
    linux.hidden = false;
  }
})();
