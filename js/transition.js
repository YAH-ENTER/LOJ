/* ============================================================
   Page transitions + CTA glitch. Plain JavaScript, no library.
   Progressive enhancement: with this file removed, every link and
   button still works as a plain link.
   ============================================================ */
(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Chrome/Edge/Safari 18.2+ run the page change themselves via @view-transition.
  // Where they do, this file adds no arrival animation — a second one on top of
  // the browser's reads as a stutter, especially on phones.
  var nativeVT = !!document.startViewTransition &&
                 CSS.supports("view-transition-name", "a");

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var EASE_IN  = "cubic-bezier(.16,.7,.24,1)";
    var EASE_OUT = "cubic-bezier(.4,0,1,1)";
    var canAnimate = typeof Element.prototype.animate === "function";

    /* ---------------- the gold edge (fallback browsers only) ------------- */
    var wipe = null;
    function sweep() {
      if (!canAnimate) return null;
      if (!wipe) {
        wipe = document.createElement("div");
        wipe.className = "ym-wipe";
        wipe.setAttribute("aria-hidden", "true");
        document.body.appendChild(wipe);
      }
      return wipe.animate(
        [{ opacity: 1, transform: "translateX(-4vw)" },
         { opacity: 1, transform: "translateX(70vw)", offset: .7 },
         { opacity: 0, transform: "translateX(104vw)" }],
        { duration: 500, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
      );
    }

    /* ---------------- arrival ---------------- */
    if (!nativeVT && !reduce && canAnimate) {
      var main = document.querySelector("main");
      if (main) {
        main.animate(
          [{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }],
          { duration: 420, easing: EASE_IN }
        );
      }
      sweep();
    }

    /* ---------------- leaving (fallback browsers only) ---------------- */
    function leave(href) {
      if (!canAnimate || reduce) { location.href = href; return; }
      var main = document.querySelector("main");
      var done = false;
      function go() { if (!done) { done = true; location.href = href; } }
      sweep();
      if (main) {
        var a = main.animate(
          [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-12px)" }],
          { duration: 260, easing: EASE_OUT, fill: "forwards" }
        );
        a.onfinish = go;
      }
      // Never strand anyone behind an animation that stalled.
      setTimeout(go, 600);
    }

    function internal(a) {
      return a && a.origin === location.origin && !a.hasAttribute("download") &&
             a.target !== "_blank" && !a.hash;
    }

    if (!nativeVT && !reduce) {
      document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        var a = e.target.closest("a");
        if (!internal(a) || a.classList.contains("ym-glitch")) return;
        e.preventDefault();
        leave(a.href);
      });
    }

    /* ---------------- the glitch on the CTA buttons ---------------- */
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$/\\<>{}[]*+=_01";
    var DURATION = 340;

    function prepare(btn) {
      if (btn.querySelector(".ym-label")) return;
      var text = btn.textContent.trim();
      var label = document.createElement("span");
      label.className = "ym-label";
      label.dataset.text = text;
      label.textContent = text;
      var scan = document.createElement("span");
      scan.className = "ym-scan";
      scan.setAttribute("aria-hidden", "true");
      btn.textContent = "";
      btn.append(label, scan);
      btn.classList.add("ym-glitch");
    }

    // Scramble the label, then resolve it left to right.
    function scramble(label, ms) {
      var real = label.dataset.text, n = real.length, start = performance.now();
      (function frame(now) {
        var p = Math.min((now - start) / ms, 1);
        var settled = Math.floor(p * n), out = "";
        for (var i = 0; i < n; i++) {
          var c = real[i];
          out += (i < settled || c === " ") ? c : CHARS[(Math.random() * CHARS.length) | 0];
        }
        label.textContent = out;
        if (p < 1) requestAnimationFrame(frame);
        else label.textContent = real;
      })(start);
    }

    function glitch(btn, done) {
      var label = btn.querySelector(".ym-label");
      btn.classList.add("is-glitching");
      scramble(label, DURATION);
      setTimeout(function () {
        btn.classList.remove("is-glitching");
        label.textContent = label.dataset.text;
        if (done) done();
      }, DURATION);
    }

    document.querySelectorAll(".btn, .pcta a, .herocta a").forEach(function (btn) {
      if (btn.dataset.ymGlitch) return;
      btn.dataset.ymGlitch = "1";
      prepare(btn);

      btn.addEventListener("click", function (e) {
        if (reduce) return;
        // A new tab or the dialer has to open on the click itself, or the
        // browser blocks it — those glitch in place instead.
        if (btn.target === "_blank" || btn.protocol === "tel:" || btn.protocol === "mailto:") {
          glitch(btn);
          return;
        }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        var href = btn.href;
        glitch(btn, function () {
          if (nativeVT) location.href = href;
          else leave(href);
        });
      });
    });
  });
})();
