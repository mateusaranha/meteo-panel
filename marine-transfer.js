(() => {
  const $ = (id) => document.getElementById(id);

  const config = window.METEO_CONFIG || {};
  const marineConfig = config.marine || {};
  const storageKey = marineConfig.storageKey || "meteo-panel:marine-favorites:v1";
  const selectedStorageKey = marineConfig.selectedStorageKey || "meteo-panel:marine-selected:v1";
  const defaults = Array.isArray(marineConfig.defaultFavorites) ? marineConfig.defaultFavorites : [];

  const transferButton = $("marineTransferButton");
  const transferDialog = $("marineTransferDialog");
  const transferClose = $("marineTransferClose");
  const transferDone = $("marineTransferDone");
  const transferCount = $("marineTransferCount");
  const copyLinkButton = $("marineCopyLinkButton");
  const qrButton = $("marineQrButton");
  const exportButton = $("marineExportButton");
  const importButton = $("marineImportButton");
  const importFileInput = $("marineImportFile");
  const transferStatus = $("marineTransferStatus");
  const qrPanel = $("marineQrPanel");
  const qrCode = $("marineQrCode");

  const importDialog = $("marineImportDialog");
  const importClose = $("marineImportClose");
  const importCancel = $("marineImportCancel");
  const importSummary = $("marineImportSummary");
  const importList = $("marineImportList");
  const importMerge = $("marineImportMerge");
  const importReplace = $("marineImportReplace");

  if (
    !transferButton || !transferDialog || !transferClose || !transferDone || !transferCount ||
    !copyLinkButton || !qrButton || !exportButton || !importButton || !importFileInput ||
    !transferStatus || !qrPanel || !qrCode || !importDialog || !importClose || !importCancel ||
    !importSummary || !importList || !importMerge || !importReplace
  ) return;

  let pendingImport = null;

  function showDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("MeteoPanel: localStorage indisponível para transferência.", error);
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("MeteoPanel: não foi possível importar favoritos.", error);
      return false;
    }
  }

  function safeStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("MeteoPanel: não foi possível atualizar seleção persistida.", error);
    }
  }

  function sanitizeFavorite(item, preserveId = false) {
    if (!item || typeof item !== "object") return null;

    const name = String(item.name ?? item.n ?? "").trim().slice(0, 60);
    const lat = Number(item.lat ?? item.la);
    const lon = Number(item.lon ?? item.lo);

    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    const favorite = { name, lat, lon };
    if (preserveId && typeof item.id === "string" && item.id.trim()) favorite.id = item.id.trim();
    return favorite;
  }

  function coordinateKey(item) {
    return `${Number(item.lat).toFixed(5)}|${Number(item.lon).toFixed(5)}`;
  }

  function sanitizeList(items, preserveId = false) {
    if (!Array.isArray(items)) return [];

    const seen = new Set();
    const result = [];

    items.forEach((item) => {
      const favorite = sanitizeFavorite(item, preserveId);
      if (!favorite) return;
      const key = coordinateKey(favorite);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(favorite);
    });

    return result;
  }

  function getCurrentFavorites() {
    const stored = safeStorageGet(storageKey);
    if (stored === null) return sanitizeList(defaults, true);

    try {
      return sanitizeList(JSON.parse(stored), true);
    } catch (error) {
      console.warn("MeteoPanel: favoritos locais inválidos durante transferência.", error);
      return sanitizeList(defaults, true);
    }
  }

  function compactFavorites(items) {
    return sanitizeList(items).map((item) => ({
      n: item.name,
      la: Number(item.lat.toFixed(5)),
      lo: Number(item.lon.toFixed(5))
    }));
  }

  function encodePayload(payload) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodePayload(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function parseImportPayload(data) {
    if (!data || typeof data !== "object") throw new Error("Formato inválido");

    if (data.v === 1 && Array.isArray(data.f)) {
      const compact = sanitizeList(data.f);
      if (!compact.length) throw new Error("Nenhum favorito válido encontrado");
      return compact;
    }

    if (data.format === "meteopanel-marine-favorites" && data.version === 1 && Array.isArray(data.favorites)) {
      const favorites = sanitizeList(data.favorites);
      if (!favorites.length) throw new Error("Nenhum favorito válido encontrado");
      return favorites;
    }

    if (Array.isArray(data)) {
      const favorites = sanitizeList(data);
      if (!favorites.length) throw new Error("Nenhum favorito válido encontrado");
      return favorites;
    }

    throw new Error("Arquivo ou link não reconhecido pelo MeteoPanel");
  }

  function buildShareLink() {
    const favorites = compactFavorites(getCurrentFavorites());
    if (!favorites.length) throw new Error("Nenhum favorito para compartilhar");

    const url = new URL(window.location.href);
    url.hash = `marine=${encodePayload({ v: 1, f: favorites })}`;
    return url.toString();
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Cópia indisponível");
  }

  function setTransferStatus(message, isError = false) {
    transferStatus.textContent = message;
    transferStatus.classList.toggle("is-error", isError);
  }

  function updateTransferState() {
    const count = getCurrentFavorites().length;
    transferCount.textContent = count === 1 ? "1 local salvo neste dispositivo." : `${count} locais salvos neste dispositivo.`;
    [copyLinkButton, qrButton, exportButton].forEach((button) => { button.disabled = count === 0; });
    setTransferStatus("");
    qrPanel.hidden = true;
    qrCode.replaceChildren();
  }

  function loadQrLibrary() {
    if (typeof window.QRCode === "function") return Promise.resolve();

    const existing = document.getElementById("marineQrLibrary");
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "marineQrLibrary";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.referrerPolicy = "no-referrer";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("QRCode.js não carregou"));
      document.head.appendChild(script);
    });
  }

  async function showQrCode() {
    try {
      const link = buildShareLink();
      qrButton.disabled = true;
      setTransferStatus("Gerando QR code…");
      await loadQrLibrary();
      if (typeof window.QRCode !== "function") throw new Error("Gerador de QR indisponível");

      qrCode.replaceChildren();
      new window.QRCode(qrCode, {
        text: link,
        width: 220,
        height: 220,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
      qrPanel.hidden = false;
      setTransferStatus("Aponte a câmera do outro dispositivo para o QR code.");
    } catch (error) {
      console.error("MeteoPanel: falha ao gerar QR code", error);
      setTransferStatus("Não foi possível gerar o QR code. Use “Copiar link”.", true);
    } finally {
      qrButton.disabled = false;
    }
  }

  function exportFavorites() {
    const favorites = sanitizeList(getCurrentFavorites()).map(({ name, lat, lon }) => ({ name, lat, lon }));
    if (!favorites.length) return;

    const data = {
      format: "meteopanel-marine-favorites",
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meteopanel-favoritos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setTransferStatus("Arquivo de backup criado.");
  }

  function makeImportedFavorite(item, index) {
    const randomId = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;

    return {
      id: `marine-import-${randomId}`,
      name: item.name,
      lat: item.lat,
      lon: item.lon
    };
  }

  function clearTransferHash() {
    if (!window.location.hash.startsWith("#marine=")) return;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }

  function openImportPreview(favorites) {
    pendingImport = sanitizeList(favorites);
    if (!pendingImport.length) throw new Error("Nenhum favorito válido encontrado");

    const current = getCurrentFavorites();
    const currentKeys = new Set(current.map(coordinateKey));
    const newCount = pendingImport.filter((item) => !currentKeys.has(coordinateKey(item))).length;
    const duplicateCount = pendingImport.length - newCount;

    importSummary.textContent = duplicateCount
      ? `${pendingImport.length} locais encontrados: ${newCount} novos e ${duplicateCount} já existentes neste dispositivo.`
      : `${pendingImport.length} ${pendingImport.length === 1 ? "local encontrado" : "locais encontrados"}.`;

    importList.replaceChildren();
    pendingImport.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} · ${item.lat.toFixed(5)}, ${item.lon.toFixed(5)}`;
      importList.appendChild(li);
    });

    closeDialog(transferDialog);
    showDialog(importDialog);
  }

  function persistImported(favorites, mode) {
    const current = getCurrentFavorites();
    let nextFavorites;

    if (mode === "replace") {
      nextFavorites = favorites.map(makeImportedFavorite);
    } else {
      const existingKeys = new Set(current.map(coordinateKey));
      const additions = [];
      favorites.forEach((item, index) => {
        const key = coordinateKey(item);
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        additions.push(makeImportedFavorite(item, index));
      });
      nextFavorites = [...current, ...additions];
    }

    if (!safeStorageSet(storageKey, JSON.stringify(nextFavorites))) {
      importSummary.textContent = "Este navegador não permitiu salvar os favoritos importados.";
      return false;
    }

    const selectedId = safeStorageGet(selectedStorageKey);
    if (!nextFavorites.some((item) => item.id === selectedId)) {
      if (nextFavorites[0]?.id) safeStorageSet(selectedStorageKey, nextFavorites[0].id);
      else safeStorageRemove(selectedStorageKey);
    }

    return true;
  }

  function finishImport(mode) {
    if (!pendingImport?.length) return;

    if (mode === "replace") {
      const confirmed = window.confirm("Substituir todos os favoritos marítimos deste dispositivo pelos locais importados?");
      if (!confirmed) return;
    }

    if (!persistImported(pendingImport, mode)) return;
    pendingImport = null;
    clearTransferHash();
    window.location.reload();
  }

  transferButton.addEventListener("click", () => {
    updateTransferState();
    showDialog(transferDialog);
  });

  [transferClose, transferDone].forEach((button) => {
    button.addEventListener("click", () => closeDialog(transferDialog));
  });

  copyLinkButton.addEventListener("click", async () => {
    try {
      await copyText(buildShareLink());
      setTransferStatus("Link copiado. Abra-o no outro dispositivo para importar os locais.");
    } catch (error) {
      console.error("MeteoPanel: falha ao copiar link", error);
      setTransferStatus("Não foi possível copiar o link neste navegador.", true);
    }
  });

  qrButton.addEventListener("click", showQrCode);
  exportButton.addEventListener("click", exportFavorites);
  importButton.addEventListener("click", () => importFileInput.click());

  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files?.[0];
    importFileInput.value = "";
    if (!file) return;

    if (file.size > 256 * 1024) {
      setTransferStatus("Arquivo grande demais para um backup de favoritos.", true);
      return;
    }

    try {
      const data = JSON.parse(await file.text());
      openImportPreview(parseImportPayload(data));
    } catch (error) {
      console.error("MeteoPanel: arquivo de favoritos inválido", error);
      setTransferStatus("O arquivo selecionado não é um backup válido do MeteoPanel.", true);
    }
  });

  [importClose, importCancel].forEach((button) => {
    button.addEventListener("click", () => {
      pendingImport = null;
      clearTransferHash();
      closeDialog(importDialog);
    });
  });

  importMerge.addEventListener("click", () => finishImport("merge"));
  importReplace.addEventListener("click", () => finishImport("replace"));

  function handleIncomingLink() {
    if (!window.location.hash.startsWith("#marine=")) return;

    const encoded = window.location.hash.slice("#marine=".length);
    clearTransferHash();

    try {
      const data = decodePayload(encoded);
      openImportPreview(parseImportPayload(data));
    } catch (error) {
      console.error("MeteoPanel: link de favoritos inválido", error);
      updateTransferState();
      setTransferStatus("Este link de favoritos é inválido ou está incompleto.", true);
      showDialog(transferDialog);
    }
  }

  handleIncomingLink();
})();
