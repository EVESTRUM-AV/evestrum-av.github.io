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
  var LOWER = 'abcdefghijklmnopqrstuvwxyz', UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      DIGIT = '0123456789', SYM = '/\\<>[]{}=+*';
  var SWAP_MS = 1000 / 30;             // glyphs change ~30x a second
  function pick(set) { return set[(Math.random() * set.length) | 0]; }
  // a random glyph of roughly the same width class as the letter it replaces,
  // so lines don't re-wrap and nothing below the text jumps
  function glyphLike(ch) {
    var r = Math.random();
    if (/[a-z]/.test(ch)) return r < 0.8 ? pick(LOWER) : pick(SYM);
    if (/[A-Z]/.test(ch)) return r < 0.85 ? pick(UPPER) : pick('#%&');
    if (/[0-9]/.test(ch)) return pick(DIGIT);
    return pick(SYM);
  }

  function decode(el) {
    if (el._busy) return;
    var target = el.dataset.text;
    var len = target.length;
    if (len > 60) return;                 // leave long strings alone
    el._busy = true;
    var dur = (16 + len * 1.4) / 60 * 1000 * 2;   // twice the original length
    var start = performance.now(), last = -1e9;
    // freeze the heading's box (width and height) so neither it nor anything
    // sharing its row (labels, the +/−) can move while the glyphs churn
    var box = el.getBoundingClientRect();
    var lh = parseFloat(getComputedStyle(el).lineHeight) || box.height;
    el.style.width = box.width + 'px';
    el.style.height = box.height + 'px';
    el.style.flex = 'none';
    if (box.height < lh * 1.5) { el.style.whiteSpace = 'nowrap'; el.style.overflow = 'hidden'; }
    el.classList.add('scrambling');
    function tick(now) {
      var p = (now - start) / dur;
      if (p >= 1) {
        el.textContent = target;
        el.classList.remove('scrambling');
        el.style.width = el.style.height = el.style.flex = el.style.whiteSpace = el.style.overflow = '';
        el._busy = false;
        return;
      }
      if (now - last >= SWAP_MS) {
        last = now;
        var settled = Math.floor(p * len), out = '';
        for (var i = 0; i < len; i++) {
          var ch = target[i];
          out += (ch === ' ' || i < settled) ? ch : glyphLike(ch);
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

  /* ---- micro-glitch: every few seconds a short run of 2–4 characters in
     some visible text flickers (with a faint colour split) and settles.  */
  var MG_SKIP = 'script,style,noscript,svg,video,iframe,textarea,input,select,' +
                '.scrambling,.mg,[aria-hidden="true"],#lb';
  function pickTextNode() {
    var vh = window.innerHeight, found = [];
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      if (!/\S{2}/.test(n.nodeValue)) continue;
      var p = n.parentElement;
      if (!p || p.closest(MG_SKIP)) continue;
      var r = p.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 60 || r.top > vh - 20) continue;
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
    var text = node.nodeValue, starts = [];
    for (var i = 0; i < text.length - 1; i++) if (/\S\S/.test(text.substr(i, 2))) starts.push(i);
    if (!starts.length) return;
    var i0 = starts[(Math.random() * starts.length) | 0], len = 2 + ((Math.random() * 3) | 0), i1 = i0;
    while (i1 < text.length && i1 - i0 < len && /\S/.test(text[i1])) i1++;
    var host = node.parentNode, row = host.parentElement || host, h0 = host.offsetHeight, r0 = row.offsetHeight;
    var run = text.slice(i0, i1);
    var rest = node.splitText(i0);
    rest.splitText(run.length);
    var span = document.createElement('span');
    span.className = 'mg';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = run;
    host.replaceChild(span, rest);
    function restore() {
      if (!span.parentNode) return;               // the text was rewritten meanwhile
      var parent = span.parentNode;
      parent.replaceChild(document.createTextNode(run), span);
      parent.normalize();
    }
    var swaps = 5 + ((Math.random() * 4) | 0), k = 0;
    (function swap() {
      if (!span.parentNode) return;
      if (k >= swaps) { restore(); return; }
      var out = '';
      for (var j = 0; j < run.length; j++) out += glyphLike(run[j]);
      span.textContent = out;
      if (host.offsetHeight !== h0 || row.offsetHeight !== r0) { restore(); return; }   // would re-wrap: abort
      k++;
      setTimeout(swap, 60 + Math.random() * 40);
    })();
  }

  (function loop() {
    setTimeout(function () { microGlitch(); loop(); }, 1000 + Math.random() * 1800);
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
