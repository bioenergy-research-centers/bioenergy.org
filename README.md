# [bioenergy.org](https://bioenergy.org/)

A site dedicated to creating FAIR data products to share across bioenergy research centers (BRCs) and to the global research community.

## Resources

- [Github group](https://github.com/bioenergy-research-centers)
- [Slack workspace](https://join.slack.com/t/cross-brc/shared_invite/zt-3axq9jgvp-GjNN9RlDPwLSDVXC9fZUkw)
- [Contribution Guide](CONTRIBUTING.md)


## Points of contact at each BRC

- JBEI  = Hector Plahar (haplahar@lbl.gov)
- GLBRC = Dirk Norman (dirk.norman@wisc.edu)
- CABBI = Katie Bowman (krhodges@illinois.edu)
- CBI = Stanton Martin (martins@ornl.gov)

## Tech contacts

- Hector Plahar
- Nick Thrower
- Clint Cecil

## Development

Prerequisites:

- Docker
- Docker Compose
- Node.js (version in .nvmrc), recommend using a version manager like nvm or asdf
- Postman is useful for testing the api.

The application is a monorepo with two main components. The client is a Vue.js application and the API is an Express application.

### Running a postgres container

The following command will run a postgres container with the password `mysecretpassword` and expose the database on port 6432.

`docker run --name postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 6432:5432 postgres`

### Running the application

- Copy the `.env.sample` file to `.env` and fill in the environment variables. These can also be set as environment variables on your system.
- Docker Compose:
  - To run the application in production mode, run `docker-compose up` in the root directory of the project. This will start the nginx server for the client, the express server for the API, and the Postgres database.
  - To run the application in development mode, run `docker compose -f docker-compose.dev.yml up --build --watch`. This will start the client and API in development mode with hot reloading.
  - You can run `docker-compose down` to stop the application and destroy the containers and volumes.
  - Running `docker-compose up --build` will rebuild the containers and restart the application.
  - To deploy a new version, run `./deploy.sh` from the root directory. It builds the images, applies database migrations, then restarts the application; see [Database migrations](#database-migrations).

### Database migrations

The database schema is defined by the migration files in `api/migrations/`, applied by [Umzug](https://github.com/sequelize/umzug) in filename order. Both compose files include a one-shot `migrate` service that applies any pending migrations and exits. The `api` and `api-cron-sidecar` services wait for it to finish successfully, so `docker compose up` always migrates before new code starts. The API also checks at startup that nothing is pending, and exits naming the pending migrations if anything is.

Each migration runs in a single transaction, so a failure part-way leaves the schema unchanged and the migration still pending. Applied migrations are recorded in the `SequelizeMeta` table, so the `migrate` service is a no-op when nothing is pending. Runs take a PostgreSQL advisory lock, so two runs that overlap apply each migration once.

**Deploying.** Run `./deploy.sh` from the repository root. It runs three steps, stopping at the first that fails:

```bash
docker compose build              # build the new images; the running containers are untouched
docker compose run --rm migrate   # apply pending migrations
docker compose up -d              # replace the containers with the new version
```

If a migration fails, the deploy stops before `up`, and the API that was already running keeps serving the previous version against the unchanged schema. Fix the migration and run `./deploy.sh` again.

`docker compose up -d --build` on its own also migrates before starting the new API, but compose stops the running `api` container first. If a migration fails that way, the API stays down until the migration is fixed.

Other migration commands:

```bash
# List pending / applied migrations
docker compose run --rm migrate npm run migrate:pending
docker compose run --rm migrate npm run migrate:executed

# Revert the most recent migration
docker compose run --rm migrate npm run migrate:down
```

**Writing a migration.** Every schema change is a migration, including adding or changing an attribute in `api/app/models/`. The server no longer runs `sequelize.sync()`. `api/tests/integration/migrations.test.js` fails if the model and the migrated table disagree. Name new files with a sortable timestamp prefix, following the existing files. Migrations run while the previous version of the API is still serving, so make them changes the running code can tolerate: add a column before the code reads it, and drop one only in a later release.

In development, `docker compose -f docker-compose.dev.yml up --build --watch` migrates on startup. After adding a migration while the stack is running, apply it with `docker compose -f docker-compose.dev.yml run --rm --build migrate`.

### Dataset text search

Free-text search runs against `search_tsv`, a generated `tsvector` column maintained by PostgreSQL and backed by a GIN index. It indexes named fields rather than the whole JSON document, so schema key names are no longer matched as content.

Supported query syntax:

| Query | Behavior |
| --- | --- |
| `lignin degradation` | All terms must match. Partial words match as prefixes, so `ligni` finds `lignin`. |
| `"cell wall"` | Quoted text matches the exact phrase. |
| `ethanol OR biomass` | Either term matches. |
| `ethanol NOT corn`, `ethanol -corn`, `ethanol ! corn` | Excludes the second term. |

Results are ordered by relevance (`ts_rank_cd`) when a search term is present, and by date when browsing without one. Matches in a dataset title rank above matches in its description or abstract.

Two behaviors changed with the move to PostgreSQL's `websearch_to_tsquery`:

- Parentheses no longer group sub-expressions. `(a OR b) c` is read as `a OR (b AND c)`.
- Terms are stemmed, so `fermentations` also matches `fermentation`.

The searchable field list is fixed in the migration that defines the column. Making a new field searchable requires a migration, so the index cannot drift from the query layer silently.

### Testing

Tests use [Vitest](https://vitest.dev/) and run inside Docker containers. The unit suites need no database connection.

The API also has an integration suite, `api/tests/integration/`, that runs the real migrations, model, search service and HTTP route against a real PostgreSQL and asserts on the results that come back. It is what proves search behaviour (prefix matching, phrases, stemming, ranking, exclusion) actually works, since that logic lives in PostgreSQL where the mocked unit tests cannot reach it. It also checks that the migrated table matches the model. CI runs it against a `postgres:16` service container.

To run it locally against a test database next to your dev database, copy `.env.test.sample` to `.env.test.local` (git-ignored), create the database it names, and layer it over `.env`:

```bash
cp .env.test.sample .env.test.local
createdb -O bioenergy bioenergy_org_test

docker compose --env-file .env --env-file .env.test.local -f docker-compose.dev.yml \
  run --rm --build --no-deps api npm run test:integration
```

Each run wipes the test database and applies every migration once (`api/tests/integration/support/globalSetup.js`). Each test file then loads its own records with `loadDatasets()` from `support/database.js` and closes the connection with `closeDatabase()`. Because the database is wiped, the suite refuses to run unless the database name ends in `_test`, and the test user must own the database.

```bash
# Run API tests
docker compose -f docker-compose.dev.yml run --build --rm --no-deps api npx vitest run

# Run client tests
docker compose -f docker-compose.dev.yml run --build --rm --no-deps client npx vitest run

# Run a single test file
docker compose -f docker-compose.dev.yml run --build --rm --no-deps api npx vitest run tests/services/githubService.test.js
docker compose -f docker-compose.dev.yml run --build --rm --no-deps client npx vitest run src/__tests__/components/AuthorList.test.js

# Watch mode
docker compose -f docker-compose.dev.yml run --build --rm --no-deps api npx vitest
docker compose -f docker-compose.dev.yml run --build --rm --no-deps client npx vitest
```

Some `stderr` output (e.g. "Error during search", "Turnstile error") is expected — these are `console.error` calls from the application code exercised by error-path tests.

The `--build` flag ensures `docker compose run` uses an image built from the current source tree.

#### API tests

API tests use [Supertest](https://github.com/ladislav-zezula/supertest) for route-level integration tests. Tests are organized under `api/tests/` mirroring the source structure:

```text
api/tests/
├── helpers/          # Shared test utilities (Express app factory)
├── models/           # Dataset model tests
├── routes/           # Route integration tests (dataset, message, schema)
├── services/         # Service unit tests (github, ICE, strategy manager)
├── utils/            # Utility unit tests (categories, markdown, turnstile)
└── setup.js          # Test environment variables
```

**Writing API tests:**

- All tests are CommonJS (matching the API codebase).
- Vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`) are available without imports.
- `vi.mock()` does not reliably intercept CJS `require()` calls. To mock a dependency, mutate the shared module object instead:
  ```js
  const myService = require("../../app/services/myService");
  myService.someMethod = vi.fn();
  ```

  This works because `require()` returns the same cached object to all consumers. For this reason, source modules should avoid destructuring at import time (use `mod.fn()` instead of `const { fn } = require(mod)`).
- Route tests use Supertest with a lightweight Express app from `tests/helpers/createApp.js` (no Sequelize sync or Swagger setup).
- Database calls are mocked by mutating `db.datasets.scope` and `db.sequelize.query` on the shared `require("../models")` object.

#### Client tests

Client tests use [Vue Test Utils](https://test-utils.vuejs.org/) for component testing. Tests are organized under `client/src/__tests__/`:

```text
client/src/__tests__/
├── components/       # Component unit tests (AuthorList, Footer, FacetFilters, etc.)
├── composables/      # Composable tests (useTurnstile)
├── router/           # Route definition tests
├── services/         # API service tests (Dataset, Message, Schema)
├── store/            # Pinia store tests (searchStore)
└── views/            # View tests (ContactView, versionComponentMap)
```

**Writing client tests:**

- Tests are ESM (matching the client codebase). Import vitest functions explicitly: `import { describe, it, expect, vi } from 'vitest'`.
- `vi.mock()` works for ESM imports. Mock HTTP calls by mocking `@/http-common`.
- Mount components with `@vue/test-utils`. Stub child components and router as needed.

#### Coverage

Run tests with a coverage report:

```bash
docker compose -f docker-compose.dev.yml run --build --rm --no-deps api npx vitest run --coverage
docker compose -f docker-compose.dev.yml run --build --rm --no-deps client npx vitest run --coverage
```

Coverage is enforced at 80% for statements, branches, functions, and lines (configured in `api/vitest.config.js` and `client/vitest.config.js`). The CI workflow runs coverage on every pull request and will fail if thresholds are not met.

#### Troubleshooting: stale Docker images

If you see errors like `npx: not found` or unexpected behavior when running tests, you may have a stale Docker image cached from a previous build. This can happen when switching between dev and production Dockerfiles, since Docker Compose reuses an existing image if the tag already matches.

To fix this, remove the old image and rebuild:

```bash
docker image rm bioenergyorg-client   # or bioenergyorg-api
docker compose -f docker-compose.dev.yml build --no-cache client
```

### Import BRC Data Feeds

- run `docker compose run api node scripts/import_datafeeds.js` from the root folder of the project.
- To redirect validation errors to a file, run `docker compose run api node scripts/import_datafeeds.js 2>&1 > import_datafeeds.txt`
- Under Windows PowerShell, use the following version of the above command to get a clean output file: `cmd /c "docker compose run api node scripts/import_datafeeds.js > import_datafeeds_after.txt 2>&1"`
- If you see warnings like `"VITE_*" variable is not set`, add that variable to your local `.env` file as an empty placeholder.

### Resources Used to Build This Application

- <https://expressjs.com/>
- <https://sequelize.org/>
  - <https://sequelize.org/docs/v6/core-concepts/model-querying-basics/#operators>
- <https://vuejs.org/>
  - <https://v2.vuejs.org/v2/cookbook>

## BRC Data End Points

- CABBI: <https://cabbitools.igb.illinois.edu/brc/cabbi.json>
- CBI: <https://bioenergy-research-centers.github.io/brc_data_feeds/cbi.json>
- GLBRC: <https://fair-data.glbrc.org/glbrc.json>
- JBEI: <https://bioenergy.org/JBEI/jbei.json>

## Using Claude Code with the bioenergy.org MCP server.

This project repo automatically registers the MCP server in Claude Code via the `.mcp.json` file at the root of this repo.

Alternatively, to tell Claude where the MCP server is:

`claude mcp add --transport http bioenergy-datasets --scope project https://mcp.bioenergy.org`

Then, in Claude Code, run `/mcp` and approve the server if prompted. You can check to confirm that Claude has registered the MCP with `claude mcp list`.

## Validating Data

A local data feed file can be validated against the schema currently supported by the API by posting the file to the validation endpoint (or `http://localhost:8080/api/validate` if testing against your dev environment). Alternatively, you can paste your data feed into the [Swagger API documentation](https://api.bioenergy.org/api-docs/#/Validation/post_api_validate), which will pretty-print the validation results.

### Under Unix, macOS, Git Bash, or WSL (for Windows PowerShell use `curl.exe` instead of `curl`):

`curl -X POST -H "Content-Type: application/json" --data-binary "@jbei.json" https://api.bioenergy.org/api/validate > validation-results.json` 

The endpoint uses the schema version declared in the posted feed. A schema version can also be forced with the `schema_version` query parameter:

`curl -X POST -H "Content-Type: application/json" --data-binary "@jbei.json" "https://api.bioenergy.org/api/validate?schema_version=0.1.13"`

The response is JSON and includes:

- the schema version used for validation
- counts of valid, invalid, and duplicate records
- detailed validation errors for invalid records
- duplicate record details

## Copyright Notice
InterBRC Data Products Portal Copyright (c) 2025, The Regents of the University of California, through Lawrence Berkeley National Laboratory, and UT-Battelle LLC,  through Oak Ridge National Laboratory (both subject to receipt of any required approvals from the U.S. Dept. of Energy), University of Wisconsin - Madison, University of Illinois Urbana - Champaign, and Michigan State University. All rights reserved.

If you have questions about your rights to use or distribute this software,
please contact Berkeley Lab's Intellectual Property Office at
IPO@lbl.gov.

NOTICE.  This Software was developed under funding from the U.S. Department
of Energy and the U.S. Government consequently retains certain rights.  As
such, the U.S. Government has been granted for itself and others acting on
its behalf a paid-up, nonexclusive, irrevocable, worldwide license in the
Software to reproduce, distribute copies to the public, prepare derivative
works, and perform publicly and display publicly, and to permit others to do so.
