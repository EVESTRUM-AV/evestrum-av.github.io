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

    function open(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function close() {
      lb.classList.remove('open');
      lbImg.src = '';
      document.body.style.overflow = '';
      if (opener) opener.focus();
    }

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

  /* ---- current year ---- */
  var y = document.getElementById('yr');
  if (y) y.textContent = new Date().getFullYear();
})();
