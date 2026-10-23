#!/usr/bin/env bash
# Generate images from a Claude session by handing a brief to Codex, whose built-in image_gen tool runs on the
# developer's ChatGPT plan (no API key). One run = one image conversation, so a base and its edits stay consistent.
#
#   scripts/codex-image.sh <out-dir> <brief.md> [reference.png ...]           # new run
#   scripts/codex-image.sh --resume <session-id> <out-dir> <follow-up.md>      # re-roll or edit in the same conversation
#
# Codex may write only inside <out-dir>; it copies every kept image there untouched and writes codex-report.md
# (files, tool and model, exact prompts). The session id for --resume is the "session id:" line of codex-run.log.
# A full art request takes 10-30 minutes: run it in the background.
set -euo pipefail

codex=$(command -v codex || true)
[ -n "$codex" ] || codex=/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
[ -x "$codex" ] || { echo "codex CLI not found (install Codex or the ChatGPT app)" >&2; exit 1; }

resume=""
if [ "${1:-}" = "--resume" ]; then resume=${2:?session id}; shift 2; fi
[ $# -ge 2 ] || { sed -n '4,6p' "$0" >&2; exit 2; }
out=$1; brief=$2; shift 2
[ -f "$brief" ] || { echo "brief not found: $brief" >&2; exit 2; }
mkdir -p "$out"; out=$(cd "$out" && pwd)

refs=()
for r in "$@"; do
  [ -f "$r" ] || { echo "reference not found: $r" >&2; exit 2; }
  refs+=(-i "$(cd "$(dirname "$r")" && pwd)/$(basename "$r")")
done

rules="You are producing images for another agent, which will judge them and record them.
- Use only the built-in image_gen tool. Never use the image_gen.py CLI fallback, an API key, a screenshot, a crop, a tracing or a stock image. If image_gen is unavailable, write that in your final message and stop.
- Copy every image you keep into the current directory ($out) untouched (no resize, crop or recompression), using the file names the brief gives (otherwise <subject>-<n>.png). Write nowhere else, run no git commands and edit no other files.
- Finish by writing codex-report.md in the current directory and repeating it as your final message: one line per kept file (name, pixel size, what it is), the tool and model actually used, the exact prompt sent for each image (including edits), and anything the brief asked for that is missing.
"

log="$out/codex-run.log"
status=0
if [ -n "$resume" ]; then
  { printf '%s\nFollow-up in this same image conversation:\n' "$rules"; cat "$brief"; } |
    (cd "$out" && "$codex" exec resume "$resume" --skip-git-repo-check -o "$out/codex-last.md" -) >>"$log" 2>&1 || status=$?
else
  { printf '%s\nBrief:\n' "$rules"; cat "$brief"; } |
    "$codex" exec --skip-git-repo-check -s workspace-write -C "$out" -c model_reasoning_effort=low \
      ${refs[@]+"${refs[@]}"} -o "$out/codex-last.md" - >"$log" 2>&1 || status=$?
fi
grep -m1 '^session id:' "$log" || true
cat "$out/codex-last.md" 2>/dev/null || tail -20 "$log"
exit $status
