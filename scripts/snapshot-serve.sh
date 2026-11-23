#!/usr/bin/env bash
# Serve a frozen copy of the working tree on a dedicated port (default 5180), so a slow browser suite is not killed
# by a hot reload every time you edit a source file. Re-run it after a batch of edits to refresh the copy; stop with Ctrl-C.
#
#   scripts/snapshot-serve.sh                      # port 5180, per-worktree cache dir
#   SNAP_PORT=5181 scripts/snapshot-serve.sh       # concurrent session on its own port and copy
#   GAME_URL=http://localhost:5181 BROWSER_SUITE=couchgames npm run test:browser
#
# The test script itself is read from the real repository when a suite starts, so test edits are safe once it runs.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
port="${SNAP_PORT:-5180}"
slug="$(basename "$here" | tr -cs 'A-Za-z0-9._-' '-')"
snap="${SNAP_DIR:-$HOME/.cache/neo-snap-${slug}-${port}}"
mkdir -p "$snap"
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude dev-dist --exclude test-results --exclude .git \
  --exclude .claude --exclude .codex --exclude .agents --exclude .vite-snap \
  "$here"/ "$snap"/
ln -sfn "$here/node_modules" "$snap/node_modules"
cd "$snap"
rev="$(git -C "$here" rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "Serving a snapshot of $here ($rev) on http://localhost:$port (copy in $snap)"
VITE_CACHE_DIR=.vite-snap exec npx vite --port "$port" --strictPort
