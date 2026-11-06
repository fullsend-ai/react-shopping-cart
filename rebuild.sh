#!/usr/bin/env bash
# Rebuild demo-shop and verify the change: unit tests + fresh container + smoke test.
# Usage: ./rebuild.sh   (run from anywhere; operates on this repo)
set -euo pipefail
cd "$(dirname "$0")"

IMAGE=localhost/demo-shop:latest
CONTAINER=demo-shop
PORT=8091

echo "==> Pulling latest from GitHub"
git pull --ff-only

echo "==> Building image"
podman build -t "$IMAGE" .

echo "==> Running unit tests"
CI=true podman run --rm "$IMAGE" npm test -- --watchAll=false

echo "==> Replacing container"
podman rm -f "$CONTAINER" >/dev/null 2>&1 || true
podman run -d --name "$CONTAINER" -p "$PORT:3000" "$IMAGE" >/dev/null

echo "==> Waiting for app on http://localhost:$PORT"
up=0
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null "http://localhost:$PORT/static/js/bundle.js"; then up=1; break; fi
  sleep 2
done
if [ "$up" -ne 1 ]; then
  echo "ERROR: app did not come up; container logs:"
  podman logs "$CONTAINER" | tail -30
  exit 1
fi

# CRA dev server can return 200 while showing a compile-error overlay
if podman logs "$CONTAINER" 2>&1 | grep -q "Failed to compile"; then
  echo "ERROR: webpack failed to compile:"
  podman logs "$CONTAINER" | tail -30
  exit 1
fi

echo "OK: tests pass, app rebuilt and serving on http://localhost:$PORT"
