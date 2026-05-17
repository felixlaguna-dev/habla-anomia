#!/usr/bin/env bash
set -euo pipefail

# E2E test runner for Habla Anomia
# Usage:
#   ./e2e/run.sh              — test against local Docker (port 3020)
#   ./e2e/run.sh --gh-pages   — test against GitHub Pages
#   ./e2e/run.sh --url URL    — test against custom URL

BASE_URL="http://host.docker.internal:3020"
PROJECT=""

for arg in "$@"; do
  case $arg in
    --gh-pages)
      BASE_URL="https://felixlaguna-dev.github.io/habla-anomia"
      shift
      ;;
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --project)
      PROJECT="--project $2"
      shift 2
      ;;
  esac
done

echo "🧪 Running E2E tests against: $BASE_URL"

docker build -t habla-anomia-e2e -f Dockerfile.e2e . 2>&1 | tail -5

docker run --rm \
  --network host \
  -e BASE_URL="$BASE_URL" \
  -v "$(pwd)/test-results:/app/test-results" \
  habla-anomia-e2e \
  npx playwright test $PROJECT --reporter=list 2>&1

echo "✅ E2E tests complete"
