# AI agent instructions for `bioenergy.org`

## Repository context

- `bioenergy.org` is the Bioenergy Research Centers data portal. It aggregates FAIR dataset feeds from participating BRCs and exposes them through a public web UI and API.
- The repo is a monorepo with three main runtime pieces:
  - `api/`: an Express + Sequelize service that serves dataset search, schema, validation, and messaging endpoints.
  - `client/`: a Vue 3 + Vite frontend for browsing datasets, filtering search results, and rendering schema-version-aware dataset detail pages.
  - `mcp/`: a thin remote MCP server that forwards dataset operations to the API rather than reimplementing business logic.
- The system is schema-driven. Dataset feeds declare a `schema_version`, the API exposes supported schemas at `/api/schema`, and validation happens through the `/api/validate` endpoint.
- The application is usually run through Docker Compose. In development, the client and API use hot-reload dev containers; in production mode the client is served through nginx.

## Build, test, and lint commands

- Prefer working from the relevant package directory instead of the repo root:
  - API: `cd api`
  - Client: `cd client`
  - MCP server: `cd mcp`
- Local Node development should follow `.nvmrc` (`v20.11.0`). The GitHub Actions workflow currently runs Node 22.
- Before running the stack locally, copy `.env.sample` to `.env` and fill in the required variables. Empty placeholder `VITE_*` entries may be needed for some Docker commands.

### Full stack

- Development stack with hot reload: `docker compose -f docker-compose.dev.yml up --build --watch`
- Production-like stack: `docker compose up`
- Stop and remove containers/volumes: `docker compose down`
- Rebuild and restart the stack: `docker compose up --build`

### Lint

- Client lint/fix: `cd client && npm run lint`
- Repository lint in CI: `npm install --save ./api/ && npm ci && npx eslint .`

### Build

- Client production build: `cd client && npm run build`
- The API and MCP services are containerized rather than separately built with npm scripts.

### Tests

- README expects tests to run in Docker and they do not require a database connection.
- API full suite: `cd api && npm test`
- API watch mode: `cd api && npm run test:watch`
- API coverage: `cd api && npm run test:coverage`
- API single test file: `cd api && npx vitest run tests/services/githubService.test.js`

- Client full suite: `cd client && npx vitest run`
- Client watch mode: `cd client && npm run test:unit`
- Client coverage: `cd client && npm run test:coverage`
- Client single test file: `cd client && npx vitest run src/__tests__/components/AuthorList.test.js`

- README-documented Docker test commands:
  - `docker compose -f docker-compose.dev.yml run --rm --no-deps api npx vitest run`
  - `docker compose -f docker-compose.dev.yml run --rm --no-deps client npx vitest run`
- Coverage thresholds are enforced at 80% for statements, branches, functions, and lines in both API and client Vitest configs.

### Data operations

- Import BRC data feeds from the repo root: `docker compose run api node scripts/import_datafeeds.js`
- Redirect import validation output to a file if needed: `docker compose run api node scripts/import_datafeeds.js 2>&1 > import_datafeeds.txt`
- Validate a local JSON feed (for example `jbei.json`) using the API endpoint and either the schema declared in the dataset itself or a specific schema version:
  - `curl -X POST -H "Content-Type: application/json" --data-binary @jbei.json https://api.bioenergy.org/api/validate > validation-results.json`
  - `curl -X POST -H "Content-Type: application/json" --data-binary @jbei.json "https://api.bioenergy.org/api/validate?schema_version=0.1.13"`
- List currently supported JSON schemas: `https://api.bioenergy.org/api/schema`
- Retrieve a specific schema version (for example `0.1.12`): `https://api.bioenergy.org/api/schema/0.1.12`

### Troubleshooting

- If Docker-based test runs fail with stale-image symptoms such as `npx: not found`, remove the old image and rebuild, e.g.:
  - `docker image rm bioenergyorg-client`
  - `docker compose -f docker-compose.dev.yml build --no-cache client`

## High-level architecture

- This repo is a monorepo with three runtime pieces:
  - `api/`: Express + Sequelize + Postgres
  - `client/`: Vue 3 + Vite + Pinia
  - `mcp/`: a thin remote MCP server that exposes dataset API calls as MCP tools
- Docker Compose is the normal way to run the stack. In production mode the client is served through nginx; in development mode the client and API use their dev Dockerfiles with file watching.
- The API stores datasets as JSONB records with `uid` as the primary key and `schema_version` as a column used for schema-aware behavior. Most search, filtering, and metrics logic operates directly on the JSON payload in Postgres rather than on a large normalized schema.
- API route responsibilities are split into:
  - `GET /api/datasets`: paginated local dataset search plus facet aggregation
  - `POST /api/datasets`: advanced/federated search path for sequence-based lookups via `strategyManager`
  - `GET /api/schema` and `GET /api/schema/:version`: serve supported schema metadata and raw schema JSON
  - `POST /api/messages`: contact form submission, Turnstile validation, and GitHub issue synchronization
  - `/api-docs`: Swagger generated from route annotations
- The client talks to the API through small service wrappers in `client/src/services/`. Search UI state lives in the Pinia `searchStore`, which also mirrors state into the router query string so search URLs are shareable and back/forward navigation restores filters.
- Dataset detail rendering is schema-version-aware. The API exposes `schema_version`, and the client resolves that to a Vue component through `client/src/views/datasets/versionComponentMap.js`.
- The MCP service is intentionally just an HTTP adapter over the API. It should stay stateless and should not reimplement API business logic.
- Imported BRC feed data comes from external JSON endpoints and is brought into the local catalog through `api/scripts/import_datafeeds.js`; schema validation is handled separately via LinkML and `validate.sh`.
- `bioenergy.org` depends on the separate `bioenergy-research-centers/brc-schema` repository as the authoritative source for BRC schema definitions. This repo keeps pinned JSON schema files under `api/app/schemas/` for runtime/API use, while `validate.sh` fetches the current YAML schema from GitHub for validation.

## Key conventions

- Module format is split by package:
  - API code and API tests are CommonJS.
  - Client and MCP code are ESM.
- API tests rely on shared-module mutation for mocking CommonJS dependencies. `vi.mock()` is not the reliable pattern there; mutate the shared object returned by `require()` instead.
- Client tests use explicit Vitest imports and typically mock `@/http-common` for API calls.
- Dataset JSON is sanitized at the model layer in `api/app/models/dataset.model.js`; do not bypass that path when changing dataset persistence.
- The API exposes datasets with `toClientJSON()`, which injects `uid`, `schema_version`, and timestamps into the stored JSON payload. Preserve that shape when changing dataset responses.
- Only schema versions marked as supported in `api/app/schemas/schema_list.json` are included in the API's `supportedOnly` scope. When adding or changing dataset schema support, keep the API allowlist and the client's `versionComponentMap.js` in sync.
- Treat `../brc-schema` as an optional local checkout for reference only unless the workflow is explicitly changed; current scripts use the committed schema snapshots in this repo or fetch from the upstream GitHub repository.
- Search behavior spans both tiers:
  - API `GET /api/datasets` expects pagination plus optional `filters` and computes facets.
  - Client `searchStore` serializes filters into the URL query string and restores them from the route.
  - If search parameters change, update both the API query handling and the client store/router serialization together.
- Contact form submissions are not just emails: the client posts form data to `/api/messages`, the API validates Cloudflare Turnstile, formats markdown, and creates or updates a GitHub issue through `githubService`.
- There is expected error-path logging in tests (`console.error` output for search and Turnstile failures); that noise is documented in the README and does not automatically indicate a broken test run.
