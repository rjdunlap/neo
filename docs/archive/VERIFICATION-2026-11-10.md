# Verification 2026-11-10 (archived entries)

## 2026-11-10 — Sand Table level 4 *Where did it go?*, earth-materials E4

Changed: `sand-table` level 4 (school {3,4}): breeze rule and answers in `logic.ts`, scene, art, 13 voice lines, how-to, `sandtable` suite extended; reviewer fixes (pads ignore taps during a puff, ticks, no stale glow line after Start again).
Ran: `npm run typecheck`; `npm test` (332 files, 6388 passed, 1 skipped; rerun after the reviewer fixes); `BROWSER_SUITE=sandtable` (levels 1, 3, 4; level 4 portrait: tray tap before the puff, Breeze, one wrong pad, dotted-path hint, right pad, saved 1 miss / 1 hint; portrait screenshot after the puff); `fingerdemo` at level 4 school (6.6 s); `npm run build`. Source check repeated, unchanged.
Not run: browser play after the reviewer fixes, offline, device speech, iPad, a child.

## 2026-11-10 — Frog Hop Fraction Landings levels 9–10, fractions R3 (PR #1449)

Changed: `frog-hop` levels 9 `frac-hop` and 10 `frac-match` (school only, school now 3–10, no `order`), skill `fractions`, rules in `logic.ts`, new voice lines, how-to, `woods` hop range to level 10.
Ran: `npm run typecheck`; `npm test` (332 files, 6396 passed; typecheck plus the frog-hop and content tests again after a final voice-line tweak); `BROWSER_SUITE=woods WOODS_ONLY=hop HOP_LEVELS=9,10` (level 9: two wrong pads, the hint, five answers; level 10: one wrong pad, the flag, two wrong cards, the hint, score [3,1]; landscape and portrait screenshots of 10); `BROWSER_SUITE=fingerdemo FINGER_ONLY=frog-hop FINGER_LEVELS=9,10 FINGER_BAND=school`.
Not run: `npm run build` (no shared src file changed), couch, world, offline, device speech of the fraction words, an iPad, a child.

## 2026-11-10 — Number Trails slice 2, more things and arrangements (PR #1453)

Changed: `number-trails` `THINGS` 3 to 8 kinds (new `things.ts`, `drawThing` recenters and scales to the tap circle); `ARRANGEMENTS` rows, twoRows, pairs, ring with a rows fallback.
Ran: `npm run typecheck`; number-trails tests (3 files, 26: every arrangement at counts 0–12 and five views, seed stability, every kind's Pixi bounds); targeted vitest of number-trails, registry, content and scripts (34 files); one scripted portrait play of level 3 (ring of nine lemons, six woken, sticker, no page errors, screenshot reviewed).
Not run: `npm run build`, `fingerdemo`, the `numbertrails` suite, a device. Local full `npm test` had 8–9 unrelated timing failures in other games under load (CI runs the full suite).

## 2026-11-10 — Upright shell slice 2, the rest of the root (chunk 31, PR #1459)

**Changed:** Explore (its five entries, All games, Places), Friends, Dress, the journal and the sticker book set `upright` and lay out on the 768 × 1024 area; new pure `journalLayout` and `stickerBookLayout`, Places three to a row, journal page arrows kept inside the view on the wide area, sticker-book arrows 100 units; Home's companion kept right of the guide corner. All games at lap and toddler (Little surprises leading) keeps the turn prompt.
**Ran:** `npm run typecheck`; `npm test` (338 files, 6497 passed, 1 skipped), with `UPRIGHT_VIEWS` added to the Friends, Dress, Home and Explore layout tests and the new `upright-root.test.ts`; `npm run build`; one scripted pass at 390 × 844 with touch on a dev server (preschool profile, scenes reached through `neo.go.*`): each scene had `neo.view.upright` true, width 768, no turn prompt, one screenshot, no page errors; toddler All games still shows the prompt.
**Not run:** `phonefit` and `home` browser suites (no scene they assert changed), `world`, offline (no navigation, persistence, manifest or asset change).

## 2026-11-10 — U1, name the pictures (UX review, PR #1460)

**Changed:** each Home picture button and each result button at the root (not `classic/`) carries a short name on a cream pill across its lower rim; new `src/content/button-names.ts`, `namePill` in `src/ui/text.ts` (Explore's card names now use it), `RoundButton.named`, `HOME_NAME_W` and `RESULT_NAME_W`; no spot moved.
**Ran:** `npm run typecheck`; `npm test` (338 files, 6497 passed plus the new layout cases; a `finish.test` mock fixed and that file re-run 4/4); `npm run build`; `BROWSER_SUITE=home` with `HOME_ONLY=result` and `HOME_ONLY=buttons`; one scripted Chromium pass with screenshots (lap Home 1024 × 768, pre-K Home with New friend 700 × 1100, grown-up Home 1366 × 768), no page errors.
**Not run:** `world` (no navigation change), offline (no persistence or asset change). Upright Home is covered by unit tests only (a phone's root is Today's six, so the browser could not show it).

## 2026-11-10 — U2, one picture, one meaning (UX review)

**Changed:** `sixIcon` is a day's page with the sun; new `nestIcon`, `undoIcon` and `turnIcon` in `src/ui/icons.ts`; a round's Back to Today's six shows `sixIcon`; the Play and Room friends button is the nest (the basket now only means Welcome a New Friend's project); the Room's undo buttons and Stamp Studio's Undo and Turn use the hook and the curved arrow (behaviour unchanged); `room.friends` line reworded.
**Ran:** `npm run typecheck`; `npm test` (338 files, 6499 passed, 1 skipped); `npm run build`; dev-server screenshots (speech off, 1024 × 768) of Home (preschool), the Play room, and Stamp Studio pre-K level 4 after two stamps, no page errors; a side-by-side render of the icons.
**Not run:** any browser suite, `fingerdemo` (bot and demonstrated actions unchanged), offline, upright screenshots.

## 2026-11-10 — U3, round Back and help (PR #1462)

**Changed:** Back and the in-round question mark use standard tap targets. Paused offers Leave during an unfinished round, including when its how-to card is open. Leave follows Back’s return route. The Paused card scrolls when a short viewport cannot fit its buttons.
**Tested:** `3c364fb8` plus the U3 working diff. `npm run typecheck`; `npm test` (338 files, 6,495 passed, 5 skipped); `npm run build`; `npm run lint`; `npm run format:check`; `BROWSER_SUITE=home HOME_ONLY=buttons` at `http://localhost:5196` returned to Counting Cove by Back, Paused → Leave and result Back. `BROWSER_SUITE=world` at the same URL passed both checks, including classic round return and subject pages in all six bands and both orientations. On a 390 × 844 Chromium touch viewport, Today’s six → Crossword → `?` → Paused → Leave returned to Today’s six, and a fresh round returned there with one tap on Back. `GAME_URL=http://localhost:4196 npm run test:offline` passed for both root and classic after comparing the entry asset hashes against the production build.
**Targeted:** The 844 × 390 Chromium touch check opened Sudoku Garden’s four-action pause card, verified that it scrolls and used Leave to return to Today’s six. `BROWSER_SUITE=howto HOWTO_ONLY=bubble-pop` passed the intro and in-round question-mark checks after removing a stale catalog count. Its separate level-picker check stopped at the existing Quick Tricks fixture, whose toddler ladder now has three levels.
**Open:** Turning while Today’s six was on screen exposed a separate error in an animated Bubble Pop card icon after the cards were rebuilt.

## 2026-11-10 — Pond Conga, swipe anywhere (phone note, PR #1463)

**Changed:** the touch swipe layer covers the whole view (`pondTouchLayout` returns `swipe`); a stroke that strays past `SWIPE / 3` without a swipe is not a tap; a school tap-toward counts only on the pond; help line and how-to card say "swipe anywhere".
**Ran:** `npm run typecheck`; pond-conga and `src/content` tests (24 files, 245 passed); a 390 × 844 Chromium probe at `http://localhost:5191` on level 8 (a swipe below the pond stepped down, a 12 px slant did nothing, a tap below stepped on; home, help, pet and Hint won their hit tests); `BROWSER_SUITE=congatouch` passed (its help-line check now reads "Touch to set off").
**Not run:** `fingerdemo` (bot unchanged), build (no shared files), `couchgames` (couch input unchanged).

## 2026-11-10 — U4, show what to touch when it is quiet (UX review, PR #1464)

**Changed:** new `src/ui/idle-cue.ts` (`IdleCue`: first cue after 4 s of no touch, 0.8 s long, every 5 s until a touch; silent) with five unit tests. The hatch egg rocks about its tap tilt on the egg step; Welcome a New Friend's page hops the raised card (else the next step's card) about 18 units, reset by card taps, raise() and the basket tap and off during the ending. No reduced-motion setting exists, so none applied.
**Tested:** `npm run typecheck`; `npm test` (339 files, 6,504 passed, 1 skipped); prettier check on the four files; `npm run build`; `BROWSER_SUITE=home HOME_ONLY=first-run` and `BROWSER_SUITE=welcome` passed; a one-off 390 × 844 Playwright probe sampled the egg rotation: 0 for about 4 s, then 0.094 rad, settling to 0.
**Not run:** `world` (navigation unchanged), offline (no persistence, asset or navigation change); the card hop was not sampled in the browser, only the welcome suite ran through the scene.

## 2026-11-10 — Mossy Path slice 3, level 9 Two snacks

**Changed:** school level 9 (six frozen 4 × 7 mazes with two berries, either eating order, early pond refused once per round; `Board.berry2`, `berriesOf`, `MazeState.eaten`; voice `moss.maze-berries`, `moss.berry-one`, `moss.snack-both`; how-to level 8 capped, level 9 added).
**Ran:** `npm run typecheck`; `npm test` (338 files, 6505 passed, 1 skipped; the first full run had one failure that did not reproduce on the immediate rerun, recorded as a one-off flake under load); `npm run build`; `BROWSER_SUITE=mossypath MOSSY_ONLY=snacks` (farther berry first, early pond refused with 1 miss, portrait cells at least 100, finish, one sticker) PASS; `BROWSER_SUITE=fingerdemo FINGER_ONLY=mossy-path FINGER_LEVELS=9` PASS (school, 16.2 s); game-reviewer found no defects.
**Not run:** other suites (the tier needed none).

## 2026-11-10 — U5a, a first six she can start (PR #1467)

**Changed:** a game new to her today plays its band's first level on its Today's six card (`newToday`, shared `firstLevel`; pin wins, grown-ups unchanged); one `todaysSix` helper for the page and the result's next tile; `GameModule.coplayHintLap` and `tipFor`, Word Glue's lap tip, a registry tip rule with six games on a `PENDING_U5B` list.
**Ran:** `npm run typecheck`; `npm test` (339 files, 6,520 tests; registry test 38/38 after a small follow-up); `npm run build`; one headless 768 × 1024 flow at `http://localhost:5515/?daily` (`VITE_SPEECH=off`, fresh pre-K profile): six cards at first levels, one quick-tricks round, the next tile opened clock-tower at its first level, the same six back with quick-tricks ticked; one portrait screenshot (not committed); no console errors. A `game-reviewer` pass found nothing blocking.
**Not run:** offline (no persistence or asset change), `world` (no route change), `phonefit`. The return to the page used `neo.go.daily()`, not the result's Back button.

## 2026-11-10 — U5b, tips held to her band (PR #1468)

**Changed:** 29 games have a `coplayHintLap` override so a lap profile's co-play tip has the grown-up talk while she taps, points or watches; toddler tips unchanged; the registry test's `PENDING_U5B` list removed and three phrases added to its ask list.
**Ran:** `npm run typecheck`; `npx vitest run src/games/registry.test.ts` (37 passed).
**Not run:** browser play, build and full `npm test` (content tier; tips are text only). Whether the lap tips read well to a grown-up is a reading, not a test.

## 2026-11-10 — U6 one way to browse defined (docs only)

**Changed:** new [definition](../definitions/one-way-to-browse.md) of U6 in two slices (U6a the Arcade first, U6b the fold); READY, the UX review and the roadmap point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** code checks (docs only; nothing built).

## 2026-11-10 — U7 never swallow a tap defined (docs only)

**Changed:** new [definition](../definitions/never-swallow-a-tap.md) of U7 in four slices (U7a the phone's way in, U7b Day by Day and the held-line look, U7c the tablet root, U7d classify); READY, the UX review and the roadmap point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** code checks (docs only; nothing built).
**Open:** the four slices.

## 2026-11-10 — U8 the grown-ups' page speaks of the root defined (docs only)

**Changed:** new [definition](../definitions/grownups-page.md) of U8 as one slice (U8a, the root's grown-ups' page); READY, the UX review and the roadmap point to it.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** code checks (docs only; nothing built).

## 2026-11-10 — U8a, the grown-ups' page speaks of the root (PR #1472)

**Changed:** `openParentPanel` takes `{ app: 'root' | 'classic' }`; the root's page drops map, home spot, picnic and layout words, groups bands by age and omits Finding games; This week shows played or pinned games first with every game for her age in a closed, searchable fold; the dev button is now `kit.meetAll()`.
**Ran:** typecheck; `npm test` (341 files, 6528 passed); `npm run build`; `BROWSER_SUITE=grownups` once, with a new root step at 390×844 (no map words, fold closed, search, pin from the fold, fold stays open) and the pause-sheet steps fixed to expect Leave (stale since the round Back and help change); screenshots checked.
**Not run:** `lands` and `hatching-and-map` (classic text unchanged), `world` and offline (no route, persistence or asset change).

## 2026-11-10 — U7a, the phone's way in

**Changed:** `voice.stop()` and a new line end every pending line, a silenced one included; Today's six's taps hold a chosen look (`chosen`, `WayOut`) and change screen after a 0.2 s beat instead of after the line; the chooser waits that beat instead of 1.3 s and no longer speaks a greeting; `u7:*` performance marks and `scripts/tap-timing.mjs` ([U7a as built](../definitions/never-swallow-a-tap.md#u7a-as-built-2026-11-10)).
**Ran:** typecheck; `npm test` (341 files, 6526 tests, including new `voice`, `buttons` and `leave` tests; the voice tests fail on the old `voice.ts`); `npm run build`. The probe ran on the dev server at port 5191 with `VITE_SPEECH=off`, before at `be6ce620` plus the marks and after, three runs each, giving medians in ms. On the phone (390 × 844, touch, DPR 3): chooser pick from tap to the change starting went from 1861 to 195, and to settled from 3877 to 1248; Today's six → a game went from 1377 to 191 and from 2466 to 815. On the computer (1024 × 768): chooser pick to the change starting went from 2359 to 229; first frame was 471 and settled 890. Today's six → a game went from 1322 to 195 (first frame 330, settled 688), which meets the computer targets of 0.5 s and 1 s. Next scene `init` plus the snapshot took 1–7 ms. The chooser's cards showed 43–87 ms after its first screen, with one player or six. A result → Today's six is unchanged at 1214 to 1370 (U7b). One upright screenshot of the held chosen look on Today's six (`test-results/u7a-chosen-upright.png`, not committed).
**Caveats:** headless Chromium renders in software, and a frame there can run over 50 ms, which `tw` clamps. So settled times on the phone shape are slow and are recorded, not gated, and the dev server's load figures are for comparison only. Both suites that failed here were repaired afterwards ([entry](VERIFICATION-2026-11-10.md#2026-11-10--phonefit-and-profiles-suites-repaired-pr-1477)).
**Not run:** `world` (no route change); offline (no persistence or asset change); a real phone.

## 2026-11-10 — U7b, the phone's rounds never hold a tap

**Changed:** Day by Day's card pick no longer awaits its name; `HeldLines` (`src/app/held-line.ts`) follows every line a game starts, the corner guide bobs while one is pending and a board tap that made no sound and started no line ticks; the result's Back, the in-round Back and Home and the how-to card's Back change screen after the 0.2 s beat instead of waiting up to 1.1 s; `sfx` calls count themselves (`soundCount`) ([U7b as built](../definitions/never-swallow-a-tap.md#u7b-as-built-2026-11-10)).
**Ran:** typecheck; `npm test` (344 files; the first run found two `nav-meaning` tests that assumed the old wait, fixed and re-run passing); `npm run build`; `BROWSER_SUITE=week WEEK_LEVELS=1,4` PASS, then `WEEK_LEVELS=1` PASS after adding the held-record tick assertion (the arrow tapped during the name places the day, the guide is talking, `week.record` still holds, a tap during it ticks once and is not a miss); `BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day FINGER_LEVELS=1` PASS in 35.5 s. `scripts/tap-timing.mjs` medians (speech off, three runs), before → after, a result → Today's six: phone 390×844 the change starts 1235 → 329 ms, settled 1567 → 697 ms; computer 1024×768 the change starts 1356 → 443 ms, first frame 1358 → 445 ms, settled 1900 → 1025 ms. Today's six → a game unchanged (183–208 ms).
**Not run:** `world` (no route change), offline (no persistence or asset change), `phonefit` and `profiles` (known red on `origin/main`, a separate READY line).

## 2026-11-10 — U6a, the Arcade first (PR #1474)

**Changed:** new Arcade filter For me (games for her band; first Topics tile and the default), a page count pill ("2 of 6", hidden on one page), and the Arcade set `upright` with Topics rows laid above the guide corner across the full width.
**Ran:** typecheck; `npm test` (341 files, 6532 passed, 1 skipped); `npm run build`; `BROWSER_SUITE=home HOME_ONLY=arcade` once, now asserting For me on arrival, the count, 13 tiles with For me first and a touch phone at 390×844 with no turn prompt; screenshots checked at 1024×768, 768×1024 and 390×844 (grid and Topics).
**Not run:** `world` (no route change), offline (no persistence or asset change).

## 2026-11-10 — U6b, the fold (PR #1475)

**Changed:** Explore's entries are Places, Favorites, Arcade and Family play (All games and the Other ages signpost gone); `go.explore`'s third argument is now an Arcade filter; Little surprises is the first card on the entries page at lap and toddler; the empty Favorites shows a large heart and opens the Arcade on For me; Family play goes straight to couch play, whose Back opens the entries.
**Ran:** typecheck; `npm test` (344 files, 6543 passed, 1 skipped; new `explore-fold` tests); `npm run build`; `BROWSER_SUITE=home` main flow PASS (four entries, Places chain, Arcade on For me, Favorites page 2 and Back, empty heart in both orientations, Family play to couch and back, Little surprises first at lap); `BROWSER_SUITE=world`: PASS (both checks, every band and orientation).
**Not run:** `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` (plays the mix from the classic island, untouched; the root's mix is in the home flow), offline (no persistence or asset change).

## 2026-11-10 — `phonefit` and `profiles` suites repaired (PR #1477)

**Changed:** test files only. `phonefit` now waits for `neo.scene.resultReady` before reading the next of the six and the pencil (the result shows them after the buttons' 0.45 s tween, which slow headless frames stretched past the fixed 900 ms wait; not an app bug), and its last step reads the first lap game without `upright: true` from `src/games/*/index.ts` instead of naming `bubble-pop`, which has turned upright. `profiles` expects band `grownup` for an adult born in 1980 (two asserts) and waits for `neo.scene.age >= 0.35` before clicking the couch "Back to start" (CouchScene ignores presses before that).
**Ran:** `BROWSER_SUITE=phonefit` passed (about 15 s) and `BROWSER_SUITE=profiles` passed (about a minute), on the dev server at port 5569 with `VITE_SPEECH=off`, headless Playwright.
**Not run:** typecheck, unit tests and build (no app code changed; CI runs `npm test` and the build), `phone`, `world`, offline.

## 2026-11-10 — Mossy Path slice 4, level 10 Plan, then go

**Changed:** school level 10 (three frozen 4 × 7 mazes, draw the route as paw prints then tap the turtle to walk it; `planTouch`, `planGo`, `hintPlan`; voice `moss.plan`, `moss.plan-more`, `moss.hint-plan`; how-to, finish and note for level 10; school `order` 6, 8, 1, 7, 9, 2, 10, 3).
**Ran:** `npm run typecheck`; `npm test` (345 files, 6555 passed, 1 skipped); `npm run build`; `BROWSER_SUITE=mossypath MOSSY_ONLY=plan` (short plan and Go, wrong-branch plan with 1 miss, gold hint counted once, portrait 768 × 1024 cells at least 100, finish, one sticker) PASS; `BROWSER_SUITE=fingerdemo FINGER_ONLY=mossy-path FINGER_LEVELS=10` PASS (school, 10.1 s); game-reviewer found no blocking defects and one fix (a drift off the turtle keeps the plan) was applied, with rule tests and typecheck rerun after it.
**Not run:** the browser paths after that fix (neither exercises it), `world`, offline and other suites (the tier needed none).

## 2026-11-10 — Mossy Path slice 5, level 11 Thick moss

**Changed:** school level 11 (four frozen boards with thick tufts crossed twice; `completion` rewritten with visit counts; `needOf`, `visitsOf`, `routeLength`, `bloomedCount`; tuft art by shape; voice `moss.thick`, `moss.thick-go`; how-to, finish and note for level 11; school `order` 6, 8, 1, 7, 9, 2, 10, 3, 11).
**Ran:** `npm run typecheck`; `npm test` (346 files, 6568 passed, 1 skipped) before a last test-only change, then the game's rule tests (45) after widening the old-solver equivalence test to every legal prefix of every level 1–3 and 8 plan under all 8 symmetries; `npm run build`; `BROWSER_SUITE=mossypath MOSSY_ONLY=thick` PASS twice (free first tuft visit, one counted wrong tap, hint counted once, portrait 768 × 1024 cells at least 100, finish, one sticker; the second run after softening the tuft art, screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=mossy-path FINGER_LEVELS=11` PASS (school, 15.8 s); game-reviewer found no blocking defects.
**Not run:** offline, `world` and other suites (the tier needed none); no phone-width (390 wide) screenshot (Mossy Path is not marked upright, so phones play it landscape).

## 2026-11-10 — Number Trails level 4, First numbers (PR #1479)

**Changed:** `number-trails` level 4 for preschool (1, 2, 3, 7 in one stroke each, a wide 0.1 trail, things appear by themselves; order 4, 1, 2; saved 4 lands on pre-K's level 2); level-scoped how-to lines; new rule tests.
**Ran:** typecheck; `npm test` (345 files, 6551 passed, 1 skipped); `BROWSER_SUITE=numbertrails` (levels 1, 4, 3; level 4 drew 3, traced, three things, sticker; screenshot reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-trails FINGER_LEVELS=4` (5.0 s).
**Not run:** build (no shared files or assets changed), other suites, offline. Slice 3 (the HWT chart check) was not done: the chart is an image-only PDF.

## 2026-11-10 — Upright shell slice 3, the rest of the root's scenes (chunk 31, PR #1480)

**Changed:** creature play, the library, the project pages, the locations and lap/toddler Explore (Little surprises' sheet, Make my mix's table) lay out on the 768 × 1024 area; `playLayout`, `projectLayout`, `sheetPlaces` and `tableLayout` take a narrow view; `LandScene`'s heading stays between Back and the book.
**Ran:** typecheck; `npm test` (345 files, 6560 passed, 1 skipped; my-mix tests 15/15 re-run after a last sheet tweak); build; one scripted Chromium touch pass at 390 × 844 (toddler profile): creature play, library, a project page, Rainbow Meadow, toddler Explore, the mix table and the sheet each upright (768 wide), no turn prompt, one screenshot each, no page errors.
**Not run:** `phonefit` and `home` browser suites (no scene they assert changed), `world` (no navigation change), offline (no persistence, manifest or asset change). The welcome ending page is proved by unit tests only, not shot.

## 2026-11-10 — TotoLogic reviewed (docs only)

**Changed:** new [reference review](../TOTOLOGIC.md) of the TotoLogic children's app against the island's rules, with six proposals (P1–P6) and a short section on the unrelated Totologic blog; a pointer in IDEAS, a reference note in the grown-ups' page definition and a row in the Rainbow Fingers dive's similar-games table.
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** code checks (docs only; nothing built). The app itself was not installed or played: only its site, store listing, policies and three web demo puzzles were opened.

## 2026-11-10 — Pok Pok reviewed (docs only)

**Changed:** new [reference review](../POK-POK.md) of the Pok Pok children's app against the island's rules, with eight proposals (P1–P8); a pointer in IDEAS and one row each in the programming, cooking, ecosystems and music studies' similar-games tables (their counts updated). The proposals were then put on the backlog at the developer's request: a Pok Pok group of four lines in READY (P1, P4, P3's definition, P5's pilot), two questions added to the phone playtest list (P2, P3), a put-down acceptance line in RW10 (P6) and a stepped-wobble note in RW14's later list (P8).
**Ran:** `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** code checks (docs only; nothing built). The app itself was not installed or played: only public pages were read, so its sound, motion and feel are unknown. P1's finding (red is the low note in Jelly Drums and the high row in Song Maker) was read from the two games' source, not played.

## 2026-11-10 — U7c, quicker taps on the tablet root (PR #1484)

**Changed:** Home, Explore, Arcade, Library and creature play use `WayOut` for navigation. The first picture stays pressed with a white ring, the others dim, and its line can play through the change. The Friends nest opens after the shared beat with a cheer in place of the longer walk. Existing transition styles and route origins are preserved.

**Measured:** three speech-off Chromium runs at 1024 × 768 (DPR 2) per route. Median tap to change start / first frame / settled was 945 / 1,051 / 1,987 ms before and 230 / 347 / 855 ms after for Home → Explore. Explore → Arcade was 1,309 / 1,441 / 2,031 ms before (lap profile) and 202 / 357 / 1,026 ms after (toddler profile). The Arcade's median settled time was 26 ms above the target. The timings include headless rendering and Vite dev serving.

**Ran:** typecheck, lint, format, build, the U7 timing probe and a focused repeat with the final crossfades. The main `home` flow passed, including a press on Arcade followed immediately by Favorites that kept Arcade selected, and `HOME_ONLY=arcade` passed the spotlight, Play, and return flow. `npm test` passed 6,562 tests with 5 skipped and one timing failure in the unchanged Secret Code generator (256 ms against 250 ms). All 24 Secret Code tests passed in the isolated rerun.

**Not run:** `world`, `phonefit`, other browser suites and offline.

## 2026-11-10 — Festival Signals (H4) definition (docs only)

**Changed:** new [definition](../definitions/festival-signals.md) of Sorting Machine levels 8–9 (*Festival Signals*, *Fix the lantern*) in two build slices (H3 level 3, then H5 levels 8–9); the study, base definition, batch plans, READY and the study backlog point to it.
**Ran:** a scratch script enumerated the proposed four-slot grammar (2,005,696 fillings): 24 accepted machines, all four parts long with the lantern on slot 4, eight of them keeping P OR Q in slot 1; `node scripts/check-links.mjs`; `git diff --check`.
**Not run:** typecheck, unit tests, build and browser suites (nothing built).

## 2026-11-10 — Number Trails level 5, Write how many (PR #1482)

**Changed:** `number-trails` level 5 for pre-K (order 2, 3, 5): count a group of 0–9 (an empty pail for zero), pick the numeral card that tells how many (count, neighbour, a reversal-prone digit), then trace it; a wrong card is a miss with a recount, the second glows the right card (one hint); four voice lines, level-scoped how-to lines, the bot counts, picks and traces.
**Ran:** typecheck; `npm test` (345 files, 6556 passed, 1 skipped; 8 failures outside this game: `lint-config` needs `eslint`, missing from this worktree's install, and seven search/timing tests in other games that all pass when re-run alone); `BROWSER_SUITE=numbertrails` (levels 1, 4, 3 and 5: count of 8, two wrong cards giving misses 2 and hints 1 with the glow, the right card tapped mid-recount, the trace, sticker; a zero round in portrait; screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-trails FINGER_LEVELS=5` (11.6 s); `game-reviewer` read the diff (two gaps fixed: the right card now works during the recount, zero shows its cards at once).
**Not run:** build (no shared files or assets changed), other suites, offline.

## 2026-11-10 — Number Trails level 6, Less help each time (PR #1490)

**Changed:** `number-trails` level 6 for pre-K (order 2, 3, 5, 6): one numeral traced three times with the guide fading (solid, dotted, start-only); a wander brings the solid trail back for the stroke; at most one hint per try; shared guide helpers in `src/learning/tracing/feedback.ts`; two voice lines; level-scoped how-to lines.
**Ran:** typecheck; `npm test` (345 files, 6583 passed, 1 skipped; six new level-6 rule tests); `BROWSER_SUITE=numbertrails` (levels 1, 4, 3, 5 and 6: numeral 7 three times in portrait, one wander on the dotted try gave misses 1, hints 0 and the solid trail back, things only after the third try, sticker; dotted and start-only screenshots reviewed); `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-trails FINGER_LEVELS=6` (23.8 s).
**Not run:** build (CI runs it; the only shared change is additive exports), other suites, offline.
