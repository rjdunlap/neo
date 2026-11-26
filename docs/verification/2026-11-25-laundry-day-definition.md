# 2026-11-25 — Laundry Day definition (PR #2200)

**Changed:** Docs only: `docs/definitions/laundry-day.md` (an eleventh Story Steps story, a fictional picnic-blanket chore, with the rules it touches), the study's H7 row, the IDEAS and RECOMMENDATIONS rows, and Next ten (the define line replaced by its build line).
**Ran:** `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** No code, tests, build or browser suite; nothing was built. The definition's claims about `STORY_FAMILY`, `canPairStories` and the level pools were read from `src/games/story-steps/logic.ts`, not exercised.
