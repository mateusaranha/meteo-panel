/**
 * Configuração central do protótipo.
 * Novos locais podem ser adicionados aqui sem alterar o restante da interface.
 */
window.METEO_CONFIG = {
  appName: "MeteoPanel",
  defaultLocation: "florianopolis",
  locations: {
    florianopolis: {
      label: "Florianópolis, SC",
      coordinates: { lat: -27.5945, lon: -48.5477, zoom: 8 },
      windy: { overlay: "wind", model: "ecmwf" },
      windguru: {
        spotId: 105160,
        forecastHours: 120,
        windUnit: "knots",
        temperatureUnit: "c",
        waveUnit: "m"
      }
    }
  },
  windguru: {
    storageKey: "meteo-panel:windguru-favorites:v1",
    selectedStorageKey: "meteo-panel:windguru-selected:v1",
    defaultFavorites: [
      {
        id: "windguru-florianopolis",
        name: "Florianópolis",
        spotId: 105160
      },
      {
        id: "windguru-lagoa-conceicao",
        name: "Lagoa da Conceição",
        spotId: 477589
      }
    ]
  },
  marine: {
    storageKey: "meteo-panel:marine-favorites:v1",
    selectedStorageKey: "meteo-panel:marine-selected:v1",
    defaultFavorites: [
      {
        id: "campeche-example",
        name: "Campeche",
        lat: -27.6828,
        lon: -48.4590
      }
    ]
  }
};
