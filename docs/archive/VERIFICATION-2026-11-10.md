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
