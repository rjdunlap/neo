# 2026-11-15 — Animal Snack level 7 Who eats it too? (PR #1697)

**Changed:** `animal-snack` level 7 (`eats` mode, sourced `EATS` and `NOT_EATS` tables, three new voice lines, how-to line, `LEVELS.prek` 5–7); the hint glow for every level now converts screen bounds to stage coordinates, so on a phone it sits around the right animal instead of a small square near the top-left.
**Ran:** typecheck; full `npx vitest run` (352 files, 7163 tests passed); `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=7` passed (a found eater tapped again is no miss, two non-eater taps are 2 misses and 1 hint, the glow lands on the eater still to find, a 390x844 portrait screenshot, saved score 2/1); `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=7` passed (14.9 s).
**Not run:** `npm run build` (no shared files or assets changed), browser plays of levels 1–6, device speech for the three new lines (no rendered clip).
