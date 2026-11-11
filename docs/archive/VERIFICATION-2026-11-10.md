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
