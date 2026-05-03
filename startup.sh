#!/bin/sh
set -e

# Ensure the persistent data directory exists (Azure App Service mounts /home as Azure Files)
mkdir -p /home/data

# Apply any pending migrations against the SQLite database
node node_modules/prisma/build/index.js migrate deploy

# Start the Next.js server
exec node server.js
