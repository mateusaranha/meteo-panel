(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const station = config.aldeiaStation || {};
    const stationId = Number(station.stationId);

    const currentTarget = $("aldeiaCurrentTarget");
    const currentDisplay = $("aldeiaCurrentDisplay");
    const currentLoading = $("aldeiaCurrentLoading");
    const currentSpeed = $("aldeiaCurrentSpeed");
    const currentGust = $("aldeiaCurrentGust");
    const currentDirection = $("aldeiaCurrentDirection");
    const currentArrow = $("aldeiaCurrentArrow");
    const currentUpdated = $("aldeiaCurrentUpdated");
    const currentUpdatedDate = $("aldeiaCurrentUpdatedDate");
    const currentFallback = $("aldeiaCurrentFallback");
    const graphSlot = $("aldeiaGraphSlot");
    const graphTarget = $("aldeiaGraphTarget");
    const graphFallback = $("aldeiaGraphFallback");
    const stationLink = $("aldeiaStationLink");

    if (!Number.isInteger(stationId) || stationId <= 0) return;
    if (
      !currentTarget || !currentDisplay || !currentLoading || !currentSpeed || !currentGust ||
      !currentDirection || !currentArrow || !currentUpdated || !currentUpdatedDate ||
      !currentFallback || !graphSlot || !graphTarget || !graphFallback || !stationLink
    ) return;

    stationLink.href = station.url || `https://www.windguru.cz/station/${stationId}`;

    const formatValue = (value) => {
      const number = Number(String(value ?? "").trim().replace(",", "."));
      if (!Number.isFinite(number)) return "—";
      return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(number);
    };

    const textOf = (selector) => currentTarget.querySelector(selector)?.textContent?.trim() || "";

    function showCurrentFallback() {
      currentLoading.hidden = true;
      currentDisplay.hidden = true;

      const hasOfficialWidget = Boolean(currentTarget.children.length || currentTarget.textContent.trim());
      if (hasOfficialWidget) {
        currentTarget.classList.add("aldeia-current-source--fallback");
        currentTarget.setAttribute("aria-hidden", "false");
        currentFallback.hidden = true;
      } else {
        currentFallback.hidden = false;
      }
    }

    function showGraphFallback() {
      graphFallback.hidden = false;
    }

    function syncCurrentReading() {
      const rawText = currentTarget.textContent.replace(/\s+/g, " ").trim();

      const speedRaw = textOf(".wgs_wind_avg_value") || rawText.match(/([0-9]+(?:[.,][0-9]+)?)\s*kts\b/i)?.[1] || "";
      if (!speedRaw) return false;

      const gustRaw = textOf(".wgs_wind_max_value") || rawText.match(/max:\s*([0-9]+(?:[.,][0-9]+)?)/i)?.[1] || "";
      const directionText = textOf(".wgs_wind_dir_value") || rawText.match(/\b(N|NNE|NE|ENE|E|ESE|SE|SSE|S|SSW|SW|WSW|W|WNW|NW|NNW)\b/i)?.[1] || "";
      const degreesRaw = textOf(".wgs_wind_dir_numvalue") || rawText.match(/\b([0-9]{1,3})\s*°/)?.[1] || "";
      const dateMatch = rawText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}:\d{2})/);

      currentSpeed.textContent = formatValue(speedRaw);
      currentGust.textContent = formatValue(gustRaw);

      const degrees = Number(String(degreesRaw).replace(/[^0-9.-]/g, ""));
      const hasDegrees = Number.isFinite(degrees);
      currentDirection.textContent = [directionText.toUpperCase(), hasDegrees ? `${Math.round(degrees)}°` : ""]
        .filter(Boolean)
        .join(" · ") || "—";

      if (hasDegrees) {
        // Windguru reports the direction the wind comes from; the arrow points where it is going.
        currentArrow.style.transform = `rotate(${(degrees + 180) % 360}deg)`;
        currentArrow.hidden = false;
      } else {
        currentArrow.hidden = true;
      }

      if (dateMatch) {
        currentUpdated.textContent = dateMatch[4];
        currentUpdatedDate.textContent = `${dateMatch[1]}/${dateMatch[2]}`;
      } else {
        currentUpdated.textContent = "agora";
        currentUpdatedDate.textContent = "";
      }

      currentTarget.classList.remove("aldeia-current-source--fallback");
      currentTarget.setAttribute("aria-hidden", "true");
      currentFallback.hidden = true;
      currentLoading.hidden = true;
      currentDisplay.hidden = false;
      return true;
    }

    function watchCurrentWidget() {
      const observer = new MutationObserver(() => syncCurrentReading());
      observer.observe(currentTarget, { childList: true, subtree: true, characterData: true });
      return observer;
    }

    function loadCurrentWidget() {
      watchCurrentWidget();

      const render = () => {
        try {
          window.WgsWidget({
            id_station: stationId,
            wj: station.windUnit || "knots",
            tj: station.temperatureUnit || "c",
            avg_min: 0,
            tmprh: false,
            date_format: "d.m.Y H:i",
            divid: "aldeiaCurrentTarget",
            type: "curr"
          });

          window.setTimeout(() => {
            if (!syncCurrentReading()) showCurrentFallback();
          }, 5000);
        } catch (error) {
          console.error("MeteoPanel: falha ao renderizar vento ao vivo da Aldeia", error);
          showCurrentFallback();
        }
      };

      if (typeof window.WgsWidget === "function") {
        render();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://www.windguru.cz/js/wgs_widget.php?v=${Date.now()}`;
      script.async = true;
      script.onload = () => {
        if (typeof window.WgsWidget !== "function") return showCurrentFallback();
        render();
      };
      script.onerror = showCurrentFallback;
      document.head.appendChild(script);
    }

    function loadGraphWidget() {
      const uid = `wglive_${stationId}_${Date.now()}`;
      graphTarget.id = uid;

      const args = [
        `spot=${stationId}`,
        `uid=${uid}`,
        "direct=1",
        `wj=${encodeURIComponent(station.windUnit || "knots")}`,
        `tj=${encodeURIComponent(station.temperatureUnit || "c")}`,
        "avg_min=0",
        "gsize=520",
        "msize=300",
        "m=3",
        "show=g"
      ];

      const script = document.createElement("script");
      script.src = `https://www.windguru.cz/js/wglive.php?${args.join("&")}`;
      script.async = true;
      script.onerror = showGraphFallback;
      graphSlot.insertBefore(script, graphTarget);

      window.setTimeout(() => {
        const hasRenderedContent = Boolean(
          graphSlot.querySelector("iframe, canvas, svg") ||
          graphSlot.children.length > 2 ||
          graphSlot.textContent.trim()
        );
        if (!hasRenderedContent) showGraphFallback();
      }, 6000);
    }

    loadCurrentWidget();
    loadGraphWidget();
  }

  try {
    start();
  } catch (error) {
    console.error("MeteoPanel: falha ao iniciar estação da Aldeia", error);
  }
})();
