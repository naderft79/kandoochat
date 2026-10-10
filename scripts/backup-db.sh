#!/bin/bash
# بکاپ روزانه PostgreSQL — نگهداری ۱۴ روز
# کرون: 0 3 * * * /var/www/kandoo/scripts/backup-db.sh
set -e

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

# DATABASE_URL را از .env بخوان
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -E '^DATABASE_URL=' "$ENV_FILE" | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "[backup] DATABASE_URL is not set" >&2
  exit 1
fi

FILE="$BACKUP_DIR/kandoo-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "[backup] created $FILE"

# حذف بکاپ های قدیمی تر از ۱۴ روز
find "$BACKUP_DIR" -name "kandoo-*.sql.gz" -mtime +14 -delete
echo "[backup] done"
