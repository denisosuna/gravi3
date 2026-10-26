# Gravi3

An interactive introduction to Newtonian gravity and six periodic solutions of the three-body problem, built with TypeScript and Next.js. Scientific validation, the bilingual learning experience, the real Groq tutor, and Docker execution are delivered in separate pull requests.

## Development

Use Node.js 24.14.0 (`nvm use`) and pnpm 10.34.9, as pinned in this repository. Enable Corepack if needed.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:3000. No credentials are required to build or start the application. Environment configuration is documented in `.env.example`; never commit `.env.local`.

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

The CI runs formatting, linting, type checking, tests and production build without external credentials. At bootstrap there are no domain tests yet; the test runner allows an empty suite until the physics module is introduced.

## Structure

`src/app` contains Next.js routes. Physics, visualization, learning and server modules are added as independently testable responsibilities. Generated scientific data will be committed with provenance and validation reports. Source code, comments and technical documentation are written in English; product content supports Spanish and English.
