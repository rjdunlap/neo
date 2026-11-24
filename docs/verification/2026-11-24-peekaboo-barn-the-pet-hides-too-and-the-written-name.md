# 2026-11-24 — Peekaboo Barn: the pet hides too, and the written name (PR #2118)

**Changed:** Peekaboo Barn free-play levels 1, 2 and 16: {pet} is a surprise friend once per round at a seeded counted reveal (`petReveal`, never first or last, never a miss), and every revealed friend shows its written lowercase name. Files: `src/games/peekaboo-barn/{index,logic,voice,logic.test}.ts`, a pet-reveal step in `scripts/browser/suites/originals.mjs`.
**Ran:** `npm run typecheck`; vitest `src/games/peekaboo-barn` and `src/content` (pass); filtered `originals` browser play of levels 1, 2 and 16 and the forced pet reveal, with a screenshot (pass).
**Not run:** `npm run build`, `fingerdemo` (bot behaviour unchanged), full browser suites.
