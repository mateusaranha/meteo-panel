(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const locationConfig = config?.locations?.[config.defaultLocation];
    if (!locationConfig) return;

    const favoritesEl = $("marineFavorites");
    const emptyEl = $("marineEmpty");
    const selectedEl = $("marineSelected");
    const selectedNameEl = $("marineSelectedName");
    const dialog = $("marineDialog");
    const form = $("marineForm");
    const searchInput = $("marineSearchInput");
    const searchButton = $("marineSearchButton");
    const searchStatus = $("marineSearchStatus");
    const searchResults = $("marineSearchResults");
    const selectionCard = $("marineSelectionCard");
    const selectionLabel = $("marineSelectionLabel");
    const selectionCoords = $("marineSelectionCoords");
    const nameInput = $("marineNameInput");
    const latInput = $("marineLatInput");
    const lonInput = $("marineLonInput");
    const dialogTitle = $("marineDialogTitle");
    const saveButton = $("marineSaveButton");
    const mapEl = $("marineMap");

    if (
      !favoritesEl || !emptyEl || !selectedEl || !selectedNameEl || !dialog || !form ||
      !searchInput || !searchButton || !searchStatus || !searchResults ||
      !selectionCard || !selectionLabel || !selectionCoords || !nameInput ||
      !latInput || !lonInput || !dialogTitle || !saveButton || !mapEl
    ) return;

    const marineConfig = config.marine || {};
    const storageKey = marineConfig.storageKey || "meteo-panel:marine-favorites:v1";
    const selectedStorageKey = marineConfig.selectedStorageKey || "meteo-panel:marine-selected:v1";
    const defaults = Array.isArray(marineConfig.defaultFavorites)
      ? marineConfig.defaultFavorites.map((item) => ({ ...item }))
      : [];

    const memoryStorage = new Map();

    function storageGet(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.warn("MeteoPanel: localStorage indisponível; usando memória temporária.", error);
        return memoryStorage.has(key) ? memoryStorage.get(key) : null;
      }
    }

    function storageSet(key, value) {
      memoryStorage.set(key, value);
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.warn("MeteoPanel: não foi possível persistir favoritos.", error);
      }
    }

    function storageRemove(key) {
      memoryStorage.delete(key);
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn("MeteoPanel: não foi possível remover item persistido.", error);
      }
    }

    let favorites = defaults;
    const storedFavorites = storageGet(storageKey);
    if (storedFavorites !== null) {
      try {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) favorites = parsed;
      } catch (error) {
        console.warn("MeteoPanel: favoritos marítimos inválidos; usando padrões.", error);
      }
    }

    favorites = favorites.filter((item) =>
      item && item.id && typeof item.name === "string" && item.name.trim() &&
      Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon))
    );

    let selectedId = storageGet(selectedStorageKey);
    if (!favorites.some((item) => item.id === selectedId)) selectedId = favorites[0]?.id || null;

    let editingId = null;
    let pendingSelection = null;
    let marineMap = null;
    let marineMarker = null;
    let temperatureRequestToken = 0;
    let geocodeRequestToken = 0;
    let reverseRequestToken = 0;

    const addButton = $("marineAddButton");
    const emptyAddButton = $("marineEmptyAddButton");
    const editButton = $("marineEditButton");
    const removeButton = $("marineRemoveButton");
    const retryButton = $("marineRetryButton");
    const menu = $("marineMenu");
    const closeButton = $("marineDialogClose");
    const cancelButton = $("marineCancelButton");

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
      pendingSelection = null;
    }

    function setCoordinateInputs(newLat, newLon) {
      latInput.value = Number(newLat).toFixed(5);
      lonInput.value = Number(newLon).toFixed(5);
    }

    function setSaveEnabled(enabled) {
      saveButton.disabled = !enabled;
    }

    function updateSelectionCard() {
      if (!pendingSelection) {
        selectionCard.hidden = true;
        setSaveEnabled(false);
        return;
      }

      selectionCard.hidden = false;
      selectionLabel.textContent = pendingSelection.label || "Ponto selecionado no mapa";
      selectionCoords.textContent = `${Number(pendingSelection.lat).toFixed(5)}, ${Number(pendingSelection.lon).toFixed(5)}`;
      setSaveEnabled(true);
    }

    function ensureMap(centerLat, centerLon) {
      if (typeof window.L === "undefined") {
        mapEl.innerHTML = '<div class="marine-map-unavailable"><strong>Mapa indisponível.</strong><span>Use a busca ou informe as coordenadas manualmente.</span></div>';
        return;
      }

      if (!marineMap) {
        mapEl.replaceChildren();
        marineMap = window.L.map(mapEl, { zoomControl: true }).setView([centerLat, centerLon], 11);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(marineMap);

        marineMap.on("click", (event) => {
          selectPoint(event.latlng.lat, event.latlng.lng, "Ponto escolhido no mapa", {
            zoom: marineMap.getZoom(),
            reverse: true
          });
        });
      } else {
        marineMap.setView([centerLat, centerLon], marineMap.getZoom() || 11);
      }

      window.setTimeout(() => marineMap?.invalidateSize(), 120);
    }

    function placeMarker(pointLat, pointLon, zoom = 15) {
      if (!marineMap || typeof window.L === "undefined") return;

      if (!marineMarker) {
        marineMarker = window.L.marker([pointLat, pointLon], { draggable: true }).addTo(marineMap);
        marineMarker.on("dragend", () => {
          const point = marineMarker.getLatLng();
          selectPoint(point.lat, point.lng, "Ponto ajustado no mapa", {
            zoom: marineMap.getZoom(),
            reverse: true,
            moveMarker: false
          });
        });
      } else {
        marineMarker.setLatLng([pointLat, pointLon]);
      }

      marineMap.setView([pointLat, pointLon], Math.max(zoom, 13));
    }

    async function reverseGeocode(pointLat, pointLon, token) {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.search = new URLSearchParams({
          format: "jsonv2",
          lat: String(pointLat),
          lon: String(pointLon),
          zoom: "16",
          addressdetails: "1",
          "accept-language": "pt-BR,pt"
        }).toString();

        const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
        if (!response.ok) return;
        const data = await response.json();
        if (token !== reverseRequestToken || !pendingSelection) return;

        if (data?.display_name) {
          pendingSelection.label = data.display_name;
          updateSelectionCard();
        }
      } catch (error) {
        console.warn("MeteoPanel: não foi possível identificar o ponto do mapa.", error);
      }
    }

    function selectPoint(pointLat, pointLon, label, options = {}) {
      const numericLat = Number(pointLat);
      const numericLon = Number(pointLon);
      if (!Number.isFinite(numericLat) || !Number.isFinite(numericLon)) return;
      if (numericLat < -90 || numericLat > 90 || numericLon < -180 || numericLon > 180) return;

      pendingSelection = { lat: numericLat, lon: numericLon, label: label || "Ponto selecionado" };
      setCoordinateInputs(numericLat, numericLon);
      updateSelectionCard();

      if (options.moveMarker !== false) placeMarker(numericLat, numericLon, options.zoom || 15);

      if (options.reverse) {
        const token = ++reverseRequestToken;
        reverseGeocode(numericLat, numericLon, token);
      }
    }

    function clearSearch() {
      searchInput.value = "";
      searchStatus.textContent = "";
      searchResults.replaceChildren();
    }

    function shortResultName(result) {
      return result?.name || result?.display_name?.split(",")[0] || "Local encontrado";
    }

    function chooseSearchResult(result) {
      const resultLat = Number(result.lat);
      const resultLon = Number(result.lon);
      if (!Number.isFinite(resultLat) || !Number.isFinite(resultLon)) return;

      selectPoint(resultLat, resultLon, result.display_name || shortResultName(result), { zoom: 16 });
      if (!nameInput.value.trim()) nameInput.value = shortResultName(result);

      searchStatus.textContent = "Resultado selecionado. Confira o marcador no mapa antes de salvar.";
      searchResults.replaceChildren();
    }

    function renderSearchResults(results) {
      searchResults.replaceChildren();

      results.forEach((result) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "marine-search-result";

        const title = document.createElement("strong");
        title.textContent = shortResultName(result);

        const description = document.createElement("span");
        description.textContent = result.display_name || `${result.lat}, ${result.lon}`;

        button.append(title, description);
        button.addEventListener("click", () => chooseSearchResult(result));
        searchResults.appendChild(button);
      });
    }

    async function searchPlaces() {
      const query = searchInput.value.trim();
      if (!query) {
        searchStatus.textContent = "Digite o nome de um lugar para buscar.";
        searchResults.replaceChildren();
        return;
      }

      const token = ++geocodeRequestToken;
      searchButton.disabled = true;
      searchStatus.textContent = "Buscando…";
      searchResults.replaceChildren();

      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.search = new URLSearchParams({
          format: "jsonv2",
          q: query,
          limit: "5",
          countrycodes: "br",
          addressdetails: "1",
          "accept-language": "pt-BR,pt"
        }).toString();

        const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const results = await response.json();
        if (token !== geocodeRequestToken) return;

        if (!Array.isArray(results) || results.length === 0) {
          searchStatus.textContent = "Nenhum resultado encontrado. Tente incluir cidade e estado.";
          return;
        }

        searchStatus.textContent = results.length === 1
          ? "1 resultado encontrado. Selecione-o para conferir no mapa."
          : `${results.length} resultados encontrados. Escolha o correto para conferir no mapa.`;
        renderSearchResults(results);
      } catch (error) {
        if (token !== geocodeRequestToken) return;
        console.error("MeteoPanel: falha na busca de lugares", error);
        searchStatus.textContent = "Não foi possível fazer a busca agora. Você ainda pode escolher o ponto diretamente no mapa.";
      } finally {
        if (token === geocodeRequestToken) searchButton.disabled = false;
      }
    }

    function openEditor(favorite = null) {
      editingId = favorite?.id || null;
      pendingSelection = null;
      dialogTitle.textContent = favorite ? "Editar local" : "Adicionar local";
      saveButton.textContent = favorite ? "Salvar alterações" : "Adicionar aos favoritos";
      nameInput.value = favorite?.name || "";
      clearSearch();

      const defaultLat = Number(locationConfig.coordinates.lat);
      const defaultLon = Number(locationConfig.coordinates.lon);
      ensureMap(defaultLat, defaultLon);

      if (favorite) {
        searchInput.value = favorite.name;
        selectPoint(
          Number(favorite.lat),
          Number(favorite.lon),
          favorite.placeLabel || "Local salvo atualmente",
          { zoom: 15 }
        );
      } else {
        latInput.value = "";
        lonInput.value = "";
        selectionCard.hidden = true;
        setSaveEnabled(false);
        if (marineMarker && marineMap) {
          marineMap.removeLayer(marineMarker);
          marineMarker = null;
        }
        marineMap?.setView([defaultLat, defaultLon], 11);
      }

      showDialogElement();
      window.setTimeout(() => {
        marineMap?.invalidateSize();
        searchInput.focus();
      }, 120);
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

      const token = ++temperatureRequestToken;
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
        if (token !== temperatureRequestToken) return;

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
        if (token !== temperatureRequestToken) return;
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
    searchButton.addEventListener("click", searchPlaces);

    form.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (event.target === searchInput) searchPlaces();
    });

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

    function selectManualCoordinates() {
      const manualLat = Number(latInput.value);
      const manualLon = Number(lonInput.value);
      if (!Number.isFinite(manualLat) || !Number.isFinite(manualLon)) return;
      selectPoint(manualLat, manualLon, "Coordenadas informadas manualmente", { zoom: 15, reverse: true });
    }

    latInput.addEventListener("change", selectManualCoordinates);
    lonInput.addEventListener("change", selectManualCoordinates);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = nameInput.value.trim();
      if (!name || !pendingSelection || saveButton.disabled) return;

      const newFavorite = {
        name,
        lat: pendingSelection.lat,
        lon: pendingSelection.lon,
        placeLabel: pendingSelection.label
      };

      if (editingId) {
        favorites = favorites.map((item) =>
          item.id === editingId ? { ...item, ...newFavorite } : item
        );
        selectedId = editingId;
      } else {
        const id = `marine-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        favorites.push({ id, ...newFavorite });
        selectedId = id;
      }

      saveState();
      closeDialogElement();
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
