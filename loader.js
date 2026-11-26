/* Micro Moments Co. rentals cart loader. Built by rentals-catalog/build.py into site/loader.js. Do not edit site/loader.js by hand.
 * 1) catalog-snapshot.json next to this file (GitHub Pages, fast). The Apps Script publishes it from the Google Sheet
 *    straight away when the dashboard saves (within 5 minutes for Sheet edits); the URL changes every minute so no
 *    browser or CDN keeps an old copy for longer than that.
 * 2) If that is slow (2.5 s) or fails: the copy saved in this browser from an earlier page.
 * 3) No saved copy either: the live Google Sheet (Apps Script ?action=catalog, slow: 1.5 to 6 s).
 */
(function () {
  if (window.__mmrcLoader) return; window.__mmrcLoader = true;

  /* Photo protection + watermark (Lola, Nov 26 2026). A deterrent, not a lock: it blocks right-click / long-press
   * "Save image", dragging photos out, and Cmd/Ctrl+S, Cmd/Ctrl+U and the developer-tools shortcuts. Screenshots
   * can't be blocked by any website, so large photos also get a small watermark drawn over them on screen.
   * Off inside the Squarespace editor (the site shows there in a frame). Headers, logos, section backgrounds and
   * small images get no watermark; add class "mm-wm-skip" to any block that should not have one. */
  (function () {
    if (window.top !== window.self) return;
    var MARK = 'bookmicromoments.com', MIN_W = 280, MIN_H = 200;
    var st = document.createElement('style');
    st.textContent = 'img{-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none;-webkit-user-select:none}' +
      '.mm-wm-tag{position:absolute;right:12px;bottom:10px;z-index:3;pointer-events:none;user-select:none;-webkit-user-select:none;' +
      'font:500 11px/1 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;' +
      'color:rgba(255,255,255,.5);text-shadow:0 1px 2px rgba(0,0,0,.22);white-space:nowrap}';
    (document.head || document.documentElement).appendChild(st);

    function isPhoto(t) { return t && t.nodeType === 1 && (t.tagName === 'IMG' || t.tagName === 'PICTURE' || (t.closest && t.closest('.mm-wm-box'))); }
    document.addEventListener('contextmenu', function (e) { if (isPhoto(e.target)) e.preventDefault(); }, true);
    document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); }, true);
    document.addEventListener('keydown', function (e) {
      var c = e.code || '', m = e.metaKey || e.ctrlKey;
      if (c === 'F12' || (m && (c === 'KeyS' || c === 'KeyU')) ||
          (m && (e.shiftKey || e.altKey) && /^Key[IJC]$/.test(c))) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    function mark() {
      var imgs = document.images;
      for (var i = 0; i < imgs.length; i++) {
        var im = imgs[i];
        if (im.__mmwm) continue;
        if (im.closest('header,nav,footer .sqs-block-image-link,.section-background,.header,.mm-wm-skip,[data-drawer]')) { im.__mmwm = 1; continue; }
        var r = im.getBoundingClientRect();
        if (r.width < MIN_W || r.height < MIN_H) continue;   // may still be loading or growing: try again later
        // The box that sits exactly around the photo, so the mark lands in the photo's own corner.
        var box = im.parentElement, pick = null;
        for (var d = 0; d < 4 && box && box !== document.body; d++, box = box.parentElement) {
          var b = box.getBoundingClientRect();
          if (Math.abs(b.width - r.width) < 6 && Math.abs(b.height - r.height) < 6) pick = box;
          else break;
        }
        im.__mmwm = 1;
        if (!pick || pick.querySelector(':scope > .mm-wm-tag')) continue;
        if (getComputedStyle(pick).position === 'static') pick.style.position = 'relative';
        pick.classList.add('mm-wm-box');
        var tag = document.createElement('span');
        tag.className = 'mm-wm-tag'; tag.setAttribute('aria-hidden', 'true'); tag.textContent = MARK;
        pick.appendChild(tag);
      }
    }
    var due = 0;
    function soon() { if (!due) due = setTimeout(function () { due = 0; try { mark(); } catch (e) {} }, 250); }
    soon();
    document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IMG') soon(); }, true);
    window.addEventListener('load', soon); window.addEventListener('resize', soon);
    try { new MutationObserver(soon).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  })();

  /* Where this visitor came from, for the admin dashboard: ad click IDs, UTM tags, or the referring site. The newest
   * visit that isn't "direct" wins and is kept 90 days; the cart sends it with the quote request. Nothing is shown. */
  try {
    var q = new URLSearchParams(location.search), ref = '', host = location.hostname.replace(/^www\./, '');
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (ref === host || /squarespace\.com$/.test(ref)) ref = '';
    var u = function (k) { return String(q.get(k) || '').slice(0, 80); };
    var us = u('utm_source').toLowerCase(), um = u('utm_medium').toLowerCase(), uc = u('utm_campaign');
    var site = function (h) {
      return /(^|\.)google\./.test(h) && /maps|business/.test(h + ' ' + us) ? 'Google Maps' : /(^|\.)google\.|^google$|^googleapis|android-app:\/\/com\.google/.test(h) ? 'Google search' :
        /instagram|^ig$/.test(h) ? 'Instagram' : /facebook|^fb$|^fb\.|^m\.me$/.test(h) ? 'Facebook' : /pinterest|^pin\.it$/.test(h) ? 'Pinterest' :
        /tiktok/.test(h) ? 'TikTok' : /bing|duckduckgo|yahoo|ecosia/.test(h) ? 'Other search' : /chatgpt|openai|perplexity|claude\.ai|copilot|gemini/.test(h) ? 'AI chat' : '';
    };
    var ch = '';
    if (q.get('gclid') || q.get('gbraid') || q.get('wbraid') || (/google/.test(us) && /cpc|ppc|paid/.test(um))) ch = 'Google Ads';
    else if (/^(fb|facebook|ig|instagram|meta|an)$/.test(us) && (uc || /paid|cpc|ad/.test(um))) ch = 'Meta ads';
    else if (q.get('fbclid') && uc) ch = 'Meta ads';
    else if (us) ch = site(us) || (us === 'gbp' || us === 'google_business' ? 'Google Maps' : 'Tagged link: ' + us);
    else if (ref) ch = site(ref) || 'Other site: ' + ref;
    if (ch) localStorage.setItem('mm-src-v1', JSON.stringify({ c: ch, d: (uc || ref || us).slice(0, 80), l: location.pathname.slice(0, 80), t: Date.now() }));
  } catch (e) {}
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^\/]*(\?.*)?$/, '') : 'https://lolaintech-sys.github.io/mm-rentals/';
  var API = window.MMRC_API || 'https://script.google.com/macros/s/AKfycbzPEwmULXhh24BJjsyz2piirEhIiC4g6j8qVVkzO2JgooiUv4wmIDAnZJmGeJfmLEkZ/exec';   // MMRC_API: only for local tests
  var VER = 'b9ffe440';
  var SNAP = window.MMRC_SNAPSHOT || BASE + 'catalog-snapshot.json';   // MMRC_SNAPSHOT: only for local tests
  var KEY = 'mmrc-catalog-v1', WAIT = 2500;
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
  function live() { return get(API + (API.indexOf('?') < 0 ? '?' : '&') + 'action=catalog', 20000).then(function (j) { if (!j || !j.ok || !valid(j.data)) throw new Error('no catalog'); save(j.data); return j.data; }); }
  function snapshot() { return get(SNAP + '?t=' + Math.floor(Date.now() / 60000), 6000).then(function (d) { if (!valid(d)) throw new Error('bad snapshot'); save(d); return d; }); }

  var saved = readSaved();
  var timer = saved ? setTimeout(function () { start(saved.d, 'saved'); }, WAIT) : null;
  snapshot().then(function (d) { clearTimeout(timer); start(d, 'snapshot'); }, function () {
    clearTimeout(timer);
    if (saved) { start(saved.d, 'saved'); return; }
    live().then(function (d) { start(d, 'sheet'); }, function () {});
  });
})();
