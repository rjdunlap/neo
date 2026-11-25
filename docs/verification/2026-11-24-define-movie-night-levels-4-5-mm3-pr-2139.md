# 2026-11-24 — Define Movie Night levels 4–5 (MM3, PR #2139)

**Changed:** docs only: the levels 4–5 definition in `docs/definitions/movie-night.md`, the study's build-slice line, the study backlog row, and READY's Next ten (the define line removed, the MM4 build line added).
**Ran:** a script that enumerated the accepted strips (level 4: 6 of 24; level 5: 30 of 120, by omitted card 6, 16, 4, 4) and the Story Steps overlap conditions on them; `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** no code, browser, layout or device check (nothing is built); the upright fit of five tray cards and four slots is a build-time requirement, not tried here.
