# Third-party services, data and software

Last reviewed: **2026-09-07**.

The MIT License in [`LICENSE`](LICENSE) applies to the **original MeteoPanel source code and documentation created for this repository**. It does **not** relicense, transfer, or grant rights over third-party services, forecast data, map data, map tiles, widgets, trademarks, logos, libraries, or other externally supplied content.

MeteoPanel is a client-side dashboard. The repository does not bundle third-party weather datasets; the browser requests external services when the page is used. Anyone redistributing, deploying, modifying, or commercializing MeteoPanel is responsible for checking and complying with the current terms of every third-party provider they keep enabled.

## Open-Meteo

MeteoPanel currently uses Open-Meteo for:

- general weather conditions and forecast data;
- marine data, including modeled sea-surface temperature.

Open-Meteo states that API data are provided under **Creative Commons Attribution 4.0 International (CC BY 4.0)** and require attribution. The application displays an Open-Meteo attribution/link alongside the data.

The **Free API** is subject to Open-Meteo's current terms and is intended for **non-commercial use**. At the time of this review, Open-Meteo publishes limits of 10,000 API calls/day, 5,000/hour and 600/minute for the free service. Commercial deployments should review the current pricing/terms and use an appropriate plan or endpoint.

References:

- https://open-meteo.com/en/licence
- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing

Open-Meteo's own server/source code licensing (including AGPL-licensed components) is separate from the MeteoPanel MIT License. MeteoPanel consumes the hosted API; it does not incorporate or relicense Open-Meteo's server code.

## OpenStreetMap data and tile service

The map used to select marine locations is rendered with OpenStreetMap data/tiles.

OpenStreetMap data are provided under the **Open Data Commons Open Database License (ODbL)** and require attribution. The map keeps visible `© OpenStreetMap contributors` attribution through Leaflet.

The public OpenStreetMap tile servers are a community-funded service and have a **Tile Usage Policy** separate from the data license. A larger or commercial deployment should not assume that the public tile infrastructure is an unlimited hosting service and should review the current policy or choose an appropriate tile provider.

References:

- https://www.openstreetmap.org/copyright
- https://operations.osmfoundation.org/policies/tiles/

## Nominatim (OpenStreetMap geocoding)

The marine-location search uses the public Nominatim service at `nominatim.openstreetmap.org` for user-initiated place searches and reverse geocoding.

The public Nominatim instance has its own Acceptable Use Policy. At the time of this review, the policy includes, among other requirements:

- an absolute maximum of 1 request per second;
- valid application identification through HTTP headers available to the client/platform;
- visible OpenStreetMap attribution;
- no client-side autocomplete using the public service;
- moderate, user-triggered website/app use only;
- heavier or scaled use should move to another provider or a self-hosted instance and should use appropriate caching/proxying.

MeteoPanel deliberately uses an explicit **Search** action rather than autocomplete. If the project grows beyond small/personal usage, the geocoding architecture should be reviewed before deployment.

Reference:

- https://operations.osmfoundation.org/policies/nominatim/

Search queries and map coordinates submitted through this feature are sent directly from the user's browser to the relevant OpenStreetMap/Nominatim services.

## Leaflet

MeteoPanel loads **Leaflet 1.9.4** as an external client-side dependency for the interactive map.

Leaflet is licensed under the **BSD 2-Clause License**. Leaflet is not relicensed under MeteoPanel's MIT License; its own copyright and license terms remain applicable.

References:

- https://github.com/Leaflet/Leaflet
- https://github.com/Leaflet/Leaflet/blob/main/LICENSE

## QRCode.js

The marine-favorites transfer feature uses **QRCode.js 1.0.0** to generate QR codes in the user's browser.

QRCode.js is licensed under the **MIT License** by its upstream authors. Its own copyright/license terms remain applicable and are separate from the copyright of the original MeteoPanel code.

MeteoPanel loads the minified library **only when the user asks to display a QR code**, from the cdnjs-hosted URL:

- `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`

The library performs QR generation client-side. MeteoPanel does not send the favorites payload to a remote QR-generation API. Loading the library itself still makes an ordinary browser request to the CDN, which may receive normal request metadata under its own policies.

References:

- https://github.com/davidshimjs/qrcodejs
- https://github.com/davidshimjs/qrcodejs/blob/master/LICENSE
- https://cdnjs.com/libraries/qrcodejs

## Windy

MeteoPanel embeds a visualization provided by **Windy.com**. Windy services, visualizations, data, branding and other content remain governed by Windy's own terms and the rights of Windy and its suppliers. They are not covered by the MeteoPanel MIT License.

**Important:** Windy's current general terms contain specific restrictions for its embeddable widget, including language concerning use by weather apps and commercial websites. The presence of MIT-licensed MeteoPanel code does not override those restrictions. Before redistributing, publicly deploying, or commercializing a version that keeps the Windy embed, review Windy's current terms and obtain any permission that may be required, or remove/replace that integration.

References:

- https://account.windy.com/agreements/windy-terms-of-use
- https://www.windy.com/widgets

## Windguru

MeteoPanel uses Windguru in two distinct ways:

- a **forecast widget** for the configured Florianópolis spot;
- **Windguru Station / Windguru Live widgets** for the local station `6023` (“Aldeia da conceição, Aldeia”), including current wind observations and a recent-wind graph.

The widgets, forecasts, station observations, branding and any other content supplied by Windguru remain third-party material and are **not** covered by the MeteoPanel MIT License.

The Windguru Station documentation states that station owners can generate embed code for Windguru Live widgets/graphs. Availability of a specific station widget may depend on the station owner's configuration, including domain restrictions. MeteoPanel does not bypass such restrictions; if the provider refuses the embed, the application shows a fallback link to the original station page.

Anyone redistributing or deploying the project should review Windguru's current terms and widget/station rules directly. MeteoPanel does not claim ownership of Windguru forecasts, station measurements, interfaces, trademarks or branding.

References:

- https://www.windguru.cz/
- https://www.windguru.cz/station/6023
- https://stations.windguru.cz/
- https://www.windguru.cz/help.php?sec=terms

## Trademarks and affiliation

Windy, Windguru, Open-Meteo, OpenStreetMap, Leaflet, QRCode.js and any associated names, logos or marks belong to their respective owners where applicable.

MeteoPanel is an independent project. The use of a service, link, widget or attribution does **not** imply sponsorship, endorsement, partnership or affiliation with those providers or with the owner/operator of any integrated weather station.

## External-service availability and privacy

Because MeteoPanel is intentionally serverless, the user's browser communicates directly with third-party providers. Those providers may receive ordinary request metadata such as IP address, browser information and referrer information according to their own privacy policies.

External APIs/widgets can change, become unavailable, alter their terms, impose rate limits, restrict allowed domains, or discontinue endpoints without changes to this repository. The MIT License's warranty disclaimer applies to MeteoPanel's code; third-party providers also have their own warranties/disclaimers and terms.

## No safety or navigation guarantee

Weather and marine information in MeteoPanel is informational and may be delayed, modeled, incomplete, unavailable or inaccurate. Local station observations can also be affected by sensor placement, obstruction, calibration, transmission failures or highly localized conditions. Sea-surface temperature is a modeled value and is not necessarily an in-situ measurement at the shoreline or along a swimming route.

Do not use MeteoPanel as the sole basis for open-water swimming, crossings, sailing, navigation, emergency decisions or other safety-critical activity. Users should consult appropriate official/local sources, current conditions and their own safety procedures.