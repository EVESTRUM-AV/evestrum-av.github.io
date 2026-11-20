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

  /* ---- decode: headings resolve from random glyphs on reveal ---- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\<>[]{}=+*';
  function decode(el) {
    if (el.dataset.decoded) return;
    el.dataset.decoded = '1';
    var target = el.textContent;
    var len = target.length;
    if (len > 60) return;                 // leave long strings alone
    var frame = 0, total = 16 + len * 1.4;
    el.classList.add('scrambling');
    function tick() {
      var progress = frame / total;
      var settled = Math.floor(progress * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        var ch = target[i];
        if (ch === ' ' || i < settled) out += ch;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) requestAnimationFrame(tick);
      else { el.textContent = target; el.classList.remove('scrambling'); }
    }
    requestAnimationFrame(tick);
  }

  var decodables = document.querySelectorAll('[data-decode]');
  if (decodables.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      decodables.forEach(function (el) { el.dataset.decoded = '1'; });
    } else {
      var dio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { decode(e.target); dio.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.3 });
      decodables.forEach(function (el) { dio.observe(el); });
    }
  }

  /* ---- current year ---- */
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
