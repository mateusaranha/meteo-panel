(() => {
  const config = window.METEO_CONFIG;
  const locationConfig = config?.locations?.[config.defaultLocation];
  const $ = (id) => document.getElementById(id);

  if (!locationConfig) {
    console.error("MeteoPanel: local padrão não encontrado em config.js");
    return;
  }

  const { lat, lon, zoom } = locationConfig.coordinates;

  function initHeader() {
    const panelTitle = $("panelTitle");
    const locationLabel = $("locationLabel");
    const updatedAt = $("updatedAt");
    const refreshButton = $("refreshButton");

    if (panelTitle) panelTitle.textContent = config.appName;
    if (locationLabel) locationLabel.textContent = locationConfig.label;
    if (updatedAt) {
      const formatted = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit"
      }).format(new Date());
      updatedAt.textContent = `Painel carregado em ${formatted}`;
    }
    refreshButton?.addEventListener("click", () => window.location.reload());
  }

  function initWindy() {
    const windyFrame = $("windyFrame");
    const windyLink = $("windyLink");
    if (!windyFrame || !windyLink) return;

    const windyEmbedUrl = new URL("https://embed.windy.com/embed2.html");
    windyEmbedUrl.search = new URLSearchParams({
      lat: String(lat), lon: String(lon), detailLat: String(lat), detailLon: String(lon),
      width: "650", height: "450", zoom: String(zoom), level: "surface",
      overlay: locationConfig.windy.overlay, product: locationConfig.windy.model,
      menu: "", message: "true", marker: "true", calendar: "now", pressure: "",
      type: "map", location: "coordinates", detail: "true", metricWind: "kt",
      metricTemp: "°C", radarRange: "-1"
    }).toString();

    windyFrame.src = windyEmbedUrl.toString();
    windyLink.href = `https://www.windy.com/?${locationConfig.windy.model},${locationConfig.windy.overlay},${lat},${lon},${zoom}`;
  }

  const weatherCodes = {
    0: ["☀️", "Céu limpo"], 1: ["🌤️", "Predominantemente limpo"], 2: ["⛅", "Parcialmente nublado"],
    3: ["☁️", "Nublado"], 45: ["🌫️", "Nevoeiro"], 48: ["🌫️", "Nevoeiro com geada"],
    51: ["🌦️", "Garoa fraca"], 53: ["🌦️", "Garoa moderada"], 55: ["🌧️", "Garoa forte"],
    61: ["🌦️", "Chuva fraca"], 63: ["🌧️", "Chuva moderada"], 65: ["🌧️", "Chuva forte"],
    71: ["🌨️", "Neve fraca"], 73: ["🌨️", "Neve moderada"], 75: ["❄️", "Neve forte"],
    80: ["🌦️", "Pancadas fracas"], 81: ["🌧️", "Pancadas moderadas"], 82: ["⛈️", "Pancadas fortes"],
    95: ["⛈️", "Trovoadas"], 96: ["⛈️", "Trovoadas com granizo"], 99: ["⛈️", "Trovoadas fortes com granizo"]
  };

  const weatherInfo = (code) => weatherCodes[code] || ["🌡️", "Condição variável"];
  const formatNumber = (value, digits = 0) => {
    if (value == null || Number.isNaN(Number(value))) return "—";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value));
  };

  async function loadOpenMeteo() {
    const loading = $("openMeteoLoading");
    const errorBox = $("openMeteoError");
    const content = $("openMeteoContent");
    if (!loading || !errorBox || !content) return;

    loading.hidden = false;
    errorBox.hidden = true;
    content.hidden = true;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "5",
      wind_speed_unit: "kmh"
    }).toString();

    try {
      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.current || !data.daily) throw new Error("Resposta incompleta");

      const [icon, description] = weatherInfo(data.current.weather_code);
      $("currentWeatherIcon").textContent = icon;
      $("currentTemperature").textContent = formatNumber(data.current.temperature_2m);
      $("currentDescription").textContent = description;
      $("currentFeelsLike").textContent = `${formatNumber(data.current.apparent_temperature)} °C`;
      $("currentWind").textContent = `${formatNumber(data.current.wind_speed_10m)} km/h`;
      $("currentGusts").textContent = `${formatNumber(data.current.wind_gusts_10m)} km/h`;
      $("currentPrecipitation").textContent = `${formatNumber(data.current.precipitation, 1)} mm`;

      const dailyForecast = $("dailyForecast");
      dailyForecast.replaceChildren();
      data.daily.time.forEach((dateString, index) => {
        const [dayIcon] = weatherInfo(data.daily.weather_code[index]);
        const date = new Date(`${dateString}T12:00:00`);
        const dayName = index === 0 ? "Hoje" : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
        const day = document.createElement("article");
        day.className = "day-card";
        day.innerHTML = `<span class="day-name">${dayName}</span><span class="weather-icon" aria-hidden="true">${dayIcon}</span><span class="day-temperature"><strong>${formatNumber(data.daily.temperature_2m_max[index])}°</strong> / ${formatNumber(data.daily.temperature_2m_min[index])}°</span><span class="day-rain">${formatNumber(data.daily.precipitation_probability_max?.[index])}% · ${formatNumber(data.daily.precipitation_sum?.[index], 1)} mm</span>`;
        dailyForecast.appendChild(day);
      });

      const currentTime = data.current.time ? new Date(data.current.time) : new Date();
      $("forecastUpdatedAt").textContent = `dados de ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(currentTime)}`;
      loading.hidden = true;
      content.hidden = false;
    } catch (error) {
      console.error("MeteoPanel: falha no Open-Meteo", error);
      loading.hidden = true;
      errorBox.hidden = false;
    }
  }

  function initOpenMeteo() {
    $("openMeteoRetry")?.addEventListener("click", loadOpenMeteo);
    loadOpenMeteo();
  }

  function initWindguru() {
    const target = $("windguruTarget");
    const fallback = $("windguruFallback");
    const link = $("windguruLink");
    if (!target || !fallback || !link) return;

    link.href = `https://www.windguru.cz/${locationConfig.windguru.spotId}`;
    const showFallback = () => { fallback.hidden = false; };

    const script = document.createElement("script");
    script.src = `https://widget.windguru.cz/js/wg_widget.php?v=${Date.now()}`;
    script.async = true;
    script.onload = () => {
      if (typeof window.WgWidget !== "function") return showFallback();
      try {
        window.WgWidget({
          s: locationConfig.windguru.spotId, odh: 0, doh: 24,
          wj: locationConfig.windguru.windUnit, tj: locationConfig.windguru.temperatureUnit,
          waj: locationConfig.windguru.waveUnit, fhours: locationConfig.windguru.forecastHours,
          lng: "pt", params: ["WINDSPD", "GUST", "SMER", "TMPE", "CDC", "APCPs"],
          first_row: true, spotname: true, first_row_minfo: true, last_row: true,
          lat_lon: false, tz: true, sun: true, link_archive: false, link_new_window: true
        }, "windguruTarget");

        window.setTimeout(() => {
          if (target.children.length === 0 && !target.textContent.trim()) showFallback();
        }, 4500);
      } catch (error) {
        console.error("MeteoPanel: falha no Windguru", error);
        showFallback();
      }
    };
    script.onerror = showFallback;
    document.head.appendChild(script);
  }

  const safeInit = (name, fn) => {
    try { fn(); } catch (error) { console.error(`MeteoPanel: falha ao iniciar ${name}`, error); }
  };

  safeInit("cabeçalho", initHeader);
  safeInit("Windy", initWindy);
  safeInit("Open-Meteo", initOpenMeteo);
  safeInit("Windguru", initWindguru);
})();
