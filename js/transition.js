/* ============================================================
   Page transitions + CTA glitch — prototype behavior
   GSAP core + timeline. No plugins, no build step.
   Progressive enhancement: with this file removed, every link
   and button still works as a plain link.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Chrome/Edge drive the page change themselves through @view-transition.
  var nativeVT = !!document.startViewTransition && CSS.supports("view-transition-name", "a");

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var gsap = window.gsap;
    if (!gsap) return;                       // no library, no enhancement

    gsap.defaults({ ease: "power2.out", duration: .4 });
    var mm = gsap.matchMedia();

    /* ---------- the gold edge that wipes across at the seam ---------- */
    var wipe = document.createElement("div");
    wipe.className = "ym-wipe";
    wipe.setAttribute("aria-hidden", "true");
    document.body.appendChild(wipe);

    function sweep() {
      return gsap.timeline()
        .set(wipe, { opacity: 1, x: "-4vw" })
        .to(wipe, { x: "104vw", duration: .5, ease: "power2.inOut" })
        .to(wipe, { opacity: 0, duration: .18 }, "-=.14");
    }

    /* ---------- arrival ---------- */
    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, function () {
      var main = document.querySelector("main");
      if (!main) return;
      if (!nativeVT) {
        // Fallback browsers get the entrance from script instead.
        gsap.from(main, { y: 20, autoAlpha: 0, duration: .55, clearProps: "all" });
      }
      sweep();
    });

    /* ---------- leaving: only needed where the browser can't ---------- */
    function leave(href) {
      var main = document.querySelector("main");
      var tl = gsap.timeline({
        onComplete: function () { window.location.href = href; }
      });
      tl.add(sweep(), 0);
      if (main) tl.to(main, { y: -14, autoAlpha: 0, duration: .26, ease: "power2.in" }, 0);
      // Never strand the visitor behind an animation that stalled.
      setTimeout(function () { window.location.href = href; }, 700);
      return tl;
    }

    function internal(a) {
      return a && a.origin === location.origin && !a.hasAttribute("download") &&
             a.target !== "_blank" && !a.hash;
    }

    if (!nativeVT && !reduce) {
      document.body.classList.add("ym-fallback");
      document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        var a = e.target.closest("a");
        if (!internal(a) || a.closest(".ym-glitch")) return;
        e.preventDefault();
        leave(a.href);
      });
    }

    /* ---------- the glitch on the banner buttons ---------- */
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$/\\<>{}[]*+=_01";

    function wrapLabel(btn) {
      if (btn.querySelector(".ym-label")) return btn.querySelector(".ym-label");
      var text = btn.textContent.trim();
      var span = document.createElement("span");
      span.className = "ym-label";
      span.dataset.text = text;
      span.textContent = text;
      btn.textContent = "";
      btn.appendChild(span);
      btn.classList.add("ym-glitch");
      return span;
    }

    // Scramble the label, then resolve it left to right.
    function scramble(span) {
      var real = span.dataset.text, n = real.length;
      var state = { p: 0 };
      return gsap.to(state, {
        p: 1, duration: .34, ease: "power1.inOut",
        onUpdate: function () {
          var settled = Math.floor(state.p * n), out = "";
          for (var i = 0; i < n; i++) {
            var c = real[i];
            out += (i < settled || c === " ") ? c
                 : CHARS[(Math.random() * CHARS.length) | 0];
          }
          span.textContent = out;
        },
        onComplete: function () { span.textContent = real; }
      });
    }

    function glitch(btn, done) {
      var span = wrapLabel(btn);
      btn.classList.add("is-glitching");
      var tl = gsap.timeline({
        onComplete: function () {
          btn.classList.remove("is-glitching");
          gsap.set(btn, { clearProps: "x,skewX,--gx1,--gx2,--gc1,--gc2,--gc3,--gc4" });
          if (done) done();
        }
      });
      tl.add(scramble(span), 0)
        // channel split: two offset copies drift apart and snap back
        .to(btn, {
          duration: .34, ease: "none",
          keyframes: {
            "--gx1": ["0px", "-4px", "3px", "-2px", "0px"],
            "--gx2": ["0px", "5px", "-3px", "2px", "0px"],
            "--gc1": ["0%", "12%", "38%", "6%", "0%"],
            "--gc2": ["70%", "62%", "44%", "72%", "70%"],
            "--gc3": ["55%", "48%", "66%", "52%", "55%"],
            "--gc4": ["0%", "14%", "4%", "20%", "0%"]
          }
        }, 0)
        // the button itself stutters, hard cuts rather than smooth motion
        .to(btn, { x: -3, skewX: -6, duration: .05, ease: "none" }, 0)
        .to(btn, { x: 4, skewX: 5, duration: .05, ease: "none" }, .08)
        .to(btn, { x: -2, skewX: -3, duration: .05, ease: "none" }, .17)
        .to(btn, { x: 0, skewX: 0, duration: .09, ease: "power2.out" }, .25);
      return tl;
    }

    document.querySelectorAll(".btn, .pcta a, .herocta a").forEach(function (btn) {
      if (btn.dataset.ymGlitch) return;
      btn.dataset.ymGlitch = "1";
      wrapLabel(btn);

      btn.addEventListener("click", function (e) {
        if (reduce) return;                                   // straight through
        var newTab = btn.target === "_blank";
        var tel = btn.protocol === "tel:" || btn.protocol === "mailto:";
        // A new tab or a dialer must open on the click itself, or the browser
        // blocks it — so those glitch in place while the browser does its thing.
        if (newTab || tel) { glitch(btn); return; }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var href = btn.href;
        glitch(btn, function () {
          if (nativeVT || reduce) window.location.href = href;
          else leave(href);
        });
      });
    });
  });
})();
