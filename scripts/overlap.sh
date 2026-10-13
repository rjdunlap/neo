#!/usr/bin/env bash
# One compact overlap check before claiming or publishing a slice (AGENTS.md, "Avoid duplicate parallel work").
#
#   scripts/overlap.sh penguin tangram src/games/penguin-slide
#
# Fetches origin, then prints how far this branch is behind origin/main and, for each term, the open pull requests,
# worktrees and unmerged remote branches that mention it. No term lists every open pull request and worktree.
set -uo pipefail
git fetch --prune -q origin || echo "fetch failed"
echo "behind origin/main: $(git rev-list --count HEAD..origin/main), ahead: $(git rev-list --count origin/main..HEAD)"
terms=("$@")
prs="$(gh pr list --state open --limit 100 --json number,headRefName,title,files \
  --jq '.[]|"#\(.number) \(.headRefName) | \(.title) | \([.files[].path]|map(select(test("^(docs/(ROADMAP|VERIFICATION|GAMES)|README)")|not))|.[0:6]|join(" "))"' 2>/dev/null)"
wts="$(git worktree list | sed "s|$HOME/git/neo/||;s|$HOME/.codex/worktrees/||")"
unmerged="$(git branch -r --no-merged origin/main | sed 's/^ *//' | grep -v 'origin/HEAD')"
if [ ${#terms[@]} -eq 0 ]; then
  echo "== open PRs"; echo "$prs"; echo "== worktrees"; echo "$wts"; exit 0
fi
for t in "${terms[@]}"; do
  echo "== $t"
  echo "$prs" | grep -i -- "$t" | sed 's/^/PR   /'
  echo "$wts" | grep -i -- "$t" | sed 's/^/tree /'
  echo "$unmerged" | grep -i -- "$t" | sed 's/^/unmerged /'
done
echo "(dirty worktrees are not scanned; run git -C <path> status --short for any tree listed above)"
