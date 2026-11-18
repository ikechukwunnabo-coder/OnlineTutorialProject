#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/infra/compose/compose.prod.yaml}"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env.prod}"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Missing ${ENV_FILE}. Copy .env.prod.example and fill it in." >&2
    exit 1
fi

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

echo "Building production images"
"${COMPOSE[@]}" build

echo "Starting data services"
"${COMPOSE[@]}" up -d db redis

echo "Applying migrations"
"${COMPOSE[@]}" run --rm backend python manage.py migrate --noinput

echo "Starting application services"
"${COMPOSE[@]}" up -d --remove-orphans backend frontend nginx

echo "Waiting for readiness"
for attempt in $(seq 1 30); do
    if "${COMPOSE[@]}" exec -T backend \
        python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/ready/', timeout=3)"; then
        break
    fi
    if [[ "${attempt}" == "30" ]]; then
        echo "Backend did not become ready." >&2
        exit 1
    fi
    sleep 2
done

BASE_URL="${BASE_URL:-https://${DOMAIN:-example.com}}" \
    "${SCRIPT_DIR}/smoke-test.sh"
