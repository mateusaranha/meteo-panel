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
  }
};
