(() => {
  const $ = (id) => document.getElementById(id);

  function start() {
    const config = window.METEO_CONFIG || {};
    const station = config.aldeiaStation || {};
    const stationId = Number(station.stationId);

    const currentTarget = $("aldeiaCurrentTarget");
    const currentFallback = $("aldeiaCurrentFallback");
    const graphSlot = $("aldeiaGraphSlot");
    const graphTarget = $("aldeiaGraphTarget");
    const graphFallback = $("aldeiaGraphFallback");
    const stationLink = $("aldeiaStationLink");

    if (!Number.isInteger(stationId) || stationId <= 0) return;
    if (!currentTarget || !currentFallback || !graphSlot || !graphTarget || !graphFallback || !stationLink) return;

    stationLink.href = station.url || `https://www.windguru.cz/station/${stationId}`;

    function showCurrentFallback() {
      currentFallback.hidden = false;
    }

    function showGraphFallback() {
      graphFallback.hidden = false;
    }

    function loadCurrentWidget() {
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
            if (currentTarget.children.length === 0 && !currentTarget.textContent.trim()) {
              showCurrentFallback();
            }
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
