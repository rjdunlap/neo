# 2026-11-17 — Adventure Walk level 4, The way home (AW4)

**Changed:** Adventure Walk level 4 (walk out freely, then tap the landmark the walk home comes to next on a map; three seeded shapes), the `map-reading` skill, five voice lines; Show a hint no longer throws at level 1; the friend critter is untracked in `destroy()`.
**Ran:** `npm run typecheck`; `npm test` (357 files, 7534 passed, 1 skipped); `BROWSER_SUITE=adventurewalk` (levels 1 and 3 as before, plus level 4 in portrait on the hook map: Show a hint on the walk out does nothing, a wrong tile is 1 miss, a requested hint is 1 hint and the glow, a passed tile counts nothing, home, saved score 1 miss 1 hint) with one portrait screenshot of the hook map; `BROWSER_SUITE=fingerdemo FINGER_ONLY=adventure-walk FINGER_LEVELS=4` (finished in 18.7 s).
**Not run:** `npm run build` locally (no shared file changed; CI builds), the offline check, `world` and other suites.
