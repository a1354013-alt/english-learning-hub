# English Learning Hub

English Learning Hub is a full-stack English learning platform focused on long-term retention.
The app combines SRS flashcards, daily generated study content, writing practice with AI feedback, video learning, and progress tracking.

## Tech Stack

- Frontend: React 19, Vite 7, Tailwind CSS 4, shadcn/ui, tRPC client, Wouter
- Backend: Node.js, Express 4, tRPC 11
- Database: MySQL-compatible DB (TiDB/MySQL) via Drizzle ORM
- AI: Ollama (local) for course generation and writing feedback
- Auth: OAuth start/callback flow with signed state and cookie sessions

## Repository Structure

- `client/`: React app source
- `server/`: Express and tRPC backend source
- `shared/`: shared constants/types
- `drizzle/`: schema and SQL migrations
- `patches/`: pnpm patched dependencies

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MySQL-compatible database (MySQL, TiDB, etc.)
- Ollama (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd english-learning-hub
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see Environment Variables section below).

4. Set up the database:
   ```bash
   # Generate and run migrations
   pnpm db:push

   # Seed initial data (optional)
   pnpm db:seed
   ```

5. Start Ollama (for AI features):
   ```bash
   ollama serve
   ```

### Development

Start the development server:
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Building

Build for production:
```bash
pnpm build
```

Start production server:
```bash
pnpm start
```

### Testing

Run tests:
```bash
pnpm test
```

Run type checking:
```bash
pnpm check
```

## Environment Variables

Copy `.env.example` and set values for your environment.

### Required

- `DATABASE_URL`: MySQL connection string, e.g. `mysql://user:pass@localhost:3306/english_learning_hub`
- `JWT_SECRET`: at least 32 chars in non-test environments
- `VITE_APP_ID`: OAuth app id
- `OAUTH_SERVER_URL`: OAuth server API origin
- `VITE_OAUTH_PORTAL_URL`: OAuth portal origin
- `APP_ORIGIN`: app origin used for OAuth redirect URI, e.g. `http://localhost:3000`

### Optional AI / external integrations

- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `mistral`)
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`
- `OWNER_OPEN_ID`
- `OWNER_NAME`
- `VITE_FRONTEND_FORGE_API_URL` (map proxy base URL only; no frontend secret key required)
- `VITE_GOOGLE_MAP_ID` (optional map style ID; safe to expose in frontend)

## Runtime Environment Matrix

- `test`: minimally needs `NODE_ENV=test` (the server env loader provides deterministic test defaults for required auth/db variables)

## Database Management

### Migrations

Generate new migration after schema changes:
```bash
pnpm db:generate
```

Apply migrations:
```bash
pnpm db:migrate
```

Or do both:
```bash
pnpm db:push
```

### Seeding

Seed the database with initial data:
```bash
pnpm db:seed
```

## Troubleshooting

### Common Issues

1. **Database connection fails**: Ensure your `DATABASE_URL` is correct and the database is running.

2. **OAuth login not working**: Check that `VITE_APP_ID`, `OAUTH_SERVER_URL`, and `APP_ORIGIN` are properly configured.

3. **AI features not working**: Make sure Ollama is running and accessible at `OLLAMA_BASE_URL`.

4. **Build fails**: Ensure all dependencies are installed with `pnpm install`.

### Development Tips

- Use `pnpm check` to run TypeScript type checking
- Tests are located in `*.test.ts` files and can be run with `pnpm test`
- The app uses hot reloading in development mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT
- `development`: requires full OAuth + DB variables (`DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `APP_ORIGIN`)
- `production`: same as development, plus production-safe values for `APP_ORIGIN`, cookie secret, and optional observability variables

## Install, Dev, Build, Start

1. Install dependencies:

```bash
pnpm install
```

2. Run database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

3. Optional seed data:

```bash
pnpm db:seed
```

4. Start development server:

```bash
pnpm dev
```

5. Production build and run:

```bash
pnpm build
pnpm start
```

## Migration Workflow

- `pnpm db:generate`: generates migration files from `drizzle/schema.ts`
- `pnpm db:migrate`: executes pending migrations
- `pnpm db:push`: convenience command for generate + migrate

For reproducible deployments, run migrations in CI/CD before `pnpm start`.

## OAuth Callback Setup

- OAuth start endpoint: `/api/oauth/start`
- OAuth callback endpoint: `/api/oauth/callback`
- Ensure callback whitelist includes:

```text
{APP_ORIGIN}/api/oauth/callback
```

- Frontend login should route through `/api/oauth/start` (already implemented by `getOAuthStartUrl`).

## AI / Ollama Requirements

If AI features are enabled (`/ai-course`, writing grammar feedback):

1. Install and run Ollama locally.
2. Pull the configured model, for example:

```bash
ollama pull mistral
```

3. Verify `OLLAMA_BASE_URL` and `OLLAMA_MODEL` match your runtime.

Without Ollama, core non-AI flows still run, but AI generation endpoints will fail.

## Testing

Run all tests:

```bash
pnpm test
```

### Test prerequisites

- No DB required (current tests are deterministic unit-contract tests and do not open MySQL connections)
- No migrations required for current test suite
- Ollama is not required to run tests

### Feature/runtime prerequisites (non-test)

- MySQL + migrations are required for `dev`/`start` runtime flows that hit DB-backed APIs
- Ollama is required only for AI generation features (`/ai-course`, writing grammar feedback)

Current suite covers:

- content transform compatibility (string/object/empty/invalid)
- daily content lifecycle contract (active vs archived)
- streak calculation across days and reset behavior
- video progress dedupe contract (video + checkpoint)
- auth storage/session snapshot helpers
- writing challenge daily index semantics
- SM-2 review scheduling and auth logout behavior

## Deployment Checklist

1. Set required environment variables.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm db:migrate`.
4. Run `pnpm test` and `pnpm build`.
5. Deploy and run `pnpm start`.
6. Verify OAuth callback and cookie behavior on the final domain.

## Recommended CI/CD Order

Use this deterministic pipeline order in CI/CD:

1. `pnpm install --frozen-lockfile`
2. `pnpm db:migrate`
3. `pnpm test`
4. `pnpm build`
5. `pnpm start` (smoke check in deploy environment)

## Release Packaging Rules

Do not ship working-directory artifacts directly. Release bundles should include tracked source/config/migrations/docs only.

- Include: `client/`, `server/`, `shared/`, `drizzle/`, `scripts/`, config files, `README.md`, lockfile, `patches/`
- Exclude: `.git/`, `node_modules/`, `.manus/`, `.manus-logs/`, `dist/`, temp files, duplicate zip snapshots, `desktop.ini`

Recommended packaging command:

```bash
git archive --format=zip --output release/english-learning-hub.zip HEAD
```

If you package with custom tooling, apply `.releaseignore` as the exclusion baseline.

## Security Notes

- Do not expose Forge API keys or backend secrets in frontend env variables.
- Production UI error boundary intentionally hides stack traces from end users.
- Detailed errors are logged to console/server logs for diagnostics.
