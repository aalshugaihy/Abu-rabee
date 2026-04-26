#!/usr/bin/env bash
# Snapshot the SQLite database safely (uses VACUUM INTO so it's consistent
# while the server is running). Drop the snapshot in ./backups/ by default.
set -euo pipefail

DB_PATH="${DB_PATH:-prisma/dev.db}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH" >&2
  exit 1
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/abu-rabee-$stamp.db"

# `VACUUM INTO` produces a consistent point-in-time copy without locking
# writers for long. Falls back to a plain file copy if sqlite3 is missing.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" "VACUUM INTO '$out';"
else
  cp "$DB_PATH" "$out"
fi

# Keep the last 14 backups, drop older ones.
ls -1t "$BACKUP_DIR"/abu-rabee-*.db 2>/dev/null | tail -n +15 | xargs -r rm --

echo "✓ wrote $out ($(du -h "$out" | cut -f1))"
