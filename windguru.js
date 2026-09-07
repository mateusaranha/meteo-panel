(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const locationConfig = config?.locations?.[config.defaultLocation];
    if (!locationConfig) return;

    const moduleConfig = config.windguru || {};
    const widgetConfig = locationConfig.windguru || {};

    const favoritesEl = $("windguruFavorites");
    const selectedNameEl = $("windguruSelectedName");
    const target = $("windguruTarget");
    const fallback = $("windguruFallback");
    const empty = $("windguruEmpty");
    const link = $("windguruLink");
    const addButton = $("windguruAddButton");
    const emptyAddButton = $("windguruEmptyAddButton");
    const menu = $("windguruMenu");
    const editButton = $("windguruEditButton");
    const removeButton = $("windguruRemoveButton");
    const dialog = $("windguruDialog");
    const form = $("windguruForm");
    const dialogTitle = $("windguruDialogTitle");
    const closeButton = $("windguruDialogClose");
    const cancelButton = $("windguruCancelButton");
    const nameInput = $("windguruNameInput");
    const spotInput = $("windguruSpotInput");
    const saveButton = $("windguruSaveButton");
    const preview = $("windguruSpotPreview");
    const previewId = $("windguruPreviewId");
    const previewLink = $("windguruPreviewLink");
    const validation = $("windguruValidation");

    if (!favoritesEl || !target || !fallback || !empty || !link || !dialog || !form || !nameInput || !spotInput || !saveButton) return;

    const storageKey = moduleConfig.storageKey || "meteo-panel:windguru-favorites:v1";
    const selectedStorageKey = moduleConfig.selectedStorageKey || "meteo-panel:windguru-selected:v1";
    const defaults = Array.isArray(moduleConfig.defaultFavorites)
      ? moduleConfig.defaultFavorites.map((item) => ({ ...item }))
      : [];

    const memoryStorage = new Map();
    const storageGet = (key) => {
      try { return localStorage.getItem(key); }
      catch { return memoryStorage.get(key) ?? null; }
    };
    const storageSet = (key, value) => {
      memoryStorage.set(key, value);
      try { localStorage.setItem(key, value); } catch {}
    };
    const storageRemove = (key) => {
      memoryStorage.delete(key);
      try { localStorage.removeItem(key); } catch {}
    };

    let favorites = defaults;
    const stored = storageGet(storageKey);
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) favorites = parsed;
      } catch {}
    }

    favorites = favorites.filter((item) =>
      item && item.id && typeof item.name === "string" && item.name.trim() && Number.isInteger(Number(item.spotId)) && Number(item.spotId) > 0
    ).map((item) => ({ ...item, spotId: Number(item.spotId) }));

    let selectedId = storageGet(selectedStorageKey);
    if (!favorites.some((item) => item.id === selectedId)) selectedId = favorites[0]?.id || null;
    let editingId = null;
    let widgetScriptPromise = null;
    let renderToken = 0;

    const selectedFavorite = () => favorites.find((item) => item.id === selectedId) || null;

    function saveState() {
      storageSet(storageKey, JSON.stringify(favorites));
      if (selectedId) storageSet(selectedStorageKey, selectedId);
      else storageRemove(selectedStorageKey);
    }

    function parseSpotId(value) {
      const raw = String(value || "").trim();
      if (/^\d+$/.test(raw)) return Number(raw);

      try {
        const url = new URL(raw);
        const direct = url.pathname.match(/\/(\d+)\/?$/);
        if (direct) return Number(direct[1]);
        const querySpot = url.searchParams.get("sc") || url.searchParams.get("id_spot") || url.searchParams.get("s");
        if (querySpot && /^\d+$/.test(querySpot)) return Number(querySpot);
      } catch {}

      return null;
    }

    function validateDialog() {
      const spotId = parseSpotId(spotInput.value);
      const hasName = Boolean(nameInput.value.trim());
      saveButton.disabled = !(spotId && hasName);

      if (spotId) {
        if (preview) preview.hidden = false;
        if (previewId) previewId.textContent = `Spot Windguru #${spotId}`;
        if (previewLink) previewLink.href = `https://www.windguru.cz/${spotId}`;
        if (validation) validation.textContent = "Confira o spot pelo link antes de salvar, se tiver dúvida.";
      } else {
        if (preview) preview.hidden = true;
        if (validation) validation.textContent = spotInput.value.trim()
          ? "Informe um ID numérico ou uma URL de spot do Windguru."
          : "";
      }
    }

    function showDialog(favorite = null) {
      editingId = favorite?.id || null;
      if (dialogTitle) dialogTitle.textContent = favorite ? "Editar local do Windguru" : "Adicionar local do Windguru";
      nameInput.value = favorite?.name || "";
      spotInput.value = favorite?.spotId ? `https://www.windguru.cz/${favorite.spotId}` : "";
      saveButton.textContent = favorite ? "Salvar alterações" : "Adicionar aos favoritos";
      validateDialog();

      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      setTimeout(() => nameInput.focus(), 80);
    }

    function closeDialog() {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
      editingId = null;
    }

    function ensureWidgetScript() {
      if (typeof window.WgWidget === "function") return Promise.resolve();
      if (widgetScriptPromise) return widgetScriptPromise;

      widgetScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://widget.windguru.cz/js/wg_widget.php?v=${Date.now()}`;
        script.async = true;
        script.onload = () => typeof window.WgWidget === "function" ? resolve() : reject(new Error("WgWidget indisponível"));
        script.onerror = () => reject(new Error("Falha ao carregar script do Windguru"));
        document.head.appendChild(script);
      });

      return widgetScriptPromise;
    }

    async function renderWidget(favorite) {
      const token = ++renderToken;
      target.replaceChildren();
      fallback.hidden = true;
      target.classList.add("windguru-loading");

      try {
        await ensureWidgetScript();
        if (token !== renderToken) return;

        window.WgWidget({
          s: favorite.spotId,
          odh: 0,
          doh: 24,
          wj: widgetConfig.windUnit || "knots",
          tj: widgetConfig.temperatureUnit || "c",
          waj: widgetConfig.waveUnit || "m",
          fhours: widgetConfig.forecastHours || 120,
          lng: "pt",
          params: ["WINDSPD", "GUST", "SMER", "HTSGW", "TMPE", "CDC", "APCPs"],
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

        setTimeout(() => {
          if (token !== renderToken) return;
          target.classList.remove("windguru-loading");
          if (target.children.length === 0 && !target.textContent.trim()) fallback.hidden = false;
        }, 3500);
      } catch (error) {
        if (token !== renderToken) return;
        console.error("MeteoPanel: falha no Windguru", error);
        target.classList.remove("windguru-loading");
        fallback.hidden = false;
      }
    }

    function renderFavorites() {
      favoritesEl.replaceChildren();
      favorites.forEach((favorite) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "windguru-chip";
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

    function render() {
      renderFavorites();
      const favorite = selectedFavorite();

      if (!favorite) {
        empty.hidden = false;
        target.hidden = true;
        fallback.hidden = true;
        if (selectedNameEl) selectedNameEl.textContent = "Nenhum local selecionado";
        if (menu) menu.hidden = true;
        link.removeAttribute("href");
        return;
      }

      empty.hidden = true;
      target.hidden = false;
      if (menu) menu.hidden = false;
      if (selectedNameEl) selectedNameEl.textContent = favorite.name;
      link.href = `https://www.windguru.cz/${favorite.spotId}`;
      renderWidget(favorite);
    }

    addButton?.addEventListener("click", () => showDialog());
    emptyAddButton?.addEventListener("click", () => showDialog());
    editButton?.addEventListener("click", () => {
      if (menu) menu.open = false;
      const favorite = selectedFavorite();
      if (favorite) showDialog(favorite);
    });
    removeButton?.addEventListener("click", () => {
      if (menu) menu.open = false;
      const favorite = selectedFavorite();
      if (!favorite) return;
      if (!confirm(`Remover “${favorite.name}” dos locais do Windguru?`)) return;
      favorites = favorites.filter((item) => item.id !== favorite.id);
      selectedId = favorites[0]?.id || null;
      saveState();
      render();
    });

    closeButton?.addEventListener("click", closeDialog);
    cancelButton?.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });

    nameInput.addEventListener("input", validateDialog);
    spotInput.addEventListener("input", validateDialog);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const spotId = parseSpotId(spotInput.value);
      if (!name || !spotId) return;

      if (editingId) {
        favorites = favorites.map((item) => item.id === editingId ? { ...item, name, spotId } : item);
        selectedId = editingId;
      } else {
        const id = `windguru-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        favorites.push({ id, name, spotId });
        selectedId = id;
      }

      saveState();
      closeDialog();
      render();
    });

    render();
  }

  start();
})();
