(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const loaderTimers = new Set();

  const syncMotionVisibility = () => {
    root.classList.toggle("motion-paused", document.hidden);
  };

  document.addEventListener("visibilitychange", syncMotionVisibility);
  syncMotionVisibility();

  const schedule = (callback, delay) => {
    const timer = window.setTimeout(() => {
      loaderTimers.delete(timer);
      callback();
    }, delay);
    loaderTimers.add(timer);
  };

  const finishLoader = () => {
    const loader = document.querySelector("[data-system-loader]");
    if (!loader || loader.classList.contains("is-exiting")) {
      return;
    }

    loaderTimers.forEach((timer) => window.clearTimeout(timer));
    loaderTimers.clear();
    loader.classList.add("is-exiting");

    const announcement = document.querySelector("[data-loader-announcement]");
    if (announcement) {
      announcement.textContent = "VidyutSpanda is ready.";
    }

    loader.addEventListener("transitionend", (event) => {
      if (event.target === loader) {
        loader.remove();
      }
    }, { once: true });
    schedule(() => loader.remove(), 700);
  };

  const initializeScrollReveals = () => {
    const targets = document.querySelectorAll(".reveal-on-scroll, [data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window) || targets.length === 0) {
      return;
    }

    let observer;
    try {
      observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      targets.forEach((target) => observer.observe(target));
    } catch {
      observer?.disconnect();
      return;
    }

    root.classList.add("reveal-ready");
  };

  const initialize = () => {
    const loader = document.querySelector("[data-system-loader]");
    if (reduceMotion) {
      if (loader) {
        loader.remove();
      }
      const announcement = document.querySelector("[data-loader-announcement]");
      if (announcement) {
        announcement.textContent = "VidyutSpanda is ready.";
      }
      return;
    }

    if (loader) {
      schedule(finishLoader, 3800);
      const stages = loader.querySelectorAll(".loader-stages span");
      const updateStage = (stage) => {
        if (!loader.isConnected) {
          return;
        }
        loader.dataset.loaderStage = String(stage);
        stages.forEach((label, index) => label.classList.toggle("is-current", index === stage));
      };

      schedule(() => updateStage(1), 740);
      schedule(() => updateStage(2), 1480);
      schedule(() => updateStage(3), 2020);
      schedule(finishLoader, 2380);
    }

    initializeScrollReveals();
  };

  document.addEventListener("DOMContentLoaded", () => {
    try {
      initialize();
    } catch {
      finishLoader();
    }
  }, { once: true });

  if (!reduceMotion) {
    root.classList.add("motion-prepared");
  }
})();
