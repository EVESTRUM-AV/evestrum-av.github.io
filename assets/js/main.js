/* EVESTRUM — minimal site behaviour */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll reveal ---- */
  var rv = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---- nav hide on scroll down ---- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > last && y > 300) nav.classList.add('hidden');
        else nav.classList.remove('hidden');
        last = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- pause offscreen videos (saves battery / data) ---- */
  var vids = document.querySelectorAll('video[data-auto]');
  if (vids.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---- lightbox ---- */
  var lb = document.getElementById('lb');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var opener = null;
    var pushed = false;   /* true while the viewer owns a history entry */

    function open(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
      /* give the viewer its own history entry, so the phone's Back button
         closes the image instead of leaving the site */
      if (!pushed) {
        try { history.pushState({ lb: 1 }, '', location.href); pushed = true; }
        catch (err) { pushed = false; }
      }
    }
    function teardown() {
      lb.classList.remove('open');
      lbImg.src = '';
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }
    function close() {
      if (pushed) { history.back(); return; }  /* popstate calls teardown */
      teardown();
    }
    addEventListener('popstate', function () {
      pushed = false;
      if (lb.classList.contains('open')) teardown();
    });

    document.querySelectorAll('.zoomable').forEach(function (el) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Enlarge image');
      function fire() {
        opener = el;
        var img = el.tagName === 'IMG' ? el : el.querySelector('img');
        if (!img) return;
        open(img.dataset.full || img.currentSrc || img.src, img.alt);
      }
      el.addEventListener('click', fire);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
      });
    });

    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) close();
    });
  }

  /* ---- decode: headings resolve from random glyphs on reveal ----
     Time-based (same speed on 60 Hz phones and 144 Hz monitors), replays
     every time a heading scrolls back into view. Runs even when the OS asks
     for reduced motion: it swaps characters, nothing moves on screen.      */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\<>[]{}=+*';
  var SWAP_MS = 1000 / 30;             // glyphs change ~30x a second
  function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  function decode(el) {
    if (el._busy) return;
    var target = el.dataset.text;
    var len = target.length;
    if (len > 60) return;                 // leave long strings alone
    el._busy = true;
    var dur = (16 + len * 1.4) / 60 * 1000 * 2;   // twice the original length
    var start = performance.now(), last = -1e9;
    el.classList.add('scrambling');
    function tick(now) {
      var p = (now - start) / dur;
      if (p >= 1) {
        el.textContent = target;
        el.classList.remove('scrambling');
        el._busy = false;
        return;
      }
      if (now - last >= SWAP_MS) {
        last = now;
        var settled = Math.floor(p * len), out = '';
        for (var i = 0; i < len; i++) {
          var ch = target[i];
          out += (ch === ' ' || i < settled) ? ch : glyph();
        }
        el.textContent = out;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var decodables = document.querySelectorAll('[data-decode]');
  decodables.forEach(function (el) {
    el.dataset.text = el.textContent;
    el.setAttribute('aria-label', el.dataset.text);   // screen readers get the real word
    el._armed = true;
  });
  if (decodables.length && 'IntersectionObserver' in window) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          if (el._armed) { el._armed = false; decode(el); }
        } else {
          el._armed = true;                // fully left the view: replay next time
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.3 });
    decodables.forEach(function (el) { dio.observe(el); });
  }

  /* ---- micro-glitch: every few seconds one or two characters of some
     visible text flicker for a fraction of a second, then settle.        */
  var MG_SKIP = 'script,style,noscript,svg,video,iframe,textarea,input,select,' +
                '.scrambling,[aria-hidden="true"],#lb';
  function pickTextNode() {
    var vh = window.innerHeight, found = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeValue.replace(/\s/g, '').length < 2) continue;
      var p = n.parentElement;
      if (!p || p.closest(MG_SKIP)) continue;
      var r = p.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > vh) continue;
      found.push(n);
    }
    return found.length ? found[(Math.random() * found.length) | 0] : null;
  }

  function microGlitch() {
    if (document.visibilityState !== 'visible') return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return;          // never touch text being selected
    var node = pickTextNode();
    if (!node) return;
    var orig = node.nodeValue, host = node.parentElement;
    var idx = [];
    for (var i = 0; i < orig.length; i++) if (/\S/.test(orig[i])) idx.push(i);
    var count = Math.random() < 0.75 ? 1 : 2, pos = [];
    while (pos.length < count && idx.length) pos.push(idx.splice((Math.random() * idx.length) | 0, 1)[0]);
    var h0 = host.offsetHeight, swaps = 2 + ((Math.random() * 3) | 0), k = 0;
    function swap() {
      if (node.nodeValue !== orig && k === 0) return;   // text changed meanwhile
      if (k >= swaps) { node.nodeValue = orig; return; }
      var chars = orig.split('');
      pos.forEach(function (j) { chars[j] = glyph(); });
      node.nodeValue = chars.join('');
      if (host.offsetHeight !== h0) { node.nodeValue = orig; return; }  // would re-wrap: abort
      k++;
      setTimeout(swap, 55 + Math.random() * 45);
    }
    swap();
  }

  (function loop() {
    setTimeout(function () { microGlitch(); loop(); }, 2500 + Math.random() * 4500);
  })();

  /* ---- open-on-click sections: arriving via a link to one opens it ---- */
  function openFold(hash) {
    if (!hash || hash.length < 2) return;
    var t = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!t) return;
    var d = t.querySelector('details.fold') || t.closest('details.fold');
    if (d && !d.open) d.open = true;
  }
  openFold(location.hash);
  addEventListener('hashchange', function () { openFold(location.hash); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    var u = new URL(a.href, location.href);
    if (u.pathname === location.pathname) openFold(u.hash);
  });

  /* ---- current year ---- */
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
