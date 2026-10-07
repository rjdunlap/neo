#!/usr/bin/env bash
# Serve a frozen copy of the working tree on port 5180, so a slow browser suite is not killed by a hot reload
# every time you edit a source file. Re-run it after a batch of edits to refresh the copy; stop it with Ctrl-C.
#
#   scripts/snapshot-serve.sh            # then, in another terminal:
#   GAME_URL=http://localhost:5180 BROWSER_SUITE=couchgames npm run test:browser
#
# The test script itself is read from the real repository when a suite starts, so test edits are safe once it runs.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
snap="${SNAP_DIR:-$HOME/.cache/neo-snap}"
mkdir -p "$snap"
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude dev-dist --exclude test-results --exclude .git --exclude .claude --exclude .vite-snap \
  "$here"/ "$snap"/
ln -sfn "$here/node_modules" "$snap/node_modules"
cd "$snap"
echo "Serving a snapshot of $here on http://localhost:5180 (copy in $snap)"
VITE_CACHE_DIR=.vite-snap exec npx vite --port 5180 --strictPort
