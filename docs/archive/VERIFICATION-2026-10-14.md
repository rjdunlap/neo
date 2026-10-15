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

## 2026-10-14 — Social-emotional subject research

- Docs only, base `bf8117f` plus research diff, [PR #321](https://github.com/rjdunlap/neo/pull/321): [study](../deep-dives/subjects/social-emotional.md), every audience L–G, six opened digital precedents and a physical equivalent; synchronized tracker/notebook, [roadmap packets](../ROADMAP.md#social-emotional-play-recommendations), reviewer/device records. Pre-existing completed-work archive edit excluded.
- Opened CASEL, Head Start, the facial-expression review and an adolescent randomized game trial; its lack of between-group empathic-accuracy improvement is explicit. Access gaps and unplayed references are named. Recommend Playdate Workshop first, Common Ground for older families, and Two Viewpoints/Ask First within existing games.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (docs-only tier); rotated the oldest dated entry with local links repaired. No game or practical emotional-health advice built.
- Not run: typecheck, unit tests, build, browser/offline/device/child checks. Content review, identity/band/land fit, older-family appeal and real-world transfer remain open; practical advice/physical calming requires named qualified review.

## 2026-10-14 — Sing-Along Barn fourth tune (Au Clair de la Lune)

- Commit 9c23ff0 on `claude/barn-au-clair` ([PR #323](https://github.com/rjdunlap/neo/pull/323)): tune `clair` (C C C D E D / C E D D C; 11-note opening, 12-note verse answering on "mot") joins the seeded pool and the level 5-6 chooser, whose four cards shrink to 0.72 so the row fits portrait. Levels, bands and rewards unchanged.
- Passed `npm run typecheck` and `vitest` on `src/games/sing-along-barn` and `src/content` (106 tests). A wider `src/games` run had four failures in bumper-garden, ferry-jam, peg-garden and penguin-slide logic tests, files this slice did not touch; not investigated.
- Passed `BROWSER_SUITE=singalong` on `http://localhost:5437`, including a new Au Clair round at level 1 (0 misses, 0 hints); one portrait screenshot of the level-5 chooser shows the four cards fitting.
- Not run: `fingerdemo`, build, offline, device speech. The melody is from the standard form, not a printed score; iPad, speech and a child's tapping remain [open](../DEVICE-CHECKS.md#needs-a-person-or-a-device).

## 2026-10-14 — Off-screen companions subject research

- Docs only, base `d840a77` plus research diff, [PR #322](https://github.com/rjdunlap/neo/pull/322): [study](../deep-dives/subjects/off-screen-companions.md), every audience L–G; tracker, [roadmap packet](../ROADMAP.md#off-screen-companions-recommendations), IDEAS and Waiting rows.
- Read from source: Zero to Three's handout (PDF text extracted), AAP Power of Play and Choking Prevention, CPSC small parts, Camp Khan Kids, Vroom. Only summaries: WHO (PDF 403), Barr and Hirsh-Pasek, Cooney Center; Exploratorium (403) and Hoot Owl Hoot's maker page unread.
- Found by reading `src/`: 93 of 94 games have an `offScreen`; the page shows at most two; at least five lap/toddler lines name small objects; Weather Wardrobe's `{name}` prints literally. Keyword audit, hand read; not a safety finding of record. Recommend a removal-only swap first. No code changed; `node scripts/check-links.mjs` and `git diff --check` below.

## 2026-10-15 — Word Monsters guards (sound twins, bounded how-to)

Changed: `pickLetters` never offers two letters with the same sound (c and k); the "who says" pool drops q and x; the level 7 how-to step stops at 7; `LEVELS.school.max` follows the plan length ([PR #327](https://github.com/rjdunlap/neo/pull/327)).
Ran: typecheck; Word Monsters, content and registry unit tests (97 pass, new 200-seed twin test).
Not run: browser play (rules-only slice, per the deep dive), iPad. Open: level 8 decoys, the stale sun rule, the pinned sticker test.

## 2026-10-14 — Machines and tools subject research

- Docs only, base `6f4b57a`, research `2949bb7`, integrated `2eccd72`, plus docs diff on `codex/machines-tools-subject`: [study](../deep-dives/subjects/machines-tools.md), tracker, [roadmap definitions](../ROADMAP.md#machines-and-tools-recommendations), notebook, pulley clarification in PHYSICS-GAMES and review/device notes. Gear Garden first, Lift It and Puppet Workshop next; Mobile Maker stays in Seesaw Balance.
- Opened Head Start/NGSS/year 5 Forces, OpenStax, NWT gear section, six digital descriptions and Exploratorium automata PDF. No reference gameplay or intervention evidence; thin/failed pages are named. Exact-rule/geometry examples are proposals, not tested boards.
- Ran: local Markdown links/anchors and `git diff --check` (docs-only tier); rotated the oldest dated entry with relative links repaired. No code changed; no server started.
- Not run: typecheck, unit tests, build, browser/offline/hardware/speech/family checks. Practical instructions need a named reviewer; identity/ranges/land fit, mechanism review and older appeal remain future work. Publication initially required explicit approval; the developer authorized publication and merge on 2026-10-14.

## 2026-10-14 — Commercial social-play roadmap follow-up

- Docs only, base `38731a0`, integrated `924e3f8`, plus follow-up diff, [PR #325](https://github.com/rjdunlap/neo/pull/325): [seven additional references](../deep-dives/subjects/social-emotional.md#commercial-and-tabletop-follow-up-requested-2026-10-14), concrete [roadmap definitions](../ROADMAP.md#social-emotional-play-recommendations), existing notebook rows and subject tracker. A Place for You extends Common Ground; Dream Cards develops its existing seed; story/prop/role additions stay in their existing candidates.
- Publisher/rules sources plus Common Sense Media, Games for Change, Apple and Spiel des Jahres context. Nintendo DLC mechanics are search-excerpt-only; complete Dixit scoring and reference gameplay unverified. Popularity/recognition and learning effectiveness remain separate; no games, new bands or practical advice built.
- Ran: local Markdown links/anchors and `git diff --check` (docs-only tier). Rotated oldest dated entries with relative links repaired; fixed the baseline garden-verification archive link in this clean checkout, preserving the original checkout's pending correction.
- Not run: typecheck, units, build, browser/offline/device/child checks. Proposed identity/ranges/placement, original content review, shared-device privacy, solo/co-play usability and real-world transfer remain future checks. No dev servers started.

## 2026-10-15 — Splish Splash level 9 Pat the bubbles

- Branch `claude/splish-pat-the-bubbles`: a lap entry placed first (`order` [9, 1, 2], `entryLevels` [9]); any touch takes a third off the nearest of four mud patches (12 pats at most), a sparkle after six idle seconds, no misses or hints. Lap range 1 to 9.
- Passed `npm run typecheck`; full vitest (1274 pass); `BROWSER_SUITE=early EARLY_ONLY=bath` levels 1 to 9 (third run: one earlier run failed at level 6 score [2,0] and one at level 9, unexplained, treated as timing flakes and not diagnosed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=splish-splash FINGER_LEVELS=9` clean in 19.9 s. One landscape screenshot viewed.
- Not run: build, a portrait screenshot, a person check (does a one-year-old pat or look first).

## 2026-10-14 — Critter Sort level 6 (Just a few) and the missed-critter hint

- [PR #326](https://github.com/rjdunlap/neo/pull/326), branch `claude/critter-sort-just-a-few`: level 6 added as the pre-K entry (`order: [6, 1, 2, 3]`, `entryLevels: [6]`): three critters, one hoop, one fitting critter already inside as a worked example; the hint (`hintFor` in `logic.ts`) now points at the critter she just missed. No preschool row, no "neither" mat, no worked example at levels 1–3 and 5.
- Passed `npm run typecheck`, the full vitest run (1273 tests, before the rebase onto current `main`) and `FINGER_ONLY=critter-sort FINGER_LEVELS=6,1` (level 6 in 6.5 s, level 1 in 12.5 s).
- Not run: a browser play with a wrong drop and hint at level 6, a portrait screenshot, iPad, and a child reading the picture signs.

## 2026-10-14 — Space subject research

- Docs only, base `1a10eba` plus research diff on `codex/space-subject-research`, [PR #335](https://github.com/rjdunlap/neo/pull/335): [study](../deep-dives/subjects/space.md), tracker, [roadmap definitions](../ROADMAP.md#space-science-recommendations), notebook and review/device notes. Moon Window first; Orbit Garden and Observatory Files follow; daylight/scale/gravity launches reuse existing identities.
- Opened seven NGSS anchors, NASA science/physical-model references, developmental guidance, two primary research abstracts and six official digital precedents (PhET extraction limits recorded). Every audience L–G has an answer; no reference game played or gameplay built. Neopets activity failed to load and stays recalled inspiration.
- Ran: relative Markdown links/anchors and `git diff --check`; oldest dated entries rotated to the existing archive with incoming links repaired.
- Not run: typecheck, units, build, browser/offline, hardware, device speech or child/parent checks. Model review, registration/land fit, exploration adaptation, practical-card review and appeal/transfer remain open.

## 2026-10-14 — Life science subject research

- Docs only, researched at `8dfea72`, integrated with `560352b` plus docs diff, [PR #330](https://github.com/rjdunlap/neo/pull/330): [study](../deep-dives/subjects/life-science.md), tracker, [roadmap packets](../ROADMAP.md#life-science-recommendations), notebook and review/device notes. Seed Travelers first; Life Story Lab develops Caterpillar Week; Field Notes and Under the Soil stay in Photo Safari/Garden Grow.
- Opened Head Start/NGSS/Kew/Smithsonian/NAEYC anchors, six digital precedents, publisher board rules and an unplugged reference. Every audience L–G has an answer; source/access/model limits and older appeal gaps are explicit. No reference game played or game built.
- Ran: relative Markdown links/anchors and `git diff --check` (docs-only tier); oldest dated entries rotated to the existing archive and incoming links repaired.
- Not run: typecheck, units, build, browser/offline, hardware or person/child checks. Biology/model review, proposed placement, practical-card review and transfer remain open.

## 2026-10-14 — Programming subject research

- Docs only, researched at `5222d51`, integrated upstream `0ac9287` plus research diff on `codex/programming-subject-research`, [PR #338](https://github.com/rjdunlap/neo/pull/338): [study](../deep-dives/subjects/programming.md), subject tracker, [roadmap packets](../ROADMAP.md#programming-recommendations), candidate notebook and decision/device records. Cue Studio first, develop existing Machine Line, then Parcel Programs; route reuse stays in Robot Path.
- Opened CSTA 2026 and historical 2017 PDFs, the second-grade CAL-ScratchJr trial, official ScratchJr guidance/lesson, six first-party digital precedents and Kidbots. No reference game played; access limits, toddler-readiness, transfer and older-appeal gaps are explicit.
- Ran: `node scripts/check-links.mjs` and `git diff --check` (docs-only tier); rotated the oldest dated entry with links repaired. No code, game or practical card built.
- Not run: typecheck, units, build, browser/offline, hardware, speech or child/parent play. Identity/ranges/placement, creation-versus-Check accounting and practical-card review remain open.

## 2026-10-15 — Frog Hop level 8 Back over ten

- [PR #346](https://github.com/rjdunlap/neo/pull/346), branch `claude/frog-hop-back-over-ten`: new mode `back-ten` (school band now 3–8; starts 11–16, take away 4–8): a card for the hops back to 10, the pet says the split, then tap the pad where the rest land. Mirror of level 7; same miss and hint rules. Voice lines, a how-to line from level 8, bot and rule tests.
- Passed `npm run typecheck`, `npm test` (1297 passed), `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=8` (wrong answers, hint glow, score [4,1]) and `FINGER_ONLY=frog-hop FINGER_LEVELS=8` (clean in 39.0 s).
- Not run: a portrait screenshot, `npm run build`, couch play (the couch reaches 7–10 in a later slice), iPad, a child.

## 2026-10-15 — Tangram Town bridge (level 6)

- [PR #354](https://github.com/rjdunlap/neo/pull/354): added one picture, `bridge` (a rectangle deck on two upside-down hulls at x=±110), to level 6's silhouette pool only (`src/games/tangram-town/logic.ts`). Pictures are now twenty-one by the count of `PICTURES` keys.
- Ran: `npm run typecheck` clean; vitest on `src/games/tangram-town` and `src/content`, 92 passed; one SVG render of the picture.
- Not run: browser play, `creative` filter, `fingerdemo`, a device. Open: how the bridge reads on screen at play size.
