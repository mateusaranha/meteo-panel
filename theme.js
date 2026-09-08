(() => {
  const STORAGE_KEY = "meteopanel-theme-v1";
  const VALID_THEMES = new Set(["auto", "light", "ocean-night", "coastal-light"]);
  const PRIMARY_THEMES = new Set(["ocean-night", "coastal-light"]);
  const DARK_MEDIA = window.matchMedia("(prefers-color-scheme: dark)");

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

  function selectTheme(theme) {
    activeTheme = applyTheme(theme);
    persistTheme();
    syncThemeControls();
  }

  function initThemeControls() {
    const primaryControl = document.getElementById("themePrimaryControl");
    const settingsMenu = document.getElementById("settingsMenu");
    const settingsTrigger = settingsMenu?.querySelector("summary");

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
  }

  const handleSystemThemeChange = () => {
    if (activeTheme === "auto") {
      applyTheme("auto");
      syncThemeControls();
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
