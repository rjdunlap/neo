#!/usr/bin/env bash
# Leave the concept-art originals (about 150 MB of PNGs under docs/rework/concepts/) out of a code session's checkout.
# Decided by the developer 2026-11-07: code sessions skip them; art sessions restore them. Manifests and notes
# (the .md files there) stay checked out, and check-links.mjs accepts links to the skipped files.
#
#   scripts/concept-art.sh skip      # this worktree only: remove the PNGs from disk, keep them in git
#   scripts/concept-art.sh restore   # bring them back (art work: prepare-sprite, import-inbox)
#   scripts/concept-art.sh status
#
# A fresh clone can avoid downloading them too:
#   git clone --filter=blob:none --no-checkout <url> neo && cd neo && scripts/concept-art.sh skip
# (the blobs then arrive only on restore). Local worktrees share one object store, so skipping saves their disk and
# checkout time rather than a download.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

case "${1:-status}" in
  skip)
    git sparse-checkout set --no-cone '/*' '!/docs/rework/concepts/**/*.png'
    echo "concept-art PNGs skipped in $(pwd)"
    ;;
  restore)
    git sparse-checkout disable
    echo "concept-art PNGs restored in $(pwd)"
    ;;
  status)
    if [ "$(git config --get core.sparseCheckout || true)" = true ] && git sparse-checkout list 2>/dev/null | grep -q concepts; then
      echo "skipped ($(git ls-files -t docs/rework/concepts | grep -c '^S ') files left out)"
    else
      echo "checked out"
    fi
    ;;
  *)
    echo "usage: scripts/concept-art.sh skip|restore|status" >&2
    exit 2
    ;;
esac
