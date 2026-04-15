# English Learning Hub

Full-stack English learning platform focused on long-term retention:
SRS flashcards, daily generated content, writing practice with AI feedback, video learning, and progress tracking.

## Prerequisites

- Node.js 18+ (CI uses Node 20)
- pnpm
- MySQL 8.0+ (or TiDB/MySQL-compatible)
- (Optional) Ollama for AI features

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

App runs at `http://localhost:3000`.

## Scripts

- Install: `pnpm install`
- Dev (Vite + server): `pnpm dev`
- Build: `pnpm build`
- Start (production): `pnpm start`
- Test: `pnpm test`
- Typecheck (prod + tests): `pnpm typecheck`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Full gate (CI/local): `pnpm check`
- Migrate: `pnpm db:migrate`
- Generate migrations: `pnpm db:generate`
- Seed (optional): `pnpm db:seed`

## Environment Variables

Copy `.env.example` → `.env`.

### Required (runtime)

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: cookie/session signing secret (32+ chars outside tests)
- `VITE_APP_ID`: OAuth app id
- `OAUTH_SERVER_URL`: OAuth server API origin
- `VITE_OAUTH_PORTAL_URL`: OAuth portal origin
- `APP_ORIGIN`: public origin used to build redirect URIs (e.g. `http://localhost:3000`)

### Optional

- `PORT`: server port (default `3000`)
- `OLLAMA_BASE_URL`: (default `http://localhost:11434`)
- `OLLAMA_MODEL`: (default `mistral`)
- `OWNER_OPEN_ID`, `OWNER_NAME`
- `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`
- `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`
- `VITE_FRONTEND_FORGE_API_URL`, `VITE_GOOGLE_MAP_ID`

## OAuth Callback Setup

Server endpoints:

- Start login: `GET /api/oauth/start?redirect=/dashboard`
- Callback: `GET /api/oauth/callback`

Configure your OAuth provider callback whitelist to include:

```text
{APP_ORIGIN}/api/oauth/callback
```

Frontend login redirects through `/api/oauth/start` and will return to `/dashboard` by default.

## Ollama (Optional)

Ollama is **optional** for core features (auth, SRS, daily content, videos, writing challenge storage).

It is **required** for AI-powered endpoints:

- `aiCourse.generate`
- `writing.checkGrammar`
- `writing.submit` (feedback/corrections)

If Ollama is not running, those endpoints will fail while the rest of the app remains usable.

## Database & Migrations

Apply migrations before running `dev` or `start`:

```bash
pnpm db:migrate
```

Generate a new migration after editing `drizzle/schema.ts`:

```bash
pnpm db:generate
```

## Production Notes

- `NODE_ENV=production` must run on the configured `PORT` with **no automatic port fallback**.
- Ensure `APP_ORIGIN` matches the deployed origin exactly (OAuth + cookies depend on it).
- Run `pnpm db:migrate` during deploy before `pnpm start`.

## Testing & CI

The test suite includes integration tests that require a MySQL database with migrations applied.

Typical local flow:

```bash
pnpm db:migrate
pnpm test
```

CI runs: install → migrate → lint → typecheck → test → build.

## Release Packaging

Prefer `git archive` so the release contains tracked sources only:

```bash
git archive --format=zip --output release/english-learning-hub.zip HEAD
```

Exclude `node_modules/`, `.git/`, `dist/`, temp files, and local logs (see `.releaseignore`).
