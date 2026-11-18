#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/infra/compose/compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env.prod}"
DB_FILE="${1:-}"
MEDIA_FILE="${2:-}"

if [[ -z "${DB_FILE}" || ! -f "${DB_FILE}" ]]; then
    echo "Usage: CONFIRM_RESTORE=yes $0 <database.dump> [media.tar.gz]" >&2
    exit 1
fi
if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
    echo "Refusing to restore without CONFIRM_RESTORE=yes." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

RESTORE_DB="${RESTORE_DB:-${POSTGRES_DB}_restore}"
if [[ ! "${RESTORE_DB}" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "RESTORE_DB must contain only letters, numbers, and underscores." >&2
    exit 1
fi

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

echo "Stopping application containers"
"${COMPOSE[@]}" stop frontend nginx backend || true
"${COMPOSE[@]}" up -d db redis

echo "Creating clean database ${RESTORE_DB}"
"${COMPOSE[@]}" exec -T db psql -U "${POSTGRES_USER}" -d postgres \
    -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${RESTORE_DB}\";" \
    -c "CREATE DATABASE \"${RESTORE_DB}\";"

echo "Restoring database into ${RESTORE_DB}"
"${COMPOSE[@]}" exec -T db pg_restore -U "${POSTGRES_USER}" -d "${RESTORE_DB}" \
    --no-owner --no-privileges --exit-on-error < "${DB_FILE}"

echo "Restored chapter count:"
"${COMPOSE[@]}" exec -T db psql -U "${POSTGRES_USER}" -d "${RESTORE_DB}" \
    -tAc "SELECT count(*) FROM catalog_chapter;"

if [[ -n "${MEDIA_FILE}" ]]; then
    if [[ ! -f "${MEDIA_FILE}" ]]; then
        echo "Media archive not found: ${MEDIA_FILE}" >&2
        exit 1
    fi
    echo "Restoring media"
    "${COMPOSE[@]}" run --rm --no-deps -T backend \
        sh -c 'tar -C /app/media -xzf -' < "${MEDIA_FILE}"
fi

echo "Starting application containers"
"${COMPOSE[@]}" up -d backend frontend nginx

echo "Restore complete. Verify ${RESTORE_DB}, then switch DATABASE_URL only after a tested cutover."
