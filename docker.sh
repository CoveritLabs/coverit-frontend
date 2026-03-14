#!/bin/sh

# Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
# Proprietary and confidential. Unauthorized use is strictly prohibited.
# See LICENSE file in the project root for full license information.


# Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
# Proprietary and confidential. Unauthorized use is strictly prohibited.
# See LICENSE file in the project root for full license information.


# Usage:
#   ./docker.sh up                   -> start frontend & backend with remote images
#   ./docker.sh up --tag latest      -> start all with tag latest
#   ./docker.sh up --tag api:1.2     -> frontend :dev, api :1.2
#   ./docker.sh up --local           -> frontend & api local (hot-reload)
#   ./docker.sh up --local --tag api:1.2 -> frontend local, api remote 1.2

print_help() {
  echo "Usage: $0 [up|down|logs] [--tag <[service:]tag>] [--local] [--test-prod]"
}

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export FRONTEND_DIR="$SCRIPT_DIR"
export API_DIR="$(cd "$SCRIPT_DIR/../coverit-api" && pwd)"

CMD="${1:-up}"
shift 2>/dev/null || true

# Defaults
export API_TAG="dev"
export FRONTEND_TAG="dev"

LOCAL=false
TEST_PROD=false
API_TAG_OVERRIDDEN=false
FRONTEND_TAG_OVERRIDDEN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --tag)
      if echo "$2" | grep -q ":"; then
        SERVICE=$(echo "$2" | cut -d: -f1 | tr '[:lower:]' '[:upper:]')
        VAL=$(echo "$2" | cut -d: -f2)
        export "${SERVICE}_TAG"="$VAL"
        [ "$SERVICE" = "API" ] && API_TAG_OVERRIDDEN=true
        [ "$SERVICE" = "FRONTEND" ] && FRONTEND_TAG_OVERRIDDEN=true
      else
        export API_TAG="$2"
        export FRONTEND_TAG="$2"
      fi
      shift 2
      ;;
    --local) LOCAL=true; shift ;;
    --test-prod) TEST_PROD=true; shift ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# API owns its services (db, redis). Start from the API base compose, then
# layer API overrides, then the frontend compose, then frontend overrides.
ENV_FILE_ARG=""
if [ -f "$API_DIR/.env" ]; then
  ENV_FILE_ARG="--env-file $API_DIR/.env"
fi
EXEC_CMD="docker compose $ENV_FILE_ARG -f $API_DIR/docker-compose.yml"

if [ "$LOCAL" = true ]; then
  # local dev: hot-reload builds for both
  if [ "$API_TAG_OVERRIDDEN" = false ]; then
    echo "Using local API..."
    EXEC_CMD="$EXEC_CMD -f $API_DIR/overrides/api.dev.yml"
  fi
  EXEC_CMD="$EXEC_CMD -f docker-compose.yml"
  if [ "$FRONTEND_TAG_OVERRIDDEN" = false ]; then
    echo "Using local Frontend..."
    EXEC_CMD="$EXEC_CMD -f overrides/frontend.dev.yml"
  fi
elif [ "$TEST_PROD" = true ]; then
  # local prod builds against cloud db/redis
  echo "Starting in Production Test mode (Aiven)..."
  EXEC_CMD="$EXEC_CMD -f $API_DIR/overrides/api.cloud.yml -f $API_DIR/overrides/api.test.yml -f docker-compose.yml -f overrides/frontend.prod.yml"
else
  # default: remote images, local db/redis
  EXEC_CMD="$EXEC_CMD -f docker-compose.yml"
fi

case "$CMD" in
  up)
    $EXEC_CMD up -d --build
    ;;
  down)
    $EXEC_CMD down
    ;;
  logs)
    $EXEC_CMD logs -f
    ;;
  *)
    echo "Unknown command: $CMD"
    print_help
    exit 1
    ;;
esac
