(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const locationConfig = config?.locations?.[config.defaultLocation];
    if (!locationConfig?.windguru) return;

    const target = $("windguruTarget");
    const fallback = $("windguruFallback");
    const link = $("windguruLink");
    if (!target || !fallback || !link) return;

    const widgetConfig = locationConfig.windguru;
    const spotId = Number(widgetConfig.spotId);
    if (!Number.isInteger(spotId) || spotId <= 0) return;

    link.href = `https://www.windguru.cz/${spotId}`;
    fallback.hidden = true;

    const showFallback = () => {
      fallback.hidden = false;
    };

    const renderWidget = () => {
      try {
        window.WgWidget({
          s: spotId,
          odh: 0,
          doh: 24,
          wj: widgetConfig.windUnit || "knots",
          tj: widgetConfig.temperatureUnit || "c",
          fhours: widgetConfig.forecastHours || 120,
          lng: "pt",
          params: ["WINDSPD", "GUST", "SMER", "TMPE", "CDC", "APCPs"],
          first_row: true,
          spotname: true,
          first_row_minfo: true,
          last_row: true,
          lat_lon: false,
          tz: true,
          sun: true,
          link_archive: false,
          link_new_window: true
        }, "windguruTarget");

        window.setTimeout(() => {
          if (target.children.length === 0 && !target.textContent.trim()) showFallback();
        }, 3500);
      } catch (error) {
        console.error("MeteoPanel: falha no Windguru", error);
        showFallback();
      }
    };

    if (typeof window.WgWidget === "function") {
      renderWidget();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://widget.windguru.cz/js/wg_widget.php?v=${Date.now()}`;
    script.async = true;
    script.onload = () => {
      if (typeof window.WgWidget !== "function") return showFallback();
      renderWidget();
    };
    script.onerror = showFallback;
    document.head.appendChild(script);
  }

  start();
})();
