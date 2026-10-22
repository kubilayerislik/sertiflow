#!/bin/sh
set -e

storage="${STORAGE_DIR:-/app/storage/templates}"
mkdir -p "$storage"
chown -R nodejs:nodejs "$storage"

if [ "$1" = "serve" ]; then
  exec su-exec nodejs sh -c 'node /app/node_modules/prisma/build/index.js migrate deploy && exec node server.js'
fi

exec su-exec nodejs "$@"
