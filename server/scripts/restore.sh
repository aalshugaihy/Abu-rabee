#!/usr/bin/env bash
# Restore a SQLite snapshot taken by `backup.sh`. The current database is
# moved aside before being replaced so a misfire is recoverable.
set -euo pipefail

SOURCE="${1:-}"
DB_PATH="${DB_PATH:-prisma/dev.db}"

if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  echo "Usage: $0 <backup-file>" >&2
  echo "  e.g. $0 backups/abu-rabee-20260426T120000Z.db" >&2
  exit 1
fi

if [ -f "$DB_PATH" ]; then
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  mv "$DB_PATH" "$DB_PATH.replaced-$stamp"
  echo "→ moved current DB to $DB_PATH.replaced-$stamp"
fi

cp "$SOURCE" "$DB_PATH"
echo "✓ restored from $SOURCE → $DB_PATH"
