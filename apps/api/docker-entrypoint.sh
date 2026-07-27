#!/bin/sh
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Running database migrations..."

npx prisma migrate deploy --schema prisma/schema.prisma

echo "Starting API..."
exec node dist/main.js
