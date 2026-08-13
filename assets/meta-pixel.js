/* Meta dataset measurement for the public website. */
(function (window, document) {
  'use strict';
  var DATASET_ID = '1047219577719057';
  if (window.fbq) return;
  var fbq = (window.fbq = function () {
    fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  var firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  fbq('init', DATASET_ID);
  fbq('track', 'PageView');
  window.canopyMetaTrack = function (name, params, options) {
    if (typeof window.fbq !== 'function') return;
    var standard = ['PageView', 'InitiateCheckout', 'Purchase', 'Lead', 'ViewContent'];
    window.fbq(standard.indexOf(name) >= 0 ? 'track' : 'trackCustom', name, params || {}, options || undefined);
  };
})(window, document);
