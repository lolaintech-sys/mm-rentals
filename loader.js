/* Micro Moments Co. rentals cart loader. Built by rentals-catalog/build.py into site/loader.js. Do not edit site/loader.js by hand.
 * 1) Gets the catalog: a copy saved in this browser in the last 10 minutes, else the live Google Sheet
 *    (Apps Script ?action=catalog, up to 4 s), else an older saved copy, else catalog-snapshot.json next to this file.
 * 2) Starts the cart (cart.js) with it. A saved copy is refreshed in the background for the next page.
 */
(function () {
  if (window.__mmrcLoader) return; window.__mmrcLoader = true;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^\/]*(\?.*)?$/, '') : 'https://lolaintech-sys.github.io/mm-rentals/';
  var API = window.MMRC_API || 'https://script.google.com/macros/s/AKfycbzPEwmULXhh24BJjsyz2piirEhIiC4g6j8qVVkzO2JgooiUv4wmIDAnZJmGeJfmLEkZ/exec';   // MMRC_API: only for local tests
  var VER = 'acf5c47d';
  var KEY = 'mmrc-catalog-v1', FRESH = 10 * 60 * 1000, WAIT = 4000;
  var started = false;

  function valid(d) { return d && d.settings && d.items && d.items.length && d.packages && d.categories; }
  // Option photos kept in this repo are stored as "photos/choices/x.jpg": point them at this site.
  function fixPhotos(x) {
    if (Array.isArray(x)) { for (var i = 0; i < x.length; i++) { if (typeof x[i] === 'string' && x[i].indexOf('photos/') === 0) x[i] = BASE + x[i]; else fixPhotos(x[i]); } }
    else if (x && typeof x === 'object') { for (var k in x) { var v = x[k]; if (typeof v === 'string' && v.indexOf('photos/') === 0) x[k] = BASE + v; else fixPhotos(v); } }
    return x;
  }
  function readSaved() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && valid(s.d) ? s : null; } catch (e) { return null; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  function start(d, from) {
    if (started) return; started = true;
    window.MMRC_DATA = fixPhotos(d);
    window.MMRC_SOURCE = from;
    var s = document.createElement('script'); s.src = BASE + 'cart.js?v=' + VER; document.head.appendChild(s);
  }
  function get(url, ms) {
    return new Promise(function (ok, no) {
      var done = false, t = setTimeout(function () { done = true; no(new Error('timeout')); }, ms);
      fetch(url, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (j) {
        if (done) return; clearTimeout(t); ok(j);
      }, function (e) { if (!done) { clearTimeout(t); no(e); } });
    });
  }
  function live(ms) { return get(API + (API.indexOf('?') < 0 ? '?' : '&') + 'action=catalog', ms).then(function (j) { if (!j || !j.ok || !valid(j.data)) throw new Error('no catalog'); save(j.data); return j.data; }); }
  function snapshot() { return get(BASE + 'catalog-snapshot.json?v=' + VER, 8000).then(function (d) { if (!valid(d)) throw new Error('bad snapshot'); return d; }); }

  var saved = readSaved();
  if (saved && Date.now() - saved.t < FRESH) { start(saved.d, 'saved'); live(15000).catch(function () {}); return; }
  live(WAIT).then(function (d) { start(d, 'sheet'); }, function () {
    if (saved) { start(saved.d, 'saved-old'); live(15000).catch(function () {}); return; }
    snapshot().then(function (d) { start(d, 'snapshot'); }, function () {});
  });
})();
