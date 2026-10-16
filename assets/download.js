// Hero "Download" button. index.html has one button per platform (logo + "Download"), all hidden
// except the generic one; this script shows the visitor's instead, and hides that platform from
// the icon row beside it. Without JavaScript, or on an unknown device, the generic button jumps
// to the icon row.
(function () {
  'use strict';

  // ---- Settings: edit these, nothing else. ----
  var CONFIG = {
    // Windows installer (stable "latest" URL on R2; the SHA-256 sits next to it as .sha256).
    windowsUrl: 'https://downloads.canopychat.app/windows/CanopyChat-Setup.exe',
    // Linux AppImage. null = not released yet: Linux visitors get the generic button.
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

  var hero = document.querySelector('[data-download]');
  if (!hero) return;

  var i;
  var winLinks = hero.querySelectorAll('[data-download-url="windows"]');
  for (i = 0; i < winLinks.length; i++) winLinks[i].href = CONFIG.windowsUrl;

  if (CONFIG.linuxUrl) {
    var linuxLinks = hero.querySelectorAll('[data-download-url="linux"]');
    for (i = 0; i < linuxLinks.length; i++) {
      linuxLinks[i].href = CONFIG.linuxUrl;
      linuxLinks[i].setAttribute('download', 'CanopyChat.AppImage');
    }
    hero.querySelector('.dl-others [data-platform-link="linux"]').hidden = false;
  }

  var os = detect();
  if (os === 'linux' && !CONFIG.linuxUrl) os = 'other';
  var mine = hero.querySelector('[data-dl="' + os + '"]');
  if (!mine || os === 'other') return;

  hero.setAttribute('data-os', os);
  hero.querySelector('[data-dl="other"]').hidden = true;
  mine.hidden = false;

  // The visitor's platform is already the button; don't repeat its icon. A Mac visitor keeps the
  // Apple icon, which leads to the iPhone and iPad app.
  var own = hero.querySelector('.dl-others [data-platform-link="' + os + '"]');
  if (own) own.hidden = true;
})();
