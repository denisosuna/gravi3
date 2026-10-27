@AGENTS.md

# Gravi3

Interactive course on the three-body problem: a learning lab with an LLM tutor (`/{locale}/learn`) and a gallery of six periodic orbits (`/{locale}/orbits`). One Next.js 16 / React 19 / strict TypeScript app, no database. Code, comments and docs are in English; the UI is Spanish and English.

## Environment

- Node **24.14.0** (`.nvmrc`) and pnpm **10.34.9**. Other Node versions break `tsc` and Vitest.
- `.env.local` holds the tutor key. Never read, print, commit or copy `.env*` files; `.env.example` documents every variable.

## Commands

- `pnpm dev`: dev server. `pnpm build && pnpm start`: production server.
- Before finishing any change: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`.
- `pnpm test:e2e`: Playwright, desktop and mobile. It runs against a production build (`pnpm build` first) and reuses a server already listening on port 3000, which may be a stale image. To test a specific build, start it on another port and set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`.
- Orbit data is generated offline and committed. Run `pnpm orbits:validate` after touching `src/physics`. Run `pnpm orbits:generate` only when the physics or the catalog changes on purpose, and review the diff in `public/orbits` and `docs/orbit-validation.json`.

## Architecture

```text
src/app/        Routes, layouts, metadata, thin API handlers ([locale]/, api/)
src/features/   home, learning, orbits, tutor: each has components/, model/ (pure logic) and its 3D scene
src/shared/     ui/, three/ and constants/ (routes, site, HTTP)
src/physics/    Equations, integrator, interpolation, orbit catalog: no React, Next or server imports
src/server/     Env, LLM client, rate limiting, prompts, logging (sensitive modules use server-only)
src/i18n/       Locale config and locales/{es,en}.json
```

- Boundaries are enforced by ESLint (`eslint.config.mjs`). A feature's UI cannot be imported by another feature; other features and the server may import only `features/*/model`. The tutor panel is the one allowed exception. `shared` never imports a feature.
- The browser replays precomputed orbits. Only the Learn simulator integrates live, with the same integrator as the generator.
- The tutor never does the maths: forces are recomputed on the server and model actions are validated against a strict schema (`features/tutor/model`). Details in `docs/architecture.md` and `docs/physics.md`.
- Three.js loads lazily (`next/dynamic`). The home page animation is a 2D canvas on purpose; do not pull Three.js into it.

## Conventions

- No magic strings or numbers. Paths come from `shared/constants/routes.ts`, tutor limits and error codes from `features/tutor/model/tutor-contract.ts`, log events from `server/log-events.ts`. Name tuning constants and say what they control.
- Reuse before adding: one number formatter (`shared/i18n/number-format.ts`), one frame-delta cap (`shared/constants/animation.ts`). Do not export a symbol that is only used in its own file.
- Comment only what needs clarification.
- User-facing text goes in both `src/i18n/locales/es.json` and `en.json`. Spanish is the longest copy: check layouts at 320 px in Spanish.
- Lint limits (tests exempt from `max-lines`): complexity 12, nesting depth 3, 4 parameters, 250 lines per file. Split by responsibility, not to dodge the rule.
- Accessibility is a requirement: keyboard access, 44 px touch targets, `prefers-reduced-motion`, both themes, and a pause control for any autoplaying motion.
- Next.js here has breaking changes. Read `node_modules/next/dist/docs/` before using an API from memory.

## Workflow

- Branch from `main`, one commit per logical phase, open a PR. Do not push to `main` directly or rewrite its history.
- Conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`). Do not add `Co-authored-by` trailers.
- A change is done when the checks above pass and, for UI changes, you have looked at it in a browser at mobile (375 px) and desktop widths.
- `main` deploys automatically to Render (`render.yaml`, health check `/api/health`).
