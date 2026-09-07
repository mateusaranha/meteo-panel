(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const locationConfig = config?.locations?.[config.defaultLocation];
    const selectedNameEl = $("marineSelectedName");
    const favoritesEl = $("marineFavorites");
    const emptyEl = $("marineEmpty");
    const selectedEl = $("marineSelected");

    if (!locationConfig || !selectedNameEl || !favoritesEl || !emptyEl || !selectedEl) return;

    // The original app.js may already have initialized this module successfully.
    // If so, do not attach a second set of handlers.
    const alreadyInitialized =
      favoritesEl.children.length > 0 ||
      selectedNameEl.textContent.trim() !== "—" ||
      (selectedEl.hidden && !emptyEl.hidden);

    if (alreadyInitialized) return;

    const marineConfig = config.marine || {};
    const storageKey = marineConfig.storageKey || "meteo-panel:marine-favorites:v1";
    const selectedStorageKey = marineConfig.selectedStorageKey || "meteo-panel:marine-selected:v1";
    const defaults = Array.isArray(marineConfig.defaultFavorites)
      ? marineConfig.defaultFavorites.map((item) => ({ ...item }))
      : [];

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
    const mapEl = $("marineMap");

    if (!dialog || !form || !nameInput || !latInput || !lonInput || !dialogTitle || !saveButton) return;

    const memoryStorage = new Map();

    function storageGet(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.warn("MeteoPanel: armazenamento local indisponível; usando memória temporária.", error);
        return memoryStorage.has(key) ? memoryStorage.get(key) : null;
      }
    }

    function storageSet(key, value) {
      memoryStorage.set(key, value);
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.warn("MeteoPanel: não foi possível persistir favoritos neste navegador.", error);
      }
    }

    function storageRemove(key) {
      memoryStorage.delete(key);
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn("MeteoPanel: não foi possível remover item do armazenamento local.", error);
      }
    }

    let favorites = defaults;
    const storedFavorites = storageGet(storageKey);
    if (storedFavorites !== null) {
      try {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) favorites = parsed;
      } catch (error) {
        console.warn("MeteoPanel: favoritos marítimos salvos estavam inválidos; usando os padrões.", error);
      }
    }

    favorites = favorites.filter((item) =>
      item &&
      item.id &&
      typeof item.name === "string" &&
      item.name.trim() &&
      Number.isFinite(Number(item.lat)) &&
      Number.isFinite(Number(item.lon))
    );

    let selectedId = storageGet(selectedStorageKey);
    if (!favorites.some((item) => item.id === selectedId)) {
      selectedId = favorites[0]?.id || null;
    }

    let editingId = null;
    let marineMap = null;
    let marineMarker = null;
    let requestToken = 0;

    const formatNumber = (value, digits = 1) => {
      if (value == null || Number.isNaN(Number(value))) return "—";
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(Number(value));
    };

    function saveState() {
      storageSet(storageKey, JSON.stringify(favorites));
      if (selectedId) storageSet(selectedStorageKey, selectedId);
      else storageRemove(selectedStorageKey);
    }

    function selectedFavorite() {
      return favorites.find((item) => item.id === selectedId) || null;
    }

    function setCoordinates(newLat, newLon) {
      latInput.value = Number(newLat).toFixed(5);
      lonInput.value = Number(newLon).toFixed(5);
    }

    function showDialogElement() {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }

    function closeDialogElement() {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
      editingId = null;
    }

    function ensureMap(mapLat, mapLon) {
      if (!mapEl) return;

      if (typeof window.L === "undefined") {
        mapEl.innerHTML = '<div class="marine-map-unavailable"><strong>Mapa indisponível.</strong><span>Você ainda pode informar latitude e longitude manualmente.</span></div>';
        return;
      }

      if (!marineMap) {
        mapEl.replaceChildren();
        marineMap = window.L.map(mapEl, { zoomControl: true }).setView([mapLat, mapLon], 13);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(marineMap);

        marineMarker = window.L.marker([mapLat, mapLon], { draggable: true }).addTo(marineMap);
        marineMarker.on("dragend", () => {
          const point = marineMarker.getLatLng();
          setCoordinates(point.lat, point.lng);
        });

        marineMap.on("click", (event) => {
          marineMarker.setLatLng(event.latlng);
          setCoordinates(event.latlng.lat, event.latlng.lng);
        });
      } else {
        marineMap.setView([mapLat, mapLon], 13);
        marineMarker.setLatLng([mapLat, mapLon]);
      }

      window.setTimeout(() => marineMap?.invalidateSize(), 120);
    }

    function openEditor(favorite = null) {
      editingId = favorite?.id || null;
      dialogTitle.textContent = favorite ? "Editar local" : "Adicionar local";
      saveButton.textContent = favorite ? "Salvar alterações" : "Adicionar";
      nameInput.value = favorite?.name || "";

      const defaultLat = Number(locationConfig.coordinates.lat);
      const defaultLon = Number(locationConfig.coordinates.lon);
      const initialLat = Number(favorite?.lat ?? defaultLat);
      const initialLon = Number(favorite?.lon ?? defaultLon);

      setCoordinates(initialLat, initialLon);
      showDialogElement();
      ensureMap(initialLat, initialLon);
      window.setTimeout(() => nameInput.focus(), 100);
    }

    function renderFavorites() {
      favoritesEl.replaceChildren();

      favorites.forEach((favorite) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "marine-chip";
        button.textContent = favorite.name;
        button.setAttribute("aria-current", favorite.id === selectedId ? "true" : "false");
        button.addEventListener("click", () => {
          selectedId = favorite.id;
          saveState();
          render();
        });
        favoritesEl.appendChild(button);
      });
    }

    async function loadSeaTemperature(favorite) {
      const loading = $("marineLoading");
      const errorBox = $("marineError");
      const content = $("marineContent");
      if (!loading || !errorBox || !content) return;

      const token = ++requestToken;
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
        if (token !== requestToken) return;

        const value = data?.current?.sea_surface_temperature;
        if (value == null || Number.isNaN(Number(value))) {
          throw new Error("Temperatura superficial indisponível para este ponto");
        }

        $("marineTemperature").textContent = formatNumber(value, 1);
        const observation = data.current?.time ? new Date(data.current.time) : new Date();
        $("marineObservationTime").textContent = `Dados de ${new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }).format(observation)}`;

        loading.hidden = true;
        content.hidden = false;
      } catch (error) {
        if (token !== requestToken) return;
        console.error("MeteoPanel: falha na temperatura do mar", error);
        loading.hidden = true;
        errorBox.hidden = false;
      }
    }

    function renderSelected() {
      const favorite = selectedFavorite();

      if (!favorite) {
        emptyEl.hidden = false;
        selectedEl.hidden = true;
        return;
      }

      emptyEl.hidden = true;
      selectedEl.hidden = false;
      selectedNameEl.textContent = favorite.name;
      const coordsEl = $("marineSelectedCoords");
      if (coordsEl) coordsEl.textContent = `${Number(favorite.lat).toFixed(4)}, ${Number(favorite.lon).toFixed(4)}`;
      loadSeaTemperature(favorite);
    }

    function render() {
      renderFavorites();
      renderSelected();
    }

    addButton?.addEventListener("click", () => openEditor());
    emptyAddButton?.addEventListener("click", () => openEditor());
    closeButton?.addEventListener("click", closeDialogElement);
    cancelButton?.addEventListener("click", closeDialogElement);

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialogElement();
    });

    editButton?.addEventListener("click", () => {
      if (menu) menu.open = false;
      const favorite = selectedFavorite();
      if (favorite) openEditor(favorite);
    });

    removeButton?.addEventListener("click", () => {
      if (menu) menu.open = false;
      const favorite = selectedFavorite();
      if (!favorite) return;

      if (!window.confirm(`Remover “${favorite.name}” dos favoritos?`)) return;

      favorites = favorites.filter((item) => item.id !== favorite.id);
      selectedId = favorites[0]?.id || null;
      saveState();
      render();
    });

    retryButton?.addEventListener("click", () => {
      const favorite = selectedFavorite();
      if (favorite) loadSeaTemperature(favorite);
    });

    function syncMarkerFromInputs() {
      const newLat = Number(latInput.value);
      const newLon = Number(lonInput.value);
      if (!Number.isFinite(newLat) || !Number.isFinite(newLon) || !marineMap || !marineMarker) return;
      marineMarker.setLatLng([newLat, newLon]);
      marineMap.panTo([newLat, newLon]);
    }

    latInput.addEventListener("change", syncMarkerFromInputs);
    lonInput.addEventListener("change", syncMarkerFromInputs);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = nameInput.value.trim();
      const newLat = Number(latInput.value);
      const newLon = Number(lonInput.value);

      if (!name || !Number.isFinite(newLat) || !Number.isFinite(newLon)) return;
      if (newLat < -90 || newLat > 90 || newLon < -180 || newLon > 180) return;

      if (editingId) {
        favorites = favorites.map((item) =>
          item.id === editingId ? { ...item, name, lat: newLat, lon: newLon } : item
        );
        selectedId = editingId;
      } else {
        const id = `marine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        favorites.push({ id, name, lat: newLat, lon: newLon });
        selectedId = id;
      }

      saveState();
      closeDialogElement();
      render();
    });

    render();
  }

  // app.js runs just before this file. A short delay lets us determine whether
  // its marine initializer succeeded before activating this resilient fallback.
  window.setTimeout(start, 80);
})();
