/* ============================================================
   Aleksandar Dimoski — Portfolio
   Vanilla JS: reveals · nav · mobile menu · video lightbox ·
   Vimeo thumbnail fallback · gentle pointer parallax
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Lenis smooth scroll ----------
     Enhancement only: if the CDN is blocked or the user prefers reduced
     motion, everything below still works on native scrolling. */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* in-page links: hand off to Lenis so anchors glide instead of jumping */
  const HEADER_OFFSET = -96;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: HEADER_OFFSET, duration: 1.15 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
      history.replaceState(null, "", id);
    });
  });

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header elevation on scroll ---------- */
  const header = document.getElementById("site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById("nav-burger");
  const menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    const closeMenu = () => {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Open menu");
      menu.hidden = true;
    };
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      burger.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      menu.hidden = open;
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ---------- scroll-spy: highlight the current section in the nav ---------- */
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  if (navLinks.length && "IntersectionObserver" in window) {
    const linkFor = (id) => navLinks.find((a) => a.getAttribute("href") === "#" + id);
    const spySections = ["work", "services", "about", "results", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = linkFor(entry.target.id);
          if (!link) return;
          navLinks.forEach((a) => a.classList.remove("active"));
          link.classList.add("active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  /* ---------- scroll reveal ----------
     Held back until the preloader clears so the hero rises into view
     as the curtain lifts, instead of animating behind it. */
  const revealEls = document.querySelectorAll(".reveal");
  const initReveals = () => {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  };

  /* ---------- preloader ----------
     The CSS animation clears the overlay on its own; this only locks
     scrolling while it plays and starts the hero at the right moment. */
  const preloader = document.getElementById("preloader");
  const PRE_REVEAL_AT = 3900; // hero starts as the curtain lifts
  const PRE_DONE_AT = 4700; // overlay fully clear (CSS: 3.7s + 0.9s)

  if (preloader && !reduceMotion) {
    document.body.classList.add("is-loading");
    if (lenis) lenis.stop();
    /* always open on the hero, even on a mid-page refresh */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    setTimeout(initReveals, PRE_REVEAL_AT);
    setTimeout(() => {
      document.body.classList.remove("is-loading");
      if (lenis) lenis.start();
      preloader.style.display = "none";
    }, PRE_DONE_AT);
  } else {
    if (preloader) preloader.style.display = "none";
    initReveals();
  }

  /* ---------- stat counters (count up on scroll) ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const setFinal = (el) => {
    el.textContent = el.dataset.count + (el.dataset.suffix || "");
  };
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(setFinal);
  } else if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          cio.unobserve(entry.target);
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || "";
          const dur = 1400;
          const t0 = performance.now();
          const tick = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- image shimmer: stop it once the file paints ---------- */
  document.querySelectorAll(".vthumb, .shot").forEach((img) => {
    const ready = () => img.classList.add("img-ready");
    if (img.complete && img.naturalWidth > 0) {
      ready();
    } else {
      img.addEventListener("load", ready, { once: true });
      img.addEventListener("error", ready, { once: true });
    }
  });

  /* ---------- Vimeo thumbnail fallback ----------
     If thumbs/<id>.jpg is missing, load Vimeo's own thumbnail
     (vumbnail.com). If that also fails, keep the quiet gradient. */
  document.querySelectorAll(".vcard").forEach((card) => {
    const img = card.querySelector(".vthumb");
    if (!img) return;
    const src = card.dataset.video || "";
    const idMatch = src.match(/video\/(\d+)/);

    img.addEventListener("error", function handleError() {
      img.removeEventListener("error", handleError);
      if (idMatch) {
        img.addEventListener("error", () => img.classList.add("vthumb-missing"), { once: true });
        img.src = "https://vumbnail.com/" + idMatch[1] + ".jpg";
      } else {
        img.classList.add("vthumb-missing");
      }
    });
    /* cached failures fire before JS runs */
    if (img.complete && img.naturalWidth === 0 && img.src) {
      const current = img.src;
      img.src = "";
      img.src = current;
    }
  });

  /* ---------- video lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const playerBox = document.getElementById("lightbox-player");
  const captionEl = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  let lastFocused = null;

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    if (lenis) lenis.start();
    const done = () => {
      lightbox.hidden = true;
      playerBox.innerHTML = "";
      lightbox.classList.remove("is-wide");
    };
    reduceMotion ? done() : setTimeout(done, 300);
    if (lastFocused) lastFocused.focus();
  };

  const openLightbox = (card) => {
    const src = card.dataset.video;
    if (!src) return;

    const sep = src.includes("?") ? "&" : "?";
    const iframe = document.createElement("iframe");
    iframe.src = src + sep + "autoplay=1&title=0&byline=0&portrait=0&dnt=1";
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.title = card.dataset.title || "Video";

    lightbox.classList.toggle("is-wide", card.classList.contains("vcard--wide"));
    playerBox.innerHTML = "";
    playerBox.appendChild(iframe);

    const bits = [card.dataset.title, card.dataset.client].filter(Boolean);
    captionEl.textContent = bits.join(" · ");

    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    if (lenis) lenis.stop();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => lightbox.classList.add("is-open"));
    });
    closeBtn.focus();
  };

  document.querySelectorAll(".vcard").forEach((card) => {
    if (!card.dataset.video) return;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Play video: " + (card.dataset.title || "project video"));
    card.addEventListener("click", () => openLightbox(card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox(card);
      }
    });
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.querySelector("[data-close]").addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  /* keep focus inside the lightbox while open */
  lightbox.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusables = lightbox.querySelectorAll("button, iframe, [href]");
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------- gentle pointer parallax on hero floats ---------- */
  const floats = document.querySelectorAll("[data-depth]");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (!reduceMotion && finePointer && floats.length) {
    let raf = null;
    let mx = 0;
    let my = 0;
    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          floats.forEach((el) => {
            const depth = parseFloat(el.dataset.depth) || 0;
            el.style.transform = `translate3d(${(-mx * depth).toFixed(1)}px, ${(-my * depth).toFixed(1)}px, 0)`;
          });
        });
      },
      { passive: true }
    );
  }

  /* ---------- cursor-tracked spotlight on project cards ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".vcard .vframe").forEach((frame) => {
      let raf = null;
      frame.addEventListener(
        "pointermove",
        (e) => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = null;
            const r = frame.getBoundingClientRect();
            frame.style.setProperty("--spot-x", ((e.clientX - r.left) / r.width) * 100 + "%");
            frame.style.setProperty("--spot-y", ((e.clientY - r.top) / r.height) * 100 + "%");
          });
        },
        { passive: true }
      );
    });
  }

  /* ---------- Services: cursor spotlight ----------
     Feeds --svc-x / --svc-y to the .svc-card::after radial gradient.
     Gated on the existing finePointer + reduceMotion, so it never runs
     on touch devices or when reduced motion is requested. */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".svc-card").forEach((card) => {
      let raf = null;
      card.addEventListener(
        "pointermove",
        (e) => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = null;
            const r = card.getBoundingClientRect();
            card.style.setProperty("--svc-x", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
            card.style.setProperty("--svc-y", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
          });
        },
        { passive: true }
      );
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--svc-x");
        card.style.removeProperty("--svc-y");
      });
    });
  }

  /* ---------- magnetic pull on primary + ghost buttons ---------- */
  if (!reduceMotion && finePointer) {
    const STRENGTH = 0.28; // fraction of the cursor offset the button follows
    const MAX = 7; // px cap so it stays subtle
    document.querySelectorAll(".btn-primary, .btn-ghost, .social-pill").forEach((btn) => {
      let raf = null;
      const onMove = (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const x = Math.max(-MAX, Math.min(MAX, dx * STRENGTH));
          const y = Math.max(-MAX, Math.min(MAX, dy * STRENGTH));
          btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });
      };
      btn.addEventListener("pointermove", onMove, { passive: true });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- About timeline ----------
     The row crossing the middle band of the viewport becomes active, and
     the vertical line fills down to that row's node. Under reduced motion
     the line is simply shown complete and nothing is measured on scroll. */
  const abTimeline = document.getElementById("about-timeline");
  if (abTimeline) {
    const steps = [...abTimeline.querySelectorAll(".ab-step")];

    if (steps.length) {
      const setActive = (index) => {
        steps.forEach((step, i) => {
          const on = i === index;
          step.classList.toggle("is-active", on);
          if (on) step.setAttribute("aria-current", "step");
          else step.removeAttribute("aria-current");
        });
        if (reduceMotion) return;
        /* fill the line down to the centre of the active node */
        const listRect = abTimeline.getBoundingClientRect();
        const node = steps[index].querySelector(".ab-node");
        if (!node || !listRect.height) return;
        const nodeRect = node.getBoundingClientRect();
        const frac = (nodeRect.top + nodeRect.height / 2 - listRect.top) / listRect.height;
        abTimeline.style.setProperty("--ab-progress", Math.min(1, Math.max(0, frac)).toFixed(3));
      };

      if (reduceMotion || !("IntersectionObserver" in window)) {
        abTimeline.style.setProperty("--ab-progress", "1");
        setActive(0);
      } else {
        setActive(0);
        const inBand = new Set();
        const abIO = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const i = steps.indexOf(entry.target);
              if (entry.isIntersecting) inBand.add(i);
              else inBand.delete(i);
            });
            if (inBand.size) setActive(Math.min(...inBand));
          },
          /* only count a row once it reaches the middle of the screen */
          { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
        );
        steps.forEach((step) => abIO.observe(step));

        window.addEventListener(
          "resize",
          () => {
            const current = steps.findIndex((s) => s.classList.contains("is-active"));
            if (current > -1) setActive(current);
          },
          { passive: true }
        );
      }
    }
  }

  /* ---------- Results coverflow ----------
     Cards are absolutely stacked; each one's transform is derived from its
     signed distance to the active index, wrapped circularly so the list
     loops in both directions. `pos` is a float so dragging tracks 1:1. */
  const cfStage = document.getElementById("cf-stage");
  const cfTrack = document.getElementById("cf-track");
  if (cfStage && cfTrack) {
    const cards = [...cfTrack.querySelectorAll(".cf-item")];
    const dotsWrap = document.getElementById("cf-dots");
    const n = cards.length;

    if (n > 0) {
      const VISIBLE = 2; // cards shown either side of centre
      let active = 0;
      let pos = 0;

      const dots = cards.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cf-dot";
        b.setAttribute("aria-label", `Show screenshot ${i + 1} of ${n}`);
        b.addEventListener("click", () => go(i));
        dotsWrap.appendChild(b);
        return b;
      });

      /* horizontal step between cards, derived from the rendered card width */
      const spacing = () => Math.max(80, (cards[0].offsetWidth || 240) * 0.56);

      /* shortest signed distance from card i to position p, on a ring of n */
      const wrap = (i, p) => {
        let off = i - p;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        return off;
      };

      function render(p) {
        const step = spacing();
        cards.forEach((el, i) => {
          const off = wrap(i, p);
          const dist = Math.abs(off);
          const shown = dist <= VISIBLE + 0.5;
          const scale = Math.max(0.62, 1 - dist * 0.13);
          const rotY = Math.max(-34, Math.min(34, -off * 24));
          const depth = -dist * 130;
          el.style.transform =
            `translate(-50%, -50%) translate3d(${(off * step).toFixed(1)}px, 0, ${depth.toFixed(1)}px)` +
            ` rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
          el.style.opacity = shown ? String(Math.max(0, 1 - dist * 0.3).toFixed(2)) : "0";
          el.style.zIndex = String(100 - Math.round(dist * 10));
          el.style.pointerEvents = shown ? "auto" : "none";
          el.classList.toggle("is-active", dist < 0.5);
        });
      }

      function go(i) {
        active = ((Math.round(i) % n) + n) % n;
        pos = active;
        cfTrack.classList.remove("is-dragging");
        render(pos);
        dots.forEach((d, k) => d.setAttribute("aria-current", k === active ? "true" : "false"));
      }

      document.getElementById("cf-prev").addEventListener("click", () => go(active - 1));
      document.getElementById("cf-next").addEventListener("click", () => go(active + 1));

      /* keyboard */
      cfStage.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
      });

      /* drag (mouse) and swipe (touch) */
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startPos = 0;

      cfStage.addEventListener("pointerdown", (e) => {
        dragging = true;
        moved = false;
        startX = e.clientX;
        startPos = active;
        cfTrack.classList.add("is-dragging");
        try { cfStage.setPointerCapture(e.pointerId); } catch (_) {}
      });

      cfStage.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        pos = startPos - dx / spacing();
        render(pos);
      });

      const endDrag = (e) => {
        if (!dragging) return;
        dragging = false;
        cfTrack.classList.remove("is-dragging");
        const delta = pos - startPos;
        /* past ~a fifth of a card commits to the next one */
        const stepped = Math.abs(delta) > 0.2
          ? Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta)))
          : 0;
        go(startPos + stepped);
        if (e && e.pointerId != null) {
          try { cfStage.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      cfStage.addEventListener("pointerup", endDrag);
      cfStage.addEventListener("pointercancel", endDrag);

      /* clicking a side card brings it to the front (ignored after a drag) */
      cards.forEach((el, i) => {
        el.addEventListener("click", () => {
          if (moved) return;
          if (i !== active) go(i);
        });
      });

      window.addEventListener("resize", () => render(pos), { passive: true });
      go(0);
    }
  }

  /* ---------- custom cursor: precise dot + trailing ring ---------- */
  const ring = document.getElementById("cursor-ring");
  const dot = document.getElementById("cursor-dot");
  if (!reduceMotion && finePointer && ring && dot) {
    document.documentElement.classList.add("cursor-on");

    const INTERACTIVE = 'a, button, .vcard, [role="button"]';
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let targetScale = 1;
    let awake = false;

    const wake = (on) => {
      awake = on;
      ring.classList.toggle("is-awake", on);
      dot.classList.toggle("is-awake", on);
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        if (!awake) wake(true);
      },
      { passive: true }
    );

    /* the ring eases toward the pointer — that lag is the whole effect */
    const tick = () => {
      rx += (mx - rx) * 0.17;
      ry += (my - ry) * 0.17;
      scale += (targetScale - scale) * 0.14;
      ring.style.transform =
        `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const restingScale = () =>
      ring.classList.contains("is-media") ? 1.7
        : ring.classList.contains("is-hover") ? 1.45
        : ring.classList.contains("is-word") ? 1.28
        : 1;

    /* Hero headline hover. Lives inside the cursor block on purpose, so it
       is already gated by finePointer + reduceMotion and never fires on
       touch. Only toggles a class — the sweep and tint are CSS. */
    const heroName = document.querySelector(".ht-name");
    if (heroName) {
      heroName.addEventListener("pointerenter", () => {
        heroName.classList.add("is-hot");
        ring.classList.add("is-word");
        targetScale = restingScale();
      });
      heroName.addEventListener("pointerleave", () => {
        heroName.classList.remove("is-hot");
        ring.classList.remove("is-word");
        targetScale = restingScale();
      });
    }

    document.addEventListener("pointerover", (e) => {
      if (!(e.target instanceof Element)) return;
      const el = e.target.closest(INTERACTIVE);
      if (!el) return;
      ring.classList.add("is-hover");
      ring.classList.toggle("is-media", el.classList.contains("vcard"));
      targetScale = restingScale();
    });

    document.addEventListener("pointerout", (e) => {
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest(INTERACTIVE)) return;
      const to = e.relatedTarget;
      if (to instanceof Element && to.closest(INTERACTIVE)) return;
      ring.classList.remove("is-hover", "is-media");
      targetScale = 1;
    });

    document.addEventListener("pointerdown", () => { targetScale = restingScale() * 0.78; });
    document.addEventListener("pointerup", () => { targetScale = restingScale(); });

    document.documentElement.addEventListener("mouseleave", () => wake(false));
    document.documentElement.addEventListener("mouseenter", () => wake(true));
  }
})();
