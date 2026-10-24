/* FleekZy CV — escala la hoja A4 para que quepa en pantallas estrechas */
(function () {
  'use strict';

  var wrap = document.querySelector('[data-sheet-wrap]');
  var sheet = document.querySelector('[data-sheet]');

  function reset() {
    if (!wrap || !sheet) return;
    sheet.style.transform = '';
    wrap.style.width = '';
    wrap.style.height = '';
  }

  function fit() {
    if (!wrap || !sheet) return;
    reset();
    var stage = wrap.parentElement;
    var cs = getComputedStyle(stage);
    var avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var w = sheet.offsetWidth;
    var h = sheet.offsetHeight;
    var s = Math.min(1, avail / w);
    if (s < 1) {
      sheet.style.transform = 'scale(' + s + ')';
      wrap.style.width = (w * s) + 'px';
      wrap.style.height = (h * s) + 'px';
    }
  }

  var t = 0;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(fit, 100);
  });
  window.addEventListener('beforeprint', reset);
  window.addEventListener('afterprint', fit);

  Array.prototype.forEach.call(document.querySelectorAll('[data-print]'), function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
