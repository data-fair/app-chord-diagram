# Chord diagram

A [data-fair](https://koumoul-dev.github.io/data-fair/) application: a chord diagram showing the flows between the
values of two text fields of a dataset — one arc per value, one ribbon per pair of connected values, sized by the
aggregated flow.

## Identifiers

The repository, the folder and the package are named `app-chord-diagram`. The `application-name` meta of
`index.html` is `chord-diagram`: it is the key data-fair uses to group the versions of a single application and to
offer version upgrades, so it must stay stable across releases.

The `version` of the package is managed by maintainers at release time — never bump it as a side effect of another
change.

## Stack

- Vue 3.5 (Composition API, `<script setup lang="ts">`)
- Vuetify 4
- Vite 8
- TypeScript, strict mode
- Rendering: plain SVG via d3-chord / d3-shape (arc and ribbon generators)
- Colors: chroma-js (ColorBrewer palettes), dynamic session theme (light / dark / high-contrast)
- Data loading: a single reactive `values_agg` request (`field=source;target`), refreshed on config or filter change

## Development

```
npm install
npm run dev
```

`dev` opens a [zellij](https://zellij.dev/) layout that runs the app (`npm run dev-app`, Vite on the app URL) and
the data-fair dev server (`npm run dev-server`) side by side. To run them separately instead:

```
npm run dev-app     # Vite dev server for the application
npm run dev-server  # data-fair dev server (context: dataset, config, session)
```

### Ports

No port is hardcoded, so several applications can run in parallel. On its first run `npm run dev` calls
`df-dev-env`, which draws three free consecutive ports and writes them to a git-ignored `.env`:

```
APP_PORT=24730        # Vite (and its HMR websocket)
DEV_SERVER_PORT=24731 # df-dev-server — the URL to open
E2E_PORT=24732        # Vite booted by the Playwright webServer
APP_PATH=/app/
```

The file is written once and then left alone: the ports must stay stable for bookmarks and open tabs. Vite reads
it through `loadEnv`, `df-dev-server` through `dotenv`, and the npm scripts through `dotenv --`. Running
`dev-app` or `dev-server` on their own therefore needs the `.env` to exist already — run `npx df-dev-env` once on
a fresh clone. In case of a collision, `npx df-dev-env --force` draws a new triplet (and keeps `APP_PATH`).

`.dev-config.json` is local state too — the configuration the dev server holds in memory and rewrites on every
save. It is git-ignored; edit it through the dev server form, not by hand.

## Configuration schema

The configuration form is generated from `public/config-schema.json` (VJSF 3 / json-layout vocabulary, written by
hand and served as-is to data-fair). Main keys:

- `datasets` — the dataset, plus `staticFilters` applied to every request (values in / out, numeric interval, exists / notExists)
- `sourceField`, `targetField` — the two text columns whose values are connected by the ribbons
- `maxNodes` — only the most connected nodes are displayed, the rest is grouped into an « Autres » node
- `nodeSort` — nodes ordered by decreasing flow, or alphabetically
- `colorscheme` — `qualitative` (ColorBrewer palette via chroma-js), `theme` (cycles primary / secondary / accent
  of the current session theme) or `manual` (one color per value)

`src/config/schema.ts` re-exports the schema so that `df-build-types` can generate the TypeScript configuration
types consumed by the app:

```
npm run build-types
```

This must run before `type-check` and `build` — `src/config/.type/` is gitignored and `src/config/index.ts`
re-exports it, so a fresh clone/CI run fails without this step first.

## Publishing

The package is published on npm as `@data-fair/app-chord-diagram` and served through jsdelivr.
`npm publish` builds `dist/` with `base` set to the jsdelivr URL of the released version
(`prepublishOnly` runs the build with the right `PUBLIC_URL`).

## Tests

```
npm run lint         # eslint (read-only; npm run lint-fix rewrites)
npm run type-check   # vue-tsc --noEmit
npm run test-unit    # Playwright, unit project (pure functions: matrix, colors, chord geometry)
npm run test-e2e     # Playwright, e2e project (real Vite server + browser, mocked data-fair endpoints)
npm run test         # both projects
npm run build        # production build
npm run quality      # everything, plus audit — what the pre-push hook runs
```

The e2e suite mocks `simple-directory` (session, `_public.js`, `_theme.css`) and the dataset `values_agg` endpoint
(see `tests/e2e/fixtures.ts`), and injects `window.APPLICATION` through `page.addInitScript`, so no real
data-fair instance is needed.
