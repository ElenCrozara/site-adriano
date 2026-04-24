(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  /** Perfil Google Meu Negócio (Maps) — sincroniza todos os [data-gmb-link]. */
  var SITE_GMB_PROFILE_URL =
    "https://maps.app.goo.gl/aqLHHPCvxRnuV1bg7?g_st=aw";

  function applyGmbLinks() {
    if (!SITE_GMB_PROFILE_URL) return;
    document.querySelectorAll("[data-gmb-link]").forEach(function (a) {
      a.setAttribute("href", SITE_GMB_PROFILE_URL);
    });
  }

  applyGmbLinks();

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var animated = document.querySelectorAll("[data-animate]");
  if (!animated.length || !("IntersectionObserver" in window)) {
    animated.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    animated.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index * 0.04, 0.6) + "s";
      observer.observe(el);
    });
  }

  /* Carrossel: desktop 3 slides × 3 reviews (3 dots); mobile 1 review (9 dots), mesmo HTML */
  var root = document.getElementById("carousel-depoimentos");
  if (!root) return;

  var track = root.querySelector("[data-carousel-track]");
  var slides = root.querySelectorAll("[data-carousel-slide]");
  var cards = root.querySelectorAll("[data-carousel-track] .testimonial-card");
  var dotsWrap = root.querySelector("[data-carousel-dots]");
  var btnPrev = root.querySelector("[data-carousel-prev]");
  var btnNext = root.querySelector("[data-carousel-next]");
  var viewport = root.querySelector(".carousel__viewport");
  var groupCount = slides.length;
  var cardCount = cards.length;
  var cardsPerGroup =
    groupCount > 0 ? Math.floor(cardCount / groupCount) || 1 : 1;
  var mqlDesktop = window.matchMedia("(min-width: 768px)");
  var pageIndex = 0;
  var timer = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastDesktop = mqlDesktop.matches;

  function getPageCount() {
    return mqlDesktop.matches ? groupCount : cardCount;
  }

  function applyTransform() {
    if (!track || groupCount === 0 || cardCount === 0) return;
    var desktop = mqlDesktop.matches;
    var n = getPageCount();
    pageIndex = ((pageIndex % n) + n) % n;
    var pct = desktop
      ? (100 / groupCount) * pageIndex
      : (100 / cardCount) * pageIndex;
    track.style.transform = "translateX(-" + pct + "%)";
    if (dotsWrap) {
      var dots = dotsWrap.querySelectorAll(".carousel__dot");
      dots.forEach(function (d, j) {
        d.setAttribute("aria-selected", j === pageIndex ? "true" : "false");
      });
    }
  }

  function goTo(i) {
    var n = getPageCount();
    pageIndex = (i + n) % n;
    applyTransform();
  }

  function next() {
    goTo(pageIndex + 1);
  }

  function prev() {
    goTo(pageIndex - 1);
  }

  function startAuto() {
    var n = getPageCount();
    if (reduceMotion || n <= 1) return;
    stopAuto();
    timer = window.setInterval(next, 8000);
  }

  function stopAuto() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function buildDots() {
    if (!dotsWrap || groupCount === 0 || cardCount === 0) return;
    var n = getPageCount();
    dotsWrap.innerHTML = "";
    for (var d = 0; d < n; d++) {
      (function (j) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel__dot";
        b.setAttribute("role", "tab");
        b.setAttribute(
          "aria-label",
          n === cardCount
            ? "Depoimento " + (j + 1) + " de " + n
            : "Grupo " + (j + 1) + " de depoimentos"
        );
        b.addEventListener("click", function () {
          goTo(j);
          startAuto();
        });
        dotsWrap.appendChild(b);
      })(d);
    }
  }

  function onLayoutChange() {
    var desktop = mqlDesktop.matches;
    if (lastDesktop !== desktop) {
      if (desktop) {
        pageIndex = Math.min(
          groupCount - 1,
          Math.floor(pageIndex / cardsPerGroup)
        );
      } else {
        pageIndex = Math.min(
          cardCount - 1,
          pageIndex * cardsPerGroup
        );
      }
      lastDesktop = desktop;
    }
    buildDots();
    applyTransform();
    stopAuto();
    startAuto();
  }

  buildDots();
  applyTransform();

  if (typeof mqlDesktop.addEventListener === "function") {
    mqlDesktop.addEventListener("change", onLayoutChange);
  } else if (typeof mqlDesktop.addListener === "function") {
    mqlDesktop.addListener(onLayoutChange);
  }

  if (btnNext) btnNext.addEventListener("click", function () {
    next();
    startAuto();
  });
  if (btnPrev) btnPrev.addEventListener("click", function () {
    prev();
    startAuto();
  });

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);
  root.addEventListener("focusin", stopAuto);
  root.addEventListener("focusout", function (e) {
    if (!root.contains(e.relatedTarget)) startAuto();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  startAuto();

  /* Deslizar no mobile (swipe horizontal) */
  if (viewport) {
    var touchStartX = 0;
    var touchStartY = 0;
    var touchActive = false;

    viewport.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchActive = true;
        stopAuto();
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchend",
      function (e) {
        if (!touchActive || !e.changedTouches[0]) return;
        touchActive = false;
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 36) {
          startAuto();
          return;
        }
        if (Math.abs(dx) < Math.abs(dy) * 1.12) {
          startAuto();
          return;
        }
        if (dx > 0) prev();
        else next();
        startAuto();
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchcancel",
      function () {
        touchActive = false;
        startAuto();
      },
      { passive: true }
    );
  }
})();
