#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/infra/compose/compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env.prod}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
BACKUP_REMOTE="${BACKUP_REMOTE:-}"
BACKUP_AGE_RECIPIENT="${BACKUP_AGE_RECIPIENT:-}"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Missing ${ENV_FILE}. Copy .env.prod.example and fill it in." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
DB_FILE="${DAILY_DIR}/db-${STAMP}.dump"
MEDIA_FILE="${DAILY_DIR}/media-${STAMP}.tar.gz"

mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

echo "Backing up PostgreSQL to ${DB_FILE}"
"${COMPOSE[@]}" exec -T db sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' \
    > "${DB_FILE}"

echo "Backing up media to ${MEDIA_FILE}"
"${COMPOSE[@]}" exec -T backend sh -c 'tar -C /app/media -czf - .' > "${MEDIA_FILE}"

if [[ -n "${BACKUP_AGE_RECIPIENT}" ]]; then
    command -v age >/dev/null 2>&1 || {
        echo "BACKUP_AGE_RECIPIENT is set but age is not installed." >&2
        exit 1
    }
    echo "Encrypting backups with age"
    age -r "${BACKUP_AGE_RECIPIENT}" -o "${DB_FILE}.age" "${DB_FILE}"
    age -r "${BACKUP_AGE_RECIPIENT}" -o "${MEDIA_FILE}.age" "${MEDIA_FILE}"
    rm -f "${DB_FILE}" "${MEDIA_FILE}"
    DB_FILE="${DB_FILE}.age"
    MEDIA_FILE="${MEDIA_FILE}.age"
fi

if [[ "$(date +%u)" == "7" ]]; then
    cp -f "${DB_FILE}" "${WEEKLY_DIR}/"
    cp -f "${MEDIA_FILE}" "${WEEKLY_DIR}/"
fi

find "${DAILY_DIR}" -type f -mtime +7 -delete
find "${WEEKLY_DIR}" -type f -mtime +28 -delete

if [[ -n "${BACKUP_REMOTE}" ]]; then
    command -v rclone >/dev/null 2>&1 || {
        echo "BACKUP_REMOTE is set but rclone is not installed." >&2
        exit 1
    }
    echo "Copying backups to ${BACKUP_REMOTE}"
    rclone copy "${DAILY_DIR}" "${BACKUP_REMOTE}/daily"
    rclone copy "${WEEKLY_DIR}" "${BACKUP_REMOTE}/weekly"
fi

echo "Backup complete: ${DB_FILE} and ${MEDIA_FILE}"
