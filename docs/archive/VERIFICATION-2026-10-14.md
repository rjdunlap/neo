# Verification 2026-10-14 (archived entries)

## 2026-10-14 — Social-emotional subject research

- Docs only, base `bf8117f` plus research diff, [PR #321](https://github.com/rjdunlap/neo/pull/321): [study](../deep-dives/subjects/social-emotional.md), every audience L–G, six opened digital precedents and a physical equivalent; synchronized tracker/notebook, [roadmap packets](../ROADMAP.md#social-emotional-play-recommendations), reviewer/device records. Pre-existing completed-work archive edit excluded.
- Opened CASEL, Head Start, the facial-expression review and an adolescent randomized game trial; its lack of between-group empathic-accuracy improvement is explicit. Access gaps and unplayed references are named. Recommend Playdate Workshop first, Common Ground for older families, and Two Viewpoints/Ask First within existing games.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (docs-only tier); rotated the oldest dated entry with local links repaired. No game or practical emotional-health advice built.
- Not run: typecheck, unit tests, build, browser/offline/device/child checks. Content review, identity/band/land fit, older-family appeal and real-world transfer remain open; practical advice/physical calming requires named qualified review.
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

## 2026-10-14 — Weather and water subject research

- Docs only, base `1f56bd6` plus research diff, [PR #313](https://github.com/rjdunlap/neo/pull/313): opened NGSS, USGS, EPA, NOAA, CDC and NAEYC anchors; five digital precedents and one physical reference, with access/model limits recorded in the [study](../deep-dives/subjects/weather-water.md).
- Every audience L–G has an answer; recommended Rain Garden, Drop's Journey and Forecast Detective definition packets, with Weather Window retained in Day by Day. Updated tracker, notebook, roadmap and future decision/device records; no games built or scheduled.
- Relative Markdown links/anchors and `git diff --check` passed. Rotated Bug Builder's oldest dated entry to the existing archive, repaired its relative links and repointed incoming anchors.
- Not run: typecheck, units, build, browser/offline or hardware checks (docs-only tier). Scientific transfer, iPad speech/touch and tween/parent appeal remain unestablished; toy-model scope and future scientific content review remain open.

## 2026-10-14 — Movement roadmap recommendations

- Docs only, base `a0362bc` plus roadmap diff, [PR #312](https://github.com/rjdunlap/neo/pull/312): recorded the developer-requested priorities Adventure Walk and Animal Charades, with Mirror Partners retained as a Pet Says extension.
- Roadmap definition packets, subject study/tracker and candidate notebook agree on original content, supported endings, existing-game overlap and reviewer/seat dependencies. No games built or scheduled.
- Markdown links/anchors and `git diff --check` passed. Rotated the oldest live dated entry into the existing archive and repointed incoming links.
- Not run: code, browser, offline or device checks (docs-only tier). Proposed age ranges, family appeal and movement instruction review remain open.

## 2026-10-14 — Memory Match vehicles deck

- Content on `claude/memory-match-vehicles` (uncommitted base `66b2baf`): a fourth seeded picture family of eight code-drawn vehicles at levels 1–5 (`VEHICLES`/`PICTURE_POOLS` in `logic.ts`, `vehicleArt` in `art.ts`); no level, band or accounting change.
- Ran: typecheck, memory-match and content unit tests (pass), one screenshot of all eight vehicles on cards (readable; the plane's wings are flat).
- Not run: a browser play-through of a full vehicle round, `fingerdemo`, device speech or child recognition of the drawings.

## 2026-10-14 — Opposites second batch of pairs

- Content on `claude/opposites-second-pairs` ([PR #317](https://github.com/rjdunlap/neo/pull/317)): four pairs in `src/games/opposites` (sponge wet/dry, plate clean/dirty, book thick/thin, ball near/far), all `from` level 3; levels 1–2 unchanged, levels 3–4 draw from sixteen pairs; sticker pool unchanged.
- Ran: typecheck, the five Opposites rule tests (pool test updated), `BROWSER_SUITE=woods WOODS_ONLY=opp FROM_LEVEL=3` (levels 3 and 4 passed), one screenshot of the four new pictures.
- Not run: a portrait screenshot, `fingerdemo`, iPad or child legibility at 140 units.

## 2026-10-14 — Critter Sort deep dive

- Docs only, base `e6db692` plus the write-up, [PR #316](https://github.com/rjdunlap/neo/pull/316): `docs/deep-dives/critter-sort.md` (ladder, genre research through search summaries, experience section, nine build slices), tracker row, roadmap chunk 14, IDEAS pointer and a Waiting row.
- Ran: link check and `git diff --check`. No code, tests or browser suites.
- Open: sources not opened in full; the CCSS K.MD.B.3 reading is recalled; device speech and a child's reading of the picture signs are person checks.

## 2026-10-14 — Routines and self-care subject research

- Docs only: [study](../deep-dives/subjects/routines-self-care.md), subject tracker, notebook candidates and [roadmap definition packets](../ROADMAP.md#routines-and-self-care-recommendations): Ready for Adventure first, Toy Drawer and Village Planner for older families. Developer follow-up: [Toy Drawer: Make it Fit](../deep-dives/subjects/routines-self-care.md#toy-drawer-follow-up-make-it-fit) now leads with inventory packing; retrieval stays optional.
- Read the existing routines-adjacent game plans; opened Head Start/AAP/Sesame/NCPMI/Harvard guidance and six first-party digital descriptions. Day & Night is explicitly search-excerpt-only (403); no reference game was played. Follow-up opened Blizzard's item guide, Backpack Hero's developer page and Save Room's publisher listing; compared Tangram Town rules and Block Garden's proposal. Opened Kabam 26.10.0/26.10.1 for the developer's Pharoway Caravan reference; added the later Pack the Wagon manifest/selection mode with exact stacking rules explicitly unverified. Event gameplay not run.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (docs-only tier). Older log entries rotated with relative links repaired.
- Not run: typecheck, units, build, browser/device/child checks. No code or real-care instructions changed; practical-care review, audience appeal and real-world transfer remain open.

## 2026-10-14 — Memory Match dot arrangements (levels 6–7)

- Content on `claude/memory-match-dot-layouts` (uncommitted): `dotLayouts`/`selectDotLayouts` in `logic.ts` give each numeral-to-dots card one of several curated arrangements (one per pair, seeded, one dot colour); quantities 1–4/1–8 and accounting unchanged.
- Ran: typecheck, `vitest run src/games/memory-match` (13 pass; two new: valid count/spacing/bounds for 1–8 in at least three layouts for n≥2, seeded and reaches every arrangement), one 1024x768 browser screenshot of level 7 showing varied faces.
- Not run: bot/`fingerdemo` (interaction unchanged), full browser round, device or child recognition.

## 2026-10-14 — Cooking and recipes subject research

- Docs only, base `ed9d888` plus research diff, [PR #320](https://github.com/rjdunlap/neo/pull/320): [study](../deep-dives/subjects/cooking-recipes.md), every audience L–G, five first-party digital precedents and a physical equivalent; synchronized tracker, notebook, [roadmap packets](../ROADMAP.md#cooking-and-recipes-recommendations), reviewer and future person/device records.
- Opened Head Start, CCSS, Illinois Extension, NAEYC, CDC and FoodSafety.gov sources. USDA PDF/infant Head Start access gaps are explicit; reference games not played. Recommended Recipe Workshop first, equivalent measures/scaling inside Pet Kitchen, then Picnic Pantry's two-solution menu case. No games or real recipes built.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (docs-only tier); rotated two old dated entries with relative links repaired. Preserved the pre-existing edit in `docs/archive/COMPLETED-2026-10-09.md` outside this change.
- Not run: typecheck, unit tests, build, browser/offline/device/child checks. Food-safety review, final identity/bands/destination fit, tween/parent appeal and real-kitchen transfer remain open.
