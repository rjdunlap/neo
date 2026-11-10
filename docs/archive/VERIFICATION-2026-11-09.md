# Verification 2026-11-09 (archived entries)

## 2026-11-09 — Number Nook slice 6: level 7 The fifteen (PR #1432)

The seeded 4×4 starts exactly 30 slides from the goal. A 60,000-node exact search gives way to a route through the top row, left column and remaining 3×3. Tested `d3e8d3ca` plus the working diff.
Typecheck, build, scoped ESLint and Prettier, catalog generation and 22 Number Nook tests passed. The tests cover 25 exact starts, 90 detours that preserve completed borders, a hard fixture under 350 ms, and 87-unit upright and 102-unit sideways cells.
At `GAME_URL=http://localhost:5199`, `BROWSER_SUITE=numbernook NOOK_LEVELS=7` passed the refused tap, line slide, Undo and Start over, a 60-move detour, truthful fallback speech, one counted hint across two requests and one sticker. Reviewed the 768×1024 portrait. `BROWSER_SUITE=fingerdemo FINGER_ONLY=number-nook FINGER_LEVELS=7` passed in 43.3 s.
PR CI caught a 843-character how-to card above the 840-character limit. Shortened two level 7 steps; focused how-to, catalog and barrel tests passed (25 passed, one skipped). The shared `howto` browser suite stopped at its unrelated controller count (23 expected, 26 found). An isolated probe confirmed the level 7 card, demo and 104/124-unit buttons fit in both orientations.
Fresh game review found no blocking issue. Offline and real-device touch and speech were not run.

## 2026-11-09 — Jar Sort slices 4–5: levels 11 and 12 (PR #1433)

Level 11 uses three cups and an exact picture goal. Level 12 moves the matching run at the top of a jar, up to the receiving jar's capacity. Tested `a4095493` plus the working diff.
Typecheck, 17 Jar Sort rules, the full unit suite (329 files, 6307 passed, 5 skipped), scoped formatting and lint, link checks and build passed. An independent exact search agreed on the shortest length of all 36 new puzzles.
At `GAME_URL=http://localhost:5193`, `BROWSER_SUITE=jarsort JAR_SORT_LEVELS=11,12` passed two full-cup refusals and one hint, both picture boards, a full run moved in one action, undo and one sticker per round. Reviewed the 768×1024 level 11 portrait.
`BROWSER_SUITE=fingerdemo FINGER_ONLY=jar-sort FINGER_LEVELS=11,12 FINGER_BAND=school` finished in 12.9 and 31.0 demo seconds. The new voice lines describe only the on-screen rules and use device speech. Offline, iPad touch and speech, and child play were outside the checks run.

## 2026-11-09 — Daily playtest slice: a phone is Today's six alone (PR #1434)

On a phone the root opens Today's six instead of Home; the hatch lays out upright; the six page uses the width upright and re-picks on a turn; Play all and a next-of-six tile on a daily round's result; a grown-up's playtest notes (`SaveData.playtest`, a plain-HTML sheet, copy as text); a manifest shortcut to `?daily`. Tested `a4095493` plus the working diff.
Typecheck and build passed. `npm test`: 330 files and 6,319 tests passed; `scripts/lint-config.test.mjs` could not load `eslint` in this worktree's `node_modules` (left to PR CI). New tests cover the notes' repair and bounds, `nextOfSix`, `phoneSized`, the save field and the hatch's narrow layout.
At `GAME_URL=http://localhost:5187`, `BROWSER_SUITE=phonefit` passed with its upright root pass changed for the phone-only root: the chooser opens the six, no All games, Play all and the pencil are there, a card is at least 110 px wide (was about 75), the result offers the next of the six, and a note saves. By hand in the app's browser pane at 390 × 844: a new player's hatch with no turn prompt, the six page, Play all into Number Nook, the result's next tile into Word Search, a note saved, and a turn re-picking the six. The offline check passed against the served build (on all interfaces; `vite preview` on `localhost` alone refused `127.0.0.1`).
Not run: a real phone (touch emulation only; a sideways width of 844 is not touch-emulated in the pane, so the sideways phone root was not seen), the clipboard on iOS, `home`, `world`. The spoken `daily.done` line still mentions the tiles button a phone no longer draws.

## 2026-11-09 — Lift It slices 4–5, Three ropes (PR #1437)

At school levels 7 and 8, hang both wheels and tap the crate ring to move the tied end and pull up with three supporting strands. Level 8 adds exact paws and knots cards. Tested `f5e21a28` plus the working diff; checked the ideal pulley rule against [OpenStax Physics 9.3](https://openstax.org/books/physics/pages/9-3-simple-machines).
Typecheck, build, link and diff checks, scoped ESLint and Prettier, and 223 focused game and content tests passed (1 skipped). The 34 Lift It rules cover 500 seeds, exact cards, fallback rounds and 100-unit ring clearance at 768×1024 and 1024×768. An earlier full local run caught a landscape overlap since corrected and an unrelated Bolt Boards timing failure that passed in isolation.
`BROWSER_SUITE=liftit FROM_LEVEL=7` passed a failed tug, a repeat counted once, one hint and a sticker. Reviewed the 768×1024 portrait with three separate strands. `FROM_LEVEL=8` passed the two-paw and nine-knot cards, one wrong card and a sticker. Filtered `fingerdemo` finished levels 7 and 8 in 66.4 and 62.5 demo seconds.
Open checks are real iPad play and device speech. The offline suite and older Lift It browser levels were outside this pass.

## 2026-11-09 — Marble Jump slice 4: level 9 A bigger triangle (PR #1428)

Changed: level 9, a six-row 21-hole triangle (20 marbles, all 21 starts clear), range 1–9; a closer-packed `boardLayout` (hit circles still 78 across); a frozen `BIG_FEWEST` table for the fewest-moves line; recovery cost measured (worst cold dead-end check about 5,000 boards, 2 ms).
Ran: `npm run typecheck`; `npm test` (331 files, 6328 passed; a first run under load had 8 timeouts, a clean rerun passed); `BROWSER_SUITE=marblejump` (adds level 9 at 1024×768 and 768×1024: bottom row above the buttons, one miss, one hint, finish with the moves line, one sticker; two screenshots); `fingerdemo` with `FINGER_ONLY=marble-jump FINGER_LEVELS=9` (45.1 s); `npm run build`.
Not run: offline. The `marble.go9` line is not rendered as a clip; device speech and enjoyment open.
