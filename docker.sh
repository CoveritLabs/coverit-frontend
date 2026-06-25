#!/bin/sh

# Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
# Proprietary and confidential. Unauthorized use is strictly prohibited.
# See LICENSE file in the project root for full license information.


# Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
# Proprietary and confidential. Unauthorized use is strictly prohibited.
# See LICENSE file in the project root for full license information.


# Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
# Proprietary and confidential. Unauthorized use is strictly prohibited.
# See LICENSE file in the project root for full license information.

# Usage:
#   ./docker.sh up                         -> full stack with remote images
#   ./docker.sh up --tag latest            -> all services use tag latest
#   ./docker.sh up --tag api:1.2           -> only API uses tag 1.2
#   ./docker.sh up --tag docgen:1.2        -> only DocGen uses tag 1.2
#   ./docker.sh up --tag crawler:1.2       -> only Crawler uses tag 1.2
#   ./docker.sh up --tag regression:1.2    -> only Regression uses tag 1.2
#   ./docker.sh up --local                 -> full stack local dev builds
#   ./docker.sh up --local --no-build      -> full stack local dev without rebuilding images
#   ./docker.sh up --local --app-only      -> API + Frontend + Postgres + Redis + Neo4j
#   ./docker.sh up --local --skip-workers  -> full stack except crawler/regression workers
#   ./docker.sh up --test-prod             -> full stack local production builds

print_help() {
  echo "Usage: $0 [up|down|logs] [--tag <[service:]tag>] [--local] [--test-prod] [--no-build] [--app-only] [--skip-workers]"
}

set -e

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  print_help
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export FRONTEND_DIR="$SCRIPT_DIR"
export API_DIR="$(cd "$SCRIPT_DIR/../coverit-api" && pwd)"
export DOCGEN_DIR="$(cd "$SCRIPT_DIR/../coverit-docgen" && pwd)"
export CRAWLER_DIR="$(cd "$SCRIPT_DIR/../coverit-crawler" && pwd)"
export REGRESSION_DIR="$(cd "$SCRIPT_DIR/../coverit-regression" && pwd)"

CMD="${1:-up}"
shift 2>/dev/null || true

export API_TAG="dev"
export FRONTEND_TAG="dev"
export DOCGEN_TAG="dev"
export CRAWLER_TAG="dev"
export REGRESSION_TAG="dev"

LOCAL=false
TEST_PROD=false
NO_BUILD=false
APP_ONLY=false
SKIP_WORKERS=false
API_TAG_OVERRIDDEN=false
FRONTEND_TAG_OVERRIDDEN=false
DOCGEN_TAG_OVERRIDDEN=false
CRAWLER_TAG_OVERRIDDEN=false
REGRESSION_TAG_OVERRIDDEN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --tag)
      if echo "$2" | grep -q ":"; then
        SERVICE=$(echo "$2" | cut -d: -f1 | tr '[:lower:]' '[:upper:]')
        VAL=$(echo "$2" | cut -d: -f2-)
        case "$SERVICE" in
          API)
            export API_TAG="$VAL"
            API_TAG_OVERRIDDEN=true
            ;;
          FRONTEND)
            export FRONTEND_TAG="$VAL"
            FRONTEND_TAG_OVERRIDDEN=true
            ;;
          DOCGEN)
            export DOCGEN_TAG="$VAL"
            DOCGEN_TAG_OVERRIDDEN=true
            ;;
          CRAWLER)
            export CRAWLER_TAG="$VAL"
            CRAWLER_TAG_OVERRIDDEN=true
            ;;
          REGRESSION)
            export REGRESSION_TAG="$VAL"
            REGRESSION_TAG_OVERRIDDEN=true
            ;;
          *)
            echo "Unknown service for --tag: $SERVICE"
            exit 1
            ;;
        esac
      else
        export API_TAG="$2"
        export FRONTEND_TAG="$2"
        export DOCGEN_TAG="$2"
        export CRAWLER_TAG="$2"
        export REGRESSION_TAG="$2"
      fi
      shift 2
      ;;
    --local) LOCAL=true; shift ;;
    --test-prod) TEST_PROD=true; shift ;;
    --no-build) NO_BUILD=true; shift ;;
    --app-only) APP_ONLY=true; shift ;;
    --skip-workers) SKIP_WORKERS=true; shift ;;
    -h|--help) print_help; exit 0 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

if [ "$APP_ONLY" = true ] && [ "$SKIP_WORKERS" = true ]; then
  echo "--app-only already skips workers; use one of --app-only or --skip-workers."
  exit 1
fi

ENV_FILE_ARGS=""
if [ -f "$API_DIR/.env" ]; then
  ENV_FILE_ARGS="$ENV_FILE_ARGS --env-file $API_DIR/.env"
fi

EXEC_CMD="docker compose$ENV_FILE_ARGS -f $API_DIR/docker-compose.yml"

if [ "$LOCAL" = true ]; then
  if [ "$APP_ONLY" = true ]; then
    echo "Starting CoverIt app stack in local dev mode..."
  elif [ "$SKIP_WORKERS" = true ]; then
    echo "Starting CoverIt full stack in local dev mode without crawler/regression workers..."
  else
    echo "Starting CoverIt full stack in local dev mode..."
  fi
  if [ "$API_TAG_OVERRIDDEN" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $API_DIR/overrides/api.dev.yml"
  fi
  EXEC_CMD="$EXEC_CMD -f $FRONTEND_DIR/docker-compose.yml"
  if [ "$FRONTEND_TAG_OVERRIDDEN" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $FRONTEND_DIR/overrides/frontend.dev.yml"
  fi
  if [ "$APP_ONLY" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $DOCGEN_DIR/docker-compose.yml -f $DOCGEN_DIR/overrides/integrated.local.yml"
    if [ "$DOCGEN_TAG_OVERRIDDEN" = false ]; then
      EXEC_CMD="$EXEC_CMD -f $DOCGEN_DIR/overrides/api.dev.yml"
    fi
  fi
  if [ "$APP_ONLY" = false ] && [ "$SKIP_WORKERS" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $CRAWLER_DIR/docker-compose.yml"
    if [ "$CRAWLER_TAG_OVERRIDDEN" = false ]; then
      EXEC_CMD="$EXEC_CMD -f $CRAWLER_DIR/overrides/crawler.dev.yml"
    fi
    EXEC_CMD="$EXEC_CMD -f $REGRESSION_DIR/docker-compose.yml"
    if [ "$REGRESSION_TAG_OVERRIDDEN" = false ]; then
      EXEC_CMD="$EXEC_CMD -f $REGRESSION_DIR/overrides/regression.dev.yml"
    fi
  fi
elif [ "$TEST_PROD" = true ]; then
  if [ "$APP_ONLY" = true ]; then
    echo "Starting CoverIt app stack in Production Test mode..."
  elif [ "$SKIP_WORKERS" = true ]; then
    echo "Starting CoverIt full stack in Production Test mode without crawler/regression workers..."
  else
    echo "Starting CoverIt full stack in Production Test mode..."
  fi
  EXEC_CMD="$EXEC_CMD -f $API_DIR/overrides/api.test.yml"
  EXEC_CMD="$EXEC_CMD -f $FRONTEND_DIR/docker-compose.yml -f $FRONTEND_DIR/overrides/frontend.prod.yml"
  if [ "$APP_ONLY" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $DOCGEN_DIR/docker-compose.yml -f $DOCGEN_DIR/overrides/integrated.local.yml -f $DOCGEN_DIR/overrides/api.test.yml"
  fi
  if [ "$APP_ONLY" = false ] && [ "$SKIP_WORKERS" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $CRAWLER_DIR/docker-compose.yml -f $CRAWLER_DIR/overrides/crawler.prod.yml"
    EXEC_CMD="$EXEC_CMD -f $REGRESSION_DIR/docker-compose.yml -f $REGRESSION_DIR/overrides/regression.prod.yml"
  fi
else
  if [ "$APP_ONLY" = true ]; then
    echo "Starting CoverIt app stack with remote images..."
  elif [ "$SKIP_WORKERS" = true ]; then
    echo "Starting CoverIt full stack with remote images without crawler/regression workers..."
  else
    echo "Starting CoverIt full stack with remote images..."
  fi
  EXEC_CMD="$EXEC_CMD -f $FRONTEND_DIR/docker-compose.yml"
  if [ "$APP_ONLY" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $DOCGEN_DIR/docker-compose.yml -f $DOCGEN_DIR/overrides/integrated.local.yml"
  fi
  if [ "$APP_ONLY" = false ] && [ "$SKIP_WORKERS" = false ]; then
    EXEC_CMD="$EXEC_CMD -f $CRAWLER_DIR/docker-compose.yml"
    EXEC_CMD="$EXEC_CMD -f $REGRESSION_DIR/docker-compose.yml"
  fi
fi

case "$CMD" in
  up)
    if [ "$NO_BUILD" = true ]; then
      $EXEC_CMD up -d --no-build --remove-orphans
    elif [ "$LOCAL" = true ] || [ "$TEST_PROD" = true ]; then
      $EXEC_CMD up -d --build --remove-orphans
    else
      $EXEC_CMD up -d --remove-orphans
    fi
    ;;
  down)
    $EXEC_CMD down --remove-orphans
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
