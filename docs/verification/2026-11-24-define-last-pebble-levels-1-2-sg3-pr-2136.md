# 2026-11-24 — Define Last Pebble levels 1–2 (SG3, PR #2136)

**Changed:**
- New definition [docs/definitions/last-pebble.md](../definitions/last-pebble.md): Strategy-games SG3 (`last-pebble`, levels 1–2), freezing the Nim / *Got It* stepping-stone model (`logic.ts`), level 1 (*Near the far bank*, 3 short crossings) and level 2 (*Across the stream*, `T ∈ {7, 8, 10, 11}`), the winding 128-unit stream layout (`upright: true`, `school` about 10 and up + `grownup`, Puzzle Peaks beside Shell Rows with `lands.test.ts` capacity check), Shell Rows-style *show me why* turning-point rewinds, coach accounting, static Kokoro-ready voice lines, how-to card, ghost finger, and build batch `last-pebble 1`.
- Updated [docs/README.md](../README.md), [docs/STUDY-BACKLOG.md](../STUDY-BACKLOG.md), [docs/ROADMAP.md](../ROADMAP.md), [docs/deep-dives/subjects/strategy-games.md](../deep-dives/subjects/strategy-games.md), and [docs/deep-dives/subjects/RECOMMENDATIONS.md](../deep-dives/subjects/RECOMMENDATIONS.md) (recording `SG3b` levels 3–4 as the follow-up definition after levels 1–2).
- Removed `docs/ready/next/840-define-last-pebble-strategy-games-sg3.md` and queued `docs/ready/next/870-last-pebble-levels-1-2-near-the-far-bank-and.md` for batch `last-pebble 1`.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`.

**Not run:** typecheck, unit tests, build, and browser checks (docs only; nothing built or played).
