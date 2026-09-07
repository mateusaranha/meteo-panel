# Contributing to MeteoPanel

Thanks for considering a contribution.

MeteoPanel is intentionally a small, static, client-side project. Contributions should preserve that simplicity unless there is a clear reason to introduce additional infrastructure.

## Development principles

- Prefer plain HTML, CSS and JavaScript over new frameworks or build steps.
- Keep the project deployable as a static site (for example, GitHub Pages).
- Keep external-service failures isolated: one provider failing should not break the rest of the dashboard.
- Avoid storing personal data on a server. Current user preferences/favorites are kept in `localStorage`.
- Keep the interface usable on both desktop and mobile.
- Do not add secrets, private API keys or credentials to the repository.

## Third-party integrations

Before adding or changing an external provider:

1. review the provider's current terms, license and attribution requirements;
2. document the integration in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md);
3. preserve any required visible attribution/branding;
4. do not scrape or redistribute content when an official API/widget/embed is required;
5. consider rate limits, CORS, privacy and failure states;
6. do not assume that MeteoPanel's MIT License grants rights to third-party data or content.

### OpenStreetMap / Nominatim

The public Nominatim service has strict usage rules, including a maximum request rate and a prohibition on using the public service for client-side autocomplete. Keep searches explicitly user-triggered. If usage grows beyond a small/personal project, move geocoding to a suitable provider or self-hosted service rather than increasing load on the public instance.

## Local development

Serve the repository over HTTP:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

There is no build step.

## Before submitting a change

Check at least:

- the page loads without JavaScript errors;
- Windy, Windguru and Open-Meteo failures do not break unrelated cards;
- the layout works on a narrow/mobile viewport;
- marine favorites can be added, selected, edited and removed;
- location search does not save a place before the user confirms the selected point;
- required third-party attribution remains visible;
- documentation is updated when an external dependency or service changes.

For larger changes, opening an issue first is encouraged so the scope can be discussed before implementation.

## License of contributions

By contributing original code or documentation to this repository, you agree that your contribution may be distributed under the repository's **MIT License**, unless explicitly stated otherwise and accepted by the maintainer.

Do not submit third-party code, data or assets unless their license permits the intended use and their attribution/license requirements are documented.
