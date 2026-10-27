# Gravi3

Gravi3 is an interactive course that teaches the **three-body problem** to adults with no physics background, through experiments, a contextual AI tutor and six exact periodic orbits rendered in 3D.

## What is the three-body problem?

Given the positions and velocities of three masses that attract each other through Newtonian gravity, where will they be later? For **two** bodies Newton solved it in 1687: they follow ellipses, parabolas or hyperbolas and a formula predicts their motion forever. For **three**, Poincaré showed around 1890 that there is no simple general solution, and that the system is usually **chaotic**: a tiny change in the starting conditions leads to completely different paths. Yet some very precise starting conditions produce **periodic orbits** that repeat exactly, such as Lagrange's equilateral triangle (1772), the figure eight (1993) and the families found by computer in 2013.

The Sun–Earth–Moon system, spacecraft trajectories and the James Webb telescope near the L2 point all depend on these ideas.

## What the app does

1. **Learn** (`/{locale}/learn`): understand the law of gravity with two bodies. Change masses and distance, predict what happens to the force, and check it in a 3D laboratory backed by deterministic SI calculations. Then add a third body in a live simulator: four starting points (figure eight, Lagrange, the chaotic Pythagorean problem, Sun–planet–moon), energy and center-of-mass readouts, velocity vectors, a 1% perturbation to reveal chaos, and editable masses and velocities.
2. **Ask the tutor:** an LLM tutor (any OpenAI-compatible provider) answers with the current experiment values and proposes one-click experiments ("Try it: r = 10 m", "Try it: Pythagorean in the simulator", "See the Lagrange orbit", "Try it: go to 20% of the period", "Try it: play at 0.5×"). It adapts to what the learner shows: a wrong prediction is mapped on the server to the misconception behind it, and the tutor addresses that first. The server only accepts actions allowed on the current page and within their ranges. The tutor is optional; every calculation works without it.
3. **Orbits** (`/{locale}/orbits`): six periodic three-body solutions (Lagrange, figure eight, Butterfly I, Goggles, Moth I, Yin-Yang I), each with a shareable URL, 3D playback controls and scientific details. Trajectories are generated offline from published initial conditions and validated numerically.

Spanish/English, light/dark/system themes, keyboard controls, mobile layout and an explicit reduced mode without AI credentials.

## Run with Docker

Docker Engine and Compose v2.24 or newer are sufficient. Node.js is not required on the host.

```sh
docker compose up --build
```

Open http://localhost:3000. The complete learning experience and orbit gallery work without credentials. To enable the tutor, set `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` in `.env.local` before starting; optional `.env` is also supported. Compose injects these files at runtime. Neither is copied into the image.

If port 3000 is occupied, use `GRAVI3_PORT=3100 docker compose up --build`. Stop with `docker compose down`. No database, migrations or separate infrastructure are needed.

## Run locally

Use **Node.js 24.14.0** and **pnpm 10.34.9**, as pinned in `.nvmrc` and `package.json`.

```sh
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

For production execution:

```sh
pnpm build
pnpm start
```

The build prepares Next.js standalone output with static resources and removes traced environment-file copies. The start helper reads the local environment and runs that standalone server. All application/physics/generation code is TypeScript; the two small Node ESM helpers handle build packaging and startup.

## Enable the real tutor

Create `.env.local` from `.env.example`, supply your provider's key, base URL and model, and restart the application. The tutor talks to any provider exposing the OpenAI Chat Completions API: Groq (the example values), OpenAI, OpenRouter, a local Ollama/vLLM server (any non-empty key when the server ignores it), and so on. `.env.local` takes precedence over `.env`; existing process environment variables take precedence when running locally. Keep keys out of Git, URLs, browser code and build arguments.

`GET /api/health` returns server health and whether the tutor is configured. `GET /api/tutor` reports availability without making a provider call. In Learn, ask what happens when distance doubles: a real answer should explain that force becomes one quarter. Change to Spanish and ask about equal forces versus different accelerations. Live bilingual checks are recorded in [tutor evaluation](docs/tutor-evaluation.md); normal tests use mocks.

With no key or `LLM_ENABLED=false`, the panel explicitly shows reduced mode. Invalid keys, upstream failures and exhausted quota produce controlled errors with manual retry. No static response is presented as an LLM response. The provider receives your question and bounded history/context; conversations are not stored in a database or browser storage, or written to application logs.

### Configuration

| Variable                     | Default                                                | Meaning                                              |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| `LLM_API_KEY`                | absent                                                 | Optional server-only provider credential             |
| `LLM_BASE_URL`               | absent; required with a key                            | OpenAI-compatible API base URL                       |
| `LLM_ENABLED`                | `true`                                                 | Explicit `true`/`false` tutor switch                 |
| `LLM_MODEL`                  | absent; required with a key                            | Model id as named by your provider                   |
| `LLM_REASONING_EFFORT`       | absent                                                 | e.g. `none`/`minimal`/`low`/`high`; reasoning models |
| `LLM_JSON_MODE`              | `true`                                                 | Request JSON replies; `false` if unsupported         |
| `LLM_TIMEOUT_MS`             | `15000`                                                | Provider deadline in milliseconds                    |
| `LLM_MAX_COMPLETION_TOKENS`  | `2048`                                                 | Generation budget including reasoning                |
| `RATE_LIMIT_IP_PER_MINUTE`   | `5`                                                    | Accepted requests per minute bucket                  |
| `RATE_LIMIT_IP_PER_HOUR`     | `30`                                                   | Accepted requests per hour bucket                    |
| `RATE_LIMIT_GLOBAL_PER_HOUR` | `100`                                                  | Accepted requests per process/hour                   |
| `LLM_MAX_CONCURRENT`         | `3`                                                    | Global in-flight provider calls                      |
| `TRUSTED_PROXY_HOPS`         | `0`                                                    | Proxies appending to `X-Forwarded-For`; 0 ignores it |
| `LOG_LEVEL`                  | `info`                                                 | `debug`, `info`, `warn`, `error` or `silent`         |
| `APP_URL`                    | Render external URL, otherwise `http://localhost:3000` | Trusted canonical public URL                         |
| `PORT` / `HOSTNAME`          | `3000` / `0.0.0.0`                                     | Server listen address; platform values are respected |

Request bodies are bounded to 16 KiB, questions to 1,000 characters, and history to six messages of 1,000 characters each. Body reads have a five-second deadline. Quotas use fixed windows; IP storage is bounded to 2,000 expiring keys. `429` responses include `Retry-After`. Reservations are released on completion, failure, timeout or disconnect.

With `TRUSTED_PROXY_HOPS=0`, IP headers are ignored and requests only count against the global and concurrency limits, so one visitor cannot lock out everyone else. Set it to the number of proxies that append to `X-Forwarded-For` (the client is that many entries from the end) only after checking the header on your deployment. Quotas are in memory and require **one process/instance**; they reset on restart and do not coordinate across replicas. Provider token/organization quotas can still be exhausted before local request limits.

## Project structure

```text
src/
  app/                 Next.js App Router: routes, layouts, metadata and thin API handlers
    [locale]/          One route tree per language: /es/..., /en/...
      orbits/[slug]/   One page renders every orbit: /en/orbits/figure-eight
    api/               /api/tutor and /api/health
  features/            One folder per feature, each with components/, model/ (pure logic) and its 3D scene
    home/              Landing page sections
    learning/          Force lab, step-by-step lessons and the live three-body simulator
    orbits/            Gallery, orbit detail and playback controls
    tutor/             Tutor panel, conversation hook and the action contract
  shared/              ui/ (header, providers), three/ (scene helpers) and constants/ (routes, site, HTTP)
  i18n/                Locale config, next-intl routing and locales/{es,en}.json catalogs
  physics/             Framework-free equations, integrator, interpolation and the orbit catalog
  server/              Env config, OpenAI-compatible LLM client, rate limiting, prompts, logging
scripts/               Offline orbit generation and validation (TypeScript)
tests/e2e/             Playwright browser tests
docs/                  Architecture, physics provenance and verification evidence
```

Conventions worth knowing before changing code:

- **Bracketed folders** are Next.js dynamic segments. `[locale]` puts the language in the URL so links are shareable and indexable per language; `[slug]` serves all six orbits from one page, validated against the catalog (unknown slugs return 404). `[...rest]` catches any other path under a locale so it gets the translated `not-found` page; `error.tsx` is the translated error boundary for each page.
- **`'use client'`** marks the boundary where a Server Component hands over to browser code that needs state, effects or browser APIs. It appears only on boundary files (`header`, `providers`, `gallery`, `learning-experience`, `orbit-player`, `tutor-panel`, and `error`, which Next.js requires to be a client component); modules they import are client code automatically. Everything else renders on the server.
- **No magic strings:** paths come from `src/shared/constants/routes.ts`, limits and error codes from `src/features/tutor/model/tutor-contract.ts`, log event names from `src/server/logger.ts`.
- **Lint-enforced boundaries:** `physics`, each feature's `model/` and `shared/constants` cannot import React, Next.js, Three.js or server code; UI cannot import `src/server`; a feature's UI cannot be imported by another feature (only its `model/`, and the tutor panel) and `shared` cannot import a feature. Complexity, nesting depth, parameter count and file length are capped.
- **Design tokens and fonts:** colors, type scale and font roles are CSS custom properties at the top of `src/app/globals.css`; no text is smaller than 12 px. Fonts come from `next/font/google` (`src/app/fonts.ts`), which downloads them at build time and serves them from the app, so pages make no runtime request to Google.
- **Logging:** Pino JSON on the server only, with named events and redaction; prompts, messages, keys and raw IPs are never logged.

## Tests and scientific data

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
# Against an already-running Docker service:
PLAYWRIGHT_BASE_URL=http://localhost:3100 pnpm test:e2e
pnpm orbits:generate
pnpm orbits:validate
pnpm orbits:previews   # redraw gallery previews from the committed trajectories
```

CI runs formatting, linting, strict type checking, unit/server tests, committed-trajectory validation, production build and desktop/mobile Chromium browser tests, including accessibility scans in both themes. It uses no real AI credentials. Docker is also validated before handoff.

The generation pipeline uses adaptive Dormand–Prince 5(4), published high-precision initial conditions and cubic Hermite interpolation. Independent finer integration checks labeled position/velocity return, conserved quantities, convergence and interpolation. No softening, endpoint blending or hand-drawn substitute orbit is used. Each detail loads one trajectory; gzip sizes are about 19–115 KB.

See [physics and provenance](docs/physics.md), [per-orbit measurements](docs/orbit-validation.json), [architecture and tradeoffs](docs/architecture.md), and [verification evidence](docs/verification.md). Regeneration is deterministic/offline for the pinned runtime and is not performed on every request or web build.

## Routes and interaction

- `/es` and `/en`: introduction.
- `/{locale}/learn`: experiment, prediction and contextual tutor.
- `/{locale}/orbits`: six-solution gallery. `?family=I.A|I.B|II.C|analytic`, `?sort=catalog|period|year` and `?compare=slug,slug` (up to three, drawn side by side at the same fraction of their periods) are kept in the URL.
- `/{locale}/orbits/{slug}`: direct, shareable animated detail. Slugs are `lagrange`, `figure-eight`, `butterfly-i`, `goggles`, `moth-i`, `yin-yang-i`.

Orbits start paused. Use Play, Restart, speed, timeline, front/3D, trails and camera reset. The physical solution remains planar while the camera changes perspective. A period corresponds to 20 playback seconds at 1×; scientific periods use normalized units. Theme/locale changes retain experiment and orbit context. Returning to the gallery, with its link or the browser Back button, restores its filters, order and comparison (from the URL) and its scroll position and focused orbit (from session memory); a reload keeps the URL state and resets the rest.

## Deploy on Render

The repository owner manages Render deployment. No hosted URL is claimed until it is actually deployed.

Create a Blueprint from this repository (`main` branch); `render.yaml` defines a free Docker web service with `/api/health` and deployment after passing checks. For an ordinary service, select Docker, the `main` branch, free plan, one instance, and the same health path.

The app uses Render's [documented `RENDER_EXTERNAL_URL`](https://render.com/docs/environment-variables#render_external_url) when `APP_URL` is absent. Set `APP_URL` explicitly for a custom domain. The blueprint pre-fills the Groq base URL and model; add `LLM_API_KEY` as a runtime secret if you want the tutor enabled (change the other two to use another provider); it is optional for deployment. Keep `TRUSTED_PROXY_HOPS=0` until you have checked what Render puts in `X-Forwarded-For`.

Free services [sleep after inactivity and have shared usage quotas](https://render.com/docs/free), so an initial visit can wait for startup. No keep-alive pings are provided. A working local Docker path satisfies the delivery alternative if no online deployment is supplied.

## Limits, attribution and AI use

Numerical checks establish finite-precision agreement over a period, not a proof of stability or indefinite integration accuracy. The live simulator lets you edit masses and velocities, but there is no search for new periodic orbits. The tutor can only propose allowlisted, range-checked experiments that run when you press their button; it has no browsing or code tools. There are no accounts, database, persistent conversation or paid fallback. A mounted tutor conversation is cleared when its panel unmounts or the page reloads.

Automated mobile Chromium emulation does not replace a physical iPhone/Safari test. Accessibility scans and manual checks are basic verification, not certification. Frame rate and provider availability depend on device, account and network. The tutor can make mistakes; deterministic calculations remain available to check it.

Scientific initial conditions are attributed to Šuvakov/Dmitrašinović, Li/Liao and the figure-eight authors in [physics documentation](docs/physics.md). All trajectories and previews are generated by this repository; no third-party animation assets or implementation code are copied. Dependency licenses are listed in [third-party notices](docs/third-party.md). Selection correspondence, the original PDF and design reference images are not published.

AI assistance was used substantially for planning, code, scientific-source research and tests. Decisions were checked against the original brief, primary scientific sources, independent numerical integration, production browser flows and real bilingual LLM responses (Groq `openai/gpt-oss-20b`). Review the code and evidence; generated output alone is not treated as validation.
