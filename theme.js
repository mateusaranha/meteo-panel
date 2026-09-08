(() => {
  const STORAGE_KEY = "meteopanel-theme-v1";
  const VALID_THEMES = new Set(["auto", "light", "ocean-night", "coastal-light", "tidal-dusk", "abyssal"]);
  const AUTHOR_THEMES = ["coastal-light", "tidal-dusk", "ocean-night", "abyssal"];
  const AUTHOR_THEME_SET = new Set(AUTHOR_THEMES);
  const COMPASS_ANGLES = {
    "coastal-light": 0,
    "tidal-dusk": 90,
    "ocean-night": 180,
    abyssal: 270
  };
  const THEME_LABELS = {
    auto: "Automático",
    light: "Claro clássico",
    "coastal-light": "Coastal Light",
    "tidal-dusk": "Tidal Dusk",
    "ocean-night": "Ocean Night",
    abyssal: "Abyssal"
  };
  const THEME_DESCRIPTIONS = {
    auto: "Segue o sistema",
    light: "Aparência original",
    "coastal-light": "Costa luminosa",
    "tidal-dusk": "Entardecer costeiro",
    "ocean-night": "Mar noturno",
    abyssal: "Profundidade abissal"
  };
  const THEME_SYMBOLS = {
    auto: "◌",
    light: "☀",
    "coastal-light": "☀",
    "tidal-dusk": "◒",
    "ocean-night": "☾",
    abyssal: "≋"
  };
  const DARK_MEDIA = window.matchMedia("(prefers-color-scheme: dark)");
  const REDUCED_MOTION_MEDIA = window.matchMedia("(prefers-reduced-motion: reduce)");
  const MOBILE_MEDIA = window.matchMedia("(max-width: 900px)");
  const THEME_TRANSITION_MS = 760;
  const COMPASS_LEAD_MS = 110;
  const COMPASS_IDLE_MS = 5000;
  const COMPASS_SELECTION_CLOSE_MS = 1200;
  const COMPASS_SELECTION_CLOSE_MOBILE_MS = 700;
  const MOTION_STYLESHEET_ID = "themeMotionStylesheet";
  const COLLAPSE_STYLESHEET_ID = "themeCompassCollapseStylesheet";

  let transitionTimer = null;
  let selectionLeadTimer = null;
  let compassIdleTimer = null;
  let compassSelectionCloseTimer = null;
  let selectionSequence = 0;
  let compassVisualAngle = null;

  const ensureMotionStylesheet = () => {
    if (document.getElementById(MOTION_STYLESHEET_ID)) return;
    const link = document.createElement("link");
    link.id = MOTION_STYLESHEET_ID;
    link.rel = "stylesheet";
    link.href = "theme-motion.css?v=20260908-20";
    document.head.appendChild(link);
  };

  const ensureCollapseStylesheet = () => {
    if (document.getElementById(COLLAPSE_STYLESHEET_ID)) return;
    const link = document.createElement("link");
    link.id = COLLAPSE_STYLESHEET_ID;
    link.rel = "stylesheet";
    link.href = "theme-compass-collapse.css?v=20260908-31";
    document.head.appendChild(link);
  };

  ensureMotionStylesheet();
  ensureCollapseStylesheet();

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
    if (theme === "tidal-dusk") return "#1b2130";
    if (theme === "abyssal") return "#000304";
    if (theme === "light") return "#eef2f6";
    return DARK_MEDIA.matches ? "#0e151b" : "#eef2f6";
  };

  const applyTheme = (theme) => {
    const safeTheme = VALID_THEMES.has(theme) ? theme : "auto";
    document.documentElement.dataset.theme = safeTheme;

    const isDarkTheme = safeTheme === "ocean-night" || safeTheme === "tidal-dusk" || safeTheme === "abyssal";
    const isLightTheme = safeTheme === "light" || safeTheme === "coastal-light";
    document.documentElement.style.colorScheme = isDarkTheme
      ? "dark"
      : isLightTheme
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

  function buildThemeCompass() {
    const wrap = document.querySelector(".theme-primary-wrap");
    if (!wrap || document.getElementById("themeCompass")) return;

    wrap.innerHTML = `
      <span class="theme-label" id="themePrimaryLabel">Tema</span>
      <div class="theme-picker" id="themePicker">
        <button class="theme-picker-trigger" id="themeCompassTrigger" type="button" aria-expanded="false" aria-controls="themeCompassPanel">
          <span class="theme-picker-trigger-icon" id="themePickerTriggerIcon" aria-hidden="true">☾</span>
          <span id="themePickerTriggerLabel">Ocean Night</span>
          <span class="theme-picker-chevron" aria-hidden="true"></span>
        </button>
        <div class="theme-compass-panel" id="themeCompassPanel">
          <div class="theme-compass" id="themeCompass" role="group" aria-labelledby="themePrimaryLabel" data-has-active="false" data-compass-ready="false">
            <span class="theme-compass-orbit" aria-hidden="true"><span class="theme-compass-puck"></span></span>
            <button class="theme-compass-choice" type="button" data-theme-choice="coastal-light" aria-pressed="false" aria-label="Usar tema Coastal Light">
              <span class="theme-compass-symbol" aria-hidden="true">☀</span>
              <span class="theme-compass-choice-name">Coastal Light</span>
            </button>
            <button class="theme-compass-choice" type="button" data-theme-choice="tidal-dusk" aria-pressed="false" aria-label="Usar tema Tidal Dusk">
              <span class="theme-compass-symbol" aria-hidden="true">◒</span>
              <span class="theme-compass-choice-name">Tidal Dusk</span>
            </button>
            <button class="theme-compass-choice" type="button" data-theme-choice="ocean-night" aria-pressed="false" aria-label="Usar tema Ocean Night">
              <span class="theme-compass-symbol" aria-hidden="true">☾</span>
              <span class="theme-compass-choice-name">Ocean Night</span>
            </button>
            <button class="theme-compass-choice" type="button" data-theme-choice="abyssal" aria-pressed="false" aria-label="Usar tema Abyssal">
              <span class="theme-compass-symbol" aria-hidden="true">≋</span>
              <span class="theme-compass-choice-name">Abyssal</span>
            </button>
            <div class="theme-compass-center" aria-live="polite">
              <span class="theme-compass-center-icon" id="themeCompassCenterIcon" data-theme-icon="ocean-night" aria-hidden="true">☾</span>
              <strong id="themeCompassCenterName">Ocean Night</strong>
              <small id="themeCompassCenterDescription">Mar noturno</small>
            </div>
          </div>
        </div>
      </div>`;

    const settingsMenu = document.getElementById("settingsMenu");
    settingsMenu?.querySelectorAll('[data-theme-choice="tidal-dusk"], [data-theme-choice="abyssal"]').forEach((control) => control.remove());
  }

  function getNearestCompassAngle(theme) {
    const baseAngle = COMPASS_ANGLES[theme];
    if (typeof baseAngle !== "number") return compassVisualAngle;
    if (compassVisualAngle === null) return baseAngle;

    const nearestTurn = Math.round((compassVisualAngle - baseAngle) / 360);
    const candidates = [nearestTurn - 1, nearestTurn, nearestTurn + 1]
      .map((turn) => baseAngle + turn * 360);

    return candidates.reduce((best, candidate) => (
      Math.abs(candidate - compassVisualAngle) < Math.abs(best - compassVisualAngle)
        ? candidate
        : best
    ));
  }

  function moveCompassTo(theme) {
    const compass = document.getElementById("themeCompass");
    if (!compass) return;

    if (!AUTHOR_THEME_SET.has(theme)) {
      compass.dataset.hasActive = "false";
      return;
    }

    compassVisualAngle = getNearestCompassAngle(theme);
    compass.style.setProperty("--theme-compass-angle", `${compassVisualAngle}deg`);
    compass.dataset.hasActive = "true";
  }

  function syncDisplayIcon(element, theme, symbol) {
    if (!element) return;
    element.textContent = symbol;
    element.dataset.themeIcon = theme;

    const useTextFallback = !AUTHOR_THEME_SET.has(theme);
    element.style.background = useTextFallback ? "none" : "";
    element.style.webkitMaskImage = useTextFallback ? "none" : "";
    element.style.maskImage = useTextFallback ? "none" : "";
    element.style.fontSize = useTextFallback ? "1rem" : "";
  }

  function syncThemeControls() {
    const compass = document.getElementById("themeCompass");
    const settingsMenu = document.getElementById("settingsMenu");
    const status = document.getElementById("settingsThemeStatus");
    const triggerIcon = document.getElementById("themePickerTriggerIcon");
    const triggerLabel = document.getElementById("themePickerTriggerLabel");
    const centerIcon = document.getElementById("themeCompassCenterIcon");
    const centerName = document.getElementById("themeCompassCenterName");
    const centerDescription = document.getElementById("themeCompassCenterDescription");

    document.querySelectorAll("[data-theme-choice]").forEach((control) => {
      control.setAttribute("aria-pressed", String(control.dataset.themeChoice === activeTheme));
    });

    moveCompassTo(activeTheme);

    if (compass) {
      compass.dataset.activeTheme = AUTHOR_THEME_SET.has(activeTheme) ? activeTheme : "secondary";
    }

    if (settingsMenu) {
      settingsMenu.dataset.secondaryActive = String(!AUTHOR_THEME_SET.has(activeTheme));
    }

    const label = THEME_LABELS[activeTheme] || activeTheme;
    const description = THEME_DESCRIPTIONS[activeTheme] || "";
    const symbol = THEME_SYMBOLS[activeTheme] || "◌";

    syncDisplayIcon(triggerIcon, activeTheme, symbol);
    if (triggerLabel) triggerLabel.textContent = label;
    syncDisplayIcon(centerIcon, activeTheme, symbol);
    if (centerName) centerName.textContent = label;
    if (centerDescription) centerDescription.textContent = description;
    if (status) status.textContent = `Tema atual: ${label}`;
  }

  function beginVisualTransition() {
    const root = document.documentElement;

    if (REDUCED_MOTION_MEDIA.matches) {
      root.classList.remove("theme-transitioning");
      root.style.removeProperty("--theme-transition-from-background");
      return false;
    }

    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }

    const currentBackground = document.body
      ? getComputedStyle(document.body).background
      : getComputedStyle(root).backgroundColor;

    root.style.setProperty("--theme-transition-from-background", currentBackground);
    root.classList.remove("theme-transitioning");
    void root.offsetWidth;
    root.classList.add("theme-transitioning");
    void root.offsetWidth;
    return true;
  }

  function scheduleTransitionCleanup() {
    transitionTimer = window.setTimeout(() => {
      const root = document.documentElement;
      root.classList.remove("theme-transitioning");
      root.style.removeProperty("--theme-transition-from-background");
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

    if (selectionLeadTimer) {
      clearTimeout(selectionLeadTimer);
      selectionLeadTimer = null;
    }

    if (AUTHOR_THEME_SET.has(safeTheme)) moveCompassTo(safeTheme);

    const shouldLeadWithCompass = Boolean(
      document.getElementById("themeCompass")
      && !REDUCED_MOTION_MEDIA.matches
      && AUTHOR_THEME_SET.has(activeTheme)
      && AUTHOR_THEME_SET.has(safeTheme)
    );

    if (!shouldLeadWithCompass) {
      commitTheme(safeTheme);
      return;
    }

    selectionLeadTimer = window.setTimeout(() => {
      selectionLeadTimer = null;
      if (sequence !== selectionSequence) return;
      commitTheme(safeTheme);
    }, COMPASS_LEAD_MS);
  }

  function clearCompassIdleTimer() {
    if (!compassIdleTimer) return;
    clearTimeout(compassIdleTimer);
    compassIdleTimer = null;
  }

  function clearCompassSelectionCloseTimer() {
    if (!compassSelectionCloseTimer) return;
    clearTimeout(compassSelectionCloseTimer);
    compassSelectionCloseTimer = null;
  }

  function clearCompassTimers() {
    clearCompassIdleTimer();
    clearCompassSelectionCloseTimer();
  }

  function compassHasKeyboardFocus() {
    const compass = document.getElementById("themeCompass");
    return Boolean(compass && compass.contains(document.activeElement));
  }

  function scheduleCompassIdle(delay = COMPASS_IDLE_MS) {
    const picker = document.getElementById("themePicker");
    if (!picker?.classList.contains("is-open")) return;

    clearCompassIdleTimer();
    compassIdleTimer = window.setTimeout(() => {
      compassIdleTimer = null;
      if (!picker.classList.contains("is-open")) return;

      if (compassHasKeyboardFocus() || picker.matches(":hover")) {
        scheduleCompassIdle();
        return;
      }

      closeCompassPanel();
    }, delay);
  }

  function openCompassPanel({ focusActiveChoice = false } = {}) {
    const picker = document.getElementById("themePicker");
    const trigger = document.getElementById("themeCompassTrigger");
    const settingsMenu = document.getElementById("settingsMenu");
    const compass = document.getElementById("themeCompass");
    if (!picker || !trigger) return;

    settingsMenu?.removeAttribute("open");
    clearCompassTimers();
    picker.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");

    if (focusActiveChoice) {
      requestAnimationFrame(() => {
        const activeChoice = compass?.querySelector('[aria-pressed="true"]')
          || compass?.querySelector(".theme-compass-choice");
        activeChoice?.focus();
      });
      return;
    }

    scheduleCompassIdle();
  }

  function closeCompassPanel({ restoreFocus = false } = {}) {
    const picker = document.getElementById("themePicker");
    const trigger = document.getElementById("themeCompassTrigger");
    if (!picker?.classList.contains("is-open")) return;

    clearCompassTimers();
    picker.classList.remove("is-open");
    trigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  function scheduleCompassCloseAfterSelection({ restoreFocus = true } = {}) {
    const delay = MOBILE_MEDIA.matches
      ? COMPASS_SELECTION_CLOSE_MOBILE_MS
      : COMPASS_SELECTION_CLOSE_MS;

    clearCompassTimers();
    compassSelectionCloseTimer = window.setTimeout(() => {
      compassSelectionCloseTimer = null;
      closeCompassPanel({ restoreFocus });
    }, delay);
  }

  function initThemeControls() {
    buildThemeCompass();

    const compass = document.getElementById("themeCompass");
    const picker = document.getElementById("themePicker");
    const pickerTrigger = document.getElementById("themeCompassTrigger");
    const settingsMenu = document.getElementById("settingsMenu");
    const settingsTrigger = settingsMenu?.querySelector("summary");

    document.querySelectorAll("[data-theme-choice]").forEach((control) => {
      control.addEventListener("click", (event) => {
        selectTheme(control.dataset.themeChoice);

        if (settingsMenu?.contains(control)) {
          settingsMenu.removeAttribute("open");
          return;
        }

        if (!compass?.contains(control)) return;

        if (event.detail === 0) {
          clearCompassTimers();
          return;
        }

        control.blur();
        scheduleCompassCloseAfterSelection();
      });
    });

    pickerTrigger?.addEventListener("click", (event) => {
      const willOpen = !picker?.classList.contains("is-open");
      if (willOpen) {
        openCompassPanel({ focusActiveChoice: event.detail === 0 });
      } else {
        closeCompassPanel();
      }
    });

    settingsTrigger?.addEventListener("click", () => {
      closeCompassPanel();
    });

    picker?.addEventListener("pointermove", () => {
      if (!picker.classList.contains("is-open")) return;
      clearCompassSelectionCloseTimer();
      scheduleCompassIdle();
    }, { passive: true });

    picker?.addEventListener("pointerenter", () => {
      if (!picker.classList.contains("is-open")) return;
      clearCompassSelectionCloseTimer();
      scheduleCompassIdle();
    });

    picker?.addEventListener("pointerleave", () => {
      if (picker.classList.contains("is-open")) scheduleCompassIdle();
    });

    compass?.addEventListener("focusin", () => {
      clearCompassTimers();
    });

    compass?.addEventListener("focusout", () => {
      requestAnimationFrame(() => {
        if (!compass.contains(document.activeElement) && picker?.classList.contains("is-open")) {
          scheduleCompassIdle();
        }
      });
    });

    compass?.addEventListener("keydown", (event) => {
      const currentChoice = event.target.closest?.(".theme-compass-choice");
      if (!currentChoice) return;

      const currentIndex = AUTHOR_THEMES.indexOf(currentChoice.dataset.themeChoice);
      let nextIndex = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % AUTHOR_THEMES.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + AUTHOR_THEMES.length) % AUTHOR_THEMES.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = AUTHOR_THEMES.length - 1;
      if (nextIndex === null) return;

      event.preventDefault();
      clearCompassTimers();
      const nextTheme = AUTHOR_THEMES[nextIndex];
      selectTheme(nextTheme);
      compass.querySelector(`[data-theme-choice="${nextTheme}"]`)?.focus();
    });

    document.addEventListener("click", (event) => {
      if (settingsMenu?.open && !settingsMenu.contains(event.target)) {
        settingsMenu.removeAttribute("open");
      }
      if (picker?.classList.contains("is-open") && !picker.contains(event.target)) {
        closeCompassPanel();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      if (picker?.classList.contains("is-open")) {
        closeCompassPanel({ restoreFocus: true });
        return;
      }

      if (settingsMenu?.open) {
        settingsMenu.removeAttribute("open");
        settingsTrigger?.focus();
      }
    });

    syncThemeControls();
    closeCompassPanel();

    requestAnimationFrame(() => {
      if (compass) compass.dataset.compassReady = "true";
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