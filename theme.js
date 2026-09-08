(() => {
  const STORAGE_KEY = "meteopanel-theme-v1";
  const VALID_THEMES = new Set(["auto", "light", "ocean-night", "coastal-light"]);
  const PRIMARY_THEMES = new Set(["ocean-night", "coastal-light"]);
  const DARK_MEDIA = window.matchMedia("(prefers-color-scheme: dark)");
  const REDUCED_MOTION_MEDIA = window.matchMedia("(prefers-reduced-motion: reduce)");
  const THEME_TRANSITION_MS = 430;

  let transitionTimer = null;
  let selectionSequence = 0;

  const readStoredTheme = () => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return VALID_THEMES.has(value) ? value : "auto";
    } catch {
      return "auto";
    }
  };

  const getThemeColor = (theme) => {
    if (theme === "ocean-night") return "#07141c";
    if (theme === "coastal-light") return "#eef8fc";
    if (theme === "light") return "#eef2f6";
    return DARK_MEDIA.matches ? "#0e151b" : "#eef2f6";
  };

  const applyTheme = (theme) => {
    const safeTheme = VALID_THEMES.has(theme) ? theme : "auto";
    document.documentElement.dataset.theme = safeTheme;
    document.documentElement.style.colorScheme = safeTheme === "ocean-night"
      ? "dark"
      : safeTheme === "light" || safeTheme === "coastal-light"
        ? "light"
        : "light dark";

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) metaThemeColor.setAttribute("content", getThemeColor(safeTheme));

    return safeTheme;
  };

  let activeTheme = applyTheme(readStoredTheme());

  const persistTheme = () => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTheme);
    } catch {
      // A preferência continua válida durante a sessão mesmo sem localStorage.
    }
  };

  function syncThemeControls() {
    const primaryControl = document.getElementById("themePrimaryControl");
    const settingsMenu = document.getElementById("settingsMenu");
    const status = document.getElementById("settingsThemeStatus");

    if (primaryControl) {
      primaryControl.dataset.primaryTheme = PRIMARY_THEMES.has(activeTheme) ? activeTheme : "none";
    }

    document.querySelectorAll("[data-theme-choice]").forEach((control) => {
      control.setAttribute("aria-pressed", String(control.dataset.themeChoice === activeTheme));
    });

    if (settingsMenu) {
      settingsMenu.dataset.secondaryActive = String(!PRIMARY_THEMES.has(activeTheme));
    }

    if (status) {
      const labels = {
        auto: "Automático",
        light: "Claro clássico",
        "ocean-night": "Ocean Night",
        "coastal-light": "Coastal Light"
      };
      status.textContent = `Tema atual: ${labels[activeTheme] || activeTheme}`;
    }
  }

  function beginVisualTransition() {
    const root = document.documentElement;

    if (REDUCED_MOTION_MEDIA.matches) {
      root.classList.remove("theme-transitioning");
      return false;
    }

    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }

    root.classList.remove("theme-transitioning");
    void root.offsetWidth;
    root.classList.add("theme-transitioning");
    void root.offsetWidth;
    return true;
  }

  function scheduleTransitionCleanup() {
    transitionTimer = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
      transitionTimer = null;
    }, THEME_TRANSITION_MS);
  }

  function commitTheme(theme, { persist = true, force = false } = {}) {
    const safeTheme = VALID_THEMES.has(theme) ? theme : "auto";

    if (!force && safeTheme === activeTheme) {
      syncThemeControls();
      return;
    }

    const animated = beginVisualTransition();
    activeTheme = applyTheme(safeTheme);
    if (persist) persistTheme();
    syncThemeControls();

    if (animated) scheduleTransitionCleanup();
  }

  function selectTheme(theme) {
    const safeTheme = VALID_THEMES.has(theme) ? theme : "auto";
    const sequence = ++selectionSequence;

    if (safeTheme === activeTheme) {
      syncThemeControls();
      return;
    }

    const primaryControl = document.getElementById("themePrimaryControl");
    const shouldLeadWithSlider = Boolean(
      primaryControl
      && !REDUCED_MOTION_MEDIA.matches
      && PRIMARY_THEMES.has(activeTheme)
      && PRIMARY_THEMES.has(safeTheme)
    );

    if (!shouldLeadWithSlider) {
      commitTheme(safeTheme);
      return;
    }

    // Move o indicador primeiro por alguns frames para que o deslocamento seja
    // perceptível antes da paleta inteira começar a mudar.
    primaryControl.dataset.primaryTheme = safeTheme;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (sequence !== selectionSequence) return;
        commitTheme(safeTheme);
      });
    });
  }

  function initThemeControls() {
    const primaryControl = document.getElementById("themePrimaryControl");
    const settingsMenu = document.getElementById("settingsMenu");
    const settingsTrigger = settingsMenu?.querySelector("summary");

    if (primaryControl && !primaryControl.querySelector(".theme-slider")) {
      const slider = document.createElement("span");
      slider.className = "theme-slider";
      slider.setAttribute("aria-hidden", "true");
      primaryControl.prepend(slider);
    }

    document.querySelectorAll("[data-theme-choice]").forEach((control) => {
      control.addEventListener("click", () => {
        selectTheme(control.dataset.themeChoice);
        if (settingsMenu?.contains(control)) settingsMenu.removeAttribute("open");
      });
    });

    primaryControl?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const nextTheme = event.key === "ArrowLeft" ? "ocean-night" : "coastal-light";
      selectTheme(nextTheme);
      primaryControl.querySelector(`[data-theme-choice="${nextTheme}"]`)?.focus();
    });

    document.addEventListener("click", (event) => {
      if (settingsMenu?.open && !settingsMenu.contains(event.target)) {
        settingsMenu.removeAttribute("open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && settingsMenu?.open) {
        settingsMenu.removeAttribute("open");
        settingsTrigger?.focus();
      }
    });

    syncThemeControls();

    // Evita uma animação artificial no carregamento inicial quando existe
    // uma preferência salva; o slider passa a animar somente depois do 1º paint.
    requestAnimationFrame(() => {
      if (primaryControl) primaryControl.dataset.sliderReady = "true";
    });
  }

  const handleSystemThemeChange = () => {
    if (activeTheme === "auto") {
      ++selectionSequence;
      commitTheme("auto", { persist: false, force: true });
    }
  };

  if (typeof DARK_MEDIA.addEventListener === "function") {
    DARK_MEDIA.addEventListener("change", handleSystemThemeChange);
  } else if (typeof DARK_MEDIA.addListener === "function") {
    DARK_MEDIA.addListener(handleSystemThemeChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeControls, { once: true });
  } else {
    initThemeControls();
  }
})();
