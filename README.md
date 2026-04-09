# English Learning Hub

English Learning Hub is a full-stack English study app built around long-term retention. It combines SRS flashcards, AI-generated study material, writing feedback, video-based learning, and progress tracking in a single workflow.

## Core features

- SRS review powered by the SM-2 algorithm
- AI course generation with vocabulary, grammar, reading, and exercises
- Daily generated learning content by proficiency level
- Writing practice with AI feedback and submission history
- Video learning with transcript browsing and word capture
- Gamification with XP, streaks, and activity heatmap

## Tech stack

### Frontend

- React 19
- Vite 7
- Tailwind CSS 4
- shadcn/ui
- tRPC 11
- Wouter

### Backend

- Express 4
- tRPC 11
- Drizzle ORM
- MySQL / TiDB
- Ollama for local AI generation

## Project structure

```text
client/          React frontend
server/          Express + tRPC backend
drizzle/         Database schema and migrations
shared/          Shared constants and types
patches/         Package patches
```

## Environment variables

Copy `.env.example` to your own local env file and set the values below.

### Required

- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `APP_ORIGIN`

### Optional

- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`
- `OWNER_OPEN_ID`
- `OWNER_NAME`

## Local development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables.

3. Create or migrate the database:

```bash
pnpm db:push
```

4. Start the development server:

```bash
pnpm dev
```

## Validation commands

```bash
pnpm check
pnpm test
pnpm build
```

## Notes on testing

- Unit tests run without a live database by using deterministic environment defaults in test mode.
- Integration behavior that depends on MySQL or Ollama should still be validated in a fully provisioned local or CI environment.

## Deployment expectations

- Production requires a reachable MySQL-compatible database.
- OAuth redirect origin must match `APP_ORIGIN`.
- If AI course generation and writing feedback are enabled, Ollama must be reachable from the server runtime.
