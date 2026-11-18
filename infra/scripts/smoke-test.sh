#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env.prod}"

if [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    . "${ENV_FILE}"
    set +a
fi

BASE_URL="${BASE_URL:-https://${DOMAIN:-example.com}}"

echo "Checking ${BASE_URL}/api/v1/health/"
curl --fail --silent --show-error --max-time 15 "${BASE_URL}/api/v1/health/"

echo
echo "Checking ${BASE_URL}/api/v1/ready/"
curl --fail --silent --show-error --max-time 15 "${BASE_URL}/api/v1/ready/"

echo
echo "Checking homepage"
curl --fail --silent --show-error --max-time 30 "${BASE_URL}/" >/dev/null

echo "Checking security headers"
headers="$(curl --silent --show-error --max-time 15 --head "${BASE_URL}/")"
for header in \
    "strict-transport-security:" \
    "x-content-type-options:" \
    "referrer-policy:" \
    "content-security-policy:"; do
    if ! grep -qi "^${header}" <<<"${headers}"; then
        echo "Missing expected header: ${header}" >&2
        exit 1
    fi
done

echo "Smoke test passed for ${BASE_URL}"
