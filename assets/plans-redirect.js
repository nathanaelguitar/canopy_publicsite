/* Old links to the homepage's #plans section now go to the Plans page. */
(function () {
  function go() { if (window.location.hash === '#plans') window.location.replace('/plans'); }
  go();
  window.addEventListener('hashchange', go);
})();
