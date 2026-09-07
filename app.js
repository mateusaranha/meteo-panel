(() => {
  const config = window.METEO_CONFIG;
  const locationConfig = config.locations[config.defaultLocation];

  if (!locationConfig) throw new Error("Local padrão não encontrado em config.js");

  const $ = (id) => document.getElementById(id);
  const windyFrame = $("windyFrame");
  const windguruTarget = $("windguruTarget");
  const windguruFallback = $("windguruFallback");

  $("panelTitle").textContent = config.appName;
  $("locationLabel").textContent = locationConfig.label;

  const { lat, lon, zoom } = locationConfig.coordinates;

  const windyEmbedUrl = new URL("https://embed.windy.com/embed2.html");
  windyEmbedUrl.search = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    detailLat: String(lat),
    detailLon: String(lon),
    width: "650",
    height: "450",
    zoom: String(zoom),
    level: "surface",
    overlay: locationConfig.windy.overlay,
    product: locationConfig.windy.model,
    menu: "",
    message: "true",
    marker: "true",
    calendar: "now",
    pressure: "",
    type: "map",
    location: "coordinates",
    detail: "true",
    metricWind: "kt",
    metricTemp: "°C",
    radarRange: "-1"
  }).toString();

  const windySiteUrl = `https://www.windy.com/?${locationConfig.windy.model},${locationConfig.windy.overlay},${lat},${lon},${zoom}`;
  const climatempoBaseUrl = `https://www.climatempo.com.br/previsao-do-tempo/cidade/${locationConfig.climatempo.cityId}/${locationConfig.climatempo.slug}`;
  const windguruSiteUrl = `https://www.windguru.cz/${locationConfig.windguru.spotId}`;

  windyFrame.src = windyEmbedUrl.toString();
  $("windyLink").href = windySiteUrl;
  $("climatempoLink").href = climatempoBaseUrl;
  $("climatempoNowLink").href = climatempoBaseUrl;
  $("climatempoTodayLink").href = climatempoBaseUrl;
  $("climatempoTomorrowLink").href = climatempoBaseUrl;
  $("climatempo15DaysLink").href = climatempoBaseUrl;
  $("windguruLink").href = windguruSiteUrl;

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date());
  $("updatedAt").textContent = `Painel carregado em ${formatted}`;

  function showWindguruFallback() {
    windguruFallback.hidden = false;
  }

  function loadWindguruWidget() {
    const script = document.createElement("script");
    script.src = "https://widget.windguru.cz/js/wg_widget.php";
    script.async = true;

    script.onload = () => {
      if (typeof window.WgWidget !== "function") {
        showWindguruFallback();
        return;
      }

      try {
        window.WgWidget({
          s: locationConfig.windguru.spotId,
          odh: 0,
          doh: 24,
          wj: locationConfig.windguru.windUnit,
          tj: locationConfig.windguru.temperatureUnit,
          waj: locationConfig.windguru.waveUnit,
          fhours: locationConfig.windguru.forecastHours,
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
          if (windguruTarget.children.length === 0 && !windguruTarget.textContent.trim()) {
            showWindguruFallback();
          }
        }, 3500);
      } catch (error) {
        console.error("Falha ao inicializar widget Windguru:", error);
        showWindguruFallback();
      }
    };

    script.onerror = showWindguruFallback;
    document.head.appendChild(script);
  }

  $("refreshButton").addEventListener("click", () => window.location.reload());
  loadWindguruWidget();
})();
