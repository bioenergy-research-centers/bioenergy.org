#!/bin/sh
# Deploys the current checkout: build the images, apply database migrations, then start or
# replace the containers.
#
# Migrating before `up` is the point of this script. `docker compose up` on its own also
# migrates first, but it has already stopped the running api by then, so a failed migration
# leaves the site down. Here a failed migration stops the deploy while the running api keeps
# serving the previous version. See README.md "Database migrations".
set -eu
cd "$(dirname "$0")"

docker compose build
docker compose run --rm migrate
docker compose up -d
