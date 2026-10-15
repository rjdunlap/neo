# Verification 2026-10-14 (archived entries)

## 2026-10-14 — Peekaboo Barn beach scene

- Uncommitted working diff on `claude/roadmap-development-3dc5ea` (branch base not recorded here): the round seed can now choose a beach (umbrella, sandcastle, bucket, towel over sand, a sea band and a sailboat), beside barnyard and garden. Levels 1–8, bands, interaction, rewards and sticker/icon art unchanged.
- Passed `npm run typecheck` and the Peekaboo rule tests plus content and registry tests (92 tests).
- One Chrome screenshot of the beach at 1024x768 (landscape only).
- Not run: portrait screenshot, a play-through, `fingerdemo`, build or offline; scene-content tier, interaction evidence from [cover support](VERIFICATION-2026-10-07-13.md#2026-10-14--peekaboo-barn-cover-support) reused. Real iPad, speech and child recognition remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device).

## 2026-10-14 — Clap the Syllables slice 1 (more words)

- Branch `claude/clap-syllables-more-words`: nine new words with code-drawn pictures (38 in all) and a dialect-exclusion test.
- Passed `npm run typecheck` and vitest for `src/games/clap-syllables` and `src/content` (93 tests). One screenshot of the new pictures from a probe (not a game play).
- Not run: a browser play of the game (`clap` suite), a portrait screenshot, `fingerdemo`, a device speech check of the new words.

## 2026-10-14 — Movement and exercise subject research

- Docs only, base `d7b6804` plus research diff, [PR #311](https://github.com/rjdunlap/neo/pull/311): official WHO/AAP/CDC/SHAPE sources, six comparable references, every audience L–G, existing-game overlap, Dance Workshop proposals and ordered slices.
- Updated subject tracker, candidate notebook, roadmap next subject, reviewer decisions and future person/device observations. No game implementation, physical instructions or runtime changes.
- Relative Markdown links/anchors and `git diff --check` passed. Rotated the two oldest dated entries to the existing archive, repaired their relative links and repointed incoming anchors.
- Not run: typecheck, units, build, browser/offline or hardware checks (docs-only tier). Movement/accessibility reviewers, parent/tween appeal and physical participation remain unestablished.

## 2026-10-14 — Color Garden slice 1 (mixed kinds at level 6)

- Branch `claude/color-garden-mixed-kinds`: level 6 mixes fruit (the color's own fruit), balloons and flowers, with all three kinds in every round (`deal` returns `kinds`, `PLANS[5].mixed`); `describeLevel` and the how-to step updated.
- Passed `npm run typecheck` and vitest for color-garden, content and registry (97 tests). `BROWSER_SUITE=fingerdemo FINGER_ONLY=color-garden FINGER_LEVELS=6` clean in 44.5 s, no wrong move.
- Not run: a portrait screenshot, a device check.
