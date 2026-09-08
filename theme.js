(() => {
  const STORAGE_KEY = "meteopanel-theme-v1";
  const VALID_THEMES = new Set(["auto", "light", "ocean-night", "coastal-light"]);
  const DARK_MEDIA = window.matchMedia("(prefers-color-scheme: dark)");

  const ensureCoastalLightStylesheet = () => {
    if (document.querySelector('link[data-theme-styles="coastal-light"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "coastal-light.css?v=20260907-16";
    link.dataset.themeStyles = "coastal-light";
    document.head.appendChild(link);
  };

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

  function ensureCoastalLightOption(select) {
    if (select.querySelector('option[value="coastal-light"]')) return;
    const option = document.createElement("option");
    option.value = "coastal-light";
    option.textContent = "Coastal Light";
    select.appendChild(option);
  }

  ensureCoastalLightStylesheet();
  let activeTheme = applyTheme(readStoredTheme());

  function initThemeControl() {
    const select = document.getElementById("themeSelect");
    if (!select) return;

    ensureCoastalLightOption(select);
    select.value = activeTheme;
    select.addEventListener("change", () => {
      activeTheme = applyTheme(select.value);
      try {
        localStorage.setItem(STORAGE_KEY, activeTheme);
      } catch {
        // A preferência continua válida durante a sessão mesmo sem localStorage.
      }
    });
  }

  const handleSystemThemeChange = () => {
    if (activeTheme === "auto") applyTheme("auto");
  };

  if (typeof DARK_MEDIA.addEventListener === "function") {
    DARK_MEDIA.addEventListener("change", handleSystemThemeChange);
  } else if (typeof DARK_MEDIA.addListener === "function") {
    DARK_MEDIA.addListener(handleSystemThemeChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeControl, { once: true });
  } else {
    initThemeControl();
  }
})();
