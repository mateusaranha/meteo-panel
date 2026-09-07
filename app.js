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

  function initMarine() {
    const marineConfig = config.marine || {};
    const storageKey = marineConfig.storageKey || "meteo-panel:marine-favorites:v1";
    const selectedStorageKey = marineConfig.selectedStorageKey || "meteo-panel:marine-selected:v1";
    const defaults = Array.isArray(marineConfig.defaultFavorites) ? marineConfig.defaultFavorites : [];

    const favoritesEl = $("marineFavorites");
    const emptyEl = $("marineEmpty");
    const selectedEl = $("marineSelected");
    const addButton = $("marineAddButton");
    const emptyAddButton = $("marineEmptyAddButton");
    const editButton = $("marineEditButton");
    const removeButton = $("marineRemoveButton");
    const retryButton = $("marineRetryButton");
    const menu = $("marineMenu");
    const dialog = $("marineDialog");
    const form = $("marineForm");
    const closeButton = $("marineDialogClose");
    const cancelButton = $("marineCancelButton");
    const nameInput = $("marineNameInput");
    const latInput = $("marineLatInput");
    const lonInput = $("marineLonInput");
    const dialogTitle = $("marineDialogTitle");
    const saveButton = $("marineSaveButton");

    if (!favoritesEl || !emptyEl || !selectedEl || !dialog || !form) return;

    let favorites;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      favorites = Array.isArray(stored) ? stored : defaults.map((item) => ({ ...item }));
    } catch {
      favorites = defaults.map((item) => ({ ...item }));
    }

    favorites = favorites.filter((item) => item && item.id && item.name && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)));

    let selectedId = localStorage.getItem(selectedStorageKey);
    if (!favorites.some((item) => item.id === selectedId)) selectedId = favorites[0]?.id || null;

    let editingId = null;
    let marineMap = null;
    let marineMarker = null;
    let marineRequestToken = 0;

    const saveFavorites = () => {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
      if (selectedId) localStorage.setItem(selectedStorageKey, selectedId);
      else localStorage.removeItem(selectedStorageKey);
    };

    const selectedFavorite = () => favorites.find((item) => item.id === selectedId) || null;

    const updateCoordinateInputs = (newLat, newLon) => {
      latInput.value = Number(newLat).toFixed(5);
      lonInput.value = Number(newLon).toFixed(5);
    };

    const ensureMap = (mapLat, mapLon) => {
      if (typeof window.L === "undefined") return;

      if (!marineMap) {
        marineMap = window.L.map("marineMap", { zoomControl: true }).setView([mapLat, mapLon], 13);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(marineMap);

        marineMarker = window.L.marker([mapLat, mapLon], { draggable: true }).addTo(marineMap);
        marineMarker.on("dragend", () => {
          const point = marineMarker.getLatLng();
          updateCoordinateInputs(point.lat, point.lng);
        });

        marineMap.on("click", (event) => {
          marineMarker.setLatLng(event.latlng);
          updateCoordinateInputs(event.latlng.lat, event.latlng.lng);
        });
      } else {
        marineMap.setView([mapLat, mapLon], 13);
        marineMarker.setLatLng([mapLat, mapLon]);
      }

      window.setTimeout(() => marineMap.invalidateSize(), 80);
    };

    const openDialog = (favorite = null) => {
      editingId = favorite?.id || null;
      dialogTitle.textContent = favorite ? "Editar local" : "Adicionar local";
      saveButton.textContent = favorite ? "Salvar alterações" : "Adicionar";
      nameInput.value = favorite?.name || "";
      const initialLat = Number(favorite?.lat ?? lat);
      const initialLon = Number(favorite?.lon ?? lon);
      updateCoordinateInputs(initialLat, initialLon);
      dialog.showModal();
      ensureMap(initialLat, initialLon);
      window.setTimeout(() => nameInput.focus(), 100);
    };

    const closeDialog = () => {
      if (dialog.open) dialog.close();
      editingId = null;
    };

    const renderFavorites = () => {
      favoritesEl.replaceChildren();
      favorites.forEach((favorite) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "marine-chip";
        button.textContent = favorite.name;
        button.setAttribute("aria-current", favorite.id === selectedId ? "true" : "false");
        button.addEventListener("click", () => {
          selectedId = favorite.id;
          saveFavorites();
          render();
        });
        favoritesEl.appendChild(button);
      });
    };

    async function loadSeaTemperature(favorite) {
      const loading = $("marineLoading");
      const errorBox = $("marineError");
      const content = $("marineContent");
      const token = ++marineRequestToken;

      loading.hidden = false;
      errorBox.hidden = true;
      content.hidden = true;

      const url = new URL("https://marine-api.open-meteo.com/v1/marine");
      url.search = new URLSearchParams({
        latitude: String(favorite.lat),
        longitude: String(favorite.lon),
        current: "sea_surface_temperature",
        timezone: "auto",
        cell_selection: "sea"
      }).toString();

      try {
        const response = await fetch(url.toString(), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (token !== marineRequestToken) return;

        const value = data?.current?.sea_surface_temperature;
        if (value == null || Number.isNaN(Number(value))) throw new Error("Temperatura indisponível");

        $("marineTemperature").textContent = formatNumber(value, 1);
        const observation = data.current?.time ? new Date(data.current.time) : new Date();
        $("marineObservationTime").textContent = `Dados de ${new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
        }).format(observation)}`;

        loading.hidden = true;
        content.hidden = false;
      } catch (error) {
        if (token !== marineRequestToken) return;
        console.error("MeteoPanel: falha na temperatura do mar", error);
        loading.hidden = true;
        errorBox.hidden = false;
      }
    }

    const renderSelected = () => {
      const favorite = selectedFavorite();
      if (!favorite) {
        emptyEl.hidden = false;
        selectedEl.hidden = true;
        return;
      }

      emptyEl.hidden = true;
      selectedEl.hidden = false;
      $("marineSelectedName").textContent = favorite.name;
      $("marineSelectedCoords").textContent = `${Number(favorite.lat).toFixed(4)}, ${Number(favorite.lon).toFixed(4)}`;
      loadSeaTemperature(favorite);
    };

    const render = () => {
      renderFavorites();
      renderSelected();
    };

    addButton?.addEventListener("click", () => openDialog());
    emptyAddButton?.addEventListener("click", () => openDialog());
    closeButton?.addEventListener("click", closeDialog);
    cancelButton?.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });

    editButton?.addEventListener("click", () => {
      menu?.removeAttribute("open");
      const favorite = selectedFavorite();
      if (favorite) openDialog(favorite);
    });

    removeButton?.addEventListener("click", () => {
      menu?.removeAttribute("open");
      const favorite = selectedFavorite();
      if (!favorite) return;
      if (!window.confirm(`Remover “${favorite.name}” dos favoritos?`)) return;
      favorites = favorites.filter((item) => item.id !== favorite.id);
      selectedId = favorites[0]?.id || null;
      saveFavorites();
      render();
    });

    retryButton?.addEventListener("click", () => {
      const favorite = selectedFavorite();
      if (favorite) loadSeaTemperature(favorite);
    });

    const syncMarkerFromInputs = () => {
      const newLat = Number(latInput.value);
      const newLon = Number(lonInput.value);
      if (!Number.isFinite(newLat) || !Number.isFinite(newLon) || !marineMap || !marineMarker) return;
      marineMarker.setLatLng([newLat, newLon]);
      marineMap.panTo([newLat, newLon]);
    };

    latInput?.addEventListener("change", syncMarkerFromInputs);
    lonInput?.addEventListener("change", syncMarkerFromInputs);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const newLat = Number(latInput.value);
      const newLon = Number(lonInput.value);
      if (!name || !Number.isFinite(newLat) || !Number.isFinite(newLon)) return;

      if (editingId) {
        favorites = favorites.map((item) => item.id === editingId ? { ...item, name, lat: newLat, lon: newLon } : item);
        selectedId = editingId;
      } else {
        const id = `marine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        favorites.push({ id, name, lat: newLat, lon: newLon });
        selectedId = id;
      }

      saveFavorites();
      closeDialog();
      render();
    });

    render();
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
  safeInit("temperatura do mar", initMarine);
  safeInit("Windguru", initWindguru);
})();
