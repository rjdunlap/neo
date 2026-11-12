# Verification 2026-11-12 (archived entries)

## 2026-11-12 — U7d fix batch 5: sound-garden and puppet-stage never hold a tap on a right answer's or a free tap's line (PR #1545)

**Changed:** `sound-garden` (choice levels: a right tile's name starts and the next question follows after a 0.6 s beat, `praise` dropped there; level 5: `sg.echoyes` starts and the next rhythm follows at once) and `puppet-stage` (a free puppet tap and level 3's free first try leave input open; a right answer's reply is cut by the next ask after the clap and a 0.3 s beat; a puppet's mouth stays open when its own next line cuts its last). Two R4 assertions: `puppetstage` (level 2: next ask open within 0.9 s of the right puppet's tap, was about 1.9 s; level 3 free tap and free first try leave input open) and `batch` with `BATCH_ONLY=garden` (level 2: next question within 1.2 s, was about 2 s; level 5: next rhythm within 4.3 s of the tree waking, was about 5.5 s).
**Ran:** `npm run typecheck`; `npx vitest run src/games/sound-garden src/games/puppet-stage` (65 passed); `BROWSER_SUITE=puppetstage`; `BROWSER_SUITE=batch BATCH_ONLY=garden SOUND_LEVELS=2,5`. All passed.
**Not run:** build, `fingerdemo` (both bots still wait on `busy`, plus `freeTrying`; timing unchanged), other suites, offline. Nothing was timed with real speech.
